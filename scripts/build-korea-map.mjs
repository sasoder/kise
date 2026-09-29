// Bakes the Natural Earth geometry of the 1950 Korea map (Sarah Paine, "Both
// sides overreached in Korea": Twosome, ReuniteTheWholeThing, ChineseAreIn)
// into flat SVG path strings in WORLD PX.
//
//   bun scripts/build-korea-map.mjs && bun scripts/bake-korea-rasters.mjs
//
// Writes
//   generated/components/koreaStatic.ts   the heavy STATIC layers (land, 1950
//                                         borders, graticule), read only by the
//                                         raster bake
//   generated/components/koreaMapData.ts  the projection constants, Korea's land
//                                         as one clip path, a soft land mask for
//                                         the army dots, the named framings
//
// THE PROJECTION is north-up Lambert conformal conic, standard parallels 35 / 41,
// centre meridian 127.5 E (fitted to the peninsula plus the Yalu / southern
// Manchuria edge). World px == screen px at PENINSULA_WIDE (k 1): the mainland
// peninsula runs from its northmost point (the Tumen bend, ~43.0 N) on y 262 to
// its south coast (~34.3 N) on y 1138, centred on x 540.
//
// 1950 BORDERS ONLY. Korea is ONE land mass (North + South merged, no DMZ, no
// modern armistice line); its only internal line is the 38th parallel, drawn as
// a dynamic overlay by koreaShared (not baked). Borders drawn: Korea-China (Yalu,
// upper Tumen), Korea-USSR (lower Tumen), China-USSR. Nothing else (Japan is an
// island state; Mongolia is out of frame).
//
// THE LAND LAYER is the union of every Natural Earth 10m country polygon in view
// (lon 112-146, lat 26-50): Korea, Manchuria, the Shandong and Liaodong coasts,
// the Russian Far East, Kyushu, Shikoku and western Honshu. Korea's clip path is
// the union of North + South Korea from the same file, so the hatch edge and the
// coast stroke are the same line.

import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoArea, geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { mesh, merge } from "topojson-client";
import { FRONT_24NOV } from "../generated/components/korea1950Fronts.ts";

const OUT_STATIC = "generated/components/koreaStatic.ts";
const OUT = "generated/components/koreaMapData.ts";

const PARALLELS = [35, 41];
const ROTATE = [-127.5, 0];
const CENTER = [0, 38];

const cTopo = JSON.parse(await Bun.file("node_modules/world-atlas/countries-10m.json").text());
const geoms = cTopo.objects.countries.geometries;
const byName = (n) => geoms.filter((g) => g.properties.name === n);
const KOREA = new Set(["North Korea", "South Korea"]);
const koreaGeo = merge(cTopo, geoms.filter((g) => KOREA.has(g.properties.name)));
// the mainland polygon (the largest ring), for the fit
const mainland = koreaGeo.coordinates
  .map((p) => ({ p, a: geoArea({ type: "Polygon", coordinates: p }) }))
  .sort((a, b) => b.a - a.a)[0].p;

