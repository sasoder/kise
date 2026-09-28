// Bakes the Natural Earth geometry for TroopsOutOfAsia (Moscow <-> Manchuria,
// the troops' railway home after Portsmouth, 1905) into flat SVG path strings.
//
//   bun scripts/build-transsib-map.mjs
//
// Writes
//   generated/components/transsibStatic.ts    the heavy STATIC layers (land,
//                                             Baikal, 1905 borders, graticule),
//                                             read only by the raster bake
//   generated/components/transsibMapData.ts   the light OVERLAYS the component
//                                             draws as vectors: the route, the
//                                             Harbin -> Changchun stub, the
//                                             Europe/Asia boundary, label arcs
//
// THE PROJECTION is north-up Lambert conformal conic, parallels 45 / 60,
// centre meridian 82 E. The fit is solved from the route itself: Moscow and
// Harbin set the scale (the route fills x 80..1010, 86 % of the width, at the
// k 1 final wide) and the route's vertical middle sits on y 800. World px ==
// screen px at that wide; every other framing is a zoom into it.
//
// 1905 BORDERS, NOT MODERN ONES. Countries are merged into their 1905 polity
// and a line is drawn only between two polities that both existed and matter:
//   Russian Empire  Russia, Finland (+ Aland), the Baltic states, Belarus,
//                   Ukraine, Moldova, the Caucasus republics, the five Central
//                   Asian republics (+ Baikonur): one polity, no inner lines
//   Qing China      China + Mongolia (Outer Mongolia and Manchuria were Qing)
//   Korea           North + South Korea, one country (no DMZ)
//   Ottoman Empire  Turkey, Syria, Iraq ... (only its lines with Russia/Persia)
//   Persia, Afghanistan, British India (India, Pakistan, Bangladesh, Burma)
// Pairs drawn: Russia-Qing, Russia-Korea, Qing-Korea, Russia-Ottoman,
// Russia-Persia, Russia-Afghanistan, Ottoman-Persia, Persia-Afghanistan,
// Persia-British India, Afghanistan-British India, Afghanistan-Qing,
// Russia(Finland)-Norway, Russia(Finland)-Sweden.
// TUVA: in 1905 Uryankhai (Tuva) was Qing, so the Russia-Qing line ran along
// the Sayan crest north of it, not along the modern Russia-Mongolia line. The
// modern Tuva-Mongolia stretch is cut out and replaced by a hand-traced Sayan
// line (approximate, ~0.2 deg).
// LAKES: Natural Earth land-10m has holes for neither Baikal nor the Aral (the
// Caspian is one), so both come from Natural Earth 10m lakes (Baikal) and
// lakes_historic (the full pre-1960 Aral Sea), via scripts/transsib-lakes.json.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicConformal, geoContains, geoGraticule, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";

const OUT_STATIC = "generated/components/transsibStatic.ts";
const OUT = "generated/components/transsibMapData.ts";

