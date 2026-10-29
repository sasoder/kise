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
// so the dust and clouds carry on). From f0 ONE damped pull-back about a point on the year row (the row stays at
// y 1050, above the caption bands) widens to the whole graph: the 2020-22 floor (GPT-3, GPT-3.5, $0-$400M) slides in
// from the left, the title comes down into the top of the frame. Landed by ~f20 ("this point" 21), then a living
// creep, dust, grain to f33.
// THE TEXT (rev 4, the user: "have the text in all the time"): every label is part of the chart, fixed in world space
// and fully in from f0; only the camera reveals it. In the wide every label, coin and tick keeps >= 90 px from the
// left and right edges.
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
import { AIR_GROUND, AIR_REST, CUT1_END, CUT1_END_S, S_TOTAL, airCamFor, cut2Look } from "./costGraphPlan";
import { CostGraph, graphTransform } from "./costGraphParts";

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
              label={() => 1}
              axes={1}
              years={1}
              title={1}
            />
          </g>
        </svg>
      }
    />
  );
};

export default GoneUpToThisPoint;
