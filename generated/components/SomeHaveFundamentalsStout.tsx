import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUT4 } from "./wolffActB";
import { ActBStoutScene } from "./stoutActB";

// ---------------------------------------------------------------------------
// SomeHaveFundamentalsStout — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint
// S4E01), cut 4 in the STOUT system, with the V2 real-team cast (crests). Builder
// B. A window on Act B's story clock: S_B = 94 + frame, so its f0 IS
// ConservativeMultiplesStout's f94 (0 px) and its first three frames are that
// cut's last three.
//
// LINE: "When you look at the valuations of the US teams, you have fundamentals
// for some of the teams."
// IN-POINT 0:29.140 (edit frame 699). WINDOW S_B 94-233.
// DURATION = round((34.320 - 29.140) x 24) = 124, + a 16-frame tail = 140 f.
// Word onsets (f): when 0 · you 6 · look 9 · at the 13 · valuations 22 · of the
// 35 · US 44 · teams 60 · you 76 · have 79 · fundamentals 83 · for 95 · some 102
// · of the 106 · teams 112 · speech ends 124.
//
// THE SAME YARDSTICK ACROSS FOUR REAL US TEAMS: their crests arrive, their
// valuations rise tall beside Mercedes, then each team's own operating income
// stretched x20 fills the Cowboys', most of the Warriors', a third of the Lakers'
// and a fifth of the Knicks' — resting on the style frame c4_end.
//
// GESTURES -> word -> frames of THIS cut (the full list, the data and sources:
// stoutActB.tsx; the cast is ONE swappable table there, CAST_B):
//   "$6B" eases cream -> creamLo by tone -> "when you look" -> f4-16; "20x" eases
//     HERO -> SECONDARY with the camera
//   four crest pillars rise into their slots, lifted while they travel, a wave
//     outward -> "look at the" -> f4-20
//   their bars rise out of the slots, amber first -> "valuations" -> f10-28
//   their glasses stretch up, tallest last, as the camera pulls back to c4_end ->
//     "valuations of the US teams" -> f20-61
//   breath: the pull-back decays -> "teams" -> f61-76
//   every team's profit x20 at once -> "you have fundamentals for some" -> f76-112
//   the Cowboys' glass eases lo -> hi as its fill reaches the top -> "some ... teams"
//   tail: the camera lands on c4_end -> "teams" + tail
// No click in this cut.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = CUT4.S0;
export const DURATION = CUT4.DURATION;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SomeHaveFundamentalsStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ActBStoutScene S={S0 + frame} />;
};

export default SomeHaveFundamentalsStout;
