// Bakes the geometry of THE TLAXCALA WORLD for the clip
// "Sheppard_Tlaxcalans_thought_they_used_Cortes" (Dwarkesh with Si Sheppard;
// Dwarkesh map style). It is the Cortes world (scripts/build-cortes-map.mjs,
// cortesShared.tsx: the same projection, the same baked land) plus the pieces
// this clip needs, all derived from the same sources:
//
//   bun scripts/build-tlax-map.mjs
//
// Reads scripts/cortes-geo.json (never edited: the georeferenced 1519 empire,
// Lake Texcoco, Cortes's road waypoints) and Natural Earth 10m land from the
// installed world-atlas. Writes
//   generated/components/tlaxStatic.ts   the smoothed Lake Texcoco for the
//                                         valley rasters (read only by
//                                         scripts/bake-tlax-rasters.mjs)
//   generated/components/tlaxMapData.ts  the light OVERLAYS (see tlaxShared.tsx)
//
// THE EMPIRE OF THIS CLIP. The georeferenced rings (cortes-geo.json, after
// "Aztec Empire 1519 map-fr.svg", Wikimedia Commons, Keepscases & Semhur after
// Yavidaxiu, from Atlas del Mexico prehispanico, Arqueologia Mexicana 2000) are
// projected and SMOOTHED (closed centripetal Catmull-Rom through every source
// vertex: the hole round Tlaxcala is seen at k ~10-16 in this clip, where the
// raw ring's 1.7 world px segments and up-to-30 deg corners showed), then
//   EMPIRE   = ((outer - Tlaxcala - Teotitlan) + Soconusco) n land - lake
//   ENCLAVES = the independent states the source map draws inside or notched
//              into the empire: TLAXCALA (hole 1), TEOTITLAN (hole 2),
//              METZTITLAN and YOPITZINCO (notches of the outer ring, each
//              closed across its mouth: Metztitlan by the segment from the main
//              body's north-west corner (source vertex 118) to the nearest
//              vertex of the Oxtlipa lobe's west edge (vertex 42); Yopitzinco
//              by the segment across its Pacific mouth (vertices 320 -> 264),
//              then clipped to land, so its mouth is the coast). NOT Tututepec:
//              the source draws no Tututepec; its Mixtec coast ("Mixteques") is
//              outside the empire and open to the east, not an enclave.
//   the LAKE = Lake Texcoco 1519 smoothed (Gaussian along the ring, sigma 0.22
//              world px, ~0.6 km: the source ring is digitising zig-zag at the
//              k ~35 this clip reaches), the same ring in the rasters and cut
//              out of the empire.
//
// THE CLAIM (cut A). Tlaxcala's reported terms (Wikipedia "Fall of
// Tenochtitlan"; Hassig, Mexico and the Spanish Conquest): the city of Cholula,
// an equal share of the spoils, the right to build a citadel in Tenochtitlan,
// freedom from tribute. The source map puts Cholula (and Huexotzinco) INSIDE
// the Tlaxcala hole, so the carved territory is a PROXY: an organic piece of
// empire land round the source's Tepeyacac (Tepeaca) chief-town marker, on the
// hole's south border - the Aztec tributary on Tlaxcala's border that the
// alliance took first (the Tepeaca campaign, Aug-Sep 1520, guided by Tlaxcalan
// warriors; Cortes founded Segura de la Frontera there). Its name never shows.
// The pen line = the piece's outline outside Tlaxcala (east crossing -> south ->
// west crossing) and then the TIE: a smooth curve west, south of Tlaxcala's
// Huexotzinco lobe and past the volcanoes, to Tenochtitlan.
//
// CHECKS (throws): the claim lies inside the empire and away from Teotitlan;
// the tie stays >= 5 km off the Tlaxcala hole until it is past it; the sites
// (Texcoco on the lake's east shore on land, Tlaxcala and Cholula in the hole).

import { readFileSync, writeFileSync } from "node:fs";
import { geoConicConformal } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";
import { PROJ, PX_PER_KM } from "../generated/components/cortesMapData.ts";

