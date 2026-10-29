// The sarah-insurgency clip's CHINA world (Sarah Paine on Dwarkesh, "The insurgency strategy America invented";
// the one-off "Dwarkesh 3D map" look: this map is laid as the FLOOR of a 3D air world by the clip's WebGL ground,
// generated/components/sarah-insurgency/insurgencyGround.tsx). North and East China, Korea and the Japanese home
// islands, 1939.
//
//   bun scripts/maps/build.mjs scripts/maps/configs/insurgency-china.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/insurgency-china.mjs      (alone: nothing else heavy running)
//
// CHINA  north-up Lambert conformal conic, parallels 28 / 42 N, centre meridian 116 E. 1 world px ~ 1 km: 10 deg of
//        longitude at 35 N (110..120 E) span 912 world px. (116 E, 36 N) on the North China plain sits at world (0, 0).
//        The 3D ground: X = world x (east), Y = height (up), Z = world y (south); a camera that looks "north" at a
//        point yaws to the local meridian (insurgencyCamera.northYaw).
// PERIOD BORDERS (1939, dashed cream): China / Manchukuo along the Great Wall line (Shanhaiguan -> Gubeikou -> the
//        Jehol-Chahar line to the Mongolia border; APPROXIMATE west of 117.5 E, the same line as pearl's WALL_LL);
//        USSR / Mongolia / China / Manchukuo; Korea (ONE country, a Japanese colony) / China-Manchukuo / USSR;
//        China / French Indochina, Hong Kong, Macau at the southern edge. No line between the two Koreas, no
//        modern provincial lines.
// PERIOD WATER: Dongting and Poyang lakes, HAND-TRACED and APPROXIMATE (no lake data for China is installed; their
//        1930s extents were larger than today's, drawn generously). Rivers are not baked: the Yangtze and the
//        Yellow River (its 1938-47 flood course) are approximate overlay routes in the data module.
// REGIONS (data only, the cuts decide what to draw): OCCUPIED_1939 = Japanese-held China by early 1939 (east of
//        FRONT_1938 + the Canton pocket + Hainan; front from city capture dates, APPROXIMATE, copied from
//        scripts/maps/configs/pearl.mjs), MANCHUKUO (1933 incl. Jehol, minus Kwantung), FREE_CHINA, KOREA,
//        JAPAN_HOME, the guerrilla BASE_AREAS as soft ellipses (centre, radii, rotation; APPROXIMATE extents after
//        the usual maps of the base areas c. 1940). RAILWAYS: city-to-city courses through the stations named,
//        APPROXIMATE (smoothed between stations).
import { geoContains } from "d3-geo";
import { catmull, clean, country, countryMP, diff, inter, llPoly, polysOf, thinLine, union } from "../lib/geo.mjs";
import { keyUnion, roundPts, ptsD, coarse } from "../lib/data.mjs";

// ---------------------------------------------------------------------------
// the lines that define the 1939 regions (lon, lat), copied from configs/pearl.mjs
// ---------------------------------------------------------------------------
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
const KWANTUNG_BOX = [
  [120.6, 39.45],
  [122.45, 39.45],
  [122.45, 38.4],
  [120.6, 38.4],
];
// FRONT 1938 (Japanese-held China by early 1939, from city capture dates; APPROXIMATE)
const FRONT_LL = [
  [110.0, 44.0],
  [110.0, 41.4],
  [110.0, 40.6], // Baotou
  [110.6, 40.4],
  [111.2, 40.25],
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
  [113.65, 34.94], // north of Zhengzhou (Zhengzhou stays Chinese)
  [114.25, 34.85], // just west of Kaifeng (held, June 1938)
  [115.4, 33.6],
  [114.6, 32.6],
  [114.1, 32.1], // Xinyang
  [113.8, 30.6], // west of Wuhan
  [113.1, 29.4], // Yueyang
  [115.7, 28.7], // Nanchang (Mar 1939)
  [117.3, 29.2],
  [118.8, 29.8],
  [120.6, 30.2], // Hangzhou bay
  [121.8, 30.35],
];
const occupiedPoly = (frontDense) => [...frontDense, [123.5, 30.6], [127, 34], [136, 44], [128, 56], [110, 56], [110, 44.0]];
const CANTON_LL = [
  [112.85, 23.3],
  [113.1, 23.6],
  [113.6, 23.68],
  [114.05, 23.5],
  [114.35, 23.15],
  [114.5, 22.75],
  [114.6, 22.2],
  [113.9, 21.85],
  [112.95, 21.9],
  [112.8, 22.55],
];

