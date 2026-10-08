// ---------------------------------------------------------------------------
// cityStatesGeo: the geometry of the cut CityStates (pure, no React). World px
// of mayaShared's map.
//
// THE MAYA LAND = the mainland ring of the baked map's own coast (mayaStatic
// LAND_D), cut to a convex LIMIT (the Yucatan peninsula down to the Peten and
// Belize; the limit's south and west sides are a drawn convention, not a
// border) and lightly simplified (0.3 world px) so a wall drawn along the coast
// is a tidy line.
//
// THE CELLS are SCHEMATIC: the Voronoi regions of the capitals of the
// Postclassic Yucatan provinces (after Roys 1957, The Political Geography of
// the Yucatan Maya) plus Acalan and the Itza for the south, computed here by
// half-plane clipping. The sites are then relaxed (a damped Lloyd step, a few
// rounds) so that no cell is a sliver: the cells show THAT the land was many
// states and roughly where each sat. They are NOT surveyed boundaries.
// Left out for room: Hocaba (inside Sotuta's cell), Kowoj (inside the Itza's),
// Cozumel (an island; only the mainland is drawn).
//
// API
//   REGION            the Maya land, one ring
//   SITES             the relaxed sites ({ name, p })
//   SEAMS             every pair of neighbouring cells { i, j, mid, s } (s =
//                     0..1 along the NW -> SE sweep)
//   cellsAt(gapOf)    the cells for seam gaps gapOf(seamIndex) (world px): each
//                     cell = its Voronoi region with every seam side moved in by
//                     half that seam's gap, corners rounded, cut to the land
//   FINAL             cellsAt(() => GAP): { ring, d, s, len, halves } per cell
//   TEETH             the teeth of the settled walls: triangles on the seam
//                     sides only, the two sides of a seam half a pitch apart
// ---------------------------------------------------------------------------
import { LAND_D } from "./mayaStatic";
import { project, type P2 } from "./mayaShared";

export const K0 = 3.42; // the cut's opening zoom: every screen-px size below is at K0
export const GAP = 34 / K0; // a seam's full width
export const ROUND = 12 / K0; // the cells' corner radius
export const TOOTH_PITCH = 36 / K0;
export const TOOTH_LEN = 14 / K0;
export const TOOTH_HALF = 11 / K0;

