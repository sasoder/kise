import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActAStout, DUR_2, S_JOIN } from "./stoutActA";

// ---------------------------------------------------------------------------
// BackInTheDayStout — cut 2 of the Toto Wolff "Mercedes F1 financials" clip in
// the STOUT system (stoutShared.tsx; brief out/wolff/briefs/STOUT_MOTION.md),
// with the V3 numbers (the filed accounts). 1080x1920, 24 fps, opaque. The
// delivered BackInTheDay / V2 / V3 stay as they were.
//
// THE LINE: "Back in the day it wasn't a billion and it wasn't 300 million. It
// was considerably less, because we're growing very strong, and the sport is
// still growing strong."
// WINDOW: edit 0:12.759 -> 20.480. DURATION = round((20.480 - 12.759) * 24) =
// 185, + 16-frame tail = 201. S_A = 124 + f: f0 IS BillionInRevenueStout's last
// frame, pixel for pixel (one world, one clock: camera, pool, sway, grain).
//
// ONSETS (f): back 0 · in the 11 · day it 17 · wasn't 25 · a 31 · billion 33 ·
// and it 39 · wasn't 46 · 300 52 · million 58 · it was 75 · considerably 91 ·
// less 101 · because 109 · we're 114 · growing 119 · very 126 · strong 132 ·
// and 141 · the 146 · sport 155 · is 162 · still 166 · growing 170 · strong 176
// · speech ends 185.
//
// ONE SENTENCE OF MOTION: one there-and-back look — the camera looks back along
// the time axis, the real bars rising as its look reaches each year, and turns
// at the small 2015 bar to pull back to the whole climb, $326M to $1B.
//
// GESTURES (gesture -> word -> frames):
//   REVENUE, "30%", PROFIT leave by the reverse entrance; the HERO "$1B" dims
//     by tone (cream -> creamLo) as the camera leaves it -> "back in the day it
//     wasn't a billion" -> f2-14 (the dimmed "$1B" stays until the frame has
//     left it)
//   the camera eases back (k 3.25 -> 2.4) and glides LEFT into the past, its
//     pan monotone (three fitted glides); the time axis draws leftward from the
//     now tile's top-left corner and keeps just ahead of the frame -> "back in
//     the day ... 300 million" -> f0-96
//   each year's cream bar rises from the axis with its amber slice as the
//     camera's look reaches it (2025 f18.5 ... 2021 f41.5, 2020 f46.5, 2019
//     f52.5 ... 2015 f75.5; 16 f per rise, under the 45 px/f cap), so the
//     slices thin to slivers through "300 million"; its figure (LABEL,
//     creamLo) blurs in behind it and lands with it; 2015 / 2020 / 2025 under
//     the axis; the light pool follows the newest year with the camera's lag
//   the camera decelerates onto 2015 and creeps in to c2_hold's framing (k 3.0),
//     then is still ~f100-106 -> "it was considerably less" -> f74-106
//   "$326M" (SECONDARY, cream) blurs in above-left of the small 2015 bar and
//     lands with it, f91.5 -> "considerably" (f91); no click in this cut (the
//     director's call: a cream-on-cream sweep that barely shows is worse than
//     none)
//   the camera turns and glides back RIGHT while pulling back (k 3.0 -> 1.375)
//     onto c2_end's framing; the whole staircase opens up from $326M to the $1B
//     pillar; "$326M" eases from SECONDARY to LABEL about the bar's top-right
//     corner with the camera's progress; the now pillar's figures blur in once
//     the whole pillar is inside the frame (f161) — "$1B" (LABEL, cream) over
//     its bar (lands f173), "30%" (LABEL, dark) on its slice (lands on
//     "strong", f176) -> "because we're growing very strong, and the sport is
//     still growing strong" -> f106-~176, then the damper's settle
// Resting frames: c2_hold (f~100-106) and c2_end (tail) of out/wolff/stout/frames.
//
// DATA (data.md "Cut 2 V3", read by the director from the Mercedes-Benz Grand
// Prix Ltd filings; USD at the Federal Reserve G.5A yearly rates; slices =
// filed operating profit; 2015 an operating loss): V3_DATA in BackInTheDayV3,
// labels "$326M", 392, 435, 452, 464, 456, 528, 587, 680, 808, 836; act A's
// 160 px / $B; the history bars snapped to whole screen px at c2_end's k.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = DUR_2;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BackInTheDayStout: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActAStout S={S_JOIN + frame} />
    </AbsoluteFill>
  );
};

export default BackInTheDayStout;
