import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  camMove,
  clamp,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const FPS = 24;
// Clip "joel - jeff dean is betting on solar for ai", SRT cues 84-98. The
// composition starts at 19.379 s; speech ends at 24.579 s.
// round((24.579 - 19.379) * 24) = 125 frames of speech, plus a 16 frame tail
// so the docked battery holds = 141.
export const DURATION = 141;

// ---------------------------------------------------------------------------
// "SAME TRAJECTORY". The third cut of this clip and the sister of
// `LearningCurve` and `SolarFoundation`: the same paper, the same +4/+4 hard
// shadow drawn as an SVG copy of the shape, the same Barlow, the same chain,
// the same `runCamera2` on a keyed k AND a keyed content centre.
//
// THE LINE: "(it's on this) like, kind of same trajectory as AI growth. And
// when you combine solar and batteries," — the editor cuts to the speaker right
// after "batteries", so the second half only has to SET THE THOUGHT UP.
//
// THE PICTURE. One world, larger than the frame. At its root a solar PANEL,
// drawn at 2x the sister cuts' cell (80 px cells, 16 px gaps) because this is a
// CLOSE-UP noun and not a chart. A white line — solar's trajectory — rises out
// of the panel's top-right corner. Above it runs AI's ribbon: the three chain
// stripes on an exponential C with THE CORE SLOT ON C ITSELF EMPTY. The white
// line converges up into that empty slot and from the merge point M onward the
// two run as ONE four-stripe ribbon. That is "same trajectory". Then the camera
// pulls back, the whole sweep is revealed with the panel at its root, it pushes
// back in on the panel, and a BATTERY docks under it and starts charging.
//
// THE COLOUR JOBS, raw hex, no blend, no glow, no gradient, opacity 1 only, and
// nothing ever fades — a layer exists or it does not:
//   white #FFFFFF   SOLAR. The panel, the rising line, the battery, the labels.
//   orange #FFB765 / purple #BC37FF / blue #0046FF — the CORE MEMORY chain, and
//   in this cut as in its two sisters it has ONE job: it is AI, and it is on
//   the ribbon and on nothing else.
//
// THE MATERIAL IS PAPER, copied from the sisters down to the number:
// `public/paper-supaclean-still.png`, 3864 x 2164 landscape, on its own plane at
// parallax 0.15 in both axes with the same -0.3 px/frame drift and the same
// 1 + (k - 1) * 0.3 scale, knocked back with `brightness(0.88) blur(3px)` on the
// image and nothing else, over a #C0C0C0 root.
//   A LOCAL BG_OVERSIZE OF 1.6, as in both sisters. `objectFit: cover` solves
//   3864 x 2164 into 3072 x 1728 at 0.79852 of source; the tightest camera here
//   is the tail's k 1.035 (bgScale 1.0105), so the photograph is drawn at
//   0.8070 of source at worst and NEVER UPSCALED.
//   COVERAGE. This cut PANS — cx runs 1070.65 -> 540 — so the parallax plane has
//   a real horizontal offset for the first time in the set. Worst |bgX| 103.2
//   px and worst |bgY| 110.7 px, against a MEASURED worst margin of 229.3 px
//   sideways and 411.3 px vertically over all 141 frames. The paper cannot show
//   an edge.
//
// ---------------------------------------------------------------------------
// THE GEOMETRY, world px. Barlow's cap height is 0.700 em, measured off the
// shipped webfont in `PeakForSolar` and confirmed on both sisters' renders.
//
//   THE STACK, centred on x 540, its block (top label ink-top .. bottom label
//   ink-bottom) centred on y 835 — the caption-safe content centre `CAM_LIFT`
//   puts on screen y 835 at every k.
//     PANEL      4 x 2 cells of 80 x 80 with 16 px gaps -> 368 x 176,
//                x 356..724, y 651..827. Every cell carries its own +4/+4
//                shadow, so the paper's squares show through the gaps and a
//                white block reads as a solar panel.
//     BATTERY    the same 368 x 176 footprint 16 px under the panel,
//                y 843..1019: a 12 px white outline drawn INSIDE the footprint
//                (rect 362..718 / 849..1013 stroked 12), a terminal nub
//                16 x 64 centred on its right side (x 724..740, y 899..963),
//                and four charge segments 66 x 120 at x 384 / 466 / 548 / 630,
//                y 871..991 — 16 px apart and 16 px clear of the outline's
//                inner edge on all four sides.
//     "SOLAR"    900 / 56 / 0.06em, centred on 540, baseline 627 (24 px above
//                the panel), ink top 587.8.
//     "BATTERIES" the same, cap-top 1043 (24 px below the battery), baseline
//                1082.2.
//     THE BLOCK is 587.8 .. 1082.2 and its centre is 835.000.
//
//   CURVE C, the same exponential family as `LearningCurve`'s g, solved on the
//   brief's two anchors:
//     C(x) = 500 - 180 * 2^((x - 1144) / 184)
//     * M = (1144, 320.000) = the panel's top-right corner (724, 651) + (420,
//       -331). Brief: (+420, -330).
//     * the head's rest = (1624, -597.91) = that corner + (900, -1248.91).
//       Brief: (+900, -1250).
//     * 500 is C's own asymptote to the left, so the ribbon FLATTENS off-frame
//       instead of diving: its lowest ink anywhere is blue's lower edge at
//       C - 10 * |n| + 5 -> 493.46 at worst, which is 94.34 px above "SOLAR"'s
//       ink top 587.8. Gate 60.
//     C is drawn from x -120, which is off-frame left at EVERY framing this
//     camera reaches (the leftmost frame edge in the whole cut is world x -2.2,
//     at f90), so the AI ribbon has no visible start.
//
//   THE RIBBON is `LearningCurve`'s exactly: stroke 10, butt caps, three copies
//   offset ACROSS the curve by 10 / 20 / 30 (the vertical shift scaled by the
//   local |(1, C')|, so a stripe is 10 px wide measured across the ribbon at
//   every x), stacked orange (back) -> purple -> blue -> the white core in
//   front, and the core's +4/+4 shadow at the very back. AI_RIM = 35 across.
//
//   WHITE LINE W, stroke 10 + its own shadow, starts EXACTLY on the panel's
//   top-right corner:
//     W(x) = C(x) + D * (1 - smoothstep((x - 724) / 420)),  D = 187.9946
//     * W(724) = 651.000000000 = the panel's top edge, on its right edge.
//       Residual 0.000e+0 px.
//     * smoothstep has zero slope at both ends, so at M the offset is
//       0.000e+0 px AND W'(1144) - C'(1144) = -1.6e-7 (a finite-difference
//       floor): the white does not arrive at an angle, it SLIDES into the core
//       slot tangentially.
//     * from M on, W IS C, so one path draws the converging line and the
//       ribbon's core.
//
//   "AI"  900 / 120, centred on the orange head, baseline 26 px above the
//   ribbon's top edge there, as in `LearningCurve`.
//
// ---------------------------------------------------------------------------
// THE GESTURES — ONE CONTINUOUS MOTION. Gestures lead; the words are where they
// land. Word onsets, frame = round((t - 19.379) * 24): like 0 / kind 3 / of 7 /
// same 9 / trajectory 13 / as 24 / AI 35 / growth 44 / and 53 / when 62 /
// you 66 / combine 69 / solar 85 / and 97 / batteries 109 (ends 125).
//
//   f0-14   SAME TRAJECTORY. Both heads are ALREADY IN FLIGHT at f0, 172.3 px
//           (in x) short of M: the three colour stripes drawn from off-frame
//           left up to their heads, the white line drawn from the panel up to
//           its head, 68.95 world px BELOW the empty core slot and closing.
//           ONE linear head track carries all four — 12.3077 px/frame in x, so
//           the merge is not a change of speed — with the colours leading the
//           white by 2 / 4 / 6 frames' worth, as in `LearningCurve`. The gap
//           closes to zero at f14, inside "trajectory" (f13-24). No flash, no
//           bounce, no contact mark: W and C agree in value AND in slope there,
//           so the white simply becomes the core.
//                              — "same" f9, "trajectory" f13-24
//   f14-53  AI GROWTH. The merged four-stripe head runs on up C on the same
//           linear track and reaches its rest x 1624 at f53, the end of
//           "growth".                       — "as" f24, "AI" f35, "growth" f44
//   f35     "AI" slides up 110 px over 14 frames out from behind the ribbon's
//           own crest — exactly the distance that hides it — and from f49 it
//           RIDES the head.                                        — "AI" f35
//   f53+    THE CREEP. The head keeps running along the same exponential at
//           0.25 px/frame in x to the last frame and the label rides it: AI
//           keeps growing under the whole second half. This is the tail's alive
//           layer, and it is why the resting frame is never parked.
//   f88-109 THE DOCK. The battery — outline + nub, segments EMPTY — slides UP
//           830 px from below the frame's own bottom edge into its seat over
//           21 frames, landing on "batteries". It is born at f88, not f95, so
//           that the stretch between the push landing and the word carries a
//           moving object instead of a still frame.            — "batteries" f109
//   f109    "BATTERIES" slides up 40 px over 14 frames and stops.
//   f112 119 126  THE CHARGE. Three of the four segments tick in left to right,
//           exist/don't, no fade. THE FOURTH STAYS EMPTY at the last frame: the
//           battery is still charging and the thought is unfinished, which is
//           exactly where the editor cuts away.
// Nothing else. No plus sign, no wires, no glints, no pulses, no arrows, no
// numerals, no dots.
//
// ---------------------------------------------------------------------------
// THE CAMERA — `runCamera2`, the house tracker with an x channel on the same
// CAM_STIFF / CAM_DAMP, keyed k AND a keyed CONTENT CENTRE through `camMove`,
// so a re-centring and a zoom are one move and never two. THIS CUT'S CAMERA IS
// THE STORYTELLING: it opens in close-up on two heads about to meet, pulls back
// to show where the line came from, and pushes into the panel for the battery.
//   OPEN   f0      k 1.700, cx 1070.65, centre 408.78 (the midpoint of the two
//                  heads). A CLOSE-UP: the ribbon is 17 screen px a stripe and
//                  the empty core slot is 17 px of paper, so the mechanism is
//                  legible before it happens. The panel is 25 world px off the
//                  left frame edge (42.5 screen px) and never touches it.
//   TRACK  f0-24   cx 1070.65 -> 1241, centre 408.78 -> 220, k held, warp 0.8.
//                  The camera follows the heads WITHOUT CHASING them: the head
//                  midpoint travels 295 px in x while cx takes 170, so the
//                  subject crosses the frame left to right and rises ~125
//                  screen px while the merge happens under it.
//   PULL   f26-43  k 1.700 -> 0.650, cx 1241 -> 1023, centre 220 -> 80,
//                  warp 0.8. THE REVEAL: solar's line comes from a panel. Keys
//                  end at f43; the camera is down to 1.5 screen px/frame at
//                  f53, so the head's own landing is a still frame.
//   HOLD   f48-52  k 0.650 -> 0.660, held otherwise. The breath on "and when
//                  you"; the damped k dips to 0.6564 at f53 and turns there.
//   PUSH   f52-72  k 0.660 -> 1.350, cx 1023 -> 540, centre 80 -> 835. warp
//                  1.0 on k and the centre (a plain smoothstep: ease in AND
//                  out), warp 0.7 on x so THE PAN LEADS THE ZOOM. The biggest
//                  move in the cut. It is down to 0.4 screen px/frame at
//                  "solar" f85, so the word lands in a still frame.
//   CREEP  f85-140 k 1.350 -> 1.390, held otherwise. Never parked.
//
//   THE DAMPED NUMBERS, what `runCamera2` actually produces (cx and cy carry
//   the hand's own sway):
//     f     k        cy        cx       centre     vk        vcy      vcx
//     0    1.7000    482.31   1070.65    408.78    0.0000     0.00     0.00
//     9    1.7000    442.09   1106.94    368.56    0.0000    -8.75     7.89
//     13   1.7000    401.89   1143.22    328.36    0.0000   -10.50     9.47
//     24   1.7000    308.86   1227.16    235.34    0.0000    -4.97     4.49
//     35   1.3515    268.56   1168.63    176.07   -0.0719    -4.31   -14.84
//     44   0.7677    264.43   1047.46    101.61   -0.0404     1.87    -8.40
//     53   0.6564    271.09   1021.56     80.67   -0.0002     0.19    -2.22   the head lands
//     60   0.7551    352.63    895.73    187.08    0.0282    24.56   -28.37
//     69   1.1359    713.05    638.51    603.01    0.0436    42.99   -22.92   the push's middle
//     82   1.3487    926.20    540.37    833.52    0.0014     1.41    -0.53
//     85   1.3503    927.86    539.80    835.29    0.0003     0.27    -0.08   "solar" lands still
//     97   1.3525    927.46    539.99    835.04    0.0005    -0.05     0.01
//     109  1.3619    926.78    540.00    835.00    0.0010    -0.07    -0.00   "batteries"
//     125  1.3787    925.67    540.00    835.00    0.0010    -0.07    -0.00
//     140  1.3890    924.99    540.00    835.00    0.0003    -0.02     0.00
//   max |dv| per channel: k 0.01089, cy 5.4283, cx 4.6055. One acceleration
//   lobe and one settle lobe per move
//   on every channel. The k figure is about twice the sisters' because this
//   camera changes zoom by 2.6x in the pull and by 1.5x again in the push,
//   where they only ever moved by 1.5x in total.
//
// ---------------------------------------------------------------------------
// THE MEASUREMENTS. Predicted frame by frame with the sway and the drift in,
// and then MEASURED on all 141 rendered frames by thresholding the ink out of
// the paper (white > 240, black < 90, or saturation > 70).
//   GEOMETRY, exact:
//     * the block is 587.8 .. 1082.2 and its centre is 835.000.
//     * M = (1144, 320.000) = the panel's corner + (420, -331). The head's rest
//       = (1624, -597.91) = that corner + (900, -1248.91).
//     * W(724) - 651 = 0.000e+0 px: the white line starts EXACTLY on the
//       panel's top-right corner.
//     * at M, W - C = 0.000e+0 px and W' - C' = -1.6e-7 (a finite-difference
//       floor, not a real offset): value AND slope match, so the white slides
//       into the core slot instead of arriving at an angle.
//     * the ribbon's lowest ink anywhere is 493.46, which is 94.34 px above
//       "SOLAR"'s ink top. Gate 60.
//   CLEARANCE, line ink vs stack ink, swept at 2 px on every frame:
//     * 31.05 px at its tightest, measuring the white line from 40 px past its
//       own root. Gate 24. (At the root itself the clearance is 0 by
//       construction — see DEVIATIONS.)
//     * MEASURED ON THE RENDER: every one of the panel's eight cell interiors,
//       sampled 6 world px inside its own edges, on all 141 frames — 1,128 cell
//       interiors. ZERO of them carry a non-white pixel. No line ink, no chain
//       and no shadow is ever visible on the panel.
//   FRAMING, measured on the render (rows that only the stack occupies, so the
//   white line's own run to the frame edge cannot be mistaken for it):
//     * the stack's side padding, f52 to the end: 100 px at its worst (f52).
//       Gate 96. Predicted 100.0 on the same frame.
//     * the stack's lowest ink once the charge starts: 1190 px (f112).
//       Gate 1400. Its worst anywhere after the pull settles is 1330.8 (f57,
//       the panel at the wide framing).
//     * ink on the top frame edge: ZERO frames. On the bottom: five (f91-95),
//       the battery on its way up — see DEVIATIONS.
//     * the left and right edges carry the ribbon and the white line, which is
//       what the brief allows a line to do.
//   SPEED:
//     * the push, over ink that is on screen at both of two consecutive
//       frames: the STACK peaks at 57.2 screen px/frame at f69. Gate 60.
//     * the dock peaks at 80.2 screen px/frame at f99 — see DEVIATIONS.
//   PAPER: worst horizontal margin 230.3 px and vertical 412.8 px, against
//   |bgX| <= 110.7 and |bgY| <= 135.2. Max source scale 0.9662 at the opening
//   k 1.700 — never upscaled.
//
// ---------------------------------------------------------------------------
// V2, on the director's review of the preview. All six deviations were
// accepted; two notes from the build's own report were taken up.
//   * TIGHTER REST. K_PUSH 1.000 -> 1.350 and the tail's creep 1.035 -> 1.390.
//     At 1.000 the stack was 368 screen px wide and its lowest ink 1114, which
//     left the bottom 45% of the frame empty and sat 180-280 px higher than
//     either sister's resolved picture. At 1.350 the block is 668 px tall, the
//     lowest ink is 1190 and the side padding 100 — and the gates are still a
//     long way off (96 needs k <= 2.41, 1400 needs k <= 2.25). The push's keys
//     were re-solved for it; see DEVIATIONS.
//   * THE DOCK STARTS AT f88, NOT f95. Between the push landing (f82) and the
//     battery's old birth the only moving thing was a 0.2 px/frame zoom creep
//     and a head creeping along off-frame — thirteen frames of nothing under
//     "solar". The battery is now born at f88 and still seats on f109, so the
//     rise itself covers that stretch: 830 px over 21 frames instead of 1100
//     over 14, which also takes its peak from 117.7 to 80.2 screen px/frame.
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, and why.
//   * THE OPEN IS k 1.700 AND cx 1070.65, NOT k 1.200 CENTRED BETWEEN THE TWO
//     HEADS. The two instructions "centred between the two heads" and "the
//     panel is simply off-frame at the open" cannot both hold at k 1.2: the
//     heads' midpoint is 1008.6 and the panel's shadow reaches x 728, so a
//     frame centred on the heads at k 1.2 starts at world x 558.6 and CUTS THE
//     PANEL ON THE LEFT EDGE, which the edge rule forbids. Solving
//     head-screen-x = (280.6 - clearance) * k for a head at the frame's middle
//     needs k ~ 2.0; at 1.2 the heads sit at screen x 307 with the whole right
//     two thirds of the frame empty, which is what the first render looked
//     like. 1.700 puts the head midpoint at screen x 435 and the ribbon's own
//     tip at 497 — the subject reads as entering from the left with somewhere
//     to go — and it costs 0.006 of max |dv| on k in the pull. It also makes
//     the mechanism legible: at 1.7 a stripe is 17 screen px and the empty core
//     slot the white has to fill is 17 px of paper, against 12 px at k 1.2.
//   * THE PANEL CROSSES THE LEFT FRAME EDGE ON f37-43, and "AI" crosses the
//     right on f59-60. A pull-back that reveals an object which was off-frame
//     has to bring it through an edge; so does a push that leaves a label
//     behind. Both are transits, not parks: the panel is wholly inside from
//     f44 and holds >= 96 px from f52, and "AI" is wholly outside from f61.
//     The battery's own entrance is the same thing upside down (f91-95).
//   * THE DOCK IS 830 PX LONG OVER 21 FRAMES AND IT IS NOT ON THE HOUSE
//     LANDING BEZIER. The brief's own 260 px would put the battery's birth at
//     world y 1103 and the f88 camera's bottom edge is at 1633.9, so the
//     brief's instruction — "lengthen the travel until it is below the visible
//     frame" — makes the travel 830 (birth top 1673, 39.1 px clear).
//     `Easing.bezier(0.16, 1, 0.3, 1)` covers 49% of its distance in the first
//     10% of its time, which on 830 px is 190 screen px in one frame: a strobe,
//     and the battery would be parked by f91 with eighteen dead frames before
//     its word. `smoothstep` is the flattest curve that still starts and ends
//     at zero velocity — its peak is exactly 1.5x its own average — so the rise
//     peaks at 80.2 px/frame, fills the whole f88-109 window and lands on
//     "batteries".
//   * THREE SEGMENTS LIGHT, NOT FOUR. The brief lists f112 / f119 / f126 /
//     f133 and then says the fourth stays EMPTY at the last frame. Those two
//     cannot both hold, and "still charging, the thought is unfinished" is the
//     direction, so f133 is the beat the fourth would have taken and does not.
//   * THE PULL LANDS AT k 0.650, BELOW THE EXPECTED 0.70-0.78. The sweep is
//     1334 world px wide — the panel's left edge at 356 to "AI"'s own right
//     edge at 1690, measured at 61 px of half-width off the render — and 96 px
//     of padding a side leaves 888 screen px, so the gate is k <= 0.6657. The
//     hold-creep then adds 0.01, so the pull itself has to sit at 0.650 for
//     0.660 to still clear the gate. Nothing about the brief's own geometry can
//     give 0.70 except a shorter sweep.
//   * THE PUSH IS f52-72, NOT f60-82, AND ITS PAN LEADS ITS ZOOM. A damped
//     tracker needs about ten frames to settle after its last key, and the
//     brief asks the move to be landed by f82 with no stack ink over 60 screen
//     px/frame. At the new rest k those two only meet on a 20 frame window
//     starting at f52: keys f60-82 leave the camera travelling 21 px/frame at
//     f82, and any window short enough to land by f82 from f58 pushes the stack
//     over 60. f52-72 lands at 2.0 px/frame at f82 and 0.4 at f85 and peaks at
//     57.2. The x channel takes warp 0.7 while k and the centre take 1.0: with
//     one warp the panel passes 84.4 px from the left edge mid-move, and with
//     the pan in front it never comes inside 100.0.
//   * THE RIBBON AND THE WHITE LINE ARE DRAWN BEHIND THE STACK. The brief asks
//     for the white line to start exactly on the panel's top-right corner AND
//     for 24 px of clearance from the panel. A 10 px stroke whose centreline
//     starts on a corner puts its own butt end and its +4/+4 shadow a few px
//     inside the corner cell; the cells eat it, and the render confirms that
//     not one non-white pixel ever lands inside a cell.
//   * "SOLAR" DOES NOT SLIDE. The brief gives it no gesture and it exists from
//     f0, so it is simply there, above the panel, off-frame until the pull.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
const PAPER_BASE = "#C0C0C0";

