import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// ChinaGrowing -- Logan Wright, "China's growth is going negative" (ChinaTalk),
// cut 1 of 4. Builder A. One continuous motion: the line is drawn in high on
// the left and starts its slide down and to the right, toward a forecast band
// that opens ahead of it in the year it is heading into.
//
// LINE: "We had China growing 10, 7, 8 percent. Things were looking great. And
// now we're in a world where -- what's our latest Rhodium forecast? Like
// somewhere in the one to three? At the start of the year, we expected growth
// in the range of one to 2.5 percent."
//
// IN-POINT 0:00.000 (edit frame 0). S WINDOW S 0-368.
// DURATION: speech S 0-353 ("percent." ends S 346.1; the next cut's first word
// lands at S 353.3) + a 16-frame tail = 369 f. Adjacent to NegativeGrowth: this
// cut's last 16 frames (S 353-368) are its first 16 (the editor stacks it above),
// so the camera is already moving into cut 2's first glide here.
//
// The whole picture is <ChinaGrowthWorld S={S0 + frame} /> (chinaGrowthWorld.tsx);
// everything below lives in chinaGrowthShared.tsx (BASE, PASS, WAYS_A) and
// chinaGrowthGeom.ts (the line and tipAt). GESTURES -> the word -> S frames:
//   1. the time axis draws head-led at INK_HI with its white head (the subject
//      of the first second), racing in from x 100 (past x 900 by S 24), easing
//      to INK_LO as the numbers take over, then ~450 px ahead of the tip,
//      resting at x 1680 -> "We had" (time running) -> S 0-330, rung S 44-56
//   2. the orange line draws up to P10: the draw IS the growing -> "growing"
//      (S 18.2) -> S 0-29 (frame 0 already moving: a stub + its tip)
//   3. camera, already moving on frame 0: the establishing framing (k 0.96,
//      the line entering ~143 px in, the axis at screen y ~1298) is the start
//      of ONE slow, even push -> "We had China growing" -> S 0 on (pre-roll)
//   4. P10's dot scales in as the tip passes; "10%" slides up above it ->
//      "10," (S 28.3) -> dot S 29-37, label S 20-32
//   5. the tip falls to P7Z; its dot; "7%" slides up below it; "10%" eases to
//      INK_LO -> "7," (S 46.6) -> tip S 29-47, label S 38.6-50.6, rung S 46.6-58.6
//   6. the tip climbs to P8; its dot; "8%" slides up above it; "7%" to INK_LO ->
//      "8" (S 61.4) -> tip S 47-62, label S 53.4-65.4, rung S 61.4-73.4
//   7. ... the same even push lands on the zigzag (k 1.5, centred on it; the
//      axis leaves the bottom) as "8" settles -> "10, 7, 8 percent" -> lands
//      S ~59
//   8. the tip rides the gentle hump; the camera follows right along it at
//      k 1.5 -> "Things were looking great" -> tip S 62-110, camera S 50-112
//   9. the slide begins at the shoulder (a roll-over, no kink); "8%" eases to
//      INK_LO -> "now" (S 110.4) -> S 110 on, rung S 110.4-122.4
//  10. camera travels down the slide toward 2026, breathing out to k ~1.29
//      mid-travel (the axis back in at the bottom) -> "And now we're in a world
//      where" -> S 96-190
//  11. camera pushes back in to k 1.4 on the year ahead, centred between the
//      tip and the band label (tip >= 230 px from the left, FORECAST >= 76 px
//      inside the right edge) -> "what's our latest Rhodium forecast?" ->
//      S 176-232
//  12. one thin white line draws across 2026 at 2.0 % (head-led, INK_HI) and
//      FORECAST slides up above it at INK_HI (the subject) -> "forecast?"
//      (S 192.0) -> line S 180-198, label S 184-196
//  13. the line opens into the band (top 3 %, bottom 1 %, tint 0 -> 0.10);
//      "1-3%" slides up under FORECAST; FORECAST rides into the stack centred in
//      the band and eases to INK_LO as the range lands -> "one to three?"
//      (S 237.1) -> band S 226-242, label S 229-241, FORECAST rung S 237-249
//  14. camera tracks the tip's midpoint with the band label down-right at
//      k ~1.39, then creeps onto the handoff framing (blended exactly onto the
//      approved cut 2 camera by S 353) -> "At the start of the year ... the
//      range of" -> S 196-353
//  15. the band narrows: the top edge 3 -> 2.5 %; "3%" crossfades to "2.5%"
//      in place ("1-" stays put); the stack rides down to stay centred ->
//      "one to 2.5 percent" ("2" S 321.6, ".5" S 326.4) -> narrow S 318-338,
//      crossfade S 322-330
//  16. the tip reaches 2.6 %, just above the band's top-left corner, heading in
//      -> the end of "the start of the year" -> S 353; the tail carries cut 2's
//      first glide (follow down) -> S 330-368
// No click in this cut. Every label slides up 24 screen px + fades over 12 f.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 0;
export const DURATION = 369;
if (CUTS.ChinaGrowing.S0 !== S0 || CUTS.ChinaGrowing.DURATION !== DURATION) {
  throw new Error("ChinaGrowing: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock: S = S0 + frame. */
const ChinaGrowing: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} />;
};

export default ChinaGrowing;
