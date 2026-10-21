// ---------------------------------------------------------------------------
// mineDrainagePlan: the world, the camera and the kinematics of MineDrainageWheels (kyle-rome-slavery, cut 14).
// World units = the cast's units (a man ~310 tall): U = 177 units per metre. X across (0 = the central rock rib),
// Y down (stage 0's axle at Y = 0), Z depth behind the section plane (the cut rock face, Z = 0).
//
// THE STAIR: 6 reverse-overshot wheels (R 2.3 m) zig-zag up a central rib, one per chamber, stage n's axle at
// Y = -n * 3.5 m, alternately left (even n) and right (odd n) of the rib. Each wheel's treader stands on the rim's
// INNER side (toward the rib) at ALPHA from the top, facing up the rim toward its top, pushing that side down:
// the even (left) wheels turn clockwise, the odd (right) ones anticlockwise. The rim compartments fill in the tank
// (or the sump, stage 0), rise on the outer side, empty just past the top into a launder behind the wheel that runs
// inward through a cut in the rib and spills into the next stage's tank; the top wheel's launder runs out along the
// drain adit. Every chamber is a cut in the rock with a back wall at Z = ZB.
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip, type Cam } from "../kits/maps/incaShared";

export const FPS = 30000 / 1001;
export const DURATION = 129;

/** units per metre (a man ~1.75 m = 310 units) */
export const U = 177;
export const N_STAGES = 6;
/** wheel: outer radius, inner (the compartments' depth 0.34 m), the cleats' tops; front / back faces in Z */
export const R = 2.3 * U;
export const RIN = R - 0.34 * U;
export const RC = R + 0.05 * U;
export const WZ0 = 150;
export const WZ1 = 214;
export const STEP = 3.5 * U;
export const XOFF = 2.8 * U;
export const RIB = 0.35 * U;
export const ZB = 440;
/** the figures are drawn a little heroic (x1.15: a man ~2 m against the 4.6 m wheel) to hold the phone floor */
export const FIG = 1.2;
/** the treader's place on the rim: ALPHA from the top toward the rib */
export const ALPHA = (32 * Math.PI) / 180;
export const TREAD_Z = (WZ0 + WZ1) / 2;

export const side = (n: number): 1 | -1 => (n % 2 === 0 ? -1 : 1);
/** inward (toward the rib) for stage n */
export const inward = (n: number): 1 | -1 => (side(n) === -1 ? 1 : -1);
export const wheelC = (n: number): [number, number] => [side(n) * XOFF, -n * STEP];

/** the chamber: x0..x1, y0 (ceiling)..y1 (floor) */
export type Rect = { x0: number; x1: number; y0: number; y1: number };
export const OUTER_WALL = XOFF + R + 0.35 * U;
export const chamberOf = (n: number): Rect => {
  const [, yc] = wheelC(n);
  const s = side(n);
  const xa = s * (RIB);
  const xb = s * OUTER_WALL;
  return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: yc - 4.15 * U, y1: yc + (n === 0 ? 2.9 : 2.45) * U };
};
/** the cut in the rib that the launder of stage n passes through (to stage n + 1, or the adit at the top) */
export const passageOf = (n: number): Rect => {
  const [, yc] = wheelC(n);
  return { x0: -RIB - 24, x1: RIB + 24, y0: yc - 2.66 * U, y1: yc - 1.52 * U };
};
/** the drain adit at the top: from the rib out to the left, past the frame */
export const ADIT: Rect = (() => {
  const p = passageOf(N_STAGES - 1);
  return { x0: -4200, x1: 0, y0: p.y0, y1: p.y1 };
})();
/** the flooded drift at the bottom, left of stage 0's chamber (the workings being drained) */
export const DRIFT: Rect = { x0: -4200, x1: -OUTER_WALL + 30, y0: 1.05 * U, y1: 2.9 * U };
export const SUMP_Y = 2.0 * U;
export const CAVITIES: Rect[] = [
  ...Array.from({ length: N_STAGES }, (_, n) => chamberOf(n)),
  ...Array.from({ length: N_STAGES }, (_, n) => passageOf(n)),
  ADIT,
  DRIFT,
];

