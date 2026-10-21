// ---------------------------------------------------------------------------
// muscleOrMachinePlan: the world layout, the timeline and the camera of kyle-rome-slavery cut 5 (MuscleOrMachine),
// kept free of React so a script can plot and check them.
//
// 3D WORLD UNITS (the London depth kit's): X across, Y height (the floor is Y = 0, up is - Y), Z depth behind the
// front plane (+ = farther). A man (soles -> skull) is MAN units. The 2D camera (cx, cy, k) shows the front plane;
// the eye stands on the centre line at EYE_Y, CAM_D in front of the front plane (dolly 0, as cut 10): a point at
// depth Z draws at r = CAM_D / (CAM_D + Z) about the VP (cam.cx, EYE_Y). Trucking the camera gives the parallax.
//
// LEFT (X ~ 0): the Roman bakery-mill, two hourglass lava mills turned by slaves at their push-bars.
// MIDDLE (X ~ 520): a Roman brick pier in the middle ground (the change of world).
// RIGHT (X ~ 1050): the steam flour mill: a Boulton & Watt flywheel (cut 10's sun-and-planet engine, settled) with a
// geared rim driving a pinion on a square line shaft that runs back over a row of four millstone pairs.
// ---------------------------------------------------------------------------
import { machinePhaseAt } from "../kyle-london/orbitWorld";
import { swayCam, type Cam, type P2 } from "../kits/maps/incaShared";
import type { DepthOpts } from "../kyle-london/londonDepth";

export const FPS = 30000 / 1001;
export const DURATION = 147;

export const MAN = 330;
/** world px per cast unit (a cast man is 310 units) */
export const SCALE = MAN / 310;
export const EYE_Y = -1.5 * MAN;
export const CAM_D = 720;
export const DEPTH: DepthOpts = { eyeY: EYE_Y, dRef: CAM_D, kRef: 1, dolly: 0 };
export const rOf = (Z: number) => CAM_D / (CAM_D + Z);

// ---- THE ROMAN MILLS ----------------------------------------------------------------------------
/** the mill (Pompeii's hourglass lava mill): base platform, the meta under the hourglass catillus; profile radii /
 *  heights in world units (the catillus about 0.95 m tall, the whole mill ~1.6 m) */
export const MILL = {
  baseR: 150,
  baseH: 52,
  lipH: 64,
  metaR: 82,
  catBotY: -78,
  catBotR: 92,
  waistY: -224,
  waistR: 44,
  catTopY: -346,
  catTopR: 90,
};
/** the push-bar: through the catillus' waist lugs, its tips at BAR_R from the axis, just past each pusher's outer fist
 *  (REVISION 1b: the bar ends in his hands, it never runs on across his chest) */
export const BAR_R = 270;
/** the bar at a pusher's chest height (the push pose's grip, 214 units) */
export const BAR_Y = -228;
export type Mill = { X: number; Z: number; th0: number; tone: number };
/** th = the bar's angle about the axis: tip at (X + R sin th, Z - R cos th); 0 = the tip toward the camera.
 *  th grows: the near tip moves screen right (the slaves walk round counter-clockwise seen from above) */
export const MILLS: Mill[] = [
  { X: 0, Z: 200, th0: (-50 * Math.PI) / 180, tone: 1 },
  // REVISION 1: phased so neither of its pushers' bar tangents crosses the line of sight in the cut (no turn-round)
  { X: 100, Z: 1320, th0: (-40 * Math.PI) / 180, tone: 0.6 },
];
/** the mills turn slowly (a slave's push walk: ~2.8 world units a frame at his place, ~0.4 m/s) */
export const MILL_OMEGA = (0.6 * Math.PI) / 180;
export const millAngle = (m: Mill, f: number) => m.th0 + MILL_OMEGA * f;

// ---- THE PIER AND ITS WALL --------------------------------------------------------------------
/** a brick wall running back along Z, its front end the pier: it hides one room from the other until the camera
 *  trucks past its end (the lit left face from the Roman side, the dark right face from the steam side) */
export const PIER = { X0: 400, X1: 514, Z0: 120, Z1: 1000, Ytop: -1100 };

// ---- THE STEAM MILL -----------------------------------------------------------------------------
// Pass 2 (director's review): the row of stones is the payoff. The line shaft runs along Z right of the centre line
// over four stone pairs from the front (stone 1, large, its drive in plain view) back toward the VP; the engine heads
// the row (Z_WHEEL), its geared flywheel meshing the pinion at the shaft's far end, so the flywheel and pinion overlap
// only the far end of the row. Two workers: one at stone 1's meal spout, one further back stacking.
/** the landed camera's centre line */
export const C1 = 900;
/** the engine: orbitWorld's settled sun-and-planet machine scaled by ENG_S about its foot */
export const ENG_S = 1.15;
export const Z_WHEEL = 1400;
/** the flywheel's geared rim (machine units round SUN) and the pinion it drives (3 : 1) */
export const N_FLY = 36;
export const N_PIN = 12;
export const FLY_PITCH = 448;
export const PIN_PITCH = (FLY_PITCH * N_PIN) / N_FLY;
/** the line shaft (the pinion's axle, square cast iron) at X = SHAFT_X, height SHAFT_Y, running along Z */
export const SHAFT_X = C1 + 190;
export const SHAFT_Y = -560;
/** the engine heads the row: its flywheel's axle on a tall iron A-frame (at landing at screen y ~450), the pinion
 *  meshing its geared rim a little below the axle's level, on the line shaft */
