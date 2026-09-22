import { Img, staticFile } from "remotion";
import {
  ACCENT,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  OP_UNREAD_DOT,
  camEase,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  sway,
} from "./fieldShared";
import { SKULL_EYES, SKULL_NOSE, SKULL_OUTLINE } from "./ChainOfThought";
import { INK, INK_HI, INK_LO } from "./alignShared";

// ---------------------------------------------------------------------------
// `Noam_Punishing_AIs` — the world all eight cuts of this clip stand in.
//
// Noam on chain-of-thought monitoring: the model lays its reasoning out in
// natural language for us to read; the moment we intervene on what we read
// there, we are applying pressure on it to hide.
//
// Orange Dwarkesh, WITH the grid background (`## Dwarkesh style — grid
// background` + `## Orange Dwarkesh style` in MEMORY.md). 24 fps, 1080x1920,
// opaque. Everything that decides how the clip LOOKS lives here; a cut decides
// what happens in it. Nothing in this file is restated from `fieldShared` or
// `alignShared` — it is imported.
//
// THE VOCABULARY, binding for all eight cuts:
//
//   ORANGE = THE MODEL'S THOUGHT, and nothing else.
//     A WORD-BAR is one word of its chain of thought: a solid ACCENT pill on a
//     PITCH grid. Never a letter — this is text at reading distance, which is
//     all we need. THE CARET is the model writing: a solid ACCENT block at the
//     head of the text. It does not blink. It is the only orange thing that
//     moves on its own. Nothing decorative is ever orange.
//
//   WHITE = US.
//     THE READER is a thin scan line with end dots that travels DOWN the column
//     at a CONSTANT rate, with a `person.png` glyph riding beside it in the
//     right margin — the reader is a person, not a machine. A BRACKET is what
//     the reader leaves round what it finds. A SKULL in the LEFT margin of a
//     flagged line is what the phrase was for. All of it is white, all of it on
//     one stroke weight and one opacity ladder.
//
//   BAR HEIGHT = OBSERVABILITY. The clip's one variable. A word at full height
//     (`WORD_H`) is readable. A word pressed toward a hairline (`HAIR_H`) is
//     the model hiding its thought — still there, no longer legible. A word at
//     zero height is gone. Every cut is this world at a different moment with a
//     different camera, and the argument of the clip is carried by that one
//     number moving.
//
// THE MODULE'S DEBTS. The column layout, the word clock (EMIT / grownAt /
// doneAt / headAt / headLine), the 7-frame-smoothed scroll, the arc-length
// caret glide, `roundRect`, `SkullMark`, the `kTrack` camera helper and the
// top-exit thinning are all `HidingTranscriptsV5.tsx`'s, generalised — not
// re-derived. The skull geometry is `ChainOfThought.tsx`'s Lucide path. The
// label type and the `person.png` drawing rule are `alignShared.tsx`'s.
//
// ---------------------------------------------------------------------------
// CLIP IN-POINTS (24 fps; each cut's beats are frames from ITS OWN t0).
//
// S1 t0=3.020  LaidOutToRead      DURATION 136  where 0 · neural 11 · nets 26 · flat 40 · out 45 · reasoning 48 · laying 62 · out 67 · thought 73 · process 78 · natural 92 · language 98 · for-us 105 · read 114 · ends 120
// S2 t0=11.419 BadThoughts        DURATION 88   but-if 0 · look 14 · at 20 · chain 25 · thought 31 · say-oh 37 · model 46 · thinking 54 · bad 59 · thoughts 64 · ends 72
// S3 t0=16.480 NotObservable      DURATION 106  then 0 · happening 13 · model 22 · learns 29 · think 39 · bad 47 · thoughts 50 · way 60 · not 66 · observable 70 · to-us 78 · ends 90
// S4 t0=23.300 AlignmentMetrics   DURATION 118  model 2 · scheming 14 · doing 27 · misaligned 31 · things 40 · way 49 · not 59 · detected 67 · in-our 77 · alignment 89 · metrics 94 · ends 102
// S5 t0=33.000 LightTouch         DURATION 225  you 0 · light 29 · touch 36 · but 49 · every 52 · time 59 · intervene 68 · observations 90 · chain 104 · thought 109 · implicitly 120 · applying 132 · a-tiny 139 · pressure 150 · model 172 · hide 190 · chain 199 · thought 204 · ends 209
// S6 t0=48.840 ControllingItsChain DURATION 103 but 0 · seeing 8 · model 30 · becoming 36 · better 41 · able 52 · controlling 63 · chain 75 · thought 81 · ends 87
// S7 t0=52.920 PeopleAreObserving DURATION 146  because 0 · situation 17 · model 33 · understands 38 · what 49 · chain 61 · thought 69 · that 88 · people 98 · observing 115 · it 122 · ends 130
// S8 t0=67.120 IAmBeingObserved   DURATION 220  if-we 0 · recognize 40 · oh-i 61 · being 75 · observed 79 · i-want 94 · think 120 · bad 132 · thoughts 136 · way 150 · is-not 158 · observable 167 · to-my 179 · monitors 192 · ends 204
//
// ---------------------------------------------------------------------------
// RULES THIS MODULE ENFORCES OR DOCUMENTS. Read them before writing a cut.
//
//  * NOTHING POPS. A word grows from its own left edge over `GROW` frames
//    (`grownAt`). A bracket draws on from its left end over `BRACKET_F`
//    (`bracketU`). A skull draws on with its bracket (`SkullMark`, whose `u`
//    should be the bracket's own). The reader line is drawn on from its left
//    end when it is introduced (`ReaderLine`'s `u`). A label slides up 24 px
//    while fading over 10 frames (`Label`). Nothing anywhere fades in from
//    nothing at full size.
//  * LINES LEAVING THROUGH THE TOP THIN TO ZERO HEIGHT, never to zero alpha.
//    That is `exitAt` — see `makeExit` — and everything riding a line (its
//    bracket, its skull) closes down on the same number.
//  * NO BOTTOM CLIP, EVER. The column ends on its last written line; the camera
//    is what keeps that line in shot. V3 of the reference cut clipped the
//    bottom and the lean silently ate the freshly written words.
//  * ONE STROKE WEIGHT. `STROKE_PX` SCREEN px for the reader line, its end dots
//    and every bracket; each cut fixes it with `strokeFor(kRest)` at its own
//    resolved k, so the weight is the same in all eight cuts.
//  * ONE INK LADDER. `INK_HI` for the subject, `INK_LO` for context. The accent
//    is SOLID at `OP_UNREAD_DOT` — a word-bar and a caret are never
//    transparent, because the accent over this field at any alpha below 1
//    desaturates into the grid.
//  * PER-ICON SHADOW. `iconShadow(k)` on brackets, skulls, the reader line and
//    the person — pass `k` to those components and they wear it. NEVER on the
//    word-bars: they are text, not icons, and a shadow on a hundred of them is
//    a haze.
//  * THE GRID IS CONTINUOUS ACROSS THE CLIP. Every cut passes
//    `frame={GRID_W0 + frame}` to `GridBackground`, so the backdrop's slow
//    drift does not restart on every edit point.
// ---------------------------------------------------------------------------

