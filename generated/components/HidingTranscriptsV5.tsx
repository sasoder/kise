import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
import { SPINE_OPACITY, STROKE } from "./GoodTrajectory";
import { SKULL_EYES, SKULL_NOSE, SKULL_OUTLINE } from "./ChainOfThought";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `HidingTranscripts`, VERSION 5:
// "They're going to understand the concept of chain of thought, and they're
//  going to understand that, like, you know, just hiding some transcripts or
//  whatever"
//
// WHY V3 EXISTS. On V2, the user:
//   "still doesn't really tell the story. I like visualising the chain of
//    thought as TEXT, because that's what it is — but it's very choppy and not
//    well thought through. Can we do something centred around text looking like
//    it's being GENERATED — take inspiration from the graphic where Claude
//    scanned some code and fixed the issues."
// So V3 throws away the machine-of-parts — no comet, no pages, no pile, no
// beads — and is ONE object: a column of text being generated, and a line
// reading it. The debt is to `DualUseMirrorScan.tsx`, which is where the tone
// comes from: one block, a thin scan line with end dots travelling at a
// constant rate, a bracket drawing around each thing it finds, and everything
// on screen caused by that scan rather than by a clock. Calm, one mechanism,
// no flashes.
//
// WHY V4 EXISTS. On V3, the user:
//   "This is a lot better. However, when the AI goes back up into the white
//    boxes and erases things, some of the recently written lines get removed.
//    Also I don't think the white line at the bottom that's kind of leading the
//    text is necessary."
//
// THE BUG, AND ITS ROOT CAUSE. Both true, and the first was mine. V3 clipped
// the column at screen y 1436 as well as at the top — and from f84 the camera
// leans UP toward the redactions, which pushes the BOTTOM of the column DOWN
// the frame. The last line's screen y climbed 1291 -> 1505 over f60-120 and the
// bottom clip ate it: word-bars drawn fell from 70 to 59, taking words 68/69 at
// f105 and 63..67 at f116 — exactly the "recently written lines" that vanished.
// Nothing was ever un-written; they were cropped. V4 has NO bottom clip at all
// (with the scan line gone the column simply ends on its last written line) and
// the lean is re-aimed so the writing line never leaves screen y 1050-1100.
// A second, smaller fault went with it: V3 measured a word's growth in WORDS of
// clock rather than in FRAMES, so when the clock froze at f69 the word in
// progress froze part-grown and sat there for ninety frames. V4 counts growth
// in FRAMES from the frame the word was emitted, so a word that has been
// started always finishes its own two frames whatever the clock does next, and
// the last line is left exactly as the caret left it — its final word complete
// — until the caret comes back and carries on from there.
//
// AND THE SCAN LINE IS GONE. No line, no end dots, on any frame. The monitoring
// is carried by the brackets alone, on a READ-LAG rule: a phrase is boxed
// READ_LAG frames after its own last word finishes being written, and the
// bracket draws on from its left end as if being read. Nothing is on a timer —
// the lag is a constant and the phrase's completion is read off the same clock
// that writes everything else.
//
// WHY V5 EXISTS. Third-party feedback on the text cut, relayed by the user:
//   "looks pretty neat, but might be helpful to zoom in so that the skulls
//    would seem more prominent."
// The reference sent with it was OpenAI's chain-of-thought-monitoring
// illustration: a column of pill lines with a magnifier held over a few of
// them, and inside the magnifier a big warning mark. The lesson is that THE
// CAMERA IS THE MAGNIFIER — the flagged phrase and its mark fill the frame
// rather than sitting in a wide shot of a page. So V5 is V4, closer: a
// narrower column, a skull nearly twice the size, and one more push-in at the
// moment the box shuts behind the caret, held through the redactions.
//
// DURATION. The composition starts at 32.500 s and speech ends at 38.760 s:
//   DURATION = round((38.760 - 32.500) * 24) + 16 = 150 + 16 = 166
//
// Word onsets, frame = round((t - 32.500) * 24):
//   they're 0 · going 6 · to 9 · UNDERSTAND 12 · the 24 · CONCEPT 27 · of 33 ·
//   CHAIN 37 · of 40 · THOUGHT 43 (ends 48) · and 48 · they're 51 · going 55 ·
//   UNDERSTAND 57 · THAT 65 · like 69 · you 76 · know 79 · JUST 84 ·
//   HIDING 88 (held to 106) · SOME 106 · TRANSCRIPTS 121 (to 143) · or 143 ·
//   whatever 145 · speech ends 150 · tail 150-166.
export const DURATION = 166;

