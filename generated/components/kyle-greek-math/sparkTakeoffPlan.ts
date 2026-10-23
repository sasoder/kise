// ---------------------------------------------------------------------------
// sparkTakeoffPlan: the world, the drawn line, the geometer's stick and the camera of SparkingSustainedTakeoff
// (kyle-greek-math, cut 15). Pure numbers (no React): the set (./sparkTakeoffSet.tsx) and the cut draw from it.
//
// UNITS: the cast's (a man ~312 tall = 1.75 m, U = 178 per metre). X across (+ right), Y height (the floor Y = 0,
// up is - Y), Z depth behind the front plane (londonDepth's model; the front plane Z = 0 runs through the diagram).
//
// THE SET (top-down): Thales' figure drawn in the sand at C (a circle of R 0.62 m, its diameter along the line's
// direction LINE_DIR, the right-angled triangle on it with the apex on the near side, a small right-angle mark); the
// geometer crouched at its left facing right with a long stick; behind the diagram the companion beside his armillary
// sphere on its stand; a stoa (a Doric colonnade on a stylobate, a back wall) running back along Z on the far left
// into the haze. The long line leaves the diagram at the diameter's right end D1 and runs on along LINE_DIR (right and
// back) to the KNEE, where it lifts into the hockey-stick curve (in the vertical plane through the line).
//
// THE CAMERA: an eye (x, height, z), a focal length F (screen px) and a vertical lens shift (the horizon's screen row
// hy): verticals stay vertical, every receding edge meets the one VP at screen x 540. Keys -> pchip targets -> the
// damped follow (CAM_STIFF / CAM_DAMP, a 5-frame lead): SlavesTurnTheCrane's camera pattern. camKit() turns an eye
// into the kit's 2D camera + DepthOpts (dolly 1, so the kit's perspective reproduces the eye exactly).
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip, type Cam } from "../kits/maps/incaShared";
import type { DepthOpts } from "../kyle-london/londonDepth";

export const FPS = 30000 / 1001;
export const DURATION = 243;
export const U = 178;