export const FPS = 24;

/** The `W0` grid phase the reference cut used. Every cut of this clip passes
 *  `frame = GRID_W0 + frame` to `GridBackground` so the grid's drift is
 *  continuous across the eight edit points. */
export const GRID_W0 = 946;

// --- ink --------------------------------------------------------------------
// Re-exported, never restated: the same white and the same two rungs the rest
// of the Orange Dwarkesh sets use.
export { INK, INK_HI, INK_LO } from "./alignShared";

// --- type -------------------------------------------------------------------
// RE-EXPORTED FROM `alignShared`, not copied. A label in this clip is Roboto
// Condensed Bold, ALL CAPS, tracked out 0.04 em, white, and it SLIDES UP
// `LABEL_RISE_PX` (24) screen px while fading in over `LABEL_IN` (10) frames.
// `Label` is a DOM element: it goes in the world <div> beside the <svg>, never
// inside it.
export {
  FONT_LABEL,
  LABEL_IN,
  LABEL_RISE_PX,
  LABEL_TRACKING,
  LABEL_WEIGHT,
  Label,
  labelIn,
} from "./alignShared";

// ---------------------------------------------------------------------------
// GEOMETRY, in world px on a 1080x1920 frame.
//
// The column is the reference cut's exactly — a 22 px word on a 64 px line in a
// 576 px measure reads as text at 270 px wide — except for the x placement,
// which is re-solved because this clip has TWO margins, not one: the skull on
// the left and the reader's person on the right. `COL_X0` is solved so the
// BLOCK (leftmost skull ink to rightmost person ink) is centred on the frame's
// own axis at x 540, which is what the camera then centres on.
// ---------------------------------------------------------------------------
export const WORD_H = 22;
export const PITCH = 64;
export const GAP = 18;
export const INDENT = 44;
export const PARA_GAP = 16;
export const COL_W = 576;

/** The height a "hidden but present" word sits at. `WORD_H` is 1.0 on the
 *  observability scale; `HAIR_H` is what h = 0 draws as when a cut asks
 *  `WordBars` for a hairline (mode "hair") rather than for nothing (mode
 *  "gap"). A hairline still says there is a thought there — we just cannot
 *  read it — which is the whole argument of cuts 3, 6 and 8. */
export const HAIR_H = 3;

/** The left margin mark. 96 world px is ~130 screen px at a typical resolved k,
 *  which is the size the reference cut's feedback asked for. */
export const SKULL_BOX = 96;
export const SKULL_STROKE = 4.6;
/** How far left of the text's left edge the skull's CENTRE sits. */
export const SKULL_DX = 60;

/** The right margin glyph: `person.png`'s box. Its ink is 0.84 of it. */
export const PERSON_BOX = 96;
/** How far right of the text's right edge (`COL_X0 + COL_W`) the person's
 *  CENTRE sits. */
export const PERSON_DX = 78;

/** Half the block either side of the text, solved from the two margins. */
const BLOCK_A = SKULL_DX + SKULL_BOX / 2 + SKULL_STROKE / 2;
const BLOCK_B = COL_W + PERSON_DX + PERSON_BOX / 2;

