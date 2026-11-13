import React, { useId } from "react";
import { COLOR, EDGE, ElevationShadow, FONT_LABEL, LightSweep, TRACK, bloomFilter, mixHex, type Elevation, type Silhouette } from "../kits/cheeky-pint/stoutShared";
import { REVOLUT_WORDMARK_BOX, REVOLUT_WORDMARK_D } from "./revolutWordmark";

// ---------------------------------------------------------------------------
// ultraCards — the PLAN CARDS of the nik-any-idea clip (owned by cut 21_UltraOnTop; cut 30_UltraBenefits
// imports UltraCard + ULTRA_B_END). Revolut's personal plans, bottom to top: Standard, Plus, Premium, Metal, Ultra.
//
// rev 3 (the user: "look like the real Revolut cards"), read off Revolut's official card photos (clip folder images/
// 16.8a/b/d, 20.2d, 23.2b): the cards are PORTRAIT, 54 x 85.6 mm with the ISO 3.18 mm corner; the "Revolut" wordmark
// runs down the right edge from near the top, reading top to bottom (letter tops toward the right edge); the chip
// stands upright (9 x 11.5 mm) in the upper part, just left of the wordmark. No R stamp, no contactless mark.
// rev 4 (the user: "on the card looks much better"): the plan's NAME is printed on the face again, horizontal, lower
// left, in the kit's label font and the card's ink (`showName`, default on); in a stair it sits in the bottom strip
// each lower card shows. PlanLabel (a name beside a card) stays exported but cut 21 no longer uses it.
// The wordmark is Revolut's own (revolutWordmark.ts, Wikimedia Commons), printed one-colour.
//
// TONES (inside the stout rules: nothing black): Standard board, Plus board/cream (soft), Premium a cool silver-grey,
// Metal the darkest card: the kit's ink brown (#3A2719 -> inkDark #2E1E14, never black) with a fine brush and a
// metal bevel rim, Ultra PLATINUM (a pale cool-silver cream) with the real card's fine horizontal ribbing, a soft
// sheen and, on Ultra only, the clip's AMBER: an edge glow (amber rim + the kit's bloom + a soft halo) = the idea
// that worked.
//
// UNITS. World px (draw inside StoutStage under the camera). (x, y) is the card's CENTRE, `w` its world width
// (default CARD.W = 200; height = w x 85.6 / 54 = 317 at 200). `k` is the current camera scale (screen-px hairlines,
// bloom, and the ribbing, which fades in only where its lines are big enough not to alias).
// TILT. `tilt` = { rx, ry, rz } radians: the card turned in 3D (rx about its horizontal axis, ry about its vertical
// axis), seen orthographically, then rotated in plane by rz. One affine matrix (tiltMatrix); the sheen band slides
// with ry/rx. Keep |rx|, |ry| <= ~0.35.
// SHADOW. "elevation" (the kit's ElevationShadow at `elevation` + `lift`), "contact" (a card lying on a card), "none".
// ---------------------------------------------------------------------------

export type PlanId = "standard" | "plus" | "premium" | "metal" | "ultra";
/** Bottom to top. */
export const PLANS: PlanId[] = ["standard", "plus", "premium", "metal", "ultra"];
export const PLAN_NAME: Record<PlanId, string> = { standard: "STANDARD", plus: "PLUS", premium: "PREMIUM", metal: "METAL", ultra: "ULTRA" };

/** ISO/IEC 7810 ID-1 held PORTRAIT: 54 x 85.6 mm, corner radius 3.18 mm. Fractions of the card's width W or height H. */
export const CARD = {
  W: 200, // default world width
  ASPECT: 85.6 / 54, // H / W
  RADIUS: 3.18 / 54, // of W
  WM_LEN: 0.31, // of H: the wordmark's length (it runs down the card)
  WM_TOP: 0.085, // of H: where the wordmark starts
  WM_RIGHT: 0.075, // of W: the right edge to the wordmark's letter tops
  CHIP_W: 9 / 54, // of W (the chip upright: 9 mm across)
  CHIP_H: 11.5 / 85.6, // of H (11.5 mm down)
  CHIP_X: 0.545, // of W: the chip's left edge from the card's left edge
  CHIP_TOP: 0.15, // of H
  RIB_PITCH: 0.0075, // of W: Ultra's ribbing pitch (1.5 world px on a 200 card: ~3.5 px at k 2.35)
  NAME_PX: 0.075, // of H: the plan name's font size (24 world px on a 200 card: ~45 px on screen at k 1.9)
  NAME_INSET: 0.08, // of W: the name's left margin
  NAME_BASE: 0.952, // of H from the top: the name's baseline, so its caps sit centred in a 48-54 px bottom strip
} as const;
export const cardH = (w: number = CARD.W) => w * CARD.ASPECT;
export const cardRadius = (w: number = CARD.W) => w * CARD.RADIUS;

