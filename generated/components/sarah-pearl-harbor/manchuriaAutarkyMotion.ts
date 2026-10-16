// manchuriaAutarkyMotion.ts — the geometry, clocks, camera keys, the front's travel-time
// field and the wagon simulation of ManchuriaAutarky (Sarah Paine, Pearl Harbor clip).
// No React here, so the beat frames can be printed with bun for checks.
// World px = the ASIA world of pearlAsiaMapData.
import { MANCHUKUO_POLY, PLACES, project } from "./pearlAsiaMapData";

export type P2 = [number, number];
type LL = [number, number];

// ---------------------------------------------------------------------------
// polylines (copies of pearlShared's helpers, so this module stays React-free)
// ---------------------------------------------------------------------------
const CUM = new WeakMap<P2[], number[]>();
export const cumOf = (pts: P2[]) => {
  let c = CUM.get(pts);
  if (!c) {
    c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    CUM.set(pts, c);
  }
  return c;
};
export const lengthOf = (pts: P2[]) => {
  const c = cumOf(pts);
  return c[c.length - 1];
};
export const pointAt = (pts: P2[], s: number) => {
  const c = cumOf(pts);
  const L = c[c.length - 1];
  const t = Math.max(0, Math.min(L, s));
  let lo = 0;
  let hi = c.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c[m] <= t) lo = m;
    else hi = m;
  }
  const i = Math.min(pts.length - 2, lo);
  const seg = c[i + 1] - c[i] || 1e-9;
  const u = (t - c[i]) / seg;
  const a = pts[i];
  const b = pts[i + 1];
  return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, tx: (b[0] - a[0]) / seg, ty: (b[1] - a[1]) / seg };
};
const ll = (pts: LL[]): P2[] => pts.map(([lo, la]) => project(lo, la));
/** Catmull-Rom resample through the waypoints (sea legs) */
const smooth = (pts: P2[], per = 8): P2[] => {
  const out: P2[] = [];
  const n = pts.length;
  const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[n - 1]);
  return out;
};
const join = (...legs: P2[][]): P2[] => {
  const out: P2[] = [];
  legs.forEach((L, i) => out.push(...(i === 0 ? L : L.slice(1))));
  return out;
};
const sOnNear = (pts: P2[], p: P2) => {
  let best = 0;
  let bd = Infinity;
  const L = lengthOf(pts);
  for (let s = 0; s <= L; s += 0.25) {
    const q = pointAt(pts, s);
    const d = Math.hypot(q.x - p[0], q.y - p[1]);
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
};

export const MUKDEN = PLACES.mukden;
export const ANSHAN = PLACES.anshan;
export const FUSHUN = PLACES.fushun;
export const PORT_ARTHUR = PLACES.portArthur;

// ---------------------------------------------------------------------------
// THE ORANGE LOOP, one ring round Korea (s = 0 at Hsinking / Changchun):
//   TRUNK  the South Manchuria Railway, Changchun -> Mukden -> Anshan -> Dairen
//   SEA    Dairen -> round Korea -> Kanmon, ending under Kyushu (Japan takes wagons in)
//   JAPAN  under Honshu to Tsuruga (hidden by the land)
//   JSEA   Tsuruga -> across the Sea of Japan -> Seishin / Chongjin (Korea)
//   NRAIL  Chongjin -> Hoeryong -> Tumen -> Dunhua -> Jilin -> Changchun
// ---------------------------------------------------------------------------
export const TRUNK_RAIL = ll([
  [125.32, 43.88], // Hsinking / Changchun
  [124.82, 43.5],
  [124.37, 43.17], // Siping
  [124.11, 42.78],
  [124.04, 42.55], // Kaiyuan
  [123.84, 42.29], // Tieling
  [123.43, 41.8], // Mukden
  [123.17, 41.27], // Liaoyang
  [122.99, 41.11], // Anshan
  [122.75, 40.85], // Haicheng
  [122.5, 40.63], // Dashiqiao
  [122.35, 40.4],
  [122.13, 40.18],
  [122.0, 39.63], // Wafangdian
  [121.97, 39.4],
  [121.71, 39.1],
  [121.62, 38.92], // Dairen
]);
const SEA = smooth(
  ll([
    [121.62, 38.92],
    [121.9, 38.86],
    [122.6, 38.35],
    [123.6, 37.3],
    [124.45, 35.95],
    [125.05, 34.75],
    [125.75, 34.05],
    [126.6, 33.82], // between Jeju and the mainland
    [127.6, 33.95],
    [128.55, 33.98],
    [129.4, 33.95], // between Tsushima and Iki
    [130.15, 34.05],
    [130.6, 34.02],
    [130.82, 33.93],
    [130.86, 33.88], // under Kyushu (Moji / Yawata)
  ]),
);
const JAPAN = ll([
  [130.86, 33.88],
  [131.0, 34.05], // under Shimonoseki
  [131.6, 34.3],
  [132.6, 34.72],
  [133.8, 35.02],
  [135.0, 35.28],
  [135.7, 35.5],
  [136.06, 35.6], // under Tsuruga
]);
const JSEA = smooth(
  ll([
    [136.06, 35.6],
    [136.03, 35.72],
    [135.9, 36.15],
    [134.2, 38.2],
    [131.9, 40.25],
    [130.45, 41.35],
    [129.83, 41.74], // Seishin / Chongjin
  ]),
);
const NRAIL = ll([
  [129.83, 41.74],
  [129.75, 42.44], // Hoeryong
  [129.85, 42.95], // Namyang / Tumen
  [129.5, 42.9], // Yanji
  [128.23, 43.37], // Dunhua
  [127.33, 43.72], // Jiaohe
  [126.55, 43.84], // Jilin
  [125.32, 43.88], // Changchun
]);
export const LOOP = join(TRUNK_RAIL, SEA, JAPAN, JSEA, NRAIL);
export const L_LOOP = lengthOf(LOOP);
export const S_DAIREN = lengthOf(TRUNK_RAIL);
export const S_J = S_DAIREN + lengthOf(SEA); // under Kyushu: Japan takes a wagon in here
export const S_TSURUGA = S_J + lengthOf(JAPAN); // out from under Honshu
export const S_CHONGJIN = S_TSURUGA + lengthOf(JSEA);
export const S_MUKDEN = sOnNear(TRUNK_RAIL, MUKDEN);
export const S_ANSHAN = sOnNear(TRUNK_RAIL, ANSHAN);
/** the loop's legs: rail legs get the chequered symbol, sea legs a cased line, JAPAN is not drawn */
export const LEGS: { a: number; b: number; kind: "rail" | "sea" | "hidden" }[] = [
  { a: 0, b: S_DAIREN, kind: "rail" },
  { a: S_DAIREN, b: S_J, kind: "sea" },
  { a: S_J, b: S_TSURUGA, kind: "hidden" },
  { a: S_TSURUGA, b: S_CHONGJIN, kind: "sea" },
  { a: S_CHONGJIN, b: L_LOOP, kind: "rail" },
];

// ---------------------------------------------------------------------------
// THE RESOURCES. Ground points (world px) of bold cream glyphs, world-scaled (GLYPH_W
// world px tall: ~120 screen px at the close-up). Fushun, Mukden and Anshan sit 10-20
// world px apart, so the coal heap stands just east of Fushun and the ingots just west
// of Anshan (each town at its foot); the sack stands on the central plain by Changchun.
// ---------------------------------------------------------------------------
export type Src = "coal" | "soy" | "iron";
export const GLYPH_W = 23;
/** glyph width / height */
export const GLYPH_ASPECT: Record<Src, number> = { coal: 1.5, iron: 1.56, soy: 0.9 };
export const GLYPH_SCALE: Record<Src, number> = { coal: 1, iron: 0.92, soy: 1 };
export const GLYPH: Record<Src, P2> = {
  coal: [FUSHUN[0] + 19, FUSHUN[1] + 0.5],
  iron: [ANSHAN[0] - 21, ANSHAN[1] - 2],
  soy: [721, 651], // on the central plain, just west of the railway north of Changchun
};
export const FEED: Record<Src, P2[]> = {
  coal: [[GLYPH.coal[0] - 2, GLYPH.coal[1] - 7], [GLYPH.coal[0] - 9, GLYPH.coal[1] + 1], FUSHUN, MUKDEN],
  iron: [[GLYPH.iron[0] + 2, GLYPH.iron[1] - 7], [GLYPH.iron[0] + 13, GLYPH.iron[1] + 0.5], ANSHAN],
  soy: [[GLYPH.soy[0] + 2, GLYPH.soy[1] - 8], [GLYPH.soy[0] + 6, GLYPH.soy[1] + 0.5], TRUNK_RAIL[0]],
};
export const FEED_LEN: Record<Src, number> = { coal: lengthOf(FEED.coal), iron: lengthOf(FEED.iron), soy: lengthOf(FEED.soy) };
const JOIN_S: Record<Src, number> = { soy: 0, coal: S_MUKDEN, iron: S_ANSHAN };
const SRC_IDX: Record<Src, number> = { soy: 0, coal: 1, iron: 2 };

// ---------------------------------------------------------------------------
// THE ADVANCE ARROWS: the Kwantung Army out of its railway zone (Sept 1931 - Feb 1932):
// north from Changchun up the railway to Harbin, east from Changchun to Jilin and
// Dunhua, west from Mukden towards Jehol. Each leads one lobe of the front.
// ---------------------------------------------------------------------------
export const ARROWS: P2[][] = [
  smooth(ll([[125.32, 43.88], [125.7, 44.55], [126.2, 45.25], [126.53, 45.8], [126.7, 46.6]]), 8), // north: Changchun -> Harbin
  smooth(ll([[125.32, 43.88], [125.95, 43.84], [126.55, 43.84], [127.33, 43.72], [128.23, 43.42]]), 8), // east: -> Jilin -> Dunhua
  smooth([MUKDEN, [705, 697], [688, 686], [668, 682], [646, 687]], 8), // west: Mukden -> towards Jehol
];
export const ARROW_LEN = ARROWS.map(lengthOf);

// ---------------------------------------------------------------------------
// THE FRONT: a travel-time field over Manchuria. Dijkstra on a 2-px grid (16
// neighbours) from the railway at the Kwantung lease line; the railway corridor is
// fast (the Kwantung Army ran up the line first), the land slower and uneven (two
// smooth noise octaves), the sea and the world outside Manchukuo very slow, so the
// contours follow the land. The front at frame f is the contour T = frontT(f), drawn
// per frame by marching squares: an irregular, ink-like frontier, never an arc.
// ---------------------------------------------------------------------------
const FG = { x0: 576, y0: 444, cell: 2, nx: 152, ny: 168 };
const BIG = 1e6;
const scanInside = (() => {
  const rings: P2[][] = [];
  for (const poly of MANCHUKUO_POLY) for (const r of poly) rings.push(r);
  const inside = new Uint8Array(FG.nx * FG.ny);
  for (let j = 0; j < FG.ny; j++) {
    const y = FG.y0 + j * FG.cell + 1e-4;
    const xs: number[] = [];
    for (const r of rings)
      for (let i = 0, k = r.length - 1; i < r.length; k = i++) {
        const [xi, yi] = r[i];
        const [xk, yk] = r[k];
        if (yi > y !== yk > y) xs.push(xi + ((y - yi) * (xk - xi)) / (yk - yi));
      }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < FG.nx; i++) {
      const x = FG.x0 + i * FG.cell;
      let c = 0;
      for (const xx of xs) if (xx < x) c++;
      inside[j * FG.nx + i] = c % 2;
    }
  }
  return inside;
})();
const distToPolyline = (pts: P2[], x: number, y: number) => {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
};
const FIELD = (() => {
  const { nx, ny, cell, x0, y0 } = FG;
  const speed = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const x = x0 + i * cell;
      const y = y0 + j * cell;
      const id = j * nx + i;
      if (!scanInside[id]) {
        speed[id] = 0.12;
        continue;
      }
      // three smooth noise octaves (~130, ~45 and ~18 world px): lobes, fingers, a ragged ink edge
      const n1 = 0.5 * Math.sin(x / 21 + 0.9 * Math.sin(y / 29) + 1.7) + 0.5 * Math.sin(y / 17 + 0.8 * Math.sin(x / 25) - 0.4);
      const n2 = 0.5 * Math.sin((x + 0.6 * y) / 7.5 + 2.1 * Math.sin(y / 13)) + 0.5 * Math.sin((y - 0.5 * x) / 6.3 + 0.7);
      const n3 = 0.5 * Math.sin((0.8 * x - 0.6 * y) / 3.1 + 1.3 * Math.sin(y / 5.3)) + 0.5 * Math.sin((0.5 * x + 0.9 * y) / 2.7 + 1.1 * Math.sin(x / 4.9) + 2.3);
      const rail = Math.exp(-Math.pow(distToPolyline(TRUNK_RAIL, x, y) / 4.5, 2));
      let arrow = 0;
      for (const A of ARROWS) arrow = Math.max(arrow, Math.exp(-Math.pow(distToPolyline(A, x, y) / 6, 2)));
      speed[id] = Math.max(0.3, 1 + 0.5 * n1 + 0.32 * n2 + 0.2 * n3) * (1 + 1.6 * rail + 2.4 * arrow);
    }
  const T = new Float32Array(nx * ny).fill(BIG);
  // a binary heap of [T, id]
  const heap: number[] = [];
  const hT: number[] = [];
  const push = (t: number, id: number) => {
    heap.push(id);
    hT.push(t);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (hT[p] <= hT[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      [hT[p], hT[i]] = [hT[i], hT[p]];
      i = p;
    }
  };
  const pop = () => {
    const id = heap[0];
    const t = hT[0];
    const lid = heap.pop() as number;
    const lt = hT.pop() as number;
    if (heap.length) {
      heap[0] = lid;
      hT[0] = lt;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && hT[l] < hT[m]) m = l;
        if (r < heap.length && hT[r] < hT[m]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        [hT[m], hT[i]] = [hT[i], hT[m]];
        i = m;
      }
    }
    return { id, t };
  };
  // seeds: the railway zone's two garrison towns, Mukden and Changchun (the arrows' tails)
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const id = j * nx + i;
      const x = x0 + i * cell;
      const y = y0 + j * cell;
      if (scanInside[id] && (Math.hypot(x - MUKDEN[0], y - MUKDEN[1]) < 3.5 || Math.hypot(x - TRUNK_RAIL[0][0], y - TRUNK_RAIL[0][1]) < 3.5)) {
        T[id] = 0;
        push(0, id);
      }
    }
  const NB: [number, number][] = [];
  for (let dj = -2; dj <= 2; dj++)
    for (let di = -2; di <= 2; di++) {
      if (!di && !dj) continue;
      if (Math.abs(di) === 2 && Math.abs(dj) === 2) continue;
      if ((Math.abs(di) === 2 && dj === 0) || (Math.abs(dj) === 2 && di === 0)) continue;
      NB.push([di, dj]);
    }
  const done = new Uint8Array(nx * ny);
  while (heap.length) {
    const { id, t } = pop();
    if (done[id]) continue;
    done[id] = 1;
    const i = id % nx;
    const j = (id - i) / nx;
    for (const [di, dj] of NB) {
      const ii = i + di;
      const jj = j + dj;
      if (ii < 1 || jj < 1 || ii >= nx - 1 || jj >= ny - 1) continue;
      const nid = jj * nx + ii;
      if (done[nid]) continue;
      const nt = t + (Math.hypot(di, dj) * cell * 2) / (speed[id] + speed[nid]);
      if (nt < T[nid]) {
        T[nid] = nt;
        push(nt, nid);
      }
    }
  }
  let tMax = 0;
  for (let id = 0; id < nx * ny; id++) if (scanInside[id] && T[id] < BIG) tMax = Math.max(tMax, T[id]);
  return { T, tMax };
})();
/** the travel time at a world point (bilinear) */
export const fieldAt = (x: number, y: number) => {
  const fx = (x - FG.x0) / FG.cell;
  const fy = (y - FG.y0) / FG.cell;
  const i = Math.max(0, Math.min(FG.nx - 2, Math.floor(fx)));
  const j = Math.max(0, Math.min(FG.ny - 2, Math.floor(fy)));
  const u = Math.max(0, Math.min(1, fx - i));
  const v = Math.max(0, Math.min(1, fy - j));
  const t = FIELD.T;
  const a = t[j * FG.nx + i];
  const b = t[j * FG.nx + i + 1];
  const c = t[(j + 1) * FG.nx + i];
  const d = t[(j + 1) * FG.nx + i + 1];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
};

