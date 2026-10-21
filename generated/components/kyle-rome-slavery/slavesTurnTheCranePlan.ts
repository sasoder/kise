// ---------------------------------------------------------------------------
// slavesTurnTheCranePlan: the world, camera and kinematics of SlavesTurnTheCrane (kyle-rome-slavery, cut 14, the
// rebuild of MineDrainageWheels). World units = the cast's (a man ~310): U = 177 per metre. X across, Y height (the
// ground is Y = 0, up is - Y), Z depth behind the front plane (londonDepth's model).
//
// THE CRANE (Tomb of the Haterii relief; Vitruvius X.2): a tall A-frame jib (two timber legs, feet at X 0.2 m, Z -40 /
// 420, meeting at the head 11.4 m up), guyed back to the left; a sheave at its head; the hoisting rope runs from the
// rope drum on the treadwheel's axle up over the sheave and plumb down to the hook, the iron tongs and a marble column
// drum hanging over the column under construction. The treadwheel (R 2.7 m, 1.25 m wide) stands at the jib's foot, its
// axle carried by beams to the jib legs. Two slaves walk inside it; their stride turns it; the rope pays out and the
// drum is LOWERED onto the column (the walkers control the descent), settling at the stop.
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip, type Cam } from "../kits/maps/incaShared";

export const FPS = 30000 / 1001;
export const DURATION = 129;
export const U = 177;

// ---- the treadwheel ---------------------------------------------------------------------------------------------
export const XW = -2.8 * U;
export const AXLE_H = 3.05 * U;
export const YW = -AXLE_H;
export const R_OUT = 2.7 * U;
export const RT = 2.58 * U; // the treads' surface (inside)
export const ZN = 80; // near rim
export const ZF = 300; // far rim
export const RIM_T = 16; // a rim's thickness in Z
export const N_SPOKES = 4;
export const SPOKE0 = (55 * Math.PI) / 180; // a near spoke's angle at f0 (screen sense, y down): no near spoke crosses either walker's face in f0-f48 or in the settled wide
// the rope drum on the axle, behind the far rim (so it never hides the walkers), and the axle's front bearing
export const DRUM_Z0 = 336;
export const DRUM_Z1 = 384;
export const BEAR_Z0 = -14;
export const BEAR_Z1 = 18;

// ---- the walkers ------------------------------------------------------------------------------------------------
export const WALK_C = 20; // frames per cycle (two steps) at full pace
export const N_SLATS = Math.round((2 * Math.PI * RT) / 46);
export const SLAT_DA = (2 * Math.PI) / N_SLATS;
export const STRIDE = SLAT_DA * RT; // a planted foot's travel per stance = the slat spacing
/** the walkers: angle forward of the bottom (rad) where they walk, depth, variant, garb */
export const WALKERS = [
  { b0: (18 * Math.PI) / 180, z: 150, variant: 1, garb: "exomis" as const, off: 0 },
  { b0: (18 * Math.PI) / 180 - 3 * SLAT_DA, z: 238, variant: 0, garb: "tunic" as const, off: 0.5 },
];
/** the walking slows from f95 and stops at f122 (the drum's contact) */
export const EASE_A = 98;
export const STOP_F = 122;
const smooth = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return t * t * (3 - 2 * t);
};
/** the pace: a steady, careful walk in the close-up, quickening as the load comes down to the column (f45-f72),
 *  then easing to a stop as the drum meets it */
