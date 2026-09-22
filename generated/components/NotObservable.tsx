import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  smoothstep,
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
  INK_HI,
  INK_LO,
  PERSON_DX,
  ReaderLine,
  ReaderPerson,
  SKULL_DX,
  SkullMark,
  WORD_H,
  WordBars,
  buildCamera,
  foundByReader,
  kTrack,
  makeClock,
  makeColumn,
  makeExit,
  readerAt,
  strokeFor,
} from "./punishShared";
import type { Flag } from "./punishShared";

export { FPS };

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs` cut 3 — NOT OBSERVABLE. In at 0:16.480.
//
//   "then what ends up happening is the model just learns to think those bad
//    thoughts in a way that's not observable to us."
//
// DISAPPEARING INK. The model writes a bad thought and it is GONE before the
// reader gets there. Each word of the phrase grows normally behind the caret,
// and a few frames after it is finished its HEIGHT sinks to ZERO — mode "gap",
// the pill's rx following its height, no alpha anywhere — leaving a hole in
// line 16. The reader arrives at that line at f70 ("observable"), passes over
// the hole, and leaves NO BRACKET. The cut-2 flag on line 9 stands above it
// while the frame is wide, so for the first 35 frames the page holds both
// states at once: the thought we caught, and the thought we cannot.
//
// Everything is `punishShared`'s: the column, the word clock, the scroll, the
// reader, the flag, the top exit, the camera helpers, every component. Nothing
// is restated here and nothing was added to that file.
//
// Word onsets, frame = round((t - 16.480) * 24):
//   then 0 · what 3 · ends 8 · up 11 · happening 13 · is-the 18 · model 22 ·
//   just 25 · learns 29 · to 35 · think 39 · those 44 · bad 47 · thoughts 50 ·
//   in-a 56 · way 60 · that's 62 · not 66 · observable 70 · to-us 78 ·
//   speech ends 90 · tail to 106.
//   DURATION = round(3.739 * 24) + 16 = 90 + 16 = 106.
//
// ---------------------------------------------------------------------------
// GESTURES — every one with the word it serves. There are four, and one of
// them is the camera.
//
//  1. f0-16    "then what ends up     THE PAGE AS IT STANDS, WIDE. k 1.280 on
//              happening"             the BLOCK: the whole thing is in frame,
//              (0, 8, 11, 13)         the cut-2 flag (bracket + orange skull,
//                                     both already whole) six lines up at
//                                     screen 725, the reader's line and its
//                                     person at 974, the caret writing line 14
//                                     at 1200. The caret runs at one word per
//                                     5 frames and the reader descends at the
//                                     clip's constant READER_LPF two lines
//                                     behind it. Camera: the k creep to 1.300
//                                     and the content centre drifting down
//                                     with the reader.
//  2. f16-34   "is the model just     THE PUSH. One move, warp 0.65: k to
//     authored  learns to"            1.750 and the centre of the frame from
//     lands f36 (18, 22, 25, 29, 35)  the BLOCK axis onto the TEXT axis and
//                                     onto line 16 — the line about to be
//                                     written. It leaves the wide frame at
//                                     f14, is 90% done at f36 and 95% at f39,
//                                     three frames before "think". BOTH
//                                     MARGINS GO WITH IT: the person crosses
//                                     the right edge over f20-33 and is fully
//                                     out from f34, and the flag's skull
//                                     crosses the left edge over f18-25 while
//                                     its line thins out through the top,
//                                     gone at f32. Nothing is ever parked half
//                                     out of frame.
//  3. f39-66   "think those bad       THE DISAPPEARING INK. The three words of
//              thoughts in a way      the phrase are emitted at f40 / f45 /
//              that's not" (39-66)    f50 — on "think", "those", "thoughts" —
//                                     and each begins sinking ERASE_LAG 6
//                                     frames after its own doneAt, height 1 ->
//                                     0 over 8 frames on a smootherstep, mode
//                                     "gap", the pill's rx following its
//                                     height. The three holes complete at f56,
//                                     f61 and f66: THE LAST ONE LANDS EXACTLY
//                                     ON "NOT". The caret writes the rest of
//                                     line 16 and goes on to 17 and 18 as if
//                                     nothing had happened.
//  4. f60-106  "not observable to     THE READER PASSES OVER IT. The reader's
//              us" (66, 70, 78)       line crosses line 16's centre at f70.00
//                                     — "observable" — at screen y 873, and
//                                     nothing is found: no bracket, no skull,
//                                     no change of rate. It carries on toward
//                                     the writing line and ends the cut 0.73
//                                     lines behind the caret, still not
//                                     overtaking. The camera only creeps, and
//                                     the creep is all POSITION: line 16 walks
//                                     from screen 917 at the landing to 817 at
//                                     the last frame while the caret's line
//                                     descends 799 -> 1153 under it as the
//                                     page fills. The k does not move at all
//                                     after the landing.
//
// Nothing lands on f90. The tail is the mechanism continuing: the caret keeps
// writing line 18 and starts 19, the reader keeps descending, the hole sits
// above them both.
//
// ---------------------------------------------------------------------------
// WHAT THIS CUT DEVIATED FROM ITS BRIEF, AND WHY.
//
//  * `preLines` 15 -> 14, writing rate 1/3.3 -> 1/5.0 words per frame. The
//    brief's two windows are EMIT(line 16 word 0) in [38, 41] and doneAt(line
//    16 word 2) in [50, 54]; since doneAt = EMIT + 2p + 2 they force the rate
//    to p >= 3.5 frames a word, and 1/3.3 cannot satisfy both (it lands the
//    third word at 48.2). Lines 14 and 15 of this column hold four words each,
//    so preLines 14 puts exactly eight words between f0 and the phrase and
//    p = 5.0 puts the first at f40.0 and the last's doneAt at f52.0 — the
//    brief's own "≈ f39" and "≈ f52", and the three bars then land on the
//    spoken words "think", "those" and "thoughts". preLines 15 would need
//    p = 10 (four words to cover 40 frames), which is a dead caret.
//  * The reader's soft cap is given soft = 0.15 lines instead of the module's
//    0.8. The caret writes 0.0476 lines a frame and the reader reads 0.06, so
//    the gap closes from 2.03 lines to 0.73 across the cut — inside the
//    default soft corner, which would have bent the reader by 11 screen px
//    over the last twenty frames. The reader's constant rate is the argument
//    of this cut, so the corner is narrowed and the guard is never felt:
//    measured undershoot 0.0000 lines at every frame up to f75, 0.0010 at the
//    last.
//  * The camera ladder is the clip-wide framing rule's, not the brief's 1.35 /
//    1.75 / 1.83: WIDE 1.280 -> 1.300 on BLOCK_CX with the whole block in, then
//    CLOSE 1.750 flat on the TEXT axis with the person fully out. The brief's
//    1.35 open would already have had the person's ink on the frame edge (the
//    block is 812.3 world px in a 1,080 px frame, so 1.330 is edge to edge).
//    1.750 is the CLOSE rule's minimum and also this frame's maximum: the
//    text's own ink is 36 screen px off each edge there, and the sway's 3 px
//    takes the tightest frame of the cut to 31.5. A k creep through the hold
//    would eat that gutter, so the hold's creep is position instead.
//  * Line 16 is NOT held at screen y 740-820 from f37. It is at 917 at the
//    landing and walks to 817 by the last frame, passing 873 when the reader
//    crosses it. At f37 line 16 is the line ABOUT TO BE WRITTEN — there is
//    nothing below it — so the frame under it is empty until the caret has
//    written 17 and 18; the walk keeps the writing line at screen 793-1176 and
//    puts the crossing, which is the moment the brief is protecting, 38 px
//    from the house centre of interest at 835.
//  * `wipeAt` is used to trim the un-written remainder of the word under the
//    caret (see its comment). Nothing was added to `punishShared`.
//
// ---------------------------------------------------------------------------
// MEASURED (all of it out of `$S/NotObservable/measure.ts`, which imports the
// tables below):
//   clock       EMIT(65) 40.00 (window 38-41), EMIT(66) 45.00, EMIT(67) 50.00,
//               doneAt(67) 52.00 (window 50-54). The three phrase words reach
//               height 0 at f56, f61, f66 and no other word is ever below
//               1.0000 on any frame.
//   reader      foundByReader(line 16) = 70.000 (window 70 +- 0.5). Cap
//               undershoot 0.0000 lines through f75. Never overtakes: the
//               smallest gap to the writing head is 0.729 lines, at f105.
//   camera      max |dv| of a fixed world point 2.403 screen px/f^2 (cap 2.5),
//               max |v| 22.94 px/f (cap 45). k 1.281 at f0, 1.365 at f20,
//               1.684 at f34, 1.718 at f37, 1.750 from f50 on and never above
//               it; the push is 90% done at f36 and 95% at f39.
//   framing     line 16 at screen y 917 (f37) / 888 (f50) / 873 (f70) / 817
//               (f105), and the caret's line at 799 (f38) / 985 (f70) / 1080
//               (f90) / 1153 (f105). The writing line runs screen y 793-1176,
//               never below 1330, and the lowest ink in the cut is 1205. The
//               reader LINE is inside the frame on every frame (screen y
//               698-1052). The person is whole to f19 and fully out of frame
//               from f34, the flag's skull is whole to f17 and its line is
//               gone at f32, and the text's own ink keeps 31.5 px off the left
//               edge and 74 off the right at the tightest frame (screen x
//               31.5-1005.6).
//   motion      per-frame energy (the sum of |delta| of every drawn thing's
//               screen geometry) min 70.8 px at f52, mean 347.1 — nothing is
//               ever still. Non-decreasing drawn text on all 106 frames except
//               the three phrase words during their sink.
// ---------------------------------------------------------------------------

export const DURATION = 106;

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
    learns: z.number(),
    think: z.number(),
    thoughts: z.number(),
    not: z.number(),
    observable: z.number(),
    toUs: z.number(),
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
  beats: { learns: 29, think: 39, thoughts: 50, not: 66, observable: 70, toUs: 78 },
});

// ---------------------------------------------------------------------------
// THE PAGE. The clip's one column, seen at its third moment.
// ---------------------------------------------------------------------------
const SEED = 11;
const N_LINES = 64;
/** Line 0's top in world y. Only has to be large enough that the scroll is
 *  already positive at f0, i.e. that the writing line is being HELD from the
 *  first frame rather than drifting down into its hold. */
const LINE0_Y = 300;
/** The writing line's world y. The scroll keeps it there. */
const HOLD_Y = 1050;
/** Lines already on the page at f0 — the caret is writing line 14. */
const PRE_LINES = 14;
/** Frames per word. See the deviation note: this is what the brief's two
 *  assertion windows leave once the column's own word counts are in. */
const WORD_F = 5;

export const column = makeColumn(SEED, N_LINES, LINE0_Y);
export const clock = makeClock({
  column,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => 1 / WORD_F,
});
export const scrollAt = (f: number) => clock.scrollAt(f, HOLD_Y);

// ---------------------------------------------------------------------------
// US, READING. A constant rate down the page — the clip constant — placed so
// that the reader's own y crosses line 16's centre on "observable".
// ---------------------------------------------------------------------------
/** lines per frame — the clip constant, the same in every cut. */
export const READER_LPF = 0.06;
/** Solved: line 16's centre is 11/64 of the way from line 16's top to line
 *  17's, so the crossing at f70 wants 16 + 11/64 - 70 * READER_LPF. */
const READER_LINE0 = 11.971875;
/** The soft corner on the anti-overtake cap, narrowed from the module's 0.8 —
 *  see the deviation note. */
const READER_SOFT = 0.15;

export const readerLine = (f: number) =>
  readerAt({
    f,
    f0: 0,
    line0: READER_LINE0,
    linesPerFrame: READER_LPF,
    capLine: clock.headLine,
    soft: READER_SOFT,
  });
/** The reader's line in WORLD y, i.e. after the scroll. */
export const readerY = (f: number) => column.lineYf(readerLine(f)) - scrollAt(f);

// ---------------------------------------------------------------------------
// THE HIDDEN PHRASE. Line 16, words 0..2 — global indices 65, 66, 67.
//
// THE ERASE RULE IS A MECHANISM, NOT A TIMER: a word begins sinking ERASE_LAG
// frames after ITS OWN doneAt, and takes ERASE_F frames to reach nothing. The
// three holes therefore open in the order the words were written, at the pace
// the words were written, and the last of them completes on "not".
// ---------------------------------------------------------------------------
const PHRASE_LINE = 16;
const PHRASE_K0 = 0;
const PHRASE_K1 = 2;
const ERASE_LAG = 6;
const ERASE_F = 8;

export const PHRASE_GI = column.LINES[PHRASE_LINE].words
  .slice(PHRASE_K0, PHRASE_K1 + 1)
  .map((w) => w.gi);

const smootherstep = (v: number) => {
  const t = clamp01(v);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** OBSERVABILITY, 1 = readable, 0 = gone. The clip's one variable. */
export const hAt = (gi: number, f: number) => {
  if (!PHRASE_GI.includes(gi)) return 1;
  return 1 - smootherstep((f - (clock.doneAt(gi) + ERASE_LAG)) / ERASE_F);
};

/** The word under the caret is only drawn as far as the caret has got. The
 *  module's `grownAt` runs a word out in GROW = 2 frames, which at this cut's
 *  slow rate would finish the bar three frames before the writing head reached
 *  its right end and leave the caret buried inside its own colour. Trimming
 *  the un-written remainder with `wipeAt` puts the bar's right edge exactly on
 *  the head, so the caret leads it by CARET_LEAD on every frame and the bar
 *  grows continuously rather than in a two-frame pop. */
export const wipeAt = (gi: number, f: number) => {
  const w = clock.wordsAt(f);
  const i = Math.floor(w);
  if (gi !== i) return 0;
  const grown = clock.grownAt(gi, f);
  if (grown <= 0) return 0;
  return clamp01(1 - (w - i) / grown);
};

// ---------------------------------------------------------------------------
// WHAT THE READER FOUND LAST TIME. Cut 2's flag, line 9 words 0..2, bracket
// and skull already whole when we arrive (`found` is before f0). It is context
// — INK_LO — and it leaves through the top with its line during the push.
// ---------------------------------------------------------------------------
const FLAG9: Flag = { line: 9, k0: 0, k1: 2, found: -20 };

// ---------------------------------------------------------------------------
// THE CAMERA. One move, between the clip's only two legal framings.
//
//   WIDE    k 1.280 creeping to 1.300, centred on BLOCK_CX. The block is 812.3
//           world px (skull margin + 576 of text + person margin) so 1.330 is
//           edge to edge: at 1.300 the whole block is in, the person's outer
//           ink 18 screen px inside the right edge and the flag's skull 16
//           inside the left.
//   CLOSE   k 1.750 FLAT, centred on the TEXT AXIS (`COL_X0 + COL_W / 2`),
//           with the person fully out of frame on the right. The text's own
//           ink keeps 36 screen px of air each side at rest and 31.5 at the
//           worst of the sway, which is what fixes 1.750 as the ceiling as
//           well as the landing; the hold's creep is in cy, not in k.
//
// Between 1.33 and 1.75 the person straddles the right edge, so the k must
// never be parked there: this cut crosses that band once, inside the move.
//
// The content centre is two functions with an eased blend between them:
//   cA  the wide frame — half way between the reader's line and the writing
//       line, dropped 190 world px so the caret sits low and the page runs off
//       the top instead of showing its own first line. It drifts down with the
//       reader, which is the wide hold's creep.
//   cB  line 16 — the line the hole will be in — TRACKED in the scrolled page.
//       Its offset walks from -48 to +5 world px across the hold, which raises
//       line 16 from screen y 917 at the landing to 817 at the last frame: the second half's creep, and it is the camera following the
//       caret. It starts low ON PURPOSE. At the landing line 16 is the line
//       ABOUT TO BE WRITTEN — there is nothing below it — so parking it at the
//       brief's 740 would leave 1,200 px of empty frame under the page. It
//       walks as the page fills beneath it: 873 when the reader crosses it on
//       "observable", 817 at the end, with the caret's line descending from
//       799 to 1153 under it.
//
// THE DAMPER IS THE REASON THE MOVE IS AUTHORED EARLY. `runCamera` lags, so a
// move authored f16-34 leaves the wide frame at f14, is 90% done by f36 and
// 95% by f39. The target tracks are also Gaussian-smoothed (sigma 4) before
// they reach the damper: the eased curve has a step in its own acceleration at
// each end, and the damper rings on it — |dv| 3.22 raw against 2.27 smoothed
// for the same landing.
// ---------------------------------------------------------------------------
const K_OPEN = 1.28;
const K_CREEP = 1.3;
/** The resolved k: the CLOSE rule's minimum, which is also the tightest this
 *  frame may be. The text's own ink is 36 screen px off each edge at 1.750 and
 *  the damper's overshoot is what the landing target is solved against, so the
 *  k NEVER exceeds 1.7526 — the point at which the sway would take the left
 *  ink inside 30 px. The hold's creep is therefore in POSITION, not in k. */
export const K_REST = 1.75;
const K_END = 1.75;
/** Authored window of the one move — see the damper note above. */
const PUSH_F0 = 16;
const PUSH_F1 = 34;
const PUSH_WARP = 0.65;
/** Line 16 sits at screen y 835 - DELTA * k. The offset opens in two eased
 *  stages — 900 at the landing, 880 when the reader crosses it at f70, 820 at
 *  the last frame — which is the hold's whole creep. */
const DELTA0 = -48;
const DELTA1 = -26;
const DELTA2 = 5;
const DELTA_F = 80;
/** The Gaussian the target tracks go through before the damper. */
const CAM_SIGMA = 4;

export const TEXT_CX = COL_X0 + COL_W / 2;
export const STROKE = strokeFor(K_REST);

const gauss = (track: number[], sigma: number) => {
  const r = Math.ceil(sigma * 3);
  const w: number[] = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const g = Math.exp(-(i * i) / (2 * sigma * sigma));
    w.push(g);
    sum += g;
  }
  return track.map((_, i) => {
    let s = 0;
    for (let j = -r; j <= r; j++) {
      s += w[j + r] * track[Math.max(0, Math.min(track.length - 1, i + j))];
    }
    return s / sum;
  });
};

const K_TRACK = gauss(
  kTrack(
    [
      { f0: 0, f1: PUSH_F0, k0: K_OPEN, k1: K_CREEP, warp: 1 },
      { f0: PUSH_F0, f1: PUSH_F1, k0: K_CREEP, k1: K_REST, warp: PUSH_WARP },
      { f0: PUSH_F1, f1: DURATION + 4, k0: K_REST, k1: K_END, warp: 1 },
    ],
    DURATION + 4,
  ),
  CAM_SIGMA,
);

const pushU = (f: number) => camEase(clamp01((f - PUSH_F0) / (PUSH_F1 - PUSH_F0)), PUSH_WARP);
const cA = (f: number) => 0.5 * readerY(f) + 0.5 * (HOLD_Y + WORD_H / 2) - 190;
const cB = (f: number) =>
  column.lineY(PHRASE_LINE) +
  WORD_H / 2 -
  scrollAt(f) +
  DELTA0 +
  (DELTA1 - DELTA0) * smoothstep(clamp01((f - PUSH_F1) / (DELTA_F - PUSH_F1))) +
  (DELTA2 - DELTA1) * smoothstep(clamp01((f - DELTA_F) / (DURATION - DELTA_F)));

export const cyAt = (f: number) => {
  const a = cA(f);
  return a + (cB(f) - a) * pushU(f);
};
export const cxAt = (f: number) => BLOCK_CX + (TEXT_CX - BLOCK_CX) * pushU(f);

const CAM_FRAMES = [...Array(DURATION + 5).keys()];
const CY_T = gauss(CAM_FRAMES.map(cyAt), CAM_SIGMA);
const CX_T = gauss(CAM_FRAMES.map(cxAt), CAM_SIGMA);
const at = (t: number[], f: number) => t[Math.max(0, Math.min(t.length - 1, Math.round(f)))];

export const CAM = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: (f) => at(CX_T, f),
  cy: (f) => at(CY_T, f),
});
export const CAM_AT = CAM.CAM_AT;
export const SCREEN_AT = CAM.SCREEN_AT;

// ---------------------------------------------------------------------------
// The three things the brief asks this file to prove before it renders a
// frame. They are cheap and they run at import, so a re-time of the clock or
// the reader stops the build instead of quietly drifting.
// ---------------------------------------------------------------------------
export const FOUND_16 = foundByReader(column, PHRASE_LINE, readerLine, 0, DURATION);
if (Math.abs(FOUND_16 - 70) > 0.5) {
  throw new Error(`NotObservable: the reader crosses line 16 at ${FOUND_16.toFixed(2)}, not 70`);
}
if (clock.EMIT[PHRASE_GI[0]] < 38 || clock.EMIT[PHRASE_GI[0]] > 41) {
  throw new Error(`NotObservable: the phrase starts at ${clock.EMIT[PHRASE_GI[0]]}, not in 38-41`);
}
{
  const d = clock.doneAt(PHRASE_GI[PHRASE_GI.length - 1]);
  if (d < 50 || d > 54) {
    throw new Error(`NotObservable: the phrase finishes at ${d}, not in 50-54`);
  }
}

// ---------------------------------------------------------------------------
const NotObservable: React.FC<Props> = ({
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
  // The per-icon shadow is the module's own: every white mark and the skull
  // take `k` and wear `iconShadow(k)` themselves. The word-bars never do.

  const scroll = scrollAt(frame);
  const exitAt = makeExit(cy, k);
  const head = clock.headAt(frame);
  const rY = readerY(frame);

  // the cut-2 flag, thinning out with its line through the top of frame
  const flagWY = column.lineY(FLAG9.line) - scroll;
  const flagEx = exitAt(flagWY + WORD_H / 2);

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
            {/* the chain of thought — and the three words sinking out of it */}
            <WordBars
              column={column}
              clock={clock}
              frame={frame}
              scroll={scroll}
              accent={accent}
              hAt={hAt}
              wipeAt={wipeAt}
              exitAt={exitAt}
              mode="gap"
              opacity={dotOpacity}
            />

            {/* what the reader found last time */}
            <Bracket
              column={column}
              flag={FLAG9}
              u={1}
              stroke={STROKE}
              ink={ink}
              opacity={INK_LO}
              scroll={scroll}
              exit={flagEx}
              k={k}
            />
            <SkullMark
              x={COL_X0 - SKULL_DX}
              y={flagWY + WORD_H / 2}
              u={1}
              scale={flagEx}
              accent={accent}
              opacity={dotOpacity}
              k={k}
            />

            {/* us, reading — it finds nothing here */}
            <ReaderLine
              yWorld={rY}
              stroke={STROKE}
              ink={ink}
              opacity={INK_HI}
              k={k}
            />

            {/* the model, writing */}
            <Caret x={head.x + COL_X0} y={head.y - scroll} accent={accent} opacity={dotOpacity} />
          </svg>

          {/* who is reading. DOM, beside the svg, inside the same transform. */}
          <ReaderPerson
            x={COL_X0 + COL_W + PERSON_DX}
            y={rY}
            k={k}
            opacity={INK_HI}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default NotObservable;

export const STATS = {
  duration: DURATION,
  words: column.WORDS.length,
  phrase: PHRASE_GI.map((gi) => [gi, clock.EMIT[gi], clock.doneAt(gi)]),
  found16: Number(FOUND_16.toFixed(3)),
  k: [0, 29, 34, 37, 70, 106].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
  reader: [0, 37, 70, 106].map((f) => [f, Number(readerLine(f).toFixed(3))]),
  head: [0, 37, 70, 106].map((f) => [f, Number(clock.headLine(f).toFixed(3))]),
};