// ---------------------------------------------------------------------------
// CLOCKS (local frames; spoken: invade@21 Manchuria@24 because@36 autarky@73
// independence@93 resources@125 within@141 empire@165 don't@173 worry@180 trade@187;
// the cut back to the speaker is at 194)
// ---------------------------------------------------------------------------
export const T = {
  label: 16, // MANCHURIA lands on the word (f24)
  front: [20, 66] as const, // the front leaves the lease line ... reaches the Amur
  glyphRise: 10,
  srcStart: { coal: 50, soy: 52, iron: 54 } as Record<Src, number>,
  // "don't have to worry about trade": per lane, the last ship turns back at turn[i] (the
  // earlier ones have docked by then), and the lane withdraws out through its frame edge
  turn: [162, 164, 166, 168],
  withdrawDelay: 6,
  withdrawFrames: 18, // (all four gone by f192, the turned ships out with them)
};
/** the front's level in field units: a 5-frame ease-in, then steady to the last corner */
export const frontT = (f: number) => {
  const span = T.front[1] - T.front[0];
  const t = f - T.front[0];
  if (t <= 0) return -1;
  const e = 5;
  const lin = t < e ? (t * t) / (2 * e) : t - e / 2;
  return (lin / (span - e / 2)) * FIELD.tMax * 1.002;
};
const frameAtLevel = (lv: number) => {
  for (let f = T.front[0]; f < 300; f += 0.25) if (frontT(f) >= lv) return f;
  return 300;
};
/** the frame each glyph starts to rise: once the front has covered its whole footprint */
export const RISE: Record<Src, number> = (() => {
  const out = {} as Record<Src, number>;
  (["coal", "iron", "soy"] as Src[]).forEach((src) => {
    const [gx, gy] = GLYPH[src];
    const h = GLYPH_W * GLYPH_SCALE[src];
    const w = h * GLYPH_ASPECT[src];
    let lv = 0;
    for (const [px, py] of [
      [-0.5, 0],
      [0.5, 0],
      [0, 0],
      [-0.5, -1],
      [0.5, -1],
      [0, -1],
      [-0.25, -0.5],
      [0.25, -0.5],
    ])
      lv = Math.max(lv, fieldAt(gx + px * w, gy + py * h));
    out[src] = frameAtLevel(lv) + 2;
  });
  return out;
})();

