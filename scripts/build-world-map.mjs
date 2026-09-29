// Bakes the Natural Earth geometry for the Korea 1950 WORLD pair
// (ThirdPartyIntervention + CivilRegionalGlobal, one global clock) into flat
// SVG path strings and point tables.
//
//   bun scripts/build-world-map.mjs
//
// Writes
//   generated/components/worldStatic.ts    the heavy STATIC layers (land at two
//                                          resolutions, 1950 borders, graticules,
//                                          the sphere), read ONLY by the raster
//                                          bake (scripts/bake-world-rasters.mjs)
//   generated/components/worldMapData.ts   the light OVERLAYS drawn as vectors:
//                                          the lit polities, Korea + the North's
//                                          hatch region, the 4 Aug 1950 perimeter,
//                                          the 38th, the two dot armies, the arcs
//
// THE PROJECTION is Equal Earth (Savric, Patterson, Jenny 2018), north-up,
// Pacific-centred on 146 E (not a globe): Korea sits just left of the middle,
// the Americas on the right, Europe and Africa on the left. 146 E and not 140 E
// so the cut falls on 34 W, east of Brazil's Cabo Branco (34.8 W); at 140 E the
// whole Brazilian bulge would be torn off to the far left beside West Africa.
// Greenland still splits (every Pacific-centred map between 107 E and 169 E
// splits it). The sphere is 1000 world px wide with its centre on (540, 835):
// world px == screen px at the k 1 whole-world wide, where the world band
// (y 592..1078) sits centred on y 835 above the captions.
//
// 1950 POLITIES, NOT MODERN ONES. Countries are merged into their 1950 polity:
//   USA   the 48 states + Alaska + Hawaii (territories), Natural Earth's feature
//   USSR  Russia (incl. Kaliningrad, Tuva, S Sakhalin, the Kurils), Ukraine,
//         Belarus, Moldova, Estonia, Latvia, Lithuania, Georgia, Armenia,
//         Azerbaijan, Kazakhstan, Uzbekistan, Turkmenistan, Kyrgyzstan,
//         Tajikistan, Baikonur: one polity, no inner lines
//   PRC   China (mainland + Hainan; Taiwan, Hong Kong and Macao are not in it)
//   KOREA North + South Korea: one land mass (no DMZ); the 38th is an overlay
//   the 15 other UN combat contributors: UK, Canada (incl. Newfoundland,
//         Canadian since 1949), Australia, New Zealand, France (METROPOLITAN
//         only: Natural Earth's France carries Guiana, Reunion ...), the
//         Netherlands (European only), Belgium, Luxembourg, Greece, Turkey, the
//         Philippines, Thailand, Ethiopia (Natural Earth's modern Ethiopia has
//         no Eritrea, British-administered until 1952), Colombia, the Union of
//         South Africa (Natural Earth's South Africa has no South West Africa)
// A border is drawn only where one side is one of these lit polities and the
// other is a different 1950 polity. Everything else is coast only.
//
// KOREA IN 1950 (generated/components/korea1950Fronts.ts, read-only, by the
// Korea-map builder): the Pusan Perimeter of 4 Aug 1950 (Appleman, "South to
// the Naktong, North to the Yalu", CMH 1961, map III + ch. XIII), PARALLEL_38,
// PUSAN. The two armies at 1 dot = 3,000 men, strengths of early August 1950
// (Appleman ch. XIII; Wikipedia "Battle of the Pusan Perimeter", Prelude):
//   North Korean combat troops on the perimeter  ~70,000 -> 23 orange dots
//   UN troops inside it (ROK ~45,000 + US ~47,000) ~92,000 -> 31 cream dots
// Coordinates approximate to ~0.1 deg.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoCentroid, geoContains, geoDistance, geoEqualEarth, geoGraticule, geoPath } from "d3-geo";
import { feature, mesh, merge } from "topojson-client";
import { FRONT_4AUG, PARALLEL_38, PUSAN } from "../generated/components/korea1950Fronts.ts";

const OUT_STATIC = "generated/components/worldStatic.ts";
const OUT = "generated/components/worldMapData.ts";

