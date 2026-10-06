import { clamp01, easeOutCubic, evenEase, hash01, lerp, mCameraTrack, smoothstep } from "./mavenShared";
import type { Glide, Pt } from "./mavenShared";

// ---------------------------------------------------------------------------
// TiedToTheDataGeom — the world, the clocks and the camera of cut D
// (TiedToTheData). Pure functions of the master clock S (local frames), so the
// numbers can be audited from a script (out/bharat-maven/D/audit.ts).
// World px, y down. The WIDE framing is k 1.2 looking at (WIDE_X, WIDE_Y).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 144;

// --- LEFT: the use case (B's OPERATIONS frame) ---------------------------------
// B's OPERATIONS frame (noRelevantTargetsGeom.ts): same seed, same seal place.
export const OPS_SEED = 4242;
export const OPS_TX = 0.76;
export const OPS_TY = 0.29;
export const FRAME_X = -560;
export const FRAME_Y = 0;
export const FRAME_W = 520;
export const FRAME_H = FRAME_W * 0.75;
export const SEAL_SIDE = FRAME_W * 0.105;
export const SEAL: Pt = { x: FRAME_X + (OPS_TX - 0.5) * FRAME_W, y: FRAME_Y + (OPS_TY - 0.5) * FRAME_H };
export const USE_LABEL: Pt = { x: FRAME_X, y: FRAME_Y - FRAME_H / 2 - 52 };
/** the frame's outline: fraction written at S (the last edge is still wet on frame 0) */
export const frameDraw = (S: number) => 0.78 + 0.22 * easeOutCubic((S + 2) / 15);
export const frameWet = (S: number) => 1 - smoothstep((S - 9) / 12);

// --- the tie line ---------------------------------------------------------------
export const TIE_Y = 110;
export const TIE_X0 = FRAME_X + FRAME_W / 2;
export const TILE = 104;
export const TILE_H = TILE * 0.75;
export const PITCH = TILE_H + 8;
export const COL_X = 60;
export const TIE_X1 = COL_X - TILE / 2;
export const TIE_PTS: Pt[] = [
  { x: TIE_X0, y: TIE_Y },
  { x: TIE_X1, y: TIE_Y },
];
export const TIE_S0 = 28;
export const TIE_S1 = 48;
/** arc length of the tie line written at S (lands on the column's foot on "data") */
export const tieLen = (S: number) => (TIE_X1 - TIE_X0) * evenEase((S - TIE_S0) / (TIE_S1 - TIE_S0), 0.3);
export const tieBead = (S: number) => smoothstep((S - TIE_S0) / 3) * (1 - smoothstep((S - TIE_S1 + 1) / 6));
export const tieWet = (S: number) => smoothstep((S - TIE_S0) / 3) * (1 - smoothstep((S - TIE_S1) / 12));

// --- MIDDLE: the data column -------------------------------------------------------
/** tiles in the stack when it is ENOUGH */
export const ENOUGH_N = 5;
/** when each tile arrives at the column's foot (individual spacing) */
export const ARRIVE = [50, 58.5, 63.5, 68.5, 73.5, 78.5, 83.5, 88.5];
export const N_TILES = ARRIVE.length;
/** tiles that overflow the ENOUGH line and feed the model */
export const N_FEED = N_TILES - ENOUGH_N;
export const TRAVEL_F = 14;
export const TRAVEL_X0 = TIE_X0 + 64;
export const FLY_F = 19;
export const LINE_Y = TIE_Y - (ENOUGH_N - 1) * PITCH - TILE_H / 2 - 10;
export const LINE_X0 = COL_X - 104;
export const LINE_X1 = COL_X + 104;
export const LINE_DRAW_S = 56;
export const ENOUGH_LABEL: Pt = { x: LINE_X0 - 24, y: LINE_Y };
export const ENOUGH_WORD_S = 75;
/** the stack's top tile is under the line: the dashed line turns solid from the stack outward */
export const REACH_S = ARRIVE[ENOUGH_N - 1] - 2;
export const lineSolid = (S: number) => easeOutCubic((S - REACH_S) / 11);
export const lineDraw = (S: number) => smoothstep((S - LINE_DRAW_S) / 12);
export const DATA_LABEL: Pt = { x: COL_X, y: TIE_Y + TILE_H / 2 + 31 };
export const DATA_WORD_S = 50;

// --- RIGHT: the model ----------------------------------------------------------------
export const MODEL: Pt = { x: 340, y: -110 };
export const MODEL_R = 90;

/** the stack lifts one pitch as newcomer j slides in under it */
const push = (S: number, j: number) => smoothstep((S - (ARRIVE[j] - 9)) / 7);
/** when tile i (i < N_FEED) lets go of the stack's top and flies to the model */
export const leaveS = (i: number) => ARRIVE[i + ENOUGH_N] - 8;
export const feedArriveS = (i: number) => leaveS(i) + FLY_F;
const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const m = 1 - t;
  return {
    x: m * m * m * p0.x + 3 * m * m * t * p1.x + 3 * m * t * t * p2.x + t * t * t * p3.x,
    y: m * m * m * p0.y + 3 * m * m * t * p1.y + 3 * m * t * t * p2.y + t * t * t * p3.y,
  };
};