/** The text's left edge, SOLVED so the block is centred on x 540. */
export const COL_X0 = 540 - (BLOCK_B - BLOCK_A) / 2;
/** The block: leftmost skull ink to rightmost person ink. */
export const BLOCK_L = COL_X0 - BLOCK_A;
export const BLOCK_R = COL_X0 + BLOCK_B;
export const BLOCK_CX = (BLOCK_L + BLOCK_R) / 2;
if (BLOCK_CX !== 540) {
  throw new Error(`punishShared: BLOCK_CX is ${BLOCK_CX}, not 540 — the column solve is wrong`);
}

export const CARET_W = 20;
export const CARET_H = 46;
/** The caret LEADS the word it is writing by a hair, so it is never sitting on
 *  an orange bar of its own colour with no daylight round it. */
export const CARET_LEAD = 11;

/** The reader line overhangs the measure by this much at each end, and ends in
 *  a dot of radius `READER_DOT_R`. */
export const READER_OVERHANG = 16;
export const READER_DOT_R = 7;
export const READER_X0 = COL_X0 - READER_OVERHANG;
export const READER_X1 = COL_X0 + COL_W + READER_OVERHANG;

/** THE ONE STROKE WEIGHT, in SCREEN px: the reader line, its end dots, every
 *  bracket. A cut fixes it once at its own resolved k and passes the result
 *  down, so a stroke is the same weight on screen in all eight cuts however
 *  close the camera is. */
export const STROKE_PX = 6.5;
export const strokeFor = (kRest: number) => STROKE_PX / kRest;

// ---------------------------------------------------------------------------
// THE COLUMN. A ragged-right block of word-bars: words are laid until the line
// is between 62% and 100% full, a paragraph's last line is deliberately short,
// four to six words a line, the occasional indent, a wider gap between
// paragraphs.
//
// `seed` salts the hash. Two cuts that pass the SAME seed and the same
// `nLines` get the SAME text, which is how a later cut can be the same page of
// thought the earlier one was written on; two cuts that pass different seeds
// are looking at different transcripts. `seed = 0` is the identity salt, so
// `makeColumn(0, 34, y)` reproduces the reference cut's own column word for
// word — measured, identical line lengths and widths. Whatever the seed, a
// line holds 3 to 6 words (usually 4) and runs 62-93% of the measure.
// ---------------------------------------------------------------------------
export type Word = { line: number; x: number; w: number; gi: number };
export type TLine = { y0: number; para: number; words: Word[] };
export type Column = {
  LINES: TLine[];
  WORDS: Word[];
  N_LINES: number;
  /** Line i's TOP in world y (before the scroll is taken off). */
  lineY: (i: number) => number;
  /** A FRACTIONAL line index -> its top in world y, so the reader and the
   *  scroll can both live between lines and move continuously. */
  lineYf: (t: number) => number;
};

export const makeColumn = (seed: number, nLines: number, line0Y: number): Column => {
  if (nLines < 2) throw new Error("makeColumn: a column needs at least 2 lines");
  // the salt: both arguments of the reference generator's hash are moved, so
  // two seeds share no sub-sequence of decisions.
  const H = (i: number, k: number) => hash(i + seed * 1013, k + seed * 3);

  const LINES: TLine[] = [];
  const WORDS: Word[] = [];
  let gi = 0;
  let para = 0;
  let sinceBreak = 0;
  for (let i = 0; i < nLines; i++) {
    const lastOfPara = sinceBreak >= 2 && H(i, 3) > 0.62;
    const indent = H(i, 9) > 0.78 ? INDENT : 0;
    const room = COL_W - indent;
    const target = lastOfPara
      ? room * (0.28 + 0.22 * H(i, 5))
      : room * (0.74 + 0.26 * H(i, 7));
    const words: Word[] = [];
    let x = indent;
    let n = 0;
    while (n < 6) {
      const w = 42 + 108 * H(gi, 11);
      if (n >= 4 && x + w > target) break;
      if (x + w > room) break;
      words.push({ line: i, x, w, gi });
      x += w + GAP;
      gi++;
      n++;
      if (x > target && n >= 4) break;
    }
    LINES.push({ y0: 0, para, words });
    for (let q = 0; q < words.length; q++) WORDS.push(words[q]);
    sinceBreak++;
    if (lastOfPara) {
      para++;
      sinceBreak = 0;
    }
  }
  // line tops, with a wider gap between paragraphs
  let y = 0;
  for (let i = 0; i < LINES.length; i++) {
    if (i > 0 && LINES[i].para !== LINES[i - 1].para) y += PARA_GAP;
    LINES[i].y0 = y;
    y += PITCH;
  }

  const lineY = (i: number) =>
    line0Y + LINES[Math.max(0, Math.min(nLines - 1, Math.round(i)))].y0;
  const lineYf = (t: number) => {
    const i = Math.max(0, Math.min(nLines - 2, Math.floor(t)));
    return lineY(i) + (lineY(i + 1) - lineY(i)) * (t - i);
  };
  return { LINES, WORDS, N_LINES: nLines, lineY, lineYf };
};

