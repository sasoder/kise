import React, { useEffect, useId, useState } from "react";
import { AbsoluteFill, Img, cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { MB_RING_IN, MB_RING_OUT, MB_STAR_INNER } from "./wolffShared";
import { CRESTS, type Crest, type CrestId } from "./wolffLogos";

// ---------------------------------------------------------------------------
// cheekyPint2 — LOOK DEVELOPMENT for "Cheeky Pint 2.0" (Oct 2 2026, director's
// brief out/wolff/briefs/LOOKDEV.md). Three looks for the same clip world, as
// themes over ONE scene description, so a frame's layout is identical in every
// look and only the material changes:
//
//   freshKraft  the evolution. The kraft photo crisp and light (baked, fibres
//               boosted), a warm key light from the upper centre, a light warm
//               vignette, fine film grain. Cream card stock (#F6F0E4) with its
//               own fibre and near-square corners, lifted off the sheet by a
//               two-layer warm shadow (key + ambient) whose offset and spread
//               grow with the lift. Espresso ink (#1C1410) at two opacities for
//               type, rules, outlines and the printed crest figures. Amber
//               #F6A400 -> #E08C00, solid, with a thin specular top edge.
//               Valuations are frosted glass: the paper behind them blurred,
//               a cream tint, an espresso hairline.
//   stout       the pub after dark. Stout-black warm brown (#17110C) with the
//               kraft fibres faintly in it, a warm amber pool of light behind
//               the subject, vignette 0.45, grain. Cream beer-mat cards with
//               the figures knocked out to the dark ground; cream hairline
//               glass; amber that glows like back-lit ale (bloom on amber
//               only) with a hot top edge.
//   print       a screen-printed beer label. The crisp kraft of look 1; every
//               element is INK on it — a cream ink layer (with a cream
//               underbase under the spot colour), the amber spot layer
//               misregistered by ~2 px, and the espresso key layer printed
//               last. Each ink is eaten a little by a speckle texture; shading
//               is halftone dots (6 px screen at 45 deg), never a gradient;
//               no drop shadows except one soft lift under the subject.
//
// COORDINATES: screen px of the 1080 x 1920 frame (the stills are laid out at
// their final framing; a motion version wraps the same primitives in the
// clip's camera, `toScreen` and the size law).
//
// TEXTURES are baked once by scripts/build-cheekypint2-textures.py into
// public/cheekypint2/ (1296 x 2304, 1.2 x the frame for parallax headroom);
// this file only draws them (no live blur of the ground).
// ---------------------------------------------------------------------------

export const LOOKS = ["freshKraft", "stout", "print"] as const;
export type Look = (typeof LOOKS)[number];
export const FRAME_W = 1080;
export const FRAME_H = 1920;

// --- type ----------------------------------------------------------------------------------
// Söhne, vendored. Hero numerals Dreiviertelfett (700); labels Kräftig (500),
// caps tracked +0.06 em with the `case` feature (the vendored Söhne has no
// smcp, so "small caps" are caps set small).
export const FONT_HERO = "CP2SohneDreiviertelfett";
export const FONT_LABEL = "CP2SohneKraftig";
loadFont({ family: FONT_HERO, url: staticFile("Sohne-Dreiviertelfett.otf"), weight: "700" });
loadFont({ family: FONT_LABEL, url: staticFile("Sohne-Kraftig.otf"), weight: "500" });

/** Söhne metrics in em, measured off the vendored OTFs with fontTools. */
export const SOHNE2 = {
  cap: 0.718,
  fig: 0.729, // figures incl. overshoot
  dollarTop: 0.818, // "$" above the baseline (Dreiviertelfett)
  dollarDesc: 0.102, // "$" below it
} as const;
export const HERO_TRACK = -0.015; // em: display numerals set a touch tight
export const LABEL_TRACK = 0.06; // em: caps labels tracked out

// advance widths (em), fontTools
const ADV_HERO: Record<string, number> = {
  "0": 0.646, "1": 0.409, "2": 0.584, "3": 0.586, "4": 0.619, "5": 0.586, "6": 0.603, "7": 0.57, "8": 0.609,
  "9": 0.603, $: 0.61, "%": 0.788, "×": 0.608, B: 0.649, M: 0.868, " ": 0.199, "·": 0.264, ".": 0.254,
};
const ADV_LABEL: Record<string, number> = {
  A: 0.709, B: 0.639, C: 0.667, D: 0.701, E: 0.594, F: 0.577, G: 0.727, H: 0.736, I: 0.264, J: 0.403, K: 0.657,
  L: 0.549, M: 0.854, N: 0.727, O: 0.73, P: 0.632, Q: 0.73, R: 0.653, S: 0.59, T: 0.62, U: 0.693, V: 0.687,
  W: 0.932, X: 0.673, Y: 0.647, Z: 0.629, " ": 0.206, "×": 0.608, "·": 0.225,
};
/** Advance width in px of a hero string at `size` (tracking included). */
export const heroWidth = (text: string, size: number) =>
  [...text].reduce((a, c) => a + (ADV_HERO[c] ?? 0.6), 0) * size + HERO_TRACK * size * (text.length - 1);
/** Advance width in px of a caps label at `size` (tracking between letters only). */
export const labelWidth = (text: string, size: number) =>
  [...text.toUpperCase()].reduce((a, c) => a + (ADV_LABEL[c] ?? 0.62), 0) * size + LABEL_TRACK * size * (text.length - 1);

// --- textures ---------------------------------------------------------------------------------
export const TEX = {
  fresh: "cheekypint2/kraft-fresh.jpg",
  frost: "cheekypint2/kraft-frost.jpg",
  stout: "cheekypint2/stout.jpg",
  grain: "cheekypint2/grain.png",
  card: "cheekypint2/card.png",
  speckle: "cheekypint2/speckle.png",
} as const;
export const TEX_W = 1296;
export const TEX_H = 2304;
/** A baked texture drawn 1:1, centred on the frame (dx/dy: parallax / drift offsets). */
const texStyle = (dx = 0, dy = 0): React.CSSProperties => ({
  position: "absolute",
  left: (FRAME_W - TEX_W) / 2 + dx,
  top: (FRAME_H - TEX_H) / 2 + dy,
  width: TEX_W,
  height: TEX_H,
});

/** Hold the frame until textures used outside <Img> (CSS masks) are decoded. */
const usePreload = (srcs: string[]) => {
  const [handle] = useState(() => delayRender(`cheekyPint2 textures: ${srcs.join(", ")}`));
  useEffect(() => {
    Promise.all(
      srcs.map((s) => {
        const im = new Image();
        im.src = staticFile(s);
        return im.decode();
      }),
    )
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

// --- the scene description (shared by every look) ------------------------------------------------
export type Role = "hi" | "lo"; // the subject now / context
export type Figure = { kind: "mercedes" } | { kind: "crest"; id: CrestId };
/** A team: a square tile. (x, y) = the centre of its BOTTOM edge, the point it stands on. */
export type TileP = { x: number; y: number; size: number; figure: Figure; role: Role };
/** Money taken in: a card standing on baseY, growing up h. `accent` = the clip's amber (Mercedes' sponsorship). */
export type BarP = { x: number; baseY: number; w: number; h: number; role: Role; accent?: boolean };
/** Profit: the amber top of a revenue bar, from topY down h. */
export type SliceP = { x: number; topY: number; w: number; h: number };
/** A valuation: glass rising from baseY (the slice's lower edge) up h. */
export type GlassP = { x: number; baseY: number; w: number; h: number; role: Role };
/** Fundamentals: profit stretched x20 inside its glass, a rung every `unit`. */
export type FillP = { x: number; baseY: number; w: number; h: number; unit: number; full: boolean };
/** Type. y is the BASELINE. `on` = what it is printed on (default the ground): "accent" an amber shape,
 *  "card" a cream card; `tone: "accent"` = the number IS profit. */
export type TextP = {
  text: string;
  x: number;
  y: number;
  size: number;
  kind: "hero" | "label";
  role: Role;
  anchor?: "start" | "middle" | "end";
  on?: "accent" | "card";
  tone?: "accent";
};
export type Scene = {
  tiles: TileP[];
  bars: BarP[];
  slices: SliceP[];
  glass: GlassP[];
  fills: FillP[];
  texts: TextP[];
  /** the subject's centre: stout's light pool sits behind it */
  focus: { x: number; y: number; rx: number; ry: number };
  /** the subject's footprint (rects): print's one soft lift */
  subject: { x: number; y: number; w: number; h: number }[];
};

// --- themes --------------------------------------------------------------------------------------
type Shadow = (lift: number, x: number) => string;
export type Theme = {
  look: Look;
  ground: string;
  groundBase: string;
  keyLight: string | null;
  pool: string | null; // stout: rgba of the pool's centre
  vignette: string;
  grain: { opacity: number; blend: "overlay" | "soft-light" };
  ink: string;
  inkHi: number;
  inkLo: number;
  card: string;
  cardFoot: string;
  cardFibre: number;
  radius: number;
  accentTop: string;
  accentFoot: string;
  accentSpec: string;
  onAccent: string;
  onCard: string; // type printed on a cream card (stout: knocked out to the dark)
  figureMode: "ink" | "ground";
  glassTint: string;
  glassTintOp: number;
  frost: boolean;
  glassStroke: string;
  glassHi: number;
  glassLo: number;
  stroke: number;
  rung: string;
  rungOp: number;
  rungW: number;
  lo: number; // print: a context element's halftone coverage
  cardLo: string; // a context card's tone (opaque: pushed back, never a ghost)
  cardLoFoot: string;
  figureLo: number; // its printed figure: ink mixed this far into the card
  shadow: Shadow;
  bloom: string | null;
  edgeLight: number; // a card's lit top edge (white alpha)
};

const warm = (a: number) => `rgba(54,28,8,${a.toFixed(3)})`;
/** Two-layer card shadow: a tight key shadow + a broad ambient one; offset and spread grow with lift.
 *  The key light sits above the frame centre, so a card off-centre throws its shadow outward a little. */
const paperShadow: Shadow = (L, x) => {
  const dx = ((x - FRAME_W / 2) / (FRAME_W / 2)) * 0.32 * L;
  return (
    `drop-shadow(${(dx * 0.5).toFixed(2)}px ${(0.5 + 0.38 * L).toFixed(2)}px ${(0.8 + 0.55 * L).toFixed(2)}px ${warm(0.46)}) ` +
    `drop-shadow(${dx.toFixed(2)}px ${(1.45 * L).toFixed(2)}px ${(4 + 2.9 * L).toFixed(2)}px ${warm(0.24)})`
  );
};
const darkShadow: Shadow = (L) =>
  `drop-shadow(0 ${(0.6 + 0.4 * L).toFixed(2)}px ${(1 + 0.6 * L).toFixed(2)}px rgba(0,0,0,0.55)) ` +
  `drop-shadow(0 ${(1.6 * L).toFixed(2)}px ${(6 + 3 * L).toFixed(2)}px rgba(0,0,0,0.45))`;

export const THEMES: Record<Look, Theme> = {
  freshKraft: {
    look: "freshKraft",
    ground: TEX.fresh,
    groundBase: "#C9A77C",
    keyLight:
      "radial-gradient(ellipse 76% 50% at 50% 32%, rgba(255,247,231,0.21) 0%, rgba(255,247,231,0.09) 46%, rgba(255,247,231,0) 100%)",
    pool: null,
    vignette:
      "radial-gradient(ellipse 108% 100% at 50% 46%, rgba(46,24,8,0) 50%, rgba(46,24,8,0.09) 74%, rgba(46,24,8,0.25) 100%)",
    grain: { opacity: 0.32, blend: "overlay" },
    ink: "#1C1410",
    inkHi: 0.96,
    inkLo: 0.58,
    card: "#F7F2E7",
    cardFoot: "#EEE6D5",
    cardFibre: 0.85,
    radius: 3,
    accentTop: "#F6A400",
    accentFoot: "#E08C00",
    accentSpec: "#FFD98E",
    onAccent: "#1C1410",
    onCard: "#1C1410",
    figureMode: "ink",
    glassTint: "#FFF2D8",
    glassTintOp: 0.66,
    frost: true,
    glassStroke: "#1C1410",
    glassHi: 0.88,
    glassLo: 0.42,
    stroke: 2.2,
    rung: "#1C1410",
    rungOp: 0.26,
    rungW: 1.5,
    lo: 0.56,
    cardLo: "#E4D4B9",
    cardLoFoot: "#D9C7A9",
    figureLo: 0.5,
    shadow: paperShadow,
    bloom: null,
    edgeLight: 0.7,
  },
  stout: {
    look: "stout",
    ground: TEX.stout,
    groundBase: "#17110C",
    keyLight: "radial-gradient(ellipse 80% 40% at 50% 18%, rgba(255,236,210,0.035) 0%, rgba(255,236,210,0) 100%)",
    pool: "rgba(255,166,60,0.17)",
    vignette:
      "radial-gradient(ellipse 104% 100% at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.17) 70%, rgba(0,0,0,0.45) 100%)",
    grain: { opacity: 0.42, blend: "overlay" },
    ink: "#F3EBDD",
    inkHi: 1,
    inkLo: 0.52,
    card: "#F4ECDE",
    cardFoot: "#E6DBC7",
    cardFibre: 0.9,
    radius: 6,
    accentTop: "#F7A600",
    accentFoot: "#E08C00",
    accentSpec: "#FFE7A8",
    onAccent: "#17110C",
    onCard: "#17110C",
    figureMode: "ground",
    glassTint: "#F3EBDD",
    glassTintOp: 0.055,
    frost: false,
    glassStroke: "#F3EBDD",
    glassHi: 0.9,
    glassLo: 0.46,
    stroke: 2,
    rung: "#17110C",
    rungOp: 0.42,
    rungW: 1.5,
    lo: 0.4,
    cardLo: "#65574A",
    cardLoFoot: "#56493D",
    figureLo: 0,
    shadow: darkShadow,
    bloom:
      "drop-shadow(0 0 7px rgba(255,178,40,0.42)) drop-shadow(0 0 24px rgba(255,150,0,0.30)) drop-shadow(0 0 60px rgba(255,140,0,0.12))",
    edgeLight: 0.85,
  },
  print: {
    look: "print",
    ground: TEX.fresh,
    groundBase: "#C9A77C",
    keyLight:
      "radial-gradient(ellipse 72% 46% at 50% 30%, rgba(255,247,231,0.10) 0%, rgba(255,247,231,0.04) 46%, rgba(255,247,231,0) 100%)",
    pool: null,
    vignette:
      "radial-gradient(ellipse 108% 100% at 50% 46%, rgba(46,24,8,0) 52%, rgba(46,24,8,0.07) 76%, rgba(46,24,8,0.2) 100%)",
    grain: { opacity: 0.26, blend: "overlay" },
    ink: "#21170F",
    inkHi: 1,
    inkLo: 0.62,
    card: "#F4EBDA", // the cream ink
    cardFoot: "#F4EBDA",
    cardFibre: 0,
    radius: 2,
    accentTop: "#F8A500",
    accentFoot: "#F8A500",
    accentSpec: "#F8A500",
    onAccent: "#21170F",
    onCard: "#21170F",
    figureMode: "ink",
    glassTint: "#F4EBDA",
    glassTintOp: 1,
    frost: false,
    glassStroke: "#21170F",
    glassHi: 1,
    glassLo: 0.62,
    stroke: 2.4,
    rung: "#21170F",
    rungOp: 0.55,
    rungW: 1.6,
    lo: 0.55,
    cardLo: "#F4EBDA",
    cardLoFoot: "#F4EBDA",
    figureLo: 0.62,
    shadow: () => "none",
    bloom: null,
    edgeLight: 0,
  },
};

// --- geometry helpers ----------------------------------------------------------------------------
const f2 = (v: number) => v.toFixed(2);
/** A clockwise rounded rect (top-left x, y); `top` / `bottom` round only those corners. */
export const rectD = (x: number, y: number, w: number, h: number, r: number, top = true, bottom = true) => {
  const rt = top ? Math.max(0, Math.min(r, w / 2, h / 2)) : 0;
  const rb = bottom ? Math.max(0, Math.min(r, w / 2, h / 2)) : 0;
  return (
    `M${f2(x + rt)} ${f2(y)}H${f2(x + w - rt)}` +
    (rt ? `A${f2(rt)} ${f2(rt)} 0 0 1 ${f2(x + w)} ${f2(y + rt)}` : "") +
    `V${f2(y + h - rb)}` +
    (rb ? `A${f2(rb)} ${f2(rb)} 0 0 1 ${f2(x + w - rb)} ${f2(y + h)}` : "") +
    `H${f2(x + rb)}` +
    (rb ? `A${f2(rb)} ${f2(rb)} 0 0 1 ${f2(x)} ${f2(y + h - rb)}` : "") +
    `V${f2(y + rt)}` +
    (rt ? `A${f2(rt)} ${f2(rt)} 0 0 1 ${f2(x + rt)} ${f2(y)}` : "") +
    "Z"
  );
};
const tileBox = (t: TileP) => ({ x: t.x - t.size / 2, y: t.y - t.size, w: t.size, h: t.size });
const barBox = (b: { x: number; baseY: number; w: number; h: number }) => ({ x: b.x - b.w / 2, y: b.baseY - b.h, w: b.w, h: b.h });
const sliceBox = (s: SliceP) => ({ x: s.x - s.w / 2, y: s.topY, w: s.w, h: s.h });
const svgId = (raw: string) => `cp${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- figures ---------------------------------------------------------------------------------------
// The Mercedes star exactly as wolffShared draws it (ring 0.40 / 0.34 of the
// tile, star tips on the inner ring, inner vertices at MB_STAR_INNER), in the
// tile's local box, painted `color`.
const MercedesFigure: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  const c = size / 2;
  const ro = MB_RING_OUT * size;
  const ri = MB_RING_IN * size;
  const inner = MB_STAR_INNER * ri;
  const p = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${f2(c + r * Math.cos(a))} ${f2(c + r * Math.sin(a))}`;
  };
  const ring =
    `M ${c + ro} ${c} A ${ro} ${ro} 0 1 0 ${c - ro} ${c} A ${ro} ${ro} 0 1 0 ${c + ro} ${c} Z ` +
    `M ${c + ri} ${c} A ${ri} ${ri} 0 1 1 ${c - ri} ${c} A ${ri} ${ri} 0 1 1 ${c + ri} ${c} Z`;
  const star = [-90, -30, 30, 90, 150, 210].map((a, i) => p(i % 2 === 0 ? ri : inner, a));
  return (
    <g fill={color}>
      <path d={ring} fillRule="evenodd" />
      <path d={`M ${star.join(" L ")} Z`} />
    </g>
  );
};

/** A crest's 1-bit markup fitted into `crest.fraction` of a tile of `size` (as wolffLogos' crestFigure).
 *  invert=false: dark parts black, light parts white (a knock-out mask's figure);
 *  invert=true : the figure WHITE on nothing (a figure-only mask). */
const CrestFigure: React.FC<{ crest: Crest; size: number; invert: boolean }> = ({ crest, size, invert }) => {
  const [vx, vy, vw, vh] = crest.viewBox.trim().split(/[\s,]+/).map(Number);
  const sc = (size * (crest.fraction ?? 0.7)) / Math.max(vw, vh);
  const ox = (size - vw * sc) / 2 - vx * sc;
  const oy = (size - vh * sc) / 2 - vy * sc;
  const markup = invert
    ? crest.markup.replace(/#000/g, "#@@@").replace(/#fff/g, "#000").replace(/#@@@/g, "#fff")
    : crest.markup;
  return (
    <g
      transform={`translate(${ox.toFixed(3)} ${oy.toFixed(3)}) scale(${sc.toFixed(5)})`}
      fill={invert ? "#fff" : "#000"}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
};

/** The figure in the tile's local box: black on white (knock-out) or white on black (figure-only). */
const FigureMark: React.FC<{ figure: Figure; size: number; invert: boolean }> = ({ figure, size, invert }) => {
  if (figure.kind === "mercedes") return <MercedesFigure size={size} color={invert ? "#fff" : "#000"} />;
  const crest = CRESTS[figure.id];
  if (!crest) return null;
  return <CrestFigure crest={crest} size={size} invert={invert} />;
};

// --- shared SVG pieces ------------------------------------------------------------------------------
const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg
    width={FRAME_W}
    height={FRAME_H}
    viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
    style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}
  >
    {children}
  </svg>
);

/** Hero numerals and caps labels, flat ink (no shadow: ink sits on the paper). */
const TextMark: React.FC<{ t: TextP; color: string; opacity: number; filter?: string }> = ({ t, color, opacity, filter }) => {
  const hero = t.kind === "hero";
  const track = hero ? HERO_TRACK : LABEL_TRACK;
  const anchor = t.anchor ?? "middle";
  // letter-spacing adds space after the last glyph too: compensate the anchor
  const comp = anchor === "middle" ? (track * t.size) / 2 : anchor === "end" ? track * t.size : 0;
  return (
    <text
      x={f2(t.x + comp)}
      y={f2(t.y)}
      fontFamily={hero ? FONT_HERO : FONT_LABEL}
      fontWeight={hero ? 700 : 500}
      fontSize={t.size}
      letterSpacing={`${track}em`}
      textAnchor={anchor}
      fill={color}
      fillOpacity={opacity}
      style={{ fontFeatureSettings: hero ? '"tnum" 1, "lnum" 1' : '"case" 1', filter }}
    >
      {hero ? t.text : t.text.toUpperCase()}
    </text>
  );
};

// ===================================================================================================
// THE STAGE
// ===================================================================================================
export const CheekyPint2Stage: React.FC<{ look: Look; scene: Scene }> = ({ look, scene }) =>
  look === "print" ? <PrintStage scene={scene} /> : <CardStage theme={THEMES[look]} scene={scene} />;

/** Ground + light: the baked sheet 1:1, the key light (or stout's pool), under everything. */
const Ground: React.FC<{ th: Theme; scene: Scene }> = ({ th, scene }) => (
  <>
    <AbsoluteFill style={{ backgroundColor: th.groundBase }} />
    <Img src={staticFile(th.ground)} style={texStyle()} />
    {th.keyLight ? <AbsoluteFill style={{ background: th.keyLight }} /> : null}
    {th.pool ? (
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${f2(scene.focus.rx)}px ${f2(scene.focus.ry)}px at ${f2(scene.focus.x)}px ${f2(
            scene.focus.y,
          )}px, ${th.pool} 0%, ${th.pool.replace(/[\d.]+\)$/, "0.045)")} 45%, rgba(0,0,0,0) 100%)`,
          mixBlendMode: "screen",
        }}
      />
    ) : null}
  </>
);

/** Vignette and film grain: the last two layers of every look. */
const Finish: React.FC<{ th: Theme }> = ({ th }) => (
  <>
    <AbsoluteFill style={{ background: th.vignette, pointerEvents: "none" }} />
    <AbsoluteFill style={{ mixBlendMode: th.grain.blend, opacity: th.grain.opacity, pointerEvents: "none" }}>
      <Img src={staticFile(TEX.grain)} style={texStyle()} />
    </AbsoluteFill>
  </>
);

// ===================================================================================================
// LOOKS 1 + 2: CARD STOCK (freshKraft, stout)
// ===================================================================================================
/** Every amber shape shares ONE screen-space gradient (the band's top -> its foot), so a profit slice
 *  and the x20 fill that grows out of it read as one continuous material; only a true top surface
 *  (the hero's slice, a fill's level, Mercedes' tower) gets the lit edge. */
export const AMBER_Y0 = 300;
export const AMBER_Y1 = 1320;
const AmberGradient: React.FC<{ id: string; th: Theme }> = ({ id, th }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={AMBER_Y0} x2="0" y2={AMBER_Y1}>
    <stop offset="0" stopColor={th.accentTop} />
    <stop offset="1" stopColor={th.accentFoot} />
  </linearGradient>
);

/** Mix two #rrggbb colours (t = 0 -> a, 1 -> b). */
export const mixHex = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
};

/** A card's tone by role: the subject is lit cream; context is the same stock pushed back (darker,
 *  opaque, a shorter shadow) — never a translucent ghost. */
type Tone = { top: string; foot: string; figure: string; lift: number };
const toneOf = (th: Theme, role: Role): Tone =>
  role === "hi"
    ? { top: th.card, foot: th.cardFoot, figure: th.ink, lift: 4 }
    : { top: th.cardLo, foot: th.cardLoFoot, figure: mixHex(th.cardLo, th.ink, th.figureLo), lift: 2.5 };
/** Bars stand a little proud of their tiles (lift +2), so a bar casts onto the tile it stands on. */
const BAR_LIFT = 2;

const CardStage: React.FC<{ theme: Theme; scene: Scene }> = ({ theme: th, scene }) => {
  const uid = svgId(useId());
  const inkOp = (role: Role) => (role === "hi" ? th.inkHi : th.inkLo);
  const stout = th.look === "stout";

  // union outlines for the HTML texture layers (CSS clip-path)
  const glassD = scene.glass.map((g) => {
    const b = barBox(g);
    return rectD(b.x, b.y, b.w, b.h, th.radius, true, false);
  });
  const cardD = [
    ...scene.tiles.map((t) => {
      const b = tileBox(t);
      return rectD(b.x, b.y, b.w, b.h, th.radius);
    }),
    ...scene.bars.map((b0) => {
      const b = barBox(b0);
      return rectD(b.x, b.y, b.w, b.h, th.radius);
    }),
  ];
  const hasFill = (x: number) => scene.fills.some((f) => Math.abs(f.x - x) < 1 && f.h > 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: th.groundBase, overflow: "hidden" }}>
      <Ground th={th} scene={scene} />

      {/* frosted glass: the sheet behind each valuation, blurred (baked) */}
      {th.frost && glassD.length ? (
        <AbsoluteFill style={{ clipPath: `path("${glassD.join(" ")}")` }}>
          <Img src={staticFile(TEX.frost)} style={texStyle()} />
        </AbsoluteFill>
      ) : null}

      {/* BACK: glass bodies, then the x20 fills inside them */}
      <Svg>
        <defs>
          <linearGradient id={`${uid}sheen`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity={stout ? 0.075 : 0.42} />
            <stop offset="0.14" stopColor="#fff" stopOpacity={stout ? 0.02 : 0.12} />
            <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor={stout ? "#fff" : "#3a2410"} stopOpacity={stout ? 0.035 : 0.05} />
          </linearGradient>
          <AmberGradient id={`${uid}amb`} th={th} />
        </defs>
        {scene.glass.map((g, i) => {
          const b = barBox(g);
          const d = rectD(b.x, b.y, b.w, b.h, th.radius, true, false);
          return (
            <g key={`gb${i}`} style={{ filter: stout ? undefined : th.shadow(1.2, g.x) }}>
              <path d={d} fill={th.glassTint} fillOpacity={th.glassTintOp * (g.role === "hi" ? 1 : 0.9)} />
              <path d={d} fill={`url(#${uid}sheen)`} />
              {/* the glass's lit rim: left edge and top, inside the hairline */}
              <path
                d={`M${f2(b.x + th.stroke + 0.8)} ${f2(b.y + b.h)}V${f2(b.y + th.stroke + 0.8)}H${f2(b.x + b.w - th.stroke - 0.8)}`}
                fill="none"
                stroke="#fff"
                strokeOpacity={stout ? 0.12 : 0.55}
                strokeWidth={1.2}
              />
            </g>
          );
        })}
        <g style={{ filter: th.bloom ?? undefined }}>
          {scene.fills.map((f, i) => (
            <FillMark key={`f${i}`} th={th} f={f} uid={`${uid}f${i}`} grad={`${uid}amb`} />
          ))}
        </g>
      </Svg>

      {/* CARDS: contact shadows, tiles, bars; the amber slices and accent bars on their own (glow) pass */}
      <Svg>
        <defs>
          <AmberGradient id={`${uid}amb2`} th={th} />
        </defs>
        {scene.tiles.map((t, i) => (
          <ellipse
            key={`ao${i}`}
            cx={t.x}
            cy={t.y + 1.5}
            rx={t.size * 0.56}
            ry={Math.max(4, t.size * 0.035)}
            fill={stout ? "#000" : "#2a1606"}
            opacity={(stout ? 0.7 : 0.34) * (t.role === "hi" ? 1 : 0.65)}
            style={{ filter: `blur(${f2(Math.max(3, t.size * 0.03))}px)` }}
          />
        ))}
        {scene.tiles.map((t, i) => (
          <TileCard key={`t${i}`} th={th} t={t} tone={toneOf(th, t.role)} uid={`${uid}t${i}`} />
        ))}
        {scene.bars.map((b, i) =>
          b.accent ? null : <BarCard key={`b${i}`} th={th} b={b} tone={toneOf(th, b.role)} uid={`${uid}b${i}`} />,
        )}
        <g style={{ filter: th.bloom ?? undefined }}>
          {scene.bars.map((b, i) =>
            b.accent ? (
              <AccentCard key={`a${i}`} th={th} box={barBox(b)} grad={`${uid}amb2`} uid={`${uid}a${i}`} lift={6} x={b.x} round spec />
            ) : null,
          )}
          {scene.slices.map((s, i) => (
            <AccentCard
              key={`s${i}`}
              th={th}
              box={sliceBox(s)}
              grad={`${uid}amb2`}
              uid={`${uid}s${i}`}
              lift={0}
              x={s.x}
              round={false}
              spec={!hasFill(s.x)}
            />
          ))}
        </g>
      </Svg>

      {/* the card stock's own fibre, inside the cards only */}
      {th.cardFibre > 0 && cardD.length ? (
        <AbsoluteFill style={{ clipPath: `path("${cardD.join(" ")}")`, mixBlendMode: "soft-light", opacity: th.cardFibre }}>
          <Img src={staticFile(TEX.card)} style={texStyle()} />
        </AbsoluteFill>
      ) : null}

      {/* TOP: glass hairlines, then type */}
      <Svg>
        {scene.glass.map((g, i) => {
          const b = barBox(g);
          const r = th.radius;
          const s = th.stroke / 2;
          const d =
            `M${f2(b.x + s)} ${f2(b.y + b.h)}V${f2(b.y + s + r)}A${r} ${r} 0 0 1 ${f2(b.x + s + r)} ${f2(b.y + s)}` +
            `H${f2(b.x + b.w - s - r)}A${r} ${r} 0 0 1 ${f2(b.x + b.w - s)} ${f2(b.y + s + r)}V${f2(b.y + b.h)}`;
          return (
            <path
              key={`go${i}`}
              d={d}
              fill="none"
              stroke={th.glassStroke}
              strokeOpacity={g.role === "hi" ? th.glassHi : th.glassLo}
              strokeWidth={th.stroke}
              strokeLinecap="butt"
              strokeLinejoin="miter"
            />
          );
        })}
        {scene.texts.map((t, i) => {
          if (t.on === "accent") return <TextMark key={`x${i}`} t={t} color={th.onAccent} opacity={t.role === "hi" ? 0.94 : 0.62} />;
          if (t.on === "card") return <TextMark key={`x${i}`} t={t} color={th.onCard} opacity={t.role === "hi" ? 0.95 : 0.6} />;
          if (t.tone === "accent" && stout)
            return <TextMark key={`x${i}`} t={t} color={th.accentTop} opacity={1} filter={th.bloom ?? undefined} />;
          return <TextMark key={`x${i}`} t={t} color={th.ink} opacity={inkOp(t.role)} />;
        })}
      </Svg>

      <Finish th={th} />
    </AbsoluteFill>
  );
};

