// ---------------------------------------------------------------------------
// rsi-another-jump — THE OUTPUT WORLD shared by cut 2 (`PassableLimerick`) and
// cut 7 (`WholeVideoGames`).
//
// Cut 2 writes one small 2022 output card: GPT-3.5's caret writes a five-line
// limerick (word-bars in the AABBA shape: long, long, short, short, long) and
// then autocompletes the two-line body of a Python function whose `def` line a
// person had already typed (white = people). Cut 7 opens on cut 2's RESOLVED
// card and dwarfs it. Everything cut 7 needs to draw that card exactly lives
// here: the card geometry, the deterministic bar layout, the header (OpenAI
// mark + GPT-3.5 label), the writing schedule, and cut 2's camera.
//
// WORLD UNITS. The world is 1080x1920 at k 1, and cut 2's resolved camera sits
// at k ~ 1 with the card centred, so a world px at rest is a screen px. The
// card is 600 x 370 world px, centred on (540, 870).
//
// COLOUR. Bars and caret are solid ACCENT (the model writing, lit). The model's
// mark is ACCENT_DEEP (an old model). The `def` line is white INK_HI (a person
// typed it). The card outline and the label are white.
//
// STABLE EXPORTS (cut 7 imports these; see notes/OUTPUT_READY.md). Do not
// change their meaning or values; add new names instead and log the change in
// notes/SHARED_CHANGES.md.
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_STIFF,
  CAM_DAMP,
  OP_UNREAD_DOT,
  camEase,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  squirclePath,
  sway,
} from "../kits/dwarkesh/fieldShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";
import { FONT_LABEL, INK, INK_HI, Label, worldPx } from "../kits/dwarkesh/alignShared";
import { STROKE_PX } from "../kits/dwarkesh/punishShared";

export const PL_FPS = 24000 / 1001;
/** Cut 2's length: the slot 2.044 -> 5.464 s at 23.976 fps. */
export const PL_DURATION = 82;
/** The last frame of cut 2 (f81): the resolved picture. */
export const PL_LAST = PL_DURATION - 1;

// ---------------------------------------------------------------------------
// THE CARD. World px. At cut 2's resolved camera (k ~ 1) these are screen px:
// 600 wide, centred on x 540, its centre at y 870, its bottom at 1055 (the
// caption band starts at 1080).
// ---------------------------------------------------------------------------
/** The zoom strokes and type are sized for (world px = screen px here). */
export const K_DESIGN = 1;
export const CARD_W = 600;
export const CARD_H = 370;
export const CARD_CX = 540;
export const CARD_CY = 870;
export const CARD_X0 = CARD_CX - CARD_W / 2; // 240
export const CARD_Y0 = CARD_CY - CARD_H / 2; // 685
export const CARD_X1 = CARD_X0 + CARD_W; // 840
export const CARD_Y1 = CARD_Y0 + CARD_H; // 1055
/** The style's one stroke weight, fixed at the design zoom. */
export const CARD_STROKE = worldPx(STROKE_PX, K_DESIGN);

export const PAD_X = 40;
export const PAD_TOP = 32;
/** The text measure inside the card. */
export const TEXT_X0 = CARD_X0 + PAD_X; // 280
export const MEASURE = CARD_W - 2 * PAD_X; // 520

// --- header: the model is its lab's mark ------------------------------------
export const MARK_SIZE = 52;
export const MARK_X = TEXT_X0; // the mark's box, top-left
export const MARK_Y = CARD_Y0 + PAD_TOP; // 717
export const MARK_CX = MARK_X + MARK_SIZE / 2;
export const MARK_CY = MARK_Y + MARK_SIZE / 2; // 743
export const LABEL_TEXT = "GPT-3.5";
export const LABEL_SIZE = worldPx(46, K_DESIGN);
export const LABEL_X = MARK_X + MARK_SIZE + 18;
/** `Label` places its line box's TOP here; Roboto Condensed caps at
 *  lineHeight 1 sit with their optical centre ~0.53 em below the top. */
export const LABEL_Y = MARK_CY - LABEL_SIZE * 0.53;

// --- the text: word-bars ----------------------------------------------------
export const WORD_H = 14;
export const PITCH = 28;
export const GAP = 11;
export const INDENT = 40;
export const PARA_GAP = 20;
/** The first limerick line's top. */
export const TEXT_Y0 = MARK_Y + MARK_SIZE + 26; // 795

export type Bar = { x: number; w: number };
export type CardLine = {
  kind: "limerick" | "def" | "body";
  y: number; // the line's TOP, world y
  x0: number;
  bars: Bar[];
  /** last bar's right edge minus x0 */
  len: number;
};

