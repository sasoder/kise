// Bakes the Ukraine map for UkraineNotGivingUp (Sarah Paine, "Death ground: why
// regime change is brutal"; Dwarkesh map style): the overlay geometry as flat
// world-px data for the component, and the STATIC map (sea, engraved
// water-lines, graticule, land + hand-coloured rim, dashed borders, coast) as a
// small raster LOD pyramid, so a frame draws a couple of images instead of
// re-rasterising the 10m coastlines of half of Europe.
//
//   bun scripts/maps/sets/deathground/build-deathground-ukraine-map.mjs
//
// Writes
//   generated/components/sarah-death-ground/ukraineDgMapData.ts   overlays: held territory, Ukraine's
//                                              international border, the 2022
//                                              thrust centrelines, places, LOD levels
//   public/deathground/ukraine/lod-*.png       the static map, one image per level
//   public/deathground/ukraine/grain.png       the house paper textures (copied
//   public/deathground/ukraine/mottle.png      from public/manchuria)
//
// THE PROJECTION is north-up Lambert conformal conic, parallels 45.5 / 51.5,
// centre meridian 31.2 E. World px == screen px at the k 1 wide: Ukraine's
// internationally recognised outline (Crimea included) is UA_W px wide, centred
// on x 540, its bbox centred on y UA_CY.
//
// CRIMEA. world-atlas 2.0.2 (Natural Earth 10m admin-0) files Crimea as a
// separate polygon of RUSSIA (polygon 2 of its MultiPolygon). For Ukraine's
// internationally recognised border it is moved back to Ukraine: the borders
// are meshed from a modified collection (Ukraine + Crimea, Russia - Crimea), so
// the Perekop / Chonhar line is NOT drawn as an international border.
//
// HELD TERRITORY, 23 Feb 2022 (the orange): Ukraine minus Crimea minus the
// separatist-held east of Donetsk and Luhansk oblasts. The 2015-2022 line of
// contact is approximated through the brief's points (smoothed, centripetal
// Catmull-Rom), from the Russian border on the Siverskyi Donets to the Azov
// coast near Shyrokyne; Ukraine's ring is spliced at its two nearest vertices.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { feature, merge, mesh } from "topojson-client";
import { Resvg } from "@resvg/resvg-js";

const OUT = "generated/components/sarah-death-ground/ukraineDgMapData.ts";
const TEX_DIR = "public/deathground/ukraine";
const ONLY = process.argv[2]; // bake only this level (or "none")

// -- the fit -----------------------------------------------------------------
const UA_W = 984; // world px: Ukraine's width at k 1 (91 % of the frame)
const UA_CY = 790; // world px: Ukraine's bbox centre y at k 1

// -- sources ------------------------------------------------------------------
const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const geoms = cTopo.objects.countries.geometries;
const RU = geoms.find((g) => g.properties.name === "Russia");
const UA = geoms.find((g) => g.properties.name === "Ukraine");
const ruF = feature(cTopo, RU);
// Find Crimea in Russia's MultiPolygon by a point inside it (Simferopol).
const inRing = (ring, [x, y]) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const CRIMEA_IDX = ruF.geometry.coordinates.findIndex((poly) => inRing(poly[0], [34.1, 45.0]));
if (CRIMEA_IDX < 0) throw new Error("Crimea not found in Russia");
const UA_INTL_OBJ = { type: "MultiPolygon", arcs: [...UA.arcs, RU.arcs[CRIMEA_IDX]], properties: { name: "Ukraine" } };
const RU_OBJ = { type: "MultiPolygon", arcs: RU.arcs.filter((_, i) => i !== CRIMEA_IDX), properties: { name: "Russia" } };
const MOD = { type: "GeometryCollection", geometries: geoms.map((g) => (g === UA ? UA_INTL_OBJ : g === RU ? RU_OBJ : g)) };
const UA_INTL = merge(cTopo, [UA, { type: "Polygon", arcs: RU.arcs[CRIMEA_IDX] }]);

// -- projection -----------------------------------------------------------------
const projection = geoConicConformal().parallels([45.5, 51.5]).rotate([-31.2, 0]).center([0, 48.4]);
projection.scale(1).translate([0, 0]);
{
  const b = geoPath(projection).bounds(UA_INTL);
  projection.scale(UA_W / (b[1][0] - b[0][0]));
  const c = geoPath(projection).bounds(UA_INTL);
  projection.translate([540 - (c[0][0] + c[1][0]) / 2, UA_CY - (c[0][1] + c[1][1]) / 2]);
}
const MARGIN = 420;
const CLIP = [
  [-MARGIN, -MARGIN],
  [1080 + MARGIN, 1920 + MARGIN],
];
projection.clipExtent(CLIP);
const P = (lon, lat) => projection([lon, lat]);

