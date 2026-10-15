import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  DepthGroup,
  Dolphin,
  DynamicCable,
  depthDistM,
  fogHex,
  GhostLine,
  OCEAN,
  OceanStage,
  PLATFORM,
  SCENE_BC,
  Whale,
  cableWidths,
  ghostStrand,
  smoothClosed,
  hash01,
  smoothOpen,
  InFog,
  STROKE_PX,
  fogAt,
  clamp01,
  lerp,
  makeView,
  platformPoint,
  project,
  smoothstep,
  useOcean,
  type Cam,
  type CablePoint,
  type GhostLineProps,
  type OceanView,
} from "./oceanShared";
import { CABLE } from "./OceanFrames";

/**
 * GhostLines — Cheeky Pint S4E02 (Will O'Brien, Ulysses), delivered as 15_GhostLines.mov.
 * 1080x1920, opaque, 24000/1001 fps, 184 frames of content + 16 tail.
 *
 * Check line: after this cut the viewer can say "The power cables hanging from floating wind turbines
 * snag drifting ghost fishing line, and that line then traps dolphins and whales."
 *
 * The motion: one descent. It opens on an over/under split: a floating wind turbine above the
 * waterline (tower, nacelle, three turning blades on its three-column floater), its floater,
 * moorings and export cable below. The camera dips through the waterline and follows the cable down
 * its lazy wave to the buoyant hump. A torn, flattened piece of ghost net (floats on its head rope,
 * long monofilament lines) drifts in from off-frame left on the current, tumbling slowly; its dangling
 * line lands on the cable and coils round it; the current carries the net over the top of the cable
 * and it streams downstream, floats up. A dolphin swims into it; the net takes its tail stock, the
 * line snaps taut and the dolphin thrashes against it (lunges, snaps, jerks back, head turning back),
 * weakening but never still. A humpback, net and line wrapped on its tail stock, glides in from the
 * upper right behind the cable and levels off above it. Settled, living end frame. No amber.
 *
 *   f   | words                          | picture
 *   0   | put these power cables         | over/under: turbine above, floater + cable below; blades turn
 *   10  | (cables f11, in f16)           | the dome waterline sweeps up and out; we are under the surface
 *   23  | the water f21                  | down the cable's hang-off, zooming in toward the hump
 *   35  | they attract f30-32            | the net enters from the left edge, carried on the current
 *   41  | abandoned f41                  | it drifts toward the cable, tumbling slowly, its line dangling
 *   56  | fishing lines f55-64           | CONTACT: the dangling line lands on the cable (f55-56); coils f56-66
 *   57-86 | The fishing lines f75-83     | the net goes over the top and streams downstream, floats up
 *   84  | then f89                       | the dolphin's nose enters from the left edge, swimming right
 *   106 | catch f106                     | CATCH: its tail stock passes into the net; the line snaps taut f108
 *   108-200 | dolphins f115              | caught: thrash cycle (19 -> 27 f), the net gathered on the tail
 *   115-165 | and whales f138-148        | the entangled humpback glides in from the upper right (head f115,
 *           |                            | readable by f145, whole ~f152), levels off above the cable
 *   122-200 | and these sorts of things  | camera eases back, then keeps a slow drift to the end (cut f184)
 */
export const FPS = 24000 / 1001;
export const DURATION = 200;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// =============================================================================================
// THE SNAG — exported for cut C (CableInspection). See scratchpad B/SNAG.md.
// =============================================================================================
export { CABLE };
/** Where the ghost gear is caught: arc length 0..1 along CABLE, on the hump just past its top, midway
 *  between the 5th and 6th buoyancy modules (bare cable either side, so the tangle reads). */
export const SNAG_S = (CABLE.collarS[4] + CABLE.collarS[5]) / 2;
export const snagPoint = (): CablePoint => CABLE.at(SNAG_S);
/** The fixed GhostLine props of the snag (no animals). */
export const SNAG_GHOST = {
  seed: 3,
  length: 24,
  strands: 3,
  net: { w: 13, h: 12 },
  netAt: 0.86,
  current: { x: 1, y: 0.45 },
} as const;
/** Two shorter tangles either side of the first (no net): the snag reads as a knot of wrapped line,
 *  not one loop. `along` = offset along the cable from the first (local px, + = toward the touchdown). */
export const SNAG_GHOST_2 = { seed: 7, length: 15, strands: 2, net: null, current: { x: 1, y: 0.45 }, along: 3.4 } as const;
export const SNAG_GHOST_3 = { seed: 11, length: 10, strands: 2, net: null, current: { x: 1, y: 0.45 }, along: -3.1 } as const;

/**
 * SnaggedGhostLine — the ghost gear caught on CABLE at SNAG_S. Draw inside <DepthGroup z={CABLE.z}>:
 * layer="back" BEFORE <DynamicCable cable={CABLE} />, layer="front" AFTER it. Defaults = the settled
 * snag (wrap 1, trailing downstream on the current). GhostLines animates it through the optional
 * props (anchor/current/wrap during the catch; to/tie for the dolphin).
 */
export const SnaggedGhostLine: React.FC<{
  frame: number;
  layer?: "back" | "front" | "all";
  cableW?: number;
  wrap?: number;
  /** the leading end while the gear is still drifting in (default: the snag point) */
  anchor?: { x: number; y: number };
  /** the direction the free gear streams (default SNAG_GHOST.current) */
  current?: { x: number; y: number };
  to?: { x: number; y: number } | null;
  tie?: number;
}> = ({ frame, layer = "all", cableW, wrap = 1, anchor, current, to = null, tie = 0 }) => {
  const o = useOcean();
  const cw = cableW ?? cableWidths(o, CABLE).w;
  const A = CABLE.at(SNAG_S);
  const a0 = anchor ?? { x: A.x, y: A.y };
  const tan = { x: A.tx, y: A.ty };
  const cur = current ?? SNAG_GHOST.current;
  const main: GhostLineProps = { ...SNAG_GHOST, net: SNAG_GHOST.net, anchor: a0, tangent: tan, cableW: cw, wrap, frame, current: cur, to, tie, layer };
  const a2 = { x: a0.x + tan.x * SNAG_GHOST_2.along, y: a0.y + tan.y * SNAG_GHOST_2.along };
  const second: GhostLineProps = { ...SNAG_GHOST_2, anchor: a2, tangent: tan, cableW: cw, wrap: clamp01(wrap * 1.15 - 0.15), frame: frame + 13, current: cur, layer };
  const a3 = { x: a0.x + tan.x * SNAG_GHOST_3.along, y: a0.y + tan.y * SNAG_GHOST_3.along };
  const third: GhostLineProps = { ...SNAG_GHOST_3, anchor: a3, tangent: tan, cableW: cw, wrap: clamp01(wrap * 1.3 - 0.3), frame: frame + 29, current: cur, layer };
  return (
    <>
      <GhostLine {...third} />
      <GhostLine {...second} />
      <GhostLine {...main} />
    </>
  );
};

// =============================================================================================
// TIMING
// =============================================================================================
const T0 = 400; // stage clock offset (snow / rays / ripples)
const A = CABLE.at(SNAG_S);
const PLAT = { x: 0, y: 0 };
const S_Z = 750 / (750 - CABLE.z); // depth scale of the cable/turbine plane (z = +200)

const F_CONTACT = 54; // the net's coil lands on the cable ("fishing lines" f55)
const F_WRAP_END = 62;
const SWING = [56, 68] as const; // the current swings the net downstream about the snag (12 f)
const F_GEAR_ON = 22; // first frame drawn (fully off-frame then; checked)
const F_TANGLE = 64; // piece 2 lands on the same spot (from the right)
const F_ROPE = 72; // piece 3 catches under it (from the lower left)
const F_TANGLE_ON = 40;
const F_ROPE_ON = 44;
const F_CATCH = 106;

