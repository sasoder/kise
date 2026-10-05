import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActAWorld, DUR_A, FPS, S_A } from "./mercJobShared";

// ---------------------------------------------------------------------------
// SameBudgets — cut 2 of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky Pint
// S4 style on the clip's one world (mercJobShared.tsx; brief out/mercjob/briefs/BRIEF.md).
// 1920x1080, 24 fps, opaque.
//
// THE LINE: "one of us is wrong, because I'm working on the same budgets"
// (just heard: "what is your aspiration? ... winning world championships ... And I said OK, then")
// WINDOW: seq 23.20 -> 26.08, span 2.88 s. DURATION = round(2.88 x 24) = 69, + 16-frame tail = 85.
// STORY CLOCK (Act A): S = 168 + f (168 .. 252). f0 = TheirNumbers' last frame (S 168), pixel for
// pixel, no reset. Cut 3 TopSix opens on this clock at S 168 + 69.12.
// ONSETS (f): one 2 · of 16 · us 18 · is 20 · wrong 22 · because 27 · I'm 32 · working 37 · on 42 ·
// the 47 · same 49 · budgets 54 · ends 69.
//
// ONE MOTION: Williams' bar rises to Mercedes' level.
// GESTURES (gesture -> word -> frames)
//   the trophy (Mercedes' aspiration, a cream Lucide-grammar outline) rises over Mercedes' bar: slide
//     up 24 px + fade + blur, f1-15; the light pool widens from Toto onto both tiles -> "one of us"
//     -> f0-18
//   Williams' bar starts rising out of its slot -> "because I'm working on" -> f31-44
//   it decelerates (rest to rest, p 3.25) to EXACTLY Mercedes' height and lands f54; one hairline
//     level rule draws from Mercedes' bar top toward Williams' (f44-57) and the bar meets it; THE ONE
//     CLICK: a LightSweep crosses Williams' bar f50-62 -> "the same budgets" (f47-58)
//   the camera: a slow creep on the pair throughout; tail: hold, drift.
// No numbers (neither 2012 budget is a public filed figure; equal heights are HIS claim). Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_A.SameBudgets;
export const S0 = S_A.SameBudgets;

export const schema = z.object({
  /** a fractional offset on the story clock (join checks only) */
  sOffset: z.number().default(0),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SameBudgets: React.FC<Props> = ({ sOffset }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActAWorld S={S0 + frame + sOffset} />
    </AbsoluteFill>
  );
};

export default SameBudgets;