// -- a rounding path sink (the manchuria script's) -----------------------------
const MIN_STEP = 0.18;
const roundingContext = () => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  const n = (v) => {
    const r = Math.round(v * 20) / 20;
    return Object.is(r, -0) ? 0 : r;
  };
  return {
    moveTo(x, y) {
      if (pending) {
        out += `L${n(pending[0])},${n(pending[1])}`;
        pending = null;
      }
      px = x;
      py = y;
      sx = x;
      sy = y;
      out += `M${n(x)},${n(y)}`;
    },
    lineTo(x, y) {
      if (Math.hypot(x - px, y - py) < MIN_STEP) {
        pending = [x, y];
        return;
      }
      pending = null;
      px = x;
      py = y;
      out += `L${n(x)},${n(y)}`;
    },
    closePath() {
      if (pending && Math.hypot(pending[0] - sx, pending[1] - sy) >= MIN_STEP) {
        out += `L${n(pending[0])},${n(pending[1])}`;
      }
      pending = null;
      out += "Z";
    },
    result() {
      return out;
    },
  };
};
const bake = (geo) => {
  const sink = roundingContext();
  geoPath(projection, sink)(geo);
  return sink.result();
};

// -- static geometry --------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
const VIEW = { lon: [0, 70], lat: [25, 72] };
const ringInView = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return x1 >= VIEW.lon[0] && x0 <= VIEW.lon[1] && y1 >= VIEW.lat[0] && y0 <= VIEW.lat[1];
};
const inView = (geometry) => {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const kept = polys.filter((rings) => ringInView(rings[0]));
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
};
const LAND_D = bake({ type: "GeometryCollection", geometries: land.features.map((f) => inView(f.geometry)).filter(Boolean) });
// every land border in view (modern; Crimea with Ukraine), for the dashed layer
const BORDERS_D = bake(mesh(cTopo, MOD, (a, b) => a !== b));
const GRATICULE_D = bake(
  geoGraticule()
    .extent([
      [5, 25],
      [65, 70],
    ])
    .step([5, 5])
    .precision(0.5)(),
);

