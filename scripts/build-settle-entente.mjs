// Bakes NobodyCanSettleV2's Entente wash shapes: the seven European members of
// the Entente in 1915 (Britain, France, Russia, Italy, Serbia, Montenegro,
// Belgium) as 1914 polities, on the ww1 projection, simplified for the Europe
// wide. Reads only; writes one file of its own.
//
//   bun scripts/build-settle-entente.mjs path/to/world_1914.geojson
//
// The polities follow scripts/build-ww1-map.mjs's field rules (read, not
// imported: that script writes shared files when run), so the wash lies on
// the same 1914 borders the baked map draws: Natural Earth 10m countries
// wherever a modern state lay inside one 1914 polity, the same hand override
// polygons (Alsace-Lorraine, Eupen-Malmedy, the Italian east, Cortina, the
// Bocche, Vojvodina, Metohija, Strumica, the Bulgarian outlands, Kars), and
// the aourednik/historical-basemaps 1914 polygons where the 1914 line follows
// no modern one (the Polish partitions, Galicia and Bukovina, Trentino, Memel).
// Home territories only: no colonies, no Malta, Cyprus or Gibraltar.
//
// Writes generated/components/settleEntente.ts: ENTENTE, [{ key, d }] in the
// order they are listed above, each a filled land shape (evenodd).

import { readFileSync, writeFileSync } from "node:fs";
import { geoAzimuthalEqualArea } from "d3-geo";
import { feature } from "topojson-client";
import polygonClipping from "polygon-clipping";

const histPath = process.argv[2];
if (!histPath) throw new Error("usage: bun scripts/build-settle-entente.mjs path/to/world_1914.geojson");
const hist = JSON.parse(readFileSync(histPath, "utf8"));

// -- the ww1 projection, exactly as scripts/build-ww1-map.mjs builds it ------------
const projection = geoAzimuthalEqualArea().rotate([-15, -25]).scale(1).translate([0, 0]);
{
  const a = projection([-10.5, 53.5]);
  const b = projection([50, 53.5]);
  projection.scale(1080 / Math.hypot(b[0] - a[0], b[1] - a[1]));
  const c = projection([19.75, 53.5]);
  projection.translate([540 - c[0], 835 - c[1]]);
}

// Rings that cross the antimeridian (Russia's) are unwrapped to continuous
// longitudes, as scripts/build-ww1-map.mjs does, so clipping to Europe never
// sees a segment jump from +180 to -180 (it would cut a strip across the map).
const unwrap = (r) => {
  let off = 0;
  const out = r.map(([lon, lat], i) => {
    if (i > 0) {
      const d = lon - r[i - 1][0];
      if (d > 180) off -= 360;
      else if (d < -180) off += 360;
    }
    return [lon + off, lat];
  });
  // keep the ring's European end in [-180, 180] (its far east runs past 180)
  return Math.min(...out.map((p) => p[0])) < -180 ? out.map(([lon, lat]) => [lon + 360, lat]) : out;
};
const polysOf = (g) =>
  (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []).map((rings) => rings.map(unwrap));
