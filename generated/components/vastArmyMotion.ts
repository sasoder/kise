// VastExpanseOfHisArmy (cut 2 of the Cajamarca clip), V3 (town first): every
// moving thing as pure maths (no React), so the check scripts read the exact
// motion the component draws. See VastExpanseOfHisArmy.tsx's header for the
// words, the gestures, the colour rule and the sources.
//   the road frame  ROAD_TO_CAMP (incaShared) as arclength s (metres from the
//                   plaza's east corner, 0 .. 5895 at the springs) and a
//                   signed lateral offset d (metres, + = north of the road),
//                   extended straight past both ends; the army's streamlines
//                   are straight lines in (s, d), so they bend with the road
//   the camera      opens on the plaza (k 2) drifting east, then ONE log-k
//                   S-curve pull-back east to the whole army (k 0.1) anchored
//                   on the plaza, which holds its screen point; ln k is the
//                   integral of cosine-tapered velocity bumps (makeTrack, C1)
//                   solved through the keyed zooms, the plaza's screen point a
//                   monotone cubic (pchip) through its keys
//   the procession  6,000 cream dots on PROC_PATH (the road from the camp,
//                   round the outside of the plaza's SE wall to its SW
//                   (town-side) gate): one continuous organic ribbon whose
//                   squadrons are density pulses with soft heads and tails,
//                   its edges ragged, its men blue noise (best-candidate
//                   placement); it follows its head with a delay per rank
//                   (closing up as the head slows), a slow surge running back
//                   along it; the litter rides among its leading ranks
//   the army        80,000 cream dots: an organic round camp at the springs
//                   (start) and the deployment (end: three dense blue-noise
//                   divisions 0.65-1.1 km short of the town, irregular, wider
//                   across the road than deep, ragged at the front; the fields behind
//                   them thick along the road and fraying into fingers and
//                   stragglers at the margins, the camp thinned as the tail);
//                   each side of the road on its own (no dot crosses the
//                   road), matched band by band in lateral order (paths never
//                   cross); front first, each dot at its own time and speed,
//                   closing up toward the road on the way (a long-tailed
//                   stream), opening out into its place as it arrives
//   the lane        the road is kept clear only along the procession
//   the 168         Pizarro's men, orange, in the halls, the doorways, on and
//                   by the platform, and inside the two gates
import {
  CAMP,
  PLAZA,
  ROAD_TO_CAMP,
  SCREEN_CX,
  SCREEN_CY,
  makeTrack,
  packCrowd,
  pchip,
  type Bump,
  type Cam,
  type Gate,
  type Hall,
  type P2,
} from "./incaShared";

export const FPS = 24;
// In-point 56.10 s on the edit timeline (the SRT). The line ends with "army"
// at 61.66 s: round((61.66 - 56.10) * 24) = round(133.44) = 133, + the
// 16-frame house tail = 149.
export const IN_POINT = 56.1;
export const DURATION = 149;
export const LAST = DURATION - 1;

/** word onsets, f = round((t - 56.10) * 24) */
export const W = {
  and: 0,
  then: 7,
  he: 10,
  proceeds: 14,
  to: 28,
  meet: 35,
  with: 42,
  pizarro: 52,
  at: 69,
  cajamarca: 87,
  with2: 100,
  the: 104,
  vast: 106,
  expanse: 112,
  ofHis: 121,
  army: 127,
  lineEnd: 133,
};

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const sstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** integer hash -> [0, 1) (deterministic, fast) */
export const ih = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x632be5ab, 0x165667b1) ^ Math.imul((c | 0) + 0x5bd1e995, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
/** smooth value noise in [0, 1] on a unit lattice */
const vnoise = (x: number, y: number, seed: number) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = x - i;
  const v = y - j;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const a = ih(i, j, seed);
  const b = ih(i + 1, j, seed);
  const c = ih(i, j + 1, seed);
  const d = ih(i + 1, j + 1, seed);
  return (a + (b - a) * su) * (1 - sv) + (c + (d - c) * su) * sv;
};
const unit = (v: P2): P2 => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};

// ---------------------------------------------------------------------------
// THE ROAD FRAME. ROAD_TO_CAMP runs from the plaza's east (fortress) corner (s
// 0) to the springs (s = len, 5,895 m). Sampled every FS metres from F_S0 to
// F_S1, straight past both ends along the end tangents; the normals come from
// a gaussian-smoothed tangent (sigma 40 m), so a dot far off the road never
// steps where the polyline turns.
// ---------------------------------------------------------------------------
const ROAD = ROAD_TO_CAMP;
export const S_SPRINGS = ROAD.len;
const FS = 2;
const F_S0 = -800;
const F_S1 = 8400;
const FN = Math.round((F_S1 - F_S0) / FS) + 1;
const FPX = new Float64Array(FN);
const FPY = new Float64Array(FN);
const FNX = new Float64Array(FN);
const FNY = new Float64Array(FN);
(() => {
  const t0 = ROAD.tangentAt(0);
  const t1 = ROAD.tangentAt(ROAD.len);
  const p0 = ROAD.pointAt(0);
  const p1 = ROAD.pointAt(ROAD.len);
  for (let i = 0; i < FN; i++) {
    const s = F_S0 + i * FS;
    let p: P2;
    if (s <= 0) p = [p0[0] + t0[0] * s, p0[1] + t0[1] * s];
    else if (s >= ROAD.len) p = [p1[0] + t1[0] * (s - ROAD.len), p1[1] + t1[1] * (s - ROAD.len)];
    else p = ROAD.pointAt(s);
    FPX[i] = p[0];
    FPY[i] = p[1];
  }
  const tx = new Float64Array(FN);
  const ty = new Float64Array(FN);
  for (let i = 0; i < FN; i++) {
    const a = Math.max(0, i - 2);
    const b = Math.min(FN - 1, i + 2);
    const [ux, uy] = unit([FPX[b] - FPX[a], FPY[b] - FPY[a]]);
    tx[i] = ux;
    ty[i] = uy;
  }
  const sig = 20; // samples (40 m)
  const R = 3 * sig;
  const w = Array.from({ length: 2 * R + 1 }, (_, j) => Math.exp(-((j - R) * (j - R)) / (2 * sig * sig)));
  for (let i = 0; i < FN; i++) {
    let sx = 0;
    let sy = 0;
    for (let j = -R; j <= R; j++) {
      const q = Math.max(0, Math.min(FN - 1, i + j));
      sx += tx[q] * w[j + R];
      sy += ty[q] * w[j + R];
    }
    const [ux, uy] = unit([sx, sy]);
    // the normal pointing NORTH of an eastward road (y is south): (ty, -tx)
    FNX[i] = uy;
    FNY[i] = -ux;
  }
})();
/** world point (local metres) at road arclength s, lateral offset d (+ north) */
export const frameAt = (s: number, d: number): P2 => {
  let x = (s - F_S0) / FS;
  if (x < 0) x = 0;
  if (x > FN - 1.000001) x = FN - 1.000001;
  const i = Math.floor(x);
  const u = x - i;
  const px = FPX[i] + (FPX[i + 1] - FPX[i]) * u;
  const py = FPY[i] + (FPY[i + 1] - FPY[i]) * u;
  const nx = FNX[i] + (FNX[i + 1] - FNX[i]) * u;
  const ny = FNY[i] + (FNY[i + 1] - FNY[i]) * u;
  return [px + nx * d, py + ny * d];
};

