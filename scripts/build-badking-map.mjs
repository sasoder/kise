// Bakes the geometry of THE INDIAN SUBCONTINENT c. 1756 for the cut
// SoonerOrLaterABadKing (clip "Sheppard: East India kings", Dwarkesh with Si
// Sheppard; Dwarkesh map style).
//
//   bun scripts/build-badking-map.mjs
//
// Reads Natural Earth 10m land (the installed world-atlas). Writes
//   generated/components/SoonerOrLaterABadKingStatic.ts   the heavy STATIC
//       layers (land, water-line land, graticule), read only by
//       scripts/bake-badking-rasters.mjs
//   generated/components/SoonerOrLaterABadKingMapData.ts  projection, the
//       seats, Calcutta / Plassey, the advance's polyline (from the sea), the land round
//       Murshidabad (the hatch's clip)
//
// THE PROJECTION: north-up Lambert conformal conic, standard parallels 12 N /
// 28 N, centre meridian 80 E. World px == screen px at THE WIDE (camera { k: 1,
// cx: 540, cy: 960 }): 48 px per degree of latitude on the centre meridian
// (lon ~68 ... 92 E across the 1080 px: Gujarat to the Bengal delta), with
// Hyderabad's parallel at y 1072 so that no crown stands in the caption strip
// (y 1080 ... 1250) in the wide.
//
// NO BORDERS OF ANY KIND are baked: the modern ones did not exist in 1756 and
// we hold no period border data. Land, coast, graticule only.

import { readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicConformal } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT_STATIC = "generated/components/SoonerOrLaterABadKingStatic.ts";
const OUT = "generated/components/SoonerOrLaterABadKingMapData.ts";

