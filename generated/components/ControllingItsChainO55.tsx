import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
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
  COL_W,
  COL_X0,
  Caret,
  type Clock,
  GAP,
  GRID_W0,
  HAIR_H,
  INK,
  PERSON_DX,
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
// Noam_Punishing_AIs, cut 6 of 8 — `ControllingItsChainO55` (in 0:48.840).
// "but, like, we're seeing that the model is becoming better able at
//  controlling its chain of thought."
//
// THE IDEA. In cut 5 WE pressed. Here THE MODEL presses its own words: a word
// is written at full height and then, on its own timer (its doneAt + a lag —
// nothing white touches it, the caret does not come back), sinks. Each press
// comes sooner after the word, runs quicker and goes lower — "becoming better
// able" — and from line 42 the words it wants hidden come out of the caret
// ALREADY at hairline, by the mask [1,1,0,1,0,0]: control. The reader, 2-3.5
// lines behind, passes over all of it and brackets nothing. No brackets, no
// skulls, no labels.
//
// GESTURES (gesture -> word -> frames). Nothing else moves.
//  1. caret writes lines 39-41 briskly, then eases  -> "we're seeing"   f0-30
//  2. press 1: L40 k0 sinks to 11 px (half), 12 f   -> "that ... the"   f19.5-31.5
//     (done f9.5 + lag 10; slow, incomplete, starts in the wide shot)
//  3. PUSH WIDE -> CLOSE (the one camera move)      -> "the model"      f14-42 target,
//     k 1.26 -> 1.75, cx 540 -> 532.15, same lobe      leaves WIDE f18, lands f48
//  4. press 2: L40 k2 (150 px) to 6 px, 8 f         -> "model"          f25.0-33.0 (lag 6)
//  5. press 3: L41 k1 to hairline, 5 f              -> "is / becoming"  f34.5-39.5 (lag 3)
//  6. press 4: L41 k3 to hairline, 3 f              -> "better"         f41.6-44.6 (lag 1)
//  7. caret speeds up to its fluent rate; L42+ in the mask, hairline words
//     flat from emit (first hair word L42 k2 @ f62.4) -> "able at controlling its
//     chain of thought"  f52-103 (hair words f62.4, 79.1, 88.5, 100.6)
//  8. the reader crosses line 40 (the pressed words) at f64.2 and line 41 at
//     f80.9 and finds nothing                       -> "controlling ... thought"
//  9. tail f87-103: caret writes on in the pattern, reader reads, creep. Nothing
//     lands on f87.
//
// CAMERA. WIDE k 1.26 on BLOCK_CX, writing line at screen 1039-1114 -> ONE
// eased push (warp 1) to CLOSE k 1.75 on the text axis, writing line at screen
// 934-1050, the person fully out right, the reader line running off the edges.
// cx and the content centre ride the push's own ease; a constant 0.95 screen
// px/f creep (page drifting up, the push's own direction) keeps both holds
// moving.
//
// MEASURED (measure.ts, all PASS).
//   camera        max |dv| of a fixed on-screen world point 1.81 px/f^2 (f22),
//                 max |v| 20.3 px/f; min hold creep 0.45 px/f.
//   heads         caret 43.4 screen px/f max (f71; the five one-frame line
//                 wraps f6, 24, 52, 70, 93 exempt — that is what a caret does);
//                 reader 8.8, person 10.2.
//   reader        head - reader 2.09 .. 3.41 lines; never capped (cap - raw >=
//                 1.49 lines); reader line screen y 758 .. 827.
//   clock         L42 first EMIT f51.8, L43 f69.9; caret 33 -> 15.5 (f30) ->
//                 24.2 (f54+) world px/f.
//   heights       pressed words end at exactly 11 / 6 / 3 / 3 px; pattern words
//                 at HAIR_H from emit; all other text non-decreasing.
//   frame         lowest ink screen y 1143; min edge air (words + caret) 32.1;
//                 person air 37.9 in the wide shot; energy >= 22 px every frame.
//
// DEVIATIONS from the brief (06_ControllingItsChain.md) and why.
//  - WIDE open at k 1.26, not 1.30 (director) nor 1.6 (brief): at 1.30 on cx 540
//    the person's ink is 22 px from the right edge; 1.26 is the largest k in
//    the WIDE band that keeps 30 px with the sway.
//  - CLOSE k 1.75 exactly, not 1.95 -> 2.0 (director): text ink is 31 px from
//    the edges at 1.75. The hold creep is position, not k.
//  - Content centre at CLOSE: the writing line sits at screen ~950-1050, not
//    centred at 835. At 835 the lower half of the frame is empty grid (COMMON:
//    wrong) and the brief's own assertion puts the writing line in [900, 1150].
//  - Line 40 has 4 words (seed 11), so the brief's "line 40 k4" does not exist:
//    the four pressed words are L40 k0, L40 k2, L41 k1, L41 k3 — the brief's
//    lags (10/6/3/1), durations (12/8/5/3), heights and start frames (+-2) kept.
//  - The caret starts 180 px before line 40 (2/3 through line 39's third word),
//    not at line 40's start ("preLines 40"): with the reader at 0.06 lines/f
//    and the caret capped at 45 screen px/f in the close-up, a line-40 start
//    cannot keep the reader inside [2, 3.5] lines (range needed 1.68 > 1.5).
//  - Rate: not 1/2.2 words/f (that outruns the reader by 5 lines and the head
//    cap by 60%). The caret runs a smooth PIXEL speed, 33 -> 15.5 -> 24.2 world
//    px/f, solved against the press windows, L42 in [50, 54], the reader band
//    and the head cap together.
//  - Reader R0 36.32 (brief 37.6): the only value band ([36.23, 36.41]) that
//    keeps the distance in [2, 3.5] on every frame; it crosses line 40 at f64,
//    not f40-60.
//  - Word growth: bars grow exactly behind the caret (a helper in this file,
//    `grownPx`), not over the shared two frames from emit, which at this pace
//    shot each bar out ahead of its caret. The shared clock still drives EMIT,
//    headLine and the scroll.
//  - Stroke fixed at strokeFor(1.75), the close-up's k.
//
// HELPERS WRITTEN HERE (nothing added to punishShared / fieldShared): the pixel
// path (PATH, pathAt, frameOfPath), grownPx, doneOf, caretAt, hAt.
// ---------------------------------------------------------------------------

