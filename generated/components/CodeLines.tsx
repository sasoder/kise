import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";

// ---------------------------------------------------------------------------
// "CODE LINES" — a TRANSPARENT overlay ON TOP of a talking-head shot (no roto).
//
// CHECK LINE (what the viewer can say after this cut): "Code alone, however
// fancy, is just lines on a screen."
//
// DURATION. The slot is sequence 18.250 - 21.250 s at 24 fps: 72 frames, hard
// cut in and out. Spoken: "To fix all of this, we will need more than just
// fancy lines of code." fancy f43, lines f51, code f62, cut f72.
//
// THE MOTION, one job, one continuous move: WRITE, then hold. Lines of abstract
// code (rounded bars) type themselves top to bottom behind a cursor block, from
// frame 0, and the last bar completes on "code" (f62). On "fancy" (f43) the
// code becomes syntax-highlighted: lines typed from then on carry orange /
// purple / blue tokens, and the lines already written get theirs in one hard
// top-to-bottom pass, one line per frame. f62-72 the finished listing holds
// and the cursor blinks. Nothing gathers, nothing drops.
//
// REUSE. This is the WRITE phase of CodeAndApps.tsx (bar drawing, cursor, hard
// shadow, typed-length clock), with a new listing laid out for this shot.
//
// INK RULES (from PeakForSolar): white #FFFFFF shapes, each on a hard black
// #000000 shadow, zero blur, +4 / +4 px, drawn as a translated copy of the
// shape. Raw hex, no glow, no blend modes, no opacity anywhere: a shape exists
// or it does not. No background, no camera: the root is transparent.
//
// THE STAGE, measured on the three footage frames under this cut. Her head and
// hair cover about x 290-810, y 545-1150 (the hair's left edge reaches x 290
// low down); her shoulders start at y ~1130 and her hands rise to y ~1340. So
// the listing is an upside-down L: six wide lines across the band above her
// head (y 130-492) and eight short lines down the left column (x 80-300 above
// y 700, x 80-266 below it, down to y 1020).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 72;
export const FRAME_W = 1080;
export const FRAME_H = 1920;

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";
const PURPLE = "#BC37FF";
const BLUE = "#0046FF";

export const schema = z.object({
  ink: z.string(),
  shadow: z.string(),
  orange: z.string(),
  purple: z.string(),
  blue: z.string(),
  // the hard shadow's offset, px
  shadowOffset: z.number(),
  // typing runs from typeStart to typeEnd (the last bar completes on "code")
  typeStart: z.number(),
  typeEnd: z.number(),
  // "fancy": syntax colours switch on from here
  colourStart: z.number(),
  // frames per line of the top-to-bottom colour pass over the lines already written
  colourStep: z.number(),
  // the hold's blink: this many frames off, then this many on, from blinkStart
  blinkStart: z.number(),
  blinkHalf: z.number(),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: WHITE,
  shadow: BLACK,
  orange: ORANGE,
  purple: PURPLE,
  blue: BLUE,
  shadowOffset: 4,
  typeStart: -2,
  typeEnd: 62,
  colourStart: 43,
  colourStep: 1,
  blinkStart: 64,
  blinkHalf: 6,
});

// ---------------------------------------------------------------------------
// THE CODE. Python-shaped: indentation only, so every line carries weight.
// Each token is [width, colour]. Purple = keywords at line starts, orange =
// strings / literals at line ends, blue = names being called.
// ---------------------------------------------------------------------------
type Hue = "w" | "o" | "p" | "b";
type LineDef = { indent: number; toks: [number, Hue][] };

export const LINE_X0 = 80;
export const LINE_Y0 = 130;
export const LINE_PITCH = 66;
export const BAR_H = 28;
export const INDENT = 70;
export const TOK_GAP = 16;
export const CURSOR_W = 16;
export const BAR_R = BAR_H / 2;
// px of typing time a carriage return costs; high enough that the short lines
// of the column keep a line rhythm close to the wide lines above them
const NEWLINE_COST = 120;

