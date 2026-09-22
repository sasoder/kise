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
  Caret,
  FPS as CLIP_FPS,
  Flag,
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
  bracketU,
  buildCamera,
  flagBox,
  foundByReader,
  kTrack,
  makeClock,
  makeColumn,
  makeExit,
  readerAt,
  strokeFor,
} from "./punishShared";

export const FPS = CLIP_FPS;

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs` cut 2 — BADTHOUGHTS, in at 0:11.419.
//
//   "But if you look at that chain of thought and say, 'oh, the model is
//    thinking bad thoughts'"
//
// Orange Dwarkesh with the grid background. Every constant, helper and
// component is `punishShared`'s — nothing in this file is a copy of one.
//
// DURATION = round(3.020 * 24) + 16 = 72 + 16 = 88.
// Onsets, frames from this cut's own t0:
//   but-if 0 · you 10 · look 14 · at 20 · that 23 · chain 25 · of 29 ·
//   THOUGHT 31 · and 35 · say-oh 37 · the 45 · model 46 · is 51 ·
//   thinking 54 · BAD 59 · THOUGHTS 64 · speech ends 72 · tail to 88.
//
// EDITORIAL. Straight after this cut the editor is on the speaker saying "and
// we should punish it for thinking those bad thoughts". So the cut ENDS ON THE
// FINDING, held close, mid-mechanism: the bracket and its skull large in the
// frame, the reader already past them and still going, the column still
// sliding up under a caret that left the bottom of frame forty frames ago.
// Nothing lands on f72 and nothing stops; it hands over.
//
// ---------------------------------------------------------------------------
// WHAT HAPPENS. One find. We LOOK — the camera leaves the wide page and pushes
// onto the white reader line, then rides down the column with it — the reader
// crosses line 9, a bracket shuts round its first three words and an orange
// skull draws in the left margin, and the camera is the magnifier on that for
// the rest of the cut. The reader never stops: it carries on down out under
// the bracket while we are still looking at it.
//
// GESTURES — each one with the word it serves, and nothing else in the file.
//
//  1. THE PAGE BEING WRITTEN    f0-8    "but if you" (0/10)
//     No camera move to speak of — k 1.05 -> 1.07 and 2% of the push — so the
//     motion is the world's own: the caret creeping along line 13 at 3.5 world
//     px/f, the reader descending 3.2 px/f, the page inching up under them.
//     Establishes the three things the cut needs: a page of the model's
//     thought that ENDS in shot, a white line reading it with a person beside
//     it, and the caret still going at the bottom.
//  2. THE LOOK                  f2-28 authored, LANDS f31 (90% by f28)
//     "look at that chain of THOUGHT" (14/20/23/25/29/31)
//     One push and the only one: k 1.05 -> 1.75, plain smoothstep, cx 540 ->
//     520, and the content centre glides off its fixed world point onto the
//     reader and then TRACKS it. The reader is at screen 700 at f0 and at 700
//     when the push lands, so this is a pure magnification of the thing we are
//     already watching: the frame goes from the whole block to the text alone
//     and the person leaves the right edge inside the move, wholly gone by
//     f27 — four frames before the landing.
//  3. THE RIDE DOWN             f28-32  "and" (35)
//     A tracking hold, not a parked one: the camera keeps the reader at screen
//     700, k creeping 1.75 -> 1.78, while the reader keeps descending.
//  4. THE STEP IN               f32-54 authored, LANDS f57
//     "say oh the model is THINKING" (37/45/46/51/54)
//     The second and last camera move, begun on "say, oh" as anticipation and
//     settled two frames before "bad": k 1.78 -> 1.88, cx 520 -> 372, so the
//     LEFT margin — where the skull is about to be — comes into the frame. The
//     content centre stops tracking the reader and settles on line 9. The
//     magnifier arrives before the thing it magnifies.
//  5. THE FIND                  f56-62 bracket, f56-66 skull   "BAD THOUGHTS"
//     (59/64)
//     Caused by the reader and by nothing else: `foundByReader` puts the
//     reader's own y across line 9's centre at f56.000, the bracket draws from
//     its left end over 6 frames and the orange skull draws in the left margin
//     over 10, so it is still arriving as "thoughts" lands.
//  6. THE HAND-OVER             f57-88  "thoughts" + tail
//     k creeps 1.88 -> 1.95 (0.13%/f) while the camera keeps the flagged line
//     at screen 790. The reader goes on down at its constant rate, 1.8 lines
//     below the bracket on the last frame and still moving, and the caret is
//     still writing the word it is on when the editor cuts.
//
// There is no seventh gesture. No bar-height change anywhere in this cut: the
// clip's one variable belongs to the lines that say "hide" and "not
// observable", and this one only says LOOK.
//
// ---------------------------------------------------------------------------
// THE WORLD AT f0. `makeColumn(11, 64, LINE0)` — the clip's one page, seed 11,
// 64 lines — with 13 lines already written, the caret writing line 13 and the
// writing line held at HOLD_Y 1050 by the scroll. The reader is at line 5.812
// with the person beside it, descending at the clip constant READER_LPF = 0.06
// lines a frame.
//
// WHY THE PAGE IS SHORT AND THE MODEL IS SLOW — THE CAPTION BAND.
// At the closest k the frame covers 1920/1.95 = 984 world px, the flagged line
// sits at screen 790, and the captions own everything below 1400. That leaves
// (1400 - 790) / 1.95 = 313 world px — under five lines — for everything under
// the flag. So:
//   * `preLines 13` puts the page's last line 4.05 lines below the flag, and
//   * `WRITE_RATE 1/28` is the fastest rate that keeps the caret ON that last
//     line for all 88 frames (4 words would carry it to line 14 and 176 px
//     further down; 1/23 fits vertically but runs the caret off the RIGHT edge
//     from f79, because cx is panned to 372 for the skull).
// The cut therefore writes 3.14 words, the caret creeping along one line,
// which is the model still thinking while we read it. A faster rate is what
// put orange bars at screen y 1920 in the first build: at 1/2.6 the page grows
// 5.2 lines under a camera that is locked to the flag, and every one of them
// lands under the captions.
//
// DEVIATIONS FROM THE CUT BRIEF, each forced and each measured:
//  * preLines 26 -> 13, writing rate 1/2.6 -> 1/28 — the caption-band solve
//    above. 13 also lands the brief's own opening exactly: reader 700, caret
//    1200, page top 290.
//  * The camera ladder 1.05/1.55/1.85 on BLOCK_CX -> 1.05 WIDE / 1.75 CLOSE /
//    1.88 with a creep to 1.95, on the text axis then panned to 372. The block
//    is 812.3 world px wide, so 1.55 and 1.85 both sit in the dead band where
//    the person's ink straddles the frame edge; the camera comment below
//    states the rule in full.
//  * The look lands f31 (90% at f28) rather than f27, and the step in is
//    authored f32-54 rather than f46-62 — a 1.67x push cannot land sooner
//    under the |dv| cap, and the step in has to be settled BEFORE the bracket
//    draws at f56 so the skull's margin is already in frame.
//  * The reader is tracked at screen 700, not 760: at 760 the page's last line
//    reached screen 1428 during the push.
//
// ---------------------------------------------------------------------------
// MEASURED (`$S/BadThoughts/measure.ts`, printed into this comment).
//   Caption    LOWEST DRAWN INK OVER ALL 89 FRAMES: 1369 screen px, at f88
//   band       (profile f0 1224 / f14 1277 / f28 1368 / f40 1319 / f56 1332 /
//              f72 1353 / f88 1369). Nothing is ever drawn below 1400. The
//              caret is WHOLLY inside the frame, in x and in y, on every
//              frame; its rightmost ink is 992, 88 px inside the right edge.
//   Camera     THE STRICT TEST — the max |dv| over EVERY world point inside
//              the frame on every one of the 89 frames (the box x 216..647,
//              y 338..1303, at its corners, edges and centre, which is where a
//              zoom's acceleration is worst) is 2.228 screen px/f^2 against
//              the cap of 2.5, and the max |v| of the same set is 19.22
//              against 45. max |dk| 0.0368, max |d2k| 0.0036.
//              k 1.050 / 1.094 (f8) / 1.684 (f28) / 1.781 (f38) / 1.873 (f56)
//              / 1.907 (f72) / 1.953 (f88); cx 540 / 514.8 (f38) / 384.4 (f56)
//              / 370.1 (f88). Landings: the look 90% at f28 and 96% at f31;
//              the step in 96% at f57.
//   Framing    reader screen y 700 (f0) -> 700 (f36, held) -> 1086 (f88); the
//              reader LINE is inside the frame on all 89 frames and runs off
//              the right edge from f31. The person straddles the right edge
//              only over f17-26, inside the push, is wholly past 1080 from f27
//              and never returns. Flagged line screen y 779-793 from f56 on
//              (assert 775..795), its phrase centred at screen x 577-592.
//              Skull outer ink never nearer the frame edge than 70.7 px.
//              The person glyph's INK is centred on the reader line to within
//              0.5 px — measured off the rendered frames, not assumed.
//   The find   foundByReader(line 9) = 56.000 (the module throws unless it is
//              56 +- 0.5); bracket u = 1 at f62, skull u = 1 at f66.
//   Rates      reader 0.06 lines/f flat to 1e-9 and never capped — the head is
//              2.69 to 7.19 lines ahead throughout. Scroll 0.71 px/f mean,
//              max |dv| 0.10. Head line 13.000 -> 13.786, 3.14 words written,
//              the caret never leaving line 13. Scroll, headLine and
//              readerLine all assert non-decreasing; no drawn word narrows on
//              any frame.
//   Energy     min per-frame energy 50.6 screen px at f88 — the sum of |delta|
//              over every drawn bar's x/y/width/height plus the caret, the
//              reader and the bracket. Nothing is ever still.
// ---------------------------------------------------------------------------

export const DURATION = 88;

/** The per-icon shadow is NOT a prop of this cut: `Bracket`, `SkullMark`,
 *  `ReaderLine` and `ReaderPerson` take `k` and wear `iconShadow(k)`
 *  themselves, which is the module's rule, so a prop here would be inert. */
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
    look: z.number(),
    thought: z.number(),
    sayOh: z.number(),
    thinking: z.number(),
    bad: z.number(),
    thoughts: z.number(),
    cut: z.number(),
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
  beats: { look: 14, thought: 31, sayOh: 37, thinking: 54, bad: 59, thoughts: 64, cut: 72 },
});

// ---------------------------------------------------------------------------
// THE PAGE. The clip's one column, at the clip's one seed. LINE0 is where line
// 0's top sits in world y before the scroll; it cancels out of every drawn
// coordinate (a drawn y is `lineY(i) - scroll` and the scroll is
// `lineYf(head) - HOLD_Y`), so it is set to HOLD_Y and does nothing but keep
// the scroll positive from the first frame.
// ---------------------------------------------------------------------------
export const HOLD_Y = 1050;
const LINE0 = HOLD_Y;
export const COLUMN = makeColumn(11, 64, LINE0);

/** 13 lines already written when we arrive: the page ENDS three and a bit
 *  lines below the flagged line, which is what keeps every drawn thing above
 *  the caption band at the closest k. See the note above. */
export const PRE_LINES = 13;
/** Words a frame. Steady — this cut's model has noticed nothing — and SLOW,
 *  because the page's last line is the bottom of the picture: see the note
 *  above. Over the 88 frames the caret writes 3.14 words and never
 *  leaves line 13, so the lowest ink in the cut tops out at 1369 screen px
 *  and the caret's own box stays 87 px inside the right edge at the closest
 *  k. 1/23 was tried first and put the caret off the right edge from f79. */
export const WRITE_RATE = 1 / 28;
export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => WRITE_RATE,
});
export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

// ---------------------------------------------------------------------------
// US, READING. `READER_LPF` is a CLIP constant, not this cut's: the reader
// travels at 0.06 lines per frame in all eight cuts, which is what makes the
// eight of them one page read once.
// ---------------------------------------------------------------------------
export const READER_LPF = 0.06;
export const FLAG_LINE = 9;
/** f56 is `found` by construction, and `found` is the frame the reader's own y
 *  crosses the line's CENTRE — not its top — so the start line is solved
 *  against `lineYf`'s own slope over line 9 rather than assumed. */
const LINE9_PITCH = COLUMN.lineY(FLAG_LINE + 1) - COLUMN.lineY(FLAG_LINE);
export const FOUND_TARGET = 56;
export const READER_LINE0 =
  FLAG_LINE + WORD_H / 2 / LINE9_PITCH - FOUND_TARGET * READER_LPF;

export const readerLine = (f: number) =>
  readerAt({
    f,
    f0: 0,
    line0: READER_LINE0,
    linesPerFrame: READER_LPF,
    // it cannot overtake the writing head. It never comes near it here — the
    // head is twelve lines ahead at f0 and seventeen by the end — but the cap
    // is the module's rule and it costs nothing.
    capLine: CLOCK.headLine,
  });
/** The reader line's own world y: the centre of the line it is crossing. */
export const readerY = (f: number) => COLUMN.lineYf(readerLine(f)) - scrollAt(f) + WORD_H / 2;
/** The flagged line's world y, which the camera settles on. */
export const flagY = (f: number) => COLUMN.lineY(FLAG_LINE) - scrollAt(f) + WORD_H / 2;

export const FOUND = foundByReader(COLUMN, FLAG_LINE, readerLine, 0, DURATION);
if (Math.abs(FOUND - FOUND_TARGET) > 0.5) {
  throw new Error(`BadThoughts: the reader crosses line ${FLAG_LINE} at ${FOUND}, not ${FOUND_TARGET}`);
}
export const FLAG: Flag = { line: FLAG_LINE, k0: 0, k1: 2, found: FOUND };
/** The skull takes ten frames rather than the bracket's six, so it is still
 *  drawing on as "thoughts" (64) lands. Same start, same cause. */
export const SKULL_F = 10;
export const skullU = (f: number) => clamp01((f - FOUND) / SKULL_F);

// ---------------------------------------------------------------------------
// THE CAMERA. Two moves, and the clip's framing rule decides both of their
// sizes. WITH THE PERSON IN THE RIGHT MARGIN THE BLOCK IS 812.3 WORLD PX
// (BLOCK_L 133.85 to BLOCK_R 946.15), so a camera on BLOCK_CX can hold all of
// it only up to k = 1080/812.3 = 1.329. There are therefore exactly two legal
// framings in this clip, and a camera may only be between them while it is
// MOVING:
//   WIDE   k <= 1.30 on BLOCK_CX, the whole block in frame, the person in.
//   CLOSE  k >= 1.75 on the TEXT axis, the person's ink WHOLLY past the right
//          edge and the reader line running off it.
// This cut opens WIDE at k 1.05, the LOOK lands CLOSE at 1.75, and the step in
// on the flag goes 1.78 -> 1.88 with a creep to 1.92. The person straddles the
// edge only between f13 and f31, which is inside the push, and is wholly out
// from the frame the push lands on.
//
// `kTrack` writes the zoom a key per frame, `buildCamera` damps zoom, cx and
// cy together and adds `CAM_LIFT / k` itself.
//
// BOTH MOVES ARE AUTHORED TO FINISH EARLY, because the damper lags: the look
// is written f4-30 and the damped k is 96% of the way there at f31, the step
// in is written f34-54 and lands at f58. Authored to end on their landing
// frames they came in five or six frames late. The look is long on purpose —
// 1.05 -> 1.75 is a 1.67x push, and a shorter window takes the frame's own
// corners past the |dv| cap.
//
// The cx track is a two-stage pan on the same two eases: 540 (block centre)
// -> 520 (the text axis, which is what lets the person leave cleanly) -> 372.
// 372 is solved: it is the furthest left the camera can sit and still keep the
// flagged phrase near the middle, and the nearest right that leaves the
// skull's outer ink 74 screen px inside the frame at the closest k.
//
// The two content-centre offsets are SOLVED, not guessed. A damped tracker
// following a ramp of slope s sits a constant s*CAM_DAMP/CAM_STIFF behind it,
// and both of these targets are ramps (the column scrolls), so the offsets
// were run through the built camera and corrected until the MEASURED screen y
// of the reader at f36 is 760 and of the flagged line at f70 is 790.
// ---------------------------------------------------------------------------
const A0 = 2;
const A1 = 28;
const B0 = 32;
const B1 = 54;
export const K_OPEN = 1.05;
export const K_LOOK = 1.75;
export const K_CLOSE = 1.88;
/** THE ONE STROKE WEIGHT, fixed at the k this cut spends 58 of its 88 frames
 *  at and all of its payoff at, so a bracket here is the same 6.5 screen px as
 *  a bracket in every other cut. */
export const K_REST = K_LOOK;
export const STROKE = strokeFor(K_REST);

const CX_WIDE = 540;
const CX_LOOK = 520;
const CX_CLOSE = 372;
/** The reader's screen y at f0, and the world offsets that hold the reader at
 *  760 and then the flagged line at 790 (solved, see above). */
const READER_SCREEN_0 = 700;
const READER_OFF = 84.6193;
const FLAG_OFF = 23.2644;

const K_SEGS = [
  { f0: 0, f1: A0, k0: K_OPEN, k1: 1.07, warp: 1 },
  { f0: A0, f1: A1, k0: 1.07, k1: K_LOOK, warp: 1 },
  { f0: A1, f1: B0, k0: K_LOOK, k1: 1.78, warp: 1 },
  { f0: B0, f1: B1, k0: 1.78, k1: K_CLOSE, warp: 1 },
  { f0: B1, f1: DURATION + 2, k0: K_CLOSE, k1: 1.96, warp: 1 },
];
const K_TRACK = kTrack(K_SEGS, DURATION + 2);

/** The world point the camera holds until the push starts, solved so the
 *  reader opens at screen 700 and the caret — the bottom of the page — at
 *  1200, clear of the caption band. The push then KEEPS the reader at 700, so
 *  the look is a pure magnification of the thing we are already watching. */
const C_OPEN = readerY(0) - (READER_SCREEN_0 - 835) / K_OPEN;

const uLook = (f: number) => camEase(clamp01((f - A0) / (A1 - A0)), 1);
const uStep = (f: number) => camEase(clamp01((f - B0) / (B1 - B0)), 1);

const contentY = (f: number) => {
  const onReader = C_OPEN + (readerY(f) + READER_OFF - C_OPEN) * uLook(f);
  const s = uStep(f);
  return onReader * (1 - s) + (flagY(f) + FLAG_OFF) * s;
};
const contentX = (f: number) => {
  const onText = CX_WIDE + (CX_LOOK - CX_WIDE) * uLook(f);
  const s = uStep(f);
  return onText * (1 - s) + CX_CLOSE * s;
};

export const CAM = buildCamera({ duration: DURATION, K: K_TRACK, cx: contentX, cy: contentY });
export const CAM_AT = CAM.CAM_AT;
export const SCREEN_AT = CAM.SCREEN_AT;

// ---------------------------------------------------------------------------
const BadThoughts: React.FC<Props> = ({
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

  const scroll = scrollAt(frame);
  const head = CLOCK.headAt(frame);
  const exitAt = makeExit(cy, k);

  const flagWy = COLUMN.lineY(FLAG_LINE) - scroll;
  const flagExit = exitAt(flagWy + WORD_H / 2);
  const u = bracketU(FOUND, frame);
  const rY = readerY(frame);

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
            {/* the chain of thought: every word the model has written, all of
                it readable — this cut changes no bar's height. */}
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              exitAt={exitAt}
              opacity={dotOpacity}
            />

            {/* what the reader found, and what the phrase was for */}
            <Bracket
              column={COLUMN}
              flag={FLAG}
              u={u}
              stroke={STROKE}
              ink={ink}
              opacity={INK_LO}
              scroll={scroll}
              exit={flagExit}
              k={k}
            />
            <SkullMark
              x={COL_X0 - SKULL_DX}
              y={flagWy + WORD_H / 2}
              u={skullU(frame)}
              scale={flagExit}
              accent={accent}
              opacity={dotOpacity}
              k={k}
            />

            {/* us, reading */}
            <ReaderLine
              column={COLUMN}
              yWorld={rY}
              stroke={STROKE}
              ink={ink}
              opacity={INK_HI}
              k={k}
            />

            {/* the model, writing, well below the frame from f21 */}
            <Caret x={head.x + COL_X0} y={head.y - scroll} accent={accent} opacity={dotOpacity} />
          </svg>

          {/* who is reading. DOM, beside the svg, inside the same camera. */}
          <ReaderPerson x={COL_X0 + COL_W + PERSON_DX} y={rY} k={k} opacity={INK_HI} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default BadThoughts;

export const STATS = {
  duration: DURATION,
  preLines: PRE_LINES,
  readerLine0: Number(READER_LINE0.toFixed(6)),
  found: Number(FOUND.toFixed(3)),
  flagBox: flagBox(COLUMN, FLAG),
  k: [0, 8, 25, 28, 38, 56, 59, 88].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};
