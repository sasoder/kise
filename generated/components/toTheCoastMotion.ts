// ToTheCoast (cut 4 of the Cortes clip): every moving thing as pure maths (no
// React), so the check scripts read the exact motion the component draws. See
// ToTheCoast.tsx's header for the words, the gestures, the colour rule and the
// sources.
//   water        Lake Texcoco (rasterised from LAKE_TEXCOCO) + the sea (the shared
//                land mask), and an exact distance-to-water field round the city
//   the crowd    39 orange dots at Tenochtitlan (an even blue-noise organic oval
//                on the land at the city's gates, trimmed by the lake shore):
//                i 0..26 leave, i 27..38 are the garrison; the garrison is the 12
//                an optimal assignment gives to the knot (the land nearest the city
//                that holds 12), and its final knot is GATHERED (pulled together,
//                pressed apart, kept off the water) so it is an organic huddle
//   the column   cut 3's march (empireMotion makeColumn) on this cut's path: a C1
//                lead-in on land from the crowd's south-east edge onto CORTES_ROAD
//                at S_JOIN, then the road down toward Cempoala; three files, ranks
//                3.25 apart, the middle file half a rank back; it fills a rank at a
//                time with the waiting men nearest to where the rank will land,
//                matched to its files in lateral order (no path crosses another)
//   the sim      cut 3's relaxation: the waiting body's home flows to the exit as
//                it drains, even spacing, the queue held behind the formation line,
//                nobody in the water; smoothed in time; a light display separation
//                (cut 3's, averaged over +-2 f) keeps the drift from touching dots
//   the camp     Narvaez's 90 at CREAM_REST with the house micro-drift, not moving
//   the camera   cut 3's approach: S (the world point at screen (540, 835)) and
//                ln k as integrals of cosine-tapered velocity bumps (one glide +
//                one long creep), areas solved to pass through the keyed framings
import {
  CAM_LIFT,
  CORTES_ROAD,
  CREAM_REST,
  CROWD_SLOT,
  LAKE_TEXCOCO,
  ORANGE_REST,
  SITES,
  clamp01,
  hash,
  landAt,
  makeTrack,
  smoothstep,
  type Bump,
  type Cam,
  type P2,
} from "./cortesShared";

export const FPS = 24;
// In-point 38.72 s on the EDIT timeline (the SRT). The line ends with "coast"
// at 40.479 s: round((40.48 - 38.72) * 24) = round(42.24) = 42, + the 16-frame
// house tail = 58.
export const IN_POINT = 38.72;
export const DURATION = 58;
export const LAST = DURATION - 1;

/** word onsets, f = round((t - 38.72) * 24) */
export const W = {
  takes: 0,
  as: 5,
  many: 9,
  menAs: 13,
  heCan: 19,
  toThe: 25,
  coast: 31,
  lineEnd: 42,
};

export const TENOCH: P2 = [SITES.tenochtitlan.x, SITES.tenochtitlan.y];
export const CEMPOALA: P2 = [SITES.cempoala.x, SITES.cempoala.y];
const centroid = (pts: P2[]): P2 => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

