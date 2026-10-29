// ---------------------------------------------------------------------------
// costGraphPlan — THE LINE GRAPH of sam-gigawatt-cost cuts 1-2 (rev 3, the user's review: "doesnt a graph here make
// more sense? … too many bars … focus on models the last few years … a bit more readable"). Owner: cuts 1-2
// (FrontierCostClimbs, GoneUpToThisPoint). Pure plan, no React: the 8 picked models, the axes, the label layout, the
// line's draw schedule (cut 1), the cameras of both cuts and the AirCam the haze is drawn from.
//
// THE GRAPH: a flat-to-camera line chart in the air (the Scott "air" look: AirStage's golden-hour sky, dust, grain),
// one amber line (AMBER = the dollars) through one cream coin per model carrying its lab's mark in ink, a short model
// name beside it in cream, the values on the recent climb. Linear $ axis ($0-$400M, gridlines every $100M), x = time
// (2020-2025, linear in years). Replaces the 56-column apron row (costChartPlan / costChartParts stay, unused).
//
// WORLD PX = THE WIDE (cut 2's landed frame) at k 1: look = the world point on the frame's middle, screen =
// 540 + (x - look.x) * k, 960 + (y - look.y) * k.
// ---------------------------------------------------------------------------
import { ROWS } from "./frontierCostData";
import type { LabId } from "./labMarks";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export type Look = { x: number; y: number; k: number };

// --- the data: 8 models, the exact Epoch values (frontierCostData = frontier_training_cost.json verbatim) -------------
type Pick = { model: string; short: string[]; lab: LabId | null; value?: string };
const PICKS: Pick[] = [
  { model: "GPT-3 175B (davinci)", short: ["GPT-3"], lab: "openai" },
  { model: "GPT-3.5 (davinci-002)", short: ["GPT-3.5"], lab: "openai" },
  { model: "GPT-4 (Mar 2023)", short: ["GPT-4"], lab: "openai" },
  { model: "Gemini 1.0 Ultra", short: ["GEMINI", "ULTRA"], lab: "gemini" },
  { model: "Llama 3.1-405B", short: ["LLAMA", "3.1"], lab: "meta" },
  { model: "Grok 3", short: ["GROK 3"], lab: "xai", value: "$218M" },
  { model: "GPT-4.5", short: ["GPT-4.5"], lab: "openai", value: "$366M" },
  { model: "Grok 4", short: ["GROK 4"], lab: "xai", value: "$388M" },
];
const yearOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const t0 = Date.UTC(y, 0, 1);
  return y + (Date.UTC(y, m - 1, d) - t0) / (Date.UTC(y + 1, 0, 1) - t0);
};

// --- the axes ------------------------------------------------------------------------------------------------
/** x: 2020.0 at X0, PX_PER_YEAR per year; y: $0 at Y0, PX_PER_M per $1M (linear) */
export const X0 = 150;
export const PX_PER_YEAR = 142;
export const Y0 = 1000;
export const PX_PER_M = 1.2;
export const xOf = (year: number) => X0 + (year - 2020) * PX_PER_YEAR;
export const yOf = (usd: number) => Y0 - (usd / 1e6) * PX_PER_M;
export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025] as const;
export const GRID_M = [100, 200, 300, 400] as const;
/** the plot's left/right ends (gridlines, axis) and the left margin the $ labels sit on */
export const PLOT = { x0: 90, x1: 990, labelX: 90 } as const;
/** type (world px = screen px in the wide) */
export const TYPE = { name: 39, value: 40, callout: 56, tick: 38, year: 38, title: 40, sub: 24 } as const;
export const LINE_GAP = 46;
/** the year labels' baseline (8 px lower than rev 3: the coins on the $0 floor sit right above the years) */
export const YEAR_BASE = Y0 + 58;

