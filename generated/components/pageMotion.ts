// ---------------------------------------------------------------------------
// pageMotion: the shared page world of ConquistadorsMuster (C2) and
// AgainstAlmostHundredThousand (A2), the two cuts before KdRatioOfInfinity in
// "Sheppard_Cajamarca_infinite_KD". The world is KdRatioOfInfinity's (world
// units = its final framing's screen px; ground at y 930; the heap plot x
// 102-470, the gap, the orange plot x 610-978). The layout constants and the
// 10,000 heap slots are imported from kdMotion.ts (read-only), never copied.
//
// PAGE TIME tau = A2's frame. C2's frame f is tau = f - 91 (C2 ends where A2
// begins): the breath, the sway and the opening camera are functions of tau,
// so C2's last frame is A2's opening state at tau = -1.
// ---------------------------------------------------------------------------
import {
  CAPTION_TOP,
  FRAME_W,
  SCREEN_CX,
  SCREEN_CY,
  CONTENT_Y,
  camScan,
  clamp01,
  hash,
  makeRng,
  makeTrack,
  screenOf,
  smootherstep,
  smoothstep,
  type Bump,
  type Cam,
  type P2,
} from "./incaShared";
import { GROUND_Y, HEAP_PLOT, MARKS, MARK_R, NUM_BASE_Y, NUM_PX, PLOT, PLOT_CX } from "./kdMotion";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Timelines
// ---------------------------------------------------------------------------
/** A2 "AgainstAlmostHundredThousand": in-point 7.54 s; f = round((t - 7.54) * 24);
 *  the line ends on "encounter" f216 (16.54 s): 216 + the 16-frame tail */
export const A2 = {
  IN: 7.54,
  DURATION: 216 + 16, // 232
  W: {
    hundred: 0,
    something: 8,
    against: 17,
    almost: 32,
    hundredThousand: 40, // ends f57
    what: 61,
    astonishing: 67,
    that: 93,
    these: 96,
    hundred2: 101,
    conquistadors: 105,
    kill: 119,
    close: 128,
    tenThousand: 136,
    of: 149,
    enemy: 156, // ends f161
    they: 165,
    suffer: 169,
    zero: 174,
    casualties: 180, // ends f191
    this: 191,
    first: 200,
    encounter: 205, // ends f216
  },
} as const;
/** C2 "ConquistadorsMuster": in-point 3.74 s; f = round((t - 3.74) * 24);
 *  DURATION = round((7.54 - 3.74) * 24) = 91: C2's frame 91 would be A2's frame 0 */
export const C2 = {
  IN: 3.74,
  DURATION: 91,
  W: { he: 0, has: 2, some: 7, n160: 12, n190: 36, conquistadors: 55, so: 83 },
} as const;
export const C2_TO_TAU = -C2.DURATION; // tau = f - 91

// ---------------------------------------------------------------------------
// THE LOOK (KdRatioOfInfinity's): cream dots = men (1 dot = 1 man), the dead
// = 0.26 / MARK_R, orange = Pizarro's side
// ---------------------------------------------------------------------------
export const LIVE_OP = 0.94; // INK_FULL: the living host's rung
export const HOST_R = 1.15; // a living cream man's radius at k 1 (with daylight)
export const CO_R = 1.6; // an orange man's radius at k 1
export const NUM_SIZE = NUM_PX; // 156, KdRatioOfInfinity's numerals
/** the living breathe: ~0.3 px of drift on each man's own slow phase (tau) */
export const breath = (i: number, tau: number, seed = 0): P2 => [
  0.3 * Math.sin(tau / (19 + 9 * hash(i, 501 + seed)) + 6.283 * hash(i, 502 + seed)),
  0.3 * Math.sin(tau / (21 + 10 * hash(i, 503 + seed)) + 6.283 * hash(i, 504 + seed)),
];

// ---------------------------------------------------------------------------
// THE COMPANY: 168 orange men (62 horse + 106 foot) standing as a hand-set
// block on the orange plot: 18 files x 10 ranks, ~70 x 40 px at k 1, rounded
// corners (3 men off each corner), slight jitter. Facing the host (left):
// the 62 riders are the front files (0-6, less two).
// ---------------------------------------------------------------------------
export const CO = { files: 18, ranks: 10, w: 70, h: 40, cx: PLOT_CX, foot: GROUND_Y - 2.4 };
export type Slot = { x: number; y: number; file: number; rank: number; rider: boolean };
export const COMPANY: Slot[] = (() => {
  const out: Slot[] = [];
  const dx = CO.w / (CO.files - 1);
  const dy = CO.h / (CO.ranks - 1);
  let id = 0;
  for (let f = 0; f < CO.files; f++)
    for (let r = 0; r < CO.ranks; r++) {
      const a = Math.min(f, CO.files - 1 - f);
      const b = Math.min(r, CO.ranks - 1 - r);
      if ((a === 0 && b <= 1) || (a === 1 && b === 0)) continue; // rounded corners
      out.push({
        x: CO.cx - CO.w / 2 + f * dx + 0.7 * (hash(id, 11) - 0.5),
        y: CO.foot - (CO.ranks - 1 - r) * dy + 0.7 * (hash(id, 12) - 0.5),
        file: f,
        rank: r,
        rider: f <= 6 && !(f === 6 && (r === 4 || r === 5)),
      });
      id++;
    }
  return out;
})();
export const N_CO = COMPANY.length; // 168
export const N_RIDERS = COMPANY.filter((s) => s.rider).length; // 62
export const CO_CENTRE: P2 = [CO.cx, CO.foot - CO.h / 2];
/** the "168" label: under the block, screen-sized, a fixed screen offset below the ground */
export const LABEL168 = { x: CO.cx, y: GROUND_Y, dy: 30 + 0.59 * NUM_SIZE }; // the 8's top 30 px under the ground