/** the tank under stage n >= 1 (timber), its rim and water */
export const tankOf = (n: number) => {
  const [xc, yc] = wheelC(n);
  return { x0: xc - 1.5 * U, x1: xc + 1.5 * U, y0: yc + 1.95 * U, y1: yc + 2.45 * U, z0: 96, z1: 246, water: yc + 2.02 * U };
};
/** the launder of stage n: from just outside its wheel's top, inward, to over the next tank (or along the adit) */
export const launderOf = (n: number) => {
  const [xc, yc] = wheelC(n);
  const i = inward(n);
  const xa = xc - i * 0.5 * U;
  const top = n === N_STAGES - 1;
  const xb = top ? -4200 : wheelC(n + 1)[0] - i * 0.75 * U;
  const ya = yc - 1.78 * U;
  const yb = top ? ya + 0.3 * U : yc - 1.66 * U;
  return { xa, xb, ya, yb, z0: 252, z1: 318, depth: 0.3 * U };
};
/** the handrail beam across stage n's chamber (hands height) */
export const beamOf = (n: number) => {
  const c = chamberOf(n);
  return { x0: c.x0 - 10, x1: c.x1 + 10, y: treaderAt(n)[1] + TREAD_RAIL[1] * FIG, h: 0.2 * U, z0: 150, z1: 214 };
};
/** the handrail grips (units from his feet, facing right): romeCast's tread rail [86, -266] lowered to shoulder
 *  height so his face stays clear of his fists (the cast's grip solver lands the fists exactly); the planted foot's
 *  slide matches the cast's tread ([24, -26] -> [-24, 0]) */
export const TREAD_RAIL: [number, number] = [92, -240];
export const TREAD_RAIL_FAR: [number, number] = [98, -244];
/** his feet's place (the cast's origin): 24 units behind the lowest planted foot, which is at -STRIDE / 2 */
export const treaderAt = (n: number): [number, number] => {
  const b = rimPoint(n, -STRIDE / 2, 0);
  return [b[0] + side(n) * 24 * FIG, b[1]];
};

// ---------------------------------------------------------------------------
// THE TREAD (cause) AND THE WHEEL (effect). Each foot lands on a cleat at +STRIDE/2 up the rim, is carried down
// with the rim to -STRIDE/2, lifts and swings back up. The rim's surface speed surges a little after each
// footfall (the push); the wheel's angle is the integral of that speed, so the planted foot never slides.
// ---------------------------------------------------------------------------
export const TREAD_CYCLE = 32; // frames per two steps
/** the cleats round the rim (~0.32 m apart); the stride (arc per stance) is their spacing */
export const N_CLEATS = Math.round((2 * Math.PI * RC) / (0.32 * U));
export const CLEAT_DA = (2 * Math.PI) / N_CLEATS;
export const STRIDE = CLEAT_DA * RC;
export const V0 = (2 * STRIDE) / TREAD_CYCLE; // rim units per frame
export const SURGE = 0.24;
/** each treader's phase offset (0..1) and build: they are not clones */
export const TREADERS = [
  { off: 0.0, lean: 14, crouch: 16, yaw: 0.78, cap: false, variant: 0 },
  { off: 0.41, lean: 17, crouch: 20, yaw: 0.72, cap: true, variant: 1 },
  { off: 0.73, lean: 12, crouch: 14, yaw: 0.82, cap: false, variant: 2 },
  { off: 0.19, lean: 18, crouch: 18, yaw: 0.75, cap: false, variant: 3 },
  { off: 0.58, lean: 15, crouch: 15, yaw: 0.8, cap: true, variant: 4 },
  { off: 0.88, lean: 13, crouch: 19, yaw: 0.74, cap: false, variant: 0 },
];
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
/** the rim's travel (arc units) under stage n's treader by frame f */
export const rimArc = (n: number, f: number) => {
  const off = TREADERS[n].off;
  return V0 * (f - (SURGE * TREAD_CYCLE * Math.sin((4 * Math.PI * (f + off * TREAD_CYCLE)) / TREAD_CYCLE)) / (4 * Math.PI));
};
/** the wheel's turn (rad, screen sense: + = clockwise) */
export const wheelAngle = (n: number, f: number) => (inward(n) * rimArc(n, f)) / RC;
/** a rim point's screen angle (y down) for an arc offset d up the rim from the treader's place */
export const rimAngleAt = (n: number, d: number) => {
  const b = ALPHA - d / RC;
  return Math.atan2(-Math.cos(b), inward(n) * Math.sin(b));
};
/** the cleats' phase: a cleat sits under the landing foot at every footfall */
export const cleatPhase = (n: number) => {
  const fLand = -TREADERS[n].off * TREAD_CYCLE;
  return rimAngleAt(n, STRIDE / 2) - wheelAngle(n, fLand);
};

