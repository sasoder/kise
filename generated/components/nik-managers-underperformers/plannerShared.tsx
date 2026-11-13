// PLANNER_READY
// ---------------------------------------------------------------------------
// plannerShared — THE OFFICE WALL AND ITS YEAR PLANNER (nik-managers-underperformers, cuts 6 OnceAYear and 23
// AsFastAsPossible). Cheeky Pint picture-book look: a warm caramel office wall (officeTokens OFFICE), one cream
// laminated year planner on it ("PERFORMANCE REVIEWS", twelve month sheets, 3 columns x 4 rows, one row per
// quarter), round amber dot stickers with an ink tick (amber = the performance review), and a picture-book card hand
// (no person attached) that carries a sticker and presses it onto a day. One key light from the upper left; one
// shadow per object; no outlines; nothing black. Builder A owns this file; cut C imports it and never restates a value.
//
// UNITS. World px, y down. The world is laid out so that the resolved wide camera PLANNER_WIDE = { x 540, y 960,
// k 1 } maps world to screen 1:1 (planner x 70-1010, y 190-1060 on screen). A camera is { x, y, k }: the world
// point on the frame's centre (540, 960) and the scale (screen px per world px); world -> screen is
// (540 + (wx - x) k, 960 + (wy - y) k) (camToScreen).
//
// EXPORTS
//   PLANNER, SHEET          the planner's and a month sheet's geometry (world px)
//   MONTHS                  "JAN" .. "DEC" (index 0..11; sheet m sits at column m % 3, row floor(m / 3))
//   sheetRect(m)            { x, y, w, h } of month m's sheet
//   dayCell(m, row, col)    { x, y, w, h, cx, cy } of a day cell (row 0..4, col 0..6) of month m
//   STICKER_CELL            { row 4, col 4 }: the review day, the same cell in every month (last week)
//   QUARTER_ENDS            [2, 5, 8, 11] = MAR, JUN, SEP, DEC (the right-hand column: one vertical line of stickers)
//   DEC                     11
//   stickerCenter(m)        world centre of month m's sticker (its STICKER_CELL): DEC = (880.1, 1000)
//   STICKER_R               the dot sticker's radius (44: 88 px across at PLANNER_WIDE, deliberately oversized)
//   PLANNER_WIDE            the resolved camera of OnceAYear's last frame and AsFastAsPossible's first frame
//   Planner                 the planner object: { k, band, stickers?: { month, press }[] } (shadow, board, header,
//                           sheets, day cells, then the stuck stickers; press < 0 = not drawn, 0 = just touched,
//                           1 = settled)
//   Sticker                 one dot sticker at a world centre: { cx, cy, k, band, lift?, scale?, shadow? }
//   Hand, HandPose, HAND    the card hand: { pose: { tip, angle, lift, carry }, k, band } (draws its own one shadow
//                           and, when `carry`, the sticker on its fingertip)
//   pressAt(f, plan)        the house press move -> { hand: HandPose | null, press } (see PressPlan)
//   WallStage               the frame: { S, cam, children, front?, furniture? } — wall, furniture, children (the
//                           planner), the drifting window-light patch, `front` (the hand), vignette, grain
//   lightPatchAt(S)         the light patch's drift offset (world px) at clock S
//   camToScreen, Cam, P2    helpers
//
// HOW TO PLACE A STICKER AND POSE THE HAND
//   const plan = { target: stickerCenter(5), contact: 30 };          // press JUN's sticker, touching on f30
//   const { hand, press } = pressAt(f, plan);                          // hand null before / after its move
//   <WallStage S={f} cam={cam} front={hand ? <Hand pose={hand} k={cam.k} band={band} /> : null}>
//     <Planner k={cam.k} band={band} stickers={[{ month: 11, press: 1 }, { month: 5, press }]} />
//   </WallStage>
//   with band = amberBandFor(cam) (stoutShared). On the contact frame the carried sticker (drawn by Hand, scale 1)
//   and the stuck one (drawn by Planner) coincide exactly. The hand comes in from `from` (the fingertip's offset from
//   its contact point, world px) with `lift0`, touches on `contact`, presses for `hold` frames, then lifts and leaves
//   along `outDir` by `outDist` over `out` frames. HAND.angle (250 deg) points the finger up and a little left with the forearm
//   running off to the lower right; keep that angle for every press so the hand reads as the same hand.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ALPHA, AmberGradient, COLOR, EDGE, FONT_LABEL, GRAIN, GROUND, TRACK, VIGNETTE, bloomFilter, clamp01, mixHex, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";
import { CLOTH, SKIN } from "../scott-free-wifi/cabinCast";
import { OFFICE } from "./officeTokens";

