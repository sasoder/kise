// Bakes the geometry of THE MAYA WORLD for the cut OneFellSwoop (clip
// "Sheppard: centralized empires fell fast", Dwarkesh with Si Sheppard;
// Dwarkesh map style): central Mexico to Yucatan and the Guatemalan highlands.
//
//   bun scripts/build-maya-map.mjs
//
// Reads Natural Earth 10m land (world-atlas), scripts/cortes-geo.json (the
// georeferenced 1519 Aztec empire rings, never edited) and
// generated/components/tlaxProvinces.ts (the Codex Mendoza tributary-province
// head towns, lon/lat). Writes
//   generated/components/mayaStatic.ts   the heavy STATIC layers (land,
//                                         graticule), read only by
//                                         scripts/bake-maya-rasters.mjs
//   generated/components/mayaMapData.ts  projection + the light overlays
//
// THE PROJECTION: north-up Lambert conformal conic, standard parallels 14 N /
// 22 N, centre meridian 94.7 W. World px == screen px at THE WIDE (camera
// { k: 1, cx: 540, cy: 960 }): 60 px per degree of longitude at 19.4 N
// (lon -103.7 ... -85.7 across the 1080 px), Tenochtitlan's parallel at y 800.
//
// THE AZTEC TREE: one head at Tenochtitlan, the province heads as nodes. A head
// hangs from the nearest head that lies within 35 deg of its own bearing from
// the capital and at most 0.75 of its distance; otherwise from the capital.
// Heads within CORE_PX of the capital (the valley towns: they sit inside the
// capital's disc at this scale) are not drawn apart; the Xoconochco exclave
// is left out (see EXCLAVE).
//
// THE MAYA POLITIES c. 1520s-1540s: capital sites (lon/lat as briefed by the
// director; Yucatan provinces after Roys 1957, "The Political Geography of the
// Yucatan Maya"). Lower-priority ones (star) are dropped where they would sit
// within MIN_SEP of a kept head; the rest are pushed apart to MIN_SEP by a
// small relaxation (each stays within NUDGE_MAX_KM of its site; logged).
// Dependents (3-4 per polity) are schematic: they stand for subject towns, not
// for named places.

import { readFileSync, writeFileSync } from "node:fs";
import { geoConicConformal, geoArea } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";
import { PROVINCES } from "../generated/components/tlaxProvinces.ts";

const OUT_STATIC = "generated/components/mayaStatic.ts";
const OUT = "generated/components/mayaMapData.ts";
const GEO = JSON.parse(readFileSync("scripts/cortes-geo.json", "utf8"));

// ---------------------------------------------------------------------------
// projection
// ---------------------------------------------------------------------------
const PARALLELS = [14, 22];
const ROTATE = [94.7, 0];
const LON_PX = 60; // px per degree of longitude at Tenochtitlan's latitude
const TEN_LL = GEO.sites.tenochtitlan.lonlat;
const projection = geoConicConformal().parallels(PARALLELS).rotate(ROTATE).scale(1).translate([0, 0]);
{
  const a = projection([-95.7, TEN_LL[1]]);
  const b = projection([-93.7, TEN_LL[1]]);
  projection.scale((2 * LON_PX) / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const c = projection([-94.7, TEN_LL[1]]);
  projection.translate([540 - c[0], 800 - c[1]]);
}
const SCALE = projection.scale();
const TRANSLATE = projection.translate();
const P = (ll) => projection(ll);
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const r4 = (v) => Math.round(v * 10000) / 10000;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const PX_PER_KM = (() => {
  const a = P([-90, 19]);
  const b = P([-90, 20]);
  return dist(a, b) / 111.19;
})();
console.log(`scale ${SCALE.toFixed(2)}, translate ${TRANSLATE.map((v) => v.toFixed(2))}, ${PX_PER_KM.toFixed(4)} world px per km; Tenochtitlan ${P(TEN_LL).map(r2)}`);

const toD = (pts, close = false, r = r2) => (pts.length ? `M${pts.map(([x, y]) => `${r(x)},${r(y)}`).join("L")}${close ? "Z" : ""}` : "");
const multiD = (mp, r = r2) => mp.map((poly) => poly.map((ring) => toD(ring.slice(0, -1), true, r)).join("")).join("");
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};

