// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/core-memory.md).
// __FORMAT__.
// #if overlay
// The text-only sting: copies of the silhouette in the chain colours slide up into place behind the white core
// (orange f0, purple f2, blue f4, core f6; 130 px over 22 f on EASE_LAND; nothing fades). Ref VastLogoChannelSplit.
// #else
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. Chain echo once, at the
// payoff (ChainEcho). Core Memory edits carry burned-in captions: no label for what the speaker says.
// #endif
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
// CHAIN = <the chain echo's one meaning in this clip, from the clip's shared-module legend>.
//
// SOURCES: <every real figure, mark and image, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
// #if overlay
import { AbsoluteFill } from "remotion";
// #else
import { AbsoluteFill, useCurrentFrame } from "remotion";
// #endif
import { z } from "zod";
// #if overlay
import { Inked, ShadowText } from "../kits/core-memory/cerroShared";
// #else
// #if wide
import { Inked, PaperGround, ShadowText, camEase, runCamera2, sway } from "../kits/core-memory/cerroShared";
// #else
import { ShadowText, TallPaper, camEase, runCamera2, sway } from "../kits/core-memory/deathCountShared";
import { Inked } from "../kits/core-memory/cerroShared";
// #endif
// #endif

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const W = __W__;
const H = __H__;

// #if !overlay
// The camera is its own key track: one key per frame through camEase, (cx, cy) = the focus point in world px
// (W/2, H/2 is the true middle at k 1), followed by the damped runCamera2. Replace this creep with the cut's moves.
const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  CAM_F.push(f);
  CAM_CX.push(W / 2);
  CAM_CY.push(H / 2);
  CAM_K.push(1 + 0.04 * camEase(f / DURATION, 1));
}
// #endif

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  // #if overlay
  const transform = "none"; // an overlay keeps a static camera
  // #else
  const frame = useCurrentFrame();
  const { cx, cy, k } = runCamera2(frame, CAM_F, CAM_CY, CAM_CX, CAM_K);
  const s = sway(frame);
  const transform = `translate(${W / 2 - cx * k + s.dx}px, ${H / 2 - cy * k + s.dy}px) scale(${k})`;
  // #endif
  return (
    <AbsoluteFill>
      {/* #if !overlay */}
      {/* #if wide */}
      <PaperGround frame={frame} cx={cx} cy={cy} cxRest={CAM_CX[0]} cyRest={CAM_CY[0]} k={k} />
      {/* #else */}
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={CAM_CX[0]} cyRest={CAM_CY[0]} />
      {/* #endif */}
      {/* #endif */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform }}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {/* MARKER (delete): the frame's true middle at rest, on its hard shadow */}
          <Inked render={(fill) => <circle cx={W / 2} cy={H / 2} r={28} fill={fill} />} />
          <ShadowText text="__NAME__" x={W / 2} y={H / 2 - 60} size={56} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default __NAME__;
