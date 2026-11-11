// ---------------------------------------------------------------------------
// spikyShared (rsi-years-in-days): the chart world shared by cut 55 `AlsoSpiky` and cut 68 `OneJobInParticular`.
// Dwarkesh style (styles/dwarkesh.md). It holds ONLY what both cuts draw the same: the white baseline, the two white
// human reference lines and their labels, the level constants, the stroke widths, the AI-mark tone rule (deep when
// low, ripe with height, HIGHLIGHT for the part above the best-humans line), the needle shape, and the rest camera.
// The needles' height tables and every timing live in the cuts.
//
// WORLD = SCREEN AT THE REST CAMERA. At REST_CAM (cx 540, cy 960, k 1, no CAM_LIFT) a world px is a screen px, so
// every constant below is also where it sits on screen at rest:
//   baseline y 1195 · AVERAGE HUMAN y 835 · BEST HUMANS y 475 · v 2.55 (the tallest needle in cut 55) y 277;
//   lines x 70 -> 1010 (940 wide, centred); labels in a left gutter x 84 -> ~270 (two lines each, left-aligned,
//   sitting just above their line); needles stand in x ROW_L -> ROW_R (300 -> 1006), right of the gutter, so no
//   needle ever crosses a label.
// levelY(v): v = 0 baseline, 1 = average human, 2 = best humans, linear (UNIT 360 world px per level).
// No y-axis, no gridlines, no numbers.
//
// Orange = the AI's skills (needles); white = people (the lines, their labels, the baseline).
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, CAM_DAMP, CAM_STIFF, clamp01, makeTone } from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, Label, hermite, worldPx } from "../kits/dwarkesh/alignShared";
import { HIGHLIGHT } from "../kits/dwarkesh/levelUp";

export { HIGHLIGHT };

// --- levels, world px --------------------------------------------------------------------------------------------
export const BASE_Y = 1195; // the white baseline (ground rule)
export const UNIT = 360; // world px per level
export const levelY = (v: number) => BASE_Y - v * UNIT;
export const levelOfY = (y: number) => (BASE_Y - y) / UNIT;
export const AVG_V = 1;
export const BEST_V = 2;
export const AVG_Y = levelY(AVG_V); // 835
export const BEST_Y = levelY(BEST_V); // 475

// --- horizontal extent -------------------------------------------------------------------------------------------
export const CHART_L = 70; // the baseline and both reference lines run CHART_L -> CHART_R
export const CHART_R = 1010;
export const CHART_CX = (CHART_L + CHART_R) / 2; // 540
export const GUTTER_X = 74; // the labels' left edge (84 -> 74 with the 52 px labels: AVERAGE clears needle 0)
export const ROW_L = 300; // needles stand between ROW_L and ROW_R (base edges included)
export const ROW_R = 1006;

// --- the rest camera ---------------------------------------------------------------------------------------------
// The whole chart, world = screen. cy is the frame's centre in world px (no CAM_LIFT).
export const K_REST = 1;
export const REST_CAM = { cx: 540, cy: 960, k: K_REST } as const;

// --- strokes, at the rest zoom -----------------------------------------------------------------------------------
export const STROKE = worldPx(6.5, K_REST); // the baseline: the style's one weight
export const REF_STROKE = worldPx(4.5, K_REST); // the human reference lines: a touch lighter than the ground rule

// --- labels ------------------------------------------------------------------------------------------------------
export const LEVEL_LABEL_SIZE = worldPx(52, K_REST); // ~52 screen px at rest, ~68 at k 1.3
export const LEVEL_LABEL_LH = 1.02; // line pitch, in label sizes
export const LEVEL_LABEL_GAP = 12; // world px from the label's last line box to its line
export const LEVEL_LABELS = {
  best: ["Best", "humans"],
  avg: ["Average", "human"],
} as const;
// Top of a label block whose last line sits LEVEL_LABEL_GAP above `lineY`.
export const levelLabelTop = (lineY: number, lines: number) =>
  lineY - LEVEL_LABEL_GAP - LEVEL_LABEL_SIZE * (1 + (lines - 1) * LEVEL_LABEL_LH);
