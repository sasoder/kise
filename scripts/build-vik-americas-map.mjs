// Bakes the geometry of THE AMERICAS WORLD of the clip "Sheppard_Vikings"
// (Dwarkesh with Si Sheppard; Dwarkesh map style), shared by cut A
// (LearningFromEachOther) and cut B (IncasEvenKnewTheAztecs).
//
//   bun scripts/build-vik-americas-map.mjs
//
// Reads Natural Earth 10m land (installed world-atlas), scripts/cortes-geo.json
// (the georeferenced Aztec Empire c. 1519 after the Commons "Aztec Empire 1519
// map-fr.svg") and scripts/inca-geo.json (Tawantinsuyu c. 1532 after the Commons
// "Inca Expansion.svg"; Lakes Titicaca and Poopo from Natural Earth 10m lakes).
// Neither json is edited. Writes
//   generated/components/vikAmericasStatic.ts   the heavy STATIC layers (land,
//       lakes, graticule), read only by scripts/bake-vik-americas-rasters.mjs
//   generated/components/vikAmericasMapData.ts  the light OVERLAYS drawn as
//       vectors (see vikAmericasShared.tsx)
//
// THE PROJECTION: north-up spherical MERCATOR (low latitudes, no meridian lean).
//   x = 540 + (lon + 85) * 20        y = 843 - 20 * M(lat)
//   M(lat) = (180 / pi) ln tan(pi / 4 + lat / 2)     (degrees of "Mercator latitude")
// 20 world px per degree of longitude (and per degree of latitude at the
// equator); world px == screen px in THE WIDE (camera { k: 1, cx: 540, cy: 960 }):
// lon 112 W .. 58 W spans the 1080 px width, lat 22 N on y 392, the equator on
// y 843, Cuzco on y 1116.
//
// NOTHING PERIOD-WRONG: coastlines and two Andean lakes only; no borders.
//
// THE REALMS (cream, the native states; each clipped to land):
//   AZTEC = the outer ring of the tributary provinces + the Soconusco exclave.
//           At this map's scale (the whole empire is ~230 px wide in the wide)
//           the two independent enclaves the source draws as holes (Tlaxcala,
//           Teotitlan) are generalised away: this realm is never seen close.
//   INCA  = the 1532 realm (union of the expansion phases), minus the two lakes.
// THE PLAYBOOK CHAIN (orange): the path of an IDEA, not a ship's log. Two clean
//   bows: Santo Domingo -> Tenochtitlan north over Cuba and the Gulf (Cortes:
//   Hispaniola 1504, Mexico 1519-21); Tenochtitlan -> Cajamarca west over the open
//   Pacific (the playbook reaching Pizarro, Cajamarca 1532).
// THE DEAD TIES (cream): from the Aztec realm's south-east end (Soconusco) along
//   the Pacific slope of Central America toward Nicaragua; from the Inca realm's
//   northern tip up Colombia's Pacific side toward the Darien. Both on land, both
//   stop far short of each other, neither on the orange line's path.

import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT_STATIC = "generated/components/vikAmericasStatic.ts";
const OUT = "generated/components/vikAmericasMapData.ts";
const AZ = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));
const INCA = JSON.parse(readFileSync("scripts/inca-geo.json", "utf8"));

