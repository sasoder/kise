// ---------------------------------------------------------------------------
// costChartPlan — THE CHART of sam-gigawatt-cost (owned by cut 1, FrontierCostClimbs; cut 2 imports it read-only).
// Pure plan, no React: the data, the row geometry, the column metrics, the world <-> AirCam mapping, the cut-1 rise
// wave and camera, and the cameras other cuts start from (CUT1_END_CAM, CHART_WIDE_CAM). Usage: CHART_READY.md in
// the clip's animation_source/notes/.
//
// THE CHART: one long row of glass columns on the apron's near cut edge (the edge is $0), one per frontier model of
// Epoch AI's list in date order (frontierCostData.ts, all 56 rows, real values, linear scale), evenly spaced; the
// amber fill is the training cost (2023 USD). Under each column a cream tile on the slab's cut face carries the lab's
// mark (labMarks.ts) and, for the named recent models, the model name.
//
// WORLD PX = cut 1's opening frame at k 1 (look = the world point on the frame's middle, screen = 540 + (x - look.x)
// * k, 960 + (y - look.y) * k). The chart plane is the apron's cut front edge, Z = ZC in AirStage's world (as
// scott-radar-map/npsColumnsPlan.ts; copied, not imported).
// ---------------------------------------------------------------------------
import { ROWS } from "./frontierCostData";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// --- the row ------------------------------------------------------------------------------------------------
/** $0: the apron slab's near cut edge (world y). */
export const GROUND = 1000;
/** column pitch, glass width, the tile under it (world px) */
export const PITCH = 160;
export const COL_W = 128;
export const TILE = { w: 144, h: 144, top: GROUND + 16, r: 6 } as const;
/** the first column's centre; column i stands at colX(i) */
export const X0 = 200;
export const N = ROWS.length;
export const colX = (i: number) => X0 + i * PITCH;
/** the row's ends (outer tile edges) */
export const ROW_X0 = colX(0) - TILE.w / 2;
export const ROW_X1 = colX(N - 1) + TILE.w / 2;

// --- money --------------------------------------------------------------------------------------------------
/** world px per $1M (2023 USD), linear: Grok 4's $388M is 6981 px */
export const PX_PER_M = 18;
/** glass above the fill (an empty stub for the near-zero columns of the early decade: the flat floor) */
export const HEADROOM = 24;
/** a rung every $100M inside the amber */
export const RUNG = 100 * PX_PER_M;
/** the fill length (world px) of row i: its real value, no minimum */
export const fillLen = (i: number) => (ROWS[i].usd / 1e6) * PX_PER_M;
/** the risen glass height of row i */
export const glassLen = (i: number) => fillLen(i) + HEADROOM;
/** the fill inside a glass risen to h (the headroom shrinks to nothing as the glass leaves the slot; full at full) */
export const fillAt = (i: number, h: number) => {
  const G = glassLen(i);
  if (G <= 0) return 0;
  return Math.max(0, h - HEADROOM * Math.min(1, h / G));
};
/** the tallest column (Grok 4) */
export const TALLEST = ROWS.reduce((m, r, i) => (r.usd > ROWS[m].usd ? i : m), 0);
export const TOP_Y = (i: number) => GROUND - glassLen(i);

// --- the rise wave of cut 1 ---------------------------------------------------------------------------------
/** frames (cut 1's clock, 24000/1001): the brief's word table */
export const BEAT = { leading: 1, edge: 8, AI: 13, go: 18, up: 24, or: 28, down: 30, that: 38 } as const;
/** every column before FIRST_RISER is standing at f0; the rest rise one after another in a wave (each column's
 *  slot parts over SLOT_F frames ending on its rise start: cause before effect). The tall ones take longer. */
export const FIRST_RISER = N - 6;
export const SLOT_F = 5;
export const RISE: Record<number, { f0: number; f1: number }> = {
  [N - 6]: { f0: -7, f1: 6 }, // Llama 3.1-405B, half way up at f0
  [N - 5]: { f0: -3, f1: 9 }, // Grok-2, just out of its slot at f0
  [N - 4]: { f0: 1, f1: 19 }, // Grok 3
  [N - 3]: { f0: 3, f1: 26 }, // GPT-4.5
  [N - 2]: { f0: 5, f1: 17 }, // Llama 4 Behemoth
  [N - 1]: { f0: 6, f1: 30 }, // Grok 4: lands by f30 ("down?")
};
/** the rise ease: a soft start, a long even middle, a weighty settle (npsColumnsPlan's travel) */
export const travel = (u: number) => {
  const x = clamp01(u);
  const quad = x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
  return 0.55 * ss(x) + 0.45 * quad;
};
/** risen glass height of row i at cut-1 frame f (after cut 1 every column is full: pass f = Infinity) */
export const riseH = (i: number, f: number) => {
  const r = RISE[i];
  if (!r) return glassLen(i);
  return glassLen(i) * travel((f - r.f0) / (r.f1 - r.f0));
};
/** the slot's opening 0..1 of row i at frame f */
export const slotOpen = (i: number, f: number) => {
  const r = RISE[i];
  if (!r) return 1;
  return ss((f - (r.f0 - SLOT_F)) / SLOT_F);
};

// --- the chart plane in the world (aircraftShared's pinhole, side mode, yaw 0, pitch 0) -----------------------
export const F0 = 2310;
export const ZC = 330;
export const EYE = 18;
/** screen px per metre on the chart plane at k 1 */
export const S0 = F0 / ZC;
/** The horizon may sink to HMAX at most: below that the camera RISES (a crane; the eye height follows) instead
 *  of shifting its lens further, so the climb keeps the golden haze low in frame instead of an all-dusk sky. The
 *  join is soft (from H_SOFT). A plane of constant Z projects flat for any eye height, so the 2D chart maps exactly. */
