// Bakes THE TRIBUTARY PROVINCES of the Triple Alliance (1519) onto the shared
// Cortés world, for the clip "Sheppard_Tlaxcalans_thought_they_used_Cortes"
// (Dwarkesh with Si Sheppard; Dwarkesh map style). Builder P, Oct 4 2026.
//
//   bun scripts/build-tlax-provinces.mjs
//
// Reads scripts/tlax-provinces.json (the georeferenced province cells in lon/lat,
// their interior seams, the flip list with sources, the allied polities and
// their land routes to Texcoco; method + sources in that file), the shared
// projection and land mask (cortesMapData.ts) and THIS clip's empire, enclaves,
// lake and sites (W's tlaxMapData.ts: EMPIRE_T_POLYS, ENCLAVES, LAKE_SMOOTH,
// SITES_T). Writes generated/components/tlaxProvinces.ts.
//
// Each cell is clipped to EMPIRE_T_POLYS (the empire every cut of this clip
// draws), so the cells partition it exactly (the enclaves stay outside). The seams are
// the shared edges between two cells (identical in both cells by construction),
// over land inside the empire only (they stop ~0.6 world px short of its border
// and coast, which W draws). For each flipped cell: its flip rank (great-circle
// distance from Tlaxcala city to its nearest edge, ascending) and the sweep that
// converts it, a straight front entering from the edge that touches orange.
//
// CHECKS (the script throws if one fails): the cells cover the empire (area
// within 0.5 %) and do not overlap; every head town and stream source lies in
// its cell / polity; every smoothed route stays on land and out of Lake Texcoco.

import { readFileSync, writeFileSync } from "node:fs";
import { geoConicConformal, geoDistance } from "d3-geo";
import polygonClipping from "polygon-clipping";
import { LAND_MASK_STAGE, PROJ, PX_PER_KM } from "../generated/components/cortesMapData.ts";
import { CLAIM_POLYS, EMPIRE_T_POLYS, ENCLAVES as W_ENCLAVES, LAKE_SMOOTH, SITES_T } from "../generated/components/tlaxMapData.ts";

const OUT = "generated/components/tlaxProvinces.ts";
const J = JSON.parse(readFileSync("scripts/tlax-provinces.json", "utf8"));

// ---------------------------------------------------------------------------
// the shared projection (identical to build-cortes-map.mjs)
// ---------------------------------------------------------------------------
const projection = geoConicConformal().parallels(PROJ.parallels).rotate(PROJ.rotate).scale(PROJ.scale).translate(PROJ.translate);
const P = (ll) => projection(ll);
const INV = (p) => projection.invert(p);
const r3 = (v) => Math.round(v * 1000) / 1000;
const r2 = (v) => Math.round(v * 100) / 100;
const KM = (a, b) => geoDistance(a, b) * 6371.0;
const rp = (p) => [r3(p[0]), r3(p[1])];

// ---------------------------------------------------------------------------
// geometry helpers (world px)
// ---------------------------------------------------------------------------
const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return s / 2;
};
const multiArea = (mp) => mp.reduce((s, poly) => s + poly.reduce((t, ring, k) => t + (k === 0 ? 1 : -1) * Math.abs(ringArea(ring)), 0), 0);
const inRing = ([x, y], ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
  }
  return c;
};
const inMulti = (p, mp) => mp.some((poly) => inRing(p, poly[0]) && !poly.slice(1).some((h) => inRing(p, h)));
const segDist = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const ringDist = (p, ring) => {
  let d = Infinity;
  for (let i = 0; i < ring.length - 1; i++) d = Math.min(d, segDist(p, ring[i], ring[i + 1]));
  return d;
};
/** points every `step` world px along a ring */
const densify = (ring, step = 0.5) => {
  const out = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
};
const toD = (pts, close) => `M${pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join("L")}${close ? "Z" : ""}`;
const parseBorder = (d) =>
  d
    .split("M")
    .filter(Boolean)
    .map((sp) => sp.split("L").map((q) => q.split(",").map(Number)));