// ---------------------------------------------------------------------------
// WATER round Tenochtitlan: Lake Texcoco (the 1519 lake system, cortesShared)
// and the sea (the shared land mask). A raster of the region (WF.s cells per
// world px), then the exact Euclidean distance from every land cell to the
// nearest water cell (Felzenszwalb, as empireMotion's sea field).
// ---------------------------------------------------------------------------
const LAKE = LAKE_TEXCOCO as P2[];
const WF = { x0: 14, y0: 828, w: 0, h: 0, s: 4 };
WF.w = 96 * WF.s;
WF.h = 76 * WF.s;
/** the lake raster by scanline (even-odd crossings of the ring per cell row) */
const LAKE_CELLS = (() => {
  const out = new Uint8Array(WF.w * WF.h);
  for (let j = 0; j < WF.h; j++) {
    const y = WF.y0 + (j + 0.5) / WF.s;
    const xs: number[] = [];
    for (let i = 0, k = LAKE.length - 1; i < LAKE.length; k = i++) {
      const [xi, yi] = LAKE[i];
      const [xk, yk] = LAKE[k];
      if (yi > y !== yk > y) xs.push(xi + ((y - yi) * (xk - xi)) / (yk - yi));
    }
    xs.sort((a, b) => a - b);
    for (let q = 0; q + 1 < xs.length; q += 2) {
      const i0 = Math.max(0, Math.ceil((xs[q] - WF.x0) * WF.s - 0.5));
      const i1 = Math.min(WF.w - 1, Math.floor((xs[q + 1] - WF.x0) * WF.s - 0.5));
      for (let i = i0; i <= i1; i++) out[j * WF.w + i] = 1;
    }
  }
  return out;
})();
/** is the world point in Lake Texcoco? */
export const inLake = (x: number, y: number) => {
  const i = Math.floor((x - WF.x0) * WF.s);
  const j = Math.floor((y - WF.y0) * WF.s);
  if (i < 0 || j < 0 || i >= WF.w || j >= WF.h) return false;
  return LAKE_CELLS[j * WF.w + i] === 1;
};
const WATER_DIST = (() => {
  const BIG = 1e12;
  const g = new Float64Array(WF.w * WF.h);
  for (let j = 0; j < WF.h; j++)
    for (let i = 0; i < WF.w; i++) {
      const x = WF.x0 + (i + 0.5) / WF.s;
      const y = WF.y0 + (j + 0.5) / WF.s;
      g[j * WF.w + i] = LAKE_CELLS[j * WF.w + i] || !landAt(x, y) ? 0 : BIG;
    }
  const edt1 = (f: Float64Array, n: number) => {
    const d = new Float64Array(n);
    const v = new Int32Array(n);
    const z = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let sct = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (sct <= z[k]) {
        k--;
        sct = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = sct;
      z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    return d;
  };
  const col = new Float64Array(WF.h);
  for (let i = 0; i < WF.w; i++) {
    for (let j = 0; j < WF.h; j++) col[j] = g[j * WF.w + i];
    const d = edt1(col, WF.h);
    for (let j = 0; j < WF.h; j++) g[j * WF.w + i] = d[j];
  }
  const row = new Float64Array(WF.w);
  const dist = new Float32Array(WF.w * WF.h);
  for (let j = 0; j < WF.h; j++) {
    for (let i = 0; i < WF.w; i++) row[i] = g[j * WF.w + i];
    const d = edt1(row, WF.w);
    // a water cell's centre is ~half a cell inside the shore: report the
    // distance to the shore, not to the nearest water cell's centre
    for (let i = 0; i < WF.w; i++) dist[j * WF.w + i] = Math.min(30, Math.max(0, Math.sqrt(d[i]) - 0.5) / WF.s);
  }
  return dist;
})();
/** distance (world px) from a land point to the nearest water (lake or sea); 0 on water; capped at 30 */
export const waterDist = (x: number, y: number) => {
  const fx = (x - WF.x0) * WF.s - 0.5;
  const fy = (y - WF.y0) * WF.s - 0.5;
  if (fx < 0 || fy < 0 || fx >= WF.w - 1 || fy >= WF.h - 1) return landAt(x, y) ? 30 : 0;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = fx - i;
  const v = fy - j;
  const d = WATER_DIST;
  const a = d[j * WF.w + i];
  const b = d[j * WF.w + i + 1];
  const c = d[(j + 1) * WF.w + i];
  const e = d[(j + 1) * WF.w + i + 1];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
};
/** unit vector away from the nearest water (up the distance field) */
export const awayFromWater = (x: number, y: number): P2 => {
  const gx = waterDist(x + 0.25, y) - waterDist(x - 0.25, y);
  const gy = waterDist(x, y + 0.25) - waterDist(x, y - 0.25);
  const l = Math.hypot(gx, gy) || 1;
  return [gx / l, gy / l];
};
/** a dot centre keeps this far from water in the simulation (its radius 1.25 +
 *  a hair, + the ~0.4 world px micro-drift drawn on top) */
export const WATER_KEEP = 1.75;
/** ... and the layouts (crowd, knot) are cut this far inside the shore */
const LAYOUT_KEEP = 1.95;

// ---------------------------------------------------------------------------
// THE CROWD AT TENOCHTITLAN (1 dot = 10 men): 39 orange dots = Cortes's men in
// the city, May 1520. The city stands in the lake (its island is smaller than
// a dot at this scale), so the crowd stands on the land at its gates: an even
// blue-noise organic oval south-west of the city, trimmed by the lake shore
// (the city's HoldRing at its lakeward edge, as Cempoala is at the seaward edge
// of the crowd at Cempoala).
//   i 0..26  the 27 who leave (the same force as ORANGE_REST at Cempoala in
//            the other cuts)
//   i 27..38 the 12 who stay (Alvarado's garrison, ~120 men): the crowd's
//            north-east, by the city; they gather into a knot at the city's ring
// ---------------------------------------------------------------------------
export const N_LEAVE = ORANGE_REST.length; // 27
export const N_STAY = 12;
export const N_ORANGE_CITY = N_LEAVE + N_STAY; // 39
const SLOT = CROWD_SLOT; // 3.4 world px between dot centres (the shared crowds' spacing)
let seed = 1520 + 538;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const MASK_RES = 0.2;
const organic = (cx: number, cy: number, A: number, B: number, ph: number[], rot = 0) => (x: number, y: number) => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const u = (x - cx) * c + (y - cy) * s;
  const v = -(x - cx) * s + (y - cy) * c;
  const th = Math.atan2(v / B, u / A);
  const rr = 1 + 0.05 * Math.sin(2 * th + ph[0]) + 0.04 * Math.sin(3 * th + ph[1]) + 0.025 * Math.sin(5 * th + ph[2]);
  return Math.hypot(u / A, v / B) <= rr;
};
const cellsIn = (inside: (x: number, y: number) => boolean, cx: number, cy: number, R: number, keep: number) => {
  const out: P2[] = [];
  for (let y = cy - R; y <= cy + R; y += MASK_RES)
    for (let x = cx - R; x <= cx + R; x += MASK_RES) if (inside(x, y) && waterDist(x, y) >= keep) out.push([x, y]);
  return out;
};
const relax = (pts: P2[], isIn: (x: number, y: number) => boolean, iters: number, s: number) => {
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < pts.length; i++) {
      let fx = 0;
      let fy = 0;
      for (let j = 0; j < pts.length; j++) {
        if (i === j) continue;
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        if (Math.abs(dx) > s || Math.abs(dy) > s) continue;
        const d = Math.hypot(dx, dy) || 1e-6;
        if (d >= s) continue;
        fx += (dx / d) * (s - d) * 0.5;
        fy += (dy / d) * (s - d) * 0.5;
      }
      const nx = pts[i][0] + fx;
      const ny = pts[i][1] + fy;
      if (isIn(nx, ny)) pts[i] = [nx, ny];
      else if (isIn(pts[i][0] + fx * 0.3, pts[i][1] + fy * 0.3)) pts[i] = [pts[i][0] + fx * 0.3, pts[i][1] + fy * 0.3];
    }
  }
  return pts;
};
const blueNoiseIn = (n: number, cells: P2[], isIn: (x: number, y: number) => boolean, s: number) => {
  const pts: P2[] = [];
  for (let i = 0; i < n; i++) {
    let best: P2 = cells[0];
    let bd = -1;
    for (let c = 0; c < 30; c++) {
      const p = cells[Math.floor(rand() * cells.length)];
      let d = Infinity;
      for (const q of pts) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1]));
      if (d > bd) [bd, best] = [d, p];
    }
    pts.push([best[0], best[1]]);
  }
  return relax(pts, isIn, 28, s);
};
const setOf = (cells: P2[]) => {
  const set = new Set(cells.map(([x, y]) => `${Math.round(x / MASK_RES)},${Math.round(y / MASK_RES)}`));
  return (x: number, y: number) => set.has(`${Math.round(x / MASK_RES)},${Math.round(y / MASK_RES)}`);
};
/** the optimal assignment (Hungarian, min total squared distance): ans[i] = the slot of source i */
export const hungarian = (cost: number[][]) => {
  const n = cost.length;
  const m = cost[0].length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0);
  const way = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(Infinity);
    const used = new Array(m + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= m; j++)
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      for (let j = 0; j <= m; j++)
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const ans = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j] > 0) ans[p[j] - 1] = j - 1;
  return ans;
};

