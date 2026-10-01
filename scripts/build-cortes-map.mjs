// Bakes the geometry of THE CORTES WORLD, the shared map of the clip
// "Sheppard_Cortes_recruits_the_arrest_army" (Dwarkesh with Si Sheppard on
// Cortes, Velazquez and Narvaez, 1519-1520; Dwarkesh map style). Every cut of
// the clip draws on this one world: SpanishDivided + GoingBeyondHisMission,
// LargerForce, EmpireAtMyDisposal.
//
//   bun scripts/build-cortes-map.mjs
//
// Reads scripts/cortes-geo.json (the director's sites, routes, georeferenced
// 1519 empire and Lake Texcoco, facts) and Natural Earth 10m land from the
// installed world-atlas. Writes
//   generated/components/cortesStatic.ts    the heavy STATIC layers (land,
//                                            Lake Texcoco, graticule), read only
//                                            by scripts/bake-cortes-rasters.mjs
//   generated/components/cortesMapData.ts   the light OVERLAYS drawn as vectors:
//                                            projection, sites, the smoothed
//                                            routes, the empire, the lake, land
//                                            masks, the Cempoala crowds
//
// THE PROJECTION is north-up Lambert conformal conic, parallels 17 / 23, centre
// meridian 87 W (d3 geoConicConformal().parallels([17, 23]).rotate([87, 0])).
// Scale: at k 1 (world px == screen px) lon 100.5 W ... 73.5 W at lat 20 N spans
// the 1080 px width; translate puts those two points on y 835, so the k 1 Gulf
// wide (camera centre (540, 960)) has lat 20 N at the frame's two edges on y 835.
// 0.383 world px per km.
//
// NOTHING PERIOD-WRONG: no borders at all in the static map; no modern lakes
// (Natural Earth land has none); Lake Texcoco (1519) is added as water.
//
// CHECKS (the script throws if one fails):
//   - the smoothed Narvaez voyage stays >= 5 km offshore except on its first
//     and last legs (Santiago's bay, the anchorage at San Juan de Ulua);
//   - the smoothed Cortes road and the land leg stay on land;
//   - every crowd dot (all layouts) is on land, its centre >= COAST_KEEP world px
//     inside the coast; the crowds are even blue noise (nearest-neighbour stats).

import { readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT_STATIC = "generated/components/cortesStatic.ts";
const OUT = "generated/components/cortesMapData.ts";
const GEO = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));