/** A team tile in card stock: the figure printed in ink (freshKraft) or knocked out to the ground (stout). */
const TileCard: React.FC<{ th: Theme; t: TileP; tone: Tone; uid: string }> = ({ th, t, tone, uid }) => {
  const b = tileBox(t);
  const d = rectD(b.x, b.y, b.w, b.h, th.radius);
  return (
    <g style={{ filter: th.shadow(tone.lift, t.x) }}>
      <defs>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={b.x} y={b.y} width={b.w} height={b.h}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#fff" />
          <g transform={`translate(${f2(b.x)} ${f2(b.y)})`}>
            <FigureMark figure={t.figure} size={t.size} invert={false} />
          </g>
        </mask>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone.top} />
          <stop offset="1" stopColor={tone.foot} />
        </linearGradient>
      </defs>
      {th.figureMode === "ink" ? <path d={d} fill={tone.figure} /> : null}
      <path d={d} fill={`url(#${uid}g)`} mask={`url(#${uid}k)`} />
      {th.edgeLight > 0 ? (
        <path
          d={`M${f2(b.x + th.radius)} ${f2(b.y + 0.75)}H${f2(b.x + b.w - th.radius)}`}
          stroke="#fff"
          strokeOpacity={th.edgeLight * (t.role === "hi" ? 1 : 0.5)}
          strokeWidth={1.5}
        />
      ) : null}
    </g>
  );
};