// ---------------------------------------------------------------------------
// THE CAMERA. A framing = the plaza (its box centre PLAZA_C) at a screen point
// P at zoom k. ln k is the integral of four cosine-tapered velocity bumps
// (makeTrack, C1): the opening drift (f-40..80), the pull-back's slow start
// (f44..128), the big pull-back (f76..132) and the closing creep (f96..172,
// decaying through the tail); their areas are SOLVED so ln k passes exactly
// through the keyed zooms on f52, f87 and f122, and the last frame's zoom is
// the pull-back's own landing carried on at TAIL_DRIFT of its speed (so the
// creep never reverses it). P runs through its keys on a monotone cubic
// (pchip: C1, no overshoot), so the plaza HOLDS its screen point through the
// pull-back (the zoom is anchored on it). The frame centre follows:
// cx = PLAZA_C.x - (Px - 540) / k.
// ---------------------------------------------------------------------------
/** the plaza's box centre (local metres) */
export const PLAZA_C: P2 = [24, -5.5];
export type Win = [number, number, number];
export type CamKeyP = { f: number; k: number; p: P2 };
export const CAM_KEYS: CamKeyP[] = [
  { f: 0, k: 2.0, p: [430, 826] }, // the plaza, ~360 px wide, the road leading off east; drifting east
  { f: W.pizarro, k: 1.88, p: [388, 806] }, // PIZARRO lands; the procession coming in along the road
  { f: W.cajamarca, k: 1.0, p: [300, 826] }, // CAJAMARCA lands; the head at the gate; the army's front at the far right
  { f: 122, k: 0.1, p: [302, 828] }, // the wide (5 f before "army"): the plaza at the left third, the army back to the springs
];
/** the plaza's screen point on the last frame (the decaying drift) */
export const P_LAST: P2 = [305, 827];
export const WINS: Win[] = [
  [-40, 80, 1],
  [44, 128, 1],
  [76, 132, 1],
  [96, 172, 1],
];
/** the closing creep: the pull-back's landing velocity carried on at this fraction */
export const TAIL_DRIFT = 0.1;
const solveTrack = (wins: Win[], keyF: number[], v0: number, targets: number[]) => {
  const unitT = wins.map(([a, b, t]) => makeTrack([[a, b, 1, t]] as Bump[], 0));
  const n = wins.length;
  const m = keyF.map((f, r) => [...unitT.map((u) => u(f)), targets[r] - v0]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const q = m[r][c] / m[c][c];
      for (let j = c; j <= n; j++) m[r][j] -= q * m[c][j];
    }
  }
  const areas = m.map((row, i) => row[n] / row[i]);
  return { track: makeTrack(wins.map(([a, b, t], i) => [a, b, areas[i], t]) as Bump[], v0), areas };
};
/** the camera through keyed framings (exported so the check scripts can try variants) */
export const buildCamera = (keys: CamKeyP[], wins: Win[], pLast: P2 = P_LAST, drift = TAIL_DRIFT) => {
  const keyF = keys.slice(1).map((q) => q.f);
  const v0 = Math.log(keys[0].k);
  const tg = keys.slice(1).map((q) => Math.log(q.k));
  // the free landing (three bumps, three keys), then the tail key from it
  const free = solveTrack(wins.slice(0, -1), keyF, v0, tg);
  const fe = keys[keys.length - 1].f;
  const v = free.track(fe + 0.5) - free.track(fe - 0.5);
  const tail = free.track(LAST) + v * (LAST - fe) * drift;
  const lnk = solveTrack(wins, [...keyF, LAST], v0, [...tg, tail]);
  const px = pchip([...keys.map((q) => [q.f, q.p[0]] as [number, number]), [LAST, pLast[0]]]);
  const py = pchip([...keys.map((q) => [q.f, q.p[1]] as [number, number]), [LAST, pLast[1]]]);
  const camAt = (f: number): Cam => {
    const k = Math.exp(lnk.track(f));
    return { k, cx: PLAZA_C[0] - (px(f) - SCREEN_CX) / k, cy: PLAZA_C[1] - (py(f) - SCREEN_CY) / k };
  };
  /** the plaza's authored screen point at f */
  const plazaAt = (f: number): P2 => [px(f), py(f)];
  return { camAt, plazaAt, areas: { lnk: lnk.areas } };
};
const CAMERA = buildCamera(CAM_KEYS, WINS);
export const CAM_AREAS = CAMERA.areas;
/** the authored camera at frame f (no sway) */
export const camAt = CAMERA.camAt;
export const plazaAt = CAMERA.plazaAt;
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));

// ---------------------------------------------------------------------------
// THE PROCESSION'S PATH (PROC_PATH, local metres). The road from the camp runs
// to the plaza's open-country (fortress) corner; the plaza's two gates open on
// the town side (incaShared PLAZA: NW and SW corners). The procession leaves
// the road just short of the corner and walks round the outside of the SE
// wall (24 m out: the town's street) to the SW gate, turns in and enters.
// sigma = metres from the gate's middle (0), + outward toward the camp, -
// inside the plaza. Smoothed (gaussian 4 m) so the column wheels round the
// corners.
// ---------------------------------------------------------------------------
const GATE = (PLAZA.gates as Gate[]).find((g) => g.name === "southwest") as Gate;
const C_SW = PLAZA.corners.southwest as P2;
const C_FORT = PLAZA.corners.fortress as P2;
const WALL_U = unit([C_FORT[0] - C_SW[0], C_FORT[1] - C_SW[1]]);
/** the SE wall's outward normal (away from the square) */
const WALL_OUT: P2 = [-WALL_U[1], WALL_U[0]];
const wallPt = (t: number, off: number): P2 => [
  C_SW[0] + (C_FORT[0] - C_SW[0]) * t + WALL_OUT[0] * off,
  C_SW[1] + (C_FORT[1] - C_SW[1]) * t + WALL_OUT[1] * off,
];
export const PATH_OFF = 34;
const PATH_STEP = 0.5;
const PATH = (() => {
  const gp = GATE.p as P2;
  const gn = GATE.n as P2;
  const at = (t: number): P2 => [gp[0] + gn[0] * t, gp[1] + gn[1] * t];
  // the J into the gate: one smooth turn (a Hermite arc, its tightest radius
  // ~10 m) from the street along the SE wall round the SW corner into the
  // opening (the column files in narrow there: see latScale)
  const jA = wallPt(0.12, PATH_OFF);
  const jB = at(14);
  const jHerm = (u: number): P2 => {
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10 = u ** 3 - 2 * u ** 2 + u;
    const h01 = -2 * u ** 3 + 3 * u ** 2;
    const h11 = u ** 3 - u ** 2;
    const tA: P2 = [WALL_U[0] * 100, WALL_U[1] * 100]; // back along the wall (the curve runs gate -> wall)
    const tB: P2 = [gn[0] * 60, gn[1] * 60];
    // parameterised from the gate side (u 0) to the wall side (u 1)
    return [h00 * jB[0] + h10 * tB[0] + h01 * jA[0] + h11 * tA[0], h00 * jB[1] + h10 * tB[1] + h01 * jA[1] + h11 * tA[1]];
  };
  const ctrl: P2[] = [
    at(-48),
    at(-20),
    gp,
    ...Array.from({ length: 41 }, (_, q) => jHerm(q / 40)),
    wallPt(0.3, PATH_OFF),
    wallPt(0.55, PATH_OFF),
    wallPt(0.8, PATH_OFF),
    [wallPt(1, PATH_OFF)[0] + WALL_U[0] * 12, wallPt(1, PATH_OFF)[1] + WALL_U[1] * 12],
  ];
  for (let s = 70; s <= ROAD.len; s += 4) ctrl.push(ROAD.pointAt(s));
  // resample, smooth, measure
  const cum = (pts: P2[]) => {
    const c = new Float64Array(pts.length);
    for (let i = 1; i < pts.length; i++) c[i] = c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return c;
  };
  const c0 = cum(ctrl);
  const L0 = c0[c0.length - 1];
  const res: P2[] = [];
  let j = 0;
  for (let s = 0; s <= L0; s += PATH_STEP) {
    while (j < ctrl.length - 2 && c0[j + 1] < s) j++;
    const u = (s - c0[j]) / (c0[j + 1] - c0[j] || 1);
    res.push([ctrl[j][0] + (ctrl[j + 1][0] - ctrl[j][0]) * u, ctrl[j][1] + (ctrl[j + 1][1] - ctrl[j][1]) * u]);
  }
  const sig = 12; // samples (6 m)
  const sm: P2[] = res.map((_, i) => {
    let x = 0;
    let y = 0;
    let wsum = 0;
    for (let q = -3 * sig; q <= 3 * sig; q++) {
      const p = res[Math.max(0, Math.min(res.length - 1, i + q))];
      const g = Math.exp(-(q * q) / (2 * sig * sig));
      x += p[0] * g;
      y += p[1] * g;
      wsum += g;
    }
    return [x / wsum, y / wsum] as P2;
  });
  const c = cum(sm);
  // sigma 0 at the point nearest the gate's middle
  let i0 = 0;
  let bd = Infinity;
  for (let i = 0; i < sm.length; i++) {
    const d = Math.hypot(sm[i][0] - gp[0], sm[i][1] - gp[1]);
    if (d < bd) [bd, i0] = [d, i];
  }
  const sig0 = c[i0];
  const n = sm.length;
  const nx = new Float64Array(n);
  const ny = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = sm[Math.max(0, i - 3)];
    const b = sm[Math.min(n - 1, i + 3)];
    const [ux, uy] = unit([b[0] - a[0], b[1] - a[1]]);
    nx[i] = -uy;
    ny[i] = ux;
  }
  return { pts: sm, sigma: Array.from(c, (v) => v - sig0), nx, ny };
})();
const P_N = PATH.pts.length;
export const PATH_MIN = PATH.sigma[0];
export const PATH_MAX = PATH.sigma[P_N - 1];
const pathIdx = (sg: number) => {
  const S = PATH.sigma;
  if (sg <= S[0]) return 0;
  if (sg >= S[P_N - 1]) return P_N - 1.000001;
  let lo = 0;
  let hi = P_N - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (S[m] <= sg) lo = m;
    else hi = m;
  }
  return lo + (sg - S[lo]) / (S[hi] - S[lo] || 1);
};
/** the world point at path distance sigma (from the gate) and lateral offset lat */
export const pathAt = (sg: number, lat = 0): P2 => {
  const x = pathIdx(sg);
  const i = Math.min(P_N - 2, Math.floor(x));
  const u = x - i;
  const a = PATH.pts[i];
  const b = PATH.pts[i + 1];
  const nx = PATH.nx[i] + (PATH.nx[i + 1] - PATH.nx[i]) * u;
  const ny = PATH.ny[i] + (PATH.ny[i + 1] - PATH.ny[i]) * u;
  return [a[0] + (b[0] - a[0]) * u + nx * lat, a[1] + (b[1] - a[1]) * u + ny * lat];
};
/** sigma of road arclength s (on the road part, s >= 120) and back */
export const SIGMA_R120 = (() => {
  const p = ROAD.pointAt(120);
  let bi = 0;
  let bd = Infinity;
  for (let i = 0; i < P_N; i++) {
    const d = Math.hypot(PATH.pts[i][0] - p[0], PATH.pts[i][1] - p[1]);
    if (d < bd) [bd, bi] = [d, i];
  }
  return PATH.sigma[bi];
})();
export const roadSOfSigma = (sg: number) => 120 + (sg - SIGMA_R120);