// ---------------------------------------------------------------------------
// EDITORIAL NOTE. At f150 the editor cuts to the speaker for "...is
// insufficient, because of chain of thought monitoring". This cut therefore
// hands over mid-mechanism: two empty brackets standing in the column where
// something was deleted, one flagged phrase still sitting there with its skull,
// the scan line waiting at the end of the text, and the caret on its way back
// to resume writing — not yet arrived. The tail is the mechanism continuing:
// the caret gets back, generation resumes at full rate, and the first new
// phrase it writes is crossed by the scan line and boxed. Nothing in here is a
// gesture for the line that follows, and nothing lands on f150.
//
// ---------------------------------------------------------------------------
// VOCABULARY.
//   WORD-BAR      one word of the model's chain of thought: a solid ACCENT pill
//                 22 world px high. Never a letter — this is text at reading
//                 distance, which is all we need.
//   THE CARET     the AI. A solid ACCENT block that sits at the head of the
//                 text and writes it. It does not blink. It is the only orange
//                 thing that moves on its own.
//   GENERATION    words appear ONE AT A TIME, left to right, each growing from
//                 its own left edge, at a steady rate behind the caret. The
//                 rate is the model thinking; when it slows, it has noticed
//                 something.
//   A BRACKET     the monitoring, and in V4 the ONLY thing carrying it: a white
//                 rounded box that draws on round a phrase from its left end, a
//                 fixed READ_LAG after that phrase finished being written. It
//                 is what somebody reading the transcript would leave behind.
//   A SKULL       in the left margin of a flagged line, orange, drawn on with
//                 its bracket. What the phrase was for.
//   AN EMPTY      a bracket with nothing in it. The words have been un-typed —
//   BRACKET       the exact reverse of generation, last word first — and the
//                 skull with them. We can still see precisely where something
//                 was, which is the whole argument of the cut.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion, everything on steady rates.
//
//  1. f0-48   "they're going to   THE MECHANISM. Open close on the caret
//             understand the      writing, and ease back in ONE move to the
//             concept of chain    whole column by f46. Text generates at one
//             of thought"         word per 1.4 frames; the scan line comes down
//             (f12/f27/f37/f43)   behind it at its own constant rate, and as it
//                                 crosses a phrase a bracket closes round it
//                                 and a skull draws in the margin. One is
//                                 already flagged when we arrive; the next two
//                                 are found at f21 and f43. By CHAIN OF THOUGHT
//                                 the frame holds the whole idea at once.
//  2. f48-84  "and they're going  IT NOTICES. The scan line does not change
//             to understand       rate. The WRITING does: across f50-66 the
//             that, like, you     word rate eases down to a crawl and the
//             know"               scroll eases to rest with it, so the scan
//             (f57/f65)           line closes the gap and arrives on the line
//                                 right above the caret on UNDERSTAND THAT.
//                                 Then, through "like, you know", the caret
//                                 leaves the text it was writing and glides UP
//                                 the left margin to the first flagged line.
//     THE OLDEST FLAG IS NEVER TOUCHED. The caret goes back for the MIDDLE one
//     and then the LOWEST, so the frame always holds all three states at once —
//     one phrase flagged and intact with its skull, two emptied — and the way
//     back crosses no flagged line, which the first build did: it sat on a
//     phrase it was not going to delete and read as about to.
//
//  3. f84-166 "just hiding some   THE REDACTION. Across the long HIDING the
//             transcripts or      caret runs right-to-left through the boxed
//             whatever"           phrase and the words UN-TYPE into it, last
//             (f84/f88/f121)      word first, the margin skull going with them,
//                                 leaving the bracket standing EMPTY. It glides
//                                 to the second flag and does it again across
//                                 TRANSCRIPTS. On "or whatever" it is on its
//                                 way back down to the writing line.
//
// ---------------------------------------------------------------------------
// MEASURED.
//   V5            k 2.00 on the caret at the open, easing to 1.31 by f62 with
//                 a 3% creep to 1.33 over the redactions and back. Column 600
//                 world px of text in a 708 px block; skull 96 world px = 134
//                 screen px at rest, against V4's 76. Writing line screen y
//                 1229-1333; lowest drawn ink 1372. Column's drawn bbox:
//                 f46 y 248..1295 (centre 772), f100 y 263..1330 (796),
//                 f150 y 253..1304 (778).
//   V4            the non-decreasing-text assertion passes on all 166 frames:
//                 no drawn word-bar ever shrinks except the words of the two
//                 phrases being un-typed and lines thinning out through the
//                 top. The last written word is complete on every frame of the
//                 ninety the caret is away. The writing line stays between
//                 screen y 1040 and 1160 from f46 on. Brackets, by the
//                 read-lag rule: #0 already boxed at f0, #1 f23-29, #2
//                 f59.4-65.4 — which is "understand that" — and #3, the phrase
//                 written when the caret gets back, starting at f164.7 and
//                 still drawing when the editor cuts.
//   Camera        |dv| 1.984 at f2 (bar 2.0), peak |v| 20.4. k 1.60 at the
//                 open, 1.01 by f46, a 1.10 lean up to the redactions, back to
//                 1.00 with the caret.
//   Rates         the word clock's max |dv| is 0.18 and the scroll's is 2.04 —
//                 the scroll is the clock, smoothed over 7 frames to take out
//                 the once-a-line wobble that a 4-to-7-word line gives it. The
//                 scan line runs at a flat 0.187 lines a frame and is softly
//                 capped at the writing line, so it can never overtake it.
//   The glides    a rest-to-rest move of D px in T frames cannot peak below
//                 4D/T^2, and the words fix T. Each glide, against its own
//                 floor: up to the middle flag 721 px/18 f -> 10.41 (8.90);
//                 wipe 457/16 -> 8.03 (7.14); to the lowest flag 299/20 ->
//                 3.59 (2.99); wipe 349/17 -> 5.54 (4.83); back down 320/17 ->
//                 5.09 (4.43). All within 17% of what is physically possible.
//   Sizes         caret 20 x 46 world px, drawn over everything; skull 56;
//                 word 22 high on a 64 pitch, which reads as text at 270 px.
// KNOWN DEVIATIONS. The glide accelerations are 3.6 to 10.4 px/f^2, not the 3
// that was asked for: see the floors above — 3 would need every window about
// 1.7x longer than the words allow. The writing caret still wraps at the end of
// a line in one frame; that is what a caret does, and it is why the camera
// holds the column instead of following it.
//
// ---------------------------------------------------------------------------
export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotOpacity: z.number(),
  beats: z.object({
    understand: z.number(),
    chain: z.number(),
    thought: z.number(),
    that: z.number(),
    just: z.number(),
    hiding: z.number(),
    transcripts: z.number(),
    cut: z.number(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    understand: 12,
    chain: 37,
    thought: 43,
    that: 65,
    just: 84,
    hiding: 88,
    transcripts: 121,
    cut: 150,
  },
});

