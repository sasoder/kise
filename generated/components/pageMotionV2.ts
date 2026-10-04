// ---------------------------------------------------------------------------
// pageMotionV2: the motion of the V2 page cuts (ConquistadorsMusterV2,
// AgainstAlmostHundredThousandV2, KdRatioOfInfinityV2), where every man is an
// engraved figure (pageFigures.tsx). The world, the heap's 10,000 slots and
// the timelines are V1's (kdMotion / pageMotion, imported read-only); the host
// (86,000) is pageMotion's HOST. What is new here:
//   - THE COMPANY OF FIGURES: 62 horsemen in four ranks facing the host (left)
//     and 106 foot in six ranks with their pikes up (right), the rear ranks
//     higher and smaller (a body seen from slightly above; R1: deeper, ~78 px
//     tall at k 1), centred under KdRatioOfInfinity's "0" (x 794).
//   - THE HEAP (R2): one uniform pile, every body drawn the same way, in
//     A2's and B's landing orders (HEAP_ORDER_*).
//   - THE MUSTER (C2) of figures marching in to those places.
//   - THE CHARGE (A2): the 62 horsemen as a low galloping wedge, and the fates
//     of the host (the undercut, the toppling dead, the withdrawal) recomputed
//     for that wedge.
//   - THE CAMERAS: A2 / C2 opening at k 2.4 on the larger company, A2's kill
//     framing tightened to k 1.05 (so the host's figures stay >= ~16 px); B's
//     opening glide landing on the company.
// ---------------------------------------------------------------------------
import { CAPTION_TOP, CONTENT_Y, FRAME_W, SCREEN_CX, SCREEN_CY, camScan, clamp01, hash, makeTrack, screenOf, smootherstep, smoothstep, type Bump, type Cam, type P2 } from "./incaShared";
import { ANCHOR as KD_ANCHOR, DURATION as KD_DURATION, GROUND_Y, HEAP_CX, HEAP_PLOT, INF_A, INF_C, K_FINAL as KD_K_FINAL, K_OPEN as KD_K_OPEN, MARKS, NUM_BASE_Y, NUM_EM_DESC, NUM_INK_HALF, NUM_PX, PLOT_CX, PUSH as KD_PUSH, S_FINAL as KD_S_FINAL, S_OPEN as KD_S_OPEN, T as KD_T } from "./kdMotion";
import { A2, C2, C2_TO_TAU, HOST, HOST_X0, KILL_X0, breath } from "./pageMotion";
import { DEAD_ANGLES, FIG } from "./pageFigures";

export { A2, C2, C2_TO_TAU };

// ---------------------------------------------------------------------------
// THE COMPANY OF FIGURES (world px; feet / hooves on the row's ground line)
// ---------------------------------------------------------------------------
// R1: re-formed DEEPER so it reads as a band of armed men at k 1 (V2's five
// shallow rows read as two thin strips ~30 px tall): the horse in 4 ranks, the
// foot in 6, each rank 10 px higher and 4.5 % smaller than the one before it;
// each block about as tall as half its width, together ~78 px tall at k 1
export const ROW_DY = 10; // each rank behind stands this much higher on the page
export const ROW_DS = 0.045; // ... and this much smaller (the front rank 1.0)
const H_ROWS = [16, 16, 15, 15]; // 62 horse
const F_RANKS = [18, 18, 18, 18, 17, 17]; // 106 foot
const H_DX = 7.5;
const F_DX = 6.6;
export const HORSE_LEN = (FIG.horse * 76) / 57; // nose to tail, world px
const H_W = 15 * H_DX + HORSE_LEN;
const F_W = 17 * F_DX + 9;
const CO_GAP = 12;
const X_L = PLOT_CX - (H_W + CO_GAP + F_W) / 2;
export type Man = { x: number; y: number; s: number; horse: boolean; row: number; col: number };
export const COMPANY2: Man[] = (() => {
  const out: Man[] = [];
  H_ROWS.forEach((n, r) =>
    Array.from({ length: n }).forEach((_, c) =>
      out.push({
        x: X_L + HORSE_LEN / 2 + c * H_DX + ((16 - n) * H_DX) / 2 + r * 1.6 + 0.8 * (hash(out.length, 811) - 0.5),
        y: GROUND_Y - r * ROW_DY + 0.4 * (hash(out.length, 812) - 0.5),
        s: 1 - r * ROW_DS,
        horse: true,
        row: r,
        col: c,
      }),
    ),
  );
  F_RANKS.forEach((n, r) =>
    Array.from({ length: n }).forEach((_, c) =>
      out.push({
        x: X_L + H_W + CO_GAP + 4.5 + c * F_DX + ((18 - n) * F_DX) / 2 + r * 1.2 + 0.7 * (hash(out.length, 811) - 0.5),
        y: GROUND_Y - r * ROW_DY + 0.4 * (hash(out.length, 812) - 0.5),
        s: 1 - r * ROW_DS,
        horse: false,
        row: r,
        col: c,
      }),
    ),
  );
  return out;
})();
export const N_CO2 = COMPANY2.length; // 168
export const RIDERS2 = COMPANY2.map((m, i) => (m.horse ? i : -1)).filter((i) => i >= 0); // 62
/** the company's extent (world): x from the lead horse's nose to the last pike, y from the pikes' tips to the front's feet */
export const CO2_BOX = {
  x0: X_L,
  x1: X_L + H_W + CO_GAP + F_W + 3 + 5 * 1.2,
  y0: GROUND_Y - (F_RANKS.length - 1) * ROW_DY - FIG.foot * 1.4 * (1 - (F_RANKS.length - 1) * ROW_DS),
  y1: GROUND_Y,
};
/** the company's middle (its feet at 930, its pikes' tips ~78 px above) */
export const CO2_CENTRE: P2 = [PLOT_CX, GROUND_Y - 34];
/** the "168" label (V1's place: under the company's front, a fixed screen offset below the ground) */
export const LABEL168_2 = { x: PLOT_CX, y: GROUND_Y, dy: 30 + 0.59 * 156 };
export const ZERO_LABEL2 = { x: PLOT_CX, y: NUM_BASE_Y, f0: A2.W.zero - 14, frames: 14, fade: 11 };
/** "168" in A2: standing at f0, to the context rung and gone during the pull-back */
export const label168Op2 = (tau: number) => (0.94 + (0.5 - 0.94) * smoothstep((tau - 4) / 10)) * (1 - smoothstep((tau - 12) / 16));

