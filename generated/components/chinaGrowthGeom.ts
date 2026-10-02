import { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, clamp01, smoothstep } from "./fieldShared";

export { ACCENT, ACCENT_DEEP, CAM_LIFT, FRAME_H, FRAME_W, clamp01, smoothstep } from "./fieldShared";

// ---------------------------------------------------------------------------
// chinaGrowthGeom — THE CHART WORLD of Logan Wright, "China's growth is going
// negative" (ChinaTalk, Oct 2026). Pure data and pure functions of the story
// clock S; no React. Builder A owns this file; builders B (cut 3) and C (cut 4)
// import from it and never edit it. Everything listed in
// out/logan-growth/briefs/WORLD_READY.md keeps its name and signature.
//
// THE ONE PICTURE. China's growth rate is ONE orange line moving along a time
// axis that is also the zero line. x is story time (no calendar except 2026
// and its quarters), y is the growth rate: S_Y = 100 world px per percentage
// point, the axis at Y0 = 2000, y grows DOWN. Orange (ACCENT) is the line,
// its vertex dots and its tip; ACCENT_DEEP is the negative-growth hatch only.
// Everything else is white at INK_HI 1.0 or INK_LO 0.5 (the band tint 0.10 is
// the one other white alpha).
//
// THE STORY CLOCK. S is the clip's global clock in frames at 24 fps; every cut
// is a window on it and renders <ChinaGrowthWorld S={S0 + frame} />, so a cut's
// frame 0 is the previous cut's last frame by construction.
// ---------------------------------------------------------------------------

export const FPS = 24;

export type CutName = "ChinaGrowing" | "NegativeGrowth" | "CovidExcuse" | "TrulyDramatic";
/** S0..S1 inclusive; DURATION = speech frames + a 16-frame tail. `inSec` /
 *  `inFrame` = the cut's in-point on the 58.78 s edit timeline. */
export const CUTS: Record<CutName, { S0: number; S1: number; DURATION: number; inSec: number; inFrame: number }> = {
  ChinaGrowing: { S0: 0, S1: 368, DURATION: 369, inSec: 0, inFrame: 0 },
  NegativeGrowth: { S0: 353, S1: 601, DURATION: 249, inSec: 14.708, inFrame: 353 },
  CovidExcuse: { S0: 601, S1: 829, DURATION: 229, inSec: 30.917, inFrame: 742 },
  TrulyDramatic: { S0: 829, S1: 1087, DURATION: 259, inSec: 48.292, inFrame: 1159 },
};
export const S_END = 1087;

/** Every word on the story clock (faster-whisper on the edit audio), from
 *  briefs/timing.md: [cut, word, S on, S off]. */
