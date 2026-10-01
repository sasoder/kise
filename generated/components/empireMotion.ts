// EmpireAtMyDisposal (cut 3 of the Cortes clip): every moving thing as pure
// maths (no React), so the check scripts read the exact motion the component
// draws. See EmpireAtMyDisposal.tsx's header for the words, the gestures, the
// colour rule and the sources.
//   the empire   its border is wiped in radially from Tenochtitlan (cream), then
//                the gained-territory hatch follows on a second radial front
//   the coins    one snake: every coin rides Cortes's road down from
//                Tenochtitlan at the same speed, COIN_GAP world px behind the one
//                ahead; where the road crosses the open channel between the two
//                bodies each leaves it on its own branch to the cluster of four
//                cream dots it converts, and is absorbed there
//   the crowd    a deterministic relaxation (home pull + even spacing + a clear
//                gap between the colours + the coast), simulated once, smoothed
//                in time: converted dots cross over to Cortes's side, the last
//                six cream are pressed into a knot at the seaward edge
//   the column   the merged army turns onto the road and marches inland,
//                head-led, four files, even spacing; each slot, as it starts to
//                fill, takes the waiting man nearest to it
//   the camera   its own track: ln k and the framed world point as integrals of
//                cosine-tapered velocity bumps (cortesShared makeTrack, C1)
// LAYOUT-AGNOSTIC: nothing here assumes the shape of the shared crowds. The
// channel crossing, the clusters and their order, the knot, the army's drift,
// the formation point (measured on a first simulation pass) and every camera
// framing are derived from CREAM_REST / ORANGE_REST / CORTES_ROAD.
import { COAST_KEEP } from "./cortesMapData";
import {
  CAM_LIFT,
  CHANNEL,
  CORTES_ROAD,
  CREAM_REST,
  CROWD_SLOT,
  EMPIRE_POLYS,
  N_CREAM,
  ORANGE_REST,
  SITES,
  clamp01,
  hash,
  landAt,
  makeRoute,
  makeTrack,
  pchip,
  smoothstep,
  type Bump,
  type Cam,
  type P2,
} from "./cortesShared";

export const FPS = 24;
// In-point 50.72 s on the EDIT timeline (the SRT). The line ends with
// "reinforcements" at 58.119 s: round(7.40 * 24) = 178, + the 16-frame house
// tail = 194.
export const IN_POINT = 50.72;
export const DURATION = 194;
export const LAST = DURATION - 1;

/** word onsets, f = round((t - 50.72) * 24) */
export const W = {
  the: 0,
  empire: 5,
  atMy: 13,
  disposal: 19,
  join: 37,
  with: 44,
  meAnd: 48,
  weCan: 55,
  share: 60,
  inThe: 65,
  riches: 69,
  soHe: 74,
  wins: 84,
  over: 90,
  the2: 97,
  vast: 103,
  majority: 110,
  of: 120,
  this: 125,
  new: 130,
  force: 136,
  it: 144,
  becomes: 146,
  effectively: 151,
  reinforcements: 159,
  lineEnd: 178,
};

export const N_DOTS = CREAM_REST.length + ORANGE_REST.length; // 117
const REST: P2[] = [...(CREAM_REST as P2[]), ...(ORANGE_REST as P2[])];
const TENOCH: P2 = [SITES.tenochtitlan.x, SITES.tenochtitlan.y];
const CEMPOALA: P2 = [SITES.cempoala.x, SITES.cempoala.y];
const centroid = (pts: P2[]): P2 => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const bboxCentre = (pts: P2[]): P2 => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return [(x0 + x1) / 2, (y0 + y1) / 2];
};
const nearestDist = (p: P2, pts: P2[]) => Math.min(...pts.map((q) => Math.hypot(q[0] - p[0], q[1] - p[1])));
const ORANGE_PTS = ORANGE_REST as P2[];
const CREAM_PTS = CREAM_REST as P2[];
const ORANGE_C0 = centroid(ORANGE_PTS);
const CREAM_C0 = centroid(CREAM_PTS);
/** the two bodies' common box centre: the opening framing and the conversion's */
export const CROWDS_C: P2 = bboxCentre(REST);

// ---------------------------------------------------------------------------
// THE EMPIRE: two radial fronts out of Tenochtitlan (world px). The main
// empire lies within R_MAIN of the city. The Soconusco exclave (307..362 px
// out) only shows as a sliver in the wide's bottom-right corner, under the
// captions, so the fronts reach it after the camera has left it (f50+).
// ---------------------------------------------------------------------------
export const EMPIRE_ORIGIN = TENOCH;
const R_MAIN = 200; // the farthest main-empire point is 183.6 px from the city
const R_EXTRA = 190;
const warpEase = (u: number, warp: number) => smoothstep(Math.pow(clamp01(u), warp));
/** the cream border's wipe radius ("Empire" f5) */
export const borderR = (f: number) => R_MAIN * warpEase((f - 5) / 17, 0.85) + R_EXTRA * smoothstep((f - 50) / 12);
/** the gained-territory front ("at my disposal" f13-30, complete by ~f32) */
export const hatchR = (f: number) => R_MAIN * warpEase((f - 12) / 22, 0.85) + R_EXTRA * smoothstep((f - 52) / 12);
export const BORDER_FEATHER = 12;
export const HATCH_FEATHER = 14;

// ---------------------------------------------------------------------------
// THE ROAD (as cut 1 draws it, from the orange group to Tenochtitlan): cut 1's
// rule (spanishMotion ROAD_S0) on this cut's rest state: 3 world px inside the
// point where the road, walked inland, last passes an orange man
// ---------------------------------------------------------------------------
export const ROAD_S0 = (() => {
  let exit = 0;
  for (let s = 0; s <= CORTES_ROAD.len; s += 0.25) {
    const [x, y] = CORTES_ROAD.pointAt(s);
    if (ORANGE_PTS.some(([px, py]) => Math.hypot(px - x, py - y) < CROWD_SLOT * 0.9)) exit = s;
  }
  return Math.max(0, exit - 3);
})();
export const ROAD_LEN = CORTES_ROAD.len;

