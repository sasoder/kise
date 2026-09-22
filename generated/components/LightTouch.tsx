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
  BLOCK_CX,
  Bracket,
  COL_W,
  COL_X0,
  Caret,
  FLAG_PAD_Y,
  FPS,
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
// Noam, clip `Noam_Punishing_AIs`, CUT 5 — `LightTouch`, in at 0:33.000.
//
// VERSION 2. V1 was approved at preview and delivered; the note on it was the
// close framing: "the widest word ends 15.8 px inside the right frame edge —
// too tight; the style forbids anything parked at the edge." V1 pinned the
// close by its LEFT edge (world x 100) and let the right take whatever was
// left, so the top of the zoom creep squeezed the longest line against the
// frame. V2 pins it by the RIGHT edge instead — the side with no slack — and
// caps the creep at the k where the sway still leaves 30 px on both sides.
// Nothing else changed: same text, same clock, same reader, same five
// presses, same ceiling, same shot list. Measured, on every one of the 225
// frames: 36.1 px of air outside the skull's ink on the left and 36.4 px
// outside the widest word on the right, against V1's 41.2 and 15.8.
//
//   "You can do that with a very light touch, but every time you intervene
//    based on your observations of the chain of thought, you are implicitly
//    applying a tiny bit of pressure for the model to then, like, hide its
//    chain of thought"
//
// DURATION = round(8.700 * 24) + 16 = 209 + 16 = 225.
//
// Word onsets, frames from this cut's own t0:
//   you 0 · can-do 2 · that 7 · with-a 12 · very 23 · light 29 · touch 36 ·
//   but 49 · every 52 · time 59 · you 64 · intervene 68 · based 76 · on 83 ·
//   your 87 · observations 90 · of-the 99 · chain 104 · of 108 · thought 109 ·
//   you 117 · are 118 · implicitly 120 · applying 132 · a-tiny 139 ·
//   bit-of 145 · pressure 150 · for 156 · the 165 · model 172 · to 177 ·
//   then 180 · like 185 · hide 190 · its 195 · chain 199 · of 202 ·
//   thought 204 · speech ends 209 · tail to 225.
//
// ---------------------------------------------------------------------------
// THE IDEA — PRESSURE IS A PRESS, AND THE TEXT REMEMBERS IT.
//
// The world is `punishShared`'s: the same page of the model's chain of thought
// (`makeColumn(11, 64, ...)`, the clip's one text), the caret writing at the
// bottom of it, the reader descending through it at the clip's constant
// `READER_LPF`, a bracket and an orange skull left behind wherever the reader
// crosses a bad thought. Nothing here is restated from that module; everything
// is imported.
//
// An INTERVENTION is a PRESS. The reader finds a phrase, brackets it — and
// then the bracket's own top and bottom edges close in and the words inside
// are pressed FLATTER. Once. Barely: 22 -> 18 world px. That is "a very light
// touch".
//
// But the text REMEMBERS. Every press lowers a CEILING, and every word the
// caret writes afterwards comes out at that ceiling and stays there for the
// rest of the cut. Five interventions, five steps down — 22, 18, 14, 10.5,
// 7.5, 5 — and then, over "hide its chain of thought", the ceiling eases the
// last of the way to `HAIR_H` on its own: nobody presses it, the model
// finishes the job. The thought is still there and we cannot read it.
//
// ONE MATERIAL. Bar height, and nothing else. No blur, no alpha on a bar, no
// colour change, no new object. The camera opens close on the light touch,
// pulls back once to show the whole column going flat from the top down, and
// pushes back in to the hairlines at the end.
//
// ---------------------------------------------------------------------------
// GESTURES — every one with the word it serves. There are no others.
//
//  1. THE READER DESCENDS            the whole line. `READER_LPF` 0.06 lines
//     and THE CARET WRITES           a frame, constant, never capped; the
//     (continuous, f0-225)           caret at 1/3.4 words a frame. These two
//                                    are the cut's motion floor: something is
//                                    moving on every frame of it.
//  2. FIND 1 + PRESS 1  f22.6/f30-42 "a very LIGHT TOUCH" (29/36). Bracket and
//                                    skull on line 28, then the edges close 2
//                                    px each side and the three words inside
//                                    lose 4 px of height. Ceiling -> 18.
//  3. FIND 2 + PRESS 2  f55.9/f62-72 "every time you INTERVENE" (59/68).
//                                    Line 30. Ceiling -> 14.
//  4. FIND 3 + PRESS 3  f89.3/f94-104 "your OBSERVATIONS of the CHAIN"
//                                    (90/104). Line 32. Ceiling -> 10.5.
//  5. FIND 4 + PRESS 4  f122.6/f128-140 "implicitly APPLYING A TINY bit"
//                                    (132/139). Line 34. Ceiling -> 7.5.
//  6. FIND 5 + PRESS 5  f155.4/f162-174 "pressure FOR THE MODEL" (156-172).
//                                    Line 36. Ceiling -> 5.
//  7. THE CEILING FALLS TO THE       "HIDE its CHAIN of THOUGHT" (190/199/204).
//     HAIRLINE           f184-200    No press, no bracket, no new object: the
//                                    ceiling eases 5 -> HAIR_H and the caret is
//                                    writing hairlines by "chain".
//
// A press also lifts its own bracket from `INK_LO` to `INK_HI` and lets it
// back down 6-18 frames after — that is the ink ladder moving with the role,
// not a gesture of its own, and it is the only opacity that moves in the cut.
//
// ---------------------------------------------------------------------------
// THE CAMERA — two legal framings, and the writing line is the frame's floor.
//
// THE CLIP'S FRAMING RULE. The block (skull ink to person ink) is 812.3 world
// px wide, so a camera on `BLOCK_CX` cannot pass k 1.33 without cutting the
// person in half on the right. Only two framings are legal: WIDE, k <= 1.30
// with the whole block in; and CLOSE, with the person's ink FULLY off the
// right edge (its left edge at screen x >= 1080) and the reader line running
// off with it. The person may straddle the edge only WHILE THE CAMERA IS
// MOVING — measured below: 93 frames at rest close, 63 at rest wide, 70
// inside a move, and zero frames that park a half-visible glyph.
//
// THIS COLUMN HAS ONLY ONE EDGE. The page runs off the top of the frame for
// ever and STOPS at the line the caret is on, so wherever that line lands on
// screen, everything below it is empty field. Centring the camera on the
// reader — only 3.3 lines above the head — was built first and measured: the
// caret sat at screen 1125 at f0 and left 795 px of bare grid under it. So
// the camera PINS THE WRITING LINE near screen y 1240-1312 (V5, the approved
// reference, held it at 1229-1333) and the page fills upward from there; the
// zoom decides how much of the page that is. `wLine(f)` is the writing line's
// screen y, authored directly, and the content centre is solved back out of
// it against the eased `kTrack`, on the same five boundaries with the same
// warps, so framing and zoom always settle together. `blockU` does the same
// for the sideways framing, 0 = close, 1 = block-centred.
//
//   S1  f0-44    k 1.50 -> 1.515, writing line 1240 -> 1262, CLOSE. 11 lines
//                of page filling the frame; the skull is in the left margin,
//                the person and the reader's right-hand dot are off the right
//                edge. A creep in, 0.5 screen px/f of travel, so PRESS 1 is
//                the only new motion in the shot.
//   S2  f44-88   k 1.515 -> 1.10, warp 0.75, writing line -> 1285, close ->
//                block-centred. ONE long pull-back; the person re-enters on
//                the right INSIDE the move. THE DAMPED SHOT LANDS AT f100 —
//                99.7% of the move, four frames before "chain" (104). Presses
//                2 and 3 run inside it. What the wide frame then shows: 15.8
//                lines of page, full height at the top, going flatter all the
//                way down to the caret, skulls stacking in the left margin.
//   S3  f88-150  k 1.10 -> 1.13, writing line 1285 -> 1312. The wide hold:
//                0.44 screen px/f of travel plus a 2.7% zoom creep, so the
//                frame is never parked. Presses 4 and 5.
//   S4  f150-178 k 1.13 -> 1.50, warp 0.65, writing line -> 1258, back to the
//                close framing; the person leaves inside the move. THE DAMPED
//                SHOT LANDS AT f186 — 100.1%, four frames before "hide" (190).
//   S5  f178-227 k 1.50 -> 1.515, writing line 1258 -> 1284. Close on the caret
//                writing hairlines; 0.53 px/f of creep. Nothing lands on f209.
//
// The camera's own cy barely moves in world coordinates, because the page
// scrolls under it — that is this world, not a parked camera: the frame's
// energy never falls below 601 screen px in a frame.
//
// ---------------------------------------------------------------------------
// MEASURED (`$S/LightTouch/measure.ts`, off the tables this file exports).
//   ALL ASSERTIONS PASS.
//
//   camera        max |dv| of a fixed world point 1.340 screen px/f^2 (cap
//                 2.5); max |v| 8.154 px/f. k 1.500 · 1.514 (f44) · 1.101
//                 (f100) · 1.129 (f150) · 1.500 (f186) · 1.514 (f225).
//                 Pull-back 99.7% done at f100, push-in 100.1% at f186.
//   the edges     ON EVERY FRAME OF THE CUT, sway and damper included, the
//                 skull's outer ink keeps 36.1 px of air inside the left edge
//                 (worst at f44) and the widest word of the page keeps 36.4
//                 px inside the right edge (worst at f225). Both >= 30. This
//                 is the V2 fix.
//   framing       at rest CLOSE the person's ink starts at screen x 1138.4 at
//                 worst (rule: >= 1080) and the reader line's right dot is
//                 23.0 px past the edge. At rest WIDE the whole block keeps
//                 80.5 px of air. Zero frames park a half-visible glyph.
//   the reader    6.665 screen px/f at most (cap 45). Line 26.815 -> 40.315;
//                 3.185 to 5.479 lines behind the writing head on every frame
//                 (brief: [3, 6.5]) and the soft cap NEVER binds — the reader
//                 equals its raw constant rate on all 225 frames.
//   the caret     43.0 screen px/f mean while writing, 88.9 peak, plus 15
//                 line-wraps. NOT a capped quantity: the 45 px/f cap is for a
//                 head gliding across the frame, and the caret's speed IS the
//                 word clock (1/3.4 words a frame — 2.4x SLOWER than the
//                 approved reference cut's 1/1.4) times a k that reaches 1.53.
//                 Its peaks are the widest words plus the 18 px inter-word
//                 gap. The wrap itself is one frame, as V5 documented; it is
//                 why the camera holds the column rather than the head.
//   energy        min per-frame energy 644.2 screen px, at f49. Nothing in
//                 this cut is ever still.
//   finds         line 28 f22.6 (table 22) · 30 f55.9 (56) · 32 f89.3 (89) ·
//                 34 f122.6 (122) · 36 f155.4 (156) — max error 0.62 f, and
//                 every bracket is drawn before its own press starts.
//   ceiling       22 -> 18 at f43 -> 14 at f73 -> 10.5 at f105 -> 7.5 at f141
//                 -> 5 at f175 -> 3 at f200, monotone non-increasing on all
//                 225 frames. Every word emitted after f43 is <= 18 high,
//                 after f175 <= 5, and all 81 emitted after f200 are exactly
//                 HAIR_H. Pressed phrases end at 18 / 14 / 10.5 / 7.5 / 5.
//   the text      drawn width non-decreasing on every frame; ZERO word-height
//                 changes anywhere outside a flagged phrase's own press.
//   writing line  screen y 1162.4 .. 1318.0 over the cut, 1185.8 .. 1318.0
//                 from f100 (brief: [1000, 1330]); lowest drawn ink 1331.6,
//                 clear of the 1420 caption line by 88 px.
//   skulls        at f150, screen y 342 / 505 / 649 / 794 / 939 — all five
//                 whole, un-thinned and inside the frame.
//
// KNOWN DEVIATIONS FROM THE BRIEF (each forced by the brief's own numbers or
// by the clip's framing rule):
//  * WRITING RATE 1/3.4 words a frame, not 1/2.8. Seed 11's column runs 4.09
//    words to a line, so at 1/2.8 the head advances 0.0873 lines a frame
//    against the reader's 0.06 and the gap opens 3.30 -> 9.14 lines by f225 —
//    the brief's own [3, 6.5] assertion fails. 1/3.4 gives 3.19 -> 5.48.
//    (1/2.8 would need ~5.95 words a line, which `makeColumn` never gives.)
//  * CLOSE k 1.50-1.515, not the rule's 1.75, and the close is solved from
//    its right edge rather than centred on the text axis 532. THIS CUT'S FIRST
//    GESTURE IS A SKULL IN THE LEFT MARGIN. On the text axis at k 1.75 the
//    frame's left edge falls at world 223.4 and 11 px of the skull's right
//    rim hang on the edge — the same fault the rule forbids for the person.
//    Solving the close from its left edge instead fixes both margins, and
//    then four constraints bound k: the person's ink is only clear above k
//    1.44; the reader's right DOT is only clear (inner edge and all) below
//    the frame-right of world 829.15; the widest word this cut shows (world
//    795.23) caps k at 1.542, and 30 px on both edges with the sway in caps
//    it at 1.518. 1.50-1.515 is inside every one of those, and it satisfies
//    the RULE'S OWN TEST with room to spare — the person's ink starts at
//    screen 1138, not 1080.
//    The wide lands at 1.10 and the push-in at 1.50, as instructed.
//  * CONTENT CENTRE is solved from the writing line's screen y, not eased
//    between the reader and the midpoint of reader-and-writing-line. See THE
//    CAMERA above: the reader-centred version was built and measured, and it
//    leaves 795 px of empty field under the caret at f0.
//  * ALL FIVE SKULLS AT f150: four are up, and the fifth is found at f155.4 —
//    it cannot be there at f150 without moving the find off "pressure" (150) /
//    "for" (156). Its geometry is in frame (screen y 939, whole, un-thinned),
//    so the wide shot does hold the whole accumulation; it completes five
//    frames into the shot, still wide.
//  * STROKE is `strokeFor(k)` evaluated LIVE, not frozen at one resting k.
//    This cut's k swings 1.10-1.515, so a frozen weight would vary +-16% on
//    screen; live it is exactly `STROKE_PX` 6.5 screen px on every frame,
//    which is what the module's "ONE STROKE WEIGHT, in SCREEN px" is for.
//  * A PRESSED BRACKET is drawn through the module's own `Bracket`, with the
//    press passed as `exit` and the stroke PRE-DIVIDED by it, so the box
//    closes on the phrase while the stroke keeps the cut's one weight. The
//    line's own top-exit multiplies in on top and DOES thin the stroke, which
//    is what the module intends. No helper is copied and NOTHING IS ADDED TO
//    `punishShared`.
// ---------------------------------------------------------------------------

