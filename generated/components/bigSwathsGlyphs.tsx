import React from "react";
import { DASH, DASH_GAP, INK, INK_HI, INK_W, MARCH_W, PAPER, mixHex, smoothstep, sz } from "./chinatalkShared";
import { BODY_HALF, CHEST_Y, FIG_H } from "./bigSwathsGeom";

// ---------------------------------------------------------------------------
// bigSwathsGlyphs -- the three drawings of BigSwathsNoJob, one icon family:
// the graduate (bust + mortarboard), the briefcase (dashed = expected, solid =
// got it) and the parcel (the isometric package pictogram). Solid poster shapes,
// no outlines. They are OBJECTS of a fixed world size (a figure is 150 x 181
// world px), so their inner proportions do not follow the kit's size law; every
// size the kit does not have is derived from a kit token here:
//   DETAIL_W  = 2 x INK_W (7): the set's line weight in the briefcase's design
//               units. The chest emblems are drawn 1.3x (EMBLEM_K), so on the
//               body the handle is 9.1 world px and the knocked-out lines
//               (clasp, the box's inner edges, its tape) are LINE_W = 7.8.
//   dashes    = the kit's DASH : DASH_GAP (16 : 12), the period rounded so
//               eight whole dashes fit the case outline with no seam where the
//               marching pattern meets itself (1.17 x the kit's sz(1) period in
//               world px on the 94 px case). They march at the kit's MARCH_W.
//   GHOST_W   = 1.5 x INK_W x EMBLEM_K (6.8): the dashed outline's stroke.
//   KEYLINE_W = INK_W x sz(1), rounded (4): the paper keyline under the cap.
//   the tile  = the emblem + 14 px at the sides, as tall as fits inside the
//               bust (122 x 86, corners 22 = half the shoulder radius): what a
//               travelling briefcase or parcel rides on, in the colour it
//               brings; seated, the colour spreads out from it (TileSpread).
// Ink fills are the kit's INK at its two rungs, pre-mixed over PAPER (opaque),
// so a cap over a head never doubles up.
// ---------------------------------------------------------------------------

export const DETAIL_W = 2 * INK_W;
/** the chest emblems (briefcase, its dashed outline) are drawn at this scale of their design units */
export const EMBLEM_K = 1.3;
/** the knocked-out detail lines on the body, world px (the briefcase's clasp line at EMBLEM_K) */
export const LINE_W = (DETAIL_W - 1) * EMBLEM_K;
/** the dashed outline's stroke, design units */
const GHOST_W = 1.5 * INK_W;
/** the kit's dash pattern is scaled by this (design units) to sit on the case */
const GHOST_SCALE = 0.9;
/** the paper keyline between the cap and the head */
const KEYLINE_W = Math.round(INK_W * sz(1));
/** the kit's INK at an absolute rung, as an opaque colour over the paper */
export const inkAt = (rung: number) => mixHex(PAPER, INK, rung);
export const CAP_FILL = inkAt(INK_HI);

// --- the graduate ---------------------------------------------------------------
export const HEAD_R = 30;
export const HEAD_CY = 54;
export const BODY_TOP = 91;
const SH_R = 44;
const FOOT_R = 12;
/** where the visible face begins (the cap band's lower edge) */
export const FACE_TOP = 46;
const HEAD_D = `M${-HEAD_R} ${HEAD_CY}a${HEAD_R} ${HEAD_R} 0 1 0 ${2 * HEAD_R} 0a${HEAD_R} ${HEAD_R} 0 1 0 ${-2 * HEAD_R} 0Z`;
const BUST_D =
  `M${-BODY_HALF} ${FIG_H - FOOT_R}V${BODY_TOP + SH_R}a${SH_R} ${SH_R} 0 0 1 ${SH_R} ${-SH_R}H${BODY_HALF - SH_R}` +
  `a${SH_R} ${SH_R} 0 0 1 ${SH_R} ${SH_R}V${FIG_H - FOOT_R}a${FOOT_R} ${FOOT_R} 0 0 1 ${-FOOT_R} ${FOOT_R}` +
  `H${-BODY_HALF + FOOT_R}a${FOOT_R} ${FOOT_R} 0 0 1 ${-FOOT_R} ${-FOOT_R}Z`;