export const WORDS: readonly (readonly [CutName, string, number, number])[] = [
  ["ChinaGrowing", "We", 0.0, 4.8],
  ["ChinaGrowing", "had", 4.8, 10.6],
  ["ChinaGrowing", "China", 10.6, 18.2],
  ["ChinaGrowing", "growing", 18.2, 28.3],
  ["ChinaGrowing", "10,", 28.3, 39.4],
  ["ChinaGrowing", "7,", 46.6, 55.7],
  ["ChinaGrowing", "8", 61.4, 67.2],
  ["ChinaGrowing", "percent.", 67.2, 74.9],
  ["ChinaGrowing", "Things", 81.6, 85.0],
  ["ChinaGrowing", "were", 85.0, 88.3],
  ["ChinaGrowing", "looking", 88.3, 93.6],
  ["ChinaGrowing", "great.", 93.6, 103.2],
  ["ChinaGrowing", "And", 108.0, 110.4],
  ["ChinaGrowing", "now", 110.4, 120.0],
  ["ChinaGrowing", "we're", 120.0, 131.0],
  ["ChinaGrowing", "in", 131.0, 133.9],
  ["ChinaGrowing", "a", 133.9, 136.3],
  ["ChinaGrowing", "world", 136.3, 145.4],
  ["ChinaGrowing", "where", 145.4, 161.3],
  ["ChinaGrowing", "what's", 161.3, 171.8],
  ["ChinaGrowing", "our", 171.8, 174.7],
  ["ChinaGrowing", "latest", 174.7, 181.9],
  ["ChinaGrowing", "rhodium", 181.9, 192.0],
  ["ChinaGrowing", "forecast?", 192.0, 206.4],
  ["ChinaGrowing", "Like", 211.7, 214.6],
  ["ChinaGrowing", "somewhere", 214.6, 221.8],
  ["ChinaGrowing", "in", 221.8, 226.6],
  ["ChinaGrowing", "the", 226.6, 228.5],
  ["ChinaGrowing", "one", 228.5, 232.3],
  ["ChinaGrowing", "to", 232.3, 237.1],
  ["ChinaGrowing", "three?", 237.1, 242.9],
  ["ChinaGrowing", "At", 247.2, 252.0],
  ["ChinaGrowing", "the", 252.0, 255.4],
  ["ChinaGrowing", "start", 255.4, 260.6],
  ["ChinaGrowing", "of", 260.6, 263.0],
  ["ChinaGrowing", "the", 263.0, 265.4],
  ["ChinaGrowing", "year,", 265.4, 272.6],
  ["ChinaGrowing", "we", 279.4, 280.8],
  ["ChinaGrowing", "expected", 280.8, 289.9],
  ["ChinaGrowing", "growth", 289.9, 298.1],
  ["ChinaGrowing", "in", 298.1, 302.9],
  ["ChinaGrowing", "the", 302.9, 304.8],
  ["ChinaGrowing", "range", 304.8, 310.6],
  ["ChinaGrowing", "of", 310.6, 313.9],
  ["ChinaGrowing", "one", 313.9, 318.2],
  ["ChinaGrowing", "to", 318.2, 321.6],
  ["ChinaGrowing", "2", 321.6, 326.4],
  ["ChinaGrowing", ".5", 326.4, 337.9],
  ["ChinaGrowing", "percent.", 337.9, 346.1],
  ["NegativeGrowth", "We", 353.3, 356.6],
  ["NegativeGrowth", "would", 356.6, 361.0],
  ["NegativeGrowth", "argue", 361.0, 367.2],
  ["NegativeGrowth", "we're", 367.2, 373.0],
  ["NegativeGrowth", "trending", 373.0, 380.2],
  ["NegativeGrowth", "well", 380.2, 388.3],
  ["NegativeGrowth", "below", 388.3, 395.5],
  ["NegativeGrowth", "that", 395.5, 402.7],
  ["NegativeGrowth", "at", 402.7, 413.8],
  ["NegativeGrowth", "this", 413.8, 419.0],
  ["NegativeGrowth", "stage.", 419.0, 426.7],
  ["NegativeGrowth", "And", 426.7, 435.4],
  ["NegativeGrowth", "we're", 435.4, 439.7],
  ["NegativeGrowth", "likely", 439.7, 450.7],
  ["NegativeGrowth", "seeing", 450.7, 461.3],
  ["NegativeGrowth", "negative", 461.3, 469.9],
  ["NegativeGrowth", "growth", 469.9, 479.5],
  ["NegativeGrowth", "in", 479.5, 483.8],
  ["NegativeGrowth", "Q2", 483.8, 493.9],
  ["NegativeGrowth", "and", 493.9, 499.2],
  ["NegativeGrowth", "Q3", 499.2, 513.6],
  ["NegativeGrowth", "because", 513.6, 522.7],
  ["NegativeGrowth", "investment", 522.7, 538.6],
  ["NegativeGrowth", "in", 538.6, 545.3],
  ["NegativeGrowth", "China", 545.3, 552.5],
  ["NegativeGrowth", "is", 552.5, 563.5],
  ["NegativeGrowth", "contracting.", 563.5, 579.4],
  ["CovidExcuse", "And", 601.6, 607.3],
  ["CovidExcuse", "we", 607.3, 615.5],
  ["CovidExcuse", "had", 615.5, 623.6],
  ["CovidExcuse", "this", 623.6, 630.8],
  ["CovidExcuse", "excuse", 630.8, 645.2],
  ["CovidExcuse", "sort", 645.2, 659.2],
  ["CovidExcuse", "of", 659.2, 666.8],
  ["CovidExcuse", "of", 666.8, 676.9],
  ["CovidExcuse", "COVID", 676.9, 689.4],
  ["CovidExcuse", "that", 689.4, 697.1],
  ["CovidExcuse", "things", 697.1, 702.4],
  ["CovidExcuse", "were", 702.4, 705.7],
  ["CovidExcuse", "going", 705.7, 708.1],
  ["CovidExcuse", "to", 708.1, 710.0],
  ["CovidExcuse", "come", 710.0, 714.8],
  ["CovidExcuse", "back.", 714.8, 722.5],
  ["CovidExcuse", "And", 726.8, 736.0],
  ["CovidExcuse", "it's", 736.0, 746.0],
  ["CovidExcuse", "the", 746.0, 748.9],
  ["CovidExcuse", "fall", 748.9, 756.6],
  ["CovidExcuse", "of", 756.6, 760.9],
  ["CovidExcuse", "2026", 760.9, 775.8],
  ["CovidExcuse", "and", 775.8, 794.5],
  ["CovidExcuse", "they", 794.5, 797.9],
  ["CovidExcuse", "haven't.", 797.9, 807.5],
  ["CovidExcuse", "And", 809.9, 813.2],
  ["CovidExcuse", "that", 813.2, 819.5],
  ["TrulyDramatic", "But,", 830.2, 841.7],
  ["TrulyDramatic", "you", 842.2, 849.4],
  ["TrulyDramatic", "know,", 849.4, 850.8],
  ["TrulyDramatic", "going", 854.2, 860.9],
  ["TrulyDramatic", "from", 860.9, 873.4],
  ["TrulyDramatic", "seven", 873.4, 889.7],
  ["TrulyDramatic", "to", 889.7, 902.2],
  ["TrulyDramatic", "maybe", 902.2, 916.1],
  ["TrulyDramatic", "one", 916.1, 922.3],
  ["TrulyDramatic", "and", 922.3, 925.2],
  ["TrulyDramatic", "a", 925.2, 927.6],
  ["TrulyDramatic", "half", 927.6, 934.3],
  ["TrulyDramatic", "is", 934.3, 943.9],
  ["TrulyDramatic", "like", 943.9, 951.1],
  ["TrulyDramatic", "a", 951.1, 960.7],
  ["TrulyDramatic", "truly", 960.7, 972.7],
  ["TrulyDramatic", "dramatic", 972.7, 991.9],
  ["TrulyDramatic", "thing", 991.9, 1001.0],
  ["TrulyDramatic", "for", 1001.0, 1013.5],
  ["TrulyDramatic", "the", 1013.5, 1025.5],
  ["TrulyDramatic", "Chinese", 1025.5, 1032.7],
  ["TrulyDramatic", "and", 1032.7, 1045.2],
  ["TrulyDramatic", "global", 1045.2, 1065.8],
  ["TrulyDramatic", "economy.", 1065.8, 1072.6],
];
/** S onset of the n-th (0-based) occurrence of `word` in `cut`. Throws if absent. */
export const wordOn = (cut: CutName, word: string, nth = 0): number => {
  let seen = 0;
  for (const [c, w, on] of WORDS) {
    if (c === cut && w === word) {
      if (seen === nth) return on;
      seen++;
    }
  }
  throw new Error(`wordOn: no "${word}" #${nth} in ${cut}`);
};