// the crowd's organic oval: centre, semi-axes (east-west A, north-south B), grown until it holds 39
export const CROWD_SPEC = { cx: 44.6, cy: 869.0, aspect: 1.08 };
const NEED_CITY = N_ORANGE_CITY * 0.866 * SLOT * SLOT * 1.12;
const CITY_CROWD_RAW: P2[] = (() => {
  let A = 9;
  for (let it = 0; it < 60; it++) {
    const B = A * CROWD_SPEC.aspect;
    const inside = organic(CROWD_SPEC.cx, CROWD_SPEC.cy, A, B, [0.9, 2.7, 4.6]);
    const cells = cellsIn(inside, CROWD_SPEC.cx, CROWD_SPEC.cy, B * 1.25, LAYOUT_KEEP);
    if (cells.length * MASK_RES * MASK_RES >= NEED_CITY) return blueNoiseIn(N_ORANGE_CITY, cells, setOf(cells), SLOT * 1.04);
    A += 0.2;
  }
  throw new Error("the city crowd does not fit");
})();
// THE KNOT, on the land at the city's ring. The city stands ~4 world px off the
// lake's west shore; KNOT_SPEC is the disk nearest it that holds 12 at
// KNOT_SLOT. Its 12 blue-noise slots (KNOT_RAW) only choose WHO stays; where
// they end is gathered (KNOT_SLOTS, below).
export const KNOT_SLOT = 3.05;
/** the knot's organic disk: the centre nearest the city whose disk (trimmed by
 *  the shore, as the crowds are by the coast) still holds 12 */
export const KNOT_SPEC = (() => {
  const need = N_STAY * 0.866 * KNOT_SLOT * KNOT_SLOT * 1.1;
  const rK = Math.sqrt(need / Math.PI) * 1.12;
  let best = { cx: 0, cy: 0, d: Infinity };
  for (let cy = TENOCH[1] - 8; cy <= TENOCH[1] + 8; cy += 0.5)
    for (let cx = TENOCH[0] - 14; cx <= TENOCH[0]; cx += 0.5) {
      const d = Math.hypot(cx - TENOCH[0], cy - TENOCH[1]);
      if (d >= best.d || waterDist(cx, cy) < LAYOUT_KEEP) continue;
      let n = 0;
      for (let y = cy - rK; y <= cy + rK; y += 0.5)
        for (let x = cx - rK; x <= cx + rK; x += 0.5) if (Math.hypot(x - cx, y - cy) <= rK && waterDist(x, y) >= LAYOUT_KEEP) n++;
      if (n * 0.25 >= need) best = { cx, cy, d };
    }
  return { cx: best.cx, cy: best.cy, r: rK };
})();
const KNOT_RAW: P2[] = (() => {
  const inside = organic(KNOT_SPEC.cx, KNOT_SPEC.cy, KNOT_SPEC.r, KNOT_SPEC.r, [2.2, 0.6, 3.9]);
  const cells = cellsIn(inside, KNOT_SPEC.cx, KNOT_SPEC.cy, KNOT_SPEC.r * 1.3, LAYOUT_KEEP);
  return blueNoiseIn(N_STAY, cells, setOf(cells), KNOT_SLOT * 1.04);
})();
// identities: the 12 the knot's slots take by an optimal assignment (rows =
// slots, so the 12 nearest stay as a group) are the garrison (i 27..38); the 27
// others leave (i 0..26).
const { stayRaw, leaveRaw } = (() => {
  const cost = KNOT_RAW.map((a) => CITY_CROWD_RAW.map((b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2));
  const ans = hungarian(cost); // ans[slot] = crowd dot
  const stay = new Set(ans);
  return {
    stayRaw: ans.map((i) => CITY_CROWD_RAW[i]),
    leaveRaw: CITY_CROWD_RAW.filter((_, i) => !stay.has(i)),
  };
})();
/** f0 positions: i < 27 the leavers, i >= 27 the garrison */
export const CITY_CROWD: P2[] = [...leaveRaw, ...stayRaw];
export const CITY_CROWD_C: P2 = centroid(CITY_CROWD);
export const isGarrison = (i: number) => i >= N_LEAVE && i < N_ORANGE_CITY;
/** garrison dot 27 + j ends at KNOT_SLOTS[j]: the 12 GATHERED (each pulled
 *  toward the knot's centre, pressed apart to KNOT_SLOT, kept off the water,
 *  until they settle), so the knot is a packed, organic huddle against the
 *  shore, not a lattice, and each man keeps his neighbours (no crossings) */
export const KNOT_SLOTS: P2[] = (() => {
  const pts = stayRaw.map((p) => [p[0], p[1]] as P2);
  const c: P2 = [KNOT_SPEC.cx, KNOT_SPEC.cy];
  for (let it = 0; it < 600; it++) {
    for (const p of pts) {
      const dx = c[0] - p[0];
      const dy = c[1] - p[1];
      const d = Math.hypot(dx, dy) || 1;
      const m = Math.min(0.12, 0.06 * d);
      p[0] += (dx / d) * m;
      p[1] += (dy / d) * m;
    }
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const ex = pts[j][0] - pts[i][0];
          const ey = pts[j][1] - pts[i][1];
          const d = Math.hypot(ex, ey) || 1e-6;
          if (d >= KNOT_SLOT) continue;
          const m = 0.5 * (KNOT_SLOT - d);
          pts[i][0] -= (ex / d) * m;
          pts[i][1] -= (ey / d) * m;
          pts[j][0] += (ex / d) * m;
          pts[j][1] += (ey / d) * m;
        }
    for (const p of pts) {
      const wd = waterDist(p[0], p[1]);
      if (wd < LAYOUT_KEEP) {
        const [nx, ny] = awayFromWater(p[0], p[1]);
        p[0] += nx * (LAYOUT_KEEP - wd);
        p[1] += ny * (LAYOUT_KEEP - wd);
      }
    }
  }
  return pts;
})();
export const KNOT_C: P2 = centroid(KNOT_SLOTS);

