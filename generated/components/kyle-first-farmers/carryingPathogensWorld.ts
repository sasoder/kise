// ---------------------------------------------------------------------------
// carryingPathogensWorld: the state of cut I (CarryingPathogens, kyle-first-farmers): its camera, its clock, the
// Danube, the farmers' columns, the germs that run ahead of them, which forager dots die and when, and the
// population of dots (cut F's population model, re-run on this cut's clock, with the dead added). Pure functions of
// the frame; everything that needs a pass over the frames is computed once at module load.
//
// WORLD: the Neolithic Europe world of firstFarmersEuropeMapData.ts (world px == screen px at the Europe wide).
// THE CAMP: forager dot 217 of the front model's blue-noise set (on the Danube between Orsova and Turnu Severin, in
// the Iron Gates gorge) is the camp the camera dives to. Its close-up is drawn in CLOSE px: at the close camera
// (k = K_C) one close px is one screen px, and the camp's ground point CAMP sits at close (540, 1040).
// ---------------------------------------------------------------------------
import { clamp01, pchip, runCamera, smoothstep, type Cam, type CamKey, type P2 } from "./firstFarmersMap";
import { project } from "./firstFarmersEuropeMapData";
import { SPREAD_POP_OPTS, SPREAD_TIMELINE, spreadAt } from "./firstFarmersOpening";
import { FARMERS, FORAGERS } from "./neolithicFrontData";
import { makeTimeline, type DotOut } from "./neolithicFront";
import { germMotes, type GermsProps } from "./firstFarmersShared";
import { FRAME_H, FRAME_W } from "./firstFarmersTokens";

