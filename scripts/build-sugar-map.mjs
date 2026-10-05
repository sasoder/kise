// Bakes the geometry of THE SUGAR WORLD, the one shared map of the clip
// "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands" (Dwarkesh with
// Sarah Paine; Dwarkesh map style). Cuts A-E draw on this one world.
//
//   bun scripts/build-sugar-map.mjs
//
// Writes
//   generated/components/sugarStatic.ts   the heavy STATIC land (bake only:
//                                          scripts/bake-sugar-rasters.mjs)
//   generated/components/sugarMapData.ts  the light OVERLAYS (see sugarShared.tsx)
//
// THE PROJECTION is north-up MERCATOR (conformal, every meridian vertical; why
// not a conic at this width: scripts/build-atlantic-map.mjs). World px:
//   x = 40 (lon + 110),   y = 40 (M(68) - M(lat)),   M(lat) = ln tan(45 + lat/2) in degrees
// so 40 world px per degree of longitude (k = 1 = 40 screen px per degree: the
// eastern seaboard Maine -> Georgia fills the 9:16 column at k ~0.95). The page
// covers lon -110..100, lat -40..68 = world x 0..8400, y 0..5502.
//
// SOURCES (every URL):
//   Natural Earth 10m land + admin-0 countries (public domain) via the installed
//     world-atlas (land-10m.json, countries-10m.json). Coast of every fill = the
//     NE coast (the countries share the land layer's coast vertices; checked).
//   Natural Earth 10m lakes (public domain), filtered copy scripts/sugar-lakes.geojson
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson
//     (the Great Lakes etc. are cut out of the land; the IJsselmeer = the 1778 Zuiderzee).
//   Natural Earth 10m rivers (public domain), filtered copy scripts/sugar-rivers.geojson
//     https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson
//     (the lower Mississippi = Spanish Louisiana / British West Florida line).
//   US state outlines scripts/us-states-10m.json (us-atlas, US Census) for the 13
//     colonies and the US partition (their coasts re-cut to the NE coast: each
//     state's cell is dilated 0.1 deg into the sea and intersected with NE's USA).
//   aourednik/historical-basemaps world_1783.geojson (GPL-3.0), subset
//     scripts/sugar-1783-subset.geojson, https://github.com/aourednik/historical-basemaps
//     used only as CUTTERS: Spanish Louisiana vs New Spain west of the Mississippi,
//     EIC Bengal/Madras/India, Dutch Ceylon, Cape Colony, the Dutch East Indies.
//     Its "Quebec | France" and "Luisiana | France" are wrong for 1778 and unused as owners.
//
// 1778 POLITIES (groups; everything not listed is NEUTRAL, plain umber):
//   colonies  the 13, from their successor states: NH (+VT, the NH grants), MA (+ME),
//             RI, CT, NY, NJ, PA, DE, MD (+DC), VA (+WV), NC, SC, GA. Western claims
//             beyond these outlines are NOT drawn (KY, TN, north AL/MS stay neutral).
//   BRITISH   gb (Great Britain, Ireland, Man, the Channel Is.); britNA (Canada south
//             of 60.5 N - Quebec, Nova Scotia, Newfoundland, Rupert's Land - plus the
//             1774 Quebec Act's Ohio country: OH, IN, IL, MI, WI, MN east of the
//             Mississippi); wFlorida (1764 line 32 28' N, Mississippi -> Apalachicola,
//             incl. the Florida parishes north of Manchac / Lake Pontchartrain);
//             eFlorida; britCarib (Jamaica, Bahamas, Turks, Cayman, Barbados, Antigua,
//             St Kitts, Nevis, Montserrat, Anguilla, BVI, Dominica, Grenada, St Vincent
//             + Grenadines, Tobago); bermuda; gibraltar; menorca; britIndia (EIC Bengal,
//             Madras, the dataset's EIC "India" piece = Northern Circars etc.)
//   FRANCE    france (1778: Lorraine + Corsica in, Savoy + Nice out); frCarib
//             (Saint-Domingue, Martinique, Guadeloupe, St Lucia, St-Martin, St-Barth);
//             frGuiana; frIndian (Ile de France = Mauritius, Bourbon = Reunion)
//   SPAIN     spain (Spain - Menorca, + Canaries, Ceuta, Melilla); spCarib (Cuba,
//             Santo Domingo, Puerto Rico, Trinidad); spLouisiana (west of the
//             Mississippi + the Isle of Orleans); spNewSpain (Mexico, Central America,
//             the US south-west); spSouthAm (New Granada, Peru, Rio de la Plata)
//   DUTCH     dutch (the United Provinces = modern NL in Europe); dutchCarib (Curacao,
//             Aruba, Bonaire, St Eustatius, Saba, Sint Maarten); dutchGuiana (Suriname,
//             Essequibo/Demerara/Berbice = Guyana); dutchCape; dutchCeylon; dutchIndies
//   POSTS (points): see POSTS below (Goree, Pondicherry, Mahe, Karikal, Chandernagore,
//             Fort James, Saint-Louis (British 1758-79), Bombay, Belize, Black River,
//             Cochin).
// The Cape Verde Islands are PORTUGUESE (neutral). Approximations, stated: the MN
// Mississippi cutter is a hand polyline (Prescott - Minneapolis - St Cloud - Brainerd
// - Grand Rapids - Bemidji - Lake Itasca, then due north); the Manchac line is a
// hand polyline (Bayou Manchac, Lake Maurepas, Pass Manchac, Lake Pontchartrain, the
// Rigolets); the Apalachicola line likewise; Savoy/Nice is a hand polygon.

import { readFileSync, writeFileSync } from "node:fs";
import { feature, mesh } from "topojson-client";
import polygonClipping from "polygon-clipping";
import { Resvg } from "@resvg/resvg-js";