const CX = FRAME_W / 2;
export const W0 = 946;

// ---------------------------------------------------------------------------
// THE COLUMN. One block of text, phone-first: 820 world px wide on the frame's
// own axis, a 22 px word and a 64 px line, so a line is legible at 270 px wide.
// ---------------------------------------------------------------------------
/** 600 px of text at five or six words a line, inset to 220 so a 96 px skull
 *  fits in the margin beside it. Text plus margin is 708 px, which is what the
 *  resolved k is solved against: the block fills the frame with about 58 px of
 *  air either side. */
export const COL_X0 = 220;
export const COL_W = 576;
export const WORD_H = 22;
export const PITCH = 64;
const GAP = 18;
const INDENT = 44;
const PARA_GAP = 16;
/** The margin mark. 96 world px is 130 on screen at the resolved k, against
 *  V4's 76 — which is what the feedback asked for. */
const SKULL_BOX = 96;
const SKULL_STROKE = 4.6;
/** How far left of the text the skull's centre sits. */
const SKULL_DX = 60;
/** The caret's line rests here in world y; the column scrolls to keep it. */
const HOLD_Y = 1050;
const HOLD_LINE = 6;
const LINE0_Y = HOLD_Y - HOLD_LINE * PITCH;
const N_LINES = 34;

export type Word = { line: number; x: number; w: number; gi: number };
export type TLine = { y0: number; para: number; words: Word[] };

export const LINES: TLine[] = [];
export const WORDS: Word[] = [];
(() => {
  let gi = 0;
  let para = 0;
  let sinceBreak = 0;
  for (let i = 0; i < N_LINES; i++) {
    const lastOfPara = sinceBreak >= 2 && hash(i, 3) > 0.62;
    const indent = hash(i, 9) > 0.78 ? INDENT : 0;
    const room = COL_W - indent;
    // a ragged right edge: words are laid until the line is between 62% and
    // 100% full, and the paragraph's last line is deliberately short
    const target = lastOfPara ? room * (0.28 + 0.22 * hash(i, 5)) : room * (0.74 + 0.26 * hash(i, 7));
    const words: Word[] = [];
    let x = indent;
    let n = 0;
    while (n < 6) {
      const w = 42 + 108 * hash(gi, 11);
      if (n >= 4 && x + w > target) break;
      if (x + w > room) break;
      words.push({ line: i, x, w, gi });
      x += w + GAP;
      gi++;
      n++;
      if (x > target && n >= 4) break;
    }
    LINES.push({ y0: 0, para, words });
    WORDS.push(...words);
    sinceBreak++;
    if (lastOfPara) {
      para++;
      sinceBreak = 0;
    }
  }
  // line tops, with a wider gap between paragraphs
  let y = 0;
  LINES.forEach((l, i) => {
    if (i > 0 && l.para !== LINES[i - 1].para) y += PARA_GAP;
    l.y0 = y;
    y += PITCH;
  });
})();