const SEED = 2022;
const H = (i: number, k: number) => hash(i + SEED * 1013, k + SEED * 3);

/** A line of `n` words filling `frac` of the room, word widths hashed. */
const proseLine = (li: number, n: number, frac: number, x0: number, room: number): Bar[] => {
  const raw: number[] = [];
  for (let j = 0; j < n; j++) raw.push(0.55 + 0.9 * H(li * 17 + j, 11));
  const sum = raw.reduce((a, b) => a + b, 0);
  const ink = room * frac - GAP * (n - 1);
  const bars: Bar[] = [];
  let x = x0;
  for (let j = 0; j < n; j++) {
    const w = (raw[j] / sum) * ink;
    bars.push({ x, w });
    x += w + GAP;
  }
  return bars;
};

/** A line of explicit token widths (code). */
const tokenLine = (widths: number[], x0: number): Bar[] => {
  const bars: Bar[] = [];
  let x = x0;
  for (const w of widths) {
    bars.push({ x, w });
    x += w + GAP;
  }
  return bars;
};

/** THE LIMERICK'S SHAPE: AABBA. Lines 1, 2, 5 long (8, 8, 9 words), lines 3
 *  and 4 clearly short (4, 4 words), ragged right. Same mean word width on
 *  every line, so the short pair reads as fewer words, not smaller ones. */
export const LIMERICK_SHAPE: { n: number; frac: number }[] = [
  { n: 8, frac: 0.94 },
  { n: 8, frac: 0.87 },
  { n: 4, frac: 0.45 },
  { n: 4, frac: 0.41 },
  { n: 9, frac: 0.98 },
];

/** THE FUNCTION. `def add(a, b):` typed by a person (white), then the model's
 *  indented body: `total = a + b` / `return total`. Token widths, world px. */
export const DEF_TOKENS = [34, 108];
export const BODY_TOKENS = [
  [60, 20, 56],
  [64, 54],
];

const makeLines = (): CardLine[] => {
  const out: CardLine[] = [];
  const mk = (kind: CardLine["kind"], y: number, x0: number, bars: Bar[]): CardLine => {
    const last = bars[bars.length - 1];
    return { kind, y, x0, bars, len: last.x + last.w - x0 };
  };
  LIMERICK_SHAPE.forEach((s, i) => {
    out.push(mk("limerick", TEXT_Y0 + i * PITCH, TEXT_X0, proseLine(i, s.n, s.frac, TEXT_X0, MEASURE)));
  });
  const codeY = TEXT_Y0 + LIMERICK_SHAPE.length * PITCH + PARA_GAP; // 955
  out.push(mk("def", codeY, TEXT_X0, tokenLine(DEF_TOKENS, TEXT_X0)));
  BODY_TOKENS.forEach((t, i) => {
    out.push(mk("body", codeY + (i + 1) * PITCH, TEXT_X0 + INDENT, tokenLine(t, TEXT_X0 + INDENT)));
  });
  return out;
};

export const CARD_LINES: CardLine[] = makeLines();
export const LIMERICK_LINES = CARD_LINES.filter((l) => l.kind === "limerick");
export const DEF_LINE = CARD_LINES.find((l) => l.kind === "def") as CardLine;
export const BODY_LINES = CARD_LINES.filter((l) => l.kind === "body");
/** The lowest ink in the card (the last body line's bottom). */
export const TEXT_Y1 = BODY_LINES[BODY_LINES.length - 1].y + WORD_H;
if (CARD_Y1 - TEXT_Y1 < 24) {
  throw new Error(`outputShared: the text runs to ${TEXT_Y1}, too close to the card's bottom ${CARD_Y1}`);
}

// ---------------------------------------------------------------------------
// THE WRITING SCHEDULE (cut 2 frames). ONE TOKEN RATE for the whole card, on
// the director's note: GPT-3.5 writes at one steady, unhurried pace, so cut 7's
// model can be explosively faster next to it. Every token (one word-bar) takes
// `TOKEN_F` frames, growing from its left edge with the caret at its tip; a
// line return costs one more token's time, during which the caret waits at the
// line's end and then is at the next line's start. A bar is never drawn past
// the caret.
//   limerick  f1 -> f31    33 words + 4 returns = 37 token-times; lines 1-4
//                          whole by f23, so the long-long-short-short shape is
//                          up across "limerick" (f17-24); line 5 ends f31
//   rest      f31 -> f35   caret at the end of the limerick
//   jump      f35          caret jumps under the `def` line, to the indent, the
//                          way it jumps at every line return (a glide there
//                          crossed over the person's white `def` bars)
//   body      f38 -> f43   5 tokens + 1 return at the SAME rate, from just
//                          before "autocomplete" (f39)
//   rest      f43 ->       the caret rests at the end of `return total`
// The rate is fixed by the limerick's window; at that rate the 5-token body
// takes 6 token-times (~4.9 frames), which is why it ends at f43, not f64.
// ---------------------------------------------------------------------------
/** The one token rate. */
export const LIM_START = 1;
export const LIM_END_TARGET = 31;
const unitsOf = (lines: CardLine[]) =>
  lines.reduce((a, l) => a + l.bars.length, 0) + (lines.length - 1);
