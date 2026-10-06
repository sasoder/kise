import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FeatherWipe, HatchFill, KLabel, PAPER, RED_DEEP, Slab, Stage, kLabelWidth, labelWorldPx, landOn, slabPts, smoothstep, worldBlur } from "./mavenKit";
import {
  CX,
  DATA_WORD_F,
  DATA_Y,
  DURATION,
  FPS,
  MODEL_Y,
  OPS_Y,
  PIVOT_Y,
  REST_CAM,
  SLAB_H,
  SLAB_W,
  SLOT_Y,
  camAt,
  ghostWipe,
  modelDraw,
  opsDraw,
  sinkAt,
  slotDraw,
  tiltAt,
} from "./dataFoundationGeom";

// ---------------------------------------------------------------------------
// DataFoundation — Bharat, "Project Maven's data problem" (ChinaTalk), V3 cut A.
// ChinaTalk style, 1080x1920, 24 fps, opaque. Built only from mavenKit.
//
// Line: "I would say that one of the first things that we struggled with was
// with data itself."
// IN = sequence frame 241, DURATION = 113 (exact slot, no tail).
// Local word frames: would 0 · say 4 · that 9 · one 16 · of 22 · the 25 ·
// first 26 · things 33 · that 39 · we 46 · struggled 53 · with 64 · was 70 ·
// with 81 · data 93 · itself 101 · end 113.
//
// Idea: A STACK WITH NO FOUNDATION. An AI project is three slabs: OPERATIONS on
// MODEL on DATA. The two ink slabs are there; where DATA should be there is only
// the dashed vermilion outline of a slab (the relevant data that is needed).
// VERMILION = relevant data; dashed = needed, not there.
//
// Gestures (gesture -> word -> local frames), one motion down the stack:
// 1. the outlines are written in wet ink down the stack (OPERATIONS closes f10,
//    MODEL, 84 % written at f0, closes f22) while the camera glides down from
//    a close on OPERATIONS -> "I would say that one of the first things" -> f0-46
// 2. the camera reaches the foot; the dashed red slot is written under MODEL, the
//    missing slab's RED_DEEP hatch ghost soaking down inside it; it marches, empty -> "that we" -> f24-46
// 3. the two ink slabs sink into the empty slot as one piece (66 px, 3.8 deg, one
//    eased settle) and rest crooked over its top band, clear of the MODEL label; the camera follows the
//    drop -> "struggled" -> f48-70 (tilt seats f74)
// 4. DATA lands inside what is left of the slot while the camera pushes in on it
//    -> "data (itself)" -> label f85-97 (on f93), push f70 -> end; dashes march
//    and the slabs creep <= 2 px to the last frame.
// Element types: ink slabs, the dashed red slot, labels.
// ---------------------------------------------------------------------------

export { DURATION, FPS };
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** The empty foundation: the missing slab's ghost (a RED_DEEP hatch, soaked in
 *  by a feathered wipe as the outline is written, cleared softly under DATA)
 *  inside the dashed, marching vermilion outline. */
const GHOST_WASH = 0.05;
const GHOST_HATCH = 0.32;
const Slot: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const draw = slotDraw(f);
  if (draw <= 0.0005) return null;
  const fs = labelWorldPx("word", k);
  const lblW = kLabelWidth("DATA", k);
  const ap = landOn(f, DATA_WORD_F);
  return (
    <g>
      <FeatherWipe
        id="df-ghost-wipe"
        box={{ x0: CX - SLAB_W / 2 - 2, y0: SLOT_Y - SLAB_H / 2 - 2, x1: CX + SLAB_W / 2 + 2, y1: SLOT_Y + SLAB_H / 2 + 2 }}
        u={ghostWipe(f)}
        feather={90}
        dir="down"
      >
        <HatchFill
          id="df-ghost"
          region={slabPts(CX, SLOT_Y, SLAB_W, SLAB_H)}
          k={k}
          color={RED_DEEP}
          fill={GHOST_WASH}
          lineOpacity={GHOST_HATCH}
          anchor={{ x: CX - SLAB_W / 2, y: SLOT_Y - SLAB_H / 2 }}
        />
      </FeatherWipe>
      {ap > 0.01 ? (
        <rect
          x={(CX - lblW / 2 - 0.3 * fs).toFixed(2)}
          y={(DATA_Y - 0.5 * fs).toFixed(2)}
          width={(lblW + 0.6 * fs).toFixed(2)}
          height={fs.toFixed(2)}
          rx={(0.5 * fs).toFixed(2)}
          fill={PAPER}
          opacity={(0.7 * smoothstep(ap)).toFixed(4)}
          style={{ filter: worldBlur(14, k) }}
        />
      ) : null}
      <Slab id="df-slot" x={CX} y={SLOT_Y} w={SLAB_W} h={SLAB_H} kind="needed" k={k} S={f} draw={draw} />
    </g>
  );
};

const DataFoundation: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  return (
    <Stage S={f} cam={cam} rest={REST_CAM}>
      <Slot f={f} k={k} />
      <g transform={`translate(0 ${sinkAt(f).toFixed(3)}) rotate(${tiltAt(f).toFixed(4)} ${CX} ${PIVOT_Y})`}>
        <Slab id="df-model" x={CX} y={MODEL_Y} w={SLAB_W} h={SLAB_H} kind="ink" k={k} S={f} draw={modelDraw(f)} label="Model" />
        <Slab id="df-ops" x={CX} y={OPS_Y} w={SLAB_W} h={SLAB_H} kind="ink" k={k} S={f} draw={opsDraw(f)} label="Operations" />
      </g>
      <KLabel text="Data" x={CX} y={DATA_Y} k={k} appear={landOn(f, DATA_WORD_F)} />
    </Stage>
  );
};

export default DataFoundation;