const OUT_STATIC = "generated/components/tlaxStatic.ts";
const OUT = "generated/components/tlaxMapData.ts";
const GEO = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));

const projection = geoConicConformal().parallels(PROJ.parallels).rotate(PROJ.rotate).scale(PROJ.scale).translate(PROJ.translate);
const P = (ll) => projection(ll);
const INV = (p) => projection.invert(p);
const r3 = (v) => Math.round(v * 1000) / 1000;
const r4 = (v) => Math.round(v * 10000) / 10000;
const KM = PX_PER_KM; // world px per km

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
/** closed centripetal Catmull-Rom through every vertex, ~step world px apart;
 *  idx[i] = the sample index of source vertex i */
const catmullClosed = (pts0, step) => {
  // drop a duplicated closing vertex
  const pts = dist(pts0[0], pts0[pts0.length - 1]) < 1e-9 ? pts0.slice(0, -1) : pts0.slice();
  const n = pts.length;
  const out = [];
  const idx = [];
  const knot = (p, q) => Math.pow(dist(p, q), 0.5) || 1e-6;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    idx.push(out.length);
    out.push(p1);
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const m = Math.max(1, Math.ceil(dist(p1, p2) / step));
    for (let s = 1; s < m; s++) {
      const t = t1 + ((t2 - t1) * s) / m;
      const lerp = (A, B, ta, tb) => [((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0], ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1]];
      const A1 = lerp(p0, p1, 0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, 0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
  }
  return { pts: out, idx };
};
/** open centripetal Catmull-Rom (end tangents mirrored), ~step apart */
const catmullOpen = (pts, step) => {
  const ext = [
    [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]],
    ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]],
  ];
  const out = [pts[0]];
  const knot = (p, q) => Math.pow(dist(p, q), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const m = Math.max(2, Math.ceil(dist(p1, p2) / step));
    for (let s = 1; s <= m; s++) {
      const t = t1 + ((t2 - t1) * s) / m;
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
/** resample a closed ring evenly by arclength */
const resampleClosed = (ring, step) => {
  const pts = [...ring, ring[0]];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i], pts[i - 1]));
  const L = cum[cum.length - 1];
  const n = Math.max(8, Math.round(L / step));
  const out = [];
  let j = 0;
  for (let q = 0; q < n; q++) {
    const s = (L * q) / n;
    while (cum[j + 1] < s) j++;
    const u = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
};
/** Gaussian smoothing along a closed ring (sigma in world px), after even resampling */
const gaussClosed = (ring, sigma, step) => {
  const r = resampleClosed(ring, step);
  const n = r.length;
  const h = Math.ceil((3 * sigma) / step);
  const w = [];
  for (let q = -h; q <= h; q++) w.push(Math.exp(-0.5 * Math.pow((q * step) / sigma, 2)));
  const ws = w.reduce((s, v) => s + v, 0);
  return r.map((_, i) => {
    let x = 0;
    let y = 0;
    for (let q = -h; q <= h; q++) {
      const p = r[(i + q + n) % n];
      x += p[0] * w[q + h];
      y += p[1] * w[q + h];
    }
    return [x / ws, y / ws];
  });
};
const pip = ([x, y], ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const inMulti = (p, mp) => mp.some((poly) => pip(p, poly[0]) && !poly.slice(1).some((h) => pip(p, h)));
const segDist = (p, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const ringDist = (p, ring) => {
  let best = Infinity;
  for (let i = 0; i < ring.length; i++) best = Math.min(best, segDist(p, ring[i], ring[(i + 1) % ring.length]));
  return best;
};
const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i], pts[i - 1]));
  return c;
};
const toD = (pts, close = false) => (pts.length ? `M${pts.map(([x, y]) => `${r3(x)},${r3(y)}`).join("L")}${close ? "Z" : ""}` : "");
const multiD = (mp) => mp.map((poly) => poly.map((ring) => toD(ring.slice(0, -1), true)).join("")).join("");
const roundMulti = (mp) => mp.map((poly) => poly.map((ring) => ring.map(([x, y]) => [r3(x), r3(y)])));
const areaMulti = (mp) => mp.reduce((s, poly) => s + Math.abs(ringArea(poly[0])) - poly.slice(1).reduce((t, h) => t + Math.abs(ringArea(h)), 0), 0);