const OUT_STATIC = "generated/components/sugarStatic.ts";
const OUT = "generated/components/sugarMapData.ts";
const PC = polygonClipping;
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);

// ---------------------------------------------------------------------------
// PROJECTION
// ---------------------------------------------------------------------------
const PPD = 40;
const LON0 = -110;
const LON1 = 100;
const LAT0 = -40;
const LAT1 = 68;
const M = (lat) => (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
const MERC_TOP = M(LAT1);
const P = ([lon, lat]) => [PPD * (lon - LON0), PPD * (MERC_TOP - M(lat))];
const W_EXT = PPD * (LON1 - LON0);
const H_EXT = PPD * (MERC_TOP - M(LAT0));
log(`extent ${W_EXT} x ${H_EXT.toFixed(1)} world px`);

const r2 = (v) => Math.round(v * 100) / 100;
const n2 = (v) => {
  const r = Math.round(v * 50) / 50;
  return Object.is(r, -0) ? 0 : r;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---------------------------------------------------------------------------
// GEOMETRY HELPERS (lon/lat multipolygons in polygon-clipping form)
// ---------------------------------------------------------------------------
const mpOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const bboxRing = (r) => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of r) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
};
const bboxMP = (mp) => {
  let b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of mp) {
    const q = bboxRing(p[0]);
    b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])];
  }
  return b;
};
const bbHit = (a, b, m = 0) => a[0] - m <= b[2] && a[2] + m >= b[0] && a[1] - m <= b[3] && a[3] + m >= b[1];
const boxMP = ([x0, y0, x1, y1]) => [
  [
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
      [x0, y0],
    ],
  ],
];
const polyMP = (pts) => [[[...pts, pts[0]]]];
// Sutherland-Hodgman: one ring against an axis-aligned box (fallback when
// polygon-clipping chokes on a huge ring; zero-width bridges along the box edge are
// harmless for fills and lie outside the page)
const shRing = (ring, [x0, y0, x1, y1]) => {
  const edges = [
    (p) => p[0] >= x0,
    (p) => p[0] <= x1,
    (p) => p[1] >= y0,
    (p) => p[1] <= y1,
  ];
  const cut = [
    (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])],
    (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1],
  ];
  let pts = ring.slice(0, -1);
  for (let e = 0; e < 4 && pts.length; e++) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[(i + pts.length - 1) % pts.length];
      const b = pts[i];
      const ia = edges[e](a);
      const ib = edges[e](b);
      if (ib) {
        if (!ia) out.push(cut[e](a, b));
        out.push(b);
      } else if (ia) out.push(cut[e](a, b));
    }
    pts = out;
  }
  return pts.length >= 3 ? [...pts, pts[0]] : null;
};
// a ring across the antimeridian (Afro-Eurasia + Chukotka, Fiji): unwrap its seam
// jumps, then shift it so its median longitude lies in -180..180
const unwrapRing = (r) => {
  const out = [r[0].slice()];
  let off = 0;
  for (let i = 1; i < r.length; i++) {
    const d = r[i][0] - r[i - 1][0];
    if (d > 180) off -= 360;
    else if (d < -180) off += 360;
    out.push([r[i][0] + off, r[i][1]]);
  }
  const lons = out.map((q) => q[0]).sort((a, b) => a - b);
  const med = lons[lons.length >> 1];
  const sh = -360 * Math.round(med / 360);
  return out.map(([x, y]) => [x + sh, y]);
};
const clipBox = (mp, b) => {
  const res = [];
  for (let p of mp) {
    let q = bboxRing(p[0]);
    if (q[2] - q[0] > 300) {
      p = p.map(unwrapRing);
      q = bboxRing(p[0]);
    }
    if (!bbHit(q, b)) continue;
    if (q[0] >= b[0] && q[2] <= b[2] && q[1] >= b[1] && q[3] <= b[3]) {
      res.push(p);
      continue;
    }
    try {
      res.push(...PC.intersection([p], boxMP(b)));
    } catch {
      const rings = p.map((r) => shRing(r, b)).filter(Boolean);
      if (rings.length) res.push(rings);
    }
  }
  return res;
};
const polysWhere = (mp, pred) => mp.filter((p) => pred(bboxRing(p[0])));
const ringArea = (r) => {
  let s = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += r[j][0] * r[i][1] - r[i][0] * r[j][1];
  return s / 2;
};
const ringCentroid = (r) => {
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const c = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    A += c;
    cx += (r[j][0] + r[i][0]) * c;
    cy += (r[j][1] + r[i][1]) * c;
  }
  return [cx / (3 * A), cy / (3 * A)];
};
const dp = (pts, tol) => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let best = -1;
    let bd = tol;
    const [ax, ay] = pts[a];
    const dx = pts[b][0] - ax;
    const dy = pts[b][1] - ay;
    const l2 = dx * dx + dy * dy || 1e-18;
    for (let i = a + 1; i < b; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / l2));
      const d = Math.hypot(pts[i][0] - ax - t * dx, pts[i][1] - ay - t * dy);
      if (d > bd) [bd, best] = [d, i];
    }
    if (best >= 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
const simplifyMP = (mp, tol, minArea = 0) =>
  mp
    .map((p) => p.map((r) => dp(r, tol)).filter((r, i) => r.length >= 4 && (i > 0 || Math.abs(ringArea(r)) >= minArea)))
    .filter((p) => p.length && p[0].length >= 4);
const translate = (mp, dx, dy) => mp.map((p) => p.map((r) => r.map(([x, y]) => [x + dx, y + dy])));
const DIRS = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);
const dilate = (mp, r) => PC.union(mp, ...DIRS.map(([a, b]) => translate(mp, a * r, b * r)));
const union = (...mps) => {
  const ne = mps.filter((m) => m && m.length);
  return ne.length ? (ne.length === 1 ? ne[0] : PC.union(...ne)) : [];
};
const diff = (a, ...bs) => {
  const bb = bboxMP(a);
  const hit = bs.filter((b) => b && b.length && bbHit(bboxMP(b), bb));
  return a.length && hit.length ? PC.difference(a, ...hit) : a;
};
const inter = (a, b) => (a.length && b.length && bbHit(bboxMP(a), bboxMP(b)) ? PC.intersection(a, b) : []);
const pipRing = ([x, y], r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------
const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const usTopo = JSON.parse(readFileSync("scripts/us-states-10m.json", "utf8"));
const HB = JSON.parse(readFileSync("scripts/sugar-1783-subset.geojson", "utf8"));
const LAKES = JSON.parse(readFileSync("scripts/sugar-lakes.geojson", "utf8"));
const RIVERS = JSON.parse(readFileSync("scripts/sugar-rivers.geojson", "utf8"));
const BOX_LL = [LON0 - 2, LAT0 - 2, LON1 + 2, LAT1 + 2];

const COUNTRY = new Map(topo.objects.countries.geometries.map((g) => [g.properties.name, g]));
const country = (name) => {
  const g = COUNTRY.get(name);
  if (!g) throw new Error(`no country ${name}`);
  return clipBox(mpOf(feature(topo, g).geometry), BOX_LL);
};
const hb = (name) => {
  const f = HB.features.find((x) => x.properties.NAME === name);
  if (!f) throw new Error(`no 1783 feature ${name}`);
  return mpOf(f.geometry);
};
// the lakes, unioned (bays such as Georgian Bay / Saginaw Bay overlap their lakes)
const LAKES_MP = PC.union(...LAKES.features.map((f) => mpOf(f.geometry)));
const lakesNear = (mp) => {
  const b = bboxMP(mp);
  return LAKES_MP.filter((p) => bbHit(bboxRing(p[0]), b));
};
const noLakes = (mp) => {
  const l = lakesNear(mp);
  if (!l.length) return mp;
  try {
    return PC.difference(mp, l);
  } catch (e) {
    // polygon by polygon, so one bad polygon does not lose the rest
    return mp.flatMap((p) => {
      const ll = lakesNear([p]);
      if (!ll.length) return [p];
      try {
        return PC.difference([p], ll);
      } catch {
        console.warn(`noLakes: kept a polygon with lakes (bbox ${bboxRing(p[0]).map((v) => v.toFixed(1))})`);
        return [p];
      }
    });
  }
};

// ---------------------------------------------------------------------------
// LAND (lon/lat): NE 10m land in the box, minus the lakes, lightly simplified
// ---------------------------------------------------------------------------
let LAND_LL = [];
for (const f of feature(landTopo, landTopo.objects.land).features) LAND_LL.push(...clipBox(mpOf(f.geometry), BOX_LL));
log(`land polygons in box: ${LAND_LL.length}`);
LAND_LL = simplifyMP(LAND_LL, 0.0015, 2e-5);
log(`land after lakes + simplify: ${LAND_LL.length} polygons, ${LAND_LL.reduce((s, p) => s + p.reduce((t, r) => t + r.length, 0), 0)} vertices`);

const ringD = (r) => {
  let out = "";
  let prev = null;
  r.forEach((q, i) => {
    const p = P(q);
    if (i > 0 && i < r.length - 1 && prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) < 0.05) return;
    out += `${i === 0 ? "M" : "L"}${n2(p[0])},${n2(p[1])}`;
    prev = p;
  });
  return `${out}Z`;
};
const mpD = (mp) => mp.map((p) => p.map(ringD).join("")).join("");
// the lakes are holes by the even-odd rule (every lake lies inside a land polygon)
const LAKES_IN = simplifyMP(clipBox(LAKES_MP, BOX_LL), 0.0015);
const LAND_D = mpD(LAND_LL) + mpD(LAKES_IN);
// the wide land for the far levels: the frame at k < ~0.32 is taller than lat
// -40..68 and a world wide is ~200 deg across, so the far rasters run round the whole
// globe (lon -180..180 drawn again at +-360 by the bake as needed), lat -85..87
// (simplified 0.02 deg)
const BOX_WIDE = [-180, -85, 180, 87];
const LAND_WIDE = [];
for (const f of feature(landTopo, landTopo.objects.land).features) LAND_WIDE.push(...clipBox(mpOf(f.geometry), BOX_WIDE));
const LAND_WIDE_MP = [...simplifyMP(LAND_WIDE, 0.02, 0.002), ...simplifyMP(clipBox(LAKES_MP, BOX_WIDE), 0.02, 0.002)];
// copies shifted by -360 / +360 for the parts of the far levels past the antimeridian
const LAND_WIDE_D = [0, -360, 360]
  .map((dx) => mpD(LAND_WIDE_MP.filter((p) => (dx < 0 ? bboxRing(p[0])[0] > 150 : dx > 0 ? bboxRing(p[0])[2] < -150 : true)).map((p) => p.map((r) => r.map(([x, y]) => [x + dx, y])))))
  .join("");
