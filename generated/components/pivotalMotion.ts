// PivotalNotDecisive: the camera track and every army dot's trajectory. Pure
// maths, no React, so the check script (speeds, land, caption band) reads the
// exact same motion the component draws. See PivotalNotDecisive.tsx's header.
import { CITIES, RAIL_SOUTH_PTS, STATION_S } from "./manchuriaMapData";
import {
  ARRIVALS,
  BAND_SPACING,
  DOT_CLOSE,
  FRONT,
  GARRISON,
  JAPANESE,
  K_CLOSE,
  K_FRONT,
  RAIL_SAFE_L,
  RAIL_SAFE_R,
  RING_FINAL,
  RING_MID,
  RING_START,
  RUSSIANS,
  TIP_BITS,
  TIP_MASK,
} from "./pivotalMapData";

export const FPS = 24;
// IN-POINT 36.90 s = f0; "battle" ends f161 (43.62 s) + the 16-frame tail.
export const DURATION = 177;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** zero velocity AND acceleration at both ends (C2) */
export const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** smoothstep, warped: > 1 back-loads the motion, < 1 front-loads it */
const warpEase = (u: number, w: number) => smoothstep(Math.pow(clamp01(u), w));

// ---------------------------------------------------------------------------
// Timing (frames at 24 fps from the in-point).
// ---------------------------------------------------------------------------
export const T = {
  preroll: [-30, 36] as const, // the glide down the peninsula onto Port Arthur
  closeCreep: [36, 92] as const, // k x1.025, eases in, hands over to the pull-back
  creep: [-44, 44] as const, // the crescent creeps in (each dot its own window)
  close: [44, 55] as const, // ...then closes over the garrison, on the glyph ~f48
  garrison: [48, 60] as const, // the 8 fade one by one
  glyph: [48, 62] as const, // swords cream -> orange, 14 f
  label: 66, // PORT ARTHUR slides up, landed on "Port" f74
  depart: [60, 78] as const, // the ring peels onto the railway
  // the pull-back, travel north and push-in: see CAM_PARAMS
  tailCreep: [118, 177] as const, // k x1.02, still moving on the last frame
};

// ---------------------------------------------------------------------------
// The railway, measured from Port Arthur: d = STATION_S.portArthur - s.
// ---------------------------------------------------------------------------
type P2 = [number, number];
const RAIL = RAIL_SOUTH_PTS as P2[];
const RAIL_CUM: number[] = [0];
for (let i = 1; i < RAIL.length; i++) {
  RAIL_CUM.push(RAIL_CUM[i - 1] + Math.hypot(RAIL[i][0] - RAIL[i - 1][0], RAIL[i][1] - RAIL[i - 1][1]));
}
const RAIL_LEN = RAIL_CUM[RAIL_CUM.length - 1];
const railIdx = (s: number) => {
  const t = Math.max(0, Math.min(RAIL_LEN, s));
  let lo = 0;
  let hi = RAIL_CUM.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (RAIL_CUM[mid] <= t) lo = mid;
    else hi = mid;
  }
  return { lo, hi, u: (t - RAIL_CUM[lo]) / (RAIL_CUM[hi] - RAIL_CUM[lo] || 1) };
};
/** point, unit normal (left of Changchun -> PA) and land-safe lane at arclength s */
export const railAt = (s: number) => {
  const { lo, hi, u } = railIdx(s);
  const x = RAIL[lo][0] + (RAIL[hi][0] - RAIL[lo][0]) * u;
  const y = RAIL[lo][1] + (RAIL[hi][1] - RAIL[lo][1]) * u;
  const a = RAIL[Math.max(0, lo - 1)];
  const b = RAIL[Math.min(RAIL.length - 1, hi + 1)];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const tx = (b[0] - a[0]) / L;
  const ty = (b[1] - a[1]) / L;
  const safeL = RAIL_SAFE_L[lo] + (RAIL_SAFE_L[hi] - RAIL_SAFE_L[lo]) * u;
  const safeR = RAIL_SAFE_R[lo] + (RAIL_SAFE_R[hi] - RAIL_SAFE_R[lo]) * u;
  return { x, y, tx, ty, nx: -ty, ny: tx, safeL, safeR };
};
const S_PA = STATION_S.portArthur;
const PA: P2 = [CITIES.portArthur.x, CITIES.portArthur.y];
/** the arclength where the railway crosses world y (searching north from PA) */
const railSAtY = (y: number) => {
  for (let s = S_PA; s > 0; s -= 0.25) if (railAt(s).y <= y) return s;
  return 0;
};