// ---------------------------------------------------------------------------
// LAND (Natural Earth 10m) in world px, round the empire
// ---------------------------------------------------------------------------
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
const llBox = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return { x0, x1, y0, y1 };
};
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const landW = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    const b = llBox(rings[0]);
    if (b.x1 < -106 || b.x0 > -88 || b.y1 < 12 || b.y0 > 25) continue;
    landW.push(rings.map((r) => r.map(P)));
  }
const BOXW = (() => {
  const c = [
    [-106, 12],
    [-88, 12],
    [-88, 25],
    [-106, 25],
  ].map(P);
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of c) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return [
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
      [x0, y0],
    ],
  ];
})();
const LANDW = polygonClipping.intersection(landW, BOXW);
// coast segments for isLand / coastDist (the cortes build's bucket grid)
const coastSegs = [];
for (const poly of LANDW) for (const ring of poly) for (let i = 1; i < ring.length; i++) coastSegs.push([...ring[i - 1], ...ring[i]]);
const BUCKET = 4;
const segGrid = new Map();
const rowGrid = new Map();
coastSegs.forEach(([ax, ay, bx, by], i) => {
  const i0 = Math.floor(Math.min(ax, bx) / BUCKET);
  const i1 = Math.floor(Math.max(ax, bx) / BUCKET);
  const j0 = Math.floor(Math.min(ay, by) / BUCKET);
  const j1 = Math.floor(Math.max(ay, by) / BUCKET);
  for (let a = i0; a <= i1; a++)
    for (let b = j0; b <= j1; b++) {
      const k = `${a},${b}`;
      if (!segGrid.has(k)) segGrid.set(k, []);
      segGrid.get(k).push(i);
    }
  for (let b = j0; b <= j1; b++) {
    if (!rowGrid.has(b)) rowGrid.set(b, []);
    rowGrid.get(b).push(i);
  }
});
const isLand = (x, y) => {
  let c = false;
  for (const i of rowGrid.get(Math.floor(y / BUCKET)) ?? []) {
    const [ax, ay, bx, by] = coastSegs[i];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
  }
  return c;
};
const coastDist = (x, y, max = 20) => {
  let best = Infinity;
  const R = Math.ceil(max / BUCKET);
  const i0 = Math.floor(x / BUCKET);
  const j0 = Math.floor(y / BUCKET);
  for (let ring = 0; ring <= R; ring++) {
    for (let a = i0 - ring; a <= i0 + ring; a++)
      for (let b = j0 - ring; b <= j0 + ring; b++) {
        if (Math.max(Math.abs(a - i0), Math.abs(b - j0)) !== ring) continue;
        for (const i of segGrid.get(`${a},${b}`) ?? []) {
          const [ax, ay, bx, by] = coastSegs[i];
          best = Math.min(best, segDist([x, y], [ax, ay], [bx, by]));
        }
      }
    if (best <= ring * BUCKET) break;
  }
  return best;
};

// ---------------------------------------------------------------------------
// THE RINGS, smoothed
// ---------------------------------------------------------------------------
const EMP = GEO.aztec_empire_1519;
const [OUTER_LL, TLAX_LL, TEOT_LL, SOCO_LL] = EMP.rings;
const OUTER = catmullClosed(OUTER_LL.map(P), 0.35);
const TLAX = catmullClosed(TLAX_LL.map(P), 0.1).pts;
const TEOT = catmullClosed(TEOT_LL.map(P), 0.2).pts;
const SOCO = catmullClosed(SOCO_LL.map(P), 0.35).pts;
const LAKE = gaussClosed(GEO.lake_texcoco_1519.rings[0].map(P), 0.22, 0.04).filter((_, i) => i % 1 === 0);
const LAKE_RING = resampleClosed(LAKE, 0.05);
const close = (r) => [...r, r[0]];
console.log(
  `rings: outer ${OUTER.pts.length}, Tlaxcala ${TLAX.length}, Teotitlan ${TEOT.length}, Soconusco ${SOCO.length}, lake ${LAKE_RING.length} (smoothed)`,
);

