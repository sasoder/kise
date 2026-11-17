// GrantsAcrossTheWorld (shruti-trailer, cut 42): bake the world-map sheet and the grant flights.
//
//   bun scripts/clips/shruti-trailer/GrantsAcrossTheWorld-bake.mjs
//
// 1. The map: world-atlas land-50m (Natural Earth 1:50m, public domain) in a plate-carree (equirectangular) projection
//    centred on lon 10 (lon -170..190), cropped to lat LAT_TOP..LAT_BOTTOM (no Antarctica), printed as black ink on
//    an off-white sheet with a 30-degree graticule and a double neat line. Rasterised with resvg at SUPER px per world
//    px -> public/shruti-trailer/GrantsAcrossTheWorld_map.png (the sheet only; the cut draws its hard shadow).
// 2. The grants: ~190 destinations jittered round real cities (ANCHORS, India dense: EV India is Shruti's programme),
//    each kept only if it and a ring of points 1.3 deg round it are on land (d3 geoContains on the same land), with a
//    minimum spacing; one launch schedule (a smooth rising-then-tapering rate, inverse CDF, no bursts); each flight a
//    quadratic arc from Arlington, VA (Emergent Ventures is run from the Mercatus Center there) bowed upward.
//    -> generated/components/shruti-trailer/GrantsAcrossTheWorldData.ts (map px: the map's top-left is 0, 0).
// Deterministic: a seeded mulberry32, no Math.random.
import { Resvg } from "@resvg/resvg-js";
import { geoContains, geoEquirectangular, geoGraticule, geoPath } from "d3-geo";
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const MAP_W = 1620; // world px
const LAT_TOP = 82;
const LAT_BOTTOM = -57;
const PX_PER_DEG = MAP_W / 360;
const MAP_H = (LAT_TOP - LAT_BOTTOM) * PX_PER_DEG;
const MARGIN = 30; // sheet margin round the map, world px
const SUPER = 2.25; // png px per world px (k <= 1.06 at --scale 2)
const SHEET = "#DAD6CD"; // the print paper
const LAND = "#111111"; // the ink
const GRAT = "#B9B4AA";

const SOURCE = { name: "Arlington, VA (Mercatus Center)", lon: -77.09, lat: 38.88 };

const proj = geoEquirectangular()
  .rotate([-10, 0])
  .scale(MAP_W / (2 * Math.PI))
  .translate([MAP_W / 2, LAT_TOP * PX_PER_DEG])
  .clipExtent([
    [0, 0],
    [MAP_W, MAP_H],
  ])
  .precision(0.1);

const topo = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const land = feature(topo, topo.objects.land);
// drop Antarctica (every polygon whose first point is south of -60)
const landNoAnt = {
  type: "Feature",
  properties: {},
  geometry: { type: "MultiPolygon", coordinates: land.features[0].geometry.coordinates.filter((poly) => poly[0][0][1] > -60) },
};
const path = geoPath(proj);
const landD = path(landNoAnt);
const gratD = path(geoGraticule().step([30, 30])());

// ---- the sheet -------------------------------------------------------------------------------------------------
const SW = MAP_W + 2 * MARGIN;
const SH = MAP_H + 2 * MARGIN;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">
  <rect x="0" y="0" width="${SW}" height="${SH}" fill="${SHEET}"/>
  <g transform="translate(${MARGIN} ${MARGIN})">
    <path d="${gratD}" fill="none" stroke="${GRAT}" stroke-width="1.6"/>
    <path d="${landD}" fill="${LAND}" fill-rule="evenodd"/>
    <rect x="0" y="0" width="${MAP_W}" height="${MAP_H}" fill="none" stroke="${LAND}" stroke-width="2.4"/>
    <rect x="-9" y="-9" width="${MAP_W + 18}" height="${MAP_H + 18}" fill="none" stroke="${LAND}" stroke-width="1.2"/>
  </g>