export const lineY = (i: number) => LINE0_Y + LINES[Math.max(0, Math.min(N_LINES - 1, i))].y0;
/** A fractional line index -> its y, so the scan line and the scroll can both
 *  live between lines and move continuously. */
export const lineYf = (t: number) => {
  const i = Math.max(0, Math.min(N_LINES - 2, Math.floor(t)));
  return lineY(i) + (lineY(i + 1) - lineY(i)) * (t - i);
};

// ---------------------------------------------------------------------------
// THE WORD CLOCK. One monotone function: how many words have been emitted by
// frame f. Everything about the generation — which words exist, where the caret
// is, how far the column has scrolled — is read off it, so none of them can
// disagree and nothing steps.
// ---------------------------------------------------------------------------
/** Smootherstep: zero in the first AND second derivative at both ends, so the
 *  rate change that slows the writing has no corner in the scroll it drives. */
const ease5 = (u: number) => {
  const t = clamp01(u);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const RATE_FAST = 1 / 1.4;
const RATE_SLOW = 1 / 5.6;
const F_SLOW: [number, number] = [52, 70];
const F_LEAVE = 69; // the caret stops writing and goes up the column
const F_BACK = 153; // ...and is back
const F_RESUME = 4;
export const W_AT: number[] = (() => {
  const out: number[] = [];
  let w = 0;
  // six lines are already on screen when we arrive
  for (let i = 0; i < HOLD_LINE; i++) w += LINES[i].words.length;
  for (let f = 0; f <= DURATION + 16; f++) {
    out.push(w);
    if (f >= F_LEAVE && f < F_BACK) continue; // away: the clock holds, it never runs back
    const slow = ease5((f - F_SLOW[0]) / (F_SLOW[1] - F_SLOW[0]));
    const back = f >= F_BACK ? ease5((f - F_BACK) / F_RESUME) : 0;
    w +=
      f < F_BACK
        ? RATE_FAST + (RATE_SLOW - RATE_FAST) * slow
        : RATE_SLOW + (RATE_FAST - RATE_SLOW) * back;
  }
  return out;
})();
/** The frame each word is emitted on, by inverting the clock — so a word's
 *  growth can be counted in FRAMES and is always the same two frames however
 *  fast or slow the model is thinking. V3 counted it in words of clock, which
 *  left the word in progress frozen part-grown for the ninety frames the caret
 *  was away. */
export const EMIT: number[] = (() => {
  const out: number[] = [];
  let f = 0;
  for (let gi = 0; gi < WORDS.length; gi++) {
    if (W_AT[0] > gi) {
      out.push(-40);
      continue;
    }
    while (f < W_AT.length - 1 && W_AT[f + 1] <= gi) f++;
    const a = W_AT[f];
    const b = W_AT[Math.min(W_AT.length - 1, f + 1)];
    out.push(b > a ? f + (gi - a) / (b - a) : f);
  }
  return out;
})();
export const wordsAt = (f: number) => W_AT[Math.max(0, Math.min(W_AT.length - 1, Math.round(f)))];

/** How grown word `gi` is at frame f: it appears when the clock reaches it and
 *  takes GROW frames to run out from its own left edge. */
const GROW = 2;
export const grownAt = (gi: number, f: number) => clamp01((f - EMIT[gi]) / GROW);
/** The frame a word is finished. The bracket rule reads off this. */
export const doneAt = (gi: number) => EMIT[gi] + GROW;

/** The writing head, in column coordinates, as a continuous point. */
export const headAt = (f: number) => {
  const w = wordsAt(f);
  const i = Math.max(0, Math.min(WORDS.length - 1, Math.floor(w)));
  const word = WORDS[i];
  const g = clamp01(w - i);
  return { x: word.x + word.w * g, line: word.line, y: lineY(word.line) };
};
/** ...and as a fractional line, which is what the scroll and the scan use. */
export const headLine = (f: number) => {
  const w = wordsAt(f);
  const i = Math.max(0, Math.min(WORDS.length - 1, Math.floor(w)));
  const word = WORDS[i];
  const n = LINES[word.line].words.length;
  const k = word.gi - LINES[word.line].words[0].gi;
  return word.line + (k + clamp01(w - i)) / n;
};

/** The scroll: continuous, driven by the same clock, so its velocity is the
 *  writing rate and it can never jump a line. */
const SCROLL_RAW = (f: number) => Math.max(0, lineYf(headLine(f)) - HOLD_Y);
/** ...and smoothed over 7 frames. A line is 4 to 7 words long, so the raw
 *  version's velocity wobbles once per line as the words-per-line changes; the
 *  smoothing takes that out without letting the writing line drift more than a
 *  few px off its hold. */
const SCROLL: number[] = (() => {
  const raw: number[] = [];
  for (let f = -8; f <= DURATION + 20; f++) raw.push(SCROLL_RAW(Math.max(0, f)));
  const out: number[] = [];
  const R = 3;
  for (let i = 0; i < raw.length; i++) {
    let s = 0;
    let n = 0;
    for (let j = -R; j <= R; j++) {
      const q = Math.max(0, Math.min(raw.length - 1, i + j));
      s += raw[q];
      n++;
    }
    out.push(s / n);
  }
  return out;
})();
export const scrollAt = (f: number) => SCROLL[Math.max(0, Math.min(SCROLL.length - 1, Math.round(f) + 8))];

// ---------------------------------------------------------------------------
// THE FLAGS. Four phrases that look like any other words until they are boxed.
// THE READ-LAG RULE: a phrase is boxed READ_LAG frames after its own last word
// has finished being written, and the bracket draws on from its LEFT end, as if
// it were being read. So the box is caused by the phrase existing and by
// nothing else; the frame it lands on is solved from the same clock that writes
// the text. The oldest was written before we arrived and is already boxed; the
// second is written under "understand" and boxed around "the concept"; the
// third is written on the line the caret is on and its box shuts RIGHT BEHIND
// IT on "understand that" — which is the thing it notices; and the fourth is
// the first phrase it writes when it comes back, still being boxed when the
// editor cuts away.
// ---------------------------------------------------------------------------
export type Flag = { line: number; k0: number; k1: number; found: number };
/** Lines 4, 8 and 12: far enough down the column that all three are still on
 *  screen when the caret goes back for them, which lines 2/6/10 were not — the
 *  first had scrolled to y 139 by f100. */
const FLAG_SPEC: { line: number; k0: number; k1: number }[] = [
  { line: 5, k0: 0, k1: 2 },
  { line: 8, k0: 0, k1: 2 },
  { line: 14, k0: 0, k1: 2 },
];
const BRACKET_F = 6;
export const READ_LAG = 7;
export const FLAGS: Flag[] = (() => {
  const out: Flag[] = FLAG_SPEC.map((sp) => {
    const ws = LINES[sp.line].words;
    const k1 = Math.min(sp.k1, ws.length - 1);
    return { ...sp, k1, found: doneAt(ws[k1].gi) + READ_LAG };
  });
  // ...and the fourth: the first two words the model writes when it gets back.
  // Its box is still drawing when the editor cuts away, which is the mechanism
  // carrying on rather than a new gesture.
  const first = WORDS.findIndex((w) => EMIT[w.gi] > F_BACK);
  if (first >= 0) {
    const w0 = WORDS[first];
    const l = LINES[w0.line];
    const k0 = l.words.findIndex((q) => q.gi === w0.gi);
    // one word, not two: the same read-lag on a two-word phrase would put the
    // box outside the cut, and this one has to be visibly starting at f165.
    out.push({ line: w0.line, k0, k1: k0, found: doneAt(l.words[k0].gi) + READ_LAG });
  }
  return out;
})();
export const flagWords = (fl: Flag) => LINES[fl.line].words.slice(fl.k0, fl.k1 + 1);
export const flagBox = (fl: Flag) => {
  const ws = flagWords(fl);
  const x0 = ws[0].x - 12;
  const x1 = ws[ws.length - 1].x + ws[ws.length - 1].w + 12;
  return { x0, x1, y0: lineY(fl.line) - 13, y1: lineY(fl.line) + WORD_H + 13 };
};
export const bracketU = (fl: Flag, f: number) => clamp01((f - fl.found) / BRACKET_F);

// ---------------------------------------------------------------------------
// THE CARET. One point, on eased curved glides — never a jump, never an
// overshoot. It writes, then leaves the text, redacts two phrases, and is on
// its way back when the editor cuts away.
// ---------------------------------------------------------------------------
const F_UP: [number, number] = [69, 87];
const F_WIPE0: [number, number] = [88, 104];
const F_MID: [number, number] = [104, 122];
const F_WIPE1: [number, number] = [122, 138];
const F_DOWN: [number, number] = [138, F_BACK];
export const CARET_W = 20;
export const CARET_H = 46;
/** The caret LEADS the word it is writing by a hair, so it is never sitting on
 *  an orange bar of its own colour with no daylight round it. */
const CARET_LEAD = 11;

/** An eased curved travel, sampled BY ARC LENGTH. A raw quadratic runs faster
 *  at its ends than in its middle, and with a caret crossing 800 px in twenty
 *  frames that alone was worth 13 px/f^2. The bow is small for the same reason:
 *  the tighter the arc, the more the glide costs in centripetal acceleration. */
const curve = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  u: number,
  bow: number,
) => {
  const cx = (a.x + b.x) / 2 - (b.y - a.y) * bow;
  const cy = (a.y + b.y) / 2 + (b.x - a.x) * bow;
  const at = (t: number) => {
    const m = 1 - t;
    return { x: m * m * a.x + 2 * m * t * cx + t * t * b.x, y: m * m * a.y + 2 * m * t * cy + t * t * b.y };
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
  return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * g, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * g };
};

