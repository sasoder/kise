// ---------------------------------------------------------------------------
// farOutPlan — the plan of FarOutOfAustin (robert-johnson-ranch cut 6, take 2), pure functions (no React):
//   the WORLD (units U = 178 per metre; X across, H up, Z away from the camera = toward Austin; the camera always
//   looks +Z, back the way the car came), the ROUTE (US 290 out of town, a long right-hand bend, the left turn through
//   the cattle guard, the caliche ranch road winding to the farm), the car's SPEED and its state per frame, the
//   TERRAIN (the flat plain round the city, the rolling Hill Country with limestone benches, the roads' corridors), the
//   CAMERA (one continuous move: ahead of the car looking back at it and the city; easing down and in at the cattle
//   guard; one crane up and back to the farm) and the CITY's distance (it falls away into the haze faster than the
//   car's own travel: a picture-book compression of 22 miles; its position is never tied to the near ground).
// ---------------------------------------------------------------------------
export const FPS = 24000 / 1001;
export const DURATION = 322;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const s5 = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hash2 = (i: number, j: number, k = 0) => hash(i * 157.31 + j * 311.77 + k * 71.13);
const vnoise = (x: number, z: number, seed = 0) => {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const h = (i: number, j: number) => hash2(i, j, seed);
  return lerp(lerp(h(xi, zi), h(xi + 1, zi), s(xf)), lerp(h(xi, zi + 1), h(xi + 1, zi + 1), s(xf)), s(zf));
};
type V2 = [number, number];

/** monotone cubic through keys (pchip), clamped at the ends */
const pchipKeys = (keys: V2[]) => {
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]);
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

// ===================================================================================================================
// THE ROUTE
// ===================================================================================================================
/** the cattle guard (world), the highway's heading where the ranch road leaves it, and the driver's left there */
export const GUARD_AT: V2 = [0, 0];
export const HWY_DIR: V2 = [-0.8, -0.6];
export const LEFT_DIR: V2 = [0.6, -0.8];
/** the junction on the highway, the end of the long bend, the bend's radius, the turn's radius */
export const JUNCTION: V2 = [GUARD_AT[0] - 1100 * LEFT_DIR[0], GUARD_AT[1] - 1100 * LEFT_DIR[1]];
const BEND_R = 20000;
const ARC_END: V2 = [JUNCTION[0] - 1500 * HWY_DIR[0], JUNCTION[1] - 1500 * HWY_DIR[1]];
/** the bend's centre lies on the driver's right of HWY_DIR (right = (hz, -hx)) */
const BEND_C: V2 = [ARC_END[0] + BEND_R * HWY_DIR[1], ARC_END[1] - BEND_R * HWY_DIR[0]];
/** the straight run of US 290 out of Austin: X = HWY_X from the bend's start to the city */
export const HWY_X = BEND_C[0] + BEND_R;
export const BEND_START_Z = BEND_C[1];
const TURN_R = 700;

/** the farm (cut 26's set: the porch's front edge at (FARM_X, FARM_Z), the house facing -Z) */
export const FARM_X = 26500;
export const FARM_Z = 600;
/** the caliche ranch road from the guard (Catmull-Rom nodes): toward the camera, a left turn east ("turn left on the
 *  dirt road"), along the foot of the hills, then on east through valley after valley of empty Hill Country (the car
 *  never arrives anywhere: the road runs on out of the last frame) */
export const DIRT_NODES: V2[] = [
  [GUARD_AT[0], GUARD_AT[1]],
  [GUARD_AT[0] + 1300 * LEFT_DIR[0], GUARD_AT[1] + 1300 * LEFT_DIR[1]],
  [2300, -2500],
  [4800, -2950],
  [8200, -2300],
  [11600, -800],
  [14600, 500],
  [17800, 700],
  [20300, 1600],
  [23500, 1000],
  [26800, -700],
  [29800, -1300],
  [31200, -400],
  [31500, 1200],
  [30600, 2600],
  [30200, 3700],
  [30500, 4700],
  [31200, 5700],
];

/** the speed of the car (units per frame) at frame keys, before the farm leg is scaled to arrive on FARM */
const SPEED_KEYS: V2[] = [
  [-20, 250],
  [0, 290],
  [30, 380],
  [80, 400],
  [104, 330],
  [128, 150],
  [146, 66],
  [166, 52],
  [186, 62],
];
const SPEED = pchipKeys(SPEED_KEYS);
/** the frame the car reaches the start of the left turn */
export const F_TURN = 146;
const F_DIRT = 186;

