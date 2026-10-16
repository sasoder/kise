// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/dwarkesh.md).
// __FORMAT__.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
// Orange = the AI, nothing else; white = people and what they build.
//
// SOURCES: <every real figure, mark and image, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  runCamera,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { Label, worldPx } from "../kits/dwarkesh/alignShared";

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// The camera is its own key track: one key per frame through camEase, cy = the focus point in world px (the
// world is 1080x1920 at k 1, so 960 is the true middle), followed by fieldShared's damped runCamera. Replace
// this slow creep with the cut's moves (CRAFT.md, Motion and camera).
const CAM_F: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  CAM_F.push(f);
  CAM_CY.push(960);
  CAM_K.push(1 + 0.04 * camEase(f / DURATION, 1));
}
const K_REST = 1; // the resting zoom that strokes and labels are sized for (worldPx)

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cy, k } = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const s = sway(frame);
  const { tx, ty } = worldTransform(540, cy, k);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground src="grid-background.jpg" blur={13} dim={BG_DIM} frame={frame} cy={cy} cyRest={CAM_CY[0]} k={k} parallax={0.15} />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {/* MARKER (delete): the frame's true middle at rest */}
            <circle cx={540} cy={960} r={worldPx(22, K_REST)} fill={ACCENT} />
          </svg>
          <Label k={k} x={540} y={1004} text="__NAME__" inT={1} size={worldPx(48, K_REST)} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default __NAME__;
