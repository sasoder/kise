import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camMove,
  clamp,
  hash,
  sway,
  worldTransform,
} from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const FPS = 24;
// Clip "joel - jeff dean is betting on solar for ai", SRT cues 1-21. The
// composition starts at 0.000 s; speech ends at 5.160 s.
// round(5.160 * 24) = 124 frames of speech, plus a 16 frame tail so the
// resolved tower holds = 140.
export const DURATION = 140;

// ---------------------------------------------------------------------------
// "SOLAR FOUNDATION". The sibling of `PeakForSolar`: same paper, same chain,
// same type, same camera, same hard shadow — and this time the mark is a
// BUILDING, because the line is a building metaphor.
//
// THE LINE: "There's actually, I think, a lot of opportunity for solar to kind
// of be, like, be the foundation for, like, AI."
//
// THE PICTURE, side view. SOLAR is a stepped footing built out of solar-panel
// blocks; AI is a tower that rises out of it. White is the ink and white is
// the material, so the whole footing is white. The CORE MEMORY chain —
// orange #FFB765, purple #BC37FF, blue #0046FF, raw hex, no blend, no glow,
// nothing ever fades — has ONE job here: it belongs to AI. It is on the
// tower's crown and in the tower's LEDs, and it is nowhere on the footing.
//
// v2, on the director's review: the second act held and the FIRST ACT WAS TOO
// THIN — nine dashed slot rects in an empty frame for 44 frames, and adjacent
// slots doubled into pairs of parallel dashed lines 12 px apart, which read as
// noise rather than as a plan. So:
//   * THREE COURSES, 5 / 4 / 3 panels, and the tower stands on the 3-panel
//     one. The footing is half again as tall and the step reads as a step.
//   * ONE DASHED SILHOUETTE of the whole stepped footing instead of nine
//     slots — a single outline, no doubled lines anywhere.
//   * THE FILL STARTS AT f26, NOT f44, and runs to f84 across the three
//     courses, so the build is continuous under the whole line.
//   * THE RULE SITS 8 PX CLEAR of the bottom course (the cell gap), so the
//     bottom row keeps its own bottom edge and its own shadow instead of
//     fusing into the rule.
//   * THE CROWN STEPS ARE 18 PX, not 12.
//   * AN UNLIT LED IS CLEAN PAPER: the slab's shadow layer carries the hole
//     UNOFFSET, so nothing black falls inside it.
//
// THE MATERIAL IS PAPER, copied from `PeakForSolar` down to the number:
// `public/paper-supaclean-still.png`, 3864 x 2164 landscape, on its own plane
// at parallax 0.15 in both axes with the same -0.3 px/frame drift and the same
// 1 + (k - 1) * 0.3 scale, knocked back with `brightness(0.88) blur(3px)` on
// the image and nothing else, over a #C0C0C0 root. The paper's squares show
// through the 8 px gaps between the panel cells and through the tower's LED
// holes — that is what makes a white block read as a solar panel instead of a
// white block, and it rhymes with the squared paper it is drawn on.
//   A LOCAL BG_OVERSIZE OF 1.6. `objectFit: cover` solves 3864 x 2164 into
//   3072 x 1728 at 0.7985 of source; at this cut's tightest camera (k 1.35,
//   bgScale 1.105) that is 0.8824. The photograph is never upscaled.
//   COVERAGE, measured over all 140 frames with the keyed cy track and the
//   sway and the drift: worst horizontal margin 323.5 px, worst vertical
//   551.8 px. The paper cannot show an edge.
//
// THE GEOMETRY, world px, x centred on 540. Barlow's cap height is 0.700 em,
// measured off the shipped webfont in `PeakForSolar` and confirmed against
// this cut's own render (the "AI" ink box came back 372..507 screen px
// against a predicted 372.6..508.5).
//   PANEL 184 x 88: a 4 x 2 array of 40 x 40 cells with 8 px gaps.
//   TOP COURSE     3 panels, 12 px apart -> 576 wide, x 252.. 828, y  980.90.. 1068.90
//   MIDDLE COURSE  4 panels             -> 772 wide, x 154.. 926, y 1080.90.. 1168.90
//   BOTTOM COURSE  5 panels             -> 968 wide, x  56..1024, y 1180.90.. 1268.90
//   Running bond: each course sits on the joints of the one below it.
//   RULE      x 56..1024 (the footing's own width), 6 px, top edge 8 px under
//             the bottom course: 1276.90
//   "SOLAR"   900 / 56 / 0.06em, cap-top 1306.90, baseline (ink bottom) 1346.10
//   TOWER     7 slabs 360 x 56 with 10 px gaps = 452 tall, x 360..720,
//             foot on the top course's top, core top 528.90
//   LED       20 x 20, centred in its slab, right edge 22 px in: x 678..698
//   CROWN     blue +18, purple +36, orange +54 above the core: top 474.90
//   "AI"      900 / 190, baseline 456.90, ink top 323.90
//   The resolved block is 323.90..1346.10 and its centre is 835.000 — the
//   caption-safe content centre, which CAM_LIFT puts on screen y 835.
//   C_FOOT = (top course top 980.90 + "SOLAR" ink bottom 1346.10) / 2 =
//   1163.50: what the camera frames while the footing is all there is.
//
// THE GESTURES — one continuous build, centre-out and then up. Gestures lead;
// the words are where they land. Nothing fades: a layer exists or it does not.
//   f0-26   THE SILHOUETTE. ONE dashed outline of the whole stepped footing —
//           a single closed path, stroke 6, dash 30 / gap 16, on the same
//           +4/+4 black copy — revealed by ONE symmetric clip-rect wipe
//           growing from x 540 outward on Easing.inOut(Easing.cubic). At f0 it
//           is already +/-300, which is the whole top course (+/-288) and the
//           first step, so frame 0 carries a stepped shape rather than two
//           parallel lines. The dashes MARCH at -0.6 px/frame the whole time
//           they exist: the always-alive layer of the first act.
//                                                  — "a lot of opportunity"
//   f26-84  THE FILL, three courses, one front that never pauses. Cells switch
//           on as the front reaches them, two cells (a column) at a time, no
//           fade and no scale, even in column index per course.
//             BOTTOM f26-46  centre outward   26 29 31 33 35 38 40 42 44 46
//             MIDDLE f46-64  outer ends in    46 49 52 54 57 59 62 64
//             TOP    f66-84  centre outward   66 70 74 77 81 84
//           The front turns each corner where it left off: the bottom course
//           finishes at its outer ends on f46 and the middle course starts
//           from those same ends on f46; the middle closes at x 540 on f64 and
//           the top course opens from x 540 on f66.
//             — "solar" f48 lands on the bottom course completed and the
//               middle one starting; "foundation" f80-90 on the top course's
//               last two outer columns, f81 and f84
//           THE SILHOUETTE IS CONSUMED BY THE FILL. Per course, the outline is
//           clipped away behind that course's own front — the mechanism eats
//           it, there is no timer — so the bottom edge dissolves outward from
//           the centre, the middle course's outline is eaten inward from both
//           ends, and when the last column lands not a dash is left.
//   f48     "SOLAR" slides up 40 px over 14 frames on
//           Easing.bezier(0.16, 1, 0.3, 1) and stops.          — "solar"
//   f90-122 THE TOWER, the payoff and the only chain moment. The whole tower
//           rises as ONE body from behind the top course, clipped to the
//           course's top edge so it grows out of the foundation, 26 frames on
//           the same bezier: orange f90, purple f92, blue f94, white core and
//           its shadow f96. Each copy rises to ITS OWN top, so the leading
//           colour reads as a band above the next one all the way up and they
//           settle into the crown. Front-loaded: landed to the eye by ~f112.
//                                        — "for, like, AI"
//           THE COLOUR IS ONLY EVER ABOVE THE WHITE. The three copies are
//           clipped to the core's CURRENT top every frame (and to the plinth
//           top before the core exists), so no colour is ever visible through
//           the 10 px gaps between slabs or through an LED hole. Verified on
//           the render: 0 frames carry a purple or blue pixel below the core.
//   f97-108 THE LEDS light one slab at a time, each on the frame its own hole
//           clears the top-course edge — the power comes up out of the
//           foundation: f97 98 98 99 101 103 108, top slab first.
//   f112+   THE LEDS TOGGLE on a deterministic hashed schedule, each with its
//           own 5-9 frame period, never more than two changing on one frame
//           and never all off at once — a lamp holds for its period and blinks
//           dark for two frames, so five or six of the seven are lit at any
//           moment. The tower is running: the always-alive layer of the tail.
//   f108    "AI" slides up 60 px over 16 frames on the same bezier and stops
//           at f124.                                            — "AI" f112
// Nothing else happens. No glints, no bounces, no springs, no breathing.
//
// THE CAMERA — `runCamera2` (the house tracker with an x channel, same
// CAM_STIFF / CAM_DAMP), keyed k AND keyed content centre through `camMove`,
// so a re-centring and a zoom are one move and never two. cx stays 540: this
// cut is symmetric, so it only ever tilts and zooms.
//   OPEN  f0      k 1.35, centre C_FOOT. The rule runs off both edges and the
//                 silhouette is 600 px wide inside it.
//   PULL  f1-18   k 1.35 -> 0.89, centre held, warp 0.8. The silhouette's
//                 front is running for the frame edge and the camera has to
//                 pull back past it. It lands wide: from f22 there is over
//                 96 px of paper outside every piece of ink.
//                                                — "a lot of opportunity"
//   CREEP f60-88  k 0.89 -> 0.904, centre held, warp 1.0. The held breath
//                 under "be the foundation", and the tightest the frame gets
//                 after the pull: 97.4 px of margin at f90.
//   RISE  f88-102 k 0.904 -> 0.89, centre C_FOOT -> 835, warp 0.7. The camera
//                 goes up WITH the tower and lands on the whole block.
//   TAIL  f112-140 k 0.89 -> 0.904, centre held. Never parked.
//
//   THE DAMPED NUMBERS, what `runCamera2` actually produces:
//     f    k        cy         centre     vk        vcy
//     0    1.3500   1256.09    1163.50     0.0000     0.00
//     14   1.0650   1282.02    1164.65    -0.0324     3.53
//     30   0.8899   1303.94    1163.48    -0.0003     0.05
//     40   0.8899   1303.96    1163.50     0.0000    -0.00
//     48   0.8900   1303.95    1163.50     0.0000    -0.00   "solar" lands still
//     60   0.8900   1303.95    1163.50    -0.0000     0.00
//     80   0.8983   1302.65    1163.50     0.0007    -0.11
//     88   0.9028   1301.96    1163.50     0.0004    -0.06
//     96   0.8986   1176.16    1037.04    -0.0011   -26.48   the fast middle
//     108  0.8903    982.36     841.96    -0.0002    -3.65
//     112  0.8900    976.12     835.68    -0.0000    -0.75   "AI" lands still
//     124  0.8929    974.93     834.94     0.0005    -0.06
//     139  0.9024    973.52     835.00     0.0004    -0.07
//   max |dv| per channel: k 0.00477, cy 4.633 (max |v| k 0.0336, cy 27.02).
//   One acceleration lobe and one settle lobe per move: the pull's whole k
//   reversal is 4.1e-5 and the rise's cy reversal is 0. At f112 the camera is
//   moving 0.75 world px — 0.23% of the rise — so "AI" lands in a still frame.
//
//   THE ASSERTIONS, every frame 0..139, with the sway and the drift in:
//     * SIDE PADDING, f26 to the end, measured on EVERY piece of ink — the
//       cells, the silhouette's stroke, the rule, and all four hard shadows:
//       worst 97.4 px at f90 (right), and 102.7 px at f26. Gate 96. The
//       binding item is the bottom course's right-hand cell shadow at x 1028
//       against the creep's own peak k.
//     * SIDE PADDING, f0-25, on the moving front: worst 79.8 px at f17. Gate
//       60. The rule is the one exception and it is a sweep, not a park: it is
//       968 px wide, so at the opening k 1.35 it runs off BOTH edges, crosses
//       back into frame at f13 and passes 60 px at f17 and 96 px at f22. No
//       camera that opens at 1.35 can do otherwise.
//     * the lowest white ink on screen: worst 1292.4 px at f139 (v2: 1353.0).
//       Gate 1400 — the captions live below that line.
//     * the highest white ink on screen: worst 369.9 px at f139. Nothing is
//       ever cut by the top edge.
//     * the paper: max 0.8824 of source at the opening k, 0.7722 at rest —
//       never upscaled — and its margins never fall below 295.0 px sideways
//       or 499.1 px vertically, so no edge of the photograph can show.
//
// V2b — THE SIDE PADDING PASS, camera only, geometry untouched. On the user's
// note that the footing and the rule were almost touching the frame edge:
// every resting k comes down from 1.00-1.025 to 0.89-0.904 and the rule is
// shortened to the footing's own 56..1024. Nothing else moved: the same
// content centres, the same key frames, the same gestures, the same block
// centred on 835. The picture is 11% smaller on screen and carries 97-112 px
// of paper on both sides for the whole second half.
//
// DEVIATIONS from the brief, and why.
//   * THE RESTING k IS 0.89 AND THE CREEPS LAND ON 0.904, not 0.90 / 0.915 /
//     0.92. 96 px outside the cell shadow at x 1028 needs k <= 0.9043, so
//     0.915 and 0.92 would sit 5 and 8 px inside the gate. Holding the creep
//     peaks at 0.904 and dropping the rest to 0.89 keeps the creep's
//     amplitude at 0.014 of k — a creep the eye can find — where keeping the
//     rest at 0.90 would have left 0.004, which is a parked camera.
//   * THE PULL IS f1-18, NOT f10-40, and it goes to k 0.89, not 1.08. The
//     side gate decides it: the inOut-cubic wipe is at 98% of its width by
//     f22, and a damped tracker has to lead that by about eight frames, so
//     the keys end at f18. It costs smoothness — max |dv| on k is 0.00477
//     against v1's 0.00145 — and it buys the whole first act.
//   * THE CREEPS ARE 0.014 OF k, not the brief's 0.10. At k 1.08 the outer
//     panels would sit 14 px off the frame edge and at 1.10 4 px off; the
//     whole point of this pass is the opposite.
//   * THE RISE'S KEYS END AT f102, NOT f108. The centre travels 328.5 px in
//     this move; with keys to f108 the damper is still moving 3.6 px/frame at
//     f112 and "AI" lands in a travelling frame. At f102 it is moving 0.75.
//   * "AI" IS CLIPPED TO THE CROWN'S CURRENT TOP while it slides. A 60 px
//     slide starts the numeral 60 px below its rest, and its rest is only
//     18 px above the crown, so 39.6 px of the letters would otherwise be
//     drawn white-on-white over the tower. Clipped, it rises out from behind
//     the crown — and the clip is inert from f118, when the slide clears it.
//   * THE WIPE OPENS TO 492 PX EITHER SIDE, not the footing's own 484: the
//     extra 8 px is the silhouette stroke's 3 px and its shadow's 4 px, so the
//     outline is revealed whole rather than sliced down its edge. The
//     consumption clip uses the same 8 px, so nothing of the outline — ink or
//     shadow — survives the frame its course completes.
//   * THE WIPE OPENS AT +/-300, NOT the brief's +/-200. At 200 the frame only
//     reaches x 340..740 and the silhouette has no vertical and no step in
//     there: f0 was two parallel dashed lines, which is the note this pass
//     exists to fix. 300 takes in the top course's own ends (252 and 828) and
//     the first step, and the gate still holds at 41.2 px (320 would put it
//     at 40.3, which is no margin at all).
//   * THE TOP COURSE'S LAST TWO COLUMNS LAND ON f81 AND f84, not f82 and f84:
//     six columns a side over f66-84 is a 3.6 frame tick and the fifth lands
//     on 80.4. Both are inside "foundation" (f80-90). Forcing 82 would mean an
//     uneven tick, and the tick is the point.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";