</svg>`;
const png = new Resvg(svg, { fitTo: { mode: "zoom", value: SUPER }, shapeRendering: 2 }).render().asPng();
writeFileSync("public/shruti-trailer/GrantsAcrossTheWorld_map.png", png);
console.log(`map sheet ${SW} x ${SH.toFixed(1)} world px -> ${Math.round(SW * SUPER)} x ${Math.round(SH * SUPER)} png`);

// ---- seeded random ---------------------------------------------------------------------------------------------
const mulberry = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = mulberry(4211600);
const gauss = () => {
  const u = Math.max(1e-9, rnd());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
};

// ---- destinations ----------------------------------------------------------------------------------------------
// [name, lon, lat, count, spread deg (sigma), inland ring deg (default 1.3; smaller for narrow land: NZ, Japan, Italy)]
const ANCHORS = [
  // India (dense)
  ["Delhi", 77.2, 28.6, 8, 1.3], ["Mumbai", 72.9, 19.1, 7, 0.9], ["Bengaluru", 77.6, 12.97, 8, 0.9],
  ["Chennai", 80.0, 13.0, 4, 0.7, 0.9], ["Hyderabad", 78.5, 17.4, 5, 0.9], ["Kolkata", 88.2, 22.7, 4, 0.8],
  ["Pune", 73.9, 18.5, 3, 0.6, 0.9], ["Ahmedabad", 72.6, 23.0, 3, 0.8], ["Jaipur", 75.8, 26.9, 3, 0.9],
  ["Lucknow", 80.9, 26.8, 3, 1.0], ["Kochi", 76.5, 10.0, 2, 0.5, 0.8], ["Bhopal", 77.4, 23.3, 2, 1.0],
  ["Guwahati", 91.7, 26.1, 2, 0.6], ["Chandigarh", 76.8, 30.7, 2, 0.7], ["Patna", 85.1, 25.6, 2, 0.8],
  ["Bhubaneswar", 85.6, 20.4, 2, 0.6], ["Nagpur", 79.1, 21.1, 2, 0.8],
  // rest of South Asia
  ["Karachi", 67.3, 25.1, 1, 0.5], ["Lahore", 74.3, 31.5, 2, 0.7], ["Dhaka", 90.4, 23.8, 2, 0.5],
  ["Kathmandu", 85.3, 27.7, 1, 0.4], ["Colombo", 80.4, 7.3, 1, 0.2],
  // North America
  ["San Francisco", -121.9, 37.6, 4, 0.9], ["Los Angeles", -117.9, 34.2, 2, 0.8], ["Seattle", -122.1, 47.6, 1, 0.6],
  ["Austin", -97.7, 30.3, 2, 1.0], ["Chicago", -87.9, 41.9, 2, 0.8], ["Boston", -71.4, 42.4, 2, 0.4],
  ["Denver", -105, 39.7, 1, 1.0], ["Atlanta", -84.4, 33.7, 1, 0.8], ["Minneapolis", -93.3, 45, 1, 0.8],
  ["Toronto", -79.6, 43.8, 1, 0.4], ["Montreal", -73.7, 45.6, 1, 0.4], ["Vancouver", -122.8, 49.3, 1, 0.3],
  ["Calgary", -114, 51, 1, 0.8], ["Mexico City", -99.1, 19.4, 2, 0.8], ["Guatemala City", -90.5, 14.6, 1, 0.4],
  // South America
  ["Bogota", -74.1, 4.7, 1, 0.6], ["Lima", -76.9, -12, 1, 0.4], ["Sao Paulo", -46.8, -23.4, 2, 0.6],
  ["Rio de Janeiro", -43.4, -22.8, 1, 0.3], ["Buenos Aires", -58.6, -34.6, 2, 0.5], ["Santiago", -70.6, -33.4, 1, 0.4],
  ["Brasilia", -47.9, -15.8, 1, 0.8], ["Caracas", -66.9, 10.3, 1, 0.4], ["Quito", -78.4, -0.3, 1, 0.4],
  // Europe
  ["London", -0.6, 51.6, 4, 0.9], ["Paris", 2.35, 48.9, 2, 0.8], ["Berlin", 13.4, 52.5, 2, 0.8],
  ["Madrid", -3.7, 40.4, 1, 0.8], ["Rome", 12.6, 41.9, 1, 0.4, 0.7], ["Amsterdam", 5.1, 52.2, 1, 0.4],
  ["Stockholm", 17.8, 59.4, 1, 0.5], ["Warsaw", 21, 52.2, 1, 0.8], ["Kyiv", 30.5, 50.45, 1, 0.8],
  ["Istanbul", 29.2, 40.9, 1, 0.4], ["Athens", 23.7, 38.1, 1, 0.2, 0.5], ["Lisbon", -8.9, 38.9, 1, 0.3],
  ["Zurich", 8.5, 47.4, 1, 0.5], ["Dublin", -6.6, 53.3, 1, 0.4], ["Edinburgh", -3.5, 55.9, 1, 0.3],
  ["Helsinki", 25.0, 60.4, 1, 0.3], ["Bucharest", 26.1, 44.4, 1, 0.7], ["Vienna", 16.4, 48.2, 1, 0.6],
  ["Moscow", 37.6, 55.75, 1, 0.9], ["Tbilisi", 44.8, 41.7, 1, 0.4],
  // Africa
  ["Lagos", 3.6, 6.7, 3, 0.6], ["Abuja", 7.5, 9.1, 1, 0.8], ["Accra", -0.2, 5.8, 2, 0.4],
  ["Nairobi", 36.8, -1.3, 3, 0.7], ["Kampala", 32.6, 0.5, 1, 0.4], ["Addis Ababa", 38.7, 9.0, 1, 0.8],
  ["Cairo", 31.2, 30.0, 1, 0.5], ["Johannesburg", 28.0, -26.2, 2, 0.8], ["Cape Town", 18.8, -33.9, 1, 0.3],
  ["Kigali", 30.1, -1.95, 1, 0.3], ["Dakar", -16.9, 14.8, 1, 0.3], ["Dar es Salaam", 39.0, -6.9, 1, 0.3],
  ["Kinshasa", 15.3, -4.4, 1, 0.5], ["Casablanca", -7.4, 33.5, 1, 0.4], ["Lusaka", 28.3, -15.4, 1, 0.7],
  // Middle East and Central Asia
  ["Dubai", 55.4, 25.1, 1, 0.3], ["Tel Aviv", 34.9, 32.0, 1, 0.2], ["Riyadh", 46.7, 24.7, 1, 0.9],
  ["Tehran", 51.4, 35.7, 1, 0.7], ["Almaty", 76.9, 43.2, 1, 0.6],
  // East and South-East Asia
  ["Singapore", 103.8, 1.4, 1, 0.1], ["Kuala Lumpur", 101.7, 3.1, 1, 0.4], ["Jakarta", 106.8, -6.4, 1, 0.4],
  ["Manila", 121.1, 14.6, 1, 0.3, 0.6], ["Bangkok", 100.5, 13.9, 1, 0.6], ["Hanoi", 105.8, 21, 1, 0.5],
  ["Ho Chi Minh City", 106.7, 11.0, 1, 0.4], ["Tokyo", 139.6, 35.8, 2, 0.4, 0.7], ["Seoul", 127, 37.5, 1, 0.5],
  ["Beijing", 116.4, 39.9, 1, 0.8], ["Shanghai", 120.8, 31.2, 1, 0.5], ["Shenzhen", 113.9, 22.8, 1, 0.4],
  ["Taipei", 121.0, 24.9, 1, 0.3],
  // Oceania
  ["Sydney", 150.9, -33.8, 2, 0.4], ["Melbourne", 145, -37.7, 1, 0.4], ["Brisbane", 152.8, -27.5, 1, 0.4],
  ["Perth", 116.0, -31.95, 1, 0.3], ["Auckland", 174.8, -36.9, 1, 0.2, 0.45], ["Wellington", 175.3, -40.9, 1, 0.3, 0.45],
];

const onLand = (lon, lat) => geoContains(landNoAnt, [lon, lat]);
const inland = (lon, lat, ring = 1.3) => {
  if (!onLand(lon, lat)) return false;
  // the dot (r 4.8 world px ~ 1.07 deg) and its ring stay on the ink: 8 points 1.3 deg round it on land too
  for (let a = 0; a < 8; a++) {
    const t = (a * Math.PI) / 4;
    if (!onLand(lon + ring * Math.cos(t), lat + ring * Math.sin(t))) return false;
  }
  return true;
};
const [SX, SY] = proj([SOURCE.lon, SOURCE.lat]);
const dests = [];
const misses = [];
for (const [name, lon, lat, count, spread, ring] of ANCHORS) {
  const india = lon > 68 && lon < 98 && lat > 6 && lat < 36 && !["Karachi", "Lahore", "Dhaka", "Kathmandu", "Colombo"].includes(name);
  const minGap = india ? 8.5 : 12;
  let placed = 0;
  for (let tries = 0; placed < count && tries < 600; tries++) {
    const s = spread * (1 + tries / 100);
    const lo = lon + gauss() * s;
    const la = lat + gauss() * s * 0.8;
    if (!inland(lo, la, ring)) continue;
    const [x, y] = proj([lo, la]);
    if (x < 8 || x > MAP_W - 8 || y < 8 || y > MAP_H - 8) continue;
    if (Math.hypot(x - SX, y - SY) < 24) continue;
    if (dests.some((d) => Math.hypot(d.x - x, d.y - y) < minGap)) continue;
    dests.push({ name, india, lon: lo, lat: la, x, y });
    placed++;
  }
  if (placed < count) misses.push(`${name} ${placed}/${count}`);
}
if (misses.length) console.log("anchors short:", misses.join(", "));

// ---- order: a seeded shuffle, the first three far apart (already in flight at f0) ------------------------------
for (let i = dests.length - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  [dests[i], dests[j]] = [dests[j], dests[i]];
}
for (const [slot, name] of [[0, "London"], [1, "Bengaluru"], [2, "Sao Paulo"], [3, "Nairobi"]]) {
  const j = dests.findIndex((d, k) => k >= slot && d.name === name);
  if (j >= 0) [dests[slot], dests[j]] = [dests[j], dests[slot]];
}

// ---- the launch schedule: rate(t) launches per frame, one continuous rise and a taper to a trickle --------------
const T0 = -20;
const T1 = 96;
const smooth = (t) => t * t * (3 - 2 * t);
const rate = (t) => {
  if (t < T0) return 0;
  if (t < 0) return 0.15; // the pre-roll: two or three already in flight at f0
  if (t < 34) return 0.15 + 3.45 * smooth(t / 34); // a few -> peak by "1,600" (the landings peak on "grants")
  if (t < 44) return 3.6;
  if (t < 66) return 0.2 + 3.4 * (1 - smooth((t - 44) / 22)); // taper: the last big wave lands through "across the world"
  return 0.2; // a trickle keeps a few letters in flight to the end
};
const STEP = 0.01;
const cdf = [];
let acc = 0;
for (let t = T0; t <= T1; t += STEP) {
  acc += rate(t) * STEP;
  cdf.push([t, acc]);
}
const N = dests.length;
const launchAt = (q) => {
  const target = q * acc;
  let lo = 0;
  let hi = cdf.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cdf[m][1] < target) lo = m;
    else hi = m;
  }
  return cdf[hi][0];
};

// ---- flights ----------------------------------------------------------------------------------------------------
const D_MAX = 1150;
const flights = dests.map((d, i) => {
  const dx = d.x - SX;
  const dy = d.y - SY;
  const len = Math.hypot(dx, dy);
  let px = dy / len;
  let py = -dx / len;
  if (Math.abs(py) < 0.25) {
    // a near-vertical flight (south to South America): bow to a seeded side
    if (rnd() < 0.5) {
      px = -px;
      py = -py;
    }
  } else if (py > 0) {
    px = -px;
    py = -py;
  }
  const bulge = (0.07 + 0.3 * rnd()) * len;
  const cx = (SX + d.x) / 2 + px * bulge;
  const cy = Math.max(-30, (SY + d.y) / 2 + py * bulge);
  const launch = launchAt((i + 0.5) / N) + (rnd() - 0.5) * 0.6;
  const dur = 15 + 24 * Math.sqrt(Math.min(1, len / D_MAX));
  return { name: d.name, india: d.india, x: d.x, y: d.y, cx, cy, launch, dur, len };
});

// ---- stats ------------------------------------------------------------------------------------------------------
const lines = [];
for (const f of [0, 8, 20, 35, 45, 53, 65, 79, 91, 95, 104]) {
  const inFlight = flights.filter((g) => g.launch <= f && g.launch + g.dur > f).length;
  const landed = flights.filter((g) => g.launch + g.dur <= f).length;
  lines.push(`f${f}: ${inFlight} in flight, ${landed} landed`);
}
console.log(`${N} grants (${flights.filter((g) => g.india).length} in India); first landing f${Math.min(...flights.map((g) => g.launch + g.dur)).toFixed(1)}`);
console.log(lines.join("\n"));

// ---- write the data module --------------------------------------------------------------------------------------
const r2 = (v) => Math.round(v * 100) / 100;
const out = `// GENERATED by scripts/clips/shruti-trailer/GrantsAcrossTheWorld-bake.mjs: do not edit by hand.
// The world-map sheet (public/shruti-trailer/GrantsAcrossTheWorld_map.png) and the grant flights for
// GrantsAcrossTheWorld (shruti-trailer, cut 42). Map px: the map's top-left = 0, 0; plate carree centred on lon 10,
// lat ${LAT_TOP}..${LAT_BOTTOM}, ${PX_PER_DEG.toFixed(3)} px per degree. Land: world-atlas land-50m (Natural Earth, public domain).
export const GRANTS_MAP_W = ${MAP_W};
export const GRANTS_MAP_H = ${r2(MAP_H)};
export const GRANTS_MAP_MARGIN = ${MARGIN};
export const GRANTS_SHEET_W = ${SW};
export const GRANTS_SHEET_H = ${r2(SH)};
export const GRANTS_SHEET_PNG = "shruti-trailer/GrantsAcrossTheWorld_map.png";
/** ${SOURCE.name}: lon ${SOURCE.lon}, lat ${SOURCE.lat} */
export const GRANTS_SOURCE = { x: ${r2(SX)}, y: ${r2(SY)} };
/** one flight per grant: destination (x, y), quadratic control (cx, cy), launch frame, flight frames, India or not */
export type GrantFlight = { x: number; y: number; cx: number; cy: number; launch: number; dur: number; india: boolean };
export const GRANT_FLIGHTS: GrantFlight[] = [
${flights.map((g) => `  { x: ${r2(g.x)}, y: ${r2(g.y)}, cx: ${r2(g.cx)}, cy: ${r2(g.cy)}, launch: ${r2(g.launch)}, dur: ${r2(g.dur)}, india: ${g.india} }, // ${g.name}`).join("\n")}
];
`;
writeFileSync("generated/components/shruti-trailer/GrantsAcrossTheWorldData.ts", out);
console.log("wrote generated/components/shruti-trailer/GrantsAcrossTheWorldData.ts");
