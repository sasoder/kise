// onlyAirlinePlan — the fleet, the camera, the train and the link wave of cut 2 OnlyAirlineAtScale (scott-free-wifi).
// Pure data + maths (no React): the component and the planner both read it.
//
// FRAME: wifiSky's JET-FIXED frame (CruiseStage air = AIR_JET_FRAME): a jet cruising at exactly JET_SPEED with
// heading -90 sits still; the air, the deck and the contrails slide past to the right. Every other jet cruises at its
// own true airspeed JET_SPEED * (1 + dv) along its own heading (-90 + dh): in this frame it drifts slowly at
// v = JET_SPEED (1 + dv) [sin h, cos h] + [JET_SPEED, 0], constant (no easing: cruise).
//
// AUTHORING: each jet is written where it sits on the RESOLVED frame (f109, the camera at its end): screen centre
// (sx, sy) of the fuselage and its depth d (m along the view). `fleetAt` back-solves the world point once, then runs
// the jet's constant drift backwards to every earlier frame.
import { airCamAt, airTrack, type AirCam, type JetType, type SideCam, type V3, type Airline } from "../scott-aircraft-order/aircraftShared";
import { CRUISE, JET_SPEED, type TrainSpec } from "./wifiSky";

export const DURATION = 110;
/** the camera track's pre-roll (frames): the pull-back is already under way at f0 */
export const PRE = 8;
/** the fuselage centre's height above the jet's `alt` (m; ~belly + half the section of a widebody) */
export const FUS_Y = 4.9;

// --- camera ---------------------------------------------------------------------------------------------------------
/** f0: side-on and close through a long lens (cut 1's look): United's 787-9 (U0) ~900 px long, nose left, at
 *  y ~870, seen from a touch above (its radome on the crown), its cream link rising out of the top edge to the train
 *  overhead (out of frame). The long lens keeps the crowd out of the narrow field: only big jets at the edges show. */
export const CAM_OPEN: SideCam = { mode: "side", x: 0.0, y: CRUISE + 92.7, z: -207.1, f: 5200, horizon: 870, pitch: 14 };
/** the resolved wide: back, up and wider, looking out over the fleet; the deck's haze line high (y ~705), the train
 *  across the dusk above it */
export const CAM_WIDE: SideCam = { mode: "side", x: 40, y: CRUISE + 70, z: -115, f: 1150, horizon: 705, pitch: 0 };
const TILT_WARP = 1.4;
const TRACK = airTrack(
  { ...CAM_OPEN },
  [
    // one pull-back (pre-rolled: under way at f0): the lens widens and the camera comes out to the wide; the damped
    // follower settles it around f85. The tilt to level is one ease on the same move, a little behind the zoom, so U0
    // never sinks into the caption band while the lens is still long.
    { f0: 0, f1: PRE + 66, to: { x: CAM_WIDE.x, y: CAM_WIDE.y, z: CAM_WIDE.z, f: CAM_WIDE.f, horizon: CAM_WIDE.horizon }, warp: 0.85 },
    { f0: 0, f1: PRE + 70, to: { pitch: 0 }, warp: TILT_WARP },
    // a slow living creep out to the last frame (never a hold)
    { f0: PRE + 60, f1: PRE + 140, to: { z: CAM_WIDE.z - 14, y: CAM_WIDE.y + 4, f: CAM_WIDE.f * 0.975 } },
  ],
  DURATION + PRE + 4,
);
export const camAt = (f: number): AirCam => airCamAt(TRACK, f + PRE);

// --- the screen <-> world maths (side mode, as aircraftShared's airProject) ------------------------------------------
const D2R = Math.PI / 180;
export const unproject = (cam: SideCam, sx: number, sy: number, d: number): V3 => {
  const yaw = (cam.yaw ?? 0) * D2R;
  const pitch = (cam.pitch ?? 0) * D2R;
  const sY = Math.sin(yaw);
  const cY = Math.cos(yaw);
  const sP = Math.sin(pitch);
  const cP = Math.cos(pitch);
  const fwd: V3 = [sY * cP, -sP, cY * cP];
  const rgt: V3 = [cY, 0, -sY];
  const up: V3 = [sY * sP, cP, cY * sP];
  const r = ((sx - 540) * d) / cam.f;
  const u = (((cam.horizon ?? 960) - sy) * d) / cam.f;
  return [cam.x + fwd[0] * d + rgt[0] * r + up[0] * u, cam.y + fwd[1] * d + rgt[1] * r + up[1] * u, cam.z + fwd[2] * d + rgt[2] * r + up[2] * u];
};

