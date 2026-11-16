// ---------------------------------------------------------------------------
// TwentyWatts (rsi-stupidest-species, cut 83). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 130 frames.
// REVISION 1 (re-based on cut I1 TooBigToFit revision 1): I1's world carries on: the tiled sand floor, the horizon haze,
// the misty teal air (AirStage, palette A, fog by depth, motes) and the low stone plinth; the clip's shared BRAIN
// (./brainShared, W3, read-only) and the body's power: one cream hub on the plinth feeding three cream lines.
//
// CHECK LINE: "The brain gets a small fixed share of the body's power, about 20 watts, because digestion and immunity
//   need theirs."
//
// THE LINE: "And the brain only gets to consume 20 watts of energy, lest functions like digestion and immunity, which"
// WORD -> FRAME: And -2 · the 3 · brain 5 · only 10 · gets 18 · to 25 · consume 27 · 20 36 · watts 45 · of 52 ·
//   energy 57 · lest 63 · functions 74 · like 80 · digestion 93 · and 103 · immunity 112 · which 119
// DURATION: the slot 83.375 -> 88.797 s (sequence frames 1999-2129) = 5.422 s x 23.976 = 130 frames (f0..f129).
//
// THE JOIN: f0 is cut I1's last frame (f77) pixel for pixel: I1's camera, air frame, floor, plinth, pelvis, contact rim
// and the swollen, tilted brain jammed in the inlet are rebuilt here from I1's exported state (asserted at module load).
//
// THE MOTION: one continuous move. f0-24 ("And the brain only gets"): the brain pops up out of the inlet and rises
// (the same drawing as I1, it only untilts and drifts left); the camera cranes up with it. The pelvis dissolves into the
// air (gone by f14) and where it stood a squat cream hub rises out of the plinth's top (f6-20). f16-28: a thin cream
// cord is drawn up from the hub by its moving tip and docks on the brain stem (CONTACT f28). The first cream bead arrives
// f30 ("consume" f27): the brain lights from inside with a modest orange glow (0 -> ~0.45 by f42, a small swell of glow
// per bead, one bead every 10 frames). f37-49 ("20 watts"): the soft plate 20 W slides up beside the brain. f40-102 ("of
// energy, lest functions like"): the camera pulls back down the cord to the hub, and a stomach (left) and a white blood
// cell (right) come forward out of the haze (f48-86 / f54-92) to hover either side of it. Each gets a much THICKER
// line drawn out from the hub (f80-88 / f86-94) running busy, fat beads; the first bead reaches the stomach on f93
// ("digestion": it lights, warms and churns) and the cell on f112 ("immunity": aura, pseudopods reach). f112-129:
// living hold, three consumers on one source, the brain's thin trickle beside the two thick streams; camera creeps.
// Camera: k 1.129 -> 0.675, up with the brain (cy -306 -> -662 by f20), then the long pull-back down the cord
// (-> -218). Resolved: brain ~300 px at y ~430, plate cap ~61 px, organs ~270 px at y ~840, hub at y ~1000 on the
// plinth.
// Orange = intelligence only: the brain's inner glow is the one orange. The energy (cord, beads, hub) is cream;
// digestion and immunity are earthy (muted red-brown stomach, ivory cell, slate nucleus) and light up in cream.
//
// SOURCES: the brain runs on ~20 W, about 20 % of the body's resting metabolism: Raichle & Gusnard 2002, PNAS
//   99:10237 ("Appraising the brain's energy budget"); Balasubramanian 2021, PNAS 118:e2107022118 ("Brain power",
//   ~20 W). The speaker's figure: "20 watts". No other figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirBox, AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, Paint, WorldSvg, airWorldOf, c01, makeCamera, mixHex, pchip, perspective, rgbHex, swayCam, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Brain, Pelvis, brainBox } from "./brainShared";
import * as I1 from "./TooBigToFit";

export const FPS = 24000 / 1001;
export const DURATION = 130;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: barlow } = loadFont("normal", { weights: ["600"], subsets: ["latin"] });
const PAL = AIR.A;
const n2 = (v: number) => v.toFixed(2);
const ease = Easing.bezier(0.45, 0, 0.25, 1);
const easeOut = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const sstep = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};

// ===================================================================================================================
// THE JOIN WITH CUT I1 (TooBigToFit rev 1): its last frame and the constants it does not export, asserted here
// ===================================================================================================================
/** I1's last frame: my f is I1's f + I1_LAST (air frame, camera sway, the brain's breath) */
export const I1_LAST = I1.DURATION - 1;
const I1_BX = I1.PELVIS_C[0] - 22;
const I1_PIVOT_Y = I1.PELVIS_C[1];
const I1_YC = I1.PELVIS_C[1] + 46;
const I1_THICK = 20;
{
  const b = I1.brainWorldBox(I1_LAST);
  if (Math.abs((b.left + b.right) / 2 - I1_BX) > 1e-6) throw new Error("TwentyWatts: I1 brain x moved");
  if (Math.abs(I1.brainY(I1_LAST) - (I1_YC + 5 * I1.pressAt(I1_LAST))) > 1e-6) throw new Error("TwentyWatts: I1 brain y moved");
  if (I1.BRAIN_SIZE !== 270 || I1.PELVIS_W !== 800 || I1.TILT !== 0.68 || I1.PLINTH.top !== -120 || I1.DEPTH.eyeY !== -640) throw new Error("TwentyWatts: I1 constants moved");
}
/** I1's contact-rim light (copied: not exported) */
const i1RimAmt = (f: number) => {
  const t1 = f - I1.F_CONTACT;
  const t2 = f - I1.F_PRESS2;
  const flash = (t: number, a: number) => (t <= 0 ? 0 : a * Math.min(1, t / 2.5) * Math.exp(-Math.max(0, t - 2.5) / 6));
  const floor = t1 > 0 ? 0.28 * Math.min(1, t1 / 8) : 0;
  return Math.min(1, Math.max(flash(t1, 1), flash(t2, 0.7), floor));
};
const I1_REST = I1.camOf(0);
const I1_B = I1.brainState(I1_LAST);

// ===================================================================================================================
// THE WORLD (I1's: X across, Y height with the floor Y = 0 (up -), Z depth; everything here on the front plane Z = 0
// unless it comes out of the haze)
// ===================================================================================================================
const PLINTH = I1.PLINTH;
/** the brain: I1's size and swell (the same drawing); where it rises to (anchor = bottom centre) */
export const BRAIN_SIZE = I1.BRAIN_SIZE;
export const BRAIN_SWELL = I1_B.swell;
export const BX_REST = -235;
export const BY_REST = -824;
const BB = brainBox(BRAIN_SIZE, BRAIN_SWELL);
/** the stem tip relative to the anchor (brainShared's geometry at swell 0.99: the stem's lowest run, x / size) */
const STEM_DX = 0.297 * BRAIN_SIZE;