/** a company man's pose at rest (he breathes; a horse shifts its weight) */
export type CoState = { x: number; y: number; pose: number; flip: number; moving: boolean };
export const restOf = (i: number, tau: number): CoState => {
  const m = COMPANY2[i];
  const [bx, by] = breath(i, tau, 7);
  return { x: m.x + bx, y: m.y + by * 0.5, pose: 0, flip: 1, moving: false };
};

// ---------------------------------------------------------------------------
// THE MUSTER (C2): a loose marching column from the right edge, horse first
// (the front of the company), file by file, then the foot; each walks at his
// row's height on his own gait, decelerates into his place (C1) and settles.
// One man every ~0.33 f; the last is in ~f58.
// ---------------------------------------------------------------------------
export const MUSTER2 = { v: 9, step: (2 * 6) / 9, settle: 2.5, first: 3.5, last: 57.4, glide: [-24, 60] as [number, number], offset: 80 };
const MUSTER_ORDER2: number[] = COMPANY2.map((_, i) => i).sort((a, b) => {
  const A = COMPANY2[a];
  const B = COMPANY2[b];
  if (A.horse !== B.horse) return A.horse ? -1 : 1;
  return A.col - B.col || A.row - B.row;
});
type Walker2 = { i: number; d: number; tIn: number; T: number; ph: number; acc: number; accP: number; accPh: number; side: number };
const HEAD2 = 0;
export const WALKERS2: Walker2[] = MUSTER_ORDER2.map((i, n) => {
  const m = COMPANY2[i];
  const arrive = MUSTER2.first + (MUSTER2.last - MUSTER2.first) * (n / (MUSTER_ORDER2.length - 1)) + 0.5 * (hash(n, 821) - 0.5);
  const tIn = arrive - MUSTER2.step;
  // where he is on f0: tIn frames' walk short of his step-in point
  const d = m.x + 6 + MUSTER2.v * tIn - HEAD2;
  return { i, d, tIn, T: (m.horse ? 8 : 6.5) + 2.5 * hash(n, 822), ph: 6.283 * hash(n, 823), acc: 0.8 + 0.9 * hash(n, 824), accP: 11 + 8 * hash(n, 825), accPh: 6.283 * hash(n, 826), side: 1.6 * (hash(n, 827) - 0.5) };
});
export const MUSTER2_LAST = Math.max(...WALKERS2.map((w) => w.tIn + MUSTER2.step));
const herm = (p0: number, m0: number, p1: number, m1: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
};
/** the 168 at C2 frame f (indexed like COMPANY2) */
export const musterAt2 = (f: number): CoState[] => {
  const tau = f + C2_TO_TAU;
  const out: CoState[] = new Array(N_CO2);
  for (const w of WALKERS2) {
    const m = COMPANY2[w.i];
    if (f < w.tIn) {
      const loose = 1 - smoothstep((f - (w.tIn - 6)) / 6);
      const x = HEAD2 + w.d - MUSTER2.v * f + w.acc * Math.sin(f / w.accP + w.accPh) * loose;
      const bob = m.horse ? 0.5 * Math.abs(Math.sin((3.1416 * f) / w.T + w.ph)) : 0.9 * Math.abs(Math.sin((3.1416 * f) / w.T + w.ph));
      const pose = Math.floor(f / (w.T / 2) + w.ph) % 2;
      out[w.i] = { x, y: m.y + w.side * loose - bob, pose: m.horse ? pose : 1 + pose, flip: 1, moving: true };
    } else {
      const u = (f - w.tIn) / MUSTER2.step;
      if (u < 1) {
        out[w.i] = { x: herm(m.x + 6, -MUSTER2.v * MUSTER2.step, m.x, 0, u), y: m.y, pose: m.horse ? 1 : 0, flip: 1, moving: true };
      } else {
        const q = (f - w.tIn - MUSTER2.step) / MUSTER2.settle;
        const e = q < 1 ? 0.9 * 6.75 * q * (1 - q) * (1 - q) : 0;
        const [bx, by] = breath(w.i, tau, 7);
        const bw = smoothstep((f - w.tIn - MUSTER2.step) / 8);
        out[w.i] = { x: m.x - e + bx * bw, y: m.y + by * 0.5 * bw, pose: 0, flip: 1, moving: false };
      }
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE CHARGE (A2): the 62 horsemen leave their rows as a low wedge along the
// ground (three rows deep, its nose leading), gallop left over the gap and
// the heap's plot into the base of the host's flank, wheel (the wedge turns
// about its middle: seen from the side it closes and reopens) and gallop back
// into their places by f166, where each turns to face the host again (f166-f172).
// ---------------------------------------------------------------------------
const W2_DX = 8.2;
/** the wedge stays low: its three rows 4.6 px apart (V2's) */
const WEDGE_DY = 4.6;
const WEDGE2: P2[] = (() => {
  const cols: number[][] = [[1], [0, 1]];
  for (let c = 2; c <= 20; c++) cols.push([0, 1, 2]);
  cols.push([0, 1]);
  const out: P2[] = [];
  const L = (cols.length - 1) * W2_DX;
  cols.forEach((rows, c) => rows.forEach((r) => out.push([c * W2_DX - L / 2 + 0.6 * (hash(out.length, 831) - 0.5), GROUND_Y - r * WEDGE_DY])));
  return out;
})();
export const WEDGE2_L = 20 * W2_DX + HORSE_LEN;
/** rider k takes wedge place k (front horse first) */
const RIDER_WEDGE2: number[] = (() => {
  const byCol = RIDERS2.map((_, k) => k).sort((a, b) => COMPANY2[RIDERS2[a]].col - COMPANY2[RIDERS2[b]].col || COMPANY2[RIDERS2[a]].row - COMPANY2[RIDERS2[b]].row);
  const out = new Array<number>(RIDERS2.length);
  byCol.forEach((k, j) => (out[k] = j));
  return out;
})();
/** after the wheel the column is reversed, so on the way home each horse takes
 *  the place nearest him in the new order (no one crosses the others) */
const RETURN_SLOT2: number[] = (() => {
  const ks = RIDERS2.map((_, k) => k).sort((a, b) => -WEDGE2[RIDER_WEDGE2[a]][0] - -WEDGE2[RIDER_WEDGE2[b]][0] || WEDGE2[RIDER_WEDGE2[a]][1] - WEDGE2[RIDER_WEDGE2[b]][1]);
  const slots = [...RIDERS2].sort((a, b) => COMPANY2[a].col - COMPANY2[b].col || COMPANY2[b].row - COMPANY2[a].row);
  const out = new Array<number>(RIDERS2.length);
  ks.forEach((k, j) => (out[k] = slots[j]));
  return out;
})();
export const RIDE2 = { depart: 99, home: 166, turnHome: 7, out: [99, 141] as [number, number], back: [127, 166] as [number, number], noseMin: 171, formIn: 10, formOut: 18 };
export const RIDE2_HOME: P2 = (() => {
  const xs = RIDERS2.map((i) => COMPANY2[i].x);
  return [xs.reduce((a, v) => a + v, 0) / xs.length, GROUND_Y];
})();
const RIDE2_X = (() => {
  const make = (A: number) =>
    makeTrack(
      [
        [RIDE2.out[0], RIDE2.out[1], -A, 0.55],
        [RIDE2.back[0], RIDE2.back[1], A, 0.55],
      ],
      RIDE2_HOME[0],
      -20,
      260,
      16,
    );
  let lo = 50;
  let hi = 1400;
  for (let it = 0; it < 50; it++) {
    const A = (lo + hi) / 2;
    const tr = make(A);
    let mn = Infinity;
    for (let t = RIDE2.out[0]; t <= RIDE2.back[1]; t += 0.25) mn = Math.min(mn, tr(t));
    if (mn - WEDGE2_L / 2 > RIDE2.noseMin) lo = A;
    else hi = A;
  }
  return make((lo + hi) / 2);
})();
export const RIDE2_TURN = (() => {
  let mn = Infinity;
  let at = 0;
  for (let t = RIDE2.out[0]; t <= RIDE2.back[1]; t += 0.25) {
    const x = RIDE2_X(t);
    if (x < mn) [mn, at] = [x, t];
  }
  return at;
})();
const wheel2 = (tau: number) => Math.PI * smootherstep((tau - (RIDE2_TURN - 11)) / 22);
const formW2 = (tau: number) =>
  smoothstep((tau - RIDE2.depart) / RIDE2.formIn) * (1 - smoothstep((tau - (RIDE2.home - RIDE2.formOut)) / RIDE2.formOut));
export const noseX2 = (tau: number) => RIDE2_X(tau) - (WEDGE2_L / 2) * Math.cos(wheel2(tau));
/** the company place a horseman stands in at tau (his own before the wheel, his
 *  return place after it) */
export const riderSlot2 = (k: number, tau: number) => (tau > RIDE2_TURN ? RETURN_SLOT2[k] : RIDERS2[k]);
/** a horseman's state at tau (null when he stands in his place facing left) */
export const riderAt2 = (k: number, tau: number): CoState | null => {
  if (tau <= RIDE2.depart || tau >= RIDE2.home + RIDE2.turnHome) return null;
  const slot = COMPANY2[riderSlot2(k, tau)];
  if (tau >= RIDE2.home) {
    // home, facing right: he turns in place to face the host again
    const u = smootherstep((tau - RIDE2.home) / RIDE2.turnHome);
    return { x: slot.x, y: slot.y, pose: 0, flip: -Math.cos(Math.PI * u), moving: true };
  }
  const wp = WEDGE2[RIDER_WEDGE2[k]];
  const w = formW2(tau);
  const th = wheel2(tau);
  const c = Math.cos(th);
  const bob = 0.7 * Math.abs(Math.sin(tau * 1.1 + 6.283 * hash(k, 31))) * w;
  const x = RIDE2_X(tau) + (1 - w) * (slot.x - RIDE2_HOME[0]) + w * wp[0] * c;
  const y = (1 - w) * slot.y + w * (wp[1] - bob);
  // the gallop's three poses, 3 f each, every horse on his own phase; the
  // body turns with the wheel (seen from the side it squeezes and flips)
  const pose = 2 + (Math.floor((tau - RIDE2.depart) / 3 + 3 * hash(k, 32)) % 3);
  const flip = w < 0.05 ? (tau > RIDE2_TURN ? -1 : 1) : Math.sign(c || 1) * Math.max(0.22, Math.abs(c));
  return { x, y, pose, flip, moving: true };
};

// ---------------------------------------------------------------------------
// THE KILL (A2): V1's undercut, for this wedge. A man dies when the nose has
// passed under his column, the higher the later (the slump climbs at V_UP);
// the 10,000 slots are filled lowest first by the nearest reached man standing
// over them. A dying man TOPPLES: he turns from upright to his lying angle as
// he drops and slides into his slot.
// ---------------------------------------------------------------------------
export const KILL_LAST2 = A2.W.enemy;
const V_UP = 42;
const V_SIDE = 24;
const NOSE_AT2: (x: number) => number = (() => {
  const ts: number[] = [];
  const xs: number[] = [];
  for (let t = RIDE2.depart; t <= RIDE2_TURN; t += 0.125) {
    ts.push(t);
    xs.push(noseX2(t));
  }
  const xmin = Math.min(...xs);
  return (x: number) => {
    if (x < xmin) return RIDE2_TURN + (xmin - x) / V_SIDE;
    for (let i = 0; i < xs.length; i++) if (xs[i] <= x) return ts[i];
    return RIDE2_TURN;
  };
})();
export type Fate2 = { reach: Float64Array; slot: Int32Array; kill: Float64Array; fall: Float64Array };
export const FATE2: Fate2 = (() => {
  const n = HOST.n;
  const reach = new Float64Array(n).fill(Infinity);
  const zone: number[] = [];
  for (let i = 0; i < n; i++) if (HOST.x[i] >= KILL_X0 - 40) zone.push(i);
  // the slump's front is not a ruled crease: a coherent wobble (+-2.5 f along the
  // height) and a per-man scatter (0-2.5 f)
  const wobble = (v: number, seed: number) => {
    const a = Math.floor(v);
    const u = v - a;
    const e = u * u * (3 - 2 * u);
    return (hash(a, seed) * 2 - 1) * (1 - e) + (hash(a + 1, seed) * 2 - 1) * e;
  };
  const wob = (h: number) => wobble(h / 38 + 1.7, 79);
  for (const i of zone) {
    const h = GROUND_Y - HOST.y[i];
    reach[i] = NOSE_AT2(HOST.x[i]) + h / V_UP + 2.5 * wob(h) + 2.5 * hash(i, 77);
  }
  const BIN = 2;
  const nb = Math.ceil((530 - KILL_X0 + 40) / BIN);
  const bins: number[][] = Array.from({ length: nb }, () => []);
  // each man is binned at a wavering x, so the edge between the columns the
  // heap empties and the ones it only undercuts is no straight crease
  for (const i of zone) {
    const h = GROUND_Y - HOST.y[i];
    const xe = HOST.x[i] + 30 * wobble(h / 45 + 0.4, 81) + 16 * (hash(i, 78) - 0.5);
    const b = Math.floor((xe - KILL_X0 + 40) / BIN);
    if (b >= 0 && b < nb) bins[b].push(i);
  }
  for (const b of bins) b.sort((p, q) => HOST.y[q] - HOST.y[p]);
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
        while (ptr[b] < arr.length && (slot[arr[ptr[b]]] >= 0 || HOST.y[arr[ptr[b]]] > m.y + 0.5)) ptr[b]++;
        if (ptr[b] < arr.length) {
          got = arr[ptr[b]];
          ptr[b]++;
          break;
        }
      }
    }
    if (got < 0) throw new Error("pageMotionV2: a heap slot found no man to fill it");
    slot[got] = j;
  }
  const kill = new Float64Array(n).fill(Infinity);
  const fall = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (slot[i] < 0) continue;
    const m = MARKS[slot[i]];
    const drop = Math.max(0, m.y - HOST.y[i]);
    kill[i] = reach[i];
    const want = 6 + 7 * Math.sqrt(Math.min(1, drop / 400));
    fall[i] = Math.max(5, Math.min(want, KILL_LAST2 - kill[i]));
  }
  return { reach, slot, kill, fall };
})();
const vnoise = (x: number, seed: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i, seed) * 2 - 1;
  const b = hash(i + 1, seed) * 2 - 1;
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
};
export const hostShift2 = (x0: number, tau: number) => {
  const lag = clamp01((KILL_X0 - x0) / (KILL_X0 - HOST_X0)) * 12;
  const t = tau - 125 - lag;
  return -15 * smootherstep(t / 45) - 95 * smoothstep((t - 30) / 110);
};
const FLANK2 = (h: number) =>
  KILL_X0 - 50 - 150 * Math.pow(clamp01(h / 430), 1.15) - 70 * vnoise(h / 45 + 3.1, 71) - 36 * vnoise(h / 17 + 0.7, 73) - 16 * vnoise(h / 6 + 5.3, 75);
