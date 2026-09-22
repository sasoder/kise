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
  worldTransform,
} from "./fieldShared";
import {
  BLOCK_CX,
  Bracket,
  COL_W,
  COL_X0,
  Caret,
  FPS,
  GAP,
  GRID_W0,
  INK,
  INK_HI,
  PERSON_DX,
  ReaderLine,
  ReaderPerson,
  SKULL_BOX,
  SKULL_DX,
  SKULL_STROKE,
  SkullMark,
  WORD_H,
  WordBars,
  buildCamera,
  flagBox,
  foundByReader,
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
// Noam, clip `Noam_Punishing_AIs`, cut 2 of 8, `BadThoughts` — O55 rebuild.
// In 0:11.419:
//   "But if you look at that chain of thought and say, 'oh, the model is
//    thinking bad thoughts'"
//
// DURATION = round(3.020 * 24) + 16 = 72 + 16 = 88.
// Onsets (frame = round((t - 11.419) * 24)):
//   but-if 0 · you 10 · LOOK 14 · at 20 · that 23 · CHAIN 25 · of 29 ·
//   THOUGHT 31 · and 35 · say-oh 37 · the 45 · MODEL 46 · is 51 ·
//   THINKING 54 · BAD 59 · THOUGHTS 64 · speech ends 72 · tail to 88.
// EDITORIAL: the editor cuts to the speaker for "and we should punish it for
// thinking those bad thoughts", so the cut ENDS ON THE FINDING, held close,
// mid-mechanism: the reader still descending, the page still sliding up, the
// caret still writing. Nothing lands on f72 or f88.
//
// THE IDEA. We LOOK — the camera pushes in on the reader and rides down the
// page with it — the reader crosses a phrase and FINDS a bad thought (the
// bracket closes round it, the orange skull draws in the margin), and the
// camera becomes the magnifier on it as the words land. One find. The reader
// never stops; the model never stops writing.
//
// ---------------------------------------------------------------------------
// THE PAGE, SOLVED. The camera's last framing fixes the page, not the first.
// In the SKULL+TEXT framing the flagged line (9) sits at screen y ~800 at
// k 1.48, so the writing line can be no lower than line 14 (line 14's centre
// then lands at 1330, the caption rule's floor; line 15 would be 1426). And the
// writing line can never leave the frame downward — the page ENDS on it, so
// wherever it is, it is the lowest ink on screen. So the caret must still be on
// line 14 at f90: PRE_LINES 11 (the caret starts line 11, a new paragraph) and
// WRITE_RATE 1/6 word a frame, which writes lines 11-13 and 3 words of 14 by
// f88 (15 words, the fourth of line 14 never starts). A word every six frames,
// the caret gliding across it the whole time, the scroll 2.7 world px/f.
//
// THE READER. READER_LPF lines a frame from `READER_LINE0` (solved by bisection
// so `foundByReader` returns 56.00 exactly), softly capped by the writing head
// (the cap never engages: the gap is >= 3.6 lines on every frame).
//
// ---------------------------------------------------------------------------
// GESTURES — every one with its word.
//  1. f0-88   (all)           THE READER READS. The white line with its person
//                             descends at the clip's constant rate the whole
//                             cut. It carries every hold.
//  2. f0-88   (all)           THE MODEL WRITES. The caret glides across line
//                             11 -> 14, one word per 6 f; the scroll carries the
//                             page up with it.
//  3. f4-26   "you LOOK at    THE LOOK. One push, k 1.05 -> 1.265, warp 0.8,
//              that CHAIN"    content centre gliding from the page's middle to
//                             the reader (reader screen y 800 -> 762) and then
//                             riding down with it. Lands f26 (k within 5% of
//                             the move), before "thought" 31. The person stays
//                             in frame — who is looking.
//  4. f24-40  "of THOUGHT and TRACKING. The camera rides the reader's constant
//              say oh"        descent (world +1.2 px/f); the reader holds at
//                             screen y ~762 while the page slides up past it.
//  5. f36-58  "the MODEL is   THE FIND, camera half: the camera becomes the
//              thinking"      magnifier — cx glides 540 -> 445.7 (the skull +
//                             text ink centre) and k 1.265 -> 1.48, one plain
//                             smoothstep, the content centre handing over from
//                             the reader to line 9. The person slides off the
//                             right edge (fully out f52) and the reader line
//                             runs off the right (f54). Lands f58 (k and cx
//                             within 5%), before "bad" 59 and "thoughts" 64.
//                             Starts on "say oh" so it can be a 2.2 px/f^2
//                             move and still land early; a f48 start costs
//                             3.6.
//  6. f56-66  "THINKING BAD"  THE FIND, world half: the reader's line crosses
//                             line 9's centre at f56.00 (`foundByReader`); the
//                             bracket draws from its left end f56-62, the
//                             orange skull draws in the left margin f56-66 —
//                             starting WITH its bracket, outline then face.
//                             The bracket is INK_HI: it is this cut's subject.
//  7. f58-88  "THOUGHTS" +    THE HOLD. The phrase creeps up the frame 811 ->
//              tail           772 (>= 1.1 px/f, a position creep, k fixed); the
//                             reader keeps descending below the bracket; the
//                             caret keeps writing at the bottom of the page.
// Nothing else: no ring, no flash, no pulse, no glow, no colour change, no
// alpha fade on a bar, no label.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE CUT BRIEF (and the director's resolutions), with reasons.
//  * preLines 26 -> 11, and the reader opens at screen y ~800, NOT in the upper
//    third. The find framing caps the writing line at line 14 by f88 (see THE
//    PAGE, SOLVED); a reader in the upper third at k 1.05 with the page's lower
//    half filled needs >= 8.5 lines of page below it, i.e. preLines >= 14.5 and
//    a caret that all but stops (0.02 lines/f). A centred page (reader ~800,
//    caret ~1190, page 400..1230) keeps a visibly writing caret.
//  * Writing rate 1/2.6 -> 1/6 words/f: the same cap. At 1/2.6 the head would
//    be on line 19 by f88, ~5 lines into the caption band.
//  * "The caret is out of frame below" (gesture 3 of the brief): illegal — the
//    page ends on the writing line, so a caret below the frame is ink below
//    1400. The caret stays in frame, at the bottom of the page, every frame.
//  * WIDE tracking k 1.265, not 1.30: the person's right ink (world 938.65) at
//    k 1.30 is 18-26 screen px from the edge with the sway; 1.265 is the largest
//    k that keeps 30 px.
//  * FIND framing cx 445.4 / k 1.48, not cx ~477 / k ~1.44. The director's
//    numbers assume the text's right ink is the measure (820); the page is
//    ragged and the measured right ink in the find framing is 741 (line 11).
//    cx = midpoint of skull left ink (149.85) and 741; k = 1.48, the top of the
//    legal SKULL+TEXT range: skull and text ink both keep ~100 screen px of
//    air, and the reader line and person run cleanly off the right (at cx 477
//    the reader's right dot parked 13 px inside the edge).
//  * Flag words k0 1..k1 3, not 0..2: COMMON's binding skull-spacing rule
//    (line 9's word 0 starts at the measure, so a 0..2 bracket's left pad sits
//    11 world px off the skull's ink).
//  * READER_LINE0 5.81, not 5.64: `foundByReader` fires on the line's CENTRE
//    (top + WORD_H/2), not its top.
//  * The skull draws over 10 f (f56-66, the brief's own span), starting with its
//    bracket, rather than on the bracket's 6-frame `u`.
//  * Hold creeps are in position, never k (director's resolution 4). The brief's
//    1.05 -> 1.07 open creep is the content centre riding the reader.
//
// ---------------------------------------------------------------------------
// MEASURED (bun $S/BadThoughtsO55/measure.ts, all PASS):
//   found(line 9) 56.000; bracket u 1 at f62; skull done f66.
//   Camera: max |dv| of any fixed world point on screen 2.16 px/f^2 (f43, the
//   find's acceleration lobe); max |v| 18.3 px/f. k 1.050 f0 · 1.245 f24 ·
//   1.264 f31 · 1.326 f46 · 1.459 f56 · 1.475 f60 · 1.480 f64-88.
//   Heads: reader 6.0, person 15.9, phrase 5.3, caret 41.4 px/f (line wraps
//   excluded — a caret wraps in one frame).
//   Reader screen y: 800 f0 · 762 f27-37 · 815 f56 · 888 f72 · 972 f87.
//   Phrase centre screen y 811 (f60) -> 772 (f87); min creep 1.11 px/f.
//   Writing line (caret centre) screen y 1098..1314; lowest ink 1348 (caret,
//   f73); edge air min 39.7 (person, f35); skull left ink >= 94 px; person
//   fully out from f52; reader visible every frame; energy min 23.5 (f87).
//   Bar heights 1.3..32.6 screen px (the low end is the top-exit thinning).
//   Reader -> head gap >= 3.57 lines (cap never engages).
// ---------------------------------------------------------------------------

export const DURATION = 88;

/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
const READER_LPF = 0.06;
/** clip constant: the writing line's hold, world y */
const HOLD_Y = 1050;
/** Line 0's top in world y before the scroll. Chosen so the scroll is already
 *  running at f0 (the writing line is past HOLD_Y), so the `max(0, ...)` in the
 *  scroll never bites. */
export const LINE0 = 360;
/** Lines already written at f0: the caret starts line 11. */
export const PRE_LINES = 11;
/** Words per frame. Solved from the find framing: the caret must still be on
 *  line 14 at f90. */
export const WRITE_RATE = 1 / 6;

// --- the beats --------------------------------------------------------------
export const BEATS = {
  look: 14,
  chain: 25,
  thought: 31,
  sayOh: 37,
  model: 46,
  thinking: 54,
  bad: 59,
  thoughts: 64,
  ends: 72,
};

// --- the page ---------------------------------------------------------------
export const COLUMN = makeColumn(11, 64, LINE0);
export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => WRITE_RATE,
});
export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

