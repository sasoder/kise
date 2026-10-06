import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Bar, Baseline, INK_HI, INK_LO, KLabel, LevelLine, Stage, labelDrop, landOn, rungAt, smoothstep } from "./mavenKit";
import {
  BASE_X0,
  BASE_X1,
  B_DURATION,
  DATA_LO_S,
  FPS,
  H_STUB,
  H_TALL,
  LEVEL_S1,
  LEVEL_X0,
  LEVEL_X1,
  L_DATA,
  L_MODEL,
  L_REL,
  REST_CAM,
  W_MODEL,
  W_OPERATIONS,
  W_RELEVANT,
  W_TARGETS,
  X_DATA,
  X_MODEL,
  X_REL,
  bCamAt,
  baseDraw,
  dataH,
  fillH,
  levelDraw,
  modelDraw,
  runnerAt,
  stubH,
} from "./tonOfDataGeom";

export const DURATION = B_DURATION;
export { FPS };

// ---------------------------------------------------------------------------
// TonOfData -- Bharat, "Project Maven's data problem" (ChinaTalk), V3 cut B.
// ChinaTalk style, 1080x1920, 24 fps, opaque. Built only from mavenKit.
//
// LINE: "(we) were getting a ton of data that, again, didn't have relevant
// targets. So then your models weren't as performant once we put those models
// into operations."
// IN = 419 (sequence frame), DURATION = 194 (exact slot, no tail).
// Local word frames: ton 12 · data 20 · didn't 40 · relevant 51 · targets 57 ·
// your 73 · models 79 · weren't 86 · performant 108 · put 130 · operations 160.
//
// IDEA: three bars and one level line. How good the model is follows the
// RELEVANT data, not the amount of data. RED = relevant data (here RED_DEEP:
// there is too little of it). Four element types: bars, baseline, level line,
// labels. Geometry, clocks and the camera live in tonOfDataGeom.ts (shared
// with cut D, EnoughRelevantData).
//
// GESTURES (gesture -> word -> local frames)
// 1. the DATA bar (ink, hatched) shoots up from ~300 px to 1080 px, camera
//    close (k 1.25 -> 1.06) riding its tip and easing back so the foot stays above
//    the captions; `DATA` under it from frame 0
//    -> "a ton of data" -> f0-34.
// 2. the camera glides back down the tower and right; at the second position a
//    bar tries to grow and stops as a RED_DEEP stub 64 px tall; `RELEVANT` /
//    `TARGETS` land under it; tower foot and stub framed together by f64
//    -> "didn't have relevant targets" -> glide f28-64 (the baseline is written on to
//    the right ahead of it, f30-64), stub f40-54, labels 51 / 57.
// 3. a dashed INK outline as tall as the DATA bar writes itself up at the third
//    position (what a ton of data should buy), `MODEL` lands; camera eases back
//    to the wide (k 0.90) -> "so then your models" -> outline f63-86, label 79,
//    glide f58-96.
// 4. a level line is written from the stub's top across the outline (bead tip),
//    an ink fill rises inside the outline and stops when it meets that level:
//    exactly as tall as the stub -> "weren't as performant" -> line f84-98,
//    fill f90-106.
// 5. one long slow push toward the stub, the low fill and the line joining them
//    (k 0.90 -> 1.18), the DATA tower sliding out on the left; `IN OPERATIONS` lands under `MODEL` -> "once we put those
//    models into operations" -> glide f112-184, label 160. Hold: dashes march,
//    a slow bead travels the level line, the push is still decaying on f193.
//
// DEVIATIONS FROM THE BRIEF (see report): bar centres 190 / 470 / 850 (not
// 250 / 540 / 830: at the one fixed label size `TARGETS` and `IN OPERATIONS`
// on the same row need that pitch), the stub is 64 px (not 46), the tip-follow
// eases back to k 1.06 (the foot and the DATA label would otherwise sink below
// y 1400), the wide is k 0.90 (labels >= 40 px), and in the final push the DATA
// tower leaves the frame on the left (director's second pass).
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const TonOfData: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = bCamAt(S);
  const k = cam.k;
  const ly = labelDrop(k);
  const ld = levelDraw(S);
  const run = runnerAt(S);
  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {/* DATA: the ton */}
      <Bar id="tod-data" x={X_DATA} h={dataH(S)} kind="ink" k={k} S={S} />
      {/* RELEVANT TARGETS: the stub */}
      <Bar id="tod-rel" x={X_REL} h={stubH(S)} kind="deep" k={k} S={S} />
      {/* MODEL: the low fill under the expected outline */}
      <Bar id="tod-fill" x={X_MODEL} h={H_TALL} kind="ink" k={k} S={S} level={fillH(S)} outline={0} />
      <Bar id="tod-model" x={X_MODEL} h={H_TALL} kind="expected" k={k} S={S} draw={modelDraw(S)} />
      {/* the level line from the stub's top */}
      <LevelLine
        id="tod-level"
        x0={LEVEL_X0}
        x1={LEVEL_X1}
        y={-H_STUB}
        k={k}
        S={S}
        draw={ld}
        bead={smoothstep(ld / 0.08) * (1 - smoothstep((S - LEVEL_S1 - 2) / 8))}
        runner={run ? run.u : null}
        runnerOpacity={run ? run.op : 0}
      />
      <Baseline x0={BASE_X0} x1={BASE_X1} k={k} draw={baseDraw(S)} />
      <KLabel text={L_DATA} x={X_DATA} y={ly} k={k} rung={rungAt(S, DATA_LO_S, INK_HI, INK_LO)} />
      <KLabel text={L_REL[0]} x={X_REL} y={ly} k={k} appear={landOn(S, W_RELEVANT)} />
      <KLabel text={L_REL[1]} x={X_REL} y={ly} k={k} line={1} appear={landOn(S, W_TARGETS)} />
      <KLabel text={L_MODEL} x={X_MODEL} y={ly} k={k} appear={landOn(S, W_MODEL)} />
      <KLabel text="IN OPERATIONS" x={X_MODEL} y={ly} k={k} line={1} appear={landOn(S, W_OPERATIONS)} />
    </Stage>
  );
};

export default TonOfData;
