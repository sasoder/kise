import { DOT_RADIUS, FRAME_H, FRAME_W, camMove, clamp01, hash, runCamera, smoothstep } from "./fieldShared";
import {
  DATA_W,
  INK_BEAD_R,
  INK_W,
  easeOutCubic,
  labelCapH,
  labelPx,
  labelWidth,
  shootEase,
  sz,
  type Cam,
} from "./chinatalkShared";

// ---------------------------------------------------------------------------
// finiteJobsGeom — the world of `FiniteJobs` (no React): the block of ring
// slots, the clearing, the field's seats, the read-wave, the camera track, and
// the whole thread schedule (the fills seen on screen and every rejected
// application after them). Everything is a pure function of the frame, built
// once at module scope. World px, origin at the block's centre, y down.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 144;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const angDiff = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// --- the field's grain -------------------------------------------------------
// The Dwarkesh pitch and scatter exactly. The dot is the Dwarkesh DOT_RADIUS
// (5.5) times DOT_GAIN = 6.8, the dot radius of DepartmentOfWarOpen (this same
// language already drawn on rice paper): at 5.5 the field covers 26 % of the
// paper and reads as pink speckle at phone size; at 6.8 it covers 40 % and
// reads as a red mass, with the dots still distinct in the close shot.
export const DOT_GAIN = 6.8 / DOT_RADIUS;
export const DOT_R = DOT_RADIUS * DOT_GAIN;
export const STEP_X = 940 / 39;
export const STEP_Y = 440 / 29;
const JITTER = 0.9;

// --- the jobs: 5 x 3 ring slots ---------------------------------------------
export const SLOT_COLS = 5;
export const SLOT_ROWS = 3;
export const RING_R = 14; // the Dwarkesh structure ring
export const SLOT_PITCH = 3 * RING_R;
/** the ink dot of a taken slot: one size, tidy on purpose */
export const SLOT_DOT_R = DOT_R * 1.2;
export type Slot = { x: number; y: number; c: number; r: number; perimeter: boolean };
export const SLOTS: Slot[] = [];
for (let r = 0; r < SLOT_ROWS; r++) {
  for (let c = 0; c < SLOT_COLS; c++) {
    SLOTS.push({
      x: (c - (SLOT_COLS - 1) / 2) * SLOT_PITCH,
      y: (r - (SLOT_ROWS - 1) / 2) * SLOT_PITCH,
      c,
      r,
      perimeter: r === 0 || r === SLOT_ROWS - 1 || c === 0 || c === SLOT_COLS - 1,
    });
  }
}
export const NSLOT = SLOTS.length;
const slotAt = (c: number, r: number) => r * SLOT_COLS + c;
export const BLOCK_HALF_W = ((SLOT_COLS - 1) / 2) * SLOT_PITCH + RING_R;
export const BLOCK_HALF_H = ((SLOT_ROWS - 1) / 2) * SLOT_PITCH + RING_R;

// --- line weights: kit tokens, through the kit's size law -----------------------
// The ring stroke is the kit's INK_W (3.5, which is also the Dwarkesh ring
// weight). The thread is 0.6 x the kit's accent line DATA_W = 5.4: heavier than
// the Dwarkesh 3, because a vermilion line across a LIT vermilion crowd only
// reads where it crosses paper. Its head is the kit's ink bead, INK_BEAD_R.
export const THREAD_W = 0.6 * DATA_W;
export const HEAD_R = INK_BEAD_R;
export const ringW = (k: number) => INK_W * sz(k);
export const threadW = (k: number) => THREAD_W * sz(k);
export const headR = (k: number) => HEAD_R * sz(k);

// --- the label -----------------------------------------------------------------
export const LABEL_TEXT = "JOBS";
/** floor on the label's SCREEN font size, so it still reads on the wide (LargestCreditExpansion's floor) */
export const LABEL_MIN_PX = 40;
const LABEL_GAP = 0.75; // x its cap height, above the block's top edge
export const labelGeom = (k: number) => {
  const fs0 = labelPx("word", k);
  const fs = Math.max(fs0, LABEL_MIN_PX / k);
  const capH = labelCapH("word", k) * (fs / fs0);
  const w = labelWidth(LABEL_TEXT, "word", k) * (fs / fs0);
  const y = -BLOCK_HALF_H - ringW(k) / 2 - LABEL_GAP * capH - capH / 2;
  return { fs, capH, w, y, x0: -w / 2, x1: w / 2, y0: y - capH / 2, y1: y + capH / 2 };
};

