/**
 * korea1950Fronts.ts — the 1950 Korean War in lon/lat. Pure data + two helpers,
 * no projection, no imports. Shared by Twosome, ThirdPartyIntervention,
 * CivilRegionalGlobal, ReuniteTheWholeThing and ChineseAreIn (via koreaShared).
 *
 * All coordinates are [lon, lat] in degrees, approximate to ~0.1 deg: they are
 * traced by hand from the campaign maps, not surveyed. Every front runs WEST -> EAST
 * and carries a short stub out to sea at each end, so a hatch region closed around
 * the far side of the map meets the coast cleanly (koreaShared clips hatch + dashes
 * to Korean land, so the stubs never show). Every front is resampled to FRONT_N
 * points by arc length, so any two fronts interpolate point for point.
 *
 * Sources for the fronts:
 *  - Appleman, "South to the Naktong, North to the Yalu (June-November 1950)",
 *    US Army CMH 1961: maps I-IX (NK invasion 25-28 Jun; Han River; Osan 5 Jul;
 *    Taejon 20 Jul; the Pusan Perimeter 4 Aug; the breakout + Inchon to 30 Sep;
 *    Pyongyang 19 Oct; ROK 6th Div 7th Regt at Chosan on the Yalu 26 Oct;
 *    the UN advance to the Yalu).
 *  - Mossman, "Ebb and Flow, November 1950-July 1951", US Army CMH 1990, ch. 2-5
 *    and map 1 (the line of 24 Nov: 7th Div 17th Inf at Hyesan 21 Nov, Marines at
 *    Yudam-ni/Hagaru-ri on the Chosin (Changjin) reservoir, ROK Capital Div at
 *    Chongjin 25 Nov; Eighth Army on the Ch'ongch'on line).
 *  - West Point Atlas of American Wars vol. II, Korea maps 1-12; Wikipedia campaign
 *    maps ("Korean War", "Battle of the Pusan Perimeter", "UN offensive into North Korea").
 *  - YALU_TUMEN is Natural Earth 10m (world-atlas countries-10m), the China-North Korea
 *    plus Russia-North Korea boundaries, decimated to >= 0.03 deg spacing. That boundary
 *    is essentially the 1950 one (Yalu + Tumen; the USSR touches the lower Tumen).
 */

export type LonLat = [number, number];

/** every front is resampled to this many points, west -> east */
export const FRONT_N = 96;

/* ------------------------------------------------------------------ lines */

/** 38 deg N across Korean land only: west tip of the Ongjin peninsula to the east
 *  coast north of Yangyang (the land crossings from countries-10m: 125.119 ... 128.749;
 *  it crosses Haeju bay between 125.588 and 125.766, dashes are clipped to land). */
export const PARALLEL_38: LonLat[] = [
  [125.119, 38],
  [125.588, 38],
  [125.766, 38],
  [126.5, 38],
  [127.25, 38],
  [128.0, 38],
  [128.749, 38],
];

/** the Korea-China (Yalu, upper Tumen) + Korea-USSR (lower Tumen) border,
 *  Yalu mouth (Sinuiju) -> Tumen mouth, west -> east */
