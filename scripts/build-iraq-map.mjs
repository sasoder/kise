// Bakes the geometry of THE IRAQ WORLD, the shared map of the clip
// "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with Si
// Sheppard; Dwarkesh map style). Cuts A B C E F G draw on this one world.
//
//   bun scripts/build-iraq-map.mjs
//
// Reads Natural Earth 10m land and admin-0 countries from the installed
// world-atlas (land-10m.json, countries-10m.json; public domain). Writes
//   generated/components/iraqStatic.ts   the heavy STATIC layers (land,
//                                         graticule), read only by
//                                         scripts/bake-iraq-rasters.mjs
//   generated/components/iraqMapData.ts  the light OVERLAYS (see iraqShared.tsx)
//
// THE PROJECTION is north-up Lambert conformal conic, parallels 30 / 36 N,
// centre meridian 44 E (d3 geoConicConformal().parallels([30, 36]).rotate([-44, 0])).
// Scale: at k 1 (world px == screen px, camera { k 1, cx 540, cy 960 }) Iraq's
// projected bbox is 880 px wide and its area centroid sits at (540, 835).
//
// BORDERS: Natural Earth 10m admin-0 (modern; Iraq's land borders did not change
// 1991-2006). Iraq's ring is split by TopoJSON arc ownership into one ordered
// polyline per neighbour + its coast; the ring starts at the Kuwait-Iraq-Saudi
// tripoint and runs Kuwait -> coast -> Iran -> Turkey -> Syria -> Jordan -> Saudi.
//
// ROUTES (2003 invasion; CLIP_SPEC waypoints, Wikipedia "2003 invasion of Iraq",
// "3rd Infantry Division (United States)", "I Marine Expeditionary Force"):
//   3ID  (west of the Euphrates): NW Kuwait -> Tallil / An Nasiriyah -> As Samawah
//        -> An Najaf -> Karbala Gap -> Baghdad airport -> Baghdad
//   IMEF (east): Kuwait (Abdali) -> Safwan -> An Nasiriyah -> Ad Diwaniyah
//        -> An Numaniyah -> Diyala bridge -> east Baghdad
// Each route stops END_GAP world px short of Baghdad (a column's head at the
// city's ring, not on its dot).
//
// CHECKS (throws): Iraq's ring has the seven parts in that order; the routes
// cross the Kuwait-Iraq border once and stay inside Iraq after it; every scatter
// point lies inside Iraq >= 22 world px from its border.

import { readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT_STATIC = "generated/components/iraqStatic.ts";
const OUT = "generated/components/iraqMapData.ts";

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i], pts[i - 1]));
  return c;
};

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------
const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const GEOMS = topo.objects.countries.geometries;
const byName = (n) => {
  const g = GEOMS.find((x) => x.properties.name === n);
  if (!g) throw new Error(`no country ${n}`);
  return g;
};
const NAMES = {
  iraq: "Iraq",
  kuwait: "Kuwait",
  saudi: "Saudi Arabia",
  jordan: "Jordan",
  syria: "Syria",
  turkey: "Turkey",
  iran: "Iran",
};
const G = Object.fromEntries(Object.entries(NAMES).map(([k, n]) => [k, byName(n)]));
const iraqFeat = feature(topo, G.iraq);
if (iraqFeat.geometry.type !== "Polygon" || iraqFeat.geometry.coordinates.length !== 1) throw new Error("Iraq should be one ring");

