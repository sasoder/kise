// SHARED_READY
import React, { useId } from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import {
  ACCENT,
  FRAME_H,
  FRAME_W,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  Vignette,
  clamp01,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
} from "./fieldShared";
import {
  CARD_GLYPH_CAP,
  CARD_GLYPH_FRACTION,
  CARD_GLYPH_JOIN,
  CARD_GLYPH_STROKE,
  CONTACT_SHADOW_OP,
  CONTACT_SHADOW_RX,
  CONTACT_SHADOW_RY,
  KRAFT_BASE,
  KraftBackground,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
} from "./d1Shared";
import type { Cam } from "./outgrowShared";

// ---------------------------------------------------------------------------
// wolffShared — the ONE WORLD of the Toto Wolff "Mercedes F1 financials" clip
// (Cheeky Pint S4E01), five cuts by three builders. Builder A owns this file;
// B and C import it and never edit it. Every export below keeps its name and
// meaning for the life of the clip (optional props may be added).
//
// THE CLIP'S ONE RULE: AMBER = PROFIT, and only profit. Revenue, valuations,
// sponsorship, tiles, labels, axes and lines are white at two opacities.
//
// THE VOCABULARY (the same object means the same thing in every cut):
//   a team          a TILE standing on the ground on its contact shadow (no
//                   ground line). Mercedes = the star tile; anonymous teams =
//                   a sport glyph knocked out; named rivals = their crest.
//   money taken in  a WHITE BAR standing on its tile's top edge (MoneyBar).
//   profit          the AMBER SLICE at the top of the revenue bar.
//   a valuation     a TRANSPARENT COLUMN rising from the slice's lower edge.
//   fundamentals    the profit slice stretched x20 inside its column:
//                   translucent amber with a rung every slice-height.
//
// COORDINATES. Everything is WORLD px, drawn inside `KraftStage`'s world group
// (one full-frame SVG under the camera's translate/scale). A tile's (x, y) is
// the centre of its BOTTOM edge — the point it stands on — so a tile on the
// ground is `y = GROUND_Y`, and a bar standing on it is `baseY = TILE_TOP`.
// Readout `y` is the text BASELINE.
//
// THE SIZE LAW (type, strokes, rungs, dashes — not tiles or bars, which are
// world objects): `sz(px, k)` takes a size in SCREEN px at K_REF 1.2 and
// returns WORLD px for the current camera k, so the screen size is
// px * (k / K_REF)^0.75 — 52 px numerals are 52 px at k 1.2, 76 at k 2.0,
// 40 at k 0.85.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const K_REF = 1.2;
/** The size law: SCREEN px at K_REF -> WORLD px at camera k (screen size grows as k^0.75). */
export const sz = (px: number, k: number) => (px / K_REF) * Math.pow(Math.max(k, 0.05) / K_REF, -0.25);

// --- palette ---------------------------------------------------------------------
export { ACCENT };
export const INK = "#FFFFFF";
export const INK_HI = 1.0; // the subject now
export const INK_LO = 0.55; // context
export const HALF_STEP = "#FFD98A"; // the one click per cut: 3 f on arrival, single objects only
export const VAL_FILL = 0.1; // valuation column: white fill opacity
export const FUND_FILL = 0.38; // fundamentals: amber fill opacity
export const FUND_RUNG = 0.9; // fundamentals: amber rung opacity
/** Frames a white element takes to change rung (INK_HI <-> INK_LO) when its role changes. */
export const RUNG_F = 12;

// --- the one stroke ----------------------------------------------------------------
export const STROKE_PX = 3.0; // screen px at K_REF, for EVERY line: axis, dashes, outlines, rungs, the sport line
/** World stroke width at camera k. Square caps, miter joins. */
export const strokeW = (k: number) => sz(STROKE_PX, k);

// --- geometry (world px) -------------------------------------------------------------
export const TILE = 96; // a team tile
export const BAR_W = 56; // every bar, slice, valuation column
export const PX_PER_B = 160; // world px per $1B (cuts 1-4)
export const GROUND_Y = 1300; // where tiles stand
export const TILE_TOP = GROUND_Y - TILE; // 1204: where bars stand
export const X_NOW = 540; // the Mercedes "now" column
export const NOW_REV_PX = 160; // $1B revenue
export const NOW_SLICE_PX = 48; // $300M profit (30 % of the bar)
export const MULTIPLE = 20; // $6B / $300M

