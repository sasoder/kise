// ---------------------------------------------------------------------------
// GapWiderEveryDay (scott-free-wifi, cut 20). Cheeky Pint style, the realistic "at sea" variant carried into the air
// (styles/cheeky-pint.md; the clip's world wifiSky.tsx: CruiseStage, the radome and the link, on
// scott-aircraft-order/aircraftShared). Opaque 1080x1920, 23.976 fps, 95 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: with the sound off, a viewer says "United's plane is pulling away from the other airlines, and the gap
// between them keeps getting bigger."
//
// THE LINE: "our gap is getting wider and wider with our technology every day."
// WORD -> FRAME: our f3 · gap f11 · is f19 · getting f31 · wider f37 · and f49 · wider f56 · with f63 · our f68 ·
// technology f70 · every f79 · day f88 · (host) what f93 (notes/word_frames.txt, slot 4).
// DURATION: the slot 20.562 -> 24.524 s = 3.962 s x 23.976 = 95 frames (f0..f94).
//
// THE MOTION: four airliners cruise in ONE level row through still air (air [0,0,0]: the jets move, the camera rides
// with them), close together, noses left and turned toward the camera so their contrails recede to the right into
// depth: American 777, United's 787-9 second in the row (nearest; its radome linked by a cream cone of light to a
// Starlink satellite above the frame: United's technology), Delta A330, Lufthansa 747 (cream fins, their marks in ink,
// no links). The pack sits a little farther back with its altitudes set so the row is level on screen at f0: no gap
// before "gap". From f7 ("gap" f11) United's nose eases up once (pitch-up done f22, 1.5 -> 7.7 deg) and it climbs at
// a constant rate out of the row while the pack flies level: its contrail bends up and away from theirs and the wedge
// of open sky between them widens continuously (bigger on "wider" f37 and again on "wider" f56; the words fall on it,
// nothing steps). The contrails are this cut's own (gapWiderContrail: denser, whiter, puffs fixed in the air so the
// jets visibly fly away from them); United's is drawn deeper along its view rays (same screen place) so as it sweeps
// up past Delta and Lufthansa (f20-f36) it passes behind them, not over them. Camera: one damped glide, already moving
// at f0 and still creeping at f94: a pull-back, a slight drop and tilt so the row stays above the caption bands while
// United rises into the upper third, the action against the darker mid sky, the horizon low (deck at the bottom).
// AMBER = UNITED (its fin, the crown under it). The link is cream light. No text, no numbers.
//
// SOURCES: United flies Starlink Wi-Fi (announced Sept 2024; COMMON.md Facts); the radome and satellite are the
// world's (wifiSky header, its honest cheats: the satellite rides ~0.5 km above at 4x size). Delta flies the A330,
// American the 777-200ER, Lufthansa the 747-400 (the world's types and liveries). United's climb (6.2 deg, ~1.1 m a
// frame) and the pack's level-row altitude offsets (+27 to +52 m) are a picture of the gap, not a flight profile.
// No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Jet } from "../scott-aircraft-order/aircraftShared";
import { GapWiderContrail } from "./gapWiderContrail";
import { GAPWIDER_CAM0, GAPWIDER_JETS, GAPWIDER_SAT, gapWiderCam, gapWiderPose, gapWiderSat, type GapWiderJet } from "./gapWiderPlan";
import { CruiseStage, Radome, StarlinkLink, StarlinkSat, radomePoint, satLinkPoint } from "./wifiSky";

export const FPS = 24000 / 1001;
export const DURATION = 95;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the contrails: long enough to run back past the right edge (frames of trail) */
const TRAIL_AGE = 150;
/** United's trail is drawn 160 m deeper along each view ray (same screen place): as it bends up and away it sweeps
 *  across Delta and Lufthansa (f20-f32), and this way it passes behind them instead of over their bodies */
const UNITED_TRAIL_PUSH = 160;

const JetWithTrail: React.FC<{ j: GapWiderJet; f: number }> = ({ j, f }) => {
  const p = gapWiderPose(j, f);
  const united = j.key === "united";
  return (
    <>
      <GapWiderContrail type={j.type} path={(t) => gapWiderPose(j, t)} S={f} age={TRAIL_AGE} width={2.4} spread={22} push={united ? UNITED_TRAIL_PUSH : 0} />
      <Jet type={j.type} airline={j.airline} at={p.at} heading={p.heading} alt={p.alt} pitch={p.pitch} shadow={0} />
      {united ? <Radome type={j.type} at={p.at} heading={p.heading} alt={p.alt} pitch={p.pitch} glow={1} /> : null}
    </>
  );
};

const SAT_HEADING: [number, number] = [GAPWIDER_SAT.vel[0], GAPWIDER_SAT.vel[2]];

const World: React.FC<{ f: number }> = ({ f }) => {
  const u = GAPWIDER_JETS[0];
  const p = gapWiderPose(u, f);
  const sat = gapWiderSat(f);
  return (
    <>
      <StarlinkSat at={sat} heading={SAT_HEADING} />
      {GAPWIDER_JETS.slice()
        .reverse()
        .map((j) => (
          <JetWithTrail key={j.key} j={j} f={f} />
        ))}
      <StarlinkLink from={satLinkPoint(sat)} to={radomePoint(u.type, p.at, p.heading, p.alt, p.pitch)} progress={1} />
    </>
  );
};

const GapWiderEveryDay: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  return <CruiseStage cam={gapWiderCam(f)} S={f} rest={GAPWIDER_CAM0} air={[0, 0, 0]} world={<World f={f} />} />;
};

export default GapWiderEveryDay;