type Back = { dx: number; t0: number; dur: number; trickle: number };
const BACK2: Back[] = (() => {
  const out: Back[] = new Array(HOST.n);
  for (let i = 0; i < HOST.n; i++) {
    const x0 = HOST.x[i];
    const h = GROUND_Y - HOST.y[i];
    const straggler = hash(i, 88) < 0.035;
    const depth = straggler ? -(12 + 90 * hash(i, 89)) : 8 + 620 * Math.sqrt(hash(i, 87));
    const dx = Math.min(0, FLANK2(h) - depth - x0);
    const t0 = (FATE2.reach[i] < Infinity ? FATE2.reach[i] : NOSE_AT2(x0) + h / V_UP) + 7 * hash(i, 86);
    out[i] = { dx, t0, dur: 30 + 40 * hash(i, 92), trickle: straggler && dx < 0 ? 0.45 + 0.9 * hash(i, 90) : 0 };
  }
  return out;
})();
/** the ragged front: a mob's near edge is no ruled line. Its nearest rows
 *  stand forward of the ground's line in uneven knots along it (a smooth
 *  noise along x, up to ~11 px nearer, plus a per-man scatter), so the host's
 *  feet draw a wavering edge */
export const HOST_DY: Float32Array = Float32Array.from({ length: HOST.n }, (_, i) => {
  const h = GROUND_Y - 1.035 - HOST.y[i];
  if (h >= 26) return 0;
  const q = HOST.x[i] / 46 + 4.3;
  const a = Math.floor(q);
  const u = q - a;
  const e = u * u * (3 - 2 * u);
  const knot = 0.5 + 0.5 * ((hash(a, 707) * 2 - 1) * (1 - e) + (hash(a + 1, 707) * 2 - 1) * e);
  return Math.pow(1 - h / 26, 1.5) * (-1.5 + 9 * knot + 3.5 * hash(i, 705));
});
/** the same for the dead lying on the ground (the heap's base and its strays) */
export const DEAD_DY: Float32Array = Float32Array.from(MARKS, (m, j) => {
  const eta = GROUND_Y - 1.5 - m.y;
  return eta < 8 ? (1 - Math.max(0, eta) / 8) * (-2 + 11 * Math.pow(hash(j, 706), 1.4)) : 0;
});
/** the slot j's lying angle (deg) and the dead's per-slot scale */
export const DEAD_ANG = DEAD_ANGLES;
export const deadAngle = (j: number) => DEAD_ANG[Math.floor(hash(j, 703) * DEAD_ANG.length)];
/** a host man at tau:
 *  state 0 living: x, y = his feet;
 *  state 1 falling: x, y = his middle, rot (deg) as he topples, q (0..1 living -> dead look);
 *  state 2 dead: x, y = his middle in the heap */
