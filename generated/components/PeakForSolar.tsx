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
// Clip "joel - the oil companies were the solar innovators", SRT cues 63-90.
// The composition starts on the onset of "and", 15.019 s; speech ends on the
// end of "solar", 22.379 s.  round((22.379 - 15.019) * 24) = 177 frames of
// speech, plus a 16 frame tail so the resolved chart holds = 193.
export const DURATION = 193;

// ---------------------------------------------------------------------------
// "PEAK FOR SOLAR". The sibling of `OneHugeQuestion` and `ParisToBrownsville`:
// same ground, same chain, same type, same camera — and this time the mark is a
// bar chart, because the line is a number and a date.
//
// v2, on the director's review: THE CHAIN IS A CROWN, not a left fan (the fan
// collided with '79's hard shadow two pixels away and read as a divider rather
// than as the peak's own echo), and the whole chart is scaled up so it reads on
// a phone.
//
// THE MATERIAL IS PAPER, and the paper is all there is under the mark:
// `public/paper-supaclean-still.png`, real squared paper, 3864 x 2164
// landscape, on its own plane at parallax 0.15 of the camera in BOTH axes (this
// cut pans) with the same slow -0.3 px/frame drift and the same
// 1 + (k - 1) * 0.3 scale. Unlike its two siblings it is NOT knocked back:
// brightness 1, blur 0, `filter: none`. The squares are the graph paper the
// chart is drawn on, so they have to be legible.
//   A LOCAL BG_OVERSIZE OF 1.6, not `fieldShared`'s 1.8. The box is
//   1920*1.6 x 1080*1.6 = 3072 x 1728 laid out landscape and turned 90 deg, so
//   `objectFit: cover` solves 3864 x 2164 into 3072 x 1728 at
//   max(3072/3864, 1728/2164) = 0.7985 of source. At the tightest camera this
//   cut now reaches (k 1.35, bgScale 1.105) that is 0.8824 of source — v2's
//   lower open k leaves even more headroom than v1's 0.9183. The photograph is
//   never upscaled and the squares never soften.
//   COVERAGE. At k 1.0 the element is 1728 x 3072 on a 1080 x 1920 frame:
//   324 px of margin sideways, 576 px vertically, before parallax. Measured
//   across all 193 frames with the longer cx track (354 -> 540) and the keyed
//   cy track (1047.81 -> 960), plus sway and the -0.3 px/frame drift, the worst
//   horizontal
//   margin is 295.7 px (f181) and the worst vertical margin is 531.8 px (f193).
//   The paper cannot show an edge, and behind it the root is #D8D8D8 so a frame
//   could not show through even if it did.
//
// THE MARK is five bars, the verified US federal solar / renewables budget in
// today's dollars, and a rule they stand on. Nothing is interpolated: the years
// are uneven because those are the five points that were checked.
//   '75  $43M  -> $0.26B      '79  $571M -> $2.5B
//   '80  $771M -> $3.0B  <- THE PEAK    '81  $575M -> $2.0B
//   '87  $124M -> $0.35B      (CPI-U: 53.8 / 72.6 / 82.4 / 90.9 / 113.6 -> 322)
//
// THE COLOURS, raw hex, no filter, no blend mode, no gradient, no glow, and no
// opacity fade on anything, ever:
//   ink / core  #FFFFFF   white is the ink on this paper — white IS the money
//   shadow      #000000   hard, zero blur, +8 / +8 WORLD px, drawn as an SVG
//                         copy of the shape and not as a CSS drop-shadow, so it
//                         is identical behind every white element at every k
//   orange #FFB765  purple #BC37FF  blue #0046FF — the CORE MEMORY chain, and
//   in this cut they have ONE JOB between them: they are the echo of the peak
//   bar. They are on no other bar, no label, no rule, no numeral.
//
// TYPE: Barlow 800/900, uppercase, white, on the same hard shadow. Year labels
// 900 at 56, "$3B" 900 at 190, "TODAY'S DOLLARS" 800 at 44 with 0.06em of
// tracking. No stroke, no outline, anywhere.
//
// THE GEOMETRY, world px (v2 scale). Five bars 140 wide on a 186 pitch, left
// edges 98 / 284 / 470 / 656 / 842, so the row spans 98..982 and is centred on
// x 540. Heights are 700 * value / 3.013B, the '80 bar at the full 700:
//   '75 61   '79 590   '80 700   '81 476   '87 82
// The rule runs x 68..1012, 6 px, its top edge ON the baseline so the bars
// stand on it. Barlow's real metrics, measured off the shipped webfont rather
// than assumed (cap 0.700 em; "$3B" 0.791 up / 0.081 down; "TODAY'S DOLLARS"
// 0.708 / 0.011; the year labels 0.715 / 0.012 with the apostrophe):
//   BASE = 1287.30
//   block top    317.99  ("$3B" ink top)
//   block bottom 1352.01 (year-label ink bottom)
//   block centre 835.00  — the caption-safe content centre, which CAM_LIFT puts
//                          on screen y 835 at every k
// The stack, upward off the CROWN's top (the orange top at BASE - 736 =
// 551.30, not the white core's top at 587.30) with 18 px between each: the
// crown, then "TODAY'S DOLLARS" (baseline 532.82), then "$3B" (baseline
// 468.28). Year-label baseline 1351.34, ink cap-top 24 px under the rule.
//
// THE PEAK-BAR ECHO, at rest: A CROWN. Three copies of the '80 bar in the SAME
// column as the core — identical x, identical width — each taller by its own
// step, stacked orange (back) / purple / blue / core (front) with the black
// shadow behind all of them at +8/+8 OF THE CORE ONLY. Blue's top is 12 px
// above the core's, purple's 24, orange's 36, so the resolved peak wears three
// 12 px stripes above the white — orange, purple, blue, then the money. The
// other four bars have no copies, and nothing to the left or right of the peak
// column is touched: the fan's two-pixel collision with '79's shadow is gone.
//
// THE GESTURES — one continuous sweep left to right across the years, and one
// camera move. Nothing drifts, wobbles, breathes or fades; a layer either
// exists or it does not.
//   A BAR RISES: the finished rect translating UP from a full height below the
//   rule to its place over 22 frames on Easing.bezier(0.16, 1, 0.3, 1), clipped
//   to y <= BASE so it grows out of the rule.
//   f0    the rule exists                                    — no word, no gesture
//   f2    '75 rises                                          — "and like"
//   f10   '79 rises                                          — "that was"
//   f23   '80 RISES WITH THE CHAIN, the payoff: orange f23,
//         purple f25, blue f27, white core f29, the black
//         shadow with the core on the core's own timing. Each
//         copy rises through the same rule to ITS OWN top, so
//         the leading colour reads as a band above the next one
//         all the way up and settles into the crown. Front-
//         loaded, so the peak reads as landed by ~f45          — "peak"
//   f30-85 HOLD. Nothing new appears; the camera creeps.
//   f37   '80's year label                                   — rise start + 14
//   f93   '81 rises                                          — "history"
//   f107  '81's year label, and '87 rises                    — "I"
//   f121  '87's year label
//   f122  "$3B" slides up 60 px over 16 frames on the same
//         bezier and stops. It sits above the crown, so it
//         needs no clip and grows out of nothing              — "three"
//   f138  "TODAY'S DOLLARS" exists. No motion.                — "equivalent"
//   f145-192 the resolved frame holds. Sway only.
//   ('75 label f16, '79 label f24, on the same rise + 14 rule.)
//
// THE CAMERA — one creep, one move, damped by the house tracker with an x
// channel (`ParisToBrownsville`'s `runCamera2`, same CAM_STIFF / CAM_DAMP).
//
// v3, on the director's note: THE CAMERA FRAMES WHAT EXISTS, not what will.
// `CAM_LIFT` puts a content centre on screen y 835 at every k, but which centre
// is right changes during the cut: through f86 there is no numeral and no tag,
// so centring on the RESOLVED block's 835 pushed the year labels down to screen
// y 1507, inside the caption band. So the centre is now keyed too —
//   C_OPEN = (crown top 551.30 + year-label ink bottom 1352.01) / 2 = 951.66
//     the bars-plus-labels block, which is all there is at OPEN and through the
//     creep, and
//   C_REST = 835.00, the full block, from the pull-back's landing onward.
// `camMove` derives cy per frame from the EASED k AND the EASED centre on the
// same curve, so the re-centring and the zoom are one move and not two: there
// is no separate tilt to see.
//   OPEN   f0      k 1.30, cx 354, cy 1047.81 — '75 '79 '80 centred (they span
//                  98..618 with their shadows and the visible world box is
//                  x -61.4..769.4: 159 px of margin left, 151 right; y
//                  309.4..1786.3). The '81 and '87 slots carry nothing until
//                  f93 / f107, so nothing is parked at the edge; the rule runs
//                  out of frame right, which is what a rule does.
//   CREEP  f30-80  k 1.30 -> 1.35, cx 354 -> 364, centre held on C_OPEN,
//                  warp 1.0. The held breath: 0.16% of the zoom per frame.
//   PULL   f86-112 k 1.35 -> 1.00, cx 364 -> 540, centre C_OPEN -> 835,
//                  warp 0.7. The reveal IS "history".
//   Last key repeated at f193 so the tail holds.
//
//   THE DAMPED NUMBERS, what `runCamera2` actually produces:
//     f    k        cx       cy         %ofK/frame  %ofX/frame
//     23   1.3000   354.00   1047.81      0.00%       0.00%
//     30   1.3000   354.00   1047.81      0.00%       0.00%   creep breaks here
//     80   1.3485   363.70   1044.35      0.16%       0.05%   creep keys end
//     86   1.3498   363.97   1044.26      0.03%       0.01%   pull breaks here
//     92   1.3116   383.30   1034.24      4.06%       3.29%
//     100  1.1744   452.29    999.84      6.06%       4.91%   the fast middle
//     107  1.0658   506.93    974.40      4.26%       3.45%
//     110  1.0344   522.69    967.44      3.07%       2.49%
//     122  1.0001   539.93    960.03      0.07%       0.06%   "three" lands still
//     130  0.9999   540.03    959.99      0.00%       0.00%
//     145  1.0000   540.00    960.00      0.00%       0.00%
//     192  1.0000   540.00    960.00      0.00%       0.00%
//   One acceleration lobe and one settle lobe on every channel, no reversal the
//   eye could see: the zoom's whole undershoot is 1.0e-4 of k (0.035% of the
//   move), cy's largest reversal step is 0.0014 world px and cx's whole
//   overshoot is 0.052 px. By f122 the camera is moving 0.07% of the move per
//   frame, so the numeral lands in a still frame.
//
//   WHERE THAT PUTS THE TYPE. With the centre keyed, at OPEN the year-label ink
//   bottom sits at screen y 1355.5 — clear of the caption band, where centring
//   on the resolved block put it at 1507 — and the '80 core's top at screen y
//   361.3 (the crown's at 314.5). Through the creep the label bottom drifts to
//   1382.0 at f86, its lowest, and comes back to 1351.4 at f122 and 1355.2 at
//   rest. The numeral's ink top is off the top of the frame while it does not
//   exist and is at screen y 317.2 when it arrives.
//
//   FRAMING, checked frame by frame in BOTH axes against every bar, label,
//   crown, rule and numeral that exists (the rule's x excepted, which is
//   allowed to run off):
//     f0    visible world x  -61.4..769.4   y 309.4..1786.3
//     f80   visible world x  -37.7..763.2   y 328.1..1751.9
//     f92   visible world x  -30.7..792.7   y 297.4..1761.2
//     f100  visible world x  -10.3..909.3   y 178.2..1813.0   '81 up, '87 empty
//     f110  visible world x   -2.3..1041.7  y  37.0..1893.1
//     f192  visible world x    2.6..1082.6  y  -3.1..1916.9
//   Nothing is cut by the frame edge on any of the 193 frames.
//
// DEVIATIONS from the brief, and why.
//   * THE OPEN k IS 1.30, THE FLOOR THE DIRECTOR ALLOWED. At 1.45 the chart
//     ran further into the caption band and the pull-back had further to go for
//     no more reveal. The screen-y-1400 gate that 1.30 could not meet on its
//     own is met in v3 by keying the content centre instead of the zoom: the
//     label ink bottom is at 1355.5 at OPEN. Lowering k alone could never have
//     done it — with the centre pinned on the resolved block the label bottom
//     is 835 + 517.01k, which needs k <= 1.0928.
//   * '81 RISES AT f93, NOT f92. The wider pitch pushes the '81 column's
//     shadow out to world x 804 and at f92 the frame reaches 792.7 — 11.3 px
//     short. f93 is the first frame the whole column is inside, and it is
//     still inside "history" (f86-97). '87 stays on f107 ("I"): the frame
//     reaches its 990 from f106, so f107 is already clear.
//   * THE PULL-BACK'S KEYS END AT f112, NOT f124 (carried from v1, accepted).
//     With keys to f124 the damper is still moving 1.42% of the move per frame
//     at f122 and the numeral would land in a travelling frame.
//   * '87 RISES AT f107, NOT f94 (carried from v1, accepted). No camera that
//     starts opening from the creep's k at f86 can frame world x 990 by f94 —
//     the frame is only ~820 world px wide there.
//   * THE BAR SHADOWS SHARE THE CORES' CLIP (y <= BASE) rather than being
//     clipped 8 px lower (carried from v1, accepted): clipping them at
//     BASE + 8 leaves a 2 px black nub under every bar between the rule's
//     bottom edge and the rule's own shadow.
//   * THE RISE CLIP IS EVERYTHING ABOVE THE BASELINE (carried from v1,
//     accepted): the brief's literal "a rect whose top edge is the baseline"
//     would hide the bars.
// ---------------------------------------------------------------------------

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";
// Behind the photograph, so a frame can never show through.
const PAPER_BASE = "#D8D8D8";