export const YALU_TUMEN: LonLat[] = [
  [124.369,40.098], [124.527,40.214], [124.552,40.236], [124.610,40.271], [124.642,40.295], [124.693,40.304],
  [124.721,40.327], [124.739,40.371], [124.779,40.383], [124.851,40.432], [124.883,40.466], [124.916,40.466],
  [124.959,40.454], [125.006,40.455], [125.042,40.461], [125.027,40.496], [125.024,40.535], [125.074,40.548],
  [125.114,40.564], [125.153,40.584], [125.182,40.594], [125.215,40.602], [125.243,40.611], [125.272,40.633],
  [125.308,40.650], [125.337,40.641], [125.373,40.645], [125.413,40.631], [125.420,40.667], [125.452,40.673],
  [125.470,40.712], [125.531,40.722], [125.557,40.759], [125.585,40.781], [125.611,40.761], [125.668,40.763],
  [125.643,40.810], [125.683,40.847], [125.737,40.866], [125.762,40.886], [125.823,40.869], [125.873,40.893],
  [125.913,40.895], [125.949,40.883], [125.996,40.895], [125.992,40.928], [126.028,40.935], [126.064,40.969],
  [126.075,40.998], [126.104,41.009], [126.125,41.043], [126.125,41.075], [126.262,41.143], [126.284,41.165],
  [126.309,41.209], [126.345,41.237], [126.381,41.291], [126.442,41.349], [126.471,41.367], [126.521,41.352],
  [126.507,41.410], [126.507,41.447], [126.543,41.489], [126.557,41.534], [126.575,41.562], [126.568,41.602],
  [126.601,41.643], [126.633,41.668], [126.669,41.668], [126.712,41.695], [126.687,41.724], [126.712,41.740],
  [126.741,41.729], [126.770,41.705], [126.809,41.730], [126.863,41.747], [126.878,41.774], [126.910,41.796],
  [126.939,41.773], [126.982,41.764], [127.033,41.732], [127.069,41.693], [127.047,41.668], [127.072,41.636],
  [127.105,41.626], [127.166,41.595], [127.137,41.570], [127.105,41.538], [127.133,41.523], [127.166,41.528],
  [127.202,41.541], [127.245,41.528], [127.281,41.531], [127.285,41.499], [127.346,41.491], [127.378,41.499],
  [127.429,41.484], [127.457,41.494], [127.490,41.496], [127.526,41.484], [127.558,41.459], [127.598,41.450],
  [127.630,41.433], [127.659,41.447], [127.691,41.438], [127.785,41.437], [127.828,41.433], [127.864,41.438],
  [127.904,41.467], [127.943,41.470], [127.976,41.450], [128.001,41.470], [128.012,41.442], [128.023,41.411],
  [128.051,41.421], [128.066,41.389], [128.105,41.399], [128.145,41.376], [128.185,41.404], [128.289,41.545],
  [128.303,41.583], [128.282,41.605], [128.267,41.643], [128.224,41.670], [128.185,41.693], [128.159,41.712],
  [128.145,41.754], [128.098,41.823], [128.059,41.850], [128.041,41.879], [128.019,41.965], [128.033,41.994],
  [128.102,41.999], [128.260,42.033], [128.365,42.026], [128.408,42.009], [128.455,42.011], [128.487,41.997],
  [128.545,42.007], [128.588,42.021], [128.681,42.026], [128.721,42.048], [128.818,42.044], [128.883,42.031],
  [128.941,42.036], [128.955,42.075], [128.984,42.093], [129.027,42.102], [129.052,42.122], [129.063,42.154],
  [129.106,42.142], [129.149,42.174], [129.178,42.193], [129.203,42.215], [129.182,42.244], [129.211,42.267],
  [129.229,42.298], [129.193,42.311], [129.225,42.318], [129.236,42.347], [129.243,42.379], [129.297,42.387],
  [129.315,42.423], [129.351,42.421], [129.387,42.428], [129.419,42.441], [129.481,42.411], [129.517,42.391],
  [129.545,42.372], [129.563,42.404], [129.596,42.423], [129.632,42.445], [129.671,42.438], [129.704,42.443],
  [129.729,42.475], [129.733,42.512], [129.733,42.551], [129.736,42.585], [129.761,42.607], [129.740,42.629],
  [129.776,42.647], [129.787,42.678], [129.758,42.703], [129.758,42.735], [129.772,42.767], [129.790,42.792],
  [129.797,42.836], [129.833,42.907], [129.848,42.951], [129.895,42.971], [129.909,43.009], [129.941,43.004],
  [129.970,42.973], [130.010,42.961], [130.046,42.961], [130.093,42.977], [130.132,42.973], [130.122,42.943],
  [130.100,42.921], [130.140,42.907], [130.194,42.909], [130.240,42.902], [130.255,42.867], [130.244,42.782],
  [130.244,42.744], [130.262,42.708], [130.316,42.668], [130.392,42.607], [130.428,42.600], [130.431,42.561],
  [130.467,42.554], [130.456,42.585], [130.485,42.610], [130.518,42.600], [130.525,42.549], [130.543,42.510],
  [130.557,42.483], [130.575,42.446], [130.608,42.421], [130.647,42.401], [130.662,42.359], [130.662,42.321],
  [130.701,42.294],
];