// ---------------------------------------------------------------------------
// THE PROJECTION
// ---------------------------------------------------------------------------
const PARALLELS = [30, 36];
const ROTATE = [-44, 0];
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(1).translate([0, 0]);
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
const ringCentroid = (r) => {
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    const c = a[0] * b[1] - b[0] * a[1];
    A += c;
    cx += (a[0] + b[0]) * c;
    cy += (a[1] + b[1]) * c;
  }
  return [cx / (3 * A), cy / (3 * A)];
};
{
  const ring = iraqFeat.geometry.coordinates[0].map((ll) => projection(ll));
  const xs = ring.map((p) => p[0]);
  const w = Math.max(...xs) - Math.min(...xs);
  projection.scale(880 / w);
  const ring2 = iraqFeat.geometry.coordinates[0].map((ll) => projection(ll));
  const c = ringCentroid(ring2);
  projection.translate([540 - c[0], 835 - c[1]]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const P = (ll) => projection(ll);
const INV = (p) => projection.invert(p);
const PX_PER_KM = (() => {
  const p = P([44, 32.5]);
  const q = P([44, 33.5]);
  return dist(p, q) / 111.2;
})();
console.log(`scale ${SCALE.toFixed(3)}, translate ${TRANSLATE.map((v) => v.toFixed(3))}, ${PX_PER_KM.toFixed(4)} world px per km`);

// the world the static layers are baked over (bake-iraq-rasters' far level lies inside it)
const CLIP = [
  [-3000, -3600],
  [4100, 5400],
];

// -- a rounding path sink (Railways / Cortes) ------------------------------------
const MIN_STEP = 0.06;
const n2 = (v) => {
  const r = Math.round(v * 50) / 50;
  return Object.is(r, -0) ? 0 : r;
};
const roundingContext = () => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  return {
    moveTo(x, y) {
      if (pending) {
        out += `L${n2(pending[0])},${n2(pending[1])}`;
        pending = null;
      }
      px = sx = x;
      py = sy = y;
      out += `M${n2(x)},${n2(y)}`;
    },
    lineTo(x, y) {
      if (Math.hypot(x - px, y - py) < MIN_STEP) {
        pending = [x, y];
        return;
      }
      pending = null;
      px = x;
      py = y;
      out += `L${n2(x)},${n2(y)}`;
    },
    closePath() {
      if (pending && Math.hypot(pending[0] - sx, pending[1] - sy) >= MIN_STEP) out += `L${n2(pending[0])},${n2(pending[1])}`;
      pending = null;
      out += "Z";
    },
    result() {
      return out;
    },
  };
};
const clipped = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(SCALE).translate(TRANSLATE).clipExtent(CLIP);
const bake = (geo) => {
  const sink = roundingContext();
  geoPath(clipped, sink)(geo);
  return sink.result();
};

// ---------------------------------------------------------------------------
// STATIC: land (Natural Earth 10m) + 5 deg graticule
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
const VIEW = { lon: [0, 95], lat: [-15, 70] };
const sane = (rings) => geoArea({ type: "Polygon", coordinates: [rings[0]] }) < 2 * Math.PI;
const landPolys = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    const b = llBox(rings[0]);
    if (b.x1 < VIEW.lon[0] || b.x0 > VIEW.lon[1] || b.y1 < VIEW.lat[0] || b.y0 > VIEW.lat[1]) continue;
    if (sane(rings)) landPolys.push(rings);
  }
const LAND_D = bake({ type: "MultiPolygon", coordinates: landPolys });
const GRATICULE_D = bake(
  geoGraticule()
    .extent([
      [0, -10],
      [95, 65.001],
    ])
    .step([5, 5])
    .precision(0.5)(),
);

// ---------------------------------------------------------------------------
// IRAQ'S RING by arc ownership
// ---------------------------------------------------------------------------
const owners = new Map(); // abs arc index -> set of country keys (and others)
const walkArcs = (g, fn) => {
  const polys = g.type === "Polygon" ? [g.arcs] : g.type === "MultiPolygon" ? g.arcs : [];
  for (const poly of polys) for (const ring of poly) for (const a of ring) fn(a < 0 ? ~a : a);
};
for (const g of GEOMS)
  walkArcs(g, (i) => {
    if (!owners.has(i)) owners.set(i, new Set());
    owners.get(i).add(g.properties.name);
  });
