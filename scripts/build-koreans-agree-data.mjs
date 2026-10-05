/* global Bun, console */
// Bakes the two vector lines of KoreansAllAgree (Sheppard, "Regime change in
// Iraq was the easy part", cut D) on the shared Korea world (koreaShared, read
// only: same projection, same rounding sink as scripts/build-korea-map.mjs).
//
//   bun scripts/build-koreans-agree-data.mjs
//
// Writes generated/components/koreansAgreeData.ts:
//   MDL_LL     the 1953 Military Demarcation Line, lon/lat, WEST -> EAST: the
//              shared arc between North Korea and South Korea in Natural Earth
//              10m (world-atlas countries-10m). Today's North-South boundary.
//   OUTLINE    the peninsula's mainland ring (North + South merged: the coast
//              plus the Yalu-Tumen border), world px, unsimplified (the same
//              MIN_STEP rounding as the baked coast, so the pen lies ON the
//              raster coast at any zoom), starting on the middle of the south
//              coast and running clockwise on screen (south coast -> west coast
//              -> Yalu -> Tumen -> east coast -> back).
//   OUTLINE_LEN   its true cumulative arclength per vertex (world px)
//   OUTLINE_PACE  its "pen" progress per vertex 0..1: arclength of a 10 px
//              Douglas-Peucker simplification, spread over the fine vertices in
//              between, so the pen does not crawl through the ragged south-west
//              archipelago coast and race the smooth east coast.
import { writeFileSync } from "node:fs";
import { geoArea, geoConicConformal } from "d3-geo";
import { mesh, merge } from "topojson-client";
import { PROJ } from "../generated/components/koreaMapData.ts";

const OUT = "generated/components/koreansAgreeData.ts";
const cTopo = JSON.parse(await Bun.file("node_modules/world-atlas/countries-10m.json").text());
const geoms = cTopo.objects.countries.geometries;

const projection = geoConicConformal()
  .parallels(PROJ.parallels)
  .rotate(PROJ.rotate)
  .center(PROJ.center)
  .scale(PROJ.scale)
  .translate(PROJ.translate);

// -- the MDL ---------------------------------------------------------------------
const mdl = mesh(cTopo, cTopo.objects.countries, (a, b) => {
  const s = new Set([a.properties.name, b.properties.name]);
  return a !== b && s.has("North Korea") && s.has("South Korea");
});
if (mdl.coordinates.length !== 1) throw new Error(`MDL: ${mdl.coordinates.length} arcs`);
let MDL_LL = mdl.coordinates[0].map(([lon, lat]) => [+lon.toFixed(5), +lat.toFixed(5)]);
if (MDL_LL[0][0] > MDL_LL[MDL_LL.length - 1][0]) MDL_LL = MDL_LL.reverse();

// -- the outline -------------------------------------------------------------------
const koreaGeo = merge(cTopo, geoms.filter((g) => g.properties.name === "North Korea" || g.properties.name === "South Korea"));
const mainland = koreaGeo.coordinates
  .map((p) => ({ p, a: geoArea({ type: "Polygon", coordinates: p }) }))
  .sort((a, b) => b.a - a.a)[0].p[0];