export type V2 = [number, number];
export type V3 = [number, number, number];
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (v: number) => {
  const t = c01(v);
  return t * t * (3 - 2 * t);
};
/** smootherstep (zero 1st and 2nd derivative at the ends) */
export const smoother = (v: number) => {
  const t = c01(v);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const deg = (d: number) => (d * Math.PI) / 180;
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ===================================================================================================================
// THE SET
// ===================================================================================================================
/** Thales' figure: the circle's centre (X, Z) and radius */
export const C: V2 = [220, 170];
export const R = 92;
/** the long line's direction on the floor (right and back, deg from +X toward +Z) */
export const LINE_DEG = 45;
export const A_LINE = deg(LINE_DEG);
export const LINE_DIR: V2 = [Math.cos(A_LINE), Math.sin(A_LINE)];
/** the circle point at angle a (rad, from +X toward +Z: 90 deg = the far side, -90 = the near side) */
export const onCircle = (a: number): V2 => [C[0] + R * Math.cos(a), C[1] + R * Math.sin(a)];
/** the diameter's ends (along the line) and the apex of the right angle (on the near side) */
export const D0 = onCircle(A_LINE + Math.PI);
export const D1 = onCircle(A_LINE);
export const A_APEX = A_LINE - deg(112);
export const APEX = onCircle(A_APEX);

/** the geometer (feet; crouched, he faces right) and, behind the diagram, the armillary sphere and the companion */
export const GEO: V2 = [0, 0];
export const SPHERE: V2 = [150, 700];
export const COMP: V2 = [270, 735];
/** the stoa: the colonnade along Z on the far left */
export const STOA = { X: -720, Z0: 700, Z1: 7400, step: 440, colR: 62, colH: 1000, styloH: 96, wallX: -1170 };

// ===================================================================================================================
// THE DIAGRAM: the circle's last arc closed by the stick, f0 -> CIRCLE_END
// ===================================================================================================================
/** the circle was begun (and is closed) at A_CLOSE, on its far left; at f0 the tip is at A_TIP0, on its right */
export const A_CLOSE = deg(140);
export const A_TIP0 = deg(28);
export const CIRCLE_END = 34;
/** the angle of the stick tip on the circle (rad): moving at f0, settling into the closing point */
export const circleTipA = (f: number) => {
  const t = c01(f / CIRCLE_END);
  const e = 1 - Math.pow(1 - t, 2.1);
  return lerp(A_TIP0, A_CLOSE, e);
};
/** the drawn arc [from, to] (rad) at frame f: begun at A_CLOSE - 2 pi */
export const circleArc = (f: number): [number, number] => [A_CLOSE - 2 * Math.PI, circleTipA(f)];

// ===================================================================================================================
// THE LONG LINE: one material: the stick draws it, it runs on, the spark, the knee, the climb
// ===================================================================================================================
/** the flat run from D1 to the knee (units) */
export const KNEE_S = 357;
/** the hockey stick past the knee, over its horizontal run q: height h(q) = a (exp(q / lam) - 1) (a gradual bend:
 *  ~15 deg at the knee, ~45 deg at q ~100, ~70 deg at q ~190, then steep), while its heading on the floor turns from
 *  the line's direction toward straight back (turnTo deg) over turnQ, so the climb rises upright in the frame instead
 *  of leaning off to the right */
export const CURVE = { a: 24, lam: 95, qMax: 560, turnTo: 91, turnQ: 280 };
const Q_STEP = 0.5;
/** the climb's floor track: [x, z] offsets from the knee at q = i * Q_STEP */
const QXZ: V2[] = (() => {
  const out: V2[] = [[0, 0]];
  let x = 0;
  let z = 0;
  const a0 = A_LINE;
  const a1 = deg(CURVE.turnTo);
  for (let i = 1; i * Q_STEP <= CURVE.qMax + 1e-6; i++) {
    const qm = (i - 0.5) * Q_STEP;
    const an = a0 + (a1 - a0) * smooth(qm / CURVE.turnQ);
    x += Math.cos(an) * Q_STEP;
    z += Math.sin(an) * Q_STEP;
    out.push([x, z]);
  }
  return out;
})();
const qxz = (q: number): V2 => {
  const t = Math.max(0, Math.min(QXZ.length - 1, q / Q_STEP));
  const i = Math.min(QXZ.length - 2, Math.floor(t));
  const f = t - i;
  return [lerp(QXZ[i][0], QXZ[i + 1][0], f), lerp(QXZ[i][1], QXZ[i + 1][1], f)];
};
/** the 3D point (X, Y, Z) of the line at run x (from D1; past KNEE_S the climb's run q = x - KNEE_S) */
export const linePoint = (x: number): V3 => {
  if (x <= KNEE_S) return [D1[0] + x * LINE_DIR[0], 0, D1[1] + x * LINE_DIR[1]];
  const q = x - KNEE_S;
  const o = qxz(q);
  const h = CURVE.a * (Math.exp(q / CURVE.lam) - 1);
  return [D1[0] + KNEE_S * LINE_DIR[0] + o[0], -h, D1[1] + KNEE_S * LINE_DIR[1] + o[1]];
};
/** the line sampled by 3D arc length: a table of [arc length, run x] */
const ARC: [number, number][] = (() => {
  const out: [number, number][] = [[0, 0]];
  let s = 0;
  let prev = linePoint(0);
  const xMax = KNEE_S + CURVE.qMax;
  for (let x = 0.5; x <= xMax + 1e-6; x += 0.5) {
    const p = linePoint(x);
    s += len3(sub3(p, prev));
    out.push([s, x]);
    prev = p;
  }
  return out;
})();
export const ARC_TOTAL = ARC[ARC.length - 1][0];
/** the run x at 3D arc length s */
export const runAtArc = (s: number) => {
  if (s <= 0) return 0;
  if (s >= ARC_TOTAL) return ARC[ARC.length - 1][1];
  let lo = 0;
  let hi = ARC.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ARC[m][0] < s) lo = m;
    else hi = m;
  }
  const t = (s - ARC[lo][0]) / (ARC[hi][0] - ARC[lo][0]);
  return lerp(ARC[lo][1], ARC[hi][1], t);
};
/** the 3D point at arc length s */
export const lineAt = (s: number) => linePoint(runAtArc(s));
/** the arc length at the knee (the flat run is straight: arc = run) */
export const KNEE_ARC = KNEE_S;

// ---- the tip's timeline -------------------------------------------------------------------------------------------
/** the stick touches down at D1 and starts the line */
export const DRAW0 = 94;
/** the stick tip at its farthest (past his arm's reach, "better" 146) */
export const DRAW1 = 146;
export const STICK_REACH = 120;
/** the spark ignites at the tip ("sparking" 172; landed a few frames early) */
export const SPARK = 168;
/** the tip reaches the knee ("sustained" 190) */
export const KNEE_F = 188;
/** the tip leaves the top of the frame ("takeoff" 200-237) */
export const TOP_F = 229;
/** the tip's arc length along the long line at frame f: the stick's careful stroke, the line running on by itself
 *  after the stick lifts (a little faster), the spark's run to the knee (fast), the climb (fastest) */
const TIP_KEYS: [number, number][] = [
  [DRAW0, 0],
  [DRAW0 + 14, 30],
  [DRAW1, STICK_REACH],
  [SPARK, STICK_REACH + 45],
  [KNEE_F, KNEE_ARC],
  [208, KNEE_ARC + 420],
  [TOP_F, KNEE_ARC + 1250],
  [DURATION, KNEE_ARC + 2000],
];
const tipPchip = pchip(TIP_KEYS);
export const tipArc = (f: number) => (f <= DRAW0 ? 0 : Math.min(ARC_TOTAL, Math.max(0, tipPchip(f))));

