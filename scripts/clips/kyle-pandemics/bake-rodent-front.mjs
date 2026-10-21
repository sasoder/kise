// The disease's FRONT for RodentFromCentralAsia (kyle-pandemics, cut 1): a travel-time field over the map's world
// px, baked once. The front at frame t is the level set field = reach(t) (rodentCamera.ts), so it is monotone by
// construction (it never retreats) and organic: it runs fastest along the steppe corridor, the coasts (shipping:
// the near sea carries it) and the big rivers, slows in the open sea, peters out irregularly into North Africa,
// Arabia and the far north, barely moves east, and a low-frequency noise in the speed gives it tongues.
//
//   bun scripts/clips/kyle-pandemics/bake-rodent-front.mjs
//
// Writes public/kyle-pandemics/rodent/front.f32 (Float32 LE, rows x cols, cell centres) and
// generated/components/kyle-pandemics/rodentFrontData.ts (the grid's box, and each figure site's field value).
// Inputs: rodentMapData.ts (LAND_D, LAKES_D, FIGS, PROJ: the cut's own map), rodentPlace.ts (the pools).
// The river courses below are approximate (a few towns along each) and only steer the speed; nothing draws them.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import { geoConicConformal } from "d3-geo";
import { FIGS, LAKES_D, LAND_D, PROJ } from "../../../generated/components/kyle-pandemics/rodentMapData.ts";
import { MOUTH, RIVULETS } from "../../../generated/components/kyle-pandemics/rodentPlace.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const G = { x0: -5800, y0: -2200, cell: 6, cols: 1284, rows: 800 };
const N = G.cols * G.rows;
const proj = geoConicConformal().parallels(PROJ.parallels).rotate([PROJ.rotate, 0]).scale(PROJ.scale).translate(PROJ.translate);
const t0 = Date.now();
const log = (m) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)} s  ${m}`);

// --- rasters (resvg, one texel per cell) ------------------------------------------------------------------------
const raster = (body) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${G.cols}" height="${G.rows}" viewBox="${G.x0} ${G.y0} ${G.cols * G.cell} ${G.rows * G.cell}"><rect x="${G.x0 - 10}" y="${G.y0 - 10}" width="${G.cols * G.cell + 20}" height="${G.rows * G.cell + 20}" fill="#000"/>${body}</svg>`;
  const px = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().pixels;
  const out = new Uint8Array(N);
  for (let i = 0; i < N; i++) out[i] = px[i * 4];
  return out;
};
const land = raster(`<path d="${LAND_D}" fill="#fff" fill-rule="evenodd"/><path d="${LAKES_D}" fill="#000"/>`);
log("land raster");
const RIVERS = {
  volga: [[47.9, 46.3], [44.5, 48.7], [46.0, 51.5], [50.1, 53.2], [49.1, 55.8], [44.0, 56.3], [39.9, 57.6], [35.9, 56.9]],
  don: [[39.7, 47.2], [41.0, 47.7], [43.4, 48.6], [41.0, 50.0], [39.2, 51.7], [38.5, 53.5]],
  dnieper: [[32.6, 46.6], [35.1, 47.8], [35.0, 48.45], [33.4, 49.07], [30.5, 50.45], [30.3, 53.9], [32.0, 54.8]],
  danube: [[29.6, 45.2], [27.3, 44.1], [25.95, 43.85], [22.87, 44.0], [20.45, 44.8], [19.05, 47.5], [16.37, 48.2], [14.3, 48.3], [12.1, 49.0], [10.0, 48.4]],
  rhine: [[4.5, 51.9], [6.96, 50.94], [7.6, 50.36], [8.27, 50.0], [7.75, 48.58], [7.59, 47.56]],
  rhone: [[4.6, 43.4], [4.8, 43.95], [4.83, 45.76], [6.14, 46.2]],
  syrdarya: [[61.0, 46.1], [65.5, 44.85], [68.25, 43.3], [69.6, 42.3], [71.5, 41.0]],
  ural: [[51.9, 47.1], [51.4, 51.2], [55.1, 51.8]],
};
const riverD = Object.values(RIVERS)
  .map((pts) => `M${pts.map((q) => proj(q).map((v) => v.toFixed(1)).join(",")).join("L")}`)
  .join("");
const river = raster(`<path d="${riverD}" fill="none" stroke="#fff" stroke-width="44" stroke-linejoin="round" stroke-linecap="round"/>`);
log("river raster");

