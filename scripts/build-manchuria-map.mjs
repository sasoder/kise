// Bakes Natural Earth geometry for SouthManchuriaRailway into flat SVG path
// strings, plus the two static textures the map is printed with, so the Remotion
// component stays dependency-free and deterministic at render time.
//
//   bun scripts/build-manchuria-map.mjs
//
// Writes
//   generated/components/manchuriaMapData.ts   paths, cities, rail polylines
//   public/manchuria/grain.png                 1080x1920 screen-space paper grain
//   public/manchuria/mottle.png                512x512 world-space paper mottling
//
// THE PROJECTION is north-up Lambert conformal conic, parallels 35 / 50, centre
// meridian 125 E, so Manchuria is flat and the Liaodong Peninsula points the way
// it does on every atlas. The fit is solved from three anchors rather than
// guessed: Manzhouli and Vladivostok set the scale (the width of the "T"), and
// Port Arthur sets the vertical placement. World px == screen px at the wide
// establishing shot (camera k 1), and every later framing is a zoom into this.
//
// 1905 BORDERS, NOT MODERN ONES. Only the boundaries that existed in 1905 and
// matter here are baked: Russia-China (Argun / Amur / Ussuri) and Korea-China /
// Korea-Russia (Yalu / Tumen). Outer Mongolia was Qing territory in 1905, so the
// modern Russia-Mongolia line WAS the Russia-China border then and is included;
// the Mongolia-China line did not exist and is not. North and South Korea are
// one country, so there is no DMZ line (the land is one fill, borders are drawn
// only where listed).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { geoConicConformal, geoContains, geoGraticule, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";

const OUT = "generated/components/manchuriaMapData.ts";
const TEX_DIR = "public/manchuria";

// -- places (lon, lat) -------------------------------------------------------
const P = {
  manzhouli: [117.43, 49.6],
  hailar: [119.7, 49.2],
  zhalantun: [122.74, 48.01], // shape point: the Khingan crossing (unlabelled)
  angangxi: [123.8, 47.2],
  anda: [125.34, 46.4], // shape point (unlabelled)
  harbin: [126.63, 45.75],
  mudanjiang: [129.6, 44.58],
  suifenhe: [131.15, 44.4],
  ussuriysk: [131.95, 43.8], // shape point: Nikolsk, where the line meets the Ussuri Railway
  vladivostok: [131.89, 43.12],
  changchun: [125.32, 43.88],
  siping: [124.35, 43.17],
  tieling: [123.84, 42.29],
  mukden: [123.43, 41.8],
  liaoyang: [123.17, 41.27],
  dashiqiao: [122.5, 40.63],
  wafangdian: [122.0, 39.63],
  jinzhou: [121.7, 39.1],
  // The Port Arthur branch leaves the Dalny line a few km north of Dalny; the
  // line does not run through Dalny and double back.
  junction: [121.62, 39.0],
  dalny: [121.61, 38.91],
  portArthur: [121.26, 38.81],
};

// The Kwantung leased territory. The 1898 lease boundary ran across the
// peninsula from the north shore of Adams (Pulandian) Bay to Pikou, at about
// 39.45 N, not along the Jinzhou isthmus. Change this one number to move it.
const KWANTUNG_NORTH = 39.45;
const KWANTUNG_BOX = [
  [120.6, KWANTUNG_NORTH],
  [122.45, KWANTUNG_NORTH],
  [122.45, 38.4],
  [120.6, 38.4],
];

// -- the fit -----------------------------------------------------------------
const X_MANZHOULI = 170;
const X_VLADIVOSTOK = 890;
const Y_PORT_ARTHUR = 1070;

const projection = geoConicConformal().parallels([35, 50]).rotate([-125, 0]).center([0, 42]);
projection.scale(1).translate([0, 0]);
const u0 = projection(P.manzhouli);
const u1 = projection(P.vladivostok);
const SCALE = (X_VLADIVOSTOK - X_MANZHOULI) / (u1[0] - u0[0]);
projection.scale(SCALE);
const a = projection(P.manzhouli);
const b = projection(P.portArthur);
projection.translate([X_MANZHOULI - a[0], Y_PORT_ARTHUR - b[1]]);

