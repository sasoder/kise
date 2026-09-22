import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  hash,
  iconShadow,
  worldTransform,
} from "./fieldShared";
import {
  BLOCK_CX,
  Bracket,
  COL_W,
  COL_X0,
  Caret,
  GRID_W0,
  INK,
  INK_HI,
  INK_LO,
  Label,
  PERSON_DX,
  ReaderLine,
  ReaderPerson,
  SKULL_DX,
  SkullMark,
  WORD_H,
  WordBars,
  bracketU,
  buildCamera,
  foundByReader,
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
// Noam_Punishing_AIs, cut 4 of 8 — `AlignmentMetricsO55` (in 0:23.300).
// "the model is scheming and doing misaligned things, in a way that's actually
//  not being detected in our alignment metrics."
// (Spoken just before, on camera: "by looking at the chain of thought we can
//  see, oh —". So in the TEXT we CAN see the scheming; the METRIC cannot.)
//
// DURATION = round(4.239 * 24) + 16 = 102 + 16 = 118.
// Onsets (frames from t0): the 0 · model 2 · is 7 · scheming 14 · and 23 ·
// doing 27 · misaligned 31 · things 40 · in-a 45 · way 49 · that's 51 ·
// actually 55 · not 59 · being 62 · detected 67 · in-our 77 · alignment 89 ·
// metrics 94 · speech ends 102 · tail to 118.
//
// THE IDEA. Two instruments, one page. Above: the chain of thought, where the
// reader finds scheming — two bad thoughts flagged two lines apart (bracket +
// skull, bracket + skull). Below the writing line: OUR ALIGNMENT METRIC — a
// white trace drawn left to right at a constant rate along a hairline axis,
// riding high and steady. The camera pulls from the skulls to the whole page
// with the metric under it on "not being detected", and the trace does not so
// much as twitch. That contrast is the whole cut.
//
// ---------------------------------------------------------------------------
// GESTURES — every one with the word it serves.
//  1. f0.5-6.5  "the model"            flag 0 (line 21, words 1..3): the reader's
//                                      line crosses the phrase, the bracket draws
//                                      on from its left and the orange skull with
//                                      it. Done 7.5 f before "scheming" 14.
//  2. f33.8-39.8 "misaligned things"   flag 1 (line 23, words 1..3), found the same
//                                      way by the same constant-rate reader; done
//                                      by "things" 40. Two skulls in the margin,
//                                      two lines apart.
//  3. f37-65 target / f39-70 on screen "in a way that's actually not being
//                                      detected" — ONE eased move to WIDE (k 1.44
//                                      -> 1.12, cx 477 -> 540, warp 0.7): the
//                                      person comes in from the right, the flags
//                                      go to the top third, the caret sits mid-
//                                      frame and the metric trace rises to the
//                                      lower third, visibly running. Lands f70,
//                                      7 f before "in our" 77.
//  4. f80-90    "alignment" 89         the label ALIGNMENT METRIC slides up 24 px
//                                      and fades in under the axis.
//  5. f65-117   "in our alignment      the camera creeps toward the metric: content
//               metrics"               drifts down 0.65 world px/f under one slow k
//                                      lobe 1.12 -> 1.14.
//  Running under all of it, no word of its own: the caret typing at one steady
//  rate, the reader descending at the clip's 0.06 lines/f, the trace's pen at
//  COL_W/117 px/f. Nothing lands on f102; the tail is those three continuing.
//
// CAMERA (targets; the damper puts each ~2-5 f later on screen).
//   f0-37   SKULL+TEXT hold, k 1.44, cx 477, tracking the reader's constant
//           world descent (0.72 world px/f) with the reader at screen y ~780.
//   f37-65  ONE lobe to WIDE, k 1.44 -> 1.12, cx -> BLOCK_CX, content on the
//           same camEase, warp 0.7. Content travel stays one-signed (down).
//   f65-120 WIDE, one slow k lobe 1.12 -> 1.14 with the content drifting down
//           0.65 world px/f — the creep, never parked (min 0.46 screen px/f).
//
// DEVIATIONS FROM THE CUT BRIEF (director's resolutions + what geometry forced).
//  * Flags on lines 21 and 23, not 21 and 22 (director): adjacent flags overlap
//    their 96 px skulls on a 64 px pitch. Both on words 1..3 (word 0 starts at
//    the measure on both lines, so the bracket's left pad clears the skull ink).
//  * Reader line0 21.142, not 20.16: solved so flag 0 is found at f0.5 and flag 1
//    at f33.8 (done by "things" 40), per the director.
//  * Open in SKULL+TEXT at k 1.44 / cx 477 (director), not CLOSE 1.65 on
//    BLOCK_CX. Known cost: the reader line's right end dot sits 13-37 screen px
//    inside the right edge (ink x 1043-1067). It cannot be pushed off: the axis
//    ends at the measure, 22 world px left of the dot, and must keep 30 px of air;
//    and it cannot get 30 px of air without the person entering the frame.
//  * Writing rate 0.195 words/f (1 word per 5.1 f), not 1/2.6: solved from the
//    reader gap. The head must stay >= 1.4 lines ahead of the reader (so the
//    soft cap never bends the reader's constant rate) at f117, and no faster,
//    or the flags scroll out of the top before the end.
//  * Words are masked to what the clock has TYPED (via `WordBars`' `wipeAt`)
//    and the caret runs continuously across word + gap (`caretAt`, a new
//    helper): at this rate `grownAt`'s 2-frame growth ran the bar ahead of the
//    caret, which then sat on orange mid-word, and `headAt` jumped every gap at
//    66 screen px/f. Now the caret leads its growing bar with daylight, <= 41 px/f.
//  * Axis at HOLD_Y + 215, not + 250, and the metric is IN FRAME at the open
//    (trace ~1225, axis ~1354 screen) rather than out of frame below: nothing
//    can enter from below without crossing the caption band (no ink below 1400
//    on ANY frame), and + 250 puts the axis at ~1405 in the opening framing.
//    The move then brings it up to the lower third (axis 1195 at f72).
//  * Camera: k 1.12 -> 1.14 (not 1.15/1.16) and the creep is a drift, not +40
//    in one lobe: the content may not turn back at the landing (a reversal read
//    as a stop at f70), and at 1.16 with +40 the upper skull thins out through
//    the top before f117. Axis 1165-1195 and lower skull <= 625 from f72 on.
//  * Trace rate COL_W / 117 (DURATION - 1), not / 118: f118 does not exist, and
//    the director asked for it to complete exactly on the last frame (f117).
//  * K_REST = 1.12 (the wide rest, where the cut resolves) for the one stroke.
//
// MEASURED (bun $S/AlignmentMetricsO55/measure.ts, all PASS):
//   found0 0.50 · found1 33.83 · head-reader gap >= 1.542 lines (reader linear)
//   camera max |dv| 2.03 px/f^2 (f40), max |v| 17.1 px/f, min creep 0.46 px/f
//   heads: caret 40.6 px/f (excl. wraps), reader 2.5, pen 7.4, person 10.3
//   energy min 25.3 · lowest ink 1355.7 (axis, f0) · min edge air 43.8
//   writing line (caret line top) screen y 856-1040 · bars 22 world px (top
//   exit thins) · trace level 85.0-91.0 · label bottom <= 1307
//   reader screen y 777-810 · axis 1165-1195 from f72 · lower skull <= 625
// ---------------------------------------------------------------------------

export const DURATION = 118;

/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
export const READER_LPF = 0.06;
/** clip constant: the writing line's hold, world y */
export const HOLD_Y = 1050;
/** The column's line-0 top in world y. The scroll carries it; with the page's
 *  first line at 0 the scroll is > 0 on every frame, so the hold is exact. */
export const LINE0_Y = 0;
/** Lines already written at f0; the caret starts line 24. */
export const PRE_LINES = 24;
/** Words per frame, constant — solved from the reader gap (see header). */
export const WRITE_RATE = 0.195;
/** The reader's line at f0, solved so found0 = f0.4 and found1 = f33.7. */
export const READER_LINE0 = 21.142;

/** The resolved (wide) zoom the one stroke weight is fixed at. */
export const K_REST = 1.12;
export const STROKE = strokeFor(K_REST);

export const COLUMN = makeColumn(11, 64, LINE0_Y);
export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => WRITE_RATE,
});
export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);
export const readerLine = (f: number) =>
  readerAt({ f, f0: 0, line0: READER_LINE0, linesPerFrame: READER_LPF, capLine: CLOCK.headLine });