// -- the projection -------------------------------------------------------------
export const ROTATE = -146;
const projection = geoEqualEarth().rotate([ROTATE, 0]).scale(1).translate([0, 0]);
{
  const b = geoPath(projection).bounds({ type: "Sphere" });
  projection.scale(1000 / (b[1][0] - b[0][0])).translate([540, 835]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const P = (ll) => projection(ll);

// -- a rounding path sink ----------------------------------------------------------
const sinkFor = (minStep, prec) => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  const n = (v) => {
    const r = Math.round(v * prec) / prec;
    return Object.is(r, -0) ? 0 : r;
  };
  return {
    moveTo(x, y) {
      if (pending) out += `L${n(pending[0])},${n(pending[1])}`;
      pending = null;
      px = sx = x;
      py = sy = y;
      out += `M${n(x)},${n(y)}`;
    },
    lineTo(x, y) {
      if (Math.hypot(x - px, y - py) < minStep) {
        pending = [x, y];
        return;
      }
      pending = null;
      px = x;
      py = y;
      out += `L${n(x)},${n(y)}`;
    },
    closePath() {
      if (pending && Math.hypot(pending[0] - sx, pending[1] - sy) >= minStep) out += `L${n(pending[0])},${n(pending[1])}`;
      pending = null;
      out += "Z";
    },
    result() {
      return out;
    },
  };
};
const bakeWith = (proj, geo, minStep, prec) => {
  const sink = sinkFor(minStep, prec);
  geoPath(proj, sink)(geo);
  return sink.result();
};
const bake = (geo, minStep, prec) => bakeWith(projection, geo, minStep, prec);

// A few tiny 10m rings wind the wrong way for d3-geo's spherical rule (read as
// the whole globe minus an atoll). Drop any polygon over a hemisphere.
const sanePolys = (geometry) => {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  return polys.filter((rings) => geoArea({ type: "Polygon", coordinates: [rings[0]] }) < 2 * Math.PI);
};
const saneGeo = (geometry) => ({ type: "MultiPolygon", coordinates: sanePolys(geometry) });

// -- land ------------------------------------------------------------------------
const land50T = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const land10T = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land50 = { type: "GeometryCollection", geometries: feature(land50T, land50T.objects.land).features.map((f) => saneGeo(f.geometry)) };
const land10 = { type: "GeometryCollection", geometries: feature(land10T, land10T.objects.land).features.map((f) => saneGeo(f.geometry)) };

// The 10m land is only needed where the camera goes close: the Asia-Pacific
// box the Korea close-up, the pull-back and the regional ring pass through.
// Clipped in world px (a clone of the projection with a clipExtent).
const NEAR_BOX = [
  [375, 580],
  [680, 960],
];
const projNear = geoEqualEarth().rotate([ROTATE, 0]).scale(SCALE).translate(TRANSLATE).clipExtent(NEAR_BOX);
const KOREA_BOX = [
  [450, 598],
  [585, 825],
];
const projKorea = geoEqualEarth().rotate([ROTATE, 0]).scale(SCALE).translate(TRANSLATE).clipExtent(KOREA_BOX);

const LAND_WORLD_D = bake(land50, 0.18, 20);
// The water-lines of the wides follow only land big enough to carry them: at the
// k 1 world a 50m atoll would print as a bullseye of four rings.
const WL_MIN_AREA = 2.5; // world px^2
const LAND_WORLD_WL_D = bake(
  {
    type: "GeometryCollection",
    geometries: land50.geometries.map((g) => ({
      type: "MultiPolygon",
      coordinates: g.coordinates.filter((rings) => geoPath(projection).area({ type: "Polygon", coordinates: rings }) >= WL_MIN_AREA),
    })),
  },
  0.18,
  20,
);
const LAND_NEAR_D = bakeWith(projNear, land10, 0.06, 40);
const LAND_KOREA_D = bakeWith(projKorea, land10, 0.015, 200);

// -- 1950 polities -----------------------------------------------------------------
const GROUP = {};
const put = (g, names) => names.forEach((n) => (GROUP[n] = g));
put("USSR", [
  "Russia",
  "Ukraine",
  "Belarus",
  "Moldova",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Georgia",
  "Armenia",
  "Azerbaijan",
  "Kazakhstan",
  "Uzbekistan",
  "Turkmenistan",
  "Kyrgyzstan",
  "Tajikistan",
  "Baikonur",
]);
put("PRC", ["China"]);
put("KOREA", ["North Korea", "South Korea"]);
put("USA", ["United States of America"]);
const PARTNER_NAMES = {
  UK: "United Kingdom",
  CAN: "Canada",
  AUS: "Australia",
  NZ: "New Zealand",
  FRA: "France",
  NLD: "Netherlands",
  BEL: "Belgium",
  LUX: "Luxembourg",
  GRC: "Greece",
  TUR: "Turkey",
  PHL: "Philippines",
  THA: "Thailand",
  ETH: "Ethiopia",
  COL: "Colombia",
  ZAF: "South Africa",
};
for (const [g, n] of Object.entries(PARTNER_NAMES)) GROUP[n] = g;
const LIT = new Set(["USSR", "PRC", "USA", ...Object.keys(PARTNER_NAMES)]);
// Every other feature is its own polity (keyed by name).
const groupOf = (f) => GROUP[f.properties.name] ?? `other:${f.properties.name}`;

// Keep only the 1950 metropolitan parts where Natural Earth carries overseas ones.
const KEEP_BOX = {
  France: [-6, 41, 10, 52], // metropolitan France + Corsica
  Netherlands: [3, 50, 8, 54], // European Netherlands
};
const inBox = (rings, [x0, y0, x1, y1]) => {
  const c = geoCentroid({ type: "Polygon", coordinates: rings });
  return c[0] >= x0 && c[0] <= x1 && c[1] >= y0 && c[1] <= y1;
};
const polity = (topo, g) => {
  const fs = feature(topo, topo.objects.countries).features.filter((f) => groupOf(f) === g);
  const polys = [];
  for (const f of fs) {
    for (const rings of sanePolys(f.geometry)) {
      const box = KEEP_BOX[f.properties.name];
      if (box && !inBox(rings, box)) continue;
      polys.push(rings);
    }
  }
  return { type: "MultiPolygon", coordinates: polys };
};

const c50 = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const c10 = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
// Border lines: one side lit, the other a different 1950 polity.
const borderFilter = (a, b) => {
  const ga = groupOf(a);
  const gb = groupOf(b);
  return a !== b && ga !== gb && (LIT.has(ga) || LIT.has(gb));
};
const BORDERS_WORLD_D = bake(mesh(c50, c50.objects.countries, borderFilter), 0.18, 20);
const BORDERS_NEAR_D = bakeWith(projNear, mesh(c10, c10.objects.countries, borderFilter), 0.06, 40);
const BORDERS_KOREA_D = bakeWith(projKorea, mesh(c10, c10.objects.countries, borderFilter), 0.015, 200);

// -- graticules + sphere -----------------------------------------------------------
const GRAT10_D = bake(geoGraticule().step([10, 10]).precision(1)(), 0.3, 20);
const GRAT5_D = bakeWith(projNear, geoGraticule().step([5, 5]).precision(0.5)(), 0.06, 40);
const SPHERE_D = bake({ type: "Sphere" }, 0.1, 20);

// -- the lit polities as overlays ---------------------------------------------------
// 50m, simplified for the zoom each is seen at: PRC / USSR light only in the
// regional ring (k <= ~7), the partners at the wides (k <= ~2.6).
const LIT_D = {};
const LIT_BOUNDS = {};
const LIT_KEYS = ["USA", ...Object.keys(PARTNER_NAMES), "PRC", "USSR"];
// Islets under LIT_MIN_AREA world px^2 are dropped from the lit overlay: a hatch
// cannot show on them, and their INK_HI rings would pile up as clutter in the
// Arctic at the wides (the baked coast still draws every one of them).
const LIT_MIN_AREA = { fine: 0.25, wide: 1.2 };
for (const g of LIT_KEYS) {
  const geo = polity(c50, g);
  const fine = g === "PRC" || g === "USSR";
  const minA = fine ? LIT_MIN_AREA.fine : LIT_MIN_AREA.wide;
  const areas = geo.coordinates.map((rings) => geoPath(projection).area({ type: "Polygon", coordinates: rings }));
  const biggest = Math.max(...areas);
  const kept = geo.coordinates.filter((_, i) => areas[i] >= minA || areas[i] === biggest); // a small country keeps its mainland
  LIT_D[g] = bake({ type: "MultiPolygon", coordinates: kept }, fine ? 0.07 : 0.12, 50);
  LIT_BOUNDS[g] = geoPath(projection)
    .bounds({ type: "MultiPolygon", coordinates: kept })
    .flat()
    .map((v) => Math.round(v * 100) / 100);
}

// Korea, one land mass, 10m, fine enough for the k ~25 close-up.
const koreaGeo = merge(
  c10,
  c10.objects.countries.geometries.filter((g) => GROUP[g.properties.name] === "KOREA"),
);
const KOREA_D = bake(koreaGeo, 0.012, 250);
const onKorea = (ll) => geoContains(koreaGeo, ll);

// -- the 4 Aug 1950 perimeter, the North's region, the 38th --------------------------
const r3 = (v) => Math.round(v * 1000) / 1000;
const ptOut = (ll) => {
  const [x, y] = P(ll);
  return [r3(x), r3(y)];
};
const FRONT = FRONT_4AUG; // W -> E incl. sea stubs: south coast west of Masan, up the Naktong, east to Yongdok
// The North's side: the front, then round the far side of the peninsula (the
// hatch is clipped to Korean land downstream, so the closure can run over sea).
const NORTH_RING_LL = [...FRONT, [131.2, FRONT[FRONT.length - 1][1]], [131.2, 43.6], [123.6, 43.6], [123.6, FRONT[0][1]]];
const toD = (pts) => `M${pts.map(([x, y]) => `${r3(x)},${r3(y)}`).join("L")}`;
const NORTH_D = `${toD(NORTH_RING_LL.map(P))}Z`;
const FRONT_D = toD(FRONT.map(P));
const P38_D = toD(PARALLEL_38.map(P));

// planar point-in-polygon in lon/lat (a small region; fine)
const inRing = (ring, [x, y]) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const KX = Math.cos((36 * Math.PI) / 180);
const segDist = (p, a, b) => {
  const ax = a[0] * KX;
  const bx = b[0] * KX;
  const px = p[0] * KX;
  const dx = bx - ax;
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), p[1] - (a[1] + t * dy));
};
const frontDist = (p) => {
  let d = Infinity;
  for (let i = 1; i < FRONT.length; i++) d = Math.min(d, segDist(p, FRONT[i - 1], FRONT[i]));
  return d;
};
const inlandBy = (p, r) => {
  if (!onKorea(p)) return false;
  for (let i = 0; i < 10; i++) {
    const t = (i / 10) * Math.PI * 2;
    if (!onKorea([p[0] + (r * Math.cos(t)) / KX, p[1] + r * Math.sin(t)])) return false;
  }
  return true;
};

