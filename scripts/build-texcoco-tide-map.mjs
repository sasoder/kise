// Builds AND bakes the one chart of ClosedWorldsTide (Si Sheppard, "Texcoco"):
// the Americas to New Zealand on one north-up Mercator, the SAME world as
// scripts/build-texcoco-atlantic-map.mjs (9 world px per degree, Tenochtitlan at
// (130, 980)) carried on east, as a raster LOD pyramid cut to what the camera
// (generated/components/tideCamera.ts) actually sees.
//
//   bun scripts/build-texcoco-tide-map.mjs      (re-run after any camera change)
//
// Writes
//   public/texcoco-tide/<tile>.png               lod-0 (the whole journey), then
//                                                close tiles for Mexico (mex-1..5)
//                                                and Oceania (oce-1..2)
//   generated/components/texcocoTideMapData.ts   tiles, the carrera track (copied
//                                                from texcocoAtlanticMapData), the
//                                                Mexico slots, the Oceania dots
//
// THE STATIC STACK is the Dwarkesh map style's: sea, 4 engraved water-lines, 10 deg
// graticule, land + hand-coloured rim, cream coast. Natural Earth 10m land, no
// borders. Antarctica is kept (clamped at 84.5 S) so the wide crossing of the
// Indian Ocean has a southern shore instead of an empty lower frame.
//
// THE OCEANIA DOTS are the SAME dots as MinorityInOwnCountry (oceaniaMapData.ts:
// 19 + 481 and 18 + 83), carried from its Lambert conic to this Mercator through
// lon/lat; each keeps the local scale between the two charts, so a dot is drawn
// as large against its coast as it was there.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoArea, geoConicConformal, geoContains, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { AUS_CREAM, AUS_ORANGE, NZ_CREAM, NZ_CREAM_NORTH, NZ_ORANGE } from "../generated/components/oceaniaMapData";
import { ROUTE as CARRERA } from "../generated/components/texcocoAtlanticMapData";
import { DURATION, FRAME_H, FRAME_W, cameraAt } from "../generated/components/tideCamera";
import { P as PM, PROJ, RING_C, VERACRUZ, lonLatOf } from "../generated/components/tideGeo";

const OUT = "generated/components/texcocoTideMapData.ts";
const DIR = "public/texcoco-tide";
const SCALE = PROJ.scale;
const TRANSLATE = PROJ.translate;
const K0 = 9;
const P = (ll) => PM(ll[0], ll[1]);

// -- geometry ------------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
const polys = [];
const ANTARCTICA = [];
for (const f of land.features) {
  const g = f.geometry;
  const list = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (let rings of list) {
    let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const [lon, lat] of rings[0]) {
      x0 = Math.min(x0, lon);
      x1 = Math.max(x1, lon);
      y0 = Math.min(y0, lat);
      y1 = Math.max(y1, lat);
    }
    // Antarctica wraps the pole: d3 would flood the sphere, so it is projected by hand as a
    // plain planar polygon, clamped at 84.5 S (a finite southern shore)
    if (x1 - x0 > 350 && y1 < -60) {
      const ring = rings[0].slice(0, -1).map(([lon, lat]) => P([lon, Math.max(lat, -84.5)]));
      // it runs once round the world, 180 W -> 180 E: close it far below the chart
      ring.push([ring[ring.length - 1][0], 3400], [ring[0][0], 3400]);
      ANTARCTICA.push(ring);
      continue;
    }
    // degenerate specks (zero spherical area reads as the whole sphere and floods the fill)
    if (geoArea({ type: "Polygon", coordinates: rings }) > 6) continue;
    polys.push({ rings, box: [x0, y0, x1, y1] });
  }
}
console.log(`land polygons: ${polys.length}`);

const GEO = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));
const lakeRing = GEO.lake_texcoco_1519.rings[0].map(P);
const LAKE_D = `M${lakeRing.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}Z`;

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

