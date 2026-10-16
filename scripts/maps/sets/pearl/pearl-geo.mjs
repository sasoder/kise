// pearl-geo: the shared geometry of the Pearl Harbor clip's two map worlds
// (Sarah Paine, "How the Depression pushed Japan to Pearl Harbor", Dwarkesh map
// style). Imported by scripts/maps/sets/pearl/build-pearl-maps.mjs (vector data for the cuts)
// and scripts/maps/sets/pearl/bake-pearl-rasters.mjs (the static raster LOD tiles), so both read
// one projection and one set of rings. Natural Earth 10m from world-atlas.
//
// ASIA     north-up Lambert conformal conic, parallels 25/45, centre meridian
//          112 E. World px == screen px at the k 1 "all of China" framing: 65 deg
//          of longitude (79.5..144.5 E at 35 N) span 1080 px. (112 E, 30 N) sits
//          at world (540, 960).
// PACIFIC  north-up Mercator, rotated to 160 E (the cut meridian is 20 W, far
//          off: Hawaii at 158 W lies to the RIGHT of Wake). 120 deg of longitude
//          (90 E..150 W) span 1080 px at k 1. (150 E, 20 N) sits at (540, 960).

import { readFileSync } from "node:fs";
import { geoConicConformal, geoContains, geoMercator } from "d3-geo";
import { feature, mesh } from "topojson-client";
import polygonClipping from "polygon-clipping";

// ---------------------------------------------------------------------------
// projections
// ---------------------------------------------------------------------------
const asiaProj = geoConicConformal().parallels([25, 45]).rotate([-112, 0]).scale(1).translate([0, 0]).precision(0.1);
{
  const a = asiaProj([79.5, 35]);
  const b = asiaProj([144.5, 35]);
  asiaProj.scale(1080 / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const c = asiaProj([112, 30]);
  asiaProj.translate([540 - c[0], 960 - c[1]]);
}
const pacProj = geoMercator().rotate([-160, 0]).scale(1080 / ((120 * Math.PI) / 180)).translate([0, 0]).precision(0.1);
{
  const c = pacProj([150, 20]);
  pacProj.translate([540 - c[0], 960 - c[1]]);
}

export const WORLDS = {
  asia: {
    name: "asia",
    proj: asiaProj,
    params: { kind: "lcc", parallels: [25, 45], rotate: -112, scale: asiaProj.scale(), translate: asiaProj.translate() },
    lon360: false,
    // the base level's box (wide margins), the core (every finer level)
    far: { lon: [62, 168], lat: [-8, 64] },
    clip: { lon: [25, 200], lat: [-48, 78] }, // geometry is clipped to this (wider than any level)
    core: { lon: [80, 158], lat: [-1, 59] },
    regionStep: 0.2, // world px between kept vertices of the region rings
    landStep: 0.07,
    graticule: 5,
  },
  pacific: {
    name: "pacific",
    proj: pacProj,
    params: { kind: "mercator", rotate: -160, scale: pacProj.scale(), translate: pacProj.translate() },
    lon360: true,
    far: { lon: [78, 222], lat: [-50, 74] }, // a portrait frame at k ~1 sees ~50 S .. ~72 N
    clip: { lon: [55, 245], lat: [-56, 77] },
    core: { lon: [86, 214], lat: [-16, 54] },
    regionStep: 0.12,
    landStep: 0.05,
    graticule: 10,
  },
};

// Hawaii is baked to deep zoom: its rings keep every 10m vertex
const HAWAII_LL = { lon: [-161, -154], lat: [18, 23] };
const DEEP_STEP = 0.0015;

// ---------------------------------------------------------------------------
// Natural Earth
// ---------------------------------------------------------------------------
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
export const LAND_FEATURES = feature(landTopo, landTopo.objects.land).features;
export const COUNTRIES = feature(cTopo, cTopo.objects.countries).features;
export const country = (name) => {
  const f = COUNTRIES.find((c) => c.properties.name === name);
  if (!f) throw new Error(`no country ${name}`);
  return f;
};
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);

