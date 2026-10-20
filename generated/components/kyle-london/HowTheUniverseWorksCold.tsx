// ---------------------------------------------------------------------------
// HowTheUniverseWorks (kyle-london, cut 10). Dwarkesh map style (styles/dwarkesh-map.md).
// Opaque 1080x1920, 29.97 fps, 204 frames. The umber page with no map (kits/maps TexcocoPage).
// The world (geometry, Kepler and gear kinematics, the drawing, the camera) lives in
// ./orbitWorld.tsx, shared with cut 42 (MachinesAndOutput opens on this cut's f203); this file
// only puts it on the page. Notes: <working>/animation_source/notes/ORBIT_WORLD.md.
//
// CHECK LINE: "The same minds that worked out how the planets orbit turned that very motion into a
// machine: the orbit becomes Watt's sun-and-planet gear."
//
// THE LINE: "these scientists and people with like towering intellects were basically figuring out
// how the universe works and how to make all these machines and so forth."
// WORD -> FRAME: these 9 · scientists 11 · and 24 · people 43 · with 59 · like 65 · towering 70 ·
// intellects 82 · were 95 · basically 96 · figuring 105 · out 113 · how 124 · the 129 · universe 134 ·
// works 142 · and 157 · how 165 · to 170 · make 172 · all 175 · these 179 · machines 181 · and 187 ·
// so 192 · forth 194 · (cut back to the speaker at 204)
// DURATION: the slot 10.577 -> 17.384 s (in frame 317 -> out frame 521) = 6.807 s x 29.97 = 204 frames (f0..f203).
//
// THE MOTION (V2, the orrery): one instrument that becomes one engine under one continuous camera move.
// An engraved 18th-century brass orrery (after Wright of Derby's "A Philosopher Lecturing on the Orrery",
// 1766): a turned baluster pedestal on a flat foot, the drum (gear box), a pillar carrying the Sun ball
// (rays + hatching), one long orange arm carrying the orange Earth on a stalk with its little cream Moon.
// Seen from a little above, the horizontal orbit draws as a flattened circle. f0: close on the Sun and
// the arm, the Earth already sweeping round; the camera pulls back to the whole instrument (k ~0.98 by
// f100). f48-150: the Earth traces its orbit as a thin orange path (exactly one turn, one year per 102
// frames), mid-sweep on "universe" f134; the camera eases in.
// ONE CONTINUOUS CHANGE f150-178: the orbit plane tilts up to face us while the Earth's arm shortens and
// rises into the Sun's plane (the Earth never stops turning); the Earth ball grows teeth into the planet
// gear, the Sun ball's rays harden into the sun gear (cream -> orange); the traced orbit tilts up and
// thickens into the cream flywheel rim; the baluster parts into the A-frame's two legs while the drum
// rises to the shaft and becomes the bearing block; the hub ring and cast arms grow out (f165-180).
// CAUSE: the planet's teeth touch the sun gear's at f168; FIRST REACTION: the sun gear and flywheel start
// to turn on f169; full mesh f175. The cream connecting rod comes DOWN at full length from off the top of
// frame and couples to the planet gear's hub on f178, when the planet's motion becomes the steady driven
// motion (period 140 frames). Settled f186-203 (identical to V1's approved end state, pixel for pixel at
// f203): the sun gear and flywheel turn twice per orbit, the rod rocks, the camera creeps.
// Orange = the new (the science and its machine): the Earth, its arm and its traced orbit, then the two gears
// only; the orrery's Sun and stand, the rim, arms, stand and rod are cream. No labels, no text.
//
// SOURCES: Watt's sun-and-planet gear (William Murdoch's design), patented by Watt in 1781; illustrative,
// nothing shown on screen. The orrery's anatomy after Joseph Wright of Derby, "A Philosopher Lecturing on
// the Orrery" (1766), the still placed at 14.7 s in the edit; a simplified single-planet instrument.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage } from "../kits/maps/texcocoShared";
import { DURATION as WORLD_DURATION, OrbitScene, cutCamAt } from "./orbitWorldCold";

export const FPS = 30000 / 1001;
export const DURATION = 204;
if (WORLD_DURATION !== DURATION) throw new Error("orbitWorld's DURATION must equal this cut's");
export const schema = z.object({});
export const defaultProps = schema.parse({});

const HowTheUniverseWorksCold: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = cutCamAt(frame);
  return (
    <TexcocoPage cam={cam}>
      <OrbitScene frame={frame} cam={cam} />
    </TexcocoPage>
  );
};

export default HowTheUniverseWorksCold;