// -- the fit ------------------------------------------------------------------------
const Y_NORTH = 262;
const Y_SOUTH = 1138;
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).center(CENTER);
projection.scale(1).translate([0, 0]);
const bboxOf = (rings) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const r of rings)
    for (const ll of r) {
      const [x, y] = projection(ll);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  return { x0, x1, y0, y1 };
};
{
  const b = bboxOf(mainland);
  const s = (Y_SOUTH - Y_NORTH) / (b.y1 - b.y0);
  projection.scale(s);
  const b2 = bboxOf(mainland);
  const t = projection.translate();
  projection.translate([t[0] + 540 - (b2.x0 + b2.x1) / 2, t[1] + Y_NORTH - b2.y0]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const CLIP = [
  [-1500, -1200],
  [2600, 3100],
];
projection.clipExtent(CLIP);
const kmPx = (() => {
  const p = projection([127.5, 38]);
  const q = projection([127.5, 39]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`scale ${SCALE.toFixed(3)} translate ${TRANSLATE.map((v) => v.toFixed(2))}  ${kmPx.toFixed(4)} world px / km`);

// -- a rounding path sink --------------------------------------------------------------
const MIN_STEP = 0.18; // world px: the close level serves k <= 3.6
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

// -- land: every country polygon in view, unioned ------------------------------------
const VIEW = { lon: [112, 146], lat: [26, 50] };
const inViewGeom = (g) => {
  // crude: keep a country if any of its arcs' bbox touches the view; the clip
  // extent trims the rest. Using the feature bbox via merge of just this one.
  const m = merge(cTopo, [g]);
  for (const poly of m.coordinates)
    for (const [lon, lat] of poly[0]) if (lon >= VIEW.lon[0] && lon <= VIEW.lon[1] && lat >= VIEW.lat[0] && lat <= VIEW.lat[1]) return true;
  return false;
};
const viewGeoms = geoms.filter(inViewGeom);
console.log(`countries in view: ${viewGeoms.map((g) => g.properties.name).join(", ")}`);
const landGeo = merge(cTopo, viewGeoms);
// drop polygons wholly outside the view, and any wrong-winding ring
landGeo.coordinates = landGeo.coordinates.filter((poly) => {
  if (geoArea({ type: "Polygon", coordinates: [poly[0]] }) > 2 * Math.PI) return false;
  return poly[0].some(([lon, lat]) => lon >= VIEW.lon[0] - 4 && lon <= VIEW.lon[1] + 4 && lat >= VIEW.lat[0] - 4 && lat <= VIEW.lat[1] + 4);
});
const LAND_D = bake(landGeo);
const KOREA_D = bake(koreaGeo);

// -- 1950 borders ------------------------------------------------------------------------------
const GROUP = { "North Korea": "KOREA", "South Korea": "KOREA", China: "CN", Russia: "RU" };
const PAIRS = [
  ["KOREA", "CN"],
  ["KOREA", "RU"],
  ["CN", "RU"],
];
const borders = mesh(cTopo, cTopo.objects.countries, (a, b) => {
  const ga = GROUP[a.properties.name];
  const gb = GROUP[b.properties.name];
  if (!ga || !gb || ga === gb) return false;
  return PAIRS.some(([p, q]) => (ga === p && gb === q) || (ga === q && gb === p));
});
const BORDERS_D = bake(borders);

const graticule = geoGraticule()
  .extent([
    [100, 20],
    [160, 55.001],
  ])
  .step([5, 5])
  .precision(0.5)();
const GRATICULE_D = bake(graticule);

// -- the land mask for the army dots -------------------------------------------------------
// Korea's land rasterised at 0.5 texel per world px over Korea's bbox (+ 20 px),
// then box-blurred (radius 2 texels = 4 world px): values are 0..255, > 128 is
// "land, a little in from the coast", and small islands drop out. Stored as
// base64 bytes.
const kb = bboxOf(koreaGeo.coordinates.flat());
const MASK = { x0: Math.floor(kb.x0) - 20, y0: Math.floor(kb.y0) - 20, x1: Math.ceil(kb.x1) + 20, y1: Math.ceil(kb.y1) + 20, s: 0.5 };
const MW = Math.round((MASK.x1 - MASK.x0) * MASK.s);
const MH = Math.round((MASK.y1 - MASK.y0) * MASK.s);
const maskBytes = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}" height="${MH}" viewBox="${MASK.x0} ${MASK.y0} ${MW / MASK.s} ${MH / MASK.s}"><rect x="${MASK.x0}" y="${MASK.y0}" width="${MW / MASK.s}" height="${MH / MASK.s}" fill="#000"/><path d="${KOREA_D}" fill="#fff" fill-rule="evenodd"/></svg>`;
  const px = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().pixels;
  let a = new Float32Array(MW * MH);
  for (let i = 0; i < MW * MH; i++) a[i] = px[i * 4] / 255;
  const R = 2;
  for (const dir of [0, 1]) {
    const b = new Float32Array(MW * MH);
    for (let j = 0; j < MH; j++)
      for (let i = 0; i < MW; i++) {
        let s = 0;
        let c = 0;
        for (let d = -R; d <= R; d++) {
          const ii = dir === 0 ? i + d : i;
          const jj = dir === 1 ? j + d : j;
          if (ii < 0 || jj < 0 || ii >= MW || jj >= MH) {
            c++;
            continue;
          }
          s += a[jj * MW + ii];
          c++;
        }
        b[j * MW + i] = s / c;
      }
    a = b;
  }
  const out = new Uint8Array(MW * MH);
  for (let i = 0; i < MW * MH; i++) out[i] = Math.round(a[i] * 255);
  return out;
})();
const MASK_B64 = Buffer.from(maskBytes).toString("base64");

// -- framings ---------------------------------------------------------------------------------
// Camera convention (koreaShared): the world point (cx, cy) sits on screen
// (540, 835) at zoom k.
const P = (ll) => projection(ll);
const r2 = (v) => Math.round(v * 100) / 100;
// PENINSULA_WIDE: world == screen.
const PENINSULA_WIDE = { cx: 540, cy: 835, k: 1 };
// NORTH_FRAME: North Korea's land width (x of the Yalu mouth .. the Tumen mouth)
// fills ~1010 px, and the 24 Nov front's land middle sits on y 835.
const nkGeo = merge(cTopo, byName("North Korea"));
const nb = bboxOf(nkGeo.coordinates.map((p) => p[0]));
const kNorth = 950 / (nb.x1 - nb.x0);
// the 24 Nov front's land part (between the sea stubs), mean world y
const NOV24_LAND = FRONT_24NOV.filter(([lon, lat]) => lon > 124.9 && lon < 129.8).map(P);
const NOV24_MID_Y = NOV24_LAND.reduce((s, p) => s + p[1], 0) / NOV24_LAND.length;
const NORTH_FRAME = { cx: r2((nb.x0 + nb.x1) / 2), cy: r2(NOV24_MID_Y), k: r2(kNorth) };
{
  const toS = (ll) => {
    const [x, y] = P(ll);
    return [540 + (x - NORTH_FRAME.cx) * NORTH_FRAME.k, 835 + (y - NORTH_FRAME.cy) * NORTH_FRAME.k].map((v) => v.toFixed(0));
  };
  console.log(`NORTH_FRAME ${JSON.stringify(NORTH_FRAME)}`);
  for (const [n, ll] of Object.entries({
    yaluMouth: [124.37, 40.1],
    manpo: [126.29, 41.15],
    hyesan: [128.18, 41.4],
    tumenTop: [129.7, 43.0],
    tumenMouth: [130.7, 42.29],
    chongjin: [129.78, 41.78],
    yudamni: [127.08, 40.47],
    chongchonW: [124.95, 39.68],
    pyongyang: [125.75, 39.02],
    parallel38E: [128.75, 38],
  }))
    console.log(`  ${n.padEnd(12)} screen ${toS(ll).join(", ")}`);
}
{
  console.log(`PENINSULA_WIDE (world == screen):`);
  for (const [n, ll] of Object.entries({
    tumenTop: [129.7, 43.0],
    yaluMouth: [124.37, 40.1],
    p38W: [125.12, 38],
    p38E: [128.75, 38],
    pusan: [129.04, 35.1],
    mokpo: [126.39, 34.8],
    jeju: [126.5, 33.4],
    dandong: [124.39, 40.13],
    shandongTip: [122.7, 37.4],
    kyushuN: [130.9, 33.9],
    vladivostok: [131.9, 43.1],
  }))
    console.log(`  ${n.padEnd(12)} ${P(ll).map((v) => v.toFixed(0)).join(", ")}`);
}

// -- write --------------------------------------------------------------------------------------
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-korea-map.mjs — do not edit by hand.
// The STATIC layers of the 1950 Korea map, read only by scripts/bake-korea-rasters.mjs.
// Natural Earth 10m (public domain) on a north-up Lambert conformal conic, parallels
// ${PARALLELS.join("/")}, centre meridian ${-ROTATE[0]} E, scale ${SCALE.toFixed(3)}. World px == screen
// px at PENINSULA_WIDE. Clipped to ${JSON.stringify(CLIP)}.

/** all land in view (every country polygon unioned; Korea is one mass) */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** 1950 borders: Korea-China, Korea-USSR, China-USSR */
export const BORDERS_D = ${JSON.stringify(BORDERS_D)};
/** 5 degree graticule */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);