log(`LAND_D ${(LAND_D.length / 1e6).toFixed(2)} MB`);

// ---------------------------------------------------------------------------
// THE MASK: land 255 / lake 128 / sea 0 at 1 texel per world px (classification)
// ---------------------------------------------------------------------------
const MW = Math.ceil(W_EXT);
const MH = Math.ceil(H_EXT);
const LAKES_D = mpD(LAKES_IN);
const maskPx = new Resvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}" height="${MH}" viewBox="0 0 ${MW} ${MH}"><rect width="${MW}" height="${MH}" fill="#000"/><path d="${LAKES_D}" fill="#808080" fill-rule="evenodd"/><path d="${LAND_D}" fill="#fff" fill-rule="evenodd"/></svg>`,
  { fitTo: { mode: "original" }, shapeRendering: 0 },
)
  .render()
  .pixels;
const maskAt = (x, y) => {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= MW || yi >= MH) return 0;
  return maskPx[(yi * MW + xi) * 4];
};
const isLand = (x, y) => maskAt(x, y) > 200;
const isLake = (x, y) => {
  const v = maskAt(x, y);
  return v > 60 && v < 200;
};
log("mask rendered");

// ---------------------------------------------------------------------------
// THE US PARTITION (us-states, coasts re-cut to NE's USA)
// ---------------------------------------------------------------------------
const STATES = new Map(feature(usTopo, usTopo.objects.states).features.map((f) => [f.properties.name, mpOf(f.geometry)]));
const L48 = [...STATES.keys()].filter((n) => !["Alaska", "Hawaii", "American Samoa", "Guam", "Commonwealth of the Northern Mariana Islands", "Puerto Rico", "United States Virgin Islands"].includes(n));
const USA = noLakes(clipBox(country("United States of America"), [-126, 23, -60, 50]));
const CELL_R = 0.1;
const STATE_BB = new Map(L48.map((n) => [n, bboxMP(STATES.get(n))]));
const STATE_PIECE = new Map();
{
  const cells = [];
  for (const n of L48) {
    const s = STATES.get(n);
    const d = dilate(s, CELL_R);
    const bb = bboxMP(d);
    const others = L48.filter((o) => o !== n && bbHit(STATE_BB.get(o), bb)).map((o) => STATES.get(o));
    const prev = cells.filter((c) => bbHit(c.bb, bb)).map((c) => c.mp);
    const cell = diff(d, ...others, ...prev);
    cells.push({ mp: cell, bb: bboxMP(cell) });
    STATE_PIECE.set(n, inter(cell, clipBox(USA, [bb[0] - 0.5, bb[1] - 0.5, bb[2] + 0.5, bb[3] + 0.5])));
  }
}
log("state pieces cut to the NE coast");
const st = (n) => {
  const p = STATE_PIECE.get(n);
  if (!p) throw new Error(`no state ${n}`);
  return p;
};