/* ------------------------------------------------------------------ points */

export const INCHON: LonLat = [126.62, 37.47];
export const PUSAN: LonLat = [129.04, 35.1];
export const SEOUL: LonLat = [126.98, 37.56];
export const PYONGYANG: LonLat = [125.75, 39.02];

/** PVA crossing points, Chinese bank -> Korean bank (Appleman ch. XXXVIII;
 *  Mossman ch. 3; Chinese 39th/40th/42nd/38th Armies, 19-25 Oct 1950) */
export const PVA_CROSSINGS: { name: string; cn: LonLat; kr: LonLat }[] = [
  { name: "Andong-Sinuiju", cn: [124.39, 40.13], kr: [124.4, 40.08] },
  { name: "Changdian-Sakju", cn: [125.0, 40.5], kr: [125.03, 40.42] },
  { name: "Ji'an-Manpo", cn: [126.19, 41.13], kr: [126.29, 41.14] },
];
/** where ROK 6th Div's 7th Regiment reached the Yalu on 26 Oct 1950 */
export const CHOSAN: LonLat = [125.82, 40.83];
export const HYESAN: LonLat = [128.18, 41.4];
export const CHONGJIN: LonLat = [129.78, 41.78];
export const CHOSIN: LonLat = [127.2, 40.45];

/* ------------------------------------------------------------------ strengths */

/** KPA ground forces (NKPA + Border Constabulary) June 1950: "about 135,000 men".
 *  Appleman ch. II. (Of these, 89,000 combat troops were in the assault formations.) */
export const KPA_JUNE_1950 = 135_000;
export const KPA_ASSAULT_COMBAT_JUNE_1950 = 89_000;
/** ROK Army when the war began: "a strength of about 98,000, composed of approximately
 *  65,000 combat troops and 33,000 headquarters and service troops". Appleman ch. II. */
export const ROK_ARMY_JUNE_1950 = 98_000;
export const ROK_COMBAT_JUNE_1950 = 65_000;
/** UN Command ground forces in Korea, 23 Nov 1950: 423,313 (ROK 223,950, US 178,464,
 *  others ~20,900). Mossman ch. 2. (Whole UNC incl. air + naval: ~553,000.) */
export const UN_GROUND_LATE_NOV_1950 = 423_313;
/** PVA across the Yalu by late Oct 1950: the 13th Army Group (38th, 39th, 40th, 42nd
 *  Armies + 3 artillery divisions), ~260,000 in Chinese official figures (Li Xiaobing,
 *  "China's Battle for Korea" 2014; Wikipedia "First Phase Offensive" gives 200,000-270,000).
 *  Approximate. */
export const PVA_LATE_OCT_1950 = 260_000;
/** PVA in Korea by late Nov 1950 (13th + 9th Army Groups, 30 divisions): 300,000-390,000;
 *  "300,000 or slightly more seems the most likely estimate" after attrition
 *  (Mossman ch. 3 via Wikipedia "Second Phase Offensive"). */
export const PVA_LATE_NOV_1950 = 300_000;

/* ------------------------------------------------------------------ fronts (raw) */

