import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CUTS } from "./chinaGrowthGeom";
import { ChinaGrowthWorld } from "./chinaGrowthWorld";

// ---------------------------------------------------------------------------
// CovidExcuse -- Logan Wright, "China's growth is going negative", cut 3 of 4.
// (Header: builder B. Wrapper: builder A. The layer + camera live in
// chinaGrowthSeg3.tsx; everything is a function of the story clock S.)
//
// LINE: "And we had this excuse, sort of, of COVID, that things were going to
// come back. And it's the fall of 2026, and they haven't."
// IN-POINT: 0:30.917 (edit frame 742). S WINDOW: S 601-829.
// DURATION: speech S 601 ("And" 601.6) - 814 (edit frame 955) + a 16-frame
// tail = 229 f. Frame 0 (S 601) is NegativeGrowth's last frame pixel for pixel;
// frame 228 (S 829) is TrulyDramatic's frame 0 (camSeg3(829) === JOIN_34).
//
// ONE MOTION: we travel back along the line to Covid; a white dashed promise
// rises out of that moment to where growth used to ride and races forward over
// the real line to the fall of 2026, where the orange tip is still below zero;
// then the promise falls apart and takes the excuse with it.
//
// GESTURES (word -> S frames). White ink at INK_HI unless noted.
//  1. "And we had this excuse,   The camera glides BACK up the line to the Covid
//     sort of, of" 601-677      moment: look (1437, 2062) k 1.37 -> (965, 1700)
//                               k 1.20, S 602-664 (warp 0.8), settled ~S 668, then
//                               a hold-drift that continues the pull up and out
//                               (S 648-712, k -> 1.165). (A's Q2/Q3, INVESTMENT
//                               and band label exit under it, S 604-622.)
//  2. "COVID" 676.9             A ring sweeps round COVID_PT from 12 o'clock,
//                               S 666-678. As the sweep passes 6 o'clock (S 670.6)
//                               a dashed drop-line falls head-led from the ring to
//                               the axis, S 670.6-691.6 (peak 41 screen px/f).
//                               "COVID" slides up just below the axis, landing
//                               S 686; the axis tick scales in where the drop
//                               lands, S 691.6-699.6.
//  3. "that things were going to The promise: a dashed white line, head-led, born
//     come back" 689-722        on the ring at S 692, rises to 7.9 % (the
//                               shoulder's level: where growth used to ride) by
//                               x 1080 at S 716 ("back" 714.8). The camera rises
//                               and widens with it (S 694-795, warp 0.8 -> look
//                               (1230, 1680) k 1.03). The excuse is context once
//                               the promise has come back: ring, drop-line, tick
//                               and "COVID" ease to INK_LO, S 718-730.
//  4. "And it's the fall of      The promise races flat over the real line and
//     2026" 726.8-775.8         decelerates onto FALL_X at S 752 ("fall" 748.9).
//                               THE CLICK: the FALL 2026 tick falls onto the axis
//                               straight below the head and stops there, S 752-758,
//                               as the head fades (S 752-760); "FALL 2026" slides
//                               up just above the axis, landing S 761 ("2026"
//                               760.9). The frame holds the promise at the top, the
//                               band, FALL 2026 and the orange tip below zero on one
//                               vertical, with life: marching dashes and the
//                               camera's decaying drift (3 -> 1 px/f) to S 790.
//  5. "and they haven't."        The promise dissolves from its head back to the
//     794.5-807.5               ring, S 794-808: each dash sinks 10 world px and
//                               fades over 8 f. The excuse goes with it as the
//                               wave reaches the ring: "COVID" exits S 805-815,
//                               the ring sinks + fades S 806-814, the drop-line
//                               top to bottom S 807-819, the tick S 808-816.
//                               The camera eases down and in to the tip and
//                               FALL 2026, S 790-821 (warp 0.9), landing EXACTLY
//                               on JOIN_34 at S 829 (a blend over S 809-829
//                               absorbs the follower's last 0.5 / 0.7 px).
//  6. tail 814-829              The camera settles; FALL 2026 stays INK_HI. It
//                               eases to INK_LO at S 840-852 (inside cut 4) and
//                               stays on the axis to S 1087.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const S0 = 601;
export const DURATION = 229;
if (CUTS.CovidExcuse.S0 !== S0 || CUTS.CovidExcuse.DURATION !== DURATION) {
  throw new Error("CovidExcuse: S0 / DURATION disagree with CUTS");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** A window on the story clock: S = S0 + frame. */
const CovidExcuse: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return <ChinaGrowthWorld S={S0 + frame} />;
};

export default CovidExcuse;