export type P2 = [number, number];
export type Cam = { x: number; y: number; k: number };
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `pl${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const D2R = Math.PI / 180;
const rot = (p: P2, deg: number): P2 => {
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
};
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const camToScreen = (c: Cam, x: number, y: number): P2 => [540 + (x - c.x) * c.k, 960 + (y - c.y) * c.k];
const LIGHT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT, 0.12);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.14);

// ===========================================================================
// GEOMETRY (world px)
// ===========================================================================
export const PLANNER = {
  x0: 70,
  y0: 190,
  x1: 1010,
  y1: 1060,
  r: 10,
  /** the header band (the title) */
  headerY1: 290,
  headerPx: 44,
  /** sheets: side padding, gap between columns, first row's top, bottom padding, gap between rows */
  padX: 24,
  gapX: 18,
  top: 300,
  padBottom: 24,
  gapY: 16,
} as const;
const SHEET_W = (PLANNER.x1 - PLANNER.x0 - 2 * PLANNER.padX - 2 * PLANNER.gapX) / 3; // 285.333
const SHEET_H = (PLANNER.y1 - PLANNER.padBottom - PLANNER.top - 3 * PLANNER.gapY) / 4; // 172
export const SHEET = {
  w: SHEET_W,
  h: SHEET_H,
  r: 6,
  /** month label: left inset, baseline, size */
  labelX: 16,
  labelBase: 33,
  labelPx: 20,
  /** the 7 x 5 day grid: top, row height, side inset, cell gap */
  gridTop: 46,
  rowH: 20,
  gridPadX: 14,
  cols: 7,
  rows: 5,
  cellGap: 3,
} as const;
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;
export const DEC = 11;
export const QUARTER_ENDS = [2, 5, 8, 11] as const;
export const STICKER_CELL = { row: 4, col: 4 } as const;
export const STICKER_R = 44;

export const sheetRect = (m: number) => {
  const col = m % 3;
  const row = Math.floor(m / 3);
  return { x: PLANNER.x0 + PLANNER.padX + col * (SHEET.w + PLANNER.gapX), y: PLANNER.top + row * (SHEET.h + PLANNER.gapY), w: SHEET.w, h: SHEET.h };
};
export const dayCell = (m: number, row: number, col: number) => {
  const s = sheetRect(m);
  const cw = (SHEET.w - 2 * SHEET.gridPadX) / SHEET.cols;
  const x = s.x + SHEET.gridPadX + col * cw;
  const y = s.y + SHEET.gridTop + row * SHEET.rowH;
  return { x, y, w: cw, h: SHEET.rowH, cx: x + cw / 2, cy: y + SHEET.rowH / 2 };
};
export const stickerCenter = (m: number): P2 => {
  const c = dayCell(m, STICKER_CELL.row, STICKER_CELL.col);
  return [c.cx, c.cy];
};
/** the resolved camera: the whole year, world = screen */
export const PLANNER_WIDE: Cam = { x: 540, y: 960, k: 1 };

// ===========================================================================
// TONES
// ===========================================================================
export const PLAN_COLOR = {
  /** the laminated board (mount): cream card, a touch toward board so the white sheets sit on it */
  mountTop: mixHex(COLOR.cream, COLOR.board, 0.16),
  mountFoot: mixHex(COLOR.creamFoot, COLOR.boardFoot, 0.24),
  /** the printed rule under the header */
  rule: mixHex(COLOR.creamFoot, COLOR.board, 0.55),
  /** a month sheet: the brightest paper */
  sheetTop: mixHex(COLOR.cream, "#FFFFFF", 0.35),
  sheetFoot: COLOR.cream,
  sheetRim: mixHex(COLOR.creamFoot, COLOR.board, 0.4),
  /** a blank day cell (printed, a step darker than the sheet) */
  cell: mixHex(COLOR.cream, COLOR.board, 0.2),
  ink: COLOR.inkDark,
} as const;

// ===========================================================================
// THE STICKER
// ===========================================================================
const tickPath = (cx: number, cy: number, r: number) =>
  `M${f3(cx - 0.4 * r)} ${f3(cy + 0.02 * r)}L${f3(cx - 0.11 * r)} ${f3(cy + 0.3 * r)}L${f3(cx + 0.42 * r)} ${f3(cy - 0.3 * r)}`;
const circlePath = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;
/**
 * Sticker — a round amber dot sticker with an ink tick: the amber band gradient, the kit's fixed bloom, a 2 px hot
 * top edge (screen px), and (unless `shadow` false) its one shadow. `lift` 0 = flat on the paper (rest, contact
 * shadow) .. 1 = lifted; `scale` grows it about its centre (a carried sticker nearer the camera).
 */
export const Sticker: React.FC<{ cx: number; cy: number; k: number; band: [number, number]; lift?: number; scale?: number; shadow?: boolean }> = ({
  cx,
  cy,
  k,
  band,
  lift = 0,
  scale = 1,
  shadow = true,
}) => {
  const uid = uidOf(useId());
  const r = STICKER_R * scale;
  const d = circlePath(cx, cy, r);
  const hot = EDGE.HOT / k;
  // the hot edge: an arc hugging the top inside the rim (from 205 to 335 deg)
  const a0 = 205 * D2R;
  const a1 = 335 * D2R;
  const rr = r - hot / 2;
  const arc = `M${f3(cx + rr * Math.cos(a0))} ${f3(cy + rr * Math.sin(a0))}A${f3(rr)} ${f3(rr)} 0 0 1 ${f3(cx + rr * Math.cos(a1))} ${f3(cy + rr * Math.sin(a1))}`;
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
      </defs>
      {shadow ? <UnionShadow sil={[{ d }]} s={(2 * r) / 96} lift={clamp01(lift)} contact={null} /> : null}
      <path d={d} fill={`url(#${uid}a)`} style={{ filter: bloomFilter(k) }} />
      <path d={arc} stroke={COLOR.amberHot} strokeWidth={f3(hot)} strokeLinecap="round" fill="none" />
      <path d={tickPath(cx, cy, r)} stroke={COLOR.inkDark} strokeWidth={f3(0.17 * r)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  );
};

