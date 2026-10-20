// Builds generated/components/zach-shore-trailer/atlanticMapData.ts for LondonToNewYork (builder A).
//   bun scripts/clips/zach-shore-trailer/build-atlantic-map.mjs
// Land: Natural Earth 1:50m (node_modules/world-atlas/land-50m.json, via scripts/maps/lib/geo.mjs), Mercator
// (rotated to 37 W), north up, so the London -> New York great circle draws as an arc bowing north. World px:
// ROUTE_CHORD world px between the two pins; the origin is the middle of the route's bounding box.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { geoInterpolate, geoMercator, geoDistance } from "d3-geo";
import { REPO, naturalEarth } from "../../maps/lib/geo.mjs";

const LONDON = [-0.1276, 51.5072]; // [lon, lat], Charing Cross
const NEW_YORK = [-74.006, 40.7128]; // City Hall, Manhattan
const ROUTE_CHORD = 1360; // world px between the pins (k 1 = 66 % of the 2048 frame)
const LON0 = -37;

const proj = geoMercator().rotate([-LON0, 0]).scale(1).translate([0, 0]);
const a0 = proj(LONDON);
const b0 = proj(NEW_YORK);
const S = ROUTE_CHORD / Math.hypot(a0[0] - b0[0], a0[1] - b0[1]);
proj.scale(S);

// the great circle, London -> New York, sampled
const N = 240;
const gi = geoInterpolate(LONDON, NEW_YORK);
const routeLL = Array.from({ length: N + 1 }, (_, i) => gi(i / N));
let pts = routeLL.map((ll) => proj(ll));
const xs = pts.map((p) => p[0]);
const ys = pts.map((p) => p[1]);
const ox = (Math.min(...xs) + Math.max(...xs)) / 2;
const oy = (Math.min(...ys) + Math.max(...ys)) / 2;
proj.translate([-ox, -oy]);
pts = routeLL.map((ll) => proj(ll));

// land, clipped to a box well beyond every camera state
const EXT = [[-1800, -1000], [1800, 1150]];
proj.clipExtent(EXT);
const { land } = naturalEarth("50m");
const rings = [];
let ring = null;
const stream = proj.stream({
  point(x, y) {
    ring.push([x, y]);
  },
  lineStart() {
    ring = [];
  },
  lineEnd() {
    if (ring.length > 2) rings.push(ring);
  },
  polygonStart() {},
  polygonEnd() {},
  sphere() {},
});
const geo = (g, s) => {
  // feed GeoJSON geometry to a d3 stream
  const poly = (coords) => {
    s.polygonStart();
    for (const r of coords) {
      s.lineStart();
      for (let i = 0; i < r.length - 1; i++) s.point(r[i][0], r[i][1]);
      s.lineEnd();
    }
    s.polygonEnd();
  };
  if (g.type === "Polygon") poly(g.coordinates);
  else if (g.type === "MultiPolygon") g.coordinates.forEach(poly);
  else if (g.type === "GeometryCollection") g.geometries.forEach((x) => geo(x, s));
};
for (const f of land) geo(f.geometry, stream);

const MIN_STEP = 1.4; // world px between kept vertices
const MIN_AREA = 6; // world px^2: drop specks
const area = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
};
const f1 = (v) => {
  const r = Math.round(v * 10) / 10;
  return Object.is(r, -0) ? 0 : r;
};
let nPts = 0;
const parts = [];
for (const r of rings) {
  if (Math.abs(area(r)) < MIN_AREA) continue;
  const kept = [r[0]];
  for (const p of r.slice(1)) {
    const l = kept[kept.length - 1];
    if (Math.hypot(p[0] - l[0], p[1] - l[1]) >= MIN_STEP) kept.push(p);
  }
  if (kept.length < 3) continue;
  nPts += kept.length;
  parts.push(`M${kept.map((p) => `${f1(p[0])},${f1(p[1])}`).join("L")}Z`);
}
const LAND_PATH = parts.join("");