export const DURATION = 225;

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
    light: z.number(),
    touch: z.number(),
    intervene: z.number(),
    observations: z.number(),
    chain: z.number(),
    applying: z.number(),
    pressure: z.number(),
    model: z.number(),
    hide: z.number(),
    thought: z.number(),
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
    light: 29,
    touch: 36,
    intervene: 68,
    observations: 90,
    chain: 104,
    applying: 132,
    pressure: 150,
    model: 172,
    hide: 190,
    thought: 204,
  },
});

// ---------------------------------------------------------------------------
// THE PAGE. The clip's one text, at the moment this cut arrives: 30 lines
// written, the caret on line 30, the reader eight tenths of the way down line
// 26. `LINE0` is arbitrary — the scroll subtracts it out — and 64 lines is
// more than the head can reach (it ends on line 45.8).
// ---------------------------------------------------------------------------
const LINE0 = 600;
const PRE_LINES = 30;
/** The writing line's world y. The scroll holds it here; the camera decides
 *  where on screen that lands. */
const HOLD_Y = 1300;

/** Words a frame. Solved, not chosen: the reader must stay 3 to 6.5 lines
 *  behind the head for 225 frames, and seed 11's column runs 4.09 words to a
 *  line, so the head's line rate is `WRITE_RATE / 4.09`. */