export const readerLineRaw = (f: number) => READER_LINE0 + f * READER_LPF;
/** The reader line's WORLD y at frame f (after the scroll). */
export const readerWorldY = (f: number) => COLUMN.lineYf(readerLine(f)) - scrollAt(f);

export const FLAGS: Flag[] = [
  { line: 21, k0: 1, k1: 3, found: foundByReader(COLUMN, 21, readerLine, -10, DURATION + 10) },
  { line: 23, k0: 1, k1: 3, found: foundByReader(COLUMN, 23, readerLine, -10, DURATION + 10) },
];

// ---------------------------------------------------------------------------
// THE METRIC. Our instrument, fixed in WORLD space below the writing line's
// hold; it does not scroll with the page. A hairline axis across the measure,
// a trace riding TRACE_LEVEL above it with a smooth two-octave wobble of at
// most TRACE_WOBBLE px (a live signal, never a dip, never a response to the
// page), drawn by a pen that crosses the measure in exactly the cut's length.
// ---------------------------------------------------------------------------
export const AXIS_DY = 215;
export const AXIS_Y = HOLD_Y + AXIS_DY;
export const AXIS_X0 = COL_X0;
export const AXIS_X1 = COL_X0 + COL_W;
export const TRACE_LEVEL = 88;
export const TRACE_WOBBLE = 3;
export const PEN_R = 7;
export const LABEL_F0 = 80;
export const LABEL_Y = AXIS_Y + 40;
export const LABEL_X = BLOCK_CX;

