import {
  DOT_R,
  FRAME_H,
  FRAME_W,
  K_REF,
  TICK_HALF,
  VALUE_PX,
  WORD_PX,
  camFromTrack,
  cumLen,
  glideTargetAt,
  labelCapH,
  labelPx,
  labelWidth,
  lookOf,
  pointAtLen,
  runFollower,
  sz,
} from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";
import { REFERENCE_PCT, SCALE_PCT, START_MONTH, START_YEAR, YOUTH_UNEMPLOYMENT as DATA } from "./youthUnemploymentData";

// ---------------------------------------------------------------------------
// youthUnemploymentGeom -- the world, the clocks and the camera of
// YouthUnemploymentTwentyPlus (Jordan Schneider, "Hu Jintao's 25 million jobs",
// graphic A). Pure maths, no React, so it can be checked from a script
// (out/jordan-hu/A/check.ts). World px, y grows down; the baseline (0 %) is
// y = 0 and January 2018 is x = 0. S is the cut's local frame (edit frame - IN).
// The world is authored FROM the END frame: its screen targets and its camera k
// (K_END) fix the world px per month and per point.
// EVERYTHING here is derived from the data array: the path, the summer peaks
// the tip is keyed on, the kiss, the crossing, the readout values, the room
// the title line has. Only the FRAMES of the keys come from the spoken words.
// ---------------------------------------------------------------------------

export const FPS = 24;
/** edit frame of the cut (17.583 s) */
export const IN = 422;
/** OUT 563 - IN 422: the slot exactly */
export const DURATION = 141;

// --- the END frame, in screen px (the director's targets) -----------------------
// Jan 2018 at x LEFT_SX, the last month at x TIP_SX; the 10 % hairline at
// y SCALE_SY and PCT_SPX screen px per percentage point, so the baseline (0 %)
// sits at y 1500 (below the caption strip), the series low (9.6) at ~1058 (just
// above it), the dashed 20 % line at 580 and the 21.3 tip at ~520.
export const LEFT_SX = 76;
export const TIP_SX = 962;
export const SCALE_SY = 1040;
export const PCT_SPX = 46;
/** the camera k of the END frame. It only sets how heavy the kit's tokens are
 *  there (the size law): at 1.38 the red line is 12 screen px, ink lines 4.7 px
 *  and the word class 40 px in the last frame, and heavier in the close opening. */
export const K_END = 1.38;

// --- the chart's world ---------------------------------------------------------
export const N = DATA.length;
export const LAST = N - 1;
/** world px per month / per percentage point (an honest linear axis from 0 %) */
export const MX = (TIP_SX - LEFT_SX) / (LAST * K_END);
export const PY = PCT_SPX / K_END;
export const X = (m: number) => m * MX;
export const Y = (pct: number) => -pct * PY;
export const PTS: Pt[] = DATA.map((v, i) => ({ x: X(i), y: Y(v) }));
export const CUM = cumLen(PTS);
export const TOTAL = CUM[LAST];
/** the furniture (baseline, hairlines, the dashed reference) runs a little past the data */
export const END_M = LAST + 3;
export const monthIndex = (year: number, month: number) => (year - START_YEAR) * 12 + (month - START_MONTH);
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthLabel = (i: number) => {
  const mi = START_MONTH - 1 + i;
  return `${MONTH_NAMES[mi % 12]} ${START_YEAR + Math.floor(mi / 12)}`;
};
/** the January of every year on the chart (tick + vertical hairline), and the year label that starts at each tick */
export const JANUARIES: number[] = [];
for (let i = 0; i <= LAST; i++) if ((START_MONTH - 1 + i) % 12 === 0) JANUARIES.push(i);
export const YEARS = JANUARIES.map((jan) => ({ jan, text: String(START_YEAR + Math.floor((START_MONTH - 1 + jan) / 12)) }));