// period water, hand-traced (APPROXIMATE, generous 1930s extents)
const DONGTING_LL = [
  [111.95, 29.05],
  [112.2, 29.38],
  [112.55, 29.47],
  [112.85, 29.5],
  [113.05, 29.44],
  [113.12, 29.3],
  [113.0, 29.12],
  [112.95, 28.95],
  [112.82, 28.82],
  [112.55, 28.76],
  [112.3, 28.82],
  [112.05, 28.9],
];
const POYANG_LL = [
  [116.0, 29.72],
  [116.2, 29.55],
  [116.32, 29.32],
  [116.55, 29.15],
  [116.72, 28.95],
  [116.7, 28.72],
  [116.45, 28.6],
  [116.2, 28.68],
  [116.12, 28.9],
  [116.05, 29.15],
  [115.98, 29.45],
];

// ---------------------------------------------------------------------------
// places (lon, lat)
// ---------------------------------------------------------------------------
const PLACES = {
  changsha: [112.94, 28.23],
  yueyang: [113.13, 29.36],
  wuhan: [114.31, 30.59],
  beiping: [116.4, 39.9],
  tianjin: [117.2, 39.13],
  jinan: [117.0, 36.65],
  xuzhou: [117.18, 34.26],
  nanjing: [118.78, 32.06],
  shanghai: [121.47, 31.23],
  taiyuan: [112.55, 37.87],
  shijiazhuang: [114.51, 38.04],
  qingdao: [120.38, 36.07],
  kaifeng: [114.31, 34.8],
  zhengzhou: [113.65, 34.75],
  tokyo: [139.69, 35.68],
  // extra stations and anchors the cuts may want
  baoding: [115.46, 38.87],
  xinxiang: [113.93, 35.3],
  pukou: [118.62, 32.08],
  hangzhou: [120.16, 30.27],
  shanhaiguan: [119.75, 40.0],
  yanan: [109.49, 36.59],
  nanchang: [115.89, 28.68],
  seoul: [126.98, 37.57],
};
// label anchors (lon, lat): where a GroundLabel for a country sits
const LABEL_AT = {
  japan: [138.4, 36.3], // over central Honshu
  china: [112.0, 32.5],
  korea: [127.6, 38.6],
  manchukuo: [125.0, 44.5],
  northChina: [115.4, 37.6],
};