// ---------------------------------------------------------------------------
// THE WORD CLOCK. One monotone function: how many words have been emitted by
// frame f. Which words exist, where the caret is, how far the column has
// scrolled — all of it is read off this, so none of them can disagree and
// nothing steps.
//
// `rateAt(f)` is the cut's own curve, words per frame, any shape: a flat rate
// is a model thinking steadily, a rate easing down is a model that has noticed
// something. `holds` freezes the clock over `[f0, f1)` spans — the caret is
// away, and the clock HOLDS rather than running back.
//
// GROWTH IS COUNTED IN FRAMES FROM EMIT, not in words of clock. That is the
// reference cut's V4 fix: counted in clock, a word in progress when the clock
// froze sat there part-grown for ninety frames. A word that has been started
// always finishes its own two frames whatever the clock does next.
// ---------------------------------------------------------------------------
export const GROW = 2;
/** How far past `duration` the clock is evaluated, so a cut can read a frame or
 *  two past its own last one without clamping. */
export const CLOCK_PAD = 24;
/** The scroll's smoothing radius: a +-3 frame box, i.e. 7 frames. */
export const SCROLL_SMOOTH_R = 3;

export type Clock = {
  /** Words emitted by frame f, indexed by integer frame. */
  W_AT: number[];
  /** The (fractional) frame each word is emitted on, by inverting `W_AT`. */
  EMIT: number[];
  wordsAt: (f: number) => number;
  /** 0..1: how far word `gi` has run out from its own left edge at frame f. */
  grownAt: (gi: number, f: number) => number;
  /** The frame word `gi` is finished. Bracket rules read off this. */
  doneAt: (gi: number) => number;
  /** The writing head in COLUMN coordinates, as a continuous point. `y` is the
   *  line's TOP, the same convention as `lineY`. */
  headAt: (f: number) => { x: number; line: number; y: number };
  /** ...and as a fractional line index, which is what the scroll and the
   *  reader's cap both use. */
  headLine: (f: number) => number;
  /** The column's scroll at frame f, for a writing line held at world y
   *  `holdY`: `max(0, lineYf(headLine) - holdY)`, smoothed over 7 frames. A
   *  line is 4 to 7 words long, so the raw version's velocity wobbles once per
   *  line; the smoothing takes that out without letting the writing line drift
   *  more than a few px off its hold. Tracks are built once per `holdY`. */
  scrollAt: (f: number, holdY: number) => number;
};

export const makeClock = ({
  column,
  duration,
  preLines,
  rateAt,
  holds = [],
}: {
  column: Column;
  duration: number;
  /** how many lines already exist at f0 */
  preLines: number;
  /** words per frame at frame f */
  rateAt: (f: number) => number;
  /** `[f0, f1)` spans where the clock freezes (the caret is away) */
  holds?: [number, number][];
}): Clock => {
  const F_MAX = duration + CLOCK_PAD;
  const held = (f: number) => {
    for (let i = 0; i < holds.length; i++) {
      if (f >= holds[i][0] && f < holds[i][1]) return true;
    }
    return false;
  };

  const W_AT: number[] = [];
  {
    let w = 0;
    for (let i = 0; i < Math.max(0, Math.min(preLines, column.N_LINES)); i++) {
      w += column.LINES[i].words.length;
    }
    for (let f = 0; f <= F_MAX; f++) {
      W_AT.push(w);
      if (held(f)) continue;
      w += Math.max(0, rateAt(f));
    }
  }

  const EMIT: number[] = [];
  {
    let f = 0;
    for (let gi = 0; gi < column.WORDS.length; gi++) {
      if (W_AT[0] > gi) {
        // already on screen when we arrive: emitted long before f0, so it is
        // fully grown on every frame of the cut.
        EMIT.push(-40);
        continue;
      }
      while (f < W_AT.length - 1 && W_AT[f + 1] <= gi) f++;
      const a = W_AT[f];
      const b = W_AT[Math.min(W_AT.length - 1, f + 1)];
      EMIT.push(b > a ? f + (gi - a) / (b - a) : f);
    }
  }

  const wordsAt = (f: number) => W_AT[Math.max(0, Math.min(W_AT.length - 1, Math.round(f)))];
  const grownAt = (gi: number, f: number) => clamp01((f - EMIT[gi]) / GROW);
  const doneAt = (gi: number) => EMIT[gi] + GROW;

  const wordAtClock = (f: number) => {
    const w = wordsAt(f);
    const i = Math.max(0, Math.min(column.WORDS.length - 1, Math.floor(w)));
    return { word: column.WORDS[i], g: clamp01(w - i), w, i };
  };
  const headAt = (f: number) => {
    const { word, g } = wordAtClock(f);
    return { x: word.x + word.w * g, line: word.line, y: column.lineY(word.line) };
  };
  const headLine = (f: number) => {
    const { word, g } = wordAtClock(f);
    const l = column.LINES[word.line];
    const n = l.words.length;
    const k = word.gi - l.words[0].gi;
    return word.line + (k + g) / n;
  };

  const tracks: { holdY: number; track: number[] }[] = [];
  const scrollTrack = (holdY: number) => {
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].holdY === holdY) return tracks[i].track;
    }
    const raw: number[] = [];
    for (let f = -8; f <= F_MAX; f++) {
      raw.push(Math.max(0, column.lineYf(headLine(Math.max(0, f))) - holdY));
    }
    const out: number[] = [];
    for (let i = 0; i < raw.length; i++) {
      let s = 0;
      let n = 0;
      for (let j = -SCROLL_SMOOTH_R; j <= SCROLL_SMOOTH_R; j++) {
        s += raw[Math.max(0, Math.min(raw.length - 1, i + j))];
        n++;
      }
      out.push(s / n);
    }
    tracks.push({ holdY, track: out });
    return out;
  };
  const scrollAt = (f: number, holdY: number) => {
    const t = scrollTrack(holdY);
    return t[Math.max(0, Math.min(t.length - 1, Math.round(f) + 8))];
  };

  return { W_AT, EMIT, wordsAt, grownAt, doneAt, headAt, headLine, scrollAt };
};

