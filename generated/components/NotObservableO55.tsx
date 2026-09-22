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
  worldTransform,
} from "./fieldShared";
import {
  Bracket,
  COL_W,
  COL_X0,
  CLOCK_PAD,
  Caret,
  GAP,
  GRID_W0,
  INK,
  PERSON_DX,
  ReaderLine,
  ReaderPerson,
  SKULL_DX,
  SkullMark,
  WORD_H,
  WordBars,
  buildCamera,
  kTrack,
  makeClock,
  makeColumn,
  makeExit,
  readerAt,
  strokeFor,
  type Flag,
} from "./punishShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam_Punishing_AIs, cut 3 of 8, `NotObservableO55` (independent rebuild of
// `NotObservable`), in-point 0:16.480:
//   "then what ends up happening is the model just learns to think those bad
//    thoughts in a way that's not observable to us."
//
// DURATION = round(3.739 * 24) + 16 = 90 + 16 = 106.
// Onsets (frames from t0): then 0 · what 3 · ends 8 · up 11 · happening 13 ·
//   is-the 18 · model 22 · just 25 · learns 29 · to 35 · think 39 · those 44 ·
//   bad 47 · thoughts 50 · in-a 56 · way 60 · that's 62 · not 66 ·
//   observable 70 · to-us 78 · speech ends 90 · tail to 106.
//
// THE IDEA — disappearing ink. The model writes a bad thought and it is GONE
// before the reader gets there. Three words in the MIDDLE of line 16 grow
// behind the caret like any others, then each sinks to zero height a few
// frames after it is finished, leaving a hole flanked by the words either
// side of it. The reader arrives, passes over the hole, and leaves NO
// bracket. The cut-2 flag on line 9 (bracket + skull) stands above in the
// wide shot as context: the thought we caught, and the thought we cannot.
//
// ---------------------------------------------------------------------------
// WORLD AT f0. `makeColumn(11, 64, LINE0)` — the clip's one page.
//   PRE_LINES 14: lines 0-13 exist, the caret starts line 14. Line 9 carries
//   the cut-2 flag, words 0..2, bracket and skull fully drawn.
//   Writing rate 1/4.4 words per frame, constant (solved below).
//   Writing line held at HOLD_Y 1050 by the scroll.
//   Reader at line 11.97 (solved below), person beside it.
//
// THE HIDDEN PHRASE. Line 16 is the only line near the flag with five words
// (0+71, 89+76, 183+50, 250+75, 343+88), so words 1..3 go and words 0 and 4
// stay: a 236-world-px hole with a full word each side of it, which reads as
// something MISSING rather than as an indent.
//   Solve: the phrase's first word is gi 66, W_AT[0] = 57 (sum of lines 0-13),
//   so EMIT(first) = 9 / r and doneAt(last) = 11 / r + 2. With 1/r = 4.4:
//   EMIT 39.6 ("think" 39), 44.0 ("those" 44), 48.4 ("bad" 47), doneAt of the
//   last 50.4 ("thoughts" 50). PRE_LINES 13 has no rate that meets both
//   windows (1/r would have to be <= 3.15 and >= 3.2) and 15 needs 1/r ~ 8,
//   slower than the reader. So 14 and 1/4.4.
// ERASE RULE (mechanism, not timer). Each phrase word begins sinking
//   ERASE_LAG 6 f after its own doneAt, height 1 -> 0 over ERASE_F 8 f on a
//   smootherstep, mode "gap" (rx follows the height, so it thins to a hairline
//   about its own centreline and is gone; no alpha). Sinks: 47.6-55.6,
//   52.0-60.0, 56.4-64.4 — the hole is complete at f64.4, before "not" 66.
// THE READER crosses line 16's centre at exactly f70.0 ("observable"): its
//   line0 = 16 + (WORD_H/2)/PITCH - 70 * READER_LPF = 11.972. NO bracket is
//   created there. The soft cap never engages on any frame of the cut (the
//   head stays >= 1.4 lines ahead: measured min gap below).
//
// ---------------------------------------------------------------------------
// GESTURES — each with the word it serves.
//  1. f0-4    "then what"   WIDE. The page with the line-9 flag in the upper
//             half, the reader + person mid-frame (836), the caret writing line
//             14 below them (1036). The camera creeps (the page drifts up).
//  2. f4-34   "ends up happening is the model just learns to"   THE PUSH, one
//             eased lobe (warp 1), k 1.275 -> 1.75 with cx 540 -> 532.15 and the
//             content centre from the wide composition onto line 16, all on the
//             same camEase. Its first ten frames barely move, so the open reads
//             as a wide hold. The person leaves off the right (out from f32),
//             the reader line runs off the sides, the line-9 flag leaves through
//             the top-left corner, thinning (gone f26). Target lands f34, 5 f
//             before "think"; the damped camera is within 0.01 of k 1.75 at f38.
//  3. f39-52  "think those bad thoughts"   the phrase is written under the
//             caret: EMIT 39.6 / 44.0 / 48.4, grown 43.2 / 47.2 / 52.0.
//  4. f49-66  "in a way that's"   each phrase word SINKS to nothing 6 f after
//             its own finish (49.2-57.2, 53.2-61.2, 58.0-66.0). The caret
//             carries on to word 4 and line 17 as if nothing happened.
//  5. f66-78  "not observable"   the reader's line crosses the hole at f70.0.
//             No bracket. No camera move: the hold IS the point.
//  6. f78-106 "to us" + tail   the reader continues toward the writing line
//             (never capped), the caret writes lines 17-19, the hole sits above
//             the reader. Nothing lands on f90.
// Continuous under all of it: the caret writing, the reader descending, the
// scroll, the camera's creep. Nothing else is animated — no rings, flashes,
// fades or colour changes.
//
// CAMERA. Two rests and one move between them.
//   WIDE  f0-4    k 1.275, cx 540 (BLOCK_CX), world-fixed + 0.6 world px/f
//                 creep (the writing line rises on screen).
//   PUSH  f4-34   k 1.275 -> 1.75, warp 1, cx -> 532.15, content centre ->
//                 line 16 (one camEase for k, cx and cy).
//   CLOSE f34-106 k 1.75, cx 532.15 (text axis), the content centre TRACKS
//                 line 16 through the scroll (fed forward 5.2 f against the
//                 damper's ramp lag) and drifts it up the screen 934 -> 873:
//                 the position creep (revision 1).
//
// TWO LOCAL HELPERS (new, not copies): `caretW` carries the caret through the
// word gap instead of stepping it, and `grownAt` grows each bar under the caret
// (at 4.4 f/word the shared 2-frame growth left the caret crawling through a
// finished word as a "+"). Both read the shared clock.
//
// DEVIATIONS FROM THE CUT BRIEF / DIRECTOR (reasons):
//  - Open k 1.275, not 1.30: the person's ink (0.844 of its 96 box) ends
//    398.65 world px right of BLOCK_CX, so 1.30 leaves 22 px of air; 30 px
//    needs k <= 1.279.
//  - The push runs f4-34, not f29-37: k 1.275 -> 1.75 plus a ~300 px pan of the
//    subject in 8 frames measures |dv| ~ 7-11 px/f^2 (cap 2.5); 30 frames is
//    what the cap allows over the whole frame. It still lands 5 f before
//    "think", so the WIDE hold is f0-~10 (the lobe's slow start) instead.
//  - The WIDE composition puts the caret at screen 1036, not the lowest third:
//    a lower caret lengthens the pan and breaks the |dv| cap; it also lifts the
//    flag into the upper half (587) and the reader to mid-frame (836).
//  - The line-9 flag leaves through the top-LEFT corner: at cx 540 the skull's
//    ink reaches the 30 px edge air at k ~ 1.31, before its line can reach the
//    top exit; it straddles the left edge only during the push (f~12-25) and is
//    thinned to nothing by f26.
//  - Hidden words 1..3 on line 16 (director), not 0..2; PRE_LINES 14 and rate
//    1/4.4 (not 15 and 1/3.3): see the solve above. The hole's last word is
//    fully gone at f66.0 (grown 51.95 + 6 + 8).
//  - No k creep (1.75 -> 1.80 -> 1.83 in the brief): CLOSE is k 1.75 exactly;
//    the hold creeps in position.
//  - The CARET's typing speed reaches 65 screen px/f inside long words near
//    k 1.66-1.75 (cap 45): set by the phrase-fixed rate (1/4.4 words/f) and word
//    widths up to 150 px; no rate meets both the phrase windows and the cap.
//    The line wrap is the caret's usual one-frame return.
//  - At CLOSE the reader line spans the frame and both end dots sit at or past
//    the frame edges (text 36 px from each edge, overhang 23 world px): an edge
//    exit like the person's.
//  - REVISION 1: the hole lands at screen y ~934 (f37) and creeps up to ~873
//    by f105, not 740-820. At 740-820 the caret sat one line under the hole at
//    ~880 and y 900-1400 was empty grid through "not observable" (a frame whose
//    lower half is empty grid is wrong, COMMON); the reader must stay ~1.5 lines
//    behind the caret, so text cannot be added — the framing is lowered.
//
// MEASURED (bun $S/NotObservableO55/measure.ts):
//   phrase EMIT 39.60 / 44.00 / 48.40, grown 43.15 / 47.23 / 51.95; all three
//   at zero from f66. Reader crosses line 16 at f70.000 (line0 11.9719); cap
//   never engages (min head - reader gap 1.54 lines before f75, 1.44 over the
//   cut; it engages below 1.40). Camera max |dv| of a fixed world point 2.11
//   px/f^2 over the whole frame (f11, top-right corner), 1.39 in the subject
//   band; max |v| 21.9 px/f. k max 1.7502. Hole screen y 873-934 from f37
//   (f60 916, f70 909, f105 873). Reader screen y 705-1108; writing line
//   829-1224; lowest ink 1264.6 (f93 caret); min edge air 31.1 (f44, word at
//   CLOSE). Reader head 8.0 px/f. Energy min 99 px/f (f48). Largest empty
//   run above 1400: f37 426 px, f60 332, f70 339, f105 151 (all under the
//   caret). Bars: phrase 22 -> 0, all other words 22.
// ---------------------------------------------------------------------------