const WRITE_RATE = 1 / 3.4;
/** THE CLIP CONSTANT: the reader's rate, lines per frame, the same in all
 *  eight cuts. */
const READER_LPF = 0.06;
/** Solved so the five crossings land on the brief's table (max error 0.62 f). */
const READER_LINE0 = 26.815;

export const COLUMN = makeColumn(11, 64, LINE0);
export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: () => WRITE_RATE,
});

export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);
export const readerLineAt = (f: number) =>
  readerAt({
    f,
    f0: 0,
    line0: READER_LINE0,
    linesPerFrame: READER_LPF,
    capLine: CLOCK.headLine,
  });
/** The reader's own world y, after the scroll. */
export const readerYAt = (f: number) => COLUMN.lineYf(readerLineAt(f)) - scrollAt(f);

// ---------------------------------------------------------------------------
// THE PRESSES. Five interventions on five lines, two lines apart, alternating
// words 0..2 / 1..3 so the brackets do not stack in a straight column.
//
// Each one: the reader crosses the line (`foundByReader` — no bracket in this
// clip is on a timer), the bracket and the skull draw on over `BRACKET_F`, and
// then over the press frames the phrase's words AND the bracket's half-height
// ease down together on a smootherstep. The skull does not change size.
// ---------------------------------------------------------------------------
type Press = {
  /** the line, and the first and last word of the phrase on it */
  line: number;
  k0: number;
  k1: number;
  /** the press window */
  p0: number;
  p1: number;
  /** the phrase's height after it, in world px — and the new ceiling */
  h: number;
};

