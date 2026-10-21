// ---------------------------------------------------------------------------
// slavesInTheWorkshopPlan: the numbers of cut D (SlavesInTheWorkshop, kyle-rome-slavery cut 33), pure functions of
// the cut's own frame f (0..142). The world is cut C's (./marketWorkshopWorld, read only): its local stage
// coordinates (X across, the seam at X = 0; Y height, the floor Y = 0; Z depth behind the front edge).
//   - the slabs: split 1 -> 0 (f0-22, a soft landing), the crack heals back to front (seam 1 -> 0, f22-36)
//   - the two walkers (the chalk-footed slave from the platform -> the far front stool, the fettered slave -> the
//     near one): 3D paths (down the catasta's steps, across the seam), arc-length timing, walk phase from distance
//   - the sit (turn to face us, back onto the stool, swivel to the wheel) and the throwing pulls (an orange bowl
//     drawn up the wheel under his hands)
//   - the camera: C's last camera -> one push-in over the walkers onto the front row (one lobe), then a creep
// ---------------------------------------------------------------------------
import { C_END, FRONT_STATIONS, MAIN_SLAVE, WAITING, cutCCamBase, stationPlace } from "./marketWorkshopWorld";
import type { Cam } from "../kits/maps/incaShared";

export const DURATION = 143;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const smoother = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};

// ---------------------------------------------------------------------------
// THE SLABS
// ---------------------------------------------------------------------------
/** contact: the two halves meet on f20 (split 0); the drift-in is a smootherstep with a soft end */
export const SLIDE: readonly [number, number] = [0, 20];
export const splitAt = (f: number) => 1 - smoother((f - SLIDE[0]) / (SLIDE[1] - SLIDE[0]));
/** the crack heals from the back to the front edge after contact */
export const HEAL: readonly [number, number] = [21, 36];
export const seamAt = (f: number) => (f < SLIDE[1] ? 1 : 1 - ease((f - HEAL[0]) / (HEAL[1] - HEAL[0])));
/** the thud of contact: a small decaying screen bump (px), f20 -> */
export const thudAt = (f: number) => {
  const t = f - SLIDE[1];
  if (t <= 0) return 0;
  return 3.2 * Math.sin(t / 2.2) * Math.exp(-t / 5);
};
/** the bowls: from C's last value to full, faster (the rack's last bowls come down f8-90) */
export const stackAt = (f: number) => mix(C_END.stack, 1, ease((f - 8) / 82));

// ---------------------------------------------------------------------------
// PATHS
// ---------------------------------------------------------------------------
export type V3 = [number, number, number];
/** a Catmull-Rom path through 3D keys, sampled, with arc length (Z counts `wz` of X: the depth move is foreshortened,
 *  so the stride matches mostly the across move) */
export const makePath = (keys: V3[], wz = 0.4, per = 40) => {
  const pts: V3[] = [];
  const n = keys.length;
  const K = (i: number) => keys[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = K(i - 1);
    const p1 = K(i);
    const p2 = K(i + 1);
    const p3 = K(i + 2);
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      pts.push([0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)) as V3);
    }
  }
  pts.push(keys[n - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = [pts[i][0] - pts[i - 1][0], 0.6 * (pts[i][1] - pts[i - 1][1]), wz * (pts[i][2] - pts[i - 1][2])];
    cum.push(cum[i - 1] + Math.hypot(d[0], d[1], d[2]));
  }
  const len = cum[cum.length - 1];
  const at = (s: number): V3 => {
    const x = Math.max(0, Math.min(len, s));
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (cum[m] <= x) lo = m;
      else hi = m;
    }
    const u = cum[hi] > cum[lo] ? (x - cum[lo]) / (cum[hi] - cum[lo]) : 0;
    return [0, 1, 2].map((c) => mix(pts[lo][c], pts[hi][c], u)) as V3;
  };
  /** the heading in the floor plane (dX, dZ, unit) at s */
  const heading = (s: number): [number, number] => {
    const a = at(s - 3);
    const b = at(s + 3);
    const dx = b[0] - a[0];
    const dz = b[2] - a[2];
    const L = Math.hypot(dx, dz) || 1;
    return [dx / L, dz / L];
  };
  return { at, heading, len };
};

