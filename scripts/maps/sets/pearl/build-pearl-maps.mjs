// Bakes the VECTOR data of the Pearl Harbor clip's two map worlds into flat TS
// modules the cuts import (no d3 at render time):
//
//   bun scripts/maps/sets/pearl/build-pearl-maps.mjs            (both worlds)
//   bun scripts/maps/sets/pearl/build-pearl-maps.mjs asia       (one)
//
// Writes
//   generated/components/sarah-pearl-harbor/pearlAsiaMapData.ts     ASIA world (cuts B-E)
//   generated/components/sarah-pearl-harbor/pearlPacificMapData.ts  PACIFIC world (cut F)
//
// Geometry, projections and the region lines live in scripts/maps/sets/pearl/pearl-geo.mjs (the
// raster bake reads the same module). Region fills are clipped to the land at
// bake time (Natural Earth 10m countries, polygon-clipping in world px) so the
// cuts never clip against the 10m coast per frame; each region also carries its
// `edge`: the inland runs of its boundary (over land, away from the coast), where
// the dashed orange edge is drawn.

import { writeFileSync } from "node:fs";
import {
  FRONT_LL,
  KWANTUNG_NORTH,
  TONKIN_SOUTH,
  WALL_LL,
  WORLDS,
  catmull,
  coastIndex,
  dist,
  inlandRuns,
  landOf,
  r2,
  regionsOf,
  ringArea,
  thinLine,
  thinRing,
} from "./pearl-geo.mjs";
import { geoContains } from "d3-geo";
import { COUNTRIES } from "./pearl-geo.mjs";

const only = process.argv[2];

// ---------------------------------------------------------------------------
// serialisers
// ---------------------------------------------------------------------------
const ptsD = (pts, close = false) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}`;
const mpD = (mp) =>
  mp
    .map((poly) =>
      poly
        .map((ring) => {
          const r = dist(ring[0], ring[ring.length - 1]) < 1e-9 ? ring.slice(0, -1) : ring;
          return r.length >= 3 ? ptsD(r, true) : "";
        })
        .join(""),
    )
    .join("");
const mpBox = (mp) => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of mp) for (const [x, y] of poly[0]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return [r2(x0), r2(y0), r2(x1), r2(y1)];
};
const roundPts = (pts) => pts.map(([x, y]) => [r2(x), r2(y)]);
const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i], pts[i - 1]));
  return c;
};
/** a coarse MultiPolygon as nested point arrays (for in-polygon tests: dot fields) */
const coarse = (mp, step, minArea) =>
  mp
    .map((poly) => poly.map((r) => roundPts(thinRing(r, step))).filter((r) => r.length >= 3))
    .filter((poly) => poly.length && Math.abs(ringArea(poly[0])) >= minArea);
const regionObj = (mp, coast, edgeOpts) => {
  const runs = inlandRuns(mp, coast, edgeOpts);
  return { d: mpD(mp), edge: runs.map((r) => ptsD(r)).join(""), box: mpBox(mp) };
};
const tsConst = (name, value, doc, type = "") => `${doc ? `/** ${doc} */\n` : ""}export const ${name}${type} = ${JSON.stringify(value)};\n`;

// the projection, as TS (identical to the d3 one; checked below)
const projectTs = (W) =>
  W.params.kind === "lcc"
    ? `
const RAD = Math.PI / 180;
const tany = (y: number) => Math.tan((Math.PI / 2 + y) / 2);
const Y0 = PROJ.parallels[0] * RAD;
const Y1 = PROJ.parallels[1] * RAD;
const N_ = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
const F_ = (Math.cos(Y0) * Math.pow(tany(Y0), N_)) / N_;
/** lon, lat (deg) -> world px [x, y] (north-up Lambert conformal conic, = the baked map) */
export const project = (lon: number, lat: number): [number, number] => {
  let l = (lon + PROJ.rotate) * RAD;
  l = Math.atan2(Math.sin(l), Math.cos(l));
  const r = F_ / Math.pow(tany(lat * RAD), N_);
  return [PROJ.translate[0] + PROJ.scale * r * Math.sin(N_ * l), PROJ.translate[1] - PROJ.scale * (F_ - r * Math.cos(N_ * l))];
};`
    : `
