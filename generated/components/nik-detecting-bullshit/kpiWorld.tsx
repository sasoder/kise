import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  FONT_LABEL,
  METRIC,
  TRACK,
  bloomFilter,
  clamp01,
  easeOutCubic,
  labelWidth,
  lerp,
  mixHex,
  rectPath,
  snapLen,
} from "../kits/cheeky-pint/stoutShared";
import { GLYPH_STROKE, bustPaths } from "../kits/cheeky-pint/museShared";

// ===========================================================================
// kpiWorld — the world of cut 20 `KpiMetByLuck` (nik-detecting-bullshit, Cheeky Pint S4E06). The same stout
// board family as cuts B / C (wealthWorld.tsx): one wide cream tile, a chunky bar rising out of a slot in its
// top edge, one key light, one shadow per object. Pieces COPIED from wealthWorld's look (never imported: it is
// being revised by another builder): the slot joint, the bar's cream gradient + lit edge + foot occlusion, the
// tile's lit edge and contact shadow, the hot amber edge.
//
//   THE KPI TILE   one cream card, its KPI name (REVENUE in cut 20) in ink Kräftig caps on its face, the slot mid
//                  top edge. Cut 7 (KpisAllMet) stands three in a ROW; its middle tile is cut 20's.
//   THE TARGET     a dashed line across above the tile (inkCreamLo dashes on the ground: ink on the espresso
//                  would vanish) with a small pennant at its right end. Lit, it becomes one solid amber band
//                  (band gradient, fixed bloom, 2 px hot top edge), lit outward from the bar's contact point.
//   THE STACK      the KPI bar = three blocks of one material: BASE (the team's own work, stays cream, three
//                  ink busts), MID (the market: tones to board, ink rising-chart glyph + MARKET), TOP (luck:
//                  tones to board, ink four-leaf clover). Parting = a seam opening to GAP: each neighbour gives
//                  up GAP/2 of its height at the seam, so the stack's top stays exactly on the target line and
//                  the base stays seated in its slot (an exploded view with nothing created or moved off).
// All geometry in WORLD px; the cut's camera maps it at k ~1.72-1.85.
// ===========================================================================

/** REV 2 (the user, Nov 17: "move everything down slightly like we usually do"): both cuts' scenes sit this
 *  many SCREEN px lower (StoutStage dy). The cuts' load-time checks are the composition before the shift;
 *  the tile faces now land in caption band 1, the user's choice. */
export const SHIFT_Y = 190;

/** The k all rest lengths are snapped at (the payoff's framing). */
export const REST_K = 1.8;

// --- geometry (WORLD px) ------------------------------------------------------------------------------
/** The KPI tile: centre x, top edge, width, height (cut 20 at k ~1.7: 646 x 105; cut 7 at k ~0.71: 270 x 44). */
export const TILE = { X: 540, TOP: 1200, W: 380, H: 62 } as const;
export const TILE_X0 = TILE.X - TILE.W / 2;
export const TILE_X1 = TILE.X + TILE.W / 2;
export const FLOOR = TILE.TOP + TILE.H;
/** The bar's width (210-225 screen px in cut 20: chunky). */
export const BAR_W = 128;
/** The met bar's height = the target line's height above the tile top (~490 screen px in cut 20). */
export const STACK_H = snapLen(290, REST_K);
/** The target line's bottom edge (the bar's top touches it). */
export const LINE_Y = TILE.TOP - STACK_H;
/** Shares of the stack, bottom up: the team's base, the market, luck. */
export const SHARE = { base: 0.19, mid: 0.52, top: 0.29 } as const;
/** Seam heights (world y): base|mid, mid|top. */
export const SEAM1 = snapLen(TILE.TOP - SHARE.base * STACK_H, REST_K);
export const SEAM2 = snapLen(TILE.TOP - (SHARE.base + SHARE.mid) * STACK_H, REST_K);
/** A fully open seam's gap (14 screen px at 1.8). */
export const GAP = 8;
/** The target line: half-length either side of x 540, thickness dashed / lit (world). */
export const LINE = { HALF: 160, DASH: 14, SPACE: 8, T_DASH: 3.6, T_LIT: 5.6 } as const;
/** The pennant at the line's right end: pole height, flag w / h (world). */
export const FLAG = { POLE: 38, W: 24, H: 16, T: 3.2 } as const;
export const RADIUS = 4;