// -- overlay geometry ---------------------------------------------------------------
const r2 = (v) => Math.round(v * 100) / 100;
const projRing = (ring, minStep = 0.25) => {
  const out = [];
  for (const [lon, lat] of ring) {
    const p = P(lon, lat);
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= minStep) out.push(p);
  }
  return out.map(([x, y]) => [r2(x), r2(y)]);
};
const ringD = (pts) => `M${pts.map(([x, y]) => `${x},${y}`).join("L")}Z`;
const lineD = (pts) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}`;

// Ukraine's international land border (Ukraine + Crimea vs every neighbour).
const INTL_D = bake(mesh(cTopo, MOD, (a, b) => a !== b && (a === UA_INTL_OBJ || b === UA_INTL_OBJ)));

// Centripetal Catmull-Rom through points (any space), sampled.
const catmull = (pts, perSeg = 16) => {
  if (pts.length < 3) return pts.slice();
  const ext = [
    [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]],
    ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]],
  ];
  const out = [pts[0]];
  const knot = (p, q) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  const idx = [0];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t0 = 0;
    const t1 = t0 + knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let s = 1; s <= perSeg; s++) {
      const t = t1 + ((t2 - t1) * s) / perSeg;
      const lerp = (A, B, ta, tb) => [
        ((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0],
        ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1],
      ];
      const A1 = lerp(p0, p1, t0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, t0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
    idx.push(out.length - 1);
  }
  return Object.assign(out, { idx });
};

// THE HELD TERRITORY: Ukraine's mainland ring spliced with the line of contact.
const uaF = feature(cTopo, UA);
const uaPolys = uaF.geometry.coordinates;
const mainIdx = uaPolys.reduce((bi, p, i) => (p[0].length > uaPolys[bi][0].length ? i : bi), 0);
const ring = uaPolys[mainIdx][0];
const nearest = ([lon, lat]) => {
  let best = Infinity;
  let bi = -1;
  ring.forEach(([x, y], i) => {
    const d = Math.hypot((x - lon) * Math.cos((lat * Math.PI) / 180), y - lat);
    if (d < best) {
      best = d;
      bi = i;
    }
  });
  return { i: bi, km: best * 111.2 };
};
// the brief's points, lat, lon, north to south
const CONTACT_LL = [
  [48.7, 39.75],
  [48.73, 39.25],
  [48.7, 38.7],
  [48.66, 38.52],
  [48.43, 38.25],
  [48.28, 38.0],
  [48.14, 37.78],
  [47.94, 37.55],
  [47.75, 37.6],
  [47.45, 37.75],
  [47.09, 37.78],
].map(([la, lo]) => [lo, la]);
const nA = nearest(CONTACT_LL[0]);
const nB = nearest(CONTACT_LL[CONTACT_LL.length - 1]);
let iA = nA.i;
let iB = nB.i;
// the arc iA..iB (ascending) must be the short eastern one
const arcLon = (a, b) => {
  let s = 0;
  for (let i = a; i <= b; i++) s += ring[i][0];
  return s / (b - a + 1);
};
if (iA > iB) [iA, iB] = [iB, iA];
const eastMean = arcLon(iA, iB);
console.log(`contact splice: ring ${ring.length} pts, iA ${iA} (${nA.km.toFixed(1)} km off), iB ${iB} (${nB.km.toFixed(1)} km off), arc mean lon ${eastMean.toFixed(2)}`);
if (!(eastMean > 38.4 && iB - iA < ring.length / 2)) throw new Error("splice: unexpected arc");
const startIsA = Math.hypot(ring[iA][0] - CONTACT_LL[0][0], ring[iA][1] - CONTACT_LL[0][1]) < 0.3;
// the contact line in lon/lat, from ring[iA] to ring[iB], smoothed in lon/lat
const inner = CONTACT_LL.slice(1, -1);
const contactLL = catmull([ring[iA], ...(startIsA ? inner : inner.slice().reverse()), ring[iB]], 10);
const heldMainLL = [...ring.slice(0, iA + 1), ...contactLL.slice(1, -1), ...ring.slice(iB)];
const HELD_RING = projRing(heldMainLL, 0.3);
const HELD_ISLANDS = uaPolys.filter((_, i) => i !== mainIdx).map((p) => projRing(p[0], 0.3));
const HELD_D = [HELD_RING, ...HELD_ISLANDS].map(ringD).join("");
const CONTACT_PTS = projRing(contactLL, 0.3);

// -- the thrusts of 24 Feb 2022 (lon, lat waypoints) ---------------------------------
// Each starts at its staging tail on the attacker's side; ENTRY is where it crosses
// the held territory's edge (the international border, or Crimea's admin line); the
// last point is where it stopped.
const PL = {
  kyiv: [30.52, 50.45],
  chernobyl: [30.22, 51.27],
  irpinStop: [30.22, 50.55], // Hostomel / Bucha / Irpin, ~24 km NW of Kyiv
  brovaryStop: [30.86, 50.54], // the NE edge of Brovary (Skybyn), ~26 km E of Kyiv
  chernihiv: [31.29, 51.49],
  sumy: [34.8, 50.91],
  romny: [33.47, 50.75],
  pryluky: [32.39, 50.59],
  belgorod: [36.59, 50.6],
  kharkiv: [36.23, 49.99],
  kherson: [32.61, 46.64],
  mykolaiv: [31.99, 46.97],
  melitopol: [35.37, 46.85],
  mariupol: [37.55, 47.1],
};
const THRUSTS = {
  // 1. Belarus, down the west bank of the Dnipro via Chernobyl to Hostomel / Irpin
  kyivWest: [[30.32, 52.42], [30.28, 51.8], PL.chernobyl, [30.06, 50.8], PL.irpinStop],
  // 2. Kursk border via Sumy, Romny and Pryluky toward Brovary, east of Kyiv
  kyivEast: [[36.25, 51.55], [35.35, 51.08], PL.sumy, PL.romny, PL.pryluky, [31.45, 50.6], PL.brovaryStop],
  // 2b. Bryansk border to Chernihiv (besieged, never taken)
  chernihiv: [[32.15, 52.93], [31.78, 52.24], [31.52, 51.86], [31.33, 51.6]],
  // 3. Belgorod to Kharkiv (stopped on its northern edge)
  kharkiv: [[37.4, 51.08], PL.belgorod, [36.4, 50.32], [36.27, 50.08]],
  // 4. Crimea north via Perekop to Kherson and toward Mykolaiv
  kherson: [[34.08, 45.32], [33.8, 45.9], [33.69, 46.17], [33.3, 46.47], [32.92, 46.62], PL.kherson, [32.3, 46.83], [32.12, 46.92]],
  // 5. Crimea north-east via Chonhar and Melitopol to Mariupol
  mariupol: [[34.86, 45.2], [34.62, 45.72], [34.6, 46.12], [34.98, 46.55], PL.melitopol, [36.1, 46.9], [36.85, 46.95], [37.47, 47.1]],
};

const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
// first crossing of a polyline with the held ring (world px), as arclength
const segX = (a, b, c, d) => {
  const r = [b[0] - a[0], b[1] - a[1]];
  const s = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
};
const entryS = (pts) => {
  const c = cumOf(pts);
  for (let i = 1; i < pts.length; i++) {
    for (let j = 1; j < HELD_RING.length; j++) {
      const t = segX(pts[i - 1], pts[i], HELD_RING[j - 1], HELD_RING[j]);
      if (t !== null) return c[i - 1] + t * (c[i] - c[i - 1]);
    }
  }
  return null;
};
const thrusts = {};
for (const [key, ll] of Object.entries(THRUSTS)) {
  const w = ll.map(([lo, la]) => P(lo, la));
  const sm = catmull(w, 20);
  const pts = sm.map(([x, y]) => [r2(x), r2(y)]);
  const c = cumOf(pts);
  const len = c[c.length - 1];
  const entry = entryS(pts);
  const wpS = sm.idx.map((i) => r2(c[i]));
  // the f0 stub: its tip a few px short of the edge, on the attacker's side
  // (Kharkiv: at Belgorod, so the thrust has room to travel)
  const stub = key === "kharkiv" ? wpS[1] : entry - 4;
  thrusts[key] = { pts, len: r2(len), entry: r2(entry), stub: r2(stub), wpS };
  console.log(`${key.padEnd(10)} len ${len.toFixed(1)} px  entry ${entry === null ? "NONE" : entry.toFixed(1)}  stub ${thrusts[key].stub}  tail (${pts[0].map((v) => v.toFixed(0))})  tip (${pts[pts.length - 1].map((v) => v.toFixed(0))})`);
}

// -- checks + places ------------------------------------------------------------------
const kmPx = (() => {
  const p = P(31.2, 50);
  const q = P(31.2, 51);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`scale ${projection.scale().toFixed(1)}  ${kmPx.toFixed(4)} world px per km at 50.5 N`);
const L = (ll) => {
  const [x, y] = P(ll[0], ll[1]);
  return { x: r2(x), y: r2(y) };
};
for (const [k, v] of Object.entries(PL)) console.log(`${k.padEnd(12)} (${L(v).x}, ${L(v).y})`);
for (const ll of [[33.0, 53.0], [34.0, 52.8], [35.0, 52.6], [35.5, 52.6], [36.0, 52.4], [37.0, 52.0], [38.5, 51.0], [39.5, 50.0], [32.5, 52.4], [33.5, 52.2]]) console.log(`cand ${ll}  (${L(ll).x}, ${L(ll).y})`);
const uaB = geoPath(projection).bounds(UA_INTL);
console.log(`Ukraine bbox x ${uaB[0][0].toFixed(0)}..${uaB[1][0].toFixed(0)}  y ${uaB[0][1].toFixed(0)}..${uaB[1][1].toFixed(0)}`);

// A parallel as a path, for type set along it (the vintage way).
const parallelPts = (lat, lon0, lon1, steps = 40) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(P(lon0 + ((lon1 - lon0) * i) / steps, lat));
  return pts;
};
const LABEL_UKRAINE = { lat: 49.3, lon0: 27.7, lon1: 36.1 };
const LABEL_RUSSIA = { lat: 52.85, lon0: 32.6, lon1: 38.6 };

// which country is under the RUSSIA label's baseline (its span at k ~1: +-150 px)
{
  const ruI = feature(cTopo, RU_OBJ);
  const by = feature(cTopo, geoms.find((g) => g.properties.name === "Belarus"));
  const inPoly = (f, ll) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates).some((poly) => inRing(poly[0], ll));
  const mid = P((LABEL_RUSSIA.lon0 + LABEL_RUSSIA.lon1) / 2, LABEL_RUSSIA.lat);
  const out = [];
  for (let dx = -150; dx <= 150; dx += 30) {
    for (const dy of [0, -34]) {
      const ll = projection.invert([mid[0] + dx, mid[1] + dy]);
      out.push(`${dx}/${dy}:${inPoly(ruI, ll) ? "RU" : inPoly(by, ll) ? "BY" : "??"}`);
    }
  }
  console.log(`RUSSIA label span: ${out.join(" ")}`);
}

// -- the LOD levels -------------------------------------------------------------------
// Two camera framings matter: the wide (world == screen, k ~1.0-1.06) and the Kyiv push
// close-up. CLOSE is exported so the component's camera and these rects agree.
const KYIV = P(...PL.kyiv);
const CLOSE = { k: 1.94, sx: 440, sy: 785 };
const CLOSE_C = [KYIV[0] - (CLOSE.sx - 540) / CLOSE.k, KYIV[1] - (CLOSE.sy - 960) / CLOSE.k];
const viewOf = (c, k, m = 40) => ({ x0: c[0] - (540 + m) / k, x1: c[0] + (540 + m) / k, y0: c[1] - (960 + m) / k, y1: c[1] + (960 + m) / k });
// union of the views of every camera on the log-k path wide -> close with k >= kMin
const pathRect = (kMin) => {
  const r = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const wide of [
    [540, 980],
    [540, 966],
  ]) {
    for (let i = 0; i <= 200; i++) {
      const u = i / 200;
      const k = Math.exp(u * Math.log(CLOSE.k * 1.06));
      if (k < kMin) continue;
      const v = viewOf([wide[0] + (CLOSE_C[0] - wide[0]) * Math.min(1, u * 1.02), wide[1] + (CLOSE_C[1] - wide[1]) * Math.min(1, u * 1.02)], k, 70);
      r.x0 = Math.min(r.x0, v.x0);
      r.x1 = Math.max(r.x1, v.x1);
      r.y0 = Math.min(r.y0, v.y0);
      r.y1 = Math.max(r.y1, v.y1);
    }
  }
  return { x0: Math.floor(r.x0), y0: Math.floor(r.y0), x1: Math.ceil(r.x1), y1: Math.ceil(r.y1) };
};
const LEVEL_DEF = [
  { name: "wide", kBake: 1.0, s: 1.3, band: null, rect: { x0: -180, y0: -180, x1: 1260, y1: 2100 } },
  { name: "mid", kBake: 1.45, s: 1.95, band: [1.2, 1.36], rect: pathRect(1.18) },
  { name: "close", kBake: 1.95, s: 2.35, band: [1.62, 1.8], rect: pathRect(1.58) },
];

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
// The same stack, order and weights as SouthManchuriaRailway's vector map.
const stack = (kB) => {
  const px = (v) => v / kB;
  const wlGap = 6.5 * Math.pow(kB, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    wl += `<path d="${LAND_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${px(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${LAND_D}" fill="none" stroke="${SEA}" stroke-width="${px(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  const dash = `${px(8)} ${px(5)}`;
  return `
<defs>
  <clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath>
</defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${px(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${px(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${px(10)}" stroke-linejoin="round"/>
  <path d="${GRATICULE_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${px(1.2)}"/>
</g>
<path d="${BORDERS_D}" fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="${px(1.7)}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${px(1.5)}" stroke-linejoin="round"/>`;
};

