import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR, FPS, IcebergWorld, S_1 } from "./icebergShared";

// ---------------------------------------------------------------------------
// TwoDriversStout — cut 1 of Toto Wolff's "no dickheads rule" (Cheeky Pint S4E01), on the iceberg world
// (icebergShared.tsx; brief out/dickheads/briefs/BRIEF.md). Cheeky Pint S4 stout system, B1.
// 1080x1920, 24 fps, opaque.
//
// THE LINE: "Formula 1 from outside. You see two drivers."
// WINDOW: edit in 0:00.880. DURATION = round(span x 24) = 61, + 16-frame tail = 77.
// STORY CLOCK: S = S_1 + f = 0 .. 76; cut 2 opens on S 76 (this cut's last frame), pixel for pixel.
// ONSETS (f): formula 0 · one 6 · from 12 · outside 17 · you 30 · see 33 · two 36 · drivers 40 · ends 61.
//
// ONE MOTION: the two cars glide in along the plateau's floor and come to rest in the light pool; outside
// eyes make their drivers the stars.
// GESTURES (gesture -> word -> frames)
//   PASS 3: the HEADLINE, the Mercedes star tile (stoutShared's MercedesTile, 112 px, screen space, top
//     on y 128), enters once: blur-in + 24 px slide-up, its shadow settling onto rest, already moving on
//     f0 -> f0-14 ("Formula 1"); it then holds, static, through all six cuts
//   the floor (the tip's glass top edge) is a hairline across the frame; the light pool sits on the
//     boxes; the tip crowd is in the DARK (one tone below board, PASS 2) and stays under y 1400
//     (asserted); nothing of the mechanics is on screen -> f0-76
//   the two cars are already gliding in on f0 (the front car B half in frame, the rear car A entering
//     from off frame left), each on ONE decelerating curve from speed to rest, no bounce
//     (x = box - D (1 - t/T)^n: A D 100 T 32 n 2.2, B D 92 T 36 n 2.6): A closes up from further back and
//     rests first (f32), B on "two" (f36); their gap 14 -> >= 4.5 -> 6 px, entry <= 45 px/f -> "Formula
//     1 from outside" ... "two" -> f0-36
//   the camera eases right with them (14 px) and creeps in, k 6.6 -> 6.8 -> f0-40
//   as each car comes to rest in the pool its helmet warms cream -> AMBER (14 f smoothstep, the band
//     gradient, the hot top edge, the bloom coming up with the colour, fixed): A f30-44, B f34-48 ->
//     "you see two drivers"
//   the tail: a slow creep, k 6.8 -> 7.0 -> f48-76
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR.TwoDrivers;
export const S0 = S_1;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const TwoDriversStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <IcebergWorld S={S0 + frame} />
    </AbsoluteFill>
  );
};

export default TwoDriversStout;
