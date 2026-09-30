// Bakes the Natural Earth geometry for RussiaAMultiple (Sarah Paine: "Russia
// was a multiple of these quantifiable measures over Japan, by territory ...")
// into flat SVG path strings. Pattern copied from scripts/build-transsib-map.mjs.
//
//   bun scripts/build-multiple-map.mjs
//
// Writes
//   generated/components/multipleStatic.ts    the heavy STATIC layers (land,
//                                             lakes, 1904 borders, graticule,
//                                             the Russian Empire and 1904
//                                             Japan as fill shapes), read only
//                                             by scripts/bake-multiple-rasters.mjs
//   generated/components/multipleMapData.ts   the light numbers the component
//                                             needs: label anchors, the plate
//                                             edge, the measured areas
//
// THE PROJECTION is north-up ALBERS EQUAL-AREA conic (d3 geoConicEqualArea),
// parallels 45 / 65, centre meridian 105 E. This departs from the house
// Lambert conformal conic on purpose: the piece compares AREA (Russia ~54x
// Japan), so the map must be equal-area or the x54 is a lie. The fit is solved
// from the empire itself: its bounding box spans 95 % of the 1080 width (x 27
// .. 1053) at the k 1 wide, centred on x 540. World px == screen px at that wide.
//
// 1904 POLITIES, NOT MODERN ONES (the transsib merge, extended west):
//   Russian Empire  Russia (minus the Kaliningrad oblast, German East Prussia
//                   in 1904, and minus the Kurils, Japanese since 1875) +
//                   Finland, Aland, Estonia, Latvia, Belarus, Moldova
//                   (Bessarabia), the Caucasus republics, the five Central
//                   Asian republics (+ Baikonur) + the parts of Lithuania,
//                   Poland and Ukraine east of the hand-traced 1815-1914
//                   western border (Congress Poland in, Memel / East Prussia /
//                   Posen / Silesia / Galicia / Bukovina out). Sakhalin wholly
//                   Russian (Natural Earth already has it so). No Alaska.
//                   Franz Josef Land and Severnaya Zemlya are not hatched
//                   (unclaimed / uncharted in 1904). Not modelled (below a pixel or two at the wide): the Kars
//                   and Batum oblasts (Russian 1878-1918, now NE Turkey).
//   Japan 1904      the home islands (Natural Earth Japan, incl. Ryukyu and
//                   Bonin) + all the Kurils + Taiwan and the Pescadores. NOT
//                   southern Sakhalin (1905) and NOT Korea (1910).
//   Qing China      China + Mongolia (Tuva Qing: the Sayan line, as transsib)
//   Korea           North + South Korea, one country
// Borders drawn: the Russian Empire's land border (dashed cream, the heavier
// rung) and a few others of the period (Qing-Korea, Ottoman-Persia,
// Persia-Afghanistan, Persia / Afghanistan - British India, Afghanistan-Qing),
// fine dashed cream at the lower rung.
// LAKES: Baikal and the pre-1960 Aral from scripts/transsib-lakes.json (Natural
// Earth land has no hole for either; the Caspian is one).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoBounds, geoCentroid, geoConicEqualArea, geoGraticule, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import polygonClipping from "polygon-clipping";

const OUT_STATIC = "generated/components/multipleStatic.ts";
const OUT = "generated/components/multipleMapData.ts";