// ---------------------------------------------------------------------------
// projection
// ---------------------------------------------------------------------------
const PARALLELS = [12, 28];
const ROTATE = [-80, 0];
const LAT_PX = 48; // px per degree of latitude on the centre meridian at 21 N
const ANCHOR = { ll: [80, 17.38], y: 1072 }; // Hyderabad's parallel on the centre meridian
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(1).translate([0, 0]);
{
  const a = projection([80, 20.5]);
  const b = projection([80, 21.5]);
  projection.scale(LAT_PX / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const c = projection(ANCHOR.ll);
  projection.translate([540 - c[0], ANCHOR.y - c[1]]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const P = (ll) => projection(ll);
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const PX_PER_KM = dist(P([80, 21]), P([80, 22])) / 111.19;
console.log(`scale ${SCALE.toFixed(2)}, translate ${TRANSLATE.map((v) => v.toFixed(2))}, ${PX_PER_KM.toFixed(4)} world px per km`);

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
const rectPoly = (x0, y0, x1, y1) => [
  [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
    [x0, y0],
  ],
];

// ---------------------------------------------------------------------------
// LAND (Natural Earth 10m): clipped in lon/lat first (Afro-Eurasia is one
// ring), then projected and clipped to the world rect; graticule
// ---------------------------------------------------------------------------
const RECT = { x0: -420, x1: 1500, y0: -420, y1: 2340 };
const VIEW = { lon: [52, 108], lat: [-6, 50] };
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
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const landLL = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    const b = llBox(rings[0]);
    if (b.x1 < VIEW.lon[0] || b.x0 > VIEW.lon[1] || b.y1 < VIEW.lat[0] || b.y0 > VIEW.lat[1]) continue;
    if (geoArea({ type: "Polygon", coordinates: [rings[0]] }) > 2 * Math.PI) continue;
    landLL.push(rings);
  }
const landW = polygonClipping.intersection(landLL, rectPoly(VIEW.lon[0], VIEW.lat[0], VIEW.lon[1], VIEW.lat[1])).map((poly) => poly.map((r) => r.map(P)));
{
  const c = [P([VIEW.lon[0], VIEW.lat[0]]), P([VIEW.lon[1], VIEW.lat[0]]), P([VIEW.lon[0], VIEW.lat[1]]), P([VIEW.lon[1], VIEW.lat[1]])];
  console.log(`lon/lat view corners (world px): ${c.map((q) => q.map((v) => v.toFixed(0)).join(",")).join(" | ")}`);
}
const LANDW = polygonClipping.intersection(landW, rectPoly(RECT.x0, RECT.y0, RECT.x1, RECT.y1));
const WL_MIN_KM2 = 150;
const LAND_WL = LANDW.filter((poly) => Math.abs(ringArea(poly[0])) / (PX_PER_KM * PX_PER_KM) >= WL_MIN_KM2);
console.log(`land: ${LANDW.length} polygons in the rect (${LAND_WL.length} of them >= ${WL_MIN_KM2} km2 carry water-lines)`);
const LAND_D = multiD(LANDW);
const LAND_WL_D = multiD(LAND_WL);

let GRATICULE_D = "";
for (let lon = 50; lon <= 110; lon += 5) {
  const pts = [];
  for (let lat = -5; lat <= 50; lat += 0.5) pts.push(P([lon, lat]));
  GRATICULE_D += toD(pts);
}
for (let lat = -5; lat <= 50; lat += 5) {
  const pts = [];
  for (let lon = 50; lon <= 110; lon += 0.5) pts.push(P([lon, lat]));
  GRATICULE_D += toD(pts);
}

// even-odd land test over the clipped land
const isLand = (x, y) => {
  let c = false;
  for (const poly of LANDW)
    for (const ring of poly)
      for (let i = 1; i < ring.length; i++) {
        const [ax, ay] = ring[i - 1];
        const [bx, by] = ring[i];
        if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
      }
  return c;
};

// ---------------------------------------------------------------------------
// THE SEATS of hereditary rulers c. 1756 (lon/lat as briefed by the director)
// ---------------------------------------------------------------------------
const SEATS = [
  ["delhi", "Delhi", 77.23, 28.65],
  ["jaipur", "Jaipur", 75.82, 26.92],
  ["faizabad", "Faizabad (Awadh)", 82.15, 26.77],
  ["murshidabad", "Murshidabad (Bengal)", 88.27, 24.18],
  ["pune", "Pune", 73.86, 18.52],
  ["hyderabad", "Hyderabad", 78.47, 17.38],
  ["srirangapatna", "Srirangapatna (Mysore)", 76.69, 12.42],
  ["arcot", "Arcot", 79.33, 12.91],
].map(([key, name, lon, lat]) => {
  const p = P([lon, lat]);
  return { key, name, lon, lat, x: r3(p[0]), y: r3(p[1]) };
});
for (const s of SEATS) console.log(`  ${s.name.padEnd(24)} (${s.x.toFixed(1)}, ${s.y.toFixed(1)}) ${isLand(s.x, s.y) ? "land" : "SEA"}`);

const CALCUTTA_LL = [88.36, 22.57];
const PLASSEY_LL = [88.25, 23.8];
const MURSHIDABAD_LL = [88.27, 24.18];
const CALCUTTA = P(CALCUTTA_LL);
const PLASSEY = P(PLASSEY_LL);
const MURSHIDABAD = P(MURSHIDABAD_LL);
console.log(`  Calcutta (${CALCUTTA.map((v) => v.toFixed(1))}) ${isLand(...CALCUTTA) ? "land" : "SEA"}; Plassey (${PLASSEY.map((v) => v.toFixed(1))}) ${isLand(...PLASSEY) ? "land" : "SEA"}`);

// THE ADVANCE: from the sea at the head of the Bay of Bengal, through Calcutta
// and Plassey to Murshidabad: a centripetal-free uniform Catmull-Rom through
// the four points (they lie almost on one meridian), sampled
const SEA_START_LL = [88.3, 20.2]; // open water, well out in the bay
const SEA_START = P(SEA_START_LL);
console.log(`  advance starts at sea (${SEA_START.map((v) => v.toFixed(1))}) ${isLand(...SEA_START) ? "LAND (!)" : "sea"}`);
const ADVANCE = (() => {
  const pts = [SEA_START, CALCUTTA, PLASSEY, MURSHIDABAD];
  const ext = [[2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]], ...pts, [2 * pts[3][0] - pts[2][0], 2 * pts[3][1] - pts[2][1]]];
  const out = [pts[0].map(r3)];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    for (let q = 1; q <= 24; q++) {
      const t = q / 24;
      out.push([0, 1].map((c) => r3(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t * t * t))));
    }
  }
  return out;
})();