// ---------------------------------------------------------------------------
// THE ROAD as the other cuts draw it: from inside Cortes's body at Cempoala
// (cut 3's ROAD_S0 rule on ORANGE_REST: 3 world px inside the point where the
// road, walked inland, last passes an orange man) to Tenochtitlan
// ---------------------------------------------------------------------------
export const ROAD_S0 = (() => {
  let exit = 0;
  for (let s = 0; s <= CORTES_ROAD.len; s += 0.25) {
    const [x, y] = CORTES_ROAD.pointAt(s);
    if ((ORANGE_REST as P2[]).some(([px, py]) => Math.hypot(px - x, py - y) < CROWD_SLOT * 0.9)) exit = s;
  }
  return Math.max(0, exit - 3);
})();
export const ROAD_LEN = CORTES_ROAD.len;
/** THE ROAD'S DRAWN SEA END (director's review 1): the standing road runs on
 *  from ROAD_S0 to the edge of Narvaez's camp: walking from ROAD_S0 toward the
 *  coast, the last arclength at which the line's casing (half width ~0.9 world
 *  px at this cut's closing zoom) still clears every cream man's disk (radius
 *  1.25) by CAMP_GAP world px. The column's head never passes it. */
export const CAMP_GAP = 0.9;
export const ROAD_END_S = (() => {
  const clear = 1.25 + 0.9 + CAMP_GAP;
  let end = ROAD_S0;
  for (let s = ROAD_S0; s >= 0; s -= 0.05) {
    const [x, y] = CORTES_ROAD.pointAt(s);
    if ((CREAM_REST as P2[]).some(([px, py]) => Math.hypot(px - x, py - y) < clear)) break;
    end = s;
  }
  return end;
})();

// ---------------------------------------------------------------------------
// THE COLUMN'S PATH. The road leaves the city across the lake (the Iztapalapa
// causeway) and runs on along the shore of the southern lakes, so the column
// forms on land: from the formation point F at the crowd's south-east edge,
// one smooth lead-in east, south of the southern lakes, onto the road at
// S_JOIN (C1: the lead-in arrives along the road's own direction), then the
// road down to Cempoala. Smoothed over ~5 world px (cut 3's 7, eased so the
// column hugs the drawn road through the Cholula bend).
// ---------------------------------------------------------------------------
export const FORM: P2 = [55.0, 880.2];
export const S_JOIN = 118.5;
const PATH_STEP = 0.5; // world px between centre samples
const PATH_SIG = 10; // samples: the centre line smoothed over ~5 world px
const hermite = (p0: P2, v0: P2, p1: P2, v1: P2, u: number): P2 => {
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  const h11 = u * u * u - u * u;
  return [h00 * p0[0] + h10 * v0[0] + h01 * p1[0] + h11 * v1[0], h00 * p0[1] + h10 * v0[1] + h01 * p1[1] + h11 * v1[1]];
};
const cumOf = (pts: P2[]) => {
  const c = new Float64Array(pts.length);
  for (let i = 1; i < pts.length; i++) c[i] = c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return c;
};
/** resample a polyline every `step` world px */
const resample = (pts: P2[], step: number): P2[] => {
  const c = cumOf(pts);
  const L = c[c.length - 1];
  const out: P2[] = [];
  let i = 0;
  for (let s = 0; s <= L + 1e-9; s += step) {
    while (i < pts.length - 2 && c[i + 1] < s) i++;
    const u = (s - c[i]) / (c[i + 1] - c[i] || 1);
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]);
  }
  return out;
};
const gauss = (pts: P2[], sig: number): P2[] =>
  pts.map((_, i) => {
    let x = 0;
    let y = 0;
    let w = 0;
    for (let j = -3 * sig; j <= 3 * sig; j++) {
      const q = pts[Math.max(0, Math.min(pts.length - 1, i + j))];
      const g = Math.exp(-(j * j) / (2 * sig * sig));
      x += q[0] * g;
      y += q[1] * g;
      w += g;
    }
    return [x / w, y / w] as P2;
  });
/** the column's centre line (world px), F -> Cempoala */
export const PATH: P2[] = (() => {
  const J = CORTES_ROAD.pointAt(S_JOIN);
  const tJ = CORTES_ROAD.tangentAt(S_JOIN);
  const L = Math.hypot(J[0] - FORM[0], J[1] - FORM[1]);
  const lead: P2[] = [];
  for (let i = 0; i <= 400; i++) lead.push(hermite(FORM, [L, 0], J, [-tJ[0] * L, -tJ[1] * L], i / 400));
  const road: P2[] = [];
  for (let s = S_JOIN - 0.25; s >= 0; s -= 0.25) road.push(CORTES_ROAD.pointAt(s));
  return gauss(resample([...lead, ...road], PATH_STEP), PATH_SIG);
})();
const PATH_CUM = cumOf(PATH);
export const PATH_LEN = PATH_CUM[PATH_CUM.length - 1];

