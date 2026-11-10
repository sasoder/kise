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
  squirclePath,
  sway,
} from "../kits/dwarkesh/fieldShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";
import { INK, INK_HI, Label, worldPx } from "../kits/dwarkesh/alignShared";
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