export type Align = "start" | "middle" | "end";
/** a label: anchor (world), alignment, lines (each a name or a value) and the first baseline */
export type LabelLine = { text: string; kind: "name" | "value" | "callout" };
export type PointLabel = { x: number; base: number; align: Align; lines: LabelLine[]; gap: number[] };
export type Point = { i: number; model: string; lab: LabId | null; year: number; usd: number; x: number; y: number; label: PointLabel; climb: boolean };

const rowOf = (model: string) => {
  const r = ROWS.find((q) => q.model === model);
  if (!r) throw new Error(`costGraphPlan: ${model} not in frontierCostData`);
  return r;
};
export const COIN_R = 22;

/** label placement per point (the wide's world px), chosen so no label meets another, a dot or the line */
const place = (i: number, x: number, y: number, p: Pick): PointLabel => {
  const names: LabelLine[] = p.short.map((t) => ({ text: t, kind: "name" as const }));
  switch (i) {
    case 0: // GPT-3: above, nudged right of the "$0" tick
      return { x: x + 20, base: y - COIN_R - 16, align: "middle", lines: names, gap: [] };
    case 1: // GPT-3.5: above, a little right (clear of the 2021|2022 gap cut 1's last frame crops at)
      return { x: x + 10, base: y - COIN_R - 16, align: "middle", lines: names, gap: [] };
    case 2: // GPT-4: above, ending just left of its coin's centre (Gemini's two lines sit to its right)
      return { x: x - 8, base: y - COIN_R - 16, align: "end", lines: names, gap: [] };
    case 3: // Gemini 1.0 Ultra: above, two lines, a little left (clear of Llama's coin and the climb)
      return { x: x - 21, base: y - COIN_R - 22 - LINE_GAP, align: "middle", lines: names, gap: [LINE_GAP] };
    case 4: // Llama 3.1: right of the dot, under the climb, two lines (LLAMA / 3.1) so the right margin stays wide
      return { x: x + COIN_R + 12, base: y - 8, align: "start", lines: names, gap: [44] };
    case 5: // Grok 3: left of the dot (the right of the climb stays open), name + value
      return { x: x - COIN_R - 12, base: y - 8, align: "end", lines: [...names, { text: p.value!, kind: "value" }], gap: [44] };
    case 6: // GPT-4.5: left of the dot, name + value
      return { x: x - COIN_R - 12, base: y - 8, align: "end", lines: [...names, { text: p.value!, kind: "value" }], gap: [44] };
    default: // Grok 4: above, name + the big callout, ending at the coin's right edge (the right margin stays wide)
      return { x: x + COIN_R, base: y - COIN_R - 78, align: "end", lines: [...names, { text: p.value!, kind: "callout" }], gap: [58] };
  }
};
export const POINTS: Point[] = PICKS.map((p, i) => {
  const r = rowOf(p.model);
  const year = yearOf(r.date);
  const x = xOf(year);
  const y = yOf(r.usd);
  return { i, model: p.model, lab: p.lab, year, usd: r.usd, x, y, label: place(i, x, y, p), climb: i >= 4 };
});
export const N = POINTS.length;
export const LLAMA = 4;

// --- the polyline and its draw (cut 1) --------------------------------------------------------------------------
export const SEG = POINTS.slice(1).map((p, j) => Math.hypot(p.x - POINTS[j].x, p.y - POINTS[j].y));
/** arc length at point i */
export const S_AT = POINTS.map((_, i) => SEG.slice(0, i).reduce((a, b) => a + b, 0));
export const S_TOTAL = S_AT[N - 1];
/** the point on the line at arc length s */
export const pointAt = (s: number) => {
  const u = Math.max(0, Math.min(S_TOTAL, s));
  let j = 0;
  while (j < N - 2 && S_AT[j + 1] < u) j++;
  const t = SEG[j] > 0 ? (u - S_AT[j]) / SEG[j] : 0;
  return { x: POINTS[j].x + (POINTS[j + 1].x - POINTS[j].x) * t, y: POINTS[j].y + (POINTS[j + 1].y - POINTS[j].y) * t, j };
};
/** cut 1's draw: the tip passed Llama 3.1 at f -DRAW_LEAD (its coin and name are in at f0, the tip already climbing),
 *  goes on at a steady pace and lands on Grok 4 at DRAW_END ("up" 24), easing only on the last stretch (constant
 *  speed V until DRAW_EASE, then a linear slowdown to rest) */