// ---------------------------------------------------------------------------
// Land, from the baked bitmap of the tip + isthmus (outside it: inland).
// ---------------------------------------------------------------------------
const TIP = (() => {
  const bin = atob(TIP_BITS);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
})();
export const landAt = (x: number, y: number) => {
  const i = Math.floor((x - TIP_MASK.x0) * TIP_MASK.s);
  const j = Math.floor((y - TIP_MASK.y0) * TIP_MASK.s);
  if (i < 0 || j < 0 || i >= TIP_MASK.w || j >= TIP_MASK.h) return true;
  const n = j * TIP_MASK.w + i;
  return ((TIP[n >> 3] >> (n & 7)) & 1) === 1;
};
const LAND_R = 0.75; // world px: a dot's body, less a hair of the coast stroke
const diskLand = (x: number, y: number, r: number) => {
  if (!landAt(x, y)) return false;
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * Math.PI * 2;
    if (!landAt(x + r * Math.cos(t), y + r * Math.sin(t))) return false;
  }
  return true;
};
// ---------------------------------------------------------------------------
// THE CAMERA, authored as one keyed track (never chasing a dot). World point
// (cx, c) sits on screen (540, 835): cy = c + CAM_LIFT / k.
//   PRE    f-30  k 12 on the railway up the peninsula (s 400, NE of PA)
//   CLOSE  f36   k 13.5 on the siege group (fortress + garrison + crescent),
//                then a 2.5% creep
//   TRAVEL        k 4.6 for the run north
//   FRONT  f~122 k 13 on the Shaho front (front centre on y835)
// Every term is a smoothstep / smootherstep, so position and k are C1+.
// ---------------------------------------------------------------------------
export const CAM_LIFT = 125;
const K_PRE = 12;
const PRE_S = 400;
const K_TRAVEL = 4.6;
/** the siege group's centre: fortress, garrison and crescent together */
export const CLOSE_C: P2 = (() => {
  const pts = [...RING_START, ...GARRISON, PA] as P2[];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
})();
const CLOSE_CREEP = 1.025;
const TAIL_CREEP = 1.02;
const S_FRONT = railSAtY(FRONT.cy);