/** Frames per token (and per line return): 30 / 37 = 0.811. */
export const TOKEN_F = (LIM_END_TARGET - LIM_START) / unitsOf(LIMERICK_LINES);
/** The frame the caret jumps under the `def` line. */
export const F_JUMP = 35;
export const BODY_START = 38;
export const LIM_DONE = LIM_START + unitsOf(LIMERICK_LINES) * TOKEN_F; // 31
export const BODY_DONE = BODY_START + unitsOf(BODY_LINES) * TOKEN_F; // ~42.9

type Tok = { li: number; b: Bar; t0: number };
const tokensOf = (lines: CardLine[], start: number): Tok[] => {
  const out: Tok[] = [];
  let u = 0;
  lines.forEach((l, li) => {
    if (li > 0) u += 1; // the return
    l.bars.forEach((b) => {
      out.push({ li, b, t0: start + u * TOKEN_F });
      u += 1;
    });
  });
  return out;
};
const LIM_TOKS = tokensOf(LIMERICK_LINES, LIM_START);
const BODY_TOKS = tokensOf(BODY_LINES, BODY_START);

const grownOf = (t: Tok, f: number) => clamp01((f - t.t0) / TOKEN_F);

/** Every bar of the card with the width drawn at cut-2 frame f. */
export const barsAt = (f: number) => {
  const out: { kind: CardLine["kind"]; x: number; y: number; w: number; full: number }[] = [];
  LIM_TOKS.forEach((t) =>
    out.push({ kind: "limerick", x: t.b.x, y: LIMERICK_LINES[t.li].y, w: t.b.w * grownOf(t, f), full: t.b.w }),
  );
  DEF_LINE.bars.forEach((b) => out.push({ kind: "def", x: b.x, y: DEF_LINE.y, w: b.w, full: b.w }));
  BODY_TOKS.forEach((t) =>
    out.push({ kind: "body", x: t.b.x, y: BODY_LINES[t.li].y, w: t.b.w * grownOf(t, f), full: t.b.w }),
  );
  return out;
};

/** The head of a token block at frame f: the tip of the token being written,
 *  the end of the last one finished (during a return), or the first bar's left
 *  edge before it starts. */
const headIn = (toks: Tok[], lines: CardLine[], f: number) => {
  let i = -1;
  for (let j = 0; j < toks.length; j++) if (toks[j].t0 <= f) i = j;
  if (i < 0) return { x: toks[0].b.x, y: lines[toks[0].li].y };
  const t = toks[i];
  return { x: t.b.x + t.b.w * grownOf(t, f), y: lines[t.li].y };
};

// --- the caret ---------------------------------------------------------------
export const CARET_W = 10;
export const CARET_H = 26;
/** The caret leads the head by a hair so it never sits on a bar of its colour. */
export const CARET_LEAD = 9;

/** The writing head at cut-2 frame f: world x (the head, before the lead) and
 *  the line's TOP y. */
export const caretAt = (f: number): { x: number; y: number } =>
  f < F_JUMP ? headIn(LIM_TOKS, LIMERICK_LINES, f) : headIn(BODY_TOKS, BODY_LINES, f);

// ---------------------------------------------------------------------------
// THE CAMERA OF CUT 2. Targets authored per frame, damped by fieldShared's
// tracker (same CAM_STIFF / CAM_DAMP as `runCamera`, run once into a table).
//
//   f0 -> f58   THE PULL-BACK. k 1.55 -> 1.00 (warp 0.8). The card's centre
//               rides from screen y 788 to 870, which keeps its bottom edge at
//               or above screen 1075 at every k (out of the caption band).
//   f58 ->      THE CREEP. k 1.00 -> 0.985 over 48 frames, card centre held.
//               It runs past cut 2's end: `plCamAt` is defined to f400, so a
//               later cut can carry the same creep on.
// `sway` is added on top. cx stays at the card's centre: the card fits the
// frame width at every k of the move (930 screen px at k 1.55).
// ---------------------------------------------------------------------------
export const K_OPEN = 1.55;
export const K_REST_TARGET = 1.0;
export const K_CREEP = 0.985;
export const F_PULL1 = 58;
export const F_CREEP1 = 106;
/** The card centre's screen y at the open and at rest. */
export const S_OPEN = 788;
export const S_REST = 870;
const CAM_F_MAX = 400;

