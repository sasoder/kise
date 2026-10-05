// Bakes THE MOSAIC (Iraq's ethnoreligious regions, CIA 2003) onto the Iraq world, for the
// clip "Sheppard_Regime_change_in_Iraq_was_the_easy_part" (Dwarkesh with Si Sheppard;
// Dwarkesh map style). Builder M, Oct 5 2026.
//
//   uv run --with opencv-python-headless --with scipy --with shapely --with numpy \
//     python scripts/iraq-mosaic-vectorise.py <panel.png> <ne_iraq.json>   (-> scripts/iraq-mosaic.json)
//   bun scripts/build-iraq-mosaic.mjs                                       (-> iraqMosaic.ts)
//
// Reads scripts/iraq-mosaic.json (the georeferenced, vectorised regions + seams in lon/lat;
// method, source and fit error in that file and in iraq-mosaic-vectorise.py) and W's
// projection + Iraq ring (iraqMapData.ts: PROJ, IRAQ_RING, PX_PER_KM). Projects to world px
// and re-clips every region to IRAQ_RING in world px, so the regions tile W's Iraq exactly.
// Writes generated/components/iraqMosaic.ts.
//
// CHECKS (throws): the regions cover IRAQ_RING (area within 0.2 %) and do not overlap;
// every seam point lies inside (or within 0.5 world px of) IRAQ_RING; every anchor lies in
// its region.

import { readFileSync, writeFileSync } from "node:fs";
import { geoConicConformal } from "d3-geo";
import polygonClipping from "polygon-clipping";
import {
  IRAQ_RING,
  PROJ,
  PX_PER_KM,
} from "../generated/components/iraqMapData.ts";

const OUT = "generated/components/iraqMosaic.ts";
const J = JSON.parse(readFileSync("scripts/iraq-mosaic.json", "utf8"));

const projection = geoConicConformal()
  .parallels(PROJ.parallels)
  .rotate(PROJ.rotate)
  .scale(PROJ.scale)
  .translate(PROJ.translate);
const P = (ll) => projection(ll);
const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const rp = (p) => [r3(p[0]), r3(p[1])];
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
const polyArea = (poly) =>
  poly.reduce(
    (t, ring, k) => t + (k === 0 ? 1 : -1) * Math.abs(ringArea(ring)),
    0,
  );
const multiArea = (mp) => mp.reduce((s, poly) => s + polyArea(poly), 0);
const inRing = ([x, y], ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      c = !c;
  }
  return c;
};
const inPoly = (p, poly) =>
  inRing(p, poly[0]) && !poly.slice(1).some((h) => inRing(p, h));
const segDist = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const ringDist = (p, ring) => {
  let d = Infinity;
  for (let i = 0; i < ring.length; i++)
    d = Math.min(d, segDist(p, ring[i], ring[(i + 1) % ring.length]));
  return d;
};
const toD = (pts, close) =>
  `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}`;
const openRing = (r) =>
  dist(r[0], r[r.length - 1]) < 1e-9 ? r.slice(0, -1) : r;
const polyD = (poly) => poly.map((ring) => toD(openRing(ring), true)).join("");