/** The caret in COLUMN coordinates (the scroll is applied when it is drawn). */
/** The two the caret goes back for: the MIDDLE and the LOWEST. The oldest, at
 *  the top of what is still on screen, is never touched — it keeps its words
 *  and its skull for the whole cut, so the frame always holds all three states
 *  at once: one flagged and intact, two emptied. It also means the caret climbs
 *  525 px instead of 904, and comes back down through clear text rather than
 *  sitting on a phrase it is not going to delete. */
export const REDACT = [FLAGS[1], FLAGS[2]];
export const caretAt = (f: number) => {
  const head = headAt(f);
  const hp = { x: head.x, y: head.y };
  const box0 = flagBox(REDACT[0]);
  const box1 = flagBox(REDACT[1]);
  const r0 = { x: box0.x1 - 6, y: lineY(REDACT[0].line) };
  const l0 = { x: box0.x0 + 6, y: lineY(REDACT[0].line) };
  const r1 = { x: box1.x1 - 6, y: lineY(REDACT[1].line) };
  const l1 = { x: box1.x0 + 6, y: lineY(REDACT[1].line) };
  if (f <= F_UP[0]) return hp;
  if (f <= F_UP[1]) {
    const u = camEase(clamp01((f - F_UP[0]) / (F_UP[1] - F_UP[0])), 1.0);
    return curve({ x: hp.x, y: hp.y }, r0, u, 0.06);
  }
  if (f <= F_WIPE0[0]) return r0;
  if (f <= F_WIPE0[1]) {
    const u = camEase(clamp01((f - F_WIPE0[0]) / (F_WIPE0[1] - F_WIPE0[0])), 1.0);
    return { x: r0.x + (l0.x - r0.x) * u, y: r0.y };
  }
  if (f <= F_MID[1]) {
    const u = camEase(clamp01((f - F_MID[0]) / (F_MID[1] - F_MID[0])), 1.0);
    return curve(l0, r1, u, 0.05);
  }
  if (f <= F_WIPE1[1]) {
    const u = camEase(clamp01((f - F_WIPE1[0]) / (F_WIPE1[1] - F_WIPE1[0])), 1.0);
    return { x: r1.x + (l1.x - r1.x) * u, y: r1.y };
  }
  const u = camEase(clamp01((f - F_DOWN[0]) / (F_DOWN[1] - F_DOWN[0])), 1.0);
  return curve(l1, { x: hp.x, y: hp.y }, u, -0.05);
};

