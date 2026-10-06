import {
  H,
  INK_HI,
  INK_LO,
  TILE_H,
  TILE_PITCH_X,
  TILE_PITCH_Y,
  TILE_W,
  W,
  easeInCubic,
  easeOutCubic,
  evenEase,
  hash01,
  huntPath,
  lerp,
  mCamJerk,
  mCameraTrack,
  mLookOf,
  mStrokePx,
  mToScreen,
  rungAt,
  smoothstep,
} from "./mavenShared";
import type { Cam, Glide, Pt } from "./mavenShared";
import { END_CAM, GRID_Y0, HUNT_SEED, STATIONS, bracketSize, huntOffset, tileX, tileY } from "./dataItselfGeom";

// ---------------------------------------------------------------------------
// noRelevantTargetsGeom — the world, clocks and camera of cut B. It continues
// cut A's world: A's 9 x 4 grid is the top-left of the 20 x 9 field. No React.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 194;

// --- the field ------------------------------------------------------------------
export const COLS = 20;
export const ROWS = 9;
export const A_COLS = 9;
export const A_ROWS = 4;
export const FIELD_X0 = tileX(0) - TILE_W / 2;
export const FIELD_X1 = tileX(COLS - 1) + TILE_W / 2;
export const FIELD_Y0 = GRID_Y0;
export const FIELD_Y1 = tileY(ROWS - 1) + TILE_H / 2;
export const FIELD_CX = (FIELD_X0 + FIELD_X1) / 2;
export const FIELD_CY = (FIELD_Y0 + FIELD_Y1) / 2;

// --- the model and the operations frame ----------------------------------------
export const MODEL_R = 170;
export const MODEL_Y = FIELD_CY;
export const MODEL_X0 = FIELD_X1 + 370;
export const OPS_W = 760;
export const OPS_H = OPS_W * 0.75;
export const OPS_X = 3600;
export const OPS_Y = FIELD_CY;
export const OPS_SEED = 4242;
/** the real target, and the empty terrain the model commits to (fractions of the frame) */
export const OPS_TARGET = { tx: 0.76, ty: 0.29 };
export const OPS_WRONG = { tx: 0.37, ty: 0.63 };
export const MODEL_X1 = OPS_X - OPS_W / 2 - 45 - MODEL_R;
export const MODEL_GO_F0 = 90;
export const MODEL_GO_F1 = 111;
export const modelX = (S: number) => lerp(MODEL_X0, MODEL_X1, smoothstep((S - MODEL_GO_F0) / (MODEL_GO_F1 - MODEL_GO_F0)));
export const MODEL_APPEAR_F0 = 66;
export const MODEL_WORD_F = 79;
export const OPS_WORD_F = 160;
export const TARGETS_WORD_F = 57;

// --- the camera ------------------------------------------------------------------
const START = mLookOf(END_CAM);
export const K_FIELD = 0.43;
export const K_END = 0.93;
const END_LOOK_X = OPS_X - 105 / K_END;
/** glide 2 ends looking at the model */
const G2_DX = MODEL_X0 - FIELD_CX;
const GLIDES: Glide[] = [
  // "getting a ton of data": the pull-out goes on; the field grows right and down
  { f0: -10, f1: 40, dx: FIELD_CX - START.x, dy: FIELD_CY - START.y, k: K_FIELD, warp: 0.85 },
  // "your models": glide right along the field to the model
  { f0: 51, f1: 95, dx: G2_DX, k: 0.6 },
  // "weren't as performant": follow the model into operations, pushing in
  { f0: 85, f1: 140, dx: END_LOOK_X - (FIELD_CX + G2_DX), k: K_END },
  // the hold: a slow creep in that decays into the last frame
  { f0: 126, f1: 216, dx: 16, k: 1.0 },
];
const CAM_F0 = -18;
export const TRACK = mCameraTrack(START, GLIDES, CAM_F0, DURATION + 2);
export const camAt = TRACK.camAt;
export const REST_CAM: Cam = TRACK.last;
export const camReport = () => mCamJerk(camAt, 0, DURATION - 1);

// --- the pour: new tiles slide into their slots in a wave from the old grid ---------
export const POUR_F = 11;
export const isOld = (col: number, row: number) => col < A_COLS && row < A_ROWS;
/** where a new tile comes from, relative to its slot (lanes from the right / below-right) */
export const pourFrom = (col: number, row: number): Pt =>
  row < A_ROWS
    ? { x: (1.5 + hash01(col, row + 40) * 0.5) * TILE_PITCH_X, y: 0 }
    : { x: (1.25 + hash01(col, row + 40) * 0.5) * TILE_PITCH_X, y: (0.55 + hash01(col + 9, row) * 0.4) * TILE_PITCH_Y };
