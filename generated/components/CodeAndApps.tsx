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
// block and finish on "code" (f66), then hold through the word; on "and apps"
// (f72) the WHITE bars themselves travel and swell into a 4 x 4 home-screen
// grid of app tiles, and the core-memory chain TRAILS each one (blue, purple,
// orange, two frames apart on the same path, never ahead of or larger than the
// white, tucking behind the tile as it lands); on "but" the tiles let go and
// fall out of frame under gravity, so f108-109 are empty.
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
  // the first bars leave for their tile here ("and")
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
  morphStart: 72,
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
// TOKENS: geometry, typing window (in px of "typed length"), and the tile each
// one gathers into (the nearest tile centre).
// ---------------------------------------------------------------------------
type Tok = {
  key: string;
  x: number;
  y: number;
  w: number;
  hue: Hue;
  s0: number; // typed length at which this token starts
  s1: number; // ... and completes
  tile: number;
  cursor: boolean;
};

const nearestTile = (cx: number, cy: number) => {
  let best = 0;
  let bestD = Infinity;
  for (const t of TILES) {
    const d = Math.hypot(t.x + TILE / 2 - cx, t.y + TILE / 2 - cy);
    if (d < bestD) {
      bestD = d;
      best = t.i;
    }
  }
  return best;
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
        x,
        y,
        w,
        hue,
        s0: typed,
        s1: typed + w,
        tile: nearestTile(x + w / 2, y + BAR_H / 2),
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

// The cursor's resting place once typing is done; it gathers like a token.
const CURSOR_REST: Tok = {
  key: "cursor",
  x: LAST.x + LAST.w + 6,
  y: LAST.y,
  w: CURSOR_W,
  hue: "w",
  s0: 0,
  s1: 0,
  tile: nearestTile(LAST.x + LAST.w + 6 + CURSOR_W / 2, LAST.y + BAR_H / 2),
  cursor: true,
};

const TILE_TOKENS: Tok[][] = TILES.map((t) =>
  TOKENS.concat([CURSOR_REST]).filter((k) => k.tile === t.i),
);
// the white token each tile's glyph rides in on
const PRIMARY: Tok[] = TILE_TOKENS.map((toks, i) => {
  const whites = toks.filter((k) => k.hue === "w" && !k.cursor);
  if (whites.length === 0) {
    throw new Error(`CodeAndApps: tile ${i} has no white token to become its core`);
  }
  return whites.reduce((a, b) => (b.w > a.w ? b : a));
});

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
export const CHAIN_STAGGER = 2;
export const MORPH_DUR = 11;
// the cursor blinks once in the hold between the last keystroke and the morph
export const BLINK_OFF = [2, 4]; // frames after typeEnd, inclusive
// a glyph scales up from the tile's centre once the tile is ~70 % of its size
export const GLYPH_AT_SIZE = 0.7;
export const GLYPH_DUR = 6;
export const DROP_MAX_DEG = 5;
// the seal's pop: up to SEAL_OVER in SEAL_POP frames, back to 1 in SEAL_SETTLE
export const SEAL_POP = 5;
export const SEAL_SETTLE = 5;
export const SEAL_OVER = 1.05;
// a syntax-coloured bar keeps its bar shape and slips under its tile
const SLIP_W = 120;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// a diagonal sweep, 0..2 frames
const tileStagger = (t: Tile) => (t.col + t.row) / 3;
const MAX_STAGGER = (COLS - 1 + ROWS - 1) / 3;
// the fraction of MORPH_DUR at which the eased tile reaches GLYPH_AT_SIZE
const GLYPH_T = (() => {
  const target = (GLYPH_AT_SIZE * TILE - BAR_H) / (TILE - BAR_H);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (EASE_LAND(mid) < target) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return hi;
})();
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

  // the last trail copy (orange, 3 staggers behind its core) has landed here
  const trailDelay = 3 * CHAIN_STAGGER;
  const landEnd = Math.ceil(morphStart + MAX_STAGGER + trailDelay + MORPH_DUR);

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

  // The settle: a small damped dip as each tile lands, so the hold is alive.
  const settle = (t: Tile) => {
    const land = morphStart + tileStagger(t) + 5;
    const u = frame - land;
    if (u <= 0) {
      return 0;
    }
    return 5 * Math.sin((u * Math.PI * 2) / 13) * Math.exp(-u / 7);
  };

  // ---- 2. GATHER ----------------------------------------------------------
  if (frame < landEnd) {
    return svg(
      <>
        {TILES.map((tile) => {
          const m0 = morphStart + tileStagger(tile);
          const prog = (delay: number) =>
            interpolate(frame, [m0 + delay, m0 + delay + MORPH_DUR], [0, 1], {
              easing: EASE_LAND,
              ...clamp,
            });
          const pCore = prog(0);
          // the trail: the same path, later. Blue nearest the core, orange last.
          const pBlue = prog(CHAIN_STAGGER);
          const pPurple = prog(2 * CHAIN_STAGGER);
          const pOrange = prog(3 * CHAIN_STAGGER);
          const dy = settle(tile);
          const toks = TILE_TOKENS[tile.i];
          const prim = PRIMARY[tile.i];
          const box = (t: Tok, p: number, fill: string, key: string, off = 0) => (
            <rect
              key={key}
              x={lerp(t.x, tile.x, p) + off}
              y={lerp(t.y, tile.y, p) + off}
              width={lerp(t.w, TILE, p)}
              height={lerp(BAR_H, TILE, p)}
              rx={lerp(t.cursor ? 4 : BAR_R, TILE_R, p)}
              fill={fill}
            />
          );
          // a syntax-coloured bar stays a bar: it rides to the tile's centre
          // and is covered as the white closes over it
          const slip = (t: Tok, p: number, fill: string, key: string, off = 0) => {
            const w = lerp(t.w, Math.min(t.w, SLIP_W), p);
            return (
              <rect
                key={key}
                x={lerp(t.x, tile.x + TILE / 2 - w / 2, p) + off}
                y={lerp(t.y, tile.y + TILE / 2 - BAR_H / 2, p) + off}
                width={w}
                height={BAR_H}
                rx={BAR_R}
                fill={fill}
              />
            );
          };
          const whites = toks.filter((t) => t.hue === "w");
          const hued = toks.filter((t) => t.hue !== "w");
          const gx = lerp(prim.x + prim.w / 2, tile.x + TILE / 2, pCore);
          const gy = lerp(prim.y + BAR_H / 2, tile.y + TILE / 2, pCore);
          const g0 = m0 + GLYPH_T * MORPH_DUR;
          const gs = interpolate(frame, [g0, g0 + GLYPH_DUR], [0, 1], {
            easing: Easing.out(Easing.cubic),
            ...clamp,
          });
          const [kind, gh] = GLYPHS[tile.i];
          return (
            <g key={tile.i} transform={`translate(0 ${dy.toFixed(3)})`}>
              {hued.map((t) => slip(t, pCore, shadow, `hs-${t.key}`, shadowOffset))}
              {hued.map((t) => slip(t, pCore, hueFill(t.hue), `h-${t.key}`))}
              {whites.map((t) => box(t, pCore, shadow, `s-${t.key}`, shadowOffset))}
              {box(prim, pOrange, orange, "o")}
              {box(prim, pPurple, purple, "p")}
              {box(prim, pBlue, blue, "b")}
              {whites.map((t) => box(t, pCore, ink, `w-${t.key}`))}
              {gs > 0 ? (
                <g transform={`translate(${gx.toFixed(3)} ${gy.toFixed(3)}) scale(${gs.toFixed(4)})`}>
                  <Glyph kind={kind} fill={glyphFill(gh)} paper={ink} chain={[orange, purple, blue]} />
                </g>
              ) : null}
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
        const y = tile.y + settle(tile) + fall;
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
              <g transform={`translate(${cx.toFixed(3)} ${cy.toFixed(3)})`}>
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