// ---------------------------------------------------------------------------
// THE CAMERA. One pull-back, written by fieldShared's `camMove` (warped
// smoothstep, a key per frame) and followed by `runCamera`. The move is eased
// in LOG zoom (the ChinaTalk rig's convention), so the zoom RATE is what peaks
// at the cut and then only ever falls. The move is CAM_PRE frames old at the
// cut, so f0 is already at speed; it ends at f118 and the follower settles a
// few frames later on k 1.0 (the block 196 px wide). A constant slow drift
// runs under the whole track (no corner where the move ends), which is the
// residual drift of the tail. cy comes from the same eased k: the block's
// centre sits at screen y Y_OPEN at the start of the move and Y_WIDE at its end.
// ---------------------------------------------------------------------------
export const CAM_PRE = 12;
const CAM_MOVE_F = 118 + CAM_PRE;
const K_OPEN = 3.07;
const K_WIDE = 1.078;
const CAM_WARP = 0.55;
const K_DRIFT = 0.0006; // of ln k per frame, the whole track
const Y_OPEN = 842;
const Y_WIDE = 800;
const LK_OPEN = Math.log(K_OPEN);
const LK_WIDE = Math.log(K_WIDE);
const MOVE = camMove({ f0: 0, f1: CAM_MOVE_F, k0: LK_OPEN, k1: LK_WIDE, c0: 0, c1: 0, warp: CAM_WARP });
const CAM_F: number[] = [];
const CAM_K: number[] = [];
const CAM_CY: number[] = [];
for (let t = 0; t <= DURATION + CAM_PRE + 4; t++) {
  const lk = t <= CAM_MOVE_F ? MOVE.K[t] : LK_WIDE;
  const g = (LK_OPEN - lk) / (LK_OPEN - LK_WIDE);
  const k = Math.exp(lk - K_DRIFT * t);
  CAM_F.push(t);
  CAM_K.push(k);
  CAM_CY.push((FRAME_H / 2 - lerp(Y_OPEN, Y_WIDE, g)) / k);
}
export const CAMS: Cam[] = [];
for (let f = 0; f < DURATION; f++) {
  const c = runCamera(f + CAM_PRE, CAM_F, CAM_CY, CAM_K);
  CAMS.push({ x: 0, y: c.cy, k: c.k });
}
export const camAt = (f: number): Cam => CAMS[Math.max(0, Math.min(DURATION - 1, Math.round(f)))];
export const REST_CAM: Cam = CAMS[0];
export const K_MIN = Math.min(...CAMS.map((c) => c.k));

// ---------------------------------------------------------------------------
// THE CLEARING. A superellipse blob around the block and its label, softened by
// the Dwarkesh +/-5 % harmonics and ragged by a per-seat hash where the seats
// are laid out. The crowd stands close around it.
// ---------------------------------------------------------------------------
const LABEL_WIDE = labelGeom(K_MIN);
const CLEAR_TOP = LABEL_WIDE.y0 - 40;
const CLEAR_BOTTOM = BLOCK_HALF_H + 36;
export const CLEAR_CY = (CLEAR_TOP + CLEAR_BOTTOM) / 2;
const CLEAR_A = BLOCK_HALF_W + 40;
const CLEAR_B = (CLEAR_BOTTOM - CLEAR_TOP) / 2;
const CLEAR_N = 2.6;
export const clearingAt = (theta: number) => {
  const cx = Math.abs(Math.cos(theta)) / CLEAR_A;
  const sy = Math.abs(Math.sin(theta)) / CLEAR_B;
  const rse = 1 / Math.pow(Math.pow(cx, CLEAR_N) + Math.pow(sy, CLEAR_N), 1 / CLEAR_N);
  return rse * (1 + 0.03 * Math.sin(3 * theta + 1.2) + 0.02 * Math.sin(5 * theta - 0.4));
};

// ---------------------------------------------------------------------------
// THE FIELD. The Dwarkesh crowd: one seat per cell, scattered off it by up to
// 90 % of the step, radius 0.75-1.25. Its area is whatever the camera can ever
// see (every frame, sway included) plus a bleed, so no edge of it is ever in
// frame.
//
// Then the dots are made INDIVIDUALS: the raw scatter overlaps into merged
// clumps, which read as blobs on white paper, so one deterministic relaxation
// runs at module load. Each pass walks the seats in index order and pushes any
// two whose discs come closer than RELAX_GAP x (ri + rj) apart along their own
// line, half the deficit each (neighbours through a cell grid), then puts back
// anything pushed into the clearing. It only ever moves dots that overlap, and
// only as far as touching, so the scatter's own voids and strings survive: the
// field stays a crowd, never a lattice or a hex packing. 40 % cover is well
// under what discs need to lock into order.
// ---------------------------------------------------------------------------
const BLEED = 80;
let xMax = 0;
let yMin = 0;
let yMax = 0;
for (const c of CAMS) {
  xMax = Math.max(xMax, (FRAME_W / 2 + 6) / c.k);
  yMin = Math.min(yMin, c.y - (FRAME_H / 2 + 8) / c.k);
  yMax = Math.max(yMax, c.y + (FRAME_H / 2 + 8) / c.k);
}
export const FIELD = { x0: -xMax - BLEED, x1: xMax + BLEED, y0: yMin - BLEED, y1: yMax + BLEED };
const COLS = Math.round((FIELD.x1 - FIELD.x0) / STEP_X) + 1;
const ROWS = Math.round((FIELD.y1 - FIELD.y0) / STEP_Y) + 1;
const GRID_X0 = -((COLS - 1) * STEP_X) / 2;
const GRID_Y0 = FIELD.y0;

