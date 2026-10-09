import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";

// ---------------------------------------------------------------------------
// "CODE AND APPS" — a TRANSPARENT overlay that sits BEHIND the roto'd speaker.
//
// CHECK LINE (what the viewer can say after this cut): "The usual startup is
// lines of code that turn into apps, and these startups are not that."
//
// DURATION. The slot is sequence 00:00:03.583 - 00:00:08.167 at 24.000 fps:
// round((8.167 - 3.583) * 24) = 110 frames, no tail. The edit cuts at f110.
//
// THE MOTION, one job, one continuous move: WRITE -> GATHER -> DROP. Lines of
// abstract code (rounded bars) type themselves top to bottom behind a cursor
// block and finish on "code" (f66); on "and apps" the code is WIPED AWAY and a
// phone's worth of apps POPS UP in its place (see v6 below); on "but" the tiles
// let go and fall out of frame under gravity, so f108-109 are empty.
//
// v6, the user's revision ("still looks a lil weird"): nothing turns into
// anything any more. It is a hand-off between two readable pictures.
//   THE CODE CLEARS: each line un-types right to left (a width wipe, the line
//   does not move), top line first, half a frame apart, four frames each on an
//   ease-in. The cursor leaves with the last line.
//   THE APPS POP: each icon scales up about its own centre to 1.08 and settles,
//   in a diagonal ripple from the top-left, 1.5 frames per step. A row's first
//   icon starts on the frame that row's code is gone, so a bar never sits under
//   a half-grown icon. The grid is whole by f88.
//   THEY LOOK LIKE APPS: tile fills vary like a home screen (white, black,
//   orange, purple, blue; no two neighbours alike) and the glyphs are big, white
//   on the dark and saturated tiles and black on the white and orange ones.
// No chain colours anywhere in this section.
//
// v3, the user's revision: THE EL SEGUNDO SEAL opens the cut. It pops up over
// the code on "El Segundo" (f1, chain discs orange / purple / blue leading it
// from the same centre at the same size, so they show as rings and end hidden),
// holds with a slow one-degree sway while the code types DIMMED behind it (the
// whole code layer at 55 % opacity — the user asked for this, so "nothing
// fades" yields here), and scales away just after "startup" (f45-52) while the
// code comes up to 100 %. From f52 the cut is exactly the approved v2.
//
// INK RULES (from PeakForSolar): white #FFFFFF shapes, each on a hard black
// #000000 shadow, zero blur, +4 / +4 px, drawn as a translated SVG copy of the
// shape. Raw hex, no glow, no blend modes, no opacity anywhere: a shape exists
// or it does not. No background, no camera: the root is transparent.
//
// THE STAGE. The speaker's head covers about x 330-800, y 520-1150 and her body
// everything below y 1150, so what is seen is the band above her head and the
// two side columns. The block is one piece that runs behind her: the outer
// tile columns and the top tile row carry the read.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 110;
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
  // the top code line starts to un-type here
  morphStart: z.number(),
  // the top-left app starts its pop here
  popStart: z.number(),
  // the black of a black app tile (the hard shadow stays pure black)
  tileBlack: z.string(),
  // the first tile lets go here ("but")
  dropStart: z.number(),
  // px per frame squared
  gravity: z.number(),
  // the city seal: a round alpha PNG in public/ (433 px source; the user's size is 507)
  sealSrc: z.string(),
  sealCx: z.number(),
  sealCy: z.number(),
  sealD: z.number(),
  sealIn: z.number(), // the first chain disc starts here ("El")
  sealStagger: z.number(), // frames between orange, purple, blue and the seal
  sealOut: z.number(), // it starts to leave here (just after "startup")
  sealOutDur: z.number(),
  // the code layer's opacity while the seal is up
  codeDim: z.number(),
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
  typeEnd: 66,
  morphStart: 68,
  popStart: 73,
  tileBlack: "#111111",
  dropStart: 93,
  gravity: 30,
  sealSrc: "hadrian05/el_segundo_seal.png",
  sealCx: 541,
  sealCy: 572,
  sealD: 507,
  sealIn: 1,
  sealStagger: 0.5,
  sealOut: 45,
  sealOutDur: 7,
  codeDim: 0.55,
});

