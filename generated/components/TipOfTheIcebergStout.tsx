import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR, FPS, IcebergWorld, S_3 } from "./icebergShared";

// ---------------------------------------------------------------------------
// TipOfTheIcebergStout — cut 3 of Toto Wolff's "no dickheads rule" (Cheeky Pint S4E01), on the iceberg
// world (icebergShared.tsx; brief out/dickheads/briefs/BRIEF.md, PASS4.md). 1080x1920, 24 fps, opaque.
//
// THE LINE: "but this is just the tip of the iceberg. It's about 150 people that go to the tracks."
// WINDOW: edit in 0:11.779. DURATION = round(span x 24) = 103, + 16 = 119.
// STORY CLOCK: S = S_3 + f = 177 .. 295; f0 = cut 2's last frame (0 px); cut 4 opens on S 295.
// ONSETS (f): but 0 · this 4 · is 15 · just 17 · the 21 · tip of 24 · the 30 · iceberg 32 · it's 49 ·
// about 52 · 150 56 · people 68 · that 77 · go to 80 · the 89 · tracks 92 · ends 103.
//
// ONE MOTION: the pull-back reveals the floor as the top of an iceberg; the light spreads down through
// its tip and counts the 150.
// GESTURES (gesture -> word -> frames)
//   (PASS 4: the Mercedes-AMG Petronas lockup stands over the cars, ~190 px tall here (ring ~103); the
//     readout stacks ABOVE it, so this cut frames readout -> logo -> tip -> waterline as one centred
//     column; no headline band, no world mask; the two DARK hub tiles sit deep in the body, off frame)
//   one long pull-back, k 3.94 -> 2.2, dropping the waterline into the lower half (f12 -> f49) ->
//     "tip of the iceberg"
//   the WATERLINE (one cream rule) draws out from the axis past both frame edges (f20-44) and on past
//     the berg (off frame, by f48); each body person it passes over (by |x - axis|) rises DARK -> board
//     (13 f, a hashed 0-3 f delay): the body crowd comes up out of the dark under the line;
//     the two hub tiles stay DARK until cut 4 -> "tip of the iceberg"
//   the tip's glass outline draws from the plateau's corners down the flanks to the waterline, its tint
//     with it; the floor turns out to be the tip's top edge -> f24-52 ("iceberg" f32)
//   the LIGHT FRONT widens from the cars down through the tip (in its own order: distance + a hashed
//     offset), each DARK person warming to cream as it arrives (13 f, a soft wave); rank-timed so
//     the count runs and decelerates continuously into its last person: first f48, the 150th on f74;
//     the pool's centre moves down through the tip (f44-80) -> "it's about 150 people"
//   the READOUT rises above the logo (blur-in + 24 px slide-up, f44-56) at its honest 16 (2 drivers + 8
//     mechanics + 6 engineers) and counts the lit people, tabular, roll blur in proportion to speed; no
//     value ever sits: the last step (149 -> 150, 3.4 f) eases out and "150" lands on f74 -> "people";
//     its top never above y 320
//   AT THE TRACK (LABEL, creamLo) blurs in under it, f78 -> f90 -> "go to the tracks"
//   the tail: a hold-creep, k -> 2.34 -> f90-118
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR.TipOfTheIceberg;
export const S0 = S_3;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const TipOfTheIcebergStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <IcebergWorld S={S0 + frame} />
    </AbsoluteFill>
  );
};

export default TipOfTheIcebergStout;
