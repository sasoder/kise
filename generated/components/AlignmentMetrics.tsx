import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  worldTransform,
} from "./fieldShared";
import {
  BLOCK_CX,
  Bracket,
  COL_W,
  COL_X0,
  Caret,
  FPS,
  GRID_W0,
  INK,
  INK_HI,
  INK_LO,
  Label,
  PERSON_DX,
  ReaderLine,
  ReaderPerson,
  SKULL_BOX,
  SKULL_DX,
  SkullMark,
  WORD_H,
  WordBars,
  type Flag,
  bracketU,
  buildCamera,
  foundByReader,
  kTrack,
  labelIn,
  makeClock,
  makeColumn,
  makeExit,
  maxDv,
  maxV,
  readerAt,
  strokeFor,
} from "./punishShared";

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs` cut 4 — ALIGNMENT METRICS. In at 0:23.300.
//
//   "the model is scheming and doing misaligned things, in a way that's
//    actually not being detected in our alignment metrics."
//
// (On camera just before: "by looking at the chain of thought we can see, oh —".
//  So in the TEXT we CAN see the scheming. The METRIC cannot. That is the cut.)
//
// TWO INSTRUMENTS, ONE PAGE. Above, the chain of thought, where the reader
// finds scheming twice in a row — bracket + skull, bracket + skull. Below the
// writing line, OUR ALIGNMENT METRIC: a white trace drawn left to right at a
// dead constant rate along a hairline axis, riding high, with a live hashed
// wander of +-3 px so it is a signal and not a ruler. The camera lets go of
// the reader on "not being detected" and pulls back onto both at once, and the
// trace does not so much as twitch while two skulls sit above it. The trace
// runs from f0 to the last frame: the metric is alive the whole time.
//
// Everything in it is `punishShared`'s — the column, the word clock, the
// reader, the flags, the brackets, the skulls, the caret, the person, the
// camera, the exit. Nothing is restated here. What this file owns is the
// METRIC PANEL, which is 40 lines of geometry at the bottom, and the camera.
//
// DURATION = round(4.239 * 24) + 16 = 102 + 16 = 118.
// Word onsets, frames from this cut's own t0:
//   the 0 · model 2 · is 7 · SCHEMING 14 · and 23 · doing 27 · MISALIGNED 31 ·
//   things 40 · in-a 45 · way 49 · that's 51 · actually 55 · NOT 59 ·
//   being 62 · DETECTED 67 · in-our 77 · ALIGNMENT 89 · METRICS 94 ·
//   speech ends 102 · tail to 118.
//
// ---------------------------------------------------------------------------
// GESTURES — every one, with the word it serves. There are five, and the two
// that are not listed (the caret writing, the trace advancing) never stop.
//
//  1. f0-40   "the model is        THE READING. The camera holds the reader at
//             scheming / and       screen y ~740 and creeps IN on it, k 1.46 ->
//             doing misaligned     1.55 (0.15%/frame), while the page scrolls
//             things"              up past it at 4.32 world px/f. Nothing else
//                                  happens: this is the instrument we CAN read,
//                                  working. The person is OUTSIDE the right
//                                  edge and the reader line runs off it.
//  2. f7.9    "SCHEMING" (14)      FLAG 0. The reader's own y crosses line 21
//                                  and the bracket draws from its left end over
//                                  6 f, the orange skull drawing on with it,
//                                  complete at f13.9, ON the word. Caused by
//                                  the reader and by nothing else
//                                  (`foundByReader`).
//  3. f41.2   "misaligned THINGS"  FLAG 1, the same mechanism two lines down,
//             (31/40)              starting ON "things" and complete at f47.2,
//                                  inside the move. Two skulls in the left
//                                  margin now, 32 world px apart, drifting up
//                                  with the page.
//  4. f40-60  "in a way that's     THE ONE MOVE, and the only one. The camera
//             actually NOT BEING   lets go of the reader and pulls back onto
//             DETECTED" (59/67)    both instruments at once: k 1.55 -> 1.05,
//                                  cx 448 -> 540, content centre settling at
//                                  HOLD_Y - 140, warp 0.7 so the speed is early
//                                  in it. Damped, 96% of it is done by f63 —
//                                  four frames before "detected" — and the
//                                  person walks back into the right margin
//                                  across f49-53, inside the move, never
//                                  parked on the edge. The metric rises from
//                                  the bottom of the frame to screen 1248 with
//                                  room for its label under it, the two skulls
//                                  sit at 451/518, and the trace runs on
//                                  without a twitch.
//  5. f80-118 "in our ALIGNMENT    THE LABEL slides up 24 px under the axis
//             METRICS" (89/94)     over f80-90, nine frames ahead of
//                                  "alignment", and the camera creeps back in
//                                  on the panel, k 1.05 -> 1.06 by f102 and
//                                  1.07 by the last frame. Nothing else: the
//                                  trace stays high and flat while two skulls
//                                  sit above it.
//  tail f102-118                   The mechanism continuing: the reader reads
//                                  on (line 28 next, nothing there), the caret
//                                  writes, the page scrolls, and the trace
//                                  reaches the right-hand end of the axis
//                                  exactly at f118. Nothing lands on f102.
//
// ---------------------------------------------------------------------------
// MEASURED (`$S/AlignmentMetrics/measure.ts`, run against this file's exports;
// every line below is a printed number, not an estimate).
//   Camera        max |dv| of a fixed world point 1.92 screen px/f^2 (cap 2.5),
//                 max |v| 9.87. k 1.460 -> 1.546 (f43) -> 1.051 (96% of the
//                 move at f63, 99% at f66) -> 1.058 (f102) -> 1.070 (f117).
//   Heads         reader 2.7 screen px/f, page 7.8, trace head 7.6 — all well
//                 under the 45 cap. THE CARET IS 82.8 px/f at the closest
//                 zoom: that is the writing head crossing a word at 1/3.7
//                 words a frame, not a glide across the frame, and the
//                 reference cut V5 ran the same head at ~93.
//   Flags         found0 7.86 (assert 6..10), bracket u = 1 at f13.86;
//                 found1 41.20 (assert 39..44), u = 1 at f47.20. The two skull
//                 boxes are 32 world px apart (assert >= 20) and neither
//                 bracket comes nearer its own margin skull's ink than 149.0
//                 world px.
//   The metric    trace head world x at f118 = COL_X0 + COL_W, error 0.0e+0.
//                 Level 85.14..90.98 px above the axis (assert 85..91). Axis
//                 screen y 1248.2..1254.5 from f72 (assert 1150..1260). Lower
//                 skull 585 at f72 -> 354 at f117 (assert <= 700); upper skull
//                 451 -> 292 at f102, at FULL height through the whole of the
//                 speech, and only entering the top-exit band at f111, in the
//                 tail, where it thins out with its own line as the page moves
//                 on. Label in-T = 1 at f90; its ink bottoms at screen 1337,
//                 83 px clear of the caption band.
//   The frame     writing line screen y 985..1105, never below 1330. The
//                 left-margin skull's ink is never nearer the left edge than
//                 49.5 px; no drawn word is ever nearer the right edge than
//                 42.4 px (worst case line 19 at f40, x 1037.6); the person's
//                 ink is wholly outside the right edge from f0 to f48 and
//                 wholly inside from f54, straddling only on f49-53, which is
//                 inside the move.
//   The page      words, scroll and the reader are all non-decreasing on all
//                 118 frames; the reader's own |dv| is 3.6e-15, i.e. it is
//                 exactly constant, and its gap to the writing head never
//                 falls below 3.30 lines against a soft cap at 0.6, so the cap
//                 never touches it.
//   Energy        min per-frame sum of |delta| over every drawn element's
//                 screen position 41.5 (on f70), mean 110.2. There is no frame
//                 on which nothing moves.
//   Stroke        one weight, `strokeFor(1.3)` = 5.0 world px, which is
//                 5.26..7.73 screen px across the cut's zoom range against the
//                 6.5 nominal.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE BRIEF, one line each.
//  * k 1.65/1.68 -> 1.46/1.55, 1.12 -> 1.05, and the close is centred on cx
//    448 rather than on BLOCK_CX. See the framing note at the camera: the
//    block is 812.3 world px wide, the clip's rule allows only "whole block
//    in" or "person wholly out", and this cut's close has to keep the LEFT
//    margin, because two of its five gestures are a skull in it.
//  * Word rate 1/2.6 -> 1/3.7. At 1/2.6 the page scrolls 6.2 world px/f and
//    BOTH skulls have left the top of the frame before "metrics" (94), which
//    kills the cut's own picture. 1/3.7 is the fastest rate that still has
//    flag 0 at full height through the whole of the speech, and it stays clear
//    of the reader's soft cap, which bites below 1/4.2 and would slow down the
//    one thing in the frame whose steadiness is the argument.
//  * The metric is NOT out of frame at f0. With k capped by the block's width
//    a frame is at least 1240 world px tall, so an axis far enough below the
//    writing line to be hidden leaves a 600 px hole in the middle of the wide
//    shot. The axis stays at the briefed HOLD_Y + 250 and sits at screen 1457
//    at f0 — below the writing line, under the captions — and at f0 the trace
//    is a single dot at the left-hand end of it, which is as quiet as an
//    instrument that is already running can be. The cut is better for it: the
//    trace is visible, and visibly flat, on the two frames where the skulls
//    land, which is the contrast the brief is about.
//  * Flag 1 is on line 23, not line 22, and the reader starts at line 20.70,
//    not 20.16. DIRECTED REVISION: a 96 px skull on a 64 px pitch means two
//    flags on ADJACENT lines have their margin marks overlapping by 32 px, and
//    at f94 the pair read as one blob. Two lines apart leaves 32 px of
//    daylight, and the reader's line0 is then re-solved so the finds still sit
//    on words — line 21 crossed at f7.9 (bracket done ON "scheming", 14) and
//    line 23 at f41.2 (starting ON "things", 40, done at 47.2). Flag 1 is
//    words 1..3 rather than 0..2 for the same no-collision reason: line 23's
//    word 0 starts at the measure's edge and its bracket would close inside
//    the skull. The wide landing did not need re-solving — the lower skull
//    only moved 64 world px down, to screen 585 at f72 against a 700 ceiling,
//    and the axis is unmoved at 1248.
//  * The label is 39.4 world px, so it reads at 40 SCREEN px at the k it lives
//    at — the set's one label size.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 118;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotOpacity: z.number(),
  beats: z.object({
    scheming: z.number(),
    misaligned: z.number(),
    not: z.number(),
    detected: z.number(),
    alignment: z.number(),
    metrics: z.number(),
    ends: z.number(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    scheming: 14,
    misaligned: 31,
    not: 59,
    detected: 67,
    alignment: 89,
    metrics: 94,
    ends: 102,
  },
});

// ---------------------------------------------------------------------------
// THE PAGE. The clip's one column, at this cut's moment.
// ---------------------------------------------------------------------------
/** Line 0's top in world y. The scroll takes it off again; it only has to be
 *  above the hold by more than `PRE_LINES` lines, which it is. */
const LINE0 = 600;
/** The writing line's world y. The column scrolls to keep it here. */
const HOLD_Y = 1050;
/** How many lines are already on the page when we arrive. */
const PRE_LINES = 24;

/** Words per frame. The brief's 1/2.6 scrolls the page 6.2 world px/f, which
 *  carries both flagged lines out through the top before "metrics"; 1/3.7 is
 *  the fastest rate that keeps them, and is still well clear of the reader's
 *  soft cap at 1/4.2. */
const RATE = 1 / 3.7;

/** THE CLIP CONSTANT: the reader's rate, 0.06 lines per frame, the same in all
 *  eight cuts. It is the one thing in the frame that never changes speed. */
const READER_LPF = 0.06;
/** Where the reader is at f0. Solved (not eyeballed) so that the reader's own
 *  y crosses line 21 at f7.9 and line 23 at f41.2 — one bracket complete ON
 *  "scheming" (14) and the next starting ON "things" (40). */
const READER_LINE0 = 20.7;
/** Where the reader sits on screen while the camera is holding it. */
const READER_SCREEN_Y = 745;

export const COLUMN = makeColumn(11, 64, LINE0);
export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => RATE,
});

export const readerLineAt = (f: number) =>
  readerAt({
    f,
    f0: 0,
    line0: READER_LINE0,
    linesPerFrame: READER_LPF,
    capLine: CLOCK.headLine,
  });

const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);
/** The reader's line, in WORLD y — the column's own y with the scroll off. */
export const readerWorldY = (f: number) => COLUMN.lineYf(readerLineAt(f)) - scrollAt(f);

// ---------------------------------------------------------------------------
// THE TWO FLAGS. Both are caused by the reader crossing the line and by
// nothing else. The frames below are read out of `foundByReader`, not chosen.
//
// THEY ARE TWO LINES APART, NOT ONE. On adjacent lines the two margin skulls
// touch: the mark is `SKULL_BOX` 96 world px on a `PITCH` of 64, so one line
// of separation leaves -32 px between the boxes and the pair reads as one
// blob. Lines 21 and 23 leave 32 px of daylight, and a reader running at the
// clip's own 0.06 lines a frame takes 33 frames to get from one to the other
// — which is what puts the second find on "things" (40) rather than on top of
// the first.
//
// FLAG 1 IS WORDS 1..3, not 0..2: line 23's word 0 starts at the measure's
// left edge, so a bracket round it would close 2.3 px INSIDE the margin
// skull's own ink. 1..3 leaves 158 px between them, and gives the second
// bracket the same shape and place in the line as the first — two finds that
// look like the same kind of find.
// ---------------------------------------------------------------------------
export const FLAGS: Flag[] = [
  { line: 21, k0: 1, k1: 3, found: foundByReader(COLUMN, 21, readerLineAt, 0, DURATION) },
  { line: 23, k0: 1, k1: 3, found: foundByReader(COLUMN, 23, readerLineAt, 0, DURATION) },
];
if (!(FLAGS[0].found >= 6 && FLAGS[0].found <= 10)) {
  throw new Error(`AlignmentMetrics: flag 0 found at ${FLAGS[0].found}, not in 6..10`);
}
if (!(FLAGS[1].found >= 39 && FLAGS[1].found <= 44)) {
  throw new Error(`AlignmentMetrics: flag 1 found at ${FLAGS[1].found}, not in 39..44`);
}
/** The two margin skulls must never touch. Their boxes are `SKULL_BOX` tall
 *  and centred on their own line's word band. */
export const SKULL_GAP =
  COLUMN.lineY(FLAGS[1].line) - COLUMN.lineY(FLAGS[0].line) - SKULL_BOX;
if (SKULL_GAP < 20) {
  throw new Error(`AlignmentMetrics: the two skulls are ${SKULL_GAP} world px apart, under 20`);
}

// ---------------------------------------------------------------------------
// THE METRIC PANEL. OUR instrument, so it is white, and it is fixed in WORLD
// space: it does not scroll with the page, because the page is the model's and
// this is not. A hairline axis across the measure, a trace drawn along it
// left to right at a constant rate, a solid dot at the head (the pen), and the
// label under the axis.
//
// THE TRACE IS A FUNCTION OF X, NEVER OF THE FRAME OR OF ANYTHING ABOVE IT.
// That is the whole point of the cut: it cannot respond to the scheming
// because nothing in it is wired to the scheming. Its wander is two octaves of
// sine on world x, 1.9 + 1.1 = 3.0 px of amplitude about a level 88 px above
// the axis, so it reads as a live signal held steady rather than as a ruler.
// ---------------------------------------------------------------------------
const AXIS_DY = 250;
export const AXIS_Y = HOLD_Y + AXIS_DY;
const AXIS_X0 = COL_X0;
const AXIS_X1 = COL_X0 + COL_W;
const TRACE_LEVEL = 88;
const TRACE_A1 = 1.9;
const TRACE_A2 = 1.1;
/** World px of trace per frame, solved so the head lands on the axis's right
 *  end exactly at f`DURATION`. */
const TRACE_PER_F = COL_W / DURATION;
export const traceHeadX = (f: number) => AXIS_X0 + TRACE_PER_F * Math.max(0, f);
export const traceY = (x: number) => {
  const u = x - AXIS_X0;
  return AXIS_Y - TRACE_LEVEL + TRACE_A1 * Math.sin(u * 0.021) + TRACE_A2 * Math.sin(u * 0.053 + 1.7);
};
/** The drawn trace, sampled every 4 world px with the head as the last point. */
const traceD = (headX: number) => {
  const pts: string[] = [];
  for (let x = AXIS_X0; x < headX; x += 4) pts.push(`${x.toFixed(2)} ${traceY(x).toFixed(2)}`);
  pts.push(`${headX.toFixed(2)} ${traceY(headX).toFixed(2)}`);
  return `M${pts.join(" L")}`;
};
const TRACE_HEAD_R = 7;
const LABEL_F0 = 80;
const LABEL_DY = 40;
/** The label reads at 40 SCREEN px at the k it lives at (1.00-1.035), which is
 *  the set's one label size. */
const LABEL_SIZE = 40 / 1.015;

// ---------------------------------------------------------------------------
// THE CAMERA. Three segments, one job each, and the landing measured off the
// DAMPED table rather than off the key track — `runCamera` lags, so the move
// is authored to finish at f62 and lands at f71.
//
//   f0-44    creep IN on the reader, 1.20 -> 1.27. 1.27 is the ceiling: the
//            block is 812.3 world px wide and 1.33 starts cutting the skull
//            and the person off against the frame's edges.
//   f44-62   let go and pull back, 1.27 -> 1.00, warp 0.7 so the speed is
//            early in the move. Damped, 99.6% of it is done by f71 — four
//            frames before "detected" (67)... and the picture it lands on is
//            held for the rest of the cut.
//   f62-118  creep back in on the panel, 1.00 -> 1.030 by f102, 1.035 by the
//            end. Slow enough to read as a breath, big enough that nothing is
//            ever parked.
//
// cy is the CONTENT centre; `buildCamera` adds CAM_LIFT/k itself off the eased
// k, so a point at the content centre sits at screen y 835 and the composition
// cannot sag while the zoom runs. Before the move the content centre TRACKS
// the reader (which is drifting up the world at 0.34 px/f as the page outruns
// it); after it, it is a fixed world point 160 px above the writing line,
// solved so the axis lands at screen 1245 and the upper skull is still clear of
// the top-exit band on the last frame.
// ---------------------------------------------------------------------------
/** THE CLIP'S FRAMING RULE (set on cut 6, applied here). With the person in
 *  the right margin the block is 812.3 world px, so a camera on `BLOCK_CX`
 *  cannot go past k 1.33 without cutting the person's ink against the right
 *  edge. Only two framings are legal: WIDE, k <= 1.30 on `BLOCK_CX` with the
 *  whole block in; and CLOSE, the person FULLY outside the right edge and the
 *  reader line running off it. Nothing may ever be PARKED straddling an edge —
 *  a straddle is allowed only while a move is running.
 *
 *  THE CLOSE IS SOLVED ON THIS CUT'S OWN SUBJECT. The rule's default close
 *  centres on the text axis (532) at k >= 1.75; that cannot be this cut,
 *  because two of its five gestures are a SKULL in the LEFT margin, and at
 *  1.75 on 532 the frame's left edge is world x 223 against skull ink that
 *  runs 133.9..234.5 — the mark the cut is about is a 9 px sliver. So the
 *  close is centred on the SKULL + TEXT block instead (its ink runs 133.9 ..
 *  820.2) and k is capped where the two edges meet:
 *    person ink left    857.9 ->  screen >= 1110 (fully out, 30 px clear)
 *    reader right dot   829.0 ->  screen >= 1080 (the WHOLE dot off the edge:
 *                                 a half dot parked on the edge is the same
 *                                 fault as a half person, one size down)
 *    skull ink left     133.9 ->  screen >= 20   (fully in)
 *    longest line's end 780.3 ->  screen <= 1060 (no word ever cut)
 *  At cx 448 that is k in [1.46, 1.57]. The close opens at 1.46 — the k at
 *  which the axis's own right end has just gone off the edge too, so no line
 *  in the frame ENDS at the edge — and creeps to 1.55, 0.15%/frame, so the
 *  hold is never parked. The skull is 149
 *  screen px, against the 130 the reference cut was approved at. */
const CX_CLOSE = 448;
const K0 = 1.46;
const K_CLOSE = 1.55;
/** The wide. 1.05 and not the 1.12 the rule suggests: the flagged lines SCROLL
 *  UP the page at 4.32 world px/f, so by the last frame the upper skull is
 *  718 world px above the writing line and the axis 250 below it — 968 px
 *  apart, rigidly (968 * k) apart on screen. At 1.12, with the axis inside the
 *  briefed 1150..1260 band, the upper skull is at screen 66. 1.05 keeps it on
 *  the page through the whole of the speech and only lets it thin out through
 *  the top exit in the last frames of the tail, which is what the page doing
 *  what it does looks like. */
const K_WIDE = 1.05;
const K_END = 1.065;
const K_LAST = 1.07;
const F_MOVE0 = 40;
const F_MOVE1 = 60;
/** The one k the cut's stroke weight is fixed at: the middle of its range, so
 *  `STROKE_PX` is within 20% of 6.5 screen px at every zoom in the cut — the
 *  cut runs 1.05 to 1.55, so no single world width can be 6.5 at both ends. */
export const K_REST = 1.3;
const STROKE = strokeFor(K_REST);

/** The fixed content centre the pull-back settles on. */
const CY_WIDE = HOLD_Y - 140;

const K_TRACK = kTrack(
  [
    { f0: 0, f1: F_MOVE0, k0: K0, k1: K_CLOSE, warp: 1 },
    { f0: F_MOVE0, f1: F_MOVE1, k0: K_CLOSE, k1: K_WIDE, warp: 0.7 },
    { f0: F_MOVE1, f1: 102, k0: K_WIDE, k1: K_END, warp: 1 },
    { f0: 102, f1: DURATION + 2, k0: K_END, k1: K_LAST, warp: 1 },
  ],
  DURATION + 2,
);

/** 0 while the camera is on the reader, 1 once it has settled on both. */
const moveU = (f: number) => camEase(clamp01((f - F_MOVE0) / (F_MOVE1 - F_MOVE0)), 0.7);

export const CAM = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: (f) => {
    const u = moveU(f);
    return CX_CLOSE * (1 - u) + BLOCK_CX * u;
  },
  cy: (f) => {
    const track = readerWorldY(f) + (835 - READER_SCREEN_Y) / K_TRACK[Math.min(f, DURATION + 2)];
    const u = moveU(f);
    return track * (1 - u) + CY_WIDE * u;
  },
});
export const CAM_AT = CAM.CAM_AT;
export const SCREEN_AT = CAM.SCREEN_AT;

// ---------------------------------------------------------------------------
// WHAT MOVES. The energy audit: every drawn element's screen position and size
// on one list, so "is anything standing still" is a number and not an opinion.
// ---------------------------------------------------------------------------
export const stateAt = (f: number) => {
  const c = CAM_AT(f);
  const s = scrollAt(f);
  const head = CLOCK.headAt(f);
  const out: number[] = [c.cx, c.cy, c.k * 1000];
  out.push(...SCREEN_AT(f, head.x + COL_X0, head.y - s));
  out.push(...SCREEN_AT(f, 0, readerWorldY(f)));
  out.push(...SCREEN_AT(f, traceHeadX(f), traceY(traceHeadX(f))));
  out.push(...SCREEN_AT(f, COL_X0, COLUMN.lineY(FLAGS[0].line) - s));
  out.push(bracketU(FLAGS[0].found, f) * 100, bracketU(FLAGS[1].found, f) * 100);
  out.push(labelIn(f, LABEL_F0) * 100);
  out.push(CLOCK.wordsAt(f) * 50);
  return out;
};
export const energyAt = (f: number) => {
  const a = stateAt(f - 1);
  const b = stateAt(f);
  let e = 0;
  for (let i = 0; i < b.length; i++) e += Math.abs(b[i] - a[i]);
  return e;
};

export const STATS = (() => {
  const k: number[] = [];
  const pt: number[][] = [];
  const energy: number[] = [];
  for (let f = 0; f <= DURATION; f++) {
    k.push(CAM_AT(f).k);
    pt.push(SCREEN_AT(f, BLOCK_CX, HOLD_Y));
    energy.push(f === 0 ? energyAt(1) : energyAt(f));
  }
  return {
    duration: DURATION,
    found: FLAGS.map((f) => Number(f.found.toFixed(2))),
    kAt: [0, 44, 62, 71, 72, 102, 117].map((f) => [f, Number(CAM_AT(f).k.toFixed(4))]),
    camDv: Number(maxDv(pt.map((p) => p[1])).toFixed(3)),
    camV: Number(maxV(pt.map((p) => p[1])).toFixed(3)),
    kMaxDv: Number(maxDv(k).toFixed(5)),
    minEnergy: Number(Math.min(...energy).toFixed(2)),
    traceEnd: Number(traceHeadX(DURATION).toFixed(4)),
  };
})();

// ---------------------------------------------------------------------------
const AlignmentMetrics: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotOpacity,
}) => {
  const frame = useCurrentFrame();
  const cam = CAM_AT(frame);
  const { cx, cy, k } = cam;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const scroll = scrollAt(frame);
  const head = CLOCK.headAt(frame);
  const readerY = readerWorldY(frame);
  const exitAt = makeExit(cy, k);
  const headX = traceHeadX(frame);
  const labelT = labelIn(frame, LABEL_F0);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_W0 + frame}
        cy={cy}
        cyRest={CAM.CY_REST}
        cx={cx}
        cxRest={CAM.CX_REST}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
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
            {/* --- THE PAGE: the model's chain of thought, and us reading it - */}
            <g>
              <WordBars
                column={COLUMN}
                clock={CLOCK}
                frame={frame}
                scroll={scroll}
                accent={accent}
                exitAt={exitAt}
                opacity={dotOpacity}
              />

              {FLAGS.map((fl, j) => {
                const wy = COLUMN.lineY(fl.line) - scroll;
                const ex = exitAt(wy + WORD_H / 2);
                if (ex <= 0.004) return null;
                const u = bracketU(fl.found, frame);
                return (
                  <g key={`f${j}`}>
                    <Bracket
                      column={COLUMN}
                      flag={fl}
                      u={u}
                      stroke={STROKE}
                      ink={ink}
                      scroll={scroll}
                      exit={ex}
                      k={k}
                    />
                    <SkullMark
                      x={COL_X0 - SKULL_DX}
                      y={wy + WORD_H / 2}
                      u={u}
                      scale={ex}
                      accent={accent}
                      opacity={dotOpacity}
                      k={k}
                    />
                  </g>
                );
              })}

              <ReaderLine yWorld={readerY} stroke={STROKE} ink={ink} k={k} />

              <Caret x={head.x + COL_X0} y={head.y - scroll} accent={accent} opacity={dotOpacity} />
            </g>

            {/* --- THE METRIC PANEL: ours, fixed in world, below the page ---- */}
            <g style={{ filter: icon }}>
              <line
                x1={AXIS_X0}
                y1={AXIS_Y}
                x2={AXIS_X1}
                y2={AXIS_Y}
                stroke={ink}
                strokeWidth={STROKE * 0.5}
                strokeLinecap="round"
                opacity={INK_LO}
              />
              <path
                d={traceD(headX)}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={INK_HI}
              />
              <circle cx={headX} cy={traceY(headX)} r={TRACE_HEAD_R} fill={ink} opacity={INK_HI} />
            </g>
          </svg>

          {/* --- DOM, inside the same world transform, never inside the svg --- */}
          <ReaderPerson x={COL_X0 + COL_W + PERSON_DX} y={readerY} k={k} opacity={INK_HI} />
          <Label
            k={k}
            x={BLOCK_CX}
            y={AXIS_Y + LABEL_DY}
            text="Alignment metric"
            inT={labelT}
            size={LABEL_SIZE}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AlignmentMetrics;
