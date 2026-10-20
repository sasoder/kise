// V2 VARIANT (OutcompeteEuropeV2, cold-review pass): the spread starts from ONE core at Catalhoyuk (central
// Anatolia, the earliest dated anchor, 7100 BC); the Fertile Crescent origin further east (the Levant, Mesopotamia,
// Cyprus, the Caucasus, Iran, Arabia) is outside this variant's model, like Africa. The pockets are clearings that hug
// their forager crowds (value POCKET, no front line round them), and giving-way foragers near a pocket flee INTO it
// (refugee slots). Writes neolithicFrontDataV2.ts only (the land mask is the original neolithicLandMask.ts).
//
// The first-farmers clip's FRONT MODEL bake (Kyle Harper, "Did disease help the first farmers replace
// hunter-gatherers?"): the arrival-date field of farming over Neolithic Europe, the forager and farmer dot sets,
// and the land mask the cuts clip the orange hatch with. Reads the map world of
// scripts/maps/configs/firstfarmers.mjs (same projection, same Natural Earth land as the baked tiles).
//
//   bun scripts/clips/kyle-first-farmers/bake-neolithic-front-v2.mjs [--probe <dir>]
//
// Writes generated/components/kyle-first-farmers/neolithicFrontData.ts (field + dots) and
// generated/components/kyle-first-farmers/neolithicLandMask.ts (two inline grayscale PNGs). --probe <dir> also writes
// probe PNGs of the farmed region at a few dates (checks only). The runtime API is neolithicFront.ts.
//
// THE FIELD: arrival date A (cal BC) on a 4 world-px grid over the world.
//   1. A thin-plate spline (lightly smoothed) through the dated anchors of the config (Pinhasi, Fort & Ammerman 2005;
//      Shennan 2018) plus the MODEL CONSTRAINTS below (approximate, never on screen): the earlier source region, the
//      zones that stay forager past the window, and a few dates the spline needs where the table is silent.
//   2. Clamped to [NEVER, 8800], plus fBm noise (+-95 years, 20-120 world px) so the front edge is organic, not a contour plot.
//   3. Depression-filled from the source (priority flood): every point is reached from Anatolia / the Levant along a
//      path of earlier-or-equal dates, so the farmed region for any date is ONE body that only grows (monotone; no
//      orange island ever appears ahead of the front).
//   4. POCKETS (schematic forager refugia that outlast the window) raised to NEVER, with noisy rims; then filled from
//      the never-farmed side (priority flood again): no late hole is left behind the front except the pockets.
//   5. Africa and Iceland are EXCLUDED (A = 0): no field, no dots, no front line (neither is part of this spread).
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";
import { REPO, coastIndex, country, landOf, naturalEarth, polysOf, thinRing } from "../../maps/lib/geo.mjs";
import { loadConfig, makeWorld } from "../../maps/lib/config.mjs";
import CFG_DEFAULT, { ANCHORS } from "../../maps/configs/firstfarmers.mjs";

const args = process.argv.slice(2);
const probeDir = args.includes("--probe") ? args[args.indexOf("--probe") + 1] : null;
const cfg = await loadConfig(join(REPO, "scripts/maps/configs/firstfarmers.mjs"));
const W = makeWorld("europe", cfg.worlds.europe);
const P = W.proj;
const t0 = Date.now();
void CFG_DEFAULT;

export const NEVER = 3000; // "still forager at the end of the window" (cut F ends ~3700 BC)