// the notches (source vertex ranges of the outer ring) and their mouths
const NOTCH = {
  metztitlan: { from: 42, to: 118 }, // the lobe's west edge v42 -> the main body's north-west corner v118
  yopitzinco: { from: 264, to: 320 }, // the Pacific mouth: v264 (west) -> v320 (east)
};
const notchPts = ({ from, to }) => OUTER.pts.slice(OUTER.idx[from], OUTER.idx[to] + 1);

// ---------------------------------------------------------------------------
// THE EMPIRE and THE ENCLAVES (world px)
// ---------------------------------------------------------------------------
const empRaw = polygonClipping.union(polygonClipping.difference([close(OUTER.pts)], [close(TLAX)], [close(TEOT)]), [close(SOCO)]);
const EMPIRE = polygonClipping.difference(polygonClipping.intersection(empRaw, LANDW), [close(LAKE_RING)]);
const enclave = (ring) => polygonClipping.difference(polygonClipping.intersection([close(ring)], LANDW), [close(LAKE_RING)]);
const ENC = {
  tlaxcala: enclave(TLAX),
  teotitlan: enclave(TEOT),
  metztitlan: enclave(notchPts(NOTCH.metztitlan)),
  yopitzinco: enclave(notchPts(NOTCH.yopitzinco)),
};
for (const [k, mp] of Object.entries(ENC)) console.log(`enclave ${k}: ${mp.length} polygon(s), ${(areaMulti(mp) / (KM * KM)).toFixed(0)} km2`);
console.log(`empire: ${EMPIRE.length} polygons, ${(areaMulti(EMPIRE) / (KM * KM)).toFixed(0)} km2`);

