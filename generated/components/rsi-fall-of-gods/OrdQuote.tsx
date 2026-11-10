// ---------------------------------------------------------------------------
// OrdQuote (rsi-fall-of-gods, cut 42). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 287 frames.
//
// CHECK LINE: the viewer reads Toby Ord's sentence as it is spoken, pinned on the same wall as the Steinbeck quote,
// and knows it is his essay.
//
// THE LINE: "He writes, quote, While current AI systems are starting to automate mathematical proof, there is
// currently very little evidence that they can ask powerful questions or find profound new fields of mathematical
// inquiry."
// WORD -> FRAME (composition frames from f0; Whisper reads 2-7 f early): He -2 · writes 1 · quote 10 · While 20 ·
// current 25 · AI 34 · systems 41 · are 47 · starting 57 · to 66 · automate 70 · mathematical 78 · proof 91 ·
// there 109 · is 120 · currently 122 · very 134 · little 144 · evidence 151 · that 160 · they 170 · can 174 ·
// ask 176 · powerful 184 · questions 191 · or 204 · find 218 · profound 225 · new 235 · fields 244 · of 255 ·
// mathematical 258 · inquiry 265 · (But 285).
// DURATION: the slot 42.542 -> 54.513 s = 11.971 s x 23.976 = 287 frames (f0..f286).
//
// THE MOTION: the clip's quote wall (quoteShared.tsx, as cut 25): the dimmed grid, one white paper card pinned at
// the true middle, the light-grey pushpin, receded sheets peeking in from the frame edges (another arrangement than
// cut 25). Frame 0 already holds the wall, the card, the pin, the rule, the credit and the opening quote mark ("He
// writes, quote," f-2..f19); the quote types on letter by letter with the voice from "While" f20, each word's letters
// inside its spoken span, "enquiry.”" f265-f274, all inked by f276. The camera is a slow reader: one continuous
// push (k 0.96 -> 1.05, f0 to the last frame, still creeping on it) and a downward drift of the focus that follows
// the line being typed at a fraction of its travel (heavily smoothed, so it never steps per line); the drift settles
// by ~f270 on the whole card, which holds alive to f286 under the creep, the sway and the grid drift.
//
// SOURCES: the quote, its British "enquiry" and the credit are the show's own printed card (q2end.jpg, the 16:9
// episode's burned-in quote): Toby Ord, "Mathematics is Much More than Proof". Line breaks are this cut's own, for
// the 9:16 card.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  iconShadow,
  runCamera,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import {
  Pushpin,
  QuoteCard,
  SideSheet,
  checkWords,
  quoteCardGeometry,
  typeFrames,
  type QuoteCardLayout,
  type QuoteWord,
  type SideSheetSpec,
} from "./quoteShared";

export const FPS = 24000 / 1001;
export const DURATION = 287;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// rev 2 (user: more padding): eight lines for the narrower, more padded card (the opening mark is printed from f0 by
// the card); no line is a lone word. Was seven lines at 58 px in a 960-wide card.
const LINES = [
  "While current AI systems",
  "are starting to automate",
  "mathematical proof, there",
  "is currently very little",
  "evidence that they can ask",
  "powerful questions or find",
  "profound new fields of",
  "mathematical enquiry.”",
];

const WORDS: QuoteWord[] = [
  { text: "While", f: 20 },
  { text: "current", f: 25 },
  { text: "AI", f: 34 },
  { text: "systems", f: 41 },
  { text: "are", f: 47 },
  { text: "starting", f: 57 },
  { text: "to", f: 66 },
  { text: "automate", f: 70 },
  { text: "mathematical", f: 78 },
  { text: "proof,", f: 91 },
  { text: "there", f: 109 },
  { text: "is", f: 120 },
  { text: "currently", f: 122 },
  { text: "very", f: 134 },
  { text: "little", f: 144 },
  { text: "evidence", f: 151 },
  { text: "that", f: 160 },
  { text: "they", f: 170 },
  { text: "can", f: 174 },
  { text: "ask", f: 176 },
  { text: "powerful", f: 184 },
  { text: "questions", f: 191 },
  { text: "or", f: 204 },
  { text: "find", f: 218 },
  { text: "profound", f: 225 },
  { text: "new", f: 235 },
  { text: "fields", f: 244 },
  { text: "of", f: 255 },
  { text: "mathematical", f: 258 },
  { text: "enquiry.”", f: 265 },
];
const END = 275; // "enquiry.”" spreads over f265..f274, inked by f276
checkWords(LINES, WORDS);