mkdirSync(TEX_DIR, { recursive: true });
copyFileSync("public/manchuria/mottle.png", `${TEX_DIR}/mottle.png`);
copyFileSync("public/manchuria/grain.png", `${TEX_DIR}/grain.png`);
const levels = [];
for (const Lv of LEVEL_DEF) {
  const r = Lv.rect;
  const W = Math.round((r.x1 - r.x0) * Lv.s);
  const H = Math.round((r.y1 - r.y0) * Lv.s);
  if (W > 8000 || H > 8000) throw new Error(`${Lv.name}: ${W}x${H} exceeds 8k`);
  if (ONLY !== "none" && (!ONLY || ONLY === Lv.name)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${r.x0} ${r.y0} ${W / Lv.s} ${H / Lv.s}">${stack(Lv.kBake)}</svg>`;
    const t0 = Date.now();
    const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
    writeFileSync(`${TEX_DIR}/lod-${Lv.name}.png`, png);
    console.log(`${TEX_DIR}/lod-${Lv.name}.png: ${W}x${H}, ${(png.length / 1e6).toFixed(2)} MB, ${Date.now() - t0} ms`);
  }
  levels.push({ name: Lv.name, kBake: Lv.kBake, s: Lv.s, band: Lv.band, x0: r.x0, y0: r.y0, w: W / Lv.s, h: H / Lv.s, W, H });
}