// The travel: one cubic Bezier from Port Arthur to the front's centre, leaving
// along the railway's heading up the peninsula and arriving along its heading
// into the front, arclength-parametrised so the ease alone sets the speed.
const BZ = (() => {
  const a = railAt(S_PA - 70);
  const b = railAt(S_FRONT + 70);
  const P0: P2 = [CLOSE_C[0], CLOSE_C[1]];
  const P3: P2 = [FRONT.cx, FRONT.cy];
  const d0 = Math.hypot(a.x - P0[0], a.y - P0[1]);
  const d1 = Math.hypot(P3[0] - b.x, P3[1] - b.y);
  const P1: P2 = [P0[0] + ((a.x - P0[0]) / d0) * 80, P0[1] + ((a.y - P0[1]) / d0) * 80];
  const P2_: P2 = [P3[0] - ((P3[0] - b.x) / d1) * 80, P3[1] - ((P3[1] - b.y) / d1) * 80];
  const N = 400;
  const pts: P2[] = [];
  for (let n = 0; n <= N; n++) {
    const t = n / N;
    const m = 1 - t;
    pts.push([
      m * m * m * P0[0] + 3 * m * m * t * P1[0] + 3 * m * t * t * P2_[0] + t * t * t * P3[0],
      m * m * m * P0[1] + 3 * m * m * t * P1[1] + 3 * m * t * t * P2_[1] + t * t * t * P3[1],
    ]);
  }
  const cum = [0];
  for (let n = 1; n <= N; n++) cum.push(cum[n - 1] + Math.hypot(pts[n][0] - pts[n - 1][0], pts[n][1] - pts[n - 1][1]));
  return { pts, cum, len: cum[N] };
})();
const bzAt = (u: number): P2 => {
  const t = clamp01(u) * BZ.len;
  let lo = 0;
  let hi = BZ.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (BZ.cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const w = (t - BZ.cum[lo]) / (BZ.cum[hi] - BZ.cum[lo] || 1);
  return [BZ.pts[lo][0] + (BZ.pts[hi][0] - BZ.pts[lo][0]) * w, BZ.pts[lo][1] + (BZ.pts[hi][1] - BZ.pts[lo][1]) * w];
};

// Velocity profiles, integrated and normalised to progress 0 -> 1. The rise and
// fall are smoothsteps (velocity C1, position C2); `trap` holds a plateau.
const I = (u: number) => u * u * u - (u * u * u * u) / 2; // integral of smoothstep on [0, u]
const trap = (f: number, a: number, b: number, c2: number, c: number) => {
  const up = b - a;
  const flat = c2 - b;
  const dn = c - c2;
  const total = up / 2 + flat + dn / 2;
  if (f <= a) return 0;
  if (f <= b) return (up * I((f - a) / up)) / total;
  if (f <= c2) return (up / 2 + (f - b)) / total;
  if (f >= c) return 1;
  const u = (f - c2) / dn;
  return (up / 2 + flat + dn * (u - I(u))) / total;
};

// THE MOVE, in three overlapping strokes:
//   pull-back on the siege, k 13.8 -> K_TRAVEL (za-zc; the front is still
//     off-frame: the top edge stays south of the crowds until the travel)
//   travel north along the Bezier, velocity rising a-b, held, falling c2-c:
//     at a near-constant k every map point moves at the camera's own speed
//   push-in on the front, K_TRAVEL -> K_FRONT (ya-yc), as the travel lands
export type CamParams = { za: number; zc: number; a: number; b: number; c2: number; c: number; ya: number; yc: number };
// Fitted by a joint search (camera x march) against the 45 px/f cap.
export const CAM_PARAMS: CamParams = { za: 72, zc: 86, a: 78, b: 94, c2: 104, c: 124, ya: 100, yc: 130 };

export const makeCam = (P: CamParams) => (f: number) => {
  const e1 = smootherstep((f - T.preroll[0]) / (T.preroll[1] - T.preroll[0]));
  const g1 = smootherstep((f - T.closeCreep[0]) / (T.closeCreep[1] - T.closeCreep[0]));
  const q = smootherstep((f - P.za) / (P.zc - P.za));
  const qi = smootherstep((f - P.ya) / (P.yc - P.ya));
  const p = trap(f, P.a, P.b, P.c2, P.c);
  const g2 = clamp01((f - T.tailCreep[0]) / (T.tailCreep[1] - T.tailCreep[0]));
  const tail = g2 * g2 * (1.5 - 0.5 * g2); // eases in, still moving at the end
  const k =
    Math.pow(K_PRE, 1 - e1) *
    Math.pow(K_CLOSE, e1) *
    Math.pow(CLOSE_CREEP, g1) *
    Math.pow(K_TRAVEL / (K_CLOSE * CLOSE_CREEP), q) *
    Math.pow(K_FRONT / K_TRAVEL, qi) *
    Math.pow(TAIL_CREEP, tail);
  const pre = railAt(PRE_S);
  const b = bzAt(p);
  const cx = pre.x + (CLOSE_C[0] - pre.x) * e1 + (b[0] - CLOSE_C[0]);
  const c = pre.y + (CLOSE_C[1] - pre.y) * e1 + (b[1] - CLOSE_C[1]);
  return { k, cx, c, cy: c + CAM_LIFT / k };
};
export const camAt = makeCam(CAM_PARAMS);

/** screen diameter of a dot at zoom k (k^0.35 law, DOT_CLOSE px at K_CLOSE) */
export const dotScreen = (k: number) => DOT_CLOSE * Math.pow(k / K_CLOSE, 0.35);

// ---------------------------------------------------------------------------
// Breathing: every dot has its own tiny hashed wobble (~1.1 screen px), two
// incommensurate slow sines, never in unison.
// ---------------------------------------------------------------------------
const breathe = (id: number, f: number, k: number, amp = 1.1) => {
  const w1 = 0.045 + 0.04 * hash(id, 11);
  const w2 = 0.04 + 0.045 * hash(id, 12);
  const a = amp / k;
  return [a * Math.sin(f * w1 + 6.283 * hash(id, 13)), a * Math.sin(f * w2 + 6.283 * hash(id, 14))];
};

// ---------------------------------------------------------------------------
// THE RING: creep, then the pivot. Departure order: the slots nearest the
// railway's bearing out of Port Arthur go first, then round the ring, so the
// ring unwinds onto the line.
// ---------------------------------------------------------------------------
const bearingOf = (x: number, y: number) => Math.atan2(-(y - PA[1]), x - PA[0]);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const RAIL_OUT = (() => {
  const r = railAt(S_PA - 8);
  return bearingOf(r.x, r.y);
})();
const RING_N = RING_FINAL.length;
const ringKey = RING_FINAL.map(([x, y], i) => ({
  i,
  // angular distance to the railway's bearing, then distance: nearest first
  key: Math.abs(wrap(bearingOf(x, y) - RAIL_OUT)) * 10 + Math.hypot(x - PA[0], y - PA[1]) * 0.12 + 0.4 * hash(i, 21),
}));
ringKey.sort((a, b) => a.key - b.key);
const RANK = new Array<number>(RING_N);
ringKey.forEach((r, rank) => (RANK[r.i] = rank));

export const DEPART = RING_FINAL.map((_, i) => {
  const u = RANK[i] / (RING_N - 1);
  return T.depart[0] + (T.depart[1] - T.depart[0]) * Math.pow(u, 1.1) + 1.2 * (hash(i, 22) - 0.5);
});
// The creep (start -> mid) is one body: each dot's window differs by < 3 f,
// so neighbours keep their spacing. The close (mid -> its closed slot, by
// optimal assignment in the build) is a straight move on one shared ease with
// sub-frame offsets, so paths never cross; its inner edge reaches the glyph
// ~f48.
const CREEP_WIN = RING_START.map((_, i) => [T.creep[0] - 3 * hash(i, 24), T.creep[1] + 1.5 * (hash(i, 23) - 0.5)]);
const CLOSE_WIN = RING_FINAL.map((_, i) => [T.close[0] + 0.8 * (hash(i, 26) - 0.5), T.close[1] + 0.8 * (hash(i, 25) - 0.5)]);
// A close path that would cut across water (an inlet on the tip's north
// shore) bends round it instead: a quadratic whose control point keeps the
// whole dot on land and stays clearest of the other dots.
const CLOSE_CTRL: (P2 | null)[] = RING_FINAL.map((fin, i) => {
  const m = RING_MID[i];
  const onLandAll = (c: P2 | null) => {
    for (let n = 1; n < 24; n++) {
      const t = n / 24;
      const x = c ? (1 - t) * (1 - t) * m[0] + 2 * (1 - t) * t * c[0] + t * t * fin[0] : m[0] + (fin[0] - m[0]) * t;
      const y = c ? (1 - t) * (1 - t) * m[1] + 2 * (1 - t) * t * c[1] + t * t * fin[1] : m[1] + (fin[1] - m[1]) * t;
      if (!diskLand(x, y, 0.5)) return false;
    }
    return true;
  };
  if (onLandAll(null)) return null;
  const mx = (m[0] + fin[0]) / 2;
  const my = (m[1] + fin[1]) / 2;
  // among control points round the chord's midpoint whose curve keeps the
  // whole dot on land, the one that stays furthest from every other dot's
  // (straight) close at the same moment
  const at = (c: P2, t: number): P2 => [
    (1 - t) * (1 - t) * m[0] + 2 * (1 - t) * t * c[0] + t * t * fin[0],
    (1 - t) * (1 - t) * m[1] + 2 * (1 - t) * t * c[1] + t * t * fin[1],
  ];
  const clearance = (c: P2) => {
    let worst = Infinity;
    for (let n = 0; n <= 24; n++) {
      const t = n / 24;
      const p = at(c, t);
      RING_FINAL.forEach((g, j) => {
        if (j === i) return;
        const mj = RING_MID[j];
        worst = Math.min(worst, Math.hypot(p[0] - (mj[0] + (g[0] - mj[0]) * t), p[1] - (mj[1] + (g[1] - mj[1]) * t)));
      });
    }
    return worst;
  };
  let best: P2 | null = null;
  let bestC = -1;
  for (let rr = 0.5; rr <= 8; rr += 0.25) {
    for (let a = 0; a < 32; a++) {
      const c: P2 = [mx + rr * Math.cos((a / 32) * 2 * Math.PI), my + rr * Math.sin((a / 32) * 2 * Math.PI)];
      if (!onLandAll(c)) continue;
      const cl = clearance(c);
      if (cl > bestC) {
        bestC = cl;
        best = c;
      }
    }
  }
  return best;
});
const ringBefore = (i: number, f: number): P2 => {
  const [c0, c1] = CREEP_WIN[i];
  const [k0, k1] = CLOSE_WIN[i];
  const a = warpEase((f - c0) / (c1 - c0), 1.1);
  const bb = smoothstep((f - k0) / (k1 - k0));
  const s0 = RING_START[i];
  const m = RING_MID[i];
  const cx = s0[0] + (m[0] - s0[0]) * a;
  const cy = s0[1] + (m[1] - s0[1]) * a;
  const fin = RING_FINAL[i];
  const c = CLOSE_CTRL[i];
  if (!c || bb <= 0) return [cx + (fin[0] - cx) * bb, cy + (fin[1] - cy) * bb];
  const t = bb;
  return [
    (1 - t) * (1 - t) * cx + 2 * (1 - t) * t * c[0] + t * t * fin[0],
    (1 - t) * (1 - t) * cy + 2 * (1 - t) * t * c[1] + t * t * fin[1],
  ];
};

// THE BACK LANE: arriving dots leave the railway just behind the Japanese
// band and run along a lane one band-spacing behind its backmost dots, then
// step up into their slots, so they never cut through the band.
const BAND = [...JAPANESE, ...ARRIVALS] as P2[];
const LANE_BACK = BAND_SPACING;
const laneY = (x: number) => {
  let m = -Infinity;
  let w = 0;
  let sum = 0;
  for (let dx = -2; dx <= 2; dx += 0.5) {
    let local = -Infinity;
    for (const [bx, by] of BAND) if (Math.abs(bx - (x + dx)) <= 4) local = Math.max(local, by);
    if (local > -Infinity) {
      const wt = Math.exp(-dx * dx);
      sum += local * wt;
      w += wt;
      m = Math.max(m, local);
    }
  }
  return (w ? Math.max(sum / w, m - 0.4) : Math.max(...BAND.map((b) => b[1]))) + LANE_BACK;
};
const RAIL_AT_LANE = railAt(railSAtY(laneY(FRONT.railX)));
// Order: a slot must fill before any slot just behind it (within ~1.3 band
// spacings across, deeper), so no dot rises past a landed one; otherwise the
// slot furthest along the lane goes first, so the column spreads outward and
// lands compactly. Kahn's topological sort, furthest-first among the ready.
const arrivalOrder = (() => {
  const n = ARRIVALS.length;
  const before: number[][] = ARRIVALS.map(() => []);
  const indeg = new Array<number>(n).fill(0);
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      const [ax, ay] = ARRIVALS[a];
      const [bx, by] = ARRIVALS[b];
      if (Math.abs(ax - bx) < 1.3 * BAND_SPACING && ay < by) {
        before[a].push(b);
        indeg[b]++;
      }
    }
  const far = (j: number) => Math.abs(ARRIVALS[j][0] - RAIL_AT_LANE.x);
  const done: number[] = [];
  const ready = new Set<number>();
  for (let j = 0; j < n; j++) if (!indeg[j]) ready.add(j);
  while (ready.size) {
    const j = [...ready].reduce((m, q) => (far(q) > far(m) ? q : m));
    ready.delete(j);
    done.push(j);
    for (const b of before[j]) if (--indeg[b] === 0) ready.add(b);
  }
  return done;
})();
const SLOT_OF = RING_FINAL.map((_, i) => ARRIVALS[arrivalOrder[RANK[i]]] as P2);