/** The graduate's body: round head + one rounded shoulders / chest shape.
 *  `headDy` sinks the head into the shoulders (the slump). */
export const Body: React.FC<{ fill: string; headDy?: number }> = ({ fill, headDy = 0 }) => (
  <g fill={fill}>
    <path d={HEAD_D} transform={headDy ? `translate(0 ${headDy.toFixed(3)})` : undefined} />
    <path d={BUST_D} />
  </g>
);

const BOARD_HALF = 62;
const BOARD_CY = 19;
const BOARD_HALF_H = 17;
const BOARD_D = `M${-BOARD_HALF} ${BOARD_CY}L0 ${BOARD_CY - BOARD_HALF_H}L${BOARD_HALF} ${BOARD_CY}L0 ${BOARD_CY + BOARD_HALF_H}Z`;
const BAND_D = `M-31 26H31L29.5 ${FACE_TOP - 1.5}H-29.5Z`;
/** the tassel hangs from the board's right-hand edge, clear of the head */
const TASSEL_X = 47;
const TASSEL_Y = 23;
const TASSEL_LEN = 36;
/** The mortarboard: flat diamond board, short band, a tassel hanging to one
 *  side (swaying `deg` about its knot). INK 0.90 on every figure, all cut; a
 *  paper keyline along the band's underside keeps cap and head two shapes. */
export const Cap: React.FC<{ deg?: number }> = ({ deg = 0 }) => (
  <g fill={CAP_FILL} stroke={CAP_FILL} strokeLinejoin="round" strokeLinecap="round">
    <rect x={-HEAD_R - 2} y={FACE_TOP - 2} width={2 * HEAD_R + 4} height={KEYLINE_W + 2} fill={PAPER} stroke="none" />
    <path d={BAND_D} strokeWidth={3} />
    <path d={BOARD_D} strokeWidth={3} />
    <g transform={`rotate(${deg.toFixed(3)} ${TASSEL_X} ${TASSEL_Y})`}>
      <path d={`M${TASSEL_X} ${TASSEL_Y}V${TASSEL_Y + TASSEL_LEN}`} fill="none" strokeWidth={DETAIL_W - 1} />
      <rect x={TASSEL_X - 6.5} y={TASSEL_Y + TASSEL_LEN - 4} width={13} height={21} rx={3} stroke="none" />
    </g>
  </g>
);

// --- the briefcase (local origin = the chest centre; design units, drawn at EMBLEM_K) ---
const CASE_HALF = 36;
const CASE_TOP = -13;
const CASE_BOT = 28;
const CASE_R = 7;
/** the handle's centre line: half-width, rise above the case top, corner radius */
const HANDLE_HALF = 13;
const HANDLE_RISE = 12;
const HANDLE_R = 6;
const HANDLE_D =
  `M${-HANDLE_HALF} ${CASE_TOP + 1}V${CASE_TOP - HANDLE_RISE + HANDLE_R}a${HANDLE_R} ${HANDLE_R} 0 0 1 ${HANDLE_R} ${-HANDLE_R}` +
  `H${HANDLE_HALF - HANDLE_R}a${HANDLE_R} ${HANDLE_R} 0 0 1 ${HANDLE_R} ${HANDLE_R}V${CASE_TOP + 1}`;
/** the dashed outline's handle: the same arch, standing clear of the case's top dashes */
const GHOST_HANDLE_D =
  `M${-HANDLE_HALF} ${CASE_TOP - 8}V${CASE_TOP - HANDLE_RISE - 1 + HANDLE_R}a${HANDLE_R} ${HANDLE_R} 0 0 1 ${HANDLE_R} ${-HANDLE_R}` +
  `H${HANDLE_HALF - HANDLE_R}a${HANDLE_R} ${HANDLE_R} 0 0 1 ${HANDLE_R} ${HANDLE_R}V${CASE_TOP - 8}`;