// ---------------------------------------------------------------------------
// THE PROJECTION
// ---------------------------------------------------------------------------
const PROJ = { pxPerDeg: 20, lon0: -85, x0: 540, yEq: 843 };
const mercDeg = (lat) => (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const P = ([lon, lat]) => [PROJ.x0 + (lon - PROJ.lon0) * PROJ.pxPerDeg, PROJ.yEq - PROJ.pxPerDeg * mercDeg(lat)];
const INV = ([x, y]) => [PROJ.lon0 + (x - PROJ.x0) / PROJ.pxPerDeg, (Math.atan(Math.exp(((PROJ.yEq - y) / PROJ.pxPerDeg) * (Math.PI / 180))) * 360) / Math.PI - 90];
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
// the world the static layers are baked over (every level lies inside it)
const CLIP = { x0: -900, y0: -700, x1: 1980, y1: 2600 };

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i], pts[i - 1]));
  return c;
};
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
const close = (r) => (dist(r[0], r[r.length - 1]) < 1e-9 ? r : [...r, r[0]]);
/** a ring as an svg path, dropping steps under minStep world px */
const ringD = (ring, minStep = 0.1) => {
  let out = "";
  let prev = null;
  let n = 0;
  for (let i = 0; i < ring.length; i++) {
    const q = ring[i];
    if (prev && i < ring.length - 1 && dist(q, prev) < minStep) continue;
    out += `${prev ? "L" : "M"}${r2(q[0])},${r2(q[1])}`;
    prev = q;
    n++;
  }
  return n >= 3 ? `${out}Z` : "";
};
const multiD = (mp, minStep = 0.05) => mp.map((poly) => poly.map((ring) => ringD(ring, minStep)).join("")).join("");
const roundMulti = (mp) => mp.map((poly) => poly.map((ring) => ring.map(([x, y]) => [r2(x), r2(y)])));
const areaMulti = (mp) => mp.reduce((s, poly) => s + Math.abs(ringArea(poly[0])) - poly.slice(1).reduce((t, h) => t + Math.abs(ringArea(h)), 0), 0);
const toD = (pts) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}`;
/** open centripetal Catmull-Rom through every point (end tangents mirrored), ~step apart;
 *  idx[i] = the sample index of source point i */
const catmullOpen = (pts, step = 0.5) => {
  const ext = [
    [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]],
    ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]],
  ];
  const out = [pts[0]];
  const idx = [0];
  const knot = (p, q) => Math.pow(dist(p, q), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const m = Math.max(2, Math.ceil(dist(p1, p2) / step));
    for (let s = 1; s <= m; s++) {
      const t = t1 + ((t2 - t1) * s) / m;
      const lerp = (A, B, ta, tb) => [((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0], ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1]];
      const A1 = lerp(p0, p1, 0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, 0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
    idx.push(out.length - 1);
  }
  return { pts: out, idx };
};

// ---------------------------------------------------------------------------
// LAND (Natural Earth 10m) in world px
// ---------------------------------------------------------------------------
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
const clampLL = ([lon, lat]) => [lon, Math.max(-70, Math.min(72, lat))];
const landW = []; // every land polygon of the western hemisphere stage, world px
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    const b = llBox(rings[0]);
    if (b.x1 < -160 || b.x0 > -28 || b.y1 < -60 || b.y0 > 58) continue;
    if (b.x1 - b.x0 > 170) continue; // rings that straddle the antimeridian (Fiji, Chukotka): not this hemisphere
    landW.push(rings.map((r) => r.map((ll) => P(clampLL(ll)))));
  }
// only what touches the baked rect
const boxW = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of ring) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1 };
};
const LANDW = landW.filter((rings) => {
  const b = boxW(rings[0]);
  return b.x1 > CLIP.x0 && b.x0 < CLIP.x1 && b.y1 > CLIP.y0 && b.y0 < CLIP.y1;
});
const LAND_D = multiD(LANDW, 0.1);
console.log(`land: ${LANDW.length} polygons, path ${(LAND_D.length / 1e6).toFixed(2)} MB`);

// coast segments on a grid, for isLand / coastDist (the Cortes build's)
const coastSegs = [];
for (const poly of LANDW) for (const ring of poly) for (let i = 1; i < ring.length; i++) coastSegs.push([...ring[i - 1], ...ring[i]]);
const BUCKET = 6;
const segGrid = new Map();
const rowGrid = new Map();
coastSegs.forEach(([ax, ay, bx, by], i) => {
  const i0 = Math.floor(Math.min(ax, bx) / BUCKET);
  const i1 = Math.floor(Math.max(ax, bx) / BUCKET);
  const j0 = Math.floor(Math.min(ay, by) / BUCKET);
  const j1 = Math.floor(Math.max(ay, by) / BUCKET);
  if (i1 - i0 < 400 && j1 - j0 < 400)
    for (let a = i0; a <= i1; a++)
      for (let b = j0; b <= j1; b++) {
        const k = `${a},${b}`;
        if (!segGrid.has(k)) segGrid.set(k, []);
        segGrid.get(k).push(i);
      }
  for (let b = j0; b <= j1; b++) {
    if (!rowGrid.has(b)) rowGrid.set(b, []);
    rowGrid.get(b).push(i);
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
const coastDist = (x, y, max = 60) => {
  let best = Infinity;
  const R = Math.ceil(max / BUCKET);
  const i0 = Math.floor(x / BUCKET);
  const j0 = Math.floor(y / BUCKET);
  for (let ring = 0; ring <= R; ring++) {
    for (let a = i0 - ring; a <= i0 + ring; a++)
      for (let b = j0 - ring; b <= j0 + ring; b++) {
        if (Math.max(Math.abs(a - i0), Math.abs(b - j0)) !== ring) continue;
        for (const i of segGrid.get(`${a},${b}`) ?? []) {
          const [ax, ay, bx, by] = coastSegs[i];
          const dx = bx - ax;
          const dy = by - ay;
          const l2 = dx * dx + dy * dy || 1e-12;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
          best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
        }
      }
    if (best <= ring * BUCKET) break;
  }
  return best;
};

// ---------------------------------------------------------------------------
// LAKES (Titicaca, Poopo) and the GRATICULE (every 10 degrees: ~200 px squares in
// the wide, the screen density of the Cortes world's 5 degree lines)
// ---------------------------------------------------------------------------
const LAKES_W = INCA.lakes.items.map((it) => it.rings.map((r) => r.map(P)));
const LAKES_D = multiD(LAKES_W, 0.02);
let GRATICULE_D = "";
for (let lon = -150; lon <= -20; lon += 10) {
  const x = r2(P([lon, 0])[0]);
  GRATICULE_D += `M${x},${CLIP.y0}L${x},${CLIP.y1}`;
}
for (let lat = -60; lat <= 60; lat += 10) {
  const y = r2(P([0, lat])[1]);
  GRATICULE_D += `M${CLIP.x0},${y}L${CLIP.x1},${y}`;
}

// ---------------------------------------------------------------------------
// SITES
// ---------------------------------------------------------------------------
const SITE_LL = {
  santoDomingo: [-69.9, 18.47],
  santiago: [-75.83, 20.02],
  veracruz: [-96.15, 19.19],
  tenochtitlan: [-99.13, 19.43],
  panama: [-79.53, 8.95],
  tumbes: [-80.45, -3.57],
  cajamarca: [-78.51, -7.16],
  cuzco: [-71.97, -13.53],
};
const SITES = Object.fromEntries(Object.entries(SITE_LL).map(([k, ll]) => [k, { x: r3(P(ll)[0]), y: r3(P(ll)[1]), lon: ll[0], lat: ll[1] }]));
for (const [k, s] of Object.entries(SITES)) console.log(`site ${k.padEnd(13)} world (${s.x.toFixed(1)}, ${s.y.toFixed(1)}) land ${isLand(s.x, s.y)} coast ${coastDist(s.x, s.y).toFixed(2)} px`);

// ---------------------------------------------------------------------------
// THE REALMS
// ---------------------------------------------------------------------------
const regionBox = (lon0, lon1, lat0, lat1) => {
  const a = P([lon0, lat1]);
  const b = P([lon1, lat0]);
  return [[[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]], [a[0], a[1]]]];
};
const landIn = (box) => polygonClipping.intersection(LANDW, box);
const [AZ_OUTER, , , AZ_SOCO] = AZ.aztec_empire_1519.rings;
const LAND_MEX = landIn(regionBox(-108, -86, 11, 26));
const AZTEC = polygonClipping.intersection(polygonClipping.union([close(AZ_OUTER.map(P))], [close(AZ_SOCO.map(P))]), LAND_MEX);
const LAND_AND = landIn(regionBox(-84, -60, -40, 6));
const INCA_R = polygonClipping.difference(
  polygonClipping.intersection([close(INCA.realm_1532.outer.map(P))], LAND_AND),
  ...LAKES_W.map((rings) => [close(rings[0])]),
);
const realmStats = (mp, capital) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  let rMax = 0;
  let ax = 0;
  let ay = 0;
  let A = 0;
  for (const poly of mp) {
    const ring = poly[0];
    const a = Math.abs(ringArea(ring));
    let cx = 0;
    let cy = 0;
    for (const p of ring) {
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
      rMax = Math.max(rMax, dist(p, capital));
      cx += p[0];
      cy += p[1];
    }
    ax += (cx / ring.length) * a;
    ay += (cy / ring.length) * a;
    A += a;
  }
  return { box: { x0: r2(x0), x1: r2(x1), y0: r2(y0), y1: r2(y1) }, rMax: r2(rMax), centroid: [r2(ax / A), r2(ay / A)] };
};
const TEN = [SITES.tenochtitlan.x, SITES.tenochtitlan.y];
const CUZ = [SITES.cuzco.x, SITES.cuzco.y];
const AZ_STATS = realmStats(AZTEC, TEN);
const INCA_STATS = realmStats(INCA_R, CUZ);
console.log(`Aztec realm: ${AZTEC.length} polygons, ${areaMulti(AZTEC).toFixed(0)} world px2, box ${JSON.stringify(AZ_STATS.box)}, rMax ${AZ_STATS.rMax}`);
console.log(`Inca realm: ${INCA_R.length} polygons, ${areaMulti(INCA_R).toFixed(0)} world px2, box ${JSON.stringify(INCA_STATS.box)}, rMax ${INCA_STATS.rMax}`);

// ---------------------------------------------------------------------------
// THE PLAYBOOK CHAIN
// ---------------------------------------------------------------------------
// CHANGED 2026-10-06 (director's review): the chain is knowledge handed on, not a
// ship's track. TWO CLEAN BOWS, nothing else (quadratic Beziers, world px):
//   leg 1  Santo Domingo -> Tenochtitlan, bowing NORTH over Cuba and the Gulf
//   leg 2  Tenochtitlan -> Cajamarca, bowing WEST out over the open Pacific,
//          well clear of Central America (the land bridge belongs to the ties)
// Leg 1 arrives at Tenochtitlan heading west-south-west, leg 2 leaves it heading
// south. Santiago, Veracruz, Panama and Tumbes are no longer ON the line: their
// CHAIN_S entries are kept (never rename an export) as the arclength of the
// chain's nearest point to each.
const bow = (A, C, B, step = 0.5) => {
  const n = Math.ceil((dist(A, C) + dist(C, B)) / step);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([u * u * A[0] + 2 * u * t * C[0] + t * t * B[0], u * u * A[1] + 2 * u * t * C[1] + t * t * B[1]]);
  }
  const cum = cumOf(pts);
  return { pts, cum, len: cum[cum.length - 1] };
};
const SD = [SITES.santoDomingo.x, SITES.santoDomingo.y];
const CAJ = [SITES.cajamarca.x, SITES.cajamarca.y];
const LEG1_C = [550, 255];
const LEG2_C = [236, 940];
const L1 = bow(SD, LEG1_C, TEN);
const L2 = bow(TEN, LEG2_C, CAJ);
const CHAIN_PTS = [...L1.pts, ...L2.pts.slice(1)];
const CHAIN_LEN = L1.len + L2.len;
const nearestS = (key) => {
  const q = [SITES[key].x, SITES[key].y];
  const cum = cumOf(CHAIN_PTS);
  let best = 0;
  let bd = Infinity;
  CHAIN_PTS.forEach((p, i) => {
    const d = dist(p, q);
    if (d < bd) [bd, best] = [d, cum[i]];
  });
  return best;
};
const CHAIN_S = {
  santoDomingo: 0,
  santiago: nearestS("santiago"),
  veracruz: nearestS("veracruz"),
  tenochtitlan: L1.len,
  panama: nearestS("panama"),
  tumbes: nearestS("tumbes"),
  cajamarca: CHAIN_LEN,
};
console.log(`chain: leg 1 ${L1.len.toFixed(1)} + leg 2 ${L2.len.toFixed(1)} = ${CHAIN_LEN.toFixed(1)} world px; stops ${JSON.stringify(Object.fromEntries(Object.entries(CHAIN_S).map(([k, v]) => [k, r2(v)])))}`);
{
  const xs = L2.pts.map((q) => q[0]);
  const ys1 = L1.pts.map((q) => q[1]);
  const sea = L2.pts.filter((q, i) => L2.cum[i] > 90 && L2.cum[i] < L2.len - 40 && isLand(q[0], q[1])).length;
  console.log(`leg 1 apex y ${Math.min(...ys1).toFixed(1)}; leg 2 westmost x ${Math.min(...xs).toFixed(1)}, mid (${L2.pts[L2.pts.length >> 1].map((v) => v.toFixed(0))}); leg 2 samples on land between its ends: ${sea}`);
  if (sea) throw new Error("leg 2 touches land between Mexico and Peru");
}

// ---------------------------------------------------------------------------
// THE DEAD TIES
// ---------------------------------------------------------------------------
const nearestVertex = (mp, target) => {
  let best = null;
  let bd = Infinity;
  for (const poly of mp)
    for (const p of poly[0]) {
      const d = dist(p, target);
      if (d < bd) [bd, best] = [d, p];
    }
  return best;
};
const tieOf = (start, lls, name) => {
  const pts = catmullOpen([start, ...lls.map(P)], 0.4).pts;
  const cum = cumOf(pts);
  const sea = pts.filter((q) => !isLand(q[0], q[1])).length;
  console.log(`tie ${name}: ${cum[cum.length - 1].toFixed(1)} world px, ${sea}/${pts.length} samples over water`);
  if (sea > pts.length * 0.12) throw new Error(`the ${name} tie leaves the land`);
  return { pts, len: cum[cum.length - 1] };
};
const TIE_AZ = tieOf(
  nearestVertex(AZTEC, P([-92.25, 14.75])),
  [
    [-91.1, 14.4],
    [-89.4, 13.85],
    [-88.0, 13.65],
    [-86.95, 12.8],
    [-86.1, 11.9],
    [-85.4, 11.15],
  ],
  "Aztec",
);
const incaNorth = (() => {
  let best = null;
  for (const poly of INCA_R) for (const p of poly[0]) if (!best || p[1] < best[1]) best = p;
  return best;
})();
const TIE_IN = tieOf(
  incaNorth,
  [
    [-76.9, 2.6],
    [-76.3, 4.0],
    [-76.0, 5.4],
    [-76.15, 6.7],
    [-76.7, 7.7],
    [-77.5, 8.35],
  ],
  "Inca",
);
{
  const a = TIE_AZ.pts[TIE_AZ.pts.length - 1];
  const b = TIE_IN.pts[TIE_IN.pts.length - 1];
  console.log(`the gap between the two ties' far ends: ${dist(a, b).toFixed(1)} world px`);
  let m = Infinity;
  for (const t of [TIE_AZ, TIE_IN]) for (let i = 0; i < t.pts.length; i += 2) for (let j = 0; j < CHAIN_PTS.length; j += 2) m = Math.min(m, dist(t.pts[i], CHAIN_PTS[j]));
  console.log(`ties: closest approach to the orange chain ${m.toFixed(1)} world px`);
  if (m < 60) throw new Error("a tie runs within 60 world px of the chain");
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-vik-americas-map.mjs — do not edit by hand.
// The STATIC layers of the Americas world (clip Sheppard_Vikings), read only by
// scripts/bake-vik-americas-rasters.mjs. Natural Earth 10m land (public domain;
// no borders) + Lakes Titicaca and Poopo, north-up Mercator, 20 world px per
// degree of longitude. World px == screen px in the k 1 wide.