// --- the writing, at a slow rate ---------------------------------------------
// NEW HELPERS (not in punishShared). The module grows a word over GROW = 2
// frames from its emit while `headAt` walks the caret across it over the whole
// word slot. At the clip's fast rates those agree; at this cut's 1/6 they do
// not — the bar is finished in 2 frames and the caret then crawls along its own
// orange for 4 more, which is exactly the "caret sitting on an orange bar with
// no daylight" the module's CARET_LEAD exists to prevent, and the caret jumps
// the 18 px word gap in one frame. So here the caret walks word AND gap at one
// speed (`caretX`), and a word's bar runs out from its left edge under the
// caret's tip (`grownWithCaret`): the word grows exactly as it is written.
// Growth is still counted in frames from the clock's own EMIT.
const SLOT = 1 / WRITE_RATE;
export const caretX = (f: number) => {
  const w = CLOCK.wordsAt(f);
  const i = Math.max(0, Math.min(COLUMN.WORDS.length - 1, Math.floor(w)));
  const word = COLUMN.WORDS[i];
  return word.x + (word.w + GAP) * clamp01(w - i);
};
export const grownWithCaret = (gi: number, f: number) => {
  const w = COLUMN.WORDS[gi].w;
  return clamp01(((f - CLOCK.EMIT[gi]) / SLOT) * ((w + GAP) / w));
};
const WRITING_CLOCK = { ...CLOCK, grownAt: grownWithCaret };