/** the swords sit on the seam between the two bodies at rest, just above the
 *  men nearest it (cut 1's rule, spanishMotion swordsAnchorAt) */
export const SWORDS_ANCHOR: P2 = (() => {
  const ch = CHANNEL as P2[];
  const seamX = ch.reduce((a, p) => a + p[0], 0) / ch.length;
  const near = REST.filter((p) => Math.abs(p[0] - seamX) < 9).map((p) => p[1]);
  return [seamX, (near.length ? Math.min(...near) : Math.min(...REST.map((p) => p[1]))) - 1.25];
})();

// ---------------------------------------------------------------------------
// THE SEA: exact distance to it round Cempoala (world px), a linear-time
// Euclidean distance transform (Felzenszwalb) of the shared land mask
// ---------------------------------------------------------------------------
const DF = (() => {
  const x0 = 70;
  const y0 = 805;
  const s = 4;
  const w = 130 * s;
  const h = 125 * s;
  const BIG = 1e12;
  const g = new Float64Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g[j * w + i] = landAt(x0 + (i + 0.5) / s, y0 + (j + 0.5) / s) ? BIG : 0;
  const edt1 = (f: Float64Array, n: number) => {
    const d = new Float64Array(n);
    const v = new Int32Array(n);
    const z = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let sct = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (sct <= z[k]) {
        k--;
        sct = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = sct;
      z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    return d;
  };
  // columns, then rows
  const col = new Float64Array(h);
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) col[j] = g[j * w + i];
    const d = edt1(col, h);
    for (let j = 0; j < h; j++) g[j * w + i] = d[j];
  }
  const row = new Float64Array(w);
  const dist = new Float32Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) row[i] = g[j * w + i];
    const d = edt1(row, w);
    for (let i = 0; i < w; i++) dist[j * w + i] = Math.min(40, Math.sqrt(d[i]) / s);
  }
  return { x0, y0, s, w, h, dist };
})();
const seaDist = (x: number, y: number) => {
  const fx = (x - DF.x0) * DF.s - 0.5;
  const fy = (y - DF.y0) * DF.s - 0.5;
  const i = Math.max(0, Math.min(DF.w - 2, Math.floor(fx)));
  const j = Math.max(0, Math.min(DF.h - 2, Math.floor(fy)));
  const u = clamp01(fx - i);
  const v = clamp01(fy - j);
  const d = DF.dist;
  const a = d[j * DF.w + i];
  const b = d[j * DF.w + i + 1];
  const c = d[(j + 1) * DF.w + i];
  const e = d[(j + 1) * DF.w + i + 1];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
};
/** unit vector pointing inland (up the sea-distance field) */
const inland = (x: number, y: number): P2 => {
  const gx = seaDist(x + 0.5, y) - seaDist(x - 0.5, y);
  const gy = seaDist(x, y + 0.5) - seaDist(x, y - 0.5);
  const l = Math.hypot(gx, gy) || 1;
  return [gx / l, gy / l];
};

// ---------------------------------------------------------------------------
// THE CONVERSION: the six cream dots nearest Cempoala stay cream (Narvaez and
// his loyal officers); the other 84 split into 21 compact clusters of four
// (recursive bisection), converted in order of distance from where the gold
// enters the cream body (E), so the conversion travels inland -> sea.
// E = where the road, walked inland from Cempoala, leaves the cream body for
// the orange: the point of the open channel on the road, where the nearest
// cream and the nearest orange rest dot are equally far.
// ---------------------------------------------------------------------------
export const S_E = (() => {
  let prev: number | null = null;
  for (let s = 0; s <= Math.min(ROAD_LEN, ROAD_S0 + 40); s += 0.25) {
    const p = CORTES_ROAD.pointAt(s);
    const diff = nearestDist(p, CREAM_PTS) - nearestDist(p, ORANGE_PTS);
    if (prev !== null && prev < 0 && diff >= 0) return s - (0.25 * diff) / (diff - prev);
    prev = diff;
  }
  // fallback: the road point nearest the midpoint of the two bodies
  const m: P2 = [(ORANGE_C0[0] + CREAM_C0[0]) / 2, (ORANGE_C0[1] + CREAM_C0[1]) / 2];
  let best = { d: Infinity, s: 0 };
  for (let s = 0; s <= ROAD_LEN; s += 0.25) {
    const p = CORTES_ROAD.pointAt(s);
    const d = Math.hypot(p[0] - m[0], p[1] - m[1]);
    if (d < best.d) best = { d, s };
  }
  return best.s;
})();
export const E_PT: P2 = CORTES_ROAD.pointAt(S_E);
export const KNOT: number[] = REST.slice(0, N_CREAM)
  .map((p, i) => ({ i, d: Math.hypot(p[0] - CEMPOALA[0], p[1] - CEMPOALA[1]) }))
  .sort((a, b) => a.d - b.d)
  .slice(0, 6)
  .map((q) => q.i);
const PER_COIN = 4;
export const CLUSTERS: number[][] = (() => {
  const ids = Array.from({ length: N_CREAM }, (_, i) => i).filter((i) => !KNOT.includes(i));
  const out: number[][] = [];
  const split = (set: number[], n: number) => {
    if (n <= 1) {
      out.push(set);
      return;
    }
    const xs = set.map((i) => REST[i][0]);
    const ys = set.map((i) => REST[i][1]);
    const wide = Math.max(...xs) - Math.min(...xs) >= Math.max(...ys) - Math.min(...ys);
    const sorted = [...set].sort((a, b) => (wide ? REST[a][0] - REST[b][0] : REST[a][1] - REST[b][1]));
    const nA = Math.floor(n / 2);
    split(sorted.slice(0, nA * PER_COIN), nA);
    split(sorted.slice(nA * PER_COIN), n - nA);
  };
  split(ids, Math.round(ids.length / PER_COIN));
  const dE = (c: number[]) => {
    const m = centroid(c.map((i) => REST[i]));
    return Math.hypot(m[0] - E_PT[0], m[1] - E_PT[1]);
  };
  return out.sort((a, b) => dE(a) - dE(b));
})();
export const N_COINS = CLUSTERS.length; // 21
/** cluster (= coin) index of each cream dot; -1 = the knot */
const COIN_OF: number[] = Array.from({ length: N_DOTS }, () => -1);
CLUSTERS.forEach((c, j) => c.forEach((i) => (COIN_OF[i] = j)));
const N_ARMY = N_DOTS - KNOT.length; // 111