// --- motion helpers ------------------------------------------------------------------
export { clamp01, smoothstep };
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Cubic ease-out, the text entrance's ease. */
export const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
/** 0..1 through the window [a, b], smoothstepped. */
export const win = (v: number, a: number, b: number) => smoothstep((v - a) / (b - a));
/** A zero-sloped settle bump (the house way to write back(0.75)): 0 at both ends with zero slope, `amp` at the middle. */
export const settleBump = (t: number, dur: number, amp: number) =>
  t <= 0 || t >= dur ? 0 : amp * Math.pow(Math.sin((Math.PI * t) / dur), 2);
/** A white element's rung, eased over RUNG_F frames from `from` to `to` starting at frame `f0`. */
export const rung = (f: number, f0: number, from: number, to: number) => lerp(from, to, smoothstep((f - f0) / RUNG_F));

// --- type ---------------------------------------------------------------------------
// Söhne, vendored (public/Sohne-*.otf), loaded at module scope so a font
// failure surfaces before a frame is drawn. Numerals Halbfett, words and years
// Buch, sentence case. Family names are this clip's own.
export const FONT_NUM = "WolffSohneHalbfett";
export const FONT_WORD = "WolffSohneBuch";
loadFont({ family: FONT_NUM, url: staticFile("Sohne-Halbfett.otf"), weight: "600" });
loadFont({ family: FONT_WORD, url: staticFile("Sohne-Buch.otf"), weight: "400" });
/** Type sizes in SCREEN px at K_REF; pass through `typeSize(kind, k)` for world px. */
export const TYPE_PX = { num: 52, word: 30, year: 26 } as const;
export type ReadoutKind = keyof typeof TYPE_PX;
export const fontOf = (kind: ReadoutKind) => (kind === "num" ? FONT_NUM : FONT_WORD);
export const weightOf = (kind: ReadoutKind) => (kind === "num" ? 600 : 400);
export const typeSize = (kind: ReadoutKind, k: number) => sz(TYPE_PX[kind], k);
/** Söhne metrics (em), measured off the vendored OTFs with fontTools. */
export const SOHNE = {
  cap: 0.718, // cap height
  fig: 0.729, // figure height incl. overshoot
  xh: 0.523, // x-height (Buch; Halbfett 0.526)
  asc: 0.729, // f, t ascender
  desc: 0.18, // p descender
  dollarDesc: 0.104, // "$" below the baseline
  dollarTop: 0.82, // "$" above the baseline
} as const;
/** Advance widths (em) of the strings this clip sets, so layouts can be solved without a DOM. */
export const ADVANCE_EM: Record<string, number> = {
  "$1B@num": 1.647,
  "30%@num": 1.999,
  "20×@num": 1.823,
  "$6B@num": 1.844,
  "revenue@word": 3.625,
  "profit@word": 2.415,
  "2015@year": 2.128,
  "2025@year": 2.311,
};
/** The slide-up of every text entrance, in SCREEN px. */
export const ENTER_LIFT_PX = 24;

// ---------------------------------------------------------------------------
// KRAFT STAGE: the kraft sheet (blur 13, dim 0.68, top light, foot shade) fed
// the camera with parallax 0.15; the world under the camera in one full-frame
// SVG with ONE global drop shadow; the vignette last. `sway` and the sheet's
// drift run on the act's story clock S, never on useCurrentFrame(), so cuts
// that share a world join pixel for pixel. `cam` is the camera CENTRE (what
// `cameraTrack` returns); `rest` is the act's opening camera (parallax origin).
// ---------------------------------------------------------------------------
export const PARALLAX = 0.15;
export const VIGNETTE = 0.55;

export const KraftStage: React.FC<{
  S: number;
  cam: Cam;
  rest: Cam;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ S, cam, rest, children, overlay }) => {
  const sw = sway(S);
  const k = cam.k;
  const tx = FRAME_W / 2 - cam.x * k + sw.dx;
  const ty = FRAME_H / 2 - cam.y * k + sw.dy;
  return (
    <AbsoluteFill style={{ backgroundColor: KRAFT_BASE }}>
      <KraftBackground frame={S} cy={cam.y} cyRest={rest.y} cx={cam.x} cxRest={rest.x} k={k} parallax={PARALLAX} />
      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))`,
        }}
      >
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
          <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})`}>{children}</g>
        </svg>
      </AbsoluteFill>
      {overlay}
      <Vignette strength={VIGNETTE} />
    </AbsoluteFill>
  );
};