// ===========================================================================
// THE PLANNER
// ===========================================================================
export type PlannerSticker = { month: number; press: number };
const PLANNER_D = rectPath(PLANNER.x0, PLANNER.y0, PLANNER.x1 - PLANNER.x0, PLANNER.y1 - PLANNER.y0, PLANNER.r);
/**
 * Planner — the whole object: its one shadow on the wall, the laminated board with its lit top edge, the header
 * (PERFORMANCE REVIEWS, Kräftig caps, ink), the twelve blank month sheets with their labels and 7 x 5 day cells, then
 * every sticker in `stickers` whose press >= 0 (stuck on its month's STICKER_CELL).
 */
export const Planner: React.FC<{ k: number; band: [number, number]; stickers?: PlannerSticker[] }> = ({ k, band, stickers = [] }) => {
  const uid = uidOf(useId());
  const cells: React.ReactNode[] = [];
  const sheets: React.ReactNode[] = [];
  for (let m = 0; m < 12; m++) {
    const s = sheetRect(m);
    sheets.push(
      <g key={`s${m}`}>
        <path d={rectPath(s.x - 1.5, s.y - 1.5, s.w + 3, s.h + 3, SHEET.r + 1.5)} fill={PLAN_COLOR.sheetRim} />
        <path d={rectPath(s.x, s.y, s.w, s.h, SHEET.r)} fill={`url(#${uid}sh)`} />
        <text
          x={f3(s.x + SHEET.labelX)}
          y={f3(s.y + SHEET.labelBase)}
          fontFamily={FONT_LABEL}
          fontWeight={500}
          fontSize={SHEET.labelPx}
          letterSpacing={`${TRACK.label}em`}
          fill={PLAN_COLOR.ink}
          style={{ fontFeatureSettings: '"case" 1' }}
        >
          {MONTHS[m]}
        </text>
      </g>,
    );
    for (let row = 0; row < SHEET.rows; row++)
      for (let col = 0; col < SHEET.cols; col++) {
        const c = dayCell(m, row, col);
        const g = SHEET.cellGap / 2;
        cells.push(<path key={`c${m}_${row}_${col}`} d={rectPath(c.x + g, c.y + g, c.w - 2 * g, c.h - 2 * g, 2.5)} fill={PLAN_COLOR.cell} />);
      }
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}m`} gradientUnits="userSpaceOnUse" x1="0" y1={PLANNER.y0} x2="0" y2={PLANNER.y1}>
          <stop offset="0" stopColor={PLAN_COLOR.mountTop} />
          <stop offset="1" stopColor={PLAN_COLOR.mountFoot} />
        </linearGradient>
        <linearGradient id={`${uid}sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PLAN_COLOR.sheetTop} />
          <stop offset="1" stopColor={PLAN_COLOR.sheetFoot} />
        </linearGradient>
      </defs>
      <UnionShadow sil={[{ d: PLANNER_D }]} s={2.4} />
      <path d={PLANNER_D} fill={`url(#${uid}m)`} />
      {/* the lit top edge (screen px) */}
      <rect x={PLANNER.x0 + PLANNER.r} y={PLANNER.y0} width={PLANNER.x1 - PLANNER.x0 - 2 * PLANNER.r} height={f3(EDGE.CREAM / k)} fill={COLOR.edge} opacity={ALPHA.edge} />
      <text
        x={(PLANNER.x0 + PLANNER.x1) / 2 + (TRACK.label * PLANNER.headerPx) / 2}
        y={f3((PLANNER.y0 + PLANNER.headerY1) / 2 + (0.718 * PLANNER.headerPx) / 2)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={PLANNER.headerPx}
        letterSpacing={`${TRACK.label}em`}
        textAnchor="middle"
        fill={PLAN_COLOR.ink}
        style={{ fontFeatureSettings: '"case" 1' }}
      >
        PERFORMANCE REVIEWS
      </text>
      <rect x={PLANNER.x0 + PLANNER.padX} y={PLANNER.headerY1 - 3} width={PLANNER.x1 - PLANNER.x0 - 2 * PLANNER.padX} height={2} fill={PLAN_COLOR.rule} opacity={0.6} />
      {sheets}
      {cells}
      {stickers
        .filter((s) => s.press >= 0)
        .map((s) => {
          const [cx, cy] = stickerCenter(s.month);
          return <Sticker key={`st${s.month}`} cx={cx} cy={cy} k={k} band={band} lift={0.35 * (1 - clamp01(s.press))} />;
        })}
    </g>
  );
};

