import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import { clamp, sway } from "./fieldShared";
// The map plate is drawn as a raster LOD pyramid baked once by
// `scripts/bake-multiple-rasters.mjs` (public/multiple/, rects in
// multipleLevels.ts) from the geometry of `scripts/build-multiple-map.mjs`
// (multipleStatic.ts / multipleMapData.ts). Everything that moves or arrives
// (the three names, TERRITORY and x54, the ledger) is light vectors.
import { smoothstep } from "./multipleCamera";
import {
  CAM_TRACK,
  DURATION,
  FEATHER,
  FPS,
  F_WIDE,
  HEIGHT,
  NUM_SIZE,
  PB,
  ROWS_T,
  ROW_LABEL,
  STAMP_F,
  TERR_BASE,
  TERR_SIZE,
  WIDTH,
  X54_BASE,
  X54_SIZE,
  anchorCam,
  iconMid,
  iconTop,
  levelDrawn,
  levelOps,
  numeralBaseV2,
  pullG,
  rowBase,
} from "./multipleCameraV2";
import { ICONS, ICON_H, IconDefs, IconKind, IsoIcon } from "./multipleIcons";
import { LEVELS } from "./multipleLevels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

export { DURATION, FPS, HEIGHT, WIDTH };

// ---------------------------------------------------------------------------
// RussiaAMultipleV2: the same cut as RussiaAMultiple (V1, delivered, untouched)
// with the ledger drawn as ISOTYPE ICON ROWS instead of bars. The user: "can
// we try a version that utilizes icons to show the scale instead of the bars?"
// The map half (opening, pull-back, the equal-area wide, TERRITORY x54, the
// feather), the timings, the data, the colour rule, the type and the caption
// band are V1's; V1's map rasters are reused (asserted per frame below).
//
// Sarah Paine, Russo-Japanese War clip:
//   "Russia was a multiple of these quantifiable measures over Japan, by
//    territory, population, industrial base, resource endowment, size of
//    army, size of navy."
// The user: "We really need to focus on showing the SCALE of the differences."
//
// TIMING. Clip SRT 21.02 s -> 32.34 s (end of "navy"). In-point 21.02 s = f0.
// DURATION = round((32.34 - 21.02) * 24) = round(271.68) = 272 + the 16-frame
// house tail = 288 frames, 24 fps, 1080x1920, opaque.
// Word onsets (frames from f0):
//   Russia 0 · was a 10 · multiple 22 · of 33 · these 43 · quantifiable 53 ·
//   measures 70 · over 82 · Japan 90 · by 100 · territory 114 ·
//   population 140 · industrial 160 · base 174 · resource 186 ·
//   endowment 195 · size 214 · of 223 · army 227 · size 239 · of 246 ·
//   navy 252 · line ends 272.
//
// CONCEPT: "the atlas plate, then the ledger under it". One page, one world,
// two halves: a real map for the one measure that IS geography (territory),
// then an engraved statistical-atlas icon ledger for the other five directly
// below it on the same page, the camera travelling from one to the other.
//
// COLOUR RULE: orange #FFB000 / #D98A0C = JAPAN, everywhere (its islands, its
// name, its icon in every row). Russia is cream #E9DDBF: full for outlines,
// ticks and type, the second opacity (0.42) for its hatch. Nothing else has
// colour. Dwarkesh map style for the plate (sea #1B2226, land #3F3428 + rim
// #6A5838, 4 water-lines, 5 deg graticule, baked mottle, screen grain,
// vignette, IM Fell), InterestRatesGoDownV2 / PriorYearRecessionV2 ink for the
// ledger (cream 2.2 px rules with a dark halo, IM Fell SC words, IM Fell
// roman numerals) on the umber page (LopsidedV2: the page is world space and
// moves with the camera; grain and vignette stay screen space).
//
// THE PROJECTION is north-up Albers EQUAL-AREA conic (parallels 45/65, centre
// meridian 105 E), a deliberate departure from the house Lambert conformal
// conic: the piece compares AREA, so the map must be equal-area or the x54 is
// a lie. On this map the hatched empire has 53.2x the area of orange Japan
// (measured on the 1904 polygons, Natural Earth 10m; see the build script).
//
// THE GESTURES, each with its word:
//   1. "Russia" f0-22: CLOSE on the Sea of Japan (k 4.1): orange Japan (with
//      the Kurils) and cream-hatched Russia (Primorye, the Amur, Sakhalin)
//      both there on f0. RUSSIA slides up 24 px + fades on the Amur, f0 -> f10.
//      The camera is already creeping out on f0.
//   2. "a multiple of these quantifiable measures over Japan" f22-106: ONE
//      long pull-back, a zoom about a moving anchor in the Sea of Japan, so
//      Russia keeps coming in from the west (the Amur, Baikal, the Urals,
//      European Russia, Finland, Poland) while Japan slides to the east edge.
//      RUSSIA rides with it (world-anchored, carried across the map by the
//      zoom) into the empire's middle; JAPAN slides up in orange beside the
//      islands f82 -> 90. The wide lands f106 (k 0.86): the empire across
//      ~82 % of the width as one pale cream mass, Japan still clearly orange,
//      the empire + TERRITORY x54 block centred near y ~680.
//   3. "territory" f114: TERRITORY (44 px) and the headline x54 (72 px) slide
//      up under the plate, landing f114. Nothing else: the equal-area map is the comparison. A 3 % breath
//      creep and a slow drift south, no dead stop.
//   4. f114-160: the glide south down the page from the map onto the ledger;
//      the map stays standing and scrolls up, dimming to ~0.65 as the ledger
//      arrives (f146-178). The map plate has no edge: it feathers into the
//      umber page over 150 px (one page, not a pasted rectangle).
//   5. The ledger, one ICON ROW per spoken measure, POPULATION / INDUSTRIAL
//      BASE / RESOURCE ENDOWMENT / ARMY / NAVY, on ONE GRID: the orange Japan
//      icons form a single column (each centred on the same x), then a gap,
//      then Russia's cream icons running right from one shared start x, then
//      the numeral. Reading down: one Japan in every row against a Russia that
//      runs out further each time. The block is centred on its widest row
//      (resource endowment) inside the 60 px margins; labels (42 px) stay
//      centred on x 540, 12 px above their own icons.
//      ISOTYPE ROUNDING (Neurath): each count is rounded to the nearest HALF
//      icon and the numeral matches the icons exactly; the half icon is cut
//      cleanly at half its silhouette width, the cut closed by a ruled cream
//      edge. The exact ratios stay in the data table below.
//        population 3.10 -> 3 icons x3     industrial base 3.65 -> 3½ x3½
//        resource   4.18 -> 4 icons x4     army 4.97 -> 5 x5    navy 2.05 -> 2 x2
//      Per row: the label slides up 8 f before its word; on the word Japan's
//      icon inks on (24 px slide-up + fade, 8 f); from word + 4 Russia's icons
//      stamp in left -> right, one every 4 f, each an 8 f slide-up + fade
//      (neighbours overlap), a half icon last; the numeral slides in as the
//      last one lands: population 140 -> 160, industrial 160 -> 184, resource
//      186 -> 210, army ("size") 214 -> 242, navy ("size") 239 -> 255. Rows
//      overlap. The camera glides down the column so each new row arrives in
//      the lower-middle band (icon middle y ~1015-1080 on its word) and rises
//      to y ~870-1070 as it fills. No bounce, no scale-pop.
//   6. Resolve f255-288 (k 0.92 -> 0.95): TERRITORY x54 and all five rows,
//      y ~230 -> ~1110 (the block's centre ~y 670), the map's feathered edge
//      at the top; JAPAN fades as it leaves through the top edge.
//
// THE ICONS (multipleIcons.tsx, drawn for this piece, one family: one 100-unit
// cap height, the same outline weight, each a MASS: wash + V1 bars' dense
// 6 px engraved hatch inside one outer outline with a dark halo; orange recipe
// for Japan, cream for Russia; ~95 px tall on screen, ~24 px at 270 wide):
//   man      POPULATION: a c.1900 man front-on, peaked cap, long coat, boots
//   factory  INDUSTRIAL BASE: sawtooth roof, one tall chimney, windows, a door
//   cart     RESOURCE ENDOWMENT: a mine cart heaped with ore on a short rail
//   soldier  ARMY: an infantryman in profile, peaked cap, greatcoat, rifle with
//            fixed bayonet at the shoulder
//   ship     NAVY: a pre-dreadnought (after Knyaz Suvorov): low hull, ram bow,
//            two tall funnels, two pole masts with fighting tops, two turrets
// Nothing else: no legend, no title, no arrows, no counters, no flashes.
//
// THE DATA (c. 1900, the eve of the war). The exact ratios; the icon rows show
// them rounded to the nearest half icon (above), the V1 numerals rounded whole.
//   territory   Russian Empire 22.4 M km2 (1897 census area, incl. Finland,
//               excl. the Bukhara / Khiva protectorates) vs Japan 0.418 M km2
//               (home islands incl. the Kurils 382 k + Taiwan / Pescadores
//               36 k): 53.6 -> x54 (the map itself measures 53.2)
//   population  135.7 M vs 43.8 M: 3.10 -> x3        (Kennedy, Table 12, 1900)
//   industrial  total industrial potential 47.5 vs 13.0 (UK 1900 = 100):
//               3.65 -> x4    (Kennedy, from Bairoch; the brief cites Table 8)
//   resources   coal 16.2 Mt + crude oil ~10.4 Mt vs coal 7.4 Mt + oil
//               ~0.12 Mt; coal-equivalent (oil x1.5) 31.8 vs 7.6: 4.18 -> x4
//               (Mitchell, International Historical Statistics; USGS Mineral
//               Resources 1900). A PROXY: "coal" / "oil" never appear.
//   army        military + naval personnel 1,162,000 vs 234,000: 4.97 -> x5
//               (Kennedy, Table 19, 1900)
//   navy        warship tonnage 383,000 t vs 187,000 t: 2.05 -> x2
//               (Kennedy, Table 20, 1900; checked against theworldwars.net's
//               reproduction of the table)
// ---------------------------------------------------------------------------