// ---------------------------------------------------------------------------
// LAND (Natural Earth 10m), clipped to the world rect; graticule
// ---------------------------------------------------------------------------
const RECT = { x0: -520, x1: 1600, y0: -520, y1: 2440 };
const RECT_POLY = [
  [
    [RECT.x0, RECT.y0],
    [RECT.x1, RECT.y0],
    [RECT.x1, RECT.y1],
    [RECT.x0, RECT.y1],
    [RECT.x0, RECT.y0],
  ],
];
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
const VIEW = { lon: [-128, -62], lat: [-20, 48] };
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const landLL = [];
for (const f of feature(landTopo, landTopo.objects.land).features)
  for (const rings of polysOf(f.geometry)) {
    const b = llBox(rings[0]);
    if (b.x1 - b.x0 >= 180 || b.x1 < VIEW.lon[0] || b.x0 > VIEW.lon[1] || b.y1 < VIEW.lat[0] || b.y0 > VIEW.lat[1]) continue;
    if (geoArea({ type: "Polygon", coordinates: [rings[0]] }) > 2 * Math.PI) continue;
    landLL.push(rings);
  }
// clip in lon/lat first (the Americas ring runs to Cape Horn and Alaska), then project;
// the lon/lat box lies far outside the world rect
const VIEW_POLY = [
  [
    [VIEW.lon[0], VIEW.lat[0]],
    [VIEW.lon[1], VIEW.lat[0]],
    [VIEW.lon[1], VIEW.lat[1]],
    [VIEW.lon[0], VIEW.lat[1]],
    [VIEW.lon[0], VIEW.lat[0]],
  ],
];
const landW = polygonClipping.intersection(landLL, VIEW_POLY).map((poly) => poly.map((r) => r.map(P)));
{
  const c = [P([VIEW.lon[0], VIEW.lat[0]]), P([VIEW.lon[1], VIEW.lat[0]]), P([VIEW.lon[0], VIEW.lat[1]]), P([VIEW.lon[1], VIEW.lat[1]])];
  console.log(`lon/lat view corners (world px): ${c.map((q) => q.map((v) => v.toFixed(0)).join(",")).join(" | ")}`);
}
const LANDW = polygonClipping.intersection(landW, RECT_POLY);
const WL_MIN_KM2 = 100;
const LAND_WL = LANDW.filter((poly) => Math.abs(ringArea(poly[0])) / (PX_PER_KM * PX_PER_KM) >= WL_MIN_KM2);
console.log(`land: ${LANDW.length} polygons in the rect (${LAND_WL.length} of them >= ${WL_MIN_KM2} km2 carry water-lines)`);
const LAND_D = multiD(LANDW);
const LAND_WL_D = multiD(LAND_WL);

let GRATICULE_D = "";
for (let lon = -130; lon <= -60; lon += 5) {
  const pts = [];
  for (let lat = -10; lat <= 45; lat += 0.5) pts.push(P([lon, lat]));
  GRATICULE_D += toD(pts);
}
for (let lat = -10; lat <= 45; lat += 5) {
  const pts = [];
  for (let lon = -130; lon <= -60; lon += 0.5) pts.push(P([lon, lat]));
  GRATICULE_D += toD(pts);
}