/** the plate: "20 W", beside the brain at its centre row (cap in world units: ~61 px at the resolved zoom) */
export const PLATE = { cap: 90, track: 0.05, text: "20 W", X: 0, Y: BY_REST + BB.cy };
/** Barlow Condensed 600 advance widths (em) for the plate's glyphs */
const ADV: Record<string, number> = { "2": 0.5, "0": 0.5, " ": 0.2, W: 0.74 };
export const plateBox = () => {
  const fs = PLATE.cap / 0.7;
  const w = [...PLATE.text].reduce((s, ch) => s + (ADV[ch] ?? 0.5) * fs, 0) + fs * PLATE.track * (PLATE.text.length - 1);
  const pad = PLATE.cap * 0.62;
  return { fs, w, wP: w + pad * 2, hP: PLATE.cap + pad * 1.9 };
};
PLATE.X = BX_REST + BB.right + 58 + plateBox().wP / 2;

/** the body's power: the hub stands on the plinth's top where the pelvis stood (base, full height, radius); the
 *  organs hover either side of it on the front plane (they come forward out of the haze) */
export const HUB = { x: 0, base: PLINTH.top, R: 96, H: 78 };
export const HUB_MID = HUB.base - HUB.H / 2;
export const STOMACH = { x: -398, y: -394, scale: 0.55 };
export const CELL = { x: 427, y: -382, size: 360 };
/** line widths (world): the brain's thin cord, the two thick lines */
export const W_THIN = 7.5;
export const W_THICK = 38;

// ===================================================================================================================
// THE CAMERA (keys: world point at screen centre; f -10 / f0 are I1's own camera so the move starts at zero slope)
// ===================================================================================================================
const K = (f: number, k: number, cx: number, cy: number) => ({ f, k, wx: cx, wy: cy, sx: 540, sy: 960 });
const C_M10 = I1.camAt(I1_LAST - 10);
const C_0 = I1.camAt(I1_LAST);
const camAt = makeCamera(
  [
    K(-10, C_M10.k, C_M10.cx, C_M10.cy),
    K(0, C_0.k, C_0.cx, C_0.cy),
    K(20, 1.0775, -12, -662),
    K(40, 0.9875, -15, -620),
    K(102, 0.685, 0, -228),
    K(129, 0.675, 1, -218),
  ],
  false,
);
export const camOf = (f: number) => swayCam(camAt(f), f + I1_LAST);
export const DEPTH = I1.DEPTH;

// ===================================================================================================================
// TIMINGS
// ===================================================================================================================
export const T = {
  lift: 24, // the brain has popped up and risen
  drift: 34, // ... and drifted left to its rest
  pelvis0: 8, // the brain is clear of the inlet: the pelvis starts back into the haze
  pelvisOut: 18, // ... gone
  hub0: 9, // the hub's lid shows on the plinth's top
  hub1: 22, // ... it has risen to full height
  cord0: 17, // the cord's tip leaves the hub
  cord1: 28, // CONTACT: the cord's plug docks on the brain stem
  bead0: 30, // the first bead reaches the brain (first glow)
  beadEvery: 10,
  plate0: 37, // the plate starts to slide up ("20" f36)
  stom0: 48, // the stomach starts forward out of the haze
  stom1: 86, // ... it hovers in place
  cell0: 54,
  cell1: 92,
  lineS0: 80, // the stomach's thick line is drawn out from the hub
  lineS1: 88,
  lineC0: 86,
  lineC1: 94,
  stomachLit: 93, // the first fat bead reaches the stomach ("digestion")
  cellLit: 112, // ... and the cell ("immunity")
  thickEvery: 5,
};
const V_THIN = 14;
const V_THICK = 18;
/** how deep the organs start (world Z, in the haze) */
const ORGAN_Z0 = 1700;

// ===================================================================================================================
// THE MOTION (pure functions of the frame, exported for the checks)
// ===================================================================================================================
/** the brain's rise (0..1): a quick pop out of the inlet (clear of the rim by f8), then easing up to its rest */
const LIFT = pchip(
  [
    [0, 0],
    [4, 0.05],
    [8, 0.2],
    [14, 0.56],
    [T.lift, 1],
    [T.lift + 6, 1],
  ],
  true,
);
/** the brain: anchor, tilt, I1's breath decaying, the squash, the glow */
export const brainAt = (f: number) => {
  const press = I1.pressAt(I1_LAST + f) * (1 - sstep(f / 6));
  const pc = Math.max(-0.4, press);
  const L = LIFT(f);
  const LX = ease(c01(f / T.drift));
  const bob = 4 * Math.sin((2 * Math.PI * (f - 18)) / 52) * sstep((f - 18) / 14);
  const y = I1_YC + 5 * press + (BY_REST - I1_YC) * L + bob;
  const x = I1_BX + (BX_REST - I1_BX) * LX;
  const rot = I1_B.rot * (1 - ease(c01(f / 22)));
  return { x, y, rot, sx: 1 + 0.065 * pc, sy: 1 - 0.085 * pc, glow: glowAt(f) };
};
/** glow: modest, from the first bead's arrival; each bead adds a small swell */
const glowAt = (f: number) => {
  let glow = 0.42 * sstep((f - T.bead0) / 12);
  for (let t = T.bead0; t <= f; t += T.beadEvery) glow += 0.07 * Math.exp(-(f - t) / 5) * c01((f - t) / 1.5 + 0.34);
  return Math.min(1, glow);
};
/** the brain's box in world units (after the squash about the rim row; rotation ignored), as I1's brainWorldBox */
export const brainWorldBox = (f: number) => {
  const s = brainAt(f);
  const b = brainBox(BRAIN_SIZE, BRAIN_SWELL);
  const sqY = (y: number) => I1_PIVOT_Y + (y - I1_PIVOT_Y) * s.sy;
  return { left: s.x - (b.w / 2) * s.sx, right: s.x + (b.w / 2) * s.sx, top: sqY(s.y + b.top), bottom: sqY(s.y), w: b.w * s.sx };
};
/** the stem tip (world): where the cord docks */
export const stemTip = (f: number): P2 => {
  const b = brainAt(f);
  return [b.x + STEM_DX, b.y - 1.5];
};
/** the pelvis's exit: it holds while the brain pops out, then goes straight back into the haze (depth Z, accelerating)
 *  and fades at the end; the bone's give decays */
