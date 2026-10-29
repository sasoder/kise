// ---------------------------------------------------------------------------
// FrontierCostClimbs (sam-gigawatt-cost, cut 1). Rev 3 (the user's review: a line graph, fewer models, readable).
// Cheeky Pint style, the realistic variant carried into the air (styles/cheeky-pint.md; the Scott Kirby clips' sky:
// AirStage from scott-aircraft-order/aircraftShared.tsx, imported read-only). Opaque 1080x1920, 23.976 fps, 37 frames.
//
// CHECK LINE: "each new frontier AI model has cost more to train than the one before — the newest ones are
// climbing steeply."
//
// THE LINE (John Collison): "Do the dollars per gigawatt of leading-edge AI go up or down?" — this slot holds
// "leading-edge AI go up or down?"; then Sam on camera: "That should go down."
// WORD -> FRAME (from f0; whisper, may run ~5 f early): gigawatt -16 · of -5 · leading 1 · edge 8 · AI 13 · go 18 ·
// up 24 · or 28 · down? 30 · (Sam) That 38.
// DURATION: the slot 1.335 -> 2.878 s (sequence frames 32-69) = 37 frames (f0..f36) at 24000/1001.
//
// THE MOTION: a flat line graph in the golden haze, close on the recent climb. At f0 the amber line has just
// passed Llama 3.1 (reached f-5: its coin is open, its name sliding up) and is climbing; the tip goes on at a steady
// pace to Grok 3 (f5), GPT-4.5 (f14) and lands on Grok 4 at f20 (easing only on the last stretch), each coin opening
// as the tip draws it and its name + training cost sliding up after it. ONE damped pull-back about a fixed point
// (under way from a pre-roll) widens the frame as the tip climbs, so the line keeps rising inside a frame that keeps
// catching it; by ~f26 the frame holds the whole climb (Llama 3.1 to Grok 4, 2023-25), then a creep to f36.
// Cut 2 (GoneUpToThisPoint) opens on f36 pixel for pixel (CUT1_END) and pulls back to the whole graph.
// Cause before effect: each coin opens on the frame the tip reaches it (reachF), its label 2 frames later.
// AMBER = the dollars (the line); cream = the coins, the type.
// Plan (data, axes, label layout, draw schedule, cameras, haze): costGraphPlan.ts. Pieces: costGraphParts.tsx.
//
// SOURCES: Epoch AI, "Notable AI Models" (https://epoch.ai/data/notable_ai_models.csv, downloaded 2026-10-28),
// "Training compute cost (2023 USD)", Epoch's estimates, exact values from frontier_training_cost.json
// (frontierCostData.ts): GPT-3 175B 2020-05-28 $2,116,866 · GPT-3.5 (davinci-002) 2022-03-15 $4,897,552 · GPT-4 2023-03-15
// $37,334,305 · Gemini 1.0 Ultra 2023-12-06 $30,719,420 · Llama 3.1-405B 2024-07-23 $52,885,434 · Grok 3 2025-02-17
// $217,835,546 · GPT-4.5 2025-02-27 $366,010,628 · Grok 4 2025-07-09 $387,842,678 (on screen rounded to $1M).
// Lab marks: the clip's images/logos/ (LOGOS_READY.md: Commons, PD / CC0), redrawn as ink stamps (labMarks.ts).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage } from "../scott-aircraft-order/aircraftShared";
import { AIR_GROUND, AIR_REST, CUT1_END, CUT1_END_S, CUT1_FRAMES, LLAMA, PLOT, airCamFor, climbLabelAt, coinAt, cut1Look, drawnAt } from "./costGraphPlan";
import { CostGraph, graphTransform } from "./costGraphParts";

export const FPS = 24000 / 1001;
export const DURATION = CUT1_FRAMES;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the join: cut 2 opens on CUT1_END; fail loudly if this camera drifts from it
{
  const e = cut1Look(CUT1_END_S);
  if (CUT1_END_S !== DURATION - 1 || Math.abs(e.x - CUT1_END.x) > 1e-6 || Math.abs(e.y - CUT1_END.y) > 1e-6 || Math.abs(e.k - CUT1_END.k) > 1e-9) {
    throw new Error(`FrontierCostClimbs: camera at f${CUT1_END_S} ${JSON.stringify(e)} != CUT1_END`);
  }
}

const NO_TICK = { e: 0, x: PLOT.labelX };

const FrontierCostClimbs: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = cut1Look(f);
  return (
    <AirStage
      cam={airCamFor(look)}
      S={f}
      rest={AIR_REST}
      ground={AIR_GROUND}
      overlay={
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={graphTransform(look)}>
            <CostGraph
              look={look}
              drawn={drawnAt(f)}
              coin={(i) => (i < LLAMA ? 1 : coinAt(i, f))}
              label={(i) => (i < LLAMA ? 0 : climbLabelAt(i, f))}
              tick={() => NO_TICK}
              year={() => 0}
              title={0}
            />
          </g>
        </svg>
      }
    />
  );
};

export default FrontierCostClimbs;
