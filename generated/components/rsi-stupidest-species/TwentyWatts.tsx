// ---------------------------------------------------------------------------
// TwentyWatts (rsi-stupidest-species, cut 83). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 130 frames.
// Inside the misty teal air (AirStage, palette A, no floor, the same air and camera hand as cut I1 TooBigToFit), the
// clip's shared BRAIN (./brainShared, W3, read-only) and the body's power: one cream hub feeding three cream lines.
//
// CHECK LINE: "The brain gets a small fixed share of the body's power, about 20 watts, because digestion and immunity
//   need theirs."
//
// THE LINE: "And the brain only gets to consume 20 watts of energy, lest functions like digestion and immunity, which"
// WORD -> FRAME: And -2 · the 3 · brain 5 · only 10 · gets 18 · to 25 · consume 27 · 20 36 · watts 45 · of 52 ·
//   energy 57 · lest 63 · functions 74 · like 80 · digestion 93 · and 103 · immunity 112 · which 119
// DURATION: the slot 83.375 -> 88.797 s (sequence frames 1999-2129) = 5.422 s x 23.976 = 130 frames (f0..f129).
//
// THE JOIN: f0 is cut I1's last frame (f77) pixel for pixel: I1's camera, air frame, pelvis, contact rim and the
// swollen, tilted brain jammed in the inlet are rebuilt here from I1's exported state (asserted at module load).
//
// THE MOTION: one continuous pull-back down a power line. f0-24 ("And the brain only gets"): the brain pops up out of
// the inlet (no swell change: the same drawing as I1, it only untilts), the pelvis sinks away and drains into the dark
// low air (gone by f15). f8-26: a thin cream cord is drawn up from below by its moving tip and docks on the brain stem
// (CONTACT f26). The first cream bead arrives f30 ("consume" f27): the brain lights from inside with a modest orange
// glow (0 -> ~0.45 by f42, a small swell of glow per bead, one bead every 10 frames). f37-49 ("20 watts"): the soft
// plate 20 W slides up beside the brain while the camera pans to make room and starts its long pull-back down the
// cord. f53-96 ("of energy, lest functions like"): the body's power rises into frame from below (entry ~40 px/frame in
// the dead bottom zone, decelerating) and settles: a cream hub
// low in frame feeding the thin cord and two much THICKER lines, to a stomach (left) and a white blood cell (right).
// Each thick line starts flowing busy, fat beads; the first bead reaches the stomach on f93 ("digestion": it lights,
// warms and churns) and the cell on f112 ("immunity": aura, pseudopods reach). f112-129: living hold, three
// consumers on one source, the brain's thin trickle beside the two thick streams; camera creeps.
// Camera: k 1.169 -> 0.675 (one lobe, f0 continues I1's camera with zero slope), pan right 540 -> 754 so the plate
// fits, down 951 -> 1402 along the cord. Resolved: brain ~300 px at y ~430, plate cap ~60 px, organs ~270 px at
// y ~860, hub at y ~1005.
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
import { AIR, AirStage, MAT, Paint, WorldSvg, airWorldOf, c01, makeCamera, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
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
// THE JOIN WITH CUT I1 (TooBigToFit): its last frame and the constants it does not export, asserted here
// ===================================================================================================================
/** I1's last frame: my f is I1's f + I1_LAST (air frame, camera sway, the brain's breath) */
export const I1_LAST = I1.DURATION - 1;
const I1_BX = I1.PELVIS_C[0] - 22;
const I1_ROT = -9;
const I1_PIVOT_Y = I1.PELVIS_C[1];
const I1_YC = I1.PELVIS_C[1] + 46;
const I1_DEPTH: DepthOpts = { eyeY: 200, dRef: 1800, kRef: 1, dolly: 0.5 };
{
  const b = I1.brainWorldBox(I1_LAST);
  if (Math.abs((b.left + b.right) / 2 - I1_BX) > 1e-6) throw new Error("TwentyWatts: I1 brain x moved");
  if (Math.abs(I1.brainY(I1_LAST) - (I1_YC + 5 * I1.pressAt(I1_LAST))) > 1e-6) throw new Error("TwentyWatts: I1 brain y moved");
  if (I1.BRAIN_SIZE !== 270 || I1.PELVIS_W !== 800 || I1.TILT !== 0.68) throw new Error("TwentyWatts: I1 constants moved");
}
/** I1's contact-rim light (copied: not exported) */
const i1RimAmt = (f: number) => {
  const t1 = f - I1.F_CONTACT;
  const t2 = f - 48;
  const flash = (t: number, a: number) => (t <= 0 ? 0 : a * Math.min(1, t / 2.5) * Math.exp(-Math.max(0, t - 2.5) / 6));
  const floor = t1 > 0 ? 0.28 * Math.min(1, t1 / 8) : 0;
  return Math.min(1, Math.max(flash(t1, 1), flash(t2, 0.5), floor));
};
const swayOf = (f: number) => ({ dx: 3 * Math.sin(f / 23), dy: 5 * Math.sin(f / 19) });
/** I1's camera before its sway at I1 frame g */
const i1CamRaw = (g: number): Cam => {
  const c = I1.camOf(g);
  const s = swayOf(g);
  return { k: c.k, cx: c.cx - s.dx / c.k, cy: c.cy - s.dy / c.k };
};
const I1_REST = I1.camOf(0);

// ===================================================================================================================
// THE WORLD (world units = screen px at k 1; the brain and pelvis where I1 left them)
// ===================================================================================================================
/** the brain: I1's size and swell (the same drawing), anchor x, the anchor y it rises to */
export const BRAIN_SIZE = I1.BRAIN_SIZE;
export const BRAIN_SWELL = I1.brainState(I1_LAST).swell;
export const BX = I1_BX;
export const BY_REST = 796;
const BB = brainBox(BRAIN_SIZE, BRAIN_SWELL);
/** the stem tip relative to the anchor (brainShared's geometry at swell 0.99: the stem's lowest run, x / size) */
const STEM_DX = 0.297 * BRAIN_SIZE;

/** the plate: "20 W", beside the brain at its centre row (cap in world units: ~60 px at the resolved zoom) */
export const PLATE = { cap: 88, track: 0.05, text: "20 W", X: 0, Y: BY_REST + BB.cy };
/** Barlow Condensed 600 advance widths (em) for the plate's glyphs */
const ADV: Record<string, number> = { "2": 0.5, "0": 0.5, " ": 0.2, W: 0.74 };
export const plateBox = () => {
  const fs = PLATE.cap / 0.7;
  const w = [...PLATE.text].reduce((s, ch) => s + (ADV[ch] ?? 0.5) * fs, 0) + fs * PLATE.track * (PLATE.text.length - 1);
  const pad = PLATE.cap * 0.62;
  return { fs, w, wP: w + pad * 2, hP: PLATE.cap + pad * 1.9 };
};
PLATE.X = BX + BB.right + 58 + plateBox().wP / 2;

/** the body's power (rests at these world spots; rises into place as one rigid assembly by asmDy) */
export const HUB = { x: 753, y: 1461, R: 100, H: 78, ry: 27 };
export const STOMACH = { x: 318, y: 1226, scale: 0.55 };
export const CELL = { x: 1180, y: 1238, size: 360 };
/** line widths (world): the brain's thin cord, the two thick lines */
export const W_THIN = 7.5;
export const W_THICK = 38;

// ===================================================================================================================
// THE CAMERA (keys: world point at screen centre; f -10 / f0 are I1's own camera so the move starts at zero slope)
// ===================================================================================================================
const K = (f: number, k: number, cx: number, cy: number) => ({ f, k, wx: cx, wy: cy, sx: 540, sy: 960 });
const C_M10 = i1CamRaw(I1_LAST - 10);
const C_0 = i1CamRaw(I1_LAST);
const camAt = makeCamera(
  [
    K(-10, C_M10.k, C_M10.cx, C_M10.cy),
    K(0, C_0.k, C_0.cx, C_0.cy),
    K(20, 1.085, 625, 958),
    K(40, 0.962, 735, 1000),
    K(102, 0.685, 753, 1392),
    K(129, 0.675, 754, 1402),
  ],
  false,
);
export const camOf = (f: number) => swayCam(camAt(f), f + I1_LAST);

// ===================================================================================================================
// TIMINGS
// ===================================================================================================================
export const T = {
  lift: 24, // the brain has popped up and settled
  pelvisOut: 15, // the pelvis has sunk and drained into the low air
  cord0: 8, // the cord's tip leaves the frame bottom
  cord1: 26, // CONTACT: the cord's plug docks on the brain stem
  bead0: 30, // the first bead reaches the brain (first glow)
  beadEvery: 10,
  plate0: 37, // the plate starts to slide up ("20" f36)
  asm0: 46, // the power assembly's plan starts (enters the frame bottom ~f53)
  asm1: 96, // it rests
  stomachLit: 93, // the first fat bead reaches the stomach ("digestion")
  cellLit: 112, // ... and the cell ("immunity")
  thickEvery: 5,
};
const V_THIN = 14;
const V_THICK = 18;

// ===================================================================================================================
// THE MOTION (pure functions of the frame, exported for the checks)
// ===================================================================================================================
/** the brain: anchor, tilt, I1's breath decaying, the squash, the glow */
export const brainAt = (f: number) => {
  const press = I1.pressAt(I1_LAST + f) * (1 - sstep(f / 6));
  const L = ease(c01(f / T.lift));
  const bob = 4 * Math.sin((2 * Math.PI * (f - 18)) / 52) * sstep((f - 18) / 14);
  const y = I1_YC + 5 * press + (BY_REST - I1_YC) * L + bob;
  const rot = I1_ROT * (1 - ease(c01(f / 22)));
  const sx = 1 + 0.025 * Math.max(-0.2, press);
  const sy = 1 - 0.025 * Math.max(-0.2, press);
  // glow: modest, from the first bead's arrival; each bead adds a small swell
  let glow = 0.42 * sstep((f - T.bead0) / 12);
  for (let t = T.bead0; t <= f; t += T.beadEvery) glow += 0.07 * Math.exp(-(f - t) / 5) * c01((f - t) / 1.5 + 0.34);
  return { x: BX, y, rot, sx, sy, glow: Math.min(1, glow) };
};
/** the stem tip (world): where the cord docks */
export const stemTip = (f: number): P2 => {
  const b = brainAt(f);
  return [b.x + STEM_DX, b.y - 1.5];
};
/** the pelvis's exit: sink (world), opacity, fog */
export const pelvisAt = (f: number) => {
  const u = c01(f / T.pelvisOut);
  return { sink: 420 * u * u, op: 1 - sstep((f - 0.45 * T.pelvisOut) / (0.55 * T.pelvisOut)), fog: 0.06 + 0.84 * sstep(f / (0.8 * T.pelvisOut)), give: 2 * Math.max(0, I1.pressAt(I1_LAST - 1)) * (1 - u) };
};
/** the assembly's rise (world dy, + = below its rest): planned as a screen offset (a Hermite ease with an entry speed,
 *  zero speed and finite deceleration at rest) divided by the zoom; extended at the entry speed before asm0 */
const ASM_DS = 1220;
const ASM_V0T = 1500;
export const asmDy = (f: number) => {
  const T0 = T.asm0;
  const TT = T.asm1 - T.asm0;
  const k = camAt(f).k;
  if (f >= T.asm1) return 0;
  if (f < T0) return (ASM_DS + ((T0 - f) * ASM_V0T) / TT) / k;
  const t = (f - T0) / TT;
  const h = ASM_DS * (2 * t * t * t - 3 * t * t + 1) - ASM_V0T * (t * t * t - 2 * t * t + t);
  return h / k;
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
// THE HUB: a squat cream drum, the body's one power source; three outlets (top: the cord; sides: the thick lines)
// ===================================================================================================================
const Hub: React.FC<{ x: number; y: number; tone: (hex: string) => string; pulse: number }> = ({ x, y, tone, pulse }) => {
  const { R, H, ry } = HUB;
  const yt = y - H / 2;
  const yb = y + H / 2;
  const m = MAT.marble;
  const body = `M${n2(x - R)},${n2(yt)}L${n2(x - R)},${n2(yb)}A${n2(R)},${n2(ry)} 0 0 0 ${n2(x + R)},${n2(yb)}L${n2(x + R)},${n2(yt)}Z`;
  const stub = (sx: number, dir: number) => {
    const L = 26;
    const hw = W_THICK / 2 + 7;
    const x0 = dir < 0 ? sx - L : sx;
    return <rect x={x0} y={y - hw} width={L} height={hw * 2} rx={hw * 0.45} fill={tone(m.mid)} stroke={tone(mixHex(m.dark, PAL.shadow, 0.3))} strokeWidth={2.2} />;
  };
  return (
    <g>
      <defs>
        <linearGradient id="hubg" gradientUnits="userSpaceOnUse" x1={x - R} y1="0" x2={x + R} y2="0">
          <stop offset="0" stopColor={tone(m.mid)} />
          <stop offset="0.25" stopColor={tone(m.lit)} />
          <stop offset="0.55" stopColor={tone(mixHex(m.lit, m.mid, 0.6))} />
          <stop offset="0.85" stopColor={tone(mixHex(m.dark, PAL.shadow, 0.1))} />
          <stop offset="1" stopColor={tone(mixHex(m.mid, "#5F877D", 0.35))} />
        </linearGradient>
        <radialGradient id="hubaura">
          <stop offset="0" stopColor={CREAM} stopOpacity={0.32 + 0.1 * pulse} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={0.12 + 0.05 * pulse} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={R * 2.1} ry={R * 1.25} fill="url(#hubaura)" />
      {stub(x - R + 4, -1)}
      {stub(x + R - 4, 1)}
      <path d={body} fill="url(#hubg)" stroke={tone(mixHex(m.dark, PAL.shadow, 0.3))} strokeWidth={2.4} strokeLinejoin="round" />
      <ellipse cx={x} cy={yt} rx={R} ry={ry} fill={tone(mixHex(m.lit, CREAM, 0.4 + 0.2 * pulse))} stroke={tone(mixHex(m.dark, PAL.shadow, 0.3))} strokeWidth={2.4} />
      <ellipse cx={x} cy={yt} rx={R * 0.62} ry={ry * 0.62} fill="none" stroke={tone(m.mid)} strokeWidth={2} strokeOpacity={0.6} />
      {/* the cord's collar on top */}
      <ellipse cx={x} cy={yt - 2} rx={13} ry={5} fill={tone(m.mid)} stroke={tone(mixHex(m.dark, PAL.shadow, 0.3))} strokeWidth={1.8} />
      <path d={`M${n2(x - R * 0.96)},${n2(yt + 4)}L${n2(x - R * 0.96)},${n2(yb - 2)}`} stroke={CREAM} strokeWidth={3} strokeOpacity={0.45} />
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
// THE ASSEMBLY'S LINES (world, at rest; the assembly moves rigidly by asmDy)
// ===================================================================================================================
const stomW = (p: P2): P2 => [STOMACH.x + p[0] * STOMACH.scale, STOMACH.y + p[1] * STOMACH.scale];
const S_ATT = stomW(STOM_ATTACH);
const C_ATT: P2 = [CELL.x - 0.3 * CELL.size, CELL.y + 0.27 * CELL.size];
/** hub -> stomach and hub -> cell (each ends inside its organ: the organ covers the end) */
export const LINE_S = polyOf(bez([HUB.x - HUB.R - 18, HUB.y], [HUB.x - HUB.R - 170, HUB.y + 6], [S_ATT[0] + 90, S_ATT[1] + 120], [S_ATT[0] - 20, S_ATT[1] - 25], 48));
export const LINE_C = polyOf(bez([HUB.x + HUB.R + 18, HUB.y], [HUB.x + HUB.R + 150, HUB.y + 6], [C_ATT[0] - 90, C_ATT[1] + 110], [C_ATT[0] + 25, C_ATT[1] - 25], 48));
/** where along each thick line its organ's edge sits (beads vanish into the organ there) */
const S_EDGE = LINE_S.len - 40;
const C_EDGE = LINE_C.len - 45;
/** the thin cord (world, now): hub top -> stem tip */
export const cordAt = (f: number) => {
  const dy = asmDy(f);
  const a: P2 = [HUB.x, HUB.y - HUB.H / 2 - 2 + dy];
  const b = stemTip(f);
  const L = a[1] - b[1];
  return polyOf(bez(a, [a[0], a[1] - 0.42 * L], [b[0], b[1] + 0.5 * L], b, 60));
};
/** how much of the cord is drawn: its length from the hub up to the moving tip */
export const cordDrawn = (f: number, p: Poly) => {
  const u = c01((f - T.cord0) / (T.cord1 - T.cord0));
  const toGo = 1050 * Math.pow(1 - u, 1.7);
  return f < T.cord0 ? 0 : Math.max(0, p.len - toGo);
};

// ===================================================================================================================
// THE PELVIS BLOCK (I1's drawing, rebuilt; fades out with pelvisAt)
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

const PelvisBack: React.FC<{ A: AirWorld; f: number; pc: P2; bbox: { left: number; right: number; top: number; bottom: number; w: number } }> = ({ A, f, pc, bbox }) => {
  const pa = pelvisAt(f);
  const R = I1.INLET_R;
  const RY = I1.INLET_RY;
  const tiltT = `translate(0 ${n2(pc[1])}) scale(1 ${I1.TILT}) translate(0 ${n2(-pc[1])})`;
  // I1's own fog colour at f0, draining toward the low air behind the pelvis as it sinks
  const pFog = { rgb: mixHex(MAT.ground.mid, A.screenAir(pc[1] + 60), c01(f / 4)), amount: pa.fog };
  const holeA = 1 - (pa.fog - 0.06) / 0.84;
  const wallLit = mixHex("#8C806A", A.airHex(900, 0), 0.25);
  const wallDark = mixHex("#3A3229", A.airHex(900, 0), 0.2);
  const deep = mixHex("#1B1D1A", A.airHex(900, 0), 0.25);
  const shadowA = 1 - sstep(f / 7);
  return (
    <g opacity={pa.op}>
      <defs>
        <mask id="pmask" maskUnits="userSpaceOnUse" x={-500} y={-500} width={2100} height={3000}>
          <rect x={-500} y={-500} width={2100} height={3000} fill="black" />
          <g transform={tiltT}>
            <Pelvis x={pc[0]} y={pc[1]} size={I1.PELVIS_W} uid="pm" />
          </g>
        </mask>
        <radialGradient id="bshadow">
          <stop offset="0" stopColor="#22180F" stopOpacity={0.42} />
          <stop offset="0.55" stopColor="#22180F" stopOpacity={0.22} />
          <stop offset="1" stopColor="#22180F" stopOpacity={0} />
        </radialGradient>
        <clipPath id="hole" clipPathUnits="userSpaceOnUse">
          <path d={ellD(pc[0], pc[1], R, RY)} />
        </clipPath>
        <linearGradient id="wallg" gradientUnits="userSpaceOnUse" x1="0" y1={n2(pc[1] - RY)} x2="0" y2={n2(pc[1] + 0.2 * RY)}>
          <stop offset="0" stopColor={wallLit} />
          <stop offset="0.55" stopColor={wallDark} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <radialGradient id="deepg" gradientUnits="userSpaceOnUse" cx={pc[0]} cy={pc[1] + RY * 0.4} r={R}>
          <stop offset="0" stopColor={deep} />
          <stop offset="1" stopColor={mixHex(deep, wallDark, 0.5)} />
        </radialGradient>
      </defs>
      <g clipPath="url(#hole)" opacity={holeA}>
        <path d={ellD(pc[0], pc[1], R + 2, RY + 2)} fill="url(#deepg)" />
        <path d={wallD(pc[0], pc[1], R + 2, RY + 2, RY * 0.95)} fill="url(#wallg)" />
      </g>
      <g transform={tiltT}>
        <Pelvis x={pc[0]} y={pc[1]} size={I1.PELVIS_W} uid="pb" unitPx={A.k} fog={pFog} />
      </g>
      {shadowA > 0.002 ? (
        <g mask="url(#pmask)" opacity={shadowA}>
          <ellipse cx={(bbox.left + bbox.right) / 2 + 16} cy={(bbox.top + bbox.bottom) / 2 + 26} rx={bbox.w * 0.56} ry={(bbox.bottom - bbox.top) * 0.6} fill="url(#bshadow)" />
        </g>
      ) : null}
    </g>
  );
};
const PelvisRim: React.FC<{ f: number; pc: P2 }> = ({ f, pc }) => {
  const ra = i1RimAmt(I1_LAST) * (1 - sstep(f / 5)) * pelvisAt(f).op;
  if (ra < 0.005) return null;
  const R = I1.INLET_R;
  const RY = I1.INLET_RY;
  return (
    <g mask="url(#pmask)">
      <defs>
        <filter id="rimblur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={2.4} />
        </filter>
      </defs>
      <g opacity={ra} filter="url(#rimblur)">
        <path d={ellArcD(pc[0], pc[1], R + 3, RY + 3, 0, 52)} fill="none" stroke="#F6EEDC" strokeWidth={9} strokeLinecap="round" />
        <path d={ellArcD(pc[0], pc[1], R + 3, RY + 3, 128, 180)} fill="none" stroke="#F6EEDC" strokeWidth={9} strokeLinecap="round" />
      </g>
    </g>
  );
};

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
  const A = airWorldOf({ cam, rest: I1_REST, depth: I1_DEPTH, frame: f + I1_LAST });
  const k = cam.k;
  // the brain
  const b = brainAt(f);
  const bb = brainBox(BRAIN_SIZE, BRAIN_SWELL, b.sx, b.sy);
  const sqT = `translate(${n2(b.x)} ${n2(I1_PIVOT_Y)}) scale(${b.sx.toFixed(5)} ${b.sy.toFixed(5)}) translate(${n2(-b.x)} ${n2(-I1_PIVOT_Y)})`;
  const sqY = (y: number) => I1_PIVOT_Y + (y - I1_PIVOT_Y) * b.sy;
  const bbox = { left: b.x + bb.left, right: b.x + bb.right, top: sqY(b.y + brainBox(BRAIN_SIZE, BRAIN_SWELL).top), bottom: sqY(b.y), w: bb.w };
  // the pelvis
  const pa = pelvisAt(f);
  const pelvisOn = pa.op > 0.002;
  const pc: P2 = [I1.PELVIS_C[0], I1.PELVIS_C[1] + pa.give + pa.sink];
  // the power assembly
  const dy = asmDy(f);
  const asmOn = 960 + (HUB.y - 620 + dy - cam.cy) * k < 2100;
  const airAt = (wy: number) => A.screenAir(wy);
  const tone = (hex: string) => hex;
  const cord = cordAt(f);
  const cordS = cordDrawn(f, cord);
  const sLit = litAt(f, T.stomachLit);
  const cLit = litAt(f, T.cellLit);
  // the assembly fogs a little toward the air until its organ lights (receded context)
  const dimS = 0.32 * (1 - sLit);
  const dimC = 0.32 * (1 - cLit);
  const hubPulse = 0.5 + 0.5 * Math.sin((2 * Math.PI * f) / 20);
  return (
    <AirStage v={A.v} bloom={0.22} motes={0.6}>
      <WorldSvg cam={cam}>
        {asmOn ? (
          <g transform={`translate(0 ${n2(dy)})`}>
            <Conduit p={LINE_S} w={W_THICK} tone={(h) => mixHex(h, airAt(HUB.y + dy), dimS * 0.6)} lit={sLit} />
            <Beads p={LINE_S} end={S_EDGE} f={f} first={T.stomachLit} every={T.thickEvery} v={V_THICK} w={W_THICK * 1.06} len={W_THICK * 1.45} uid="bs" tone={tone} />
            <Conduit p={LINE_C} w={W_THICK} tone={(h) => mixHex(h, airAt(HUB.y + dy), dimC * 0.6)} lit={cLit} />
            <Beads p={LINE_C} end={C_EDGE} f={f} first={T.cellLit} every={T.thickEvery} v={V_THICK} w={W_THICK * 1.06} len={W_THICK * 1.45} uid="bc" tone={tone} />
          </g>
        ) : null}
        {/* the brain's cord: drawn up from the hub by its tip; beads by their arrival at the stem */}
        <Conduit p={cord} s1={cordS} w={W_THIN} tone={tone} />
        <Beads p={cord} f={f} first={T.bead0} every={T.beadEvery} v={V_THIN} w={W_THIN * 1.9} len={W_THIN * 2.8} sMax={cordS} uid="bt" tone={tone} />
        {cordS > 1 && cordS < cord.len - 1 ? <circle cx={atS(cord, cordS).pt[0]} cy={atS(cord, cordS).pt[1]} r={W_THIN * 0.95} fill={CREAM} /> : null}
        {asmOn ? (
          <g transform={`translate(0 ${n2(dy)})`}>
            <Hub x={HUB.x} y={HUB.y} tone={tone} pulse={hubPulse} />
            <Stomach x={STOMACH.x} y={STOMACH.y} scale={STOMACH.scale} uid="st" unitPx={k} lit={sLit} f={f} dim={dimS} air={airAt(STOMACH.y + dy)} />
            <Cell x={CELL.x} y={CELL.y} size={CELL.size} uid="ce" unitPx={k} lit={cLit} f={f} dim={dimC} air={airAt(CELL.y + dy)} />
          </g>
        ) : null}
        {pelvisOn ? <PelvisBack A={A} f={f} pc={pc} bbox={bbox} /> : null}
        {/* the brain: inside the inlet (I1's clip) while the pelvis is there */}
        <g clipPath={pelvisOn ? "url(#vis)" : undefined}>
          {pelvisOn ? (
            <defs>
              <clipPath id="vis" clipPathUnits="userSpaceOnUse">
                <path d={visibleD(pc[0], pc[1], I1.INLET_R, I1.INLET_RY)} />
              </clipPath>
            </defs>
          ) : null}
          <g transform={sqT}>
            <Brain x={b.x} y={b.y} size={BRAIN_SIZE} swell={BRAIN_SWELL} uid="br" unitPx={k} rot={b.rot} glow={b.glow} />
          </g>
        </g>
        {pelvisOn ? <PelvisRim f={f} pc={pc} /> : null}
        <Plate t={(f - T.plate0) / 12} />
      </WorldSvg>
    </AirStage>
  );
};

export default TwentyWatts;
