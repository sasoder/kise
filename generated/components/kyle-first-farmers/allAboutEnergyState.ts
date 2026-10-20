// ---------------------------------------------------------------------------
// allAboutEnergyState: the world of cut D (34_AllAboutEnergy) and everything
// cut E (43_HugeLandscapes) needs to open on D's last frame and pull back from
// it. Pure data + pure functions of the frame; no JSX. AllAboutEnergy.tsx
// renders it (export `EnergyWorld`), so E draws exactly the same pixels by
// rendering <EnergyWorld frame={240 + eFrame} cam={...} /> and continuing.
//
// WORLD: a pictorial-map view, the old engraved-map convention: the ground is
// the page seen from above (y grows toward the viewer, no perspective, no
// recession), every object (wheat, people, trees, the house, the heap) is drawn
// upright in elevation standing on its base point, painter's order by base y.
// So the world has the same scale everywhere and continues without limit:
// the forest generator and the river are defined for any rectangle.
// Units: world px; people are drawn at scale PEOPLE (px per figure unit), a
// man = 310 world px.
//
// Every process is defined for frames beyond 240 (the reapers keep reaping,
// the carriers keep shuttling, the heap keeps growing) so E can run them on.
// ---------------------------------------------------------------------------
import { runCamera, type CamKey, type P2 } from "./firstFarmersShared";
import { hash } from "../kits/maps/incaShared";

export const FPS = 30000 / 1001;
export const DURATION = 241;
/** D's last frame; E's f0 = D's f240 */
export const END_FRAME = 240;
/** px per figure unit for every person in this world (a man is 310 units: 310 world px) */
export const PEOPLE = 1;

// ---------------------------------------------------------------------------
// THE FIELD: straight rows of ripe wheat, the back row first (rows=1 WheatFields)
// ---------------------------------------------------------------------------
export const FIELD = { x0: -1100, x1: 560, rows: 12, y0: -1000, gap: 95, spacing: 13, scale: PEOPLE };
export const rowY = (j: number) => FIELD.y0 + j * FIELD.gap;
/** the WheatField seed of row j (each row its own field: its own stalks) */
export const rowSeed = (j: number) => 31 + j * 7;

// ---------------------------------------------------------------------------
// THE REAPERS: four in echelon on the four front rows, facing screen LEFT,
// cutting leftward (the stubble is behind them, to the right, toward the heap).
// One stroke = STROKE frames; the cut front moves CUT_PER_STROKE units during the
// stroke's cut phase (0 - 0.55); every second stroke the reaper takes one step.
// ---------------------------------------------------------------------------
export const STROKE = 30;
export const CUT_PER_STROKE = 22;
export const REAPERS = [
  { row: 11, front0: -380, phase: 0, seed: 1 },
  { row: 10, front0: -262, phase: 11, seed: 2 },
  { row: 9, front0: -140, phase: 5, seed: 3 },
  { row: 8, front0: -24, phase: 19, seed: 4 },
];
const sstep = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
/** strokes done by reaper i at frame f (fractional: the cut phase eased) */
export const strokesDone = (i: number, f: number) => {
  const u = (f + REAPERS[i].phase) / STROKE;
  const n = Math.floor(u);
  return n + sstep((u - n) / 0.55);
};
/** the cut front of reaper i (x): stalks of his row with x > front are cut */
export const cutFront = (i: number, f: number) => REAPERS[i].front0 - CUT_PER_STROKE * strokesDone(i, f);
/** his feet: STEP_BACK units right of the front, stepping once every 2 strokes (in the return phase of the odd stroke) */
export const STEP_BACK = 128;
export const reaperFeetX = (i: number, f: number) => {
  const u = (f + REAPERS[i].phase) / STROKE;
  const pair = Math.floor(u / 2);
  const inPair = u - pair * 2; // 0..2
  const step = sstep((inPair - 1.55) / 0.42); // the step in the second stroke's return
  return REAPERS[i].front0 + STEP_BACK - 2 * CUT_PER_STROKE * (pair + step) + CUT_PER_STROKE * 0.5;
};
/** stalks right of this (per row) were gathered before f0: the swath lies between the front and here */
export const swathEnd = (i: number) => REAPERS[i].front0 + 330;