export const pelvisAt = (f: number) => {
  const u = c01((f - T.pelvis0) / (T.pelvisOut - T.pelvis0));
  return { Z: 2600 * u * u, moved: f > T.pelvis0, op: 1 - sstep((f - T.pelvis0 - 4) / (T.pelvisOut - T.pelvis0 - 4)), give: 2 * Math.max(0, I1.pressAt(I1_LAST - 1 + f)) * (1 - sstep(f / 6)) };
};
/** the hub: its lid's opacity and its height out of the plinth */
export const hubAt = (f: number) => ({ lid: sstep((f - T.hub0) / 3), h: HUB.H * ease(c01((f - T.hub0 - 2) / (T.hub1 - T.hub0 - 2))) });
/** an organ coming forward out of the haze: depth Z, opacity, and its projected place and scale now */
export const organPose = (f: number, o: { x: number; y: number }, t0: number, t1: number) => {
  const t = c01((f - t0) / (t1 - t0));
  const Z = ORGAN_Z0 * (1 - easeOut(t));
  const P = perspective(camOf(f), DEPTH);
  const at = P.p(o.x, o.y, Z);
  return { Z, op: f < t0 ? 0 : sstep(t / 0.3), at, r: P.r(Z) };
};

// ===================================================================================================================
// GEOMETRY HELPERS
// ===================================================================================================================
type Poly = { pts: P2[]; cum: number[]; len: number };
const polyOf = (pts: P2[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
/** the point and tangent angle at arc length s */
const atS = (p: Poly, s: number): { pt: P2; ang: number } => {
  const ss = Math.max(0, Math.min(p.len, s));
  let i = 1;
  while (i < p.pts.length - 1 && p.cum[i] < ss) i++;
  const a = p.pts[i - 1];
  const b = p.pts[i];
  const seg = p.cum[i] - p.cum[i - 1] || 1;
  const t = (ss - p.cum[i - 1]) / seg;
  return { pt: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
};
/** the run of a polyline from s0 to s1 */
const subPts = (p: Poly, s0: number, s1: number): P2[] => {
  const out: P2[] = [atS(p, s0).pt];
  for (let i = 0; i < p.pts.length; i++) if (p.cum[i] > s0 && p.cum[i] < s1) out.push(p.pts[i]);
  out.push(atS(p, s1).pt);
  return out;
};
const bez = (a: P2, b: P2, c: P2, d: P2, N = 40): P2[] =>
  Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const m = 1 - t;
    return [m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0], m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1]] as P2;
  });
const lineD = (q: P2[]) => `M${q.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}`;
const pt3 = (p: P2) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
/** a smooth closed path through points (Catmull-Rom as cubic Beziers) */
const smoothClosed = (q: P2[], t = 1 / 6) => {
  const n = q.length;
  let d = `M${pt3(q[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n];
    const p1 = q[i];
    const p2 = q[(i + 1) % n];
    const p3 = q[(i + 2) % n];
    d += `C${pt3([p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t])} ${pt3([p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t])} ${pt3(p2)}`;
  }
  return `${d}Z`;
};
/** Catmull-Rom samples of an open run */
const crSample = (q: P2[], N = 60): P2[] => {
  const n = q.length;
  return Array.from({ length: N + 1 }, (_, j) => {
    const s = Math.min(n - 1.0001, (j / N) * (n - 1));
    const i = Math.floor(s);
    const t = s - i;
    const p0 = q[Math.max(0, i - 1)];
    const p1 = q[i];
    const p2 = q[i + 1];
    const p3 = q[Math.min(n - 1, i + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
    return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])] as P2;
  });
};
/** a filled tube along a run: width w(u) (u 0..1 along it), round ends */
const tubeD = (q: P2[], w: (u: number) => number, N = 60, round = true) => {
  const pts = crSample(q, N);
  const L: P2[] = [];
  const R: P2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(N, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const hw = w(i / N) / 2;
    L.push([p[0] - (dy / l) * hw, p[1] + (dx / l) * hw]);
    R.push([p[0] + (dy / l) * hw, p[1] - (dx / l) * hw]);
  });
  const r0 = w(0) / 2;
  const r1 = w(1) / 2;
  const Rr = [...R].reverse();
  if (!round) return `M${[...L, ...Rr].map(pt3).join("L")}Z`;
  return `M${L.map(pt3).join("L")}A${n2(r1)},${n2(r1)} 0 0 0 ${pt3(Rr[0])}L${Rr.map(pt3).join("L")}A${n2(r0)},${n2(r0)} 0 0 0 ${pt3(L[0])}Z`;
};

// ===================================================================================================================
// THE LINES: cream conduits with beads running along them
// ===================================================================================================================
const CREAM = PAL.cream;
const CREAM_LO = PAL.creamLo;
const TUBE_EDGE = mixHex(CREAM_LO, "#5A4E3E", 0.55);
const BEAD = "#FFF7E8";

/** a conduit: the drawn run (from s0 to s1 along p), width w (world), a soft form (edge, body, a highlight) */
const Conduit: React.FC<{ p: Poly; s0?: number; s1?: number; w: number; tone: (hex: string) => string; lit?: number }> = ({ p, s0 = 0, s1, w, tone, lit = 0 }) => {
  const e = s1 ?? p.len;
  if (e - s0 < 0.5) return null;
  const d = lineD(subPts(p, s0, e));
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={tone(TUBE_EDGE)} strokeWidth={w} />
      <path d={d} stroke={tone(mixHex(CREAM_LO, CREAM, 0.25 * lit))} strokeWidth={w * 0.76} />
      <path d={d} stroke={tone(CREAM)} strokeWidth={w * 0.22} strokeOpacity={0.55 + 0.25 * lit} transform={`translate(${n2(-w * 0.13)} ${n2(-w * 0.13)})`} />
    </g>
  );
};
/** beads along a line: each bead given by its arrival time at `end` (an arc length; default the far end), moving at v
 *  (world / frame) and running on under whatever covers the line's end; drawn only up to sMax (a drawing tip) */
const Beads: React.FC<{ p: Poly; f: number; first: number; every: number; v: number; w: number; len: number; end?: number; sMax?: number; uid: string; tone: (hex: string) => string }> = ({
  p,
  f,
  first,
  every,
  v,
  w,
  len,
  end,
  sMax,
  uid,
  tone,
}) => {
  const top = Math.min(sMax ?? p.len, p.len);
  const e0 = end ?? p.len;
  const els: React.ReactNode[] = [];
  for (let i = 0; ; i++) {
    const tArr = first + i * every;
    const dist = (tArr - f) * v; // distance still to go to `end`
    if (dist > e0 + len) break;
    const s = e0 - dist;
    if (s > top - len * 0.3) continue;
    if (s < -len) continue;
    const { pt, ang } = atS(p, s);
    els.push(<ellipse key={i} cx={pt[0]} cy={pt[1]} rx={len / 2} ry={w / 2} transform={`rotate(${((ang * 180) / Math.PI).toFixed(2)} ${n2(pt[0])} ${n2(pt[1])})`} />);
  }
  if (!els.length) return null;
  return (
    <g>
      <defs>
        <filter id={`${uid}bg`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={n2(w * 0.45)} />
        </filter>
      </defs>
      <g fill={tone(CREAM)} opacity={0.55} filter={`url(#${uid}bg)`}>
        {els}
      </g>
      <g fill={tone(BEAD)}>{els}</g>
    </g>
  );
};

