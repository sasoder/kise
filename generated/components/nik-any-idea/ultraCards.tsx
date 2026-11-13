import React, { useId } from "react";
import { COLOR, EDGE, ElevationShadow, FONT_LABEL, LightSweep, TRACK, bloomFilter, mixHex, type Elevation, type Silhouette } from "../kits/cheeky-pint/stoutShared";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "../nik-trend-friend/revolutMark";

// ---------------------------------------------------------------------------
// ultraCards — the PLAN CARDS of the nik-any-idea clip (owned by cut 21_UltraOnTop; cut 30_UltraBenefits
// imports UltraCard). Revolut's personal plans, bottom to top: Standard, Plus, Premium, Metal, Ultra.
// Each is drawn as a real bank card in the stout material (styles/cheeky-pint.md): ISO card proportions
// 85.6 x 54 mm with the real 3.18 mm corner, the Revolut "R" stamp top left (revolutMark.ts, ink one-colour),
// a chip and a contactless mark on the left, the plan's name bottom left in Söhne Kräftig caps (+0.06 em).
//
// TONES step up the ladder: Standard board -> Plus board/cream -> Premium cream -> Metal a darker brushed brown
// (cream ink, still brown, never black) -> Ultra PLATINUM (a pale cool-silver cream, brushed, with a soft sheen)
// and, on Ultra only, the clip's AMBER: an edge glow (amber rim + the kit's bloom) = the idea that worked.
//
// UNITS. World px (draw inside StoutStage under the camera). (x, y) is the card's CENTRE, `w` its world width
// (default CARD.W = 320; height = w x 54 / 85.6). `k` is the current camera scale (screen-px hairlines, bloom).
// TILT. `tilt` = { rx, ry, rz } radians: the card turned in 3D (rx about its horizontal axis, ry about its
// vertical axis) and seen orthographically, then rotated in plane by rz. It is one affine matrix
// (tiltMatrix), so the card stays one SVG group; the sheen band slides with ry/rx, so a slow tilt reads as
// light moving across the metal. Keep |rx|, |ry| <= ~0.35.
// SHADOW. `shadow`: "elevation" (the kit's ElevationShadow at `elevation` + `lift`, for a card on its own),
// "contact" (a tight occlusion only: a card lying on another card in a deck), or "none" (the cut draws one
// union shadow for a touching group with cardSilhouette()).
// ---------------------------------------------------------------------------

export type PlanId = "standard" | "plus" | "premium" | "metal" | "ultra";
/** Bottom to top. */
export const PLANS: PlanId[] = ["standard", "plus", "premium", "metal", "ultra"];
export const PLAN_NAME: Record<PlanId, string> = { standard: "STANDARD", plus: "PLUS", premium: "PREMIUM", metal: "METAL", ultra: "ULTRA" };

/** ISO/IEC 7810 ID-1: 85.6 x 54 mm, corner radius 3.18 mm. Everything below is a fraction of the card's width W
 *  (or its height H where noted). */
export const CARD = {
  W: 320, // default world width
  ASPECT: 54 / 85.6, // H / W
  RADIUS: 3.18 / 85.6, // of W
  INSET: 0.072, // of W: the left margin of the R, chip and name
  R_H: 0.19, // of H: the R stamp's height
  R_TOP: 0.115, // of H: the R stamp's top
  CHIP_W: 0.134, // of W (11.5 mm)
  CHIP_H: 0.167, // of H (9 mm)
  CHIP_CY: 0.5, // of H
  NAME_PX: 0.13, // of H: the plan name's font size
  NAME_BASE: 0.855, // of H: the plan name's baseline
} as const;
export const cardH = (w: number = CARD.W) => w * CARD.ASPECT;
export const cardRadius = (w: number = CARD.W) => w * CARD.RADIUS;

/** One plan's material. top -> foot is the card's vertical gradient; `brushed` the streak strength (0 = matte);
 *  `sheen` the soft specular band's strength; `edge` the lit top edge's alpha. */