// ---------------------------------------------------------------------------
// THE PROJECTION
// ---------------------------------------------------------------------------
const PARALLELS = [17, 23];
const ROTATE = [87, 0];
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(1).translate([0, 0]);
{
  const a = projection([-100.5, 20]);
  const b = projection([-73.5, 20]);
  projection.scale(1080 / (b[0] - a[0]));
  const a2 = projection([-100.5, 20]);
  const b2 = projection([-73.5, 20]);
  projection.translate([540 - (a2[0] + b2[0]) / 2, 835 - (a2[1] + b2[1]) / 2]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
// the world the static layers are baked over (every level lies inside it)
const CLIP = [
  [-1000, -800],
  [2100, 2700],
];
projection.clipExtent(CLIP);
const P = (ll) => projection(ll);
const PX_PER_KM = (() => {
  const p = P([-87, 19.5]);
  const q = P([-87, 20.5]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`scale ${SCALE.toFixed(3)}, translate ${TRANSLATE.map((v) => v.toFixed(3))}, ${PX_PER_KM.toFixed(4)} world px per km`);

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

// -- a rounding path sink (Railways) ---------------------------------------------
const MIN_STEP = 0.08;
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
const bake = (geo) => {
  const sink = roundingContext();
  geoPath(projection, sink)(geo);
  return sink.result();
};
const toD = (pts, close = false) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}`;

// ---------------------------------------------------------------------------
// LAND (Natural Earth 10m), LAKE TEXCOCO (1519), GRATICULE
// ---------------------------------------------------------------------------
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const VIEW = { lon: [-135, -40], lat: [-25, 62] };
const ringBox = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return { x0, x1, y0, y1 };
};
const ringInView = (ring) => {
  const b = ringBox(ring);
  return b.x1 >= VIEW.lon[0] && b.x0 <= VIEW.lon[1] && b.y1 >= VIEW.lat[0] && b.y0 <= VIEW.lat[1];
};
const sane = (rings) => geoArea({ type: "Polygon", coordinates: [rings[0]] }) < 2 * Math.PI;
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const landPolys = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) if (ringInView(rings[0]) && sane(rings)) landPolys.push(rings);
const LAND_D = bake({ type: "MultiPolygon", coordinates: landPolys });

const LAKE_RING_LL = GEO.lake_texcoco_1519.rings[0];
const lakeGeo = (() => {
  const g = { type: "Polygon", coordinates: [LAKE_RING_LL.map((p) => [...p])] };
  if (geoArea(g) > 2 * Math.PI) g.coordinates = [[...LAKE_RING_LL].reverse()];
  return g;
})();
const LAKE_D = bake(lakeGeo);

const GRATICULE_D = bake(
  geoGraticule()
    .extent([
      [-135, -25],
      [-40, 60.001],
    ])
    .step([5, 5])
    .precision(0.5)(),
);

// ---------------------------------------------------------------------------
// COAST GEOMETRY (world px) for the checks: land rings round the stage,
// projected, as segments bucketed on a grid; even-odd inside test + distance.
// ---------------------------------------------------------------------------
const STAGE_LL = { lon: [-106, -70], lat: [12, 28] };
const coastSegs = [];
for (const rings of landPolys)
  for (const ring of rings) {
    const b = ringBox(ring);
    if (b.x1 < STAGE_LL.lon[0] || b.x0 > STAGE_LL.lon[1] || b.y1 < STAGE_LL.lat[0] || b.y0 > STAGE_LL.lat[1]) continue;
    let prev = null;
    for (const ll of ring) {
      const q = P(ll);
      if (prev) coastSegs.push([prev[0], prev[1], q[0], q[1]]);
      prev = q;
    }
  }
const BUCKET = 6;
const segGrid = new Map();
coastSegs.forEach(([ax, ay, bx, by], i) => {
  const i0 = Math.floor(Math.min(ax, bx) / BUCKET);
  const i1 = Math.floor(Math.max(ax, bx) / BUCKET);
  const j0 = Math.floor(Math.min(ay, by) / BUCKET);
  const j1 = Math.floor(Math.max(ay, by) / BUCKET);
  for (let a = i0; a <= i1; a++)
    for (let b = j0; b <= j1; b++) {
      const k = `${a},${b}`;
      if (!segGrid.has(k)) segGrid.set(k, []);
      segGrid.get(k).push(i);
    }
});
const rowGrid = new Map(); // segments by y bucket, for the crossing count
coastSegs.forEach(([, ay, , by], i) => {
  const j0 = Math.floor(Math.min(ay, by) / BUCKET);
  const j1 = Math.floor(Math.max(ay, by) / BUCKET);
  for (let b = j0; b <= j1; b++) {
    if (!rowGrid.has(b)) rowGrid.set(b, []);
    rowGrid.get(b).push(i);
  }
});
/** even-odd inside test against the land rings (world px) */
const isLand = (x, y) => {
  const segs = rowGrid.get(Math.floor(y / BUCKET)) ?? [];
  let c = false;
  for (const i of segs) {
    const [ax, ay, bx, by] = coastSegs[i];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
  }
  return c;
};
/** distance to the nearest coast segment, world px (searched out to `max`) */
const coastDist = (x, y, max = 60) => {
  let best = Infinity;
  const R = Math.ceil(max / BUCKET);
  const i0 = Math.floor(x / BUCKET);
  const j0 = Math.floor(y / BUCKET);
  for (let ring = 0; ring <= R; ring++) {
    for (let a = i0 - ring; a <= i0 + ring; a++)
      for (let b = j0 - ring; b <= j0 + ring; b++) {
        if (Math.max(Math.abs(a - i0), Math.abs(b - j0)) !== ring) continue;
        const segs = segGrid.get(`${a},${b}`);
        if (!segs) continue;
        for (const i of segs) {
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
// SITES
// ---------------------------------------------------------------------------
const SITE_KEYS = {
  santiago: "santiago_de_cuba",
  caboSanAntonio: "cabo_san_antonio",
  sanJuanDeUlua: "san_juan_de_ulua",
  cempoala: "cempoala",
  tenochtitlan: "tenochtitlan",
};
const SITES = Object.fromEntries(
  Object.entries(SITE_KEYS).map(([k, key]) => {
    const ll = GEO.sites[key].lonlat;
    const [x, y] = P(ll);
    return [k, { x: r3(x), y: r3(y), lon: ll[0], lat: ll[1] }];
  }),
);

// ---------------------------------------------------------------------------
// ROUTES: centripetal Catmull-Rom through the projected waypoints
// ---------------------------------------------------------------------------
const catmull = (pts, step = 0.6) => {
  const ext = [
    [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]],
    ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]],
  ];
  const out = [pts[0]];
  const idx = [0];
  const knot = (p, q) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const n = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 1; s <= n; s++) {
      const t = t1 + ((t2 - t1) * s) / n;
      const lerp = (A, B, ta, tb) => [
        ((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0],
        ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1],
      ];
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
const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const routeOf = (lls) => {
  const cm = catmull(lls.map(P));
  const cum = cumOf(cm.pts);
  return { pts: cm.pts, wpS: cm.idx.map((i) => cum[i]), len: cum[cum.length - 1] };
};
const VOY = routeOf(GEO.routes.narvaez_voyage_1520.waypoints);
const LANDLEG = routeOf(GEO.routes.narvaez_voyage_1520.land_leg_to_cempoala);
const ROAD = routeOf(GEO.routes.cortes_road_1519.waypoints);
console.log(
  `voyage ${VOY.len.toFixed(1)} world px (${(VOY.len / PX_PER_KM).toFixed(0)} km), land leg ${LANDLEG.len.toFixed(1)}, road ${ROAD.len.toFixed(1)} (${(ROAD.len / PX_PER_KM).toFixed(0)} km)`,
);

// -- the offshore check: >= 5 km except at the two ends ------------------------
// The ends are the bay exit at Santiago (the city -> the bay mouth, waypoint 1,
// itself ~3 km from shore -> the first sample >= 5 km out) and the approach to
// the anchorage at San Juan de Ulua (the last sample >= 5 km out -> the fort).
// Between them every sample (every 0.25 world px) must be >= 5 km offshore.
// (run for its throw; the end zones are only logged)
(() => {
  const cum = cumOf(VOY.pts);
  const samples = [];
  for (let i = 1; i < VOY.pts.length; i++) {
    const [ax, ay] = VOY.pts[i - 1];
    const [bx, by] = VOY.pts[i];
    const L = cum[i] - cum[i - 1];
    const n = Math.max(1, Math.ceil(L / 0.25));
    for (let j = 0; j < n; j++) {
      const x = ax + ((bx - ax) * j) / n;
      const y = ay + ((by - ay) * j) / n;
      samples.push({ s: cum[i - 1] + (L * j) / n, x, y, km: isLand(x, y) ? 0 : coastDist(x, y) / PX_PER_KM });
    }
  }
  const sW1 = VOY.wpS[1];
  const sWn = VOY.wpS[VOY.wpS.length - 2];
  const a = samples.find((q) => q.s >= sW1 && q.km >= 5);
  const b = [...samples].reverse().find((q) => q.s <= sWn && q.km >= 5);
  let worst = { km: Infinity, s: 0, x: 0, y: 0 };
  for (const q of samples) if (q.s >= a.s && q.s <= b.s && q.km < worst.km) worst = q;
  const ll = projection.invert([worst.x, worst.y]);
  console.log(
    `voyage offshore check: bay exit 0..${a.s.toFixed(1)} world px (${(a.s / PX_PER_KM).toFixed(1)} km), anchorage approach ${b.s.toFixed(1)}..${VOY.len.toFixed(1)} (${((VOY.len - b.s) / PX_PER_KM).toFixed(1)} km); between: min ${worst.km.toFixed(2)} km at s ${worst.s.toFixed(1)} (${ll.map((v) => v.toFixed(3))})`,
  );
  const profile = [];
  for (let s = 0; s <= VOY.len; s += 40) {
    const q = samples.reduce((m, r) => (Math.abs(r.s - s) < Math.abs(m.s - s) ? r : m));
    profile.push(`${s.toFixed(0)}:${q.km.toFixed(0)}`);
  }
  console.log(`  offshore km along the voyage (s:km) ${profile.join(" ")}`);
  if (worst.km < 5) throw new Error("the smoothed Narvaez voyage comes within 5 km of the coast");
  if (a.s / PX_PER_KM > 20 || (VOY.len - b.s) / PX_PER_KM > 20) throw new Error("an end zone of the voyage is longer than 20 km");
})();
// -- THE RIDING VOYAGE (CHANGED 2026-10-01, director's review 1, second pass) -----
// The path a ship glyph actually sails. At the zoom the voyage is seen at
// (k ~0.95-1.7) a carrack is 36-52 px long and its box ~0.8 deg of latitude
// tall: a box that does not fit between the Cayman Islands and the Jardines de
// la Reina (38 world px apart, the box 36 px tall), nor between the Arrecife
// Alacranes and Yucatan. So the ship sails the open-water line: out of
// Santiago's bay, west between Cuba (Cabo Cruz) and Jamaica, south of the
// three Caymans, north-west through the Yucatan Channel (between Cabo San
// Antonio and Cabo Catoche), in one broad arc over the Gulf north of the
// Alacranes, and south-west into the anchorage off San Juan de Ulua.
// The line is ONE clamped cubic B-spline (C2: no kinks, so a ship riding it
// at speed turns smoothly) whose control points were optimised (scratch probe,
// Oct 1 2026) for the lowest peak on-screen acceleration of cut 1's ship with
// its whole box >= 6 world px clear of land wherever it is seen.
// Checked below against the exact coast: the conservative box (at a lower
// bound of cut 1's zoom, tilted <= 2.1 deg) keeps >= 5 world px of clearance
// at every sample between the two end zones (leaving Santiago's bay,
// approaching the anchorage), and the line is >= 35 km off Cuba.
const RIDE_CP = [
  [SITES.santiago.lon, SITES.santiago.lat],
  [-75.85894, 19.85757], // straight down the bay
  [-75.90533, 19.62529],
  [-75.92697, 19.11868],
  [-77.08583, 18.70531], // between Cabo Cruz and Jamaica
  [-78.11705, 18.82127],
  [-78.77174, 18.80315],
  [-79.48659, 18.6302], // south of Cayman Brac and Little Cayman
  [-80.3109, 18.30977],
  [-81.38433, 18.23528], // south of Grand Cayman
  [-82.35337, 18.42939],
  [-83.27589, 18.89572],
  [-84.15763, 19.6166],
  [-85.18833, 20.50709], // the Yucatan Channel
  [-85.62011, 21.01006],
  [-86.20715, 21.87528],
  [-87.43496, 22.6857],
  [-88.82032, 23.00008], // north of the Arrecife Alacranes
  [-89.95864, 22.91762],
  [-90.85166, 22.68238],
  [-91.87034, 22.19206],
  [-93.01637, 21.28935],
  [-93.72574, 20.67713],
  [-94.45551, 20.11334],
  [-95.08517, 19.49524], // the approach to the anchorage
  [-95.55296, 19.23718],
  [-95.85077, 19.22255],
  [SITES.sanJuanDeUlua.lon, SITES.sanJuanDeUlua.lat],
];
/** a clamped cubic B-spline through control points `cp` (uniform knots), `per` samples a span */
const bspline = (cp, per = 64) => {
  const nC = cp.length;
  const deg = 3;
  const spans = nC - deg;
  const knots = [];
  for (let i = 0; i < nC + deg + 1; i++) knots.push(i <= deg ? 0 : i >= nC ? spans : i - deg);
  const out = [];
  const N = spans * per;
  for (let q = 0; q <= N; q++) {
    const t = Math.min(spans - 1e-9, (q / N) * spans);
    let k = deg;
    while (k < nC - 1 && t >= knots[k + 1]) k++;
    const d = [];
    for (let j = 0; j <= deg; j++) d.push([...cp[j + k - deg]]);
    for (let r = 1; r <= deg; r++)
      for (let j = deg; j >= r; j--) {
        const al = (t - knots[j + k - deg]) / (knots[j + 1 + k - r] - knots[j + k - deg] || 1);
        d[j] = [(1 - al) * d[j - 1][0] + al * d[j][0], (1 - al) * d[j - 1][1] + al * d[j][1]];
      }
    out.push(d[deg]);
  }
  return out;
};
// the carrack's box about its waterline point, world px, at camera zoom k: cut 1's
// glyph (37.5 k^0.6 px long; units = length / 100; bowsprit to the west, x
// -56.5 .. +46, y -81.6 .. +6.6), bobbing (+-1.1 units) and tilted <= 2.1 deg
const boxAtK = (k) => {
  const u = (37.5 * Math.pow(k, 0.6)) / 100 / k;
  const t = Math.sin((2.1 * Math.PI) / 180);
  return { bow: (56.5 + 82.7 * t) * u, stern: (46 + 82.7 * t) * u, top: (82.7 + 56.5 * t) * u, bottom: (7.7 + 56.5 * t) * u };
};
// a LOWER bound of cut 1's camera zoom when its ship reaches a fraction f of the
// line (the smaller k, the larger the box in world px): 0.985 x the zoom the
// ship actually sees (it leaves at k 0.955 and anchors at k ~1.69)
const K_EST = [
  [0, 0.955],
  [0.1, 0.969],
  [0.2, 0.972],
  [0.3, 0.985],
  [0.4, 1.016],
  [0.5, 1.069],
  [0.6, 1.145],
  [0.7, 1.24],
  [0.8, 1.348],
  [0.9, 1.48],
  [1, 1.69],
].map(([f, k]) => [f, k * 0.985]);
const kEstAt = (f) => {
  for (let i = 1; i < K_EST.length; i++)
    if (f <= K_EST[i][0]) return K_EST[i - 1][1] + ((K_EST[i][1] - K_EST[i - 1][1]) * (f - K_EST[i - 1][0])) / (K_EST[i][0] - K_EST[i - 1][0]);
  return K_EST[K_EST.length - 1][1];
};
const resampleBy = (pts, step) => {
  const c = cumOf(pts);
  const L = c[c.length - 1];
  const n = Math.max(2, Math.round(L / step));
  const out = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = (L * i) / n;
    while (j < c.length - 2 && c[j + 1] < t) j++;
    const u = (t - c[j]) / (c[j + 1] - c[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
};
/** the clearance of a box (world px) from the exact coast: 0 when any coast segment enters it; searched to `max` */
const boxClearance = (x, y, box, max = 20) => {
  const x0 = x - box.bow;
  const x1 = x + box.stern;
  const y0 = y - box.top;
  const y1 = y + box.bottom;
  if (isLand(x, y)) return 0;
  const ptRect = (px, py) => Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(y0 - py, 0, py - y1));
  const ptSeg = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  };
  const crosses = (ax, ay, bx, by) => {
    // does segment ab meet the rectangle? (Liang-Barsky clip)
    let t0 = 0;
    let t1 = 1;
    const dx = bx - ax;
    const dy = by - ay;
    for (const [pp, qq] of [
      [-dx, ax - x0],
      [dx, x1 - ax],
      [-dy, ay - y0],
      [dy, y1 - ay],
    ]) {
      if (pp === 0) {
        if (qq < 0) return false;
      } else {
        const r = qq / pp;
        if (pp < 0) t0 = Math.max(t0, r);
        else t1 = Math.min(t1, r);
        if (t0 > t1) return false;
      }
    }
    return true;
  };
  let best = max;
  const i0 = Math.floor((x0 - max) / BUCKET);
  const i1 = Math.floor((x1 + max) / BUCKET);
  const j0 = Math.floor((y0 - max) / BUCKET);
  const j1 = Math.floor((y1 + max) / BUCKET);
  const seen = new Set();
  for (let a = i0; a <= i1; a++)
    for (let b = j0; b <= j1; b++) {
      const segs = segGrid.get(`${a},${b}`);
      if (!segs) continue;
      for (const i of segs) {
        if (seen.has(i)) continue;
        seen.add(i);
        const [ax, ay, bx, by] = coastSegs[i];
        if (crosses(ax, ay, bx, by)) return 0;
        const d = Math.min(
          ptRect(ax, ay),
          ptRect(bx, by),
          ptSeg(x0, y0, ax, ay, bx, by),
          ptSeg(x1, y0, ax, ay, bx, by),
          ptSeg(x0, y1, ax, ay, bx, by),
          ptSeg(x1, y1, ax, ay, bx, by),
        );
        if (d < best) best = d;
      }
    }
  return best;
};
const RIDE = (() => {
  const pts = resampleBy(bspline(RIDE_CP.map(P)), 0.5);
  const cum = cumOf(pts);
  // wpS: the arclength nearest each control point (a control point is off the line; this is only a locator)
  const wpS = RIDE_CP.map(P).map(([wx, wy]) => {
    let best = Infinity;
    let bs = 0;
    pts.forEach(([x, y], i) => {
      const d = Math.hypot(x - wx, y - wy);
      if (d < best) [best, bs] = [d, cum[i]];
    });
    return bs;
  });
  return { pts, wpS, len: cum[cum.length - 1] };
})();
const RIDE_MIN_CLEAR = 5;
const RIDE_CLEAR = (() => {
  const cum = cumOf(RIDE.pts);
  const L = RIDE.len;
  const clr = RIDE.pts.map(([x, y], i) => (i % 2 === 0 ? boxClearance(x, y, boxAtK(kEstAt(cum[i] / L))) : null));
  for (let i = 1; i < clr.length; i += 2) clr[i] = Math.min(clr[i - 1], clr[i + 1] ?? clr[i - 1]);
  // the clear stretch: from the first sample after which the box stays >= RIDE_MIN_CLEAR clear, to the last
  let ib = clr.length - 1;
  while (ib > 0 && clr[ib] < RIDE_MIN_CLEAR) ib--;
  let ia = ib;
  while (ia > 0 && clr[ia - 1] >= RIDE_MIN_CLEAR) ia--;
  let minC = Infinity;
  let minAt = 0;
  for (let i = ia; i <= ib; i++) if (clr[i] < minC) [minC, minAt] = [clr[i], i];
  // offshore along Cuba (lon -84.9 .. -75.9): the nearest coast to the NORTH (Cuba and its cays), km
  let minKm = Infinity;
  let at = null;
  RIDE.pts.forEach(([x, y], i) => {
    if (i < ia || i > ib || i % 4) return;
    const ll = projection.invert([x, y]);
    if (ll[0] < -84.9 || ll[0] > -75.9) return;
    let best = Infinity;
    for (const [ax, ay, bx, by] of coastSegs) {
      if ((ay + by) / 2 > y) continue; // only land north of the path
      if (Math.abs(ax - x) > 120 || Math.abs(ay - y) > 120) continue;
      const dx = bx - ax;
      const dy = by - ay;
      const l2 = dx * dx + dy * dy || 1e-12;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
    }
    const km = best / PX_PER_KM;
    if (km < minKm) [minKm, at] = [km, ll];
  });
  // the line itself at sea between Santiago's bay and the anchorage (>= 2 km off every coast)
  let seaMin = Infinity;
  RIDE.pts.forEach(([x, y], i) => {
    if (cum[i] < 12 || cum[i] > L - 4 || i % 4) return;
    const d = isLand(x, y) ? 0 : coastDist(x, y, 20);
    seaMin = Math.min(seaMin, d / PX_PER_KM);
  });
  const prof = [];
  for (let s = 0; s <= L; s += 50) prof.push(`${s}:${Math.floor(clr[Math.min(clr.length - 1, Math.round(s / 0.5))])}`);
  console.log(
    `riding voyage: len ${L.toFixed(1)}; the glyph box (at a lower bound of cut 1's zoom) keeps >= ${RIDE_MIN_CLEAR} world px clear of the exact coast from s ${cum[ia].toFixed(1)} (${(cum[ia] / PX_PER_KM).toFixed(0)} km out of Santiago) to s ${cum[ib].toFixed(1)} (${((L - cum[ib]) / PX_PER_KM).toFixed(0)} km short of Ulua); min ${minC.toFixed(2)} at s ${cum[minAt].toFixed(1)} (${projection.invert(RIDE.pts[minAt]).map((v) => v.toFixed(2))}); nearest coast along Cuba ${minKm.toFixed(0)} km (${at ? at.map((v) => v.toFixed(2)) : "-"}); the line >= ${seaMin.toFixed(1)} km off any coast between the bay and the anchorage`,
  );
  console.log(`  box clearance along the line (s:px) ${prof.join(" ")}`);
  if (cum[ia] > 80 || L - cum[ib] > 45) throw new Error("the riding voyage's clear stretch is too short");
  if (minKm < 35) throw new Error("the riding voyage comes within 35 km of Cuba");
  if (seaMin < 2) throw new Error("the riding voyage's line touches the coast");
  return { a: cum[ia], b: cum[ib] };
})();
// -- the road and the land leg stay on land ---------------------------------------
for (const [name, R] of [
  ["road", ROAD],
  ["land leg", LANDLEG],
]) {
  let off = 0;
  for (let i = 0; i < R.pts.length; i++) if (!isLand(R.pts[i][0], R.pts[i][1])) off++;
  console.log(`${name}: ${R.pts.length} pts, ${off} off land`);
  if (off > (name === "land leg" ? 3 : 0)) throw new Error(`the ${name} leaves the land`);
}

// ---------------------------------------------------------------------------
// THE 1519 EMPIRE: clipped to Natural Earth land, Lake Texcoco removed
// ---------------------------------------------------------------------------
const EMP = GEO.aztec_empire_1519;
const empireLL = (() => {
  const [outer, hole1, hole2, exclave] = EMP.rings;
  const box = [
    [
      [-106, 12],
      [-88, 12],
      [-88, 25],
      [-106, 25],
      [-106, 12],
    ],
  ];
  const landNear = landPolys.filter((rings) => {
    const b = ringBox(rings[0]);
    return b.x1 >= -106 && b.x0 <= -88 && b.y1 >= 12 && b.y0 <= 25;
  });
  const landClip = polygonClipping.intersection(landNear, box);
  const emp = polygonClipping.intersection(
    [
      [outer, hole1, hole2],
      [exclave],
    ],
    landClip,
  );
  return polygonClipping.difference(emp, [LAKE_RING_LL]);
})();
const EMPIRE_POLYS = empireLL.map((poly) => poly.map((ring) => ring.map((ll) => P(ll).map(r2))));
const EMPIRE_D = EMPIRE_POLYS.map((poly) => poly.map((ring) => toD(ring, true)).join("")).join("");
// the border lines: the rings' own edges (unclipped), only where they run over land
const EMPIRE_BORDER_D = (() => {
  let out = "";
  for (const ring of EMP.rings) {
    let run = [];
    const flush = () => {
      if (run.length > 1) out += toD(run);
      run = [];
    };
    for (let i = 0; i < ring.length; i++) {
      const q = P(ring[i]);
      const onLand = isLand(q[0], q[1]) && coastDist(q[0], q[1], 4) > 0.6;
      if (onLand) run.push(q);
      else flush();
    }
    flush();
  }
  return out;
})();
const LAKE_RING = LAKE_RING_LL.map((ll) => P(ll).map(r3));
console.log(`empire: ${EMPIRE_POLYS.length} polygons, ${EMPIRE_POLYS.reduce((s, p) => s + p.length, 0)} rings; border ${EMPIRE_BORDER_D.length} chars`);

// ---------------------------------------------------------------------------
// LAND MASKS (1 bit per cell) for builders' checks: the stage at 1 cell / world
// px, and round Cempoala at 4 cells / world px.
// ---------------------------------------------------------------------------
const maskOf = (x0, y0, w, h, s) => {
  const W = Math.round(w * s);
  const H = Math.round(h * s);
  const bits = new Uint8Array(Math.ceil((W * H) / 8));
  let n = 0;
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      if (isLand(x0 + (i + 0.5) / s, y0 + (j + 0.5) / s)) {
        const q = j * W + i;
        bits[q >> 3] |= 1 << (q & 7);
        n++;
      }
    }
  return { x0, y0, s, w: W, h: H, b64: Buffer.from(bits).toString("base64"), land: n };
};
const MASK_STAGE = maskOf(-120, 640, 1240, 420, 1);
const MASK_FINE = maskOf(80, 800, 150, 140, 4);
console.log(`land masks: stage ${MASK_STAGE.w}x${MASK_STAGE.h}, fine ${MASK_FINE.w}x${MASK_FINE.h}`);