const INK_AMP = 1.1; // world px
// marching squares: the closed contour rings of the field at level lv, Chaikin-smoothed once
export const frontRings = (lv: number): P2[][] => {
  const { nx, ny, cell, x0, y0 } = FG;
  const t = FIELD.T;
  const v = (i: number, j: number) => (i <= 0 || j <= 0 || i >= nx - 1 || j >= ny - 1 ? BIG : t[j * nx + i]);
  const pts = new Map<number, P2>();
  const adj = new Map<number, number[]>();
  // edge keys: horizontal edge (i,j)-(i+1,j) = 2*(j*nx+i), vertical (i,j)-(i,j+1) = 2*(j*nx+i)+1
  const ept = (key: number): P2 => {
    let p = pts.get(key);
    if (p) return p;
    const id = key >> 1;
    const i = id % nx;
    const j = (id - i) / nx;
    const a = v(i, j);
    const b = key & 1 ? v(i, j + 1) : v(i + 1, j);
    const u = Math.max(0, Math.min(1, (lv - a) / (b - a || 1e-9)));
    p = key & 1 ? [x0 + i * cell, y0 + (j + u) * cell] : [x0 + (i + u) * cell, y0 + j * cell];
    pts.set(key, p);
    return p;
  };
  const link = (a: number, b: number) => {
    ept(a);
    ept(b);
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
  };
  for (let j = 0; j < ny - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = v(i, j) < lv ? 1 : 0;
      const b = v(i + 1, j) < lv ? 1 : 0;
      const c = v(i + 1, j + 1) < lv ? 1 : 0;
      const d = v(i, j + 1) < lv ? 1 : 0;
      const code = a | (b << 1) | (c << 2) | (d << 3);
      if (code === 0 || code === 15) continue;
      const top = 2 * (j * nx + i);
      const left = 2 * (j * nx + i) + 1;
      const right = 2 * (j * nx + i + 1) + 1;
      const bottom = 2 * ((j + 1) * nx + i);
      switch (code) {
        case 1:
        case 14:
          link(top, left);
          break;
        case 2:
        case 13:
          link(top, right);
          break;
        case 3:
        case 12:
          link(left, right);
          break;
        case 4:
        case 11:
          link(right, bottom);
          break;
        case 6:
        case 9:
          link(top, bottom);
          break;
        case 7:
        case 8:
          link(left, bottom);
          break;
        case 5:
        case 10: {
          const centre = (v(i, j) + v(i + 1, j) + v(i + 1, j + 1) + v(i, j + 1)) / 4 < lv ? 1 : 0;
          if ((code === 5) === (centre === 1)) {
            link(top, right);
            link(left, bottom);
          } else {
            link(top, left);
            link(right, bottom);
          }
          break;
        }
      }
    }
  const seen = new Set<number>();
  const rings: P2[][] = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const ring: P2[] = [];
    let prev = -1;
    let cur = start;
    for (let guard = 0; guard < 100000; guard++) {
      seen.add(cur);
      ring.push(pts.get(cur) as P2);
      const nb = adj.get(cur) as number[];
      const next = nb[0] !== prev ? nb[0] : nb[1];
      if (next === undefined || next === start || seen.has(next)) break;
      prev = cur;
      cur = next;
    }
    if (ring.length < 4) continue;
    // Chaikin, closed; then a small world-anchored displacement (the ink's ragged edge:
    // it stays put on the land as the front passes, so it never swims)
    const sm: P2[] = [];
    for (let k = 0; k < ring.length; k++) {
      const p = ring[k];
      const q = ring[(k + 1) % ring.length];
      sm.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]);
    }
    rings.push(sm.map(([x, y]): P2 => [x + INK_AMP * Math.sin(x / 2.3 + 1.7 * Math.sin(y / 3.1)), y + INK_AMP * Math.sin(y / 2.1 + 1.5 * Math.sin(x / 2.9) + 0.8)]));
  }
  return rings;
};
export const FRONT_DONE = T.front[1] + 1;
const ARROW_LEAD = 5; // field units: the head runs this far ahead of the hatch
const ARROW_T = ARROWS.map((A) => {
  const L = lengthOf(A);
  const out: number[] = [];
  for (let s = 0; s <= L; s += 0.5) {
    const q = pointAt(A, s);
    out.push(fieldAt(q.x, q.y));
  }
  // monotone along the path (the head never steps back)
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1]);
  return out;
});
/** arclength of arrow i's head at frame f (0 = not yet out) */
export const arrowHead = (i: number, f: number) => {
  const base = frontT(f);
  if (base <= 0) return 0;
  const lv = base + ARROW_LEAD * Math.min(1, base / 10); // the lead grows in, so each arrow is drawn out of its town
  const tab = ARROW_T[i];
  let k = 0;
  while (k < tab.length - 1 && tab[k + 1] <= lv) k++;
  return Math.min(ARROW_LEN[i], k * 0.5);
};
export const ARROW_FADE = [T.front[1] + 2, T.front[1] + 16] as const;