export const AXLE_Y = -940;
export const PIN_DIST = (FLY_PITCH + PIN_PITCH) * ENG_S;
export const PIN_ANGLE = Math.asin((SHAFT_Y - AXLE_Y) / PIN_DIST);
export const EX = SHAFT_X + PIN_DIST * Math.cos(PIN_ANGLE);
/** the engine drawing's foot (orbitWorld machine y 1910) sits this high in the world */
export const ENG_FOOT_Y = AXLE_Y + (1910 - 960) * ENG_S;
export const SHAFT_HW = 14;
export const SHAFT_Z0 = -70;
export const SHAFT_Z1 = 1500;
/** the stone pairs under the line shaft: hurst frame, bed stone, runner (orange iron hoop), hopper, meal spout */
export const STONES_Z = [0, 400, 800, 1200];
export const HURST = { hw: 150, h: 200 };
export const STONE_R = 128;
export const BED_H = 26;
export const RUNNER_H = 34;
export const RUNNER_TOP = -(HURST.h + BED_H + RUNNER_H);
/** the crown wheel on the line shaft (vertical, face-on) and the stone nut under it on the spindle */
export const CROWN_R = 62;
export const CROWN_DZ = -34;
export const NUT_R = 34;
/** the A-frame standard behind the flywheel */
export const STAND = { footHW: 290, topHW: 96, z0: 1450, z1: 1600 };
/** the engine's clock: the settled machine (orbitWorld frames >= 200) */
export const ENGINE_SPEED = 0.8;
export const engineFrameAt = (f: number) => 200 + ENGINE_SPEED * f;
export const flyAngle = (f: number) => machinePhaseAt(engineFrameAt(f)).phiS;
/** the pinion turns 3x, the other way; its gap faces the flywheel's tooth at the mesh point (PIN_ANGLE below the
 *  axle's level; the flywheel's teeth at multiples of 10 deg) */
export const pinAngle = (f: number) => Math.PI / N_PIN - 4 * PIN_ANGLE - (N_FLY / N_PIN) * flyAngle(f);
/** the stones: geared down from the line shaft (crown 2 : 3 nut), each a little out of step */
export const stoneAngle = (f: number, i: number) => (2 / 3) * pinAngle(f) + i * 0.9;

/** worker 1 (londonCastV2 Worker, cream) at stone 1: near hand on the meal spout, far hand on the sack's neck */
export const WORKER = { X: C1 - 82, Z: -63 };
/** the sack hangs by its gathered neck on the spout's hook (its foot on the floor), filling */
export const SACK = { X: SHAFT_X - 225, Z: -40, h: 196 };
/** the sack fills over the cut (0.4 -> 0.9 full) */
export const sackFill = (f: number) => 0.4 + 0.5 * (f / (DURATION - 1));
/** worker 2 further down the row (smaller in depth): heaves a filled sack onto a stack of sacks */
export const WORKER2 = { X: C1 - 95, Z: 960 };
export const STACK = { X: C1 + 20, Z: 995, sl: 52, sh: 32 };
/** worker 2's sack: held at his waist, heaved up (f100-114), set on the stack's top (f114-128, released at f128) */
export const LIFT = { up0: 100, up1: 114, set1: 128 };

// ---- THE CAMERA ---------------------------------------------------------------------------------
// One move, cut 10's: a slow drift from f0 and ONE raised-cosine velocity lobe for the truck (PAN_X), the zoom's
// lobe a few frames ahead of it (PAN_K, log space) driving the horizon's screen y too. The drift is the end creep.
export const CX0 = 10;
export const CX1 = C1;
export const K0 = 1.75;
export const K1 = 1.3;
/** the horizon's screen y */
export const H0 = 453;
export const H1 = 620;
export const PAN_K: readonly [number, number] = [16, 86];
export const PAN_X: readonly [number, number] = [20, 94];
const progress = (drift: number, [a, b]: readonly [number, number]) => {
  const L = b - a;
  const lobe = (f: number) => {
    const x = Math.max(0, Math.min(L, f - a));
    return (x - (L / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L)) / L;
  };
  return (f: number) => drift * (f / (DURATION - 1)) + (1 - drift) * lobe(f);
};
const uK = progress(0.08, PAN_K);
const uX = progress(0.11, PAN_X);
export const camBaseAt = (f: number): Cam => {
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * uK(f));
  const H = H0 + (H1 - H0) * uK(f);
  const cx = CX0 + (CX1 - CX0) * uX(f);
  return { k, cx, cy: EYE_Y - (H - 960) / k };
};
export const camAt = (f: number): Cam => swayCam(camBaseAt(f), f);
/** the horizon's screen y for a camera */
export const horizonY = (cam: Cam) => 960 + cam.k * (EYE_Y - cam.cy);
/** the 2D camera that draws a planar layer at depth Z (world px at that depth, the same VP / horizon) */
export const camAtDepth = (cam: Cam, Z: number): Cam => {
  const s = cam.k * rOf(Z);
  return { k: s, cx: cam.cx, cy: EYE_Y - (horizonY(cam) - 960) / s };
};
/** a 3D point -> screen */
export const toScreen = (cam: Cam, X: number, Y: number, Z: number): P2 => {
  const s = cam.k * rOf(Z);
  return [540 + s * (X - cam.cx), horizonY(cam) + s * (Y - EYE_Y)];
};
/** the camera that draws a machine-unit drawing (scale s, machine point m0 at world w0) under a world camera */
export const subCam = (cam: Cam, s: number, w0: P2, m0: P2): Cam => ({ k: cam.k * s, cx: m0[0] + (cam.cx - w0[0]) / s, cy: m0[1] + (cam.cy - w0[1]) / s });
/** the engine drawing (orbitWorld machine units, foot at (540, 1910)) at depth Z */
export const engineCamAt = (cam: Cam, Z: number) => subCam(camAtDepth(cam, Z), ENG_S, [EX, ENG_FOOT_Y], [540, 1910]);