// ===========================================================================
// THE HAND — a picture-book card hand and forearm (no person attached), seen from its back, the index finger out
// ===========================================================================
// Hand-local px (x HAND.size = world px at lift 0), the finger pointing +x, the fingertip's pad (the point that touches the
// paper) at the origin; the thumb on the -y side, the curled fingers on the +y side, the sleeve running off to -x.
export const HAND = {
  /** the finger's world direction (deg, SVG rotation): 250 = up and a little left, the forearm in from the lower right */
  angle: 250,
  /** hand-local px -> world px: the whole hand, cuff and a length of sleeve read in the close */
  size: 0.62,
  /** the carried sticker's centre ahead of the pad (local px): the fingertip holds its lower-right rim, the tick in view */
  stickOff: 42,
  /** how much bigger a lifted hand reads (nearer the camera): scale = 1 + liftScale * lift */
  liftScale: 0.14,
  skin: mixHex(SKIN.light, SKIN.tan, 0.35),
  sleeve: CLOTH.sage,
} as const;
type Part = { x: number; y: number; w: number; h: number; r: number; c: string; tone?: number };
const handParts = (skin: string, sleeve: string): Part[] => [
  { x: -1800, y: -84, w: 1400, h: 224, r: 44, c: sleeve },
  { x: -452, y: -72, w: 92, h: 200, r: 30, c: mixHex(sleeve, COLOR.shadow, 0.16) }, // the ribbed cuff
  { x: -392, y: -50, w: 80, h: 158, r: 34, c: skin }, // the wrist
  { x: -338, y: -64, w: 222, h: 188, r: 66, c: skin }, // the back of the hand
  { x: -264, y: -78, w: 124, h: 40, r: 20, c: skin, tone: 0.07 }, // the thumb, tucked along the finger
  { x: -176, y: 26, w: 72, h: 40, r: 20, c: skin, tone: 0.04 }, // middle finger, curled
  { x: -186, y: 62, w: 66, h: 38, r: 19, c: skin, tone: 0.07 }, // ring finger
  { x: -198, y: 96, w: 58, h: 34, r: 17, c: skin, tone: 0.1 }, // little finger
  { x: -156, y: -22, w: 178, h: 44, r: 22, c: skin }, // the index finger, out
];
const partD = (p: Part) => rectPath(p.x, p.y, p.w, p.h, p.r);
/** the hand's outline points (local px), for frame checks */
export const HAND_HULL: P2[] = [
  [22, 0], [0, -22], [0, 22], [-140, -78], [-264, -78], [-338, -64], [-338, 124], [-198, 130], [-140, 96], [-104, 46],
  [-400, -84], [-400, 140],
];
export type HandPose = {
  /** the fingertip pad (world px) */
  tip: P2;
  /** the finger's direction (deg) */
  angle: number;
  /** 0 touching the paper .. 1 well off it (negative: pressing in) */
  lift: number;
  /** carrying a sticker on the fingertip */
  carry: boolean;
};
export const handScale = (lift: number) => 1 + HAND.liftScale * lift;
/** where a carried sticker's centre is (world) for a pose */
export const carriedCenter = (p: HandPose): P2 => {
  const o = rot([HAND.stickOff * HAND.size * handScale(p.lift), 0], p.angle);
  return [p.tip[0] + o[0], p.tip[1] + o[1]];
};
/** a pose's shadow offset on the wall (world px): down and right, away from the key light, growing with the lift */
const shadowOf = (lift: number) => {
  const h = Math.max(0, lift);
  const d = 4 + 44 * h;
  return { dx: 0.5 * d, dy: 0.8 * d, blur: 2.5 + 10 * h, a: 0.34 - 0.1 * clamp01(h) };
};
/** a world point of the hand at local point q, for a pose (checks) */
export const handPoint = (p: HandPose, q: P2, withShadow = false): P2 => {
  const s = handScale(p.lift) * HAND.size;
  const v = rot([q[0] * s, q[1] * s], p.angle);
  const sh = withShadow ? shadowOf(p.lift) : { dx: 0, dy: 0 };
  return [p.tip[0] + v[0] + sh.dx, p.tip[1] + v[1] + sh.dy];
};
/**
 * Hand — the card hand at a pose, with its one shadow (hand + forearm + a carried sticker, one silhouette) on the
 * wall below it. Every part is a flat matte fill with a top-lit ramp along WORLD up; no outlines. `k` and `band`
 * light the carried sticker.
 */