export type ManState2 = { x: number; y: number; state: 0 | 1 | 2; q: number; rot: number; j: number };
export const hostAt2 = (i: number, tau: number, hWorld: number): ManState2 => {
  const x0 = HOST.x[i];
  const y0 = HOST.y[i] + HOST_DY[i];
  const [bx, by] = breath(i, tau);
  const j = FATE2.slot[i];
  if (j >= 0) {
    const tk = FATE2.kill[i];
    if (tau < tk) return { x: x0 + bx, y: y0 + by, state: 0, q: 0, rot: 0, j };
    const m = { x: MARKS[j].x, y: MARKS[j].y + DEAD_DY[j] };
    const T = FATE2.fall[i];
    const u = (tau - tk) / T;
    const a = deadAngle(j);
    if (u < 1) {
      // he topples: his middle drops (accelerating) and slides into his slot while he turns over
      const sx = x0 + bx;
      const sy = y0 + by - hWorld * 0.5;
      const drop = Math.max(0, m.y - sy);
      return {
        x: sx + (m.x - sx) * smoothstep(u) + ((6 * drop) / 400) * Math.sin(Math.PI * u),
        y: sy + (m.y - sy) * Math.pow(u, 1.8),
        state: 1,
        q: smoothstep((u - 0.1) / 0.65),
        rot: a * smoothstep(Math.min(1, u * 1.15)),
        j,
      };
    }
    const s = (tau - tk - T) / 2.5;
    return { x: m.x, y: m.y + (s < 1 ? 1.2 * 6.75 * s * (1 - s) * (1 - s) : 0), state: 2, q: 1, rot: a, j };
  }
  const b = BACK2[i];
  const go = smoothstep((tau - b.t0) / b.dur);
  const trickle = b.trickle ? -b.trickle * Math.max(0, tau - b.t0 - 22) : 0;
  const x = x0 + hostShift2(Math.min(x0, KILL_X0), tau) + b.dx * go + trickle;
  return { x: x + bx, y: y0 + by, state: 0, q: 0, rot: 0, j: -1 };
};
/** the host's painter's order: the higher (further) first */
export const HOST_ORDER: Int32Array = (() => {
  const idx = Array.from({ length: HOST.n }, (_, i) => i);
  idx.sort((a, b) => HOST.y[a] + HOST_DY[a] - HOST.y[b] - HOST_DY[b]);
  return Int32Array.from(idx);
})();
/** a host man's figure scale: his own (+-8 %) x receding with height (0.78 at the top) */
export const hostScale = (i: number) => (0.92 + 0.16 * hash(i, 704)) * (1 - 0.22 * clamp01((GROUND_Y - HOST.y[i]) / 480));