/** One plan's material. top -> foot is the card's vertical gradient; `ink` the wordmark; `brushed` the streaks
 *  (0 = matte); `sheen` the soft specular band; `edge` the lit top edge's alpha; `rim` a metal bevel (colour, alpha);
 *  `rib` the ribbing strength (Ultra); `dimTo` where the body goes when dimmed. */
export type PlanTone = {
  top: string;
  foot: string;
  ink: string;
  chip: string;
  chipLine: string;
  brushed: number;
  sheen: number;
  edge: number;
  rim: [string, number] | null;
  rib: number;
  dimTo: string;
};
export const PLATINUM = { top: "#ECEBE5", foot: "#CFCDC4" } as const; // pale cool-silver cream (never grey-black)
export const METAL = { top: "#3A2719", foot: COLOR.inkDark } as const; // the darkest card: the kit's ink brown, never black
export const PREMIUM = { top: "#C4C3BD", foot: "#AAA8A1" } as const; // a cool silver-grey
/** Where a light card's tones go when dimmed (by tone, never opacity): the board pushed a quarter toward the ground. */
export const DIM_TONE = mixHex(COLOR.board, COLOR.ground, 0.25);
/** How far a dimmed card's wordmark sinks into the card at dim 1. */
export const DIM_INK_SINK = 1;
const WARM_CHIP = "#C4A986";
export const PLAN_TONE: Record<PlanId, PlanTone> = {
  standard: { top: COLOR.board, foot: COLOR.boardFoot, ink: COLOR.inkDark, chip: WARM_CHIP, chipLine: COLOR.inkDark, brushed: 0, sheen: 0, edge: 0.45, rim: null, rib: 0, dimTo: DIM_TONE },
  plus: {
    top: mixHex(COLOR.board, COLOR.cream, 0.5),
    foot: mixHex(COLOR.boardFoot, COLOR.creamFoot, 0.5),
    ink: COLOR.inkDark,
    chip: WARM_CHIP,
    chipLine: COLOR.inkDark,
    brushed: 0,
    sheen: 0,
    edge: 0.6,
    rim: null,
    rib: 0,
    dimTo: DIM_TONE,
  },
  premium: {
    top: PREMIUM.top,
    foot: PREMIUM.foot,
    ink: mixHex(COLOR.inkDark, PREMIUM.top, 0.18),
    chip: "#D0C8B6",
    chipLine: COLOR.inkDark,
    brushed: 0.07,
    sheen: 0.22,
    edge: 0.8,
    rim: null,
    rib: 0,
    dimTo: DIM_TONE,
  },
  metal: {
    top: METAL.top,
    foot: METAL.foot,
    ink: "#D9CEBD",
    chip: "#A58C6C",
    chipLine: "#2A1B12",
    brushed: 0.15,
    sheen: 0.1,
    edge: 0.75,
    rim: [COLOR.board, 0.7],
    rib: 0,
    dimTo: mixHex(METAL.top, COLOR.ground, 0.35),
  },
  ultra: {
    top: PLATINUM.top,
    foot: PLATINUM.foot,
    ink: mixHex(COLOR.inkDark, PLATINUM.foot, 0.42), // engraved: a soft grey-brown, as the real card's etched wordmark
    chip: "#BDB9AE",
    chipLine: COLOR.inkDark,
    brushed: 0.05,
    sheen: 0.3,
    edge: 0.95,
    rim: null,
    rib: 1,
    dimTo: DIM_TONE,
  },
};

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
  return [cz * a0, sz * a0, cz * c0 - sz * d0, sz * c0 + cz * d0];
};
/** A world point of a card: local (u, v) from its centre, unrotated px of a card of width w. */
export const cardPoint = (x: number, y: number, u: number, v: number, tilt: Tilt = FLAT) => {
  const [a, b, c, d] = tiltMatrix(tilt);
  return { x: x + a * u + c * v, y: y + b * u + d * v };
};
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
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
  /** Print the plan's name on the card, lower left (default on). */
  showName?: boolean;
  /** How far the printed name has sunk, 0..1 (default = `dim`): lets a name go before its card's strip closes over it. */
  nameDim?: number;
};

