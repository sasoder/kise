// TroopsOutOfAsia: the journey (one trajectory every soldier replays), the
// authored camera track and the raster LOD blend. Pure maths, no React, so the
// raster bake (scripts/bake-transsib-rasters.mjs) reads the exact same camera.
import { HARBIN, MOSCOW, ROUTE_PTS, STATION_S, URALS_CROSS_S } from "./transsibMapData";

export const FPS = 24;
// In-point 50.42 s = f0. Last word "Russia" ends 55.44 s:
// round(5.02 * 24) = 120, + the 16-frame house tail = 136.
export const DURATION = 136;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

// ---------------------------------------------------------------------------
// The route as a polyline with arclength.
// ---------------------------------------------------------------------------
type P2 = [number, number];
const R = ROUTE_PTS as P2[];
const RC = (() => {
  const c = [0];
  for (let i = 1; i < R.length; i++) c.push(c[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]));
  return c;
})();
export const ROUTE_LEN = RC[RC.length - 1];
const seg = (s: number) => {
  const t = Math.max(0, Math.min(ROUTE_LEN, s));
  let lo = 0;
  let hi = RC.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (RC[mid] <= t) lo = mid;
    else hi = mid;
  }
  return { lo, hi, u: (t - RC[lo]) / (RC[hi] - RC[lo] || 1) };
};
export const routeAt = (s: number) => {
  const { lo, hi, u } = seg(s);
  return { x: R[lo][0] + (R[hi][0] - R[lo][0]) * u, y: R[lo][1] + (R[hi][1] - R[lo][1]) * u };
};
/** unit normal (left of travel) at s, from a +-3 px chord so it never flips on a kink */
export const routeNormal = (s: number) => {
  const a = routeAt(s - 3);
  const b = routeAt(s + 3);
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: -(b.y - a.y) / l, y: (b.x - a.x) / l };
};
/** The route split at s: [0, s] and [s, end], as polylines. */
export const routeSplit = (s: number) => {
  const { lo, hi, u } = seg(s);
  const p: P2 = [R[lo][0] + (R[hi][0] - R[lo][0]) * u, R[lo][1] + (R[hi][1] - R[lo][1]) * u];
  return { before: [...R.slice(0, lo + 1), p], after: [p, ...R.slice(hi)] };
};

// ---------------------------------------------------------------------------
// The journey. The column moves as ONE: every soldier on the line rides the
// same path parameter at the same speed V(f), like carriages of one train, so
// the spacing between two soldiers is fixed the moment the second one steps on
// (departure interval x the speed then) and never changes on the way. D(tau)
// is the distance the column has run tau frames after the head stepped onto
// the line at the crowd's west edge (s0, at T.depart); soldier i, who steps on
// at t_i, is at s0 + D(f - depart) - D(t_i - depart). The head crosses the
// Urals at T.urals and reaches Moscow at T.moscow. Speed starts at a walk
// (never 0, so the file at the station has gaps) and builds through Manchuria,
// so the camera's pull-back roughly cancels it on screen.
// ---------------------------------------------------------------------------
export const T = {
  depart: 22, // "to transport": the head steps onto the line
  urals: 95, // "European": the head crosses the Urals
  moscow: 112, // the head reaches Moscow
  asia: 65, // ASIA slides up (full by 73, "Asia")
  europe: 96, // EUROPEAN RUSSIA slides up (full by 105, "Russia")
  boundary: [93, 110] as const, // the boundary brightens out of the crossing
  shimmer: [100, 136] as const, // the tail's travelling highlight
};
export const S0 = 26; // the join point: the crowd's west edge, world px from Harbin
export const TAU_ARRIVE = T.moscow - T.depart; // 90
const TAU_URALS = T.urals - T.depart; // 73
const DT = 0.05;
const shapeV = (tau: number) => 0.35 + 0.65 * smoothstep(tau / 46);
// D(tau) = a * integral(shapeV * (1 + b tau / 90)); a, b solved so that
// D(73) hits the Urals crossing and D(90) hits Moscow.
const integ = (tauEnd: number, withB: boolean) => {
  let acc = 0;
  for (let t = 0; t < tauEnd; t += DT) {
    const m = t + DT / 2;
    acc += shapeV(m) * (withB ? m / 90 : 1) * DT;
  }
  return acc;
};
const DU = URALS_CROSS_S - S0;
const DM = ROUTE_LEN - S0;
const [G0u, G1u, G0m, G1m] = [integ(TAU_URALS, false), integ(TAU_URALS, true), integ(TAU_ARRIVE, false), integ(TAU_ARRIVE, true)];
// a (G0u + b G1u) = DU ; a (G0m + b G1m) = DM
const B_ACC = (DM * G0u - DU * G0m) / (DU * G1m - DM * G1u);
const A_SPEED = DU / (G0u + B_ACC * G1u);
const D_TABLE = (() => {
  const n = Math.ceil((TAU_ARRIVE + 80) / DT) + 1;
  const out = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const m = (i - 0.5) * DT;
    out[i] = out[i - 1] + A_SPEED * shapeV(m) * (1 + (B_ACC * m) / 90) * DT;
  }
  return out;
})();
export const journeyD = (tau: number) => {
  if (tau <= 0) return A_SPEED * shapeV(0) * tau; // extrapolated back along the line
  const x = tau / DT;
  const i = Math.min(D_TABLE.length - 2, Math.floor(x));
  return D_TABLE[i] + (D_TABLE[i + 1] - D_TABLE[i]) * (x - i);
};
export const JOURNEY = { a: A_SPEED, b: B_ACC, v0: A_SPEED * shapeV(0) };
/** the column's speed tau frames after the head stepped on, world px / frame */
export const journeyV = (tau: number) => A_SPEED * shapeV(Math.max(0, tau)) * (1 + (B_ACC * Math.max(0, tau)) / 90);
/** the tau at which the column has run d (inverse of journeyD, d >= 0) */
export const journeyInv = (d: number) => {
  let lo = 0;
  let hi = D_TABLE.length - 1;
  if (d >= D_TABLE[hi]) return hi * DT;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (D_TABLE[mid] <= d) lo = mid;
    else hi = mid;
  }
  return (lo + (d - D_TABLE[lo]) / (D_TABLE[hi] - D_TABLE[lo] || 1)) * DT;
};

