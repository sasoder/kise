import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUT3 } from "./wolffActB";
import { ActBStoutScene } from "./stoutActB";

// ---------------------------------------------------------------------------
// ConservativeMultiplesStout — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint
// S4E01), cut 3 in the STOUT system. Builder B. A window on Act B's story clock:
// S_B = frame. Its f94-96 are SomeHaveFundamentalsStout's f0-2 (0 px).
//
// LINE: "These multiples are actually on the conservative side."
// IN-POINT 0:25.199 (edit frame 605). WINDOW S_B 0-96.
// DURATION = round((28.559 - 25.199) x 24) = 81, + a 16-frame tail = 97 f.
// Word onsets (f): these 0 · multiples 3 · are 15 · actually 33 · on the 45 ·
// conservative 62 · side 71 · speech ends 81.
//
// ONE STRETCH: from its own establishing shot of the now pillar (act B's 42 px/$B),
// the profit slice's copy pulls upward to twenty times its height while the camera
// rides its top to the style frame c3_end; the counter rolls 1x -> 20x.
//
// GESTURES -> word -> frames (the full list, the data and sources: stoutActB.tsx):
//   the establishing shot: the now pillar, "$1B"/"REVENUE" left, "30%"/"PROFIT" right -> "these" -> f0-8
//   the stretch, already separating on f0 -> "these multiples are actually" -> f0-58, settle f58-64
//   the lockups leave together -> f8-20; the counter (HERO odometer) arrives in their wake
//     riding the top and rolls to "20x" -> "multiples" -> in f10-22
//   the camera rides the top from k 3.25 to c3_end's k 2.0 -> f0-~60
//   THE CLICK: a LightSweep across the stretched amber on the landing -> "conservative" -> f58-68
//   "$6B" slides up + blurs in over "20x" -> f52-64
//   the glass hairline eases lo -> hi as the column completes -> f56-68
//   the cut-4 pull-back starts in the tail -> "side" + tail -> f74-96
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = CUT3.S0;
export const DURATION = CUT3.DURATION;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const ConservativeMultiplesStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ActBStoutScene S={S0 + frame} />;
};

export default ConservativeMultiplesStout;
