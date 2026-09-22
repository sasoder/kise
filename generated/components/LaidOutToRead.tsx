import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
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
  COL_W,
  COL_X0,
  Caret,
  FPS as CLIP_FPS,
  GRID_W0,
  INK_HI,
  LABEL_IN,
  LABEL_RISE_PX,
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

export const FPS = CLIP_FPS;

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs`, CUT 1 of 8 — `LaidOutToRead`, in at 0:03.020.
//
//   "where the neural nets are just, like, flat out reasoning, laying out their
//    thought process in natural language for us to read."
//
// THE ESTABLISHING SHOT. The clip's two actors are introduced by the words and
// by nothing else: the MODEL WRITING its thought in the open (orange caret,
// orange word-bars), the pull-back that LAYS OUT what it has written, and then
// US arriving to READ it (the white reader line drawn on at the top of the
// page, the person glyph beside it, and it starts down). No flags, no
// brackets, no skulls, no labels — nothing is found in this cut and nothing is
// hidden in it. Every constant, helper and component is imported from
// `punishShared`; this file decides only what happens.
//
// DURATION = round(4.999 * 24) + 16 = 120 + 16 = 136.
// Word onsets, frames from this cut's own t0:
//   where 0 · the 7 · neural 11 · nets 26 · are 31 · just 34 · like 36 ·
//   flat 40 · out 45 · reasoning 48 · laying 62 · out 67 · their 71 ·
//   thought 73 · process 78 · in 87 · natural 92 · language 98 · for-us 105 ·
//   to 111 · read 114 · speech ends 120 · tail to 136.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion. Every one of them, with its word:
//
//  1. f0-22   "where the neural    THE MODEL THINKING. Three lines exist and
//             nets"                the caret is starting the fourth, writing at
//             (0/11)               1 word / 2.1 f; the page scrolls up under
//                                  the writing line, which the scroll holds at
//                                  world y HOLD_Y; the camera holds at reading
//                                  distance with a creep (k 1.680 -> 1.665,
//                                  the writing line easing from screen 957 to
//                                  993, 12.6 screen px/f of travel in frame).
//                                  Nothing else exists yet: the viewer is
//                                  learning that an orange bar is a word the
//                                  model wrote.
//  2. f22-58  "are just like flat  THE PULL-BACK, and it IS "laying out":
//             out reasoning"       ONE move, k 1.665 -> 1.17, warp 0.85,
//             (31/34/36/40/45/48)  landing f58, four frames before "laying"
//                                  (62). The paragraphs already written slide
//                                  down into frame from above — ragged right,
//                                  paragraph gaps, a page of thought — and at
//                                  f58 ALL of it stands in one frame with air
//                                  at both ends: line 0 at screen 463, the
//                                  writing line at 1213, the caption band
//                                  empty.
//  3. f58-100 "laying out their    IT KEEPS WRITING, AND THE FRAME HOLDS THE
//             thought process in   WHOLE PAGE. The rate eases 1/2.1 -> 1/5.5
//             natural language"    over f40-65 (smootherstep) so the page
//             (62/67/71/73/78/     cannot outgrow the band; the camera creeps
//              87/92/98)           (k 1.17 -> 1.16) and rides 10 screen px up
//                                  with the page as it grows, so the page's
//                                  top climbs 463 -> 294 while the writing
//                                  line stays put at 1221-1227. Nothing leaves
//                                  the frame at either end.
//  4. f100-118 "for us"            THE LEAN TO THE READER. One small move
//             (105)                toward the top of the page — the writing
//                                  line tips from screen 1225 to 1295, 59
//                                  world px at the live k, with k 1.16 ->
//                                  1.185 — so the frame settles onto the
//                                  reader as it arrives and is still settling
//                                  as "read" (114) lands.
//  5. f97-109 "for us"             THE READER ARRIVES. At line 0.5 — between
//             (105)                the first two lines of the page — the white
//                                  scan line draws on from its left end over
//                                  f97-105, its end dots riding with it; the
//                                  person glyph enters in the right margin at
//                                  the same height on the label entrance (up
//                                  LABEL_RISE_PX screen px while it fades, over
//                                  LABEL_IN frames, f99-109).
//  6. f105-135 "to read" + tail    IT READS. From f105 the reader descends at
//             (111/114)            the clip constant READER_LPF = 0.06 lines a
//                                  frame, line 0.500 -> 2.300, and on screen
//                                  339 -> 404. The caret goes on writing at the
//                                  foot of the page, the camera creeps k 1.185
//                                  -> 1.195 and follows the reader's drift.
//                                  Nothing lands on f120 and nothing stops.
//
// ---------------------------------------------------------------------------
// DEVIATIONS, one line each, each forced by a number:
//
//  * OPENING k 1.68, NOT 2.0. The measure is COL_W 576 world px: at k 2.0 that
//    is 1152 screen px in a 1080 frame and every line is cut off at BOTH edges.
//    1.68 is the closest the camera can sit and still leave 42 px of air left
//    of the text and 69 px right of it. There is no person on screen until f99
//    (k is 1.16 by then), so the clip's "never park between k 1.33 and 1.75"
//    rule — which is about a half-visible person — has nothing to bite on here,
//    and every framing from f58 on is WIDE, person-in, k <= 1.20.
//  * THE WRITING RATE IS 1/2.1 -> 1/5.5, not 1/1.4 -> 1/3.2. The rate is not a
//    free choice: the page has to be <= 13 lines at f105 and <= 15 at f136 for
//    all of it to stand inside the caption-safe band at a person-in zoom, and
//    with the ramp where it is those two heights FIX the pair —
//      words(105) = 3 lines + 52.5 * (fast + slow)
//      words(136) = 3 lines + 52.5 * fast + 83.5 * slow
//    1/1.4 alone writes 7 lines in the first 40 frames and lands the page at
//    17.7 lines at f105, 4.7 lines taller than the band can hold at k 1.17. At
//    1/2.1 -> 1/5.5 it is 12.77 and 14.26. The caret's own screen speed comes
//    down with it, 195 -> 141 px/f, which is the other thing 1/1.4 cost.
//  * THE PULL-BACK IS f22-58, not f30-58. Over 28 frames it accelerates the
//    image to 4.2 screen px/f^2; over 36 it is 1.7, well inside the 2.5 cap.
//  * NO TOP THINNING. `makeExit` is called with top = -80, i.e. OUTSIDE the
//    frame, so a bar is at full height everywhere it can be seen. The module's
//    EXIT_TOP (188) is a SCREEN-space rule, and this cut's camera pulls back
//    and then leans, so the page's top line falls into and back out of that
//    thinning zone during the close shot (screen y 374 at f19, 349 at f43 with
//    the lift, and it is inside 188..250 across the middle of the pull-back).
//    On the module's threshold it would thin and then grow back to full height
//    — and in this clip a bar's height IS its observability, so that would read
//    as the model hiding a thought and un-hiding it. Nothing is hidden in this
//    cut, so nothing thins in it. Nothing is cut by the frame edge either:
//    line 0 has ink on screen on all 136 frames.
//  * THE READER CROSSES THE TEXT. Its world y is `lineYf(readerLine)` with no
//    offset, which is the module's own convention — the one `foundByReader`
//    measures a flag against — so a scan line descending 0.34 of a pitch of
//    bars out of every 1.0 is over words about a third of the time: here on
//    line 1 around f114 and on line 2 from f130. Left as the module has it, on
//    the director's note: it reads as reading.
//
// ---------------------------------------------------------------------------
// MEASURED — `$S/LaidOutToRead/measure.ts`, off the tables below. All pass.
//   Camera       max |dv| of the image 1.713 screen px/f^2 at f57 (cap 2.5),
//                measured on the world points sitting at screen 250 and 1650 on
//                each frame; max |v| of that content 21.41 px/f (cap 45).
//                k 1.680 f0 · 1.626 f30 · 1.191 f58 · 1.167 f76 · 1.161 f97 ·
//                1.164 f105 · 1.184 f120 · 1.192 f136 — every frame from f58 is
//                inside the WIDE, person-in band.
//   Heads        reader line 4.43 px/f, the page 19.77 px/f. The caret's own
//                writing speed peaks at 141.0 px/f at the open: that is the
//                word rate at k 1.68, the module's mechanism rather than the
//                camera.
//   Holds        f0-30 travels 12.6 screen px/f, f58-76 3.0, f120-136 3.8 —
//                every one over the 0.4 px/f floor, so the frame is never
//                parked.
//   The page     3.34 lines at f0 · 8.61 f40 · 10.36 f58 · 12.54 f100 · 12.77
//                f105 (cap 13) · 14.26 f136 (cap 15). Writing line screen y
//                957 f0 · 1213 f58 · 1224 f76 · 1227 f105 · 1286 f136, never
//                once past 1330. Line 0's band centre 652 f0 · 463 f58 · 367
//                f88 · 299 f120 · 237 f136, in frame on all 136 frames and
//                never above it from f58. LOWEST DRAWN INK ON ANY FRAME 1314
//                (at f136), so nothing is ever in the caption band.
//   Text         drawn bar count and total drawn width non-decreasing on all
//                137 frames, 14 -> 55 bars; head line 3.00 -> 13.33, 14.0 ->
//                54.3 words. No on-screen bar is ever below full height
//                (worst exit 1.0000).
//   Reader       u = 0 at f97, u = 1 at f105; line 0.500 at f105, 2.300 at
//                f135; nearest approach to the writing head 10.97 lines (floor
//                0.6). Screen y 360 f97 · 339 f105 · 369 f112 · 388 f118 · 404
//                f136, descending on every frame from f105. The person's ink
//                is centred on the line to within 1 screen px, measured on the
//                delivered frames f114 / f120 / f135, and the person is whole
//                on every frame it exists.
//   Framing      text left edge never nearer than 41.8 px to the frame edge,
//                right edge 69.3 px, the person's ink 63.5 px.
//   Energy       min per-frame energy 3.16 screen px at f105; zero on no frame.
// ---------------------------------------------------------------------------

export const DURATION = 136;

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
    neural: z.number(),
    flat: z.number(),
    reasoning: z.number(),
    laying: z.number(),
    process: z.number(),
    natural: z.number(),
    forUs: z.number(),
    read: z.number(),
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
    neural: 11,
    flat: 40,
    reasoning: 48,
    laying: 62,
    process: 78,
    natural: 92,
    forUs: 105,
    read: 114,
  },
});

// ---------------------------------------------------------------------------
// THE PAGE. The clip's one column, at the moment this cut opens: five lines
// already written and the caret starting the sixth. `LINE0` is solved so the
// writing line sits exactly on the module's hold at f0, which is what keeps
// `scrollAt`'s `max(0, ...)` off its floor for the whole cut.
// ---------------------------------------------------------------------------
export const SEED = 11;
export const N_LINES = 64;
export const PRE_LINES = 3;
/** V5's hold: the writing line rests here in world y and the page scrolls. */
export const HOLD_Y = 1050;

const MEASURE = makeColumn(SEED, N_LINES, 0);
export const LINE0 = HOLD_Y - MEASURE.LINES[PRE_LINES].y0;
export const COLUMN = makeColumn(SEED, N_LINES, LINE0);

/** The model's writing rate, words per frame: fast while it is "flat out
 *  reasoning", easing to a considered pace over f40-65 as it "lays out" what it
 *  is thinking. THE TWO VALUES ARE SOLVED, not chosen — see the rate deviation
 *  in the header. The page has to be <= 13 lines at f105 and <= 15 at f136 for
 *  the whole of it to stand inside the caption-safe band at a person-in zoom,
 *  and with a smootherstep ramp those two heights fix the pair exactly:
 *    words(105) = PRE + 52.5 * (fast + slow),  words(136) = PRE + 52.5 * fast
 *    + 83.5 * slow. */
export const RATE_FAST = 1 / 2.1;
export const RATE_SLOW = 1 / 5.5;
export const RATE_F0 = 40;
export const RATE_F1 = 65;
const smootherstep = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const rateAt = (f: number) =>
  RATE_FAST + (RATE_SLOW - RATE_FAST) * smootherstep((f - RATE_F0) / (RATE_F1 - RATE_F0));

export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt,
});

export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

// ---------------------------------------------------------------------------
// US. The reader is drawn on at line 0.5 — between the first two lines of the
// page — over f97-105, and descends from f105 at the CLIP CONSTANT
// `READER_LPF`, 0.06 lines per frame, which is the same in all eight cuts. It
// is softly capped at the writing head by the module; in this cut the head is
// nineteen lines below it and the cap never bites.
// ---------------------------------------------------------------------------
export const READER_LPF = 0.06; // lines per frame — the clip constant
export const READER_LINE0 = 0.5;
export const READER_F_IN = 97; // the line starts drawing
export const READER_F_ON = 105; // ...and is whole, and starts down
export const PERSON_F_IN = 99; // the person's label entrance starts

export const readerLineAt = (f: number) =>
  readerAt({
    f: Math.max(f, READER_F_ON),
    f0: READER_F_ON,
    line0: READER_LINE0,
    linesPerFrame: READER_LPF,
    capLine: CLOCK.headLine,
  });
/** 0..1, the line drawing on from its left end. Eased: it does not pop. */
export const readerU = (f: number) =>
  smoothstep(clamp01((f - READER_F_IN) / (READER_F_ON - READER_F_IN)));
/** The reader's world y at frame f — its line, less the page's scroll. It is
 *  `lineYf` and nothing else: that is the module's own convention, the one
 *  `foundByReader` compares a flag's line centre against, so the reader sits at
 *  the same height relative to the text in all eight cuts. */
export const readerYAt = (f: number) => COLUMN.lineYf(readerLineAt(f)) - scrollAt(f);

// ---------------------------------------------------------------------------
// THE CAMERA. Five segments, authored as eased per-frame tracks through
// `kTrack` (which is a segment-eased track builder, so the content centre goes
// through it too) and damped by `buildCamera`. `cx` is BLOCK_CX on every
// frame: the camera is centred on the BLOCK — skull margin, text, person
// margin — never on the text axis.
//
// K_OPEN is the closest the camera can sit: the text's left edge lands at
// screen 540 - 295.85 * k, so k 1.68 leaves 43 px of air there and 69 px on
// the right. The brief's 2.0 cuts every line off at both edges.
//
// K_REST is the zoom the one stroke weight is fixed at — the reader line only
// exists from f97, by which time the camera is on its way to 1.10.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.68;
export const K_WIDE = 1.17;
export const K_REST = 1.18;
export const STROKE = strokeFor(K_REST);

/** Where a content centre lands on screen: the module's framing constant. */
export const LIFT_Y = FRAME_H / 2 - CAM_LIFT;
/** The writing line's band centre in WORLD y. The scroll holds the writing
 *  line at `HOLD_Y` all cut, so this is a constant — which is what makes it
 *  the right thing to author the camera against. */
export const WRITE_W = HOLD_Y + WORD_H / 2;

const F_END = DURATION + 2;
export const K_TRACK = kTrack(
  [
    { f0: 0, f1: 22, k0: K_OPEN, k1: 1.665, warp: 1 }, // the close hold, creeping
    { f0: 22, f1: 58, k0: 1.665, k1: K_WIDE, warp: 0.85 }, // THE PULL-BACK
    { f0: 58, f1: 100, k0: K_WIDE, k1: 1.16, warp: 1 }, // the wide hold, creeping
    { f0: 100, f1: 118, k0: 1.16, k1: 1.185, warp: 0.6 }, // THE LEAN to the reader
    { f0: 118, f1: F_END, k0: 1.185, k1: 1.195, warp: 1 }, // the tail creep
  ],
  F_END,
);

/** THE CAMERA, AUTHORED AS WHERE THE WRITING LINE SITS ON SCREEN. Everything
 *  the framing has to obey is measured from that line: the page hangs above it
 *  (line 0 is `pageH` up), the caret sits on it, and the caption band is below
 *  it. Authoring the screen y directly and solving the content centre out of it
 *  means no framing constraint is ever a second-order consequence of a keyed
 *  world coordinate — and it is V5's rule, hold the writing line via the
 *  scroll rather than chase the caret.
 *
 *  It rises 10 px over f58-100, which is the camera partly following the page
 *  up as it grows; the lean at f100-118 tips 70 screen px (59 world px at the
 *  live k, inside the 120 px the revision allows) toward the reader. */
export const WRITE_SCREEN = kTrack(
  [
    { f0: 0, f1: 22, k0: 986, k1: 1000, warp: 1 },
    { f0: 22, f1: 58, k0: 1000, k1: 1235, warp: 0.85 },
    { f0: 58, f1: 100, k0: 1235, k1: 1225, warp: 1 },
    { f0: 100, f1: 118, k0: 1225, k1: 1295, warp: 0.6 },
    { f0: 118, f1: F_END, k0: 1295, k1: 1307, warp: 1 },
  ],
  F_END,
);

/** The CONTENT centre, world y, solved from the two tracks above.
 *  `buildCamera` adds CAM_LIFT / k itself. */
export const CY_AT = (f: number) => WRITE_W - (WRITE_SCREEN[f] - LIFT_Y) / K_TRACK[f];

export const CAM = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: () => BLOCK_CX,
  cy: CY_AT,
});
export const CAM_AT = CAM.CAM_AT;
export const SCREEN_AT = CAM.SCREEN_AT;

/** The top thinning, pushed OUTSIDE the frame: see DEVIATIONS. Nothing is
 *  hidden in this cut, so no visible bar is ever below full height. */
export const EXIT_TOP = -80;
export const exitFor = (cy: number, k: number) => makeExit(cy, k, EXIT_TOP);

const LaidOutToRead: React.FC<Props> = ({
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
  // No per-icon shadow is set up here: the only two icons in the cut are the
  // reader line and the person, and both wear the module's own `iconShadow(k)`
  // from the `k` they are handed.

  const scroll = scrollAt(frame);
  const head = CLOCK.headAt(frame);
  const exitAt = exitFor(cy, k);

  const u = readerU(frame);
  const readerY = readerYAt(frame);
  // The person enters on the label entrance: up LABEL_RISE_PX screen px while
  // it fades, over LABEL_IN frames. In world px, because it rides the camera.
  const personT = camEase(clamp01((frame - PERSON_F_IN) / LABEL_IN), 1);
  const personRise = (LABEL_RISE_PX * (1 - personT)) / k;

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
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={1080}
            height={1920}
            viewBox="0 0 1080 1920"
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the model's chain of thought, one word at a time */}
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              exitAt={exitAt}
              opacity={dotOpacity}
            />

            {/* us, reading */}
            {u > 0 ? (
              <ReaderLine
                yWorld={readerY}
                u={u}
                stroke={STROKE}
                ink={ink}
                opacity={INK_HI}
                k={k}
              />
            ) : null}

            {/* the model, writing */}
            <Caret
              x={head.x + COL_X0}
              y={head.y - scroll}
              accent={accent}
              opacity={dotOpacity}
            />
          </svg>

          {/* who is reading — DOM, beside the svg, inside the same transform */}
          {personT > 0 ? (
            <ReaderPerson
              x={COL_X0 + COL_W + PERSON_DX}
              y={readerY + personRise}
              k={k}
              opacity={INK_HI * personT}
            />
          ) : null}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default LaidOutToRead;

/** What the cut is made of, read from outside by `measure.ts`. Nothing here is
 *  used by the render — they are the same tables the render draws from. */
export const STATS = {
  duration: DURATION,
  line0: LINE0,
  words: COLUMN.WORDS.length,
  stroke: Number(STROKE.toFixed(4)),
  k: [0, 30, 58, 76, 97, 105, 120, 136].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};