// --- the faces' content (WORLD px, final block extents) --------------------------------------------------
const baseTop = SEAM1 + GAP / 2;
const midBot = SEAM1 - GAP / 2;
const midTop = SEAM2 + GAP / 2;
const topBot = SEAM2 - GAP / 2;
export const FACE = {
  BASE_CY: (TILE.TOP + baseTop) / 2,
  MID_CY: (midBot + midTop) / 2,
  TOP_CY: (topBot + LINE_Y) / 2,
  BUST_H: 27,
  BUST_PITCH: 35,
  CHART: 76, // the market glyph's box (its 24-unit grid)
  MARKET_FS: 19,
  MARKET_GAP: 12,
  CLOVER: 60, // the clover's box
  NAME_FS: 44, // the tile's face print (cut 20: ~75 px; cut 7: ~31 px)
} as const;
/** The face of cut 20's tile = the middle tile of cut 7's row. */
export const NAME = "Revenue";
/** Cut 7's row: three tiles at pitch ROW_PITCH (a 40-world gap), the middle one is cut 20's tile. Each
 *  side bar's met height is a share of STACK_H (a little different, so the row is not a copy-paste). */
export const ROW_PITCH = TILE.W + 40;
export const ROW = [
  { x: TILE.X - ROW_PITCH, name: "Users", h: snapLen(0.9 * STACK_H, REST_K) },
  { x: TILE.X, name: NAME, h: STACK_H },
  { x: TILE.X + ROW_PITCH, name: "Retention", h: snapLen(0.95 * STACK_H, REST_K) },
] as const;

// ===========================================================================
// DRAWN PIECES
// ===========================================================================
const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `kw${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** The house entrance for ink on a face: slide up 24 SCREEN px + fade + blur 6 -> 0, ease-out (enter 0..1). */
export const inkEntrance = (enter: number) => {
  const a = easeOutCubic(enter);
  return { lift: (1 - a) * 24, opacity: a, blur: 6 * (1 - a) };
};

/** A rect with each corner's radius chosen (tl, tr, br, bl). */
const rect4 = (x: number, y: number, w: number, h: number, tl: number, tr: number, br: number, bl: number) => {
  const c = (r: number) => Math.max(0, Math.min(r, w / 2, h / 2));
  const [a, b, d, e] = [c(tl), c(tr), c(br), c(bl)];
  return (
    `M${f2(x + a)} ${f2(y)}H${f2(x + w - b)}` +
    (b ? `A${f2(b)} ${f2(b)} 0 0 1 ${f2(x + w)} ${f2(y + b)}` : "") +
    `V${f2(y + h - d)}` +
    (d ? `A${f2(d)} ${f2(d)} 0 0 1 ${f2(x + w - d)} ${f2(y + h)}` : "") +
    `H${f2(x + e)}` +
    (e ? `A${f2(e)} ${f2(e)} 0 0 1 ${f2(x)} ${f2(y + h - e)}` : "") +
    `V${f2(y + a)}` +
    (a ? `A${f2(a)} ${f2(a)} 0 0 1 ${f2(x + a)} ${f2(y)}` : "") +
    "Z"
  );
};

/** One piece of the stack: world y from `top` down to `bot`, its corner radii, its tone (0 cream, 1 board). */
export type Piece = { key: string; top: number; bot: number; rTop: number; rBot: number; dim: number; lift: number; cx?: number; content?: React.ReactNode };
const barX0 = (p: Piece) => (p.cx ?? TILE.X) - BAR_W / 2;
export const piecePath = (p: Piece) => rect4(barX0(p), p.top, BAR_W, p.bot - p.top, p.rTop, p.rTop, p.rBot, p.rBot);

/** The stack's shadows: one per separate piece (a touching group is one piece), drawn under everything. */
export const StackShadows: React.FC<{ pieces: Piece[] }> = ({ pieces }) => (
  <g>
    {pieces.map((p) =>
      p.bot - p.top <= 0.02 ? null : <ElevationShadow key={p.key} silhouette={[{ d: piecePath(p) }]} elevation="rest" lift={p.lift} />,
    )}
  </g>
);

/** A piece's body: the stack's one cream gradient (top of the met bar -> floor) toned toward board by `dim`,
 *  its lit top edge (cream, or the same edge in shadow on board), the foot occlusion if it sits in the slot,
 *  and its face content clipped to it. */
export const PieceBody: React.FC<{ p: Piece; k: number; gradTop: number }> = ({ p, k, gradTop }) => {
  const uid = uidOf(useId());
  const h = p.bot - p.top;
  if (h * k <= 0.05) return null;
  const top = mixHex(COLOR.cream, COLOR.board, clamp01(p.dim));
  const foot = mixHex(COLOR.creamFoot, COLOR.boardFoot, clamp01(p.dim));
  const d = piecePath(p);
  const r = p.rTop;
  const X0 = barX0(p);
  const seated = Math.abs(p.bot - TILE.TOP) < 1e-6;
  const ao = Math.min(h, EDGE.FOOT_AO / k);
  const edgeA = lerp(ALPHA.edge, ALPHA.edgeBoard, clamp01(p.dim));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(gradTop)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={foot} />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <clipPath id={`${uid}k`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#${uid}c)`} />
      <path
        d={`M${f2(X0 + r)} ${f2(p.top + EDGE.CREAM / k / 2)}H${f2(X0 + BAR_W - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={f2(edgeA)}
        strokeWidth={f2(EDGE.CREAM / k)}
      />
      {seated ? <rect x={f2(X0)} y={f2(TILE.TOP - ao)} width={f2(BAR_W)} height={f2(ao)} fill={`url(#${uid}o)`} /> : null}
      {p.content ? <g clipPath={`url(#${uid}k)`}>{p.content}</g> : null}
    </g>
  );
};