// ---------------------------------------------------------------------------
// COORDINATES (world px, y grows down).
// ---------------------------------------------------------------------------
export const S_Y = 100; // world px per percentage point
export const Y0 = 2000; // the time axis IS the zero line
export const yOf = (v: number) => Y0 - S_Y * v;
export const vOf = (y: number) => (Y0 - y) / S_Y;

export type Pt = { x: number; y: number };
/** A named point: x, its growth value v (%), and y = yOf(v). */
export type NamedPt = { x: number; v: number; y: number };
const np = (x: number, v: number): NamedPt => ({ x, v, y: yOf(v) });

export const LINE0 = np(100, 9.0); // the line's start, at the left frame edge on S 0
export const P10 = np(260, 10.0); // data point "10,"
export const P7Z = np(430, 7.0); // data point "7," (the early zigzag)
export const P8 = np(600, 8.0); // data point "8"
export const SHOULDER = np(760, 7.9); // "now": the slide starts (a smooth roll-over)
export const COVID_PT = np(940, 6.0); // cut 3's "COVID"
export const YEAR_X0 = 1180; // 2026 starts ("at the start of the year")
export const YEAR_X1 = 1580; // 2026 ends; quarters are 100 px wide
export const Q2_X = 1330; // quarter centre
export const Q3_X = 1430; // quarter centre
export const FALL_X = 1490; // "fall of 2026": cut 3's FALL 2026 tick
export const BRACKET_X = 1300; // cut 4's vertical bracket 7 % -> 1.5 %
export const AXIS_X0 = 100; // the axis starts under LINE0
export const AXIS_END = 1680; // the axis rests here
export const TIP_END = np(1505, -1.45); // where the tip has crept to at S 1087
export const BAND_X0 = YEAR_X0;
export const BAND_X1 = YEAR_X1;
/** Where the band's label column sits: the part of the band the line never crosses. */
export const BAND_LABEL_X = 1420;

// ---------------------------------------------------------------------------
// THE GROWTH LINE. LINE0 -> P10 -> P7Z -> P8 are straight legs with small
// rounded corners (a quadratic Bezier CORNER_D px down each leg, control point
// on the vertex) and a dot on each data point. From P8 on it is ONE monotone
// (PCHIP) cubic v(x) through the knots below, so it reads as data, never wobbles
// (no overshoot between knots) and never kinks. Unnamed knots nudged inside the
// brief's +-10 px / +-0.1 %: the hump (680, 8.25) -> (690, 8.15) so P8 keeps a
// visible corner under a concave hump; (1020, 4.75) -> (1020, 4.85) and
// (1100, 3.6) -> (1100, 3.7) so the slide from COVID to the band is one even
// decline instead of an ease-and-steepen. The S 452/460 timing knots (1270, 0.10)
// and (1272, 0.06) are not shape knots: the spline already passes there.
// ---------------------------------------------------------------------------
export const CORNER_D = 14;
/** The first knot's slope (dv/dx, % per px) is set, not estimated: it leaves P8
 *  at ~19 degrees (the leg arrives at ~30) so P8 reads as a corner, and the hump
 *  above it stays concave. */
const P8_OUT_SLOPE = 0.0034;
/** A knot: x, value %, and optionally a FIXED slope dv/dx (% per px) that
 *  overrides PCHIP's estimate. */
export type Knot = readonly [x: number, v: number, slope?: number];
export const SPLINE_KNOTS: readonly Knot[] = [
  [600, 8.0, P8_OUT_SLOPE],
  [690, 8.15],
  [760, 7.9],
  [940, 6.0],
  [1020, 4.85],
  [1100, 3.7],
  [1180, 2.6],
  [1215, 2.0],
  [1245, 1.0],
  [1262, 0.4],
  [1300, -0.75],
  // THE FLOOR (director's note on v1: "one gentle, continuous decline ... it
  // should look like the line keeps being pulled down, not like it falls off a
  // step"). The plunge rounds into Q2 (~ -1.0 %); from there the decline only
  // steepens, slope -0.0018 -> -0.0028 (Q3, ~ -1.22 %) -> -0.0038 (1490, the
  // sink's end at S 586), then levels into TIP_END. Every floor segment's mean
  // slope equals the mean of its end slopes, so each one is a pure quadratic:
  // no S, no wobble, no corner. Replaces (1330, -1.05), (1380, -1.10),
  // (1430, -1.15), (1480, -1.45).
  [1330, -0.9935, -0.0018],
  [1430, -1.2235, -0.0028],
  [1490, -1.4215, -0.0038],
  [1505, -1.45, 0],
];