// ---------------------------------------------------------------------------
// STOOKS on the front stubble (sheaves standing in a tent), and the carriers'
// lanes. Carriers pick a sheaf at a stook, carry it to the heap's left flank
// along the BACK lane (behind the heap's base line), shake it over the heap
// (the kernels fly out of the ears, the sheaf drains to straw), drop the straw,
// turn round and walk back on a path that bulges FORWARD (toward the viewer).
// ---------------------------------------------------------------------------
export const STOOKS: { x: number; y: number; n: number; seed: number; pick: boolean }[] = [
  { x: 110, y: 45, n: 10, seed: 1, pick: true },
  { x: 220, y: 45, n: 10, seed: 2, pick: true },
  { x: 330, y: 45, n: 10, seed: 3, pick: true },
  { x: 200, y: -50, n: 6, seed: 4, pick: false },
  { x: 340, y: -50, n: 6, seed: 5, pick: false },
  { x: 480, y: -50, n: 6, seed: 7, pick: false },
  { x: 290, y: -145, n: 6, seed: 6, pick: false },
  { x: 440, y: -145, n: 6, seed: 8, pick: false },
];
export const LANE_BACK = 112;
export const LANE_BULGE = 128; // the return path's forward bulge, world px
export const CARRY_STRIDE = 58;
export const CARRY_CYCLE = 28;
/** carriers' walking speed, world px per frame (planted feet do not slide) */
export const CARRY_V = (2 * CARRY_STRIDE * PEOPLE) / CARRY_CYCLE;

// ---------------------------------------------------------------------------
// THE HEAP (GrainHeapFed): at the field's edge, in front of the longhouse
// ---------------------------------------------------------------------------
export const HEAP = { at: [1010, 150] as P2, scale: 0.85, width: 1550, height: 659, seed: 4, flight: 10, arc: 26 };

/** world height and half-width of the heap at amount a */
export const heapH = (a: number) => HEAP.height * HEAP.scale * Math.sqrt(Math.max(0, a));
export const heapHalfW = (a: number) => (HEAP.width / 2) * HEAP.scale * Math.sqrt(Math.max(0, a));

// the carriers' loop, in frames
export const PICK = 26; // stoop, take the sheaf, rise (the hand closes on it at PICK_GRAB)
export const PICK_GRAB = 12;
export const TURN = 14;
export const RAISE = 12;
export const SHAKE = 56;
export const LOWER = 10;
export const DROP_AT = 3; // frames into LOWER the straw is let go
/** one sheaf is shaken over the heap every CADENCE frames (two spots alternate) */
export const CADENCE = 60;
/** shake 0, the day's first (the camera has followed its carrier from the stooks): before it the heap is an
 *  earlier day's grain, HEAP_A_F0; the carriers bind sheaves at the stooks until their first trip */
export const SHAKE_PHASE = 112;
export const N_CARRIERS = 4;
/** share of the FULL heap one sheaf yields */
export const SHEAF_YIELD = 0.24;
/** the heap's amount at f0 */
export const HEAP_A_F0 = 0.03;

// ---------------------------------------------------------------------------
// THE SCHEDULE: shake n starts at SHAKE_PHASE + n x CADENCE, carrier n mod 4,
// spot n mod 2 (A at the heap's foot, B 60 px left and 22 behind). The heap's
// amount follows from it in closed form; each spot is the heap's foot when the
// shake ends. Between two of his shakes a carrier lowers, turns, walks back to a
// pick stook, waits there (slack), picks, turns and walks to his next spot.
// ---------------------------------------------------------------------------
/** how much of one sheaf has come out u (0..1) into its shake: the integral of the flow 0.45 + 1.1 sin²(3πu)
 *  (three shakes of the sheaf over a steady trickle; mean 1) */