// border runs over land (the coast is not a border)
const runsOverLand = (pts, closed) => {
  const runs = [];
  let run = [];
  const seq = closed ? [...pts, pts[0]] : pts;
  for (const q of seq) {
    if (isLand(q[0], q[1]) && coastDist(q[0], q[1], 4) > 0.6) run.push(q);
    else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
};
const runsD = (runs) => runs.map((r) => toD(r)).join("");
// the outer ring minus the two notches' edges
const outerKeep = (() => {
  const n = OUTER.pts.length;
  const skip = new Set();
  for (const nt of Object.values(NOTCH)) for (let i = OUTER.idx[nt.from] + 1; i < OUTER.idx[nt.to]; i++) skip.add(i);
  const runs = [];
  let run = [];
  for (let i = 0; i <= n; i++) {
    const q = i % n;
    if (skip.has(q)) {
      if (run.length > 1) runs.push(run);
      run = [];
      continue;
    }
    run.push(OUTER.pts[q]);
  }
  if (run.length > 1) runs.push(run);
  return runs.flatMap((r) => runsOverLand(r, false));
})();
const BORDERS = {
  outer: runsD(outerKeep),
  soconusco: runsD(runsOverLand(SOCO, true)),
  tlaxcala: runsD(runsOverLand(TLAX, true)),
  teotitlan: runsD(runsOverLand(TEOT, true)),
  metztitlan: runsD(runsOverLand(notchPts(NOTCH.metztitlan), false)),
  yopitzinco: runsD(runsOverLand(notchPts(NOTCH.yopitzinco), false)),
};

// ---------------------------------------------------------------------------
// SITES (lon/lat: cortes-geo.json's Cortes-road waypoints for Tlaxcala and
// Cholula; Texcoco as the georeference's control point, Texcoco de Mora)
// ---------------------------------------------------------------------------
const SITE_LL = {
  tlaxcala: [-98.237, 19.318],
  cholula: [-98.303, 19.063],
  texcoco: [-98.882, 19.513],
  tenochtitlan: GEO.sites.tenochtitlan.lonlat,
};
const SITES_T = Object.fromEntries(Object.entries(SITE_LL).map(([k, ll]) => [k, { x: r3(P(ll)[0]), y: r3(P(ll)[1]), lon: ll[0], lat: ll[1] }]));
if (!pip([SITES_T.tlaxcala.x, SITES_T.tlaxcala.y], TLAX) || !pip([SITES_T.cholula.x, SITES_T.cholula.y], TLAX))
  throw new Error("Tlaxcala and Cholula should lie in the Tlaxcala hole (the source map)");
{
  const t = [SITES_T.texcoco.x, SITES_T.texcoco.y];
  const lakeD = ringDist(t, LAKE_RING);
  console.log(`Texcoco: in lake ${pip(t, LAKE_RING)}, ${(lakeD / KM).toFixed(1)} km from the shore`);
  if (pip(t, LAKE_RING)) throw new Error("Texcoco falls in the lake");
}

// ---------------------------------------------------------------------------
// THE CLAIM: a piece of the empire on Tlaxcala's south border, round the
// source's Tepeyacac marker
// ---------------------------------------------------------------------------
// the source marker (use9148 in the Commons SVG) through the georeference affine
// (lon = c0 + c1 x + c2 y, lat = d0 + d1 x + d2 y): (-97.7342, 18.8094); the
// real Tepeaca (18.9656 N, 97.9042 W) falls inside the georeferenced hole
// (towns rms 15 km), so the piece sits where the SOURCE draws it. Its outline
// is a BOWL hung under the border: the border between two crossings (P1 east,
// P2 west), pushed out (south) by depth(u) = D sin(pi u)^1.6 with a slight lean,
// so the pen leaves the border tangentially at P1 and comes back to it
// tangentially at P2 (the tie then sets off from P2 with a small turn, not a
// spike). ~50 km east-west x ~27 km deep: the Tepeaca district (Tepeaca,
// Acatzingo, Quecholac, Tecamachalco) is of that order.
const TEPEACA_MARKER_LL = [-97.7342, 18.8094];
const MK = P(TEPEACA_MARKER_LL);
const CLAIM_LON = [-97.6, -98.09]; // P1 (east), P2 (west) on the hole's south border
const CLAIM_DEPTH = 27 * KM; // world px at the deepest
const TL_C = TLAX.reduce((s, q) => [s[0] + q[0] / TLAX.length, s[1] + q[1] / TLAX.length], [0, 0]);
const southIdx = (lon) => {
  const x = P([lon, 18.85])[0];
  let best = -1;
  TLAX.forEach((q, i) => {
    if (q[1] < TL_C[1]) return;
    if (best < 0 || Math.abs(q[0] - x) < Math.abs(TLAX[best][0] - x)) best = i;
  });
  return best;
};
const I1 = southIdx(CLAIM_LON[0]);
const I2 = southIdx(CLAIM_LON[1]);
// the border from P1 to P2 along the south side (the walk that stays south of the centroid)
const BORDER_SEG = (() => {
  const n = TLAX.length;
  const walk = (step) => {
    const out = [];
    for (let i = I1; ; i = (i + step + n) % n) {
      out.push(TLAX[i]);
      if (i === I2) break;
      if (out.length > n) return null;
    }
    return out;
  };
  const a = walk(1);
  const b = walk(-1);
  const ok = (w) => w && w.every((q) => q[1] > TL_C[1]);
  return ok(a) ? a : b;
})();
const BCUM = cumOf(BORDER_SEG);
const BLEN = BCUM.at(-1);
const outward = (i) => {
  const a = BORDER_SEG[Math.max(0, i - 3)];
  const b = BORDER_SEG[Math.min(BORDER_SEG.length - 1, i + 3)];
  const t = [b[0] - a[0], b[1] - a[1]];
  const l = Math.hypot(t[0], t[1]) || 1;
  let nrm = [-t[1] / l, t[0] / l];
  const q = BORDER_SEG[i];
  if (pip([q[0] + nrm[0] * 0.5, q[1] + nrm[1] * 0.5], TLAX)) nrm = [-nrm[0], -nrm[1]];
  return nrm;
};
const ARC = (() => {
  // in the chord's frame (e: P1 -> P2, n: away from Tlaxcala): control points at
  // u along the chord, pushed out by the border's own offset b(u) + depth(u), then
  // one smooth centripetal Catmull-Rom through them
  const A = BORDER_SEG[0];
  const B = BORDER_SEG.at(-1);
  const L = dist(A, B);
  const e = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
  let n = [-e[1], e[0]];
  const mid = [(A[0] + B[0]) / 2 + n[0], (A[1] + B[1]) / 2 + n[1]];
  if (pip(mid, TLAX)) n = [-n[0], -n[1]];
  const bOff = (u) => {
    // the border sample whose projection on the chord is nearest u L
    let best = BORDER_SEG[0];
    let bd = Infinity;
    for (const q of BORDER_SEG) {
      const t = (q[0] - A[0]) * e[0] + (q[1] - A[1]) * e[1];
      if (Math.abs(t - u * L) < bd) [bd, best] = [Math.abs(t - u * L), q];
    }
    return (best[0] - A[0]) * n[0] + (best[1] - A[1]) * n[1];
  };
  const US = [0, 0.06, 0.16, 0.3, 0.45, 0.6, 0.74, 0.86, 0.95, 1];
  const ctrl = US.map((u) => {
    const depth = CLAIM_DEPTH * Math.pow(Math.sin(Math.PI * u), 1.6) * (1 + 0.07 * Math.sin(3 * Math.PI * u + 0.7));
    const off = bOff(u) + depth;
    return [A[0] + e[0] * u * L + n[0] * off, A[1] + e[1] * u * L + n[1] * off];
  });
  ctrl[0] = A;
  ctrl[ctrl.length - 1] = B;
  return catmullOpen(ctrl, 0.06);
})();
const P1 = ARC[0];
const P2 = ARC[ARC.length - 1];
if (P1[0] < P2[0]) throw new Error("the arc should run east -> west");
// the claim ring: the arc P1 -> P2, then the border back P2 -> P1
const CLAIM_RING = [...ARC, ...BORDER_SEG.slice(1, -1).reverse()];
const CLAIM = polygonClipping.intersection([close(CLAIM_RING)], EMPIRE);
if (CLAIM.length !== 1) throw new Error(`the claim should be one piece (got ${CLAIM.length})`);
const EMPIRE_REST = polygonClipping.difference(EMPIRE, CLAIM);
const CLAIM_C = (() => {
  const r = CLAIM[0][0];
  return r.reduce((s, q) => [s[0] + q[0] / r.length, s[1] + q[1] / r.length], [0, 0]);
})();
{
  const teo = Math.min(...ARC.map((p) => ringDist(p, TEOT)));
  const mkIn = inMulti(MK, CLAIM);
  console.log(
    `claim: ${(areaMulti(CLAIM) / (KM * KM)).toFixed(0)} km2, ${(teo / KM).toFixed(1)} km from Teotitlan; the Tepeyacac marker inside it: ${mkIn}`,
  );
  if (teo < 4 * KM) throw new Error("the claim comes within 4 km of Teotitlan");
  if (!mkIn) throw new Error("the claim should contain the source's Tepeyacac marker");
  if (Math.abs(areaMulti(CLAIM) - Math.abs(ringArea(CLAIM_RING))) > 0.02 * Math.abs(ringArea(CLAIM_RING)))
    throw new Error("the claim leaves the empire somewhere");
}
console.log(`arc: ${ARC.length} pts, ${(cumOf(ARC).at(-1) / KM).toFixed(1)} km; P1 ${INV(P1).map(r4)}, P2 ${INV(P2).map(r4)}`);

// THE TIE: P2 -> south of the Huexotzinco lobe, past the volcanoes -> Tenochtitlan
const TIE_WP_LL = [
  [-98.3, 18.79],
  [-98.53, 18.865],
  [-98.765, 19.065],
  [-98.95, 19.26],
];
const TEN = P(GEO.sites.tenochtitlan.lonlat);
const TIE = catmullOpen([P2, ...TIE_WP_LL.map(P), TEN], 0.06);
{
  // >= 5 km off the hole until the tie is west of it
  let worst = Infinity;
  for (const q of TIE) {
    if (q[0] < Math.min(...TLAX.map((p) => p[0])) - 1) break;
    if (dist(q, P2) < 12 * KM) continue; // its first 12 km leave the claim's corner, the border rising away from it
    if (pip(q, TLAX)) throw new Error("the tie crosses Tlaxcala");
    worst = Math.min(worst, ringDist(q, TLAX));
  }
  console.log(`tie: ${(cumOf(TIE).at(-1) / KM).toFixed(0)} km, >= ${(worst / KM).toFixed(1)} km off Tlaxcala`);
  if (worst < 5 * KM) throw new Error("the tie runs within 5 km of Tlaxcala");
}
const PEN_PTS = [...ARC, ...TIE.slice(1)];
const PEN_CUM = cumOf(PEN_PTS);
const PEN_ARC_LEN = cumOf(ARC).at(-1);

// the empire's area centroid and its box (world px)
const EMP_STATS = (() => {
  let ax = 0;
  let ay = 0;
  let A = 0;
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const poly of EMPIRE)
    poly.forEach((ring, ri) => {
      const sgn = ri === 0 ? 1 : -1;
      const a = Math.abs(ringArea(ring)) * sgn;
      let cx = 0;
      let cy = 0;
      for (const p of ring) {
        cx += p[0];
        cy += p[1];
        if (ri === 0) {
          x0 = Math.min(x0, p[0]);
          x1 = Math.max(x1, p[0]);
          y0 = Math.min(y0, p[1]);
          y1 = Math.max(y1, p[1]);
        }
      }
      ax += (cx / ring.length) * a;
      ay += (cy / ring.length) * a;
      A += a;
    });
  return { centroid: [r3(ax / A), r3(ay / A)], box: { x0: r3(x0), x1: r3(x1), y0: r3(y0), y1: r3(y1) } };
})();
// the main body alone (without Soconusco)
const MAIN_BOX = (() => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const poly of EMPIRE) {
    const b = poly[0];
    const isSoco = b.every((p) => p[0] > P([-93.5, 15])[0]);
    if (isSoco) continue;
    for (const p of b) {
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
  }
  return { x0: r3(x0), x1: r3(x1), y0: r3(y0), y1: r3(y1) };
})();
console.log(`empire centroid ${EMP_STATS.centroid}, box ${JSON.stringify(EMP_STATS.box)}, main body box ${JSON.stringify(MAIN_BOX)}`);

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
// the lake for the rasters, in the cortes static's path manner (world px)
const LAKE_D = toD(LAKE_RING, true);
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-tlax-map.mjs — do not edit by hand.
// The STATIC additions of the Tlaxcala world, read only by
// scripts/bake-tlax-rasters.mjs (the land and graticule are cortesStatic.ts's).
/** Lake Texcoco 1519, smoothed (Gaussian along the ring, sigma 0.22 world px), one ring (world px). */
export const LAKE_SMOOTH_D = ${JSON.stringify(LAKE_D)};
`,
);
const ringLL = (ring) => ring.map((p) => INV(p).map(r4));
const encOut = (key, ringW) => ({
  ring: ringLL(ringW),
  d: multiD(ENC[key]),
  polys: roundMulti(ENC[key]),
  border: BORDERS[key],
});
writeFileSync(
  OUT,
  `// Generated by scripts/build-tlax-map.mjs — do not edit by hand.