// --- camera (the approved rig, re-exported unchanged) ---------------------------------
export { cameraTrack, camJerk, toScreen } from "./outgrowShared";
export type { Cam, Glide } from "./outgrowShared";

// ---------------------------------------------------------------------------
// TILES. One material: the white squircle tile (radius floors at 2 px), the
// vertical gradient TILE_GRAD_TOP -> TILE_GRAD_BOTTOM, TILE_SHADOW(k), the
// figure KNOCKED OUT through a mask so the paper shows through it, and a soft
// contact shadow on whatever it stands on. (x, y) = the centre of the tile's
// BOTTOM edge. `opacity` is the tile's ink rung (INK_HI subject, INK_LO context).
// ---------------------------------------------------------------------------
const svgId = (raw: string) => `w${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

const KnockoutTile: React.FC<{
  x: number;
  y: number;
  k: number;
  size: number;
  opacity: number;
  contact: boolean;
  /** drawn in BLACK in the tile's local box (0..size, origin top-left): what is knocked out */
  figure: React.ReactNode;
}> = ({ x, y, k, size, opacity, contact, figure }) => {
  const uid = svgId(useId());
  if (opacity <= 0.001 || size <= 0.5) return null;
  const tile = squirclePath(size, size, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  return (
    <g>
      {contact ? (
        <ellipse
          cx={x}
          cy={y + 1}
          rx={size * CONTACT_SHADOW_RX}
          ry={CONTACT_SHADOW_RY}
          fill="#000"
          opacity={CONTACT_SHADOW_OP * Math.min(1, opacity / INK_HI)}
          style={{ filter: "blur(3px)" }}
        />
      ) : null}
      <g transform={`translate(${(x - size / 2).toFixed(3)} ${(y - size).toFixed(3)})`} style={{ filter: TILE_SHADOW(k) }}>
        <defs>
          <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
            <rect width={size} height={size} fill="#fff" />
            {figure}
          </mask>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TILE_GRAD_TOP} />
            <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
          </linearGradient>
        </defs>
        <path d={tile} fill={`url(#${uid}g)`} opacity={opacity} mask={`url(#${uid}m)`} />
      </g>
    </g>
  );
};

// --- the Mercedes star ----------------------------------------------------------------
// A ring centred on the tile (outer 0.40 x size, inner 0.34 x size) and the
// three-pointed star: tips on the ring's inner radius at -90, 30, 150 deg,
// inner vertices on the bisectors (-30, 90, 210 deg) at MB_STAR_INNER x the
// ring's inner radius — a six-vertex polygon. The tips touch the ring, so ring
// and star are one knocked-out figure, as on the badge.
export const MB_RING_OUT = 0.4;
export const MB_RING_IN = 0.34;
export const MB_STAR_INNER = 0.17;