/** a trapezoid speed profile: s(f) from 0 to len over [f0, f1], speeding up over `ea` frames, slowing over `ed` */
export const travel = (len: number, f0: number, f1: number, ea: number, ed: number) => {
  const T = f1 - f0;
  const v = len / (T - (ea + ed) / 2);
  const s = (f: number) => {
    const t = Math.max(0, Math.min(T, f - f0));
    if (t < ea) return (v * t * t) / (2 * ea);
    const sA = (v * ea) / 2;
    if (t < T - ed) return sA + v * (t - ea);
    const u = T - t;
    return len - (v * u * u) / (2 * ed);
  };
  const speed = (f: number) => {
    const t = f - f0;
    if (t <= 0 || t >= T) return 0;
    if (t < ea) return (v * t) / ea;
    if (t > T - ed) return (v * (T - t)) / ed;
    return v;
  };
  return { s, speed, v };
};

// ---------------------------------------------------------------------------
// THE WALKERS
// ---------------------------------------------------------------------------
/** where each walker sits: the chalk-footed slave takes the far stool (by the rack), the fettered one the near */
export const SEAT = { main: FRONT_STATIONS[1], wait: FRONT_STATIONS[0] };
const seatFeet = (st: (typeof FRONT_STATIONS)[number]) => stationPlace(st).feet;
/** he stops in front of the stool (nearer us), turns his back to it and sits back onto it */
export const STAND_OFF = { dX: 12, dZ: -62 };

export const WALKERS = {
  main: {
    stride: 100,
    path: makePath([
      [MAIN_SLAVE.X, MAIN_SLAVE.Y, MAIN_SLAVE.Z],
      [-122, -100, 116],
      [-100, -100, 88],
      [-82, -75, 70],
      [-64, -50, 50],
      [-47, -25, 30],
      [-28, 0, 13],
      [40, 0, 48],
      [180, 0, 170],
      [320, 0, 320],
      [seatFeet(SEAT.main) + STAND_OFF.dX, 0, SEAT.main.Z + STAND_OFF.dZ],
    ]),
    /** the head lifts and he turns (f1-9), walks f4 -> arrive, sits SIT frames */
    turn: [1, 9] as const,
    go: 3,
    arrive: 72,
    sit: 12,
  },
  wait: {
    stride: 70,
    path: makePath([
      [WAITING[0].X, WAITING[0].Y, WAITING[0].Z],
      [-176, -100, 250],
      [-140, -100, 160],
      [-112, -100, 100],
      [-92, -100, 86],
      [-78, -75, 70],
      [-62, -50, 50],
      [-46, -25, 30],
      [-30, 0, 14],
      [40, 0, 80],
      [130, 0, 230],
      [seatFeet(SEAT.wait) + STAND_OFF.dX, 0, SEAT.wait.Z + STAND_OFF.dZ],
    ]),
    turn: [4, 12] as const,
    go: 6,
    arrive: 84,
    sit: 13,
  },
};
export type Who = keyof typeof WALKERS;
export const walkTravel = (who: Who) => {
  const w = WALKERS[who];
  return travel(w.path.len, w.go, w.arrive, 10, 9);
};

