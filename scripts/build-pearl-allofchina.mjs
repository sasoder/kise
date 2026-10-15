// Bakes the data of AllOfChina (Pearl Harbor clip, cut C) on the kit's ASIA
// world (scripts/pearl-geo.mjs: same projection, same regions):
//
//   bun scripts/build-pearl-allofchina.mjs
//
// Writes generated/components/allOfChinaData.ts:
//   PLAN_PTS   the plan line: China's outer border from the Great Wall at the
//              sea (Shanhaiguan) clockwise — down the coast, along the south and
//              west borders, back east along the Mongolia border — to where the
//              Manchukuo line meets Mongolia. Manchukuo (already Japan's) closes
//              the ring. Douglas-Peucker simplified so the dashes read cleanly.
//   FIELD      the ARRIVAL-TIME field of the 1937-38 conquest on a world-px grid
//              (uint16 base64). The solid orange is the region { t <= u }: one
//              travelling front whose level sets run from the sources (t = 0) to
//              the stalled FRONT_1938 (t = 1) everywhere at once, so the whole
//              front stalls together. Main body: t = dS / (dS + dF), dS the
//              distance to the Manchukuo line (the Wall) and to the Shanghai
//              landing, dF the distance to the front; beyond the front (free
//              China) t = dS / (dS - dF) > 1, so t is continuous across it and
//              the t = 1 contour IS the front line. The Canton pocket spreads
//              from the Bias Bay landing, Hainan from Haikou; both start late
//              (they fell Oct 1938 / Feb 1939) and finish with the main front.

import { writeFileSync } from "node:fs";
import { WORLDS, regionsOf, dist, union, landOf, coastIndex } from "./pearl-geo.mjs";

const OUT = "generated/components/allOfChinaData.ts";
const W = WORLDS.asia;
const P = W.proj;
const R = regionsOf(W);