export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const SHADE = "#140F0A";
const PAGE_BG = "#3A3025";

const rowSchema = z.object({ label: z.string(), ratio: z.number().positive(), icons: z.number().positive(), numeral: z.string() });
export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backdropSrc: z.string(),
  grainSrc: z.string(),
  mottleSrc: z.string(),
  grainOpacity: z.number(),
  vignette: z.number(),
  labels: z.object({ russia: z.string(), japan: z.string(), territory: z.string(), territoryNumeral: z.string() }),
  rows: z.array(rowSchema).length(5),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  grainOpacity: 0.85,
  vignette: 0.5,
  labels: { russia: "RUSSIA", japan: "JAPAN", territory: "TERRITORY", territoryNumeral: "×54" },
  rows: [
    // ratio = the exact figure (data table); icons = isotype-rounded to the
    // nearest half; the numeral matches the icons
    { label: "POPULATION", ratio: 135.7 / 43.8, icons: 3, numeral: "×3" },
    { label: "INDUSTRIAL BASE", ratio: 47.5 / 13.0, icons: 3.5, numeral: "×3½" },
    { label: "RESOURCE ENDOWMENT", ratio: 31.8 / 7.6, icons: 4, numeral: "×4" },
    { label: "ARMY", ratio: 1162 / 234, icons: 5, numeral: "×5" },
    { label: "NAVY", ratio: 383 / 187, icons: 2, numeral: "×2" },
  ],
});

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
const SLIDE = 24;
const SLIDE_F = 10;
const FADE_F = 8;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const slide = (f: number, f0: number) => ({
  dy: interpolate(f, [f0, f0 + SLIDE_F], [SLIDE, 0], { easing: EASE_LAND, ...clamp }),
  op: interpolate(f, [f0, f0 + FADE_F], [0, 1], clamp),
});
// an icon's stamp: an 8 f slide-up of 24 px + fade, no bounce, no scale
const stamp = (f: number, f0: number) => ({
  dy: interpolate(f, [f0, f0 + STAMP_F], [SLIDE, 0], { easing: EASE_LAND, ...clamp }),
  op: interpolate(f, [f0, f0 + STAMP_F - 1], [0, 1], clamp),
});
export const T = {
  russia: 0, // RUSSIA slides up, full by f10
  japan: 82, // JAPAN slides up, lands f90 ("Japan")
  territory: 104, // TERRITORY + x54 land f114
  dim: [146, 178] as const, // the map steps down a rung as the ledger arrives
};
// ---------------------------------------------------------------------------
// The icon rows (world px == screen px at k 1). ONE LEDGER GRID: the orange
// Japan icons form one column (each centred on JX), then a gap, then Russia's
// cream icons run right from one shared start RX (their silhouettes' left
// edges), as many as the isotype count (the half icon cut cleanly at half its
// silhouette width), then the numeral. Reading down: one Japan in every row
// against a Russia that runs out further each time. The block is centred on
// its widest row inside the 60 px margins; the labels stay centred on x 540.
// ---------------------------------------------------------------------------
const ROW_KIND: IconKind[] = ["man", "factory", "cart", "soldier", "ship"];
const ICON_SPACE = 12; // between neighbouring icons
const JR_GAP = 56; // from the widest Japan icon's right edge to Russia's start
const NUM_GAP = 16;
const HATCH = 6; // the same dense engraved hatch as V1's bars
const SW_ICON = 2.3; // the outer outline
const RU_WASH = 0.15;
const RU_HATCH_OP = 0.6;
const JP_WASH = 0.4;
const JP_HATCH_OP = 0.95;