/** raw authored polylines incl. sea stubs; use FRONTS (resampled) downstream */
const RAW: Record<string, LonLat[]> = {
  // 25 Jun 1950: the 38th, extended out to sea both sides
  "1950-06-25": [
    [124.3, 38], [125.119, 38], [125.588, 38], [125.766, 38], [126.5, 38],
    [127.25, 38], [128.0, 38], [128.749, 38], [129.4, 38],
  ],
  // 28 Jun: Seoul falls; KPA on the Han, Kimpo taken, Chunchon, Kangnung, landings at Samchok
  "1950-06-28": [
    [125.9, 37.55], [126.45, 37.55], [126.75, 37.52], [127.0, 37.5], [127.3, 37.55],
    [127.6, 37.7], [127.9, 37.72], [128.3, 37.72], [128.7, 37.62], [129.1, 37.45], [129.6, 37.4],
  ],
  // 5 Jul: Task Force Smith at Osan; line Pyongtaek-Osan-Wonju-Chechon-Ulchin
  "1950-07-05": [
    [125.9, 37.0], [126.75, 37.02], [127.07, 37.15], [127.4, 37.2], [127.9, 37.25],
    [128.3, 37.15], [128.7, 37.0], [129.3, 36.95], [129.8, 36.95],
  ],
  // 20 Jul: Taejon falls; 6th Div at Chonju in the west, 5th Div at Yongdok in the east
  "1950-07-20": [
    [125.8, 35.85], [126.7, 35.85], [127.1, 35.95], [127.4, 36.25], [127.75, 36.35],
    [128.1, 36.55], [128.45, 36.65], [128.8, 36.55], [129.1, 36.45], [129.37, 36.41], [129.8, 36.4],
  ],
  // 4 Aug: the Pusan Perimeter. South coast west of Masan (Chindong-ni), north up the
  // Naktong (Namji, Changnyong, Hyonpung) to Waegwan, then east above Taegu to Yongdok.
  // The sea stub runs round the SW corner (west of the Chollas, between the
  // mainland and Cheju, along the south coast) so a morph from 20 Jul sweeps the
  // hatch south across the Chollas instead of cutting it with a straight edge.
  "1950-08-04": [
    [125.8, 35.5], [125.55, 34.9], [125.85, 34.12], [126.6, 33.95], [127.5, 34.12],
    [128.1, 34.5], [128.38, 34.78], [128.45, 35.1], [128.43, 35.22], [128.47, 35.38],
    [128.43, 35.53], [128.43, 35.7], [128.38, 35.85], [128.4, 35.99], [128.55, 36.1],
    [128.75, 36.18], [128.95, 36.25], [129.15, 36.33], [129.37, 36.41], [129.8, 36.35],
  ],
  // 30 Sep: after Inchon + the breakout; Seoul retaken 28 Sep, UN back at ~the 38th
  "1950-09-30": [
    [124.3, 37.65], [125.2, 37.72], [126.1, 37.75], [126.6, 37.8], [127.0, 37.85],
    [127.5, 37.9], [128.0, 37.97], [128.5, 38.02], [128.75, 38.05], [129.4, 38.05],
  ],
  // 19 Oct: Pyongyang taken; ROK I Corps past Hamhung on the east coast
  "1950-10-19": [
    [124.3, 39.25], [125.2, 39.3], [125.7, 39.15], [126.2, 39.25], [126.7, 39.45],
    [127.1, 39.7], [127.5, 40.0], [127.9, 40.15], [128.3, 40.1], [128.6, 39.85],
  ],
  // 26 Oct: ROK 6th Div's 7th Regt on the Yalu at Chosan (a narrow spike), Eighth Army
  // past the Ch'ongch'on, ROK I Corps up the east coast toward Songjin
  "1950-10-26": [
    [124.2, 39.55], [124.95, 39.62], [125.3, 39.75], [125.6, 39.95], [125.72, 40.4],
    [125.82, 40.83], [125.98, 40.45], [126.3, 40.2], [126.8, 40.15], [127.2, 40.3],
    [127.7, 40.45], [128.3, 40.55], [128.9, 40.6], [129.3, 40.7], [129.7, 40.5],
  ],
  // 24 Nov: the high-water mark. Eighth Army on the Ch'ongch'on line, Marines at
  // Yudam-ni on the Chosin reservoir, 7th Div at Singalpajin + Hyesan on the Yalu,
  // ROK Capital Div at Chongjin on the NE coast
  "1950-11-24": [
    [124.2, 39.6], [124.95, 39.68], [125.35, 39.78], [125.7, 39.88], [126.05, 39.95],
    [126.4, 39.85], [126.75, 40.1], [127.08, 40.47], [127.35, 40.8], [127.64, 41.38],
    [127.9, 41.35], [128.18, 41.4], [128.7, 41.5], [129.3, 41.65], [129.78, 41.78], [130.3, 41.6],
  ],
};