const PRESSES: Press[] = [
  { line: 28, k0: 0, k1: 2, p0: 30, p1: 42, h: 18 },
  { line: 30, k0: 1, k1: 3, p0: 62, p1: 72, h: 14 },
  { line: 32, k0: 0, k1: 2, p0: 94, p1: 104, h: 10.5 },
  { line: 34, k0: 1, k1: 3, p0: 128, p1: 140, h: 7.5 },
  { line: 36, k0: 0, k1: 2, p0: 162, p1: 174, h: 5 },
];

/** The last step is not a press. Over "hide its chain of thought" the ceiling
 *  eases the rest of the way to the hairline with nothing touching it. */
const TAIL = { p0: 184, p1: 200, h: HAIR_H };

export const FLAGS: Flag[] = PRESSES.map((p) => ({
  line: p.line,
  k0: p.k0,
  k1: p.k1,
  found: foundByReader(COLUMN, p.line, readerLineAt, 0, DURATION),
}));

/** Smootherstep. Zero first AND second derivative at both ends, so a press
 *  neither starts nor stops with a kick — it is the one thing in the frame a
 *  viewer is asked to notice at 5 screen px. */
const ease5 = (u: number) => {
  const t = clamp01(u);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** THE CEILING at frame f, in world px. Monotone non-increasing by
 *  construction: each stage only ever eases down to a lower number. */
export const ceilingAt = (f: number) => {
  let h = WORD_H;
  const stages = [...PRESSES.map((p) => ({ p0: p.p0, p1: p.p1, h: p.h })), TAIL];
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (f >= s.p1) {
      h = s.h;
      continue;
    }
    if (f > s.p0) h = h + (s.h - h) * ease5((f - s.p0) / (s.p1 - s.p0));
    break;
  }
  return h;
};

