// STOUT_READY
// STOUT_FIX_1: camera transform at full precision
import React, { useId } from "react";
import { AbsoluteFill, Img, getInputProps, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { MB_RING_IN, MB_RING_OUT, MB_STAR_INNER, SPORT_GLYPHS, type SportName } from "./wolffShared";
import { CRESTS, type Crest, type CrestId } from "./wolffLogos";
import type { Cam } from "./outgrowShared";

// ===========================================================================
// stoutShared — THE STOUT SYSTEM (Cheeky Pint 2.0, chosen Oct 2 2026; BROWN pass the same day).
//
// "The pub after dark", on BROWN: an espresso-brown kraft board for the ground
// (#432C1C, L* ~23 where the subject stands, the kraft's fibres showing; nothing
// in any frame is black — corners >= L* 14, shadows and ink a deep brown), a
// warm cream pool of light that follows the subject, cream card for what is lit,
// a kraft-board tone for what is context, and ONE glowing thing: amber, which
// means profit (and, in cut 5, Mercedes' tower).
// Why brown: the first ground (stout-black #17110C + amber + cream type) read
// like a black / orange / white adult-site brand (Tom's note, BROWN.md). The
// delivered stout-black set stays reproducible: --props '{"palette":"stout"}'.
// The default palette is "B1" (espresso); see PALETTES below.
//
// The user's note that started this system: the shadows of the logo block and
// the chart block overlapped and "don't look very harmonious"; "make everything
// seem like a bit more effort has been put in … everything should look
// consistent". So:
//   * ONE light. A key from above, slightly left. Every shadow is cast by it:
//     same direction, same colour, depth from ELEVATION only (three levels).
//   * ONE object, ONE shadow. A pillar (tile + bar + slice + glass + fill) is
//     drawn once as a union silhouette for its shadow; no part is ever
//     filtered on its own and no shadow falls on its own object.
//   * THE JOINT. A bar rises out of a SLOT in its tile's top edge: the bar
//     ends exactly on the tile's top edge and a 2 px slot line (with 2 px lips
//     each side) sits across the joint; the tile's lit edge stops at the
//     slot; the bar's foot carries a short occlusion. One built object.
//   * Every colour, radius, edge, stroke, gap, size and recipe is a token
//     below. Components read tokens only.
//
// UNITS. World px (drawn inside StoutStage under the camera) for geometry and
// shadows — objects and their shadows scale with the camera like a real set.
// SCREEN px for type, hairlines, edges, slot lines and bloom — they stay
// crisp at any zoom. Helpers convert with the current camera k (`px / k`).
//
// THE WORLD (world px). Every cut stands its pillars on FLOOR with tiles of
// TILE, bars of BAR wide, at PITCH. Money scales per act (see MONEY): one act
// is one money scale; a cut never rescales money on screen.
//
// THE API (everything a cut needs; all of it can be driven per frame)
//   StoutStage({ S, cam, rest?, pool?, sway?, overlay?, children })   the set
//   Pillar({ x, k, figure, bar, slice, glass, fill, rung, accent, role|dim,
//            glassRole, elevation, lift, dy, enter, amberBand, floor?, tile?, barW? })
//   MercedesTile / CrestTile({ id }) / SportTile({ sport }) / TeamTile   a tile alone
//   ChartBar({ x, baseY, h, slice, k, amberBand })  +  Rule({ x0, x1, y, k })   cut 2
//   Numeral({ x, y, k, px, text | value+format, rollBlur, tone, anchor, enter, exit, glow })
//   Label({ x, y, k, text, px?, tone, anchor, enter, exit })
//   LightSweep({ x, y, w, h, k, t, on })                    the one click of a cut
//   ElevationShadow({ silhouette, elevation, lift, contact })  any other object's shadow
//   bloomFilter(k), amberBandFor(cam), camFor(...), toScreen, snapLen, mixHex
//   StoutNameTag({ name, job, frame }), StoutWatchHere({ text, frame, cascade })  overlays
// Builders: world -> camera exactly as the style frames (StoutFrames.tsx) do it;
// type sizes are TYPE tokens at rest (tween between tokens on camera moves);
// pass amberBandFor(cam) to every Pillar/ChartBar of a frame; dim by `dim`
// (tone), never by opacity; snapLen() data heights at rest.
// ===========================================================================

// --- PALETTES (the BROWN pass, out/wolff/briefs/BROWN.md) ---------------------------------------
// Every colour and light recipe of the system is ONE palette object, chosen at module load from the
// render's input props: `--props '{"palette":"B2"}'` (any cut, the name tag, the CTA, StoutFrames).
// The cut components read the same token names as before (COLOR, ALPHA, ELEVATION, POOL, VIGNETTE,
// GRAIN, BLOOM_LAYERS, GROUND) and never see the palette. "stout" is the delivered set, value for
// value (it renders 0 px from the stout reference stills in out/wolff/brown/ref/). An unknown name
// throws. `--props '{"groundOnly":true}'` draws the stage without its world (measurement only).
export type ShadowLayer = { dx: number; dy: number; blur: number; a: number };
export type Elevation = "rest" | "lifted" | "float";
type ColorTokens = {
  ground: string; // the baked sheet's mean (the stage's backing fill)
  cream: string; // cream card, lit (hi): top of a pillar
  creamFoot: string; // cream card at a pillar's foot (one gradient per pillar)
  board: string; // board (lo / dimmed): top of a pillar
  boardFoot: string; // board at the foot
  inkDark: string; // ink on cream and on amber
  inkCream: string; // type on the ground, hi
  inkCreamLo: string; // type on the ground, lo (a tone, never a transparency)
  amberTop: string; // amber at the top of the band (the clip's ACCENT)
  amberFoot: string; // amber at the foot of the band
  amberHot: string; // the hot top edge of every amber body
  rung: string; // a rung on an amber fill (opaque: ink over amber)
  glass: string; // glass tint and hairline (glass is the one transparent material)
  shadow: string; // every shadow
  edge: string; // the lit top edge of every cream card
  rule: string; // any rule (cut 2's time axis) = inkCreamLo
};
type AlphaTokens = {
  glassTint: number; // glass body
  glassHi: number; // glass hairline, backed (hi)
  glassLo: number; // glass hairline, air (lo)
  edge: number; // a cream card's lit top edge
  edgeBoard: number; // a board card's lit top edge (the same edge, in shadow)
  slot: number; // the slot line at a bar's joint
  footAO: number; // a bar's foot occlusion above the slot
  hotFall: number; // the hot edge's soft falloff under it
};
type ElevationTokens = Record<Elevation, { key: ShadowLayer; amb: ShadowLayer; contact: ShadowLayer | null }>;
export type StoutPalette = {
  label: string;
  COLOR: ColorTokens;
  ALPHA: AlphaTokens;
  ELEVATION: ElevationTokens;
  /** the pool of light that follows the subject (SCREEN px): screen-blended `color` */
  POOL: { rx: number; ry: number; a0: number; a1: number; color: string };
  VIGNETTE: string;
  GRAIN_OPACITY: number;
  BLOOM_LAYERS: readonly { blur: number; color: string }[];
  /** the baked ground sheet (public/) */
  GROUND_SRC: string;
};

// STOUT — the delivered set (Oct 2 2026), unchanged.
const STOUT: StoutPalette = {
  label: "stout",
  COLOR: {
    ground: "#17110C", // stout-black warm brown (the baked sheet's mean)
    cream: "#F5EEE1",
    creamFoot: "#E7DCC8",
    board: "#7A6A58", // dark board (its knock-outs 3.7:1 against the dark)
    boardFoot: "#685A4A",
    inkDark: "#17110C", // = the ground: a knock-out
    inkCream: "#F3EBDD",
    inkCreamLo: "#9B8F80",
    amberTop: "#FFB000",
    amberFoot: "#E38E00",
    amberHot: "#FFE7A8",
    rung: "#9A6406",
    glass: "#F3EBDD",
    shadow: "#050302",
    edge: "#FFFFFF",
    rule: "#9B8F80",
  },
  ALPHA: { glassTint: 0.06, glassHi: 0.88, glassLo: 0.42, edge: 0.85, edgeBoard: 0.32, slot: 0.62, footAO: 0.16, hotFall: 0.6 },
  ELEVATION: {
    rest: {
      key: { dx: 1.5, dy: 2.5, blur: 2.5, a: 0.55 },
      amb: { dx: 2.5, dy: 8, blur: 12, a: 0.42 },
      contact: { dx: 1, dy: 0, blur: 2.5, a: 0.85 }, // an ellipse under the foot: rx 0.58 x width, ry 3
    },
    lifted: {
      key: { dx: 3, dy: 6, blur: 5, a: 0.5 },
      amb: { dx: 4.5, dy: 15, blur: 20, a: 0.4 },
      contact: null,
    },
    float: {
      key: { dx: 5, dy: 11, blur: 9, a: 0.45 },
      amb: { dx: 7, dy: 26, blur: 30, a: 0.36 },
      contact: null,
    },
  },
  POOL: { rx: 600, ry: 780, a0: 0.17, a1: 0.075, color: "255,166,60" },
  VIGNETTE: "radial-gradient(ellipse 104% 100% at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.17) 70%, rgba(0,0,0,0.45) 100%)",
  GRAIN_OPACITY: 0.42,
  BLOOM_LAYERS: [
    { blur: 7, color: "rgba(255,178,40,0.42)" },
    { blur: 24, color: "rgba(255,150,0,0.30)" },
    { blur: 60, color: "rgba(255,140,0,0.12)" },
  ],
  GROUND_SRC: "cheekypint2/stout.jpg",
};

// THE BROWN FAMILY — a board, not a void. One recipe, three depths of ground (+ a golden foot):
//   ground   dark kraft / walnut, hue ~57-62, the kraft's fibres showing (scripts/build-brown-textures.py)
//   board    a lit KRAFT-BOARD tone for lo / dimmed cards: lighter and yellower than the ground,
//            >= 3:1 against it (so a crest knocked out of a dimmed tile reads), well under the cream
//   ink      a deep brown of the same hue (never near-black): >= 10:1 on cream, >= 7:1 on amber
//   shadow   a deeper brown again; every elevation's alphas eased down (a lighter ground SHOWS shadows)
//   vignette the shadow brown, gentler; the corners darken, never to black
//   pool     a warm cream light (screen), not orange; gentler the lighter the ground
//   bloom    the same three layers, quieter (on brown a strong bloom becomes an orange fog)
//   grain    a touch lighter (overlay grain shows more on a lighter ground)
const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
const vignetteOf = (hex: string, a70: number, a100: number) =>
  `radial-gradient(ellipse 104% 100% at 50% 46%, rgba(${rgbOf(hex)},0) 42%, rgba(${rgbOf(hex)},${a70}) 70%, rgba(${rgbOf(hex)},${a100}) 100%)`;
/** The stout elevations (same offsets and blurs: same light) with their alphas scaled. */
const elevationAt = (s: number, contact: number): ElevationTokens => ({
  rest: {
    key: { ...STOUT.ELEVATION.rest.key, a: +(STOUT.ELEVATION.rest.key.a * s).toFixed(3) },
    amb: { ...STOUT.ELEVATION.rest.amb, a: +(STOUT.ELEVATION.rest.amb.a * s).toFixed(3) },
    contact: { dx: 1, dy: 0, blur: 2.5, a: contact },
  },
  lifted: {
    key: { ...STOUT.ELEVATION.lifted.key, a: +(STOUT.ELEVATION.lifted.key.a * s).toFixed(3) },
    amb: { ...STOUT.ELEVATION.lifted.amb, a: +(STOUT.ELEVATION.lifted.amb.a * s).toFixed(3) },
    contact: null,
  },
  float: {
    key: { ...STOUT.ELEVATION.float.key, a: +(STOUT.ELEVATION.float.key.a * s).toFixed(3) },
    amb: { ...STOUT.ELEVATION.float.amb, a: +(STOUT.ELEVATION.float.amb.a * s).toFixed(3) },
    contact: null,
  },
});
const bloomAt = (a: [number, number, number], rgb: [string, string, string] = ["255,178,40", "255,150,0", "255,140,0"]) =>
  [
    { blur: 7, color: `rgba(${rgb[0]},${a[0]})` },
    { blur: 24, color: `rgba(${rgb[1]},${a[1]})` },
    { blur: 60, color: `rgba(${rgb[2]},${a[2]})` },
  ] as const;
const BROWN_INK = "#2E1E14"; // L* 13, h 58: the family's ink
const BROWN_SHADOW = "#22150B"; // L* 8, h 57: the family's shadow
const brownColor = (o: Pick<ColorTokens, "ground" | "board" | "boardFoot" | "inkCreamLo"> & Partial<ColorTokens>): ColorTokens => ({
  cream: STOUT.COLOR.cream,
  creamFoot: STOUT.COLOR.creamFoot,
  inkDark: BROWN_INK,
  inkCream: STOUT.COLOR.inkCream,
  amberTop: STOUT.COLOR.amberTop,
  amberFoot: STOUT.COLOR.amberFoot,
  amberHot: STOUT.COLOR.amberHot,
  rung: STOUT.COLOR.rung,
  glass: STOUT.COLOR.glass,
  shadow: BROWN_SHADOW,
  edge: STOUT.COLOR.edge,
  rule: o.inkCreamLo,
  ...o,
});
const BROWN_ALPHA: AlphaTokens = { ...STOUT.ALPHA };

// B1 ESPRESSO — ground #432C1C (L* 20, C 17) — THE PICK (the default). Its sheet keeps only 55 % of the
// fibres' dark side and its vignette is the softest, so no corner falls below L* 14.
const B1: StoutPalette = {
  label: "B1 espresso",
  COLOR: brownColor({ ground: "#432C1C", board: "#AD8E6F", boardFoot: "#A28365", inkCreamLo: "#B1A494" }),
  ALPHA: BROWN_ALPHA,
  ELEVATION: elevationAt(0.72, 0.6),
  POOL: { rx: 600, ry: 780, a0: 0.07, a1: 0.03, color: "255,214,170" },
  VIGNETTE: vignetteOf(BROWN_SHADOW, 0.08, 0.12), // the corners sit at ~72 % of this ellipse: ~0.08 there
  GRAIN_OPACITY: 0.28,
  BLOOM_LAYERS: bloomAt([0.36, 0.2, 0.06]),
  GROUND_SRC: "cheekypint2/brown-b1.jpg",
};
// B2 WALNUT — ground ~#533726 (L* 26)
const B2: StoutPalette = {
  label: "B2 walnut",
  COLOR: brownColor({ ground: "#533726", board: "#BB9B7C", boardFoot: "#B09072", inkCreamLo: "#C1B4A4" }),
  ALPHA: BROWN_ALPHA,
  ELEVATION: elevationAt(0.7, 0.58),
  POOL: { rx: 600, ry: 780, a0: 0.06, a1: 0.026, color: "255,214,170" },
  VIGNETTE: vignetteOf(BROWN_SHADOW, 0.16, 0.36),
  GRAIN_OPACITY: 0.34,
  BLOOM_LAYERS: bloomAt([0.34, 0.18, 0.05]),
  GROUND_SRC: "cheekypint2/brown-b2.jpg",
};
// B3 DARK KRAFT — ground #5B3E28 (L* 29; the pool brings the subject area to ~32, the band's top)
const B3: StoutPalette = {
  label: "B3 dark kraft",
  COLOR: brownColor({ ground: "#5B3E28", board: "#C6A98C", boardFoot: "#BB9E81", inkCreamLo: "#CCBFAF", inkCream: "#F7F1E6", cream: "#F7F1E5", creamFoot: "#EFE7D7" }),
  ALPHA: BROWN_ALPHA,
  ELEVATION: elevationAt(0.68, 0.55),
  POOL: { rx: 600, ry: 780, a0: 0.025, a1: 0.011, color: "255,214,170" },
  VIGNETTE: vignetteOf(BROWN_SHADOW, 0.16, 0.38),
  GRAIN_OPACITY: 0.32,
  BLOOM_LAYERS: bloomAt([0.32, 0.16, 0.04]),
  GROUND_SRC: "cheekypint2/brown-b3.jpg",
};
// B2g — B2 with the amber's foot moved toward gold (away from the site's #FF9000, h 65): the old foot
// #E38E00 leaned orange (h 71); the new one keeps the top's hue. The top unchanged; the bloom's outer
// layers follow the foot to gold.
const B2G: StoutPalette = {
  ...B2,
  label: "B2g gold foot",
  COLOR: { ...B2.COLOR, amberFoot: "#DD9800" }, // the foot at the top's hue (h 77, L* 68): it shades, never turns orange
  BLOOM_LAYERS: bloomAt([0.34, 0.18, 0.05], ["255,184,40", "255,170,20", "255,164,10"]),
};

export const PALETTES = { stout: STOUT, B1, B2, B3, B2g: B2G } as const;
export type PaletteName = keyof typeof PALETTES;
/** The director's pick (Oct 2 2026): B1 espresso. "stout" stays reproducible by prop. */
export const DEFAULT_PALETTE: PaletteName = "B1";
const inputProps = (() => {
  try {
    return (typeof window === "undefined" ? {} : getInputProps()) as { palette?: unknown; groundOnly?: unknown };
  } catch {
    return {};
  }
})();
const readPalette = (): PaletteName => {
  const raw = inputProps.palette;
  if (raw === undefined || raw === null) return DEFAULT_PALETTE;
  if (typeof raw === "string" && Object.prototype.hasOwnProperty.call(PALETTES, raw)) return raw as PaletteName;
  throw new Error(`stoutShared: unknown palette ${JSON.stringify(raw)} (one of ${Object.keys(PALETTES).join(", ")})`);
};
export const PALETTE_NAME: PaletteName = readPalette();
export const PALETTE: StoutPalette = PALETTES[PALETTE_NAME];
/** Measurement only: the stage draws its ground, pool, vignette and grain, and no world. */
export const GROUND_ONLY = inputProps.groundOnly === true;

// --- tokens: colour ----------------------------------------------------------------------------
export const COLOR: ColorTokens = PALETTE.COLOR;
export const ALPHA: AlphaTokens = PALETTE.ALPHA;

// --- tokens: geometry (WORLD px) ---------------------------------------------------------------
export const GEO = {
  TILE: 96, // a team tile (square)
  BAR: 64, // every bar, slice, glass and fill (2/3 of the tile)
  RADIUS: 4, // ONE corner radius: tiles, bars, glass (fills and slices keep the bar's top corners)
  PITCH: 128, // pillar pitch: equal 32 px gaps between tiles
  FLOOR: 1296, // where tiles stand (a multiple of 16: edges land on whole px at the house k values)
  X_NOW: 544, // Mercedes' "now" pillar (cuts 1-4) and the centre pillar (cuts 4-5)
  HIST_BAR: 32, // cut 2's history bars (the past is drawn thinner than the now bar)
  HIST_PITCH: 48,
  HIST_GAP_NOW: 16, // from the 2025 bar's right edge to the now tile's left edge
  CREST_FILL: 0.64, // a figure's optical size: its ink box's geometric mean / the tile (see OPTICAL)
  SPORT_FILL: 0.66, // an anonymous team's sport glyph: its 24-unit Lucide box / the tile
} as const;
export const TILE_TOP = GEO.FLOOR - GEO.TILE; // 1200: where bars and the time axis stand

// --- tokens: money (WORLD px per $1B) — one scale per act --------------------------------------
// Act A (cuts 1-2) keeps the clip's 160 px / $1B (data.md's px tables are on it).
// Act B (cuts 3-4) is valuations: 13x the revenues; at 160 the tiles would shrink to
// ~45 px on screen, so Act B draws money at 42 px / $1B (cut 3 opens on its own
// establishing shot of the now pillar; never rescale on screen).
// Cut 5 (sponsorship, no numbers): Mercedes' ~$558M tower = 576 px.
export const MONEY = { A: 160, B: 42, C5_MERC_BAR: 576 } as const;

// --- tokens: type (SCREEN px at rest) -----------------------------------------------------------
// THREE sizes for the graphics: HERO numeral, SECONDARY numeral, LABEL (caps words and the
// small figures of a chart). Numbers are Söhne Dreiviertelfett (tabular when they count),
// words Söhne Kräftig caps +0.06 em. Overlays (name tag, call to action) add TAG.
// Between two rests a text eases from one size token to the next with the camera's own
// progress; at rest it is always exactly a token.
export const TYPE = {
  HERO: 184,
  SECONDARY: 136,
  LABEL: 30,
  TAG: 96, // overlays only: the name, "Watch here" (Dreiviertelfett)
  TAG_SUB: 36, // overlays only: the job line (Kräftig, sentence case, as the user's chosen tag)
} as const;
export const TRACK = { numeral: -0.015, label: 0.06, tag: -0.01 } as const;

// --- tokens: spacing (SCREEN px at rest, the 8-px grid) -------------------------------------------
export const SPACE = {
  LOCKUP: 24, // a numeral's baseline to the cap top of its label (or of the numeral stacked under it)
  CLEAR: 24, // an object to the type standing on it / beside it
  VALUE: 16, // a chart bar's top to its value's baseline
  AXIS: 16, // the time axis to the year's cap top
  INSET_X: 40, // overlay card: text inset left/right
  INSET_Y: 24, // overlay card: text inset top/bottom
  STRIP_GAP: 8, // name strip to job strip
} as const;

// --- tokens: strokes, edges, slot (SCREEN px) ------------------------------------------------------
export const STROKE = { HAIRLINE: 1.5, RULE: 2 } as const; // hairline: glass and rungs; rule: an axis
export const EDGE = { CREAM: 1.5, HOT: 2, HOT_FALL: 12, SLOT: 2, SLOT_LIP: 2, FOOT_AO: 10 } as const;

// --- tokens: light ----------------------------------------------------------------------------------
// ONE key light from above, slightly left: shadows fall down and a little right.
// Three elevations, each an ambient + a key layer (WORLD px, for TILE-scale objects);
// `rest` adds the contact shadow where a pillar meets the floor.
// (ShadowLayer / Elevation: see PALETTES above; each palette carries its own alphas, one light.)
export const ELEVATION: ElevationTokens = PALETTE.ELEVATION;
/** The pool of light that follows the subject (SCREEN px): screen-blended light (the palette's). */
export const POOL = PALETTE.POOL;
export const VIGNETTE = PALETTE.VIGNETTE;
/** Film grain: one texture, overlay, one strength, a new offset every 2 frames. */
export const GRAIN = { opacity: PALETTE.GRAIN_OPACITY, blend: "overlay" as const, onTwos: true, travel: 96 };
/** Bloom: amber only, one recipe, a fixed property (SCREEN px). */
export const BLOOM_LAYERS = PALETTE.BLOOM_LAYERS;
/** The light sweep (the one click of a cut): SCREEN px. */
export const SWEEP = { band: 84, angle: 22, soft: 10, alpha: 0.5 } as const;
/** The parallax of the ground under the camera, and its slow drift (px per frame). */
export const GROUND = { src: PALETTE.GROUND_SRC, grain: "cheekypint2/grain.png", parallax: 0.15, drift: 0.3, W: 1296, H: 2304, zoom: 0.15 } as const;

// ===========================================================================
// FONTS + METRICS
// ===========================================================================
export const FONT_NUM = "StoutSohneDreiviertelfett";
export const FONT_LABEL = "StoutSohneKraftig";
loadFont({ family: FONT_NUM, url: staticFile("Sohne-Dreiviertelfett.otf"), weight: "700" });
loadFont({ family: FONT_LABEL, url: staticFile("Sohne-Kraftig.otf"), weight: "500" });
/** Söhne metrics (em), fontTools. */
export const METRIC = { cap: 0.718, fig: 0.729, dollarTop: 0.818, dollarDesc: 0.102, timesTop: 0.597, timesBot: 0.095 } as const;
const ADV_NUM: Record<string, number> = {
  "0": 0.646, "1": 0.409, "2": 0.584, "3": 0.586, "4": 0.619, "5": 0.586, "6": 0.603, "7": 0.57, "8": 0.609,
  "9": 0.603, $: 0.61, "%": 0.788, "×": 0.608, B: 0.649, M: 0.868, " ": 0.199, ".": 0.254, ",": 0.254,
};
export const TNUM_ADV = 0.608; // every tabular figure
const ADV_LABEL: Record<string, number> = {
  A: 0.709, B: 0.639, C: 0.667, D: 0.701, E: 0.594, F: 0.577, G: 0.727, H: 0.736, I: 0.264, J: 0.403, K: 0.657,
  L: 0.549, M: 0.854, N: 0.727, O: 0.73, P: 0.632, Q: 0.73, R: 0.653, S: 0.59, T: 0.62, U: 0.693, V: 0.687,
  W: 0.932, X: 0.673, Y: 0.647, Z: 0.629, " ": 0.206, "0": 0.632, "1": 0.395, "2": 0.568, "3": 0.575, "4": 0.61,
  "5": 0.574, "6": 0.595, "7": 0.545, "8": 0.602, "9": 0.595,
};
/** Advance width (screen px) of a numeral string at `px` (proportional figures unless `tabular`). */
export const numeralWidth = (text: string, px: number, tabular = false) =>
  [...text].reduce((a, c) => a + (tabular && /\d/.test(c) ? TNUM_ADV : ADV_NUM[c] ?? 0.6), 0) * px +
  TRACK.numeral * px * Math.max(0, text.length - 1);
const ADV_SUB: Record<string, number> = {
  a: 0.531, b: 0.595, c: 0.519, d: 0.595, e: 0.54, f: 0.31, g: 0.594, h: 0.563, i: 0.246, j: 0.246, k: 0.546,
  l: 0.246, m: 0.866, n: 0.563, o: 0.566, p: 0.595, q: 0.595, r: 0.381, s: 0.494, t: 0.338, u: 0.563, v: 0.509,
  w: 0.72, x: 0.512, y: 0.509, z: 0.499,
};
/** Advance width (screen px) of a sentence-case Kräftig line at `px` (no tracking). */
export const subWidth = (text: string, px: number) => [...text].reduce((a, c) => a + (ADV_SUB[c] ?? ADV_LABEL[c] ?? 0.55), 0) * px;
/** Advance width (screen px) of a caps label at `px`. */
export const labelWidth = (text: string, px: number) =>
  [...text.toUpperCase()].reduce((a, c) => a + (ADV_LABEL[c] ?? 0.62), 0) * px + TRACK.label * px * Math.max(0, text.length - 1);

// ===========================================================================
// SMALL HELPERS
// ===========================================================================
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const easeOutCubic = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
/** Full precision for transforms (6 decimals, never exponent notation): a camera scale written at 3
 *  decimals moves the world by up to 0.0005 x its coordinates (0.65 px at the floor) and steps in
 *  slow zooms (STOUT_FIX_1). Every translate / scale below goes through this. */
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `st${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
/** World length that lands on a whole number of screen px at camera k (pixel care at rest). */
export const snapLen = (world: number, k: number) => Math.round(world * k) / k;
/** A camera whose centre puts world point (wx, wy) at screen point (sx, sy). */
export const camFor = (wx: number, wy: number, sx: number, sy: number, k: number): Cam => ({
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
  k,
});
export const toScreen = (c: Cam, x: number, y: number) => ({ x: 540 + (x - c.x) * c.k, y: 960 + (y - c.y) * c.k });
/** A rounded rect path (top-left x, y; world px). `top` / `bottom` round only those corners. */
export const rectPath = (x: number, y: number, w: number, h: number, r: number = GEO.RADIUS, top = true, bottom = true) => {
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
/** Mix two #rrggbb colours (t = 0 -> a, 1 -> b): every change of state is a change of TONE. */
export const mixHex = (a: string, b: string, t: number) => {
  const q = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = q(a);
  const B = q(b);
  const u = clamp01(t);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Bloom as a CSS filter for an element drawn in WORLD px under camera k (radii stay SCREEN px). */
export const bloomFilter = (k: number) => BLOOM_LAYERS.map((l) => `drop-shadow(0 0 ${f2(l.blur / k)}px ${l.color})`).join(" ");

// ===========================================================================
// THE STAGE
// ===========================================================================
export type Pool = { x: number; y: number; strength?: number } | null; // world point the light follows
/**
 * StoutStage: the ground (baked sheet, parallax + drift on the story clock S, a slow zoom with
 * the camera), the light pool following `pool`, the world under `cam` (its CENTRE, as
 * cameraTrack returns it), the vignette, then grain on twos. `rest` is the act's opening camera
 * (the parallax origin). `sway` adds the house sway on S (off for stills).
 * `overlay` is drawn in SCREEN px above the world, under the vignette and grain.
 */
export const StoutStage: React.FC<{
  S: number;
  cam: Cam;
  rest?: Cam;
  pool?: Pool;
  sway?: boolean;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ S, cam, rest = cam, pool = null, sway = true, children, overlay }) => {
  const k = cam.k;
  const sw = sway ? { dx: 3 * Math.sin(S / 23), dy: 5 * Math.sin(S / 19) } : { dx: 0, dy: 0 };
  const tx = 540 - cam.x * k + sw.dx;
  const ty = 960 - cam.y * k + sw.dy;
  // the ground: parallax against the act's rest camera, drift on S, a gentle zoom with k
  const gScale = Math.pow(k / rest.k, GROUND.zoom);
  const gx = -(cam.x - rest.x) * k * GROUND.parallax;
  const gy = -(cam.y - rest.y) * k * GROUND.parallax - S * GROUND.drift;
  // grain on twos
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash01(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 7) * 2 - 1) * GRAIN.travel;
  const p = pool ? { x: 540 + (pool.x - cam.x) * k + sw.dx, y: 960 + (pool.y - cam.y) * k + sw.dy, s: pool.strength ?? 1 } : null;
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground, overflow: "hidden" }}>
      <Img
        src={staticFile(GROUND.src)}
        style={{
          position: "absolute",
          left: (1080 - GROUND.W) / 2,
          top: (1920 - GROUND.H) / 2,
          width: GROUND.W,
          height: GROUND.H,
          transform: `translate(${fx(gx)}px, ${fx(gy)}px) scale(${fx(gScale)})`,
        }}
      />
      {p ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse ${POOL.rx}px ${POOL.ry}px at ${fx(p.x)}px ${fx(p.y)}px, rgba(${POOL.color},${f2(
              POOL.a0 * p.s,
            )}) 0%, rgba(${POOL.color},${f2(POOL.a1 * p.s)}) 45%, rgba(${POOL.color},0) 100%)`,
          }}
        />
      ) : null}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(k)})`}>{GROUND_ONLY ? null : children}</g>
      </svg>
      {GROUND_ONLY ? null : overlay}
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Img
          src={staticFile(GROUND.grain)}
          style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ===========================================================================
// SHADOWS — one object, one silhouette, one light
// ===========================================================================
export type Silhouette = { d: string; a?: number }[]; // world paths; `a` < 1 for glass (a faint shadow)
/**
 * The shadow of ONE object at an elevation: its union silhouette filled once per layer (so
 * overlapping parts never stack), offset and blurred by the elevation's recipe. Draw it BEFORE
 * the object's body. `lift` (0..1) eases the shadow from `elevation` toward the next level up
 * (an entrance: an object rises off the floor, its shadow grows and softens). `contact` is the
 * foot of a pillar standing on the floor: { x, y, w } in world px.
 */
export const ElevationShadow: React.FC<{
  silhouette: Silhouette;
  elevation?: Elevation;
  lift?: number;
  contact?: { x: number; y: number; w: number } | null;
  strength?: number;
}> = ({ silhouette, elevation = "rest", lift = 0, contact = null, strength = 1 }) => {
  const next: Record<Elevation, Elevation> = { rest: "lifted", lifted: "float", float: "float" };
  const A = ELEVATION[elevation];
  const B = ELEVATION[next[elevation]];
  const t = clamp01(lift);
  const mix = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({
    dx: lerp(a.dx, b.dx, t),
    dy: lerp(a.dy, b.dy, t),
    blur: lerp(a.blur, b.blur, t),
    a: lerp(a.a, b.a, t),
  });
  const layers = [mix(A.amb, B.amb), mix(A.key, B.key)];
  const paths = silhouette.map((s, i) => <path key={i} d={s.d} fillOpacity={s.a ?? 1} />);
  const c = A.contact;
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      {contact && c ? (
        <ellipse
          cx={contact.x + c.dx}
          cy={contact.y}
          rx={contact.w * 0.58}
          ry={3}
          opacity={c.a * (1 - t) * strength}
          style={{ filter: `blur(${f2(c.blur)}px)` }}
        />
      ) : null}
      {layers.map((l, i) => (
        <g key={i} opacity={f2(l.a * strength)} transform={`translate(${fx(l.dx)} ${fx(l.dy)})`} style={{ filter: `blur(${f2(l.blur)}px)` }}>
          {paths}
        </g>
      ))}
    </g>
  );
};

// ===========================================================================
// FIGURES (tile-local box 0..size; black = knocked out)
// ===========================================================================
/**
 * OPTICAL SIZE — so the marks read as one family. Measured off a probe render
 * (StoutProbe -> out/wolff/stout/probe/crests_raw.png): each crest's ink box in its own viewBox
 * units, its silhouette fill (silhouette area / box area) and its centroid's offset from the box
 * centre (in units of the box's geometric mean). THE RULE, the same for every mark:
 *   size   the box's geometric mean = CREST_FILL x tile x (FILL_REF / fill)^0.25 — a dense round
 *          mark is drawn a little smaller than a spiky star or an airy wordmark of the same box;
 *   clamp  neither side of the box exceeds CREST_MAX x tile (a wide wordmark is held in);
 *   centre the box centre on the tile centre, moved by half the centroid offset toward it
 *          (a star or a crown-topped crest sits a hair higher, a wordmark over a ball lower).
 * The Mercedes ring follows the same rule (a circle: fill 0.785 = FILL_REF).
 */
export const CREST_MAX = 0.84;
export const FILL_REF = 0.785;
export type Optical = { box: [number, number, number, number]; fill: number; cy: number };
export const OPTICAL: Record<CrestId, Optical> = {
  LAKERS: { box: [15.74, 11.5, 261.58, 158.04], fill: 0.58, cy: 0.01 },
  WARRIORS: { box: [2.79, 23.56, 220.55, 220.55], fill: 0.78, cy: -0.001 },
  KNICKS: { box: [10.94, 19.79, 227.6, 173.96], fill: 0.61, cy: -0.093 },
  COWBOYS: { box: [2.7, 2.7, 426.6, 405.9], fill: 0.4, cy: 0.115 },
  MANUTD: { box: [3.12, 3.12, 290.0, 293.75], fill: 0.72, cy: -0.002 },
  REALMADRID: { box: [0.45, 0.18, 31.09, 42.37], fill: 0.69, cy: 0.063 },
};
/** Where a mark of box (w, h), fill and centroid offset lands in a tile of `size`:
 *  its scale (box units -> px) and its box centre (tile-local px). */
export const opticalFit = (w: number, h: number, fill: number, cy: number, size: number) => {
  const gm = GEO.CREST_FILL * size * Math.pow(FILL_REF / fill, 0.25);
  let sc = gm / Math.sqrt(w * h);
  sc = Math.min(sc, (CREST_MAX * size) / w, (CREST_MAX * size) / h);
  const gmPx = sc * Math.sqrt(w * h);
  return { sc, cx: size / 2, cy: size / 2 - 0.5 * cy * gmPx };
};

/** The Mercedes star, wolffShared's geometry (ring 0.40 / 0.34, tips on the inner ring, inner
 *  vertices at MB_STAR_INNER), its ring sized by the family's optical rule. */
const mercedesPaths = (size: number) => {
  const fit = opticalFit(1, 1, FILL_REF, 0, size); // a unit circle's box
  const c = size / 2;
  const ro = fit.sc / 2;
  const ri = ro * (MB_RING_IN / MB_RING_OUT);
  const inner = MB_STAR_INNER * ri;
  const p = (r: number, deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${f2(c + r * Math.cos(a))} ${f2(c + r * Math.sin(a))}`;
  };
  const ring =
    `M ${f2(c + ro)} ${f2(c)} A ${f2(ro)} ${f2(ro)} 0 1 0 ${f2(c - ro)} ${f2(c)} A ${f2(ro)} ${f2(ro)} 0 1 0 ${f2(c + ro)} ${f2(c)} Z ` +
    `M ${f2(c + ri)} ${f2(c)} A ${f2(ri)} ${f2(ri)} 0 1 1 ${f2(c - ri)} ${f2(c)} A ${f2(ri)} ${f2(ri)} 0 1 1 ${f2(c + ri)} ${f2(c)} Z`;
  const star = [-90, -30, 30, 90, 150, 210].map((a, i) => p(i % 2 === 0 ? ri : inner, a));
  return { ring, star: `M ${star.join(" L ")} Z` };
};