// ---------------------------------------------------------------------------
// THE CODE. Python-shaped: indentation only, no closing-brace lines, so every
// line carries weight. `null` is a blank line. Each token is [width, colour].
// ---------------------------------------------------------------------------
type Hue = "w" | "o" | "p" | "b";
type LineDef = { indent: number; toks: [number, Hue][] } | null;

export const LINE_X0 = 80;
export const LINE_Y0 = 156;
export const LINE_PITCH = 66;
export const BAR_H = 28;
export const INDENT = 70;
export const TOK_GAP = 16;
export const CURSOR_W = 16;
const NEWLINE_COST = 40; // px of typing time a carriage return costs

const LINES: LineDef[] = [
  { indent: 0, toks: [[140, "p"], [250, "w"], [70, "w"], [60, "w"]] },
  { indent: 1, toks: [[110, "w"], [60, "w"], [330, "w"], [190, "o"]] },
  { indent: 1, toks: [[110, "w"], [220, "w"], [60, "w"], [300, "w"], [90, "w"]] },
  null,
  { indent: 1, toks: [[90, "p"], [360, "w"], [60, "w"]] },
  { indent: 2, toks: [[200, "w"], [60, "w"], [250, "b"], [150, "w"]] },
  { indent: 2, toks: [[150, "w"], [420, "w"], [110, "w"]] },
  { indent: 1, toks: [[70, "p"], [300, "w"], [130, "w"], [60, "w"]] },
  { indent: 2, toks: [[180, "w"], [60, "w"], [240, "w"], [200, "o"]] },
  { indent: 1, toks: [[150, "w"], [250, "w"], [150, "b"], [240, "w"]] },
  null,
  { indent: 1, toks: [[130, "w"], [60, "w"], [380, "w"], [170, "w"]] },
  { indent: 2, toks: [[120, "p"], [300, "w"], [60, "w"], [210, "w"]] },
  { indent: 1, toks: [[200, "w"], [90, "o"], [60, "w"]] },
];

// ---------------------------------------------------------------------------
// THE GRID. 4 x 4 tiles of 190 px across x 90-990 and down y 170-1030.
// ---------------------------------------------------------------------------
export const TILE = 190;
export const GRID_X0 = 90;
export const GRID_X1 = 990;
export const GRID_Y0 = 170;
export const GRID_Y1 = 1030;
export const COLS = 4;
export const ROWS = 4;
const COL_PITCH = (GRID_X1 - GRID_X0 - TILE) / (COLS - 1);
const ROW_PITCH = (GRID_Y1 - GRID_Y0 - TILE) / (ROWS - 1);
export const TILE_R = TILE * 0.24;
export const BAR_R = BAR_H / 2;

type GlyphKind =
  | "chat"
  | "play"
  | "camera"
  | "envelope"
  | "music"
  | "clock"
  | "search"
  | "pin"
  | "heart"
  | "lock"
  | "grid"
  | "cart"
  | "bars"
  | "star"
  | "sun"
  | "person";
// A tile's fill, like a home screen: w white, k black, o orange, p purple,
// b blue. Row-major; no two neighbours share a fill, and the outer columns and
// the top row (what the viewer sees) carry a mix of all five.
type TileHue = "w" | "k" | "o" | "p" | "b";
const APPS: [GlyphKind, TileHue][] = [
  ["chat", "b"],
  ["play", "w"],
  ["camera", "k"],
  ["envelope", "p"],
  ["music", "o"],
  ["clock", "k"],
  ["search", "b"],
  ["pin", "w"],
  ["heart", "p"],
  ["lock", "w"],
  ["grid", "o"],
  ["cart", "k"],
  ["bars", "k"],
  ["star", "b"],
  ["sun", "w"],
  ["person", "o"],
];
export const GLYPH_SCALE = 1.15; // the glyphs are drawn in a +-48 box: ~58 % of a tile

