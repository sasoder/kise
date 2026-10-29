// ===================================================================================================================
// tenXPlan — the plan of cut 7, TenXEveryYear (sam-gigawatt-cost): the output yard's geometry, the beats and the
// camera. Own file of cut 7 (no other cut imports it). World units: metres, as aircraftShared (X right, Y up, Z away
// from the camera); the campus is at [0, 0] (campusWorld), the $20B column at COST.at (gigawattCost).
// ===================================================================================================================
import { airTrack, type AirGlide, type SideCam } from "../scott-aircraft-order/aircraftShared";
import { CUT6_END_CAM } from "./gigawattCost";

export const FRAMES = 99;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const t = c01(u);
  return t * t * (3 - 2 * t);
};

// --- the output yard ---------------------------------------------------------------------------------------------
/** one work unit: a cream cube (m) on a P pitch; ten files across (X), ten rows deep (Z) */
export const UNIT = {
  /** the cube's edge (m) */
  H: 48,
  /** grid pitch (m): 14 m gaps between the cubes */
  P: 62,
  /** file 0's centre X (m): the column's right corner is at X -42, so a 54 m gap (room for its readout) */
  x0: 36,
  /** the mouth's ramp run (m): a unit comes up from under the campus over this much Z, rising H */
  ramp: 60,
  /** Z of a unit's centre when it has just come fully out of the mouth (row 10's resting place) */
  ze: -291,
  /** the file the one unit of f0 stands in */
  first: 0,
  /** where the first ten wait on "10x": beside the $20B column (z -490), a row's depth behind it so all ten fit */
  wait: -420,
} as const;
export const unitX = (i: number) => UNIT.x0 + i * UNIT.P;
/** the mouth: the open trench along the campus's front edge the units come up out of [x0, z0, x1, z1] */
export const MOUTH = [unitX(0) - UNIT.H / 2 - 4, UNIT.ze - UNIT.H / 2 - 3, unitX(9) + UNIT.H / 2 + 4, UNIT.ze + UNIT.ramp + UNIT.H / 2 + 3] as const;
/** the apron's reach: the concrete carried forward past cut 6's near edge (z -705) to hold the yard [x0, z0, x1, z1] */
export const REACH = [-1400, -1050, 1500, -703] as const;

// --- the beats (frames, from the brief's word table: 10x 34 · every 87 · year 92) ----------------------------------
export const BEAT = {
  /** the nine others of the first ten slide out of the mouth and across the apron to the one (land on "10x") */
  ten: { f0: 6, f1: 33 },
  /** rows 2-10 come up out of the mouth as one train behind the ten, take them along to the front of the yard
   *  (the ten become the block's first row) and all land just before "year" (f92) */
  train: { f0: 24, f1: 87 },
  /** the output's multiple: "10×" enters on "10x", turns to "100×" landing on "year" */
  tag: { f0: 28, f1: 37 },
  swap: { f0: 78, f1: 89 },
} as const;
/** where the multiple stands: on the desert just right of the campus pad, behind the yard's back right corner */
export const TAG_AT = [unitX(8), 0, -150] as const;

/** start soft, run, settle long (C1, monotone): a smoothstep warped so the landing is longer than the take-up */
const easeRun = (u: number) => smooth(1 - Math.pow(1 - c01(u), 1.45));
/** out at a steady pace, a long damped landing */
const easeLand = (u: number) => 1 - Math.pow(1 - c01(u), 2.2);
/** polynomial smooth minimum (C1), blending over k */
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
const span = (f: number, b: { f0: number; f1: number }) => (f - b.f0) / (b.f1 - b.f0);
/** under the ramp, all hidden (a unit's centre Z) */
const Z_HIDDEN = UNIT.ze + UNIT.ramp + 6;
/** the ten ease into the train's pace over this much closing distance (m) */
const SMIN_K = 150;
/** where row 2 of the block starts, under the campus: far enough back that the ten feel the train only once out */
const TRAIN_FROM = Z_HIDDEN + 230;
/** row r's resting Z (r 0 = the first ten, at the front) */
export const rowRest = (r: number) => UNIT.ze - (9 - r) * UNIT.P;

export type UnitState = { x: number; z: number; base: number };
/** every unit at frame f: 100 items, row r (0 = the first ten) file i; base = the cube's foot height (m, < 0 still
 *  coming up the ramp; <= -H all under ground) */
export const unitsAt = (f: number): UnitState[] => {
  const out: UnitState[] = [];
  // rows 2-10: one rigid train, coming up from deep under the campus (out of sight, behind the first ten in the
  // queue), every row landing in its rest
  const T = (TRAIN_FROM - rowRest(1)) * easeRun(span(f, BEAT.train));
  const z1 = TRAIN_FROM - T;
  // the first ten: the one waits level with the column; the nine slide out to it; when the train comes up one pitch
  // behind them they move off ahead of it (a smooth minimum: they ease into its pace, then go as one block)
  const nine = Z_HIDDEN + (UNIT.wait - Z_HIDDEN) * easeLand(span(f, BEAT.ten));
  const ahead = (w: number) => smin(w, z1 - UNIT.P, SMIN_K);
  for (let r = 0; r < 10; r++) {
    for (let i = 0; i < 10; i++) {
      const z = r === 0 ? ahead(i === UNIT.first ? UNIT.wait : nine) : z1 + (r - 1) * UNIT.P;
      const base = -UNIT.H * c01((z - UNIT.ze) / UNIT.ramp);
      out.push({ x: unitX(i), z, base: z - UNIT.ze > UNIT.ramp + 0.5 ? -UNIT.H - 1 : base });
    }
  }
  return out;
};
/** how many units are fully out at frame f */
export const unitsOut = (f: number) => unitsAt(f).filter((u) => u.base > -0.01).length;

// --- the camera: ONE damped pull-back from cut 6's resolved camera, still drifting at f98 ---------------------------
export const CAM_START: SideCam = { ...CUT6_END_CAM };
const GLIDES: AirGlide[] = [
  // the drift right toward the yard leads (the first ten stand right of the column on "10x")
  { f0: 0, f1: 60, warp: 0.62, to: { x: 240 } },
  // the pull-back: back, up and tipping down over the yard, the lens lengthening as it goes; still easing at f98
  { f0: 0, f1: 108, warp: 0.62, to: { y: 1160, z: -1345, pitch: 45, yaw: 0 } },
  { f0: 22, f1: 112, to: { f: 1500 } },
];
export const TRACK = airTrack(CAM_START, GLIDES, FRAMES + 2);