const KX = SPLINE_KNOTS.map((k) => k[0]);
const KV = SPLINE_KNOTS.map((k) => k[1]);
const KS = SPLINE_KNOTS.map((k) => k[2]);
const pchipEdge = (h0: number, h1: number, d0: number, d1: number) => {
  let m = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
  if (Math.sign(m) !== Math.sign(d0)) m = 0;
  else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(m) > Math.abs(3 * d0)) m = 3 * d0;
  return m;
};
const KM = (() => {
  const n = KX.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(KX[i + 1] - KX[i]);
    d.push((KV[i + 1] - KV[i]) / h[i]);
  }
  const m: number[] = [];
  for (let i = 0; i < n; i++) m.push(0);
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] === 0 || d[i] === 0 || Math.sign(d[i - 1]) !== Math.sign(d[i])) {
      m[i] = 0;
    } else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  m[0] = pchipEdge(h[0], h[1], d[0], d[1]);
  m[n - 1] = pchipEdge(h[n - 2], h[n - 3], d[n - 2], d[n - 3]);
  for (let i = 0; i < n; i++) {
    const fixed = KS[i];
    if (fixed !== undefined) m[i] = fixed;
  }
  return m;
})();

/** The spline's growth value at x (x >= 600), % */
export const splineV = (x: number): number => {
  const n = KX.length;
  if (x <= KX[0]) return KV[0] + KM[0] * (x - KX[0]);
  if (x >= KX[n - 1]) return KV[n - 1];
  let i = 0;
  while (i < n - 2 && x > KX[i + 1]) i++;
  const h = KX[i + 1] - KX[i];
  const t = (x - KX[i]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * KV[i] +
    (t3 - 2 * t2 + t) * h * KM[i] +
    (-2 * t3 + 3 * t2) * KV[i + 1] +
    (t3 - t2) * h * KM[i + 1]
  );
};

/** x where the spline crosses value v, searched in [a, b] by bisection. */
const crossX = (v: number, a: number, b: number) => {
  let lo = a;
  let hi = b;
  const fa = splineV(lo) - v;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    const fm = splineV(mid) - v;
    if (Math.sign(fm) === Math.sign(fa)) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
/** The exact 7.0 % crossing of the slide (cut 4's "seven"). */
export const P7S = np(crossX(7.0, SHOULDER.x, COVID_PT.x), 7.0);
/** The exact 1.5 % crossing inside the band (cut 4's "one and a half"). */
export const P15 = np(crossX(1.5, 1215, 1245), 1.5);
/** The exact zero crossing ("negative"). */
export const ZERO_X = crossX(0, 1262, 1300);
export const ZERO_PT = np(ZERO_X, 0);

// --- the dense path, resampled at 1 world px of arc ------------------------
type Seg = (u: number) => Pt;
const lerpPt = (a: Pt, b: Pt, u: number): Pt => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
const unit = (a: Pt, b: Pt): Pt => {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
};
const quad = (a: Pt, c: Pt, b: Pt): Seg => (u) => ({
  x: (1 - u) * (1 - u) * a.x + 2 * u * (1 - u) * c.x + u * u * b.x,
  y: (1 - u) * (1 - u) * a.y + 2 * u * (1 - u) * c.y + u * u * b.y,
});
const splinePt = (x: number): Pt => ({ x, y: yOf(splineV(x)) });

const CORNER = (() => {
  const l0: Pt = LINE0;
  const v10: Pt = P10;
  const v7: Pt = P7Z;
  const v8: Pt = P8;
  const u01 = unit(l0, v10);
  const u12 = unit(v10, v7);
  const u23 = unit(v7, v8);
  const a10 = { x: v10.x - CORNER_D * u01.x, y: v10.y - CORNER_D * u01.y };
  const b10 = { x: v10.x + CORNER_D * u12.x, y: v10.y + CORNER_D * u12.y };
  const a7 = { x: v7.x - CORNER_D * u12.x, y: v7.y - CORNER_D * u12.y };
  const b7 = { x: v7.x + CORNER_D * u23.x, y: v7.y + CORNER_D * u23.y };
  const a8 = { x: v8.x - CORNER_D * u23.x, y: v8.y - CORNER_D * u23.y };
  // P8's outgoing side is the spline: end the corner on the spline itself and
  // put the control point where the incoming leg meets the spline's tangent
  // there, so the join is tangent-continuous on both sides.
  const slopeY = -S_Y * P8_OUT_SLOPE; // dy/dx of the spline at P8
  const bx = v8.x + CORNER_D / Math.sqrt(1 + slopeY * slopeY);
  const b8 = splinePt(bx);
  const eps = 0.01;
  const tY = (splinePt(bx + eps).y - splinePt(bx - eps).y) / (2 * eps); // dy/dx at b8
  // incoming leg: y = a8.y + (x - a8.x) * (u23.y / u23.x); tangent: y = b8.y + (x - b8.x) * tY
  const sIn = u23.y / u23.x;
  const cx = (b8.y - a8.y + sIn * a8.x - tY * b8.x) / (sIn - tY);
  const c8 = { x: cx, y: a8.y + (cx - a8.x) * sIn };
  return { a10, b10, a7, b7, a8, b8, c8 };
})();

const PATH = (() => {
  const raw: Pt[] = [];
  const pushSeg = (f: Seg, n: number, skipFirst: boolean) => {
    for (let i = skipFirst ? 1 : 0; i <= n; i++) raw.push(f(i / n));
  };
  const C = CORNER;
  pushSeg((u) => lerpPt(LINE0, C.a10, u), 200, false);
  pushSeg(quad(C.a10, P10, C.b10), 60, true);
  pushSeg((u) => lerpPt(C.b10, C.a7, u), 400, true);
  pushSeg(quad(C.a7, P7Z, C.b7), 60, true);
  pushSeg((u) => lerpPt(C.b7, C.a8, u), 240, true);
  pushSeg(quad(C.a8, C.c8, C.b8), 60, true);
  const xEnd = SPLINE_KNOTS[SPLINE_KNOTS.length - 1][0];
  const n = Math.ceil((xEnd - C.b8.x) * 8);
  pushSeg((u) => splinePt(C.b8.x + (xEnd - C.b8.x) * u), n, true);
  // cumulative length of the raw polyline
  const cum: number[] = [0];
  for (let i = 1; i < raw.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));
  }
  const total = cum[cum.length - 1];
  // resample at exactly 1 px of arc
  const N = Math.floor(total);
  const xs = new Float64Array(N + 2);
  const ys = new Float64Array(N + 2);
  let j = 0;
  for (let i = 0; i <= N + 1; i++) {
    const s = Math.min(total, i);
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const seg = cum[j + 1] - cum[j];
    const u = seg > 0 ? (s - cum[j]) / seg : 0;
    xs[i] = raw[j].x + (raw[j + 1].x - raw[j].x) * u;
    ys[i] = raw[j].y + (raw[j + 1].y - raw[j].y) * u;
  }
  return { xs, ys, total };
})();