// the lower Mississippi (chained, north -> south)
const chain = (lines) => {
  const ls = lines.map((l) => l.slice());
  let best = [];
  const used = new Set();
  for (let s = 0; s < ls.length; s++) {
    if (used.has(s)) continue;
    let cur = ls[s];
    used.add(s);
    let grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < ls.length; i++) {
        if (used.has(i)) continue;
        const l = ls[i];
        const e = cur[cur.length - 1];
        const b = cur[0];
        if (dist(e, l[0]) < 0.01) cur = [...cur, ...l.slice(1)];
        else if (dist(e, l[l.length - 1]) < 0.01) cur = [...cur, ...l.slice().reverse().slice(1)];
        else if (dist(b, l[l.length - 1]) < 0.01) cur = [...l, ...cur.slice(1)];
        else if (dist(b, l[0]) < 0.01) cur = [...l.slice().reverse(), ...cur.slice(1)];
        else continue;
        used.add(i);
        grew = true;
      }
    }
    if (cur.length > best.length) best = cur;
  }
  return best;
};
const missLines = RIVERS.features.filter((f) => f.properties.name === "Mississippi" && f.properties.featurecla === "River").flatMap((f) => (f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates]));
let MISS = chain(missLines.filter((l) => l.length >= 20));
if (MISS[0][1] < MISS[MISS.length - 1][1]) MISS.reverse(); // north -> south
log(`Mississippi chain ${MISS.length} pts, ${MISS[0].map((v) => v.toFixed(2))} -> ${MISS.at(-1).map((v) => v.toFixed(2))}`);
const lowerMiss = MISS.filter(([, lat]) => lat <= 31.05);
const EAST_OF_MISS_LA = polyMP([...lowerMiss, [-88.4, 28.4], [-88.4, 31.3], [lowerMiss[0][0], 31.3]]);
const MANCHAC_LINE = [
  [-91.6, 30.36],
  [-91.12, 30.35],
  [-90.85, 30.33],
  [-90.55, 30.27],
  [-90.35, 30.22],
  [-90.1, 30.2],
  [-89.7, 30.17],
  [-89.4, 30.1],
  [-88.3, 30.1],
];
const NORTH_OF_MANCHAC = polyMP([...MANCHAC_LINE, [-88.3, 31.5], [-91.6, 31.5]]);
const MN_EAST = polyMP([
  [-92.8, 44.6],
  [-92.8, 44.745],
  [-93.27, 44.98],
  [-94.16, 45.56],
  [-94.36, 45.98],
  [-94.2, 46.36],
  [-93.53, 47.24],
  [-94.88, 47.47],
  [-95.21, 47.24],
  [-95.21, 49.6],
  [-89, 49.6],
  [-89, 44.6],
]);
const W_OF_APALACHICOLA = polyMP([
  [-84.86, 31.3],
  [-84.86, 30.71],
  [-84.95, 30.4],
  [-85.0, 30.0],
  [-84.98, 29.4],
  [-88.5, 29.4],
  [-88.5, 31.3],
]);
const S_OF_1764 = boxMP([-92, 28, -84, 32 + 28 / 60]);
const SAVOY_NICE = polyMP([
  [5.75, 46.45],
  [5.8, 45.75],
  [5.65, 45.5],
  [5.9, 45.3],
  [6.25, 45.15],
  [6.6, 44.6],
  [6.95, 44.2],
  [7.05, 43.95],
  [7.18, 43.65],
  [7.6, 43.6],
  [7.9, 44.5],
  [7.4, 46.6],
]);

const la = st("Louisiana");
const laEast = inter(la, EAST_OF_MISS_LA);
const laWest = diff(la, EAST_OF_MISS_LA);
const mn = st("Minnesota");
const fl = st("Florida");
const southOf = (n) => inter(st(n), S_OF_1764);
const northOf = (n) => diff(st(n), S_OF_1764);