// RUSSIA: screen size and place at the close, world place and size at the wide.
const RU_S0 = { x: 336, y: 392, size: 46 };
const RU_W = { x: 560, y: 812, size: 70 }; // world, the empire's middle (Siberia)
// JAPAN: world-anchored in the Pacific east of the Ryukyu chain, north-east of
// Taiwan (clear of every island), sized ~30 px at the wide.
const JP_LABEL = { x: 990, y: 1284, size: 34 };

// A numeral "×N" in IM Fell English: the cross is drawn (the font's × sits
// small and high), the figures are type. x is the left edge; returns width.
const CROSS = { half: 0.16, w: 0.075, lift: 0.27, gap: 0.1 };
const DIGIT_W = 0.5; // em, IM Fell English old-style figures (approx.)
const numeralWidth = (text: string, size: number) => size * (2 * CROSS.half + CROSS.gap + DIGIT_W * text.replace("×", "").length);
const Numeral: React.FC<{ text: string; x: number; y: number; size: number; ink: string; opacity: number }> = ({ text, x, y, size, ink, opacity }) => {
  const h = CROSS.half * size;
  const cxm = x + h;
  const cym = y - CROSS.lift * size;
  const d = `M${cxm - h},${cym - h}L${cxm + h},${cym + h}M${cxm + h},${cym - h}L${cxm - h},${cym + h}`;
  return (
    <g opacity={opacity}>
      <path d={d} stroke={SHADE} strokeOpacity={0.5} strokeWidth={CROSS.w * size + 4} strokeLinecap="round" />
      <path d={d} stroke={ink} strokeWidth={CROSS.w * size} strokeLinecap="round" />
      <text
        x={x + 2 * h + CROSS.gap * size}
        y={y}
        fill={ink}
        stroke={SHADE}
        strokeOpacity={0.5}
        strokeWidth={4}
        paintOrder="stroke"
        style={{ fontFamily: fell, fontSize: size }}
      >
        {text.replace("×", "")}
      </text>
    </g>
  );
};

