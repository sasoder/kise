// twoHundredPlan — the layout, the taxi kinematics and the camera of TwoHundredWideBodies (scott-aircraft-order,
// cut 25). Pure data (no React), so the counts, the overlap audit and the entry audit run under bun as well.
//
// WORLD (metres, the plan camera's frame: X right, Z up the screen; origin = the 787 block's centre).
//   THE 200: United 787-9s, nose UP the screen (heading 0), 20 rows x 10, a brick pattern (odd rows shifted half a
//     column) at 68 m across x 52 m along: the rows taxi in from the bottom edge as rows and park top row first (the
//     camera starts on the top of the block and sinks with the convoy as it pulls back; the field fills below later).
//   THE 430: United narrowbodies, ALSO nose up, on one column grid (44 m across: x = +-(22 + 44 j), j 0..12), entering
//     from the bottom edge as rows abreast (one row = one rank), top row parking first:
//       side 737   4 columns x 18 rows each side of the 787 block (x +-418..550, 52 m along)        144
//       low  737  26 columns x  6 rows under the block, past a cross lane (63 m along)              156 -> 300 737 MAX
//       low  A321 26 columns x  5 rows under those, past a 12 m step                                130 A321neo
//     The side blocks fill first: their columns are the low block's outer four, so they pass up through the empty low
//     block area before the low block arrives behind them. Nothing ever passes over a parked jet.
// TAXI: every rank runs at a constant speed v, then brakes uniformly over its last s metres (the only ease: a real
//   jet slows to stop). Ranks follow at the convoy pitch Pc = Pp + v * dt and close to the park pitch Pp as they stop.
import { airCamAt, airTrack, type AirCam, type FieldItem } from "./aircraftShared";

export const FPS = 24000 / 1001;
export const DURATION = 81;

// --- the 787 block --------------------------------------------------------------------------------------------------
export const WB = { cols: 10, rows: 20, pitchX: 68, pitchZ: 52, brick: 17, heading: 0 } as const;
/** park centre of 787 (row r from the TOP, column c from the left) */
export const wbPark = (r: number, c: number): [number, number] => [(c - (WB.cols - 1) / 2) * WB.pitchX + (r % 2 === 0 ? -WB.brick : WB.brick), ((WB.rows - 1) / 2 - r) * WB.pitchZ];

// --- the narrowbody field ---------------------------------------------------------------------------------------------
export const NB = { pitchX: 44, sidePitchZ: 52, lowPitchZ: 63, lowTop: -640, typeStep: 12 } as const;
export type NbBlock = "side737" | "low737" | "lowA321";
const colX = (j: number) => 22 + NB.pitchX * j;
/** each block: its type, its columns (x), its rows (z, top row = rank 0) */
export const NB_BLOCKS: { id: NbBlock; type: "A321" | "B737MAX"; xs: number[]; zs: number[] }[] = [
  {
    id: "side737",
    type: "B737MAX",
    xs: [9, 10, 11, 12].flatMap((j) => [-colX(j), colX(j)]),
    zs: Array.from({ length: 18 }, (_, m) => ((18 - 1) / 2 - m) * NB.sidePitchZ),
  },
  { id: "low737", type: "B737MAX", xs: Array.from({ length: 13 }, (_, j) => j).flatMap((j) => [-colX(j), colX(j)]), zs: Array.from({ length: 6 }, (_, n) => NB.lowTop - NB.lowPitchZ * n) },
  {
    id: "lowA321",
    type: "A321",
    xs: Array.from({ length: 13 }, (_, j) => j).flatMap((j) => [-colX(j), colX(j)]),
    zs: Array.from({ length: 5 }, (_, n) => NB.lowTop - NB.lowPitchZ * (6 + n) - NB.typeStep),
  },
];
/** the bottom edge of the field (m) */
export const FIELD_BOTTOM = NB.lowTop - NB.lowPitchZ * 10 - NB.typeStep - 22.25;

