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
  iconShadow,
  runCamera,
  worldTransform,
} from "./fieldShared";
import {
  BRACKET_F,
  COL_W,
  COL_X0,
  Caret,
  FLAG_PAD_X,
  FLAG_PAD_Y,
  FPS,
  GAP,
  GRID_W0,
  HAIR_H,
  INK,
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
  flagWords,
  foundByReader,
  kTrack,
  makeClock,
  makeColumn,
  makeExit,
  readerAt,
  roundRect,
  strokeFor,
  type Flag,
  type KSeg,
} from "./punishShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam_Punishing_AIs, cut 5 of 8, `LightTouch` — O55 rebuild (`LightTouchO55`).
// In 0:33.000.
//
//   "You can do that with a very light touch, but every time you intervene
//    based on your observations of the chain of thought, you are implicitly
//    applying a tiny bit of pressure for the model to then, like, hide its
//    chain of thought"
//
// DURATION = round(8.700 * 24) + 16 = 209 + 16 = 225. Speech ends f209.
// Onsets: you 0 · light 29 · touch 36 · but 49 · every 52 · time 59 ·
// intervene 68 · observations 90 · chain 104 · thought 109 · implicitly 120 ·
// applying 132 · a-tiny 139 · pressure 150 · for 156 · model 172 · hide 190 ·
// its 195 · chain 199 · thought 204 · ends 209.
//
// THE IDEA: PRESSURE IS A PRESS, AND THE TEXT REMEMBERS IT. The reader finds
// a bad thought (bracket + skull); the bracket's top and bottom edges then
// close in on the phrase and its words are pressed a little flatter. That is
// "a very light touch": 22 -> 18 world px. But the model's text REMEMBERS:
// every word the caret writes after a press comes out at the pressed height
// — the CEILING — and every press lowers it a notch. By "hide its chain of
// thought" the caret is writing HAIRLINES. One variable (bar height), one
// evolving motion, five presses, each caused by the reader reaching a line.
//
// ---------------------------------------------------------------------------
// GESTURES (every one traces to a word; nothing else moves on its own):
//   G1 find 1 — bracket + skull draw on round line 28 words 1..3 as the reader
//      crosses it, f20.5-26.5                  -> "a very light" (23/29)
//   G2 press 1 — phrase 22 -> 18, bracket edges close 2 px a side, ceiling
//      22 -> 18, f30-42                        -> "light touch" (29/36)
//   G3 pull-back — ONE eased move SKULL+TEXT k1.44 -> WIDE k1.10, cx glides to
//      BLOCK_CX, the person comes back in       -> "but every time ... your
//      observations" (49-90), landing before "chain" 104
//   G4 find 2 + press 2 — line 30 words 0..2, found f53.8, press f62-72, -> 14
//                                              -> "intervene" (68)
//   G5 find 3 + press 3 — line 32 words 1..3, found f87.2, press f94-104,
//      -> 10.5                                 -> "observations ... chain" (90/104)
//   G6 find 4 + press 4 — line 34 words 1..3, found f120.5, press f128-140,
//      -> 7.5                                  -> "applying a tiny" (132/139)
//   G7 find 5 + press 5 — line 36 words 0..2, found f153.3, press f162-174,
//      -> 5                                    -> "pressure ... for the model"
//      (150-172)
//   G8 push-in — ONE eased move WIDE k1.10 -> CLOSE k1.75 on the text axis,
//      content centre to the writing line; the person leaves right, the
//      skulls leave left/top                   -> "pressure for the model to
//      then like" (150-185), landing f185 before "hide" 190
//   G9 the ceiling eases 5 -> HAIR_H on its own, f184-200: the caret writes
//      hairlines                               -> "hide its chain of thought"
//      (190-204)
//   Continuous, not gestures: the caret writing, the reader descending at
//   READER_LPF, the column scrolling to hold the writing line, the hold creeps.
//   The tail (f209-225) is the caret writing hairlines and the reader reading
//   on; nothing lands on f209.
//
// CAMERA (kTrack + buildCamera; keyed, then the shared damper lags ~5 f; the
// damper is pre-rolled PRE_ROLL frames so the f0 creep is already running):
//   A key f0-42    SKULL+TEXT hold, k 1.44, cx 453, content centre starts on
//                  the reader (screen y 808-832 over the hold) and creeps down
//                  the page with it, 0.6 world px/f.
//   B key f42-96   pull-back k 1.44 -> 1.10, warp 0.75, cx 453 -> 540,
//                  content centre -> the WIDE rest. Damped landing f98.
//   C key f96-140  WIDE hold, k 1.10, content centre rising 800 -> 695 world
//                  (continuing the pull-back's direction) so skull 1 is still
//                  in, full size, at f150.
//   D key f140-180 push-in k 1.10 -> 1.75, warp 1, cx 540 -> 532.15, content
//                  centre -> the writing line. Damped landing f185.
//   E key f180-    CLOSE hold, k 1.75, the writing line held LOW (revision
//                  1): content centre 180 world px above the writing line,
//                  so the caret writes at screen y ~1105-1215 (the per-line
//                  scroll sawtooth, mean ~1160) and the frame fills from the
//                  top exit down to it; the camera creeps down the page with
//                  the writing, 0.55 world px/f.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE CUT BRIEF (director's resolutions first):
//  * OPEN in SKULL+TEXT (k 1.44) not CLOSE on the text axis (director 1). cx
//    is 453, not 477: solved on MEASURED ink (text right edge 773 world on
//    these lines, not the 820 measure; skull ink left 149.85) and pushed left
//    until the reader line's right end dot is fully off the right edge — at
//    477 that dot sat 12 screen px inside the edge, a tangent. Skull ink ~99 px
//    from the left edge, text ink ~78 px from the right, person fully out.
//  * WIDE hold: k flat at 1.10 (creep in POSITION, not k 1.10 -> 1.13). Its
//    content centre is solved for the f150 frame (skull 1 .. writing line in,
//    nothing below 1400), not the reader/writing-line midpoint.
//  * f150 "all five skulls": find 5 is caused by the reader crossing line 36,
//    which is ~f153-155 on the brief's own table, so at f150 four skulls exist
//    and line 36 is in frame; skull 5 draws on f153-159 fully in frame (min
//    left air 22 px, mid-move) and the push then carries it off the left.
//  * PUSH-IN: keyed f140-180 with warp 1 (not f150-186 with warp 0.65). A 0.65
//    warp's onset put |dv| at 4.9 px/f^2; the 1.10 -> 1.75 zoom plus the pan
//    to the writing line needs ~40 f to stay under 2.5, and it must land by
//    f186. Visibly it starts ~f144 (k 1.15 at f150) and lands f185.
//  * CLOSE lands k 1.75 exactly (director 3) on the text axis. REVISION 1:
//    the writing line is held LOW, screen y 1105-1215 from f186 (the brief's
//    [1000, 1330] band holds again), so the payoff frame is the whole stack of
//    ever-thinner lines ending in the hairline being written, not a half-empty
//    frame. At this framing the reader line's end dots sit ON both frame
//    edges (right outer edge x 1084-1089, left ~-4): the CLOSE definition puts
//    them there.
//  * FLAG WORDS (revision 2): the brief's alternation 0..2 / 1..3 is REVERSED
//    and ends on a STACKED PAIR — flags 1-5 = 1..3 / 0..2 / 1..3 / 1..3 /
//    1..3. CLOSE on the text axis puts any words-0..2 bracket on a line that
//    starts at the measure 10-16 px from the left edge (text ink 35 px in, the
//    bracket pad 15 world = 26 screen px further left). Line 36 stays in the
//    CLOSE at full height through f224 and line 34 until ~f197 (above half
//    height), and both start at the measure, so flags 4 and 5 both take
//    1..3. In the CLOSE their brackets now sit 281+ and 224+ px from the left
//    edge. Left pads clear the skulls by 185 / 55 / 192 / 167 / 134 world px.
//  * FINDS 1.5 f EARLIER than the table (20.5, 53.8, 87.2, 120.5, 153.3; all
//    within +-3) so find 5 completes before the push carries its skull off.
//    That also lets press 3 keep the table's f94-104.
//  * WRITING RATE. 1/2.8 words/f opens the reader gap from 3 to ~9 lines. The
//    rate is solved instead as a CARET SCREEN SPEED (`caretScreenV`, 40 -> 33):
//    40 screen px/f through the open and the wide, eased to 33 across the
//    push-in because the camera's pan and zoom add to the caret's screen speed
//    there. Paid out per px of text (word width + gap), not per word, so a
//    long word is not written faster than a short one. Reader-to-head 3.06 ..
//    4.75 lines, never capped.
//  * New helpers in this file (none in the shared modules): `caretX` (the
//    caret travels continuously through each word AND the gap after it, so it
//    does not jump 18 px between words; the line wrap is still one frame — it
//    is a caret — and is excluded from the head-speed number), `PressBracket`
//    (a bracket whose half-height hugs its phrase's current height), the
//    per-px `RATE` table, and the camera PRE_ROLL wrapper.
//
// MEASURED (bun $S/LightTouchO55/measure.ts, final pass; ALL PASS):
//   camera   max |dv| of a fixed on-screen world point 1.72 px/f^2 (f150, the
//            push-in onset; 0.72 in the pull-back); max |v| 21.9 px/f. Creep
//            min: A 0.51, C 1.9, E 1.19 screen px/f.
//            k: 1.44 f0-44, 1.10 f100, 1.15 f150, 1.75 f186-224.
//   heads    caret 41.0 px/f max (f155, wraps excluded); reader 8.5; person
//            9.9.
//   energy   min 361 (f106) — never zero.
//   writing  caret centre screen y 1040-1207 over f100-150; 1105-1215 in the
//            CLOSE f186-224.
//   empty    largest empty vertical run, top exit .. 1400: f150 183 px,
//            f186 155, f199 226, f224 254 (each is the strip below the caret).
//   ink      lowest 1287.8 (f179) — nothing below 1400 on any frame. Edge air
//            in holds: words 35.4 (CLOSE, f190), caret 64, skulls 99, brackets
//            156 — no exceptions.
//   press 1  on screen at k 1.44: the bars lose 5.8 px, the bracket edges close
//            2.9 px a side.
//   heights  pressed phrases 22->18 | 22->14 | 22/20/18->10.5 | 16/14/14->7.5
//            | 14->5; words written f200-224 are all HAIR_H.
//   f150     bar heights on screen (k 1.15), top to bottom: 25 (lines 29, 31)
//            | 20.6 (33) | 16 (35) | 12 (37-38) | 8.6 (39-40); the pressed
//            phrases 20.6 / 16 / 12 / 8.6 inside their brackets. The column
//            reads flatter DOWNWARD; 22 -> 18 is the subtlest step, the rest
//            read plainly.
// ---------------------------------------------------------------------------