export const Hand: React.FC<{ pose: HandPose; k: number; band: [number, number]; skin?: string; sleeve?: string }> = ({
  pose,
  k,
  band,
  skin = HAND.skin,
  sleeve = HAND.sleeve,
}) => {
  const uid = uidOf(useId());
  const s = handScale(pose.lift);
  const parts = handParts(skin, sleeve);
  // world up in hand-local coordinates (for the top-lit ramps)
  const up = rot([0, -1], -pose.angle);
  const tf = `translate(${fx(pose.tip[0])} ${fx(pose.tip[1])}) rotate(${fx(pose.angle)}) scale(${fx(s * HAND.size)})`;
  const sh = shadowOf(pose.lift);
  const stc = carriedCenter(pose);
  const ramp = (i: number, p: Part) => {
    // a top-lit ramp across the part along WORLD up (top -> foot over the part's extent)
    const c = mixHex(p.c, COLOR.shadow, p.tone ?? 0);
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const L = Math.min(260, 0.5 * Math.abs(p.w * up[0]) + 0.5 * Math.abs(p.h * up[1]) + 10);
    return (
      <linearGradient key={i} id={`${uid}g${i}`} gradientUnits="userSpaceOnUse" x1={f3(cx + up[0] * L)} y1={f3(cy + up[1] * L)} x2={f3(cx - up[0] * L)} y2={f3(cy - up[1] * L)}>
        <stop offset="0" stopColor={topOf(c)} />
        <stop offset="1" stopColor={footOf(c)} />
      </linearGradient>
    );
  };
  return (
    <g>
      <defs>{parts.map((p, i) => ramp(i, p))}</defs>
      {/* the one shadow: hand, forearm and a carried sticker as one silhouette */}
      <g fill={COLOR.shadow} opacity={f3(sh.a)} style={{ filter: `blur(${f3(sh.blur)}px)` }}>
        <g transform={`translate(${fx(pose.tip[0] + sh.dx)} ${fx(pose.tip[1] + sh.dy)}) rotate(${fx(pose.angle)}) scale(${fx(HAND.size)})`}>
          {parts.map((p, i) => (
            <path key={i} d={partD(p)} />
          ))}
        </g>
        {pose.carry ? <circle cx={f3(stc[0] - (stc[0] - pose.tip[0]) * (1 - 1 / s) + sh.dx)} cy={f3(stc[1] - (stc[1] - pose.tip[1]) * (1 - 1 / s) + sh.dy)} r={STICKER_R} /> : null}
      </g>
      {/* the carried sticker, under the fingertip */}
      {pose.carry ? <Sticker cx={stc[0]} cy={stc[1]} k={k} band={band} scale={s} shadow={false} /> : null}
      <g transform={tf}>
        {parts.map((p, i) => (
          <path key={i} d={partD(p)} fill={`url(#${uid}g${i})`} />
        ))}
        {/* the nail on the fingertip, a lighter card */}
        <path d={rectPath(-34, -13, 40, 26, 12)} fill={mixHex(skin, LIGHT, 0.4)} />
      </g>
    </g>
  );
};

