import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ActA, DUR_2, S_JOIN } from "./wolffActA";
import { FPS } from "./wolffShared";

// ---------------------------------------------------------------------------
// BackInTheDay — cut 2 of the Toto Wolff "Mercedes F1 financials" clip
// (Cheeky Pint S4E01). Cheeky Pint style: kraft, opaque, 1080x1920, 24 fps.
//
// THE LINE: "Back in the day it wasn't a billion and it wasn't 300 million. It
// was considerably less, because we're growing very strong, and the sport is
// still growing strong."
// WINDOW: edit 0:12.759 -> 20.480. DURATION = round((20.480 - 12.759) * 24) =
// round(185.3) = 185, + 16-frame tail = 201. Act A story clock S_A = 124 + f:
// f0 IS cut 1's last frame (S_A 124), pixel for pixel — both cuts render
// `ActA` from wolffActA.tsx; camera, sway and kraft drift all run on S_A.
//
// ONSETS (f): back 0 · in the 11 · day it 17 · wasn't 25 · a 31 · billion 33 ·
// and it 39 · wasn't 46 · 300 52 · million 58 · it was 75 · considerably 91 ·
// less 101 · because 109 · we're 114 · growing 119 · very 126 · strong 132 ·
// and 141 · the 146 · sport 155 · is 162 · still 166 · growing 170 · strong 176
// · speech ends 185.
//
// ONE SENTENCE OF MOTION: one trip through time — the bar rewinds to 2015
// shrinking, then replays forward growing and laying the history down behind
// it, and the camera lifts to find the sport's line still climbing above.
//
// GESTURES (gesture -> word -> frames). Revision 2 (director, Oct 2 2026): the
// rewind and the 2015 hold ride the bar close; the replay is one real
// pull-back; the ending frames the subject at k 0.95. Cut 1 untouched.
//   THE REWIND -> "back in the day it wasn't a billion and it wasn't 300
//   million" -> f2-90
//     the bar (slice and all) leaves the tile and slides LEFT along the axis
//       (year slots 84 apart), its height and slice following the filed data
//       backward through every year's value (monotone cubic, no overshoot):
//       still falling at "billion" (f33: between 2024 and 2023, 128 px), the
//       slice collapsing 2021 -> 2020 through "300 million" (f52-58) and gone
//       by 2015 (a loss year) -> f2-90
//     the axis draws leftward just ahead of it from the tile's top-left corner
//       (INK_LO, the one stroke) -> f3-90
//     "revenue", "30%", "profit" exit (reverse entrance) as it leaves; "$1B"
//       eases to INK_LO and stays at the dashed line's right end -> f2-14
//     the dashed $1B level (INK_LO) stays at the old height, reaching from
//       "$1B" to the bar, fading in as the bar drops away under it, always in
//       frame above the bar -> f3-90
//     the year readout rides under the bar, sliding up as it nears 2025 and
//       hard-ticking each slot it passes, 2025 ... 2015 -> f17-90
//     the camera rides the bar at k 2.2: it gets ahead of it as it leaves the
//       tile, keeps it right of centre (screen x 600-655, f28-72), then eases
//       off first so the bar coasts into the middle as it settles; the pan
//       never dips or reverses (three fitted glides, one direction) -> f0-90
//   CONSIDERABLY LESS -> "it was considerably less" -> f63-99
//     the camera creeps in to k 2.4 as the bar settles into 2015 (zero-sloped,
//       3.4 px, f90-98): 46 px, no slice, the long gap up to the dashed $1B
//       line filling the frame; "2015" stays as the chart's only year label
//       -> f63-90 creep, ~f90-100 the held breath (camera still)
//   THE REPLAY -> "less, because we're growing very strong" -> f99-162
//     the bar accelerates RIGHT, growing through the data; at every slot it
//       passes it leaves a bar standing — the deposit is its own footprint at
//       that instant, revealed as it moves on (2015 f99 ... 2025 f145.7);
//       each deposit eases INK_HI -> INK_LO over 12 f -> f99-154
//     one real pull-back while it races: k 2.4 -> 1.04 (zoom front-loaded
//       while the bar is slow, the follow-pan back-loaded to where k is low),
//       the staircase opening up behind it -> f97-160
//     the dashed line retracts with it and is used up as the bar's top meets
//       $1B, landing on the Mercedes tile at 160 px with its 48 px slice,
//       zero-sloped settle -> f154-162
//     "$1B" eases back to INK_HI -> f150-162, THE ONE CLICK: half-step
//       #FFD98A f154-156 on the landing
//     "revenue", "30%", "profit" slide up again (2 f apart) -> f158-174
//   THE SPORT -> "and the sport is still growing strong" -> f120-200
//     the camera lifts onto the sport and the now column and settles at k 0.95,
//       look shifted right; the oldest bars (2015-2016) and "2015" are let go
//       off the left edge -> f120-194
//     Formula 1 revenue draws left to right, head-led and fast (flat-topped
//       speed, <= 39 screen px/f), 2018 -> 2025, the F1 badge riding just
//       above its head (fades/slides in over 10 f) -> f142-172
//     the 2025 point keeps straining upward on a decaying creep (never past
//       2025, never dead still) -> "still growing strong" + tail -> f162-200
// Resolved frame (k 0.95): the bars 2017 ... 2025 + now on the axis (2015-2016
// and "2015" off the left edge), the tile under "now" with "$1B", "revenue",
// "30%", "profit", the sport's line above with the F1 badge at its still-
// creeping head. Nothing else.
//
// DATA (data.md, director-checked):
//   now = Toto's $1B / $300M (160 / 48 px).
//   Mercedes-Benz Grand Prix Ltd filings (Companies House), GBP M, at
//   px = GBP_M x 160 / 748.3 (The Race, 10 Jun 2026: GBP 748.3M = $1B), revenue
//   and operating profit: 2015 213.2 / loss (Autosport 4 Oct 2017), 2016
//   289.4 / 14.3 (Autosport), 2017 337.2 / ~15, 2018 338.4 / ~15
//   (Motorsport.com), 2019 ~346.9 interpolated / ~16 (ESPN, net), 2020 355.3 /
//   ~15, 2021 383.3 / ~70 (BlackBook), 2022 474.6 / 113.4 (PlanetF1), 2023
//   546.5 / 113.8 (PlanetF1 / Motorsport Week), 2024 636.0 / 160.6 (Crash.net
//   / BlackBook), 2025 633.4 / 166.7 (BlackBook / Sportico). Bars px: 45.6 61.9
//   72.1 72.4 74.2 76.0 82.0 101.5 116.8 136.0 135.4 | 160; slices 0 3.1 3.2
//   3.2 3.4 3.2 15.0 24.2 24.3 34.3 35.6 | 48. 2024 -> 2025 kept flat.
//   Formula 1 revenue, $B (Liberty Media; SEC exhibit 26 Feb 2026 for
//   2024/2025): 2018 1.83, 2019 2.02, 2020 1.15 (Covid), 2021 2.14, 2022
//   2.57, 2023 3.22, 2024 3.411, 2025 3.873 — same 160 px per $1B, same axis.
//
// MEASURED, revision 2 (off wolffActA's own tracks + the half-res preview):
// camJerk max |dv| 2.26 screen px/f^2 (f86), frame-corner points 2.36, fastest
// frame-corner point 42.8 px/f (f126, the pull-back); sport head <= 39.3 px/f,
// axis head 18.3, year readout 6.9; "$1B" is off-frame while the pull-back
// carries it fast (<= 23 px/f once in frame); the dashed level's dashes move
// <= 0.35 period/f (anchored to the bar end; world-anchored they aliased);
// lowest subject ink y 1229 (f32); resolved labels x 764-937 / y 899-1029,
// inside 120-960 / 300-1350, badge top y 446, "2015" and the 2015-2016 bars off
// the left edge as directed; quietest 12-f block f85-96 (mean 0.23) = the hold;
// join to cut 1: 0 px; cut 1's camera and tracks bit-identical to approved.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = DUR_2;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const BackInTheDay: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <ActA S={S_JOIN + frame} />
    </AbsoluteFill>
  );
};

export default BackInTheDay;