type RP = { X: number; Z: number; s: number };
const seg = (out: RP[], a: V2, b: V2, step: number) => {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.ceil(L / step));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const p: V2 = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    const q = out[out.length - 1];
    out.push({ X: p[0], Z: p[1], s: q.s + Math.hypot(p[0] - q.X, p[1] - q.Z) });
  }
};
const catmull = (K: V2[], sub: number): V2[] => {
  const out: V2[] = [];
  for (let i = 0; i < K.length - 1; i++) {
    const p0 = K[Math.max(0, i - 1)];
    const p1 = K[i];
    const p2 = K[i + 1];
    const p3 = K[Math.min(K.length - 1, i + 2)];
    for (let j = 0; j < sub; j++) {
      const t = j / sub;
      const t2 = t * t;
      const t3 = t2 * t;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(K[K.length - 1]);
  return out;
};
/** the distance driven by frame f through the highway (integrated SPEED), table at 1/8 frame */
const S_HWY = (() => {
  const t: number[] = [];
  let acc = 0;
  for (let i = 0; i <= (F_DIRT + 2) * 8; i++) {
    t.push(acc);
    acc += SPEED(i / 8 + 1 / 16) / 8;
  }
  return (f: number) => {
    const x = Math.max(0, Math.min(t.length - 2, f * 8));
    const i = Math.floor(x);
    return lerp(t[i], t[i + 1], x - i);
  };
})();
/** the route: from the car's start on the straight (s = 0) to the farm yard */
export const ROUTE = (() => {
  const T1: V2 = [JUNCTION[0] - TURN_R * HWY_DIR[0], JUNCTION[1] - TURN_R * HWY_DIR[1]];
  const T2: V2 = [JUNCTION[0] + TURN_R * LEFT_DIR[0], JUNCTION[1] + TURN_R * LEFT_DIR[1]];
  const arcLen = BEND_R * Math.acos(-HWY_DIR[1]);
  const straight = S_HWY(F_TURN) - arcLen - Math.hypot(T1[0] - ARC_END[0], T1[1] - ARC_END[1]);
  const startZ = BEND_START_Z + straight;
  const pts: RP[] = [{ X: HWY_X, Z: startZ, s: 0 }];
  seg(pts, [HWY_X, startZ], [HWY_X, BEND_START_Z], 120);
  // the bend: from angle 0 (the start, east of the centre) turning toward HWY_DIR
  const a1 = Math.atan2(ARC_END[1] - BEND_C[1], ARC_END[0] - BEND_C[0]);
  const nA = 160;
  for (let i = 1; i <= nA; i++) {
    const a = lerp(0, a1, i / nA);
    const p: V2 = [BEND_C[0] + BEND_R * Math.cos(a), BEND_C[1] + BEND_R * Math.sin(a)];
    const q = pts[pts.length - 1];
    pts.push({ X: p[0], Z: p[1], s: q.s + Math.hypot(p[0] - q.X, p[1] - q.Z) });
  }
  seg(pts, ARC_END, T1, 60);
  const sT1 = pts[pts.length - 1].s;
  // the left turn: a quarter circle of TURN_R (its centre on the driver's left of T1)
  const C: V2 = [T1[0] + TURN_R * LEFT_DIR[0], T1[1] + TURN_R * LEFT_DIR[1]];
  const b0 = Math.atan2(T1[1] - C[1], T1[0] - C[0]);
  const b1 = Math.atan2(T2[1] - C[1], T2[0] - C[0]);
  let db = b1 - b0;
  while (db > Math.PI) db -= 2 * Math.PI;
  while (db < -Math.PI) db += 2 * Math.PI;
  for (let i = 1; i <= 40; i++) {
    const a = b0 + (db * i) / 40;
    const p: V2 = [C[0] + TURN_R * Math.cos(a), C[1] + TURN_R * Math.sin(a)];
    const q = pts[pts.length - 1];
    pts.push({ X: p[0], Z: p[1], s: q.s + Math.hypot(p[0] - q.X, p[1] - q.Z) });
  }
  seg(pts, T2, GUARD_AT, 40);
  const sGuard = pts[pts.length - 1].s;
  const dirt = catmull(DIRT_NODES, 24);
  for (let i = 1; i < dirt.length; i++) {
    const q = pts[pts.length - 1];
    pts.push({ X: dirt[i][0], Z: dirt[i][1], s: q.s + Math.hypot(dirt[i][0] - q.X, dirt[i][1] - q.Z) });
  }
  return { pts, startZ, sT1, sGuard, sEnd: pts[pts.length - 1].s, T1, T2, highwayEndS: sT1 };
})();
/** the route point at distance s (clamped) */
export const routeAt = (s: number): V2 => {
  const P = ROUTE.pts;
  if (s <= 0) return [P[0].X, P[0].Z + -s * 1];
  if (s >= P[P.length - 1].s) return [P[P.length - 1].X, P[P.length - 1].Z];
  let lo = 0;
  let hi = P.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (P[m].s <= s) lo = m;
    else hi = m;
  }
  const t = (s - P[lo].s) / (P[hi].s - P[lo].s);
  return [lerp(P[lo].X, P[hi].X, t), lerp(P[lo].Z, P[hi].Z, t)];
};

/** the distance driven by frame f: the highway table to F_DIRT, then the dirt-road leg: it picks up to a steady
 *  cruise and keeps going past the last frame (nowhere to arrive) */
const V_CRUISE = 250;
export const sAt = (() => {
  const v0 = SPEED(F_DIRT);
  const acc = (f: number) => s5(F_DIRT, F_DIRT + 44, f);
  const tab: number[] = [];
  let s = S_HWY(F_DIRT);
  for (let i = 0; i <= (DURATION + 24 - F_DIRT) * 8; i++) {
    tab.push(s);
    const f = F_DIRT + (i + 0.5) / 8;
    s += (v0 * (1 - acc(f)) + V_CRUISE * acc(f)) / 8;
  }
  return (f: number) => {
    if (f <= F_DIRT) return S_HWY(f);
    const x = Math.min(tab.length - 2, (f - F_DIRT) * 8);
    const i = Math.floor(x);
    return Math.min(ROUTE.sEnd, lerp(tab[i], tab[i + 1], x - i));
  };
})();

/** MILES FROM AUSTIN: 0 at the edge of town, 22 on the guard, 44 at the farm yard (linear in distance on each leg) */
export const S_TOWN_EDGE = 9000;
/** the counter: 0 at the edge of town, 22 as the guard comes up (f~136, held while the car slows, turns and crosses),
 *  then on from the far side of the guard to 44 at the farm */
const S_AT_22 = 45250;
const S_RESUME = ROUTE.sGuard + 260;
export const milesAt = (s: number) => {
  if (s <= S_TOWN_EDGE) return 0;
  if (s <= S_AT_22) return (22 * (s - S_TOWN_EDGE)) / (S_AT_22 - S_TOWN_EDGE);
  if (s <= S_RESUME) return 22;
  return 22 + (22 * (s - S_RESUME)) / (ROUTE.sEnd - S_RESUME);
};

// ===================================================================================================================
// THE TERRAIN
// ===================================================================================================================
/** samples along the roads (for the corridors): x, z, kind (0 highway, 1 ranch road), the smoothed road height */
type RS = { X: number; Z: number; kind: number; h: number };
/** the highway beyond the junction (its continuation westward, out of the story) and back toward the city */
const HWY_EXTRA: V2[] = [
  [JUNCTION[0], JUNCTION[1]],
  [JUNCTION[0] + 30000 * HWY_DIR[0], JUNCTION[1] + 30000 * HWY_DIR[1]],
];
/** the raw land before the roads: rolling hills fading out toward the city's plain, limestone benches, a few placed
 *  hills that frame the roads */
const HILLS: { X: number; Z: number; rx: number; rz: number; h: number }[] = [
  // along the highway's straight (it runs at HWY_X between them)
  { X: HWY_X - 9500, Z: 24000, rx: 4200, rz: 3600, h: 2600 },
  { X: HWY_X + 9800, Z: 29000, rx: 4800, rz: 3800, h: 3000 },
  { X: HWY_X - 11000, Z: 34000, rx: 4500, rz: 3500, h: 2200 },
  { X: HWY_X + 12000, Z: 38500, rx: 5200, rz: 3800, h: 1900 },
  { X: HWY_X + 8200, Z: 20000, rx: 3600, rz: 3200, h: 2000 },
  // beyond the guard and behind the ranch road (none between the road and the camera, which is always on its near side)
  { X: -6500, Z: 8000, rx: 4200, rz: 3800, h: 2600 },
  { X: 1200, Z: 6800, rx: 2800, rz: 2400, h: 1500 },
  { X: 15200, Z: 9200, rx: 4000, rz: 3400, h: 2900 },
  { X: 15800, Z: 5600, rx: 3000, rz: 2800, h: 2000 },
  { X: 21500, Z: 5200, rx: 4200, rz: 3600, h: 3100 },
  { X: 28800, Z: 2600, rx: 4600, rz: 3800, h: 3400 },
  { X: 35500, Z: -5000, rx: 4200, rz: 4600, h: 2700 },
  { X: 1200, Z: 16000, rx: 3600, rz: 3000, h: 1800 },
  { X: 26000, Z: 12500, rx: 5200, rz: 4000, h: 2600 },
];
const bench = (h: number, step = 620) => {
  if (h <= 0) return h;
  const n = Math.floor(h / step);
  const fr = h / step - n;
  return step * (n + s5(0.3, 0.75, fr) * 0.85 + fr * 0.15);
};
/** THE EAST (the second half's country): the part of the world the opening (f0-150) never sees, east of its view's
 *  right edge (EDGE: the farthest X any f0-150 camera shows at each Z, plus a margin; nothing at Z < -6500 is ever in
 *  the opening's view). eastOf -> 0 (as delivered) .. 1 (the second half's land) */
const EDGE: V2[] = [
  [-6500, 1500],
  [-4000, 3058],
  [0, 5239],
  [4000, 7310],
  [8000, 8773],
  [20000, 12600],
  [60000, 26563],
  [140000, 55897],
  [400000, 151000],
];
const edgeAt = (Z: number) => {
  if (Z <= EDGE[0][0]) return EDGE[0][1];
  for (let i = 0; i < EDGE.length - 1; i++) if (Z <= EDGE[i + 1][0]) return lerp(EDGE[i][1], EDGE[i + 1][1], (Z - EDGE[i][0]) / (EDGE[i + 1][0] - EDGE[i][0]));
  return EDGE[EDGE.length - 1][1];
};
export const eastOf = (X: number, Z: number) => Math.max(1 - sstep(-11000, -6500, Z), sstep(edgeAt(Z) + 1500, edgeAt(Z) + 6000, X));
/** the second half's land: long low folds running across the view (east-west), a draw now and then, no benches */
const eastH = (X: number, Z: number) =>
  620 * (vnoise(X / 7600 + 5.1, Z / 2700 + 2.3, 41) - 0.45) + 260 * (vnoise(X / 2600 + 1.3, Z / 1400, 42) - 0.5) + 90 * (vnoise(X / 800, Z / 700, 43) - 0.5);
export const rawH = (X: number, Z: number) => {
  const e = eastOf(X, Z);
  const w = e < 1 ? westH(X, Z) : 0;
  return e > 0 ? lerp(w, eastH(X, Z), e) : w;
};
const westH = (X: number, Z: number) => {
  // the plain toward Austin: no hills near town, and along the highway's own strip until the Hill Country begins
  // (Z < ~8000); off to the sides the hills stay
  const strip = sstep(8000, 26000, Z) * (1 - sstep(3500, 9500, Math.abs(X - HWY_X)));
  const region = 1 - Math.max(sstep(33000, 46000, Z), strip);
  let h = 1500 * (vnoise(X / 8000 + 3.3, Z / 7000 + 1.7, 21) - 0.45) + 520 * (vnoise(X / 2600, Z / 2300, 22) - 0.5) + 160 * (vnoise(X / 900, Z / 800, 23) - 0.5);
  for (const b of HILLS) {
    const d2 = ((X - b.X) / b.rx) ** 2 + ((Z - b.Z) / b.rz) ** 2;
    if (d2 < 4) h += b.h * Math.exp(-1.6 * d2) * (0.85 + 0.3 * vnoise(X / 1500, Z / 1500, 31));
  }
  h = lerp(0, bench(Math.max(-300, h)), region);
  return h;
};
/** the ranch road's steepest grade past the guard (rise over run) */
const DIRT_GRADE = 0.1;
/** the road samples with their smoothed heights (each road follows the land, smoothed along its length) */
const ROADS: RS[] = (() => {
  const out: RS[] = [];
  const add = (pts: V2[], kind: number, step: number, gradeFromS?: number) => {
    const dense: V2[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, b] = [pts[i], pts[i + 1]];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let k = 0; k < n; k++) dense.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
    }
    dense.push(pts[pts.length - 1]);
    const raw = dense.map(([x, z]) => rawH(x, z));
    const W = Math.round((kind === 0 ? 2600 : 900) / step);
    const hs = dense.map((_, i) => {
      let s = 0;
      let w = 0;
      for (let k = -W; k <= W; k++) {
        const j = Math.max(0, Math.min(dense.length - 1, i + k));
        const wk = 1 - Math.abs(k) / (W + 1);
        s += raw[j] * wk;
        w += wk;
      }
      return s / w;
    });
    // the ranch road past the guard is graded: from `gradeFrom` along it, its height follows the smoothed land at
    // no more than DIRT_GRADE (a rate limiter: it cuts into a bench's riser and climbs on after it), then is smoothed
    // again (which keeps the grade), so the car never meets a wall
    if (gradeFromS !== undefined) {
      let run = 0;
      let gradeFrom = dense.length;
      for (let i = 1; i < dense.length; i++) {
        run += Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
        if (run >= gradeFromS) {
          gradeFrom = i;
          break;
        }
      }
      const lim = hs.slice();
      for (let i = gradeFrom + 1; i < dense.length; i++) {
        const ds = Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
        const m = DIRT_GRADE * ds;
        lim[i] = lim[i - 1] + Math.max(-m, Math.min(m, hs[i] - lim[i - 1]));
      }
      const S = 4;
      for (let i = gradeFrom; i < dense.length; i++) {
        let a = 0;
        let w = 0;
        for (let k = -S; k <= S; k++) {
          const j = Math.max(gradeFrom, Math.min(dense.length - 1, i + k));
          a += lim[j];
          w++;
        }
        hs[i] = a / w;
      }
    }
    dense.forEach(([x, z], i) => out.push({ X: x, Z: z, kind, h: hs[i] }));
  };
  const P = ROUTE.pts;
  const hw: V2[] = [];
  // the highway: from far toward the city to the junction, then on west
  hw.push([HWY_X, ROUTE.startZ + 60000]);
  for (const p of P) if (p.s <= ROUTE.sT1 + 0.1) hw.push([p.X, p.Z]);
  hw.push(JUNCTION);
  add(hw, 0, 220);
  add(HWY_EXTRA, 0, 220);
  const dirt: V2[] = [];
  for (const p of P) if (p.s > ROUTE.sT1) dirt.push([p.X, p.Z]);
  // graded from ~1800 units past the turn's start (the guard, its approach and the road's first stretch as they were)
  add(dirt, 1, 120, 1800);
  return out;
})();
/** a spatial grid over the road samples */
const CELL = 2000;
const GRID = (() => {
  const m = new Map<string, number[]>();
  ROADS.forEach((r, i) => {
    const cx = Math.floor(r.X / CELL);
    const cz = Math.floor(r.Z / CELL);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++) {
        const k = `${cx + a},${cz + b}`;
        const l = m.get(k);
        if (l) l.push(i);
        else m.set(k, [i]);
      }
  });
  return m;
})();
/** the nearest road sample: distance, its smoothed height, kind */
export const nearestRoad = (X: number, Z: number) => {
  const l = GRID.get(`${Math.floor(X / CELL)},${Math.floor(Z / CELL)}`);
  let best = 1e12;
  let bi = -1;
  if (l)
    for (const i of l) {
      const r = ROADS[i];
      const d = (r.X - X) ** 2 + (r.Z - Z) ** 2;
      if (d < best) {
        best = d;
        bi = i;
      }
    }
  if (bi < 0) return { d: 1e6, h: 0, kind: -1 };
  // the height interpolated along the nearer of the two segments at that sample (no steps between samples)
  const r0 = ROADS[bi];
  let h = r0.h;
  let dd = Math.sqrt(best);
  let bestSeg = 1e12;
  for (const j of [bi - 1, bi + 1]) {
    const r1 = ROADS[j];
    if (!r1 || r1.kind !== r0.kind) continue;
    const sx = r1.X - r0.X;
    const sz = r1.Z - r0.Z;
    const L2 = sx * sx + sz * sz;
    if (L2 < 1 || L2 > 600 * 600) continue;
    const t = Math.max(0, Math.min(1, ((X - r0.X) * sx + (Z - r0.Z) * sz) / L2));
    const px = r0.X + sx * t;
    const pz = r0.Z + sz * t;
    const d2 = (X - px) ** 2 + (Z - pz) ** 2;
    if (d2 < bestSeg) {
      bestSeg = d2;
      h = lerp(r0.h, r1.h, t);
      dd = Math.sqrt(d2);
    }
  }
  return { d: dd, h, kind: r0.kind };
};
export const HWY_HALF = 760;
export const DIRT_HALF = 300;
/** the land with the roads' corridors cut and filled to each road's smoothed height */
export const TH = (X: number, Z: number) => {
  const h = rawH(X, Z);
  const r = nearestRoad(X, Z);
  if (r.kind < 0) return h;
  const half = r.kind === 0 ? HWY_HALF : DIRT_HALF;
  const m = 1 - sstep(half + 150, half + (r.kind === 0 ? 2600 : 1300), r.d);
  return lerp(h, r.h, m);
};

