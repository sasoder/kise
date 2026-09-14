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