// ---------------------------------------------------------------------------
// MODEL CONSTRAINTS (approximate; they shape the field where the dated table is silent)
// ---------------------------------------------------------------------------
const CONSTRAINTS = [
  // V2: one round core at Catalhoyuk (a ring ~1.3 deg out at 6950 BC); the east of Anatolia follows later, so the
  // spread runs mostly west (the Fertile Crescent is outside this model)
  { ll: [31.3, 38.0], bc: 6950, why: "core ring W (model)" },
  { ll: [32.9, 39.2], bc: 6950, why: "core ring N (model)" },
  { ll: [34.4, 38.2], bc: 6950, why: "core ring E (model)" },
  { ll: [33.2, 36.6], bc: 6950, why: "core ring S (model)" },
  { ll: [38.8, 39.3], bc: 6450, why: "eastern Anatolia (model: after the core)" },
  { ll: [37.6, 37.7], bc: 6550, why: "SE Anatolia (model: after the core)" },
  { ll: [27.5, 47.3], bc: 5600, why: "Moldova (Cris)" },
  { ll: [16.8, 59.5], bc: 3700, why: "Malaren, central Sweden (TRB)" },
  { ll: [10.6, 59.6], bc: 3750, why: "Oslofjord (TRB)" },
  // zones that stay forager through the window (Finland and northern Scandinavia per the brief; the forest zone and
  // the Pontic steppe east of the farmers)
  { ll: [25.0, 62.0], bc: NEVER, why: "Finland" },
  { ll: [17.0, 64.0], bc: NEVER, why: "N Sweden" },
  { ll: [14.0, 67.5], bc: NEVER, why: "N Norway" },
  { ll: [8.0, 62.0], bc: NEVER, why: "W Norway fjells" },
  { ll: [33.0, 63.0], bc: NEVER, why: "Karelia" },
  { ll: [34.0, 57.0], bc: NEVER, why: "NW Russia forest" },
  { ll: [42.0, 54.5], bc: NEVER, why: "central Russia forest" },
  { ll: [28.5, 53.5], bc: NEVER, why: "Belarus forest" },
  { ll: [35.0, 47.8], bc: NEVER, why: "Pontic steppe" },
  { ll: [33.3, 46.9], bc: NEVER, why: "lower Dnieper steppe" },
  { ll: [34.2, 45.2], bc: NEVER, why: "Crimea" },
  { ll: [39.5, 48.3], bc: NEVER, why: "Don steppe" },
  { ll: [41.5, 46.2], bc: NEVER, why: "Kuban / Manych steppe" },
  { ll: [45.0, 48.5], bc: NEVER, why: "lower Volga steppe" },
  { ll: [27.0, 58.5], bc: NEVER, why: "Estonia / Latvia" },
];
// POCKETS: forager groups that outlast the window inside the farmed land, where the terrain favoured them: the high
// Alpine arc, the eastern Carpathians and the Atlantic fringe of Brittany (schematic; foragers lived beside farmers
// into the 4th millennium BC, e.g. Blatterhohle, Bollongino et al. 2013, Science 342: 479; the Breton Mesolithic of
// Teviec / Hoedic). Each is a few overlapping blobs with a noisy rim; r in world px (k 1 = screen px at the wide).
const POCKETS = [
  // each a few overlapping blobs (lon, lat, radius in world px), with a strongly noisy rim
  { blobs: [[7.4, 46.0, 32], [9.6, 46.5, 37], [11.9, 46.9, 36], [13.8, 47.2, 27]], why: "the Alpine arc" },
  { blobs: [[22.9, 48.7, 30], [24.5, 47.7, 37], [25.5, 46.5, 29]], why: "the eastern Carpathians" },
  { blobs: [[-3.4, 48.2, 36], [-2.2, 47.9, 26]], why: "the Atlantic fringe of Brittany (Teviec / Hoedic)" },
];
const EXCLUDE = ["Morocco", "Algeria", "Tunisia", "Libya", "Egypt", "W. Sahara", "Mauritania", "Mali", "Niger", "Chad", "Sudan", "Iceland",
  "Syria", "Lebanon", "Israel", "Palestine", "Jordan", "Iraq", "Iran", "Saudi Arabia", "Kuwait", "Cyprus", "N. Cyprus", "Georgia", "Armenia", "Azerbaijan"];

// ---------------------------------------------------------------------------
// grid
// ---------------------------------------------------------------------------
const CELL = 4;
const GX0 = -200;
const GY0 = 80;
const COLS = 420; // x -200 .. 1480
const ROWS = 390; // y 80 .. 1640
const N = COLS * ROWS;
const cx = (i) => GX0 + (i + 0.5) * CELL;
const cy = (j) => GY0 + (j + 0.5) * CELL;

// excluded land (Africa, Iceland) as a point-in-polygon index
const exPolys = [];
for (const name of EXCLUDE) {
  for (const rings of polysOf(country(name).geometry)) {
    const pr = rings.map((r) => thinRing(r.map((q) => P(q)), 0.5)).filter((r) => r.length >= 3);
    if (!pr.length) continue;
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of pr[0]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
    exPolys.push({ rings: pr, box: [x0, y0, x1, y1] });
  }
}
const exIdx = coastIndex(exPolys);
// every other country in the grid's box (Natural Earth land a little outside a country polygon near Africa is
// excluded too, unless another country claims it: Tarifa stays Spanish)
const inPolys = [];
{
  const bx = { x0: -260, y0: 20, x1: 1540, y1: 1700 };
  for (const f of naturalEarth().countries) {
    if (EXCLUDE.includes(f.properties.name)) continue;
    for (const rings of polysOf(f.geometry)) {
      const pr = rings.map((r) => thinRing(r.map((q) => P(q)), 0.5)).filter((r) => r.length >= 3);
      if (!pr.length) continue;
      let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const [x, y] of pr[0]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      if (x1 < bx.x0 || x0 > bx.x1 || y1 < bx.y0 || y0 > bx.y1) continue;
      inPolys.push({ rings: pr, box: [x0, y0, x1, y1] });
    }
  }
}
const inIdx = coastIndex(inPolys);
const excludedAt = (x, y) => exIdx.isLand(x, y) || (!inIdx.isLand(x, y) && exIdx.coastDist(x, y, 10) < 7);
const land = landOf(W);
const coast = coastIndex(land);
console.log(`geometry ${Date.now() - t0} ms`);

