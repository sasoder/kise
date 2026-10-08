// Builds AND bakes the Atlantic world of the cut ClosedWorlds (Si Sheppard,
// "Texcoco"): central Mexico to Spain on one north-up Mercator chart, as a
// raster LOD pyramid, so the nine-fold pull-back draws one <Img> per level and
// the coast stays sharp at both ends.
//
//   bun scripts/build-texcoco-atlantic-map.mjs
//
// Writes
//   public/texcoco-atlantic/lod-<i>.png            six levels, wide -> close
//   generated/components/texcocoAtlanticMapData.ts  projection, the ring, the
//                                                   carrera track, the levels
//
// THE PROJECTION: Mercator (north is up everywhere; a conic would tilt Mexico
// and Spain 20 deg each way over 93 deg of longitude), 9 world px per degree
// of longitude. World px == screen px at the settled wide (camera k 1), where
// Tenochtitlan sits at (130, 980) and Seville at about (968, 795).
//
// THE STATIC STACK is the Dwarkesh map style's (scripts/bake-conquests-raster.mjs):
// sea, 4 engraved water-lines, 10 deg graticule, land + hand-coloured rim,
// cream coast. Natural Earth 10m land, no borders, no modern lakes; the lake
// system of the Valley of Mexico (1519) is added as water from
// scripts/cortes-geo.json.
//
// THE TRACK is the Carrera de Indias as the New Spain flota sailed it: Seville
// -> Sanlucar -> south-west to the Canaries -> west on the trade winds to
// Dominica / Guadeloupe -> the Caribbean south of Hispaniola and Jamaica ->
// the Yucatan Channel -> across the Gulf towards Veracruz. It is cut where the
// lead ship's bow meets the ring.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoContains, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const OUT = "generated/components/texcocoAtlanticMapData.ts";
const DIR = "public/texcoco-atlantic";

// -- the fit -------------------------------------------------------------------
const PX_PER_DEG = 9;
const SCALE = (PX_PER_DEG * 180) / Math.PI;
const RING_LL = [-99.133, 19.435]; // Tenochtitlan: the centre of their world
const RING_W = [130, 980];
const RING_R = 46; // world px (5.1 deg): Colima to the Bay of Campeche, the Huasteca to the Pacific
/** the camera: a pure zoom about one screen point, from K0 (ring centre at P0) to k 1 (ring centre at RING_W) */
const K0 = 9;
const P0 = [540, 910];
const PIVOT = [(K0 * RING_W[0] - P0[0]) / (K0 - 1), (K0 * RING_W[1] - P0[1]) / (K0 - 1)];
const K_MIN = 0.955; // the widest frame the cut may show (the 3 % creep, with margin)
/** half the lead ship (screen px at k 1): its bow touches the ring */
const SHIP_HALF = 40;

const base = geoMercator().scale(SCALE).translate([0, 0]);
{
  const p = base(RING_LL);
  base.translate([RING_W[0] - p[0], RING_W[1] - p[1]]);
}
const TRANSLATE = base.translate();
const P = (ll) => base(ll);

// -- geometry ------------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
const VIEW = { lon: [-140, 30], lat: [-68, 84] };
const polys = [];
for (const f of land.features) {
  const g = f.geometry;
  const list = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const rings of list) {
    let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const [lon, lat] of rings[0]) {
      x0 = Math.min(x0, lon);
      x1 = Math.max(x1, lon);
      y0 = Math.min(y0, lat);
      y1 = Math.max(y1, lat);
    }
    // not Antarctica (it wraps the pole and would flood the evenodd fill)
    if (y0 < -75) continue;
    if (x1 >= VIEW.lon[0] && x0 <= VIEW.lon[1] && y1 >= VIEW.lat[0] && y0 <= VIEW.lat[1]) polys.push({ rings, box: [x0, y0, x1, y1] });
  }
}
console.log(`land polygons in view: ${polys.length}`);