// -- the two armies: blue noise (best-candidate), 1 dot = 3,000 men ----------------------
export const MEN_PER_DOT = 3000;
const KPA_4AUG = 70_000; // Appleman ch. XIII
const UN_4AUG = 92_000; // ROK ~45,000 + US ~47,000, Appleman ch. XIII
const N_KPA = Math.round(KPA_4AUG / MEN_PER_DOT); // 23
const N_UN = Math.round(UN_4AUG / MEN_PER_DOT); // 31
const mulberry = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const metric = (a, b) => Math.hypot((a[0] - b[0]) * KX, a[1] - b[1]);
const bestCandidate = (n, seed, box, ok, cands = 40) => {
  const rnd = mulberry(seed);
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < 200000) {
    let best = null;
    let bd = -1;
    for (let c = 0; c < cands; c++) {
      const p = [box[0] + rnd() * (box[2] - box[0]), box[1] + rnd() * (box[3] - box[1])];
      if (!ok(p)) continue;
      const d = out.reduce((m, q) => Math.min(m, metric(p, q)), Infinity);
      if (d > bd) [bd, best] = [d, p];
    }
    if (best) out.push(best);
  }
  return out;
};
const northRing = NORTH_RING_LL;
const KPA_LL = bestCandidate(N_KPA, 7, [127.6, 34.8, 129.6, 36.9], (p) => {
  if (!inRing(northRing, p) || !inlandBy(p, 0.04)) return false;
  const d = frontDist(p);
  return d > 0.07 && d < 0.34;
});
const UN_LL = bestCandidate(N_UN, 11, [128.2, 34.6, 129.7, 36.6], (p) => {
  if (inRing(northRing, p) || !inlandBy(p, 0.05)) return false;
  return frontDist(p) > 0.08;
});
// the nearest point on the front for each KPA dot (the direction it presses in)
const nearestOnFront = (p) => {
  let best = null;
  let bd = Infinity;
  for (let i = 1; i < FRONT.length; i++) {
    const a = FRONT[i - 1];
    const b = FRONT[i];
    for (let s = 0; s <= 10; s++) {
      const q = [a[0] + ((b[0] - a[0]) * s) / 10, a[1] + ((b[1] - a[1]) * s) / 10];
      const d = metric(p, q);
      if (d < bd) [bd, best] = [d, q];
    }
  }
  return best;
};
const KPA = KPA_LL.map((ll) => {
  const [x, y] = P(ll);
  const [fx, fy] = P(nearestOnFront(ll));
  const l = Math.hypot(fx - x, fy - y) || 1;
  return [r3(x), r3(y), r3((fx - x) / l), r3((fy - y) / l), r3(l)];
});
const UN = UN_LL.map(ptOut);
console.log(`armies: KPA ${KPA.length}/${N_KPA}, UN ${UN.length}/${N_UN}`);