export const DURATION = 225;

/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
export const READER_LPF = 0.06;
/** clip constant: the writing line's hold, world y */
export const HOLD_Y = 1050;

export const SEED = 11;
export const N_LINES = 64;
/** Lines that exist at f0; the caret is at the start of line 30. */
export const PRE_LINES = 30;
/** LINE0_Y: line 0's top in world y, solved so line PRE_LINES's top sits exactly
 *  on HOLD_Y at f0 (the scroll starts at zero and only grows). */
const PROBE = makeColumn(SEED, N_LINES, 0);
export const LINE0_Y = HOLD_Y - PROBE.LINES[PRE_LINES].y0;
export const COLUMN = makeColumn(SEED, N_LINES, LINE0_Y);

// --- the camera keys -------------------------------------------------------
export const K_SKULL = 1.44;
export const K_WIDE = 1.1;
export const K_CLOSE = 1.75;
export const CX_SKULL = 453;
export const CX_WIDE = 540; // BLOCK_CX
export const CX_CLOSE = COL_X0 + COL_W / 2; // the text axis, 532.15

export const B0 = 42;
export const B1 = 96;
export const B_WARP = 0.75;
export const D0 = 140;
export const D1 = 180;
export const D_WARP = 1;

export const K_SEGS: KSeg[] = [
  { f0: 0, f1: B0, k0: K_SKULL, k1: K_SKULL, warp: 1 },
  { f0: B0, f1: B1, k0: K_SKULL, k1: K_WIDE, warp: B_WARP },
  { f0: B1, f1: D0, k0: K_WIDE, k1: K_WIDE, warp: 1 },
  { f0: D0, f1: D1, k0: K_WIDE, k1: K_CLOSE, warp: D_WARP },
  { f0: D1, f1: DURATION + 2, k0: K_CLOSE, k1: K_CLOSE, warp: 1 },
];
export const K = kTrack(K_SEGS, DURATION + 2);

