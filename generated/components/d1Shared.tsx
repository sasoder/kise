import React from "react";
import { AbsoluteFill } from "remotion";
import {
  ACCENT,
  GridBackground,
  OP_READ,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  iconShadow,
  squirclePath,
} from "./fieldShared";

// ---------------------------------------------------------------------------
// d1Shared — what the three D1 / Dan "year off shorting" cuts share.
//
// The clip is Orange Dwarkesh style (fieldShared.tsx: two-tone amber, solid
// dots, per-icon shadows, damped camera) with ONE swap: the grid backdrop is
// replaced by the Cheeky Pint kraft paper, slightly blurred and dimmed. All
// three cuts import these; none of them restates a value from here.
// ---------------------------------------------------------------------------

// The backdrop. Same GridBackground component (parallax, drift, zoom-scale)
// fed the kraft sheet. Blur matches the grid cuts (13); the dim is the Cheeky
// Pint kraft value (0.68) — kraft is a midtone and 0.45 turns it to mud.
export const KRAFT_SRC = "brown-paper-backdrop.jpg";
export const KRAFT_BLUR = 13;
export const KRAFT_DIM = 0.68;
export const KRAFT_BASE = "#2B2118"; // under the sheet, never seen unless the sheet runs out

export const KraftBackground: React.FC<{
  frame: number;
  cy: number;
  cyRest: number;
  cx?: number;
  cxRest?: number;
  k: number;
  parallax: number;
}> = (p) => (
  <AbsoluteFill style={{ backgroundColor: KRAFT_BASE }}>
    <GridBackground src={KRAFT_SRC} blur={KRAFT_BLUR} dim={KRAFT_DIM} {...p} />
  </AbsoluteFill>
);

// The D1 Capital mark, redrawn to the house rules but unmistakably the logo:
// the real mark is a navy square, a white serif "1" and an orange dot at its
// foot. Here the square is ink, the "1" is KNOCKED OUT (the paper shows
// through it) and the dot is the ripe accent — so the figure/ground of the
// original is kept exactly, and its dot is literally one of our unit dots.
// Geometry was measured off `d1 logo.png` (268 px tile): the "1" occupies
// x 130-224, y 32-224; the dot is centred (92, 176) r 47.
export const D1_TILE = 268; // source units; the mark is drawn in this box and scaled
export const D1_DOT = { cx: 92, cy: 176, r: 47 };
export const D1_ONE_PATH =
  "M 184.0 32.0 L 179.7 35.0 L 174.0 38.0 L 168.3 41.0 L 160.7 44.0 L 151.0 47.0 L 137.0 50.0 L 130.0 53.0 L 130.0 56.0 L 148.0 59.0 L 155.0 62.0 L 157.0 65.0 L 157.0 68.0 L 157.0 71.0 L 157.0 74.0 L 157.0 77.0 L 157.0 80.0 L 157.0 83.0 L 157.0 86.0 L 157.0 89.0 L 157.0 92.0 L 157.0 95.0 L 157.0 98.0 L 157.0 101.0 L 157.0 104.0 L 157.0 107.0 L 157.0 110.0 L 157.0 113.0 L 157.0 116.0 L 157.0 119.0 L 157.0 122.0 L 157.0 125.0 L 157.0 128.0 L 157.0 131.0 L 157.0 134.0 L 157.0 137.0 L 157.0 140.0 L 157.0 143.0 L 157.0 146.0 L 157.0 149.0 L 157.0 152.0 L 157.0 155.0 L 157.0 158.0 L 157.0 161.0 L 157.0 164.0 L 157.0 167.0 L 157.0 170.0 L 157.0 173.0 L 157.0 176.0 L 157.0 179.0 L 157.0 182.0 L 157.0 185.0 L 157.0 188.0 L 157.0 191.0 L 157.0 194.0 L 157.0 197.0 L 157.0 200.0 L 157.0 203.0 L 157.0 206.0 L 157.0 209.0 L 157.0 212.0 L 157.0 215.0 L 157.0 218.0 L 157.0 221.0 L 158.0 223.0 L 223.0 223.0 L 224.0 221.0 L 224.0 218.0 L 208.7 215.0 L 198.0 212.0 L 194.0 209.0 L 191.7 206.0 L 190.7 203.0 L 190.0 200.0 L 190.0 197.0 L 190.0 194.0 L 190.0 191.0 L 190.0 188.0 L 190.0 185.0 L 190.0 182.0 L 190.0 179.0 L 190.0 176.0 L 190.0 173.0 L 190.0 170.0 L 190.0 167.0 L 190.0 164.0 L 190.0 161.0 L 190.0 158.0 L 190.0 155.0 L 190.0 152.0 L 190.0 149.0 L 190.0 146.0 L 190.0 143.0 L 190.0 140.0 L 190.0 137.0 L 190.0 134.0 L 190.0 131.0 L 190.0 128.0 L 190.0 125.0 L 190.0 122.0 L 190.0 119.0 L 190.0 116.0 L 190.0 113.0 L 190.0 110.0 L 190.0 107.0 L 190.0 104.0 L 190.0 101.0 L 190.0 98.0 L 190.0 95.0 L 190.0 92.0 L 190.0 89.0 L 190.0 86.0 L 190.0 83.0 L 190.0 80.0 L 190.0 77.0 L 190.0 74.0 L 190.0 71.0 L 190.0 68.0 L 190.0 65.0 L 190.0 62.0 L 190.0 59.0 L 190.0 56.0 L 190.0 53.0 L 190.0 50.0 L 190.0 47.0 L 190.0 44.0 L 190.0 41.0 L 190.0 38.0 L 190.0 35.0 L 190.0 32.0 Z";