const PH1 = hash(4, 17) * Math.PI * 2;
const PH2 = hash(9, 23) * Math.PI * 2;
/** The wobble, a function of x alone (x IS time for a pen), so what has been
 *  drawn never changes. |n| <= 2 + 1 = TRACE_WOBBLE. */
export const traceNoise = (x: number) => {
  const u = x - AXIS_X0;
  return 2 * Math.sin((u / 173) * Math.PI * 2 + PH1) + 1 * Math.sin((u / 59) * Math.PI * 2 + PH2);
};
export const traceY = (x: number) => AXIS_Y - TRACE_LEVEL - traceNoise(x);
export const traceHeadX = (f: number) =>
  AXIS_X0 + (AXIS_X1 - AXIS_X0) * clamp01(f / (DURATION - 1));

// ---------------------------------------------------------------------------
// THE CARET'S x. A new helper (punishShared has no such thing): `headAt` puts
// the caret at word.x + word.w * g, so at every word boundary it jumps the
// 18 px gap plus the tail of the word in one frame — ~45 world px/f at this
// rate, 66 screen px/f at the open's k. Here the caret runs continuously from
// one word's start to the next word's start (word + gap) over that word's
// share of the clock, so its speed is 0.195 * (w + 18) world px/f, never a
// jump; only the line wrap stays a jump, which is what a caret does.
// ---------------------------------------------------------------------------
/** How much of word `gi` has been TYPED at frame f: the clock's own fraction
 *  across it, 0..1. At this rate a word takes ~5 f to type but `grownAt` runs
 *  it out in GROW = 2, which leaves the bar ahead of its caret and the caret
 *  sitting on orange mid-word. So the bar is masked to what has been typed —
 *  through `WordBars`' own `wipeAt` (width = w * g * (1 - wipe) = w * typed) —
 *  and its growing edge is always just behind the caret, with daylight. */
export const typedAt = (gi: number, f: number) => clamp01(CLOCK.wordsAt(f) - gi);
const typingMask = (gi: number, f: number) => {
  const g = CLOCK.grownAt(gi, f);
  return g <= 0 ? 0 : clamp01(1 - typedAt(gi, f) / g);
};

export const caretAt = (f: number) => {
  const W = CLOCK.wordsAt(f);
  const i = Math.max(0, Math.min(COLUMN.WORDS.length - 1, Math.floor(W)));
  const g = clamp01(W - i);
  const w = COLUMN.WORDS[i];
  const nx = COLUMN.WORDS[i + 1];
  const x = nx && nx.line === w.line ? w.x + (nx.x - w.x) * g : w.x + w.w * g;
  return { x, line: w.line, y: COLUMN.lineY(w.line) };
};

const tracePath = (f: number) => {
  const hx = traceHeadX(f);
  const pts: string[] = [`M${AXIS_X0.toFixed(2)} ${traceY(AXIS_X0).toFixed(2)}`];
  for (let x = AXIS_X0 + 6; x < hx; x += 6) pts.push(`L${x.toFixed(2)} ${traceY(x).toFixed(2)}`);
  pts.push(`L${hx.toFixed(2)} ${traceY(hx).toFixed(2)}`);
  return pts.join(" ");
};

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.44;
export const CX_OPEN = 477;
export const K_WIDE = 1.12;
export const K_END = 1.14;
/** Where the reader sits on screen in the open. The content centre lands at
 *  960 - CAM_LIFT = 835, so the reader is READER_SCREEN_OPEN - 835 off it. */