const LINES: LineDef[] = [
  // the band above her head
  { indent: 0, toks: [[140, "p"], [250, "b"], [70, "w"], [60, "w"]] },
  { indent: 1, toks: [[110, "w"], [60, "w"], [330, "w"], [190, "o"]] },
  { indent: 1, toks: [[110, "w"], [220, "b"], [60, "w"], [300, "w"], [90, "o"]] },
  { indent: 1, toks: [[90, "p"], [360, "w"], [60, "w"]] },
  { indent: 2, toks: [[200, "w"], [60, "w"], [250, "o"], [150, "w"]] },
  { indent: 2, toks: [[150, "w"], [420, "w"], [110, "b"]] },
  // the column beside her head
  { indent: 1, toks: [[90, "p"], [44, "w"]] },
  { indent: 2, toks: [[80, "w"]] },
  { indent: 1, toks: [[100, "w"]] },
  { indent: 0, toks: [[90, "p"], [80, "w"]] },
  { indent: 1, toks: [[50, "w"], [46, "b"]] },
  { indent: 1, toks: [[112, "o"]] },
  { indent: 1, toks: [[112, "w"]] },
  { indent: 0, toks: [[80, "p"], [50, "w"]] },
];

// ---------------------------------------------------------------------------
// TOKENS: geometry and typing window (in px of "typed length").
// ---------------------------------------------------------------------------
type Tok = {
  key: string;
  line: number;
  x: number;
  y: number;
  w: number;
  hue: Hue;
  s0: number; // typed length at which this token starts
  s1: number; // ... and completes
};

const TOKENS: Tok[] = [];
const LINE_S0: number[] = []; // typed length at which each line starts
let typed = 0;
LINES.forEach((line, li) => {
  const y = LINE_Y0 + li * LINE_PITCH;
  let x = LINE_X0 + line.indent * INDENT;
  LINE_S0.push(typed);
  line.toks.forEach(([w, hue], ti) => {
    TOKENS.push({ key: `t${li}-${ti}`, line: li, x, y, w, hue, s0: typed, s1: typed + w });
    typed += w + TOK_GAP;
    x += w + TOK_GAP;
  });
  typed += NEWLINE_COST;
});
const LAST = TOKENS[TOKENS.length - 1];
export const TYPED_TOTAL = LAST.s1;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const CodeLines: React.FC<Props> = ({
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  typeStart,
  typeEnd,
  colourStart,
  colourStep,
  blinkStart,
  blinkHalf,
}) => {
  const frame = useCurrentFrame();
  const hueFill = (h: Hue) => (h === "o" ? orange : h === "p" ? purple : h === "b" ? blue : ink);
  const typedAt = (f: number) => interpolate(f, [typeStart, typeEnd], [0, TYPED_TOTAL], clamp);
  const s = typedAt(frame);

  // A line that was already begun on "fancy" gets its colours in the pass, one
  // line per colourStep frames from the top; a line begun later is typed in
  // colour. Either way the switch is hard.
  const sFancy = typedAt(colourStart);
  const coloured = (li: number) =>
    LINE_S0[li] < sFancy ? frame >= colourStart + li * colourStep : frame >= colourStart;

  // the cursor leads the token being typed; between tokens it waits at the end
  // of the last one
  let cur = { x: TOKENS[0].x, y: TOKENS[0].y };
  const bars = TOKENS.map((t) => {
    if (s <= t.s0) {
      return null;
    }
    const w = Math.min(t.w, s - t.s0);
    cur = { x: t.x + w + 6, y: t.y };
    const r = Math.min(BAR_R, w / 2);
    return (
      <g key={t.key}>
        <rect x={t.x + shadowOffset} y={t.y + shadowOffset} width={w} height={BAR_H} rx={r} fill={shadow} />
        <rect x={t.x} y={t.y} width={w} height={BAR_H} rx={r} fill={coloured(t.line) ? hueFill(t.hue) : ink} />
      </g>
    );
  });

  // the hold: hard off / on, so the frame is alive at the cut
  const blinkOff = frame >= blinkStart && Math.floor((frame - blinkStart) / blinkHalf) % 2 === 0;

  return (
    // No backgroundColor: the root is transparent.
    <AbsoluteFill>
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {bars}
        {blinkOff ? null : (
          <>
            <rect
              x={cur.x + shadowOffset}
              y={cur.y + shadowOffset}
              width={CURSOR_W}
              height={BAR_H}
              rx={4}
              fill={shadow}
            />
            <rect x={cur.x} y={cur.y} width={CURSOR_W} height={BAR_H} rx={4} fill={ink} />
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export default CodeLines;