// ---------------------------------------------------------------------------
// REGIONS: project, re-clip to IRAQ_RING (world px)
// ---------------------------------------------------------------------------
const IRAQ = [IRAQ_RING.map((p) => [p[0], p[1]])];
const iraqArea = Math.abs(ringArea(IRAQ_RING));
const regions = [];
for (const r of J.regions) {
  const geom = r.rings.map((ring) => ring.map((ll) => P(ll)));
  const clipped = polygonClipping
    .intersection([geom], IRAQ)
    .filter((poly) => Math.abs(polyArea(poly)) > 0.05);
  for (const poly of clipped)
    regions.push({
      cls: r.cls,
      poly,
      area: polyArea(poly),
      anchorLL: r.anchor,
    });
}
regions.sort((a, b) => b.area - a.area);
const sum = regions.reduce((s, r) => s + r.area, 0);
console.log(
  `regions: ${regions.length}, area ${sum.toFixed(1)} vs Iraq ${iraqArea.toFixed(1)} world px^2 (${((100 * (sum - iraqArea)) / iraqArea).toFixed(3)} %)`,
);
if (Math.abs(sum - iraqArea) / iraqArea > 0.002)
  throw new Error("the regions do not cover Iraq");
{
  const uni = polygonClipping.union(...regions.map((r) => [r.poly]));
  const ua = multiArea(uni);
  console.log(
    `  union ${ua.toFixed(1)} (overlap ${(sum - ua).toFixed(2)} world px^2)`,
  );
  if (sum - ua > 1) throw new Error("regions overlap");
}
// anchors: the Python pole of inaccessibility (lon/lat) when it lies in this piece, else this
// piece's own pole (grid search on the projected piece)
const poleOf = (poly) => {
  const xs = poly[0].map((p) => p[0]);
  const ys = poly[0].map((p) => p[1]);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  let best = null;
  let bd = -1;
  const n = 60;
  for (let i = 0; i <= n; i++)
    for (let j = 0; j <= n; j++) {
      const p = [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * j) / n];
      if (!inPoly(p, poly)) continue;
      const d = Math.min(...poly.map((ring) => ringDist(p, ring)));
      if (d > bd) [bd, best] = [d, p];
    }
  return best;
};
for (const r of regions) {
  const a = P(r.anchorLL);
  r.anchor = inPoly(a, r.poly) ? a : poleOf(r.poly);
  if (!inPoly(r.anchor, r.poly))
    throw new Error(`anchor outside its region (${r.cls})`);
  const pts = r.poly.flat();
  r.box = {
    x0: Math.min(...pts.map((p) => p[0])),
    x1: Math.max(...pts.map((p) => p[0])),
    y0: Math.min(...pts.map((p) => p[1])),
    y1: Math.max(...pts.map((p) => p[1])),
  };
}

// ---------------------------------------------------------------------------
// SEAMS: project; the shared chains between two classes (already clipped to Iraq in lon/lat)
// ---------------------------------------------------------------------------
const POPULATED = new Set([
  "kurd",
  "sunni",
  "sunniKurd",
  "shia",
  "shiaSunni",
  "turkoman",
]);
const seams = J.seams.map((s, i) => {
  const pts = s.pts.map((ll) => P(ll));
  let len = 0;
  for (let k = 1; k < pts.length; k++) len += dist(pts[k], pts[k - 1]);
  return {
    id: i,
    a: s.a,
    b: s.b,
    kind: POPULATED.has(s.a) && POPULATED.has(s.b) ? "identity" : "desert",
    pts,
    len,
    km: s.km,
  };
});
for (const s of seams)
  for (const p of s.pts)
    if (!inRing(p, IRAQ_RING) && ringDist(p, IRAQ_RING) > 0.5)
      throw new Error(`seam ${s.a}|${s.b} leaves Iraq`);