// --- distance (cells) to the other medium: two-pass chamfer --------------------------------------------------------
const chamfer = (isSrc) => {
  const d = new Float32Array(N).fill(1e9);
  for (let i = 0; i < N; i++) if (isSrc(i)) d[i] = 0;
  const A = 1;
  const B = Math.SQRT2;
  for (let y = 0; y < G.rows; y++)
    for (let x = 0; x < G.cols; x++) {
      const i = y * G.cols + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + A);
      if (y > 0) {
        v = Math.min(v, d[i - G.cols] + A);
        if (x > 0) v = Math.min(v, d[i - G.cols - 1] + B);
        if (x < G.cols - 1) v = Math.min(v, d[i - G.cols + 1] + B);
      }
      d[i] = v;
    }
  for (let y = G.rows - 1; y >= 0; y--)
    for (let x = G.cols - 1; x >= 0; x--) {
      const i = y * G.cols + x;
      let v = d[i];
      if (x < G.cols - 1) v = Math.min(v, d[i + 1] + A);
      if (y < G.rows - 1) {
        v = Math.min(v, d[i + G.cols] + A);
        if (x < G.cols - 1) v = Math.min(v, d[i + G.cols + 1] + B);
        if (x > 0) v = Math.min(v, d[i + G.cols - 1] + B);
      }
      d[i] = v;
    }
  return d;
};
const toSea = chamfer((i) => land[i] < 128); // for land cells: cells to the sea
const toLand = chamfer((i) => land[i] >= 128); // for sea cells: cells to land
log("coast distances");

// --- value noise (deterministic) ------------------------------------------------------------------------------------
const hash = (x, y, s) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const vnoise = (x, y, s) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const sstep = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// --- speed ------------------------------------------------------------------------------------------------------------
const speed = new Float32Array(N);
for (let r = 0; r < G.rows; r++)
  for (let c = 0; c < G.cols; c++) {
    const i = r * G.cols + c;
    const x = G.x0 + (c + 0.5) * G.cell;
    const y = G.y0 + (r + 0.5) * G.cell;
    const near = Math.hypot(x - MOUTH[0], y - MOUTH[1]);
    if (near < 170) {
      speed[i] = 1;
      continue;
    }
    const [lon, lat] = proj.invert([x, y]);
    let s;
    if (land[i] >= 128) {
      s = 1;
      const coastCells = toSea[i];
      s *= 1 + 0.45 * (1 - sstep(2, 9, coastCells)); // the coasts
      if (river[i] >= 128) s *= 1.55; // the big rivers
      if (lat > 43 && lat < 54 && lon > 28 && lon < 76) s *= 1 + 0.4 * sstep(43, 46, lat) * (1 - sstep(51, 54, lat)); // the steppe corridor
    } else {
      // the sea carries it near the coasts (ships), the open sea hardly
      s = 1.25 * (1 - sstep(10, 30, toLand[i])) + 0.18;
    }
    // where it hardly went: the east, the deserts of the south, the far north (irregular: the noise below)
    if (lon > 76) s *= 0.12 + 0.88 * (1 - sstep(76, 79, lon));
    // the south: a ragged limit (a noisy latitude) past which it all but stops
    const latS = 34 + 6 * (vnoise(x / 260, y / 260, 23) - 0.5) + 3 * (vnoise(x / 90, y / 90, 29) - 0.5);
    s *= 0.04 + 0.96 * sstep(latS - 2.5, latS + 1, lat);
    s *= 0.35 + 0.65 * (1 - sstep(60, 66, lat));
    // the Russian forest belt: reached late, from the Baltic
    if (lon > 26) s *= 0.5 + 0.5 * (1 - sstep(51, 54, lat));
    // tongues: low-frequency noise in the speed
    const n = 0.5 * vnoise(x / 520, y / 520, 7) + 0.3 * vnoise(x / 190, y / 190, 11) + 0.2 * vnoise(x / 70, y / 70, 13);
    s *= 0.42 + 1.16 * n;
    speed[i] = Math.max(0.02, s);
  }
log("speed");