/** Total arc length of the growth line, world px. */
export const PATH_LEN = PATH.total;

/** The point at arc length `len` (clamped to the line). */
export const pathPoint = (len: number): Pt => {
  const s = Math.max(0, Math.min(PATH.total, len));
  // samples sit at whole px of arc, except the last, which sits at `total`
  const N = PATH.xs.length - 2;
  let i: number;
  let u: number;
  if (s >= N) {
    i = N;
    const seg = PATH.total - N;
    u = seg > 0 ? (s - N) / seg : 0;
  } else {
    i = Math.floor(s);
    u = s - i;
  }
  return {
    x: PATH.xs[i] + (PATH.xs[i + 1] - PATH.xs[i]) * u,
    y: PATH.ys[i] + (PATH.ys[i + 1] - PATH.ys[i]) * u,
  };
};

/** Unit tangent of the line at arc length `len`. */
export const pathTangent = (len: number): Pt => {
  const a = pathPoint(len - 1);
  const b = pathPoint(len + 1);
  return unit(a, b);
};

/** Arc length at which the line reaches x (x is monotone along the line). */
export const lenAtX = (x: number): number => {
  const xs = PATH.xs;
  const last = xs.length - 1;
  if (x <= xs[0]) return 0;
  if (x >= xs[last]) return PATH.total;
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid;
  }
  const u = (x - xs[lo]) / (xs[hi] - xs[lo] || 1);
  // the last segment is shorter than 1 px of arc
  const segLen = lo === last - 1 ? PATH.total - lo : 1;
  return Math.min(PATH.total, lo + u * segLen);
};

/** The line's y at x, world px (as drawn, corners included). */
export const lineYAtX = (x: number): number => pathPoint(lenAtX(x)).y;
/** The line's growth value at x, %. */
export const valueAtX = (x: number): number => vOf(lineYAtX(x));

/** Arc length (after the shoulder) at which the line first reaches value v. */
const lenAtValue = (v: number, xa: number, xb: number) => lenAtX(crossX(v, xa, xb));

/** An SVG path `d` of the line between two arc lengths (a polyline at 1 px). */
export const pathD = (len0: number, len1: number): string => {
  const a = Math.max(0, Math.min(PATH.total, len0));
  const b = Math.max(0, Math.min(PATH.total, len1));
  if (b - a <= 0.01) return "";
  const p0 = pathPoint(a);
  const parts: string[] = [`M${p0.x.toFixed(2)} ${p0.y.toFixed(2)}`];
  for (let i = Math.floor(a) + 1; i < b; i++) {
    parts.push(`L${PATH.xs[i].toFixed(2)} ${PATH.ys[i].toFixed(2)}`);
  }
  const p1 = pathPoint(b);
  parts.push(`L${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`);
  return parts.join("");
};

/** The polyline between two arc lengths as points (for clip regions). */
export const pathPoints = (len0: number, len1: number, step = 2): Pt[] => {
  const a = Math.max(0, Math.min(PATH.total, len0));
  const b = Math.max(0, Math.min(PATH.total, len1));
  const out: Pt[] = [pathPoint(a)];
  for (let s = Math.ceil(a / step) * step; s < b; s += step) {
    if (s > a) out.push(pathPoint(s));
  }
  out.push(pathPoint(b));
  return out;
};

/** Arc length of the vertex points: the corner's closest approach to the
 *  vertex (the Bezier's midpoint). The vertex DOT sits on the vertex itself. */
