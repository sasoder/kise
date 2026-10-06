// Bakes the geometry of THE AMERICAS WORLD for the cut HierarchicalNatureV2
// (clip "Sheppard: centralized empires fell fast", Dwarkesh with Si Sheppard;
// Dwarkesh map style): Mexico to Chile, the Aztec empire and Tawantinsuyu on
// one sheet.
//
//   bun scripts/build-americas-map.mjs
//
// Reads Natural Earth 10m land (world-atlas), scripts/cortes-geo.json (the
// georeferenced 1519 Aztec empire rings), generated/components/mayaMapData.ts
// (the Aztec tree exactly as OneFellSwoop builds it: the Codex Mendoza province
// heads and their parents) and scripts/inca-geo.json (the realm of 1532). None
// of them is edited. Writes
//   generated/components/americasStatic.ts   land + graticule (for the raster bake)
//   generated/components/americasMapData.ts  projection + the light overlays
//
// THE PROJECTION: north-up MERCATOR (the conformal conic's limit for a sheet
// that straddles the equator: lat +40 ... -58). World px == screen px at THE
// WIDE (camera { k: 1, cx: 540, cy: 960 }): 19 px per degree of longitude,
// Tenochtitlan at (270, 440), Cuzco at ~(786, 1076).
//
// THE TREES ARE SCHEMATIC. Aztec: the tributary provinces' head towns hanging
// from Tenochtitlan (mayaMapData's topology), thinned for this scale: a head
// nearer than MIN_SEP_AZ px to the capital or to a head kept before it (the
// outermost first) is merged into its nearest kept ancestor. Inca: the
// administrative chain along the royal roads of the four suyus (the director's
// list below), a node nearer than MIN_SEP_INCA px to its parent merged into it.
// Neither is a count of places or a documented chain of command.

import { readFileSync, writeFileSync } from "node:fs";
import { geoMercator, geoArea } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";
import { AZTEC_NODES } from "../generated/components/mayaMapData.ts";

const OUT_STATIC = "generated/components/americasStatic.ts";
const OUT = "generated/components/americasMapData.ts";
const CORTES = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));
const INCA = JSON.parse(readFileSync("scripts/inca-geo.json", "utf8"));

const LON_PX = 19;
const TEN_LL = CORTES.sites.tenochtitlan.lonlat;
const CUZCO_LL = [-71.97, -13.52];
const projection = geoMercator().scale((LON_PX * 180) / Math.PI).translate([0, 0]);
{
  const c = projection(TEN_LL);
  projection.translate([270 - c[0], 440 - c[1]]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const P = (ll) => projection(ll);
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const toD = (pts, close = false, r = r2) => (pts.length ? `M${pts.map(([x, y]) => `${r(x)},${r(y)}`).join("L")}${close ? "Z" : ""}` : "");
const multiD = (mp, r = r2) => mp.map((poly) => poly.map((ring) => toD(ring.slice(0, -1), true, r)).join("")).join("");
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
console.log(`mercator scale ${SCALE.toFixed(3)}, translate ${TRANSLATE.map((v) => v.toFixed(2))}; Tenochtitlan ${P(TEN_LL).map(r2)}, Cuzco ${P(CUZCO_LL).map(r2)}`);

// ---------------------------------------------------------------------------
// LAND + graticule
// ---------------------------------------------------------------------------
const RECT = { x0: -200, x1: 1280, y0: -200, y1: 2120 };
const RECT_POLY = [[[RECT.x0, RECT.y0], [RECT.x1, RECT.y0], [RECT.x1, RECT.y1], [RECT.x0, RECT.y1], [RECT.x0, RECT.y0]]];
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const llBox = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return { x0, x1, y0, y1 };
};
const VIEW = { lon: [-139.3713, -29.6177], lat: [-65.7131, 57.3719] };
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const landLL = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    const b = llBox(rings[0]);
    if (b.x1 - b.x0 >= 180 || b.x1 < VIEW.lon[0] || b.x0 > VIEW.lon[1] || b.y1 < VIEW.lat[0] || b.y0 > VIEW.lat[1]) continue;
    if (geoArea({ type: "Polygon", coordinates: [rings[0]] }) > 2 * Math.PI) continue;
    landLL.push(rings);
  }