// the 13 colonies, north -> south
const COLONY_DEF = [
  ["NH", "New Hampshire", ["New Hampshire", "Vermont"]],
  ["MA", "Massachusetts", ["Massachusetts", "Maine"]],
  ["RI", "Rhode Island", ["Rhode Island"]],
  ["CT", "Connecticut", ["Connecticut"]],
  ["NY", "New York", ["New York"]],
  ["NJ", "New Jersey", ["New Jersey"]],
  ["PA", "Pennsylvania", ["Pennsylvania"]],
  ["DE", "Delaware", ["Delaware"]],
  ["MD", "Maryland", ["Maryland", "District of Columbia"]],
  ["VA", "Virginia", ["Virginia", "West Virginia"]],
  ["NC", "North Carolina", ["North Carolina"]],
  ["SC", "South Carolina", ["South Carolina"]],
  ["GA", "Georgia", ["Georgia"]],
];
const COL_MP = COLONY_DEF.map(([key, name, states]) => ({ key, name, mp: union(...states.map(st)) }));

// western states split between Spanish Louisiana and New Spain by the 1783 dataset
const HB_NS = hb("Viceroyalty of New Spain");
const HB_LA = dilate(hb("Luisiana"), 0.05);
const WEST = ["North Dakota", "South Dakota", "Nebraska", "Kansas", "Oklahoma", "Texas", "New Mexico", "Colorado", "Wyoming", "Montana", "Utah", "Arizona", "Idaho"];
const westNS = union(...WEST.map((n) => inter(st(n), HB_NS)));
const westLA = union(...WEST.map((n) => inter(diff(st(n), HB_NS), HB_LA)));
log("US partition done");

// ---------------------------------------------------------------------------
// THE GROUPS
// ---------------------------------------------------------------------------
const C = (n) => noLakes(country(n));
const where = (n, pred) => noLakes(polysWhere(country(n), pred));
const inLL = (x0, y0, x1, y1) => (b) => b[0] >= x0 && b[2] <= x1 && b[1] >= y0 && b[3] <= y1;
const MENORCA = where("Spain", inLL(3.7, 39.7, 4.4, 40.2));
const GROUP_DEF = {
  // BRITAIN
  gb: () => union(C("United Kingdom"), C("Ireland"), C("Isle of Man"), C("Guernsey"), C("Jersey")),
  britNA: () =>
    union(
      where("Canada", (b) => b[1] < 60.5),
      ...["Ohio", "Indiana", "Illinois", "Michigan", "Wisconsin"].map(st),
      inter(mn, MN_EAST),
    ),
  wFlorida: () => union(inter(fl, W_OF_APALACHICOLA), southOf("Alabama"), southOf("Mississippi"), inter(laEast, NORTH_OF_MANCHAC)),
  eFlorida: () => diff(fl, W_OF_APALACHICOLA),
  britCarib: () =>
    union(
      ...[
        "Jamaica",
        "Bahamas",
        "Turks and Caicos Is.",
        "Cayman Is.",
        "Barbados",
        "Antigua and Barb.",
        "St. Kitts and Nevis",
        "Montserrat",
        "Anguilla",
        "British Virgin Is.",
        "Dominica",
        "Grenada",
        "St. Vin. and Gren.",
      ].map(C),
      where("Trinidad and Tobago", (b) => b[1] > 11.0),
    ),
  bermuda: () => C("Bermuda"),
  gibraltar: () => C("Gibraltar"),
  menorca: () => MENORCA,
  britIndia: () => inter(union(C("India"), C("Bangladesh")), dilate(union(hb("India"), hb("Bengal"), hb("Madras")), 0.25)),
  // FRANCE
  france: () => diff(where("France", inLL(-6, 41, 10, 52)), SAVOY_NICE),
  frCarib: () => union(where("France", inLL(-62, 14, -60.5, 16.6)), C("Haiti"), C("Saint Lucia"), C("St-Martin"), C("St-Barthélemy")),
  frGuiana: () => where("France", inLL(-55, 1, -51, 6.5)),
  frIndian: () => union(where("France", inLL(55, -22, 56, -20.5)), C("Mauritius")),
  // SPAIN
  spain: () => diff(C("Spain"), MENORCA),
  spCarib: () => union(C("Cuba"), C("Dominican Rep."), C("Puerto Rico"), where("Trinidad and Tobago", (b) => b[1] <= 11.0)),
  spLouisiana: () => union(diff(mn, MN_EAST), st("Iowa"), st("Missouri"), st("Arkansas"), laWest, diff(laEast, NORTH_OF_MANCHAC), westLA),
  spNewSpain: () => union(...["Mexico", "Guatemala", "Belize", "Honduras", "El Salvador", "Nicaragua", "Costa Rica"].map(C), westNS),
  spSouthAm: () => union(...["Panama", "Colombia", "Venezuela", "Ecuador", "Peru", "Bolivia", "Chile", "Argentina", "Uruguay", "Paraguay"].map(C)),
  // DUTCH
  dutch: () => where("Netherlands", inLL(2, 50, 8, 54)),
  dutchCarib: () => union(where("Netherlands", inLL(-70, 11, -62, 18.5)), C("Curaçao"), C("Aruba"), C("Sint Maarten")),
  dutchGuiana: () => union(C("Suriname"), C("Guyana")),
  dutchCape: () => inter(C("South Africa"), dilate(hb("Cape Colony"), 0.25)),
  dutchCeylon: () => inter(C("Sri Lanka"), dilate(hb("Ceylon (Dutch)"), 0.15)),
  dutchIndies: () => inter(C("Indonesia"), dilate(hb("Dutch East Indies"), 0.15)),
};
const SIDE = {
  gb: "brit",
  britNA: "brit",
  wFlorida: "brit",
  eFlorida: "brit",
  britCarib: "brit",
  bermuda: "brit",
  gibraltar: "brit",
  menorca: "brit",
  britIndia: "brit",
  france: "france",
  frCarib: "france",
  frGuiana: "france",
  frIndian: "france",
  spain: "spain",
  spCarib: "spain",
  spLouisiana: "spain",
  spNewSpain: "spain",
  spSouthAm: "spain",
  dutch: "dutch",
  dutchCarib: "dutch",
  dutchGuiana: "dutch",
  dutchCape: "dutch",
  dutchCeylon: "dutch",
  dutchIndies: "dutch",
};
const GROUPS = {};
for (const [k, fn] of Object.entries(GROUP_DEF)) {
  GROUPS[k] = clipBox(fn(), [LON0 - 0.5, LAT0 - 0.5, LON1 + 0.5, LAT1 + 0.5]);
  if (!GROUPS[k].length) throw new Error(`group ${k} is empty`);
}
log(`groups: ${Object.entries(GROUPS)
  .map(([k, v]) => `${k}(${v.length})`)
  .join(" ")}`);