// ---------------------------------------------------------------------------
// 1. thin-plate spline
// ---------------------------------------------------------------------------
const pts = [...Object.values(ANCHORS).map((a) => ({ p: P(a.ll), v: a.bc })), ...CONSTRAINTS.map((c) => ({ p: P(c.ll), v: c.bc }))];
const S = 1 / 1000; // spline coordinates in thousands of world px
const phi = (r) => (r < 1e-9 ? 0 : r * r * Math.log(r));
const n = pts.length;
const LAMBDA = 0.002;
const M = n + 3;
const A = Array.from({ length: M }, () => new Float64Array(M + 1));
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) A[i][j] = phi(Math.hypot(pts[i].p[0] - pts[j].p[0], pts[i].p[1] - pts[j].p[1]) * S) + (i === j ? LAMBDA : 0);
  A[i][n] = 1;
  A[i][n + 1] = pts[i].p[0] * S;
  A[i][n + 2] = pts[i].p[1] * S;
  A[n][i] = 1;
  A[n + 1][i] = pts[i].p[0] * S;
  A[n + 2][i] = pts[i].p[1] * S;
  A[i][M] = pts[i].v;
}
for (let c = 0; c < M; c++) {
  let piv = c;
  for (let r = c + 1; r < M; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
  [A[c], A[piv]] = [A[piv], A[c]];
  for (let r = 0; r < M; r++) {
    if (r === c) continue;
    const f = A[r][c] / A[c][c];
    if (f) for (let k = c; k <= M; k++) A[r][k] -= f * A[c][k];
  }
}
const wts = A.map((row, i) => row[M] / row[i]);
const tps = (x, y) => {
  let v = wts[n] + wts[n + 1] * x * S + wts[n + 2] * y * S;
  for (let i = 0; i < n; i++) v += wts[i] * phi(Math.hypot(x - pts[i].p[0], y - pts[i].p[1]) * S);
  return v;
};
const fit = pts.map((q) => Math.abs(tps(q.p[0], q.p[1]) - q.v));
console.log(`tps: ${n} points, worst misfit ${Math.max(...fit).toFixed(0)} years`);

// ---------------------------------------------------------------------------
// 2. clamp + noise (value-noise fBm, deterministic)
// ---------------------------------------------------------------------------
const hash2 = (i, j, s) => {
  let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const vnoise = (x, y, s) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const u = fx * fx * (3 - 2 * fx);
  const w = fy * fy * (3 - 2 * fy);
  const a = hash2(i, j, s);
  const b = hash2(i + 1, j, s);
  const c = hash2(i, j + 1, s);
  const d = hash2(i + 1, j + 1, s);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w - 0.5;
};
const fbm = (x, y, s) => vnoise(x / 120, y / 120, s) + 0.55 * vnoise(x / 48, y / 48, s + 7) + 0.3 * vnoise(x / 19, y / 19, s + 13);
const NOISE_YEARS = 95 / 0.6;
const EXCL = new Uint8Array(N);
const F = new Float64Array(N);
for (let j = 0; j < ROWS; j++)
  for (let i = 0; i < COLS; i++) {
    const x = cx(i);
    const y = cy(j);
    const k = j * COLS + i;
    EXCL[k] = excludedAt(x, y) ? 1 : 0;
    F[k] = Math.max(NEVER, Math.min(7100, tps(x, y) + NOISE_YEARS * fbm(x, y, 3)));
  }
console.log(`field ${Date.now() - t0} ms`);

// ---------------------------------------------------------------------------
// 3. priority floods (Barnes-style) on the 4-neighbour grid, excluded land a barrier, the sea open.
//   flood(seeds, +1): from the EARLIEST cells outward (max-heap): a cell is lowered to its flooding neighbour's date
//     at most, so no early island stays ahead of the front (the farmed region is one body at every date).
//   flood(seeds, -1): from the never-farmed side (min-heap): a cell is raised to its flooding neighbour's date at
//     least, so no late hole is left behind the front (only the deliberate pockets stay), run after the pockets.
// ---------------------------------------------------------------------------
const EPS = 2.5;
const flood = (isSeed, dir) => {
  const heap = [];
  const better = (x, y) => (dir > 0 ? x[0] > y[0] : x[0] < y[0]);
  const push = (k, v) => {
    heap.push([v, k]);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!better(heap[i], heap[p])) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && better(heap[l], heap[m])) m = l;
        if (r < heap.length && better(heap[r], heap[m])) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const seen = new Uint8Array(N);
  for (let k = 0; k < N; k++) if (EXCL[k]) seen[k] = 1;
  for (let k = 0; k < N; k++)
    if (!EXCL[k] && isSeed(k)) {
      seen[k] = 1;
      push(k, F[k]);
    }
  let changed = 0;
  while (heap.length) {
    const [v, k] = pop();
    const i = k % COLS;
    const j = (k - i) / COLS;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const a = i + di;
      const b = j + dj;
      if (a < 0 || b < 0 || a >= COLS || b >= ROWS) continue;
      const q = b * COLS + a;
      if (seen[q]) continue;
      seen[q] = 1;
      // epsilon fill: a filled cell is set a little past its flooding neighbour (EPS years a cell), so a filled
      // basin has a gentle slope from where it spills: the front grows into it instead of flipping a flat in one frame
      if (dir > 0 ? F[q] > v - EPS : F[q] < v + EPS) {
        F[q] = dir > 0 ? v - EPS : v + EPS;
        changed++;
      }
      push(q, F[q]);
    }
  }
  return changed;
};
const CORE = P(ANCHORS.catalhoyuk.ll);
const nearCore = (k) => {
  const i = k % COLS;
  const j = (k - i) / COLS;
  return Math.hypot(cx(i) - CORE[0], cy(j) - CORE[1]) < 26;
};
console.log(`flood (early islands): ${flood((k) => nearCore(k), 1)} cells lowered, ${Date.now() - t0} ms`);
// Crete: settled by sea from Anatolia by ~7000 BC (aceramic Knossos), before the mainland front: already farmed when
// the spread begins (off frame at the opening), the one island the flood leaves early
{
  let n = 0;
  for (let j = 0; j < ROWS; j++)
    for (let i = 0; i < COLS; i++) {
      const [lon, lat] = P.invert([cx(i), cy(j)]);
      if (lon > 23.2 && lon < 26.6 && lat > 34.6 && lat < 35.85) {
        F[j * COLS + i] = 7060;
        n++;
      }
    }
  console.log(`Crete: ${n} cells at 7060 BC`);
}

