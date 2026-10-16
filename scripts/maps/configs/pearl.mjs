// The Pearl Harbor clip's two map worlds (Sarah Paine, "How the Depression
// pushed Japan to Pearl Harbor", Dwarkesh map style), on the shared map tool.
// Replaces the set's earlier copied scripts byte for byte. AllOfChina's cut data (allOfChinaData.ts) stays with its own
// script, scripts/maps/sets/pearl/build-pearl-allofchina.mjs.
//
//   bun scripts/maps/build.mjs scripts/maps/configs/pearl.mjs [asia|pacific]
//   bun scripts/maps/bake.mjs  scripts/maps/configs/pearl.mjs [asia|pacific]
//
// ASIA     north-up Lambert conformal conic, parallels 25/45, centre meridian
//          112 E. World px == screen px at the k 1 "all of China" framing: 65 deg
//          of longitude (79.5..144.5 E at 35 N) span 1080 px. (112 E, 30 N) sits
//          at world (540, 960).
// PACIFIC  north-up Mercator, rotated to 160 E (the cut meridian is 20 W, far
//          off: Hawaii at 158 W lies to the RIGHT of Wake). 120 deg of longitude
//          (90 E..150 W) span 1080 px at k 1. (150 E, 20 N) sits at (540, 960).

import { geoContains } from "d3-geo";
import { catmull, clean, country, countryMP, diff, dist, inter, llBox, llPoly, polysOf, r2, ringArea, thinLine, thinRing, union } from "../lib/geo.mjs";
import { keyUnion, mpBox, ptsBox, ptsD, roundPts, coarse } from "../lib/data.mjs";

// ---------------------------------------------------------------------------
// BORDERS of the period (1931-41), dashed cream in the raster
// ---------------------------------------------------------------------------
const BORDER_PAIRS_ASIA = [
  // USSR - China / Mongolia - China / USSR - Mongolia
  ["Russia", "China"],
  ["Russia", "Mongolia"],
  ["Mongolia", "China"],
  ["Kazakhstan", "China"],
  ["Kyrgyzstan", "China"],
  ["Tajikistan", "China"],
  ["Afghanistan", "China"],
  ["Afghanistan", "Tajikistan"],
  ["Afghanistan", "Uzbekistan"],
  ["Afghanistan", "Turkmenistan"],
  ["Afghanistan", "Pakistan"], // the Durand line (British India)
  ["Afghanistan", "Iran"],
  ["Iran", "Pakistan"],
  ["Iran", "Turkmenistan"],
  // Korea (ONE country) - China / USSR
  ["North Korea", "China"],
  ["North Korea", "Russia"],
  // British India (India + Pakistan + Bangladesh) - its neighbours
  ["Pakistan", "China"],
  ["India", "China"],
  ["Siachen Glacier", "China"],
  ["India", "Nepal"],
  ["India", "Bhutan"],
  ["Nepal", "China"],
  ["Bhutan", "China"],
  ["India", "Myanmar"],
  ["Bangladesh", "Myanmar"],
  // British Burma
  ["Myanmar", "China"],
  ["Myanmar", "Laos"],
  ["Myanmar", "Thailand"],
  // French Indochina (Vietnam + Laos + Cambodia, ONE colony)
  ["Vietnam", "China"],
  ["Laos", "China"],
  ["Laos", "Thailand"],
  ["Cambodia", "Thailand"],
  // British Malaya (Malaysia + Singapore, one)
  ["Thailand", "Malaysia"],
  // Borneo: British Borneo (Sarawak, North Borneo, Brunei) - Dutch Borneo
  ["Malaysia", "Indonesia"],
  ["Malaysia", "Brunei"],
  // colonies on the China coast
  ["Hong Kong", "China"],
  ["Macao", "China"],
];
const BORDER_PAIRS_PACIFIC = [
  ...BORDER_PAIRS_ASIA,
  ["Indonesia", "Papua New Guinea"], // Dutch New Guinea - Australian New Guinea / Papua
  ["Indonesia", "Timor-Leste"], // Portuguese Timor
];
const sakhalin = () => {
  for (const rings of polysOf(country("Russia").geometry)) {
    const b = llBox(rings[0]);
    if (b.x0 > 141 && b.x1 < 145.5 && b.y0 > 45.5 && b.y1 > 54) return rings;
  }
  throw new Error("no Sakhalin");
};
/** the Karafuto line: 50 N across Sakhalin, over land only */
const karafuto = (W) => {
  const lines = [];
  const sk = { type: "Polygon", coordinates: sakhalin() };
  let run = [];
  for (let i = 0; i <= 400; i++) {
    const ll = [141.4 + (3.6 * i) / 400, 50];
    if (geoContains(sk, ll)) run.push(W.proj(ll));
    else if (run.length) {
      if (run.length > 1) lines.push(run);
      run = [];
    }
  }
  if (run.length > 1) lines.push(run);
  return lines;
};