// --- the fleet ------------------------------------------------------------------------------------------------------
export type FleetSpec = {
  id: string;
  airline: Airline;
  type: JetType;
  /** resolved-frame screen centre of the fuselage (px) and depth (m) */
  sx: number;
  sy: number;
  d: number;
  /** true airspeed offset (fraction of JET_SPEED) and heading offset from -90 (deg, + turns the nose away) */
  dv?: number;
  dh?: number;
  detail?: "hi" | "lo";
};
/** U0: the opening jet (cut 1's United 787-9 look), at a fixed world place (it defines the jet frame) */
export const U0 = { type: "B787_9" as JetType, at: [0, 145] as [number, number], heading: -90, alt: CRUISE, pitch: 1.5 };

export const FLEET_SPEC: FleetSpec[] = [
  // ---- UNITED (amber fins): U0 + 12; every one is linked by "scale"
  { id: "U1", airline: "united", type: "B787_10", sx: 880, sy: 900, d: 250, dv: -0.03, dh: 1 },
  { id: "U2", airline: "united", type: "B777", sx: 640, sy: 1297, d: 420, dv: 0.09, dh: 0 },
  { id: "U3", airline: "united", type: "B737MAX", sx: 140, sy: 1290, d: 310, dv: -0.04, dh: 0 },
  { id: "U4", airline: "united", type: "B787_9", sx: 720, sy: 560, d: 560, dv: -0.02, dh: 1 },
  { id: "U5", airline: "united", type: "B777", sx: 220, sy: 790, d: 560, dv: 0, dh: 0 },
  { id: "U6", airline: "united", type: "B737MAX", sx: 960, sy: 1270, d: 360, dv: 0.03, dh: -1 },
  { id: "U7", airline: "united", type: "B787_10", sx: 600, sy: 800, d: 720, dv: 0.07, dh: 0 },
  { id: "U8", airline: "united", type: "B787_9", sx: 960, sy: 650, d: 660, dv: -0.02, dh: 0.5 },
  { id: "U9", airline: "united", type: "A321", sx: 110, sy: 1020, d: 420, dv: 0, dh: 0 },
  { id: "U10", airline: "united", type: "B787_9", sx: 400, sy: 540, d: 620, dv: -0.03, dh: 1 },
  { id: "U11", airline: "united", type: "B777", sx: 900, sy: 1040, d: 330, dv: 0.02, dh: -1 },
  { id: "U12", airline: "united", type: "B787_9", sx: 700, sy: 1030, d: 470, dv: 0.01, dh: 0 },
  // ---- the others (cream fins, their real mark in ink): never linked
  { id: "o1", airline: "delta", type: "A330", sx: 220, sy: 1590, d: 205, dv: -0.03, dh: -1 },
  { id: "o2", airline: "american", type: "B777", sx: 920, sy: 1570, d: 270, dv: 0.03, dh: 1 },
  { id: "o3", airline: "lufthansa", type: "B747", sx: 500, sy: 880, d: 520, dv: 0.1, dh: 0 },
  { id: "o4", airline: "delta", type: "A321", sx: 1020, sy: 1150, d: 640, dv: -0.05, dh: 1 },
  { id: "o5", airline: "britishAirways", type: "B777", sx: 730, sy: 1215, d: 600, dv: 0.02, dh: -1 },
  { id: "o6", airline: "emirates", type: "A380", sx: 1020, sy: 780, d: 640, dv: -0.01, dh: 0.5 },
  { id: "o7", airline: "american", type: "A321", sx: 240, sy: 1180, d: 640, dv: 0, dh: 0 },
  { id: "o8", airline: "delta", type: "A330", sx: 260, sy: 890, d: 760, dv: -0.02, dh: 1 },
  { id: "o9", airline: "american", type: "B777", sx: 500, sy: 670, d: 860, dv: 0.02, dh: -0.5 },
  { id: "o10", airline: "lufthansa", type: "A340", sx: 1000, sy: 430, d: 780, dv: -0.01, dh: 0.5 },
  { id: "o11", airline: "delta", type: "B777", sx: 400, sy: 1215, d: 720, dv: -0.09, dh: 0 },
  { id: "o12", airline: "britishAirways", type: "B787_9", sx: 470, sy: 1100, d: 820, dv: -0.12, dh: 4.5 },
  { id: "o13", airline: "emirates", type: "B777", sx: 760, sy: 1100, d: 900, dv: 0.01, dh: -0.5 },
  { id: "o14", airline: "american", type: "B787_9", sx: 1020, sy: 540, d: 880, dv: -0.04, dh: 1 },
  { id: "o15", airline: "delta", type: "A330", sx: 600, sy: 1730, d: 235, dv: 0.02, dh: -1 },
  { id: "o16", airline: "american", type: "A330", sx: 120, sy: 1830, d: 260, dv: -0.03, dh: 0.5 },
  { id: "o18", airline: "delta", type: "A321", sx: 460, sy: 760, d: 660, dv: -0.11, dh: 0 },
];

