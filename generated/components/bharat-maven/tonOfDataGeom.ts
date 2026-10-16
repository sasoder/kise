import { BAR_W, camFromTrack, glideTargetAt, growAt, runFollower, smoothstep } from "./mavenKit";
import type { Cam, Glide } from "./mavenKit";

// ---------------------------------------------------------------------------
// tonOfDataGeom -- the world of the "three bars and one level line" picture of
// the Bharat Maven clip (V3): cut B TonOfData builds it, cut D
// EnoughRelevantData picks up its wide and resolves it. World px, y down, the
// baseline is y = 0. Everything of B is a function of B's local frame S.
// ---------------------------------------------------------------------------
export const FPS = 24;

// --- the shared picture --------------------------------------------------------
/** bar centres: DATA · RELEVANT TARGETS · MODEL (the gap is set by the label widths, see TonOfData header) */
export const X_DATA = 190;
export const X_REL = 470;
export const X_MODEL = 850;
export const W = BAR_W;
/** the ton of data, and what a model built on it is expected to be */
export const H_TALL = 1080;
/** the relevant data there actually is */
export const H_STUB = 64;
export const BASE_X0 = 75;
export const BASE_X1 = 965;
/** the level line rests on the red top and overhangs both bars a little */
export const LEVEL_OVER = 30;
export const LEVEL_X0 = X_REL - W / 2 - LEVEL_OVER;
export const LEVEL_X1 = X_MODEL + W / 2 + LEVEL_OVER;
/** the wide that shows all three bars whole: B reaches it, D opens on it */
export const WIDE_LOOK: Cam = { x: 520, y: -450, k: 0.9 };
export const L_DATA = "DATA";
export const L_REL = ["RELEVANT", "TARGETS"];
export const L_MODEL = "MODEL";

// --- cut B: clocks ---------------------------------------------------------------
export const B_IN = 419;
export const B_DURATION = 194;
/** DATA shoots up: ~300 px and 40 px/f at S 0, full at S 34 */
export const dataH = (S: number) => H_TALL * growAt(S, -12, 46);
/** the relevant bar tries to grow and stops as a stub ("didn't have") */
export const STUB_S0 = 40;
export const STUB_F = 14;
export const stubH = (S: number) => H_STUB * growAt(S, STUB_S0, STUB_F);
/** the expected MODEL outline writes itself up ("your models") */
export const modelDraw = (S: number) => growAt(S, 63, 23);
/** the level line is written from the stub across the model bar ("weren't as") */
export const LEVEL_S0 = 84;
export const LEVEL_S1 = 98;
export const levelDraw = (S: number) => smoothstep((S - LEVEL_S0) / (LEVEL_S1 - LEVEL_S0));
/** the fill rises inside the outline and stops at the level ("performant" 108) */
export const fillH = (S: number) => H_STUB * growAt(S, 90, 16);
/** a slow bead keeps travelling the level line in the hold */
export const RUN_S0 = 112;
export const RUN_F = 46;
export const runnerAt = (S: number) => {
  if (S < RUN_S0) return null;
  const u = ((S - RUN_S0) % RUN_F) / RUN_F;
  return { u: smoothstep(u), op: smoothstep(u / 0.15) * (1 - smoothstep((u - 0.8) / 0.2)) };
};
/** the baseline is short under DATA at first and is written on to the right, leading the camera */
export const baseDraw = (S: number) => (265 + (BASE_X1 - BASE_X0 - 265) * smoothstep((S - 30) / 34)) / (BASE_X1 - BASE_X0);
/** label landings (local word frames) */
export const W_RELEVANT = 51;
export const W_TARGETS = 57;
export const W_MODEL = 79;
export const W_OPERATIONS = 160;
/** DATA's label drops to context when the relevant one arrives */
export const DATA_LO_S = 46;

