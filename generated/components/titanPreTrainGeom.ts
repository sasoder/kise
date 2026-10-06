import { camFromTrack, clamp01, glideTargetAt, runFollower, smoothstep } from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// titanPreTrainGeom -- the world, the clocks and the camera of TitanPreTrain
// (Bharat, "Synthetic data needs real data", ChinaTalk, cut B). World px; the
// final wide is k 0.98, so world ~ screen there. Everything is a pure function
// of the local frame f (= edit frame S - IN).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = 371;
export const DURATION = 198;
/** the file cut: 15_TitanProgram = f 0..19, 16_PreTrainModels = f 20..197 */
export const JOIN_F = 20;

// --- the world ----------------------------------------------------------------
/** the one stroke weight (world px at K_REF, through the size law: ~6 screen px) */
export const W = 5.6;
export const AXIS_Y = 1130;
export const AXIS_X0 = -700;
/** "now": the earlier point the camera travels back to */
export const X_NOW = 365;
/** where the capability is fielded (the card's foot) */
export const X_FIELD = 880;
export const TICK_STEP = (X_FIELD - X_NOW) / 5;

// the card: 880 x 760 screen px at the open
export const CARD_PX_W = 880;
export const CARD_PX_H = 760;
export const CARD_W = 290;
export const K0 = CARD_PX_W / CARD_W;
export const CARD_H = CARD_PX_H / K0;
export const CARD_CX = X_FIELD;
export const CARD_BOT = 792;
export const CARD_CY = CARD_BOT - CARD_H / 2;
export const CARD_TOP = CARD_BOT - CARD_H;

// the model: 3-4-3 ink nodes above the 2022 point
export const MODEL_CX = X_NOW;
export const MODEL_CY = 927;
export const COL_DX = 175;
export const ROW_DY = 92;
export const NODE_R = 15;
export const COLS: Pt[][] = [3, 4, 3].map((n, c) =>
  Array.from({ length: n }, (_, r) => ({ x: MODEL_CX + (c - 1) * COL_DX, y: MODEL_CY + (r - (n - 1) / 2) * ROW_DY })),
);
export const LINKS: [Pt, Pt][] = [0, 1].flatMap((c) => COLS[c].flatMap((a) => COLS[c + 1].map((b) => [a, b] as [Pt, Pt])));
export const MODEL_X0 = MODEL_CX - COL_DX - NODE_R;
export const MODEL_X1 = MODEL_CX + COL_DX + NODE_R;
export const MODEL_Y0 = MODEL_CY - 1.5 * ROW_DY - NODE_R;
export const MODEL_Y1 = MODEL_CY + 1.5 * ROW_DY + NODE_R;

// the ghost: the model's dashed copy that rides forward and docks under the card
export const GHOST_S = 0.66;
/** the ghost's dashed hull stands this far outside the outer node centres */
export const HULL_PAD = 30;
export const HULL_HW = COL_DX + HULL_PAD;
export const HULL_HH = 1.5 * ROW_DY + HULL_PAD;
export const PATH_X0 = MODEL_CX + HULL_HW + 14;
export const PATH_Y = MODEL_CY;

// --- the red file (synthetic data) ---------------------------------------------
export const SQ = 30;
export const SQ_R = 3;
export const PITCH = 42;
/** the write head: the wet caret sits here, the squares emerge under it */
export const HEAD: Pt = { x: 85, y: 560 };
const TURN_R = 40;
const LEG_BOT = MODEL_CY - TURN_R;
/** the fork point: the end of the turn, where the file fans out to the three inputs */
const FORK: Pt = { x: HEAD.x + TURN_R, y: MODEL_CY };
const LEG_LEN = LEG_BOT - HEAD.y;
const ARC_LEN = (Math.PI / 2) * TURN_R;
const TRUNK_LEN = LEG_LEN + ARC_LEN;
/** which input node square i feeds: middle, top, bottom, ... */
export const targetOf = (i: number) => [1, 0, 2][i % 3];
const forkLen = (i: number) => {
  const n = COLS[0][targetOf(i)];
  return Math.hypot(n.x - FORK.x, n.y - FORK.y);
};
export const pathLen = (i: number) => TRUNK_LEN + forkLen(i);
/** the point at distance s along square i's path (s may be < 0: above the head) */
export const filePoint = (i: number, s: number): Pt => {
  if (s <= LEG_LEN) return { x: HEAD.x, y: HEAD.y + s };
  if (s <= TRUNK_LEN) {
    const a = (s - LEG_LEN) / TURN_R; // 0 .. pi/2
    return { x: HEAD.x + TURN_R - TURN_R * Math.cos(a), y: LEG_BOT + TURN_R * Math.sin(a) };
  }
  const n = COLS[0][targetOf(i)];
  const u = clamp01((s - TRUNK_LEN) / forkLen(i));
  // ease the fan-out so the square leaves the turn along its tangent (horizontal)
  const ux = u;
  const uy = smoothstep(u);
  return { x: FORK.x + (n.x - FORK.x) * ux, y: FORK.y + (n.y - FORK.y) * uy };
};