// ---------------------------------------------------------------------------
// THE COLUMN (cut 3's march, EmpireAtMyDisposal / empireMotion makeColumn):
// head-led, files LAT apart, ranks ROW apart, odd files half a rank back, a
// hair of jitter per man; each file walks its OWN offset of the centre line at
// its own arclength, so through a bend the inner file wheels ahead and no file
// bunches. 27 men in THREE files (9 ranks: a stream ~29 world px long; in four
// files 27 make a 7-rank block, in two the pour would still be leaving the city
// at "coast").
// ---------------------------------------------------------------------------
export const ABREAST = 3;
export const LAT = 3.0;
export const ROW = 3.25;
export const F_MARCH = -2; // the head steps off F (already under way on "takes" f0)
export const V_MARCH = 1.35; // world px / f once marching
export const MARCH_RAMP = 12;
const JOIN_W = 12; // frames a man takes to fall in (cut 3's 10, a touch longer: he comes from deeper in the crowd)
const JOIN_AFTER = 3; // ... landing this long after his slot passes F
export const FILE_LAT = Array.from({ length: ABREAST }, (_, q) => (q - (ABREAST - 1) / 2) * LAT);
const pathIdx = (c: number) => {
  const C = PATH_CUM;
  if (c <= 0) return 0;
  if (c >= C[C.length - 1]) return C.length - 1;
  let lo = 0;
  let hi = C.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (C[m] <= c) lo = m;
    else hi = m;
  }
  return lo + (c - C[lo]) / (C[hi] - C[lo] || 1);
};
const FILES = FILE_LAT.map((lat) => {
  const n = PATH.length;
  const off: P2[] = PATH.map((p, i) => {
    const a = PATH[Math.max(0, i - 4)];
    const b = PATH[Math.min(n - 1, i + 4)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const tx = (b[0] - a[0]) / l;
    const ty = (b[1] - a[1]) / l;
    return [p[0] - ty * lat, p[1] + tx * lat];
  });
  const pts = gauss(off, 2);
  return { pts, cum: cumOf(pts) };
});
const fileArc = (q: number, c: number) => {
  const x = pathIdx(c);
  const F = FILES[q];
  const i = Math.min(F.cum.length - 2, Math.floor(x));
  return F.cum[i] + (F.cum[i + 1] - F.cum[i]) * (x - i);
};
const filePoint = (q: number, a: number): { p: P2; t: P2 } => {
  const F = FILES[q];
  const C = F.cum;
  const c = Math.max(0, Math.min(C[C.length - 1], a));
  let lo = 0;
  let hi = C.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (C[m] <= c) lo = m;
    else hi = m;
  }
  const u = (c - C[lo]) / (C[hi] - C[lo] || 1);
  const A = F.pts[lo];
  const B = F.pts[hi];
  const a0 = F.pts[Math.max(0, lo - 3)];
  const b0 = F.pts[Math.min(F.pts.length - 1, hi + 3)];
  const l = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1;
  return { p: [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u], t: [(b0[0] - a0[0]) / l, (b0[1] - a0[1]) / l] };
};
/** the column head's arclength on the centre line at f (0 = F) */
export const marchHead = (f: number) => {
  if (f <= F_MARCH) return 0;
  const t = f - F_MARCH;
  const r = MARCH_RAMP;
  if (t < r) {
    const u = t / r;
    return V_MARCH * r * (u * u * u - 0.5 * u * u * u * u); // integral of V smoothstep(t / r)
  }
  return V_MARCH * (r * 0.5 + (t - r));
};
export const pathPoint = (c: number): P2 => {
  const x = pathIdx(c);
  const i = Math.min(PATH.length - 2, Math.floor(x));
  const u = x - i;
  return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * u, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * u];
};
export const marchHeadPt = (f: number): P2 => pathPoint(marchHead(f));
/** slot j = rank j / ABREAST, file j % ABREAST; odd files half a rank back */
const slotArc = (j: number, f: number) => {
  const q = j % ABREAST;
  const rank = Math.floor(j / ABREAST);
  return fileArc(q, marchHead(f)) - rank * ROW - (q % 2 === 1 ? ROW * 0.5 : 0);
};
/** column slot j's world position at frame f (a hair of jitter, constant per slot) */
export const slotPos = (j: number, f: number): P2 => {
  const q = j % ABREAST;
  const { p, t } = filePoint(q, slotArc(j, f));
  const lat = 0.3 * (hash(j, 21) - 0.5);
  const along = 0.3 * (hash(j, 22) - 0.5);
  return [p[0] - t[1] * lat + t[0] * along, p[1] + t[0] * lat + t[1] * along];
};
const slotPass = (j: number) => {
  const target = fileArc(j % ABREAST, 0);
  let lo = F_MARCH;
  let hi = F_MARCH + 400;
  for (let it = 0; it < 60; it++) {
    const m = (lo + hi) / 2;
    if (slotArc(j, m) < target - 1e-9) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
export const SLOT_T1 = Array.from({ length: N_LEAVE }, (_, j) => slotPass(j) + JOIN_AFTER);
const N_RANKS = Math.ceil(N_LEAVE / ABREAST);
const RANK_SLOTS: number[][] = Array.from({ length: N_RANKS }, (_, r) =>
  Array.from({ length: ABREAST }, (_, q) => r * ABREAST + q).filter((j) => j < N_LEAVE),
);
/** a rank starts to fill JOIN_W frames before its first slot lands */
const RANK_T0 = RANK_SLOTS.map((sl) => Math.min(...sl.map((j) => SLOT_T1[j])) - JOIN_W);
const FORM_T: P2 = (() => {
  const a = PATH[0];
  const b = PATH[8];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
})();
const FORM_N: P2 = [-FORM_T[1], FORM_T[0]];

// ---------------------------------------------------------------------------
// THE CROWD SIMULATION (cut 3's, on this crowd): the leavers stand as one body
// that flows toward F as it drains (a group home + even spacing), the waiting
// men held behind the formation line; the column fills a rank at a time (see
// below) and each man walks a smooth Hermite into his slot; the 12 ease into
// their knot, each on his own phase; nobody stands in the water. Then smoothed
// in time.
// ---------------------------------------------------------------------------
const S_SAME = 3.38; // centre spacing in the crowd (the shared crowds' CROWD_SLOT)
const KNOT_SEP = 2.85; // ... and inside the gathered knot (just under its packed spacing, so the two never fight)
const ITER = 8;
const F_SIM0 = -24;
const F_SIM1 = LAST + 14;
const N_CITY = N_ORANGE_CITY;
export const KNOT_T = { from: -1, to: 13 }; // the garrison compacts ("takes as many men" f0-f13)
const knotEase = (i: number, f: number) => {
  const d = 2.5 * (hash(i, 41) - 0.5); // each on his own phase
  return smoothstep((f - KNOT_T.from - d) / (KNOT_T.to - KNOT_T.from));
};
const LEAVE_C0 = centroid(leaveRaw);
const QUEUE: P2 = [FORM[0] - FORM_T[0] * 5, FORM[1] - FORM_T[1] * 5];
type Join = { dot: number; slot: number; t0: number; t1: number };
const joinPos = (jn: Join, f: number, outX: Float64Array[], outY: Float64Array[]): P2 => {
  if (f >= jn.t1) return slotPos(jn.slot, f);
  const a = jn.t0 - 1;
  const ia = a - F_SIM0;
  const p0: P2 = [outX[ia][jn.dot], outY[ia][jn.dot]];
  const pm: P2 = [outX[ia - 3][jn.dot], outY[ia - 3][jn.dot]];
  let v0: P2 = [(p0[0] - pm[0]) / 6, (p0[1] - pm[1]) / 6];
  const vl = Math.hypot(v0[0], v0[1]);
  if (vl > 0.35) v0 = [(v0[0] * 0.35) / vl, (v0[1] * 0.35) / vl];
  const p1 = slotPos(jn.slot, jn.t1);
  const p1b = slotPos(jn.slot, jn.t1 - 0.5);
  const v1: P2 = [(p1[0] - p1b[0]) * 2, (p1[1] - p1b[1]) * 2];
  const H = jn.t1 - a;
  const u = clamp01((f - a) / H);
  return hermite(p0, [v0[0] * H, v0[1] * H], p1, [v1[0] * H, v1[1] * H], u);
};
const SIM = (() => {
  const n = N_CITY;
  const xs = Float64Array.from(CITY_CROWD.map((p) => p[0]));
  const ys = Float64Array.from(CITY_CROWD.map((p) => p[1]));
  const outX: Float64Array[] = [];
  const outY: Float64Array[] = [];
  const joinOf = new Map<number, Join>();
  const joins: Join[] = [];
  let nextRank = 0;
  for (let f = F_SIM0; f <= F_SIM1; f++) {
    // THE COLUMN FILLS a rank at a time (cut 3's rule, by rank): as a rank's
    // first slot starts to fill, the rank takes the ABREAST waiting men nearest
    // to where it will land, matched to its files in lateral order, so no two
    // paths cross; the ranks behind take men from further back
    const latOf = (i: number) => (xs[i] - FORM[0]) * FORM_N[0] + (ys[i] - FORM[1]) * FORM_N[1];
    while (nextRank < N_RANKS && RANK_T0[nextRank] <= f) {
      const slots = RANK_SLOTS[nextRank++];
      const land = centroid(slots.map((j) => slotPos(j, SLOT_T1[j])));
      const free = Array.from({ length: N_LEAVE }, (_, i) => i).filter((i) => !joinOf.has(i));
      free.sort((a, b) => Math.hypot(xs[a] - land[0], ys[a] - land[1]) - Math.hypot(xs[b] - land[0], ys[b] - land[1]));
      const picked = free.slice(0, slots.length).sort((a, b) => latOf(a) - latOf(b));
      const byFile = [...slots].sort((a, b) => FILE_LAT[a % ABREAST] - FILE_LAT[b % ABREAST]);
      byFile.forEach((j, q) => {
        if (q >= picked.length) return;
        const jn = { dot: picked[q], slot: j, t0: f, t1: SLOT_T1[j] };
        joinOf.set(jn.dot, jn);
        joins.push(jn);
      });
    }
    // falling in or marching: kinematic
    const fixed = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const jn = joinOf.get(i);
      if (!jn || f < jn.t0) continue;
      const p = joinPos(jn, f, outX, outY);
      fixed[i] = 1;
      xs[i] = p[0];
      ys[i] = p[1];
    }
    // the waiting body's home flows toward F as it drains
    let waiting = 0;
    for (let i = 0; i < N_LEAVE; i++) if (!joinOf.has(i)) waiting++;
    const drain = 1 - waiting / N_LEAVE;
    const m = smoothstep((f - (F_MARCH - 10)) / 14);
    const home: P2 = [LEAVE_C0[0] + (QUEUE[0] - LEAVE_C0[0]) * m, LEAVE_C0[1] + (QUEUE[1] - LEAVE_C0[1]) * m];
    const gate = smoothstep((f - (F_MARCH - 14)) / 10);
    for (let it = 0; it < ITER; it++) {
      // 1. homes: the leavers' group home (a speed limit keeps every move a
      //    walk); each garrison man his knot slot
      for (let i = 0; i < n; i++) {
        if (fixed[i]) continue;
        let mx: number;
        let my: number;
        if (i >= N_LEAVE) {
          const e = knotEase(i, f);
          const s0 = CITY_CROWD[i];
          const s1 = KNOT_SLOTS[i - N_LEAVE];
          const hx = s0[0] + (s1[0] - s0[0]) * e;
          const hy = s0[1] + (s1[1] - s0[1]) * e;
          mx = 0.35 * (hx - xs[i]);
          my = 0.35 * (hy - ys[i]);
        } else {
          const lam = 0.004 + 0.012 * m + 0.012 * drain;
          mx = lam * (home[0] - xs[i]);
          my = lam * (home[1] - ys[i]);
        }
        const l = Math.hypot(mx, my);
        if (l > 0.11) {
          mx *= 0.11 / l;
          my *= 0.11 / l;
        }
        xs[i] += mx;
        ys[i] += my;
      }
      // 2. spacing (three Jacobi passes): the crowd's S_SAME, the knot its own
      //    KNOT_SEP; a man falling in or marching never gives way
      for (let pass = 0; pass < 3; pass++) {
        const dx = new Float64Array(n);
        const dy = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            if (fixed[i] && fixed[j]) continue;
            const ex = xs[j] - xs[i];
            const ey = ys[j] - ys[i];
            const sep = i >= N_LEAVE && j >= N_LEAVE ? KNOT_SEP : S_SAME;
            if (Math.abs(ex) >= sep || Math.abs(ey) >= sep) continue;
            const d = Math.hypot(ex, ey);
            if (d >= sep) continue;
            const ux = d > 1e-6 ? ex / d : Math.cos(i * 2.4 + j);
            const uy = d > 1e-6 ? ey / d : Math.sin(i * 2.4 + j);
            const mm = 0.5 * (sep - d);
            const wi = fixed[i] ? 0 : fixed[j] ? 2 : 1;
            const wj = fixed[j] ? 0 : fixed[i] ? 2 : 1;
            dx[i] -= ux * mm * 0.45 * wi;
            dy[i] -= uy * mm * 0.45 * wi;
            dx[j] += ux * mm * 0.45 * wj;
            dy[j] += uy * mm * 0.45 * wj;
          }
        }
        for (let i = 0; i < n; i++) {
          if (fixed[i]) continue;
          xs[i] += dx[i];
          ys[i] += dy[i];
        }
      }
      // 3. the queue: the waiting men stay behind the formation line
      for (let i = 0; i < N_LEAVE; i++) {
        if (fixed[i]) continue;
        const lon = (xs[i] - FORM[0]) * FORM_T[0] + (ys[i] - FORM[1]) * FORM_T[1];
        if (lon > -1.2) {
          const mm = gate * Math.min(0.4, lon + 1.2);
          xs[i] -= FORM_T[0] * mm;
          ys[i] -= FORM_T[1] * mm;
        }
      }
      // 4. the water: never closer than WATER_KEEP
      for (let i = 0; i < n; i++) {
        if (fixed[i]) continue;
        const wd = waterDist(xs[i], ys[i]);
        if (wd < WATER_KEEP) {
          const [nx, ny] = awayFromWater(xs[i], ys[i]);
          const mm = Math.min(0.3, WATER_KEEP - wd);
          xs[i] += nx * mm;
          ys[i] += ny * mm;
        }
      }
    }
    outX.push(Float64Array.from(xs));
    outY.push(Float64Array.from(ys));
  }
  return { xs: outX, ys: outY, joins };
})();
export const JOINS: Join[] = SIM.joins;
const JOIN_OF = new Map(JOINS.map((jn) => [jn.dot, jn]));
/** the raw (unsmoothed) simulated position, for the check scripts */
export const simRaw = (i: number, f: number): P2 => {
  const fi = Math.max(0, Math.min(SIM.xs.length - 1, Math.round(f) - F_SIM0));
  return [SIM.xs[fi][i], SIM.ys[fi][i]];
};
// gaussian smoothing in time (sigma 1.6 f, cut 3's)
const SIG = 1.6;
const TAPS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((j) => ({ j, w: Math.exp(-(j * j) / (2 * SIG * SIG)) }));