// -- places ------------------------------------------------------------------------
const PLACE_LL = {
  pusan: PUSAN,
  koreaMid: [127.7, 38.3], // the ring's centre: the middle of the peninsula
  usLabel: [-98.5, 39.4], // the 48 states' middle
  sf: [-122.42, 37.78],
};

// -- the arcs: each partner's port / capital -> PUSAN, a gentle quadratic bow in
// projected space through a VIA point chosen over sea where it can ---------------------
// origin: where the country lights from and its arc leaves (the embarkation
// side, facing Korea); via: the bow's midpoint (t = 0.5), lon/lat.
const ARCS = {
  USA: { origin: [-122.42, 37.78], via: [-175, 44.5] }, // San Francisco, over the North Pacific
  CAN: { origin: [-123.1, 49.28], via: [-178, 50.5] }, // Vancouver
  COL: { origin: [-77.03, 3.88], via: [-160, 21] }, // Buenaventura, past Hawaii
  AUS: { origin: [151.2, -33.87], via: [141, 1] }, // Sydney, over the Coral Sea, north of New Guinea
  NZ: { origin: [174.76, -36.85], via: [157, 0] }, // Auckland
  PHL: { origin: [120.98, 14.6], via: [126.5, 25.5] }, // Manila, east of Taiwan
  THA: { origin: [100.5, 13.75], via: [116.5, 21] }, // Bangkok, over the South China Sea
  ETH: { origin: [38.74, 9.03], via: [84, 7] }, // Addis Ababa, over the Indian Ocean
  ZAF: { origin: [31.02, -29.86], via: [88, -4] }, // Durban
  TUR: { origin: [32.86, 39.93], via: [72, 9.2] }, // Ankara
  GRC: { origin: [23.73, 37.98], via: [69.5, 8.7] }, // Athens
  UK: { origin: [-0.13, 51.5], via: [67, 8.3] }, // London: the five NW European arcs share one via (the Suez route), so they run as one line
  FRA: { origin: [2.35, 48.86], via: [67, 8.3] }, // Paris
  NLD: { origin: [4.9, 52.37], via: [67, 8.3] }, // Amsterdam
  BEL: { origin: [4.35, 50.85], via: [67, 8.3] }, // Brussels
  LUX: { origin: [6.13, 49.61], via: [67, 8.3] }, // Luxembourg
};
const pusanXY = P(PUSAN);
const arcOut = {};
const land50geo = land50;
for (const [g, a] of Object.entries(ARCS)) {
  const O = P(a.origin);
  const V = P(a.via);
  const E = pusanXY;
  const Q = [2 * V[0] - (O[0] + E[0]) / 2, 2 * V[1] - (O[1] + E[1]) / 2];
  const N = 96;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    pts.push([u * u * O[0] + 2 * u * t * Q[0] + t * t * E[0], u * u * O[1] + 2 * u * t * Q[1] + t * t * E[1]]);
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  // over-land share, for the log
  let wet = 0;
  for (const p of pts) if (!geoContains(land50geo, projection.invert(p))) wet++;
  // the country's spread radius: farthest vertex from the origin (world px)
  const geo = polity(c50, g);
  let R = 0;
  for (const rings of geo.coordinates) for (const q of rings[0]) R = Math.max(R, Math.hypot(P(q)[0] - O[0], P(q)[1] - O[1]));
  const dist = (geoDistance(a.origin, PLACE_LL.koreaMid) * 180) / Math.PI;
  arcOut[g] = {
    pts: pts.map(([x, y]) => [r3(x), r3(y)]),
    len: r3(len),
    origin: [r3(O[0]), r3(O[1])],
    spreadR: r3(R + 1),
    distDeg: Math.round(dist * 10) / 10,
  };
  console.log(`arc ${g.padEnd(4)} len ${len.toFixed(0).padStart(4)} px  sea ${((100 * wet) / pts.length).toFixed(0).padStart(3)}%  spreadR ${R.toFixed(0)}  dist ${dist.toFixed(1)} deg`);
}

