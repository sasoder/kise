// RailwaysInEuropeanRussia: every moving thing as pure maths (no React), so the
// raster bake (scripts/bake-european-russia-rasters.mjs) reads the exact same
// camera the component draws with.
//   the coin stream   one snake: every coin rides the same path at the same
//                     speed, COIN_GAP world px behind the one ahead; the path
//                     runs east from Moscow on the south side of the railway,
//                     round a cream balloon-loop spur at Samara, and back west on
//                     the north side (double track, half a coin either side of the
//                     centreline; it slides onto the line once the last coin is round)
//   the orange        laid length = coins consumed so far x METRES_PER_COIN; it
//                     covers the network out to one Moscow distance d(t) on every
//                     line at once (a front on each line), so it stops exactly
//                     when the last coin has shrunk into Moscow
//   the front pen     draws Russia's 1914 border with Germany and Austria-Hungary
//                     north -> south; each frontier line's end lights as it passes
//   the army          dots roll out along the frontier lines in two-abreast
//                     columns and fan out to blue-noise slots behind the front
//   the camera        its own keyed track (monotone cubic per channel, C1)
import {
  ARMY_SLOTS,
  FEEDERS,
  FRONT_LEN,
  FRONT_PTS,
  MOSCOW,
  ORANGE_DMAX,
  ORANGE_EDGES,
  ORANGE_TOTAL,
  ROUTE_PTS,
  type P2,
} from "./erMapData";

export const FPS = 24;
// In-point 45.80 s (edit timeline, the SRT's) = f0. The line ends 56.40 s:
// round(10.60 * 24) = 254, + the 16-frame house tail = 270.
export const DURATION = 270;
export const LAST = DURATION - 1;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// TIMING (frames; verified onsets in the component header)
// ---------------------------------------------------------------------------
export const T = {
  apex: 52, // the head at the far point of the loop ("in, say" f44 .. "doing" f63)
  moscow: 92, // the head reaches Moscow ("expanding" f92)
  euroLabel: 151, // EUROPEAN RUSSIA slides up, full by f160 ("Russia" f158-160)
  pen: [194, 209] as const, // the front drawn north -> south ("really" f196)
  wwiLabel: 229, // WORLD WAR I slides up, full by f238, landed f243 ("I" f245)
  shimmer: 204, // the travelling highlight on the frontier lines, to the last frame
};

// ---------------------------------------------------------------------------
// POLYLINES
// ---------------------------------------------------------------------------
export type Poly = {
  pts: P2[];
  cum: number[];
  len: number;
  at: (s: number) => P2;
  tan: (s: number) => P2;
  sub: (s0: number, s1: number) => P2[];
};
export const makePoly = (pts: P2[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  const seg = (s: number) => {
    const t = Math.max(0, Math.min(len, s));
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= t) lo = mid;
      else hi = mid;
    }
    return { lo, hi, u: (t - cum[lo]) / (cum[hi] - cum[lo] || 1) };
  };
  const at = (s: number): P2 => {
    const { lo, hi, u } = seg(s);
    return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * u, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * u];
  };
  const tan = (s: number): P2 => {
    const a = at(s - 3);
    const b = at(s + 3);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const sub = (s0: number, s1: number): P2[] => {
    const a = seg(s0);
    const b = seg(s1);
    const out: P2[] = [at(s0)];
    for (let i = a.hi; i <= b.lo; i++) out.push(pts[i]);
    out.push(at(s1));
    return out;
  };
  return { pts, cum, len, at, tan, sub };
};

// ---------------------------------------------------------------------------
// MONOTONE CUBIC (pchip) with one-sided end slopes, so a track never starts or
// ends at rest.
// ---------------------------------------------------------------------------
export const pchip = (keys: [number, number][], heldEnds = false) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return heldEnds ? 0 : d[0];
    if (i === n - 1) return heldEnds ? 0 : d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