/** Money: a cream card standing on its tile. */
const BarCard: React.FC<{ th: Theme; b: BarP; tone: Tone; uid: string }> = ({ th, b, tone, uid }) => {
  const x = barBox(b);
  if (x.h <= 0.1) return null;
  return (
    <g style={{ filter: th.shadow(tone.lift + BAR_LIFT, b.x) }}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone.top} />
          <stop offset="1" stopColor={tone.foot} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2008" stopOpacity="0" />
          <stop offset="1" stopColor="#3a2008" stopOpacity={th.look === "stout" ? 0.16 : 0.1} />
        </linearGradient>
      </defs>
      <path d={rectD(x.x, x.y, x.w, x.h, th.radius)} fill={`url(#${uid}g)`} />
      {th.edgeLight > 0 ? (
        <path
          d={`M${f2(x.x + th.radius)} ${f2(x.y + 0.75)}H${f2(x.x + x.w - th.radius)}`}
          stroke="#fff"
          strokeOpacity={th.edgeLight * (b.role === "hi" ? 1 : 0.5)}
          strokeWidth={1.5}
        />
      ) : null}
      {/* a whisper of occlusion where the bar meets its tile */}
      <path d={rectD(x.x, x.y + Math.max(0, x.h - 10), x.w, Math.min(10, x.h), 0)} fill={`url(#${uid}ao)`} />
    </g>
  );
};