const russiaLabel = (f: number) => {
  const g = pullG(Math.min(f, F_WIDE));
  const a = anchorCam(Math.min(f, F_WIDE));
  const wideA = anchorCam(F_WIDE);
  const s1 = { x: 540 + (RU_W.x - wideA.cx) * wideA.k, y: 960 + (RU_W.y - wideA.cy) * wideA.k };
  const e = smoothstep(g);
  const sx = RU_S0.x + (s1.x - RU_S0.x) * e;
  const sy = RU_S0.y + (s1.y - RU_S0.y) * e;
  const size = RU_S0.size + (RU_W.size * wideA.k - RU_S0.size) * e;
  return { x: a.cx + (sx - 540) / a.k, y: a.cy + (sy - 960) / a.k, size: size / a.k };
};

type RowLayout = { kind: IconKind; pitch: number; jpX: number; ruX: number[]; frac: number; endX: number; numX: number; right: number };
type RowSpec = { icons: number; numeral: string };
// Relative to JX = 0: Japan's icon centred on 0, Russia's silhouettes from RX.
const JP_HALF = Math.max(...ROW_KIND.map((k) => (ICONS[k].x1 - ICONS[k].x0) / 2));
const RX_REL = JP_HALF + JR_GAP;
const rowRel = (i: number, r: RowSpec) => {
  const kind = ROW_KIND[i];
  const I = ICONS[kind];
  const pitch = I.w + ICON_SPACE;
  const n = Math.ceil(r.icons - 1e-9);
  const frac = r.icons - (n - 1);
  const jpX = -(I.x0 + I.x1) / 2; // box left, so the silhouette is centred on 0
  const ruX = Array.from({ length: n }, (_, j) => RX_REL - I.x0 + j * pitch);
  const endX = ruX[n - 1] + I.x0 + frac * (I.x1 - I.x0);
  const numX = endX + NUM_GAP;
  return { kind, pitch, jpX, ruX, frac, endX, numX, right: numX + numeralWidth(r.numeral, NUM_SIZE), left: -(I.x1 - I.x0) / 2 };
};
const blockLayout = (rows: RowSpec[]): RowLayout[] => {
  const rel = rows.map((r, i) => rowRel(i, r));
  const left = Math.min(...rel.map((r) => r.left));
  const right = Math.max(...rel.map((r) => r.right));
  const jx = 540 - (left + right) / 2;
  return rel.map((r) => ({
    kind: r.kind,
    pitch: r.pitch,
    jpX: jx + r.jpX,
    ruX: r.ruX.map((x) => jx + x),
    frac: r.frac,
    endX: jx + r.endX,
    numX: jx + r.numX,
    right: jx + r.right,
  }));
};