// ---------------------------------------------------------------------------
// REGIONS: the lines that define them (lon, lat)
// ---------------------------------------------------------------------------
// MANCHUKUO 1933 (incl. Jehol): its south-west boundary along the Great Wall and
// the Jehol / Chahar line to the Mongolia border. APPROXIMATE west of 117.5 E.
const WALL_LL = [
  [119.79, 39.97], // Laolongtou: the Wall meets the sea at Shanhaiguan
  [119.75, 40.0], // Shanhaiguan
  [118.3, 40.4],
  [117.15, 40.7], // Gubeikou
  [116.6, 41.2],
  [116.6, 42.1],
  [116.9, 42.6],
  [117.2, 43.3],
  [117.7, 44.2],
  [118.6, 45.1],
  [119.6, 46.4], // meets the Mongolia-China border
];
// China PROPER (south / west of the Wall line); from the Wall's end it follows the
// real Mongolia-China border west, then runs through Mongolia; its east edge runs
// through the Bohai strait (south of the Liaodong tip, north of the Miaodao islands).
const mongoliaWalk = (from) => {
  const ring = polysOf(country("Mongolia").geometry)[0][0];
  const n = ring.length;
  let bi = 0;
  ring.forEach((q, i) => {
    if (Math.hypot(q[0] - from[0], q[1] - from[1]) < Math.hypot(ring[bi][0] - from[0], ring[bi][1] - from[1])) bi = i;
  });
  const ahead = (d) => ring[(bi + 12 * d + n * 12) % n][0];
  const dir = ahead(1) < ahead(-1) ? 1 : -1;
  const out = [];
  for (let i = bi, c = 0; c < n; i = (i + dir + n) % n, c++) {
    out.push(ring[i]);
    if (ring[i][0] < 112) break;
  }
  return out;
};
const proper = (wall) => [
  [119.85, 39.85],
  ...wall,
  ...mongoliaWalk(wall[wall.length - 1]),
  [110, 46.4],
  [100, 47],
  [95, 50],
  [60, 56],
  [60, 8],
  [125, 8],
  [124.5, 37.0],
  [121.8, 38.45],
  [120.9, 38.62],
  [120.2, 39.3],
];
// The Kwantung Leased Territory: the 1898 line across the peninsula at ~39.45 N
const KWANTUNG_NORTH = 39.45;
const KWANTUNG_BOX = [
  [120.6, KWANTUNG_NORTH],
  [122.45, KWANTUNG_NORTH],
  [122.45, 38.4],
  [120.6, 38.4],
];
// FRONT 1938 (Japanese-held China by early 1939, from city capture dates;
// APPROXIMATE): Mongolia -> Baotou -> the Yellow River -> Kaifeng -> the 1938 flood
// course -> Xinyang -> west of Wuhan -> Yueyang -> Nanchang (Mar 1939) -> Hangzhou bay.
const FRONT_LL = [
  [110.0, 44.0], // in Mongolia: the line enters China at the border
  [110.0, 41.4],
  [110.0, 40.6], // Baotou
  [110.6, 40.4],
  [111.2, 40.25], // the river turns south at Togtoh / Hekou
  [111.15, 39.38], // Hequ
  [110.9, 38.5],
  [110.7, 37.5],
  [110.48, 36.6],
  [110.45, 36.15], // Hukou
  [110.6, 35.67], // Yumenkou
  [110.35, 35.0],
  [110.3, 34.6], // Fenglingdu
  [111.2, 34.8], // Sanmenxia
  [112.0, 34.9],
  [112.8, 34.92],
  [113.65, 34.94], // north of Zhengzhou: the river, Zhengzhou south of it stays Chinese
  [114.25, 34.85], // just west of Kaifeng (Kaifeng held, June 1938)
  [115.4, 33.6],
  [114.6, 32.6],
  [114.1, 32.1], // Xinyang
  [113.8, 30.6], // west of Wuhan
  [113.1, 29.4], // Yueyang
  [115.7, 28.7], // Nanchang (Mar 1939), just west of the city
  [117.3, 29.2],
  [118.8, 29.8],
  [120.6, 30.2], // Hangzhou bay
  [121.8, 30.35], // out to sea
];
const occupiedPoly = (frontDense) => [...frontDense, [123.5, 30.6], [127, 34], [136, 44], [128, 56], [110, 56], [110, 44.0]];
// the Canton pocket (Oct 1938); Hong Kong and Macau are their own Natural Earth
// countries, so intersecting with China leaves them out
const CANTON_LL = [
  [112.85, 23.3],
  [113.1, 23.6],
  [113.6, 23.68],
  [114.05, 23.5],
  [114.35, 23.15],
  [114.5, 22.75],
  [114.6, 22.2], // sea (Mirs / Bias bay side)
  [113.9, 21.85], // sea
  [112.95, 21.9], // sea
  [112.8, 22.55],
];
// Tonkin (northern French Indochina, Japanese troops from Sept 1940): Vietnam north of ~20 N
const TONKIN_SOUTH = 20.0;