// -- the route: the troops' railway home, 1905 (lon, lat) ---------------------
// Station coordinates from Wikipedia / GeoNames town and station entries
// (rounded to ~0.01 deg). `shape` points are real stations used only to bend
// the line; none is labelled.
export const STATIONS = [
  ["Harbin", 126.63, 45.75],
  ["Anda", 125.34, 46.4, "shape"],
  ["Qiqihar (Tsitsihar stn, Angangxi)", 123.8, 47.2],
  ["Zhalantun", 122.74, 48.01, "shape"],
  ["Bukhedu (Khingan tunnel)", 121.92, 48.78, "shape"],
  ["Hailar", 119.7, 49.2, "shape"],
  ["Manzhouli", 117.43, 49.6],
  ["Borzya", 116.52, 50.39, "shape"],
  ["Olovyannaya", 115.58, 50.94, "shape"],
  ["Karymskaya", 114.35, 51.62, "shape"],
  ["Chita", 113.5, 52.03],
  ["Mogzon", 111.97, 51.74, "shape"],
  ["Khilok", 110.46, 51.35, "shape"],
  ["Petrovsky Zavod", 108.83, 51.28, "shape"],
  ["Verkhneudinsk", 107.6, 51.83],
  ["Selenginsk", 106.87, 52.02, "shape"],
  ["Posolskaya", 106.24, 51.952, "shape"],
  // the south shore east of Mysovaya, held just inland of the Natural Earth shore
  ["shore (Boyarsky)", 106.14, 51.884, "shape"],
  ["shore (Klyuevka)", 106.05, 51.822, "shape"],
  ["shore (Vydrino east)", 105.95, 51.718, "shape"],
  ["Mysovaya", 105.85, 51.7, "shape"],
  ["Tankhoy", 105.13, 51.55, "shape"],
  ["Vydrino", 104.63, 51.45, "shape"],
  ["Baikalsk", 104.15, 51.52, "shape"],
  ["Slyudyanka", 103.7, 51.655, "shape"],
  ["Kultuk", 103.72, 51.735, "shape"],
  ["Marituy", 104.22, 51.8, "shape"],
  ["shore (Angasolka)", 104.6, 51.806, "shape"],
  ["shore (below Port Baikal)", 104.7, 51.848, "shape"],
  ["shore (Baranchiki)", 104.748, 51.883, "shape"],
  ["Port Baikal", 104.83, 51.892, "shape"],
  ["Angara left bank", 104.6, 52.08, "shape"],
  ["Irkutsk", 104.26, 52.27],
  ["Usolye", 103.64, 52.75, "shape"],
  ["Cheremkhovo", 103.07, 53.15, "shape"],
  ["Zima", 102.05, 53.92, "shape"],
  ["Tulun", 100.58, 54.56, "shape"],
  ["Nizhneudinsk", 99.03, 54.9, "shape"],
  ["Taishet", 98.0, 55.94, "shape"],
  ["Kansk", 95.7, 56.2, "shape"],
  ["Krasnoyarsk", 92.87, 56.01],
  ["Achinsk", 90.5, 56.27, "shape"],
  ["Mariinsk", 87.75, 56.21, "shape"],
  ["Taiga", 85.62, 56.06, "shape"],
  ["Bolotnoye", 84.39, 55.67, "shape"],
  ["Novonikolaevsk", 82.92, 55.03],
  ["Kargat", 80.3, 55.2, "shape"],
  ["Barabinsk", 78.35, 55.35, "shape"],
  ["Tatarsk", 75.97, 55.21, "shape"],
  ["Omsk", 73.37, 54.99],
  ["Isilkul", 71.27, 54.9, "shape"],
  ["Petropavlovsk", 69.15, 54.87, "shape"],
  ["Makushino", 67.25, 55.2, "shape"],
  ["Kurgan", 65.34, 55.44],
  ["Shumikha", 63.29, 55.23, "shape"],
  ["Chelyabinsk", 61.4, 55.16],
  ["Miass", 60.1, 55.05, "shape"],
  ["Urzhumka (Europe-Asia obelisk)", 59.85, 55.12, "shape"],
  ["Zlatoust", 59.67, 55.17, "shape"],
  ["Asha", 57.26, 54.99, "shape"],
  ["Ufa", 55.97, 54.73],
  ["Abdulino", 53.65, 53.68, "shape"],
  ["Kinel", 50.63, 53.22, "shape"],
  ["Samara", 50.1, 53.2],
  ["Syzran", 48.47, 53.16, "shape"],
  ["Kuznetsk", 46.6, 53.12, "shape"],
  ["Penza", 45.0, 53.2, "shape"],
  ["Morshansk", 41.8, 53.44, "shape"],
  ["Ryazhsk", 40.06, 53.71, "shape"],
  ["Ryazan", 39.74, 54.63, "shape"],
  ["Kolomna", 38.78, 55.08, "shape"],
  ["Moscow (Kazansky)", 37.66, 55.77],
];
// The South Manchurian branch stub, Harbin -> Changchun, toward the front.
const STUB = [
  [126.63, 45.75],
  [126.2, 45.2],
  [125.75, 44.6],
  [125.32, 43.88],
];
// Where the railway crosses the Urals boundary (the obelisk near Urzhumka).
const URALS_CROSS = [59.85, 55.12];
// The conventional Europe/Asia boundary: the Urals crest from the Kara Sea,
// through the railway crossing, then the Ural River to the Caspian.
const URALS = [
  [66.6, 68.9],
  [65.8, 68.1],
  [64.6, 67.2],
  [63.3, 66.3],
  [61.9, 65.6],
  [60.2, 65.0],
  [59.4, 64.1],
  [59.3, 63.0],
  [59.2, 62.0],
  [59.3, 61.0],
  [59.6, 59.9],
  [59.7, 58.7],
  [59.9, 57.6],
  [59.95, 56.5],
  [59.85, 55.72],
  URALS_CROSS,
  [59.6, 54.6],
  [59.2, 54.0],
  [59.05, 53.4],
  [58.8, 52.3],
  [58.55, 51.25],
  [57.6, 51.4],
  [56.3, 51.65],
  [55.1, 51.77],
  [53.5, 51.5],
  [52.2, 51.25],
  [51.37, 51.23],
  [51.2, 50.2],
  [51.4, 49.0],
  [51.75, 47.9],
  [51.9, 47.1],
];