// Everything is clipped to the canvas plus MARGIN: the widest frame of the cut
// is the k 1 establishing shot (the canvas itself, plus 8 px of sway), so a
// 260 px margin keeps every clip edge, and every stroke that runs along one,
// out of shot.
const MARGIN = 260;
const CLIP = [
  [-MARGIN, -MARGIN],
  [1080 + MARGIN, 1920 + MARGIN],
];
projection.clipExtent(CLIP);

// -- a rounding path sink (the atlantic script's, finer: k reaches ~5) ------
const MIN_STEP = 0.22;
const roundingContext = () => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  const n = (v) => {
    const r = Math.round(v * 20) / 20;
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

// -- geometry ----------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
// Keep only polygons whose outer ring touches this window. Without this, a
// polygon that wraps the pole (Antarctica) clips to the whole extent rectangle
// and the evenodd fill turns land into sea.
const VIEW = { lon: [95, 165], lat: [15, 64] };
const ringInView = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return x1 >= VIEW.lon[0] && x0 <= VIEW.lon[1] && y1 >= VIEW.lat[0] && y0 <= VIEW.lat[1];
};
const inView = (geometry) => {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const kept = polys.filter((rings) => ringInView(rings[0]));
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
};
const landGeometry = {
  type: "GeometryCollection",
  geometries: land.features.map((f) => inView(f.geometry)).filter(Boolean),
};
const LAND_D = bake(landGeometry);

const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const countries = feature(cTopo, cTopo.objects.countries).features;
const japan = countries.find((f) => f.properties.name === "Japan");
const JAPAN_D = bake(inView(japan.geometry));

const PAIRS = [
  ["Russia", "China"],
  ["Russia", "Mongolia"], // the 1905 Russia-China border: Outer Mongolia was Qing
  ["North Korea", "China"],
  ["North Korea", "Russia"],
];
const isPair = (x, y) =>
  PAIRS.some(
    ([p, q]) =>
      (x.properties.name === p && y.properties.name === q) ||
      (x.properties.name === q && y.properties.name === p),
  );
const borders = mesh(cTopo, cTopo.objects.countries, (x, y) => x !== y && isPair(x, y));
const BORDERS_D = bake(borders);

const graticule = geoGraticule()
  .extent([
    [95, 20],
    [160, 62],
  ])
  .step([5, 5])
  .precision(0.5)();
const GRATICULE_D = bake(graticule);

// The Kwantung box as a polygon in screen space (it is clipped to the land in
// the component). Densified so its north edge follows the parallel.
const densify = (ring, steps = 24) => {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i];
    const q = ring[(i + 1) % ring.length];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      out.push(projection([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]));
    }
  }
  return out;
};
const r2 = (v) => Math.round(v * 100) / 100;
const kw = densify(KWANTUNG_BOX);
const KWANTUNG_D = `M${kw.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}Z`;
const kwNorth = [projection([120.6, KWANTUNG_NORTH]), projection([122.45, KWANTUNG_NORTH])];
// The northern lease line, drawn over land only: sampled along the parallel
// and kept where the sample is on land, so it never crosses a bay.
const kwLand = { type: "GeometryCollection", geometries: landGeometry.geometries };
const KWANTUNG_NORTH_D = (() => {
  const N = 900;
  const runs = [];
  let run = null;
  for (let i = 0; i <= N; i++) {
    const ll = [120.6 + (1.85 * i) / N, KWANTUNG_NORTH];
    const on = geoContains(kwLand, ll);
    if (on) {
      if (!run) runs.push((run = []));
      run.push(projection(ll));
    } else run = null;
  }
  return runs
    .filter((r) => r.length > 1)
    .map((r) => r.filter((_, i) => i % 20 === 0 || i === r.length - 1))
    .map((r) => `M${r.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}`)
    .join("");
})();