/** all the regions of a world, as polygon-clipping MultiPolygons in world px */
const regionsOf = (W) => {
  const s = W.regionStep;
  const china = countryMP(W, "China", s);
  const japan = countryMP(W, "Japan", s);
  const korea = union(countryMP(W, "North Korea", s), countryMP(W, "South Korea", s));
  const taiwan = countryMP(W, "Taiwan", s);
  const sk = [sakhalin().map((r) => thinRing(r.map((q) => W.proj(q)), s))];
  const karafutoMP = inter(sk, llPoly(W, [[140.5, 45.4], [145.6, 45.4], [145.6, 50], [140.5, 50]]));
  const kurils = countryMP(W, "Russia", s, (b) => b.x0 >= 145.2 && b.x1 <= 157.5 && b.y1 <= 51.0 && b.y0 >= 43.0);
  const kwantung = inter(china, llPoly(W, KWANTUNG_BOX));
  const japan1931 = union(japan, korea, taiwan, karafutoMP, kurils, kwantung);

  const wallDense = catmull(WALL_LL, 12);
  const manchukuo = clean(diff(china, llPoly(W, proper(wallDense.slice(1)), 0.1), kwantung));

  const frontDense = catmull(FRONT_LL, 14);
  const hainan = countryMP(W, "China", s, (b) => b.x0 > 108.3 && b.x1 < 111.3 && b.y0 > 17.9 && b.y1 < 20.3);
  const occNorth = clean(diff(inter(china, llPoly(W, occupiedPoly(frontDense), 0.1)), manchukuo, kwantung));
  const canton = inter(china, llPoly(W, CANTON_LL));
  const occupied = union(occNorth, canton, hainan);
  const freeChina = clean(diff(china, manchukuo, occupied, kwantung));
  const vietnam = countryMP(W, "Vietnam", s);
  const tonkin = inter(vietnam, llPoly(W, [[100, TONKIN_SOUTH], [110.5, TONKIN_SOUTH], [110.5, 24], [100, 24]]));
  const indochina = union(vietnam, countryMP(W, "Laos", s), countryMP(W, "Cambodia", s));
  const out = { china, japan1931, kwantung, manchukuo, occupied, freeChina, tonkin, indochina, hainan, canton, frontDense, wallDense };
  if (W.name === "pacific") {
    const mandate = union(
      countryMP(W, "Palau", 0.02),
      countryMP(W, "Micronesia", 0.02),
      countryMP(W, "Marshall Is.", 0.02),
      countryMP(W, "N. Mariana Is.", 0.02),
    );
    out.mandate = mandate;
    out.japan1941 = union(japan1931, manchukuo, occupied, indochina, mandate);
  }
  return out;
};