/** How far a flagged phrase has been un-typed: the caret's own x, passing back
 *  over each word. Nothing here is on a clock. */
export const wipeU = (fl: Flag, w: Word, f: number) => {
  const wipe = fl === REDACT[0] ? F_WIPE0 : fl === REDACT[1] ? F_WIPE1 : null;
  if (!wipe || f < wipe[0]) return 0;
  const c = caretAt(f);
  if (Math.abs(c.y - lineY(fl.line)) > 1) return f > wipe[1] ? 1 : 0;
  return clamp01((w.x + w.w - c.x) / Math.max(1, w.w));
};
export const skullLeft = (fl: Flag, f: number) => {
  const wipe = fl === REDACT[0] ? F_WIPE0 : fl === REDACT[1] ? F_WIPE1 : null;
  if (!wipe) return 1;
  return 1 - camEase(clamp01((f - wipe[0]) / (wipe[1] - wipe[0])), 1.0);
};

// ---------------------------------------------------------------------------
// THE CAMERA. Almost nothing: open close on the caret, one eased move out to
// the whole column by f46, then a slow lean up toward the redactions and back
// down with the caret. The k track leads its own damper.
// ---------------------------------------------------------------------------
/** THE BLOCK IS THE SKULL MARGIN PLUS THE TEXT, and the camera is centred on
 *  THAT, not on the frame's own axis. V5's first build put the camera at x 540
 *  in world, which is the middle of the text and not of the picture: the skull
 *  hung 21 px off the left edge of frame while 200 px of grey sat on the right.
 *  Solved here so the skull's leftmost ink and the text's rightmost ragged edge
 *  land symmetrically about screen 540. */