/** A crest's markup placed by the optical rule. */
const CrestMark: React.FC<{ crest: Crest; id: CrestId; size: number }> = ({ crest, id, size }) => {
  const o = OPTICAL[id];
  const [bx, by, bw, bh] = o.box;
  const fit = opticalFit(bw, bh, o.fill, o.cy, size);
  const ox = fit.cx - (bx + bw / 2) * fit.sc;
  const oy = fit.cy - (by + bh / 2) * fit.sc;
  return (
    <g
      transform={`translate(${fx(ox)} ${fx(oy)}) scale(${fx(fit.sc)})`}
      fill="#000"
      dangerouslySetInnerHTML={{ __html: crest.markup }}
    />
  );
};

export type Figure = { kind: "mercedes" } | { kind: "crest"; id: CrestId } | { kind: "sport"; sport: SportName } | { kind: "none" };
/** A figure in a tile's local box, black (to knock out) on nothing. */
export const FigureMark: React.FC<{ figure: Figure; size: number }> = ({ figure, size }) => {
  if (figure.kind === "mercedes") {
    const m = mercedesPaths(size);
    return (
      <g fill="#000">
        <path d={m.ring} fillRule="evenodd" />
        <path d={m.star} />
      </g>
    );
  }
  if (figure.kind === "crest") {
    const c = CRESTS[figure.id];
    return c ? <CrestMark crest={c} id={figure.id} size={size} /> : null;
  }
  if (figure.kind === "sport") {
    const g = size * GEO.SPORT_FILL;
    const s = g / 24;
    const o = (size - g) / 2;
    return (
      <g
        transform={`translate(${fx(o)} ${fx(o)}) scale(${fx(s)})`}
        fill="none"
        stroke="#000"
        strokeWidth={2.6}
        strokeLinecap="square"
        strokeLinejoin="miter"
        dangerouslySetInnerHTML={{ __html: SPORT_GLYPHS[figure.sport] }}
      />
    );
  }
  return null;
};