// ---------------------------------------------------------------------------
// ASIA overlays (places as [lon, lat])
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
// aid routes into Nationalist China (stations, [name, lon, lat])
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

// China's outlines (mainland ring from the Yalu mouth + Hainan), shared by three exports
const outlines = (c) => {
  if (c.memo.outlines) return c.memo.outlines;
  const byArea = (mp) => mp.slice().sort((a, b) => Math.abs(ringArea(b[0])) - Math.abs(ringArea(a[0])));
  const mainRing = thinRing(byArea(c.R.china)[0][0], 0.3);
  const hainanRing = thinRing(byArea(c.R.hainan)[0][0], 0.3);
  // start the outline pen at the Yalu mouth (the point nearest Korea's border on the coast)
  const yalu = c.P([124.35, 39.85]);
  let si = 0;
  mainRing.forEach((q, i) => {
    if (dist(q, yalu) < dist(mainRing[si], yalu)) si = i;
  });
  const main = [...mainRing.slice(si), ...mainRing.slice(0, si)];
  if (ringArea(main) < 0) main.reverse();
  return (c.memo.outlines = { main, hainanRing, mainClosed: [...main, main[0]] });
};
// the front: the smoothed lon/lat line, kept where it is over China
const front = (c) => {
  const china = country("China");
  const fr = c.R.frontDense;
  const onCh = fr.map((ll) => geoContains(china, ll));
  const a = onCh.indexOf(true);
  const b = onCh.lastIndexOf(true);
  return thinLine(fr.slice(a, b + 1).map((q) => c.P(q)), 0.3);
};