/** Land, one path (evenodd). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** Lakes Titicaca and Poopo (water). */
export const LAKES_D = ${JSON.stringify(LAKES_D)};
/** 10 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
/** the rect the layers are meaningful over */
export const CLIP = ${JSON.stringify(CLIP)};
`,
);
const pts3 = (pts) => JSON.stringify(pts.map(([x, y]) => [r3(x), r3(y)]));
writeFileSync(
  OUT,
  `// Generated by scripts/build-vik-americas-map.mjs — do not edit by hand.
// The light OVERLAYS of the Americas world (see vikAmericasShared.tsx for the API).
// North-up Mercator: x = ${PROJ.x0} + (lon - (${PROJ.lon0})) * ${PROJ.pxPerDeg}, y = ${PROJ.yEq} - ${PROJ.pxPerDeg} * M(lat).
// Sources: scripts/cortes-geo.json (Aztec Empire c. 1519 after the Commons "Aztec
// Empire 1519 map-fr.svg"), scripts/inca-geo.json (Tawantinsuyu c. 1532 after the
// Commons "Inca Expansion.svg"; lakes from Natural Earth), Natural Earth 10m land.
export type P2 = [number, number];
export type Site = { x: number; y: number; lon: number; lat: number };
export type RealmData = { d: string; polys: P2[][][]; capital: P2; rMax: number; centroid: P2; box: { x0: number; x1: number; y0: number; y1: number } };