const RAD = Math.PI / 180;
/** lon, lat (deg) -> world px [x, y] (north-up Mercator rotated to 160 E, = the baked map).
 *  Any longitude convention works: -158 and 202 are the same place (right of Wake). */
export const project = (lon: number, lat: number): [number, number] => {
  let l = (lon + PROJ.rotate) * RAD;
  l = Math.atan2(Math.sin(l), Math.cos(l));
  return [PROJ.translate[0] + PROJ.scale * l, PROJ.translate[1] - PROJ.scale * Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];
};
/** world px -> lon (-180..180), lat */
export const unproject = (x: number, y: number): [number, number] => {
  const l = (x - PROJ.translate[0]) / PROJ.scale / RAD - PROJ.rotate;
  const lon = ((((l + 180) % 360) + 360) % 360) - 180;
  return [lon, (2 * Math.atan(Math.exp((PROJ.translate[1] - y) / PROJ.scale)) - Math.PI / 2) / RAD];
};`;
// a JS twin of the TS projection, to check it against d3
const projectJs = (W) => {
  const p = W.params;
  const RAD = Math.PI / 180;
  if (p.kind === "lcc") {
    const tany = (y) => Math.tan((Math.PI / 2 + y) / 2);
    const Y0 = p.parallels[0] * RAD;
    const Y1 = p.parallels[1] * RAD;
    const N = Math.log(Math.cos(Y0) / Math.cos(Y1)) / Math.log(tany(Y1) / tany(Y0));
    const F = (Math.cos(Y0) * Math.pow(tany(Y0), N)) / N;
    return (lon, lat) => {
      let l = (lon + p.rotate) * RAD;
      l = Math.atan2(Math.sin(l), Math.cos(l));
      const r = F / Math.pow(tany(lat * RAD), N);
      return [p.translate[0] + p.scale * r * Math.sin(N * l), p.translate[1] - p.scale * (F - r * Math.cos(N * l))];
    };
  }
  return (lon, lat) => {
    let l = (lon + p.rotate) * RAD;
    l = Math.atan2(Math.sin(l), Math.cos(l));
    return [p.translate[0] + p.scale * l, p.translate[1] - p.scale * Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))];
  };
};
const checkProjection = (W, samples) => {
  const js = projectJs(W);
  let worst = 0;
  for (const [lon, lat] of samples) {
    const a = W.proj([lon, lat]);
    const b = js(lon, lat);
    worst = Math.max(worst, dist(a, b));
  }
  console.log(`${W.name}: TS projection vs d3, worst ${worst.toExponential(2)} px`);
  if (worst > 1e-3) throw new Error("projection mismatch");
};

// ---------------------------------------------------------------------------
// places (lat, lon in the brief; stored here as [lon, lat])
// ---------------------------------------------------------------------------
const ASIA_PLACES = {
  tokyo: [139.69, 35.68],
  osaka: [135.5, 34.69],
  seoul: [126.98, 37.57], // Keijo
  mukden: [123.43, 41.8], // Shenyang
  fushun: [123.95, 41.88],
  anshan: [122.99, 41.11],
  dairen: [121.6, 38.91],
  portArthur: [121.26, 38.81],
  hsinking: [125.32, 43.88], // Changchun
  harbin: [126.53, 45.8],
  beijing: [116.4, 39.9],
  tianjin: [117.2, 39.13],
  shanghai: [121.47, 31.23],
  nanjing: [118.8, 32.06],
  wuhan: [114.31, 30.59],
  chongqing: [106.55, 29.56],
  kunming: [102.71, 25.04],
  yanan: [109.49, 36.59],
  taiyuan: [112.55, 37.87],
  xian: [108.94, 34.34],
  chengdu: [104.07, 30.66],
  guilin: [110.29, 25.27],
  guangzhou: [113.26, 23.13],
  hongKong: [114.17, 22.3],
  lanzhou: [103.83, 36.06],
  hanoi: [105.85, 21.03],
  haiphong: [106.68, 20.86],
  lashio: [97.75, 22.93],
  rangoon: [96.16, 16.8],
  mandalay: [96.08, 21.98],
};
// faction seats, 1936-37 (approximate centres) for D's crowds
const FACTIONS = {
  nationalists: [116.5, 31.5], // Nanjing-Wuhan
  communists: [109.5, 36.6], // Yan'an
  shanxi: [112.5, 37.9], // Yan Xishan
  guangxi: [109.0, 24.5], // the Guangxi clique
  sichuan: [104.5, 30.6],
  yunnan: [102.7, 25.0], // Long Yun
  ma: [102.5, 36.0], // the northwest Ma clique
};
// B's Manchurian resources
const RESOURCES = {
  coal: [123.95, 41.88], // Fushun
  iron: [122.99, 41.11], // Anshan (iron and steel)
  soybeans: [125.5, 44.5], // the central plain
};
// aid routes into Nationalist China (stations, [lon, lat])
const BURMA_RAIL = [
  ["rangoon", 96.16, 16.8],
  ["toungoo", 96.43, 18.94],
  ["thazi", 96.06, 20.85],
  ["mandalay", 96.08, 21.98],
  ["maymyo", 96.47, 22.03],
  ["hsipaw", 97.3, 22.62],
  ["lashio", 97.75, 22.93],
];
const BURMA_ROAD = [
  ["lashio", 97.75, 22.93],
  ["kutkai", 97.93, 23.45],
  ["wanting", 98.07, 24.08],
  ["longling", 98.69, 24.58],
  ["baoshan", 99.16, 25.12],
  ["xiaguan", 100.23, 25.58],
  ["chuxiong", 101.55, 25.04],
  ["kunming", 102.71, 25.04],
  ["qujing", 103.8, 25.49],
  ["guiyang", 106.63, 26.65],
  ["chongqing", 106.55, 29.56],
];
const YUNNAN_RAILWAY = [
  ["haiphong", 106.68, 20.86],
  ["hanoi", 105.85, 21.03],
  ["yenBai", 104.9, 21.72],
  ["laoCai", 103.97, 22.49],
  ["kaiyuan", 103.25, 23.7],
  ["kunming", 102.71, 25.04],
];

/** a route through stations: centripetal Catmull-Rom in world px, with arclength */
const routeOf = (W, stations) => {
  const pts = stations.map(([, lon, lat]) => W.proj([lon, lat]));
  const curve = catmull(pts, 24);
  const fine = thinLine(curve, 0.25);
  const cum = cumOf(fine);
  // station arclengths: nearest fine sample to each station
  const st = {};
  stations.forEach(([name], i) => {
    const p = pts[i];
    let best = 0;
    let bd = Infinity;
    fine.forEach((q, j) => {
      const d = dist(p, q);
      if (d < bd) [bd, best] = [d, j];
    });
    st[name] = r2(cum[best]);
  });
  return { pts: roundPts(fine), len: r2(cum[cum.length - 1]), stations: st };
};

// ---------------------------------------------------------------------------
// ASIA
// ---------------------------------------------------------------------------
const buildAsia = () => {
  const W = WORLDS.asia;
  const P = W.proj;
  checkProjection(W, [[73, 40], [150, 55], [96, 16], [139.7, 35.7], [112, 30], [88, 5]]);
  const t0 = Date.now();
  const land = landOf(W);
  const coast = coastIndex(land);
  console.log(`asia: ${land.length} land polygons, coast index ${Date.now() - t0} ms`);
  const R = regionsOf(W);
  console.log(`asia: regions ${Date.now() - t0} ms`);

  const regions = {
    JAPAN_1931: [R.japan1931, "Japan's empire in 1931: the home islands (incl. Ryukyu, Kurils), Korea, Taiwan, Karafuto (Sakhalin S of 50 N), the Kwantung Leased Territory"],
    KWANTUNG: [R.kwantung, `the Kwantung Leased Territory (Port Arthur, Dairen), south of ${KWANTUNG_NORTH} N on the Liaodong tip (also inside JAPAN_1931)`],
    MANCHUKUO: [R.manchukuo, "Manchukuo, 1933 extent incl. Jehol (minus Kwantung). West boundary APPROXIMATE"],
    OCCUPIED_1938: [R.occupied, "Japanese-held China by early 1939 (east of FRONT_1938) + the Canton pocket + Hainan. APPROXIMATE"],
    FREE_CHINA: [R.freeChina, "the unoccupied interior, 1938-40: China minus Manchukuo, Kwantung and OCCUPIED_1938"],
    INDOCHINA_NORTH: [R.tonkin, `Tonkin: Vietnam north of ${TONKIN_SOUTH} N (Japanese troops from Sept 1940)`],
    HAINAN: [R.hainan, "Hainan (Feb 1939; inside OCCUPIED_1938)"],
    CANTON: [R.canton, "the Canton pocket, Oct 1938 (inside OCCUPIED_1938; Hong Kong and Macau excluded)"],
  };
  let body = "";
  for (const [name, [mp, doc]] of Object.entries(regions)) {
    const o = regionObj(mp, coast);
    body += tsConst(name, o, `${doc}. { d: fill (land-clipped), edge: inland boundary runs, box: [x0, y0, x1, y1] }`, ": Region");
    console.log(`  ${name}: d ${(o.d.length / 1024).toFixed(0)} KB, edge ${(o.edge.length / 1024).toFixed(0)} KB, box ${o.box}`);
  }
  // CHINA_ALL: the outer outline (mainland ring + Hainan), the dashed "plan"
  const chinaPolys = R.china.slice().sort((a, b) => Math.abs(ringArea(b[0])) - Math.abs(ringArea(a[0])));
  const mainRing = thinRing(chinaPolys[0][0], 0.3);
  const hainanRing = thinRing(R.hainan.sort((a, b) => Math.abs(ringArea(b[0])) - Math.abs(ringArea(a[0])))[0][0], 0.3);
  // start the outline pen at the Yalu mouth (the point nearest Korea's border on the coast)
  const yalu = P([124.35, 39.85]);
  let si = 0;
  mainRing.forEach((q, i) => {
    if (dist(q, yalu) < dist(mainRing[si], yalu)) si = i;
  });
  const main = [...mainRing.slice(si), ...mainRing.slice(0, si)];
  if (ringArea(main) < 0) main.reverse();
  const mainClosed = [...main, main[0]];
  body += tsConst("CHINA_ALL", { d: `${ptsD(main, true)}${ptsD(hainanRing, true)}`, box: mpBox(R.china) }, "all of China (mainland outline + Hainan, no Taiwan): the outline for the dashed 'plan'", ": { d: string; box: Box }");
  body += tsConst("CHINA_OUTLINE_PTS", roundPts(mainClosed), "the mainland outline as a CLOSED polyline starting at the Yalu mouth, for a pen draw-on (Hainan separate)", ": P2[]");
  body += tsConst("HAINAN_OUTLINE_PTS", roundPts([...hainanRing, hainanRing[0]]), "", ": P2[]");
  console.log(`  CHINA_ALL outline ${mainClosed.length} pts`);

  // the front: smoothed lon/lat line, kept where it is over China
  const china = COUNTRIES.find((c) => c.properties.name === "China");
  const fr = R.frontDense;
  const onCh = fr.map((ll) => geoContains(china, ll));
  let a = onCh.indexOf(true);
  let b = onCh.lastIndexOf(true);
  const front = thinLine(fr.slice(a, b + 1).map((q) => P(q)), 0.3);
  body += tsConst("FRONT_1938_PTS", roundPts(front), "the stalled front of 1938-39, N (Mongolia border, 110 E) -> S (Hangzhou bay), world px; OCCUPIED_1938 is EAST of it", ": P2[]");
  body += tsConst("FRONT_1938_D", ptsD(front), "");
  body += tsConst("FRONT_1938_LL", FRONT_LL, "its vertices (lon, lat; first and last run into Mongolia / the sea)", ": LL[]");
  body += tsConst("WALL_LL", WALL_LL, "Manchukuo's south-west boundary vertices (lon, lat), Shanhaiguan -> the Mongolia border", ": LL[]");

  // coarse polygons for dot fields
  body += tsConst("CHINA_POLY", coarse(R.china, 1.2, 40), "all of China, coarse rings (world px) for in-polygon tests", ": P2[][][]");
  body += tsConst("FREE_CHINA_POLY", coarse(R.freeChina, 1.2, 40), "", ": P2[][][]");
  body += tsConst("MANCHUKUO_POLY", coarse(R.manchukuo, 1.0, 20), "", ": P2[][][]");
  body += tsConst("OCCUPIED_POLY", coarse(R.occupied, 1.0, 20), "", ": P2[][][]");

  // routes
  const burmaRail = routeOf(W, BURMA_RAIL);
  const burmaRoad = routeOf(W, BURMA_ROAD);
  const burmaAll = routeOf(W, [...BURMA_RAIL, ...BURMA_ROAD.slice(1)]);
  const yunnan = routeOf(W, YUNNAN_RAILWAY);
  body += tsConst("BURMA_RAIL", burmaRail, "Rangoon -> Mandalay -> Lashio, the railway leg (chequered symbol)", ": RouteData");
  body += tsConst("BURMA_ROAD", burmaRoad, "Lashio -> Wanting -> Baoshan -> Xiaguan -> Kunming -> Guiyang -> Chongqing, the road", ": RouteData");
  body += tsConst("BURMA_ROUTE", burmaAll, "the whole Burma lifeline Rangoon -> Chongqing in one polyline (for packets); BURMA_ROUTE.stations.lashio is where the road starts", ": RouteData");
  body += tsConst("YUNNAN_RAILWAY", yunnan, "Haiphong -> Hanoi -> Lao Cai -> Kaiyuan -> Kunming (French Yunnan railway)", ": RouteData");
  console.log(`  routes: burma ${burmaAll.len} px (${burmaAll.pts.length} pts), yunnan ${yunnan.len} px`);

  const L = (ll) => {
    const [x, y] = P(ll);
    return [r2(x), r2(y)];
  };
  const mapObj = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, L(v)]));
  body += tsConst("PLACES", mapObj(ASIA_PLACES), "places, world px", ": Record<AsiaPlace, P2>");
  body += tsConst("PLACES_LL", ASIA_PLACES, "the same, [lon, lat]", ": Record<AsiaPlace, LL>");
  body += tsConst("FACTIONS", mapObj(FACTIONS), "faction seats 1936-37 (approximate centres), world px", ": Record<Faction, P2>");
  body += tsConst("FACTIONS_LL", FACTIONS, "", ": Record<Faction, LL>");
  body += tsConst("RESOURCES", mapObj(RESOURCES), "B's Manchurian resources: Fushun coal, Anshan iron/steel, soybeans of the central plain", ": Record<\"coal\" | \"iron\" | \"soybeans\", P2>");

  // suggested framings (camera: world (x, y) on the frame centre at zoom k)
  const fit = (box, frac = 0.92) => {
    const [x0, y0, x1, y1] = box;
    return { x: r2((x0 + x1) / 2), y: r2((y0 + y1) / 2), k: r2(Math.min((1080 * frac) / (x1 - x0), (1920 * frac) / (y1 - y0))) };
  };
  const chinaBox = mpBox(R.china);
  const mBox = mpBox(R.manchukuo);
  const swBox = (() => {
    const pts = [...burmaAll.pts, ...yunnan.pts];
    return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  })();
  const llFit = (lon0, lon1, lat0, lat1, frac) => {
    const c = [];
    for (let i = 0; i <= 10; i++)
      for (let j = 0; j <= 10; j++) c.push(P([lon0 + ((lon1 - lon0) * i) / 10, lat0 + ((lat1 - lat0) * j) / 10]));
    return fit([Math.min(...c.map((q) => q[0])), Math.min(...c.map((q) => q[1])), Math.max(...c.map((q) => q[0])), Math.max(...c.map((q) => q[1]))], frac);
  };
  const framings = {
    CHINA_WIDE: fit(chinaBox, 0.98),
    EAST_ASIA: llFit(98, 142, 18, 50, 1),
    MANCHURIA_CLOSE: fit(mBox, 0.95),
    SOUTH_MANCHURIA: llFit(120.5, 126.5, 38.3, 43.6, 0.95),
    SOUTHWEST: fit(swBox, 0.9),
  };
  body += tsConst("FRAMINGS", framings, "suggested cameras { x, y, k } (world point on the frame centre); cuts tune their own", ": Record<string, { x: number; y: number; k: number }>");
  console.log(`  framings ${JSON.stringify(framings)}`);

  const header = `// Generated by scripts/maps/sets/pearl/build-pearl-maps.mjs — do not edit by hand.