// ---------------------------------------------------------------------------
// THE PROCESSION (FACTS sections 2, 7): ~6,000 unarmed attendants ("five or
// six thousand", Hernando Pizarro p.117). Order of march, head first (Xerez
// p.53): a squadron in chequered livery sweeping the road (400: Mena p.240;
// Hernando Pizarro 300-400), three squadrons dancing and singing, the lords
// "with armour, large metal plates, and crowns" with Atahualpa's litter among
// their leading ranks, carried high on many shoulders (80 bearers: the
// Relacion via Markham p.53n), then the rest. The other sections' sizes are
// not given: drawn 3 x 250 dancers, 600 lords, the rest to 6,000.
// ONE CONTINUOUS ORGANIC COLUMN: a single ribbon along PROC_PATH whose men per
// metre rise and fall in soft pulses (each squadron a pulse with a rounded
// head and tail, 1 / (1 + x^8); a thin floor of men between them, so there is
// never a clean gap); its width follows the density (wide in a squadron,
// narrow between); its two edges ragged (noise), its men blue noise
// (relaxed to the local spacing), each with his own limit at the edge (a
// feathered fringe). The litter rides among the lords' leading ranks, its 80
// bearers a tight block under the glyph that the others make room for.
// ---------------------------------------------------------------------------
export const N_PROC = 6000;
export const N_BEARERS = 80;
type Pulse = { name: string; c: number; h: number; n: number };
const PULSE_X = 8; // the plateau 1 / (1 + x^8)
const PULSE_INT = (2 * Math.PI) / PULSE_X / Math.sin(Math.PI / PULSE_X); // its integral over x
const N_FLOOR = 260;
const N_REST = N_PROC - 400 - 3 * 250 - 600 - N_BEARERS - N_FLOOR;
/** the squadrons along the column: centre c and half-length h (m behind the head), n men */
// (peak ~10 men per metre, ~1.5 m apart: every man a visible dot close up)
export const PULSES: Pulse[] = [
  { name: "sweepers", c: 20, h: 19.5, n: 400 },
  { name: "dancers1", c: 60.7, h: 12.2, n: 250 },
  { name: "dancers2", c: 94.1, h: 12.2, n: 250 },
  { name: "dancers3", c: 127.5, h: 12.2, n: 250 },
  { name: "lords", c: 178.9, h: 29.2, n: 600 },
  ...[0, 1, 2, 3, 4].map((q) => ({ name: `rest${q + 1}`, c: 266 + 96 * q, h: 38.1, n: Math.round(N_REST / 5) + (q === 0 ? N_REST - 5 * Math.round(N_REST / 5) : 0) })),
];
/** the litter among the lords' leading ranks */
export const O_LITTER = 163;
const COL_END = 700;
const floorShape = (o: number) => sstep((o + 3) / 8) * (1 - sstep((o - (COL_END - 22)) / 22));
const FLOOR_INT = (() => {
  let a = 0;
  for (let o = -20; o <= COL_END + 40; o += 0.25) a += floorShape(o) * 0.25;
  return a;
})();
/** men per metre of column at rest offset o (the bearers excluded) */
export const lambdaAt = (o: number) => {
  let l = (N_FLOOR * floorShape(o)) / FLOOR_INT;
  for (const P of PULSES) {
    const x = (o - P.c) / P.h;
    l += (P.n / (PULSE_INT * P.h)) / (1 + Math.pow(x, PULSE_X));
  }
  return l;
};
const LAMBDA_REF = 10.2;
const W_MIN = 2.0;
const W_PEAK = 11.6;
/** the ribbon's half-width (m) at o: wide in a squadron, narrow between */
export const widthAt = (o: number) => W_MIN + (W_PEAK - W_MIN) * Math.pow(Math.min(1.15, lambdaAt(o) / LAMBDA_REF), 0.65);
/** the ragged edge on each side (side +1 / -1) */
const edgeAt = (o: number, side: number) =>
  widthAt(o) * (1 + 0.17 * (vnoise(o / 6.5, side > 0 ? 0.3 : 5.3, 77) - 0.5) + 0.1 * (vnoise(o / 2.2, side > 0 ? 0.7 : 4.1, 78) - 0.5));