// railways (stations [name, lon, lat]); APPROXIMATE city-to-city courses
const RAIL = {
  // Beiping-Hankou: Japanese-held north of the Yellow River (to Xinxiang); the rest Chinese (data for the cuts)
  pinghan: [
    ["beiping", 116.4, 39.9],
    ["baoding", 115.46, 38.87],
    ["shijiazhuang", 114.51, 38.04],
    ["xingtai", 114.5, 37.07],
    ["handan", 114.49, 36.61],
    ["anyang", 114.39, 36.1],
    ["xinxiang", 113.93, 35.3],
    ["zhengzhou", 113.65, 34.75],
    ["xuchang", 113.85, 34.03],
    ["zhumadian", 114.02, 32.98],
    ["xinyang", 114.07, 32.12],
    ["hankou", 114.28, 30.58],
  ],
  // Tianjin-Pukou via Jinan and Xuzhou
  jinpu: [
    ["tianjin", 117.2, 39.13],
    ["cangzhou", 116.84, 38.3],
    ["dezhou", 116.36, 37.44],
    ["jinan", 117.0, 36.65],
    ["taian", 117.09, 36.19],
    ["yanzhou", 116.83, 35.55],
    ["xuzhou", 117.18, 34.26],
    ["bengbu", 117.39, 32.92],
    ["pukou", 118.62, 32.08],
  ],
  // Shijiazhuang-Taiyuan (Zhengtai)
  zhengtai: [
    ["shijiazhuang", 114.51, 38.04],
    ["niangziguan", 113.88, 37.98],
    ["yangquan", 113.58, 37.86],
    ["taiyuan", 112.55, 37.87],
  ],
  // Jinan-Qingdao (Jiaoji)
  jiaoji: [
    ["jinan", 117.0, 36.65],
    ["zibo", 117.87, 36.8],
    ["weifang", 119.1, 36.71],
    ["gaomi", 119.75, 36.38],
    ["jiaozhou", 120.03, 36.28],
    ["qingdao", 120.38, 36.07],
  ],
  // Longhai east of Kaifeng (held) to the sea; the Zhengzhou-Kaifeng stretch is data (Chinese side of the front)
  longhai: [
    ["zhengzhou", 113.65, 34.75],
    ["kaifeng", 114.31, 34.8],
    ["shangqiu", 115.65, 34.41],
    ["dangshan", 116.35, 34.42],
    ["xuzhou", 117.18, 34.26],
    ["xinpu", 119.22, 34.6],
  ],
  // Shanghai-Nanjing
  huning: [
    ["shanghai", 121.47, 31.23],
    ["suzhou", 120.62, 31.3],
    ["wuxi", 120.3, 31.57],
    ["changzhou", 119.95, 31.78],
    ["zhenjiang", 119.45, 32.2],
    ["nanjing", 118.78, 32.06],
  ],
  // Shanghai-Hangzhou
  huhang: [
    ["shanghai", 121.47, 31.23],
    ["songjiang", 121.23, 31.03],
    ["jiaxing", 120.75, 30.75],
    ["hangzhou", 120.16, 30.27],
  ],
  // Beiping-Shanhaiguan (Beining) via Tianjin
  beining: [
    ["beiping", 116.4, 39.9],
    ["tianjin", 117.2, 39.13],
    ["tangshan", 118.18, 39.63],
    ["shanhaiguan", 119.75, 40.0],
  ],
  // Wuchang-Changsha (the Canton-Hankou line's northern section): the Changsha front, Japan's base at Yueyang
  yuehan: [
    ["wuchang", 114.31, 30.55],
    ["xianning", 114.32, 29.84],
    ["puqi", 113.88, 29.72],
    ["yueyang", 113.13, 29.36],
    ["miluo", 113.08, 28.8],
    ["changsha", 112.94, 28.23],
  ],
};
// rivers (APPROXIMATE overlay courses, no river data installed)
const RIVERS = {
  // the Yangtze from Yichang to the sea
  yangtze: [
    ["yichang", 111.29, 30.69],
    ["shashi", 112.25, 30.3],
    ["jianli", 112.9, 29.83],
    ["chenglingji", 113.15, 29.47],
    ["wuhan", 114.3, 30.58],
    ["huangshi", 115.05, 30.2],
    ["jiujiang", 116.0, 29.73],
    ["anqing", 117.05, 30.5],
    ["wuhu", 118.37, 31.33],
    ["nanjing", 118.75, 32.08],
    ["zhenjiang", 119.45, 32.25],
    ["jiangyin", 120.27, 31.95],
    ["mouth", 121.75, 31.4],
  ],
  // the Yellow River, Hekou -> down the Shanxi-Shaanxi border -> Tongguan -> Huayuankou, then the 1938-47 flood
  // course south-east to the Huai and Hongze lake (the dikes were cut at Huayuankou, June 1938)
  yellow: [
    ["hekou", 111.15, 40.25],
    ["hequ", 111.15, 39.38],
    ["wubao", 110.7, 37.45],
    ["hukou", 110.45, 36.15],
    ["yumenkou", 110.6, 35.67],
    ["tongguan", 110.3, 34.6],
    ["sanmenxia", 111.2, 34.8],
    ["mengjin", 112.45, 34.85],
    ["huayuankou", 113.68, 34.92],
    ["zhongmou", 114.0, 34.6],
    ["weishi", 114.2, 34.4],
    ["huaiyang", 114.9, 33.73],
    ["zhengyangguan", 116.5, 32.55],
    ["huainan", 117.0, 32.65],
    ["bengbu", 117.4, 32.95],
    ["hongze", 118.6, 33.3],
  ],
};
// guerrilla base areas behind the lines, c. 1939-40: soft ellipses (centre lon/lat, radii km, rotation deg cw)
const BASES = {
  jinchaji: { name: "Jin-Cha-Ji (Wutai / Taihang, Shanxi-Hebei)", at: [114.4, 39.0], r: [150, 105], rot: -35 },
  jizhong: { name: "Jizhong (central Hebei plain)", at: [115.9, 38.45], r: [95, 70], rot: 0 },
  shandong: { name: "Shandong (Yimeng mountains)", at: [118.1, 35.75], r: [90, 60], rot: -15 },
  jinjiluyu: { name: "Jin-Ji-Lu-Yu (southern Taihang)", at: [113.55, 36.55], r: [120, 75], rot: -60 },
  n4aJiangsu: { name: "New Fourth Army, central Jiangsu", at: [119.95, 33.0], r: [85, 60], rot: -30 },
  n4aAnhui: { name: "New Fourth Army, central Anhui", at: [117.8, 31.7], r: [80, 55], rot: -20 },
};