// The light OVERLAYS of the Tlaxcala world (see tlaxShared.tsx for the API).
// Same projection and world px as the Cortes world (cortesMapData.ts):
// ${PX_PER_KM.toFixed(4)} world px per km.
// Sources: scripts/cortes-geo.json (the georeferenced 1519 empire after the
// Commons "Aztec Empire 1519 map-fr.svg", Lake Texcoco 1519, Cortes's road
// waypoints), Natural Earth 10m land (world-atlas). See the build's header.
import type { P2 } from "./cortesMapData";

export type Site = { x: number; y: number; lon: number; lat: number };
export type Enclave = { ring: P2[]; d: string; polys: P2[][][]; border: string };

/** sites (world px + lon/lat) */
export const SITES_T: Record<"tlaxcala" | "cholula" | "texcoco" | "tenochtitlan", Site> = ${JSON.stringify(SITES_T)};

/** THE EMPIRE of this clip: ((outer - Tlaxcala - Teotitlan) + Soconusco), smoothed,
 *  clipped to land, the smoothed lake removed. evenodd. */
export const EMPIRE_T_D = ${JSON.stringify(multiD(EMPIRE))};
export const EMPIRE_T_POLYS: P2[][][] = ${JSON.stringify(roundMulti(EMPIRE))};
/** the empire minus the claim (cut A's carved piece) */
export const EMPIRE_REST_D = ${JSON.stringify(multiD(EMPIRE_REST))};
/** the area centroid and box of the empire (with Soconusco), and of the main body alone */
export const EMPIRE_CENTROID: P2 = ${JSON.stringify(EMP_STATS.centroid)};
export const EMPIRE_BOX = ${JSON.stringify(EMP_STATS.box)};
export const EMPIRE_MAIN_BOX = ${JSON.stringify(MAIN_BOX)};