// ---------------------------------------------------------------------------
// THE HOST: 86,000 living cream men, one vast organic feathered mound on the
// cream ground left of the orange plot: ~2,500 px wide, ~480 px tall at its
// crown (x ~-300), an undulating skyline, a broad shoulder over the heap's
// plot and a sloping right flank ending at x ~470, a long tail running far
// left. ~0.11 men / px^2 (daylight at k 1), the front over the heap's plot
// pressed a little denser (<= 1.35x). Random sequential placement with a
// density-scaled exclusion (no clumps).
// ---------------------------------------------------------------------------
export const HOST_N = 86000;
export const HOST_X0 = -2030;
export const HOST_X1 = 470;
export const HOST_CROWN_X = -300;
/** the right flank runs down from the shoulder (x 220) to the foot (x 470) */
const HOST_SHOULDER_X = 220;
export const HOST_H = 480;
/** the kill zone: the host over the heap's plot */
export const KILL_X0 = HEAP_PLOT.x0;
const vnoise = (x: number, seed: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i, seed) * 2 - 1;
  const b = hash(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
/** the host's crown line above the ground at x */
const hostBody = (x: number) => {
  const w = x < HOST_CROWN_X ? 1200 : 1100;
  const d = (x - HOST_CROWN_X) / w;
  return HOST_H * Math.exp(-d * d) * smoothstep((x - HOST_X0) / 320);
};
export const hostEnv = (x: number) => {
  if (x <= HOST_X0 || x >= HOST_X1) return 0;
  let e: number;
  if (x <= HOST_SHOULDER_X) e = hostBody(x);
  else {
    const s = (HOST_X1 - x) / (HOST_X1 - HOST_SHOULDER_X);
    e = hostBody(HOST_SHOULDER_X) * (1 - Math.pow(1 - s, 1.7)) * (0.35 + 0.65 * smoothstep(s / 0.35));
  }
  const harm = 1 + 0.13 * Math.sin(x / 215 + 0.9) + 0.07 * Math.sin(x / 83 + 2.3) + 0.035 * Math.sin(x / 31 + 0.2);
  // the right flank is ragged: knots and gaps of men, never a cliff face
  const fl = smoothstep((x - (HOST_SHOULDER_X - 60)) / 120);
  const rag = 1 + (0.03 + 0.12 * fl) * vnoise(x / 23 + 7.7, 61) + (0.02 + 0.05 * fl) * vnoise(x / 11 + 1.3, 63);
  return e * harm * rag;
};
/** relative density at (x, height): fuller near the ground, a feathered fringe
 *  over the crown line, a little denser toward the front (the host pressed
 *  toward the square) */
const hostW0 = (x: number, h: number) => {
  if (h < 0) return 0;
  const e = hostEnv(x);
  const q = e > 0.5 ? h / e : 99;
  const vert = q < 1 ? 1 - 0.5 * Math.pow(q, 1.3) : Math.max(0, 0.5 * (1 - (q - 1) / 0.14));
  // a feathered skirt off the right flank: thinner and thinner ahead of it,
  // a few stragglers standing out on the ground
  if (x < HOST_SHOULDER_X) return vert;
  const ahead = h < hostEnv(x - 14) ? 0.32 : h < hostEnv(x - 32) ? 0.14 : h < 40 && h < hostEnv(x - 60) + 30 ? 0.05 : 0;
  return Math.max(vert, ahead);
};
/** the riders reach heights up to ~REACH_TOP over the ground */
const REACH_TOP = 420;
/** over the heap's plot the front stands as deep as the heap it will become:
 *  each column holds >= MATCH x the heap slots below it within the riders'
 *  reach, so the dead fall (nearly) straight down into their slots */
const MATCH = 1.12;
/** ... but never pressed more than this (daylight) */
const BOOST_MAX = 1.35;
const DX = 4;
const DH = 6;
const colIntegral = (x: number, top: number, w: (x: number, h: number) => number) => {
  let a = 0;
  for (let h = 0; h < top; h += DH) a += w(x, h + DH / 2) * DH;
  return a;
};
const HEAP_COL: (x: number) => number = (() => {
  const x0 = HEAP_PLOT.x0 - 30;
  const n = HEAP_PLOT.x1 - HEAP_PLOT.x0 + 60;
  const raw = new Float64Array(n);
  for (const m of MARKS) {
    const b = Math.floor(m.x - x0);
    if (b >= 0 && b < n) raw[b]++;
  }
  const sm = new Float64Array(n);
  const SIG = 7;
  for (let i = 0; i < n; i++) {
    let a = 0;
    let wsum = 0;
    for (let j = Math.max(0, i - 3 * SIG); j <= Math.min(n - 1, i + 3 * SIG); j++) {
      const g = Math.exp(-((i - j) * (i - j)) / (2 * SIG * SIG));
      a += raw[j] * g;
      wsum += g;
    }
    sm[i] = a / wsum;
  }
  return (x: number) => {
    const p = x - x0;
    const i = Math.max(0, Math.min(n - 2, Math.floor(p)));
    const u = clamp01(p - i);
    return sm[i] + (sm[i + 1] - sm[i]) * u;
  };
})();
const HOST_FIT = (() => {
  // two passes: the base density scale, the front's boost per column, re-normalised
  let boost: (x: number) => number = () => 1;
  let rho0 = 0;
  for (let pass = 0; pass < 3; pass++) {
    let integral = 0;
    for (let x = HOST_X0; x < HOST_X1; x += DX) integral += colIntegral(x + DX / 2, HOST_H * 1.4, hostW0) * boost(x + DX / 2) * DX;
    rho0 = HOST_N / integral;
    const r0 = rho0;
    // the raw boost per column, then smoothed (sigma 14 px) so the pressed front has no seam
    const bx0 = Math.floor(HEAP_PLOT.x0 - 80);
    const bn = Math.floor(HEAP_PLOT.x1 + 80) - bx0;
    const raw = new Float64Array(bn);
    for (let j = 0; j < bn; j++) {
      const x = bx0 + j + 0.5;
      const have = r0 * colIntegral(x, Math.min(REACH_TOP, hostEnv(x) * 1.15), hostW0);
      raw[j] = have > 0 ? Math.min(BOOST_MAX, Math.max(1, (MATCH * HEAP_COL(x)) / have)) : 1;
    }
    const sm = new Float64Array(bn);
    for (let j = 0; j < bn; j++) {
      let a = 0;
      let ws = 0;
      for (let q = Math.max(0, j - 42); q <= Math.min(bn - 1, j + 42); q++) {
        const g = Math.exp(-((q - j) * (q - j)) / (2 * 14 * 14));
        a += raw[q] * g;
        ws += g;
      }
      sm[j] = a / ws;
    }
    boost = (x: number) => {
      const j = Math.floor(x - bx0);
      return j >= 0 && j < bn ? sm[j] : 1;
    };
  }
  return { rho0, boost };
})();
const hostW = (x: number, h: number) => hostW0(x, h) * HOST_FIT.boost(x);
export type Host = { x: Float64Array; y: Float64Array; n: number };
export const HOST: Host = (() => {
  const rho0 = HOST_FIT.rho0;
  let wMax = 0;
  for (let x = HOST_X0; x < HOST_X1; x += 2) for (let h = 0; h < HOST_H * 1.4; h += 3) wMax = Math.max(wMax, hostW(x, h));
  const rand = makeRng(48611);
  const xs = new Float64Array(HOST_N);
  const ys = new Float64Array(HOST_N);
  const CELL = 4;
  const grid = new Map<number, number[]>();
  const key = (gx: number, gy: number) => gx * 1000003 + gy;
  let n = 0;
  let tries = 0;
  while (n < HOST_N && tries < HOST_N * 40) {
    tries++;
    const x = HOST_X0 + (HOST_X1 - HOST_X0) * rand();
    const h = HOST_H * 1.4 * rand();
    const w = hostW(x, h);
    if (rand() * wMax >= w) continue;
    const spacing = Math.sqrt(1 / (0.866 * rho0 * w));
    const dmin = 0.66 * spacing;
    const y = GROUND_Y - HOST_R * 0.9 - h;
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    const R = Math.ceil(dmin / CELL);
    let ok = true;
    for (let j = gy - R; j <= gy + R && ok; j++)
      for (let i = gx - R; i <= gx + R && ok; i++) {
        const arr = grid.get(key(i, j));
        if (!arr) continue;
        for (const p of arr)
          if (Math.hypot(xs[p] - x, ys[p] - y) < dmin) {
            ok = false;
            break;
          }
      }
    if (!ok) continue;
    xs[n] = x;
    ys[n] = y;
    const k = key(gx, gy);
    const arr = grid.get(k);
    if (arr) arr.push(n);
    else grid.set(k, [n]);
    n++;
  }
  if (n < HOST_N) throw new Error(`pageMotion: placed only ${n} of the host`);
  return { x: xs, y: ys, n };
})();

// ---------------------------------------------------------------------------
// THE RIDERS: the 62 front files leave the block as a compact low wedge along
// the ground (three dots high, its nose leading), gallop left over the gap and
// the heap's plot and plunge into the BASE of the host's flank, wheel (the
// wedge turns about its middle: seen from the side it closes and reopens
// nose-right) and gallop back along the ground into their own slots by f166.
// One C1 track for the wedge's middle (two tapered velocity bumps, out and
// back, overlapping through the turn), the wheel eased over 12 f.
// ---------------------------------------------------------------------------
const RIDER_IDX = COMPANY.map((s, i) => (s.rider ? i : -1)).filter((i) => i >= 0);
export { RIDER_IDX };
const W_DX = 4.1;
const W_DY = 4.3;
const W_FOOT = GROUND_Y - CO_R - 1;
/** the wedge (x relative to its middle, nose at -WEDGE_L / 2; y absolute): the
 *  nose 1 dot, then 2, then 3 dots high; a column of 2 at the tail */
const WEDGE: P2[] = (() => {
  const cols: number[][] = [[1], [0, 1]];
  for (let c = 2; c <= 20; c++) cols.push([0, 1, 2]);
  cols.push([0, 1]);
  const L = (cols.length - 1) * W_DX;
  const out: P2[] = [];
  cols.forEach((rows, c) =>
    rows.forEach((r) => out.push([c * W_DX - L / 2 + 0.5 * (hash(out.length, 41) - 0.5), W_FOOT - r * W_DY - 0.4 * hash(out.length, 42)])),
  );
  return out;
})();
export const WEDGE_L = 21 * W_DX;
/** rider k (front file first) takes wedge place k (nose first) */
const RIDER_WEDGE: number[] = (() => {
  const byFile = RIDER_IDX.map((ci, k) => k).sort((a, b) => COMPANY[RIDER_IDX[a]].file - COMPANY[RIDER_IDX[b]].file || COMPANY[RIDER_IDX[b]].rank - COMPANY[RIDER_IDX[a]].rank);
  const out = new Array<number>(RIDER_IDX.length);
  byFile.forEach((k, j) => (out[k] = j));
  return out;
})();
export const RIDE = { depart: 99, home: 166, out: [99, 141] as [number, number], back: [127, 166] as [number, number], noseMin: 150, formIn: 10, formOut: 10 };
/** the riders' block middle (where the wedge forms and comes home) */
export const RIDE_HOME: P2 = (() => {
  const xs = RIDER_IDX.map((i) => COMPANY[i].x);
  const ys = RIDER_IDX.map((i) => COMPANY[i].y);
  return [xs.reduce((a, v) => a + v, 0) / xs.length, ys.reduce((a, v) => a + v, 0) / ys.length];
})();
const RIDE_X = (() => {
  // solve the out/back area so the nose's leftmost point is RIDE.noseMin
  const make = (A: number) =>
    makeTrack(
      [
        [RIDE.out[0], RIDE.out[1], -A, 0.55],
        [RIDE.back[0], RIDE.back[1], A, 0.55],
      ],
      RIDE_HOME[0],
      -20,
      260,
      16,
    );
  let lo = 100;
  let hi = 1200;
  for (let it = 0; it < 50; it++) {
    const A = (lo + hi) / 2;
    const tr = make(A);
    let mn = Infinity;
    for (let t = RIDE.out[0]; t <= RIDE.back[1]; t += 0.25) mn = Math.min(mn, tr(t));
    if (mn - WEDGE_L / 2 > RIDE.noseMin) lo = A;
    else hi = A;
  }
  return make((lo + hi) / 2);
})();
/** the turn: the moment the wedge's middle is furthest left */
export const RIDE_TURN = (() => {
  let mn = Infinity;
  let at = 0;
  for (let t = RIDE.out[0]; t <= RIDE.back[1]; t += 0.25) {
    const x = RIDE_X(t);
    if (x < mn) [mn, at] = [x, t];
  }
  return at;
})();
const wheel = (tau: number) => Math.PI * smootherstep((tau - (RIDE_TURN - 6)) / 12);
const formW = (tau: number) =>
  smoothstep((tau - RIDE.depart) / RIDE.formIn) * (1 - smoothstep((tau - (RIDE.home - RIDE.formOut)) / RIDE.formOut));
/** the wedge's nose x at tau (while it rides left) */
export const noseX = (tau: number) => RIDE_X(tau) - (WEDGE_L / 2) * Math.cos(wheel(tau));
/** a rider's position at tau (null when standing in his slot) */
export const riderAt = (k: number, tau: number): P2 | null => {
  if (tau <= RIDE.depart || tau >= RIDE.home) return null;
  const slot = COMPANY[RIDER_IDX[k]];
  const wpos = WEDGE[RIDER_WEDGE[k]];
  const w = formW(tau);
  const bob = 0.8 * Math.sin(tau * 1.1 + 6.283 * hash(k, 31)) * w;
  const x = RIDE_X(tau) + (1 - w) * (slot.x - RIDE_HOME[0]) + w * wpos[0] * Math.cos(wheel(tau));
  const y = (1 - w) * slot.y + w * (wpos[1] - Math.abs(bob));
  return [x, y];
};

// ---------------------------------------------------------------------------
// THE KILL: the riders undercut the flank. A man of the kill zone dies when
// the wedge's nose has passed under his column, the higher the later (the
// column slumps from the base up at V_UP): the base falls first and the men
// above slide down after them into the heap, like an undercut sand bank. Left
// of where the wedge turned, the slump runs on a little (V_SIDE). The 10,000
// heap slots are filled lowest first, each by the nearest reached man (in x)
// standing at or above it: the lowest of a column take its lowest slots, so
// every dead man lands below where he stood and the heap is whole where they
// stood. The rest of the reached flee.
// ---------------------------------------------------------------------------
export const KILL_LAST = A2.W.enemy; // every one of the 10,000 has fallen (landed) by "enemy"
const V_UP = 42; // world px / f: the slump climbing a column
const V_SIDE = 24; // world px / f: the slump running on past the turn
export type Fate = { reach: Float64Array; slot: Int32Array; kill: Float64Array; fall: Float64Array };
/** when the nose first passes under x (riding left) */
const NOSE_AT: (x: number) => number = (() => {
  const ts: number[] = [];
  const xs: number[] = [];
  for (let t = RIDE.depart; t <= RIDE_TURN; t += 0.125) {
    ts.push(t);
    xs.push(noseX(t));
  }
  const xmin = Math.min(...xs);
  return (x: number) => {
    if (x < xmin) return RIDE_TURN + (xmin - x) / V_SIDE;
    for (let i = 0; i < xs.length; i++) if (xs[i] <= x) return ts[i];
    return RIDE_TURN;
  };
})();
export const FATE: Fate = (() => {
  const n = HOST.n;
  const reach = new Float64Array(n).fill(Infinity);
  const zone: number[] = [];
  for (let i = 0; i < n; i++) if (HOST.x[i] >= KILL_X0 - 40) zone.push(i);
  for (const i of zone) {
    const h = GROUND_Y - HOST.y[i];
    reach[i] = NOSE_AT(HOST.x[i]) + h / V_UP + 1.5 * hash(i, 77);
  }
  // slot assignment
  const BIN = 2;
  const nb = Math.ceil((HOST_X1 + 60 - KILL_X0 + 40) / BIN);
  const bins: number[][] = Array.from({ length: nb }, () => []);
  for (const i of zone) {
    const b = Math.floor((HOST.x[i] - KILL_X0 + 40) / BIN);
    if (b >= 0 && b < nb) bins[b].push(i);
  }
  for (const b of bins) b.sort((p, q) => HOST.y[q] - HOST.y[p]); // lowest (largest y) first
  const ptr = new Int32Array(nb);
  const slot = new Int32Array(n).fill(-1);
  const order = MARKS.map((_, j) => j).sort((a, b) => MARKS[b].y - MARKS[a].y);
  for (const j of order) {
    const m = MARKS[j];
    const b0 = Math.floor((m.x - KILL_X0 + 40) / BIN);
    let got = -1;
    for (let d = 0; d < nb && got < 0; d++) {
      for (const b of d === 0 ? [b0] : [b0 - d, b0 + d]) {
        if (b < 0 || b >= nb) continue;
        const arr = bins[b];
        // skip men lower than the slot (they cannot fall up): they survive
        while (ptr[b] < arr.length && (slot[arr[ptr[b]]] >= 0 || HOST.y[arr[ptr[b]]] > m.y + 0.5)) ptr[b]++;
        if (ptr[b] < arr.length) {
          got = arr[ptr[b]];
          ptr[b]++;
          break;
        }
      }
    }
    if (got < 0) throw new Error("pageMotion: a heap slot found no man to fill it");
    slot[got] = j;
  }
  // the falls: the base drops, the men above slide down into the heap; all landed by "enemy"
  const kill = new Float64Array(n).fill(Infinity);
  const fall = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (slot[i] < 0) continue;
    const m = MARKS[slot[i]];
    const drop = Math.max(0, m.y - HOST.y[i]);
    kill[i] = reach[i];
    const want = 6 + 7 * Math.sqrt(Math.min(1, drop / 400));
    fall[i] = Math.max(5, Math.min(want, KILL_LAST - kill[i]));
  }
  return { reach, slot, kill, fall };
})();
export const N_ZONE = (() => {
  let c = 0;
  for (let i = 0; i < HOST.n; i++) if (HOST.x[i] >= KILL_X0) c++;
  return c;
})();