// =============================================================================================
// CAMERA — a keyed focus track (a point on the cable plane, where it sits on screen, zoom, tilt),
// monotone-cubic between keys, then the house damped follower (CAM_STIFF / CAM_DAMP) on x, y, ln k
// and the horizon. Full precision throughout.
// =============================================================================================
type Key = { f: number; s: number; ox: number; oy: number; sx: number; sy: number; k: number; hor: number };
/** a key that puts the EYE at world y `eyeY` (sets how deep the lens is: the over/under, the dip) */
const keyEye = (f: number, eyeY: number, fx: number, sx: number, sy: number, k: number, hor: number): Key => {
  const fy = eyeY - (hor - 960) / k + (sy - hor - S_Z * (960 - hor)) / (S_Z * k);
  return { f, s: SNAG_S, ox: fx - A.x, oy: fy - A.y, sx, sy, k, hor };
};
const KEYS: Key[] = [
  // over/under: the turbine column's waterline (360, 0) at screen (540, 1265)
  { f: 0, s: SNAG_S, ox: 360 - A.x, oy: 0 - A.y, sx: 540, sy: 1265, k: 0.45, hor: 1262 },
  // "power cables": the camera leans in toward the cable, the lens still at the waterline
  keyEye(7, -4, 300, 540, 1250, 0.56, 1262),
  // the dip: through the surface in ~2 f, then fast down and in, so the surface's glare is gone by f14
  keyEye(10, 70, 230, 540, 1220, 0.95, 1250),
  keyEye(14, 270, A.x + 40, 540, 1100, 2.6, 1225),
  // the hump: the gathering (the cable holds still; only the camera moves)
  { f: 29, s: SNAG_S, ox: 0, oy: 0, sx: 340, sy: 640, k: 8.0, hor: 1196 },
  { f: 60, s: SNAG_S, ox: 0, oy: 0, sx: 338, sy: 620, k: 8.1, hor: 1190 },
  { f: 78, s: SNAG_S, ox: 0, oy: 0, sx: 340, sy: 590, k: 8.6, hor: 1186 },
  // push in: the caught dolphin big (~40% of the frame width)
  { f: 102, s: SNAG_S, ox: 0, oy: 0, sx: 386, sy: 500, k: 10.4, hor: 1180 },
  { f: 132, s: SNAG_S, ox: 0, oy: 0, sx: 386, sy: 496, k: 10.42, hor: 1180 },
  { f: 240, s: SNAG_S, ox: 0, oy: 0, sx: 386, sy: 496, k: 10.42, hor: 1180 },
];
/** Monotone cubic (Fritsch-Carlson) through (x, y) keys, flat at both ends. */
const monotone = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => (i === 0 || i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
const ch = (pick: (k: Key) => number) => monotone(KEYS.map((k) => k.f), KEYS.map(pick));
const kS = ch((k) => k.s);
const kOX = ch((k) => k.ox);
const kOY = ch((k) => k.oy);
const kSX = ch((k) => k.sx);
const kSY = ch((k) => k.sy);
const kLK = ch((k) => Math.log(k.k));
const kHOR = ch((k) => k.hor);
/** The camera centre that puts world point (x, y) on the cable plane at screen (sx, sy). */
const aim = (x: number, y: number, sx: number, sy: number, k: number, hor: number): Cam => ({
  x: x - (sx - 540) / (S_Z * k),
  y: y - (sy - hor - S_Z * (960 - hor)) / (S_Z * k),
  k,
});
type CamH = Cam & { hor: number };
/** The focus channels at a frame (before the follower). */
const focusTarget = (f: number) => {
  const p = CABLE.at(kS(f));
  return { fx: p.x + kOX(f), fy: p.y + kOY(f), sx: kSX(f), sy: kSY(f), lk: kLK(f), hor: kHOR(f) };
};
type Focus = ReturnType<typeof focusTarget>;
/** The damped follower runs on the FOCUS channels (the point, its screen anchor, ln k, the tilt), so a
 *  lagging zoom never lets the subject drift off its anchor. */
/** the dive is keyed directly (no lag: the lens must clear the surface fast); the follower takes over after */
const F_DIRECT = 24;
const TRACK: CamH[] = (() => {
  const keys = Object.keys(focusTarget(0)) as (keyof Focus)[];
  const out: CamH[] = [];
  let c = focusTarget(0);
  const v: Focus = { fx: 0, fy: 0, sx: 0, sy: 0, lk: 0, hor: 0 };
  for (let f = 0; f <= DURATION + 2; f++) {
    if (f > 0 && f <= F_DIRECT) {
      const t = focusTarget(f);
      for (const k of keys) v[k] = t[k] - c[k];
      c = t;
    } else if (f > 0) {
      const t = focusTarget(f);
      const n = { ...c };
      for (const k of keys) {
        v[k] = v[k] + (t[k] - c[k]) * CAM_STIFF - v[k] * CAM_DAMP;
        n[k] = c[k] + v[k];
      }
      c = n;
    }
    out.push({ ...aim(c.fx, c.fy, c.sx, c.sy, Math.exp(c.lk), c.hor), hor: c.hor });
  }
  return out;
})();
/** the whale's plane and its tail stock once it is held (see THE WHALE; kept in step by hand) */
const WHALE_Z_CAM = -600;
const WHALE_FOCUS = { x: -84, y: 618 } as const;
/** The camera centre that puts world point (x, y) at depth z at screen (sx, sy). */
const aimZ = (x: number, y: number, z: number, sx: number, sy: number, k: number, hor: number): Cam => {
  const sz = 750 / (750 - z);
  return { x: x - (sx - 540) / (sz * k), y: y - (sy - hor - sz * (960 - hor)) / (sz * k), k };
};
/** f130-158: one move down the hanging line from the dolphin to the whale's tail stock (eased), which then
 *  holds at the true middle with a slow push. Blended from the cluster track to the whale aim. */
const W_TRAVEL = [128, 158] as const;
const END_EASE = [164, 192] as const;
const END_CAM = { x: -54, y: 484, k: 8.2 } as const;
const camWhale = (f: number): CamH => {
  const k = lerp(7.6, 7.95, smoothstep((f - W_TRAVEL[1]) / 50));
  return { ...aimZ(WHALE_FOCUS.x, WHALE_FOCUS.y, WHALE_Z_CAM, 380, 900, k, 1180), hor: 1180 };
};
const FINAL: CamH[] = TRACK.map((c, f) => {
  const w = smoothstep((f - W_TRAVEL[0]) / (W_TRAVEL[1] - W_TRAVEL[0]));
  if (w <= 0) return c;
  const t = camWhale(f);
  const b = { x: lerp(c.x, t.x, w), y: lerp(c.y, t.y, w), k: Math.exp(lerp(Math.log(c.k), Math.log(t.k), w)), hor: lerp(c.hor, t.hor, w) };
  // "and these sorts of things": ease up along the line until the snarl and the dolphin are back in frame
  // above the captions, the whale still big below them: the whole chain in the last frame
  const e = smoothstep((f - END_EASE[0]) / (END_EASE[1] - END_EASE[0]));
  if (e <= 0) return b;
  const drift = Math.max(0, f - END_EASE[1]);
  const end = { x: END_CAM.x, y: END_CAM.y + 0.15 * drift, k: END_CAM.k * (1 + 0.002 * drift), hor: 1180 };
  return { x: lerp(b.x, end.x, e), y: lerp(b.y, end.y, e), k: Math.exp(lerp(Math.log(b.k), Math.log(end.k), e)), hor: lerp(b.hor, end.hor, e) };
});
const camAt = (f: number): CamH => FINAL[Math.max(0, Math.min(FINAL.length - 1, f))];
/** Snow / ray parallax origin: near the snag at the close zoom (the camera spends most of the cut there). */
const REST: Cam = { x: TRACK[110].x, y: TRACK[110].y, k: TRACK[110].k };
const swayAt = (T: number) => ({ x: 3 * Math.sin(T / 23), y: 5 * Math.sin(T / 19) }); // = OceanStage's sway
const viewAt = (f: number): OceanView => {
  const c = camAt(f);
  return makeView({ frame: T0 + f, cam: c, scene: SCENE_BC, horizon: c.hor, sway: swayAt(T0 + f) });
};

// =============================================================================================
// THE GHOST GEAR — drawn here (variants of the module's GhostLine for FREE pieces). Three pieces
// collect at one spot on the cable (one snarl):
//   1. a big torn net panel with a float line along its head rope (floats spaced out) and a coil of
//      monofilament above its upstream corner; it rises in from the lower left (its floats lift it),
//      the coil lands on the cable (contact F_CONTACT) and wraps; the net swings downstream below.
//   2. a thick coil of line from the right, above the cable (contact F_TANGLE), pressed on top.
//   3. a frayed rope with a float rising from the lower left (contact F_ROPE), looped over the cable.
// A long line from the snarl streams down and back into the haze: the whale is caught on it.
// =============================================================================================
type P = { x: number; y: number };
const rot2 = (v: P, a: number): P => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
const add = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
const polar = (r: number, a: number): P => ({ x: r * Math.cos(a), y: r * Math.sin(a) });
const norm = (x: number, y: number): P => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};
const lastDir = (pts: P[]) => {
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  return Math.atan2(b.y - a.y, b.x - a.x);
};
const PANEL = { w: 34, h: 15, cols: 12, rows: 7 } as const;
/** the tie point: the head rope's upstream end (top-left node; the body lies right of it and below) */
const PANEL_K = { i: 0, j: 0 } as const;
const NET_FLOATS = [-0.38, -0.13, 0.12, 0.37];
const NET_DIR = norm(0.45, -0.9); // rises in from the lower left
const NET_V = 4.6;
/** the tie corner relative to the coil (the line's end) before contact, and relative to the snag once settled */
const K_FROM_COIL = { x: -3, y: 12.5 } as const;
const K_SETTLED = { x: 4.5, y: 13.4 } as const;
type Gear = { T: P; K: P; rot: number; sq: number; bunch: number; line: number; wrap: number; stream: number };
const settledGear = (f: number): Gear => {
  const K = { x: A.x + K_SETTLED.x + 0.5 * Math.sin(f * 0.045), y: A.y + K_SETTLED.y + 0.3 * Math.sin(f * 0.05 + 1) };
  return {
    T: { x: A.x, y: A.y },
    K,
    rot: 0.06 + 0.04 * Math.sin(f * 0.04 + 0.4),
    sq: 0.95 - 0.03 * Math.sin(f * 0.05),
    bunch: 0,
    line: Math.hypot(K_SETTLED.x, K_SETTLED.y) + 0.8,
    wrap: 1,
    stream: Math.atan2(0.25, 1) + 0.08 * Math.sin(f * 0.037),
  };
};
const gearFree = (f: number): Gear => {
  const d = Math.max(0, F_CONTACT - f) * NET_V;
  const Tpre = { x: A.x - NET_DIR.x * d, y: A.y - NET_DIR.y * d };
  const rotPre = 0.03 * Math.sin(f * 0.05);
  const sqPre = 0.9 + 0.07 * Math.cos(f * 0.055 + 0.5);
  const sway = { x: 0.6 * Math.sin(f * 0.07), y: 0 };
  if (f <= F_CONTACT) {
    return { T: Tpre, K: add(add(Tpre, K_FROM_COIL), sway), rot: rotPre, sq: sqPre, bunch: 0, line: Math.hypot(K_FROM_COIL.x, K_FROM_COIL.y) + 0.6, wrap: 0, stream: Math.atan2(0.5, -1) };
  }
  const st = settledGear(f);
  // the current carries the net downstream about the snag: a slow swing over SWING frames
  const e = smoothstep((f - SWING[0]) / (SWING[1] - SWING[0]));
  const k0 = add(add(A, K_FROM_COIL), { x: 0.6 * Math.sin(F_CONTACT * 0.07), y: 0 });
  return {
    T: { x: A.x, y: A.y },
    K: { x: lerp(k0.x, st.K.x, e), y: lerp(k0.y, st.K.y, e) },
    rot: lerp(0.03 * Math.sin(F_CONTACT * 0.05), st.rot, e),
    sq: lerp(0.9 + 0.07 * Math.cos(F_CONTACT * 0.055 + 0.5), st.sq, e),
    bunch: 0,
    line: lerp(Math.hypot(K_FROM_COIL.x, K_FROM_COIL.y) + 0.6, st.line, e),
    wrap: clamp01((f - F_CONTACT) / (F_WRAP_END - F_CONTACT)),
    stream: lerp(Math.atan2(0.5, -1), st.stream, e),
  };
};
/** a panel node in the panel's own frame (x across, y down), before the attach shift and rotation */
const panelLocal = (i: number, j: number, w: number, h: number, cols: number, rows: number, sq: number, bunch: number, t: number, seed: number, wavy = true): P => {
  const u = (i + (j % 2) * 0.5) / cols - 0.5;
  const v = j / (rows - 1);
  const jit = wavy ? (hash01(seed + i * 3.1 + j * 7.7) - 0.5) * 0.16 : 0;
  const pinch = 1 - bunch * 0.55 * Math.sin(Math.PI * Math.min(1, v * 1.2));
  const billow = wavy ? Math.sin(u * 4.2 + t * 0.05 + v * 1.7) * 0.06 + Math.sin(u * 9 - t * 0.03) * 0.02 : 0;
  return { x: (u + jit / cols) * w * sq * pinch, y: v * h * (0.94 + 0.08 * Math.cos(u * 3.1)) + billow * h };
};
/** NetPanel — a torn, flattened piece of diamond-mesh net (the module's twine / float tokens). Node
 *  (ai, aj) sits exactly at `k` (where a line ties on; never torn). `sq` = signed width (it turns over
 *  about its vertical axis), `bunch` gathers it (wrapped round a body). Raw paths: wrap it in <InFog>. */