// -- checks -------------------------------------------------------------------------
console.log(`scale ${SCALE.toFixed(3)} translate ${TRANSLATE.map((v) => v.toFixed(1))}`);
console.log("sphere bounds", geoPath(projection).bounds({ type: "Sphere" }).map((q) => q.map((v) => v.toFixed(1))));
console.log("korea bounds", geoPath(projection).bounds(koreaGeo).map((q) => q.map((v) => v.toFixed(2))));
for (const g of LIT_KEYS) console.log(`lit ${g.padEnd(5)} ${(LIT_D[g].length / 1024).toFixed(0)} KB`);

// -- write ---------------------------------------------------------------------------
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-world-map.mjs — do not edit by hand.
// The STATIC layers of the Korea 1950 world pair, read ONLY by
// scripts/bake-world-rasters.mjs (never import this from a component).
// Natural Earth (public domain) on Equal Earth, centre meridian 146 E, scale
// ${SCALE.toFixed(4)}, translate ${TRANSLATE.join(", ")}: the sphere is 1000 world px wide.

/** 50m land, the whole world. */
export const LAND_WORLD_D = ${JSON.stringify(LAND_WORLD_D)};
/** 50m land big enough to carry water-lines at the wides (>= ${WL_MIN_AREA} world px^2). */
export const LAND_WORLD_WL_D = ${JSON.stringify(LAND_WORLD_WL_D)};
/** 10m land, clipped to the Asia-Pacific box ${JSON.stringify(NEAR_BOX)}. */
export const LAND_NEAR_D = ${JSON.stringify(LAND_NEAR_D)};
/** 10m land, finely, clipped to the Korea box ${JSON.stringify(KOREA_BOX)}. */
export const LAND_KOREA_D = ${JSON.stringify(LAND_KOREA_D)};
/** 1950 borders of the lit polities (50m, whole world). */
export const BORDERS_WORLD_D = ${JSON.stringify(BORDERS_WORLD_D)};
/** 1950 borders of the lit polities (10m, Asia-Pacific box). */
export const BORDERS_NEAR_D = ${JSON.stringify(BORDERS_NEAR_D)};
/** 1950 borders of the lit polities (10m, Korea box). */
export const BORDERS_KOREA_D = ${JSON.stringify(BORDERS_KOREA_D)};
/** 10 deg graticule, whole world. */
export const GRAT10_D = ${JSON.stringify(GRAT10_D)};
/** 5 deg graticule, Asia-Pacific box. */
export const GRAT5_D = ${JSON.stringify(GRAT5_D)};
/** The outline of the sphere (the edge of the Equal Earth world). */
export const SPHERE_D = ${JSON.stringify(SPHERE_D)};
export const NEAR_BOX = ${JSON.stringify(NEAR_BOX)};
export const KOREA_BOX = ${JSON.stringify(KOREA_BOX)};
`,
);

writeFileSync(
  OUT,
  `// Generated by scripts/build-world-map.mjs — do not edit by hand.