// -- the Russian Empire's western border, 1815-1914 (lon, lat), Baltic -> Prut.
// Hand-traced from border towns of the period (Russian side / foreign side):
// Nimmersatt-Polangen, the Memel line to the Neman, the East Prussian line
// (Vistytis, Grajewo | Prostki, Kolno | Pisz, Chorzele | Wielbark, Mlawa |
// Dzialdowo, Rypin | Brodnica), Dobrzyn-Golub on the Drweca, Ciechocinek |
// Thorn, Aleksandrow | Otloczyn, Radziejow | Kruszwica, Slupca | Strzalkowo,
// Pyzdry, Kalisz | Skalmierzyce, Wieruszow | Kepno, Praszka, Herby | Lubliniec,
// Bedzin | Katowice to the Three Emperors' Corner (Myslowice); then Galicia:
// Olkusz | Krzeszowice, Michalowice north of Krakow, the Vistula to the San,
// Janow / Bilgoraj / Tomaszow | Rawa Ruska, Volodymyr | Sokal, Radyvyliv |
// Brody, the Zbruch to the Dniester, Khotyn | Bukovina to the Prut. Accurate to
// ~0.1 deg (under a pixel at the wide).
const WEST_LINE = [
  [21.07, 55.87],
  [21.3, 55.74],
  [21.7, 55.56],
  [22.05, 55.36],
  [22.45, 55.1],
  [22.85, 55.05],
  [22.9, 54.8],
  [22.8, 54.55],
  [22.77, 54.36],
  [22.62, 54.12],
  [22.58, 53.9],
  [22.44, 53.68],
  [22.1, 53.54],
  [21.8, 53.5],
  [21.45, 53.44],
  [21.05, 53.35],
  [20.7, 53.3],
  [20.3, 53.18],
  [19.85, 53.2],
  [19.4, 53.16],
  [19.05, 53.1],
  [18.8, 52.97],
  [18.68, 52.87],
  [18.5, 52.66],
  [18.3, 52.5],
  [17.95, 52.34],
  [17.82, 52.28],
  [17.68, 52.16],
  [17.88, 51.95],
  [18.02, 51.73],
  [18.1, 51.45],
  [18.12, 51.3],
  [18.42, 51.07],
  [18.72, 50.95],
  [18.85, 50.78],
  [19.02, 50.6],
  [19.05, 50.43],
  [19.1, 50.3],
  [19.18, 50.23],
  [19.4, 50.25],
  [19.6, 50.2],
  [19.95, 50.14],
  [20.3, 50.16],
  [20.72, 50.22],
  [21.0, 50.27],
  [21.25, 50.35],
  [21.5, 50.52],
  [21.75, 50.66],
  [21.85, 50.73],
  [22.05, 50.56],
  [22.35, 50.52],
  [22.7, 50.4],
  [23.05, 50.33],
  [23.45, 50.36],
  [23.85, 50.45],
  [24.2, 50.56],
  [24.55, 50.4],
  [24.9, 50.22],
  [25.2, 50.1],
  [25.55, 49.95],
  [25.95, 49.75],
  [26.13, 49.55],
  [26.18, 49.25],
  [26.2, 48.95],
  [26.27, 48.72],
  [26.36, 48.54],
  [26.25, 48.42],
  [26.35, 48.3],
  [26.62, 48.26],
];
// The polygon "east of the line", for clipping Lithuania, Poland and Ukraine:
// the line, then south-west into Romania (west of Bessarabia / Budjak), out
// into the Black Sea, and closed round the east and north.
const EAST_OF_LINE = [
  [20.5, 56.0],
  ...WEST_LINE,
  [26.55, 47.8],
  [27.2, 46.4],
  [27.8, 45.35],
  [29.5, 44.3],
  [45, 44.3],
  [45, 60],
  [20.5, 60],
  [20.5, 56.0],
];

// Lakes and the Sayan line, as transsib.
const LAKES = JSON.parse(readFileSync("scripts/transsib-lakes.json", "utf8"));
const SAYAN = [
  [89.62, 49.84],
  [89.8, 50.35],
  [89.55, 50.9],
  [89.7, 51.4],
  [90.4, 51.7],
  [91.5, 51.95],
  [92.9, 52.2],
  [94.0, 52.4],
  [95.1, 52.6],
  [96.1, 53.0],
  [96.9, 53.3],
  [97.7, 53.35],
  [98.3, 53.05],
  [98.75, 52.6],
  [98.94, 52.13],
];