const NetPanel: React.FC<{ k: P; ai: number; aj: number; w: number; h: number; cols?: number; rows?: number; rot: number; sq: number; bunch?: number; frame: number; seed: number; floats?: number[]; weight?: number }> = ({
  k,
  ai,
  aj,
  w,
  h,
  cols = 10,
  rows = 7,
  rot,
  sq,
  bunch = 0,
  frame,
  seed,
  floats = [-0.42, -0.16],
  weight = 1,
}) => {
  const o = useOcean();
  const uid = `gln${seed}`;
  const al = panelLocal(ai, aj, w, h, cols, rows, sq, bunch, frame, seed);
  const node = (i: number, j: number): P => {
    const l = panelLocal(i, j, w, h, cols, rows, sq, bunch, frame, seed);
    return add(k, rot2({ x: l.x - al.x, y: l.y - al.y }, rot));
  };
  const keep = (i: number) => i === ai || i === ai - 1;
  const lastRow = (i: number) => (keep(i) ? rows - 1 : rows - 1 - Math.floor(hash01(seed + i * 5.3) * 2.6));
  const segs: string[] = [];
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i <= cols; i++) {
      if (j >= lastRow(i)) continue;
      const a = node(i, j);
      const nb = j % 2 === 0 ? [i - 1, i] : [i, i + 1];
      nb.forEach((ii, q) => {
        if (ii < 0 || ii > cols || j + 1 > lastRow(ii)) return;
        if (!keep(i) && !keep(ii) && hash01(seed + i * 11.3 + j * 3.7 + q * 1.9) < 0.06 + 0.16 * (j / rows)) return; // torn meshes
        const b = node(ii, j + 1);
        segs.push(`M${f3(a.x)} ${f3(a.y)}L${f3(b.x)} ${f3(b.y)}`);
      });
    }
  }
  const tw = Math.max((STROKE_PX.twine * 1.25 * weight) / o.a, w * 0.005);
  const rope = Array.from({ length: cols + 1 }, (_, i) => node(i, 0));
  const fr = Math.max(w * 0.045, 7 / o.a);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}f`} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor={OCEAN.cream} />
          <stop offset="0.45" stopColor={OCEAN.float} />
          <stop offset="1" stopColor="#6B6252" />
        </radialGradient>
      </defs>
      <path d={segs.join("")} fill="none" stroke={OCEAN.twine} strokeWidth={f3(tw)} strokeLinecap="round" opacity={0.95} />
      <path d={smoothOpen(rope)} fill="none" stroke={OCEAN.twine} strokeWidth={f3(tw * 2.4)} strokeLinecap="round" />
      {floats.map((fu, n) => {
        const i = Math.round((fu * Math.sign(sq || 1) + 0.5) * cols);
        const q = node(i, 0);
        return <ellipse key={n} cx={q.x} cy={q.y - fr * 0.3} rx={fr * 1.25} ry={fr} fill={`url(#${uid}f)`} />;
      })}
    </g>
  );
};
/** A monofilament line through points (screen-px width); raw path, wrap in <InFog>. */
const Mono: React.FC<{ pts: P[]; w?: number; op?: number }> = ({ pts, w = STROKE_PX.mono * 1.2, op = 0.85 }) => {
  const o = useOcean();
  return <path d={smoothOpen(pts)} fill="none" stroke={OCEAN.mono} strokeOpacity={op} strokeWidth={f3(w / o.a)} strokeLinecap="round" />;
};
/** A line of length `len` between two points: straight when taut, sagging (parabola, down) when slack. */
const sagLine = (a: P, b: P, len: number, t: number, wob = 1): P[] => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1e-6;
  const slack = Math.max(0, len - d);
  const sag = Math.sqrt((3 * d * slack) / 8);
  let n = { x: -(b.y - a.y) / d, y: (b.x - a.x) / d };
  if (n.y < 0) n = { x: -n.x, y: -n.y };
  return Array.from({ length: 13 }, (_, i) => {
    const u = i / 12;
    const s = 4 * u * (1 - u);
    const w = wob * Math.min(slack, 1.2) * 0.15 * Math.sin(u * 9 + t * 0.15) * s;
    return { x: lerp(a.x, b.x, u) + n.x * (sag * s + w), y: lerp(a.y, b.y, u) + n.y * (sag * s + w) };
  });
};


/** the panel's centre given its tie corner and pose */
const panelCentre = (g: Gear): P => {
  const kl = panelLocal(PANEL_K.i, PANEL_K.j, PANEL.w, PANEL.h, PANEL.cols, PANEL.rows, g.sq, g.bunch, 0, 3, false);
  const cl = panelLocal(PANEL.cols / 2, 3, PANEL.w, PANEL.h, PANEL.cols, PANEL.rows, g.sq, g.bunch, 0, 3, false);
  return add(g.K, rot2({ x: cl.x - kl.x, y: cl.y - kl.y }, g.rot));
};

// =============================================================================================
// THE DOLPHIN: cruises in from the left under the cable into the net; the net takes its tail stock.
// Then it is CAUGHT: it thrashes against the line — lunges that snap the line taut and jerk it back,
// strong body flexes, its head turning back toward the line, fast fluke beats that get it nowhere —
// weakening late but never still.
// =============================================================================================
const DOL_L = 28;
const PED_U = (0.5 - 0.86) * DOL_L; // the peduncle's local x (facing +1)
const DOL_V = 3.0; // local px / frame (~7 m/s: a dolphin swimming fast)
const TAU0 = 0.08; // cruising: nose a touch down
const CATCH_GEAR = settledGear(F_CATCH);
/** where the tail stock meets the net (the panel's centre at the catch) */
const CATCH_PED = panelCentre(CATCH_GEAR);
const R_PED_CATCH = Math.hypot(CATCH_PED.x - A.x, CATCH_PED.y - A.y);
const ANG_PED_CATCH = Math.atan2(CATCH_PED.y - A.y, CATCH_PED.x - A.x);
const F_TAUT = F_CATCH + 2; // the line snaps taut
/** thrash envelope: full through "dolphins" and "whales", weaker by the end but alive */
const thrashE = (f: number) => lerp(1, 0.6, smoothstep((f - 160) / 40));
/** the thrash cycle (frames per cycle grows as it tires) — integrated to a phase */
const CYCLE: number[] = (() => {
  const out: number[] = [];
  let ph = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(ph);
    if (f >= F_TAUT) ph += 1 / lerp(16, 24, smoothstep((f - F_TAUT) / 90));
  }
  return out;
})();
const cycAt = (f: number) => CYCLE[Math.max(0, Math.min(CYCLE.length - 1, f))];
/** 0 = line taut (end of a lunge), 1 = pulled back: lunge accelerates into the taut line, snaps, jerks back */
const tugShape = (p: number) => {
  if (p < 0.42) return 1 - Math.pow(p / 0.42, 2);
  if (p < 0.54) return 0.75 * (1 - Math.pow(1 - (p - 0.42) / 0.12, 2));
  return lerp(0.75, 1, smoothstep((p - 0.54) / 0.46));
};
/** fluke beats: fast while it lunges, slower while it gathers; integrated (cycles) */
const BEAT: number[] = (() => {
  const out: number[] = [];
  let ph = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(ph);
    let Pd = 22;
    if (f >= F_CATCH) {
      const p = cycAt(f) % 1;
      const lunging = p < 0.5 ? 1 : 0.4;
      Pd = lerp(22, lerp(12, 7, lunging * thrashE(f)), smoothstep((f - F_CATCH) / 4));
    }
    ph += 1 / Pd;
  }
  return out;
})();
const dolphinAt = (f: number) => {
  const h0 = { x: Math.cos(TAU0), y: Math.sin(TAU0) };
  const beat = BEAT[Math.max(0, Math.min(BEAT.length - 1, f))];
  if (f <= F_CATCH) {
    const ped = { x: CATCH_PED.x - h0.x * DOL_V * (F_CATCH - f), y: CATCH_PED.y - h0.y * DOL_V * (F_CATCH - f) };
    return { x: ped.x - h0.x * PED_U, y: ped.y - h0.y * PED_U, tilt: TAU0, ped, beat, amp: 0.045, bend: 0, gear: null as Gear | null };
  }
  const E = thrashE(f);
  const p = cycAt(f) % 1;
  const ease = smoothstep((f - F_CATCH) / 7);
  const rpTaut = R_PED_CATCH + 2.2;
  const rp = f < F_TAUT ? lerp(R_PED_CATCH, rpTaut, clamp01((f - F_CATCH) / (F_TAUT - F_CATCH))) : rpTaut - E * 1.5 * tugShape(p);
  const psi = lerp(ANG_PED_CATCH, 0.85, smoothstep((f - F_CATCH) / 22)) + E * 0.09 * Math.sin(2 * Math.PI * (cycAt(f) * 0.5));
  const ped = add(A, polar(rp, psi));
  const sq = lerp(CATCH_GEAR.sq, 0.42, ease);
  const bunch = ease * 0.85;
  const kl = panelLocal(PANEL_K.i, PANEL_K.j, PANEL.w, PANEL.h, PANEL.cols, PANEL.rows, sq, bunch, 0, 3, false);
  const cl = panelLocal(PANEL.cols / 2, 3, PANEL.w, PANEL.h, PANEL.cols, PANEL.rows, sq, bunch, 0, 3, false);
  const kc = { x: kl.x - cl.x, y: kl.y - cl.y };
  let rotT = psi + Math.PI - Math.atan2(kc.y, kc.x);
  while (rotT - CATCH_GEAR.rot > Math.PI) rotT -= 2 * Math.PI;
  while (rotT - CATCH_GEAR.rot < -Math.PI) rotT += 2 * Math.PI;
  const rot = lerp(CATCH_GEAR.rot, rotT, ease);
  const K = add(ped, rot2(kc, rot));
  const line = rpTaut - Math.hypot(kc.x, kc.y);
  const gear: Gear = { T: { x: A.x, y: A.y }, K, rot, sq, bunch, line: lerp(CATCH_GEAR.line, line, clamp01((f - F_CATCH) / (F_TAUT - F_CATCH))), wrap: 1, stream: CATCH_GEAR.stream };
  const lineAng = Math.atan2(ped.y - A.y, ped.x - A.x);
  const base = lerp(TAU0, lineAng - 0.3, smoothstep((f - F_CATCH) / 14));
  const headBack = p > 0.42 ? Math.sin(Math.PI * clamp01((p - 0.42) / 0.5)) : 0;
  const tilt = base - E * 0.5 * headBack + E * 0.08 * Math.sin(2 * Math.PI * p);
  const hd = { x: Math.cos(tilt), y: Math.sin(tilt) };
  const flexIn = smoothstep((f - F_CATCH) / 6);
  const bend = flexIn * E * (-0.24 * headBack + 0.14 * Math.sin(2 * Math.PI * p * 2));
  return { x: ped.x - hd.x * PED_U, y: ped.y - hd.y * PED_U, tilt, ped, beat, amp: lerp(0.045, 0.07 + 0.06 * E, flexIn), bend, gear };
};
const gearAt = (f: number): Gear => (f <= F_CATCH ? gearFree(f) : (dolphinAt(f).gear as Gear));
const F_DOLPHIN_ON = 76; // first frame drawn (fully off-frame left then: checked)

