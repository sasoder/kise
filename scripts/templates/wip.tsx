// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// __FORMAT__.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
// Contact frames: <what presses or lands, on which frame; the first reaction frame>.
// SPOT INK: <what red means in this cut, what indigo means>.
//
// SOURCES: <every real figure and photograph, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, MONO, PaperGround, Postmark, RED, SERIF, SERIF_WEIGHT, THEMES, WipFilmLife, WipPlane, inkPress, runWipCamera, textRise } from "../kits/works-in-progress/wipShared";

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// The camera: world (x, y) at the true centre, the kit's damped follower chasing the keys. The first key sits before f0
// so the move is already running; the last is a slow "linear" creep that keeps the end alive.
// Replace with the cut's moves (the follower lags its keys by ~8-10 frames, so key early).
const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: DURATION, x: 540, y: 960, k: 1.05, ease: "linear" },
  ],
  DURATION,
);

const __NAME__: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        {/* pasted things: Stamp, CutOut */}
        <WipPlane cam={cam}>
          {/* MARKER (delete): the frame's true middle at rest */}
          <div style={{ position: "absolute", left: 140, width: 800, top: 720, textAlign: "center", fontFamily: SERIF, fontWeight: SERIF_WEIGHT, fontSize: 72, color: THEMES.mint.ink, ...textRise(frame, 0) }}>
            __NAME__
          </div>
          <div style={{ position: "absolute", left: 140, width: 800, top: 820, textAlign: "center", fontFamily: MONO, fontWeight: 300, fontSize: 30, color: THEMES.mint.ink }}>
            mono label
          </div>
        </WipPlane>
        {/* ink: Postmark, InkPrint. Ink belongs on an `ink` plane so it multiplies into the paper and what lies under it. */}
        <WipPlane cam={cam} ink>
          <Postmark x={540} y={1000} size={420} ink={RED} seed="__NAME__" top="MARKER" bottom="DELETE" date="F 8" press={inkPress(frame, 8)} />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default __NAME__;