export const DURATION = 106;

/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
export const READER_LPF = 0.06;
/** clip constant: the writing line's hold, world y */
export const HOLD_Y = 1050;
/** The column's line 0 top in world y before the scroll. Any value that keeps
 *  the scroll positive on every frame; it changes nothing on screen. */
export const LINE0 = 400;

export const PRE_LINES = 14;
/** words per frame — solved from the phrase windows (header). */
export const RATE = 1 / 4.4;

export const HIDE_LINE = 16;
export const HIDE_K0 = 1;
export const HIDE_K1 = 3;
export const ERASE_LAG = 6;
export const ERASE_F = 8;
/** The frame the reader must cross the hidden line's centre ("observable"). */
export const F_CROSS = 70;

/** The cut-2 flag, standing above as context. Fully drawn before f0. */
export const FLAG9: Flag = { line: 9, k0: 0, k1: 2, found: -40 };

// --- camera -----------------------------------------------------------------
export const K_WIDE = 1.275;
export const K_CLOSE = 1.75;
export const CX_WIDE = 540; // BLOCK_CX
export const CX_CLOSE = COL_X0 + COL_W / 2; // the text axis, 532.15
export const PUSH_F0 = 4;
export const PUSH_F1 = 34;
export const PUSH_WARP = 1;
/** WIDE: the caret's line centre at this screen y on f0 ... */
export const Y_CARET_WIDE = 1040;
/** ... and the world-fixed camera creeping down this much a frame. */
export const WIDE_CREEP = 0.6;
/** CLOSE: the hole's screen y drifts from A (at PUSH_F1) to B (at DURATION). */
export const Y_HOLE_A = 932; // revision 1: lowered from 812
export const Y_HOLE_B = 855;
/** Feed-forward against the damper's steady ramp lag (CAM_DAMP / CAM_STIFF). */
export const TRACK_LEAD = 5.2;
/** Where the content centre lands on screen: FRAME_H / 2 - CAM_LIFT. */
const Y_CONTENT = 835;