/* ------------------------------------------------------------------ helpers */

const KX = Math.cos((38 * Math.PI) / 180); // lon degrees -> equal-area-ish metric

/** resample a polyline to n points evenly spaced by arc length (lon scaled by cos 38) */
export function resample(line: LonLat[], n = FRONT_N): LonLat[] {
  const cum = [0];
  for (let i = 1; i < line.length; i++) {
    const dx = (line[i][0] - line[i - 1][0]) * KX;
    const dy = line[i][1] - line[i - 1][1];
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const L = cum[cum.length - 1];
  const out: LonLat[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (L * k) / (n - 1);
    while (j < line.length - 2 && cum[j + 1] < s) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const u = Math.min(1, Math.max(0, (s - cum[j]) / seg));
    out.push([
      line[j][0] + (line[j + 1][0] - line[j][0]) * u,
      line[j][1] + (line[j + 1][1] - line[j][1]) * u,
    ]);
  }
  return out;
}

export type FrontDate =
  | "1950-06-25" | "1950-06-28" | "1950-07-05" | "1950-07-20" | "1950-08-04"
  | "1950-09-30" | "1950-10-19" | "1950-10-26" | "1950-11-24";

/** every dated front, resampled to FRONT_N points, west -> east, sea stub to sea stub */
export const FRONTS = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k, resample(v)]),
) as Record<FrontDate, LonLat[]>;

export const FRONT_25JUN = FRONTS["1950-06-25"];
export const FRONT_28JUN = FRONTS["1950-06-28"];
export const FRONT_5JUL = FRONTS["1950-07-05"];
export const FRONT_20JUL = FRONTS["1950-07-20"];
export const FRONT_4AUG = FRONTS["1950-08-04"]; // the Pusan Perimeter
export const FRONT_30SEP = FRONTS["1950-09-30"];
export const FRONT_19OCT = FRONTS["1950-10-19"];
export const FRONT_26OCT = FRONTS["1950-10-26"];
export const FRONT_24NOV = FRONTS["1950-11-24"]; // the high-water mark

/** linear point-for-point morph between two resampled fronts; u in [0,1], clamped.
 *  Ease u yourself. */
export function frontAt(a: LonLat[], b: LonLat[], u: number): LonLat[] {
  const t = Math.min(1, Math.max(0, u));
  return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);
}

/** C1 morph THROUGH a sequence of fronts (per-point Catmull-Rom), s in [0, keys-1].
 *  Unlike chaining frontAt, the points never stop or kink at an intermediate date,
 *  so one eased s gives one continuous roll through e.g. 28 Jun -> 5 Jul -> 20 Jul. */
export function frontThrough(keys: LonLat[][], s: number): LonLat[] {
  const n = keys.length;
  const c = Math.min(n - 1, Math.max(0, s));
  const i = Math.min(n - 2, Math.floor(c));
  const t = c - i;
  const P0 = keys[Math.max(0, i - 1)], P1 = keys[i], P2 = keys[i + 1], P3 = keys[Math.min(n - 1, i + 2)];
  const t2 = t * t, t3 = t2 * t;
  const cr = (p0: number, p1: number, p2: number, p3: number) =>
    0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  return P1.map((_, k) => [
    cr(P0[k][0], P1[k][0], P2[k][0], P3[k][0]),
    cr(P0[k][1], P1[k][1], P2[k][1], P3[k][1]),
  ]);
}
