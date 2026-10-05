import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS } from "./mercJobShared";
import { ActBWorld, DUR_B, S_B } from "./mercJobActB";

// ---------------------------------------------------------------------------
// BestJobs — cut 5 of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky Pint S4
// style on the clip's one world (mercJobShared.tsx; Act B in mercJobActB.tsx; brief
// out/mercjob/briefs/BRIEF.md; out/mercjob/WORLD_9x16_READY.md). 1080x1920 (9:16), 24 fps, opaque.
//
// THE LINE: "of the best jobs in the industry"
// WINDOW: seq 62.56 -> 64.16, span 1.60 s. DURATION = round(1.60 x 24) = 38, + 16-frame tail = 54.
// STORY CLOCK (Act B): S = 91.2 + f (91.2 .. 144.2): cut 4 HeadOfMercedes' clock at 3.80 s, so f0 is
// cut 4 at S 91.2, pixel for pixel.
// ONSETS (f): of 2 · the 4 · best 7 · jobs 11 · in 18 · the 22 · industry 24 · ends 38.
//
// ONE MOTION: the pull-out that began on cut 4's "is" widens to the industry: the F1 grid formation.
// GESTURES (gesture -> word -> frames)
//   the pull-out carries on, out and down, decelerating to a wide rest on the whole formation (k 1.0,
//     tiles 96 px): two staggered columns, Williams + Mercedes level in its third row; Mercedes with amber
//     Toto on top stays the lit subject (cream, the pool tightening onto them) -> "of the best jobs" -> f0-38
//   the other nine teams come up out of the ground and tone DARK -> board as the front (out from the
//     pair's row, up and down) and the widening view reach them: the next rows f0-12, two rows away
//     f6-18, the back row f14-26 (decelerating) -> f0-26
//   the F1 mark (cream, the real logo, 2.5 tiles wide) slides up 24 px + fades in over the front row ->
//     "in the industry" (f18-24) -> f18-34
//   the camera rests by ~f40, then a slow sideways drift through the tail -> f40-53
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_B.BestJobs;
export const S0 = S_B.BestJobs;

export const schema = z.object({
  /** a fractional offset on the story clock (join checks only) */
  sOffset: z.number().default(0),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BestJobs: React.FC<Props> = ({ sOffset }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActBWorld S={S0 + frame + sOffset} />
    </AbsoluteFill>
  );
};

export default BestJobs;