// -- geometry sources ------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const countries = feature(cTopo, cTopo.objects.countries).features;
const byName = (n) => {
  const f = countries.find((c) => c.properties.name === n);
  if (!f) throw new Error(`no country ${n}`);
  return f;
};
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const bboxOf = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return { x0, x1, y0, y1 };
};
// d3-geo wants exterior rings clockwise (spherical rule); polygon-clipping
// returns them counter-clockwise. Flip any polygon whose area is over a
// hemisphere (the tell of a wrong winding), rings and all.
const fixWinding = (poly) => {
  if (geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI) return poly.map((r) => [...r].reverse());
  return poly;
};
const sane = (poly) => geoArea({ type: "Polygon", coordinates: [poly[0]] }) < 2 * Math.PI;

// Russia's own polygons: drop Kaliningrad (German in 1904) and the Kurils (Japanese).
const inBox = (b, [lx0, lx1, ly0, ly1]) => b.x0 >= lx0 && b.x1 <= lx1 && b.y0 >= ly0 && b.y1 <= ly1;
const KALININGRAD_BOX = [19.3, 23.0, 54.2, 55.4];
const KURIL_BOX = [145.0, 157.5, 43.2, 51.0];
// Not Russian in 1904: Franz Josef Land (terra nullius until the 1926 Soviet
// decree) and Severnaya Zemlya (not even charted until 1913). Drawn as land,
// not hatched.
const FJL_BOX = [44.0, 66.0, 79.5, 82.2];
const SZ_BOX = [89.0, 108.5, 77.8, 81.5];
const russiaPolys = polysOf(byName("Russia").geometry);
const ruOwn = russiaPolys.filter((p) => {
  const b = bboxOf(p[0]);
  return !inBox(b, KALININGRAD_BOX) && !inBox(b, KURIL_BOX) && !inBox(b, FJL_BOX) && !inBox(b, SZ_BOX);
});
const kurils = russiaPolys.filter((p) => inBox(bboxOf(p[0]), KURIL_BOX));
console.log(`Russia polygons ${russiaPolys.length}: kept ${ruOwn.length}, Kurils -> Japan ${kurils.length}`);

const RU_WHOLE = [
  "Finland",
  "Åland",
  "Estonia",
  "Latvia",
  "Belarus",
  "Moldova",
  "Georgia",
  "Armenia",
  "Azerbaijan",
  "Kazakhstan",
  "Uzbekistan",
  "Turkmenistan",
  "Kyrgyzstan",
  "Tajikistan",
  "Baikonur",
];
const RU_PART = ["Lithuania", "Poland", "Ukraine"];
const ruPolys = [...ruOwn];
for (const n of RU_WHOLE) ruPolys.push(...polysOf(byName(n).geometry));
for (const n of RU_PART) {
  const cut = polygonClipping.intersection(polysOf(byName(n).geometry), [EAST_OF_LINE]);
  cut.forEach((p) => ruPolys.push(fixWinding(p)));
  console.log(`${n}: ${cut.length} polygon(s) east of the 1914 line`);
}
const RU_GEO = { type: "MultiPolygon", coordinates: ruPolys.filter(sane) };

const JP_GEO = {
  type: "MultiPolygon",
  coordinates: [...polysOf(byName("Japan").geometry), ...kurils, ...polysOf(byName("Taiwan").geometry)].filter(sane),
};

// -- areas (steradians -> km2 on the authalic sphere, R 6371.0072 km) -----------
const R_A = 6371.0072;
const km2 = (g) => geoArea(g) * R_A * R_A;
const AREA_RU = km2(RU_GEO);
const AREA_JP = km2(JP_GEO);
console.log(`areas: Russian Empire ${(AREA_RU / 1e6).toFixed(3)} M km2, Japan 1904 ${(AREA_JP / 1e3).toFixed(1)} k km2, ratio ${(AREA_RU / AREA_JP).toFixed(2)}`);