const camTargets = (f: number) => {
  let k: number;
  let s: number;
  if (f <= F_PULL1) {
    const g = camEase(f / F_PULL1, 0.8);
    k = K_OPEN + (K_REST_TARGET - K_OPEN) * g;
    s = S_OPEN + (S_REST - S_OPEN) * g;
  } else {
    const g = camEase((f - F_PULL1) / (F_CREEP1 - F_PULL1), 1);
    k = K_REST_TARGET + (K_CREEP - K_REST_TARGET) * g;
    s = S_REST;
  }
  // cy from the screen position wanted for the card's centre at this k
  return { k, cy: CARD_CY - (s - 960) / k };
};

const CAM_TABLE: { cx: number; cy: number; k: number }[] = (() => {
  const t0 = camTargets(0);
  let cy = t0.cy;
  let k = t0.k;
  let vy = 0;
  let vk = 0;
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= CAM_F_MAX; f++) {
    if (f > 0) {
      const t = camTargets(f);
      vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
      cy += vy;
      vk += (t.k - k) * CAM_STIFF - vk * CAM_DAMP;
      k += vk;
    }
    const d = sway(f);
    out.push({ cx: CARD_CX + d.dx, cy: cy + d.dy, k });
  }
  return out;
})();

/** Cut 2's camera at its own frame f (0..400), sway included. */
export const plCamAt = (f: number) => CAM_TABLE[Math.max(0, Math.min(CAM_F_MAX, Math.round(f)))];
/** The camera's opening cy (no sway), for `GridBackground`'s `cyRest`. */
export const PL_CY_REST = camTargets(0).cy;
/** THE RESOLVED CAMERA: cut 2's last frame (f81), sway included. */
export const resolvedCamera = plCamAt(PL_LAST);
export const CAM_REST_K = resolvedCamera.k;
/** The grid clock: cut 2 passes `frame` (GRID_W0 + frame) to GridBackground. */
export const GRID_W0 = 0;

/** World -> screen under cut 2's camera at frame f. */
export const plScreenAt = (f: number, wx: number, wy: number) => {
  const c = plCamAt(f);
  return { x: 540 + (wx - c.cx) * c.k, y: 960 + (wy - c.cy) * c.k };
};

// ---------------------------------------------------------------------------
// THE CARD, AS A COMPONENT. Draws in WORLD coordinates and must sit inside a
// world <div> (1080x1920, `transform: translate(tx,ty) scale(k)`): it renders
// its own absolutely-positioned <svg> plus the DOM label beside it.
//   frame  — cut 2's clock. Anything >= PL_LAST is the resolved card.
//   k      — the live camera zoom, for the per-icon shadows only.
// ---------------------------------------------------------------------------
export const OUTPUT_ACCENT = ACCENT;
export const MARK_TONE = ACCENT_DEEP;

export const OutputCard2022: React.FC<{
  frame: number;
  k: number;
  accent?: string;
  markTone?: string;
  ink?: string;
}> = ({ frame, k, accent = OUTPUT_ACCENT, markTone = MARK_TONE, ink = INK }) => {
  const bars = barsAt(frame);
  const c = caretAt(frame);
  const s = MARK_SIZE / 24;
  return (
    <>
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        {/* the card: what the model was handed and what it gave back */}
        <path
          d={squirclePath(CARD_W, CARD_H)}
          transform={`translate(${CARD_X0} ${CARD_Y0})`}
          fill="none"
          stroke={ink}
          strokeWidth={CARD_STROKE}
          opacity={INK_HI}
          style={{ filter: iconShadow(k) }}
        />
        {/* the model: its lab's mark, deep tone (an old model) */}
        <g style={{ filter: iconShadow(k, undefined, undefined, 0.27) }}>
          <g transform={`translate(${MARK_X} ${MARK_Y}) scale(${s})`}>
            {OPENAI.paths.map((d, i) => (
              <path key={i} d={d} fill={markTone} fillRule="evenodd" />
            ))}
          </g>
        </g>
        {/* the text: limerick and body in the accent, the person's `def` in white */}
        {bars.map((b, i) =>
          b.w < 0.5 ? null : (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={WORD_H}
              rx={WORD_H / 2}
              fill={b.kind === "def" ? ink : accent}
              opacity={b.kind === "def" ? INK_HI : OP_UNREAD_DOT}
            />
          ),
        )}
        {/* the model, writing: a solid caret that never blinks */}
        <rect
          x={c.x + CARET_LEAD - CARET_W / 2}
          y={c.y + WORD_H / 2 - CARET_H / 2}
          width={CARET_W}
          height={CARET_H}
          rx={CARET_W / 2}
          fill={accent}
          opacity={OP_UNREAD_DOT}
        />
      </svg>
      <Label k={k} x={LABEL_X} y={LABEL_Y} text={LABEL_TEXT} inT={1} size={LABEL_SIZE} align="left" />
    </>
  );
};


