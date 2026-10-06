// Bakes the geometry of THE NORTH ATLANTIC WORLD for the clip "Sheppard_Vikings"
// (Dwarkesh with Si Sheppard; Dwarkesh map style), shared by cut D
// (TriedToColonize) and cut E (DripFeed). Copy of the pattern of
// scripts/build-cortes-map.mjs / build-tlax-map.mjs.
//
//   bun scripts/build-vik-atlantic-map.mjs
//
// Reads Natural Earth 10m land from the installed world-atlas (public domain; no
// borders) and the natural lakes of scripts/sugar-lakes.geojson (Natural Earth
// 10m lakes, public domain: the Great Lakes, Nipigon, Mistassini, Champlain,
// Nettilling, Winnipeg ...; no reservoirs). Writes
//   generated/components/vikAtlanticStatic.ts   the STATIC layers (land polygons,
//                                                lakes, graticule) in world px,
//                                                read only by
//                                                scripts/bake-vik-atlantic-rasters.mjs
//   generated/components/vikAtlanticMapData.ts  the light OVERLAYS (projection,
//                                                sites, the Norse routes, land
//                                                masks; see vikAtlanticShared.tsx)
//
// THE PROJECTION. North-up Lambert conformal conic, parallels 50/64, centre
// meridian 52 W (between Greenland's south tip and Newfoundland, so both stand
// upright and keep their own shapes; plain Mercator would blow Greenland up).
// k = 1 is the framing in which lon 72 W ... 32 W at lat 56 N spans the 1080 px
// width, with (52 W, 56 N) at screen (540, 835): south Greenland, Labrador and
// Newfoundland together. World px == screen px at k 1.
//
// THE FACTS DRAWN (CLIP_SPEC.md "Verified facts"):
//   Brattahlid, the Eastern Settlement of Norse Greenland: 61.15 N 45.52 W
//     (founded c. 985; Leif Erikson's voyage c. 1000).
//   L'Anse aux Meadows, northern tip of Newfoundland: 51.596 N 55.533 W, the only
//     confirmed Norse site in North America (occupied AD 1021, Kuitems et al.,
//     Nature 2022; abandoned within about a decade).
//   The saga route (Graenlendinga saga, Eiriks saga rauda): Greenland -> west
//     across Davis Strait -> Helluland (Baffin Island) -> Markland (the Labrador
//     coast) -> Vinland. Drawn as ONE smooth sea line that keeps off the real
//     coasts: out of the fjord, north-west up Greenland's coast, across the
//     strait to the mouth of Frobisher Bay, south past Resolution Island and
//     Cape Chidley, down the Labrador coast to the Strait of Belle Isle and in
//     to L'Anse aux Meadows. Never labelled.
//   Greenland -> Iceland (for cut E): round Cape Farewell and north-east over
//     the Irminger Sea to Snaefellsnes / Breidafjordur in west Iceland, the
//     coast Erik the Red sailed from (c. 985).
// CHECKS (throws): both routes stay on the sea (except their first / last few
// km, where a site lies up a fjord or on the shore).

import { readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT_STATIC = "generated/components/vikAtlanticStatic.ts";
const OUT = "generated/components/vikAtlanticMapData.ts";

// ---------------------------------------------------------------------------
// THE PROJECTION
// ---------------------------------------------------------------------------
const PARALLELS = [50, 64];
const ROTATE = [52, 0];
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(1).translate([0, 0]);
{
  const a = projection([-72, 56]);
  const b = projection([-32, 56]);
  projection.scale(1080 / (b[0] - a[0]));
  const c = projection([-52, 56]);
  projection.translate([540 - c[0], 835 - c[1]]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
// the world the static layers are baked over (every level lies inside it)
const CLIP = [
  [-2600, -2400],
  [3700, 4200],
];
projection.clipExtent(CLIP);
const P = (ll) => projection(ll);
const PX_PER_KM = (() => {
  const p = P([-52, 55.5]);
  const q = P([-52, 56.5]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`scale ${SCALE.toFixed(3)}, translate ${TRANSLATE.map((v) => v.toFixed(3))}, ${PX_PER_KM.toFixed(4)} world px per km`);

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

// ---------------------------------------------------------------------------
// LAND (Natural Earth 10m) -> world px polygons, clipped to CLIP by d3
// ---------------------------------------------------------------------------
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const VIEW = { lon: [-160, 45], lat: [5, 89.9] };
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
/** a path sink that collects the projected (and clipped) rings of one polygon */
const ringSink = () => {
  const rings = [];
  let cur = null;
  return {
    moveTo(x, y) {
      cur = [x, y];
      rings.push(cur);
    },
    lineTo(x, y) {
      cur.push(x, y);
    },
    closePath() {},
    result: () => rings,
  };
};
const projectPoly = (rings) => {
  const sink = ringSink();
  geoPath(projection, sink)({ type: "Polygon", coordinates: rings });
  return sink.result().filter((r) => r.length >= 6);
};
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const LAND = []; // polygons: rings: flat [x, y, ...]
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    if (!ringInView(rings[0]) || !sane(rings)) continue;
    const pr = projectPoly(rings);
    if (pr.length) LAND.push(pr);
  }
const nVerts = (polys) => polys.reduce((s, p) => s + p.reduce((t, r) => t + r.length / 2, 0), 0);
console.log(`land: ${LAND.length} polygons, ${nVerts(LAND)} vertices`);

// LAKES: the natural lakes of the region, the Great Lakes' parts joined
const LAKES_SRC = JSON.parse(readFileSync("scripts/sugar-lakes.geojson", "utf8"));
const lakeLL = [];
for (const f of LAKES_SRC.features) {
  for (const rings of polysOf(f.geometry)) {
    const b = ringBox(rings[0]);
    if (b.x1 < -100 || b.x0 > -5 || b.y1 < 36 || b.y0 > 75) continue;
    lakeLL.push(rings.map((r) => r.map(P)));
  }
}
const LAKES_U = polygonClipping.union(...lakeLL.map((p) => [p]));
const LAKES = LAKES_U.map((poly) => poly.map((ring) => ring.flat()));
console.log(`lakes: ${lakeLL.length} source polygons -> ${LAKES.length} joined, ${nVerts(LAKES)} vertices`);

// GRATICULE (10 degrees: the world runs from k 0.4 to k 17; 5 degree lines crowd E's wide)
const graticuleSink = () => {
  let out = "";
  return {
    moveTo(x, y) {
      out += `M${r2(x)},${r2(y)}`;
    },
    lineTo(x, y) {
      out += `L${r2(x)},${r2(y)}`;
    },
    closePath() {
      out += "Z";
    },
    result: () => out,
  };
};
const GRATICULE_D = (() => {
  const sink = graticuleSink();
  geoPath(projection, sink)(
    geoGraticule()
      .extent([
        [-150, 20],
        [40, 85.001],
      ])
      .step([10, 10])
      .precision(0.5)(),
  );
  return sink.result();
})();

// ---------------------------------------------------------------------------
// COAST GEOMETRY for the checks and masks: segments on a bucket grid
// ---------------------------------------------------------------------------
const coastSegs = [];
const STAGE = { x0: -1400, x1: 2500, y0: -900, y1: 2400 };
for (const poly of LAND)
  for (const ring of poly) {
    for (let i = 2; i < ring.length; i += 2) {
      const [ax, ay, bx, by] = [ring[i - 2], ring[i - 1], ring[i], ring[i + 1]];
      coastSegs.push([ax, ay, bx, by]);
    }
    // close
    const n = ring.length;
    coastSegs.push([ring[n - 2], ring[n - 1], ring[0], ring[1]]);
  }
const BUCKET = 6;
const segGrid = new Map();
const rowGrid = new Map();
coastSegs.forEach(([ax, ay, bx, by], i) => {
  const i0 = Math.floor(Math.min(ax, bx) / BUCKET);
  const i1 = Math.floor(Math.max(ax, bx) / BUCKET);
  const j0 = Math.floor(Math.min(ay, by) / BUCKET);
  const j1 = Math.floor(Math.max(ay, by) / BUCKET);
  // the distance grid only round the stage (the parity rows take every segment)
  const inStage = Math.max(ax, bx) >= STAGE.x0 && Math.min(ax, bx) <= STAGE.x1 && Math.max(ay, by) >= STAGE.y0 && Math.min(ay, by) <= STAGE.y1;
  if (inStage && i1 - i0 < 400 && j1 - j0 < 400)
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
// SITES
// ---------------------------------------------------------------------------
const SITE_LL = {
  brattahlid: [-45.52, 61.15], // the Eastern Settlement (Erik the Red's farm, Qassiarsuk)
  lanseAuxMeadows: [-55.533, 51.596],
  capeFarewell: [-43.92, 59.77],
  iceland: [-23.95, 64.83], // Snaefellsnes, the west coast Erik the Red sailed from
};
const SITES = Object.fromEntries(Object.entries(SITE_LL).map(([k, ll]) => [k, { x: r3(P(ll)[0]), y: r3(P(ll)[1]), lon: ll[0], lat: ll[1] }]));
for (const [k, s] of Object.entries(SITES)) console.log(`site ${k}: ${s.x}, ${s.y}  land ${isLand(s.x, s.y)}  coast ${(coastDist(s.x, s.y) / PX_PER_KM).toFixed(1)} km`);

// ---------------------------------------------------------------------------
// ROUTES: a uniform cubic B-spline through lon/lat control points (C2, no
// wiggle between points), clamped at its two ends
// ---------------------------------------------------------------------------
const bspline = (cp, per = 48) => {
  const c = [cp[0], cp[0], ...cp, cp[cp.length - 1], cp[cp.length - 1]];
  const out = [];
  for (let i = 0; i + 3 < c.length; i++) {
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const b0 = ((1 - t) * (1 - t) * (1 - t)) / 6;
      const b1 = (3 * t * t * t - 6 * t * t + 4) / 6;
      const b2 = (-3 * t * t * t + 3 * t * t + 3 * t + 1) / 6;
      const b3 = (t * t * t) / 6;
      out.push([b0 * c[i][0] + b1 * c[i + 1][0] + b2 * c[i + 2][0] + b3 * c[i + 3][0], b0 * c[i][1] + b1 * c[i + 1][1] + b2 * c[i + 2][1] + b3 * c[i + 3][1]]);
    }
  }
  out.push(cp[cp.length - 1]);
  return out;
};
const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const resampleBy = (pts, step) => {
  const cum = cumOf(pts);
  const L = cum[cum.length - 1];
  const n = Math.max(2, Math.round(L / step));
  const out = [];
  let j = 0;
  for (let q = 0; q <= n; q++) {
    const s = (L * q) / n;
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const u = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
};
const routeOf = (lls, name, endFreeKm) => {
  const pts = resampleBy(bspline(lls.map(P)), 0.5);
  const cum = cumOf(pts);
  const len = cum[cum.length - 1];
  // the control points' arclengths (nearest sample)
  const wpS = lls.map((ll) => {
    const p = P(ll);
    let best = 0;
    let bd = Infinity;
    pts.forEach((q, i) => {
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (d < bd) [bd, best] = [d, i];
    });
    return cum[best];
  });
  // checks: on the sea between the two ends' free stretches; how far off the coast
  let minOff = Infinity;
  let maxOff = 0;
  let landKm = 0;
  pts.forEach((q, i) => {
    const s = cum[i];
    if (s < endFreeKm[0] * PX_PER_KM || s > len - endFreeKm[1] * PX_PER_KM) return;
    const d = coastDist(q[0], q[1], 400);
    if (isLand(q[0], q[1])) {
      landKm += 0.5 / PX_PER_KM;
      if (process.env.VIK_DRAFT) console.log(`  land at ${(s / PX_PER_KM).toFixed(0)} km: lon/lat ${projection.invert(q).map((v) => v.toFixed(2))}`);
    }
    else {
      minOff = Math.min(minOff, d);
      maxOff = Math.max(maxOff, d);
    }
  });
  console.log(
    `route ${name}: ${(len / PX_PER_KM).toFixed(0)} km (${len.toFixed(1)} world px), ${pts.length} pts; off the coast ${(minOff / PX_PER_KM).toFixed(0)} .. ${(maxOff / PX_PER_KM).toFixed(0)} km; over land ${landKm.toFixed(0)} km (outside the ends' free ${endFreeKm} km)`,
  );
  if (landKm > 0.5 && !process.env.VIK_DRAFT) throw new Error(`route ${name} crosses land`);
  return { pts, wpS, len };
};
// Eastern Settlement -> Davis Strait -> Baffin -> Labrador -> L'Anse aux Meadows
const VINLAND_LL = [
  SITE_LL.brattahlid,
  [-46.05, 60.82], // down Tunulliarfik (Eriksfjord)
  [-46.75, 60.52], // the fjord's mouth, off Qaqortoq
  [-48.25, 60.36], // clear of the Nunarsuit skerries
  [-50.3, 61.25], // north-west up Greenland's coast
  [-52.3, 62.6],
  [-55.0, 63.45], // west over Davis Strait
  [-58.6, 63.55],
  [-62.0, 63.05], // Helluland: off the mouth of Frobisher Bay (Baffin Island)
  [-63.55, 61.9], // past Resolution Island
  [-63.6, 60.55], // off Cape Chidley, the north tip of Labrador
  [-62.3, 59.0], // Markland: down the Labrador coast
  [-60.7, 57.4],
  [-59.3, 56.0],
  [-57.6, 54.9],
  [-55.9, 53.9],
  [-55.05, 52.9],
  [-55.05, 52.15], // the mouth of the Strait of Belle Isle
  [-55.4, 51.75],
  SITE_LL.lanseAuxMeadows,
];
const VINLAND = routeOf(VINLAND_LL, "Greenland -> L'Anse aux Meadows", [110, 6]);
// Eastern Settlement -> round Cape Farewell -> Iceland
const ICELAND_LL = [
  SITE_LL.brattahlid,
  [-46.05, 60.82],
  [-46.75, 60.52],
  [-46.3, 59.85],
  [-44.6, 59.25], // round Cape Farewell
  [-42.4, 59.45],
  [-39.8, 60.7],
  [-36.0, 62.3], // the Irminger Sea
  [-31.5, 63.5],
  [-27.5, 64.3],
  SITE_LL.iceland,
];
const ICELAND = routeOf(ICELAND_LL, "Greenland -> Iceland", [75, 6]);

// ---------------------------------------------------------------------------
// LAND MASKS (1 bit per cell): the stage at 1 cell per 2 world px; the north
// tip of Newfoundland + the Labrador shore of the Strait of Belle Isle at 8
// cells per world px
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
const LAM = SITES.lanseAuxMeadows;
const MASK_STAGE = maskOf(-900, -300, 2800, 2100, 0.5);
const MASK_FINE = maskOf(Math.floor(LAM.x - 70), Math.floor(LAM.y - 60), 130, 150, 8);
console.log(`land masks: stage ${MASK_STAGE.w}x${MASK_STAGE.h}, fine ${MASK_FINE.w}x${MASK_FINE.h} at (${MASK_FINE.x0}, ${MASK_FINE.y0})`);

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
const roundPolys = (polys) => polys.map((poly) => poly.map((ring) => ring.map((v) => Math.round(v * 50) / 50)));
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-vik-atlantic-map.mjs — do not edit by hand.
// The STATIC layers of the North Atlantic world, read only by
// scripts/bake-vik-atlantic-rasters.mjs. Natural Earth 10m land (public domain;
// no borders) and natural lakes on a north-up Lambert conformal conic, parallels
// 50/64, centre meridian 52 W, scale ${SCALE.toFixed(3)}. World px == screen px at k 1.
// Clipped to ${JSON.stringify(CLIP)}.

/** Land: polygons -> rings -> flat [x, y, ...] (world px). */
export const LAND_POLYS: number[][][] = ${JSON.stringify(roundPolys(LAND))};
/** Natural lakes (the Great Lakes joined), same shape. */
export const LAKE_POLYS: number[][][] = ${JSON.stringify(roundPolys(LAKES))};
/** 10 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
const rp = (pts) => pts.map(([x, y]) => [r3(x), r3(y)]);
const routeOut = (R) => ({ pts: rp(R.pts), wpS: R.wpS.map(r3), len: r3(R.len) });
writeFileSync(
  OUT,
  `// Generated by scripts/build-vik-atlantic-map.mjs — do not edit by hand.
// The light OVERLAYS of the North Atlantic world (see vikAtlanticShared.tsx).
// Lambert conformal conic, parallels 50/64, centre meridian 52 W, scale
// ${SCALE.toFixed(3)}; world px == screen px at k 1 (lon 72 W .. 32 W at lat 56 N
// spans x 0 .. 1080; (52 W, 56 N) at (540, 835)). ${PX_PER_KM.toFixed(4)} world px per km.
// Sources: Natural Earth 10m land (world-atlas); the sites and the saga route
// as listed in the build's header.

export type P2 = [number, number];
export type Site = { x: number; y: number; lon: number; lat: number };
export type RouteData = { pts: P2[]; wpS: number[]; len: number };

/** d3 geoConicConformal parameters (center [0, 0]); vikAtlanticShared.project() reproduces it. */
export const PROJ = { parallels: ${JSON.stringify(PARALLELS)} as [number, number], rotate: ${JSON.stringify(ROTATE)} as [number, number], scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export const PX_PER_KM = ${PX_PER_KM.toFixed(5)};
/** the rect the static layers are baked over (world px) */
export const WORLD_CLIP = ${JSON.stringify(CLIP)};

/** The sites (world px + lon/lat). */
export const SITES: Record<"brattahlid" | "lanseAuxMeadows" | "capeFarewell" | "iceland", Site> = ${JSON.stringify(SITES)};

/** THE NORSE ROUTE: Eastern Settlement -> Davis Strait -> Baffin -> the Labrador coast -> L'Anse aux Meadows
 *  (one smooth sea line, samples 0.5 world px apart; wpS = arclength at each control point). */
export const ROUTE_VINLAND_DATA: RouteData = ${JSON.stringify(routeOut(VINLAND))};
/** Its continuation the other way: Eastern Settlement -> round Cape Farewell -> west Iceland. */
export const ROUTE_ICELAND_DATA: RouteData = ${JSON.stringify(routeOut(ICELAND))};

/** Land bitmasks (1 bit per cell, s cells per world px): the stage, and the north tip of Newfoundland. */
export const LAND_MASK_STAGE = ${JSON.stringify({ x0: MASK_STAGE.x0, y0: MASK_STAGE.y0, s: MASK_STAGE.s, w: MASK_STAGE.w, h: MASK_STAGE.h, b64: MASK_STAGE.b64 })};
export const LAND_MASK_FINE = ${JSON.stringify({ x0: MASK_FINE.x0, y0: MASK_FINE.y0, s: MASK_FINE.s, w: MASK_FINE.w, h: MASK_FINE.h, b64: MASK_FINE.b64 })};
`,
);
console.log(`Wrote ${OUT_STATIC} and ${OUT}`);