export type Seat = {
  x: number;
  y: number;
  /** radius multiplier 0.75-1.25 */
  r: number;
  /** distance out from the clearing's edge, along its own ray */
  dRel: number;
  /** breath seed */
  b: number;
  /** how far it may swell with its thread out, 0..LIT_SWELL */
  swell: number;
};
/** centres end at least this x (ri + rj) apart at rest: touching, with a hair of paper */
export const RELAX_GAP = 1.03;
/** the rule: no two dots overlap by more than this fraction of the smaller radius */
export const OVERLAP_MAX = 0.1;
/** the top of fieldShared's `breath` */
const BREATH_MAX = 1.05;
/** a dot with its thread out, as the Dwarkesh field (where it has the room) */
export const LIT_SWELL = 0.35;
const RELAX_ITERS = 40;
const SEAT_GUARD = RING_R + DOT_R * 1.25 + 12;
const SEAT_CELL = new Int32Array(COLS * ROWS).fill(-1);
export const SEATS: Seat[] = (() => {
  type Raw = { x: number; y: number; r: number; rag: number; b: number };
  const raw: Raw[] = [];
  const lm = DOT_R * 1.25 + 10;
  // a seat may not stand in the clearing, on a ring, or on the label at its largest
  const keepOut = (p: Raw) => {
    const dx = p.x;
    const dy = p.y - CLEAR_CY;
    const d = Math.hypot(dx, dy) || 1;
    const edge = clearingAt(Math.atan2(dy, dx)) * p.rag;
    if (d < edge) {
      p.x = (dx / d) * edge;
      p.y = CLEAR_CY + (dy / d) * edge;
    }
    for (const s of SLOTS) {
      const sd = Math.hypot(p.x - s.x, p.y - s.y) || 1;
      if (sd < SEAT_GUARD) {
        p.x = s.x + ((p.x - s.x) / sd) * SEAT_GUARD;
        p.y = s.y + ((p.y - s.y) / sd) * SEAT_GUARD;
      }
    }
    if (p.x > LABEL_WIDE.x0 - lm && p.x < LABEL_WIDE.x1 + lm && p.y > LABEL_WIDE.y0 - lm && p.y < LABEL_WIDE.y1 + lm) {
      p.y = LABEL_WIDE.y0 - lm;
    }
  };
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc;
      const x = GRID_X0 + gc * STEP_X + (hash(i, 11) - 0.5) * STEP_X * JITTER;
      const y = GRID_Y0 + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * JITTER;
      const dx = x;
      const dy = y - CLEAR_CY;
      const rag = 1 + (hash(i, 60) - 0.5) * 0.13;
      if (Math.hypot(dx, dy) < clearingAt(Math.atan2(dy, dx)) * rag) continue;
      // guards the harmonics should never reach: a ring, or the label at its largest
      if (SLOTS.some((s) => Math.hypot(x - s.x, y - s.y) < SEAT_GUARD)) continue;
      if (x > LABEL_WIDE.x0 - lm && x < LABEL_WIDE.x1 + lm && y > LABEL_WIDE.y0 - lm && y < LABEL_WIDE.y1 + lm) continue;
      SEAT_CELL[i] = raw.length;
      raw.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), rag, b: hash(i, 9) });
    }
  }

  // the relaxation
  const CS = 2 * DOT_R * 1.25 * RELAX_GAP + 2;
  const GW = Math.ceil((FIELD.x1 - FIELD.x0 + 400) / CS);
  const cellOf = (p: Raw) => Math.floor((p.x - FIELD.x0 + 200) / CS) + GW * Math.floor((p.y - FIELD.y0 + 200) / CS);
  for (let it = 0; it < RELAX_ITERS; it++) {
    const cells = new Map<number, number[]>();
    raw.forEach((p, i) => {
      const c = cellOf(p);
      const list = cells.get(c);
      if (list) list.push(i);
      else cells.set(c, [i]);
    });
    let moved = 0;
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i];
      const c = cellOf(a);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const list = cells.get(c + ox + oy * GW);
          if (!list) continue;
          for (const j of list) {
            if (j <= i) continue;
            const b = raw[j];
            const want = DOT_R * (a.r + b.r) * RELAX_GAP;
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let d = Math.hypot(dx, dy);
            if (d >= want) continue;
            if (d < 1e-4) {
              // two seats on one spot: part them on a hashed bearing
              const th = 2 * Math.PI * hash(i, 97 + (j % 7));
              dx = Math.cos(th);
              dy = Math.sin(th);
              d = 1;
            }
            const push = (want - d) / 2;
            a.x -= (dx / d) * push;
            a.y -= (dy / d) * push;
            b.x += (dx / d) * push;
            b.y += (dy / d) * push;
            moved++;
          }
        }
      }
    }
    raw.forEach(keepOut);
    if (!moved) break;
  }

  // How far each dot may swell when its thread is out (the Dwarkesh lit swell,
  // up to LIT_SWELL) without breaking the same rule against its neighbours at
  // the top of their breath: a dot in a tight spot swells less, one with room
  // swells fully.
  const cells = new Map<number, number[]>();
  raw.forEach((p, i) => {
    const c = cellOf(p);
    const list = cells.get(c);
    if (list) list.push(i);
    else cells.set(c, [i]);
  });
  return raw.map((p, i) => {
    const dy = p.y - CLEAR_CY;
    const ri = DOT_R * p.r;
    let swell = LIT_SWELL;
    const c = cellOf(p);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        for (const j of cells.get(c + ox + oy * GW) ?? []) {
          if (j === i) continue;
          const q = raw[j];
          const rj = DOT_R * q.r;
          const room = Math.hypot(q.x - p.x, q.y - p.y) - BREATH_MAX * rj + OVERLAP_MAX * Math.min(ri, rj);
          swell = Math.min(swell, room / (BREATH_MAX * ri) - 1);
        }
      }
    }
    return {
      x: p.x,
      y: p.y,
      r: p.r,
      dRel: Math.hypot(p.x, dy) - clearingAt(Math.atan2(dy, p.x)),
      b: p.b,
      swell: Math.max(0, swell),
    };
  });
})();
export const NSEAT = SEATS.length;
/** The seat laid out in the cell that holds world point (x, y), or -1. */
const seatNear = (x: number, y: number) => {
  const gc = Math.round((x - GRID_X0) / STEP_X);
  const gr = Math.round((y - GRID_Y0) / STEP_Y);
  if (gc < 0 || gc >= COLS || gr < 0 || gr >= ROWS) return -1;
  return SEAT_CELL[gr * COLS + gc];
};

