// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/dwarkesh-map.md).
// __FORMAT__.
// The umber page with no map, from kits/maps (TexcocoPage). A map cut draws its world from the clip's own
// <clip>Shared.tsx (styles/dwarkesh-map.md, Build pattern: the map tool, pearlShared's map half); figures on
// kits/maps/texcocoFigures.
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
// Orange = <the clip's one orange rule from the brief>; everything else is cream.
//
// SOURCES: <every real place, date, figure and image, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
// #if overlay
import { AbsoluteFill, useCurrentFrame } from "remotion";
// #else
import { useCurrentFrame } from "remotion";
// #endif
import { z } from "zod";
// #if overlay
import { Label, WorldSvg } from "../kits/maps/texcocoShared";
import { ACCENT, type Cam } from "../kits/maps/incaShared";
// #else
import { Label, TexcocoPage, WorldSvg, makeCamera } from "../kits/maps/texcocoShared";
import { ACCENT, swayCam } from "../kits/maps/incaShared";
// #endif

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// #if overlay
// A transparent overlay keeps a static camera: world px = screen px.
const CAM: Cam = { k: 1, cx: 540, cy: 960 };
// #else
// The camera: keyed world points at screen points (pchip, log-zoom). Pass sy: 960 on every key: the kit's
// default (835) is another clip's framing, and CRAFT.md puts the focus at the true middle. Replace this creep.
const camAt = makeCamera(
  [
    { f: 0, k: 1, wx: 540, wy: 960, sy: 960 },
    { f: DURATION, k: 1.04, wx: 540, wy: 960, sy: 960 },
  ],
  true,
);
// #endif

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  // #if overlay
  const cam = CAM;
  // #else
  const cam = swayCam(camAt(frame), frame);
  // #endif
  const marker = (
    <>
      <WorldSvg cam={cam}>
        {/* MARKER (delete): the frame's true middle at rest */}
        <circle cx={540} cy={960} r={36} fill="none" stroke={ACCENT} strokeWidth={4 / cam.k} />
      </WorldSvg>
      <Label text="__NAME__" x={540} y={1050} cam={cam} frame={frame} f0={-14} />
    </>
  );
  // #if overlay
  return <AbsoluteFill>{marker}</AbsoluteFill>;
  // #else
  return <TexcocoPage cam={cam}>{marker}</TexcocoPage>;
  // #endif
};

export default __NAME__;