const POUR_START: number[][] = [];
for (let col = 0; col < COLS; col++) {
  POUR_START.push([]);
  for (let row = 0; row < ROWS; row++) {
    if (isOld(col, row)) {
      POUR_START[col].push(-99);
      continue;
    }
    const d = (0.62 * Math.max(0, col - (A_COLS - 1))) / (COLS - A_COLS) + (0.72 * Math.max(0, row - (A_ROWS - 1))) / (ROWS - A_ROWS) + (row >= A_ROWS ? 0.012 * col : 0);
    let t = 1 + 25 * Math.pow(Math.min(1, d / 1.34), 0.8) + hash01(col * 3 + 1, row * 5 + 2) * 2.2;
    // never while its slot (or where it starts from) is still down in the caption band
    const from = pourFrom(col, row);
    const yb = tileY(row) + TILE_H / 2 + from.y;
    while (t < 60 && mToScreen(camAt(t), 0, yb).y > 782) t += 1;
    POUR_START[col].push(t);
  }
}
export const pourStart = (col: number, row: number) => POUR_START[col][row];
/** raw arrival progress of tile (col, row) (>= 1 = in its slot; old tiles are always in) */
export const pourU = (col: number, row: number, S: number) => (isOld(col, row) ? 1 : (S - POUR_START[col][row]) / POUR_F);

// --- the eye: bracket -> scan line -> bracket in the model -> out on the frame -------
export const LINE_X0 = FIELD_X0 - 44;
export const LINE_PAD = 34;
export const LINE_H = FIELD_Y1 - FIELD_Y0 + 2 * LINE_PAD;
export const MORPH_F0 = 12;
export const SCAN_F0 = 30;
export const SCAN_F1 = 75;
export const FOLD_F0 = 63;
export const EYE_HOME = MODEL_R * 0.78;
/** the scan line's world x (one trapezoid from the field's left edge to the model) */
export const lineX = (S: number) => lerp(LINE_X0, MODEL_X0, evenEase((S - SCAN_F0) / (SCAN_F1 - SCAN_F0), 0.16));
/** the frame at which the line's x reaches world x */
export const lineReachF = (x: number) => {
  if (x <= LINE_X0) return SCAN_F0;
  let lo = SCAN_F0;
  let hi = SCAN_F1;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (lineX(m) < x) lo = m;
    else hi = m;
  }
  return hi;
};
const COL_REACH: number[] = [];
for (let col = 0; col < COLS; col++) COL_REACH.push(lineReachF(tileX(col) - TILE_W * 0.3));
export const OUT_F0 = 101;
export const OUT_F1 = 114;
export const COMMIT_F0 = 111;
export const COMMIT_F1 = 124;
export const MISS_F0 = 120;
export const MISS_F1 = 138;
export const EYE_OUT = 214;
export const EYE_COMMIT = 176;
const opsPt = (p: { tx: number; ty: number }): Pt => ({ x: OPS_X + (p.tx - 0.5) * OPS_W, y: OPS_Y + (p.ty - 0.5) * OPS_H });
export const OPS_TARGET_PT = opsPt(OPS_TARGET);
export const OPS_WRONG_PT = opsPt(OPS_WRONG);
const OPS_HUNT_PT = opsPt({ tx: 0.41, ty: 0.44 });

export type Eye = { x: number; y: number; w: number; h: number; line: number; glow: number };
/** The model's eye at S (world): a box w x h about (x, y); `line` 0 = a bracket,
 *  1 = the scan line; `glow` = the soft leading edge of the sweep. */
export const eyeAt = (S: number, k: number): Eye => {
  if (S < SCAN_F0) {
    const m = smoothstep((S - MORPH_F0) / (SCAN_F0 - MORPH_F0));
    const size = bracketSize(Math.max(k, 0.8));
    const st = STATIONS[STATIONS.length - 1];
    const o = huntOffset(S + 113, size);
    return {
      x: lerp(tileX(st.col) + o.x, LINE_X0, m),
      y: lerp(tileY(st.row) + o.y, FIELD_CY, m),
      w: size * (1 - m),
      h: lerp(size, LINE_H, m),
      line: m,
      glow: 0,
    };
  }
  if (S < SCAN_F1 + 1) {
    const m = smoothstep((S - FOLD_F0) / (SCAN_F1 + 1 - FOLD_F0));
    return { x: lineX(S), y: FIELD_CY, w: EYE_HOME * m, h: lerp(LINE_H, EYE_HOME, m), line: 1 - m, glow: smoothstep((S - SCAN_F0) / 5) * (1 - smoothstep((S - FOLD_F0 + 4) / 8)) };
  }
  // home in the model, then out over the operations frame
  const out = smoothstep((S - OUT_F0) / (OUT_F1 - OUT_F0));
  const commit = smoothstep((S - COMMIT_F0) / (COMMIT_F1 - COMMIT_F0));
  const mx = modelX(S);
  const bx = lerp(lerp(mx, OPS_HUNT_PT.x, out), OPS_WRONG_PT.x, commit);
  const by = lerp(lerp(MODEL_Y, OPS_HUNT_PT.y, out), OPS_WRONG_PT.y, commit);
  const env = smoothstep((S - OUT_F0 - 2) / 9) * lerp(1, 0.24, smoothstep((S - COMMIT_F0 - 1) / 15));
  const hp = huntPath(HUNT_SEED + 4, S * 0.85);
  const size = lerp(lerp(EYE_HOME, EYE_OUT, out), EYE_COMMIT, commit);
  return { x: bx + hp.x * 92 * env, y: by + hp.y * 74 * env, w: size, h: size, line: 0, glow: 0 };
};
/** the real target eases RED -> RED_DEEP as the bracket commits elsewhere */
export const missAt = (S: number) => smoothstep((S - MISS_F0) / (MISS_F1 - MISS_F0));