// THE ASIA WORLD of the Pearl Harbor clip (cuts B-E). Natural Earth 10m on a
// north-up Lambert conformal conic, parallels 25/45, centre meridian 112 E.
// World px == screen px at k 1, the "all of China" scale (65 deg of longitude in
// 1080 px). (112 E, 30 N) = world (540, 960). The static map is the raster LOD
// pyramid (pearlLevels.ts, <MapBase world="asia">); everything here is overlay.
// Regions are land-clipped fills + their inland edges (dashed orange in <Hatch>).
// APPROXIMATE: Manchukuo's west boundary (Jehol / Hsingan vs Chahar), the 1938-39
// front, the Canton pocket, Tonkin's south line (${TONKIN_SOUTH} N).

export type P2 = [number, number];
export type LL = [number, number];
export type Box = [number, number, number, number];
export type Region = { d: string; edge: string; box: Box };
export type RouteData = { pts: P2[]; len: number; stations: Record<string, number> };
export type AsiaPlace = ${Object.keys(ASIA_PLACES).map((k) => `"${k}"`).join(" | ")};
export type Faction = ${Object.keys(FACTIONS).map((k) => `"${k}"`).join(" | ")};

export const PROJ = ${JSON.stringify({ kind: "lcc", parallels: W.params.parallels, rotate: -W.params.rotate * -1, scale: W.params.scale, translate: W.params.translate })};
${projectTs(W)}