// ===================================================================================================================
// THE HUB: a squat cream drum on the plinth, the body's one power source; it rises out of the plinth's top (its lid
// shows first, flush with the stone); three outlets (top: the cord; sides: the thick lines)
// ===================================================================================================================
const Hub: React.FC<{ h: number; lid: number; ry: number; pulse: number }> = ({ h, lid, ry, pulse }) => {
  const { x, base, R, H } = HUB;
  const yt = base - h;
  const yb = base;
  const m = MAT.marble;
  const ink = mixHex(m.dark, PAL.shadow, 0.3);
  const body = `M${n2(x - R)},${n2(yt)}L${n2(x - R)},${n2(yb)}A${n2(R)},${n2(ry)} 0 0 0 ${n2(x + R)},${n2(yb)}L${n2(x + R)},${n2(yt)}Z`;
  const up = c01(h / H);
  const stubA = c01((h - 0.7 * H) / (0.3 * H));
  const stub = (sx: number, dir: number) => {
    const L = 26;
    const hw = W_THICK / 2 + 7;
    const x0 = dir < 0 ? sx - L : sx;
    return <rect x={x0} y={HUB_MID - hw} width={L} height={hw * 2} rx={hw * 0.45} fill={m.mid} stroke={ink} strokeWidth={2.2} opacity={stubA} />;
  };
  return (
    <g opacity={lid}>
      <defs>
        <linearGradient id="hubg" gradientUnits="userSpaceOnUse" x1={x - R} y1="0" x2={x + R} y2="0">
          <stop offset="0" stopColor={m.mid} />
          <stop offset="0.25" stopColor={m.lit} />
          <stop offset="0.55" stopColor={mixHex(m.lit, m.mid, 0.6)} />
          <stop offset="0.85" stopColor={mixHex(m.dark, PAL.shadow, 0.1)} />
          <stop offset="1" stopColor={mixHex(m.mid, "#5F877D", 0.35)} />
        </linearGradient>
        <radialGradient id="hubaura">
          <stop offset="0" stopColor={CREAM} stopOpacity={(0.32 + 0.1 * pulse) * up} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={(0.12 + 0.05 * pulse) * up} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={HUB_MID} rx={R * 2.1} ry={R * 1.25} fill="url(#hubaura)" />
      {stubA > 0.002 ? stub(x - R + 4, -1) : null}
      {stubA > 0.002 ? stub(x + R - 4, 1) : null}
      {h > 0.3 ? <path d={body} fill="url(#hubg)" stroke={ink} strokeWidth={2.4} strokeLinejoin="round" /> : null}
      <ellipse cx={x} cy={yt} rx={R} ry={ry} fill={mixHex(mixHex(m.lit, CREAM, 0.4 + 0.2 * pulse), MAT.stone.lit, 0.5 * (1 - up))} stroke={ink} strokeWidth={2.4} />
      <ellipse cx={x} cy={yt} rx={R * 0.62} ry={ry * 0.62} fill="none" stroke={m.mid} strokeWidth={2} strokeOpacity={0.6} />
      {/* the cord's collar on top */}
      <ellipse cx={x} cy={yt - 2} rx={13} ry={5} fill={m.mid} stroke={ink} strokeWidth={1.8} opacity={up} />
      {h > 6 ? <path d={`M${n2(x - R * 0.96)},${n2(yt + 4)}L${n2(x - R * 0.96)},${n2(yb - 2)}`} stroke={CREAM} strokeWidth={3} strokeOpacity={0.45} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE STOMACH (digestion): a simple gouache stomach (front view: fundus upper right, pylorus lower left) with a loop of
// small intestine below; muted red-brown and oatmeal; lit = cream inner light, cream aura, a slow churn
// ===================================================================================================================
const STOM_OUT: P2[] = [
  [-40, -300],
  [-60, -205],
  [-112, -95],
  [-195, -15],
  [-292, 26],
  [-372, 40],
  [-405, 74],
  [-398, 132],
  [-300, 172],
  [-150, 202],
  [20, 192],
  [172, 132],
  [272, 22],
  [312, -118],
  [292, -250],
  [212, -340],
  [92, -372],
  [16, -340],
];
const ESO: P2[] = [
  [-14, -312],
  [-22, -380],
  [-40, -440],
];
/** one loop of small intestine: out of the pylorus, down and round under the stomach, back up behind it */
const GUT: P2[] = [
  [-388, 112],
  [-438, 214],
  [-352, 300],
  [-150, 322],
  [60, 300],
  [176, 238],
  [150, 150],
];
const RUGAE: P2[][] = [
  [
    [-300, 120],
    [-150, 150],
    [20, 140],
    [160, 80],
    [240, -30],
  ],
  [
    [-200, 60],
    [-60, 90],
    [90, 60],
    [190, -40],
    [220, -150],
  ],
];
/** the stomach's attach point for the thick line (lower right of the greater curvature), local units */
const STOM_ATTACH: P2 = [190, 120];
const STOM_INK = { body: "#B07463", eso: "#A0675A", gut: "#C29A84", gutDark: "#9E7766", ruga: "#8E5648", rim: "#F3EBDD" };

const Stomach: React.FC<{ x: number; y: number; scale: number; uid: string; unitPx: number; lit: number; f: number; dim: number; air: string }> = ({ x, y, scale, uid, unitPx, lit, f, dim, air }) => {
  const fogC = (c: string) => mixHex(c, air, dim);
  // the churn: a slow squeeze of the body about its centre and a wave along the gut, both growing with lit
  const ch = lit * 0.035 * Math.sin((2 * Math.PI * (f - T.stomachLit)) / 22);
  const sq = (p: P2): P2 => [p[0] * (1 + ch) - 40 * ch, p[1] * (1 - ch * 0.8)];
  const gutWave = (q: P2[]) => q.map((p, i) => [p[0], p[1] + lit * 9 * Math.sin((2 * Math.PI * (f - T.stomachLit)) / 18 - i * 0.9)] as P2);
  const warm = (c: string) => fogC(mixHex(c, "#D9A58E", 0.18 * lit));
  const shapes: Paint.Shape[] = [
    { d: tubeD(ESO, () => 78, 20), fill: warm(STOM_INK.eso), sh: 2.4 },
    { d: tubeD(gutWave(GUT), (u) => 74 - 8 * u, 90), fill: warm(STOM_INK.gut), sh: 3 },
    { d: smoothClosed(STOM_OUT.map(sq)), fill: warm(STOM_INK.body), sh: 4 },
  ];
  if (lit > 0.002) shapes.push({ d: smoothClosed(STOM_OUT.map(sq)), fill: `url(#${uid}core)`, sh: 0, op: lit });
  for (const r of RUGAE) shapes.push({ d: tubeD(r.map(sq), (u) => 15 * Math.pow(Math.sin(Math.PI * u), 0.6) + 0.5, 40, false), fill: fogC(STOM_INK.ruga), sh: 0, op: 0.45 });
  shapes.push({ d: tubeD([[264, -120], [262, -236], [200, -320], [100, -350]].map((p) => sq(p as P2)), (u) => 13 * Math.pow(Math.sin(Math.PI * u), 0.6) + 0.5, 30, false), fill: STOM_INK.rim, sh: 0, op: 0.45 * (1 - dim) });
  const px = Math.max(0.2, (900 * scale * unitPx) / 520);
  const haloA = 0.55 * lit;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}core`} cx="0.55" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#FBEBD2" stopOpacity={0.55} />
          <stop offset="0.5" stopColor="#F3DCC0" stopOpacity={0.28} />
          <stop offset="1" stopColor="#F3DCC0" stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}aura`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={40} />
        </filter>
      </defs>
      {haloA > 0.002 ? (
        <g transform={`translate(${n2(x)} ${n2(y)}) scale(${scale.toFixed(5)})`} opacity={haloA}>
          <path d={smoothClosed(STOM_OUT)} fill={CREAM} filter={`url(#${uid}aura)`} />
          <path d={tubeD(GUT, () => 90, 60)} fill={CREAM} filter={`url(#${uid}aura)`} opacity={0.7} />
        </g>
      ) : null}
      <Paint.FolkPaint shapes={shapes} x={x} y={y} scale={scale} uid={uid} px={px} unitPx={unitPx} />
    </g>
  );
};

// ===================================================================================================================
// THE WHITE BLOOD CELL (immunity): an ivory cell with a soft wavy edge and three low pseudopods, a slate three-lobed
// nucleus; lit = a cream aura and inner light, the pseudopods and the edge reach
// ===================================================================================================================
const CELL_INK = { body: "#DDD6C8", nucleus: "#8D8C9E", rim: "#F6EEDC" };
const cellOutline = (f: number, reach: number): P2[] => {
  const N = 64;
  const out: P2[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI;
    // a soft round body with slow living lobes, and three finger-like pseudopods that reach out with `reach`
    const lobes = 0.025 * Math.sin(2 * a + 0.9 + f / 17) + (0.03 + 0.03 * reach) * Math.sin(7 * a + 2.1 - f / 13) + 0.015 * Math.sin(11 * a - f / 9);
    const pod = (c: number, wd: number) => Math.exp(-Math.pow(Math.atan2(Math.sin(a - c), Math.cos(a - c)) / wd, 2));
    const live = (ph: number) => 1 + 0.12 * Math.sin(f / 10 + ph);
    const pods = (0.05 + 0.09 * reach) * live(0) * pod(-0.8, 0.3) + (0.04 + 0.08 * reach) * live(2) * pod(1.4, 0.3) + (0.05 + 0.08 * reach) * live(4) * pod(3.6, 0.32);
    const r = 370 * (1 + lobes + pods);
    out.push([r * Math.cos(a), r * Math.sin(a) * 0.94]);
  }
  return out;
};
/** the nucleus: three broad lobes along a diagonal arc, joined by soft necks */
const nucleusD = (f: number) => {
  const run: P2[] = [
    [-175, 95],
    [-120, -40],
    [10, -120],
    [160, -110],
  ];
  const wob = (q: P2[]) => q.map((p, i) => [p[0] + 5 * Math.sin(f / 15 + i), p[1] + 5 * Math.cos(f / 19 + i)] as P2);
  return tubeD(wob(run), (u) => 118 + 62 * Math.pow(Math.abs(Math.sin(3 * Math.PI * (0.05 + 0.9 * u))), 0.8), 90);
};
const Cell: React.FC<{ x: number; y: number; size: number; uid: string; unitPx: number; lit: number; f: number; dim: number; air: string }> = ({ x, y, size, uid, unitPx, lit, f, dim, air }) => {
  const fogC = (c: string) => mixHex(c, air, dim);
  const scale = size / 1000;
  const outline = cellOutline(f, lit);
  const bodyD = smoothClosed(outline);
  const shapes: Paint.Shape[] = [{ d: bodyD, fill: fogC(mixHex(CELL_INK.body, "#F3E6CC", 0.4 * lit)), sh: 4 }];
  if (lit > 0.002) shapes.push({ d: bodyD, fill: `url(#${uid}core)`, sh: 0, op: lit });
  shapes.push({ d: nucleusD(f), fill: fogC(CELL_INK.nucleus), sh: 1.4 });
  const rimRun = outline.slice(Math.round(outline.length * 0.53), Math.round(outline.length * 0.8)).map((p) => [p[0] * 0.965, p[1] * 0.965] as P2);
  shapes.push({ d: tubeD(rimRun, (u) => 16 * Math.pow(Math.sin(Math.PI * u), 0.6) + 0.5, 40, false), fill: CELL_INK.rim, sh: 0, op: 0.6 * (1 - dim) });
  const px = Math.max(0.2, (size * unitPx) / 520);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}core`} cx="0.45" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#FFF8EA" stopOpacity={0.6} />
          <stop offset="0.55" stopColor="#FFF8EA" stopOpacity={0.22} />
          <stop offset="1" stopColor="#FFF8EA" stopOpacity={0} />
        </radialGradient>
        <filter id={`${uid}aura`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={70} />
        </filter>
      </defs>
      <g transform={`translate(${n2(x)} ${n2(y)}) scale(${scale.toFixed(5)})`} opacity={0.08 + 0.55 * lit}>
        <path d={bodyD} fill={CREAM} filter={`url(#${uid}aura)`} transform="scale(1.12)" />
      </g>
      <Paint.FolkPaint shapes={shapes} x={x} y={y} scale={scale} uid={uid} px={px} unitPx={unitPx} />
    </g>
  );
};

