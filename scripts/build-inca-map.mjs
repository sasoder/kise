// Bakes the geometry of THE PERU WORLD, the shared map of the clip
// "Sheppard_Atahualpa_ambush" (Dwarkesh with Si Sheppard on Pizarro and
// Atahualpa, Cajamarca 1532; Dwarkesh map style). Every cut of the clip draws
// on this one world: StrangersInHisRealm (cut 1, the realm map), and
// VastExpanseOfHisArmy (cut 2) + LetsOffTheAmbush (cut 3) on the Cajamarca
// local plan.
//
//   bun scripts/build-inca-map.mjs && bun scripts/bake-inca-rasters.mjs
//
// Reads scripts/inca-geo.json (the director's realm, lakes and sites + the
// FACTS.md route, sites and plaza added by builder A) and Natural Earth 10m
// land from the installed world-atlas. Writes
//   generated/components/incaStatic.ts    the heavy STATIC layers (land, Lago
//                                          Titicaca + Lago Poopo, graticule),
//                                          read only by bake-inca-rasters.mjs
//   generated/components/incaMapData.ts   the light OVERLAYS drawn as vectors:
//                                          projection, sites, the route, the
//                                          realm (fill, land border, its loop
//                                          parameter), a land mask round Tumbes,
//                                          the Cajamarca local plan (plaza, camp,
//                                          the road to the camp)
//
// THE PROJECTION is north-up Lambert conformal conic, standard parallels 5 S and
// 30 S, centre meridian 75 W (d3 geoConicConformal().parallels([-5, -30])
// .rotate([75, 0])). North is up on 75 W; the meridians lean <= 3.3 deg at the
// realm's corners. Scale: at k 1 (world px == screen px, camera
// { k: 1, cx: 540, cy: 960 }) the whole realm (lat +2.32 ... -35.74) spans
// y 205 ... 1465, its box centred on (540, 835). ~0.30 world px per km.
//
// NOTHING PERIOD-WRONG: no borders, no rivers, no labels in the static map;
// Lago Titicaca and Lago Poopo (both existed in 1532) are baked as water.
//
// CHECKS (the script throws if one fails): the route stays on land; every
// waypoint is on land; the realm border has no run on the coast; the plaza's
// halls, doorways and gates lie on the enclosure; the local frame round-trips.

import { readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT_STATIC = "generated/components/incaStatic.ts";
const OUT = "generated/components/incaMapData.ts";
const GEO = JSON.parse(readFileSync("scripts/inca-geo.json", "utf8"));

// ---------------------------------------------------------------------------
// THE PROJECTION
// ---------------------------------------------------------------------------
const PARALLELS = [-5, -30];
const ROTATE = [75, 0];
const REALM_LL = GEO.realm_1532.outer;
const REALM_Y0 = 205;
const REALM_Y1 = 1465;
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(1).translate([0, 0]);
const bboxOf = (pts) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1 };
};
{
  const b = bboxOf(REALM_LL.map((ll) => projection(ll)));
  projection.scale((REALM_Y1 - REALM_Y0) / (b.y1 - b.y0));
  const b2 = bboxOf(REALM_LL.map((ll) => projection(ll)));
  projection.translate([540 - (b2.x0 + b2.x1) / 2, (REALM_Y0 + REALM_Y1) / 2 - (b2.y0 + b2.y1) / 2]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const P = (ll) => projection(ll);
const REALM_BOX = bboxOf(REALM_LL.map(P));
// the world the static layers are baked over (every LOD level lies inside it)
const CLIP = [
  [-420, -520],
  [1520, 2440],
];
projection.clipExtent(CLIP);
const PX_PER_KM = (() => {
  const p = P([-80.45, -3.07]);
  const q = P([-80.45, -4.07]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(
  `scale ${SCALE.toFixed(3)}, translate ${TRANSLATE.map((v) => v.toFixed(3))}, ${PX_PER_KM.toFixed(4)} world px per km at Tumbes; realm box x ${REALM_BOX.x0.toFixed(1)}..${REALM_BOX.x1.toFixed(1)} y ${REALM_BOX.y0.toFixed(1)}..${REALM_BOX.y1.toFixed(1)}`,
);
{
  // north is up on the centre meridian; how far the meridians lean at the realm's corners
  const lean = (lon, lat) => {
    const a = P([lon, lat - 0.5]);
    const b = P([lon, lat + 0.5]);
    return (Math.atan2(b[0] - a[0], a[1] - b[1]) * 180) / Math.PI;
  };
  console.log(
    `meridian lean (deg, + = north to the east): 75 W ${lean(-75, -15).toFixed(3)}, Tumbes ${lean(-80.45, -3.6).toFixed(2)}, Pasto ${lean(-77.3, 1.2).toFixed(2)}, Tucuman ${lean(-65.2, -26.8).toFixed(2)}, Maule ${lean(-72.4, -35.3).toFixed(2)}`,
  );
  if (Math.abs(lean(-75, -15)) > 1e-6) throw new Error("north is not up on the centre meridian");
}

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;

// -- a rounding path sink (Railways / Cortes) -----------------------------------
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
const bake = (geo) => {
  const sink = roundingContext();
  geoPath(projection, sink)(geo);
  return sink.result();
};
const toD = (pts, close = false) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}`;

// ---------------------------------------------------------------------------
// LAND (Natural Earth 10m), THE LAKES (Titicaca, Poopo), GRATICULE
// ---------------------------------------------------------------------------
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const VIEW = { lon: [-112, -30], lat: [-62, 32] };
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
// a ring whose longitudes span more than 180 deg (Afro-Eurasia: Chukotka crosses
// the antimeridian) is never in this view, and its naive box would overlap any
// box: projected on this cone it adds stray crossings to the inside test
const ringInView = (ring) => {
  const b = ringBox(ring);
  return b.x1 - b.x0 < 180 && b.x1 >= VIEW.lon[0] && b.x0 <= VIEW.lon[1] && b.y1 >= VIEW.lat[0] && b.y0 <= VIEW.lat[1];
};
const sane = (rings) => geoArea({ type: "Polygon", coordinates: [rings[0]] }) < 2 * Math.PI;
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const landPolys = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) if (ringInView(rings[0]) && sane(rings)) landPolys.push(rings);
const LAND_D = bake({ type: "MultiPolygon", coordinates: landPolys });
// the engraved water-lines run round land of >= WL_MIN_KM2 only: an islet's four
// rings read as a bullseye in the open sea (Malpelo, San Felix, Juan Fernandez);
// it keeps its cream coast
const WL_MIN_KM2 = 100;
const EARTH_KM = 6371.0088;
const wlPolys = landPolys.filter((rings) => geoArea({ type: "Polygon", coordinates: [rings[0]] }) * EARTH_KM * EARTH_KM >= WL_MIN_KM2);
const LAND_WL_D = bake({ type: "MultiPolygon", coordinates: wlPolys });
console.log(`land: ${landPolys.length} polygons, ${wlPolys.length} of them >= ${WL_MIN_KM2} km^2 carry water-lines`);

/** a lon/lat ring as a d3 polygon wound so that it is the small side */
const smallPoly = (ring) => {
  const g = { type: "Polygon", coordinates: [ring.map((p) => [...p])] };
  if (geoArea(g) > 2 * Math.PI) g.coordinates = [[...ring].reverse()];
  return g;
};
const LAKES = GEO.lakes.items.map((it) => ({ name: it.name, ring: it.rings[0] }));
const LAKES_D = LAKES.map((l) => bake(smallPoly(l.ring))).join("");

const GRATICULE_D = bake(
  geoGraticule()
    .extent([
      [-110, -60],
      [-30, 30.001],
    ])
    .step([5, 5])
    .precision(0.5)(),
);

// ---------------------------------------------------------------------------
// COAST GEOMETRY (world px) for the checks: the land rings round the realm,
// projected, as segments bucketed on a grid; even-odd inside test + distance.
// ---------------------------------------------------------------------------
const STAGE_LL = { lon: [-84, -60], lat: [-38, 4] };
const coastSegs = [];
for (const rings of landPolys)
  for (const ring of rings) {
    const b = ringBox(ring);
    if (b.x1 - b.x0 >= 180 || b.x1 < STAGE_LL.lon[0] || b.x0 > STAGE_LL.lon[1] || b.y1 < STAGE_LL.lat[0] || b.y0 > STAGE_LL.lat[1]) continue;
    let prev = null;
    for (const ll of ring) {
      const q = P(ll);
      if (prev) coastSegs.push([prev[0], prev[1], q[0], q[1]]);
      prev = q;
    }
  }
const BUCKET = 4;
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
/** the nearest point on the coast (world px; null beyond `max`) */
const nearestCoast = (x, y, max = 10) => {
  let best = Infinity;
  let at = null;
  const R = Math.ceil(max / BUCKET);
  const i0 = Math.floor(x / BUCKET);
  const j0 = Math.floor(y / BUCKET);
  for (let a = i0 - R; a <= i0 + R; a++)
    for (let b = j0 - R; b <= j0 + R; b++) {
      const segs = segGrid.get(`${a},${b}`);
      if (!segs) continue;
      for (const i of segs) {
        const [ax, ay, bx, by] = coastSegs[i];
        const dx = bx - ax;
        const dy = by - ay;
        const l2 = dx * dx + dy * dy || 1e-12;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
        const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
        if (d < best) [best, at] = [d, [ax + t * dx, ay + t * dy]];
      }
    }
  return best <= max ? at : null;
};
/** distance to the nearest coast segment, world px (searched out to `max`) */
const coastDist = (x, y, max = 40) => {
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
// THE REALM, 1525-32 (Tawantinsuyu; the director's georeferenced union of the
// expansion phases, already clipped to Natural Earth land). The fill has the
// lakes removed (the wash never tints water). The BORDER is the ring's own
// edge where it runs over land (the coast stretches dropped: the coast is
// baked). Every border vertex also carries its arclength round the whole ring
// (the LOOP, coast included), so a cut can run a wave round the realm from a
// point on its coast (see incaShared RealmBorder).
// ---------------------------------------------------------------------------
// THE RING'S COAST IS NOT THE 10m COAST: the director's ring (1256 vertices)
// runs 1-7 km inside the Natural Earth 10m coast along its whole coastal
// stretch (simplified after its land clip); at k 16 that is a 34 px gap
// between the wash and the coast. So the FILL is rebuilt to meet the coast
// exactly: every coastal segment of the ring (a vertex within COASTAL km of
// the coast at both ends) is widened 3 deg west into a quad over the Pacific
// (west of this coast there is only sea and islets between the realm's two
// coast ends), the quads are unioned with the ring, the union is intersected
// with the 10m land, and only the mainland polygon is kept (Puna and the
// islets dropped, as the director dropped the islets). The land border is the
// ring's own (unchanged).
const RING = REALM_LL.map(P);
const COASTAL = 10; // km: a ring vertex nearer the 10m coast than this is coast, farther is land border
const coastalV = RING.map((q) => coastDist(q[0], q[1], 12) / PX_PER_KM < COASTAL);
const LAND_NEAR = (() => {
  const box = [
    [
      [-84, -40],
      [-60, -40],
      [-60, 5],
      [-84, 5],
      [-84, -40],
    ],
  ];
  const near = landPolys.filter((rings) => {
    const b = ringBox(rings[0]);
    return b.x1 >= -84 && b.x0 <= -60 && b.y1 >= -40 && b.y0 <= 5;
  });
  return polygonClipping.intersection(box, near);
})();
const REALM_GEO = (() => {
  const quads = [];
  for (let i = 0; i + 1 < REALM_LL.length; i++) {
    if (!coastalV[i] || !coastalV[i + 1]) continue;
    const [a, b] = [REALM_LL[i], REALM_LL[i + 1]];
    quads.push([[a, b, [b[0] - 3, b[1]], [a[0] - 3, a[1]], a]]);
  }
  const widened = polygonClipping.union([[REALM_LL]], ...quads);
  const onLand = polygonClipping.intersection(widened, LAND_NEAR);
  // keep the mainland (the largest polygon)
  const area = (ring) => {
    let a = 0;
    for (let i = 0; i + 1 < ring.length; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    return Math.abs(a / 2);
  };
  const main = onLand.reduce((m, p) => (area(p[0]) > area(m[0]) ? p : m));
  console.log(
    `realm fill: ${quads.length} coastal quads; ${onLand.length} pieces on land, kept the mainland (${area(main[0]).toFixed(2)} sq deg), dropped ${onLand.length - 1} (${onLand
      .filter((p) => p !== main)
      .map((p) => area(p[0]).toFixed(3))
      .join(", ")} sq deg)`,
  );
  return polygonClipping.difference([main], ...LAKES.map((l) => [[l.ring]]));
})();
const REALM_POLYS = REALM_GEO.map((poly) => poly.map((ring) => ring.map((ll) => P(ll).map(r2))));
const REALM_D = REALM_POLYS.map((poly) => poly.map((ring) => toD(ring, true)).join("")).join("");
{
  // the fill's outer ring now runs on the exact coast: its coastal vertices are 10m coast vertices
  const outer = REALM_POLYS[0][0];
  const near = outer.filter(([x, y]) => coastDist(x, y, 6) < 0.05).length;
  console.log(`realm fill outer ring: ${outer.length} vertices, ${near} on the 10m coast (< 0.05 world px)`);
}
const LOOP_S = [0];
for (let i = 1; i < RING.length; i++) LOOP_S.push(LOOP_S[i - 1] + Math.hypot(RING[i][0] - RING[i - 1][0], RING[i][1] - RING[i - 1][1]));
const LOOP_LEN = LOOP_S[LOOP_S.length - 1];
const BORDER_RUNS = (() => {
  // runs of consecutive land-border vertices (by ring index; the ring is closed,
  // its last vertex repeating the first, so a run may wrap)
  const N = RING.length - 1; // distinct vertices
  const isB = (i) => {
    const q = RING[((i % N) + N) % N];
    return !coastalV[((i % N) + N) % N] && isLand(q[0], q[1]);
  };
  // start the scan on a coastal vertex so no run is split by the wrap
  let i0 = 0;
  while (isB(i0) && i0 < N) i0++;
  const runsIdx = [];
  let cur = null;
  for (let j = 1; j <= N; j++) {
    const i = i0 + j;
    if (isB(i)) {
      if (!cur) cur = [i, i];
      else cur[1] = i;
    } else if (cur) {
      runsIdx.push(cur);
      cur = null;
    }
  }
  if (cur) runsIdx.push(cur);
  const sOf = (i) => LOOP_S[((i % N) + N) % N] + Math.floor(i / N) * LOOP_LEN;
  const vOf = (i) => RING[((i % N) + N) % N];
  // each run runs on along its two adjacent ring segments to the coastal vertex at
  // either end, then to that vertex's nearest 10m coast point: the border meets the coast
  return runsIdx
    .filter(([a, b]) => b > a || isB(a))
    .map(([a, b]) => {
      const pts = [];
      const s = [];
      const pre = vOf(a - 1);
      const post = vOf(b + 1);
      const cPre = nearestCoast(pre[0], pre[1], 1.6 * COASTAL * PX_PER_KM);
      const cPost = nearestCoast(post[0], post[1], 1.6 * COASTAL * PX_PER_KM);
      if (cPre) {
        pts.push(cPre);
        s.push(sOf(a - 1) - Math.hypot(cPre[0] - pre[0], cPre[1] - pre[1]));
      }
      pts.push(pre);
      s.push(sOf(a - 1));
      for (let i = a; i <= b; i++) {
        pts.push(vOf(i));
        s.push(sOf(i));
      }
      pts.push(post);
      s.push(sOf(b + 1));
      if (cPost) {
        pts.push(cPost);
        s.push(sOf(b + 1) + Math.hypot(cPost[0] - post[0], cPost[1] - post[1]));
      }
      // loop arclengths in [0, LOOP_LEN) at the run's start (a run that wraps keeps increasing)
      const shift = Math.floor(s[0] / LOOP_LEN) * LOOP_LEN;
      return { pts, s: s.map((v) => v - shift), coastEnds: [!!cPre, !!cPost] };
    });
})();
const BORDER_LEN = BORDER_RUNS.reduce((s, r) => s + (r.s[r.s.length - 1] - r.s[0]), 0);
console.log(
  `realm: ${REALM_POLYS.length} polygons (${REALM_POLYS.reduce((s, p) => s + p.length, 0)} rings), loop ${LOOP_LEN.toFixed(1)} world px (${(LOOP_LEN / PX_PER_KM).toFixed(0)} km); land border ${BORDER_RUNS.length} runs, ${BORDER_LEN.toFixed(1)} world px (${BORDER_RUNS.map((r) => `${r.pts.length} pts s ${r.s[0].toFixed(0)}..${r.s[r.s.length - 1].toFixed(0)}`).join("; ")})`,
);
const REALM_BORDER_D = BORDER_RUNS.map((r) => toD(r.pts)).join("");

// ---------------------------------------------------------------------------
// WRITE (map part)
// ---------------------------------------------------------------------------
export const BUILT = {
  P,
  projection,
  isLand,
  coastDist,
  PX_PER_KM,
  RING,
  LOOP_S,
  LOOP_LEN,
  BORDER_RUNS,
};
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-inca-map.mjs — do not edit by hand.
// The STATIC layers of the Peru world, read only by
// scripts/bake-inca-rasters.mjs. Natural Earth 10m land (public domain; no
// borders) + Lago Titicaca and Lago Poopo (Natural Earth 10m lakes) on a
// north-up Lambert conformal conic, parallels 5 S / 30 S, centre meridian 75 W,
// scale ${SCALE.toFixed(3)}. World px == screen px at the k 1 realm wide.
// Clipped to ${JSON.stringify(CLIP)}.

/** Land, one path (evenodd). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** The land the engraved water-lines run round (polygons >= ${WL_MIN_KM2} km^2). */
export const LAND_WL_D = ${JSON.stringify(LAND_WL_D)};
/** Lago Titicaca + Lago Poopo (water). */
export const LAKES_D = ${JSON.stringify(LAKES_D)};
/** 5 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
console.log(`Wrote ${OUT_STATIC} (land ${LAND_D.length}, lakes ${LAKES_D.length}, graticule ${GRATICULE_D.length})`);

// ---------------------------------------------------------------------------
// LAND MASK round Tumbes (1 bit per cell) for builders' checks: the Tumbes box
// (lon -81.6 ... -79.4, lat -2.9 ... -5.6) at MASK_S cells per world px
// ---------------------------------------------------------------------------
const MASK_S = 6;
const maskOf = (x0, y0, w, h, s) => {
  const W = Math.round(w * s);
  const H = Math.round(h * s);
  const bits = new Uint8Array(Math.ceil((W * H) / 8));
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      if (isLand(x0 + (i + 0.5) / s, y0 + (j + 0.5) / s)) {
        const q = j * W + i;
        bits[q >> 3] |= 1 << (q & 7);
      }
    }
  return { x0, y0, s, w: W, h: H, b64: Buffer.from(bits).toString("base64") };
};
const MASK_TUMBES = (() => {
  const a = P([-81.6, -2.9]);
  const b = P([-79.4, -5.6]);
  const c = P([-81.6, -5.6]);
  const d = P([-79.4, -2.9]);
  const x0 = Math.floor(Math.min(a[0], c[0]));
  const x1 = Math.ceil(Math.max(b[0], d[0]));
  const y0 = Math.floor(Math.min(a[1], d[1]));
  const y1 = Math.ceil(Math.max(b[1], c[1]));
  return maskOf(x0, y0, x1 - x0, y1 - y0, MASK_S);
})();
console.log(`land mask round Tumbes: ${MASK_TUMBES.w}x${MASK_TUMBES.h} cells at ${MASK_S} / world px from (${MASK_TUMBES.x0}, ${MASK_TUMBES.y0})`);

// ---------------------------------------------------------------------------
// SITES (world px + lon/lat)
// ---------------------------------------------------------------------------
// FACTS.md section 5 (the route's stops: OSM / esWP coordinates of the modern
// places) and section 2 (OSM: the plaza centroid, the hot-spring complex).
// THE LANDING (computed, not a source coordinate): the point of the 10m coast
// nearest Inca Tumbes (the Cabeza de Vaca site), where the men come ashore.
const SITE_SRC = Object.fromEntries(Object.entries(GEO.sites).filter(([k]) => !k.startsWith("_")));
const SITES = Object.fromEntries(
  Object.entries(SITE_SRC).map(([k, s]) => {
    const [x, y] = P([s.lon, s.lat]);
    return [k, { x: r3(x), y: r3(y), lon: s.lon, lat: s.lat }];
  }),
);
for (const [k, s] of Object.entries(SITES)) {
  if (!isLand(s.x, s.y)) throw new Error(`site ${k} is not on 10m land (${coastDist(s.x, s.y, 10).toFixed(2)} world px off)`);
}
const LANDING = (() => {
  const t = SITES.tumbes;
  const c = nearestCoast(t.x, t.y, 12);
  const ll = projection.invert(c);
  // the sea's side: the unit vector from the landing away from the land (probe a ring round it)
  let sx = 0;
  let sy = 0;
  for (let a = 0; a < 64; a++) {
    const th = (a / 64) * 2 * Math.PI;
    const q = [c[0] + 1.2 * Math.cos(th), c[1] + 1.2 * Math.sin(th)];
    if (!isLand(q[0], q[1])) {
      sx += Math.cos(th);
      sy += Math.sin(th);
    }
  }
  const l = Math.hypot(sx, sy) || 1;
  console.log(
    `landing: the 10m coast nearest Inca Tumbes is ${(Math.hypot(c[0] - t.x, c[1] - t.y) / PX_PER_KM).toFixed(1)} km away at (${c.map((v) => v.toFixed(2))}) = ${ll.map((v) => v.toFixed(4))}; seaward (${(sx / l).toFixed(3)}, ${(sy / l).toFixed(3)})`,
  );
  return { x: r3(c[0]), y: r3(c[1]), lon: +ll[0].toFixed(5), lat: +ll[1].toFixed(5), seaward: [r3(sx / l), r3(sy / l)] };
})();

// ---------------------------------------------------------------------------
// WRITE the overlays
// ---------------------------------------------------------------------------
const rp = (pts) => pts.map(([x, y]) => [r3(x), r3(y)]);
const mapDataOut = (extra = "") =>
  writeFileSync(
    OUT,
    `// Generated by scripts/build-inca-map.mjs — do not edit by hand.
// The light OVERLAYS of the Peru world (see incaShared.tsx for the API).
// Lambert conformal conic, parallels 5 S / 30 S, centre meridian 75 W, scale
// ${SCALE.toFixed(3)}; world px == screen px at the k 1 realm wide (the realm, lat
// +2.32 ... -35.74, spans y ${REALM_Y0} ... ${REALM_Y1}, its box centred on (540, 835)).
// ${PX_PER_KM.toFixed(4)} world px per km at Tumbes.
// Sources: scripts/inca-geo.json (the director's realm, lakes and sites; the
// FACTS.md route, sites and plaza), Natural Earth 10m land (world-atlas).

export type P2 = [number, number];
export type Site = { x: number; y: number; lon: number; lat: number };
export type RouteData = { pts: P2[]; wpS: number[]; len: number };
export type BorderRun = { pts: P2[]; s: number[] };

/** d3 geoConicConformal parameters (center [0, 0]); incaShared.project() reproduces it. */
export const PROJ = { parallels: ${JSON.stringify(PARALLELS)} as [number, number], rotate: ${JSON.stringify(ROTATE)} as [number, number], scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export const PX_PER_KM = ${PX_PER_KM.toFixed(5)};
/** the rect the static layers are baked over (world px) */
export const WORLD_CLIP = ${JSON.stringify(CLIP)};
/** the realm's box at k 1 (world px) */
export const REALM_BOX = ${JSON.stringify({ x0: r3(REALM_BOX.x0), x1: r3(REALM_BOX.x1), y0: r3(REALM_BOX.y0), y1: r3(REALM_BOX.y1) })};

/** THE REALM, 1525-32: the fill (evenodd; meets the 10m coast exactly; the
 *  mainland only; Titicaca and Poopo removed), its polygons (first ring outer,
 *  the rest holes), and its land border (no coast). */
export const REALM_D = ${JSON.stringify(REALM_D)};
export const REALM_POLYS: P2[][][] = ${JSON.stringify(REALM_POLYS)};
export const REALM_BORDER_D = ${JSON.stringify(REALM_BORDER_D)};
/** the realm's LOOP (the director's ring, coast included, world px) and its
 *  arclength; the land border's runs with each vertex's loop arclength s
 *  (s may run below 0 on a run that wraps the loop's start) */
export const REALM_LOOP: P2[] = ${JSON.stringify(rp(RING))};
export const REALM_LOOP_LEN = ${r3(LOOP_LEN)};
export const REALM_BORDER_RUNS: BorderRun[] = ${JSON.stringify(BORDER_RUNS.map((r) => ({ pts: rp(r.pts), s: r.s.map(r3) })))};
/** Lago Titicaca, Lago Poopo (outer rings, world px; baked as water) */
export const LAKE_RINGS: P2[][] = ${JSON.stringify(LAKES.map((l) => rp(l.ring.map(P))))};

/** Land bitmask round Tumbes (bit (j * w + i) set = land at cell centre x0 + (i + 0.5) / s, y0 + (j + 0.5) / s). */
export const LAND_MASK_TUMBES = ${JSON.stringify(MASK_TUMBES)};

/** The sites (world px + lon/lat). */
export const SITES = ${JSON.stringify(SITES)} as const;
${extra}`,
  );

export { SCALE, TRANSLATE, PARALLELS, ROTATE, CLIP, REALM_POLYS, REALM_D, REALM_BORDER_D, REALM_BOX, LAKES, SITES, mapDataOut, MASK_TUMBES, rp, r3, r2 };

// ---------------------------------------------------------------------------
// PIZARRO_1532: centripetal Catmull-Rom through the projected stops (FACTS.md
// section 5), from THE LANDING (the beach nearest Inca Tumbes) by Inca Tumbes,
// Poechos, San Miguel (Tangarara), the Piura valley fortress, Pabor, Serran,
// Motupe, the Motupe-Leche valleys (Illimo), Zana, and up the Qhapaq Nan by
// Nanchoc, Niepos and Llapa to Cajamarca
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
const STOPS = GEO.route_pizarro_1532.stops;
const ROUTE = (() => {
  const cm = catmull([[LANDING.x, LANDING.y], ...STOPS.map((k) => [SITES[k].x, SITES[k].y])], 0.2);
  const cum = cumOf(cm.pts);
  return { pts: cm.pts, wpS: cm.idx.map((i) => cum[i]), len: cum[cum.length - 1] };
})();
{
  // on land: every sample (the landing itself is on the coast line: skip the first 0.15 world px)
  const cum = cumOf(ROUTE.pts);
  let off = 0;
  let worst = Infinity;
  ROUTE.pts.forEach(([x, y], i) => {
    if (cum[i] < 0.15) return;
    if (!isLand(x, y)) off++;
    else worst = Math.min(worst, coastDist(x, y, 3));
  });
  console.log(
    `PIZARRO_1532: ${ROUTE.pts.length} pts, len ${ROUTE.len.toFixed(1)} world px (${(ROUTE.len / PX_PER_KM).toFixed(0)} km); stops at s ${ROUTE.wpS.map((s) => s.toFixed(1)).join(", ")}; ${off} samples off land; nearest the coast ${(worst / PX_PER_KM).toFixed(2)} km`,
  );
  if (off > 0) throw new Error("PIZARRO_1532 leaves the land");
}

// ---------------------------------------------------------------------------
// THE CAJAMARCA LOCAL PLAN: a local tangent plane on the plaza centroid (OSM,
// FACTS.md section 2), 1 unit = 1 metre, x east, y SOUTH (screen-down), WGS84
// radii at the origin (over the 6 km to the camp the error is < 1 m).
// ---------------------------------------------------------------------------
const RAD = Math.PI / 180;
const ORIGIN = SITE_SRC[GEO.local_plan.origin];
const LOCAL = (() => {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const e2 = f * (2 - f);
  const s = Math.sin(ORIGIN.lat * RAD);
  const W = Math.sqrt(1 - e2 * s * s);
  return { lon0: ORIGIN.lon, lat0: ORIGIN.lat, mPerDegLon: RAD * (a / W) * Math.cos(ORIGIN.lat * RAD), mPerDegLat: (RAD * (a * (1 - e2))) / (W * W * W) };
})();
const localOf = (lon, lat) => [(lon - LOCAL.lon0) * LOCAL.mPerDegLon, -(lat - LOCAL.lat0) * LOCAL.mPerDegLat];
const CAMP_SRC = SITE_SRC[GEO.local_plan.camp];
const CAMP = localOf(CAMP_SRC.lon, CAMP_SRC.lat);
const CAMP_DIST = Math.hypot(CAMP[0], CAMP[1]);
const CAMP_BEARING = (Math.atan2(CAMP[0], -CAMP[1]) * 180) / Math.PI;
console.log(`local plan: 1 deg lon = ${LOCAL.mPerDegLon.toFixed(1)} m, 1 deg lat = ${LOCAL.mPerDegLat.toFixed(1)} m; the camp (springs) at (${CAMP.map((v) => v.toFixed(1))}) m: ${(CAMP_DIST / 1000).toFixed(2)} km bearing ${CAMP_BEARING.toFixed(1)} deg`);
if (Math.abs(CAMP_DIST - 5900) > 150 || Math.abs(CAMP_BEARING - 96) > 2) throw new Error("the camp is not 5.9 km at ~96 deg (FACTS.md section 2)");

// ---------------------------------------------------------------------------
// THE PLAZA OF CAJAMARCA, 16 NOV 1532: a SCHEMATIC engraved plan from the
// texts (FACTS.md section 3; no eyewitness measured it, no plan of 1532 is
// published). What the texts give, and what is a neutral choice:
//   - a walled square "almost triangular in form" [Pre], the three halls
//     (galpones) "in form of a triangle" [HPz]: an EQUILATERAL TRIANGLE (the
//     exact shape is unknown: the neutral reading of "a triangle");
//   - three halls, "each more than 200 paces long, with 20 doors" [Mena]: one
//     hall along each side, 150 m long (200 paces at a 0.75 m step, the low
//     end of FACTS' 150-280 m), 20 doorways each on the square ("wide",
//     "large" [Pre; PPz]; 3 m: a choice); hall depth 12 m (not in the sources:
//     a choice); each against the enclosure wall, its doors on the square;
//   - side 200 m (the halls centred, 25 m clear of each corner; the plaza is
//     "larger than any in Spain" [Xer]: 1.73 ha inside the wall);
//   - the enclosure wall with TWO DOORWAYS onto the town's streets [Xer]: at
//     the two corners away from the open country (10 m openings: a choice);
//   - the stone "fortress" (an ushnu platform [Cov]) "in front of the plaza,
//     towards the open country ... connected with it by a staircase leading
//     from the square", "all within the outer wall" [Xer]; "at the end of the
//     plaza, looking towards the country" [Pre]: a 12 m square platform in the
//     corner that points at the open country, its stair (5 m wide) on the
//     square; and "towards the open country ... another small door" [Xer]: a
//     3 m gap in the wall beside it;
//   - ORIENTATION unknown: that corner points along the bearing to the camp
//     (the open country and the camp lay east of the plaza [Xer; Calc]).
// Not drawn: Trujillo's ten street mouths (they contradict Xerez's two
// doorways; the town's streets are not on the plan), the hill fort above the
// town, the house of the serpent.
// ---------------------------------------------------------------------------
const PLAZA_SPEC = { side: 200, hallLen: 150, hallDepth: 12, doors: 20, doorW: 3, gateOpen: 10, fortSize: 12, fortNear: 12, stairW: 5, stairLen: 4, stairTreads: 5, smallDoorW: 3, smallDoorAt: 9 };
const PLAZA = (() => {
  const S = PLAZA_SPEC.side;
  const R = S / Math.sqrt(3); // circumradius
  const b = CAMP_BEARING * RAD;
  const u = [Math.sin(b), -Math.cos(b)]; // toward the camp (x east, y south)
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const A = [R * u[0], R * u[1]]; // the corner toward the open country (the fortress)
  const B0 = rot(A, (2 * Math.PI) / 3);
  const C0 = rot(A, (-2 * Math.PI) / 3);
  // name the two town-side corners by compass (y south: a smaller y is further north)
  const [NW, SW] = B0[1] < C0[1] ? [B0, C0] : [C0, B0];
  const add = (p, q, s = 1) => [p[0] + q[0] * s, p[1] + q[1] * s];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const unit = (v) => {
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };
  const r = (p) => [r3(p[0]), r3(p[1])];
  const compass = (v) => {
    const deg = ((Math.atan2(v[0], -v[1]) * 180) / Math.PI + 360) % 360;
    return ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"][Math.round(deg / 45) % 8];
  };
  // the three sides, each with its hall; inward = toward the square
  const sides = [
    [A, NW],
    [NW, SW],
    [SW, A],
  ].map(([p, q]) => {
    const t = unit(sub(q, p));
    const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const inward = unit(sub([0, 0], mid));
    return { p, q, t, mid, inward, outward: [-inward[0], -inward[1]] };
  });
  const H = PLAZA_SPEC.hallLen / 2;
  const D = PLAZA_SPEC.hallDepth;
  const halls = sides.map((s) => {
    const back0 = add(s.mid, s.t, -H);
    const back1 = add(s.mid, s.t, H);
    const front0 = add(back0, s.inward, D);
    const front1 = add(back1, s.inward, D);
    const doorways = Array.from({ length: PLAZA_SPEC.doors }, (_, i) => {
      const along = ((i + 0.5) / PLAZA_SPEC.doors - 0.5) * PLAZA_SPEC.hallLen;
      return { p: r(add(add(s.mid, s.t, along), s.inward, D)), n: r(s.inward), w: PLAZA_SPEC.doorW };
    });
    return {
      name: compass(s.outward),
      rect: [back0, back1, front1, front0].map(r),
      back: [r(back0), r(back1)],
      front: [r(front0), r(front1)],
      centre: r(add(s.mid, s.inward, D / 2)),
      along: r(s.t),
      toSquare: r(s.inward),
      len: PLAZA_SPEC.hallLen,
      depth: D,
      doorways,
    };
  });
  // the gates: openings across the two town-side corners, gateOpen m wide (a
  // chord across a 60 deg corner is as wide as its distance from the corner)
  const g = PLAZA_SPEC.gateOpen;
  const gateAt = (V) => {
    const others = [A, NW, SW].filter((X) => X !== V);
    const a = add(V, unit(sub(others[0], V)), g);
    const c = add(V, unit(sub(others[1], V)), g);
    const p = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
    return { name: compass(V), a: r(a), b: r(c), p: r(p), n: r(unit(V)), w: g };
  };
  const gates = [gateAt(NW), gateAt(SW)];
  // the fortress (ushnu platform) in the corner toward the open country: a
  // square on the corner's bisector, fortNear .. fortNear + fortSize m from it
  const fs = PLAZA_SPEC.fortSize;
  const inA = unit(sub([0, 0], A)); // from the corner into the square
  const perpA = [-inA[1], inA[0]];
  const fc = add(A, inA, PLAZA_SPEC.fortNear + fs / 2);
  const fortRect = [
    add(add(fc, inA, -fs / 2), perpA, -fs / 2),
    add(add(fc, inA, -fs / 2), perpA, fs / 2),
    add(add(fc, inA, fs / 2), perpA, fs / 2),
    add(add(fc, inA, fs / 2), perpA, -fs / 2),
  ];
  // its stair, on the square side: treads across inA
  const st0 = add(fc, inA, fs / 2);
  const treads = Array.from({ length: PLAZA_SPEC.stairTreads }, (_, i) => {
    const d = (PLAZA_SPEC.stairLen * (i + 0.5)) / PLAZA_SPEC.stairTreads;
    const m = add(st0, inA, d);
    return [r(add(m, perpA, -PLAZA_SPEC.stairW / 2)), r(add(m, perpA, PLAZA_SPEC.stairW / 2))];
  });
  const stairRect = [
    add(st0, perpA, -PLAZA_SPEC.stairW / 2),
    add(st0, perpA, PLAZA_SPEC.stairW / 2),
    add(add(st0, inA, PLAZA_SPEC.stairLen), perpA, PLAZA_SPEC.stairW / 2),
    add(add(st0, inA, PLAZA_SPEC.stairLen), perpA, -PLAZA_SPEC.stairW / 2),
  ];
  const fortress = {
    rect: fortRect.map(r),
    centre: r(fc),
    toSquare: r(inA),
    size: fs,
    stair: { rect: stairRect.map(r), treads, foot: r(add(st0, inA, PLAZA_SPEC.stairLen)), top: r(st0), w: PLAZA_SPEC.stairW },
  };
  // the small door toward the open country, on the corner's north side
  const sideN = sides[0]; // A -> NW
  const sdC = add(A, sideN.t, PLAZA_SPEC.smallDoorAt);
  const smallDoor = {
    a: r(add(sdC, sideN.t, -PLAZA_SPEC.smallDoorW / 2)),
    b: r(add(sdC, sideN.t, PLAZA_SPEC.smallDoorW / 2)),
    p: r(sdC),
    n: r(sideN.outward),
    w: PLAZA_SPEC.smallDoorW,
  };
  // the wall: the triangle, with the openings (the two gates, the small door) left open
  const wallRuns = (() => {
    // walk the triangle A -> NW -> SW -> A as arclength; cut the openings
    const corners = [A, NW, SW, A];
    const pts = [];
    const cum = [0];
    for (let i = 0; i < 3; i++) {
      pts.push(corners[i]);
      cum.push(cum[i] + S);
    }
    const at = (s) => {
      const i = Math.min(2, Math.floor(s / S));
      const u2 = (s - i * S) / S;
      return [corners[i][0] + (corners[i + 1][0] - corners[i][0]) * u2, corners[i][1] + (corners[i + 1][1] - corners[i][1]) * u2];
    };
    // openings as arclength intervals: NW corner at s = S, SW corner at s = 2S
    const cuts = [
      [S - g, S + g],
      [2 * S - g, 2 * S + g],
      [PLAZA_SPEC.smallDoorAt - PLAZA_SPEC.smallDoorW / 2, PLAZA_SPEC.smallDoorAt + PLAZA_SPEC.smallDoorW / 2],
    ].sort((p, q) => p[0] - q[0]);
    const runs = [];
    let s0 = 0;
    for (const [c0, c1] of cuts) {
      runs.push([s0, c0]);
      s0 = c1;
    }
    runs.push([s0, 3 * S]);
    return runs
      .filter(([a2, b2]) => b2 - a2 > 1e-6)
      .map(([a2, b2]) => {
        const out = [at(a2)];
        for (const cs of [S, 2 * S]) if (cs > a2 && cs < b2) out.push(at(cs));
        out.push(at(b2 - 1e-9));
        return out.map(r);
      });
  })();
  // the open square: inside the wall, minus the halls and the fortress + stair (with a little clearance)
  // a rectangle [p0, p1, p2, p3] grown by m on every side (along its own two axes)
  const grow = (rect, m) => {
    const e1 = unit(sub(rect[1], rect[0]));
    const e2 = unit(sub(rect[3], rect[0]));
    return [
      add(add(rect[0], e1, -m), e2, -m),
      add(add(rect[1], e1, m), e2, -m),
      add(add(rect[2], e1, m), e2, m),
      add(add(rect[3], e1, -m), e2, m),
    ];
  };
  const ring = (pts) => [...pts, pts[0]];
  const inset = (V, m) => add(V, unit(sub([0, 0], V)), m * 2); // a vertex moved in by m from both sides (60 deg corner)
  const tri = ring([inset(A, 1), inset(NW, 1), inset(SW, 1)]);
  // ... and short of the openings: the corner beyond each gate's chord is the street
  const tip = (V, gt) => {
    const a2 = add(gt.a, unit(sub(gt.a, V)), 0.5);
    const b2 = add(gt.b, unit(sub(gt.b, V)), 0.5);
    return [ring([add(V, unit(V), 2), add(a2, unit(V), -0.8), add(b2, unit(V), -0.8)])];
  };
  const minus = [
    ...halls.map((h) => [ring(grow(h.rect, 0.6))]),
    [ring(grow(fortRect, 1))],
    [ring(grow(stairRect, 0.6))],
    tip(NW, gates[0]),
    tip(SW, gates[1]),
  ];
  const sq = polygonClipping.difference([tri], ...minus);
  const area = (rg) => {
    let a2 = 0;
    for (let i = 0; i + 1 < rg.length; i++) a2 += rg[i][0] * rg[i + 1][1] - rg[i + 1][0] * rg[i][1];
    return Math.abs(a2 / 2);
  };
  const main = sq.reduce((m, p) => (area(p[0]) > area(m[0]) ? p : m));
  const interior = main.map((rg) => rg.map(r));
  const interiorArea = area(main[0]) - main.slice(1).reduce((s2, h) => s2 + area(h), 0);
  return {
    spec: PLAZA_SPEC,
    corners: { fortress: r(A), northwest: r(NW), southwest: r(SW) },
    enclosure: [A, NW, SW].map(r),
    wallRuns,
    halls,
    gates,
    smallDoor,
    fortress,
    interior,
    interiorArea,
    pieces: sq.length,
  };
})();
{
  // checks: every doorway on its hall's front, every hall inside the triangle and clear of the others and the fortress
  const inTri = ([x, y]) => {
    // signed distances to the three sides (m); inside within 1 cm (the halls' backs lie ON the wall)
    const [a, b, c] = PLAZA.enclosure;
    const sd = (p, q) => ((q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0])) / Math.hypot(q[0] - p[0], q[1] - p[1]);
    const s = [sd(a, b), sd(b, c), sd(c, a)];
    return s.every((v) => v >= -0.01) || s.every((v) => v <= 0.01);
  };
  for (const h of PLAZA.halls) {
    for (const p of h.rect) if (!inTri(p)) throw new Error(`plaza: hall ${h.name} pokes out of the enclosure`);
    for (const d of h.doorways) {
      const [f0, f1] = h.front;
      const cr = (f1[0] - f0[0]) * (d.p[1] - f0[1]) - (f1[1] - f0[1]) * (d.p[0] - f0[0]);
      if (Math.abs(cr) / Math.hypot(f1[0] - f0[0], f1[1] - f0[1]) > 0.01) throw new Error(`plaza: a doorway of hall ${h.name} is off its front`);
    }
  }
  for (const p of PLAZA.fortress.rect) if (!inTri(p)) throw new Error("plaza: the fortress pokes out of the enclosure");
  const hallPolys = PLAZA.halls.map((h) => [[...h.rect, h.rect[0]]]);
  const fortPoly = [[...PLAZA.fortress.rect, PLAZA.fortress.rect[0]]];
  for (let i = 0; i < 3; i++) {
    if (polygonClipping.intersection(hallPolys[i], fortPoly).length) throw new Error(`plaza: hall ${PLAZA.halls[i].name} overlaps the fortress`);
    for (let j = i + 1; j < 3; j++) if (polygonClipping.intersection(hallPolys[i], hallPolys[j]).length) throw new Error("plaza: two halls overlap");
  }
  console.log(
    `plaza: side ${PLAZA_SPEC.side} m (${((Math.sqrt(3) / 4) * PLAZA_SPEC.side ** 2 / 1e4).toFixed(2)} ha inside the wall), the fortress corner toward ${CAMP_BEARING.toFixed(1)} deg; halls ${PLAZA.halls.map((h) => h.name).join(", ")} (${PLAZA_SPEC.hallLen} x ${PLAZA_SPEC.hallDepth} m, ${PLAZA_SPEC.doors} doors); gates ${PLAZA.gates.map((q) => q.name).join(", ")}; the open square ${PLAZA.interiorArea.toFixed(0)} m^2 (${PLAZA.pieces} piece(s), ${PLAZA.interior.length} ring(s))`,
  );
}

// ---------------------------------------------------------------------------
// ROAD_TO_CAMP (local metres): the causeway from the town to the camp. The
// sources give its ends and its general sense only ("unos 8 Km en sentido
// sureste" from Cajamarca to Banos del Inca [QN]; "a paved causeway of earth
// and stone ... from the town", broken at a swamp [Xer]); its course is not
// mapped. Drawn honestly as a gentle curve between the real ends: out of the
// plaza's open-country corner (just outside its small door), bowing ~450 m
// south of the straight line (the road ran "en sentido sureste"), into the
// hot springs. The real road was ~8 km; this line is ~5.9 km.
// ---------------------------------------------------------------------------
const ROAD_TO_CAMP = (() => {
  const A = PLAZA.corners.fortress;
  const u = [Math.sin(CAMP_BEARING * RAD), -Math.cos(CAMP_BEARING * RAD)];
  const P0 = [A[0] + u[0] * 8, A[1] + u[1] * 8];
  const P3 = CAMP;
  const ch = [P3[0] - P0[0], P3[1] - P0[1]];
  const L = Math.hypot(ch[0], ch[1]);
  // the unit normal on the south side of the chord (y south: the normal with a positive y)
  let nrm = [-ch[1] / L, ch[0] / L];
  if (nrm[1] < 0) nrm = [-nrm[0], -nrm[1]];
  const BOW = 600; // control offset: the curve's sagitta is 0.75 x this
  const P1 = [P0[0] + ch[0] / 3 + nrm[0] * BOW, P0[1] + ch[1] / 3 + nrm[1] * BOW];
  const P2 = [P0[0] + (2 * ch[0]) / 3 + nrm[0] * BOW, P0[1] + (2 * ch[1]) / 3 + nrm[1] * BOW];
  const bez = (t) => {
    const m = 1 - t;
    return [
      m * m * m * P0[0] + 3 * m * m * t * P1[0] + 3 * m * t * t * P2[0] + t * t * t * P3[0],
      m * m * m * P0[1] + 3 * m * m * t * P1[1] + 3 * m * t * t * P2[1] + t * t * t * P3[1],
    ];
  };
  const raw = Array.from({ length: 2001 }, (_, i) => bez(i / 2000));
  const cum = cumOf(raw);
  const len = cum[cum.length - 1];
  // resample every 4 m
  const n = Math.round(len / 4);
  const pts = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (len * i) / n;
    while (j < cum.length - 2 && cum[j + 1] < s) j++;
    const t = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    pts.push([raw[j][0] + (raw[j + 1][0] - raw[j][0]) * t, raw[j][1] + (raw[j + 1][1] - raw[j][1]) * t]);
  }
  const sag = Math.max(...pts.map((p) => Math.abs((p[0] - P0[0]) * nrm[0] + (p[1] - P0[1]) * nrm[1])));
  console.log(`ROAD_TO_CAMP: ${pts.length} pts, ${(len / 1000).toFixed(2)} km (chord ${(L / 1000).toFixed(2)} km), bows ${sag.toFixed(0)} m south`);
  return { pts, wpS: [0, len], len };
})();

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
const routeOut = (R, rd = r3) => ({ pts: R.pts.map(([x, y]) => [rd(x), rd(y)]), wpS: R.wpS.map(r3), len: r3(R.len) });
const r1 = (v) => Math.round(v * 10) / 10;
mapDataOut(`
/** THE LANDING: the point of the 10m coast nearest Inca Tumbes (computed; world
 *  px + lon/lat) and the unit vector from it out to sea. */
export const LANDING = ${JSON.stringify(LANDING)};

/** PIZARRO_1532 (world px): centripetal Catmull-Rom from THE LANDING through the
 *  stops of FACTS.md section 5 (wpS = the arclength at each: landing, then
 *  ${STOPS.join(", ")}). On land. */
export const PIZARRO_1532_STOPS = ${JSON.stringify(["landing", ...STOPS])} as const;
export const PIZARRO_1532_DATA: RouteData = ${JSON.stringify(routeOut(ROUTE))};

/** THE CAJAMARCA LOCAL PLAN: a tangent plane on the plaza centroid (OSM), 1 unit =
 *  1 metre, x east, y south. local = ((lon - lon0) * mPerDegLon, -(lat - lat0) * mPerDegLat). */
export const LOCAL = ${JSON.stringify(LOCAL)};
/** Atahualpa's camp: the Banos del Inca hot springs (OSM), local metres; ${(CAMP_DIST / 1000).toFixed(2)} km at ${CAMP_BEARING.toFixed(1)} deg */
export const CAMP_LOCAL: P2 = ${JSON.stringify(CAMP.map(r1))};
/** the causeway from the plaza to the camp (local metres; see incaShared) */
export const ROAD_TO_CAMP_DATA: RouteData = ${JSON.stringify(routeOut(ROAD_TO_CAMP, r1))};

/** THE PLAZA OF CAJAMARCA, 1532: a schematic from the texts (see incaShared and
 *  scripts/build-inca-map.mjs), local metres. */
export type Doorway = { p: P2; n: P2; w: number };
export type Hall = { name: string; rect: P2[]; back: [P2, P2]; front: [P2, P2]; centre: P2; along: P2; toSquare: P2; len: number; depth: number; doorways: Doorway[] };
export type Gate = { name: string; a: P2; b: P2; p: P2; n: P2; w: number };
export const PLAZA_DATA = ${JSON.stringify({
  spec: PLAZA.spec,
  corners: PLAZA.corners,
  enclosure: PLAZA.enclosure,
  wallRuns: PLAZA.wallRuns,
  halls: PLAZA.halls,
  gates: PLAZA.gates,
  smallDoor: PLAZA.smallDoor,
  fortress: PLAZA.fortress,
  interior: PLAZA.interior,
  interiorArea: Math.round(PLAZA.interiorArea),
})} as unknown as {
  spec: Record<string, number>;
  corners: { fortress: P2; northwest: P2; southwest: P2 };
  enclosure: P2[];
  wallRuns: P2[][];
  halls: Hall[];
  gates: Gate[];
  smallDoor: Gate & { name?: string };
  fortress: { rect: P2[]; centre: P2; toSquare: P2; size: number; stair: { rect: P2[]; treads: [P2, P2][]; foot: P2; top: P2; w: number } };
  interior: P2[][];
  interiorArea: number;
};
`);
console.log(`Wrote ${OUT}`);