const yieldFrac = (u: number) => {
  const x = Math.max(0, Math.min(1, u));
  return 0.45 * x + 1.1 * (x / 2 - Math.sin(6 * Math.PI * x) / (12 * Math.PI));
};
export const shakeStart = (n: number) => SHAKE_PHASE + n * CADENCE;
/** the heap's amount (share of the full heap landed) at frame f, any real f; capped at 1 */
/** kernels LEAVE the ears as the sheaf yields (sumAt) and land HEAP.flight frames later: so every kernel in the
 *  air left during a shake, from the ears of the sheaf being shaken */
export const heapAmount = (f: number) => Math.min(1, Math.max(0, HEAP_BASE + SHEAF_YIELD * sumAt(f - HEAP.flight)));
const sumAt = (f: number) => {
  let s = 0;
  const nMax = Math.ceil((f - SHAKE_PHASE) / CADENCE) + 1;
  for (let n = 0; n <= nMax; n++) s += yieldFrac((f - shakeStart(n)) / SHAKE);
  return s;
};
const HEAP_BASE = HEAP_A_F0;

/** spot A never comes left of this (the heap's foot passes it after D's end; B stands 72 left of A) */
export const SPOT_MIN_X = 548;
export type Shake = { n: number; c: number; t0: number; x: number; y: number; spot: number };
/** shake n: who, when, where (the spot is the heap's left foot at the end of the shake, kept right of the stooks) */
export const shakeOf = (n: number): Shake => {
  const t0 = shakeStart(n);
  const spot = ((n % 2) + 2) % 2;
  const foot = HEAP.at[0] - heapHalfW(heapAmount(t0 + SHAKE)) - 44;
  const x = Math.max(SPOT_MIN_X, foot) - (spot ? 72 : 0);
  return { n, c: ((n % N_CARRIERS) + N_CARRIERS) % N_CARRIERS, t0, x, y: LANE_BACK - (spot ? 24 : 0), spot };
};
export type Leg =
  | { kind: "wait"; t0: number; t1: number; x: number; y: number; dir: 1 | -1; bind?: boolean }
  | { kind: "pick"; t0: number; t1: number; x: number; y: number; stook: number; take: number }
  | { kind: "turnR"; t0: number; t1: number; x: number; y: number }
  | { kind: "walkR"; t0: number; t1: number; x0: number; x1: number; y0: number; y1: number }
  | { kind: "shake"; t0: number; t1: number; x: number; y: number; n: number }
  | { kind: "turnL"; t0: number; t1: number; x: number; y: number }
  | { kind: "walkL"; t0: number; t1: number; x0: number; x1: number; y0: number; y1: number };