export const FPS = 24;
/** round(3.620 * 24) + 16: speech ends at f87, 16-frame tail. */
export const DURATION = 103;

/** Word onsets, frames from this cut's own t0 (words.srt, 48.840 s). */
export const BEATS = {
  but: 0,
  like: 1,
  were: 5,
  seeing: 8,
  that: 15,
  the: 26,
  model: 30,
  is: 34,
  becoming: 36,
  better: 41,
  able: 52,
  at: 59,
  controlling: 63,
  its: 71,
  chain: 75,
  of: 79,
  thought: 81,
  end: 87,
};

// ---------------------------------------------------------------------------
// CLIP CONSTANTS.
// ---------------------------------------------------------------------------
/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
export const READER_LPF = 0.06;
/** clip constant: the writing line's hold, world y (the column scrolls to keep
 *  the line being written here). */
export const HOLD_Y = 1050;
/** Line 0's top in world y before the scroll. Any value that puts the writing
 *  line below HOLD_Y gives the same picture — the scroll absorbs it. */
export const LINE0 = 200;
export const COLUMN = makeColumn(11, 64, LINE0);

// ---------------------------------------------------------------------------
// THE WRITING, as a PIXEL path. The caret travels the text at a smooth speed
// in world px per frame, and every bar grows exactly behind it: a word's right
// end IS the caret. (The shared clock grows a word over a fixed two frames from
// its emit, which at this cut's pace would run each bar out ahead of the caret
// it is supposed to be coming out of.) The path runs word to word along a line
// — through the inter-word gap, so the caret is continuous — and wraps to the
// next line's first word in one frame, which is what a caret does. The last
// word of a line has no trailing gap: the caret stops at its end, which keeps
// it 30 px off the right edge at CLOSE.
//
// The shared `makeClock` is still THE clock (EMIT, headLine, the scroll): its
// rate is read off this path, so words, caret, scroll and reader agree.
// ---------------------------------------------------------------------------
type PathWord = { gi: number; line: number; k: number; x: number; w: number; p0: number; seg: number };
export const PATH: PathWord[] = (() => {
  const out: PathWord[] = [];
  let p = 0;
  for (let i = 0; i < COLUMN.N_LINES; i++) {
    const ws = COLUMN.LINES[i].words;
    for (let k = 0; k < ws.length; k++) {
      const seg = k === ws.length - 1 ? ws[k].w : ws[k].w + GAP;
      out.push({ gi: ws[k].gi, line: i, k, x: ws[k].x, w: ws[k].w, p0: p, seg });
      p += seg;
    }
  }
  return out;
})();
const pathOf = (line: number, k = 0) => PATH[COLUMN.LINES[line].words[k].gi];