// ---------------------------------------------------------------------------
// THE ORANGE FLOW: one conveyor of evenly spaced slots round the loop at constant
// speed V. Slot j belongs to source j mod 3 (soy, coal, iron): it is filled where it
// passes that source's junction (Changchun, Mukden, Anshan) if it is empty. Japan takes
// every wagon in under Kyushu until the return leg opens, then every other one; the
// rest run on under Honshu, out of Tsuruga, across the Sea of Japan and back by rail.
// ---------------------------------------------------------------------------
export const V = 6.2; // world px / frame
export const N_SLOTS = Math.round(L_LOOP / 21) - (Math.round(L_LOOP / 21) % 3);
export const GAP = L_LOOP / N_SLOTS;
export type Wagon = { src: Src; born: number; joinS: number; joinT: number; endT: number; id: number };
export const SIM = (() => {
  const DT = GAP / V;
  // slot 1 (coal's) passes Mukden as the first coal wagon arrives there
  const T0 = T.srcStart.coal + FEED_LEN.coal / V - S_MUKDEN / V - DT;
  type Ev = { t: number; kind: 0 | 1; src?: Src; j: number };
  const evs: Ev[] = [];
  for (let n = -N_SLOTS; ; n++) {
    const tB = T0 + n * DT;
    if (tB > 280) break;
    const j = ((n % N_SLOTS) + N_SLOTS) % N_SLOTS;
    (["soy", "coal", "iron"] as Src[]).forEach((src) => evs.push({ t: tB + JOIN_S[src] / V, kind: 0, src, j }));
    evs.push({ t: tB + S_J / V, kind: 1, j });
  }
  evs.sort((a, b) => a.t - b.t || b.kind - a.kind);
  const occ: (Wagon | null)[] = new Array(N_SLOTS).fill(null);
  const wagons: Wagon[] = [];
  let firstIn = -1;
  let kc = 0;
  let bLead: Wagon | null = null;
  for (const e of evs) {
    if (e.kind === 0) {
      const src = e.src as Src;
      if (occ[e.j] || e.j % 3 !== SRC_IDX[src]) continue;
      const born = e.t - FEED_LEN[src] / V;
      if (born < T.srcStart[src]) continue;
      const w: Wagon = { src, born, joinS: JOIN_S[src], joinT: e.t, endT: Infinity, id: wagons.length };
      wagons.push(w);
      occ[e.j] = w;
    } else {
      const w = occ[e.j];
      if (!w) continue;
      if (firstIn < 0) firstIn = e.t;
      if (e.t < firstIn + 0.5) {
        w.endT = e.t;
        occ[e.j] = null;
      } else {
        kc++;
        if (kc % 2 === 1) {
          if (!bLead) bLead = w;
        } else {
          w.endT = e.t;
          occ[e.j] = null;
        }
      }
    }
  }
  const b = bLead as Wagon | null;
  const bLeadT = b ? b.joinT + (S_J - b.joinS) / V : Infinity;
  const first = { coal: wagons.find((w) => w.src === "coal"), soy: wagons.find((w) => w.src === "soy"), iron: wagons.find((w) => w.src === "iron") } as Record<Src, Wagon>;
  const leadIn = Math.min(...wagons.map((w) => w.joinT + (S_J - w.joinS) / V));
  return {
    wagons,
    bLead: b,
    first,
    /** the first wagon reaches Japan; the return leg opens; it leaves Tsuruga; it reaches Korea; the loop closes */
    leadJapan: leadIn,
    bLeadT,
    bTsuruga: bLeadT + (S_TSURUGA - S_J) / V,
    bKorea: bLeadT + (S_CHONGJIN - S_J) / V,
    loopClosed: bLeadT + (L_LOOP - S_J) / V,
  };
})();
/** the loop arclength intervals drawn so far (each source's first wagon draws from its junction on) */
export const drawnIntervals = (f: number): [number, number][] => {
  const iv: [number, number][] = [[0, S_DAIREN]]; // the South Manchuria Railway: Japan's since 1905
  (["soy", "coal", "iron"] as Src[]).forEach((src) => {
    const w = SIM.first[src];
    if (!w || f < w.joinT) return;
    iv.push([w.joinS, Math.min(S_J, w.joinS + V * (f - w.joinT))]);
  });
  if (SIM.bLead && f >= SIM.bLeadT) iv.push([S_J, Math.min(L_LOOP, S_J + V * (f - SIM.bLeadT))]);
  iv.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const q of iv) {
    const last = out[out.length - 1];
    if (last && q[0] <= last[1] + 0.01) last[1] = Math.max(last[1], q[1]);
    else out.push([q[0], q[1]]);
  }
  return out;
};
/** a wagon's world position + heading at a frame, or null when it is not on the map */
export const wagonAt = (w: Wagon, f: number) => {
  if (f < w.born || f >= w.endT) return null;
  if (f < w.joinT) return pointAt(FEED[w.src], V * (f - w.born));
  return pointAt(LOOP, (w.joinS + V * (f - w.joinT)) % L_LOOP);
};

