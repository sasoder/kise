// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__, cut <inSeconds>). __STYLE__ (styles/dwarkesh-3d.md).
// __FORMAT__.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d (its header is the API). A clip with several cuts in one place keeps a shared world
// file in the clip folder (styles/dwarkesh-3d.md, Build pattern).
//
// CHECK LINE: "<what the viewer can say after this cut that they could not say before>"
//
// THE LINE: "<the spoken line, verbatim>"
// WORD -> FRAME: <word f · word f · …> (the brief's word table at FPS)
// DURATION: __DURATION_NOTE__
//
// THE MOTION: <two or three sentences: the one mechanism, what the camera does, the payoff and when it lands>.
// Orange = <the clip's one orange rule from the brief>; everything else in muted earthy local colours, people never orange.
//
// DEPTH: <eye height, dRef / kRef / dolly, fog mode (eye | depth), and the depths of the main objects>
//
// SOURCES: <every real place, date, figure and image, and where it was verified; or "none">
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, RomeFolk, WorldSvg, airWorldOf, makeCamera, swayCam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** cast units per metre (a man ~312 = 1.75 m) */
const U = 178;
// The depth camera: the eye 2 m up, a little over the heads (the horizon is the 2D world row y = eyeY), the camera dRef in front of the front
// plane at the zoom kRef; a zoom is half dolly, half lens.
const DEPTH: DepthOpts = { eyeY: -2 * U, dRef: 1800, kRef: 2, dolly: 0.5 };
// The 2D camera: keyed world points at screen points (pchip, log-zoom), sy 960 on every key (the frame's true middle).
// Replace this gentle creep with the cut's one continuous move.
const camAt = makeCamera(
  [
    { f: 0, k: 2, wx: 0, wy: -150, sy: 960 },
    { f: DURATION, k: 2.08, wx: 10, wy: -150, sy: 960 },
  ],
  true,
);
const REST = swayCam(camAt(0), 0);

const __NAME__: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame });
  // MARKER (replace all of these): the floor, one air-lit box and one gouache figure with its contact shadow, to show
  // the medium, the depth kit and the cast working together. Build the cut's own world in their place.
  const fig = { X: 70, Z: 160 };
  const { at, scale } = A.P.at(fig.X, fig.Z);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-3200} x1={3200} z0={-1300} z1={5200} mat={MAT.ground} course={170} />
        <AirHorizonHazeW A={A} id="haze" />
        <AirShadow A={A} X={-185} Z={445} w={150} d={140} uid="boxS" amt={0.7} />
        <AirBox A={A} X0={-290} X1={-80} Y0={-190} Y1={0} Z0={330} Z1={560} mat={MAT.timber} uid="box" />
        <AirShadow A={A} X={fig.X} Z={fig.Z} w={62} d={30} uid="figS" amt={0.8} />
        <RomeFolk.Freeman pose={RomeFolk.idle(RomeFolk.POSES.stand(-1), frame)} at={at} scale={scale} uid="fig" fog={A.folkFog(fig.Z)} unitPx={cam.k} />
      </WorldSvg>
    </AirStage>
  );
};

export default __NAME__;