// ---------------------------------------------------------------------------
// THE DEAD AS FIGURES. Heap slot j holds man SLOT_MAN2[j] (A2's fates; B uses
// the same assignment so both heaps are one heap): he lies at deadAngle(j), at
// his own scale (no recession: the heap is at the front), as the "dead"
// variant of his figure (the raised mace / whirled sling fall with him: 0 -> 2,
// 1 -> 3; R1 adds poses 4, 5: see deadVariantOf). The heap is drawn in landing
// order (HEAP_ORDER_*).
// ---------------------------------------------------------------------------
export const SLOT_MAN2: Int32Array = (() => {
  const a = new Int32Array(MARKS.length).fill(-1);
  for (let i = 0; i < HOST.n; i++) if (FATE2.slot[i] >= 0) a[FATE2.slot[i]] = i;
  return a;
})();
/** the variant a man's figure has (pageFigures.incaKey) and the one he lies in */
export const incaVariant = (i: number) => Math.floor(hash(i, 701) * 4);
/** the pose slot j's body lies in: mostly his own figure with the weapon
 *  fallen (0 -> 2, 1 -> 3); some (30 %) with an arm flung out and the mace
 *  dropped beyond his head (4) or a leg and an arm thrown out (5) */
export const deadVariantOf = (j: number) => (hash(j, 708) < 0.3 ? 4 + (hash(j, 709) < 0.5 ? 0 : 1) : 2 + (incaVariant(SLOT_MAN2[j]) & 1));
export const ownScale = (i: number) => 0.92 + 0.16 * hash(i, 704);
/** a lying man's reach (world, at scale 1.08): his outermost points by pose
 *  (glyph units: feet, head, hands, the dropped weapon), turned about his
 *  middle (0, -50) by his angle; DEAD_X = the heap's true x extent */