/** the host's withdrawal: from ~f125 the whole mound recoils left (its far
 *  ranks a little later), still withdrawing on the last frame */
export const hostShift = (x0: number, tau: number) => {
  const lag = clamp01((KILL_X0 - x0) / (KILL_X0 - HOST_X0)) * 12;
  const t = tau - 125 - lag;
  return -15 * smootherstep(t / 45) - 95 * smoothstep((t - 30) / 110);
};
/** ... and its front falls back off the heap's plot to a new flank: an
 *  uneven, leaning, ragged line (the high ranks further back), each man who
 *  stood in front of it stopping at his own hashed depth behind it (a
 *  feathered edge), a few stragglers left standing ahead of it who keep
 *  trickling away. It starts when the slump reaches him or with the recoil. */
const FLANK = (h: number) =>
  KILL_X0 - 50 - 150 * Math.pow(clamp01(h / 430), 1.15) - 70 * vnoise(h / 45 + 3.1, 71) - 36 * vnoise(h / 17 + 0.7, 73) - 16 * vnoise(h / 6 + 5.3, 75);
type Back = { dx: number; t0: number; dur: number; trickle: number };
const BACK: Back[] = (() => {
  const out: Back[] = new Array(HOST.n);
  for (let i = 0; i < HOST.n; i++) {
    const x0 = HOST.x[i];
    const h = GROUND_Y - HOST.y[i];
    const straggler = hash(i, 88) < 0.035;
    // depth ~ sqrt(u): fewer and fewer men toward the edge (feathered, no bright rim)
    const depth = straggler ? -(12 + 90 * hash(i, 89)) : 8 + 620 * Math.sqrt(hash(i, 87));
    const target = FLANK(h) - depth;
    const dx = Math.min(0, target - x0);
    // the front backs off as the slump's wave reaches it (no crack opens
    // between those already backing off and those still standing)
    const t0 = (FATE.reach[i] < Infinity ? FATE.reach[i] : NOSE_AT(x0) + h / V_UP) + 7 * hash(i, 86);
    // each at his own pace (30-70 f), so those falling back never crowd into one band
    out[i] = { dx, t0, dur: 30 + 40 * hash(i, 92), trickle: straggler && dx < 0 ? 0.45 + 0.9 * hash(i, 90) : 0 };
  }
  return out;
})();