// ===========================================================================
// V2 — READABLE TEXT (the user: "slightly too abstract, especially with the
// Python thing"). Cut 2 no longer draws word-bars: GPT-3.5 streams a real
// limerick into its card, then autocompletes a trivial Python function in a
// small code-editor card below it. Everything above this line (the v1 card,
// `barsAt`, `caretAt`, `OutputCard2022`, `plCamAt`, `resolvedCamera`, ...) is
// left exactly as it was so cut 7 keeps compiling until it switches to the v2
// names below; cut 2 itself now draws only v2.
//
// World units as before: at cut 2's resolved camera (k ~ 1) a world px is a
// screen px. The composition is two stacked cards centred on x 540:
//   limerick card  860 x 412 at (110, 368)  ->  bottom 780
//   code card      640 x 222 at (220, 808)  ->  bottom 1030 (bands start 1080)
// ===========================================================================

const MONO = loadMono("normal", { weights: ["600"], subsets: ["latin"] });
/** The code card's face. JetBrains Mono: every glyph advances 0.6 em. */
export const FONT_MONO = MONO.fontFamily;
export const MONO_ADV = 0.6;
/** The limerick's face: the style's sans (Roboto Condensed 700), mixed case. */
export const FONT_SANS = FONT_LABEL;

// --- the limerick card ------------------------------------------------------
export const L2_W = 860;
export const L2_H = 412;
export const L2_X0 = 540 - L2_W / 2; // 110
export const L2_Y0 = 368;
export const L2_X1 = L2_X0 + L2_W; // 970
export const L2_Y1 = L2_Y0 + L2_H; // 780
export const L2_CX = 540;
export const L2_CY = L2_Y0 + L2_H / 2; // 574
export const L2_PAD = 44;

export const MARK2_SIZE = 56;
export const MARK2_X = L2_X0 + L2_PAD; // 154
export const MARK2_Y = L2_Y0 + 34; // 402
export const MARK2_CY = MARK2_Y + MARK2_SIZE / 2;
export const LABEL2_SIZE = worldPx(46, K_DESIGN);
export const LABEL2_X = MARK2_X + MARK2_SIZE + 18;
export const LABEL2_Y = MARK2_CY - LABEL2_SIZE * 0.53;

/** The limerick, verbatim from the director's brief (an original). */
export const LIMERICK = [
  "A model was asked for a rhyme,",
  "It answered in record time;",
  "The meter was rough,",
  "But passable stuff,",
  "And the punchline was way past its prime.",
];
export const LIM2_FS = 40;
export const LIM2_LH = 54;
export const LIM2_X = L2_X0 + L2_PAD; // 154
export const LIM2_Y0 = MARK2_Y + MARK2_SIZE + 22; // 480, the first line box's top
/** Lines 3 and 4 sit in, as a printed limerick's short pair does. */
export const LIM2_INDENT = 56;
export const lim2LineX = (i: number) => LIM2_X + (i === 2 || i === 3 ? LIM2_INDENT : 0);
export const lim2LineY = (i: number) => LIM2_Y0 + i * LIM2_LH;

// --- the code card -----------------------------------------------------------
export const C2_W = 640;
export const C2_H = 222;
export const C2_X0 = 540 - C2_W / 2; // 220
export const C2_Y0 = L2_Y1 + 28; // 808
export const C2_X1 = C2_X0 + C2_W; // 860
export const C2_Y1 = C2_Y0 + C2_H; // 1030
export const C2_PAD = 34;
export const PY_SIZE = 42;
export const PY_X = C2_X0 + C2_PAD;
export const PY_Y = C2_Y0 + 28;
export const PY_CY = PY_Y + PY_SIZE / 2;
export const PY_LABEL = "Python";
export const PY_LABEL_SIZE = worldPx(40, K_DESIGN);
export const PY_LABEL_X = PY_X + PY_SIZE + 16;
export const PY_LABEL_Y = PY_CY - PY_LABEL_SIZE * 0.53;