/** Where the caret is at f0: 180 px before line 40 starts, i.e. two-thirds of
 *  the way through line 39's third word. (The brief's "preLines 40" cannot
 *  keep the reader inside [2, 3.5] lines of the head under the 45 px/f head
 *  cap — see DEVIATIONS.) */
export const P_START = pathOf(40).p0 - 180;

/** The caret's speed, world px per frame: brisk in the wide shot, easing while
 *  the model works on its own words, then fluent — "controlling" — at the
 *  close-up's head cap. Knots joined by smoothsteps (C1, no corners). */
export const V_KNOTS: [number, number][] = [
  [0, 33],
  [30, 15.5],
  [54, 24.2],
];
export const speedAt = (f: number) => {
  if (f <= V_KNOTS[0][0]) return V_KNOTS[0][1];
  for (let i = 1; i < V_KNOTS.length; i++) {
    const [f0, v0] = V_KNOTS[i - 1];
    const [f1, v1] = V_KNOTS[i];
    if (f <= f1) return v0 + (v1 - v0) * smoothstep((f - f0) / (f1 - f0));
  }
  return V_KNOTS[V_KNOTS.length - 1][1];
};

const P_PAD = 40;
/** P at integer frames −P_PAD .. DURATION + P_PAD (midpoint integration). */
const P_TRACK: number[] = (() => {
  const out: number[] = [];
  // backwards from f0 at the opening speed, so the pre-roll is continuous
  for (let f = -P_PAD; f <= DURATION + P_PAD; f++) {
    if (f <= 0) out.push(P_START + speedAt(0) * f);
    else out.push(out[out.length - 1] + speedAt(f - 0.5));
  }
  return out;
})();
/** The caret's path position at (fractional) frame f. */
export const pathAt = (f: number) => {
  const x = Math.max(-P_PAD, Math.min(DURATION + P_PAD - 1e-6, f)) + P_PAD;
  const i = Math.floor(x);
  return P_TRACK[i] + (P_TRACK[Math.min(P_TRACK.length - 1, i + 1)] - P_TRACK[i]) * (x - i);
};
/** The (fractional) frame the caret reaches path position p. */
export const frameOfPath = (p: number) => {
  for (let i = 1; i < P_TRACK.length; i++) {
    if (P_TRACK[i] >= p) {
      return i - 1 - P_PAD + (p - P_TRACK[i - 1]) / Math.max(1e-9, P_TRACK[i] - P_TRACK[i - 1]);
    }
  }
  return Infinity;
};
const wordAtPath = (p: number) => {
  let lo = 0;
  let hi = PATH.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (PATH[mid].p0 <= p) lo = mid;
    else hi = mid - 1;
  }
  return PATH[lo];
};
/** Words written by frame f, fractional — the clock's own unit. */
const wordsAtPath = (f: number) => {
  const p = pathAt(f);
  const w = wordAtPath(p);
  return w.gi + clamp01((p - w.p0) / w.seg);
};