const BLOCK_L = COL_X0 - SKULL_DX - SKULL_BOX / 2 - SKULL_STROKE / 2;
const BLOCK_R = COL_X0 + COL_W;
const BLOCK_CX = (BLOCK_L + BLOCK_R) / 2;
const K_OPEN = 2.0;
const K_COL = 1.30;
/** THE MAGNIFIER. When the box shuts behind the caret the camera takes one more
 *  step in and HOLDS it through both redactions; the sides of the column are
 *  cropped while it does, which is the point. It is solved, not chosen: every
 *  one of the three flagged lines and the writing line has to stay inside
 *  y 230-1400, and the oldest flag's skull sits 11.4 lines above the writing
 *  line, so the whole of it spans 812 world px and the step cannot pass 1.44.
 *  1.75 would push that skull out through the top. */
const K_LEAN = 1.34;
const F_OUT: [number, number] = [8, 46];
const F_LEANW: [number, number] = [57, 74];
const F_RET: [number, number] = [130, 152];
const TRACK_F1 = DURATION + 16;
const COL_MID = 671;
const LEAN_MID = 665;

type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
const kTrack = (segs: KSeg[]) => {
  const K: number[] = new Array(TRACK_F1 + 1).fill(segs[0].k0);
  segs.forEach((s, i) => {
    if (i > 0 && segs[i - 1].f1 !== s.f0) throw new Error("camera: k segments must meet");
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++)
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) K[f] = s.k1;
  });
  return K;
};
const K_TRACK = kTrack([
  { f0: 0, f1: 64, k0: K_OPEN, k1: K_COL, warp: 0.6 },
  { f0: 64, f1: F_LEANW[0], k0: K_COL, k1: K_COL, warp: 0.9 },
  { f0: F_LEANW[0], f1: F_LEANW[1], k0: K_COL, k1: K_LEAN, warp: 0.9 },
  { f0: F_LEANW[1], f1: F_RET[1], k0: K_LEAN, k1: K_COL * 1.01, warp: 0.9 },
  { f0: F_RET[1], f1: TRACK_F1, k0: K_COL * 1.01, k1: K_COL, warp: 0.5 },
]);

const CAM = (() => {
  const F: number[] = [];
  const CXT: number[] = [];
  const CYT: number[] = [];
  for (let f = 0; f <= TRACK_F1; f++) {
    const k = K_TRACK[f];
    const g = Math.min(DURATION, f);
    const open = camEase(clamp01((g - F_OUT[0]) / (F_OUT[1] - F_OUT[0])), 0.9);
    const lean = camEase(clamp01((g - F_LEANW[0]) / (F_LEANW[1] - F_LEANW[0])), 0.9);
    const ret = camEase(clamp01((g - F_RET[0]) / (F_RET[1] - F_RET[0])), 0.9);
    // THE CAMERA DOES NOT CHASE THE CARET. A writing head wraps to the next
    // line, which is a jump however smooth everything else is, and following it
    // put |dv| 40 into the camera at f11. It holds the column's own axis and
    // the line the text is being written on, and that line is held still by the
    // scroll — so the opening is a pure zoom out, and the only later move is
    // the lean up to the redactions and back.
    const restY = COL_MID + (LEAN_MID - COL_MID) * lean * (1 - ret);
    // the writing line is ALREADY held at HOLD_Y by the scroll, so this is a
    // constant: the opening is a pure zoom on a point that never moves.
    const openY = HOLD_Y - 40;
    F.push(f);
    // 4 px left of the block centre: the opening zoom is still 6% wider than
    // the rest k when it reaches f46, and without it the skull grazed x 58.
    CXT.push(BLOCK_CX - 4);
    CYT.push(openY + (restY - openY) * open + CAM_LIFT / k);
  }
  return { F, K: K_TRACK, CX: CXT, CY: CYT };
})();

