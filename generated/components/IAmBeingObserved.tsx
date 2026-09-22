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
  clamp01,
  worldTransform,
} from "./fieldShared";
import {
  COL_W,
  COL_X0,
  Caret,
  FPS,
  GRID_W0,
  HAIR_H,
  INK_HI,
  PERSON_DX,
  PITCH,
  READER_DOT_R,
  READER_X0,
  ReaderLine,
  ReaderPerson,
  WORD_H,
  WordBars,
  buildCamera,
  kTrack,
  makeClock,
  makeColumn,
  makeExit,
  readerAt,
  strokeFor,
} from "./punishShared";

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs` cut 8 — `IAmBeingObserved`, in at 1:07.120.
//
//   "If we reach a point where they're actually able to recognize, like, 'oh,
//    I am being observed, I want to think these bad thoughts in a way that is
//    not observable to my monitors,'"
//
// THE CLIMAX. Everything the clip has built — orange is the model's thought,
// white is us reading it, and BAR HEIGHT IS OBSERVABILITY — resolves into one
// sentence: the thought hides ONLY where the monitor is looking.
//
// The model stops writing and the reader comes down on it (the held breath).
// Then it writes the bad thought PLAINLY, at full height, and as the white
// line comes within reach those three words PRESS FLAT UNDER IT. The reader
// passes over three hairlines and brackets nothing. Once it is safely past,
// the words RISE BACK to full height behind it. The thought was there the
// whole time; it hid only under the gaze. Height is a function of the
// reader's distance and of nothing else — no timer, no alpha, no blur.
//
// Nothing in this cut is new: the world is `punishShared` (column, clock,
// reader, word-bars, caret, camera) and `fieldShared` (grid, vignette,
// shadows). This file decides only WHAT HAPPENS.
//
// DURATION = round(8.500 * 24) + 16 = 204 + 16 = 220.
// Onsets (frames from this cut's own t0): if-we 0 · reach 7 · a 11 ·
// point 12 · where 15 · they're 17 · actually 20 · able 23 · to 32 ·
// recognize 40 · like 52 · oh-i 61 · am 72 · being 75 · observed 79 ·
// i-want 94 · to 115 · think 120 · these 128 · bad 132 · thoughts 136 ·
// in-a 144 · way 150 · that 153 · is-not 158 · observable 167 · to-my 179 ·
// monitors 192 · speech ends 204 · tail to 220.
//
// ---------------------------------------------------------------------------
// WHAT IS ON SCREEN. Word-bars, the caret, the reader line, the person. That
// is the whole cast: NO bracket and NO skull anywhere in this cut, because
// the reader finds nothing — that is the point of it.
//
// ---------------------------------------------------------------------------
// THE CLOCK, SOLVED. Every number here is printed by
// `$S/IAmBeingObserved/measure.ts`, which imports this file's own tables.
//
//   column       `makeColumn(11, 64, 200)` — the clip's page, seed 11, 64
//                lines, 262 words, 4.094 words a line. `preLines` 52, so at
//                f0 the caret is at the head of line 52 and 213 words exist.
//   f0-44        rate R0 = 6.95/44 words a frame. The clock stops 95% of the
//                way through word 219: L_STOP = 53.590, the caret 0.59 along
//                line 53 with that word complete since f39.99 and the next
//                one not begun (its EMIT is f94.3).
//   f44-92       THE HOLD, exactly [44, 92). `grownAt` counts in frames from
//                EMIT, so nothing sits part-grown for forty-eight frames.
//   f92-102      the resume EASES IN from zero. A clock that goes from held
//                to 0.825 words a frame in one frame is a STEP in the caret's
//                velocity, and the caret is the only orange thing that moves
//                on its own.
//   f108-132     it eases back down to R3 = 0.165: the model slows as it
//                writes the bad thought.
//   L_bad = 58   = L_HOLD + 5, 4.41 lines below the caret's held line — the
//                brief's own "≈ 4.5 lines below". Its first three words are
//                the bad thought: gi 239 / 240 / 241, emitted f124.2, f127.7
//                and f133.1, complete at f135.1, which is five frames before
//                any of them starts to flatten.
//
// THE READER runs at the clip constant READER_LPF = 0.06 lines a frame from
// line0 = 48.2352 at f0 — SOLVED by bisection (the script re-derives 48.237)
// so its y crosses line L_bad's centre at f165.04. That crossing is the cut's
// clock: every height in the hide is measured off the reader's distance from
// that line. It is softly capped at the writing head by the module's own
// `readerAt`, and the cap is what makes the held breath: full rate to f70,
// half rate at f80 ("observed" 79), 0.002 lines a frame at f92, back to full
// by f98. Clearance never falls below 0.600 lines.
//
// ---------------------------------------------------------------------------
// THE HIDE RULE. For the three bad words and nothing else:
//     d = readerLine - (L_bad + WORD_H / PITCH / 2)      (lines, signed)
//     h = 1 + (HAIR_H / WORD_H - 1) * smootherstep((1.6 - |d|) / 0.6)
// so h = 1 at |d| >= 1.6, h = HAIR_H / WORD_H = 0.136 at |d| <= 1.0, and
// `WordBars` is in mode "hair", which floors the drawn height at HAIR_H.
// Measured: they start to flatten at f140 (reader 1.6 lines above), are
// hairlines f149 ("way" 150) through the crossing at f165 ("observable" 167)
// to f182 ("to my" 179), and are whole again at f193 ("monitors" 192). Full
// height is 39.8 screen px, the hairline 3.9, and the height's own |dv| is
// 1.76 screen px/f^2. Every other word in the column is h = 1 on every frame
// of the cut, and no drawn word ever shrinks.
//
// ---------------------------------------------------------------------------
// THE TWO FRAMINGS AND SIX MOVES. k lands (96% of its span) at f47, f124 and
// f179; the camera is WIDE (person in) or CLOSE (person out) and is only ever
// in between while a move is running.
//
//  1. f0-20    "if we reach a point"
//              THE PAGE, WIDE. The caret writes slowly at the foot of the
//              column at screen y 1180, the reader comes down the page toward
//              it (3.85 lines above at f0, 2.72 by f44), the camera creeps
//              k 1.26 -> 1.28 and drifts 3.3 world px a frame down with them.
//  2. f20-47   "actually able to" (20/23/32) -> "recognize" (40)
//              IT STOPS, AND THE FRAME CLOSES ON IT. One push, WIDE -> CLOSE,
//              k 1.28 -> 1.78, warp 0.9, landing f47: the person leaves past
//              the right edge and the reader line runs off both edges, so the
//              text fills the frame and we are reading with it. The clock
//              holds at f44, inside the move.
//  3. f47-82   "oh I am being observed" (61/72/75/79)
//              THE HELD BREATH. The caret does not move for forty-eight
//              frames. The white line keeps coming, its cap engages at f80,
//              and it eases to a crawl right above the head — the one place
//              in the clip the reader slows, and it is motivated: it is
//              watching. The camera creeps 20 world px DOWN onto the stopped
//              caret, 1.1 screen px a frame.
//  4. f82-124  "I want to" (94) ... "think" (120)
//              IT WRITES ON, AND THE FRAME OPENS AND GOES DOWN THE PAGE.
//              k 1.81 -> 1.28 (CLOSE -> WIDE, the person comes back in beside
//              the reader), warp 0.9, landing f124 — eight frames before
//              "bad" (132) and sixteen before the hide.
//  5. f124-166 "these bad thoughts in a way that" (128/132/136/150/153)
//              THE CAMERA FOLLOWS THE READER. One continuous eased descent
//              (it is the same cy segment as move 4: f80-166, 457 world px)
//              carries the page UP past the white line, so the bad line RISES
//              to meet the reader instead of the reader dropping onto a
//              parked frame. L_bad comes up the frame from screen y 1161 at
//              f124 to 835 at the crossing. Its three words press flat as it
//              comes.
//  6. f158-192 "is not observable to my monitors" (158/167/179/192)
//              UNDER THE GAZE AND OUT AGAIN. The reader crosses at f165,
//              brackets nothing, passes; the words rise behind it. One small
//              push, WIDE -> CLOSE, k 1.295 -> 1.78, warp 0.9, landing f179:
//              the person leaves again and the frame tightens on the thought
//              coming back, whole at f193.
//  7. f192-220 TAIL. No new gesture: the reader keeps reading down toward the
//              caret, the caret keeps writing below it, the bad words stand
//              at full height above the reader, the camera creeps 18 world px.
//              Nothing lands on f204.
//
// ---------------------------------------------------------------------------
// MEASURED.
//   camera     |dv| of a fixed world point, over the reading band (screen y
//              250-1400): 2.111 px/f^2, cap 2.5 — per move, 0.98 / 2.10 /
//              0.38 / 0.88 / 0.36 / 2.11 / 0.09. Anywhere on screen at all,
//              including points on their way out through the top thinning:
//              3.057. Max |v| of a line in the band 22.3 px/f. The frame is
//              never parked: the slowest frame of the held breath still
//              travels 1.12 screen px.
//   k          1.260 f0 · 1.784 f56 · 1.744 f92 · 1.282 f134 · 1.783 f188 ·
//              1.799 f219. Max 1.809. 69 frames of 221 are in the straddle
//              band (1.30, 1.75) and every one of them is inside a move.
//   framing    text measure inside screen x 20.8..1063.0 on every frame. At
//              WIDE the person's ink and the reader line's left dot are both
//              in; at CLOSE the person's ink starts at x >= 1120, fully out.
//              Caret screen y 945..1254 (cap 1330), lowest caret ink 1295.
//              L_bad 837 at f164 down to 787 at f200, 835 on the crossing
//              frame. Reader line screen y 772..1147.
//   energy     sum of |delta| of every drawn element's screen position and
//              size: minimum 33.0 at f83, i.e. NOTHING is ever still. It runs
//              389 (f20) · 88 (f50) · 90 (f70) · 174 (f90) · 2454 (f110) ·
//              2120 (f140) · 2582 (f170) · 1492 (f200).
//   the caret  peak 151.8 screen px/f between line wraps (it wraps ten
//              times). The 45 px/f cap in the brief is the agent-crowd HEAD
//              cap; a writing caret is not a head, and the approved reference
//              cut `HidingTranscriptsV5` wrote at 1/1.4 words a frame at
//              k 1.31 with these same word widths — a peak of 157.2. This one
//              is under that, and the clock's rise/fall windows were swept
//              (over 80 shapes) to get it there while still spreading the
//              three bad words across "these / bad / thoughts".
//   stroke     STROKE_PX 6.5 at K_REST 1.45 = 4.483 world px, so 5.6 screen
//              px at the widest k and 8.1 at the tightest. One weight.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE BRIEF, one line each, all forced and all measured.
//
//  * THE ZOOM LADDER IS 1.26-1.81 IN TWO FRAMINGS, NOT 1.30-1.79 CONTINUOUS.
//    The clip's framing rule: with the person in the right margin the block
//    is 812 world px, so a camera on BLOCK_CX runs out of frame above k 1.33.
//    WIDE (k <= 1.30, camera on BLOCK_CX 540, person in) and CLOSE (k >= 1.75,
//    camera on the text axis 532.15, person fully out past x 1080) are the
//    only two legal parks; the brief's 1.30 / 1.75 / 1.50 / 1.68 ladder is
//    read as WIDE / CLOSE / WIDE / CLOSE.
//  * f0-44 WRITES AT 6.95/44 WORDS A FRAME, NOT 1/2.0. At 1/2.0 the caret
//    covers 4.4 lines in 44 frames while the reader covers 2.6, so the gap
//    OPENS and the reader can never arrive above the head — the held breath
//    has no arrival. The brief's own other two numbers for this beat (caret
//    at "≈ 53.5" at f44, reader "at line 46.5" at f0) both imply ~1.5 lines
//    of writing; 6.95/44 gives 1.59.
//  * L_bad = L_HOLD + 5 = 58, NOT L_stop + 4. With the reader's rate fixed at
//    0.06 and the crossing fixed at f165, L_bad - L_stop is pinned at 4.41 —
//    the brief's own parenthetical. L_stop + 4 would need the reader to start
//    below the caret.
//  * THE RATE SETTLES TO 1/6.1 OVER f108-132, NOT 1/2.8 OVER f140-150. At
//    1/2.8 the caret is eight lines below L_bad by f220, which with L_bad in
//    the reading band puts it at screen y ~1530, deep in the caption band;
//    and the three bad words have to land ACROSS "these / bad / thoughts"
//    (128-136) rather than inside four frames.
//  * f124-166 FOLLOWS THE READER INSTEAD OF HOLDING ON L_bad. Parking with
//    L_bad at screen 800 from f130 (the brief's assertion) leaves the bottom
//    58% of the frame empty, because at f130 the page ends 0.6 of a line
//    below L_bad and there is nothing down there yet: measured, the drawn
//    column reached only screen y 810. Letting the camera keep descending
//    carries the page up past the white line, so the bad line RISES into the
//    reading band exactly as the reader reaches it — L_bad is at 836 on the
//    crossing frame and stays inside 787..837 from f164 to f200 — and the
//    column now reaches screen y 1012-1254 through the same stretch.
//  * NO BRACKET, NO SKULL, NO LABEL. The brief's own, not a deviation — noted
//    because this is the only cut of the eight with none of them.
//
// ---------------------------------------------------------------------------

export const DURATION = 220;
export { FPS };

/** The clip constant: the reader's rate, lines per frame, in every cut. */
export const READER_LPF = 0.06;

// --- the page --------------------------------------------------------------
export const SEED = 11;
export const N_LINES = 64;
export const LINE0_Y = 200;
export const PRE_LINES = 52;

export const COLUMN = makeColumn(SEED, N_LINES, LINE0_Y);

// --- the clock -------------------------------------------------------------
/** f0-44: 6.95 words, so the clock stops 95% of the way through word 219 —
 *  mid-line, with that word complete (it finished growing at f39.99) and the
 *  next one not yet begun (its EMIT is f94.3). */
const R0 = 6.95 / 44;
/** The peak of the resume, solved so the bad phrase's first word is emitted
 *  at f124.0: 19 words have to be written between the hold and L_bad. The
 *  rise/fall windows were swept (48 shapes) for the lowest peak caret speed
 *  that still spreads the three bad words across "these / bad / thoughts". */
const R2 = 0.825;
const R3 = 0.165;
/** The resume EASES IN over f92-106. A clock that goes from held to 0.8 words
 *  a frame in one frame is a step in the caret's velocity — a pop — and the
 *  caret is the only orange thing that moves on its own. */
const RISE0 = 92;
const RISE1 = 102;
const FALL0 = 108;
const FALL1 = 132;
export const HOLD: [number, number] = [44, 92];

const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** Ken Perlin's smootherstep: zero first AND second derivative at both ends.
 *  The hide needs it — a smoothstep's curvature step is visible when three
 *  bars start moving at once. */
const sss = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

const rateAt = (f: number) => {
  if (f < HOLD[0]) return R0;
  const rise = ss((f - RISE0) / (RISE1 - RISE0));
  const fall = 1 - ss((f - FALL0) / (FALL1 - FALL0));
  return (R3 + (R2 - R3) * fall) * rise;
};

export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt,
  holds: [HOLD],
});

/** The caret's held line, as a fraction, and the integer line under it. */
export const L_STOP = CLOCK.headLine(HOLD[0]);
export const L_HOLD = Math.floor(L_STOP);
/** The bad thought's line, and its three words. */
export const L_BAD = L_HOLD + 5;
export const BAD_GI = (() => {
  const ws = COLUMN.LINES[L_BAD].words;
  return [ws[0].gi, ws[1].gi, ws[2].gi];
})();

// --- the reader ------------------------------------------------------------
/** SOLVED by bisection so `foundByReader` puts the reader's y across line
 *  L_BAD's centre at f165.0 — see the measure script, which re-derives it. */
export const READER_LINE0 = 48.2352;

export const readerLine = (f: number) =>
  readerAt({
    f,
    f0: 0,
    line0: READER_LINE0,
    linesPerFrame: READER_LPF,
    capLine: CLOCK.headLine,
  });

// --- the hide --------------------------------------------------------------
/** The line the distance is measured to: L_BAD's word band centre. */
export const L_BAD_C = L_BAD + WORD_H / PITCH / 2;
export const HIDE_FAR = 1.6;
export const HIDE_NEAR = 1.0;
export const HAIR_F = HAIR_H / WORD_H;

/** Observability as a function of the reader's distance, and NOTHING else. */
export const hideH = (f: number) => {
  const d = Math.abs(readerLine(f) - L_BAD_C);
  return 1 + (HAIR_F - 1) * sss((HIDE_FAR - d) / (HIDE_FAR - HIDE_NEAR));
};

const isBad = (gi: number) => gi === BAD_GI[0] || gi === BAD_GI[1] || gi === BAD_GI[2];
export const hAt = (gi: number, f: number) => (isBad(gi) ? hideH(f) : 1);

// --- the camera ------------------------------------------------------------
/** THE TWO LEGAL FRAMINGS of this clip (the rule is the clip's, not this
 *  cut's). The block — skull margin + text + the reader's person — is 812
 *  world px wide, so a camera on BLOCK_CX runs out of frame at k 1.33.
 *    WIDE  k <= 1.30, camera x on BLOCK_CX 540, the WHOLE block in frame,
 *          the person beside the reader line where it belongs.
 *    CLOSE k >= 1.75, camera x on the TEXT AXIS (COL_X0 + COL_W / 2), the
 *          person FULLY out past the right edge and the reader line running
 *          off both edges: the text fills the frame and we are reading with
 *          it rather than watching someone read.
 *  Between the two the person straddles the edge, which is allowed only
 *  WHILE a move is running. This cut is WIDE - CLOSE - WIDE - CLOSE and
 *  never parks in between: measured, k is inside [1.33, 1.75] on 24 frames
 *  of 220, all of them inside moves 2, 4 and 6. */
export const WIDE_K = 1.28;
export const CLOSE_K = 1.78;
export const CX_WIDE = 540; // BLOCK_CX
export const CX_CLOSE = COL_X0 + COL_W / 2;

/** The one stroke weight, fixed at the cut's mean resolved k. */
export const K_REST = 1.45;
export const STROKE = strokeFor(K_REST);

const K_SEGS = [
  { f0: 0, f1: 20, k0: 1.26, k1: WIDE_K, warp: 1 },
  { f0: 20, f1: 44, k0: WIDE_K, k1: CLOSE_K, warp: 0.9 },
  { f0: 44, f1: 80, k0: CLOSE_K, k1: 1.81, warp: 1 },
  { f0: 80, f1: 124, k0: 1.81, k1: WIDE_K, warp: 0.9 },
  { f0: 124, f1: 158, k0: WIDE_K, k1: 1.295, warp: 1 },
  { f0: 158, f1: 174, k0: 1.295, k1: CLOSE_K, warp: 0.9 },
  { f0: 174, f1: 222, k0: CLOSE_K, k1: 1.8, warp: 1 },
];
export const K_TRACK = kTrack(K_SEGS, DURATION + 2);

/** The x centre rides the zoom: 540 at WIDE, the text axis at CLOSE. It is a
 *  7.85 px pan, which is the whole point — the two framings are the same
 *  column, not two compositions. */
const CX_TRACK = K_TRACK.map((k) => {
  const t = clamp01((k - WIDE_K) / (CLOSE_K - WIDE_K));
  return CX_WIDE + (CX_CLOSE - CX_WIDE) * ss(t);
});

/** The content centre, world y. Same machinery as the zoom: one key a frame,
 *  eased, segments that meet. Every value is solved from a screen y it has to
 *  put something at — see the comment on each. */
const CY0 = 3409; //  f0   caret at screen 1180 at k 1.26
const CY1 = 3507; //  f20  caret at screen 1150 at k 1.28
const CY2 = 3646; //  f56  caret at screen 1083 at k 1.78 (the held breath)
const CY3 = 3626; //  f80  the held breath's creep: the frame settles 20 world
                  //       px DOWN onto the stopped caret, 0.95 screen px/f
/** f166. THE CAMERA FOLLOWS THE READER. The content centre lands on L_bad's
 *  own band centre, so at the crossing (f165) the bad line AND the white line
 *  on top of it are at screen 835 — the middle of the reading band. From the
 *  end of the held breath to there it is ONE eased descent, 457 world px over
 *  86 frames: the page rises past the reader and the bad line comes up to
 *  meet it. Parking on L_bad at f130 instead (which is what "hold on L_bad"
 *  would be) leaves the bottom 58% of the frame empty, because at f130 the
 *  page ends 0.6 of a line below L_bad and there is nothing down there yet. */
const CY4 = COLUMN.lineY(58) + WORD_H / 2 + 3;
const CY5 = CY4 + 25; // f186  L_bad at screen 790 at k 1.78, caret at 1180
const CY6 = CY4 + 43; // f222  tail creep, L_bad settling to 761

const CY_SEGS = [
  { f0: 0, f1: 20, k0: CY0, k1: CY1, warp: 1 },
  { f0: 20, f1: 44, k0: CY1, k1: CY2, warp: 0.9 },
  { f0: 44, f1: 80, k0: CY2, k1: CY3, warp: 1 },
  { f0: 80, f1: 166, k0: CY3, k1: CY4, warp: 1 },
  { f0: 166, f1: 186, k0: CY4, k1: CY5, warp: 0.9 },
  { f0: 186, f1: 222, k0: CY5, k1: CY6, warp: 1 },
];
export const CY_TRACK = kTrack(CY_SEGS, DURATION + 2);

const at = (t: number[]) => (f: number) => t[Math.max(0, Math.min(t.length - 1, Math.round(f)))];

export const CAM = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: at(CX_TRACK),
  cy: at(CY_TRACK),
});
export const CAM_AT = CAM.CAM_AT;
export const SCREEN_AT = CAM.SCREEN_AT;

// ---------------------------------------------------------------------------
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
  dotOpacity: z.number(),
  beats: z.object({
    recognize: z.number(),
    ohI: z.number(),
    observed: z.number(),
    iWant: z.number(),
    think: z.number(),
    bad: z.number(),
    way: z.number(),
    observable: z.number(),
    monitors: z.number(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    recognize: 40,
    ohI: 61,
    observed: 79,
    iWant: 94,
    think: 120,
    bad: 132,
    way: 150,
    observable: 167,
    monitors: 192,
  },
});

const IAmBeingObserved: React.FC<Props> = ({
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
  const { cx, cy, k } = CAM_AT(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const exitAt = makeExit(cy, k);

  const rl = readerLine(frame);
  const readerY = COLUMN.lineYf(rl);
  const head = CLOCK.headAt(frame);

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
            {/* the chain of thought. Three of its words are pressed flat by
                the reader's own distance; every other word is full height on
                every frame of the cut. */}
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={0}
              accent={accent}
              hAt={hAt}
              exitAt={exitAt}
              mode="hair"
              opacity={dotOpacity}
            />

            {/* us, reading */}
            <ReaderLine
              yWorld={readerY}
              stroke={STROKE}
              ink={ink}
              opacity={INK_HI}
              k={k}
            />

            {/* the model, writing */}
            <Caret x={head.x + COL_X0} y={head.y} accent={accent} opacity={dotOpacity} />
          </svg>

          {/* who is reading. DOM, beside the svg, inside the same wrapper. */}
          <ReaderPerson x={COL_X0 + COL_W + PERSON_DX} y={readerY} k={k} opacity={INK_HI} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default IAmBeingObserved;

// ---------------------------------------------------------------------------
// What the measure script reads.
export const PROBE = {
  DURATION,
  COLUMN,
  CLOCK,
  CAM,
  CAM_AT,
  SCREEN_AT,
  readerLine,
  hideH,
  hAt,
  isBad,
  BAD_GI,
  L_BAD,
  L_BAD_C,
  L_STOP,
  L_HOLD,
  HOLD,
  READER_LPF,
  READER_LINE0,
  STROKE,
  WIDE_K,
  CLOSE_K,
  CX_WIDE,
  CX_CLOSE,
  rateAt,
  READER_X0,
  READER_DOT_R,
};

export const STATS = {
  duration: DURATION,
  lines: N_LINES,
  words: COLUMN.WORDS.length,
  lStop: Number(L_STOP.toFixed(3)),
  lBad: L_BAD,
  badGi: BAD_GI,
  k: [0, 40, 56, 92, 130, 165, 188, 219].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};

export const ICON_SHADOW = { ICON_SHADOW_Y, ICON_SHADOW_BLUR, ICON_SHADOW_OPACITY };