const keyOfName = Object.fromEntries(Object.entries(NAMES).map(([k, n]) => [n, k]));
const arcCoords = (a) => feature(topo, { type: "LineString", arcs: [a] }).geometry.coordinates;
const iraqArcs = G.iraq.arcs[0];
const parts = []; // { key, ll: [lon,lat][] } in ring order
for (const a of iraqArcs) {
  const abs = a < 0 ? ~a : a;
  const others = [...owners.get(abs)].filter((n) => n !== "Iraq");
  if (others.length > 1) throw new Error(`arc ${abs} shared by ${others}`);
  const key = others.length ? keyOfName[others[0]] : "coast";
  if (!key) throw new Error(`Iraq borders an unexpected country: ${others[0]}`);
  const c = arcCoords(a);
  const last = parts[parts.length - 1];
  if (last && last.key === key) last.ll.push(...c.slice(1));
  else parts.push({ key, ll: c });
}
// merge the wrap-around (first and last part the same owner)
if (parts.length > 1 && parts[0].key === parts[parts.length - 1].key) {
  const l = parts.pop();
  parts[0].ll = [...l.ll, ...parts[0].ll.slice(1)];
}
console.log(`Iraq ring parts: ${parts.map((p) => `${p.key}(${p.ll.length})`).join(" ")}`);
// rotate (and maybe reverse) so the ring runs kuwait -> coast -> iran -> turkey -> syria -> jordan -> saudi
const ORDER = ["kuwait", "coast", "iran", "turkey", "syria", "jordan", "saudi"];
let seq = parts.slice();
const ki = seq.findIndex((p) => p.key === "kuwait");
seq = [...seq.slice(ki), ...seq.slice(0, ki)];
if (seq.map((p) => p.key).join() !== ORDER.join()) {
  // reverse direction
  const rev = parts
    .slice()
    .reverse()
    .map((p) => ({ key: p.key, ll: p.ll.slice().reverse() }));
  const k2 = rev.findIndex((p) => p.key === "kuwait");
  seq = [...rev.slice(k2), ...rev.slice(0, k2)];
}
if (seq.map((p) => p.key).join() !== ORDER.join()) throw new Error(`unexpected Iraq ring order ${seq.map((p) => p.key)}`);
// world px parts, each sharing its end point with the next one's start
const PARTS = seq.map((p) => ({ key: p.key, pts: p.ll.map(P) }));
for (let i = 0; i < PARTS.length; i++) {
  const a = PARTS[i].pts.at(-1);
  const b = PARTS[(i + 1) % PARTS.length].pts[0];
  if (dist(a, b) > 1e-6) throw new Error(`parts ${PARTS[i].key} / ${PARTS[(i + 1) % PARTS.length].key} do not meet (${dist(a, b)})`);
}
const RING = []; // closed ring, the start point repeated at the end
PARTS.forEach((p, i) => RING.push(...(i === 0 ? p.pts : p.pts.slice(1))));
const RING_CUM = cumOf(RING);
const RING_LEN = RING_CUM.at(-1);
const SEGS = (() => {
  let s = 0;
  return PARTS.map((p) => {
    const len = cumOf(p.pts).at(-1);
    const o = { key: p.key, s0: r3(s), s1: r3(s + len), km: Math.round(len / PX_PER_KM) };
    s += len;
    return o;
  });
})();
console.log(`Iraq ring ${RING.length} pts, ${(RING_LEN / PX_PER_KM).toFixed(0)} km: ${SEGS.map((q) => `${q.key} ${q.km} km`).join(", ")}`);
const RING_OPEN = RING.slice(0, -1);
if (ringArea(RING_OPEN) === 0) throw new Error("degenerate ring");
const IRAQ_CENTROID = ringCentroid(RING_OPEN);
const boxOf = (pts) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0: r3(x0), x1: r3(x1), y0: r3(y0), y1: r3(y1) };
};
const IRAQ_BOX = boxOf(RING_OPEN);
console.log(`Iraq centroid ${IRAQ_CENTROID.map((v) => v.toFixed(2))} box ${JSON.stringify(IRAQ_BOX)} (w ${(IRAQ_BOX.x1 - IRAQ_BOX.x0).toFixed(1)})`);

