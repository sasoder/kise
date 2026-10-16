// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/lovable.md).
// __FORMAT__.
// Built at the sequence's own frame (read its FrameRect and the V1 clip's Motion); keep the editor's caption band
// dark and empty. The gradient is the only colour; the rest is BLACK, CREME, PAPER #FCFBF8 and b/w footage.
// Wordmark: reuse the inline `Wordmark` SVG from kits/clients/LovableHotOrNot.tsx; never redraw it.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
//
// SOURCES: <every real figure, name and frame of footage, and where it came from; or "none">
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile } from "remotion";
import { z } from "zod";

// Camera Plain, variable 400-900.
const FONT = "LovableCameraPlain";
loadFont({ family: FONT, url: staticFile("fonts/CameraPlainVariable.ttf"), weight: "400 900" });

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// #if !overlay
const BLACK = "#1B1B1B"; // the opaque ground stand-in; opaque Lovable cuts usually sit on footage graded b/w
// #endif
const CREME = "#F7F4ED";
// The gradient, all eleven stops, copied from kits/clients/LovableHotOrNot.tsx (never a shorter retyping).
const FULL_STOPS: [number, [number, number, number]][] = [
  [0, [79, 136, 255]],
  [0.14, [98, 137, 255]],
  [0.24, [145, 160, 255]],
  [0.33, [206, 175, 251]],
  [0.43, [243, 136, 222]],
  [0.52, [253, 73, 168]],
  [0.62, [252, 26, 88]],
  [0.71, [250, 39, 51]],
  [0.81, [252, 84, 31]],
  [0.9, [254, 119, 29]],
  [1, [255, 143, 27]],
];
const FULL = `linear-gradient(90deg, ${FULL_STOPS.map(([p, c]) => `rgb(${c.join(",")}) ${Math.round(p * 100)}%`).join(", ")})`;
const W = __W__;
const H = __H__;

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  return (
    // #if overlay
    <AbsoluteFill>
      {/* #else */}
    <AbsoluteFill style={{ backgroundColor: BLACK }}>
      {/* #endif */}
      {/* MARKER (delete): the name over a 12 px gradient bar at the frame's true middle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: H / 2 - 110,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 80,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          color: CREME,
        }}
      >
        __NAME__
      </div>
      <div style={{ position: "absolute", left: W / 2 - 160, top: H / 2 - 6, width: 320, height: 12, background: FULL }} />
    </AbsoluteFill>
  );
};

export default __NAME__;
