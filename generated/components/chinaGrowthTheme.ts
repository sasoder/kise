import React from "react";
import { loadFont as loadRobotoCondensed } from "@remotion/google-fonts/RobotoCondensed";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { ACCENT, ACCENT_DEEP, BG_BASE, SHADOW_BLUR, SHADOW_OPACITY, SHADOW_Y, iconShadow } from "./fieldShared";
import { HIGHLIGHT } from "./levelUp";

// ---------------------------------------------------------------------------
// chinaGrowthTheme — the LOOK of the China-growth chart, as data. Builder A.
//
// THEMES.orange is V1 exactly (Orange Dwarkesh on the grid): every value below
// is the one V1 rendered with, so a world rendered with it is pixel-identical
// to the delivered V1. THEMES.china is V2 ("vermilion ink"): rice paper, warm
// black ink at two rungs, one vermilion for China's growth, Source Serif 4 /
// Source Sans 3, and the flair items of briefs/V2_CHINA.md, each behind a flag.
//
// ChinaGrowthWorld provides the theme through ThemeContext (its `theme` prop,
// default "orange"); every material, the Stage and the layers read it with
// useTheme(). Motion, timing, geometry and cameras do not depend on the theme.
// ---------------------------------------------------------------------------

const ROBOTO = loadRobotoCondensed("normal", { weights: ["700"], subsets: ["latin"] });
const SERIF = loadSourceSerif4("normal", { weights: ["700"], subsets: ["latin"] });
const SANS = loadSourceSans3("normal", { weights: ["600"], subsets: ["latin"] });

export type ThemeName = "orange" | "china";

/** One flag per flair item of V2_CHINA.md (all false in orange). */
export type Flair = {
  /** 2: horizontal ink hairlines at every whole % (the zero line is the axis) */
  gridlines: boolean;
  /** 6a: red wash between the line and the axis above zero; deep wash + hatch below */
  wash: boolean;
  /** 6b: the freshest stretch behind the tip is wet (brighter, thicker), then dries */
  wetInk: boolean;
  /** 6c: the tip is a bead (bloom + specular) */
  bead: boolean;
  /** 6d: the vertex markers are chop-seal squares */
  sealMarkers: boolean;
  /** 6e: text blurs in (6 screen px -> 0) with its entrance, out with its exit */
  textBlur: boolean;
  /** 6e: the band's range rolls like an odometer instead of crossfading */
  odometer: boolean;
  /** 6f: warm paper shadow under the red line, markers and tip only; ink sits flat */
  paperShadow: boolean;
  /** 6g: the forecast band's edges are dashed ink ("dashed = expected") */
  dashedBand: boolean;
  /** 6h (builder B): the promise dissolves like ink on wet paper */
  inkDiffusion: boolean;
  /** 6i (builder C): the wedge is an ink wash with a feathered top-down reveal */
  inkWash: boolean;
};

export type Theme = {
  name: ThemeName;
  // --- palette: ROLES, not colours -------------------------------------------
  /** China's growth: the line, its markers, its tip (and its wash above zero). */
  accent: string;
  /** China's growth below zero, and nothing else. */
  accentDeep: string;
  /** Wet ink: the freshest stretch of the line (china); = accent in orange. */
  accentWet: string;
  /** A half-step brighter accent, for the one travelling highlight (cut 4). */
  highlight: string;
  /** Everything that is not China's growth. */
  ink: string;
  /** The two ink rungs. Materials take rungs on the V1 scale (1.0 = HI, 0.5 =
   *  LO) and map them onto these with mapRung, so V1-scale code is correct here. */
  inkHi: number;
  inkLo: number;
  /** The forecast band's area tint (ink). */
  bandTint: number;
  /** The ground colour. */
  paper: string;
  // --- type ----------------------------------------------------------------------
  /** Spoken numbers ("value" labels). */
  fontValue: string;
  weightValue: number;
  /** tracking, em (compensated so centred text is centred) */
  trackValue: number;
  /** cap height, em (a label's y is the vertical centre of its capitals) */
  capValue: number;
  /** CSS font-variant-numeric for numbers (undefined = the font's default) */
  numeric?: string;
  /** Words ("word" labels), set in caps. */
  fontWord: string;
  weightWord: number;
  trackWord: number;
  capWord: number;
  // --- ground --------------------------------------------------------------------
  background: "grid" | "paper";
  /** the paper texture under public/ (paper themes) */
  paperSrc: string;
  vignette: "dark" | "warm";
  // --- shadows -------------------------------------------------------------------
  /** One CSS filter over the whole world SVG, or null. */
  globalShadow: string | null;
  /** Per-element shadow for ink (lines, rings, ticks, labels) at camera k. */
  inkShadow: (k: number) => string | undefined;
  /** Per-element shadow for China's growth (the line, markers, tip) at camera k. */
  accentShadow: (k: number) => string | undefined;
  // --- wash ------------------------------------------------------------------------
  /** 6a: accent opacity of the wash at the line (fading to 0 at the axis). */
  washTop: number;
  /** 6a: accentDeep opacity of the flat wash below zero. */
  deepWash: number;
  /** opacity of the below-zero hatch lines (1 in orange). */
  deepHatch: number;
  flair: Flair;
};