// This cut's own background oversize — see the header.
const BG_OVERSIZE_ST = 1.6;

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
  batteryLabel: z.string(),
  aiLabel: z.string(),
  beats: z.object({
    same: z.number(), // "same"        — the two heads are closing
    trajectory: z.number(), // "trajectory" — the white slots into the core
    ai: z.number(), // "AI"            — the label slides out of the crest
    growth: z.number(), // "growth"    — the head reaches its rest
    combine: z.number(), // "combine"  — the camera is on the panel
    solar: z.number(), // "solar"      — the panel, alone, holds the frame
    batteries: z.number(), // "batteries" — the battery seats
    end: z.number(), // speech ends; tail to 141
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE GEOMETRY. Every number is resolved from the cell module, the curve's two
// anchors and Barlow's real cap height, and every one of them is exported.
// ---------------------------------------------------------------------------
export const CONTENT_C = 835; // the content centre, on screen y 835 at every k
export const CENTRE_X = FRAME_W / 2; // 540

// -- the panel: the sisters' cell at 2x, because this is a close-up noun ------
export const CELL = 80;
export const CELL_GAP = 16;
export const CELL_PITCH = CELL + CELL_GAP; // 96
export const PANEL_COLS = 4;
export const PANEL_ROWS = 2;
export const PANEL_W = PANEL_COLS * CELL + (PANEL_COLS - 1) * CELL_GAP; // 368
export const PANEL_H = PANEL_ROWS * CELL + (PANEL_ROWS - 1) * CELL_GAP; // 176
export const PANEL_X0 = CENTRE_X - PANEL_W / 2; // 356
export const PANEL_X1 = CENTRE_X + PANEL_W / 2; // 724

// -- the battery: the same footprint, 16 px under it -------------------------
export const STACK_GAP = 16;
export const BATT_W = PANEL_W; // 368
export const BATT_H = PANEL_H; // 176
export const BATT_STROKE = 12; // drawn INSIDE the footprint
export const NUB_W = 16;
export const NUB_H = 64;
export const SEG_N = 4;
export const SEG_INSET = 16; // clear of the outline's inner edge, all sides
export const SEG_GAP = 16;
export const SEG_W =
  (BATT_W - 2 * BATT_STROKE - 2 * SEG_INSET - (SEG_N - 1) * SEG_GAP) / SEG_N; // 66
export const SEG_H = BATT_H - 2 * BATT_STROKE - 2 * SEG_INSET; // 120

export const LABEL_SIZE = 56;
export const LABEL_TRACK = 0.06; // em
export const LABEL_GAP = 24;
const CAP = 0.7; // Barlow's cap height per em, measured on the shipped webfont

// The block reaches this far above and below the panel's own top edge.
const BLOCK_UP = LABEL_GAP + CAP * LABEL_SIZE; // 63.2
const BLOCK_DOWN = PANEL_H + STACK_GAP + BATT_H + LABEL_GAP + CAP * LABEL_SIZE; // 431.2

export const PANEL_TOP = CONTENT_C - (BLOCK_DOWN - BLOCK_UP) / 2; // 651
export const PANEL_BOTTOM = PANEL_TOP + PANEL_H; // 827
export const BATT_TOP = PANEL_BOTTOM + STACK_GAP; // 843
export const BATT_BOTTOM = BATT_TOP + BATT_H; // 1019
export const NUB_X = PANEL_X1; // 724
export const NUB_Y = (BATT_TOP + BATT_BOTTOM) / 2 - NUB_H / 2; // 899
export const SEG_X0 = PANEL_X0 + BATT_STROKE + SEG_INSET; // 384
export const SEG_Y = BATT_TOP + BATT_STROKE + SEG_INSET; // 871
export const SEG_X = Array.from({ length: SEG_N }, (_, i) => SEG_X0 + i * (SEG_W + SEG_GAP));

export const SOLAR_BASELINE = PANEL_TOP - LABEL_GAP; // 627
export const SOLAR_INK_TOP = SOLAR_BASELINE - CAP * LABEL_SIZE; // 587.8
export const BATT_CAPTOP = BATT_BOTTOM + LABEL_GAP; // 1043
export const BATT_BASELINE = BATT_CAPTOP + CAP * LABEL_SIZE; // 1082.2
export const BLOCK_TOP = SOLAR_INK_TOP; // 587.8
export const BLOCK_BOTTOM = BATT_BASELINE; // 1082.2

// The panel cells, 4 x 2 on the pitch.
export const PANEL_CELLS = (() => {
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < PANEL_ROWS; r++) {
    for (let c = 0; c < PANEL_COLS; c++) {
      out.push({ x: PANEL_X0 + c * CELL_PITCH, y: PANEL_TOP + r * CELL_PITCH });
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// CURVE C and WHITE LINE W. See the header for the two anchors these solve.
// ---------------------------------------------------------------------------
export const C_XM = 1144; // the merge x
export const C_ASYM = 500; // C's own asymptote to the left
export const C_AMP = 180;
export const C_P = 184;

export const cY = (x: number) => C_ASYM - C_AMP * Math.pow(2, (x - C_XM) / C_P);
export const cSlope = (x: number) =>
  -((C_AMP * Math.LN2) / C_P) * Math.pow(2, (x - C_XM) / C_P);
export const cNorm = (x: number) => Math.sqrt(1 + cSlope(x) * cSlope(x));

export const MERGE_X = C_XM;
export const MERGE_Y = cY(C_XM); // 320

export const W_X0 = PANEL_X1; // 724 — the panel's top-right corner
export const W_RUN = MERGE_X - W_X0; // 420
export const W_D = PANEL_TOP - cY(W_X0); // 187.9926
export const wY = (x: number) => cY(x) + W_D * (1 - smoothstep((x - W_X0) / W_RUN));

export const RIB_STROKE = 10;
export const RIB_OFFSETS = { blue: 10, purple: 20, orange: 30 };
export const RIB_RIM = RIB_OFFSETS.orange + RIB_STROKE / 2; // 35, across the ribbon
export const RIB_SAMPLE = 2; // px between samples
export const RIB_X0 = -120; // off-frame left at every framing this camera reaches

export const ribCrest = (x: number) => cY(x) - RIB_RIM * cNorm(x);

// ---------------------------------------------------------------------------
// THE HEAD. ONE linear track in x carries the white line and all three chain
// copies, so the merge is not a change of speed: the colours are the SAME track
// sampled 2 / 4 / 6 frames ahead, exactly as in `LearningCurve`.
// ---------------------------------------------------------------------------
export const HEAD_X_REST = 1624;
export const HEAD_F_REST = 53; // the end of "growth"
export const MERGE_F = 14; // inside "trajectory" (f13-24)
export const HEAD_RATE = (HEAD_X_REST - MERGE_X) / (HEAD_F_REST - MERGE_F); // 12.3077
export const HEAD_X0 = HEAD_X_REST - HEAD_RATE * HEAD_F_REST; // 971.6923
export const HEAD_CREEP = 0.25; // px/frame in x, from HEAD_F_REST to the end
export const HEAD_LEADS = { blue: 2, purple: 4, orange: 6 };

export const headCreep = (frame: number) => Math.max(0, frame - HEAD_F_REST) * HEAD_CREEP;
export const headAt = (frame: number, lead = 0) =>
  Math.min(HEAD_X_REST, HEAD_X0 + HEAD_RATE * (frame + lead)) + headCreep(frame);

// The point the camera tracks through the first act: the midpoint of the white
// head and the orange head.
export const headMid = (frame: number) => {
  const wx = headAt(frame);
  const ox = headAt(frame, HEAD_LEADS.orange);
  return {
    x: (wx + ox) / 2,
    y: (wY(wx) + (cY(ox) - RIB_OFFSETS.orange * cNorm(ox))) / 2,
  };
};

// -- "AI" --------------------------------------------------------------------
export const AI_SIZE = 120;
export const AI_GAP = 26; // baseline above the ribbon's own top edge
export const AI_TRAVEL_F = 14;
// exactly the distance that hides the label behind the ribbon's own crest
export const AI_RISE = AI_GAP + CAP * AI_SIZE; // 110

// -- the dock ----------------------------------------------------------------
export const BATT_F0 = 88;
export const BATT_TRAVEL_F = 21; // seated on "batteries" f109
// 830 px, not the brief's 260: at the f88 camera (k 1.3524, cy 927.8) the
// frame's bottom edge is world y 1633.9, and a battery born 260 px under its
// seat would be born at 1103 — in shot. 830 puts its top at 1673, 39.1 px
// below that edge. See DEVIATIONS.
export const BATT_TRAVEL = 830;
export const LABEL_TRAVEL_F = 14;
export const LABEL_RISE = 40;
export const SEG_ON = [112, 119, 126]; // the fourth never lights

const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
// The dock is 830 px long over 21 frames, so it does not get the house landing
// bezier: see DEVIATIONS. `smoothstep` is the flattest curve that still starts
// and ends at zero velocity, and its peak is 1.5x the average — the slowest an
// 830 px move in 21 frames can possibly be (80.2 screen px/frame, at f99).
const EASE_DOCK = smoothstep;

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.7;
export const K_PULL = 0.65; // the widest framing that holds the whole sweep
export const K_HOLD = 0.66; // the held breath, +0.01
export const K_PUSH = 1.35;
export const K_TAIL = 1.39;

// The open is framed so the PANEL IS OFF THE LEFT EDGE — 540 / k of frame plus
// the panel's own shadow and 27 px of clearance. See DEVIATIONS: "centred
// between the two heads" would cut the panel on the frame edge.
export const EDGE_CLEAR = 25;
export const X_OPEN = PANEL_X1 + 4 + EDGE_CLEAR + FRAME_W / 2 / K_OPEN; // 1070.65
export const X_TRACK = 1241; // the pan takes 170 of the heads' own 295 px
export const X_PULL = 1023; // the sweep's centre: (356 + 1690) / 2
export const X_REST = CENTRE_X;

export const C_OPEN = headMid(0).y; // 408.71
export const C_TRACK = 220; // the head rises ~94 screen px inside the frame
export const C_PULL = 80;
export const C_REST = CONTENT_C;

export const TRACK_F0 = 0;
export const TRACK_F1 = 24;
export const TRACK_WARP = 0.8;
export const PULL_F0 = 26;
export const PULL_F1 = 43; // the damper is down to 0.003 of k by f52
export const PULL_WARP = 0.8;
export const HOLD_F0 = 48;
export const HOLD_F1 = 52;
export const HOLD_WARP = 1.0;
export const PUSH_F0 = 52;
export const PUSH_F1 = 72; // the damper is down to 0.4 screen px/frame by f85
export const PUSH_WARP = 1.0;
// The PAN leads the ZOOM. One move, one window, still zero velocity at both
// ends (warp > 0.5 keeps the slope zero), but cx reaches 540 earlier than k
// reaches 1.35 — which is what keeps the panel off the left edge while the
// camera is coming in on it: worst padding 100.0 px against 84.4 at warp 1.
export const PUSH_X_WARP = 0.7;
export const CREEP_F0 = 85;
export const CREEP_F1 = DURATION - 1;
export const CREEP_WARP = 1.0;

const TRACK = camMove({
  f0: TRACK_F0,
  f1: TRACK_F1,
  k0: K_OPEN,
  k1: K_OPEN,
  c0: C_OPEN,
  c1: C_TRACK,
  warp: TRACK_WARP,
});
const PULL = camMove({
  f0: PULL_F0,
  f1: PULL_F1,
  k0: K_OPEN,
  k1: K_PULL,
  c0: C_TRACK,
  c1: C_PULL,
  warp: PULL_WARP,
});
const HOLD = camMove({
  f0: HOLD_F0,
  f1: HOLD_F1,
  k0: K_PULL,
  k1: K_HOLD,
  c0: C_PULL,
  c1: C_PULL,
  warp: HOLD_WARP,
});
const PUSH = camMove({
  f0: PUSH_F0,
  f1: PUSH_F1,
  k0: K_HOLD,
  k1: K_PUSH,
  c0: C_PULL,
  c1: C_REST,
  warp: PUSH_WARP,
});
const CREEP = camMove({
  f0: CREEP_F0,
  f1: CREEP_F1,
  k0: K_PUSH,
  k1: K_TAIL,
  c0: C_REST,
  c1: C_REST,
  warp: CREEP_WARP,
});

// The x channel rides each move's own eased curve, so a pan and a zoom are one
// gesture and the damper never sees a corner.
const xOf = (m: { F: number[] }, f0: number, f1: number, warp: number, x0: number, x1: number) =>
  m.F.map((_, i) => x0 + (x1 - x0) * camEase(i / (f1 - f0), warp));

export const ST_CAM_F = [
  ...TRACK.F,
  ...PULL.F,
  ...HOLD.F,
  ...PUSH.F.slice(1),
  ...CREEP.F,
];
export const ST_CAM_K = [
  ...TRACK.K,
  ...PULL.K,
  ...HOLD.K,
  ...PUSH.K.slice(1),
  ...CREEP.K,
];
export const ST_CAM_CY = [
  ...TRACK.CY,
  ...PULL.CY,
  ...HOLD.CY,
  ...PUSH.CY.slice(1),
  ...CREEP.CY,
];
export const ST_CAM_CX = [
  ...xOf(TRACK, TRACK_F0, TRACK_F1, TRACK_WARP, X_OPEN, X_TRACK),
  ...xOf(PULL, PULL_F0, PULL_F1, PULL_WARP, X_TRACK, X_PULL),
  ...HOLD.F.map(() => X_PULL),
  ...xOf(PUSH, PUSH_F0, PUSH_F1, PUSH_X_WARP, X_PULL, X_REST).slice(1),
  ...CREEP.F.map(() => X_REST),
];

// `runCamera` damps cy and k only. This is the sisters' `runCamera2`: the same
// house tracker on the same CAM_STIFF / CAM_DAMP with an x channel, so this
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
  batteryLabel: "BATTERIES",
  aiLabel: "AI",
  beats: {
    same: 9,
    trajectory: 13,
    ai: 35,
    growth: 44,
    combine: 69,
    solar: 85,
    batteries: 109,
    end: 125,
  },
});

// ---------------------------------------------------------------------------
// THE GROUND. The sisters' `PaperGround`, unchanged.
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
          width: FRAME_H * BG_OVERSIZE_ST,
          height: FRAME_W * BG_OVERSIZE_ST,
          objectFit: "cover",
          filter: `brightness(${dim}) blur(${blur}px)`,
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const CLIP_AI_LABEL = "st-above-the-crest";

// THE RIBBON, as a path up to a head, offset `up` px ACROSS the curve. Every
// copy stops at its own head x; at the steep end the outer copies stand further
// up the page than the core does, so the tip tapers with the orange reaching
// highest — the same order the colours arrive in.
const ribbonPath = (headX: number, up: number) => {
  const at = (x: number) => `${x.toFixed(2)} ${(cY(x) - up * cNorm(x)).toFixed(2)}`;
  const pts: string[] = [];
  for (let x = RIB_X0; x < headX; x += RIB_SAMPLE) {
    pts.push(at(x));
  }
  pts.push(at(headX));
  return `M${pts.join(" L")}`;
};

// THE WHITE LINE, from the panel's top-right corner up to its head. Past M this
// path IS C, so the same stroke draws the converging line and the ribbon's core.
const whitePath = (headX: number) => {
  const at = (x: number) => `${x.toFixed(2)} ${wY(x).toFixed(2)}`;
  const pts: string[] = [];
  for (let x = W_X0; x < headX; x += RIB_SAMPLE) {
    pts.push(at(x));
  }
  pts.push(at(headX));
  return `M${pts.join(" L")}`;
};

const SameTrajectory: React.FC<Props> = ({
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
  batteryLabel,
  aiLabel,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, ST_CAM_F, ST_CAM_CY, ST_CAM_CX, ST_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- one travel curve, sampled at a different start frame per layer --------
  const travelled = (
    f0: number,
    frames: number,
    distance: number,
    easing: (t: number) => number = EASE_LAND,
  ) => {
    const t = interpolate(frame, [f0, f0 + frames], [0, 1], { easing, ...clamp });
    return (1 - t) * distance;
  };

  const coreHead = headAt(frame);
  const orangeHead = headAt(frame, HEAD_LEADS.orange);
  const crestY = ribCrest(orangeHead); // the ribbon's top edge at the head

  const chain = [
    { key: "orange", color: orange, lead: HEAD_LEADS.orange, up: RIB_OFFSETS.orange },
    { key: "purple", color: purple, lead: HEAD_LEADS.purple, up: RIB_OFFSETS.purple },
    { key: "blue", color: blue, lead: HEAD_LEADS.blue, up: RIB_OFFSETS.blue },
  ];

  const corePath = whitePath(coreHead);

  // -- the dock --------------------------------------------------------------
  const battLive = frame >= BATT_F0;
  const battDy = travelled(BATT_F0, BATT_TRAVEL_F, BATT_TRAVEL, EASE_DOCK);

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

  // The battery, as one body: the shadow layer and the white layer are the same
  // shapes, four world px apart.
  const batteryLayer = (fill: string, off: number) => (
    <g transform={`translate(${off} ${(battDy + off).toFixed(2)})`}>
      <rect
        x={PANEL_X0 + BATT_STROKE / 2}
        y={BATT_TOP + BATT_STROKE / 2}
        width={BATT_W - BATT_STROKE}
        height={BATT_H - BATT_STROKE}
        fill="none"
        stroke={fill}
        strokeWidth={BATT_STROKE}
      />
      <rect x={NUB_X} y={NUB_Y} width={NUB_W} height={NUB_H} fill={fill} />
      {SEG_ON.map((on, i) =>
        frame >= on ? (
          <rect
            key={`seg-${i}`}
            x={SEG_X[i]}
            y={SEG_Y}
            width={SEG_W}
            height={SEG_H}
            fill={fill}
          />
        ) : null,
      )}
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={ST_CAM_CY[0]}
        cx={cx}
        cxRest={ST_CAM_CX[0]}
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
              {/* everything above the ribbon's own crest, so "AI" grows out from
                  behind it rather than over it */}
              <clipPath id={CLIP_AI_LABEL}>
                <rect x={-4000} y={-6000} width={12000} height={6000 + crestY} />
              </clipPath>
            </defs>

            {/* THE RIBBON AND THE WHITE LINE, BEHIND the stack. The white line's
                centreline starts exactly ON the panel's top-right corner, so a
                10 px stroke has to graze the corner cell: the cells eat the
                graze and not one pixel of line ink is visible on the panel. */}
            <path
              d={corePath}
              fill="none"
              stroke={shadow}
              strokeWidth={RIB_STROKE}
              strokeLinecap="butt"
              strokeLinejoin="round"
              transform={`translate(${shadowOffset} ${shadowOffset})`}
            />
            {chain.map((c) => (
              <path
                key={c.key}
                d={ribbonPath(headAt(frame, c.lead), c.up)}
                fill="none"
                stroke={c.color}
                strokeWidth={RIB_STROKE}
                strokeLinecap="butt"
                strokeLinejoin="round"
              />
            ))}
            <path
              d={corePath}
              fill="none"
              stroke={ink}
              strokeWidth={RIB_STROKE}
              strokeLinecap="butt"
              strokeLinejoin="round"
            />

            {/* THE PANEL. It exists from frame 0 and never moves. */}
            {PANEL_CELLS.map((c) => (
              <rect
                key={`ps-${c.x}-${c.y}`}
                x={c.x + shadowOffset}
                y={c.y + shadowOffset}
                width={CELL}
                height={CELL}
                fill={shadow}
              />
            ))}
            {PANEL_CELLS.map((c) => (
              <rect key={`pc-${c.x}-${c.y}`} x={c.x} y={c.y} width={CELL} height={CELL} fill={ink} />
            ))}

            {/* THE BATTERY, docking from below the frame. */}
            {battLive ? (
              <g>
                {batteryLayer(shadow, shadowOffset)}
                {batteryLayer(ink, 0)}
              </g>
            ) : null}

            {/* "SOLAR" — it exists from frame 0, above the panel. */}
            {shadowedText("solar", solarLabel, CENTRE_X, SOLAR_BASELINE, LABEL_SIZE, LABEL_TRACK)}

            {/* "BATTERIES" — it slides up 40 px and stops. */}
            {frame >= beats.batteries
              ? shadowedText(
                  "batteries",
                  batteryLabel,
                  CENTRE_X,
                  BATT_BASELINE + travelled(beats.batteries, LABEL_TRAVEL_F, LABEL_RISE),
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

export default SameTrajectory;