// The map plate feathers into the page: a mask in an element's own px, whose
// world y0 sits at -offset (px = (world y + offset) * scale).
const featherMask = (offset: number, scale = 1) =>
  `linear-gradient(to bottom, #000 ${((FEATHER[0] + offset) * scale).toFixed(1)}px, rgba(0,0,0,0.5) ${(((FEATHER[0] + FEATHER[1]) / 2 + offset) * scale).toFixed(1)}px, transparent ${((FEATHER[1] + offset) * scale).toFixed(1)}px)`;

const camFrame = (f: number) => {
  const fi = Math.max(0, Math.min(DURATION, Math.round(f)));
  const c = CAM_TRACK[fi];
  const d = sway(f);
  return { k: c.k, cx: c.cx, cy: c.cy + (0.5 * d.dy) / c.k };
};
const toScreenY = (y: number, f: number) => {
  const c = camFrame(f);
  return 960 + (y - c.cy) * c.k;
};

// Every row inside 60 px screen margins at every k it is seen at after landing.
export const ROW_WIDTHS: number[] = [];
(() => {
  const B = blockLayout(defaultProps.rows);
  B.forEach((L, i) => {
    ROW_WIDTHS.push(L.right - (L.jpX + ICONS[L.kind].x0));
    const xlWorld = Math.min(...B.map((q) => q.jpX + ICONS[q.kind].x0));
    for (let f = ROWS_T[i].jp; f < DURATION; f++) {
      const c = camFrame(f);
      const xl = 540 + (xlWorld - c.cx) * c.k;
      const xr = 540 + (L.right - c.cx) * c.k;
      if (xl < 60 || xr > 1020) throw new Error(`RussiaAMultipleV2: row ${i} outside the 60 px margins at f${f} (${xl.toFixed(0)}..${xr.toFixed(0)})`);
    }
  });
})();
// The map levels are V1's bakes: every view of the plate must lie inside the
// level drawn for it (V2's camera differs from V1's only below the plate).
(() => {
  for (let f = 0; f <= DURATION; f++) {
    const c = CAM_TRACK[f];
    const ops = levelOps(c.k);
    const v = { x0: c.cx - 552 / c.k, x1: c.cx + 552 / c.k, y0: c.cy - 972 / c.k, y1: c.cy + 972 / c.k };
    if (v.y0 >= FEATHER[1]) continue;
    LEVELS.forEach((L, li) => {
      if (!levelDrawn(ops, li)) return;
      if (v.x0 < L.x0 || v.x1 > L.x0 + L.w || v.y0 < L.y0) throw new Error(`RussiaAMultipleV2: view at f${f} leaves map level ${L.name}`);
    });
  }
})();

