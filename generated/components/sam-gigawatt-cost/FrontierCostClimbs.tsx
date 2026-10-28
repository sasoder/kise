// ---------------------------------------------------------------------------
// FrontierCostClimbs (sam-gigawatt-cost, cut 1). Cheeky Pint style, the realistic variant carried into the air
// (styles/cheeky-pint.md; the Scott Kirby clips' world: AirStage from scott-aircraft-order/aircraftShared.tsx,
// imported read-only, no aircraft). Opaque 1080x1920, 23.976 fps, 37 frames.
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
// THE MOTION: side view at the desert apron in golden-hour haze. The chart is one long row of glass columns, one per
// frontier model in date order, each rising out of its own slot in the apron's cut edge ($0), amber = the training
// cost, a cream nameplate with the lab's mark and the model name under each. The cut opens close on the six newest
// models' plates (Llama 3.1 already half way up); from f0 their columns rise one after another in a wave (Llama 3.1,
// Grok 2, Grok 3, GPT-4.5, Llama 4, Grok 4) while ONE damped pull-back eases the camera up and back (rev 2: no crane
// chase), so the wave rises into a frame that keeps widening: by ~f30 it holds the whole recent climb, the flat
// 2016-22 floor running off the left edge, GPT-4 at mid-frame and the staircase stepping up to Grok 4, which lands
// last and tallest at f30 ("down?") at the right, its top at y ~300; then a living hold (creep, dust, shimmer,
// grain) to f36. Cut 2 opens on f36 pixel for pixel (CUT1_END_CAM) and pulls back to the whole row.
// Cause before effect: each slot parts over the 5 frames before its column's first pixel (costChartPlan RISE).
// AMBER = the dollars (the fills); cream = the plates, glass hairlines.
// Plan (data, geometry, rise wave, camera, AirCam mapping): costChartPlan.ts. Pieces: costChartParts.tsx.
//
// SOURCES: Epoch AI, "Notable AI Models" (https://epoch.ai/data/notable_ai_models.csv, downloaded 2026-10-28),
// frontier models, "Training compute cost (2023 USD)", all 56 rows (frontierCostData.ts), Epoch's estimates; e.g.
// GPT-4 $37.3M, Llama 3.1-405B $52.9M, Grok 3 $217.8M, GPT-4.5 $366.0M, Llama 4 Behemoth $44.6M, Grok 4 $387.8M.
// Lab marks from the clip's images/logos/ (LOGOS_READY.md: Commons, PD / CC0 / Apache 2.0), redrawn as ink stamps.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { amberBandFor } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { AirStage, type GroundSpec } from "../scott-aircraft-order/aircraftShared";
import { APRON, CAM_GLIDES, CAM_START, CUT1_END_CAM, CUT1_END_S, CUT1_FRAMES, CUT1_START_CAM, airCamOf, dustRestFor, riseH, slotOpen } from "./costChartPlan";
import { CostChart, chartTransform } from "./costChartParts";

export const FPS = 24000 / 1001;
export const DURATION = CUT1_FRAMES;
export const schema = z.object({});
export const defaultProps = schema.parse({});

export const CAM = makeClockCam({ ...CAM_START }, CAM_GLIDES.map((g) => ({ ...g })), DURATION);
// the join: cut 2 opens on CUT1_END_CAM (costChartPlan); fail loudly if this camera drifts from it
{
  const e = CAM.at(CUT1_END_S);
  const s0 = CAM.rest;
  if (Math.abs(s0.x - CUT1_START_CAM.x) > 1e-6 || Math.abs(s0.y - CUT1_START_CAM.y) > 1e-6 || Math.abs(s0.k - CUT1_START_CAM.k) > 1e-9) {
    throw new Error(`FrontierCostClimbs: camera at f0 ${JSON.stringify(s0)} != CUT1_START_CAM`);
  }
  if (CUT1_END_S !== DURATION - 1 || Math.abs(e.x - CUT1_END_CAM.x) > 1e-6 || Math.abs(e.y - CUT1_END_CAM.y) > 1e-6 || Math.abs(e.k - CUT1_END_CAM.k) > 1e-9) {
    throw new Error(`FrontierCostClimbs: camera at f${CUT1_END_S} ${JSON.stringify(e)} != CUT1_END_CAM`);
  }
}
const GROUND_SPEC: GroundSpec = { aprons: [APRON], joints: 7.5 };

const FrontierCostClimbs: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const cam = airCamOf(look);
  const rest = dustRestFor(cam);
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={rest}
      ground={GROUND_SPEC}
      overlay={
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={chartTransform(look)}>
            <CostChart look={look} band={amberBandFor(look)} rise={(i) => riseH(i, f)} open={(i) => slotOpen(i, f)} />
          </g>
        </svg>
      }
    />
  );
};

export default FrontierCostClimbs;
