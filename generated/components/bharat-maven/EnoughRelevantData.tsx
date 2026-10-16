import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Bar,
  Baseline,
  INK_HI,
  INK_LO,
  KLabel,
  LevelLine,
  SETTLE_F,
  Stage,
  Tick,
  WET_DRY_F,
  clamp01,
  labelDrop,
  labelWorldPx,
  landOn,
  rungAt,
  smoothstep,
} from "./mavenKit";
import {
  BASE_X0,
  BASE_X1,
  DATA_DIM_S,
  D_DURATION,
  FPS,
  H_TALL,
  LEVEL_X0,
  LEVEL_X1,
  L_MODEL,
  L_REL,
  RED_F,
  RED_S0,
  REST_CAM,
  USE_TICK_X0,
  USE_TICK_X1,
  W_ENOUGH,
  W_PERFORMANT,
  W_USE_CASE,
  X_DATA,
  X_MODEL,
  X_REL,
  dCamAt,
  dRunnerAt,
  modelLine,
  needDraw,
  outlineDraw,
  redH,
  tieDraw,
  useTickDraw,
} from "./tonOfDataGeom";

export const DURATION = D_DURATION;
export { FPS };

// ---------------------------------------------------------------------------
// EnoughRelevantData -- Bharat, "Project Maven's data problem" (ChinaTalk), V3
// cut D. ChinaTalk style, 1080x1920, 24 fps, opaque. Built only from mavenKit.
//
// LINE: "(understanding) the use case tied to the data and then getting enough
// of it to build performant models."
// IN = 883 (sequence frame), DURATION = 144 (exact slot, no tail).
// Local word frames: use 26 · case 31 · tied 36 · data 50 · getting 73 ·
// enough 77 · build 96 · performant 102-130 · models 130.
//
// IDEA: cut B's picture (three bars and one level line), answered. The use case
// sets how much RELEVANT data is needed; when there is enough of it, the model
// rises with it. RED = relevant data: RED_DEEP stub -> a tall VERMILION bar.
// Four element types: bars, baseline, level lines (+ the tick), labels.
// Geometry and clocks are shared with TonOfData through tonOfDataGeom.ts.
//
// GESTURES (gesture -> word -> local frames)
// 1. opens on B's wide (tower, stub, low fill under the dashed outline, level
//    line), camera creeping toward the third bar; a hair tick is written across
//    the top of the expected outline and `USE CASE` lands above it
//    -> "the use case" -> tick f16-28, label lands 28.
// 2. the need-level runs on from the tick (dashed hair, bead tip) to above the
//    red position and drops a DASHED RED outline there, as tall as the need;
//    the DATA tower eases to ink 0.42 -> "tied to the data" -> level f34-46,
//    outline f40-54 (on "data" 50), dim f38-50.
// 3. the red bar grows (RED_DEEP -> vermilion, wet tip, paper shadow) up inside
//    its dashed outline; the level line rides on its top and the MODEL fill
//    rises with it, in lockstep; `ENOUGH` lands above the red top; the camera
//    leans in on the rising pair (k 0.9 -> 1.0, f57-84) and eases
//    back to the wide for the hold (f86-122) -> "getting enough of it" ->
//    f63-94, label 77.
// 4. the MODEL outline is inked solid from the level line's contact point (the
//    apex) down both sides; `PERFORMANT` slides in above `MODEL`, which eases down one line -> "to build
//    performant models" -> outline f97-124, label lands 124 (MODEL moves f108-122).
// 5. the held breath: two tall bars standing level, joined by the level line; a
//    slow bead on it, a slow creep in -> f124-144.
//
// DEVIATIONS FROM THE BRIEF (see report): the "tie" is the dashed need-level
// (a kit LevelLine) rather than a LINE_W wet stroke, so that the solid level
// line lands ON it at the top; `ENOUGH` sits above the red top (it does not fit
// beside it at the fixed label size); `USE CASE` retires (ink diffusion) when `ENOUGH`
// arrives; `DATA` stays at ink 0.42 throughout (director: four labels are fine here).
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const EnoughRelevantData: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = dCamAt(S);
  const k = cam.k;
  const ly = labelDrop(k);
  const topY = -H_TALL - 0.95 * labelWorldPx("word", k);
  const rh = redH(S);
  const riseEnd = RED_S0 + RED_F;
  const dataRung = rungAt(S, DATA_DIM_S, INK_HI, INK_LO);
  const run = dRunnerAt(S);
  const ol = outlineDraw(S);
  // the dashed references retire once the real thing has reached them
  const needRung = INK_HI * (1 - smoothstep((S - riseEnd + 2) / SETTLE_F));
  const growing = S > RED_S0 && S < riseEnd;
  const wet = S <= RED_S0 ? 0 : growing ? smoothstep((S - RED_S0) / 6) : 1 - smoothstep((S - riseEnd) / WET_DRY_F);
  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {/* DATA: the ton, never the constraint */}
      <Bar id="erd-data" x={X_DATA} h={H_TALL} kind="ink" k={k} S={S} rung={dataRung} />
      {/* the relevant data NEEDED, then the relevant data there is */}
      {S < riseEnd + 1 ? <Bar id="erd-need" x={X_REL} h={H_TALL} kind="needed" k={k} S={S} draw={needDraw(S)} from="apex" /> : null}
      <Bar id="erd-rel" x={X_REL} h={rh} kind="red" k={k} S={S} deep={1 - smoothstep((S - RED_S0 + 2) / SETTLE_F)} wet={wet} />
      {/* MODEL: the fill rides the level; the expected outline is inked solid at the end */}
      {ol < 0.999 ? <Bar id="erd-exp" x={X_MODEL} h={H_TALL} kind="expected" k={k} S={S} /> : null}
      <Bar id="erd-model" x={X_MODEL} h={H_TALL} kind="ink" k={k} S={S} level={rh} outline={ol} />
      {/* the use case's mark and the need-level it sets */}
      <Tick x0={USE_TICK_X0} y0={-H_TALL} x1={USE_TICK_X1} y1={-H_TALL} k={k} draw={useTickDraw(S)} rung={needRung} />
      {needRung > 0.004 ? (
        <LevelLine
          id="erd-tie"
          x0={USE_TICK_X1}
          x1={LEVEL_X0}
          y={-H_TALL}
          k={k}
          S={S}
          dashed
          draw={tieDraw(S)}
          rung={needRung}
          bead={smoothstep(tieDraw(S) / 0.08) * (1 - smoothstep((S - 46) / 8))}
        />
      ) : null}
      {/* the level line rides on the red top */}
      <LevelLine id="erd-level" x0={LEVEL_X0} x1={LEVEL_X1} y={-rh} k={k} S={S} runner={run ? run.u : null} runnerOpacity={run ? run.op : 0} />
      <Baseline x0={BASE_X0} x1={BASE_X1} k={k} />
      <KLabel text="DATA" x={X_DATA} y={ly} k={k} rung={INK_LO} />
      <KLabel text={L_REL[0]} x={X_REL} y={ly} k={k} />
      <KLabel text={L_REL[1]} x={X_REL} y={ly} k={k} line={1} />
      <KLabel text={L_MODEL} x={X_MODEL} y={ly} k={k} line={modelLine(S)} />
      <KLabel text="PERFORMANT" x={X_MODEL} y={ly} k={k} appear={landOn(S, W_PERFORMANT)} />
      <KLabel text="USE CASE" x={X_MODEL} y={topY} k={k} appear={landOn(S, W_USE_CASE)} diffuse={clamp01((S - 58) / 14)} />
      <KLabel text="ENOUGH" x={X_REL} y={topY} k={k} appear={landOn(S, W_ENOUGH)} />
    </Stage>
  );
};

export default EnoughRelevantData;