// -- the railway -------------------------------------------------------------
// A centripetal Catmull-Rom through the projected stations, sampled densely,
// so the line bends through each town instead of kinking at it.
const catmull = (pts, perSeg = 24) => {
  const ext = [
    [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]],
    ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]],
  ];
  const out = [pts[0]];
  const knot = (p, q) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  const idx = [];
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
    idx.push(out.length - 1); // index of station i (1-based) in the samples
  }
  return { pts: out, stationIdx: [0, ...idx] };
};

const line = (names) => catmull(names.map((n) => projection(P[n])));

const MAIN_NAMES = [
  "manzhouli",
  "hailar",
  "zhalantun",
  "angangxi",
  "anda",
  "harbin",
  "mudanjiang",
  "suifenhe",
  "ussuriysk",
  "vladivostok",
];
const BRANCH_NAMES = [
  "harbin",
  "changchun",
  "siping",
  "tieling",
  "mukden",
  "liaoyang",
  "dashiqiao",
  "wafangdian",
  "jinzhou",
  "junction",
  "portArthur",
];
const main = line(MAIN_NAMES);
const branch = line(BRANCH_NAMES);
// Split the branch at Changchun so the Russian and Japanese halves share one
// tangent at the cut.
const ccIdx = branch.stationIdx[1];
const north = branch.pts.slice(0, ccIdx + 1);
const south = branch.pts.slice(ccIdx);
// The Dalny spur, a clean Y: it leaves the junction on the main line's own
// tangent there, turns in one quadratic, and runs straight into Dalny.
const junctionIdx = branch.stationIdx[9] - ccIdx;
const spurFromJ = (() => {
  const J = south[junctionIdx];
  const Pm = south[junctionIdx - 2];
  const D = projection(P.dalny);
  const len = Math.hypot(D[0] - J[0], D[1] - J[1]);
  const tl = Math.hypot(J[0] - Pm[0], J[1] - Pm[1]);
  const dir = [(J[0] - Pm[0]) / tl, (J[1] - Pm[1]) / tl];
  const C = [J[0] + dir[0] * len * 0.35, J[1] + dir[1] * len * 0.35];
  const M = [C[0] + (D[0] - C[0]) * 0.3, C[1] + (D[1] - C[1]) * 0.3];
  const out = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    out.push([
      (1 - t) * (1 - t) * J[0] + 2 * (1 - t) * t * C[0] + t * t * M[0],
      (1 - t) * (1 - t) * J[1] + 2 * (1 - t) * t * C[1] + t * t * M[1],
    ]);
  }
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    out.push([M[0] + (D[0] - M[0]) * t, M[1] + (D[1] - M[1]) * t]);
  }
  return out;
})();

const cum = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return c;
};
const southCum = cum(south);
const stationS = (name) => {
  const i = BRANCH_NAMES.indexOf(name);
  return southCum[branch.stationIdx[i] - ccIdx];
};