export type ManState = { x: number; y: number; state: 0 | 1 | 2; q: number };
/** a host man at tau: state 0 living (q unused), 1 falling (q 0..1 living ->
 *  dead look), 2 dead at his slot */
export const hostAt = (i: number, tau: number): ManState => {
  const x0 = HOST.x[i];
  const y0 = HOST.y[i];
  const [bx, by] = breath(i, tau);
  const j = FATE.slot[i];
  if (j >= 0) {
    const tk = FATE.kill[i];
    if (tau < tk) return { x: x0 + bx, y: y0 + by, state: 0, q: 0 };
    const m = MARKS[j];
    const T = FATE.fall[i];
    const u = (tau - tk) / T;
    if (u < 1) {
      // the slump: he slides down (accelerating) and a little out into the heap
      const sx = x0 + bx;
      const sy = y0 + by;
      const drop = Math.max(0, m.y - sy);
      return {
        x: sx + (m.x - sx) * smoothstep(u) + (6 * drop) / 400 * Math.sin(Math.PI * u) + 1.6 * (hash(i, 91) - 0.5) * Math.sin(Math.PI * u),
        y: sy + (m.y - sy) * Math.pow(u, 1.8),
        state: 1,
        q: smoothstep((u - 0.1) / 0.65),
      };
    }
    const s = (tau - tk - T) / 2.5;
    if (s < 1) return { x: m.x, y: m.y + 1.2 * 6.75 * s * (1 - s) * (1 - s), state: 2, q: 1 };
    return { x: m.x, y: m.y, state: 2, q: 1 };
  }
  // the living: everyone withdraws, the front backs off to the new flank
  const b = BACK[i];
  const go = smoothstep((tau - b.t0) / b.dur);
  const trickle = b.trickle ? -b.trickle * Math.max(0, tau - b.t0 - 22) : 0;
  const x = x0 + hostShift(Math.min(x0, KILL_X0), tau) + b.dx * go + trickle;
  return { x: x + bx, y: y0 + by, state: 0, q: 0 };
};

