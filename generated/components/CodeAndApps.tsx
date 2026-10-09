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
// block and finish on "code" (f66); on "and apps" the code is PACKED into a
// 4 x 4 home-screen grid of app tiles (see v5 below); on "but" the tiles let go
// and fall out of frame under gravity, so f108-109 are empty.
//
// v5, the user's revision ("a messy AI morph with no real structure"): the
// gather is a mechanical, axis-aligned, two-beat assembly, band by band. The
// 12 code lines are 4 bands of 3 lines; band r becomes grid row r.
//   BEAT 1, the horizontal snap: every bar slides only in x and resizes only in
//   width until each line is exactly 4 equal segments, one per tile column.
//   Long tokens split at the gutters, neighbours join, short lines stretch.
//   Syntax colours swap to white on the band's first frame.
//   BEAT 2, the vertical close: in each cell the three stripes move only in y
//   and grow only in height until they are one rounded-square tile, and its
//   glyph scales up from the centre.
// Bands start two frames apart from f70, top to bottom; the grid is whole at
// f86. No chain colours in the transition at all.
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
  // band 0 starts its horizontal snap here; each band below starts 2 frames later
  morphStart: z.number(),
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
  morphStart: 70,
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
type GlyphHue = "k" | "o" | "p" | "b";

// row-major. The outer columns and the top row are what the viewer sees.
const GLYPHS: [GlyphKind, GlyphHue][] = [
  ["chat", "b"],
  ["play", "k"],
  ["camera", "k"],
  ["envelope", "p"],
  ["music", "k"],
  ["clock", "b"],
  ["search", "k"],
  ["pin", "b"],
  ["heart", "p"],
  ["lock", "k"],
  ["grid", "b"],
  ["cart", "k"],
  ["bars", "k"],
  ["star", "b"],
  ["sun", "k"],
  ["person", "k"],
];

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

// The cursor's resting place once typing is done; it is packed like a token.
const CURSOR_REST: Tok = {
  key: "cursor",
  line: LAST.line,
  x: LAST.x + LAST.w + 6,
  y: LAST.y,
  w: CURSOR_W,
  hue: "w",
  s0: 0,
  s1: 0,
  cursor: true,
};

// ---------------------------------------------------------------------------
// THE PACKING. Bands of three code lines; band r becomes grid row r.
// ---------------------------------------------------------------------------
const CODE_LINES: number[] = [];
LINES.forEach((l, li) => {
  if (l) {
    CODE_LINES.push(li);
  }
});
if (CODE_LINES.length !== ROWS * 3) {
  throw new Error("CodeAndApps: the packing needs exactly three code lines per grid row");
}
const BANDS: number[][] = [0, 1, 2, 3].map((r) => CODE_LINES.slice(r * 3, r * 3 + 3));
const lineY = (li: number) => LINE_Y0 + li * LINE_PITCH;
const colX = (c: number) => GRID_X0 + c * COL_PITCH;
// the middle of each gutter: where a long token is cut
const CUTS = [0, 1, 2].map((c) => colX(c) + TILE + (COL_PITCH - TILE) / 2);
const colOf = (x: number) => CUTS.filter((b) => x > b).length;
const MIN_PIECE = 30; // never cut a sliver off a token

// One horizontally-moving piece of a line: [a0, b0] before the snap, [a1, b1]
// after it. Pieces cut from one token overlap by a bar radius at the cut, and
// pieces that join in one cell overlap by a bar radius at the join, so the
// union is seamless at both ends of the move.
type Piece = { key: string; a0: number; b0: number; a1: number; b1: number; r0: number };
type Raw = { key: string; a: number; b: number; cutL: boolean; cutR: boolean; col: number; r0: number };

const buildLine = (li: number): Piece[] => {
  const toks = TOKENS.concat([CURSOR_REST])
    .filter((t) => t.line === li)
    .sort((p, q) => p.x - q.x);
  const raws: Raw[] = [];
  toks.forEach((t) => {
    const cuts = CUTS.filter((b) => b - t.x >= MIN_PIECE && t.x + t.w - b >= MIN_PIECE);
    const edges = [t.x, ...cuts, t.x + t.w];
    for (let i = 0; i < edges.length - 1; i++) {
      const a = edges[i];
      const b = edges[i + 1];
      raws.push({
        key: `${t.key}-${i}`,
        a,
        b,
        cutL: i > 0,
        cutR: i < edges.length - 2,
        col: colOf((a + b) / 2),
        r0: t.cursor ? 4 : BAR_R,
      });
    }
  });
  const out: Piece[] = [];
  for (let c = 0; c < COLS; c++) {
    const X = colX(c);
    const mine = raws.filter((r) => r.col === c);
    if (mine.length === 0) {
      // nothing of this line lies in this column: the segment is drawn out of
      // the near end of the nearest bar (it starts hidden inside that bar)
      const centre = X + TILE / 2;
      let donor = raws[0];
      let best = Infinity;
      raws.forEach((r) => {
        const d = centre > r.b ? centre - r.b : r.a > centre ? r.a - centre : 0;
        if (d < best) {
          best = d;
          donor = r;
        }
      });
      const right = centre > donor.b;
      out.push({
        key: `fill-${li}-${c}`,
        a0: right ? Math.max(donor.a, donor.b - BAR_H) : donor.a,
        b0: right ? donor.b : Math.min(donor.b, donor.a + BAR_H),
        a1: X,
        b1: X + TILE,
        r0: donor.r0,
      });
    } else {
      const total = mine.reduce((sum, r) => sum + (r.b - r.a), 0);
      let acc = X;
      mine.forEach((r, i) => {
        const w = ((r.b - r.a) / total) * TILE;
        out.push({
          key: r.key,
          a0: r.a - (r.cutL ? BAR_R : 0),
          b0: r.b + (r.cutR ? BAR_R : 0),
          a1: Math.max(X, acc - (i > 0 ? BAR_R : 0)),
          b1: Math.min(X + TILE, acc + w + (i < mine.length - 1 ? BAR_R : 0)),
          r0: r.r0,
        });
        acc += w;
      });
    }
  }
  return out;
};
const BAND_PIECES: Piece[][][] = BANDS.map((lines) => lines.map(buildLine));