// ---------------------------------------------------------------------------
// THE CREAM SEA-LANES (world trade): from beyond the frame edges into four of Japan's
// ports, each ending a little inland (hidden under Japan's land).
// ---------------------------------------------------------------------------
export const LANES: P2[][] = [
  // North America (great circle) -> Yokohama
  smooth(
    ll([
      [162, 46.5],
      [151, 42.0],
      [145.2, 38.4],
      [142.3, 35.6],
      [140.7, 34.65],
      [139.98, 34.82],
      [139.76, 35.1],
      [139.72, 35.32],
      [139.66, 35.45],
      [139.6, 35.5],
    ]),
    6,
  ),
  // Honolulu / San Francisco -> Nagoya
  smooth(
    ll([
      [172, 25],
      [160, 29.8],
      [150, 32.4],
      [142, 33.5],
      [138.6, 34.0],
      [137.3, 34.3],
      [136.98, 34.52],
      [136.86, 34.75],
      [136.85, 34.95],
      [136.88, 35.07],
      [136.9, 35.12],
    ]),
    6,
  ),
  // the South Seas / Australia -> Kobe
  smooth(
    ll([
      [143, 8],
      [140, 19],
      [137.4, 27.5],
      [135.6, 32.4],
      [135.0, 33.55],
      [134.97, 34.0],
      [135.03, 34.3],
      [135.15, 34.55],
      [135.2, 34.68],
      [135.22, 34.74],
    ]),
    6,
  ),
  // South-east Asia and India (the Taiwan strait) -> Nagasaki
  smooth(
    ll([
      [111, 9],
      [114.5, 15.5],
      [117.6, 21.0],
      [119.0, 23.2],
      [119.4, 24.3],
      [120.35, 25.5],
      [121.6, 26.9],
      [124.2, 29.6],
      [127.6, 31.6],
      [129.4, 32.55],
      [129.82, 32.73],
      [129.88, 32.76],
    ]),
    6,
  ),
];
export const LANE_LEN = LANES.map(lengthOf);
export const SHIP_V = 3.6; // world px / frame, constant
export const SHIP_PERIOD = 30; // frames between sailings on a lane (108 world px apart)
export const SHIP_PHASE = [3, 19, 11, 27]; // per lane
export const SHIP_R = 7; // world px: the radius of the last ships' turn

// ---------------------------------------------------------------------------
// CAMERA KEYS { f, x, y, k } (world point on the frame centre): wide on Japan, Korea
// and Manchuria -> north-west with the front -> in on south Manchuria for the
// resources -> south-east with the first wagons -> back out on the empire's one loop,
// landing by ~f160 so the camera is calm while the outside trade stops; a slow creep
// keeps it alive to the last frame. Every channel is monotone after f96.
// ---------------------------------------------------------------------------
export const CAM_KEYS = [
  { f: 0, x: 835, y: 790, k: 2.25 },
  { f: 18, x: 814, y: 762, k: 2.34 },
  { f: 48, x: 752, y: 680, k: 2.62 },
  { f: 78, x: 723, y: 698, k: 5.0 },
  { f: 96, x: 726, y: 704, k: 5.25 },
  { f: 128, x: 792, y: 785, k: 3.5 },
  { f: 156, x: 811, y: 806, k: 2.93 },
  { f: 206, x: 813, y: 809, k: 2.86 },
];