console.log(
  `seams: ${seams.length} (${seams.filter((s) => s.kind === "identity").length} identity), ${seams.reduce((t, s) => t + s.len, 0).toFixed(0)} world px`,
);

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
const CLASSES = J.classes;
const classD = Object.fromEntries(
  CLASSES.map((c) => [
    c.id,
    regions
      .filter((r) => r.cls === c.id)
      .map((r) => polyD(r.poly))
      .join(""),
  ]),
);
const classAnchor = Object.fromEntries(
  CLASSES.map((c) => [c.id, rp(regions.find((r) => r.cls === c.id).anchor)]),
);
const fit = J.source.fit;
const lines = [];
lines.push(`// Generated by scripts/build-iraq-mosaic.mjs — do not edit by hand.
// THE MOSAIC: Iraq's ethnoreligious regions, vectorised and georeferenced from the CIA map
// "Distribution of Ethnoreligious Groups and Major Tribes" (761864AI 1-03, 2003; public
// domain), the top-right panel of the CIA/LOC sheet "Iraq: Country Profile" (LOC 2003629031;
// ${J.source.url}).
// Fit (scripts/iraq-mosaic-vectorise.py): affine (map px -> LCC) on 18 city dots + ICP of
// the map's outline to Natural Earth 10m Iraq: outline median ${fit.outline_median_km} km, p80
// ${fit.outline_p80_km} km; cities rms ${fit.cities_rms_km} km. Regions re-clipped to IRAQ_RING (world px):
// they tile W's Iraq exactly. World px under iraqMapData's PROJ (asserted in iraqMosaicLayer).
//
// Classes (the map's legend): ${CLASSES.map((c) => `${c.id} = ${c.label}`).join("; ")}.
// Seams: the shared edges between two classes ("identity" = two peoples; "desert" = a people
// and the sparsely populated class), identical to the regions' edges by construction.

export type P2 = [number, number];
export type MosaicClass = ${CLASSES.map((c) => JSON.stringify(c.id)).join(" | ")};
export type MosaicRegion = {
  id: number;
  cls: MosaicClass;
  /** world px^2 */
  area: number;
  /** evenodd svg path, world px */
  d: string;
  /** rings (outer first), world px, open */
  rings: P2[][];
  /** a point well inside (pole of inaccessibility), world px */
  anchor: P2;
  box: { x0: number; x1: number; y0: number; y1: number };
};
export type MosaicSeam = {
  id: number;
  a: MosaicClass;
  b: MosaicClass;
  kind: "identity" | "desert";
  /** world px polyline */
  pts: P2[];
  d: string;
  /** world px */
  len: number;
};
export const MOSAIC_PROJ = ${JSON.stringify(PROJ)};
export const MOSAIC_PX_PER_KM = ${PX_PER_KM};
export const MOSAIC_CLASSES: { id: MosaicClass; label: string }[] = ${JSON.stringify(CLASSES)};
`);
lines.push(
  `export const MOSAIC_REGIONS: MosaicRegion[] = [\n${regions
    .map((r, i) =>
      JSON.stringify({
        id: i,
        cls: r.cls,
        area: r2(r.area),
        d: polyD(r.poly),
        rings: r.poly.map((ring) => openRing(ring).map(rp)),
        anchor: rp(r.anchor),
        box: Object.fromEntries(
          Object.entries(r.box).map(([k, v]) => [k, r2(v)]),
        ),
      }),
    )
    .join(",\n")}\n];`,
);
lines.push(`/** every region of a class in one evenodd path (world px) */
export const MOSAIC_CLASS_D: Record<MosaicClass, string> = ${JSON.stringify(classD)};
/** the anchor of each class's largest region (world px) */
export const MOSAIC_CLASS_ANCHOR: Record<MosaicClass, P2> = ${JSON.stringify(classAnchor)};`);
lines.push(
  `export const MOSAIC_SEAMS: MosaicSeam[] = [\n${seams
    .map((s) =>
      JSON.stringify({
        id: s.id,
        a: s.a,
        b: s.b,
        kind: s.kind,
        pts: s.pts.map(rp),
        d: toD(s.pts, false),
        len: r2(s.len),
      }),
    )
    .join(",\n")}\n];`,
);
writeFileSync(OUT, lines.join("\n") + "\n");
console.log(`wrote ${OUT} (${(lines.join("\n").length / 1024).toFixed(0)} KB)`);
for (const c of CLASSES) {
  const rs = regions.filter((r) => r.cls === c.id);
  console.log(
    `  ${c.id.padEnd(10)} ${String(rs.length).padStart(3)} regions ${(rs.reduce((s, r) => s + r.area, 0) / PX_PER_KM / PX_PER_KM).toFixed(0).padStart(7)} km^2`,
  );
}