/** Which press a word belongs to, or -1. */
const PRESS_OF: number[] = COLUMN.WORDS.map(() => -1);
for (let j = 0; j < PRESSES.length; j++) {
  const p = PRESSES[j];
  const ws = COLUMN.LINES[p.line].words;
  for (let q = p.k0; q <= Math.min(p.k1, ws.length - 1); q++) PRESS_OF[ws[q].gi] = j;
}

/** The height a word comes out at, as a fraction of `WORD_H`: the ceiling on
 *  the frame it was emitted. A word already on the page at f0 has EMIT -40, so
 *  it is at full height and stays there. */
const BORN_H: number[] = CLOCK.EMIT.map((e) => Math.min(WORD_H, ceilingAt(e)) / WORD_H);

/** OBSERVABILITY, 1 = full height. A word does not change after it is written
 *  — unless it is inside a flagged phrase, in which case its own press takes
 *  it down once and leaves it there. */
export const hAt = (gi: number, f: number) => {
  const j = PRESS_OF[gi];
  if (j < 0) return BORN_H[gi];
  const p = PRESSES[j];
  const u = ease5((f - p.p0) / (p.p1 - p.p0));
  return BORN_H[gi] + (p.h / WORD_H - BORN_H[gi]) * u;
};

/** A bracket closes with its phrase: half-height goes from `WORD_H/2 + pad`
 *  to `h/2 + pad` (`FLAG_PAD_Y` is the module's), which is what `pressAt`
 *  returns as a fraction of the module's own box. */