// ------------------------------- helpers ----------------------------------
const area2 = (r: P2[]) => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a;
};
const centroid = (r: P2[]): P2 => {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    const w = p[0] * q[1] - q[0] * p[1];
    a += w;
    cx += (p[0] + q[0]) * w;
    cy += (p[1] + q[1]) * w;
  }
  return [cx / (3 * a), cy / (3 * a)];
};
export const inRing = (r: P2[], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/** keep the part of ring `subj` with n . p <= c */
const clipHalf = (subj: P2[], nx: number, ny: number, c: number): P2[] => {
  const out: P2[] = [];
  const n = subj.length;
  for (let i = 0; i < n; i++) {
    const a = subj[i];
    const b = subj[(i + 1) % n];
    const da = nx * a[0] + ny * a[1] - c;
    const db = nx * b[0] + ny * b[1] - c;
    if (da <= 0) out.push(a);
    if (da <= 0 !== db <= 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
};
/** Sutherland-Hodgman: ring `subj` cut to the CONVEX ring `conv` */
const clipToConvex = (subj: P2[], conv: P2[]): P2[] => {
  const sgn = area2(conv) > 0 ? 1 : -1;
  let out = subj;
  for (let i = 0; i < conv.length && out.length; i++) {
    const a = conv[i];
    const b = conv[(i + 1) % conv.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (l < 1e-9) continue;
    // outward normal of edge a -> b
    const nx = (sgn * (b[1] - a[1])) / l;
    const ny = (-sgn * (b[0] - a[0])) / l;
    out = clipHalf(out, nx, ny, nx * a[0] + ny * a[1]);
  }
  return out;
};
export const simplify = (pts: P2[], eps: number): P2[] => {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop() as [number, number];
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const l = Math.hypot(bx - ax, by - ay);
    let m = -1;
    let md = eps;
    for (let i = a + 1; i < b; i++) {
      const d = l < 1e-9 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay) : Math.abs((pts[i][0] - ax) * (by - ay) - (pts[i][1] - ay) * (bx - ax)) / l;
      if (d > md) {
        md = d;
        m = i;
      }
    }
    if (m > 0) {
      keep[m] = 1;
      stack.push([a, m], [m, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
};
export const dOf = (r: P2[]) => (r.length ? `M${r.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z` : "");

// ------------------------------- the land ---------------------------------
// the convex limit, lon / lat, clockwise on the page from the north-west
const LIMIT: P2[] = (
  [
    [-91.6, 22.6],
    [-85.6, 22.6],
    [-85.6, 16.9],
    [-88.3, 16.3],
    [-89.5, 16.22],
    [-90.45, 16.5],
    [-91.0, 17.2],
    [-91.27, 18.3],
    [-91.2, 19.4],
  ] as P2[]
).map(([lon, lat]) => project(lon, lat));
export const MAINLAND: P2[] = (() => {
  const first = LAND_D.slice(1, LAND_D.indexOf("Z"));
  return first.split("L").map((q) => q.split(",").map(Number) as P2);
})();
export const REGION: P2[] = (() => {
  const cut = clipToConvex(MAINLAND, LIMIT);
  // start the simplification at a far-apart pair so the ring stays closed
  const s = simplify([...cut, cut[0]], 0.3);
  s.pop();
  return s;
})();
export const REGION_D = dOf(REGION);
const BOX = (() => {
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  for (const [x, y] of REGION) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1 };
})();
export const REGION_BOX = BOX;

// ------------------------------- the sites --------------------------------
// province, capital, lon, lat (the capitals' positions; Roys 1957)
const CAPITALS: [string, string, number, number][] = [
  ["Ah Canul", "Calkini", -90.05, 20.37],
  ["Can Pech", "Campeche", -90.53, 19.85],
  ["Chanputun", "Champoton", -90.72, 19.35],
  ["Chakan", "T'ho", -89.62, 20.97],
  ["Ceh Pech", "Motul", -89.28, 21.1],
  ["Ah Kin Chel", "Izamal", -89.02, 20.93],
  ["Tutul Xiu", "Mani", -89.39, 20.39],
  ["Sotuta", "Sotuta", -89.01, 20.6],
  ["Cupul", "Saci", -88.2, 20.69],
  ["Tases", "Chancenote", -87.78, 21.0],
  ["Chikinchel", "Chauaca", -87.95, 21.4],
  ["Ecab", "Ecab", -87.07, 21.5],
  ["Cochuah", "Tihosuco", -88.37, 20.2],
  ["Uaymil", "Bacalar", -88.39, 18.68],
  ["Chetumal", "Chactemal", -88.39, 18.4],
  ["Acalan", "Itzamkanac", -90.7, 18.1],
  ["Itza", "Nojpeten", -89.89, 16.93],
];

// the sweep axis: north-west -> south-east
const AX: P2 = [0.55, 0.835];
const axisS = (() => {
  let lo = 1e9;
  let hi = -1e9;
  for (const p of REGION) {
    const v = p[0] * AX[0] + p[1] * AX[1];
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  return (p: P2) => (p[0] * AX[0] + p[1] * AX[1] - lo) / (hi - lo);
})();
export const sweepS = axisS;

type LV = { p: P2; lab: number }; // lab = the label of the edge that STARTS here (-1 box, -2 corner arc, j = seam with cell j)
const BIG = 400;
const boxPoly = (): LV[] => [
  { p: [BOX.x0 - BIG, BOX.y0 - BIG], lab: -1 },
  { p: [BOX.x1 + BIG, BOX.y0 - BIG], lab: -1 },
  { p: [BOX.x1 + BIG, BOX.y1 + BIG], lab: -1 },
  { p: [BOX.x0 - BIG, BOX.y1 + BIG], lab: -1 },
];
const clipLab = (poly: LV[], nx: number, ny: number, c: number, lab: number): LV[] => {
  const out: LV[] = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const da = nx * a.p[0] + ny * a.p[1] - c;
    const db = nx * b.p[0] + ny * b.p[1] - c;
    const ina = da <= 0;
    const inb = db <= 0;
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = da / (da - db);
      const x: P2 = [a.p[0] + (b.p[0] - a.p[0]) * t, a.p[1] + (b.p[1] - a.p[1]) * t];
      out.push({ p: x, lab: ina ? lab : a.lab });
    }
  }
  return out;
};
/** cell i of the sites: every seam side moved in by gap(i, j) / 2 */
const voronoi = (sites: P2[], i: number, gap: (j: number) => number): LV[] => {
  let poly = boxPoly();
  const s = sites[i];
  for (let j = 0; j < sites.length && poly.length; j++) {
    if (j === i) continue;
    const t = sites[j];
    const l = Math.hypot(t[0] - s[0], t[1] - s[1]);
    const nx = (t[0] - s[0]) / l;
    const ny = (t[1] - s[1]) / l;
    const c = nx * (s[0] + t[0]) * 0.5 + ny * (s[1] + t[1]) * 0.5 - gap(j) / 2;
    poly = clipLab(poly, nx, ny, c, j);
  }
  return poly;
};

// the relaxation: a damped Lloyd step on the land-cut cells
export const SITES: { name: string; p: P2 }[] = (() => {
  let pts = CAPITALS.map(([, , lon, lat]) => project(lon, lat));
  for (let it = 0; it < 8; it++) {
    const next = pts.map((p, i) => {
      const cell = clipToConvex(
        REGION,
        voronoi(pts, i, () => 0).map((v) => v.p),
      );
      if (cell.length < 3 || Math.abs(area2(cell)) < 1) return p;
      const c = centroid(cell);
      return [p[0] + (c[0] - p[0]) * 0.7, p[1] + (c[1] - p[1]) * 0.7] as P2;
    });
    pts = next;
  }
  return CAPITALS.map(([name], i) => ({ name, p: pts[i] }));
})();
const PTS = SITES.map((s) => s.p);
const N = PTS.length;

// each cell's own piece of the land (gap 0) and its seams
const BASE = PTS.map((_, i) => voronoi(PTS, i, () => 0));
const LAND_I = BASE.map((b) =>
  clipToConvex(
    REGION,
    b.map((v) => v.p),
  ),
);
export type Seam = { i: number; j: number; mid: P2; s: number };
export const SEAMS: Seam[] = (() => {
  const out: Seam[] = [];
  for (let i = 0; i < N; i++) {
    const b = BASE[i];
    for (let k = 0; k < b.length; k++) {
      const j = b[k].lab;
      if (j <= i) continue;
      // the part of this Voronoi edge on land: sample it
      const a = b[k].p;
      const c = b[(k + 1) % b.length].p;
      let n = 0;
      let mx = 0;
      let my = 0;
      for (let q = 0; q <= 40; q++) {
        const x = a[0] + ((c[0] - a[0]) * q) / 40;
        const y = a[1] + ((c[1] - a[1]) * q) / 40;
        if (inRing(REGION, x, y)) {
          n++;
          mx += x;
          my += y;
        }
      }
      if (n < 2) continue;
      const mid: P2 = [mx / n, my / n];
      out.push({ i, j, mid, s: axisS(mid) });
    }
  }
  return out;
})();
const SEAM_OF = new Map<number, number>();
SEAMS.forEach((s, q) => {
  SEAM_OF.set(s.i * 100 + s.j, q);
  SEAM_OF.set(s.j * 100 + s.i, q);
});

const roundCorners = (poly: LV[], rOf: (a: number, b: number) => number): LV[] => {
  const n = poly.length;
  const out: LV[] = [];
  for (let k = 0; k < n; k++) {
    const prev = poly[(k - 1 + n) % n];
    const v = poly[k];
    const next = poly[(k + 1) % n];
    const r = rOf(prev.lab, v.lab);
    const l1 = Math.hypot(v.p[0] - prev.p[0], v.p[1] - prev.p[1]);
    const l2 = Math.hypot(next.p[0] - v.p[0], next.p[1] - v.p[1]);
    if (r < 1e-4 || l1 < 1e-6 || l2 < 1e-6) {
      out.push(v);
      continue;
    }
    const u1: P2 = [(v.p[0] - prev.p[0]) / l1, (v.p[1] - prev.p[1]) / l1];
    const u2: P2 = [(next.p[0] - v.p[0]) / l2, (next.p[1] - v.p[1]) / l2];
    const cos = -(u1[0] * u2[0] + u1[1] * u2[1]); // of the interior angle
    const half = Math.acos(Math.max(-1, Math.min(1, cos))) / 2;
    const t = Math.min(r / Math.tan(half), 0.42 * l1, 0.42 * l2);
    const A: P2 = [v.p[0] - u1[0] * t, v.p[1] - u1[1] * t];
    const B: P2 = [v.p[0] + u2[0] * t, v.p[1] + u2[1] * t];
    out.push({ p: A, lab: -2 });
    for (let q = 1; q < 6; q++) {
      const w = q / 6;
      out.push({
        p: [(1 - w) * (1 - w) * A[0] + 2 * w * (1 - w) * v.p[0] + w * w * B[0], (1 - w) * (1 - w) * A[1] + 2 * w * (1 - w) * v.p[1] + w * w * B[1]],
        lab: -2,
      });
    }
    out.push({ p: B, lab: v.lab });
  }
  return out;
};

/** the cells for seam gaps gapOf(seam index) (world px). lean[i] (world px)
 *  shifts cell i's seam sides bodily (its coast stays where the coast is) */
export const cellsAt = (gapOf: (seam: number) => number, lean?: P2[]): { ring: P2[]; conv: LV[] }[] =>
  PTS.map((_, i) => {
    const g = (j: number) => {
      const q = SEAM_OF.get(i * 100 + j);
      return q === undefined ? 0 : gapOf(q);
    };
    const v = lean?.[i];
    const inset = (j: number) => {
      if (!v || (v[0] === 0 && v[1] === 0)) return g(j);
      const l = Math.hypot(PTS[j][0] - PTS[i][0], PTS[j][1] - PTS[i][1]);
      return g(j) - (2 * (v[0] * (PTS[j][0] - PTS[i][0]) + v[1] * (PTS[j][1] - PTS[i][1]))) / l;
    };
    const conv = roundCorners(voronoi(PTS, i, inset), (a, b) => (a >= 0 && b >= 0 ? (ROUND * Math.min(g(a), g(b))) / GAP : 0));
    return {
      ring: clipToConvex(
        LAND_I[i],
        conv.map((q) => q.p),
      ),
      conv,
    };
  });

// ------------------------------- the settled cells ------------------------
export type Half = { d: string; len: number };
export type Cell = { name: string; ring: P2[]; d: string; c: P2; s: number; len: number; halves: [Half, Half] };
const FINAL_RAW = cellsAt(() => GAP);
export const FINAL: Cell[] = FINAL_RAW.map(({ ring }, i) => {
  // drop repeated points
  const r = ring.filter((p, k) => {
    const q = ring[(k + 1) % ring.length];
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-4;
  });
  // the wall is drawn from the cell's north-west-most point, both ways round
  let k0 = 0;
  for (let k = 1; k < r.length; k++) if (axisS(r[k]) < axisS(r[k0])) k0 = k;
  const rot = [...r.slice(k0), ...r.slice(0, k0)];
  const closed = [...rot, rot[0]];
  const cum = [0];
  for (let k = 1; k < closed.length; k++) cum.push(cum[k - 1] + Math.hypot(closed[k][0] - closed[k - 1][0], closed[k][1] - closed[k - 1][1]));
  const len = cum[cum.length - 1];
  let m = 1;
  while (m < cum.length - 1 && cum[m] < len / 2) m++;
  const t = (len / 2 - cum[m - 1]) / (cum[m] - cum[m - 1] || 1);
  const mid: P2 = [closed[m - 1][0] + (closed[m][0] - closed[m - 1][0]) * t, closed[m - 1][1] + (closed[m][1] - closed[m - 1][1]) * t];
  const open = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
  const h1 = [...closed.slice(0, m), mid];
  const back = [...closed.slice(m).reverse(), mid];
  const c = centroid(r);
  return { name: SITES[i].name, ring: r, d: dOf(r), c, s: axisS(c), len, halves: [{ d: open(h1), len: len / 2 }, { d: open(back), len: len / 2 }] };
});
export const CELLS_D = FINAL.map((c) => c.d).join("");

// ------------------------------- the teeth --------------------------------
export type Tooth = { base: P2; n: P2; t: P2; seam: number; cell: number };
export const TEETH: Tooth[] = (() => {
  const out: Tooth[] = [];
  FINAL_RAW.forEach(({ conv }, i) => {
    for (let k = 0; k < conv.length; k++) {
      const j = conv[k].lab;
      if (j < 0) continue;
      const seam = SEAM_OF.get(i * 100 + j);
      if (seam === undefined) continue;
      const a = conv[k].p;
      const b = conv[(k + 1) % conv.length].p;
      const si = PTS[i];
      const sj = PTS[j];
      const l = Math.hypot(sj[0] - si[0], sj[1] - si[1]);
      const n: P2 = [(sj[0] - si[0]) / l, (sj[1] - si[1]) / l]; // towards the neighbour
      // the seam's own direction and origin, the same for both of its sides
      const lo = PTS[Math.min(i, j)];
      const hi = PTS[Math.max(i, j)];
      const ll = Math.hypot(hi[0] - lo[0], hi[1] - lo[1]);
      const t: P2 = [-(hi[1] - lo[1]) / ll, (hi[0] - lo[0]) / ll];
      const o = SEAMS[seam].mid; // the middle of the seam's stretch on land: the pattern is centred on it
      const ua = (a[0] - o[0]) * t[0] + (a[1] - o[1]) * t[1];
      const ub = (b[0] - o[0]) * t[0] + (b[1] - o[1]) * t[1];
      // none at the corners
      const u0 = Math.min(ua, ub) + TOOTH_HALF + 3 / K0;
      const u1 = Math.max(ua, ub) - TOOTH_HALF - 3 / K0;
      const phase = i < j ? 0.25 : 0.75; // the two sides half a pitch apart: a zip that does not close
      for (let q = Math.ceil(u0 / TOOTH_PITCH - phase); (q + phase) * TOOTH_PITCH <= u1; q++) {
        const u = (q + phase) * TOOTH_PITCH;
        // on this cell's side of the seam
        const base: P2 = [o[0] + t[0] * u - (n[0] * GAP) / 2, o[1] + t[1] * u - (n[1] * GAP) / 2];
        // a tooth only where both walls stand on land, with room each side
        let ok = true;
        for (const du of [-TOOTH_HALF * 1.15, 0, TOOTH_HALF * 1.15])
          for (const dn of [-0.9, GAP + 0.9]) if (!inRing(REGION, base[0] + t[0] * du + n[0] * dn, base[1] + t[1] * du + n[1] * dn)) ok = false;
        if (ok) out.push({ base, n, t, seam, cell: i });
      }
    }
  });
  return out;
})();
/** teeth at growth g (0..1), moved bodily by (dx, dy): one path of triangles */
export const teethD = (teeth: Tooth[], g: number, dx = 0, dy = 0) => {
  const len = TOOTH_LEN * g;
  const hw = TOOTH_HALF * (0.5 + 0.5 * g);
  let d = "";
  for (const { base, n, t } of teeth) {
    const bx = base[0] - n[0] * 0.3 + dx;
    const by = base[1] - n[1] * 0.3 + dy;
    d += `M${(bx - t[0] * hw).toFixed(2)},${(by - t[1] * hw).toFixed(2)}L${(bx + n[0] * (len + 0.3)).toFixed(2)},${(by + n[1] * (len + 0.3)).toFixed(2)}L${(bx + t[0] * hw).toFixed(2)},${(by + t[1] * hw).toFixed(2)}Z`;
  }
  return d;
};
