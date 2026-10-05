import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActAWorld, DUR_A, FPS, S_A } from "./mercJobShared";

// ---------------------------------------------------------------------------
// TopSix — cut 3 of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky Pint S4
// style on the clip's one world (mercJobShared.tsx; brief out/mercjob/briefs/BRIEF.md).
// 1920x1080, 24 fps, opaque.
//
// THE LINE: "and I'm thinking about finishing in the top six"
// WINDOW: seq 26.08 -> 28.16, span 2.08 s. DURATION = round(2.08 x 24) = 50, + 16-frame tail = 66.
// STORY CLOCK (Act A): S = 168 + 69.12 + f (237.12 .. 302.12): f0 is SameBudgets' clock at 69.12
// (adjacent in the edit), pixel for pixel.
// ONSETS (f): thinking 6 · about 10 · finishing 16 · in 24 · the 30 · top 31 · six 35 · ends 50.
//
// ONE MOTION: the camera drifts to Williams, and his aspiration stands against Mercedes'.
// GESTURES (gesture -> word -> frames)
//   one slow continuous glide toward Williams (dx -44 world, k 2.36 -> 2.40), already moving on f0,
//     landing f34 -> "thinking about finishing" -> f-4 -> f34
//   "TOP 6" (Söhne Kräftig caps, tracked, cream) slides up 24 px + fades + blurs in over Williams'
//     bar, its cap centre at the trophy's centre height, f26 -> landed f38 -> "top six" (f31-35)
//   tail: a hold-creep (k -> 2.42). End picture: equal bars, trophy vs TOP 6, Toto amber at Williams.
// No LightSweep in this cut. Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_A.TopSix;
export const S0 = S_A.TopSix;

export const schema = z.object({
  /** a fractional offset on the story clock (join checks only) */
  sOffset: z.number().default(0),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const TopSix: React.FC<Props> = ({ sOffset }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActAWorld S={S0 + frame + sOffset} />
    </AbsoluteFill>
  );
};

export default TopSix;