/** the procession's dots: o = metres behind the head (at rest), l = lateral (m) */
export const P_O = new Float32Array(N_PROC);
export const P_L = new Float32Array(N_PROC);
(() => {
  // the bearers: a tight block round the litter (pinned)
  for (let q = 0; q < N_BEARERS; q++) {
    P_O[q] = O_LITTER - 3.6 + Math.floor(q / 8) * 0.8 + 0.1 * (ih(q, 1, 12) - 0.5);
    P_L[q] = ((q % 8) - 3.5) * 0.7 + 0.1 * (ih(q, 2, 12) - 0.5);
  }
  // everybody else: density-adaptive best-candidate placement (Mitchell):
  // each man is the best of K candidates (drawn from the density along the
  // column and across the ribbon to his own ragged edge limit), the one
  // farthest from the men already placed in units of the local spacing; so
  // the column fills evenly (no voids, no clumps), its fringe feathered
  const N_FREE = N_PROC - N_BEARERS;
  const O0 = -20;
  const O1 = COL_END + 40;
  const STEP = 0.05;
  const cdf: number[] = [0];
  for (let o = O0; o < O1; o += STEP) cdf.push(cdf[cdf.length - 1] + lambdaAt(o + STEP / 2) * STEP);
  const tot = cdf[cdf.length - 1];
  const invCdf = (t: number) => {
    let lo = 0;
    let hi = cdf.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (cdf[m] <= t) lo = m;
      else hi = m;
    }
    return O0 + (lo + (t - cdf[lo]) / (cdf[hi] - cdf[lo] || 1)) * STEP;
  };
  const spacing = (o: number) => 0.92 * Math.sqrt(2 / (Math.sqrt(3) * Math.max(0.05, lambdaAt(o) / (2 * widthAt(o)))));
  const CELL = 2.2;
  const xs = new Float64Array(N_PROC);
  const ys = new Float64Array(N_PROC);
  const grid = new Map<number, number[]>();
  const key = (a2: number, b2: number) => (a2 + 64) * 8192 + (b2 + 64);
  const insert = (i: number) => {
    const k2 = key(Math.floor(xs[i] / CELL), Math.floor(ys[i] / CELL));
    const g = grid.get(k2);
    if (g) g.push(i);
    else grid.set(k2, [i]);
  };
  const nearest = (o: number, l: number, cap: number) => {
    const gx = Math.floor(o / CELL);
    const gy = Math.floor(l / CELL);
    const R = Math.ceil(cap / CELL);
    let best = cap;
    for (let a2 = gx - R; a2 <= gx + R; a2++)
      for (let b2 = gy - R; b2 <= gy + R; b2++) {
        const g = grid.get(key(a2, b2));
        if (!g) continue;
        for (const j of g) {
          const d = Math.hypot(xs[j] - o, ys[j] - l);
          if (d < best) best = d;
        }
      }
    return best;
  };
  for (let q = 0; q < N_BEARERS; q++) {
    xs[q] = P_O[q];
    ys[q] = P_L[q];
    insert(q);
  }
  const K = 9;
  for (let j = 0; j < N_FREE; j++) {
    let bs = -1;
    let bo = 0;
    let bl = 0;
    for (let c = 0; c < K; c++) {
      const o = invCdf(ih(j, c, 601) * tot);
      const side = ih(j, c + 50, 602) < 0.5 ? -1 : 1;
      const lim = 0.9 + 0.45 * Math.pow(ih(j, c + 100, 603), 4);
      const l = side * ih(j, c + 150, 604) * edgeAt(o, side) * lim;
      const sp = spacing(o);
      const sc = nearest(o, l, 3 * sp) / sp;
      if (sc > bs) [bs, bo, bl] = [sc, o, l];
    }
    xs[N_BEARERS + j] = bo;
    ys[N_BEARERS + j] = bl;
    insert(N_BEARERS + j);
  }
  // a light relaxation (push close pairs apart to the local spacing; the
  // bearers pinned; each man kept inside his ragged edge)
  const sp = Float64Array.from(xs, (o) => spacing(o));
  // each man's own edge limit: most inside the edge, a few stragglers past it
  const lim = Float64Array.from({ length: N_PROC }, (_, i) => (i < N_BEARERS ? 1 : Math.max(1, Math.abs(ys[i]) / Math.max(0.1, edgeAt(xs[i], ys[i] >= 0 ? 1 : -1)))));
  for (let it = 0; it < 5; it++) {
    const g2 = new Map<number, number[]>();
    for (let i = 0; i < N_PROC; i++) {
      const k2 = key(Math.floor(xs[i] / 2.8), Math.floor(ys[i] / 2.8));
      const g = g2.get(k2);
      if (g) g.push(i);
      else g2.set(k2, [i]);
    }
    const dx = new Float64Array(N_PROC);
    const dy = new Float64Array(N_PROC);
    for (let i = 0; i < N_PROC; i++) {
      const gx = Math.floor(xs[i] / 2.8);
      const gy = Math.floor(ys[i] / 2.8);
      for (let a2 = gx - 1; a2 <= gx + 1; a2++)
        for (let b2 = gy - 1; b2 <= gy + 1; b2++) {
          const g = g2.get(key(a2, b2));
          if (!g) continue;
          for (const j of g) {
            if (j <= i) continue;
            const ex = xs[j] - xs[i];
            const ey = ys[j] - ys[i];
            const d = Math.hypot(ex, ey);
            const want = 0.5 * (sp[i] + sp[j]);
            if (d >= want || d < 1e-9) continue;
            const m = (0.5 * (want - d)) / d;
            const wi = i < N_BEARERS ? 0 : j < N_BEARERS ? 2 : 1;
            const wj = j < N_BEARERS ? 0 : i < N_BEARERS ? 2 : 1;
            dx[i] -= ex * m * 0.5 * wi;
            dy[i] -= ey * m * 0.5 * wi;
            dx[j] += ex * m * 0.5 * wj;
            dy[j] += ey * m * 0.5 * wj;
          }
        }
    }
    for (let i = N_BEARERS; i < N_PROC; i++) {
      xs[i] += dx[i];
      ys[i] += dy[i];
      const e = edgeAt(xs[i], ys[i] >= 0 ? 1 : -1) * lim[i];
      if (Math.abs(ys[i]) > e) ys[i] = Math.sign(ys[i]) * e;
      sp[i] = spacing(xs[i]);
    }
  }
  for (let i = 0; i < N_PROC; i++) {
    P_O[i] = xs[i];
    P_L[i] = ys[i];
  }
})();
export const PROC_LEN = Math.max(...Array.from(P_O));
/** the column follows its head with a delay of o / C_WAVE frames */
const C_WAVE = 120;
/** the head's speed profile toward the gate (m / f; shapes, scaled below) */
const V_IN: [number, number][] = [
  [-60, 8.6],
  [0, 8.4],
  [20, 8.0],
  [40, 7.0],
  [60, 5.4],
  [75, 4.0],
  [W.cajamarca, 3.0],
];
const V_AFTER: [number, number][] = [
  [W.cajamarca, 3.0],
  [95, 1.9],
  [105, 0.8],
  [115, 0.15],
  [122, 0],
];
const vIn = pchip(V_IN);
const vAfter = pchip(V_AFTER, false);
const integ = (fn: (f: number) => number, a: number, b: number) => {
  const n = Math.max(1, Math.ceil(Math.abs(b - a) * 8));
  const h = (b - a) / n;
  let acc = 0;
  for (let q = 0; q < n; q++) acc += Math.max(0, fn(a + (q + 0.5) * h)) * h;
  return acc;
};
/** the head enters the frame on "proceeds": sigma at the right edge on f14 (8 px in) */
export const SIGMA_ENTRY = (() => {
  const cam = camAt(W.proceeds);
  const xEdge = cam.cx + (1080 - 8 - SCREEN_CX) / cam.k;
  let lo = 0;
  let hi = 1500;
  for (let it = 0; it < 60; it++) {
    const m = (lo + hi) / 2;
    if (pathAt(m)[0] < xEdge) lo = m;
    else hi = m;
  }
  return lo;
})();
const H_SCALE = SIGMA_ENTRY / integ(vIn, W.proceeds, W.cajamarca);
/** the head stops 24 m inside the gate */
export const SIGMA_STOP = -24;
const H_SCALE_AFTER = -SIGMA_STOP / integ(vAfter, W.cajamarca, 122);
const headSigmaExact = (f: number) => {
  if (f <= W.cajamarca) return H_SCALE * integ(vIn, f, W.cajamarca);
  return -H_SCALE_AFTER * integ(vAfter, W.cajamarca, Math.min(122, f));
};
// a table at 1/8 frame (the per-dot lookups stay cheap)
const HT0 = -60;
const HT1 = 170;
const HTS = 8;
const HEAD_TAB = Float64Array.from({ length: (HT1 - HT0) * HTS + 1 }, (_, q) => headSigmaExact(HT0 + q / HTS));
/** the procession head's path distance from the gate at frame f */
export const headSigma = (f: number) => {
  const x = (Math.max(HT0, Math.min(HT1, f)) - HT0) * HTS;
  const q = Math.min(HEAD_TAB.length - 2, Math.floor(x));
  return HEAD_TAB[q] + (HEAD_TAB[q + 1] - HEAD_TAB[q]) * (x - q);
};
/** the head's speed (m / f) */
export const headV = (f: number) => headSigma(f - 0.5) - headSigma(f + 0.5);
// THE MARCH'S RHYTHM: a slow surge travels back along the column (each
// squadron in turn bunches up and draws out, +-SURGE_A metres, a period of
// SURGE_T frames, one squadron's length apart), dying away as the column
// halts; each man sways a little sideways on his own phase
export const SURGE_A = 1.5;
const SURGE_L = 64;
const SURGE_T = 30;
const SWAY_A = 0.28;
const MEANDER_A = 0.45;
const gaitAt = (o: number, f: number) => sstep(headV(f - o / C_WAVE) / 2.5);
const surge = (o: number, f: number) => SURGE_A * gaitAt(o, f) * Math.sin((2 * Math.PI * f) / SURGE_T - (2 * Math.PI * o) / SURGE_L);
const meander = (o: number, f: number) => MEANDER_A * gaitAt(o, f) * Math.sin((2 * Math.PI * o) / 85 - 0.05 * f);
/** path distance of the column member with rest offset o at frame f */
export const columnSigma = (o: number, f: number) => headSigma(f - o / C_WAVE) + o + surge(o, f);
// the column files in narrow: it narrows over the last ~95 m before the SW
// gate (10 m wide; through the J round the corner), and fans out a little
// inside; where the path bends hard it narrows to keep its inner edge
const latScaleGate = (sg: number) => (sg >= 0 ? 0.4 + 0.6 * sstep((sg - 25) / 70) : 0.4 + (0.65 - 0.4) * sstep(-sg / 16));
const LAT_CURV = (() => {
  const n = PATH.pts.length;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const a = PATH.pts[Math.max(0, i - 8)];
    const b = PATH.pts[i];
    const c = PATH.pts[Math.min(n - 1, i + 8)];
    const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let dt = t2 - t1;
    while (dt > Math.PI) dt -= 2 * Math.PI;
    while (dt < -Math.PI) dt += 2 * Math.PI;
    const ds = Math.hypot(c[0] - a[0], c[1] - a[1]) / 2 || 1;
    const kappa = Math.abs(dt) / ds;
    out[i] = Math.min(1, (0.75 / Math.max(1e-6, kappa)) / (W_PEAK * 1.25));
  }
  // smoothed along the path (gaussian, 5 m), so the scale never steps
  const sm = new Float64Array(n);
  const sig = 10;
  for (let i = 0; i < n; i++) {
    let a = 0;
    let w = 0;
    for (let j = -3 * sig; j <= 3 * sig; j++) {
      const g = Math.exp(-(j * j) / (2 * sig * sig));
      a += out[Math.max(0, Math.min(n - 1, i + j))] * g;
      w += g;
    }
    sm[i] = a / w;
  }
  return sm;
})();
const latScale = (sg: number) => {
  const x = pathIdx(sg);
  const i = Math.min(P_N - 2, Math.floor(x));
  const c = LAT_CURV[i] + (LAT_CURV[i + 1] - LAT_CURV[i]) * (x - i);
  return c * latScaleGate(sg);
};
/** the litter's path distance at f */
export const litterSigma = (f: number) => columnSigma(O_LITTER, f);
export const tailSigma = (f: number) => headSigma(f - PROC_LEN / C_WAVE) + PROC_LEN;
/** the litter's world point at f (it rides in the flow) */
export const litterAt = (f: number): P2 => {
  const sg = litterSigma(f);
  return pathAt(sg, meander(O_LITTER, f) * latScale(sg));
};
/** every procession dot at frame f (world metres, flat) */
export const processionXY = (f: number, k: number): Float32Array => {
  const out = new Float32Array(2 * N_PROC);
  const amp = 0.18 / k;
  for (let i = 0; i < N_PROC; i++) {
    const o = P_O[i];
    const sg = columnSigma(o, f);
    const g = gaitAt(o, f);
    const sway = SWAY_A * (0.5 + 0.5 * g) * Math.sin(f * (0.1 + 0.05 * ih(i, 12, 23)) + 6.28 * ih(i, 13, 23));
    const lat = (P_L[i] + sway + meander(o, f)) * latScale(sg);
    const [x, y] = pathAt(sg, lat);
    out[2 * i] = x + amp * Math.sin(f * (0.05 + 0.03 * ih(i, 8, 22)) + 6.28 * ih(i, 9, 22));
    out[2 * i + 1] = y + amp * Math.sin(f * (0.05 + 0.03 * ih(i, 10, 22)) + 6.28 * ih(i, 11, 22));
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE LANE: the warriors marched "in the fields on both sides of the road,
// never on it" (Pedro Pizarro p.180). The road is kept clear (|d| >= LANE)
// along the procession's stretch of road only, from just ahead of its head to
// just behind its tail; it closes behind the procession as the warriors fill
// in.
// ---------------------------------------------------------------------------
export const LANE = 22;
export const laneAt = (s: number, f: number) => {
  const sH = roadSOfSigma(Math.max(SIGMA_R120, headSigma(f)));
  const sT = roadSOfSigma(tailSigma(f));
  if (sT < 120) return 0;
  return LANE * sstep((s - (sH - 80)) / 50) * (1 - sstep((s - (sT + 40)) / 60));
};

// ---------------------------------------------------------------------------
// THE CAMP (start, FACTS section 2): Atahualpa lodged by the hot springs
// (Pultumarca, Banos del Inca: incaShared CAMP); the camp's "cotton tents on
// the skirts of a small hill, stretching for a league ... with Atahualpa's in
// the centre" (Xerez pp.47-50), "white tents for more than half a league"
// (Mena p.232). Drawn as a broad, round, organic field centred on the springs,
// 2.3 km along the road's line and 3.0 km across it, its density easing
// toward a feathered edge (no source gives its orientation). Its 80,000 men:
// Hemming's "nearly 80,000" (Mena's upper figure).
// ---------------------------------------------------------------------------
export const N_ARMY = 80000;
export const CAMP_S = S_SPRINGS;
export const CAMP_RS = 1150;
export const CAMP_RD = 1500;
const campQ = (s: number, d: number) => {
  const u = (s - CAMP_S) / CAMP_RS;
  const v = d / CAMP_RD;
  const th = Math.atan2(v, u);
  const rr = 1 + 0.06 * Math.sin(2 * th + 0.7) + 0.05 * Math.sin(3 * th + 2.2) + 0.035 * Math.sin(5 * th + 4.1) + 0.02 * Math.sin(8 * th + 1.1);
  return Math.hypot(u, v) / rr;
};
const campShape = (s: number, d: number, seed: number) => {
  const q = campQ(s, d);
  if (q > 1.45) return 0;
  return Math.exp(-Math.pow(q / 0.86, 4)) * (0.66 + 0.68 * vnoise(s / 280, d / 280, seed));
};

// ---------------------------------------------------------------------------
// THE DEPLOYMENT (end, FACTS section 2). Atahualpa halted "about half a
// quarter of a league" (0.5-0.7 km) from the town and formed his men in three
// divisions; "the whole road was full of men" (Hernando Pizarro p.117);
// Hemming puts the main force about a quarter league (1-1.4 km) out.
//   THE THREE DIVISIONS (4,000 each), 0.65-1.1 km short of the town: rounded,
//     irregular masses (blue noise, incaShared packCrowd, in noise-wobbled
//     ovals), the centre on the road, a wing each side set back a little
//   THE FIELDS behind them (FIELDS_SIDE a side), on both sides of the road
//     back into the camp: thickest along the road, easing outward, fraying
//     into fingers (streaks along the march) and stragglers at the margins;
//     the front behind the divisions ragged
//   THE CAMP, thinned, as the army's tail (TAIL_SIDE a side): broad and thin,
//     fuller in the east ("as full of people as if none were wanting" the
//     next morning, Hernando Pizarro p.119), emptying from the west
// ---------------------------------------------------------------------------
type Blob = { sc: number; dc: number; rs: number; rd: number; tilt: number; seed: number };
/** the three divisions: wider across the road than deep (rd > rs), each a
 *  little tilted, irregular, with a ragged front facing the town (low s) */
export const DIVISIONS: Blob[] = [
  { sc: 870, dc: 0, rs: 150, rd: 300, tilt: 0.05, seed: 11 },
  { sc: 960, dc: 640, rs: 140, rd: 240, tilt: -0.09, seed: 31 },
  { sc: 960, dc: -640, rs: 140, rd: 240, tilt: 0.08, seed: 51 },
];
export const N_PER_DIVISION = 4000;
/** a division's outline radius at local angle th (units of its half-axes): a
 *  rounded superellipse (n 2.6), low harmonics (irregular), and on its front
 *  (cos th < 0, toward the town) a ragged edge of higher harmonics */
const blobR = (B: Blob, th: number) => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const n = 2.4;
  let r = 1 / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n);
  const amp = [0.08, 0.1, 0.06, 0.045, 0.03];
  for (let j = 2; j <= 6; j++) r *= 1 + amp[j - 2] * Math.sin(j * th + 6.283 * ih(j, B.seed, 701));
  const front = Math.max(0, -c);
  r *= 1 + front * (0.13 * Math.sin(7 * th + 6.283 * ih(7, B.seed, 702)) + 0.09 * Math.sin(11 * th + 6.283 * ih(11, B.seed, 703)) + 0.06 * Math.sin(17 * th + 6.283 * ih(17, B.seed, 704)));
  return r;
};
/** (s, d) -> the division's local frame (u, v), in units of its half-axes */
const toLocal = (B: Blob, s: number, d: number): P2 => {
  const ds = s - B.sc;
  const dd = d - B.dc;
  const ct = Math.cos(B.tilt);
  const st = Math.sin(B.tilt);
  return [(ds * ct + dd * st) / B.rs, (-ds * st + dd * ct) / B.rd];
};
/** a division's outline in (s, d), 160 vertices; grow scales it about its centre */
const blobRing = (B: Blob, grow = 1): P2[] =>
  Array.from({ length: 160 }, (_, i) => {
    const th = (i / 160) * 2 * Math.PI;
    const r = blobR(B, th) * grow;
    const a = r * Math.cos(th) * B.rs;
    const b = r * Math.sin(th) * B.rd;
    const ct = Math.cos(B.tilt);
    const st = Math.sin(B.tilt);
    return [B.sc + a * ct - b * st, B.dc + a * st + b * ct] as P2;
  });
