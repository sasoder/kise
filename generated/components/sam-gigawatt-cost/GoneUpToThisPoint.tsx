// ---------------------------------------------------------------------------
// GoneUpToThisPoint (sam-gigawatt-cost, cut 3). Rev 3 (the user's review: a line graph, fewer models, readable).
// Cheeky Pint style, the realistic variant carried into the air (styles/cheeky-pint.md; the Scott Kirby clips' sky:
// AirStage from scott-aircraft-order/aircraftShared.tsx, imported read-only). Opaque 1080x1920, 23.976 fps, 34 frames.
// Joined to cut 1 (FrontierCostClimbs).
//
// CHECK LINE: "for years frontier AI cost almost nothing to train, and then it shot up — that's where we are now."
//
// THE LINE (John Collison): "Why? Because it's gone up to this point, right?" — this slot holds "Because it's gone up
// to this point, right?"; then Sam on camera: "I mean, …".
// WORD -> FRAME (from f0; whisper, may run ~5 f early): Why -8 · Because -2 · it's 2 · gone 7 · up 9 · to 14 ·
// this 18 · point 21 · right 27 · (Sam) I 35.
// DURATION: the slot 3.879 -> 5.297 s (sequence frames 93-127) = 1.418 s x 23.976 = 34 frames (f0..f33).
//
// THE MOTION: f0 is cut 1's last frame pixel for pixel (CUT1_END, the whole line drawn, story clock S = CUT1_END_S + f
// so the dust and clouds carry on). From f0 ONE damped pull-back about the point the two looks share (by GPT-4.5 at
// the right edge) widens to the whole graph: the 2020-22 floor (GPT-3, GPT-3.5) slides in from the left (p 1 at f14,
// landed ~f12), and the $0 axis rises out of the caption band ahead of it, on a faster clock (above the band by ~f5).
// Then a living creep, dust, grain to f33.
// THE TEXT FILLS IN FROM f1 (rev 3b, the user: "it just start filling in from the first frame"): f0 has no new text
// (the join); from f1 each label slides up in world space (the house Rise, 7 f) as soon as it is inside the frame and
// above the bands for its whole entrance, in order: the $100M-$400M labels ride the frame's left edge (a sticky y
// axis, settling onto x 60 as the wide lands) bottom to top f1-f4; the early names right to left from f2 (Gemini,
// GPT-4, GPT-3.5, GPT-3); the years left to right once the axis is above the band (2021-2025 ~f5-f9, 2020 when the
// left edge brings it in, ~f10); $0 and the title as the left edge arrives (~f10). The frames are computed below
// (GATES, printed in the check script) from the camera, so a camera change re-times them.
// AMBER = the dollars (the line); cream = the coins, the type.
// Plan: costGraphPlan.ts. Pieces: costGraphParts.tsx.
//
// SOURCES: as FrontierCostClimbs (Epoch AI "Notable AI Models", "Training compute cost (2023 USD)", exact values from
// frontier_training_cost.json, 8 selected frontier models 2020-2025; on screen rounded to $1M).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage } from "../scott-aircraft-order/aircraftShared";
import { AIR_GROUND, AIR_REST, CUT1_END, CUT1_END_S, ENTER2_DUR, ENTER2_TICKS, LLAMA, PLOT, POINTS, S_TOTAL, TITLE, TYPE, Y0, YEARS, airCamFor, cut2Look, xOf, type Look } from "./costGraphPlan";
import { CostGraph, TICK_W, TITLE_W, YEAR_W, graphTransform, labelBox } from "./costGraphParts";

export const FPS = 24000 / 1001;
export const DURATION = 34;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the join: f0 must be cut 1's last look exactly
{
  const c = cut2Look(0);
  if (Math.abs(c.x - CUT1_END.x) > 1e-6 || Math.abs(c.y - CUT1_END.y) > 1e-6 || Math.abs(c.k - CUT1_END.k) > 1e-9) {
    throw new Error(`GoneUpToThisPoint: f0 look ${JSON.stringify(c)} != CUT1_END`);
  }
}