// the file's clock: Q(f) = how far the file has travelled (world px)
export const FILE_F0 = 80;
const V_FAST = 13.5;
const V_STEADY = 11.5;
const V_SLOW = 3.6;
const fileV = (f: number) => {
  if (f <= FILE_F0) return 0;
  const a = V_FAST * smoothstep((f - FILE_F0) / 6);
  const b = (V_STEADY - V_FAST) * smoothstep((f - 110) / 8);
  const c = (V_SLOW - V_STEADY) * smoothstep((f - 146) / 12);
  return a + b + c;
};
const Q_TAB: number[] = (() => {
  const t = [0];
  for (let f = 1; f <= DURATION + 4; f++) t.push(t[f - 1] + (fileV(f - 1) + fileV(f)) / 2);
  return t;
})();
export const fileQ = (f: number) => {
  const x = Math.max(0, Math.min(Q_TAB.length - 1, f));
  const i = Math.min(Q_TAB.length - 2, Math.floor(x));
  return Q_TAB[i] + (Q_TAB[i + 1] - Q_TAB[i]) * (x - i);
};
/** the frame at which the file has travelled q */
export const fileFrameAt = (q: number) => {
  let lo = 0;
  let hi = Q_TAB.length - 1;
  if (q >= Q_TAB[hi]) return Infinity;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (fileQ(m) < q) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
export const N_SQUARES = Math.floor(Q_TAB[Q_TAB.length - 1] / PITCH) + 1;
/** frame square i's leading edge leaves the head; frame its centre reaches its node */
export const bornF = (i: number) => Math.max(FILE_F0, fileFrameAt(i * PITCH));
export const arriveF = (i: number) => fileFrameAt(i * PITCH + pathLen(i) + SQ / 2);
/** the squares that train the model: the first N_TRAIN to arrive */
export const N_TRAIN = 6;
const TRAIN_ARRIVALS = Array.from({ length: 12 }, (_, i) => arriveF(i))
  .sort((a, b) => a - b)
  .slice(0, N_TRAIN);
export const TRAIN_STEP_F = 7;
/** how much of the model the data has reached (0..1): each arrival carries the front one step */
export const trainU = (f: number) => TRAIN_ARRIVALS.reduce((s, a) => s + smoothstep((f - a) / TRAIN_STEP_F), 0) / N_TRAIN;
export const TRAIN_DONE_F = TRAIN_ARRIVALS[N_TRAIN - 1] + TRAIN_STEP_F;
export const FIRST_ARRIVAL_F = TRAIN_ARRIVALS[0];

// --- clocks ---------------------------------------------------------------------
// the axis tip: written left -> right, decelerating into the card's foot
export const TIP_F0 = 28;
export const TIP_F1 = 46;
const TIP_X0 = 660;
const tipE = (u: number) => 1 - Math.pow(1 - clamp01(u), 1.3);
export const tipX = (f: number) => TIP_X0 + (X_FIELD - TIP_X0) * tipE((f - TIP_F0) / (TIP_F1 - TIP_F0));
/** frame the tip reaches world x */
export const tipReachF = (x: number) => {
  if (x <= TIP_X0) return TIP_F0;
  const e = clamp01((x - TIP_X0) / (X_FIELD - TIP_X0));
  return TIP_F0 + (TIP_F1 - TIP_F0) * (1 - Math.pow(1 - e, 1 / 1.3));
};
// the FIELDED stem (dashed) rises from the axis to the card's foot
export const STEM_F0 = 43;
export const STEM_F1 = 63;
// the dashed frame runs round the card from its foot
export const FRAME_F0 = 56;
export const FRAME_F1 = 84;
// the card's content simplifies as it shrinks
// the article text diffuses out first, then the simple face comes up
export const DETAIL_OUT_F0 = 20;
export const DETAIL_OUT_F1 = 26;
export const SIMPLE_F0 = 26;
export const SIMPLE_F1 = 38;
// context: the card, its stem and FIELDED drop to 0.42 while we go back in time ...
export const CONTEXT_F = 76;
// ... and come back when the ghost docks
export const GHOST_F0 = 150;
export const GHOST_F1 = 174;
export const DOCK_F = 166;
export const ghostE = (f: number) => smoothstep((f - GHOST_F0) / (GHOST_F1 - GHOST_F0));
export const ghostX = (f: number) => MODEL_CX + (X_FIELD - MODEL_CX) * ghostE(f);
export const ghostScale = (f: number) => 1 + (GHOST_S - 1) * ghostE(f);
// the dashed path leads the ghost
export const PATH_F0 = 142;
export const PATH_F1 = 162;
// the model writes in
export const MODEL_F0 = 91;
export const MODEL_F1 = 111;
// the 2022 tick
export const NOW_F0 = 84;
export const NOW_F1 = 94;

// --- the camera: creep, pull-back, glide left (back in time), final wide ---------
const lookFor = (wx: number, wy: number, sx: number, sy: number, k: number): Cam => ({
  x: wx - (sx - 540) / k,
  y: wy - (sy - 835) / k,
  k,
});
/** the open: the card 880 px wide, centred (540, 800) */
export const CAM_START: Cam = lookFor(CARD_CX, CARD_CY, 540, 800, K0);
const K_CREEP = K0 * 1.03;
/** the "fielded" frame: card + dashed stem + FIELDED as one centred group, the card ~520 px wide */
const K_HOLD = 1.8;
const K_HOLD_CREEP = 1.83;
const K_PAST = 0.995;
const K_WIDE = 0.98;
/** screen px from the axis to a label's caps centre (labels hang a constant screen distance under it) */
export const LABEL_DROP = 62;
const GROUP_TOP = CARD_TOP;
const GROUP_BOT = AXIS_Y + (LABEL_DROP + 16) / K_HOLD;
const LOOK_HOLD = lookFor(CARD_CX, (GROUP_TOP + GROUP_BOT) / 2, 540, 818, K_HOLD);
/** back in time: 2022 left-centre, the red file fully in, the card >= 60 px inside the right edge */
const LOOK_PAST: Cam = { x: 547.5, y: 868, k: K_PAST };
/** the final wide: model, path, card as one centred group */
const LOOK_WIDE: Cam = { x: 547.5, y: 865, k: K_WIDE };
export const GLIDES: Glide[] = [
  // the slow creep on the card, running under the pull-back
  { f0: -8, f1: 30, k: K_CREEP },
  // "So before": pulled back to the card on its stem, one centred group
  { f0: 10, f1: 52, dx: LOOK_HOLD.x - CAM_START.x, dy: LOOK_HOLD.y - CAM_START.y, k: K_HOLD },
  // "we even fielded": hold with a slow creep
  { f0: 44, f1: 78, k: K_HOLD_CREEP },
  // "some of these capabilities, I'm like, hey": travel LEFT, back in time, and pull out
  { f0: 66, f1: 104, dx: LOOK_PAST.x - LOOK_HOLD.x, dy: LOOK_PAST.y - LOOK_HOLD.y, k: K_PAST },
  // "let's see if we could do some things": ease out to the final wide with the ghost
  { f0: 146, f1: 190, dx: LOOK_WIDE.x - LOOK_PAST.x, dy: LOOK_WIDE.y - LOOK_PAST.y, k: K_WIDE },
];
export const camTargetAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
const CAM_F0 = -12;
const TRACK = runFollower(camTargetAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the final framing) */
export const REST_CAM: Cam = TRACK.cams[DURATION - 1 - CAM_F0];