// ===========================================================================
// THE PILLAR — tile + bar + slice + glass + fill, ONE object
// ===========================================================================
export type Role = "hi" | "lo";
export type PillarProps = {
  /** centre x of the pillar, world px */
  x: number;
  /** where the tile stands (its bottom edge), world px; default GEO.FLOOR */
  floor?: number;
  /** current camera zoom (for the SCREEN-px tokens: edges, slot, hairlines, bloom) */
  k: number;
  figure?: Figure;
  tile?: number; // tile size (default GEO.TILE)
  barW?: number; // bar / slice / glass / fill width (default GEO.BAR)
  /** the money bar's height above the tile's top edge (0 = no bar) */
  bar?: number;
  /** the whole bar is amber (Mercedes' sponsorship tower) */
  accent?: boolean;
  /** the profit slice at the bar's top, its height */
  slice?: number;
  /** the valuation glass, from the slice's lower edge up, its height */
  glass?: number;
  /** the x20 fill inside the glass, from the same base, its height */
  fill?: number;
  /** rung spacing on the fill (that team's slice height) */
  rung?: number;
  /** hi = cream (the subject); lo = dark board (context) */
  role?: Role;
  /** the glass hairline's rung (hi = backed by profit) */
  glassRole?: Role;
  elevation?: Elevation;
  /** 0..1 toward the next elevation (an entrance) */
  lift?: number;
  /** extra vertical offset of the whole pillar (world px), e.g. rising into place */
  dy?: number;
  /** a continuous role: 0 = hi (cream) .. 1 = lo (board), eased by TONE (overrides `role`);
   *  drive it over RUNG_F frames when the mechanism reaches the pillar */
  dim?: number;
  /** the house entrance, 0..1 over ~12 f: slide up 24 SCREEN px + fade, the whole object at once */
  enter?: number;
};
/** Frames a card takes to change tone (hi <-> lo). */
export const RUNG_F = 12;