// The light OVERLAYS of the Korea 1950 world pair (ThirdPartyIntervention +
// CivilRegionalGlobal). Equal Earth, centre meridian 146 E; world px == screen
// px at the k 1 whole-world wide (sphere 1000 px wide, centre (540, 835)).
// Sources: see scripts/build-world-map.mjs.

export type Pt = [number, number];

/** the projection, so a component can rebuild it with d3-geo (the ring) */
export const PROJ = { rotate: ${ROTATE}, scale: ${SCALE}, translate: [${TRANSLATE.join(", ")}] as Pt };

export const MEN_PER_DOT = ${MEN_PER_DOT};
export const KPA_4AUG = ${KPA_4AUG};
export const UN_4AUG = ${UN_4AUG};

/** the lit polities of 1950 (50m), one path each */
export const LIT_D: Record<string, string> = ${JSON.stringify(LIT_D)};

/** each lit polity's projected bounds as drawn: [x0, y0, x1, y1] (world px), for framing the wide */
export const LIT_BOUNDS: Record<string, [number, number, number, number]> = ${JSON.stringify(LIT_BOUNDS)};

/** Korea, one land mass (10m) */
export const KOREA_D = ${JSON.stringify(KOREA_D)};
/** the North's side of the 4 Aug 1950 Pusan Perimeter (clip it to KOREA_D) */
export const NORTH_D = ${JSON.stringify(NORTH_D)};
/** the 4 Aug 1950 Pusan Perimeter, W -> E, with its sea stubs (clip to KOREA_D) */
export const FRONT_D = ${JSON.stringify(FRONT_D)};
/** 38 N over Korean land (clip to KOREA_D) */
export const P38_D = ${JSON.stringify(P38_D)};