/** a foot's arc offset (d, up the rim) and its lift off the rim (units) for leg 0 / 1 of stage n at frame f */
export const footAt = (n: number, f: number, leg: 0 | 1) => {
  const off = TREADERS[n].off + leg * 0.5;
  const ph = (f + off * TREAD_CYCLE) / TREAD_CYCLE;
  const u = frac(ph);
  if (u < 0.5) {
    // planted on its cleat: carried down with the rim
    const fl = f - u * TREAD_CYCLE;
    return { d: STRIDE / 2 - (rimArc(n, f) - rimArc(n, fl)), lift: 0, heel: Math.max(0, (u - 0.36) / 0.14) };
  }
  // swinging up to the next cleat but one
  const v = (u - 0.5) / 0.5;
  return { d: -STRIDE / 2 + STRIDE * ease(v), lift: 0.2 * U * Math.sin(Math.PI * Math.min(1, v * 1.1)), heel: 1 - ease(Math.min(1, v * 1.5)) };
};
/** a rim point (outer surface incl. cleats) for an arc offset d and a lift off it */
export const rimPoint = (n: number, d: number, lift = 0): [number, number] => {
  const [xc, yc] = wheelC(n);
  const b = ALPHA - d / RC;
  const rr = RC + lift;
  return [xc + inward(n) * rr * Math.sin(b), yc - rr * Math.cos(b)];
};

// ---------------------------------------------------------------------------
// THE CAMERA: one continuous rise with a pull-back. Keys -> pchip (k in log space) -> the house damped follow
// (CAM_STIFF / CAM_DAMP), pre-rolled so f0 is already moving. The eye rides with the camera (a crane: the VP stays
// at the frame centre, the horizon is the frame's middle line).
// ---------------------------------------------------------------------------
export type CamKey = { f: number; cx: number; cy: number; k: number };
export const CAM_KEYS: CamKey[] = [
  { f: 0, cx: -290, cy: -562, k: 1.85 },
  { f: 26, cx: -80, cy: -820, k: 1.25 },
  { f: 46, cx: -24, cy: -1040, k: 0.9 },
  { f: 64, cx: -6, cy: -1175, k: 0.71 },
  { f: 91, cx: 0, cy: -1245, k: 0.6 },
  { f: 128, cx: 0, cy: -1268, k: 0.585 },
];
const CAM_PATH: Cam[] = (() => {
  const pk = pchip(CAM_KEYS.map((q) => [q.f, Math.log(q.k)]));
  const px = pchip(CAM_KEYS.map((q) => [q.f, q.cx]));
  const py = pchip(CAM_KEYS.map((q) => [q.f, q.cy]));
  const target = (f: number) => [px(f), py(f), pk(f)];
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = [0, 0, 0];
  const out: Cam[] = [];
  for (let f = -PRE + 1; f <= DURATION + 2; f++) {
    const t = target(f + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) out.push({ cx: s[0], cy: s[1], k: Math.exp(s[2]) });
  }
  return out;
})();
export const camAt = (frame: number): Cam => CAM_PATH[Math.max(0, Math.min(CAM_PATH.length - 1, Math.round(frame)))];
/** the depth camera on top of the 2D one (londonDepth's model; eyeY = the camera's own centre line) */
export const DEPTH = { dRef: 2550, kRef: 0.39, dolly: 0.4 };