/** Amber: solid, on the shared screen-space gradient; a lit top edge (with a short soft falloff)
 *  only where this is the top surface. */
const AccentCard: React.FC<{
  th: Theme;
  box: { x: number; y: number; w: number; h: number };
  grad: string;
  uid: string;
  lift: number;
  x: number;
  round: boolean;
  spec: boolean;
}> = ({ th, box, grad, uid, lift, x, round, spec }) => {
  if (box.h <= 0.1) return null;
  const stout = th.look === "stout";
  const d = rectD(box.x, box.y, box.w, box.h, th.radius, true, round);
  const fall = Math.min(stout ? 18 : 12, box.h * 0.3);
  return (
    <g style={{ filter: lift > 0 && !stout ? th.shadow(lift, x) : undefined }}>
      {spec ? (
        <defs>
          <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={th.accentSpec} stopOpacity={stout ? 0.62 : 0.34} />
            <stop offset="1" stopColor={th.accentSpec} stopOpacity="0" />
          </linearGradient>
        </defs>
      ) : null}
      <path d={d} fill={`url(#${grad})`} />
      {spec ? (
        <>
          <path d={rectD(box.x, box.y, box.w, fall, th.radius, true, false)} fill={`url(#${uid}s)`} />
          <path
            d={`M${f2(box.x + th.radius)} ${f2(box.y + 1)}H${f2(box.x + box.w - th.radius)}`}
            stroke={th.accentSpec}
            strokeWidth={2}
            strokeOpacity={stout ? 1 : 0.9}
          />
        </>
      ) : null}
    </g>
  );
};

