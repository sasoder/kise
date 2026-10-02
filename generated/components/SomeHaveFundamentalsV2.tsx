import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUT4 } from "./wolffActB";
import { ActB2Scene } from "./wolffActB2";

// ---------------------------------------------------------------------------
// SomeHaveFundamentalsV2 — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint
// S4E01), cut 4, V2: the user's revision "doesn't it make sense to also add
// logos to the 29 graphic?". Builder B. V1 (SomeHaveFundamentals.tsx) stays as
// delivered; this is a separate window on the same Act B story clock:
// S_B = 94 + frame, so its f0 IS ConservativeMultiples' f94 (0 px) and its
// first three frames are that cut's last three.
//
// LINE: "When you look at the valuations of the US teams, you have
// fundamentals for some of the teams."
// IN-POINT 0:29.140 (edit frame 699). WINDOW S_B 94-233.
// DURATION = round((34.320 - 29.140) x 24) = 124, + a 16-frame tail = 140 f.
// Word onsets (f): when 0 · you 6 · look 9 · at the 13 · valuations 22 · of the
// 35 · US 44 · teams 60 · you 76 · have 79 · fundamentals 83 · for 95 · some 102
// · of the 106 · teams 112 · speech ends 124.
//
// THE SAME YARDSTICK, SWEPT ACROSS FOUR REAL US TEAMS (the LA Lakers, the
// Golden State Warriors, the New York Knicks, the Dallas Cowboys, by their
// crests): their valuations rise tall beside Mercedes, then each team's own
// operating income stretched x20 fills the Cowboys' column, most of the
// Warriors', and a third and a fifth of the Lakers' and the Knicks'.
//
// GESTURES -> word -> frames of THIS cut (the full list, with the data and
// sources, is in wolffActB2.tsx):
//   Mercedes' "30%"/"profit" exit, "$6B"/"20x" ease to INK_LO -> "when you look" -> f4-16
//   four crest tiles slide up into their slots, a wave outward -> "look at the" -> f4-20
//   their revenue bars rise, the amber operating-income slice first -> "valuations" -> f10-28
//   their valuation columns stretch up, the Cowboys' last -> "valuations of the
//     US teams" -> f20-61, settle to f67
//   the camera reacts: the reveal pull-back (k -> 0.495, look +400) -> "of the US teams" -> f10-70
//   breath: the creep continues -> "teams" -> f61-76
//   every team's operating income x20 inside its column at once -> "you have
//     fundamentals for some" -> f76-112 (lands on "of the teams")
//   the Cowboys' outline eases INK_LO -> INK_HI as its fill reaches the top -> "some" -> f106-118
//   tail: the creep decays (k -> 0.47) -> "teams" -> f112-139
// No click in this cut.
// DATA: Forbes team pages (NBA list Oct 2025; NFL 2025 list), data.md "Cut 4 V2";
// Mercedes $6B = 20 x $300M (the Kurtz deal, Nov 2025).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = CUT4.S0;
export const DURATION = CUT4.DURATION;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SomeHaveFundamentalsV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ActB2Scene S={S0 + frame} />;
};

export default SomeHaveFundamentalsV2;