// -- the tiles: what the camera sees at each zoom band ------------------------------
let K_MIN = Infinity;
let K_MAX = 0;
for (let f = 0; f <= DURATION - 1; f += 0.25) {
  K_MIN = Math.min(K_MIN, cameraAt(f).k);
  K_MAX = Math.max(K_MAX, cameraAt(f).k);
}
const BOUNDS = [K_MIN * 0.97, 1.44, 2.08, 3.1, 4.33, 6.24, K0 * 1.012];
/** frames before this belong to the Mexico cluster, after to Oceania */
const SPLIT = 120;
const LEVELS = [];
for (let i = 0; i < BOUNDS.length - 1; i++) {
  const kIn = i === 0 ? 0 : BOUNDS[i] * 0.93;
  const kFull = i === 0 ? 0 : BOUNDS[i];
  for (const cluster of i === 0 ? ["all"] : ["mex", "oce"]) {
    let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
    let kc = 0;
    for (let f = 0; f <= DURATION - 1; f += 0.25) {
      if (cluster === "mex" && f >= SPLIT) continue;
      if (cluster === "oce" && f < SPLIT) continue;
      const c = cameraAt(f);
      if (c.k < kIn) continue;
      kc = Math.max(kc, c.k);
      const pad = 8 / c.k;
      x0 = Math.min(x0, c.cx - FRAME_W / 2 / c.k - pad);
      x1 = Math.max(x1, c.cx + FRAME_W / 2 / c.k + pad);
      y0 = Math.min(y0, c.cy - FRAME_H / 2 / c.k - pad);
      y1 = Math.max(y1, c.cy + FRAME_H / 2 / c.k + pad);
    }
    if (!Number.isFinite(x0)) continue;
    // texels per world px: sharp up to the next band, or up to the closest this cluster ever gets
    const kTop = i === 0 ? BOUNDS[1] : Math.min(BOUNDS[i + 1], kc * 1.01);
    const s = Number((1.12 * kTop).toFixed(3));
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    const W = Math.ceil((x1 - x0) * s);
    const H = Math.ceil((y1 - y0) * s);
    const name = i === 0 ? "lod-0" : `${cluster}-${i}`;
    LEVELS.push({ name, cluster, kIn, kFull, kBake: Number(Math.sqrt(BOUNDS[i] * kTop).toFixed(3)), s, x0, y0, w: W / s, h: H / s, W, H });
  }
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
for (let lon = -170; lon <= 200; lon += 10) GRAT += `M${lonX(lon).toFixed(2)},-600L${lonX(lon).toFixed(2)},3000`;
for (let lat = -80; lat <= 80; lat += 10) GRAT += `M-800,${latY(lat).toFixed(2)}L3200,${latY(lat).toFixed(2)}`;

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
  // (linear in x: proj.invert would wrap past 180 E)
  const lonLo = lonLatOf([L.x0 - M, 0])[0];
  const lonHi = lonLatOf([L.x0 + L.w + M, 0])[0];
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
  if (L.y0 + L.h + M > 1900) {
    for (const sink of [landSink, wlSink]) {
      for (const ring of ANTARCTICA) {
        ring.forEach(([x, y], i) => (i === 0 ? sink.moveTo(x, y) : sink.lineTo(x, y)));
        sink.closePath();
      }
    }
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
  const hillOp = L.cluster !== "mex" ? 0 : KB > 6 ? 0.62 : KB > 4.5 ? 0.5 : KB > 3 ? 0.3 : 0;
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


// -- Mexico: where the arrivals stand (illustrative, no claimed ratio) --------------------
// a jittered hex grid on land round Veracruz, nearest first: inside the ring, then round it
const r2 = (v) => Math.round(v * 100) / 100;
const MEX_SPACING = 9.6;
const MEX_N = 190;
const mexLand = { type: "FeatureCollection", features: polys.filter((p) => p.box[2] > -125 && p.box[0] < -70 && p.box[3] > 3 && p.box[1] < 38).map((p) => ({ type: "Feature", geometry: { type: "Polygon", coordinates: p.rings } })) };
const mexSlots = [];
{
  let seed = 1519;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0), seed / 4294967296);
  const dy = MEX_SPACING * 0.866;
  let row = 0;
  for (let y = RING_C[1] - 170; y <= RING_C[1] + 170; y += dy, row++) {
    for (let x = RING_C[0] - 170 + (row % 2 ? MEX_SPACING / 2 : 0); x <= RING_C[0] + 190; x += MEX_SPACING) {
      const q = [x + (rnd() - 0.5) * 2.2, y + (rnd() - 0.5) * 2.2];
      // on land, with a little shore to stand on (the dot's own radius, four ways)
      const dry = [[0, 0], [3.4, 0], [-3.4, 0], [0, 3.4], [0, -3.4]].every(([ax, ay]) => geoContains(mexLand, lonLatOf([q[0] + ax, q[1] + ay])));
      if (dry) mexSlots.push(q);
    }
  }
  mexSlots.sort((a, b) => Math.hypot(a[0] - VERACRUZ[0], a[1] - VERACRUZ[1]) - Math.hypot(b[0] - VERACRUZ[0], b[1] - VERACRUZ[1]));
  mexSlots.length = Math.min(MEX_N, mexSlots.length);
  const inRing = mexSlots.filter((q) => Math.hypot(q[0] - RING_C[0], q[1] - RING_C[1]) < 46).length;
  console.log(`Mexico slots: ${mexSlots.length} (${inRing} inside the ring), farthest ${Math.hypot(mexSlots[mexSlots.length - 1][0] - VERACRUZ[0], mexSlots[mexSlots.length - 1][1] - VERACRUZ[1]).toFixed(0)} px from Veracruz`);
}