/** border lines over land (open polylines, svg d): the outer ring without the two
 *  notches, Soconusco, and each enclave's edge with the empire */
export const BORDER_OUTER_D = ${JSON.stringify(BORDERS.outer)};
export const BORDER_SOCONUSCO_D = ${JSON.stringify(BORDERS.soconusco)};

/** THE ENCLAVES: ring (lon/lat, smoothed), d (world px, clipped to land), polys, border (svg d) */
export const ENCLAVES: Record<"tlaxcala" | "teotitlan" | "metztitlan" | "yopitzinco", Enclave> = {
  tlaxcala: ${JSON.stringify(encOut("tlaxcala", TLAX))},
  teotitlan: ${JSON.stringify(encOut("teotitlan", TEOT))},
  metztitlan: ${JSON.stringify(encOut("metztitlan", notchPts(NOTCH.metztitlan)))},
  yopitzinco: ${JSON.stringify(encOut("yopitzinco", notchPts(NOTCH.yopitzinco)))},
};
/** the Tlaxcala hole ring, world px (smoothed; the enclave's outline) */
export const TLAX_RING: P2[] = ${JSON.stringify(TLAX.map(([x, y]) => [r3(x), r3(y)]))};

/** Lake Texcoco 1519, smoothed (the rasters' lake), world px */
export const LAKE_SMOOTH: P2[] = ${JSON.stringify(LAKE_RING.map(([x, y]) => [r3(x), r3(y)]))};

/** THE CLAIM (cut A): the carved piece (world px), its centre, and THE PEN: one polyline, the
 *  claim's arc (east crossing P1 -> south -> west crossing P2, length PEN_ARC_LEN) then the
 *  tie to Tenochtitlan */
export const CLAIM_D = ${JSON.stringify(multiD(CLAIM))};
export const CLAIM_POLYS: P2[][][] = ${JSON.stringify(roundMulti(CLAIM))};
export const CLAIM_CENTRE: P2 = ${JSON.stringify(CLAIM_C.map(r3))};
export const PEN_PTS: P2[] = ${JSON.stringify(PEN_PTS.map(([x, y]) => [r3(x), r3(y)]))};
export const PEN_ARC_LEN = ${r3(PEN_ARC_LEN)};
export const PEN_LEN = ${r3(PEN_CUM.at(-1))};
export const CLAIM_P1: P2 = ${JSON.stringify(P1.map(r3))};
export const CLAIM_P2: P2 = ${JSON.stringify(P2.map(r3))};
`,
);
console.log(`Wrote ${OUT_STATIC} and ${OUT} (pen ${(PEN_CUM.at(-1) / KM).toFixed(0)} km: arc ${(PEN_ARC_LEN / KM).toFixed(0)} km + tie)`);
