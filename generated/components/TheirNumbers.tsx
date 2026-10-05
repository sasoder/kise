import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActAWorld, DUR_A, FPS, S_A } from "./mercJobShared";

// ---------------------------------------------------------------------------
// TheirNumbers — cut 1 of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky Pint
// S4 style on the clip's one world (mercJobShared.tsx; brief out/mercjob/briefs/BRIEF.md).
// 1920x1080 (the Premiere sequence), 24 fps, opaque.
//
// THE LINE: "they ... They gave me the opportunity to look at their setup, their numbers and
// everything. And I came back and said"
// WINDOW: seq 11.80 -> 18.16, span 6.36 s. DURATION = round(6.36 x 24) = 153, + 16-frame tail = 169.
// STORY CLOCK (Act A): S = f (0 .. 168). Cut 2 SameBudgets opens on S 168 (this cut's last frame).
// ONSETS (f): they 1 · They 16 · gave 18 · me 23 · opportunity 28 · look 45 · at 48 · their 52 ·
// setup 65 · their 94 · numbers 98 · and 109 · everything 121 · And 130 · I 132 · came 133 ·
// back 137 · and 142 · said 145 · ends 153.
//
// ONE MOTION: the visit — Mercedes opens its books to him, and he takes it home.
// GESTURES (gesture -> word -> frames)
//   f0: Toto (amber, the only amber) already VISITING, left of the closed Mercedes tile (BOARD); the
//     frame holds the two at k 3.1, Williams off-frame left, the room on the right for the setup; a
//     slow creep-in already running (k 3.1 -> 3.26 by f100) -> "they"
//   the Mercedes tile tones board -> cream (12 f) and the light pool slides from Toto onto it ->
//     "They gave me" -> f16-28
//   the two hub tiles (engine, F1 car; no labels) slide out sideways from behind the Mercedes tile,
//     decelerating, and land on f65; each glyph lights (board -> cream) as it lands (f57-69); the
//     pool follows onto the setup -> "look at their setup" -> f45-65
//   the cream budget bar rises out of the Mercedes slot, decelerating (rest to rest, p 3), landing
//     f112; THE ONE CLICK: a LightSweep crosses it f106-118 -> "their numbers" (f94-98)
//   the camera eases back and up to take in tile, hubs and bar (k 2.98), landing ahead of
//     "everything" (f121) -> "and everything" -> f90-124
//   the hubs dim and slide back behind the tile (the books close) -> "And I came back" -> f124-146
//   Toto lifts one elevation and glides left to HOME at Williams, settling on f150 ("said" f145 sits in
//     the settle); the camera leads him (f114-146), revealing the Williams tile in cream; the pool
//     follows him -> "And I came back and said" -> f128-150
//   tail: the creep on the pair -> f150-168. End picture: both tiles, Mercedes with its bar, Toto at
//     Williams.
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_A.TheirNumbers;
export const S0 = S_A.TheirNumbers;

export const schema = z.object({
  /** a fractional offset on the story clock (join checks only) */
  sOffset: z.number().default(0),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const TheirNumbers: React.FC<Props> = ({ sOffset }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActAWorld S={S0 + frame + sOffset} />
    </AbsoluteFill>
  );
};

export default TheirNumbers;