export const PROJ = ${JSON.stringify(PROJ)};

/** sites (world px + lon/lat) */
export const SITES: Record<"santoDomingo" | "santiago" | "veracruz" | "tenochtitlan" | "panama" | "tumbes" | "cajamarca" | "cuzco", Site> = ${JSON.stringify(SITES)};

/** THE AZTEC REALM c. 1519 (outer ring + Soconusco, clipped to land; evenodd) */
export const AZTEC_REALM: RealmData = {
  d: ${JSON.stringify(multiD(AZTEC))},
  polys: ${JSON.stringify(roundMulti(AZTEC))},
  capital: ${JSON.stringify(TEN)},
  rMax: ${AZ_STATS.rMax},
  centroid: ${JSON.stringify(AZ_STATS.centroid)},
  box: ${JSON.stringify(AZ_STATS.box)},
};
/** THE INCA REALM c. 1532 (clipped to land, Lakes Titicaca and Poopo removed; evenodd) */
export const INCA_REALM: RealmData = {
  d: ${JSON.stringify(multiD(INCA_R))},
  polys: ${JSON.stringify(roundMulti(INCA_R))},
  capital: ${JSON.stringify(CUZ)},
  rMax: ${INCA_STATS.rMax},
  centroid: ${JSON.stringify(INCA_STATS.centroid)},
  box: ${JSON.stringify(INCA_STATS.box)},
};