// The year / era label ("TODAY", "2028"): the chart's TOP-left corner, over the gutter, ~95 world px above the BEST
// HUMANS block. Not the bottom corner: there it sits in the caption band 1360-1460 whenever a camera pushes in on the
// upper half (k 1.3), and between the level labels it read as a third level.
export const YEAR_LABEL_SIZE = worldPx(60, K_REST);
export const YEAR_X = GUTTER_X;
export const YEAR_Y = 212; // top of its line box (bottom ~272)

// --- the tone rule -----------------------------------------------------------------------------------------------
// An AI mark is ACCENT_DEEP when low and ripens to ACCENT with height (full ACCENT at the best-humans line); the
// part of it above BEST_Y is HIGHLIGHT. `NEEDLE_TONE_V0` is where the ripening starts.
const TONE = makeTone(ACCENT_DEEP, ACCENT);
export const NEEDLE_TONE_V0 = 0.6;
export const needleTone = (v: number) => TONE(clamp01((v - NEEDLE_TONE_V0) / (BEST_V - NEEDLE_TONE_V0)));

// --- the needle --------------------------------------------------------------------------------------------------
// A tapered spike standing on the baseline: base `w` wide, sharp tip at levelY(v). Its half-width is the sum of a
// slight straight taper (0 at the tip, (1 - NEEDLE_SHAFT) of the base half-width at the base) and a point cap that
// rises quadratically from the tip to NEEDLE_SHAFT of the base half-width over the SAME top NEEDLE_POINT world px on
// every needle (the whole height only on a needle shorter than that), then stays flat: one smooth, monotone flank,
// and every tip has the same sharp angle, so short needles are small thorns, not domes. The body holds its width
// up to the point, so a tall needle is still ~20 px wide where it crosses the best-humans line and its HIGHLIGHT
// reads at phone size by size, not by tint alone.
export const NEEDLE_SHAFT = 0.88;
export const NEEDLE_POINT = 100;
const NEEDLE_STEPS = 30;
export const needleHalfWidth = (d: number, h: number, w: number) => {
  // d = distance below the tip (0 at the tip, h at the base)
  const hw = w / 2;
  const hs = hw * NEEDLE_SHAFT;
  const D = Math.min(NEEDLE_POINT, h);
  const u = 1 - Math.min(1, d / D);
  return hs * (1 - u * u) + ((hw - hs) * d) / Math.max(1e-6, h);
};
export const needlePath = (x: number, w: number, v: number) => {
  const tipY = levelY(Math.max(0, v));
  const h = BASE_Y - tipY;
  const f = (n: number) => n.toFixed(2);
  const left: string[] = [];
  const right: string[] = [];
  for (let j = 0; j < NEEDLE_STEPS; j++) {
    // d from the base (h) toward the tip (0), denser near the tip where the point turns
    const d = h * Math.pow(1 - j / NEEDLE_STEPS, 1.5);
    const y = tipY + d;
    const r = needleHalfWidth(d, h, w);
    left.push(`${f(x - r)} ${f(y)}`);
    right.push(`${f(x + r)} ${f(y)}`);
  }
  return `M${left.join(" L")} L${f(x)} ${f(tipY)} L${right.reverse().join(" L")} Z`;
};

/** The clipPath every highlight copy uses: everything above the best-humans line. Put it once in each <svg>. */
export const ABOVE_BEST_CLIP = "spiky-above-best";
export const AboveBestClip: React.FC = () => (
  <defs>
    <clipPath id={ABOVE_BEST_CLIP}>
      <rect x={-2000} y={-4000} width={5080} height={4000 + BEST_Y} />
    </clipPath>
  </defs>
);

/** One needle in its tone, with the part above BEST_Y in HIGHLIGHT (derived from the tip, never a timer). */
export const Needle: React.FC<{ x: number; w: number; v: number }> = ({ x, w, v }) => {
  if (v <= 0.002) return null;
  const d = needlePath(x, w, v);
  return (
    <>
      <path d={d} fill={needleTone(v)} />
      {v > BEST_V ? <path d={d} fill={HIGHLIGHT} clipPath={`url(#${ABOVE_BEST_CLIP})`} /> : null}
    </>
  );
};

