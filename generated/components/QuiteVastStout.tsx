import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR, FPS, IcebergWorld, S_5 } from "./icebergShared";

// ---------------------------------------------------------------------------
// QuiteVastStout — cut 5 of Toto Wolff's "no dickheads rule" (Cheeky Pint S4E01), on the iceberg world
// (icebergShared.tsx; brief out/dickheads/briefs/BRIEF.md). 1080x1920, 24 fps, opaque.
//
// THE LINE: "and we are 2,500 people in an organisation that is quite vast, if you look at the two cars"
// WINDOW: edit in 0:27.879. DURATION = round(span x 24) = 145, + 16 = 161.
// STORY CLOCK: S = S_5 + f = 445 .. 605; f0 = cut 4's last frame (0 px); cut 6 opens on S 605.
// ONSETS (f): and we 0 · are 2 15 · 500 21 · people 32 · in an 43 · organization 55 · that 65 · is 71 ·
// quite 73 · vast 79 · if you 97 · look 113 · at the 118 · two 128 · cars 132 · ends 145.
//
// ONE MOTION: pull right back until the whole iceberg is one held, vast picture; then back to the two
// cars on its top.
// GESTURES (gesture -> word -> frames)
//   one strong pull-back and rise, k 2.05 -> 1.15 (f-4 -> f32): the readout ("150 / AT THE TRACK", at its
//     place above the peak) is on screen and legible from f16, before it rolls; ENGINE / CHASSIS exit
//     (the entrance reversed) as the camera passes k 1.6 (f11 -> f23); the tiles stay -> "and we are"
//   the body's glass outline draws from the waterline down both flanks and closes on its broad bottom
//     facet (f18 -> f46), its tint with it. Its head is the counter's front: the readout = 150 + the
//     body people it has passed (a person counts once the head is BODY_REACH below their centre, so the
//     count closes as the outline closes). PASS 2: the head is rank-timed, so the count runs and
//     decelerates continuously into "2,500", landing on f46 (no value sits); the label rolls AT THE
//     TRACK -> PEOPLE through its own lane as it lands (f37-51) -> "2,500 people ... in an"
//   the pull-back keeps decelerating to the WIDE, k 0.885 (f24 -> f76): the whole closed glass iceberg
//     in y 200-1400, the readout above it; the held creep, k -> 0.86 (f70-100). The body people stay
//     board; the pool sits on the whole berg -> "in an organisation that is quite vast"
//   PASS 2: the readout exits first (its entrance reversed, f82 -> f94); then ONE long eased glide UP and
//     IN to the two cars on the plateau, k 0.86 -> 3.5 (the look f84 -> f134, the zoom f88 -> f154,
//     landing ~f150; peak on-screen person 43 px/f at k >= 2); the pool returns to the cars (f97-135);
//     the amber helmets are the subject -> "if you look at the two cars"
//   the tail: a creep, k -> 3.6 -> f150-160
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR.QuiteVast;
export const S0 = S_5;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const QuiteVastStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <IcebergWorld S={S0 + frame} />
    </AbsoluteFill>
  );
};

export default QuiteVastStout;