export const pressAt = (j: number, f: number) => {
  const p = PRESSES[j];
  const u = ease5((f - p.p0) / (p.p1 - p.p0));
  const h = WORD_H + (p.h - WORD_H) * u;
  return (h / 2 + FLAG_PAD_Y) / (WORD_H / 2 + FLAG_PAD_Y);
};

/** The ink ladder, moving with the role: a bracket is the subject while it is
 *  pressing and context again once it is history. */
const bracketOp = (j: number, f: number) => {
  const p = PRESSES[j];
  const up = clamp01((f - (p.p0 - 6)) / 8);
  const down = clamp01((f - (p.p1 + 6)) / 12);
  return INK_LO + (INK_HI - INK_LO) * up * (1 - down);
};

// ---------------------------------------------------------------------------
// THE CAMERA. Three anchors in the page's own (post-scroll) coordinates, and
// four moves between them. The zoom is a `kTrack`; the content centre is the
// same segment boundaries with the same warps, so framing and zoom settle
// together.
//
// The damper lags, so the k segments FINISH EARLY and the landings below are
// where the DAMPED shot arrives: S2's target stops at f88 and the shot is
// 99.6% done at f100; S4's stops at f178 and the shot is 100.2% done at f186.
// ---------------------------------------------------------------------------
const K_OPEN = 1.5;
const K_OPEN1 = 1.515;
const K_WIDE = 1.1;
const K_WIDE1 = 1.13;
const K_IN = 1.5;
const K_IN1 = 1.515;
const S2_END = 88;
const S4_END = 178;

/** THE WIDEST WORD ON THE PAGE, as a world x. The close framing is solved
 *  against it, so no word is ever parked on the right edge. */
export const WORD_MAX_X = COLUMN.WORDS.reduce((m, w) => Math.max(m, w.x + w.w), 0) + COL_X0;
/** The air the close framing keeps outside the widest word, in SCREEN px. */
const CLOSE_AIR = 38;