// --- tile ink: searched frames, then everything the line has passed ------------------
export const tileRungB = (col: number, row: number, S: number) => {
  for (let i = 0; i < STATIONS.length; i++) {
    if (STATIONS[i].col === col && STATIONS[i].row === row) return i < STATIONS.length - 1 ? INK_LO : rungAt(S, MORPH_F0 + 2, INK_HI, INK_LO);
  }
  return rungAt(S, COL_REACH[col] - 2, INK_HI, INK_LO);
};

// --- the drain: the nearest tiles stream into the model, the rest dissolve in place ---
export const DRAIN_F0 = 67;
export const DRAIN_STEP = 1.2;
export const DISSOLVE_F = 13;
export const drainStart = (col: number, row: number) => DRAIN_F0 + (COLS - 1 - col) * DRAIN_STEP + hash01(col * 11 + 5, row * 17 + 3) * 3;
export const FLY_COLS = 5;
export const isFlier = (col: number, row: number) => col >= COLS - FLY_COLS && hash01(col * 23 + 7, row * 29 + 11) < 0.52;
export const flyDur = (col: number, row: number) => 11 + Math.hypot(MODEL_X0 - tileX(col), MODEL_Y - tileY(row)) / 95;
export type Flight = { x: number; y: number; scale: number; opacity: number };
export const flightAt = (col: number, row: number, S: number): Flight | null => {
  const u = (S - drainStart(col, row)) / flyDur(col, row);
  if (u >= 1) return null;
  const x0 = tileX(col);
  const y0 = tileY(row);
  if (u <= 0) return { x: x0, y: y0, scale: 1, opacity: 1 };
  const e = smoothstep(u);
  const x1 = modelX(S);
  const y1 = MODEL_Y;
  // an individual arc: a control point pushed off the chord, toward the model's axis
  const bow = (hash01(col + 61, row + 67) - 0.5) * 150;
  const cx = lerp(x0, x1, 0.55);
  const cy = lerp(y0, y1, 0.82) + bow;
  const a = (1 - e) * (1 - e);
  const b = 2 * (1 - e) * e;
  const c = e * e;
  return { x: a * x0 + b * cx + c * x1, y: a * y0 + b * cy + c * y1, scale: lerp(1, 0.3, easeInCubic(u) * 0.6 + u * 0.4), opacity: 1 - smoothstep((u - 0.78) / 0.22) };
};
/** raw dissolve progress of a tile that stays (and its lean toward the model, world px) */
export const dissolveAt = (col: number, row: number, S: number) => {
  const u = (S - drainStart(col, row)) / DISSOLVE_F;
  return { u, lean: 46 * easeOutCubic(u) };
};
export const FILL_F0 = 76;
export const FILL_F1 = 99;
export const fillAt = (S: number) => smoothstep((S - FILL_F0) / (FILL_F1 - FILL_F0));

// --- strokes ---------------------------------------------------------------------------
export const fieldStrokePx = (k: number) => mStrokePx(TILE_W * k);
export const bigStrokePx = (k: number) => Math.min(5.6, mStrokePx(OPS_W * k));
/** the eye's stroke: the field's weight in A's picture, the big weight once it is the model's */
export const eyeStrokePx = (S: number, k: number) => lerp(Math.max(2.9, fieldStrokePx(k)), bigStrokePx(k), smoothstep((S - 24) / 44));

// --- measurement: the lowest subject ink on screen (px, sway included) at S ----------------
export const lowestInkY = (S: number) => {
  const c = camAt(S);
  let y = 0;
  const put = (wy: number) => {
    y = Math.max(y, mToScreen(c, 0, wy).y + 5);
  };
  const onX = (wx: number) => {
    const sx = mToScreen(c, wx, 0).x;
    return sx > -80 && sx < W + 80;
  };
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const p = pourU(col, row, S);
      if (p <= 0 || !onX(tileX(col))) continue;
      const from = pourFrom(col, row);
      const gone = isFlier(col, row) ? flightAt(col, row, S) === null : dissolveAt(col, row, S).u >= 1;
      if (gone) continue;
      put(tileY(row) + TILE_H / 2 + (isOld(col, row) ? 0 : from.y * (1 - easeOutCubic(p))));
    }
  }
  const e = eyeAt(S, c.k);
  if (onX(e.x)) put(e.y + e.h / 2);
  if (S > MODEL_APPEAR_F0 && onX(modelX(S))) put(MODEL_Y + MODEL_R);
  if (onX(OPS_X - OPS_W / 2) || onX(OPS_X + OPS_W / 2)) put(OPS_Y + OPS_H / 2);
  return Math.min(y, H + 99);
};