export const DIVISION_RINGS: P2[][] = DIVISIONS.map((B) => blobRing(B));
/** a division's dots: blue noise (packCrowd) in its outline grown by 1.3, then
 *  thinned toward the edge (density easing outward, ragged with noise, more
 *  ragged and straggling at the front), so it reads as a mass of men
 *  feathering into the field, never a cutout */
const DIV_PTS: P2[][] = DIVISIONS.map((B, bi) => {
  const cand = packCrowd(blobRing(B, 1.3), Math.round(N_PER_DIVISION * 1.75), undefined, 900 + bi);
  const keyed = cand.map(([s, d], ci) => {
    const [u, v] = toLocal(B, s, d);
    const th = Math.atan2(v, u);
    const q = Math.hypot(u, v) / blobR(B, th);
    const front = Math.max(0, -Math.cos(th));
    const rag = 0.12 * (vnoise(s / 60, d / 60, B.seed + 3) - 0.5) + front * 0.22 * (vnoise(s / 20, d / 20, B.seed + 9) - 0.5);
    // a defined but soft edge; ahead of the front a few stragglers
    const body = sstep((1.12 - q + rag) / 0.3);
    const strag = 0.16 * front * sstep((1.38 - q) / 0.25);
    const keep = Math.max(body, strag);
    return { p: [s, d] as P2, key: ih(ci, bi, 911) / Math.max(1e-6, keep) };
  });
  keyed.sort((a, b) => a.key - b.key);
  return keyed.slice(0, N_PER_DIVISION).map((o) => o.p);
});
/** the fields' half-width scale (m) */
const bodyW = (s: number) => 520 + 430 * sstep((s - 1100) / 3800);
const fieldsRho = (s: number, ad: number, seed: number) => {
  // the front behind the divisions, ragged
  const frontS = 960 + 180 * (vnoise(ad / 170, 0.5, seed) - 0.5);
  const front = 0.35 * sstep((s - frontS) / 140) + 0.65 * sstep((s - (frontS + 220)) / 260);
  if (front <= 0) return 0;
  const back = 1 - sstep((s - 4700) / 900);
  if (back <= 0) return 0;
  const w = bodyW(s) * (1 + 0.34 * (vnoise(s / 600, 0.3, seed + 1) - 0.5));
  const x = ad / w;
  // thick along the road, easing outward
  const core = Math.exp(-Math.pow(x, 1.5));
  // fingers: streaks along the march at the margins
  const nf = 0.65 * vnoise(s / 760, ad / 150, seed + 2) + 0.35 * vnoise(s / 330, ad / 70, seed + 4);
  const fing = sstep((nf - 0.46) / 0.24);
  const edge = sstep((x - 0.8) / 0.7);
  const coreF = core * (1 - edge + edge * (0.2 + 0.8 * fing));
  const ext = 0.28 * fing * Math.exp(-Math.pow(x / 2.1, 2)) * sstep((x - 0.85) / 0.5);
  // stragglers
  const halo = 0.045 * Math.exp(-x / 1.6);
  const along = 1.12 - 0.32 * sstep((s - 1200) / 3800);
  return front * back * along * ((coreF + ext) * (0.72 + 0.56 * vnoise(s / 210, ad / 210, seed + 3)) + halo);
};
/** the camp's tail at the end: the camp's own field, thinned, emptier in the west */
const tailRho = (s: number, ad: number, sg: number, seed: number) =>
  campShape(s, sg * ad, seed) * (0.22 + 0.78 * sstep((s - (CAMP_S - 800)) / 1300));