export const speedAt = (f: number) => (0.42 + 0.78 * smooth((f - 45) / 27)) * (1 - smooth((f - EASE_A) / (STOP_F - EASE_A)));
/** integral of speedAt from 0 to f (frames of full-speed walking) */
const INT: number[] = (() => {
  const out: number[] = [0];
  const N = 20;
  let acc = 0;
  for (let i = 1; i <= (DURATION + 2) * N; i++) {
    const a = (i - 1) / N;
    const b = i / N;
    acc += ((speedAt(a) + speedAt(b)) / 2) * (b - a);
    if (i % N === 0) out.push(acc);
  }
  return out;
})();
export const walked = (f: number) => {
  const i = Math.max(0, Math.min(INT.length - 2, Math.floor(f)));
  return INT[i] + (INT[i + 1] - INT[i]) * (f - i);
};
const TOTAL = walked(STOP_F);
/** the phase offset that makes the stop land with both feet down (a whole half cycle) */
export const PHASE0 = Math.ceil((TOTAL / WALK_C) * 2) / 2 - TOTAL / WALK_C;
export const phaseAt = (f: number, w: number) => PHASE0 + WALKERS[w].off + walked(f) / WALK_C;
/** the treads' travel (arc units) and the wheel's turn (rad, + = clockwise on screen) */
export const arcAt = (f: number) => (2 * STRIDE * walked(f)) / WALK_C;
export const wheelAngle = (f: number) => arcAt(f) / RT;
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
/** a foot's arc offset d (forward, up the curve) and its lift off the treads, leg 0 / 1 of walker w */
export const footAt = (f: number, w: number, leg: 0 | 1) => {
  const u = frac(phaseAt(f, w) + leg * 0.5);
  if (u < 0.5) return { d: STRIDE / 2 - 2 * STRIDE * u, lift: 0 };
  const v = (u - 0.5) / 0.5;
  return { d: -STRIDE / 2 + STRIDE * ease(v), lift: 0.11 * U * Math.sin(Math.PI * v) };
};
/** a point on the treads' surface at angle b forward of the bottom, lifted inward by `lift` */
export const treadPoint = (b: number, lift = 0): [number, number] => [XW + (RT - lift) * Math.sin(b), YW + (RT - lift) * Math.cos(b)];
/** the screen angle of the slat under a landing foot at f0, so the feet land on slats */
export const SLAT0 = (() => {
  const b = WALKERS[0].b0 + STRIDE / 2 / RT;
  const p = treadPoint(b);
  // walker 0 lands its leg 0 when its phase is whole: the treads have then moved arcAt(f) since f0
  const fLand = -((PHASE0 + WALKERS[0].off) * WALK_C); // phase 0 (extrapolated, at full speed)
  return Math.atan2(p[1] - YW, p[0] - XW) - (2 * STRIDE * fLand) / WALK_C / RT;
})();

// ---- the jib, the rope and the load -------------------------------------------------------------------------------
export const JIB_FOOT_X = 0.2 * U;
export const JIB_ZA = -40;
export const JIB_ZB = 420;
export const JIB_ZH = 190;
export const HEAD: [number, number] = [JIB_FOOT_X + 2.0 * U, -13.0 * U];
export const SHEAVE_R = 0.3 * U;
export const SHEAVE_C: [number, number] = [HEAD[0], HEAD[1] + 0.2 * U];
/** the column under construction: plumb under the sheave's right side */
export const COL_X = SHEAVE_C[0] + SHEAVE_R;
export const COL_Z = JIB_ZH;
export const COL_R = 0.6 * U;
export const STYLO_H = 0.6 * U; // the stylobate (three steps)
export const COL_TOP = -8.8 * U; // the column's top (Y)
export const LOAD_H = 1.1 * U;
export const LOAD_R = 0.59 * U;
/** the drum's descent: the rope paid out = the wheel's turn x the rope drum's radius; it lands at the stop */
export const DROP = 0.62 * U;
export const DRUM_R = DROP / wheelAngle(STOP_F) / 1; // the rope drum's radius (units)
export const loadBottom = (f: number) => COL_TOP - DROP + Math.min(DROP, wheelAngle(Math.min(f, STOP_F)) * DRUM_R);

// ---- the scaffold worker --------------------------------------------------------------------------
export const PLATFORM_Y = COL_TOP + 0.12 * U; // the plank's top, a little below the column's top
export const WORKER_X = COL_X + 1.15 * U;
export const WORKER_Z = COL_Z + 40;

// ---- the camera: hold on the walkers, then one crane-up with a pull-back to the whole crane --------------------------
export type CamKey = { f: number; cx: number; cy: number; k: number };
export const CAM_KEYS: CamKey[] = [
  { f: 0, cx: -395, cy: -246, k: 1.8 },
  { f: 30, cx: -390, cy: -254, k: 1.65 },
  { f: 48, cx: -378, cy: -282, k: 1.5 },
  { f: 72, cx: -220, cy: -700, k: 0.93 },
  { f: 92, cx: -100, cy: -915, k: 0.6 },
  { f: 128, cx: -97, cy: -938, k: 0.575 },
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
export const DEPTH = { dRef: 2800, kRef: 0.575, dolly: 0.4 };
/** the eye rises with the camera, but slower (a crane-up with some lens shift, as London V5's tilt): 1.6 m at f0 to
 *  3.6 m in the wide, so the walkers are seen near eye level inside the wheel and never under its hub */
export const EYE = { y0: -1.6 * U, y1: -3.6 * U };
export const eyeAt = (cy: number) => {
  const c0 = CAM_KEYS[0].cy;
  const c1 = CAM_KEYS[CAM_KEYS.length - 1].cy;
  const t = Math.max(0, Math.min(1.05, (cy - c0) / (c1 - c0)));
  return EYE.y0 + (EYE.y1 - EYE.y0) * t;
};
/** the people are drawn a touch large (x1.08) so the walkers hold ~170 px in the wide */
export const FIG = 1.08;