// ---------------------------------------------------------------------------
// THE READ-WAVE. Started at the clearing's rim before the cut (at f0 its front
// is already half-way to the top of the frame) and growing at one steady pace
// that OUTRUNS the camera: the front is past every frame edge by about f60, so
// no unlit band ever sits across the frame. After that the field's life is its
// breath, the sway and the threads. A dot's tone is where the front is relative
// to it; nothing here is on a timer of its own.
// ---------------------------------------------------------------------------
export const WAVE_R0 = 135; // the front's leading edge at f0, world px out from the rim
export const WAVE_V = 13.6; // world px per frame
export const FRONT_W = 110; // the soft front
export const waveR = (f: number) => WAVE_R0 + WAVE_V * f;
export const readAt = (dRel: number, f: number) => smoothstep((waveR(f) - dRel) / FRONT_W);
/** how far out the crowd is fully lit */
export const litRadius = (f: number) => waveR(f) - FRONT_W;

/** From the clearing's edge out to the edge of the settled frame, along a bearing. */
const END_CAM = CAMS[DURATION - 1];
export const fieldReach = (theta: number) => {
  const ux = Math.cos(theta);
  const uy = Math.sin(theta);
  const hw = FRAME_W / 2 / END_CAM.k;
  const top = END_CAM.y - FRAME_H / 2 / END_CAM.k;
  const bot = END_CAM.y + FRAME_H / 2 / END_CAM.k;
  const tx = Math.abs(ux) < 1e-6 ? Infinity : hw / Math.abs(ux);
  const ty = Math.abs(uy) < 1e-6 ? Infinity : uy > 0 ? (bot - CLEAR_CY) / uy : (top - CLEAR_CY) / uy;
  return Math.min(tx, ty) - clearingAt(theta);
};

// --- routing helpers ------------------------------------------------------------
const distToSeg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = bx - ax;
  const vy = by - ay;
  const L2 = vx * vx + vy * vy || 1;
  const t = clamp01(((px - ax) * vx + (py - ay) * vy) / L2);
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
};
/** No ring other than `own` within `clear` of the segment. */
const ringsClear = (ax: number, ay: number, bx: number, by: number, own: number, clear: number) =>
  SLOTS.every((s, j) => j === own || distToSeg(s.x, s.y, ax, ay, bx, by) > RING_R + clear);