const VIEW_POLY = [[[VIEW.lon[0], VIEW.lat[0]], [VIEW.lon[1], VIEW.lat[0]], [VIEW.lon[1], VIEW.lat[1]], [VIEW.lon[0], VIEW.lat[1]], [VIEW.lon[0], VIEW.lat[0]]]];
// Sutherland-Hodgman against the lon/lat view box (polygon-clipping fails on the
// 66k-vertex Americas ring); the box lies far outside the frame, so the edges it
// leaves along the box are never seen
const shClip = (ring) => {
  const edges = [
    [(q) => q[0] >= VIEW.lon[0], (a, b) => [VIEW.lon[0], a[1] + ((b[1] - a[1]) * (VIEW.lon[0] - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= VIEW.lon[1], (a, b) => [VIEW.lon[1], a[1] + ((b[1] - a[1]) * (VIEW.lon[1] - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= VIEW.lat[0], (a, b) => [a[0] + ((b[0] - a[0]) * (VIEW.lat[0] - a[1])) / (b[1] - a[1]), VIEW.lat[0]]],
    [(q) => q[1] <= VIEW.lat[1], (a, b) => [a[0] + ((b[0] - a[0]) * (VIEW.lat[1] - a[1])) / (b[1] - a[1]), VIEW.lat[1]]],
  ];
  let pts = ring.slice(0, -1);
  for (const [inside, cut] of edges) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ia = inside(a);
      const ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) out.push(cut(a, b));
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return [...pts, pts[0]];
};
const LANDW = [];
for (const rings of landLL) {
  const poly = rings.map(shClip).filter(Boolean).map((r) => r.map(P));
  if (poly.length && rings[0] && shClip(rings[0])) LANDW.push(poly);
}
const PX_PER_KM_EQ = LON_PX / 111.32;
const WL_MIN_KM2 = 2500;
const LAND_WL = LANDW.filter((poly) => Math.abs(ringArea(poly[0])) / (PX_PER_KM_EQ * PX_PER_KM_EQ) >= WL_MIN_KM2);
// drop specks (< 60 km2: under a quarter px at the wide)
const LAND_KEEP = LANDW.filter((poly) => Math.abs(ringArea(poly[0])) / (PX_PER_KM_EQ * PX_PER_KM_EQ) >= 60);
console.log(`land: ${LANDW.length} polygons in the rect, ${LAND_KEEP.length} kept (>= 60 km2), ${LAND_WL.length} carry water-lines`);
const LAND_D = multiD(LAND_KEEP);
const LAND_WL_D = multiD(LAND_WL);
let GRATICULE_D = "";
for (let lon = -140; lon <= -30; lon += 10) GRATICULE_D += toD([P([lon, -66]), P([lon, 56])]);
for (let lat = -60; lat <= 50; lat += 10) GRATICULE_D += toD([P([-140, lat]), P([-30, lat])]);

// land test + coast distance
const coastSegs = [];
for (const poly of LANDW) for (const ring of poly) for (let i = 1; i < ring.length; i++) coastSegs.push([ring[i - 1][0], ring[i - 1][1], ring[i][0], ring[i][1]]);
const BUCKET = 4;
const rowGrid = new Map();
const segGrid = new Map();
coastSegs.forEach(([ax, ay, bx, by], i) => {
  const j0 = Math.floor(Math.min(ay, by) / BUCKET);
  const j1 = Math.floor(Math.max(ay, by) / BUCKET);
  const i0 = Math.floor(Math.min(ax, bx) / BUCKET);
  const i1 = Math.floor(Math.max(ax, bx) / BUCKET);
  for (let b = j0; b <= j1; b++) {
    if (!rowGrid.has(b)) rowGrid.set(b, []);
    rowGrid.get(b).push(i);
    for (let a = i0; a <= i1; a++) {
      const k = `${a},${b}`;
      if (!segGrid.has(k)) segGrid.set(k, []);
      segGrid.get(k).push(i);
    }
  }
});
const isLand = (x, y) => {
  let c = false;
  for (const i of rowGrid.get(Math.floor(y / BUCKET)) ?? []) {
    const [ax, ay, bx, by] = coastSegs[i];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
  }
  return c;
};
const segDist = (p, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const coastDist = (x, y, max = 8) => {
  let best = Infinity;
  const R = Math.ceil(max / BUCKET);
  const i0 = Math.floor(x / BUCKET);
  const j0 = Math.floor(y / BUCKET);
  for (let a = i0 - R; a <= i0 + R; a++)
    for (let b = j0 - R; b <= j0 + R; b++)
      for (const i of segGrid.get(`${a},${b}`) ?? []) {
        const [ax, ay, bx, by] = coastSegs[i];
        best = Math.min(best, segDist([x, y], [ax, ay], [bx, by]));
      }
  return best;
};
const close = (r) => (dist(r[0], r[r.length - 1]) < 1e-9 ? r : [...r, r[0]]);
const densify = (ring, step = 0.3) => {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let s = 0; s < n; s++) out.push([a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n]);
  }
  return out;
};
const runsOverLand = (pts, off) => {
  const runs = [];
  let run = [];
  for (const q of [...pts, pts[0]]) {
    if (isLand(q[0], q[1]) && coastDist(q[0], q[1], 8) > off) run.push(q);
    else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
};
const thin = (run, step = 0.6) => {
  const out = [run[0]];
  for (const q of run) if (dist(q, out[out.length - 1]) >= step) out.push(q);
  return out;
};

// ---------------------------------------------------------------------------
// THE AZTEC EMPIRE 1519: (outer - Tlaxcala - Teotitlan) n land (no Soconusco exclave, as OneFellSwoop)
// ---------------------------------------------------------------------------
const [OUTER, TLAX, TEOT] = CORTES.aztec_empire_1519.rings.map((ring) => ring.map(P));
const withLand = (mp) => {
  const out = [];
  for (const poly of LANDW) {
    if (Math.abs(ringArea(poly[0])) < 4) continue;
    for (const q of polygonClipping.intersection(mp, [poly])) out.push(q);
  }
  return out;
};
const EMPIRE = withLand(polygonClipping.difference([close(OUTER)], [close(TLAX)], [close(TEOT)]));
const EMPIRE_D = multiD(EMPIRE);
const EMPIRE_BORDER_D = [OUTER, TLAX, TEOT].flatMap((r) => runsOverLand(densify(r), 0.35)).map((r) => toD(thin(r))).join("");
const bbox = (mp) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const poly of mp) for (const [x, y] of poly[0]) [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
  return { x0: r2(x0), x1: r2(x1), y0: r2(y0), y1: r2(y1) };
};
const EMPIRE_BOX = bbox(EMPIRE);
console.log(`Aztec empire box (world px): ${JSON.stringify(EMPIRE_BOX)} = ${(EMPIRE_BOX.x1 - EMPIRE_BOX.x0).toFixed(0)} px wide`);

// the tree: OneFellSwoop's nodes and parents, thinned for this scale
const TEN = P(TEN_LL);
const MIN_SEP_AZ = 15;
const az = AZTEC_NODES.map((n) => ({ name: n.name, lon: n.lon, lat: n.lat, p: P([n.lon, n.lat]), parent: n.parent }));
const order = az.map((_, i) => i).sort((a, b) => dist(az[b].p, TEN) - dist(az[a].p, TEN));
const keptAz = new Set();
for (const i of order) {
  if (dist(az[i].p, TEN) < MIN_SEP_AZ) continue;
  if ([...keptAz].some((j) => dist(az[j].p, az[i].p) < MIN_SEP_AZ)) continue;
  keptAz.add(i);
}
const keptList = [...keptAz];
const ancestor = (i) => {
  let q = az[i].parent;
  while (q >= 0 && !keptAz.has(q)) q = az[q].parent;
  return q;
};
const AZ_TREE = keptList.map((i) => ({ name: az[i].name, lon: az[i].lon, lat: az[i].lat, x: r3(az[i].p[0]), y: r3(az[i].p[1]), parent: keptList.indexOf(ancestor(i)) }));
console.log(`Aztec tree: ${AZTEC_NODES.length} heads in OneFellSwoop -> ${AZ_TREE.length} kept (>= ${MIN_SEP_AZ} px apart), ${AZ_TREE.filter((n) => n.parent < 0).length} trunks: ${AZ_TREE.map((n) => n.name).join(", ")}`);

// ---------------------------------------------------------------------------
// TAWANTINSUYU 1532 (inca-geo.json realm ring) n land
// ---------------------------------------------------------------------------
const REALM_RING = INCA.realm_1532.outer.map(P);
const realmAll = withLand([[close(REALM_RING)]]);
const REALM = [realmAll.slice().sort((a, b) => Math.abs(ringArea(b[0])) - Math.abs(ringArea(a[0])))[0]];
const REALM_D = multiD(REALM);
// the land border: the ring's stretches more than 2.2 px (~12 km) from the coast
const REALM_BORDER_D = runsOverLand(densify(REALM_RING), 2.2).filter((r) => r.length > 12).map((r) => toD(thin(r))).join("");
const REALM_BOX = bbox(REALM);
console.log(`Inca realm box (world px): ${JSON.stringify(REALM_BOX)}`);

const CUZCO = P(CUZCO_LL);
const MIN_SEP_INCA = 14;
// [name, lon, lat, parent name]: the royal roads of the four suyus as chains
const ROADS = [
  // Chinchaysuyu
  ["Vilcashuaman", -73.95, -13.65, "Cuzco"],
  ["Jauja", -75.5, -11.78, "Vilcashuaman"],
  ["Huanuco Pampa", -76.82, -9.87, "Jauja"],
  ["Cajamarca", -78.52, -7.16, "Huanuco Pampa"],
  ["Tumebamba", -79.0, -2.9, "Cajamarca"],
  ["Quito", -78.51, -0.22, "Tumebamba"],
  ["Pachacamac", -76.9, -12.26, "Jauja"],
  ["Chan Chan", -79.07, -8.11, "Cajamarca"],
  ["Tumbes", -80.45, -3.57, "Tumebamba"],
  // Antisuyu
  ["Ollantaytambo", -72.26, -13.26, "Cuzco"],
  ["Vitcos", -72.93, -13.1, "Ollantaytambo"],
  ["Paucartambo", -71.6, -13.32, "Cuzco"],
  // Collasuyu
  ["Hatun Colla", -70.03, -15.67, "Cuzco"],
  ["Chucuito", -69.89, -15.89, "Hatun Colla"],
  ["Tiwanaku", -68.67, -16.55, "Chucuito"],
  ["Paria", -67.0, -17.83, "Tiwanaku"],
  ["Charcas", -65.26, -19.04, "Paria"],
  ["Tilcara", -65.39, -23.58, "Charcas"],
  ["Chicoana", -65.6, -25.1, "Tilcara"],
  ["Copiapo", -70.33, -27.37, "Chicoana"],
  ["Coquimbo", -71.34, -29.95, "Copiapo"],
  ["Santiago", -70.65, -33.45, "Coquimbo"],
  ["Cochabamba", -66.16, -17.39, "Paria"],
  // Cuntisuyu
  ["Cotahuasi", -72.89, -15.21, "Cuzco"],
  ["Chala", -74.25, -15.85, "Cotahuasi"],
  ["Arequipa", -71.54, -16.4, "Cuzco"],
].map(([name, lon, lat, parent]) => ({ name, lon, lat, p: P([lon, lat]), parent }));
const byName = new Map(ROADS.map((n) => [n.name, n]));
const posOf = (name) => (name === "Cuzco" ? CUZCO : byName.get(name).p);
const dropped = new Set();
let changed = true;
while (changed) {
  changed = false;
  for (const n of ROADS) {
    if (dropped.has(n.name)) continue;
    if (dist(n.p, posOf(n.parent)) < MIN_SEP_INCA) {
      // merge into its parent; a stub survives if it is a suyu's only road (Antisuyu)
      const kids = ROADS.filter((o) => o.parent === n.name && !dropped.has(o.name));
      dropped.add(n.name);
      for (const o of kids) o.parent = n.parent;
      console.log(`  Inca: merged ${n.name} into ${n.parent} (${dist(n.p, posOf(n.parent)).toFixed(1)} px)`);
      changed = true;
    }
  }
}
const keptInca = ROADS.filter((n) => !dropped.has(n.name));
const INCA_TREE = keptInca.map((n) => ({ name: n.name, lon: n.lon, lat: n.lat, x: r3(n.p[0]), y: r3(n.p[1]), parent: n.parent === "Cuzco" ? -1 : keptInca.findIndex((o) => o.name === n.parent) }));
console.log(`Inca tree: ${ROADS.length} listed -> ${INCA_TREE.length} kept, ${INCA_TREE.filter((n) => n.parent < 0).length} trunks: ${INCA_TREE.map((n) => `${n.name}${n.parent < 0 ? "*" : ""}`).join(", ")}`);
for (const n of INCA_TREE) if (!isLand(n.x, n.y)) console.log(`  NOTE ${n.name} is not on 10m land`);

writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-americas-map.mjs — do not edit by hand.
// The heavy STATIC layers of the Americas world (world px), read only by
// scripts/bake-americas-rasters.mjs. Natural Earth 10m land (world-atlas).
/** land (evenodd) */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** land of >= ${WL_MIN_KM2} km2 (the engraved water-lines run round these only) */
export const LAND_WL_D = ${JSON.stringify(LAND_WL_D)};
/** 10 degree graticule */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
writeFileSync(
  OUT,
  `// Generated by scripts/build-americas-map.mjs — do not edit by hand.
// THE AMERICAS WORLD (see americasShared.tsx). North-up Mercator, ${LON_PX} world px per
// degree of longitude; world px == screen px at the wide (k 1).
// Sources: Natural Earth 10m land (world-atlas); scripts/cortes-geo.json (the 1519
// Aztec empire after the Commons "Aztec Empire 1519 map-fr.svg"); mayaMapData.ts
// (the Codex Mendoza province heads and their tree, as OneFellSwoop); scripts/inca-geo.json
// (the realm of 1532 after the Commons "Inca Expansion.svg"); the royal-road chains as
// listed in the build script. Both trees are SCHEMATIC.
export type P2 = [number, number];
export const PROJ = { scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export type TreeNode = { name: string; lon: number; lat: number; x: number; y: number; /** index of its parent, -1 = the capital */ parent: number };
/** Tenochtitlan and Cuzco (world px) */
export const TENOCHTITLAN: P2 = ${JSON.stringify(TEN.map(r3))};
export const CUZCO: P2 = ${JSON.stringify(CUZCO.map(r3))};
/** the Aztec empire 1519 (evenodd), its land borders, its box */
export const EMPIRE_D = ${JSON.stringify(EMPIRE_D)};
export const EMPIRE_BORDER_D = ${JSON.stringify(EMPIRE_BORDER_D)};
export const EMPIRE_BOX = ${JSON.stringify(EMPIRE_BOX)};
export const AZTEC_TREE: TreeNode[] = ${JSON.stringify(AZ_TREE)};
/** Tawantinsuyu 1532 (evenodd), its land border, its box */
export const REALM_D = ${JSON.stringify(REALM_D)};
export const REALM_BORDER_D = ${JSON.stringify(REALM_BORDER_D)};
export const REALM_BOX = ${JSON.stringify(REALM_BOX)};
export const INCA_TREE: TreeNode[] = ${JSON.stringify(INCA_TREE)};
`,
);
console.log(`Wrote ${OUT_STATIC} (land ${LAND_D.length}) and ${OUT} (empire ${EMPIRE_D.length}, realm ${REALM_D.length})`);