export const TAIL_SIDE = 7800;

// ---------------------------------------------------------------------------
// SAMPLING a field of n dots: one jittered candidate per cell, the n with the
// smallest exponential keys -ln(u)/rho win (weighted sampling without
// replacement: density-proportional, never two in a cell)
// ---------------------------------------------------------------------------
type Field = { s: Float64Array; d: Float64Array };
const quickselect = (a: Float64Array, n: number, k: number) => {
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const pivot = a[(lo + hi) >> 1];
    let i = lo;
    let j = hi;
    while (i <= j) {
      while (a[i] < pivot) i++;
      while (a[j] > pivot) j--;
      if (i <= j) {
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
        i++;
        j--;
      }
    }
    if (k <= j) hi = j;
    else if (k >= i) lo = i;
    else return a[k];
  }
  return a[k];
};
const sampleField = (rho: (s: number, ad: number) => number, n: number, sLo: number, sHi: number, dHi: number, cell: number, seed: number): Field => {
  const nx = Math.ceil((sHi - sLo) / cell);
  const ny = Math.ceil(dHi / cell);
  const keys = new Float64Array(nx * ny);
  const cs = new Float64Array(nx * ny);
  const cd = new Float64Array(nx * ny);
  let m = 0;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const s = sLo + (i + ih(i, j, seed)) * cell;
      const d = (j + ih(i, j, seed + 1)) * cell;
      const r = rho(s, d);
      if (r <= 0) continue;
      keys[m] = -Math.log(1 - ih(i, j, seed + 2) * 0.9999999) / r;
      cs[m] = s;
      cd[m] = d;
      m++;
    }
  if (m < n) throw new Error(`vastArmyMotion: field ${seed} has ${m} cells for ${n} dots`);
  const tmp = Float64Array.from(keys.subarray(0, m));
  const th = quickselect(tmp, m, n - 1);
  const out: Field = { s: new Float64Array(n), d: new Float64Array(n) };
  let c = 0;
  for (let q = 0; q < m && c < n; q++)
    if (keys[q] < th) {
      out.s[c] = cs[q];
      out.d[c] = cd[q];
      c++;
    }
  for (let q = 0; q < m && c < n; q++)
    if (keys[q] === th) {
      out.s[c] = cs[q];
      out.d[c] = cd[q];
      c++;
    }
  return out;
};

// ---------------------------------------------------------------------------
// THE ARMY: per side of the road (40,000 each), the camp (start) and the
// deployment (end) sampled independently, then matched: both ranked by s, in
// bands of BAND, each band matched in lateral order (a monotone map: paths
// never cross; no dot changes side).
// ---------------------------------------------------------------------------
const N_SIDE = N_ARMY / 2;
const BAND = 256;
/** per-dot parameters: start (s0, d0), end (s1, d1), the stream's lateral
 *  offset dS and its weight, departure t0, duration */