/** The shared clock is run CLOCK_OFF frames ahead of the cut, so the words of
 *  line 39 the caret has already passed exist, fully written, at f0. */
export const CLOCK_OFF = 12;
const PRE_LINES = 39;
export const CLOCK: Clock = makeClock({
  column: COLUMN,
  duration: DURATION + CLOCK_OFF,
  preLines: PRE_LINES,
  // the same path, floored at line 39's first word so the pre-roll starts
  // exactly where `preLines` leaves the clock
  rateAt: (fc) => {
    const f = fc - CLOCK_OFF;
    const w0 = COLUMN.LINES[PRE_LINES].words[0].gi;
    return Math.max(w0, wordsAtPath(f + 1)) - Math.max(w0, wordsAtPath(f));
  },
});
/** The clock in THIS cut's frames. */
export const headLine = (f: number) => CLOCK.headLine(f + CLOCK_OFF);
export const scrollAt = (f: number) => CLOCK.scrollAt(f + CLOCK_OFF, HOLD_Y);
export const emitOf = (gi: number) => CLOCK.EMIT[gi] - CLOCK_OFF;

/** How far a word has run out from its left edge: exactly to the caret. */
export const grownPx = (gi: number, f: number) => {
  const q = PATH[gi];
  return clamp01((pathAt(f) - q.p0) / q.w);
};
/** The frame a word is finished: the caret reaches its right end. */
export const doneOf = (gi: number) => frameOfPath(PATH[gi].p0 + PATH[gi].w);

/** The caret in column coordinates: continuous along a line, one-frame wrap. */
export const caretAt = (f: number) => {
  const p = pathAt(f);
  const w = wordAtPath(p);
  return { x: w.x + (p - w.p0), line: w.line, y: COLUMN.lineY(w.line) };
};

// ---------------------------------------------------------------------------
// OBSERVABILITY. The model presses its own words. Four self-presses, each
// sooner after the word is written, quicker, and lower — "becoming better
// able" — and from line 42 on the words come out of the caret already at the
// height the model wants: the mask, instant at emit.
// ---------------------------------------------------------------------------
export type Press = { line: number; k: number; lag: number; dur: number; toPx: number; brief: number };
export const PRESSES: Press[] = [
  { line: 40, k: 0, lag: 10, dur: 12, toPx: 11, brief: 18 },
  { line: 40, k: 2, lag: 6, dur: 8, toPx: 6, brief: 24 },
  { line: 41, k: 1, lag: 3, dur: 5, toPx: HAIR_H, brief: 33 },
  { line: 41, k: 3, lag: 1, dur: 3, toPx: HAIR_H, brief: 43 },
];
export const PRESS_AT = PRESSES.map((p) => {
  const gi = COLUMN.LINES[p.line].words[p.k].gi;
  const start = doneOf(gi) + p.lag;
  return { ...p, gi, start, end: start + p.dur };
});
/** The control pattern, on word index within the line (1 = full, 0 = hair). */
export const MASK = [1, 1, 0, 1, 0, 0];
export const PATTERN_LINE = 42;

export const hAt = (gi: number, f: number) => {
  const w = COLUMN.WORDS[gi];
  if (w.line >= PATTERN_LINE) {
    const k = gi - COLUMN.LINES[w.line].words[0].gi;
    return MASK[k % MASK.length];
  }
  for (let i = 0; i < PRESS_AT.length; i++) {
    const p = PRESS_AT[i];
    if (p.gi === gi) {
      const to = p.toPx / WORD_H;
      return 1 - (1 - to) * smoothstep((f - p.start) / p.dur);
    }
  }
  return 1;
};

