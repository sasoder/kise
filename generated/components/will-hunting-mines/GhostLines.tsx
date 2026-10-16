import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  DepthGroup,
  Dolphin,
  DynamicCable,
  FloatingPlatform,
  GhostLine,
  OCEAN,
  OceanStage,
  PLATFORM,
  SCENE_BC,
  Whale,
  cableWidths,
  ghostStrand,
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
  unproject,
  useOcean,
  type Cam,
  type CablePoint,
  type GhostLineProps,
  type OceanView,
} from "../kits/cheeky-pint/oceanShared";
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

const F_CONTACT = 56; // the gear's dangling line lands on the cable
const F_WRAP_END = 66;
const SWING = [57, 86] as const; // the current carries the net over the top to the downstream side
const DRIFT_V = 2.7; // local px / frame along the current (visibly carried)
const F_GEAR_ON = 24; // first frame drawn (fully off-frame left then; checked in the sheets)
const F_CATCH = 106;

// =============================================================================================
// CAMERA — a keyed focus track (a point on the cable plane, where it sits on screen, zoom, tilt),
// monotone-cubic between keys, then the house damped follower (CAM_STIFF / CAM_DAMP) on x, y, ln k
// and the horizon. Full precision throughout.
// =============================================================================================
type Key = { f: number; s: number; ox: number; oy: number; sx: number; sy: number; k: number; hor: number };
const HANG0 = CABLE.at(0);
const KEYS: Key[] = [
  // over/under: the turbine column's waterline (360, 0) at screen (540, 1265)
  { f: 0, s: 0, ox: 360 - HANG0.x, oy: 0 - HANG0.y, sx: 540, sy: 1265, k: 0.45, hor: 1262 },
  { f: 12, s: 0, ox: 360 - HANG0.x, oy: 16 - HANG0.y, sx: 540, sy: 1246, k: 0.47, hor: 1259 },
  // under: down the hang-off toward the sag bend
  { f: 23, s: 0.11, ox: 0, oy: 0, sx: 560, sy: 920, k: 1.4, hor: 1230 },
  // the hump: the gear comes in from the left edge on the current
  { f: 33, s: SNAG_S, ox: -16, oy: -7, sx: 560, sy: 900, k: 5.4, hor: 1206 },
  { f: 50, s: SNAG_S, ox: -5, oy: -2, sx: 550, sy: 885, k: 8.4, hor: 1192 },
  // the snag: contact at f56
  { f: 62, s: SNAG_S, ox: 0, oy: 0, sx: 555, sy: 880, k: 12.4, hor: 1186 },
  { f: 73, s: SNAG_S, ox: 0, oy: 0, sx: 330, sy: 760, k: 13.2, hor: 1182 },
  // the catch: the left module wholly out of frame, the next one right just outside
  { f: 96, s: SNAG_S, ox: 0, oy: 0, sx: 176, sy: 610, k: 13.4, hor: 1180 },
  { f: 122, s: SNAG_S, ox: 0, oy: 0, sx: 176, sy: 600, k: 13.4, hor: 1180 },
  // ease back for the whale above; a slow drift carries on through the end
  { f: 165, s: SNAG_S, ox: 0, oy: 0, sx: 134, sy: 585, k: 10.45, hor: 1180 },
  { f: 240, s: SNAG_S, ox: 0, oy: 0, sx: 124, sy: 545, k: 9.85, hor: 1180 },
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
const TRACK: CamH[] = (() => {
  const keys = Object.keys(focusTarget(0)) as (keyof Focus)[];
  const out: CamH[] = [];
  let c = focusTarget(0);
  const v: Focus = { fx: 0, fy: 0, sx: 0, sy: 0, lk: 0, hor: 0 };
  for (let f = 0; f <= DURATION + 2; f++) {
    if (f > 0) {
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
const camAt = (f: number): CamH => TRACK[Math.max(0, Math.min(TRACK.length - 1, f))];
/** Snow / ray parallax origin: near the snag at the close zoom (the camera spends most of the cut there). */
const REST: Cam = { x: TRACK[DURATION].x, y: TRACK[DURATION].y, k: TRACK[DURATION].k };
const swayAt = (T: number) => ({ x: 3 * Math.sin(T / 23), y: 5 * Math.sin(T / 19) }); // = OceanStage's sway
const viewAt = (f: number): OceanView => {
  const c = camAt(f);
  return makeView({ frame: T0 + f, cam: c, scene: SCENE_BC, horizon: c.hor, sway: swayAt(T0 + f) });
};

// =============================================================================================
// THE GHOST GEAR — drawn here (a variant of the module's GhostLine for a FREE, tumbling piece):
// a torn, flattened panel of diamond-mesh net with floats on its head rope, a dangling line from its
// lower corner and long monofilament lines streaming off it. It drifts in from off-frame left on the
// current; the dangling line lands on the cable (contact f56) and coils round it (the module's
// GhostLine coils); the current carries the net over the top of the cable, tumbling, and it streams
// downstream, floats up, held by that line. Then the dolphin swims into it.
// =============================================================================================
type P = { x: number; y: number };
const PANEL = { w: 26, h: 12, cols: 10, rows: 7 } as const;
/** where the main line ties on: the panel's lower corner node (never torn) */
const PANEL_K = { i: PANEL.cols, j: PANEL.rows - 1 } as const;
const DRIFT_DIR = (() => {
  const l = Math.hypot(1, 0.5);
  return { x: 1 / l, y: 0.5 / l };
})();
const DANGLE = { r: 11, ang: Math.atan2(-10.6, -2.8) } as const; // corner relative to the line's end, before contact
const SETTLED = { r: 25, ang: 1.25, line: 27 } as const; // corner relative to the snag once it streams downstream
const rot2 = (v: P, a: number): P => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });
const add = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
const polar = (r: number, a: number): P => ({ x: r * Math.cos(a), y: r * Math.sin(a) });

type Gear = {
  /** the line's end: drifting (before contact) or the snag point */
  T: P;
  /** the panel's tie corner, the panel's in-plane rotation, its tumble squash (signed), bunching */
  K: P;
  rot: number;
  sq: number;
  bunch: number;
  /** main line length (T -> K); coil wrap 0..1; the long lines' streaming direction (rad) */
  line: number;
  wrap: number;
  stream: number;
};
/** the panel in its settled, streaming pose (no dolphin) at a frame */
const settledGear = (f: number): Gear => {
  const ang = SETTLED.ang + 0.06 * Math.sin(f * 0.045);
  const r = SETTLED.r + 0.5 * Math.sin(f * 0.05 + 1);
  return {
    T: { x: A.x, y: A.y },
    K: add(A, polar(r, ang)),
    rot: 0.05 * Math.sin(f * 0.04 + 0.4),
    sq: -0.88 - 0.08 * Math.sin(f * 0.05),
    bunch: 0,
    line: SETTLED.line,
    wrap: 1,
    stream: Math.atan2(0.35, 1) + 0.08 * Math.sin(f * 0.037),
  };
};
/** the panel's centre given its tie corner and pose */
const panelCentre = (g: Gear): P => {
  const kl = panelLocal(PANEL_K.i, PANEL_K.j, PANEL.w, PANEL.h, PANEL.cols, PANEL.rows, g.sq, g.bunch, 0, 3, false);
  const cl = panelLocal(PANEL.cols / 2, 3, PANEL.w, PANEL.h, PANEL.cols, PANEL.rows, g.sq, g.bunch, 0, 3, false);
  return add(g.K, rot2({ x: cl.x - kl.x, y: cl.y - kl.y }, g.rot));
};
const gearFree = (f: number): Gear => {
  const T0p = (() => {
    const d = Math.max(0, F_CONTACT - f) * DRIFT_V;
    return { x: A.x - DRIFT_DIR.x * d, y: A.y - DRIFT_DIR.y * d };
  })();
  // tumbling slowly on the current: in-plane roll and a turn about its vertical axis (width breathes)
  const rotPre = 0.15 + 0.14 * Math.sin(f * 0.05);
  const sqPre = 0.86 + 0.13 * Math.cos(f * 0.055 + 0.5);
  const sway = 0.12 * Math.sin(f * 0.07);
  if (f <= F_CONTACT) {
    return { T: T0p, K: add(T0p, polar(DANGLE.r, DANGLE.ang + sway)), rot: rotPre, sq: sqPre, bunch: 0, line: DANGLE.r + 0.5, wrap: 0, stream: Math.atan2(-0.3, -1) };
  }
  const st = settledGear(f);
  const u = clamp01((f - SWING[0]) / (SWING[1] - SWING[0]));
  const e = smoothstep(u) * 0.75 + (1 - Math.pow(1 - u, 2)) * 0.25;
  const a0 = DANGLE.ang + 0.12 * Math.sin(F_CONTACT * 0.07);
  // over the top: clockwise from up-left to down-right; the line pays out as the net drifts off
  const ang = lerp(a0, Math.atan2(st.K.y - A.y, st.K.x - A.x), e);
  const r = lerp(DANGLE.r, Math.hypot(st.K.x - A.x, st.K.y - A.y), smoothstep(Math.min(1, e * 1.25)));
  // the net turns over in the current as it goes (squash passes through edge-on) and settles floats-up
  const sq0 = 0.86 + 0.13 * Math.cos(F_CONTACT * 0.055 + 0.5);
  const sq = lerp(sq0, st.sq, smoothstep((u - 0.15) / 0.6));
  return {
    T: { x: A.x, y: A.y },
    K: add(A, polar(r, ang)),
    rot: lerp(0.15 + 0.14 * Math.sin(F_CONTACT * 0.05), st.rot, e),
    sq, // passes edge-on once as it turns over
    bunch: 0,
    line: lerp(DANGLE.r + 0.5, SETTLED.line, smoothstep(Math.min(1, e * 1.25))),
    wrap: clamp01((f - F_CONTACT) / (F_WRAP_END - F_CONTACT)),
    stream: lerp(Math.atan2(-0.3, -1), st.stream, e), // over the top, with the net
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

// =============================================================================================
// THE DOLPHIN: cruises in from the left under the cable into the net; the net takes its tail stock.
// Then it is CAUGHT: it thrashes against the line — lunges that snap the line taut and jerk it back,
// strong body flexes, its head turning back toward the line, fast fluke beats that get it nowhere —
// weakening through the hold but never still.
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
/** thrash envelope: full through "dolphins", weaker by the end but alive */
const thrashE = (f: number) => lerp(1, 0.5, smoothstep((f - 140) / 60));
/** the thrash cycle (frames per cycle grows as it tires) — integrated to a phase */
const CYCLE: number[] = (() => {
  const out: number[] = [];
  let ph = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(ph);
    if (f >= F_TAUT) ph += 1 / lerp(19, 27, smoothstep((f - F_TAUT) / 80));
  }
  return out;
})();
const cycAt = (f: number) => CYCLE[Math.max(0, Math.min(CYCLE.length - 1, f))];
/** 0 = line taut (end of a lunge), 1 = pulled back: lunge accelerates into the taut line, snaps, jerks back */
const tugShape = (p: number) => {
  if (p < 0.42) return 1 - Math.pow(p / 0.42, 2); // lunging forward, accelerating
  if (p < 0.54) return 0.75 * (1 - Math.pow(1 - (p - 0.42) / 0.12, 2)); // snapped taut: jerked back
  return lerp(0.75, 1, smoothstep((p - 0.54) / 0.46)); // gathering for the next lunge
};
/** fluke beats: fast while it lunges, slower while it gathers; integrated (cycles) */
const BEAT: number[] = (() => {
  const out: number[] = [];
  let ph = 0;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(ph);
    let P = 22;
    if (f >= F_CATCH) {
      const p = cycAt(f) % 1;
      const lunging = p < 0.5 ? 1 : 0.35;
      P = lerp(22, lerp(13, 8, lunging * thrashE(f)), smoothstep((f - F_CATCH) / 4));
    }
    ph += 1 / P;
  }
  return out;
})();
/** the dolphin and the gear it is caught in (after the catch the gear follows the dolphin) */
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
  // the tail stock: carried on by the run-out until the line snaps taut (F_TAUT), then the tug cycle
  const rpTaut = R_PED_CATCH + 2.2;
  const rp = f < F_TAUT ? lerp(R_PED_CATCH, rpTaut, clamp01((f - F_CATCH) / (F_TAUT - F_CATCH))) : rpTaut - E * 0.35 * tugShape(p);
  const psi = lerp(ANG_PED_CATCH, 0.62, smoothstep((f - F_CATCH) / 22)) + E * 0.07 * Math.sin(2 * Math.PI * (cycAt(f) * 0.5));
  const ped = add(A, polar(rp, psi));
  // the net is drawn tight round the tail stock (gathered), its tied corner turned back up the line
  const sq = lerp(CATCH_GEAR.sq, -0.42, ease);
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
  const gear: Gear = { T: { x: A.x, y: A.y }, K, rot, sq, bunch, line: lerp(SETTLED.line, line, clamp01((f - F_CATCH) / (F_TAUT - F_CATCH))), wrap: 1, stream: CATCH_GEAR.stream };
  // heading: away from the snag along the line; the head swings back toward the line after each snap
  const lineAng = Math.atan2(ped.y - A.y, ped.x - A.x);
  const base = lerp(TAU0, lineAng - 0.12, smoothstep((f - F_CATCH) / 14));
  const headBack = p > 0.42 ? Math.sin(Math.PI * clamp01((p - 0.42) / 0.5)) : 0;
  const tilt = base - E * 0.42 * headBack + E * 0.06 * Math.sin(2 * Math.PI * p);
  const hd = { x: Math.cos(tilt), y: Math.sin(tilt) };
  const flexIn = smoothstep((f - F_CATCH) / 6);
  const bend = flexIn * E * (-0.2 * headBack + 0.12 * Math.sin(2 * Math.PI * p * 2));
  return { x: ped.x - hd.x * PED_U, y: ped.y - hd.y * PED_U, tilt, ped, beat, amp: lerp(0.045, 0.06 + 0.05 * E, flexIn), bend, gear };
};
/** the gear at a frame: free, then snagged and streaming, then on the dolphin */
const gearAt = (f: number): Gear => {
  if (f <= F_CATCH) return gearFree(f);
  return dolphinAt(f).gear as Gear;
};
const F_DOLPHIN_ON = 76; // first frame drawn (fully off-frame left then: checked in the sheets)

// =============================================================================================
// THE WHALE: behind the cable in the haze ABOVE the snag, caught too: a clump of net and wraps of
// line on its tail stock, long lines trailing from its flukes and one from a flipper. It glides in from
// the upper right along its heading (nose down), then levels off and slows above the cable. Constant
// depth. It enters from off-frame rather than out of heavy fog: InFog leaves antialiased edges and thin
// cream rims/lines visible even at fog 0.96, so a far whale would "ghost in" as an outline.
// =============================================================================================
const WHALE_L = 148;
const WHALE_Z = -800; // depth (fog ~0.54): ~720 px long on screen at the end
const WHALE_END_SCREEN = { x: 520, y: 262 };
const WHALE_PERIOD = 70;
/** heading (rad, + = nose down) and speed (local px / frame) along it */
const whaleHeading = (f: number) => lerp(0.72, 0.04, smoothstep((f - 118) / 48));
const whaleSpeed = (f: number) => lerp(3.8, 0.95, smoothstep((f - 126) / 40));
const WHALE_PATH: { x: number; y: number; tilt: number }[] = (() => {
  const v = viewAt(DURATION);
  const end = unproject(v, WHALE_END_SCREEN.x, WHALE_END_SCREEN.y, WHALE_Z);
  const out: { x: number; y: number; tilt: number }[] = [];
  let p = { x: end.x, y: end.y };
  for (let f = DURATION + 2; f >= 0; f--) {
    const th = whaleHeading(f);
    out[f] = { x: p.x, y: p.y, tilt: th };
    // step back one frame along the heading (facing left: travel = (-cos, +sin))
    const sp = whaleSpeed(f);
    p = { x: p.x + Math.cos(th) * sp, y: p.y - Math.sin(th) * sp };
  }
  return out;
})();
const whaleAt = (f: number) => WHALE_PATH[Math.max(0, Math.min(WHALE_PATH.length - 1, f))];
/** a point on the whale's body (u along it from the nose, off = local y below the spine), facing left,
 *  following the Whale component's body wave (same amp/period) so gear stays on the body */
const whalePoint = (w: { x: number; y: number; tilt: number }, u: number, off: number, T: number) => {
  const ph = (2 * Math.PI * T) / WHALE_PERIOD;
  const sy = 0.025 * WHALE_L * (0.12 + 0.88 * Math.pow(u, 2.2)) * Math.sin(ph - 2 * Math.PI * 0.85 * u);
  const lx = -(0.5 - u) * WHALE_L; // facing -1: scale(-1, 1)
  const ly = sy + off;
  const a = -w.tilt; // rotate(tilt * facing)
  return { x: w.x + lx * Math.cos(a) - ly * Math.sin(a), y: w.y + lx * Math.sin(a) + ly * Math.cos(a) };
};
const F_WHALE_ON = 100; // fully off-frame (upper right) then; checked in the sheets
/** the whale's own gear: net clump and wraps on the tail stock, trailing lines (brighter, heavier
 *  strokes than the snag's: they must read at phone size behind the haze) */
const WhaleGear: React.FC<{ w: { x: number; y: number; tilt: number }; T: number }> = ({ w, T }) => {
  const o = useOcean();
  const fog = fogAt(o.scene, o.distM) * 0.55;
  const back = { x: Math.cos(w.tilt), y: -Math.sin(w.tilt) };
  const pt = (u: number, off: number) => whalePoint(w, u, off, T);
  const ax0 = pt(0.76, 0);
  const ax1 = pt(0.9, 0);
  const axis = Math.atan2(ax1.y - ax0.y, ax1.x - ax0.x);
  const wraps = [0.79, 0.825, 0.86].map((u, i) => {
    const top = pt(u, -0.04 * WHALE_L);
    const bot = pt(u, 0.036 * WHALE_L);
    const c = pt(u - 0.018, 0);
    return <path key={i} d={`M${f3(top.x)} ${f3(top.y)}Q${f3(c.x)} ${f3(c.y)} ${f3(bot.x)} ${f3(bot.y)}`} fill="none" stroke={OCEAN.mono} strokeOpacity={0.95} strokeWidth={f3(3 / o.a)} strokeLinecap="round" />;
  });
  const tail = pt(0.86, 0.01 * WHALE_L);
  const fin = pt(0.32, 0.07 * WHALE_L);
  const l1 = ghostStrand({ anchor: tail, current: { x: back.x, y: back.y - 0.12 }, frame: T, seed: 9, length: 95, wrap: 1 }, 0);
  const l2 = ghostStrand({ anchor: pt(0.82, 0.02 * WHALE_L), current: { x: back.x, y: back.y + 0.2 }, frame: T + 17, seed: 13, length: 70, wrap: 1 }, 0);
  const l3 = ghostStrand({ anchor: fin, current: { x: back.x * 0.7, y: back.y + 0.7 }, frame: T + 5, seed: 21, length: 50, wrap: 1 }, 0);
  return (
    <InFog amount={fog}>
      <Mono pts={l1} w={3.4} op={0.95} />
      <Mono pts={l2} w={2.8} op={0.9} />
      <Mono pts={l3} w={2.6} op={0.9} />
      {wraps}
      <NetPanel k={pt(0.82, -0.015 * WHALE_L)} ai={4} aj={1} w={24} h={15} cols={8} rows={7} rot={axis} sq={0.78} bunch={0.75} frame={T} seed={41} floats={[-0.34, 0.3]} weight={1.6} />
    </InFog>
  );
};

// =============================================================================================
// ABOVE THE WATER — the over/under opening. Screen-px overlay clipped above the dome's waterline,
// projected with the stage's own camera (same view, same sway).
// =============================================================================================
const SKY = { top: "#AEB8AE", mid: "#D3D2C2", low: "#E9E3D0", haze: "#EFEADA" } as const;
const SEA_UP = { far: "#BFC3B3", near: "#6C877D", glint: OCEAN.cream } as const;
const PAINT = { hi: "#F1EBDD", mid: "#DDD6C6", lo: "#ABA597", deep: "#8B867A", seam: "#9B9586" } as const;
const TURBINE = { hub: -102, R: 80, yaw: 0.46, rpmFrames: 150 } as const; // metres; a V164-class rotor
const G_DOME = 260; // screen px of dome waterline travel per metre of eye height
const wave = (x: number, T: number) => 3.2 * Math.sin(x / 74 + T * 0.21) + 1.6 * Math.sin(x / 29 - T * 0.37 + 1.3);
const domeY = (v: OceanView) => v.horizon + G_DOME * (-(v.eye.y - SCENE_BC.surfaceY) / SCENE_BC.pxPerM);

const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString();
const poly = (pts: { x: number; y: number }[]) => `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}Z`;

const AboveWater: React.FC<{ v: OceanView; T: number }> = ({ v, T }) => {
  const split = domeY(v);
  if (split < -20) return null;
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
      <g clipPath="url(#gl_above)">
        <rect x={-20} y={-40} width={1120} height={seaTop + 41} fill="url(#gl_sky)" />
        <rect x={-20} y={-40} width={1120} height={seaTop + 41} fill="url(#gl_sun)" />
        {/* a band of haze lying on the horizon */}
        <rect x={-20} y={hor - 70} width={1120} height={70} fill={SKY.haze} opacity={0.45} style={{ filter: "blur(18px)" }} />
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
        <linearGradient id="gl_under" gradientUnits="userSpaceOnUse" x1="0" y1={f3(split)} x2="0" y2={f3(split + 34)}>
          <stop offset="0" stopColor={OCEAN.sky} stopOpacity="0.55" />
          <stop offset="1" stopColor={OCEAN.sky} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={-20} y={split - 6} width={1120} height={42} fill="url(#gl_under)" />
      <path d={clip.line} fill="none" stroke="#38524C" strokeOpacity={0.55} strokeWidth={4} transform="translate(0 -2)" />
      <path d={clip.line} fill="none" stroke={OCEAN.sky} strokeOpacity={0.9} strokeWidth={2.2} transform="translate(0 1.5)" />
    </svg>
  );
};

// =============================================================================================
// THE WORLD UNDER THE WATER
// =============================================================================================
const COIL_OFFSETS = [0, SNAG_GHOST_2.along, SNAG_GHOST_3.along] as const;
/** the coils round the cable (the module's GhostLine, coils only: no strands, no net) */
const Coils: React.FC<{ wrap: number; frame: number; layer: "back" | "front"; cw: number }> = ({ wrap, frame, layer, cw }) => (
  <>
    {COIL_OFFSETS.map((off, i) => (
      <GhostLine
        key={i}
        anchor={{ x: A.x + A.tx * off, y: A.y + A.ty * off }}
        tangent={{ x: A.tx, y: A.ty }}
        cableW={cw}
        wrap={clamp01(wrap * (1 + 0.2 * i) - 0.2 * i)}
        frame={frame}
        seed={[3, 7, 11][i]}
        strands={0}
        net={null}
        layer={layer}
      />
    ))}
  </>
);
/** the snag's gear in front of the cable: the main line, the long monofilament lines, the net panel */
const GearFront: React.FC<{ g: Gear; T: number }> = ({ g, T }) => {
  const main = sagLine(g.T, g.K, g.line, T);
  // the long lines come off the panel's head-rope end and middle, streaming
  const tl = add(g.K, rot2({ x: -PANEL.w * g.sq, y: -PANEL.h * 0.9 }, g.rot));
  const tm = add(g.K, rot2({ x: -0.62 * PANEL.w * g.sq, y: -PANEL.h * 0.15 }, g.rot));
  const dir = { x: Math.cos(g.stream), y: Math.sin(g.stream) };
  const l1 = ghostStrand({ anchor: tl, current: dir, frame: T, seed: 5, length: 34, wrap: 1 }, 0);
  const l2 = ghostStrand({ anchor: tm, current: { x: dir.x, y: dir.y + 0.15 }, frame: T + 9, seed: 17, length: 26, wrap: 1 }, 0);
  return (
    <InFog>
      <Mono pts={l1} />
      <Mono pts={l2} w={STROKE_PX.mono} op={0.75} />
      <Mono pts={main} w={STROKE_PX.mono * 1.5} op={0.95} />
      <NetPanel k={g.K} ai={PANEL_K.i} aj={PANEL_K.j} w={PANEL.w} h={PANEL.h} cols={PANEL.cols} rows={PANEL.rows} rot={g.rot} sq={g.sq} bunch={g.bunch} frame={T} seed={3} />
    </InFog>
  );
};
const Underwater: React.FC<{ f: number }> = ({ f }) => {
  const o = useOcean();
  const T = T0 + f;
  const g = gearAt(f);
  const dol = dolphinAt(f);
  const cw = cableWidths(o, CABLE).w;
  const wp = whaleAt(f);
  const whale = { x: wp.x, y: wp.y, L: WHALE_L, facing: -1 as const, tilt: wp.tilt, frame: T, period: WHALE_PERIOD };
  return (
    <>
      {f >= F_WHALE_ON ? (
        <DepthGroup z={WHALE_Z}>
          <Whale {...whale} />
          <WhaleGear w={wp} T={T} />
        </DepthGroup>
      ) : null}
      <FloatingPlatform at={PLAT} frame={T} />
      <DepthGroup z={CABLE.z}>
        <Coils wrap={g.wrap} frame={T} layer="back" cw={cw} />
        <DynamicCable cable={CABLE} />
        {f >= F_DOLPHIN_ON ? <Dolphin x={dol.x} y={dol.y} L={DOL_L} facing={1} tilt={dol.tilt} frame={dol.beat * 10} period={10} amp={dol.amp} bend={dol.bend} /> : null}
        {f >= F_GEAR_ON ? <GearFront g={g} T={T} /> : null}
        <Coils wrap={g.wrap} frame={T} layer="front" cw={cw} />
      </DepthGroup>
    </>
  );
};

const GhostLines: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const c = camAt(f);
  const T = T0 + f;
  const v = viewAt(f);
  return (
    <AbsoluteFill>
      <OceanStage frame={T} cam={{ x: c.x, y: c.y, k: c.k }} scene={SCENE_BC} horizon={c.hor} rest={REST} sway overlay={<AboveWater v={v} T={T} />}>
        <Underwater f={f} />
      </OceanStage>
    </AbsoluteFill>
  );
};
export default GhostLines;

/** The cut's timeline as data (for checks / sheets; not used by the render). */
export const ghostLinesTimeline = { camAt, viewAt, domeY, gearAt, dolphinAt, whaleAt, whalePoint, panelCentre, WHALE_Z, CATCH_PED, A };
