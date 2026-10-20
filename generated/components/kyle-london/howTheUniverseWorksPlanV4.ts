// ---------------------------------------------------------------------------
// howTheUniverseWorksPlanV4: the world layout, the timeline and the camera of kyle-london cut 10 V4
// (HowTheUniverseWorksV4), kept free of React so a script can plot and check them.
//
// WORLD PX. One floor line at y = FLOOR. A man (soles -> skull) is CREW_PX tall, as in cut 42.
// The orrery is drawn in orbitWorld's machine units (SUN = (540, 960), orbit radius EARTH_R0, plane squash
// ORRERY_TILT0) in ./howTheUniverseWorksOrreryV4.tsx, on a shorter pillar and stand than orbitWorld's so its orbit
// plane sits below the scientist's waist; it is scaled by ORR_S about its foot;
// the engine is orbitWorld's sun-and-planet machine scaled by ENG_S (cut 42's ENGINE_S) about its foot,
// so the flywheel and the crew keep cut 42's proportions.
// ---------------------------------------------------------------------------
import { machinePhaseAt, ORBIT_W, ORRERY_OMEGA, type Cam, type P2 } from "./orbitWorld";
import { swayCam } from "../kits/maps/incaShared";

export const FPS = 30000 / 1001;
export const DURATION = 204;

export const FLOOR = 1500;
export const CREW_PX = 330;

// ---- THE ORRERY (left) --------------------------------------------------------------------------
export const ORR_S = 0.33;
export const OX = 0;
/** the orrery (machine units): the Sun at SUN, a short pillar down to the drum, the drum, a turned stand to the foot */
export const DRUM_TOP_Y = 1060;
export const DRUM_BOT_Y = 1140;
export const DRUM_RX = 200;
export const ARM_DROP = 55; // the Earth's arm leaves a collar this far below the orbit plane
/** the orrery's foot (machine y) on the floor: the Sun 130 world px up (0.39 of a man), the whole orbit plane below his waist */
export const ORR_FOOT = 960 + 130 / 0.33;
export const orrToWorld = (m: P2): P2 => [OX + ORR_S * (m[0] - 540), FLOOR + ORR_S * (m[1] - ORR_FOOT)];
/** the scientist (a Fellow, orange coat) stands behind the orrery, facing left into it */
export const SCI_X = OX + 45;

// The crank: on the drum's TOP face, front-right (azimuth CRANK_AZ from the front, radius CRANK_AT from the
// pillar), a crank arm turning in the horizontal plane (squashed 0.3, as the orbit) with a tall upright handle
// whose grip comes up to the scientist's hanging hand. Machine units, the orrery's view.
const CRANK_AZ = (55 * Math.PI) / 180;
const CRANK_AT = 150;
export const CRANK_C: P2 = [540 + CRANK_AT * Math.sin(CRANK_AZ), DRUM_TOP_Y + 0.3 * CRANK_AT * Math.cos(CRANK_AZ)];
export const CRANK_R = 46;
export const KNOB_L = 84;
/** the crank's handle root at crank angle phi (0 = towards the viewer) */
export const crankPin = (phi: number): P2 => [CRANK_C[0] + CRANK_R * Math.sin(phi), CRANK_C[1] + 0.3 * CRANK_R * Math.cos(phi)];

/** the orrery's own clock: an orbitWorld frame always < 0 (the turning orrery, before any trace or morph),
 *  offset so that on "universe" (f134) the Earth swings across the front of the orbit (screen angle pi/2) */
const T_REF = -400;
const A_REF = machinePhaseAt(T_REF).theta + ORBIT_W;
export const UNIVERSE_F = 134;
export const ORR_OFF = (() => {
  const want = Math.PI / 2 + 0.6; // front-left of the Sun, swinging left
  let t = T_REF + (want - A_REF) / ORRERY_OMEGA; // the orrery time with the Earth at pi/2
  while (t > -80) t -= 102;
  while (t < -180) t += 102;
  return t - UNIVERSE_F;
})();
export const orreryT = (f: number) => f + ORR_OFF;
export const earthAngle = (f: number) => machinePhaseAt(orreryT(f)).theta + ORBIT_W;
/** the crank turns twice per year of the orrery (it drives the train) */
export const crankPhi = (f: number) => 2 * earthAngle(f) + 0.4;