/** One stroke weight for the cut, fixed at its CLOSE rest. */
export const K_REST = K_CLOSE;
export const STROKE = strokeFor(K_REST);

// ---------------------------------------------------------------------------
export const COLUMN = makeColumn(11, 64, LINE0);
export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => RATE,
});

/** THE WORD GROWS UNDER THE CARET. The shared `grownAt` runs a word out in
 *  GROW (2) frames from EMIT, which at V5's 1.4 f/word is the caret's own pace.
 *  At this cut's 4.4 f/word the bar would finish in 2 f and the caret would then
 *  crawl through a finished word for 2.4 f, sitting on it as a "+". So here the
 *  bar's right end IS the caret: the clock's fractional word g sweeps the word
 *  and its trailing gap (`reach`), the bar is grown to `g * reach / w`, and the
 *  caret crosses the gap after it. Read off the same clock; still grows from its
 *  own left edge; no clock holds in this cut, so the V4 reason for counting in
 *  frames does not arise. A new helper, not a copy. */
const reachOf = (gi: number) => {
  const w = COLUMN.WORDS[gi];
  const ws = COLUMN.LINES[w.line].words;
  return ws[ws.length - 1].gi === gi ? w.w : w.w + GAP;
};
export const grownAt = (gi: number, f: number) => {
  if (CLOCK.EMIT[gi] < 0) return 1;
  const g = clamp01(CLOCK.wordsAt(f) - gi);
  return clamp01((g * reachOf(gi)) / COLUMN.WORDS[gi].w);
};
/** The frame word gi is fully grown (the clock is linear: constant RATE). */
export const doneAt = (gi: number) => CLOCK.EMIT[gi] + COLUMN.WORDS[gi].w / reachOf(gi) / RATE;
/** The clock WordBars reads: the shared one with this cut's growth. */
export const BAR_CLOCK = { ...CLOCK, grownAt, doneAt };