// ===================================================================================================================
// THE CAR
// ===================================================================================================================
export type CarState = { X: number; Z: number; H: number; heading: V2; up: [number, number, number]; s: number; v: number; roll: number; steer: number; miles: number; onDirt: boolean; bounce: number };
const WHEELBASE = 555;
/** the axles along the car (farOutCar's CAR.axleF / axleR) and the most the body may pitch or roll (tangents): the
 *  pitch follows the road (the graded ranch road keeps it within ~6 degrees; the highway's own dips run steeper) */
const AXLE_F = 300;
const AXLE_R = -255;
const PITCH_MAX = Math.tan((24 * Math.PI) / 180);
const ROLL_MAX = Math.tan((3 * Math.PI) / 180);
const softClamp = (v: number, m: number) => m * Math.tanh(v / m);
/** the road under a wheel at route distance s: the land along the route averaged over +-150 (no kinks), plus the
 *  cattle guard's pipe tops (~24 over the road), eased on and off over its curbs */
const GUARD_TOP = 24;
const contactH = (s: number) => {
  let h = 0;
  let w = 0;
  for (let k = -150; k <= 150; k += 30) {
    const wk = Math.exp(-((k / 90) ** 2));
    const [X, Z] = routeAt(s + k);
    h += TH(X, Z) * wk;
    w += wk;
  }
  const [X, Z] = routeAt(s);
  const dx = X - GUARD_AT[0];
  const dz = Z - GUARD_AT[1];
  const ta = dx * LEFT_DIR[0] + dz * LEFT_DIR[1];
  const ua = dx * HWY_DIR[0] + dz * HWY_DIR[1];
  return h / w + GUARD_TOP * (1 - sstep(170, 330, Math.abs(ta))) * (1 - sstep(400, 460, Math.abs(ua)));
};
export const carAt = (f: number): CarState => {
  const s = sAt(f);
  const [X, Z] = routeAt(s);
  const a = routeAt(s - 60);
  const b = routeAt(s + 60);
  let hx = b[0] - a[0];
  let hz = b[1] - a[1];
  const l = Math.hypot(hx, hz) || 1;
  hx /= l;
  hz /= l;
  if (s <= 0) {
    hx = 0;
    hz = -1;
  }
  // the curvature -> the front wheels' steer
  const c = routeAt(s + 260);
  const d = routeAt(s - 260 + 0.001);
  const h1 = Math.atan2(c[1] - routeAt(s + 200)[1], c[0] - routeAt(s + 200)[0]);
  const h0 = Math.atan2(routeAt(s - 200)[1] - d[1], routeAt(s - 200)[0] - d[0]);
  let dh = h1 - h0;
  while (dh > Math.PI) dh -= 2 * Math.PI;
  while (dh < -Math.PI) dh += 2 * Math.PI;
  const kappa = dh / 460;
  const steer = Math.atan(WHEELBASE * kappa);
  // the wheels on the road: each axle's contact height on the road surface (smoothed along the route, with the
  // guard's pipes), the body pitched through both contacts (a few degrees at most) and rolled with the land across
  const hf = contactH(s + AXLE_F);
  const hr = contactH(s + AXLE_R);
  const tp = softClamp((hf - hr) / (AXLE_F - AXLE_R), PITCH_MAX);
  const H = hr - AXLE_R * tp;
  const lx = -hz;
  const lz = hx;
  const tr = softClamp((TH(X + lx * 180, Z + lz * 180) - TH(X - lx * 180, Z - lz * 180)) / 360, ROLL_MAX);
  const n = [-hx * tp - lx * tr, 1, -hz * tp - lz * tr];
  const nl = Math.hypot(n[0], n[1], n[2]);
  const v = (sAt(f + 0.5) - sAt(f - 0.5)) || 0;
  // over the guard: each axle's wheels tick over the pipes (a few units of judder while on them)
  let bounce = 0;
  const along = s - ROUTE.sGuard;
  for (const ax of [300, -255]) {
    const t = along + ax;
    if (Math.abs(t) < 200) bounce += 2.2 * Math.abs(Math.sin((Math.PI * t) / 45)) * (1 - Math.abs(t) / 200);
  }
  return { X, Z, H, heading: [hx, hz], up: [n[0] / nl, n[1] / nl, n[2] / nl], s, v, roll: s / 66, steer, miles: milesAt(s), onDirt: s > ROUTE.sGuard + 150, bounce };
};