/** The damped zoom alone: the damper runs k independently of x/y, so the
 *  writing rate can be solved from the zoom the viewer actually sees. */
const K_DAMPED: number[] = (() => {
  const F = K.map((_, i) => i);
  const out: number[] = [];
  for (let f = 0; f <= DURATION + 2; f++) out.push(runCamera(f, F, K, K).k);
  return out;
})();

// --- the writing rate ------------------------------------------------------
/** The caret's travel along the text, in SCREEN px per frame. 40 through the
 *  open and the wide; eased down to 33 across the push-in (the same camEase),
 *  because in the push the camera's own pan and zoom add to the caret's
 *  screen speed and the sum must stay under the 45 px/f head cap. */
export const CARET_V_OPEN = 40;
export const CARET_V_CLOSE = 33;
export const caretScreenV = (f: number) =>
  CARET_V_OPEN + (CARET_V_CLOSE - CARET_V_OPEN) * camEase((f - D0) / (D1 - D0), D_WARP);
const F_CLOCK = DURATION + 24;
const PRE_WORDS = (() => {
  let w = 0;
  for (let i = 0; i < PRE_LINES; i++) w += COLUMN.LINES[i].words.length;
  return w;
})();
/** words per frame, paid out per px of text: the caret travels
 *  caretScreenV(f) / k world px each frame through word + gap. */