/** The segment stays out of the label's box at camera k (inflated by `pad`). */
const labelClear = (ax: number, ay: number, bx: number, by: number, k: number, pad: number) => {
  const L = labelGeom(k);
  const len = Math.hypot(bx - ax, by - ay);
  const n = Math.max(2, Math.ceil(Math.min(len, 420) / 3));
  // only the stretch nearest the block can meet the label
  const from = Math.max(0, 1 - 420 / (len || 1));
  for (let i = 0; i <= n; i++) {
    const t = from + ((1 - from) * i) / n;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (x > L.x0 - pad && x < L.x1 + pad && y > L.y0 - pad && y < L.y1 + pad) return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
// THE FILLS. Eight slots are taken before the cut (the three inner ones, which
// no thread could reach without crossing a ring, the one under the label, and
// four more for scatter). The other seven fill on screen, one every 2.5 frames:
// a thread draws from a lit rim dot into the free ring (its ink head lands at
// the ring's centre), then that dot rides its own thread in, pure RED all the
// way, and once it is SEATED the ink grows from the head at the ring's centre
// over it (INK_GROW frames, a crisp disc) until the slot is taken. So every
// frame of a slot is paper, red, ink, or ink over red with a hard edge. The
// first dot seats on f6, so at f0 every slot is empty, taken, or has a dot
// visibly on its way in; the last ink is complete on F_FULL.
// ---------------------------------------------------------------------------
export const FILL_DRAW = 8;
export const FILL_TRAVEL = 9;
export const INK_GROW = 6;
const FILL_PERIOD = 2.5;
const F_FIRST_SEATED = 6;
const PRE_TAKEN = [
  slotAt(0, 0),
  slotAt(2, 0),
  slotAt(4, 0),
  slotAt(1, 1),
  slotAt(2, 1),
  slotAt(3, 1),
  slotAt(1, 2),
  slotAt(3, 2),
];
const FILL_ORDER: [number, number][] = [
  [0, 1],
  [4, 2],
  [1, 0],
  [4, 1],
  [0, 2],
  [3, 0],
  [2, 2],
];
export type Fill = { slot: number; seat: number; t0: number; seated: number };
export const SEAT_FILL = new Int32Array(NSEAT).fill(-1);
export const FILLS: Fill[] = (() => {
  const rim: number[] = [];
  SEATS.forEach((s, i) => {
    if (s.dRel < STEP_Y * 2.2) rim.push(i);
  });
  const out: Fill[] = [];
  FILL_ORDER.forEach(([c, r], n) => {
    const slot = slotAt(c, r);
    const S = SLOTS[slot];
    const seated = F_FIRST_SEATED + FILL_PERIOD * n;
    const t0 = seated - FILL_TRAVEL - FILL_DRAW;
    // the slot's outward direction (rows count for more, so the top slots beside
    // the label are approached on a diagonal that clears it)
    const nl = Math.hypot(c - 2, (r - 1) * 1.6) || 1;
    const nx = (c - 2) / nl;
    const ny = ((r - 1) * 1.6) / nl;
    const kThen = camAt(Math.max(0, seated)).k;
    let best = -1;
    let bestScore = Infinity;
    for (const i of rim) {
      if (SEAT_FILL[i] >= 0) continue;
      const s = SEATS[i];
      const vx = s.x - S.x;
      const vy = s.y - S.y;
      const L = Math.hypot(vx, vy) || 1;
      const cos = (vx * nx + vy * ny) / L;
      if (cos < 0.8) continue;
      if (!ringsClear(s.x, s.y, S.x, S.y, slot, DOT_R * 1.25 + 3)) continue;
      if (!labelClear(s.x, s.y, S.x, S.y, kThen, DOT_R * 1.25 + 4)) continue;
      // its way in is open: the dot rides to the ring past no other dot
      const ri = DOT_R * s.r;
      if (rim.some((j) => j !== i && distToSeg(SEATS[j].x, SEATS[j].y, s.x, s.y, S.x, S.y) < DOT_R * SEATS[j].r + ri)) continue;
      const score = (1 - cos) * 6 + L / 400 + 0.12 * hash(i, 77 + n) - 2 * s.swell;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    if (best < 0) throw new Error(`FiniteJobs: no rim seat for slot ${c},${r}`);
    SEAT_FILL[best] = out.length;
    out.push({ slot, seat: best, t0, seated });
  });
  return out;
})();
/** the frame the block is full: the last slot's ink is complete */
export const F_FULL = FILLS[FILLS.length - 1].seated + INK_GROW;

// ---------------------------------------------------------------------------
// THE REJECTED APPLICATIONS. A thread draws from a lit dot to the rim of a
// taken ring, holds there touching it (REJ_HOLD frames), then RETRACTS along
// its own line back into its dot, at the speed it came, and is gone when the
// head is back inside the dot. It never fades in place: the retreat is the
// "no". Its dot stays where it was, lit.
//
// From F_REJ0 (so the first one touches the block as it fills) a launch
// schedule is accumulated off ONE pressure curve: `esc` rises as a quadratic
// to F_PEAK and `settle` eases it to nothing. COUNT is the launch rate on that
// curve, TEMPO the same curve shortening each thread's draw and hold, and REACH
// is the wave: a thread may only start from a dot the front has fully lit, so
// the threads come from farther out as fast as the wave spreads (and from the
// whole frame once it has passed the edges). Two caps keep the block legible
// at phone size: never more than ALIVE_CAP threads alive, never more than
// RIM_CAP heads waiting at the rim; a launch that would break either is put
// back a frame at a time, then dropped.
//
// THE HOLD (f127 on) is authored, not accumulated: three long threads on clear
// diagonals from three sides, staggered so that at the cut one is retracting,
// one is holding at the rim and one is arriving. Nothing that is alive in the
// hold runs up or down the centre line.
// ---------------------------------------------------------------------------
export const F_REJ0 = 16;
const F_PEAK = 92;
const F_SETTLE0 = 92;
const F_SETTLE1 = 106;
const RATE_LO = 0.3; // about the fills' own tempo
const RATE_HI = 0.46;
export const ALIVE_CAP = 12;
export const RIM_CAP = 5;
export const REJ_HOLD = 5;
/** from here a live thread must be a clear diagonal */
const F_HOLD0 = 124;
/** a head counts as waiting at the rim from this fraction of its draw ... */
const RIM_IN = 0.85;
/** ... until this fraction of its retract */
const RIM_OUT = 0.15;
export const escAt = (f: number) => {
  const u = clamp01((f - F_REJ0) / (F_PEAK - F_REJ0));
  return u * u;
};
export const settleAt = (f: number) => smoothstep((f - F_SETTLE0) / (F_SETTLE1 - F_SETTLE0));
export const rateAt = (f: number) => (f < F_REJ0 || f >= F_SETTLE1 ? 0 : lerp(RATE_LO, RATE_HI, escAt(f)) * (1 - settleAt(f)));
const tempoAt = (f: number) => 1 - 0.2 * escAt(f) * (1 - settleAt(f));
/** frames a head takes to cross `d` world px (and to come back) */
const drawFor = (d: number, tempo: number) => (10 + d / 120) * tempo;
/** the hold's three threads: the frame each head touches the rim, its bearing, how far out it starts */
const TAIL = [
  { touch: 133, deg: -52, frac: 0.76 }, // upper right: retracting at the cut
  { touch: 139.5, deg: 148, frac: 0.9 }, // lower left: holding at the cut
  { touch: 148, deg: 36, frac: 0.9 }, // lower right: arriving at the cut
];

/** each slot's outward direction: its face of the block (corners look out on the diagonal) */
const NORMALS = SLOTS.map((s) => {
  const nx = s.c === 0 ? -1 : s.c === SLOT_COLS - 1 ? 1 : 0;
  const ny = s.r === 0 ? -1 : s.r === SLOT_ROWS - 1 ? 1 : 0;
  const L = Math.hypot(nx, ny) || 1;
  return { x: nx / L, y: ny / L };
});

export type Reject = {
  seat: number;
  ring: number;
  t0: number;
  /** frames out, and frames back */
  draw: number;
  hold: number;
  /** unit vector from the ring's centre toward the seat */
  ux: number;
  uy: number;
};
export const rejectLife = (r: Reject) => 2 * r.draw + r.hold;
export const REJECTS: Reject[] = (() => {
  type Live = Reject & { t1: number; rim0: number; rim1: number; ang: number; bearing: number };
  const live: Live[] = [];
  const lastUsed = new Float32Array(NSEAT).fill(-999);
  const perimeter = SLOTS.map((s, i) => (s.perimeter ? i : -1)).filter((i) => i >= 0);

  /** A thread from seat `si`, or null if it cannot be drawn cleanly. */
  const route = (si: number, t0For: (draw: number) => number, tempo: number, pick: number, spread: number): Live | null => {
    if (si < 0 || SEAT_FILL[si] >= 0) return null;
    const s = SEATS[si];
    // rings on the face of the block that looks at this dot: reachable in a
    // straight line, across nothing, and not at a grazing angle
    const open: { ri: number; ux: number; uy: number }[] = [];
    let dMin = Infinity;
    for (const ri of perimeter) {
      const R = SLOTS[ri];
      const d = Math.hypot(s.x - R.x, s.y - R.y);
      const ux = (s.x - R.x) / d;
      const uy = (s.y - R.y) / d;
      if (ux * NORMALS[ri].x + uy * NORMALS[ri].y < 0.55) continue;
      if (!ringsClear(s.x, s.y, R.x + ux * (RING_R + 6), R.y + uy * (RING_R + 6), ri, 5)) continue;
      open.push({ ri, ux, uy });
      dMin = Math.min(dMin, d);
    }
    if (!open.length) return null;
    const draw = drawFor(dMin, tempo);
    const hold = REJ_HOLD * tempo;
    const t0 = t0For(draw);
    const t1 = t0 + 2 * draw + hold;
    if (s.dRel > litRadius(t0) || lastUsed[si] > t0 - 40) return null;
    const bearing = Math.atan2(s.y, s.x);
    // whatever is still alive in the hold is a clear diagonal: nothing up or
    // down the centre line, nothing level
    const lean = Math.abs(Math.cos(bearing));
    if (t1 > F_HOLD0 && (lean < 0.42 || lean > 0.93)) return null;
    // the threads in the air fan out: none leaves on the bearing of one that
    // will still be alive when this one has drawn
    if (live.some((b) => b.t1 >= t0 + 6 && b.t0 <= t1 && angDiff(bearing, b.bearing) < spread)) return null;
    // ... and none leaves dead opposite one, or the two read as one line
    // skewering the block
    if (live.some((b) => b.t1 >= t0 + 6 && b.t0 <= t1 && angDiff(bearing, b.bearing + Math.PI) < 0.2)) return null;
    const kLate = camAt(t0 + draw + hold).k;
    const ok = open.filter((c) => {
      const R = SLOTS[c.ri];
      if (!labelClear(s.x, s.y, R.x + c.ux * (RING_R + 6), R.y + c.uy * (RING_R + 6), kLate, 14)) return false;
      // two live threads never stand at one ring side by side
      const ang = Math.atan2(c.uy, c.ux);
      return live.every((b) => b.ring !== c.ri || b.t1 < t0 || b.t0 > t1 || angDiff(ang, b.ang) > 0.6);
    });
    if (!ok.length) return null;
    const c = ok[Math.min(ok.length - 1, Math.floor(pick * ok.length))];
    return {
      seat: si,
      ring: c.ri,
      t0,
      draw,
      hold,
      ux: c.ux,
      uy: c.uy,
      t1,
      rim0: t0 + RIM_IN * draw,
      rim1: t0 + draw + hold + RIM_OUT * draw,
      ang: Math.atan2(c.uy, c.ux),
      bearing,
    };
  };
  /** Would this thread keep both caps? */
  const fits = (r: Live) => {
    for (let f = Math.ceil(r.t0); f < r.t1; f++) {
      if (live.filter((b) => b.t0 <= f && b.t1 > f).length >= ALIVE_CAP) return false;
    }
    for (let f = Math.ceil(r.rim0); f < r.rim1; f++) {
      if (live.filter((b) => b.rim0 <= f && b.rim1 > f).length >= RIM_CAP) return false;
    }
    return true;
  };
  const accept = (r: Live) => {
    lastUsed[r.seat] = r.t0;
    live.push(r);
  };

  // the first launch falls on F_REJ0 itself
  let acc = 0.999;
  let j = 0;
  for (let f = F_REJ0; f < F_SETTLE1; f++) {
    const rate = rateAt(f);
    if (rate <= 0) continue;
    const before = acc;
    acc += rate;
    let nth = 1;
    while (acc >= 1) {
      acc -= 1;
      // where inside this frame the launch falls, so the stream is even
      const launch = f + clamp01((nth - before) / rate);
      nth++;
      const id = j++;
      let done = false;
      for (let delay = 0; delay <= 8 && !done; delay++) {
        const t0 = launch + delay;
        const lit = litRadius(t0);
        const tempo = tempoAt(t0);
        for (let a = 0; a < 60; a++) {
          const theta = 2 * Math.PI * hash(id * 61 + a, 31 + delay);
          const want = Math.min(lit, fieldReach(theta)) * (0.3 + 0.65 * hash(id * 61 + a, 32 + delay));
          const edge = clearingAt(theta);
          const si = seatNear(Math.cos(theta) * (edge + want), CLEAR_CY + Math.sin(theta) * (edge + want));
          const r = route(si, () => t0, tempo, hash(id, 33 + a), a < 40 ? 0.24 : 0.12);
          if (!r) continue;
          if (fits(r)) {
            accept(r);
            done = true;
          }
          break;
        }
      }
    }
  }

  TAIL.forEach((tl, n) => {
    for (let a = 0; a < 240; a++) {
      const widen = 1 + a / 60;
      const theta = (tl.deg * Math.PI) / 180 + (hash(n * 53 + a, 41) - 0.5) * 0.14 * widen;
      const frac = tl.frac + (hash(n * 53 + a, 42) - 0.5) * 0.1 * widen;
      const dist = clearingAt(theta) + frac * fieldReach(theta);
      const si = seatNear(Math.cos(theta) * dist, CLEAR_CY + Math.sin(theta) * dist);
      const r = route(si, (draw) => tl.touch - draw, 1, hash(n, 43 + a), 0.3);
      if (!r) continue;
      accept(r);
      return;
    }
    throw new Error(`FiniteJobs: no route for hold thread ${n}`);
  });

  return live
    .sort((a, b) => a.t0 - b.t0)
    .map(({ seat, ring, t0, draw, hold, ux, uy }) => ({ seat, ring, t0, draw, hold, ux, uy }));
})();

// ---------------------------------------------------------------------------
// One frame of threads.
// ---------------------------------------------------------------------------
export type Line = { key: string; x1: number; y1: number; x2: number; y2: number };
/** `s` scales the head's radius: it grows out of its line as the line leaves the dot */
export type Head = { key: string; x: number; y: number; s: number };
/** `lift` is its paper shadow: 1 in flight, falling to 0 as the ink covers it (ink sits flat) */
export type Traveller = { key: string; x: number; y: number; r: number; lift: number };
export const THREAD_OP = 0.95; // a live Dwarkesh thread
/** A dot with its thread out swells over its first frames (no one-frame jump). */
const swellIn = (age: number) => smoothstep(age / 4);
/** No orphan heads: a head has no size until its line shows past the dot's own
 *  edge, and is full size once 12 world px of thread are out in the open (it
 *  shrinks back the same way when a rejected thread comes home). */
const HEAD_OUT0 = 3;
const HEAD_OUT1 = 12;
const headScale = (s: Seat, x: number, y: number) => {
  const out = Math.hypot(x - s.x, y - s.y) - DOT_R * s.r * (1 + s.swell);
  return smoothstep((out - HEAD_OUT0) / (HEAD_OUT1 - HEAD_OUT0));
};
export const threadsAt = (f: number, k: number) => {
  const lit = new Float32Array(NSEAT);
  const gone = new Uint8Array(NSEAT);
  /** the ink disc in each slot: 0 = an empty ring, SLOT_DOT_R = taken */
  const ink = new Float32Array(NSLOT);
  const lines: Line[] = [];
  const heads: Head[] = [];
  const travellers: Traveller[] = [];
  const hr = headR(k);
  for (const s of PRE_TAKEN) ink[s] = SLOT_DOT_R;

  FILLS.forEach((fl, n) => {
    const age = f - fl.t0;
    if (age >= FILL_DRAW) gone[fl.seat] = 1;
    if (age < 0) return;
    const since = f - fl.seated;
    if (since >= INK_GROW) {
      ink[fl.slot] = SLOT_DOT_R;
      return;
    }
    const s = SEATS[fl.seat];
    const S = SLOTS[fl.slot];
    if (age < FILL_DRAW) {
      const dn = shootEase(age / FILL_DRAW);
      const x2 = s.x + (S.x - s.x) * dn;
      const y2 = s.y + (S.y - s.y) * dn;
      lit[fl.seat] = swellIn(age);
      lines.push({ key: `f${n}`, x1: s.x, y1: s.y, x2, y2 });
      heads.push({ key: `f${n}`, x: x2, y: y2, s: headScale(s, x2, y2) });
      return;
    }
    // the head has landed: it is the seed of ink at the ring's centre. The dot
    // rides its own thread in (shoot then settle, the start pulled forward) and
    // the thread is used up behind it; it stays RED until it is seated.
    const u = shootEase(Math.pow(clamp01((age - FILL_DRAW) / FILL_TRAVEL), 0.75));
    const x = s.x + (S.x - s.x) * u;
    const y = s.y + (S.y - s.y) * u;
    if (since < 0) lines.push({ key: `f${n}`, x1: x, y1: y, x2: S.x, y2: S.y });
    travellers.push({
      key: `f${n}`,
      x,
      y,
      r: lerp(DOT_R * s.r * (1 + s.swell), SLOT_DOT_R, smoothstep(u)),
      lift: 1 - smoothstep(since / INK_GROW),
    });
    ink[fl.slot] = since <= 0 ? hr : lerp(hr, SLOT_DOT_R, easeOutCubic(since / INK_GROW));
  });

  const reach = RING_R + ringW(k) / 2 + hr * 0.6;
  REJECTS.forEach((rj, n) => {
    const age = f - rj.t0;
    const life = rejectLife(rj);
    if (age < 0 || age >= life) return;
    const s = SEATS[rj.seat];
    const R = SLOTS[rj.ring];
    const ex = R.x + rj.ux * reach;
    const ey = R.y + rj.uy * reach;
    // out, touching, and back along its own line
    const dn =
      age < rj.draw ? shootEase(age / rj.draw) : age < rj.draw + rj.hold ? 1 : 1 - shootEase((age - rj.draw - rj.hold) / rj.draw);
    const x2 = s.x + (ex - s.x) * dn;
    const y2 = s.y + (ey - s.y) * dn;
    lit[rj.seat] = Math.max(lit[rj.seat], Math.min(swellIn(age), swellIn(life - age)));
    lines.push({ key: `r${n}`, x1: s.x, y1: s.y, x2, y2 });
    heads.push({ key: `r${n}`, x: x2, y: y2, s: headScale(s, x2, y2) });
  });

  return { lit, gone, ink, lines, heads, travellers };
};

// --- numbers for the report ------------------------------------------------------
/** Seats inside the frame at frame f. */
export const dotsOnScreen = (f: number) => {
  const c = camAt(f);
  const hw = FRAME_W / 2 / c.k;
  const hh = FRAME_H / 2 / c.k;
  const { gone } = threadsAt(f, c.k);
  let n = 0;
  SEATS.forEach((s, i) => {
    if (!gone[i] && Math.abs(s.x - c.x) <= hw && Math.abs(s.y - c.y) <= hh) n++;
  });
  return n;
};
/** Threads alive at frame f (fills and rejections). */
export const threadsAlive = (f: number) => threadsAt(f, camAt(f).k).lines.length;
/** Rejected heads waiting at the rim at frame f. */
export const headsAtRim = (f: number) =>
  REJECTS.filter((r) => f >= r.t0 + RIM_IN * r.draw && f < r.t0 + r.draw + r.hold + RIM_OUT * r.draw).length;
