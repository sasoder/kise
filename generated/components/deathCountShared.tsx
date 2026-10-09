import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BLACK, INK, OP_FULL, OP_LOW, OP_MID, PAPER_BASE, SHADOW, SHADOW_OFF } from "./cerroShared";

// ---------------------------------------------------------------------------
// "BRENT — THE MINE DEATH COUNT" — the shared module (owner: builder A).
//
// Core Memory podcast, Ashlee Vance x Brent Underwood. Three opaque 9:16 cuts
// (RockCollapsedReports, NumberInflated, ZeroedItDown) in the core memory
// graphic standard, 1080 x 1920 at 24000/1001 fps. Same family as the Cerro
// Gordo set, so the palette, type, chain echo and camera come straight from
// `cerroShared`; this file adds the portrait frame and the set's own legend:
//
//   WHITE = the record. SOLID figure = a death the source counts. HOLLOW
//   figure (outline only) = the "up to" part of a range. Chain colours =
//   RETELLING. Counts sit in ROWS OF TEN, row-major from the top-left.
//   "The papers' number" = 30 slots: 8 solid, then 22 hollow (PAPERS_NUMBER).
//
// Exports (see out/deathcount/SHARED_READY.md): FPS, FRAME_W, FRAME_H,
// CAPTION_Y0, CAPTION_Y1, the cerroShared re-exports, TallPaper,
// worldTransformTall, WorldTall, Figure (+ figureGeom, figureStroke),
// gridPos, PAPERS_NUMBER, CaptionStripDebug, Newspaper.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const FRAME_W = 1080;
export const FRAME_H = 1920;
/** the user's captions sit in this screen band: nothing that must be read */
export const CAPTION_Y0 = 1080;
export const CAPTION_Y1 = 1250;

export {
  INK,
  WHITE,
  SHADOW,
  BLACK,
  ORANGE,
  PURPLE,
  BLUE,
  CHAIN,
  PAPER_BASE,
  SHADOW_OFF,
  STROKE,
  OP_FULL,
  OP_MID,
  OP_LOW,
  EASE_LAND,
  CHAIN_TRAVEL,
  CHAIN_STAGGER,
  CROWN_STEP,
  fontFamily,
  type,
  ShadowText,
  RiseText,
  textRise,
  ChainEcho,
  camEase,
  clamp,
  sway,
  runCamera2,
} from "./cerroShared";

// -- the ground, portrait ------------------------------------------------------
// FiveDaysUndergroundTall's PaperGroundTall, lifted out: the 3864 x 2164
// landscape photograph in a 1920*1.6 x 1080*1.6 box turned 90 deg (objectFit
// cover = 0.7985 of source), brightness 0.88 blur 3 on the image only, its own
// plane at parallax 0.15 in both axes off (cxRest, cyRest), drift -0.3 px per
// frame, scale 1 + (k - 1) * 0.3 capped at 1.25 (never above 1.0x of source).
// Slack at scale 1: +-324 px horizontally, +-576 px vertically; i.e. the
// camera may travel +-2160 / k world px in x off cxRest. Put cxRest / cyRest at
// the MIDDLE of the cut's camera travel.
const BG_OVERSIZE = 1.6;
const PAPER_SRC = "paper-supaclean-still.png";
const PAPER_PARALLAX = 0.15;

