// Bakes the two racers for the cut FasterBetterCheaper (Hadrian Machina 06):
// the real outlines of the contiguous United States and of mainland China
// (mainland polygon only), each in its own familiar conic projection, simplified and
// normalised to a box 1000 units wide centred on (0, 0).
//
//   bun scripts/build-machina06-countries.mjs
//
// Reads  node_modules/world-atlas/countries-50m.json (Natural Earth 1:50m)
// Writes public/machina06/countries.json
//   { us: { w: 1000, h, d }, china: { w: 1000, h, d } }   d = SVG path, y down
//
// USA (id 840): the largest polygon of the multipolygon is the contiguous 48.
//   Albers equal-area conic, parallels 29.5 N / 45.5 N, centre meridian 96 W.
// China (id 156): the largest polygon is the mainland, and only it is kept
//   (no Hainan; Taiwan is its own feature in Natural Earth).
//   Albers equal-area conic, parallels 25 N / 47 N, centre meridian 105 E.
// Exterior rings only; Douglas-Peucker at 2.2 units (about 1 px at the size the
// cut draws them), so the shapes are clean flat silhouettes.

/* global console */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { geoArea, geoConicEqualArea } from "d3-geo";
import { feature } from "topojson-client";

const TOL = 2.2;
const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const countries = feature(topo, topo.objects.countries).features;

const polygonsOf = (id) => {
  const f = countries.find((c) => String(c.id) === id);
  if (!f) throw new Error(`country ${id} not found`);
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys
    .map((coordinates) => ({ coordinates, area: geoArea({ type: "Polygon", coordinates }) }))
    .sort((a, b) => b.area - a.area);
};

const simplify = (pts, tol) => {
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let worst = 0;
    let at = -1;
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
      if (d > worst) {
        worst = d;
        at = i;
      }
    }
    if (worst > tol && at > 0) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};

const bake = (id, projection, take) => {
  const rings = polygonsOf(id)
    .slice(0, take)
    .map((p) => p.coordinates[0].map((ll) => projection(ll)));
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const r of rings) {
    for (const [x, y] of r) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  const s = 1000 / (x1 - x0);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  let n = 0;
  const d = rings
    .map((r) => {
      const norm = r.map(([x, y]) => [(x - cx) * s, (y - cy) * s]);
      // split the closed ring in two so Douglas-Peucker has a real chord
      const half = Math.floor(norm.length / 2);
      const a = simplify(norm.slice(0, half + 1), TOL);
      const b = simplify(norm.slice(half), TOL);
      const out = [...a, ...b.slice(1, -1)];
      n += out.length;
      return `${out.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")}Z`;
    })
    .join("");
  const h = Math.round((y1 - y0) * s * 10) / 10;
  console.log(`country ${id}: ${rings.length} ring(s), ${n} points, 1000 x ${h}`);
  return { w: 1000, h, d };
};

const us = bake("840", geoConicEqualArea().parallels([29.5, 45.5]).rotate([96, 0]).center([0, 38]).scale(1000), 1);
const china = bake("156", geoConicEqualArea().parallels([25, 47]).rotate([-105, 0]).center([0, 36]).scale(1000), 1);

mkdirSync("public/machina06", { recursive: true });
writeFileSync("public/machina06/countries.json", `${JSON.stringify({ us, china })}\n`);
console.log("wrote public/machina06/countries.json");