export const HIDE_GI: number[] = COLUMN.LINES[HIDE_LINE].words
  .slice(HIDE_K0, HIDE_K1 + 1)
  .map((w) => w.gi);
const isHidden = (gi: number) => gi >= HIDE_GI[0] && gi <= HIDE_GI[HIDE_GI.length - 1];

const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};

/** OBSERVABILITY. 1 for every word except the phrase, which sinks by the
 *  erase rule: ERASE_LAG after its OWN doneAt, over ERASE_F frames. */
export const hAt = (gi: number, f: number) => {
  if (!isHidden(gi)) return 1;
  return 1 - smootherstep((f - (doneAt(gi) + ERASE_LAG)) / ERASE_F);
};

/** The reader's crossing of line 16's centre lands on F_CROSS by construction. */
const HIDE_CENTRE_T =
  HIDE_LINE + WORD_H / 2 / (COLUMN.lineY(HIDE_LINE + 1) - COLUMN.lineY(HIDE_LINE));
export const READER_LINE0 = HIDE_CENTRE_T - F_CROSS * READER_LPF;
export const readerRaw = (f: number) => READER_LINE0 + f * READER_LPF;
export const readerLine = (f: number) =>
  readerAt({ f, f0: 0, line0: READER_LINE0, linesPerFrame: READER_LPF, capLine: CLOCK.headLine });

/** The scroll at a fractional frame: the shared table, linearly interpolated
 *  (the camera's feed-forward reads it between integer frames). */
export const scrollF = (f: number) => {
  const a = Math.floor(f);
  const u = f - a;
  return CLOCK.scrollAt(a, HOLD_Y) * (1 - u) + CLOCK.scrollAt(a + 1, HOLD_Y) * u;
};
export const scroll = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

