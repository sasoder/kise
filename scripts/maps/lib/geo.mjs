// The map tool's geometry: Natural Earth (installed world-atlas), json / geojson
// inputs, small 2D maths, lon/lat clipping, and the layers every world is made
// of (land, period borders, graticule) plus region building (countries,
// lon/lat polygons, boolean ops, inland edges). Everything works in WORLD PX
// (the projection's output; world px == screen px at k 1) unless it says lon/lat.
//
// A world `W` (lib/config.mjs makeWorld) carries: name, proj (d3), params, clip
// {lon, lat} (geometry is clipped to it), lon360, landStep / regionStep (world
// px between kept vertices), graticule (deg), deep [{lon, lat, step}] (land kept
// finer there), skipSouthOf (lat; Antarctica), borders {pairs, extra}.

import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { feature, mesh } from "topojson-client";
import polygonClipping from "polygon-clipping";

/** the kise repo root (inputs are read from here, whatever the cwd) */
export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoPath = (p) => (isAbsolute(p) ? p : join(REPO, p));

// ---------------------------------------------------------------------------
// inputs
// ---------------------------------------------------------------------------
export const readJson = (path) => JSON.parse(readFileSync(repoPath(path), "utf8"));
/** a .geojson / .json FeatureCollection (or a TopoJSON file + object name) -> features */
export const loadFeatures = (path, topoObject = null) => {
  const j = readJson(path);
  if (j.type === "Topology") return feature(j, j.objects[topoObject ?? Object.keys(j.objects)[0]]).features;
  if (j.type === "FeatureCollection") return j.features;
  if (j.type === "Feature") return [j];
  return [{ type: "Feature", properties: {}, geometry: j }];
};

const NE = {};
/** Natural Earth from node_modules/world-atlas ("10m" | "50m" | "110m"), loaded once */
export const naturalEarth = (res = "10m") => {
  if (!NE[res]) {
    const landTopo = readJson(`node_modules/world-atlas/land-${res}.json`);
    const cTopo = readJson(`node_modules/world-atlas/countries-${res}.json`);
    NE[res] = { landTopo, cTopo, land: feature(landTopo, landTopo.objects.land).features, countries: feature(cTopo, cTopo.objects.countries).features };
  }
  return NE[res];
};
/** a Natural Earth country feature by its name (properties.name, e.g. "United States of America") */
export const country = (name, res = "10m") => {
  const f = naturalEarth(res).countries.find((c) => c.properties.name === name);
  if (!f) throw new Error(`no country ${name}`);
  return f;
};
export const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);

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
/** shoelace area (positive = clockwise on screen, y down) */
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
export const clipRingLL = (ring, box) => {
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
      if (ia !== ib) {
        const q = cut(a, b);
        q.cut = true; // a vertex on the clip box: the bake warns if a tile shows one (a false coast)
        out.push(q);
      }
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return pts;
};
/** a ring's longitudes in the world's convention: with W.lon360, rings wholly west
 *  of 100 W move to 260..360; a ring that crosses the antimeridian (Eurasia's
 *  Chukotka seam) is unwrapped east of 180, so no clip runs a false coast along it */