export type PlanTone = { top: string; foot: string; ink: string; chip: string; chipLine: string; brushed: number; sheen: number; edge: number };
export const PLATINUM = { top: "#ECEBE5", foot: "#CFCDC4" } as const; // pale cool-silver cream (never grey-black)
export const METAL = { top: "#947358", foot: "#7D5F47" } as const; // a darker brushed brown, still brown
export const PLAN_TONE: Record<PlanId, PlanTone> = {
  standard: { top: COLOR.board, foot: COLOR.boardFoot, ink: COLOR.inkDark, chip: "#C4A986", chipLine: COLOR.inkDark, brushed: 0, sheen: 0, edge: 0.45 },
  plus: {
    top: mixHex(COLOR.board, COLOR.cream, 0.5),
    foot: mixHex(COLOR.boardFoot, COLOR.creamFoot, 0.5),
    ink: COLOR.inkDark,
    chip: "#C4A986",
    chipLine: COLOR.inkDark,
    brushed: 0,
    sheen: 0,
    edge: 0.6,
  },
  premium: { top: COLOR.cream, foot: COLOR.creamFoot, ink: COLOR.inkDark, chip: "#C9AF8B", chipLine: COLOR.inkDark, brushed: 0, sheen: 0, edge: 0.85 },
  metal: { top: METAL.top, foot: METAL.foot, ink: COLOR.inkCream, chip: "#B39573", chipLine: "#4A3424", brushed: 0.12, sheen: 0.13, edge: 0.7 },
  ultra: { top: PLATINUM.top, foot: PLATINUM.foot, ink: COLOR.inkDark, chip: "#BDB9AE", chipLine: COLOR.inkDark, brushed: 0.12, sheen: 0.32, edge: 0.95 },
};
/** Where a card's tones go when it is dimmed (by tone, never opacity): the board pushed a quarter toward the
 *  ground (>= 3:1 against it). The ink sinks toward the card so a dimmed name stops reading. */
export const DIM_TONE = mixHex(COLOR.board, COLOR.ground, 0.25);
export const DIM_INK_SINK = 1;

export type Tilt = { rx: number; ry: number; rz: number };
export const FLAT: Tilt = { rx: 0, ry: 0, rz: 0 };
/** The card's local -> world linear part [a, b, c, d] (SVG matrix(a b c d e f)): turned rx about its own
 *  horizontal axis, then ry about its vertical axis, seen orthographically, then rz in plane. */
export const tiltMatrix = (t: Tilt = FLAT): [number, number, number, number] => {
  const a0 = Math.cos(t.ry);
  const c0 = Math.sin(t.rx) * Math.sin(t.ry);
  const d0 = Math.cos(t.rx);
  const cz = Math.cos(t.rz);
  const sz = Math.sin(t.rz);
  // Rz * [[a0, c0], [0, d0]]
  return [cz * a0, sz * a0, cz * c0 - sz * d0, sz * c0 + cz * d0];
};
/** A world point of a card: local (u, v) from its centre, unrotated px of a card of width w. */
export const cardPoint = (x: number, y: number, u: number, v: number, tilt: Tilt = FLAT) => {
  const [a, b, c, d] = tiltMatrix(tilt);
  return { x: x + a * u + c * v, y: y + b * u + d * v };
};
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
/** A rounded rect path centred on 0,0 (local px). */
const localRect = (w: number, h: number, r: number) => {
  const x = -w / 2;
  const y = -h / 2;
  return (
    `M${f3(x + r)} ${f3(y)}H${f3(x + w - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + w)} ${f3(y + r)}V${f3(y + h - r)}` +
    `A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + w - r)} ${f3(y + h)}H${f3(x + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x)} ${f3(y + h - r)}` +
    `V${f3(y + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x + r)} ${f3(y)}Z`
  );
};
/** The card's outline as a WORLD path (corners as arcs, sampled), for union shadows and collision checks. */
export const cardOutline = (x: number, y: number, w: number = CARD.W, tilt: Tilt = FLAT) => {
  const h = cardH(w);
  const r = cardRadius(w);
  const pts: [number, number][] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, -h / 2 + r, -Math.PI / 2],
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, Math.PI / 2],
    [-w / 2 + r, -h / 2 + r, Math.PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      const p = cardPoint(x, y, cx + r * Math.cos(a), cy + r * Math.sin(a), tilt);
      pts.push([p.x, p.y]);
    }
  }
  return `M${pts.map(([px, py]) => `${f3(px)} ${f3(py)}`).join("L")}Z`;
};
export const cardSilhouette = (x: number, y: number, w: number = CARD.W, tilt: Tilt = FLAT): Silhouette => [{ d: cardOutline(x, y, w, tilt) }];