export type TileState = {
  x: number;
  y: number;
  /** outline + wash reveal, raw 0..1 */
  reveal: number;
  /** the seal is stamped as the tile arrives at the column, raw 0..1 */
  stamp: number;
  scale: number;
  diffuse: number;
};
/** Everything about data tile i at S, or null when it does not exist (yet / any more). */
export const tileAt = (i: number, S: number): TileState | null => {
  const a = ARRIVE[i];
  let x = COL_X;
  let reveal = 1;
  if (i === 0) {
    // the first frame is written in place where the line lands
    reveal = clamp01((S - (a - 5)) / 8);
  } else {
    const u = (S - (a - TRAVEL_F)) / TRAVEL_F;
    if (u <= 0) return null;
    x = lerp(TRAVEL_X0, COL_X, evenEase(u, 0.32));
    reveal = clamp01((u + 0.08) / 0.4);
  }
  if (reveal <= 0) return null;
  let n = 0;
  // a frame that has left for the model is no longer pushed by later arrivals
  for (let j = i + 1; j < Math.min(N_TILES, i + ENOUGH_N + 1); j++) n += push(S, j);
  let y = TIE_Y - PITCH * n;
  let scale = 1;
  let diffuse = 0;
  if (i < N_FEED) {
    const v = (S - leaveS(i)) / FLY_F;
    if (v >= 1) return null;
    if (v > 0) {
      const p0 = { x: COL_X, y: TIE_Y - PITCH * ENOUGH_N };
      const h = hash01(i, 9);
      const p1 = { x: COL_X + 70 + 30 * h, y: p0.y + 14 - 20 * h };
      // in from the model's left, under its MODEL label
      const p2 = { x: MODEL.x - 165 - 30 * h, y: MODEL.y - 25 + 30 * hash01(i, 4) };
      // slow to let go, quick across, easing into the model
      const e = smoothstep(v);
      const b = bez(p0, p1, p2, MODEL, e);
      x += b.x - p0.x;
      y += b.y - p0.y;
      scale = 1 - 0.5 * smoothstep((v - 0.45) / 0.55);
      diffuse = clamp01((v - 0.7) / 0.3) * 0.9;
    }
  }
  return { x, y, reveal, stamp: clamp01((S - (a - 2)) / 7), scale, diffuse };
};

/** the model's wash: one step per frame it is fed, raw 0..1 */
export const modelFill = (S: number) => {
  let f = 0;
  for (let i = 0; i < N_FEED; i++) f += smoothstep((S - (feedArriveS(i) - 3)) / 8);
  return f / N_FEED;
};
export const FULL_S = feedArriveS(N_FEED - 1) + 5;
/** the eye's dashed expected square turns solid as the wash fills */
export const eyeSolid = (S: number) => smoothstep((S - (FULL_S - 10)) / 10);

// --- the bracket's way back -------------------------------------------------------------
export const BR_S0 = 100;
export const BR_S1 = 129;
export const BR_SIZE_IN = MODEL_R * 0.78;
export const BR_SIZE_OUT = 124;
export const BR_LOCK_SIDE = SEAL_SIDE * 1.72;
// a shallow arc whose centre passes over one data frame's seal (the eye meets the same target in the data)
const BR_P1: Pt = { x: 180, y: -70 };
const BR_P2: Pt = { x: -120, y: -50 };
export const bracketU = (S: number) => clamp01((S - BR_S0) / (BR_S1 - BR_S0));
/** one smooth arc: out of the model, across the data, into the use-case frame, onto the seal */
export const bracketAt = (S: number) => {
  const u = bracketU(S);
  const e = smoothstep(u);
  const p = bez(MODEL, BR_P1, BR_P2, SEAL, e);
  const size = lerp(BR_SIZE_IN, BR_SIZE_OUT, smoothstep(u / 0.45));
  return { ...p, size, u };
};
/** corners tighten onto the seal (landing f128-130) */
export const LOCK_S0 = 124;
export const lockU = (S: number) => clamp01((S - LOCK_S0) / 8);
/** the seal comes up from RED_DEEP to vermilion: one 12 f crossfade, 0 = deep, 1 = red */
export const sealUp = (S: number) => smoothstep((S - 123) / 12);

// --- the travelling bead on the tie line (the hold) -------------------------------------------
export const PULSE_S0 = 124;
/** the bracket's own red square fades over 6 f as it closes on the seal (S 120..126, gone before the two reds
 *  would sit side by side): only the real seal is red when the corners tighten */
export const eyeSquare = (S: number) => 1 - smoothstep((S - (BR_S1 - 9)) / 6);
export const MODEL_LABEL: Pt = { x: MODEL.x, y: MODEL.y - MODEL_R - 44 };
export const MODEL_WORD_S = 96;
export const pulseAt = (S: number) => {
  const u = (S - PULSE_S0) / 30;
  if (u <= 0 || u >= 1) return null;
  return { s: (TIE_X1 - TIE_X0) * u, op: smoothstep(u / 0.15) * (1 - smoothstep((u - 0.85) / 0.15)) };
};

// --- the camera: left to right and back ---------------------------------------------------------
export const WIDE_X = -195;
export const WIDE_Y = -47;
export const WIDE_K = 1.2;
const CAM_START = { x: -562, y: -30, k: 1.48 };
const GLIDES: Glide[] = [
  // creep in on the use-case frame, toward the deep-red seal
  { f0: -16, f1: 38, dx: 62, dy: 6, k: 1.565 },
  // follow the bead to the right: the column enters
  { f0: 27, f1: 60, dx: 364, dy: -21, k: 1.42, warp: 0.9 },
  // ease back to hold the column and the model
  { f0: 52, f1: 96, dx: 271, dy: 0, k: 1.32 },
  // pull back to the WIDE, travelling left with the bracket
  { f0: 99, f1: 131, dx: WIDE_X - 135, dy: -2, k: WIDE_K },
  // the held breath: a very slight drift in
  { f0: 124, f1: 160, k: 1.235, dy: 2 },
];
export const TRACK = mCameraTrack(CAM_START, GLIDES, -16, DURATION + 4);
export const camAt = TRACK.camAt;
export const REST_CAM = TRACK.cams[DURATION - 1 + 16];