// ===========================================================================
// THE PRESS — the house move of a hand pressing one sticker onto a day
// ===========================================================================
export type PressPlan = {
  /** the sticker's centre on the paper (stickerCenter(m)) */
  target: P2;
  /** the frame the fingertip and sticker touch the paper */
  contact: number;
  /** frames from the start pose to contact (default 16) */
  approach?: number;
  /** the fingertip's start offset from its contact point (world px; default [90, -20]) and its start lift (1) */
  from?: P2;
  lift0?: number;
  /** frames the finger stays pressed (default 6), then frames to leave (default 16) */
  hold?: number;
  out?: number;
  /** the leaving direction (unit, default down-right along the forearm) and distance (world px, default 420) */
  outDir?: P2;
  outDist?: number;
  angle?: number;
};
/**
 * pressAt — the hand's pose at frame f (null before contact - approach and after the leave) and the sticker's
 * `press` for Planner (-1 while carried; 0 on contact .. 1 when the finger lifts). Approach: the fingertip glides
 * in decelerating (ease-out) while it sinks to the paper, arriving with a little speed; contact; a short press in
 * (lift -0.2) and release over `hold`; then it rises first and pulls away along `outDir`, accelerating.
 */
export const pressAt = (f: number, plan: PressPlan): { hand: HandPose | null; press: number } => {
  const ang = plan.angle ?? HAND.angle;
  const appr = plan.approach ?? 16;
  const hold = plan.hold ?? 6;
  const out = plan.out ?? 16;
  const from = plan.from ?? [90, -20];
  const lift0 = plan.lift0 ?? 1;
  const dir = plan.outDir ?? ([0.5, 0.866] as P2);
  const dist = plan.outDist ?? 420;
  const so = rot([HAND.stickOff * HAND.size, 0], ang);
  const pad: P2 = [plan.target[0] - so[0], plan.target[1] - so[1]];
  const t0 = plan.contact - appr;
  const t2 = plan.contact + hold;
  const t3 = t2 + out;
  if (f < t0 || f > t3) return { hand: null, press: f > t3 ? 1 : -1 };
  if (f < plan.contact) {
    const u = (f - t0) / appr;
    const e = 1 - Math.pow(1 - clamp01(u), 2.4); // lateral: ease-out, landing on contact
    const lift = lift0 * (1 - u) * (1 - 0.6 * u); // sinks, touching with a little speed
    return { hand: { tip: [pad[0] + from[0] * (1 - e), pad[1] + from[1] * (1 - e)], angle: ang + 3 * (1 - e), lift, carry: true }, press: -1 };
  }
  const press = clamp01((f - plan.contact) / hold);
  if (f <= t2) {
    // press in and release: -0.2 at 40 % of the hold, back to 0 at 80 %
    const v = (f - plan.contact) / hold;
    const lift = -0.2 * Math.sin(Math.PI * Math.min(1, v * 1.25));
    return { hand: { tip: pad, angle: ang, lift, carry: false }, press };
  }
  const u = (f - t2) / out;
  const lift = 1.3 * smoothstep(u / 0.55);
  const e = Math.pow(clamp01(u), 1.9);
  return { hand: { tip: [pad[0] + dir[0] * dist * e, pad[1] + dir[1] * dist * e], angle: ang - 4 * smoothstep(u), lift, carry: false }, press: 1 };
};