// ---------------------------------------------------------------------------
// 4. pockets, 5. exclusion
// ---------------------------------------------------------------------------
const POCKET_PX = POCKETS.map((q) => ({ ...q, blobs: q.blobs.map(([lon, lat, r]) => [...P([lon, lat]), r]) }));
/** how deep (x, y) is inside a pocket: < 1 inside (0 at a blob's centre); irregular rim (noise +-25 % and +-12 %) */
const pocketDepth = (x, y) => {
  let best = Infinity;
  const wob = 1 + 0.5 * vnoise(x / 30, y / 30, 31) + 0.25 * vnoise(x / 12, y / 12, 37);
  for (const q of POCKET_PX) for (const [bx, by, r] of q.blobs) best = Math.min(best, Math.hypot(x - bx, y - by) / (r * wob));
  return best;
};
const pocketAt = (x, y) => pocketDepth(x, y) <= 1;
export const POCKET = NEVER - 1; // a pocket clearing: never farmed, and no front line drawn round it
const FIELD = new Uint16Array(N);
const finalize = () => {
  const border = (k) => {
    const i = k % COLS;
    const j = (k - i) / COLS;
    return i === 0 || j === 0 || i === COLS - 1 || j === ROWS - 1;
  };
  const nearEx = (k) => {
    const i = k % COLS;
    const j = (k - i) / COLS;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const a = i + di;
      const b = j + dj;
      if (a >= 0 && b >= 0 && a < COLS && b < ROWS && EXCL[b * COLS + a]) return true;
    }
    return false;
  };
  console.log(`flood (late holes): ${flood((k) => F[k] <= NEVER + 1 || border(k) || nearEx(k), -1)} cells raised, ${Date.now() - t0} ms`);
  for (let k = 0; k < N; k++) FIELD[k] = EXCL[k] ? 0 : Math.round(F[k]);
};
finalize();
const fieldAt = (x, y) => {
  const fx = (x - GX0) / CELL - 0.5;
  const fy = (y - GY0) / CELL - 0.5;
  const i = Math.max(0, Math.min(COLS - 2, Math.floor(fx)));
  const j = Math.max(0, Math.min(ROWS - 2, Math.floor(fy)));
  const u = Math.max(0, Math.min(1, fx - i));
  const w = Math.max(0, Math.min(1, fy - j));
  const g = (a, b) => FIELD[b * COLS + a];
  if (!g(i, j) || !g(i + 1, j) || !g(i, j + 1) || !g(i + 1, j + 1)) return 0;
  return (g(i, j) * (1 - u) + g(i + 1, j) * u) * (1 - w) + (g(i, j + 1) * (1 - u) + g(i + 1, j + 1) * u) * w;
};

// ---------------------------------------------------------------------------
// DOTS (blue noise; world px). Foragers: cream, spread thin over all the land of the model. Farmers: orange, several
// times denser, only where the land is ever farmed (born after the front passes, out of an earlier dot: runtime).
// ---------------------------------------------------------------------------
const DOT_X1 = 1240; // no dots far east of the cuts' views (central Anatolia is x ~1000)
const DOT_Y1 = 1500;
const onLand = (x, y, m) => x < DOT_X1 && y < DOT_Y1 && coast.isLand(x, y) && coast.coastDist(x, y, m + 2) > m && fieldAt(x, y) > 0;
const mulberry = (seed) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** Bridson Poisson-disc in a box, with pre-placed points that also keep the spacing (they are not returned). Used only
 *  to COUNT a field at a nominal spacing: its fill is too regular (hex rows) to show; the dots are scatter()ed */
