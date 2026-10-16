// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/cheeky-pint.md).
// __FORMAT__.
// Palette B1 (the stoutShared default; never pass palette "stout"). At sea or underwater: the realistic ocean
// variant (oceanShared / droneSeaShared / marsOceanShared) instead of StoutStage.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
// AMBER = <what amber stands for in this clip, from the brief>; cream = the subject, board = context.
//
// SOURCES: <every real figure, logo and image, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
// #if overlay
import { AbsoluteFill } from "remotion";
// #else
import { useCurrentFrame } from "remotion";
// #endif
import { z } from "zod";
// #if overlay
import { COLOR, ElevationShadow, GEO, Label, rectPath } from "../kits/cheeky-pint/stoutShared";
// #else
import { COLOR, ElevationShadow, GEO, Label, StoutStage, rectPath } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
// #endif

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// #if overlay
// A transparent overlay keeps a static camera: world px = screen px. Overlays end on a static hold.
const k = 1;
// #else
// The camera: glides on the cut's clock (look = the frame's middle, no lift), the house damped follower.
// A negative f0 starts the opening creep before frame 0. Replace with the cut's moves.
const CAM = makeClockCam({ x: 540, y: 960, k: 1 }, [{ f0: -20, f1: DURATION, k: 1.04 }], DURATION);
// #endif

// MARKER (delete): one cream tile at the frame's true middle, on its one shadow
const TILE = rectPath(540 - GEO.TILE / 2, 960 - GEO.TILE / 2, GEO.TILE, GEO.TILE);

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  // #if overlay
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <ElevationShadow silhouette={[{ d: TILE }]} />
        <path d={TILE} fill={COLOR.cream} />
        <Label x={540} y={1060} k={k} text="__NAME__" tone="cream" />
      </svg>
    </AbsoluteFill>
  );
  // #else
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={{ x: 540, y: 960 }}>
      <ElevationShadow silhouette={[{ d: TILE }]} />
      <path d={TILE} fill={COLOR.cream} />
      <Label x={540} y={1060} k={cam.k} text="__NAME__" tone="cream" />
    </StoutStage>
  );
  // #endif
};

export default __NAME__;