// ---------------------------------------------------------------------------
// THE CAMERA (A2; valid from tau -100): channels as integrals of tapered
// velocity bumps (C1): ln k and the world point S held at screen (540, 835).
//   pre-roll creep   ... f12    a slow creep out on the company (k ~3.06 at
//                               f-91 -> 3.0 at f0); pageOpeningCam = this
//   pull-back        f2-f46     k 3 -> 0.42 with the pan left (f14-f56, eased so
//                               it runs where k is small): the host revealed
//   creep in         f40-f104   +4 % (the held breath)
//   push-in          f86-f115   -> k 0.8, the host's near flank to the company (lands ~f114)
//   creep in         f112-f166  +2 % (the kill)
//   to the layout    f152-f174  -> k 1.0, KdRatioOfInfinity's framing (identity)
//   creep in         f170-f200  +1 %
//   pull-back        f186-f300  -8 % from f191 to f231, still moving on f231
//   (+ a slow 14 px drift right from f176, so the zoom's turn is never a stop)
// ---------------------------------------------------------------------------
export const K = { open: 3.0, wide: 0.42, kill: 0.8, final: 1.0 };
export const S_OPEN: P2 = [CO_CENTRE[0], CO_CENTRE[1]];
export const S_WIDE: P2 = [CO_CENTRE[0] - (850 - SCREEN_CX) / K.wide, GROUND_Y - (1000 - CONTENT_Y) / K.wide];
export const S_KILL: P2 = [420, GROUND_Y - (1000 - CONTENT_Y) / K.kill];
export const S_FINAL: P2 = [SCREEN_CX, CONTENT_Y]; // world = screen at k 1
const FLO = -260;
const FHI = 420;
const track = (bumps: Bump[], v0: number) => makeTrack(bumps, v0, FLO, FHI, 8);
const unitB = (b: Bump) => track([[b[0], b[1], 1, b[3]]], 0);
const after0 = (b: Bump) => {
  const u = unitB(b);
  return u(FHI - 1) - u(0);
};
const PRE: Bump = [-400, 12, 0, 0.1];
const PRE_V = -0.00022; // ln k per frame: the pre-roll creep out
PRE[2] = PRE_V * (PRE[1] - PRE[0]) * (1 - PRE[3] / 2);
const PULL: Bump = [2, 46, 0, 0.55];
PULL[2] = Math.log(K.wide / K.open) - PRE[2] * after0(PRE);
const CREEP1: Bump = [40, 104, Math.log(1.04), 0.6];
const PUSH: Bump = [86, 115, Math.log(K.kill / (K.wide * 1.04)), 0.9];
const CREEP2: Bump = [112, 166, Math.log(1.02), 0.6];
const MOVE: Bump = [152, 174, Math.log(K.final / (K.kill * 1.02)), 0.6];
const CREEP3: Bump = [170, 200, Math.log(1.01), 0.6];
const PULL2: Bump = [186, 300, 0, 0.7];
{
  const base = track([PRE, PULL, CREEP1, PUSH, CREEP2, MOVE, CREEP3], 0);
  const u = unitB(PULL2);
  PULL2[2] = (-Math.log(1.08) - (base(231) - base(191))) / (u(231) - u(191));
}
const LNK = track([PRE, PULL, CREEP1, PUSH, CREEP2, MOVE, CREEP3, PULL2], Math.log(K.open));
const sBumps = (axis: 0 | 1): Bump[] => [
  axis === 0 ? [14, 56, S_WIDE[0] - S_OPEN[0], 0.8] : [18, 62, S_WIDE[1] - S_OPEN[1], 0.8],
  [86, 115, S_KILL[axis] - S_WIDE[axis], 0.9],
  [152, 174, S_FINAL[axis] - S_KILL[axis], 0.6],
  ...(axis === 0 ? ([[176, 320, 14, 1]] as Bump[]) : []),
];
const SX = track(sBumps(0), S_OPEN[0]);
const SY = track(sBumps(1), S_OPEN[1]);
export const pageCamParts = (tau: number) => ({ lnk: LNK(tau), sx: SX(tau), sy: SY(tau) });
export const camOf = (lnk: number, sx: number, sy: number): Cam => {
  const k = Math.exp(lnk);
  return { k, cx: sx - (SCREEN_CX - SCREEN_CX) / k, cy: sy - (CONTENT_Y - SCREEN_CY) / k };
};
/** A2's camera at tau (no sway); for tau <= 0 it is the opening creep that C2 hands over to */
export const pageCam = (tau: number): Cam => camOf(LNK(tau), SX(tau), SY(tau));
export const pageOpeningCam = (tau: number): Cam => pageCam(tau);