export const CODE_FS = 34;
export const CODE_LH = 48;
export const CODE_X = C2_X0 + C2_PAD; // 254
export const CODE_Y0 = PY_Y + PY_SIZE + 22; // 900, line 1's box top
export const CHAR_W = CODE_FS * MONO_ADV; // 20.4
/** What the person typed (white). */
export const CODE_TYPED = "def is_even(n):";
/** GPT-3.5's completion (orange), one indent level in. */
export const CODE_INDENT = 4;
export const CODE_COMPLETION = ["return", "n", "%", "2", "==", "0"];
export const codeLineY = (i: number) => CODE_Y0 + i * CODE_LH;

/** Python — Simple Icons `python.svg` (simple-icons@13.21.0 via jsDelivr,
 *  fetched 2026-11-10), copied verbatim; the source is kept at
 *  `assets-src/rsi-another-jump/python.svg`. One path on the 24-unit box, the
 *  two snakes in one colour; drawn white here (a named thing is its mark in
 *  white). */
export const PYTHON_PATH =
  "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z";

/** The whole composition's box (both cards). */
export const COMP2_X0 = L2_X0;
export const COMP2_Y0 = L2_Y0;
export const COMP2_X1 = L2_X1;
export const COMP2_Y1 = C2_Y1;

// ---------------------------------------------------------------------------
// V2 SCHEDULE (cut 2 frames). ONE TOKEN RATE for everything GPT-3.5 writes: a
// token is one word (punctuation rides with it) and takes `TOKEN2_F` frames,
// its characters appearing left to right; a line return costs one token time.
//   limerick   f1 -> f31   27 words + 4 returns = 31 token-times (0.968 f
//                          each); lines 1-4 up by f22.3, line 5 done f31
//   code card  f30 -> f39  slides up 24 px while it fades in (a panel's
//                          entrance), the person's `def is_even(n):` already
//                          typed and their white cursor waiting one indent in
//   ghost      f39 -> f45  "return n % 2 == 0" streams in after the cursor as
//                          ghost text, deep orange (proposed, not yet taken)
//   accept     f58 -> f64  the person takes it: the cursor jumps to the line's
//                          end on f58 and the ghost ripens to solid ACCENT
//                          (tone, never alpha) by f64
//   hold       f64 -> f81
// ---------------------------------------------------------------------------
export const LIM2_START = 1;
export const LIM2_DONE_TARGET = 31;
const LIM2_WORDS = LIMERICK.map((l) => l.split(" "));
const LIM2_UNITS = LIM2_WORDS.reduce((a, w) => a + w.length, 0) + (LIMERICK.length - 1);
export const TOKEN2_F = (LIM2_DONE_TARGET - LIM2_START) / LIM2_UNITS;
export const CODE2_IN0 = 30;
export const CODE2_IN1 = 39;
export const CODE2_RISE = 24;
export const GHOST2_START = 39;
export const GHOST2_DONE = GHOST2_START + CODE_COMPLETION.length * TOKEN2_F;
export const ACCEPT2_F0 = 58;
export const ACCEPT2_F1 = 64;
/** The first frame on which cut 2's picture no longer changes (camera aside). */
export const PL2_SETTLED = ACCEPT2_F1;

type Tok2 = { line: number; c0: number; c1: number; t0: number };
/** Tokens of a block of lines: char span in its line, start frame. */
const tok2Of = (lines: string[][], start: number): Tok2[] => {
  const out: Tok2[] = [];
  let u = 0;
  lines.forEach((words, li) => {
    if (li > 0) u += 1;
    let c = 0;
    words.forEach((w, wi) => {
      const c0 = c + (wi > 0 ? 1 : 0);
      out.push({ line: li, c0, c1: c0 + w.length, t0: start + u * TOKEN2_F });
      c = c0 + w.length;
      u += 1;
    });
  });
  return out;
};
const LIM2_TOKS = tok2Of(LIM2_WORDS, LIM2_START);
const GHOST2_TOKS = tok2Of([CODE_COMPLETION], GHOST2_START);

/** Chars visible per line at frame f, and the line the head is on. */
const visible2 = (toks: Tok2[], nLines: number, f: number) => {
  const n = new Array(nLines).fill(0);
  let head = 0;
  for (const t of toks) {
    if (t.t0 > f) break;
    const u = clamp01((f - t.t0) / TOKEN2_F);
    n[t.line] = t.c0 + Math.floor(u * (t.c1 - t.c0) + 1e-9);
    head = t.line;
  }
  return { n, head };
};

/** The limerick at cut-2 frame f: each line's visible text, and the line the
 *  orange caret is on. */
export const limerick2At = (f: number) => {
  const { n, head } = visible2(LIM2_TOKS, LIMERICK.length, f);
  return { lines: LIMERICK.map((l, i) => l.slice(0, n[i])), caretLine: head };
};