// Chaikin corner-cutting, endpoints kept
const chaikin = (pts: P2[], passes: number) => {
  let a = pts;
  for (let n = 0; n < passes; n++) {
    const b: P2[] = [a[0]];
    for (let i = 0; i < a.length - 1; i++) {
      const [x0, y0] = a[i];
      const [x1, y1] = a[i + 1];
      b.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1], [0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    b.push(a[a.length - 1]);
    a = b;
  }
  return a;
};

type Path = { pts: P2[]; cum: number[]; len: number; speed: number };
const gauss = (a: number[], sigma: number) => {
  const r = Math.ceil(sigma * 2.5);
  return a.map((_, i) => {
    let sum = 0;
    let wsum = 0;
    for (let j = -r; j <= r; j++) {
      const q = Math.max(0, Math.min(a.length - 1, i + j));
      const w = Math.exp(-(j * j) / (2 * sigma * sigma));
      sum += a[q] * w;
      wsum += w;
    }
    return sum / wsum;
  });
};
// The land corridor along the railway, one sample per world px from Port
// Arthur: the runs of lane offsets (along the normal) where a whole dot is on
// land, else where its centre is, else the line itself.
const OFFS: number[] = [];
for (let o = -5; o <= 5.001; o += 0.2) OFFS.push(o);
const corridorAt = (() => {
  const cache = new Map<number, [number, number][]>();
  return (d: number) => {
    const hit = cache.get(d);
    if (hit) return hit;
    const r = railAt(S_PA - d);
    const runsOf = (test: (x: number, y: number) => boolean) => {
      const runs: [number, number][] = [];
      let open: number | null = null;
      OFFS.forEach((o, n) => {
        const ok = test(r.x + r.nx * o, r.y + r.ny * o);
        if (ok && open === null) open = o;
        if ((!ok || n === OFFS.length - 1) && open !== null) {
          runs.push([open, ok ? o : OFFS[n - 1]]);
          open = null;
        }
      });
      return runs;
    };
    let runs = runsOf((x, y) => diskLand(x, y, LAND_R));
    if (!runs.length) runs = runsOf(landAt);
    if (!runs.length) runs = [[0, 0]];
    cache.set(d, runs);
    return runs;
  };
})();
const clampToRuns = (want: number, runs: [number, number][]) => {
  let best = want;
  let bestD = Infinity;
  for (const [lo, hi] of runs) {
    const v = Math.max(lo, Math.min(hi, want));
    if (Math.abs(v - want) < bestD) {
      bestD = Math.abs(v - want);
      best = v;
    }
  }
  return best;
};

const buildPath = (i: number): Path => {
  const [sx, sy] = RING_FINAL[i];
  const railFromPA = (d: number) => railAt(S_PA - d);
  // a. the swing: one cubic from the slot onto the railway, arriving along
  //    the line's own heading a few px past the slot's projection on it, so
  //    the peel-off is one smooth arc. Nothing crosses the glyph (r < 3.6).
  let proj = 0;
  let bestD = Infinity;
  for (let d = 0; d <= 40; d += 0.25) {
    const r = railFromPA(d);
    const dd = Math.hypot(r.x - sx, r.y - sy);
    if (dd < bestD) {
      bestD = dd;
      proj = d;
    }
  }
  const J = Math.max(11, proj + 6 + 0.25 * bestD);
  const rj = railFromPA(J);
  const span = Math.hypot(rj.x - sx, rj.y - sy);
  const P1: P2 = [sx + (rj.x - sx) * 0.35, sy + (rj.y - sy) * 0.35];
  const P2b: P2 = [rj.x + rj.tx * span * 0.45, rj.y + rj.ty * span * 0.45]; // t points to PA
  const SW = 28;
  const pts: P2[] = [];
  for (let n = 0; n <= SW; n++) {
    const t = n / SW;
    const m = 1 - t;
    let x = m * m * m * sx + 3 * m * m * t * P1[0] + 3 * m * t * t * P2b[0] + t * t * t * rj.x;
    let y = m * m * m * sy + 3 * m * m * t * P1[1] + 3 * m * t * t * P2b[1] + t * t * t * rj.y;
    const rr = Math.hypot(x - PA[0], y - PA[1]);
    if (n > 0 && rr < 3.6) {
      x = PA[0] + ((x - PA[0]) / (rr || 1)) * 3.6;
      y = PA[1] + ((y - PA[1]) / (rr || 1)) * 3.6;
    }
    pts.push([x, y]);
  }
  // b. up the railway in its own lane, kept inside the land corridor and
  //    smoothed along the line (single file through the Jinzhou isthmus)
  const slot = SLOT_OF[i];
  const dExit = S_PA - railSAtY(laneY(RAIL_AT_LANE.x) + 5);
  const lane0 = (hash(i, 31) - 0.5) * 5.2;
  const ph = 6.283 * hash(i, 32);
  const ds: number[] = [];
  for (let d = Math.ceil(J + 1); d <= dExit; d += 1) ds.push(d);
  const lanes = gauss(
    ds.map((d) => {
      const ramp = smoothstep((d - J) / 10);
      return clampToRuns((lane0 + 0.7 * Math.sin(d / 9 + ph)) * ramp, corridorAt(d));
    }),
    2.5,
  );
  let last = rj;
  ds.forEach((d, n) => {
    const r = railFromPA(d);
    pts.push([r.x + r.nx * lanes[n], r.y + r.ny * lanes[n]]);
    last = r;
  });
  // c. off the line onto the back lane, along it, and up into the slot
  const [ex, ey] = pts[pts.length - 1];
  const dir = Math.sign(slot[0] - RAIL_AT_LANE.x) || 1;
  const x0 = RAIL_AT_LANE.x + dir * 1.5;
  const turnIn = 1.5; // world px of lane before the slot where the rise begins
  // a short curve from the line onto the lane
  const ly0 = laneY(x0);
  const cxp = ex - last.tx * 2.5;
  const cyp = ey - last.ty * 2.5;
  for (let n = 1; n <= 8; n++) {
    const u = n / 8;
    pts.push([
      (1 - u) * (1 - u) * ex + 2 * (1 - u) * u * cxp + u * u * x0,
      (1 - u) * (1 - u) * ey + 2 * (1 - u) * u * cyp + u * u * ly0,
    ]);
  }
  const xEnd = slot[0] - dir * turnIn;
  if ((xEnd - x0) * dir > 0) {
    for (let x = x0 + dir * 0.5; (xEnd - x) * dir > 0; x += dir * 0.5) pts.push([x, laneY(x)]);
  }
  const [lx, ly] = pts[pts.length - 1];
  for (let n = 1; n <= 10; n++) {
    const u = n / 10;
    const cxq = slot[0];
    const cyq = ly;
    pts.push([
      (1 - u) * (1 - u) * lx + 2 * (1 - u) * u * cxq + u * u * slot[0],
      (1 - u) * (1 - u) * ly + 2 * (1 - u) * u * cyq + u * u * slot[1],
    ]);
  }
  const sm = chaikin(pts, 3);
  const cum = [0];
  for (let n = 1; n < sm.length; n++) cum.push(cum[n - 1] + Math.hypot(sm[n][0] - sm[n - 1][0], sm[n][1] - sm[n - 1][1]));
  const speed = 3.9 + 0.4 * (hash(i, 33) - 0.5) - 0.35 * (RANK[i] / (RING_N - 1));
  return { pts: sm, cum, len: cum[cum.length - 1], speed };
};
export const PATHS: Path[] = RING_FINAL.map((_, i) => buildPath(i));

export const pathAt = (P: Path, s: number): P2 => {
  const t = Math.max(0, Math.min(P.len, s));
  let lo = 0;
  let hi = P.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (P.cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const u = (t - P.cum[lo]) / (P.cum[hi] - P.cum[lo] || 1);
  return [P.pts[lo][0] + (P.pts[hi][0] - P.pts[lo][0]) * u, P.pts[lo][1] + (P.pts[hi][1] - P.pts[lo][1]) * u];
};

// Distance along the path. Each dot's pace is its own speed x a shared march
// pace x its own smooth start (ACCEL frames): slow while the camera is close
// on Port Arthur (k ~9, the close-up speed cap), quicker once it has pulled
// back. Integrated in 8 sub-steps per frame, then a soft landing over the last
// LAND_D world px. All C1.
const ACCEL = 16;
const LAND_D = 12;
// slow at the k 13.5 close-up, quick on the run north (the camera moves with
// the column), slow again as the camera pushes in on the front
export const MARCH = { slow: 0.55, fast: 1.5, late: 0.7, up: [76, 98] as const, down: [110, 126] as const };
const march = (f: number) =>
  MARCH.slow +
  (MARCH.fast - MARCH.slow) * smoothstep((f - MARCH.up[0]) / (MARCH.up[1] - MARCH.up[0])) +
  (MARCH.late - MARCH.fast) * smoothstep((f - MARCH.down[0]) / (MARCH.down[1] - MARCH.down[0]));
const F0 = -40;
const F1 = DURATION + 40;
const RAW: Float64Array[] = PATHS.map((P, i) => {
  const out = new Float64Array(F1 - F0 + 1);
  let acc = 0;
  const SUB = 8;
  for (let f = F0; f <= F1; f++) {
    out[f - F0] = acc;
    for (let n = 0; n < SUB; n++) {
      const t = f + (n + 0.5) / SUB;
      acc += (P.speed * march(t) * smoothstep((t - DEPART[i]) / ACCEL)) / SUB;
    }
  }
  return out;
});
const travelled = (i: number, f: number) => {
  const P = PATHS[i];
  const fi = Math.max(F0, Math.min(F1 - 1, Math.floor(f)));
  const w = f - fi;
  const raw = RAW[i][fi - F0] * (1 - w) + RAW[i][fi - F0 + 1] * w;
  const L = P.len;
  if (raw <= L - LAND_D) return raw;
  if (raw >= L + LAND_D) return L;
  return L - ((L + LAND_D - raw) * (L + LAND_D - raw)) / (4 * LAND_D);
};
/** the frame each column dot comes to rest in its slot (for the header / checks) */
export const LANDED = PATHS.map((P, i) => {
  for (let f = 0; f < F1; f++) if (RAW[i][f - F0] >= P.len + LAND_D) return f;
  return Infinity;
});

// ---------------------------------------------------------------------------
// Every dot at frame f, world coordinates. kind: "garrison" | "ring" |
// "russian" | "japanese". op is its opacity, scale its size factor.
// ---------------------------------------------------------------------------
export type Dot = { id: number; x: number; y: number; orange: boolean; op: number; scale: number; kind: string };

// the garrison fades in a hashed order, one by one
const GARRISON_ORDER = GARRISON.map((_, j) => ({ j, h: hash(j, 41) }))
  .sort((a, b) => a.h - b.h)
  .map((a) => a.j);
const GARRISON_FADE = GARRISON.map((_, j) => T.garrison[0] + GARRISON_ORDER.indexOf(j) * 1.1 + 0.6 * hash(j, 42));
const GARRISON_FADE_LEN = 7;

// the siege jitters a touch more (every dot on its own), the front breathes
const jitterAmp = (f: number) => 1.1 + 0.2 * (1 - smoothstep((f - 56) / 20));

// A band dot never grows past what keeps 1.4 diameters to its neighbours at
// this zoom (spacing BAND_SPACING world px, less 3 px of breathing): full
// size from the landing on, smaller while the bands are far off during the
// run north.
const bandScale = (k: number) => Math.min(1, (BAND_SPACING * k - 3) / 1.4 / dotScreen(k));

export const dotsAt = (f: number, k: number): Dot[] => {
  const out: Dot[] = [];
  const amp = jitterAmp(f);
  const bs = bandScale(k);
  RING_FINAL.forEach((_, i) => {
    const [bx, by] = breathe(200 + i, f, k, amp);
    const [x, y] = f < DEPART[i] ? ringBefore(i, f) : pathAt(PATHS[i], travelled(i, f));
    // once landed it is part of the band and keeps the band's size
    out.push({ id: 200 + i, x: x + bx, y: y + by, orange: true, op: 1, scale: f >= LANDED[i] ? bs : 1, kind: "ring" });
  });
  // the garrison is drawn over the crescent, so each surrender reads
  GARRISON.forEach(([x, y], j) => {
    const u = clamp01((f - GARRISON_FADE[j]) / GARRISON_FADE_LEN);
    const e = smoothstep(u);
    if (e >= 1) return;
    const [bx, by] = breathe(100 + j, f, k, amp);
    out.push({ id: 100 + j, x: x + bx, y: y + by, orange: false, op: 1 - e, scale: 1 - 0.18 * e, kind: "garrison" });
  });
  RUSSIANS.forEach(([x, y], j) => {
    const [bx, by] = breathe(400 + j, f, k);
    out.push({ id: 400 + j, x: x + bx, y: y + by, orange: false, op: 1, scale: bs, kind: "russian" });
  });
  JAPANESE.forEach(([x, y], j) => {
    const [bx, by] = breathe(600 + j, f, k);
    out.push({ id: 600 + j, x: x + bx, y: y + by, orange: true, op: 1, scale: bs, kind: "japanese" });
  });
  return out;
};

export { PA, RAIL_OUT, S_FRONT, K_CLOSE, K_FRONT, RAIL_LEN, T as TIMING };