const NO_FLAIR: Flair = {
  gridlines: false,
  wash: false,
  wetInk: false,
  bead: false,
  sealMarkers: false,
  textBlur: false,
  odometer: false,
  paperShadow: false,
  dashedBand: false,
  inkDiffusion: false,
  inkWash: false,
};

const ORANGE: Theme = {
  name: "orange",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  accentWet: ACCENT,
  highlight: HIGHLIGHT,
  ink: "#FFFFFF",
  inkHi: 1.0,
  inkLo: 0.5,
  bandTint: 0.1,
  paper: BG_BASE,
  fontValue: ROBOTO.fontFamily,
  weightValue: 700,
  trackValue: 0.04,
  capValue: 0.711,
  fontWord: ROBOTO.fontFamily,
  weightWord: 700,
  trackWord: 0.04,
  capWord: 0.711,
  background: "grid",
  paperSrc: "grid-background.jpg",
  vignette: "dark",
  globalShadow: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))`,
  inkShadow: (k) => iconShadow(k),
  accentShadow: (k) => iconShadow(k),
  washTop: 0,
  deepWash: 0,
  deepHatch: 1,
  flair: NO_FLAIR,
};

/** V2_CHINA.md, "the look". */
/** a clean rice-paper white (director, V2 review: "white paper at a glance, warm only on a second look") */
export const CHINA_PAPER = "#F8F5EF";
export const CHINA_INK = "#1C1917";
export const CHINA_RED = "#D0281C";
export const CHINA_RED_DEEP = "#8E1A12";
export const CHINA_RED_WET = "#E8452F";
/** The paper shadow (6f), screen px; divided by k for the world group. */
export const paperShadow = (k: number) =>
  `drop-shadow(0 ${(4 / k).toFixed(3)}px ${(8 / k).toFixed(3)}px rgba(70,35,15,0.16))`;

const CHINA: Theme = {
  name: "china",
  accent: CHINA_RED,
  accentDeep: CHINA_RED_DEEP,
  accentWet: CHINA_RED_WET,
  highlight: "#F2604A",
  ink: CHINA_INK,
  inkHi: 0.9,
  inkLo: 0.42,
  bandTint: 0.05,
  paper: CHINA_PAPER,
  fontValue: SERIF.fontFamily,
  weightValue: 700,
  trackValue: 0,
  capValue: 0.667,
  numeric: "lining-nums",
  fontWord: SANS.fontFamily,
  weightWord: 600,
  trackWord: 0.12,
  capWord: 0.669,
  background: "paper",
  paperSrc: "china/paper.png",
  vignette: "warm",
  globalShadow: null,
  inkShadow: () => undefined,
  accentShadow: paperShadow,
  washTop: 0.15,
  deepWash: 0.3,
  deepHatch: 0.55,
  flair: {
    gridlines: true,
    wash: true,
    wetInk: true,
    bead: true,
    sealMarkers: true,
    textBlur: true,
    odometer: true,
    paperShadow: true,
    dashedBand: true,
    inkDiffusion: true,
    inkWash: true,
  },
};

export const THEMES: Record<ThemeName, Theme> = { orange: ORANGE, china: CHINA };

/** Provided by ChinaGrowthWorld; the default is orange (V1). */
export const ThemeContext = React.createContext<Theme>(ORANGE);
/** The current theme (inside a layer or material). */
export const useTheme = (): Theme => React.useContext(ThemeContext);

/** A rung on the V1 scale (1.0 = INK_HI, 0.5 = INK_LO, lower = a fade toward 0)
 *  mapped onto the theme's rungs, piecewise linear and continuous. Identity in
 *  orange (returned untouched, so V1 stays bit-identical). */
export const mapRung = (r: number, th: Theme) => {
  if (th.name === "orange") return r;
  if (r >= 0.5) return th.inkLo + (th.inkHi - th.inkLo) * ((r - 0.5) / 0.5);
  return th.inkLo * (r / 0.5);
};

/** A V1 colour constant mapped to its theme role (V1 white -> ink, ACCENT ->
 *  accent, ACCENT_DEEP -> accentDeep); anything else, or undefined -> `fallback`.
 *  Identity in orange. Lets V1-era calls (`color={INK}`) render in role. */
export const resolveColor = (c: string | undefined, fallback: string, th: Theme) => {
  if (c === undefined) return fallback;
  if (th.name === "orange") return c;
  const u = c.toUpperCase();
  if (u === "#FFFFFF" || u === "#FFF" || u === "WHITE") return th.ink;
  if (u === ACCENT.toUpperCase()) return th.accent;
  if (u === ACCENT_DEEP.toUpperCase()) return th.accentDeep;
  if (u === HIGHLIGHT.toUpperCase()) return th.highlight;
  return c;
};