// This cut's own background oversize — see the header.
const BG_OVERSIZE_SFN = 1.6;

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
  aiLabel: z.string(),
  beats: z.object({
    footprint: z.number(), // "a lot of opportunity" — the silhouette wipes open
    fill: z.number(), // "for solar"                 — the bottom course fills
    solar: z.number(), // "solar"                    — the label slides up
    middle: z.number(), // "kind of be, like"        — the middle course fills
    top: z.number(), // "be the foundation"          — the top course fills
    tower: z.number(), // "for, like, AI"            — the tower rises
    ai: z.number(), // "AI"                          — the label slides up
    toggle: z.number(), // the tower is running
    end: z.number(), // speech ends; tail to 140
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE GEOMETRY. Every number below is resolved from the panel module and
// Barlow's real cap height, so the block really is centred on the caption-safe
// line — and every one of them is exported, because the next cut in this clip
// picks this picture up where this one leaves it.
// ---------------------------------------------------------------------------
export const CONTENT_C = 835; // the content centre, on screen y 835 at every k
export const CENTRE_X = FRAME_W / 2;

export const CELL = 40;
export const CELL_GAP = 8;
export const CELL_PITCH = CELL + CELL_GAP; // 48
export const PANEL_COLS = 4;
export const PANEL_ROWS = 2;
export const PANEL_W = PANEL_COLS * CELL + (PANEL_COLS - 1) * CELL_GAP; // 184
export const PANEL_H = PANEL_ROWS * CELL + (PANEL_ROWS - 1) * CELL_GAP; // 88
export const PANEL_GAP = 12;
export const PANEL_PITCH = PANEL_W + PANEL_GAP; // 196
export const COURSE_GAP = 12;

// top -> bottom, because the tower stands on the first one.
export const COURSE_PANELS = [3, 4, 5];
export const COURSE_W = COURSE_PANELS.map((n) => n * PANEL_W + (n - 1) * PANEL_GAP); // 576 772 968
export const COURSE_X0 = COURSE_W.map((w) => CENTRE_X - w / 2); // 252 154 56
export const COURSE_X1 = COURSE_W.map((w) => CENTRE_X + w / 2); // 828 926 1024

// V2b: the rule spans the footing's OWN width rather than running past it, so
// it reads as the ground the footing stands on instead of a line heading for
// the frame edge — and its ends are what the new side gate is measured on.
export const RULE_X0 = 56;
export const RULE_X1 = 1024;
export const RULE_W = 6;
export const RULE_GAP = 8; // the rule stands clear of the bottom course
export const LABEL_DROP = 24; // "SOLAR" cap-top below the rule's bottom

export const SOLAR_SIZE = 56;
export const AI_SIZE = 190;
export const SOLAR_TRACK = 0.06; // em
const CAP = 0.7; // Barlow's cap height per em, measured on the shipped webfont

export const SLAB_W = 360;
export const SLAB_H = 56;
export const SLAB_GAP = 10;
export const SLAB_N = 7;
export const SLAB_PITCH = SLAB_H + SLAB_GAP; // 66
export const TOWER_H = SLAB_N * SLAB_H + (SLAB_N - 1) * SLAB_GAP; // 452
export const SLAB_X0 = CENTRE_X - SLAB_W / 2; // 360
export const LED = 20;
export const LED_INSET = 22; // from the slab's right end to the hole's right edge
export const LED_X = SLAB_X0 + SLAB_W - LED_INSET - LED; // 678
export const LED_DY = (SLAB_H - LED) / 2; // centred in the slab

export const CROWN_STEP = 18;
export const CROWN_OFFSETS = { blue: CROWN_STEP, purple: 2 * CROWN_STEP, orange: 3 * CROWN_STEP };
export const CROWN = CROWN_OFFSETS.orange; // the tower's silhouette above the core
export const AI_GAP = 18; // "AI" baseline above the crown's orange top

// How far the block reaches above and below the top course's top edge — which
// is the tower's foot, the one line everything else is measured from.
const BLOCK_UP = TOWER_H + CROWN + AI_GAP + CAP * AI_SIZE;
const BLOCK_DOWN =
  3 * PANEL_H + 2 * COURSE_GAP + RULE_GAP + RULE_W + LABEL_DROP + CAP * SOLAR_SIZE;

export const TOP_Y = CONTENT_C + (BLOCK_UP - BLOCK_DOWN) / 2; // 980.90
export const COURSE_Y = [TOP_Y, TOP_Y + PANEL_H + COURSE_GAP, TOP_Y + 2 * (PANEL_H + COURSE_GAP)];
export const FOOT_BOTTOM = COURSE_Y[2] + PANEL_H; // 1268.90
export const RULE_Y = FOOT_BOTTOM + RULE_GAP; // 1276.90
export const SOLAR_CAPTOP = RULE_Y + RULE_W + LABEL_DROP; // 1306.90
export const SOLAR_BASELINE = SOLAR_CAPTOP + CAP * SOLAR_SIZE; // 1346.10
export const CORE_TOP = TOP_Y - TOWER_H; // 528.90
export const CROWN_TOP = CORE_TOP - CROWN; // 474.90
export const AI_BASELINE = CROWN_TOP - AI_GAP; // 456.90
export const AI_INK_TOP = AI_BASELINE - CAP * AI_SIZE; // 323.90
export const BLOCK_TOP = AI_INK_TOP; // 323.90
export const BLOCK_BOTTOM = SOLAR_BASELINE; // 1346.10
// What the camera frames while the footing is all there is.
export const C_FOOT = (TOP_Y + SOLAR_BASELINE) / 2; // 1163.50

// -- the gestures ------------------------------------------------------------
export const WIPE_F0 = 0;
export const WIPE_F1 = 26;
export const WIPE_W0 = 300; // half-width at f0: frame 0 carries a real shape
export const WIPE_W1 = COURSE_W[2] / 2 + 8; // + the silhouette stroke and its shadow
export const OUTLINE_PAD = 8; // the same 8 px, used to eat the outline whole
export const DASH = "30 16";
export const DASH_MARCH = -0.6; // px per frame
export const STROKE = 6;

// [top, middle, bottom]: the window and the direction of each course's front.
export const FILL_WINDOWS = [
  { f0: 66, f1: 84, outward: true },
  { f0: 46, f1: 64, outward: false },
  { f0: 26, f1: 46, outward: true },
];

export const TOWER_TRAVEL = 26;
export const CHAIN_STAGGER = 2;
export const SOLAR_TRAVEL = 14;
export const SOLAR_RISE = 40;
export const AI_TRAVEL = 16;
export const AI_RISE = 60;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

// -- the camera --------------------------------------------------------------
// V2b, on the user's note that the footing and the rule were almost touching
// the frame edge: every k that was 1.00-1.025 comes down to 0.89-0.904. The
// gate is now 96 screen px of paper outside EVERY piece of ink, the rule and
// every hard shadow included, from the frame the wipe is open (f26) to the
// end. The binding item is the bottom course's right-hand cell shadow at
// x 1028: 540 - 491k >= 96 needs k <= 0.9043, so the creeps land on 0.904 and
// the rest sits at 0.89 — which keeps a creep you can see (0.014 of k) rather
// than the 0.004 that a 0.90 rest would have allowed.
export const K_OPEN = 1.35;
export const K_WIDE = 0.89;
export const K_CREEP = 0.904;
export const K_REST = 0.89;
export const K_TAIL = 0.904;
export const PULL_F0 = 1;
export const PULL_F1 = 18; // the damper has to lead the wipe by about eight frames
export const PULL_WARP = 0.8;
export const CREEP_F0 = 60;
export const CREEP_F1 = 88;
export const CREEP_WARP = 1.0;
export const RISE_F0 = 88;
export const RISE_F1 = 102; // 108 leaves the camera moving under "AI"
export const RISE_WARP = 0.7;
export const TAIL_F0 = 112;
export const TAIL_F1 = DURATION;
export const TAIL_WARP = 1.0;

const PULL = camMove({
  f0: PULL_F0,
  f1: PULL_F1,
  k0: K_OPEN,
  k1: K_WIDE,
  c0: C_FOOT,
  c1: C_FOOT,
  warp: PULL_WARP,
});
const CREEP = camMove({
  f0: CREEP_F0,
  f1: CREEP_F1,
  k0: K_WIDE,
  k1: K_CREEP,
  c0: C_FOOT,
  c1: C_FOOT,
  warp: CREEP_WARP,
});
const RISE = camMove({
  f0: RISE_F0,
  f1: RISE_F1,
  k0: K_CREEP,
  k1: K_REST,
  c0: C_FOOT,
  c1: CONTENT_C,
  warp: RISE_WARP,
});
const TAIL = camMove({
  f0: TAIL_F0,
  f1: TAIL_F1,
  k0: K_REST,
  k1: K_TAIL,
  c0: CONTENT_C,
  c1: CONTENT_C,
  warp: TAIL_WARP,
});

// CREEP's last key and RISE's first are the same frame carrying the same
// value, so RISE contributes from its second key on and the track stays
// strictly increasing, which `interpolate` requires.
export const SFN_CAM_F = [0, ...PULL.F, ...CREEP.F, ...RISE.F.slice(1), ...TAIL.F];
export const SFN_CAM_K = [K_OPEN, ...PULL.K, ...CREEP.K, ...RISE.K.slice(1), ...TAIL.K];
export const SFN_CAM_CY = [
  C_FOOT + CAM_LIFT / K_OPEN,
  ...PULL.CY,
  ...CREEP.CY,
  ...RISE.CY.slice(1),
  ...TAIL.CY,
];
export const SFN_CAM_CX = SFN_CAM_F.map(() => CENTRE_X);

// `runCamera` damps cy and k only. This is `PeakForSolar`'s `runCamera2`, the
// same house tracker on the same CAM_STIFF / CAM_DAMP with an x channel, so
// this file owns its camera and `fieldShared` is not touched. cx is constant
// here — the cut is symmetric — but the runner stays the house one.
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

// ---------------------------------------------------------------------------
// THE FILL SCHEDULE. A column is two cells and they switch on together; the
// front is linear in column index, so each course ticks evenly. Nothing here
// is a timer — the silhouette is eaten by these same numbers.
// ---------------------------------------------------------------------------
export type Column = { panel: number; x: number; on: number };
export type Course = {
  index: number;
  panels: number;
  x0: number;
  x1: number;
  y0: number;
  outward: boolean;
  columns: Column[];
};

const columnsOf = (x0: number, panels: number) => {
  const out: { panel: number; x: number }[] = [];
  for (let p = 0; p < panels; p++) {
    for (let c = 0; c < PANEL_COLS; c++) {
      out.push({ panel: p, x: x0 + p * PANEL_PITCH + c * CELL_PITCH });
    }
  }
  return out;
};

const schedule = (
  cols: { panel: number; x: number }[],
  { f0, f1, outward }: { f0: number; f1: number; outward: boolean },
): Column[] => {
  const left = cols.filter((c) => c.x + CELL <= CENTRE_X);
  const right = cols.filter((c) => c.x >= CENTRE_X);
  // Two fronts. Out of the centre joint, or in from the two outer ends.
  const L = [...left].sort((a, b) => (outward ? b.x - a.x : a.x - b.x));
  const R = [...right].sort((a, b) => (outward ? a.x - b.x : b.x - a.x));
  const at = new Map<number, number>();
  const put = (arr: { x: number }[]) =>
    arr.forEach((c, j) => at.set(c.x, f0 + (j * (f1 - f0)) / (arr.length - 1)));
  put(L);
  put(R);
  // A cell exists from the first whole frame at or after its own threshold.
  return cols.map((c) => ({ ...c, on: Math.ceil((at.get(c.x) as number) - 1e-9) }));
};

export const COURSES: Course[] = COURSE_PANELS.map((panels, i) => ({
  index: i,
  panels,
  x0: COURSE_X0[i],
  x1: COURSE_X1[i],
  y0: COURSE_Y[i],
  outward: FILL_WINDOWS[i].outward,
  columns: schedule(columnsOf(COURSE_X0[i], panels), FILL_WINDOWS[i]),
}));

// How far the course's own front has eaten, as a distance from x 540. Outward
// courses report the outer edge of the furthest cell they have placed; inward
// courses report the inner edge of the nearest one. Before a course starts,
// the value is pushed past the whole picture so nothing of it is consumed.
const frontHalf = (course: Course, frame: number) => {
  const live = course.columns.filter((c) => frame >= c.on);
  if (course.outward) {
    if (live.length === 0) {
      return -1e4;
    }
    return Math.max(
      ...live.map((c) =>
        Math.max(Math.abs(c.x - CENTRE_X), Math.abs(c.x + CELL - CENTRE_X)),
      ),
    );
  }
  if (live.length === 0) {
    return 1e4;
  }
  return Math.min(
    ...live.map((c) => Math.min(Math.abs(c.x - CENTRE_X), Math.abs(c.x + CELL - CENTRE_X))),
  );
};

// THE SILHOUETTE: one closed path around the whole stepped footing, drawn
// clockwise from the top course's top-left. The step lines sit on the course
// tops, so the outline hugs each course's own ends.
//
// Its BOTTOM EDGE is inset 4 px up from the footing's own bottom. On the line
// itself the 6 px stroke straddles the edge and its shadow reaches 4 px past
// that, which put the dashed state 1 px off the rule while the built state
// stands 4 px clear — the plan looked tighter than the building. Inset, the
// dash's shadow lands 5 px off the rule and the two states agree.
export const SILHOUETTE_FOOT_INSET = 4;
const SILHOUETTE = (() => {
  const foot = FOOT_BOTTOM - SILHOUETTE_FOOT_INSET;
  const pts: [number, number][] = [[COURSE_X0[0], COURSE_Y[0]], [COURSE_X1[0], COURSE_Y[0]]];
  for (let i = 1; i < COURSE_Y.length; i++) {
    pts.push([COURSE_X1[i - 1], COURSE_Y[i]], [COURSE_X1[i], COURSE_Y[i]]);
  }
  pts.push([COURSE_X1[2], foot], [COURSE_X0[2], foot]);
  for (let i = COURSE_Y.length - 1; i >= 1; i--) {
    pts.push([COURSE_X0[i], COURSE_Y[i]], [COURSE_X0[i - 1], COURSE_Y[i]]);
  }
  return `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
})();

// The y band each course owns for the purpose of eating the outline. The step
// stroke on a course's top line belongs to that course.
const BAND = COURSE_Y.map((y, i) => ({
  y0: i === 0 ? y - 20 : y - 4,
  y1: i === COURSE_Y.length - 1 ? FOOT_BOTTOM + 20 : COURSE_Y[i + 1] - 4,
}));

// ---------------------------------------------------------------------------
// THE LEDS. Each one lights on the frame its own hole clears the top course's
// edge during the rise — the power comes up out of the foundation — and from
// `toggle` they run on their own hashed periods. The schedule is built once,
// deterministically: at most two LEDs change on any frame, and the tower is
// never dark.
// ---------------------------------------------------------------------------
export const LED_PERIODS = Array.from({ length: SLAB_N }, (_, i) => 5 + Math.floor(hash(i, 17) * 5));
// A lit LED holds for its own period and blinks dark for two frames. A plain
// 50/50 toggle was tried first and the tower random-walked down to one lamp by
// the tail, which reads as a building shutting down rather than running.
export const LED_OFF_FRAMES = 2;

const ledRiseDy = (frame: number) =>
  (1 -
    interpolate(frame, [96, 96 + TOWER_TRAVEL], [0, 1], { easing: EASE_LAND, ...clamp })) *
  TOWER_H;

export const LED_LIT_AT = Array.from({ length: SLAB_N }, (_, i) => {
  const bottomAtRest = CORE_TOP + i * SLAB_PITCH + LED_DY + LED;
  for (let f = 96; f <= DURATION; f++) {
    if (bottomAtRest + ledRiseDy(f) <= TOP_Y) {
      return f;
    }
  }
  return DURATION;
});

const buildLedSchedule = (toggleAt: number) => {
  const state = new Array<boolean>(SLAB_N).fill(true);
  const next = LED_PERIODS.map((p, i) => toggleAt + 1 + Math.floor(hash(i, 31) * p));
  const out: boolean[][] = [];
  for (let f = 0; f <= DURATION; f++) {
    if (f >= toggleAt) {
      let flips = 0;
      for (let i = 0; i < SLAB_N && flips < 2; i++) {
        if (next[i] <= f) {
          // Never all off: a flip that would darken the whole tower is skipped,
          // and only the clock moves on.
          const after = state.map((s, j) => (j === i ? !s : s));
          if (after.some(Boolean)) {
            state[i] = after[i];
          }
          next[i] = f + (state[i] ? LED_PERIODS[i] : LED_OFF_FRAMES);
          flips++;
        }
      }
    }
    out.push([...state]);
  }
  return out;
};

export const LED_SCHEDULE = buildLedSchedule(112);

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
  aiLabel: "AI",
  beats: {
    footprint: 0,
    fill: 26,
    solar: 48,
    middle: 46,
    top: 66,
    tower: 90,
    ai: 108,
    toggle: 112,
    end: 124,
  },
});

// ---------------------------------------------------------------------------
// THE GROUND. `PeakForSolar`'s `PaperGround`, unchanged: parallax off the
// camera's own rest in both axes, the same -0.3 px/frame drift, the same
// 1 + (k - 1) * 0.3 scale, `objectFit: cover`, `rotate(90deg)` innermost so
// the landscape photograph covers the portrait box with its squares square,
// and the knock-back on the image and nothing else.
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
          width: FRAME_H * BG_OVERSIZE_SFN,
          height: FRAME_W * BG_OVERSIZE_SFN,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const CLIP_WIPE = "sfn-wipe";
const CLIP_EAT = "sfn-unbuilt";
const CLIP_PLINTH = "sfn-above-the-plinth";
const CLIP_CROWN = "sfn-above-the-core";
const CLIP_AI = "sfn-above-the-crown";

// A slab: the 360 x 56 block with its LED hole punched out, so the paper shows
// through the hole. The outer rect and the hole are given separately, because
// the shadow layer offsets the rect by +4/+4 and leaves the hole exactly where
// the white one is — so an unlit LED is a clean square of paper with nothing
// black inside it.
const slabPath = (ox: number, oy: number, hx: number, hy: number) =>
  `M${ox} ${oy} h${SLAB_W} v${SLAB_H} h${-SLAB_W} Z M${hx} ${hy} h${LED} v${LED} h${-LED} Z`;

const SolarFoundation: React.FC<Props> = ({
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
  aiLabel,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, SFN_CAM_F, SFN_CAM_CY, SFN_CAM_CX, SFN_CAM_K);
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

  // THE WIPE. One symmetric clip-rect out of x 540; already 400 px wide at f0.
  const wipeHalf = interpolate(frame, [WIPE_F0, WIPE_F1], [WIPE_W0, WIPE_W1], {
    easing: Easing.inOut(Easing.cubic),
    ...clamp,
  });

  // WHAT IS STILL UNBUILT, per course: the strip of the world where that
  // course's front has not arrived, which is exactly where the silhouette is
  // still allowed to exist.
  const unbuilt = COURSES.map((course) => {
    const h = frontHalf(course, frame);
    const band = BAND[course.index];
    if (course.outward) {
      const edge = h + OUTLINE_PAD;
      return [
        { x: -2000, w: 2000 + CENTRE_X - edge, y: band.y0, h: band.y1 - band.y0 },
        { x: CENTRE_X + edge, w: 2000, y: band.y0, h: band.y1 - band.y0 },
      ];
    }
    const edge = h - OUTLINE_PAD;
    return edge <= 0
      ? []
      : [{ x: CENTRE_X - edge, w: 2 * edge, y: band.y0, h: band.y1 - band.y0 }];
  }).flat();

  // THE TOWER. One body, four copies, each rising to its own top.
  const chain = [
    { key: "orange", color: orange, start: beats.tower, extra: CROWN_OFFSETS.orange },
    { key: "purple", color: purple, start: beats.tower + CHAIN_STAGGER, extra: CROWN_OFFSETS.purple },
    { key: "blue", color: blue, start: beats.tower + 2 * CHAIN_STAGGER, extra: CROWN_OFFSETS.blue },
  ];
  const coreStart = beats.tower + 3 * CHAIN_STAGGER;
  const coreDy = travelled(coreStart, TOWER_TRAVEL, TOWER_H);
  const coreTopNow = CORE_TOP + coreDy;
  const crownTopNow = CROWN_TOP + travelled(beats.tower, TOWER_TRAVEL, TOWER_H + CROWN);
  // Colour is only ever a band ABOVE the white: the copies are cut off at the
  // core's current top, or at the plinth before the core exists.
  const crownClipAt = frame >= coreStart ? coreTopNow : TOP_Y;

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

  // A course's cells: a whole panel's shadow layer first, then its white.
  const courseCells = (course: Course) => (
    <g key={`course-${course.index}`}>
      {Array.from({ length: course.panels }, (_, p) => {
        const live = course.columns.filter((c) => c.panel === p && frame >= c.on);
        if (live.length === 0) {
          return null;
        }
        const cells: { x: number; y: number }[] = [];
        live.forEach((c) => {
          for (let r = 0; r < PANEL_ROWS; r++) {
            cells.push({ x: c.x, y: course.y0 + r * CELL_PITCH });
          }
        });
        return (
          <g key={`panel-${course.index}-${p}`}>
            {cells.map((c) => (
              <rect
                key={`s-${c.x}-${c.y}`}
                x={c.x + shadowOffset}
                y={c.y + shadowOffset}
                width={CELL}
                height={CELL}
                fill={shadow}
              />
            ))}
            {cells.map((c) => (
              <rect key={`c-${c.x}-${c.y}`} x={c.x} y={c.y} width={CELL} height={CELL} fill={ink} />
            ))}
          </g>
        );
      })}
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={SFN_CAM_CY[0]}
        cx={cx}
        cxRest={SFN_CAM_CX[0]}
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
              {/* the symmetric wipe out of x 540 */}
              <clipPath id={CLIP_WIPE}>
                <rect x={CENTRE_X - wipeHalf} y={-4000} width={2 * wipeHalf} height={12000} />
              </clipPath>
              {/* what is still unbuilt: the silhouette lives here and nowhere
                  else, so each course's own front eats its own outline */}
              <clipPath id={CLIP_EAT}>
                {unbuilt.map((r, i) => (
                  <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />
                ))}
              </clipPath>
              {/* everything above the top course's top edge: the tower grows
                  out of the foundation rather than sliding past it */}
              <clipPath id={CLIP_PLINTH}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + TOP_Y} />
              </clipPath>
              {/* everything above the core's CURRENT top: colour is only ever a
                  band over the white, never a glow through a gap or a hole */}
              <clipPath id={CLIP_CROWN}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + crownClipAt} />
              </clipPath>
              {/* everything above the crown's current top, so "AI" slides up
                  from behind the tower instead of over it */}
              <clipPath id={CLIP_AI}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + crownTopNow} />
              </clipPath>
            </defs>

            {/* THE TOWER, behind the foundation and clipped to its top edge. */}
            <g clipPath={`url(#${CLIP_PLINTH})`}>
              {/* the core's shadow, at the very back, on the core's own timing
                  so no grey ghost precedes the white */}
              {frame >= coreStart
                ? Array.from({ length: SLAB_N }, (_, i) => (
                    <path
                      key={`slab-shadow-${i}`}
                      d={slabPath(
                        SLAB_X0 + shadowOffset,
                        CORE_TOP + i * SLAB_PITCH + coreDy + shadowOffset,
                        LED_X,
                        CORE_TOP + i * SLAB_PITCH + coreDy + LED_DY,
                      )}
                      fill={shadow}
                      fillRule="evenodd"
                    />
                  ))
                : null}

              {/* the chain: three solid copies in the core's own column, each a
                  step taller, arriving two frames apart ahead of it */}
              <g clipPath={`url(#${CLIP_CROWN})`}>
                {chain.map((c) =>
                  frame >= c.start ? (
                    <rect
                      key={c.key}
                      x={SLAB_X0}
                      y={
                        TOP_Y -
                        (TOWER_H + c.extra) +
                        travelled(c.start, TOWER_TRAVEL, TOWER_H + c.extra)
                      }
                      width={SLAB_W}
                      height={TOWER_H + c.extra}
                      fill={c.color}
                    />
                  ) : null,
                )}
              </g>

              {/* the white core: seven slabs, one body, each with its hole */}
              {frame >= coreStart
                ? Array.from({ length: SLAB_N }, (_, i) => (
                    <path
                      key={`slab-${i}`}
                      d={slabPath(
                        SLAB_X0,
                        CORE_TOP + i * SLAB_PITCH + coreDy,
                        LED_X,
                        CORE_TOP + i * SLAB_PITCH + coreDy + LED_DY,
                      )}
                      fill={ink}
                      fillRule="evenodd"
                    />
                  ))
                : null}

              {/* the LEDs: lit from the frame the hole clears the course edge,
                  and running on their own periods from `toggle` */}
              {frame >= coreStart
                ? Array.from({ length: SLAB_N }, (_, i) =>
                    frame >= LED_LIT_AT[i] && LED_SCHEDULE[Math.min(frame, DURATION)][i] ? (
                      <rect
                        key={`led-${i}`}
                        x={LED_X}
                        y={CORE_TOP + i * SLAB_PITCH + LED_DY + coreDy}
                        width={LED}
                        height={LED}
                        fill={orange}
                      />
                    ) : null,
                  )
                : null}
            </g>

            {/* THE SILHOUETTE: one dashed outline of the whole stepped footing,
                revealed by the wipe and eaten by the three fronts. */}
            <g clipPath={`url(#${CLIP_WIPE})`}>
              <g clipPath={`url(#${CLIP_EAT})`}>
                <path
                  d={SILHOUETTE}
                  fill="none"
                  stroke={shadow}
                  strokeWidth={STROKE}
                  strokeDasharray={DASH}
                  strokeDashoffset={DASH_MARCH * frame}
                  transform={`translate(${shadowOffset} ${shadowOffset})`}
                />
                <path
                  d={SILHOUETTE}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeDasharray={DASH}
                  strokeDashoffset={DASH_MARCH * frame}
                />
              </g>
            </g>

            {/* THE FILL, top course first so the running bond reads upward. */}
            {COURSES.map((course) => courseCells(course))}

            {/* THE RULE. It exists from frame 0 and never moves, and it stands
                8 px clear of the bottom course. */}
            <rect
              x={RULE_X0 + shadowOffset}
              y={RULE_Y + shadowOffset}
              width={RULE_X1 - RULE_X0}
              height={RULE_W}
              fill={shadow}
            />
            <rect x={RULE_X0} y={RULE_Y} width={RULE_X1 - RULE_X0} height={RULE_W} fill={ink} />

            {/* "SOLAR" — it slides up 40 px and stops. */}
            {frame >= beats.solar
              ? shadowedText(
                  "solar",
                  solarLabel,
                  CENTRE_X,
                  SOLAR_BASELINE + travelled(beats.solar, SOLAR_TRAVEL, SOLAR_RISE),
                  SOLAR_SIZE,
                  SOLAR_TRACK,
                )
              : null}

            {/* "AI" — it slides up 60 px out from behind the crown and stops. */}
            {frame >= beats.ai ? (
              <g clipPath={`url(#${CLIP_AI})`}>
                {shadowedText(
                  "ai",
                  aiLabel,
                  CENTRE_X,
                  AI_BASELINE + travelled(beats.ai, AI_TRAVEL, AI_RISE),
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

export default SolarFoundation;