// -- Oceania: MinorityInOwnCountry's dots, from its Lambert conic to this Mercator -----
const lcc = geoConicConformal().parallels([-18, -36]).rotate([-150, 0]).center([0, -28]);
lcc.scale(1).translate([0, 0]);
{
  const W_PT = [113.15, -26.15];
  const E_PT = [178.55, -37.69];
  const S_PT = [146.8, -43.64];
  const a = lcc(W_PT);
  const b = lcc(E_PT);
  lcc.scale((1056 - 26) / (b[0] - a[0]));
  const a2 = lcc(W_PT);
  const s2 = lcc(S_PT);
  lcc.translate([26 - a2[0], 1000 - s2[1]]);
}
/** [x, y, world px here per world px there] */
const carry = ([x, y]) => {
  const m = P(lcc.invert([x, y]));
  const m2 = P(lcc.invert([x + 1, y]));
  return [r2(m[0]), r2(m[1]), Math.round(Math.hypot(m2[0] - m[0], m2[1] - m[1]) * 1000) / 1000];
};
const OCE = { AUS_ORANGE: AUS_ORANGE.map(carry), AUS_CREAM: AUS_CREAM.map(carry), NZ_ORANGE: NZ_ORANGE.map(carry), NZ_CREAM: NZ_CREAM.map(carry) };
console.log(`Oceania dots: AUS ${OCE.AUS_ORANGE.length} + ${OCE.AUS_CREAM.length}, NZ ${OCE.NZ_ORANGE.length} + ${OCE.NZ_CREAM.length}; scale ${Math.min(...OCE.AUS_CREAM.map((q) => q[2])).toFixed(3)}..${Math.max(...OCE.NZ_CREAM.map((q) => q[2])).toFixed(3)}`);

const body = `// Generated by scripts/build-texcoco-tide-map.mjs — do not edit by hand.
// THE CHART of ClosedWorldsTide: north-up Mercator, 9 world px per degree of longitude,
// the Americas to New Zealand (tideGeo.ts has the projection). Natural Earth 10m land,
// no borders. The static stack is baked to public/texcoco-tide/ for the camera of
// tideCamera.ts: re-run the script after any camera change.

export type P2 = [number, number];
export type P3 = [number, number, number];
export type Level = { name: string; cluster: "all" | "mex" | "oce"; kIn: number; kFull: number; kBake: number; s: number; x0: number; y0: number; w: number; h: number; W: number; H: number };

/** frames before this draw the Mexico tiles, after it the Oceania tiles */
export const SPLIT = ${SPLIT};
/** the raster tiles, wide -> close: a tile fades in over k kIn..kFull above the one before */
export const LEVELS: Level[] = ${JSON.stringify(LEVELS, null, 1)};
/** the Carrera de Indias, Seville -> the ring's edge, one sample per world px (arclength == index); from texcocoAtlanticMapData */
export const ROUTE: P2[] = ${JSON.stringify(CARRERA)};
export const ROUTE_LEN = ${CARRERA.length - 1};
/** Mexico: where the arrivals stand, nearest Veracruz first (ILLUSTRATIVE: no ratio is claimed) */
export const MEX_SLOTS: P2[] = ${JSON.stringify(mexSlots.map(([x, y]) => [r2(x), r2(y)]))};
/** Oceania, the dots of MinorityInOwnCountry: [x, y, local scale]. Australia: 19 orange + 481 cream = 500 (3.8 %) */
export const AUS_ORANGE: P3[] = ${JSON.stringify(OCE.AUS_ORANGE)};
export const AUS_CREAM: P3[] = ${JSON.stringify(OCE.AUS_CREAM)};
/** New Zealand: 18 orange + 83 cream = 101 (17.8 %) */
export const NZ_ORANGE: P3[] = ${JSON.stringify(OCE.NZ_ORANGE)};
export const NZ_CREAM: P3[] = ${JSON.stringify(OCE.NZ_CREAM)};
/** the first NZ_CREAM_NORTH of NZ_CREAM stand on the North Island */
export const NZ_CREAM_NORTH = ${NZ_CREAM_NORTH};
`;
writeFileSync(OUT, body);
console.log(`Wrote ${OUT}`);
