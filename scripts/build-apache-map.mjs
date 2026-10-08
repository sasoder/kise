// Bakes THE APACHE WORLD for the cut VeryLongTime (clip "Sheppard: centralized
// empires fell fast"; Dwarkesh map style): the American Southwest and northern
// Mexico, in one go (geometry + rasters).
//
//   bun scripts/build-apache-map.mjs
//
// Reads Natural Earth 10m land (world-atlas). Writes
//   generated/components/apacheMapData.ts  projection, the Apacheria ring, the tiles
//   public/apache/base-<i>-<j>.png         the static map (sea, 4 engraved
//                                           water-lines, 5 deg graticule, land +
//                                           rim, cream coast; NO borders, no
//                                           state lines, no rivers: Natural
//                                           Earth rivers are not installed)
//
// PROJECTION: north-up Lambert conformal conic, parallels 27 N / 37 N, centre
// meridian 107 W. World px == screen px at camera { k: 1, cx: 540, cy: 960 }:
// 69 px per degree of longitude at 32 N, the point (107 W, 32 N) at (540, 960).
//
// THE APACHERIA: ONE SCHEMATIC BLOB, an approximate historical range
// (south-eastern Arizona, most of New Mexico, far west Texas, northern Sonora
// and Chihuahua) drawn through hand-placed lon/lat control points with a closed
// centripetal Catmull-Rom. It is not a surveyed boundary.

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoArea, geoConicConformal } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT = "generated/components/apacheMapData.ts";
const OUT_DIR = "public/apache";
const PARALLELS = [27, 37];
const ROTATE = [107, 0];
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(1).translate([0, 0]);
{
  const a = projection([-108, 32]);
  const b = projection([-106, 32]);
  projection.scale((2 * 69) / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const c = projection([-107, 32]);
  projection.translate([540 - c[0], 960 - c[1]]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const P = (ll) => projection(ll);
const r2 = (v) => Math.round(v * 100) / 100;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const PX_PER_KM = dist(P([-107, 31.5]), P([-107, 32.5])) / 111.19;
const toD = (pts, close = false) => (pts.length ? `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}` : "");
const multiD = (mp) => mp.map((poly) => poly.map((ring) => toD(ring.slice(0, -1), true)).join("")).join("");
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};

// land: clip in lon/lat, project, clip to the world rect
const RECT = { x0: -500, x1: 1580, y0: -500, y1: 2420 };
const VIEW = { lon: [-140, -74], lat: [8, 56] };
const box = (x0, y0, x1, y1) => [
  [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ],
];
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const landLL = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const [lon, lat] of rings[0]) {
      x0 = Math.min(x0, lon);
      x1 = Math.max(x1, lon);
      y0 = Math.min(y0, lat);
      y1 = Math.max(y1, lat);
    }
    if (x1 - x0 >= 180 || x1 < VIEW.lon[0] || x0 > VIEW.lon[1] || y1 < VIEW.lat[0] || y0 > VIEW.lat[1]) continue;
    if (geoArea({ type: "Polygon", coordinates: [rings[0]] }) > 2 * Math.PI) continue;
    landLL.push(rings);
  }
const landW = polygonClipping.intersection(landLL, box(VIEW.lon[0], VIEW.lat[0], VIEW.lon[1], VIEW.lat[1])).map((poly) => poly.map((r) => r.map(P)));
const LANDW = polygonClipping.intersection(landW, box(RECT.x0, RECT.y0, RECT.x1, RECT.y1));
const LAND_D = multiD(LANDW);
const LAND_WL_D = multiD(LANDW.filter((poly) => Math.abs(ringArea(poly[0])) / (PX_PER_KM * PX_PER_KM) >= 100));
let GRATICULE_D = "";
for (let lon = -140; lon <= -75; lon += 5) {
  const pts = [];
  for (let lat = 8; lat <= 56; lat += 0.5) pts.push(P([lon, lat]));
  GRATICULE_D += toD(pts);
}
for (let lat = 10; lat <= 55; lat += 5) {
  const pts = [];
  for (let lon = -140; lon <= -75; lon += 0.5) pts.push(P([lon, lat]));
  GRATICULE_D += toD(pts);
}