const multiD = (mp) => mp.map((poly) => poly.map((ring) => toD(ring.slice(0, -1), true)).join("")).join("");
const centroidOf = (mp) => {
  let A = 0;
  let cx = 0;
  let cy = 0;
  for (const poly of mp)
    poly.forEach((ring, k) => {
      const sgn = k === 0 ? 1 : -1;
      for (let i = 0; i < ring.length - 1; i++) {
        const c = ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
        const s = (sgn * Math.sign(ringArea(ring)) || 1) * c;
        A += s / 2;
        cx += ((ring[i][0] + ring[i + 1][0]) * s) / 6;
        cy += ((ring[i][1] + ring[i + 1][1]) * s) / 6;
      }
    });
  return [cx / A, cy / A];
};

// ---------------------------------------------------------------------------
// land (the shared stage mask) and the 1519 lake
// ---------------------------------------------------------------------------
const maskBits = Buffer.from(LAND_MASK_STAGE.b64, "base64");
const landAt = (x, y) => {
  const m = LAND_MASK_STAGE;
  const i = Math.floor((x - m.x0) * m.s);
  const j = Math.floor((y - m.y0) * m.s);
  if (i < 0 || j < 0 || i >= m.w || j >= m.h) return false;
  const q = j * m.w + i;
  return ((maskBits[q >> 3] >> (q & 7)) & 1) === 1;
};
const LAKE = [...LAKE_SMOOTH, LAKE_SMOOTH[0]];
const inLake = (p) => inRing(p, LAKE);

// ---------------------------------------------------------------------------
// THE CELLS: project, clip to EMPIRE_T_POLYS
// ---------------------------------------------------------------------------
const EMP = EMPIRE_T_POLYS;
const empArea = multiArea(EMP);
const TLAX_LL = [SITES_T.tlaxcala.lon, SITES_T.tlaxcala.lat];
const TLAX = [SITES_T.tlaxcala.x, SITES_T.tlaxcala.y];
const TEXCOCO_LL = [SITES_T.texcoco.lon, SITES_T.texcoco.lat];
const TEXCOCO = [SITES_T.texcoco.x, SITES_T.texcoco.y];
const cells = J.provinces.map((pv) => {
  const geom = pv.cell.map((poly) => poly.map((ring) => ring.map((ll) => P(ll))));
  const clipped = polygonClipping.intersection(geom, EMP).filter((poly) => Math.abs(ringArea(poly[0])) > 0.02);
  const area = multiArea(clipped);
  const head = P(pv.head.lonlat);
  // nearest edge (great circle) from Tlaxcala city
  let distKm = Infinity;
  let nearest = null;
  for (const poly of clipped)
    for (const ring of poly)
      for (const p of densify(ring, 0.4)) {
        const d = KM(TLAX_LL, INV(p));
        if (d < distKm) [distKm, nearest] = [d, p];
      }
  return { pv, clipped, area, head, distKm, nearest, centroid: centroidOf(clipped) };
});
const cellArea = cells.reduce((s, c) => s + c.area, 0);
console.log(`cells: ${cells.length}, area ${cellArea.toFixed(1)} vs empire ${empArea.toFixed(1)} world px^2 (${((100 * (cellArea - empArea)) / empArea).toFixed(3)} %)`);
if (Math.abs(cellArea - empArea) / empArea > 0.005) throw new Error("the cells do not cover the empire");
{
  // no overlaps: the union's area equals the sum
  const uni = polygonClipping.union(...cells.map((c) => c.clipped));
  const ua = multiArea(uni);
  console.log(`  union ${ua.toFixed(1)} (overlap ${(cellArea - ua).toFixed(2)} world px^2)`);
  if (cellArea - ua > 0.5) throw new Error("cells overlap");
}
for (const c of cells) {
  const inside = inMulti(c.head, c.clipped);
  if (!inside && c.pv.head.from === "gazetteer") console.log(`  note: ${c.pv.name}'s head town (gazetteer) lies outside its cell (map error), ${c.clipped.length} polys`);
}

// ---------------------------------------------------------------------------
// SEAMS (interior borders between two cells) and the neighbour graph
// ---------------------------------------------------------------------------
const byId = new Map(cells.map((c) => [c.pv.id, c]));
const seams = J.seams.map((s) => {
  const pts = s.pts.map((ll) => P(ll));
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return { a: s.a, b: s.b, pts, len };
});
const neighbours = new Map(cells.map((c) => [c.pv.id, new Map()]));
for (const s of seams) {
  neighbours.get(s.a).set(s.b, (neighbours.get(s.a).get(s.b) ?? 0) + s.len);
  neighbours.get(s.b).set(s.a, (neighbours.get(s.b).get(s.a) ?? 0) + s.len);
}