const toD = (pts) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}`;
const toPts = (pts) => pts.map(([x, y]) => [r2(x), r2(y)]);

// -- checks ------------------------------------------------------------------
const pr = (label, ll) => {
  const [x, y] = projection(ll);
  const onLand = land.features.some((f) => geoContains(f, ll));
  console.log(`${label.padEnd(12)} (${x.toFixed(1)}, ${y.toFixed(1)})  ${onLand ? "land" : "SEA"}`);
};
console.log(`scale ${SCALE.toFixed(2)}  translate ${projection.translate().map((v) => v.toFixed(1))}`);
for (const [k, v] of Object.entries(P)) pr(k, v);
const kmPx = (() => {
  const p = projection([125, 42]);
  const q = projection([125, 43]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]) / 111.2;
})();
console.log(`px per km at 42N: ${kmPx.toFixed(3)}`);
console.log(`south branch length ${southCum[southCum.length - 1].toFixed(1)} px`);

// -- labels (anchor points only; type is set in the component) ---------------
const L = (ll) => {
  const [x, y] = projection(ll);
  return { x: r2(x), y: r2(y) };
};
const cities = {
  harbin: L(P.harbin),
  changchun: L(P.changchun),
  mukden: L(P.mukden),
  vladivostok: L(P.vladivostok),
  dalny: L(P.dalny),
  portArthur: L(P.portArthur),
};

// A parallel as a path, for type set along it (the vintage way).
const parallelD = (lat, lon0, lon1, steps = 40) => {
  const pts = [];
  for (let i = 0; i <= steps; i++) pts.push(projection([lon0 + ((lon1 - lon0) * i) / steps, lat]));
  return toD(pts);
};

const body = `// Generated by scripts/build-manchuria-map.mjs — do not edit by hand.
// Natural Earth (public domain, 10m) on a north-up Lambert conformal conic,
// parallels 35/50, centre meridian 125 E, scale ${SCALE.toFixed(2)}. World px ==
// screen px at the k 1 establishing shot. ${kmPx.toFixed(3)} world px per km at 42 N.
// Clipped to ${JSON.stringify(CLIP)}.

export type Pt = { x: number; y: number };

export const PX_PER_KM = ${kmPx.toFixed(4)};

/** All land, one path (evenodd). Korea is one fill: no DMZ is ever drawn. */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** Japan's islands, for the orange tint. */
export const JAPAN_D = ${JSON.stringify(JAPAN_D)};
/** 1905 borders only: Russia-China (incl. the then-Qing Mongolia line) and Korea-China / Korea-Russia. */
export const BORDERS_D = ${JSON.stringify(BORDERS_D)};
/** 5 degree graticule. */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};

/** Kwantung leased territory box (clip it to LAND_D), north edge on ${KWANTUNG_NORTH} N. */
export const KWANTUNG_D = ${JSON.stringify(KWANTUNG_D)};
export const KWANTUNG_NORTH_D = ${JSON.stringify(KWANTUNG_NORTH_D)};
export const KWANTUNG_NORTH_Y = ${r2((kwNorth[0][1] + kwNorth[1][1]) / 2)};

/** Chinese Eastern Railway main line, Manzhouli -> Vladivostok. */
export const RAIL_MAIN_D = ${JSON.stringify(toD(main.pts))};
/** Southern branch, Harbin -> Changchun (Russia keeps it). */
export const RAIL_NORTH_D = ${JSON.stringify(toD(north))};
/** Southern branch, Changchun -> Port Arthur (to Japan): polyline for the front. */
export const RAIL_SOUTH_PTS: [number, number][] = ${JSON.stringify(toPts(south))};
/** The Dalny spur, from the junction. */
export const RAIL_SPUR_PTS: [number, number][] = ${JSON.stringify(toPts(spurFromJ))};
/** Arclength along RAIL_SOUTH_PTS at each station, world px. */
export const STATION_S = ${JSON.stringify({
  changchun: 0,
  siping: r2(stationS("siping")),
  tieling: r2(stationS("tieling")),
  mukden: r2(stationS("mukden")),
  liaoyang: r2(stationS("liaoyang")),
  dashiqiao: r2(stationS("dashiqiao")),
  wafangdian: r2(stationS("wafangdian")),
  jinzhou: r2(stationS("jinzhou")),
  junction: r2(stationS("junction")),
  portArthur: r2(southCum[southCum.length - 1]),
})};

export const CITIES: Record<"harbin" | "changchun" | "mukden" | "vladivostok" | "dalny" | "portArthur", Pt> = ${JSON.stringify(cities)};

/** Label anchors. */
export const PLACES: Record<string, Pt> = ${JSON.stringify({
  manchuria: L([122.2, 42.45]),
  russia: L([132.0, 51.15]),
  korea: L([127.2, 40.3]),
  japan: L([131.75, 36.95]),
  yellowSea: L([124.0, 35.9]),
  seaOfJapan: L([132.2, 40.2]),
  jinzhou: L(P.jinzhou),
})};