// ===================================================================================================================
// THE CAMERA (world): a pinhole at (X, height E, Z) looking +Z with focal C and the horizon at row yH (cam3)
// ===================================================================================================================
/** the car's position low-passed (a Gaussian over +-14 frames): the camera never follows the car's own speed changes */
const carSmooth = (f: number): [number, number, number] => {
  let sx = 0;
  let sz = 0;
  let sh = 0;
  let sw = 0;
  for (let k = -14; k <= 14; k += 2) {
    const w = Math.exp(-((k / 8) ** 2));
    const c = routeAt(sAt(f + k));
    sx += c[0] * w;
    sz += c[1] * w;
    sh += TH(c[0], c[1]) * w;
    sw += w;
  }
  return [sx / sw, sz / sw, sh / sw];
};
const K = (keys: V2[]) => pchipKeys(keys);
/** the camera's distance to its target (log), focal, height over the target's ground, and the target's screen point */
/** the camera's keys: distance D to the target (log), lens C, the target's screen x/y, and the horizon's screen y
 *  (the camera's height follows from them: E = ground + (sy - yH) * D / C) */
const CAM_D = K([
  [-20, Math.log(11000)],
  [0, Math.log(11000)],
  [24, Math.log(10600)],
  [45, Math.log(9300)],
  [70, Math.log(7600)],
  [100, Math.log(6200)],
  [125, Math.log(7400)],
  [150, Math.log(7300)],
  [190, Math.log(6900)],
  [214, Math.log(7300)],
  [248, Math.log(8600)],
  [278, Math.log(9300)],
  [300, Math.log(9000)],
  [340, Math.log(8300)],
]);
const CAM_C = K([
  [-20, 4000],
  [0, 4000],
  [24, 3850],
  [45, 3300],
  [70, 2600],
  [100, 2050],
  [125, 1900],
  [150, 1900],
  [190, 1850],
  [214, 1750],
  [248, 1450],
  [278, 1300],
  [300, 1290],
  [340, 1290],
]);
const CAM_SX = K([
  [-20, 290],
  [0, 290],
  [24, 300],
  [45, 320],
  [70, 360],
  [100, 420],
  [125, 300],
  [150, 470],
  [190, 470],
  [214, 470],
  [248, 500],
  [278, 540],
  [300, 540],
  [340, 540],
]);
const CAM_SY = K([
  [-20, 1000],
  [0, 1000],
  [24, 1000],
  [45, 990],
  [70, 960],
  [100, 900],
  [125, 860],
  [150, 870],
  [190, 880],
  [214, 880],
  [248, 870],
  [278, 870],
  [300, 880],
  [340, 880],
]);
const CAM_YH = K([
  [-20, 866],
  [0, 866],
  [24, 860],
  [45, 820],
  [70, 700],
  [100, 560],
  [125, 480],
  [150, 470],
  [190, 470],
  [214, 480],
  [248, 470],
  [278, 465],
  [300, 470],
  [340, 470],
]);
/** THE SECOND HALF (from f150): one continuous rise and pull-back over the empty Hill Country, the car small on the
 *  dirt road, the horizon climbing the frame so the land fills it. Given as targets (f, D, C, sx, sy, yH) and applied
 *  as smooth offsets on the keys above that are zero, with zero slope, at f150: every frame to f150 is unchanged. */