// ---------------------------------------------------------------------------
// LAND BORDERS by the mask: a boundary piece is a LAND BORDER when both sides of
// it are land (2.5 world px out along its normal); else it is coast / lake shore.
// ---------------------------------------------------------------------------
const SUB = 5; // world px: pieces at most this long are classified one by one
const classify = (a, b) => {
  const l = dist(a, b) || 1e-9;
  const nx = -(b[1] - a[1]) / l;
  const ny = (b[0] - a[0]) / l;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const o = 1.25;
  const L = isLand(mx + nx * o, my + ny * o);
  const R = isLand(mx - nx * o, my - ny * o);
  if (L && R) return "border";
  const lakeSide = isLake(mx + nx * o, my + ny * o) || isLake(mx - nx * o, my - ny * o) || isLake(mx + nx * 6, my + ny * 6) || isLake(mx - nx * 6, my - ny * 6);
  return lakeSide ? "lake" : "coast";
};
/** split every ring of a world-px multipolygon into runs of one class; returns
 *  { border: P2[][], coast: P2[][] } (lake shores dropped) */
const runsOf = (mpW) => {
  const out = { border: [], coast: [] };
  for (const poly of mpW)
    for (const ring of poly) {
      const pcs = [];
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1];
        const b = ring[i];
        const n = Math.max(1, Math.ceil(dist(a, b) / SUB));
        for (let j = 0; j < n; j++) {
          const p = [a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n];
          const q = [a[0] + ((b[0] - a[0]) * (j + 1)) / n, a[1] + ((b[1] - a[1]) * (j + 1)) / n];
          pcs.push({ p, q, c: classify(p, q), key: j === 0 ? `${a[0].toFixed(3)},${a[1].toFixed(3)}|${b[0].toFixed(3)},${b[1].toFixed(3)}` : null, seg: [a, b] });
        }
      }
      // rotate so a run does not wrap around the ring's start
      let s0 = pcs.findIndex((x, i) => i > 0 && x.c !== pcs[i - 1].c);
      if (s0 < 0) s0 = 0;
      const seq = [...pcs.slice(s0), ...pcs.slice(0, s0)];
      let cur = null;
      for (const x of seq) {
        if (!cur || cur.c !== x.c) {
          if (cur) (out[cur.c] ??= []).push(cur.pts);
          cur = { c: x.c, pts: [x.p, x.q] };
        } else cur.pts.push(x.q);
      }
      if (cur) (out[cur.c] ??= []).push(cur.pts);
    }
  delete out.lake;
  return out;
};
const projMP = (mp) => mp.map((p) => p.map((r) => r.map(P)));
const lineD = (pts) => (pts.length > 1 ? `M${pts.map(([x, y]) => `${n2(x)},${n2(y)}`).join("L")}` : "");
const linesD = (ls, tol = 0.15, minLen = 0) =>
  ls
    .map((l) => dp(l, tol))
    .filter((l) => l.length > 1 && l.reduce((s, p, i) => (i ? s + dist(p, l[i - 1]) : 0), 0) >= minLen)
    .map(lineD)
    .join("");

// segment-level dedupe across groups for the shared PERIOD BORDERS
const SEEN = new Set();
const segKey = (a, b) => {
  const ka = `${a[0].toFixed(2)},${a[1].toFixed(2)}`;
  const kb = `${b[0].toFixed(2)},${b[1].toFixed(2)}`;
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
};
const dedupeLines = (ls) => {
  const out = [];
  for (const l of ls) {
    let cur = [];
    for (let i = 1; i < l.length; i++) {
      const k = segKey(l[i - 1], l[i]);
      if (SEEN.has(k)) {
        if (cur.length > 1) out.push(cur);
        cur = [];
        continue;
      }
      SEEN.add(k);
      if (!cur.length) cur.push(l[i - 1]);
      cur.push(l[i]);
    }
    if (cur.length > 1) out.push(cur);
  }
  return out;
};

const centroidOfMP = (mpW) => {
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (const p of mpW) {
    const a = Math.abs(ringArea(p[0]));
    const c = ringCentroid(p[0]);
    A += a;
    cx += c[0] * a;
    cy += c[1] * a;
  }
  return [cx / A, cy / A];
};
const boxOfW = (mpW) => {
  const b = bboxMP(mpW);
  return { x0: r2(b[0]), y0: r2(b[1]), x1: r2(b[2]), y1: r2(b[3]) };
};