/** The parts of a pillar as world rects (shared by its shadow, its body and its labels). */
export const pillarGeometry = (p: PillarProps) => {
  const T = p.tile ?? GEO.TILE;
  const Wb = p.barW ?? GEO.BAR;
  const floor = (p.floor ?? GEO.FLOOR) + (p.dy ?? 0);
  const tileTop = floor - T;
  const bar = Math.max(0, p.bar ?? 0);
  const slice = Math.min(bar, Math.max(0, p.slice ?? 0));
  const barTop = tileTop - bar;
  const base = barTop + slice; // the slice's lower edge: glass and fill stand here
  const glass = Math.max(0, p.glass ?? 0);
  const fill = Math.min(glass > 0 ? glass : Infinity, Math.max(0, p.fill ?? 0));
  return {
    T,
    Wb,
    floor,
    tileTop,
    tile: { x: p.x - T / 2, y: tileTop, w: T, h: T },
    bar: bar > 0 ? { x: p.x - Wb / 2, y: barTop, w: Wb, h: bar } : null,
    slice: slice > 0 ? { x: p.x - Wb / 2, y: barTop, w: Wb, h: slice } : null,
    glass: glass > 0 ? { x: p.x - Wb / 2, y: base - glass, w: Wb, h: glass } : null,
    fill: fill > 0 && Number.isFinite(fill) ? { x: p.x - Wb / 2, y: base - fill, w: Wb, h: fill } : null,
    base,
    top: Math.min(tileTop, barTop, glass > 0 ? base - glass : Infinity),
  };
};