/** the pick stand beside stook s (he stands on the back lane, the stook just behind him to his left) */
export const pickStand = (s: number): P2 => [STOOKS[s].x + 72, LANE_BACK];
const PICKABLE = [0, 1, 2];
/** every leg of carrier c from his shake nFrom to his shake nTo (n = c mod N), in order; deterministic */
/** before his first trip each carrier binds sheaves beside a stook: which stook, how far off its pick stand */
const FIRST: { x: number; y: number }[] = [
  { x: 424, y: 112 },
  { x: 372, y: -8 },
  { x: 505, y: -104 },
  { x: 410, y: -205 },
];
const legsBetween = (c: number, nFrom: number, nTo: number): Leg[] => {
  const legs: Leg[] = [];
  {
    // the first trip: binding at his stook since before f0, the pick, the walk to shake nFrom
    const b = shakeOf(nFrom);
    const fs = FIRST[c];
    const px = fs.x;
    const py = fs.y;
    const pick0 = b.t0 - RAISE - (b.x - px) / CARRY_V - TURN - PICK;
    legs.push({ kind: "wait", t0: -1e5, t1: pick0, x: px, y: py, dir: -1, bind: true });
    legs.push({ kind: "pick", t0: pick0, t1: pick0 + PICK, x: px, y: py, stook: 0, take: -1 });
    legs.push({ kind: "turnR", t0: pick0 + PICK, t1: pick0 + PICK + TURN, x: px, y: py });
    legs.push({ kind: "walkR", t0: pick0 + PICK + TURN, t1: b.t0 - RAISE, x0: px, x1: b.x, y0: py, y1: b.y });
  }
  for (let n = nFrom; n < nTo; n += N_CARRIERS) {
    const a = shakeOf(n);
    const b = shakeOf(n + N_CARRIERS);
    legs.push({ kind: "shake", t0: a.t0 - RAISE, t1: a.t0 + SHAKE + LOWER, x: a.x, y: a.y, n });
    const tl = a.t0 + SHAKE + LOWER;
    legs.push({ kind: "turnL", t0: tl, t1: tl + TURN, x: a.x, y: a.y });
    // the stook: the farthest-right pick stook he can still reach in time with the least waiting
    const budget = b.t0 - RAISE - (tl + TURN) - PICK - TURN;
    let best = 2;
    for (const s of PICKABLE) {
      const [px] = pickStand(s);
      const need = (Math.abs(a.x - px) + Math.abs(b.x - px)) / CARRY_V;
      if (need <= budget) {
        best = s;
        break;
      }
    }
    const [px, py] = pickStand(best);
    const tBack = tl + TURN + Math.abs(a.x - px) / CARRY_V;
    legs.push({ kind: "walkL", t0: tl + TURN, t1: tBack, x0: a.x, x1: px, y0: a.y, y1: py });
    const tOut = (b.x - px) / CARRY_V;
    const pick0 = b.t0 - RAISE - tOut - TURN - PICK;
    if (pick0 > tBack + 0.5) legs.push({ kind: "wait", t0: tBack, t1: pick0, x: px, y: py, dir: -1 });
    legs.push({ kind: "pick", t0: pick0, t1: pick0 + PICK, x: px, y: py, stook: best, take: 0 });
    legs.push({ kind: "turnR", t0: pick0 + PICK, t1: pick0 + PICK + TURN, x: px, y: py });
    legs.push({ kind: "walkR", t0: pick0 + PICK + TURN, t1: b.t0 - RAISE, x0: px, x1: b.x, y0: py, y1: b.y });
  }
  return legs;
};
/** the first and last shake index the schedule covers (from well before f0 to well past E's end) */
export const N_TO = 40;
export const LEGS: Leg[][] = Array.from({ length: N_CARRIERS }, (_, c) => legsBetween(c, c, N_TO));
/** each stook's picks in time order: the k-th pick takes sheaf k (front first); the pick legs get their `take` */
export const STOOK_GRABS: number[][] = (() => {
  const all: { s: number; t: number; leg: Leg & { kind: "pick" } }[] = [];
  LEGS.forEach((L) => L.forEach((l) => (l.kind === "pick" ? all.push({ s: l.stook, t: l.t0 + PICK_GRAB, leg: l }) : null)));
  all.sort((a, b) => a.t - b.t);
  const out: number[][] = STOOKS.map(() => []);
  all.forEach((g) => {
    // a first-trip binder lifts the sheaf he has bound at his feet, not one off the stook
    if (g.leg.take === -1) return;
    g.leg.take = out[g.s].length;
    out[g.s].push(g.t);
  });
  return out;
})();
/** the leg carrier c is on at frame f */
export const legAt = (c: number, f: number): Leg => {
  const L = LEGS[c];
  for (const l of L) if (f >= l.t0 && f < l.t1) return l;
  return f < L[0].t0 ? L[0] : L[L.length - 1];
};
/** the shakes running at frame f */
export const shakesAt = (f: number): Shake[] => {
  const out: Shake[] = [];
  const n0 = Math.max(0, Math.floor((f - SHAKE_PHASE - SHAKE) / CADENCE));
  for (let n = n0; n <= n0 + 3; n++) {
    const s = shakeOf(n);
    if (f >= s.t0 && f < s.t0 + SHAKE) out.push(s);
  }
  return out;
};


// ---------------------------------------------------------------------------
// THE LONGHOUSE (Longhouse tint 0: cream line on dark umber planes) behind the heap
// ---------------------------------------------------------------------------
export const HOUSE = { at: [1400, -240] as P2, scale: 0.78 * PEOPLE, len: 1500 };