// --- cut B: the camera (LOOK = content centre, lands at screen 540 / 835) -------
export const B_CAM_START: Cam = { x: X_DATA, y: -150, k: 1.25 };
export const B_GLIDES: Glide[] = [
  // "a ton of data": ride the tip up, easing back just enough that the foot and its label stay above the captions
  { f0: -12, f1: 40, dy: -279, k: 1.06 },
  // "that, again, didn't have relevant targets": down and right to the second position, tower foot beside the stub
  { f0: 28, f1: 64, dx: 200, dy: 129, k: 1.05, warp: 1.2 },
  // "your models": ease back to the wide as the expected outline writes itself up
  { f0: 58, f1: 96, dx: WIDE_LOOK.x - (X_DATA + 200), dy: WIDE_LOOK.y + 300, k: WIDE_LOOK.k },
  // "once we put those models into operations": push in on the pair that matters (stub, level line, low fill);
  // the DATA tower slides out on the left
  { f0: 112, f1: 184, dx: 735 - WIDE_LOOK.x, dy: -322 - WIDE_LOOK.y, k: 1.18, warp: 0.85 },
  // the hold: a creep that is still decaying on the last frame
  { f0: 170, f1: 215, dx: 4, k: 1.195 },
];
const CAM_F0 = -14;
const B_TRACK = runFollower((f) => glideTargetAt(B_CAM_START, B_GLIDES, f), CAM_F0, B_DURATION + 2);
export const bCamAt = camFromTrack(B_TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (shared by B and D) */
export const REST_CAM: Cam = { x: WIDE_LOOK.x, y: WIDE_LOOK.y + 125 / WIDE_LOOK.k, k: WIDE_LOOK.k };

// ---------------------------------------------------------------------------
// cut D, EnoughRelevantData: the same picture, answered. Functions of D's local
// frame S.
// ---------------------------------------------------------------------------
export const D_IN = 883;
export const D_DURATION = 144;
/** the USE CASE mark: a hair tick across the top of the expected MODEL outline, written right -> left */
export const USE_TICK_X0 = LEVEL_X1;
export const USE_TICK_X1 = X_MODEL - W / 2;
export const useTickDraw = (S: number) => smoothstep((S - 16) / 12);
export const W_USE_CASE = 28;
/** "tied to the data": the dashed need-level runs on from the tick to above the red position ... */
export const tieDraw = (S: number) => smoothstep((S - 34) / 12);
/** ... and drops a dashed red outline there, as tall as the need (lands on "data" 50) */
export const needDraw = (S: number) => growAt(S, 40, 14);
/** DATA (the ton) eases to context: it was never the constraint */
export const DATA_DIM_S = 38;
/** "getting enough of it": the red bar grows up inside its outline; the level line and the MODEL fill ride on its top */
export const RED_S0 = 63;
export const RED_F = 31;
export const redH = (S: number) => H_STUB + (H_TALL - H_STUB) * growAt(S, RED_S0, RED_F);
export const W_ENOUGH = 77;
/** "to build performant": the MODEL outline is inked solid from the level line's contact (the apex) down both sides */
export const OUTLINE_S0 = 97;
export const OUTLINE_F = 27;
export const outlineDraw = (S: number) => growAt(S, OUTLINE_S0, OUTLINE_F);
export const W_PERFORMANT = 124;
/** MODEL eases down one label line to make room for PERFORMANT above it */
export const modelLine = (S: number) => smoothstep((S - 108) / 14);
/** the slow bead on the level line: low before the rise, on top after it */
export const dRunnerAt = (S: number) => {
  const inRise = S > RED_S0 - 4 && S < RED_S0 + RED_F + 4;
  const t = S < RED_S0 ? S + 20 : S - (RED_S0 + RED_F + 4);
  if (inRise || t < 0) return null;
  const u = (t % RUN_F) / RUN_F;
  return { u: smoothstep(u), op: smoothstep(u / 0.15) * (1 - smoothstep((u - 0.8) / 0.2)) };
};

export const D_CAM_START: Cam = { x: 525, y: WIDE_LOOK.y, k: WIDE_LOOK.k };
export const D_GLIDES: Glide[] = [
  // "understanding the use case tied to the data": a slow creep toward the third bar
  { f0: -24, f1: 60, dx: 5, k: 0.915 },
  // "getting enough of it": lean in on the rising pair, as far as the labels allow above the captions ...
  { f0: 57, f1: 84, dx: 40, dy: 35, k: 1.0 },
  // ... and ease back to the wide for the hold
  { f0: 86, f1: 122, dx: WIDE_LOOK.x - 570, dy: -35, k: WIDE_LOOK.k },
  // the held breath: a slow creep in
  { f0: 118, f1: 175, k: 0.92 },
];
const D_CAM_F0 = -24;
const D_TRACK = runFollower((f) => glideTargetAt(D_CAM_START, D_GLIDES, f), D_CAM_F0, D_DURATION + 2);
export const dCamAt = camFromTrack(D_TRACK.cams, D_CAM_F0);
