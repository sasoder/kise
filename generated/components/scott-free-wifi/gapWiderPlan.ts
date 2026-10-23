// ---------------------------------------------------------------------------
// gapWiderPlan — the flight plan of cut 4 GapWiderEveryDay (scott-free-wifi): the four jets' paths through still air,
// United's climb, the satellite that carries United's link, and the camera (a damped airTrack of framing offsets
// riding on the group's constant cruise). Pure geometry: no React, so a probe script can print screen positions.
// World units: aircraftShared's (metres; X right, Y up, Z away from the camera; heading -90 = nose LEFT).
// ---------------------------------------------------------------------------
import { airCamAt, airProject, airTrack, type AirCam, type Airline, type JetType, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { CRUISE, JET_SPEED, SAT } from "./wifiSky";

const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));

/** the group's heading: nose left, turned 42 deg toward the camera, so the trails recede to the right into depth and
 *  drop toward the low horizon (the wedge fans back to the right edge) while the jets still read mostly side-on */
export const GAPWIDER_HEADING = -132;
const H = GAPWIDER_HEADING * D2R;
/** the direction of flight (world, unit, level) */
export const GAPWIDER_DIR: [number, number] = [Math.sin(H), Math.cos(H)];

/** the formation at f0: one level row, close together, United second in it. `off` = [dX, dZ] m from United (world);
 *  the pack sits a little farther from the camera than United (an echelon going away), and each pack jet's cruise
 *  altitude is set so that at f0 its fuselage lines up on screen with United's: one level row, no gap before "gap".
 *  (The camera rides below the formation and the jets fly toward it at an angle, so every contrail recedes toward
 *  the horizon and drops below the jets behind it: no trail crosses a jet.) */
export type GapWiderJet = { key: string; type: JetType; airline: Airline; off: [number, number] };
export const GAPWIDER_JETS: GapWiderJet[] = [
  { key: "united", type: "B787_9", airline: "united", off: [0, 0] },
  { key: "american", type: "B777", airline: "american", off: [-56, 130] },
  { key: "delta", type: "A330", airline: "delta", off: [48, 100] },
  { key: "lufthansa", type: "B747", airline: "lufthansa", off: [106, 190] },
];
/** United's place at f0 (world [X, Z]) */
export const GAPWIDER_ORIGIN: [number, number] = [0, 200];
/** a jet's place at f0 (world [X, Z]) */
export const gapWiderAt0 = (j: GapWiderJet): [number, number] => [GAPWIDER_ORIGIN[0] + j.off[0], GAPWIDER_ORIGIN[1] + j.off[1]];

/** United's climb: its pitch eases up once (f7 -> f22) and holds; it then climbs at a constant rate */
export const GAPWIDER_CLIMB = { f0: 7, f1: 22, gamma: 6.2, pitch0: 1.5 } as const;
const RATE = JET_SPEED * Math.tan(GAPWIDER_CLIMB.gamma * D2R);
/** United's climb angle fraction 0..1 (smoothstep over the pitch-up) */
const climbS = (f: number) => {
  const t = c01((f - GAPWIDER_CLIMB.f0) / (GAPWIDER_CLIMB.f1 - GAPWIDER_CLIMB.f0));
  return t * t * (3 - 2 * t);
};
/** United's height gained at frame f (the integral of the eased rate; closed form) */
export const gapWiderRise = (f: number) => {
  const D = GAPWIDER_CLIMB.f1 - GAPWIDER_CLIMB.f0;
  if (f <= GAPWIDER_CLIMB.f0) return 0;
  if (f >= GAPWIDER_CLIMB.f1) return RATE * (D / 2 + (f - GAPWIDER_CLIMB.f1));
  const t = (f - GAPWIDER_CLIMB.f0) / D;
  return RATE * D * (t * t * t - (t * t * t * t) / 2);
};