/** The contactless mark: three thick arcs (local units of a card of width w), opening right. */
const contactless = (cx: number, cy: number, w: number) => {
  const out: string[] = [];
  for (let i = 0; i < 3; i++) {
    const r = w * (0.022 + i * 0.019);
    const a = 0.72; // half-angle (rad)
    const x0 = cx + r * Math.cos(-a);
    const y0 = cy + r * Math.sin(-a);
    const x1 = cx + r * Math.cos(a);
    const y1 = cy + r * Math.sin(a);
    out.push(`M${f3(x0)} ${f3(y0)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(x1)} ${f3(y1)}`);
  }
  return out.join("");
};

export type PlanCardProps = {
  plan: PlanId;
  x: number;
  y: number;
  k: number;
  w?: number;
  tilt?: Tilt;
  /** 0 = lit, 1 = dimmed into context (tone only). */
  dim?: number;
  shadow?: "elevation" | "contact" | "none";
  elevation?: Elevation;
  lift?: number;
  /** Ultra only: the amber edge glow, 0 (off: a silver rim) .. 1 (on). */
  glow?: number;
  /** The soft sheen band's position across the card, 0 .. 1 (drive it slowly: the living creep). */
  sheen?: number;
  /** The one click: the kit's LightSweep across the card, progress 0 .. 1 (outside = off). */
  sweep?: number;
  /** Hide the plan name (e.g. a card seen from too far to read). */
  showName?: boolean;
};

/**
 * PlanCard — one Revolut plan card (see the header). Draw cards bottom to top in the order they overlap.
 */