const poisson = ({ inside, box, spacing, seed, pre = [] }) => {
  const rnd = mulberry(seed);
  const [x0, y0, x1, y1] = box;
  const cs = spacing / Math.SQRT2;
  const gw = Math.ceil((x1 - x0) / cs);
  const gh = Math.ceil((y1 - y0) / cs);
  const grid = new Int32Array(gw * gh).fill(-1);
  const all = [];
  const out = [];
  const active = [];
  const gi = (x, y) => Math.floor((y - y0) / cs) * gw + Math.floor((x - x0) / cs);
  const ok = (x, y) => {
    if (x < x0 || x >= x1 || y < y0 || y >= y1 || !inside(x, y)) return false;
    const gx = Math.floor((x - x0) / cs);
    const gy = Math.floor((y - y0) / cs);
    for (let b = Math.max(0, gy - 2); b <= Math.min(gh - 1, gy + 2); b++)
      for (let a = Math.max(0, gx - 2); a <= Math.min(gw - 1, gx + 2); a++) {
        const q = grid[b * gw + a];
        if (q >= 0 && Math.hypot(all[q][0] - x, all[q][1] - y) < spacing) return false;
      }
    return true;
  };
  for (const p of pre) {
    if (p[0] < x0 || p[0] >= x1 || p[1] < y0 || p[1] >= y1) continue;
    all.push(p);
    grid[gi(p[0], p[1])] = all.length - 1;
  }
  const put = (p) => {
    all.push(p);
    out.push(p);
    active.push(all.length - 1);
    grid[gi(p[0], p[1])] = all.length - 1;
  };
  for (let y = y0 + spacing / 2; y < y1; y += spacing * 3)
    for (let x = x0 + spacing / 2; x < x1; x += spacing * 3) {
      const jx = x + (rnd() - 0.5) * spacing;
      const jy = y + (rnd() - 0.5) * spacing;
      if (!ok(jx, jy)) continue;
      put([jx, jy]);
      while (active.length) {
        const ai = Math.floor(rnd() * active.length);
        const p = all[active[ai]];
        let found = false;
        for (let t = 0; t < 26; t++) {
          const a = rnd() * Math.PI * 2;
          const r = spacing * (1 + rnd());
          const qx = p[0] + Math.cos(a) * r;
          const qy = p[1] + Math.sin(a) * r;
          if (ok(qx, qy)) {
            put([qx, qy]);
            found = true;
            break;
          }
        }
        if (!found) active.splice(ai, 1);
      }
    }
  return out;
};
/** random sequential dart throwing (true blue noise, no lattice rows): uniform candidates over the box, kept when
 *  >= dmin from every kept and pre-placed point, until `target` points (the count a Poisson-disc field of the same
 *  nominal spacing has, so densities stay) */
const scatter = ({ inside, box, dmin, target, seed, pre = [] }) => {
  const rnd = mulberry(seed);
  const [x0, y0, x1, y1] = box;
  const cs = dmin;
  const gw = Math.ceil((x1 - x0) / cs);
  const gh = Math.ceil((y1 - y0) / cs);
  const grid = new Map();
  const add = (p) => {
    const key = Math.floor((p[1] - y0) / cs) * gw + Math.floor((p[0] - x0) / cs);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(p);
  };
  for (const p of pre) add(p);
  const out = [];
  let fails = 0;
  while (out.length < target && fails < 400000) {
    const x = x0 + rnd() * (x1 - x0);
    const y = y0 + rnd() * (y1 - y0);
    const gx = Math.floor((x - x0) / cs);
    const gy = Math.floor((y - y0) / cs);
    let ok = true;
    for (let b = gy - 1; b <= gy + 1 && ok; b++)
      for (let a = gx - 1; a <= gx + 1 && ok; a++) for (const q of grid.get(b * gw + a) ?? []) if (Math.hypot(q[0] - x, q[1] - y) < dmin) ok = false;
    if (!ok || !inside(x, y)) {
      fails++;
      continue;
    }
    out.push([x, y]);
    add([x, y]);
  }
  void gh;
  return out;
};
const BOX = [GX0 + 4, GY0 + 4, DOT_X1, DOT_Y1];
const DMIN = 0.68; // dart-throwing minimum distance, a fraction of the nominal spacing
const S_F = 19; // forager spacing (world px; V2: denser so the dots visibly meet at the front)
const S_P = 11; // forager spacing inside a pocket: a crowd of distinct dots
const S_O = 8; // farmer spacing (V2: dense enough behind the front that the farmers clearly outnumber)
const nForager = poisson({ inside: (x, y) => onLand(x, y, 4), box: BOX, spacing: S_F, seed: 11 }).length;
const forager0 = scatter({ inside: (x, y) => onLand(x, y, 4), box: BOX, dmin: DMIN * S_F, target: nForager, seed: 11 });
// pocket members: the foragers already inside a pocket (ordinary density) + SLOTS for refugees (a crowd at the end)
const residents = forager0.filter(([x, y]) => pocketDepth(x, y) < 0.9 && y <= 1016);
const nSlots = poisson({ inside: (x, y) => onLand(x, y, 4) && pocketDepth(x, y) < 0.8 && y <= 1016, box: BOX, spacing: S_P, seed: 5, pre: residents }).length;
const SLOTS = scatter({ inside: (x, y) => onLand(x, y, 4) && pocketDepth(x, y) < 0.8 && y <= 1016, box: BOX, dmin: DMIN * S_P, target: nSlots, seed: 5, pre: residents });
// the clearings: a smooth blob round the pocket's members (soft-min of their distances, minus POCKET_R): never farmed.
// The exported FIELD keeps the values under them; the runtime blends the same blob in (organic outline, no grid steps)
const POCKET_R = 13;
const POCKET_SM = 5;
// (members south of y 1016 are left out: the Alpine ring then stays above the first caption band in the Europe wide)
const MEMBERS = [...residents, ...SLOTS].filter(([, y]) => y <= 1016);
const pocketSD = (x, y) => {
  let acc = 0;
  for (const [mx, my] of MEMBERS) {
    const d = Math.hypot(mx - x, my - y);
    if (d < 80) acc += Math.exp(-d / POCKET_SM);
  }
  return acc > 0 ? -POCKET_SM * Math.log(acc) - POCKET_R : 1e9;
};
const PRE_POCKET = new Map();
for (let j = 0; j < ROWS; j++)
  for (let i = 0; i < COLS; i++) {
    const x = cx(i);
    const y = cy(j);
    if (pocketDepth(x, y) > 1.6) continue;
    if (pocketSD(x, y) < 0) {
      PRE_POCKET.set(j * COLS + i, F[j * COLS + i]);
      F[j * COLS + i] = POCKET;
    }
  }