// -- the projection and the fit ----------------------------------------------------
const projection = geoConicEqualArea().parallels([45, 65]).rotate([-105, 0]).center([0, 55]);
projection.scale(1).translate([0, 0]);
const EMPIRE_W = 0.95 * 1080;
const EMPIRE_TOP = 520; // world y of the empire's top edge (the camera frames it)
{
  const b = geoPath(projection).bounds(RU_GEO);
  projection.scale(EMPIRE_W / (b[1][0] - b[0][0]));
  const b2 = geoPath(projection).bounds(RU_GEO);
  const t = projection.translate();
  projection.translate([t[0] + 540 - (b2[0][0] + b2[1][0]) / 2, t[1] + EMPIRE_TOP - b2[0][1]]);
}
const SCALE = projection.scale();
const RU_B = geoPath(projection).bounds(RU_GEO);
const JP_B = geoPath(projection).bounds(JP_GEO);
console.log(`scale ${SCALE.toFixed(3)} translate ${projection.translate().map((v) => v.toFixed(2))}`);
console.log(`empire bounds ${RU_B.map((q) => q.map((v) => v.toFixed(1)).join(",")).join("  ")}`);
console.log(`japan  bounds ${JP_B.map((q) => q.map((v) => v.toFixed(1)).join(",")).join("  ")}`);
const pxArea = (g) => geoPath(projection).area(g);
console.log(`projected area ratio (equal-area check) ${(pxArea(RU_GEO) / pxArea(JP_GEO)).toFixed(2)}; km per px ${Math.sqrt(AREA_RU / pxArea(RU_GEO)).toFixed(3)}`);

// THE PLATE: the map is printed as one plate at the top of the page, its
// bottom edge a straight rule just under Japan's (Taiwan's) southern tip.
const PLATE_BOTTOM = Math.ceil(JP_B[1][1] + 26);
const CLIP = [
  [-420, -700],
  [1500, PLATE_BOTTOM + 220],
];
projection.clipExtent(CLIP);