// ---------------------------------------------------------------------------
// C2 "ConquistadorsMuster": the 168 march in along the ground from the right
// edge in a loose column (three files by height: the men bound for the top
// ranks walk highest) and take their places in the block rank by rank, front
// file first, each file from the bottom up: one man every ~0.33 f, steady (it
// reads as counting). Each walks on his own gait and steps into his slot
// (C1: the step keeps his walking speed and eases to rest) with a 2-3 f
// settle; the last is in ~f58, on "conquistadors". The camera starts a little
// right, on the column, and glides left with it onto the block (f-20..f60);
// from f60 it IS A2's opening creep (pageOpeningCam(f - 91)).
// ---------------------------------------------------------------------------
export const MUSTER = { v: 7.5, delta: 2.22, step: 1.6, approach: 16, settle: 2.5, glide: [-24, 60] as [number, number], offset: 95 };
/** the three files of the column, by the height of the rank each man is bound for */
const laneOf = (rank: number) => (rank >= 7 ? 0 : rank >= 4 ? 1 : 2);
/** each lane walks at the mean height of the ranks it is bound for */
const LANE_Y = (lane: number) => {
  const rs = lane === 0 ? [7, 8, 9] : lane === 1 ? [4, 5, 6] : [0, 1, 2, 3];
  return rs.reduce((a, r) => a + CO.foot - (CO.ranks - 1 - r) * (CO.h / (CO.ranks - 1)), 0) / rs.length;
};
/** the column's order: file by file, front first; within a file the three
 *  lanes take turns (bottom ranks first in each), so men in one lane are
 *  never closer than 3 steps (no two dots touch on the march) */
