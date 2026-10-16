import React from "react";
import { useCurrentFrame } from "remotion";
import { BEAD_HALL, DURATION as CUT_DURATION, DripFeedScene, defaultProps, schema, type Prelude, type Props } from "./DripFeed";
import { ROUTE_VINLAND, pchip, smoothstep } from "./vikAtlanticShared";

// ---------------------------------------------------------------------------
// DripFeedLong: cut E of "Sheppard_Vikings" (Dwarkesh with Si Sheppard),
// extended BACKWARDS by 100 frames: 47_DripFeed.mov. Dwarkesh map style on the
// North Atlantic world (vikAtlanticShared). Opaque, 1080x1920, 24 fps. No
// labels, no numbers.
//
// THE LINE: "(If the Vikings had been able to claim) a long-term presence in
// the new world, they may have been able to drip feed European technology,
// European beasts of burden, and above all, European diseases slowly into the
// Americas."
// In 47.005 s, out 57.516 s of the sequence = 252 frames + 2 tail frames
// holding the last state: DURATION 254 = a 100-frame PRELUDE + DripFeed's 154.
//
// From f100 on this IS DripFeed (51_DripFeed.mov), frame for frame: the same
// scene component on its own clock (DripFeed frame = this frame - 100), so its
// words land 100 frames later than in its header ("drip" f97, "feed" f104,
// "technology" f123-136, "beasts" f149, "diseases" f197-211, "slowly" f211,
// "into" f231, "the Americas" f241). The prelude is the same scene at negative
// DripFeed frames: its camera's first key extends back on its own slope, so
// the opening creep runs straight into DripFeed's (k 1.660 at f0 -> 1.740 at
// f100, value and velocity continuous; the stage level is sharp throughout).
//
// THE MECHANISM OF THE PRELUDE: what cut D left dead comes alive and STAYS
// alive. ORANGE = WHAT IS PASSED ON; all geography cream. One continuous
// motion, three states, nothing else:
//   f0     opening state = cut D's END state at this wider scale: the route is
//          only the faint cream dashed trace, the longhouse at L'Anse aux
//          Meadows a low-rung cream ghost (0.42). No orange on the foothold, no
//          people. (Greenland's settlement, top right corner, is still alight,
//          as D leaves it.) The camera is already creeping in.
//   f3-28  "a (7) long-term (11-23) presence (23-32)": the route redraws in
//          solid orange (DripFeed's 5.2 px line and casing) down the trace from
//          Greenland: it leaves the settlement in the corner f3, comes back in
//          at the top of the frame f9 and runs down the Labrador coast, its
//          head easing in to the hall at f26-28. The dashed trace is what is
//          left ahead of the head.
//   f23-35 the hall takes the orange as the head reaches it: one eased
//          crossfade cream ghost -> orange, fully alight at f35.
//   f35-100 "in the new world (32-52), they (55) may have been able to
//          (67-97)": it stays, and the line is live. DripFeed's tiny plain
//          beads (same size, same fall law) come down it and vanish into the
//          hall at f42, f59, f76, f93: one every 17 frames, which is DripFeed's
//          own rhythm (its next bead lands f109, its axe passes the hall f127,
//          then bead, horse, bead, pox 17-18 frames apart). By "drip" (f97)
//          dripping is the established rhythm and the axe drop, which comes in
//          over the top of the frame from f78, is simply the next thing down
//          the line. Nothing rides the line ahead of the redrawing head.
//   f100-254 DripFeed, unchanged (see its header for the gestures).
//
// SOURCES: as DripFeed (CLIP_SPEC.md "Verified facts"). The line is a
// counterfactual ("if ... they may have been able to").
// ---------------------------------------------------------------------------
export const FPS = 24;
export const PRELUDE = 100;
export const DURATION = PRELUDE + CUT_DURATION; // 254
export { defaultProps, schema };

const R = ROUTE_VINLAND;
// the head of the redrawn line (world px along the route from Greenland) by frame: out of the corner, over
// the top (off frame s ~160 .. 545, quickly), then down the visible coast and easing in to the landing
const HEAD_S = pchip(
  [
    [3, 0],
    [6.5, 160],
    [9, 545],
    [18, 870],
    [27.5, R.len],
  ],
  true,
);
const F_HEAD_IN = 27.5;
const F_HALL = 23; // the head is at the hall's near end
const HALL_FADE = 12;
// the frames (this piece's clock) at which the prelude's beads reach the hall
const PRELUDE_BEADS = [42, 59, 76, 93];
const BEADS = [...PRELUDE_BEADS.map((f) => f - PRELUDE), ...BEAD_HALL];

const preludeAt = (f: number): Prelude | undefined => {
  if (f >= PRELUDE) return undefined;
  return {
    headS: f <= 3 ? 0 : f >= F_HEAD_IN ? R.len : HEAD_S(f),
    nib: 1 - smoothstep((f - F_HEAD_IN + 2) / 6),
    hallLit: smoothstep((f - F_HALL) / HALL_FADE),
  };
};

const DripFeedLong: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  return <DripFeedScene {...props} frame={frame - PRELUDE} beadHall={BEADS} prelude={preludeAt(frame)} />;
};

export default DripFeedLong;