// ---------------------------------------------------------------------------
// THE 13 COLONIES
// ---------------------------------------------------------------------------
const colKeyCount = new Map();
const colBorderRuns = [];
const COLONIES = COL_MP.map(({ key, name, mp }) => {
  const w = projMP(mp);
  const runs = runsOf(w);
  for (const l of runs.border)
    for (let i = 1; i < l.length; i++) {
      const kk = segKey(l[i - 1], l[i]);
      colKeyCount.set(kk, (colKeyCount.get(kk) ?? 0) + 1);
    }
  colBorderRuns.push(runs.border);
  const main = w.reduce((a, b) => (Math.abs(ringArea(b[0])) > Math.abs(ringArea(a[0])) ? b : a));
  return { key, name, d: mpD(simplifyMP(mp, 0.0015)), box: boxOfW(w), c: ringCentroid(main[0]).map(r2), coast: runs.coast };
});
// inner (between two colonies) vs outer (colony vs anything else) land borders
const innerL = [];
const outerL = [];
const innerSeen = new Set();
for (const runs of colBorderRuns)
  for (const l of runs) {
    let cur = null;
    let curType = null;
    const flush = () => {
      if (cur && cur.length > 1) (curType === "inner" ? innerL : outerL).push(cur);
      cur = null;
    };
    for (let i = 1; i < l.length; i++) {
      const kk = segKey(l[i - 1], l[i]);
      const type = (colKeyCount.get(kk) ?? 0) >= 2 ? "inner" : "outer";
      if (type === "inner" && innerSeen.has(kk)) {
        flush();
        continue;
      }
      if (type === "inner") innerSeen.add(kk);
      if (!cur || curType !== type) {
        flush();
        cur = [l[i - 1]];
        curType = type;
      }
      cur.push(l[i]);
    }
    flush();
  }
// the colonies' coast: their sea edges, small islets dropped, simplified 1 world px
const coastAll = COLONIES.flatMap((c) => c.coast);
const lenOf = (l) => l.reduce((s, p, i) => (i ? s + dist(p, l[i - 1]) : 0), 0);
const COAST_LINES = coastAll.map((l) => dp(l, 0.9)).filter((l) => lenOf(l) >= 14);
const COLONIES_UNION = union(...COL_MP.map((c) => c.mp));
const COLONIES_W = projMP(COLONIES_UNION);
// rings for point-in-colonies tests (world px, simplified 1 px, holes kept)
const COLONY_RINGS = COLONIES_W.map((p) => p.map((r) => dp(r, 1.0).map(([x, y]) => [r2(x), r2(y)])));
// the colonies' land borders are drawn by the colonies' own layers: keep them out of PERIOD_BORDERS
for (const l of [...innerL, ...outerL]) for (let i = 1; i < l.length; i++) SEEN.add(segKey(l[i - 1], l[i]));
log(`colonies: inner ${innerL.length} lines, outer ${outerL.length}, coast ${COAST_LINES.length} (from ${coastAll.length})`);

const GROUP_OUT = {};
const PERIOD_LINES = [];
for (const [k, mp] of Object.entries(GROUPS)) {
  const w = projMP(mp);
  const runs = runsOf(w);
  PERIOD_LINES.push(...dedupeLines(runs.border));
  // pieces (polygons) with their size, for rings round small islands / posts
  const pieces = w
    .map((p) => {
      const a = Math.abs(ringArea(p[0]));
      const c = ringCentroid(p[0]);
      const b = bboxRing(p[0]);
      return { x: r2(c[0]), y: r2(c[1]), r: r2(Math.max(b[2] - b[0], b[3] - b[1]) / 2), a: r2(a) };
    })
    .sort((a, b) => b.a - a.a);
  GROUP_OUT[k] = {
    side: SIDE[k],
    d: mpD(simplifyMP(mp, 0.0015)),
    dLo: mpD(simplifyMP(mp, 0.01, 0.0004)),
    border: linesD(runs.border, 0.15, 6),
    box: boxOfW(w),
    c: centroidOfMP(w).map(r2),
    pieces,
  };
}
const PERIOD_BORDERS_D = linesD(PERIOD_LINES, 0.15, 6);
log(`period borders ${(PERIOD_BORDERS_D.length / 1e3).toFixed(0)} k chars`);

// ---------------------------------------------------------------------------
// PLACES and POSTS (lon, lat; WGS84)
// ---------------------------------------------------------------------------
const PLACES_LL = {
  london: [-0.1276, 51.5072],
  portsmouth: [-1.091, 50.798], // Spithead anchorage just off
  newYork: [-74.006, 40.7128],
  sandyHook: [-74.0, 40.46],
  statenIsland: [-74.15, 40.58],
  boston: [-71.0589, 42.3601],
  philadelphia: [-75.1652, 39.9526],
  charleston: [-79.9311, 32.7765],
  savannah: [-81.0912, 32.0809],
  halifax: [-63.5752, 44.6488],
  newOrleans: [-90.0715, 29.9511],
  fortBute: [-91.05, 30.35], // Manchac (Fort Bute), 7 Sep 1779
  batonRouge: [-91.1871, 30.4515],
  paris: [2.3522, 48.8566],
  madrid: [-3.7038, 40.4168],
  theHague: [4.3007, 52.0705],
  amsterdam: [4.9041, 52.3676],
  brest: [-4.4861, 48.3904],
  ushant: [-5.09, 48.46], // Ouessant; the battle of 27 Jul 1778 ~100 mi west of it
  isleOfWight: [-1.3, 50.68],
  gibraltar: [-5.3536, 36.1408],
  portMahon: [4.265, 39.889], // Menorca; Fort St Philip 39.873 N 4.306 E
  portoPraya: [-23.51, 14.92], // Santiago, Cape Verde (Battle of Porto Praya, 16 Apr 1781)
  capeVerde: [-24.0, 16.0],
  mahe: [75.53, 11.7],
  pondicherry: [79.83, 11.93],
  kingston: [-76.79, 17.97], // Port Royal / Kingston, Jamaica
  bridgetown: [-59.6167, 13.0975],
  stLucia: [-60.98, 13.91],
};
const POSTS_LL = [
  { name: "Goree", side: "france", ll: [-17.398, 14.667] },
  { name: "Pondicherry", side: "france", ll: [79.83, 11.93] },
  { name: "Mahe", side: "france", ll: [75.53, 11.7] },
  { name: "Karikal", side: "france", ll: [79.84, 10.92] },
  { name: "Chandernagore", side: "france", ll: [88.37, 22.87] },
  { name: "Fort James", side: "brit", ll: [-16.36, 13.32] }, // James Island, Gambia
  { name: "Saint-Louis", side: "brit", ll: [-16.5, 16.03] }, // British 1758 - Jan 1779
  { name: "Bombay", side: "brit", ll: [72.84, 18.94] },
  { name: "Belize", side: "brit", ll: [-88.2, 17.5] }, // logwood settlement (Spanish sovereignty)
  { name: "Black River", side: "brit", ll: [-84.78, 15.95] }, // Mosquito Shore (approximate)
  { name: "Cochin", side: "dutch", ll: [76.24, 9.97] },
];
const PLACES = Object.fromEntries(Object.entries(PLACES_LL).map(([k, ll]) => [k, { x: r2(P(ll)[0]), y: r2(P(ll)[1]), lon: ll[0], lat: ll[1] }]));
const POSTS = POSTS_LL.map((p) => ({ name: p.name, side: p.side, x: r2(P(p.ll)[0]), y: r2(P(p.ll)[1]), lon: p.ll[0], lat: p.ll[1] }));