const mercedesFigure = (size: number) => {
  const c = size / 2;
  const ro = MB_RING_OUT * size;
  const ri = MB_RING_IN * size;
  const inner = MB_STAR_INNER * ri;
  const p = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(c + r * Math.cos(a)).toFixed(3)} ${(c + r * Math.sin(a)).toFixed(3)}`;
  };
  const ring =
    `M ${c + ro} ${c} A ${ro} ${ro} 0 1 0 ${c - ro} ${c} A ${ro} ${ro} 0 1 0 ${c + ro} ${c} Z ` +
    `M ${c + ri} ${c} A ${ri} ${ri} 0 1 1 ${c - ri} ${c} A ${ri} ${ri} 0 1 1 ${c + ri} ${c} Z`;
  const star = [-90, -30, 30, 90, 150, 210].map((a, i) => p(i % 2 === 0 ? ri : inner, a));
  return (
    <>
      <path d={ring} fill="#000" fillRule="evenodd" />
      <path d={`M ${star.join(" L ")} Z`} fill="#000" />
    </>
  );
};

export const MercedesTile: React.FC<{
  x: number;
  y: number;
  k: number;
  size?: number;
  opacity?: number;
  contact?: boolean;
}> = ({ x, y, k, size = TILE, opacity = INK_HI, contact = true }) => (
  <KnockoutTile x={x} y={y} k={k} size={size} opacity={opacity} contact={contact} figure={mercedesFigure(size)} />
);

// --- sport glyphs -----------------------------------------------------------------------
// Drawn for this clip on a 24-unit box in Lucide grammar (stroke 2.6, square
// caps, miter joins), knocked out exactly like d1Shared's SECTOR_GLYPHS. An
// element with fill="#000" is a solid part of the figure.
export const SPORT_NAMES = ["FOOTBALL", "BASKETBALL", "BASEBALL", "SOCCER", "HOCKEY", "RACECAR"] as const;
export type SportName = (typeof SPORT_NAMES)[number];
export const SPORT_GLYPHS: Record<SportName, string> = {
  // an American football: a lens from two arcs, tilted -35 deg; a lace line with three cross laces
  FOOTBALL: `<g transform="rotate(-35 12 12)"><path d="M1.6 12A11.6 11.6 0 0 1 22.4 12A11.6 11.6 0 0 1 1.6 12Z"/><path d="M7.8 12h8.4"/><path d="M8.8 10.5v3"/><path d="M12 10.5v3"/><path d="M15.2 10.5v3"/></g>`,
  // a basketball: circle, a vertical and a horizontal line, two side arcs
  BASKETBALL: `<circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="M5.2 4.7c3.3 4 3.3 10.6 0 14.6"/><path d="M18.8 4.7c-3.3 4-3.3 10.6 0 14.6"/>`,
  // a baseball: circle, two mirrored seam arcs
  BASEBALL: `<circle cx="12" cy="12" r="10"/><path d="M6 4c3.6 4.4 3.6 11.6 0 16"/><path d="M18 4c-3.6 4.4-3.6 11.6 0 16"/>`,
  // a soccer ball: circle, a small centre pentagon, five short spokes to the rim
  SOCCER: `<circle cx="12" cy="12" r="10"/><path d="M12 6.8l4.94 3.59-1.89 5.81h-6.1l-1.89-5.81z" fill="#000"/><path d="M12 6.8V2"/><path d="M16.94 10.39l4.57-1.48"/><path d="M15.05 16.2l2.83 3.89"/><path d="M8.95 16.2l-2.83 3.89"/><path d="M7.06 10.39l-4.57-1.48"/>`,
  // ice hockey: a stick and a puck
  HOCKEY: `<path d="M18.4 2 9.8 18.6H3"/><rect x="13.4" y="16.6" width="7.2" height="4" fill="#000" stroke="none"/>`,
  // an open-wheel car in side view, nose right: solid wheels, a T rear wing, the low body with a halo
  // hoop over the cockpit, the nose dropping into the front wing (three variants were tried; this one reads)
  RACECAR: `<circle cx="6.2" cy="16.8" r="3.4" fill="#000" stroke="none"/><circle cx="17.6" cy="17.4" r="2.9" fill="#000" stroke="none"/><path d="M2.6 11.4V6"/><path d="M0.8 6h4.4"/><path d="M2.6 11.4h12l7 4.2h2.2"/><path d="M8.6 11.4c.6-3 4-3.4 5.2-.6"/>`,
};

export const SportTile: React.FC<{
  x: number;
  y: number;
  k: number;
  sport: SportName;
  size?: number;
  opacity?: number;
  contact?: boolean;
}> = ({ x, y, k, sport, size = TILE, opacity = INK_HI, contact = true }) => {
  const g = size * CARD_GLYPH_FRACTION;
  const s = g / 24;
  const o = (size - g) / 2;
  return (
    <KnockoutTile
      x={x}
      y={y}
      k={k}
      size={size}
      opacity={opacity}
      contact={contact}
      figure={
        <g
          transform={`translate(${o} ${o}) scale(${s})`}
          fill="none"
          stroke="#000"
          strokeWidth={CARD_GLYPH_STROKE}
          strokeLinecap={CARD_GLYPH_CAP}
          strokeLinejoin={CARD_GLYPH_JOIN}
          dangerouslySetInnerHTML={{ __html: SPORT_GLYPHS[sport] }}
        />
      }
    />
  );
};

// --- logos ------------------------------------------------------------------------------
// A monochrome logo knocked out of a tile. The caller passes the figure's paths
// (the parts to KNOCK OUT: a crest's dark parts) and their viewBox; the figure
// is fitted, centred, into `fraction` of the tile. `figure` overrides it with
// any black-drawn node in the tile's local box (used for the F1 placeholder).
export type LogoPath = string | { d: string; fillRule?: "nonzero" | "evenodd" };
export const LOGO_FRACTION = 0.7;

export const LogoTile: React.FC<{
  x: number;
  y: number;
  k: number;
  paths?: LogoPath[];
  viewBox?: string | [number, number, number, number];
  size?: number;
  opacity?: number;
  contact?: boolean;
  fillRule?: "nonzero" | "evenodd";
  fraction?: number;
  figure?: React.ReactNode;
}> = ({
  x,
  y,
  k,
  paths = [],
  viewBox = "0 0 24 24",
  size = TILE,
  opacity = INK_HI,
  contact = true,
  fillRule = "nonzero",
  fraction = LOGO_FRACTION,
  figure,
}) => {
  const [vx, vy, vw, vh] = (typeof viewBox === "string" ? viewBox.trim().split(/[\s,]+/).map(Number) : viewBox) as [
    number,
    number,
    number,
    number,
  ];
  const box = size * fraction;
  const sc = box / Math.max(vw, vh);
  const ox = (size - vw * sc) / 2 - vx * sc;
  const oy = (size - vh * sc) / 2 - vy * sc;
  const fig =
    figure ?? (
      <g transform={`translate(${ox.toFixed(3)} ${oy.toFixed(3)}) scale(${sc.toFixed(5)})`} fill="#000">
        {paths.map((p, i) =>
          typeof p === "string" ? (
            <path key={i} d={p} fillRule={fillRule} />
          ) : (
            <path key={i} d={p.d} fillRule={p.fillRule ?? fillRule} />
          ),
        )}
      </g>
    );
  return <KnockoutTile x={x} y={y} k={k} size={size} opacity={opacity} contact={contact} figure={fig} />;
};

// ---------------------------------------------------------------------------
// MONEY. A bar is a tall tile: same gradient top -> bottom over its own
// height, same TILE_SHADOW, hard corners (radius floors at 2 px), no contact
// shadow (it stands on a tile, not on the ground). Width BAR_W, standing on
// baseY, growing upward by h.
// ---------------------------------------------------------------------------
export const MoneyBar: React.FC<{
  x: number;
  baseY: number;
  h: number;
  k: number;
  opacity?: number;
  w?: number;
}> = ({ x, baseY, h, k, opacity = INK_HI, w = BAR_W }) => {
  const uid = svgId(useId());
  if (h <= 0.05 || opacity <= 0.001) return null;
  return (
    <g transform={`translate(${(x - w / 2).toFixed(3)} ${(baseY - h).toFixed(3)})`} style={{ filter: TILE_SHADOW(k) }}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TILE_GRAD_TOP} />
          <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
        </linearGradient>
      </defs>
      <path d={squirclePath(w, h, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH)} fill={`url(#${uid}g)`} opacity={opacity} />
    </g>
  );
};