const ATTRIBUTION = ["Toby Ord, “Mathematics is Much More than Proof”"];

// rev 2: the shared card's padding and width (quoteShared CARD_DEFAULTS: w 876, padX 110, padY 136); type 58/72 ->
// 50/62 to fit, the credit 30 -> 26 in proportion
const LAYOUT: QuoteCardLayout = { fontSize: 50, lineH: 62, attrSize: 26 };
const G = quoteCardGeometry(LINES.length, ATTRIBUTION.length, LAYOUT);

// Other papers on the same wall, cut 25's family in another arrangement: one hanging above the card's left half from
// the top edge, one rising under it at the bottom-left, a smaller one in the bottom-right corner; the top-right is bare.
const SHEETS: SideSheetSpec[] = [
  { cx: 360, cy: G.y - 390, w: 660, h: 880, rot: 1.5, seed: 11 },
  { cx: 150, cy: G.y + G.h + 370, w: 620, h: 860, rot: -1.6, seed: 12 },
  { cx: 1120, cy: G.y + G.h + 270, w: 500, h: 700, rot: 2.2, seed: 13 },
];

// ---------------------------------------------------------------------------------------------------------------
// The camera: a slow reader. The focus follows the line being typed (its continuous position: line index plus the
// fraction of the line already typed) at READ_GAIN of its travel about the card centre, smoothed over +-SMOOTH frames
// so it is one drift, not a step per line; one key per frame into fieldShared's damped runCamera. The push is cut
// 25's profile (ease in over the first quarter, then a steady creep to the last frame), k K0 -> K1.
// ---------------------------------------------------------------------------------------------------------------
const K0 = 0.96;
const K1 = 1.05;
const READ_GAIN = 0.18;
const SMOOTH = 26;

const CHAR_FRAMES = typeFrames(WORDS, END);
// the line and the column of every character of words.join(" ") (a space belongs to the line it ends)
const CHAR_POS: number[] = [];
LINES.forEach((line, li) => {
  for (let i = 0; i < line.length; i++) CHAR_POS.push(li + i / line.length);
  if (li + 1 < LINES.length) CHAR_POS.push(li + 1);
});

const readPos = (f: number) => {
  let p = 0;
  for (let i = 0; i < CHAR_FRAMES.length; i++) if (CHAR_FRAMES[i] <= f) p = CHAR_POS[i];
  return p;
};
const RAW: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const lineY = G.y + G.textTop + (readPos(f) + 0.5) * G.lineH;
  RAW.push(G.cy + READ_GAIN * (lineY - G.cy));
}
const CAM_F: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  let sum = 0;
  let n = 0;
  for (let j = f - SMOOTH; j <= f + SMOOTH; j++) {
    sum += RAW[Math.min(DURATION, Math.max(0, j))];
    n++;
  }
  const t = f / (DURATION - 1);
  const e = t < 0.25 ? (t * t) / 0.5 : t - 0.125;
  CAM_F.push(f);
  CAM_CY.push(sum / n);
  CAM_K.push(K0 + (K1 - K0) * (e / 0.875));
}

const OrdQuote: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cy, k } = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const s = sway(frame);
  const { tx, ty } = worldTransform(540, cy, k);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
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
          {SHEETS.map((sh, i) => (
            <SideSheet key={i} {...sh} />
          ))}
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, filter: iconShadow(k) }}>
            <QuoteCard
              frame={frame}
              lines={LINES}
              words={WORDS}
              end={END}
              attribution={ATTRIBUTION}
              layout={LAYOUT}
            />
          </div>
          <Pushpin x={G.pin.x} y={G.pin.y} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default OrdQuote;