// -- a rounding path sink (transsib) ---------------------------------------------------
const MIN_STEP = 0.1;
const roundingContext = () => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  const n = (v) => {
    const r = Math.round(v * 40) / 40;
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

// -- land ----------------------------------------------------------------------------
// The Old World whole; of the Americas only Alaska's far west (the continent's
// ring cut at 128 W, far outside every view), so the Bering Strait has two shores.
const land = feature(landTopo, landTopo.objects.land);
const landPolys = [];
const ALASKA_CUT = -128; // well outside every view
for (const f of land.features) {
  for (const p of polysOf(f.geometry)) {
    const b = bboxOf(p[0]);
    if (!sane(p)) continue;
    const crossesDateline = b.x0 < -170 && b.x1 > 170; // Eurasia (Chukotka), Wrangel
    if (crossesDateline || b.x0 >= -35) {
      if (b.y1 >= -12) landPolys.push(p);
    } else if (b.x1 <= ALASKA_CUT && b.y0 >= 45) landPolys.push(p);
    else if (b.x0 < ALASKA_CUT && b.y1 > 55) {
      const cut = polygonClipping.intersection([p], [
        [
          [-180, 40],
          [ALASKA_CUT, 40],
          [ALASKA_CUT, 84],
          [-180, 84],
          [-180, 40],
        ],
      ]);
      cut.forEach((q) => landPolys.push(fixWinding(q)));
    }
  }
}
const LAND_D = bake({ type: "MultiPolygon", coordinates: landPolys });

const lakeGeo = (rings) => ({ type: "Polygon", coordinates: rings.map((r) => [...r]) });
const LAKES_D = bake({ type: "GeometryCollection", geometries: [lakeGeo(LAKES.baikal), lakeGeo(LAKES.aral)] });

const RU_D = bake(RU_GEO);
const JP_D = bake(JP_GEO);

// -- borders -------------------------------------------------------------------------
const GROUP = {};
const put = (g, names) => names.forEach((n) => (GROUP[n] = g));
put("RU", ["Russia", ...RU_WHOLE]);
put("WEST", RU_PART); // their lines are the traced 1914 line, not modern ones
put("QING", ["China", "Mongolia"]);
put("KOREA", ["North Korea", "South Korea"]);
put("OTT", ["Turkey", "Syria", "Iraq"]);
put("PERSIA", ["Iran"]);
put("AFG", ["Afghanistan"]);
put("BRIND", ["India", "Pakistan", "Bangladesh", "Myanmar"]);
put("NOR", ["Norway"]);
put("SWE", ["Sweden"]);
put("ROM", ["Romania"]);
const RU_PAIRS = [
  ["RU", "QING"],
  ["RU", "KOREA"],
  ["RU", "OTT"],
  ["RU", "PERSIA"],
  ["RU", "AFG"],
  ["RU", "NOR"],
  ["RU", "SWE"],
  ["RU", "ROM"],
];
const OTHER_PAIRS = [
  ["QING", "KOREA"],
  ["OTT", "PERSIA"],
  ["PERSIA", "AFG"],
  ["PERSIA", "BRIND"],
  ["AFG", "BRIND"],
  ["AFG", "QING"],
];
const pairIn = (pairs) => (a, b) => {
  const ga = GROUP[a.properties.name];
  const gb = GROUP[b.properties.name];
  if (!ga || !gb || ga === gb) return false;
  return pairs.some(([p, q]) => (ga === p && gb === q) || (ga === q && gb === p));
};
// Tuva: cut the modern Russia-Mongolia stretch, add the Sayan line (transsib).
const inTuvaCut = ([lon, lat]) => lon > SAYAN[0][0] + 0.02 && lon < SAYAN[SAYAN.length - 1][0] - 0.02 && lat < 52.2 && lat > 49.5;
// Ukraine (Bukovina) - Romania north of the Prut tripoint was Austria's line in 1904
const inBukovina = ([lon, lat]) => lat > 47.6 && lon < 26.63;
const splitRuns = (lines, drop) => {
  const out = [];
  for (const line of lines) {
    let run = [];
    for (const p of line) {
      if (drop(p)) {
        if (run.length > 1) out.push(run);
        run = [];
      } else run.push(p);
    }
    if (run.length > 1) out.push(run);
  }
  return out;
};
const ruMesh = mesh(cTopo, cTopo.objects.countries, (a, b) => a !== b && pairIn(RU_PAIRS)(a, b));
const ruLines = splitRuns(ruMesh.coordinates, (p) => inTuvaCut(p) || inBukovina(p));
const nearestEnd = (lines, pt) => {
  let best = null;
  let bd = Infinity;
  for (const l of lines) {
    for (const e of [l[0], l[l.length - 1]]) {
      const d = Math.hypot(e[0] - pt[0], e[1] - pt[1]);
      if (d < bd) [bd, best] = [d, e];
    }
  }
  return { best, bd };
};
const wEnd = nearestEnd(ruLines, SAYAN[0]);
const eEnd = nearestEnd(ruLines, SAYAN[SAYAN.length - 1]);
console.log(`Sayan joins: W ${wEnd.bd.toFixed(2)} deg, E ${eEnd.bd.toFixed(2)} deg`);
ruLines.push([wEnd.best, ...SAYAN, eEnd.best]);
// the traced western line, joined to the Prut tripoint end of the Romanian line
const prutEnd = nearestEnd(ruLines, WEST_LINE[WEST_LINE.length - 1]);
console.log(`west line joins the Prut line ${prutEnd.bd.toFixed(3)} deg away`);
ruLines.push([...WEST_LINE, prutEnd.best]);
const RU_BORDER_D = bake({ type: "MultiLineString", coordinates: ruLines });
const otherMesh = mesh(cTopo, cTopo.objects.countries, (a, b) => a !== b && pairIn(OTHER_PAIRS)(a, b));
const BORDERS_D = bake(otherMesh);

const graticule = geoGraticule()
  .extent([
    [-180, 5],
    [180, 85.001],
  ])
  .step([5, 5])
  .precision(0.5)();
const GRATICULE_D = bake(graticule);

// -- anchors ---------------------------------------------------------------------------
const r2 = (v) => Math.round(v * 100) / 100;
const P = (ll) => {
  const [x, y] = projection(ll);
  return { x: r2(x), y: r2(y) };
};
const PLACES_LL = {
  seaOfJapan: [135.0, 40.5],
  vladivostok: [131.9, 43.1],
  tokyo: [139.7, 35.7],
  honshuMid: [138.0, 36.5],
  kyushu: [130.7, 32.6],
  hokkaido: [142.8, 43.4],
  taiwan: [120.9, 23.7],
  sakhalinN: [142.8, 53.5],
  amurMouth: [140.7, 53.0],
  khabarovsk: [135.1, 48.5],
  baikal: [108.0, 53.5],
  urals: [60.0, 58.0],
  moscow: [37.6, 55.75],
  warsaw: [21.0, 52.23],
  helsinki: [24.9, 60.2],
  chukotka: [-169.7, 66.1],
  kamchatka: [158.6, 53.0],
  empireMid: [95.0, 63.0],
  alaskaCut: [-128, 60],
  alaskaCutS: [-128, 45],
  turkmen: [58.0, 37.5],
  pamir: [73.0, 38.0],
  korea: [127.5, 37.5],
  beijing: [116.4, 39.9],
};
const PLACES = Object.fromEntries(Object.entries(PLACES_LL).map(([k, v]) => [k, P(v)]));
for (const [k, v] of Object.entries(PLACES)) console.log(`${k.padEnd(12)} ${v.x.toFixed(1)}, ${v.y.toFixed(1)}`);
const jpC = P(geoCentroid(JP_GEO));
console.log(`japan centroid ${jpC.x}, ${jpC.y}; plate bottom ${PLATE_BOTTOM}`);
console.log(`graticule ${GRATICULE_D.length}, land ${LAND_D.length}, ru ${RU_D.length}, jp ${JP_D.length}, ruBorder ${RU_BORDER_D.length}`);
console.log(`lon/lat bounds of RU ${JSON.stringify(geoBounds(RU_GEO))}`);

// -- write -------------------------------------------------------------------------------
const header = `Natural Earth (public domain, 10m) on a north-up Albers equal-area conic,
// parallels 45/65, centre meridian 105 E, scale ${SCALE.toFixed(3)}, translate
// ${projection.translate().map((v) => v.toFixed(2)).join(", ")}. World px == screen px at the k 1 wide.`;
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-multiple-map.mjs — do not edit by hand.
// The STATIC layers of RussiaAMultiple, read only by scripts/bake-multiple-rasters.mjs.
// ${header}

/** Land: the Old World + Alaska's far west (evenodd; the Caspian is a hole). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** Lake Baikal (Olkhon a hole) and the pre-1960 Aral Sea. */
export const LAKES_D = ${JSON.stringify(LAKES_D)};
/** The Russian Empire, 1904 (see the build script). */
export const RU_D = ${JSON.stringify(RU_D)};
/** Japan, 1904: home islands, the Kurils, Taiwan and the Pescadores. */
export const JP_D = ${JSON.stringify(JP_D)};
/** The Russian Empire's land border, 1904. */
export const RU_BORDER_D = ${JSON.stringify(RU_BORDER_D)};
/** Other borders of the period (Asia). */
export const BORDERS_D = ${JSON.stringify(BORDERS_D)};
/** 5 degree graticule, 5-85 N. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
writeFileSync(
  OUT,
  `// Generated by scripts/build-multiple-map.mjs — do not edit by hand.
// The light numbers of RussiaAMultiple.
// ${header}

export type Pt = { x: number; y: number };

/** Measured on the 1904 polygons (Natural Earth 10m, authalic sphere). */
export const AREA_RU_KM2 = ${Math.round(AREA_RU)};
export const AREA_JP_KM2 = ${Math.round(AREA_JP)};
/** The empire's projected bounding box (world px) and Japan's. */
export const RU_BOX = ${JSON.stringify(RU_B.map((q) => q.map(r2)))};
export const JP_BOX = ${JSON.stringify(JP_B.map((q) => q.map(r2)))};
/** The map plate's straight bottom edge (world y). */
export const PLATE_BOTTOM = ${PLATE_BOTTOM};
export const JAPAN_C: Pt = ${JSON.stringify(jpC)};
export const PLACES: Record<string, Pt> = ${JSON.stringify(PLACES)};
`,
);
mkdirSync("public/multiple", { recursive: true });
console.log(`Wrote ${OUT_STATIC} and ${OUT}`);