// ---------------------------------------------------------------------------
// THE ENCLAVES (orange before any cell flips; W's ENCLAVES, world px rings)
// ---------------------------------------------------------------------------
const ENCLAVE_RINGS = Object.values(W_ENCLAVES).flatMap((e) => e.polys.flatMap((poly) => poly.map((r) => [...r, r[0]])));

// runs of consecutive flagged points along a closed ring (wrapping), as open polylines (>= 2 pts)
const runsOf = (pts, flag) => {
  const n = pts.length;
  const f = pts.map(flag);
  if (f.every(Boolean)) return [[...pts, pts[0]]];
  let start = f.findIndex((v) => !v);
  const runs = [];
  let cur = [];
  for (let k = 1; k <= n; k++) {
    const i = (start + k) % n;
    if (f[i]) cur.push(pts[i]);
    else {
      if (cur.length >= 2) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length >= 2) runs.push(cur);
  return runs;
};
const polylineDist = (p, runs) => {
  let d = Infinity;
  for (const r of runs) for (let i = 0; i < r.length - 1; i++) d = Math.min(d, segDist(p, r[i], r[i + 1]));
  return d;
};
/** the farthest any point of the polygons lies from the polylines (a 0.5 world px grid + the rings) */
const reachOf = (mp, runs) => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const poly of mp) for (const [x, y] of poly[0]) [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
  let best = 0;
  for (let x = x0; x <= x1; x += 0.5)
    for (let y = y0; y <= y1; y += 0.5) if (inMulti([x, y], mp)) best = Math.max(best, polylineDist([x, y], runs));
  for (const poly of mp) for (const ring of poly) for (const p of ring) best = Math.max(best, polylineDist(p, runs));
  return best;
};

// ---------------------------------------------------------------------------
// THE FLIPS: rank by distance from Tlaxcala to the nearest edge; each cell's sweep
// ---------------------------------------------------------------------------
const flipped = cells.filter((c) => c.pv.flip).sort((a, b) => a.distKm - b.distKm);
flipped.forEach((c, i) => (c.rank = i));
const NEAR = 0.9; // world px: a boundary point "touches" an orange neighbour within this distance
for (const c of flipped) {
  const pts = c.clipped.flatMap((poly) => poly.flatMap((ring) => densify(ring, 0.4)));
  const orangeRings = [...ENCLAVE_RINGS, ...flipped.filter((o) => o.rank < c.rank).flatMap((o) => o.clipped.flatMap((poly) => poly))];
  let touch = pts.filter((p) => orangeRings.some((r) => ringDist(p, r) < NEAR));
  c.touchKind = "edge";
  if (touch.length < 4) {
    // an island among cream cells: enter from the side facing the nearest orange
    let best = Infinity;
    let bp = null;
    for (const p of pts)
      for (const r of orangeRings) {
        const d = ringDist(p, r);
        if (d < best) [best, bp] = [d, p];
      }
    touch = pts.filter((p) => Math.hypot(p[0] - bp[0], p[1] - bp[1]) < 6);
    c.touchKind = `island (${(best / PX_PER_KM).toFixed(0)} km from orange)`;
  }
  const T = touch.reduce((s, p) => [s[0] + p[0] / touch.length, s[1] + p[1] / touch.length], [0, 0]);
  let n = [c.centroid[0] - T[0], c.centroid[1] - T[1]];
  const nl = Math.hypot(...n) || 1;
  n = [n[0] / nl, n[1] / nl];
  const dot = (p) => p[0] * n[0] + p[1] * n[1];
  const s0 = Math.min(...touch.map(dot));
  const s1 = Math.max(...pts.map(dot));
  const t0 = dot(T);
  c.sweep = { from: [T[0] + n[0] * (s0 - t0), T[1] + n[1] * (s0 - t0)], to: [T[0] + n[0] * (s1 - t0), T[1] + n[1] * (s1 - t0)] };
  c.entry = T;
  // THE ENTRY EDGE (cut C's band sweep): the runs of the cell's own rings that touch orange
  // (or, for an island, its side facing the nearest orange), as open polylines; the band grows
  // from them inward to REACH = the farthest any point of the cell lies from them
  const touchSet = new Set(touch.map((p) => `${p[0]},${p[1]}`));
  c.entryRuns = c.clipped.flatMap((poly) => poly.flatMap((ring) => runsOf(densify(ring, 0.4), (p) => touchSet.has(`${p[0]},${p[1]}`))));
  c.reach = reachOf(c.clipped, c.entryRuns);
  console.log(
    `flip ${c.rank}: ${c.pv.name.padEnd(18)} ${c.distKm.toFixed(0).padStart(4)} km from Tlaxcala, ${(c.area / PX_PER_KM / PX_PER_KM).toFixed(0).padStart(6)} km2, enters from ${c.touchKind} (${c.entryRuns.length} runs), reach ${c.reach.toFixed(1)} world px`,
  );
}

