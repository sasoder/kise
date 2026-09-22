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
  smoothstep,
  worldTransform,
} from "./fieldShared";
import {
  COL_W,
  COL_X0,
  Caret,
  GRID_W0,
  HAIR_H,
  INK,
  INK_HI,
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

export { FPS } from "./punishShared";

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs`, CUT 6 — ControllingItsChain. In at 0:48.840.
//
//   "but, like, we're seeing that the model is becoming better able at
//    controlling its chain of thought."
//
// Onsets (frames from this cut's own t0): but 0 · like 1 · we're 5 · seeing 8 ·
// that 15 · the 26 · model 30 · is 34 · becoming 36 · better 41 · able 52 ·
// at 59 · controlling 63 · its 71 · chain 75 · of 79 · thought 81 ·
// speech ends 87 · tail to 103.  DURATION = round(3.620 * 24) + 16 = 103.
//
// THE IDEA — THE MODEL TAKES OVER THE PRESS. In cut 5 WE pressed its words
// down. Here it presses its own: a word is written at full height and then, on
// its own, with nothing white anywhere near it and the caret already gone,
// sinks. "Becoming BETTER ABLE" is the ladder of four presses: the first is
// late, slow and only gets halfway; each one after it starts sooner after its
// own word, runs quicker and lands lower; and by "controlling its chain of
// thought" the words it wants hidden come out of the caret ALREADY flat, in a
// clean repeating pattern — full, full, hair, full, hair, hair. No press
// animation is needed by then: the control is instant. The reader, still
// coming down behind, finds nothing to bracket. There are no brackets and no
// skulls in this cut; the picture is the caret and its own text.
//
// EVERYTHING in it is `punishShared`'s — the column, the word clock, the
// scroll, the reader, `WordBars`/`Caret`/`ReaderLine`/`ReaderPerson`, the exit
// thinning, `kTrack`/`buildCamera`. Nothing is restated and nothing was added
// to the shared module.
//
// ---------------------------------------------------------------------------
// GESTURES — every one of them, with the word it serves. There are no others.
//
//  1. THE CARET WRITES, f0-103, every frame          "we're SEEING (8)"
//     The model is fluent here, so the rate is flat: one word per 5.2 frames
//     from the first word of line 40. It is the only orange thing that moves
//     on its own, and it never stops — the tail is it still writing.
//
//  2. SELF-PRESS 1, f17.2-29.2, to HALF height       "THAT (15) … THE (26)"
//     Line 40's second word (gi 163, written f5.2-7.2) waits TEN frames and
//     then takes twelve to sink, and only to 11 px. It is not good at it yet.
//
//  3. SELF-PRESS 2, f23.6-31.6, to 6 px              "THE (26) … MODEL (30)"
//     Line 40's fourth word (gi 165, written f15.6-17.6) waits six frames and
//     takes eight. Sooner, quicker, lower — and it overlaps press 1, so the
//     two are one continuous sinking rather than two events.
//
//  4. SELF-PRESS 3, f32.0-37.0, to the hairline      "IS (34)"
//     Line 41's second word (gi 167, written f26-28) waits four frames and
//     takes five. Starts 2 f before "is", lands 1 f after "becoming" (36).
//
//  5. SELF-PRESS 4, f44.6-47.6, to the hairline      "BETTER (41) → ABLE (52)"
//     Line 41's fifth word (gi 170, written f41.6-43.6) waits ONE frame and
//     takes three. It is finished 4.4 frames before "able".
//
//  6. THE CONTROL PATTERN, from f52                  "ABLE (52) … THOUGHT (81)"
//     From line 42's first word (gi 172) every word comes out of the caret at
//     the height the mask `[1, 1, 0, 1, 0, 0]` gives it — 1 full, 0 hairline —
//     counted straight on from gi 172 and never re-animated. Emits: 52.0 F,
//     57.2 F, 62.4 H ("controlling" 63), 67.6 F, 72.8 H ("chain" 75),
//     78.0 H ("of" 79), 83.2 F, 88.4 F, 93.6 H, 98.8 F.
//
//  7. THE READER DESCENDS, f0-103, every frame       "WE'RE (5) SEEING (8)"
//     A flat READER_LPF = 0.06 lines per frame — the clip constant, the same
//     in all eight cuts — from line 36.5, with the person riding beside it in
//     the right margin. It crosses line 40, where the half-pressed word and
//     the 6 px word are, at f61, and leaves nothing behind: there is nothing
//     left to find.
//
// CAMERA — the clip-wide framing rule: WIDE (k <= 1.30, the whole block in
// frame, person in) or CLOSE (k >= 1.75 on the TEXT axis, person fully out on
// the right, reader line running off both edges). This cut opens WIDE and
// pushes to CLOSE; the person leaves DURING the push and is never parked
// half-visible. cx is the text axis `TEXT_CX` 532.15 the whole way — no pan.
//     A  f0-20   k 1.250 -> 1.272, content centre 806 -> 812.  WIDE. The creep
//                under "but like we're seeing that": 0.562 screen px/frame of
//                travel of a fixed world point, so the frame is never parked
//                while the first press runs. The person's ink reaches screen
//                x 1066.9 of 1080 — whole, with 13.1 px to spare.
//     B  f20-39  k 1.272 -> 1.750, centre 812 -> 855, warp 0.65.  THE ONE
//                PUSH, +40% on "the model is BECOMING (36) BETTER (41) ABLE
//                (52)". Authored to f39 because the damper lags: the damped
//                zoom is 91.1% of the move at f39, 97.7% at f43 and 99.7% at
//                f47, so it LANDS on f47 — five frames before "able" — and
//                settles under the word rather than arriving after it. The
//                person straddles the right edge for ten frames inside this
//                move and is fully out from the landing.
//     C  f39-105 k HELD at 1.750, centre 855 -> 878.  CLOSE. V2: THE HOLD
//                CREEPS IN POSITION, NOT IN ZOOM. V1 crept the zoom to 1.855
//                and that put the first bar of every unindented line 11.8
//                screen px from the left edge — the column was parked against
//                the frame. The zoom is now pinned at its landing (measured
//                max over the whole cut 1.7502, an 0.0002 damper settle) and
//                the creep is 23 world px of content centre, 0.578 screen
//                px/frame of travel, which walks the writing line from screen
//                1120 up to 1080 as the caret keeps writing.
//                THE ARITHMETIC OF THE CAP: the widest visible line's ink is
//                547.8 world px and its left edge sits 288 px from the text
//                axis, so the left margin is 540 - 291k screen px with the
//                sway at its worst — 30.8 px at k 1.75, 24.9 px at 1.77 and
//                11.8 px at 1.855. Measured over the delivered frames the
//                drawn ink lives between screen x 31.6 and 999.8.
//
// ---------------------------------------------------------------------------
// MEASURED (`$S/ControllingItsChain/measure.ts`, printed from the exports
// below — every number in this block is that script's output).
//
//   Camera        max |dv| of a fixed world point 1.480 screen px/f^2 (cap
//                 2.5), peak |v| 9.47 px/f. k 1.2500 at f0, 1.2687 at f20,
//                 1.7053 at f39, 1.7483 at f47, 1.7500 from f70 on; max over
//                 the whole cut 1.7502, so the zoom never passes 1.77.
//   Framing       the writing line — the TOP of the line the caret is on, which
//                 saws by one pitch per line because the scroll holds the
//                 FRACTIONAL head at HOLD_Y — runs screen y 1038.1 .. 1164.6,
//                 midpoint 1101.3 (asked: ~1080-1120). 7.59 to 8.72 pitches of
//                 column stand above it at the close. Reader line 846.7 ..
//                 973.4 (floor 200). Lowest ink, the caret's foot, 1224.1, so
//                 the 500 px caption band is clear on every frame. Drawn
//                 word-bar ink 31.6 .. 999.8 screen x — over 30 px clear of
//                 both edges on every frame. The reader line's end dots sit at
//                 screen x 3.7 and 1077.1 at their innermost against a radius
//                 of 12.25, so the LINE runs off both edges rather than
//                 stopping in frame. Person ink: 1066.9 at its rightmost while
//                 WIDE (in frame), 1099.7 at its leftmost from f47 (fully
//                 out), straddling on 10 frames, all inside the push.
//   Legibility    at K_REST 1.75 the four rungs of the one variable are 38.5 /
//                 19.3 / 10.5 / 5.3 screen px — full, half, six, hairline.
//   Presses       starts 17.20 / 23.60 / 32.00 / 44.60 (table 18 / 24 / 33 /
//                 43, all within +-2); end heights exactly 11 / 6 / 3 / 3
//                 world px; each word is at full height on the frame before
//                 its own press begins.
//   Clock         line 42's first EMIT 52.00 (band 50-54), line 43's 72.80
//                 (cap 78), line 44's 98.80. Lines 40/41/42/43/44 hold
//                 4/6/4/5/4 words.
//   Reader        gap to the writing head 3.500 -> 1.522 lines, never capped
//                 on any frame (the soft minimum's own corner starts biting at
//                 1.4). It crosses line 40's centre at f61.2.
//   Text          no drawn word shrinks in WORLD height or width on any of the
//                 103 frames except the four pressed words inside their own
//                 presses and lines thinning out through the top: 0
//                 violations.
//   Energy        min per-frame energy 158.3 screen px, at f50 (sum of |delta|
//                 over every drawn bar's width, height and y, the caret, the
//                 reader and the camera). Zero frames parked.
//   Heads         the person glyph, the only head in the cut, peaks at 3.47
//                 screen px/f. The caret peaks at 73.4 px/f between wraps —
//                 see the deviations.
//
// KNOWN DEVIATIONS FROM THE CUT BRIEF — five, each with its arithmetic. The
// first two are the director's own revision, which replaced this cut's
// original framing with the clip-wide WIDE/CLOSE rule.
//   * CAMERA. The brief asks for k 1.6 -> 1.95 -> 2.0 with the person beside
//     the reader. Those cannot both hold: the person's ink edge is 406.3 world
//     px from the block axis, so with the person in frame k cannot pass 1.33.
//     Under the clip-wide rule the cut opens WIDE at 1.25 with the person
//     whole and pushes to CLOSE, where the person is out and the axis moves to
//     the TEXT axis 532.15. The CLOSE zoom LANDS AT 1.75 AND IS HELD there
//     rather than reaching the 1.90/1.95 the revision names, because the
//     widest visible line is 547.8 world px of ink whose left edge is 288 px
//     from that axis: the left margin is 540 - 291k with the sway at its
//     worst, which is 30.8 px at 1.75 and 11.8 px at 1.855. The hold's creep
//     is therefore 23 world px of content centre instead of any zoom.
//   * FRAMING HEIGHT. The brief's content centre (HOLD_Y - 90 -> HOLD_Y - 30)
//     was solved at k 1.6. Re-solved for the revision's ask instead: the
//     writing line's saw is centred on screen 1081, which puts 7.0 to 8.4
//     pitches of column above it and leaves the 500 px caption band clear.
//   * WHICH WORDS ARE PRESSED. The brief's table presses line 40 k2 and k4.
//     `makeColumn(11, 64, LINE0)`'s line 40 has FOUR words, so k4 does not
//     exist. The pair is moved one word earlier, to k1 and k3 — the same
//     two-word spacing — and press 4 moves from line 41 k3 to k4, which is
//     what puts the four press STARTS (the thing the brief asserts) within
//     +-2 of 18 / 24 / 33 / 43 at a flat writing rate. The lag ladder is the
//     brief's, 10 / 6 / 4 / 1 (its k3 lag of 3 would have landed press 3 at
//     f31.0, exactly on the -2 bound).
//   * THE MASK'S INDEX. The brief counts the `[1, 1, 0, 1, 0, 0]` mask on the
//     word index WITHIN each line. This column's lines 42-44 hold 4, 5 and 4
//     words, so that degenerates to "the third word of every line" — three
//     hairlines in the whole cut and never the "hair, hair" run the brief
//     describes. The mask is counted continuously from gi 172 instead, which
//     produces the promised full-full-hair-full-hair-hair exactly once per six
//     words, four hairlines inside the cut, and puts the consecutive pair on
//     "chain" (75) and "of" (79).
//   * THE READER'S GAP. The brief asks for 2.4 lines behind the head at f0 and
//     2 to 3.5 lines on every frame. It cannot hold: the reader runs at the
//     clip constant 0.06 lines/frame and the head, writing 4-to-6-word lines
//     at 5.2 frames a word, averages 0.0408 — so the reader closes 1.98 lines
//     over the 103. Starting at the band's top, 3.5, is the widest the cut can
//     be and ends at 1.522, which is the only choice that also keeps the soft
//     cap off on every frame (it starts biting at 1.4). Starting at the
//     brief's 2.4 ends at 0.42 and the reader is capped for the last third.
//   * THE CARET'S SPEED. COMMON caps a head at 45 screen px/f. The only head
//     in the cut, the reader's person glyph, peaks at 3.47. The CARET peaks at
//     74.8 px/f between line wraps, because it crosses a word and the 18 px
//     inter-word gap in one frame at this word rate: 138 / 5.2 + 18 = 44.5
//     world px at k 1.75. It is text being typed rather than a subject
//     moving, the reference cut V5 wrote 3.7x faster than this, and the only
//     way down is a slower clock, which the brief's own press table and its
//     50-54 window for line 42 fix. (73.4 px/f at V2's k.) The four line WRAPS are one-frame jumps of
//     a line's width, which is what a caret does and what V5 shipped.
// ---------------------------------------------------------------------------

export const DURATION = 103;

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
    seeing: z.number(),
    that: z.number(),
    the: z.number(),
    is: z.number(),
    becoming: z.number(),
    better: z.number(),
    able: z.number(),
    controlling: z.number(),
    chain: z.number(),
    thought: z.number(),
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
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    seeing: 8,
    that: 15,
    the: 26,
    is: 34,
    becoming: 36,
    better: 41,
    able: 52,
    controlling: 63,
    chain: 75,
    thought: 81,
    ends: 87,
  },
});

// ---------------------------------------------------------------------------
// THE PAGE. The same 64 lines every cut of this clip is written on — seed 11,
// `LINE0` the world y of line 0 — seen at the moment forty of them exist.
// ---------------------------------------------------------------------------
export const LINE0 = 600;
export const COLUMN = makeColumn(11, 64, LINE0);
/** Lines 0..39 are already written when we arrive; the caret is at the start
 *  of line 40. */
export const PRE_LINES = 40;
/** The writing line's world y. The column scrolls to keep it here. */
export const HOLD_Y = 1050;

/** FRAMES PER WORD. Flat: this is the fluent model, and the argument of the
 *  cut is in the heights, not in the rate. Solved so that line 42's first word
 *  emits at 52.0 (the brief's 50-54 window, "able") and line 43's at 72.8 (its
 *  cap is 78, "chain" is 75), and so that the four presses start within +-2 of
 *  18 / 24 / 33 / 43 on the brief's own lag ladder. */
export const SPF = 5.2;
export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => 1 / SPF,
});
export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

// ---------------------------------------------------------------------------
// THE SELF-PRESSES. The model acting on its own text, so the honest mechanism
// is the word's OWN timer: `lag` frames after it finished being written, it
// starts sinking, and takes `dur` frames to reach `to` (1 = WORD_H, and
// HAIR_H / WORD_H is the hairline). Nothing white is anywhere near it and the
// caret is already two or three words further on.
// ---------------------------------------------------------------------------
type Press = { gi: number; lag: number; dur: number; to: number; where: string };

const PRESS_SPEC: Press[] = [
  { gi: 163, lag: 10, dur: 12, to: 11 / WORD_H, where: "line 40 k1" },
  { gi: 165, lag: 6, dur: 8, to: 6 / WORD_H, where: "line 40 k3" },
  { gi: 167, lag: 4, dur: 5, to: HAIR_H / WORD_H, where: "line 41 k1" },
  { gi: 170, lag: 1, dur: 3, to: HAIR_H / WORD_H, where: "line 41 k4" },
];

export const PRESSES = PRESS_SPEC.map((p) => ({ ...p, start: CLOCK.doneAt(p.gi) + p.lag }));

/** THE CONTROL PATTERN. From line 42's first word on, a word is born at the
 *  height this mask gives it and never moves again: 1 = WORD_H, 0 = HAIR_H.
 *  Counted straight on from `CTRL_GI0` rather than restarting per line, so the
 *  full-full-hair-full-hair-hair figure actually appears. */
export const CTRL_GI0 = COLUMN.LINES[42].words[0].gi;
export const CTRL_MASK = [1, 1, 0, 1, 0, 0];

/** OBSERVABILITY. The clip's one variable, and the only thing this cut
 *  animates besides the caret, the reader and the camera. */
export const hAt = (gi: number, f: number) => {
  if (gi >= CTRL_GI0) {
    return CTRL_MASK[(gi - CTRL_GI0) % CTRL_MASK.length] === 1 ? 1 : HAIR_H / WORD_H;
  }
  for (let i = 0; i < PRESSES.length; i++) {
    const p = PRESSES[i];
    if (p.gi === gi) return 1 + (p.to - 1) * smoothstep((f - p.start) / p.dur);
  }
  return 1;
};

// ---------------------------------------------------------------------------
// THE READER. Constant rate, softly capped at the writing head — and in this
// cut the cap never engages, which is asserted.
// ---------------------------------------------------------------------------
/** lines per frame — the clip constant, the same in every one of the eight
 *  cuts. */
export const READER_LPF = 0.06;
/** 3.5 lines above the head at f0: the top of the brief's band, which is what
 *  leaves the most room for the reader to close over 103 frames. */
export const READER_LINE0 = 36.5;

export const readerLine = (f: number) =>
  readerAt({
    f,
    f0: 0,
    line0: READER_LINE0,
    linesPerFrame: READER_LPF,
    capLine: CLOCK.headLine,
  });
export const readerRaw = (f: number) => READER_LINE0 + f * READER_LPF;

// ---------------------------------------------------------------------------
// THE CAMERA. cx never moves off the clip's axis; the zoom and the content
// centre are two `kTrack`s on the same three segments, so they land together.
// ---------------------------------------------------------------------------
export const K_TRACK = kTrack(
  [
    { f0: 0, f1: 20, k0: 1.25, k1: 1.272, warp: 1 },
    { f0: 20, f1: 39, k0: 1.272, k1: 1.75, warp: 0.65 },
    { f0: 39, f1: DURATION + 2, k0: 1.75, k1: 1.75, warp: 1 },
  ],
  DURATION + 2,
);
export const C_TRACK = kTrack(
  [
    { f0: 0, f1: 20, k0: 806, k1: 812, warp: 1 },
    { f0: 20, f1: 39, k0: 812, k1: 855, warp: 0.65 },
    { f0: 39, f1: DURATION + 2, k0: 855, k1: 878, warp: 1 },
  ],
  DURATION + 2,
);
/** The resolved zoom: where the cut sits for two thirds of its length. One
 *  stroke weight for the whole clip is fixed off it. */
export const K_REST = 1.75;
export const STROKE = strokeFor(K_REST);

/** THE CLOSE FRAMING'S AXIS. Wide, the camera sits on the clip's block axis
 *  `BLOCK_CX` 540; close, it sits on the TEXT axis, which is the clip-wide
 *  framing rule. Both are inside the sway's own amplitude of each other for
 *  the first twenty frames, so the cut simply uses the text axis throughout
 *  and never pans: 532.15 against 540 is 8 world px, 10 screen px at the
 *  open, and the block still clears both edges there. */
export const TEXT_CX = COL_X0 + COL_W / 2;

export const CAM = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: () => TEXT_CX,
  cy: (f) => C_TRACK[Math.max(0, Math.min(C_TRACK.length - 1, Math.round(f)))],
});
export const CAM_AT = CAM.CAM_AT;
export const SCREEN_AT = CAM.SCREEN_AT;

export const PERSON_X = COL_X0 + COL_W + PERSON_DX;

// ---------------------------------------------------------------------------
const ControllingItsChain: React.FC<Props> = ({
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
  const head = CLOCK.headAt(frame);
  const readerY = COLUMN.lineYf(readerLine(frame)) - scroll;
  const exitAt = makeExit(cy, k);

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
            {/* the chain of thought: height is observability */}
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              hAt={hAt}
              exitAt={exitAt}
              mode="hair"
              opacity={dotOpacity}
            />

            {/* us, reading — and finding nothing to bracket */}
            <ReaderLine
              yWorld={readerY}
              stroke={STROKE}
              ink={ink}
              opacity={INK_HI}
              k={k}
            />

            {/* the model writing */}
            <Caret
              x={head.x + COL_X0}
              y={head.y - scroll}
              accent={accent}
              opacity={dotOpacity}
            />
          </svg>

          {/* who is reading. DOM, never an SVG <image>. */}
          <ReaderPerson
            x={PERSON_X}
            y={readerY}
            k={k}
            opacity={INK_HI}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ControllingItsChain;

export const STATS = {
  duration: DURATION,
  lines: COLUMN.N_LINES,
  words: COLUMN.WORDS.length,
  presses: PRESSES.map((p) => ({
    where: p.where,
    gi: p.gi,
    emit: Number(CLOCK.EMIT[p.gi].toFixed(2)),
    start: Number(p.start.toFixed(2)),
    end: Number((p.start + p.dur).toFixed(2)),
    toPx: Number((p.to * WORD_H).toFixed(2)),
  })),
  firstEmits: [40, 41, 42, 43, 44].map((i) => [
    i,
    Number(CLOCK.EMIT[COLUMN.LINES[i].words[0].gi].toFixed(2)),
  ]),
  k: [0, 22, 42, 50, 56, 87, 103].map((f) => [f, Number(CAM_AT(f).k.toFixed(4))]),
};