/** Fundamentals: solid amber from the base up h, a hairline rung every `unit`, its level lit. */
const FillMark: React.FC<{ th: Theme; f: FillP; uid: string; grad: string }> = ({ th, f, uid, grad }) => {
  if (f.h <= 0.1) return null;
  const x0 = f.x - f.w / 2;
  const y0 = f.baseY - f.h;
  const rungs: number[] = [];
  const n = f.unit > 0.5 ? Math.floor(f.h / f.unit + 1e-6) : 0;
  for (let i = 1; i <= n; i++) {
    const y = f.baseY - i * f.unit;
    if (y > y0 + 2.5) rungs.push(y);
  }
  return (
    <g>
      <AccentCard th={th} box={{ x: x0, y: y0, w: f.w, h: f.h }} grad={grad} uid={uid} lift={0} x={f.x} round={false} spec />
      <g stroke={th.rung} strokeOpacity={th.rungOp} strokeWidth={th.rungW}>
        {rungs.map((y) => (
          <line key={y} x1={x0} x2={x0 + f.w} y1={y} y2={y} />
        ))}
      </g>
    </g>
  );
};

// ===================================================================================================
// LOOK 3: PRINT
// ===================================================================================================
export const PRINT = {
  pitch: 6, // halftone screen, px at 1080 wide
  angle: 45,
  misreg: { dx: 2.0, dy: -1.5 }, // the amber layer's registration error
  creamMisreg: { dx: -1.1, dy: 0.9 }, // the cream layer's, the other way
  keyline: 2.6, // the key outline round every printed shape
  cream: "#F4EBDA",
  amber: "#F8A500",
  ink: "#21170F",
  tint: 0.3, // a valuation's glass: cream tint coverage
  dim: 0.55, // a context element's cream coverage
  shade: 0.2, // max espresso shading coverage at a card's foot
  shadeSpan: 0.3, // shading covers the lower 30 % of a card
} as const;

