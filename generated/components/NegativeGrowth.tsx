import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// NegativeGrowth -- Logan Wright, "China's growth is going negative" (ChinaTalk),
// cut 2 of 4. Builder A. It picks up the picture ChinaGrowing left standing. One
// continuous motion: the line goes through the band and out of its bottom, slows
// as it nears zero, presses on it, breaks through, and sinks under the weight of
// contracting investment.
//
// LINE: "We would argue we're trending well below that at this stage, and we're
// likely seeing negative growth in Q2 and Q3 because investment in China is
// contracting."
//
// IN-POINT 0:14.708 (edit frame 353). S WINDOW S 353-601.
// DURATION: speech S 353-586 (edit frames 353 -> 586) + a 16-frame tail = 249 f.
// Adjacent to ChinaGrowing: its first 16 frames are ChinaGrowing's last 16 (cut 1
// f353 == this cut's f0, 0 px). The base world's lifecycles after S 601 (exits,
// "7%"/"8%" at S 836-848, the creep) are WORLD.md's, in chinaGrowthShared.tsx.
//
// GESTURES -> the word -> S frames (camera = camA in chinaGrowthShared.tsx):
//   1. the tip enters the band through its top edge and crosses it; the camera
//      follows down (k -> 1.42) -> "We would argue we're trending" -> tip
//      S 356-398, camera S 330-400
//   2. the descent steepens; the tip leaves through the band's bottom edge ->
//      "well below that" -> S 380-398
//   3. the forecast is left behind: band edges + range ease to INK_LO -> "that
//      at this stage" -> S 404-416
//   4. camera: ONE long, even creep toward the crossing point (look (1272,
//      yOf(0.4)), k 1.65), decelerating into the held breath -> "at this stage.
//      And we're likely seeing" -> S 392-452
//   5. the axis becomes zero: it brightens INK_LO -> INK_HI as a wave spreading
//      outward from under the tip; "0%" slides up below it, left of the band ->
//      "And we're likely" -> wave S 426-446 (on screen), label lands S 440
//   6. the tip decelerates and PRESSES on zero; the axis dents under the dot,
//      following its press (<= 10 px, a raised-cosine bump 140 px wide); the
//      camera almost still -> "seeing" -> S ~446-463
//   7. THE CLICK: the tip breaks through; the dent lets go (ease-out, no
//      overshoot); the tip plunges; the ACCENT_DEEP hatch spreads with it between
//      the axis and the line; the camera follows ~2 f late, easing out ->
//      "negative" (S 461.3) -> break S 461-463, dent S 463-472, plunge S 461-480,
//      camera S 461-494
//   8. Q2's tick scales in as the tip passes Q2_X and "Q2" slides up above the
//      axis -> "Q2" (S 483.8) -> S 475.4-487; then Q3 the same -> "Q3" (S 499.2)
//      -> S 491-503
//   9. the floor: one continuous decline, the tip slowing along it -> "and Q3"
//      -> S 480-556
//  10. camera reframes down to hold the band's top edge to the INVESTMENT label,
//      continuing the plunge-follow's direction -> "because investment in
//      China" -> S 494-550
//  11. "INVESTMENT" and its white bar slide up together under the dip; the axis
//      and "0%" ease back to INK_LO; Q2/Q3 to INK_LO -> "investment" (lands
//      S 528) -> S 520-532, axis S 520-540, Q S 530-542
//  12. the bar contracts 200 -> 70 and, on the SAME eased curve (sinkE), the tip
//      sinks down the floor to (1490, -1.42 %): the contraction is the pull ->
//      "contracting." -> S 556-586
//  13. tail: the camera's drift continues (right, out) and decays; the tip
//      creeps -> S 586-601
// One click: the break-through on "negative". Every label slides up 24 screen px
// + fades over 12 f; ticks and dots scale in over 8 f.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 353;
export const DURATION = 249;
if (CUTS.NegativeGrowth.S0 !== S0 || CUTS.NegativeGrowth.DURATION !== DURATION) {
  throw new Error("NegativeGrowth: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock: S = S0 + frame. */
const NegativeGrowth: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} />;
};

export default NegativeGrowth;