export const RATE: number[] = (() => {
  const out: number[] = [];
  let W = PRE_WORDS;
  for (let f = 0; f <= F_CLOCK; f++) {
    let budget = caretScreenV(f) / K_DAMPED[Math.min(f, K_DAMPED.length - 1)];
    const start = W;
    let guard = 0;
    while (budget > 1e-9 && guard++ < 20) {
      const i = Math.floor(W + 1e-9);
      const wd = COLUMN.WORDS[Math.min(i, COLUMN.WORDS.length - 1)];
      const span = wd.w + GAP;
      const left = (1 - (W - i)) * span;
      if (budget >= left) {
        W = i + 1;
        budget -= left;
      } else {
        W += budget / span;
        budget = 0;
      }
    }
    out.push(W - start);
  }
  return out;
})();

export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: (f) => RATE[Math.max(0, Math.min(RATE.length - 1, Math.round(f)))],
});

export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

/** The caret's x, relative to COL_X0: continuous through each word AND the gap
 *  after it (the clock's own `headAt` jumps GAP px between words). */
export const caretX = (f: number) => {
  const w = CLOCK.wordsAt(f);
  const i = Math.max(0, Math.min(COLUMN.WORDS.length - 1, Math.floor(w)));
  const wd = COLUMN.WORDS[i];
  return { x: wd.x + (wd.w + GAP) * clamp01(w - i), line: wd.line };
};

// --- the reader ------------------------------------------------------------
/** The frame the reader crosses line 28's centre. The table says ~22; 20.5
 *  moves every find 1.5 f earlier (all five stay within +-3 f of the table)
 *  so that find 5 (~f153) has finished drawing on before the push-in carries
 *  its skull off the left edge. */
