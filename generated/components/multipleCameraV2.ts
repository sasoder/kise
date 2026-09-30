// RussiaAMultipleV2: the icon ledger's layout, row timeline and camera. The
// map half (opening, pull-back, the wide, TERRITORY x54, the feather) is V1's,
// imported unchanged from multipleCamera.ts; only what happens below x54
// differs. Pure maths, no React.
import {
  DURATION,
  FEATHER,
  FPS,
  F_WIDE,
  HEIGHT,
  K_WIDE,
  NUM_SIZE,
  PB,
  ROW_LABEL,
  TERR_BASE,
  TERR_SIZE,
  W,
  WIDTH,
  X54_BASE,
  X54_SIZE,
  anchorCam,
  levelDrawn,
  levelOps,
  pchip,
  pullG,
} from "./multipleCamera";
import { ICON_H } from "./multipleIcons";

export {
  DURATION,
  FEATHER,
  FPS,
  F_WIDE,
  HEIGHT,
  NUM_SIZE,
  PB,
  ROW_LABEL,
  TERR_BASE,
  TERR_SIZE,
  W,
  WIDTH,
  X54_BASE,
  X54_SIZE,
  anchorCam,
  levelDrawn,
  levelOps,
  pullG,
};

// ---------------------------------------------------------------------------
// THE ICON LEDGER (world px). Each row: its label (IM Fell SC 42) hugging the
// icons 12 px below its baseline, one 100-tall icon row, ~25 px of air above
// the next label.
// ---------------------------------------------------------------------------
export const ICON_GAP_ABOVE = 12; // label baseline -> icon cap line
export const ROW0_BASE = X54_BASE + 68;
export const ROW_PITCH = 166;
export const rowBase = (i: number) => ROW0_BASE + i * ROW_PITCH;
export const iconTop = (i: number) => rowBase(i) + ICON_GAP_ABOVE;
export const iconMid = (i: number) => iconTop(i) + ICON_H / 2;
export const numeralBaseV2 = (i: number) => iconMid(i) + 0.3 * NUM_SIZE;
export const LEDGER_TOP = TERR_BASE - 31;
export const LEDGER_BOTTOM = iconTop(4) + ICON_H + 4;

// ---------------------------------------------------------------------------
// THE ROW TIMELINE. Label slides up 8 f before its word; on the word Japan's
// orange icon inks on (24 px slide-up + fade, 8 f); from word + 4 Russia's
// icons stamp in left -> right, one every CADENCE frames, each an 8 f slide-up
// + fade (neighbours overlap); the partial icon comes last; the numeral slides
// in as it lands.
// ---------------------------------------------------------------------------
export const STAMP_F = 8;
export const CADENCE = 4;
export const RATIOS = [135.7 / 43.8, 47.5 / 13.0, 31.8 / 7.6, 1162 / 234, 383 / 187];
// ISOTYPE ROUNDING (Neurath): the icons show each ratio to the nearest HALF
// icon, and the numeral matches the icons exactly (x3, x3½, x4, x5, x2).
export const ICON_COUNTS = RATIOS.map((r) => Math.round(r * 2) / 2);
const WORD_OF_ROW = [W.population, W.industrial, W.resource, W.size1, W.size2];
export type RowTime = { label: number; jp: number; ru0: number; n: number; land: number };
export const ROWS_T: RowTime[] = ICON_COUNTS.map((c, i) => {
  const n = Math.ceil(c - 1e-9); // Russia's icons incl. a half one
  const word = WORD_OF_ROW[i];
  const ru0 = word + 4;
  return { label: word - 8, jp: word, ru0, n, land: ru0 + (n - 1) * CADENCE + STAMP_F };
});

// ---------------------------------------------------------------------------
// THE CAMERA: V1's pull-back to the same wide (anchorCam), then cy and ln k
// offsets through monotone-cubic keys (C1, no overshoot), started before the
// pull-back lands so no channel rests. The glide follows the newest row so
// each arrives in the lower-middle band; the final framing holds TERRITORY x54
// and all five rows between y ~245 and ~1114 (the block's centre ~y 680).
// ---------------------------------------------------------------------------
const C_Y = HEIGHT / 2;
export const K_FINAL = 0.92;
export const CY_FINAL = LEDGER_BOTTOM - (1114 - C_Y) / K_FINAL;
export const K_KEYS: [number, number][] = [
  [98, K_WIDE],
  [140, K_WIDE * 1.03],
  [176, 0.95],
  [214, 0.955],
  [244, K_FINAL],
  [310, K_FINAL * 1.045],
];
const LNK_OFF = pchip(K_KEYS.map(([f, k]) => [f, Math.log(k / K_WIDE)] as [number, number]));
const kAt = (f: number) => anchorCam(Math.min(f, F_WIDE)).k * Math.exp(LNK_OFF(f));
const CY_WIDE = anchorCam(F_WIDE).cy;
const D_FINAL = CY_FINAL - CY_WIDE;
// follow keys: row i's icon middle on screen y FOLLOW_Y[i] on its word, as
// Japan's icon stamps in (the lower-middle band)
// (navy has no follow key: the glide is already easing onto the final framing)
const FOLLOW_Y = [1035, 1025, 1015, 1015];
const followKeys = ROWS_T.slice(0, 4).map((t, i): [number, number] => {
  const f = t.jp;
  return [f, Math.min(D_FINAL - 110, iconMid(i) - (FOLLOW_Y[i] - C_Y) / kAt(f) - CY_WIDE)];
});
export const CY_KEYS: [number, number][] = [[98, 0], [114, 18], ...followKeys, [236, D_FINAL - 16], [274, D_FINAL], [310, D_FINAL + 14]];
// keep the keys monotone (the glide only ever travels south)
for (let i = 1; i < CY_KEYS.length; i++) CY_KEYS[i][1] = Math.max(CY_KEYS[i][1], CY_KEYS[i - 1][1] + 1);
const CY_OFF = pchip(CY_KEYS);
export const camAt = (f: number) => {
  const a = anchorCam(Math.min(f, F_WIDE));
  return { k: a.k * Math.exp(LNK_OFF(f)), cx: a.cx, cy: a.cy + CY_OFF(f) };
};
export const CAM_TRACK = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));