export type FleetJet = FleetSpec & { at109: [number, number]; alt: number; heading: number; vel: [number, number]; united: boolean };
const CAM109 = camAt(DURATION - 1) as SideCam;
export const FLEET: FleetJet[] = FLEET_SPEC.map((s) => {
  const P = unproject(CAM109, s.sx, s.sy, s.d);
  const h = -90 + (s.dh ?? 0);
  const sp = JET_SPEED * (1 + (s.dv ?? 0));
  const vel: [number, number] = [sp * Math.sin(h * D2R) + JET_SPEED, sp * Math.cos(h * D2R)];
  return { ...s, at109: [P[0], P[2]], alt: P[1] - FUS_Y, heading: h, vel, united: s.airline === "united" };
});
/** a fleet jet's `at` at frame f (constant drift) */
export const jetAt = (j: FleetJet, f: number): [number, number] => [j.at109[0] + j.vel[0] * (f - (DURATION - 1)), j.at109[1] + j.vel[1] * (f - (DURATION - 1))];

// --- the satellite train --------------------------------------------------------------------------------------------
/** the train comes from the far sky toward the camera, a little to the right: each satellite rises up the frame and
 *  passes overhead (out of the top) while new ones come up out of the far dusk behind it */
/** the train: a line of satellites across the far dusk above the fleet, gliding right to left at constant speed (an
 *  orbit), a little nearer on the right. Drawn higher (TRAIN_Y) and bigger (scale 6.5) than SAT's defaults: the same
 *  honest cheat as the world's, pushed so the train reads across the top of a wide frame. */
export const TRAIN_Y = CRUISE + 560;
export const TRAIN: TrainSpec = { origin: [-200, TRAIN_Y, 1180], dir: [-0.95, 0, 0.31], speed: 3.2, spacing: 150, count: 22, scale: 6.5, roll: 22, first: 4 };

// --- the link wave --------------------------------------------------------------------------------------------------
/** frames a link's tip takes from its satellite to the radome (eased), and the glow's rise after contact */
export const DRAW = 9;
export const GLOW_IN = 5;
/** the wave: the first new tip leaves its satellite at WAVE0, the last lands by WAVE_END (before "scale", f96) */
export const WAVE0 = 54;
export const WAVE_END = 94;
/** at most this many links hang from one satellite: separate threads, not fans */
export const MAX_PER_SAT = 2;
export type LinkPlan = { id: string; sat: number; start: number; contact: number };
/** THE WAVE (approved by the director, Oct 23): the order runs out from U0 across the sky; each link's satellite was
 *  chosen once for the whole web by a hill-climb (at most MAX_PER_SAT links a satellite, beams leaning little, none
 *  across another airline's jet or crossing each other on the resolved frame) and is now fixed here so the resolved
 *  frame never changes with the opening. Satellite indices are TRAIN's. */
export const U0_SAT = 6;
const WAVE: [string, number][] = [
  ["U9", 4],
  ["U5", 5],
  ["U12", 7],
  ["U7", 7],
  ["U3", 4],
  ["U10", 6],
  ["U1", 9],
  ["U2", 8],
  ["U4", 8],
  ["U11", 10],
  ["U8", 10],
  ["U6", 9],
];
export const LINKS: LinkPlan[] = WAVE.map(([id, sat], k) => {
  const start = Math.round(WAVE0 + ((WAVE_END - DRAW - WAVE0) * k) / Math.max(1, WAVE.length - 1));
  return { id, sat, start, contact: start + DRAW };
});
// guard: every United jet linked once, no satellite over MAX_PER_SAT
{
  const load: Record<number, number> = { [U0_SAT]: 1 };
  for (const l of LINKS) load[l.sat] = (load[l.sat] ?? 0) + 1;
  if (Object.values(load).some((n) => n > MAX_PER_SAT) || LINKS.length !== FLEET.filter((j) => j.united).length) throw new Error("onlyAirlinePlan: WAVE table");
}