export const MARK_SIZE = 108; // world px, the house size for a brand mark

// `k` is the camera zoom, for the per-icon shadow (screen px).
// `opacity` is the tile's ink opacity (OP_READ when it is the subject).
export const D1Mark: React.FC<{
  x: number; // world px, centre of the tile
  y: number;
  size?: number;
  k: number;
  opacity?: number;
  dotColor?: string;
}> = ({ x, y, size = MARK_SIZE, k, opacity = OP_READ, dotColor = ACCENT }) => {
  const s = size / D1_TILE;
  const tile = squirclePath(D1_TILE, D1_TILE, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const id = `d1cut-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`} style={{ filter: iconShadow(k) }}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={D1_TILE} height={D1_TILE}>
          <rect width={D1_TILE} height={D1_TILE} fill="#fff" />
          <path d={D1_ONE_PATH} fill="#000" />
        </mask>
      </defs>
      <path d={tile} fill="#FFFFFF" opacity={opacity} mask={`url(#${id})`} />
      <circle cx={D1_DOT.cx} cy={D1_DOT.cy} r={D1_DOT.r} fill={dotColor} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// COMPANIES. The user (2026-09-14) on the dot-only first set: "too abstract —
// add some icons". A stock is now a COMPANY CARD: the same white tile as the
// D1 mark, with a sector glyph knocked out of it (the paper shows through the
// stroke), so D1 and the things it shorts are one material and D1 is told
// apart by its amber dot. Twelve sectors, so "diverse" is visibly twelve
// different kinds of thing, never twelve copies. Glyphs are Lucide (ISC),
// 24x24, stroke 2, inlined as raw SVG so nothing is fetched at render time.
// ---------------------------------------------------------------------------
export const SECTOR_NAMES = [
  "CAR", "CPU", "PILL", "LANDMARK", "HOUSE", "SMARTPHONE",
  "PLANE", "SHOPPING_CART", "FACTORY", "FUEL", "SHIP", "SATELLITE",
] as const;
export type SectorName = (typeof SECTOR_NAMES)[number];
export const SECTOR_GLYPHS: Record<SectorName, string> = {
  CAR: `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /> <circle cx="7" cy="17" r="2" /> <path d="M9 17h6" /> <circle cx="17" cy="17" r="2" />`,
  CPU: `<path d="M12 20v2" /> <path d="M12 2v2" /> <path d="M17 20v2" /> <path d="M17 2v2" /> <path d="M2 12h2" /> <path d="M2 17h2" /> <path d="M2 7h2" /> <path d="M20 12h2" /> <path d="M20 17h2" /> <path d="M20 7h2" /> <path d="M7 20v2" /> <path d="M7 2v2" /> <rect x="4" y="4" width="16" height="16" rx="2" /> <rect x="8" y="8" width="8" height="8" rx="1" />`,
  PILL: `<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /> <path d="m8.5 8.5 7 7" />`,
  LANDMARK: `<path d="M10 18v-7" /> <path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" /> <path d="M14 18v-7" /> <path d="M18 18v-7" /> <path d="M3 22h18" /> <path d="M6 18v-7" />`,
  HOUSE: `<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />`,
  SMARTPHONE: `<rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" />`,
  PLANE: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />`,
  SHOPPING_CART: `<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18" /> <path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25" /> <circle cx="18" cy="20" r="2" /> <circle cx="8" cy="20" r="2" />`,
  FACTORY: `<path d="M12 16h.01" /> <path d="M16 16h.01" /> <path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" /> <path d="M8 16h.01" />`,
  FUEL: `<path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5" /> <path d="M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16" /> <path d="M2 21h13" /> <path d="M3 9h11" />`,
  SHIP: `<path d="M12 2v2" /> <path d="M12 9.189V13" /> <path d="M19 12V6a2 2 0 00-2-2H7a2 2 0 00-2 2v6" /> <path d="M19.38 19A11.6 11.6 0 0021 13l-8.188-3.639a2 2 0 00-1.624 0L3 13.001a11.6 11.6 0 002.81 7.76" /> <path d="M2 20c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1s1.2 1 2.5 1c2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />`,
  SATELLITE: `<path d="m13.5 6.5-3.148-3.148a1.205 1.205 0 0 0-1.704 0L6.352 5.648a1.205 1.205 0 0 0 0 1.704L9.5 10.5" /> <path d="M16.5 7.5 19 5" /> <path d="m17.5 10.5 3.148 3.148a1.205 1.205 0 0 1 0 1.704l-2.296 2.296a1.205 1.205 0 0 1-1.704 0L13.5 14.5" /> <path d="M9 21a6 6 0 0 0-6-6" /> <path d="M9.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l4.296-4.296a1.205 1.205 0 0 0 0-1.704l-2.296-2.296a1.205 1.205 0 0 0-1.704 0z" />`,
};

export const CARD_SIZE = 72; // world px; a company is two thirds of the D1 mark
export const CARD_GLYPH_FRACTION = 0.6; // the 24-unit glyph box fills this much of the tile
// V3 (user, 2026-09-14: "the logo is square while the other stuff is like a
// squircle … not very harmonious"): the tiles were always hard squares; what
// read as soft was Lucide's round caps and thin 2.2 stroke next to the sharp
// filled serif "1". Square caps, mitred joins and a heavier stroke put the
// glyphs in the same family as the numeral.
export const CARD_GLYPH_STROKE = 2.6;
export const CARD_GLYPH_CAP = "square" as const;
export const CARD_GLYPH_JOIN = "miter" as const;

// ---------------------------------------------------------------------------
// THE ONE WORLD (V3). Every cut of the D1 clip is the same scene: eight
// companies STAND ON the ground; shorting one is D1 pulling it UNDER the line
// on a thread; depth is how hard the short is; coins climbing a thread onto
// D1 are the return. All three cuts import these — nothing is restated.
// ---------------------------------------------------------------------------
export const GROUND_Y = 880;
export const GROUND_X0 = 60;
export const GROUND_X1 = 1020;
export const GROUND_W = 5;
export const GROUND_OP = 0.40;

export const MARK_X = 540;
export const MARK_Y = 430;
export const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2; // 484
export const MARK_TOP = MARK_Y - MARK_SIZE / 2; // 376

// Eight companies, so each is its own thing with a 32 px gap, not a strip.
export const SECTOR_SET: SectorName[] = ["CAR", "CPU", "PILL", "SMARTPHONE", "LANDMARK", "HOUSE", "PLANE", "SHOPPING_CART"];
export const N_CARDS = 8;
export const CARD_PITCH = 104; // 72 tile + 32 gap
export const cardX = (i: number) => MARK_X + (i - (N_CARDS - 1) / 2) * CARD_PITCH; // 176 … 904
export const SUBJECT = 3; // the phone: the one company D1 shorts first, x 488

// Depths are the card CENTRE below the ground line. ON the ground = the tile's
// bottom edge on the line.
export const DEPTH_ON = -CARD_SIZE / 2; // -36: standing on the ground
export const DEPTH_SHALLOW = 70; // tile top 34 px clear of the line — visibly under it
export const DEPTH_MEDIUM = 130;
export const DEPTH_DEEP = 260; // tile bottom at 1176
export const cardY = (depth: number) => GROUND_Y + depth;

// Threads leave the mark's bottom edge, spread across it so a fan never pins.
export const THREAD_W = 2.5;
export const THREAD_LIVE = 0.95;
export const THREAD_IDLE = 0.4;
export const ORIGIN_SPREAD = 34;
export const originX = (i: number) => MARK_X + ((i - (N_CARDS - 1) / 2) / ((N_CARDS - 1) / 2)) * ORIGIN_SPREAD;

// The return: coins on top of the mark, 4 wide so the pile is a block, not a tower.
export const COIN_R = 9;
export const RETURN_X = [507, 529, 551, 573];
export const RETURN_ROW0_Y = MARK_TOP - 10; // 366
export const RETURN_ROW_PITCH = 20;
export const returnCoinPos = (i: number) => ({
  x: RETURN_X[i % 4],
  y: RETURN_ROW0_Y - Math.floor(i / 4) * RETURN_ROW_PITCH,
});
export const RETURN_PEAK = 12; // cut 2: three rows before "returns going down"
export const RETURN_AFTER_DROP = 8; // cut 2's resolved pile, cut 3's opening pile
export const RETURN_FINAL = 24; // cut 3: six rows, two past the old peak


// A company card, centred on (x, y). `sector` picks the glyph. `opacity` is the
// tile's ink opacity; `k` the camera zoom for the per-icon shadow. The glyph is
// knocked out via a mask, exactly like the "1" in the D1 mark.
export const CompanyCard: React.FC<{
  x: number;
  y: number;
  sector: SectorName;
  size?: number;
  k: number;
  opacity?: number;
}> = ({ x, y, sector, size = CARD_SIZE, k, opacity = OP_READ }) => {
  const tile = squirclePath(size, size, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const g = size * CARD_GLYPH_FRACTION;
  const s = g / 24;
  const o = (size - g) / 2;
  const id = `card-${sector}-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2})`} style={{ filter: iconShadow(k) }}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
          <rect width={size} height={size} fill="#fff" />
          <g
            transform={`translate(${o} ${o}) scale(${s})`}
            fill="none"
            stroke="#000"
            strokeWidth={CARD_GLYPH_STROKE}
            strokeLinecap={CARD_GLYPH_CAP}
            strokeLinejoin={CARD_GLYPH_JOIN}
            dangerouslySetInnerHTML={{ __html: SECTOR_GLYPHS[sector] }}
          />
        </mask>
      </defs>
      <path d={tile} fill="#FFFFFF" opacity={opacity} mask={`url(#${id})`} />
    </g>
  );
};