// ===================================================================================================================
// THE GEOMETER'S STICK: the tip (3D), the near hand (3D) and the stick through them (a long staff held low)
// ===================================================================================================================
export const STICK_LEN = 390;
/** he lifts the tip off the closed circle, sets it on D1, draws, lets the line go, stands */
export const LIFT0 = CIRCLE_END;
export const MOVE0 = 74;
export const LETGO0 = DRAW1 + 2;
export const LETGO1 = 162;
export const STAND0 = 190;
export const STAND1 = 222;
/** the stick's tip at frame f (3D; Y up -) */
export const stickTip = (f: number): V3 => {
  const close = onCircle(A_CLOSE);
  if (f <= CIRCLE_END) {
    const p = onCircle(circleTipA(f));
    return [p[0], 0, p[1]];
  }
  if (f <= MOVE0) {
    // lifted a hand's breadth off the closing point
    const h = 16 * smooth((f - LIFT0) / 8);
    return [close[0], -h, close[1]];
  }
  if (f <= DRAW0) {
    // over the circle's far side to D1, touching down at DRAW0 (contact)
    const t = smoother((f - MOVE0) / (DRAW0 - MOVE0));
    const a = lerp(A_CLOSE, A_LINE, t);
    const r = R * (1 + 0.12 * Math.sin(Math.PI * t));
    const h = 16 * (1 - t) + 26 * Math.sin(Math.PI * t) * (1 - t * 0.4);
    return [C[0] + r * Math.cos(a), -Math.max(0, h * (1 - smooth((f - (DRAW0 - 3)) / 3))), C[1] + r * Math.sin(a)];
  }
  if (f <= LETGO0) {
    const p = lineAt(Math.min(tipArc(f), STICK_REACH));
    return [p[0], 0, p[2]];
  }
  // lets go: the tip lifts off the sand and draws back a little toward him; standing, he plants it beside him
  const reach = lineAt(STICK_REACH);
  const t = smooth((f - LETGO0) / (LETGO1 - LETGO0));
  const back = 46 * smooth((f - LETGO0) / 40);
  const lifted: V3 = [reach[0] - back * LINE_DIR[0], -34 * t, reach[2] - back * LINE_DIR[1]];
  const st = standAt(f);
  if (st <= 0) return lifted;
  const p = lerp3(lifted, REST_TIP, st);
  return [p[0], p[1] - 40 * Math.sin(Math.PI * st), p[2]];
};
/** standing, the staff is planted beside his front foot, his near hand on it at hip height */
export const REST_TIP: V3 = [GEO[0] + 112, 0, GEO[1] - 18];
export const HAND_STAND: V3 = [GEO[0] + 98, -176, GEO[1] - 16];
/** the geometer's near hand on the stick (3D): low in front of him, moving a little with the tip; standing, at his
 *  side with the staff upright */
export const HAND_CROUCH: V3 = [GEO[0] + 92, -96, GEO[1] - 8];
export const handAt = (f: number): V3 => {
  const tip = stickTip(f);
  const follow: V3 = [HAND_CROUCH[0] + 0.24 * (tip[0] - C[0]), HAND_CROUCH[1] + 0.1 * tip[1], HAND_CROUCH[2] + 0.2 * (tip[2] - C[1])];
  // the reach: he leans in as the stroke goes out
  const reach = smooth((f - DRAW0) / (DRAW1 - DRAW0)) * (1 - smooth((f - LETGO0) / 26));
  const lean: V3 = [70 * reach, 10 * reach, 34 * reach];
  return lerp3(add3(follow, lean), HAND_STAND, standAt(f));
};
/** the stick drawn from its tip through the hand to its butt (the staff is longer than the reach: the butt rises
 *  past his shoulder when he draws near himself) */
export const stickAt = (f: number) => {
  const tip = stickTip(f);
  const hand = handAt(f);
  const d = sub3(hand, tip);
  const L = len3(d);
  const butt = add3(tip, mul3(d, STICK_LEN / Math.max(1, L)));
  return { tip, hand, butt, onSand: tip[1] > -0.5 };
};
/** standing up: 0 crouched .. 1 standing (and looking up) */
export const standAt = (f: number) => smoother((f - STAND0) / (STAND1 - STAND0));
export const lookUpAt = (f: number) => smoother((f - (STAND0 + 8)) / (STAND1 + 10 - STAND0 - 8));
export { lerp3 };