// ---------------------------------------------------------------------------
// THE CLEARING cut out of the wild: an organic oval; trees stand outside it,
// stumps just inside its edge, scrub along it. clearingR(x, y) < 1 = inside.
// ---------------------------------------------------------------------------
export const CLEARING = { cx: 520, cy: -60, rx: 1920, ry: 1300 };
const edgeWobble = (th: number) => 1 + 0.055 * Math.sin(3 * th + 1.1) + 0.035 * Math.sin(7 * th + 2.3) + 0.02 * Math.sin(13 * th + 0.4);
export const clearingR = (x: number, y: number) => {
  const dx = (x - CLEARING.cx) / CLEARING.rx;
  const dy = (y - CLEARING.cy) / CLEARING.ry;
  return Math.hypot(dx, dy) / edgeWobble(Math.atan2(dy, dx));
};
/** the clearing's outline (world px), n points */
export const clearingOutline = (n = 160): P2[] =>
  Array.from({ length: n }, (_, i) => {
    const th = (i / n) * Math.PI * 2;
    const r = edgeWobble(th);
    return [CLEARING.cx + Math.cos(th) * CLEARING.rx * r, CLEARING.cy + Math.sin(th) * CLEARING.ry * r];
  });

/** the farm's animals grazing on the cleared ground in front (cream; out of every close-up) */
export const ANIMALS: { kind: "goat" | "cow"; at: P2; dir: 1 | -1; seed: number }[] = [
  { kind: "cow", at: [-760, 520], dir: 1, seed: 1 },
  { kind: "cow", at: [-1030, 590], dir: -1, seed: 2 },
  { kind: "goat", at: [1650, 470], dir: -1, seed: 3 },
  { kind: "goat", at: [1830, 550], dir: 1, seed: 4 },
  { kind: "goat", at: [1480, 600], dir: 1, seed: 5 },
  { kind: "goat", at: [-570, 610], dir: -1, seed: 6 },
];

// ---------------------------------------------------------------------------
// THE RIVER: winding across the forest above the clearing, from far left to far
// right (defined for any x). Centre line y(x); its width varies a little.
// ---------------------------------------------------------------------------
export const RIVER = { y0: -2250, width: 380 };
export const riverY = (x: number) => RIVER.y0 + 300 * Math.sin(x / 1500 + 0.6) + 120 * Math.sin(x / 520 + 2.1) + 50 * Math.sin(x / 210 + 0.3);
export const riverW = (x: number) => RIVER.width * (1 + 0.18 * Math.sin(x / 900 + 1.7));