// Per-frame assertions: nothing that has arrived may sit in the caption band.
const CAPTION_TOP = 1150;
export const MARGINS: Record<string, number> = {};
(() => {
  for (let f = 0; f < DURATION; f++) {
    const lows: [string, number][] = [];
    if (f >= T.territory) lows.push(["x54", toScreenY(X54_BASE + 0.25 * X54_SIZE + slide(f, T.territory + 1).dy, f)]);
    ROWS_T.forEach((t, i) => {
      if (f >= t.label) lows.push([`row${i} label`, toScreenY(rowBase(i) + 8 + slide(f, t.label).dy, f)]);
      if (f >= t.jp) lows.push([`row${i} icons`, toScreenY(iconTop(i) + ICON_H + 1 + stamp(f, t.jp).dy, f)]);
      if (f >= t.land - 6) lows.push([`row${i} numeral`, toScreenY(numeralBaseV2(i) + 0.25 * NUM_SIZE + slide(f, t.land - 6).dy, f)]);
    });
    for (const [n, y] of lows) if (process.env.RAM_REPORT) MARGINS[n] = Math.max(MARGINS[n] ?? -1e9, y);
    for (const [n, y] of lows) if (!process.env.RAM_REPORT && y >= CAPTION_TOP) throw new Error(`RussiaAMultipleV2: ${n} in the caption band at f${f} (${y.toFixed(1)})`);
  }
})();

