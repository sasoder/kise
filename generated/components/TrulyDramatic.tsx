import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// TrulyDramatic -- Logan Wright, "China's growth is going negative", cut 4 of 4.
// Builder C owns this header; the layer and camera are in chinaGrowthSeg4.tsx.
//
// LINE: "But, you know, going from seven to maybe one and a half is like a truly
// dramatic thing for the Chinese and global economy."
// IN-POINT: 0:48.292 (edit frame 1159). S WINDOW: S 829-1087 (S = 829 + frame).
// DURATION: the speech runs S 829-1072.6 ("economy." ends, edit frame 1402),
// then the 16-frame tail: 259 frames, S 829-1087 inclusive. Frame 0 is cut 3's
// last frame (camSeg4(829) === JOIN_34; still-vs-still difference 0 px).
//
// ONE MOTION: the camera rises to the stretch of the line where it fell from 7 %
// to 1.5 %, measures the fall (ring, level line, bracket, ring), fills the gap,
// and pulls all the way back to the whole arc while a highlight runs the line.
//
// GESTURES (S frames; the word each serves):
//  1. S 829-864  "But, you know, going from"  One glide up and left from the dip to
//                the slide (look -> (1145, 1590), k 1.30 -> 1.40), settling ~S 868,
//                5 f before "seven"; its hold-drift (S 850-900) carries on in the
//                same direction and decays.
//  2. S 865-877  "seven" (873.4)  A white ring sweeps round P7S on the line
//                (12 f, arriveEase: cut 3's ring), and "7%" slides up beside it
//                above the 7 % level, landing on the word.
//  3. S 880-908  "to maybe" (889.7)  The dashed 7 % level line leaves the ring and
//                runs, head-led and marching, to BRACKET_X: seven carried forward.
//  4. S 870-998  "to maybe one and a half is like a truly dramatic"
//                ONE long even creep in on the gap (k 1.40 -> 1.60, trapezoid:
//                ~2 screen px/f at the frame corners at its peak), decaying to
//                the held breath (S 988-994) before the release.
//  5. S 904-930  "maybe one and a half"  From the level line's end the bracket
//                draws DOWN to 1.5 %, tracing the fall (top cap S 904-910, bottom
//                cap as it lands).
//  6. S 913-925  "one" (916.1)  A white ring sweeps round P15 on the line.
//  7. S 920-930  "and a half"  A short dashed connector reaches from P15's ring to
//                the bracket's foot, arriving with the bracket.
//  8. S 921-933  "half" (927.6)  "1.5%" slides up beside the bracket's foot as the
//                bracket lands (key: the landing, S 929).
//  9. S 958-988  "truly dramatic" (972.7)  THE CLICK: the gap the line fell through
//                fills. The wedge closed by the level line, the bracket, the
//                connector and the orange line itself (every edge inset by half its
//                stroke + 2 screen px, the two ring discs cut out) takes a white
//                hatch at INK_LO, revealed by ONE horizontal front descending from
//                7 % to 1.5 % (mid-span on "dramatic"); as it lands the level line
//                and the connector recede to INK_LO (S 984-996).
// 10. S 994-1046 "thing for the Chinese and global" (1025.5)  The camera pulls all
//                the way back to the whole chart (k 1.60 -> 0.581, landing ~S 1051),
//                early enough that the line's start is in frame by S 1045: the arc
//                from 10 % to below zero, the band, the hatch, the wedge, FALL 2026.
// 11. S 1045-1080 "global economy." (1045.2)  A highlight (a HIGHLIGHT core easing
//                to ACCENT at both ends, 140 world px) starts on the first frame the
//                line's start is >= 60 px inside the frame, slides onto LINE0 as it
//                fades in, runs the orange line to the tip (governed under 44 px/f),
//                lights each vertex dot as it passes, lands on the tip at S 1080 and
//                has faded by S 1086.
// 12. S 1048-1104 tail (to S 1087)  A slow push back in (k 0.581 -> 0.601 on the
//                last frame, ~1.7 px/f at the corners): the whole chart, uncropped,
//                content centre y 835, still moving.
// Base world in this window (A/B, not mine): "7%"/"8%" of the zigzag exit S 836-848
// off-frame; FALL 2026 eases to INK_LO S 840-852; the tip creeps on.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 829;
export const DURATION = 259;
if (CUTS.TrulyDramatic.S0 !== S0 || CUTS.TrulyDramatic.DURATION !== DURATION) {
  throw new Error("TrulyDramatic: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock: S = S0 + frame. */
const TrulyDramatic: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} />;
};

export default TrulyDramatic;