const GEO = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));
const lakeRing = GEO.lake_texcoco_1519.rings[0].map(P);
const LAKE_D = `M${lakeRing.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}Z`;
{
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of lakeRing) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  console.log(`lake system: ${(x1 - x0).toFixed(2)} x ${(y1 - y0).toFixed(2)} world px (x ${K0} on screen at the open)`);
}

const pathSink = (minStep, digits) => {
  let out = "";
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let pending = null;
  const n = (v) => {
    const r = Number(v.toFixed(digits));
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

// -- the levels ------------------------------------------------------------------
const BOUNDS = [K_MIN, 1.44, 2.08, 3.0, 4.33, 6.24, K0 * 1.012];
const frameAt = (k) => ({
  x0: PIVOT[0] - PIVOT[0] / k,
  x1: PIVOT[0] + (1080 - PIVOT[0]) / k,
  y0: PIVOT[1] - PIVOT[1] / k,
  y1: PIVOT[1] + (1920 - PIVOT[1]) / k,
});
const LEVELS = [];
for (let i = 0; i < BOUNDS.length - 1; i++) {
  const kIn = i === 0 ? K_MIN : BOUNDS[i] * 0.93; // starts fading in here
  const kFull = i === 0 ? K_MIN : BOUNDS[i];
  const f = frameAt(kIn);
  const pad = 6 / kIn;
  const s = Number((1.12 * BOUNDS[i + 1]).toFixed(3));
  const x0 = Math.floor(f.x0 - pad);
  const y0 = Math.floor(f.y0 - pad);
  const W = Math.ceil((f.x1 + pad - x0) * s);
  const H = Math.ceil((f.y1 + pad - y0) * s);
  LEVELS.push({ name: `lod-${i}`, kIn, kFull, kBake: Number(Math.sqrt(BOUNDS[i] * BOUNDS[i + 1]).toFixed(3)), s, x0, y0, w: W / s, h: H / s, W, H });
}

const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
const lonX = (lon) => TRANSLATE[0] + SCALE * ((lon * Math.PI) / 180);
const latY = (lat) => TRANSLATE[1] - SCALE * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
let GRAT = "";
for (let lon = -150; lon <= 40; lon += 10) GRAT += `M${lonX(lon).toFixed(2)},-400L${lonX(lon).toFixed(2)},2400`;
for (let lat = -70; lat <= 80; lat += 10) GRAT += `M-400,${latY(lat).toFixed(2)}L1500,${latY(lat).toFixed(2)}`;


// -- relief: the engraved hills of central Mexico (close levels only) ---------------
// A vintage chart's molehills on the real ranges; they shrink with the land and
// are gone by k ~2.8. Peaks are the volcanoes round the Valley; chains follow
// the three Sierra Madres. Positions are the ranges' real axes, the spacing is
// the engraver's.
const PEAKS = [
  [-103.61, 19.56], // Nevado de Colima
  [-102.31, 19.42], // Tancitaro
  [-99.76, 19.11], // Nevado de Toluca
  [-98.64, 19.18], // Iztaccihuatl
  [-98.62, 18.98], // Popocatepetl
  [-98.03, 19.23], // La Malinche
  [-97.15, 19.5], // Cofre de Perote
  [-97.27, 19.03], // Pico de Orizaba
];
const CHAINS = [
  // Sierra Madre Oriental
  [[-100.6, 25.3], [-100.0, 24.0], [-99.5, 22.8], [-99.1, 21.7], [-98.5, 20.8], [-97.9, 20.15]],
  // Sierra Madre del Sur
  [[-103.3, 18.75], [-101.8, 18.05], [-100.3, 17.6], [-98.8, 17.25], [-97.4, 16.7], [-96.3, 16.3]],
  // Sierra Madre Occidental (its south end)
  [[-106.0, 24.6], [-105.2, 23.2], [-104.6, 22.0], [-104.2, 21.0]],
  // the volcanic belt between the peaks
  [[-101.6, 19.75], [-100.7, 19.6]],
  // Sierra Norte de Oaxaca / Chiapas highlands
  [[-96.7, 17.75], [-96.0, 17.25]],
  [[-93.2, 16.95], [-92.2, 16.2]],
];
const HILLS = []; // [x, y, size (world px)]
for (const ll of PEAKS) HILLS.push([...P(ll), 4.3]);
{
  let seed = 1519;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0), seed / 4294967296);
  const STEP = 5.4; // world px between hills along a chain
  for (const ch of CHAINS) {
    const pts = ch.map(P);
    let carry = STEP * 0.3;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let t = carry;
      while (t <= d) {
        const nx = -(b[1] - a[1]) / d;
        const ny = (b[0] - a[0]) / d;
        const j = (rnd() - 0.5) * 2.6;
        HILLS.push([a[0] + ((b[0] - a[0]) * t) / d + nx * j, a[1] + ((b[1] - a[1]) * t) / d + ny * j, 3.1 + rnd() * 0.7]);
        t += STEP;
      }
      carry = t - d;
    }
  }
  HILLS.sort((p, q) => p[1] - q[1]); // the nearer hill overlaps the farther
}
/** one molehill, unit width, foot on y 0: the outline (filled with land, so it hides what is behind) and its shade strokes */
const HILL_OUT = "M-0.5,0C-0.3,-0.1 -0.16,-0.4 0,-0.64C0.15,-0.42 0.32,-0.12 0.5,0";
const HILL_SHADE = "M0.07,-0.47L0.0,-0.05M0.17,-0.32L0.11,-0.03M0.27,-0.19L0.23,-0.02M0.37,-0.09L0.35,-0.01";
console.log(`hills: ${HILLS.length}`);