// Lake Baikal and the Aral Sea come from Natural Earth 10m physical
// (ne_10m_lakes: "Lake Baikal", with Olkhon as a hole; ne_10m_lakes_historic:
// "Aral Sea" at its pre-1960 extent, full in 1905), extracted to
// scripts/transsib-lakes.json. Natural Earth land has no hole for either.
const LAKES = JSON.parse(readFileSync("scripts/transsib-lakes.json", "utf8"));
// The 1905 Russia-Qing line along the Sayan crest (north of Tuva), W -> E.
const SAYAN = [
  [89.62, 49.84], // Altai-Tuva-Mongolia tripoint (on the modern line)
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
  [98.94, 52.13], // Tuva-Buryatia-Mongolia tripoint (on the modern line)
];

// -- the fit -----------------------------------------------------------------
const X_MOSCOW = 80;
const X_HARBIN = 1010;
const Y_ROUTE_MID = 800;
const projection = geoConicConformal().parallels([45, 60]).rotate([-82, 0]).center([0, 52]);
projection.scale(1).translate([0, 0]);
const ll = (name) => {
  const s = STATIONS.find((r) => r[0].startsWith(name));
  return [s[1], s[2]];
};
{
  const a = projection(ll("Moscow"));
  const b = projection(ll("Harbin"));
  projection.scale((X_HARBIN - X_MOSCOW) / (b[0] - a[0]));
  const m = projection(ll("Moscow"));
  projection.translate([X_MOSCOW - m[0], 0]);
  const ys = STATIONS.map((s) => projection([s[1], s[2]])[1]);
  const mid = (Math.min(...ys) + Math.max(...ys)) / 2;
  const t = projection.translate();
  projection.translate([t[0], t[1] + Y_ROUTE_MID - mid]);
}
const SCALE = projection.scale();
const CLIP = [
  [-160, -160],
  [1240, 2080],
];
projection.clipExtent(CLIP);

// -- a rounding path sink ------------------------------------------------------
const MIN_STEP = 0.12; // world px: k reaches ~4.7
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

// -- geometry ------------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
// Only the Old World: drops the Americas and Greenland, which would otherwise
// wrap round the pole into the top of the wide.
const VIEW = { lon: [-20, 180], lat: [-5, 85] };
const ringInView = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  const americas = x1 < -25; // the Americas, Greenland, their islands
  return !americas && x1 >= VIEW.lon[0] && x0 <= VIEW.lon[1] && y1 >= VIEW.lat[0] && y0 <= VIEW.lat[1];
};
// A few tiny 10m rings (the Maldives among them) wind the wrong way for
// d3-geo's spherical rule, which reads them as the whole globe minus an atoll
// and floods the evenodd fill. Drop any ring whose area is over a hemisphere.
const sane = (rings) => geoArea({ type: "Polygon", coordinates: [rings[0]] }) < 2 * Math.PI;
const inView = (geometry) => {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const kept = polys.filter((rings) => ringInView(rings[0]) && sane(rings));
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
};
const landGeometry = {
  type: "GeometryCollection",
  geometries: land.features.map((f) => inView(f.geometry)).filter(Boolean),
};
const LAND_D = bake(landGeometry);