const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const countries = feature(cTopo, cTopo.objects.countries).features;
const C = (name) => {
  const f = countries.find((c) => c.properties.name === name);
  if (!f) throw new Error(`no country ${name}`);
  return polysOf(f.geometry);
};
const HIST = (name) => {
  const fs = hist.features.filter((x) => x.properties.NAME === name);
  if (!fs.length) throw new Error(`no 1914 polity ${name}`);
  return fs.flatMap((f) => polysOf(f.geometry));
};
const U = (...gs) => polygonClipping.union(...gs);
const I = (a, b) => polygonClipping.intersection(a, b);
const D = (a, ...b) => polygonClipping.difference(a, ...b);
const ring = (pts) => [[[...pts, pts[0]]]];
const box = (x0, y0, x1, y1) => ring([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);

// -- the hand override polygons, copied from scripts/build-ww1-map.mjs ------------
const LINE_1871 = [
  [5.94, 49.49], [5.95, 49.42], [5.97, 49.34], [5.98, 49.25], [5.97, 49.17], [5.95, 49.1],
  [6.0, 49.02], [6.04, 48.97], [6.12, 48.93], [6.25, 48.92], [6.35, 48.84], [6.45, 48.77],
  [6.58, 48.71], [6.72, 48.66], [6.82, 48.62], [6.95, 48.62], [7.08, 48.55], [7.13, 48.47],
  [7.09, 48.37], [7.1, 48.27], [7.09, 48.17], [7.02, 48.06], [6.94, 47.95], [6.84, 47.82],
  [6.94, 47.74], [7.0, 47.66], [7.05, 47.58], [7.12, 47.5], [7.13, 47.46],
];
const H = {
  AL: [...LINE_1871, [7.13, 47.38], [8.6, 47.38], [8.6, 49.62], [5.94, 49.62]],
  EUPEN: [
    [6.02, 50.76], [5.97, 50.7], [5.93, 50.63], [5.97, 50.55], [5.99, 50.47], [5.98, 50.4],
    [5.99, 50.33], [6.03, 50.25], [6.08, 50.17], [6.12, 50.13], [6.6, 50.13], [6.6, 50.8], [6.02, 50.8],
  ],
  ITEAST: [
    [13.28, 46.56], [13.3, 46.5], [13.36, 46.43], [13.44, 46.36], [13.42, 46.28], [13.5, 46.2],
    [13.55, 46.13], [13.53, 46.05], [13.5, 45.98], [13.45, 45.93], [13.4, 45.88], [13.33, 45.82],
    [13.3, 45.75], [13.24, 45.7], [13.24, 45.5], [14.0, 45.5], [14.0, 46.75], [13.28, 46.75],
  ],
  CORTINA: [[11.9, 46.5], [11.95, 46.62], [12.3, 46.62], [12.3, 46.45], [12.1, 46.45]],
  BOKA: [
    [18.4, 42.62], [18.52, 42.56], [18.62, 42.52], [18.73, 42.47], [18.8, 42.42], [18.86, 42.34],
    [18.96, 42.24], [19.04, 42.15], [19.08, 42.1], [18.9, 41.95], [18.3, 42.3],
  ],
  STRUMICA: [[22.42, 41.62], [22.95, 41.62], [22.95, 41.25], [22.6, 41.2], [22.42, 41.35]],
  METOHIJA: [
    [20.05, 42.55], [20.15, 42.85], [20.45, 42.92], [20.62, 42.75], [20.58, 42.52], [20.52, 42.3],
    [20.3, 42.22], [20.05, 42.35],
  ],
  VOJVODINA: [
    [19.08, 44.87], [19.35, 44.93], [19.61, 44.96], [19.72, 44.78], [19.95, 44.72], [20.2, 44.67],
    [20.35, 44.76], [20.45, 44.83], [20.62, 44.78], [20.93, 44.69], [21.2, 44.74], [21.4, 44.78],
    [21.7, 44.75], [21.7, 46.3], [18.7, 46.3], [18.7, 44.87],
  ],
  OUTLANDS_A: [[22.6, 43.0], [22.62, 43.12], [22.75, 43.22], [23.05, 43.25], [23.05, 42.88], [22.75, 42.88]],
  OUTLANDS_B: [[22.28, 42.45], [22.35, 42.62], [22.6, 42.62], [22.7, 42.5], [22.7, 42.3], [22.4, 42.3]],
  KARS: [
    [41.5, 41.47], [41.8, 41.62], [43.0, 41.62], [44.9, 40.0], [44.6, 39.65], [44.3, 39.68],
    [43.7, 39.85], [43.3, 39.95], [43.05, 40.02], [42.75, 40.12], [42.45, 40.25], [42.2, 40.38],
    [41.95, 40.45], [41.75, 40.6], [41.65, 40.85], [41.55, 41.1], [41.55, 41.3],
  ],
};
const R = (k) => ring(H[k]);
const EUROPE = box(-12, 34, 62, 72); // home territories within every frame of the piece

// -- the seven, by the ww1 field rules ------------------------------------------------
const histAH = HIST("Austro-Hungarian Empire");
const histDE = HIST("German Empire");
const histRU = HIST("Russian Empire");
const ENTENTE = {
  britain: U(C("United Kingdom"), C("Ireland"), C("Isle of Man")),
  france: D(U(C("France"), C("Monaco")), R("AL")),
  russia: U(
    D(C("Russia"), box(19, 53, 23, 56)), // Kaliningrad was German
    C("Finland"),
    C("Estonia"),
    C("Latvia"),
    D(C("Lithuania"), histDE), // Memel was German
    C("Belarus"),
    C("Moldova"),
    D(C("Ukraine"), histAH), // Galicia, Bukovina, Transcarpathia were Austro-Hungarian
    I(C("Poland"), histRU), // Congress Poland
    C("Georgia"),
    C("Armenia"),
    C("Azerbaijan"),
    I(C("Turkey"), R("KARS")),
  ),
  italy: D(U(C("Italy"), C("San Marino"), C("Vatican")), R("ITEAST"), R("CORTINA"), histAH),
  serbia: U(
    D(C("Serbia"), R("VOJVODINA"), R("OUTLANDS_A"), R("OUTLANDS_B")),
    D(C("Kosovo"), R("METOHIJA")),
    D(C("Macedonia"), R("STRUMICA")),
  ),
  montenegro: U(D(C("Montenegro"), R("BOKA")), I(C("Kosovo"), R("METOHIJA"))),
  belgium: D(C("Belgium"), R("EUPEN")),
};

// -- simplify in world px and write --------------------------------------------------------
// The wash is seen at the Europe wide (k ~1.2) and, faded to 0.1, at the
// Adriatic (k ~3.4): 0.18 world px ~ 0.6 screen px at k 3.4. Specks under
// ~2 world px^2 (Arctic and Baltic islets) are dropped.
const TOL = 0.18;
const dp = (pts, tol) => {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    let md = -1;
    let mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / L;
      if (d > md) [md, mi] = [d, i];
    }
    if (md > tol) {
      keep[mi] = 1;
      stack.push([a, mi], [mi, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
const dpRing = (pts, tol) => {
  let far = 0;
  let fd = -1;
  pts.forEach(([x, y], i) => {
    const dd = Math.hypot(x - pts[0][0], y - pts[0][1]);
    if (dd > fd) [fd, far] = [dd, i];
  });
  return dp(pts.slice(0, far + 1), tol).concat(dp(pts.slice(far), tol).slice(1));
};
const area = (pts) => {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]);
  return Math.abs(a / 2);
};
const n2 = (v) => (Math.round(v * 100) / 100).toString();
const out = Object.entries(ENTENTE).map(([key, g]) => {
  const multi = I(g, EUROPE);
  let d = "";
  let nPts = 0;
  for (const poly of multi) {
    const outer = poly[0].map((ll) => projection(ll));
    if (area(outer) < 2) continue;
    for (const r of poly) {
      const pts = dpRing(r.map((ll) => projection(ll)), TOL);
      if (pts.length < 4 || area(pts) < 0.5) continue;
      nPts += pts.length;
      d += `${pts.map(([x, y], i) => `${i ? "L" : "M"}${n2(x)},${n2(y)}`).join("")}Z`;
    }
  }
  console.log(`${key}: ${nPts} points, ${(d.length / 1024).toFixed(0)} KB`);
  return { key, d };
});

writeFileSync(
  "generated/components/settleEntente.ts",
  `// Generated by scripts/build-settle-entente.mjs — do not edit by hand.
// NobodyCanSettleV2's Entente wash: the seven European members of the Entente
// in 1915 as 1914 polities (the ww1 field rules), home territories only, on the
// ww1 projection (world px), filled evenodd.
export type EntenteKey = ${out.map((o) => JSON.stringify(o.key)).join(" | ")};
export const ENTENTE: { key: EntenteKey; d: string }[] = ${JSON.stringify(out)};
`,
);