// ---------------------------------------------------------------------------
// THE GLIDE. An eased curved travel between two points, sampled BY ARC LENGTH.
// A raw quadratic runs faster at its ends than in its middle, and with a caret
// crossing 800 px in twenty frames that alone was worth 13 px/f^2. Keep `bow`
// small for the same reason: the tighter the arc, the more the glide costs in
// centripetal acceleration. `u` is 0..1 and should already be eased.
// ---------------------------------------------------------------------------
export const curve = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  u: number,
  bow: number,
) => {
  const cx = (a.x + b.x) / 2 - (b.y - a.y) * bow;
  const cy = (a.y + b.y) / 2 + (b.x - a.x) * bow;
  const at = (t: number) => {
    const m = 1 - t;
    return {
      x: m * m * a.x + 2 * m * t * cx + t * t * b.x,
      y: m * m * a.y + 2 * m * t * cy + t * t * b.y,
    };
  };
  const N = 24;
  const pts = [at(0)];
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    const q = at(i / N);
    cum.push(cum[i - 1] + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y));
    pts.push(q);
  }
  const L = cum[N];
  if (L < 1e-6) return pts[0];
  const t = clamp01(u) * L;
  let i = 1;
  while (i < N && cum[i] < t) i++;
  const g = (t - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
  return {
    x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * g,
    y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * g,
  };
};

// ---------------------------------------------------------------------------
// THE READER. A CONSTANT rate down the column — that is the whole point of it,
// so do not ease it — softly capped so it can never overtake the writing head.
//
// The cap is a SMOOTH minimum, not a clamp: a clamp puts a corner in the
// reader's velocity on the frame it catches up, and the reader is the one thing
// in frame whose steadiness is the argument. `softMin` is the standard
// polynomial smooth-min, C1 everywhere, and it costs at most `soft / 4` lines
// of undershoot where the two curves meet.
// ---------------------------------------------------------------------------
/** How far behind the writing head the reader is held, in lines. */
export const READER_CLEAR = 0.6;
/** The width of the soft corner, in lines. */
export const READER_SOFT = 0.8;

export const softMin = (a: number, b: number, eps: number) => {
  if (eps <= 1e-6) return Math.min(a, b);
  const h = clamp01(0.5 + (b - a) / (2 * eps));
  return b + (a - b) * h - eps * h * (1 - h);
};

export const readerAt = ({
  f,
  f0,
  line0,
  linesPerFrame,
  capLine,
  soft = READER_SOFT,
}: {
  f: number;
  /** the frame the reader is at `line0` */
  f0: number;
  line0: number;
  linesPerFrame: number;
  /** usually `clock.headLine` — the line the reader must not pass */
  capLine?: (f: number) => number;
  soft?: number;
}) => {
  const raw = line0 + (f - f0) * linesPerFrame;
  if (!capLine) return raw;
  return softMin(raw, capLine(f) - READER_CLEAR, soft);
};

// ---------------------------------------------------------------------------
// THE FLAGS. A phrase that looks like any other words until it is boxed. A cut
// supplies `found` — the frame the bracket starts drawing — and the usual way
// to get it is `foundByReader`: the frame the READER'S OWN Y crosses the
// line's centre. So the box is caused by the reader passing over the phrase and
// by nothing else; no bracket in this clip is on a timer.
// ---------------------------------------------------------------------------
export type Flag = { line: number; k0: number; k1: number; found: number };

export const FLAG_PAD_X = 12;
export const FLAG_PAD_Y = 13;
export const BRACKET_F = 6;

export const flagWords = (column: Column, fl: Flag) => {
  const ws = column.LINES[fl.line].words;
  const k1 = Math.max(fl.k0, Math.min(fl.k1, ws.length - 1));
  return ws.slice(Math.max(0, fl.k0), k1 + 1);
};

/** The phrase's box in COLUMN coordinates (x is relative to `COL_X0`, y is
 *  world y before the scroll). */
export const flagBox = (column: Column, fl: Flag) => {
  const ws = flagWords(column, fl);
  const last = ws[ws.length - 1];
  return {
    x0: ws[0].x - FLAG_PAD_X,
    x1: last.x + last.w + FLAG_PAD_X,
    y0: column.lineY(fl.line) - FLAG_PAD_Y,
    y1: column.lineY(fl.line) + WORD_H + FLAG_PAD_Y,
  };
};

/** 0..1: how far a bracket has drawn on, from its left end, over
 *  `BRACKET_F` frames from `found`. */
export const bracketU = (found: number, f: number) => clamp01((f - found) / BRACKET_F);