// ---- THE ENGINE (right) -------------------------------------------------------------------------
export const ENG_S = 0.6;
export const EX = 760; // the flywheel shaft, world x
export const engToWorld = (m: P2): P2 => [EX + ENG_S * (m[0] - 540), FLOOR + ENG_S * (m[1] - 1910)];
/** the camera that draws a machine-unit drawing (scale s, machine point m0 at world w0) under the world camera */
export const subCam = (cam: Cam, s: number, w0: P2, m0: P2): Cam => ({ k: cam.k * s, cx: m0[0] + (cam.cx - w0[0]) / s, cy: m0[1] + (cam.cy - w0[1]) / s });
export const engineCamOf = (cam: Cam) => subCam(cam, ENG_S, [EX, FLOOR], [540, 1910]);
export const orreryCamOf = (cam: Cam) => subCam(cam, ORR_S, [OX, FLOOR], [540, ORR_FOOT]);
/** the orbitWorld frame the engine shows (settled machine, running a little faster than cut 10 V1) */
export const ENGINE_SPEED = 1.25;
export const engineFrameAt = (f: number) => 200 + ENGINE_SPEED * f;

/** the boiler (behind the flywheel's lower left), its fire door, the coal heap, the crew */
export const BOILER = (() => {
  const x1 = EX - 130;
  const x0 = x1 - 265;
  return { x0, x1, setTop: FLOOR - 240, drumTop: FLOOR - 420, door: { x0: x0 + 27, x1: x0 + 119, y0: FLOOR - 150, y1: FLOOR - 66 } };
})();
export const STOKER_X = BOILER.door.x0 - 112;
/** the coal heap at the boiler's foot, under the blade's scoop (the blade dips in ~160 world px ahead of his feet) */
export const COAL_HEAP = { cx: STOKER_X + 166, hw: 64, h: 44 };
export const ENGINEER_X = EX + 150;
/** the engine group's world extent (the stoker's back -> the engineer's front; the flywheel may crop at the right) */
export const GROUP_X0 = STOKER_X - 62;
export const GROUP_X1 = EX + 218;

/** the shovel: one cycle per SHOVEL_PERIOD frames, the coal leaves the blade at SHOVEL_THROW */
export const SHOVEL_PERIOD = 40;
export const SHOVEL_PHASE0 = 0.05;
export const SHOVEL_THROW = 0.55;
export const shovelPhase = (f: number) => (((f / SHOVEL_PERIOD + SHOVEL_PHASE0) % 1) + 1) % 1;

// ---- THE CAMERA ---------------------------------------------------------------------------------
// One move: a slow drift from f0 and ONE velocity lobe (a raised cosine, PAN_F0 -> PAN_F1) for the pan, the
// same progress driving the zoom (log space), the scientist's screen x and the floor's screen y, so velocity
// is continuous and has one lobe. The drift carries on as the end creep.
export const K0 = 3.18; // the scientist ~1050 px tall
export const K1 = 1.38; // the men ~455 px tall, the engine group filling the frame
export const SCI_SX0 = 590; // the scientist's screen x at f0
export const END_CX = (GROUP_X0 + GROUP_X1) / 2;
export const SCI_SX1 = 540 + (SCI_X - END_CX) * K1;
export const FLOOR_SY0 = 1255;
export const FLOOR_SY1 = 1200;
/** the zoom's lobe, and the sideways lobe a few frames behind it (the pull-back opens the view to the right while
 *  the scientist still holds the left of the frame; he leaves it just before "machines") */
export const PAN_K: readonly [number, number] = [119, 183];
export const PAN_X: readonly [number, number] = [128, 191];
/** progress 0..1: a drift share `drift` spread evenly over the cut + one raised-cosine velocity lobe */
const progress = (drift: number, [a, b]: readonly [number, number]) => {
  const L = b - a;
  const lobe = (f: number) => {
    const x = Math.max(0, Math.min(L, f - a));
    return (x - (L / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L)) / L; // integral of (1 - cos) / 2, normalised
  };
  return (f: number) => drift * (f / (DURATION - 1)) + (1 - drift) * lobe(f);
};
const uK = progress(0.07, PAN_K);
const uX = progress(0.08, PAN_X);
export const camBaseAt = (f: number): Cam => {
  const k = Math.exp(Math.log(K0) + (Math.log(K1) - Math.log(K0)) * uK(f));
  const sx = SCI_SX0 + (SCI_SX1 - SCI_SX0) * uX(f);
  const fy = FLOOR_SY0 + (FLOOR_SY1 - FLOOR_SY0) * uK(f);
  return { k, cx: SCI_X - (sx - 540) / k, cy: FLOOR - (fy - 960) / k };
};
export const camAt = (f: number): Cam => swayCam(camBaseAt(f), f);
