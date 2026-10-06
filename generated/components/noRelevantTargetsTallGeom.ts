import { FRAME_H, FRAME_W, camEase, toScreen } from "./chinatalkShared";
import type { Cam, Glide } from "./chinatalkShared";
import { INK_HI, INK_LO, TILE_H, TILE_PITCH_X, TILE_PITCH_Y, TILE_W, easeInCubic, easeOutCubic, evenEase, hash01, huntPath, lerp, mStrokePx, rungAt, smoothstep } from "./mavenShared";
import type { Pt } from "./mavenShared";
import { END_CAM, HUNT_SEED, SCREEN_CY, STATIONS, bracketSize, huntOffset, lookOfTall, tallCamJerk, tallTrack, tileX as aTileX, tileY as aTileY } from "./dataItselfTallGeom";

// ---------------------------------------------------------------------------
// noRelevantTargetsTallGeom — cut B, 9:16: a journey DOWN the frame. It
// continues cut A's world: A's 5 x 7 grid is the bottom-centre block of the
// 11 x 15 field (A col = col - 3, A row = row - 8). No React.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 194;

// --- the field -------------------------------------------------------------------
export const COLS = 11;
export const ROWS = 15;
export const A_COL0 = 3;
export const A_ROW0 = 8;
export const tileX = (col: number) => aTileX(col - A_COL0);
export const tileY = (row: number) => aTileY(row - A_ROW0);
export const isOld = (col: number, row: number) => col >= A_COL0 && col < A_COL0 + 5 && row >= A_ROW0;
export const FIELD_X0 = tileX(0) - TILE_W / 2;
export const FIELD_X1 = tileX(COLS - 1) + TILE_W / 2;
export const FIELD_Y0 = tileY(0) - TILE_H / 2;
export const FIELD_Y1 = tileY(ROWS - 1) + TILE_H / 2;
export const FIELD_CY = (FIELD_Y0 + FIELD_Y1) / 2;
export const A_Y0 = tileY(A_ROW0) - TILE_H / 2;

// --- framing ------------------------------------------------------------------------
/** the wide: the field 859 px wide, top at y 240, foot at y ~1151; the model fits under it */
export const K_FIELD = 0.54;
const FIELD_LOOK_Y = FIELD_CY + (SCREEN_CY - (240 + ((FIELD_Y1 - FIELD_Y0) * K_FIELD) / 2)) / K_FIELD;

// --- the model and the operations frame ---------------------------------------------
export const MODEL_R = 160;
export const MODEL_X0 = 0;
export const MODEL_Y0 = FIELD_Y1 + 50 / K_FIELD + MODEL_R;
export const K_END = 0.63;
export const OPS_W = 1400;
export const OPS_H = OPS_W * 0.75;
export const OPS_X = 0;
export const OPS_TOP = 1850;
export const OPS_Y = OPS_TOP + OPS_H / 2;
export const OPS_SEED = 4242;
export const OPS_TARGET = { tx: 0.76, ty: 0.29 };
export const OPS_WRONG = { tx: 0.34, ty: 0.66 };
/** the model ends small, just above the frame's top-left corner */
export const MODEL_X1 = OPS_X - OPS_W / 2 + 150;
export const MODEL_Y1 = OPS_TOP - 150 / K_END - MODEL_R;
export const MODEL_GO_F0 = 89;
export const MODEL_GO_F1 = 119;
export const modelAt = (S: number): Pt => {
  const e = smoothstep((S - MODEL_GO_F0) / (MODEL_GO_F1 - MODEL_GO_F0));
  // down first, then across: the sideways part lags the descent a little
  const ex = smoothstep((S - MODEL_GO_F0 - 5) / (MODEL_GO_F1 - MODEL_GO_F0 - 5));
  return { x: lerp(MODEL_X0, MODEL_X1, ex), y: lerp(MODEL_Y0, MODEL_Y1, e) };
};
export const MODEL_APPEAR_F0 = 69;
export const MODEL_WORD_F = 79;
export const OPS_WORD_F = 160;
export const TARGETS_WORD_F = 57;