export const FOUND_1 = 20.5;
/** READER_LINE0 solved so the reader crosses line 28's centre on FOUND_1. */
export const READER_LINE0 = (() => {
  const t28 = 28 + WORD_H / 2 / (COLUMN.lineY(29) - COLUMN.lineY(28));
  return t28 - FOUND_1 * READER_LPF;
})();
export const readerRaw = (f: number) => READER_LINE0 + f * READER_LPF;
export const readerLine = (f: number) =>
  readerAt({ f, f0: 0, line0: READER_LINE0, linesPerFrame: READER_LPF, capLine: CLOCK.headLine });
/** the reader's world y (its line runs through the word centres as it crosses) */
export const readerY = (f: number) => COLUMN.lineYf(readerLine(f)) - scrollAt(f);

// --- the flags and the presses ---------------------------------------------
// REVISION 2: the alternation is REVERSED so the last flags land on words
// 1..3 — a words-0..2 bracket on a line that starts at the measure sits 10-16
// px from the left edge in the CLOSE (text axis, k 1.75), and lines 34 and 36
// are both still in the CLOSE frame at full height after f186. So flags 4 and
// 5 are a STACKED PAIR on 1..3 (the alternation breaks there), the rest
// alternate 1..3 / 0..2 / 1..3.
const FLAG_DEFS: { line: number; k0: number; k1: number }[] = [
  { line: 28, k0: 1, k1: 3 },
  { line: 30, k0: 0, k1: 2 },
  { line: 32, k0: 1, k1: 3 },
  { line: 34, k0: 1, k1: 3 },
  { line: 36, k0: 1, k1: 3 },
];
export const FLAGS: Flag[] = FLAG_DEFS.map((d) => ({
  ...d,
  found: foundByReader(COLUMN, d.line, readerLine, 0, DURATION),
}));

/** Each press: its frames and the height (world px) it takes the phrase AND
 *  the ceiling to. A press never starts before its bracket has drawn on. */
const PRESS_TABLE: { p0: number; p1: number; h: number }[] = [
  { p0: 30, p1: 42, h: 18 },
  { p0: 62, p1: 72, h: 14 },
  { p0: 94, p1: 104, h: 10.5 },
  { p0: 128, p1: 140, h: 7.5 },
  { p0: 162, p1: 174, h: 5 },
];
export const PRESSES = PRESS_TABLE.map((p, j) => ({
  ...p,
  p0: Math.max(p.p0, Math.ceil(FLAGS[j].found + BRACKET_F)),
}));
/** The hairline: the ceiling eases the last notch on its own. */
export const HAIR = { p0: 184, p1: 200, h: HAIR_H };

export const smoother = (u: number) => {
  const x = clamp01(u);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** THE CEILING at frame f, world px. Monotone non-increasing. */
export const ceilingAt = (f: number) => {
  let c = WORD_H;
  const steps = [...PRESSES, HAIR];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (f <= s.p0) break;
    c = c + (s.h - c) * smoother((f - s.p0) / (s.p1 - s.p0));
  }
  return c;
};

/** word gi -> the index of the flag whose phrase holds it, or -1 */
const FLAG_OF: Map<number, number> = (() => {
  const m = new Map<number, number>();
  FLAGS.forEach((fl, j) => flagWords(COLUMN, fl).forEach((w) => m.set(w.gi, j)));
  return m;
})();

/** The height a word was WRITTEN at: the ceiling on the frame it was emitted. */
export const writtenH = (gi: number) => Math.min(WORD_H, ceilingAt(CLOCK.EMIT[gi]));

/** A word's height at frame f, world px (before the hairline floor and the
 *  top exit). Only a flagged phrase ever changes after it is written. */