// -- write --------------------------------------------------------------------------------
const body = `// Generated by scripts/maps/sets/deathground/build-deathground-ukraine-map.mjs — do not edit by hand.
// Natural Earth 10m (public domain; world-atlas 2.0.2) on a north-up Lambert
// conformal conic, parallels 45.5/51.5, centre meridian 31.2 E, scale
// ${projection.scale().toFixed(2)}. World px == screen px at the k 1 wide: Ukraine's
// internationally recognised outline (Crimea included) is ${UA_W} px wide, centred on
// x 540, its bbox centred on y ${UA_CY}. ${kmPx.toFixed(4)} world px per km at 50.5 N.

export type P2 = [number, number];
export type Pt = { x: number; y: number };

export const PX_PER_KM = ${kmPx.toFixed(4)};
/** the projection, so a check can place any lon/lat: d3 geoConicConformal() */
export const PROJ = ${JSON.stringify({ parallels: [45.5, 51.5], rotate: [-31.2, 0], center: [0, 48.4], scale: projection.scale(), translate: projection.translate() })};

/** Territory Ukraine held on 23 Feb 2022 (mainland ring spliced with the 2015-22 line
 *  of contact, plus Ukraine's small islands / spits). One fill (nonzero). */
export const HELD_D = ${JSON.stringify(HELD_D)};
/** the held mainland ring as a closed polyline (first == last) */
export const HELD_RING: P2[] = ${JSON.stringify(HELD_RING)};
/** the 2015-2022 line of contact, NE (Russian border) -> SW (Azov coast) */
export const CONTACT_PTS: P2[] = ${JSON.stringify(CONTACT_PTS)};
/** Ukraine's internationally recognised land border (Crimea counted as Ukraine) */
export const INTL_D = ${JSON.stringify(INTL_D)};

/** the thrusts of 24 Feb 2022: centreline polylines (world px) from the staging
 *  tail to where each stopped; len = arclength; entry = arclength where it crosses
 *  the held territory's edge; stub = the tip's arclength at frame 0 (staged on the
 *  attacker's side); wpS = arclength of each waypoint */
export const THRUSTS: Record<${Object.keys(thrusts)
  .map((k) => JSON.stringify(k))
  .join(" | ")}, { pts: P2[]; len: number; entry: number; stub: number; wpS: number[] }> = ${JSON.stringify(thrusts)};

export const PLACES: Record<${Object.keys(PL)
  .map((k) => JSON.stringify(k))
  .join(" | ")}, Pt> = ${JSON.stringify(Object.fromEntries(Object.entries(PL).map(([k, v]) => [k, L(v)])))};

/** label parallels (type set along them) and their mid points */
export const UKRAINE_ARC = ${JSON.stringify({ d: lineD(parallelPts(LABEL_UKRAINE.lat, LABEL_UKRAINE.lon0, LABEL_UKRAINE.lon1)), mid: L([(LABEL_UKRAINE.lon0 + LABEL_UKRAINE.lon1) / 2, LABEL_UKRAINE.lat]) })};
export const RUSSIA_ARC = ${JSON.stringify({ d: lineD(parallelPts(LABEL_RUSSIA.lat, LABEL_RUSSIA.lon0, LABEL_RUSSIA.lon1)), mid: L([(LABEL_RUSSIA.lon0 + LABEL_RUSSIA.lon1) / 2, LABEL_RUSSIA.lat]) })};

/** the Kyiv push framing the LOD rects were cut for: Kyiv at screen (sx, sy), zoom k */
export const CLOSE = ${JSON.stringify(CLOSE)};

/** the static map as a raster LOD pyramid (public/deathground/ukraine/lod-<name>.png):
 *  world rect x0 y0 w h, bake zoom kBake, texels per world px s, the k band it fades in
 *  over (null = the base, always drawn) */
export type Level = { name: string; kBake: number; s: number; band: [number, number] | null; x0: number; y0: number; w: number; h: number; W: number; H: number };
export const LEVELS: Level[] = ${JSON.stringify(levels)};
`;
writeFileSync(OUT, body);
console.log(`Wrote ${OUT}: ${(body.length / 1e3).toFixed(0)} kB (land ${(LAND_D.length / 1e3).toFixed(0)} kB baked only)`);