// ---------------------------------------------------------------------------
// THE THROWING: pulls that draw an orange bowl up the wheel (m 0 -> 1); the wheel spins up as he sits
// ---------------------------------------------------------------------------
/** each pull: the hands rise up the wall [a, b], then drop back to the base quickly */
export const PULLS: Record<Who, [number, number][]> = {
  main: [
    [WALKERS.main.arrive + WALKERS.main.sit, WALKERS.main.arrive + WALKERS.main.sit + 12],
    [WALKERS.main.arrive + WALKERS.main.sit + 16, WALKERS.main.arrive + WALKERS.main.sit + 30],
    [WALKERS.main.arrive + WALKERS.main.sit + 35, WALKERS.main.arrive + WALKERS.main.sit + 51],
  ],
  wait: [
    [WALKERS.wait.arrive + WALKERS.wait.sit + 2, WALKERS.wait.arrive + WALKERS.wait.sit + 17],
    [WALKERS.wait.arrive + WALKERS.wait.sit + 22, WALKERS.wait.arrive + WALKERS.wait.sit + 38],
  ],
};
/** the bowl's form 0 (the lump) .. 1 (an open flaring bowl) */
export const bowlForm = (who: Who, f: number) => {
  const P = PULLS[who];
  let m = 0;
  for (const [a, b] of P) m += ease((f - a) / (b - a)) / 3;
  return m;
};
/** the hands' height on the wall 0 (base) .. 1 (rim): up slowly in a pull, back down fast between */
export const handRise = (who: Who, f: number) => {
  const P = PULLS[who];
  for (let i = 0; i < P.length; i++) {
    const [a, b] = P[i];
    if (f < a) {
      const prevB = i > 0 ? P[i - 1][1] : -1e9;
      // after the previous pull: back down over 5 frames
      return prevB > -1e8 ? 1 - ease((f - prevB) / 5) : 0;
    }
    if (f <= b) return ease((f - a) / (b - a));
  }
  return 1 - 0.25 * ease((f - P[P.length - 1][1]) / 12);
};
/** the wheel's turn (cycles): still (C's 0.15) until he sits, spun up by his kick, then steady */
export const wheelTurn = (who: Who, f: number) => {
  const w = WALKERS[who];
  const t0 = w.arrive + w.sit - 4;
  const rate = 1 / 26;
  const x = f - t0;
  if (x <= 0) return 0.15;
  const ramp = 10;
  return 0.15 + (x < ramp ? (rate * x * x) / (2 * ramp) : rate * (x - ramp / 2));
};

// ---------------------------------------------------------------------------
// THE CAMERA: from C's last frame, one push-in over the walkers onto the front row, then a slow creep
// ---------------------------------------------------------------------------
const lobe = (a: number, b: number) => (f: number) => {
  const L2 = b - a;
  const x = Math.max(0, Math.min(L2, f - a));
  return (x - (L2 / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L2)) / L2;
};
export const C0 = cutCCamBase(C_END.frame);
export const CAM = {
  /** landed (f ~92): the front row close, the chalk-footed slave potter right of centre, the fettered one left */
  k1: 3.3,
  cx1: 250,
  cy1: -352,
  /** the creep to the last frame */
  k2: 3.46,
  cx2: 268,
  cy2: -358,
  lobeK: [4, 92] as const,
  lobeX: [2, 88] as const,
  creep: [70, 142] as const,
};
const uK = lobe(...CAM.lobeK);
const uX = lobe(...CAM.lobeX);
/** the creep: velocity rising from 0 at creep[0] (a quadratic), so the lobe's landing runs on into it */
const creep = (f: number) => {
  const [a, b] = CAM.creep;
  const x = c01((f - a) / (b - a));
  return x * x;
};
export const camBase = (f: number): Cam => {
  const a = uK(f);
  const x = uX(f);
  const c = creep(f);
  // C0.k times a factor (exactly C0 at f0: a = x = c = 0)
  const dk = (Math.log(CAM.k1) - Math.log(C0.k)) * a + (Math.log(CAM.k2) - Math.log(CAM.k1)) * c;
  return {
    k: C0.k * Math.exp(dk),
    cx: mix(C0.cx, CAM.cx1, x) + (CAM.cx2 - CAM.cx1) * c,
    cy: mix(C0.cy, CAM.cy1, a) + (CAM.cy2 - CAM.cy1) * c,
  };
};
