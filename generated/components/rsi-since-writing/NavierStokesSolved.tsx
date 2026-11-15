// ---------------------------------------------------------------------------
// NavierStokesSolved (rsi-since-writing, cut 42). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 114 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d. The flow field is cut-local (below).
//
// CHECK LINE: "An AI solved Navier-Stokes, the famous unsolved equation of how fluids flow."
//
// THE LINE: "OpenAI reported two months ago that an internal model solved the Navier-Stokes problem,"
// WORD -> FRAME (f0 = sequence 42.3757 s): OpenAI 1 · reported 11 · two 19 · months 26 · ago 31 · that 36 · an 46 ·
// internal 48 · model 56 · SOLVED 66 · the 83 · NAVIER-STOKES 86 · PROBLEM 102 · (slot ends; "one" 113)
// DURATION: the slot 42.3757 -> 47.1304 s = 4.7547 s x 23.976 = 114 frames (f0..f113).
//
// THE MOTION: a plain round stone post (a smooth cylinder on the floor, the obstacle) stands in the air; the misty air streams past it from left to right as a sheet of
// soft CREAM smoke lines (a smoke tunnel seen from above, ~45 deg down at rest) that part around the column and roll
// up behind it into a von Karman street of alternating curls that grow as they drift downstream. The floor below sinks
// into the dense low air (a low-air veil by screen row). The camera opens close (x1.8) on the near wake (the forming
// curl and the first grown one, the column whole at the left edge) and pulls back in one deceleration lobe (f0 ->
// ~f54, then a slow creep); the pull-back brings the equation plate, fully above the frame at f0, down into frame
// (in the keep-in box by f38, near rest before "internal model"). On "solved" an ORANGE trace runs along every
// streamline from the left edge to the right edge (f61 -> ~f94; visible from f64), following each line around the
// column and into the curls. The payoff on the equation: as the trace reaches the right edge, the equation's glyphs
// (main line and continuity line) warm from cream to orange left to right (a soft front, f91 -> f102: the AI's
// solution), then an orange tick (~85 px tall) is written beside it (f99 -> f106). The label stays cream. Settled
// (f106-113): every line's core traced in orange inside its cream smoke halo, each curl keeping a cream inner wisp
// (the trace gives way to cream in a grown curl's core), the curls still drifting, the orange ticked equation.
// Orange = the AI only (COMMON.md): the trace, the warmed equation, the tick. Everything else cream, stone, umber, air.
//
// THE FLOW (analytic, seek-safe, no simulation state): each smoke line j has an upstream offset z0_j (world Z). Its
// shape at frame f is a pure function of (z0_j, f): (1) the potential-flow streamline round a cylinder of radius R
// (psi = z (1 - R^2 / (x^2 + z^2)) = z0, solved per x by bisection), stretched downstream so the lines close behind
// the column over ~3.6 R (the dead-water bubble); (2) the vortex street as TWIRLS: vortex k is born at f = k * TB
// behind the column on alternating sides, moves downstream at constant speed C, and rotates every point within its
// radius rho by Gamma * (1 - (r / rho)^2)^3 (clockwise on the far side, counter-clockwise on the near side; Gamma and
// rho grow with its age). Each twirl rotates whole rings, so it is a bijection: lines never cross, at any frame.
// The smoke's puffs advect along each line at the free-stream speed U (density by the line's own upstream x).
// The orange front is a world x (the line's own upstream x), so it follows each line through its winding.
//
// DEPTH: eye 4000 above the sheet (Y -5100), dRef 4000 at kRef 0.5 (45 deg down at rest), dolly 0.3; fog "depth".
// The post X 0, Z 0, R 130 (1.46 m), Y 0..-1500 (one smooth stone cylinder, no plinth or capital); the smoke sheet at Y -1100,
// lines Z -488..646; the floor Y 0. The plate on the front plane (Z 0).
// Painter's order: floor, the column, the smoke (bodies, cores, orange), the column again ABOVE the sheet (clipped to
// the region above the sheet's front arc), the plate, the tick.
//
// SOURCES: the incompressible Navier-Stokes equations (momentum and continuity), as stated by the Clay Mathematics
// Institute's Millennium Prize problem "Navier-Stokes existence and smoothness" (Fefferman, 2000). The OpenAI report
// is the speaker's account: nothing about it on screen. Von Karman street: shedding at Strouhal ~0.2, the spacing
// here tightened (1.6 D between alternate vortices) so ~4 curls fit the frame;
// the curls grow with age (rho 0.8 -> 1.95 R) as they drift.
// CHECKS (revision 2 preview): at rest the main line x 93-883 (~790 px), the tick to x ~1013, the label (0.64 em,
// ~1.6x) from y ~320, the continuity line (0.86 em, ~1.3x, full opacity) to y ~567; the post's top cap whole on every
// frame (f0 from y ~67, at rest ~625, below the plate); the plate is fully above the frame at f0 (its last line y < -12), enters f1, its main
// line crosses the top edge ~f10 (ends ~8 px past the frame edges for ~2 frames, in the dead top zone), the whole
// plate is inside the keep-in box from f38. The column whole in x on every frame (f0 x ~30-350). The curls' visible
// spirals inside y ~340-1040 on every frame (their outer twirl radius reaches 1081 at rest, undeformed lines there).
// Camera: one deceleration lobe f0-54, then a constant creep (k 0.90 -> 0.50).
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont as loadMath } from "@remotion/google-fonts/LibertinusMath";
import { AIR, ACCENT, AirCyl, AirFloor, AirShadow, AirStage, MAT, ORANGE_LINE, WorldSvg, airWorldOf, c01, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { PLATE_FONT } from "../rsi-ten-earths/tenEarthsHall";

const { fontFamily: MATH_FONT } = loadMath("normal", { weights: ["400"], subsets: ["latin", "math", "greek"] });

export const FPS = 24000 / 1001;
export const DURATION = 114;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const LOW_AIR = "#33302A";
const CREAM = PAL.cream;
type P2 = [number, number];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const f2 = (v: number) => v.toFixed(2);

// ===================================================================================================================
// THE WORLD
// ===================================================================================================================
const R = 130;
export const SHEET_Y = -1100;
const COL_TOP = -1500;
/** the eye 4000 above the sheet at the rest distance 4000: looking down 45 deg on the sheet at rest */
export const DEPTH: DepthOpts = { eyeY: SHEET_Y - 4000, dRef: 4000, kRef: 0.5, dolly: 0.3 };

// ===================================================================================================================
// THE CAMERA: one pull-back about a fixed screen point (a zoom of x1.95 -> 1), one deceleration lobe into a creep.
// f0: close on the near wake (the forming curl and the first grown one), the column whole at the left edge, the plate
// fully above the frame; the pull-back brings the plate down into frame (in by ~f38, near rest by f46).
// ===================================================================================================================
const KR = 0.5;
const ZOOM0 = 1.8;
/** the rest framing: the column's centre at the sheet (0, SHEET_Y) at screen (290, 880) */
const REST_CX = 0 - (290 - 540) / KR;
const REST_CY = SHEET_Y - (880 - 960) / KR;
/** the zoom's fixed point (screen at rest): at f0 the column's centre lands at x ~190 (its capital whole), the two
 *  near-wake curls at x ~520 / ~880, y ~660, and the plate's last line above the frame (y < -20) */
const FIX: P2 = [415, 1295];
const FIXW: P2 = [REST_CX + (FIX[0] - 540) / KR, REST_CY + (FIX[1] - 960) / KR];
const PULL_END = 54;
const progressAt = (f: number) => {
  const u = c01(f / PULL_END);
  return 0.975 * (1 - Math.pow(1 - u, 3)) + 0.025 * (f / (DURATION - 1));
};
export const camAt = (f: number): Cam => {
  const k = KR * Math.pow(ZOOM0, 1 - progressAt(f));
  return { k, cx: FIXW[0] - (FIX[0] - 540) / k, cy: FIXW[1] - (FIX[1] - 960) / k };
};
const REST = swayCam(camAt(0), 0);

// ===================================================================================================================
// THE FLOW
// ===================================================================================================================
const U = 8.2; // free stream, world units per frame
const C = 0.85 * U; // the vortices' drift
const A_SP = 400; // spacing along x between alternate vortices
const TB = A_SP / C; // frames between sheddings
/** the shedding phase: a curl aged 20 frames at f0 (with the next one 57 frames older) frames the opening */
const PHASE = -20;
const X_BIRTH = 1.75 * R;
const GAMMA = 6.2; // radians at full strength (~1 turn at the core)
const N_LINES = 37;
const DZ = 31.5;
/** upstream offsets: symmetric about the column's centre line, Z -488..646 */
const Z0S = Array.from({ length: N_LINES }, (_, i) => (i - 16 + 0.5) * DZ);
const X_MIN = -1500;
const X_MAX = 2700;

type Vortex = { x: number; z: number; rho: number; gam: number; side: number; bulge: number };
export const vorticesAt = (f: number): Vortex[] => {
  const out: Vortex[] = [];
  const kHi = Math.floor((f - PHASE) / TB);
  for (let k = kHi; k > kHi - 16; k--) {
    const age = f - (k * TB + PHASE);
    if (age < 0) continue;
    const x = X_BIRTH + C * age;
    if (x > X_MAX + 400) break;
    const side = k % 2 === 0 ? 1 : -1; // +1 the far side (Z +)
    const grow = 1 - Math.exp(-age / 70);
    out.push({
      x,
      z: side * R * (0.35 + 0.7 * grow),
      rho: R * (0.8 + 1.05 * grow),
      gam: -side * GAMMA * (1 - Math.exp(-age / 20)) * Math.exp(-age / 520),
      side,
      bulge: 0.55 * R * grow,
    });
  }
  return out;
};

/** the potential-flow streamline round the column: z at x for the line psi = z0 (bisection) */
const potZ = (x: number, z0: number) => {
  const s = z0 >= 0 ? 1 : -1;
  const a = Math.abs(z0);
  const r2 = R * R;
  let lo = Math.max(a, Math.sqrt(Math.max(0, r2 - x * x)));
  let hi = a + R;
  for (let i = 0; i < 34; i++) {
    const m = (lo + hi) / 2;
    const v = m - (r2 * m) / (x * x + m * m) - a;
    if (v < 0) lo = m;
    else hi = m;
  }
  return s * (lo + hi) / 2;
};
/** downstream the lines close more slowly (the bubble behind the column) */
const xEff = (x: number) => (x <= 0 ? x : x / (1 + 0.8 * sstep(x / (2 * R))));

/** the street's meander: the lines near each vortex lean toward its side (monotone in z: dz'/dz > 0.5) */
const meander = (x: number, zz: number, vs: Vortex[]) => {
  let d = 0;
  for (const v of vs) {
    const ux = (x - v.x) / (0.5 * A_SP);
    const uz = (zz - v.z) / (2.4 * R);
    d += v.side * v.bulge * Math.exp(-ux * ux - uz * uz);
  }
  return zz + d;
};
/** the twirls; also the WISP: how deep the point sits in a grown curl's core (0..1; the cream that stays) */
const twirl = (p: P2, vs: Vortex[]): [number, number, number] => {
  let [x, zz] = p;
  let wisp = 0;
  for (const v of vs) {
    const dx = x - v.x;
    const dz = zz - v.z;
    const r2 = dx * dx + dz * dz;
    const q = r2 / (v.rho * v.rho);
    if (q >= 1) continue;
    wisp = Math.max(wisp, (1 - sstep((Math.sqrt(q) - 0.14) / 0.34)) * c01(Math.abs(v.gam) / GAMMA));
    const w = 1 - q;
    const th = v.gam * w * w * w;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    x = v.x + dx * cs - dz * sn;
    zz = v.z + dx * sn + dz * cs;
  }
  return [x, zz, wisp];
};

type LinePt = { X: number; Z: number; x0: number; wisp: number };
/** one smoke line at frame f: points along its own upstream x, warped */
const lineAt = (z0: number, vs: Vortex[]): LinePt[] => {
  const map = (x0: number): LinePt => {
    const zp = meander(x0, potZ(xEff(x0), z0), vs);
    const [X, Z, wisp] = twirl([x0, zp], vs);
    return { X, Z, x0, wisp };
  };
  const pts: LinePt[] = [];
  const push = (a: LinePt, b: LinePt, depth: number) => {
    const d = Math.hypot(b.X - a.X, b.Z - a.Z);
    if (d > 5 && depth < 5) {
      const m = map((a.x0 + b.x0) / 2);
      push(a, m, depth + 1);
      push(m, b, depth + 1);
    } else pts.push(b);
  };
  let prev = map(X_MIN);
  pts.push(prev);
  let x = X_MIN;
  while (x < X_MAX) {
    const step = x < -2.2 * R ? 14 : 5;
    x = Math.min(X_MAX, x + step);
    const cur = map(x);
    push(prev, cur, 0);
    prev = cur;
  }
  return pts;
};

/** the smoke's density along a line (advects with the free stream) */
const densAt = (x0: number, j: number, f: number) => {
  const s = x0 - U * f;
  const a = 0.5 + 0.5 * Math.sin((2 * Math.PI * s) / 560 + j * 2.39);
  const b = 0.5 + 0.5 * Math.sin((2 * Math.PI * s) / 1370 + j * 1.13 + 0.7);
  return 0.45 + 0.55 * (0.55 * a + 0.45 * b);
};

// ===================================================================================================================
// THE ORANGE TRACE: a front in the lines' own upstream x
// ===================================================================================================================
const TRACE_F0 = 61;
const TRACE_X0 = -700;
const TRACE_V = 84; // world units per frame (constant after a 6-frame start)
/** each line's trace runs a little ahead or behind the mean front (a ragged front of separate traces) */
const traceLag = (j: number) => 75 * Math.sin(j * 2.13 + 0.4) + 55 * Math.sin(j * 0.71 + 1.9);
export const traceFront = (f: number) => {
  const u = f - TRACE_F0;
  if (u <= 0) return -1e9;
  const ramp = 6;
  return TRACE_X0 + (u < ramp ? (TRACE_V * u * u) / (2 * ramp) : TRACE_V * (u - ramp / 2));
};
const HEAD = 80;
/** the outer lines thin out (the smoke rake's edges) */
const edgeFade = (j: number) => sstep((j + 0.6) / 6) * sstep((N_LINES - 1 - j + 0.6) / 7);

// ===================================================================================================================
// THE PLATE (world space, the front plane Z 0): the label, the momentum equation, the continuity line, the tick
// ===================================================================================================================
const restWorld = (sx: number, sy: number): P2 => [REST_CX + (sx - 540) / KR, REST_CY + (sy - 960) / KR];
const EQ_S = 158; // the main line's font size (world; 79 px at rest: the main line ~790 px wide)
export const EQ_C = restWorld(485, 436); // the main line's centre (x) and math axis (y) at rest
/** the payoff: the equation's glyphs warm cream -> orange left to right as the trace reaches the right edge (~f91-93) */
export const WARM_F0 = 91;
export const WARM_DUR = 11;
const WARM_EDGE = 0.8; // the warm front's soft half-width (em)
export const TICK_F0 = 99;
export const TICK_DUR = 7;
/** the tick's points relative to (tx, axis), in em of the main size; tx = the main line's right end + TICK_GAP */
export const TICK_GAP = 0.42;
export const TICK_SHAPE: P2[] = [
  [0, 0.03],
  [0.36, 0.45],
  [1.08, -0.63],
];

const PD = "∂";
const NABLA = "∇";
const BU = "\u{1D42E}"; // bold u
const IT = "\u{1D461}"; // italic t
const IP = "\u{1D45D}"; // italic p
const RHO = "\u{1D70C}";
const NU = "\u{1D708}";
const CDOT = "⋅";
const MINUS = "−";
const THIN = "\u2009";

const MathText: React.FC<{ x: number; y: number; s: number; anchor?: "start" | "middle" | "end"; children: React.ReactNode; font?: string; weight?: number; ls?: number; op?: number; fill?: string }> = ({
  x,
  y,
  s,
  anchor = "start",
  children,
  font = MATH_FONT,
  weight = 400,
  ls = 0,
  op = 1,
  fill = CREAM,
}) => (
  <text
    x={f2(x)}
    y={f2(y)}
    textAnchor={anchor}
    fill={fill}
    fillOpacity={op}
    stroke={PAL.shadow}
    strokeOpacity={0.8 * op}
    strokeWidth={f2(s * 0.12)}
    strokeLinejoin="round"
    paintOrder="stroke"
    style={{ fontFamily: font, fontWeight: weight, fontSize: s, letterSpacing: ls * s }}
  >
    {children}
  </text>
);

/** a stacked fraction centred at x on the math axis y */
const Frac: React.FC<{ x: number; y: number; s: number; w: number; num: string; den: string; fill: string }> = ({ x, y, s, w, num, den, fill }) => {
  const fs = s * 0.82;
  return (
    <g>
      <MathText x={x} y={y - s * 0.17} s={fs} anchor="middle" fill={fill}>
        {num}
      </MathText>
      <rect x={f2(x - w / 2 - s * 0.02)} y={f2(y - s * 0.05)} width={f2(w + s * 0.04)} height={f2(s * 0.09)} fill={PAL.shadow} fillOpacity={0.8} rx={s * 0.04} />
      <rect x={f2(x - w / 2)} y={f2(y - s * 0.028)} width={f2(w)} height={f2(s * 0.056)} fill={fill} />
      <MathText x={x} y={y + s * 0.71} s={fs} anchor="middle" fill={fill}>
        {den}
      </MathText>
    </g>
  );
};

/** the equation's layout in em of the main size (Libertinus Math advances, tuned on stills) */
export const EQ_LAYOUT = (() => {
  const L = {
    frac1: 1.02, // dU/dt
    plus1: 0.86,
    conv: 2.62, // (u . nabla) u
    eq: 0.92,
    minus: 0.72,
    frac2: 1.0, // nabla p / rho
    plus2: 0.86,
    visc: 2.0, // nu nabla^2 u
  };
  const total = Object.values(L).reduce((a, b) => a + b, 0);
  let acc = -total / 2;
  const at: Record<string, number> = {};
  for (const [k, v] of Object.entries(L)) {
    at[k] = acc;
    acc += v;
  }
  return { L, at, total };
})();

const Equation: React.FC<{ frame: number }> = ({ frame }) => {
  const s = EQ_S;
  const [cx, ay] = EQ_C;
  const { L, at, total } = EQ_LAYOUT;
  const X = (k: string) => cx + at[k] * s;
  const base = ay + s * 0.26; // the main baseline (the math axis ~0.26 em above it)
  // the tick: one stroke written by a moving tip, beside the main line
  const tx = cx + (total / 2) * s + TICK_GAP * s;
  const tickPts: P2[] = TICK_SHAPE.map(([u, v]) => [tx + u * s, ay + v * s]);
  // the warm front: a soft cream -> orange edge sweeping the main line (and the continuity line) left to right
  const half = (total / 2) * s;
  const e = WARM_EDGE * s;
  const wt = c01((frame - WARM_F0) / WARM_DUR);
  const wf = lerp(cx - half - e, cx + half + e, wt * wt * (3 - 2 * wt));
  const paint = frame >= WARM_F0 ? "url(#ns-warm)" : CREAM;
  const seg1 = Math.hypot(tickPts[1][0] - tickPts[0][0], tickPts[1][1] - tickPts[0][1]);
  const seg2 = Math.hypot(tickPts[2][0] - tickPts[1][0], tickPts[2][1] - tickPts[1][1]);
  const tt = c01((frame - TICK_F0) / TICK_DUR);
  const te = 1 - Math.pow(1 - tt, 1.6);
  const len = te * (seg1 + seg2);
  let tick: P2[] = [];
  if (len > 0.5) {
    if (len <= seg1) tick = [tickPts[0], [lerp(tickPts[0][0], tickPts[1][0], len / seg1), lerp(tickPts[0][1], tickPts[1][1], len / seg1)]];
    else tick = [tickPts[0], tickPts[1], [lerp(tickPts[1][0], tickPts[2][0], (len - seg1) / seg2), lerp(tickPts[1][1], tickPts[2][1], (len - seg1) / seg2)]];
  }
  const td = tick.map((p, i) => `${i ? "L" : "M"}${f2(p[0])},${f2(p[1])}`).join("");
  const tip = tick.length ? tick[tick.length - 1] : null;
  const glowA = tt > 0 ? 0.55 * (1 - 0.6 * sstep((frame - TICK_F0 - TICK_DUR) / 8)) : 0;
  return (
    <g>
      <defs>
        <radialGradient id="ns-plate">
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.5} />
          <stop offset="0.55" stopColor={PAL.shadow} stopOpacity={0.36} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="ns-tipglow">
          <stop offset="0" stopColor="#FFE2A0" stopOpacity={1} />
          <stop offset="0.4" stopColor={ACCENT} stopOpacity={0.6} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="ns-warm" gradientUnits="userSpaceOnUse" x1={f2(wf - e)} y1="0" x2={f2(wf + e)} y2="0">
          <stop offset="0" stopColor={ACCENT} />
          <stop offset="1" stopColor={CREAM} />
        </linearGradient>
      </defs>
      <ellipse cx={f2(cx + 0.2 * s)} cy={f2(ay + 0.05 * s)} rx={f2((total / 2) * s + 1.0 * s)} ry={f2(1.55 * s)} fill="url(#ns-plate)" />
      <MathText x={cx} y={ay - 1.06 * s} s={0.64 * s} anchor="middle" font={PLATE_FONT} weight={700} ls={0.12} op={0.96}>
        NAVIER–STOKES
      </MathText>
      <Frac x={X("frac1") + (L.frac1 * s) / 2} y={ay} s={s} w={0.86 * s} num={`${PD}${BU}`} den={`${PD}${IT}`} fill={paint} />
      <MathText x={X("plus1") + (L.plus1 * s) / 2} y={base} s={s} anchor="middle" fill={paint}>
        +
      </MathText>
      <MathText x={X("conv") + (L.conv * s) / 2} y={base} s={s} anchor="middle" fill={paint}>
        {`(${BU}${CDOT}${NABLA})${BU}`}
      </MathText>
      <MathText x={X("eq") + (L.eq * s) / 2} y={base} s={s} anchor="middle" fill={paint}>
        =
      </MathText>
      <MathText x={X("minus") + (L.minus * s) / 2} y={base} s={s} anchor="middle" fill={paint}>
        {MINUS}
      </MathText>
      <Frac x={X("frac2") + (L.frac2 * s) / 2} y={ay} s={s} w={0.84 * s} num={`${NABLA}${IP}`} den={RHO} fill={paint} />
      <MathText x={X("plus2") + (L.plus2 * s) / 2} y={base} s={s} anchor="middle" fill={paint}>
        +
      </MathText>
      <MathText x={X("visc") + (L.visc * s) / 2} y={base} s={s} anchor="middle" fill={paint}>
        {`${NU}${THIN}${NABLA}²${BU}`}
      </MathText>
      <MathText x={cx} y={ay + 1.58 * s} s={0.86 * s} anchor="middle" fill={paint}>
        {`${NABLA}${CDOT}${BU} = 0`}
      </MathText>
      {td ? (
        <g>
          {tip ? <circle cx={f2(tip[0])} cy={f2(tip[1])} r={f2(0.6 * s)} fill="url(#ns-tipglow)" opacity={glowA} /> : null}
          <path d={td} fill="none" stroke={ORANGE_LINE} strokeOpacity={0.85} strokeWidth={f2(0.26 * s)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={td} fill="none" stroke={ACCENT} strokeWidth={f2(0.17 * s)} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
    </g>
  );
};

// ===================================================================================================================
// THE SMOKE
// ===================================================================================================================
type Drawn = { pts: P2[]; Z: number[]; x0: number[]; wisp: number[] };
const toD = (pts: P2[], a = 0, b = pts.length) => {
  let d = "";
  for (let i = a; i < b; i++) d += `${i === a ? "M" : "L"}${f2(pts[i][0])},${f2(pts[i][1])}`;
  return d;
};

const Smoke: React.FC<{ A: AirWorld; lines: Drawn[]; frame: number }> = ({ A, lines, frame }) => {
  const k = A.k;
  const front0 = traceFront(frame);
  const bodies: React.ReactNode[] = [];
  const cores: React.ReactNode[] = [];
  const orange: React.ReactNode[] = [];
  const heads: React.ReactNode[] = [];
  lines.forEach((ln, j) => {
    const zMid = Z0S[j];
    const r = A.P.r(zMid);
    const fog = 0.6 * A.fog(Math.max(0, zMid));
    const ef = edgeFade(j);
    if (ef < 0.02) return;
    const front = front0 - traceLag(j);
    const col = A.tone(CREAM, zMid, -SHEET_Y);
    const dim = mixHex(col, "#5F877D", 0.5);
    // body: chunks (stroke colour = density), one group opacity so the chunks never bead at their joints
    const n = ln.pts.length;
    const CH = 14;
    const chunks: React.ReactNode[] = [];
    for (let a = 0; a < n - 1; a += CH) {
      const b = Math.min(n, a + CH + 1);
      const xm = ln.x0[Math.min(n - 1, a + (CH >> 1))];
      const d = densAt(xm, j, frame);
      chunks.push(<path key={a} d={toD(ln.pts, a, b)} stroke={mixHex(dim, col, d)} />);
    }
    bodies.push(
      <g key={j} opacity={0.42 * (1 - 0.5 * fog) * ef} fill="none" strokeWidth={f2((7.5 / KR) * r)} strokeLinecap="round" strokeLinejoin="round">
        {chunks}
      </g>,
    );
    cores.push(<path key={j} d={toD(ln.pts)} fill="none" stroke={col} strokeOpacity={0.66 * (1 - 0.5 * fog) * ef} strokeWidth={f2((2.3 / KR) * r)} strokeLinejoin="round" />);
    // the orange: every point whose own upstream x the front has passed
    if (front > X_MIN) {
      let iEnd = 0;
      while (iEnd < n && ln.x0[iEnd] <= front) iEnd++;
      if (iEnd > 1) {
        const oc = A.toneO(ACCENT, zMid, -SHEET_Y);
        // the trace rides the core (thinner than the cream core, so a cream edge and the smoke halo stay); in a grown
        // curl's core it gives way to the cream (the inner wisp). Chunks of solid colour under one group opacity.
        const OCH = 8;
        const och: React.ReactNode[] = [];
        for (let a = 0; a < iEnd - 1; a += OCH) {
          const b = Math.min(iEnd, a + OCH + 1);
          const w = ln.wisp[Math.min(iEnd - 1, a + (OCH >> 1))];
          och.push(<path key={a} d={toD(ln.pts, a, b)} stroke={mixHex(oc, col, 0.92 * w)} />);
        }
        orange.push(
          <g key={j} opacity={0.12 + 0.88 * ef} fill="none" strokeWidth={f2((1.45 / KR) * r)} strokeLinejoin="round" strokeLinecap="round">
            {och}
          </g>,
        );
        if (iEnd < n) {
          let iH = iEnd - 1;
          while (iH > 0 && ln.x0[iH] > front - HEAD) iH--;
          heads.push(
            <path key={j} d={toD(ln.pts, iH, iEnd)} fill="none" stroke="#FFD98A" strokeOpacity={0.85 * ef} strokeWidth={f2((3.6 / KR) * r)} strokeLinejoin="round" strokeLinecap="round" />,
          );
        }
      }
    }
  });
  void k;
  return (
    <g>
      <defs>
        <filter id="ns-soft" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation={f2(2.2 / A.k)} />
        </filter>
      </defs>
      <g filter="url(#ns-soft)">{bodies}</g>
      <g>{cores}</g>
      <g>{orange}</g>
      <g>{heads}</g>
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const NavierStokesSolved: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, fogBy: "depth" });
  const P = A.P;
  const lines = useMemo<Drawn[]>(() => {
    const vs = vorticesAt(frame);
    return Z0S.map((z0) => {
      const L = lineAt(z0, vs);
      return { pts: L.map((q) => P.p(q.X, SHEET_Y, q.Z)), Z: L.map((q) => q.Z), x0: L.map((q) => q.x0), wisp: L.map((q) => q.wisp) };
    });
  }, [frame, P]);
  // the column above the sheet: clipped to the region above the sheet's front arc
  const c = P.p(0, SHEET_Y, 0);
  const rx = R * P.r(0);
  const ry = Math.abs(P.p(0, SHEET_Y, -R)[1] - P.p(0, SHEET_Y, R)[1]) / 2;
  const top = P.p(0, COL_TOP, 0)[1] - 400;
  const clip = `M${f2(c[0] - rx - 60)},${f2(top)}L${f2(c[0] + rx + 60)},${f2(top)}L${f2(c[0] + rx + 60)},${f2(c[1])}L${f2(c[0] + rx)},${f2(c[1])}A${f2(rx)},${f2(ry)} 0 0 1 ${f2(c[0] - rx)},${f2(c[1])}L${f2(c[0] - rx - 60)},${f2(c[1])}Z`;
  // the obstacle: a plain smooth stone post standing on the floor (no plinth, no capital, no flutes)
  const shaft = (uid: string) => <AirCyl A={A} X={0} Z={0} R={R} Y0={COL_TOP} Y1={0} mat={MAT.stone} uid={uid} />;
  // the low air: the floor sinks into the dense air toward the bottom of the frame (screen rows, in world units)
  const wy = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const wx0 = cam.cx - 700 / cam.k;
  const veil = (
    <g>
      <defs>
        <linearGradient id="ns-low" gradientUnits="userSpaceOnUse" x1="0" y1={f2(wy(560))} x2="0" y2={f2(wy(1920))}>
          <stop offset="0" stopColor={LOW_AIR} stopOpacity={0} />
          <stop offset="0.3" stopColor={LOW_AIR} stopOpacity={0.3} />
          <stop offset="0.55" stopColor={LOW_AIR} stopOpacity={0.55} />
          <stop offset="1" stopColor={LOW_AIR} stopOpacity={0.82} />
        </linearGradient>
      </defs>
      <rect x={f2(wx0)} y={f2(wy(560))} width={f2(1400 / cam.k)} height={f2(1400 / cam.k)} fill="url(#ns-low)" />
    </g>
  );
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-9000} x1={9000} z0={-2600} z1={22000} mat={MAT.ground} course={340} jointAmt={0.35} />
        <AirShadow A={A} X={0} Z={0} w={300} d={170} uid="colS" amt={0.85} />
        {shaft("col")}
        {veil}
        <Smoke A={A} lines={lines} frame={frame} />
        <defs>
          <clipPath id="ns-upper">
            <path d={clip} />
          </clipPath>
        </defs>
        <g clipPath="url(#ns-upper)">
          {shaft("col2")}
        </g>
        <Equation frame={frame} />
      </WorldSvg>
    </AirStage>
  );
};

export default NavierStokesSolved;