const GHOST2_TEXT = CODE_COMPLETION.join(" ");
const TONE2 = makeTone(ACCENT_DEEP, ACCENT);
/** The completion at cut-2 frame f: its visible text, its tone (0 ghost, 1
 *  taken), and the person's cursor column on line 2. */
export const completion2At = (f: number) => {
  const { n } = visible2(GHOST2_TOKS, 1, f);
  const taken = clamp01((f - ACCEPT2_F0) / (ACCEPT2_F1 - ACCEPT2_F0));
  return {
    text: GHOST2_TEXT.slice(0, n[0]),
    tone: camEase(taken, 1),
    cursorCol: f >= ACCEPT2_F0 ? CODE_INDENT + GHOST2_TEXT.length : CODE_INDENT,
  };
};
/** The code card's entrance: 0..1 (opacity and rise). */
export const code2In = (f: number) => camEase((f - CODE2_IN0) / (CODE2_IN1 - CODE2_IN0), 1);

// ---------------------------------------------------------------------------
// V2 CAMERA. Same tracker and sway as v1. The anchor is the limerick card's
// centre (world y 574), placed on screen at S:
//   f0 -> f30   THE PULL-BACK. k 1.30 -> 1.00 (warp 0.8), S 660 -> 574: it
//               opens on the limerick card with its side edges off frame and
//               has pulled back to both cards by the time the code card
//               arrives (solved so its bottom edge, rise included, never goes
//               below screen y ~1066 on the way in)
//   f30 ->      THE CREEP. k 1.00 -> 0.985 over 60 frames, S held
// Defined to f400 so cut 7 can carry the creep on.
// ---------------------------------------------------------------------------
export const K2_OPEN = 1.3;
export const K2_REST_TARGET = 1.0;
export const K2_CREEP = 0.985;
export const F2_PULL1 = 30;
export const F2_CREEP1 = 90;
export const S2_OPEN = 660;
export const S2_REST = L2_CY;

const cam2Targets = (f: number) => {
  let k: number;
  let sy: number;
  if (f <= F2_PULL1) {
    const g = camEase(f / F2_PULL1, 0.8);
    k = K2_OPEN + (K2_REST_TARGET - K2_OPEN) * g;
    sy = S2_OPEN + (S2_REST - S2_OPEN) * g;
  } else {
    const g = camEase((f - F2_PULL1) / (F2_CREEP1 - F2_PULL1), 1);
    k = K2_REST_TARGET + (K2_CREEP - K2_REST_TARGET) * g;
    sy = S2_REST;
  }
  return { k, cy: L2_CY - (sy - 960) / k };
};

const CAM2_TABLE: { cx: number; cy: number; k: number }[] = (() => {
  const t0 = cam2Targets(0);
  let cy = t0.cy;
  let k = t0.k;
  let vy = 0;
  let vk = 0;
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= CAM_F_MAX; f++) {
    if (f > 0) {
      const t = cam2Targets(f);
      vy += (t.cy - cy) * CAM_STIFF - vy * CAM_DAMP;
      cy += vy;
      vk += (t.k - k) * CAM_STIFF - vk * CAM_DAMP;
      k += vk;
    }
    const d = sway(f);
    out.push({ cx: 540 + d.dx, cy: cy + d.dy, k });
  }
  return out;
})();

/** Cut 2's v2 camera at its own frame f (0..400), sway included. */
export const pl2CamAt = (f: number) => CAM2_TABLE[Math.max(0, Math.min(CAM_F_MAX, Math.round(f)))];
export const PL2_CY_REST = cam2Targets(0).cy;
/** THE RESOLVED CAMERA (v2): cut 2's f81, sway included. */
export const resolvedCamera2 = pl2CamAt(PL_LAST);
export const CAM2_REST_K = resolvedCamera2.k;
export const pl2ScreenAt = (f: number, wx: number, wy: number) => {
  const c = pl2CamAt(f);
  return { x: 540 + (wx - c.cx) * c.k, y: 960 + (wy - c.cy) * c.k };
};

// --- v2 drawing --------------------------------------------------------------
export const CARET2_W = 12;
export const CARET2_H = 44;
export const CURSOR2_W = 4;
export const CURSOR2_H = 40;

const textStyle = (font: string, size: number, lh: number, color: string): React.CSSProperties => ({
  position: "absolute",
  fontFamily: font,
  fontWeight: font === FONT_MONO ? 600 : 700,
  fontSize: size,
  lineHeight: `${lh}px`,
  color,
  whiteSpace: "pre",
  // code shows `==` as two characters, never a ligature
  fontVariantLigatures: "none",
  fontFeatureSettings: '"liga" 0, "calt" 0',
});