const RISE: [number, number, number, number, number, number][] = [
  [175, 7700, 1880, 470, 880, 462],
  [205, 8900, 1840, 470, 900, 448],
  [240, 11200, 1790, 462, 915, 428],
  [275, 13700, 1745, 448, 925, 412],
  [305, 15600, 1712, 436, 930, 403],
  [321, 16500, 1700, 430, 930, 400],
  [345, 17800, 1690, 424, 930, 396],
];
const riseOff = (base: (f: number) => number, col: number, log = false) =>
  K([[130, 0], [150, 0], ...RISE.map((r) => [r[0], (log ? Math.log(r[col]) : r[col]) - base(r[0])] as V2)]);
const OFF_D = riseOff(CAM_D, 1, true);
const OFF_C = riseOff(CAM_C, 2);
const OFF_SX = riseOff(CAM_SX, 3);
const OFF_SY = riseOff(CAM_SY, 4);
const OFF_YH = riseOff(CAM_YH, 5);
const camD = (f: number) => Math.exp(CAM_D(f) + (f > 150 ? OFF_D(f) : 0));
const camC = (f: number) => CAM_C(f) + (f > 150 ? OFF_C(f) : 0);
const camSX = (f: number) => CAM_SX(f) + (f > 150 ? OFF_SX(f) : 0);
const camSY = (f: number) => CAM_SY(f) + (f > 150 ? OFF_SY(f) : 0);
const camYH = (f: number) => CAM_YH(f) + (f > 150 ? OFF_YH(f) : 0);
/** how far the target leans from the car toward the cattle guard (so both sit in frame around "cattle guard") */
export const guardLean = (f: number) => 0.42 * s5(104, 140, f) * (1 - s5(170, 214, f));
export type CamW = { X: number; Z: number; E: number; C: number; yH: number; D: number; tX: number; tZ: number; tH: number };
export const camAt = (f: number): CamW => {
  const c = carSmooth(f);
  const gH = TH(GUARD_AT[0], GUARD_AT[1]);
  const gl = guardLean(f);
  const tX = lerp(c[0], GUARD_AT[0], gl);
  const tZ = lerp(c[1], GUARD_AT[1], gl);
  const tH = lerp(c[2], gH, gl);
  const D = camD(f);
  const C = camC(f);
  const sx = camSX(f);
  const sy = camSY(f);
  const X = tX - ((sx - 540) * D) / C;
  const Z = tZ - D;
  // the framed height, raised (smoothly) where the land under the camera would come too close: a short crane over
  // the rise; the target keeps its screen point, the horizon moves
  const E = tH + ((sy - camYH(f)) * D) / C + camLift(f);
  return { X, Z, E, C, yH: sy - ((E - tH) * C) / D, D, tX, tZ, tH };
};
const CAM_CLEAR = 420;
const camLift = (() => {
  let tab: number[] | null = null;
  const F0 = -24;
  const F1 = DURATION + 40;
  return (f: number) => {
    if (!tab) {
      const raw: number[] = [];
      for (let g = F0; g <= F1; g++) {
        const c = camBase(g);
        raw.push(Math.max(0, TH(c.X, c.Z) + CAM_CLEAR - c.E));
      }
      // a running max over +-12 frames, then a +-10 frame average: it starts rising before the rise, eases off after
      const mx = raw.map((_, i) => Math.max(...raw.slice(Math.max(0, i - 12), i + 13)));
      tab = mx.map((_, i) => {
        const w = mx.slice(Math.max(0, i - 10), i + 11);
        return w.reduce((a, b) => a + b, 0) / w.length;
      });
    }
    const x = Math.max(0, Math.min(tab.length - 1.001, f - F0));
    const i = Math.floor(x);
    return lerp(tab[i], tab[i + 1], x - i);
  };
})();
/** the framed camera without the lift */
const camBase = (f: number) => {
  const c = carSmooth(f);
  const gH = TH(GUARD_AT[0], GUARD_AT[1]);
  const gl = guardLean(f);
  const tX = lerp(c[0], GUARD_AT[0], gl);
  const tZ = lerp(c[1], GUARD_AT[1], gl);
  const tH = lerp(c[2], gH, gl);
  const D = camD(f);
  const C = camC(f);
  return { X: tX - ((camSX(f) - 540) * D) / C, Z: tZ - D, E: tH + ((camSY(f) - camYH(f)) * D) / C };
};
/** world -> screen (for planning and the review) */
export const toScreen = (c: CamW, X: number, H: number, Z: number) => {
  const d = Z - c.Z;
  return { x: 540 + ((X - c.X) * c.C) / d, y: c.yH + ((c.E - H) * c.C) / d, d };
};