// project + the build-korea-map rounding (MIN_STEP 0.18, 1/40 px grid)
const MIN_STEP = 0.18;
const n40 = (v) => Math.round(v * 40) / 40;
let ring = [];
for (const ll of mainland) {
  const [x, y] = projection(ll);
  const last = ring[ring.length - 1];
  if (last && Math.hypot(x - last[0], y - last[1]) < MIN_STEP) continue;
  ring.push([x, y]);
}
if (Math.hypot(ring[0][0] - ring.at(-1)[0], ring[0][1] - ring.at(-1)[1]) < 1e-6) ring.pop();
// clockwise on screen (y down): shoelace > 0
let A = 0;
for (let i = 0; i < ring.length; i++) {
  const [x0, y0] = ring[i];
  const [x1, y1] = ring[(i + 1) % ring.length];
  A += x0 * y1 - x1 * y0;
}
if (A < 0) ring.reverse();
// start on the middle of the south coast: the southmost vertex near lon 127.75
const [sx] = projection([127.75, 34.6]);
let best = -1;
let bestY = -Infinity;
ring.forEach(([x, y], i) => {
  if (Math.abs(x - sx) < 6 && y > bestY) [best, bestY] = [i, y];
});
ring = [...ring.slice(best), ...ring.slice(0, best)];
ring.push(ring[0]); // closed: the pen comes home
ring = ring.map(([x, y]) => [n40(x), n40(y)]);
// heading at the start: clockwise from the south coast goes WEST (x decreasing)
{
  let j = 1;
  while (Math.hypot(ring[j][0] - ring[0][0], ring[j][1] - ring[0][1]) < 25) j++;
  console.log(`start ${ring[0].map((v) => v.toFixed(1))}, heading dx ${(ring[j][0] - ring[0][0]).toFixed(1)}`);
}

const LEN = [0];
for (let i = 1; i < ring.length; i++) LEN.push(LEN[i - 1] + Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]));

// Douglas-Peucker indices (iterative)
const dp = (pts, tol) => {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const L = Math.hypot(dx, dy) || 1e-9;
    let dm = -1;
    let im = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L;
      if (d > dm) [dm, im] = [d, i];
    }
    if (dm > tol) {
      keep[im] = 1;
      stack.push([a, im], [im, b]);
    }
  }
  return [...keep.keys()].filter((i) => keep[i]);
};
// a closed ring: split at the vertex farthest from the start, DP each half
let far = 0;
ring.forEach(([x, y], i) => {
  if (Math.hypot(x - ring[0][0], y - ring[0][1]) > Math.hypot(ring[far][0] - ring[0][0], ring[far][1] - ring[0][1])) far = i;
});
const kept = [...dp(ring.slice(0, far + 1), 10), ...dp(ring.slice(far), 10).slice(1).map((i) => i + far)];
const PACE = new Array(ring.length).fill(0);
let acc = 0;
for (let q = 1; q < kept.length; q++) {
  const a = kept[q - 1];
  const b = kept[q];
  const seg = Math.hypot(ring[b][0] - ring[a][0], ring[b][1] - ring[a][1]);
  const fl = LEN[b] - LEN[a] || 1e-9;
  for (let i = a + 1; i <= b; i++) PACE[i] = acc + (seg * (LEN[i] - LEN[a])) / fl;
  acc += seg;
}
const PACE01 = PACE.map((v) => +(v / acc).toFixed(6));
console.log(`MDL ${MDL_LL.length} pts ${JSON.stringify(MDL_LL[0])} -> ${JSON.stringify(MDL_LL.at(-1))}`);
console.log(`outline ${ring.length} pts, true length ${LEN.at(-1).toFixed(0)} px, pen (DP 10) length ${acc.toFixed(0)} px, ${kept.length} kept`);

writeFileSync(
  OUT,
  `// Generated by scripts/build-koreans-agree-data.mjs — do not edit by hand.
// KoreansAllAgree's two vector lines on the shared Korea world (koreaMapData PROJ).
// Natural Earth 10m via world-atlas countries-10m (public domain).

/** the 1953 Military Demarcation Line (Natural Earth 10m North Korea / South Korea
 *  boundary), [lon, lat], west -> east */
export const MDL_LL: [number, number][] = ${JSON.stringify(MDL_LL)};

/** the peninsula's mainland outline (coast + Yalu-Tumen border), world px, closed,
 *  from the middle of the south coast, clockwise on screen */
export const OUTLINE: [number, number][] = ${JSON.stringify(ring)};
/** true cumulative arclength per OUTLINE vertex (world px) */
export const OUTLINE_LEN: number[] = ${JSON.stringify(LEN.map((v) => +v.toFixed(2)))};
/** pen progress per OUTLINE vertex 0..1 (the arclength of a 10 px simplification) */
export const OUTLINE_PACE: number[] = ${JSON.stringify(PACE01)};
`,
);
console.log(`Wrote ${OUT}`);
