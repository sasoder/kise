// The map tool's data module: the light OVERLAYS a clip's cuts import (no d3 at
// render time). A world's module is its header comment, its types, PROJ +
// project(), then the config's `exports` in order, each one `export const`.
//
// An export entry (config worlds.<w>.data.exports[]):
//   { name, doc?, type?, region: "manchukuo" | (c) => MP, edge?: {step, off, thin} }
//        -> { d: land-clipped fill path, edge: inland boundary runs, box }   (type ": Region")
//   { name, doc?, type?, places: { key: [lon, lat] } }  -> { key: [x, y] } world px (r2)
//   { name, doc?, type?, route: [[name, lon, lat]...], per?, thin? }
//        -> { pts, len, stations: { name: arclength } }                     (type ": RouteData")
//   { name, doc?, type?, value: any | (c) => any }       -> the value, as JSON
// Value functions get the context c (see buildContext): c.W, c.P, c.R (the
// regions), c.land, c.coast, c.out (earlier exports by name) and the helpers.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { dist, inlandRuns, r2, ringArea, thinLine, thinRing, catmull } from "./geo.mjs";
import { projectionTs } from "./projection.mjs";

// ---------------------------------------------------------------------------
// serialisers
// ---------------------------------------------------------------------------
export const ptsD = (pts, close = false) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}`;
export const mpD = (mp) =>
  mp
    .map((poly) =>
      poly
        .map((ring) => {
          const r = dist(ring[0], ring[ring.length - 1]) < 1e-9 ? ring.slice(0, -1) : ring;
          return r.length >= 3 ? ptsD(r, true) : "";
        })
        .join(""),
    )
    .join("");
export const mpBox = (mp) => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const poly of mp) for (const [x, y] of poly[0]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return [r2(x0), r2(y0), r2(x1), r2(y1)];
};
export const roundPts = (pts) => pts.map(([x, y]) => [r2(x), r2(y)]);
export const cumOf = (pts) => {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i], pts[i - 1]));
  return c;
};
/** a coarse MultiPolygon as nested point arrays (for in-polygon tests: dot fields) */
export const coarse = (mp, step, minArea) =>
  mp
    .map((poly) => poly.map((r) => roundPts(thinRing(r, step))).filter((r) => r.length >= 3))
    .filter((poly) => poly.length && Math.abs(ringArea(poly[0])) >= minArea);
export const regionObj = (mp, coast, edgeOpts) => {
  const runs = inlandRuns(mp, coast, edgeOpts);
  return { d: mpD(mp), edge: runs.map((r) => ptsD(r)).join(""), box: mpBox(mp) };
};
export const tsConst = (name, value, doc, type = "") => `${doc ? `/** ${doc} */\n` : ""}export const ${name}${type} = ${JSON.stringify(value)};\n`;

/** a route through stations [[name, lon, lat]...]: centripetal Catmull-Rom in world px, with arclength */
export const routeOf = (W, stations, { per = 24, thin = 0.25 } = {}) => {
  const pts = stations.map(([, lon, lat]) => W.proj([lon, lat]));
  const curve = catmull(pts, per);
  const fine = thinLine(curve, thin);
  const cum = cumOf(fine);
  // station arclengths: nearest fine sample to each station
  const st = {};
  stations.forEach(([name], i) => {
    const p = pts[i];
    let best = 0;
    let bd = Infinity;
    fine.forEach((q, j) => {
      const d = dist(p, q);
      if (d < bd) [bd, best] = [d, j];
    });
    st[name] = r2(cum[best]);
  });
  return { pts: roundPts(fine), len: r2(cum[cum.length - 1]), stations: st };
};
/** { key: [lon, lat] } -> { key: [x, y] } world px */
export const placesOf = (W, o) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => {
      const [x, y] = W.proj(v);
      return [k, [r2(x), r2(y)]];
    }),
  );
/** a suggested camera { x, y, k } that fits a world px box [x0, y0, x1, y1] in frac of the frame */
export const fitBox = (box, frac = 0.92, frame = [1080, 1920]) => {
  const [x0, y0, x1, y1] = box;
  return { x: r2((x0 + x1) / 2), y: r2((y0 + y1) / 2), k: r2(Math.min((frame[0] * frac) / (x1 - x0), (frame[1] * frac) / (y1 - y0))) };
};
/** the same for a lon/lat box (sampled on an 11 x 11 grid) */
export const fitLL = (W, { lon, lat }, frac = 0.92, frame = [1080, 1920]) => {
  const c = [];
  for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) c.push(W.proj([lon[0] + ((lon[1] - lon[0]) * i) / 10, lat[0] + ((lat[1] - lat[0]) * j) / 10]));
  return fitBox([Math.min(...c.map((q) => q[0])), Math.min(...c.map((q) => q[1])), Math.max(...c.map((q) => q[0])), Math.max(...c.map((q) => q[1]))], frac, frame);
};
/** the bbox [x0, y0, x1, y1] of point lists */
export const ptsBox = (...lists) => {
  const pts = lists.flat();
  return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
};

// ---------------------------------------------------------------------------
// types: names below expand to the standard declarations; anything else is a raw line
// ---------------------------------------------------------------------------
const STD_TYPES = {
  P2: "export type P2 = [number, number];",
  LL: "export type LL = [number, number];",
  Box: "export type Box = [number, number, number, number];",
  Region: "export type Region = { d: string; edge: string; box: Box };",
  RouteData: "export type RouteData = { pts: P2[]; len: number; stations: Record<string, number> };",
};
export const DEFAULT_TYPES = ["P2", "LL", "Box", "Region", "RouteData"];
/** `export type Name = "a" | "b";` from an object's keys */
export const keyUnion = (name, obj) => `export type ${name} = ${Object.keys(obj).map((k) => `"${k}"`).join(" | ")};`;

// ---------------------------------------------------------------------------
// the module
// ---------------------------------------------------------------------------
export const buildContext = (W, R, land, coast, frame) => {
  const c = {
    W,
    P: W.proj,
    R,
    land,
    coast,
    frame,
    out: {},
    memo: {},
    region: (mp, edgeOpts) => regionObj(mp, coast, edgeOpts),
    places: (o) => placesOf(W, o),
    route: (stations, opts) => routeOf(W, stations, opts),
    fit: (box, frac) => fitBox(box, frac, frame),
    fitLL: (box, frac) => fitLL(W, box, frac, frame),
  };
  return c;
};

/** the module text of one world */
export const dataModule = (W, spec, c, generatedBy) => {
  let body = "";
  for (const e of spec.exports) {
    let value;
    let type = e.type ?? "";
    if (e.region !== undefined) {
      const mp = typeof e.region === "function" ? e.region(c) : c.R[e.region];
      if (!mp) throw new Error(`${W.name}: export ${e.name}: no region "${e.region}"`);
      value = regionObj(mp, c.coast, e.edge);
      type = e.type ?? ": Region";
      console.log(`  ${e.name}: d ${(value.d.length / 1024).toFixed(0)} KB, edge ${(value.edge.length / 1024).toFixed(0)} KB, box ${value.box}`);
    } else if (e.places) value = placesOf(W, e.places);
    else if (e.route) {
      value = routeOf(W, e.route, e);
      type = e.type ?? ": RouteData";
    } else if ("value" in e) value = typeof e.value === "function" ? e.value(c) : e.value;
    else throw new Error(`${W.name}: export ${e.name}: give region, places, route or value`);
    c.out[e.name] = value;
    body += tsConst(e.name, value, e.doc ?? "", type);
  }
  const comment = (spec.comment ?? "").trimEnd();
  const types = (spec.types ?? DEFAULT_TYPES).map((t) => STD_TYPES[t] ?? t).join("\n");
  return `// Generated by ${generatedBy} — do not edit by hand.
${comment ? `${comment.split("\n").map((l) => (l ? `// ${l}` : "//")).join("\n")}\n` : ""}
${types}

export const PROJ = ${JSON.stringify(W.params)};
${projectionTs(W.params, W.tsDoc)}

${body}`;
};

export const writeOut = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};