/** the case body alone, from the middle of its top edge clockwise: the dashed outline */
const CASE_BODY_D =
  `M0 ${CASE_TOP}H${CASE_HALF - CASE_R}a${CASE_R} ${CASE_R} 0 0 1 ${CASE_R} ${CASE_R}V${CASE_BOT - CASE_R}` +
  `a${CASE_R} ${CASE_R} 0 0 1 ${-CASE_R} ${CASE_R}H${-CASE_HALF + CASE_R}a${CASE_R} ${CASE_R} 0 0 1 ${-CASE_R} ${-CASE_R}` +
  `V${CASE_TOP + CASE_R}a${CASE_R} ${CASE_R} 0 0 1 ${CASE_R} ${-CASE_R}Z`;
const CASE_PERIM = 2 * (2 * CASE_HALF + (CASE_BOT - CASE_TOP)) - 8 * CASE_R + 2 * Math.PI * CASE_R;
/** whole dashes round the outline: the kit's 16 : 12 pattern at GHOST_SCALE of its sz(1) size */
const DASH_N = Math.round(CASE_PERIM / ((DASH + DASH_GAP) * sz(1) * GHOST_SCALE));
const DASH_PERIOD = CASE_PERIM / DASH_N;
/** round caps add GHOST_W to a dash, so the drawn dash is that much shorter */
const DASH_ON = (DASH_PERIOD * DASH) / (DASH + DASH_GAP) - GHOST_W;
const EMBLEM_T = `scale(${EMBLEM_K})`;

/** The job they expect: the briefcase as a dashed paper-white outline (the case
 *  dashed, marching slowly at MARCH_W world px per frame; the handle one bent
 *  dash). `S` is the master clock. */
export const BriefcaseDashed: React.FC<{ S: number }> = ({ S }) => (
  <g transform={EMBLEM_T} fill="none" stroke={PAPER} strokeWidth={GHOST_W} strokeLinecap="round" strokeLinejoin="round">
    <path
      d={CASE_BODY_D}
      pathLength={CASE_PERIM}
      strokeDasharray={`${DASH_ON.toFixed(3)} ${(DASH_PERIOD - DASH_ON).toFixed(3)}`}
      strokeDashoffset={(DASH_ON / 2 - (MARCH_W * S) / EMBLEM_K).toFixed(3)}
    />
    <path d={GHOST_HANDLE_D} />
  </g>
);

/** The job they got: a solid paper-white briefcase, handle on top, one clasp
 *  line in `detail` (the colour of what it sits on). */
export const Briefcase: React.FC<{ detail: string }> = ({ detail }) => (
  <g transform={EMBLEM_T}>
    <rect x={-CASE_HALF} y={CASE_TOP} width={2 * CASE_HALF} height={CASE_BOT - CASE_TOP} rx={CASE_R} fill={PAPER} />
    <path d={HANDLE_D} fill="none" stroke={PAPER} strokeWidth={DETAIL_W} strokeLinejoin="round" />
    <path d={`M${-CASE_HALF} 4H${CASE_HALF}`} stroke={detail} strokeWidth={DETAIL_W - 1} fill="none" />
    <rect x={-7.5} y={-3.5} width={15} height={15} rx={3.5} fill={detail} />
  </g>
);

// --- the parcel (local origin = the chest centre; world px) -------------------------
/** an isometric cardboard box: half-width, half-height, and the rise of a top edge */
const BOX_W = 41;
const BOX_H = 37;
const BOX_RISE = BOX_H / 2;
const P_T = { x: 0, y: -BOX_H };
const P_R = { x: BOX_W, y: -BOX_H + BOX_RISE };
const P_RB = { x: BOX_W, y: BOX_H - BOX_RISE };
const P_B = { x: 0, y: BOX_H };
const P_LB = { x: -BOX_W, y: BOX_H - BOX_RISE };
const P_L = { x: -BOX_W, y: -BOX_H + BOX_RISE };
/** the near top corner, where the three inner edges meet */
const P_C = { x: 0, y: -BOX_H + 2 * BOX_RISE };
const pt = (p: { x: number; y: number }) => `${p.x} ${p.y}`;
const BOX_D = `M${pt(P_T)}L${pt(P_R)}L${pt(P_RB)}L${pt(P_B)}L${pt(P_LB)}L${pt(P_L)}Z`;
const BOX_Y_D = `M${pt(P_L)}L${pt(P_C)}L${pt(P_R)}M${pt(P_C)}L${pt(P_B)}`;
/** the tape: over the top face (mid far-left edge -> mid near-right edge), then a short way down the front */
const TAPE_A = { x: (P_T.x + P_L.x) / 2, y: (P_T.y + P_L.y) / 2 };
const TAPE_B = { x: (P_C.x + P_R.x) / 2, y: (P_C.y + P_R.y) / 2 };
const TAPE_DROP = 17;
const BOX_TAPE_D = `M${pt(TAPE_A)}L${pt(TAPE_B)}V${TAPE_B.y + TAPE_DROP}`;
/** The job they did get: the package pictogram, an isometric cardboard box
 *  (hexagonal silhouette, three inner edges meeting in a Y, a tape strip over
 *  the top face and a short way down the front). Paper-white faces; the inner
 *  edges and the tape in `detail` (the colour of what it sits on). */