/**
 * CUT 2's PICTURE (v2), self-contained: both cards, the mark and label, the
 * limerick, the code and the caret/cursor, in WORLD coordinates. Put it inside
 * a world <div> (1080x1920, transformOrigin 0 0, translate(tx,ty) scale(k)).
 *   frame — cut 2's clock; leave it out (or pass >= PL2_SETTLED) for the
 *           resolved picture, which is what cut 2's f81 shows.
 *   k     — the live camera zoom, for the per-icon shadows.
 *   opacity — 0..1 multiplier on the whole picture, for a cut that wants to
 *           drain it (default 1). Not used by cut 2.
 */
export const OutputScene2022: React.FC<{ frame?: number; k: number; opacity?: number }> = ({
  frame = PL_LAST,
  k,
  opacity = 1,
}) => {
  const lim = limerick2At(frame);
  const comp = completion2At(frame);
  const cin = code2In(frame);
  const rise = CODE2_RISE * (1 - cin);
  const pyS = PY_SIZE / 24;
  const mS = MARK2_SIZE / 24;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity }}>
      {/* the limerick card */}
      <svg
        width={1080}
        height={1920}
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <path
          d={squirclePath(L2_W, L2_H)}
          transform={`translate(${L2_X0} ${L2_Y0})`}
          fill="none"
          stroke={INK}
          strokeWidth={CARD_STROKE}
          opacity={INK_HI}
          style={{ filter: iconShadow(k) }}
        />
        <g style={{ filter: iconShadow(k, undefined, undefined, 0.27) }}>
          <g transform={`translate(${MARK2_X} ${MARK2_Y}) scale(${mS})`}>
            {OPENAI.paths.map((d, i) => (
              <path key={i} d={d} fill={MARK_TONE} fillRule="evenodd" />
            ))}
          </g>
        </g>
      </svg>
      <Label k={k} x={LABEL2_X} y={LABEL2_Y} text={LABEL_TEXT} inT={1} size={LABEL2_SIZE} align="left" />
      {lim.lines.map((t, i) => {
        const caret = i === lim.caretLine;
        if (t.length === 0 && !caret) return null;
        return (
          <div
            key={i}
            style={{ ...textStyle(FONT_SANS, LIM2_FS, LIM2_LH, OUTPUT_ACCENT), left: lim2LineX(i), top: lim2LineY(i) }}
          >
            {t}
            {caret ? (
              <span
                style={{
                  display: "inline-block",
                  width: CARET2_W,
                  height: CARET2_H,
                  borderRadius: CARET2_W / 2,
                  background: OUTPUT_ACCENT,
                  marginLeft: t.length > 0 ? 5 : 0,
                  verticalAlign: -9,
                }}
              />
            ) : null}
          </div>
        );
      })}

      {/* the code card: slides up while it fades in */}
      {cin > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: rise,
            width: 1080,
            height: 1920,
            opacity: cin,
          }}
        >
          <svg
            width={1080}
            height={1920}
            viewBox="0 0 1080 1920"
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <path
              d={squirclePath(C2_W, C2_H)}
              transform={`translate(${C2_X0} ${C2_Y0})`}
              fill="none"
              stroke={INK}
              strokeWidth={CARD_STROKE}
              opacity={INK_HI}
              style={{ filter: iconShadow(k) }}
            />
            <g style={{ filter: iconShadow(k, undefined, undefined, 0.27) }}>
              <g transform={`translate(${PY_X} ${PY_Y}) scale(${pyS})`}>
                <path d={PYTHON_PATH} fill={INK} />
              </g>
            </g>
            {/* the person's cursor */}
            <rect
              x={CODE_X + comp.cursorCol * CHAR_W + (comp.cursorCol > CODE_INDENT ? 4 : -4) - CURSOR2_W / 2}
              y={codeLineY(1) + (CODE_LH - CURSOR2_H) / 2}
              width={CURSOR2_W}
              height={CURSOR2_H}
              fill={INK}
              opacity={INK_HI}
            />
          </svg>
          <Label k={k} x={PY_LABEL_X} y={PY_LABEL_Y} text={PY_LABEL} inT={1} size={PY_LABEL_SIZE} align="left" />
          <div style={{ ...textStyle(FONT_MONO, CODE_FS, CODE_LH, INK), left: CODE_X, top: codeLineY(0) }}>
            {CODE_TYPED}
          </div>
          {comp.text.length > 0 ? (
            <div
              style={{
                ...textStyle(FONT_MONO, CODE_FS, CODE_LH, TONE2(comp.tone)),
                left: CODE_X + CODE_INDENT * CHAR_W,
                top: codeLineY(1),
              }}
            >
              {comp.text}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