export const wordH = (gi: number, f: number) => {
  const hw = writtenH(gi);
  const j = FLAG_OF.get(gi);
  if (j === undefined) return hw;
  const p = PRESSES[j];
  return hw + (Math.min(hw, p.h) - hw) * smoother((f - p.p0) / (p.p1 - p.p0));
};

/** A flagged phrase's height (its tallest word) — what its bracket hugs. */
export const phraseH = (j: number, f: number) =>
  Math.max(...flagWords(COLUMN, FLAGS[j]).map((w) => Math.max(HAIR_H, wordH(w.gi, f))));

// --- the camera's content centres -------------------------------------------
/** A: the content centre starts ON the reader and creeps DOWN the page with
 *  it at A_DRIFT world px/f. (The reader's own world y barely moves — the
 *  scroll carries the page up about as fast as it reads down — and kinks at
 *  every paragraph gap, so the camera takes its straight-line direction and a
 *  rate that is never parked.) */
export const A_DRIFT = 0.6;
const RY0 = readerY(0);
const yA = (f: number) => RY0 + A_DRIFT * f;
/** C: the WIDE rest, a slow rise that keeps skull 1 in until f150. */
export const Y_W0 = 800;
export const Y_W1 = 695;
const yC = (f: number) => Y_W0 + ((Y_W1 - Y_W0) * (f - B1)) / (150 - B1);
/** E: the CLOSE rest (revision 1). The writing line is held LOW, at screen
 *  y ~E_WRITE_SCREEN, so the frame fills from the top exit down to the caret
 *  with the stack of ever-thinner lines ending in the hairline being written.
 *  The content centre is solved from that: it sits (E_WRITE_SCREEN - 835) / k
 *  world px ABOVE the writing line's mean centre. The creep follows the
 *  writing DOWN the page (camera descends), centred on E_MID so the writing
 *  line's band is centred on its target. */
export const E_WRITE_SCREEN = 1150;
export const E_CREEP = 0.55;
export const E_MID = 205;
const Y_WRITE = HOLD_Y - 32 + WORD_H / 2;
const yE = (f: number) =>
  Y_WRITE - (E_WRITE_SCREEN - 835) / K_CLOSE + E_CREEP * (f - E_MID);

export const cxAt = (f: number) => {
  if (f <= B0) return CX_SKULL;
  if (f <= B1) return CX_SKULL + (CX_WIDE - CX_SKULL) * camEase((f - B0) / (B1 - B0), B_WARP);
  if (f <= D0) return CX_WIDE;
  if (f <= D1) return CX_WIDE + (CX_CLOSE - CX_WIDE) * camEase((f - D0) / (D1 - D0), D_WARP);
  return CX_CLOSE;
};
export const cyAt = (f: number) => {
  if (f <= B0) return yA(f);
  if (f <= B1) return yA(f) + (yC(f) - yA(f)) * camEase((f - B0) / (B1 - B0), B_WARP);
  if (f <= D0) return yC(f);
  if (f <= D1) return yC(f) + (yE(f) - yC(f)) * camEase((f - D0) / (D1 - D0), D_WARP);
  return yE(f);
};

/** PRE-ROLL. The shared damper starts at rest, so a hold that is already
 *  creeping on f0 would open parked for ~5 frames while the damper catches
 *  up. The camera is therefore run from f-PRE_ROLL on the f0 motion extended
 *  backwards (constant k, cx, and cy at its f0 velocity), so it is in steady
 *  state on the cut's first frame. A new helper, not a change to the damper. */
export const PRE_ROLL = 24;
const cyV0 = (cyAt(2) - cyAt(0)) / 2;
const CAM_RAW = buildCamera({
  duration: DURATION + PRE_ROLL,
  K: [...new Array(PRE_ROLL).fill(K[0]), ...K],
  cx: (g) => cxAt(Math.max(0, g - PRE_ROLL)),
  cy: (g) => (g < PRE_ROLL ? cyAt(0) + (g - PRE_ROLL) * cyV0 : cyAt(g - PRE_ROLL)),
});
export const CAM = {
  CAM_AT: (f: number) => CAM_RAW.CAM_AT(f + PRE_ROLL),
  SCREEN_AT: (f: number, wx: number, wy: number) => CAM_RAW.SCREEN_AT(f + PRE_ROLL, wx, wy),
  CX_REST: CAM_RAW.CAM_AT(PRE_ROLL).cx,
  CY_REST: CAM_RAW.CAM_AT(PRE_ROLL).cy,
};

