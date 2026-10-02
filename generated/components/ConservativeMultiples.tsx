import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActBScene, CUT3 } from "./wolffActB";

// ---------------------------------------------------------------------------
// ConservativeMultiples — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint
// S4E01), cut 3 of 5. Builder B. A window on Act B's story clock: S_B = frame.
//
// LINE: "These multiples are actually on the conservative side."
// IN-POINT 0:25.199 (edit frame 605). WINDOW S_B 0-96.
// DURATION = round((28.559 - 25.199) x 24) = 81, + a 16-frame tail = 97 f.
// Word onsets (f): these 0 · multiples 3 · are 15 · actually 33 · on the 45 ·
// conservative 62 · side 71 · speech ends 81.
// Adjacent to SomeHaveFundamentals: its f94-96 are that cut's f0-2 (0 px).
//
// ONE STRETCH: a transparent copy of the profit slice pulls upward to twenty
// times its height, and the camera rides its top until it lands on $6B.
//
// GESTURES -> word -> frames (the full list is in wolffActB.tsx):
//   the stretch, m 1 -> 20 on smoothstep(u^1.35) from S -6, already 9 px clear
//     of the slice and moving on f0 -> "these multiples are actually" -> lands
//     f58, 4 f before "conservative"; zero-sloped settle f58-64
//   the counter "1x".."20x" rides centred over the top (cut 1's riding-readout
//     grammar), a hard tick per rung -> "multiples" -> in f10-22, ticks to f58
//   "30%" eases to INK_LO -> "these multiples" -> f0-12; "$1B"/"revenue" exit
//     together, behind the glass, as the top reaches them -> f2-14
//   camera rides the top and pulls back to the solved landing (k 2.12 -> 0.85;
//     zoom f0-48 leading, tilt f4-50) -> "these multiples are actually"
//   "$6B" slides up into the slot over "20x", THE ONE CLICK (HALF_STEP f64-66)
//     -> "conservative" -> f52-64
//   the outline eases INK_LO -> INK_HI as the column completes -> "conservative"
//     -> f56-68
//   the slow pull-back cut 4 continues -> "on the conservative side" + tail -> f44-96
// DATA: $1B revenue / 30 % margin (Toto); $6B = the Kurtz deal, Nov 2025, GBP
// 4.57B / $5.97B (CNBC 20 Nov 2025, BlackBook 21 Nov 2025) = 20 x $300M.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = CUT3.S0;
export const DURATION = CUT3.DURATION;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const ConservativeMultiples: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ActBScene S={S0 + frame} />;
};

export default ConservativeMultiples;