// --- the camera -------------------------------------------------------------------------
const START = lookOfTall(END_CAM);
/** the operations frame's centre sits at screen y 940 in the end framing */
const END_LOOK_Y = OPS_Y - (940 - SCREEN_CY) / K_END;
/** the close framing on the model: k such that it is ~300 px across */
export const K_MODEL = 0.94;
const G2_Y = MODEL_Y0 + 60;
/** riding down: the model up-left of centre, the frame's top edge and seal coming up under it */
const RIDE_X = MODEL_X1 + 230;
const RIDE_Y = MODEL_Y1 + 240;
const GLIDES: Glide[] = [
  // "getting a ton of data": the pull-out goes on; the field grows up and out
  { f0: -10, f1: 40, dx: -START.x, dy: FIELD_LOOK_Y - START.y, k: K_FIELD, warp: 0.85 },
  // "your models": down to the field's foot and IN on the model as its rings write
  { f0: 54, f1: 93, dy: G2_Y - FIELD_LOOK_Y, k: K_MODEL },
  // "weren't as performant": ride down with the model at that closeness
  { f0: 83, f1: 123, dx: RIDE_X, dy: RIDE_Y - G2_Y, k: 0.86 },
  // ease back out to the operations frame as the bracket comes out and hunts
  { f0: 106, f1: 142, dx: -RIDE_X, dy: END_LOOK_Y - RIDE_Y, k: K_END },
  // the hold: a slow creep in that decays into the last frame
  { f0: 132, f1: 216, dy: 10, k: 0.655 },
];
export const camTargetAt = (f: number): Cam => {
  let x = START.x;
  let y = START.y;
  let lk = Math.log(START.k);
  let kPrev = START.k;
  for (const g of GLIDES) {
    const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
    x += (g.dx ?? 0) * e;
    y += (g.dy ?? 0) * e;
    if (g.k !== undefined) {
      lk += (Math.log(g.k) - Math.log(kPrev)) * e;
      kPrev = g.k;
    }
  }
  return { x, y, k: Math.exp(lk) };
};
const TRACK = tallTrack(camTargetAt, -18, DURATION + 2);
export const camAt = TRACK.camAt;
export const REST_CAM: Cam = TRACK.last;
export const camReport = () => tallCamJerk(camAt, 0, DURATION - 1);

// --- the pour: new tiles slide into their slots from above and from the sides ------------
export const POUR_F = 11;
export const pourFrom = (col: number, row: number): Pt => {
  const side = col < A_COL0 ? -1 : col >= A_COL0 + 5 ? 1 : 0;
  const above = row < A_ROW0;
  return {
    x: side * (above ? 0.7 : 1.5 + hash01(col, row + 40) * 0.4) * TILE_PITCH_X,
    y: above ? -(1.3 + hash01(col + 9, row) * 0.5) * TILE_PITCH_Y : 0,
  };
};
const POUR_START: number[][] = [];
for (let col = 0; col < COLS; col++) {
  POUR_START.push([]);
  for (let row = 0; row < ROWS; row++) {
    if (isOld(col, row)) {
      POUR_START[col].push(-99);
      continue;
    }
    const sideD = Math.max(0, A_COL0 - col, col - (A_COL0 + 4)) / 3;
    const upD = Math.max(0, A_ROW0 - row) / A_ROW0;
    const t = 1 + 26 * Math.pow(Math.min(1, (0.42 * sideD + 0.9 * upD) / 1.2), 0.85) + hash01(col * 3 + 1, row * 5 + 2) * 2.2;
    POUR_START[col].push(t);
  }
}
export const pourStart = (col: number, row: number) => POUR_START[col][row];
export const pourU = (col: number, row: number, S: number) => (isOld(col, row) ? 1 : (S - POUR_START[col][row]) / POUR_F);
/** the top of the field as it grows (DATA rides above it) */
export const fieldTopAt = (S: number) => lerp(A_Y0, FIELD_Y0, smoothstep((S + 8) / 30));