/** Ink on a face, entering (slide up + fade + blur, SCREEN px). */
export const FaceInk: React.FC<{ enter: number; k: number; children: React.ReactNode }> = ({ enter, k, children }) => {
  const en = inkEntrance(clamp01(enter));
  if (en.opacity <= 0.002) return null;
  return (
    <g opacity={f2(en.opacity)} transform={`translate(0 ${fx(en.lift / k)})`} style={{ filter: en.blur > 0.05 ? `blur(${f2(en.blur / k)}px)` : undefined }}>
      {children}
    </g>
  );
};

/** Three small ink busts (the team) centred on (cx, cy). */
export const TeamBusts: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g fill={COLOR.inkDark}>
    {[-1, 0, 1].map((i) =>
      bustPaths(cx + i * FACE.BUST_PITCH, cy, FACE.BUST_H, "plain").map((d, j) => <path key={`${i}-${j}`} d={d} />),
    )}
  </g>
);

/** The market glyph (Lucide "chart-line" grammar, re-drawn for a clear rise): an L axis corner and a rising
 *  zig-zag, stroked at the house glyph weight, in a `size` box centred on (cx, cy). */
const CHART_ELS = ["M3 3v16a2 2 0 0 0 2 2h16", "M7 15.6l3.6-4.4 3.4 2.9L20 6.4"];
export const MarketGlyph: React.FC<{ cx: number; cy: number; size: number }> = ({ cx, cy, size }) => {
  const sc = (size * 0.68) / 20;
  const sw = (GLYPH_STROKE * size) / 96 / sc;
  return (
    <g
      transform={`translate(${fx(cx - 12 * sc)} ${fx(cy - 12 * sc)}) scale(${fx(sc)})`}
      fill="none"
      stroke={COLOR.inkDark}
      strokeWidth={f2(sw)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {CHART_ELS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
};

/** One heart-shaped clover leaf, tip at the origin, pointing up the -y axis, `L` long (unit coords). */
const LEAF = (L: number, W: number) =>
  `M0 0C${f2(-0.12 * W)} ${f2(-0.28 * L)} ${f2(-0.5 * W)} ${f2(-0.42 * L)} ${f2(-0.5 * W)} ${f2(-0.7 * L)}` +
  `C${f2(-0.5 * W)} ${f2(-0.98 * L)} ${f2(-0.12 * W)} ${f2(-1.06 * L)} 0 ${f2(-0.84 * L)}` +
  `C${f2(0.12 * W)} ${f2(-1.06 * L)} ${f2(0.5 * W)} ${f2(-0.98 * L)} ${f2(0.5 * W)} ${f2(-0.7 * L)}` +
  `C${f2(0.5 * W)} ${f2(-0.42 * L)} ${f2(0.12 * W)} ${f2(-0.28 * L)} 0 0Z`;
/** The four-leaf clover: four ink hearts on the diagonals around a centre, a short curved stem down-right,
 *  in a `size` box centred on (cx, cy). */
export const CloverGlyph: React.FC<{ cx: number; cy: number; size: number }> = ({ cx, cy, size }) => {
  const s = size / 24; // 24-unit box
  const leaf = LEAF(9.4, 9.2);
  const ox = 12;
  const oy = 11.2;
  const sw = (GLYPH_STROKE * size) / 96 / s;
  return (
    <g transform={`translate(${fx(cx - 12 * s)} ${fx(cy - 12 * s)}) scale(${fx(s)})`}>
      <path d={`M${ox} ${oy}C${ox + 0.6} ${oy + 5} ${ox + 2.4} ${oy + 9} ${ox + 5.2} ${oy + 11.6}`} fill="none" stroke={COLOR.inkDark} strokeWidth={f2(sw * 0.8)} strokeLinecap="round" />
      {[45, 135, 225, 315].map((a) => (
        <path key={a} d={leaf} transform={`translate(${ox} ${oy}) rotate(${a})`} fill={COLOR.inkDark} />
      ))}
    </g>
  );
};

/** "MARKET" in ink Kräftig caps, centred on cx, baseline y (WORLD px, printed on the face). */
export const FaceWord: React.FC<{ cx: number; y: number; fs: number; text: string }> = ({ cx, y, fs, text }) => (
  <text
    x={f2(cx + (TRACK.label * fs) / 2)}
    y={f2(y)}
    fontFamily={FONT_LABEL}
    fontWeight={500}
    fontSize={f2(fs)}
    letterSpacing={`${TRACK.label}em`}
    textAnchor="middle"
    fill={COLOR.inkDark}
    style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
  >
    {text.toUpperCase()}
  </text>
);
export const faceWordWidth = (text: string, fs: number) => labelWidth(text, fs);

/** The KPI tile: one cream card on its shadow + contact, "KPI" in ink on its face, the lit top edge broken at
 *  the slot, the slot's joint line (the bar is in it from f0). */
export const KpiTile: React.FC<{ k: number; cx?: number; name?: string; namePx?: number }> = ({ k, cx = TILE.X, name = NAME, namePx }) => {
  const X0 = cx - TILE.W / 2;
  const X1 = cx + TILE.W / 2;
  const uid = uidOf(useId());
  const r = RADIUS;
  const lipW = BAR_W + (2 * EDGE.SLOT_LIP) / k;
  const y = TILE.TOP + EDGE.CREAM / k / 2;
  const hJoint = EDGE.SLOT / k;
  // the print is world-sized (FACE.NAME_FS); `namePx` counter-scales it to that many SCREEN px instead
  const fs = namePx !== undefined ? namePx / k : FACE.NAME_FS;
  const cy = TILE.TOP + TILE.H / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(TILE.TOP)} x2="0" y2={f2(FLOOR)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d: rectPath(X0, TILE.TOP, TILE.W, TILE.H, r) }]} elevation="rest" contact={{ x: cx, y: FLOOR, w: (TILE.W + 16) / 1.16 }} />
      <path d={rectPath(X0, TILE.TOP, TILE.W, TILE.H, r)} fill={`url(#${uid}c)`} />
      <FaceWord cx={cx} y={cy + (METRIC.cap * fs) / 2} fs={fs} text={name} />
      <path
        d={`M${f2(X0 + r)} ${f2(y)}H${f2(cx - lipW / 2)}M${f2(cx + lipW / 2)} ${f2(y)}H${f2(X1 - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={ALPHA.edge}
        strokeWidth={f2(EDGE.CREAM / k)}
      />
      <rect x={f2(cx - lipW / 2)} y={f2(TILE.TOP - hJoint / 2)} width={f2(lipW)} height={f2(hJoint)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
    </g>
  );
};

/** The target line. `lit` = the half-width (world) of the solid amber band, lit outward from x 540;
 *  outside it the dashes stay. `flagTone` 0 = inkCreamLo, 1 = inkCream. `band` = the frame's amber band. */
export const TargetLine: React.FC<{ k: number; lit: number; band: [number, number]; flagTone: number; cx?: number; y?: number }> = ({ k, lit, band, flagTone, cx = TILE.X, y = LINE_Y }) => {
  const uid = uidOf(useId());
  const x0 = cx - LINE.HALF;
  const x1 = cx + LINE.HALF;
  const yb = y; // the bottom edge of both (the bar's top touches it)
  const w = clamp01(lit / LINE.HALF) * LINE.HALF;
  // dashes, symmetric about x 540 (a dash centred on the middle), only outside the lit band
  const dashes: string[] = [];
  const pitch = LINE.DASH + LINE.SPACE;
  const n = Math.ceil(LINE.HALF / pitch) + 1;
  for (let i = -n; i <= n; i++) {
    let a = cx + i * pitch - LINE.DASH / 2;
    let b = a + LINE.DASH;
    a = Math.max(a, x0);
    b = Math.min(b, x1);
    if (b - a <= 0.2) continue;
    // cut out the lit span
    const segs: [number, number][] = [];
    if (a < cx - w) segs.push([a, Math.min(b, cx - w)]);
    if (b > cx + w) segs.push([Math.max(a, cx + w), b]);
    for (const [p, q] of segs) if (q - p > 0.2) dashes.push(rectPath(p, yb - LINE.T_DASH, q - p, LINE.T_DASH, LINE.T_DASH / 2));
  }
  const fc = mixHex(COLOR.inkCreamLo, COLOR.inkCream, clamp01(flagTone));
  const poleX = x1 + 6;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(band[0])} x2="0" y2={f2(band[1])}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
      </defs>
      <g fill={COLOR.inkCreamLo}>
        {dashes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {/* the pennant: a pole standing on the line's right end, a small flag pointing right */}
      <g fill={fc}>
        <path d={rectPath(poleX - FLAG.T / 2, yb - FLAG.POLE, FLAG.T, FLAG.POLE, FLAG.T / 2)} />
        <path d={`M${f2(poleX)} ${f2(yb - FLAG.POLE)}L${f2(poleX + FLAG.W)} ${f2(yb - FLAG.POLE + FLAG.H / 2)}L${f2(poleX)} ${f2(yb - FLAG.POLE + FLAG.H)}Z`} strokeLinejoin="round" stroke={fc} strokeWidth={1.4} />
      </g>
      {w > 0.05 ? (
        <g>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={rectPath(cx - w, yb - LINE.T_LIT, 2 * w, LINE.T_LIT, LINE.T_LIT / 2)} fill={`url(#${uid}a)`} />
          </g>
          <path
            d={`M${f2(cx - w + LINE.T_LIT / 2)} ${f2(yb - LINE.T_LIT + EDGE.HOT / k / 2)}H${f2(cx + w - LINE.T_LIT / 2)}`}
            stroke={COLOR.amberHot}
            strokeWidth={f2(EDGE.HOT / k)}
            strokeLinecap="round"
          />
        </g>
      ) : null}
    </g>
  );
};

// --- load-time checks --------------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`kpiWorld: ${m}`);
  };
  if (BAR_W * REST_K < 180) fail("the bar is not chunky");
  if (baseTop - TILE.TOP >= 0 || midTop >= midBot || LINE_Y >= topBot) fail("a block has no face");
  if (FACE.BUST_PITCH * 2 + FACE.BUST_H > BAR_W - 16) fail("the busts crowd the base's face");
  if (TILE.X + LINE.HALF + 6 + FLAG.W > TILE_X1 + 40) fail("the pennant runs far past the tile");
  if (labelWidth("MARKET", FACE.MARKET_FS) > BAR_W - 16) fail("MARKET runs off its face");
  for (const t of ROW) if (labelWidth(t.name, FACE.NAME_FS) > TILE.W - 48) fail(`${t.name} runs off its tile`);
  if (ROW_PITCH - 2 * (LINE.HALF + 6 + FLAG.W) < 24) fail("a pennant crowds the next tile's line");
}