// ---------------------------------------------------------------------------
// THE COINS. Path position p: 0 at Tenochtitlan, along the road to E (P_E),
// then each coin's own branch into the cream body.
// ---------------------------------------------------------------------------
export const COIN_GAP = 8; // world px between coins along the road
export const P_E = ROAD_LEN - S_E;
const F_OUT = W.join; // the head leaves the city
const F_AT_E = W.riches; // ... and reaches the cream body's edge
// the snake's speed (world px / f): it accelerates out of the city, cruises,
// and runs a touch faster once it is feeding the conversion
const V_SHAPE: [number, number][] = [
  [F_OUT - 1, 0],
  [F_OUT, 0.18],
  [F_OUT + 5, 0.55],
  [F_OUT + 10, 0.92],
  [F_OUT + 16, 1],
  [F_AT_E, 1],
  [F_AT_E + 14, 1.12],
  [F_AT_E + 120, 1.12],
];
const vShape = pchip(V_SHAPE, true);
const SUBV = 8;
const V_INT = (() => {
  const out: number[] = [0];
  let acc = 0;
  for (let i = 1; i <= (LAST + 60 - F_OUT + 1) * SUBV; i++) {
    const f = F_OUT - 1 + (i - 0.5) / SUBV;
    acc += Math.max(0, vShape(f)) / SUBV;
    out.push(acc);
  }
  return out;
})();
const intShape = (f: number) => {
  const x = (f - (F_OUT - 1)) * SUBV;
  if (x <= 0) return 0;
  const i = Math.min(V_INT.length - 2, Math.floor(x));
  return V_INT[i] + (V_INT[i + 1] - V_INT[i]) * Math.min(1, x - i);
};
const V_SCALE = P_E / intShape(F_AT_E);
/** the head's path position at frame f */
export const headP = (f: number) => V_SCALE * intShape(f);
export const coinSpeed = (f: number) => V_SCALE * Math.max(0, vShape(f));
/** the frame at which the head's path position reaches p */
const headInv = (p: number) => {
  let lo = F_OUT - 1;
  let hi = LAST + 59;
  for (let it = 0; it < 50; it++) {
    const m = (lo + hi) / 2;
    if (headP(m) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
/** coin i reaches E */
export const T_E: number[] = Array.from({ length: N_COINS }, (_, i) => headInv(P_E + i * COIN_GAP));
const ROAD_DIR_E: P2 = (() => {
  const t = CORTES_ROAD.tangentAt(S_E);
  return [-t[0], -t[1]]; // travelling toward Cempoala
})();

// ---------------------------------------------------------------------------
// THE COLUMN'S GEOMETRY (built once the formation point is known, below).
// The column marches on the road smoothed over ~7 world px (a gaussian on
// arclength), and each of its four files walks its OWN offset of that line at
// its own arclength, ROW apart: through a bend the inner file wheels ahead and
// no file ever bunches (it never strays more than ~2 world px off the road).
// ---------------------------------------------------------------------------
export const ABREAST = 4;
export const LAT = 3.0; // world px between files
export const ROW = 3.25; // world px between ranks
const F_MARCH = W.it; // the head starts inland
const V_MARCH = 1.05; // world px / f once marching
const MARCH_RAMP = 16;
const JOIN_W = 10; // frames a man takes to fall in
const JOIN_AFTER = 3; // ... landing this long after his slot passes the formation point
export const FILE_LAT = Array.from({ length: ABREAST }, (_, q) => (q - (ABREAST - 1) / 2) * LAT);
const cumOf = (pts: P2[]) => {
  const c = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) c[i] = c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return c;
};
const makeColumn = (sForm: number) => {
  const COL_STEP = 0.5; // world px of road per centre sample
  const raw: P2[] = [];
  for (let s = Math.max(0, sForm - 18); s <= ROAD_LEN - 1 + 1e-9; s += COL_STEP) raw.push(CORTES_ROAD.pointAt(s));
  const sig = 14; // samples (7 world px)
  const centre: P2[] = raw.map((_, i) => {
    let x = 0;
    let y = 0;
    let w = 0;
    for (let j = -3 * sig; j <= 3 * sig; j++) {
      const q = raw[Math.max(0, Math.min(raw.length - 1, i + j))];
      const g = Math.exp(-(j * j) / (2 * sig * sig));
      x += q[0] * g;
      y += q[1] * g;
      w += g;
    }
    return [x / w, y / w] as P2;
  });
  const centreCum = cumOf(centre);
  const centreIdx = (c: number) => {
    const C = centreCum;
    if (c <= 0) return 0;
    if (c >= C[C.length - 1]) return C.length - 1;
    let lo = 0;
    let hi = C.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (C[m] <= c) lo = m;
      else hi = m;
    }
    return lo + (c - C[lo]) / (C[hi] - C[lo] || 1);
  };
  const files = FILE_LAT.map((lat) => {
    const n = centre.length;
    const off: P2[] = centre.map((p, i) => {
      const a = centre[Math.max(0, i - 4)];
      const b = centre[Math.min(n - 1, i + 4)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const tx = (b[0] - a[0]) / l;
      const ty = (b[1] - a[1]) / l;
      return [p[0] - ty * lat, p[1] + tx * lat];
    });
    // a light pass so an inner offset never kinks
    const pts: P2[] = off.map((_, i) => {
      let x = 0;
      let y = 0;
      let w = 0;
      for (let j = -6; j <= 6; j++) {
        const q = off[Math.max(0, Math.min(n - 1, i + j))];
        const g = Math.exp(-(j * j) / 8);
        x += q[0] * g;
        y += q[1] * g;
        w += g;
      }
      return [x / w, y / w] as P2;
    });
    return { route: makeRoute({ pts, wpS: [], len: 0 }), cum: cumOf(pts) };
  });
  const fileArc = (q: number, c: number) => {
    const x = centreIdx(c);
    const i = Math.min(files[q].cum.length - 2, Math.floor(x));
    const u = x - i;
    return files[q].cum[i] + (files[q].cum[i + 1] - files[q].cum[i]) * u;
  };
  const formPt = CORTES_ROAD.pointAt(sForm);
  const cForm = (() => {
    let best = { d: Infinity, c: 0 };
    for (let i = 0; i < centre.length; i++) {
      const d = Math.hypot(centre[i][0] - formPt[0], centre[i][1] - formPt[1]);
      if (d < best.d) best = { d, c: centreCum[i] };
    }
    return best.c;
  })();
  /** the column head's arclength on the centre line at f */
  const marchHead = (f: number) => {
    if (f <= F_MARCH) return cForm;
    const t = f - F_MARCH;
    // integral of V_MARCH * smoothstep(t / MARCH_RAMP)
    const r = MARCH_RAMP;
    if (t < r) {
      const u = t / r;
      return cForm + V_MARCH * r * (u * u * u - 0.5 * u * u * u * u);
    }
    return cForm + V_MARCH * (r * 0.5 + (t - r));
  };
  const marchHeadPt = (f: number): P2 => {
    const x = centreIdx(marchHead(f));
    const i = Math.min(centre.length - 2, Math.floor(x));
    const u = x - i;
    return [centre[i][0] + (centre[i + 1][0] - centre[i][0]) * u, centre[i][1] + (centre[i + 1][1] - centre[i][1]) * u];
  };
  /** slot j = rank j / ABREAST, file j % ABREAST; odd files half a rank back */
  const slotArc = (j: number, f: number) => {
    const q = j % ABREAST;
    const rank = Math.floor(j / ABREAST);
    return fileArc(q, marchHead(f)) - rank * ROW - (q % 2 === 1 ? ROW * 0.5 : 0);
  };
  /** column slot j's world position at frame f (a hair of jitter, constant per slot) */
  const slotPos = (j: number, f: number): P2 => {
    const q = j % ABREAST;
    const R = files[q].route;
    const c = Math.max(0, Math.min(R.len, slotArc(j, f)));
    const p = R.pointAt(c);
    const t = R.tangentAt(c);
    const lat = 0.3 * (hash(j, 21) - 0.5);
    const along = 0.3 * (hash(j, 22) - 0.5);
    return [p[0] - t[1] * lat + t[0] * along, p[1] + t[0] * lat + t[1] * along];
  };
  const slotPass = (j: number) => {
    const target = fileArc(j % ABREAST, cForm);
    let lo = F_MARCH;
    let hi = F_MARCH + 400;
    for (let it = 0; it < 50; it++) {
      const m = (lo + hi) / 2;
      if (slotArc(j, m) < target - 1e-9) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const slotT1 = Array.from({ length: N_ARMY }, (_, j) => slotPass(j) + JOIN_AFTER);
  const formT = CORTES_ROAD.tangentAt(sForm); // the march direction
  return {
    sForm,
    formPt,
    formT,
    formN: [-formT[1], formT[0]] as P2, // the normal the files are offset along
    marchHead,
    marchHeadPt,
    slotPos,
    slotT1,
    /** the slots in the order they start to fill */
    slotOrder: Array.from({ length: N_ARMY }, (_, j) => j).sort((a, b) => slotT1[a] - slotT1[b]),
  };
};
type Column = ReturnType<typeof makeColumn>;

// ---------------------------------------------------------------------------
// THE CROWD SIMULATION
// ---------------------------------------------------------------------------
export const COLOUR = 10; // frames: each dot's cream -> orange crossfade (cut 1's)
const S_SAME = 3.38; // centre spacing inside a group (the crowds' own CROWD_SLOT)
const GAP = 5.2; // extra spacing between the colours: the clear channel
const KEEP = COAST_KEEP + 0.4;
// the homes: Cortes's side drifts a little toward the cream as it grows;
// Narvaez's remnant is pressed to the knot at the seaward edge (nudged a hair
// inland, up the sea-distance field)
const DRIFT_O: P2 = [0.19 * (CREAM_C0[0] - ORANGE_C0[0]), 0.19 * (CREAM_C0[1] - ORANGE_C0[1])];
export const KNOT_C: P2 = (() => {
  const c = centroid(KNOT.map((i) => REST[i]));
  const n = inland(c[0], c[1]);
  return [c[0] + 1.2 * n[0], c[1] + 1.2 * n[1]];
})();
const F_SIM0 = 66;
const F_SIM1 = LAST + 14;
const ITER = 8;

/** cream -> orange crossfade of dot i at f (orange dots 1, the knot 0) */
let T_ABS: number[] = [];
export const colourT = (i: number, f: number) => {
  if (i >= N_CREAM) return 1;
  const c = COIN_OF[i];
  if (c < 0) return 0;
  return smoothstep((f - (T_ABS[c] - 1)) / COLOUR);
};

type Join = { dot: number; slot: number; t0: number; t1: number };
type SimOut = { xs: Float64Array[]; ys: Float64Array[]; joins: Join[] };

/** a joining man: Hermite from his crowd position to his column slot at t1 */
const joinPos = (col: Column, jn: Join, f: number, outX: Float64Array[], outY: Float64Array[]): P2 => {
  if (f >= jn.t1) return col.slotPos(jn.slot, f);
  // the last free frame before t0 (already simulated when f >= t0)
  const a = jn.t0 - 1;
  const p0: P2 = [outX[a][jn.dot], outY[a][jn.dot]];
  // leave with a gentle continuation of the man's own drift (3-frame mean,
  // half strength, capped), so the curve never swings past its slot
  const pm: P2 = [outX[a - 3][jn.dot], outY[a - 3][jn.dot]];
  let v0: P2 = [(p0[0] - pm[0]) / 6, (p0[1] - pm[1]) / 6];
  const vl = Math.hypot(v0[0], v0[1]);
  if (vl > 0.35) v0 = [(v0[0] * 0.35) / vl, (v0[1] * 0.35) / vl];
  const p1 = col.slotPos(jn.slot, jn.t1);
  const p1b = col.slotPos(jn.slot, jn.t1 - 0.5);
  const v1: P2 = [(p1[0] - p1b[0]) * 2, (p1[1] - p1b[1]) * 2];
  const H = jn.t1 - a;
  const u = clamp01((f - a) / H);
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  const h11 = u * u * u - u * u;
  return [
    h00 * p0[0] + h10 * H * v0[0] + h01 * p1[0] + h11 * H * v1[0],
    h00 * p0[1] + h10 * H * v0[1] + h01 * p1[1] + h11 * H * v1[1],
  ];
};

const simulate = (tAbs: number[], col: Column | null): SimOut => {
  T_ABS = tAbs;
  const n = N_DOTS;
  const xs = Float64Array.from(REST.map((p) => p[0]));
  const ys = Float64Array.from(REST.map((p) => p[1]));
  const outX: Float64Array[] = [];
  const outY: Float64Array[] = [];
  for (let f = 0; f < F_SIM0; f++) {
    outX.push(Float64Array.from(xs));
    outY.push(Float64Array.from(ys));
  }
  const joinOf = new Map<number, Join>();
  const joins: Join[] = [];
  let nextSlot = 0;
  const lastConv = Math.max(...tAbs) + COLOUR;
  for (let f = F_SIM0; f <= F_SIM1; f++) {
    // THE COLUMN FILLS: each slot, the moment it starts to fill, takes the free
    // army man nearest to where it will land (the waiting army is held behind
    // the formation line, so he stands at the front: short paths that never
    // cut through the queue); men who start together are matched to their
    // files in lateral order, so their paths never cross
    if (col) {
      const starting: number[] = [];
      while (nextSlot < N_ARMY && col.slotT1[col.slotOrder[nextSlot]] - JOIN_W <= f) starting.push(col.slotOrder[nextSlot++]);
      const latOf = (i: number) => (xs[i] - col.formPt[0]) * col.formN[0] + (ys[i] - col.formPt[1]) * col.formN[1];
      const picked: number[] = [];
      for (const j of starting) {
        const land = col.slotPos(j, col.slotT1[j]);
        const fileLat = FILE_LAT[j % ABREAST];
        let best = -1;
        let bd = Infinity;
        for (let i = 0; i < n; i++) {
          if (joinOf.has(i) || picked.includes(i) || colourT(i, f) < 0.5) continue;
          // nearest to the landing point, from the same side of the road as
          // the file (consecutive ranks then never cross on the way in)
          const d = Math.hypot(xs[i] - land[0], ys[i] - land[1]) + 0.8 * Math.abs(latOf(i) - fileLat);
          if (d < bd) [bd, best] = [d, i];
        }
        if (best >= 0) picked.push(best);
      }
      const byLat = [...picked].sort((a, b) => latOf(a) - latOf(b));
      const byFile = starting.slice(0, picked.length).sort((a, b) => FILE_LAT[a % ABREAST] - FILE_LAT[b % ABREAST]);
      byFile.forEach((j, q) => {
        const jn = { dot: byLat[q], slot: j, t0: f, t1: col.slotT1[j] };
        joinOf.set(jn.dot, jn);
        joins.push(jn);
      });
    }
    // conversion progress 0..1 (by dots converted)
    let conv = 0;
    for (let i = 0; i < N_CREAM; i++) conv += colourT(i, f);
    const prog = conv / (N_CREAM - KNOT.length);
    const settle = smoothstep((f - lastConv + 6) / 20);
    const homeO: P2 = (() => {
      const e = smoothstep(prog);
      let hx = ORANGE_C0[0] + DRIFT_O[0] * e;
      let hy = ORANGE_C0[1] + DRIFT_O[1] * e;
      // phase 4: the remnant queues behind the formation point
      if (col) {
        const m = smoothstep((f - (F_MARCH - 4)) / 40);
        const Q = CORTES_ROAD.pointAt(Math.max(0, col.sForm - 9));
        hx += (Q[0] - hx) * m;
        hy += (Q[1] - hy) * m;
      }
      return [hx, hy];
    })();
    const homeC: P2 = [
      CREAM_C0[0] + (KNOT_C[0] - CREAM_C0[0]) * smoothstep(prog * 1.08),
      CREAM_C0[1] + (KNOT_C[1] - CREAM_C0[1]) * smoothstep(prog * 1.08),
    ];
    const g = Array.from({ length: n }, (_, i) => colourT(i, f));
    // falling in or marching: kinematic (a smooth Hermite, then the slot); the
    // crowd steps out of its way
    const fixed = new Uint8Array(n);
    if (col) {
      for (let i = 0; i < n; i++) {
        const jn = joinOf.get(i);
        if (!jn || f < jn.t0) continue;
        const p = joinPos(col, jn, f, outX, outY);
        fixed[i] = 1;
        xs[i] = p[0];
        ys[i] = p[1];
      }
    }
    const gate = col ? smoothstep((f - (F_MARCH - 16)) / 10) : 0;
    // the pulls ramp in with the conversion and hold the groups together
    const pullO = 0.003 + 0.004 * smoothstep((f - 80) / 30) + 0.004 * settle;
    const pullC = 0.0015 + 0.005 * smoothstep((f - 84) / 30);
    for (let it = 0; it < ITER; it++) {
      // 1. home pulls (anisotropic: the groups stand as tall ovals along the
      //    coast); a speed limit keeps every move a walk
      for (let i = 0; i < n; i++) {
        if (fixed[i]) continue;
        const gi = g[i];
        const hx = homeC[0] + (homeO[0] - homeC[0]) * gi;
        const hy = homeC[1] + (homeO[1] - homeC[1]) * gi;
        // converted dots cross over: their pull ramps with their colour
        const isConv = i < N_CREAM && COIN_OF[i] >= 0;
        const lam = gi > 0.5 ? pullO * (isConv ? 1.7 : 1) : pullC;
        let mx = lam * (hx - xs[i]);
        let my = lam * 0.42 * (hy - ys[i]);
        const l = Math.hypot(mx, my);
        if (l > 0.11) {
          mx *= 0.11 / l;
          my *= 0.11 / l;
        }
        xs[i] += mx;
        ys[i] += my;
      }
      // 2. spacing (three Jacobi passes, uncapped: it is a constraint): same
      //    colour S_SAME; across the colours S_SAME + GAP; the column never
      //    gives way
      for (let pass = 0; pass < 3; pass++) {
        const dx = new Float64Array(n);
        const dy = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            if (fixed[i] && fixed[j]) continue;
            const ex = xs[j] - xs[i];
            const ey = ys[j] - ys[i];
            const sep = S_SAME + GAP * Math.abs(g[i] - g[j]);
            if (Math.abs(ex) >= sep || Math.abs(ey) >= sep) continue;
            const d = Math.hypot(ex, ey);
            if (d >= sep) continue;
            const ux = d > 1e-6 ? ex / d : Math.cos(i * 2.4 + j);
            const uy = d > 1e-6 ? ey / d : Math.sin(i * 2.4 + j);
            const m = 0.5 * (sep - d);
            const wi = fixed[i] ? 0 : fixed[j] ? 2 : 1;
            const wj = fixed[j] ? 0 : fixed[i] ? 2 : 1;
            dx[i] -= ux * m * 0.45 * wi;
            dy[i] -= uy * m * 0.45 * wi;
            dx[j] += ux * m * 0.45 * wj;
            dy[j] += uy * m * 0.45 * wj;
          }
        }
        for (let i = 0; i < n; i++) {
          if (fixed[i]) continue;
          xs[i] += dx[i];
          ys[i] += dy[i];
        }
      }
      // 3. the queue: once the march nears, the waiting army stays behind the
      //    formation line (nothing stands in the column's path)
      if (col && gate > 0) {
        for (let i = 0; i < n; i++) {
          if (fixed[i] || g[i] < 0.5) continue;
          const lon = (xs[i] - col.formPt[0]) * col.formT[0] + (ys[i] - col.formPt[1]) * col.formT[1];
          if (lon > -1.2) {
            const m = gate * Math.min(0.4, lon + 1.2);
            xs[i] -= col.formT[0] * m;
            ys[i] -= col.formT[1] * m;
          }
        }
      }
      // 4. the coast: never closer than KEEP to the sea
      for (let i = 0; i < n; i++) {
        if (fixed[i]) continue;
        const sd = seaDist(xs[i], ys[i]);
        if (sd < KEEP) {
          const [nx, ny] = inland(xs[i], ys[i]);
          const m = Math.min(0.3, KEEP - sd);
          xs[i] += nx * m;
          ys[i] += ny * m;
        }
      }
    }
    outX.push(Float64Array.from(xs));
    outY.push(Float64Array.from(ys));
  }
  return { xs: outX, ys: outY, joins };
};

// ---------------------------------------------------------------------------
// The coins' branches and absorb times depend on where their clusters are, and
// the crowd depends on the absorb times: solve by fixed-point (3 passes, no
// column). Then the formation point is MEASURED on that crowd (where the road,
// walked inland from the army's middle, leaves the army), the column is built
// there, and the final pass runs with it.
// ---------------------------------------------------------------------------
const BRANCH_K = 1.55; // branch duration = BRANCH_K * length / speed at E (an eased stop)
const ABSORB = 7; // frames a coin takes to dissolve into its cluster
const clusterAt = (c: number, f: number, sim: SimOut | null): P2 => {
  if (!sim) return centroid(CLUSTERS[c].map((i) => REST[i]));
  const fi = Math.max(0, Math.min(sim.xs.length - 1, Math.round(f)));
  return centroid(CLUSTERS[c].map((i) => [sim.xs[fi][i], sim.ys[fi][i]] as P2));
};
const branchDur = (c: number, sim: SimOut | null) => {
  const tE = T_E[c];
  const m = clusterAt(c, tE + 6, sim);
  const b = Math.hypot(m[0] - E_PT[0], m[1] - E_PT[1]);
  return Math.max(4, (BRANCH_K * b) / coinSpeed(tE));
};
let SIM: SimOut = simulate(
  CLUSTERS.map((_, c) => T_E[c] + branchDur(c, null)),
  null,
);
for (let pass = 0; pass < 2; pass++) SIM = simulate(CLUSTERS.map((_, c) => T_E[c] + branchDur(c, SIM)), null);
export const T_ARRIVE: number[] = CLUSTERS.map((_, c) => T_E[c] + branchDur(c, SIM));

/** where the road leaves the army inland, measured just before the march */
export const S_FORM = (() => {
  const f = F_MARCH - 6;
  const army: P2[] = [];
  for (let i = 0; i < N_DOTS; i++) if (colourT(i, f) >= 0.5) army.push([SIM.xs[f][i], SIM.ys[f][i]]);
  const ac = centroid(army);
  // start from the road point nearest the army's middle, walk inland
  let s0 = 0;
  let bd = Infinity;
  for (let s = 0; s <= ROAD_LEN; s += 0.25) {
    const p = CORTES_ROAD.pointAt(s);
    const d = Math.hypot(p[0] - ac[0], p[1] - ac[1]);
    if (d < bd) [bd, s0] = [d, s];
  }
  let exit = -1;
  for (let s = s0; s <= ROAD_LEN - 20; s += 0.25) {
    if (nearestDist(CORTES_ROAD.pointAt(s), army) <= 2.8) exit = s;
    else if (exit >= 0 && s - exit > 6) break;
  }
  return exit >= 0 ? exit - 0.5 : s0 + 6;
})();
export const COLUMN = makeColumn(S_FORM);
export const marchHeadPt = COLUMN.marchHeadPt;
export const slotPos = COLUMN.slotPos;

// THE COLUMN: the final pass fills it (see simulate)
SIM = simulate(T_ARRIVE, COLUMN);
export const JOINS: Join[] = SIM.joins;

// gaussian smoothing in time (sigma 1.6 f)
const SIG = 1.6;
const TAPS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((j) => ({ j, w: Math.exp(-(j * j) / (2 * SIG * SIG)) }));
const JOIN_OF = new Map(JOINS.map((jn) => [jn.dot, jn]));
const crowdRaw = (i: number, f: number): P2 => {
  const fi = Math.max(0, Math.min(SIM.xs.length - 1, f));
  return [SIM.xs[fi][i], SIM.ys[fi][i]];
};
/** the raw (unsmoothed) simulated position, for the check scripts */
export const simRaw = (i: number, f: number): P2 => crowdRaw(i, f);

const SHOW_SEP = 2.85; // world px: the dots' diameter (2.5) and a hair
export type DotState = { x: number; y: number; t: number; id: number };
/** the shown position before separation: the smoothed crowd, the column's
 *  exact slots, the hand-over between them, and the house micro-drift */
const basePositions = (fi: number, k: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < N_DOTS; i++) {
    let x = 0;
    let y = 0;
    const jn = JOIN_OF.get(i);
    if (jn && fi >= jn.t1 + 6) {
      [x, y] = slotPos(jn.slot, fi);
    } else {
      let w = 0;
      for (const { j, w: g } of TAPS) {
        const p = crowdRaw(i, fi + j);
        x += p[0] * g;
        y += p[1] * g;
        w += g;
      }
      x /= w;
      y /= w;
      if (jn && fi >= jn.t1) {
        // hand over to the exact slot without a step
        const sp = slotPos(jn.slot, fi);
        const u = smoothstep((fi - jn.t1) / 6);
        x += (sp[0] - x) * u;
        y += (sp[1] - y) * u;
      }
    }
    // the house micro-drift (cut 1's), every dot its own
    const a = 1.15 / k;
    x += a * Math.sin(fi * (0.045 + 0.04 * hash(i, 11)) + 6.283 * hash(i, 13));
    y += a * Math.sin(fi * (0.04 + 0.045 * hash(i, 12)) + 6.283 * hash(i, 14));
    out.push([x, y]);
  }
  return out;
};
const pinnedAt = (fi: number) =>
  Array.from({ length: N_DOTS }, (_, i) => {
    const jn = JOIN_OF.get(i);
    return !!jn && fi >= jn.t1 + 6;
  });
/** the separation a frame's positions need (a man marching in the column holds his slot) */
const separation = (pos: P2[], pinned: boolean[]): P2[] => {
  const xs = pos.map((p) => p[0]);
  const ys = pos.map((p) => p[1]);
  for (let it = 0; it < 4; it++) {
    const dx = new Float64Array(N_DOTS);
    const dy = new Float64Array(N_DOTS);
    for (let i = 0; i < N_DOTS; i++) {
      for (let j = i + 1; j < N_DOTS; j++) {
        if (pinned[i] && pinned[j]) continue;
        const ex = xs[j] - xs[i];
        const ey = ys[j] - ys[i];
        if (Math.abs(ex) >= SHOW_SEP || Math.abs(ey) >= SHOW_SEP) continue;
        const d = Math.hypot(ex, ey);
        if (d >= SHOW_SEP) continue;
        const ux = d > 1e-6 ? ex / d : 1;
        const uy = d > 1e-6 ? ey / d : 0;
        const m = 0.5 * (SHOW_SEP - d);
        const wi = pinned[i] ? 0 : pinned[j] ? 2 : 1;
        const wj = pinned[j] ? 0 : pinned[i] ? 2 : 1;
        dx[i] -= ux * m * 0.5 * wi;
        dy[i] -= uy * m * 0.5 * wi;
        dx[j] += ux * m * 0.5 * wj;
        dy[j] += uy * m * 0.5 * wj;
      }
    }
    for (let i = 0; i < N_DOTS; i++) {
      xs[i] += dx[i];
      ys[i] += dy[i];
    }
  }
  return pos.map((p, i) => [xs[i] - p[0], ys[i] - p[1]]);
};
const SEP_TAPS = [-2, -1, 0, 1, 2].map((j) => ({ j, w: Math.exp(-(j * j) / 2) }));
/** every dot at frame f (world px), with the house micro-drift at zoom k. The
 *  smoothing can cut a corner where two dots turn past each other; the light
 *  separation that fixes it is itself averaged over +-2 frames, so a nudge is
 *  spread over five frames and never kicks */
export const dotsAt = (f: number, k: number): DotState[] => {
  const fi = Math.round(f);
  const here = basePositions(fi, k);
  const cx = new Float64Array(N_DOTS);
  const cy = new Float64Array(N_DOTS);
  let wsum = 0;
  for (const { j, w } of SEP_TAPS) {
    const fj = fi + j;
    const pos = j === 0 ? here : basePositions(fj, k);
    const c = separation(pos, pinnedAt(fj));
    for (let i = 0; i < N_DOTS; i++) {
      cx[i] += c[i][0] * w;
      cy[i] += c[i][1] * w;
    }
    wsum += w;
  }
  const pinned = pinnedAt(fi);
  return here.map(([x, y], i) => ({
    x: x + (pinned[i] ? 0 : cx[i] / wsum),
    y: y + (pinned[i] ? 0 : cy[i] / wsum),
    t: colourT(i, fi),
    id: i,
  }));
};

// ---------------------------------------------------------------------------
// THE COINS AT A FRAME
// ---------------------------------------------------------------------------
export type CoinState = { i: number; x: number; y: number; scale: number; absorb: boolean };
export const coinsAt = (f: number): CoinState[] => {
  const out: CoinState[] = [];
  const P = headP(f);
  for (let i = 0; i < N_COINS; i++) {
    const p = P - i * COIN_GAP;
    if (p <= 0) continue;
    const born = smoothstep(p / 5); // out of the city
    if (f < T_E[i]) {
      const s = ROAD_LEN - p;
      const q = CORTES_ROAD.pointAt(s);
      // individual phase: a hair of lateral sway, never in unison
      const tn = CORTES_ROAD.tangentAt(s);
      const sw = 0.35 * Math.sin(f * (0.21 + 0.05 * hash(i, 31)) + 6.283 * hash(i, 32)) * born;
      out.push({ i, x: q[0] - tn[1] * sw, y: q[1] + tn[0] * sw, scale: born, absorb: false });
      continue;
    }
    // the branch: leaves E at the stream's speed, eases to rest on its cluster
    const tE = T_E[i];
    const tA = T_ARRIVE[i];
    const H = tA - tE;
    const u = clamp01((f - tE) / H);
    const v = coinSpeed(tE);
    const m = clusterAt(i, Math.min(f, tA), SIM);
    const h00 = 2 * u * u * u - 3 * u * u + 1;
    const h10 = u * u * u - 2 * u * u + u;
    const h01 = -2 * u * u * u + 3 * u * u;
    const x = h00 * E_PT[0] + h10 * H * v * ROAD_DIR_E[0] + h01 * m[0];
    const y = h00 * E_PT[1] + h10 * H * v * ROAD_DIR_E[1] + h01 * m[1];
    const sc = 1 - smoothstep((f - (tA - 2)) / ABSORB);
    if (sc <= 0.001) continue;
    out.push({ i, x, y, scale: sc, absorb: f > tA - 2 });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE CAMERA. A framed world point S (at screen (540, 835)) and ln k, each the
// integral of cosine-tapered velocity bumps (makeTrack): three glides and one
// creep, overlapping so no channel ever rests at zero velocity for more than
// an instant. The bumps' areas are SOLVED so each channel passes exactly
// through its keyed framings (a 4 x 4 linear system per channel):
//   glide 1  f-8..44   (raised cosine) eased pull-back from the camp (k 6.0
//                      on f0) and west onto the whole 1519 empire: the widest
//                      moment, k 2.30 at f38 (its box centred on y 835, every
//                      edge in frame from ~f30 to ~f46)
//   glide 2  f34..90   east with the coins' head, pushing in (k ~5.3 on
//                      "riches" f69) onto the conversion (k 7.3 keyed at f82)
//   creep    f60..164  in on the conversion (k 8.3 keyed at f136)
//   glide 3  f132..234 back and west with the column (k 5.6 keyed on the last
//                      frame, still moving)
// The framings come from the data: the two bodies' box centre (open, the
// conversion), the 1519 empire's box, the column on the last frame.
// ---------------------------------------------------------------------------
export const K_OPEN = 6.0;
const WINDOWS: [number, number, number][] = [
  [-8, 44, 1], // glide 1
  [34, 90, 0.85], // glide 2
  [60, 164, 1], // creep
  [132, 234, 0.95], // glide 3
];
const KEY_F = [38, 82, 136, LAST];
export const K_KEYS = [2.3, 7.3, 8.3, 5.6];
export const S_OPEN: P2 = CROWDS_C;
/** the widest moment frames the whole main empire (the box centre on y 835) */
export const S_EMPIRE: P2 = bboxCentre(EMPIRE_POLYS[0][0] as P2[]);
export const S_CROWD: P2 = [CROWDS_C[0] - 2, CROWDS_C[1] + 0.6];
export const S_CREEP: P2 = [CROWDS_C[0] - 1, CROWDS_C[1] + 0.8];
/** on the last frame: the column (40 % of the way from the formation point to its head) at the centre */
export const S_END: P2 = (() => {
  const h = COLUMN.marchHeadPt(LAST);
  const fp = COLUMN.formPt;
  return [0.4 * h[0] + 0.6 * fp[0], 0.4 * h[1] + 0.6 * fp[1]];
})();
/** a channel through the windows' bumps, value v0 on f0, hitting `targets` on KEY_F */
const solveTrack = (v0: number, targets: number[]) => {
  const unit = WINDOWS.map(([a, b, t]) => makeTrack([[a, b, 1, t]] as Bump[], 0));
  const n = WINDOWS.length;
  const m = KEY_F.map((f, r) => [...unit.map((u) => u(f)), targets[r] - v0]);
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
  return makeTrack(WINDOWS.map(([a, b, t], i) => [a, b, areas[i], t]) as Bump[], v0);
};
const LNK = solveTrack(Math.log(K_OPEN), K_KEYS.map(Math.log));
const SX = solveTrack(S_OPEN[0], [S_EMPIRE[0], S_CROWD[0], S_CREEP[0], S_END[0]]);
const SY = solveTrack(S_OPEN[1], [S_EMPIRE[1], S_CROWD[1], S_CREEP[1], S_END[1]]);
/** the authored camera at frame f (no sway) */
export const camAt = (f: number): Cam => {
  const k = Math.exp(LNK(f));
  return { k, cx: SX(f), cy: SY(f) + CAM_LIFT / k };
};
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));
