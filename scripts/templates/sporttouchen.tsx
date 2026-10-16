// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/sporttouchen.md).
// __FORMAT__.
// Rendered twice from this component: opaque (BG + GLOW) and the overlay (props {"transparent": true}).
// White ink, the one magenta-to-violet gradient, MADE Tommy Soft; copy in Swedish. Big type carries the 4 px
// outside stroke (back copy + fill copy in one wrapper). Time is linear; glyphs change by the 8-frame masked swap.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: what counts, swaps or fills, and the payoff ring>.
//
// SOURCES: <every real figure and name, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile } from "remotion";
import { z } from "zod";

// MADE Tommy Soft at module scope, no fallback stack (the block at the top of kits/clients/SporttouchenTimer.tsx).
const fontFamily = "MADETommySoft";
loadFont({ family: fontFamily, url: staticFile("MADETommySoft-ExtraBold.otf"), weight: "800" });
loadFont({ family: fontFamily, url: staticFile("MADETommySoft-Medium.otf"), weight: "500" });

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({ transparent: z.boolean() });
export const defaultProps = schema.parse({ transparent: __OVERLAY__ });

const INK = "#FFFFFF";
const GRADIENT = "linear-gradient(90deg, #A300AF, #520EF1)";
const BG = "#0B0A12";
const GLOW = "radial-gradient(900px 900px at 540px 1400px, rgba(82,14,241,0.18) 0%, rgba(82,14,241,0) 70%)";
const W = __W__;
const H = __H__;

const __NAME__: React.FC<z.infer<typeof schema>> = ({ transparent }) => {
  return (
    <AbsoluteFill style={transparent ? undefined : { backgroundColor: BG, backgroundImage: GLOW }}>
      {/* MARKER (delete): a gradient disc at the frame's true middle, a label above it */}
      <div style={{ position: "absolute", left: W / 2 - 60, top: H / 2 - 60, width: 120, height: 120, borderRadius: 60, background: GRADIENT }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: H / 2 - 140,
          textAlign: "center",
          fontFamily,
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          textIndent: "0.22em", // balances the tracking after the last letter
          color: INK,
        }}
      >
        __NAME__
      </div>
    </AbsoluteFill>
  );
};

export default __NAME__;