// ---------------------------------------------------------------------------
// regions
// ---------------------------------------------------------------------------
const regionsOf = (W) => {
  const s = W.regionStep;
  const china = countryMP(W, "China", s);
  const japan = countryMP(W, "Japan", s);
  const korea = union(countryMP(W, "North Korea", s), countryMP(W, "South Korea", s));
  const kwantung = inter(china, llPoly(W, KWANTUNG_BOX));
  const wallDense = catmull(WALL_LL, 12);
  const manchukuo = clean(diff(china, llPoly(W, proper(wallDense.slice(1)), 0.1), kwantung));
  const frontDense = catmull(FRONT_LL, 14);
  const hainan = countryMP(W, "China", s, (b) => b.x0 > 108.3 && b.x1 < 111.3 && b.y0 > 17.9 && b.y1 < 20.3);
  const occNorth = clean(diff(inter(china, llPoly(W, occupiedPoly(frontDense), 0.1)), manchukuo, kwantung));
  const canton = inter(china, llPoly(W, CANTON_LL));
  const occupied = union(occNorth, canton, hainan);
  const freeChina = clean(diff(china, manchukuo, occupied, kwantung));
  // the home islands (no Kurils, no Ryukyu south of 30 N: the cuts' "Japan")
  const japanHome = countryMP(W, "Japan", s, (b) => b.y1 > 30.5);
  return { china, japan, japanHome, korea, kwantung, manchukuo, occupied, freeChina, canton, hainan, frontDense, wallDense };
};
const front = (c) => {
  const ch = country("China");
  const fr = c.R.frontDense;
  const on = fr.map((ll) => geoContains(ch, ll));
  const a = on.indexOf(true);
  const b = on.lastIndexOf(true);
  return thinLine(fr.slice(a, b + 1).map((q) => c.P(q)), 0.5);
};
const wallLine = (W) => thinLine(catmull(WALL_LL, 12).map((q) => W.proj(q)), 0.3);
const ellipseOf = (W, e) => {
  const [cx, cy] = W.proj(e.at);
  // km -> world px at the centre (local scale from a 0.1 deg step east)
  const [ex] = W.proj([e.at[0] + 0.1, e.at[1]]);
  const kmPerDeg = 111.32 * Math.cos((e.at[1] * Math.PI) / 180);
  const s = (ex - cx) / (0.1 * kmPerDeg);
  return { name: e.name, c: [Math.round(cx * 100) / 100, Math.round(cy * 100) / 100], r: [Math.round(e.r[0] * s * 10) / 10, Math.round(e.r[1] * s * 10) / 10], rot: e.rot };
};