/** THE CLOSE FRAMING, solved not chosen. The block is `BLOCK_R - BLOCK_L`
 *  812.3 world px wide, so a camera on `BLOCK_CX` cannot go past k 1.33
 *  before the person's ink leaves the frame half-shown. The clip's rule is
 *  that a close shot therefore takes the person FULLY out on the right and
 *  sits on the text — but THIS cut cannot simply centre on the text axis,
 *  because its first gesture is a SKULL in the left margin: at k 1.75 on x
 *  532 the frame's left edge falls at world 223.4 and 11 px of the skull's
 *  right rim hang on the edge, which is the same fault the rule forbids for
 *  the person.
 *
 *  So the close is solved from its RIGHT edge instead: hold `CLOSE_AIR`
 *  screen px outside the widest word, i.e. the frame's right edge at world
 *  `WORD_MAX_X + CLOSE_AIR / k`, which makes
 *  `cx = WORD_MAX_X + (CLOSE_AIR - FRAME_W/2) / k`. The LEFT air then follows
 *  from the same arithmetic: it is `FRAME_W - CLOSE_AIR - (WORD_MAX_X -
 *  BLOCK_L) * k` screen px, 51.9 at k 1.50 and 39.9 at k 1.53, and the two
 *  margins are equal at k 1.542 — which is the hard ceiling on this cut's
 *  close, since 30 px on both edges needs `k <= 1.5423`.
 *
 *  Three more bounds, all satisfied at 1.50-1.53: the person's ink (world
 *  857.84) is only clear of the right edge above k 1.44 and here starts at
 *  screen 1138-1144 (the rule asks for >= 1080); the reader line's right-hand
 *  DOT must be clear INNER EDGE AND ALL (world 829.15) and runs 10-15 screen
 *  px past the edge; and the skull's ink must never straddle, which the
 *  left-air number is. V1 pinned the LEFT edge at world 100 instead and the
 *  widest word came within 15.8 px of the right edge at the top of the creep;
 *  V2 pins the right edge, which is the side with no slack. */
const cxClose = (k: number) => WORD_MAX_X + (CLOSE_AIR - FRAME_W / 2) / k;

const SEGS = [
  { f0: 0, f1: 44, k0: K_OPEN, k1: K_OPEN1, w0: 1240, w1: 1262, b0: 0, b1: 0, warp: 1 },
  { f0: 44, f1: S2_END, k0: K_OPEN1, k1: K_WIDE, w0: 1262, w1: 1285, b0: 0, b1: 1, warp: 0.75 },
  { f0: S2_END, f1: 150, k0: K_WIDE, k1: K_WIDE1, w0: 1285, w1: 1312, b0: 1, b1: 1, warp: 1 },
  { f0: 150, f1: S4_END, k0: K_WIDE1, k1: K_IN, w0: 1312, w1: 1258, b0: 1, b1: 0, warp: 0.65 },
  { f0: S4_END, f1: DURATION + 2, k0: K_IN, k1: K_IN1, w0: 1258, w1: 1284, b0: 0, b1: 0, warp: 1 },
];

const K_TRACK = kTrack(SEGS, DURATION + 2);

/** A value keyed on the zoom's own segments, with the zoom's own warps, so
 *  framing and zoom always settle together. */