// ---------------------------------------------------------------------------
const RussiaAMultipleV2: React.FC<Props> = ({
  ink,
  accent,
  backdropSrc,
  grainSrc,
  mottleSrc,
  grainOpacity,
  vignette,
  labels,
  rows,
}) => {
  const frame = useCurrentFrame();
  const cam = camFrame(frame);
  const k = cam.k;
  const tx = 540 - cam.cx * k;
  const ty = 960 - cam.cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const worldCss = `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const view = { x0: cam.cx - 580 / k, x1: cam.cx + 580 / k, y0: cam.cy - 1000 / k, y1: cam.cy + 1000 / k };

  // -- the static plate: the LOD level(s) for this k ---------------------------
  const ops = levelOps(k);
  const levelImgs = LEVELS.map((L, li) => {
    if (!levelDrawn(ops, li)) return null;
    return (
      <Img
        key={L.name}
        src={staticFile(`multiple/lod-${L.name}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.W,
          height: L.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
          opacity: ops[li],
          WebkitMaskImage: featherMask(-L.y0, L.s),
          maskImage: featherMask(-L.y0, L.s),
        }}
      />
    );
  });

  // -- mottle on the plate, world space in octaves (TroopsOutOfAsia) ------------
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((o * 173) % 640) - 320;
    const oy = ((o * 311) % 640) - 320;
    const x0 = Math.floor((view.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((view.y0 - oy) / S) * S + oy;
    for (let y = y0; y < Math.min(view.y1, FEATHER[1]); y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });

  // -- names ------------------------------------------------------------------
  const ru = russiaLabel(frame);
  const ruSl = slide(frame, T.russia);
  const jpSl = slide(frame, T.japan);
  const terrSl = slide(frame, T.territory);
  const x54Sl = slide(frame, T.territory + 1);
  const dimT = smoothstep((frame - T.dim[0]) / (T.dim[1] - T.dim[0]));
  // JAPAN fades as the glide carries it out through the top edge (never cut by it)
  const jpExit = smoothstep((960 + (JP_LABEL.y - cam.cy) * k - 70) / 110);

  const halo = { stroke: SHADE, strokeOpacity: 0.5, paintOrder: "stroke" as const };

  // -- the ledger ----------------------------------------------------------------
  const block = blockLayout(rows);
  const ledger = rows.map((row, i) => {
    const t = ROWS_T[i];
    const L = block[i];
    const yTop = iconTop(i);
    const sl = slide(frame, t.label);
    const numSl = slide(frame, t.land - 6);
    const icon = (key: string, x: number, f0: number, japan: boolean, frac = 1) => {
      const st = stamp(frame, f0);
      if (st.op <= 0) return null;
      return (
        <g key={key} transform={`translate(${x.toFixed(2)} ${(yTop + st.dy).toFixed(2)})`} opacity={st.op}>
          <IsoIcon
            kind={L.kind}
            prefix="ramv2"
            ink={japan ? accent : ink}
            shade={SHADE}
            wash={japan ? JP_WASH : RU_WASH}
            hatchFill={japan ? "url(#ramv2JpHatch)" : "url(#ramv2RuHatch)"}
            sw={SW_ICON}
            frac={frac}
            clipId={`ramv2cut${i}`}
          />
        </g>
      );
    };
    return (
      <g key={`row${i}`}>
        {sl.op > 0 ? (
          <text
            x={540 + (ROW_LABEL * 0.16) / 2}
            y={rowBase(i) + sl.dy}
            opacity={sl.op}
            textAnchor="middle"
            fill={ink}
            {...halo}
            strokeWidth={4}
            style={{ fontFamily: fellSC, fontSize: ROW_LABEL, letterSpacing: ROW_LABEL * 0.16 }}
          >
            {row.label}
          </text>
        ) : null}
        {icon("jp", L.jpX, t.jp, true)}
        {L.ruX.map((x, j) => icon(`ru${j}`, x, t.ru0 + j * 4, false, j === L.ruX.length - 1 ? L.frac : 1))}
        {numSl.op > 0 ? (
          <Numeral text={row.numeral} x={L.numX} y={numeralBaseV2(i) + numSl.dy} size={NUM_SIZE} ink={ink} opacity={numSl.op} />
        ) : null}
      </g>
    );
  });
  void iconMid;

  return (
    <AbsoluteFill style={{ backgroundColor: PAGE_BG }}>
      {/* ---------------- THE PAGE, world space: under the plate ---------------- */}
      <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT, transformOrigin: "0 0", transform: worldCss }}>
        <Img
          src={staticFile(backdropSrc)}
          style={{ position: "absolute", left: -WIDTH * 0.05, top: PB - 250, width: WIDTH * 1.1, height: HEIGHT * 1.12 }}
        />
      </div>

      {/* ---------------- THE MAP PLATE: the baked static layers ---------------- */}
      {levelImgs}
      <div style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT, transformOrigin: "0 0", transform: worldCss }}>
        <div
          style={{
            position: "absolute",
            left: -4000,
            top: -4000,
            width: 9000,
            height: FEATHER[1] + 4000,
            overflow: "hidden",
            opacity: 0.9,
            WebkitMaskImage: featherMask(4000),
            maskImage: featherMask(4000),
          }}
        >
          {tiles.map((t, i) => (
            <Img
              key={`m-${i}`}
              src={staticFile(mottleSrc)}
              style={{ position: "absolute", left: t.x + 4000, top: t.y + 4000, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
            />
          ))}
        </div>
      </div>

      {/* ---------------- THE NAMES ON THE MAP ---------------- */}
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ramv2DimG" gradientUnits="userSpaceOnUse" x1={0} y1={FEATHER[0]} x2={0} y2={FEATHER[1]}>
            <stop offset={0} stopColor="#0A0806" stopOpacity={1} />
            <stop offset={1} stopColor="#0A0806" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={camT}>
          {ruSl.op > 0 ? (
            <text
              x={ru.x + (ru.size * 0.5) / 2}
              y={ru.y + px(ruSl.dy)}
              opacity={ruSl.op}
              textAnchor="middle"
              fill={ink}
              {...halo}
              strokeWidth={ru.size * 0.1}
              style={{ fontFamily: fellSC, fontSize: ru.size, letterSpacing: ru.size * 0.5 }}
            >
              {labels.russia}
            </text>
          ) : null}
          {jpSl.op * jpExit > 0.001 ? (
            <text
              x={JP_LABEL.x + (JP_LABEL.size * 0.2) / 2}
              y={JP_LABEL.y + px(jpSl.dy)}
              opacity={jpSl.op * jpExit}
              textAnchor="middle"
              fill={accent}
              {...halo}
              strokeWidth={JP_LABEL.size * 0.12}
              style={{ fontFamily: fellSC, fontSize: JP_LABEL.size, letterSpacing: JP_LABEL.size * 0.2 }}
            >
              {labels.japan}
            </text>
          ) : null}
          {/* the plate steps down a rung as the ledger arrives */}
          {dimT > 0 ? (
            <rect x={view.x0} y={view.y0} width={view.x1 - view.x0} height={Math.max(0, FEATHER[1] - view.y0)} fill="url(#ramv2DimG)" opacity={0.35 * dimT} />
          ) : null}
        </g>
      </svg>

      {/* ---------------- THE PLATE EDGE, TERRITORY, THE LEDGER ---------------- */}
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: "absolute" }}>
        <defs>
          <IconDefs prefix="ramv2" />
          <pattern id="ramv2RuHatch" patternUnits="userSpaceOnUse" width={HATCH} height={HATCH} patternTransform="rotate(45)">
            <rect x={HATCH / 2 - 1} y={0} width={2} height={HATCH} fill={ink} fillOpacity={RU_HATCH_OP} />
          </pattern>
          <pattern id="ramv2JpHatch" patternUnits="userSpaceOnUse" width={HATCH} height={HATCH} patternTransform="rotate(45)">
            <rect x={HATCH / 2 - 1.2} y={0} width={2.4} height={HATCH} fill={accent} fillOpacity={JP_HATCH_OP} />
          </pattern>
        </defs>
        <g transform={camT}>

          {terrSl.op > 0 ? (
            <text
              x={540 + (TERR_SIZE * 0.16) / 2}
              y={TERR_BASE + terrSl.dy}
              opacity={terrSl.op}
              textAnchor="middle"
              fill={ink}
              {...halo}
              strokeWidth={4}
              style={{ fontFamily: fellSC, fontSize: TERR_SIZE, letterSpacing: TERR_SIZE * 0.16 }}
            >
              {labels.territory}
            </text>
          ) : null}
          {x54Sl.op > 0 ? (
            <Numeral
              text={labels.territoryNumeral}
              x={540 - numeralWidth(labels.territoryNumeral, X54_SIZE) / 2}
              y={X54_BASE + x54Sl.dy}
              size={X54_SIZE}
              ink={ink}
              opacity={x54Sl.op}
            />
          ) : null}

          {ledger}
        </g>
      </svg>

      {/* ---------------- PAPER: grain and vignette, screen space ---------------- */}
      <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: WIDTH, height: HEIGHT, opacity: grainOpacity }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
            3,
          )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default RussiaAMultipleV2;