// -- helpers ------------------------------------------------------------------
const segDist = (x, y, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2));
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
};
const lineDist = (x, y, line) => {
  let best = Infinity;
  for (let i = 1; i < line.length; i++) best = Math.min(best, segDist(x, y, line[i - 1], line[i]));
  return best;
};
const inRing = (x, y, ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
  }
  return c;
};
const inMP = (x, y, mp) => mp.some((poly) => inRing(x, y, poly[0]) && !poly.slice(1).some((h) => inRing(x, y, h)));
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
const dp = (pts, tol) => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1;
    let bi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = segDist(pts[i][0], pts[i][1], pts[a], pts[b]);
      if (d > best) {
        best = d;
        bi = i;
      }
    }
    if (best > tol) {
      keep[bi] = 1;
      stack.push([a, bi], [bi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
const r2 = (v) => Math.round(v * 100) / 100;

// -- the plan line ---------------------------------------------------------------
const chinaMain = R.china.reduce((m, p) => (Math.abs(ringArea(p[0])) > Math.abs(ringArea(m[0])) ? p : m));
let ring = chinaMain[0].slice();
if (dist(ring[0], ring[ring.length - 1]) < 1e-9) ring.pop();
// clockwise on screen (y down) == positive shoelace area
if (ringArea(ring) < 0) ring.reverse();
// the plan runs over every outline vertex that is NOT Manchukuo's (or Kwantung's):
// the one clockwise run of such vertices, plus the boundary vertex at each end,
// so the dashed line meets Manchukuo exactly at the Wall's sea end and at the
// Mongolian border.
const held = union(R.manchukuo, R.kwantung);
const n = ring.length;
// edge i (ring[i] -> ring[i+1]) is held if a point 0.6 px inland of its middle is
// (the ring is clockwise on screen, so inland is to the right of travel)
const edgeHeld = ring.map((a, i) => {
  const b = ring[(i + 1) % n];
  const l = dist(a, b) || 1e-9;
  const mx = (a[0] + b[0]) / 2 - ((b[1] - a[1]) / l) * 0.6;
  const my = (a[1] + b[1]) / 2 + ((b[0] - a[0]) / l) * 0.6;
  return inMP(mx, my, held);
});
const gzI = (() => {
  const g = P([113.26, 23.13]);
  let bi = 0;
  ring.forEach((q, k) => {
    if (dist(q, g) < dist(ring[bi], g)) bi = k;
  });
  return bi;
})();
// walk back from Guangzhou to the first held edge, then forward to the next one
let s0 = gzI;
while (!edgeHeld[(s0 - 1 + n) % n]) s0 = (s0 - 1 + n) % n;
const arc = [];
for (let k = s0; ; k = (k + 1) % n) {
  arc.push(ring[k]);
  if (edgeHeld[k]) break;
}
const A = { d: Math.min(...[P([119.79, 39.97])].map((q) => dist(q, arc[0]))) };
const B = { d: Math.min(...[P([119.6, 46.4])].map((q) => dist(q, arc[arc.length - 1]))) };
console.log("plan ends vs Laolongtou / the Wall's end (world px):", A.d.toFixed(2), B.d.toFixed(2));
// sanity: the clockwise arc from the Wall must pass Guangzhou's coast, not Harbin
const gz = P([113.26, 23.13]);
const hb = P([126.53, 45.8]);
const near = (pt) => Math.min(...arc.map((q) => dist(q, pt)));
console.log("arc vertices", arc.length, "near Guangzhou", near(gz).toFixed(1), "near Harbin", near(hb).toFixed(1));
if (near(gz) > 30 || near(hb) < 60) throw new Error("plan arc runs the wrong way round");
const PLAN = dp(arc, 1.3);
let planLen = 0;
for (let i = 1; i < PLAN.length; i++) planLen += dist(PLAN[i - 1], PLAN[i]);
console.log("plan simplified", PLAN.length, "pts, length", planLen.toFixed(0), "world px");

// -- the occupied components ---------------------------------------------------------
const occ = R.occupied;
const cls = (poly) => {
  const r = poly[0];
  let sx = 0;
  let sy = 0;
  for (const q of r) {
    sx += q[0];
    sy += q[1];
  }
  const [lon, lat] = P.invert([sx / r.length, sy / r.length]);
  if (lat < 20.6 && lon < 111.5) return "hainan";
  if (lat < 24.5) return "canton";
  return "north";
};
const comps = { north: [], canton: [], hainan: [] };
for (const poly of occ) comps[cls(poly)].push(poly);
console.log("occupied polygons:", Object.fromEntries(Object.entries(comps).map(([k, v]) => [k, v.length])));

// sources and front (world px)
const WALL = R.wallDense.map((q) => P(q));
const SHANGHAI = [
  [121.95, 31.75],
  [121.75, 31.2],
  [121.9, 30.85],
].map((q) => P(q));
const FRONT = R.frontDense.map((q) => P(q));
// the occupied side of the front: the front + a closure far to the east (as the kit's)
const occSide = [...R.frontDense, [123.5, 30.6], [127, 34], [136, 44], [128, 56], [110, 56], [110, 44.0]].map((q) => P(q));
const BIAS_BAY = P([114.62, 22.68]);
const HAIKOU = P([110.33, 20.04]);
const CANTON_START = 0.5;
const HAINAN_START = 0.68;

// grid over the occupied bbox
let [bx0, by0, bx1, by1] = [Infinity, Infinity, -Infinity, -Infinity];
for (const poly of occ)
  for (const [x, y] of poly[0]) [bx0, by0, bx1, by1] = [Math.min(bx0, x), Math.min(by0, y), Math.max(bx1, x), Math.max(by1, y)];
const H = 1.5;
const M = 6;
const x0 = Math.floor(bx0 - M);
const y0 = Math.floor(by0 - M);
const nx = Math.ceil((bx1 + M - x0) / H) + 1;
const ny = Math.ceil((by1 + M - y0) / H) + 1;
console.log("grid", nx, "x", ny, "=", nx * ny, "h", H, "origin", x0, y0);

const maxOf = (mp, seed) => {
  let m = 0;
  for (const poly of mp) for (const q of poly[0]) m = Math.max(m, dist(q, seed));
  return m;
};
const cantonMax = maxOf(comps.canton, BIAS_BAY);
const hainanMax = maxOf(comps.hainan, HAIKOU);

const T = new Float32Array(nx * ny);
const yCanton = P([113, 24.8])[1];
const yHainan = P([110, 21.0])[1];
for (let j = 0; j < ny; j++) {
  const y = y0 + j * H;
  for (let i = 0; i < nx; i++) {
    const x = x0 + i * H;
    let t;
    if (y > yHainan) t = HAINAN_START + (1 - HAINAN_START) * Math.min(1.6, Math.hypot(x - HAIKOU[0], y - HAIKOU[1]) / hainanMax);
    else if (y > yCanton) t = CANTON_START + (1 - CANTON_START) * Math.min(1.6, Math.hypot(x - BIAS_BAY[0], y - BIAS_BAY[1]) / cantonMax);
    else {
      const dS = Math.min(lineDist(x, y, WALL), lineDist(x, y, SHANGHAI));
      const dF = lineDist(x, y, FRONT);
      if (inRing(x, y, occSide)) t = dS / (dS + dF + 1e-6);
      else t = dS - dF > 0.08 * dS ? Math.min(3, dS / (dS - dF)) : 3;
    }
    T[j * nx + i] = t;
  }
}
// quantise: t in [0, 3] -> uint16
const Q = 65535 / 3;
const u16 = new Uint16Array(nx * ny);
for (let k = 0; k < T.length; k++) u16[k] = Math.max(0, Math.min(65535, Math.round(T[k] * Q)));
const b64 = Buffer.from(u16.buffer).toString("base64");


// -- the PLAN's ghost wash (round 2) -------------------------------------------------
// China's outline (the arc above, Manchukuo excluded) split into COAST and LAND-
// BORDER runs: a point 1.2 px outward (left of travel, the ring is clockwise) on
// land = a neighbouring country. The plan's dashed edge is drawn on land borders
// only; the coast is where the wash comes FROM (with the Manchukuo line).
const coast = coastIndex(landOf(W));
const outward = arc.map((a, i) => {
  const b = arc[Math.min(arc.length - 1, i + 1)];
  const a0 = arc[Math.max(0, i - 1)];
  const dx = b[0] - a0[0];
  const dy = b[1] - a0[1];
  const l = Math.hypot(dx, dy) || 1e-9;
  return coast.isLand(a[0] + (dy / l) * 1.2, a[1] - (dx / l) * 1.2);
});
const runsOf = (flag) => {
  const runs = [];
  let cur = [];
  arc.forEach((q, i) => {
    if (outward[i] === flag) cur.push(q);
    else {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    }
  });
  if (cur.length > 1) runs.push(cur);
  return runs;
};
const lenOf = (r) => r.reduce((s, q, i) => (i ? s + dist(r[i - 1], q) : 0), 0);
// (short "land" runs are estuaries where the test point lands on the far bank)
const BORDER_RUNS = runsOf(true)
  .filter((r) => lenOf(r) > 200)
  .map((r) => dp(r, 1.0));
const COAST_RUNS = runsOf(false).map((r) => dp(r, 0.6));
console.log("land-border runs", BORDER_RUNS.length, BORDER_RUNS.map((r) => lenOf(r).toFixed(0)).join(" "), "| coast runs", COAST_RUNS.length);

// China proper (free + occupied), and its grid
const proper = union(R.freeChina, R.occupied);
let [gx0, gy0, gx1, gy1] = [Infinity, Infinity, -Infinity, -Infinity];
for (const poly of proper) for (const [x, y] of poly[0]) [gx0, gy0, gx1, gy1] = [Math.min(gx0, x), Math.min(gy0, y), Math.max(gx1, x), Math.max(gy1, y)];
const GH = 3;
const GX0 = Math.floor(gx0 - 9);
const GY0 = Math.floor(gy0 - 9);
const GNX = Math.ceil((gx1 + 9 - GX0) / GH) + 1;
const GNY = Math.ceil((gy1 + 9 - GY0) / GH) + 1;
// sources of the wash: the Manchukuo line (Wall) + China's coast (+ Hainan's)
const hainanRing = comps.hainan.length ? [dp(comps.hainan[0][0], 0.6)] : [];
const SRC = [WALL, ...COAST_RUNS, ...hainanRing];
// the occupied region's boundary (for the drain)
const OCC_RINGS = occ.map((poly) => dp([...poly[0], poly[0][0]], 0.6));
const minDist = (x, y, lines) => {
  let best = Infinity;
  for (const l of lines) best = Math.min(best, lineDist(x, y, l));
  return best;
};
// a smooth, seeded perturbation (a few long sinusoids, +-1) so the wash's edge
// spreads and drains like ink, not as a ruler-straight wipe; it tapers to 0 at
// the sources so the wash still leaves exactly from the orange
const wobble = (x, y, seed) => {
  let v = 0;
  const W = [
    [150, 0.37, 1.0],
    [88, 1.91, 0.7],
    [46, 2.73, 0.4],
  ];
  W.forEach(([L, a, amp], i) => {
    const c = Math.cos(a + seed);
    const sn = Math.sin(a + seed);
    v += amp * Math.sin((x * c + y * sn) / L + seed * 3.1 + i * 1.7) * Math.cos((-x * sn + y * c) / (L * 1.3) + seed * 1.3 + i);
  });
  return v / 2.15;
};
const WOBBLE_PX = 46;
const taper = (d) => Math.min(1, d / 45);
const dS = new Float32Array(GNX * GNY);
const dO = new Float32Array(GNX * GNY);
let dSmax = 0;
let dOmax = 0;
for (let j = 0; j < GNY; j++) {
  const y = GY0 + j * GH;
  for (let i = 0; i < GNX; i++) {
    const x = GX0 + i * GH;
    const k = j * GNX + i;
    const ds = minDist(x, y, SRC);
    const dO0 = inMP(x, y, occ) ? 0 : minDist(x, y, OCC_RINGS);
    dS[k] = Math.max(0, ds + WOBBLE_PX * taper(ds) * wobble(x, y, 0.4));
    dO[k] = Math.max(0, dO0 + WOBBLE_PX * taper(dO0) * wobble(x, y, 2.2));
    if (inMP(x, y, proper)) {
      dSmax = Math.max(dSmax, dS[k]);
      dOmax = Math.max(dOmax, dO[k]);
    }
  }
}
console.log("ghost grid", GNX, "x", GNY, "=", GNX * GNY, "dSmax", dSmax.toFixed(0), "dOmax", dOmax.toFixed(0));
const GQ = 65535 / 2;
const enc = (arr, max) => {
  const u = new Uint16Array(arr.length);
  for (let k = 0; k < arr.length; k++) u[k] = Math.max(0, Math.min(65535, Math.round((arr[k] / max) * GQ)));
  return Buffer.from(u.buffer).toString("base64");
};
const GHOST_PLAN_B64 = enc(dS, dSmax);
const GHOST_DRAIN_B64 = enc(dO, dOmax);

const pt = (q) => [r2(q[0]), r2(q[1])];
const places = {
  shanhaiguan: pt(P([119.75, 40.0])),
  mongoliaJunction: pt(P([119.6, 46.4])),
  beijing: pt(P([116.4, 39.9])),
  shanghai: pt(P([121.47, 31.23])),
  wuhan: pt(P([114.31, 30.59])),
  kaifeng: pt(P([114.3, 34.8])),
  chongqing: pt(P([106.55, 29.56])),
  lanzhou: pt(P([103.83, 36.06])),
  chengdu: pt(P([104.07, 30.66])),
  fanCentre: pt(P([103.0, 34.0])),
  frontEntersChina: pt(FRONT.find(([x, y]) => inMP(x, y, R.china)) ?? FRONT[0]),
  chinaLabel: pt(P([97.2, 32.1])), // the middle of the untaken interior, clear of the front
};

const ts = `// GENERATED by scripts/build-pearl-allofchina.mjs — do not edit by hand.
// AllOfChina on the kit's ASIA world (Lambert conformal conic 25/45, 112 E;
// world px == screen px at k 1, (112 E, 30 N) at (540, 960)).

/** the plan line, clockwise from the Wall at the sea (Shanhaiguan) to the Manchukuo-Mongolia junction */
export const PLAN_PTS: [number, number][] = ${JSON.stringify(PLAN.map(pt))};

/** the conquest's arrival-time field (see the script): t = q * 3 / 65535, row-major, ny rows of nx */
export const FIELD = { nx: ${nx}, ny: ${ny}, x0: ${x0}, y0: ${y0}, h: ${H}, scale: 3 / 65535, b64: "${b64}" };

/** the PLAN's ghost wash on a grid over China proper (row-major, ny rows of nx; t = q * 2 / 65535):
 *  plan  = distance from the Manchukuo line + the coast / its max inside China proper (1 = the farthest point, far west)
 *  drain = distance from the occupied region / its max inside China proper (the wash drains back toward the front) */
export const GHOST = { nx: ${GNX}, ny: ${GNY}, x0: ${GX0}, y0: ${GY0}, h: ${GH}, scale: 2 / 65535, plan: "${GHOST_PLAN_B64}", drain: "${GHOST_DRAIN_B64}" };

/** China's LAND borders (outline minus coast, minus Manchukuo): where the plan's dashed edge is drawn */
export const BORDER_RUNS: [number, number][][] = ${JSON.stringify(BORDER_RUNS.map((r) => r.map(pt)))};

/** the field's zones: world y below which the Canton / Hainan landings rule (no front line drawn there) */
export const AOC_ZONES = { canton: ${r2(yCanton)}, hainan: ${r2(yHainan)} };

/** projected points (world px) */
export const AOC_PLACES = ${JSON.stringify(places)} as const;
`;
writeFileSync(OUT, ts);
console.log("wrote", OUT, (ts.length / 1024).toFixed(0), "KB");
console.log("plan start lon/lat", P.invert(PLAN[0]).map((v) => v.toFixed(3)), "end", P.invert(PLAN[PLAN.length - 1]).map((v) => v.toFixed(3)));
BORDER_RUNS.forEach((r) => {
  const m = r[Math.floor(r.length / 2)];
  console.log("border run", lenOf(r).toFixed(0), "px, from", P.invert(r[0]).map((v) => v.toFixed(2)).join(","), "mid", P.invert(m).map((v) => v.toFixed(2)).join(","), "to", P.invert(r[r.length - 1]).map((v) => v.toFixed(2)).join(","));
});
