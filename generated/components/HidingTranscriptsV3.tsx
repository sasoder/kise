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
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { SPINE_OPACITY, STROKE } from "./GoodTrajectory";
import { SKULL_EYES, SKULL_NOSE, SKULL_OUTLINE } from "./ChainOfThought";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `HidingTranscripts`, VERSION 3:
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
//   THE SCAN LINE OURS. A thin white rule across the column with a dot at each
//                 end, travelling DOWN through the written text at a constant
//                 rate, a few lines behind the caret. That is chain-of-thought
//                 monitoring, drawn — and it is the reference's line.
//   A BRACKET     what the scan found: a white rounded box that draws around a
//                 phrase as the line crosses it, from the side the line came.
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
//   Camera        |dv| 1.984 at f2 (bar 2.0), peak |v| 29.3. k 1.60 at the
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
/** The column is inset to 170 so the margin skull has room to be big enough to
 *  read on a phone and still sit inside x 70. */
export const COL_X0 = 170;
export const COL_W = 780;
export const WORD_H = 22;
export const PITCH = 64;
const GAP = 18;
const INDENT = 44;
const PARA_GAP = 16;
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
    while (n < 7) {
      const w = 50 + 140 * hash(gi, 11);
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
const F_SLOW: [number, number] = [50, 66];
const F_LEAVE = 69; // the caret stops writing and goes up the column
const F_BACK = 158; // ...and is back
const F_RESUME = 6;
export const W_AT: number[] = (() => {
  const out: number[] = [];
  let w = 0;
  // six lines are already on screen when we arrive
  for (let i = 0; i < HOLD_LINE; i++) w += LINES[i].words.length;
  for (let f = 0; f <= DURATION + 16; f++) {
    out.push(w);
    const slow = ease5((f - F_SLOW[0]) / (F_SLOW[1] - F_SLOW[0]));
    const away = f >= F_LEAVE && f < F_BACK ? 0 : 1;
    const back = f >= F_BACK ? ease5((f - F_BACK) / F_RESUME) : 0;
    const r = (RATE_FAST + (RATE_SLOW - RATE_FAST) * slow) * away * (f < F_BACK ? 1 : 1);
    w += (f < F_BACK ? r : RATE_SLOW + (RATE_FAST - RATE_SLOW) * back) * (f < F_LEAVE || f >= F_BACK ? 1 : 0);
  }
  return out;
})();
export const wordsAt = (f: number) => W_AT[Math.max(0, Math.min(W_AT.length - 1, Math.round(f)))];

/** How grown word `gi` is at frame f: it appears when the clock reaches it and
 *  takes GROW frames to run out from its own left edge. */
const GROW = 2;
export const grownAt = (gi: number, f: number) => {
  const w = wordsAt(f);
  return clamp01((w - gi) / (GROW * RATE_FAST));
};

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
// THE SCAN LINE. Constant rate down the column, and it never overtakes the line
// being written: past the crossover it creeps at the caret's own rate, blended
// over a short band so the change of rate has no corner in it.
// ---------------------------------------------------------------------------
const SCAN_0 = 4;
const SCAN_RATE = 0.187; // lines per frame
export const scanLineAt = (f: number) => {
  const free = SCAN_0 + SCAN_RATE * f;
  const cap = headLine(f) - 0.32;
  const b = smoothstep(clamp01((free - cap) / 0.7 + 0.5));
  return free + (cap - free) * b;
};

// ---------------------------------------------------------------------------
// THE FLAGS. Three phrases that look like any other words until the scan line
// reaches them. The frame each is found on is SOLVED from the scan's own
// position, never authored: one is already flagged when we arrive, the next two
// are found under "understand" and around "chain".
// ---------------------------------------------------------------------------
export type Flag = { line: number; k0: number; k1: number; found: number };
/** Lines 4, 8 and 12: far enough down the column that all three are still on
 *  screen when the caret goes back for them, which lines 2/6/10 were not — the
 *  first had scrolled to y 139 by f100. */
const FLAG_SPEC: { line: number; k0: number; k1: number }[] = [
  { line: 4, k0: 1, k1: 3 },
  { line: 8, k0: 2, k1: 4 },
  { line: 12, k0: 0, k1: 2 },
];
const BRACKET_F = 6;
export const FLAGS: Flag[] = FLAG_SPEC.map((s) => {
  let found = 0;
  for (let f = -40; f <= DURATION; f += 0.5) {
    if (scanLineAt(Math.max(0, f)) >= s.line + 0.5) {
      found = f;
      break;
    }
  }
  return { ...s, found: Math.max(-BRACKET_F, found) };
});
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
const F_MID: [number, number] = [104, 124];
const F_WIPE1: [number, number] = [124, 141];
const F_DOWN: [number, number] = [141, F_BACK];
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
const K_OPEN = 1.6;
const K_COL = 1.0;
const K_LEAN = 1.1;
const F_OUT: [number, number] = [8, 46];
const F_LEANW: [number, number] = [84, 118];
const F_RET: [number, number] = [132, 162];
const TRACK_F1 = DURATION + 16;
const COL_MID = 535;
const LEAN_MID = 415;

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
  { f0: 0, f1: 48, k0: K_OPEN, k1: K_COL, warp: 0.6 },
  { f0: 48, f1: F_LEANW[0], k0: K_COL, k1: K_COL, warp: 0.9 },
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
    CXT.push(CX);
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
const SKULL_BOX = 56;
const SKULL_STROKE = 3.4;
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

const HidingTranscriptsV3: React.FC<Props> = ({
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
  const scanY = lineYf(scanLineAt(frame)) - scroll + WORD_H / 2;
  // THE EXIT. A line does not pop off the top: over its last EXIT_SPAN screen
  // px of travel its bars THIN — the height closes to nothing about the
  // centreline, no alpha anywhere — and anything riding out with them (a
  // bracket, a skull) closes down on the same number. Below, there is nothing
  // to leave: the writing line is the bottom of the column.
  const EXIT_SPAN = 150;
  const exitAt = (wy: number) => {
    const sy = FRAME_H / 2 + (wy - cy) * k;
    if (sy > 1436) return 0;
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
                  x={COL_X0 - 56}
                  y={wy + WORD_H / 2}
                  scale={ex}
                  u={Math.min(bracketU(fl, frame), skullLeft(fl, frame))}
                  accent={accent}
                  opacity={dotOpacity}
                />
              );
            })}

            {/* we read it: the scan line */}
            <g style={{ filter: icon }}>
              <line
                x1={COL_X0 - 26}
                y1={scanY}
                x2={COL_X0 + COL_W + 26}
                y2={scanY}
                stroke={ink}
                strokeWidth={STROKE * 0.55}
                strokeLinecap="round"
                opacity={SPINE_OPACITY}
              />
              <circle cx={COL_X0 - 26} cy={scanY} r={7} fill={ink} opacity={SPINE_OPACITY} />
              <circle
                cx={COL_X0 + COL_W + 26}
                cy={scanY}
                r={7}
                fill={ink}
                opacity={SPINE_OPACITY}
              />
            </g>

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

export default HidingTranscriptsV3;

export const STATS = {
  duration: DURATION,
  lines: N_LINES,
  words: WORDS.length,
  flags: FLAGS.map((f) => ({ line: f.line, found: Number(f.found.toFixed(1)) })),
  wordsAt: [0, 24, 46, 66, 150, 165].map((f) => [f, Number(wordsAt(f).toFixed(1))]),
  scan: [0, 24, 46, 66, 100, 150, 165].map((f) => [f, Number(scanLineAt(f).toFixed(2))]),
  head: [0, 24, 46, 66, 150, 165].map((f) => [f, Number(headLine(f).toFixed(2))]),
  k: [0, 24, 46, 66, 100, 150, 165].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};