// ===========================================================================
// THE WALL STAGE
// ===========================================================================
/** the window-light patch's drift (world px) at clock S: slowly to the right and a touch down */
export const lightPatchAt = (S: number): P2 => [0.9 * S, 0.25 * S];
/** the light patch's top-left at clock 0 (world px): on the wall below the planner */
const PATCH = { x: 250, y: 1100 } as const;
const WALL = { x0: -900, x1: 2100, y0: -700, floorY: 1880 } as const;
const FURN = {
  top: mixHex(OFFICE.wallFoot, COLOR.ground, 0.2),
  topLit: mixHex(OFFICE.wallFoot, COLOR.ground, 0.05),
  body: mixHex(OFFICE.wallFoot, COLOR.ground, 0.42),
  seam: mixHex(OFFICE.wallFoot, COLOR.ground, 0.6),
  leaf: mixHex(CLOTH.sage, OFFICE.wallFoot, 0.45),
  leafDark: mixHex(CLOTH.moss, COLOR.ground, 0.3),
  pot: mixHex(CLOTH.terracotta, COLOR.ground, 0.45),
  shade: mixHex(OFFICE.wallTop, COLOR.cream, 0.15),
  stem: mixHex(OFFICE.wallFoot, COLOR.ground, 0.5),
} as const;
/** the quiet office below the planner (world px; only seen in the wide): a sideboard with a lamp (off), a plant */
const Furniture: React.FC = () => (
  <g>
    {/* the plant, left, on the floor */}
    {[
      [-18, 1590, 34, 120, -24],
      [30, 1560, 30, 130, 16],
      [-56, 1640, 28, 96, -48],
      [62, 1630, 28, 100, 44],
      [6, 1520, 26, 120, 2],
    ].map(([dx, cy, rx, ry, a], i) => (
      <ellipse key={i} cx={190 + dx} cy={cy} rx={rx} ry={ry} transform={`rotate(${a} ${190 + dx} ${cy + ry * 0.8})`} fill={i % 2 ? FURN.leafDark : FURN.leaf} />
    ))}
    <path d={`M120 1700L260 1700L244 1880L136 1880Z`} fill={FURN.pot} />
    <rect x={112} y={1694} width={156} height={16} rx={4} fill={mixHex(FURN.pot, LIGHT, 0.12)} />
    {/* the sideboard, right */}
    <rect x={590} y={1562} width={700} height={330} fill={FURN.body} />
    <rect x={580} y={1548} width={720} height={22} rx={4} fill={FURN.top} />
    <rect x={580} y={1548} width={720} height={4} rx={2} fill={FURN.topLit} />
    <rect x={838} y={1586} width={4} height={290} fill={FURN.seam} />
    <rect x={812} y={1660} width={14} height={40} rx={7} fill={FURN.seam} />
    <rect x={854} y={1660} width={14} height={40} rx={7} fill={FURN.seam} />
    {/* the lamp on it (off) */}
    <ellipse cx={960} cy={1546} rx={46} ry={8} fill={FURN.stem} />
    <rect x={954} y={1490} width={12} height={58} fill={FURN.stem} />
    <path d="M908 1494L1012 1494L992 1468L928 1468Z" fill={FURN.shade} />
  </g>
);