const MUSTER_ORDER: number[] = (() => {
  const out: number[] = [];
  for (let f = 0; f < CO.files; f++) {
    const lanes: number[][] = [[], [], []];
    COMPANY.forEach((s, i) => {
      if (s.file === f) lanes[laneOf(s.rank)].push(i);
    });
    for (const l of lanes) l.sort((a, b) => COMPANY[b].rank - COMPANY[a].rank);
    for (let r = 0; lanes.some((l) => l.length); r++) {
      const l = lanes[r % 3];
      if (l.length) out.push(l.shift() as number);
    }
  }
  return out;
})();
const MUSTER_HEAD = COMPANY[MUSTER_ORDER[0]].x + 6 + MUSTER.v * 1.9;
type Walker = { slot: number; d: number; tIn: number; lane: number; T: number; ph: number; side: number; acc: number; accP: number; accPh: number };
/** a loose marching column: hashed gaps (men bunching and gapping), each man a
 *  little off his lane's line, his own step and an easy surge and lag in his
 *  pace; never two in one lane closer than ~6 px */
export const WALKERS: Walker[] = (() => {
  const lastInLane = [-1e9, -1e9, -1e9];
  let prev = -MUSTER.delta;
  return MUSTER_ORDER.map((slot, n) => {
    const s = COMPANY[slot];
    const lane = laneOf(s.rank);
    const gap = MUSTER.delta * (0.3 + 1.4 * hash(n, 604));
    const d = Math.max(prev + gap, lastInLane[lane] + 2.9 * MUSTER.delta);
    prev = d;
    lastInLane[lane] = d;
    return {
      slot,
      d,
      tIn: (MUSTER_HEAD + d - s.x - 6) / MUSTER.v,
      lane: LANE_Y(lane),
      T: 7 + 4 * hash(n, 602),
      ph: 6.283 * hash(n, 603),
      side: 6.2 * (hash(n, 605) - 0.5),
      acc: 0.9 + 1.0 * hash(n, 606),
      accP: 11 + 9 * hash(n, 607),
      accPh: 6.283 * hash(n, 608),
    };
  });
})();
const herm = (p0: number, m0: number, p1: number, m1: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
};
/** the 168 at C2 frame f (indexed like COMPANY) */
export const musterAt = (f: number): P2[] => {
  const tau = f + C2_TO_TAU;
  const out: P2[] = new Array(N_CO);
  for (const w of WALKERS) {
    const s = COMPANY[w.slot];
    let x: number;
    let y: number;
    if (f < w.tIn) {
      // walking in his lane; over the last MUSTER.approach px he drifts to his rank's height
      x = MUSTER_HEAD + w.d - MUSTER.v * f;
      const a = smoothstep((s.x + 6 + MUSTER.approach - x) / MUSTER.approach);
      const loose = 1 - a;
      x += (0.5 * Math.sin((6.283 * f) / w.T + w.ph) + w.acc * Math.sin(f / w.accP + w.accPh)) * loose;
      y = w.lane + (s.y - w.lane) * a + (w.side + 0.5 * Math.sin(f / (w.accP * 1.3) + w.ph)) * loose - 1.3 * Math.abs(Math.sin((3.1416 * f) / w.T + w.ph)) * loose;
    } else {
      const u = (f - w.tIn) / MUSTER.step;
      if (u < 1) {
        // the last step: from his walking speed to rest (C1)
        x = herm(s.x + 6, -MUSTER.v * MUSTER.step, s.x, 0, u);
        y = s.y;
      } else {
        const q = (f - w.tIn - MUSTER.step) / MUSTER.settle;
        const e = q < 1 ? 0.9 * 6.75 * q * (1 - q) * (1 - q) : 0;
        const [bx, by] = breath(w.slot, tau, 7);
        const bw = smoothstep((f - w.tIn - MUSTER.step) / 8);
        x = s.x - e + bx * bw;
        y = s.y + by * bw;
      }
    }
    out[w.slot] = [x, y];
  }
  return out;
};
export const MUSTER_LAST = Math.max(...WALKERS.map((w) => w.tIn + MUSTER.step));
/** C2's camera: A2's channels at tau plus the glide (+offset in x, gone by f60) */
const U_GLIDE_C2 = makeTrack([[MUSTER.glide[0], MUSTER.glide[1], 1, 0.9]], 0, -100, 200, 8);
const GLIDE_TOTAL = U_GLIDE_C2(199) - U_GLIDE_C2(-99);
export const c2Cam = (f: number): Cam => {
  const p = pageCamParts(f + C2_TO_TAU);
  const g = MUSTER.offset * (1 - (U_GLIDE_C2(f) - U_GLIDE_C2(-99)) / GLIDE_TOTAL);
  return camOf(p.lnk, p.sx + g, p.sy);
};
(() => {
  if (MUSTER_LAST > 61 || MUSTER_LAST < 55) throw new Error(`pageMotion: the last man settles on f${MUSTER_LAST.toFixed(1)}`);
  // from f62 C2's camera is A2's opening creep exactly
  for (let f = 62; f <= C2.DURATION; f++) {
    const a = c2Cam(f);
    const b = pageOpeningCam(f + C2_TO_TAU);
    if (Math.abs(a.cx - b.cx) > 1e-6 || Math.abs(a.cy - b.cy) > 1e-6 || Math.abs(a.k - b.k) > 1e-9) throw new Error(`pageMotion: C2's camera leaves A2's creep at f${f}`);
  }
})();
export const scanC2 = () => camScan(c2Cam, 0, C2.DURATION, [CO_CENTRE]);

