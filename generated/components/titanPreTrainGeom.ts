import { camFromTrack, glideTargetAt, runFollower, smoothstep } from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// titanPreTrainGeom -- the world, the clocks and the camera of TitanPreTrain V2
// (Bharat, "Synthetic data needs real data", ChinaTalk, cut B, reimagined as ONE
// vertical picture: the card, a model, a stream of red squares, all on x 540).
// World px; the final framing is k 1.0 with the look at (540, 835), so world =
// screen there. Everything is a pure function of the local frame f (= S - IN).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = 324;
export const DURATION = 245;

/** the one stroke weight (world px at K_REF, through the size law: ~6 screen px) */
export const W = 5.6;
export const CX = 540;

// --- the card: 880 x 470 screen px at the open, 560 wide in the final column ----
export const CARD_PX_W = 880;
export const CARD_PX_H = 470;
export const CARD_W = 560;
export const K0 = CARD_PX_W / CARD_W;
export const CARD_H = CARD_PX_H / K0;
export const CARD_TOP = 290;
export const CARD_BOT = CARD_TOP + CARD_H;
export const CARD_CY = CARD_TOP + CARD_H / 2;

// --- the column: card -> label -> model, equal gaps ------------------------------
/** card foot -> the model's top edge; the label sits exactly half way */
export const GAP = 290;
export const NODE_R = 20;
export const NODE_DX = 160;
export const ROW_DY = 125;
export const LABEL_Y = CARD_BOT + GAP / 2;
/** rows top -> bottom: output (3), hidden (4), input (3) */
export const ROW_Y = [0, 1, 2].map((r) => CARD_BOT + GAP + NODE_R + r * ROW_DY);
export const ROWS: Pt[][] = [3, 4, 3].map((n, r) =>
  Array.from({ length: n }, (_, c) => ({ x: CX + (c - (n - 1) / 2) * NODE_DX, y: ROW_Y[r] })),
);
export const LINKS: [Pt, Pt][] = [0, 1].flatMap((r) => ROWS[r].flatMap((a) => ROWS[r + 1].map((b) => [a, b] as [Pt, Pt])));
export const MODEL_X0 = CX - 1.5 * NODE_DX - NODE_R;
export const MODEL_X1 = CX + 1.5 * NODE_DX + NODE_R;
export const MODEL_Y0 = ROW_Y[0] - NODE_R;
export const MODEL_Y1 = ROW_Y[2] + NODE_R;
/** the dashed link: from the model's top node up to the card's foot (broken round the label) */
export const LINK_Y0 = MODEL_Y0 - 10;
export const LINK_Y1 = CARD_BOT + 10;
export const LABEL_CLEAR = 34;

// --- the red file (synthetic data): straight up the centre axis --------------------
export const SQ = 30;
export const SQ_R = 3;
export const PITCH = 42;
/** the write head, under the caption line: squares are written here and fade in over FADE_IN px */
export const HEAD_Y = 1440;
export const FADE_IN = 60;
/** the input node the file feeds */
export const INLET: Pt = ROWS[2][1];
export const PATH_LEN = HEAD_Y - INLET.y;

export const FILE_F0 = 130;
const V_FAST = 12;
const V_STEADY = 10;
const V_SLOW = 4.2;
const fileV = (f: number) => {
  if (f <= FILE_F0) return 0;
  const a = V_FAST * smoothstep((f - FILE_F0) / 6);
  const b = (V_STEADY - V_FAST) * smoothstep((f - 155) / 8);
  const c = (V_SLOW - V_STEADY) * smoothstep((f - 185) / 12);
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
export const bornF = (i: number) => Math.max(FILE_F0, fileFrameAt(i * PITCH));
export const arriveF = (i: number) => fileFrameAt(i * PITCH + PATH_LEN + SQ / 2);
/** the squares that train the model */
export const N_TRAIN = 6;
export const TRAIN_STEP_F = 6;
const TRAIN_ARRIVALS = Array.from({ length: N_TRAIN }, (_, i) => arriveF(i));
/** how much of the model the data has reached (0..1): each arrival carries the front one step up */
export const trainU = (f: number) => TRAIN_ARRIVALS.reduce((s, a) => s + smoothstep((f - a) / TRAIN_STEP_F), 0) / N_TRAIN;
export const FIRST_ARRIVAL_F = TRAIN_ARRIVALS[0];
export const TRAIN_DONE_F = TRAIN_ARRIVALS[N_TRAIN - 1] + TRAIN_STEP_F;

// --- clocks -------------------------------------------------------------------------
/** "fielded": the paper face diffuses away ... */
export const FACE_F0 = 89;
export const FACE_F1 = 109;
/** ... while the dashed outline writes itself round the same rectangle */
export const FRAME_F0 = 85;
export const FRAME_F1 = 116;
/** the headline drops to context */
export const CONTEXT_F = 91;
/** the model writes in from the bottom up */
export const MODEL_F0 = 129;
export const MODEL_F1 = 153;
/** the dashed link rises from the model's top node to the card's foot */
export const LINK_F0 = 197;
export const LINK_F1 = 217;

// --- the camera: creep, pull-back, tilt down, final column ---------------------------
const lookFor = (wy: number, sy: number, k: number): Cam => ({ x: CX, y: wy - (sy - 835) / k, k });
/** the open: the card 880 px wide, centred (540, 800) */
export const CAM_START: Cam = lookFor(CARD_CY, 800, K0);
const K_CREEP = K0 * 1.04;
const K_UP = 1.12;
const K_TILT = 1.04;
const K_FINAL = 1.0;
/** "So before we even": the card at the top of the composition, top edge y 300 */
const LOOK_UP = lookFor(CARD_TOP, 300, K_UP);
/** tilted down: the model and the rising file open below the card */
const LOOK_TILT: Cam = { x: CX, y: 872, k: K_TILT };
/** the final column: card, label, dashed link, model, the red file entering from below */
const LOOK_FINAL: Cam = { x: CX, y: 835, k: K_FINAL };
export const GLIDES: Glide[] = [
  // the slow creep on the card through "the TITAN program"
  { f0: -6, f1: 71, k: K_CREEP },
  // "So before we even": the card eases up and shrinks
  { f0: 59, f1: 93, dy: LOOK_UP.y - CAM_START.y, k: K_UP },
  // "some of these capabilities, I'm like, hey": one tilt down
  { f0: 115, f1: 153, dy: LOOK_TILT.y - LOOK_UP.y, k: K_TILT },
  // "let's see if we could do some things": ease to the final column
  { f0: 193, f1: 233, dy: LOOK_FINAL.y - LOOK_TILT.y, k: K_FINAL },
  // the end: a slow creep (+1.5 %) still running on the last frame
  { f0: 212, f1: 262, k: K_FINAL * 1.015, warp: 0.8 },
];
export const camTargetAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
const CAM_F0 = -12;
const TRACK = runFollower(camTargetAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the final framing) */
export const REST_CAM: Cam = TRACK.cams[DURATION - 1 - CAM_F0];

