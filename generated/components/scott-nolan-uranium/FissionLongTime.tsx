// ---------------------------------------------------------------------------
// FissionLongTime (scott-nolan-uranium, cut 9). Cheeky Pint style, stout in real 3D (nuclearWorld). RENDER WITH --gl=angle.
// Opaque 1080x1920, 23.976 fps, 88 frames.
//
// CHECK LINE: "This is old, real technology: from a 1950s photograph to the same reactor today."
//
// THE LINE: "fission has been around for a long time. And if we just talk about reactors"
// WORD -> FRAME (word_frames.md, words.json): fission 2 · been 11 · around 14 · long 25 · time 28 · And 39 · if 48 · talk 58 ·
//   about 62 · reactors 66 · it 84. (The brief's "reactors f74" is not in the word table: Whisper has it at 66.4. Landing is
//   built to 66.)
// DURATION: the slot 9.551 -> 13.222 s = 3.671 s x 23.976 = 88 frames (f0..f87).
//
// THE MOTION: one camera. A real 1956 print of a reactor vessel lies on the board and the camera drifts over it; it then trucks
// right with a slight rise while it comes down from above the board, so the print leaves frame left as a 3D cutaway vessel of
// the same family comes in from the right, its coolant pipes already running out of frame on both sides; the camera has landed on the vessel just before "reactors" and keeps creeping
// around it while the control rods ease out and the core shimmers.
// AMBER = uranium fuel, here the fuel assemblies in the core, and nothing else; cream = the vessel; glass = the water.
//
// SOURCES: Shippingport Atomic Power Station, reactor vessel clear of its rail car, Oct. 10, 1956. DOE / US Government, public
// domain: https://commons.wikimedia.org/wiki/File:Shippingport_Atomic_Power_Station_-_Oct._10,_1956_(14492222700).jpg
// (cropped to lose its printed caption strip; public/scott-nolan-uranium/shippingport_vessel_1956.jpg). No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { NuclearStage, nuclearCamAt, nuclearTrack, type NuclearCam } from "./nuclearWorld";
import { CalmBoard, PhotoPrint, PwrVessel, VESSEL } from "./reactorVessel";

export const FPS = 24000 / 1001;
export const DURATION = 88;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PHOTO = "scott-nolan-uranium/shippingport_vessel_1956.jpg";
const PHOTO_ASPECT = 2800 / 2056;
const PRINT_W = 912;
const REACTOR_X = 1040; // close enough that vessel and print share the frame at f42-48; the print clears by f70

const START: NuclearCam = { tx: -60, ty: 0, tz: 0, d: 2300, yaw: -3.5, pitch: 58, f: 2200, cx: 540, cy: 745 };
const TRACK = nuclearTrack(
  START,
  [
    // the drift over the print, already moving at f0
    { f0: -18, f1: 40, to: { tx: 44, pitch: 54, yaw: 0, d: 2010 } },
    // the one truck: right, rising, coming down to the vessel
    { f0: 20, f1: 62, to: { tx: REACTOR_X, ty: VESSEL.H * 0.5, tz: 0, pitch: 13, yaw: 0, cy: 768, d: 3000, f: 3000 }, warp: 1.25 },
    // the creep around it, overlapping the landing so nothing holds
    { f0: 52, f1: 110, to: { yaw: 7, d: 2931 } },
  ],
  DURATION,
);

const FissionLongTime: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = nuclearCamAt(TRACK, f);
  const rods = interpolate(f, [50, 96], [0, 1], { easing: Easing.inOut(Easing.sin), extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <NuclearStage
      cam={cam}
      S={f + 40}
      pool={{ x: 500, y: 780 }}
      bloom={2}
      floor={false}
      world={
        <>
          <CalmBoard units={1296} d={cam.d} />
          <PhotoPrint url={PHOTO} at={[0, 0]} width={PRINT_W} photoAspect={PHOTO_ASPECT} yaw={6} />
          <PwrVessel at={[REACTOR_X, 0]} S={f + 40} rods={rods} />
        </>
      }
    />
  );
};

export default FissionLongTime;
