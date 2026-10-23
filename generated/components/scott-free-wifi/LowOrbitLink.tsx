// ---------------------------------------------------------------------------
// LowOrbitLink (scott-free-wifi, cut 1). Cheeky Pint style, the realistic "at sea" variant carried into the air
// (styles/cheeky-pint.md; the clip's world wifiSky.tsx: CruiseStage, the satellite train, the link, the radome, on
// scott-aircraft-order/aircraftShared). Opaque 1080x1920, 23.976 fps, 53 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: with the sound off, a viewer says "satellites flying low overhead beam internet straight down to a
// plane in flight."
//
// THE LINE: "[high] speed, low earth orbit internet connectivity. It's"
// WORD -> FRAME: (high f-4) · speed f3 · low f9 · earth f16 · orbit f25 · internet f33 · connectivity f40 · it's f48
// (notes/word_frames.txt, slot 1).
// DURATION: the slot 1.460 -> 3.670 s = 2.210 s x 23.976 = 53 frames (f0..f52).
//
// THE MOTION: one tilt on the world's damped track. It opens looking 42 deg up into the espresso dusk on a Starlink
// train already gliding left and away (constant speed, they orbit): the nearest satellite ~370 px across, its two
// wings readable (the train's tail, the one that links), the rest shrinking toward the horizon glow. Through
// "low earth orbit" (f-4..f38) the camera tilts down while the train keeps passing: the golden haze and the cumulus
// deck far below rise into view, and United's 787-9 rises in from the bottom edge, cruising nose left just under the
// train: low orbit = right above our air. On "orbit" (f24) the train's tail (the nearest satellite, straight above
// the jet) drops a link, drawn down by a moving tip (eased over its screen length) as a soft cone of cream light; on
// "internet" (f34) the tip touches the radome on the jet's crown — contact f34: a soft pool of cream light spreads on
// the crown as the tip lands (f33-35) and the radome's glow rises f34-40; both stay (connected) through
// "connectivity". Settle: the link follows the moving satellite with data pulses running down it, the sun glint slides
// slowly down the train one or two satellites at a time, the deck drifts by under the jet (jet-fixed frame, 250 m/s),
// its contrails stream back, and a slow push-in creeps to the last frame.
// AMBER = UNITED (its fin). Starlink's link is cream light. No text.
//
// SOURCES: Starlink is SpaceX's low-earth-orbit constellation (~550 km; V2 Mini: a flat bus, two long array wings);
// United flies Starlink Wi-Fi from 2025, a low radome on the crown (COMMON.md Facts). Honest cheats (wifiSky header):
// the satellites ride ~0.5 km above the jet at 6.5x size; the radome is ~2x real. No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Jet, airCamAt, airTrack, type AirCam, type SideCam } from "../scott-aircraft-order/aircraftShared";
import { CAM_LINK_CLOSE, CRUISE_JET, Contrail, CruiseStage, Radome, SatTrain, StarlinkLink, TRAIN_CUT1, radomePoint, satLinkPoint, trainSat } from "./wifiSky";

export const FPS = 24000 / 1001;
export const DURATION = 53;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------------------
// CAMERA — from 43 deg up (the train in the dusk; the jet below the frame) one tilt down to the cruise look
// (CAM_LINK_CLOSE), then a slow push-in to the last frame
// ---------------------------------------------------------------------------
export const START: SideCam = { ...CAM_LINK_CLOSE, pitch: -43 };
export const TRACK: AirCam[] = airTrack(
  START,
  [
    { f0: -4, f1: 38, to: { pitch: CAM_LINK_CLOSE.pitch } },
    { f0: 30, f1: 90, to: { f: 1560, horizon: 1052 } },
  ],
  DURATION,
);

// ---------------------------------------------------------------------------
// THE TRAIN AND THE LINK — sat 5 (the tail, the nearest) links; its tip leaves the satellite at f24 ("orbit") and
// touches the radome at f34 ("internet"; eased over the beam's screen length); the radome's glow and the pool of light
// on the crown rise f33-40 and stay: the connected picture holds ~19 frames
// ---------------------------------------------------------------------------
/** the world's cut-1 train, drawn at 6.5x (the world's satellites are 4x): the nearest reads ~370 px across at f0 */
export const TRAIN = { ...TRAIN_CUT1, scale: 6.5 };
export const LINKED = 5;
export const LINK_T = { f0: 24, f1: 34, glow0: 34, glow1: 40 } as const;
const easeInOut = (t: number) => {
  const c = c01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
/** the tip's place along the beam's screen length */
export const linkProgress = (f: number) => easeInOut((f - LINK_T.f0) / (LINK_T.f1 - LINK_T.f0));
export const glowAt = (f: number) => {
  const t = c01((f - LINK_T.glow0) / (LINK_T.glow1 - LINK_T.glow0));
  return t * t * (3 - 2 * t);
};

const J = CRUISE_JET;
const jetPose = () => ({ at: J.at, alt: J.alt, heading: J.heading, pitch: J.pitch });

const World: React.FC<{ f: number }> = ({ f }) => {
  const from = satLinkPoint(trainSat(TRAIN, LINKED, f), TRAIN.scale);
  const to = radomePoint(J.type, J.at, J.heading, J.alt, J.pitch);
  return (
    <>
      <SatTrain train={TRAIN} />
      <Contrail type={J.type} path={jetPose} age={60} opacity={0.75} />
      <Jet type={J.type} airline="united" at={J.at} heading={J.heading} alt={J.alt} pitch={J.pitch} shadow={0} />
      <Radome type={J.type} at={J.at} heading={J.heading} alt={J.alt} pitch={J.pitch} glow={glowAt(f)} />
      <StarlinkLink from={from} to={to} progress={linkProgress(f)} />
    </>
  );
};

const LowOrbitLink: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = airCamAt(TRACK, f);
  return <CruiseStage cam={cam} S={f} rest={START} world={<World f={f} />} />;
};

export default LowOrbitLink;