export const A_S0 = new Float32Array(N_ARMY);
export const A_D0 = new Float32Array(N_ARMY);
export const A_S1 = new Float32Array(N_ARMY);
export const A_D1 = new Float32Array(N_ARMY);
export const A_DS = new Float32Array(N_ARMY);
export const A_LS = new Float32Array(N_ARMY);
export const A_T0 = new Float32Array(N_ARMY);
export const A_DUR = new Float32Array(N_ARMY);
/** what the dot ends as: 0 fields, 1 a division, 2 the camp's tail */
export const A_KIND = new Uint8Array(N_ARMY);
const A_PH = new Float32Array(N_ARMY * 4);
/** the departure wave (the army has been leaving the camp since before f0):
 *  f = T_GO + SPAN * rank^P (+- JIT/2); speed V m/f (+- VAR/2); the rear take
 *  at least D_MIN + D_R * rank frames; every walk's duration x (1 +- D_VAR/2).
 *  The jitter keeps neighbours in a rank band out of step, so no band ever
 *  moves as one line (no stripes in the wide) */
export const ARMY_T = { T_GO: -40, SPAN: 165, P: 1.1, JIT: 12, V: 58, VAR: 0.18, D_MIN: 28, D_R: 34, D_VAR: 0.36 };
/** THE TRANSIT STREAM: on the way each man closes up toward the road (a
 *  long-tailed lateral profile: most within ~150 m of the road, a few out to
 *  ~900 m), so the army moves as two broad, feathered streams flanking the
 *  road, and opens out into his place only as he arrives */
export const STREAM_L = 240;
const STREAM_IN = 1100;
const STREAM_OUT = 450;
const streamG = (q: number) => -Math.log(1 - 0.985 * q);
export const N_DIV_SIDE: number[] = [0, 0];
(() => {
  for (let side = 0; side < 2; side++) {
    const sg = side === 0 ? 1 : -1;
    const seed = 100 * (side + 1);
    // the end: this side's division dots, the fields and the tail
    const divS: number[] = [];
    const divD: number[] = [];
    DIV_PTS.forEach((pts) =>
      pts.forEach(([s, d]) => {
        if ((d >= 0 ? 1 : -1) === sg) {
          divS.push(s);
          divD.push(Math.abs(d));
        }
      }),
    );
    const nDiv = divS.length;
    N_DIV_SIDE[side] = nDiv;
    const nFields = N_SIDE - nDiv - TAIL_SIDE;
    const fields = sampleField((s, ad) => fieldsRho(s, ad, seed + 51), nFields, 900, 5700, 2300, 4, seed + 61);
    const tail = sampleField((s, ad) => tailRho(s, ad, sg, seed + 7), TAIL_SIDE, CAMP_S - CAMP_RS * 1.5, CAMP_S + CAMP_RS * 1.5, CAMP_RD * 1.5, 4, seed + 71);
    const end: Field = { s: new Float64Array(N_SIDE), d: new Float64Array(N_SIDE) };
    const kind = new Uint8Array(N_SIDE);
    end.s.set(divS, 0);
    end.d.set(divD, 0);
    kind.fill(1, 0, nDiv);
    end.s.set(fields.s, nDiv);
    end.d.set(fields.d, nDiv);
    end.s.set(tail.s, nDiv + nFields);
    end.d.set(tail.d, nDiv + nFields);
    kind.fill(2, nDiv + nFields);
    // the start: the camp (a fine candidate grid, so the dense middle never
    // takes nearly every cell: no grid structure, no moire in the wide)
    const start = sampleField((s, ad) => campShape(s, sg * ad, seed + 7), N_SIDE, CAMP_S - CAMP_RS * 1.5, CAMP_S + CAMP_RS * 1.5, CAMP_RD * 1.5, 3, seed + 1);
    const byS = (f: Field) => Array.from({ length: N_SIDE }, (_, i) => i).sort((a, b) => f.s[a] - f.s[b]);
    const os = byS(start);
    const oe = byS(end);
    const T = ARMY_T;
    for (let b0 = 0; b0 < N_SIDE; b0 += BAND) {
      const b1 = Math.min(N_SIDE, b0 + BAND);
      const bs = os.slice(b0, b1).sort((a, b) => start.d[a] - start.d[b]);
      const be = oe.slice(b0, b1).sort((a, b) => end.d[a] - end.d[b]);
      let travel = 0;
      for (let q = 0; q < bs.length; q++) travel += start.s[bs[q]] - end.s[be[q]];
      travel /= bs.length;
      const lam = sstep((travel - 700) / 1300);
      for (let q = 0; q < bs.length; q++) {
        const rank = (b0 + q) / N_SIDE; // 0 = the front .. 1 = the rear
        const i = side * N_SIDE + b0 + q;
        A_S0[i] = start.s[bs[q]];
        A_D0[i] = sg * start.d[bs[q]];
        A_S1[i] = end.s[be[q]];
        A_D1[i] = sg * end.d[be[q]];
        A_KIND[i] = kind[be[q]];
        // his own place in the stream: the band's lateral order, jittered
        // within his slot (so no two bands share lanes), a little scatter
        const ql = (q + ih(i, 10, 908)) / bs.length;
        A_DS[i] = sg * Math.max(LANE + 4, LANE + 6 + STREAM_L * streamG(ql) + 46 * (ih(i, 9, 907) - 0.5));
        A_LS[i] = lam;
        const h1 = ih(i, 3, 901);
        const h2 = ih(i, 4, 902);
        A_T0[i] = T.T_GO + T.SPAN * Math.pow(rank, T.P) + T.JIT * (h1 - 0.5);
        const L = Math.hypot(A_S1[i] - A_S0[i], A_D1[i] - A_D0[i]);
        const v = T.V * (1 - T.VAR / 2 + T.VAR * h2);
        A_DUR[i] = Math.max(T.D_MIN + T.D_R * rank, L / v) * (1 - T.D_VAR / 2 + T.D_VAR * ih(i, 11, 909));
        A_PH[4 * i] = 6.2832 * ih(i, 5, 903);
        A_PH[4 * i + 1] = 6.2832 * ih(i, 6, 904);
        A_PH[4 * i + 2] = 0.035 + 0.035 * ih(i, 7, 905);
        A_PH[4 * i + 3] = 0.035 + 0.035 * ih(i, 8, 906);
      }
    }
  }
})();
/** the army's eased progress for dot i at frame f (0 at rest in the camp, 1 arrived) */
export const armyProgress = (i: number, f: number) => {
  const u = (f - A_T0[i]) / A_DUR[i];
  return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
};
/** dot i's lateral offset at eased progress e (before the lane) */
const armyD = (i: number, e: number) => {
  const d0 = A_D0[i];
  const d1 = A_D1[i];
  const straight = d0 + (d1 - d0) * e;
  const lam = A_LS[i];
  if (lam <= 0) return straight;
  const T = A_S0[i] - A_S1[i];
  const gone = T * e;
  const left = T - gone;
  const dS = A_DS[i];
  const lin = Math.min(Math.max(STREAM_IN, 1.4 * Math.abs(dS - d0)), 0.6 * T);
  const lout = Math.min(STREAM_OUT, 0.35 * T);
  const w1 = sstep(gone / lin);
  const w2 = sstep((lout - left) / lout);
  const viaStream = d0 + (dS - d0) * w1 + (d1 - dS) * w2;
  return straight + (viaStream - straight) * lam;
};
/** the army's road coordinates at f (no drift), for the checks */
export const armySD = (i: number, f: number): P2 => {
  const e = armyProgress(i, f);
  const s = A_S0[i] + (A_S1[i] - A_S0[i]) * e;
  let d = e <= 0 ? A_D0[i] : e >= 1 ? A_D1[i] : armyD(i, e);
  const ln = laneAt(s, f);
  if (ln > 0) {
    const ad = Math.abs(d);
    const m = (ad + ln + Math.sqrt((ad - ln) * (ad - ln) + 64)) / 2;
    d = d < 0 ? -m : m;
  }
  return [s, d];
};
/** every army dot at frame f (world metres, flat [x0, y0, x1, y1, ...]), with
 *  a sub-pixel drift (DRIFT_PX screen px at zoom k) so the field breathes */