/** the column head's arclength at frame f */
export const headS = (f: number) => (f < T.depart ? S0 : Math.min(ROUTE_LEN, S0 + journeyD(f - T.depart)));

// ---------------------------------------------------------------------------
// The camera: its own keyed track, C1 by construction (every term is a smooth
// function of f; no spring, no feedback, nothing chases).
//   ZOOM   ln k through monotone-cubic keys: 4.5 (f0) -> 4.55 (f18, a 1 %
//          creep on the crowd) -> 2.2 (f51) -> 1.4 (f73) -> the wide, 0.94
//          (f98); then a 3 % creep-in over the tail.
//   CENTRE follows a heavily smoothed copy of the route at the head's arclength
//          (the crowd at Harbin until f12, then an anticipating ease that meets
//          the head as it steps onto the line at f22), holding the head ~80
//          screen px right of centre on y 835. x is released into the wide with
//          a softplus (monotonic: the camera never travels back east); y blends
//          f56 -> f96. The wide puts Moscow on x 150, Harbin on x 1020 and the
//          route's middle on y 800.
// ---------------------------------------------------------------------------
export const CAM_LIFT = 125;
export const K_OPEN = 4.5;
export const HEAD_DX = 80; // screen px right of centre
const CAM_LEAD = 12;
const CREEP_TAIL = [98, 136] as const;
// THE FINAL WIDE: Moscow on screen x 150, Harbin on x 1020, the route's middle
// (world y 800) on screen y 800.
export const K_WIDE = (1020 - 150) / (HARBIN.x - MOSCOW.x);
export const CX_WIDE = MOSCOW.x + (540 - 150) / K_WIDE;
export const CY_WIDE = 800 + (960 - 800) / K_WIDE;
// ZOOM KEYS (ln k through a monotone cubic, so C1 with no overshoot): a 1 %
// creep-in on the crowd, then one pull-back that keeps context in frame.
const K_KEYS: [number, number][] = [
  [0, K_OPEN],
  [18, K_OPEN * 1.01],
  [51, 2.2],
  [73, 1.4],
  [98, K_WIDE],
];
const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0 || i === n - 1) return 0; // held ends
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
    );
  };
};
const LNK = pchip(K_KEYS.map(([f, k]) => [f, Math.log(k)] as [number, number]));
// The follow's framing uses the same keys without the creep (monotonic), so
// the creep zooms about the crowd and never nudges the camera east.
const LNK_FOLLOW = pchip(K_KEYS.map(([f, k], i) => [f, Math.log(i === 1 ? K_OPEN : k)] as [number, number]));
// THE HANDOVER, x: the camera follows the head west and eases to a stop on the
// wide's centre with a softplus, cx = CX_WIDE + tau ln(1 + e^((follow - CX_WIDE) / tau)).
// The follow only ever moves west, and softplus is monotonic, so the camera
// only ever moves west (or holds) and settles on CX_WIDE without overshoot.
const RELEASE_TAU = 55; // world px: ~15 frames of deceleration at the head's speed
const softplus = (u: number) => (u > 30 ? u : Math.log1p(Math.exp(u)));
// y: a plain smootherstep blend (the monotonic rule is for x)
const BLEND_Y = [56, 96] as const;
// the camera's copy of the route: a +-60 px arclength box filter, twice
const PAD = 200; // the route is extended straight past both ends so the filter never clamps
const extAt = (s: number) => {
  if (s >= 0 && s <= ROUTE_LEN) return routeAt(s);
  const e = s < 0 ? 0 : ROUTE_LEN;
  const p = routeAt(e);
  const q = routeAt(s < 0 ? 6 : ROUTE_LEN - 6);
  const l = Math.hypot(p.x - q.x, p.y - q.y) || 1;
  const d = s < 0 ? -s : s - ROUTE_LEN;
  return { x: p.x + ((p.x - q.x) / l) * d, y: p.y + ((p.y - q.y) / l) * d };
};
const SMOOTH = (() => {
  const step = 2;
  const n = Math.floor((ROUTE_LEN + 2 * PAD) / step) + 1;
  let pts = Array.from({ length: n }, (_, i) => extAt(i * step - PAD));
  for (let pass = 0; pass < 2; pass++) {
    const w = Math.round(60 / step);
    pts = pts.map((_, i) => {
      let x = 0;
      let y = 0;
      let c = 0;
      for (let j = i - w; j <= i + w; j++) {
        const q = pts[Math.max(0, Math.min(n - 1, j))];
        x += q.x;
        y += q.y;
        c++;
      }
      return { x: x / c, y: y / c };
    });
  }
  return { step, pts };
})();
const smoothAt = (s: number) => {
  const x = (Math.max(-PAD, Math.min(ROUTE_LEN + PAD, s)) + PAD) / SMOOTH.step;
  const i = Math.min(SMOOTH.pts.length - 2, Math.floor(x));
  const u = x - i;
  const a = SMOOTH.pts[i];
  const b = SMOOTH.pts[i + 1];
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
};
export const camAt = (f: number) => {
  const ut = clamp01((f - CREEP_TAIL[0]) / (CREEP_TAIL[1] - CREEP_TAIL[0]));
  const creepOut = Math.log(1.03) * ut * ut * (1.5 - 0.5 * ut); // eases in, still moving at the end
  const k = Math.exp(LNK(f) + creepOut);
  // The camera's subject: the crowd at Harbin until f12, then an anticipating
  // ease (quadratic, f12 -> f22) that meets the head exactly as it steps onto
  // the line, with the head's own speed; from f22 it IS the head. C1.
  const v0 = JOURNEY.v0;
  const sc =
    f <= CAM_LEAD
      ? S0 - v0 * ((T.depart - CAM_LEAD) / 2)
      : f < T.depart
        ? S0 - v0 * ((T.depart - CAM_LEAD) / 2) + (v0 * (f - CAM_LEAD) ** 2) / (2 * (T.depart - CAM_LEAD))
        : headS(f);
  const h = smoothAt(sc);
  const dx = 50 + (HEAD_DX - 50) * smoothstep((f - T.depart) / 28);
  const kF = Math.exp(LNK_FOLLOW(f));
  const followX = h.x - dx / kF;
  const followY = h.y + CAM_LIFT / k;
  const cx = CX_WIDE + RELEASE_TAU * softplus((followX - CX_WIDE) / RELEASE_TAU);
  const w = smootherstep((f - BLEND_Y[0]) / (BLEND_Y[1] - BLEND_Y[0]));
  return { k, cx, cy: followY + (CY_WIDE - followY) * w };
};
export const CAM_TRACK = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));

// ---------------------------------------------------------------------------
// The raster LOD pyramid: the level blend is a function of k alone (the zoom is
// monotonic apart from the two creeps), so a level fades in across a band of k
// rather than over frames and can never pop. Level i is drawn while its
// opacity > 0 and the level above is not yet opaque.
//   kBake: the zoom its screen-constant strokes are baked for (the geometric
//          middle of the k it serves); s: texels per world px (>= the largest k
//          it serves, so it is never magnified)
// ---------------------------------------------------------------------------
export const LEVEL_DEF = [
  { name: "wide", kBake: 1.05, s: 1.62, band: null },
  { name: "mid", kBake: 1.7, s: 2.62, band: [1.25, 1.6] as const },
  { name: "near", kBake: 2.76, s: 3.95, band: [1.95, 2.6] as const },
  { name: "close", kBake: 3.75, s: 4.8, band: [3.0, 3.9] as const },
];
export const levelOps = (k: number) =>
  LEVEL_DEF.map((L) => (L.band ? smoothstep(Math.log(k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1));
export const levelDrawn = (ops: number[], i: number) => ops[i] > 0.001 && (i === ops.length - 1 || ops[i + 1] < 0.999);

export { STATION_S };
