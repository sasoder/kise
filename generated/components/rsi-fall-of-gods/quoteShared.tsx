// ---------------------------------------------------------------------------
// quoteShared (rsi-fall-of-gods): the clip's QUOTE WALL. Two cuts read a quote aloud (25 FallOfGodsQuote, Steinbeck;
// 42 OrdQuote, Toby Ord), and the user asked for "a paper on the wall" like the Robert Moses short, "in the correct
// style": so this is the Dwarkesh ground (the dimmed grid, the vignette, the one soft shadow) with ONE white paper
// card pinned at the true middle, a light-grey pushpin at its top centre, and two or three receded white sheets of
// grey text bars peeking in from the frame edges, cut by the frame. Everything that decides how the wall LOOKS lives
// here; a cut passes its lines, its word table and its attribution.
//
// The quote face is Spectral (the show's own 16:9 quote cards, q1.jpg / q2end.jpg in the notes folder, set their
// quotes in it: the tall ascenders, the flat-topped "t", the bracketed wedge serifs and the light colour all match),
// in dark ink on the paper, left-aligned, with a short dark rule above it where the show has its orange dash (orange
// is the AI in this clip, so the rule is ink). The attribution is the style's label face (Roboto Condensed 700,
// caps, 0.04 em) in the paper's grey: ink at INK_LO over white, printed from f0.
//
// TYPING (the mechanics of caro-firing-moses/paperShared.tsx, not its look): `typeFrames` gives every character of
// the quote a landing frame, each spoken word's letters spread over its own spoken span (0.5..2 frames per letter);
// `TypedQuote` draws the fixed lines (untyped letters keep their advance, so nothing reflows) and inks each letter in
// over TYPE_FADE frames from its landing. The opening quote mark is printed from f0.
//
// Exports (see QUOTE_READY.md in the clip's notes folder for the props and the geometry):
//   fonts and ink: QUOTE_FONT, QUOTE_WEIGHT, PAPER, PAPER_INK, PAPER_GREY, PIN_LIGHT, PIN_SHADE
//   typing: QuoteWord, typeFrames, checkWords, inkAt, TYPE_FADE, TypedQuote
//   pieces: QuoteCard, quoteCardGeometry, Pushpin, SideSheet, SideSheetSpec, defaultSheets
//   camera: quoteCamera (a slow push from f0 to the last frame, through fieldShared's damped runCamera)
//   whole scene: QuoteWall (ground + sheets + card + pin + vignette, the camera applied)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadSpectral } from "@remotion/google-fonts/Spectral";
import {
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  hash,
  iconShadow,
  runCamera,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { FONT_LABEL, INK_LO, LABEL_TRACKING, LABEL_WEIGHT } from "../kits/dwarkesh/alignShared";

// ---------------------------------------------------------------------------------------------------------------
// Fonts and ink
// ---------------------------------------------------------------------------------------------------------------

export const QUOTE_WEIGHT = 400;
export const QUOTE_FONT = loadSpectral("normal", { weights: ["300", "400", "500"], subsets: ["latin"] }).fontFamily;

const hexToRgb = (h: string): [number, number, number] => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = (i: number) => Math.round(A[i] + (B[i] - A[i]) * t);
  return `#${[c(0), c(1), c(2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

export const PAPER = "#FFFFFF"; // white = people and what they make: the paper
export const PAPER_INK = "#1E1E1E"; // the quote, and the rule above it
// INK_LO on paper: the ink at the style's context rung over white, as a solid tone (never an alpha over the card)
export const PAPER_GREY = mix(PAPER, PAPER_INK, INK_LO);
// the pin: light grey and white, never orange (orange is the AI in this clip)
export const PIN_LIGHT = "#F4F4F2";
export const PIN_SHADE = "#C9C9C6";

// ---------------------------------------------------------------------------------------------------------------
// Typing
// ---------------------------------------------------------------------------------------------------------------

/** One spoken word: `text` is the word AS PRINTED on the card (its punctuation and closing quote mark included),
 *  `f` its onset in composition frames (the word table; Whisper reads 2-7 f early, which is the right side to err). */
export type QuoteWord = { text: string; f: number };

/** Letters ink in over this many frames from their landing frame (a letter is half inked on its frame). */
export const TYPE_FADE = 2;

/** One landing frame per character of words.map(text).join(" "). A word's letters start on its onset and spread over
 *  its spoken span (to the next onset, or `end` for the last word) at 0.5..2 frames per letter; a space lands with
 *  the letter before it. */
export const typeFrames = (words: QuoteWord[], end: number): number[] => {
  const out: number[] = [];
  words.forEach((w, i) => {
    const next = i + 1 < words.length ? words[i + 1].f : end;
    const span = Math.max(1, next - w.f);
    const r = Math.min(2, Math.max(0.5, span / w.text.length));
    for (let j = 0; j < w.text.length; j++) out.push(w.f + Math.floor(j * r));
    if (i + 1 < words.length) out.push(out[out.length - 1]);
  });
  return out;
};

/** Throws at module load if the word table does not spell the printed lines exactly. */
export const checkWords = (lines: string[], words: QuoteWord[]) => {
  const a = lines.join(" ");
  const b = words.map((w) => w.text).join(" ");
  if (a !== b) throw new Error(`quoteShared: the words do not spell the lines.\n lines: ${a}\n words: ${b}`);
  for (let i = 1; i < words.length; i++) {
    if (words[i].f < words[i - 1].f) throw new Error(`quoteShared: word ${i} "${words[i].text}" starts before the one before it`);
  }
};

/** 0..1 ink of a letter that lands on `fl`. */
export const inkAt = (frame: number, fl: number) => clamp01((frame - fl + 1) / TYPE_FADE);

/** The quote's fixed lines. `open` (the opening quote mark) is printed from f0 in front of line 0; every other
 *  character is inked on its landing frame and keeps its advance before that, so nothing reflows. */
export const TypedQuote: React.FC<{
  lines: string[];
  frames: number[];
  frame: number;
  open?: string;
  fontSize: number;
  lineH: number;
  color?: string;
  weight?: number;
}> = ({ lines, frames, frame, open = "“", fontSize, lineH, color = PAPER_INK, weight = QUOTE_WEIGHT }) => {
  const [r, g, b] = hexToRgb(color);
  let from = 0;
  return (
    <div style={{ fontFamily: QUOTE_FONT, fontWeight: weight, fontSize, lineHeight: `${lineH}px`, color }}>
      {lines.map((line, li) => {
        const start = from;
        from += line.length + 1;
        return (
          <div key={li} style={{ whiteSpace: "pre" }}>
            {li === 0 && open ? <span>{open}</span> : null}
            {Array.from(line).map((ch, i) => {
              const a = inkAt(frame, frames[start + i]);
              return (
                <span key={i} style={{ color: `rgba(${r},${g},${b},${a.toFixed(3)})` }}>
                  {ch}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------------------------------------------

export type QuoteCardLayout = {
  /** card centre and width, world px (the world is 1080x1920 at k 1) */
  cx?: number;
  cy?: number;
  w?: number;
  /** quote type, world px */
  fontSize?: number;
  lineH?: number;
  /** left/right padding inside the card, world px */
  padX?: number;
  /** paper above the rule and below the credit, world px */
  padY?: number;
  /** the attribution's size, world px */
  attrSize?: number;
  /** the quote's Spectral weight (300, 400 or 500 are loaded) */
  weight?: number;
};

// rev 2 (user, Nov 10: "can you add a bit more padding to these?"): the paper breathes round the text like the show's
// printed card. Inside padding ~1.7x on all sides (padX 66 -> 110, paper above the rule 80 -> 136 and below the
// credit 71 -> 136, now its own `padY` instead of a multiple of the type size), the card narrower (940 -> 876, ~910
// screen px at the end of the push, ~85 px of wall each side), and the type down to fit the four lines in the
// narrower column (64/80 -> 52/65, the credit 30 -> 24 in proportion). The centre, the rule, the pin and the
// leading ratio are unchanged.
export const CARD_DEFAULTS = {
  cx: 540,
  cy: 950,
  w: 876,
  fontSize: 52,
  lineH: 65, // 1.25 of the size: the show's leading (q1.jpg: line width / line pitch 9.9)
  padX: 110,
  padY: 136,
  attrSize: 24,
  weight: QUOTE_WEIGHT,
};
/** the pin's head centre below the card's top edge, world px */
export const PIN_INSET = 38;

/** Every measure of the card, in world px, from its layout and its line count. A tall quote (5-6 lines) just grows
 *  the card about its centre: the camera stays on `cy`. */
export const quoteCardGeometry = (lineCount: number, attrLines: number, layout: QuoteCardLayout = {}) => {
  const L = { ...CARD_DEFAULTS, ...layout };
  const fs = L.fontSize;
  const padTop = L.padY; // paper above the rule
  const ruleW = Math.round(fs * 1.5);
  const ruleH = Math.max(3, Math.round(fs * 0.06));
  const ruleToText = Math.round(fs * 0.62); // rule bottom -> first line box top
  const textTop = padTop + ruleH + ruleToText;
  const textH = lineCount * L.lineH;
  const attrGap = Math.round(fs * 0.62);
  const attrLineH = Math.round(L.attrSize * 1.3);
  const attrTop = textTop + textH + attrGap;
  const padBottom = L.padY; // paper below the credit's ink
  const h = attrTop + attrLines * attrLineH + padBottom - (attrLineH - L.attrSize);
  const x = L.cx - L.w / 2;
  const y = L.cy - h / 2;
  return {
    ...L,
    x,
    y,
    h,
    padTop,
    ruleW,
    ruleH,
    textTop,
    textH,
    attrTop,
    attrLineH,
    /** the pin's head centre, world px */
    pin: { x: L.cx, y: y + PIN_INSET },
  };
};

export const QuoteCard: React.FC<{
  frame: number;
  lines: string[];
  words: QuoteWord[];
  /** the frame by which the last word's last letter has landed */
  end: number;
  /** printed from f0 under the quote, in the label face, upper-cased; one entry per line */
  attribution: string[];
  open?: string;
  layout?: QuoteCardLayout;
}> = ({ frame, lines, words, end, attribution, open = "“", layout }) => {
  const G = quoteCardGeometry(lines.length, attribution.length, layout);
  const frames = typeFrames(words, end);
  return (
    <div
      style={{
        position: "absolute",
        left: G.x,
        top: G.y,
        width: G.w,
        height: G.h,
        background: PAPER,
        clipPath: `path('${squirclePath(G.w, G.h)}')`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: G.padX,
          top: G.padTop,
          width: G.ruleW,
          height: G.ruleH,
          background: PAPER_INK,
        }}
      />
      <div style={{ position: "absolute", left: G.padX, top: G.textTop }}>
        <TypedQuote
          lines={lines}
          frames={frames}
          frame={frame}
          open={open}
          fontSize={G.fontSize}
          lineH={G.lineH}
          weight={G.weight}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: G.padX,
          top: G.attrTop,
          fontFamily: FONT_LABEL,
          fontWeight: LABEL_WEIGHT,
          letterSpacing: LABEL_TRACKING,
          textTransform: "uppercase",
          fontSize: G.attrSize,
          lineHeight: `${G.attrLineH}px`,
          color: PAPER_GREY,
          whiteSpace: "pre",
        }}
      >
        {attribution.map((a, i) => (
          <div key={i}>{a}</div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The pin: a plain pushpin seen from the front-above, light grey and white, flat fills, a short cast shadow down and
// to the right on the paper. Drawn in world px about its head centre.
// ---------------------------------------------------------------------------------------------------------------

export const PIN_R = 26; // head radius, world px

export const Pushpin: React.FC<{ x: number; y: number; k: number; r?: number }> = ({ x, y, k, r = PIN_R }) => {
  const s = r / PIN_R;
  return (
    <svg
      width={1080}
      height={1920}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter: iconShadow(k) }}
    >
      <defs>
        <filter id="quotePinShadow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={3.2 * s} />
        </filter>
      </defs>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {/* cast shadow: the head standing off the paper throws a soft disc down and a little right */}
        <circle cx={4} cy={9} r={25} fill="#000" opacity={0.26} filter="url(#quotePinShadow)" />
        {/* the rim under the head */}
        <circle cx={0} cy={3} r={26} fill={PIN_SHADE} />
        {/* the head */}
        <circle cx={0} cy={0} r={24} fill={PIN_LIGHT} />
        {/* the raised cap */}
        <circle cx={-2} cy={-3} r={14} fill="#FFFFFF" />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The side sheets: other papers pinned on the same wall, receded (paper tone pulled toward the field, grey text bars),
// cut by the frame. Context only: they never carry a readable word.
// ---------------------------------------------------------------------------------------------------------------

export type SideSheetSpec = {
  /** centre, size, rotation (deg), all world px */
  cx: number;
  cy: number;
  w: number;
  h: number;
  rot: number;
  seed: number;
};

// how far a side sheet is pulled from white toward the grid field (#727272 at BG_DIM)
// rev 1 (director, Nov 10: the sheets read almost as bright as the card, grey-on-grey, the card did not pop): 0.68 ->
// 0.84, so a sheet is white at ~0.16 over the field (#727272 -> #868686) and the white card is the one bright thing;
// the bars soften from ink 0.3 on paper to a small step under the sheet (SHEET_BAR_STEP of the way to the field's
// own darker lines), so the sheets only say "other papers on the wall".
export const SHEET_RECEDE = 0.84;
export const SHEET_BAR_STEP = 0.07;
const FIELD = "#727272";
export const SHEET_PAPER = mix(PAPER, FIELD, SHEET_RECEDE);
export const SHEET_BAR = mix(SHEET_PAPER, PAPER_INK, SHEET_BAR_STEP);

export const SideSheet: React.FC<SideSheetSpec> = ({ cx, cy, w, h, rot, seed }) => {
  const pad = 54;
  const barH = 11;
  const step = 29;
  const bars: React.ReactNode[] = [];
  let y = pad + 20;
  let i = 0;
  while (y + barH < h - pad) {
    const para = hash(seed * 31 + i, 3) < 0.16 && i > 2;
    if (para) {
      y += step; // a paragraph gap
      i++;
      continue;
    }
    const full = hash(seed * 31 + i, 5) < 0.72;
    const bw = (w - 2 * pad) * (full ? 0.94 + 0.06 * hash(seed * 31 + i, 7) : 0.35 + 0.45 * hash(seed * 31 + i, 9));
    bars.push(<rect key={i} x={pad} y={y} width={bw} height={barH} fill={SHEET_BAR} />);
    y += step;
    i++;
  }
  return (
    <svg
      width={w}
      height={h}
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - h / 2,
        overflow: "visible",
        transform: `rotate(${rot}deg)`,
        transformOrigin: "50% 50%",
      }}
    >
      <path d={squirclePath(w, h)} fill={SHEET_PAPER} />
      {bars}
    </svg>
  );
};

/** Three sheets placed off the card: one above-left and one above-right peeking down into the frame from its top
 *  edge, one below-left coming up from the bottom edge. They tuck at the card's top and bottom and keep the frame's
 *  side edges, so a taller card (Ord) pushes them out of frame rather than over the quote. */
export const defaultSheets = (G: ReturnType<typeof quoteCardGeometry>): SideSheetSpec[] => [
  { cx: -40, cy: G.y - 230, w: 600, h: 900, rot: -2.0, seed: 1 },
  { cx: 1150, cy: G.y - 400, w: 560, h: 780, rot: 1.6, seed: 2 },
  { cx: 1010, cy: G.y + G.h + 340, w: 620, h: 820, rot: -1.3, seed: 3 },
];

// ---------------------------------------------------------------------------------------------------------------
// The camera: one slow push about the card centre that runs from f0 to the last frame and is still moving on it (ease
// in over the first quarter, then a steady creep), fed one key per frame to fieldShared's damped runCamera.
// ---------------------------------------------------------------------------------------------------------------

export const quoteCamera = (frame: number, duration: number, focusY: number, k0 = 1, k1 = 1.04) => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let f = 0; f <= duration; f++) {
    const t = f / (duration - 1);
    const e = t < 0.25 ? (t * t) / 0.5 : t - 0.125;
    F.push(f);
    K.push(k0 + (k1 - k0) * (e / 0.875));
    CY.push(focusY);
  }
  return runCamera(frame, F, CY, K);
};

// ---------------------------------------------------------------------------------------------------------------
// The whole wall
// ---------------------------------------------------------------------------------------------------------------

export const QuoteWall: React.FC<{
  frame: number;
  duration: number;
  lines: string[];
  words: QuoteWord[];
  end: number;
  attribution: string[];
  open?: string;
  layout?: QuoteCardLayout;
  /** defaults to defaultSheets(geometry) */
  sheets?: SideSheetSpec[];
  /** the push: k from k0 at f0 to k1 on the last frame */
  k0?: number;
  k1?: number;
  /** the camera's focus, world px; defaults to the card centre */
  focusY?: number;
  /** a continuous clock for the grid drift, if a later cut joins this one */
  clock?: number;
}> = ({ frame, duration, lines, words, end, attribution, open, layout, sheets, k0 = 1, k1 = 1.04, focusY, clock }) => {
  const G = quoteCardGeometry(lines.length, attribution.length, layout);
  const fy = focusY ?? G.cy;
  const { cy, k } = quoteCamera(frame, duration, fy, k0, k1);
  const s = sway(frame);
  const { tx, ty } = worldTransform(540, cy, k);
  const S = sheets ?? defaultSheets(G);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={clock ?? frame}
        cy={cy}
        cyRest={fy}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          {S.map((sh, i) => (
            <SideSheet key={i} {...sh} />
          ))}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, filter: iconShadow(k) }}>
            <QuoteCard
              frame={frame}
              lines={lines}
              words={words}
              end={end}
              attribution={attribution}
              open={open}
              layout={layout}
            />
          </div>
          <Pushpin x={G.pin.x} y={G.pin.y} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};