// This cut's own background oversize — see the header. `fieldShared`'s 1.8
// would put the paper over 1.0x of source at the camera's tightest.
const BG_OVERSIZE_PFS = 1.6;

export const schema = z.object({
  paperSrc: z.string(),
  parallax: z.number(),
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  // the hard shadow, in WORLD px, so it rides everything at every zoom
  shadowOffset: z.number(),
  // the five verified points: nominal $M, the CPI-U index of that year, the
  // real value in 2025 dollars ($B), the bar's height in world px, its left
  // edge, and the frame its rise starts
  bars: z.array(
    z.object({
      year: z.string(),
      nominalM: z.number(),
      cpi: z.number(),
      realB: z.number(),
      h: z.number(),
      x: z.number(),
      rise: z.number(),
      peak: z.boolean(),
    }),
  ),
  numeral: z.string(),
  tag: z.string(),
  beats: z.object({
    and: z.number(), // "and like"        — '75 rises
    thatWas: z.number(), // "that was"    — '79 rises
    peak: z.number(), // "peak"           — '80 rises with the chain
    history: z.number(), // "history"     — '81 rises
    i: z.number(), // "I"                 — '87 rises
    three: z.number(), // "three"         — "$3B" slides up
    equivalent: z.number(), // "equivalent" — "TODAY'S DOLLARS"
    end: z.number(), // speech ends; tail to 193
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE GEOMETRY. Barlow's ink metrics are measured off the shipped webfont, not
// assumed, so the block really is centred on the caption-safe line.
// ---------------------------------------------------------------------------
export const CONTENT_C = 835; // the content centre, on screen y 835 at every k
export const BAR_W = 140;
export const BAR_PITCH = 186;
export const BAR_X0 = 98;
export const MAX_BAR = 700; // the '80 bar's white core
export const RULE_X0 = 68;
export const RULE_X1 = 1012;
export const RULE_W = 6;

export const NUM_SIZE = 190;
export const TAG_SIZE = 44;
export const YEAR_SIZE = 56;
export const TAG_TRACK = 0.06; // em
// ink above / below the baseline, per em, measured on Barlow
const NUM_ASC = 0.791;
const NUM_DESC = 0.081;
const TAG_ASC = 0.708;
const TAG_DESC = 0.011;
const YEAR_ASC = 0.715;
const YEAR_DESC = 0.012;

export const STACK_GAP = 18; // between "$3B", "TODAY'S DOLLARS" and the crown
export const LABEL_DROP = 24; // year-label cap-top below the baseline

// -- the crown ---------------------------------------------------------------
// Each colour copy shares the core's column and stands on the same rule; it is
// simply taller by its own step, so what shows above the white at rest is a
// 12 px stripe per colour.
export const CROWN_STEP = 12;
export const CROWN_OFFSETS = { blue: CROWN_STEP, purple: 2 * CROWN_STEP, orange: 3 * CROWN_STEP };
export const CROWN = CROWN_OFFSETS.orange; // the peak's real silhouette height above the core

// How far the block reaches above and below the baseline, and therefore where
// the baseline has to sit for the block's centre to land on CONTENT_C. The
// numeral and the tag stack off the CROWN's top, not the core's.
const BLOCK_UP =
  MAX_BAR +
  CROWN +
  STACK_GAP +
  TAG_DESC * TAG_SIZE +
  TAG_ASC * TAG_SIZE +
  STACK_GAP +
  NUM_DESC * NUM_SIZE +
  NUM_ASC * NUM_SIZE;
const BLOCK_DOWN = LABEL_DROP + YEAR_ASC * YEAR_SIZE + YEAR_DESC * YEAR_SIZE;
export const BASE = CONTENT_C + (BLOCK_UP - BLOCK_DOWN) / 2; // 1287.30
export const BLOCK_TOP = BASE - BLOCK_UP; // 317.99
export const BLOCK_BOTTOM = BASE + BLOCK_DOWN; // 1352.01

export const CORE_TOP = BASE - MAX_BAR; // 587.30
export const CROWN_TOP = CORE_TOP - CROWN; // 551.30
// What the camera frames at OPEN. Through f86 the numeral and the tag do not
// exist, so the camera centres on what DOES: the bars-plus-labels block, from
// the crown's top to the year labels' ink bottom. The pull-back carries the
// centre from here to the full block's 835 on the same eased curve as k.
export const C_OPEN = (CROWN_TOP + BLOCK_BOTTOM) / 2; // 951.66
export const TAG_BASELINE = CROWN_TOP - STACK_GAP - TAG_DESC * TAG_SIZE;
export const NUM_BASELINE = TAG_BASELINE - TAG_ASC * TAG_SIZE - STACK_GAP - NUM_DESC * NUM_SIZE;
export const YEAR_BASELINE = BASE + LABEL_DROP + YEAR_ASC * YEAR_SIZE;

// -- the rises ---------------------------------------------------------------
export const TRAVEL_FRAMES = 22;
export const NUM_TRAVEL_FRAMES = 16;
export const NUM_RISE = 60;
export const LABEL_DELAY = 14; // a year label exists from its bar's rise + 14
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
export const CHAIN_STAGGER = 2;

// -- the camera --------------------------------------------------------------
export const K_OPEN = 1.3; // see DEVIATIONS: the floor the director allowed
export const K_TIGHT = K_OPEN + 0.05;
export const K_REST = 1.0;
export const X_OPEN = 354; // '75 '79 '80 span 98..618; their centre is 358
export const X_TIGHT = 364;
export const X_REST = FRAME_W / 2;
export const CREEP_F0 = 30;
export const CREEP_F1 = 80;
export const CREEP_WARP = 1.0;
export const PULL_F0 = 86;
export const PULL_F1 = 112; // 124 leaves the camera moving under "three"
export const PULL_WARP = 0.7;

const CREEP = camMove({
  f0: CREEP_F0,
  f1: CREEP_F1,
  k0: K_OPEN,
  k1: K_TIGHT,
  c0: C_OPEN,
  c1: C_OPEN,
  warp: CREEP_WARP,
});
const CREEP_X = CREEP.F.map(
  (_, i) => camEase(i / (CREEP_F1 - CREEP_F0), CREEP_WARP) * (X_TIGHT - X_OPEN) + X_OPEN,
);
const PULL = camMove({
  f0: PULL_F0,
  f1: PULL_F1,
  k0: K_TIGHT,
  k1: K_REST,
  c0: C_OPEN,
  c1: CONTENT_C,
  warp: PULL_WARP,
});
const PULL_X = PULL.F.map(
  (_, i) => camEase(i / (PULL_F1 - PULL_F0), PULL_WARP) * (X_REST - X_TIGHT) + X_TIGHT,
);

export const PFS_CAM_F = [0, ...CREEP.F, ...PULL.F, DURATION];
export const PFS_CAM_K = [K_OPEN, ...CREEP.K, ...PULL.K, K_REST];
export const PFS_CAM_CY = [
  C_OPEN + CAM_LIFT / K_OPEN,
  ...CREEP.CY,
  ...PULL.CY,
  CONTENT_C + CAM_LIFT / K_REST,
];
export const PFS_CAM_CX = [X_OPEN, ...CREEP_X, ...PULL_X, X_REST];

// `runCamera` damps cy and k only. This cut pans, so this is `ParisToBrownsville`'s
// `runCamera2`: the same house tracker on the same CAM_STIFF / CAM_DAMP with an
// x channel. `fieldShared` is not touched.
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
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 8,
  bars: [
    { year: "'75", nominalM: 43, cpi: 53.8, realB: 0.26, h: 61, x: BAR_X0 + 0 * BAR_PITCH, rise: 2, peak: false },
    { year: "'79", nominalM: 571, cpi: 72.6, realB: 2.53, h: 590, x: BAR_X0 + 1 * BAR_PITCH, rise: 10, peak: false },
    { year: "'80", nominalM: 771, cpi: 82.4, realB: 3.01, h: 700, x: BAR_X0 + 2 * BAR_PITCH, rise: 23, peak: true },
    { year: "'81", nominalM: 575, cpi: 90.9, realB: 2.04, h: 476, x: BAR_X0 + 3 * BAR_PITCH, rise: 93, peak: false },
    { year: "'87", nominalM: 124, cpi: 113.6, realB: 0.35, h: 82, x: BAR_X0 + 4 * BAR_PITCH, rise: 107, peak: false },
  ],
  numeral: "$3B",
  tag: "TODAY'S DOLLARS",
  beats: {
    and: 0,
    thatWas: 10,
    peak: 23,
    history: 86,
    i: 107,
    three: 122,
    equivalent: 138,
    end: 177,
  },
});

// ---------------------------------------------------------------------------
// THE GROUND. `OneHugeQuestion`'s `PaperGround` with the knock-back taken out
// and a local oversize: parallax off the camera's own rest in BOTH axes, the
// same -0.3 px/frame drift, the same 1 + (k - 1) * 0.3 scale, `objectFit:
// cover`, and `rotate(90deg)` innermost so the landscape photograph covers the
// portrait box with its squares still square. No filter of any kind.
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
}> = ({ src, frame, cy, cyRest, cx, cxRest, k, parallax }) => {
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
          width: FRAME_H * BG_OVERSIZE_PFS,
          height: FRAME_W * BG_OVERSIZE_PFS,
          objectFit: "cover",
          filter: "none",
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

const CLIP_ID = "pfs-above-the-rule";

const PeakForSolar: React.FC<Props> = ({
  paperSrc,
  parallax,
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  bars,
  numeral,
  tag,
  beats,
}) => {
  const frame = useCurrentFrame();

  // -- the camera, first -----------------------------------------------------
  const cam = runCamera2(frame, PFS_CAM_F, PFS_CAM_CY, PFS_CAM_CX, PFS_CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- one rise, sampled at a different start frame per layer ----------------
  // Quick off the mark, then a long ease into place. Nothing fades: a layer
  // simply does not exist until its own frame.
  const riseAt = (f0: number, distance: number) => {
    const t = interpolate(frame, [f0, f0 + TRAVEL_FRAMES], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
    return (1 - t) * distance;
  };
  const slideAt = (f0: number, distance: number) => {
    const t = interpolate(frame, [f0, f0 + NUM_TRAVEL_FRAMES], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
    return (1 - t) * distance;
  };

  // A bar, as a rect standing on the rule: `h` up from BASE, `dy` down while it
  // is still travelling, `off` for the hard shadow's copy.
  const barRect = (x: number, h: number, dy: number, fill: string, off = 0) => (
    <rect x={x + off} y={BASE - h + dy + off} width={BAR_W} height={h} fill={fill} />
  );

  const type = (size: number, weight: 800 | 900) =>
    ({
      fontFamily,
      fontWeight: weight,
      fontSize: size,
      textTransform: "uppercase",
    }) as const;

  // White on its hard black copy — the same eight world px behind everything.
  const shadowedText = (
    key: string,
    text: string,
    x: number,
    y: number,
    size: number,
    weight: 800 | 900,
    tracking = 0,
  ) => (
    <g key={key}>
      <text
        x={x + shadowOffset + (tracking ? (-tracking * size) / 2 : 0)}
        y={y + shadowOffset}
        textAnchor="middle"
        fill={shadow}
        style={{ ...type(size, weight), letterSpacing: tracking ? `${tracking}em` : undefined }}
      >
        {text}
      </text>
      <text
        x={x + (tracking ? (-tracking * size) / 2 : 0)}
        y={y}
        textAnchor="middle"
        fill={ink}
        style={{ ...type(size, weight), letterSpacing: tracking ? `${tracking}em` : undefined }}
      >
        {text}
      </text>
    </g>
  );

  const peak = bars.find((b) => b.peak);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <PaperGround
        src={paperSrc}
        frame={frame}
        cy={cy}
        cyRest={PFS_CAM_CY[0]}
        cx={cx}
        cxRest={PFS_CAM_CX[0]}
        k={k}
        parallax={parallax}
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
              {/* Everything above the rule. A bar starts a full height below it
                  and travels up through this edge, so it grows out of the rule
                  instead of sliding past it. */}
              <clipPath id={CLIP_ID}>
                <rect x={-2000} y={-4000} width={6000} height={4000 + BASE} />
              </clipPath>
            </defs>

            {/* THE BARS, left to right, each on its own hard shadow. */}
            <g clipPath={`url(#${CLIP_ID})`}>
              {bars.map((b) => {
                if (frame < b.rise) {
                  return null;
                }
                if (!b.peak) {
                  const dy = riseAt(b.rise, b.h);
                  return (
                    <g key={b.year}>
                      {barRect(b.x, b.h, dy, shadow, shadowOffset)}
                      {barRect(b.x, b.h, dy, ink)}
                    </g>
                  );
                }
                // THE PEAK, and the one job the chain has in this cut: three
                // copies in the core's own column, arriving two frames apart
                // ahead of it, each a step taller — so the leading colour rides
                // above the next one all the way up and settles as a crown of
                // three 12 px stripes.
                const coreStart = b.rise + 3 * CHAIN_STAGGER;
                const coreDy = riseAt(coreStart, b.h);
                const chain = [
                  { color: orange, start: b.rise, extra: CROWN_OFFSETS.orange },
                  { color: purple, start: b.rise + CHAIN_STAGGER, extra: CROWN_OFFSETS.purple },
                  { color: blue, start: b.rise + 2 * CHAIN_STAGGER, extra: CROWN_OFFSETS.blue },
                ];
                return (
                  <g key={b.year}>
                    {/* the core's shadow, at the very back, on the core's own
                        timing so no grey ghost precedes the white */}
                    {frame >= coreStart ? barRect(b.x, b.h, coreDy, shadow, shadowOffset) : null}
                    {chain.map((c) =>
                      frame >= c.start ? (
                        <g key={c.color}>
                          {barRect(b.x, b.h + c.extra, riseAt(c.start, b.h + c.extra), c.color)}
                        </g>
                      ) : null,
                    )}
                    {frame >= coreStart ? barRect(b.x, b.h, coreDy, ink) : null}
                  </g>
                );
              })}
            </g>

            {/* THE RULE. It exists from frame 0 and never moves. */}
            <rect
              x={RULE_X0 + shadowOffset}
              y={BASE + shadowOffset}
              width={RULE_X1 - RULE_X0}
              height={RULE_W}
              fill={shadow}
            />
            <rect x={RULE_X0} y={BASE} width={RULE_X1 - RULE_X0} height={RULE_W} fill={ink} />

            {/* THE YEAR LABELS. Each exists from its bar's rise + 14. */}
            {bars.map((b) =>
              frame >= b.rise + LABEL_DELAY
                ? shadowedText(b.year, b.year, b.x + BAR_W / 2, YEAR_BASELINE, YEAR_SIZE, 900)
                : null,
            )}

            {/* "$3B" — the only numeral in the cut, over the only bar that
                carries one. It slides up 60 px and stops. */}
            {peak && frame >= beats.three
              ? shadowedText(
                  "numeral",
                  numeral,
                  peak.x + BAR_W / 2,
                  NUM_BASELINE + slideAt(beats.three, NUM_RISE),
                  NUM_SIZE,
                  900,
                )
              : null}

            {/* "TODAY'S DOLLARS" — it simply exists. */}
            {peak && frame >= beats.equivalent
              ? shadowedText("tag", tag, peak.x + BAR_W / 2, TAG_BASELINE, TAG_SIZE, 800, TAG_TRACK)
              : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default PeakForSolar;