/** The frame the reader's y first crosses a line's CENTRE, scanned over
 *  `[f0, f1]` and refined to a fraction of a frame. `Infinity` if it never
 *  does — a phrase the reader has not got to yet is simply never boxed. */
export const foundByReader = (
  column: Column,
  line: number,
  readerLineAt: (f: number) => number,
  f0: number,
  f1: number,
) => {
  const target = column.lineY(line) + WORD_H / 2;
  const yAt = (f: number) => column.lineYf(readerLineAt(f));
  let prev = yAt(f0);
  if (prev >= target) return f0;
  for (let f = f0 + 1; f <= f1; f++) {
    const y = yAt(f);
    if (y >= target) {
      const d = y - prev;
      return d > 1e-9 ? f - 1 + (target - prev) / d : f;
    }
    prev = y;
  }
  return Infinity;
};

// ---------------------------------------------------------------------------
// THE TOP EXIT. A line does not pop off the top of frame: over its last
// `EXIT_SPAN` SCREEN px of travel its bars THIN — the height closes to nothing
// about the centreline, no alpha anywhere — and anything riding out with them
// (a bracket, a skull) closes down on the same number.
//
// `makeExit` builds the function a cut hands to `WordBars` and reads for its
// own brackets and skulls. It takes the camera at THIS frame, because the
// number is a screen-space one.
//
// THERE IS NO BOTTOM EXIT AND THERE MUST NEVER BE A BOTTOM CLIP.
// ---------------------------------------------------------------------------
export const EXIT_TOP = 188;
export const EXIT_SPAN = 62;

export const makeExit = (cy: number, k: number, top: number = EXIT_TOP, span: number = EXIT_SPAN) =>
  (wy: number) => clamp01((FRAME_H / 2 + (wy - cy) * k - top) / span);