const POSE_PTS: Record<number, [number, number][]> = {
  2: [[-11, 0], [11, 0], [0, -92], [-15, -46], [31.4, -28]],
  3: [[-12, 0], [12, 0], [0, -92], [-18.4, -25], [21, -57]],
  4: [[-11, 0], [11, 0], [0, -92], [-15, -46], [26, -88], [-35.4, -120]],
  5: [[-11, 0], [20, 0], [0, -92], [-15, -46], [21, -24], [28, -62], [-24.4, -4]],
};
export const deadReach = (j: number): [number, number] => {
  const a = (deadAngle(j) * Math.PI) / 180;
  const c = Math.cos(a);
  const sn = Math.sin(a);
  let lo = 0;
  let hi = 0;
  for (const [px, py] of POSE_PTS[deadVariantOf(j)]) {
    const dx = px;
    const dy = py + 50;
    const x = dx * c - dy * sn; // canvas rotation (y down)
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  }
  const k = (FIG.dead * 1.08) / 100;
  return [lo * k, hi * k];
};
const DEAD_X: [number, number] = (() => {
  let x0 = Infinity;
  let x1 = -Infinity;
  MARKS.forEach((m, j) => {
    const [lo, hi] = deadReach(j);
    x0 = Math.min(x0, m.x + lo);
    x1 = Math.max(x1, m.x + hi);
  });
  return [x0, x1];
})();
export { DEAD_X };

// ---------------------------------------------------------------------------
// THE CAMERAS (velocity bumps, C1; S = the world point held at screen (540, 835))
//   A2: pre-roll creep -> pull-back to the wide (k 2.4 -> 0.42) with the pan
//       left and down -> held breath (+4 %) -> push-in to k 1.05 (the kill
//       framing, the host's figures >= ~16 px) -> a slow drift out through the
//       kill (-2 %) -> KdRatioOfInfinity's framing (k 1.0) by f174 -> the 8 %
//       pull-back on to the end. Zoom reversals: ~f46 and ~f116.
//   C2: A2's opening creep + the glide on the column (gone by f60).
// ---------------------------------------------------------------------------
export const K2 = { open: 2.4, wide: 0.42, kill: 1.05, final: 1.0 };
export const S2_OPEN: P2 = [CO2_CENTRE[0], CO2_CENTRE[1]];
export const S2_WIDE: P2 = [CO2_CENTRE[0] - (850 - SCREEN_CX) / K2.wide, GROUND_Y - (1000 - CONTENT_Y) / K2.wide];
/** (the kill framing's x: V2's, frozen: (107 + V2's company right edge 956.47) / 2) */
export const S2_KILL: P2 = [(HEAP_PLOT.x0 + 5 + 956.4667) / 2, GROUND_Y - (1000 - CONTENT_Y) / K2.kill];
export const S2_FINAL: P2 = [SCREEN_CX, CONTENT_Y];
const FLO = -260;
const FHI = 420;
const track = (bumps: Bump[], v0: number) => makeTrack(bumps, v0, FLO, FHI, 8);
const unitB = (b: Bump) => track([[b[0], b[1], 1, b[3]]], 0);
const after0 = (b: Bump) => {
  const u = unitB(b);
  return u(FHI - 1) - u(0);
};
const PRE: Bump = [-400, 12, 0, 0.1];
PRE[2] = -0.00022 * (PRE[1] - PRE[0]) * (1 - PRE[3] / 2);
const PULL: Bump = [2, 46, Math.log(K2.wide / K2.open) - PRE[2] * after0(PRE), 0.55];
const CREEP1: Bump = [40, 104, Math.log(1.04), 0.6];
const PUSH: Bump = [84, 116, Math.log(K2.kill / (K2.wide * 1.04)), 0.7];
const DRIFT: Bump = [116, 170, Math.log(0.98), 0.6];
const MOVE: Bump = [148, 178, 0, 0.6];
const PULL2: Bump = [170, 300, 0, 0.7];
{
  const base = track([PRE, PULL, CREEP1, PUSH, DRIFT], Math.log(K2.open));
  const u = unitB(MOVE);
  MOVE[2] = (Math.log(K2.final) - base(176)) / (u(176) - u(0));
  const base2 = track([PRE, PULL, CREEP1, PUSH, DRIFT, MOVE], Math.log(K2.open));
  const u2 = unitB(PULL2);
  PULL2[2] = (-Math.log(1.08) - (base2(231) - base2(191))) / (u2(231) - u2(191));
}
const LNK = track([PRE, PULL, CREEP1, PUSH, DRIFT, MOVE, PULL2], Math.log(K2.open));
const sBumps = (axis: 0 | 1): Bump[] => [
  axis === 0 ? [14, 56, S2_WIDE[0] - S2_OPEN[0], 0.8] : [18, 62, S2_WIDE[1] - S2_OPEN[1], 0.8],
  [84, 116, S2_KILL[axis] - S2_WIDE[axis], 0.7],
  [148, 176, S2_FINAL[axis] - S2_KILL[axis], 0.6],
  ...(axis === 0 ? ([[176, 320, 14, 1]] as Bump[]) : []),
];
const SX = track(sBumps(0), S2_OPEN[0]);
const SY = track(sBumps(1), S2_OPEN[1]);
const camOf = (lnk: number, sx: number, sy: number): Cam => {
  const k = Math.exp(lnk);
  return { k, cx: sx, cy: sy - (CONTENT_Y - SCREEN_CY) / k };
};
export const pageCamParts2 = (tau: number) => ({ lnk: LNK(tau), sx: SX(tau), sy: SY(tau) });
export const pageCam2 = (tau: number): Cam => camOf(LNK(tau), SX(tau), SY(tau));
export const pageOpeningCam2 = (tau: number): Cam => pageCam2(tau);
const U_GLIDE = makeTrack([[MUSTER2.glide[0], MUSTER2.glide[1], 1, 0.9]], 0, -100, 200, 8);
const GLIDE_TOTAL = U_GLIDE(199) - U_GLIDE(-99);
export const c2Cam2 = (f: number): Cam => {
  const p = pageCamParts2(f + C2_TO_TAU);
  return camOf(p.lnk, p.sx + MUSTER2.offset * (1 - (U_GLIDE(f) - U_GLIDE(-99)) / GLIDE_TOTAL), p.sy);
};