// Lakes: GeoJSON polygons straight from the shapefile rings (outer rings
// clockwise, holes counter-clockwise: d3-geo's own convention).
const lakeGeo = (rings) => ({ type: "Polygon", coordinates: rings.map((r) => [...r]) });
const baikalGeo = lakeGeo(LAKES.baikal);
const aralGeo = lakeGeo(LAKES.aral);
for (const [n, g] of [["baikal", baikalGeo], ["aral", aralGeo]]) {
  const a = geoArea(g);
  if (a > 2 * Math.PI) throw new Error(`${n} ring winds the wrong way`);
}
const r2 = (v) => Math.round(v * 100) / 100;
const LAKES_D = bake({ type: "GeometryCollection", geometries: [baikalGeo, aralGeo] });

// 1905 polities.
const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const GROUP = {};
const put = (g, names) => names.forEach((n) => (GROUP[n] = g));
put("RU", [
  "Russia",
  "Finland",
  "Åland",
  "Estonia",
  "Latvia",
  "Lithuania",
  "Belarus",
  "Ukraine",
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
]);
put("QING", ["China", "Mongolia"]);
put("KOREA", ["North Korea", "South Korea"]);
put("OTT", ["Turkey", "Syria", "Iraq"]);
put("PERSIA", ["Iran"]);
put("AFG", ["Afghanistan"]);
put("BRIND", ["India", "Pakistan", "Bangladesh", "Myanmar"]);
put("NOR", ["Norway"]);
put("SWE", ["Sweden"]);
const PAIRS = [
  ["RU", "QING"],
  ["RU", "KOREA"],
  ["QING", "KOREA"],
  ["RU", "OTT"],
  ["RU", "PERSIA"],
  ["RU", "AFG"],
  ["OTT", "PERSIA"],
  ["PERSIA", "AFG"],
  ["PERSIA", "BRIND"],
  ["AFG", "BRIND"],
  ["AFG", "QING"],
  ["RU", "NOR"],
  ["RU", "SWE"],
];
const pairOk = (a, b) => {
  const ga = GROUP[a.properties.name];
  const gb = GROUP[b.properties.name];
  if (!ga || !gb || ga === gb) return false;
  return PAIRS.some(([p, q]) => (ga === p && gb === q) || (ga === q && gb === p));
};
const borders = mesh(cTopo, cTopo.objects.countries, (a, b) => a !== b && pairOk(a, b));
// Tuva: cut the modern Russia-Mongolia stretch between the Sayan ends, add the
// Sayan line. A coordinate is "in Tuva's modern south border" when it lies in
// the lon window of the Sayan line and south of 52.2 N (the Buryatia section of
// the Russia-Mongolia line east of 99 E is kept).
const inTuvaCut = ([lon, lat]) => lon > SAYAN[0][0] + 0.02 && lon < SAYAN[SAYAN.length - 1][0] - 0.02 && lat < 52.2 && lat > 49.5;
const bLines = [];
for (const line of borders.coordinates) {
  let run = [];
  for (const p of line) {
    if (inTuvaCut(p)) {
      if (run.length > 1) bLines.push(run);
      run = [];
    } else run.push(p);
  }
  if (run.length > 1) bLines.push(run);
}
// join the Sayan line to the nearest kept ends
const nearestEnd = (pt) => {
  let best = null;
  let bd = Infinity;
  for (const l of bLines) {
    for (const e of [l[0], l[l.length - 1]]) {
      const d = Math.hypot(e[0] - pt[0], e[1] - pt[1]);
      if (d < bd) [bd, best] = [d, e];
    }
  }
  return { best, bd };
};
const wEnd = nearestEnd(SAYAN[0]);
const eEnd = nearestEnd(SAYAN[SAYAN.length - 1]);
console.log(`Sayan joins: W ${wEnd.best} (${wEnd.bd.toFixed(2)} deg), E ${eEnd.best} (${eEnd.bd.toFixed(2)} deg)`);
bLines.push([wEnd.best, ...SAYAN, eEnd.best]);
const BORDERS_D = bake({ type: "MultiLineString", coordinates: bLines });