/** Halftone dots on one global 45 deg lattice, so neighbouring shapes share the screen. */
const latticeDots = (
  x0: number,
  y0: number,
  w: number,
  h: number,
  cover: (y: number) => number,
  pitch: number = PRINT.pitch,
) => {
  const out: { x: number; y: number; r: number }[] = [];
  const c = Math.SQRT1_2;
  // local (u, v) -> screen: x = (u - v) c, y = (u + v) c
  const corners = [
    [x0, y0],
    [x0 + w, y0],
    [x0, y0 + h],
    [x0 + w, y0 + h],
  ].map(([x, y]) => [(x + y) * c, (y - x) * c]);
  const u0 = Math.floor(Math.min(...corners.map((p) => p[0])) / pitch) - 1;
  const u1 = Math.ceil(Math.max(...corners.map((p) => p[0])) / pitch) + 1;
  const v0 = Math.floor(Math.min(...corners.map((p) => p[1])) / pitch) - 1;
  const v1 = Math.ceil(Math.max(...corners.map((p) => p[1])) / pitch) + 1;
  for (let i = u0; i <= u1; i++) {
    for (let j = v0; j <= v1; j++) {
      const u = (i + 0.5) * pitch;
      const v = (j + 0.5) * pitch;
      const x = (u - v) * c;
      const y = (u + v) * c;
      if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) continue;
      const cv = Math.max(0, Math.min(1, cover(y)));
      if (cv <= 0.004) continue;
      out.push({ x, y, r: pitch * Math.sqrt(cv / Math.PI) });
    }
  }
  return out;
};
const Dots: React.FC<{ dots: { x: number; y: number; r: number }[]; fill: string; clip?: string }> = ({ dots, fill, clip }) => (
  <g fill={fill} clipPath={clip}>
    {dots.map((d, i) => (
      <circle key={i} cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={d.r.toFixed(2)} />
    ))}
  </g>
);
/** A card's shading: espresso dots growing toward its foot over the lower `span` of it. */
const shadeCover = (y0: number, h: number, max: number = PRINT.shade, span: number = PRINT.shadeSpan) => (y: number) => {
  const t = (y - (y0 + h * (1 - span))) / (h * span);
  return t <= 0 ? 0 : max * Math.pow(Math.min(1, t), 1.4);
};

