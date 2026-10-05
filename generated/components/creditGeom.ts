import {
  FRAME_W,
  camEase,
  camFromTrack,
  clamp01,
  runFollower,
  shootEase,
  smoothstep,
  glideTargetAt,
} from "./chinatalkShared";
import type { Cam, FollowerState, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// creditGeom — THE WORLD of Logan Wright, "the biggest credit boom in history"
// (ChinaTalk, Oct 2026). Builder A owns this file; builder B imports it and
// never edits it. Every value listed in out/logan-credit/briefs/WORLD_READY.md
// keeps its name and meaning (changes get a dated CHANGED line there).
//
// ONE SHEET OF RICE PAPER. World px, y grows DOWN.
//   E      the economy line = the time axis, at E_Y = 0. x = X(year, S): 2008 is
//          world x 0 always; the x-scale (world px per year) is animatable:
//          ERA 75 px/yr, rescaled on "century" (17.9) and "many centuries"
//          (5.11), re-expanded to ERA on "China" (S 242) and ERA from S 264 on.
//          E's LEFT END is the fixed world x E_LEFT_X = -1725 (1985 at ERA) from
//          S 298 on; before that it runs out past the frame's left edge
//          (A3, eLeftXAt). The pinned year label reads 1987 -> 1920 -> 1700.
//   dip    the 2008 crisis: falls 2008.00 -> 2008.75 (floor, DIP_D below E),
//          recovers by 2009.40. Sharp V.
//   booms  past credit booms: ink pills (INK_LO) standing on E at their years.
//   tower  China's credit: a RED pill standing on E, left edge at
//          X(2009.40) + 8, TOWER_W wide; height = $T x PX_PER_T. $25T (bank
//          assets added 2008-16) by S 121, $54T (2008-2024) by S ~438.
//
// HEIGHTS: illustrative magnitudes of credit added in each boom, $T (the
// director's list; not a sourced dataset): US 1920s 0.1, Japan 1985-90 1.5,
// East Asia 1990-97 0.6, Spain 2000-08 1.8, UK 2000-08 2.5, US 2000-08 13,
// Mississippi/South Sea 1720 0.02, British railway mania 1845 0.02, 1873 0.03,
// 1890s 0.04. China 2008-16: 25 (RMB ~63T -> ~232T bank assets). China
// 2008-24: 54 (RMB ~63T -> ~450T). Pills are placed at a year inside their boom
// (the three 2000-08 booms at 2002 / 2004 / 2006 so they read side by side).
// The "century" / "many centuries" stubs stand at least 24 screen px tall at
// the frame each arrives on E (STUB_MIN_PX; B2 raised it from 14), so they read
// as small bars on a phone.
//
// A2 (second pass, Oct 5 2026): the BARS SHOT (S 40-298) is re-framed: tower at
// screen x ~700-720, the history row filling the column to its left, the group
// centred (E's left end ~210-275); the camera rejoins the first pass's track by
// S 298 (HANDBACK), so S 298-479 and JOIN_CAM_STATE are unchanged.
//
// A3 (third pass, Oct 5 2026): the BARS SHOT zooms back in (k ~0.36, the tower
// ~860 screen px + flag) and stops treating E's left end as something that must
// be in frame. The tower stands at screen x ~705-737; E (and the faint decade
// ruler) RUN OUT past the left edge of the frame for S < 298 (`eLeftXAt(S)`:
// E's left end follows the frame's left edge, off screen); the year label is
// pinned at screen x YEAR_LABEL_SX and reads the year at that screen point. The
// camera's x holds the world point YEAR_LABEL_W under it from S ~112 to ~232
// (`pinX`), so the label rolls ONLY with time: 1987 -> 1920 ("century") -> 1700
// ("many centuries"); the two rescale scales are set from that point. Booms and
// ruler ticks slide IN from beyond the left edge on the rescales (the stubs keep
// the 14 px minimum, measured at the frame each one enters the frame). The
// camera still blends back onto the first pass's track by S 298 (HANDBACK).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 1347;
export const S_END = 1346;
/** Act 1 is S 0..ACT1_END (builder A); Act 2 is S ACT1_END+1..S_END (builder B). */
export const ACT1_END = 479;

// --- scales -------------------------------------------------------------------
export const E_Y = 0;
export const ANCHOR_YEAR = 2008;
/** world px per year at the era scale */
export const ERA_SCALE = 75;
/** world px per $T of credit added */
export const PX_PER_T = 96;
/** E's fixed left end (world x) = 1985 at the era scale */
export const E_LEFT_X = -1725;
/** A3: the year label is pinned at this screen x (left-aligned caps) ... */
export const YEAR_LABEL_SX = 112;
/** ... and the bars-shot camera holds this world x under it (S ~112-232): it
 *  reads 1987 at the era scale. */
export const YEAR_LABEL_YEAR_ERA = 1987;
export const YEAR_LABEL_W = (YEAR_LABEL_YEAR_ERA - ANCHOR_YEAR) * ERA_SCALE; // -1575
const SCALE_CENTURY = -YEAR_LABEL_W / (ANCHOR_YEAR - 1920); // 17.90: the label reads 1920
const SCALE_CENTURIES = -YEAR_LABEL_W / (ANCHOR_YEAR - 1700); // 5.11: the label reads 1700
/** The rescale moves, on ln(scale): [S0, S1] each, eased (camEase). Overlapping
 *  ends so the roll never stops dead between "century" and "possibly". */
export const RESCALE = {
  century: { S0: 172, S1: 201, to: SCALE_CENTURY },
  centuries: { S0: 197, S1: 232, to: SCALE_CENTURIES },
  era: { S0: 240, S1: 264, to: ERA_SCALE },
};
/** World px per year at S. */
export const xScaleAt = (S: number) => {
  let ls = Math.log(ERA_SCALE);
  let prev = ERA_SCALE;
  for (const r of [RESCALE.century, RESCALE.centuries, RESCALE.era]) {
    ls += (Math.log(r.to) - Math.log(prev)) * camEase((S - r.S0) / (r.S1 - r.S0));
    prev = r.to;
  }
  return Math.exp(ls);
};
/** World x of a year at S. */
export const X = (year: number, S: number) => (year - ANCHOR_YEAR) * xScaleAt(S);
/** The year at world x at S. */
export const yearAtX = (x: number, S: number) => ANCHOR_YEAR + x / xScaleAt(S);
/** The year E's left end reads at S (1985 at the era scale). */
export const leftYearAt = (S: number) => yearAtX(E_LEFT_X, S);

// --- E: the economy line -------------------------------------------------------
export const DIP_Y0 = 2008.0;
export const DIP_FLOOR_YEAR = 2008.75;
export const DIP_Y1 = 2009.4;
/** depth of the dip below E, world px */
export const DIP_D = 130;
/** E's offset below E_Y from the crisis (0 outside the dip). */
export const dipDy = (year: number) => {
  if (year <= DIP_Y0 || year >= DIP_Y1) return 0;
  if (year <= DIP_FLOOR_YEAR) return DIP_D * Math.pow((year - DIP_Y0) / (DIP_FLOOR_YEAR - DIP_Y0), 1.5);
  const u = (year - DIP_FLOOR_YEAR) / (DIP_Y1 - DIP_FLOOR_YEAR);
  return DIP_D * Math.pow(1 - u, 2);
};
/** A very slight organic undulation (world px, function of world x), zero over
 *  the dip and the tower's foot (x -90 .. 520) so the crisis and the foot read clean. */
export const undulation = (x: number) => {
  const w = x < -90 ? smoothstep((-90 - x) / 160) : x > 520 ? smoothstep((x - 520) / 160) : 0;
  return w * (2.4 * Math.sin(x / 173 + 0.4) + 1.4 * Math.sin(x / 67 + 2.1));
};
/** E's y at a year (S sets the x for the undulation). */
export const eY = (year: number, S: number) => E_Y + dipDy(year) + undulation(X(year, S));

/** E's sample years between y0 and y1 (dense through the dip). */
const eYears = (y0: number, y1: number, S: number): number[] => {
  const out: number[] = [];
  const step = Math.min(0.5, 10 / xScaleAt(S)); // ~10 world px
  let y = y0;
  while (y < y1) {
    out.push(y);
    const inDip = y >= DIP_Y0 - 0.05 && y <= DIP_Y1 + 0.05;
    y += inDip ? Math.min(step, 0.02) : step;
  }
  out.push(y1);
  // the floor exactly (a sharp V)
  if (y0 < DIP_FLOOR_YEAR && y1 > DIP_FLOOR_YEAR && !out.includes(DIP_FLOOR_YEAR)) {
    out.push(DIP_FLOOR_YEAR);
    out.sort((a, b) => a - b);
  }
  return out;
};
/** E as a world polyline from its left end (A3: `eLeftXAt(S)`, which is
 *  E_LEFT_X from S 298 on) to `tipYear` at S. */
export const ePoints = (S: number, tipYear: number, dyExtra?: (year: number) => number): Pt[] => {
  const y0 = eLeftYearAt(S);
  if (tipYear <= y0) return [];
  return eYears(y0, tipYear, S).map((yr) => ({ x: X(yr, S), y: eY(yr, S) + (dyExtra ? dyExtra(yr) : 0) }));
};

// --- E's writing tip (era-scale arc length, Hermite knots) ---------------------------
const TABLE_Y0 = 1985;
const TABLE_Y1 = 2030;
const TABLE = (() => {
  const ys = eYears(TABLE_Y0, TABLE_Y1, 0);
  const cum: number[] = [0];
  for (let i = 1; i < ys.length; i++) {
    const a = { x: (ys[i - 1] - ANCHOR_YEAR) * ERA_SCALE, y: dipDy(ys[i - 1]) + undulation((ys[i - 1] - ANCHOR_YEAR) * ERA_SCALE) };
    const b = { x: (ys[i] - ANCHOR_YEAR) * ERA_SCALE, y: dipDy(ys[i]) + undulation((ys[i] - ANCHOR_YEAR) * ERA_SCALE) };
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return { ys, cum };
})();
/** era arc length (from 1985) at a year */
export const eLenAtYear = (year: number) => {
  const { ys, cum } = TABLE;
  if (year <= ys[0]) return 0;
  let lo = 0;
  let hi = ys.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ys[mid] <= year) lo = mid;
    else hi = mid;
  }
  const u = (year - ys[lo]) / (ys[hi] - ys[lo] || 1);
  return cum[lo] + (cum[hi] - cum[lo]) * u;
};
/** the year at an era arc length */
export const eYearAtLen = (len: number) => {
  const { ys, cum } = TABLE;
  if (len <= 0) return ys[0];
  let lo = 0;
  let hi = cum.length - 1;
  if (len >= cum[hi]) return ys[hi] + (len - cum[hi]) / ERA_SCALE;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= len) lo = mid;
    else hi = mid;
  }
  const u = (len - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return ys[lo] + (ys[hi] - ys[lo]) * u;
};
type TipKnot = { S: number; len: number; v: number };
const TIP_KNOTS: TipKnot[] = [
  // "after the global financial": calm, level, ~18 world px/f (~22 screen px/f at k 1.2)
  { S: 0, len: eLenAtYear(2003.0), v: 18 },
  { S: 21, len: eLenAtYear(DIP_Y0), v: 15 },
  // "crisis": the plunge (speeds up into the floor), the climb out (decelerating)
  { S: 29, len: eLenAtYear(DIP_FLOOR_YEAR), v: 14 },
  { S: 44, len: eLenAtYear(DIP_Y1), v: 7.5 },
  // "China saw the": writes on past the lip to ~2012 and slows
  { S: 84, len: eLenAtYear(2012.0), v: 1.2 },
];
const TIP_LAST = TIP_KNOTS[TIP_KNOTS.length - 1];
const CREEP_V = 0.25;
const CREEP_TAU = 40;
const hermite = (S: number, a: TipKnot, b: TipKnot) => {
  const h = b.S - a.S;
  const t = (S - a.S) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.len + (t3 - 2 * t2 + t) * h * a.v + (-2 * t3 + 3 * t2) * b.len + (t3 - t2) * h * b.v;
};
/** E's tip as era arc length at S (C1; a decaying creep after S 84, never stops). */
export const eTipLen = (S: number) => {
  const k0 = TIP_KNOTS[0];
  if (S <= k0.S) return k0.len + k0.v * (S - k0.S);
  if (S <= TIP_LAST.S) {
    let i = 0;
    while (i < TIP_KNOTS.length - 2 && S > TIP_KNOTS[i + 1].S) i++;
    return hermite(S, TIP_KNOTS[i], TIP_KNOTS[i + 1]);
  }
  const t = S - TIP_LAST.S;
  return TIP_LAST.len + CREEP_V * t + (TIP_LAST.v - CREEP_V) * CREEP_TAU * (1 - Math.exp(-t / CREEP_TAU));
};
/** E's tip year at S. */
export const eTipYear = (S: number) => eYearAtLen(eTipLen(S));
/** The first S at which E's tip reached `year` (bisection). */
export const sAtEYear = (year: number) => {
  const len = eLenAtYear(year);
  let lo = -200;
  let hi = 2000;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (eTipLen(mid) < len) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
/** E's rung: the subject (0.90) until credit takes over on "credit" (S 94),
 *  then context (0.42). */
export const E_RECEDE_S = 92;

// --- the 2008 tick ----------------------------------------------------------------
/** the tip reaches the floor */
export const S_FLOOR = 29;
export const TICK2008_GROW_S = 26; // the seal grows as the tip nears the floor
export const TICK2008_LABEL_S = 23; // "2008" starts with the plunge, lands S 35
export const TICK2008_RECEDE_S = 58;

// --- booms -------------------------------------------------------------------------
export type Boom = { id: string; year: number; T: number; set: "era" | "century" | "centuries"; riseS?: number };
export const BOOM_W = 48;
/** minimum pill height (a dome), world px */
export const BOOM_MIN_H = 26;
export const BOOMS: Boom[] = [
  // "largest single country": ONE soft wave from the dip outward (right -> left)
  { id: "us2000", year: 2006, T: 13, set: "era", riseS: 56 },
  { id: "uk2000", year: 2004, T: 2.5, set: "era", riseS: 59 },
  { id: "spain2000", year: 2002, T: 1.8, set: "era", riseS: 62 },
  { id: "eastasia", year: 1993.5, T: 0.6, set: "era", riseS: 66 },
  { id: "japan", year: 1987.5, T: 1.5, set: "era", riseS: 69 },
  // enter from the left on the rescales, rising as they arrive on E
  { id: "us1920", year: 1925, T: 0.1, set: "century" },
  { id: "1890s", year: 1893, T: 0.04, set: "centuries" },
  { id: "1873", year: 1873, T: 0.03, set: "centuries" },
  { id: "railway1845", year: 1845, T: 0.02, set: "centuries" },
  { id: "mississippi1720", year: 1720, T: 0.02, set: "centuries" },
];
/** A2: the "century" / "many centuries" stubs stand at least STUB_MIN_PX screen
 *  px tall at the frame where each arrives on E (then keep that world height),
 *  so the old booms read as a row of small bars. The era set is untouched. */
export const STUB_MIN_PX = 24; // B2 (Oct 5 2026): was 14; the stubs read as bumps on a phone
const stubMinH = new Map<string, number>();
/** A3: a stub "arrives" when its pill enters the frame from the left edge. */
const stubArriveS = (b: Boom) => {
  for (let S = 150; S <= 240; S += 0.25) {
    const c = camAct1(S);
    if (FRAME_W / 2 + (X(b.year, S) + BOOM_W / 2 - c.x) * c.k > 0) return S;
  }
  return 240;
};
export const boomH = (b: Boom) => {
  const h = Math.max(BOOM_MIN_H, b.T * PX_PER_T);
  if (b.set === "era") return h;
  let m = stubMinH.get(b.id);
  if (m === undefined) {
    m = STUB_MIN_PX / camAct1(stubArriveS(b)).k;
    stubMinH.set(b.id, m);
  }
  return Math.max(h, m);
};
/** A boom's rise duration: taller pills take longer (peak <= ~75 world px/f). */
export const boomRiseF = (b: Boom) => 16 + boomH(b) / 90;
/** How far a boom stands at S (0..1 of its height), and its opacity factor:
 *  wave pills rise on their schedule; every pill also needs to be ON E (inside
 *  its left end): one crossing E_LEFT_X rises as it arrives. */
export const boomState = (b: Boom, S: number) => {
  const x = X(b.year, S);
  const onE = smoothstep((x - eLeftXAt(S) - 24) / 110);
  const wave = b.riseS !== undefined ? shootEase((S - b.riseS) / boomRiseF(b)) : 1;
  return { x, rise: wave * onE, vis: onE };
};

// --- the tower -----------------------------------------------------------------------
export const TOWER_W = 96;
export const TOWER_LEFT_YEAR = DIP_Y1;
export const TOWER_GAP = 8;
/** The tower's left edge at S (era scale: 113). */
export const towerX0 = (S: number) => X(TOWER_LEFT_YEAR, S) + TOWER_GAP;
export const towerCX = (S: number) => towerX0(S) + TOWER_W / 2;
/** The two growth moves ($T) and their windows. */
export const TOWER_RISE1 = { S0: 86, S1: 124, T: 25 };
export const TOWER_RISE2 = { S0: 374, S1: 430, T: 54 };
/** China's credit at S, $T added since 2008. */
export const towerT = (S: number) =>
  TOWER_RISE1.T * shootEase((S - TOWER_RISE1.S0) / (TOWER_RISE1.S1 - TOWER_RISE1.S0)) +
  (TOWER_RISE2.T - TOWER_RISE1.T) * shootEase((S - TOWER_RISE2.S0) / (TOWER_RISE2.S1 - TOWER_RISE2.S0));
export const towerH = (S: number) => towerT(S) * PX_PER_T;
/** The tower's top y (world) at S. */
export const towerTopY = (S: number) => E_Y - towerH(S);
/** The first S at which the tower stood h world px tall (bisection). */
export const sAtTowerH = (h: number) => {
  if (h <= 0) return TOWER_RISE1.S0;
  let lo = TOWER_RISE1.S0 - 1;
  let hi = TOWER_RISE2.S1 + 1;
  if (towerH(hi) < h) return Infinity;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (towerH(mid) < h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
/** How much the tower is growing right now (0..1): drives the bead. */
export const towerGrowing = (S: number) => {
  const v = towerH(S + 0.5) - towerH(S - 0.5);
  return smoothstep(v / 6);
};

// --- the flag ---------------------------------------------------------------------------
/** it lands on "China" (S 41) at the dip's right lip */
export const FLAG_WORD_S = 41;
/** screen width at K_REF (the label law, 80 % floor) */
export const FLAG_PX_W = 120;
export const flagWorldW = (k: number) => Math.max((FLAG_PX_W / 1.2) * Math.pow(k / 1.2, -0.25), (0.8 * FLAG_PX_W) / k);
/** screen px between the tower's top and the flag's bottom edge */
export const FLAG_GAP_PX = 16;

// --- Act 2 anchors (B) --------------------------------------------------------------------
/** The VALVE anchor: on the tower's left wall, 70 world px above E, facing
 *  the dip (left). At the era scale (S >= 264): (113, -70). */
export const VALVE = { x: TOWER_X0_ERA(), y: E_Y - 70, facing: "left" as const };
function TOWER_X0_ERA() {
  return (TOWER_LEFT_YEAR - ANCHOR_YEAR) * ERA_SCALE + TOWER_GAP;
}
/** The dip as a closed-top polyline at the era scale (world), lip to lip. */
export const DIP_POLY_ERA: Pt[] = eYears(DIP_Y0, DIP_Y1, 300).map((yr) => ({ x: (yr - ANCHOR_YEAR) * ERA_SCALE, y: E_Y + dipDy(yr) }));

// ---------------------------------------------------------------------------
// ACT 1 SCHEDULE (S frames; the words they serve are in creditAct1.tsx)
// ---------------------------------------------------------------------------
export const A1 = {
  // A2: the time ruler ("the world has seen"): a wet-ink head writes it leftward
  // from 2008 to E's left end; it crowds on the rescales and diffuses on "China"
  rulerHead0: 134,
  rulerHead1: 152,
  rulerOut0: 242,
  rulerOut1: 282,
  // year label at E's left end: starts as the ruler's head reaches the end
  // ("the world has SEEN"), lands S 162
  yearIn: 150,
  yearOut: 240,
  // the world economy ("China ADDED a THIRD of GLOBAL GDP")
  circle0: 238,
  circle1: 256,
  fill0: 254,
  fill1: 270,
  radii0: 251,
  radii1: 258,
  sep0: 258,
  sep1: 276,
  third: 264, // "1/3" lands
  global: 267, // "GLOBAL GDP" lands
  // "to its bank assets": travel, turn red, liquefy, pour, surge
  travel0: 273,
  travel1: 300,
  tip0: 289,
  tip1: 305,
  red0: 281,
  red1: 297,
  head0: 297,
  head1: 311,
  drain0: 298,
  drain1: 315,
  tail0: 313,
  tail1: 321,
  surge0: 310,
  surge1: 338,
  assets: 326, // "BANK ASSETS" lands
  circleRecede: 314,
  // "in just eight years"
  tick0: 335,
  tickStep: 4,
  years: 363, // "8 YEARS" lands
  // "never seen anything remotely like this"
  diffuse0: 382,
  diffuse1: 404,
  // "there's a few aspects of that": the travelling highlight
  hi0: 440,
  hi1: 486,
};
/** Real annual increments of China's bank assets 2009-16 (RMB T, approx.: 16,
 *  16, 18, 21, 17, 21, 27, 33 of ~169): the eight seams sit at these
 *  cumulative fractions of the $25T tower. */
export const YEAR_FRACS = [0.095, 0.189, 0.296, 0.42, 0.521, 0.645, 0.805, 1.0];

// --- the world GDP circle (Act 1, seg 3) ---------------------------------------------------
export const GDP_C = { x: -440, y: -1650 };
export const GDP_R = 260;
/** the third points at the tower's top (from the circle's centre) */
export const WEDGE_PHI = Math.atan2(-2400 - GDP_C.y, (TOWER_X0_ERA() + TOWER_W / 2) - GDP_C.x);
export const WEDGE_HALF = Math.PI / 3; // 120 degrees
export const WEDGE_SEP = 56;

// ---------------------------------------------------------------------------
// CAMERA, ACT 1 (S 0-479): superposed glides through the damped follower
// (look = content centre; content lands at screen y 835). A 40-frame pre-roll
// so the camera is already tracking E's tip on S 0.
// ---------------------------------------------------------------------------
export const CAM_PRE = -40;
type Way = { f0: number; f1: number; x: number; y: number; k: number; warp?: number; even?: number };
/** The LOOK at the start of the pre-roll. */
export const CAM_START: Cam = { x: -780, y: -60, k: 1.2 };
export const WAYS_ACT1: Way[] = [
  // "after the global financial crisis": tracking the writing tip (it sits a
  // little right of centre), easing to rest over the dip's right lip for "China"
  { f0: CAM_PRE, f1: 46, x: 120, y: -60, k: 1.2, even: 0.4 },
  // "largest single country": back and left, the history row rising on E
  { f0: 40, f1: 98, x: -760, y: -780, k: 0.47 },
  // "credit expansion": tilts up with the tower and settles
  { f0: 90, f1: 122, x: -760, y: -1075, k: 0.43 },
  // "the world has seen ... the last century, possibly many centuries": a long creep
  { f0: 104, f1: 244, x: -840, y: -1235, k: 0.37, even: 0.25 },
  // "China added a third of global GDP": up to the tower's upper half, the world economy beside it
  { f0: 228, f1: 272, x: -235, y: -1700, k: 0.75 },
  // "to its bank assets": follows the third to the tower's top ...
  { f0: 274, f1: 306, x: -150, y: -1930, k: 0.76 },
  // ... and pulls back down the tower with the surge
  { f0: 302, f1: 342, x: 60, y: -1150, k: 0.46 },
  // "in just eight years": rides up with the ruler
  { f0: 330, f1: 374, x: 70, y: -1235, k: 0.455, even: 0.3 },
  // "never seen anything remotely like this": THE pull-back, the whole tower re-enters
  { f0: 388, f1: 436, x: -300, y: -2440, k: 0.2, warp: 0.85 },
  // "there's a few aspects of that": the pull-back's decaying creep
  { f0: 426, f1: ACT1_END, x: -318, y: -2520, k: 0.19 },
];
export const GLIDES_ACT1: Glide[] = (() => {
  let prev: { x: number; y: number } = CAM_START;
  return WAYS_ACT1.map((w) => {
    const g: Glide = { f0: w.f0, f1: w.f1, dx: w.x - prev.x, dy: w.y - prev.y, k: w.k, warp: w.warp, even: w.even };
    prev = w;
    return g;
  });
})();
const ACT1_RUN = runFollower((f) => glideTargetAt(CAM_START, GLIDES_ACT1, f), CAM_PRE, ACT1_END);
/** The first pass's Act 1 camera (kept: it IS the camera from HANDBACK.S1 on). */
export const camAct1Base = camFromTrack(ACT1_RUN.cams, CAM_PRE);

// --- A2/A3: the BARS SHOT re-framed, S 40 -> handback --------------------------------
// The first pass stood the tower at screen x ~935 with the flag near the right
// edge. A3 stands it at screen x ~737 (era) -> ~704 (many centuries) at k 0.36,
// the history row filling the column to its left and E running out past the
// left edge; the camera's x is pinned (PIN) so the year label reads only time. The same follower runs on the same glide list with the three
// bars-shot ways replaced; it rejoins the ORIGINAL track (above) by a C2 blend
// over HANDBACK, so from HANDBACK.S1 on the camera is the original, frame for
// frame (JOIN_CAM_STATE and every picture after S ~296 are unchanged).
export const WAYS_ACT1_A2: Way[] = [
  WAYS_ACT1[0],
  // "largest single country": back and left; the row rises to the LEFT of where the tower will stand
  { f0: 40, f1: 98, x: -390, y: -720, k: 0.42 },
  // "credit expansion": tilts up with the tower and settles (k 0.36: the tower ~860 screen px)
  { f0: 88, f1: 126, x: -386, y: -1190, k: 0.36 },
  // "the world has seen ... century, possibly many centuries": the tilt's decaying
  // creep up (E sinks ~25 screen px); x is held by pinX (the label's world point)
  { f0: 118, f1: 238, x: -386, y: -1260, k: 0.36, even: 0.3 },
  // "China added a third of global GDP": the first pass's glide up to the tower's
  // upper half, on its original frames
  WAYS_ACT1[4],
  ...WAYS_ACT1.slice(5),
];
const GLIDES_ACT1_A2: Glide[] = (() => {
  let prev: { x: number; y: number } = CAM_START;
  return WAYS_ACT1_A2.map((w) => {
    const g: Glide = { f0: w.f0, f1: w.f1, dx: w.x - prev.x, dy: w.y - prev.y, k: w.k, warp: w.warp, even: w.even };
    prev = w;
    return g;
  });
})();
/** The blend back onto the original track (smootherstep weight, C2). */
export const HANDBACK = { S0: 270, S1: 298 };
const A2_RUN = runFollower((f) => glideTargetAt(CAM_START, GLIDES_ACT1_A2, f), CAM_PRE, HANDBACK.S1 + 2);
const camA2Follow = camFromTrack(A2_RUN.cams, CAM_PRE);
const smootherstep = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** A3: the label pin. Over PIN the camera's x is blended (C2) onto the x that
 *  keeps YEAR_LABEL_W exactly under screen x YEAR_LABEL_SX at the follower's k,
 *  so the pinned year label reads only time, never the camera. */
export const PIN = { in0: 112, in1: 140, out0: 232, out1: 256 };
const pinW = (S: number) => smootherstep((S - PIN.in0) / (PIN.in1 - PIN.in0)) * (1 - smootherstep((S - PIN.out0) / (PIN.out1 - PIN.out0)));
const camA2 = (S: number): Cam => {
  const c = camA2Follow(S);
  const w = pinW(S);
  if (w <= 0) return c;
  const xPin = YEAR_LABEL_W - (YEAR_LABEL_SX - FRAME_W / 2) / c.k;
  return { x: c.x + (xPin - c.x) * w, y: c.y, k: c.k };
};
/** Act 1's camera (camera centre + zoom) at S (fractional S interpolates). */
export const camAct1 = (S: number): Cam => {
  if (S >= HANDBACK.S1 || S <= WAYS_ACT1_A2[1].f0) return camAct1Base(S);
  const a = camA2(S);
  if (S <= HANDBACK.S0) return a;
  const b = camAct1Base(S);
  const w = smootherstep((S - HANDBACK.S0) / (HANDBACK.S1 - HANDBACK.S0));
  return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * w) };
};
/** B2 (Oct 5 2026): the camera hands over to Act 2's track at CAM_JOIN_S (the
 *  dive starts in the unpicked tail, "there's a few ASPECTS of that"). For
 *  S < CAM_JOIN_S the camera is camAct1; from CAM_JOIN_S on it is camAct2, whose
 *  follower starts from JOIN_CAM_STATE (A's follower state AT CAM_JOIN_S:
 *  position + velocity in camera-centre space, and the LOOK target). */
export const CAM_JOIN_S = 440;
export const JOIN_CAM_STATE: FollowerState = ACT1_RUN.states[CAM_JOIN_S - CAM_PRE];
/** The follower state at any integer S in [CAM_PRE, 479] (the original run;
 *  identical to the camera from HANDBACK.S1 on). */
export const act1StateAt = (S: number): FollowerState => ACT1_RUN.states[Math.max(0, Math.min(ACT1_RUN.states.length - 1, Math.round(S) - CAM_PRE))];
/** A3: E's left end (world x) at S. For S < HANDBACK.S1 E runs out past the
 *  frame's left edge (history continuing): its end follows the edge, E_RUNOUT_PX
 *  screen px beyond it, never inside E_LEFT_X. From S 298 on it is E_LEFT_X. */
const E_RUNOUT_PX = 160;
export const eLeftXAt = (S: number) => {
  if (S >= HANDBACK.S1) return E_LEFT_X;
  const c = camAct1(S);
  return Math.min(E_LEFT_X, c.x - (FRAME_W / 2 + E_RUNOUT_PX) / c.k);
};
/** The year at E's left end at S. */
export const eLeftYearAt = (S: number) => yearAtX(eLeftXAt(S), S);

/** The paper's parallax rest: Act 1's camera at S 0, fixed for the whole clip. */
export const CAM_REST: Cam = camAct1(0);

export { clamp01 };