export const DRIFT_PX = 0.3;
export const armyXY = (f: number, k: number): Float32Array => {
  const out = new Float32Array(2 * N_ARMY);
  const amp = DRIFT_PX / k;
  // the lane only matters along the procession's stretch of road
  const lHead = roadSOfSigma(Math.max(SIGMA_R120, headSigma(f))) - 140;
  const lTail = roadSOfSigma(tailSigma(f)) + 110;
  for (let i = 0; i < N_ARMY; i++) {
    const u = (f - A_T0[i]) / A_DUR[i];
    const e = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
    const s = A_S0[i] + (A_S1[i] - A_S0[i]) * e;
    let d = e <= 0 ? A_D0[i] : e >= 1 ? A_D1[i] : armyD(i, e);
    if (s > lHead && s < lTail) {
      const ln = laneAt(s, f);
      const ad = d < 0 ? -d : d;
      const m = (ad + ln + Math.sqrt((ad - ln) * (ad - ln) + 64)) / 2;
      d = d < 0 ? -m : m;
    }
    let x = (s - F_S0) / FS;
    if (x < 0) x = 0;
    if (x > FN - 1.000001) x = FN - 1.000001;
    const j = x | 0;
    const w = x - j;
    const px = FPX[j] + (FPX[j + 1] - FPX[j]) * w;
    const py = FPY[j] + (FPY[j + 1] - FPY[j]) * w;
    const nx = FNX[j] + (FNX[j + 1] - FNX[j]) * w;
    const ny = FNY[j] + (FNY[j + 1] - FNY[j]) * w;
    out[2 * i] = px + nx * d + amp * Math.sin(f * A_PH[4 * i + 2] + A_PH[4 * i]);
    out[2 * i + 1] = py + ny * d + amp * Math.sin(f * A_PH[4 * i + 3] + A_PH[4 * i + 1]);
  }
  return out;
};
/** the army split into ARMY_LAYERS interleaved layers (i mod n): each layer
 *  is one canvas path at a low alpha, so overlapping dots build a mid-tone
 *  (1 - (1 - alpha)^n at most), never solid */
export const ARMY_LAYERS = 4;
export const armyLayersXY = (f: number, k: number): Float32Array[] => {
  const all = armyXY(f, k);
  const per = Math.ceil(N_ARMY / ARMY_LAYERS);
  const out = Array.from({ length: ARMY_LAYERS }, () => new Float32Array(2 * per));
  const cnt = new Array(ARMY_LAYERS).fill(0);
  for (let i = 0; i < N_ARMY; i++) {
    const L = i % ARMY_LAYERS;
    out[L][cnt[L]++] = all[2 * i];
    out[L][cnt[L]++] = all[2 * i + 1];
  }
  return out.map((a, L) => a.subarray(0, cnt[L]));
};

// ---------------------------------------------------------------------------
// PIZARRO'S 168 (FACTS sections 1, 4): 62 horse + 106 foot (Hemming;
// Lockhart). The horse in three groups, one to a hall (Hernando Pizarro, Soto,
// Benalcazar: 21 / 21 / 20; Mena p.240, Trujillo p.53), inside; 24 foot
// standing in the halls' doorways (8 a hall); Candia with 8 arquebusiers and
// the guns on the platform (the "fortress": Mena p.240); Pizarro with 24 at
// the platform's foot ("en la fortaleza con 24 hombres", Trujillo p.53); the
// other 48 foot just inside the two gates, flanking the passage (Mena p.240:
// "the rest guarded the gates"). Deterministic, evenly spaced, a hair of
// jitter.
// ---------------------------------------------------------------------------
export const N_HORSE = 62;
export const N_FOOT = 106;
export const SPANIARDS: P2[] = (() => {
  const out: P2[] = [];
  const halls = PLAZA.halls as Hall[];
  const horse = [21, 21, 20];
  halls.forEach((h, hi) => {
    const n = horse[hi];
    const [b0] = h.rect as P2[];
    const t = h.along as P2;
    const nIn = h.toSquare as P2;
    const perRow = Math.ceil(n / 2);
    for (let q = 0; q < n; q++) {
      const row = q % 2;
      const col = Math.floor(q / 2);
      const a = (0.08 + 0.84 * ((col + 0.5 + 0.5 * row) / (perRow + 0.5))) * h.len + 1.4 * (ih(q, hi, 31) - 0.5);
      const dep = (row === 0 ? 0.3 : 0.58) * h.depth + 0.8 * (ih(q, hi, 32) - 0.5);
      out.push([b0[0] + t[0] * a + nIn[0] * dep, b0[1] + t[1] * a + nIn[1] * dep]);
    }
  });
  // 8 foot in each hall's doorways (spread along the hall), just inside the opening
  halls.forEach((h) => {
    const dw = h.doorways;
    for (let q = 0; q < 8; q++) {
      const di = Math.round(1 + (q * (dw.length - 3)) / 7);
      const p = dw[di].p as P2;
      const nn = dw[di].n as P2;
      out.push([p[0] - nn[0] * 0.9, p[1] - nn[1] * 0.9]);
    }
  });
  // Candia and 8 arquebusiers on the platform (a 3 x 3 grid, 3.4 m apart)
  const fr = PLAZA.fortress.rect as P2[];
  const fc = PLAZA.fortress.centre as P2;
  const ex = unit([fr[1][0] - fr[0][0], fr[1][1] - fr[0][1]]);
  const ey = unit([fr[3][0] - fr[0][0], fr[3][1] - fr[0][1]]);
  for (let q = 0; q < 9; q++) {
    const gx = ((q % 3) - 1) * 3.4 + 0.3 * (ih(q, 1, 33) - 0.5);
    const gy = (Math.floor(q / 3) - 1) * 3.4 + 0.3 * (ih(q, 2, 33) - 0.5);
    out.push([fc[0] + ex[0] * gx + ey[0] * gy, fc[1] + ex[1] * gx + ey[1] * gy]);
  }
  // Pizarro and 24 at the platform's foot, on the square side of its stair (5 x 5, 3 m)
  const foot = PLAZA.fortress.stair.foot as P2;
  const toSq = PLAZA.fortress.toSquare as P2;
  const side: P2 = [-toSq[1], toSq[0]];
  for (let q = 0; q < 25; q++) {
    const along = 4 + Math.floor(q / 5) * 3 + 0.4 * (ih(q, 3, 34) - 0.5);
    const lat = ((q % 5) - 2) * 3 + 0.4 * (ih(q, 4, 34) - 0.5);
    out.push([foot[0] + toSq[0] * along + side[0] * lat, foot[1] + toSq[1] * along + side[1] * lat]);
  }
  // the rest at the two gates: inside, flanking the passage (two groups of 12 per gate)
  const gates = PLAZA.gates as Gate[];
  const rest = N_HORSE + N_FOOT - out.length;
  gates.forEach((g, gi) => {
    const n = gi === 0 ? Math.ceil(rest / 2) : Math.floor(rest / 2);
    const u = unit([g.b[0] - g.a[0], g.b[1] - g.a[1]]);
    for (let q = 0; q < n; q++) {
      const flank = q % 2 === 0 ? -1 : 1;
      const m = Math.floor(q / 2);
      const col = m % 3;
      const row = Math.floor(m / 3);
      const a = flank * (g.w / 2 + 1.5 + col * 2.8) + 0.4 * (ih(q, gi, 35) - 0.5);
      const dIn = 3 + row * 2.8 + 0.4 * (ih(q, gi, 36) - 0.5);
      out.push([g.p[0] + u[0] * a - g.n[0] * dIn, g.p[1] + u[1] * a - g.n[1] * dIn]);
    }
  });
  if (out.length !== N_HORSE + N_FOOT) throw new Error(`vastArmyMotion: ${out.length} Spaniards, not 168`);
  return out;
})();

// ---------------------------------------------------------------------------
// LABELS (house MapLabel: slides up 24 px while fading in, from ~8 f before its
// word) and their placements
// ---------------------------------------------------------------------------
export const LABELS = {
  // PIZARRO under the plaza, its right end just past the plaza's centre (the
  // procession comes round the SE wall to the SW gate above-right of it)
  // (dx shrinks in the wide so the word keeps clear of the south division)
  pizarro: { f0: W.pizarro - 8, anchor: [0, 94] as P2, dy: 84, dx: 34, dxWide: -12, size: 40 },
  // CAJAMARCA above the plaza; it rises in the wide so it clears the north division
  cajamarca: { f0: W.cajamarca - 8, anchor: [0, -105] as P2, dy: -24, dyWide: -68, size: 40 },
};
/** CAMP re-exported for the checks */
export { CAMP };
