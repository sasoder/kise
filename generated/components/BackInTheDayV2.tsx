import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { DUR_2 } from "./wolffActA";
import { ActA2 } from "./wolffActA2";
import { FPS } from "./wolffShared";

// ---------------------------------------------------------------------------
// BackInTheDayV2 — cut 2, version 2, of the Toto Wolff "Mercedes F1
// financials" clip (Cheeky Pint S4E01). Cheeky Pint style: kraft, opaque,
// 1080x1920, 24 fps. The user on V1 (Oct 2 2026): "the idea is good, but when
// the bar slides back like that it's a bit sloppy … show the real numbers to
// the left and adjust the bar chart accordingly … the graph with the F1 box
// isn't necessary … go to the left and then before the end go back to the
// right and try to capture the scale in a good way." V1 stays as delivered.
//
// THE LINE: "Back in the day it wasn't a billion and it wasn't 300 million. It
// was considerably less, because we're growing very strong, and the sport is
// still growing strong."
// WINDOW: edit 0:12.759 -> 20.480. DURATION = round((20.480 - 12.759) * 24) =
// 185, + 16-frame tail = 201 (as V1). Story clock S_A = 124 + f: f0 IS cut 1's
// last frame (BillionInRevenue f124), pixel for pixel — the camera is Act A's
// track (cut 1's glides unchanged, asserted in wolffActA2), sway and the kraft
// drift run on S_A, and "now" is NowColumn exactly as cut 1 resolved it.
//
// ONSETS (f): back 0 · in the 11 · day it 17 · wasn't 25 · a 31 · billion 33 ·
// and it 39 · wasn't 46 · 300 52 · million 58 · it was 75 · considerably 91 ·
// less 101 · because 109 · we're 114 · growing 119 · very 126 · strong 132 ·
// and 141 · the 146 · sport 155 · is 162 · still 166 · growing 170 · strong 176
// · speech ends 185.
//
// ONE SENTENCE OF MOTION: one there-and-back look — the camera looks back
// along the time axis, the real bars rising as its look reaches each year, and
// turns at the small 2015 bar to pull back to the whole growth, $326M to $1B.
//
// GESTURES (gesture -> word -> frames):
//   the time axis draws leftward from the Mercedes tile's top-left corner and
//     then stays just ahead of the frame's left edge (INK_LO, the one stroke)
//     -> "back in the day" -> f1-~75 (ends at the chart's start, before 2015)
//   the camera eases back a little (k 2.14 -> 1.6) and glides LEFT into the
//     past, its pan monotone (three fitted glides) -> "back in the day it
//     wasn't a billion and it wasn't 300 million" -> f0-~96
//   each year's white bar rises from the axis (12 f, its amber profit slice
//     with it) as the camera's look reaches it — 2025 f15, 2024 f26, 2023 f33,
//     2022 f39, 2021 f44, 2020 f49, 2019 f54, 2018 f59, 2017 f64, 2016 f70,
//     2015 f75 — so the slices are thinning to slivers through "300 million"
//     (2020-2019 rising f49-66); its figure (INK_LO) slides up 3 f behind it;
//     years 2015 / 2020 / 2025 slide up under the axis with their bars
//   the camera decelerates onto 2015 and creeps in (k 1.6 -> 1.8), then is
//     still ~f99-106: the small $326M bar with no profit -> "it was
//     considerably less" -> f74-106
//   "$326M" (INK_HI, the start callout) slides up above-left of the first bar
//     and lands f90 — THE ONE CLICK, half-step #FFD98A f90-92 -> "considerably"
//     (f91)
//   the camera turns and glides back RIGHT while pulling back (k 1.8 -> 1.0)
//     so the whole staircase opens up from $326M to the $1B column; no new
//     elements, the motion is the camera -> "because we're growing very strong,
//     and the sport is still growing strong" -> f106-~176, then the decaying
//     drift
// Resolved frame (k 1.0): eleven bars 2015 ... 2025 + the now column, "$326M"
// and the figures above the bars, 2015 / 2020 / 2025 under the axis, "$1B /
// revenue / 30% / profit" as cut 1. Nothing else (no F1 line, no badge).
//
// DATA (data.md "Cut 2 V2", director-checked): filed GBP at each year's
// average USD/GBP rate (2015-2020 fxrates.com ECB averages; 2021-2025 IRS
// averages); 2019 turnover GBP 363.6M (Motorsport Week, 5 Sep 2020).
//   year  $rev  bar px  slice px      year  $rev  bar px  slice px
//   2015  326    52.1    0 (loss)     2021  527    84.4   15.1
//   2016  392    62.7    3.1          2022  585    93.6   22.4
//   2017  434    69.5    2.5 (~net)   2023  680   108.8   22.6
//   2018  452    72.3    2.7 (~net)   2024  812   130.0   32.8
//   2019  464    74.2    3.0 (~net)   2025  835   133.5   35.1
//   2020  456    73.0    2.8 (~net)   now  $1B   160.0   48.0 (Toto)
//   px = USD $B x 160 (PX_PER_B).
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_2;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BackInTheDayV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActA2 f={frame} />
    </AbsoluteFill>
  );
};

export default BackInTheDayV2;