/** World y of a line's CENTRE at frame f. */
export const lineCentreW = (line: number, f: number) => COLUMN.lineY(line) + WORD_H / 2 - scroll(f);
export const readerW = (f: number) => COLUMN.lineYf(readerLine(f)) - scroll(f);
/** THE CARET, gap-continuous. The shared `headAt` puts the head at the end of
 *  word i until the clock reaches word i + 1 and then steps it across the
 *  18 px GAP in one frame, so a writing caret stutters at every word
 *  boundary. This reads the same clock and carries the caret through the gap
 *  as part of word i instead (the last word of a line runs to its own end, and
 *  the wrap is still the caret's one-frame return). Same clock, same line,
 *  never more than GAP px from `headAt`. A new helper, not a copy. */
export const caretW = (f: number) => {
  const w = CLOCK.wordsAt(f);
  const i = Math.max(0, Math.min(COLUMN.WORDS.length - 1, Math.floor(w)));
  const word = COLUMN.WORDS[i];
  const g = clamp01(w - i);
  const ws = COLUMN.LINES[word.line].words;
  const last = ws[ws.length - 1].gi === word.gi;
  const x = word.x + (last ? word.w : word.w + GAP) * g;
  return { x: x + COL_X0, y: COLUMN.lineY(word.line) - scroll(f), line: word.line };
};

// --- the camera -------------------------------------------------------------
const K_END = DURATION + CLOCK_PAD;
export const PUSH_E = (f: number) => camEase((f - PUSH_F0) / (PUSH_F1 - PUSH_F0), PUSH_WARP);
const CARET_C0 = HOLD_Y + WORD_H / 2;
const wideC = (f: number) => CARET_C0 - (Y_CARET_WIDE - Y_CONTENT) / K_WIDE + WIDE_CREEP * f;
const yHole = (f: number) =>
  Y_HOLE_A + ((Y_HOLE_B - Y_HOLE_A) * (f - PUSH_F1)) / (DURATION - PUSH_F1);
const closeC = (f: number) =>
  COLUMN.lineY(HIDE_LINE) + WORD_H / 2 - scrollF(Math.max(0, f + TRACK_LEAD)) +
  (Y_CONTENT - yHole(f)) / K_CLOSE;

export const K_TRACK = kTrack(
  [
    { f0: 0, f1: PUSH_F0, k0: K_WIDE, k1: K_WIDE, warp: 1 },
    { f0: PUSH_F0, f1: PUSH_F1, k0: K_WIDE, k1: K_CLOSE, warp: PUSH_WARP },
  ],
  K_END,
);
export const CAM = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: (f) => CX_WIDE + (CX_CLOSE - CX_WIDE) * PUSH_E(f),
  cy: (f) => {
    const e = PUSH_E(f);
    return wideC(f) * (1 - e) + closeC(f) * e;
  },
});

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
  dotOpacity: OP_UNREAD_DOT,
});

const NotObservableO55: React.FC<Props> = ({
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
  const { cx, cy, k } = CAM.CAM_AT(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const exitAt = makeExit(cy, k);
  const sc = scroll(frame);
  const head = caretW(frame);
  const rY = readerW(frame);
  const flagY = lineCentreW(FLAG9.line, frame);
  const flagExit = exitAt(flagY);

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
            {/* the chain of thought; the phrase on line 16 sinks to nothing */}
            <WordBars
              column={COLUMN}
              clock={BAR_CLOCK}
              frame={frame}
              scroll={sc}
              accent={accent}
              hAt={hAt}
              exitAt={exitAt}
              mode="gap"
              opacity={dotOpacity}
            />
            {/* the thought we caught (cut 2), context */}
            <Bracket
              column={COLUMN}
              flag={FLAG9}
              u={1}
              stroke={STROKE}
              ink={ink}
              scroll={sc}
              exit={flagExit}
              k={k}
            />
            <SkullMark
              x={COL_X0 - SKULL_DX}
              y={flagY}
              u={1}
              scale={flagExit}
              accent={accent}
              opacity={dotOpacity}
              k={k}
            />
            {/* us, reading */}
            <ReaderLine column={COLUMN} yWorld={rY} stroke={STROKE} ink={ink} k={k} />
            {/* the model writing */}
            <Caret x={head.x} y={head.y} accent={accent} opacity={dotOpacity} />
          </svg>
          <ReaderPerson x={COL_X0 + COL_W + PERSON_DX} y={rY} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default NotObservableO55;