mkdirSync(DIR, { recursive: true });
for (const L of LEVELS) {
  const t0 = Date.now();
  const KB = L.kBake;
  const M = 60 / KB; // clip margin, world px (the water-lines reach 30 screen px offshore)
  const proj = geoMercator()
    .scale(SCALE)
    .translate(TRANSLATE)
    .clipExtent([
      [L.x0 - M, L.y0 - M],
      [L.x0 + L.w + M, L.y0 + L.h + M],
    ]);
  const lonLo = proj.invert([L.x0 - M, 0])[0];
  const lonHi = proj.invert([L.x0 + L.w + M, 0])[0];
  const latHi = proj.invert([0, L.y0 - M])[1];
  const latLo = proj.invert([0, L.y0 + L.h + M])[1];
  const digits = L.s > 4 ? 3 : 2;
  const landSink = pathSink(0.35 / L.s, digits);
  const wlSink = pathSink(0.6 / L.s, digits);
  const landPath = geoPath(proj, landSink);
  const wlPath = geoPath(proj, wlSink);
  const bounds = geoPath(proj);
  let n = 0;
  for (const p of polys) {
    if (p.box[2] < lonLo || p.box[0] > lonHi || p.box[3] < latLo || p.box[1] > latHi) continue;
    const g = { type: "Polygon", coordinates: p.rings };
    landPath(g);
    n++;
    // water-lines only round land big enough to carry them (no blobs round specks)
    const b = bounds.bounds(g);
    if (Number.isFinite(b[0][0]) && Math.hypot(b[1][0] - b[0][0], b[1][1] - b[0][1]) * KB >= 9) wlPath(g);
  }
  const LAND_D = landSink.result();
  const WL_D = wlSink.result();
  const w = (v) => v / KB;
  const wlGap = 6.5 * Math.pow(KB, 0.45);
  const wlOp = [0.3, 0.2, 0.12, 0.065];
  let wl = "";
  for (let i = 3; i >= 0; i--) {
    const d = wlGap * (i + 1);
    wl += `<path d="${WL_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${w(2 * d + 1.15)}" stroke-linejoin="round"/>`;
    wl += `<path d="${WL_D}" fill="none" stroke="${SEA}" stroke-width="${w(2 * d - 1.15)}" stroke-linejoin="round"/>`;
  }
  // the lake: water, one fine shore-line inside it once it is big enough to carry one
  const lakeWl =
    KB > 3
      ? `<g clip-path="url(#lake)"><path d="${LAKE_D}" fill="none" stroke="${mix(SEA, INK, 0.26)}" stroke-width="${w(1.1)}" stroke-linejoin="round" transform="translate(0 0)"/><path d="${LAKE_D}" fill="none" stroke="${SEA}" stroke-width="${w(5)}" stroke-linejoin="round" stroke-opacity="0"/></g>`
      : "";
  // the hills: full on the closest level, thinning out on the two before it
  const hillOp = KB > 6 ? 0.62 : KB > 4.5 ? 0.5 : KB > 3 ? 0.3 : 0;
  let hills = "";
  if (hillOp > 0) {
    for (const [x, y, sz] of HILLS) {
      hills += `<g transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${sz})"><path d="${HILL_OUT}" fill="${LAND}" stroke="${INK}" stroke-width="${w(1.5) / sz}" stroke-linejoin="round" stroke-linecap="round"/><path d="${HILL_SHADE}" fill="none" stroke="${INK}" stroke-width="${w(1.05) / sz}" stroke-linecap="round"/></g>`;
    }
    hills = `<g opacity="${hillOp}">${hills}</g>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}" viewBox="${L.x0} ${L.y0} ${L.w} ${L.h}">
<defs><clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath><clipPath id="lake"><path d="${LAKE_D}"/></clipPath></defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRAT}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${w(1.2)}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${w(28)}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${w(10)}" stroke-linejoin="round"/>
  <path d="${GRAT}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${w(1.2)}"/>
</g>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${w(1.5)}" stroke-linejoin="round"/>
${hills}
<path d="${LAKE_D}" fill="${SEA}"/>
${lakeWl}
<path d="${LAKE_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${w(Math.min(1.5, 0.5 + 0.2 * KB))}" stroke-linejoin="round"/>
</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: "original" }, shapeRendering: 2 }).render().asPng();
  writeFileSync(`${DIR}/${L.name}.png`, png);
  console.log(
    `${L.name}: k ${L.kIn.toFixed(2)}.. bake ${KB}  s ${L.s}  rect (${L.x0}, ${L.y0}) ${L.w.toFixed(0)} x ${L.h.toFixed(0)}  ${L.W} x ${L.H} px  ${n} polys  land ${(LAND_D.length / 1e6).toFixed(2)} MB  ${((Date.now() - t0) / 1000).toFixed(1)} s  ${(png.length / 1e6).toFixed(2)} MB`,
  );
}

// -- the carrera track -------------------------------------------------------------
const WAY = [
  [-5.99, 37.39], // Seville
  [-6.2, 37.05], // down the Guadalquivir
  [-6.36, 36.78], // Sanlucar de Barrameda, the bar
  [-8.6, 35.2],
  [-12.6, 31.2],
  [-16.0, 28.5], // the Canaries (between Gran Canaria and Tenerife)
  [-18.6, 26.6],
  [-26.0, 22.6], // the trades
  [-38.0, 18.6],
  [-50.0, 16.4],
  [-61.35, 15.95], // the Dominica / Guadeloupe passage
  [-66.5, 16.3],
  [-72.0, 16.9], // south of Hispaniola
  [-77.6, 17.25], // south of Jamaica
  [-82.4, 19.2], // past the Caymans
  [-85.9, 21.75], // the Yucatan Channel
  [-88.6, 22.55], // north of Yucatan
  [-91.6, 21.9],
  [-94.2, 20.4],
  [-96.13, 19.2], // Veracruz
];
const catmull = (pts, perSeg = 40) => {
  const ext = [[2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]], ...pts, [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]]];
  const out = [pts[0]];
  const knot = (p, q) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let s = 1; s <= perSeg; s++) {
      const t = t1 + ((t2 - t1) * s) / perSeg;
      const lerp = (A, B, ta, tb) => [((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0], ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1]];
      const A1 = lerp(p0, p1, 0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, 0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
  }
  return out;
};
const dense = catmull(WAY.map(P));
// resample at 1 world px, stop where the lead ship's bow meets the ring
const STOP_R = RING_R + SHIP_HALF + 5;
const route = [dense[0]];
{
  let carry = 0;
  let done = false;
  for (let i = 1; i < dense.length && !done; i++) {
    const a = dense[i - 1];
    const b = dense[i];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let t = 1 - carry;
    while (t <= d) {
      const p = [a[0] + ((b[0] - a[0]) * t) / d, a[1] + ((b[1] - a[1]) * t) / d];
      if (Math.hypot(p[0] - RING_W[0], p[1] - RING_W[1]) <= STOP_R) {
        done = true;
        break;
      }
      route.push(p);
      t += 1;
    }
    carry = d - (t - 1);
    if (carry >= 1) carry = 0;
  }
}
const routeLen = route.length - 1;
// the track must stay at sea (past the river mouth)
{
  const l50 = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
  const land50 = feature(l50, l50.objects.land);
  let wet = 0;
  let dry = [];
  for (let i = 0; i < route.length; i += 4) {
    const ll = base.invert(route[i]);
    if (geoContains(land50, ll)) dry.push(`${i}:${ll.map((v) => v.toFixed(1))}`);
    else wet++;
  }
  console.log(`track: ${routeLen} world px, ${wet} sea samples, on land: ${dry.join(" ") || "none"}`);
}
const r2 = (v) => Math.round(v * 100) / 100;
const sev = P(WAY[0]);
console.log(`Seville (${sev.map(r2)})  track end (${route[route.length - 1].map(r2)})  pivot (${PIVOT.map(r2)})`);

const body = `// Generated by scripts/build-texcoco-atlantic-map.mjs — do not edit by hand.
// THE ATLANTIC WORLD of ClosedWorlds: north-up Mercator, ${PX_PER_DEG} world px per degree
// of longitude; world px == screen px at the settled wide (k 1). Natural Earth
// 10m land (world-atlas), no borders; the Valley of Mexico lakes of 1519 from
// scripts/cortes-geo.json. The static stack is baked to public/texcoco-atlantic/.

export type P2 = [number, number];
export type Level = { name: string; kIn: number; kFull: number; kBake: number; s: number; x0: number; y0: number; w: number; h: number; W: number; H: number };

export const PROJ = { scale: ${SCALE}, translate: [${TRANSLATE[0]}, ${TRANSLATE[1]}] as P2 };
/** the ring of their world: Tenochtitlan, and its radius (world px; ${(RING_R / PX_PER_DEG).toFixed(2)} deg) */
export const RING_C: P2 = [${RING_W[0]}, ${RING_W[1]}];
export const RING_R = ${RING_R};
/** the camera is a pure zoom about this point (screen == world at k 1), from K0 down to 1 */
export const PIVOT: P2 = [${PIVOT[0]}, ${PIVOT[1]}];
export const K0 = ${K0};
export const K_MIN = ${K_MIN};
export const SEVILLE: P2 = [${r2(sev[0])}, ${r2(sev[1])}];
/** the Carrera de Indias, Seville -> the ring's edge, one sample per world px (arclength == index) */
export const ROUTE: P2[] = ${JSON.stringify(route.map(([x, y]) => [r2(x), r2(y)]))};
export const ROUTE_LEN = ${routeLen};
/** the raster pyramid, wide -> close: level i fades in over k kIn..kFull above the one before */
export const LEVELS: Level[] = ${JSON.stringify(LEVELS, null, 1)};
`;
writeFileSync(OUT, body);
console.log(`Wrote ${OUT}`);