// ---------------------------------------------------------------------------
// THE COINS
// ---------------------------------------------------------------------------
export const ROUTE = makePoly(ROUTE_PTS as P2[]);
export const COIN_GAP = 15; // world px between coins along the path
export const COIN_ABSORB = 7; // frames a coin takes to shrink into Moscow
/** a coin's on-screen diameter at zoom k, px (16 px at the opening) */
export const coinScreen = (k: number) => 16 * Math.pow(k / 2.4, 0.25);
/** left normal of the eastbound railway at s (north-ish) */
export const routeNormal = (s: number): P2 => {
  const [tx, ty] = ROUTE.tan(s);
  return [ty, -tx];
};

// the snake's speed along its path (world px / frame): a steady eastbound
// flow, an eased slow-down into the loop, a long acceleration west, an eased
// arrival at Moscow, then the stream picks up again as the network it feeds
// branches out (so the orange fronts never burst out of Moscow and never stall)
const V_KEYS: [number, number][] = [
  [-80, 5.2],
  [0, 5.3],
  [26, 5.6],
  [42, 3.4],
  [52, 2.5],
  [58, 4.2],
  [66, 12.5],
  [74, 23],
  [82, 25.5],
  [88, 17],
  [92, 10.5],
  [100, 9.8],
  [110, 11.5],
  [120, 14],
  [130, 16],
  [140, 17.5],
  [150, 18],
  [330, 18],
];
const vOf = pchip(V_KEYS, true);
export const coinSpeed = (f: number) => vOf(f);
const DT = 0.05;
const F_MIN = -80;
const F_MAX = 330;
const I_TAB = (() => {
  const n = Math.round((F_MAX - F_MIN) / DT) + 1;
  const out = new Float64Array(n);
  for (let i = 1; i < n; i++) out[i] = out[i - 1] + vOf(F_MIN + (i - 0.5) * DT) * DT;
  return out;
})();
const I0 = (f: number) => {
  const x = (Math.max(F_MIN, Math.min(F_MAX, f)) - F_MIN) / DT;
  const i = Math.min(I_TAB.length - 2, Math.floor(x));
  return I_TAB[i] + (I_TAB[i + 1] - I_TAB[i]) * (x - i);
};
const I = (a: number, b: number) => I0(b) - I0(a);
const I0inv = (v: number) => {
  let lo = 0;
  let hi = I_TAB.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (I_TAB[mid] <= v) lo = mid;
    else hi = mid;
  }
  return F_MIN + (lo + (v - I_TAB[lo]) / (I_TAB[hi] - I_TAB[lo] || 1)) * DT;
};

