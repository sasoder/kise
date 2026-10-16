// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md).
// __FORMAT__.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
// RED = <the one thing red means in this cut, from the brief>. Nothing else is red.
//
// SOURCES: <every real figure and photograph, and where it was verified (the SourceLine names it too); or "none">
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Label, RedGroup, Unit, VStage, runVCamera } from "../kits/chinatalk/chinatalkVintage";

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// The camera: world (x, y) at the true centre, the kit's damped follower chasing the keys. The first key sits
// before f0 so the move is already running; the last is a slow "linear" creep that keeps the end alive.
// Replace with the cut's moves (the follower lags its keys by ~8-10 frames, so key early).
const camAt = runVCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: DURATION, x: 540, y: 960, k: 1.04, ease: "linear" },
  ],
  DURATION,
);

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  return (
    <VStage S={S} cam={cam}>
      {/* MARKER (delete): the frame's true middle at rest */}
      <RedGroup k={k}>
        <Unit x={540} y={960} k={k} />
      </RedGroup>
      <Label text="__NAME__" x={540} y={1030} k={k} size="word" />
    </VStage>
  );
};

export default __NAME__;
