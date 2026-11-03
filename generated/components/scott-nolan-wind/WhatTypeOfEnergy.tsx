// ---------------------------------------------------------------------------
// WhatTypeOfEnergy (scott-nolan-wind, cut 2). Cheeky Pint style (stout) in real 3D (nuclearWorld + energyWorld). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 57 frames.
//
// CHECK LINE: "a data center needs power, and there are several kinds of power plant it could plug into: coal, gas, nuclear, wind, solar."
//
// THE LINE: "what type of energy do we want to power these data centers?"
// WORD -> FRAME: what 0 · type 4 · of 7 · energy 10 · do 17 · we 21 · want 24 · to 28 · power 31 · these 36 · data 40 · centers 45
// DURATION: the slot 2.127 -> 4.505 s = 2.378 s x 23.976 = 57 frames (f0..f56).
//
// THE MOTION: the question, staged. One crane from f0: it opens close on a big plug hovering over the middle of the row of
// five plants (coal smoking, gas hazing, the turbine turning, the glint on the panels, the amber core in nuclear's cutaway
// dome) and pulls back and down, so that by "data centers" (f40-45) the plug's cable leads the eye down along the board to
// the data center in the foreground. Meanwhile the plug drifts left along the row, prongs leading, looking about: it passes
// over nuclear without stopping and on the last frame hangs between gas and nuclear, still drifting (cut C seats it).
// AMBER = nuclear: only the small steady core in the dome; the plug does not favour it. No labels: the plants name themselves.
// Camera track and plug path live in cutAState.ts (CUT_A_END_CAM / CUT_A_PLUG_END for cut C's join).
//
// SOURCES: none (no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage } from "../scott-nolan-uranium/nuclearWorld";
import { CUT_A_DURATION, CUT_A_S0, cutACamAt, cutAPlugAt } from "./cutAState";
import { DataCenter, Lineup, PowerCable } from "./energyWorld";

export const FPS = 24000 / 1001;
export const DURATION = 57;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (CUT_A_DURATION !== DURATION) throw new Error("cutAState's duration must match WhatTypeOfEnergy");

const WhatTypeOfEnergy: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = CUT_A_S0 + f;
  const cam = cutACamAt(f);
  const plug = cutAPlugAt(f);
  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={1000}
      pool={{ x: 520, y: 860, strength: 0.95 }}
      world={
        <>
          <Lineup S={S} />
          <DataCenter S={S} />
          <PowerCable end={plug.end} dir={plug.dir} roll={plug.roll} drape={plug.drape} />
        </>
      }
    />
  );
};

export default WhatTypeOfEnergy;