const quadMidLen = (vtx: Pt) => {
  // the closest resampled point to the vertex
  let best = 0;
  let bd = Infinity;
  const i0 = Math.max(0, Math.floor(lenAtX(vtx.x - 40)));
  const i1 = Math.min(PATH.xs.length - 1, Math.ceil(lenAtX(vtx.x + 40)));
  for (let i = i0; i <= i1; i++) {
    const d = Math.hypot(PATH.xs[i] - vtx.x, PATH.ys[i] - vtx.y);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
};
export const LEN_P10 = quadMidLen(P10);
export const LEN_P7Z = quadMidLen(P7Z);
export const LEN_P8 = quadMidLen(P8);
export const LEN_P7S = lenAtX(P7S.x);
export const LEN_COVID = lenAtX(COVID_PT.x);
export const LEN_P15 = lenAtX(P15.x);
export const LEN_ZERO = lenAtX(ZERO_X);
export const LEN_Q2 = lenAtX(Q2_X);
export const LEN_Q3 = lenAtX(Q3_X);
export const LEN_TIP_END = lenAtX(TIP_END.x);

// ---------------------------------------------------------------------------
// THE TIP. tipAt(S) is ONE C1 function: arc length along the line vs S, built
// as cubic Hermite segments through (S, arc, speed) knots up to Q3, then a
// decaying creep plus the investment sink. Everything the tip "reaches" keys
// off it. Speeds are world px of arc per frame.
//   S 0-62     the draw IS "growing": up to P10 (S 29, "10,"), down to P7Z
//              (S 47, "7,"), up to P8 (S 62, "8"); it decelerates into each
//              vertex (3.5 px/f) and never stops.
//   S 62-110   rides the gentle hump ("things were looking great").
//   S 110-353  the slide, one even speed from the shoulder ("now") to just
//              above the band's top-left corner (S 353, x 1180, 2.6 %).
//   S 353-398  into the band and through it ("trending"), steepening; out of
//              its bottom edge (1 %) by S 398 ("well below that").
//   S 398-460  decelerates toward zero; HELD BREATH S 452-460 (0.10 % -> 0.06 %,
//              ~0.5 px/f): it presses on the axis.
//   S 460-463  breaks through zero ("negative" S 461.3) and plunges: peak
//              ~12 px/f at ~S 467, passing Q2_X ~S 475 and Q3_X at S 491.
//   S 491-     decaying creep (tau 4.5 f) toward CREEP_V down the floor, plus
//              the investment sink S 556-586 (sinkE, the SAME eased variable
//              that contracts the INVESTMENT bar) to (SINK_X 1490, -1.42 %),
//              then ~0.03 px/f to TIP_END (1505, -1.45 %) at S 1087.
// ---------------------------------------------------------------------------
type TipKnot = { S: number; len: number; v: number };
export const S_BREAK = 463; // the tip reaches 0.0 %: the dent lets go
export const SINK_S0 = 556; // "contracting"
export const SINK_S1 = 586;
/** The investment curve: 0 -> 1 over S 556-586. Drives BOTH the bar's
 *  contraction and the tip's sink, so the bar's contraction is the pull. */
export const sinkE = (S: number) => smoothstep((S - SINK_S0) / (SINK_S1 - SINK_S0));

const LEN_X680 = lenAtX(690);
const LEN_SHOULDER = lenAtX(SHOULDER.x);
const LEN_Y0 = lenAtX(YEAR_X0);
const SLIDE_V = (LEN_Y0 - LEN_SHOULDER) / (353 - 110);
const TIP_KNOTS: TipKnot[] = [
  { S: 0, len: 26, v: 6.2 },
  { S: 29, len: LEN_P10, v: 3.5 },
  { S: 47, len: LEN_P7Z, v: 3.5 },
  { S: 62, len: LEN_P8, v: 3.5 },
  { S: 87, len: LEN_X680, v: 3.3 },
  { S: 110, len: LEN_SHOULDER, v: SLIDE_V },
  { S: 353, len: LEN_Y0, v: SLIDE_V },
  { S: 398, len: lenAtX(1245), v: 4.0 },
  { S: 425, len: lenAtX(1262), v: 1.35 },
  { S: 452, len: lenAtValue(0.1, 1262, 1300), v: 0.6 },
  { S: 460, len: lenAtValue(0.06, 1262, 1300), v: 0.45 },
  { S: S_BREAK, len: LEN_ZERO, v: 3.5 },
  { S: 471, len: lenAtX(1300), v: 11.0 },
  { S: 475.4, len: LEN_Q2, v: 9.3 },
  { S: 481.5, len: lenAtX(1380), v: 7.0 },
  { S: 491, len: LEN_Q3, v: 2.5 },
];
const KQ3 = TIP_KNOTS[TIP_KNOTS.length - 1];
const CREEP_TAU = 4.5;
/** Where the sink ends (S 586): (1490, -1.42 %). */
export const SINK_X = 1490;
const LEN_SINK = lenAtX(SINK_X);
const decayed = (s: number) => (KQ3.v - CREEP_V_RAW) * CREEP_TAU * (1 - Math.exp(-s / CREEP_TAU));
// CREEP_V solves "TIP_END exactly at S 1087" (it comes out at ~0.05 px/f).
const CREEP_V_RAW = (() => {
  const s1 = 586 - KQ3.S;
  const s2 = S_END - KQ3.S;
  const e = Math.exp(-s1 / CREEP_TAU) - Math.exp(-s2 / CREEP_TAU);
  return (LEN_TIP_END - LEN_SINK - KQ3.v * CREEP_TAU * e) / (s2 - s1 - CREEP_TAU * e);
})();
export const CREEP_V = CREEP_V_RAW;
const creep = (s: number) => CREEP_V_RAW * s + decayed(s);
/** Arc the sink adds over S 556-586 so the tip is on (SINK_X, -1.42 %) at S 586. */
export const SINK_LEN = LEN_SINK - KQ3.len - creep(586 - KQ3.S);

const hermite = (S: number, a: TipKnot, b: TipKnot) => {
  const h = b.S - a.S;
  const t = (S - a.S) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.len + (t3 - 2 * t2 + t) * h * a.v + (-2 * t3 + 3 * t2) * b.len + (t3 - t2) * h * b.v;
};

/** Arc length of the tip at S (the drawn line is [0, tipLen(S)]). */
export const tipLen = (S: number): number => {
  if (S <= TIP_KNOTS[0].S) return Math.max(0, TIP_KNOTS[0].len + TIP_KNOTS[0].v * (S - TIP_KNOTS[0].S));
  if (S <= KQ3.S) {
    let i = 0;
    while (i < TIP_KNOTS.length - 2 && S > TIP_KNOTS[i + 1].S) i++;
    return hermite(S, TIP_KNOTS[i], TIP_KNOTS[i + 1]);
  }
  const s = S - KQ3.S;
  return Math.min(PATH.total, KQ3.len + creep(s) + SINK_LEN * sinkE(S));
};

/** The tip at S: arc length, and where it is. */
export const tipAt = (S: number): { len: number; x: number; y: number } => {
  const len = tipLen(S);
  const p = pathPoint(len);
  return { len, x: p.x, y: p.y };
};

/** The first S at which the tip's arc length reaches `len` (bisection; the tip
 *  is monotone). Use it to key "the tip passes X" off the tip itself. */
export const sAtLen = (len: number): number => {
  let lo = -40;
  let hi = S_END + 40;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (tipLen(mid) < len) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
/** The S at which the tip passes x. */
export const sAtX = (x: number) => sAtLen(lenAtX(x));

// ---------------------------------------------------------------------------
// THE SIZE LAW: screen size ~ k^0.75, normalised at K_REF. A world size is
// base x sz(k) with the CURRENT camera k. Strokes, dot/ring radii, label sizes,
// dash lengths, hatch pitch.
// ---------------------------------------------------------------------------
export const K_REF = 1.2;
export const sz = (k: number) => Math.pow(k / K_REF, -0.25);

// --- ink -------------------------------------------------------------------
export const INK = "#FFFFFF";
export const INK_HI = 1.0; // the subject right now
export const INK_LO = 0.5; // context
export const BAND_TINT = 0.1; // the forecast band's area tint, the one other white alpha
export const DATA_W = 9; // world px at K_REF: the orange line only (7 -> 9 on the director's v1 note)
export const INK_W = 3.5; // world px at K_REF: every white line
export const DOT_R = 11.5; // world px at K_REF: the tip and the vertex dots (9 -> 11.5, in proportion to DATA_W)
export const HEAD_R = 1.1; // a head-led line's head radius, x its stroke width
export const DASH = 16; // world px at K_REF
export const DASH_GAP = 12;
/** Dashes march 0.5 world px per S frame (~0.6 screen px at K_REF). */
export const MARCH_W = 0.5;
export const HATCH_PITCH = 15; // world px at K_REF between hatch lines
export const TICK_HALF = 13; // world px at K_REF: half a tick's length
// --- labels (Roboto Condensed Bold caps, 0.04 em) ----------------------------
export const VALUE_PX = 50; // screen px at K_REF: the spoken numbers
export const WORD_PX = 36; // screen px at K_REF: words
export const TRACK_EM = 0.04;
/** Roboto Condensed cap height, em (1456 / 2048). */
export const CAP_EM = 0.711;
/** World font size of a label class at camera k. */
/** The wide-shot floor (director, round 2): a label's SCREEN size never drops
 *  below LABEL_FLOOR of its K_REF screen size (values >= 40 px, words >= 28.8 px).
 *  It binds only below k ~0.894, so nothing at k >= 0.9 changes. */
export const LABEL_FLOOR = 0.8;
export const labelPx = (size: "value" | "word", k: number) => {
  const px = size === "value" ? VALUE_PX : WORD_PX;
  return Math.max((px / K_REF) * sz(k), (LABEL_FLOOR * px) / k);
};
/** Text entrance: slide UP 24 screen px + fade 0 -> 1 over 12 f, ease-out cubic
 *  slide, smoothstep fade; it lands ON its word, so it starts 8 f before it. */
export const ENTER_F = 12;
export const ENTER_LEAD = 8;
export const EXIT_F = 10;
export const RISE_PX = 24;
/** Raw entrance progress (0..1, linear) of a label that lands on `wordS`. */
export const enterU = (S: number, wordS: number) => clamp01((S - (wordS - ENTER_LEAD)) / ENTER_F);
/** Raw entrance progress of one that STARTS at `startS` (a mechanism start). */
export const enterFrom = (S: number, startS: number) => clamp01((S - startS) / ENTER_F);
/** Raw exit progress (0..1, linear) of an exit that starts at `startS`. */
export const exitU = (S: number, startS: number) => clamp01((S - startS) / EXIT_F);
/** A white element's rung change: eased over 12 f from `startS`. */
export const RUNG_F = 12;
export const rungEase = (S: number, startS: number) => smoothstep((S - startS) / RUNG_F);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
export const easeInCubic = (u: number) => Math.pow(clamp01(u), 3);
/** Dots and rings scale in from 0 over 8 f, ease-out. */
export const GROW_F = 8;
export const growU = (S: number, startS: number) => easeOutCubic((S - startS) / GROW_F);

// ---------------------------------------------------------------------------
// THE CAMERA RIG — copied from outgrowShared.tsx. A camera is its own keyed
// track: a list of GLIDES, each an eased delta of (look x, look y, ln k) over
// [f0, f1]. Glides SUPERPOSE, so overlapping ones blend into one continuous
// move, and each one's velocity is zero at both ends, so the sum is C1. Then the
// same damped follower as every approved piece (CAM_STIFF / CAM_DAMP).
// `look` is the content centre; the camera centre is look + CAM_LIFT / k, so the
// content lands at screen y 835 above the captions.
// Additions: `even` gives a glide a constant-speed middle (velocity ramps up
// over the first `even` fraction and down over the last) for "long, even
// creeps"; `start` / `f` are in the track's own frame numbers (S - S0).
// ---------------------------------------------------------------------------
export type Glide = { f0: number; f1: number; dx?: number; dy?: number; k?: number; warp?: number; even?: number };
export type Cam = { x: number; y: number; k: number };
export const camEase = (u: number, warp = 1) => smoothstep(Math.pow(clamp01(u), warp));
/** Position fraction of a trapezoidal-velocity move: ramps take fraction r. */
export const evenEase = (u: number, r: number) => {
  const x = clamp01(u);
  const rr = Math.max(0.01, Math.min(0.5, r));
  const vmax = 1 / (1 - rr); // area under the trapezoid = 1
  if (x < rr) return (vmax * x * x) / (2 * rr);
  if (x > 1 - rr) {
    const y = 1 - x;
    return 1 - (vmax * y * y) / (2 * rr);
  }
  return (vmax * rr) / 2 + vmax * (x - rr);
};
const glideE = (g: Glide, f: number) => {
  const u = (f - g.f0) / (g.f1 - g.f0);
  return g.even !== undefined ? evenEase(u, g.even) : camEase(u, g.warp ?? 1);
};

/** Look-space target per frame (before the follower): {x, y: look y, k}. */
export const glideTargets = (start: Cam, glides: Glide[], frames: number): Cam[] => {
  const T: Cam[] = [];
  for (let f = 0; f <= frames + 2; f++) {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const e = glideE(g, f);
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    T.push({ x, y, k: Math.exp(lk) });
  }
  return T;
};

/** The damped camera: `start` is the LOOK (content centre) and k at frame 0;
 *  returns CAMERA centres (y = look y + CAM_LIFT / k) for frames 0..frames+2. */
export const cameraTrack = (start: Cam, glides: Glide[], frames: number): Cam[] => {
  const T = glideTargets(start, glides, frames).map((t) => ({ x: t.x, y: t.y + CAM_LIFT / t.k, k: t.k }));
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let f = 0; f < T.length; f++) {
    if (f > 0) {
      const t = T[f];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    out.push({ ...c });
  }
  return out;
};

/** A camera centre from a LOOK (content centre) and k. */
export const camFromLook = (x: number, y: number, k: number): Cam => ({ x, y: y + CAM_LIFT / k, k });
/** The LOOK (content centre) of a camera. */
export const lookOf = (c: Cam): Cam => ({ x: c.x, y: c.y - CAM_LIFT / c.k, k: c.k });

/** Where a world point lands on screen under camera c (no sway). */
export const toScreen = (c: Cam, x: number, y: number) => ({
  x: FRAME_W / 2 + (x - c.x) * c.k,
  y: FRAME_H / 2 + (y - c.y) * c.k,
});

/** Camera smoothness, measured the way the brief asks: the screen velocity of
 *  fixed world points, and the largest change of it between frames. */
export const camJerk = (track: Cam[], frames: number) => {
  let maxA = 0;
  let at = 0;
  let maxV = 0;
  const pts = [
    [-200, -300],
    [200, 300],
    [0, 0],
  ];
  for (let f = 1; f < frames - 1; f++) {
    for (const [ox, oy] of pts) {
      const wx = track[f].x + ox / track[f].k;
      const wy = track[f].y + oy / track[f].k;
      const s0 = toScreen(track[f - 1], wx, wy);
      const s1 = toScreen(track[f], wx, wy);
      const s2 = toScreen(track[f + 1], wx, wy);
      const v1 = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      const ax = s2.x - 2 * s1.x + s0.x;
      const ay = s2.y - 2 * s1.y + s0.y;
      const a = Math.hypot(ax, ay);
      if (a > maxA) {
        maxA = a;
        at = f;
      }
      maxV = Math.max(maxV, v1);
    }
  }
  return { maxA, at, maxV };
};

/** The same measure over a camera FUNCTION on an S range [S0, S1]. */
export const camJerkAt = (camAt: (S: number) => Cam, S0: number, S1: number) => {
  const track: Cam[] = [];
  for (let S = S0; S <= S1; S++) track.push(camAt(S));
  const r = camJerk(track, track.length);
  return { maxA: r.maxA, atS: S0 + r.at, maxV: r.maxV };
};

// ---------------------------------------------------------------------------
// JOIN_34, fixed by the director: look (1440, yOf(0.2)) at k 1.30. camSeg3(829)
// and camSeg4(829) both equal it exactly.
// ---------------------------------------------------------------------------
export const JOIN_34: Cam = camFromLook(1440, yOf(0.2), 1.3);
/** Join tolerance: 0.05 world px / 1e-4 in k. */
export const camEq = (a: Cam, b: Cam) =>
  Math.abs(a.x - b.x) <= 0.05 && Math.abs(a.y - b.y) <= 0.05 && Math.abs(a.k - b.k) <= 1e-4;