export const Parcel: React.FC<{ detail: string }> = ({ detail }) => (
  <g strokeLinejoin="round">
    <path d={BOX_D} fill={PAPER} stroke={PAPER} strokeWidth={3} />
    <path d={BOX_Y_D} fill="none" stroke={detail} strokeWidth={LINE_W} strokeLinecap="round" />
    <path d={BOX_TAPE_D} fill="none" stroke={detail} strokeWidth={LINE_W} strokeLinecap="butt" />
  </g>
);

// --- the tile a travelling emblem rides on, and the colour spreading from it ---------
export const TILE_HW = CASE_HALF * EMBLEM_K + 14;
/** as tall as fits inside the bust (2 px clear of its top and bottom) */
export const TILE_HH = (FIG_H - BODY_TOP) / 2 - 2;
export const TILE_R = SH_R / 2;
/** The solid rounded tile (local origin = the chest centre). */
export const Tile: React.FC<{ fill: string }> = ({ fill }) => (
  <rect x={-TILE_HW} y={-TILE_HH} width={2 * TILE_HW} height={2 * TILE_HH} rx={TILE_R} fill={fill} />
);
/** the soak's wet edge, world px: a third of the first pass's 40 px fade */
export const SOAK_FEATHER = 13;
/** how far the colour travels from the tile's edge to cover the figure (up the head to the cap) */
const SPREAD_D = CHEST_Y - TILE_HH - FACE_TOP + 4;
const SPREAD_STEPS = 6;
/** A reveal that grows OUT of the seated tile (local figure coords): the tile's
 *  rounded box, offset outward by the distance the colour has soaked, with a
 *  SOAK_FEATHER wet edge. `u` is raw progress 0..1 (linear front, as the red). */
export const TileSpread: React.FC<{ id: string; u: number; children: React.ReactNode }> = ({ id, u, children }) => {
  if (u <= 0) return null;
  if (u >= 1) return <>{children}</>;
  const d = (SPREAD_D + SOAK_FEATHER) * u;
  const rects: React.ReactNode[] = [];
  for (let j = 0; j < SPREAD_STEPS; j++) {
    // j = 0 is the outer rim of the wet edge (faint), the last one the solid inside
    const e = d - (SOAK_FEATHER * j) / (SPREAD_STEPS - 1);
    if (e <= -TILE_HH + 1) continue;
    const v = Math.round(255 * smoothstep((j + 1) / SPREAD_STEPS));
    rects.push(
      <rect
        key={j}
        x={(-TILE_HW - e).toFixed(3)}
        y={(CHEST_Y - TILE_HH - e).toFixed(3)}
        width={(2 * (TILE_HW + e)).toFixed(3)}
        height={(2 * (TILE_HH + e)).toFixed(3)}
        rx={Math.max(0, TILE_R + e).toFixed(3)}
        fill={`rgb(${v},${v},${v})`}
      />,
    );
  }
  const pad = 6;
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-BODY_HALF - pad} y={-pad} width={2 * (BODY_HALF + pad)} height={FIG_H + 2 * pad}>
          {rects}
        </mask>
      </defs>
      <g mask={`url(#${id})`}>{children}</g>
    </g>
  );
};