// ---------------------------------------------------------------------------
// THE EDGES OF THE ORANGE (cut C, Fable's review): each flipped cell's ring split into
// runs by what lies across it: another cell (its id), the empire's outer border over land
// (-1); runs facing an enclave (its front is there), the sea or the lake are dropped.
// Cut C draws a thin orange line on every run where orange meets cream (fading the runs
// between two flipped cells as the second lands).
// ---------------------------------------------------------------------------
const cellRings = cells.map((c) => ({ id: c.pv.id, rings: c.clipped.flatMap((poly) => poly.map((r) => r)) }));
const EDGE_NEAR = 0.35;
for (const c of flipped) {
  const edges = [];
  for (const poly of c.clipped)
    for (const ring of poly) {
      const pts = densify(ring, 0.3);
      const n = pts.length;
      const cls = pts.map((p, i) => {
        // another cell across?
        let best = EDGE_NEAR;
        let who = null;
        for (const o of cellRings) {
          if (o.id === c.pv.id) continue;
          for (const r of o.rings) {
            const d = ringDist(p, r);
            if (d < best) [best, who] = [d, o.id];
          }
        }
        if (who !== null) return who;
        if (ENCLAVE_RINGS.some((r) => ringDist(p, r) < EDGE_NEAR)) return "enclave";
        // the outside: step off the ring on the side that is not this cell
        const a = pts[(i - 1 + n) % n];
        const b = pts[(i + 1) % n];
        const t = [b[0] - a[0], b[1] - a[1]];
        const tl = Math.hypot(...t) || 1;
        const nn = [t[1] / tl, -t[0] / tl];
        const sgn = inMulti([p[0] + nn[0] * 0.8, p[1] + nn[1] * 0.8], c.clipped) ? -1 : 1;
        // over land = land (1 cell / world px mask) and no lake at 0.5 .. 4.5 world px out
        for (const dd of [0.5, 1, 1.5, 3, 4.5]) {
          const q = [p[0] + sgn * nn[0] * dd, p[1] + sgn * nn[1] * dd];
          if (inLake(q) || !landAt(q[0], q[1])) return "water";
        }
        return -1;
      });
      // runs (wrapping) of one class
      let start = 0;
      while (start < n && cls[start] === cls[(start - 1 + n) % n]) start++;
      if (start === n) start = 0;
      let run = [];
      let rc = cls[start];
      const flush = () => {
        // keep runs >= 1.5 world px (shorter ones are corners of a junction)
        if (run.length >= 6 && typeof rc === "number") edges.push({ nb: rc, pts: run });
      };
      for (let k = 0; k <= n; k++) {
        const i = (start + k) % n;
        if (cls[i] !== rc || k === n) {
          if (k === n) run.push(pts[i]);
          flush();
          run = [pts[(i - 1 + n) % n], pts[i]];
          rc = cls[i];
        } else run.push(pts[i]);
      }
    }
  // merge runs per neighbour into one d each
  const byNb = new Map();
  for (const e of edges) byNb.set(e.nb, (byNb.get(e.nb) ?? "") + toD(e.pts, false));
  c.edges = [...byNb.entries()].map(([nb, d]) => ({ nb, d }));
  const len = (nb) => edges.filter((e) => e.nb === nb).reduce((s, e) => s + e.pts.length * 0.3, 0);
  console.log(`edges ${c.pv.name.slice(0, 18).padEnd(18)}: ${c.edges.map((e) => `${e.nb}${byId.get(e.nb)?.pv.flip ? "*" : ""}:${len(e.nb).toFixed(0)}`).join(" ")}`);
}

