import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActAWorld, DUR_A, FPS, S_A } from "./mercJobShared";

// ---------------------------------------------------------------------------
// TheirNumbers — cut 1 of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky Pint
// S4 style on the clip's one world (mercJobShared.tsx; brief out/mercjob/briefs/BRIEF.md).
// 1080x1920 (9:16; the house frame: content centre y 835, captions under y 1400), 24 fps, opaque.
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
//     column centred on the two (tile ~340 px), Williams off-frame left; a visible creep-in already
//     running (k 3.51 -> 3.80 by f36, +8 %) that flows into the drift right -> "they"
//   the Mercedes tile tones board -> cream (12 f) and the light pool slides from Toto onto it ->
//     "They gave me" -> f16-28
//   the two hub tiles (engine, F1 car; no labels) slide out to the Mercedes tile's right from behind it,
//     decelerating, and land on f65; each glyph lights (board -> cream) as it lands (f57-69); the
//     camera drifts right and eases back (f24-70, k -> 2.66) to centre Toto + tile + hubs; the pool
//     follows onto the setup -> "look at their setup" -> f45-65
//   the tall cream budget bar (3 tiles) rises out of the Mercedes slot on a long gentle ease (rest to
//     rest, p 2.5), f84 -> landing f112 ("numbers" f98 mid-rise); THE ONE CLICK: a LightSweep crosses it
//     f106-118 -> "their numbers" (f94-98)
//   the camera rises with it and eases back to take in tile, hubs and bar (f74-114, k 2.62), landing
//     ahead of "everything" (f121) -> "and everything"
//   the hubs dim and slide back behind the tile (the books close) -> "And I came back" -> f124-146
//   Toto lifts one elevation and glides left to HOME at Williams, settling on f150 ("said" f145 sits in
//     the settle); the camera leads him (f104-144, k -> 2.31), revealing the Williams tile in cream;
//     the pool follows him -> "And I came back and said" -> f128-150
//   tail: the creep on the pair, then (f142 on) the rise that leads cut 2's trophy -> f150-168. End picture: both tiles, Mercedes with its bar, Toto at
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