/** Parallels for type set along them. */
export const MANCHURIA_ARC_D = ${JSON.stringify(parallelD(42.45, 117.6, 126.8))};
export const RUSSIA_ARC_D = ${JSON.stringify(parallelD(51.15, 126.5, 137.5))};
`;

writeFileSync(OUT, body);
console.log(`Wrote ${OUT}: land ${LAND_D.length} chars, japan ${JAPAN_D.length}, borders ${BORDERS_D.length}`);

// -- textures ----------------------------------------------------------------
// A minimal RGBA PNG writer, so the textures are baked here with no image deps.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const writePng = (file, w, h, rgba) => {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy
      ? rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
      : raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(file, png);
};

// Deterministic noise.
let seed = 1905;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const boxBlur = (src, w, h, r) => {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + ((x + w) % w)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / (2 * r + 1);
      acc += src[y * w + ((x + r + 1) % w)] - src[y * w + ((x - r + w) % w)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[((y + h) % h) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[((y + r + 1) % h) * w + x] - tmp[((y - r + h) % h) * w + x];
    }
  }
  return out;
};
const normalise = (a) => {
  let m = 0;
  let s = 0;
  for (const v of a) m += v;
  m /= a.length;
  for (const v of a) s += (v - m) * (v - m);
  s = Math.sqrt(s / a.length) || 1;
  for (let i = 0; i < a.length; i++) a[i] = (a[i] - m) / s;
  return a;
};

mkdirSync(TEX_DIR, { recursive: true });

// GRAIN: screen space, 1080x1920. Fine 1 px tooth plus a 2 px fibre octave,
// cream where it is light and near-black where it is dark, at low alpha.
{
  const w = 1080;
  const h = 1920;
  const fine = new Float32Array(w * h);
  for (let i = 0; i < fine.length; i++) fine[i] = rand() - 0.5;
  const coarse = normalise(boxBlur(fine.map(() => rand() - 0.5), w, h, 2));
  normalise(fine);
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = fine[i] * 0.6 + coarse[i] * 0.55;
    const light = v > 0;
    const alpha = Math.min(1, Math.abs(v) * 0.05);
    rgba[i * 4] = light ? 0xf2 : 0x0c;
    rgba[i * 4 + 1] = light ? 0xe6 : 0x09;
    rgba[i * 4 + 2] = light ? 0xc8 : 0x06;
    rgba[i * 4 + 3] = Math.round(alpha * 255);
  }
  writePng(`${TEX_DIR}/grain.png`, w, h, rgba);
}

// MOTTLE: world space, 512x512 tiling. Low-frequency stains, dark only, so the
// paper looks aged and uneven rather than flat vector.
{
  const w = 512;
  const h = 512;
  let acc = new Float32Array(w * h);
  const octaves = [
    [40, 1.0],
    [18, 0.55],
    [7, 0.3],
  ];
  for (const [r, amp] of octaves) {
    const n = new Float32Array(w * h);
    for (let i = 0; i < n.length; i++) n[i] = rand() - 0.5;
    const bl = normalise(boxBlur(boxBlur(n, w, h, r), w, h, r));
    for (let i = 0; i < acc.length; i++) acc[i] += bl[i] * amp;
  }
  acc = normalise(acc);
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = acc[i];
    // dark stains where v > 0, faint lighter foxing where v < -1.2
    const dark = Math.max(0, v);
    const lite = 0;
    const isLite = lite > dark;
    rgba[i * 4] = isLite ? 0xe9 : 0x0a;
    rgba[i * 4 + 1] = isLite ? 0xdd : 0x07;
    rgba[i * 4 + 2] = isLite ? 0xbf : 0x04;
    rgba[i * 4 + 3] = Math.round(Math.min(1, isLite ? lite * 0.18 : dark * 0.16) * 255);
  }
  writePng(`${TEX_DIR}/mottle.png`, w, h, rgba);
}
console.log(`Wrote ${TEX_DIR}/grain.png and ${TEX_DIR}/mottle.png`);