/** One gradient per pillar: cream (hi) or board (lo) lit from above over the pillar's own height;
 *  `dim` 0..1 mixes the two by tone. */
const PillarGradient: React.FC<{ id: string; dim: number; y0: number; y1: number }> = ({ id, dim, y0, y1 }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y1)}>
    <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
    <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
  </linearGradient>
);
/** The amber light band: every amber body samples ONE gradient locked to the screen's band (SCREEN
 *  y 300 -> 1368, the light comes from above). Pass it to every Pillar / ChartBar of a frame. */
export const amberBandFor = (c: Cam, y0 = 300, y1 = 1368): [number, number] => [c.y + (y0 - 960) / c.k, c.y + (y1 - 960) / c.k];
/** The amber band gradient (world y0..y1). */
export const AmberGradient: React.FC<{ id: string; y0: number; y1: number }> = ({ id, y0, y1 }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y1)}>
    <stop offset="0" stopColor={COLOR.amberTop} />
    <stop offset="1" stopColor={COLOR.amberFoot} />
  </linearGradient>
);

/** The hot top edge of an amber body (SCREEN px: 2 px line + a 12 px falloff). */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; r: number; id: string }> = ({ x, y, w, k, r, id }) => {
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, r, true, false)} fill={`url(#${id})`} />
      <path d={`M${f2(x + r)} ${f2(y + EDGE.HOT / k / 2)}H${f2(x + w - r)}`} stroke={COLOR.amberHot} strokeWidth={f2(EDGE.HOT / k)} />
    </g>
  );
};

/**
 * Pillar — a team (or the "now" Mercedes) as ONE built object: the tile with its figure
 * knocked out to the dark, the bar rising out of a slot in the tile's top edge, the profit
 * slice on the bar's top, the valuation glass from the slice's lower edge and the x20 fill in
 * it; one union shadow at its elevation; amber parts bloom (a fixed property).
 * `amberBand` = [y0, y1] world, the act's amber gradient span (so slices and fills of every
 * pillar in a frame share one gradient); default: the pillar's own height.
 */
