// ---------------------------------------------------------------------------
// betCurvesGeo: the pure geometry of the nik-trend-friend chart world (no React, no fonts), so scripts can import
// it. Everything here is re-exported by betCurves.tsx; cuts import from betCurves.tsx.
//
// WORLD UNITS. World px. The origin (month 0, revenue 0) is (0, 0); x = months since launch x MX; revenue grows UP
// (negative y). No revenue scale exists: the curves are unlabelled proxy shapes.
// ---------------------------------------------------------------------------
import { random } from "remotion";

/** World px per month along the x axis. */
export const MX = 150;
/** The axis rule's y (revenue 0). */
export const AXIS_Y = 0;
/** The axis runs from the origin to this month (12 plus a little run-out). */
export const AXIS_END_M = 12.6;
/** Months since launch -> world x. */
export const monthX = (m: number) => m * MX;
/** World x -> months since launch. */
export const xMonth = (x: number) => x / MX;
/** A revenue value (world px above the axis) -> world y. */
export const revY = (r: number) => AXIS_Y - r;

// --- the shared shape of every curve ----------------------------------------------------------------------------
// G(m): a near-linear, slightly concave ramp that leaves the origin at a finite slope. Each pack line is A_i x G(m),
// so lines are scaled copies of one shape and never cross (a fast starter stays fast: "trend is your friend");
// a small per-line wobble lets close neighbours brush now and then.
const G_C = 0.35;
const G_P = 0.82;
export const shapeG = (m: number) => {
  const q = Math.max(0, m);
  return Math.pow(q + G_C, G_P) - Math.pow(G_C, G_P);
};

/** The pack's median coefficient (world px of revenue per unit of G). */
export const A_MED = 230;
/** The pack's log spread. */
const SIGMA = 0.45;

// Acklam-free inverse normal (Beasley-Springer-Moro, enough for 40 quantiles).
const invNorm = (p: number) => {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4761016441154, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
};

export type PackLine = {
  /** stable id 0..N-1, ordered from the lowest line (0) to the highest (N-1) */
  id: number;
  /** the line's coefficient over the shared shape */
  a: number;
  /** revenue (world px above the axis) at month m; monotone rising */
  rev: (m: number) => number;
  /** world point at month m */
  at: (m: number) => { x: number; y: number };
};

export const PACK_N = 40;
/** The front group: the top FRONT_N lines of the pack run close together, evenly spaced (FRONT_STEP apart in
 *  coefficient), so a product climbing to the front passes them one by one and leads them by a nose. */
export const FRONT_N = 5;
export const FRONT_A0 = 410;
export const FRONT_STEP = 30;
/** The pack: about 40 earlier bets. Lines 0..34: a dense middle band, a few low (normal quantiles in log space,
 *  jittered by random(seed)); lines 35..39: the front group. Ordered low -> high. Deterministic. */
export const packLines: readonly PackLine[] = Array.from({ length: PACK_N }, (_, i) => {
  const front = i >= PACK_N - FRONT_N;
  const z = invNorm((i + 0.5) / PACK_N) + (random(`bet-z-${i}`) - 0.5) * 0.12;
  const a = front ? FRONT_A0 + (i - (PACK_N - FRONT_N)) * FRONT_STEP : A_MED * Math.exp(SIGMA * z);
  // the front group barely wobbles: its lines run close and must never swap places
  const wAmp = (front ? 0.008 : 0.035) * (random(`bet-w-${i}`) * 2 - 1);
  const wFreq = 0.55 + 0.35 * random(`bet-f-${i}`);
  const wPh = random(`bet-p-${i}`) * Math.PI * 2;
  // the wobble: a small multiplicative term that is 0 at the origin and keeps the line monotone
  const rev = (m: number) => {
    const g = shapeG(m);
    const w = 1 + wAmp * (Math.sin(m * wFreq + wPh) - Math.sin(wPh)) * Math.min(1, m / 2);
    return a * g * w;
  };
  return { id: i, a, rev, at: (m: number) => ({ x: monthX(m), y: revY(rev(m)) }) };
});
/** The front group's lines, lowest first. */
export const frontLines: readonly PackLine[] = packLines.slice(PACK_N - FRONT_N);