// --- the reader -------------------------------------------------------------
export const FLAG_LINE = 9;
export const FOUND_TARGET = 56;
const readerLineFrom = (line0: number) => (f: number) =>
  readerAt({ f, f0: 0, line0, linesPerFrame: READER_LPF, capLine: CLOCK.headLine });
/** Solved so the reader's line crosses line 9's centre at exactly f56. */
export const READER_LINE0 = (() => {
  let lo = 4.5;
  let hi = 7.5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const f = foundByReader(COLUMN, FLAG_LINE, readerLineFrom(mid), 0, DURATION + 20);
    if (f > FOUND_TARGET) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
export const readerLineAt = readerLineFrom(READER_LINE0);
/** The reader line's world y (after the scroll). */
export const readerWorldY = (f: number) => COLUMN.lineYf(readerLineAt(f)) - scrollAt(f);

// --- the find ---------------------------------------------------------------
const FOUND = foundByReader(COLUMN, FLAG_LINE, readerLineAt, 0, DURATION + 20);
export const FLAG: Flag = { line: FLAG_LINE, k0: 1, k1: 3, found: FOUND };
export const bracketUAt = (f: number) => clamp01((f - FLAG.found) / 6);
/** The skull draws over the brief's own f56-66, starting with its bracket. */
export const SKULL_F = 10;
export const skullUAt = (f: number) => clamp01((f - FLAG.found) / SKULL_F);
/** Line 9's centre in world y (after the scroll). */
export const flagWorldY = (f: number) => COLUMN.lineY(FLAG_LINE) + WORD_H / 2 - scrollAt(f);

// --- geometry the camera is solved against ------------------------------------
export const SKULL_X = COL_X0 - SKULL_DX;
/** Skull ink: the Lucide outline's circle spans x 4..20 of its 24 box. */
export const SKULL_INK_L = SKULL_X - (8 / 24) * SKULL_BOX - SKULL_STROKE / 2;
export const PERSON_X = COL_X0 + COL_W + PERSON_DX;
/** The right-most text ink in the find framing: every line on screen there
 *  (3..14) and the caret. Measured, not the measure. */
export const TEXT_INK_R = (() => {
  let r = 0;
  for (let i = 3; i <= 14; i++) {
    const ws = COLUMN.LINES[i].words;
    const w = ws[ws.length - 1];
    r = Math.max(r, COL_X0 + w.x + w.w);
  }
  return r;
})();

// ---------------------------------------------------------------------------
// THE CAMERA. Two eased lobes on one k track, cx and the content centre eased
// by the same camEase as the k they belong to; the holds creep in position.
//
// The content centre is written as "this world point at this screen y": the
// reader at SY (open -> track), then line 9's centre at SP (a slow upward
// creep). `(CONTENT_Y - sy) / k` turns a screen y into a world offset at that
// frame's own k, so the push-in does not sag the subject.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.05;
export const K_WIDE = 1.265;
export const K_FIND = 1.48;
export const K_REST = K_FIND;
export const CX_FIND = (SKULL_INK_L + TEXT_INK_R) / 2;

export const LOOK0 = 4;
export const LOOK1 = 23;
export const LOOK_WARP = 0.8;
export const FIND0 = 36;
export const FIND1 = 54;
export const FIND_WARP = 1;

/** where a content centre lands on screen: 960 - CAM_LIFT */
const CONTENT_Y = FRAME_H / 2 - CAM_LIFT;
/** the reader's screen y: at the open (page centred), then riding */
export const SY_OPEN = 800;
export const SY_TRACK = 762;
/** line 9's screen y through the hold: SP0 at FIND1, creeping up SP_V px/f */
export const SP0 = 836;
export const SP_V = -1.9;

export const K = kTrack(
  [
    { f0: 0, f1: LOOK0, k0: K_OPEN, k1: K_OPEN, warp: 1 },
    { f0: LOOK0, f1: LOOK1, k0: K_OPEN, k1: K_WIDE, warp: LOOK_WARP },
    { f0: LOOK1, f1: FIND0, k0: K_WIDE, k1: K_WIDE, warp: 1 },
    { f0: FIND0, f1: FIND1, k0: K_WIDE, k1: K_FIND, warp: FIND_WARP },
    { f0: FIND1, f1: DURATION + 2, k0: K_FIND, k1: K_FIND, warp: 1 },
  ],
  DURATION + 2,
);
export const eLook = (f: number) => camEase((f - LOOK0) / (LOOK1 - LOOK0), LOOK_WARP);
export const eFind = (f: number) => camEase((f - FIND0) / (FIND1 - FIND0), FIND_WARP);
const kAt = (f: number) => K[Math.max(0, Math.min(K.length - 1, Math.round(f)))];

export const CAMERA = buildCamera({
  duration: DURATION,
  K,
  cx: (f) => BLOCK_CX + (CX_FIND - BLOCK_CX) * eFind(f),
  cy: (f) => {
    const k = kAt(f);
    const sy = SY_OPEN + (SY_TRACK - SY_OPEN) * eLook(f);
    const onReader = readerWorldY(f) + (CONTENT_Y - sy) / k;
    const sp = SP0 + SP_V * (f - FIND1);
    const onFlag = flagWorldY(f) + (CONTENT_Y - sp) / k;
    const e = eFind(f);
    return onReader * (1 - e) + onFlag * e;
  },
});
export const CAM_AT = CAMERA.CAM_AT;
export const SCREEN_AT = CAMERA.SCREEN_AT;
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

const BadThoughtsO55: React.FC<Props> = ({
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
  const { cx, cy, k } = CAM_AT(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const scroll = scrollAt(frame);
  const exitAt = makeExit(cy, k);
  const head = CLOCK.headAt(frame);
  const rY = readerWorldY(frame);
  const flagY = flagWorldY(frame);
  const flagEx = exitAt(flagY);
  const box = flagBox(COLUMN, FLAG);

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
            {/* the chain of thought */}
            <WordBars
              column={COLUMN}
              clock={WRITING_CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              exitAt={exitAt}
            />

            {/* what the reader found */}
            <Bracket
              column={COLUMN}
              flag={FLAG}
              u={bracketUAt(frame)}
              stroke={STROKE}
              ink={ink}
              opacity={INK_HI}
              scroll={scroll}
              exit={flagEx}
              k={k}
            />
            <SkullMark
              x={SKULL_X}
              y={(box.y0 + box.y1) / 2 - scroll}
              u={skullUAt(frame)}
              scale={flagEx}
              accent={accent}
              k={k}
            />

            {/* us, reading */}
            <ReaderLine yWorld={rY} stroke={STROKE} ink={ink} k={k} />

            {/* the model, writing */}
            <Caret x={caretX(frame) + COL_X0} y={head.y - scroll} accent={accent} />
          </svg>

          <ReaderPerson x={PERSON_X} y={rY} k={k} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default BadThoughtsO55;