// ===================================================================================================================
// THE ARMILLARY SPHERE: at rest until the companion's hand pushes its rings round; turning by "science" (80)
// ===================================================================================================================
export const PUSH0 = 68;
export const PUSH1 = 80;
/** the rings' turn (rad): still, then spun by the push (speed eases up over the push and holds) */
const TURN: number[] = (() => {
  const out: number[] = [];
  let a = 0.6;
  for (let f = 0; f <= DURATION + 2; f++) {
    out.push(a);
    a += 0.034 * smooth((f - PUSH0) / (PUSH1 - PUSH0));
  }
  return out;
})();
export const sphereTurn = (f: number) => TURN[Math.max(0, Math.min(TURN.length - 1, Math.round(f)))];
/** the rings warm from dull bronze to the glowing orange as they turn under his hand (lit by f84, "science" 80) */
export const LIT0 = PUSH0 + 2;
export const LIT1 = PUSH0 + 16;
export const sphereLit = (f: number) => smooth((f - LIT0) / (LIT1 - LIT0));

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
/** an eye: x, height h (up +), z (< 0: in front of the front plane), focal F (px), the horizon's screen row hy */
export type Eye = { x: number; h: number; z: number; F: number; hy: number };
export type EyeKey = Eye & { f: number };
/** the keys (x, z, F, hy); their `h` is not used: the eye's height is its own curve below */
export const EYE_KEYS: EyeKey[] = [
  { f: 0, x: 242, h: 0, z: -577, F: 2600, hy: -1150 },
  { f: 34, x: 196, h: 0, z: -690, F: 2450, hy: -640 },
  { f: 70, x: 164, h: 0, z: -910, F: 2200, hy: -40 },
  { f: 146, x: 166, h: 0, z: -1040, F: 2200, hy: 100 },
  { f: 172, x: 196, h: 0, z: -1140, F: 2150, hy: 175 },
  { f: 210, x: 275, h: 0, z: -1500, F: 1900, hy: 345 },
  { f: 250, x: 330, h: 0, z: -1850, F: 1800, hy: 438 },
  { f: 300, x: 335, h: 0, z: -1880, F: 1800, hy: 442 },
];
/** the eye's height: down from 3.1 m onto the drawing (the opening pull-back, f0-70), then the crane: up 1.1 m in one
 *  smooth lobe as the curve climbs ("sustained takeoff", f172-252) */
export const CRANE = { h0: 560, hMid: 480, h1: 680, f0: 172, f1: 252 };
const craneH = (f: number) => CRANE.hMid + (CRANE.h0 - CRANE.hMid) * (1 - smoother(f / 70)) + (CRANE.h1 - CRANE.hMid) * smoother((f - CRANE.f0) / (CRANE.f1 - CRANE.f0));
const EYE_PATH: Eye[] = (() => {
  const ch = (g: (k: EyeKey) => number) => pchip(EYE_KEYS.map((k) => [k.f, g(k)] as [number, number]));
  const px = ch((k) => k.x);
  const ph = craneH;
  const pz = ch((k) => k.z);
  const pF = ch((k) => Math.log(k.F));
  const py = ch((k) => k.hy);
  const target = (f: number) => [px(f), ph(f), pz(f), pF(f), py(f)];
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = s.map(() => 0);
  const out: Eye[] = [];
  for (let f = -PRE + 1; f <= DURATION + 2; f++) {
    const t = target(f + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) out.push({ x: s[0], h: s[1], z: s[2], F: Math.exp(s[3]), hy: s[4] });
  }
  return out;
})();
export const eyeAt = (f: number): Eye => {
  const i = Math.max(0, Math.min(EYE_PATH.length - 1, f));
  const i0 = Math.floor(i);
  const i1 = Math.min(EYE_PATH.length - 1, i0 + 1);
  const t = i - i0;
  const a = EYE_PATH[i0];
  const b = EYE_PATH[i1];
  return { x: lerp(a.x, b.x, t), h: lerp(a.h, b.h, t), z: lerp(a.z, b.z, t), F: Math.exp(lerp(Math.log(a.F), Math.log(b.F), t)), hy: lerp(a.hy, b.hy, t) };
};
/** the kit's 2D camera and DepthOpts that reproduce an eye exactly (dolly 1: Dc = dRef * kRef / k) */
export const camKit = (e: Eye): { cam: Cam; depth: DepthOpts } => {
  const Dc = -e.z;
  const k = e.F / Dc;
  const eyeY = -e.h;
  return { cam: { k, cx: e.x, cy: eyeY - (e.hy - 960) / k }, depth: { eyeY, dRef: Dc, kRef: k, dolly: 1 } };
};
/** screen point of a 3D point under an eye (probes and checks) */
export const screenOf = (e: Eye, X: number, Y: number, Z: number): V2 => {
  const d = Z - e.z;
  return [540 + ((X - e.x) * e.F) / d, e.hy + ((Y + e.h) * e.F) / d];
};
export const scaleAt = (e: Eye, Z: number) => e.F / (Z - e.z);