/**
 * WallStage — the frame: the caramel office wall (OFFICE wallTop -> wallFoot, lit from the upper left), skirting and
 * floor, the furniture (unless `furniture` false), `children` (the planner) under the camera, the drifting
 * window-light patch, `front` (the hand) under the camera, then the kit's vignette and grain on twos.
 */
export const WallStage: React.FC<{ S: number; cam: Cam; children?: React.ReactNode; front?: React.ReactNode; furniture?: boolean }> = ({
  S,
  cam,
  children,
  front,
  furniture = true,
}) => {
  const uid = uidOf(useId());
  const k = cam.k;
  const tf = `translate(${fx(540 - cam.x * k)} ${fx(960 - cam.y * k)}) scale(${fx(k)})`;
  const [lx, ly] = lightPatchAt(S);
  // the window light on the wall under the planner: two columns x two rows of panes, skewed by the light's slant
  const pane = (x: number, y: number, w: number, h: number) => {
    const sk = 0.42;
    return `M${f3(x)} ${f3(y)}L${f3(x + w)} ${f3(y)}L${f3(x + w + sk * h)} ${f3(y + h)}L${f3(x + sk * h)} ${f3(y + h)}Z`;
  };
  const PW = 230;
  const PH = 190;
  const PG = 22;
  const PX = PATCH.x + lx;
  const PY = PATCH.y + ly;
  const patch = [pane(PX, PY, PW, PH), pane(PX + PW + PG, PY, PW, PH), pane(PX + 0.42 * (PH + PG), PY + PH + PG, PW, PH), pane(PX + PW + PG + 0.42 * (PH + PG), PY + PH + PG, PW, PH)].join("");
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ backgroundColor: OFFICE.wallFoot, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${uid}w`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={WALL.floorY}>
            <stop offset="0" stopColor={OFFICE.wallTop} />
            <stop offset="1" stopColor={OFFICE.wallFoot} />
          </linearGradient>
          <radialGradient id={`${uid}k`} gradientUnits="userSpaceOnUse" cx="80" cy="60" r="1500">
            <stop offset="0" stopColor={LIGHT} stopOpacity="0.16" />
            <stop offset="0.6" stopColor={LIGHT} stopOpacity="0.04" />
            <stop offset="1" stopColor={LIGHT} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={tf}>
          <rect x={WALL.x0} y={WALL.y0} width={WALL.x1 - WALL.x0} height={WALL.floorY - WALL.y0} fill={`url(#${uid}w)`} />
          <rect x={WALL.x0} y={WALL.y0} width={WALL.x1 - WALL.x0} height={WALL.floorY - WALL.y0} fill={`url(#${uid}k)`} />
          <rect x={WALL.x0} y={WALL.floorY - 44} width={WALL.x1 - WALL.x0} height={44} fill={OFFICE.skirting} />
          <rect x={WALL.x0} y={WALL.floorY - 44} width={WALL.x1 - WALL.x0} height={3} fill={mixHex(OFFICE.skirting, LIGHT, 0.25)} />
          <rect x={WALL.x0} y={WALL.floorY} width={WALL.x1 - WALL.x0} height={900} fill={OFFICE.floor} />
          {furniture ? <Furniture /> : null}
          {children}
          <g style={{ mixBlendMode: "screen" }} opacity={OFFICE.lightPatchOpacity}>
            <path d={patch} fill={OFFICE.lightPatch} style={{ filter: "blur(22px)" }} />
          </g>
          {front}
        </g>
      </svg>
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