// =============================================================================================
// THE WHALE: deep in the haze along the bottom of the frame (below the caption bands), clearly bigger
// than the dolphin. It glides in from the left, the way it points; the long line streaming down from
// the snarl hangs across its path; ON "whales" (f148) the line catches its tail stock and wraps, snaps
// taut back to the snarl, and the whale is held: it strains on, beating hard, getting nowhere.
// =============================================================================================
const WHALE_L = 148;
const WHALE_Z = WHALE_Z_CAM; // depth (fog ~0.49)
const F_WCATCH = 148;
const WHALE_U_TIE = 0.86; // the tail stock
const WHALE_V = 2.8; // local px / frame (~6.7 m/s gliding in)
/** integrated swim phase (cycles): slow cruise (70 f), harder beats once it is caught (36 f) */
const WPHASE: number[] = (() => {
  const out: number[] = [];
  let ph = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(ph);
    ph += 1 / lerp(70, lerp(17, 26, smoothstep((f - 172) / 28)), smoothstep((f - F_WCATCH) / 6));
  }
  return out;
})();
const F_WTAUT = F_WCATCH + 3; // the line snaps taut
/** the whale held: lunges forward into the taut line, jerked back, gathers, again (weakening a little) */
const wTug = (f: number) => {
  const t = (f - F_WTAUT) / 22;
  const p = t - Math.floor(t);
  if (p < 0.4) return 1 - Math.pow(p / 0.4, 2); // lunging forward (1 = back, 0 = taut)
  if (p < 0.52) return 0.8 * (1 - Math.pow(1 - (p - 0.4) / 0.12, 2)); // snapped: jerked back
  return lerp(0.8, 1, smoothstep((p - 0.52) / 0.48));
};
const whaleRaw = (f: number) => {
  // it glides in a little deeper and rises gently toward the line (nose a touch up), so its back passes
  // under the hanging end and its flukes rise into it on the catch
  const rise = smoothstep((f - 100) / 48);
  const dy = 40 * (1 - rise);
  const riseTilt = -0.13 * Math.sin(Math.PI * clamp01((f - 100) / 48));
  if (f <= F_WCATCH) return { dx: -WHALE_V * (F_WCATCH - f), dy, tilt: riseTilt + 0.01 * Math.sin(f * 0.03), bend: 0 };
  // carried on at its glide until the line snaps taut, jerked back hard, then straining against it
  const taut = WHALE_V * (F_WTAUT - F_WCATCH);
  if (f <= F_WTAUT) return { dx: WHALE_V * (f - F_WCATCH), dy: 0, tilt: 0, bend: 0 };
  const E = lerp(1, 0.6, smoothstep((f - 172) / 28));
  const jerk = 11 * Math.sin(Math.PI * clamp01((f - F_WTAUT) / 8)) * (f < F_WTAUT + 8 ? 1 : 0);
  const strain = smoothstep((f - F_WTAUT - 6) / 6);
  const back = strain * E * 9 * wTug(f);
  const bend = (f < F_WTAUT + 8 ? 0.12 * Math.sin(Math.PI * clamp01((f - F_WTAUT) / 8)) : 0) + strain * E * 0.11 * Math.sin((2 * Math.PI * (f - F_WTAUT)) / 22);
  // the head hauls up and round as it lunges, dropped back when the line snaps it short
  const tilt = -0.06 * strain - E * 0.13 * (1 - wTug(f)) * strain + E * 0.04 * Math.sin((2 * Math.PI * (f - F_WTAUT)) / 22 + 1.2);
  return { dx: taut - jerk - back, dy: 0, tilt, bend };
};
/** the whale's path is fixed in its plane (world px at z = WHALE_Z): its tail stock is caught at x ~-33 */
const WHALE_BASE = { x: -32.76, y: 616.18 } as const;
const whaleAt = (f: number) => {
  const r = whaleRaw(f);
  return { x: WHALE_BASE.x + r.dx, y: WHALE_BASE.y + r.dy, tilt: r.tilt, bend: r.bend, phase: WPHASE[Math.max(0, Math.min(WPHASE.length - 1, f))] };
};
/** a point on the whale's body (u from the nose, off = local y below the spine), facing right, on the
 *  Whale component's body wave (same amp, the integrated phase) */
const whalePoint = (w: { x: number; y: number; tilt: number; phase: number; bend?: number }, u: number, off: number, amp = 0.025) => {
  const ph = 2 * Math.PI * w.phase;
  const sy = amp * WHALE_L * (0.12 + 0.88 * Math.pow(u, 2.2)) * Math.sin(ph - 2 * Math.PI * 0.85 * u) + (w.bend ?? 0) * WHALE_L * Math.pow(u - 0.3, 2) * Math.sign(u - 0.3);
  const lx = (0.5 - u) * WHALE_L;
  const ly = sy + off;
  return { x: w.x + lx * Math.cos(w.tilt) - ly * Math.sin(w.tilt), y: w.y + lx * Math.sin(w.tilt) + ly * Math.cos(w.tilt) };
};
const whaleAmp = (f: number) => lerp(0.025, lerp(0.08, 0.06, smoothstep((f - 172) / 28)), smoothstep((f - F_WCATCH) / 6));
/** the line's end before the catch: hanging where the tail stock will be at the catch */
const F_WHALE_ON = 60; // first frame drawn (fully off-frame left then: checked)

// =============================================================================================
// ABOVE THE WATER — the over/under opening. Screen-px overlay clipped above the dome's waterline,
// projected with the stage's own camera (same view, same sway).
// =============================================================================================
const SKY = { top: "#AEB8AE", mid: "#D3D2C2", low: "#E9E3D0", haze: "#EFEADA" } as const;
const SEA_UP = { far: "#BFC3B3", near: "#6C877D", glint: OCEAN.cream } as const;
const PAINT = { hi: "#F1EBDD", mid: "#DDD6C6", lo: "#ABA597", deep: "#8B867A", seam: "#9B9586" } as const;
const TURBINE = { hub: -102, R: 80, yaw: 0.46, rpmFrames: 150 } as const; // metres; a V164-class rotor
const G_DOME = 820; // screen px of dome waterline travel per metre of eye depth (fast: the lens dips under)
const G_DOME_ABOVE = 96; // ... and per metre of eye height while still above the surface
const wave = (x: number, T: number) => 7 * Math.sin(x / 96 + T * 0.31) + 4 * Math.sin(x / 41 - T * 0.47 + 1.3) + 1.8 * Math.sin(x / 17 + T * 0.9);
const domeY = (v: OceanView) => {
  const h = -(v.eye.y - SCENE_BC.surfaceY) / SCENE_BC.pxPerM; // metres above the surface
  return v.horizon + (h > 0 ? G_DOME_ABOVE : G_DOME) * h;
};

const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString();
const poly = (pts: { x: number; y: number }[]) => `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}Z`;