/** PROFIT: solid ACCENT, width BAR_W, from topY down h. Its upper corners are the
 *  bar's own (the bar's squircle cut off h below the top), its lower edge square. */
export const ProfitSlice: React.FC<{ x: number; topY: number; h: number; opacity?: number; w?: number }> = ({
  x,
  topY,
  h,
  opacity = 1,
  w = BAR_W,
}) => {
  if (h <= 0.05 || opacity <= 0.001) return null;
  return (
    <svg x={x - w / 2} y={topY} width={w} height={h} overflow="hidden">
      <path d={squirclePath(w, h + 16, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH)} fill={ACCENT} opacity={opacity} />
    </svg>
  );
};

/** A VALUATION: a transparent column (white outline at the one stroke + VAL_FILL),
 *  width BAR_W, from baseY (the profit slice's LOWER edge) up h. */
export const ValuationColumn: React.FC<{
  x: number;
  baseY: number;
  h: number;
  k: number;
  outlineOpacity?: number;
  fillOpacity?: number;
  w?: number;
}> = ({ x, baseY, h, k, outlineOpacity = INK_LO, fillOpacity = VAL_FILL, w = BAR_W }) => {
  if (h <= 0.05) return null;
  const d = squirclePath(w, h, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  return (
    <g transform={`translate(${(x - w / 2).toFixed(3)} ${(baseY - h).toFixed(3)})`}>
      <path d={d} fill={INK} fillOpacity={fillOpacity} />
      <path
        d={d}
        fill="none"
        stroke={INK}
        strokeOpacity={outlineOpacity}
        strokeWidth={strokeW(k)}
        strokeLinecap="square"
        strokeLinejoin="miter"
        style={{ filter: iconShadow(k) }}
      />
    </g>
  );
};

/** FUNDAMENTALS: the profit slice stretched — FUND_FILL amber from baseY up h,
 *  with an ACCENT rung (FUND_RUNG) every `unit` world px (unit = that team's
 *  slice height), at the one stroke. */
export const FundamentalsFill: React.FC<{
  x: number;
  baseY: number;
  h: number;
  unit: number;
  k: number;
  opacity?: number;
  w?: number;
}> = ({ x, baseY, h, unit, k, opacity = 1, w = BAR_W }) => {
  if (h <= 0.05 || opacity <= 0.001) return null;
  const n = unit > 0.5 ? Math.floor(h / unit + 1e-6) : 0;
  const rungs: React.ReactNode[] = [];
  for (let i = 1; i <= n; i++) {
    const yy = baseY - i * unit;
    rungs.push(<line key={i} x1={x - w / 2} x2={x + w / 2} y1={yy} y2={yy} />);
  }
  return (
    <g opacity={opacity}>
      <path
        transform={`translate(${(x - w / 2).toFixed(3)} ${(baseY - h).toFixed(3)})`}
        d={squirclePath(w, h, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH)}
        fill={ACCENT}
        fillOpacity={FUND_FILL}
      />
      <g
        stroke={ACCENT}
        strokeOpacity={FUND_RUNG}
        strokeWidth={strokeW(k)}
        strokeLinecap="square"
        style={{ filter: iconShadow(k) }}
      >
        {rungs}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// TYPE. A readout is Söhne at the size law: numerals Halbfett ("num"), words
// Buch ("word"), years Buch ("year"). `y` is the BASELINE. The entrance: slide
// up ENTER_LIFT_PX screen px while fading 0 -> 1, both ease-out; the caller
// drives `enter` 0 -> 1 linearly over 12 f (exit = the same run backwards). A
// numeral changing value in place is a hard tick: just change `text`.
// ---------------------------------------------------------------------------
export const Readout: React.FC<{
  x: number;
  y: number;
  text: string;
  kind: ReadoutKind;
  k: number;
  enter: number;
  color?: string;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
}> = ({ x, y, text, kind, k, enter, color = INK, opacity = INK_HI, anchor = "middle" }) => {
  const e = easeOut(enter);
  if (e <= 0.001 || opacity <= 0.001) return null;
  const lift = ((1 - e) * ENTER_LIFT_PX) / k;
  return (
    <text
      x={x}
      y={y + lift}
      fontFamily={fontOf(kind)}
      fontWeight={weightOf(kind)}
      fontSize={typeSize(kind, k)}
      textAnchor={anchor}
      fill={color}
      fillOpacity={e * opacity}
      style={{ filter: iconShadow(k) }}
    >
      {text}
    </text>
  );
};

// ---------------------------------------------------------------------------
// THE "NOW" COLUMN — Mercedes exactly as cut 1 resolves it: the star tile at
// X_NOW on GROUND_Y, the white bar NOW_REV_PX on TILE_TOP, the amber slice
// NOW_SLICE_PX on its top, "$1B" over "revenue" centred above the bar, "30%"
// over "profit" to the right of the slice. Cuts 1-4 all draw "now" through it.
//
// `labels` sets each label's { enter, opacity, color, text }; a label left
// out is fully entered at its resolved rung ("$1B" INK_HI, "revenue" INK_LO,
// "30%" ACCENT, "profit" INK_LO). The optional build props (barH, sliceH,
// tileDy, tileOpacity) exist for cut 1's build; leave them out for "now".
// `nowLabelLayout(k)` returns the label positions, for anything that has to
// sit relative to them.
// ---------------------------------------------------------------------------
export type LabelState = { enter?: number; opacity?: number; color?: string; text?: string };
export type NowLabels = { billion?: LabelState; revenue?: LabelState; thirty?: LabelState; profit?: LabelState };

// Gaps in SCREEN px at K_REF (through the size law like the type they space).
export const NOW_GAP_BAR_PX = 14; // bar top -> "revenue" baseline
export const NOW_GAP_ROW_PX = 10; // between the two rows of a stack
export const NOW_GAP_SIDE_PX = 16; // slice's right edge -> "30%"

export const nowLabelLayout = (k: number, barH: number = NOW_REV_PX) => {
  const fn = typeSize("num", k);
  const fw = typeSize("word", k);
  const barTop = TILE_TOP - barH;
  // above the bar: "revenue" (all x-height, no descender) on a baseline just
  // over the bar top; "$1B" (whose "$" dips under its baseline) above it
  const revenueY = barTop - sz(NOW_GAP_BAR_PX, k);
  const billionY = revenueY - SOHNE.xh * fw - sz(NOW_GAP_ROW_PX, k) - SOHNE.dollarDesc * fn;
  // right of the slice: "30%" over "profit", the pair centred on the slice
  const sliceMid = barTop + NOW_SLICE_PX / 2;
  const gap = sz(NOW_GAP_ROW_PX, k);
  const thirtyY = sliceMid + (SOHNE.fig * fn - gap - SOHNE.asc * fw) / 2;
  const profitY = thirtyY + gap + SOHNE.asc * fw;
  const sideX = X_NOW + BAR_W / 2 + sz(NOW_GAP_SIDE_PX, k);
  return {
    billion: { x: X_NOW, y: billionY, anchor: "middle" as const },
    revenue: { x: X_NOW, y: revenueY, anchor: "middle" as const },
    thirty: { x: sideX, y: thirtyY, anchor: "start" as const },
    profit: { x: sideX, y: profitY, anchor: "start" as const },
    /** ink bounds of the four labels (world px), for framing */
    top: billionY - SOHNE.dollarTop * fn,
    right: sideX + Math.max(ADVANCE_EM["30%@num"] * fn, ADVANCE_EM["profit@word"] * fw),
    halfWidth: (ADVANCE_EM["revenue@word"] * fw) / 2,
  };
};

export const NOW_LABEL_DEFAULTS = {
  billion: { text: "$1B", kind: "num" as const, opacity: INK_HI, color: INK },
  revenue: { text: "revenue", kind: "word" as const, opacity: INK_LO, color: INK },
  thirty: { text: "30%", kind: "num" as const, opacity: 1, color: ACCENT },
  profit: { text: "profit", kind: "word" as const, opacity: INK_LO, color: INK },
};

export const NowColumn: React.FC<{
  k: number;
  labels?: NowLabels;
  barH?: number;
  sliceH?: number;
  tileDy?: number;
  tileOpacity?: number;
  barOpacity?: number;
}> = ({
  k,
  labels = {},
  barH = NOW_REV_PX,
  sliceH = NOW_SLICE_PX,
  tileDy = 0,
  tileOpacity = INK_HI,
  barOpacity = INK_HI,
}) => {
  const L = nowLabelLayout(k, barH);
  const keys = ["billion", "revenue", "thirty", "profit"] as const;
  return (
    <g>
      <MercedesTile x={X_NOW} y={GROUND_Y + tileDy} k={k} opacity={tileOpacity} />
      <MoneyBar x={X_NOW} baseY={TILE_TOP + tileDy} h={barH} k={k} opacity={barOpacity} />
      <ProfitSlice x={X_NOW} topY={TILE_TOP + tileDy - barH} h={Math.min(sliceH, barH)} />
      {keys.map((key) => {
        const def = NOW_LABEL_DEFAULTS[key];
        const st = labels[key] ?? {};
        const pos = L[key];
        return (
          <Readout
            key={key}
            x={pos.x}
            y={pos.y}
            text={st.text ?? def.text}
            kind={def.kind}
            k={k}
            enter={st.enter ?? 1}
            color={st.color ?? def.color}
            opacity={st.opacity ?? def.opacity}
            anchor={pos.anchor}
          />
        );
      })}
    </g>
  );
};