export const DRAW_LEAD = 5;
export const DRAW_END = 20;
export const DRAW_EASE = 13;
const RUN = S_TOTAL - S_AT[LLAMA];
const V = RUN / (DRAW_EASE + DRAW_LEAD + (DRAW_END - DRAW_EASE) / 2);
const S_EASE = S_AT[LLAMA] + V * (DRAW_EASE + DRAW_LEAD);
/** the drawn arc length at cut-1 frame f (Infinity after cut 1: the whole line) */
export const drawnAt = (f: number) => {
  if (!Number.isFinite(f)) return S_TOTAL;
  if (f <= DRAW_EASE) return Math.min(S_TOTAL, S_AT[LLAMA] + V * (f + DRAW_LEAD));
  const t = Math.min(f, DRAW_END) - DRAW_EASE;
  const T = DRAW_END - DRAW_EASE;
  return S_EASE + V * t - (V * t * t) / (2 * T);
};
/** the cut-1 frame the tip reaches point i (inverse of drawnAt; earlier points: negative) */
export const reachF = (i: number) => {
  const s = S_AT[i];
  if (s <= S_EASE) return (s - S_AT[LLAMA]) / V - DRAW_LEAD;
  let lo = DRAW_EASE;
  let hi = DRAW_END;
  for (let n = 0; n < 40; n++) {
    const m = (lo + hi) / 2;
    if (drawnAt(m) < s) lo = m;
    else hi = m;
  }
  return hi;
};
/** a coin is drawn by the tip: it opens out of the line over COIN_F frames from the frame the tip reaches it */
export const COIN_F = 4;
export const coinAt = (i: number, f: number) => clamp01((f - reachF(i)) / COIN_F);
/** a climb label slides in once its coin has landed */
export const LABEL_F = 9;
export const climbLabelAt = (i: number, f: number) => clamp01((f - reachF(i) - 2) / LABEL_F);

// --- the cameras ------------------------------------------------------------------------------------------------
/** the wide (cut 2 lands here) */
export const WIDE: Look = { x: 540, y: 960, k: 1 };
/** a pure zoom between two looks about the one world point they share on screen; p 0..1 (k eases in log space) */
export const zoomPath = (A: Look, B: Look) => {
  const LK = Math.log(B.k / A.k);
  const PX = (A.x * A.k - B.x * B.k) / (A.k - B.k);
  const PY = (A.y * A.k - B.y * B.k) / (A.k - B.k);
  const SX = 540 + (PX - A.x) * A.k;
  const SY = 960 + (PY - A.y) * A.k;
  const at = (p: number): Look => {
    const k = A.k * Math.exp(LK * p);
    return { x: PX - (SX - 540) / k, y: PY - (SY - 960) / k, k };
  };
  return { at, fixed: { x: SX, y: SY } };
};
/** Beta(2,3)'s cdf: a speed bump that starts moving at once, peaks a third in and settles long */
export const betaCdf = (x: number) => {
  const u = clamp01(x);
  return 6 * u * u - 8 * u * u * u + 3 * u * u * u * u;
};

/** THE YEAR ROW STAYS PUT (rev 4: every label is part of the chart from the first frame, so the year row is on
 *  screen in both cuts): every look of both cuts keeps world y YEAR_ROW (the year labels' baseline) at screen y
 *  YEAR_ROW, 1058, above caption band 1, and both pull-backs zoom about points on that row, so it never moves. */