export type GapWiderPose = { at: [number, number]; alt: number; heading: number; pitch: number };
/** where jet j is at frame f (any f, also before f0: they have been cruising together) */
export const gapWiderPose = (j: GapWiderJet, f: number): GapWiderPose => {
  const s = JET_SPEED * f;
  const a0 = gapWiderAt0(j);
  const at: [number, number] = [a0[0] + GAPWIDER_DIR[0] * s, a0[1] + GAPWIDER_DIR[1] * s];
  if (j.key !== "united") return { at, alt: gapWiderLevelAlt(j), heading: GAPWIDER_HEADING, pitch: GAPWIDER_CLIMB.pitch0 };
  const pitch = GAPWIDER_CLIMB.pitch0 + Math.atan((RATE * climbS(f)) / JET_SPEED) / D2R;
  return { at, alt: CRUISE + gapWiderRise(f), heading: GAPWIDER_HEADING, pitch };
};

/** the group's reference point at frame f (moves at constant cruise speed; the camera rides on it) */
export const gapWiderGroup = (f: number): [number, number] => [GAPWIDER_DIR[0] * JET_SPEED * f, GAPWIDER_DIR[1] * JET_SPEED * f];

/** the satellite carrying United's link: high above and behind United, gliding at constant speed a little slower
 *  than the jets (it orbits on its own course), so the link leans and shimmers but stays on United */
export const GAPWIDER_SAT = { off: [40, SAT.y, 330] as V3, vel: [-8.6, 0, -4.6] as V3 };
export const gapWiderSat = (f: number): V3 => [GAPWIDER_SAT.off[0] + GAPWIDER_SAT.vel[0] * f, GAPWIDER_SAT.off[1], GAPWIDER_SAT.off[2] + GAPWIDER_SAT.vel[2] * f];

// ---------------------------------------------------------------------------
// CAMERA: framing offsets (x, z relative to the group; y, f, horizon, pitch absolute) on a damped airTrack; the
// group's constant cruise is added on top, so the follow itself never lags or bobs. Tilted up (the horizon low, the
// action against the darker mid sky); one long pull-back with a slight drop and tilt through the climb, already
// gliding at f0 and still creeping at the last frame.
// ---------------------------------------------------------------------------
export const GAPWIDER_CAM0: SideCam = { mode: "side", x: 11, y: CRUISE - 54, z: -14, f: 2000, horizon: 1185, pitch: -7.6, yaw: 0 };
/** the track runs from f-PRE so the camera is already gliding at f0 (the damped follower starts at rest) */
const PRE = 12;
export const GAPWIDER_TRACK: AirCam[] = airTrack(
  GAPWIDER_CAM0,
  [{ f0: 0, f1: 120, to: { x: 25, y: CRUISE - 63, z: -70, f: 2000, horizon: 1175, pitch: -8.2 }, warp: 1 }],
  95 + PRE,
);
export const gapWiderCam = (f: number): SideCam => {
  const c = airCamAt(GAPWIDER_TRACK, f + PRE) as SideCam;
  const g = gapWiderGroup(f);
  return { ...c, x: c.x + g[0], z: c.z + g[1] };
};

/** the pack's cruise altitudes (constant): each one levels its jet with United on screen at f0 (bisection) */
const levelCache: Record<string, number> = {};
export const gapWiderLevelAlt = (j: GapWiderJet): number => {
  if (j.key === "united") return CRUISE;
  if (levelCache[j.key] !== undefined) return levelCache[j.key];
  const cam = gapWiderCam(0);
  const yU = airProject(cam, [GAPWIDER_ORIGIN[0], CRUISE, GAPWIDER_ORIGIN[1]]).y;
  const at = gapWiderAt0(j);
  let lo = CRUISE - 300;
  let hi = CRUISE + 300;
  for (let k = 0; k < 50; k++) {
    const m = (lo + hi) / 2;
    if (airProject(cam, [at[0], m, at[1]]).y > yU) lo = m;
    else hi = m;
  }
  levelCache[j.key] = (lo + hi) / 2;
  return levelCache[j.key];
};