/** The top of the pack (the highest revenue of any pack line) at month m. */
export const packTop = (m: number) => packLines.reduce((v, l) => Math.max(v, l.rev(m)), 0);
/** The bottom of the pack at month m. */
export const packBottom = (m: number) => packLines.reduce((v, l) => Math.min(v, l.rev(m)), Infinity);
/** The pack's median revenue at month m. */
export const packMedian = (m: number) => {
  const v = packLines.map((l) => l.rev(m)).sort((p, q) => p - q);
  return (v[PACK_N / 2 - 1] + v[PACK_N / 2]) / 2;
};

// --- weights (world px at camera k) -----------------------------------------------------------------------------
/** A pack line: 6.5 px on screen at every k (visible on a 270 px wide phone thumbnail, clearly under a hero line). */
export const packWeight = (k: number) => 6.5 / k;
/** A highlighted bet's line: a confident stroke, ~22 px on screen close, ~19 px at k 0.85, ~14 px at k 0.4. */
export const lineWeight = (k: number) => 20 / Math.pow(k, 0.7);
/** A pack tip (a small board product tile, no mark): ~55 px on screen at k 1.3, ~44 px at k 0.85, ~27 px at k 0.32. */
export const packTipSize = (k: number) => 48 / Math.sqrt(k);
/** The highlighted product's tile (world px, fixed: an object, not a mark). */
export const BET_TILE = 120;

// --- a sampler from a revenue function --------------------------------------------------------------------------
export type Sampler = (m: number) => { x: number; y: number };
/** Turn a revenue function into a world-point sampler. */
export const samplerOf = (rev: (m: number) => number): Sampler => (m) => ({ x: monthX(m), y: revY(rev(m)) });
/** A path d from month 0 to month m (sampled every `step` months, plus the exact end). */
export const pathTo = (s: Sampler, m: number, step = 0.08) => {
  const n6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
  if (m <= 0) return "";
  let d = "";
  let i = 0;
  for (let q = 0; q < m; q += step, i++) {
    const p = s(q);
    d += `${i ? "L" : "M"}${n6(p.x)} ${n6(p.y)}`;
  }
  const e = s(m);
  d += `L${n6(e.x)} ${n6(e.y)}`;
  return d;
};

/** A highlighted bet whose coefficient over the shared shape climbs from a0 (before month ma) to a1 (after month
 *  mb) on a smoothstep of the way, raised to `pw` (pw < 1 front-loads the climb): a product that rises through the
 *  pack (a0 < a1), or one that holds its place (a0 = a1). The curve has no corners (C1), and it is monotone rising
 *  for any a0 <= a1. Returns a revenue function. */
export const riserRev = (a0: number, a1: number, ma: number, mb: number, pw = 1) => (m: number) => {
  const u = Math.max(0, Math.min(1, (m - ma) / (mb - ma)));
  const e = u * u * (3 - 2 * u);
  return (a0 + (a1 - a0) * Math.pow(e, pw)) * shapeG(m);
};

/** The camera centre that puts the chart point (month m, revenue rev) at screen (sx, sy) at scale k. */
export const camOn = (m: number, rev: number, k: number, sx = 540, sy = 960) => ({
  x: monthX(m) - (sx - 540) / k,
  y: revY(rev) - (sy - 960) / k,
  k,
});

/** A highlighted bet whose coefficient follows keys [month, a] (a non-decreasing) on a monotone cubic (Fritsch-Carlson):
 *  no overshoot, no corners; flat before the first key and after the last. Returns a revenue function. */
export const keyedRev = (keys: readonly [number, number][]) => {
  const n = keys.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  const t: number[] = [0];
  for (let i = 1; i < n - 1; i++) t.push(d[i - 1] * d[i] <= 0 ? 0 : (3 * (d[i - 1] + d[i])) / ((d[i - 1] ? (2 * d[i] + d[i - 1]) / d[i - 1] : 0) + (d[i] ? (d[i] + 2 * d[i - 1]) / d[i] : 0)));
  t.push(0);
  const a = (m: number) => {
    if (m <= keys[0][0]) return keys[0][1];
    if (m >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (m > keys[i + 1][0]) i++;
    const h = keys[i + 1][0] - keys[i][0];
    const u = (m - keys[i][0]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * keys[i][1] + (u3 - 2 * u2 + u) * h * t[i] + (-2 * u3 + 3 * u2) * keys[i + 1][1] + (u3 - u2) * h * t[i + 1];
  };
  return (m: number) => a(m) * shapeG(m);
};