// --- the chart frame (SVG, world space) --------------------------------------------------------------------------
// The two reference lines, then the baseline. Draw it BEFORE the needles so they stand on it and pass in front of
// the reference lines. `refIn` (0..1) draws a reference line out from CHART_L, head-led, if a cut needs to.
export const ChartLines: React.FC<{ bestIn?: number; avgIn?: number; baseIn?: number }> = ({
  bestIn = 1,
  avgIn = 1,
  baseIn = 1,
}) => {
  const line = (y: number, t: number, w: number) =>
    t > 0 ? (
      <line
        x1={CHART_L}
        y1={y}
        x2={CHART_L + (CHART_R - CHART_L) * clamp01(t)}
        y2={y}
        stroke={INK}
        strokeOpacity={INK_HI}
        strokeWidth={w}
        strokeLinecap="round"
      />
    ) : null;
  return (
    <>
      {line(BEST_Y, bestIn, REF_STROKE)}
      {line(AVG_Y, avgIn, REF_STROKE)}
      {line(BASE_Y, baseIn, STROKE)}
    </>
  );
};

// --- the level labels (DOM, world div) ---------------------------------------------------------------------------
// Two lines, left-aligned at GUTTER_X, the block sitting just above its line. inT 0..1 = alignShared's slide-up.
export const LevelLabel: React.FC<{ k: number; which: "best" | "avg"; inT: number }> = ({ k, which, inT }) => {
  const lines = LEVEL_LABELS[which];
  const top = levelLabelTop(which === "best" ? BEST_Y : AVG_Y, lines.length);
  return (
    <>
      {lines.map((t, i) => (
        <Label
          key={t}
          k={k}
          x={GUTTER_X}
          y={top + i * LEVEL_LABEL_SIZE * LEVEL_LABEL_LH}
          text={t}
          inT={inT}
          size={LEVEL_LABEL_SIZE}
          align="left"
        />
      ))}
    </>
  );
};

// --- a three-channel camera over this chart ----------------------------------------------------------------------
// Knots (f, k, x, y) with y = the world point at the FRAME'S CENTRE (no CAM_LIFT), on one monotone Hermite per
// channel, one key per frame from `pre` (negative: the damper is pre-rolled so f0 opens mid-drift) to `last`,
// through the kit's damper (CAM_STIFF / CAM_DAMP). Returns a lookup table by frame, built once.
export type ChartKnot = { f: number; k: number; x: number; y: number };
export const chartCamera = (knots: ChartKnot[], pre: number, last: number) => {
  const fs = knots.map((n) => n.f);
  const kOf = hermite(
    fs,
    knots.map((n) => n.k),
  );
  const xOf = hermite(
    fs,
    knots.map((n) => n.x),
  );
  const yOf = hermite(
    fs,
    knots.map((n) => n.y),
  );
  let k = kOf(pre);
  let cx = xOf(pre);
  let cy = yOf(pre);
  let vk = 0;
  let vx = 0;
  let vy = 0;
  const table: { k: number; cx: number; cy: number }[] = [];
  for (let f = pre + 1; f <= last; f++) {
    vk += (kOf(f) - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    vx += (xOf(f) - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (yOf(f) - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    if (f >= 0) table.push({ k, cx, cy });
  }
  return (frame: number) => table[Math.max(0, Math.min(table.length - 1, Math.round(frame)))];
};

/** Where a world y lands on screen under a camera (ignoring sway). */
export const screenY = (y: number, cam: { k: number; cy: number }) => 960 + (y - cam.cy) * cam.k;
export const screenX = (x: number, cam: { k: number; cx: number }) => 540 + (x - cam.cx) * cam.k;

// keep ACCENT referenced for cuts that import the palette from here
export const AI_LIT = ACCENT;
export const AI_DEEP = ACCENT_DEEP;
