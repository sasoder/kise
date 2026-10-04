// ---------------------------------------------------------------------------
// kdMotion: the geometry, timing and camera of KdRatioOfInfinity (see the
// component's header for the line, the gestures and the sources). World units
// are page px: the final framing's screen px (k 1.0 on f46, before the
// push-in). x east, y DOWN; the ground at y 930, the gap's middle at x 540.
// ---------------------------------------------------------------------------
import {
  CAPTION_TOP,
  FRAME_W,
  SCREEN_CX,
  SCREEN_CY,
  camScan,
  clamp01,
  hash,
  makeRng,
  makeTrack,
  screenOf,
  smoothstep,
  type Cam,
  type P2,
} from "./incaShared";

// ---------------------------------------------------------------------------
// Timeline (24 fps). In-point 23.00 s on the edit timeline; f = round((t - 23.00) * 24).
// ---------------------------------------------------------------------------
export const FPS = 24;
export const IN_POINT = 23.0;
/** the line runs 23.00 -> 28.08 s = 5.08 s; round(5.08 * 24) = round(121.92) = 122 */
export const LINE_FRAMES = 122;
/** + the 16-frame house tail */
export const DURATION = LINE_FRAMES + 16; // 138
export const LAST = DURATION - 1;
export const W = {
  literally: 0,
  a: 12,
  K: 18,
  D: 20,
  ratio: 23,
  of: 33,
  infinity: 40,
  infinityEnd: 49,
  ten: 96,
  thousand: 105,
  to: 114,
  zero: 117,
  end: 122,
} as const;

// ---------------------------------------------------------------------------
// The dead mark (builder A's dead look; the same values as
// HundredAgainstHundredThousand's hundredShared DEAD_OP / DEAD_R_SCALE)
// ---------------------------------------------------------------------------
export const DEAD_OP = 0.26;
export const DEAD_R_SCALE = 0.85;
/** a living man's dot in this world: the plaza crowd's dot (ambushMotion
 *  crowdR: 1.95 screen px at every framing of the square) */
export const LIVING_R_PX = 1.95;
/** the dead mark's radius at the final framing (world = screen px at k 1) */
export const MARK_R = DEAD_R_SCALE * LIVING_R_PX; // 1.66
export const N_DEAD = 10000;

// ---------------------------------------------------------------------------
// The figure (world units = screen px at the final framing)
// ---------------------------------------------------------------------------
export const GROUND_Y = 930;
/** the two plots, equal widths, each with engraved end ticks */
export const HEAP_PLOT = { x0: 102, x1: 470 }; // K: the heap's plot (cream)
export const PLOT = { x0: 610, x1: 978 }; // D: the empty orange plot (as wide)
export const PLOT_CX = (PLOT.x0 + PLOT.x1) / 2; // 794
export const HEAP_CX = (HEAP_PLOT.x0 + HEAP_PLOT.x1) / 2; // 286
/** the heap: a pile 368 px wide at its skirt and HEAP_H tall (~2.2 : 1), its
 *  rounded crown a little left of the plot's middle */
export const HEAP_H = 140;
export const HEAP_CROWN_X = HEAP_CX - 22;
/** the skirt thins out to nothing this far inside each end tick */
const TICK_CLEAR = 5;
export const RULE_W = 3.2; // the cream rule (world = px at k 1)
export const RULE_W_ORANGE = 4.2; // the orange plot's rule, a touch heavier
export const RULE_CASE = 2.4; // DARK casing (added to the width)
export const TICK_HALF = 11; // the end ticks: small vertical serifs across the rule

/** the ∞ (a lemniscate of Bernoulli stretched 1.25 x vertically) */
export const INF_C: P2 = [540, 640];
export const INF_A = 220; // half-width: 440 wide at the final framing
export const INF_A0 = 64; // its half-width as the pens leave the colon
export const INF_V = 1.25;
export const INF_W = 6; // stroke
export const INF_CASE = 3;

/** the ratio colon: two stacked dots in the gap at the heap's mid-height */
export const COLON_C: P2 = [540, 815];
export const COLON_S = 26; // half the dots' spacing
export const PEN_R = 9; // a colon dot / pen head