// ---------------------------------------------------------------------------
// THE CEMPOALA CROWDS. 1 dot = 10 men (cortes-geo.json facts): the Spanish at
// Cempoala, 117 dots = Narvaez's ~900 (90) + Cortes's 266 (27).
//   SPANISH_ONE  one even blue-noise crowd (cut 1's opening): an organic oval,
//                long axis east-west, whose east end is trimmed by the coast;
//                Cempoala sits at its east edge
//   index i < 90: Narvaez's men (cream); i >= 90: Cortes's 27 (orange) = the
//                27 inland (west) dots of SPANISH_ONE, west of a gently wavy
//                north-south fissure x - w(y) = FISSURE_KEY
//   CREAM_REST / ORANGE_REST  (CHANGED 2026-10-01, director's review 1) two
//                ROUNDED BODIES facing each other across a clear channel of ~2 dot
//                spacings: Cortes's 27 a compact organic oval slightly taller
//                than wide, on his road (the road starts inside it); Narvaez's 90
//                a rounded organic oval whose east side follows the coast. Each
//                is blue noise; the SPANISH_ONE dot that takes REST slot j is
//                chosen by an optimal assignment (minimum total squared distance),
//                so the split is one non-crossing move
//   FISSURE      the split's fissure through SPANISH_ONE (N -> S)
//   CHANNEL      the open channel's centre line between the two bodies at rest
//                (N -> S): the seam where they meet in the clash
// Dot i keeps its identity across layouts (the same dot moves). Local frame:
// U_AXIS = east, V_AXIS = south (world axes), origin CROWD_CENTRE.
// ---------------------------------------------------------------------------
const N_CREAM = 90;
const N_ORANGE = 27;
const N_DOTS = N_CREAM + N_ORANGE;
const DOT_R = 1.25; // world px: a dot's radius at k >= 2 (20 px wide at k 8)
const SLOT = 3.4; // world px between dot centres (1.36 dot widths)
const COAST_KEEP = 3.2; // a dot centre's minimum distance inside the coast (world px)
const DRIFT_C = 0.9;
let seed = 1520;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const coastAt = (y) => {
  // the coast's x at world y (the first crossing east of x 140)
  let xs = [];
  for (const [ax, ay, bx, by] of coastSegs)
    if ((ay - y) * (by - y) <= 0 && ay !== by && Math.max(ax, bx) > 120 && Math.min(ax, bx) < 220) xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
  xs = xs.filter((x) => x > 140).sort((p, q) => p - q);
  return xs[0];
};
const CEM = [SITES.cempoala.x, SITES.cempoala.y];
const U_AXIS = [1, 0];
const V_AXIS = [0, 1];
const KEEP_ONE = COAST_KEEP + DRIFT_C + 0.35;
// an organic oval, semi-axes A (east-west) x B (north-south), low-frequency
// radial noise; its east tip TRIM world px past the coast buffer at its centre's
// latitude, so the coast trims it into the coast's own line
const ASPECT = 1.42;
const TRIM = 3.5;
const CY_OFF = -4.5; // the centre this far north of Cempoala: the south side clears the bay at Ulua
const blob = (A, B, cx, cy) => {
  const ph = [0.7, 2.1, 4.4, 1.3];
  return (x, y) => {
    const u = x - cx;
    const v = y - cy;
    const th = Math.atan2(v / B, u / A);
    const rr = 1 + 0.06 * Math.sin(2 * th + ph[0]) + 0.05 * Math.sin(3 * th + ph[1]) + 0.03 * Math.sin(5 * th + ph[2]) + 0.02 * Math.sin(7 * th + ph[3]);
    return Math.hypot(u / A, v / B) <= rr;
  };
};
const MASK_RES = 0.1;
const NEED = N_DOTS * 0.866 * SLOT * SLOT * 1.1;
const cellsOf = (inside, cx, cy, R) => {
  const out = [];
  for (let y = cy - R; y <= cy + R; y += MASK_RES)
    for (let x = cx - R; x <= cx + R; x += MASK_RES) if (inside(x, y) && isLand(x, y) && coastDist(x, y, 12) >= KEEP_ONE) out.push([x, y]);
  return out;
};
let B = 14;
let crowdCells = [];
let CROWD_C = null;
for (let it = 0; it < 40; it++) {
  const A = B * ASPECT;
  const cy = CEM[1] + CY_OFF;
  const cx = coastAt(cy) - KEEP_ONE + TRIM - A;
  CROWD_C = [cx, cy];
  crowdCells = cellsOf(blob(A, B, cx, cy), cx, cy, A * 1.2);
  const area = crowdCells.length * MASK_RES * MASK_RES;
  if (area >= NEED) break;
  B += 0.25;
}
console.log(`crowd oval: A ${(B * ASPECT).toFixed(1)} x B ${B.toFixed(1)} world px round (${CROWD_C.map((v) => v.toFixed(1))}), ${crowdCells.length} cells`);
const inMask = (() => {
  const set = new Set(crowdCells.map(([x, y]) => `${Math.round(x / MASK_RES)},${Math.round(y / MASK_RES)}`));
  return (x, y) => set.has(`${Math.round(x / MASK_RES)},${Math.round(y / MASK_RES)}`);
})();
const relax = (pts, isIn, iters, s = SLOT * 1.04) => {
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < pts.length; i++) {
      let fx = 0;
      let fy = 0;
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        if (Math.abs(dx) > s || Math.abs(dy) > s) continue;
        const d = Math.hypot(dx, dy) || 1e-6;
        if (d >= s) continue;
        fx += (dx / d) * (s - d) * 0.5;
        fy += (dy / d) * (s - d) * 0.5;
      }
      const nx = pts[i][0] + fx;
      const ny = pts[i][1] + fy;
      if (isIn(nx, ny)) pts[i] = [nx, ny];
      else if (isIn(pts[i][0] + fx * 0.3, pts[i][1] + fy * 0.3)) pts[i] = [pts[i][0] + fx * 0.3, pts[i][1] + fy * 0.3];
    }
  }
  return pts;
};
const bestCandidate = (n, cells, isIn) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    let best = null;
    let bd = -1;
    for (let c = 0; c < 30; c++) {
      const p = cells[Math.floor(rand() * cells.length)];
      let d = Infinity;
      for (const q of pts) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1]));
      if (d > bd) [bd, best] = [d, p];
    }
    pts.push([best[0], best[1]]);
  }
  return relax(pts, isIn, 28);
};
const ONE_RAW = bestCandidate(N_DOTS, crowdCells, inMask);
// THE SPLIT: the 27 smallest x - w(y) (a gentle wave, so the fissure is not a ruler line)
const wave = (v) => 0.8 * Math.sin(v / 6.5 + 1.1) + 0.4 * Math.sin(v / 2.9 + 2.6);
const keyed = ONE_RAW.map((p, i) => ({ p, i, key: p[0] - CROWD_C[0] - wave(p[1] - CROWD_C[1]) }));
keyed.sort((a, b) => a.key - b.key);
const orangeSet = new Set(keyed.slice(0, N_ORANGE).map((q) => q.i));
const FISSURE_KEY = (keyed[N_ORANGE - 1].key + keyed[N_ORANGE].key) / 2;
// identities: cream first (north -> south), then orange (north -> south)
const byV = (a, b) => a[1] - b[1];
const creamPts = ONE_RAW.filter((_, i) => !orangeSet.has(i)).sort(byV);
const orangePts = ONE_RAW.filter((_, i) => orangeSet.has(i)).sort(byV);
const SPANISH_ONE = [...creamPts, ...orangePts];
const FISSURE = [];
{
  const vs = SPANISH_ONE.map((p) => p[1] - CROWD_C[1]);
  for (let v = Math.min(...vs) - 2; v <= Math.max(...vs) + 2 + 1e-9; v += 1.5) FISSURE.push([CROWD_C[0] + FISSURE_KEY + wave(v), CROWD_C[1] + v]);
}
// -- THE TWO BODIES ---------------------------------------------------------------
const O_C = [112.8, 860.4]; // Cortes's body: on his road (it runs through its upper middle, Zautla - Ixtacamaxtitlan)
const O_ASPECT = 1.22; // taller than wide
const C_ASPECT = 1.12;
const C_Y = 863.0; // Narvaez's body's centre latitude (Cempoala at its seaward edge)
const D_CH = 2 * SLOT + 2 * DOT_R + 0.4; // centre distance across the channel: ~2 dot spacings clear
const organic = (cx, cy, A, B, ph) => (x, y) => {
  const u = x - cx;
  const v = y - cy;
  const th = Math.atan2(v / B, u / A);
  const rr = 1 + 0.05 * Math.sin(2 * th + ph[0]) + 0.04 * Math.sin(3 * th + ph[1]) + 0.025 * Math.sin(5 * th + ph[2]);
  return Math.hypot(u / A, v / B) <= rr;
};
const bodyCells = (inside, cx, cy, R, keep) => {
  const out = [];
  for (let y = cy - R; y <= cy + R; y += MASK_RES)
    for (let x = cx - R; x <= cx + R; x += MASK_RES) if (inside(x, y) && isLand(x, y) && coastDist(x, y, 14) >= keep) out.push([x, y]);
  return out;
};
const setOf = (cells) => {
  const set = new Set(cells.map(([x, y]) => `${Math.round(x / MASK_RES)},${Math.round(y / MASK_RES)}`));
  return (x, y) => set.has(`${Math.round(x / MASK_RES)},${Math.round(y / MASK_RES)}`);
};
const blueNoiseIn = (n, cells, isIn) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    let best = null;
    let bd = -1;
    for (let c = 0; c < 30; c++) {
      const p = cells[Math.floor(rand() * cells.length)];
      let d = Infinity;
      for (const q of pts) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1]));
      if (d > bd) [bd, best] = [d, p];
    }
    pts.push([best[0], best[1]]);
  }
  return relax(pts, isIn, 28);
};
// Cortes's body: grown until it holds 27 dots
let ORANGE_SLOTS = null;
let O_A = 7;
{
  for (let it = 0; it < 40; it++) {
    const cells = bodyCells(organic(O_C[0], O_C[1], O_A, O_A * O_ASPECT, [1.9, 0.4, 3.3]), O_C[0], O_C[1], O_A * O_ASPECT * 1.3, COAST_KEEP);
    if (cells.length * MASK_RES * MASK_RES >= N_ORANGE * 0.866 * SLOT * SLOT * 1.12) {
      ORANGE_SLOTS = blueNoiseIn(N_ORANGE, cells, setOf(cells));
      break;
    }
    O_A += 0.2;
  }
}
// Narvaez's body: its west edge D_CH east of Cortes's front, its east side the
// coast; grown (east-west and north-south together) until it holds 90 dots
let CREAM_SLOTS = null;
let C_A = 14;
let C_X = 0;
{
  const oFront = (y) => Math.max(...ORANGE_SLOTS.filter((p) => Math.abs(p[1] - y) < 3).map((p) => p[0]), -Infinity);
  for (let it = 0; it < 80; it++) {
    const west = Math.max(...ORANGE_SLOTS.map((p) => p[0])) + D_CH - 1.2;
    C_X = west + C_A;
    const cells = bodyCells(organic(C_X, C_Y, C_A, C_A * C_ASPECT, [0.6, 2.4, 4.1]), C_X, C_Y, C_A * C_ASPECT * 1.3, COAST_KEEP + 0.4).filter(
      ([x, y]) => x - Math.max(oFront(y), Math.max(...ORANGE_SLOTS.map((p) => p[0])) - 6) >= D_CH - 0.2,
    );
    if (cells.length * MASK_RES * MASK_RES >= N_CREAM * 0.866 * SLOT * SLOT * 1.12) {
      CREAM_SLOTS = blueNoiseIn(N_CREAM, cells, setOf(cells));
      break;
    }
    C_A += 0.25;
  }
}
// the optimal assignment (Hungarian, minimum total squared distance)
const hungarian = (cost) => {
  const n = cost.length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++)
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      for (let j = 0; j <= n; j++)
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const ans = new Array(n);
  for (let j = 1; j <= n; j++) ans[p[j] - 1] = j - 1;
  return ans; // ans[i] = the slot for source i
};
const assign = (src, slots) => {
  const cost = src.map((a) => slots.map((b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2));
  const ans = hungarian(cost);
  return src.map((_, i) => slots[ans[i]]);
};
const CREAM_REST = assign(creamPts, CREAM_SLOTS);
const ORANGE_REST = assign(orangePts, ORANGE_SLOTS);
// the channel's centre line between the two bodies (N -> S): the seam
const CHANNEL = [];
{
  const ys = [...ORANGE_REST, ...CREAM_REST].map((p) => p[1]);
  const front = (pts, y, f) => {
    const near = pts.filter((p) => Math.abs(p[1] - y) < 3.2);
    return near.length ? f(...near.map((p) => p[0])) : null;
  };
  const raw = [];
  for (let y = Math.min(...ys) - 2; y <= Math.max(...ys) + 2 + 1e-9; y += 1.5) {
    const o = front(ORANGE_REST, y, Math.max);
    const c = front(CREAM_REST, y, Math.min);
    raw.push([y, o, c]);
  }
  const mids = raw.filter(([, o, c]) => o !== null && c !== null).map(([, o, c]) => (o + c) / 2);
  const mean = mids.reduce((a, b) => a + b, 0) / mids.length;
  for (const [y, o, c] of raw) CHANNEL.push([o !== null && c !== null ? 0.5 * ((o + c) / 2) + 0.5 * mean : mean, y]);
}
const GATHER = 1; // deprecated (the rest layouts are no longer translations)
const DRIFT_C_MEAN = CREAM_REST.reduce((a, p, i) => a + (p[0] - creamPts[i][0]), 0) / N_CREAM;
const CHANNEL_O_MEAN = ORANGE_REST.reduce((a, p, i) => a + (orangePts[i][0] - p[0]), 0) / N_ORANGE;
// -- checks: land, coast distance, blue-noise spacing --------------------------
const nnStats = (pts) => {
  const nn = pts.map((p, i) => Math.min(...pts.map((q, j) => (i === j ? Infinity : Math.hypot(q[0] - p[0], q[1] - p[1])))));
  nn.sort((a, b) => a - b);
  return { min: nn[0], p10: nn[Math.floor(nn.length * 0.1)], med: nn[nn.length >> 1], p90: nn[Math.floor(nn.length * 0.9)] };
};
for (const [name, pts] of [
  ["SPANISH_ONE", SPANISH_ONE],
  ["CREAM_REST", CREAM_REST],
  ["ORANGE_REST", ORANGE_REST],
]) {
  let worst = Infinity;
  for (const [x, y] of pts) {
    if (!isLand(x, y)) throw new Error(`${name}: a dot at sea (${x}, ${y})`);
    worst = Math.min(worst, coastDist(x, y, 20));
  }
  const st = nnStats(pts);
  console.log(
    `${name}: ${pts.length} dots, min coast distance ${worst.toFixed(2)} world px (${(worst / PX_PER_KM).toFixed(1)} km); nearest neighbour min ${st.min.toFixed(2)} p10 ${st.p10.toFixed(2)} med ${st.med.toFixed(2)} p90 ${st.p90.toFixed(2)}`,
  );
  if (worst < COAST_KEEP - 1e-6) throw new Error(`${name}: a dot within ${COAST_KEEP} world px of the coast`);
  if (st.min < SLOT * 0.85) throw new Error(`${name}: dots closer than 0.85 SLOT`);
}
{
  // the clear channel: the nearest orange-cream pair at rest, centre to centre
  let gap = Infinity;
  for (const o of ORANGE_REST) for (const c of CREAM_REST) gap = Math.min(gap, Math.hypot(o[0] - c[0], o[1] - c[1]));
  console.log(`channel at rest: nearest orange-cream pair ${gap.toFixed(2)} world px apart (centres), clear ${(gap - 2 * DOT_R).toFixed(2)}`);
  const ext = (pts) => {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return `x ${Math.min(...xs).toFixed(1)}..${Math.max(...xs).toFixed(1)}, y ${Math.min(...ys).toFixed(1)}..${Math.max(...ys).toFixed(1)}`;
  };
  console.log(`extents: SPANISH_ONE ${ext(SPANISH_ONE)}; CREAM_REST ${ext(CREAM_REST)}; ORANGE_REST ${ext(ORANGE_REST)}`);
  const cemIn = Math.min(...CREAM_REST.map(([x, y]) => Math.hypot(x - CEM[0], y - CEM[1])));
  console.log(`Cempoala: nearest cream dot ${cemIn.toFixed(2)} world px`);
  // the road through the orange group
  let rd = Infinity;
  const oc = [ORANGE_REST.reduce((s, p) => s + p[0], 0) / N_ORANGE, ORANGE_REST.reduce((s, p) => s + p[1], 0) / N_ORANGE];
  for (const q of ROAD.pts) rd = Math.min(rd, Math.hypot(q[0] - oc[0], q[1] - oc[1]));
  console.log(`the road passes ${rd.toFixed(2)} world px from the orange group's centre (${oc.map((v) => v.toFixed(1))})`);
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-cortes-map.mjs — do not edit by hand.
// The STATIC layers of the Cortes world, read only by
// scripts/bake-cortes-rasters.mjs. Natural Earth 10m land (public domain; no
// borders, no modern lakes) + Lake Texcoco 1519 (scripts/cortes-geo.json) on a
// north-up Lambert conformal conic, parallels 17/23, centre meridian 87 W,
// scale ${SCALE.toFixed(3)}. World px == screen px at the k 1 Gulf wide.
// Clipped to ${JSON.stringify(CLIP)}.

/** Land, one path (evenodd). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** Lake Texcoco, 1519 (water). */
export const LAKE_D = ${JSON.stringify(LAKE_D)};
/** 5 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
const rp = (pts) => pts.map(([x, y]) => [r3(x), r3(y)]);
const routeOut = (R) => ({ pts: rp(R.pts), wpS: R.wpS.map(r3), len: r3(R.len) });
writeFileSync(
  OUT,
  `// Generated by scripts/build-cortes-map.mjs — do not edit by hand.
// The light OVERLAYS of the Cortes world (see cortesShared.tsx for the API).
// Lambert conformal conic, parallels 17/23, centre meridian 87 W, scale
// ${SCALE.toFixed(3)}; world px == screen px at the k 1 Gulf wide (lat 20 N at
// x 0 and x 1080 on y 835). ${PX_PER_KM.toFixed(4)} world px per km.
// Sources: scripts/cortes-geo.json (sites, routes, the georeferenced 1519
// empire and Lake Texcoco, facts), Natural Earth 10m land (world-atlas).

export type P2 = [number, number];
export type Site = { x: number; y: number; lon: number; lat: number };
export type RouteData = { pts: P2[]; wpS: number[]; len: number };

/** d3 geoConicConformal parameters (center [0, 0]); cortesShared.project() reproduces it. */
export const PROJ = { parallels: ${JSON.stringify(PARALLELS)} as [number, number], rotate: ${JSON.stringify(ROTATE)} as [number, number], scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export const PX_PER_KM = ${PX_PER_KM.toFixed(5)};
/** the rect the static layers are baked over (world px) */
export const WORLD_CLIP = ${JSON.stringify(CLIP)};

/** The five sites (world px + lon/lat). */
export const SITES: Record<"santiago" | "caboSanAntonio" | "sanJuanDeUlua" | "cempoala" | "tenochtitlan", Site> = ${JSON.stringify(SITES)};

/** Routes, smoothed (centripetal Catmull-Rom through the projected waypoints), world px.
 *  wpS = arclength at each waypoint. */
export const NARVAEZ_VOYAGE_DATA: RouteData = ${JSON.stringify(routeOut(VOY))};
export const NARVAEZ_LAND_LEG_DATA: RouteData = ${JSON.stringify(routeOut(LANDLEG))};
/** CHANGED 2026-10-01 (second pass): the path a ship glyph sails (Santiago -> San Juan de Ulua), one smooth
 *  clamped B-spline in open water: between Cuba and Jamaica, south of the Caymans, through the Yucatan Channel,
 *  north of the Arrecife Alacranes, into the anchorage. A carrack's whole box (36 px long at k 0.95 .. 52 px at
 *  k 1.7) keeps >= 5 world px clear of land between RIDE_CLEAR_S[0] (out of Santiago's bay) and RIDE_CLEAR_S[1]
 *  (the anchorage, ~29 world px east of Ulua); wpS = arclength nearest each control point (a locator only). */
export const NARVAEZ_VOYAGE_RIDE_DATA: RouteData = ${JSON.stringify(routeOut(RIDE))};
export const RIDE_CLEAR_S: [number, number] = ${JSON.stringify([r3(RIDE_CLEAR.a), r3(RIDE_CLEAR.b)])};
export const CORTES_ROAD_DATA: RouteData = ${JSON.stringify(routeOut(ROAD))};

/** The 1519 empire (Triple Alliance tributary provinces), clipped to Natural
 *  Earth land, Lake Texcoco removed: an evenodd fill path, its polygons (world px;
 *  first ring outer, the rest holes; Tlaxcala and Teotitlan are holes, Soconusco
 *  an exclave), and its border lines where they run over land (no coast). */
export const EMPIRE_D = ${JSON.stringify(EMPIRE_D)};
export const EMPIRE_POLYS: P2[][][] = ${JSON.stringify(EMPIRE_POLYS)};
export const EMPIRE_BORDER_D = ${JSON.stringify(EMPIRE_BORDER_D)};
/** Lake Texcoco 1519, one ring (world px). */
export const LAKE_TEXCOCO: P2[] = ${JSON.stringify(LAKE_RING)};

/** Land bitmasks (bit (j * w + i) set = land at cell centre x0 + (i + 0.5) / s, y0 + (j + 0.5) / s). */
export const LAND_MASK_STAGE = ${JSON.stringify(MASK_STAGE)};
export const LAND_MASK_FINE = ${JSON.stringify(MASK_FINE)};

/** THE CEMPOALA CROWDS (1 dot = 10 men). Index i < N_CREAM: Narvaez's men
 *  (cream); i >= N_CREAM: Cortes's (orange). Same dot, same index, every layout. */
export const N_CREAM = ${N_CREAM};
export const N_ORANGE = ${N_ORANGE};
export const DOT_R_WORLD = ${DOT_R};
export const CROWD_SLOT = ${SLOT};
export const COAST_KEEP = ${COAST_KEEP};
/** the crowd's local frame: U across the coast (to the sea, ENE), V along it (SSE), origin CROWD_CENTRE */
export const CROWD_CENTRE: P2 = ${JSON.stringify(CROWD_C.map(r3))};
export const U_AXIS: P2 = ${JSON.stringify(U_AXIS.map((v) => +v.toFixed(6)))};
export const V_AXIS: P2 = ${JSON.stringify(V_AXIS.map((v) => +v.toFixed(6)))};
export const SPANISH_ONE: P2[] = ${JSON.stringify(rp(SPANISH_ONE))};
export const CREAM_REST: P2[] = ${JSON.stringify(rp(CREAM_REST))};
export const ORANGE_REST: P2[] = ${JSON.stringify(rp(ORANGE_REST))};
/** the split: the fissure is x - w(y - CROWD_CENTRE.y) = CROWD_CENTRE.x + FISSURE_KEY (w a gentle
 *  wave); FISSURE = the fissure through SPANISH_ONE; CHANNEL = the channel's centre line between the two
 *  rounded bodies at rest (the seam of the clash); both N -> S */
export const FISSURE_KEY = ${r3(FISSURE_KEY)};
export const FISSURE: P2[] = ${JSON.stringify(rp(FISSURE))};
export const CHANNEL: P2[] = ${JSON.stringify(rp(CHANNEL))};
/** deprecated: the mean x moves of the split (cream east, orange west); the rest layouts are no longer translations */
export const SPLIT = { driftCream: ${r3(DRIFT_C_MEAN)}, channelOrange: ${r3(CHANNEL_O_MEAN)}, gather: ${GATHER} };
`,
);
console.log(`Wrote ${OUT_STATIC} (land ${LAND_D.length}, lake ${LAKE_D.length}, graticule ${GRATICULE_D.length}) and ${OUT}`);