export type DotState = { x: number; y: number; t: number; id: number };
/** the micro-drift every dot carries (cut 3's: ~1.15 screen px, its own phase) */
const drift = (id: number, f: number, k: number): P2 => {
  const a = 1.15 / k;
  return [a * Math.sin(f * (0.045 + 0.04 * hash(id, 11)) + 6.283 * hash(id, 13)), a * Math.sin(f * (0.04 + 0.045 * hash(id, 12)) + 6.283 * hash(id, 14))];
};
/** dot ids for the hashes: the camp keeps cut 3's (0..89), Cortes's 27 theirs (90..116), the garrison 117..128 */
export const cityId = (i: number) => (i < N_LEAVE ? 90 + i : 117 + (i - N_LEAVE));
/** the city's 39 at frame f before separation (world px): the smoothed crowd,
 *  the column's exact slots, the hand-over between, and the micro-drift */
const basePositions = (fi: number, k: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < N_CITY; i++) {
    let x = 0;
    let y = 0;
    const jn = JOIN_OF.get(i);
    if (jn && fi >= jn.t1 + 6) {
      [x, y] = slotPos(jn.slot, fi);
    } else {
      let w = 0;
      for (const { j, w: g } of TAPS) {
        const p = simRaw(i, fi + j);
        x += p[0] * g;
        y += p[1] * g;
        w += g;
      }
      x /= w;
      y /= w;
      if (jn && fi >= jn.t1) {
        // hand over to the exact slot without a step
        const sp = slotPos(jn.slot, fi);
        const u = smoothstep((fi - jn.t1) / 6);
        x += (sp[0] - x) * u;
        y += (sp[1] - y) * u;
      }
    }
    const [ddx, ddy] = drift(cityId(i), fi, k);
    out.push([x + ddx, y + ddy]);
  }
  return out;
};
const pinnedAt = (fi: number) =>
  Array.from({ length: N_CITY }, (_, i) => {
    const jn = JOIN_OF.get(i);
    return !!jn && fi >= jn.t1 + 6;
  });
