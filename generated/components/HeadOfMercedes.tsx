import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS } from "./mercJobShared";
import { ActBWorld, DUR_B, S_B } from "./mercJobActB";

// ---------------------------------------------------------------------------
// HeadOfMercedes — cut 4 of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky Pint
// S4 style on the clip's one world (mercJobShared.tsx; Act B in mercJobActB.tsx; brief
// out/mercjob/briefs/BRIEF.md; out/mercjob/WORLD_9x16_READY.md). 1080x1920 (9:16), 24 fps, opaque.
//
// THE LINE: "need to pinch myself because you know, being the head of Mercedes Motorsport is probably"
// WINDOW: seq 58.76 -> 62.56, span 3.80 s. DURATION = round(3.80 x 24) = 91, + 16-frame tail = 107.
// STORY CLOCK (Act B): S = f (0 .. 106). Cut 5 BestJobs opens on S 91.2 (this cut's clock at 3.80 s).
// ONSETS (f): need 0 · to 8 · pinch 12 · myself 16 · because 21 · you 32 · know 36 · being 39 · the 46 ·
// head 50 · of 53 · Mercedes 56 · Motorsport 60 · is 74 · probably 79 · ends 91.
//
// ONE MOTION: Toto goes from his own team to the head of Mercedes, and the world opens out.
// GESTURES (gesture -> word -> frames)
//   f0: a fresh rest of the same world: Williams | Toto (amber, the only amber) | Mercedes, both tiles
//     cream, no bars; the pair centred in the column, tiles ~221 px; a slow creep already running,
//     drifting toward Mercedes -> "need to pinch myself because you know" -> f0-38
//   the light pool slides from Toto onto the Mercedes tile ("we want you to run this" was just said)
//     -> f0-38
//   Toto wakes (lifts one elevation in place) before the camera starts to lead (f26): his first visible
//     motion is the lift -> ahead of "being" (f39) -> f24-31
//   Toto rises up and over onto the Mercedes tile's top, its head: the vertical leads so he is at the
//     tile top's height before he reaches its corner; he lands f58-60 and settles by f62; the camera
//     leads him (pan f26-62, push f32-54) into ONE centred subject, the tile ~345 px; Williams leaves the
//     frame edge decisively (3 frames under 40 % visible) -> "being the head of Mercedes" (f39-60)
//   THE ONE CLICK: a LightSweep crosses the Mercedes tile under his landing -> "Mercedes" -> f55-67
//   a held breath creeping in -> f54-74
//   one long C1 pull-out begins (out and down, toward the formation) and carries across the join ->
//     "is probably" (f74) -> f74 on
// Nothing else. (The formation's other teams are not drawn in this cut.)
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