// ===================================================================================================================
// THE CITY (the Capitol's front centre): it falls away into the haze along the highway's line, faster than the car
// ===================================================================================================================
/** the skyline's apparent width (px) the city keeps at each frame: wide at f0, ~1/4 by the guard, tiny at the end */
export const CITY_W = 81000;
const SKY_PX = K([
  [-20, 1960],
  [0, 1930],
  [24, 1850],
  [45, 1500],
  [70, 1050],
  [100, 720],
  [135, 520],
  [170, 420],
  [200, 360],
  [260, 290],
  [300, 262],
  [340, 252],
]);
export const CITY_X = HWY_X;
export const CITY_Z0 = ROUTE.startZ + 34000;
/** the city's world Z at frame f (never nearer than its start, never moving back toward the camera) */
export const cityZ = (() => {
  const raw = (f: number) => {
    const c = camAt(f);
    return c.Z + (CITY_W * c.C) / SKY_PX(f);
  };
  const tab: number[] = [];
  let m = CITY_Z0;
  for (let f = -20; f <= DURATION + 20; f++) {
    m = Math.max(m, raw(f));
    tab.push(m);
  }
  return (f: number) => {
    const x = Math.max(0, Math.min(tab.length - 2, f + 20));
    const i = Math.floor(x);
    return lerp(tab[i], tab[i + 1], x - i);
  };
})();
/** the city leaving for good: from f128, as the camera comes down to the guard, it sinks behind the hills between
 *  (its backdrop lift lets go) and fades into the haze; gone by f160 and never drawn again */