const CLOUDS = Array.from({ length: 7 }, (_, i) => ({ x: hash01(200 + i) * 1500, h: 380 + hash01(210 + i) * 1000, rx: 160 + hash01(220 + i) * 220, ry: 22 + hash01(230 + i) * 30, a: 0.16 + 0.18 * hash01(240 + i), v: 0.25 + 0.2 * hash01(250 + i) }));
/** the entry churn: bubbles and foam made where the lens breaks the surface, streaming up past it */
const BUBBLES = Array.from({ length: 120 }, (_, i) => ({
  f: 8 + hash01(300 + i) * 4,
  x: hash01(310 + i) * 1080,
  dy: -30 + hash01(320 + i) * 260,
  v: 60 + hash01(330 + i) * 90,
  r: 3 + Math.pow(hash01(340 + i), 2.4) * 34,
  wob: hash01(350 + i) * 6.28,
}));
const DipBubbles: React.FC<{ f: number }> = ({ f }) => {
  if (f < 8 || f > 24) return null;
  const els = BUBBLES.map((b, i) => {
    if (f < b.f) return null;
    const split0 = domeY(viewAt(Math.floor(b.f)));
    const y = split0 + b.dy - b.v * (f - b.f);
    if (y < -b.r * 2 || y > 1920 + b.r) return null;
    const x = b.x + 10 * Math.sin(b.wob + (f - b.f) * 0.9);
    return (
      <g key={i}>
        <circle cx={f3(x)} cy={f3(y)} r={f3(b.r)} fill={OCEAN.cream} fillOpacity={0.22} stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={2.2} />
        <circle cx={f3(x - b.r * 0.35)} cy={f3(y - b.r * 0.35)} r={f3(Math.max(1, b.r * 0.2))} fill="#FFFFFF" opacity={0.85} />
      </g>
    );
  });
  // the foam the lens punches through: a churned white band riding just under the waterline as it passes
  const split = domeY(viewAt(f));
  const foamOn = split > -60 && split < 1400;
  const foam = foamOn
    ? Array.from({ length: 16 }, (_, k) => (
        <ellipse key={k} cx={f3(hash01(400 + k) * 1080)} cy={f3(split + 20 + hash01(410 + k) * 50)} rx={f3(60 + hash01(420 + k) * 120)} ry={f3(12 + hash01(430 + k) * 20)} fill="#FFFFFF" opacity={0.5} style={{ filter: "blur(10px)" }} />
      ))
    : null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {foam}
      {els}
    </svg>
  );
};
const AboveWater: React.FC<{ v: OceanView; T: number }> = ({ v, T }) => {
  const split = domeY(v);
  if (split < -20) return null;
  // the lens is wet as it dips: the view above the line softens
  const wet = 7 * smoothstep((1300 - split) / 500);
  const M = SCENE_BC.pxPerM;
  const bob = 0.4 * Math.sin(T / 41); // = FloatingPlatform's heave
  const P = (xm: number, ym: number, zm: number) => {
    const q = platformPoint(v, PLAT, xm, ym, zm);
    return project(v, q.x, q.y, q.z);
  };
  const hor = v.horizon;
  const seaTop = Math.min(hor, split);
  const cols = PLATFORM.columns;
  // ---- the floater above the water: columns (freeboard), their caps, the top beams
  const column = (ci: number) => {
    const c = cols[ci];
    const top = P(c.x, -PLATFORM.freeboard + bob, c.z);
    const foot = P(c.x, 0, c.z);
    const rx = (c.d / 2) * M * top.a;
    const id = `gl_col${ci}`;
    return (
      <g key={`c${ci}`}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7E7B70" />
            <stop offset="0.2" stopColor={OCEAN.steelHi} />
            <stop offset="0.32" stopColor="#E6E2D2" />
            <stop offset="0.55" stopColor={OCEAN.steelMid} />
            <stop offset="0.85" stopColor={OCEAN.steelLo} />
            <stop offset="1" stopColor="#45443C" />
          </linearGradient>
        </defs>
        <rect x={top.x - rx} y={top.y} width={rx * 2} height={foot.y - top.y + 1} fill={`url(#${id})`} />
        {/* the top rim seen from just below its height: a shallow arc */}
        <path d={`M${f3(top.x - rx)} ${f3(top.y)}A${f3(rx)} ${f3(Math.max(1.5, rx * 0.09))} 0 0 1 ${f3(top.x + rx)} ${f3(top.y)}Z`} fill={`url(#${id})`} />
        <path d={`M${f3(top.x - rx)} ${f3(top.y + 2)}H${f3(top.x + rx)}`} stroke={OCEAN.steelLo} strokeOpacity={0.5} strokeWidth={1.2} />
        {/* the wet band and foam where it stands in the sea */}
        <rect x={top.x - rx} y={foot.y - Math.max(2, 0.8 * M * top.a)} width={rx * 2} height={Math.max(2, 0.8 * M * top.a)} fill={OCEAN.fouling} opacity={0.45} />
        <ellipse cx={foot.x} cy={foot.y} rx={rx * 1.35} ry={Math.max(1.6, rx * 0.07)} fill={OCEAN.cream} opacity={0.75} style={{ filter: "blur(1.2px)" }} />
      </g>
    );
  };
  const beam = (a: number, b: number, ym: number, dm: number, key: string) => {
    const N = 12;
    const T1: { x: number; y: number }[] = [];
    const B1: { x: number; y: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const xm = lerp(cols[a].x, cols[b].x, u);
      const zm = lerp(cols[a].z, cols[b].z, u);
      T1.push(P(xm, ym - dm / 2 + bob, zm));
      B1.push(P(xm, ym + dm / 2 + bob, zm));
    }
    const yT = Math.min(...T1.map((p) => p.y));
    const yB = Math.max(...B1.map((p) => p.y));
    const id = `gl_b${key}`;
    return (
      <g key={key}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yT)} x2="0" y2={f3(yB)}>
            <stop offset="0" stopColor="#E6E2D2" />
            <stop offset="0.4" stopColor={OCEAN.steelHi} />
            <stop offset="1" stopColor={OCEAN.steelLo} />
          </linearGradient>
        </defs>
        <path d={poly([...T1, ...B1.reverse()])} fill={`url(#${id})`} />
      </g>
    );
  };
  // ---- the turbine on column 1: tower, nacelle, hub, three blades (clockwise from upwind)
  const tc = cols[1];
  const tz = tc.z;
  const towerPts = (() => {
    const b0 = P(tc.x, -PLATFORM.freeboard + bob, tz);
    const t0 = P(tc.x, TURBINE.hub + 3.2 + bob, tz);
    const wb = 3.6 * M * b0.a;
    const wt = 2.2 * M * t0.a;
    return { b0, t0, wb, wt };
  })();
  const { b0, t0, wb, wt } = towerPts;
  const hubX = tc.x + 7 * Math.sin(TURBINE.yaw);
  const hub = P(hubX, TURBINE.hub + bob, tz);
  const a = hub.a;
  const nac = { x0: P(tc.x - 6.5 * Math.sin(TURBINE.yaw) - 2.4, 0, tz).x, x1: P(hubX - 0.6, 0, tz).x, h: 5.6 * M * a };
  const theta = (2 * Math.PI * T) / TURBINE.rpmFrames + 0.35;
  const cy = Math.cos(TURBINE.yaw);
  const chord = (r: number) => {
    const R = TURBINE.R;
    if (r < 3) return 3.6;
    if (r < 0.2 * R) return lerp(3.6, 5.3, smoothstep((r - 3) / (0.2 * R - 3)));
    return lerp(5.3, 0.9, Math.pow((r - 0.2 * R) / (0.8 * R), 0.85));
  };
  const blades = [0, 1, 2].map((i) => {
    const th = theta + (i * 2 * Math.PI) / 3;
    const d = { x: Math.sin(th) * cy, y: -Math.cos(th) };
    const p = { x: Math.cos(th) * cy, y: Math.sin(th) };
    const rs = Array.from({ length: 22 }, (_, j) => 1.6 + (TURBINE.R - 1.6) * Math.pow(j / 21, 1.15));
    const at = (r: number, off: number) => ({ x: hub.x + (d.x * r + p.x * off) * M * a, y: hub.y + (d.y * r + p.y * off) * M * a });
    const le = rs.map((r) => at(r, chord(r) * 0.3));
    const te = rs.map((r) => at(r, -chord(r) * 0.7));
    const mid = rs.map((r) => at(r, -chord(r) * 0.12));
    const body = poly([...le, ...te.slice().reverse()]);
    const shade = poly([...mid, ...te.slice().reverse()]);
    const edge = `M${le.map((q) => `${f3(q.x)} ${f3(q.y)}`).join("L")}`;
    return (
      <g key={i}>
        <path d={body} fill={PAINT.hi} />
        <path d={shade} fill={PAINT.lo} opacity={0.55} />
        <path d={edge} fill="none" stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={1.1} />
      </g>
    );
  });
  // ---- distant turbines on the sea horizon (hazy, at infinity)
  const far = [
    { x: 118, h: 118, ph: 1.1 },
    { x: 905, h: 84, ph: 2.7 },
    { x: 1012, h: 66, ph: 0.4 },
  ].map((t, i) => {
    const ty = hor - t.h;
    const r = t.h * 0.58;
    const th = theta * 0.94 + t.ph;
    return (
      <g key={i} opacity={0.55}>
        <path d={poly([{ x: t.x - t.h * 0.018, y: hor }, { x: t.x - t.h * 0.011, y: ty }, { x: t.x + t.h * 0.011, y: ty }, { x: t.x + t.h * 0.018, y: hor }])} fill="#C3C4B6" />
        {[0, 1, 2].map((j) => {
          const b = th + (j * 2 * Math.PI) / 3;
          return <path key={j} d={`M${f3(t.x)} ${f3(ty)}L${f3(t.x + Math.sin(b) * r * 0.9)} ${f3(ty - Math.cos(b) * r)}`} stroke="#C3C4B6" strokeWidth={Math.max(1, t.h * 0.016)} strokeLinecap="round" />;
        })}
      </g>
    );
  });
  // ---- the sea seen from just above it: haze at the horizon, glints drifting
  const glints = Array.from({ length: 46 }, (_, i) => {
    const h1 = Math.abs(Math.sin(i * 91.7 + 3.1) * 43758.5453) % 1;
    const h2 = Math.abs(Math.sin(i * 17.3 + 9.4) * 24634.6345) % 1;
    const h3 = Math.abs(Math.sin(i * 53.9 + 1.7) * 12345.6789) % 1;
    const yy = seaTop + (split - seaTop) * Math.pow(h2, 0.8);
    const depthT = (yy - seaTop) / Math.max(1, split - seaTop);
    const len = 4 + 26 * h3 * (0.4 + depthT);
    const xx = ((h1 * 1300 + T * (0.6 + 0.8 * h3)) % 1300) - 110;
    return <path key={i} d={`M${f3(xx)} ${f3(yy)}h${f3(len)}`} stroke={SEA_UP.glint} strokeOpacity={0.18 + 0.32 * h1 * (1 - depthT * 0.4)} strokeWidth={0.8 + 1.4 * depthT} strokeLinecap="round" />;
  });
  const clip = (() => {
    const pts: string[] = [];
    for (let x = -20; x <= 1100; x += 20) pts.push(`${f3(x)} ${f3(split + wave(x, T))}`);
    return { d: `M-20 -40H1100V${f3(split + wave(1100, T))}L${pts.reverse().join("L")}Z`, line: `M${pts.reverse().join("L")}` };
  })();
  const sunX = 330;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <clipPath id="gl_above">
          <path d={clip.d} />
        </clipPath>
        <linearGradient id="gl_sky" gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1500)} x2="0" y2={f3(hor)}>
          <stop offset="0" stopColor={SKY.top} />
          <stop offset="0.55" stopColor={SKY.mid} />
          <stop offset="0.9" stopColor={SKY.low} />
          <stop offset="1" stopColor={SKY.haze} />
        </linearGradient>
        <radialGradient id="gl_sun" gradientUnits="userSpaceOnUse" cx={sunX} cy={f3(hor - 1150)} r={900}>
          <stop offset="0" stopColor="#FBF3DD" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#F4E9CF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#F4E9CF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gl_sea" gradientUnits="userSpaceOnUse" x1="0" y1={f3(seaTop)} x2="0" y2={f3(Math.max(seaTop + 1, split + 6))}>
          <stop offset="0" stopColor={SEA_UP.far} />
          <stop offset="0.3" stopColor="#97A99E" />
          <stop offset="1" stopColor={SEA_UP.near} />
        </linearGradient>
        <linearGradient id="gl_tower" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={PAINT.mid} />
          <stop offset="0.28" stopColor={PAINT.hi} />
          <stop offset="0.62" stopColor={PAINT.mid} />
          <stop offset="1" stopColor={PAINT.lo} />
        </linearGradient>
        <linearGradient id="gl_nac" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAINT.hi} />
          <stop offset="0.55" stopColor={PAINT.mid} />
          <stop offset="1" stopColor={PAINT.deep} />
        </linearGradient>
        <radialGradient id="gl_hub" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.5" stopColor={PAINT.hi} />
          <stop offset="1" stopColor={PAINT.lo} />
        </radialGradient>
      </defs>
      <g clipPath="url(#gl_above)" style={{ filter: wet > 0.05 ? `blur(${f3(wet)}px)` : undefined }}>
        <rect x={-20} y={-40} width={1120} height={seaTop + 41} fill="url(#gl_sky)" />
        <rect x={-20} y={-40} width={1120} height={seaTop + 41} fill="url(#gl_sun)" />
        {/* a band of haze lying on the horizon */}
        <rect x={-20} y={hor - 70} width={1120} height={70} fill={SKY.haze} opacity={0.45} style={{ filter: "blur(18px)" }} />
        {/* soft high cloud, drifting: the sky is not a flat card */}
        {CLOUDS.map((c, i) => (
          <ellipse key={i} cx={f3(((c.x + T * c.v) % 1500) - 210)} cy={f3(hor - c.h)} rx={c.rx} ry={c.ry} fill={i % 2 ? "#F4EFE1" : "#C9CDC0"} opacity={c.a} style={{ filter: "blur(16px)" }} />
        ))}
        {far}
        <rect x={-20} y={seaTop} width={1120} height={Math.max(0, split - seaTop + 12)} fill="url(#gl_sea)" />
        {glints}
        {/* the floater: back column, beams to it, the front beam, the front columns */}
        {column(2)}
        {beam(0, 2, -PLATFORM.freeboard + 1.4, 1.9, "02")}
        {beam(1, 2, -PLATFORM.freeboard + 1.4, 1.9, "12")}
        {column(0)}
        {beam(0, 1, -PLATFORM.freeboard + 1.4, 1.9, "01")}
        {column(1)}
        {/* the tower, standing on the turbine column */}
        <path d={poly([{ x: b0.x - wb, y: b0.y }, { x: t0.x - wt, y: t0.y }, { x: t0.x + wt, y: t0.y }, { x: b0.x + wb, y: b0.y }])} fill="url(#gl_tower)" />
        <rect x={b0.x - wb} y={b0.y - 7 * M * b0.a} width={wb * 2} height={1.2} fill={PAINT.seam} opacity={0.7} />
        <rect x={b0.x - wb * 1.08} y={b0.y - 1.4 * M * b0.a} width={wb * 2.16} height={1.4 * M * b0.a} fill={OCEAN.steelMid} />
        {/* the nacelle, yawed a little to the wind: its flank shows behind the hub */}
        <rect x={nac.x0} y={hub.y - nac.h * 0.5} width={nac.x1 - nac.x0} height={nac.h} rx={nac.h * 0.22} fill="url(#gl_nac)" />
        <path d={`M${f3(nac.x0 + nac.h * 0.25)} ${f3(hub.y - nac.h * 0.5 + 1.5)}H${f3(nac.x1 - nac.h * 0.1)}`} stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={1.2} />
        {blades}
        <ellipse cx={hub.x + 0.8 * M * a} cy={hub.y} rx={2.5 * M * a} ry={2.7 * M * a} fill="url(#gl_hub)" />
      </g>
      {/* the dome's waterline: a bright meniscus, the surface's underside lit just below it */}
      <defs>
        <linearGradient id="gl_under" gradientUnits="userSpaceOnUse" x1="0" y1={f3(split)} x2="0" y2={f3(split + 70)}>
          <stop offset="0" stopColor={OCEAN.sky} stopOpacity="0.8" />
          <stop offset="1" stopColor={OCEAN.sky} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={-20} y={split - 6} width={1120} height={80} fill="url(#gl_under)" />
      {/* a film of water running off the dome above the line: blurred, sea-tinted, uneven */}
      <path d={`${clip.line}L1100 ${f3(split - 46)}L-20 ${f3(split - 38)}Z`} fill={SEA_UP.near} opacity={0.42} style={{ filter: "blur(9px)" }} />
      <path d={clip.line} fill="none" stroke={OCEAN.sky} strokeOpacity={0.5} strokeWidth={9} style={{ filter: "blur(5px)" }} />
      <path d={clip.line} fill="none" stroke="#38524C" strokeOpacity={0.55} strokeWidth={4} transform="translate(0 -2)" />
      <path d={clip.line} fill="none" stroke={OCEAN.sky} strokeOpacity={0.9} strokeWidth={2.2} transform="translate(0 1.5)" />
    </svg>
  );
};