type Tile = { i: number; col: number; row: number; x: number; y: number };
const TILES: Tile[] = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    TILES.push({
      i: row * COLS + col,
      col,
      row,
      x: GRID_X0 + col * COL_PITCH,
      y: GRID_Y0 + row * ROW_PITCH,
    });
  }
}

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
  cursor: boolean;
};

const TOKENS: Tok[] = [];
let typed = 0;
LINES.forEach((line, li) => {
  if (line) {
    const y = LINE_Y0 + li * LINE_PITCH;
    let x = LINE_X0 + line.indent * INDENT;
    line.toks.forEach(([w, hue], ti) => {
      TOKENS.push({
        key: `t${li}-${ti}`,
        line: li,
        x,
        y,
        w,
        hue,
        s0: typed,
        s1: typed + w,
        cursor: false,
      });
      typed += w + TOK_GAP;
      x += w + TOK_GAP;
    });
  }
  typed += NEWLINE_COST;
});
const LAST = TOKENS[TOKENS.length - 1];
export const TYPED_TOTAL = LAST.s1;

// The code lines, in order, each with its own tokens: what un-types.
const CODE_LINES: Tok[][] = [];
LINES.forEach((l, li) => {
  if (l) {
    CODE_LINES.push(TOKENS.filter((t) => t.line === li));
  }
});

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
export const CLEAR_STAGGER = 0.5; // frames between one line's wipe and the next
export const CLEAR_DUR = 4;
export const RIPPLE = 1.5; // frames per diagonal step of the pop
export const POP_UP = 3; // frames to the overshoot
export const POP_BACK = 3; // frames back to 1
export const POP_OVER = 1.08;
export const SETTLE_PX = 3; // ~1.5 % of a tile
export const DROP_MAX_DEG = 5;
// the seal's pop: up to SEAL_OVER in SEAL_POP frames, back to 1 in SEAL_SETTLE
export const SEAL_POP = 5;
export const SEAL_SETTLE = 5;
export const SEAL_OVER = 1.05;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// drop: sweeps across the columns, lower rows a touch earlier so nothing
// overtakes
const dropDelay = (t: Tile) => t.col * 0.8 + (ROWS - 1 - t.row) * 0.4;
const DROP_SPIN = [1, -0.7, 0.5, -1.1, -0.6, 0.9, -1, 0.6, 0.8, -0.5, 1.1, -0.9, -1, 0.7, -0.6, 1];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// GLYPHS, drawn in a box of about +-48 around the tile centre. Bold filled
// shapes; strokes only where a line IS the shape, and then 10-12 px.
// ---------------------------------------------------------------------------
const Glyph: React.FC<{
  kind: GlyphKind;
  fill: string;
  paper: string;
}> = ({ kind, fill, paper }) => {
  const round = { strokeLinejoin: "round", strokeLinecap: "round" } as const;
  switch (kind) {
    case "chat":
      return (
        <g fill={fill}>
          <rect x={-46} y={-40} width={92} height={64} rx={20} />
          <polygon points="-26,18 -32,46 4,20" />
        </g>
      );
    case "play":
      return (
        <polygon points="-24,-36 38,0 -24,36" fill={fill} stroke={fill} strokeWidth={14} {...round} />
      );
    case "camera":
      return (
        <g>
          <rect x={-22} y={-40} width={44} height={24} rx={8} fill={fill} />
          <rect x={-48} y={-28} width={96} height={66} rx={14} fill={fill} />
          <circle cx={0} cy={5} r={20} fill={paper} />
          <circle cx={0} cy={5} r={9} fill={fill} />
        </g>
      );
    case "envelope":
      return (
        <g>
          <rect x={-48} y={-34} width={96} height={68} rx={12} fill={fill} />
          <polyline points="-38,-22 0,8 38,-22" fill="none" stroke={paper} strokeWidth={10} {...round} />
        </g>
      );
    case "music":
      return (
        <g fill={fill}>
          <polygon points="-18,-36 42,-46 42,-26 -18,-16" />
          <rect x={-18} y={-30} width={11} height={62} />
          <rect x={31} y={-40} width={11} height={62} />
          <ellipse cx={-27} cy={32} rx={18} ry={14} />
          <ellipse cx={22} cy={22} rx={18} ry={14} />
        </g>
      );
    case "clock":
      return (
        <g>
          <circle cx={0} cy={0} r={46} fill={fill} />
          <polyline points="0,-26 0,0 20,12" fill="none" stroke={paper} strokeWidth={10} {...round} />
        </g>
      );
    case "search":
      return (
        <g fill="none" stroke={fill} {...round}>
          <circle cx={-8} cy={-8} r={28} strokeWidth={13} />
          <line x1={16} y1={16} x2={40} y2={40} strokeWidth={15} />
        </g>
      );
    case "pin":
      return (
        <g>
          <path
            d="M0 48 C-10 30 -32 10 -32 -14 A32 32 0 1 1 32 -14 C32 10 10 30 0 48 Z"
            fill={fill}
          />
          <circle cx={0} cy={-14} r={12} fill={paper} />
        </g>
      );
    case "heart":
      return (
        <path
          d="M0 42 C-56 8 -50 -38 -24 -38 C-10 -38 0 -26 0 -16 C0 -26 10 -38 24 -38 C50 -38 56 8 0 42 Z"
          fill={fill}
        />
      );
    case "lock":
      return (
        <g>
          <path
            d="M-19 -6 V-20 A19 19 0 0 1 19 -20 V-6"
            fill="none"
            stroke={fill}
            strokeWidth={12}
            {...round}
          />
          <rect x={-34} y={-8} width={68} height={52} rx={12} fill={fill} />
        </g>
      );
    case "grid":
      return (
        <g fill={fill}>
          {[-30, 0, 30].map((gy) =>
            [-30, 0, 30].map((gx) => <circle key={`${gx}-${gy}`} cx={gx} cy={gy} r={11} />),
          )}
        </g>
      );
    case "cart":
      return (
        <g>
          <polyline
            points="-48,-36 -34,-36 -24,14"
            fill="none"
            stroke={fill}
            strokeWidth={10}
            {...round}
          />
          <polygon
            points="-30,-22 44,-22 36,14 -22,14"
            fill={fill}
            stroke={fill}
            strokeWidth={8}
            {...round}
          />
          <circle cx={-16} cy={36} r={9} fill={fill} />
          <circle cx={28} cy={36} r={9} fill={fill} />
        </g>
      );
    case "bars":
      return (
        <g fill={fill}>
          <rect x={-42} y={6} width={24} height={36} rx={6} />
          <rect x={-12} y={-38} width={24} height={80} rx={6} />
          <rect x={18} y={-14} width={24} height={56} rx={6} />
        </g>
      );
    case "star": {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 46 : 21;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r + 3).toFixed(2)}`);
      }
      return <polygon points={pts.join(" ")} fill={fill} stroke={fill} strokeWidth={8} {...round} />;
    }
    case "sun":
      return (
        <g>
          <circle cx={0} cy={0} r={21} fill={fill} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 33}
                y1={Math.sin(a) * 33}
                x2={Math.cos(a) * 45}
                y2={Math.sin(a) * 45}
                stroke={fill}
                strokeWidth={11}
                {...round}
              />
            );
          })}
        </g>
      );
    case "person":
      return (
        <g fill={fill}>
          <circle cx={0} cy={-22} r={20} />
          <path d="M-40 44 C-40 16 -22 6 0 6 C22 6 40 16 40 44 Z" />
        </g>
      );
    default:
      return null;
  }
};

const CodeAndApps: React.FC<Props> = ({
  ink,
  shadow,
  orange,
  purple,
  blue,
  shadowOffset,
  typeStart,
  typeEnd,
  morphStart,
  popStart,
  tileBlack,
  dropStart,
  gravity,
  sealSrc,
  sealCx,
  sealCy,
  sealD,
  sealIn,
  sealStagger,
  sealOut,
  sealOutDur,
  codeDim,
}) => {
  const frame = useCurrentFrame();
  const hueFill = (h: Hue) => (h === "o" ? orange : h === "p" ? purple : h === "b" ? blue : ink);
  const tileFill = (h: TileHue) =>
    h === "o" ? orange : h === "p" ? purple : h === "b" ? blue : h === "k" ? tileBlack : ink;
  // white on the dark and saturated tiles, black on the white and orange ones
  const glyphOn = (h: TileHue) => (h === "w" || h === "o" ? shadow : ink);

  const svg = (children: React.ReactNode, over: React.ReactNode = null) => (
    // No backgroundColor: the root is transparent.
    <AbsoluteFill>
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {children}
      </svg>
      {over}
    </AbsoluteFill>
  );

  // ---- 1. WRITE -----------------------------------------------------------
  if (frame < morphStart) {
    const s = interpolate(frame, [typeStart, typeEnd], [0, TYPED_TOTAL], clamp);
    // the cursor leads the token being typed; between tokens it waits at the
    // end of the last one
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
          <rect x={t.x} y={t.y} width={w} height={BAR_H} rx={r} fill={hueFill(t.hue)} />
        </g>
      );
    });
    // ---- THE SEAL, over the dimmed code ------------------------------------
    // Pop: 0 -> 1.06 on the house ease, then a short settle to 1. Exit: one
    // quick ease-in to 0, everything together, so nothing lingers.
    const exit = interpolate(frame, [sealOut, sealOut + sealOutDur], [1, 0], {
      easing: Easing.in(Easing.cubic),
      ...clamp,
    });
    const pop = (start: number) => {
      const up = interpolate(frame, [start, start + SEAL_POP], [0, SEAL_OVER], {
        easing: EASE_LAND,
        ...clamp,
      });
      const back = interpolate(frame, [start + SEAL_POP, start + SEAL_POP + SEAL_SETTLE], [0, SEAL_OVER - 1], {
        easing: Easing.inOut(Easing.quad),
        ...clamp,
      });
      return (up - back) * exit;
    };
    const sealStart = sealIn + 3 * sealStagger;
    const sealScale = pop(sealStart);
    const sway = 1.2 * Math.sin(((frame - sealStart) * Math.PI * 2) / 64);
    const float = 2.5 * Math.sin(((frame - sealStart) * Math.PI * 2) / 47);
    const disc = (scale: number, fill: string, d: number, off = 0): React.CSSProperties => ({
      position: "absolute",
      left: -d / 2 + off,
      top: -d / 2 + off,
      width: d,
      height: d,
      borderRadius: "50%",
      backgroundColor: fill,
      transform: `scale(${scale.toFixed(5)})`,
    });
    const ringD = sealD - 2; // a hair inside the seal, so no colour fringes it at rest
    const seal =
      frame >= sealIn && frame < sealOut + sealOutDur ? (
        <div
          style={{
            position: "absolute",
            left: sealCx,
            top: sealCy,
            width: 0,
            height: 0,
            transform: `translateY(${float.toFixed(3)}px)`,
          }}
        >
          {sealScale > 0 ? <div style={disc(sealScale, shadow, ringD, shadowOffset)} /> : null}
          {frame < sealStart + SEAL_POP + SEAL_SETTLE ? (
            <>
              <div style={disc(pop(sealIn), orange, ringD)} />
              <div style={disc(pop(sealIn + sealStagger), purple, ringD)} />
              <div style={disc(pop(sealIn + 2 * sealStagger), blue, ringD)} />
            </>
          ) : null}
          {sealScale > 0 ? (
            <Img
              src={staticFile(sealSrc)}
              style={{
                position: "absolute",
                left: -sealD / 2,
                top: -sealD / 2,
                width: sealD,
                height: sealD,
                transform: `scale(${sealScale.toFixed(5)}) rotate(${sway.toFixed(3)}deg)`,
              }}
            />
          ) : null}
        </div>
      ) : null;
    const dim = interpolate(frame, [sealOut, sealOut + sealOutDur], [codeDim, 1], clamp);
    return svg(
      <g opacity={dim < 1 ? dim : undefined}>
        {bars}
        <rect
          x={cur.x + shadowOffset}
          y={cur.y + shadowOffset}
          width={CURSOR_W}
          height={BAR_H}
          rx={4}
          fill={shadow}
        />
        <rect x={cur.x} y={cur.y} width={CURSOR_W} height={BAR_H} rx={4} fill={ink} />
      </g>,
      seal,
    );
  }

  // ---- 2. THE CODE CLEARS: every line un-types, right to left ---------------
  const clearing = CODE_LINES.map((toks, j) => {
    const e = interpolate(
      frame,
      [morphStart + j * CLEAR_STAGGER, morphStart + j * CLEAR_STAGGER + CLEAR_DUR],
      [0, 1],
      { easing: Easing.in(Easing.quad), ...clamp },
    );
    if (e >= 1) {
      return null;
    }
    const first = toks[0];
    const last = toks[toks.length - 1];
    const right = lerp(last.x + last.w, first.x, e);
    const isLastLine = j === CODE_LINES.length - 1;
    return (
      <g key={j}>
        {toks.map((t) => {
          const w = Math.min(t.w, right - t.x);
          if (w <= 0) {
            return null;
          }
          const r = Math.min(BAR_R, w / 2);
          return (
            <g key={t.key}>
              <rect x={t.x + shadowOffset} y={t.y + shadowOffset} width={w} height={BAR_H} rx={r} fill={shadow} />
              <rect x={t.x} y={t.y} width={w} height={BAR_H} rx={r} fill={hueFill(t.hue)} />
            </g>
          );
        })}
        {isLastLine ? (
          <>
            <rect
              x={right + 6 + shadowOffset}
              y={first.y + shadowOffset}
              width={CURSOR_W}
              height={BAR_H}
              rx={4}
              fill={shadow}
            />
            <rect x={right + 6} y={first.y} width={CURSOR_W} height={BAR_H} rx={4} fill={ink} />
          </>
        ) : null}
      </g>
    );
  });

  // ---- 3. THE APPS POP, hold, then 4. DROP ---------------------------------
  const tiles = TILES.map((tile) => {
    const p0 = popStart + (tile.col + tile.row) * RIPPLE;
    if (frame < p0) {
      return null;
    }
    const up = interpolate(frame, [p0, p0 + POP_UP], [0, POP_OVER], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    });
    const back = interpolate(frame, [p0 + POP_UP, p0 + POP_UP + POP_BACK], [0, POP_OVER - 1], {
      easing: Easing.inOut(Easing.quad),
      ...clamp,
    });
    const scale = up - back;
    if (scale <= 0) {
      return null;
    }
    // the settle: a small damped dip once the pop is done, so the hold is alive
    const su = frame - (p0 + POP_UP + POP_BACK);
    const settle = su > 0 ? SETTLE_PX * Math.sin((su * Math.PI * 2) / 13) * Math.exp(-su / 7) : 0;
    const u = Math.max(0, frame - dropStart - dropDelay(tile));
    const fall = 0.5 * gravity * u * u;
    const y = tile.y + settle + fall;
    if (y > FRAME_H + TILE) {
      return null;
    }
    const rot = (DROP_SPIN[tile.i] / 1.1) * DROP_MAX_DEG * Math.min(1, u / 10);
    const cx = tile.x + TILE / 2;
    const cy = y + TILE / 2;
    const [kind, hue] = APPS[tile.i];
    // about the tile's own centre: turn, then grow
    const place = `translate(${cx.toFixed(3)} ${cy.toFixed(3)}) rotate(${rot.toFixed(3)}) scale(${scale.toFixed(4)})`;
    return (
      <g key={tile.i}>
        <g transform={`translate(${shadowOffset} ${shadowOffset})`}>
          <rect
            x={-TILE / 2}
            y={-TILE / 2}
            width={TILE}
            height={TILE}
            rx={TILE_R}
            fill={shadow}
            transform={place}
          />
        </g>
        <g transform={place}>
          <rect x={-TILE / 2} y={-TILE / 2} width={TILE} height={TILE} rx={TILE_R} fill={tileFill(hue)} />
          <g transform={`scale(${GLYPH_SCALE})`}>
            <Glyph kind={kind} fill={glyphOn(hue)} paper={tileFill(hue)} />
          </g>
        </g>
      </g>
    );
  });

  return svg(
    <>
      {clearing}
      {tiles}
    </>,
  );
};

export default CodeAndApps;