// ---------------------------------------------------------------------------
// small geometry
// ---------------------------------------------------------------------------
export const r2 = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
};
export const r3 = (v) => {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
};
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const llBox = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return { x0, x1, y0, y1 };
};
export const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const a = r[i];
    const b = r[(i + 1) % r.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
};
/** drop vertices closer than `step` to the last kept one (the ring stays closed) */
export const thinRing = (ring, step) => {
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i++) if (dist(ring[i], out[out.length - 1]) >= step) out.push(ring[i]);
  if (out.length > 2 && dist(out[out.length - 1], out[0]) < step) out.pop();
  return out;
};
export const thinLine = (line, step) => {
  const out = [line[0]];
  for (let i = 1; i < line.length - 1; i++) if (dist(line[i], out[out.length - 1]) >= step) out.push(line[i]);
  if (line.length > 1) out.push(line[line.length - 1]);
  return out;
};
/** Sutherland-Hodgman clip of a (lon, lat) ring to a lon/lat box */
const shClip = (ring, box) => {
  const [L0, L1] = box.lon;
  const [A0, A1] = box.lat;
  const edges = [
    [(q) => q[0] >= L0, (a, b) => [L0, a[1] + ((b[1] - a[1]) * (L0 - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= L1, (a, b) => [L1, a[1] + ((b[1] - a[1]) * (L1 - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= A0, (a, b) => [a[0] + ((b[0] - a[0]) * (A0 - a[1])) / (b[1] - a[1]), A0]],
    [(q) => q[1] <= A1, (a, b) => [a[0] + ((b[0] - a[0]) * (A1 - a[1])) / (b[1] - a[1]), A1]],
  ];
  let pts = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring.slice();
  for (const [inside, cut] of edges) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ia = inside(a);
      const ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) out.push(cut(a, b));
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return pts;
};
/** a ring's longitudes in the world's convention: Pacific rings wholly west of 100 W
 *  move to 260..360; a ring that crosses the antimeridian (Eurasia's Chukotka seam)
 *  is unwrapped east of 180, so no clip ever runs a false coast along the seam */
const wrapRing = (W, ring) => {
  const b = llBox(ring);
  if (W.lon360 && b.x1 < -100) return ring.map(([lon, lat]) => [lon + 360, lat]);
  if (b.x0 < -169 && b.x1 > 100) return ring.map(([lon, lat]) => [lon < -169 ? lon + 360 : lon, lat]);
  return ring;
};
const boxHit = (b, box) => b.x1 >= box.lon[0] && b.x0 <= box.lon[1] && b.y1 >= box.lat[0] && b.y0 <= box.lat[1];
const isHawaii = (b) => b.x0 >= HAWAII_LL.lon[0] + 360 * 0 - 0.01 && b.x1 <= HAWAII_LL.lon[1] && b.y0 >= HAWAII_LL.lat[0] && b.y1 <= HAWAII_LL.lat[1];

/** densify a lon/lat polyline so its projection follows the parallels / meridians */
export const densifyLL = (pts, stepDeg = 0.1, closed = false) => {
  const out = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / stepDeg));
    for (let s = 0; s < m; s++) out.push([a[0] + ((b[0] - a[0]) * s) / m, a[1] + ((b[1] - a[1]) * s) / m]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
};
/** centripetal Catmull-Rom through points (any 2D space), `per` samples per span */
export const catmull = (pts, per = 16) => {
  if (pts.length < 3) return densifyLL(pts, 0.05);
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
    for (let s = 1; s <= per; s++) {
      const t = t1 + ((t2 - t1) * s) / per;
      const lerp = (A, B, ta, tb) => [((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0], ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1]];
      const A1 = lerp(p0, p1, t0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, t0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
    idx.push(out.length - 1);
  }
  out.stationIdx = idx;
  return out;
};

// ---------------------------------------------------------------------------
// LAND: every 10m polygon in the world's far box, clipped to it, projected,
// thinned. [{ rings: [[x, y]...][], area, box: [x0, y0, x1, y1] }]
// ---------------------------------------------------------------------------
export const landOf = (W) => {
  const P = W.proj;
  const out = [];
  for (const f of LAND_FEATURES) {
    for (const rings of polysOf(f.geometry)) {
      const outer = wrapRing(W, rings[0]);
      const b = llBox(outer);
      if (b.y1 < -55) continue; // Antarctica (Eurasia spans -180..180 too: keep it)
      if (!boxHit(b, W.clip)) continue;
      const deep = W.name === "pacific" && isHawaii(llBox(rings[0]));
      const step = deep ? DEEP_STEP : W.landStep;
      const proj = [];
      for (const r of rings) {
        const c = shClip(wrapRing(W, r), W.clip);
        if (!c) continue;
        const pr = thinRing(c.map((q) => P(q)), step);
        if (pr.length >= 3 && Math.abs(ringArea(pr)) > step * step) proj.push(pr);
      }
      if (!proj.length) continue;
      let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
      for (const [x, y] of proj[0]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      out.push({ rings: proj, area: Math.abs(ringArea(proj[0])), box: [x0, y0, x1, y1], deep });
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// BORDERS of the period (1931-41), dashed cream in the raster.
// ---------------------------------------------------------------------------
const BORDER_PAIRS_ASIA = [
  // USSR - China / Mongolia - China / USSR - Mongolia
  ["Russia", "China"],
  ["Russia", "Mongolia"],
  ["Mongolia", "China"],
  ["Kazakhstan", "China"],
  ["Kyrgyzstan", "China"],
  ["Tajikistan", "China"],
  ["Afghanistan", "China"],
  ["Afghanistan", "Tajikistan"],
  ["Afghanistan", "Uzbekistan"],
  ["Afghanistan", "Turkmenistan"],
  ["Afghanistan", "Pakistan"], // the Durand line (British India)
  ["Afghanistan", "Iran"],
  ["Iran", "Pakistan"],
  ["Iran", "Turkmenistan"],
  // Korea (ONE country) - China / USSR
  ["North Korea", "China"],
  ["North Korea", "Russia"],
  // British India (India + Pakistan + Bangladesh) - its neighbours
  ["Pakistan", "China"],
  ["India", "China"],
  ["Siachen Glacier", "China"],
  ["India", "Nepal"],
  ["India", "Bhutan"],
  ["Nepal", "China"],
  ["Bhutan", "China"],
  ["India", "Myanmar"],
  ["Bangladesh", "Myanmar"],
  // British Burma
  ["Myanmar", "China"],
  ["Myanmar", "Laos"],
  ["Myanmar", "Thailand"],
  // French Indochina (Vietnam + Laos + Cambodia, ONE colony)
  ["Vietnam", "China"],
  ["Laos", "China"],
  ["Laos", "Thailand"],
  ["Cambodia", "Thailand"],
  // British Malaya (Malaysia + Singapore, one)
  ["Thailand", "Malaysia"],
  // Borneo: British Borneo (Sarawak, North Borneo, Brunei) - Dutch Borneo
  ["Malaysia", "Indonesia"],
  ["Malaysia", "Brunei"],
  // colonies on the China coast
  ["Hong Kong", "China"],
  ["Macao", "China"],
];
const BORDER_PAIRS_PACIFIC = [
  ...BORDER_PAIRS_ASIA,
  ["Indonesia", "Papua New Guinea"], // Dutch New Guinea - Australian New Guinea / Papua
  ["Indonesia", "Timor-Leste"], // Portuguese Timor
];
const pairFilter = (pairs) => (a, b) =>
  a !== b && pairs.some(([p, q]) => (a.properties.name === p && b.properties.name === q) || (a.properties.name === q && b.properties.name === p));

export const sakhalin = () => {
  const ru = country("Russia");
  for (const rings of polysOf(ru.geometry)) {
    const b = llBox(rings[0]);
    if (b.x0 > 141 && b.x1 < 145.5 && b.y0 > 45.5 && b.y1 > 54) return rings;
  }
  throw new Error("no Sakhalin");
};

/** projected polylines: period borders + the Karafuto line (50 N on Sakhalin) */
export const bordersOf = (W) => {
  const P = W.proj;
  const ml = mesh(cTopo, cTopo.objects.countries, pairFilter(W.name === "pacific" ? BORDER_PAIRS_PACIFIC : BORDER_PAIRS_ASIA));
  const lines = [];
  for (const line of ml.coordinates) {
    const pr = thinLine(
      line.map((q) => P(q)),
      W.landStep,
    );
    if (pr.length > 1) lines.push(pr);
  }
  // Karafuto: 50 N across Sakhalin, over land only
  const sk = { type: "Polygon", coordinates: sakhalin() };
  let run = [];
  for (let i = 0; i <= 400; i++) {
    const ll = [141.4 + (3.6 * i) / 400, 50];
    if (geoContains(sk, ll)) run.push(P(ll));
    else if (run.length) {
      if (run.length > 1) lines.push(run);
      run = [];
    }
  }
  if (run.length > 1) lines.push(run);
  return lines;
};

export const graticuleOf = (W) => {
  const P = W.proj;
  const g = W.graticule;
  const lines = [];
  const lo0 = Math.floor(W.clip.lon[0] / g) * g;
  const lo1 = Math.ceil(W.clip.lon[1] / g) * g;
  const la0 = Math.floor(W.clip.lat[0] / g) * g;
  const la1 = Math.min(80, Math.ceil(W.clip.lat[1] / g) * g);
  for (let lon = lo0; lon <= lo1; lon += g) {
    const l = [];
    for (let lat = la0; lat <= la1 + 1e-9; lat += 0.5) l.push(P([lon, lat]));
    lines.push(l);
  }
  for (let lat = la0; lat <= la1; lat += g) {
    if (Math.abs(lat) > 85) continue;
    const l = [];
    for (let lon = lo0; lon <= lo1 + 1e-9; lon += 0.5) l.push(P([lon, lat]));
    lines.push(l);
  }
  return lines;
};

/** the world px bbox of a lon/lat box (sampled along its edges) */
export const boxPx = (W, box) => {
  const P = W.proj;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  const add = (lon, lat) => {
    const [x, y] = P([lon, lat]);
    [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  };
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    add(box.lon[0] + (box.lon[1] - box.lon[0]) * t, box.lat[0]);
    add(box.lon[0] + (box.lon[1] - box.lon[0]) * t, box.lat[1]);
    add(box.lon[0], box.lat[0] + (box.lat[1] - box.lat[0]) * t);
    add(box.lon[1], box.lat[0] + (box.lat[1] - box.lat[0]) * t);
  }
  return { x0, y0, x1, y1 };
};

// ---------------------------------------------------------------------------
// COAST INDEX: land test + distance to the coast in world px (for the
// "edge over land only" runs and for checks).
// ---------------------------------------------------------------------------
export const coastIndex = (land, box = null) => {
  const BUCKET = 4;
  const segs = [];
  for (const poly of land) {
    if (box && (poly.box[2] < box.x0 || poly.box[0] > box.x1 || poly.box[3] < box.y0 || poly.box[1] > box.y1)) continue;
    for (const ring of poly.rings)
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        segs.push([a[0], a[1], b[0], b[1]]);
      }
  }
  const rowGrid = new Map();
  const segGrid = new Map();
  segs.forEach(([ax, ay, bx, by], i) => {
    const j0 = Math.floor(Math.min(ay, by) / BUCKET);
    const j1 = Math.floor(Math.max(ay, by) / BUCKET);
    const i0 = Math.floor(Math.min(ax, bx) / BUCKET);
    const i1 = Math.floor(Math.max(ax, bx) / BUCKET);
    for (let b = j0; b <= j1; b++) {
      if (!rowGrid.has(b)) rowGrid.set(b, []);
      rowGrid.get(b).push(i);
      for (let a = i0; a <= i1; a++) {
        const k = a * 100003 + b;
        if (!segGrid.has(k)) segGrid.set(k, []);
        segGrid.get(k).push(i);
      }
    }
  });
  const isLand = (x, y) => {
    let c = false;
    for (const i of rowGrid.get(Math.floor(y / BUCKET)) ?? []) {
      const [ax, ay, bx, by] = segs[i];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
    }
    return c;
  };
  const segDist = (x, y, ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  };
  const coastDist = (x, y, max = 8) => {
    let best = Infinity;
    const R = Math.ceil(max / BUCKET);
    const i0 = Math.floor(x / BUCKET);
    const j0 = Math.floor(y / BUCKET);
    for (let a = i0 - R; a <= i0 + R; a++)
      for (let b = j0 - R; b <= j0 + R; b++)
        for (const i of segGrid.get(a * 100003 + b) ?? []) {
          const s = segs[i];
          best = Math.min(best, segDist(x, y, s[0], s[1], s[2], s[3]));
        }
    return best;
  };
  return { isLand, coastDist };
};

// ---------------------------------------------------------------------------
// REGIONS (polygon-clipping in world px)
// ---------------------------------------------------------------------------
/** a country's polygons, projected and thinned, optionally picked by their lon/lat box */
export const countryMP = (W, name, step, pick = () => true) => {
  const P = W.proj;
  const out = [];
  for (const rings of polysOf(country(name).geometry)) {
    if (!pick(llBox(rings[0]))) continue;
    const pr = rings.map((r) => thinRing(r.map((q) => P(q)), step)).filter((r) => r.length >= 3);
    if (pr.length && pr[0].length >= 3) out.push(pr);
  }
  return out;
};
const closeRing = (r) => (dist(r[0], r[r.length - 1]) < 1e-9 ? r : [...r, r[0]]);
/** a lon/lat polygon (densified) projected, as a polygon-clipping MultiPolygon */
export const llPoly = (W, pts, step = 0.05) => [[closeRing(densifyLL(pts, step, true).map((q) => W.proj(q)))]];
const PC = polygonClipping;
export const union = (...mps) => PC.union(...mps);
export const inter = (a, b) => PC.intersection(a, b);
export const diff = (a, ...bs) => PC.difference(a, ...bs);

// --- the lines that define the regions (lon, lat) ----------------------------
// MANCHUKUO 1933 (incl. Jehol): its south-west boundary along the Great Wall and
// the Jehol / Chahar line to the Mongolia border. APPROXIMATE west of 117.5 E.
export const WALL_LL = [
  [119.79, 39.97], // Laolongtou: the Wall meets the sea at Shanhaiguan
  [119.75, 40.0], // Shanhaiguan
  [118.3, 40.4],
  [117.15, 40.7], // Gubeikou
  [116.6, 41.2],
  [116.6, 42.1],
  [116.9, 42.6],
  [117.2, 43.3],
  [117.7, 44.2],
  [118.6, 45.1],
  [119.6, 46.4], // meets the Mongolia-China border
];
// The polygon of China PROPER (everything south / west of the Wall line); from the
// Wall's end it follows the real Mongolia-China border west (so no sliver of Chahar
// north of the last vertex is counted as Manchukuo), then runs through Mongolia;
// its east edge runs through the Bohai strait (south of the Liaodong tip, north of
// the Miaodao islands).
const mongoliaWalk = (from) => {
  const ring = polysOf(country("Mongolia").geometry)[0][0];
  const n = ring.length;
  let bi = 0;
  ring.forEach((q, i) => {
    if (Math.hypot(q[0] - from[0], q[1] - from[1]) < Math.hypot(ring[bi][0] - from[0], ring[bi][1] - from[1])) bi = i;
  });
  const ahead = (d) => ring[(bi + 12 * d + n * 12) % n][0];
  const dir = ahead(1) < ahead(-1) ? 1 : -1;
  const out = [];
  for (let i = bi, c = 0; c < n; i = (i + dir + n) % n, c++) {
    out.push(ring[i]);
    if (ring[i][0] < 112) break;
  }
  return out;
};
const proper = (wall) => [
  [119.85, 39.85],
  ...wall,
  ...mongoliaWalk(wall[wall.length - 1]),
  [110, 46.4],
  [100, 47],
  [95, 50],
  [60, 56],
  [60, 8],
  [125, 8],
  [124.5, 37.0],
  [121.8, 38.45],
  [120.9, 38.62],
  [120.2, 39.3],
];
// The Kwantung Leased Territory: the 1898 line across the peninsula at ~39.45 N
// (the approved SouthManchuriaRailway uses the same number).
export const KWANTUNG_NORTH = 39.45;
const KWANTUNG_BOX = [
  [120.6, KWANTUNG_NORTH],
  [122.45, KWANTUNG_NORTH],
  [122.45, 38.4],
  [120.6, 38.4],
];
// FRONT 1938 (Japanese-held China by early 1939, from city capture dates;
// APPROXIMATE): north (in Mongolia) -> Baotou -> down the Yellow River on the
// Shanxi-Shaanxi border -> Fenglingdu -> east along the river past Zhengzhou
// (which stays Chinese) to Kaifeng -> SE along the 1938 flood course -> Xinyang
// -> west of Wuhan -> Yueyang -> Nanchang (Mar 1939) -> Hangzhou bay.
export const FRONT_LL = [
  [110.0, 44.0], // in Mongolia: the line enters China at the border
  [110.0, 41.4],
  [110.0, 40.6], // Baotou
  [110.6, 40.4],
  [111.2, 40.25], // the river turns south at Togtoh / Hekou
  [111.15, 39.38], // Hequ
  [110.9, 38.5],
  [110.7, 37.5],
  [110.48, 36.6],
  [110.45, 36.15], // Hukou
  [110.6, 35.67], // Yumenkou
  [110.35, 35.0],
  [110.3, 34.6], // Fenglingdu
  [111.2, 34.8], // Sanmenxia
  [112.0, 34.9],
  [112.8, 34.92],
  [113.65, 34.94], // north of Zhengzhou: the river, Zhengzhou south of it stays Chinese
  [114.25, 34.85], // just west of Kaifeng (Kaifeng held, June 1938)
  [115.4, 33.6],
  [114.6, 32.6],
  [114.1, 32.1], // Xinyang
  [113.8, 30.6], // west of Wuhan
  [113.1, 29.4], // Yueyang
  [115.7, 28.7], // Nanchang (Mar 1939), just west of the city
  [117.3, 29.2],
  [118.8, 29.8],
  [120.6, 30.2], // Hangzhou bay
  [121.8, 30.35], // out to sea
];
const occupiedPoly = (frontDense) => [...frontDense, [123.5, 30.6], [127, 34], [136, 44], [128, 56], [110, 56], [110, 44.0]];
// the Canton pocket (Oct 1938): Guangzhou and the Pearl River delta; Hong Kong and
// Macau are their own Natural Earth countries, so intersecting with China leaves them out
const CANTON_LL = [
  [112.85, 23.3],
  [113.1, 23.6],
  [113.6, 23.68],
  [114.05, 23.5],
  [114.35, 23.15],
  [114.5, 22.75],
  [114.6, 22.2], // sea (Mirs / Bias bay side)
  [113.9, 21.85], // sea
  [112.95, 21.9], // sea
  [112.8, 22.55],
];
// Tonkin (northern French Indochina, Japanese troops from Sept 1940): Vietnam north
// of ~20 N (the Tonkin-Annam line ran at about 20 N: Ninh Binh / Thanh Hoa)
export const TONKIN_SOUTH = 20.0;

/** drop the slivers boolean ops leave where two Natural Earth rings disagree
 *  (mean width < ~0.25 world px), keep real islets */
const clean = (mp) =>
  mp.filter((poly) => {
    const r = poly[0];
    const a = Math.abs(ringArea(r));
    let per = 0;
    for (let i = 0; i < r.length; i++) per += dist(r[i], r[(i + 1) % r.length]);
    return a > 4 || a / Math.max(1e-9, per) > 0.12;
  });
/** all the regions of a world, as polygon-clipping MultiPolygons in world px */
export const regionsOf = (W) => {
  const s = W.regionStep;
  const china = countryMP(W, "China", s);
  const japan = countryMP(W, "Japan", s);
  const korea = union(countryMP(W, "North Korea", s), countryMP(W, "South Korea", s));
  const taiwan = countryMP(W, "Taiwan", s);
  const sk = [sakhalin().map((r) => thinRing(r.map((q) => W.proj(q)), s))];
  const karafuto = inter(sk, llPoly(W, [[140.5, 45.4], [145.6, 45.4], [145.6, 50], [140.5, 50]]));
  const kurils = countryMP(W, "Russia", s, (b) => b.x0 >= 145.2 && b.x1 <= 157.5 && b.y1 <= 51.0 && b.y0 >= 43.0);
  const kwantung = inter(china, llPoly(W, KWANTUNG_BOX));
  const japan1931 = union(japan, korea, taiwan, karafuto, kurils, kwantung);

  const wallDense = catmull(WALL_LL, 12);
  const manchukuo = clean(diff(china, llPoly(W, proper(wallDense.slice(1)), 0.1), kwantung));

  const frontDense = catmull(FRONT_LL, 14);
  const hainan = countryMP(W, "China", s, (b) => b.x0 > 108.3 && b.x1 < 111.3 && b.y0 > 17.9 && b.y1 < 20.3);
  const occNorth = clean(diff(inter(china, llPoly(W, occupiedPoly(frontDense), 0.1)), manchukuo, kwantung));
  const canton = inter(china, llPoly(W, CANTON_LL));
  const occupied = union(occNorth, canton, hainan);
  const freeChina = clean(diff(china, manchukuo, occupied, kwantung));
  const vietnam = countryMP(W, "Vietnam", s);
  const tonkin = inter(vietnam, llPoly(W, [[100, TONKIN_SOUTH], [110.5, TONKIN_SOUTH], [110.5, 24], [100, 24]]));
  const indochina = union(vietnam, countryMP(W, "Laos", s), countryMP(W, "Cambodia", s));
  const out = { china, japan1931, kwantung, manchukuo, occupied, freeChina, tonkin, indochina, hainan, canton, frontDense, wallDense };
  if (W.name === "pacific") {
    const mandate = union(
      countryMP(W, "Palau", 0.02),
      countryMP(W, "Micronesia", 0.02),
      countryMP(W, "Marshall Is.", 0.02),
      countryMP(W, "N. Mariana Is.", 0.02),
    );
    out.mandate = mandate;
    out.japan1941 = union(japan1931, manchukuo, occupied, indochina, mandate);
  }
  return out;
};

/** the inland runs of a region's boundary (over land, away from the coast): the
 *  dashed orange edge. Returns polylines (world px). */
export const inlandRuns = (mp, coast, { step = 0.35, off = 0.8, thin = 0.9 } = {}) => {
  const runs = [];
  for (const poly of mp)
    for (const ring of poly) {
      const r = ring.slice();
      if (dist(r[0], r[r.length - 1]) < 1e-9) r.pop();
      const dense = [];
      for (let i = 0; i < r.length; i++) {
        const a = r[i];
        const b = r[(i + 1) % r.length];
        const n = Math.max(1, Math.ceil(dist(a, b) / step));
        for (let j = 0; j < n; j++) dense.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
      }
      const inland = dense.map(([x, y]) => coast.coastDist(x, y, off * 2 + 4) > off && coast.isLand(x, y));
      // start the walk at a coastal point, so a run never wraps the seam
      let start = inland.findIndex((v) => !v);
      if (start < 0) {
        runs.push(thinLine([...dense, dense[0]], thin));
        continue;
      }
      let run = [];
      for (let k = 0; k <= dense.length; k++) {
        const i = (start + k) % dense.length;
        if (inland[i] && k < dense.length) run.push(dense[i]);
        else {
          if (run.length > 2) runs.push(thinLine(run, thin));
          run = [];
        }
      }
    }
  return runs;
};