export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  x,
  y,
  k,
  w = CARD.W,
  tilt = FLAT,
  dim = 0,
  shadow = "elevation",
  elevation = "rest",
  lift = 0,
  glow = 0,
  sheen = 0.35,
  sweep = -1,
  showName = true,
}) => {
  const uid = `uc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const T = PLAN_TONE[plan];
  const h = cardH(w);
  const r = cardRadius(w);
  const d = Math.max(0, Math.min(1, dim));
  const top = mixHex(T.top, DIM_TONE, d);
  const foot = mixHex(T.foot, mixHex(DIM_TONE, COLOR.ground, 0.06), d);
  // a dimmed name sinks toward the card's own tone where it stands (its gradient at the name's height)
  const ink = mixHex(T.ink, mixHex(top, foot, CARD.NAME_BASE), d * DIM_INK_SINK);
  const chip = mixHex(T.chip, top, d * 0.55);
  const chipLine = mixHex(T.chipLine, chip, 0.45 + d * 0.35);
  const [a, b, c, dd] = tiltMatrix(tilt);
  const m = `matrix(${fx(a)} ${fx(b)} ${fx(c)} ${fx(dd)} ${fx(x)} ${fx(y)})`;
  const body = localRect(w, h, r);
  const L = -w / 2 + w * CARD.INSET;
  // the R stamp (box 25.3 x 31.73), top left
  const rH = h * CARD.R_H;
  const rS = rH / REVOLUT_R_BOX.h;
  const rTop = -h / 2 + h * CARD.R_TOP;
  // the chip
  const cw = w * CARD.CHIP_W;
  const ch = h * CARD.CHIP_H;
  const cy0 = -h / 2 + h * CARD.CHIP_CY - ch / 2;
  const cr = cw * 0.16;
  const chipLw = w * 0.0055;
  // the name
  const fs = h * CARD.NAME_PX;
  const base = -h / 2 + h * CARD.NAME_BASE;
  // the sheen band slides with the tilt (light moving across a turning metal)
  const sh = sheen + tilt.ry * 0.9 - tilt.rx * 0.5;
  const sheenX = -w * 0.85 + sh * w * 1.7;
  const sheenA = T.sheen * (1 - d * 0.8);
  const hair = EDGE.CREAM / k;
  const g = Math.max(0, Math.min(1, glow));
  const rimW = Math.max(2.4 / k, w * 0.006);
  return (
    <g>
      {shadow === "elevation" ? <ElevationShadow silhouette={cardSilhouette(x, y, w, tilt)} elevation={elevation} lift={lift} /> : null}
      {shadow === "contact" ? (
        <g fill={COLOR.shadow} opacity={0.32} style={{ filter: `blur(${f3(Math.max(1.2, w * 0.006))}px)` }}>
          <path d={cardOutline(x + w * 0.004, y + w * 0.009, w, tilt)} />
        </g>
      ) : null}
      {/* the amber edge glow (Ultra): its bloom spills onto whatever lies around the card */}
      {plan === "ultra" && g > 0.001 ? (
        <g transform={m} opacity={f3(g)}>
          {/* a soft amber halo just outside the edge (behind the card: only the spill shows) */}
          <path d={body} fill="none" stroke={COLOR.amberTop} strokeWidth={f3(w * 0.034)} strokeOpacity={0.5} style={{ filter: `blur(${f3(w * 0.026)}px)` }} />
          <g style={{ filter: bloomFilter(k) }}>
            <path d={localRect(w - rimW, h - rimW, Math.max(0, r - rimW / 2))} fill="none" stroke={COLOR.amberTop} strokeWidth={f3(rimW)} />
          </g>
        </g>
      ) : null}
      <g transform={m}>
        <defs>
          <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(-h / 2)} x2="0" y2={f3(h / 2)}>
            <stop offset="0" stopColor={top} />
            <stop offset="1" stopColor={foot} />
          </linearGradient>
          <clipPath id={`${uid}k`}>
            <path d={body} />
          </clipPath>
          {T.sheen > 0 ? (
            <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1={f3(sheenX - w * 0.32)} y1={f3(-h * 0.35)} x2={f3(sheenX + w * 0.32)} y2={f3(h * 0.35)}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={f3(sheenA)} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          ) : null}
          {T.brushed > 0 ? (
            <filter id={`${uid}n`} x={f3(-w / 2)} y={f3(-h / 2)} width={f3(w)} height={f3(h)} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency={`${f3(0.8 / w)} ${f3(170 / w)}`} numOctaves={2} seed={7} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.6 0 0 0 -0.62" />
            </filter>
          ) : null}
        </defs>
        {/* the body */}
        <path d={body} fill={`url(#${uid}b)`} />
        <g clipPath={`url(#${uid}k)`}>
          {T.brushed > 0 ? <rect x={f3(-w / 2)} y={f3(-h / 2)} width={f3(w)} height={f3(h)} filter={`url(#${uid}n)`} opacity={f3(T.brushed * (1 - d * 0.7))} /> : null}
          {T.sheen > 0 ? <rect x={f3(-w / 2)} y={f3(-h / 2)} width={f3(w)} height={f3(h)} fill={`url(#${uid}s)`} /> : null}
        </g>
        {/* the R stamp */}
        <g transform={`translate(${fx(L)} ${fx(rTop)}) scale(${fx(rS)})`}>
          <path d={REVOLUT_R_D} fill={ink} fillRule="evenodd" />
        </g>
        {/* the chip: a rounded plate with its contact lines */}
        <path d={`M${f3(L + cr)} ${f3(cy0)}H${f3(L + cw - cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(L + cw)} ${f3(cy0 + cr)}V${f3(cy0 + ch - cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(L + cw - cr)} ${f3(cy0 + ch)}H${f3(L + cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(L)} ${f3(cy0 + ch - cr)}V${f3(cy0 + cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(L + cr)} ${f3(cy0)}Z`} fill={chip} />
        <g stroke={chipLine} strokeWidth={f3(chipLw)} fill="none" strokeLinecap="round">
          <path d={`M${f3(L)} ${f3(cy0 + ch * 0.36)}H${f3(L + cw * 0.34)}M${f3(L)} ${f3(cy0 + ch * 0.64)}H${f3(L + cw * 0.34)}M${f3(L + cw * 0.66)} ${f3(cy0 + ch * 0.36)}H${f3(L + cw)}M${f3(L + cw * 0.66)} ${f3(cy0 + ch * 0.64)}H${f3(L + cw)}`} />
          <path d={`M${f3(L + cw * 0.34)} ${f3(cy0 + ch * 0.2)}V${f3(cy0 + ch * 0.8)}H${f3(L + cw * 0.66)}V${f3(cy0 + ch * 0.2)}Z`} />
        </g>
        {/* contactless */}
        <path d={contactless(L + cw + w * 0.045, cy0 + ch / 2, w)} stroke={ink} strokeWidth={f3(w * 0.0105)} strokeLinecap="round" fill="none" opacity={0.85} />
        {/* the plan's name */}
        {showName ? (
          <text
            x={f3(L)}
            y={f3(base)}
            fontFamily={FONT_LABEL}
            fontWeight={500}
            fontSize={f3(fs)}
            letterSpacing={`${TRACK.label}em`}
            fill={ink}
            style={{ fontFeatureSettings: '"case" 1' }}
          >
            {PLAN_NAME[plan]}
          </text>
        ) : null}
        {/* the lit top edge (screen hairline) */}
        <path d={`M${f3(-w / 2 + r)} ${f3(-h / 2 + hair / 2)}H${f3(w / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={f3(T.edge * (1 - d * 0.6))} strokeWidth={f3(hair)} />
        {/* Ultra's rim: silver when off, amber as the glow switches on (crisp line over the bloom) */}
        {plan === "ultra" ? (
          <path
            d={localRect(w - rimW, h - rimW, Math.max(0, r - rimW / 2))}
            fill="none"
            stroke={mixHex("#B9B6AC", COLOR.amberTop, g)}
            strokeWidth={f3(rimW)}
          />
        ) : null}
        {sweep > 0 && sweep < 1 ? <LightSweep x={-w / 2} y={-h / 2} w={w} h={h} k={k} t={sweep} on="cream" r={r} /> : null}
      </g>
    </g>
  );
};

/** UltraCard — the platinum Ultra card with its amber edge glow (`glow` 0..1, default on). */
export const UltraCard: React.FC<Omit<PlanCardProps, "plan">> = ({ glow = 1, ...p }) => <PlanCard plan="ultra" glow={glow} {...p} />;

/**
 * ULTRA_B_END — cut 21_UltraOnTop's LAST frame (f119), for a cut that opens on the same picture (30_UltraBenefits).
 * Values only (computed from UltraOnTop's camera track and Ultra's state at f119). Draw it as
 *   <StoutStage S={ULTRA_B_END.S} cam={ULTRA_B_END.cam} pool={ULTRA_B_END.pool}>
 *     <UltraCard {...ULTRA_B_END.card} k={ULTRA_B_END.cam.k} />
 * (StoutStage's sway runs on S, so S = 119 matches B's frame; pass B's last-frame S to keep the ground drift too).
 * On screen: Ultra centred at (540, 700), ~836 px wide (tilted). Cut B also shows the dimmed, tucked stack of the old
 * plans beneath it (METAL's name ~y 1030); a joined cut that drops them must say so.
 */
export const ULTRA_B_END = {
  S: 119,
  cam: { x: 584.0018455098416, y: 984.0813403416586, k: 2.7027473357686516 },
  pool: { x: 584, y: 888, strength: 1.3 },
  card: {
    x: 584,
    y: 888,
    w: 320,
    tilt: { rx: 0.161850, ry: -0.259750, rz: -0.03 },
    glow: 1,
    sheen: 0.7155,
    elevation: "rest" as const,
    lift: 0.6,
    shadow: "elevation" as const,
  },
} as const;