finalize();
// TRANSIENT HOLES: a stretch of land the front surrounds before it reaches it (reached round by land, or across the
// sea) would show as a cream "pocket" that opens and then fills. Sweep the dates; any unfarmed land component that
// touches no never-farmed / pocket / excluded / border cell, borders farmed land and is mostly land-locked is farmed on
// the step it is enclosed (a step is 4 years, under one frame anywhere in the cut)
{
  const land = new Uint8Array(N);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) land[j * COLS + i] = coast.isLand(cx(i), cy(j)) ? 1 : 0;
  const lab = new Int32Array(N);
  let filled = 0;
  for (let T = 7040; T >= 3560; T -= 4) {
    lab.fill(0);
    let id = 0;
    for (let k0 = 0; k0 < N; k0++) {
      if (!land[k0] || lab[k0] || EXCL[k0] || FIELD[k0] >= T) continue;
      id++;
      const stack = [k0];
      lab[k0] = id;
      const cells = [];
      let open = false;
      let farmedNb = 0;
      let seaNb = 0;
      while (stack.length) {
        const k = stack.pop();
        cells.push(k);
        if (FIELD[k] <= NEVER + 1) open = true;
        const i = k % COLS;
        const j = (k - i) / COLS;
        if (i === 0 || j === 0 || i === COLS - 1 || j === ROWS - 1) open = true;
        for (const [di, dj] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const a = i + di;
          const b = j + dj;
          if (a < 0 || b < 0 || a >= COLS || b >= ROWS) continue;
          const q = b * COLS + a;
          if (EXCL[q]) open = true;
          if (!land[q]) {
            seaNb++;
            continue;
          }
          if (FIELD[q] >= T) {
            farmedNb++;
            continue;
          }
          if (!lab[q]) {
            lab[q] = id;
            stack.push(q);
          }
        }
      }
      if (open || farmedNb === 0 || seaNb > 3 * farmedNb || cells.length > 1500) continue;
      for (const k of cells) FIELD[k] = T + 1;
      filled += cells.length;
    }
  }
  console.log(`transient holes: ${filled} cells farmed on enclosure, ${Date.now() - t0} ms`);
}
const foragers = forager0.map(([x, y]) => ({ x, y, A: fieldAt(x, y) }));

// fates: 0 = survives (never reached), 1 = absorbed (turns orange as the front touches it), 2 = gives way (slides
// ahead into a neighbour that the front reaches later, and is gone inside it: fewer foragers ahead of the front)
const MERGE_YEARS = 240; // the slide starts this long before the front reaches the dot ...
const MERGE_ARRIVE = 40; // ... and is done this long before
const fr = mulberry(77);
foragers.forEach((d, i) => {
  d.i = i;
  d.fate = d.A < 3600 ? 0 : fr() < 0.6 ? 1 : 2; // (POCKET residents have A = POCKET < 3600: they survive)
  d.to = -1;
});
// a gives-way dot needs a target ahead (reached >= MERGE_YEARS later, so it is still standing when the dot arrives),
// near, and over land (no slide across open sea)
const overLand = (a, b) => {
  for (let s = 1; s < 8; s++) {
    const x = a.x + ((b.x - a.x) * s) / 8;
    const y = a.y + ((b.y - a.y) * s) / 8;
    if (!coast.isLand(x, y)) return false;
  }
  return true;
};
for (const d of foragers) {
  if (d.fate !== 2) continue;
  let best = null;
  let bd = Infinity;
  for (const e of foragers) {
    if (e === d || e.A > d.A - MERGE_YEARS) continue;
    const dd = Math.hypot(e.x - d.x, e.y - d.y);
    if (dd < 2.7 * S_F && dd < bd && overLand(d, e)) {
      bd = dd;
      best = e;
    }
  }
  if (best) d.to = best.i;
  else d.fate = 1;
}
// refugees (fate 3): the nearest unclaimed foragers to each slot, from outside the pocket and still to be reached,
// flee into it as the front comes (to = the slot index)
{
  const taken = new Set();
  const order = SLOTS.map((q, si) => ({ q, si })).sort((a, b) => fieldAt(b.q[0] + 30, b.q[1]) - fieldAt(a.q[0] + 30, a.q[1]));
  for (const { q, si } of order) {
    let best = null;
    let bd = 95;
    for (const d of foragers) {
      if (taken.has(d) || d.fate === 0 || d.A < 3700) continue;
      const dd = Math.hypot(d.x - q[0], d.y - q[1]);
      if (dd < bd && overLand(d, { x: q[0], y: q[1] })) [bd, best] = [dd, d];
    }
    if (best) {
      taken.add(best);
      best.fate = 3;
      best.to = si;
    }
  }
  console.log(`refugees: ${taken.size} of ${SLOTS.length} slots filled`);
}
const absorbed = foragers.filter((d) => d.fate === 1);
const survivors = foragers.filter((d) => d.fate === 0);
console.log(`foragers: ${foragers.length} (${survivors.length} survive, ${absorbed.length} absorbed, ${foragers.length - survivors.length - absorbed.length} give way), ${Date.now() - t0} ms`);

