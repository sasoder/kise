import { GROW_EASE, camFromTrack, clamp01, evenEase, glideTargetAt, runFollower, smoothstep } from "./mavenKit";
import type { Cam, Glide } from "./mavenKit";

// ---------------------------------------------------------------------------
// dataFoundationGeom -- the world, the clocks and the camera of DataFoundation
// (Bharat "Project Maven's data problem", V3 cut A). World px = screen px at the
// wide framing (k 1, look y 835); y grows down. Everything is a function of the
// local frame f (= sequence frame - IN).
// ---------------------------------------------------------------------------

export const FPS = 24;
/** sequence frame of "would" */
export const IN = 241;
/** the exact slot, no tail */
export const DURATION = 113;

// --- the stack: three slots, 740 x 220, 26 px gaps, centred on x 540 ---------
export const CX = 540;
export const SLAB_W = 740;
export const SLAB_H = 220;
export const GAP = 26;
export const OPS_Y = 590;
export const MODEL_Y = OPS_Y + SLAB_H + GAP; // 836
export const SLOT_Y = MODEL_Y + SLAB_H + GAP; // 1082
export const SLOT_BOTTOM = SLOT_Y + SLAB_H / 2; // 1192

// --- the outlines are written down the stack, ahead of the camera ------------
/** OPERATIONS: the last stretch of its outline lands at f 10 */
export const opsDraw = (f: number) => 0.78 + 0.22 * evenEase((f + 8) / 18, 0.35);
/** MODEL: its outline follows (84 % written at f 0, only the last stretch wet), closing at f 22 */
export const modelDraw = (f: number) => 0.8 + 0.2 * evenEase((f + 8) / 30, 0.35);
/** the dashed red slot is written as the camera arrives at the foot ("that we") */
export const SLOT_F0 = 24;
export const SLOT_F = 22;
export const slotDraw = (f: number) => GROW_EASE((f - SLOT_F0) / SLOT_F);
/** the missing slab's red-hatched ghost soaks down inside the slot as it is written */
export const ghostWipe = (f: number) => smoothstep(clamp01((f - SLOT_F0 - 9) / (SLOT_F - 4)));

// --- "struggled": the two ink slabs sink into the empty slot as one piece -----
export const SINK_F0 = 48;
export const SINK_F = 22;
export const SINK_PX = 66;
export const TILT_DEG = 3.8;
/** the tail's settle-creep: <= 2 px, <= 0.12 deg, never quite still */
export const CREEP_PX = 2;
export const CREEP_DEG = 0.12;
export const sinkU = (f: number) => GROW_EASE((f - SINK_F0) / SINK_F);
const creepU = (f: number) => smoothstep(clamp01((f - (SINK_F0 + SINK_F - 4)) / (DURATION + 8 - (SINK_F0 + SINK_F - 4))));
export const sinkAt = (f: number) => SINK_PX * sinkU(f) + CREEP_PX * creepU(f);
/** the tilt runs with the slide and seats 3 f after it */
export const tiltAt = (f: number) => TILT_DEG * GROW_EASE((f - SINK_F0 - 1) / (SINK_F + 3)) + CREEP_DEG * creepU(f);
/** the pivot of the pair: the middle of the two ink slabs */
export const PIVOT_Y = (OPS_Y + MODEL_Y) / 2;
/** a point of the ink pair in the world at frame f */
export const pairPoint = (f: number, x: number, y: number) => {
  const a = (tiltAt(f) * Math.PI) / 180;
  const dx = x - CX;
  const dy = y - PIVOT_Y;
  return { x: CX + dx * Math.cos(a) - dy * Math.sin(a), y: PIVOT_Y + sinkAt(f) + dx * Math.sin(a) + dy * Math.cos(a) };
};

// --- DATA lands on "data" (f 93) in the slot's visible lower part -------------
export const DATA_WORD_F = 93;
export const DATA_Y = (MODEL_Y + SLAB_H / 2 + SINK_PX + SLOT_BOTTOM - 9) / 2 + 1;

// --- the camera: down the stack, with the drop, then a slow push on the slot --
export const CAM_START: Cam = { x: CX, y: 580, k: 1.27 };
export const GLIDES: Glide[] = [
  // "I would say that one of the first things that we": one long glide down the stack to the wide
  { f0: -16, f1: 46, dy: 256, k: 1.0, warp: 0.9 },
  // "struggled": follow the drop
  { f0: 47, f1: 78, dy: 24 },
  // "with ... was with data itself": a gentle push on the slot, still moving on the last frame
  { f0: 70, f1: 130, dy: 8, k: 1.27, warp: 0.9 },
];
export const camTargetAt = (f: number) => glideTargetAt(CAM_START, GLIDES, f);
const CAM_F0 = -16;
const TRACK = runFollower(camTargetAt, CAM_F0, DURATION + 24);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the camera the paper's parallax is measured against (the wide framing) */
export const REST_CAM: Cam = { x: CX, y: 835 + 125, k: 1 };