const ASIA_REGION_DOC = ". { d: fill (land-clipped), edge: inland boundary runs, box: [x0, y0, x1, y1] }";
const asiaData = {
  file: "pearlAsiaMapData.ts",
  comment: `THE ASIA WORLD of the Pearl Harbor clip (cuts B-E). Natural Earth 10m on a
north-up Lambert conformal conic, parallels 25/45, centre meridian 112 E.
World px == screen px at k 1, the "all of China" scale (65 deg of longitude in
1080 px). (112 E, 30 N) = world (540, 960). The static map is the raster LOD
pyramid (pearlLevels.ts, <MapBase world="asia">); everything here is overlay.
Regions are land-clipped fills + their inland edges (dashed orange in <Hatch>).
APPROXIMATE: Manchukuo's west boundary (Jehol / Hsingan vs Chahar), the 1938-39
front, the Canton pocket, Tonkin's south line (${TONKIN_SOUTH} N).`,
  types: ["P2", "LL", "Box", "Region", "RouteData", keyUnion("AsiaPlace", ASIA_PLACES), keyUnion("Faction", FACTIONS)],
  exports: [
    { name: "JAPAN_1931", region: "japan1931", doc: `Japan's empire in 1931: the home islands (incl. Ryukyu, Kurils), Korea, Taiwan, Karafuto (Sakhalin S of 50 N), the Kwantung Leased Territory${ASIA_REGION_DOC}` },
    { name: "KWANTUNG", region: "kwantung", doc: `the Kwantung Leased Territory (Port Arthur, Dairen), south of ${KWANTUNG_NORTH} N on the Liaodong tip (also inside JAPAN_1931)${ASIA_REGION_DOC}` },
    { name: "MANCHUKUO", region: "manchukuo", doc: `Manchukuo, 1933 extent incl. Jehol (minus Kwantung). West boundary APPROXIMATE${ASIA_REGION_DOC}` },
    { name: "OCCUPIED_1938", region: "occupied", doc: `Japanese-held China by early 1939 (east of FRONT_1938) + the Canton pocket + Hainan. APPROXIMATE${ASIA_REGION_DOC}` },
    { name: "FREE_CHINA", region: "freeChina", doc: `the unoccupied interior, 1938-40: China minus Manchukuo, Kwantung and OCCUPIED_1938${ASIA_REGION_DOC}` },
    { name: "INDOCHINA_NORTH", region: "tonkin", doc: `Tonkin: Vietnam north of ${TONKIN_SOUTH} N (Japanese troops from Sept 1940)${ASIA_REGION_DOC}` },
    { name: "HAINAN", region: "hainan", doc: `Hainan (Feb 1939; inside OCCUPIED_1938)${ASIA_REGION_DOC}` },
    { name: "CANTON", region: "canton", doc: `the Canton pocket, Oct 1938 (inside OCCUPIED_1938; Hong Kong and Macau excluded)${ASIA_REGION_DOC}` },
    {
      name: "CHINA_ALL",
      doc: "all of China (mainland outline + Hainan, no Taiwan): the outline for the dashed 'plan'",
      type: ": { d: string; box: Box }",
      value: (c) => ({ d: `${ptsD(outlines(c).main, true)}${ptsD(outlines(c).hainanRing, true)}`, box: mpBox(c.R.china) }),
    },
    { name: "CHINA_OUTLINE_PTS", doc: "the mainland outline as a CLOSED polyline starting at the Yalu mouth, for a pen draw-on (Hainan separate)", type: ": P2[]", value: (c) => roundPts(outlines(c).mainClosed) },
    { name: "HAINAN_OUTLINE_PTS", type: ": P2[]", value: (c) => roundPts([...outlines(c).hainanRing, outlines(c).hainanRing[0]]) },
    { name: "FRONT_1938_PTS", doc: "the stalled front of 1938-39, N (Mongolia border, 110 E) -> S (Hangzhou bay), world px; OCCUPIED_1938 is EAST of it", type: ": P2[]", value: (c) => roundPts(front(c)) },
    { name: "FRONT_1938_D", value: (c) => ptsD(front(c)) },
    { name: "FRONT_1938_LL", doc: "its vertices (lon, lat; first and last run into Mongolia / the sea)", type: ": LL[]", value: FRONT_LL },
    { name: "WALL_LL", doc: "Manchukuo's south-west boundary vertices (lon, lat), Shanhaiguan -> the Mongolia border", type: ": LL[]", value: WALL_LL },
    // coarse polygons for dot fields
    { name: "CHINA_POLY", doc: "all of China, coarse rings (world px) for in-polygon tests", type: ": P2[][][]", value: (c) => coarse(c.R.china, 1.2, 40) },
    { name: "FREE_CHINA_POLY", type: ": P2[][][]", value: (c) => coarse(c.R.freeChina, 1.2, 40) },
    { name: "MANCHUKUO_POLY", type: ": P2[][][]", value: (c) => coarse(c.R.manchukuo, 1.0, 20) },
    { name: "OCCUPIED_POLY", type: ": P2[][][]", value: (c) => coarse(c.R.occupied, 1.0, 20) },
    { name: "BURMA_RAIL", route: BURMA_RAIL, doc: "Rangoon -> Mandalay -> Lashio, the railway leg (chequered symbol)" },
    { name: "BURMA_ROAD", route: BURMA_ROAD, doc: "Lashio -> Wanting -> Baoshan -> Xiaguan -> Kunming -> Guiyang -> Chongqing, the road" },
    {
      name: "BURMA_ROUTE",
      route: [...BURMA_RAIL, ...BURMA_ROAD.slice(1)],
      doc: "the whole Burma lifeline Rangoon -> Chongqing in one polyline (for packets); BURMA_ROUTE.stations.lashio is where the road starts",
    },
    { name: "YUNNAN_RAILWAY", route: YUNNAN_RAILWAY, doc: "Haiphong -> Hanoi -> Lao Cai -> Kaiyuan -> Kunming (French Yunnan railway)" },
    { name: "PLACES", places: ASIA_PLACES, doc: "places, world px", type: ": Record<AsiaPlace, P2>" },
    { name: "PLACES_LL", value: ASIA_PLACES, doc: "the same, [lon, lat]", type: ": Record<AsiaPlace, LL>" },
    { name: "FACTIONS", places: FACTIONS, doc: "faction seats 1936-37 (approximate centres), world px", type: ": Record<Faction, P2>" },
    { name: "FACTIONS_LL", value: FACTIONS, type: ": Record<Faction, LL>" },
    { name: "RESOURCES", places: RESOURCES, doc: "B's Manchurian resources: Fushun coal, Anshan iron/steel, soybeans of the central plain", type: ': Record<"coal" | "iron" | "soybeans", P2>' },
    {
      // suggested framings (camera: world (x, y) on the frame centre at zoom k)
      name: "FRAMINGS",
      doc: "suggested cameras { x, y, k } (world point on the frame centre); cuts tune their own",
      type: ": Record<string, { x: number; y: number; k: number }>",
      value: (c) => ({
        CHINA_WIDE: c.fit(mpBox(c.R.china), 0.98),
        EAST_ASIA: c.fitLL({ lon: [98, 142], lat: [18, 50] }, 1),
        MANCHURIA_CLOSE: c.fit(mpBox(c.R.manchukuo), 0.95),
        SOUTH_MANCHURIA: c.fitLL({ lon: [120.5, 126.5], lat: [38.3, 43.6] }, 0.95),
        SOUTHWEST: c.fit(ptsBox(c.out.BURMA_ROUTE.pts, c.out.YUNNAN_RAILWAY.pts), 0.9),
      }),
    },
  ],
};