// ---------------------------------------------------------------------------
// A rounded rectangle as a path that STARTS at the top-left corner and runs
// clockwise, so a `pathLength`/`strokeDasharray` draw-on reads as being drawn
// from the left. Used for every bracket in the clip.
// ---------------------------------------------------------------------------
export const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  [
    `M${x0 + r} ${y0}`,
    `H${x1 - r}`,
    `A${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V${y1 - r}`,
    `A${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    `H${x0 + r}`,
    `A${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V${y0 + r}`,
    `A${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    "Z",
  ].join(" ");

// ---------------------------------------------------------------------------
// COMPONENTS. All pure functions of their props — no hooks anywhere in this
// file. Anything that draws SVG goes inside the world <svg>; `ReaderPerson`
// and `Label` are DOM and go in the world <div> BESIDE it.
// ---------------------------------------------------------------------------

/** THE CHAIN OF THOUGHT. Every grown word as a pill, at a height set by the
 *  cut: `hAt(gi, f)` returns the word's OBSERVABILITY, 1 = full height, 0 =
 *  gone. In mode "hair" the drawn height floors at `HAIR_H`, so a word pressed
 *  all the way down is still a thin orange rule; in mode "gap" it goes to zero
 *  and the rect is simply not drawn. `wipeAt(gi, f)` un-types a word
 *  right-to-left (0 = whole, 1 = gone). `exitAt` is the top thinning.
 *
 *  NO SHADOW HERE, ever: these are text, not icons. */
export const WordBars: React.FC<{
  column: Column;
  clock: Clock;
  frame: number;
  scroll: number;
  accent?: string;
  hAt?: (gi: number, f: number) => number;
  exitAt: (wy: number) => number;
  mode?: "gap" | "hair";
  wipeAt?: (gi: number, f: number) => number;
  opacity?: number;
}> = ({
  column,
  clock,
  frame,
  scroll,
  accent = ACCENT,
  hAt,
  exitAt,
  mode = "gap",
  wipeAt,
  opacity = OP_UNREAD_DOT,
}) => (
  <g>
    {column.LINES.map((l, i) => {
      const wy = column.lineY(i) - scroll;
      const ex = exitAt(wy + WORD_H / 2);
      if (ex <= 0.004) return null;
      return (
        <g key={`l${i}`}>
          {l.words.map((w) => {
            const g = clock.grownAt(w.gi, frame);
            if (g <= 0.001) return null;
            const wipe = wipeAt ? clamp01(wipeAt(w.gi, frame)) : 0;
            const width = w.w * g * (1 - wipe);
            if (width < 0.5) return null;
            const raw = WORD_H * Math.max(0, hAt ? hAt(w.gi, frame) : 1);
            const h = (mode === "hair" ? Math.max(HAIR_H, raw) : raw) * ex;
            if (h < 0.5) return null;
            return (
              <rect
                key={`w${w.gi}`}
                x={w.x + COL_X0}
                y={wy + (WORD_H - h) / 2}
                width={width}
                height={h}
                rx={h / 2}
                fill={accent}
                opacity={opacity}
              />
            );
          })}
        </g>
      );
    })}
  </g>
);

/** WHAT THE READER FOUND. Draws on from its left end on `u`; `exit` closes it
 *  down with its line. Pass `k` for the per-icon shadow. */
export const Bracket: React.FC<{
  column: Column;
  flag: Flag;
  u: number;
  stroke: number;
  ink?: string;
  opacity?: number;
  scroll: number;
  exit?: number;
  k?: number;
}> = ({ column, flag, u, stroke, ink = INK, opacity = INK_LO, scroll, exit = 1, k }) => {
  if (u <= 0 || exit <= 0.004) return null;
  const b = flagBox(column, flag);
  const my = (b.y0 + b.y1) / 2 - scroll;
  const hh = ((b.y1 - b.y0) / 2) * exit;
  return (
    <path
      d={roundRect(b.x0 + COL_X0, my - hh, b.x1 + COL_X0, my + hh, Math.min(12, hh))}
      fill="none"
      stroke={ink}
      strokeWidth={stroke * exit}
      strokeLinejoin="round"
      opacity={opacity}
      pathLength={1}
      strokeDasharray={u < 1 ? `${u} ${Math.max(1e-4, 1 - u)}` : undefined}
      style={k === undefined ? undefined : { filter: iconShadow(k) }}
    />
  );
};

/** THE SKULL in the left margin of a flagged line. Orange, because it is the
 *  model's intent and orange is the model — white ink stays OURS. It draws on
 *  with its bracket: pass the SAME `u`. The outline draws first and the face
 *  arrives after the shape does. `scale` is the line's exit number. */
export const SkullMark: React.FC<{
  x: number;
  y: number;
  u: number;
  scale?: number;
  accent?: string;
  opacity?: number;
  k?: number;
}> = ({ x, y, u, scale = 1, accent = ACCENT, opacity = OP_UNREAD_DOT, k }) => {
  if (u <= 0.01 || scale <= 0.01) return null;
  const s = (SKULL_BOX / 24) * scale;
  const dash = (v: number) => ({
    pathLength: 1,
    strokeDasharray: `${v} ${Math.max(1e-4, 1 - v)}`,
  });
  const line = clamp01(u / 0.76);
  const face = clamp01((u - 0.72) / 0.28);
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s}) translate(-12 -12.5)`}
      fill="none"
      stroke={accent}
      strokeWidth={SKULL_STROKE / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      style={k === undefined ? undefined : { filter: iconShadow(k) }}
    >
      <path d={SKULL_OUTLINE} {...dash(line)} />
      {face > 0 ? <path d={SKULL_NOSE} {...dash(face)} /> : null}
      {face > 0
        ? SKULL_EYES.map((e, i) => (
            <circle key={i} cx={e.cx} cy={e.cy} r={e.r} {...dash(face)} strokeDashoffset={-0.25} />
          ))
        : null}
    </g>
  );
};

/** THE MODEL WRITING. `x`/`y` are the writing head in WORLD coordinates, `y`
 *  being the LINE'S TOP — the same convention as `lineY`, so a cut passes
 *  `head.y - scroll` straight in. The caret is centred on the word band and
 *  leads the head by `lead`. Drawn over everything; never blinks. */
export const Caret: React.FC<{
  x: number;
  y: number;
  accent?: string;
  lead?: number;
  opacity?: number;
  w?: number;
  h?: number;
}> = ({ x, y, accent = ACCENT, lead = CARET_LEAD, opacity = OP_UNREAD_DOT, w = CARET_W, h = CARET_H }) => (
  <rect
    x={x - w / 2 + lead}
    y={y + WORD_H / 2 - h / 2}
    width={w}
    height={h}
    rx={w / 2}
    fill={accent}
    opacity={opacity}
  />
);

/** US, READING. A thin line across the measure with a dot at each end, at world
 *  y `yWorld`. `u` draws it on from its LEFT end when a cut introduces it (the
 *  right-hand dot rides the growing end); it is 1 the rest of the time. The
 *  span is fixed by the module's own geometry, so `column` is accepted for
 *  symmetry with the other components and not read. Pass `k` for the per-icon
 *  shadow. */
export const ReaderLine: React.FC<{
  column?: Column;
  yWorld: number;
  u?: number;
  stroke: number;
  ink?: string;
  opacity?: number;
  k?: number;
}> = (props) => {
  const { yWorld, stroke, ink = INK, opacity = INK_HI, k } = props;
  const u = clamp01(props.u === undefined ? 1 : props.u);
  if (u <= 0.001) return null;
  const x1 = READER_X0 + (READER_X1 - READER_X0) * u;
  return (
    <g
      opacity={opacity}
      style={k === undefined ? undefined : { filter: iconShadow(k) }}
    >
      <line
        x1={READER_X0}
        y1={yWorld}
        x2={x1}
        y2={yWorld}
        stroke={ink}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <circle cx={READER_X0} cy={yWorld} r={READER_DOT_R} fill={ink} />
      <circle cx={x1} cy={yWorld} r={READER_DOT_R} fill={ink} />
    </g>
  );
};

/** WHO IS READING. `person.png`, white, in the RIGHT margin at the reader
 *  line's own height.
 *
 *  IT IS DOM, NOT SVG. `person.png` must be a Remotion `<Img>`: an SVG
 *  `<image>` pointing at `staticFile` races frame capture and flashes. So this
 *  component goes in the world <div> BESIDE the <svg>, inside the same
 *  `translate(...) scale(k)` wrapper — never inside the <svg>. `x`/`y` are its
 *  CENTRE in world coordinates; the usual x is
 *  `COL_X0 + COL_W + PERSON_DX`, which is what `PERSON_BOX` and `PERSON_DX`
 *  are exported for. */
export const ReaderPerson: React.FC<{
  x: number;
  y: number;
  k: number;
  box?: number;
  opacity?: number;
}> = ({ x, y, k, box = PERSON_BOX, opacity = INK_HI }) => (
  <Img
    src={staticFile("person.png")}
    style={{
      position: "absolute",
      left: x - box / 2,
      top: y - box / 2,
      width: box,
      height: box,
      opacity,
      filter: `brightness(0) invert(1) ${iconShadow(k)}`,
    }}
  />
);

// ---------------------------------------------------------------------------
// THE CAMERA. Author the zoom as its own keyed track with `kTrack` — a key per
// frame, eased, segments that MUST meet — and hand it plus a cx/cy pair to
// `buildCamera`, which runs `fieldShared`'s damper over x and y and adds the
// sway. `cy` is the CONTENT centre: the helper adds `CAM_LIFT / k` itself, off
// the eased k, so no cut can forget it and no cut's composition sags while its
// zoom runs.
// ---------------------------------------------------------------------------
export type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };

export const kTrack = (segs: KSeg[], f1: number) => {
  if (segs.length === 0) throw new Error("kTrack: no segments");
  const K: number[] = new Array(f1 + 1).fill(segs[0].k0);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    if (i > 0 && segs[i - 1].f1 !== s.f0) throw new Error("kTrack: k segments must meet");
    if (s.f1 <= s.f0) throw new Error(`kTrack: f${s.f0}-${s.f1} is not a forward segment`);
    for (let f = s.f0; f <= Math.min(f1, s.f1); f++) {
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    }
    for (let f = s.f1 + 1; f <= f1; f++) K[f] = s.k1;
  }
  return K;
};

export type Camera = {
  CAM_AT: (f: number) => { cx: number; cy: number; k: number };
  SCREEN_AT: (f: number, wx: number, wy: number) => number[];
  /** the target tracks, for `GridBackground`'s `cxRest` / `cyRest` */
  CX_REST: number;
  CY_REST: number;
  F: number[];
  K: number[];
  CXT: number[];
  CYT: number[];
};

export const buildCamera = ({
  duration,
  K,
  cx,
  cy,
}: {
  duration: number;
  /** a `kTrack`, one key per frame from 0 */
  K: number[];
  cx: (f: number) => number;
  /** the CONTENT centre — `CAM_LIFT / k` is added here, not by the cut */
  cy: (f: number) => number;
}): Camera => {
  const fLast = K.length - 1;
  if (fLast < duration + 2) {
    throw new Error(`buildCamera: the k track ends at ${fLast}, before duration + 2`);
  }
  const F: number[] = [];
  const CXT: number[] = [];
  const CYT: number[] = [];
  for (let f = 0; f <= fLast; f++) {
    F.push(f);
    CXT.push(cx(f));
    CYT.push(cy(f) + CAM_LIFT / K[f]);
  }
  const table: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= duration + 2; f++) {
    const y = runCamera(f, F, CYT, K);
    const x = runCamera(f, F, CXT, K).cy;
    const d = sway(f);
    table.push({ cx: x + d.dx, cy: y.cy + d.dy, k: y.k });
  }
  const CAM_AT = (f: number) => table[Math.max(0, Math.min(table.length - 1, Math.round(f)))];
  const SCREEN_AT = (f: number, wx: number, wy: number) => {
    const c = CAM_AT(f);
    return [FRAME_W / 2 + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
  };
  return { CAM_AT, SCREEN_AT, CX_REST: CXT[0], CY_REST: CYT[0], F, K, CXT, CYT };
};

// ---------------------------------------------------------------------------
// MEASUREMENT. What a builder proves its cut with before delivery.
// ---------------------------------------------------------------------------
/** The largest single-frame change in a series — a speed, if the series is a
 *  position sampled once a frame. */
export const maxV = (track: number[]) => {
  let m = 0;
  for (let i = 1; i < track.length; i++) m = Math.max(m, Math.abs(track[i] - track[i - 1]));
  return m;
};

/** The largest frame-to-frame change in that speed. This is the number that
 *  says whether a move is smooth. */
export const maxDv = (track: number[]) => {
  let m = 0;
  for (let i = 2; i < track.length; i++) {
    m = Math.max(m, Math.abs(track[i] - 2 * track[i - 1] + track[i - 2]));
  }
  return m;
};

/** Nothing the model has written may un-write itself unless the cut says so.
 *  `allowedDrops(i)` marks the frames where a drop is the point — a redaction,
 *  a line thinning out through the top. Throws, loudly, with the index. */
export const assertNonDecreasing = (
  name: string,
  series: number[],
  allowedDrops: (i: number) => boolean = () => false,
) => {
  for (let i = 1; i < series.length; i++) {
    if (series[i] < series[i - 1] - 1e-9 && !allowedDrops(i)) {
      throw new Error(
        `${name}: decreases at ${i} (${series[i - 1].toFixed(4)} -> ${series[i].toFixed(4)})`,
      );
    }
  }
  return true;
};