export const wrapRing = (W, ring) => {
  const b = llBox(ring);
  if (W.lon360 && b.x1 < -100) return ring.map(([lon, lat]) => [lon + 360, lat]);
  if (b.x0 < -169 && b.x1 > 100) return ring.map(([lon, lat]) => [lon < -169 ? lon + 360 : lon, lat]);
  return ring;
};
export const boxHit = (b, box) => b.x1 >= box.lon[0] && b.x0 <= box.lon[1] && b.y1 >= box.lat[0] && b.y0 <= box.lat[1];

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
/** centripetal Catmull-Rom through points (any 2D space), `per` samples per span;
 *  out.stationIdx[i] = the sample index of input point i */
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
// LAND: every Natural Earth polygon in the world's clip box, clipped to it,
// projected, thinned. [{ rings: [[x, y]...][], area, box: [x0, y0, x1, y1], deep }]
// ---------------------------------------------------------------------------
const deepStepOf = (W, b) => {
  for (const d of W.deep) if (b.x0 >= d.lon[0] - 0.01 && b.x1 <= d.lon[1] && b.y0 >= d.lat[0] && b.y1 <= d.lat[1]) return d.step;
  return null;
};
export const landOf = (W) => {
  const P = W.proj;
  const out = [];
  out.cutPts = []; // world px of land vertices cut at the clip box
  for (const f of naturalEarth(W.res).land) {
    for (const rings of polysOf(f.geometry)) {
      const outer = wrapRing(W, rings[0]);
      const b = llBox(outer);
      if (b.y1 < W.skipSouthOf) continue; // Antarctica (Eurasia spans -180..180 too: keep it)
      if (!boxHit(b, W.clip)) continue;
      const deepStep = deepStepOf(W, llBox(rings[0]));
      const deep = deepStep !== null;
      const step = deep ? deepStep : W.landStep;
      const proj = [];
      for (const r of rings) {
        const c = clipRingLL(wrapRing(W, r), W.clip);
        if (!c) continue;
        for (const q of c) if (q.cut) out.cutPts.push(P(q));
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
/** the land as a polygon-clipping MultiPolygon (for clipping historical polygons to land) */
export const landMP = (land) => land.map((poly) => poly.rings.map(closeRing));

// ---------------------------------------------------------------------------
// BORDERS of the period: Natural Earth shared borders between the listed
// country pairs (W.borders.pairs, by properties.name), plus any lines the
// config's W.borders.extra(W) returns (world px polylines). Dashed cream ~0.5.
// ---------------------------------------------------------------------------
const pairFilter = (pairs) => (a, b) =>
  a !== b && pairs.some(([p, q]) => (a.properties.name === p && b.properties.name === q) || (a.properties.name === q && b.properties.name === p));
export const bordersOf = (W) => {
  const P = W.proj;
  const lines = [];
  const pairs = W.borders?.pairs ?? [];
  if (pairs.length) {
    const { cTopo } = naturalEarth(W.res);
    const ml = mesh(cTopo, cTopo.objects.countries, pairFilter(pairs));
    for (const line of ml.coordinates) {
      const pr = thinLine(
        line.map((q) => P(q)),
        W.landStep,
      );
      if (pr.length > 1) lines.push(pr);
    }
  }
  if (W.borders?.extra) lines.push(...W.borders.extra(W));
  return lines;
};

/** graticule lines every W.graticule deg over the clip box (to 80 N), sampled each 0.5 deg */
export const graticuleOf = (W) => {
  const P = W.proj;
  const g = W.graticule;
  const lines = [];
  if (!g) return lines;
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

/** period water (W.lakes: lon/lat rings, e.g. Lake Texcoco 1519) as world px rings */
export const lakesOf = (W) => (W.lakes ?? []).map((ring) => ring.map((q) => W.proj(q)));

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
// COAST INDEX: land test + distance to the coast in world px (for inland edges,
// "on land" checks and dot fields).
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
// REGIONS: polygon-clipping MultiPolygons in world px
// ---------------------------------------------------------------------------
/** a country's polygons, projected and thinned, optionally picked by their lon/lat box */
export const countryMP = (W, name, step, pick = () => true) => featureMP(W, country(name, W.res), step, pick);
/** any GeoJSON feature's polygons (lon/lat), projected and thinned */
export const featureMP = (W, f, step, pick = () => true) => {
  const P = W.proj;
  const out = [];
  for (const rings of polysOf(f.geometry)) {
    if (!pick(llBox(rings[0]))) continue;
    const pr = rings.map((r) => thinRing(r.map((q) => P(q)), step)).filter((r) => r.length >= 3);
    if (pr.length && pr[0].length >= 3) out.push(pr);
  }
  return out;
};
export const closeRing = (r) => (dist(r[0], r[r.length - 1]) < 1e-9 ? r : [...r, r[0]]);
/** a lon/lat polygon (densified) projected, as a polygon-clipping MultiPolygon */
export const llPoly = (W, pts, step = 0.05) => [[closeRing(densifyLL(pts, step, true).map((q) => W.proj(q)))]];
export const union = (...mps) => polygonClipping.union(...mps);
export const inter = (a, b) => polygonClipping.intersection(a, b);
export const diff = (a, ...bs) => polygonClipping.difference(a, ...bs);
/** an MP clipped to the land (historical polygons are not coast-accurate) */
export const toLand = (mp, land) => {
  if (!mp.length) return mp;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of mp) for (const [x, y] of poly[0]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  const near = land.filter((p) => p.box[2] >= x0 && p.box[0] <= x1 && p.box[3] >= y0 && p.box[1] <= y1);
  return near.length ? inter(mp, landMP(near)) : [];
};
/** drop the slivers boolean ops leave where two Natural Earth rings disagree
 *  (mean width < ~0.25 world px), keep real islets */
export const clean = (mp, minArea = 4, minWidth = 0.12) =>
  mp.filter((poly) => {
    const r = poly[0];
    const a = Math.abs(ringArea(r));
    let per = 0;
    for (let i = 0; i < r.length; i++) per += dist(r[i], r[(i + 1) % r.length]);
    return a > minArea || a / Math.max(1e-9, per) > minWidth;
  });

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