// ---------------------------------------------------------------------------
// PACIFIC overlays
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
const oahuBox = (c) => {
  let oahu = null;
  for (const rings of country("United States of America").geometry.coordinates) {
    const [lon, lat] = rings[0][0];
    if (lon > -158.4 && lon < -157.6 && lat > 21.2 && lat < 21.8) oahu = rings[0];
  }
  const oPts = oahu.map((q) => c.P(q));
  return ptsBox(oPts).map(r2);
};

const pacificData = {
  file: "pearlPacificMapData.ts",
  comment: `THE PACIFIC WORLD of the Pearl Harbor clip (cut F). Natural Earth 10m on a
north-up Mercator rotated to 160 E (cut meridian 20 W: Hawaii at 158 W lies to
the right of Wake). World px == screen px at k 1 = 120 deg of longitude (90 E ..
150 W) in 1080 px. (150 E, 20 N) = world (540, 960). Static map: <MapBase
world="pacific"> (deep LOD levels round Oahu reach k ~150).`,
  types: ["P2", "LL", "Box", "Region", keyUnion("PacPlace", PAC_PLACES), keyUnion("Target", TARGETS), keyUnion("Origin", ORIGINS)],
  exports: [
    {
      name: "JAPAN_1941",
      region: "japan1941",
      doc: "everything Japan held on 7 Dec 1941: the empire of 1931, Manchukuo, occupied China + Hainan, French Indochina (troops throughout since July 1941), the South Seas Mandate. { d, edge, box }",
    },
    { name: "EMPIRE_1931", region: "japan1931", doc: "the home islands (incl. Kurils, Ryukyu), Korea, Taiwan, Karafuto, Kwantung. { d, edge, box }" },
    { name: "MANCHUKUO", region: "manchukuo", doc: "Manchukuo (approximate west boundary). { d, edge, box }" },
    { name: "OCCUPIED_CHINA", region: "occupied", doc: "occupied China by early 1939 + Canton + Hainan (approximate; no Yichang salient). { d, edge, box }" },
    { name: "INDOCHINA", region: "indochina", doc: "French Indochina (Vietnam + Laos + Cambodia). { d, edge, box }" },
    { name: "MANDATE", region: "mandate", doc: "the South Seas Mandate islands' land (tiny: draw MANDATE_POINTS dots too). { d, edge, box }" },
    { name: "PLACES", places: PAC_PLACES, doc: "places, world px", type: ": Record<PacPlace, P2>" },
    { name: "PLACES_LL", value: PAC_PLACES, doc: "[lon, lat]", type: ": Record<PacPlace, LL>" },
    { name: "TARGETS", places: TARGETS, doc: "targets of 7/8 Dec 1941, world px", type: ": Record<Target, P2>" },
    { name: "TARGETS_LL", value: TARGETS, type: ": Record<Target, LL>" },
    { name: "ORIGINS", places: ORIGINS, doc: "launch points of the strikes, world px", type: ": Record<Origin, P2>" },
    { name: "ORIGINS_LL", value: ORIGINS, type: ": Record<Origin, LL>" },
    { name: "CONVOY_VIA_LL", value: CONVOY_VIA, doc: "the Malaya convoy's sea track Samah -> Gulf of Siam (approximate), [lon, lat]; append the landing point", type: ": LL[]" },
    { name: "STRIKES", value: STRIKES, doc: "strike id -> origin, target (via: follows CONVOY_VIA_LL)", type: ": { id: Target; from: Origin; to: Target; via?: boolean }[]" },
    { name: "MANDATE_POINTS", places: MANDATE_POINTS, doc: "South Seas Mandate islands (Japanese), world px", type: ": Record<string, P2>" },
    { name: "OAHU_BOX", value: oahuBox, doc: "Oahu's bbox, world px", type: ": Box" },
    {
      name: "FRAMINGS",
      doc: "suggested cameras { x, y, k }; OAHU_CLOSE: Oahu ~60% of the frame width",
      type: ": Record<string, { x: number; y: number; k: number }>",
      value: (c) => {
        const P = c.P;
        const o = c.out.OAHU_BOX;
        return {
          PACIFIC_WIDE: c.fit([P([98, 0])[0], P([140, 45])[1], P([-155, 0])[0], P([140, 0])[1]], 0.98),
          OAHU_CLOSE: { x: r2((o[0] + o[2]) / 2), y: r2((o[1] + o[3]) / 2), k: r2((1080 * 0.6) / (o[2] - o[0])) },
          MALAYA: c.fit([P([98, 19])[0], P([98, 19])[1], P([112, 0])[0], P([112, 0])[1]], 0.95),
          FORMOSA_LUZON: c.fit([P([114, 25])[0], P([114, 25])[1], P([128, 12])[0], P([128, 12])[1]], 0.95),
        };
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// THE CONFIG
// ---------------------------------------------------------------------------
const OAHU = [-157.98, 21.47];
// deep levels round Oahu: any view at that level's zoom with the camera centre up
// to ~2 views west of Oahu (the pull-back runs west)
const deep = (k) => ({ around: OAHU, k, views: [2.6, 1.4, 1.3, 1.3] });

export default {
  name: "pearl",
  dataDir: "generated/components/sarah-pearl-harbor",
  tileDir: "public/pearl",
  textures: "public/manchuria",
  worlds: {
    asia: {
      projection: { kind: "lcc", parallels: [25, 45], rotate: -112, scale: { span: [[79.5, 35], [144.5, 35]], px: 1080 }, anchor: [[112, 30], [540, 960]] },
      clip: { lon: [25, 200], lat: [-48, 78] }, // geometry is clipped to this (wider than any level)
      regionStep: 0.2, // world px between kept vertices of the region rings
      landStep: 0.07,
      graticule: 5,
      borders: { pairs: BORDER_PAIRS_ASIA, extra: karafuto },
      regions: regionsOf,
      data: asiaData,
      // generous boxes: a camera inside a level's band must find the level all round its view (no seam)
      levels: [
        { name: "a0", s: 0.7, kBake: 0.55, band: null, rects: [{ lon: [62, 168], lat: [-8, 64] }] },
        { name: "a1", s: 1.3, kBake: 1.0, band: [0.62, 0.74], rects: [{ lon: [62, 168], lat: [-8, 64] }] },
        { name: "a2", s: 2.3, kBake: 1.7, band: [1.12, 1.32], rects: [{ lon: [62, 168], lat: [-8, 64] }] },
        { name: "a3", s: 4.0, kBake: 2.9, band: [1.95, 2.3], rects: [{ lon: [74, 166], lat: [-6, 64] }] },
        { name: "a4", s: 6.8, kBake: 4.9, band: [3.4, 4.0], rects: [{ lon: [100, 156], lat: [19, 62] }, { lon: [86, 116], lat: [6, 36] }] },
        { name: "a5", s: 11, kBake: 8, band: [5.8, 6.8], rects: [{ lon: [111, 138], lat: [32, 54] }, { lon: [94, 113], lat: [14, 32] }] },
      ],
    },
    pacific: {
      projection: {
        kind: "mercator",
        rotate: -160,
        scale: 1080 / ((120 * Math.PI) / 180),
        anchor: [[150, 20], [540, 960]],
        tsDoc: "lon, lat (deg) -> world px [x, y] (north-up Mercator rotated to 160 E, = the baked map).\n *  Any longitude convention works: -158 and 202 are the same place (right of Wake).",
      },
      lon360: true,
      clip: { lon: [55, 245], lat: [-56, 77] },
      regionStep: 0.12,
      landStep: 0.05,
      graticule: 10,
      deep: [{ lon: [-161, -154], lat: [18, 23], step: 0.0015 }], // Hawaii keeps every 10m vertex
      borders: { pairs: BORDER_PAIRS_PACIFIC, extra: karafuto },
      regions: regionsOf,
      data: pacificData,
      levels: [
        { name: "p0", s: 0.75, kBake: 0.6, band: null, rects: [{ lon: [78, 222], lat: [-50, 74] }] }, // a portrait frame at k ~1 sees ~50 S .. ~72 N
        { name: "p1", s: 1.4, kBake: 1.05, band: [0.66, 0.8], rects: [{ lon: [78, 222], lat: [-50, 74] }] },
        { name: "p2", s: 2.6, kBake: 1.9, band: [1.25, 1.5], rects: [{ lon: [78, 222], lat: [-50, 74] }] },
        { name: "p3", s: 4.8, kBake: 3.5, band: [2.3, 2.7], rects: [{ lon: [80, 220], lat: [-35, 66] }] },
        { name: "p4", s: 9, kBake: 6.5, band: [4.2, 5.0], rects: [{ lon: [86, 214], lat: [-16, 54] }] },
        // p5 also covers the other strikes' close-ups (k up to ~17)
        {
          name: "p5",
          s: 17,
          kBake: 12,
          band: [8, 9.5],
          rects: [
            deep(8),
            { lon: [97, 113], lat: [-2, 20] }, // Malaya, the Gulf of Siam, Saigon, Hainan
            { lon: [113, 126], lat: [11, 26] }, // Formosa - Luzon (and Hong Kong)
            { lon: [119, 124], lat: [29, 33] }, // Shanghai
            { lon: [142, 148], lat: [11.5, 17] }, // Saipan - Guam
            { lon: [163, 170], lat: [7, 21] }, // Kwajalein / Roi - Wake
          ],
        },
        { name: "p6", s: 32, kBake: 23, band: [15, 18], rects: [deep(15)] },
        { name: "p7", s: 60, kBake: 43, band: [28, 33], rects: [deep(28)] },
        { name: "p8", s: 112, kBake: 82, band: [52, 62], rects: [deep(52)] },
        { name: "p9", s: 170, kBake: 130, band: [100, 118], rects: [deep(100)] },
      ],
    },
  },
};