// ---------------------------------------------------------------------------
// POLYGONS (world px). Iraq and Kuwait at full 10m resolution; the big
// neighbours clipped to a lon/lat box and simplified (Douglas-Peucker 0.2 world px).
// ---------------------------------------------------------------------------
const dpSimplify = (pts, tol) => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1;
    let bd = tol;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / l2));
      const d = Math.hypot(pts[i][0] - ax - t * dx, pts[i][1] - ay - t * dy);
      if (d > bd) [bd, best] = [d, i];
    }
    if (best >= 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
const CLIP_LL = [
  [
    [26, 12],
    [64, 12],
    [64, 45],
    [26, 45],
    [26, 12],
  ],
];
const toD = (pts, close = false) => (pts.length ? `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}` : "");
const polyOut = (key, tol, clipLL = true) => {
  const f = feature(topo, G[key]);
  let mp = polysOf(f.geometry);
  if (clipLL) mp = polygonClipping.intersection(mp, CLIP_LL);
  const w = mp
    .map((poly) => poly.map((ring) => dpSimplify(ring.map(P), tol)).filter((r) => r.length >= 4))
    .filter((poly) => poly.length && Math.abs(ringArea(poly[0])) > 0.5);
  return { d: w.map((poly) => poly.map((r) => toD(r.slice(0, -1), true)).join("")).join(""), polys: w };
};
const POLY = {
  iraq: { d: toD(RING_OPEN, true), polys: [[RING]] },
  kuwait: polyOut("kuwait", 0.03, false),
  saudi: polyOut("saudi", 0.2),
  jordan: polyOut("jordan", 0.15),
  syria: polyOut("syria", 0.15),
  turkey: polyOut("turkey", 0.2),
  iran: polyOut("iran", 0.2),
};
for (const [k, v] of Object.entries(POLY)) console.log(`poly ${k}: ${v.polys.length} polygon(s), d ${v.d.length} chars`);
const KUWAIT_MAIN = POLY.kuwait.polys.reduce((a, b) => (Math.abs(ringArea(b[0])) > Math.abs(ringArea(a[0])) ? b : a))[0];
const KUWAIT_CENTROID = ringCentroid(KUWAIT_MAIN.slice(0, -1));
const KUWAIT_BOX = boxOf(POLY.kuwait.polys.flatMap((p) => p[0]));

// ---------------------------------------------------------------------------
// OTHER BORDERS: every international land border in the region except Iraq's,
// one path (fine dashed cream at runtime), simplified 0.1 world px.
// ---------------------------------------------------------------------------
const REGION_LL = { lon: [27, 63], lat: [12, 44] };
const otherMesh = mesh(topo, topo.objects.countries, (a, b) => a !== b && a.properties.name !== "Iraq" && b.properties.name !== "Iraq");
const inRegion = ([lon, lat]) => lon >= REGION_LL.lon[0] && lon <= REGION_LL.lon[1] && lat >= REGION_LL.lat[0] && lat <= REGION_LL.lat[1];
const otherLines = otherMesh.coordinates
  .flatMap((line) => {
    // the runs inside the region (one point of overshoot each side)
    const runs = [];
    let run = [];
    line.forEach((p, i) => {
      const near = inRegion(p) || (i > 0 && inRegion(line[i - 1])) || (i + 1 < line.length && inRegion(line[i + 1]));
      if (near) run.push(p);
      else if (run.length) {
        if (run.length > 1) runs.push(run);
        run = [];
      }
    });
    if (run.length > 1) runs.push(run);
    return runs;
  })
  .map((line) => dpSimplify(line.map(P), 0.12));
const OTHER_BORDERS_D = otherLines.map((l) => toD(l)).join("");
// Kuwait-Saudi on its own (cut A's context)
const kuwaitSaudiMesh = mesh(topo, topo.objects.countries, (a, b) => (a === G.kuwait && b === G.saudi) || (a === G.saudi && b === G.kuwait));
const KUWAIT_SAUDI_D = kuwaitSaudiMesh.coordinates.map((l) => toD(l.map(P))).join("");
console.log(`other borders: ${otherLines.length} lines, ${OTHER_BORDERS_D.length} chars; Kuwait-Saudi ${KUWAIT_SAUDI_D.length} chars`);

// ---------------------------------------------------------------------------
// RIVERS: the Tigris, the Euphrates (incl. "Al Furat" and its Lake Assad
// centreline) and the Shatt al-Arab, Natural Earth 10m rivers_lake_centerlines
// (public domain; scripts/iraq-rivers.geojson is the filtered copy, source URL
// inside). Simplified 0.1 world px. CHANGED 2026-10-05 (Fable's A/B review).
// ---------------------------------------------------------------------------
const RIV = JSON.parse(readFileSync("scripts/iraq-rivers.geojson", "utf8"));
const RIVERS = {};
for (const f of RIV.features) {
  const key = f.properties.name === "Shatt al Arab" ? "shatt" : f.properties.name === "Tigris" ? "tigris" : "euphrates";
  const lines = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
  for (const l of lines) (RIVERS[key] ??= []).push(dpSimplify(l.map(P), 0.1));
}
const RIVERS_D = Object.fromEntries(Object.entries(RIVERS).map(([k, ls]) => [k, ls.map((l) => toD(l)).join("")]));
console.log(`rivers: ${Object.entries(RIVERS).map(([k, ls]) => `${k} ${ls.length} lines`).join(", ")}`);

// ---------------------------------------------------------------------------
// POINT-IN-IRAQ, distance to Iraq's border
// ---------------------------------------------------------------------------
const pip = ([x, y], ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
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
const ringDist = (p, ring) => {
  let best = Infinity;
  for (let i = 1; i < ring.length; i++) best = Math.min(best, segDist(p, ring[i - 1], ring[i]));
  return best;
};
const inIraq = (p) => pip(p, RING_OPEN);

// ---------------------------------------------------------------------------
// SITES
// ---------------------------------------------------------------------------
const SITE_LL = {
  baghdad: [44.366, 33.315],
  samarra: [43.8742, 34.1986], // Al-Askari Shrine
  basra: [47.81, 30.51],
  kuwaitCity: [47.978, 29.375],
};
const SITES = Object.fromEntries(Object.entries(SITE_LL).map(([k, ll]) => [k, { x: r3(P(ll)[0]), y: r3(P(ll)[1]), lon: ll[0], lat: ll[1] }]));
const BAGHDAD = [SITES.baghdad.x, SITES.baghdad.y];

// ---------------------------------------------------------------------------
// ROUTES (2003): centripetal Catmull-Rom through the projected waypoints
// ---------------------------------------------------------------------------
const catmull = (pts, step = 1) => {
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
    const n = Math.max(4, Math.ceil(dist(p1, p2) / step));
    for (let s = 1; s <= n; s++) {
      const t = t1 + ((t2 - t1) * s) / n;
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
const END_GAP = 13; // world px short of Baghdad (the ring's radius at k 1.5 + a little)
const ROUTE_LL = {
  // 3rd Infantry Division, west of the Euphrates
  army: [
    [47.0, 29.56], // assembly area, NW Kuwait (east of the Wadi al-Batin)
    [46.74, 29.98], // through the border berm, north-west into the desert
    [46.3, 30.36], // across the southern desert, well west of the Basra-Nasiriyah road
    [45.86, 30.8], // the desert west of Tallil (the 1st Brigade took Tallil air base, 30.93 N 46.09 E;
    //               the column's line is drawn west of it so the two bodies never touch on screen)
    [45.08, 31.16], // past As Samawah (31.31 N 45.28 E) through the desert to its south-west
    [44.33, 32.0], // An Najaf
    [43.95, 32.5], // the Karbala Gap
    [44.23, 33.26], // Baghdad airport
  ],
  // I Marine Expeditionary Force, east
  marines: [
    [47.75, 29.86], // assembly area, N Kuwait (Abdali)
    [47.72, 30.11], // Safwan
    [47.25, 30.62], // north-west along Highway 8 (east of the army's desert route)
    [46.26, 31.04], // An Nasiriyah
    [44.93, 31.99], // Ad Diwaniyah
    [45.4, 32.55], // An Numaniyah (the Tigris crossing)
    [44.5, 33.27], // the Diyala bridge
  ],
};
const routeOf = (lls) => {
  const w = lls.map(P);
  // the last waypoint -> Baghdad, stopping END_GAP short
  const last = w.at(-1);
  const u = [(last[0] - BAGHDAD[0]) / dist(last, BAGHDAD), (last[1] - BAGHDAD[1]) / dist(last, BAGHDAD)];
  w.push([BAGHDAD[0] + u[0] * END_GAP, BAGHDAD[1] + u[1] * END_GAP]);
  const cm = catmull(w);
  const cum = cumOf(cm.pts);
  // where it enters Iraq: the first sample inside, after which it stays inside
  let enter = -1;
  for (let i = 0; i < cm.pts.length; i++) {
    const inside = inIraq(cm.pts[i]);
    if (inside && enter < 0) enter = i;
    if (!inside && enter >= 0) throw new Error(`route leaves Iraq again at ${INV(cm.pts[i])}`);
  }
  if (enter <= 0) throw new Error("route should start outside Iraq and enter it");
  return { pts: cm.pts, wpS: cm.idx.map((i) => cum[i]), len: cum.at(-1), borderS: cum[enter] };
};
const ROUTES = { army: routeOf(ROUTE_LL.army), marines: routeOf(ROUTE_LL.marines) };
for (const [k, R] of Object.entries(ROUTES))
  console.log(`route ${k}: ${R.pts.length} pts, ${(R.len / PX_PER_KM).toFixed(0)} km, enters Iraq at ${(R.borderS / PX_PER_KM).toFixed(0)} km`);

// ---------------------------------------------------------------------------
// SCATTER: deterministic blue noise inside Iraq (best candidate), >= 22 world px
// from the border; the order is the sampling order (any prefix is even).
// ---------------------------------------------------------------------------
const rand = (() => {
  let s = 20030320;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
})();
const SCATTER = [];
{
  const N = 90;
  const M = 40;
  while (SCATTER.length < N) {
    let best = null;
    let bd = -1;
    for (let c = 0; c < M; c++) {
      const p = [IRAQ_BOX.x0 + rand() * (IRAQ_BOX.x1 - IRAQ_BOX.x0), IRAQ_BOX.y0 + rand() * (IRAQ_BOX.y1 - IRAQ_BOX.y0)];
      if (!inIraq(p) || ringDist(p, RING) < 22) {
        c--;
        continue;
      }
      const d = SCATTER.length ? Math.min(...SCATTER.map((q) => dist(p, q))) : 1e9;
      if (d > bd) [bd, best] = [d, p];
    }
    SCATTER.push(best);
  }
  const nn = SCATTER.slice(0, 60).map((p, i) => Math.min(...SCATTER.slice(0, 60).filter((_, j) => j !== i).map((q) => dist(p, q))));
  console.log(`scatter: ${SCATTER.length} pts; first 60 nearest-neighbour min ${Math.min(...nn).toFixed(1)} mean ${(nn.reduce((a, b) => a + b, 0) / nn.length).toFixed(1)} world px`);
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-iraq-map.mjs — do not edit by hand.
// The STATIC layers of the Iraq world, read only by scripts/bake-iraq-rasters.mjs.
// Natural Earth 10m land (public domain) on a north-up Lambert conformal conic,
// parallels 30/36 N, centre meridian 44 E, scale ${SCALE.toFixed(3)}. World px == screen
// px at k 1 (Iraq 880 px wide, its centroid at 540, 835). Clipped to ${JSON.stringify(CLIP)}.

/** Land, one path (evenodd). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** 5 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
const rp = (pts) => pts.map(([x, y]) => [r3(x), r3(y)]);
const rpolys = (mp) => mp.map((poly) => poly.map((ring) => ring.map(([x, y]) => [r2(x), r2(y)])));
const routeOut = (R) => ({ pts: rp(R.pts), wpS: R.wpS.map(r3), len: r3(R.len), borderS: r3(R.borderS) });
writeFileSync(
  OUT,
  `// Generated by scripts/build-iraq-map.mjs — do not edit by hand.
// The light OVERLAYS of the Iraq world (see iraqShared.tsx for the API).
// Lambert conformal conic, parallels 30/36 N, centre meridian 44 E, scale
// ${SCALE.toFixed(3)}; world px == screen px at k 1 (Iraq 880 px wide, its area
// centroid at 540, 835). ${PX_PER_KM.toFixed(4)} world px per km.
// Sources: Natural Earth 10m admin-0 countries + land (world-atlas, public
// domain); 2003 routes per CLIP_SPEC (Wikipedia "2003 invasion of Iraq").

export type P2 = [number, number];
export type Site = { x: number; y: number; lon: number; lat: number };
export type RouteData = { pts: P2[]; wpS: number[]; len: number; borderS: number };
export type BorderKey = "kuwait" | "coast" | "iran" | "turkey" | "syria" | "jordan" | "saudi";

export const PROJ = { parallels: ${JSON.stringify(PARALLELS)} as [number, number], rotate: ${JSON.stringify(ROTATE)} as [number, number], scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export const PX_PER_KM = ${PX_PER_KM};

/** IRAQ'S RING (world px), closed (the first point repeated last), starting at the
 *  Kuwait-Iraq-Saudi tripoint and running Kuwait -> coast -> Iran -> Turkey -> Syria
 *  -> Jordan -> Saudi. ${(RING_LEN / PX_PER_KM).toFixed(0)} km (Natural Earth 10m; CIA: 3,809 km of land border + 58 km coast). */
export const IRAQ_RING: P2[] = ${JSON.stringify(rp(RING))};
/** each part's arclength range on IRAQ_RING (world px) and its length in km */
export const IRAQ_SEGMENTS: { key: BorderKey; s0: number; s1: number; km: number }[] = ${JSON.stringify(SEGS)};
/** each part as its own ordered polyline (world px), in the ring's direction */
export const IRAQ_BORDERS: Record<BorderKey, P2[]> = ${JSON.stringify(Object.fromEntries(PARTS.map((p) => [p.key, rp(p.pts)])))};
export const IRAQ_CENTROID: P2 = ${JSON.stringify(IRAQ_CENTROID.map(r3))};
export const IRAQ_BOX = ${JSON.stringify(IRAQ_BOX)};

/** country polygons (world px, evenodd d + rings). Iraq and Kuwait at full 10m; the
 *  others clipped to lon 26-64 E, lat 12-45 N and simplified 0.2 world px. */
export const COUNTRY_D: Record<"iraq" | "kuwait" | "saudi" | "jordan" | "syria" | "turkey" | "iran", string> = ${JSON.stringify(
    Object.fromEntries(Object.entries(POLY).map(([k, v]) => [k, v.d])),
  )};
export const KUWAIT_POLYS: P2[][][] = ${JSON.stringify(rpolys(POLY.kuwait.polys))};
export const KUWAIT_CENTROID: P2 = ${JSON.stringify(KUWAIT_CENTROID.map(r3))};
export const KUWAIT_BOX = ${JSON.stringify(KUWAIT_BOX)};

/** every international land border of the region except Iraq's (svg d, open lines) */
export const OTHER_BORDERS_D = ${JSON.stringify(OTHER_BORDERS_D)};
/** Kuwait-Saudi Arabia alone (svg d) */
export const KUWAIT_SAUDI_D = ${JSON.stringify(KUWAIT_SAUDI_D)};

/** rivers (svg d, open lines): Natural Earth 10m rivers_lake_centerlines; never labelled */
export const RIVERS_D: Record<"tigris" | "euphrates" | "shatt", string> = ${JSON.stringify(RIVERS_D)};

/** sites (world px + lon/lat) */
export const SITES: Record<${Object.keys(SITES)
    .map((k) => `"${k}"`)
    .join(" | ")}, Site> = ${JSON.stringify(SITES)};

/** 2003 invasion routes (smoothed; s = 0 in the Kuwait assembly area; borderS = where
 *  the route enters Iraq; each ends ${END_GAP} world px short of Baghdad) */
export const ROUTE_ARMY_DATA: RouteData = ${JSON.stringify(routeOut(ROUTES.army))};
export const ROUTE_MARINES_DATA: RouteData = ${JSON.stringify(routeOut(ROUTES.marines))};
/** the routes' lon/lat waypoints (the last one is the stop short of Baghdad) */
export const ROUTE_WAYPOINTS_LL = ${JSON.stringify(ROUTE_LL)};

/** blue-noise points inside Iraq (>= 22 world px from its border); any prefix is even */
export const IRAQ_SCATTER: P2[] = ${JSON.stringify(rp(SCATTER))};
`,
);
console.log(`Wrote ${OUT_STATIC} (land ${(LAND_D.length / 1e6).toFixed(2)} MB, graticule ${GRATICULE_D.length}) and ${OUT}`);