// ---------------------------------------------------------------------------
// THE FOREST: a jittered grid of trees over any rectangle (deterministic), none
// in the clearing or the river, denser along the clearing's edge; scrub between.
// ---------------------------------------------------------------------------
export const TREE_CELL = 200;
export type Tree = { x: number; y: number; s: number; seed: number; kind: 0 | 1 | 2 };
/** trees whose BASE lies in the rectangle, sorted far to near (painter's order) */
export const treesIn = (x0: number, y0: number, x1: number, y1: number): Tree[] => {
  const out: Tree[] = [];
  const i0 = Math.floor(x0 / TREE_CELL) - 1;
  const i1 = Math.ceil(x1 / TREE_CELL) + 1;
  const j0 = Math.floor(y0 / TREE_CELL) - 1;
  const j1 = Math.ceil(y1 / TREE_CELL) + 1;
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const sd = i * 7919 + j * 104729;
      const x = (i + 0.15 + 0.7 * hash(sd, 1)) * TREE_CELL + (j % 2) * TREE_CELL * 0.5;
      const y = (j + 0.15 + 0.7 * hash(sd, 2)) * TREE_CELL;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const r = clearingR(x, y);
      if (r < 1.04) continue;
      // the river and a meadow on its near bank (a tree there would stand up over the water)
      const dy = y - riverY(x);
      if (dy > -riverW(x) * 0.5 - 70 && dy < riverW(x) * 0.5 + 420) continue;
      // a few glades in the wild
      const glade = Math.sin(x / 1700 + 0.4) * Math.sin(y / 1300 + 1.9);
      if (r > 1.25 && glade > 0.72 && hash(sd, 3) < 0.8) continue;
      if (hash(sd, 4) < (r < 1.2 ? 0.04 : 0.14)) continue;
      const kind = (hash(sd, 5) < 0.18 ? 1 : hash(sd, 5) < 0.3 ? 2 : 0) as 0 | 1 | 2;
      out.push({ x, y, s: 0.85 + 0.4 * hash(sd, 6), seed: sd, kind });
    }
  }
  out.sort((a, b) => a.y - b.y);
  return out;
};
/** scrub (low bushes) along the clearing edge and the river banks */
export const scrubIn = (x0: number, y0: number, x1: number, y1: number): Tree[] => {
  const out: Tree[] = [];
  const C = 120;
  for (let j = Math.floor(y0 / C) - 1; j <= Math.ceil(y1 / C) + 1; j++) {
    for (let i = Math.floor(x0 / C) - 1; i <= Math.ceil(x1 / C) + 1; i++) {
      const sd = i * 6151 + j * 92821 + 17;
      const x = (i + hash(sd, 1)) * C;
      const y = (j + hash(sd, 2)) * C;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const r = clearingR(x, y);
      const bank = Math.abs(Math.abs(y - riverY(x)) - riverW(x) * 0.5 - 40);
      const edge = r > 1.03 && r < 1.1;
      if (!(edge || bank < 50)) continue;
      if (hash(sd, 3) > 0.42) continue;
      out.push({ x, y, s: 0.7 + 0.5 * hash(sd, 4), seed: sd, kind: 0 });
    }
  }
  out.sort((a, b) => a.y - b.y);
  return out;
};
/** the stumps of the felled trees, just inside the clearing's edge (not on the field, the lanes, the house) */
export const STUMPS: P2[] = (() => {
  const pts: P2[] = [];
  for (let i = 0; i < 70; i++) {
    const th = hash(i, 901) * Math.PI * 2;
    const rr = 0.86 + 0.1 * hash(i, 902);
    const x = CLEARING.cx + Math.cos(th) * CLEARING.rx * rr * edgeWobble(th);
    const y = CLEARING.cy + Math.sin(th) * CLEARING.ry * rr * edgeWobble(th);
    const inField = x > FIELD.x0 - 120 && x < FIELD.x1 + 80 && y > FIELD.y0 - 60 && y < LANE_BACK + LANE_BULGE + 90;
    const inYard = x > HEAP.at[0] - 700 && x < HOUSE.at[0] + HOUSE.len / 2 + 120 && y > HOUSE.at[1] - 80 && y < HEAP.at[1] + 160;
    if (inField || inYard) continue;
    pts.push([x, y]);
  }
  return pts.sort((a, b) => a[1] - b[1]);
})();

// ---------------------------------------------------------------------------
// THE CAMERA (firstFarmersShared runCamera: pchip keys, log zoom, damped follow
// that trails ~5 frames). Close on the reapers, along the work, along the
// carriers to the heap, the heap's swell, then back to the clearing on
// "environment", creeping to the end.
// ---------------------------------------------------------------------------
export const CAM_KEYS: CamKey[] = [
  { f: 0, x: -95, y: 4, k: 1.55 },
  { f: 50, x: 20, y: 44, k: 1.55 },
  { f: 112, x: 840, y: 92, k: 1.6 },
  { f: 146, x: 915, y: 88, k: 1.52 },
  { f: 196, x: 540, y: 150, k: 0.226 },
  { f: 240, x: 535, y: 160, k: 0.212 },
  { f: 300, x: 530, y: 166, k: 0.2 },
];
export const camAt = (f: number) => runCamera(CAM_KEYS, f);
/** the camera on D's last frame (E's f0) */
export const CAM_END = camAt(END_FRAME);
/** the heap's amount on D's last frame */
export const HEAP_END = heapAmount(END_FRAME);