// ===================================================================================================================
// THE ASSEMBLY'S LINES (world, at rest on the front plane)
// ===================================================================================================================
const stomW = (p: P2): P2 => [STOMACH.x + p[0] * STOMACH.scale, STOMACH.y + p[1] * STOMACH.scale];
const S_ATT = stomW(STOM_ATTACH);
const C_ATT: P2 = [CELL.x - 0.3 * CELL.size, CELL.y + 0.27 * CELL.size];
/** hub -> stomach and hub -> cell (each ends inside its organ: the organ covers the end) */
export const LINE_S = polyOf(bez([HUB.x - HUB.R - 18, HUB_MID], [HUB.x - HUB.R - 170, HUB_MID + 6], [S_ATT[0] + 90, S_ATT[1] + 120], [S_ATT[0] - 20, S_ATT[1] - 25], 48));
export const LINE_C = polyOf(bez([HUB.x + HUB.R + 18, HUB_MID], [HUB.x + HUB.R + 150, HUB_MID + 6], [C_ATT[0] - 90, C_ATT[1] + 110], [C_ATT[0] + 25, C_ATT[1] - 25], 48));
/** where along each thick line its organ's edge sits (beads vanish into the organ there) */
const S_EDGE = LINE_S.len - 40;
const C_EDGE = LINE_C.len - 45;
/** how much of a thick line is drawn out from the hub */
const lineDrawn = (f: number, t0: number, t1: number, p: Poly) => (f <= t0 ? 0 : p.len * easeOut((f - t0) / (t1 - t0)));
/** the thin cord (world, now): hub top -> stem tip */
export const cordAt = (f: number) => {
  const a: P2 = [HUB.x, HUB.base - hubAt(f).h - 2];
  const b = stemTip(f);
  const L = a[1] - b[1];
  return polyOf(bez(a, [a[0], a[1] - 0.42 * L], [b[0], b[1] + 0.5 * L], b, 60));
};
/** how much of the cord is drawn: its length from the hub up to the moving tip */
export const cordDrawn = (f: number, p: Poly) => {
  const u = c01((f - T.cord0) / (T.cord1 - T.cord0));
  const toGo = 700 * Math.pow(1 - u, 1.7);
  return f < T.cord0 ? 0 : Math.max(0, p.len - toGo);
};