// --- landmarks, all from the array ---------------------------------------------
const argBest = (a: number, b: number, better: (x: number, y: number) => boolean) => {
  let best = a;
  for (let i = a + 1; i < b; i++) if (better(DATA[i], DATA[best])) best = i;
  return best;
};
/** the first month above the reference (April 2023, 20.4) */
export const FIRST_ABOVE = DATA.findIndex((v) => v > REFERENCE_PCT);
/** the high before it: the month that KISSES the reference from below (July 2022, 19.9) */
export const KISS = argBest(0, FIRST_ABOVE, (x, y) => x > y);
/** the trough between the kiss and the crossing (December 2022, 16.7) */
export const TROUGH = argBest(KISS, FIRST_ABOVE, (x, y) => x < y);
/** a year's summer peak (the first month of its maximum) */
export const yearPeak = (year: number) => argBest(monthIndex(year, 1), Math.min(N, monthIndex(year + 1, 1)), (x, y) => x > y);
/** arc length at which the line crosses the reference for good */
export const S_CROSS = (() => {
  const i = FIRST_ABOVE;
  const t = (REFERENCE_PCT - DATA[i - 1]) / (DATA[i] - DATA[i - 1]);
  return CUM[i - 1] + (CUM[i] - CUM[i - 1]) * t;
})();
/** the value of the series at arc length s (straight between months) */
export const valueAtLen = (s: number) => {
  const t = Math.max(0, Math.min(TOTAL, s));
  let i = 0;
  while (i < LAST - 1 && CUM[i + 1] <= t) i++;
  const seg = CUM[i + 1] - CUM[i];
  const u = seg > 0 ? (t - CUM[i]) / seg : 0;
  return DATA[i] + (DATA[i + 1] - DATA[i]) * Math.min(1, u);
};
// --- the tip clock ---------------------------------------------------------------
// The tip writes the whole line WITHOUT STOPPING, at a smooth PEN speed (arc
// length along the saw-tooth, so a summer spike is written, not flicked). It is
// keyed on the data's own landmarks at the frames the words give; between keys
// it is a cubic Hermite whose knot speeds (`pace`, as a multiple of the main
// stretch's mean speed V_REF) are authored, so the speed is continuous and
// simply shaped: a gentle ease-in over the first year while the title is read,
// an even pace from 2020 through the kiss, the trough and the crossing (no
// speed-up in the last year), and one deceleration from the crossing into rest
// on the last month, slow enough for the readout to be read as it rolls.
//   f5     2019's summer peak (the cut opens mid-stroke on the rise into it)
//   f41.5  "statistics"  2020's summer top (the COVID summer)
//   f63.5  "getting"     2021's summer peak
//   f85.5  "to"          the KISS: the high before the crossing
//   f94                  the trough after it
//   f102.75 "20"         the CROSSING of the reference (S_CROSS)
//   f113   "plus"        the last month, at rest
const F_MAIN0 = 41.5;
const F_MAIN1 = 85.5;
/** mean pen speed of the main stretch (2020's top -> the kiss), world px / frame */
export const V_REF = (CUM[KISS] - CUM[yearPeak(START_YEAR + 2)]) / (F_MAIN1 - F_MAIN0);
export const TIP_KEYS: { f: number; s: number; pace: number }[] = [
  { f: 5, s: CUM[yearPeak(START_YEAR + 1)], pace: 0.3 },
  { f: F_MAIN0, s: CUM[yearPeak(START_YEAR + 2)], pace: 0.95 },
  { f: 63.5, s: CUM[yearPeak(START_YEAR + 3)], pace: 0.98 },
  { f: F_MAIN1, s: CUM[KISS], pace: 1 },
  { f: 94, s: CUM[TROUGH], pace: 1 },
  { f: 102.75, s: S_CROSS, pace: 0.85 },
  { f: 113, s: TOTAL, pace: 0 },
];
/** the frame the tip comes to rest on the last month */
export const F_LAND = TIP_KEYS[TIP_KEYS.length - 1].f;
const TIP_TAN: number[] = TIP_KEYS.map((key) => key.pace * V_REF);
/** arc length written at (fractional) frame S */
export const tipLen = (S: number) => {
  const K = TIP_KEYS;
  const n = K.length;
  if (S <= K[0].f) return Math.max(0, K[0].s + TIP_TAN[0] * (S - K[0].f));
  if (S >= K[n - 1].f) return K[n - 1].s;
  let i = 0;
  while (i < n - 2 && K[i + 1].f <= S) i++;
  const h = K[i + 1].f - K[i].f;
  const u = (S - K[i].f) / h;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * K[i].s + (u3 - 2 * u2 + u) * h * TIP_TAN[i] + (-2 * u3 + 3 * u2) * K[i + 1].s + (u3 - u2) * h * TIP_TAN[i + 1]
  );
};
/** the (fractional) frame at which the tip wrote arc length s */
export const fAtLen = (s: number) => {
  if (s >= TOTAL) return F_LAND;
  let lo = TIP_KEYS[0].f - TIP_KEYS[0].s / TIP_TAN[0] - 1;
  let hi = F_LAND;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (tipLen(mid) < s) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
export const tipAt = (S: number): Pt => pointAtLen(PTS, CUM, tipLen(S));
/** pen speed, world px / frame */
export const tipSpeed = (S: number) => tipLen(S + 0.5) - tipLen(S - 0.5);
/** the frame the tip crosses the reference: the readout's cause */
export const F_CROSS = fAtLen(S_CROSS);
/** the frame the tip touches the kiss */
export const F_KISS = fAtLen(CUM[KISS]);

// --- the camera --------------------------------------------------------------------
// One long pull-back, authored as its own keyed track and run through the kit's
// damped follower. It is keyed as a ZOOM ABOUT A SCREEN POINT: the world point
// where the 10 % hairline meets the chart's left edge (ANCHOR_W) is held near
// screen (LEFT_SX, SCALE_SY) while k eases from close on the tip (~2.3x the END
// framing) to the whole chart. So the frame's right edge travels right, staying
// ahead of the tip; its top edge rises (the dashed 20 % line comes down into
// frame) and its bottom edge drops (the baseline and the years come up), all in
// one move with a soft landing (~f116) and a slow push after it. The left edge,
// with the title, stays put: nothing leaves the frame and comes back. The glide
// list keys (anchor screen x, anchor screen y, k).
export const ANCHOR_W: Pt = { x: X(0), y: Y(SCALE_PCT) };
export const CAM_F0 = -44;
/** how close the track starts (at CAM_F0), as a multiple of the END framing; ~2.3x at f0 */
export const ZOOM_OPEN = 2.72;
/** (anchor screen x, anchor screen y, k) at CAM_F0 */
export const KEY_START: Cam = { x: LEFT_SX, y: SCALE_SY - 26, k: K_END * ZOOM_OPEN };
export const GLIDES: Glide[] = [
  // the travel: close on the tip -> most of the chart, already under way at f0
  { f0: -44, f1: 90, dy: 26, k: K_END * 1.2 },
  // the landing: on to the whole chart, starting under the travel's crest (one C1 move, soft landing ~f116)
  { f0: 46, f1: 118, k: K_END * 0.972 },
  // the hold: a slow push that decays into the last frame
  { f0: 100, f1: 150, k: K_END * 1.004 },
];
export const keyAt = (f: number) => glideTargetAt(KEY_START, GLIDES, f);
/** the keyed camera centre at frame f */
export const camTargetAt = (f: number): Cam => {
  const t = keyAt(f);
  return { x: ANCHOR_W.x - (t.x - FRAME_W / 2) / t.k, y: ANCHOR_W.y - (t.y - FRAME_H / 2) / t.k, k: t.k };
};
const TRACK = runFollower((f) => lookOf(camTargetAt(f)), CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the end framing) */
export const REST_CAM: Cam = TRACK.cams[TRACK.cams.length - 1];

// --- type sizes (all from kit tokens) -----------------------------------------------
// Every word label is the kit's word class (40 screen px in the END frame).
/** the payoff number: three value classes (150 screen px, constant on screen) */
export const READOUT_PX = 3 * VALUE_PX;
/** the date under it: the kit's value size in the word face (50 screen px, constant on screen) */
export const DATE_PX = VALUE_PX;

// --- the title lockup: flag | YOUTH UNEMPLOYMENT / AGES 16–24 --------------------------
// The flag stands on the left, as tall as the two text lines; the lockup hangs
// just under the dashed reference, left-aligned at the chart's left edge.
export const TITLE_LINE = "Youth unemployment";
export const TITLE_SUB = "Ages 16–24";
export const TITLE_X = X(0);
/** its top hangs this far under the reference (36 screen px in the END frame) */
export const TITLE_TOP_Y = Y(REFERENCE_PCT) + 36 / K_END;
/** while the camera is close the lockup's words stop growing at the kit's VALUE_PX on screen (the one line must fit the frame) */
const TITLE_CAP_PX = VALUE_PX;
/** The camera k at which the kit's size law gives a word label `font` world px
 *  tall. A kit Label handed this k draws at that size with its OWN box, metrics
 *  and edge-fade (a scale group would leave its edge-fade box at the old size). */
export const kForWordFont = (font: number) => K_REF * Math.pow(WORD_PX / K_REF / font, 4);
const titleRows = (k: number, mTitle: number) => {
  /** world font of the sub line: the kit's word size at this k, capped on screen */
  const u = Math.min(labelPx("word", k), TITLE_CAP_PX / k);
  const kSub = kForWordFont(u);
  const kTitle = kForWordFont(u * mTitle);
  const capSub = labelCapH("word", kSub);
  const capTitle = labelCapH("word", kTitle);
  const gap = 0.4 * u;
  const flagH = capTitle + gap + capSub;
  const flagW = 1.5 * flagH;
  const xText = TITLE_X + flagW + 0.42 * u;
  return {
    kSub,
    kTitle,
    flag: { x0: TITLE_X, y0: TITLE_TOP_Y, w: flagW, h: flagH },
    xText,
    yTitle: TITLE_TOP_Y + capTitle / 2,
    ySub: TITLE_TOP_Y + capTitle + gap + capSub / 2,
    titleBottom: TITLE_TOP_Y + capTitle,
    bottom: TITLE_TOP_Y + flagH,
    right: xText + labelWidth(TITLE_LINE, "word", kTitle),
  };
};
/** The title line is as large as fits in the END frame: from the text's left to
 *  where the series first climbs to the line's own level (the 2022 rise), less a
 *  clearance, over the line's natural width; never under the word class, never
 *  more than a tenth over it. */
export const TITLE_M = (() => {
  const r = titleRows(K_END, 1.1);
  const level = -(r.titleBottom + 30 / K_END) / PY; // the percentage at the caps' bottom + 30 screen px
  let xLimit = X(LAST);
  for (let i = 1; i <= LAST; i++) {
    if (DATA[i] >= level && X(i) > r.xText) {
      const t = DATA[i - 1] >= level ? 0 : (level - DATA[i - 1]) / (DATA[i] - DATA[i - 1]);
      xLimit = X(i - 1 + t);
      break;
    }
  }
  const fit = (xLimit - 44 / K_END - r.xText) / labelWidth(TITLE_LINE, "word", K_END);
  return Math.max(1, Math.min(1.1, fit));
})();
/** the lockup's rows at camera k (world px; caps centres) */
export const titleLayout = (k: number) => titleRows(k, TITLE_M);
/** the lockup enters f4 -> f16, readable by "the youth" */
export const TITLE_ENTER_F = 4;

// --- the scale tags -------------------------------------------------------------------
/** both tags stand above their line, left-aligned at the first month from which the
 *  series stays at least 2 points clear of the 10 % hairline for the tag's width */
const TAG_SPAN_M = 6;
export const TAG_M = (() => {
  for (let i = 0; i + TAG_SPAN_M <= LAST; i++) {
    if (DATA.slice(i, i + TAG_SPAN_M + 1).every((v) => v >= SCALE_PCT + 2)) return i + 1;
  }
  return 0;
})();
/** caps centre of a tag standing on a horizontal line at world y */
export const tagY = (lineY: number, k: number) => lineY - 0.42 * labelPx("word", k) - labelCapH("word", k) / 2;

// --- the year labels under the baseline ------------------------------------------------
export const yearLabelY = (k: number) => TICK_HALF * sz(k) + 0.5 * labelPx("word", k) + labelCapH("word", k) / 2;
/** a year label starts just right of its January tick */
export const yearLabelX = (jan: number, k: number) => X(jan) + 0.28 * labelPx("word", k);

// --- the end readout (stands above the last month, in the empty top of the END frame) ---
/** its right edge in the END frame, screen px */
export const READOUT_RIGHT_SX = 1010;
/** clear screen px between the bead and the date, and between the date and the number */
const READOUT_CLEAR = 40;
const READOUT_GAP = 26;
/** the readout's rows at camera k (world px): the date above the bead, the number above the date */
export const readoutLayout = (k: number) => {
  const end = PTS[LAST];
  const fsDate = DATE_PX / k;
  const capDate = 0.669 * fsDate;
  const fsN = READOUT_PX / k;
  const capN = 0.667 * fsN;
  const yDate = end.y - DOT_R * sz(k) - READOUT_CLEAR / k - capDate / 2;
  const yNum = yDate - capDate / 2 - READOUT_GAP / k - capN / 2;
  return { xRight: end.x + (READOUT_RIGHT_SX - TIP_SX) / K_END, yDate, yNum, fsN, mDate: fsDate / labelPx("word", k) };
};
/** the date label slides up once the number has landed */
export const DATE_ENTER_F = F_LAND + 1;