/** the numerals (IM Fell English roman; old-style figures: 0 and 1 stand
 *  0.40 em, the comma descends 0.244 em; "10,000" is 2.503 em of ink). Screen
 *  px (NumeralLabel), anchored to the page; the largest size that keeps
 *  "10,000" (and its dark halo) 60 px inside the frame on f137 after the push-in */
export const NUM_PX = 156;
export const NUM_TOP_GAP = 30; // the ground to the digits' tops at the final framing
export const NUM_BASE_Y = GROUND_Y + NUM_TOP_GAP + 0.4 * NUM_PX;
export const NUM_EM_DESC = 0.244;
export const NUM_INK_HALF = { tenK: (2.503 / 2) * NUM_PX, zero: (0.384 / 2) * NUM_PX };

// ---------------------------------------------------------------------------
// Timing of the gestures
// ---------------------------------------------------------------------------
export const T = {
  pour: [-12, 22] as const, // the main pour's landings (bottom up)
  late: [26, 60] as const, // the last stragglers' landings
  colon: [9, W.ratio] as const, // slide-up + fade, landing on "ratio"
  rise: [23.5, W.infinity] as const, // the colon's middle rises to the ∞'s centre
  turn: [23.5, 27.5] as const, // ... and its two dots turn 39 deg onto the crossing's diagonal
  draw: [25.5, W.infinity] as const, // each pen draws its loop; they meet at the crossing on "infinity"
  grow: [24.5, 39] as const, // ... as the ∞ grows from INF_A0 to INF_A
  inkIn: [25.5, 27.5] as const, // the stroke between the pens fades in as they leave
  orange: [36, 46] as const, // the eased cream -> orange crossfade
  absorb: [40, 46] as const, // the pen heads sink into the crossing
  shimmer: 44, // the highlight leaves the crossing
  shimmerPeriod: 40,
  tenK: [88, 100] as const, // "10,000": slide-up from f88, landing ~f100
  zero: [103, W.zero] as const, // "0" lands on "zero"
};