const f6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const polyOpen = (pts: { x: number; y: number }[]) => `M${pts.map((q) => `${f3(q.x)} ${f3(q.y)}`).join("L")}Z`;
/** FloatingPlatform (oceanShared) as a variant: the same floater, WITHOUT the back column's mooring
 *  (it recedes toward the vanishing point and read as a stray line across the close shots). */
const Floater: React.FC<{ at: P; frame?: number; heave?: number }> = ({ at, frame = 0, heave = 1 }) => {
  const o = useOcean();
  const uid = `glv2pf${React.useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const M = o.scene.pxPerM;
  const bob = heave * 0.4 * Math.sin(frame / 41);
  const pl = (xm: number, ym: number, zm: number) => platformPoint(o, at, xm, ym + bob, zm);
  const scr = (q: { x: number; y: number; z: number }) => project(o, q.x, q.y, q.z);
  const cols = PLATFORM.columns;
  const drawColumn = (ci: number) => {
    const c = cols[ci];
    const top = scr(pl(c.x, -PLATFORM.freeboard * 0.0, c.z));
    const bot = scr(pl(c.x, PLATFORM.draft, c.z));
    const rx = (c.d / 2) * M * top.a;
    // the surface line at this column's depth: the ceiling meets it there (columns end there)
    const surfY = top.y;
    const id = `${uid}c${ci}`;
    const plateR = (PLATFORM.heavePlateD / 2) * M * bot.a;
    const plateT = PLATFORM.heavePlate * M * bot.a;
    // looking up at the plate: its underside shows as a flat ellipse
    const eyeDy = Math.max(0.05, (o.eye.y - (at.y + PLATFORM.draft * M)) / (depthDistM(o, c.z * M) * M));
    const under = Math.min(0.32, eyeDy);
    const fog = fogAt(o.scene, depthDistM(o, c.z * M));
    return (
      <InFog key={ci} amount={fog}>
        <g transform={`matrix(${f6(1 / o.a)} 0 0 ${f6(1 / o.a)} ${f6(-o.bx / o.a)} ${f6(-o.by / o.a)})`}>
          <defs>
            <linearGradient id={`${id}x`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#77756A" />
              <stop offset="0.2" stopColor={OCEAN.steelHi} />
              <stop offset="0.32" stopColor="#E0DCCB" />
              <stop offset="0.55" stopColor={OCEAN.steelMid} />
              <stop offset="0.85" stopColor={OCEAN.steelLo} />
              <stop offset="1" stopColor="#3E3D36" />
            </linearGradient>
            <linearGradient id={`${id}y`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity="0" />
              <stop offset="0.55" stopColor={OCEAN.fouling} stopOpacity="0.25" />
              <stop offset="1" stopColor={OCEAN.fouling} stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={OCEAN.steelHi} />
              <stop offset="0.35" stopColor={OCEAN.steelMid} />
              <stop offset="1" stopColor={OCEAN.steelLo} />
            </linearGradient>
          </defs>
          {/* the column, from the surface down */}
          <rect x={top.x - rx} y={surfY} width={rx * 2} height={bot.y - surfY} fill={`url(#${id}x)`} />
          <rect x={top.x - rx} y={surfY} width={rx * 2} height={bot.y - surfY} fill={`url(#${id}y)`} />
          {/* where it pierces the surface: the surface's bright meniscus round the column */}
          <ellipse cx={top.x} cy={surfY} rx={rx * 1.5} ry={Math.max(3, rx * 0.16)} fill={OCEAN.sky} opacity={0.55} style={{ filter: `blur(${f3(Math.max(2, rx * 0.12))}px)` }} />
          {/* the heave plate: a thin wide disc seen from a little below */}
          <ellipse cx={bot.x} cy={bot.y + plateT} rx={plateR} ry={plateR * under} fill={OCEAN.steelLo} />
          <rect x={bot.x - plateR} y={bot.y} width={plateR * 2} height={plateT} fill={`url(#${id}p)`} />
          <ellipse cx={bot.x} cy={bot.y} rx={plateR} ry={plateR * under * 0.35} fill={OCEAN.steelHi} opacity={0.55} />
          {/* an AO line where the column meets the plate */}
          <ellipse cx={bot.x} cy={bot.y} rx={rx * 1.05} ry={rx * under * 0.5} fill={OCEAN.shadow} opacity={0.35} style={{ filter: `blur(${f3(rx * 0.08)}px)` }} />
        </g>
      </InFog>
    );
  };
  // pontoons between column feet and braces near the surface, as projected bars
  const bar = (a: number, b: number, ym: number, hm: number, key: string, kind: "pontoon" | "brace") => {
    const A = cols[a];
    const B = cols[b];
    const N = 14;
    const ptsT: P[] = [];
    const ptsB: P[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const xm = lerp(A.x, B.x, u);
      const zm = lerp(A.z, B.z, u);
      const t = scr(pl(xm, ym - hm / 2, zm));
      const bt = scr(pl(xm, ym + hm / 2, zm));
      ptsT.push({ x: t.x, y: t.y });
      ptsB.push({ x: bt.x, y: bt.y });
    }
    const d = polyOpen([...ptsT, ...ptsB.reverse()]);
    const zmid = ((A.z + B.z) / 2) * M;
    const fog = fogAt(o.scene, depthDistM(o, zmid));
    const id = `${uid}${key}`;
    const yTop = Math.min(...ptsT.map((p) => p.y));
    const yBot = Math.max(...ptsB.map((p) => p.y));
    return (
      <InFog key={key} amount={fog}>
        <g transform={`matrix(${f6(1 / o.a)} 0 0 ${f6(1 / o.a)} ${f6(-o.bx / o.a)} ${f6(-o.by / o.a)})`}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={yTop} x2="0" y2={yBot}>
              <stop offset="0" stopColor={OCEAN.steelMid} />
              <stop offset="0.18" stopColor={kind === "pontoon" ? "#E0DCCB" : OCEAN.steelHi} />
              <stop offset="0.45" stopColor={OCEAN.steelMid} />
              <stop offset="0.85" stopColor={OCEAN.steelLo} />
              <stop offset="1" stopColor="#3E3D36" />
            </linearGradient>
          </defs>
          <path d={d} fill={`url(#${id})`} />
        </g>
      </InFog>
    );
  };
  // mooring lines: catenaries from each column's foot outward and down into the fog
  const moorings = cols.map((c, ci) => {
    const outX = c.x === 0 ? 0 : Math.sign(c.x);
    const outZ = c.z > 0 ? -0.3 : -1; // outward and away (never toward the eye)
    const len = Math.hypot(outX, outZ) || 1;
    const ux = outX / len;
    const uz = outZ / len;
    const N = 40;
    const pts: { x: number; y: number; s: number; fog: number }[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const r = u * 420; // metres outward
      const yy = PLATFORM.draft + 2 + (o.scene.seabedY !== undefined ? (o.scene.seabedY / M - PLATFORM.draft) : 60) * Math.pow(u, 1.6) * 1.05;
      const q = pl(c.x + ux * (c.d / 2 + r), yy, c.z + uz * r);
      const s = scr(q);
      pts.push({ x: s.x, y: s.y, s: s.a / o.root.a, fog: fogAt(o.scene, depthDistM(o, q.z)) });
    }
    return (
      <g key={`m${ci}`} transform={`matrix(${f6(1 / o.a)} 0 0 ${f6(1 / o.a)} ${f6(-o.bx / o.a)} ${f6(-o.by / o.a)})`}>
        {pts.slice(0, -1).map((p, i) => {
          const q = pts[i + 1];
          const w = Math.max(1.3, 3.2 * p.s);
          return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={fogHex(o, "#4C4A42", p.fog, p.y)} strokeWidth={w} strokeLinecap="round" />;
        })}
      </g>
    );
  });
  // the tower: faint, above the surface (seen through it), over the turbine column
  const tc = cols[1];
  const tb = scr(pl(tc.x, 0, tc.z));
  const towerW = 6 * M * tb.a;
  return (
    <g>
      {drawColumn(2)}
      {bar(0, 2, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p02", "pontoon")}
      {bar(1, 2, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p12", "pontoon")}
      {bar(0, 2, PLATFORM.braceDepth, PLATFORM.brace, "b02", "brace")}
      {bar(1, 2, PLATFORM.braceDepth, PLATFORM.brace, "b12", "brace")}
      {moorings[0]}
      {moorings[1]}
      {bar(0, 1, PLATFORM.draft - PLATFORM.pontoon / 2, PLATFORM.pontoon, "p01", "pontoon")}
      {bar(0, 1, PLATFORM.braceDepth, PLATFORM.brace, "b01", "brace")}
      {drawColumn(0)}
      {drawColumn(1)}
      <g transform={`matrix(${f6(1 / o.a)} 0 0 ${f6(1 / o.a)} ${f6(-o.bx / o.a)} ${f6(-o.by / o.a)})`} opacity={0.16} style={{ mixBlendMode: "multiply", filter: `blur(${f3(towerW * 0.25)}px)` }}>
        <path d={polyOpen([{ x: tb.x - towerW / 2, y: tb.y }, { x: tb.x - towerW * 0.3, y: tb.y - 900 }, { x: tb.x + towerW * 0.3, y: tb.y - 900 }, { x: tb.x + towerW / 2, y: tb.y }])} fill={OCEAN.steelLo} />
      </g>
    </g>
  );
};


// =============================================================================================
// THE WORLD UNDER THE WATER
// =============================================================================================
/** frayed, cut end of a line: a few short strands fanning out */
const Fray: React.FC<{ at: P; dir: number; len: number; color?: string; w?: number; seed: number }> = ({ at, dir, len, color = OCEAN.mono, w = 2.2, seed }) => {
  const o = useOcean();
  const d = [-0.5, -0.17, 0.16, 0.5].map((da, i) => {
    const a = dir + da + (hash01(seed + i) - 0.5) * 0.2;
    const l = len * (0.6 + 0.5 * hash01(seed + i * 3.3));
    const mid = add(at, polar(l * 0.5, a + 0.12));
    const end = add(at, polar(l, a));
    return `M${f3(at.x)} ${f3(at.y)}Q${f3(mid.x)} ${f3(mid.y)} ${f3(end.x)} ${f3(end.y)}`;
  });
  return <path d={d.join("")} fill="none" stroke={color} strokeOpacity={0.9} strokeWidth={f3(w / o.a)} strokeLinecap="round" />;
};
/** thick loops of line (a coil): n loops of radius r about c, squashed vertically, spinning */
const loopPaths = (c: P, r: number, n: number, spin: number, squash: number, seed: number) =>
  Array.from({ length: n }, (_, k) => {
    const oc = { x: (hash01(seed + 70 + k) - 0.5) * r * 0.5, y: (hash01(seed + 80 + k) - 0.5) * r * 0.35 };
    const rr0 = r * (0.75 + 0.25 * hash01(seed + 90 + k));
    const ell = 0.45 + 0.35 * hash01(seed + 100 + k);
    const ph = hash01(seed + 110 + k) * 6.283 + spin * (1 + 0.2 * k);
    const pts = Array.from({ length: 12 }, (_, q) => {
      const a = (q / 12) * 6.283;
      const rr = rr0 * (0.9 + 0.2 * hash01(seed + 120 + k * 13 + q));
      const lp = rot2({ x: oc.x + rr * Math.cos(a), y: oc.y + rr * ell * Math.sin(a) }, ph);
      return { x: c.x + lp.x, y: c.y + lp.y * squash };
    });
    return smoothClosed(pts);
  });

/** WRAPS round the cable at the snarl: few, thick turns (front half bright, back half dim behind the
 *  cable). Each piece adds its turns, turn by turn, from its contact frame. */
const WRAPS = [
  { off: -0.4, n: 3, from: F_CONTACT, dur: 8 },
  { off: 3.0, n: 2, from: F_TANGLE, dur: 6 },
  { off: -3.4, n: 1, from: F_ROPE + 1, dur: 4 },
] as const;
const Wraps: React.FC<{ f: number; layer: "back" | "front" }> = ({ f, layer }) => {
  const o = useOcean();
  const cw = cableWidths(o, CABLE).w;
  const tan = { x: A.tx, y: A.ty };
  const nrm = { x: tan.y, y: -tan.x };
  const out: string[] = [];
  WRAPS.forEach((wp) => {
    const show = clamp01((f - wp.from) / wp.dur) * wp.n;
    for (let i = 0; i < wp.n; i++) {
      const sh = clamp01(show - i);
      if (sh <= 0) continue;
      const off = wp.off + (i - (wp.n - 1) / 2) * cw * 0.55;
      const c = { x: A.x + tan.x * off, y: A.y + tan.y * off };
      const r = cw * 0.66;
      const lean = cw * 0.25;
      const top = { x: c.x + nrm.x * r - tan.x * lean, y: c.y + nrm.y * r - tan.y * lean };
      const bot = { x: c.x - nrm.x * r + tan.x * lean, y: c.y - nrm.y * r + tan.y * lean };
      if (layer === "front") {
        const cf = { x: c.x + tan.x * cw * 0.5, y: c.y + tan.y * cw * 0.5 };
        const end = { x: lerp(top.x, bot.x, sh), y: lerp(top.y, bot.y, sh) };
        out.push(`M${f3(top.x)} ${f3(top.y)}Q${f3(cf.x)} ${f3(cf.y)} ${f3(end.x)} ${f3(end.y)}`);
      } else if (sh > 0.5) {
        const cb = { x: c.x - tan.x * cw * 0.5, y: c.y - tan.y * cw * 0.5 };
        out.push(`M${f3(bot.x)} ${f3(bot.y)}Q${f3(cb.x)} ${f3(cb.y)} ${f3(top.x)} ${f3(top.y)}`);
      }
    }
  });
  return (
    <InFog>
      <path d={out.join("")} fill="none" stroke={OCEAN.mono} strokeOpacity={layer === "front" ? 0.95 : 0.5} strokeWidth={f3((layer === "front" ? 3.6 : 2.4) / o.a)} strokeLinecap="round" />
    </InFog>
  );
};

/** PIECE 2: a thick coil of line drifting in from the right above the cable; lands on the snarl */
const TANGLE = { at: { x: 2.6, y: -4.0 }, dir: norm(-0.95, 0.3), v: 3.8, r: 3.6 } as const;
const tangleAt = (f: number) => {
  const d = Math.max(0, F_TANGLE - f) * TANGLE.v;
  const post = smoothstep((f - F_TANGLE) / 7);
  const c = { x: A.x + TANGLE.at.x - TANGLE.dir.x * d, y: A.y + TANGLE.at.y - TANGLE.dir.y * d + 0.8 * post };
  const spin = Math.min(f, F_TANGLE) * 0.035 + post * 0.15;
  const endDir = lerp(Math.atan2(-TANGLE.dir.y, -TANGLE.dir.x), Math.atan2(0.5, 1), post);
  return { c, spin, squash: lerp(1, 0.7, post), endDir };
};
const TangleCoil: React.FC<{ f: number; T: number }> = ({ f, T }) => {
  const o = useOcean();
  const t = tangleAt(f);
  const loops = loopPaths(t.c, TANGLE.r, 3, t.spin, t.squash, 7);
  const tail = ghostStrand({ anchor: add(t.c, polar(TANGLE.r * 0.8, t.endDir)), current: polar(1, t.endDir), frame: T + 11, seed: 31, length: 9, wrap: 1 }, 0);
  return (
    <>
      <path d={loops.join("")} fill="none" stroke={OCEAN.mono} strokeOpacity={0.92} strokeWidth={f3(3 / o.a)} />
      <Mono pts={tail} w={2.8} op={0.9} />
      <Fray at={tail[tail.length - 1]} dir={lastDir(tail)} len={1.6} seed={40} />
    </>
  );
};

/** PIECE 3: a frayed rope with a float; rises in from the lower left and catches under the snarl */
const ROPE = { at: { x: -3.6, y: 4.6 }, fr: 2.8, len: 13 } as const;
const ropeFloatAt = (f: number): P => {
  const u = Math.max(0, F_ROPE - f) * 3.0;
  const bob = f > F_ROPE ? 0.25 * Math.sin((f - F_ROPE) * 0.11) : 0;
  return { x: A.x + ROPE.at.x - u, y: A.y + ROPE.at.y + 0.3 * u + 18 * (1 - Math.exp(-u / 12)) + bob };
};
const ropePts = (f: number, T: number): P[] => {
  const F = ropeFloatAt(f);
  const sway = 0.15 * Math.sin(T * 0.06);
  const pre = Array.from({ length: 10 }, (_, i) => {
    const s2 = i / 9;
    return { x: F.x + 0.5 - ROPE.len * s2 * (0.35 + sway * s2), y: F.y + ROPE.fr * 0.9 + ROPE.len * s2 * 0.92 };
  });
  if (f <= F_ROPE) return pre;
  const post: P[] = [
    { x: F.x + 0.6, y: F.y - ROPE.fr * 0.8 },
    { x: A.x - 4.3, y: A.y + 1.8 },
    { x: A.x - 4.2, y: A.y - 1.6 },
    { x: A.x - 2.7, y: A.y - 1.9 },
    { x: A.x - 2.2, y: A.y + 1.5 },
    { x: A.x - 1.6, y: A.y + 4.4 },
    { x: A.x - 1.4, y: A.y + 6.8 },
    { x: A.x - 1.0, y: A.y + 9.0 + 0.4 * Math.sin(T * 0.05) },
    { x: A.x - 0.4, y: A.y + 10.9 + 0.5 * Math.sin(T * 0.05 + 1) },
    { x: A.x + 0.2, y: A.y + 12.6 + 0.6 * Math.sin(T * 0.05 + 2) },
  ];
  const e = smoothstep((f - F_ROPE) / 8);
  return pre.map((q, i) => ({ x: lerp(q.x, post[i].x, e), y: lerp(q.y, post[i].y, e) }));
};
const FloatRope: React.FC<{ f: number; T: number }> = ({ f, T }) => {
  const o = useOcean();
  const F = ropeFloatAt(f);
  const pts = ropePts(f, T);
  const w = Math.max(4.2 / o.a, 0.5);
  return (
    <>
      <defs>
        <radialGradient id="glv2float" cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor={OCEAN.cream} />
          <stop offset="0.45" stopColor={OCEAN.float} />
          <stop offset="1" stopColor="#6B6252" />
        </radialGradient>
      </defs>
      <path d={smoothOpen(pts)} fill="none" stroke={OCEAN.twine} strokeWidth={f3(w)} strokeLinecap="round" />
      <path d={smoothOpen(pts)} fill="none" stroke={OCEAN.cream} strokeOpacity={0.35} strokeWidth={f3(w * 0.3)} strokeLinecap="round" />
      <Fray at={pts[pts.length - 1]} dir={lastDir(pts)} len={2.4} color={OCEAN.twine} w={2.6} seed={50} />
      <ellipse cx={F.x} cy={F.y} rx={ROPE.fr * 1.25} ry={ROPE.fr} fill="url(#glv2float)" />
      <path d={`M${f3(F.x - ROPE.fr * 1.2)} ${f3(F.y)}H${f3(F.x + ROPE.fr * 1.2)}`} stroke="#6B6252" strokeOpacity={0.6} strokeWidth={f3(w * 0.35)} />
    </>
  );
};

/** the cable reads heavier and catches the light (strongest where it is small on screen) */
const CableAccent: React.FC<{ layer: "under" | "over" }> = ({ layer }) => {
  const o = useOcean();
  const cw = cableWidths(o, CABLE).w;
  const W = Math.max(cw * 1.45, 19 / o.a);
  const N = 320;
  const halfMod = ((cableWidths(o, CABLE).collar * 1.05) / 2 + 2 / o.a) / CABLE.length;
  const near = (s: number) => CABLE.collarS.some((c) => Math.abs(c - s) < halfMod);
  if (layer === "under") {
    const pts = Array.from({ length: N + 1 }, (_, i) => CABLE.at(i / N));
    return (
      <InFog>
        <path d={`M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}`} fill="none" stroke={OCEAN.cableLo} strokeWidth={f3(W)} strokeLinecap="round" strokeLinejoin="round" />
      </InFog>
    );
  }
  const segs: string[] = [];
  let open = false;
  for (let i = 0; i <= N; i++) {
    const s2 = i / N;
    const p = CABLE.at(s2);
    if (near(s2) || p.y > CABLE.spec.seabedY - 2) {
      open = false;
      continue;
    }
    const q = { x: p.x + p.nx * W * 0.27, y: p.y + p.ny * W * 0.27 };
    segs.push(`${open ? "L" : "M"}${f3(q.x)} ${f3(q.y)}`);
    open = true;
  }
  return (
    <InFog>
      <path d={segs.join("")} fill="none" stroke={OCEAN.cream} strokeOpacity={0.8} strokeWidth={f3(Math.max(cw * 0.14, 4 / o.a))} strokeLinecap="round" />
    </InFog>
  );
};

/** PIECE 1 in front of the cable: the net panel with its float line, the coil of monofilament and the
 *  heavier main line (snarl -> net: every entanglement traces back to the snarl) */
const GearFront: React.FC<{ g: Gear; f: number; T: number }> = ({ g, f, T }) => {
  const main = sagLine(g.T, g.K, g.line, T);
  const far = add(g.K, rot2({ x: PANEL.w * g.sq * 0.98, y: 0.4 }, g.rot));
  const farB = add(g.K, rot2({ x: PANEL.w * g.sq * 0.9, y: PANEL.h * 0.8 }, g.rot));
  const dir = { x: Math.cos(g.stream), y: Math.sin(g.stream) };
  const l1 = ghostStrand({ anchor: far, current: dir, frame: T, seed: 5, length: 13, wrap: 1 }, 0);
  const l2 = ghostStrand({ anchor: farB, current: { x: dir.x, y: dir.y + 0.2 }, frame: T + 9, seed: 17, length: 9, wrap: 1 }, 0);
  // the coil of monofilament at the line's end: free loops before contact, drawn tight into the wraps after
  const coilK = 1 - smoothstep((f - F_CONTACT) / 7);
  const loops = coilK > 0.02 ? loopPaths(g.T, 2.6 * (0.35 + 0.65 * coilK), 3, f * 0.05, 1, 3) : [];
  const o = useOcean();
  return (
    <InFog>
      <Mono pts={l1} w={2.4} />
      <Fray at={l1[l1.length - 1]} dir={lastDir(l1)} len={1.6} seed={60} />
      <Mono pts={l2} w={2} op={0.8} />
      <NetPanel k={g.K} ai={PANEL_K.i} aj={PANEL_K.j} w={PANEL.w} h={PANEL.h} cols={PANEL.cols} rows={PANEL.rows} rot={g.rot} sq={g.sq} bunch={g.bunch} frame={T} seed={3} floats={NET_FLOATS} weight={1.25} />
      <Mono pts={main} w={5.2} op={0.97} />
      {loops.length ? <path d={loops.join("")} fill="none" stroke={OCEAN.mono} strokeOpacity={0.92} strokeWidth={f3(3 / o.a)} /> : null}
    </InFog>
  );
};

/** the long line from the snarl, streaming down and back into the haze; it catches the whale's tail
 *  stock on "whales" and snaps taut. Drawn at the stage root (it spans depth: 3-D points projected). */
const WhaleLine: React.FC<{ f: number; T: number }> = ({ f, T }) => {
  const o = useOcean();
  if (f < F_GEAR_ON) return null;
  const w = whaleAt(f);
  // before the catch the free end hangs just above the whale's path (its back passes under it); the
  // flukes rise into it on "whales", and it slides down onto the tail stock and wraps
  const wc = whaleAt(F_WCATCH);
  const freeAt = whalePoint(wc, 0.9, -19, whaleAmp(F_WCATCH));
  const g = gearAt(f);
  const pre = f <= F_CONTACT;
  const a3 = pre ? { x: g.T.x, y: g.T.y, z: CABLE.z } : { x: A.x, y: A.y, z: CABLE.z };
  const reach = smoothstep((f - F_CONTACT) / 50);
  const trail = { x: g.T.x - 4 + 1.2 * Math.sin(T * 0.04), y: g.T.y + 16, z: CABLE.z - 30 };
  const startEnd = { x: A.x - 4, y: A.y + 16, z: CABLE.z - 30 };
  const freeEnd = pre
    ? trail
    : { x: lerp(startEnd.x, freeAt.x, reach) + 1.2 * Math.sin(T * 0.04), y: lerp(startEnd.y, freeAt.y, reach), z: lerp(startEnd.z, WHALE_Z, reach) };
  const held = f >= F_WCATCH;
  const slide = smoothstep((f - F_WCATCH) / 6);
  const onWhale = (() => {
    const a = whalePoint(w, 0.9, -19, whaleAmp(f));
    const b = whalePoint(w, WHALE_U_TIE, 0, whaleAmp(f));
    return { x: lerp(a.x, b.x, slide), y: lerp(a.y, b.y, slide), z: WHALE_Z };
  })();
  const e3 = held ? onWhale : freeEnd;
  const taut = held ? (f < F_WTAUT ? 0.5 * smoothstep((f - F_WCATCH) / 3) : 1 - 0.85 * wTug(f) * smoothstep((f - F_WTAUT - 6) / 6)) : 0;
  const N = 24;
  const pts: P[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const sag = (1 - taut) * 22 * Math.sin(Math.PI * u) + 3 * Math.sin(u * 7 + T * 0.05) * u * (1 - taut * 0.8);
    const x = lerp(a3.x, e3.x, u) + sag * 0.5;
    const y = lerp(a3.y, e3.y, u) + sag * 0.2;
    const z = lerp(a3.z, e3.z, u);
    const sc = project(o, x, y, z);
    pts.push({ x: (sc.x - o.bx) / o.a, y: (sc.y - o.by) / o.a });
  }
  const endDir = lastDir(pts);
  return (
    <InFog amount={0.3}>
      <path d={smoothOpen(pts)} fill="none" stroke={OCEAN.mono} strokeOpacity={0.95} strokeWidth={f3(6 / o.a)} strokeLinecap="round" />
      {!held ? <Fray at={pts[N]} dir={endDir} len={9 / o.a} seed={77} w={3} /> : null}
    </InFog>
  );
};
/** the wraps the line makes round the whale's tail stock once it is caught (inside the whale's group) */
const WhaleWraps: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  if (f < F_WCATCH) return null;
  const w = whaleAt(f);
  const amp = whaleAmp(f);
  const show = clamp01((f - F_WCATCH) / 8) * 3;
  const arcs: string[] = [];
  [0.83, 0.86, 0.89].forEach((u, i) => {
    const sh = clamp01(show - i);
    if (sh <= 0) return;
    const top = whalePoint(w, u, -0.042 * WHALE_L * (1 - (u - 0.8) * 2), amp);
    const bot = whalePoint(w, u + 0.01, 0.036 * WHALE_L * (1 - (u - 0.8) * 2), amp);
    const c = whalePoint(w, u - 0.022, 0, amp);
    const end = { x: lerp(top.x, bot.x, sh), y: lerp(top.y, bot.y, sh) };
    arcs.push(`M${f3(top.x)} ${f3(top.y)}Q${f3(c.x)} ${f3(c.y)} ${f3(end.x)} ${f3(end.y)}`);
  });
  return (
    <InFog amount={fogAt(o.scene, o.distM) * 0.6}>
      <path d={arcs.join("")} fill="none" stroke={OCEAN.mono} strokeOpacity={0.97} strokeWidth={f3(Math.max(11 / o.a, 2.2))} strokeLinecap="round" />
    </InFog>
  );
};
/** the dolphin with a cream rim of light round its silhouette (heavier on top, from the surface): it must
 *  read against the teal at phone size */
const RimmedDolphin: React.FC<React.ComponentProps<typeof Dolphin>> = (p) => {
  const o = useOcean();
  const id = `glv2rim${React.useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const px = 1 / o.a;
  return (
    <>
      <defs>
        <filter id={id} x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={f3(2.2 * px)} result="d" />
          <feOffset in="d" dy={f3(-1.6 * px)} result="o" />
          <feFlood floodColor={OCEAN.cream} floodOpacity={0.85} />
          <feComposite in2="o" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <Dolphin {...p} fog={0} />
      </g>
      <Dolphin {...p} />
    </>
  );
};
const Underwater: React.FC<{ f: number }> = ({ f }) => {
  const T = T0 + f;
  const g = gearAt(f);
  const dol = dolphinAt(f);
  const wp = whaleAt(f);
  const whale = { x: wp.x, y: wp.y, L: WHALE_L, facing: 1 as const, tilt: wp.tilt, frame: wp.phase * 10, period: 10, amp: whaleAmp(f), bend: wp.bend };
  return (
    <>
      {f >= F_WHALE_ON ? (
        <DepthGroup z={WHALE_Z}>
          <Whale {...whale} />
          <WhaleWraps f={f} />
        </DepthGroup>
      ) : null}
      <Floater at={PLAT} frame={T} />
      <WhaleLine f={f} T={T} />
      <DepthGroup z={CABLE.z}>
        <Wraps f={f} layer="back" />
        <CableAccent layer="under" />
        <DynamicCable cable={CABLE} />
        <CableAccent layer="over" />
        {f >= F_DOLPHIN_ON ? <RimmedDolphin x={dol.x} y={dol.y} L={DOL_L} facing={1} tilt={dol.tilt} frame={dol.beat * 10} period={10} amp={dol.amp} bend={dol.bend} /> : null}
        <InFog>
          {f >= F_ROPE_ON ? <FloatRope f={f} T={T} /> : null}
          {f >= F_TANGLE_ON ? <TangleCoil f={f} T={T} /> : null}
        </InFog>
        {f >= F_GEAR_ON ? <GearFront g={g} f={f} T={T} /> : null}
        <Wraps f={f} layer="front" />
      </DepthGroup>
    </>
  );
};

const GhostLinesV2: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const c = camAt(f);
  const T = T0 + f;
  const v = viewAt(f);
  return (
    <AbsoluteFill>
      <OceanStage frame={T} cam={{ x: c.x, y: c.y, k: c.k }} scene={SCENE_BC} horizon={c.hor} rest={REST} sway overlay={
          <>
            <AboveWater v={v} T={T} />
            <DipBubbles f={f} />
          </>
        }
      >
        <Underwater f={f} />
      </OceanStage>
    </AbsoluteFill>
  );
};
export default GhostLinesV2;

/** The cut's timeline as data (for checks / sheets; not used by the render). */
export const ghostLinesTimeline = { camAt, viewAt, domeY, gearAt, dolphinAt, whaleAt, whalePoint, panelCentre, tangleAt, ropeFloatAt, WHALE_Z, CATCH_PED, A };