// centripetal Catmull-Rom through pts, with phantom end points
const catmullRom = (pts: P2[], perSeg: number, ghostA: P2, ghostB: P2): P2[] => {
  const ext = [ghostA, ...pts, ghostB];
  const out: P2[] = [pts[0]];
  const knot = (p: P2, q: P2) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let s = 1; s <= perSeg; s++) {
      const t = t1 + ((t2 - t1) * s) / perSeg;
      const lerp = (A: P2, B: P2, ta: number, tb: number): P2 => [
        ((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0],
        ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1],
      ];
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

// THE BALLOON LOOP. Coins run on the main line double-track fashion: outbound
// (east) on the south side, returning (west) on the north side, each file half
// a coin width either side of the centreline (the offset follows the coin's
// size as the camera zooms, so the files always just clear each other). At the
// turn a cream spur, the idle railway symbol, branches off the north side: a
// symmetric teardrop bulb (radius BULB_R, 2.5 coin spacings wide) on two legs.
// Outbound coins leave the south file, cross the main line on the east leg,
// round the bulb (the head's slowest point, T.apex, is its crown), come down
// the west leg and join the north file heading west. The west leg never meets
// the south file and the east leg crosses the north side only east of where
// returning coins join it, so the two files never touch.
const BULB_R = 18.75; // world px: the bulb is 2.5 coin spacings wide
const LEG_W = 13.5; // world px: each leg's distance from the loop's axis
const FILLET = 9; // world px: the legs' quarter-turn onto the main line
const H_LOOP = 3.8; // world px: the file offset at the turn's zoom (~2.3)
/** half a coin width (+8 %) in world px at frame f: each file's offset from the centreline */
const fileOffset = (f: number) => {
  const k = kAt(f);
  return (1.08 * coinScreen(k)) / 2 / k;
};
const BULB_CY = H_LOOP + FILLET + BULB_R * 0.95;
// local frame (a along the line, eastward; n its left normal, north)
const loopLocal = (() => {
  const w = LEG_W;
  const R = BULB_R;
  const c45 = Math.SQRT1_2;
  const pts: P2[] = [
    [w - FILLET + FILLET * c45, -H_LOOP + FILLET * (1 - c45)],
    [w, -H_LOOP + FILLET],
    [w + 0.3 * (R - w), BULB_CY - 0.75 * R],
    [R * 0.94, BULB_CY - 0.35 * R],
  ];
  for (let th = -5; th <= 185; th += 15) {
    const r = (th * Math.PI) / 180;
    pts.push([R * Math.cos(r), BULB_CY + R * Math.sin(r)]);
  }
  pts.push(
    [-R * 0.94, BULB_CY - 0.35 * R],
    [-w - 0.3 * (R - w), BULB_CY - 0.75 * R],
    [-w, H_LOOP + FILLET],
    [-w - FILLET + FILLET * c45, H_LOOP + FILLET * (1 - c45)],
  );
  return pts;
})();
/** route arclength of the turn (the loop's axis) */
let S_TURN_ = 0;
const S_E = () => S_TURN_ + LEG_W - FILLET; // where the outbound file leaves the line
const S_W = () => S_TURN_ - LEG_W - FILLET; // where the returning file joins it
const laneAt = (s: number, side: number, off: number): P2 => {
  const q = ROUTE.at(s);
  const n = routeNormal(s);
  return [q[0] + n[0] * off * side, q[1] + n[1] * off * side];
};
const buildLoop = (sTurn: number) => {
  const o = ROUTE.at(sTurn);
  const a = ROUTE.tan(sTurn);
  const nrm = routeNormal(sTurn);
  const toW = ([u, v]: P2): P2 => [o[0] + a[0] * u + nrm[0] * v, o[1] + a[1] * u + nrm[1] * v];
  const sE = sTurn + LEG_W - FILLET;
  const sW = sTurn - LEG_W - FILLET;
  const pts = [laneAt(sE, -1, H_LOOP), ...loopLocal.map(toW), laneAt(sW, 1, H_LOOP)];
  return { pts, ghostA: laneAt(sE - 12, -1, H_LOOP), ghostB: laneAt(sW - 12, 1, H_LOOP), toW };
};
// the loop's length is independent of where it sits: solve the turn point so
// the head is at the crown on T.apex and at Moscow on T.moscow
const LOOP_LEN_0 = (() => {
  const L = buildLoop(560);
  return makePoly(catmullRom(L.pts, 10, L.ghostA, L.ghostB)).len;
})();
// head at crown -> Moscow: half the loop, then the north file from S_W to 0
export const S_TURN = I(T.apex, T.moscow) - LOOP_LEN_0 / 2 + LEG_W + FILLET;
S_TURN_ = S_TURN;
const P_A_END = S_E();
export const LOOP = (() => {
  const L = buildLoop(S_TURN);
  return makePoly(catmullRom(L.pts, 10, L.ghostA, L.ghostB));
})();
/** the drawn spur: the same bulb, its feet run into the main line's centreline */
export const SPUR = (() => {
  const L = buildLoop(S_TURN);
  const c = (s: number) => ROUTE.at(s);
  // the feet leave / rejoin the centreline tangentially, one fillet length out
  const inner = loopLocal.map(L.toW);
  const pts = [c(S_E() - 12), ...inner, c(S_W() - 12)];
  return makePoly(catmullRom(pts, 10, c(S_E() - 30), c(S_W() - 30)));
})();
const P_B0 = P_A_END + LOOP.len;
export const P_END = P_B0 + S_W(); // the path's end: Moscow
export const P_HEAD0 = P_A_END + LOOP.len / 2 - I(0, T.apex);
/** the head's path position at frame f */
export const headP = (f: number) => P_HEAD0 + I(0, f);
/** frame the head reaches the spur's east foot: the spur is drawn in just before */
export const F_HEAD_AT_SPUR = I0inv(I0(0) + (P_A_END - P_HEAD0));
// The stream is as long as the arrivals it has to feed: its tail reaches
// Moscow on TAIL_ARRIVE, so the last coin is consumed ~7 frames later.
const TAIL_ARRIVE = 146;
export const N_COINS = 1 + Math.round(I(T.moscow, TAIL_ARRIVE) / COIN_GAP);
/** frame coin i reaches Moscow */
export const COIN_ARRIVE = Array.from({ length: N_COINS }, (_, i) => I0inv(I0(T.moscow) + i * COIN_GAP));
/** frame the tail leaves the loop: after it, the returning file slides onto the line */
export const F_TAIL_OUT_OF_LOOP = I0inv(I0(0) + (P_B0 + (N_COINS - 1) * COIN_GAP - P_HEAD0));
const SLIDE = [Math.ceil(F_TAIL_OUT_OF_LOOP) + 2, Math.ceil(F_TAIL_OUT_OF_LOOP) + 18] as const;

/** a point on the snake's path at path position p, at frame f */
export const pathAt = (p: number, f: number): P2 => {
  const off = fileOffset(f);
  if (p <= P_A_END) {
    // the south file; its offset eases onto the loop's own near the spur
    const s = Math.max(0, p);
    const o = H_LOOP + (off - H_LOOP) * smoothstep((P_A_END - s) / 60);
    return laneAt(s, -1, o);
  }
  if (p <= P_B0) return LOOP.at(p - P_A_END);
  const s = Math.max(0, S_W() - (p - P_B0));
  const o = H_LOOP + (off - H_LOOP) * smoothstep((S_W() - s) / 60);
  const slide = smoothstep((f - SLIDE[0]) / (SLIDE[1] - SLIDE[0])) * smoothstep((S_W() - s) / 80);
  // arriving at Moscow the coin is on the line whatever the slide
  const w = (1 - slide) * smoothstep(s / 14);
  return laneAt(s, 1, o * w);
};

export type Coin = { i: number; x: number; y: number; scale: number };
/** the coins in play at frame f: position and absorb scale (1 riding, -> 0 into Moscow) */
export const coinsAt = (f: number): Coin[] => {
  const out: Coin[] = [];
  const P = headP(f);
  for (let i = 0; i < N_COINS; i++) {
    const p = P - i * COIN_GAP;
    if (p < 0) continue;
    let scale = 1;
    let pp = p;
    if (p >= P_END) {
      const a = smoothstep((f - COIN_ARRIVE[i]) / COIN_ABSORB);
      if (a >= 1) continue;
      scale = 1 - a;
      pp = P_END;
    }
    const [x, y] = pathAt(pp, f);
    out.push({ i, x, y, scale });
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE ORANGE: laid length = coins consumed x METRES_PER_COIN (world px per coin)
// ---------------------------------------------------------------------------
export const PX_PER_COIN = ORANGE_TOTAL / N_COINS;
export const consumedAt = (f: number) => {
  let a = 0;
  for (let i = 0; i < N_COINS; i++) a += smoothstep((f - COIN_ARRIVE[i]) / COIN_ABSORB);
  return a;
};
const coveredLen = (d: number) => {
  let c = 0;
  for (const e of ORANGE_EDGES) c += Math.min(e.len, Math.max(0, d - e.da) + Math.max(0, d - e.db));
  return c;
};
const D_STEP = 0.25;
const C_TAB = (() => {
  const n = Math.ceil(ORANGE_DMAX / D_STEP) + 2;
  return Float64Array.from({ length: n }, (_, i) => coveredLen(i * D_STEP));
})();
/** the Moscow distance the orange has reached when `laid` world px are laid */
export const reachFor = (laid: number) => {
  if (laid <= 0) return 0;
  if (laid >= C_TAB[C_TAB.length - 1]) return ORANGE_DMAX + 1;
  let lo = 0;
  let hi = C_TAB.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (C_TAB[mid] <= laid) lo = mid;
    else hi = mid;
  }
  return (lo + (laid - C_TAB[lo]) / (C_TAB[hi] - C_TAB[lo] || 1)) * D_STEP;
};
export const reachAt = (f: number) => reachFor(consumedAt(f) * PX_PER_COIN);
/** the orange length actually drawn at reach d (== laid, by construction) */
export const coveredAt = (d: number) => coveredLen(d);
/** covered intervals of an edge at reach d, in its own arclength (a -> b) */
export const edgeCover = (e: (typeof ORANGE_EDGES)[number], d: number): [number, number][] => {
  const ca = Math.max(0, Math.min(e.len, d - e.da));
  const cb = Math.max(0, Math.min(e.len, d - e.db));
  if (ca + cb >= e.len) return [[0, e.len]];
  const out: [number, number][] = [];
  if (ca > 0.01) out.push([0, ca]);
  if (cb > 0.01) out.push([e.len - cb, e.len]);
  return out;
};
export const EDGE_POLYS = ORANGE_EDGES.map((e) => makePoly(e.pts as P2[]));

// ---------------------------------------------------------------------------
// THE FRONT: a pen north -> south; each frontier line's end lights as it passes
// ---------------------------------------------------------------------------
export const FRONT = makePoly(FRONT_PTS as P2[]);
export const penS = (f: number) => FRONT_LEN * smoothstep((f - T.pen[0]) / (T.pen[1] - T.pen[0]));
export const FEEDER_POLYS = FEEDERS.map((fd) => makePoly(fd.pts as P2[]));
export const LIGHT_AT = FEEDERS.map((fd) => {
  for (let f = T.pen[0]; f <= T.pen[1] + 1; f += 0.05) if (penS(f) >= fd.frontS) return f;
  return T.pen[1];
});

// ---------------------------------------------------------------------------
// THE ARMY: the house dot-army (reuniteMotion.ts). Its slots are one even
// blue-noise band behind the front (erMapData ARMY_SLOTS: 1.3 x dot spacing,
// 5 hex rows deep swelling to 6.6 where a frontier line meets the front, a
// clear gap before the line). Each dot arrives by riding the orange line
// nearest its slot: the dots bound for one line form one column two abreast on
// it, ordered so the one going farthest along leads, roll up the line (the
// orange grew outward, so they ride in the same direction) and each peels off
// at the point of the line nearest its slot, easing into it (cubic Hermite:
// leaves at the column's speed, arrives at rest). A column never overtakes
// itself. Settled, each dot keeps its own drift.
// ---------------------------------------------------------------------------
export const ARMY_ROW = 7.2; // world px between rows of a column
export const ARMY_HALF = 3.6; // world px either side of the line
const ARMY_RIDE = 46; // world px the column's head rides before its first peel
const ARMY_VMAX = 15.5; // world px / frame
const ARMY_ACC = 6; // frames to reach it
const ARMY_START = 199; // columns start rolling as the pen reaches the first frontier ends (f197-206)
const shiftTab = (() => {
  const n = 1200;
  const out = new Float64Array(n + 1);
  for (let i = 1; i <= n; i++) out[i] = out[i - 1] + (0.8 + (ARMY_VMAX - 0.8) * smoothstep(((i - 0.5) * 0.1) / ARMY_ACC)) * 0.1;
  return out;
})();
const colShift = (tau: number) => {
  if (tau <= 0) return 0.8 * tau;
  const x = tau / 0.1;
  const i = Math.min(shiftTab.length - 2, Math.floor(x));
  return shiftTab[i] + (shiftTab[i + 1] - shiftTab[i]) * (x - i);
};
const colShiftInv = (q: number) => {
  let lo = 0;
  let hi = shiftTab.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (shiftTab[mid] <= q) lo = mid;
    else hi = mid;
  }
  return (lo + (q - shiftTab[lo]) / (shiftTab[hi] - shiftTab[lo] || 1)) * 0.1;
};
const colSpeed = (tau: number) => 0.8 + (ARMY_VMAX - 0.8) * smoothstep(tau / ARMY_ACC);
export type Soldier = {
  path: number; // index into ARMY_PATHS
  side: number;
  q0: number; // start arclength on the path
  qPeel: number; // where it leaves the line
  tDep: number; // the column starts rolling
  tApp: number; // appears on the line
  tExit: number; // leaves the line
  tArr: number; // reaches its slot
  slot: P2;
  seed: number;
};
// Each orange edge as a ride: the edge in the direction the orange grew,
// preceded by the network path back toward Moscow (so a column has line to
// stand on behind its first peel point).
const nodeDist = new Map<string, number>();
ORANGE_EDGES.forEach((e) => {
  nodeDist.set(e.a, e.da);
  nodeDist.set(e.b, e.db);
});
const predEdge = (node: string) => {
  const d = nodeDist.get(node) ?? 0;
  if (d <= 0.01) return -1;
  return ORANGE_EDGES.findIndex(
    (e) => (e.b === node && Math.abs(e.da + e.len - d) < 0.05) || (e.a === node && Math.abs(e.db + e.len - d) < 0.05),
  );
};
const rideOf = (ei: number) => {
  const e = ORANGE_EDGES[ei];
  const fwd = e.da <= e.db;
  const own = (fwd ? e.pts : [...e.pts].reverse()) as P2[];
  let node = fwd ? e.a : e.b;
  let back: P2[] = [];
  let backLen = 0;
  while (backLen < 320) {
    const pi = predEdge(node);
    if (pi < 0) break;
    const pe = ORANGE_EDGES[pi];
    const seg = (pe.b === node ? pe.pts : [...pe.pts].reverse()) as P2[];
    back = [...seg.slice(0, -1), ...back];
    backLen += pe.len;
    node = pe.b === node ? pe.a : pe.b;
  }
  const pts = back.length ? [...back, ...own] : own;
  return { poly: makePoly(pts), offset: makePoly(pts).len - makePoly(own).len };
};
const nearestOn = (poly: Poly, x: number, y: number) => {
  let best = { d: Infinity, q: 0 };
  for (let i = 1; i < poly.pts.length; i++) {
    const [ax, ay] = poly.pts[i - 1];
    const [bx, by] = poly.pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const d = Math.hypot(x - ax - t * dx, y - ay - t * dy);
    if (d < best.d) best = { d, q: poly.cum[i - 1] + t * Math.sqrt(l2) };
  }
  return best;
};
export const ARMY_PATHS: Poly[] = [];
export const SOLDIERS: Soldier[] = (() => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of ARMY_SLOTS) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const cand = ORANGE_EDGES.map((e, i) => ({ e, i })).filter(({ e }) =>
    e.pts.some(([x, y]) => x > x0 - 150 && x < x1 + 150 && y > y0 - 150 && y < y1 + 150),
  );
  const own = new Map(cand.map(({ e, i }) => [i, makePoly((e.da <= e.db ? e.pts : [...e.pts].reverse()) as P2[])]));
  const groups = new Map<number, { sid: number; q: number }[]>();
  ARMY_SLOTS.forEach(([x, y], sid) => {
    let best = { d: Infinity, q: 0, ei: -1 };
    for (const { i } of cand) {
      const r = nearestOn(own.get(i)!, x, y);
      if (r.d < best.d) best = { ...r, ei: i };
    }
    if (!groups.has(best.ei)) groups.set(best.ei, []);
    groups.get(best.ei)!.push({ sid, q: best.q });
  });
  const out: Soldier[] = [];
  [...groups.entries()].forEach(([ei, members], gi) => {
    const ride = rideOf(ei);
    const pathIdx = ARMY_PATHS.length;
    ARMY_PATHS.push(ride.poly);
    const sorted = [...members].sort((a, b) => b.q - a.q);
    const qHead = ride.offset + sorted[0].q;
    const tDep = ARMY_START + 3 * hash(gi, 5);
    sorted.forEach((m, j) => {
      const row = j >> 1;
      const side = j % 2 === 0 ? -1 : 1;
      const q0 = Math.max(0, qHead - ARMY_RIDE - row * ARMY_ROW - (side > 0 ? ARMY_ROW / 2 : 0));
      const qPeel = Math.max(q0 + 4, ride.offset + m.q);
      const tExit = tDep + colShiftInv(qPeel - q0);
      const slot: P2 = [ARMY_SLOTS[m.sid][0], ARMY_SLOTS[m.sid][1]];
      const pe = ride.poly.at(qPeel);
      const dist = Math.hypot(slot[0] - pe[0], slot[1] - pe[1]);
      const H = Math.max(5.5, Math.min(10, dist / 6));
      out.push({
        path: pathIdx,
        side,
        q0,
        qPeel,
        tDep,
        tApp: tDep - 7 + 3 * hash(m.sid, 3),
        tExit,
        tArr: tExit + H,
        slot,
        seed: m.sid,
      });
    });
  });
  return out;
})();
export const ARMY_DONE = Math.max(...SOLDIERS.map((s) => s.tArr));
/** a soldier's world position and visibility (0..1) at frame f, zoom k */
export const soldierAt = (sd: Soldier, f: number, k: number) => {
  const vis = smoothstep((f - sd.tApp) / 5);
  if (vis <= 0) return null;
  const poly = ARMY_PATHS[sd.path];
  const lat = (q: number) => {
    const t = poly.tan(q);
    return [t[1] * ARMY_HALF * sd.side, -t[0] * ARMY_HALF * sd.side];
  };
  const drift = (1.1 / k) * Math.min(1, Math.max(0, (f - sd.tApp) / 6));
  const dx = drift * Math.sin(f * (0.045 + 0.04 * hash(sd.seed, 11)) + 6.283 * hash(sd.seed, 13));
  const dy = drift * Math.sin(f * (0.04 + 0.045 * hash(sd.seed, 12)) + 6.283 * hash(sd.seed, 14));
  if (f <= sd.tExit) {
    const q = sd.q0 + colShift(f - sd.tDep);
    const p = poly.at(q);
    const l = lat(q);
    return { x: p[0] + l[0] + dx, y: p[1] + l[1] + dy, vis };
  }
  const p0 = poly.at(sd.qPeel);
  const l0 = lat(sd.qPeel);
  const x0 = p0[0] + l0[0];
  const y0 = p0[1] + l0[1];
  const H = sd.tArr - sd.tExit;
  const u = Math.min(1, (f - sd.tExit) / H);
  const t = poly.tan(sd.qPeel);
  const v = colSpeed(sd.tExit - sd.tDep) * H;
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  return {
    x: h00 * x0 + h10 * v * t[0] + h01 * sd.slot[0] + dx,
    y: h00 * y0 + h10 * v * t[1] + h01 * sd.slot[1] + dy,
    vis,
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA: its own keyed track. Keys put a subject at a screen point at a
// zoom; cx, cy and ln k each run through a monotone cubic (C1), so every move
// eases in and out of its keys and nothing chases anything. Sway is added in
// the component.
//   f0    k 2.60  the stream's head at screen (600, 835), Penza..Samara in frame
//   f26   k 2.62  drifting east with it (head ~(700, 835))
//   f52   k 2.45  the loop's far point at (790, 835): the camera turns here
//   f72   k 1.90  travelling west, pulling back (zoom key only): the stream
//                 overtakes the camera toward Moscow on the left
//   f92   k 1.40  Moscow at (300, 760) as the head arrives
//   f122  k 1.10  pulling back with the orange
//   f152  k 1.00  THE EUROPEAN RUSSIA WIDE (world == screen), creeping on
//   f168  k 1.02
//   f202  k 1.73  the front centred on x 540, y 690 (one long glide west)
//   f269  k 1.78  the creep
// ---------------------------------------------------------------------------
export const CAM_LIFT = 125;
const FRONT_BOX = (() => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [x, y] of FRONT_PTS) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
})();
export const K_FRONT = 1.73;
// zoom keys (ln k through its own monotone cubic)
const K_KEYS: [number, number][] = [
  [0, 2.4],
  [26, 2.42],
  [52, 2.3],
  [72, 1.9],
  [92, 1.4],
  [122, 1.1],
  [152, 1.0],
  [168, 1.02],
  [202, K_FRONT],
  [LAST, K_FRONT * 1.03],
];
const LK = pchip(K_KEYS.map(([f, k]) => [f, Math.log(k)] as [number, number]));
const kAt = (f: number) => Math.exp(LK(f));
// position keys: a world point W on screen point S at that frame's zoom
type Key = { f: number; wx: number; wy: number; sx: number; sy: number };
const headAt = (f: number) => pathAt(headP(f), f);
const loopFar = LOOP.at(LOOP.len / 2);
const KEYS: Key[] = (() => {
  const h0 = headAt(0);
  const h26 = headAt(26);
  return [
    { f: 0, wx: h0[0], wy: h0[1], sx: 560, sy: 835 },
    { f: 26, wx: h26[0], wy: h26[1], sx: 700, sy: 835 },
    { f: 52, wx: loopFar[0], wy: loopFar[1], sx: 790, sy: 835 },
    { f: 92, wx: MOSCOW.x, wy: MOSCOW.y, sx: 300, sy: 760 },
    { f: 122, wx: MOSCOW.x, wy: MOSCOW.y, sx: 560, sy: 680 },
    { f: 152, wx: 540, wy: 960, sx: 540, sy: 960 },
    { f: 168, wx: 520, wy: 950, sx: 540, sy: 960 },
    { f: 202, wx: FRONT_BOX.cx, wy: FRONT_BOX.cy, sx: 540, sy: 690 },
    { f: LAST, wx: FRONT_BOX.cx - 7, wy: FRONT_BOX.cy + 4, sx: 540, sy: 690 },
  ];
})();
const CK = KEYS.map((q) => ({ f: q.f, cx: q.wx - (q.sx - 540) / kAt(q.f), cy: q.wy - (q.sy - 960) / kAt(q.f) }));
const CX = pchip(CK.map((q) => [q.f, q.cx] as [number, number]));
const CY = pchip(CK.map((q) => [q.f, q.cy] as [number, number]));
export type Cam = { k: number; cx: number; cy: number };
export const camAt = (f: number): Cam => ({ k: kAt(f), cx: CX(f), cy: CY(f) });
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));
export { FRONT_BOX };

// ---------------------------------------------------------------------------
// THE RASTER LOD PYRAMID. Level blend is a function of k (and, for the two
// close levels, of the frame range they serve: the east one the opening, the
// west one the front), so a level fades across a band of k and never pops.
//   kBake: the zoom its screen-constant strokes are baked for
//   s: texels per world px (>= the largest k it serves)
// ---------------------------------------------------------------------------
export const LEVEL_DEF = [
  { name: "wide", kBake: 1.15, s: 1.5, band: null as null | readonly [number, number], frames: [0, DURATION] as const },
  { name: "east", kBake: 2.15, s: 2.75, band: [1.5, 1.8] as const, frames: [0, 130] as const },
  { name: "west", kBake: 1.7, s: 1.95, band: [1.3, 1.5] as const, frames: [150, DURATION] as const },
];
export const levelOps = (k: number, f: number) =>
  LEVEL_DEF.map((L) => {
    if (f < L.frames[0] || f > L.frames[1]) return 0;
    return L.band ? smoothstep(Math.log(k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1;
  });
/** a level is drawn while it shows: opacity > 0 and no opaque level above it */
export const levelDrawn = (ops: number[], i: number) => ops[i] > 0.001 && !ops.some((o, j) => j > i && o >= 0.999);