// ---------------------------------------------------------------------------
// THE HEAP: 10,000 rest positions, blue-noise with a variable density
// ---------------------------------------------------------------------------
/** smooth 1D value noise in [-1, 1] */
const vnoise = (x: number, seed: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i, seed) * 2 - 1;
  const b = hash(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
/** a column's place on its flank: 0 at the crown, 1 just inside the end tick
 *  on that side (the two flanks have their own lengths: the crown sits left
 *  of the middle) */
export const heapS = (x: number) => {
  const d = x - HEAP_CROWN_X;
  const L = d < 0 ? HEAP_CROWN_X - HEAP_PLOT.x0 - TICK_CLEAR : HEAP_PLOT.x1 - TICK_CLEAR - HEAP_CROWN_X;
  return Math.abs(d) / L;
};
/** the pile's outline (unscaled): a raised cosine in s (a rounded crown, flanks
 *  at a natural slope, a skirt that runs out tangent to the ground at the
 *  ticks), low harmonics and a gently ragged edge */
const heapEnvRaw = (x: number) => {
  const sx = heapS(x);
  if (sx >= 1) return 0;
  const base = 0.5 * (1 + Math.cos(Math.PI * Math.pow(sx, 1.4)));
  const v = (x - HEAP_CX) / 184;
  const harm = 1 + 0.05 * Math.sin(1.3 * Math.PI * v + 0.7) + 0.03 * Math.sin(2.9 * Math.PI * v + 2.1);
  const rag = 1 + 0.035 * vnoise(v * 11 + 3.3, 41) + 0.02 * vnoise(v * 27 + 1.1, 43);
  return base * harm * rag;
};
const HEAP_ENV_MAX = Math.max(...Array.from({ length: 2001 }, (_, i) => heapEnvRaw(HEAP_PLOT.x0 + ((HEAP_PLOT.x1 - HEAP_PLOT.x0) * i) / 2000)));
/** the heap's crown line above the ground at x: its highest point is HEAP_H */
export const heapEnv = (x: number) => (HEAP_H * heapEnvRaw(x)) / HEAP_ENV_MAX;
/** the heap's density at (x, eta): full inside, densest at the base centre,
 *  a feathered fringe over the crown line, thinning to nothing along the
 *  skirt toward each tick */
const heapRho = (x: number, eta: number) => {
  const sx = heapS(x);
  if (sx >= 1 || eta < 0) return 0;
  const e = heapEnv(x);
  if (e <= 0.3) return 0;
  const q = eta / e;
  const vert = q < 1 ? 1 - 0.6 * Math.pow(q, 1.4) : Math.max(0, 0.4 * (1 - (q - 1) / 0.2));
  const horiz = Math.pow(1 - Math.pow(sx, 2.2), 0.8);
  return vert * horiz;
};

export const N_STRAY = 140; // a few strays on the ground beyond the skirt, inside the ticks
export const N_LATE = 150; // the last few, settling until ~f60

export type Mark = {
  x: number;
  y: number; // rest position (world)
  land: number; // landing frame
  fall: number; // fall duration (frames)
  drop: number; // fall height (world)
  dx: number; // lateral offset at the fall's start (world)
  settle: number; // settle frames (2..3)
  sink: number; // settle depth (world)
};

const buildMarks = (): Mark[] => {
  const rand = makeRng(9127);
  const pts: { x: number; y: number; eta: number; stray: boolean }[] = [];
  // adaptive best-candidate (Mitchell) on a hash grid: each new mark is the
  // best of K candidates drawn from the density, scored by its distance to its
  // nearest neighbour x sqrt(density) (blue noise at a varying spacing)
  const CELL = 3;
  const grid = new Map<number, number[]>();
  const key = (gx: number, gy: number) => gx * 100003 + gy;
  const add = (x: number, y: number) => {
    const k = key(Math.floor(x / CELL), Math.floor(y / CELL));
    const arr = grid.get(k);
    if (arr) arr.push(pts.length - 1);
    else grid.set(k, [pts.length - 1]);
  };
  const nearest = (x: number, y: number, cap: number) => {
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    let best = cap;
    const R = Math.ceil(cap / CELL);
    for (let ring = 0; ring <= R; ring++) {
      for (let j = gy - ring; j <= gy + ring; j++)
        for (let i = gx - ring; i <= gx + ring; i++) {
          if (Math.max(Math.abs(i - gx), Math.abs(j - gy)) !== ring) continue;
          const arr = grid.get(key(i, j));
          if (!arr) continue;
          for (const p of arr) {
            const d = Math.hypot(pts[p].x - x, pts[p].y - y);
            if (d < best) best = d;
          }
        }
      if (best <= ring * CELL) break;
    }
    return best;
  };
  const RHO_MAX = 1.05;
  const sampleHeap = () => {
    for (;;) {
      const x = HEAP_PLOT.x0 + (HEAP_PLOT.x1 - HEAP_PLOT.x0) * rand();
      const eta = rand() * HEAP_H * 1.25;
      const r = heapRho(x, eta);
      if (rand() * RHO_MAX < r) return { x, eta, r };
    }
  };
  const nHeap = N_DEAD - N_STRAY;
  const K = 6;
  for (let n = 0; n < nHeap; n++) {
    let best = { x: 0, eta: 0, s: -1 };
    for (let c = 0; c < K; c++) {
      const cand = sampleHeap();
      const y = GROUND_Y - MARK_R * 0.9 - cand.eta;
      const d = nearest(cand.x, y, 40);
      const s = d * Math.sqrt(cand.r);
      if (s > best.s) best = { x: cand.x, eta: cand.eta, s };
    }
    const x = best.x;
    const y = GROUND_Y - MARK_R * 0.9 - best.eta;
    pts.push({ x, y, eta: best.eta, stray: false });
    add(x, y);
  }
  // the strays: a few lying on the ground beyond the skirt, thinning out
  // before the ticks (s 0.62 ... 0.97: their spread ends inside the plot)
  for (let n = 0; n < N_STRAY; n++) {
    let t = 0;
    for (;;) {
      t = rand();
      if (rand() < Math.pow(1 - t, 1.6)) break;
    }
    const side = rand() < 0.5 ? -1 : 1;
    const L = side < 0 ? HEAP_CROWN_X - HEAP_PLOT.x0 - TICK_CLEAR : HEAP_PLOT.x1 - TICK_CLEAR - HEAP_CROWN_X;
    const x = HEAP_CROWN_X + side * L * (0.62 + 0.35 * t);
    const eta = rand() * 2.2;
    const y = GROUND_Y - MARK_R * 0.9 - eta;
    pts.push({ x, y, eta, stray: true });
    add(x, y);
  }
  // landing order: bottom up (the heap rises self-similar), hashed; strays
  // throughout; N_LATE stragglers from the heap's interior land f26..f60
  const keyOf = pts.map((p, i) => {
    if (p.stray) return 0.12 + 0.8 * hash(i, 7);
    const e = Math.max(4, heapEnv(p.x));
    return Math.min(1.25, p.eta / e) * 0.78 + 0.22 * hash(i, 8);
  });
  const lateIdx = new Set<number>();
  const pool = pts.map((p, i) => ({ i, q: p.stray ? -1 : p.eta / Math.max(4, heapEnv(p.x)) })).filter((o) => o.q > 0.45 && o.q < 0.9);
  for (let n = 0; lateIdx.size < N_LATE && n < 100000; n++) lateIdx.add(pool[Math.floor(hash(n, 91) * pool.length)].i);
  const mainOrder = pts.map((_, i) => i).filter((i) => !lateIdx.has(i)).sort((a, b) => keyOf[a] - keyOf[b]);
  const land = new Float64Array(pts.length);
  mainOrder.forEach((i, r) => {
    const q = r / (mainOrder.length - 1);
    land[i] = T.pour[0] + (T.pour[1] - T.pour[0]) * q;
  });
  [...lateIdx].forEach((i, n) => {
    const w = hash(n, 93);
    land[i] = T.late[0] + (T.late[1] - T.late[0]) * Math.pow(w, 1.7);
  });
  return pts.map((p, i) => {
    const drop = 26 + 50 * hash(i, 3); // 40-120 px on screen at the open (k 1.55)
    const fall = 3 + drop / 18 + 1.2 * hash(i, 4); // 4.4-8.4 f
    const settle = 2 + hash(i, 6);
    const vLand = (1.7 * drop) / fall;
    return {
      x: p.x,
      y: p.y,
      land: land[i],
      fall,
      drop,
      dx: 8 * (hash(i, 5) - 0.5),
      settle,
      sink: Math.min(1.4, (vLand * settle) / 6.75),
    };
  });
};
export const MARKS: Mark[] = buildMarks();

/** a mark at frame f: null before its fall; position + fade (0..1) */
export const markAt = (m: Mark, f: number): { x: number; y: number; op: number } | null => {
  const t0 = m.land - m.fall;
  if (f < t0) return null;
  if (f >= m.land) {
    const tau = f - m.land;
    if (tau >= m.settle) return { x: m.x, y: m.y, op: 1 };
    const s = tau / m.settle;
    return { x: m.x, y: m.y + m.sink * 6.75 * s * (1 - s) * (1 - s), op: 1 };
  }
  const u = (f - t0) / m.fall;
  return { x: m.x + m.dx * (1 - u) * (1 - u), y: m.y - m.drop * (1 - Math.pow(u, 1.7)), op: smoothstep((f - t0) / 2) * (0.35 + 0.65 * u * u * u) };
};

// ---------------------------------------------------------------------------
// THE ∞: the stretched lemniscate at unit half-width, centred on 0. q(t) for t
// in [pi/2, 5pi/2] is the whole figure: the LEFT loop (t pi/2 .. 3pi/2:
// crossing -> up-left -> left tip -> down-left -> crossing) then the RIGHT
// loop (3pi/2 .. 5pi/2: crossing -> up-right -> right tip -> down-right ->
// crossing), straight through the crossing. Pen A (the colon's top dot) draws
// the left loop as above; pen B (the bottom dot) draws the right loop as the
// left one's point reflection through the crossing (crossing -> down-right ->
// right tip -> up-right -> crossing): both turn anticlockwise, and they meet
// head-on at the crossing. While they draw, the figure grows (half-width
// INF_A0 -> INF_A) and rises with the colon's middle to INF_C.
// ---------------------------------------------------------------------------
const lemU = (t: number): P2 => {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const d = 1 + s * s;
  return [c / d, (INF_V * s * c) / d];
};
type Poly = { pts: P2[]; cum: number[]; len: number };
const polyOf = (pts: P2[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
const SEG = 900;
const LOOP_A_U: Poly = polyOf(Array.from({ length: SEG + 1 }, (_, i) => lemU(Math.PI / 2 + (Math.PI * i) / SEG)));
const LOOP_B_U: Poly = polyOf(LOOP_A_U.pts.map(([x, y]) => [-x, -y] as P2));
/** one loop's length at unit half-width */
export const LOOP_LEN_U = LOOP_A_U.len;
/** the finished figure at its final size and place (the highlight's path) */
export const INF_FULL: Poly = polyOf(
  Array.from({ length: 2 * SEG + 1 }, (_, i) => {
    const [x, y] = lemU(Math.PI / 2 + (Math.PI * i) / SEG);
    return [INF_C[0] + INF_A * x, INF_C[1] + INF_A * y] as P2;
  }),
);

const locate = (p: Poly, s: number) => {
  const t = Math.max(0, Math.min(p.len, s));
  let lo = 0;
  let hi = p.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (p.cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  return { lo, hi, u: (t - p.cum[lo]) / (p.cum[hi] - p.cum[lo] || 1) };
};
const polyAt = (p: Poly, s: number): P2 => {
  const { lo, hi, u } = locate(p, s);
  return [p.pts[lo][0] + (p.pts[hi][0] - p.pts[lo][0]) * u, p.pts[lo][1] + (p.pts[hi][1] - p.pts[lo][1]) * u];
};
/** the polyline's points between arclengths s0 and s1 */
const polyPts = (p: Poly, s0: number, s1: number): P2[] => {
  const A = locate(p, s0);
  const B = locate(p, s1);
  const out: P2[] = [polyAt(p, s0)];
  for (let i = A.hi; i <= B.lo; i++) out.push(p.pts[i]);
  out.push(polyAt(p, s1));
  return out;
};
const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
export const INF_D = dOf(INF_FULL.pts);

/** the colon's middle, rising to the ∞'s centre (also the growing ∞'s centre) */
export const infCentre = (f: number): P2 => {
  const w = smoothstep((f - T.rise[0]) / (T.rise[1] - T.rise[0]));
  return [COLON_C[0] + (INF_C[0] - COLON_C[0]) * w, COLON_C[1] + (INF_C[1] - COLON_C[1]) * w];
};
/** the ∞'s half-width as it grows */
export const infScale = (f: number) => INF_A0 + (INF_A - INF_A0) * smoothstep((f - T.grow[0]) / (T.grow[1] - T.grow[0]));

/** where the pens start drawing: COLON_S along each loop from the crossing, at the start size */
const DRAW_U0 = COLON_S / (INF_A0 * LOOP_LEN_U);
/** each pen's fraction (0..1) of its loop at frame f: an even stroke, eased in
 *  over 3 f from the colon's turn and out over 4.5 f into the meeting */
const DRAW_RAMP = { in: 3, out: 4.5 };
const DRAW_TRACK = (() => {
  const [a, b] = T.draw;
  const SUB = 32;
  const n = Math.round((b - a) * SUB);
  const v = (t: number) => {
    const x = t - a;
    const r1 = x < DRAW_RAMP.in ? 0.5 * (1 - Math.cos((Math.PI * x) / DRAW_RAMP.in)) : 1;
    const y = b - t;
    const r2 = y < DRAW_RAMP.out ? 0.5 * (1 - Math.cos((Math.PI * y) / DRAW_RAMP.out)) : 1;
    return Math.max(0, r1 * r2);
  };
  const acc = [0];
  for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + v(a + (i - 0.5) / SUB) / SUB);
  const total = acc[n];
  return (f: number) => {
    const p = (f - a) * SUB;
    const i = Math.max(0, Math.min(n - 1, Math.floor(p)));
    const u = clamp01(p - i);
    return DRAW_U0 + ((1 - DRAW_U0) * (acc[i] + (acc[i + 1] - acc[i]) * u)) / total;
  };
})();
export const drawU = (f: number) => (f <= T.draw[0] ? DRAW_U0 : f >= T.draw[1] ? 1 : DRAW_TRACK(f));

/** a point of a unit loop placed at the ∞'s centre and size on frame f */
const place = (q: P2, c: P2, a: number): P2 => [c[0] + a * q[0], c[1] + a * q[1]];

/** the angle (deg, maths convention, y up) of pen A's branch at the crossing */
const BRANCH_DEG = (Math.atan2(INF_V, 1) * 180) / Math.PI; // 51.3: up-left is 180 - this
const COLON_DEG0 = 90; // pen A straight above the colon's middle
const COLON_DEG1 = 180 - BRANCH_DEG; // pen A on the up-left branch
/** the two pen heads (A, B) at frame f: the colon, its rise and turn, then the draw */
export const pensAt = (f: number): { a: P2; b: P2 } => {
  const c = infCentre(f);
  const deg = COLON_DEG0 + (COLON_DEG1 - COLON_DEG0) * smoothstep((f - T.turn[0]) / (T.turn[1] - T.turn[0]));
  const r = (deg * Math.PI) / 180;
  const dumbA: P2 = [c[0] + COLON_S * Math.cos(r), c[1] - COLON_S * Math.sin(r)];
  const drawA = place(polyAt(LOOP_A_U, drawU(f) * LOOP_LEN_U), c, infScale(f));
  const beta = smoothstep((f - T.draw[0]) / 2.5);
  const a: P2 = [dumbA[0] + (drawA[0] - dumbA[0]) * beta, dumbA[1] + (drawA[1] - dumbA[1]) * beta];
  return { a, b: [2 * c[0] - a[0], 2 * c[1] - a[1]] };
};
/** the ink while the pens draw: ONE path from pen A back along the left loop to
 *  the crossing and on along the right loop to pen B (the two strokes joined
 *  through the crossing from the first frame: the colon's two dots linked by
 *  the crossing's diagonal), at the ∞'s current size and place, with its fade-in */
export const drawingInk = (f: number) => {
  const s = drawU(f) * LOOP_LEN_U;
  const c = infCentre(f);
  const a = infScale(f);
  const p = pensAt(f);
  const pts: P2[] = [
    p.a,
    ...polyPts(LOOP_A_U, 0, s)
      .reverse()
      .map((q) => place(q, c, a)),
    ...polyPts(LOOP_B_U, 0, s).map((q) => place(q, c, a)),
    p.b,
  ];
  return { d: dOf(pts), op: smoothstep((f - T.inkIn[0]) / (T.inkIn[1] - T.inkIn[0])) };
};
/** the colon's entrance (slide-up in screen px + fade) */
export const colonEntrance = (f: number) => {
  const [a, b] = T.colon;
  const u = clamp01((f - a) / (b - a));
  const ease = 1 - Math.pow(1 - u, 3.2);
  return { dy: 24 * (1 - ease), op: smoothstep((f - a) / 12) };
};
/** cream -> orange (0..1) */
export const orangeT = (f: number) => smoothstep((f - T.orange[0]) / (T.orange[1] - T.orange[0]));
/** the pen heads' radius: full, then sinking into the crossing */
export const penR = (f: number) => PEN_R * (1 - smoothstep((f - T.absorb[0]) / (T.absorb[1] - T.absorb[0])));
/** the travelling highlight: its arclength on INF_FULL and its strength */
export const shimmerAt = (f: number) => {
  const t = f - T.shimmer;
  if (t <= 0) return { s: 0, amp: 0 };
  const s = ((t / T.shimmerPeriod) * INF_FULL.len) % INF_FULL.len;
  return { s, amp: smoothstep(t / 8) };
};

// ---------------------------------------------------------------------------
// THE CAMERA: three channels as integrals of cosine-tapered velocity bumps
// (C1 end to end): ln k, and the world point (Sx, Sy) held at the screen
// anchor (540, 640), the ∞'s place. cam = { k, cx: Sx, cy: Sy + 320 / k }.
//   the glide right  f-26..f50   the heap -> the gap -> the whole figure
//   the pull-back    f14..f50    k 1.55 -> 1.0 (lands ~f46), the figure on its axis
//   the push-in      f36..f210   +8 % from f46 to f137 on the ∞ (held at
//                                (540, 640)), one slow continuous move, still
//                                moving on the last frame
// ---------------------------------------------------------------------------
export const ANCHOR: P2 = [540, 640];
export const K_OPEN = 1.55;
export const K_FINAL = 1.0;
export const PUSH = 1.08;
/** the open: the heap's centre of mass (~(272, 885)) at screen (540, 835) */
export const S_OPEN: P2 = [HEAP_CROWN_X + 8, 885 - (835 - ANCHOR[1]) / K_OPEN];
/** the final framing: the ∞ at the anchor, the figure on x 540, the ground at y 930 */
export const S_FINAL: P2 = [INF_C[0], INF_C[1]];
const GLIDE: [number, number] = [-26, 50];
const SY_W: [number, number] = [-10, 50];
const PULL: [number, number] = [8, 47];
const PUSH_W: [number, number] = [36, 210];
const PUSH_TAPER = 0.45;
const unit = (w: [number, number], taper = 1) => makeTrack([[w[0], w[1], 1, taper]], 0);
const U_GLIDE = unit(GLIDE, 0.9);
const U_SY = unit(SY_W);
const U_PULL = unit(PULL);
const U_PUSH = unit(PUSH_W, PUSH_TAPER);
const SX_AREA = (S_FINAL[0] - S_OPEN[0]) / (U_GLIDE(400) - U_GLIDE(0));
const SY_AREA = (S_FINAL[1] - S_OPEN[1]) / (U_SY(400) - U_SY(0));
const PULL_AREA = Math.log(K_FINAL / K_OPEN);
const PUSH_AREA = (Math.log(PUSH) - PULL_AREA * (U_PULL(LAST) - U_PULL(46))) / (U_PUSH(LAST) - U_PUSH(46));
const LNK = makeTrack(
  [
    [PULL[0], PULL[1], PULL_AREA, 1],
    [PUSH_W[0], PUSH_W[1], PUSH_AREA, PUSH_TAPER],
  ],
  Math.log(K_OPEN),
);
const SX = makeTrack([[GLIDE[0], GLIDE[1], SX_AREA, 0.9]], S_OPEN[0]);
const SY = makeTrack([[SY_W[0], SY_W[1], SY_AREA, 1]], S_OPEN[1]);
/** the authored camera (no sway) */
export const camAt = (f: number): Cam => {
  const k = Math.exp(LNK(f));
  return { k, cx: SX(f) - (ANCHOR[0] - SCREEN_CX) / k, cy: SY(f) - (ANCHOR[1] - SCREEN_CY) / k };
};
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION }, (_, f) => camAt(f));

// ---------------------------------------------------------------------------
// Checks, every frame: the caption band, the 60 px edge margin from f46 on,
// the numerals' feet once landed, the count, the final framing
// ---------------------------------------------------------------------------
const SWAY = { x: 3, y: 5 };
export const NUM_LANDED_MAX_Y = 1110;
/** every element stays this far inside the frame from the pull-back's landing to the end */
export const EDGE_MARGIN = 60;
const MARGIN_FROM = 46;
const NUM_HALO = 0.035; // NumeralLabel's dark halo (stroke 0.07 em), each side, em
const TICK_HW = (RULE_W_ORANGE + RULE_CASE) / 2;
const INF_HW = (INF_W + INF_CASE) / 2;
(() => {
  if (MARKS.length !== N_DEAD) throw new Error(`KdRatioOfInfinity: ${MARKS.length} dead marks, want ${N_DEAD}`);
  let mx0 = Infinity;
  let mx1 = -Infinity;
  for (const m of MARKS) {
    if (m.y > GROUND_Y - MARK_R * 0.5) throw new Error("KdRatioOfInfinity: a dead mark lies below the ground");
    if (m.x - MARK_R < HEAP_PLOT.x0 || m.x + MARK_R > HEAP_PLOT.x1) throw new Error("KdRatioOfInfinity: a dead mark lies outside the heap's ticks");
    mx0 = Math.min(mx0, m.x - MARK_R);
    mx1 = Math.max(mx1, m.x + MARK_R);
  }
  const infTop = Math.min(...INF_FULL.pts.map((q) => q[1])) - INF_HW;
  for (let f = 0; f < DURATION; f++) {
    const cam = CAM_TRACK[f];
    const k = cam.k;
    // the ground's ticks are the figure's lowest strokes
    const gy = screenOf([0, GROUND_Y + TICK_HALF], cam)[1] + TICK_HW * k + SWAY.y;
    if (gy >= CAPTION_TOP) throw new Error(`KdRatioOfInfinity: the ground enters the caption band at f${f} (${gy.toFixed(1)})`);
    const numOn = f >= T.tenK[0];
    if (numOn) {
      // the comma's descent + the slide-up's start offset + the sway
      const low = screenOf([0, NUM_BASE_Y], cam)[1] + NUM_EM_DESC * NUM_PX + 24 + SWAY.y;
      if (low >= CAPTION_TOP) throw new Error(`KdRatioOfInfinity: a numeral enters the caption band at f${f} (${low.toFixed(1)})`);
    }
    if (f >= T.tenK[1]) {
      const landed = screenOf([0, NUM_BASE_Y], cam)[1] + NUM_EM_DESC * NUM_PX + SWAY.y;
      if (landed > NUM_LANDED_MAX_Y) throw new Error(`KdRatioOfInfinity: a landed numeral's foot below y ${NUM_LANDED_MAX_Y} at f${f} (${landed.toFixed(1)})`);
    }
    if (f >= MARGIN_FROM) {
      // the leftmost and rightmost ink of every element, and the figure's top
      const xs: [string, number, number][] = [
        ["the heap's plot", screenOf([HEAP_PLOT.x0, 0], cam)[0] - TICK_HW * k, screenOf([HEAP_PLOT.x1, 0], cam)[0] + TICK_HW * k],
        ["the orange plot", screenOf([PLOT.x0, 0], cam)[0] - TICK_HW * k, screenOf([PLOT.x1, 0], cam)[0] + TICK_HW * k],
        ["the dead", screenOf([mx0, 0], cam)[0], screenOf([mx1, 0], cam)[0]],
        ["the infinity", screenOf([INF_C[0] - INF_A, 0], cam)[0] - INF_HW * k, screenOf([INF_C[0] + INF_A, 0], cam)[0] + INF_HW * k],
      ];
      if (numOn) {
        const half = NUM_INK_HALF.tenK + NUM_HALO * NUM_PX;
        const c10 = screenOf([HEAP_CX, 0], cam)[0];
        const c0 = screenOf([PLOT_CX, 0], cam)[0];
        xs.push(["10,000", c10 - half, c10 + half]);
        xs.push(["0", c0 - NUM_INK_HALF.zero - NUM_HALO * NUM_PX, c0 + NUM_INK_HALF.zero + NUM_HALO * NUM_PX]);
      }
      for (const [name, l, r] of xs)
        if (l - SWAY.x < EDGE_MARGIN || r + SWAY.x > FRAME_W - EDGE_MARGIN)
          throw new Error(`KdRatioOfInfinity: ${name} is within ${EDGE_MARGIN} px of the frame's edge at f${f} (${(l - SWAY.x).toFixed(1)} .. ${(r + SWAY.x).toFixed(1)})`);
      const top = screenOf([0, infTop], cam)[1] - SWAY.y;
      if (top < EDGE_MARGIN) throw new Error(`KdRatioOfInfinity: the infinity is within ${EDGE_MARGIN} px of the top at f${f}`);
    }
  }
  // the final framing: the two plots on the frame's axis
  const c = CAM_TRACK[46];
  const mid = (screenOf([HEAP_PLOT.x0, 0], c)[0] + screenOf([PLOT.x1, 0], c)[0]) / 2;
  if (Math.abs(mid - SCREEN_CX) > 4) throw new Error(`KdRatioOfInfinity: the final framing is off the axis (${mid.toFixed(1)})`);
})();

/** camScan of the authored track over the cut, with the figure's fixed points */
export const scanCamera = () =>
  camScan(camAt, 0, DURATION, [
    [HEAP_CROWN_X, 885],
    INF_C,
    [PLOT_CX, GROUND_Y],
  ]);