/** One stroke weight, fixed at the open's resolved k (the find is the subject). */
export const K_REST = K_SKULL;
export const STROKE = strokeFor(K_REST);

export const PERSON_X = COL_X0 + COL_W + PERSON_DX;
export const SKULL_X = COL_X0 - SKULL_DX;

/** A flag's bracket box at frame f, world coordinates (after the scroll):
 *  x from flagBox's padding, half-height hugging the phrase's current height. */
export const bracketGeom = (j: number, f: number, scroll: number) => {
  const fl = FLAGS[j];
  const ws = flagWords(COLUMN, fl);
  const last = ws[ws.length - 1];
  const my = COLUMN.lineY(fl.line) + WORD_H / 2 - scroll;
  const hh = FLAG_PAD_Y + phraseH(j, f) / 2;
  return {
    x0: COL_X0 + ws[0].x - FLAG_PAD_X,
    x1: COL_X0 + last.x + last.w + FLAG_PAD_X,
    my,
    hh,
  };
};

// ---------------------------------------------------------------------------
// A new helper (not in punishShared): the bracket whose top and bottom edges
// close in on its phrase as the phrase is pressed. Same draw-on, same stroke,
// same shadow and the same exit thinning as `Bracket`; only the half-height is
// the phrase's, not the fixed box's.
// ---------------------------------------------------------------------------
const PressBracket: React.FC<{
  x0: number;
  x1: number;
  my: number;
  hh: number;
  u: number;
  exit: number;
  stroke: number;
  k: number;
  ink: string;
}> = ({ x0, x1, my, hh, u, exit, stroke, k, ink }) => {
  if (u <= 0 || exit <= 0.004) return null;
  const h = hh * exit;
  return (
    <path
      d={roundRect(x0, my - h, x1, my + h, Math.min(12, h))}
      fill="none"
      stroke={ink}
      strokeWidth={stroke * exit}
      strokeLinejoin="round"
      opacity={INK_LO}
      pathLength={1}
      strokeDasharray={u < 1 ? `${u} ${Math.max(1e-4, 1 - u)}` : undefined}
      style={{ filter: iconShadow(k) }}
    />
  );
};

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

const LightTouchO55: React.FC<Props> = ({
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
  const caret = caretX(frame);
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
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              hAt={(gi, f) => wordH(gi, f) / WORD_H}
              exitAt={exitAt}
              mode="hair"
              opacity={OP_UNREAD_DOT}
            />
            {FLAGS.map((fl, j) => {
              const g = bracketGeom(j, frame, scroll);
              return (
                <PressBracket
                  key={`b${j}`}
                  {...g}
                  u={bracketU(fl.found, frame)}
                  exit={exitAt(g.my)}
                  stroke={STROKE}
                  k={k}
                  ink={ink}
                />
              );
            })}
            {FLAGS.map((fl, j) => {
              const my = COLUMN.lineY(fl.line) + WORD_H / 2 - scroll;
              return (
                <SkullMark
                  key={`s${j}`}
                  x={SKULL_X}
                  y={my}
                  u={bracketU(fl.found, frame)}
                  scale={exitAt(my)}
                  accent={accent}
                  k={k}
                />
              );
            })}
            <ReaderLine yWorld={rY} stroke={STROKE} ink={ink} opacity={INK_HI} k={k} />
            <Caret
              x={COL_X0 + caret.x}
              y={COLUMN.lineY(caret.line) - scroll}
              accent={accent}
            />
          </svg>
          <ReaderPerson x={PERSON_X} y={rY} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default LightTouchO55;
