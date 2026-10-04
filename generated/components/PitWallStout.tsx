import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR, FPS, IcebergWorld, S_2 } from "./icebergShared";

// ---------------------------------------------------------------------------
// PitWallStout — cut 2 of Toto Wolff's "no dickheads rule" (Cheeky Pint S4E01), on the iceberg world
// (icebergShared.tsx; brief out/dickheads/briefs/BRIEF.md, PASS4.md). 1080x1920, 24 fps, opaque.
//
// THE LINE: "and then you see the mechanics and sometimes the engineers on the pit wall"
// WINDOW: edit in 0:06.280. DURATION = round(span x 24) = 86, + 16 = 102.
// STORY CLOCK: S = S_2 + f = 76 .. 177; f0 = cut 1's last frame (0 px); cut 3 opens on S 177.
// ONSETS (f): and 0 · then 4 · you 7 · see 10 · the 15 · mechanics 19 · and 30 · sometimes 44 · the 55 ·
// engineers 60 · on the 68 · pit 74 · wall 79 · ends 86.
//
// ONE MOTION: the crew converges on the stopped cars, then the camera eases back and down as the pit
// wall rises beneath them.
// GESTURES (gesture -> word -> frames)
//   (PASS 4: the Mercedes-AMG Petronas lockup stands over the cars in the world; it shrinks with the
//     pull-back but counter-scales, ~280 -> ~230 px tall, ring >= 125 px)
//   the 8 mechanics (cream, lit by the pool) glide in along the plateau from just outside the frame,
//     starting on f0 ("and then you see"; none of them before this cut): two queues, car A's
//     from the left and car B's from the right (the one going farthest in leads and lands first, 13.5 px
//     apart, so none ever touch), ONE wave, each on its own hashed arc (a 0.8-1.8 px lift, no bounce),
//     decelerating to rest under its wheel, a pair per wheel in the tip's first row, lifted while they
//     travel (one shadow each); landing f25-29, <= 43 px/f -> "the mechanics"
//   the camera eases back and a little down, k 7.0 -> 4.0 (f22 -> f66, landing ~f72), centring the
//     column logo -> cars -> pit wall -> "and sometimes the engineers on the pit"; the pool's centre
//     drifts down to take in the wall (f40-80)
//   the pit wall's terrace (a short glass ledge) draws out from the axis f36-46 and its slot opens
//     (f40-48); the cream bar rises out of the slot, lifted, f44-66; its six engineers (headsets) rise in
//     behind it until heads and shoulders clear its top edge, f56-78 -> "engineers on the pit wall"
//   the crowd below stays in the DARK: the subject is the cars, the mechanics, the pit wall
//   the tail: a creep, k -> 3.94 -> f78-101
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR.PitWall;
export const S0 = S_2;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const PitWallStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <IcebergWorld S={S0 + frame} />
    </AbsoluteFill>
  );
};

export default PitWallStout;