// ===================================================================================================================
// THE PELVIS'S PATHS (I1's)
// ===================================================================================================================
const ellArcD = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number) => {
  const p = (a: number) => `${n2(cx + rx * Math.cos((a * Math.PI) / 180))},${n2(cy + ry * Math.sin((a * Math.PI) / 180))}`;
  return `M${p(a0)}A${n2(rx)},${n2(ry)} 0 0 1 ${p(a1)}`;
};
const visibleD = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n2(cx - 3000)},${n2(cy - 3000)}H${n2(cx + 3000)}V${n2(cy)}H${n2(cx + rx)}A${n2(rx)},${n2(ry)} 0 0 1 ${n2(cx - rx)},${n2(cy)}H${n2(cx - 3000)}Z`;
const ellD = (cx: number, cy: number, rx: number, ry: number) => `M${n2(cx + rx)},${n2(cy)}A${n2(rx)},${n2(ry)} 0 1 1 ${n2(cx - rx)},${n2(cy)}A${n2(rx)},${n2(ry)} 0 1 1 ${n2(cx + rx)},${n2(cy)}Z`;
const wallD = (cx: number, cy: number, rx: number, ry: number, drop: number) =>
  `M${n2(cx - rx)},${n2(cy)}A${n2(rx)},${n2(ry)} 0 0 1 ${n2(cx + rx)},${n2(cy)}L${n2(cx + rx)},${n2(cy + drop)}A${n2(rx)},${n2(ry)} 0 0 0 ${n2(cx - rx)},${n2(cy + drop)}Z`;

// ===================================================================================================================
// THE PLATE: cream type on a soft dark plate (the clip's soft-plate look), sliding up while fading in
// ===================================================================================================================
const Plate: React.FC<{ t: number }> = ({ t }) => {
  if (t <= 0) return null;
  const e = easeOut(t);
  const { fs, wP, hP } = plateBox();
  const cx = PLATE.X;
  const cy = PLATE.Y + 0.9 * PLATE.cap * (1 - e);
  return (
    <g opacity={e}>
      <defs>
        <filter id="platef" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation={(hP * 0.08).toFixed(2)} />
        </filter>
      </defs>
      <rect x={cx - wP / 2} y={cy - hP / 2} width={wP} height={hP} rx={hP * 0.22} fill={PAL.shadow} fillOpacity={0.5} filter="url(#platef)" />
      <rect x={cx - wP / 2} y={cy - hP / 2} width={wP} height={hP} rx={hP * 0.22} fill={mixHex(PAL.shadow, "#3A3128", 0.5)} fillOpacity={0.6} />
      <text x={cx} y={cy + PLATE.cap / 2} textAnchor="middle" fontFamily={barlow} fontWeight={600} fontSize={fs} letterSpacing={fs * PLATE.track} fill={PAL.cream}>
        {PLATE.text}
      </text>
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
/** the organs' lit amount: ramps in over 8 frames from the first fat bead's arrival */
export const litAt = (f: number, tLit: number) => sstep((f - tLit + 1) / 9);

const TwentyWatts: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = frame;
  const cam = camOf(f);
  const A = airWorldOf({ cam, rest: I1_REST, depth: DEPTH, frame: f + I1_LAST, fogBy: "depth" });
  const k = cam.k;
  // the brain (I1's drawing: the squash about the rim row, the form light over it)
  const b = brainAt(f);
  const bb = brainWorldBox(f);
  const sqT = `translate(${n2(b.x)} ${n2(I1_PIVOT_Y)}) scale(${b.sx.toFixed(5)} ${b.sy.toFixed(5)}) translate(${n2(-b.x)} ${n2(-I1_PIVOT_Y)})`;
  const brainEl = (uid: string) => <Brain x={b.x} y={b.y} size={BRAIN_SIZE} swell={BRAIN_SWELL} uid={uid} unitPx={k} rot={b.rot} glow={b.glow} />;
  // the pelvis (I1's stack), dissolving into the air
  const pa = pelvisAt(f);
  const pelvisOn = pa.op > 0.002;
  const pc: P2 = [I1.PELVIS_C[0], I1.PELVIS_C[1] + pa.give];
  const tiltT = `translate(0 ${n2(pc[1])}) scale(1 ${I1.TILT}) translate(0 ${n2(-pc[1])})`;
  const air = A.airHex(0, 300);
  const pFog = { rgb: MAT.ground.mid, amount: 0.06 };
  // going back: placed by the perspective about its base on the plinth's top, fogged by its depth as one piece
  const pBase: P2 = [0, PLINTH.top];
  const pPose = { at: A.P.p(pBase[0], pBase[1], pa.Z), r: A.P.r(pa.Z) };
  const pFogA = pa.moved ? A.fog(pa.Z) : 0;
  const placeT = (o: { x: number; y: number }, p: { at: P2; r: number }) => `translate(${n2(p.at[0])} ${n2(p.at[1])}) scale(${p.r.toFixed(5)}) translate(${n2(-o.x)} ${n2(-o.y)})`;
  const pT = pa.moved ? placeT({ x: pBase[0], y: pBase[1] }, pPose) : undefined;
  const R = I1.INLET_R;
  const RY = I1.INLET_RY;
  const wallLit = mixHex("#B8A98A", air, 0.15);
  const wallDark = mixHex("#4A4033", air, 0.15);
  const deep = mixHex("#1B1D1A", air, 0.2);
  const ra = i1RimAmt(I1_LAST) * (1 - sstep(f / 5));
  const opOf = (v: number) => (v >= 1 ? undefined : v);
  // the hub on the plinth (its ellipses foreshortened as the plinth's top is seen now)
  const hb = hubAt(f);
  const hubOn = hb.lid > 0.002;
  const ryAt = (Y: number) => Math.abs(A.P.p(HUB.x, Y, -HUB.R)[1] - A.P.p(HUB.x, Y, HUB.R)[1]) / 2;
  const hubPulse = 0.5 + 0.5 * Math.sin((2 * Math.PI * f) / 20);
  // the cord
  const tone = (hex: string) => hex;
  const cord = cordAt(f);
  const cordS = cordDrawn(f, cord);
  // the organs, out of the haze
  const sP = organPose(f, STOMACH, T.stom0, T.stom1);
  const cP = organPose(f, CELL, T.cell0, T.cell1);
  const sLit = litAt(f, T.stomachLit);
  const cLit = litAt(f, T.cellLit);
  // the organs fog a little toward the air until they light (receded context); on the way in they come out of a light
  // haze (the pale upper air), not a dark one, clearing as they come forward
  const lightAir = rgbHex(A.v.airAtScreen(300));
  const hazeOf = (Z: number) => Math.pow(c01(Z / ORGAN_Z0), 0.6);
  const dimOf = (Z: number, lit: number) => 1 - (1 - 0.32 * (1 - lit)) * (1 - Math.max(A.fog(Z), 0.8 * hazeOf(Z)));
  const airOf = (Z: number, row: number) => mixHex(A.screenAir(row), lightAir, hazeOf(Z));
  const sDrawn = lineDrawn(f, T.lineS0, T.lineS1, LINE_S);
  const cDrawn = lineDrawn(f, T.lineC0, T.lineC1, LINE_C);
  const lineAir = A.screenAir(HUB_MID);
  return (
    <AirStage v={A.v} bloom={0.22} motes={0.8}>
      <WorldSvg cam={cam}>
        <defs>
          <mask id="pmask" maskUnits="userSpaceOnUse" x={-1500} y={-1500} width={3000} height={3000}>
            <rect x={-1500} y={-1500} width={3000} height={3000} fill="black" />
            <g transform={tiltT}>
              <Pelvis x={pc[0]} y={pc[1]} size={I1.PELVIS_W} uid="pm" />
            </g>
          </mask>
          {pFogA > 0.002 ? (
            <mask id="pfog" maskUnits="userSpaceOnUse" x={-1500} y={-1500} width={3000} height={3000}>
              <rect x={-1500} y={-1500} width={3000} height={3000} fill="black" />
              <g transform={`translate(0 ${I1_THICK})`}>
                <g transform={tiltT}>
                  <Pelvis x={pc[0]} y={pc[1]} size={I1.PELVIS_W} uid="pf1" />
                </g>
              </g>
              <g transform={tiltT}>
                <Pelvis x={pc[0]} y={pc[1]} size={I1.PELVIS_W} uid="pf2" />
              </g>
              <path d={ellD(pc[0], pc[1], R + 2, RY + 2)} fill="white" />
            </mask>
          ) : null}
          <mask id="bmask" maskUnits="userSpaceOnUse" x={-1500} y={-1500} width={3000} height={3000}>
            <rect x={-1500} y={-1500} width={3000} height={3000} fill="black" />
            <g transform={sqT}>{brainEl("bm")}</g>
          </mask>
          <linearGradient id="bform" gradientUnits="userSpaceOnUse" x1={n2(bb.left)} y1={n2(bb.top)} x2={n2(bb.right)} y2={n2(bb.bottom)}>
            <stop offset="0" stopColor="#FFF4E4" stopOpacity={0.34} />
            <stop offset="0.42" stopColor="#FFF4E4" stopOpacity={0} />
            <stop offset="0.7" stopColor="#3A2218" stopOpacity={0} />
            <stop offset="1" stopColor="#3A2218" stopOpacity={0.36} />
          </linearGradient>
          <radialGradient id="bshadow">
            <stop offset="0" stopColor="#22180F" stopOpacity={0.42} />
            <stop offset="0.55" stopColor="#22180F" stopOpacity={0.22} />
            <stop offset="1" stopColor="#22180F" stopOpacity={0} />
          </radialGradient>
          <clipPath id="vis" clipPathUnits="userSpaceOnUse">
            <path d={visibleD(pc[0], pc[1], R, RY)} />
          </clipPath>
          <clipPath id="hole" clipPathUnits="userSpaceOnUse">
            <path d={ellD(pc[0], pc[1], R, RY)} />
          </clipPath>
          <linearGradient id="wallg" gradientUnits="userSpaceOnUse" x1="0" y1={n2(pc[1] - RY)} x2="0" y2={n2(pc[1] + 0.25 * RY)}>
            <stop offset="0" stopColor={wallLit} />
            <stop offset="0.5" stopColor={wallDark} />
            <stop offset="1" stopColor={deep} />
          </linearGradient>
          <linearGradient id="wallx" gradientUnits="userSpaceOnUse" x1={n2(pc[0] - R)} y1="0" x2={n2(pc[0] + R)} y2="0">
            <stop offset="0" stopColor="#22180F" stopOpacity={0.35} />
            <stop offset="0.45" stopColor="#22180F" stopOpacity={0} />
            <stop offset="1" stopColor="#22180F" stopOpacity={0.15} />
          </linearGradient>
          <radialGradient id="deepg" gradientUnits="userSpaceOnUse" cx={pc[0]} cy={pc[1] + RY * 0.4} r={R}>
            <stop offset="0" stopColor={deep} />
            <stop offset="1" stopColor={mixHex(deep, wallDark, 0.5)} />
          </radialGradient>
          <filter id="rimblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={2.4} />
          </filter>
          <filter id="edgeblur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={1.4} />
          </filter>
        </defs>
        {/* the setting: I1's floor, air and plinth carry on */}
        <AirFloor A={A} x0={-3600} x1={3600} z0={-3000} z1={6000} mat={MAT.ground} course={190} />
        <AirHorizonHazeW A={A} id="haze" />
        <AirShadow A={A} X={0} Z={0} w={PLINTH.hw * 1.12} d={PLINTH.z * 1.3} amt={0.85} uid="plS" />
        <AirBox A={A} X0={-PLINTH.hw} X1={PLINTH.hw} Y0={PLINTH.top} Y1={0} Z0={-PLINTH.z} Z1={PLINTH.z} mat={MAT.stone} uid="pl" />
        {/* the organs' soft shadows on the floor below them */}
        {sP.op > 0.002 ? <AirShadow A={A} X={STOMACH.x} Z={sP.Z} w={190} d={80} amt={0.4 * sP.op} uid="sS" /> : null}
        {cP.op > 0.002 ? <AirShadow A={A} X={CELL.x} Z={cP.Z} w={150} d={70} amt={0.4 * cP.op} uid="cS" /> : null}
        {/* the hub on the plinth's top: its contact shadow, the two thick lines and their fat beads, the drum */}
        {hubOn ? <AirShadow A={A} X={HUB.x} Z={0} Y={HUB.base} w={HUB.R * 1.1} d={HUB.R * 0.55} amt={0.7 * c01(hb.h / HUB.H)} uid="hS" /> : null}
        {sDrawn > 0.5 ? (
          <g>
            <Conduit p={LINE_S} s1={sDrawn} w={W_THICK} tone={(h) => mixHex(h, lineAir, 0.32 * (1 - sLit) * 0.6)} lit={sLit} />
            <Beads p={LINE_S} end={S_EDGE} f={f} first={T.stomachLit} every={T.thickEvery} v={V_THICK} w={W_THICK * 1.06} len={W_THICK * 1.45} sMax={sDrawn} uid="bs" tone={tone} />
          </g>
        ) : null}
        {cDrawn > 0.5 ? (
          <g>
            <Conduit p={LINE_C} s1={cDrawn} w={W_THICK} tone={(h) => mixHex(h, lineAir, 0.32 * (1 - cLit) * 0.6)} lit={cLit} />
            <Beads p={LINE_C} end={C_EDGE} f={f} first={T.cellLit} every={T.thickEvery} v={V_THICK} w={W_THICK * 1.06} len={W_THICK * 1.45} sMax={cDrawn} uid="bc" tone={tone} />
          </g>
        ) : null}
        {/* the brain's cord: drawn up from the hub by its tip; beads by their arrival at the stem */}
        <Conduit p={cord} s1={cordS} w={W_THIN} tone={tone} />
        <Beads p={cord} f={f} first={T.bead0} every={T.beadEvery} v={V_THIN} w={W_THIN * 1.9} len={W_THIN * 2.8} sMax={cordS} uid="bt" tone={tone} />
        {cordS > 1 && cordS < cord.len - 1 ? <circle cx={atS(cord, cordS).pt[0]} cy={atS(cord, cordS).pt[1]} r={W_THIN * 0.95} fill={CREAM} /> : null}
        {hubOn ? <Hub h={hb.h} lid={hb.lid} ry={ryAt(HUB.base)} pulse={hubPulse} /> : null}
        {sP.op > 0.002 ? (
          <g opacity={opOf(sP.op)} transform={placeT(STOMACH, sP)}>
            <Stomach x={STOMACH.x} y={STOMACH.y} scale={STOMACH.scale} uid="st" unitPx={k * sP.r} lit={sLit} f={f} dim={dimOf(sP.Z, sLit)} air={airOf(sP.Z, sP.at[1])} />
          </g>
        ) : null}
        {cP.op > 0.002 ? (
          <g opacity={opOf(cP.op)} transform={placeT(CELL, cP)}>
            <Cell x={CELL.x} y={CELL.y} size={CELL.size} uid="ce" unitPx={k * cP.r} lit={cLit} f={f} dim={dimOf(cP.Z, cLit)} air={airOf(cP.Z, cP.at[1])} />
          </g>
        ) : null}
        {/* I1's pelvis going back into the haze as one piece (its shadow on the plinth fades as it leaves) */}
        {pa.moved && pelvisOn ? <AirShadow A={A} X={0} Z={0} Y={PLINTH.top} w={I1.PELVIS_W * 0.4} d={PLINTH.z * 0.55} amt={0.8 * (1 - sstep((f - T.pelvis0) / 4))} uid="pvS" /> : null}
        {pelvisOn ? (
          <g opacity={opOf(pa.op)} transform={pT}>
            {!pa.moved ? <AirShadow A={A} X={0} Z={0} Y={PLINTH.top} w={I1.PELVIS_W * 0.4} d={PLINTH.z * 0.55} amt={0.8} uid="pvS" /> : null}
            <g transform={`translate(0 ${I1_THICK})`}>
              <g transform={tiltT}>
                <Pelvis x={pc[0]} y={pc[1]} size={I1.PELVIS_W} uid="pt" unitPx={k} fog={{ rgb: "#6E5F4B", amount: 0.5 }} />
              </g>
            </g>
            <g clipPath="url(#hole)">
              <path d={ellD(pc[0], pc[1], R + 2, RY + 2)} fill="url(#deepg)" />
              <path d={wallD(pc[0], pc[1], R + 2, RY + 2, RY * 0.95)} fill="url(#wallg)" />
              <path d={wallD(pc[0], pc[1], R + 2, RY + 2, RY * 0.95)} fill="url(#wallx)" />
            </g>
            <g transform={tiltT}>
              <Pelvis x={pc[0]} y={pc[1]} size={I1.PELVIS_W} uid="pb" unitPx={k} fog={pFog} />
            </g>
            <g mask="url(#pmask)" filter="url(#edgeblur)">
              <path d={ellArcD(pc[0], pc[1], R + 4, RY + 4, 30, 150)} fill="none" stroke="#FBF4E6" strokeWidth={5} strokeOpacity={0.55} strokeLinecap="round" />
            </g>
            <g clipPath="url(#hole)" filter="url(#edgeblur)">
              <path d={ellArcD(pc[0], pc[1], R - 2, RY - 2, 195, 300)} fill="none" stroke="#FBF4E6" strokeWidth={4} strokeOpacity={0.4} strokeLinecap="round" />
            </g>
            {!pa.moved ? (
              <g mask="url(#pmask)">
                <ellipse cx={(bb.left + bb.right) / 2 + 16} cy={(bb.top + bb.bottom) / 2 + 26} rx={bb.w * 0.56} ry={(bb.bottom - bb.top) * 0.6} fill="url(#bshadow)" />
              </g>
            ) : null}
            {pFogA > 0.002 ? (
              <g mask="url(#pfog)">
                <rect x={-1500} y={-1500} width={3000} height={3000} fill={A.airHex(pa.Z, 360)} opacity={pFogA} />
              </g>
            ) : null}
          </g>
        ) : null}
        {/* the brain with I1's soft form light; inside the inlet (I1's clip) while the pelvis is there */}
        <g clipPath={pelvisOn && !pa.moved ? "url(#vis)" : undefined}>
          <g transform={sqT}>{brainEl("br")}</g>
          <rect x={n2(bb.left - 60)} y={n2(bb.top - 60)} width={n2(bb.w + 120)} height={n2(bb.bottom - bb.top + 120)} fill="url(#bform)" mask="url(#bmask)" />
        </g>
        {pelvisOn && !pa.moved && ra > 0.005 ? (
          <g mask="url(#pmask)">
            <g opacity={ra} filter="url(#rimblur)">
              <path d={ellArcD(pc[0], pc[1], R + 3, RY + 3, 0, 52)} fill="none" stroke="#F6EEDC" strokeWidth={9} strokeLinecap="round" />
              <path d={ellArcD(pc[0], pc[1], R + 3, RY + 3, 128, 180)} fill="none" stroke="#F6EEDC" strokeWidth={9} strokeLinecap="round" />
            </g>
          </g>
        ) : null}
        <Plate t={(f - T.plate0) / 12} />
      </WorldSvg>
    </AirStage>
  );
};

export default TwentyWatts;