// A rounded rect with its own radius per corner (tl, tr, br, bl).
const rr = (x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number) =>
  [
    `M${(x + tl).toFixed(3)} ${y.toFixed(3)}`,
    `H${(x + w - tr).toFixed(3)}`,
    `A${tr.toFixed(3)} ${tr.toFixed(3)} 0 0 1 ${(x + w).toFixed(3)} ${(y + tr).toFixed(3)}`,
    `V${(y + h - br).toFixed(3)}`,
    `A${br.toFixed(3)} ${br.toFixed(3)} 0 0 1 ${(x + w - br).toFixed(3)} ${(y + h).toFixed(3)}`,
    `H${(x + bl).toFixed(3)}`,
    `A${bl.toFixed(3)} ${bl.toFixed(3)} 0 0 1 ${x.toFixed(3)} ${(y + h - bl).toFixed(3)}`,
    `V${(y + tl).toFixed(3)}`,
    `A${tl.toFixed(3)} ${tl.toFixed(3)} 0 0 1 ${(x + tl).toFixed(3)} ${y.toFixed(3)}Z`,
  ].join("");

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
export const BAND_STAGGER = 2; // each band starts this long after the one above
export const STEP = 5; // frames per beat: the snap, then the close
export const GLYPH_DELAY = 2; // into the close, when the gaps are all but shut
export const GLYPH_DUR = 4;
export const CLOSE_OVERRUN = 9; // px a stripe grows past its third of the tile
export const SETTLE_PX = 3; // ~1.5 % of a tile
// the cursor blinks once in the hold between the last keystroke and the morph
export const BLINK_OFF = [2, 4]; // frames after typeEnd, inclusive
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
  chain: [string, string, string];
}> = ({ kind, fill, paper, chain }) => {
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
        <g>
          <rect x={-42} y={6} width={24} height={36} rx={6} fill={chain[0]} />
          <rect x={-12} y={-38} width={24} height={80} rx={6} fill={chain[1]} />
          <rect x={18} y={-14} width={24} height={56} rx={6} fill={chain[2]} />
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
  const glyphFill = (h: GlyphHue) =>
    h === "o" ? orange : h === "p" ? purple : h === "b" ? blue : shadow;

  const bandStart = (row: number) => morphStart + row * BAND_STAGGER;
  // the last band has closed here: from now on a tile is one rect
  const landEnd = bandStart(ROWS - 1) + 2 * STEP;
  const glyphScale = (row: number) => {
    const g0 = bandStart(row) + STEP + GLYPH_DELAY;
    return interpolate(frame, [g0, g0 + GLYPH_DUR], [0, 1], {
      easing: Easing.out(Easing.cubic),
      ...clamp,
    });
  };

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
    const blinkOff = frame >= typeEnd + BLINK_OFF[0] && frame <= typeEnd + BLINK_OFF[1];
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
      </g>,
      seal,
    );
  }

  // The settle: a small damped dip once a band has closed, so the hold is alive.
  const settle = (row: number) => {
    const u = frame - (bandStart(row) + 2 * STEP);
    if (u <= 0) {
      return 0;
    }
    return SETTLE_PX * Math.sin((u * Math.PI * 2) / 13) * Math.exp(-u / 7);
  };

  // ---- 2. PACK: snap into columns, then close into tiles, band by band -----
  if (frame < landEnd) {
    return svg(
      <>
        {BANDS.map((lines, row) => {
          const u = frame - bandStart(row);
          if (u < 0) {
            // not yet: the typed code, exactly as it was left
            const toks = TOKENS.concat([CURSOR_REST]).filter((t) => lines.indexOf(t.line) >= 0);
            return (
              <g key={row}>
                {toks.map((t) => (
                  <g key={t.key}>
                    <rect
                      x={t.x + shadowOffset}
                      y={t.y + shadowOffset}
                      width={t.w}
                      height={BAR_H}
                      rx={t.cursor ? 4 : BAR_R}
                      fill={shadow}
                    />
                    <rect
                      x={t.x}
                      y={t.y}
                      width={t.w}
                      height={BAR_H}
                      rx={t.cursor ? 4 : BAR_R}
                      fill={hueFill(t.hue)}
                    />
                  </g>
                ))}
              </g>
            );
          }
          if (u < STEP) {
            // BEAT 1: x and width only
            const p = EASE_LAND(u / STEP);
            return (
              <g key={row}>
                {lines.map((li, k) => {
                  const bar = (pc: Piece, fill: string, off: number) => {
                    const a = lerp(pc.a0, pc.a1, p);
                    const w = lerp(pc.b0, pc.b1, p) - a;
                    return (
                      <rect
                        key={`${pc.key}-${off}`}
                        x={a + off}
                        y={lineY(li) + off}
                        width={w}
                        height={BAR_H}
                        rx={Math.min(lerp(pc.r0, BAR_R, p), w / 2)}
                        fill={fill}
                      />
                    );
                  };
                  return (
                    <g key={li}>
                      {BAND_PIECES[row][k].map((pc) => bar(pc, shadow, shadowOffset))}
                      {BAND_PIECES[row][k].map((pc) => bar(pc, ink, 0))}
                    </g>
                  );
                })}
              </g>
            );
          }
          // BEAT 2: y and height only. Outer corners grow to the tile's radius,
          // inner corners square off as the gaps shut.
          const q = EASE_LAND(Math.min(1, (u - STEP) / STEP));
          const outer = lerp(BAR_R, TILE_R, q);
          const inner = BAR_R * Math.max(0, 1 - q / 0.75);
          const third = TILE / 3;
          const gs = glyphScale(row);
          const yRow = GRID_Y0 + row * ROW_PITCH + settle(row);
          const stripes = lines.map((li, k) => ({
            y: lerp(lineY(li), yRow + k * third, q),
            // the upper stripes over-run into the one below, so the gaps are shut
            // by q ~ 0.8 and no hairline of shadow lingers through the ease's tail
            h: lerp(BAR_H, third + (k < 2 ? CLOSE_OVERRUN : 0), q),
            top: k === 0 ? outer : inner,
            bottom: k === 2 ? outer : inner,
          }));
          const cyCell = (stripes[0].y + stripes[2].y + stripes[2].h) / 2;
          return (
            <g key={row}>
              {[0, 1, 2, 3].map((c) => {
                const x = colX(c);
                const [kind, gh] = GLYPHS[row * COLS + c];
                return (
                  <g key={c}>
                    <g transform={`translate(${shadowOffset} ${shadowOffset})`}>
                      {stripes.map((st, k) => (
                        <path
                          key={k}
                          d={rr(x, st.y, TILE, st.h, st.top, st.top, st.bottom, st.bottom)}
                          fill={shadow}
                        />
                      ))}
                    </g>
                    {stripes.map((st, k) => (
                      <path
                        key={k}
                        d={rr(x, st.y, TILE, st.h, st.top, st.top, st.bottom, st.bottom)}
                        fill={ink}
                      />
                    ))}
                    {gs > 0 ? (
                      <g
                        transform={`translate(${(x + TILE / 2).toFixed(3)} ${cyCell.toFixed(3)}) scale(${gs.toFixed(4)})`}
                      >
                        <Glyph kind={kind} fill={glyphFill(gh)} paper={ink} chain={[orange, purple, blue]} />
                      </g>
                    ) : null}
                  </g>
                );
              })}
            </g>
          );
        })}
      </>,
    );
  }

  // ---- 3. HOLD, then 4. DROP ----------------------------------------------
  return svg(
    <>
      {TILES.map((tile) => {
        const u = Math.max(0, frame - dropStart - dropDelay(tile));
        const fall = 0.5 * gravity * u * u;
        const y = tile.y + settle(tile.row) + fall;
        if (y > FRAME_H + TILE) {
          return null;
        }
        const rot = (DROP_SPIN[tile.i] / 1.1) * DROP_MAX_DEG * Math.min(1, u / 10);
        const cx = tile.x + TILE / 2;
        const cy = y + TILE / 2;
        const [kind, gh] = GLYPHS[tile.i];
        const spin = `rotate(${rot.toFixed(3)} ${cx.toFixed(3)} ${cy.toFixed(3)})`;
        return (
          <g key={tile.i}>
            <g transform={`translate(${shadowOffset} ${shadowOffset})`}>
              <rect
                x={tile.x}
                y={y}
                width={TILE}
                height={TILE}
                rx={TILE_R}
                fill={shadow}
                transform={spin}
              />
            </g>
            <g transform={spin}>
              <rect x={tile.x} y={y} width={TILE} height={TILE} rx={TILE_R} fill={ink} />
              <g
                transform={`translate(${cx.toFixed(3)} ${cy.toFixed(3)}) scale(${Math.max(0.0001, glyphScale(tile.row)).toFixed(4)})`}
              >
                <Glyph kind={kind} fill={glyphFill(gh)} paper={ink} chain={[orange, purple, blue]} />
              </g>
            </g>
          </g>
        );
      })}
    </>,
  );
};

export default CodeAndApps;