// THE FLOWN ROUTE (stylised, director's pass 3): ONE clean arc, a cubic Bezier from London to New York whose two
// control points sit BOW_LONDON / BOW_NY world px north of the chord's thirds: it rises gently out of London, bows
// north by ~60 world px (the great circle bows ~3x more on this Mercator), stays on the sea south of Newfoundland
// (~30 px clear of Cape Race) and Nova Scotia (~16 px clear of Cape Sable), and comes into the New York pin from the
// ocean side, ENE -> WSW (~19 degrees below horizontal). No inflection (checked). Resampled evenly by arc length.
const BOW_LONDON = 100;
const BOW_NY = 52; // BOW_LONDON < 2 x BOW_NY keeps the control polygon convex (no inflection)
const gcPts = pts;
{
  const P0 = proj(LONDON);
  const P3 = proj(NEW_YORK);
  const d = [P3[0] - P0[0], P3[1] - P0[1]];
  const dl = Math.hypot(d[0], d[1]);
  const n = [-d[1] / dl, d[0] / dl]; // the chord's normal pointing north (screen up)
  if (n[1] > 0) throw new Error("normal points south");
  const P1 = [P0[0] + d[0] / 3 + n[0] * BOW_LONDON, P0[1] + d[1] / 3 + n[1] * BOW_LONDON];
  const P2 = [P0[0] + (2 * d[0]) / 3 + n[0] * BOW_NY, P0[1] + (2 * d[1]) / 3 + n[1] * BOW_NY];
  const bez = (t) => {
    const u = 1 - t;
    return [
      u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0],
      u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1],
    ];
  };
  const dense = Array.from({ length: 2001 }, (_, i) => bez(i / 2000));
  const dc = [0];
  for (let i = 1; i < dense.length; i++) dc.push(dc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = dc[dc.length - 1];
  pts = [];
  let j = 0;
  for (let i = 0; i <= N; i++) {
    const s = (L * i) / N;
    while (j < dc.length - 2 && dc[j + 1] < s) j++;
    const u = (s - dc[j]) / (dc[j + 1] - dc[j] || 1);
    pts.push([dense[j][0] + (dense[j + 1][0] - dense[j][0]) * u, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * u]);
  }
  // no inflection: the turn keeps one sign all along
  let sg = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const c = (pts[i][0] - pts[i - 1][0]) * (pts[i + 1][1] - pts[i][1]) - (pts[i][1] - pts[i - 1][1]) * (pts[i + 1][0] - pts[i][0]);
    if (Math.abs(c) < 1e-9) continue;
    if (sg && Math.sign(c) !== sg) throw new Error("route has an inflection");
    sg = Math.sign(c);
  }
}

// cumulative route length
const cum = [0];
for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
const km = geoDistance(LONDON, NEW_YORK) * 6371.0088;
const lonPx = proj([LON0 + 1, 0])[0] - proj([LON0, 0])[0];

const r2 = (v) => Math.round(v * 100) / 100;
const out = `// Generated by scripts/clips/zach-shore-trailer/build-atlantic-map.mjs — do not edit by hand.
// Natural Earth 1:50m land (world-atlas land-50m), Mercator rotated to ${LON0} deg, north up, ${r2(S)} world px per
// radian (${r2(lonPx)} world px per degree of longitude). Origin = the middle of the London -> New York great
// circle's bounding box. London ${LONDON[1]} N ${-LONDON[0]} W, New York ${NEW_YORK[1]} N ${-NEW_YORK[0]} W; great-circle
// distance ${Math.round(km)} km. Land clipped to x ${EXT[0][0]}..${EXT[1][0]}, y ${EXT[0][1]}..${EXT[1][1]}; ${parts.length} rings, ${nPts} points.
export const ATL_SCALE = ${r2(S)};
export const ATL_PX_PER_DEG_LON = ${r2(lonPx)};
export const ATL_EXTENT = { x0: ${EXT[0][0]}, y0: ${EXT[0][1]}, x1: ${EXT[1][0]}, y1: ${EXT[1][1]} } as const;
export const LONDON_XY = { x: ${r2(proj(LONDON)[0])}, y: ${r2(proj(LONDON)[1])} } as const;
export const NEW_YORK_XY = { x: ${r2(proj(NEW_YORK)[0])}, y: ${r2(proj(NEW_YORK)[1])} } as const;
export const ROUTE_KM = ${Math.round(km)};
/** the great circle London -> New York, ${N + 1} points, world px (reference; not drawn) */
export const GC_PTS: ReadonlyArray<readonly [number, number]> = ${JSON.stringify(gcPts.map((p) => [r2(p[0]), r2(p[1])]))};
/** THE FLOWN ROUTE (stylised: one cubic Bezier arc bowing north (controls ${BOW_LONDON} / ${BOW_NY} world px off the chord), no inflection),
 *  ${N + 1} points evenly spaced by arc length, world px */
export const ROUTE_PTS: ReadonlyArray<readonly [number, number]> = ${JSON.stringify(pts.map((p) => [r2(p[0]), r2(p[1])]))};
/** cumulative length along ROUTE_PTS, world px */
export const ROUTE_CUM: ReadonlyArray<number> = ${JSON.stringify(cum.map(r2))};
export const ROUTE_LEN = ${r2(cum[cum.length - 1])};
export const LAND_PATH = "${LAND_PATH}";
`;
const file = join(REPO, "generated/components/zach-shore-trailer/atlanticMapData.ts");
writeFileSync(file, out);
console.log(`wrote ${file}: ${parts.length} rings, ${nPts} pts, ${(out.length / 1024).toFixed(0)} KB; S ${r2(S)}, ${r2(lonPx)} px/deg; route ${r2(cum[cum.length - 1])} px, ${Math.round(km)} km`);
console.log("London", proj(LONDON), "NY", proj(NEW_YORK), "route y range", Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1])));