export const cityGone = (f: number) => s5(128, 160, f);
/** the city's fog toward the haze (0 near .. 1 gone): clear at f0, thickening, all haze by f160 */
export const cityFog = (f: number) => lerp(lerp(0.06, 0.42, s5(0, 300, f) * 0.6 + 0.4 * c01(f / 300)), 1, cityGone(f));
/** the city's backdrop lift (world height under its base): the painted-backdrop cheat that keeps the skyline above
 *  the hills between the camera and the horizon. Per frame: the highest terrain line on screen across the skyline's
 *  middle; the base is lifted until it tucks just behind it. Smoothed (running max, then an average) so it glides. */
export const cityLift = (() => {
  let tab: number[] | null = null;
  const F0 = -20;
  const F1 = DURATION + 20;
  const raw = (f: number) => {
    const c = camAt(f);
    const dC = cityZ(f) - c.Z;
    const w = (CITY_W * c.C) / dC;
    const cx = 540 + ((CITY_X - c.X) * c.C) / dC;
    let ySil = Infinity;
    for (let i = 0; i <= 10; i++) {
      const x = Math.max(4, Math.min(1076, cx + (i / 10 - 0.5) * 0.7 * w));
      for (let d = 700; d < 110000; d *= 1.035) {
        const X = c.X + ((x - 540) * d) / c.C;
        const y = c.yH + ((c.E - TH(X, c.Z + d)) * c.C) / d;
        if (y < ySil) ySil = y;
      }
    }
    const tuck = 10 + 0.02 * w;
    const base = c.yH + (c.E * c.C) / dC;
    if (base <= ySil + tuck) return 0;
    return c.E - ((ySil + tuck - c.yH) * dC) / c.C;
  };
  return (f: number) => {
    if (!tab) {
      const r: number[] = [];
      for (let g = F0; g <= F1; g++) r.push(raw(g));
      const mx = r.map((_, i) => Math.max(...r.slice(Math.max(0, i - 8), i + 9)));
      tab = mx.map((_, i) => {
        const w = mx.slice(Math.max(0, i - 8), i + 9);
        return w.reduce((a, b) => a + b, 0) / w.length;
      });
    }
    const x = Math.max(0, Math.min(tab.length - 1.001, f - F0));
    const i = Math.floor(x);
    return lerp(tab[i], tab[i + 1], x - i) * (1 - cityGone(f));
  };
})();

