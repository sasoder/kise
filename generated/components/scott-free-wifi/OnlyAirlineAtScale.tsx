// ---------------------------------------------------------------------------
// OnlyAirlineAtScale (scott-free-wifi, cut 4). Cheeky Pint style, realistic "at sea" variant carried into the air
// (styles/cheeky-pint.md § Realistic ocean variant; the clip's shared world wifiSky.tsx on aircraftShared).
// Opaque 1080x1920, 23.976 fps, 110 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "the sky is full of airlines, but only United's planes — lots of them — are hooked up to Starlink."
//
// THE LINE: "we are going to have a few years of being the only airline that has it at scale. And"
// WORD -> FRAME: we 1 · are 9 · going 19 · to 22 · have 25 · a 28 · few 31 · years 37 · of 51 · being 59 · the 63 ·
//   only 65 · airline 71 · that 79 · has 83 · it 89 · at 93 · scale 96 · and 103
// DURATION: the slot 4.838 -> 9.426 s = 4.588 s x 23.976 = 110 frames (f0..f109); sequence frames 116-226.
//
// THE MOTION: open side-on and close through a long lens (cut 1's look): one United 787-9, ~860 px long, nose left,
// at y ~870, seen from a touch above (its radome on the crown), its cream link rising out of the top edge to the train
// overhead (out of frame); the long lens keeps the crowd out of the narrow field. One damped pull-back (pre-rolled,
// under way at f0: the lens widens 5200 -> 1150 px, the camera comes out to the wide and tilts level a little behind
// the zoom; settling ~f85, then a slow creep to the end) opens up the sky full of airliners from ~f12-45, cruising
// nose left over the deck: Delta, American, Lufthansa, British Airways and Emirates (cream fins, their marks in
// ink) and United (amber fins) among them, and brings the satellite train in from the top (~f48). From f54 a wave of
// cream links drops from the train to every United jet, running out from the first jet (each drawn by a moving tip,
// 9 frames; its radome glows from the contact frame); the last lands at f94, before "scale" (f96). At most two links
// hang from any satellite (separate threads, not fans; onlyAirlinePlan WAVE). Everyone else cruises on unlinked,
// fully lit. Settled: the traffic drifts at cruise, the train glides on, pulses run down the links.
// Cause before effect: each link's tip touches its radome on its `contact` frame (onlyAirlinePlan LINKS); the radome's
// glow starts that frame and rises over 5 frames.
// AMBER = United (its fins: aircraftShared's `united` livery); Starlink's links are CREAM light.
//
// HONEST CHEATS: wifiSky's (satellites ~0.5 km above the jets at 4x size); this cut draws its train a little higher
// (TRAIN_Y, CRUISE + 560 m) and bigger (6x) so it reads across the top of a wide frame; the traffic is far denser than
// real separation allows. Jets cruise at constant true airspeed (250 m/s +- 5 %), each along its own heading.
//
// SOURCES: none on screen (no numbers). Starlink on United (announced Sept 2024; radome on the crown): COMMON.md Facts.
// Airline marks: aircraftShared / airlineMarks.ts (scott-aircraft-order).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Jet, type SideCam } from "../scott-aircraft-order/aircraftShared";
import { CruiseStage, Radome, SatTrain, StarlinkLink, radomePoint, satLinkPoint, trainSat } from "./wifiSky";
import { CAM_OPEN, DRAW, FLEET, GLOW_IN, LINKS, TRAIN, U0, U0_SAT, camAt, jetAt } from "./onlyAirlinePlan";

export const FPS = 24000 / 1001;
export const DURATION = 110;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
/** the tip's travel: eased in and out over DRAW frames from `start` */
const tipAt = (S: number, start: number) => smooth((S - start) / DRAW);
const LINK_OF = new Map(LINKS.map((l) => [l.id, l]));

const OnlyAirlineAtScale: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S) as SideCam;
  const jets: React.ReactNode[] = [];
  const links: React.ReactNode[] = [];
  // U0: the opening jet, linked all cut long
  jets.push(<Jet key="U0" type={U0.type} airline="united" at={U0.at} heading={U0.heading} alt={U0.alt} pitch={U0.pitch} shadow={0} />);
  jets.push(<Radome key="U0r" type={U0.type} at={U0.at} heading={U0.heading} alt={U0.alt} pitch={U0.pitch} glow={1} />);
  links.push(<StarlinkLink key="U0l" from={satLinkPoint(trainSat(TRAIN, U0_SAT, S), TRAIN.scale)} to={radomePoint(U0.type, U0.at, U0.heading, U0.alt, U0.pitch)} progress={1} S={S} />);
  for (const j of FLEET) {
    const at = jetAt(j, S);
    const detail = j.d > 540 ? "lo" : "hi";
    jets.push(<Jet key={j.id} type={j.type} airline={j.airline} at={at} heading={j.heading} alt={j.alt} pitch={1.5} detail={detail} shadow={0} />);
    if (!j.united) continue;
    const L = LINK_OF.get(j.id);
    const glow = L ? smooth((S - L.contact) / GLOW_IN) : 0;
    jets.push(<Radome key={`${j.id}r`} type={j.type} at={at} heading={j.heading} alt={j.alt} pitch={1.5} glow={glow} />);
    if (L && S > L.start) {
      const p = tipAt(S, L.start);
      links.push(<StarlinkLink key={`${j.id}l`} from={satLinkPoint(trainSat(TRAIN, L.sat, S), TRAIN.scale)} to={radomePoint(j.type, at, j.heading, j.alt, 1.5)} progress={p} S={S} />);
    }
  }
  return (
    <CruiseStage
      cam={cam}
      rest={CAM_OPEN}
      S={S}
      world={
        <>
          <SatTrain train={TRAIN} />
          {jets}
          {links}
        </>
      }
    />
  );
};

export default OnlyAirlineAtScale;