writeFileSync(
  OUT,
  `// Generated by scripts/build-korea-map.mjs — do not edit by hand.
// The light data of the 1950 Korea map. North-up Lambert conformal conic,
// parallels ${PARALLELS.join("/")}, centre meridian ${-ROTATE[0]} E. World px == screen px at
// PENINSULA_WIDE. ${kmPx.toFixed(4)} world px per km at 38 N.

export const PROJ = {
  parallels: ${JSON.stringify(PARALLELS)} as [number, number],
  rotate: ${JSON.stringify(ROTATE)} as [number, number],
  center: ${JSON.stringify(CENTER)} as [number, number],
  scale: ${SCALE},
  translate: ${JSON.stringify(TRANSLATE)} as [number, number],
};
export const PX_PER_KM = ${kmPx.toFixed(4)};

/** Korea (North + South, one land mass) as one path, world px, evenodd */
export const KOREA_D = ${JSON.stringify(KOREA_D)};

/** Korea's soft land mask: bytes 0..255 (> 128 = land a little in from the
 *  coast; islands under ~8 km drop out), row-major MW x MH, texel (i, j) covers
 *  world x0 + i / s, y0 + j / s. */
export const LAND_MASK = ${JSON.stringify({ ...MASK, w: MW, h: MH })};
export const LAND_MASK_B64 = "${MASK_B64}";

/** Named framings: the world point (cx, cy) sits on screen (540, 835) at zoom k. */
export const PENINSULA_WIDE = ${JSON.stringify(PENINSULA_WIDE)};
export const NORTH_FRAME = ${JSON.stringify(NORTH_FRAME)};
`,
);
console.log(`Wrote ${OUT_STATIC}: land ${LAND_D.length}, borders ${BORDERS_D.length}, graticule ${GRATICULE_D.length}`);
console.log(`Wrote ${OUT}: korea ${KOREA_D.length}, mask ${MW}x${MH} (${MASK_B64.length} b64)`);
