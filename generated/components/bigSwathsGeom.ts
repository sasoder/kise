import { CAM_LIFT, EXIT_F, camFromTrack, glideTargetAt, runFollower } from "./chinatalkShared";
import type { Cam, Glide } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// bigSwathsGeom -- the world, the clocks and the camera of BigSwathsNoJob
// (Jordan Schneider, "Hu Jintao's 25 million jobs", ChinaTalk, graphic B).
// Pure numbers, no React. World px, y grows down; the class is centred on
// x = 0 and its top (row 1's cap tips) is y = 0. S is the cut's local frame
// (= edit frame - IN).
// ---------------------------------------------------------------------------

export const FPS = 24;
/** edit frame of the cut ("you have" is local 7) */
export const IN = 1168;
/** the slot exactly: the edit cuts back to the speaker at 1312 */
export const DURATION = 1312 - IN;

// --- the formation: 5 columns x 8 rows, an exact grid -------------------------
export const COLS = 5;
export const ROWS = 8;
export const COL_PITCH = 180;
export const ROW_PITCH = 195;
/** a figure: local x = 0 on its axis, local y = 0 at the tip of its cap board */
export const BODY_HALF = 75;
export const FIG_H = 181;
/** the chest: where the briefcase outline / briefcase / parcel sits (local y, the middle of the bust) */
export const CHEST_Y = 136;
export const colX = (c: number) => (c - (COLS - 1) / 2) * COL_PITCH;
export const rowY = (r: number) => r * ROW_PITCH;
export const BLOCK_H = (ROWS - 1) * ROW_PITCH + FIG_H;
export const BLOCK_CY = BLOCK_H / 2;

// --- who gets what ----------------------------------------------------------------
export type Fate = "job" | "none" | "parcel";
/** rows 1-2 get the job, rows 3-6 get nothing, rows 7-8 get a parcel */
export const fateOf = (r: number): Fate => (r < 2 ? "job" : r < 6 ? "none" : "parcel");
/** centre-out lag inside a row, in column steps */
const lag = (c: number) => Math.abs(c - (COLS - 1) / 2);

// --- things that ARRIVE: a steady travel that decelerates into its seat -----------
/** cruise speed (world px / frame) and the frames of the deceleration */
export const ARRIVE_V = 40;
export const ARRIVE_DECEL_F = 8;
/** Distance still to travel `t` frames before the seat: quadratic over the last
 *  ARRIVE_DECEL_F frames (speed falls linearly to 0, no bounce), ARRIVE_V before. */
export const remaining = (t: number) => {
  if (t <= 0) return 0;
  const d = (ARRIVE_V * ARRIVE_DECEL_F) / 2;
  if (t <= ARRIVE_DECEL_F) return d * (t / ARRIVE_DECEL_F) * (t / ARRIVE_DECEL_F);
  return d + ARRIVE_V * (t - ARRIVE_DECEL_F);
};
/** The contact frame of the briefcase (rows 1-2) or the parcel (rows 7-8) of a
 *  figure: the centre column's, + 1 f per column step outward. Each pair of
 *  rows travels as ONE block, one row pitch apart, so both rows of a column
 *  seat on the same frame and nothing ever passes over a seated item. */
const SEAT_ROW: Record<number, number> = { 0: 10, 1: 10, 6: 108, 7: 108 };
export const seatF = (r: number, c: number) => SEAT_ROW[r] + lag(c);

// --- rows 3-6: nothing comes, the red soaks down the ranks -------------------------
export const RED_F0 = 30;
/** one row per 14 f (the brief's number): the front leaves a figure as it enters the one below */
export const RED_ROW_F = 14;
/** centre-out lag inside a row, frames per column step */
export const RED_LAG_F = 2;
/** a soak (red down a figure, ink / deep red out from a seated tile) takes this long */
export const SOAK_F = RED_ROW_F;
export const redStart = (r: number, c: number) => RED_F0 + RED_ROW_F * (r - 2) + RED_LAG_F * lag(c);
/** the dashed outline of a figure that gets nothing diffuses over the kit's exit time */
export const GHOST_DIFF_F = EXIT_F;
/** the slight slump of a figure that got nothing: its head (and cap) sinks this
 *  far into the shoulders, world px; the shoulders stay on the grid */
export const SLUMP = 8;

// --- the tassels (the only life in the hold besides the camera) --------------------
export const TASSEL_DEG = 3.5;
export const TASSEL_PERIOD = 11;

// --- the camera: one long move (down the ranks while pulling back), keyed as
// superposed glides of the camera CENTRE, through the kit's damped follower ------
/** the camera centre at the start of the track: close on the top of the class */
export const CAM_F0 = -14;
export const CAM_START: Cam = { x: 0, y: 352, k: 2.0 };
export const GLIDES: Glide[] = [
  // "you have big swaths of the economy": down the ranks, ahead of the cascade, pulling back
  { f0: -14, f1: 68, dy: 530, k: 1.34, even: 0.3 },
  // "that can't get a job in general or a job": the pull-back carries on to the whole class
  { f0: 54, f1: 128, dy: -109, k: 0.992 },
  // the hold: a slow residual push that is still running at the cut
  { f0: 108, f1: 172, k: 1.06 },
];
/** the keyed camera CENTRE (true middle of the frame) at frame f */
export const camCentreAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
/** the same as the kit's LOOK target: the kit lifts a look by CAM_LIFT / k so it
 *  lands at screen y 835; this clip frames on the TRUE middle, so the lift is
 *  taken out again here (the follower then chases the centre itself). */
const lookAt = (f: number): Cam => {
  const c = camCentreAt(f);
  return { x: c.x, y: c.y - CAM_LIFT / c.k, k: c.k };
};
const TRACK = runFollower(lookAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the final framing) */
export const REST_CAM: Cam = TRACK.cams[TRACK.cams.length - 1];