// land test (even-odd over the clipped land), with a row index
const coastSegs = [];
for (const poly of LANDW) for (const ring of poly) for (let i = 1; i < ring.length; i++) coastSegs.push([ring[i - 1][0], ring[i - 1][1], ring[i][0], ring[i][1]]);
const BUCKET = 8;
const rowGrid = new Map();
const segGrid = new Map();
coastSegs.forEach(([ax, ay, bx, by], i) => {
  const j0 = Math.floor(Math.min(ay, by) / BUCKET);
  const j1 = Math.floor(Math.max(ay, by) / BUCKET);
  const i0 = Math.floor(Math.min(ax, bx) / BUCKET);
  const i1 = Math.floor(Math.max(ax, bx) / BUCKET);
  for (let b = j0; b <= j1; b++) {
    if (!rowGrid.has(b)) rowGrid.set(b, []);
    rowGrid.get(b).push(i);
    for (let a = i0; a <= i1; a++) {
      const k = `${a},${b}`;
      if (!segGrid.has(k)) segGrid.set(k, []);
      segGrid.get(k).push(i);
    }
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
const segDist = (p, a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const coastDist = (x, y, max = 16) => {
  let best = Infinity;
  const R = Math.ceil(max / BUCKET);
  const i0 = Math.floor(x / BUCKET);
  const j0 = Math.floor(y / BUCKET);
  for (let a = i0 - R; a <= i0 + R; a++)
    for (let b = j0 - R; b <= j0 + R; b++)
      for (const i of segGrid.get(`${a},${b}`) ?? []) {
        const [ax, ay, bx, by] = coastSegs[i];
        best = Math.min(best, segDist([x, y], [ax, ay], [bx, by]));
      }
  return best;
};

// ---------------------------------------------------------------------------
// THE AZTEC EMPIRE 1519 (cortes-geo.json rings, re-projected)
//   EMPIRE = ((outer - Tlaxcala - Teotitlan) + Soconusco) n land
// ---------------------------------------------------------------------------
const close = (r) => (dist(r[0], r[r.length - 1]) < 1e-9 ? r : [...r, r[0]]);
const [OUTER, TLAX, TEOT, SOCO] = GEO.aztec_empire_1519.rings.map((ring) => ring.map(P));
// the Xoconochco (Soconusco) exclave is left out of this cut (director, R1): an unexplained
// patch beside the Maya highlands
void SOCO;
const empRaw = polygonClipping.difference([close(OUTER)], [close(TLAX)], [close(TEOT)]);
const EMPIRE = polygonClipping.intersection(empRaw, LANDW);
const EMPIRE_D = multiD(EMPIRE);
// the borders over land (the coast is not a border)
const runsOverLand = (pts) => {
  const runs = [];
  let run = [];
  for (const q of [...pts, pts[0]]) {
    if (isLand(q[0], q[1]) && coastDist(q[0], q[1], 8) > 0.9) run.push(q);
    else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
};
const densify = (ring, step = 0.6) => {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let s = 0; s < n; s++) out.push([a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n]);
  }
  return out;
};
const EMPIRE_BORDER_D = [OUTER, TLAX, TEOT]
  .flatMap((r) => runsOverLand(densify(r)))
  .map((r) => toD(r))
  .join("");
console.log(`empire: ${EMPIRE.length} polygons, ${(EMPIRE.reduce((s, p) => s + Math.abs(ringArea(p[0])), 0) / (PX_PER_KM * PX_PER_KM)).toFixed(0)} km2 (outer rings)`);

// ---------------------------------------------------------------------------
// THE AZTEC TREE
// ---------------------------------------------------------------------------
const TEN = P(TEN_LL);
const CORE_PX = 22; // world px (= screen px in the wide): inside / touching the capital's disc
const heads = PROVINCES.filter((p) => p.id < 100).map((p) => ({ id: p.id, name: p.name, ll: p.headLonLat, p: P(p.headLonLat) }));
const core = heads.filter((h) => dist(h.p, TEN) < CORE_PX);
// the Xoconochco (Soconusco) exclave is not wired: its link would run ~570 km across land
// outside the empire, into the Maya highlands' corner of the frame
const EXCLAVE = new Set(["xoconochco"]);
const exclaveIds = new Set(PROVINCES.filter((p) => EXCLAVE.has(p.key)).map((p) => p.id));
const kept = heads.filter((h) => dist(h.p, TEN) >= CORE_PX && !exclaveIds.has(h.id));
console.log(`Aztec heads not wired (exclave): ${heads.filter((h) => exclaveIds.has(h.id)).map((h) => h.name).join(", ")}`);
console.log(
  `Aztec heads: ${heads.length} province heads in tlaxProvinces (id < 100); ${core.length} within ${CORE_PX} px (${(CORE_PX / PX_PER_KM).toFixed(0)} km) of the capital not drawn apart: ${core.map((h) => h.name).join(", ")}`,
);
// R1 topology: a head hangs from a nearer-to-capital head only if that head lies within
// CONE_DEG of its own bearing from the capital and at most REACH of its distance; of those
// the nearest to it; otherwise it hangs straight from the capital
const CONE_DEG = 35;
const REACH = 0.75;
const bearing = (p) => Math.atan2(p[1] - TEN[1], p[0] - TEN[0]);
const AZ_NODES = kept.map((h) => {
  const d = dist(h.p, TEN);
  const bh = bearing(h.p);
  let best = -1;
  let bd = Infinity;
  kept.forEach((o, j) => {
    if (o === h) return;
    if (dist(o.p, TEN) > REACH * d) return;
    let db = Math.abs(bearing(o.p) - bh);
    if (db > Math.PI) db = 2 * Math.PI - db;
    if (db > (CONE_DEG * Math.PI) / 180) return;
    const q = dist(o.p, h.p);
    if (q < bd) [bd, best] = [q, j];
  });
  return { id: h.id, name: h.name, lon: h.ll[0], lat: h.ll[1], x: r3(h.p[0]), y: r3(h.p[1]), d: r3(d), parent: best };
});
{
  const depth = (i) => (AZ_NODES[i].parent < 0 ? 1 : 1 + depth(AZ_NODES[i].parent));
  const trunks = AZ_NODES.filter((n) => n.parent < 0).length;
  const ds = AZ_NODES.map((n) => n.d).sort((a, b) => a - b);
  console.log(
    `Aztec tree: ${AZ_NODES.length} nodes, ${trunks} trunks from the capital, max depth ${Math.max(...AZ_NODES.map((_, i) => depth(i)))}; distance px: median ${ds[ds.length >> 1].toFixed(0)}, p90 ${ds[Math.floor(ds.length * 0.9)].toFixed(0)}, max ${ds.at(-1).toFixed(0)}`,
  );
}

// ---------------------------------------------------------------------------
// THE MAYA POLITIES
// ---------------------------------------------------------------------------
const K_OPEN = 1.95; // the opening framing's zoom (screen px per world px)
const MIN_SEP = 62 / K_OPEN; // world px between heads
const NUDGE_MAX_KM = 26;
const POLITIES = [
  // Yucatan provinces (kuchkabalob; Roys 1957)
  ["Ah Canul", "Calkini", -90.05, 20.37],
  ["Can Pech", "Campeche", -90.53, 19.85],
  ["Chanputun", "Champoton", -90.72, 19.35],
  ["Ceh Pech", "Motul", -89.28, 21.1],
  ["Chakan", "Caucel / T'ho", -89.62, 20.97, "*"],
  ["Hocaba", "Hocaba", -89.25, 20.82, "*"],
  ["Ah Kin Chel", "Izamal", -89.02, 20.93],
  ["Tutul Xiu", "Mani", -89.39, 20.39],
  ["Sotuta", "Sotuta", -89.01, 20.6],
  ["Cupul", "Saci / Valladolid", -88.2, 20.69],
  ["Tases", "Chancenote", -87.78, 21.03, "*"],
  ["Chikinchel", "Chauaca", -87.95, 21.4],
  ["Ecab", "Ecab", -87.07, 21.5],
  ["Cochuah", "Tihosuco", -88.37, 20.2],
  ["Uaymil", "Bacalar", -88.39, 18.68],
  ["Chetumal", "Santa Rita / Chactemal", -88.39, 18.4],
  ["Cozumel", "Cozumel", -86.95, 20.45, "*"],
  // Peten and south
  ["Itza", "Nojpeten", -89.89, 16.93],
  ["Kowoj", "Zacpeten", -89.67, 16.99, "*"],
  ["Acalan", "Itzamkanac", -90.7, 18.1, "", "approximate"],
  ["Lakandon Ch'ol", "Sac Balam", -91.1, 16.4, "", "approximate"],
  // highlands
  ["K'iche'", "Q'umarkaj", -91.17, 15.02],
  ["Kaqchikel", "Iximche", -91.0, 14.74],
  ["Tz'utujil", "Chuitinamit", -91.23, 14.64, "*"],
  ["Mam", "Zaculeu", -91.49, 15.33],
  ["Poqomam", "Mixco Viejo", -90.66, 14.87],
  ["Rabinal", "Rabinal", -90.49, 15.09],
  ["Ixil", "Nebaj", -91.15, 15.41, "*"],
  ["Tzotzil", "Zinacantan", -92.72, 16.76],
].map(([name, capital, lon, lat, star, note]) => ({ name, capital, lon, lat, star: star === "*", note: note ?? "", site: P([lon, lat]) }));

// 1. drop a starred polity that sits within MIN_SEP of an unstarred one, or of an earlier kept starred one
const keptPol = POLITIES.filter((p) => !p.star);
for (const p of POLITIES.filter((q) => q.star)) {
  const near = keptPol.find((o) => dist(o.site, p.site) < MIN_SEP);
  if (near) console.log(`  dropped ${p.name} (${(dist(near.site, p.site) * K_OPEN).toFixed(0)} px from ${near.name} in the opening framing)`);
  else keptPol.push(p);
}
// 2. relax the rest apart to MIN_SEP, each tethered to its site
const pos = keptPol.map((p) => [...p.site]);
const NUDGE_MAX = NUDGE_MAX_KM * PX_PER_KM;
for (let it = 0; it < 400; it++) {
  const mv = pos.map(() => [0, 0]);
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++) {
      const d = dist(pos[i], pos[j]);
      if (d >= MIN_SEP) continue;
      const push = (MIN_SEP - d) / 2;
      const ux = (pos[j][0] - pos[i][0]) / (d || 1);
      const uy = (pos[j][1] - pos[i][1]) / (d || 1);
      mv[i][0] -= ux * push;
      mv[i][1] -= uy * push;
      mv[j][0] += ux * push;
      mv[j][1] += uy * push;
    }
  pos.forEach((p, i) => {
    let nx = p[0] + mv[i][0] * 0.5;
    let ny = p[1] + mv[i][1] * 0.5;
    // tether
    const s = keptPol[i].site;
    const off = Math.hypot(nx - s[0], ny - s[1]);
    if (off > NUDGE_MAX) {
      nx = s[0] + ((nx - s[0]) * NUDGE_MAX) / off;
      ny = s[1] + ((ny - s[1]) * NUDGE_MAX) / off;
    }
    // stay on land (islands excepted: Cozumel's own site is land)
    if (isLand(nx, ny) || !isLand(s[0], s[1])) {
      p[0] = nx;
      p[1] = ny;
    }
  });
}
// 3. dependents: 3-4 per polity, on land where possible, turned away from the neighbours
const hash = (i, k) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const TREE_R_MAX = 27 / K_OPEN;
const MAYA = keptPol.map((p, i) => {
  const c = pos[i];
  let nn = Infinity;
  pos.forEach((q, j) => {
    if (j !== i) nn = Math.min(nn, dist(c, q));
  });
  const R = Math.min(TREE_R_MAX, 0.41 * nn);
  const n = 3 + (hash(i, 1) > 0.45 ? 1 : 0);
  let best = null;
  for (let trial = 0; trial < 48; trial++) {
    const rot = (trial / 48) * Math.PI * 2;
    const deps = [];
    for (let q = 0; q < n; q++) {
      const a = rot + (q / n) * Math.PI * 2 + (hash(i * 7 + q, 2) - 0.5) * 0.7;
      const rr = R * (0.74 + 0.26 * hash(i * 7 + q, 3));
      deps.push([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]);
    }
    let score = 0;
    for (const d of deps) {
      if (!isLand(d[0], d[1])) score -= 40;
      else score += Math.min(3, coastDist(d[0], d[1], 8));
      let m = Infinity;
      pos.forEach((q, j) => {
        if (j !== i) m = Math.min(m, dist(d, q));
      });
      score += Math.min(m, MIN_SEP);
    }
    if (!best || score > best.score) best = { score, deps };
  }
  const nudgeKm = dist(c, p.site) / PX_PER_KM;
  return {
    name: p.name,
    capital: p.capital,
    lon: p.lon,
    lat: p.lat,
    note: p.note,
    x: r3(c[0]),
    y: r3(c[1]),
    nudgeKm: r2(nudgeKm),
    r: r3(R),
    deps: best.deps.map(([x, y]) => [r3(x), r3(y)]),
  };
});
{
  let minSep = Infinity;
  MAYA.forEach((a, i) =>
    MAYA.forEach((b, j) => {
      if (j > i) minSep = Math.min(minSep, dist([a.x, a.y], [b.x, b.y]));
    }),
  );
  console.log(`Maya: ${MAYA.length} polities kept; min head separation ${(minSep * K_OPEN).toFixed(1)} px in the opening framing (k ${K_OPEN})`);
  for (const m of MAYA)
    console.log(
      `  ${m.name.padEnd(15)} ${m.capital.padEnd(24)} (${m.lon}, ${m.lat}) nudged ${m.nudgeKm.toFixed(1)} km, tree r ${(m.r * K_OPEN).toFixed(1)} px, ${m.deps.length} dependents ${m.deps.every(([x, y]) => isLand(x, y)) ? "" : "(one at sea)"} ${m.note}`,
    );
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
writeFileSync(
  OUT_STATIC,
  `// Generated by scripts/build-maya-map.mjs — do not edit by hand.
// The heavy STATIC layers of the Maya world (world px), read only by
// scripts/bake-maya-rasters.mjs. Natural Earth 10m land (world-atlas), clipped
// to x ${RECT.x0}..${RECT.x1}, y ${RECT.y0}..${RECT.y1}.
/** land (evenodd) */
export const LAND_D = ${JSON.stringify(LAND_D)};
/** land of >= ${WL_MIN_KM2} km2 (the engraved water-lines run round these only) */
export const LAND_WL_D = ${JSON.stringify(LAND_WL_D)};
/** 5 degree graticule */
export const GRATICULE_D = ${JSON.stringify(GRATICULE_D)};
`,
);
writeFileSync(
  OUT,
  `// Generated by scripts/build-maya-map.mjs — do not edit by hand.
// THE MAYA WORLD (see mayaShared.tsx for the API). Lambert conformal conic,
// parallels ${PARALLELS.join(" N / ")} N, centre meridian ${ROTATE[0]} W. World px == screen px at
// the wide (k 1): ${PX_PER_KM.toFixed(4)} world px per km.
// Sources: Natural Earth 10m land (world-atlas); scripts/cortes-geo.json (the
// georeferenced 1519 empire after the Commons "Aztec Empire 1519 map-fr.svg");
// tlaxProvinces.ts (the Codex Mendoza province head towns); the Maya capitals
// as listed in the build's header.
export type P2 = [number, number];
export const PROJ = { parallels: ${JSON.stringify(PARALLELS)} as [number, number], rotate: ${JSON.stringify(ROTATE)} as [number, number], scale: ${SCALE}, translate: ${JSON.stringify(TRANSLATE)} as [number, number] };
export const PX_PER_KM = ${r4(PX_PER_KM)};
/** the zoom the Maya polities were spaced for (>= ${(MIN_SEP * K_OPEN).toFixed(0)} screen px between heads) */
export const K_OPEN = ${K_OPEN};

/** Tenochtitlan (world px) */
export const TENOCHTITLAN: P2 = ${JSON.stringify(TEN.map(r3))};
/** the Aztec empire 1519: (outer - Tlaxcala - Teotitlan) n land, without the Soconusco exclave (evenodd, world px) */
export const EMPIRE_D = ${JSON.stringify(EMPIRE_D)};
/** its borders over land (open polylines; the coast is not a border) */
export const EMPIRE_BORDER_D = ${JSON.stringify(EMPIRE_BORDER_D)};
/** THE AZTEC TREE: a province head (world px), its distance d from the capital, and its
 *  parent: the index of the head it hangs from, or -1 = the capital */
export type AztecNode = { id: number; name: string; lon: number; lat: number; x: number; y: number; d: number; parent: number };
export const AZTEC_NODES: AztecNode[] = ${JSON.stringify(AZ_NODES)};

/** THE MAYA POLITIES: the head (world px, nudgeKm from the capital's site), the mini-tree's
 *  radius r (world px) and its schematic dependents */
export type MayaPolity = { name: string; capital: string; lon: number; lat: number; note: string; x: number; y: number; nudgeKm: number; r: number; deps: P2[] };
export const MAYA_POLITIES: MayaPolity[] = ${JSON.stringify(MAYA)};
`,
);
console.log(`Wrote ${OUT_STATIC} (land ${LAND_D.length}, graticule ${GRATICULE_D.length}) and ${OUT}`);