export const READER_SCREEN_OPEN = 780;
export const MOVE_F0 = 37;
export const MOVE_F1 = 65;
export const MOVE_WARP = 0.7;
export const CREEP_F0 = MOVE_F1;
export const CREEP_F1 = DURATION + 2;
/** The wide's content centre at the landing, relative to where the open's
 *  tracking would have carried it — 0 keeps the content's travel one-signed
 *  (always down, toward the metric) through the whole cut, so the camera never
 *  stops and turns back at the landing. */
export const WIDE_DC = -8;
/** The wide's drift toward the metric, world px/f — the creep, under the k lobe. */
export const WIDE_V = 0.65;

/** The open's tracking: a straight-line fit of the reader's world y over the
 *  open, so the camera follows the constant descent and not the scroll's
 *  once-a-word ripple. */
const OPEN_FIT = (() => {
  const off = (READER_SCREEN_OPEN - (FRAME_H / 2 - CAM_LIFT)) / K_OPEN;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  let n = 0;
  for (let f = 0; f <= MOVE_F0; f++) {
    const y = readerWorldY(f) - off;
    sx += f;
    sy += y;
    sxx += f * f;
    sxy += f * y;
    n++;
  }
  const v = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { c0: (sy - v * sx) / n, v };
})();
const cOpen = (f: number) => OPEN_FIT.c0 + OPEN_FIT.v * f;
export const WIDE_C = cOpen(MOVE_F1) + WIDE_DC;
const cWide = (f: number) => WIDE_C + WIDE_V * (f - MOVE_F1);
const moveE = (f: number) => camEase((f - MOVE_F0) / (MOVE_F1 - MOVE_F0), MOVE_WARP);

export const K_TRACK = kTrack(
  [
    { f0: 0, f1: MOVE_F0, k0: K_OPEN, k1: K_OPEN, warp: 1 },
    { f0: MOVE_F0, f1: MOVE_F1, k0: K_OPEN, k1: K_WIDE, warp: MOVE_WARP },
    { f0: CREEP_F0, f1: CREEP_F1, k0: K_WIDE, k1: K_END, warp: 1 },
  ],
  DURATION + 2,
);

export const CAM = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: (f) => CX_OPEN + (BLOCK_CX - CX_OPEN) * moveE(f),
  cy: (f) => {
    const e = moveE(f);
    return cOpen(f) * (1 - e) + cWide(f) * e;
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

const AlignmentMetricsO55: React.FC<Props> = ({
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
  const exitAt = makeExit(cy, k);
  const scroll = scrollAt(frame);
  const head = caretAt(frame);
  const readerY = readerWorldY(frame);
  const penX = traceHeadX(frame);

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
            {/* THE PAGE — scrolls with the writing */}
            <g>
              <WordBars
                column={COLUMN}
                clock={CLOCK}
                frame={frame}
                scroll={scroll}
                accent={accent}
                exitAt={exitAt}
                wipeAt={typingMask}
              />
              {FLAGS.map((fl, j) => {
                const u = bracketU(fl.found, frame);
                const wy = COLUMN.lineY(fl.line) - scroll;
                const ex = exitAt(wy + WORD_H / 2);
                return (
                  <g key={`fl${j}`}>
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
                      k={k}
                    />
                  </g>
                );
              })}
              <ReaderLine yWorld={readerY} stroke={STROKE} ink={ink} k={k} />
              <Caret x={head.x + COL_X0} y={head.y - scroll} accent={accent} />
            </g>

            {/* THE METRIC — our instrument, fixed in the world, never scrolls */}
            <g style={{ filter: iconShadow(k) }}>
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
                d={tracePath(frame)}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={INK_HI}
              />
              <circle cx={penX} cy={traceY(penX)} r={PEN_R} fill={ink} opacity={INK_HI} />
            </g>
          </svg>

          <ReaderPerson x={COL_X0 + COL_W + PERSON_DX} y={readerY} k={k} />
          <Label
            k={k}
            x={LABEL_X}
            y={LABEL_Y}
            text="ALIGNMENT METRIC"
            f0={LABEL_F0}
            frame={frame}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default AlignmentMetricsO55;