const SHOW_SEP = 2.85; // world px: the dots' diameter (2.5) and a hair (cut 3's)
/** the separation a frame's positions need: a man marching in the column gives
 *  way only to another marcher (the drift can bring two together where the
 *  files wheel through a bend); a free man gives way to him */
const separation = (pos: P2[], pinned: boolean[]): P2[] => {
  const xs = pos.map((p) => p[0]);
  const ys = pos.map((p) => p[1]);
  for (let it = 0; it < 10; it++) {
    const dx = new Float64Array(N_CITY);
    const dy = new Float64Array(N_CITY);
    for (let i = 0; i < N_CITY; i++) {
      for (let j = i + 1; j < N_CITY; j++) {
        const ex = xs[j] - xs[i];
        const ey = ys[j] - ys[i];
        if (Math.abs(ex) >= SHOW_SEP || Math.abs(ey) >= SHOW_SEP) continue;
        const d = Math.hypot(ex, ey);
        if (d >= SHOW_SEP) continue;
        const ux = d > 1e-6 ? ex / d : 1;
        const uy = d > 1e-6 ? ey / d : 0;
        const m = 0.5 * (SHOW_SEP - d);
        const both = pinned[i] === pinned[j];
        const wi = both ? 1 : pinned[i] ? 0 : 2;
        const wj = both ? 1 : pinned[j] ? 0 : 2;
        dx[i] -= ux * m * 0.5 * wi;
        dy[i] -= uy * m * 0.5 * wi;
        dx[j] += ux * m * 0.5 * wj;
        dy[j] += uy * m * 0.5 * wj;
      }
    }
    for (let i = 0; i < N_CITY; i++) {
      xs[i] += dx[i];
      ys[i] += dy[i];
    }
  }
  return pos.map((p, i) => [xs[i] - p[0], ys[i] - p[1]]);
};
const SEP_TAPS = [-2, -1, 0, 1, 2].map((j) => ({ j, w: Math.exp(-(j * j) / 2) }));
/** the city's 39 at frame f (world px), with the house micro-drift at zoom k.
 *  The drift can bring two packed neighbours together; the light separation
 *  that fixes it is averaged over +-2 frames (cut 3's), so it never kicks */