// --- the travel time (Dijkstra, 16 neighbours) -------------------------------------------------------------------------
const field = new Float64Array(N).fill(1e9);
const settled = new Uint8Array(N);
const heap = { k: new Float64Array(N * 4), v: new Int32Array(N * 4), n: 0 };
const push = (key, val) => {
  if (heap.n >= heap.k.length) {
    const k = new Float64Array(heap.k.length * 2);
    k.set(heap.k);
    const v = new Int32Array(heap.v.length * 2);
    v.set(heap.v);
    heap.k = k;
    heap.v = v;
  }
  let i = heap.n++;
  heap.k[i] = key;
  heap.v[i] = val;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap.k[p] <= heap.k[i]) break;
    const tk = heap.k[p];
    heap.k[p] = heap.k[i];
    heap.k[i] = tk;
    const tv = heap.v[p];
    heap.v[p] = heap.v[i];
    heap.v[i] = tv;
    i = p;
  }
};
const pop = () => {
  const k = heap.k[0];
  const v = heap.v[0];
  heap.n--;
  heap.k[0] = heap.k[heap.n];
  heap.v[0] = heap.v[heap.n];
  let i = 0;
  for (;;) {
    const l = 2 * i + 1;
    const r = l + 1;
    let m = i;
    if (l < heap.n && heap.k[l] < heap.k[m]) m = l;
    if (r < heap.n && heap.k[r] < heap.k[m]) m = r;
    if (m === i) break;
    const tk = heap.k[m];
    heap.k[m] = heap.k[i];
    heap.k[i] = tk;
    const tv = heap.v[m];
    heap.v[m] = heap.v[i];
    heap.v[i] = tv;
    i = m;
  }
  return [k, v];
};
// seeds: every cell within 3 cells of a pool, at its exact distance (speed 1 there)
for (const rv of RIVULETS) {
  const pc = (rv.end[0] - G.x0) / G.cell - 0.5;
  const pr = (rv.end[1] - G.y0) / G.cell - 0.5;
  for (let r = Math.floor(pr) - 3; r <= Math.ceil(pr) + 3; r++)
    for (let c = Math.floor(pc) - 3; c <= Math.ceil(pc) + 3; c++) {
      const i = r * G.cols + c;
      const d = Math.hypot(c - pc, r - pr) * G.cell;
      if (d < field[i]) {
        field[i] = d;
        push(d, i);
      }
    }
}
const NB = [];
for (let dy = -2; dy <= 2; dy++)
  for (let dx = -2; dx <= 2; dx++) {
    if (!dx && !dy) continue;
    if (Math.abs(dx) === 2 && Math.abs(dy) === 2) continue;
    if ((Math.abs(dx) === 2 && dy === 0) || (Math.abs(dy) === 2 && dx === 0)) continue;
    NB.push([dx, dy, Math.hypot(dx, dy) * G.cell]);
  }
let done = 0;
while (heap.n) {
  const [k, i] = pop();
  if (settled[i] || k > field[i]) continue;
  settled[i] = 1;
  done++;
  const c = i % G.cols;
  const r = (i - c) / G.cols;
  for (const [dx, dy, len] of NB) {
    const cc = c + dx;
    const rr = r + dy;
    if (cc < 0 || rr < 0 || cc >= G.cols || rr >= G.rows) continue;
    const j = rr * G.cols + cc;
    // a knight's move samples the speed at its two halves
    const sp = 2 / (1 / speed[i] + 1 / speed[j]);
    const nk = k + len / sp;
    if (!settled[j] && nk < field[j]) {
      field[j] = nk;
      push(nk, j);
    }
  }
}
log(`travel time: ${done} cells settled`);

// --- out ------------------------------------------------------------------------------------------------------------------
const sample = (x, y) => {
  const gx = (x - G.x0) / G.cell - 0.5;
  const gy = (y - G.y0) / G.cell - 0.5;
  const c = Math.max(0, Math.min(G.cols - 2, Math.floor(gx)));
  const r = Math.max(0, Math.min(G.rows - 2, Math.floor(gy)));
  const fx = Math.max(0, Math.min(1, gx - c));
  const fy = Math.max(0, Math.min(1, gy - r));
  const at = (cc, rr) => field[rr * G.cols + cc];
  return (at(c, r) * (1 - fx) + at(c + 1, r) * fx) * (1 - fy) + (at(c, r + 1) * (1 - fx) + at(c + 1, r + 1) * fx) * fy;
};
mkdirSync(join(REPO, "public/kyle-pandemics/rodent"), { recursive: true });
writeFileSync(join(REPO, "public/kyle-pandemics/rodent/front.f32"), Buffer.from(Float32Array.from(field).buffer));
const figS = FIGS.map(([x, y]) => Math.round(sample(x, y) * 100) / 100);
const probe = { kaffa: [35.4, 45.03], constantinople: [28.98, 41.01], messina: [15.55, 38.19], marseille: [5.37, 43.3], paris: [2.35, 48.86], london: [-0.1, 51.5], lisbon: [-9.14, 38.72], bergen: [5.32, 60.39], moscow: [37.6, 55.75], cairo: [31.2, 30.0], baghdad: [44.4, 33.3] };
const probeS = Object.fromEntries(Object.entries(probe).map(([k, ll]) => [k, Math.round(sample(...proj(ll)))]));
log(`probes ${JSON.stringify(probeS)}`);
writeFileSync(
  join(REPO, "generated/components/kyle-pandemics/rodentFrontData.ts"),
  `// Generated by scripts/clips/kyle-pandemics/bake-rodent-front.mjs — do not edit by hand.
// The disease's travel-time field (world px at unit speed) for RodentFromCentralAsia: public/kyle-pandemics/rodent/front.f32,
// Float32 LE, rows x cols, value at cell centres (x0 + (c + 0.5) cell, y0 + (r + 0.5) cell); bilinear between.
export const FRONT_GRID = ${JSON.stringify(G)};
/** the field at each FIGS site (rodentMapData order), bilinear */
export const FIG_S: number[] = ${JSON.stringify(figS)};
/** a few places, for the timing (field values) */
export const PROBE_S: Record<string, number> = ${JSON.stringify(probeS)};
`,
);
log("wrote front.f32 + rodentFrontData.ts");
