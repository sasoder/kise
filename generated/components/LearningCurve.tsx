import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  camMove,
  clamp,
  sway,
  worldTransform,
} from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const FPS = 24;
// Clip "joel - jeff dean is betting on solar for ai", SRT cues 48-71. The
// composition starts at 11.599 s; speech ends at 16.539 s.
// round((16.539 - 11.599) * 24) = 119 frames of speech, plus a 16 frame tail so
// the resolved chart holds = 135.
export const DURATION = 135;

// ---------------------------------------------------------------------------
// "LEARNING CURVE". The sister of `SolarFoundation`, cut from the same clip and
// built from the same parts: the same paper, the same 40 px panel cell, the same
// +4/+4 hard shadow drawn as an SVG copy of the shape, the same Barlow, the same
// `runCamera2` on a keyed k AND a keyed content centre.
//
// THE LINE: "It's the fastest thing you can deploy, it can match the speed of
// AI. It's on this learning curve that's getting cheaper and cheaper."
//
// THE PICTURE. One chart on one rule, and the rule is the axis of the whole
// argument. ABOVE it, DEPLOYMENT DOUBLES: five columns of the sister cut's own
// panel cells, 1 / 2 / 4 / 8 / 16 cells tall, threaded by a chain-colour line —
// the line is AI, the columns are solar. BELOW it, COST: five solid white bars
// hanging down, each exactly 20% shorter than the last (100 / 80 / 64 / 51.2 /
// 40.96), with the learning curve drawn along their ends. The next sentence in
// the clip is "20% decline in cost every doubling of deployment", so the ratios
// are exact and every number below is exported: a later cut picks this resolved
// picture up and annotates it.
//
// v2, on the director's review: BOTH CURVES NOW RUN ON CORNERS, not through the
// middle of things.
//   * THE AI LINE IS ON THE TOP-LEFT CORNERS. Through the top-CENTRES it ran
//     over every column's left half — the white core was lost on the white cells
//     and its black shadow slashed them. g(x) = 48 * 2^((x - 92) / 190) - 8 is
//     the same exponential shifted 68 px left, and it is convex and rising, so
//     every column now sits WHOLLY under the line and touches it at exactly one
//     point: its own top-left corner. That touch is "match".
//   * THE LEARNING CURVE IS ON THE BOTTOM-RIGHT CORNERS + 14 px, drawn IN FRONT
//     of the bars, with no lead-in from the rule. Mirror logic: it rises, so
//     under every bar it is lower than that bar's end and it never touches one.
//     The wedge the old lead-in poked out left of bar 1, and the draw-behind
//     trick that was holding it together, are both gone.
//
// THE COLOUR JOBS, raw hex, no blend, no glow, no gradient, and nothing ever
// fades — a layer exists or it does not:
//   white #FFFFFF   solar, and solar's money. It is the ink on this paper.
//   orange #FFB765 / purple #BC37FF / blue #0046FF — the CORE MEMORY chain, and
//   in this cut it has ONE job: it is AI. It is on the deployment line and on
//   nothing else. Not on a column, not on a bar, not on a label, not on a rule.
//
// THE MATERIAL IS PAPER, copied from `SolarFoundation` down to the number:
// `public/paper-supaclean-still.png`, 3864 x 2164 landscape, on its own plane at
// parallax 0.15 in both axes with the same -0.3 px/frame drift and the same
// 1 + (k - 1) * 0.3 scale, knocked back with `brightness(0.88) blur(3px)` on the
// image and nothing else, over a #C0C0C0 root. The squares show through the 8 px
// gaps between the cells, which is what makes a white block read as a solar
// panel rather than a white block.
//   A LOCAL BG_OVERSIZE OF 1.6. `objectFit: cover` solves 3864 x 2164 into
//   3072 x 1728 at 0.7985 of source; at this cut's tightest camera (k 1.30,
//   bgScale 1.0900) that is 0.8703, and at rest (k 0.86) 0.7649. The photograph
//   is never upscaled. COVERAGE at the rest camera, where the box is smallest:
//   1655 x 2942 on a 1080 x 1920 frame — 288 px of horizontal and 511 px of
//   vertical slack before parallax, against a worst offset of 21 / 41 px. The
//   paper cannot show an edge.
//
// THE GEOMETRY, world px, solved so the resolved block is centred on 835 — the
// caption-safe content centre `CAM_LIFT` puts on screen y 835 at every k.
// Barlow's cap height is 0.700 em, measured off the shipped webfont in
// `PeakForSolar` and confirmed on `SolarFoundation`'s own render.
//   RULE      6 px, x 92..988, top edge R = 1236.635
//   COLUMNS   3 cells wide (136) on a 190 pitch, left edges 92 / 282 / 472 /
//             662 / 852, so the row spans 92..988 and is centred on 540. Rows
//             1 / 2 / 4 / 8 / 16 at the cell pitch 48 -> heights 40 / 88 / 184 /
//             376 / 760. Every column's bottom is 8 px clear of the rule
//             (COL_BOTTOM 1228.635), the same gap the sister cut leaves.
//             Tops: 1188.635 / 1140.635 / 1044.635 / 852.635 / 468.635.
//   AI LINE   y = COL_BOTTOM - g(x), g(x) = 48 * 2^((x - 92) / 190) - 8, from
//             column 1's top-LEFT corner (92) to x 872 — 20 px past column 5's
//             corner — sampled every 2 px. Residual at all five corners:
//             0.000000000 px. Stroke 10, butt caps. Three copies of the same
//             curve offset ACROSS it by 10 / 20 / 30 (the vertical shift scaled
//             by |(1, g'(x))|), stacked orange (back) -> purple -> blue -> white
//             core (front), the core's +4/+4 shadow at the very back. At the
//             head g' = 3.0138, |n| = 3.17541, so the ribbon's top edge is
//             35 * |n| = 111.139 px above the core there.
//   "AI"      900 / 120, centred on the head, baseline 26 px above the ribbon's
//             top edge there: at the landing 273.37, ink top 189.37.
//   COST BARS 136 wide on the columns' own x, top edge 14 px below the rule's
//             bottom (BAR_TOP 1256.635), lengths 200 / 160 / 128 / 102.4 /
//             81.92 (v2: shortened from 250-up to make room for the taller
//             ribbon) -> ends 1456.635 / 1416.635 / 1384.635 / 1359.035 /
//             1338.555.
//   CURVE     6 px polyline through the bars' bottom-RIGHT corners + 17 px (v3:
//             14, which left only 7 px to a bar's hard shadow), with a flat
//             run-in at bar 1's own depth from the rule's left end:
//             (92 1473.635) (228 1473.635) (418 1433.635) (608 1401.635)
//             (798 1376.035) (988 1355.555). Straight segments; nothing is
//             interpolated beyond the rule itself.
//   "SOLAR"   900 / 56 / 0.06em, x 255 (over columns 1-2), baseline 986.635.
//   "COST"    900 / 56 / 0.06em, x 825 (under columns 4-5), cap-top 1413.18 =
//             30 px below the curve at the label's own left edge, baseline
//             1452.38.
//   THE BLOCK is 189.37 ("AI" ink top) .. 1480.635 (the curve's deepest run plus
//   its stroke and its shadow) and its centre is 835.000.
//
// THE THREE GEOMETRIC ASSERTS, swept at 0.25 px:
//   1. THE LINE AND THE COLUMNS. The line's CENTRELINE passes exactly through
//      each top-left corner, so a stroke with width has to graze the cell under
//      it: the core's lower edge plus the shadow's dips below the corner by
//      9.77 / 10.68 / 12.86 / 18.09 / 29.81 px and reaches 51.5 / 29.3 / 18.0 /
//      12.8 / 10.8 px along, columns 1..5 — tangential, and bounded, but not the
//      "within 6 px" the brief asked for, because a 10 px stroke on a slope of
//      3.01 is 29.7 px tall measured vertically and its own shadow is 4 px lower
//      again. So THE WHOLE AI LINE IS DRAWN BEHIND THE COLUMNS: the cells eat
//      the graze and not one pixel of line ink is ever visible on a cell. It
//      costs nothing, because the only thing behind a cell is the graze — the
//      ribbon itself never reaches a cell at all (blue's lower edge, the lowest
//      chain ink there is, clears every cell top by at least 5.08 px).
//   2. THE CURVE AND THE BARS. At the 17 px drop the curve's highest ink is
//      14.00 px below the nearest bar's white (at every bar's bottom-right
//      corner, and along the whole flat run under bar 1) and 10.00 px below that
//      bar's hard shadow. It clears both by the 10 px gate.
//   3. "SOLAR" clears the ribbon's orange edge by 86.2 px at its tightest — gate
//      40 — so it stays where it was, top-left, as the header of the upper half.
//
// THE GESTURES — one continuous motion left to right and then down. Gestures
// lead; the words are where they land.
//   f-4..38  DEPLOY. Each column rises as ONE finished body from below the rule,
//            clipped to its resting bottom (`PeakForSolar`'s bar-rise), 12
//            frames each on Easing.bezier(0.16, 1, 0.3, 1), starting f-4 / 8 /
//            14 / 20 / 26. The DURATION IS THE SAME FOR EVERY COLUMN, so each is
//            visibly faster than the last — column 5 covers 768 px in the twelve
//            frames column 1 spends on 48. That is "fastest". Column 1 starts at
//            f-4 and is 90% up on frame 0.
//                    — "the fastest thing you can deploy" (fastest f7, deploy f23)
//   f12      "SOLAR" slides up 40 px over 14 frames and stops.
//   f36-62   MATCH. The line draws from column 1's top-left corner to x 872, its
//            head linear in x, by building the sampled path up to the head:
//            orange f36-56, purple f38-58, blue f40-60, core and its shadow
//            f42-62. The colours lead the core as a trail and settle into the
//            three stripes. It meets each column at its corner exactly — the
//            path IS the corners — so there is no contact flash and no bounce.
//                    — "it can match the speed of AI" (match f43, speed f53, AI f60)
//   f56      "AI" slides up 110 px over 14 frames out from behind the ribbon's
//            own crest, and from f62 it RIDES the head.
//   f62+     THE CREEP. The head keeps running along the same exponential at
//            0.25 px/frame in x to the last frame, and the label rides it: AI
//            keeps growing. This is the tail's alive layer.
//   f70-82   BAR 1 DROPS out of the rule, clipped to its resting top, 12 frames
//            on the same bezier.                            — "learning" f76
//   f74-114  CHEAPER. The curve's head leaves bar 1's end at x 92 on f74 — four
//            frames into that bar's own drop, so the first bar never stands
//            there on its own — and runs linear in x to x 988 by f114, drawing
//            the polyline in front of the bars. Bars 2-5 each start dropping
//            when the head is 40 px short of that bar's LEFT edge — f81 / 90 /
//            98 / 107, landing f93 / 102 / 110 / 119 — so each one lands as the
//            line passes beneath it.
//                    — "curve" f83, "cheaper" f99, "cheaper" f109
//   f109     "COST" slides up 24.26 px over 14 frames and stops.  — "cheaper" f109
// Nothing else. No glints, no springs, no bounces, no pulses, no dots, no axis
// ticks, no numerals, no arrows.
//
// THE CAMERA — `runCamera2`, the sister cut's machinery exactly: keyed k, keyed
// cx and a keyed CONTENT CENTRE through `camMove`, so a re-centring and a zoom
// are one move and never two.
//   OPEN  f0     k 1.30, cx 380, centre 1126.635 (= R - 110). Columns 1-3
//                standing on the rule; columns 4 and 5 are off the top of the
//                frame and do not exist yet.
//   TRACK f4-26  k 1.30 -> 0.95, cx 380 -> 540, centre 1126.635 -> 855.635 (the
//                upper chart: column 5's top 468.635 to the rule's bottom
//                1242.635), warp 0.7. Up and right WITH the columns. At f34
//                column 5's top is at screen y 461.6 — 461 px of headroom
//                against a gate of 60.
//                              — "the fastest thing you can deploy"
//   PULL  f40-54 k 0.95 -> 0.86, centre held, warp 0.8. The camera opens while
//                the line draws, and it is moving 0.2 world px/frame at f60, so
//                "AI" lands in a still frame.
//   TILT  f66-80 centre 855.635 -> 835, k 0.86, warp 0.8. Down onto the cost
//                half, leading bar 1's drop and home well before the head
//                reaches its deepest point. It is only 21 px because the block
//                is top-heavy: the ribbon and its label reach 1047 px above the
//                rule and the cost half only 244 below, so the whole picture's
//                centre of mass barely moves when the bars arrive.
//   CREEP f104-135 k 0.86 -> 0.875, centre held. Never parked.
//
//   THE DAMPED NUMBERS, what `runCamera2` actually produces (cx carries the
//   hand's own +/-3 px sway; the tracker's target is 540 from f26 on):
//     f    k        cy         cx       centre      vk        vcy     vcx
//     0    1.3000   1224.29    380.00   1128.13    0.0000     0.00    0.00
//     12   1.2173   1167.01    419.30   1064.33   -0.0187   -12.85    8.53
//     23   1.0099   1027.56    515.16    903.79   -0.0141    -9.27    6.46
//     34   0.9510    989.36    542.52    857.92   -0.0008    -0.49    0.35
//     43   0.9464    989.14    542.91    857.06   -0.0021     0.31   -0.01
//     60   0.8623   1001.94    541.52    856.98   -0.0012     0.14   -0.00   "AI" lands still
//     70   0.8599   1000.50    540.29    855.14    0.0000    -0.73    0.00
//     78   0.8600    993.60    539.34    848.24    0.0000    -0.90    0.00   deepest ink drawn
//     83   0.8600    982.15    538.65    836.80    0.0000    -0.71   -0.00
//     99   0.8600    980.34    537.25    834.99   -0.0000     0.00   -0.00
//     109  0.8603    980.30    537.00    835.00    0.0001    -0.02    0.00
//     119  0.8644    979.62    537.31    835.00    0.0006    -0.10    0.00
//     134  0.8736    978.09    538.68    835.00    0.0004    -0.07   -0.00
//   max |dv| per channel: k 0.00304, cy 2.1067, cx 1.3893 (max |v| k 0.0210,
//   cy 14.297, cx 9.604). One acceleration lobe and one settle lobe per move on
//   every channel.
//
//   THE FRAME ASSERTIONS. Predicted frame by frame over every piece of ink and
//   its shadow with the sway and the drift in, then MEASURED on all 135 rendered
//   frames by thresholding the ink out of the paper (white > 240, black < 90, or
//   saturation > 70 — the paper's own corner runs 183..200 at saturation <= 21,
//   so the printed grid never counts):
//                       predicted            measured
//     LEFT margin       111.5 px @f35        112 px @f34     gate 96
//     RIGHT margin      112.5 px @f34        112 px @f34     gate 96
//     lowest ink       1394.7 px @f134      1394 px @f126    gate 1400
//     highest ink       214.3 px @f134       214 px @f133    gate 60
//   AND THE CELLS, measured the same way: every cell of every LANDED column on
//   every frame, sampled 6 world px inside its own edges — 9,507 cell interiors.
//   Seven of them carry a single non-white pixel and none carries two, which is
//   the antialiasing on the sampling inset itself. No line ink, no chain and no
//   shadow is ever visible on a cell.
//   REST k IS 0.86, THE HIGHEST THE GATES ALLOW, and the 17 px drop does not
//   move it: the block is now 1291.27 px tall and centred on 835, so the 1400 px
//   caption gate needs k <= 0.8684 at every frame and the tail's own creep to
//   0.875 is what binds it, at 1396. Side padding sits
//   a long way inside its gate at that zoom — 112 px against 96 — which is the
//   direction the user asked for.
//
// DEVIATIONS from the brief, and why.
//   * THE EXPONENTIAL IS 48 * 2^((x - 92) / 190) - 8. 1 / 2 / 4 / 8 / 16 cells at
//     the 48 px cell pitch measure 40 / 88 / 184 / 376 / 760, not 40 / 80 / 160 /
//     320 / 640: each column is a doubling of CELLS and the 8 px gaps ride along.
//     48 * 2^i - 8 is that sequence exactly, so the curve passes through all five
//     top-left corners with a residual of 0.000000000 px.
//   * THE THREE COPIES ARE OFFSET ACROSS THE CURVE, NOT STRAIGHT UP (accepted in
//     v1). With a plain vertical offset the ribbon collapses: at a slope of 3.01
//     a 10 px vertical step is 3.2 px measured across the line and each stripe
//     is a third of its own stroke width — 0.8 px on the 270 px phone check.
//   * THE AI LINE IS DRAWN BEHIND THE COLUMNS — see THE THREE GEOMETRIC ASSERTS.
//     The brief's "never overlap any cell except within 6 px of the five corners"
//     cannot be met by a 10 px stroke whose centreline goes through the corners;
//     occluding the graze meets what it is for.
//   * "COST" SLIDES 24.26 PX, NOT 40, and it is the block's own bottom line that
//     picks the number: its ink plus shadow at rest sits 24.26 px above the
//     curve's deepest ink, so a 40 px slide would start 16 px BELOW the block and
//     drag the caption gate down with it — enough to cost 0.02 of rest k. At
//     24.26 the slide starts exactly on the block's bottom line.
//   * THE CREEP IS 0.25 px/frame, NOT 0.5 (accepted in v1). The slope at the head
//     is 3.01, so 0.5 px/frame in x is 1.5 px/frame of lift and over the 72 frame
//     tail the head would climb 120 px clear of column 5.
//   * THE "AI" SLIDE IS 110 PX, NOT 50 (accepted in v1) — exactly the distance
//     that hides the label behind the ribbon's own crest, so f56 is a clean birth
//     instead of a 71%-visible pop. The travel stays 14 frames.
//   * THE PULL HOLDS THE CENTRE AT 855.635 and the TILT is only 21 px. Lifting
//     the centre to frame the ribbon and its label (717.5) and tilting back would
//     be a 116 px descent that has to be finished before f74, and no key window
//     does it: at that centre the rest k the gates allow falls from 0.86 to about
//     0.82. Holding costs nothing to look at — at 855.635 the resolved "AI" ink
//     top is already at screen y 261.
//   * THE PULL'S KEYS END AT f54 and THE TRACK'S AT f26, not at the ends of their
//     windows: the damper needs about twelve frames to settle, and the 96 px side
//     gate binds from f34 (it needs k <= 0.982 there) while "AI" needs a still
//     frame at f60.
//   * COLUMN 1 STARTS AT f-4, so frame 0 is not an empty rule — the brief's own
//     override of its f2.
//   * EVERY RIBBON COPY NOW STOPS AT THE CORE'S OWN HEAD X. v1 carried each copy
//     on to the normal through the core's head, which cut the tip on one clean
//     diagonal; on this curve, whose slope at the head is 3.01, that carries the
//     orange 28 px right and 100 px UP and drives it straight through the gap
//     between the "A" and the "I" — visible in the first v2 render. The label
//     only has 26 px of clearance over the crest and the curve climbs 3.3 px per
//     px, so no smaller extension fits either. Stopping every copy at the head
//     puts a hard bound on it: over the label's whole x span the ribbon's top is
//     at most the crest at the head, so the label clears it by 26 px everywhere.
//     The tip tapers instead, the orange reaching highest — which is the order
//     the colours arrive in anyway.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";