// ===================================================================================================================
// THE FAR COUNTRY (the second half): Hill Country ridge rows (cut 59's HillCountryRidges, grass + flatFar), world
// rows at fixed Z from FLAT_Z0 out to the horizon, set from the end camera so the rows stack the way cut 59's do
// (row i's crest at yH + (y0 - yH) * 0.8^i at f321); they come up out of the haze over f150-192 while the far land
// beyond FLAT_Z0 goes (the opening never shows them). The ranch road crosses them: xRoad = the screen x (at f321)
// where it tops each row, winding left and right toward a point near the horizon.
// ===================================================================================================================
export const FLAT_Z0 = 4000;
export const FLAT_IN: [number, number] = [150, 192];
export const flatIn = (f: number) => s5(FLAT_IN[0], FLAT_IN[1], f);
export type FlatRow = { Z: number; H: number; amp: number; lambda: number; seed: number; tree: number; dots: number; xRoad: number; yRow: number };
let FLATS: FlatRow[] | null = null;
export const flatRows = (): FlatRow[] => {
  if (FLATS) return FLATS;
  const ce = camAt(DURATION - 1);
  const n = 13;
  const d0 = FLAT_Z0 - ce.Z;
  // the nearest row's crest just above the car's stretch of road (the car at y ~930), the rows stacking up to the
  // horizon like cut 59's (0.8 per row)
  const y0 = 815;
  FLATS = Array.from({ length: n }, (_, i) => {
    const d = d0 * Math.pow(1.36, i);
    const y = ce.yH + (y0 - ce.yH) * Math.pow(0.8, i);
    const px = d / ce.C;
    const far = Math.max(0, i - 4);
    const ampPx = 115 * Math.pow(0.85, Math.min(i, 4)) * Math.pow(0.74, far);
    const lamPx = 170 * Math.pow(0.9, Math.min(i, 4)) * (1 + 0.18 * far);
    return {
      Z: ce.Z + d,
      H: ce.E - (y - ce.yH) * px,
      amp: ampPx * px,
      lambda: lamPx * px,
      seed: 11 + i * 3.7,
      tree: 11 * Math.pow(0.72, i) * px,
      dots: i < 4 ? [0.22, 0.15, 0.09, 0.04][i] : 0,
      xRoad: 700 + (i === 0 ? 40 : 95 * (i % 2 ? -1 : 1) * Math.pow(0.72, i - 1)),
      yRow: y,
    };
  });
  return FLATS;
};
/** where the ranch road reaches world Z (the first crossing along it, past the guard) */
export const dirtXAtZ = (Z: number) => {
  const P = ROUTE.pts;
  for (let i = 1; i < P.length; i++) {
    if (P[i].s <= ROUTE.sGuard) continue;
    if ((P[i - 1].Z - Z) * (P[i].Z - Z) <= 0 && P[i].Z !== P[i - 1].Z) {
      const u = (Z - P[i - 1].Z) / (P[i].Z - P[i - 1].Z);
      return lerp(P[i - 1].X, P[i].X, u);
    }
  }
  return P[P.length - 1].X;
};