// the land round Murshidabad (the hatch disc's clip)
const HATCH_R = 92; // world px: the clip window's half-size
const BENGAL_LAND = polygonClipping.intersection(LANDW, rectPoly(MURSHIDABAD[0] - HATCH_R, MURSHIDABAD[1] - HATCH_R, MURSHIDABAD[0] + HATCH_R, MURSHIDABAD[1] + HATCH_R));
const BENGAL_LAND_D = multiD(BENGAL_LAND);
console.log(`land round Murshidabad: ${BENGAL_LAND.length} polygon(s), ${BENGAL_LAND_D.length} chars`);

// INDIA's label anchor: the open middle of the subcontinent
const INDIA_AT = P([79.4, 22.35]);

// THE SHIP (an East Indiaman): its bow sails from far down the bay to just off the Hooghly mouth
const SHIP_FROM = P([87.5, 11.3]);
const SHIP_STOP = P([89.14, 21.1]);
console.log(`  ship from (${SHIP_FROM.map((v) => v.toFixed(1))}) ${isLand(...SHIP_FROM) ? "LAND (!)" : "sea"} to (${SHIP_STOP.map((v) => v.toFixed(1))}) ${isLand(...SHIP_STOP) ? "LAND (!)" : "sea"}`);

writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-badking-map.mjs — do not edit by hand.
// The heavy STATIC layers of the Indian subcontinent (world px), read only by
// scripts/bake-badking-rasters.mjs. Natural Earth 10m land (world-atlas),
// clipped to x ${RECT.x0}..${RECT.x1}, y ${RECT.y0}..${RECT.y1}. No borders.
/** land (evenodd) */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** land of >= ${WL_MIN_KM2} km2 (the engraved water-lines run round these only) */
export const LAND_WL_D = ${JSON.stringify(LAND_WL_D)};
/** 5 degree graticule */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
writeFileSync(
  OUT,
  `// Generated by scripts/build-badking-map.mjs — do not edit by hand.
// THE INDIAN SUBCONTINENT c. 1756 for SoonerOrLaterABadKing. Lambert conformal
// conic, parallels ${PARALLELS.join(" N / ")} N, centre meridian ${-ROTATE[0]} E. World px == screen px at
// the wide (k 1): ${PX_PER_KM.toFixed(4)} world px per km. Natural Earth 10m land; no borders.
export type P2 = [number, number];
export const PROJ = { parallels: ${JSON.stringify(PARALLELS)} as [number, number], rotate: ${JSON.stringify(ROTATE)} as [number, number], scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export const PX_PER_KM = ${PX_PER_KM.toFixed(4)};
/** the seats of hereditary rulers (world px) */
export type Seat = { key: string; name: string; lon: number; lat: number; x: number; y: number };
export const SEATS: Seat[] = ${JSON.stringify(SEATS)};
export const CALCUTTA: P2 = ${JSON.stringify(CALCUTTA.map(r3))};
export const PLASSEY: P2 = ${JSON.stringify(PLASSEY.map(r3))};
export const MURSHIDABAD: P2 = ${JSON.stringify(MURSHIDABAD.map(r3))};
/** the advance: the sea at the head of the bay -> Calcutta -> Plassey -> Murshidabad (world px polyline) */
export const ADVANCE: P2[] = ${JSON.stringify(ADVANCE)};
/** the land within ${HATCH_R} world px of Murshidabad (evenodd): the hatch disc's clip */
export const BENGAL_LAND_D = ${JSON.stringify(BENGAL_LAND_D)};
/** the label's anchor */
export const INDIA_AT: P2 = ${JSON.stringify(INDIA_AT.map(r3))};
/** the ship's bow: where it starts (far down the bay) and where it anchors (off the Hooghly mouth) */
export const SHIP_FROM: P2 = ${JSON.stringify(SHIP_FROM.map(r3))};
export const SHIP_STOP: P2 = ${JSON.stringify(SHIP_STOP.map(r3))};
`,
);
console.log(`Wrote ${OUT_STATIC} (land ${LAND_D.length}, water-line land ${LAND_WL_D.length}, graticule ${GRATICULE_D.length}) and ${OUT}`);
