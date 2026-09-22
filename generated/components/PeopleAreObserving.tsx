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
  worldTransform,
} from "./fieldShared";
import {
  BLOCK_CX,
  Bracket,
  COL_W,
  COL_X0,
  CARET_LEAD,
  Caret,
  FPS,
  GRID_W0,
  INK,
  INK_HI,
  PERSON_DX,
  PERSON_BOX,
  PITCH,
  READER_X0,
  READER_X1,
  ReaderLine,
  ReaderPerson,
  WORD_H,
  WordBars,
  buildCamera,
  curve,
  flagBox,
  kTrack,
  makeClock,
  makeColumn,
  makeExit,
  readerAt,
  strokeFor,
  type Flag,
} from "./punishShared";

export { FPS };

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs`, CUT 7 — `PeopleAreObserving`, in at 0:52.920.
//
//   "because you could have a situation where the model understands what chain
//    of thought is and that people are observing it."
//
// Onsets (frames from this cut's own t0): because 0 · you 5 · could 9 ·
// have-a 11 · situation 17 · where 25 · the 30 · model 33 · understands 38 ·
// what 49 · chain 61 · of 66 · thought 69 · is-and 72 · that 88 · people 98 ·
// are 112 · observing 115 · it 122 · speech ends 130 · tail to 146.
//   DURATION = round(5.420 * 24) + 16 = 130 + 16 = 146.
//
// THE IDEA: THE MODEL DRAWS OUR INSTRUMENTS IN ITS OWN COLOUR.
// Same page as every other cut (`makeColumn(11, 64, LINE0)`), 46 lines deep,
// the white reader descending above the writing line with its person beside
// it. On "understands what" the caret stops writing, hops back up to the
// phrase it just finished and TRACES A BRACKET ROUND IT — the same rounded box
// the white reader leaves, but orange: the model knows its thought is a thing
// that gets read and marked. On "are observing" it leaves the head again and
// SWEEPS AN ORANGE READER LINE, end dots and all, straight across the column
// under its last written line — a copy of the white one descending above it.
// It has drawn the observer. Then it carriage-returns along its own line and
// writes the tail UNDER it. No skulls, no white brackets, nothing else.
//
// THE RHYME IS THE CUT: white line + person above, orange bracket and orange
// line below, held in one frame from f94 on. Both orange instruments are drawn
// BY THE CARET — the stroke's drawn length is the caret's own arc length, so
// nothing appears that the model did not draw.
//
// ---------------------------------------------------------------------------
// GESTURES — every one with the word it serves. Nothing else moves on its own.
//
//  1. f0-38    "because you could have a       The world. The caret writes
//              situation where the model"      line 46 -> 50 at 0.400 w/f; the
//                                              white reader descends at the
//                                              clip's own READER_LPF; camera
//                                              creeps 1.25 -> 1.27.
//  2. f30-46   "understands" (38) / "what"     ONE push, WIDE -> CLOSE: k 1.27
//              (49)                            -> 1.75 on the text axis, the
//                                              person leaving frame right with
//                                              the move. Lands f46.
//  3. f40-46   "understands" (38)              The caret leaves the head (it
//                                              has just wrapped onto line 50)
//                                              and glides up-left to the top-
//                                              left corner of line 49's first
//                                              three words.
//  4. f46-58   "chain" (61)                    THE ORANGE BRACKET. The caret
//                                              traces that box clockwise at
//                                              constant arc speed and the
//                                              bracket draws behind it, exactly
//                                              as far as the caret has gone.
//                                              Complete f58, three frames
//                                              before "chain".
//  5. f58-66   "of thought" (66/69)            The caret glides back to the
//                                              head; the clock resumes at f66
//                                              and the writing carries on
//                                              under the box it just drew.
//  6. f84-96   "and that" (72/88) /            ONE tilt up and out, CLOSE ->
//              "people" (98)                   WIDE: k 1.78 -> 1.30, back onto
//                                              the block's axis, so the white
//                                              reader AND ITS PERSON come back
//                                              into the picture over the orange
//                                              bracket. The person arriving IS
//                                              "people". Lands f94.
//  7. f104-118 "are" (112) / "observing"       THE ORANGE READER LINE. The
//              (115)                           caret leaves the head (wrapped
//                                              onto line 54), drops to the gap
//                                              half a pitch under line 53 and
//                                              sweeps left to right at constant
//                                              speed with the line drawing
//                                              behind it, its end dots riding
//                                              the growing end. Complete f118,
//                                              four frames before "it" (122).
//  8. f118-128 "it" (122)                      The carriage return: the caret
//                                              slides back along its own new
//                                              line, dipping just under it, to
//                                              the head. Clock resumes f128.
//  9. f128-146 tail                            The caret writes UNDER its own
//                                              orange line; the white reader
//                                              keeps descending; the camera
//                                              follows the scroll down 60 world
//                                              px. Nothing lands on f130.
//
// ---------------------------------------------------------------------------
// WHAT THE CLOCK HAD TO DO, AND WHY THE LINE NUMBERS MOVED.
// The brief asks for the bracket round "line 46 words 0..2" and for the reader
// to sit 2.5-4.5 lines behind the head and never be capped. Those two cannot
// both be had: the reader runs at the clip constant READER_LPF = 0.06 lines a
// frame, so it gains 8.76 lines across the cut, and for the gap to stay inside
// [2.5, 4.5] the head has to advance 8-10 lines too — which is the brief's own
// 1/2.4 words a frame, and puts the head four lines past line 46 by f40. The
// gap constraint is the binding one (a capped reader is visible; which line
// carries the box is not), so the mechanism is kept and the phrase moves with
// the head: the box is round WORDS 0..2 OF THE LINE THE CARET HAS JUST
// FINISHED at f40, which is line 49, and the second drawing hangs under line
// 53. Solved exactly:
//   * the two holds cost the reader 1.56 and 1.44 lines of gap, so the gap must
//     sit at [4.06, 4.5] when a hold starts; with the head landing on an
//     integer line at f40 and f104 (which is what makes both caret glides
//     short), the only solution is head 50 at f40, head 54 at f104, reader
//     43.30 at f0 — gap 2.70 / 4.30 / 2.74 / 4.46 / 3.02 / 3.81, never capped.
//   * rates fall out of it: 16 words in 40 frames = 0.400 w/f, then 17 in 38 =
//     0.4474, then the clip's 1/2.4. Both changes happen INSIDE a hold, so the
//     caret is never seen changing speed.
// The head landing exactly on a line start is what makes the choreography
// legal: the caret is at the left of an empty line when it leaves, so the hop
// to the box's corner is 89 world px and the drop to the new line's left end is
// 51, instead of the 300-700 px flights a mid-line head would have needed.
//
// FRAMING — the clip's two legal frames, and nothing between them.
// With the person in the right margin the block is 812 world px, so a camera on
// BLOCK_CX caps at k 1.33 before the person's ink crosses the frame edge. This
// cut uses WIDE (k <= 1.30 on BLOCK_CX, whole block in frame) and CLOSE (k 1.75
// on the TEXT axis, cx 510: the person is 52 world px outside the right edge,
// the reader line runs off that edge, and its left dot is still 35 screen px
// inside the left one). The camera is only ever between the two DURING the two
// moves; the person is never parked half-visible.
//
// ---------------------------------------------------------------------------
// MEASURED (`$S/PeopleAreObserving/measure.ts`, every number below printed by
// it; every assertion in the cut brief is an assertion in that script).
//   camera    max |v| of a fixed world point 7.92 screen px/f, max |dv| 1.875
//             (cap 2.5). k 1.250 f0 · 1.287 f30 · 1.741 f46 · 1.760 f58 ·
//             1.305 f94 · 1.278 f146: the push is 98.2% complete on f46 (three
//             frames before "what") and the tilt 99.0% on f94 (four before
//             "people"). The frame is never parked: a fixed world point moves
//             under 0.4 screen px on four frames only, f1-4 while the damper
//             leaves rest and f96-97 as the tilt settles.
//   clock     head line 46.00 f0 · 50.00 f40 · 50.00 f66 · 54.00 f104 · 54.00
//             f128 · 55.70 f146; holds exactly [40,66) and [104,128).
//   reader    43.30 -> 52.06 at a flat 0.06 lines/f; gap to the head 2.70 min,
//             4.46 max, and the soft cap is never reached on any frame.
//   caret     THE WORLD'S OWN SPEED IS THE UNIT HERE: writing moves the caret
//             up to 77.5 world / 137.6 screen px a frame, and an ordinary line
//             wrap is a 494 world px jump in ONE frame. Against that the three
//             free glides are 39.7, 30.0 and 27.8 screen px/f — all inside the
//             45 the brief asks for — and the three DRAWN moves, where the
//             caret is the growing end of a stroke and cannot read as a flying
//             object, are trace 115.0, sweep 71.2, carriage return 110.6
//             screen px/f: every one of them slower on screen than the model
//             writing normally.
//   geometry  writing line screen y 1182-1249, lowest drawn ink 1303 — 117 px
//             clear of the caption band. Box perimeter 784 world px. Stroke
//             `strokeFor(1.30)` = 5.00 world px.
//   text      non-decreasing on all 146 frames; per-frame energy min 8.42.
//
// DEVIATIONS FROM THE CUT BRIEF, one line each.
//   * The bracket is round line 49's words 0..2, not line 46's, and the orange
//     line hangs under line 53: at the rate the reader's own gap assertion
//     forces, the head is four lines past 46 by f40 (see above).
//   * The reader starts at line 43.30, not 42.80 — the only start that keeps
//     the gap inside [2.5, 4.5] across both holds with the head landing on a
//     line start at f40 and f104.
//   * CLOSE is k 1.75 on the text axis, not 1.60, and the tilt lands WIDE at
//     1.30, not 1.40: at 1.33-1.75 on the block's axis the person's ink
//     straddles the right edge, and this clip never parks a half-visible
//     person.
//   * The sweep runs f107-118, not f108-120, and its carriage return f118-128:
//     it puts the finished line four frames before "it" instead of two, and
//     gives the return ten frames instead of eight.
//   * The camera's own creep is a 0.7 world px/f linear sink under everything
//     rather than a 60 px drift over f110-130; the drift is in it, but it has
//     to beat `sway` on every frame, not just on average.
// ---------------------------------------------------------------------------

export const DURATION = 146;

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
    understands: z.number(),
    what: z.number(),
    chain: z.number(),
    thought: z.number(),
    that: z.number(),
    people: z.number(),
    are: z.number(),
    observing: z.number(),
    it: z.number(),
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
    understands: 38,
    what: 49,
    chain: 61,
    thought: 69,
    that: 88,
    people: 98,
    are: 112,
    observing: 115,
    it: 122,
  },
});

// ---------------------------------------------------------------------------
// THE PAGE. The clip's one column, seen at its 46th line. LINE0 only decides
// where the page sits in the world before the scroll takes it off again, so it
// cancels out of every drawn position; it is here so the scroll is positive.
// ---------------------------------------------------------------------------
const LINE0 = 300;
export const COLUMN = makeColumn(11, 64, LINE0);
/** The writing line's world y. The scroll holds the head here. */
const HOLD_Y = 1100;
const PRE_LINES = 46;

/** The two spans where the caret is away and the clock freezes. */
const HOLD_A: [number, number] = [40, 66];
const HOLD_B: [number, number] = [104, 128];

/** Words a frame. Both changes happen inside a hold, so neither is ever seen.
 *  Solved so the head lands exactly on the start of line 50 at f40 and of line
 *  54 at f104 — see the header. */
const RATE_A = 0.4; // 16 words (lines 46-49) in 40 frames
const RATE_B = 17 / 38; // 17 words (lines 50-53) in 38 frames
const RATE_C = 1 / 2.4; // the clip's own rate, for the tail

export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: (f) => (f < HOLD_A[0] ? RATE_A : f < HOLD_B[0] ? RATE_B : RATE_C),
  holds: [HOLD_A, HOLD_B],
});

if (Math.abs(CLOCK.headLine(HOLD_A[0]) - 50) > 1e-6) {
  throw new Error(`PeopleAreObserving: head at f40 is ${CLOCK.headLine(40)}, not line 50`);
}
if (Math.abs(CLOCK.headLine(HOLD_B[0]) - 54) > 1e-6) {
  throw new Error(`PeopleAreObserving: head at f104 is ${CLOCK.headLine(104)}, not line 54`);
}

// ---------------------------------------------------------------------------
// US, READING. The reader's rate is the clip constant: 0.06 lines per frame in
// every cut, never eased. It is softly capped at the writing head and in this
// cut the cap is never reached — the gap stays in [2.70, 4.46] lines.
// ---------------------------------------------------------------------------
/** lines per frame — the clip constant, the same in all eight cuts */
export const READER_LPF = 0.06;
const READER_L0 = 43.3;
export const readerLine = (f: number) =>
  readerAt({
    f,
    f0: 0,
    line0: READER_L0,
    linesPerFrame: READER_LPF,
    capLine: CLOCK.headLine,
  });

// ---------------------------------------------------------------------------
// WHAT THE MODEL BOXES. The first three words of the line it has just finished
// when it stops writing — line 49. `found` is the frame the caret reaches the
// box's corner, so the bracket cannot start before the caret is on it.
// ---------------------------------------------------------------------------
const TRACE: [number, number] = [46, 58];
export const FLAG: Flag = { line: 49, k0: 0, k1: 2, found: TRACE[0] };
const BOX = flagBox(COLUMN, FLAG);
const BOX_R = Math.min(12, (BOX.y1 - BOX.y0) / 2);

// ---------------------------------------------------------------------------
// THE BOX PATH, by arc length, clockwise from (x0 + r, y0) — the same point
// `roundRect` starts at and the same direction it runs, so the caret's arc
// fraction IS the bracket's `pathLength` fraction and the stroke can never
// lead or lag the hand drawing it.
// ---------------------------------------------------------------------------
const boxPath = (() => {
  const w = BOX.x1 - BOX.x0 - 2 * BOX_R;
  const h = BOX.y1 - BOX.y0 - 2 * BOX_R;
  const q = (Math.PI * BOX_R) / 2;
  const segs = [w, q, h, q, w, q, h, q];
  const total = segs.reduce((a, b) => a + b, 0);
  const at = (u: number) => {
    let t = clamp01(u) * total;
    const x0 = BOX.x0;
    const y0 = BOX.y0;
    const x1 = BOX.x1;
    const y1 = BOX.y1;
    const r = BOX_R;
    const arc = (cx: number, cy: number, a0: number, a1: number, g: number) => ({
      x: cx + r * Math.cos(a0 + (a1 - a0) * g),
      y: cy + r * Math.sin(a0 + (a1 - a0) * g),
    });
    if (t <= segs[0]) return { x: x0 + r + t, y: y0 };
    t -= segs[0];
    if (t <= segs[1]) return arc(x1 - r, y0 + r, -Math.PI / 2, 0, t / segs[1]);
    t -= segs[1];
    if (t <= segs[2]) return { x: x1, y: y0 + r + t };
    t -= segs[2];
    if (t <= segs[3]) return arc(x1 - r, y1 - r, 0, Math.PI / 2, t / segs[3]);
    t -= segs[3];
    if (t <= segs[4]) return { x: x1 - r - t, y: y1 };
    t -= segs[4];
    if (t <= segs[5]) return arc(x0 + r, y1 - r, Math.PI / 2, Math.PI, t / segs[5]);
    t -= segs[5];
    if (t <= segs[6]) return { x: x0, y: y1 - r - t };
    t -= segs[6];
    return arc(x0 + r, y0 + r, Math.PI, (3 * Math.PI) / 2, t / segs[7]);
  };
  return { at, total, start: { x: BOX.x0 + BOX_R, y: BOX.y0 } };
})();

// ---------------------------------------------------------------------------
// THE ORANGE READER LINE. It hangs in the gap half a pitch under line 53 — the
// last line the model wrote before it stopped — so the tail is written under
// it. Everything here is in COLUMN coordinates (x from `COL_X0`, y before the
// scroll), which is what makes the caret continuous across a hand-off: the
// page may still be settling under it, and the caret is attached to the page.
// ---------------------------------------------------------------------------
const SWEEP: [number, number] = [107, 118];
const GLIDE_B: [number, number] = [104, 107];
const RETURN_B: [number, number] = [118, 128];
/** Half a pitch below line 53 — measured from the BAR BAND's centre, not from
 *  the line's top: at +32 the line's end dots came within 3 world px of line
 *  53's bars and read as underlining them. At +43 the line and its dots sit
 *  centred in the 42 px of daylight between line 53 and line 54, 14 px clear
 *  of each. */
const OLINE_Y = COLUMN.lineY(53) + WORD_H / 2 + PITCH / 2;
const OLINE_X0 = READER_X0 - COL_X0;
const OLINE_X1 = READER_X1 - COL_X0;

const GLIDE_A: [number, number] = [40, 46];
const RETURN_A: [number, number] = [58, 66];

/** The caret's DRAWN centre, in column coordinates. When it is writing that is
 *  the head plus its lead; the lead is carried here rather than by `Caret`, so
 *  every hand-off is continuous to the pixel instead of stepping by 11. */
export const caretAt = (f: number): { x: number; y: number; drawing: number } => {
  const head = (g: number) => {
    const h = CLOCK.headAt(g);
    return { x: h.x + CARET_LEAD, y: h.y + WORD_H / 2 };
  };
  // --- the bracket ---------------------------------------------------------
  if (f >= GLIDE_A[0] && f < TRACE[0]) {
    const u = camEase((f - GLIDE_A[0]) / (GLIDE_A[1] - GLIDE_A[0]), 1);
    const p = curve(head(GLIDE_A[0]), boxPath.start, u, 0.05);
    return { ...p, drawing: 0 };
  }
  if (f >= TRACE[0] && f < RETURN_A[0]) {
    const u = clamp01((f - TRACE[0]) / (TRACE[1] - TRACE[0]));
    return { ...boxPath.at(u), drawing: u };
  }
  if (f >= RETURN_A[0] && f < HOLD_A[1]) {
    const u = camEase((f - RETURN_A[0]) / (RETURN_A[1] - RETURN_A[0]), 1);
    const p = curve(boxPath.start, head(HOLD_A[1]), u, 0.05);
    return { ...p, drawing: 1 };
  }
  // --- the orange reader line ---------------------------------------------
  if (f >= GLIDE_B[0] && f < SWEEP[0]) {
    const u = camEase((f - GLIDE_B[0]) / (GLIDE_B[1] - GLIDE_B[0]), 1);
    const p = curve(head(GLIDE_B[0]), { x: OLINE_X0, y: OLINE_Y }, u, 0.05);
    return { ...p, drawing: 1 };
  }
  if (f >= SWEEP[0] && f < RETURN_B[0]) {
    // constant speed: this is a scan line being drawn, and a scan line that
    // eases is a scan line that hesitates.
    const u = clamp01((f - SWEEP[0]) / (SWEEP[1] - SWEEP[0]));
    return { x: OLINE_X0 + (OLINE_X1 - OLINE_X0) * u, y: OLINE_Y, drawing: 1 };
  }
  if (f >= RETURN_B[0] && f < HOLD_B[1]) {
    // the carriage return, dipping just under the line it has drawn so it
    // never reads as unwriting it.
    const u = camEase((f - RETURN_B[0]) / (RETURN_B[1] - RETURN_B[0]), 1);
    const p = curve({ x: OLINE_X1, y: OLINE_Y }, head(HOLD_B[1]), u, -0.02);
    return { ...p, drawing: 1 };
  }
  const h = head(f);
  return { ...h, drawing: f >= TRACE[0] ? 1 : 0 };
};

/** 0..1: how much of the orange bracket has been drawn. It is the caret's own
 *  arc fraction and nothing else. */
export const bracketDrawn = (f: number) =>
  f < TRACE[0] ? 0 : clamp01((f - TRACE[0]) / (TRACE[1] - TRACE[0]));

/** ...and of the orange reader line: the caret's x, as a fraction of the span,
 *  so the far end dot is minted exactly under the caret. */
export const lineDrawn = (f: number) => {
  if (f < SWEEP[0]) return 0;
  if (f >= SWEEP[1]) return 1;
  return clamp01((f - SWEEP[0]) / (SWEEP[1] - SWEEP[0]));
};

// ---------------------------------------------------------------------------
// THE CAMERA. Two moves and three creeps, on the clip's two legal frames.
// WIDE is k <= 1.30 on the block's axis with the person in shot; CLOSE is 1.75
// on the text axis with the person 52 world px outside the frame. The targets
// are written EARLY because the damper lags: each one is authored to finish
// about eight frames before the frame it has to land on.
// ---------------------------------------------------------------------------
const K_REST = 1.3;
export const STROKE = strokeFor(K_REST);

const CX_WIDE = BLOCK_CX; // 540 — the block, skull margin and all
const CX_CLOSE = 510; // the text axis, pulled 22 px left so the reader line's
// left dot stays 35 screen px inside the frame while its right dot and the
// person are both outside the right one.
const PUSH: [number, number] = [28, 39];
const TILT: [number, number] = [78, 87];
const DRIFT: [number, number] = [96, 152];
/** The hand never stops. A slow linear sink of the content centre under every
 *  authored move: the content centre sinks 0.7 world px a frame, which is 0.9
 *  to 1.2 screen px a frame at this cut's two zooms. It has to beat the sway,
 *  not just be non-zero — `sway` moves a world point up to 0.26 world px a
 *  frame on its own and at the wrong phase it cancels a slower drift, which is
 *  what left 26 frames of the first build under the 0.4 screen px a frame bar
 *  while the orange line was being drawn. Each landing constant below has the
 *  drift added back out, so the framing at f46 and f94 is exactly what was
 *  solved for. */
const LIN = 0.7;

/** Content centre, world y, solved so the WRITING LINE lands on screen y 1200
 *  open, 1200 close, 1180 wide. The first build put it at 1100 and the frame
 *  read top-heavy: the column ended 700 px above the caption band with the
 *  block's own centre at screen 675. Dropped 100 px, the text fills 340-1285
 *  and the block centres at 812 — inside the 780-830 the clip asks for — with
 *  the lowest ink still 135 px clear of the captions. */
const C_OPEN = HOLD_Y - 292;
const C_CLOSE = HOLD_Y - 208.6;
const C_WIDE = HOLD_Y - 265.4;
const C_TAIL = HOLD_Y - 271.4; // sinks WITH the linear term, never against it

const TRACK_F1 = DURATION + 16;
const K_TRACK = kTrack(
  [
    { f0: 0, f1: PUSH[0], k0: 1.25, k1: 1.27, warp: 0.55 },
    { f0: PUSH[0], f1: PUSH[1], k0: 1.27, k1: 1.75, warp: 0.65 },
    { f0: PUSH[1], f1: TILT[0], k0: 1.75, k1: 1.78, warp: 1 },
    { f0: TILT[0], f1: TILT[1], k0: 1.78, k1: 1.29, warp: 0.7 },
    { f0: TILT[1], f1: TRACK_F1, k0: 1.29, k1: 1.276, warp: 0.8 },
  ],
  TRACK_F1,
);

const seg = (f: number, s: [number, number], warp: number) =>
  camEase(clamp01((f - s[0]) / (s[1] - s[0])), warp);

export const CAMERA = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: (f) => {
    const p = seg(f, PUSH, 0.65);
    const t = seg(f, TILT, 0.7);
    return CX_WIDE + (CX_CLOSE - CX_WIDE) * p * (1 - t);
  },
  cy: (f) => {
    const p = seg(f, PUSH, 0.65);
    const t = seg(f, TILT, 0.7);
    const d = seg(f, DRIFT, 1);
    const close = C_OPEN + (C_CLOSE + LIN * 46 - C_OPEN) * p;
    const wide = C_WIDE + LIN * 94 + (C_TAIL - C_WIDE) * d;
    return close + (wide - close) * t - LIN * f;
  },
});

export const CAM_AT = CAMERA.CAM_AT;
export const SCREEN_AT = CAMERA.SCREEN_AT;
export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

// ---------------------------------------------------------------------------
const PeopleAreObserving: React.FC<Props> = ({
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
  dotOpacity,
}) => {
  const frame = useCurrentFrame();
  const cam = CAM_AT(frame);
  const { cx, cy, k } = cam;
  const { tx, ty } = worldTransform(cx, cy, k);

  const scroll = scrollAt(frame);
  const exitAt = makeExit(cy, k);
  const caret = caretAt(frame);

  // us, reading: the line and the person are one thing at one y.
  const readerY = COLUMN.lineYf(readerLine(frame)) + WORD_H / 2 - scroll;
  const bracketU = bracketDrawn(frame);
  const lineU = lineDrawn(frame);
  const flagExit = exitAt(COLUMN.lineY(FLAG.line) - scroll + WORD_H / 2);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_W0 + frame}
        cy={cy}
        cyRest={CAMERA.CY_REST}
        cx={cx}
        cxRest={CAMERA.CX_REST}
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
            {/* the model's chain of thought */}
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              exitAt={exitAt}
              opacity={dotOpacity}
            />

            {/* what the MODEL boxed, in the model's colour */}
            <Bracket
              column={COLUMN}
              flag={FLAG}
              u={bracketU}
              stroke={STROKE}
              ink={accent}
              opacity={dotOpacity}
              scroll={scroll}
              exit={flagExit}
              k={k}
            />

            {/* the observer the model drew */}
            {lineU > 0 ? (
              <ReaderLine
                yWorld={OLINE_Y - scroll}
                u={lineU}
                stroke={STROKE}
                ink={accent}
                opacity={dotOpacity}
                k={k}
              />
            ) : null}

            {/* us: where we are reading */}
            <ReaderLine yWorld={readerY} stroke={STROKE} ink={ink} opacity={INK_HI} k={k} />

            {/* the model */}
            <Caret
              x={caret.x + COL_X0}
              y={caret.y - WORD_H / 2 - scroll}
              accent={accent}
              lead={0}
              opacity={dotOpacity}
            />
          </svg>

          {/* us: who is reading. DOM, beside the svg, inside the same camera. */}
          <ReaderPerson
            x={COL_X0 + COL_W + PERSON_DX}
            y={readerY}
            k={k}
            box={PERSON_BOX}
            opacity={INK_HI}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default PeopleAreObserving;

export const STATS = {
  duration: DURATION,
  words: COLUMN.WORDS.length,
  head: [0, 40, 66, 104, 128, 146].map((f) => [f, Number(CLOCK.headLine(f).toFixed(3))]),
  reader: [0, 40, 66, 104, 128, 146].map((f) => [f, Number(readerLine(f).toFixed(3))]),
  k: [0, 30, 46, 58, 84, 94, 118, 146].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
  box: { x0: BOX.x0, x1: BOX.x1, perimeter: Number(boxPath.total.toFixed(1)) },
};