// --- the eye: bracket -> horizontal scan line -> bracket in the model -> out on the frame ---
export const LINE_Y0 = FIELD_Y0 - 44;
export const LINE_W = FIELD_X1 - FIELD_X0 + 68;
export const MORPH_F0 = -4;
export const SCAN_F0 = 36;
export const SCAN_F1 = 75;
export const SHORTEN_F0 = 62;
export const SHORTEN_F1 = 72;
export const OPEN_F0 = 69;
export const OPEN_F1 = 79;
export const EYE_HOME = MODEL_R * 0.78;
export const lineY = (S: number) => lerp(LINE_Y0, MODEL_Y0, evenEase((S - SCAN_F0) / (SCAN_F1 - SCAN_F0), 0.16));
const lineReachF = (y: number) => {
  let lo = SCAN_F0;
  let hi = SCAN_F1;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (lineY(m) < y) lo = m;
    else hi = m;
  }
  return hi;
};
const ROW_REACH: number[] = [];
for (let row = 0; row < ROWS; row++) ROW_REACH.push(lineReachF(tileY(row) - TILE_H * 0.3));
export const OUT_F0 = 102;
export const OUT_F1 = 126;
export const COMMIT_F0 = 118;
export const COMMIT_F1 = 132;
export const MISS_F0 = 126;
export const MISS_F1 = 144;
export const EYE_OUT = 350;
export const EYE_COMMIT = 290;
const opsPt = (p: { tx: number; ty: number }): Pt => ({ x: OPS_X + (p.tx - 0.5) * OPS_W, y: OPS_Y + (p.ty - 0.5) * OPS_H });
export const OPS_TARGET_PT = opsPt(OPS_TARGET);
export const OPS_WRONG_PT = opsPt(OPS_WRONG);
const OPS_HUNT_PT = opsPt({ tx: 0.37, ty: 0.32 });

/** The eye (world): a box w x h about (x, y). `line` 1 = the horizontal scan
 *  line (h = 0, the horizontal arms meet); `armH` = the horizontal arm as a
 *  fraction of w (0.22 = a bracket's corner, 0.5 = arms meeting). */
export type Eye = { x: number; y: number; w: number; h: number; armH: number; line: number; glow: number };
export const eyeAt = (S: number, k: number): Eye => {
  if (S < SCAN_F0) {
    const m = evenEase((S - MORPH_F0) / (SCAN_F0 - MORPH_F0), 0.22);
    const size = bracketSize(Math.max(k, 0.9));
    const st = STATIONS[STATIONS.length - 1];
    const o = huntOffset(S + 113, size);
    return { x: lerp(aTileX(st.col) + o.x, 0, m), y: lerp(aTileY(st.row) + o.y, LINE_Y0, m), w: lerp(size, LINE_W, m), h: size * (1 - m), armH: lerp(0.22, 0.505, smoothstep(m)), line: m, glow: 0 };
  }
  if (S < OPEN_F1) {
    // the line shortens to the bracket's width first, then opens into its corners
    const a = smoothstep((S - SHORTEN_F0) / (SHORTEN_F1 - SHORTEN_F0));
    const b = smoothstep((S - OPEN_F0) / (OPEN_F1 - OPEN_F0));
    return { x: 0, y: lineY(S), w: lerp(LINE_W, EYE_HOME, a), h: EYE_HOME * b, armH: lerp(0.505, 0.22, b), line: 1 - b, glow: smoothstep((S - SCAN_F0) / 5) * (1 - a) };
  }
  const out = smoothstep((S - OUT_F0) / (OUT_F1 - OUT_F0));
  const commit = smoothstep((S - COMMIT_F0) / (COMMIT_F1 - COMMIT_F0));
  const m = modelAt(S);
  const bx = lerp(lerp(m.x, OPS_HUNT_PT.x, out), OPS_WRONG_PT.x, commit);
  const by = lerp(lerp(m.y, OPS_HUNT_PT.y, out), OPS_WRONG_PT.y, commit);
  const env = smoothstep((S - OUT_F0 - 6) / 14) * lerp(1, 0.24, smoothstep((S - COMMIT_F0 - 1) / 15));
  const hp = huntPath(HUNT_SEED + 4, S * 0.85);
  const size = lerp(lerp(EYE_HOME, EYE_OUT, out), EYE_COMMIT, commit);
  return { x: bx + hp.x * 140 * env, y: by + hp.y * 105 * env, w: size, h: size, armH: 0.22, line: 0, glow: 0 };
};
export const missAt = (S: number) => smoothstep((S - MISS_F0) / (MISS_F1 - MISS_F0));