/** THE PLAYBOOK CHAIN: one polyline, two bows: leg 1 Santo Domingo -> Tenochtitlan (north over
 *  Cuba and the Gulf), leg 2 Tenochtitlan -> Cajamarca (west over the open Pacific). CHAIN_S =
 *  arclength (world px): exact for santoDomingo / tenochtitlan / cajamarca; for the others (no
 *  longer on the line) the chain's nearest point */
export const CHAIN_PTS: P2[] = ${pts3(CHAIN_PTS)};
export const CHAIN_LEN = ${r3(CHAIN_LEN)};
export const CHAIN_S: Record<"santoDomingo" | "santiago" | "veracruz" | "tenochtitlan" | "panama" | "tumbes" | "cajamarca", number> = ${JSON.stringify(
    Object.fromEntries(Object.entries(CHAIN_S).map(([k, v]) => [k, r3(v)])),
  )};

/** THE DEAD TIES (each from its realm's edge toward the other, on land, the whole drawn length) */
export const TIE_AZTEC_PTS: P2[] = ${pts3(TIE_AZ.pts)};
export const TIE_AZTEC_LEN = ${r3(TIE_AZ.len)};
export const TIE_INCA_PTS: P2[] = ${pts3(TIE_IN.pts)};
export const TIE_INCA_LEN = ${r3(TIE_IN.len)};
`,
);
console.log(`Wrote ${OUT_STATIC} and ${OUT}`);
