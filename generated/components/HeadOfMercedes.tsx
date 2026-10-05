import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS } from "./mercJobShared";
import { ActBWorld, DUR_B, S_B } from "./mercJobActB";

// ---------------------------------------------------------------------------
// HeadOfMercedes — cut 4 of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky Pint
// S4 style on the clip's one world (mercJobShared.tsx; Act B in mercJobActB.tsx; brief
// out/mercjob/briefs/BRIEF.md). 1920x1080 (the Premiere sequence), 24 fps, opaque.
//
// THE LINE: "need to pinch myself because you know, being the head of Mercedes Motorsport is probably"
// WINDOW: seq 58.76 -> 62.56, span 3.80 s. DURATION = round(3.80 x 24) = 91, + 16-frame tail = 107.
// STORY CLOCK (Act B): S = f (0 .. 106). Cut 5 BestJobs opens on S 91.2 (this cut's clock at 3.80 s).
// ONSETS (f): need 0 · to 8 · pinch 12 · myself 16 · because 21 · you 32 · know 36 · being 39 · the 46 ·
// head 50 · of 53 · Mercedes 56 · Motorsport 60 · is 74 · probably 79 · ends 91.
//
// ONE MOTION: Toto goes from his own team to the head of Mercedes, and the world opens out.
// GESTURES (gesture -> word -> frames)
//   f0: a fresh rest of the same world: Williams and Mercedes cream, no bars, Toto (amber, the only
//     amber) at HOME; the pair centred, tiles ~220 px; a slow creep already running, drifting toward
//     Mercedes -> "need to pinch myself because you know" -> f0-38
//   the light pool slides from Toto onto the Mercedes tile ("we want you to run this" was just said)
//     -> f0-38
//   Toto wakes (lifts one elevation in place) -> ahead of "being" (f39) -> f31-38
//   Toto rises up and over onto the Mercedes tile's top, its head: the vertical leads so he is at the
//     tile top's height before he reaches its corner; he lands f58-60 and settles by f62; the camera
//     leads him in (f31-61), centring Mercedes + Toto with the tile ~300 px -> "being the head of
//     Mercedes" (f39-60)
//   THE ONE CLICK: a LightSweep crosses the Mercedes tile under his landing -> "Mercedes" -> f55-67
//   one long C1 pull-out begins and carries across the join -> "is probably" (f74) -> f71 on
// Nothing else. (The industry row is in the world from f0, in the DARK: barely there.)
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_B.HeadOfMercedes;
export const S0 = S_B.HeadOfMercedes;

export const schema = z.object({
  /** a fractional offset on the story clock (join checks only) */
  sOffset: z.number().default(0),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const HeadOfMercedes: React.FC<Props> = ({ sOffset }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActBWorld S={S0 + frame + sOffset} />
    </AbsoluteFill>
  );
};

export default HeadOfMercedes;