// ---------------------------------------------------------------------------
// CHECKS
// ---------------------------------------------------------------------------
export const RIDER2_PEAK = { v: 0, f: 0 };
(() => {
  if (N_CO2 !== 168 || RIDERS2.length !== 62) throw new Error(`pageMotionV2: company ${N_CO2} / horse ${RIDERS2.length}`);
  const used = new Uint8Array(MARKS.length);
  let victims = 0;
  let lastLand = 0;
  for (let i = 0; i < HOST.n; i++) {
    const j = FATE2.slot[i];
    if (j < 0) continue;
    if (used[j]) throw new Error("pageMotionV2: a heap slot filled twice");
    used[j] = 1;
    victims++;
    lastLand = Math.max(lastLand, FATE2.kill[i] + FATE2.fall[i]);
  }
  if (victims !== MARKS.length || lastLand > KILL_LAST2 + 1e-6) throw new Error(`pageMotionV2: ${victims} victims, last lands f${lastLand.toFixed(1)}`);
  if (MUSTER2_LAST > 61 || MUSTER2_LAST < 55) throw new Error(`pageMotionV2: the last man settles on f${MUSTER2_LAST.toFixed(1)}`);
  for (let f = 62; f <= C2.DURATION; f++) {
    const a = c2Cam2(f);
    const b = pageOpeningCam2(f + C2_TO_TAU);
    if (Math.abs(a.cx - b.cx) > 1e-6 || Math.abs(a.cy - b.cy) > 1e-6 || Math.abs(a.k - b.k) > 1e-9) throw new Error(`pageMotionV2: C2's camera leaves A2's creep at f${f}`);
  }
  // the horsemen: <= 30 screen px / f, never above the ground's rows
  let vMax = 0;
  let vAt = 0;
  for (let t = RIDE2.depart; t < RIDE2.home + RIDE2.turnHome; t += 0.5) {
    const c0 = pageCam2(t);
    const c1 = pageCam2(t + 1);
    for (let k = 0; k < RIDERS2.length; k++) {
      const home = (tt: number) => COMPANY2[riderSlot2(k, tt)];
      const a = riderAt2(k, t) ?? home(t);
      const b = riderAt2(k, t + 1) ?? home(t + 1);
      const pa = screenOf([a.x, a.y], c0);
      const pb = screenOf([b.x, b.y], c1);
      const v = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
      if (v > vMax) [vMax, vAt] = [v, t];
      if (a.y < GROUND_Y - (H_ROWS.length - 1) * ROW_DY - 2) throw new Error(`pageMotionV2: horseman ${k} rides high on f${t}`);
    }
  }
  RIDER2_PEAK.v = vMax;
  RIDER2_PEAK.f = vAt;
  if (vMax > 30) throw new Error(`pageMotionV2: a horseman at ${vMax.toFixed(1)} px/f on f${vAt}`);
  // the k >= 0.8 framings: the company and the heap >= 60 px inside the frame; nothing below y 1150
  for (let f = 100; f < A2.DURATION; f++) {
    const cam = pageCam2(f);
    if (cam.k < 0.79) continue;
    const xs = [screenOf([Math.min(HEAP_PLOT.x0 + 5, DEAD_X[0]), 0], cam)[0], screenOf([CO2_BOX.x0 - 6, 0], cam)[0], screenOf([CO2_BOX.x1, 0], cam)[0]];
    if (Math.min(...xs) - 3 < 60 || Math.max(...xs) + 3 > FRAME_W - 60) throw new Error(`pageMotionV2: an element within 60 px of the edge at f${f} (${xs.map((v) => v.toFixed(0)).join(", ")})`);
    if (screenOf([0, GROUND_Y + 2], cam)[1] + 5 >= CAPTION_TOP) throw new Error(`pageMotionV2: the ground in the caption band at f${f}`);
    if (f >= ZERO_LABEL2.f0 && screenOf([0, ZERO_LABEL2.y], cam)[1] + 24 + 5 >= CAPTION_TOP) throw new Error(`pageMotionV2: "0" in the caption band at f${f}`);
  }
})();
export const scanA2v2 = () => camScan(pageCam2, 0, A2.DURATION, [CO2_CENTRE]);
export const scanC2v2 = () => camScan(c2Cam2, 0, C2.DURATION, [CO2_CENTRE]);