// ---------------------------------------------------------------------------
// LABELS
// ---------------------------------------------------------------------------
/** "168" in A2: standing at f0, to the context rung and gone during the pull-back */
export const label168Op = (tau: number) => {
  const toContext = 0.94 + (0.5 - 0.94) * smoothstep((tau - 4) / 10);
  return toContext * (1 - smoothstep((tau - 12) / 16));
};
/** "0" lands on "zero" in KdRatioOfInfinity's exact place */
export const ZERO_LABEL = { x: PLOT_CX, y: NUM_BASE_Y, f0: A2.W.zero - 14, frames: 14, fade: 11 };

// ---------------------------------------------------------------------------
// CHECKS (A2)
// ---------------------------------------------------------------------------
export const RIDER_MAX_PX = 30;
export const RIDER_PEAK = { v: 0, f: 0 };
const SWAY = { x: 3, y: 5 };
(() => {
  // every heap slot filled exactly once; all fallen (landed) by "enemy"
  const used = new Uint8Array(MARKS.length);
  let victims = 0;
  let lastLand = 0;
  for (let i = 0; i < HOST.n; i++) {
    const j = FATE.slot[i];
    if (j < 0) continue;
    if (used[j]) throw new Error("pageMotion: a heap slot filled twice");
    used[j] = 1;
    victims++;
    lastLand = Math.max(lastLand, FATE.kill[i] + FATE.fall[i]);
  }
  if (victims !== MARKS.length) throw new Error(`pageMotion: ${victims} victims for ${MARKS.length} slots`);
  if (lastLand > KILL_LAST + 1e-6) throw new Error(`pageMotion: the last of the dead lands at f${lastLand.toFixed(2)}, after "enemy"`);
  if (N_ZONE < 11000 || N_ZONE > 16500) throw new Error(`pageMotion: the kill zone holds ${N_ZONE} men`);
  if (N_CO !== 168 || N_RIDERS !== 62) throw new Error(`pageMotion: company ${N_CO} / riders ${N_RIDERS}`);
  // the riders: <= 30 screen px / f
  let vMax = 0;
  let vAt = 0;
  for (let t = RIDE.depart; t < RIDE.home; t += 0.5) {
    const c0 = pageCam(t);
    const c1 = pageCam(t + 1);
    for (let k = 0; k < N_RIDERS; k++) {
      const a = riderAt(k, t) ?? [COMPANY[RIDER_IDX[k]].x, COMPANY[RIDER_IDX[k]].y];
      const b = riderAt(k, t + 1) ?? [COMPANY[RIDER_IDX[k]].x, COMPANY[RIDER_IDX[k]].y];
      const pa = screenOf(a as P2, c0);
      const pb = screenOf(b as P2, c1);
      const v = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      if (v > vMax) [vMax, vAt] = [v, t];
    }
  }
  for (let t = RIDE.depart + RIDE.formIn; t < RIDE.home - RIDE.formOut; t += 1)
    for (let k = 0; k < N_RIDERS; k++) {
      const p = riderAt(k, t);
      if (p && p[1] < GROUND_Y - 16) throw new Error(`pageMotion: rider ${k} rides high (y ${p[1].toFixed(1)}) on f${t}`);
    }
  RIDER_PEAK.v = vMax;
  RIDER_PEAK.f = vAt;
  if (vMax > RIDER_MAX_PX) throw new Error(`pageMotion: a rider at ${vMax.toFixed(1)} px/f on f${vAt}`);
  // the k >= 0.8 framings: the company, both plots and the numerals >= 60 px inside the frame
  for (let f = 100; f < A2.DURATION; f++) {
    const cam = pageCam(f);
    if (cam.k < 0.79) continue;
    const xs = [
      screenOf([HEAP_PLOT.x0, 0], cam)[0] - 3 * cam.k,
      screenOf([PLOT.x1, 0], cam)[0] + 3 * cam.k,
      screenOf([CO.cx - CO.w / 2 - 2, 0], cam)[0],
      screenOf([CO.cx + CO.w / 2 + 2, 0], cam)[0],
    ];
    if (Math.min(...xs) - SWAY.x < 60 || Math.max(...xs) + SWAY.x > FRAME_W - 60) throw new Error(`pageMotion: an element within 60 px of the edge at f${f}`);
    const low = screenOf([0, GROUND_Y + 11], cam)[1] + SWAY.y;
    if (low >= CAPTION_TOP) throw new Error(`pageMotion: the ground in the caption band at f${f}`);
    if (f >= ZERO_LABEL.f0) {
      const by = screenOf([0, ZERO_LABEL.y], cam)[1] + 24 + SWAY.y;
      if (by >= CAPTION_TOP) throw new Error(`pageMotion: "0" in the caption band at f${f}`);
    }
  }
})();

/** camScan of A2's camera with fixed points (the company, the heap, the host's crown) */
export const scanA2 = () => camScan(pageCam, 0, A2.DURATION, [CO_CENTRE, [286, 880], [HOST_CROWN_X, 600]]);
export { GROUND_Y, HEAP_PLOT, MARKS, MARK_R, PLOT, PLOT_CX };