// the Mississippi (world px, north -> south, simplified 0.4 px) for D
const MISS_W = dp(MISS.map(P), 0.4).map(([x, y]) => [r2(x), r2(y)]);

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
const HEAD = `// Mercator, 40 world px per degree of longitude: x = 40 (lon + 110),
// y = 40 (M(68) - M(lat)), M = ln tan(45 + lat/2) in degrees. World x 0..${W_EXT}, y 0..${H_EXT.toFixed(1)}.`;
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-sugar-map.mjs — do not edit by hand.
// The STATIC land of the sugar world, read only by scripts/bake-sugar-rasters.mjs.
// Natural Earth 10m land minus NE 10m lakes (public domain), simplified 0.0015 deg.
${HEAD}

/** Land, one path (evenodd; the lakes are holes), world px: lon -112..102, lat -42..70. */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** The far levels' land (simplified 0.02 deg): the whole globe, lat -85..87 (+ the rings near the antimeridian repeated at +-360). */
export const LAND_WIDE_D = ${JSON.stringify(LAND_WIDE_D)};
`,
);
const groupKeys = Object.keys(GROUP_OUT);
writeFileSync(
  OUT,
  `// Generated by scripts/build-sugar-map.mjs — do not edit by hand.
// The light OVERLAYS of the sugar world (see sugarShared.tsx for the API and the
// sources; the build script's header lists every URL and every approximation).
${HEAD}

export type P2 = [number, number];
export type Box = { x0: number; y0: number; x1: number; y1: number };
export type Place = { x: number; y: number; lon: number; lat: number };
export type GroupKey = ${groupKeys.map((k) => `"${k}"`).join(" | ")};
export type Side = "brit" | "france" | "spain" | "dutch";
/** a polygon piece of a group: area centroid (x, y), half its bbox's long side r, area a (world px) - largest first */
export type Piece = { x: number; y: number; r: number; a: number };
export type Group = { side: Side; d: string; dLo: string; border: string; box: Box; c: P2; pieces: Piece[] };

export const PROJ = { ppd: ${PPD}, lon0: ${LON0}, mercTop: ${MERC_TOP}, extent: { w: ${W_EXT}, h: ${H_EXT} } };

/** 1778 polities: fill d (evenodd, land only, coast = the raster's; dLo = simplified
 *  0.01 deg, islets < 0.0004 sq deg dropped, for k < ~1.2), its LAND borders
 *  (svg d, coasts and lake shores excluded), bbox, area centroid, pieces */
export const GROUPS: Record<GroupKey, Group> = ${JSON.stringify(GROUP_OUT)};

/** every land border of every 1778 polity group above, each drawn once (svg d) */
export const PERIOD_BORDERS_D = ${JSON.stringify(PERIOD_BORDERS_D)};

/** THE 13 COLONIES, north -> south: fill d, bbox, centroid of the main polygon */
export const COLONIES: { key: string; name: string; d: string; box: Box; c: P2 }[] = ${JSON.stringify(COLONIES.map(({ coast, ...c }) => c))};
/** the 13 as one fill (svg d) */
export const COLONIES_D = ${JSON.stringify(mpD(simplifyMP(COLONIES_UNION, 0.0015)))};
/** the borders BETWEEN colonies (svg d, each once) */
export const COLONY_INNER_D = ${JSON.stringify(linesD(innerL, 0.15))};
/** the colonies' LAND edge against everything else (Quebec, the west, East Florida) */
export const COLONY_OUTER_D = ${JSON.stringify(linesD(outerL, 0.15, 6))};
/** the colonies' sea coast as polylines (islets < 14 world px dropped, simplified 0.9 px) */
export const COLONY_COAST: P2[][] = ${JSON.stringify(COAST_LINES.map((l) => l.map(([x, y]) => [r2(x), r2(y)])))};
/** the colonies' union as rings (world px, simplified 1 px; [outer, ...holes] per polygon) for point tests */
export const COLONY_RINGS: P2[][][] = ${JSON.stringify(COLONY_RINGS)};

/** named places (world px + lon/lat) */
export const PLACES: Record<${Object.keys(PLACES)
    .map((k) => `"${k}"`)
    .join(" | ")}, Place> = ${JSON.stringify(PLACES)};
/** trading posts / forts too small for a polygon (draw as small rings) */
export const POSTS: { name: string; side: Side; x: number; y: number; lon: number; lat: number }[] = ${JSON.stringify(POSTS)};
/** the Mississippi (NE 10m), north -> south, world px */
export const MISSISSIPPI: P2[] = ${JSON.stringify(MISS_W)};
`,
);
log(`Wrote ${OUT_STATIC} and ${OUT}`);