// This cut's own background oversize — see the header.
const BG_OVERSIZE_LC = 1.6;

export const schema = z.object({
  paperSrc: z.string(),
  parallax: z.number(),
  paperDim: z.number(),
  paperBlur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  // the hard shadow, in WORLD px, so it rides everything at every zoom
  shadowOffset: z.number(),
  solarLabel: z.string(),
  costLabel: z.string(),
  aiLabel: z.string(),
  beats: z.object({
    fastest: z.number(), // "fastest"   — the columns are already climbing
    deploy: z.number(), // "deploy"     — column 5 is on its way
    solar: z.number(), //               — the "SOLAR" label slides up
    match: z.number(), // "match"       — the line is drawing
    ai: z.number(), // "AI"             — the label slides up out of the crest
    learning: z.number(), // "learning" — bar 1 is landing
    curve: z.number(), // "curve"       — the head is running under the bars
    cheaper: z.number(), // "cheaper"   — the "COST" label slides up
    end: z.number(), // speech ends; tail to 135
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE GEOMETRY. Every number is resolved from the cell module and Barlow's real
// cap height, and every one of them is exported: the next cut in this clip picks
// this resolved chart up and annotates it, and the ratios have to agree to the
// pixel.
// ---------------------------------------------------------------------------
export const CONTENT_C = 835; // the content centre, on screen y 835 at every k
export const CENTRE_X = FRAME_W / 2;

// -- the cell, `SolarFoundation`'s exactly: same size = same noun -------------
export const CELL = 40;
export const CELL_GAP = 8;
export const CELL_PITCH = CELL + CELL_GAP; // 48

export const COL_CELLS = 3; // cells across a column
export const COL_W = COL_CELLS * CELL + (COL_CELLS - 1) * CELL_GAP; // 136
export const COL_PITCH = 190;
export const COL_X0 = 92;
export const COL_X = [0, 1, 2, 3, 4].map((i) => COL_X0 + i * COL_PITCH); // 92..852
export const COL_R = COL_X.map((x) => x + COL_W); // 228 418 608 798 988
export const COL_CX = COL_X.map((x) => x + COL_W / 2); // 160 350 540 730 920
export const COL_ROWS = [1, 2, 4, 8, 16]; // the doubling
export const COL_H = COL_ROWS.map((n) => n * CELL + (n - 1) * CELL_GAP); // 40 88 184 376 760

export const RULE_X0 = COL_X0;
export const RULE_X1 = COL_R[4]; // 988
export const RULE_W = 6;
export const RULE_GAP = 8; // the columns stand clear of the rule

// -- the AI line, on the columns' TOP-LEFT CORNERS ---------------------------
export const AI_STROKE = 10;
// PERPENDICULAR offsets. A copy is not the core's path translated down the page:
// its vertical shift is scaled by the local |(1, g')| so the three stripes are
// the same 10 px wide measured ACROSS the ribbon at every x.
export const AI_OFFSETS = { blue: 10, purple: 20, orange: 30 };
export const AI_RIM = AI_OFFSETS.orange + AI_STROKE / 2; // 35, across the ribbon
export const AI_GAP = 26; // "AI" baseline above the ribbon's own top edge
export const AI_SIZE = 120;
export const AI_SAMPLE = 2; // px between samples of the exponential
export const AI_BASE = CELL_PITCH; // 48
export const AI_TRIM = CELL_GAP; // 8
// g(COL_X[i]) = COL_H[i] exactly, for every i.
export const aiG = (x: number) => AI_BASE * Math.pow(2, (x - COL_X0) / COL_PITCH) - AI_TRIM;
export const aiSlope = (x: number) =>
  ((AI_BASE * Math.LN2) / COL_PITCH) * Math.pow(2, (x - COL_X0) / COL_PITCH);
export const aiNorm = (x: number) => Math.sqrt(1 + aiSlope(x) * aiSlope(x));
export const AI_X0 = COL_X0; // 92, column 1's top-left corner
export const AI_HEAD_PAST = 20; // the head lands this far past column 5's corner
export const AI_X1 = COL_X[4] + AI_HEAD_PAST; // 872
// how far the ribbon's top edge is above the core AT THE HEAD, vertically
export const AI_RIM_HEAD = AI_RIM * aiNorm(AI_X1); // 111.139

// -- the cost half -----------------------------------------------------------
export const BAR_W = COL_W;
export const BAR_TOP_GAP = 14; // the bars' top edge below the rule's bottom
// 100 / 80 / 64 / 51.2 / 40.96 — 20% off every doubling, exactly.
export const COST_RATIO = 0.8;
export const BAR_UNIT = 200;
export const BAR_LEN = [0, 1, 2, 3, 4].map((i) => BAR_UNIT * Math.pow(COST_RATIO, i));
export const CURVE_DROP = 17; // the curve runs under the bars' bottom-right corners
export const CURVE_STROKE = 6;

export const LABEL_SIZE = 56;
export const LABEL_TRACK = 0.06; // em
const CAP = 0.7; // Barlow's cap height per em, measured on the shipped webfont

// How far the block reaches above and below the rule's top edge, which is the
// one line everything is measured from.
const BLOCK_UP = RULE_GAP + aiG(AI_X1) + AI_RIM_HEAD + AI_GAP + CAP * AI_SIZE; // 1047.270
const BLOCK_DOWN = RULE_W + BAR_TOP_GAP + BAR_LEN[0] + CURVE_DROP + CURVE_STROKE / 2 + 4; // 241

export const RULE_Y = CONTENT_C + (BLOCK_UP - BLOCK_DOWN) / 2; // 1236.635
export const COL_BOTTOM = RULE_Y - RULE_GAP; // 1228.635
// 1188.635 / 1140.635 / 1044.635 / 852.635 / 468.635
export const COL_TOP = COL_H.map((h) => COL_BOTTOM - h);

export const aiY = (x: number) => COL_BOTTOM - aiG(x);
// the ribbon's top edge: the orange copy's outer side, across the curve
export const aiCrest = (x: number) => aiY(x) - AI_RIM * aiNorm(x);

export const AI_BASELINE = aiCrest(AI_X1) - AI_GAP; // 273.37
export const AI_INK_TOP = AI_BASELINE - CAP * AI_SIZE; // 189.37

export const BAR_TOP = RULE_Y + RULE_W + BAR_TOP_GAP; // 1256.635
// 1456.635 / 1416.635 / 1384.635 / 1359.035 / 1338.555
export const BAR_BOTTOM = BAR_LEN.map((l) => BAR_TOP + l);

// THE CURVE: the bars' bottom-right corners + 14 px, with a flat run-in at
// bar 1's own depth from the rule's left end.
export const CURVE_PTS: [number, number][] = [
  [COL_X0, BAR_BOTTOM[0] + CURVE_DROP],
  ...COL_R.map((x, i) => [x, BAR_BOTTOM[i] + CURVE_DROP] as [number, number]),
];

export const curveY = (x: number) => {
  for (let i = 1; i < CURVE_PTS.length; i++) {
    if (x <= CURVE_PTS[i][0]) {
      const [x0, y0] = CURVE_PTS[i - 1];
      const [x1, y1] = CURVE_PTS[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return CURVE_PTS[CURVE_PTS.length - 1][1];
};

export const BLOCK_TOP = AI_INK_TOP; // 189.37
export const BLOCK_BOTTOM = CURVE_PTS[0][1] + CURVE_STROKE / 2 + 4; // 1480.635

// -- the labels --------------------------------------------------------------
export const SOLAR_X = (COL_X[0] + COL_R[1]) / 2; // 255
export const SOLAR_BASELINE = RULE_Y - 250; // 986.635
export const COST_X = (COL_CX[3] + COL_CX[4]) / 2; // 825
export const COST_HALF = 80; // "COST" at 56 / 900 / 0.06em is ~156 px wide
// 30 px below the curve at the label's own LEFT edge, which is the lowest the
// curve gets under the label.
export const COST_CAPTOP = curveY(COST_X - COST_HALF) + 30; // 1413.18
export const COST_BASELINE = COST_CAPTOP + CAP * LABEL_SIZE; // 1452.38

// -- the gestures ------------------------------------------------------------
export const COL_START = [-4, 8, 14, 20, 26];
export const COL_RISE = 12; // the same for every column, so each is faster
export const COL_TRAVEL = COL_H.map((h) => h + RULE_GAP); // fully below the rule

export const AI_DRAW = 20;
export const AI_LAYER_START = { orange: 36, purple: 38, blue: 40, core: 42 };
export const AI_LANDED = AI_LAYER_START.core + AI_DRAW; // 62
export const AI_CREEP_PX = 0.25;
export const AI_TRAVEL_F = 14;
// exactly the distance that hides the label behind the ribbon's own crest
export const AI_RISE = aiCrest(AI_X1) - AI_INK_TOP; // 110

export const LABEL_TRAVEL_F = 14;
export const SOLAR_RISE = 40;
export const SOLAR_BEAT = 12;
export const COST_BEAT = 109; // the SECOND "cheaper": bar 4 is down, bar 5 landing
// "COST" rises exactly as far as the block's own bottom line allows, so its
// slide never reaches below the curve's deepest ink — see DEVIATIONS.
export const COST_RISE = BLOCK_BOTTOM - (COST_BASELINE + 4); // 24.26

export const BAR1_DROP = 70; // "learning" f76 lands mid-drop
export const BAR_DROP = 12;
export const CURVE_F0 = 74; // the head leaves bar 1's end, four frames into its drop
export const CURVE_F1 = 114; // and reaches x 988
export const BAR_LEAD = 40; // the head is this short of a bar's LEFT edge when it drops

const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

export const curveHeadX = (frame: number) => {
  if (frame < CURVE_F0) {
    return null;
  }
  return Math.min(
    RULE_X1,
    COL_X0 + ((RULE_X1 - COL_X0) * (frame - CURVE_F0)) / (CURVE_F1 - CURVE_F0),
  );
};

// The frame each bar starts dropping. Bar 1 is the one the head is born on;
// bars 2-5 are found from the head, not from a timer.
export const BAR_START = [
  BAR1_DROP,
  ...COL_X.slice(1).map((x) => {
    for (let f = CURVE_F0; f <= DURATION; f++) {
      const h = curveHeadX(f);
      if (h !== null && h >= x - BAR_LEAD) {
        return f;
      }
    }
    return DURATION;
  }),
]; // 70 81 90 98 107

// -- the camera --------------------------------------------------------------
export const K_OPEN = 1.3;
export const K_TRACK = 0.95;
export const K_REST = 0.86; // the highest the 1400 px caption gate allows
export const K_TAIL = 0.875;
export const X_OPEN = 380; // columns 1-3 span 92..608
export const X_REST = CENTRE_X;
export const C_OPEN = RULE_Y - 110; // 1126.635: the rule with things standing on it
export const C_UPPER = (COL_TOP[4] + RULE_Y + RULE_W) / 2; // 855.635: the upper chart
export const C_REST = CONTENT_C; // 835: the whole block

export const TRACK_F0 = 4;
export const TRACK_F1 = 26; // the 96 px side gate binds from f34 and needs k <= 0.982
export const TRACK_WARP = 0.7;
export const PULL_F0 = 40;
export const PULL_F1 = 54; // f62 leaves the camera travelling under "AI"
export const PULL_WARP = 0.8;
export const TILT_F0 = 66;
export const TILT_F1 = 80; // home long before the deepest ink is drawn at f74
export const TILT_WARP = 0.8;
export const CREEP_F0 = 104;
export const CREEP_F1 = DURATION;
export const CREEP_WARP = 1.0;

const TRACK = camMove({
  f0: TRACK_F0,
  f1: TRACK_F1,
  k0: K_OPEN,
  k1: K_TRACK,
  c0: C_OPEN,
  c1: C_UPPER,
  warp: TRACK_WARP,
});
const TRACK_X = TRACK.F.map(
  (_, i) => camEase(i / (TRACK_F1 - TRACK_F0), TRACK_WARP) * (X_REST - X_OPEN) + X_OPEN,
);
const PULL = camMove({
  f0: PULL_F0,
  f1: PULL_F1,
  k0: K_TRACK,
  k1: K_REST,
  c0: C_UPPER,
  c1: C_UPPER,
  warp: PULL_WARP,
});
const TILT = camMove({
  f0: TILT_F0,
  f1: TILT_F1,
  k0: K_REST,
  k1: K_REST,
  c0: C_UPPER,
  c1: C_REST,
  warp: TILT_WARP,
});
const CREEP = camMove({
  f0: CREEP_F0,
  f1: CREEP_F1,
  k0: K_REST,
  k1: K_TAIL,
  c0: C_REST,
  c1: C_REST,
  warp: CREEP_WARP,
});

export const LC_CAM_F = [0, ...TRACK.F, ...PULL.F, ...TILT.F.slice(1), ...CREEP.F];
export const LC_CAM_K = [K_OPEN, ...TRACK.K, ...PULL.K, ...TILT.K.slice(1), ...CREEP.K];
export const LC_CAM_CY = [
  C_OPEN + CAM_LIFT / K_OPEN,
  ...TRACK.CY,
  ...PULL.CY,
  ...TILT.CY.slice(1),
  ...CREEP.CY,
];
export const LC_CAM_CX = [
  X_OPEN,
  ...TRACK_X,
  ...PULL.F.map(() => X_REST),
  ...TILT.F.slice(1).map(() => X_REST),
  ...CREEP.F.map(() => X_REST),
];

// `runCamera` damps cy and k only. This is `SolarFoundation`'s `runCamera2`, the
// same house tracker on the same CAM_STIFF / CAM_DAMP with an x channel, so this
// file owns its camera and `fieldShared` is not touched.
export const runCamera2 = (upto: number, F: number[], CY: number[], CX: number[], K: number[]) => {
  let cy = CY[0];
  let cx = CX[0];
  let k = K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, F, CY, clamp);
    const tx = interpolate(f, F, CX, clamp);
    const tk = interpolate(f, F, K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};

export const defaultProps: Props = schema.parse({
  paperSrc: "paper-supaclean-still.png",
  parallax: 0.15,
  paperDim: 0.88,
  paperBlur: 3,
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  solarLabel: "SOLAR",
  costLabel: "COST",
  aiLabel: "AI",
  beats: {
    fastest: 7,
    deploy: 23,
    solar: SOLAR_BEAT,
    match: 43,
    ai: 56,
    learning: 76,
    curve: 83,
    cheaper: COST_BEAT,
    end: 119,
  },
});

// The cells of one column, bottom row sitting on COL_BOTTOM.
export const COL_CELLS_XY = COL_ROWS.map((rows, i) => {
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COL_CELLS; c++) {
      out.push({ x: COL_X[i] + c * CELL_PITCH, y: COL_TOP[i] + r * CELL_PITCH });
    }
  }
  return out;
});

// ---------------------------------------------------------------------------
// THE GROUND. `SolarFoundation`'s `PaperGround`, unchanged.
// ---------------------------------------------------------------------------
const PaperGround: React.FC<{
  src: string;
  frame: number;
  cy: number;
  cyRest: number;
  cx: number;
  cxRest: number;
  k: number;
  parallax: number;
  dim: number;
  blur: number;
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax, dim, blur }) => {
  const bgY = -(cy - cyRest) * k * parallax - frame * 0.3;
  const bgX = -(cx - cxRest) * k * parallax;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE_LC,
          height: FRAME_W * BG_OVERSIZE_LC,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const CLIP_COL_CORE = "lc-above-the-column-line";
const CLIP_COL_SHADOW = "lc-above-the-column-line-shadow";
const CLIP_BAR_CORE = "lc-below-the-rule";
const CLIP_BAR_SHADOW = "lc-below-the-rule-shadow";
const CLIP_AI_LABEL = "lc-above-the-crest";

// THE EXPONENTIAL, as a path up to a head, offset `up` px ACROSS the ribbon. The
// head is an exact point on the curve, and EVERY copy stops at the core's own
// head x: at the steep end the outer copies stand further up the page than the
// core does, so the tip tapers with the orange reaching highest — the same order
// the colours arrive in. (v1 carried each copy on to the normal through the
// core's head for a diagonal cut; at a slope of 3.01 that runs the orange 100 px
// up and straight through the "AI" glyphs. See DEVIATIONS.)
const aiPath = (headX: number, up: number) => {
  const at = (x: number) => `${x.toFixed(2)} ${(aiY(x) - up * aiNorm(x)).toFixed(2)}`;
  const pts: string[] = [];
  for (let x = AI_X0; x < headX; x += AI_SAMPLE) {
    pts.push(at(x));
  }
  pts.push(at(headX));
  return `M${pts.join(" L")}`;
};

// THE POLYLINE, as a path up to a head: straight segments between the six points
// and nothing interpolated.
const curvePath = (headX: number) => {
  const pts: [number, number][] = [CURVE_PTS[0]];
  for (let i = 1; i < CURVE_PTS.length; i++) {
    if (CURVE_PTS[i][0] < headX) {
      pts.push(CURVE_PTS[i]);
    }
  }
  pts.push([headX, curveY(headX)]);
  return `M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L")}`;
};

const LearningCurve: React.FC<Props> = ({
  paperSrc,
  parallax,
  paperDim,
  paperBlur,
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  solarLabel,
  costLabel,
  aiLabel,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, LC_CAM_F, LC_CAM_CY, LC_CAM_CX, LC_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- one travel curve, sampled at a different start frame per layer --------
  const travelled = (f0: number, frames: number, distance: number) => {
    const t = interpolate(frame, [f0, f0 + frames], [0, 1], { easing: EASE_LAND, ...clamp });
    return (1 - t) * distance;
  };

  // THE CREEP: from the frame the core lands, every copy's head runs on along
  // the same exponential together, so the three stripes stay stripes.
  const creep = Math.max(0, frame - AI_LANDED) * AI_CREEP_PX;
  const headOf = (start: number) =>
    interpolate(frame, [start, start + AI_DRAW], [AI_X0, AI_X1], clamp) + creep;

  const orangeHead = headOf(AI_LAYER_START.orange);
  const crestY = aiCrest(orangeHead); // the ribbon's top edge at the head

  const curveHead = curveHeadX(frame);

  const type = (size: number) =>
    ({
      fontFamily,
      fontWeight: 900,
      fontSize: size,
      textTransform: "uppercase",
    }) as const;

  // White on its hard black copy — the same four world px behind everything.
  const shadowedText = (
    key: string,
    text: string,
    x: number,
    y: number,
    size: number,
    tracking = 0,
  ) => (
    <g key={key}>
      <text
        x={x + shadowOffset + (tracking ? (-tracking * size) / 2 : 0)}
        y={y + shadowOffset}
        textAnchor="middle"
        fill={shadow}
        style={{ ...type(size), letterSpacing: tracking ? `${tracking}em` : undefined }}
      >
        {text}
      </text>
      <text
        x={x + (tracking ? (-tracking * size) / 2 : 0)}
        y={y}
        textAnchor="middle"
        fill={ink}
        style={{ ...type(size), letterSpacing: tracking ? `${tracking}em` : undefined }}
      >
        {text}
      </text>
    </g>
  );

  // -- the columns, each one body -------------------------------------------
  const colDy = COL_START.map((f0, i) => travelled(f0, COL_RISE, COL_TRAVEL[i]));
  const colLive = COL_START.map((f0) => frame >= f0);
  const columnLayer = (fill: string, off: number) =>
    COL_CELLS_XY.map((cells, i) =>
      colLive[i] ? (
        <g key={`col-${fill}-${i}`} transform={`translate(0 ${colDy[i].toFixed(2)})`}>
          {cells.map((c) => (
            <rect
              key={`${c.x}-${c.y}`}
              x={c.x + off}
              y={c.y + off}
              width={CELL}
              height={CELL}
              fill={fill}
            />
          ))}
        </g>
      ) : null,
    );

  // -- the cost bars, each dropping out of the rule --------------------------
  const barDy = BAR_START.map((f0, i) => -travelled(f0, BAR_DROP, BAR_LEN[i]));
  const barLive = BAR_START.map((f0) => frame >= f0);
  const barLayer = (fill: string, off: number) =>
    BAR_LEN.map((len, i) =>
      barLive[i] ? (
        <rect
          key={`bar-${fill}-${i}`}
          x={COL_X[i] + off}
          y={BAR_TOP + barDy[i] + off}
          width={BAR_W}
          height={len}
          fill={fill}
        />
      ) : null,
    );

  // -- the AI line: the core, its shadow, and the three copies above it ------
  const chain = [
    { key: "orange", color: orange, start: AI_LAYER_START.orange, up: AI_OFFSETS.orange },
    { key: "purple", color: purple, start: AI_LAYER_START.purple, up: AI_OFFSETS.purple },
    { key: "blue", color: blue, start: AI_LAYER_START.blue, up: AI_OFFSETS.blue },
  ];
  const coreStart = AI_LAYER_START.core;
  const corePath = frame >= coreStart ? aiPath(headOf(coreStart), 0) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={LC_CAM_CY[0]}
        cx={cx}
        cxRest={LC_CAM_CX[0]}
        k={k}
        parallax={parallax}
        dim={paperDim}
        blur={paperBlur}
      />

      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              {/* everything above the columns' own bottom line: a column grows
                  out of the gap over the rule instead of sliding past it. The
                  shadow layer is cut four px lower, which is where the shadow's
                  own bottom edge lives, so the emerging edge looks exactly like
                  the resting one. */}
              <clipPath id={CLIP_COL_CORE}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + COL_BOTTOM} />
              </clipPath>
              <clipPath id={CLIP_COL_SHADOW}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + COL_BOTTOM + shadowOffset} />
              </clipPath>
              {/* and everything below the bars' own top line, the same way down */}
              <clipPath id={CLIP_BAR_CORE}>
                <rect x={-2000} y={BAR_TOP} width={6000} height={6000} />
              </clipPath>
              <clipPath id={CLIP_BAR_SHADOW}>
                <rect x={-2000} y={BAR_TOP + shadowOffset} width={6000} height={6000} />
              </clipPath>
              {/* everything above the ribbon's own crest, so "AI" grows out from
                  behind it rather than over it */}
              <clipPath id={CLIP_AI_LABEL}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + crestY} />
              </clipPath>
            </defs>

            {/* THE AI LINE, BEHIND the columns. Its centreline goes through each
                top-left corner, so the cells eat the stroke's own tangential
                graze and no line ink is ever visible on a cell. The core's
                shadow is at the very back, on the core's own timing, so no grey
                ghost precedes the white. */}
            {corePath ? (
              <path
                d={corePath}
                fill="none"
                stroke={shadow}
                strokeWidth={AI_STROKE}
                strokeLinecap="butt"
                strokeLinejoin="round"
                transform={`translate(${shadowOffset} ${shadowOffset})`}
              />
            ) : null}
            {chain.map((c) =>
              frame >= c.start ? (
                <path
                  key={c.key}
                  d={aiPath(headOf(c.start), c.up)}
                  fill="none"
                  stroke={c.color}
                  strokeWidth={AI_STROKE}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
              ) : null,
            )}
            {corePath ? (
              <path
                d={corePath}
                fill="none"
                stroke={ink}
                strokeWidth={AI_STROKE}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            ) : null}

            {/* THE COLUMNS. */}
            <g clipPath={`url(#${CLIP_COL_SHADOW})`}>{columnLayer(shadow, shadowOffset)}</g>
            <g clipPath={`url(#${CLIP_COL_CORE})`}>{columnLayer(ink, 0)}</g>

            {/* THE RULE. It exists from frame 0 and never moves. */}
            <rect
              x={RULE_X0 + shadowOffset}
              y={RULE_Y + shadowOffset}
              width={RULE_X1 - RULE_X0}
              height={RULE_W}
              fill={shadow}
            />
            <rect x={RULE_X0} y={RULE_Y} width={RULE_X1 - RULE_X0} height={RULE_W} fill={ink} />

            {/* THE COST BARS. */}
            <g clipPath={`url(#${CLIP_BAR_SHADOW})`}>{barLayer(shadow, shadowOffset)}</g>
            <g clipPath={`url(#${CLIP_BAR_CORE})`}>{barLayer(ink, 0)}</g>

            {/* THE LEARNING CURVE, IN FRONT of the bars and 11 px clear of every
                one of them. */}
            {curveHead !== null && curveHead > CURVE_PTS[0][0] ? (
              <g>
                <path
                  d={curvePath(curveHead)}
                  fill="none"
                  stroke={shadow}
                  strokeWidth={CURVE_STROKE}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                  transform={`translate(${shadowOffset} ${shadowOffset})`}
                />
                <path
                  d={curvePath(curveHead)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={CURVE_STROKE}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
              </g>
            ) : null}

            {/* "SOLAR" — it slides up 40 px and stops. */}
            {frame >= beats.solar
              ? shadowedText(
                  "solar",
                  solarLabel,
                  SOLAR_X,
                  SOLAR_BASELINE + travelled(beats.solar, LABEL_TRAVEL_F, SOLAR_RISE),
                  LABEL_SIZE,
                  LABEL_TRACK,
                )
              : null}

            {/* "COST" — the same, under the curve, and its slide starts exactly
                on the block's own bottom line. */}
            {frame >= beats.cheaper
              ? shadowedText(
                  "cost",
                  costLabel,
                  COST_X,
                  COST_BASELINE + travelled(beats.cheaper, LABEL_TRAVEL_F, COST_RISE),
                  LABEL_SIZE,
                  LABEL_TRACK,
                )
              : null}

            {/* "AI" — out from behind the ribbon's crest, and then it rides the
                creeping head. */}
            {frame >= beats.ai ? (
              <g clipPath={`url(#${CLIP_AI_LABEL})`}>
                {shadowedText(
                  "ai",
                  aiLabel,
                  orangeHead,
                  crestY - AI_GAP + travelled(beats.ai, AI_TRAVEL_F, AI_RISE),
                  AI_SIZE,
                )}
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default LearningCurve;