export const TallPaper: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  k: number;
  /** the camera position the photograph is centred at (default: frame centre) */
  cxRest?: number;
  cyRest?: number;
}> = ({ frame, cx, cy, k, cxRest = FRAME_W / 2, cyRest = FRAME_H / 2 }) => {
  const bgY = -(cy - cyRest) * k * PAPER_PARALLAX - frame * 0.3;
  const bgX = -(cx - cxRest) * k * PAPER_PARALLAX;
  const bgScale = Math.min(1 + (k - 1) * 0.3, 1.25);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_H * BG_OVERSIZE,
          height: FRAME_W * BG_OVERSIZE,
          objectFit: "cover",
          filter: "brightness(0.88) blur(3px)",
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)}) rotate(90deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

// -- the world layer, portrait ---------------------------------------------------
/** Puts world point (cx, cy) at screen (sx, sy) at scale k. Full precision.
 *  `css` goes on a div with transformOrigin "0 0"; `svg` on a <g>. */
export const worldTransformTall = (cx: number, cy: number, k: number, sx = FRAME_W / 2, sy = FRAME_H / 2) => {
  const tx = sx - cx * k;
  const ty = sy - cy * k;
  return {
    tx,
    ty,
    k,
    css: `translate(${tx}px, ${ty}px) scale(${k})`,
    svg: `translate(${tx} ${ty}) scale(${k})`,
  };
};

/**
 * The world: a 1080 x 1920 SVG (overflow visible) under translate + scale(k);
 * children are SVG in WORLD px. `blurX` (SCREEN px, default 0) is a
 * horizontal-only Gaussian for a fast pan (sigma ~ 0.22 x the camera's screen
 * px per frame, exactly 0 when slow); it needs a unique `id` per composition.
 */
export const WorldTall: React.FC<{
  cx: number;
  cy: number;
  k: number;
  sx?: number;
  sy?: number;
  blurX?: number;
  id?: string;
  children: React.ReactNode;
}> = ({ cx, cy, k, sx, sy, blurX = 0, id = "dc-world", children }) => {
  const t = worldTransformTall(cx, cy, k, sx, sy);
  const blurred = blurX > 0;
  return (
    <>
      {blurred ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id={`${id}-blur`} colorInterpolationFilters="sRGB" x="-12%" y="0%" width="124%" height="100%">
              <feGaussianBlur stdDeviation={`${blurX} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <AbsoluteFill style={blurred ? { filter: `url(#${id}-blur)` } : undefined}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: t.css,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {children}
          </svg>
        </div>
      </AbsoluteFill>
    </>
  );
};

// -- the figure ------------------------------------------------------------------
// A vector bust matching public/person.png, in a box of side S, origin
// top-left: head = circle, centre (0.50 S, 0.27 S), r 0.17 S; shoulders = a
// half-disc with a flat base, semicircle centre (0.50 S, 0.90 S), r 0.38 S,
// closed along y = 0.90 S. Ink runs y 0.10 S .. 0.90 S, x 0.12 S .. 0.88 S.
// GEOMETRY IS FROZEN (three cuts share it).
export const FIG_HEAD = { cx: 0.5, cy: 0.27, r: 0.17 } as const;
export const FIG_SHOULDERS = { cx: 0.5, cy: 0.9, r: 0.38 } as const;
/** the hollow outline's weight for a figure of side `size` */
export const figureStroke = (size: number) => Math.max(5, 0.085 * size);

/** Paths (box-local, origin top-left) for a figure of side `size`.
 *  `solid*` are the silhouette; `line*` are the outline's centrelines, inset by
 *  half the stroke so a stroke of `stroke` px has the silhouette's outer edge. */
export const figureGeom = (size: number) => {
  const w = figureStroke(size);
  const hx = FIG_HEAD.cx * size;
  const hy = FIG_HEAD.cy * size;
  const hr = FIG_HEAD.r * size;
  const sx = FIG_SHOULDERS.cx * size;
  const sy = FIG_SHOULDERS.cy * size;
  const sr = FIG_SHOULDERS.r * size;
  const ri = hr - w / 2;
  const si = sr - w / 2;
  const base = sy - w / 2;
  const dx = Math.sqrt(Math.max(0, si * si - (w / 2) * (w / 2)));
  return {
    stroke: w,
    solidHead: `M${hx - hr} ${hy} A${hr} ${hr} 0 1 1 ${hx + hr} ${hy} A${hr} ${hr} 0 1 1 ${hx - hr} ${hy} Z`,
    solidShoulders: `M${sx - sr} ${sy} A${sr} ${sr} 0 0 1 ${sx + sr} ${sy} Z`,
    // both centrelines start at their lowest-left point and run clockwise
    lineHead: `M${hx} ${hy + ri} A${ri} ${ri} 0 1 1 ${hx} ${hy - ri} A${ri} ${ri} 0 1 1 ${hx} ${hy + ri} Z`,
    lineShoulders: `M${sx - dx} ${base} A${si} ${si} 0 0 1 ${sx + dx} ${base} Z`,
  };
};

/**
 * THE FIGURE. (x, y) = the box's top-left, `size` its side, world px.
 *   mode "solid"  = filled: a death the source counts.
 *   mode "hollow" = outline only, drawn inside the silhouette: the "up to"
 *                   part of a range.
 * Both carry the hard +4/+4 black copy unless `shadow` is false (use false
 * for BLACK marks on white). `ink` = white, a chain colour, or black.
 * `draw` (0..1, hollow only, default 1) traces the outline on from one point
 * (a drawn line, not a fade): shoulders over the first 60 %, head over the rest.
 */
export const Figure: React.FC<{
  x: number;
  y: number;
  size: number;
  mode: "solid" | "hollow";
  ink?: string;
  shadow?: boolean;
  draw?: number;
}> = ({ x, y, size, mode, ink = INK, shadow = true, draw = 1 }) => {
  const g = figureGeom(size);
  const body = (fill: string) => {
    if (mode === "solid") {
      return (
        <>
          <path d={g.solidShoulders} fill={fill} />
          <path d={g.solidHead} fill={fill} />
        </>
      );
    }
    const pS = Math.max(0, Math.min(1, draw / 0.6));
    const pH = Math.max(0, Math.min(1, (draw - 0.6) / 0.4));
    const dash = (p: number) =>
      p >= 1 ? {} : { pathLength: 1, strokeDasharray: `${p} 1`, strokeDashoffset: 0 };
    return (
      <>
        {pS > 0 ? (
          <path
            d={g.lineShoulders}
            fill="none"
            stroke={fill}
            strokeWidth={g.stroke}
            strokeLinejoin="miter"
            strokeLinecap="butt"
            {...dash(pS)}
          />
        ) : null}
        {pH > 0 ? (
          <path
            d={g.lineHead}
            fill="none"
            stroke={fill}
            strokeWidth={g.stroke}
            strokeLinejoin="round"
            strokeLinecap="butt"
            {...dash(pH)}
          />
        ) : null}
      </>
    );
  };
  return (
    <g transform={`translate(${x} ${y})`}>
      {shadow ? <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{body(SHADOW)}</g> : null}
      {body(ink)}
    </g>
  );
};

// -- counts in rows of ten ---------------------------------------------------------
/** Slot i of a grid, row-major from the top-left. (x, y) = the slot's top-left
 *  offset from the grid's origin, world px. */
export const gridPos = (i: number, { cols = 10, pitchX, pitchY }: { cols?: number; pitchX: number; pitchY: number }) => {
  const col = i % cols;
  const row = Math.floor(i / cols);
  return { col, row, x: col * pitchX, y: row * pitchY };
};

/** "The papers' number": between 8 and 30. Slots 0-7 solid, 8-29 hollow.
 *  FROZEN. */
export const PAPERS_NUMBER: ("solid" | "hollow")[] = Array.from({ length: 30 }, (_, i) => (i < 8 ? "solid" : "hollow"));

// -- preview aid -------------------------------------------------------------------
/** Screen y 1080-1250 as a 25 % magenta band. Previews only. */
export const CaptionStripDebug: React.FC<{ on?: boolean }> = ({ on = false }) =>
  on ? (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: CAPTION_Y0,
          width: FRAME_W,
          height: CAPTION_Y1 - CAPTION_Y0,
          backgroundColor: "rgba(255, 0, 255, 0.25)",
        }}
      />
    </AbsoluteFill>
  ) : null;

// -- the newspaper -----------------------------------------------------------------
const nHash = (i: number, j: number) => {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const NEWS_LADDER = [OP_FULL, OP_FULL, OP_MID, OP_MID, OP_LOW] as const;
const NEWS_COLS = 3;

/** Where the print sits on a sheet of width w (everything is proportional to
 *  w, so the glyph is the same picture at 150 px and at 800 px). */
export const newspaperLayout = (w: number, h: number) => {
  const m = 0.06 * w; // margin
  const mastY = m;
  const mastH = 0.1 * w;
  const rule = Math.max(1.5, 0.008 * w);
  const rule1Y = mastY + mastH + 0.03 * w;
  const dateY = rule1Y + rule + 0.022 * w;
  const dateH = Math.max(2, 0.02 * w);
  const rule2Y = dateY + dateH + 0.022 * w;
  const bodyY = rule2Y + rule + 0.04 * w;
  const pitch = 0.036 * w; // text line pitch
  const barH = Math.max(2, 0.017 * w);
  const gutter = 0.045 * w;
  const colW = (w - 2 * m - (NEWS_COLS - 1) * gutter) / NEWS_COLS;
  const rows = Math.max(1, Math.floor((h - m - bodyY + (pitch - barH)) / pitch));
  return { m, mastY, mastH, rule, rule1Y, dateY, dateH, rule2Y, bodyY, pitch, barH, gutter, colW, rows };
};

/**
 * THE NEWSPAPER GLYPH. (x, y) = the sheet's top-left, world px. A white sheet
 * on the hard black shadow; on it in BLACK: one thick masthead BAR (never a
 * name: the paper that printed the figure is not verified), a thin rule, a
 * short dateline bar, a second rule, then three columns of text as word-bars
 * at the opacity ladder with column rules between them.
 *   printed  0..1 (default 1): the text bars print line by line from the top,
 *            each line wiping on left to right.
 *   sheet    false = draw the print only (the caller draws the sheet, e.g.
 *            through ChainEcho with core "static").
 *   shadow   false = no hard shadow under the sheet.
 */
export const Newspaper: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  printed?: number;
  sheet?: boolean;
  shadow?: boolean;
}> = ({ x, y, w, h, printed = 1, sheet = true, shadow = true }) => {
  const L = newspaperLayout(w, h);
  const bars: React.ReactNode[] = [];
  const shown = Math.max(0, Math.min(1, printed)) * L.rows;
  for (let r = 0; r < L.rows; r++) {
    const p = Math.max(0, Math.min(1, shown - r));
    if (p <= 0) break;
    const by = L.bodyY + r * L.pitch;
    for (let c = 0; c < NEWS_COLS; c++) {
      const colX = L.m + c * (L.colW + L.gutter);
      // a paragraph ends every 4-6 lines: that line stops short
      const para = 4 + Math.floor(nHash(c, 7) * 3);
      const short = (r + c * 2) % para === para - 1;
      const lineW = L.colW * (short ? 0.35 + 0.3 * nHash(r, c + 11) : 1);
      const limit = L.colW * p; // the wipe front, from the column's left edge
      let cursor = 0;
      let wi = 0;
      const gap = L.colW * 0.07;
      while (cursor < lineW - gap) {
        const want = L.colW * (0.16 + 0.34 * nHash(r * 3 + wi, c * 5 + 1));
        const bw = Math.min(want, lineW - cursor);
        if (bw < L.colW * 0.08) break;
        const vis = Math.min(bw, limit - cursor);
        if (vis > 0.25) {
          const op = NEWS_LADDER[Math.floor(nHash(r * 7 + wi, c * 13 + 3) * NEWS_LADDER.length)];
          bars.push(
            <rect
              key={`${r}-${c}-${wi}`}
              x={colX + cursor}
              y={by}
              width={vis}
              height={L.barH}
              fill={BLACK}
              opacity={op === 1 ? undefined : op}
            />,
          );
        }
        cursor += bw + gap;
        wi++;
      }
    }
  }
  const bodyBottom = L.bodyY + (L.rows - 1) * L.pitch + L.barH;
  return (
    <g transform={`translate(${x} ${y})`}>
      {sheet && shadow ? <rect x={SHADOW_OFF} y={SHADOW_OFF} width={w} height={h} fill={SHADOW} /> : null}
      {sheet ? <rect x={0} y={0} width={w} height={h} fill={INK} /> : null}
      {/* masthead: a bar, not a name */}
      <rect x={0.14 * w} y={L.mastY} width={0.72 * w} height={L.mastH} fill={BLACK} />
      <rect x={L.m} y={L.rule1Y} width={w - 2 * L.m} height={L.rule} fill={BLACK} />
      <rect x={0.36 * w} y={L.dateY} width={0.28 * w} height={L.dateH} fill={BLACK} opacity={OP_MID} />
      <rect x={L.m} y={L.rule2Y} width={w - 2 * L.m} height={L.rule} fill={BLACK} />
      {/* column rules */}
      {Array.from({ length: NEWS_COLS - 1 }, (_, c) => (
        <rect
          key={`cr-${c}`}
          x={L.m + (c + 1) * L.colW + (c + 0.5) * L.gutter - L.rule / 2}
          y={L.bodyY}
          width={L.rule}
          height={bodyBottom - L.bodyY}
          fill={BLACK}
          opacity={OP_MID}
        />
      ))}
      {bars}
    </g>
  );
};