// ---------------------------------------------------------------------------
// THE READER. Constant, never capped: it is 2 to 3.5 lines behind the head on
// every frame, so the soft cap is never within reach.
// ---------------------------------------------------------------------------
export const R0 = 36.32;
export const readerLineAt = (f: number) => readerAt({ f, f0: 0, line0: R0, linesPerFrame: READER_LPF });
/** The reader's world y (its line runs at the fractional line's top, the
 *  shared convention `foundByReader` reads). */
export const readerY = (f: number) => COLUMN.lineYf(readerLineAt(f)) - scrollAt(f);
export const PERSON_X = COL_X0 + COL_W + PERSON_DX;

// ---------------------------------------------------------------------------
// THE CAMERA. WIDE (k 1.26 on the block) -> ONE push -> CLOSE (k 1.75 on the
// text axis). cx and the content centre ride the same eased lobe; a constant
// creep in the content centre keeps both holds moving.
// ---------------------------------------------------------------------------
export const K_WIDE = 1.26;
export const K_CLOSE = 1.75;
export const CX_WIDE = BLOCK_CX;
export const CX_CLOSE = COL_X0 + COL_W / 2;
export const PUSH0 = 14;
export const PUSH1 = 42;
export const PUSH_WARP = 1;
/** content centre, world y, of the push's two ends (before the creep): the
 *  writing line sits at screen ≈ 1080 in the wide shot and ≈ 1030 in the
 *  close-up, so the page fills the frame down to the caret and the caption band
 *  starts under it. */
export const CC_WIDE = 835;
export const CC_CLOSE = 893;
/** the hold creep, SCREEN px per frame, in the content centre (the page drifts
 *  up the frame, the push's own direction, at every k) */
export const SCREEN_CREEP = 0.95;

const pushU = (f: number) => camEase((f - PUSH0) / (PUSH1 - PUSH0), PUSH_WARP);
export const K_TARGET = kTrack(
  [
    { f0: 0, f1: PUSH0, k0: K_WIDE, k1: K_WIDE, warp: 1 },
    { f0: PUSH0, f1: PUSH1, k0: K_WIDE, k1: K_CLOSE, warp: PUSH_WARP },
  ],
  DURATION + 2,
);
const CREEP_TRACK: number[] = K_TARGET.reduce<number[]>((acc, k, f) => {
  acc.push(f === 0 ? 0 : acc[f - 1] + SCREEN_CREEP / K_TARGET[f - 1]);
  return acc;
}, []);
export const CAM = buildCamera({
  duration: DURATION,
  K: K_TARGET,
  cx: (f) => CX_WIDE + (CX_CLOSE - CX_WIDE) * pushU(f),
  cy: (f) => CC_WIDE + (CC_CLOSE - CC_WIDE) * pushU(f) + CREEP_TRACK[f],
});

/** One stroke weight, fixed at the close-up's k (where the reader is read). */
export const K_REST = K_CLOSE;
export const STROKE = strokeFor(K_REST);

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
});

const DRAW_CLOCK: Clock = { ...CLOCK, grownAt: grownPx };

const ControllingItsChainO55: React.FC<Props> = ({
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
}) => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAM.CAM_AT(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const scroll = scrollAt(frame);
  const exitAt = makeExit(cy, k);
  const caret = caretAt(frame);
  const ry = readerY(frame);

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
            {/* the model's chain of thought, at the height the model allows */}
            <WordBars
              column={COLUMN}
              clock={DRAW_CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              hAt={hAt}
              exitAt={exitAt}
              mode="hair"
            />
            {/* us, reading behind it */}
            <ReaderLine yWorld={ry} stroke={STROKE} ink={ink} k={k} />
            {/* the model */}
            <Caret x={caret.x + COL_X0} y={caret.y - scroll} accent={accent} />
          </svg>
          <ReaderPerson x={PERSON_X} y={ry} k={k} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ControllingItsChainO55;