const farmable = (x, y) => onLand(x, y, 3.5) && fieldAt(x, y) >= 3600;
const nFarm = poisson({ inside: farmable, box: BOX, spacing: S_O, seed: 23, pre: [...absorbed, ...survivors].map((d) => [d.x, d.y]) }).length;
const farm0 = scatter({ inside: farmable, box: BOX, dmin: DMIN * S_O, target: nFarm, seed: 23, pre: [...absorbed, ...survivors].map((d) => [d.x, d.y]) });
const br = mulberry(91);
// each farmer dot: its arrival date A and a hash u (0..999): the cut decides when after the front it is born (its
// population clock, in frames) and from which earlier dot (its parent); see neolithicFront.ts makePopulation
const farmers = farm0.map(([x, y]) => ({ x, y, A: fieldAt(x, y), u: Math.floor(br() * 1000) }));
console.log(`farmers: ${farmers.length}, ${Date.now() - t0} ms`);

// ---------------------------------------------------------------------------
// LAND MASK: two grayscale PNGs (land white), inlined: the whole grid at 1.5 texels / world px, the Aegean at 4.2
// ---------------------------------------------------------------------------
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let k = 0; k < 256; k++) {
    let c = k;
    for (let b = 0; b < 8; b++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[k] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, c]);
};
const grayPng = (rgba, w, h) => {
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0;
    for (let x = 0; x < w; x++) raw[y * (w + 1) + 1 + x] = rgba[(y * w + x) * 4];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
};
const n3 = (v) => Math.round(v * 1000) / 1000;
const landMask = (rect, s) => {
  let d = "";
  for (const poly of land) {
    const b = poly.box;
    if (b[2] < rect.x0 || b[0] > rect.x1 || b[3] < rect.y0 || b[1] > rect.y1) continue;
    for (const ring of poly.rings) d += `M${ring.map(([x, y]) => `${n3(x)},${n3(y)}`).join("L")}Z`;
  }
  const w = Math.round((rect.x1 - rect.x0) * s);
  const h = Math.round((rect.y1 - rect.y0) * s);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${rect.x0} ${rect.y0} ${w / s} ${h / s}"><rect x="${rect.x0 - 10}" y="${rect.y0 - 10}" width="${rect.x1 - rect.x0 + 20}" height="${rect.y1 - rect.y0 + 20}" fill="#000"/><path d="${d}" fill="#fff" fill-rule="evenodd"/></svg>`;
  const img = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render();
  const png = grayPng(img.pixels, w, h);
  return { x: rect.x0, y: rect.y0, w: n3(w / s), h: n3(h / s), png };
};
const MASKS = [landMask({ x0: GX0, y0: GY0, x1: GX0 + COLS * CELL, y1: GY0 + ROWS * CELL }, 1.5), landMask({ x0: 600, y0: 1050, x1: 1060, y1: 1420 }, 4.2)];
console.log(`land masks: ${MASKS.map((m) => `${(m.png.length / 1024).toFixed(0)} KB`).join(", ")}, ${Date.now() - t0} ms`);