// ---------------------------------------------------------------------------
// THE ENCLAVES' ENTRIES (cut C step 2): each converts as a band growing from its edge
// with the empire (W's ENCLAVES[k].border) inward; reach = the farthest point from that edge
// ---------------------------------------------------------------------------
const ENCLAVE_ENTRIES = ["teotitlan", "metztitlan", "yopitzinco"].map((key) => {
  const runs = parseBorder(W_ENCLAVES[key].border);
  const reach = reachOf(W_ENCLAVES[key].polys, runs);
  console.log(`enclave ${key}: entry ${runs.length} runs, reach ${reach.toFixed(1)} world px`);
  return { key, d: runs.map((r) => toD(r, false)).join(""), reach: r2(reach) };
});

// ---------------------------------------------------------------------------
// THE POLITIES (stream sources for cut D): every orange polity, its source, weight
// and a land route to Texcoco (centripetal Catmull-Rom through the waypoints)
// ---------------------------------------------------------------------------
const catmull = (pts, step = 0.6) => {
  const ext = [
    [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]],
    ...pts,
    [2 * pts[pts.length - 1][0] - pts[pts.length - 2][0], 2 * pts[pts.length - 1][1] - pts[pts.length - 2][1]],
  ];
  const out = [pts[0]];
  const knot = (p, q) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const n = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let s = 1; s <= n; s++) {
      const t = t1 + ((t2 - t1) * s) / n;
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
// weights (tlax-provinces.json contingents.rule): documented warriors / TOTAL; the rest of
// TOTAL shared among the undocumented polities by area (a cell's, or W's enclave's)
const TOTAL = J.contingents.total.men;
const polArea = (q) =>
  q.kind === "province" ? byId.get(q.cellId).area / PX_PER_KM / PX_PER_KM : multiArea(W_ENCLAVES[q.enclave].polys) / PX_PER_KM / PX_PER_KM;
// men === 0: listed (it is orange) but no contingent: weight 0, no share of the remainder
const docSum = J.polities.reduce((s, q) => s + (q.men ?? 0), 0);
const undocArea = J.polities.reduce((s, q) => s + (q.men == null ? polArea(q) : 0), 0);
const perKm2 = (TOTAL - docSum) / undocArea;
console.log(`contingents: documented ${docSum} of ${TOTAL}; the rest ${TOTAL - docSum} over ${undocArea.toFixed(0)} km2 of undocumented polities (${perKm2.toFixed(2)} men / km2)`);
const polities = J.polities.map((q) => {
  const home = q.kind === "province" ? byId.get(q.cellId).clipped : W_ENCLAVES[q.enclave].polys;
  // the source must stand inside its polity: a head town the map places outside its own cell
  // (map error) or on its seam moves to the nearest point >= 2 world px inside it (1, 0.5 in a thin cell)
  let src = P(q.source.lonlat);
  let moved = 0;
  if (!inMulti(src, home) || Math.min(...home.flatMap((poly) => poly.map((r) => ringDist(src, [...r, r[0]])))) < 2) {
    let best = null;
    for (const inset of [2, 1, 0.5]) {
      for (let gx = src[0] - 30; gx <= src[0] + 30; gx += 0.25)
        for (let gy = src[1] - 30; gy <= src[1] + 30; gy += 0.25) {
          const d = Math.hypot(gx - src[0], gy - src[1]);
          if (best && d >= best.d) continue;
          if (!inMulti([gx, gy], home)) continue;
          if (Math.min(...home.flatMap((poly) => poly.map((r) => ringDist([gx, gy], [...r, r[0]])))) < inset) continue;
          best = { p: [gx, gy], d };
        }
      if (best) break;
    }
    if (!best) throw new Error(`no interior point near ${q.key}'s source`);
    moved = best.d;
    src = best.p;
  }
  const wp = [src, ...q.route.slice(1).map((ll) => P(ll))];
  const pts = catmull(wp);
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let off = 0;
  let wet = 0;
  for (const p of pts) {
    if (!landAt(p[0], p[1])) off++;
    if (inLake(p)) wet++;
  }
  const area = polArea(q);
  const men = q.men ?? Math.round(area * perKm2);
  console.log(
    `polity ${q.key.padEnd(12)} ${String(men).padStart(6)} men${q.men == null ? " (by area)" : q.men === 0 ? " (none)   " : "          "} w ${(men / TOTAL).toFixed(3)}  route ${len.toFixed(0)} world px (${(len / PX_PER_KM).toFixed(0)} km), ${off} pts off land, ${wet} in the lake${moved ? `; source moved ${(moved / PX_PER_KM).toFixed(0)} km into its polity` : ""}`,
  );
  if (off > 0 || wet > 0) throw new Error(`the route of ${q.key} leaves the land or enters the lake`);
  const end = pts[pts.length - 1];
  if (Math.hypot(end[0] - TEXCOCO[0], end[1] - TEXCOCO[1]) > 0.05) throw new Error(`the route of ${q.key} does not end at Texcoco`);
  return { ...q, src, moved, pts, len, men, weight: men / TOTAL, area, documented: q.men != null && q.men > 0 };
});

// ---------------------------------------------------------------------------
// THE FRONTS (cut C, "were hostile to the Aztecs"): each enclave's edge with the
// empire as one polyline to draw on, with the side that faces the empire. Tlaxcala's
// is the outline of Tlaxcala + cut A's claim (the orange whole), starting at its
// westernmost point (facing Tenochtitlan) and running clockwise on screen; the others
// are W's enclave borders (ENCLAVES[k].border) joined into one line each.
// ---------------------------------------------------------------------------
const parseD = (d) =>
  d
    .split("M")
    .filter(Boolean)
    .map((sp) => sp.split("L").map((q) => q.split(",").map(Number)));
const polyLen = (pts) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
};
const joinRuns = (runs) => {
  // chain the runs end to end (nearest ends first), so the front draws as one line
  const left = runs.map((r) => r.slice());
  let line = left.shift();
  while (left.length) {
    let best = null;
    for (let i = 0; i < left.length; i++) {
      const r = left[i];
      for (const [rev, a] of [
        [false, r[0]],
        [true, r[r.length - 1]],
      ]) {
        const d = Math.hypot(a[0] - line[line.length - 1][0], a[1] - line[line.length - 1][1]);
        if (!best || d < best.d) best = { i, rev, d };
      }
    }
    const r = left.splice(best.i, 1)[0];
    line = line.concat(best.rev ? r.reverse() : r);
  }
  return line;
};
const resample = (pts, step) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1];
  const n = Math.max(2, Math.round(L / step));
  const out = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const t = (L * i) / n;
    while (j < cum.length - 2 && cum[j + 1] < t) j++;
    const u = (t - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]);
  }
  return out;
};
const frontOf = (key, raw, closed, enclavePolys) => {
  const pts = resample(raw, 0.3);
  // the side facing the empire: the left normal (ty, -tx) in y-down world px, or its opposite
  let vote = 0;
  for (let i = 1; i < pts.length - 1; i += 3) {
    const t = [pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]];
    const l = Math.hypot(...t) || 1;
    const q = [pts[i][0] + (t[1] / l) * 0.7, pts[i][1] - (t[0] / l) * 0.7];
    vote += inMulti(q, enclavePolys) ? -1 : 1;
  }
  const len = polyLen(pts);
  console.log(`front ${key}: ${pts.length} pts, ${len.toFixed(1)} world px (${(len / PX_PER_KM).toFixed(0)} km), ${closed ? "closed" : "open"}, teeth ${vote >= 0 ? "left" : "right"} normal (vote ${vote})`);
  return { key, pts: pts.map(rp), closed, len: r3(len), out: vote >= 0 ? 1 : -1 };
};
const FRONTS = [];
{
  const tl = polygonClipping.union(W_ENCLAVES.tlaxcala.polys, CLAIM_POLYS);
  if (tl.length !== 1) throw new Error("Tlaxcala + claim is not one piece");
  let ring = tl[0][0].slice(0, -1);
  if (ringArea(ring) < 0) ring = ring.reverse(); // y-down shoelace > 0 = clockwise on screen
  let w = 0;
  ring.forEach((p, i) => {
    if (p[0] < ring[w][0]) w = i;
  });
  ring = [...ring.slice(w), ...ring.slice(0, w), ring[w]];
  FRONTS.push(frontOf("tlaxcala", ring, true, tl));
  for (const key of ["teotitlan", "metztitlan", "yopitzinco"]) {
    const runs = parseD(W_ENCLAVES[key].border);
    const line = joinRuns(runs);
    const closed = Math.hypot(line[0][0] - line[line.length - 1][0], line[0][1] - line[line.length - 1][1]) < 0.05;
    FRONTS.push(frontOf(key, line, closed, W_ENCLAVES[key].polys));
  }
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------
const cellOut = cells.map((c) => ({
  id: c.pv.id,
  key: c.pv.key,
  name: c.pv.name,
  head: rp(c.head),
  headLonLat: c.pv.head.lonlat,
  d: multiD(c.clipped),
  polys: c.clipped.map((poly) => poly.map((ring) => ring.slice(0, -1).map((p) => [r2(p[0]), r2(p[1])]))),
  areaKm2: Math.round(c.area / PX_PER_KM / PX_PER_KM),
  centroid: rp(c.centroid),
  distKm: r2(c.distKm),
  nearestToTlaxcala: rp(c.nearest),
  neighbours: [...neighbours.get(c.pv.id).entries()].sort((a, b) => b[1] - a[1]).map(([id, len]) => ({ id, len: r2(len) })),
  flip: !!c.pv.flip,
  flipRank: c.pv.flip ? c.rank : -1,
  sweep: c.sweep ? { from: rp(c.sweep.from), to: rp(c.sweep.to) } : null,
  entryD: c.entryRuns ? c.entryRuns.map((r) => toD(r, false)).join("") : "",
  edges: c.edges ?? [],
  reach: c.reach ? r2(c.reach) : 0,
  joined: c.pv.joined,
  source: c.pv.source,
}));
const seamD = seams.map((s) => toD(s.pts, false)).join("");
writeFileSync(
  OUT,
  `// Generated by scripts/build-tlax-provinces.mjs — do not edit by hand.
// THE 1519 TRIBUTARY PROVINCES of the Triple Alliance on the shared Cortés world
// (world px of cortesShared project(); 0.383 world px per km), for the clip
// "Sheppard_Tlaxcalans_thought_they_used_Cortes". Sources, method and the flip
// list with references: scripts/tlax-provinces.json (and SP/PROVINCES_READY.md).
// Province names are data only; nothing here is ever drawn as type.
import type { P2 } from "./cortesMapData";

export type ProvinceCell = {
  /** the map's head-town index (0..38; 100 = the Tenochca core) */
  id: number;
  key: string;
  /** Codex Mendoza spelling (Berdan & Anawalt 1992) */
  name: string;
  /** the head town (world px) and its lon/lat */
  head: P2;
  headLonLat: [number, number];
  /** the cell clipped to EMPIRE_T_POLYS (tlaxMapData): an svg d (world px, evenodd) and its polygons (rings open) */
  d: string;
  polys: P2[][][];
  areaKm2: number;
  centroid: P2;
  /** great-circle km from Tlaxcala city to the cell's nearest edge, and that point */
  distKm: number;
  nearestToTlaxcala: P2;
  /** the cells it shares a seam with, longest seam first (len in world px) */
  neighbours: { id: number; len: number }[];
  /** its people documented as joining Cortes against Tenochtitlan by the 1521 siege */
  flip: boolean;
  /** order of the spread (0 = first), -1 if it stays cream */
  flipRank: number;
  /** the conversion: a straight front from \`from\` (on the edge that touches orange) to \`to\` (the far side) */
  sweep: { from: P2; to: P2 } | null;
  /** (added) the edge that touches orange as open polylines (svg d, world px; "" if it never flips),
   *  and the farthest any point of the cell lies from it (world px): cut C's band sweep */
  entryD: string;
  reach: number;
  /** (added) a flipped cell's ring by what lies across it: nb = the other cell's id, or -1 = the
   *  empire's outer border over land (runs facing an enclave, the sea or the lake are left out);
   *  d = open polylines (world px). [] if it never flips */
  edges: { nb: number; d: string }[];
  joined: string;
  source: string;
};
export const PROVINCES: ProvinceCell[] = ${JSON.stringify(cellOut)};
/** the flipped cells' ids in the order of the spread */
export const FLIP_ORDER: number[] = ${JSON.stringify(flipped.map((c) => c.pv.id))};
/** the interior seams between two cells (over land inside the empire; not its border or coast), one svg d */
export const PROVINCE_SEAMS_D = ${JSON.stringify(seamD)};
/** the same seams one by one (a < b = the two cells; len world px) */
export const PROVINCE_SEAMS: { a: number; b: number; d: string; len: number }[] = ${JSON.stringify(
    seams.map((s) => ({ a: s.a, b: s.b, d: toD(s.pts, false), len: r2(s.len) })),
  )};
/** cut C's fronts: each enclave's edge with the empire as one polyline (Tlaxcala's = the outline of Tlaxcala +
 *  cut A's claim, from its westernmost point, clockwise on screen, closed); \`out\` = the side that faces the empire
 *  (+1: the left normal (ty, -tx) of the polyline's direction in y-down world px; -1: the right) */
export const FRONTS: { key: "tlaxcala" | "teotitlan" | "metztitlan" | "yopitzinco"; pts: P2[]; closed: boolean; len: number; out: 1 | -1 }[] = ${JSON.stringify(FRONTS)};
/** (added) cut C step 2: each outer enclave's edge with the empire (svg d) and the farthest point from it */
export const ENCLAVE_ENTRIES: { key: "teotitlan" | "metztitlan" | "yopitzinco"; d: string; reach: number }[] = ${JSON.stringify(ENCLAVE_ENTRIES)};
export const TLAXCALA_CITY: P2 = ${JSON.stringify(rp(TLAX))};
export const TEXCOCO: P2 = ${JSON.stringify(rp(TEXCOCO))};

export type Polity = {
  key: string;
  name: string;
  /** "enclave" = independent of the empire (W's enclaves); "province" = a flipped cell */
  kind: "enclave" | "province";
  /** the flipped cell's id (kind province) */
  cellId: number | null;
  /** W's enclave it lies in (kind enclave): Huexotzinco and Cholula lie in Tlaxcala's */
  enclave: string | null;
  /** the stream source (its head town; world px) and its lon/lat; srcMovedKm > 0 = the town lay
   *  outside its polity on the source map (or on its seam) and was moved that far inside */
  src: P2;
  srcLonLat: [number, number];
  srcMovedKm: number;
  srcName: string;
  /** its share of the allied host (men / 200,000; the weights sum to 1) */
  weight: number;
  /** warriors: the documented figure, or (documented false) its area share of the undocumented rest */
  men: number;
  /** true when the weight rests on a documented contingent, else on its area (or none: men 0, weight 0) */
  documented: boolean;
  /** the polity's land (the cell, or W's enclave), km2 */
  areaKm2: number;
  /** a land route to Texcoco avoiding the sea and Lake Texcoco (smoothed, world px; ends on TEXCOCO) */
  route: P2[];
  routeLen: number;
  ref: string;
};
export const POLITIES: Polity[] = ${JSON.stringify(
    polities.map((q) => ({
      key: q.key,
      name: q.name,
      kind: q.kind,
      cellId: q.cellId ?? null,
      enclave: q.enclave ?? null,
      src: rp(q.src),
      srcLonLat: INV(q.src).map((v) => Math.round(v * 1000) / 1000),
      srcMovedKm: Math.round(q.moved / PX_PER_KM),
      srcName: q.source.name,
      weight: Math.round(q.weight * 10000) / 10000,
      men: q.men,
      documented: q.documented,
      areaKm2: Math.round(q.area),
      route: q.pts.filter((_, i, a) => i % 2 === 0 || i === a.length - 1).map(rp),
      routeLen: r2(q.len),
      ref: q.ref,
    })),
  )};
`,
);
console.log(`Wrote ${OUT}`);