export const YEAR_ROW = YEAR_BASE;
/** a look at zoom k that keeps the year row at screen YEAR_ROW and world x `wx` at screen x `sx` */
const rowLook = (wx: number, sx: number, k: number): Look => ({ x: wx - (sx - 540) / k, y: YEAR_ROW - (YEAR_ROW - 960) / k, k });
/** CUT 1's last frame (f36) = CUT 2's f0: the whole climb with the floor under it (Gemini, GPT-4, GPT-3.5, the years
 *  2022-25 and the $0 axis), Grok 4's name at y ~125, Llama's label ~190 px in from the right edge; the frame's
 *  left edge falls in the clean gap between "2021" / GPT-3's name and "2022" / GPT-3.5's name (world x ~362) */
export const CUT1_END_K = 1.44;
const CUT1_END_LEFT = 362;
export const CUT1_END: Look = rowLook(CUT1_END_LEFT, 0, CUT1_END_K);
/** CUT 1's opening look (close on Llama 3.1, its coin at screen x ~380 with its name to the right, the line arriving
 *  from Gemini at the left; the tip shoots up out of it) */
const C1_K0 = 1.95;
export const CUT1_START: Look = rowLook(POINTS[LLAMA].x, 380, C1_K0);
export const CUT1_FRAMES = 37;
export const CUT1_END_S = CUT1_FRAMES - 1;
/** cut 1's pull-back: under way from a pre-roll (moving at f0), most of it by ~f26, a creep into CUT1_END at f36 */
const C1 = zoomPath(CUT1_START, CUT1_END);
const C1_PRE = 3;
const C1_T = 30;
const C1_VC = 0.004;
const c1raw = (f: number) => betaCdf((f + C1_PRE) / C1_T) * (1 - C1_VC * (C1_T)) + C1_VC * Math.min(f + C1_PRE, C1_T);
const C1_END_RAW = c1raw(CUT1_END_S) + C1_VC * (CUT1_END_S + C1_PRE - C1_T);
export const cut1Progress = (f: number) => (c1raw(f) + C1_VC * Math.max(0, f + C1_PRE - C1_T)) / C1_END_RAW;
export const cut1Look = (f: number) => C1.at(cut1Progress(f));
/** cut 2's pull-back: CUT1_END -> WIDE (p 1 at f22, landed by ~f20), then a slow creep on past it */
const C2 = zoomPath(CUT1_END, WIDE);
const C2_T = 22;
const C2_VC = 0.0025;
export const cut2Progress = (f: number) => (1 - C2_VC * C2_T) * betaCdf(f / C2_T) + C2_VC * f;
export const cut2Look = (f: number) => C2.at(cut2Progress(f));
export const CUT_FIXED = { cut1: C1.fixed, cut2: C2.fixed } as const;

// --- the haze (AirStage's side camera) ------------------------------------------------------------------------------
/** The air behind the graph: AirStage's side camera with the horizon low (y ~1880 in the wide), so the graph sits in
 *  the deeper golden sky where cream type reads, the glow and the desert below it under the captions. It follows the
 *  look a little (parallax for the dust, the horizon easing down as the camera closes in). */
export const HORIZON = 1880;
export const airCamFor = (c: Look) => ({
  mode: "side" as const,
  x: (c.x - 540) * 0.02,
  y: 18,
  z: 0,
  f: 2310 * (0.9 + 0.1 * c.k),
  horizon: HORIZON + (c.k - 1) * 60 + (960 - c.y) * 0.05 * c.k,
});
/** the dust's parallax origin: the wide's camera, so the motes drift the same way in both cuts */
export const AIR_REST = airCamFor(WIDE);
/** the ground: desert only (no apron), far below the graph */
export const AIR_GROUND = { aprons: [] as [number, number, number, number][] };

// --- the titles (world px, the wide) -------------------------------------------------------------------------------
export const TITLE = { x: 90, y: 260, subY: 304, text: "COST TO TRAIN FRONTIER AI MODELS", sub: "SELECTED MODELS · EPOCH AI ESTIMATES · 2023 US$" } as const;