// THE APACHERIA (schematic; lon/lat control points, clockwise from the north-west)
const CTRL = [
  [-111.3, 34.6],
  [-110.0, 35.4],
  [-108.3, 35.15],
  [-106.8, 35.6],
  [-105.2, 35.3],
  [-104.0, 34.4],
  [-103.0, 33.2],
  [-102.6, 31.8],
  [-103.3, 30.4],
  [-104.6, 29.6],
  [-105.6, 28.6],
  [-107.0, 28.85],
  [-108.2, 28.4],
  [-109.6, 29.0],
  [-110.6, 29.9],
  [-111.4, 31.2],
  [-111.0, 32.4],
  [-111.7, 33.5],
].map(P);
const catmullClosed = (pts, step) => {
  const n = pts.length;
  const out = [];
  const knot = (p, q) => Math.pow(dist(p, q), 0.5) || 1e-6;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    out.push(p1);
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const m = Math.max(1, Math.ceil(dist(p1, p2) / step));
    for (let s = 1; s < m; s++) {
      const t = t1 + ((t2 - t1) * s) / m;
      const lerp = (A, B, ta, tb) => [((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0], ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1]];
      const A1 = lerp(p0, p1, 0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      out.push(lerp(lerp(A1, A2, 0, t2), lerp(A2, A3, t1, t3), t1, t2));
    }
  }
  return out;
};
const RING = catmullClosed(CTRL, 6);
const C = RING.reduce((s, q) => [s[0] + q[0] / RING.length, s[1] + q[1] / RING.length], [0, 0]);
const bx = RING.map((q) => q[0]);
const by = RING.map((q) => q[1]);
console.log(
  `scale ${SCALE.toFixed(2)}, ${PX_PER_KM.toFixed(4)} px/km; Apacheria ${RING.length} pts, x ${Math.min(...bx).toFixed(0)}..${Math.max(...bx).toFixed(0)}, y ${Math.min(...by).toFixed(0)}..${Math.max(...by).toFixed(0)}, centroid ${C.map((v) => v.toFixed(0))}; land ${LANDW.length} polygons`,
);

// rasters
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const L = { name: "base", kBake: 1.03, s: 1.35, x0: -90, x1: 1170, y0: -90, y1: 2010 };
const px = (v) => v / L.kBake;
const wlGap = 6.5 * Math.pow(L.kBake, 0.45);
const wlOp = [0.3, 0.2, 0.12, 0.065];
let wl = "";
for (let i = 3; i >= 0; i--) {
  const d = wlGap * (i + 1);
  wl += `<path d="${LAND_WL_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
  wl += `<path d="${LAND_WL_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
}
const stack = `
<defs><clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath></defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
mkdirSync(OUT_DIR, { recursive: true });
for (const f of readdirSync(OUT_DIR)) if (f.endsWith(".png")) rmSync(`${OUT_DIR}/${f}`);
const TILE = 2048;
const APRON = 2;
const W = Math.ceil((L.x1 - L.x0) * L.s);
const H = Math.ceil((L.y1 - L.y0) * L.s);
const tiles = [];
for (let j = 0; j < Math.ceil(H / TILE); j++)
  for (let i = 0; i < Math.ceil(W / TILE); i++) {
    const tx = i * TILE;
    const ty = j * TILE;
    const TW = Math.min(W, tx + TILE + APRON) - tx;
    const TH = Math.min(H, ty + TILE + APRON) - ty;
    const t = { f: `base-${i}-${j}.png`, x0: L.x0 + tx / L.s, y0: L.y0 + ty / L.s, w: TW / L.s, h: TH / L.s, W: TW, H: TH };
    tiles.push(t);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="${t.x0} ${t.y0} ${t.w} ${t.h}">${stack}</svg>`;
    writeFileSync(`${OUT_DIR}/${t.f}`, new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng());
  }
console.log(`baked ${W}x${H} texels, ${tiles.length} tiles`);

writeFileSync(
  OUT,
  `// Generated by scripts/build-apache-map.mjs — do not edit by hand.
// THE APACHE WORLD (see apacheShared.tsx). Lambert conformal conic, parallels
// ${PARALLELS.join(" N / ")} N, centre meridian ${ROTATE[0]} W; world px == screen px at k 1;
// ${PX_PER_KM.toFixed(4)} world px per km. Land: Natural Earth 10m (world-atlas).
export type P2 = [number, number];
export const PROJ = { parallels: ${JSON.stringify(PARALLELS)} as [number, number], rotate: ${JSON.stringify(ROTATE)} as [number, number], scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export const PX_PER_KM = ${PX_PER_KM.toFixed(4)};
/** THE APACHERIA: a SCHEMATIC ring (approximate historical range), world px, and its centroid */
export const APACHERIA: P2[] = ${JSON.stringify(RING.map(([x, y]) => [r2(x), r2(y)]))};
export const APACHERIA_C: P2 = ${JSON.stringify(C.map(r2))};
/** the baked static map: world rect, texels per world px, tiles (public/apache/<f>) */
export type Tile = { f: string; x0: number; y0: number; w: number; h: number; W: number; H: number };
export const BASE = { s: ${L.s}, x0: ${L.x0}, y0: ${L.y0}, w: ${W / L.s}, h: ${H / L.s} };
export const TILES: Tile[] = ${JSON.stringify(tiles)};
`,
);
console.log(`Wrote ${OUT}`);