export const Pillar: React.FC<PillarProps & { amberBand?: [number, number] }> = (p) => {
  const uid = uidOf(useId());
  const k = p.k;
  const g = pillarGeometry(p);
  const role = p.role ?? "hi";
  const dim = p.dim ?? (role === "hi" ? 0 : 1);
  const en = p.enter === undefined ? 1 : easeOutCubic(p.enter);
  const r = GEO.RADIUS;
  const figure = p.figure ?? { kind: "none" };
  const cream = `url(#${uid}c)`;
  const amber = `url(#${uid}a)`;
  const band = p.amberBand ?? [g.top, g.floor];
  // silhouette: the union of every part (glass at a faint alpha: it is transparent)
  const sil: Silhouette = [{ d: rectPath(g.tile.x, g.tile.y, g.tile.w, g.tile.h, r) }];
  if (g.bar) sil.push({ d: rectPath(g.bar.x, g.bar.y, g.bar.w, g.bar.h + r, r, true, false) });
  if (g.glass) sil.push({ d: rectPath(g.glass.x, g.glass.y, g.glass.w, g.glass.h, r, true, false), a: 0.3 });
  if (g.fill) sil.push({ d: rectPath(g.fill.x, g.fill.y, g.fill.w, g.fill.h, 0) });
  const slotW = g.Wb + (2 * EDGE.SLOT_LIP) / k;
  const slotH = EDGE.SLOT / k;
  const creamTop = g.bar ? g.bar.y : g.tile.y;
  const loEdge = lerp(ALPHA.edge, ALPHA.edgeBoard, dim);
  // rungs on the fill, one every `rung` from the base, never on the hot edge
  const rungs: number[] = [];
  if (g.fill && (p.rung ?? 0) > 0.5) {
    const n = Math.floor(g.fill.h / (p.rung as number) + 1e-6);
    for (let i = 1; i <= n; i++) {
      const y = g.base - i * (p.rung as number);
      if (y > g.fill.y + (EDGE.HOT + 2) / k) rungs.push(y);
    }
  }
  const fillFull = !!(g.fill && g.glass && g.fill.h >= g.glass.h - 0.5);
  if (en <= 0.001) return null;
  return (
    <g opacity={en < 1 ? f2(en) : undefined} transform={en < 1 ? `translate(0 ${fx(((1 - en) * 24) / k)})` : undefined}>
      <defs>
        <PillarGradient id={`${uid}c`} dim={dim} y0={creamTop} y1={g.floor} />
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={g.tile.x} y={g.tile.y} width={g.tile.w} height={g.tile.h}>
          <rect x={g.tile.x} y={g.tile.y} width={g.tile.w} height={g.tile.h} fill="#fff" />
          <g transform={`translate(${fx(g.tile.x)} ${fx(g.tile.y)})`}>
            <FigureMark figure={figure} size={g.T} />
          </g>
        </mask>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>

      {/* 1. the one shadow */}
      <ElevationShadow
        silhouette={sil}
        elevation={p.elevation ?? "rest"}
        lift={p.lift ?? 0}
        contact={(p.elevation ?? "rest") === "rest" ? { x: p.x, y: g.floor, w: g.T } : null}
      />

      {/* 2. the glass body (behind the fill) */}
      {g.glass ? (
        <path d={rectPath(g.glass.x, g.glass.y, g.glass.w, g.glass.h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
      ) : null}

      {/* 3. cream (or board): the bar (ending exactly on the tile's top edge) and the tile */}
      {g.bar && !p.accent ? (
        g.slice ? (
          <path d={rectPath(g.bar.x, g.base, g.bar.w, g.tileTop - g.base, 0, false, false)} fill={cream} />
        ) : (
          <path d={rectPath(g.bar.x, g.bar.y, g.bar.w, g.bar.h, r, true, false)} fill={cream} />
        )
      ) : null}
      <path d={rectPath(g.tile.x, g.tile.y, g.tile.w, g.tile.h, r)} fill={cream} mask={`url(#${uid}k)`} />

      {/* 4. amber: the accent tower, the fill, the slice — one glow pass */}
      <g style={{ filter: bloomFilter(k) }}>
        {g.bar && p.accent ? <path d={rectPath(g.bar.x, g.bar.y, g.bar.w, g.bar.h, r, true, false)} fill={amber} /> : null}
        {g.fill ? <path d={rectPath(g.fill.x, g.fill.y, g.fill.w, g.fill.h, r, fillFull, false)} fill={amber} /> : null}
        {g.slice ? <path d={rectPath(g.slice.x, g.slice.y, g.slice.w, g.slice.h, r, true, false)} fill={amber} /> : null}
      </g>
      {rungs.length ? (
        <g stroke={COLOR.rung} strokeWidth={f2(STROKE.HAIRLINE / k)}>
          {rungs.map((y) => (
            <line key={y} x1={f2(g.fill!.x)} x2={f2(g.fill!.x + g.fill!.w)} y1={f2(y)} y2={f2(y)} />
          ))}
        </g>
      ) : null}
      {/* hot edges: only on a true top surface */}
      {g.bar && p.accent ? <HotEdge x={g.bar.x} y={g.bar.y} w={g.bar.w} k={k} r={r} id={`${uid}h1`} /> : null}
      {g.fill ? <HotEdge x={g.fill.x} y={g.fill.y} w={g.fill.w} k={k} r={fillFull ? r : 0} id={`${uid}h2`} /> : null}
      {g.slice && !g.fill ? <HotEdge x={g.slice.x} y={g.slice.y} w={g.slice.w} k={k} r={r} id={`${uid}h3`} /> : null}

      {/* 5. the lit top edges of the cream (the tile's stops at the slot) */}
      {g.bar && !p.accent && !g.slice ? (
        <path d={`M${f2(g.bar.x + r)} ${f2(g.bar.y + EDGE.CREAM / k / 2)}H${f2(g.bar.x + g.bar.w - r)}`} stroke={COLOR.edge} strokeOpacity={loEdge} strokeWidth={f2(EDGE.CREAM / k)} />
      ) : null}
      {(() => {
        const y = g.tile.y + EDGE.CREAM / k / 2;
        const sw = f2(EDGE.CREAM / k);
        if (!g.bar) return <path d={`M${f2(g.tile.x + r)} ${f2(y)}H${f2(g.tile.x + g.tile.w - r)}`} stroke={COLOR.edge} strokeOpacity={loEdge} strokeWidth={sw} />;
        const s0 = p.x - slotW / 2;
        const s1 = p.x + slotW / 2;
        return (
          <path
            d={`M${f2(g.tile.x + r)} ${f2(y)}H${f2(s0)}M${f2(s1)} ${f2(y)}H${f2(g.tile.x + g.tile.w - r)}`}
            stroke={COLOR.edge}
            strokeOpacity={loEdge}
            strokeWidth={sw}
          />
        );
      })()}

      {/* 6. the joint: the bar's foot occlusion and the slot line across it */}
      {g.bar ? (
        <>
          <rect x={f2(g.bar.x)} y={f2(g.tileTop - Math.min(g.bar.h, EDGE.FOOT_AO / k))} width={f2(g.bar.w)} height={f2(Math.min(g.bar.h, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
          <rect x={f2(p.x - slotW / 2)} y={f2(g.tileTop - slotH / 2)} width={f2(slotW)} height={f2(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
        </>
      ) : null}

      {/* 7. the glass hairline: sides and top, open at its base */}
      {g.glass ? (
        (() => {
          const s = STROKE.HAIRLINE / k / 2;
          const x0 = g.glass.x + s;
          const x1 = g.glass.x + g.glass.w - s;
          const y0 = g.glass.y + s;
          const yb = g.base;
          return (
            <path
              d={`M${f2(x0)} ${f2(yb)}V${f2(y0 + r)}A${r} ${r} 0 0 1 ${f2(x0 + r)} ${f2(y0)}H${f2(x1 - r)}A${r} ${r} 0 0 1 ${f2(x1)} ${f2(y0 + r)}V${f2(yb)}`}
              fill="none"
              stroke={COLOR.glass}
              strokeOpacity={(p.glassRole ?? "lo") === "hi" ? ALPHA.glassHi : ALPHA.glassLo}
              strokeWidth={f2(STROKE.HAIRLINE / k)}
            />
          );
        })()
      ) : null}
    </g>
  );
};

/** A tile on its own (a team with no money drawn yet): a Pillar with no bar. */
export const TeamTile: React.FC<{ x: number; k: number; figure: Figure; role?: Role; floor?: number; elevation?: Elevation; lift?: number; dy?: number }> = (p) => (
  <Pillar {...p} />
);
export const MercedesTile: React.FC<Omit<React.ComponentProps<typeof TeamTile>, "figure">> = (p) => (
  <Pillar {...p} figure={{ kind: "mercedes" }} />
);
export const CrestTile: React.FC<Omit<React.ComponentProps<typeof TeamTile>, "figure"> & { id: CrestId }> = ({ id, ...p }) => (
  <Pillar {...p} figure={{ kind: "crest", id }} />
);
export const SportTile: React.FC<Omit<React.ComponentProps<typeof TeamTile>, "figure"> & { sport: SportName }> = ({ sport, ...p }) => (
  <Pillar {...p} figure={{ kind: "sport", sport }} />
);

// ===========================================================================
// CHART PARTS (cut 2): history bars on the time axis
// ===========================================================================
/**
 * ChartBar — a year of revenue: a cream bar standing on the time axis (no tile: it is Mercedes'
 * own past), its profit slice on top, one shadow (resting on the axis), the same lit edge.
 */
export const ChartBar: React.FC<{ x: number; baseY: number; h: number; slice?: number; w?: number; k: number; role?: Role; amberBand: [number, number] }> = ({
  x,
  baseY,
  h,
  slice = 0,
  w = GEO.HIST_BAR,
  k,
  role = "hi",
  amberBand,
}) => {
  const uid = uidOf(useId());
  if (h <= 0.05) return null;
  const r = GEO.RADIUS;
  const x0 = x - w / 2;
  const y0 = baseY - h;
  const s = Math.min(slice, h);
  return (
    <g>
      <defs>
        <PillarGradient id={`${uid}c`} dim={role === "hi" ? 0 : 1} y0={y0} y1={baseY} />
        <AmberGradient id={`${uid}a`} y0={amberBand[0]} y1={amberBand[1]} />
      </defs>
      <ElevationShadow silhouette={[{ d: rectPath(x0, y0, w, h, r, true, false) }]} elevation="rest" />
      {s > 0.05 ? (
        <path d={rectPath(x0, y0 + s, w, h - s, 0, false, false)} fill={`url(#${uid}c)`} />
      ) : (
        <path d={rectPath(x0, y0, w, h, r, true, false)} fill={`url(#${uid}c)`} />
      )}
      {s > 0.05 ? (
        <g style={{ filter: bloomFilter(k) }}>
          <path d={rectPath(x0, y0, w, s, r, true, false)} fill={`url(#${uid}a)`} />
        </g>
      ) : null}
      {s > 0.05 ? (
        <HotEdge x={x0} y={y0} w={w} k={k} r={r} id={`${uid}h`} />
      ) : (
        <path d={`M${f2(x0 + r)} ${f2(y0 + EDGE.CREAM / k / 2)}H${f2(x0 + w - r)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f2(EDGE.CREAM / k)} />
      )}
    </g>
  );
};

/** A rule (the time axis): one weight, the rule tone. */
export const Rule: React.FC<{ x0: number; x1: number; y: number; k: number }> = ({ x0, x1, y, k }) => (
  <line x1={f2(x0)} x2={f2(x1)} y1={f2(y)} y2={f2(y)} stroke={COLOR.rule} strokeWidth={f2(STROKE.RULE / k)} strokeLinecap="butt" />
);

// ===========================================================================
// TYPE
// ===========================================================================
export type Tone = "cream" | "creamLo" | "dark" | "amber";
const toneColor = (t: Tone) =>
  t === "cream" ? COLOR.inkCream : t === "creamLo" ? COLOR.inkCreamLo : t === "dark" ? COLOR.inkDark : COLOR.amberTop;
/** The house entrance: slide up 24 SCREEN px + fade 0 -> 1 + blur 6 -> 0 px, ease-out (drive
 *  `enter` 0..1 linearly over 12 f); `exit` is the reverse. */
const entrance = (enter: number, exit: number) => {
  const a = easeOutCubic(enter);
  const e = 1 - Math.pow(1 - clamp01(exit), 3);
  return { lift: (1 - a) * 24 + e * 24, opacity: a * (1 - e), blur: 6 * (1 - a) + 6 * e };
};

/**
 * Numeral — Söhne Dreiviertelfett at a TYPE size (SCREEN px; pass the current eased size between
 * two rests). Static `text`, or an ODOMETER: `value` (any float) shown through `format`; every
 * character that differs between format(floor(value)) and format(floor(value)+1) rolls
 * together by the fractional part (carries roll as one), with a vertical motion blur of
 * `rollBlur` SCREEN px on the rolling digits (pass it proportional to the roll speed;
 * 0 at rest). Tabular figures in odometer mode. `glow` blooms the numeral (amber profit
 * figures on the dark only). (x, y) world px, y = the baseline.
 */
export const Numeral: React.FC<{
  x: number;
  y: number;
  k: number;
  px: number;
  text?: string;
  value?: number;
  format?: (v: number) => string;
  rollBlur?: number;
  tone?: Tone;
  anchor?: "start" | "middle" | "end";
  enter?: number;
  exit?: number;
  glow?: boolean;
}> = ({ x, y, k, px, text: textIn, value, format = (v) => `${Math.round(v)}`, rollBlur = 0, tone = "cream", anchor = "middle", enter = 1, exit = 0, glow = false }) => {
  let text = textIn;
  const uid = uidOf(useId());
  const en = entrance(enter, exit);
  if (en.opacity <= 0.002) return null;
  const fs = px / k;
  const color = toneColor(tone);
  // an odometer that has landed (whole value, no blur) sets proportional figures: the
  // change of spacing happens on the frame the last digit lands (the final tick)
  const landed = value !== undefined && Math.abs(value - Math.round(value)) < 1e-9 && rollBlur <= 0.05;
  const odometer = value !== undefined && !landed;
  if (landed) text = format(Math.round(value as number));
  const filters: string[] = [];
  if (en.blur > 0.05) filters.push(`blur(${f2(en.blur / k)}px)`);
  if (glow) filters.push(bloomFilter(k));
  const style: React.CSSProperties = { filter: filters.length ? filters.join(" ") : undefined };
  const yy = y + en.lift / k;
  if (!odometer) {
    const s = text ?? "";
    const comp = anchor === "middle" ? (TRACK.numeral * fs) / 2 : anchor === "end" ? TRACK.numeral * fs : 0;
    return (
      <g opacity={f2(en.opacity)} style={style}>
        <text
          x={f2(x + comp)}
          y={f2(yy)}
          fontFamily={FONT_NUM}
          fontWeight={700}
          fontSize={f2(fs)}
          letterSpacing={`${TRACK.numeral}em`}
          textAnchor={anchor}
          fill={color}
          style={{ fontFeatureSettings: '"lnum" 1' }}
        >
          {s}
        </text>
      </g>
    );
  }
  // odometer: lay the characters out on tabular advances
  const v = value as number;
  const lo = format(Math.floor(v));
  const hi = format(Math.floor(v) + 1);
  const frac = v - Math.floor(v);
  const n = Math.max(lo.length, hi.length);
  const a = lo.padStart(n, " ");
  const b = hi.padStart(n, " ");
  const adv = (c: string) => (/\d/.test(c) ? TNUM_ADV : ADV_NUM[c] ?? 0.6) * fs + TRACK.numeral * fs;
  const widths = [...a].map((c, i) => Math.max(adv(c), adv(b[i])));
  const total = widths.reduce((s, w) => s + w, 0) - TRACK.numeral * fs;
  let cx = anchor === "middle" ? x - total / 2 : anchor === "end" ? x - total : x;
  const lineH = fs * 1.0;
  const clipTop = yy - fs * 0.9;
  const clipH = fs * 1.06;
  const roll = smoothstep(frac); // a roll eases in and out of each step
  const blurId = `${uid}vb`;
  return (
    <g opacity={f2(en.opacity)} style={style}>
      <defs>
        <clipPath id={`${uid}clip`}>
          <rect x={f2(cx - fs)} y={f2(clipTop)} width={f2(total + 2 * fs)} height={f2(clipH)} />
        </clipPath>
        {rollBlur > 0.05 ? (
          <filter id={blurId} x="-5%" y="-30%" width="110%" height="160%">
            <feGaussianBlur stdDeviation={`0 ${f2(rollBlur / k)}`} />
          </filter>
        ) : null}
      </defs>
      <g clipPath={`url(#${uid}clip)`} fontFamily={FONT_NUM} fontWeight={700} fontSize={f2(fs)} fill={color} style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}>
        {[...a].map((c, i) => {
          const w = widths[i];
          const xc = cx + w / 2 - (TRACK.numeral * fs) / 2;
          cx += w;
          const rolling = c !== b[i];
          if (!rolling) {
            return c === " " ? null : (
              <text key={i} x={f2(xc)} y={f2(yy)} textAnchor="middle">
                {c}
              </text>
            );
          }
          const off = roll * lineH;
          return (
            <g key={i} filter={rollBlur > 0.05 ? `url(#${blurId})` : undefined}>
              {c !== " " ? (
                <text x={f2(xc)} y={f2(yy - off)} textAnchor="middle">
                  {c}
                </text>
              ) : null}
              {b[i] !== " " ? (
                <text x={f2(xc)} y={f2(yy + lineH - off)} textAnchor="middle">
                  {b[i]}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
    </g>
  );
};

/** Label — Söhne Kräftig caps, +0.06 em, `case` forms, at TYPE.LABEL (SCREEN px); the house
 *  entrance. (x, y) world px, y = the baseline. */
export const Label: React.FC<{
  x: number;
  y: number;
  k: number;
  text: string;
  px?: number;
  tone?: Tone;
  anchor?: "start" | "middle" | "end";
  enter?: number;
  exit?: number;
}> = ({ x, y, k, text, px = TYPE.LABEL, tone = "creamLo", anchor = "middle", enter = 1, exit = 0 }) => {
  const en = entrance(enter, exit);
  if (en.opacity <= 0.002) return null;
  const fs = px / k;
  const comp = anchor === "middle" ? (TRACK.label * fs) / 2 : anchor === "end" ? TRACK.label * fs : 0;
  return (
    <g opacity={f2(en.opacity)} style={{ filter: en.blur > 0.05 ? `blur(${f2(en.blur / k)}px)` : undefined }}>
      <text
        x={f2(x + comp)}
        y={f2(y + en.lift / k)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={f2(fs)}
        letterSpacing={`${TRACK.label}em`}
        textAnchor={anchor}
        fill={toneColor(tone)}
        style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
};

// ===========================================================================
// LIGHT SWEEP — the one click of a cut
// ===========================================================================
/**
 * LightSweep — one specular band crossing a surface (an amber body or a cream card), clipped
 * to it, at progress t (0 = just left of it, 1 = just right). World rect + radius; the band is
 * SWEEP.band SCREEN px wide at SWEEP.angle off vertical, softened SWEEP.soft px (amber: the hot
 * edge's colour; cream: white). Used once per cut, on its single click; drive t over ~10 f.
 */
export const LightSweep: React.FC<{ x: number; y: number; w: number; h: number; k: number; t: number; on?: "amber" | "cream"; r?: number }> = ({
  x,
  y,
  w,
  h,
  k,
  t,
  on = "amber",
  r = GEO.RADIUS,
}) => {
  const uid = uidOf(useId());
  if (t <= 0 || t >= 1) return null;
  const band = SWEEP.band / k;
  const skew = Math.tan((SWEEP.angle * Math.PI) / 180) * h;
  const cx = lerp(x - band - skew, x + w + band + skew, t);
  const col = on === "amber" ? COLOR.amberHot : "#FFFFFF";
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <path d={rectPath(x, y, w, h, r)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <path
          d={`M${f2(cx - band / 2)} ${f2(y + h)}L${f2(cx - band / 2 + skew)} ${f2(y)}L${f2(cx + band / 2 + skew)} ${f2(y)}L${f2(cx + band / 2)} ${f2(y + h)}Z`}
          fill={col}
          fillOpacity={SWEEP.alpha}
          style={{ filter: `blur(${f2(SWEEP.soft / k)}px)` }}
        />
      </g>
    </g>
  );
};

// ===========================================================================
// OVERLAYS (SCREEN px, transparent): the name tag and the call to action
// ===========================================================================
/** Overlays are cards seen at k OVERLAY_K: radius, shadows and edges match the graphics. */
export const OVERLAY_K = 1.5;

/** Cards for an overlay: one union shadow (lifted), the lit edge (cream) or the hot edge and bloom (amber). */
const OverlayCards: React.FC<{
  cards: { x: number; y: number; w: number; h: number; fill: "cream" | "amber"; o?: number }[];
  elevation?: Elevation;
  /** 0..1 toward the next elevation while the cards travel (their one shadow grows, then settles) */
  lift?: number;
  children?: React.ReactNode;
}> = ({ cards, elevation = "lifted", lift = 0, children }) => {
  const uid = uidOf(useId());
  const r = GEO.RADIUS * OVERLAY_K;
  const next: Record<Elevation, Elevation> = { rest: "lifted", lifted: "float", float: "float" };
  const A = ELEVATION[elevation];
  const B = ELEVATION[next[elevation]];
  const t = clamp01(lift);
  const mixL = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({ dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t), blur: lerp(a.blur, b.blur, t), a: lerp(a.a, b.a, t) });
  const E = { amb: mixL(A.amb, B.amb), key: mixL(A.key, B.key) };
  const sc = (l: ShadowLayer): ShadowLayer => ({ dx: l.dx * OVERLAY_K, dy: l.dy * OVERLAY_K, blur: l.blur * OVERLAY_K, a: l.a });
  const sil = cards.map((c) => rectPath(c.x, c.y, c.w, c.h, r));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberTop} />
        </linearGradient>
      </defs>
      {/* the one shadow of the whole tag (each card's share fades with its entrance) */}
      <g fill={COLOR.shadow}>
        {[sc(E.amb), sc(E.key)].map((l, i) => (
          <g key={i} opacity={l.a} transform={`translate(${l.dx} ${l.dy})`} style={{ filter: `blur(${l.blur}px)` }}>
            {sil.map((d, j) => (
              <path key={j} d={d} fillOpacity={cards[j].o ?? 1} />
            ))}
          </g>
        ))}
      </g>
      {cards.map((c, i) =>
        (c.o ?? 1) <= 0.001 ? null : c.fill === "cream" ? (
          <g key={i} opacity={c.o ?? 1}>
            <path d={sil[i]} fill={COLOR.cream} />
            <path d={`M${c.x + r} ${c.y + EDGE.CREAM / 2}H${c.x + c.w - r}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={EDGE.CREAM} />
          </g>
        ) : (
          <g key={i} opacity={c.o ?? 1}>
            <path d={sil[i]} fill={COLOR.amberTop} style={{ filter: bloomFilter(1) }} />
            <path d={rectPath(c.x, c.y, c.w, EDGE.HOT_FALL, r, true, false)} fill={COLOR.amberHot} fillOpacity={ALPHA.hotFall * 0.5} />
            <path d={`M${c.x + r} ${c.y + EDGE.HOT / 2}H${c.x + c.w - r}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT} />
          </g>
        ),
      )}
      {children}
    </svg>
  );
};

/** Overlay text (SCREEN px): the TAG line (Dreiviertelfett) or the SUB line (Kräftig, sentence case). y = baseline. */
const OverlayText: React.FC<{ x: number; y: number; text: string; kind: "tag" | "sub"; color?: string; anchor?: "start" | "middle"; o?: number }> = ({
  x,
  y,
  text,
  kind,
  color = COLOR.inkDark,
  anchor = "start",
  o = 1,
}) => (
  <text
    opacity={o}
    style={{ filter: o < 1 ? `blur(${f2(6 * (1 - o))}px)` : undefined, fontFeatureSettings: '"kern" 1' }}
    x={x}
    y={y}
    fontFamily={kind === "tag" ? FONT_NUM : FONT_LABEL}
    fontWeight={kind === "tag" ? 700 : 500}
    fontSize={kind === "tag" ? TYPE.TAG : TYPE.TAG_SUB}
    letterSpacing={`${kind === "tag" ? TRACK.tag : 0}em`}
    textAnchor={anchor}
    fill={color}
  >
    {text}
  </text>
);

/** Overlay metrics, measured (fontTools): the advance of a TAG line in px. */
export const TAG_ADV_EM: Record<string, number> = { "Toto Wolff": 4.641, "Watch here": 5.276 };
export const tagWidth = (text: string) => (TAG_ADV_EM[text] ?? text.length * 0.55) * TYPE.TAG + TRACK.tag * TYPE.TAG * (text.length - 1);

/**
 * StoutNameTag — the user's chosen structure in stout materials: the name on a cream strip,
 * the job on a narrower amber strip under it (8 px gap), one shadow for the pair (lifted),
 * the amber's bloom. House position: left 84, bottom 300. Contrast (WCAG): name on cream
 * 16.2:1, job on amber 10.2:1. `frame` (from the tag's first frame) drives the chosen entrance
 * (TAG_IN: each strip slides up 64 px + fades, each line slides up 24 px + blurs in); at
 * TAG_IN.hold and after it is the resolved tag (static, no idle motion).
 */
export const StoutNameTag: React.FC<{ name: string; job: string; left?: number; bottom?: number; frame?: number }> = ({
  name,
  job,
  left = 84,
  bottom = 300,
  frame = TAG_IN.hold,
}) => {
  const g8 = (v: number) => Math.ceil(v / 8) * 8;
  const nameW = g8(tagWidth(name) + 2 * SPACE.INSET_X);
  const nameH = TAG_BOX.nameH;
  const jobW = g8(subWidth(job, TYPE.TAG_SUB) + 2 * SPACE.CLEAR);
  const jobH = TAG_BOX.jobH;
  const y1 = 1920 - bottom - jobH;
  const y0 = y1 - SPACE.STRIP_GAP - nameH;
  // the chosen entrance (NameTagCheekyPint "strips"): cream strip, name, amber strip, job
  const p = (a: number, d: number) => easeOutCubic(clamp01((frame - a) / d));
  const sName = p(TAG_IN.nameStrip, TAG_IN.strip);
  const tName = p(TAG_IN.name, TAG_IN.text);
  const sJob = p(TAG_IN.jobStrip, TAG_IN.strip);
  const tJob = p(TAG_IN.job, TAG_IN.text);
  // anything that travels lifts one level while it moves: the tag's one shadow follows the strip in flight
  const travel = (q: number) => (q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0);
  const lift = Math.max(travel(sName), travel(sJob));
  return (
    <AbsoluteFill>
      <OverlayCards
        lift={lift}
        cards={[
          { x: left, y: y0 + (1 - sName) * 64, w: nameW, h: nameH, fill: "cream", o: sName },
          { x: left, y: y1 + (1 - sJob) * 64, w: jobW, h: jobH, fill: "amber", o: sJob },
        ]}
      >
        <OverlayText x={left + SPACE.INSET_X} y={y0 + nameH / 2 + (TYPE.TAG * METRIC.cap) / 2 + (1 - tName) * 24} text={name} kind="tag" o={tName} />
        <OverlayText x={left + SPACE.CLEAR} y={y1 + jobH / 2 + (TYPE.TAG_SUB * METRIC.cap) / 2 + (1 - tJob) * 24} text={job} kind="sub" o={tJob} />
      </OverlayCards>
    </AbsoluteFill>
  );
};
/** The name tag's box (8-px grid) and its entrance (frames, from the chosen design). */
export const TAG_BOX = { nameH: 128, jobH: 64 } as const;
export const TAG_IN = { nameStrip: 0, name: 3, jobStrip: 7, job: 12, strip: 20, text: 15, hold: 27 } as const;

/** One amber chevron pointing down: a thick open V (SCREEN px), square-ended, mitred. */
const chevronPath = (cx: number, cy: number, w: number, h: number) => `M${cx - w / 2} ${cy - h / 2}L${cx} ${cy + h / 2}L${cx + w / 2} ${cy - h / 2}`;
/** The call to action (SCREEN px, 8-px grid): the card, then ONE ROW of chevrons under it, side by
 *  side, each pointing down; the row (2 x pitch + one chevron = 456) a touch narrower than the words. */
export const CTA = { cardY: 1150, chevrons: 3, chevW: 120, chevH: 52, chevStroke: 22, chevPitch: 168, rowGap: 56 } as const;
/** The entrance (frames): the card f0-18, its words f4-18, the chevrons drop in left to right at
 *  f12 / 16 / 20 (10 f each); from f30 the loop. THE LOOP: every 36 f a pulse crosses the row left
 *  to right in the first `sweep` of the period (26 f) — each chevron it passes brightens by tone
 *  and eases down `dip` px and back (cos^2, no overshoot) — then the row rests, untouched, for the
 *  last 10 f. So the loop's first frame and every resting frame are the same picture: a file can
 *  end on any of them (168 f: f164-167 rest) and be held or looped. */
export const CTA_IN = { card: 0, strip: 18, text: 4, textF: 14, chev: 12, chevStep: 4, chevF: 10, hold: 30, loop: 36, sweep: 26 / 36, dip: 6, brighten: 0.7 } as const;
/** The pulse at frame f: each chevron's activation 0..1 (0 at rest; exactly 0 outside the sweep). */
export const ctaPulse = (frame: number, j: number) => {
  if (frame < CTA_IN.hold) return 0;
  const u = ((frame - CTA_IN.hold) % CTA_IN.loop) / CTA_IN.loop;
  if (u >= CTA_IN.sweep) return 0;
  const pos = -1 + ((CTA.chevrons + 1) * u) / CTA_IN.sweep; // from one pitch left of the first to one right of the last
  const d = Math.abs(pos - j);
  return d >= 1 ? 0 : Math.pow(Math.cos((Math.PI * d) / 2), 2);
};
/**
 * StoutWatchHere — the end-card call to action: a cream card carrying "Watch here" (TAG type, the
 * name tag's family) and one row of amber chevrons under it, side by side, pointing down (the one
 * glowing thing). Centred on the frame's axis; transparent around it. `frame` (from the card's
 * first frame) drives the entrance and then the loop (CTA_IN); `loop={false}` holds the rest.
 */
export const StoutWatchHere: React.FC<{ text?: string; frame?: number; loop?: boolean }> = ({ text = "Watch here", frame = CTA_IN.hold, loop = true }) => {
  const w = Math.ceil((tagWidth(text) + 2 * SPACE.INSET_X) / 8) * 8;
  const h = TAG_BOX.nameH;
  const x = Math.round(540 - w / 2);
  const y = CTA.cardY;
  const p = (a: number, d: number) => easeOutCubic(clamp01((frame - a) / d));
  const travel = (q: number) => (q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0);
  const sCard = p(CTA_IN.card, CTA_IN.strip);
  const tText = p(CTA_IN.text, CTA_IN.textF);
  const rowY = y + h + CTA.rowGap + CTA.chevH / 2;
  const chev = Array.from({ length: CTA.chevrons }, (_, j) => {
    const o = p(CTA_IN.chev + j * CTA_IN.chevStep, CTA_IN.chevF);
    const a = loop ? ctaPulse(frame, j) : 0;
    return {
      cx: 540 + (j - (CTA.chevrons - 1) / 2) * CTA.chevPitch,
      cy: rowY - (1 - o) * 24 + a * CTA_IN.dip, // drops in from above; dips with the pulse
      o,
      lift: travel(o),
      color: mixHex(COLOR.amberTop, COLOR.amberHot, a * CTA_IN.brighten),
    };
  });
  const lift = travel(sCard);
  const E = ELEVATION.lifted;
  const F = ELEVATION.float;
  return (
    <AbsoluteFill>
      <OverlayCards lift={lift} cards={[{ x, y: y + (1 - sCard) * 64, w, h, fill: "cream", o: sCard }]}>
        <OverlayText x={540} y={y + h / 2 + (TYPE.TAG * METRIC.cap) / 2 + (1 - tText) * 24} text={text} kind="tag" anchor="middle" o={tText} />
      </OverlayCards>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {/* each chevron's shadow (lifted; a level higher while it drops in), then the amber with its bloom */}
        <g stroke={COLOR.shadow} strokeWidth={CTA.chevStroke} fill="none" strokeLinecap="square" strokeLinejoin="miter">
          {chev.map((c, j) =>
            c.o <= 0.001
              ? null
              : [
                  { l: E.amb, m: F.amb },
                  { l: E.key, m: F.key },
                ].map(({ l, m }, i) => {
                  const dx = lerp(l.dx, m.dx, c.lift) * OVERLAY_K;
                  const dy = lerp(l.dy, m.dy, c.lift) * OVERLAY_K;
                  const bl = lerp(l.blur, m.blur, c.lift) * OVERLAY_K;
                  return (
                    <g key={`${j}-${i}`} opacity={lerp(l.a, m.a, c.lift) * c.o} transform={`translate(${fx(dx)} ${fx(dy)})`} style={{ filter: `blur(${f2(bl)}px)` }}>
                      <path d={chevronPath(c.cx, c.cy, CTA.chevW, CTA.chevH)} />
                    </g>
                  );
                }),
          )}
        </g>
        <g fill="none" strokeLinecap="square" strokeLinejoin="miter" style={{ filter: bloomFilter(1) }}>
          {chev.map((c, j) =>
            c.o <= 0.001 ? null : (
              <path key={j} d={chevronPath(c.cx, c.cy, CTA.chevW, CTA.chevH)} stroke={c.color} strokeWidth={CTA.chevStroke} opacity={f2(c.o)} />
            ),
          )}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