export const H_SOFT = 1300;
export const HMAX = 1640;
export const horizonOf = (look: { y: number; k: number }) => {
  const h0 = 960 + look.k * (GROUND - look.y - S0 * EYE);
  if (h0 <= H_SOFT) return h0;
  const span = HMAX - H_SOFT;
  return H_SOFT + span * (1 - Math.exp(-(h0 - H_SOFT) / span));
};
/** the AirCam of a look (any cut draws the chart by passing its look here and to the overlay transform) */
export const airCamOf = (c: { x: number; y: number; k: number }) => {
  const horizon = horizonOf(c);
  const eye = (GROUND - c.y - (horizon - 960) / c.k) / S0;
  return { mode: "side" as const, x: (c.x - 540) / S0, y: eye, z: 0, f: F0 * c.k, horizon };
};
/** the 3D ground: concrete from the cut edge back, desert beyond (metres; X = (worldX - 540) / S0) */
export const APRON: [number, number, number, number] = [(ROW_X0 - 6000 - 540) / S0, ZC - 2, (ROW_X1 + 6000 - 540) / S0, 760];

// --- cut 1's camera -----------------------------------------------------------------------------------------
/** makeClockCam LOOK + k (museShared). Opens close on the six newest plates (k ~0.84, the names readable, the
 *  plate bottoms above the caption band), then ONE damped pull-back, up and back (rev 2, the director's review: no
 *  crane chase): the zoom eases out from before f0 while the look eases up and left, so the $0 edge sinks to y ~1658
 *  (under the second caption band), the wave of columns rises into frame and by ~f30 the frame holds the whole
 *  recent climb: the flat 2016-22 floor continuing off the left edge, GPT-4 at mid-frame, the staircase to Grok 4
 *  (x ~940, top ~y 300) at the right. Then a living creep. Grok 4's full height and a $0 edge at y ~1020 cannot share
 *  a frame above k ~0.11 (the wide's proportions), so the edge sits low. Edge speeds peak ~85 px/f (the plates, f9,
 *  inside the zoom-out); camCheck maxV ~101, max |dv| 12.5. */
export const CAM_START = { x: colX(52.5) - 12, y: GROUND + 84, k: 1.04 } as const;
export const CAM_GLIDES = [
  { f0: -30, f1: 10, dx: 16, dy: -30, k: 1.02 },
  { f0: -10, f1: 24, k: 0.1938, warp: 0.9 },
  { f0: -1, f1: 23, dx: -1677, dy: -3661, warp: 1.45 },
  { f0: 24, f1: 74, dx: 20, dy: -30, k: 0.19 },
] as const;
export const CUT1_FRAMES = 37;
/** cut 1's LAST frame (f36): the look cut 2 opens on, pixel for pixel (draw the chart at this look with every
 *  column full, S = CUT1_END_S); its velocity per frame at f36 (the creep cut 2 can carry on). FrontierCostClimbs
 *  asserts these against its own camera at module load. */
export const CUT1_END_CAM = { x: 6927.955366182935, y: -2610.3808563719867, k: 0.19342835374594797 } as const;
export const CUT1_END_VEL = { x: -0.6068, y: -2.3983, k: -0.000109 } as const;
export const CUT1_END_S = 36;
/** cut 1's opening look (f0, after the pre-roll) */
export const CUT1_START_CAM = { x: 8599.261028670016, y: 1062.7041421263632, k: 0.8409832684009189 } as const;
/** AirStage's `rest` (the dust's parallax origin) for an AirCam: the opening camera with its eye height following
 *  the crane most of the way, so the dust drifts gently instead of streaming. Cut 2 passes the same to keep the
 *  dust continuous across the join. */
export const dustRestFor = (cam: ReturnType<typeof airCamOf>) => {
  const r = airCamOf(CUT1_START_CAM);
  return { ...r, y: cam.y - (cam.y - r.y) * 0.08 };
};

// --- the wide (cut 2's suggested end) ------------------------------------------------------------------------
/** the whole row spans ~91 % of the frame width, $0 at screen y 1020, Grok 4's top at ~y 270 */
export const WIDE_K = 980 / (ROW_X1 - ROW_X0);
export const CHART_WIDE_CAM = { x: (ROW_X0 + ROW_X1) / 2, y: GROUND - (1020 - 960) / WIDE_K, k: WIDE_K } as const;

// --- the title (world space where the wide lands; cut 2 brings it in) -----------------------------------------
/** "COST TO TRAIN EACH FRONTIER AI MODEL" + the source line, left-aligned at screen x 72, baseline y 150 in
 *  CHART_WIDE_CAM, in the darker sky above the chart (Kräftig caps, 40 px and 28 px screen there; the haze lower
 *  down washes cream out) */
const wx = (sx: number) => CHART_WIDE_CAM.x + (sx - 540) / WIDE_K;
const wy = (sy: number) => CHART_WIDE_CAM.y + (sy - 960) / WIDE_K;
export const TITLE = { x: wx(72), y: wy(150), px: 40 / WIDE_K, subY: wy(150 + 50), subPx: 28 / WIDE_K, text: "COST TO TRAIN EACH FRONTIER AI MODEL", sub: "EPOCH AI · 2023 US$" } as const;
/** the optional sparse scale ($M steps): ScaleTicks in costChartParts */
export const SCALE_STEPS = [100, 200, 300, 400] as const;