/** KPA dots: x, y, unit direction to the front (dx, dy), distance to it (world px) */
export const KPA: [number, number, number, number, number][] = ${JSON.stringify(KPA)};
/** UN dots inside the perimeter: x, y */
export const UN: Pt[] = ${JSON.stringify(UN)};

export const PLACES: Record<string, Pt> = ${JSON.stringify(Object.fromEntries(Object.entries(PLACE_LL).map(([k, v]) => [k, ptOut(v)])))};
export const PLACES_LL: Record<string, Pt> = ${JSON.stringify(PLACE_LL)};

/** the arcs, origin -> PUSAN, sampled quadratic bows (world px), their length,
 *  the origin, the spread radius of the country from it, the distance from Korea */
export type Arc = { pts: Pt[]; len: number; origin: Pt; spreadR: number; distDeg: number };
export const ARCS: Record<string, Arc> = ${JSON.stringify(arcOut)};
`,
);
mkdirSync("public/world", { recursive: true });
console.log(
  `Wrote ${OUT_STATIC}: land world ${(LAND_WORLD_D.length / 1024).toFixed(0)} KB, near ${(LAND_NEAR_D.length / 1024).toFixed(0)} KB, korea ${(LAND_KOREA_D.length / 1024).toFixed(0)} KB, borders ${(BORDERS_WORLD_D.length / 1024).toFixed(0)}/${(BORDERS_NEAR_D.length / 1024).toFixed(0)}/${(BORDERS_KOREA_D.length / 1024).toFixed(0)} KB`,
);
console.log(`Wrote ${OUT}`);