// --- the entrances --------------------------------------------------------------------------------------------------
type Box = { x0: number; x1: number; y0: number; y1: number };
const easeOut = (u: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 3);
/** the sticky y axis: a $ label's world x at a look (the frame's left edge + 60 px until the plot's left end is there) */
const tickX = (c: Look) => Math.max(PLOT.labelX, c.x + (PLOT.labelX - 540) / c.k);
const tickBox = (m: number) => (c: Look): Box => {
  const x = m === 0 ? PLOT.labelX : tickX(c);
  const base = Y0 - m * 1.5 - 10;
  return { x0: x, x1: x + TICK_W(m), y0: base - 0.72 * TYPE.tick, y1: base };
};
const yearBox = (y: number) => (): Box => ({ x0: xOf(y) - YEAR_W / 2, x1: xOf(y) + YEAR_W / 2, y0: Y0 + 50 - 0.72 * TYPE.year, y1: Y0 + 50 });
const nameBox = (i: number) => (): Box => labelBox(POINTS[i].label);
const titleBox = (): Box => ({ x0: TITLE.x, x1: TITLE.x + TITLE_W, y0: TITLE.y - 0.74 * TYPE.title, y1: TITLE.subY + 6 });
/** the screen box at frame f, with the Rise's slide (24 screen px, easing out) */
const onScreen = (box: (c: Look) => Box, f: number, a: number): Box => {
  const c = cut2Look(f);
  const b = box(c);
  const dy = (1 - a) * 24;
  return { x0: 540 + (b.x0 - c.x) * c.k, x1: 540 + (b.x1 - c.x) * c.k, y0: 960 + (b.y0 - c.y) * c.k + dy, y1: 960 + (b.y1 - c.y) * c.k + dy };
};
/** inside the frame (12 px margin) and above caption band 1 (y 1080; 6 px margin) */
const fits = (b: Box) => b.x0 >= 12 && b.x1 <= 1068 && b.y0 >= 12 && b.y1 <= 1074;
/** the first start frame >= from whose whole entrance (every frame it shows at all) fits; and fits afterwards */
const gate = (box: (c: Look) => Box, from: number) => {
  for (let s = Math.max(1, from); s < DURATION; s++) {
    let ok = true;
    for (let f = s + 1; f < DURATION && ok; f++) {
      const a = easeOut((f - s) / ENTER2_DUR);
      if (a > 0.02 && !fits(onScreen(box, f, a))) ok = false;
    }
    if (ok) return s;
  }
  throw new Error("GoneUpToThisPoint: a label never fits the frame");
};
/** gate a list in order: each starts no earlier than the one before + 1 */
const chain = (boxes: ((c: Look) => Box)[], from: number) => {
  const out: number[] = [];
  boxes.forEach((b, j) => out.push(gate(b, j === 0 ? from : out[j - 1] + 1)));
  return out;
};
const tickStarts = chain(ENTER2_TICKS.map(tickBox), 1);
const nameStarts = chain([3, 2, 1, 0].map(nameBox), 2);
const yearStarts = chain(YEARS.filter((y) => y > 2020).map(yearBox), 1);
/** the start frames, by label (exported for the check script) */
export const GATES = {
  ticks: Object.fromEntries(ENTER2_TICKS.map((m, j) => [m, tickStarts[j]])) as Record<number, number>,
  zero: gate(tickBox(0), 1),
  names: Object.fromEntries([3, 2, 1, 0].map((i, j) => [i, nameStarts[j]])) as Record<number, number>,
  years: { 2020: gate(yearBox(2020), 1), ...Object.fromEntries(YEARS.filter((y) => y > 2020).map((y, j) => [y, yearStarts[j]])) } as Record<number, number>,
  title: gate(titleBox, 1),
};
const enter = (f: number, start: number) => Math.max(0, Math.min(1, (f - start) / ENTER2_DUR));

const GoneUpToThisPoint: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = cut2Look(f);
  return (
    <AirStage
      cam={airCamFor(look)}
      S={CUT1_END_S + f}
      rest={AIR_REST}
      ground={AIR_GROUND}
      overlay={
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={graphTransform(look)}>
            <CostGraph
              look={look}
              drawn={S_TOTAL}
              coin={() => 1}
              label={(i) => (i < LLAMA ? enter(f, GATES.names[i]) : 1)}
              tick={(m) => ({ e: enter(f, m === 0 ? GATES.zero : GATES.ticks[m]), x: m === 0 ? PLOT.labelX : tickX(look) })}
              year={(y) => enter(f, GATES.years[y])}
              title={enter(f, GATES.title)}
            />
          </g>
        </svg>
      }
    />
  );
};

export default GoneUpToThisPoint;