const R_DOC = ". { d: fill (land-clipped), edge: inland boundary runs, box: [x0, y0, x1, y1] }";
export default {
  name: "insChina",
  dataDir: "generated/components/sarah-insurgency",
  tileDir: "public/sarah-insurgency",
  textures: "public/manchuria",
  worlds: {
    china: {
      projection: { kind: "lcc", parallels: [28, 42], rotate: -116, scale: { span: [[110, 35], [120, 35]], px: 912 }, anchor: [[116, 36], [0, 0]] },
      clip: { lon: [78, 172], lat: [2, 66] },
      landStep: 0.3,
      regionStep: 1.0,
      graticule: 5,
      lakes: [DONGTING_LL, POYANG_LL],
      borders: {
        pairs: [
          ["Russia", "China"],
          ["Russia", "Mongolia"],
          ["Mongolia", "China"],
          ["Kazakhstan", "China"],
          ["North Korea", "China"],
          ["North Korea", "Russia"],
          ["Vietnam", "China"],
          ["Laos", "China"],
          ["Myanmar", "China"],
          ["Hong Kong", "China"],
          ["Macao", "China"],
        ],
        extra: (W) => [wallLine(W)],
      },
      regions: regionsOf,
      data: {
        file: "insChinaMapData.ts",
        comment: `THE CHINA WORLD of sarah-insurgency (1939). Natural Earth 10m on a north-up Lambert conformal conic,
parallels 28/42 N, centre meridian 116 E; 1 world px ~ 1 km (110..120 E at 35 N = 912 px); (116 E, 36 N) = (0, 0).
The static map is the raster LOD pyramid (insChinaLevels.ts), laid as the 3D floor by insurgencyGround.tsx;
everything here is overlay data. 3D: X = world x, Z = world y (south +), Y up.
APPROXIMATE: Manchukuo's west line, FRONT_1938, the Canton pocket, the railways' courses (smoothed city to city),
the rivers, the hand-traced Dongting and Poyang lakes, the base areas' extents.`,
        types: ["P2", "LL", "Box", "Region", "RouteData", keyUnion("ChinaPlace", PLACES), keyUnion("ChinaRail", RAIL), keyUnion("ChinaBase", BASES), "export type SoftRegion = { name: string; c: P2; r: P2; rot: number };"],
        exports: [
          { name: "OCCUPIED_1939", region: "occupied", doc: `Japanese-held China by early 1939: east of FRONT_1938 + the Canton pocket + Hainan (Manchukuo and Kwantung separate). APPROXIMATE${R_DOC}` },
          { name: "MANCHUKUO", region: "manchukuo", doc: `Manchukuo, 1933 extent incl. Jehol, minus Kwantung (west line APPROXIMATE)${R_DOC}` },
          { name: "FREE_CHINA", region: "freeChina", doc: `unoccupied China, 1939: China minus Manchukuo, Kwantung, OCCUPIED_1939${R_DOC}` },
          { name: "KOREA", region: "korea", doc: `Korea (one Japanese colony)${R_DOC}` },
          { name: "JAPAN_HOME", region: "japanHome", doc: `the Japanese home islands (Hokkaido, Honshu, Shikoku, Kyushu and their islets)${R_DOC}` },
          { name: "FRONT_1938_PTS", doc: "the stalled front of 1938-39 over China, N (Mongolia border) -> S (Hangzhou bay), world px; OCCUPIED_1939 is EAST of it", type: ": P2[]", value: (c) => roundPts(front(c)) },
          { name: "WALL_PTS", doc: "the China / Manchukuo line (the Great Wall line), Shanhaiguan -> the Mongolia border, world px", type: ": P2[]", value: (c) => roundPts(wallLine(c.W)) },
          { name: "OCCUPIED_POLY", doc: "OCCUPIED_1939 as coarse rings (world px) for in-polygon tests", type: ": P2[][][]", value: (c) => coarse(c.R.occupied, 1.5, 30) },
          { name: "MANCHUKUO_POLY", type: ": P2[][][]", value: (c) => coarse(c.R.manchukuo, 2, 30) },
          { name: "FREE_CHINA_POLY", type: ": P2[][][]", value: (c) => coarse(c.R.freeChina, 2, 30) },
          { name: "PLACES", places: PLACES, type: ": Record<ChinaPlace, P2>", doc: "cities (world px)" },
          { name: "PLACES_LL", value: PLACES, type: ": Record<ChinaPlace, LL>", doc: "the same, lon/lat (for northYaw and labels)" },
          { name: "LABEL_AT", places: LABEL_AT, type: ": Record<string, P2>", doc: "where a GroundLabel for a country / region sits (world px)" },
          ...Object.entries(RAIL).map(([k, st]) => ({ name: `RAIL_${k.toUpperCase()}`, route: st, per: 16, thin: 0.6, doc: `railway ${st.map((q) => q[0]).join(" - ")} (APPROXIMATE course)` })),
          { name: "RAIL_HELD", doc: "the stretches Japan held by early 1939, as [railway, from station, to station] (the cuts slice the RouteData by station arclengths)", type: ": [ChinaRail, string, string][]", value: [["pinghan", "beiping", "xinxiang"], ["jinpu", "tianjin", "pukou"], ["zhengtai", "shijiazhuang", "taiyuan"], ["jiaoji", "jinan", "qingdao"], ["longhai", "kaifeng", "xinpu"], ["huning", "shanghai", "nanjing"], ["huhang", "shanghai", "hangzhou"], ["beining", "beiping", "shanhaiguan"]] },
          { name: "RIVER_YANGTZE", route: RIVERS.yangtze, per: 16, thin: 0.6, doc: "the Yangtze, Yichang -> the sea (APPROXIMATE course; Japan held it up to Wuhan, Oct 1938)" },
          { name: "RIVER_YELLOW", route: RIVERS.yellow, per: 16, thin: 0.6, doc: "the Yellow River, Hekou -> Huayuankou, then its 1938-47 flood course to the Huai and Hongze lake (APPROXIMATE)" },
          { name: "BASE_AREAS", type: ": Record<ChinaBase, SoftRegion>", doc: "the guerrilla base areas behind the lines, c. 1939-40, as soft ellipses (centre, radii, rotation deg cw; world px; APPROXIMATE)", value: (c) => Object.fromEntries(Object.entries(BASES).map(([k, e]) => [k, ellipseOf(c.W, e)])) },
          { name: "LAKES_D", doc: "the hand-traced period lakes (Dongting, Poyang), world px", value: (c) => [DONGTING_LL, POYANG_LL].map((r) => ptsD(r.map((q) => c.P(q)), true)).join("") },
        ],
      },
      levels: [
        { name: "c0", s: 0.5, kBake: 0.35, band: null, rects: [{ lon: [96, 150], lat: [16, 52] }] },
        { name: "c1", s: 1.6, kBake: 0.9, band: [0.42, 0.55], rects: [{ lon: [105.5, 126.5], lat: [24, 43.5] }] },
        { name: "c2", s: 3.2, kBake: 2.1, band: [1.35, 1.7], rects: [{ lon: [110.5, 121.8], lat: [27.3, 41.3] }] },
      ],
    },
  },
};