// --- tile ink ------------------------------------------------------------------------------
export const tileRungB = (col: number, row: number, S: number) => {
  for (let i = 0; i < STATIONS.length; i++) {
    if (STATIONS[i].col === col - A_COL0 && STATIONS[i].row === row - A_ROW0) return i < STATIONS.length - 1 ? INK_LO : rungAt(S, MORPH_F0 + 2, INK_HI, INK_LO);
  }
  return rungAt(S, ROW_REACH[row] - 2, INK_HI, INK_LO);
};

// --- the drain: the nearest rows stream down into the model, the rest dissolve in place ------
export const DRAIN_F0 = 68;
export const DRAIN_STEP = 1.45;
export const DISSOLVE_F = 13;
export const drainStart = (col: number, row: number) => DRAIN_F0 + (ROWS - 1 - row) * DRAIN_STEP + hash01(col * 11 + 5, row * 17 + 3) * 3;
export const FLY_ROWS = 4;
export const isFlier = (col: number, row: number) => row >= ROWS - FLY_ROWS && hash01(col * 23 + 7, row * 29 + 11) < 0.55;
export const flyDur = (col: number, row: number) => 13 + Math.hypot(MODEL_X0 - tileX(col), MODEL_Y0 - tileY(row)) / 62;
export type Flight = { x: number; y: number; scale: number; opacity: number };
export const flightAt = (col: number, row: number, S: number): Flight | null => {
  const u = (S - drainStart(col, row)) / flyDur(col, row);
  if (u >= 1) return null;
  const x0 = tileX(col);
  const y0 = tileY(row);
  if (u <= 0) return { x: x0, y: y0, scale: 1, opacity: 1 };
  const e = smoothstep(u);
  const m = modelAt(S);
  // an individual arc: first inward toward the model's axis, then down into it
  const bow = (hash01(col + 61, row + 67) - 0.5) * 150;
  const cx = lerp(x0, m.x, 0.82) + bow;
  const cy = lerp(y0, m.y, 0.5);
  const a = (1 - e) * (1 - e);
  const b = 2 * (1 - e) * e;
  const c = e * e;
  return { x: a * x0 + b * cx + c * m.x, y: a * y0 + b * cy + c * m.y, scale: lerp(1, 0.3, easeInCubic(u) * 0.6 + u * 0.4), opacity: 1 - smoothstep((u - 0.78) / 0.22) };
};
export const dissolveAt = (col: number, row: number, S: number) => {
  const u = (S - drainStart(col, row)) / DISSOLVE_F;
  return { u, lean: 46 * easeOutCubic(u) };
};
export const fillAt = (S: number) => smoothstep((S - 78) / 25);

// --- strokes ----------------------------------------------------------------------------------
export const fieldStrokePx = (k: number) => Math.max(2.2, mStrokePx(TILE_W * k));
export const bigStrokePx = (k: number) => Math.min(5.6, mStrokePx(OPS_W * k));
export const eyeStrokePx = (S: number, k: number) => lerp(Math.max(3.2, fieldStrokePx(k)), bigStrokePx(k), smoothstep((S - 20) / 44));

// --- measurement: lowest subject ink on screen (px, sway included) ---------------------------
export const lowestInkY = (S: number) => {
  const c = camAt(S);
  let y = 0;
  const put = (wx: number, wy: number) => {
    const p = toScreen(c, wx, wy);
    if (p.x > -60 && p.x < FRAME_W + 60 && p.y < FRAME_H + 400) y = Math.max(y, p.y + 5);
  };
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (pourU(col, row, S) <= 0) continue;
      const gone = isFlier(col, row) ? flightAt(col, row, S) === null : dissolveAt(col, row, S).u >= 1;
      if (!gone) put(tileX(col), tileY(row) + TILE_H / 2);
    }
  }
  const e = eyeAt(S, c.k);
  put(e.x, e.y + e.h / 2);
  if (S > MODEL_APPEAR_F0) {
    const m = modelAt(S);
    put(m.x, m.y + MODEL_R);
  }
  return y;
};
/** the same, counting the operations frame's visible bottom edge too */
export const opsBottomY = (S: number) => toScreen(camAt(S), 0, OPS_Y + OPS_H / 2).y + 5;
export const opsTopY = (S: number) => toScreen(camAt(S), 0, OPS_TOP).y;