const graticule = geoGraticule()
  .extent([
    [-20, 0],
    [180, 80.001],
  ])
  .step([5, 5])
  .precision(0.5)();
const GRATICULE_D = bake(graticule);

// -- the route -------------------------------------------------------------------
// A centripetal Catmull-Rom through the projected stations, sampled densely.
const catmull = (pts, perSeg = 12) => {
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
  return { pts: out, idx };
};
const route = catmull(STATIONS.map((s) => projection([s[1], s[2]])));
const cum = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const routeCum = cum(route.pts);
const stationS = Object.fromEntries(STATIONS.map((s, i) => [s[0], r2(routeCum[route.idx[i]])]));
const uralsCrossS = stationS["Urzhumka (Europe-Asia obelisk)"];
const stub = catmull(STUB.map((p) => projection(p)), 10);

// -- checks ------------------------------------------------------------------------
console.log(`scale ${SCALE.toFixed(2)}  translate ${projection.translate().map((v) => v.toFixed(1))}`);
const kmPx = (() => {
  const p = projection([82, 52]);
  const q = projection([82, 53]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`px per km at 52N: ${kmPx.toFixed(4)}; route ${routeCum[routeCum.length - 1].toFixed(1)} world px`);
const landOnly = { type: "GeometryCollection", geometries: landGeometry.geometries };
const inBaikal = (lonlat) => geoContains(baikalGeo, lonlat);
for (const s of STATIONS) {
  const [x, y] = projection([s[1], s[2]]);
  const onLand = geoContains(landOnly, [s[1], s[2]]);
  console.log(
    `${s[0].padEnd(34)} (${x.toFixed(1)}, ${y.toFixed(1)}) s ${stationS[s[0]].toFixed(1)} ${onLand ? "" : "SEA "}${inBaikal([s[1], s[2]]) ? "IN BAIKAL" : ""}`,
  );
}
// The smoothed route itself must stay on the shore: sample it and report any
// point inside Baikal, with its distance to the shore in world px.
{
  const wet = route.pts.map((p, i) => ({ i, ll: projection.invert(p) })).filter(({ ll }) => inBaikal(ll));
  console.log(`route samples inside Baikal: ${wet.length}${wet.length ? " at " + wet.map(({ ll }) => ll.map((v) => v.toFixed(3)).join(",")).join(" ") : ""}`);
}
for (const [n, p] of Object.entries({ pole: [0, 90], kara: [66, 70], caucasus: [42, 41.5], helsinki: [25, 60.2], kola: [33, 68.5], beijing: [116.4, 39.9], vladivostok: [131.9, 43.1] })) {
  console.log(`${n.padEnd(12)} ${projection(p).map((v) => v.toFixed(0)).join(",")}`);
}

// -- label arcs ---------------------------------------------------------------------
const toD = (pts) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}`;
const parallelD = (lat, lon0, lon1, steps = 40) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(projection([lon0 + ((lon1 - lon0) * i) / steps, lat]));
  return toD(pts);
};
const L = (p) => {
  const [x, y] = projection(p);
  return { x: r2(x), y: r2(y) };
};
const LABELS = {
  asia: { lat: 61.2, lon0: 72, lon1: 104 },
  // centred on 41.5 E; the arcs run well past the text so textPath never clips it
  euro1: { lat: 61.3, lon0: 21.5, lon1: 61.5 },
  euro2: { lat: 59.6, lon0: 21.5, lon1: 61.5 },
};
for (const [k, v] of Object.entries(LABELS)) {
  console.log(`label ${k}: ${L([v.lon0, v.lat]).x},${L([v.lon0, v.lat]).y} -> ${L([v.lon1, v.lat]).x},${L([v.lon1, v.lat]).y}; mid ${JSON.stringify(L([(v.lon0 + v.lon1) / 2, v.lat]))}`);
}

// -- write ---------------------------------------------------------------------------
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-transsib-map.mjs — do not edit by hand.
// The STATIC layers of TroopsOutOfAsia, read only by scripts/bake-transsib-rasters.mjs.
// Natural Earth (public domain, 10m) on a north-up Lambert conformal conic,
// parallels 45/60, centre meridian 82 E, scale ${SCALE.toFixed(2)}. World px ==
// screen px at the k 1 final wide. Clipped to ${JSON.stringify(CLIP)}.

/** Old World land, one path (evenodd; the Caspian is a hole). */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** Lake Baikal (Olkhon a hole, evenodd) and the pre-1960 Aral Sea, Natural Earth 10m lakes. */
export const LAKES_D = ${JSON.stringify(LAKES_D)};
/** 1905 borders only (see the build script for the polity pairs; Tuva is Qing). */
export const BORDERS_D = ${JSON.stringify(BORDERS_D)};
/** 5 degree graticule, to 80 N. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);

writeFileSync(
  OUT,
  `// Generated by scripts/build-transsib-map.mjs — do not edit by hand.
// The light OVERLAYS of TroopsOutOfAsia. Lambert conformal conic, parallels
// 45/60, centre meridian 82 E, scale ${SCALE.toFixed(2)}. World px == screen px at
// the k 1 final wide. ${kmPx.toFixed(4)} world px per km at 52 N.

export type Pt = { x: number; y: number };

export const PX_PER_KM = ${kmPx.toFixed(4)};

/** The troops' railway home, Harbin -> Moscow (smoothed through the stations). */
export const ROUTE_PTS: [number, number][] = ${JSON.stringify(route.pts.map(([x, y]) => [r2(x), r2(y)]))};
/** Arclength along ROUTE_PTS at each station, world px. */
export const STATION_S: Record<string, number> = ${JSON.stringify(stationS)};
/** Arclength at the Urals crossing (the Europe-Asia obelisk near Urzhumka). */
export const URALS_CROSS_S = ${uralsCrossS};
export const URALS_CROSS: Pt = ${JSON.stringify(L(URALS_CROSS))};
/** The South Manchurian branch stub, Harbin -> Changchun. */
export const STUB_D = ${JSON.stringify(toD(stub.pts))};
/** The Europe/Asia boundary: Urals crest, then the Ural River to the Caspian. */
export const URALS_D = ${JSON.stringify(toD(catmull(URALS.map((p) => projection(p)), 6).pts))};

export const HARBIN: Pt = ${JSON.stringify(L(ll("Harbin")))};
export const MOSCOW: Pt = ${JSON.stringify(L(ll("Moscow")))};

/** Parallels the two region names are set along. */
export const ASIA_ARC_D = ${JSON.stringify(parallelD(LABELS.asia.lat, LABELS.asia.lon0, LABELS.asia.lon1))};
export const EURO1_ARC_D = ${JSON.stringify(parallelD(LABELS.euro1.lat, LABELS.euro1.lon0, LABELS.euro1.lon1))};
export const EURO2_ARC_D = ${JSON.stringify(parallelD(LABELS.euro2.lat, LABELS.euro2.lon0, LABELS.euro2.lon1))};
export const ASIA_MID: Pt = ${JSON.stringify(L([(LABELS.asia.lon0 + LABELS.asia.lon1) / 2, LABELS.asia.lat]))};
`,
);
mkdirSync("public/transsib", { recursive: true });
console.log(`Wrote ${OUT_STATIC}: land ${LAND_D.length}, borders ${BORDERS_D.length}, graticule ${GRATICULE_D.length}`);
console.log(`Wrote ${OUT}: route ${route.pts.length} pts`);
