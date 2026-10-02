import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActBScene, CUT4 } from "./wolffActB";

// ---------------------------------------------------------------------------
// SomeHaveFundamentals — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint
// S4E01), cut 4 of 5. Builder B. A window on Act B's story clock:
// S_B = 94 + frame, so its f0 IS ConservativeMultiples' f94 (the in-points are
// 94 frames apart on the 24 fps grid, edit frames 605 -> 699) and its first
// three frames are that cut's last three.
//
// LINE: "When you look at the valuations of the US teams, you have
// fundamentals for some of the teams."
// IN-POINT 0:29.140 (edit frame 699). WINDOW S_B 94-233.
// DURATION = round((34.320 - 29.140) x 24) = 124, + a 16-frame tail = 140 f.
// Word onsets (f): when 0 · you 6 · look 9 · at the 13 · valuations 22 · of the
// 35 · US 44 · teams 60 · you 76 · have 79 · fundamentals 83 · for 95 · some 102
// · of the 106 · teams 112 · speech ends 124.
//
// THE SAME YARDSTICK, SWEPT ACROSS FOUR US TEAMS: their valuations rise tall
// beside Mercedes, then each team's own profit stretches up inside its column,
// filling two and falling far short in two.
//
// GESTURES -> word -> frames of THIS cut (S_B - 94; the full list, with the data
// and sources, is in wolffActB.tsx):
//   Mercedes' "30%"/"profit" exit, "$6B"/"20x" ease to INK_LO -> "when you look" -> f4-16
//   four US tiles slide up into their slots, a wave outward -> "look at the" -> f4-20
//   their bars rise out of the tiles, amber slice first -> "valuations" -> f10-28
//   their valuation columns stretch up, tallest last -> "valuations of the US
//     teams" -> f20-59, settle to f65
//   the camera reacts: the reveal pull-back (k -> 0.665) -> "of the US teams" -> f20-74
//   breath: the creep continues -> "teams" -> f65-76
//   every team's profit stretched x20 inside its column at once, two reach, two
//     stop low -> "you have fundamentals for some" -> f76-112 (lands on "of the teams")
//   reached outlines ease INK_LO -> INK_HI -> "some ... of the teams" -> f105-119
//   tail: the creep decays (k -> 0.643) -> "teams" -> f112-139
// No click in this cut.
// DATA: illustrative, anonymous US archetypes (data.md) reproducing the real
// spread — NFL 2025 average ~56x (Forbes, 28 Aug 2025), Dallas Cowboys ~21x
// (Sportico 2025); Mercedes $6B = 20 x $300M (the Kurtz deal, Nov 2025).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = CUT4.S0;
export const DURATION = CUT4.DURATION;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SomeHaveFundamentals: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ActBScene S={S0 + frame} />;
};

export default SomeHaveFundamentals;