/**
 * PlanCard — one Revolut plan card, portrait (see the header). Draw cards bottom to top in the order they overlap.
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
  nameDim,
}) => {
  const uid = `uc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const T = PLAN_TONE[plan];
  const h = cardH(w);
  const r = cardRadius(w);
  const d = clamp01(dim);
  const top = mixHex(T.top, T.dimTo, d);
  const foot = mixHex(T.foot, mixHex(T.dimTo, COLOR.ground, 0.06), d);
  // a dimmed wordmark sinks toward the card's own tone near the top, where it stands
  const ink = mixHex(T.ink, mixHex(top, foot, 0.25), d * DIM_INK_SINK);
  // the printed name sinks toward the card's tone at its own height (near the foot)
  const nameInk = mixHex(T.ink, mixHex(top, foot, CARD.NAME_BASE), clamp01(nameDim ?? d) * DIM_INK_SINK);
  const nameFs = h * CARD.NAME_PX;
  const chip = mixHex(T.chip, top, d * 0.55);
  const chipLine = mixHex(T.chipLine, chip, 0.22 + d * 0.5);
  const [a, b, c, dd] = tiltMatrix(tilt);
  const m = `matrix(${fx(a)} ${fx(b)} ${fx(c)} ${fx(dd)} ${fx(x)} ${fx(y)})`;
  const body = localRect(w, h, r);
  // the wordmark: down the right edge, reading top to bottom (rotate 90: letter tops face the right edge)
  const wmLen = h * CARD.WM_LEN;
  const wmS = wmLen / REVOLUT_WORDMARK_BOX.w;
  const wmX = w / 2 - w * CARD.WM_RIGHT;
  const wmY = -h / 2 + h * CARD.WM_TOP;
  // the chip, upright
  const cw = w * CARD.CHIP_W;
  const ch = h * CARD.CHIP_H;
  const cx0 = -w / 2 + w * CARD.CHIP_X;
  const cy0 = -h / 2 + h * CARD.CHIP_TOP;
  const cr = cw * 0.16;
  const chipLw = w * 0.007;
  // the sheen band slides with the tilt (light moving across a turning metal)
  const sh = sheen + tilt.ry * 0.9 - tilt.rx * 0.5;
  const sheenX = -w * 0.85 + sh * w * 1.7;
  const sheenA = T.sheen * (1 - d * 0.8);
  const hair = EDGE.CREAM / k;
  const g = clamp01(glow);
  const rimW = Math.max(2.4 / k, w * 0.008);
  // the ribbing: fine horizontal lines, only where they are big enough on screen not to alias
  const pitch = w * CARD.RIB_PITCH;
  const ribA = T.rib * clamp01((pitch * k - 2.4) / 1.2) * (1 - d);
  return (
    <g>
      {shadow === "elevation" ? <ElevationShadow silhouette={cardSilhouette(x, y, w, tilt)} elevation={elevation} lift={lift} /> : null}
      {shadow === "contact" ? (
        <g fill={COLOR.shadow} opacity={0.32} style={{ filter: `blur(${f3(Math.max(1.2, w * 0.009))}px)` }}>
          <path d={cardOutline(x + w * 0.006, y + w * 0.014, w, tilt)} />
        </g>
      ) : null}
      {/* the amber edge glow (Ultra): its bloom spills onto whatever lies around the card */}
      {plan === "ultra" && g > 0.001 ? (
        <g transform={m} opacity={f3(g)}>
          <path d={body} fill="none" stroke={COLOR.amberTop} strokeWidth={f3(w * 0.05)} strokeOpacity={0.5} style={{ filter: `blur(${f3(w * 0.04)}px)` }} />
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
              <feTurbulence type="fractalNoise" baseFrequency={`${f3(0.8 / w)} ${f3(260 / w)}`} numOctaves={2} seed={7} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.6 0 0 0 -0.62" />
            </filter>
          ) : null}
          {ribA > 0.001 ? (
            <pattern id={`${uid}r`} patternUnits="userSpaceOnUse" x={f3(-w / 2)} y={f3(-h / 2)} width={f3(w)} height={f3(pitch)}>
              <rect x="0" y="0" width={f3(w)} height={f3(pitch * 0.42)} fill="#FFFFFF" fillOpacity={0.55} />
              <rect x="0" y={f3(pitch * 0.5)} width={f3(w)} height={f3(pitch * 0.42)} fill={COLOR.shadow} fillOpacity={0.2} />
            </pattern>
          ) : null}
        </defs>
        {/* the body */}
        <path d={body} fill={`url(#${uid}b)`} />
        <g clipPath={`url(#${uid}k)`}>
          {ribA > 0.001 ? <rect x={f3(-w / 2)} y={f3(-h / 2)} width={f3(w)} height={f3(h)} fill={`url(#${uid}r)`} opacity={f3(0.42 * ribA)} /> : null}
          {T.brushed > 0 ? <rect x={f3(-w / 2)} y={f3(-h / 2)} width={f3(w)} height={f3(h)} filter={`url(#${uid}n)`} opacity={f3(T.brushed * (1 - d * 0.7))} /> : null}
          {T.sheen > 0 ? <rect x={f3(-w / 2)} y={f3(-h / 2)} width={f3(w)} height={f3(h)} fill={`url(#${uid}s)`} /> : null}
        </g>
        {/* the wordmark, one-colour, down the right edge */}
        <g transform={`translate(${fx(wmX)} ${fx(wmY)}) rotate(90) scale(${fx(wmS)})`}>
          <path d={REVOLUT_WORDMARK_D} fill={ink} fillRule="evenodd" />
        </g>
        {/* the plan's name, printed lower left (in the stair it sits in the strip each lower card shows) */}
        {showName && (nameDim ?? d) < 0.999 ? (
          <text
            x={f3(-w / 2 + w * CARD.NAME_INSET)}
            y={f3(-h / 2 + h * CARD.NAME_BASE)}
            fontFamily={FONT_LABEL}
            fontWeight={500}
            fontSize={f3(nameFs)}
            letterSpacing={`${TRACK.label}em`}
            fill={nameInk}
            style={{ fontFeatureSettings: '"case" 1' }}
          >
            {PLAN_NAME[plan]}
          </text>
        ) : null}
        {/* the chip, upright: a rounded plate with its contact lines */}
        <path
          d={`M${f3(cx0 + cr)} ${f3(cy0)}H${f3(cx0 + cw - cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(cx0 + cw)} ${f3(cy0 + cr)}V${f3(cy0 + ch - cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(cx0 + cw - cr)} ${f3(cy0 + ch)}H${f3(cx0 + cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(cx0)} ${f3(cy0 + ch - cr)}V${f3(cy0 + cr)}A${f3(cr)} ${f3(cr)} 0 0 1 ${f3(cx0 + cr)} ${f3(cy0)}Z`}
          fill={chip}
        />
        <g stroke={chipLine} strokeWidth={f3(chipLw)} fill="none" strokeLinecap="round">
          <path
            d={`M${f3(cx0 + cw * 0.36)} ${f3(cy0)}V${f3(cy0 + ch * 0.34)}M${f3(cx0 + cw * 0.64)} ${f3(cy0)}V${f3(cy0 + ch * 0.34)}M${f3(cx0 + cw * 0.36)} ${f3(cy0 + ch * 0.66)}V${f3(cy0 + ch)}M${f3(cx0 + cw * 0.64)} ${f3(cy0 + ch * 0.66)}V${f3(cy0 + ch)}`}
          />
          <path d={`M${f3(cx0 + cw * 0.2)} ${f3(cy0 + ch * 0.34)}H${f3(cx0 + cw * 0.8)}V${f3(cy0 + ch * 0.66)}H${f3(cx0 + cw * 0.2)}Z`} />
        </g>
        {/* the lit top edge (screen hairline) */}
        <path d={`M${f3(-w / 2 + r)} ${f3(-h / 2 + hair / 2)}H${f3(w / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={f3(T.edge * (1 - d * 0.6))} strokeWidth={f3(hair)} />
        {/* a metal card's bevel: a fine lit rim all round */}
        {T.rim ? (
          <path
            d={localRect(w - 1.4 / k, h - 1.4 / k, Math.max(0, r - 0.7 / k))}
            fill="none"
            stroke={T.rim[0]}
            strokeOpacity={f3(T.rim[1] * (1 - d * 0.4))}
            strokeWidth={f3(1.4 / k)}
          />
        ) : null}
        {/* Ultra's rim: silver when off, amber as the glow switches on (a crisp line over the bloom) */}
        {plan === "ultra" ? (
          <path d={localRect(w - rimW, h - rimW, Math.max(0, r - rimW / 2))} fill="none" stroke={mixHex("#B9B6AC", COLOR.amberTop, g)} strokeWidth={f3(rimW)} />
        ) : null}
        {sweep > 0 && sweep < 1 ? <LightSweep x={-w / 2} y={-h / 2} w={w} h={h} k={k} t={sweep} on="cream" r={r} /> : null}
      </g>
    </g>
  );
};

/** UltraCard — the platinum Ultra card with its amber edge glow (`glow` 0..1, default on). */
export const UltraCard: React.FC<Omit<PlanCardProps, "plan">> = ({ glow = 1, ...p }) => <PlanCard plan="ultra" glow={glow} {...p} />;

/** A plan label's colour on the ground: the kit's type on the ground (inkCream), sinking toward the ground by tone. */
export const planLabelColor = (dim: number) => mixHex(COLOR.inkCream, COLOR.ground, clamp01(dim) * 0.92);
/**
 * PlanLabel — a plan's name BESIDE its card (a legend, never printed on the card): Söhne Kräftig caps +0.06 em at
 * `px` SCREEN px, in the type-on-the-ground ink; dims by tone (`dim`); enters with the house entrance (`enter` 0..1:
 * a 24 px slide up, fade and blur). (x, y) world px, y = the baseline.
 */
export const PlanLabel: React.FC<{ x: number; y: number; k: number; text: string; px: number; dim?: number; enter?: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  k,
  text,
  px,
  dim = 0,
  enter = 1,
  anchor = "end",
}) => {
  const e = 1 - Math.pow(1 - clamp01(enter), 3);
  if (e <= 0.002 || dim >= 0.999) return null;
  const fs = px / k;
  const comp = anchor === "end" ? TRACK.label * fs : anchor === "middle" ? (TRACK.label * fs) / 2 : 0;
  const blur = 6 * (1 - e);
  return (
    <g opacity={f3(e)} style={{ filter: blur > 0.05 ? `blur(${f3(blur / k)}px)` : undefined }}>
      <text
        x={f3(x + comp)}
        y={f3(y + ((1 - e) * 24) / k)}
        fontFamily={FONT_LABEL}
        fontWeight={500}
        fontSize={f3(fs)}
        letterSpacing={`${TRACK.label}em`}
        textAnchor={anchor}
        fill={planLabelColor(dim)}
        style={{ fontFeatureSettings: '"case" 1' }}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
};

/**
 * ULTRA_B_END — cut 21_UltraOnTop's LAST frame (f119), for a cut that opens on the same picture (30_UltraBenefits).
 * Values only (from UltraOnTop's camera track and Ultra's state at f119). Draw it as
 *   <StoutStage S={ULTRA_B_END.S} cam={ULTRA_B_END.cam} pool={ULTRA_B_END.pool}>
 *     <UltraCard {...ULTRA_B_END.card} k={ULTRA_B_END.cam.k} />
 * Cut B also shows, beneath it, the dimmed tucked stack of the old plans (METAL's strip and printed name showing under
 * it); ULTRA is printed on the Ultra card. A joined cut that drops the stack must say so.
 */
export const ULTRA_B_END = {
  S: 119,
  cam: { x: 579.9984005838795, y: 1103.890568369124, k: 2.2710152080765336 },
  pool: { x: 580, y: 898, strength: 1.3 },
  card: {
    x: 580,
    y: 898,
    w: CARD.W,
    tilt: { rx: 0.16185, ry: -0.25975, rz: -0.03 },
    glow: 1,
    sheen: 0.7155,
    elevation: "rest" as const,
    lift: 0.6,
    shadow: "elevation" as const,
  },
} as const;