export const DURATION = 448;
const smoother = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const h1 = (i: number, s: number) => {
  let x = (i * 374761393 + s * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

// ---------------------------------------------------------------------------
// THE DANUBE: its real course (lon, lat; verified points named), source to delta, densified by Catmull-Rom in world
// px. Within ~15 km of the camp the course is laid level (the close-up's river runs straight behind the camp; the
// real river there runs ESE from Orsova to Turnu Severin, ~20 deg off level, and turns south just past Severin).
// ---------------------------------------------------------------------------
const DANUBE_LL: [number, number][] = [
  [8.5, 47.95], // Donaueschingen (the source)
  [8.82, 47.98], // Tuttlingen
  [9.22, 48.09], // Sigmaringen
  [9.47, 48.15], // Riedlingen
  [9.99, 48.4], // Ulm
  [10.27, 48.45], // Gunzburg
  [10.78, 48.72], // Donauworth
  [11.18, 48.74], // Neuburg
  [11.43, 48.76], // Ingolstadt
  [11.88, 48.92], // Kelheim
  [12.1, 49.02], // Regensburg (the northernmost point)
  [12.57, 48.88], // Straubing
  [12.96, 48.83], // Deggendorf
  [13.46, 48.57], // Passau
  [14.29, 48.31], // Linz
  [14.85, 48.23], // Grein
  [15.33, 48.23], // Melk
  [15.6, 48.41], // Krems
  [16.05, 48.33], // Tulln
  [16.4, 48.22], // Vienna
  [17.11, 48.14], // Bratislava
  [17.65, 47.78], // Gyor (the main arm)
  [18.12, 47.76], // Komarno
  [18.74, 47.79], // Esztergom
  [18.97, 47.8], // Visegrad (the bend: south from here)
  [19.13, 47.75], // Vac
  [19.05, 47.5], // Budapest
  [18.93, 46.97], // Dunaujvaros
  [18.86, 46.62], // Paks
  [18.95, 46.18], // Baja
  [18.68, 45.99], // Mohacs
  [18.92, 45.55], // the Drava mouth
  [19.0, 45.35], // Vukovar (east from here)
  [19.38, 45.22], // Ilok
  [19.85, 45.25], // Novi Sad
  [20.25, 45.14], // Slankamen (the Tisza mouth)
  [20.45, 44.82], // Belgrade (the Sava)
  [20.93, 44.67], // Smederevo
  [21.45, 44.76], // Veliko Gradiste
  [21.63, 44.66], // Golubac (the gorge begins)
  [22.03, 44.56], // Lepenski Vir
  [22.15, 44.47], // Donji Milanovac
  [22.27, 44.62], // Dubova (the Kazan)
  [22.4, 44.72], // Orsova
  [22.53, 44.67], // the Iron Gates
  [22.66, 44.63], // Turnu Severin
  [22.69, 44.45], // Kusjak
  [22.62, 44.3], // Prahovo
  [22.88, 43.99], // Vidin
  [23.24, 43.83], // Lom
  [23.96, 43.73], // Oryahovo
  [24.5, 43.77], // Corabia
  [24.89, 43.7], // Nikopol
  [25.35, 43.62], // Svishtov (the southernmost point)
  [25.95, 43.85], // Ruse
  [26.63, 44.06], // Tutrakan
  [27.27, 44.12], // Silistra
  [28.03, 44.34], // Cernavoda (north from here)
  [27.95, 44.69], // Harsova
  [27.97, 45.27], // Braila
  [28.05, 45.43], // Galati
  [28.46, 45.27], // Isaccea
  [28.8, 45.18], // Tulcea
  [29.65, 45.16], // Sulina (the delta)
];
const DANUBE_NAMES = DANUBE_LL.map(([lo]) => (lo === 22.27 ? "Dubova" : lo === 22.4 ? "Orsova" : lo === 22.53 ? "IronGates" : lo === 22.66 ? "Severin" : ""));
const catmull = (pts: P2[], step: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const arcOf = (pts: P2[]) => {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return s;
};

// ---------------------------------------------------------------------------
// THE CAMP and the close scale
// ---------------------------------------------------------------------------
/** the forager dot that is the camp (FORAGERS index) */
export const CAMP_DOT = 217;
const CAMP_DOT_BASE: P2 = [FORAGERS[5 * CAMP_DOT], FORAGERS[5 * CAMP_DOT + 1]];
/** the close camera's zoom: one close px = one screen px there */
export const K_C = 150;
// the river's level at the camp's x: the real course between Orsova and the Iron Gates (linear between the two)
const LL_ORSOVA = project(22.4, 44.72);
const LL_IRONGATES = project(22.53, 44.67);
/** the camp's x: 1.4 world px (~5 km) upstream of its dot, so the level run fits between the bends */
const CAMP_X = CAMP_DOT_BASE[0] - 1.4;
const RIVER_Y = LL_ORSOVA[1] + ((LL_IRONGATES[1] - LL_ORSOVA[1]) * (CAMP_X - LL_ORSOVA[0])) / (LL_IRONGATES[0] - LL_ORSOVA[0]);
/** the close scene's river band: centre at close y 872, 72 close px wide (far bank 836, near bank 908) */
export const CLOSE_RIVER = { y: 872, half: 36 };
/** the camp's ground point (world): close (540, 1040); the river's centre line is 95 close px above it */
export const CAMP: P2 = [CAMP_X, RIVER_Y + (1040 - CLOSE_RIVER.y) / K_C];
/** close px -> world */
export const closeToWorld = (x: number, y: number): P2 => [CAMP[0] + (x - 540) / K_C, CAMP[1] + (y - 1040) / K_C];
/** the svg transform that draws close px in world px */
export const CLOSE_TF = `translate(${(CAMP[0] - 540 / K_C).toFixed(5)} ${(CAMP[1] - 1040 / K_C).toFixed(5)}) scale(${(1 / K_C).toFixed(8)})`;

// the course laid level near the camp: Dubova, Orsova, the Iron Gates and Turnu Severin (a ~20 deg ESE run of
// ~30 km) are replaced by a level run through the camp from 4.5 world px west of it to 4.5 east (~17 km each way),
// joined by the spline to Donji Milanovac upstream and to Kusjak downstream
const LEVEL = new Set(["Dubova", "Orsova", "IronGates", "Severin"]);
const DANUBE: P2[] = (() => {
  const pts: P2[] = [];
  DANUBE_LL.forEach(([lo, la], i) => {
    const name = DANUBE_NAMES[i];
    if (LEVEL.has(name)) {
      if (name === "Dubova") for (let q = -2; q <= 2; q++) pts.push([CAMP_X + q * 2.25, RIVER_Y]);
      return;
    }
    pts.push(project(lo, la));
  });
  return catmull(pts, 0.25);
})();
const DANUBE_S = arcOf(DANUBE);
export const DANUBE_LEN = DANUBE_S[DANUBE_S.length - 1];
/** the Danube's vertices (world px) with the river's width at the Europe wide (screen px: 1 at the source, 3 at the delta) */
export const DANUBE_PTS: { x: number; y: number; w: number }[] = DANUBE.map((p, i) => ({ x: p[0], y: p[1], w: 1 + 2 * Math.pow(DANUBE_S[i] / DANUBE_LEN, 0.7) }));

// ---------------------------------------------------------------------------
// THE CLOCK: the front's date by frame. f0 = cut F's f0 (6600 BC; before it, cut F's own run-back at 6 years a
// frame); then a slow creep: the farmed land reaches Macedonia, Thrace and the Morava, ~6070 BC at the end (the
// Iron Gates are farmed c. 6050-6100 BC in the model).
// ---------------------------------------------------------------------------
const T_KEYS: [number, number][] = [
  [0, SPREAD_TIMELINE.dateAt(0)],
  [150, 6480],
  [260, 6340],
  [380, 6200],
  [DURATION + 12, 6110],
];
const tCurve = pchip(T_KEYS);
export const TIMELINE = makeTimeline((f) => (f < 0 ? SPREAD_TIMELINE.dateAt(f) : tCurve(f)), -150, DURATION + 12);

// ---------------------------------------------------------------------------
// THE COLUMN: a compact body of farmer dots that buds off the farmed land (each dot slides out of an existing farmer
// dot) and marches at constant speed from Attica up through Thessaly, the Vardar and the Morava to the Danube at the
// Morava's mouth (Smederevo), where it turns downstream along the river toward the Iron Gates and slows to a walk.
// ---------------------------------------------------------------------------
type Column = { id: number; route: P2[]; s: number[]; len: number; depart: number; v: number; vSlow: number; sStop: number; fStop: number; start: number; slots: { u: number; v: number; ph: number }[]; parents: P2[] };
const COL_LEN = 36;
const COL_W = 18;
const COL_N = 30;
const COL_GAP = 3.9;
const SLOW_FRAMES = 30;
const routeAt = (c: Column, s: number): { p: P2; t: P2 } => {
  const S = Math.max(0, Math.min(c.len, s));
  let i = 1;
  while (i < c.s.length - 1 && c.s[i] < S) i++;
  const a = c.route[i - 1];
  const b = c.route[i];
  const seg = c.s[i] - c.s[i - 1] || 1e-9;
  const t = (S - c.s[i - 1]) / seg;
  const dx = (b[0] - a[0]) / seg;
  const dy = (b[1] - a[1]) / seg;
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], t: [dx, dy] };
};
// blue-noise slots inside a rounded body (u back from the head, v across)
const makeSlots = (seed: number) => {
  const out: { u: number; v: number; ph: number }[] = [];
  for (let tries = 0; out.length < COL_N && tries < 20000; tries++) {
    const u = h1(tries, seed) * COL_LEN;
    const v = (h1(tries, seed + 1) - 0.5) * COL_W;
    const e = ((u - COL_LEN / 2) / (COL_LEN / 2)) ** 2 + (v / (COL_W / 2)) ** 2;
    if (e > 1) continue;
    if (out.some((q) => Math.hypot(q.u - u, q.v - v) < COL_GAP)) continue;
    out.push({ u, v, ph: h1(tries, seed + 2) * 6.283 });
  }
  if (out.length < COL_N) throw new Error(`carryingPathogensWorld: only ${out.length} column slots fit`);
  return out;
};
const LL = (lo: number, la: number) => project(lo, la);
const COL_PTS: P2[] = [
  LL(23.95, 37.95), // Attica (farmed at f0): the body forms here
  LL(23.3, 38.3), // Thebes
  LL(22.75, 38.72),
  LL(22.43, 38.9), // Lamia
  LL(22.25, 39.55), // Larisa (Thessaly)
  LL(22.45, 40.15), // Katerini
  LL(22.5, 41.14), // up the Vardar: Gevgelija
  LL(21.78, 41.72), // Veles
  LL(21.71, 42.13), // Kumanovo
  LL(21.9, 42.55), // Vranje (the South Morava)
  LL(21.95, 43.0), // Leskovac
  LL(21.92, 43.33), // Nis
  LL(21.37, 43.93), // Cuprija (the Great Morava)
  LL(21.05, 44.45), // Velika Plana
  LL(20.99, 44.64), // the Morava's mouth on the Danube, by Smederevo
  LL(21.45, 44.72), // downstream along the Danube: Veliko Gradiste
  LL(21.63, 44.63), // Golubac, where the gorge begins
];
const MOUTH = LL(20.99, 44.64);
const mkColumn = (): Column => {
  const route = catmull(COL_PTS, 1);
  const s = arcOf(route);
  let iM = 0;
  route.forEach((p, i) => {
    if (Math.hypot(p[0] - MOUTH[0], p[1] - MOUTH[1]) < Math.hypot(route[iM][0] - MOUTH[0], route[iM][1] - MOUTH[1])) iM = i;
  });
  const start = COL_LEN + 3;
  const depart = 66;
  const fStop = 236; // reaches the Danube
  const v = (s[iM] - start) / (fStop - depart);
  return { id: 0, route, s, len: s[s.length - 1], depart, v, vSlow: 0.16, sStop: s[iM], fStop, start, slots: makeSlots(57), parents: [] };
};
export const COLUMNS: Column[] = [mkColumn()];
/** the head's arc position at frame f: constant speed to the Danube, then it slows to a walk over SLOW_FRAMES */
export const headAt = (c: Column, f: number) => {
  const t = f - c.depart;
  if (t <= 0) return c.start;
  if (f <= c.fStop) return c.start + c.v * t;
  const tau = f - c.fStop;
  const D = SLOW_FRAMES;
  if (tau < D) return c.sStop + c.v * tau - ((c.v - c.vSlow) * tau * tau) / (2 * D);
  return c.sStop + ((c.v + c.vSlow) / 2) * D + c.vSlow * (tau - D);
};
const speedAt = (c: Column, f: number) => (f <= c.depart ? 0 : f <= c.fStop ? c.v : c.v + (c.vSlow - c.v) * Math.min(1, (f - c.fStop) / SLOW_FRAMES));
/** where column c's slot j is at frame f (world px). Seen closer than k 4 the body draws in round its middle
 *  ((4 / k)^0.55: on screen it grows more slowly than the zoom), so in the dive it stays a compact body as it leaves the
 *  frame to the left and never spreads into the caption bands. */
export const columnDot = (c: Column, j: number, f: number, k = 1): P2 => {
  const sl0 = c.slots[j];
  const F = k > 4 ? Math.pow(4 / k, 0.55) : 1;
  const sl = { u: COL_LEN / 2 + (sl0.u - COL_LEN / 2) * F, v: sl0.v * F, ph: sl0.ph };
  const { p, t } = routeAt(c, headAt(c, f) - sl.u);
  const wob = 0.4 * F;
  const x = p[0] - t[1] * sl.v + wob * Math.sin(f * 0.11 + sl.ph);
  const y = p[1] + t[0] * sl.v + wob * Math.cos(f * 0.09 + sl.ph * 1.3);
  // gathering: each slot slides out of an existing farmer dot (its parent) over the 22 frames before departure
  const g = smoother((f - (c.depart - 30 + 8 * h1(j, 77 + c.id))) / 22);
  if (g >= 1) return [x, y];
  const pa = c.parents[j];
  return [pa[0] + (x - pa[0]) * g, pa[1] + (y - pa[1]) * g];
};
/** is slot j drawn yet (it has started sliding out of its parent) */
export const columnBorn = (c: Column, j: number, f: number) => f >= c.depart - 30 + 8 * h1(j, 77 + c.id);
/** a point of column c's body at frame f, u back from the head (for its germs) */
export const columnCentre = (c: Column, f: number, u = COL_LEN / 2): P2 => routeAt(c, headAt(c, f) - u).p;
/** the direction the column is heading at frame f, looking `ahead` world px down its route (unit vector) */
const headingAt = (c: Column, f: number, ahead = 24): P2 => {
  const h = headAt(c, f);
  const a = routeAt(c, h).p;
  let b = routeAt(c, h + ahead).p;
  if (h + ahead > c.len) {
    // past the route's end: carry on along the last stretch
    const t = routeAt(c, c.len - 0.5).t;
    b = [a[0] + t[0] * ahead, a[1] + t[1] * ahead];
  }
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
};
export const COLUMN_GEOM = { len: COL_LEN, width: COL_W };

// ---------------------------------------------------------------------------
// THE CAMERA: keyed in ANCHOR space: (sx, sy) = where the camp's ground point CAMP is on screen, and k; run through
// the kit's damped follow. f0 is cut F's f0 exactly (a correction that decays over the first 24 frames takes up the
// difference of the two dampers). From f0 it travels with the column (its body near screen (540, 1000), the haze
// running ahead of it above), north over the Balkans to the Danube; from f246 it dives in one log-space move onto
// the camp (ln k on a smootherstep, k ~3.3 -> 146 by f336: one acceleration lobe, one deceleration lobe).
// ---------------------------------------------------------------------------
const toAnchor = (c: Cam) => ({ x: FRAME_W / 2 + (CAMP[0] - c.x) * c.k, y: FRAME_H / 2 + (CAMP[1] - c.y) * c.k, k: c.k });
const F0 = spreadAt(0).cam;
const F0A = toAnchor(F0);
const FM20 = toAnchor({ x: 830, y: 1240, k: 3.2 });
const FOLLOW_K = (f: number) => 3.12 + 0.3 * smoothstep((f - 40) / 150);
const followCam = (f: number): Cam => {
  const c = COLUMNS[0];
  const p = columnCentre(c, Math.max(f, c.depart));
  const k = FOLLOW_K(f);
  // the body at screen y ~1000; toward the end of the run the frame leans east to take in the Iron Gates
  const lean = smoothstep((f - 190) / 50);
  return { x: p[0] + 22 * lean, y: p[1] + 10 / k - 6 * lean, k };
};
const FOLLOW_KEYS: CamKey[] = [66, 92, 118, 144, 170, 196, 222, 240].map((f) => ({ f, ...toAnchor(followCam(f)) }));
const DIVE = { f0: 246, f1: 336, k1: 146 };
const D0 = toAnchor(followCam(DIVE.f0));
const DIVE_KEYS: CamKey[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((u) => {
  const e = smoother(u);
  const sxy = smoothstep(Math.min(1, u * 1.12));
  return { f: DIVE.f0 + u * (DIVE.f1 - DIVE.f0), x: D0.x + (540 - D0.x) * sxy, y: D0.y + (1040 - D0.y) * sxy, k: Math.exp(Math.log(D0.k) + (Math.log(DIVE.k1) - Math.log(D0.k)) * e) };
});
export const CAM_KEYS: CamKey[] = [
  { f: -20, ...FM20 },
  { f: 0, ...F0A },
  { f: 34, ...toAnchor({ x: 792, y: 1236, k: 3.1 }) },
  ...FOLLOW_KEYS,
  { f: DIVE.f0, ...D0 },
  ...DIVE_KEYS,
  { f: DURATION - 1, x: 540, y: 1040, k: 150 },
  { f: DURATION + 40, x: 540, y: 1040, k: 152 },
];
const A0 = runCamera(CAM_KEYS, 0);
const fixA = { x: F0A.x - A0.x, y: F0A.y - A0.y, lk: Math.log(F0A.k) - Math.log(A0.k) };
/** the camera at frame f */
export const camAt = (f: number): Cam => {
  const a = runCamera(CAM_KEYS, f);
  const u = 1 - smoothstep(f / 24);
  const sx = a.x + fixA.x * u;
  const sy = a.y + fixA.y * u;
  const k = Math.exp(Math.log(a.k) + fixA.lk * u);
  return { x: CAMP[0] - (sx - FRAME_W / 2) / k, y: CAMP[1] - (sy - FRAME_H / 2) / k, k };
};

// ---------------------------------------------------------------------------
// THE POPULATION: cut F's makePopulation (neolithicFront.ts) re-run on this cut's clock, with the dead.
// Same blue-noise sets and options as cut F (SPREAD_POP_OPTS), so f0 is cut F's f0: the foragers already giving way
// at cut F's f0 keep cut F's slide progress there and finish it on this clock. Added: a forager the germs reach
// drains to DEAD and lies down where it is (it never gives way, is never absorbed and is never a farmer's parent).
// ---------------------------------------------------------------------------
const OPTS = { absorb: 8, slideLead: 16, slideEnd: 3, pioneerLag: 3, fillLag: 32, emerge: 9, drift: 1.1, ...SPREAD_POP_OPTS };
const NF = FORAGERS.length / 5;
const NO = FARMERS.length / 4;
const fx = new Float64Array(NF);
const fy = new Float64Array(NF);
const fA = new Float64Array(NF);
const fate = new Uint8Array(NF);
const fto = new Int32Array(NF);
const fs = new Float64Array(NF);
const fe = new Float64Array(NF);
/** cut F's slide progress at its f0 for a forager mid-slide there (else -1) */
const u0 = new Float64Array(NF).fill(-1);
const goneAt0 = new Uint8Array(NF);
for (let i = 0; i < NF; i++) {
  fx[i] = FORAGERS[5 * i];
  fy[i] = FORAGERS[5 * i + 1];
  const A = FORAGERS[5 * i + 2];
  fate[i] = FORAGERS[5 * i + 3];
  fto[i] = FORAGERS[5 * i + 4];
  fA[i] = fate[i] === 0 ? Infinity : TIMELINE.frameOf(A);
  fe[i] = fA[i] - OPTS.slideEnd;
  fs[i] = Math.min(fA[i] - OPTS.slideLead, fe[i] - 10);
  if (fate[i] === 2) {
    const aF = SPREAD_TIMELINE.frameOf(A);
    const eF = aF - OPTS.slideEnd;
    const sF = Math.min(aF - OPTS.slideLead, eF - 10);
    if (eF <= 0) goneAt0[i] = 1;
    else if (sF < 0) {
      u0[i] = (0 - sF) / (eF - sF);
      fs[i] = 0;
    }
  }
}
export const FORAGER_BASE = { x: fx, y: fy, n: NF };

// ---------------------------------------------------------------------------
// THE GERMS at map scale: a stipple haze (Germs, microbe 0) that comes out of the marching body from f104
// ("carrying" f115), travels with it and LEADS it: emitted in 22-frame slices, each slice drifting down the route
// ahead of the column (its heading then) faster than the column marches, so the haze runs a visible distance ahead
// of the orange; once the column reaches the Danube and slows, its haze runs on down the river toward the Iron Gates.
// It is drawn to the forager dots in its path (they gather there and sink in). A dot the haze touches starts dying.
// The legible microbes are separate swimmers (below).
// ---------------------------------------------------------------------------
export const GERMS_FROM = 104;
const SLICE = 22;
const HAZE_LIFE = 160;
const corridor = (c: Column, reach: number) => {
  const out: number[] = [];
  const s0 = headAt(c, GERMS_FROM);
  for (let i = 0; i < NF; i++) {
    if (goneAt0[i] || i === CAMP_DOT) continue;
    let best = Infinity;
    let bs = 0;
    for (let q = 0; q < c.route.length; q += 2) {
      const d = Math.hypot(c.route[q][0] - fx[i], c.route[q][1] - fy[i]);
      if (d < best) [best, bs] = [d, c.s[q]];
    }
    const dCamp = Math.hypot(CAMP[0] - fx[i], CAMP[1] - fy[i]);
    if ((best < reach && bs > s0 - 4) || dCamp < 46) out.push(i);
  }
  return out;
};
const TARGETS: number[] = corridor(COLUMNS[0], 80);
const TARGET_PTS: P2[] = [...TARGETS, CAMP_DOT].map((i) => [fx[i], fy[i]] as P2);
export const HAZE_SLICES = Array.from({ length: Math.ceil((DURATION - GERMS_FROM) / SLICE) }, (_, j) => {
  const c = COLUMNS[0];
  const from = GERMS_FROM + j * SLICE;
  const fm = from + SLICE / 2;
  const hd = headingAt(c, fm);
  const sp = speedAt(c, fm) + 1.05;
  return { from, until: from + SLICE, drift: [hd[0] * sp, hd[1] * sp] as P2 };
});
/** the haze slices alive at frame f, as Germs props */
export const hazeLayers = (f: number, k: number): GermsProps[] =>
  HAZE_SLICES.filter((sl) => f >= sl.from && f <= sl.until + HAZE_LIFE).map((sl) => ({
    frame: f,
    k,
    sources: [0.1, 0.4, 0.75].map((u) => ({ at: (fr: number) => columnCentre(COLUMNS[0], fr, u * COL_LEN), rx: 8, ry: 8, from: sl.from, until: sl.until })),
    rate: 0.95,
    life: HAZE_LIFE,
    spread: 0.42,
    drift: sl.drift,
    wander: 7,
    targets: TARGET_PTS,
    travel: 0.3,
    travelAt: 30,
    travelTime: 70,
    settle: 4.5,
    absorb: true,
    mote: 1.9,
    microbe: 0,
    rodShare: 0.16,
    seed: 11 + ((sl.from - GERMS_FROM) / SLICE) * 3,
  }));

// which forager dots the haze touches, and when (first frame a mote with alpha >= 0.4 is within 3.4 world px)
const TOUCH = new Float64Array(NF).fill(Infinity);
{
  const cand = new Set<number>(TARGETS);
  const CELL = 8;
  const grid = new Map<string, number[]>();
  cand.forEach((i) => {
    const key = `${Math.floor(fx[i] / CELL)},${Math.floor(fy[i] / CELL)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(i);
  });
  const R = 6;
  for (let f = GERMS_FROM; f < DURATION; f++)
    for (const layer of hazeLayers(f, 2)) {
      const motes = germMotes(layer);
      for (const m of motes) {
        if (m.a < 0.4) continue;
        const gx = Math.floor(m.x / CELL);
        const gy = Math.floor(m.y / CELL);
        for (let a = gx - 1; a <= gx + 1; a++)
          for (let b = gy - 1; b <= gy + 1; b++)
            for (const i of grid.get(`${a},${b}`) ?? []) if (TOUCH[i] > f && Math.hypot(m.x - fx[i], m.y - fy[i]) < R) TOUCH[i] = f;
      }
    }
}

// ---------------------------------------------------------------------------
// THE LEGIBLE MICROBES at map scale (the director's ruling: in a wide, 8-12 legible microbes, 40-60 px, visibly
// travelling from the source to the people). Each one swims out of a marching column, head first along a gentle
// curve, to a living forager dot ahead of it, and sinks into it: that dot starts dying on the arrival frame.
// ---------------------------------------------------------------------------
export type Swimmer = { c: number; f0: number; f1: number; from: P2; ctrl: P2; to: P2; target: number; len: number; kind: "rod" | "cocci"; n: number; seed: number };
const SWIM_SPEED = 3.4; // world px per frame (~11 px at the wide): ~3x the column's march, ~7 px a frame ahead on screen
export const SWIMMERS: Swimmer[] = [];
const DIE = new Float64Array(NF).fill(Infinity);
{
  // a dot takes one swimmer, or a second one that lands with the first (within 5 frames)
  const taken = new Map<number, number>();
  const plan: { c: number; from: number; to: number; every: number }[] = [{ c: 0, from: 106, to: 298, every: 5 }];
  for (const pl of plan)
    for (let fl = pl.from, n = 0; fl <= pl.to; fl += pl.every, n++) {
      const c = COLUMNS[pl.c];
      const u = (0.05 + 0.3 * h1(n, 300 + pl.c)) * COL_LEN;
      const from = columnCentre(c, fl, u);
      const head = columnCentre(c, fl, 0);
      const hd: P2 = [head[0] - from[0], head[1] - from[1]];
      // the late swimmers of column A make for the camp's neighbours on the river
      let best = -1;
      let bscore = Infinity;
      for (const i of TARGETS) {
        if (i === CAMP_DOT) continue;
        const d = Math.hypot(fx[i] - from[0], fy[i] - from[1]);
        if (d < (n < 6 ? 50 : 72) || d > 190) continue;
        const ahead = (fx[i] - from[0]) * hd[0] + (fy[i] - from[1]) * hd[1];
        if (ahead < 0) continue;
        const arrive = fl + d / SWIM_SPEED + 6;
        const prev = taken.get(i);
        if (prev !== undefined && (prev < 0 || Math.abs(arrive - prev) > 8)) continue;
        if (TOUCH[i] + 6 < arrive + 2) continue;
        const side = (fx[i] - from[0]) * -hd[1] + (fy[i] - from[1]) * hd[0];
        const sc = d * (0.7 + 0.6 * h1(i, 31 + n)) * ((side > 0) === (n % 2 === 0) ? 1 : 1.6);
        if (sc < bscore) [bscore, best] = [sc, i];
      }
      if (best < 0) continue;
      taken.set(best, taken.has(best) ? -1 : 0);
      const to: P2 = [fx[best], fy[best]];
      const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const side = h1(n, 400 + pl.c) < 0.5 ? -1 : 1;
      const nx = -(to[1] - from[1]) / d;
      const ny = (to[0] - from[0]) / d;
      const bend = side * d * (0.12 + 0.12 * h1(n, 401));
      const ctrl: P2 = [(from[0] + to[0]) / 2 + nx * bend, (from[1] + to[1]) / 2 + ny * bend];
      const f1 = fl + Math.round(d / SWIM_SPEED + 6);
      const kind = h1(n, 402 + pl.c) < 0.78 ? "rod" : "cocci";
      SWIMMERS.push({ c: pl.c, f0: fl, f1, from, ctrl, to, target: best, len: 42 + 14 * h1(n, 403), kind, n: kind === "cocci" ? 3 + Math.floor(h1(n, 404) * 2) : 2, seed: n * 7 + pl.c });
      if (taken.get(best) === 0) taken.set(best, f1);
      DIE[best] = Math.min(DIE[best], f1);
    }
  // and three swim on down the Danube into the camp's own dot (it never dies on the map: its deaths are the close's)
  [228, 238, 250].forEach((fl, n) => {
    const c = COLUMNS[0];
    const from = columnCentre(c, fl, 2 + 5 * n);
    const to: P2 = [fx[CAMP_DOT], fy[CAMP_DOT]];
    const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const nx = -(to[1] - from[1]) / d;
    const ny = (to[0] - from[0]) / d;
    const bend = (n % 2 ? 1 : -1) * d * 0.14;
    const ctrl: P2 = [(from[0] + to[0]) / 2 + nx * bend, (from[1] + to[1]) / 2 + ny * bend];
    SWIMMERS.push({ c: 0, f0: fl, f1: fl + Math.round(d / SWIM_SPEED + 6), from, ctrl, to, target: CAMP_DOT, len: 44 + 4 * n, kind: "rod", n: 2 + (n % 2), seed: 90 + n });
  });
  // the haze kills too: 6 frames after it first touches a dot
  for (let i = 0; i < NF; i++) DIE[i] = Math.min(DIE[i], TOUCH[i] + 6);
  // a forager giving way into a neighbour that dies first stops where it is when the neighbour dies, and dies with it
  const order = Array.from({ length: NF }, (_, i) => i).sort((a, b) => fA[b] - fA[a]);
  for (const i of order) if (fate[i] === 2 && Number.isFinite(DIE[fto[i]]) && DIE[fto[i]] < fe[i]) DIE[i] = Math.min(DIE[i], Math.max(fs[i], DIE[fto[i]] + 4));
}
/** the frame forager i starts to die (Infinity: never in this cut) */
export const dieAt = (i: number) => DIE[i];
/** a swimmer at frame f: where it is, its heading (deg) and its presence (0..1) */
export const swimmerAt = (w: Swimmer, f: number) => {
  if (f < w.f0 || f > w.f1 + 8) return null;
  const t = clamp01((f - w.f0) / (w.f1 - w.f0));
  const e = t; // constant pace along the curve (close enough for a gentle bend)
  const q = 1 - e;
  const x = q * q * w.from[0] + 2 * q * e * w.ctrl[0] + e * e * w.to[0];
  const y = q * q * w.from[1] + 2 * q * e * w.ctrl[1] + e * e * w.to[1];
  const dx = 2 * q * (w.ctrl[0] - w.from[0]) + 2 * e * (w.to[0] - w.ctrl[0]);
  const dy = 2 * q * (w.ctrl[1] - w.from[1]) + 2 * e * (w.to[1] - w.ctrl[1]);
  // out of the column (its first 7 frames) / sinking into the dot (8 frames after arrival)
  const out = smoothstep((f - w.f0) / 7);
  const sink = 1 - smoothstep((f - w.f1) / 8);
  return { x, y, ang: (Math.atan2(dy, dx) * 180) / Math.PI, op: out * sink, size: (0.6 + 0.4 * out) * (0.35 + 0.65 * sink) };
};

// ---------------------------------------------------------------------------
// the population itself
// ---------------------------------------------------------------------------
const absorbedAt = (i: number) => (fate[i] === 1 && DIE[i] > fA[i] ? fA[i] : Infinity);
const ox = new Float64Array(NO);
const oy = new Float64Array(NO);
const ob = new Float64Array(NO);
for (let j = 0; j < NO; j++) {
  ox[j] = FARMERS[4 * j];
  oy[j] = FARMERS[4 * j + 1];
  const u = FARMERS[4 * j + 3] / 1000;
  const lag = u < 0.3 ? OPTS.pioneerLag * (u / 0.3) : OPTS.pioneerLag + (OPTS.fillLag - OPTS.pioneerLag) * Math.pow((u - 0.3) / 0.7, 1.3);
  ob[j] = TIMELINE.frameOf(FARMERS[4 * j + 2]) + lag;
}
type Cand = { x: number; y: number; b: number; ref: number };
const cands: Cand[] = [];
for (let j = 0; j < NO; j++) cands.push({ x: ox[j], y: oy[j], b: ob[j], ref: j });
for (let i = 0; i < NF; i++) if (Number.isFinite(absorbedAt(i))) cands.push({ x: fx[i], y: fy[i], b: absorbedAt(i) + OPTS.absorb, ref: -1 - i });
const PB = 32;
const pgrid = new Map<string, Cand[]>();
for (const q of cands) {
  const key = `${Math.floor(q.x / PB)},${Math.floor(q.y / PB)}`;
  if (!pgrid.has(key)) pgrid.set(key, []);
  pgrid.get(key)!.push(q);
}
const parent = new Int32Array(NO).fill(-1e9);
{
  const firstF = TIMELINE.f0 - OPTS.emerge - 2;
  for (let j = 0; j < NO; j++) {
    if (ob[j] < firstF) continue;
    let best: Cand | null = null;
    let bd = Infinity;
    const gx = Math.floor(ox[j] / PB);
    const gy = Math.floor(oy[j] / PB);
    for (let R = 1; R <= 4 && !best; R++)
      for (let a = gx - R; a <= gx + R; a++)
        for (let b = gy - R; b <= gy + R; b++)
          for (const q of pgrid.get(`${a},${b}`) ?? []) {
            if (q.b > ob[j] - 3) continue;
            const dd = Math.hypot(q.x - ox[j], q.y - oy[j]);
            if (dd < bd) [bd, best] = [dd, q];
          }
    if (!best && ob[j] >= 0)
      for (const q of cands) {
        if (q.b > ob[j] - 3) continue;
        const dd = Math.hypot(q.x - ox[j], q.y - oy[j]);
        if (dd < bd) [bd, best] = [dd, q];
      }
    if (best) parent[j] = best.ref;
  }
}
const fOrder = Array.from({ length: NF }, (_, i) => i).sort((a, b) => fA[b] - fA[a]);
const oOrder = Array.from({ length: NO }, (_, j) => j).sort((a, b) => ob[a] - ob[b]);
// the columns' parents: for each slot, the nearest farmer dot that is there before the gathering
for (const c of COLUMNS) {
  const used = new Set<number>();
  c.parents = c.slots.map((_, j) => {
    const g0 = c.depart - 30 + 8 * h1(j, 77 + c.id);
    const tgt = (() => {
      const sl = c.slots[j];
      const { p, t } = routeAt(c, c.start - sl.u);
      return [p[0] - t[1] * sl.v, p[1] + t[0] * sl.v] as P2;
    })();
    let best = -1;
    let bd = Infinity;
    for (let q = 0; q < NO; q++) {
      if (ob[q] > g0 - 12) continue;
      const d = Math.hypot(ox[q] - tgt[0], oy[q] - tgt[1]) + (used.has(q) ? 9 : 0);
      if (d < bd) [bd, best] = [d, q];
    }
    if (best < 0 || bd > 48) throw new Error(`carryingPathogensWorld: column ${c.id} slot ${j} has no farmer dot to come out of (${bd.toFixed(1)})`);
    used.add(best);
    return [ox[best], oy[best]] as P2;
  });
}

export type DotState = DotOut & { dead: number };
const px_ = new Float64Array(NO);
const py_ = new Float64Array(NO);
const qx = new Float64Array(NF);
const qy = new Float64Array(NF);
/** every dot at frame f (drawn order: `under` = sliding / emerging dots, then `over`); dead: 0..1 the drain to DEAD */
export const populationAt = (f: number, cam: Cam) => {
  const k = cam.k;
  const dr = OPTS.drift / Math.max(1, k);
  const mx = (FRAME_W / 2 + 60) / k;
  const my = (FRAME_H / 2 + 60) / k;
  const vis = (x: number, y: number) => Math.abs(x - cam.x) < mx && Math.abs(y - cam.y) < my;
  const under: DotState[] = [];
  const over: DotState[] = [];
  const wob = (i: number, s: number, ff: number): [number, number] => {
    const w = (2 * Math.PI) / (70 + 50 * h1(i, s));
    return [dr * Math.cos(w * ff + 6.283 * h1(i, s + 1)), dr * Math.sin(w * 1.3 * ff + 6.283 * h1(i, s + 2))];
  };
  for (const i of fOrder) {
    if (goneAt0[i]) {
      qx[i] = NaN;
      continue;
    }
    const die = DIE[i];
    const ff = Math.min(f, die); // a dead dot lies where it was when it started dying
    const [dx, dy] = wob(i, 11, ff);
    let x = fx[i] + dx;
    let y = fy[i] + dy;
    const dead = f >= die ? smoother((f - die) / 26) : 0;
    if (fate[i] === 2 && ff >= fs[i]) {
      if (ff >= fe[i]) {
        qx[i] = NaN;
        continue;
      }
      const t = fto[i];
      const tx = Number.isNaN(qx[t]) ? fx[t] : qx[t];
      const ty = Number.isNaN(qy[t]) ? fy[t] : qy[t];
      const raw = u0[i] >= 0 ? u0[i] + (1 - u0[i]) * clamp01((ff - 0) / Math.max(1, fe[i])) : (ff - fs[i]) / (fe[i] - fs[i]);
      const e = smoother(raw);
      x += (tx - x) * e;
      y += (ty - y) * e;
      qx[i] = x;
      qy[i] = y;
      if (vis(x, y)) (dead > 0 ? over : under).push({ id: i, x, y, tone: 0, farmer: false, dead });
      continue;
    }
    qx[i] = x;
    qy[i] = y;
    const ab = absorbedAt(i);
    const tone = Number.isFinite(ab) ? smoother((f - ab) / OPTS.absorb) : 0;
    if (vis(x, y)) over.push({ id: i, x, y, tone, farmer: false, dead });
  }
  for (const j of oOrder) {
    if (f < ob[j]) break;
    const [dx, dy] = wob(j, 29, f);
    let x = ox[j] + dx;
    let y = oy[j] + dy;
    const p = parent[j];
    const e = smoother((f - ob[j]) / OPTS.emerge);
    if (p !== -1e9 && e < 1) {
      const sx = p >= 0 ? px_[p] : qx[-1 - p];
      const sy = p >= 0 ? py_[p] : qy[-1 - p];
      x = sx + (x - sx) * e;
      y = sy + (y - sy) * e;
      px_[j] = x;
      py_[j] = y;
      if (vis(x, y)) under.push({ id: 100000 + j, x, y, tone: 1, farmer: true, dead: 0 });
      continue;
    }
    px_[j] = x;
    py_[j] = y;
    if (vis(x, y)) over.push({ id: 100000 + j, x, y, tone: 1, farmer: true, dead: 0 });
  }
  return { under, over };
};

// ---------------------------------------------------------------------------
// the close: when the camp's figures take over from its dot, and the map gives way to the plain page
// ---------------------------------------------------------------------------
/** 0..1: the camp drawn as figures (the dot hands over between k 4.6 and 6.4) */
export const campShow = (k: number) => smoothstep(Math.log(k / 4.6) / Math.log(6.4 / 4.6));
/** 0..1: the map (tiles, hatch, front) gives way to the plain land page between k 45 and 95, once the camp's figures
 *  are legible and fill a good part of the frame (the map-scale dots and haze go earlier: mapDotsGone, below) */
export const mapGone = (k: number) => smoothstep(Math.log(k / 45) / Math.log(95 / 45));
/** 0..1: the map-scale dots and the column (their size law makes them blobs up close) go between k 12 and 24, once the
 *  camp's dot has handed over to its figures and they have left the middle of the frame */
export const mapDotsGone = (k: number) => smoothstep(Math.log(k / 12) / Math.log(24 / 12));
/** 0..1: the close haze over the camp comes up between k 14 and 50 (the map haze goes between 12 and 30) */
export const closeHaze = (k: number) => smoothstep(Math.log(k / 14) / Math.log(50 / 14));
