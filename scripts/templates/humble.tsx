// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/humble.md).
// __FORMAT__.
// Purple #7970b4 and white only; no ground, no camera, no idle motion; ends on a long static hold the editor trims.
// Entrances slide up while fading in on Easing.bezier(0.16, 1, 0.3, 1) (24 px; icons 16 px). Copy in Swedish.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the outline, the purple fill, the icon rising in, the hold>.
//
// SOURCES: <every real figure, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { z } from "zod";

// Neulis Cursive Bold, the only face (the block at the top of kits/name-tags/NameTagHumble.tsx).
const fontFamily = "Neulis Cursive";
const fontHandle = delayRender("Loading Neulis Cursive Bold");
loadFont({ family: fontFamily, url: staticFile("NeulisCursive-Bold.otf"), weight: "700" })
  .then(() => continueRender(fontHandle))
  .catch((err) => cancelRender(err));

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PURPLE = "#7970b4";
const WHITE = "#FFFFFF";
const STROKE = 8; // outlines and icon strokes (Lucide x4)
const W = __W__;
const H = __H__;

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  return (
    <AbsoluteFill>
      {/* MARKER (delete): a purple disc in its white outline at the frame's true middle */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <circle cx={W / 2} cy={H / 2} r={60} fill={PURPLE} stroke={WHITE} strokeWidth={STROKE} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: H / 2 - 190,
          textAlign: "center",
          fontFamily,
          fontWeight: 700,
          fontSize: 88,
          letterSpacing: 0,
          color: WHITE,
        }}
      >
        __NAME__
      </div>
    </AbsoluteFill>
  );
};

export default __NAME__;