`;
  writeFileSync("generated/components/sarah-pearl-harbor/pearlAsiaMapData.ts", header + body);
  console.log(`Wrote generated/components/sarah-pearl-harbor/pearlAsiaMapData.ts (${((header + body).length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`);
};

// ---------------------------------------------------------------------------
// PACIFIC
// ---------------------------------------------------------------------------
const PAC_PLACES = {
  tokyo: [139.69, 35.68],
  pearlHarbor: [-157.97, 21.35],
  honolulu: [-157.86, 21.31],
  wake: [166.65, 19.28],
  guam: [144.79, 13.44],
  saipan: [145.75, 15.2],
  kwajalein: [167.73, 8.72],
  manila: [120.98, 14.6],
  clarkField: [120.56, 15.18],
  takao: [120.3, 22.6],
  singapore: [103.85, 1.29],
  kotaBharu: [102.24, 6.13],
  singora: [100.6, 7.2],
  pattani: [101.25, 6.87],
  saigon: [106.7, 10.8],
  hanoi: [105.85, 21.03],
  samah: [109.5, 18.2],
  shanghai: [121.49, 31.24],
  hongKong: [114.17, 22.3],
  midway: [-177.37, 28.21],
};
// TARGETS of 7/8 December 1941 and the real launch points of the strikes
const TARGETS = {
  pearlHarbor: [-157.97, 21.35],
  kotaBharu: [102.24, 6.13],
  singora: [100.6, 7.2],
  pattani: [101.25, 6.87],
  singapore: [103.85, 1.29],
  clarkField: [120.56, 15.18],
  wake: [166.65, 19.28],
  guam: [144.79, 13.44],
  shanghai: [121.49, 31.24], // the International Settlement
};
const ORIGINS = {
  kidoButai: [-158.0, 26.0], // the carrier force, ~230 nmi north of Oahu
  samah: [109.5, 18.2], // Hainan: the Malaya invasion convoy
  saigon: [106.7, 10.8], // bombers for Singapore
  takao: [120.3, 22.6], // Formosa: bombers for Clark Field
  roi: [167.5, 9.4], // Kwajalein / Roi: bombers for Wake
  saipan: [145.75, 15.2], // bombers for Guam
  huangpu: [121.5, 31.255], // Japanese forces already in Shanghai, on the Huangpu (approximate)
};
// the convoy's sea route: Samah south past Indochina, round Cape Ca Mau into the
// Gulf of Siam, then the landing points (approximate track)
const CONVOY_VIA = [
  [109.5, 18.2],
  [110.1, 15.5],
  [109.6, 12.0],
  [107.6, 9.0],
  [105.2, 7.9],
  [103.2, 8.1],
];
const STRIKES = [
  { id: "pearlHarbor", from: "kidoButai", to: "pearlHarbor" },
  { id: "kotaBharu", from: "samah", to: "kotaBharu", via: true },
  { id: "singora", from: "samah", to: "singora", via: true },
  { id: "pattani", from: "samah", to: "pattani", via: true },
  { id: "singapore", from: "saigon", to: "singapore" },
  { id: "clarkField", from: "takao", to: "clarkField" },
  { id: "wake", from: "roi", to: "wake" },
  { id: "guam", from: "saipan", to: "guam" },
  { id: "shanghai", from: "huangpu", to: "shanghai" },
];
// South Seas Mandate islands (points for a minimum visible size; Guam is US)
const MANDATE_POINTS = {
  palau: [134.48, 7.34],
  yap: [138.13, 9.53],
  ulithi: [139.7, 10.0],
  woleai: [143.9, 7.37],
  truk: [151.78, 7.42],
  ponape: [158.21, 6.96],
  kusaie: [162.98, 5.32],
  saipan: [145.75, 15.18],
  tinian: [145.63, 15.0],
  rota: [145.2, 14.15],
  pagan: [145.77, 18.12],
  eniwetok: [162.3, 11.5],
  kwajalein: [167.73, 8.72],
  roi: [167.47, 9.4],
  wotje: [170.25, 9.45],
  maloelap: [171.1, 8.75],
  majuro: [171.38, 7.1],
  jaluit: [169.64, 5.92],
  mili: [171.73, 6.08],
};

const buildPacific = () => {
  const W = WORLDS.pacific;
  const P = W.proj;
  checkProjection(W, [[90, -12], [-150, 50], [-157.97, 21.35], [167, 9], [100, 6]]);
  const t0 = Date.now();
  const land = landOf(W);
  const coast = coastIndex(land);
  const R = regionsOf(W);
  console.log(`pacific: ${land.length} land polygons, regions ${Date.now() - t0} ms`);
  const regions = {
    JAPAN_1941: [R.japan1941, "everything Japan held on 7 Dec 1941: the empire of 1931, Manchukuo, occupied China + Hainan, French Indochina (troops throughout since July 1941), the South Seas Mandate"],
    EMPIRE_1931: [R.japan1931, "the home islands (incl. Kurils, Ryukyu), Korea, Taiwan, Karafuto, Kwantung"],
    MANCHUKUO: [R.manchukuo, "Manchukuo (approximate west boundary)"],
    OCCUPIED_CHINA: [R.occupied, "occupied China by early 1939 + Canton + Hainan (approximate; no Yichang salient)"],
    INDOCHINA: [R.indochina, "French Indochina (Vietnam + Laos + Cambodia)"],
    MANDATE: [R.mandate, "the South Seas Mandate islands' land (tiny: draw MANDATE_POINTS dots too)"],
  };
  let body = "";
  for (const [name, [mp, doc]] of Object.entries(regions)) {
    const o = regionObj(mp, coast);
    body += tsConst(name, o, `${doc}. { d, edge, box }`, ": Region");
    console.log(`  ${name}: d ${(o.d.length / 1024).toFixed(0)} KB, edge ${(o.edge.length / 1024).toFixed(0)} KB`);
  }
  const L = (ll) => {
    const [x, y] = P(ll);
    return [r2(x), r2(y)];
  };
  const mapObj = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, L(v)]));
  body += tsConst("PLACES", mapObj(PAC_PLACES), "places, world px", ": Record<PacPlace, P2>");
  body += tsConst("PLACES_LL", PAC_PLACES, "[lon, lat]", ": Record<PacPlace, LL>");
  body += tsConst("TARGETS", mapObj(TARGETS), "targets of 7/8 Dec 1941, world px", ": Record<Target, P2>");
  body += tsConst("TARGETS_LL", TARGETS, "", ": Record<Target, LL>");
  body += tsConst("ORIGINS", mapObj(ORIGINS), "launch points of the strikes, world px", ": Record<Origin, P2>");
  body += tsConst("ORIGINS_LL", ORIGINS, "", ": Record<Origin, LL>");
  body += tsConst("CONVOY_VIA_LL", CONVOY_VIA, "the Malaya convoy's sea track Samah -> Gulf of Siam (approximate), [lon, lat]; append the landing point", ": LL[]");
  body += tsConst("STRIKES", STRIKES, "strike id -> origin, target (via: follows CONVOY_VIA_LL)", ": { id: Target; from: Origin; to: Target; via?: boolean }[]");
  body += tsConst("MANDATE_POINTS", mapObj(MANDATE_POINTS), "South Seas Mandate islands (Japanese), world px", ": Record<string, P2>");
  // Oahu
  const usa = COUNTRIES.find((c) => c.properties.name === "United States of America");
  let oahu = null;
  for (const rings of usa.geometry.coordinates) {
    const [lon, lat] = rings[0][0];
    if (lon > -158.4 && lon < -157.6 && lat > 21.2 && lat < 21.8) oahu = rings[0];
  }
  const oPts = oahu.map((q) => P(q));
  const oBox = [Math.min(...oPts.map((p) => p[0])), Math.min(...oPts.map((p) => p[1])), Math.max(...oPts.map((p) => p[0])), Math.max(...oPts.map((p) => p[1]))].map(r2);
  body += tsConst("OAHU_BOX", oBox, "Oahu's bbox, world px", ": Box");
  const oahuK = (1080 * 0.6) / (oBox[2] - oBox[0]);
  const fit = (box, frac = 0.92) => {
    const [x0, y0, x1, y1] = box;
    return { x: r2((x0 + x1) / 2), y: r2((y0 + y1) / 2), k: r2(Math.min((1080 * frac) / (x1 - x0), (1920 * frac) / (y1 - y0))) };
  };
  const framings = {
    PACIFIC_WIDE: fit([P([98, 0])[0], P([140, 45])[1], P([-155, 0])[0], P([140, 0])[1]], 0.98),
    OAHU_CLOSE: { x: r2((oBox[0] + oBox[2]) / 2), y: r2((oBox[1] + oBox[3]) / 2), k: r2(oahuK) },
    MALAYA: fit([P([98, 19])[0], P([98, 19])[1], P([112, 0])[0], P([112, 0])[1]], 0.95),
    FORMOSA_LUZON: fit([P([114, 25])[0], P([114, 25])[1], P([128, 12])[0], P([128, 12])[1]], 0.95),
  };
  body += tsConst("FRAMINGS", framings, "suggested cameras { x, y, k }; OAHU_CLOSE: Oahu ~60% of the frame width", ": Record<string, { x: number; y: number; k: number }>");
  console.log(`  framings ${JSON.stringify(framings)}`);
  const header = `// Generated by scripts/maps/sets/pearl/build-pearl-maps.mjs — do not edit by hand.
// THE PACIFIC WORLD of the Pearl Harbor clip (cut F). Natural Earth 10m on a
// north-up Mercator rotated to 160 E (cut meridian 20 W: Hawaii at 158 W lies to
// the right of Wake). World px == screen px at k 1 = 120 deg of longitude (90 E ..
// 150 W) in 1080 px. (150 E, 20 N) = world (540, 960). Static map: <MapBase
// world="pacific"> (deep LOD levels round Oahu reach k ~150).

export type P2 = [number, number];
export type LL = [number, number];
export type Box = [number, number, number, number];
export type Region = { d: string; edge: string; box: Box };
export type PacPlace = ${Object.keys(PAC_PLACES).map((k) => `"${k}"`).join(" | ")};
export type Target = ${Object.keys(TARGETS).map((k) => `"${k}"`).join(" | ")};
export type Origin = ${Object.keys(ORIGINS).map((k) => `"${k}"`).join(" | ")};

export const PROJ = ${JSON.stringify({ kind: "mercator", rotate: W.params.rotate * -1 * -1, scale: W.params.scale, translate: W.params.translate })};
${projectTs(W)}

`;
  writeFileSync("generated/components/sarah-pearl-harbor/pearlPacificMapData.ts", header + body);
  console.log(`Wrote generated/components/sarah-pearl-harbor/pearlPacificMapData.ts (${((header + body).length / 1024).toFixed(0)} KB) in ${Date.now() - t0} ms`);
};

if (!only || only === "asia") buildAsia();
if (!only || only === "pacific") buildPacific();