const inkMask = (dx: number, dy: number): React.CSSProperties => ({
  WebkitMaskImage: `url(${staticFile(TEX.speckle)})`,
  WebkitMaskSize: `${TEX_W}px ${TEX_H}px`,
  WebkitMaskPosition: `${(FRAME_W - TEX_W) / 2 + dx}px ${(FRAME_H - TEX_H) / 2 + dy}px`,
  WebkitMaskRepeat: "no-repeat",
  maskImage: `url(${staticFile(TEX.speckle)})`,
  maskSize: `${TEX_W}px ${TEX_H}px`,
  maskPosition: `${(FRAME_W - TEX_W) / 2 + dx}px ${(FRAME_H - TEX_H) / 2 + dy}px`,
  maskRepeat: "no-repeat",
  maskMode: "luminance",
});

const PrintStage: React.FC<{ scene: Scene }> = ({ scene }) => {
  usePreload([TEX.speckle]);
  const th = THEMES.print;
  const uid = svgId(useId());
  const P = PRINT;
  const dim = (role: Role) => role === "lo";

  // every cream shape (the underbase includes the amber shapes, so the spot colour stays bright)
  const tileShapes = scene.tiles.map((t) => ({ t, b: tileBox(t) }));
  const barShapes = scene.bars.map((b) => ({ b, x: barBox(b) }));

  return (
    <AbsoluteFill style={{ backgroundColor: th.groundBase, overflow: "hidden" }}>
      <Ground th={th} scene={scene} />

      {/* the one soft lift, under the subject only */}
      <Svg>
        <g style={{ filter: "blur(9px)" }} opacity={0.28}>
          {scene.subject.map((s, i) => (
            <rect key={i} x={s.x + 2} y={s.y + 7} width={s.w} height={s.h} fill="#3a1e06" />
          ))}
        </g>
      </Svg>

      {/* LAYER 1 — CREAM INK (and the underbase of the spot colour) */}
      <AbsoluteFill style={{ ...inkMask(0, 0), transform: `translate(${P.creamMisreg.dx}px, ${P.creamMisreg.dy}px)` }}>
        <Svg>
          <defs>
            <pattern id={`${uid}tint`} width={P.pitch} height={P.pitch} patternUnits="userSpaceOnUse" patternTransform={`rotate(${P.angle})`}>
              <circle cx={P.pitch / 2} cy={P.pitch / 2} r={P.pitch * Math.sqrt(P.tint / Math.PI)} fill={P.cream} />
            </pattern>
            <pattern id={`${uid}dim`} width={P.pitch} height={P.pitch} patternUnits="userSpaceOnUse" patternTransform={`rotate(${P.angle})`}>
              <circle cx={P.pitch / 2} cy={P.pitch / 2} r={P.pitch * Math.sqrt(P.dim / Math.PI)} fill={P.cream} />
            </pattern>
          </defs>
          {/* valuations: a halftone tint of cream */}
          {scene.glass.map((g, i) => {
            const b = barBox(g);
            return <path key={`g${i}`} d={rectD(b.x, b.y, b.w, b.h, th.radius, true, false)} fill={`url(#${uid}tint)`} />;
          })}
          {/* tiles and bars: solid cream, or a cream halftone when they are context */}
          {tileShapes.map(({ t, b }, i) => (
            <path key={`t${i}`} d={rectD(b.x, b.y, b.w, b.h, th.radius)} fill={dim(t.role) ? `url(#${uid}dim)` : P.cream} />
          ))}
          {barShapes.map(({ b, x }, i) =>
            b.accent ? null : (
              <path key={`b${i}`} d={rectD(x.x, x.y, x.w, x.h, th.radius)} fill={dim(b.role) ? `url(#${uid}dim)` : P.cream} />
            ),
          )}
        </Svg>
      </AbsoluteFill>

      {/* the spot colour's underbase: solid cream under every amber shape (unspeckled, so a hole in the
          amber shows cream, never bare kraft), peeking out where the amber is misregistered */}
      <Svg>
        {scene.fills.map((f, i) => (
          <rect key={`uf${i}`} x={f.x - f.w / 2} y={f.baseY - f.h} width={f.w} height={f.h} fill={P.cream} />
        ))}
        {scene.slices.map((sl, i) => {
          const b = sliceBox(sl);
          return <path key={`us${i}`} d={rectD(b.x, b.y, b.w, b.h, th.radius, true, false)} fill={P.cream} />;
        })}
        {scene.bars.map((b0, i) => {
          if (!b0.accent) return null;
          const b = barBox(b0);
          return <path key={`ua${i}`} d={rectD(b.x, b.y, b.w, b.h, th.radius)} fill={P.cream} />;
        })}
      </Svg>

      {/* LAYER 2 — AMBER SPOT, misregistered */}
      <AbsoluteFill style={{ ...inkMask(37, -53), mixBlendMode: "multiply", transform: `translate(${P.misreg.dx}px, ${P.misreg.dy}px)` }}>
        <Svg>
          {scene.fills.map((f, i) => (
            <rect key={`f${i}`} x={f.x - f.w / 2} y={f.baseY - f.h} width={f.w} height={f.h} fill={P.amber} />
          ))}
          {scene.slices.map((s, i) => {
            const b = sliceBox(s);
            return <path key={`s${i}`} d={rectD(b.x, b.y, b.w, b.h, th.radius, true, false)} fill={P.amber} />;
          })}
          {scene.bars.map((b0, i) => {
            if (!b0.accent) return null;
            const b = barBox(b0);
            return <path key={`a${i}`} d={rectD(b.x, b.y, b.w, b.h, th.radius)} fill={P.amber} />;
          })}
          {/* the profit multiple printed as a spot-colour shadow under its key-ink numeral */}
          {scene.texts.map((t, i) =>
            t.tone === "accent" ? <TextMark key={`at${i}`} t={{ ...t, x: t.x + 4, y: t.y + 4 }} color={P.amber} opacity={1} /> : null,
          )}
        </Svg>
      </AbsoluteFill>

      {/* LAYER 3 — ESPRESSO KEY (figures, hairlines, rungs, shading, type), printed last */}
      <AbsoluteFill style={{ ...inkMask(-61, 89), mixBlendMode: "multiply" }}>
        <Svg>
          <defs>
            <filter id={`${uid}rough`} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          {/* the figures, printed through figure-only masks */}
          {tileShapes.map(({ t, b }, i) => (
            <g key={`fig${i}`} opacity={dim(t.role) ? th.inkLo : 1}>
              <defs>
                <mask id={`${uid}m${i}`} maskUnits="userSpaceOnUse" x={b.x} y={b.y} width={b.w} height={b.h}>
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#000" />
                  <g transform={`translate(${f2(b.x)} ${f2(b.y)})`}>
                    <FigureMark figure={t.figure} size={t.size} invert />
                  </g>
                </mask>
              </defs>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={P.ink} mask={`url(#${uid}m${i})`} />
            </g>
          ))}
          {/* shading: halftone at the foot of every solid cream card */}
          {tileShapes.map(({ t, b }, i) =>
            dim(t.role) ? null : (
              <Dots key={`ts${i}`} dots={latticeDots(b.x, b.y, b.w, b.h, shadeCover(b.y, b.h, P.shade * 0.8, 0.3))} fill={P.ink} />
            ),
          )}
          {barShapes.map(({ b, x }, i) =>
            dim(b.role) || b.accent ? null : (
              <Dots key={`bs${i}`} dots={latticeDots(x.x, x.y, x.w, x.h, shadeCover(x.y, x.h))} fill={P.ink} />
            ),
          )}
          {/* key outlines: every tile and bar is drawn by the key ink, the colour layers fall into it
              slightly out of register — the screen-printed label's signature */}
          <g fill="none" stroke={P.ink} strokeWidth={P.keyline} strokeLinejoin="miter">
            {tileShapes.map(({ t, b }, i) => (
              <path
                key={`kt${i}`}
                d={rectD(b.x + P.keyline / 2, b.y + P.keyline / 2, b.w - P.keyline, b.h - P.keyline, th.radius)}
                strokeOpacity={dim(t.role) ? th.inkLo : th.inkHi}
              />
            ))}
            {barShapes.map(({ b, x }, i) => (
              <path
                key={`kb${i}`}
                d={rectD(x.x + P.keyline / 2, x.y + P.keyline / 2, x.w - P.keyline, x.h - P.keyline, th.radius)}
                strokeOpacity={dim(b.role) ? th.inkLo : th.inkHi}
              />
            ))}
            {scene.slices.map((sl, i) =>
              scene.fills.some((f) => Math.abs(f.x - sl.x) < 1) ? null : (
                <path key={`kl${i}`} d={`M${f2(sl.x - sl.w / 2)} ${f2(sl.topY + sl.h)}H${f2(sl.x + sl.w / 2)}`} strokeOpacity={th.inkHi} />
              ),
            )}
          </g>
          {/* valuation hairlines */}
          {scene.glass.map((g, i) => {
            const b = barBox(g);
            const s = th.stroke / 2;
            const r = th.radius;
            const d =
              `M${f2(b.x + s)} ${f2(b.y + b.h)}V${f2(b.y + s + r)}A${r} ${r} 0 0 1 ${f2(b.x + s + r)} ${f2(b.y + s)}` +
              `H${f2(b.x + b.w - s - r)}A${r} ${r} 0 0 1 ${f2(b.x + b.w - s)} ${f2(b.y + s + r)}V${f2(b.y + b.h)}`;
            return (
              <path
                key={`go${i}`}
                d={d}
                fill="none"
                stroke={P.ink}
                strokeOpacity={g.role === "hi" ? th.glassHi : th.glassLo}
                strokeWidth={th.stroke}
              />
            );
          })}
          {/* rungs on the x20 fills */}
          {scene.fills.map((f, i) => {
            const n = f.unit > 0.5 ? Math.floor(f.h / f.unit + 1e-6) : 0;
            const ys: number[] = [];
            for (let k = 1; k <= n; k++) {
              const y = f.baseY - k * f.unit;
              if (y > f.baseY - f.h + 2.5) ys.push(y);
            }
            return (
              <g key={`r${i}`} stroke={P.ink} strokeOpacity={th.rungOp} strokeWidth={th.rungW}>
                {ys.map((y) => (
                  <line key={y} x1={f.x - f.w / 2} x2={f.x + f.w / 2} y1={y} y2={y} />
                ))}
              </g>
            );
          })}
          {/* type: stamped (edges roughened a touch) */}
          <g style={{ filter: `url(#${uid}rough)` }}>
            {scene.texts.map((t, i) => (
              <TextMark key={`x${i}`} t={t} color={P.ink} opacity={t.role === "hi" ? th.inkHi : th.inkLo} />
            ))}
          </g>
        </Svg>
      </AbsoluteFill>

      <Finish th={th} />
    </AbsoluteFill>
  );
};