export const cityDotsAt = (f: number, k: number): DotState[] => {
  const fi = Math.round(f);
  const here = basePositions(fi, k);
  const cx = new Float64Array(N_CITY);
  const cy = new Float64Array(N_CITY);
  let wsum = 0;
  for (const { j, w } of SEP_TAPS) {
    const fj = fi + j;
    const pos = j === 0 ? here : basePositions(fj, k);
    const c = separation(pos, pinnedAt(fj));
    for (let i = 0; i < N_CITY; i++) {
      cx[i] += c[i][0] * w;
      cy[i] += c[i][1] * w;
    }
    wsum += w;
  }
  return here.map(([x, y], i) => ({
    x: x + cx[i] / wsum,
    y: y + cy[i] / wsum,
    t: 1,
    id: cityId(i),
  }));
};
/** Narvaez's camp at Cempoala: CREAM_REST, calm, the micro-drift only */
export const campDotsAt = (f: number, k: number): DotState[] =>
  (CREAM_REST as P2[]).map((p, i) => {
    const [ddx, ddy] = drift(i, Math.round(f), k);
    return { x: p[0] + ddx, y: p[1] + ddy, t: 0, id: i };
  });

// ---------------------------------------------------------------------------
// THE CAMERA (cut 3's approach, empireMotion): a framed world point S (at
// screen (540, 835)) and ln k, each the integral of cosine-tapered velocity
// bumps (cortesShared makeTrack, C1): ONE glide east and out (zoom f-20..42,
// pan f-20..46; raised cosines: already moving on "takes" f0, the peak on
// "many" f9, eased out by f42-46) and one long creep (f-40..100, peaking at
// f30) that carries the move on, slowing, to the last frame and past it, so
// the camera never stops; the creep keeps the glide's sign on every channel
// (east, out). The bumps' areas are SOLVED so each channel passes exactly
// through its keyed framings (a 2 x 2 system per channel):
//   f0   (v0)  the city and its crowd, k 6.5, centred on (540, 835)
//   f31  "coast": the whole run, k 4.3: the knot at Tenochtitlan in the left
//        third, the road, the Gulf coast and its water-lines with Narvaez's
//        camp at Cempoala toward the right third, the run's box centred on
//        (540, 835) (director's review 1: tighter than the first preview's
//        4.5 -> 3.0, so the men stay legible on a phone)
//   f57  still drifting east and out after the column (k 4.2)
// ---------------------------------------------------------------------------
export const K_OPEN = 6.5;
export const K_RUN = 4.3;
export const K_END = 4.2;
type Win = [number, number, number];
/** the zoom: the glide lands the pull-back on "coast" (f31), the creep goes on out */
export const WIN_ZOOM: Win[] = [
  [-20, 42, 1], // the glide
  [-40, 100, 1], // the creep
];
/** the pan: the same glide a little longer (the camera keeps travelling with the column) */
export const WIN_PAN: Win[] = [
  [-20, 46, 1], // the glide
  [-40, 100, 1], // the creep
];
const KEY_F = [W.coast, LAST];
const bboxOf = (pts: P2[]) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1, c: [(x0 + x1) / 2, (y0 + y1) / 2] as P2 };
};
/** the opening framing: the city and its crowd (midway between the crowd's box
 *  centre and Tenochtitlan in x, the crowd's box centre in y) */
export const S_OPEN: P2 = [(bboxOf(CITY_CROWD).c[0] + TENOCH[0]) / 2, bboxOf(CITY_CROWD).c[1]];
/** the whole run: the garrison's knot, the road, the camp, and the coast + its
 *  water-lines just east of Cempoala (COAST_MARGIN world px offshore) */
export const COAST_MARGIN = 9;
export const RUN_BOX = (() => {
  const road: P2[] = [];
  for (let s = 0; s <= CORTES_ROAD.len; s += 1) road.push(CORTES_ROAD.pointAt(s));
  const coast: P2[] = [];
  for (const y of [CEMPOALA[1] - 12, CEMPOALA[1], CEMPOALA[1] + 12]) {
    let x = CEMPOALA[0];
    while (landAt(x, y) && x < CEMPOALA[0] + 40) x += 0.25;
    coast.push([x + COAST_MARGIN, y]);
  }
  return bboxOf([...KNOT_SLOTS, ...road, ...(CREAM_REST as P2[]), ...coast]);
})();
export const S_RUN: P2 = RUN_BOX.c;
/** on the last frame: drifted a touch further east, after the column */
export const S_END: P2 = [S_RUN[0] + 9, S_RUN[1] - 1.5];
/** a channel through the windows' bumps, value v0 on f0, hitting `targets` on KEY_F */
const solveTrack = (windows: Win[], v0: number, targets: number[]) => {
  const unit = windows.map(([a, b, t]) => makeTrack([[a, b, 1, t]] as Bump[], 0));
  const n = windows.length;
  const m = KEY_F.map((f, r) => [...unit.map((u) => u(f)), targets[r] - v0]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const q = m[r][c] / m[c][c];
      for (let j = c; j <= n; j++) m[r][j] -= q * m[c][j];
    }
  }
  const areas = m.map((row, i) => row[n] / row[i]);
  return { track: makeTrack(windows.map(([a, b, t], i) => [a, b, areas[i], t]) as Bump[], v0), areas };
};
const LNK = solveTrack(WIN_ZOOM, Math.log(K_OPEN), [Math.log(K_RUN), Math.log(K_END)]);
const SX = solveTrack(WIN_PAN, S_OPEN[0], [S_RUN[0], S_END[0]]);
const SY = solveTrack(WIN_PAN, S_OPEN[1], [S_RUN[1], S_END[1]]);
/** the bump areas per channel (for the checks: the creep must not reverse the glide) */
export const CAM_AREAS = { lnk: LNK.areas, sx: SX.areas, sy: SY.areas };
/** the authored camera at frame f (no sway) */
export const camAt = (f: number): Cam => {
  const k = Math.exp(LNK.track(f));
  return { k, cx: SX.track(f), cy: SY.track(f) + CAM_LIFT / k };
};
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));