// ---------------------------------------------------------------------------
// B (KdRatioOfInfinityV2): V1's camera (kdMotion: the world point S held at
// the screen anchor (540, 640); the pull-back k 1.55 -> 1.0 f8-f47 and the 8 %
// push-in to the end), with a new glide. It opens on the heap as it forms
// (moving), the company of 168 standing at the right edge; at "K / D" (f18-f20)
// the heap's flank is at left and the company fills the right half; the glide
// lands on f26 with the company a little right of the frame's axis (screen x
// ~660, standing, nobody fallen; the colon / infinity forming in the gap in
// view at left); then the pull-back's own drift left onto the whole figure
// (x 540) by f50. Landing exactly on "D" (f20) would need > 30 px/f.
// ---------------------------------------------------------------------------
export const KB = { DURATION: KD_DURATION, LAST: KD_DURATION - 1, open: KD_K_OPEN, final: KD_K_FINAL, push: KD_PUSH };
const CO2_MID_X = (CO2_BOX.x0 + CO2_BOX.x1) / 2;
const B_PULL: [number, number] = [8, 47];
const B_PUSH: [number, number] = [36, 210];
const B_SY: [number, number] = [0, 52];
const bUnit = (w: [number, number], taper = 1) => makeTrack([[w[0], w[1], 1, taper]], 0, -80, 480);
const BU_SY = bUnit(B_SY);
const BU_PULL = bUnit(B_PULL);
const BU_PUSH = bUnit(B_PUSH, 0.45);
const B_PULL_AREA = Math.log(KB.final / KB.open);
const B_PUSH_AREA = (Math.log(KB.push) - B_PULL_AREA * (BU_PULL(KB.LAST) - BU_PULL(46))) / (BU_PUSH(KB.LAST) - BU_PUSH(46));
const B_LNK = makeTrack(
  [
    [B_PULL[0], B_PULL[1], B_PULL_AREA, 1],
    [B_PUSH[0], B_PUSH[1], B_PUSH_AREA, 0.45],
  ],
  Math.log(KB.open),
  -80,
  480,
);
export const B_LAND = { f: 26, screenX: 660 };
const B_GLIDE_W: [number, number] = [-26, B_LAND.f];
const B_BACK_W: [number, number] = [B_LAND.f, 50];
const B_SX: (f: number) => number = (() => {
  const kLand = Math.exp(B_LNK(B_LAND.f));
  const sLand = CO2_MID_X - (B_LAND.screenX - SCREEN_CX) / kLand;
  const u1 = bUnit(B_GLIDE_W, 0.9);
  const u2 = bUnit(B_BACK_W, 1);
  const tr = makeTrack(
    [
      [B_GLIDE_W[0], B_GLIDE_W[1], (sLand - KD_S_OPEN[0]) / (u1(B_GLIDE_W[1]) - u1(B_GLIDE_W[0])), 0.9],
      [B_BACK_W[0], B_BACK_W[1], (KD_S_FINAL[0] - sLand) / (u2(B_BACK_W[1]) - u2(B_BACK_W[0])), 1],
    ],
    0,
    -80,
    480,
  );
  const base = tr(B_GLIDE_W[0]);
  return (f: number) => KD_S_OPEN[0] + tr(f) - base;
})();
const B_SY_TR = makeTrack([[B_SY[0], B_SY[1], (KD_S_FINAL[1] - KD_S_OPEN[1]) / (BU_SY(400) - BU_SY(0)), 1]], KD_S_OPEN[1], -80, 480);
export const bCamAt = (f: number): Cam => {
  const k = Math.exp(B_LNK(f));
  return { k, cx: B_SX(f) - (KD_ANCHOR[0] - SCREEN_CX) / k, cy: B_SY_TR(f) - (KD_ANCHOR[1] - SCREEN_CY) / k };
};
export const B_CAM: Cam[] = Array.from({ length: KB.DURATION }, (_, f) => bCamAt(f));
/** B's checks, every frame (as V1's, with the figures' real extents) */
export const B_FRAMING = { landX: 0, landY: 0, landK: 0 };
(() => {
  const SW = { x: 3, y: 5 };
  const NUM_HALO = 0.035;
  for (let f = 0; f < KB.DURATION; f++) {
    const cam = B_CAM[f];
    const feet = screenOf([0, GROUND_Y + 2], cam)[1] + SW.y;
    if (feet >= CAPTION_TOP) throw new Error(`KdRatioOfInfinityV2: the ground in the caption band at f${f}`);
    if (f >= KD_T.tenK[0]) {
      const low = screenOf([0, NUM_BASE_Y], cam)[1] + NUM_EM_DESC * NUM_PX + 24 + SW.y;
      if (low >= CAPTION_TOP) throw new Error(`KdRatioOfInfinityV2: a numeral in the caption band at f${f}`);
    }
    if (f >= 46) {
      const half10 = NUM_INK_HALF.tenK + NUM_HALO * NUM_PX;
      const half0 = NUM_INK_HALF.zero + NUM_HALO * NUM_PX;
      const xs: [string, number, number][] = [
        ["the dead", screenOf([DEAD_X[0], 0], cam)[0], screenOf([DEAD_X[1], 0], cam)[0]],
        ["the company", screenOf([CO2_BOX.x0 - 6, 0], cam)[0], screenOf([CO2_BOX.x1, 0], cam)[0]],
        ["the infinity", screenOf([INF_C[0] - INF_A - 5, 0], cam)[0], screenOf([INF_C[0] + INF_A + 5, 0], cam)[0]],
      ];
      if (f >= KD_T.tenK[0]) {
        xs.push(["10,000", screenOf([HEAP_CX, 0], cam)[0] - half10, screenOf([HEAP_CX, 0], cam)[0] + half10]);
        xs.push(["0", screenOf([PLOT_CX, 0], cam)[0] - half0, screenOf([PLOT_CX, 0], cam)[0] + half0]);
      }
      for (const [name, l, r] of xs)
        if (l - SW.x < 60 || r + SW.x > FRAME_W - 60) throw new Error(`KdRatioOfInfinityV2: ${name} within 60 px of the edge at f${f} (${(l - SW.x).toFixed(1)} .. ${(r + SW.x).toFixed(1)})`);
    }
  }
  const c = B_CAM[B_LAND.f];
  const p = screenOf([CO2_MID_X, CO2_CENTRE[1]], c);
  B_FRAMING.landX = p[0];
  B_FRAMING.landY = p[1];
  B_FRAMING.landK = c.k;
})();
export const scanB2 = () => camScan(bCamAt, 0, KB.DURATION, [[HEAP_CX - 22, 885], INF_C, [CO2_MID_X, CO2_CENTRE[1]]]);

// ---------------------------------------------------------------------------
// R2: THE HEAP is one uniform pile: every one of the 10,000 is drawn the same
// way (opaque, at the dead tone, with his DARK casing) in LANDING ORDER, so
// the later bodies lie on top and the ones underneath are simply occluded.
// The whole visible surface is a mosaic of toppled bodies, edge to centre.
// ---------------------------------------------------------------------------
/** A2: slot j's landing frame (tau); B: V1's pour */
export const LAND_A2: Float32Array = Float32Array.from(MARKS, (_, j) => FATE2.kill[SLOT_MAN2[j]] + FATE2.fall[SLOT_MAN2[j]]);
const orderBy = (land: (j: number) => number) =>
  Int32Array.from(MARKS.map((_, j) => j).sort((a, b) => land(a) - land(b) || MARKS[a].y + DEAD_DY[a] - (MARKS[b].y + DEAD_DY[b])));
/** the slots in landing order (ties: the higher first) */
export const HEAP_ORDER_A2: Int32Array = orderBy((j) => LAND_A2[j]);
export const HEAP_ORDER_B: Int32Array = orderBy((j) => MARKS[j].land);