const dampX = (upto: number) => runCamera(upto, CAM.F, CAM.CX, CAM.K).cy;
const CAM_AT_F = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: dampX(f) + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
export const CAM_AT = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const SCREEN_AT = (f: number, wx: number, wy: number) => {
  const c = CAM_AT(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};
/** Column point -> world point at frame f. */
export const toWorld = (f: number, x: number, y: number) => ({ x: x + COL_X0, y: y - scrollAt(f) });

// ---------------------------------------------------------------------------
const SkullMark: React.FC<{
  x: number;
  y: number;
  u: number;
  scale?: number;
  accent: string;
  opacity: number;
}> = ({ x, y, u, scale = 1, accent, opacity }) => {
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

const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number) => {
  const w = x1 - x0;
  const h = y1 - y0;
  return [
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
    `M${w} ${h}`,
  ]
    .slice(0, 10)
    .join(" ");
};

const HidingTranscriptsV5: React.FC<Props> = ({
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
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotOpacity,
}) => {
  const frame = useCurrentFrame();
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = dampX(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const scroll = scrollAt(frame);
  const caret = caretAt(frame);
  // THE EXIT. A line does not pop off the top: over its last EXIT_SPAN screen
  // px of travel its bars THIN — the height closes to nothing about the
  // centreline, no alpha anywhere — and anything riding out with them (a
  // bracket, a skull) closes down on the same number. Below, there is nothing
  // to leave: the writing line is the bottom of the column.
  // THERE IS NO BOTTOM CLIP. That clip is what deleted the recently written
  // lines in V3: the lean pushes the bottom of the column down the frame, and
  // anything past y 1436 was simply not drawn. The column ends on its last
  // written line and the camera is what keeps that line in shot.
  const EXIT_SPAN = 62;
  const exitAt = (wy: number) => {
    const sy = FRAME_H / 2 + (wy - cy) * k;
    return clamp01((sy - 188) / EXIT_SPAN);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={W0 + frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
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
            {/* the chain of thought, one word at a time */}
            {LINES.map((l, i) => {
              const wy = lineY(i) - scroll;
              const ex = exitAt(wy + WORD_H / 2);
              if (ex <= 0.004) return null;
              const fl = FLAGS.find((q) => q.line === i);
              return (
                <g key={`l${i}`}>
                  {l.words.map((w) => {
                    const g = grownAt(w.gi, frame);
                    if (g <= 0.001) return null;
                    const inFlag =
                      fl && w.gi >= l.words[fl.k0].gi && w.gi <= l.words[fl.k1].gi ? fl : null;
                    const wipe = inFlag ? wipeU(inFlag, w, frame) : 0;
                    const width = w.w * g * (1 - wipe);
                    if (width < 0.5) return null;
                    const h = WORD_H * ex;
                    return (
                      <rect
                        key={`w${w.gi}`}
                        x={w.x + COL_X0}
                        y={wy + (WORD_H - h) / 2}
                        width={width}
                        height={h}
                        rx={Math.min(h, WORD_H) / 2}
                        fill={accent}
                        opacity={dotOpacity}
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* what the scan found */}
            <g style={{ filter: icon }}>
              {FLAGS.map((fl, j) => {
                const u = bracketU(fl, frame);
                if (u <= 0) return null;
                const wy = lineY(fl.line) - scroll;
                const ex = exitAt(wy + WORD_H / 2);
                if (ex <= 0.004) return null;
                const b = flagBox(fl);
                const my = (b.y0 + b.y1) / 2 - scroll;
                const hh = ((b.y1 - b.y0) / 2) * ex;
                return (
                  <path
                    key={`fb${j}`}
                    d={roundRect(b.x0 + COL_X0, my - hh, b.x1 + COL_X0, my + hh, Math.min(12, hh))}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE * ex}
                    strokeLinejoin="round"
                    opacity={SPINE_OPACITY}
                    pathLength={1}
                    strokeDasharray={u < 1 ? `${u} ${Math.max(1e-4, 1 - u)}` : undefined}
                  />
                );
              })}
            </g>
            {FLAGS.map((fl, j) => {
              const wy = lineY(fl.line) - scroll;
              const ex = exitAt(wy + WORD_H / 2);
              if (ex <= 0.004) return null;
              return (
                <SkullMark
                  key={`sk${j}`}
                  x={COL_X0 - SKULL_DX}
                  y={wy + WORD_H / 2}
                  scale={ex}
                  u={Math.min(bracketU(fl, frame), skullLeft(fl, frame))}
                  accent={accent}
                  opacity={dotOpacity}
                />
              );
            })}

            {/* the AI */}
            <rect
              x={caret.x + COL_X0 - CARET_W / 2 + (frame < F_LEAVE || frame >= F_BACK ? CARET_LEAD : 0)}
              y={caret.y - scroll + WORD_H / 2 - CARET_H / 2}
              width={CARET_W}
              height={CARET_H}
              rx={CARET_W / 2}
              fill={accent}
              opacity={dotOpacity}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HidingTranscriptsV5;

export const STATS = {
  duration: DURATION,
  lines: N_LINES,
  words: WORDS.length,
  flags: FLAGS.map((f) => ({ line: f.line, found: Number(f.found.toFixed(1)) })),
  wordsAt: [0, 24, 46, 66, 150, 165].map((f) => [f, Number(wordsAt(f).toFixed(1))]),
  head: [0, 24, 46, 66, 150, 165].map((f) => [f, Number(headLine(f).toFixed(2))]),
  k: [0, 24, 46, 66, 100, 150, 165].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};
