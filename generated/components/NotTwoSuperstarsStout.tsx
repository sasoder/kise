import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR, FPS, IcebergWorld, S_6 } from "./icebergShared";

// ---------------------------------------------------------------------------
// NotTwoSuperstarsStout — cut 6 of Toto Wolff's "no dickheads rule" (Cheeky Pint S4E01), on the iceberg
// world (icebergShared.tsx; brief out/dickheads/briefs/BRIEF.md). 1080x1920, 24 fps, opaque. The clip's
// last image.
//
// THE LINE: "and I always say there's not two superstars in the team. There's two and a half thousand.
// And I treat all of them equally."
// WINDOW: edit in 0:41.460. DURATION = round(span x 24) = 142, + 16 = 158.
// STORY CLOCK: S = S_6 + f = 605 .. 762; f0 = cut 5's last frame (0 px).
// ONSETS (f): and 0 · i 2 · always 5 · say 12 · there's 18 · not 26 · two 29 · superstars 33 · in the 47 ·
// team 54 · there's 66 · two 71 · and a 74 · half 78 · thousand 81 · and 95 · i 97 · treat 100 ·
// all of 106 · them 119 · equally 123 · ends 142.
//
// ONE MOTION: the amber that marked the two drivers spreads to every one of the 2,500.
// GESTURES (gesture -> word -> frames)
//   a slow creep-in on the two drivers, the held breath, k 3.53 -> 3.73 (f15 -> f64) -> "there's not two
//     superstars in the team"
//   the READOUT re-enters above the peak as "2" (AMBER numeral, bloom; blur-in + slide-up f23 -> f35) with
//     SUPERSTARS (creamLo, f28 -> f40) -> "superstars" (f33)
//   the AMBER WAVE leaves the two helmets: a front out and down through the tip, then the body (in its own
//     order, distance + a hashed offset; PASS 2: rank-timed f66 -> f118, decelerating into its last
//     person, and never ahead of the frame: a person is reached no earlier than the frame shows them);
//     each person warms to amber as it arrives (cream -> amber in the tip, board -> amber below; 14 f,
//     hashed offsets): first f66, last f118 -> "there's two and a half thousand ... them"
//   the camera pulls back with the front to the wide, k 3.85 -> 0.885 (PASS 2: the zoom f56 -> f130, the
//     look f60 -> f136; peak on-screen person 39 px/f at k >= 2), the front always inside the frame
//   the readout rolls 2 -> 2,500 with the honest count of amber people (whole centred strings as the
//     digits grow), decelerating continuously (no value sits) and landing "2,500" on f118 -> "them"
//   THE ONE CLICK: one LightSweep crosses every amber person and the numeral, f121 -> f143 -> "equally"
//   the cars, pit wall and hub tiles stay cream; every PERSON is the same amber
//   the tail: the wide holds with a creep, k -> 0.87 -> f143-157
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR.NotTwoSuperstars;
export const S0 = S_6;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const NotTwoSuperstarsStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <IcebergWorld S={S0 + frame} />
    </AbsoluteFill>
  );
};

export default NotTwoSuperstarsStout;