// --- taxi kinematics ------------------------------------------------------------------------------------------------
/** a convoy of ranks: v m/frame, the lead rank stops at tLead, each next one dt later, braking over the last s m */
export type Convoy = { v: number; s: number; tLead: number; dt: number };
/** distance (m) still to go for rank i at frame t (0 once parked) */
export const toGo = (c: Convoy, i: number, t: number) => {
  const tau = c.tLead + i * c.dt - t;
  const td = (2 * c.s) / c.v;
  if (tau <= 0) return 0;
  if (tau < td) return (c.v * tau * tau) / (2 * td);
  return c.s + c.v * (tau - td);
};
export const WB_CONVOY: Convoy = { v: 16, s: 40, tLead: 10, dt: 1.1 };
/** per side: -1 = the left half (enters from the left edge), +1 = the right half (1.5 f later) */
/** the low block is ONE convoy of 11 ranks (6 rows of 737s, then 5 of A321s); the side blocks one of 18 */
export const NB_CONVOY: Record<"side" | "low", Convoy> = {
  side: { v: 20, s: 30, tLead: 46, dt: 1.2 },
  low: { v: 20, s: 30, tLead: 63, dt: 1.3 },
};

// --- the items at a frame -----------------------------------------------------------------------------------------
export type Placed = FieldItem & { type: "B787_9" | "A321" | "B737MAX"; group: string; id: string; moving: boolean };
export const wbItems = (t: number): Placed[] => {
  const out: Placed[] = [];
  for (let r = 0; r < WB.rows; r++) {
    const d = toGo(WB_CONVOY, r, t);
    for (let c = 0; c < WB.cols; c++) {
      const [x, z] = wbPark(r, c);
      out.push({ at: [x, z - d], heading: WB.heading, type: "B787_9", group: "787", id: `w${r}_${c}`, moving: d > 0 });
    }
  }
  return out;
};
export const nbItems = (t: number): Placed[] => {
  const out: Placed[] = [];
  let lowRank = 0;
  for (const b of NB_BLOCKS) {
    const side = b.id === "side737";
    b.zs.forEach((z, m) => {
      const rank = side ? m : lowRank + m;
      const d = toGo(side ? NB_CONVOY.side : NB_CONVOY.low, rank, t);
      for (const x of b.xs) out.push({ at: [x, z - d], heading: 0, type: b.type, group: b.id, id: `${b.id}_${x}_${m}`, moving: d > 0 });
    });
    if (!side) lowRank += b.zs.length;
  }
  return out;
};

// --- the camera: one decelerating pull-back (k 2.7 at f0 -> ~1.35 at "bodies" -> a creep to ~0.9), sinking with the
// convoy from the top of the block to the whole field; already moving at f0 (the follower is pre-rolled CAM_PRE frames).
export const CAM_PRE = 16;
export const CAM_KEYS = { start: { z: 240, k: 3.4 }, g1: { f1: 50, z: 0, k: 1.3 }, g2: { f0: 14, f1: 86, z: -410, k: 0.88 }, warp: 0.7 };
const CAM_TRACK = airTrack(
  { mode: "plan", x: 0, z: CAM_KEYS.start.z, k: CAM_KEYS.start.k },
  [
    { f0: 0, f1: CAM_PRE + CAM_KEYS.g1.f1, to: { k: CAM_KEYS.g1.k, z: CAM_KEYS.g1.z }, warp: CAM_KEYS.warp },
    { f0: CAM_PRE + CAM_KEYS.g2.f0, f1: CAM_PRE + CAM_KEYS.g2.f1, to: { k: CAM_KEYS.g2.k, z: CAM_KEYS.g2.z } },
  ],
  DURATION + CAM_PRE + 2,
);
export const camAt = (f: number): AirCam => airCamAt(CAM_TRACK, f + CAM_PRE);