const onSegs = (f: number, key: "w" | "b") => {
  let v = SEGS[0][`${key}0`];
  for (let i = 0; i < SEGS.length; i++) {
    const s = SEGS[i];
    const v0 = s[`${key}0`];
    const v1 = s[`${key}1`];
    if (f >= s.f1) {
      v = v1;
      continue;
    }
    if (f > s.f0) v = v0 + (v1 - v0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    break;
  }
  return v;
};

/** The writing line's SCREEN y, authored directly. */
const wLine = (f: number) => onSegs(f, "w");
/** 0 = the close framing (person out, left edge on the skull's air), 1 = the
 *  whole block centred on `BLOCK_CX`. The person crosses the edge only while
 *  this is moving, never at rest. */
const blockU = (f: number) => onSegs(f, "b");

const kAt = (f: number) => K_TRACK[Math.max(0, Math.min(K_TRACK.length - 1, Math.round(f)))];

/** `buildCamera` puts the content centre at screen `FRAME_H/2 - CAM_LIFT` =
 *  835, so a world y `HOLD_Y` lands at `835 + (HOLD_Y - c) * k`. Invert it. */
const cTarget = (f: number) => HOLD_Y - (wLine(f) - 835) / kAt(f);
const cxTarget = (f: number) => {
  const u = blockU(f);
  return cxClose(kAt(f)) + (BLOCK_CX - cxClose(kAt(f))) * u;
};

export const CAMERA = buildCamera({
  duration: DURATION,
  K: K_TRACK,
  cx: cxTarget,
  cy: cTarget,
});
export const CAM_AT = CAMERA.CAM_AT;
export const SCREEN_AT = CAMERA.SCREEN_AT;

// ---------------------------------------------------------------------------
const LightTouch: React.FC<Props> = ({
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
  const readerY = readerYAt(frame);
  // The top exit: a line leaving through the top THINS to nothing about its
  // own centreline — no alpha anywhere — and its bracket and skull close down
  // on the same number. There is no bottom exit and no bottom clip: the column
  // ends on the writing line and the camera is what keeps it in shot.
  const exitAt = makeExit(cy, k);
  // ONE STROKE WEIGHT, in SCREEN px, held exactly across a zoom that runs
  // 0.93 to 1.26.
  const stroke = strokeFor(k);

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
            {/* the chain of thought, one word at a time, at the height the
                model was allowed when it wrote it */}
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

            {/* what the reader found, closing on it */}
            {FLAGS.map((fl, j) => {
              const ex = exitAt(COLUMN.lineY(fl.line) - scroll + WORD_H / 2);
              if (ex <= 0.004) return null;
              const press = pressAt(j, frame);
              return (
                <Bracket
                  key={`b${j}`}
                  column={COLUMN}
                  flag={fl}
                  u={bracketU(fl.found, frame)}
                  stroke={stroke / press}
                  ink={ink}
                  opacity={bracketOp(j, frame)}
                  scroll={scroll}
                  exit={ex * press}
                  k={k}
                />
              );
            })}

            {/* what the phrase was for */}
            {FLAGS.map((fl, j) => {
              const wy = COLUMN.lineY(fl.line) - scroll;
              const ex = exitAt(wy + WORD_H / 2);
              if (ex <= 0.004) return null;
              return (
                <SkullMark
                  key={`s${j}`}
                  x={COL_X0 - SKULL_DX}
                  y={wy + WORD_H / 2}
                  u={bracketU(fl.found, frame)}
                  scale={ex}
                  accent={accent}
                  opacity={dotOpacity}
                  k={k}
                />
              );
            })}

            {/* us, reading */}
            <ReaderLine yWorld={readerY} stroke={stroke} ink={ink} opacity={INK_HI} k={k} />

            {/* the model, writing */}
            <Caret
              x={head.x + COL_X0}
              y={head.y - scroll}
              accent={accent}
              opacity={dotOpacity}
            />
          </svg>

          {/* who is reading. DOM, never an SVG <image>. */}
          <ReaderPerson x={COL_X0 + COL_W + PERSON_DX} y={readerY} k={k} opacity={INK_HI} />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default LightTouch;

export const STATS = {
  duration: DURATION,
  words: COLUMN.WORDS.length,
  finds: FLAGS.map((f) => Number(f.found.toFixed(1))),
  ceiling: [0, 43, 73, 105, 141, 175, 200, 225].map((f) => [f, Number(ceilingAt(f).toFixed(2))]),
  k: [0, 44, 100, 150, 186, 225].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};