// ---------------------------------------------------------------------------
// write
// ---------------------------------------------------------------------------
const r1 = (v) => Math.round(v * 10) / 10;
const FIELD_OUT = new Uint16Array(FIELD);
for (const [k, v] of PRE_POCKET) FIELD_OUT[k] = Math.round(v);
const fieldB64 = Buffer.from(FIELD_OUT.buffer).toString("base64");
const bits = new Uint8Array(Math.ceil(N / 8));
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (coast.isLand(cx(i), cy(j))) bits[(j * COLS + i) >> 3] |= 1 << ((j * COLS + i) & 7);
const landBits = Buffer.from(bits).toString("base64");
const gen = "scripts/clips/kyle-first-farmers/bake-neolithic-front-v2.mjs";
const dataTs = `// Generated by ${gen} — do not edit by hand.
// The first farmers' FRONT MODEL over Neolithic Europe (world px of firstFarmersEuropeMapData.ts). Runtime API:
// neolithicFront.ts. FIELD: arrival date of farming, cal BC, Uint16 little-endian on a ${CELL} world-px grid (cell (i, j)
// centred on x0 + (i + 0.5) cell, y0 + (j + 0.5) cell); 0 = excluded (Africa, Iceland: not part of this spread);
// ${NEVER} = still forager through the window (Finland, northern Scandinavia, the forest zone, the steppe, the pockets).
// The dated anchors and the model constraints are listed in the bake script's header.
export const FIELD = { x0: ${GX0}, y0: ${GY0}, cell: ${CELL}, cols: ${COLS}, rows: ${ROWS}, never: ${NEVER} };
export const FIELD_B64 = ${JSON.stringify(fieldB64)};
/** pockets: forager groups that outlast the window inside the farmed land (schematic): overlapping blobs [x, y, r] (world px) */
export const POCKETS: { blobs: [number, number, number][] }[] = ${JSON.stringify(POCKET_PX.map((q) => ({ blobs: q.blobs.map(([x, y, r]) => [r1(x), r1(y), r]) })))};
/** forager (cream) dots, flat: x, y, A (arrival BC at the dot), fate (0 survives, 1 absorbed, 2 gives way, 3 flees into a pocket), to (fate 2: target forager index; fate 3: SLOTS index; else -1) */
export const FORAGERS = ${JSON.stringify(foragers.flatMap((d) => [r1(d.x), r1(d.y), Math.round(d.A), d.fate, d.to]))};
/** farmer (orange) dots, flat: x, y, A (arrival BC at the dot), u (hash 0..999: its birth lag and order) */
export const FARMERS = ${JSON.stringify(farmers.flatMap((d) => [r1(d.x), r1(d.y), Math.round(d.A), d.u]))};
/** land per FIELD cell (cell centre on Natural Earth land), 1 bit per cell, row-major, LSB first */
export const LAND_B64 = ${JSON.stringify(landBits)};
export const DOT_SPACING = { forager: ${S_F}, pocket: ${S_P}, farmer: ${S_O} };
/** refugee places inside the pockets, flat x, y (world px) */
export const SLOTS = ${JSON.stringify(SLOTS.flatMap(([x, y]) => [r1(x), r1(y)]))};
export const POCKET = ${POCKET};
/** the pockets' crowds (residents + refugee slots), flat x, y: the runtime clearing is soft-min(dist, POCKET_SM) - POCKET_R < 0 */
export const POCKET_MEMBERS = ${JSON.stringify(MEMBERS.flatMap(([x, y]) => [r1(x), r1(y)]))};
export const POCKET_R = ${POCKET_R};
export const POCKET_SM = ${POCKET_SM};
export const MERGE_YEARS = ${MERGE_YEARS};
export const MERGE_ARRIVE = ${MERGE_ARRIVE};
`;
const maskTs = `// Generated by ${gen} — do not edit by hand.
// The land of firstFarmersEuropeMapData.ts as grayscale masks (land white) for clipping overlays to the coast:
// the whole front grid at 1.5 texels per world px, and the Aegean at 4.2. Inline data URIs (an <image href> to a
// file races frame capture inside an SVG, CRAFT.md). x, y, w, h in world px.
export const LAND_MASKS: { x: number; y: number; w: number; h: number; href: string }[] = ${JSON.stringify(MASKS.map((m) => ({ x: m.x, y: m.y, w: m.w, h: m.h, href: `data:image/png;base64,${m.png.toString("base64")}` })))};
`;
const dir = join(REPO, cfg.dataDir);
void maskTs;
writeFileSync(join(dir, "neolithicFrontDataV2.ts"), dataTs);
console.log(`Wrote neolithicFrontDataV2.ts (${(dataTs.length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`);

// ---------------------------------------------------------------------------
// probes: the farmed region (orange) over the land at a few dates, with the anchors (checks only)
// ---------------------------------------------------------------------------
if (probeDir) {
  mkdirSync(probeDir, { recursive: true });
  const dates = [6600, 6100, 5700, 5300, 5000, 4500, 4000, 3800, 3650];
  for (const T of dates) {
    const w = COLS;
    const h = ROWS;
    const img = Buffer.alloc(w * h * 3);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const k = j * COLS + i;
        const L = coast.isLand(cx(i), cy(j));
        const v = FIELD[k];
        let c = L ? [63, 52, 40] : [27, 34, 38];
        if (v && v >= T) c = L ? [255, 176, 0] : [90, 70, 30];
        if (!v && L) c = [40, 40, 40];
        img.set(c, k * 3);
      }
    for (const a of [...Object.values(ANCHORS).map((q) => q.ll), ...CONSTRAINTS.map((q) => q.ll)]) {
      const [x, y] = P(a);
      const i = Math.round((x - GX0) / CELL);
      const j = Math.round((y - GY0) / CELL);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (i + di >= 0 && i + di < w && j + dj >= 0 && j + dj < h) img.set([255, 255, 255], ((j + dj) * w + i + di) * 3);
    }
    const raw = Buffer.alloc((w * 3 + 1) * h);
    for (let y = 0; y < h; y++) img.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    writeFileSync(join(probeDir, `front-${T}.png`), Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  }
  console.log(`probes in ${probeDir}`);
}
