// ---------------------------------------------------------------------------
// pricingShared — the shared world of the clip "sam - we almost stopped pricing in tokens" (sam-pricing-tokens,
// Cheeky Pint S4E07, Sam Altman with John Collison). Owned by the cut-11 builder (PromptInPriceOut); every other
// cut imports it read-only. Later changes keep old exports, add new names and are logged in
// animation_source/notes/SHARED_CHANGES.md.
//
// THE LOOK: Cheeky Pint stout (stoutShared, palette B1) with REAL photographed objects blended in (borrowed from
// the core-memory archive collage: photo cut-outs as the actual objects, and 2.5D depth under one camera). A photo
// object is graded into the stout light and casts ONE stout shadow from its own alpha; drawn pieces keep the stout
// card material; one object = one material; nothing is ever outlined around a photo.
//
// WHAT IS HERE (all geometry in WORLD px: StoutStage children, under the camera)
//   PRICE, TAG, TILE, CARD, SHADOW_S, PALETTE_ROLES, CUT11_END_CAM   constants of the world
//   StoutShadow            the house union shadow (museShared UnionShadow's recipe) that also takes BITMAP parts:
//                          a photo's alpha silhouette is one more part of the one silhouette
//   PhotoCutOut            a real RGBA cut-out graded into the stout light, its one shadow, `dim` by tone
//   depthScale / depthCam / DepthPlane   the small 2.5D dolly (archiveShared's idea on StoutStage's camera)
//   PriceTag (+ priceTagSil, tagPose)   the clip's recurring object: the swing tag with the amber $3.40 sticker
//   swingAt                a damped pendulum swing (deg) that never quite stops (living)
//   OpenAISlotTile (+ slotGeom, slotClip)   the cream OpenAI tile with the blossom and a SLOT in its top edge
//   PromptCard (+ promptCardSil, CARD2, caretAt)   the cream chat input: word-bars in ink (1 or 2 rows), a blinking
//                          caret, a round send arrow
//   CustomerBust           macintoshShared's Bust drawing with one more pose value, `sour` (cut 17)
//   re-exports             Bust, CROWD, CrowdShadow, bustSil, blinkAt, BUST, Glyph, MarkTile, ChatGPTMark, CLOTH,
//                          HAIR, SKIN, UnionShadow (from macintoshShared / museShared, untouched)
//
// GRADE (PhotoCutOut, the named constants below; why):
//   * GRADE.saturate 0.8 — the stout palette is warm and muted; a full-chroma photo jumps out of it like a sticker.
//   * GRADE.black / GRADE.white — the photo's tonal range is mapped onto the stout CARD range per channel:
//     photo black -> COLOR.inkDark (#2E1E14; nothing is black in this style), photo white -> COLOR.cream
//     (#F5EEE1; the brightest paper lands exactly on the lit cream card's value, so a white tag sits in the same
//     light as the cream tiles). The blue channel's smaller span is the warm cast.
//   * GRADE.topLight / GRADE.foot — the top-lit ramp of every stout card: a whisper of the lamp's tint over the
//     top (alpha 0.07), clear by 45 %, a brown shade at the foot (alpha 0.16), laid through the photo's own alpha.
//   * dim — tones the photo toward the board (a board-coloured layer through its alpha, up to 0.84), never opacity.
//   * the shadow — the photo's alpha silhouette filled COLOR.shadow, at the stout elevations x SHADOW_S, a contact
//     shadow at rest; unioned with whatever it touches (StoutShadow parts).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  ELEVATION,
  FONT_NUM,
  TRACK,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  numeralWidth,
  rectPath,
  smoothstep,
  type Elevation,
  type ShadowLayer,
} from "../kits/cheeky-pint/stoutShared";
import { LIFT_DY, UnionShadow, type SilItem } from "../kits/cheeky-pint/museShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  BUST,
  Bust,
  CLOTH,
  CROWD,
  ChatGPTMark,
  CrowdShadow,
  Glyph,
  HAIR,
  MarkTile,
  SKIN,
  blinkAt,
  bustSil,
  type BustPose,
  type BustSpec,
} from "../sam-macintosh-moment/macintoshShared";
import type { HairStyle } from "../scott-free-wifi/cabinCast";
import { TAG_PHOTO } from "./pricingData";

export { BUST, Bust, CLOTH, CROWD, ChatGPTMark, CrowdShadow, Glyph, HAIR, MarkTile, SKIN, UnionShadow, blinkAt, bustSil };
export type { BustPose, BustSpec, Cam, SilItem };

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `pr${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const D2R = Math.PI / 180;

// ===========================================================================
// THE WORLD — constants every cut shares
// ===========================================================================
/** The one price of the clip (illustrative, not a real OpenAI price): the same value wherever a price shows. */
export const PRICE = "$3.40";
/** Palette roles for this clip (COMMON "Meaning"): amber = the number the customer is shown or charged, only. */
export const PALETTE_ROLES = {
  /** the price on the tag, the receipt's total, the bills: amber sticker / band with ink numerals */
  price: COLOR.amberTop,
  priceFoot: COLOR.amberFoot,
  priceInk: COLOR.inkDark,
  /** lit card: the subject (tiles, prompt card, busts in focus) */
  subject: COLOR.cream,
  /** context and dimmed card */
  context: COLOR.board,
  /** the twine of the tag (natural cotton, a step under the cream) */
  twine: mixHex(COLOR.cream, COLOR.board, 0.32),
  twineFoot: mixHex(COLOR.creamFoot, COLOR.boardFoot, 0.5),
} as const;
/**
 * The shadow scale of this world: the stout elevation recipes are written for 96-px tiles (s = size / 96). One
 * lamp means one offset for everything at one elevation, so the whole world shares ONE s (the OpenAI tile is 400
 * world px; 400 / 96 = 4.2 put the rest shadow ~35 px under a paper tag, which reads as hovering: 3 keeps it close).
 */
export const SHADOW_S = 3;

/** The OpenAI slot tile (cut 11's size; reuse it): a square cream card, corner radius 0.16 x size (MarkTile's). */
export const TILE = {
  size: 400,
  radius: 0.16,
  /** the slot across the top edge: its width (share of the tile) and its slit height (share of the tile) */
  slotW: 0.86,
  slotH: 0.018,
} as const;

/**
 * The tag's art. `TAG_PHOTO` (pricingData.ts) is the real photo cut-out when the image agent's source has been
 * baked (scripts/clips/sam-pricing-tokens/bake-tag.py), else null and the tag is drawn as a plain kraft placeholder
 * of the same geometry. Fractions are of the tag's own box (u across, v down from its top edge):
 *   aspect = w / h · holeV = the hole's centre · sticker = the amber price sticker's centre v, width and height
 *   (shares of the tag's WIDTH) · footV = where the paper's lower edge is (1 for a trimmed cut-out).
 */
export type TagArt = {
  src: string | null;
  aspect: number;
  holeV: number;
  holeR: number;
  footV: number;
  sticker: { cv: number; w: number; h: number };
};
const TAG_VECTOR: TagArt = { src: null, aspect: 0.62, holeV: 0.115, holeR: 0.055, footV: 1, sticker: { cv: 0.56, w: 0.86, h: 0.36 } };
export const TAG_ART: TagArt = TAG_PHOTO ?? TAG_VECTOR;
/** The tag's world size (cut 11 at its resolved camera k ~1.0: ~530 px tall on screen). w must fit the slot. */
export const TAG = (() => {
  const w = 330;
  const h = w / TAG_ART.aspect;
  return { w, h, holeY: TAG_ART.holeV * h, art: TAG_ART } as const;
})();
/** The prompt card: a chat input pill (world). Its width fits the tile's slot. */
export const CARD = { w: 320, h: 92 } as const;

/**
 * The camera at cut 11's resolved frame (world look point at the frame's middle, and k): cut 17 opens on this
 * framing (a world match: the same tag at the same size class in the same light; footage sits between).
 * Cut 11's world: tile centre x 540, tile floor CUT11_WORLD.floor, the tag standing in the slot, its foot on the
 * tile's top edge. Kept in sync with PromptInPriceOut.tsx (it asserts these at module load).
 */
export const CUT11_WORLD = { x: 540, floor: 1526 } as const;
export const CUT11_END_CAM: Cam = { x: 540, y: 965, k: 1.12 };

// ===========================================================================
// SHADOWS — one object, one union silhouette, one lamp (bitmap parts allowed)
// ===========================================================================
/** A bitmap part of a silhouette: the image's alpha, placed (world) like the photo it shadows. */
export type ImgPart = { img: string; x: number; y: number; w: number; h: number; tf?: string; clip?: SilItem["clip"] };
export type ShadowPart = SilItem | ImgPart;
const isImg = (p: ShadowPart): p is ImgPart => (p as ImgPart).img !== undefined;
const NEXT: Record<Elevation, Elevation> = { rest: "lifted", lifted: "float", float: "float" };
const shadowRgb = (() => {
  const h = COLOR.shadow;
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
})();
/**
 * StoutShadow — the shadow of ONE object whose parts may be paths (SilItem, as museShared's UnionShadow) or
 * bitmaps (ImgPart: the alpha of a photo cut-out, filled COLOR.shadow). Every part is drawn once per layer inside
 * one group, so touching parts never stack. `s` = the recipe's scale (default SHADOW_S). Draw it BEFORE the bodies.
 */
export const StoutShadow: React.FC<{
  parts: ShadowPart[];
  s?: number;
  elevation?: Elevation;
  lift?: number;
  contact?: { x: number; y: number; w: number } | null;
  strength?: number;
}> = ({ parts, s = SHADOW_S, elevation = "rest", lift = 0, contact = null, strength = 1 }) => {
  const uid = uidOf(useId());
  if (strength <= 0.002) return null;
  const A = ELEVATION[elevation];
  const B = ELEVATION[NEXT[elevation]];
  const t = clamp01(lift);
  const mix = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({ dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t), blur: lerp(a.blur, b.blur, t), a: lerp(a.a, b.a, t) });
  const layers = [mix(A.amb, B.amb), mix(A.key, B.key)];
  const c = A.contact;
  const [r, g, b] = shadowRgb;
  const body = parts.map((q, i) => {
    let el: React.ReactNode;
    if (isImg(q)) {
      el = <image href={q.img} x={f3(q.x)} y={f3(q.y)} width={f3(q.w)} height={f3(q.h)} preserveAspectRatio="none" transform={q.tf} filter={`url(#${uid}m)`} />;
    } else if (q.stroke) {
      el = <path d={q.d} fill="none" stroke={COLOR.shadow} strokeWidth={f3(q.stroke)} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={q.a ?? 1} transform={q.tf} />;
    } else {
      el = <path d={q.d} fillOpacity={q.a ?? 1} transform={q.tf} />;
    }
    return q.clip ? (
      <g key={i} clipPath={`url(#${uid}c${i})`}>
        {el}
      </g>
    ) : (
      <React.Fragment key={i}>{el}</React.Fragment>
    );
  });
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      <defs>
        <filter id={`${uid}m`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`0 0 0 0 ${f3(r)} 0 0 0 0 ${f3(g)} 0 0 0 0 ${f3(b)} 0 0 0 1 0`} />
        </filter>
        {parts.map((q, i) =>
          q.clip ? (
            <clipPath key={i} id={`${uid}c${i}`}>
              <rect x={f3(q.clip.x)} y={f3(q.clip.y)} width={f3(q.clip.w)} height={f3(q.clip.h)} />
            </clipPath>
          ) : null,
        )}
      </defs>
      {contact && c ? (
        <ellipse cx={f3(contact.x + c.dx * s)} cy={f3(contact.y)} rx={f3(contact.w * 0.58)} ry={f3(3 * s)} opacity={f3(c.a * (1 - t) * strength)} style={{ filter: `blur(${f3(c.blur * s)}px)` }} />
      ) : null}
      {layers.map((l, i) => (
        <g key={i} opacity={f3(l.a * strength)} transform={`translate(${fx(l.dx * s)} ${fx(l.dy * s)})`} style={{ filter: `blur(${f3(l.blur * s)}px)` }}>
          {body}
        </g>
      ))}
    </g>
  );
};

// ===========================================================================
// PHOTO CUT-OUTS — real objects graded into the stout light
// ===========================================================================
const hex01 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export type Grade = {
  saturate: number;
  /** what photo black maps to (per channel) */
  black: string;
  /** what photo white maps to (per channel) */
  white: string;
  /** the top-lit ramp: the lamp's tint over the top and a shade at the foot (alphas) */
  topLight: number;
  foot: number;
};
export const GRADE: Grade = { saturate: 0.8, black: COLOR.inkDark, white: COLOR.cream, topLight: 0.07, foot: 0.16 };
const LAMP_TINT = "#FFF4E2";
/** The feColorMatrix rows of a grade's tone map (black -> grade.black, white -> grade.white, per channel). */
export const gradeMatrix = (g: Grade = GRADE) => {
  const b = hex01(g.black);
  const w = hex01(g.white);
  const row = (i: number) => [0, 1, 2].map((j) => (i === j ? f3(w[i] - b[i]) : "0")).join(" ") + ` 0 ${f3(b[i])}`;
  return `${row(0)} ${row(1)} ${row(2)} 0 0 0 1 0`;
};
/** Where a placed photo's box sits (world): x = centre; `floor` = its lower edge, or `y` = its centre. */
const photoBox = (x: number, h: number, aspect: number, floor?: number, y?: number) => {
  const w = h * aspect;
  const top = floor !== undefined ? floor - h : (y ?? 0) - h / 2;
  return { x: x - w / 2, y: top, w, h };
};
/**
 * PhotoCutOut — a real RGBA cut-out (a data: URL, CRAFT "Bitmaps inside an SVG"; a staticFile URL works but can
 * drop frames) in world px, graded into the stout light, with its one stout shadow from its own alpha.
 *   x = centre; floor = lower edge (or y = centre); h = height; aspect = the PNG's w / h; k = camera zoom.
 *   elevation / lift as every stout object (lift raises the body LIFT_DY x s and grows the shadow).
 *   grade = overrides of GRADE; dim 0..1 tones it toward the board (never opacity).
 *   shadow false = drawn without its shadow (union it with what it touches via photoCutOutSil + StoutShadow).
 *   rotate (deg) about `origin` (world; default the box's bottom centre); flipX mirrors it.
 */
export const PhotoCutOut: React.FC<{
  src: string;
  x: number;
  floor?: number;
  y?: number;
  h: number;
  aspect: number;
  k: number;
  elevation?: Elevation;
  lift?: number;
  grade?: Partial<Grade>;
  dim?: number;
  shadow?: boolean;
  s?: number;
  rotate?: number;
  origin?: { x: number; y: number };
  flipX?: boolean;
}> = ({ src, x, floor, y, h, aspect, elevation = "rest", lift = 0, grade, dim = 0, shadow = true, s = SHADOW_S, rotate = 0, origin, flipX = false }) => {
  const uid = uidOf(useId());
  const g = { ...GRADE, ...(grade ?? {}) };
  const dy = -clamp01(lift) * LIFT_DY * s;
  const box = photoBox(x, h, aspect, floor, y);
  const o = origin ?? { x, y: box.y + box.h };
  const tf = photoTf(box, o, rotate, flipX);
  const sil = photoCutOutSil({ src, x, floor, y, h, aspect, rotate, origin, flipX });
  const dm = clamp01(dim);
  return (
    <g>
      {shadow ? <StoutShadow parts={sil} s={s} elevation={elevation} lift={lift} contact={elevation === "rest" && lift < 0.001 ? { x: o.x, y: box.y + box.h, w: box.w } : null} /> : null}
      <g transform={dy ? `translate(0 ${fx(dy)})` : undefined}>
        <PhotoBody uid={uid} src={src} box={box} tf={tf} g={g} dim={dm} />
      </g>
    </g>
  );
};
const photoTf = (box: { x: number; y: number; w: number; h: number }, o: { x: number; y: number }, rotate: number, flipX: boolean) => {
  const parts: string[] = [];
  if (rotate) parts.push(`rotate(${fx(rotate)} ${fx(o.x)} ${fx(o.y)})`);
  if (flipX) parts.push(`translate(${fx(2 * (box.x + box.w / 2))} 0) scale(-1 1)`);
  return parts.length ? parts.join(" ") : undefined;
};
/** The graded body of a photo (no shadow): the toned image, the top-lit ramp and the dim layer through its alpha. */
const PhotoBody: React.FC<{ uid: string; src: string; box: { x: number; y: number; w: number; h: number }; tf?: string; g: Grade; dim: number }> = ({ uid, src, box, tf, g, dim }) => {
  const img = (extra?: React.SVGProps<SVGImageElement>) => (
    <image href={src} x={f3(box.x)} y={f3(box.y)} width={f3(box.w)} height={f3(box.h)} preserveAspectRatio="none" {...extra} />
  );
  return (
    <g transform={tf}>
      <defs>
        <filter id={`${uid}g`} colorInterpolationFilters="sRGB" x="0" y="0" width="1" height="1">
          <feColorMatrix type="saturate" values={f3(g.saturate)} />
          <feColorMatrix type="matrix" values={gradeMatrix(g)} />
        </filter>
        <mask id={`${uid}a`} maskUnits="userSpaceOnUse" x={f3(box.x)} y={f3(box.y)} width={f3(box.w)} height={f3(box.h)} style={{ maskType: "alpha" }}>
          {img()}
        </mask>
        <linearGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(box.y)} x2="0" y2={f3(box.y + box.h)}>
          <stop offset="0" stopColor={LAMP_TINT} stopOpacity={f3(g.topLight)} />
          <stop offset="0.45" stopColor={LAMP_TINT} stopOpacity="0" />
          <stop offset="0.55" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={f3(g.foot)} />
        </linearGradient>
        <linearGradient id={`${uid}d`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(box.y)} x2="0" y2={f3(box.y + box.h)}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
      </defs>
      {img({ filter: `url(#${uid}g)` })}
      <rect x={f3(box.x)} y={f3(box.y)} width={f3(box.w)} height={f3(box.h)} fill={`url(#${uid}r)`} mask={`url(#${uid}a)`} />
      {dim > 0.001 ? <rect x={f3(box.x)} y={f3(box.y)} width={f3(box.w)} height={f3(box.h)} fill={`url(#${uid}d)`} opacity={f3(0.84 * dim)} mask={`url(#${uid}a)`} /> : null}
    </g>
  );
};
/** A placed photo's silhouette part (for a StoutShadow it shares with what it touches). */
export const photoCutOutSil = (p: { src: string; x: number; floor?: number; y?: number; h: number; aspect: number; rotate?: number; origin?: { x: number; y: number }; flipX?: boolean; clip?: SilItem["clip"] }): ShadowPart[] => {
  const box = photoBox(p.x, p.h, p.aspect, p.floor, p.y);
  const o = p.origin ?? { x: p.x, y: box.y + box.h };
  return [{ img: p.src, ...box, tf: photoTf(box, o, p.rotate ?? 0, p.flipX ?? false), clip: p.clip }];
};

// ===========================================================================
// DEPTH — a small 2.5D dolly on StoutStage's camera
// ===========================================================================
/**
 * The scale of a plane at depth d (1 = the focus plane the StoutStage camera frames, > 1 farther, < 1 nearer)
 * when the focus plane is at k, relative to the rest camera's kRest (a dolly: near planes grow faster).
 */
export const depthScale = (k: number, d: number, kRest = 1) => {
  if (d === 1) return k;
  const kr = k / kRest;
  const den = d - (1 - 1 / kr);
  if (den <= 0.02) throw new Error(`depthScale: the camera (k ${k}) has passed the plane at depth ${d}`);
  return kRest * (d / den);
};
/** The camera a plane at depth d sees (centre + k), from the stage camera and its rest (parallax origin). */
export const depthCam = (cam: Cam, rest: Cam, d: number): Cam => ({
  x: rest.x + (cam.x - rest.x) / d,
  y: rest.y + (cam.y - rest.y) / d,
  k: depthScale(cam.k, d, rest.k),
});
/**
 * DepthPlane — children in the world px of a plane at depth d, drawn INSIDE StoutStage (which already applies the
 * focus-plane camera `cam`). At the rest camera every plane coincides with the focus plane (no jump at f0); as the
 * camera moves, far planes slide and scale less, near planes more. Draw far planes first. Pass the plane's own k
 * (depthCam(...).k) to its children for screen-px tokens.
 */
export const DepthPlane: React.FC<{ cam: Cam; rest: Cam; d: number; children: React.ReactNode }> = ({ cam, rest, d, children }) => {
  if (d === 1) return <g>{children}</g>;
  const c = depthCam(cam, rest, d);
  const sc = c.k / cam.k;
  // the stage maps world w -> 540 + (w - cam.x) k; the plane needs p -> 540 + (p - c.x) c.k
  const tx = cam.x - c.x * sc;
  const ty = cam.y - c.y * sc;
  return <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(sc)})`}>{children}</g>;
};

// ===========================================================================
// THE SWING — a damped pendulum, living
// ===========================================================================
/**
 * swingAt — the angle (deg) of a hanging / standing thing set swinging at f0: amp x e^(-t / tau) x sin(2 pi t /
 * period), eased in over the first quarter period (no kink at f0), plus a tiny ambient sway `live` (deg) that never
 * stops (the last frame is living). Before f0 only the ambient sway.
 */
export const swingAt = (f: number, o: { f0: number; amp: number; period?: number; tau?: number; live?: number; livePeriod?: number; phase?: number }) => {
  const period = o.period ?? 30;
  const tau = o.tau ?? 22;
  const t = f - o.f0;
  const ease = smoothstep(t / (period * 0.25));
  const main = t > 0 ? o.amp * Math.exp(-t / tau) * Math.sin((2 * Math.PI * t) / period) * ease : 0;
  const live = (o.live ?? 0.35) * Math.sin((2 * Math.PI * (f + (o.phase ?? 0))) / (o.livePeriod ?? 61));
  return main + live;
};

// ===========================================================================
// THE PRICE TAG — the real swing tag with the amber $3.40 sticker
// ===========================================================================
/**
 * Pose of the tag (world): `anchor` "foot" = (x, y) is the bottom centre of the paper (a tag standing in a slot,
 * cut 11) and `angle` turns it about that point; "hole" = (x, y) is the hole's centre (a tag hanging on its
 * string) and `angle` turns it about the hole. Returns the SVG transform from tag-local coordinates (x across
 * from the centre line, y down from the tag's top edge, the tag w x h) to world.
 */
export const tagPose = (x: number, y: number, angle: number, anchor: "foot" | "hole", h: number = TAG.h) => {
  const ay = anchor === "foot" ? h * TAG_ART.footV : TAG_ART.holeV * h;
  return `translate(${fx(x)} ${fx(y)}) rotate(${fx(angle)}) translate(0 ${fx(-ay)})`;
};
/** The placeholder tag's outline (tag-local): a kraft card with clipped top corners and the punched hole. */
const tagOutline = (w: number, h: number) => {
  const c = 0.17 * w;
  const r = 0.025 * w;
  const x0 = -w / 2;
  const x1 = w / 2;
  return `M${f3(x0 + c)} 0H${f3(x1 - c)}L${f3(x1)} ${f3(c)}V${f3(h - r)}Q${f3(x1)} ${f3(h)} ${f3(x1 - r)} ${f3(h)}H${f3(x0 + r)}Q${f3(x0)} ${f3(h)} ${f3(x0)} ${f3(h - r)}V${f3(c)}Z`;
};
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;
/** The sticker box (tag-local): centred on the tag's centre line at sticker.cv. */
export const stickerBox = (w: number = TAG.w, h: number = TAG.h) => {
  const sw = TAG_ART.sticker.w * w;
  const sh = TAG_ART.sticker.h * w;
  return { x: -sw / 2, y: TAG_ART.sticker.cv * h - sh / 2, w: sw, h: sh, r: 0.07 * sh };
};
/**
 * How the price prints (the contrast solution, shared with cut 17's receipt total): an AMBER STICKER (the shop's
 * price label) on the tag, amberTop -> amberFoot top to foot, its 2 px hot top edge and the fixed stout bloom,
 * with the numerals in COLOR.inkDark (Söhne Dreiviertelfett, FONT_NUM, tracking TRACK.numeral). Ink on amber is
 * 8.7:1 at the sticker's top, 6.2:1 at its foot, ~7.4:1 behind the numerals' middle; amber numerals straight on the
 * kraft / cream paper would be 1.1-1.6:1 and illegible. The numerals' size is
 * fitted to the sticker: the lesser of 0.86 x its width (by advance) and 0.56 x its height (cap 0.718 em).
 */
export const priceFont = (box: { w: number; h: number }, text: string = PRICE) => Math.min((0.86 * box.w) / numeralWidth(text, 1), (0.56 * box.h) / 0.718);
/** The amber price sticker with ink numerals, drawn in its own (tag-local or any) coordinates. */
export const PriceSticker: React.FC<{ box: { x: number; y: number; w: number; h: number; r: number }; k: number; text?: string; dim?: number; glow?: boolean }> = ({
  box,
  k,
  text = PRICE,
  dim = 0,
  glow = true,
}) => {
  const uid = uidOf(useId());
  const fs = priceFont(box, text);
  const dm = clamp01(dim);
  const top = mixHex(COLOR.amberTop, COLOR.board, 0.7 * dm);
  const foot = mixHex(COLOR.amberFoot, COLOR.boardFoot, 0.7 * dm);
  const hot = EDGE.HOT / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(box.y)} x2="0" y2={f3(box.y + box.h)}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={foot} />
        </linearGradient>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall * (1 - dm)} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g style={glow && dm < 0.5 ? { filter: bloomFilter(k) } : undefined}>
        <path d={rectPath(box.x, box.y, box.w, box.h, box.r)} fill={`url(#${uid}a)`} />
      </g>
      <path d={rectPath(box.x, box.y, box.w, Math.min(box.h, EDGE.HOT_FALL / k), box.r, true, false)} fill={`url(#${uid}h)`} />
      <path d={`M${f3(box.x + box.r)} ${f3(box.y + hot / 2)}H${f3(box.x + box.w - box.r)}`} stroke={COLOR.amberHot} strokeOpacity={f3(1 - dm)} strokeWidth={f3(hot)} />
      <text
        x={f3(box.x + box.w / 2)}
        y={f3(box.y + box.h / 2 + (0.718 * fs) / 2)}
        fontFamily={FONT_NUM}
        fontWeight={700}
        fontSize={f3(fs)}
        letterSpacing={`${TRACK.numeral}em`}
        textAnchor="middle"
        fill={COLOR.inkDark}
      >
        {text}
      </text>
    </g>
  );
};
/** The twine (tag-local, hole at (0, holeY)). "limp" = a short cotton loop tied through the hole that HANGS from it
 *  over the tag's face, a pendulum: `swing` = its angle from the tag's own down axis (PriceTag passes the world
 *  vertical minus the tag's angle plus its own swing, so it always hangs plumb); its lowest point stays above the
 *  sticker (TWINE.loop x h below the hole) and inside the tag's width (so it passes a slot with the tag). A point
 *  `to` (tag-local) = a taut strand from the hole to a hook (a hanging tag). */
export const TWINE = { loop: 0.24, spread: 0.075, width: 0.016 } as const;
const twinePath = (w: number, h: number, mode: "limp" | { x: number; y: number }, swing: number) => {
  const hy = TAG_ART.holeV * h;
  if (mode !== "limp") return `M0 ${f3(hy)}L${f3(mode.x)} ${f3(mode.y)}`;
  const a = swing * D2R;
  const L = TWINE.loop * h;
  const sp = TWINE.spread * w;
  // in the loop's own frame (down = +y), then turned by the swing about the hole
  const pts = [
    [0, 0],
    [-sp * 1.3, 0.32 * L],
    [-sp, 0.9 * L],
    [0, L],
    [sp, 0.9 * L],
    [sp * 1.3, 0.32 * L],
  ].map(([px, py]) => [px * Math.cos(a) - py * Math.sin(a), hy + px * Math.sin(a) + py * Math.cos(a)]);
  const P = (i: number) => `${f3(pts[i][0])} ${f3(pts[i][1])}`;
  return `M${P(0)}C${P(1)} ${P(2)} ${P(3)}C${P(4)} ${P(5)} ${P(0)}`;
};
export type PriceTagProps = {
  x: number;
  y: number;
  anchor?: "foot" | "hole";
  angle?: number;
  k: number;
  h?: number;
  elevation?: Elevation;
  lift?: number;
  dim?: number;
  /** false: no shadow (union it with what it touches: priceTagSil + StoutShadow) */
  shadow?: boolean;
  s?: number;
  /** the twine: "none" (the default: the punched hole alone says "tag"), "limp" (a loop hanging plumb from the hole
   *  over the face), or { to } a world point the tag hangs from (taut) */
  string?: "limp" | "none" | { to: { x: number; y: number } };
  /** the limp loop's own swing from plumb (deg, world), e.g. swingAt(...) lagging the tag's */
  stringSwing?: number;
  price?: string;
  /** a world clip rect: only the part inside is drawn (a tag still inside its slot) */
  clip?: { x: number; y: number; w: number; h: number };
};
/** World -> tag-local for a point (to aim the taut twine at a hook). */
const toLocal = (p: PriceTagProps, wx: number, wy: number) => {
  const h = p.h ?? TAG.h;
  const ay = (p.anchor ?? "foot") === "foot" ? h * TAG_ART.footV : TAG_ART.holeV * h;
  const a = -(p.angle ?? 0) * D2R;
  const dx = wx - p.x;
  const dy = wy - p.y;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) + ay };
};
/** The tag's silhouette parts (world, for a StoutShadow it shares with its tile). */
export const priceTagSil = (p: PriceTagProps): ShadowPart[] => {
  const h = p.h ?? TAG.h;
  const w = h * TAG_ART.aspect;
  const tf = tagPose(p.x, p.y, p.angle ?? 0, p.anchor ?? "foot", h);
  const out: ShadowPart[] = [];
  if (TAG_ART.src) out.push({ img: TAG_ART.src, x: -w / 2, y: 0, w, h, tf, clip: undefined });
  else out.push({ d: tagOutline(w, h) + circleD(0, TAG_ART.holeV * h, TAG_ART.holeR * w), tf });
  const str = p.string ?? "none";
  if (str !== "none") {
    const to = str === "limp" ? "limp" : toLocal(p, str.to.x, str.to.y);
    out.push({ d: twinePath(w, h, to, (p.stringSwing ?? 0) - (p.angle ?? 0)), stroke: TWINE.width * h, tf });
  }
  if (p.clip) return out.map((q) => ({ ...q, clip: undefined })).map((q) => wrapClip(q, p.clip!));
  return out;
};
const wrapClip = (q: ShadowPart, clip: { x: number; y: number; w: number; h: number }): ShadowPart => ({ ...q, clip });
/**
 * PriceTag — the clip's recurring object: one real paper swing tag (photo cut-out graded by PhotoCutOut's grade,
 * or the kraft placeholder of the same geometry until the photo is baked) with the amber $3.40 sticker printed on
 * it (PriceSticker) and its twine. Pose by `anchor` + (x, y) + `angle` (tagPose). One shadow (priceTagSil) unless
 * `shadow` false. `dim` tones paper, twine and sticker toward the board.
 */
export const PriceTag: React.FC<PriceTagProps> = (p) => {
  const uid = uidOf(useId());
  const h = p.h ?? TAG.h;
  const w = h * TAG_ART.aspect;
  const k = p.k;
  const s = p.s ?? SHADOW_S;
  const lift = clamp01(p.lift ?? 0);
  const elevation = p.elevation ?? "rest";
  const dm = clamp01(p.dim ?? 0);
  const tf = tagPose(p.x, p.y, p.angle ?? 0, p.anchor ?? "foot", h);
  const str = p.string ?? "none";
  const twine = str === "none" ? null : twinePath(w, h, str === "limp" ? "limp" : toLocal(p, str.to.x, str.to.y), (p.stringSwing ?? 0) - (p.angle ?? 0));
  const dy = -lift * LIFT_DY * s;
  const kraftTop = mixHex(mixHex("#D2B48A", COLOR.board, 0.0), COLOR.board, 0.75 * dm);
  const kraftFoot = mixHex(mixHex("#BE9C70", COLOR.boardFoot, 0.0), COLOR.boardFoot, 0.75 * dm);
  const hy = TAG_ART.holeV * h;
  const body = (
    <g transform={tf}>
      <defs>
        <linearGradient id={`${uid}k`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={f3(h)}>
          <stop offset="0" stopColor={kraftTop} />
          <stop offset="1" stopColor={kraftFoot} />
        </linearGradient>
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hy - 0.2 * w)} x2="0" y2={f3(hy + 0.45 * h)}>
          <stop offset="0" stopColor={mixHex(PALETTE_ROLES.twine, COLOR.board, 0.7 * dm)} />
          <stop offset="1" stopColor={mixHex(PALETTE_ROLES.twineFoot, COLOR.boardFoot, 0.7 * dm)} />
        </linearGradient>
      </defs>
      {TAG_ART.src ? (
        <PhotoBody uid={`${uid}p`} src={TAG_ART.src} box={{ x: -w / 2, y: 0, w, h }} g={GRADE} dim={dm} />
      ) : (
        <>
          <path d={tagOutline(w, h) + circleD(0, hy, TAG_ART.holeR * w)} fill={`url(#${uid}k)`} fillRule="evenodd" />
          {/* the punched hole's reinforcement ring, a shade of the kraft */}
          <path d={circleD(0, hy, 0.1 * w) + circleD(0, hy, TAG_ART.holeR * w)} fill={mixHex(kraftTop, COLOR.shadow, 0.12)} fillRule="evenodd" />
          {/* the lit top edge */}
          <path d={`M${f3(-w / 2 + 0.17 * w)} ${f3(EDGE.CREAM / k / 2)}H${f3(w / 2 - 0.17 * w)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dm) * 0.6} strokeWidth={f3(EDGE.CREAM / k)} />
        </>
      )}
      <PriceSticker box={stickerBox(w, h)} k={k} text={p.price ?? PRICE} dim={dm} />
      {twine ? <path d={twine} fill="none" stroke={`url(#${uid}t)`} strokeWidth={f3(TWINE.width * h)} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </g>
  );
  return (
    <g>
      {p.shadow === false ? null : <StoutShadow parts={priceTagSil(p)} s={s} elevation={elevation} lift={lift} />}
      {p.clip ? (
        <>
          <defs>
            <clipPath id={`${uid}c`}>
              <rect x={f3(p.clip.x)} y={f3(p.clip.y)} width={f3(p.clip.w)} height={f3(p.clip.h)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}c)`}>
            <g transform={dy ? `translate(0 ${fx(dy)})` : undefined}>{body}</g>
          </g>
        </>
      ) : (
        <g transform={dy ? `translate(0 ${fx(dy)})` : undefined}>{body}</g>
      )}
    </g>
  );
};

// ===========================================================================
// THE OPENAI SLOT TILE — the cream tile with the blossom and a slot in its top edge
// ===========================================================================
/** The tile's geometry (world): x = centre, floor = its lower edge. */
export const slotGeom = (x: number, floor: number, size: number = TILE.size) => {
  const top = floor - size;
  const sw = TILE.slotW * size;
  const sh = TILE.slotH * size;
  return { x, floor, size, top, r: TILE.radius * size, slot: { x0: x - sw / 2, x1: x + sw / 2, w: sw, h: sh, y: top } };
};
/** A world clip rect that keeps only what is ABOVE the slot mouth (a piece still partly inside the tile). */
export const slotClip = (x: number, floor: number, size: number = TILE.size, above = 4000) => {
  const g = slotGeom(x, floor, size);
  return { x: x - 4000, y: g.top - above, w: 8000, h: above };
};
/** The tile's own silhouette part (union it with whatever stands in its slot). */
export const slotTileSil = (x: number, floor: number, size: number = TILE.size): SilItem => {
  const g = slotGeom(x, floor, size);
  return { d: rectPath(x - size / 2, g.top, size, size, g.r) };
};
/**
 * OpenAISlotTile — a cream stout tile (MarkTile's card: cream -> creamFoot, lit top edge, radius 0.16 x size) with
 * the OpenAI blossom (macintoshShared Glyph "chatgpt", read-only) and a SLOT across its top edge (style "Slot
 * joint"): a dark slit TILE.slotW of the width; the lit edge stops at it; `occupant` (world width) adds the foot
 * occlusion of a piece standing in the slot. Draw pieces that go into / come out of the slot BEFORE the tile
 * as `children` (clipped with slotClip; drawn after the one shadow): the tile's face hides what is inside it. `extraSil` joins the tile's one shadow (a piece
 * in its slot is one object with it). `press` (world px) sinks the whole tile a little (the soft settle when a card
 * lands). `dim` tones the card and the mark toward the board.
 */
export const OpenAISlotTile: React.FC<{
  x: number;
  floor: number;
  k: number;
  size?: number;
  elevation?: Elevation;
  lift?: number;
  dim?: number;
  shadow?: boolean;
  s?: number;
  extraSil?: ShadowPart[];
  occupant?: number;
  press?: number;
  /** the pieces in the slot, drawn between the one shadow and the tile's face (draw them with shadow false) */
  children?: React.ReactNode;
}> = ({ x, floor, k, size = TILE.size, elevation = "rest", lift = 0, dim = 0, shadow = true, s = SHADOW_S, extraSil = [], occupant = 0, press = 0, children }) => {
  const uid = uidOf(useId());
  const g = slotGeom(x, floor + press, size);
  const dm = clamp01(dim);
  const d = rectPath(x - size / 2, g.top, size, size, g.r);
  const topC = mixHex(COLOR.cream, COLOR.board, dm);
  const footC = mixHex(COLOR.creamFoot, COLOR.boardFoot, dm);
  const edgeY = g.top + EDGE.CREAM / k / 2;
  const sw = f3(EDGE.CREAM / k);
  const edgeA = lerp(ALPHA.edge, ALPHA.edgeBoard, dm);
  const ao = Math.min(EDGE.FOOT_AO / k, 0.05 * size);
  return (
    <g>
      {shadow ? (
        <StoutShadow parts={[{ d }, ...extraSil]} s={s} elevation={elevation} lift={lift} contact={elevation === "rest" ? { x, y: g.floor, w: size } : null} />
      ) : null}
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(g.top)} x2="0" y2={f3(g.floor)}>
          <stop offset="0" stopColor={topC} />
          <stop offset="1" stopColor={footC} />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {children}
      {occupant > 0 ? <rect x={f3(x - occupant / 2)} y={f3(g.top - ao)} width={f3(occupant)} height={f3(ao)} fill={`url(#${uid}o)`} /> : null}
      <path d={d} fill={`url(#${uid}g)`} />
      <path d={`M${f3(x - size / 2 + g.r)} ${f3(edgeY)}H${f3(g.slot.x0)}M${f3(g.slot.x1)} ${f3(edgeY)}H${f3(x + size / 2 - g.r)}`} stroke={COLOR.edge} strokeOpacity={edgeA} strokeWidth={sw} />
      {/* the slot: a dark slit across the top edge, its lower lip catching a little light */}
      <path d={rectPath(g.slot.x0, g.top, g.slot.w, g.slot.h, g.slot.h / 2)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot + 0.2} />
      <path d={`M${f3(g.slot.x0 + g.slot.h)} ${f3(g.top + g.slot.h + EDGE.CREAM / k / 2)}H${f3(g.slot.x1 - g.slot.h)}`} stroke={COLOR.edge} strokeOpacity={edgeA * 0.5} strokeWidth={sw} />
      <Glyph id="chatgpt" x={x} y={g.top + size / 2 + 0.03 * size} size={size} color={mixHex(COLOR.inkDark, COLOR.boardFoot, 0.55 * dm)} />
    </g>
  );
};

// ===========================================================================
// THE PROMPT CARD — what "you give it": a chat input pill
// ===========================================================================
/** The card's outline (world): centred on (x, y); corner radius min(h / 2, CARD_R) (one row = a pill). */
export const CARD_R = 46;
const pillD = (x: number, y: number, w: number, h: number) => rectPath(x - w / 2, y - h / 2, w, h, Math.min(h / 2, CARD_R));
export const promptCardSil = (x: number, y: number, w: number = CARD.w, h: number = CARD.h): SilItem => ({ d: pillD(x, y, w, h) });
/** The two-row composer (cut 11): the same width (it fits the slot), taller. */
export const CARD2 = { w: 320, h: 132 } as const;
/** The caret's blink (on / off, a real text caret): `period` frames, on for the first `on` share. */
export const caretAt = (f: number, period = 16, on = 0.55, phase = 0) => (((f + phase) % period + period) % period < period * on ? 1 : 0);
/**
 * PromptCard — a cream card shaped like a chat input: ink word-bars (no real text) and a round ink send button with
 * a cream arrow (Lucide arrow-up geometry, round caps). `rows` 1 = a pill with three bars (CARD), 2 = the composer
 * with two rows of bars (CARD2) and the send button at the bottom right. `caret` 0..1 = a text caret after the last
 * bar (drive it with caretAt(f) for the blink). x, y = its centre; `angle` (deg) about the centre; one shadow
 * (promptCardSil) unless `shadow` false; `clip` = a world rect (still outside the slot); `dim` tones it toward the board.
 */
export const PromptCard: React.FC<{
  x: number;
  y: number;
  k: number;
  w?: number;
  h?: number;
  rows?: 1 | 2;
  caret?: number;
  angle?: number;
  elevation?: Elevation;
  lift?: number;
  dim?: number;
  shadow?: boolean;
  s?: number;
  clip?: { x: number; y: number; w: number; h: number };
}> = ({ x, y, k, rows = 1, w = rows === 2 ? CARD2.w : CARD.w, h = rows === 2 ? CARD2.h : CARD.h, caret = 0, angle = 0, elevation = "rest", lift = 0, dim = 0, shadow = true, s = SHADOW_S, clip }) => {
  const uid = uidOf(useId());
  const dm = clamp01(dim);
  const lt = clamp01(lift);
  const dy = -lt * LIFT_DY * s;
  const tf = angle ? `rotate(${fx(angle)} ${fx(x)} ${fx(y)})` : undefined;
  const d = pillD(x, y, w, h);
  const r = Math.min(h / 2, CARD_R);
  const u = Math.min(h, CARD.h); // the one-row card's height: bar and button sizes
  const ink = mixHex(COLOR.inkDark, COLOR.boardFoot, 0.5 * dm);
  const barInk = mixHex(mixHex(COLOR.inkDark, COLOR.cream, 0.18), COLOR.boardFoot, 0.5 * dm);
  const bh = 0.15 * u;
  const x0 = x - w / 2 + 0.42 * u;
  const gap = 0.045 * w;
  const bR = 0.34 * u;
  const bx = x + w / 2 - 0.5 * u;
  const by = rows === 2 ? y + h / 2 - 0.5 * u : y;
  const a = 0.36 * bR; // the arrow's half length
  const rowYs = rows === 2 ? [y - 0.2 * h, y + 0.2 * h] : [y];
  const rowBars = rows === 2 ? [[0.27, 0.16, 0.21], [0.19, 0.13]] : [[0.25, 0.13, 0.2]];
  const sil: ShadowPart[] = [{ d, tf, clip }];
  const barEls: React.ReactNode[] = [];
  let caretX = x0;
  rowYs.forEach((ry, ri) => {
    let cx = x0;
    rowBars[ri].forEach((L0, bi) => {
      const L = L0 * w;
      barEls.push(<path key={`${ri}-${bi}`} d={`M${f3(cx + bh / 2)} ${f3(ry)}H${f3(cx + L - bh / 2)}`} stroke={barInk} strokeWidth={f3(bh)} strokeLinecap="round" />);
      cx += L + gap;
    });
    caretX = cx - gap + 0.06 * u;
  });
  const caretY = rowYs[rowYs.length - 1];
  const body = (
    <g transform={tf}>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y - h / 2)} x2="0" y2={f3(y + h / 2)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dm)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dm)} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${uid}g)`} />
      <path d={`M${f3(x - w / 2 + r)} ${f3(y - h / 2 + EDGE.CREAM / k / 2)}H${f3(x + w / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dm)} strokeWidth={f3(EDGE.CREAM / k)} />
      {barEls}
      {caret > 0.001 ? (
        <path d={`M${f3(caretX)} ${f3(caretY - 0.24 * u)}V${f3(caretY + 0.24 * u)}`} stroke={ink} strokeWidth={f3(0.055 * u)} strokeLinecap="round" opacity={f3(clamp01(caret))} />
      ) : null}
      <circle cx={f3(bx)} cy={f3(by)} r={f3(bR)} fill={ink} />
      <path
        d={`M${f3(bx)} ${f3(by + a)}V${f3(by - a)}M${f3(bx - 0.72 * a)} ${f3(by - a + 0.72 * a)}L${f3(bx)} ${f3(by - a)}L${f3(bx + 0.72 * a)} ${f3(by - a + 0.72 * a)}`}
        stroke={mixHex(COLOR.cream, COLOR.board, dm)}
        strokeWidth={f3(0.26 * bR)}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
  return (
    <g>
      {shadow ? <StoutShadow parts={sil} s={s} elevation={elevation} lift={lt} /> : null}
      {clip ? (
        <>
          <defs>
            <clipPath id={`${uid}c`}>
              <rect x={f3(clip.x)} y={f3(clip.y)} width={f3(clip.w)} height={f3(clip.h)} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}c)`}>
            <g transform={dy ? `translate(0 ${fx(dy)})` : undefined}>{body}</g>
          </g>
        </>
      ) : (
        <g transform={dy ? `translate(0 ${fx(dy)})` : undefined}>{body}</g>
      )}
    </g>
  );
};

// ===========================================================================
// THE CUSTOMER BUST — macintoshShared's Bust drawing (copied: that module stays untouched) + `sour`
// ===========================================================================
// Geometry in HEAD UNITS (R = 60, origin = head centre, profile facing LEFT, y down), as macintoshShared.
const R = 60;
type P2 = [number, number];
const torsoD = (len: number) => {
  const y = BUST.shoulderY;
  const L = -BUST.frontX;
  const Rr = BUST.backX;
  const flare = 0.04 * (len - y - 54);
  return (
    `M${f3(L - flare)} ${len}C${f3(L - flare * 0.55)} ${f3(y + 54 + (len - y) * 0.35)} ${L} ${y + 120} ${L} ${y + 54}` +
    `C${L} ${y + 16} ${L + 22} ${y + 2} ${L + 50} ${y}` +
    `L-24 ${y}Q4 ${y + 26} 34 ${y}` +
    `L${Rr - 50} ${y}C${Rr - 20} ${y + 2} ${Rr} ${y + 16} ${Rr} ${y + 54}` +
    `C${Rr} ${y + 120} ${f3(Rr + flare * 0.55)} ${f3(y + 54 + (len - y) * 0.35)} ${f3(Rr + flare)} ${len}Z`
  );
};
const CREASE_END = BUST.shoulderY + 200;
const ARM_CREASES = [
  `M${-BUST.frontX + 30} ${BUST.shoulderY + 70}C${-BUST.frontX + 26} ${BUST.shoulderY + 110} ${-BUST.frontX + 24} ${BUST.shoulderY + 150} ${-BUST.frontX + 20} ${BUST.shoulderY + 200}`,
  `M${BUST.backX - 30} ${BUST.shoulderY + 70}C${BUST.backX - 26} ${BUST.shoulderY + 110} ${BUST.backX - 24} ${BUST.shoulderY + 150} ${BUST.backX - 20} ${BUST.shoulderY + 200}`,
];
const BODY_FADE = 330;
const NECK_D = `M-18 26L30 26L30 ${BUST.shoulderY + 30}L-18 ${BUST.shoulderY + 30}Z`;
const polar = (r: number, deg: number): P2 => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
const arcPts = (r: number, a0: number, a1: number, n = 24) => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) out.push(polar(r, lerp(a0, a1, i / n)));
  return out;
};
const ptsD = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${f3(p[0])} ${f3(p[1])}`).join("");
const cropD = () =>
  ptsD(arcPts(R * 1.07, 212, 402)) +
  `C${f3(0.62 * R)} ${f3(0.42 * R)} ${f3(0.3 * R)} ${f3(0.3 * R)} ${f3(0.22 * R)} ${f3(0.05 * R)}` +
  `C${f3(0.12 * R)} ${f3(-0.28 * R)} ${f3(-0.3 * R)} ${f3(-0.42 * R)} ${f3(-0.66 * R)} ${f3(-0.5 * R)}Z`;
const bobD = () =>
  ptsD(arcPts(R * 1.12, 196, 432)) +
  `C${f3(0.9 * R)} ${f3(1.06 * R)} ${f3(0.5 * R)} ${f3(1.04 * R)} ${f3(0.22 * R)} ${f3(0.86 * R)}` +
  `C${f3(0.08 * R)} ${f3(0.5 * R)} ${f3(0.06 * R)} ${f3(0.0 * R)} ${f3(-0.12 * R)} ${f3(-0.34 * R)}` +
  `C${f3(-0.4 * R)} ${f3(-0.46 * R)} ${f3(-0.7 * R)} ${f3(-0.4 * R)} ${f3(-0.98 * R)} ${f3(-0.3 * R)}Z`;
const ponyTailD = () =>
  `M${f3(0.78 * R)} ${f3(-0.62 * R)}C${f3(1.5 * R)} ${f3(-0.5 * R)} ${f3(1.62 * R)} ${f3(0.25 * R)} ${f3(1.32 * R)} ${f3(0.86 * R)}` +
  `C${f3(1.26 * R)} ${f3(0.4 * R)} ${f3(1.12 * R)} ${f3(-0.1 * R)} ${f3(0.86 * R)} ${f3(-0.2 * R)}Z`;
const HAIR_FRONT: Record<HairStyle, () => string[]> = {
  crop: () => [cropD()],
  bob: () => [bobD()],
  bun: () => [cropD(), circleD(0.6 * R, -0.86 * R, 0.36 * R)],
  curly: () => [cropD(), ...[214, 238, 262, 286, 310, 334, 358, 382].map((a) => circleD(...polar(1.0 * R, a), 0.27 * R))],
  pony: () => [cropD()],
  cap: () => [ptsD(arcPts(R * 1.05, 300, 400)) + `C${f3(0.6 * R)} ${f3(0.3 * R)} ${f3(0.4 * R)} ${f3(0.1 * R)} ${f3(0.42 * R)} ${f3(-0.3 * R)}Z`],
  bald: () => [],
};
const capD = () => {
  const crown = ptsD(arcPts(R * 1.09, 196, 352)) + `C${f3(0.4 * R)} ${f3(-0.22 * R)} ${f3(-0.5 * R)} ${f3(-0.36 * R)} ${f3(-1.05 * R)} ${f3(-0.3 * R)}Z`;
  const brim =
    `M${f3(-0.7 * R)} ${f3(-0.42 * R)}L${f3(-1.62 * R)} ${f3(-0.36 * R)}C${f3(-1.72 * R)} ${f3(-0.35 * R)} ${f3(-1.72 * R)} ${f3(-0.2 * R)} ${f3(-1.6 * R)} ${f3(-0.2 * R)}` +
    `L${f3(-0.7 * R)} ${f3(-0.22 * R)}Z`;
  return [crown, brim];
};
const HEAD_D = circleD(0, 0, R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R);
const LIGHT_TINT = "#FFF4E2";
const topOf = (c: string) => mixHex(c, LIGHT_TINT, 0.12);
const footOf = (c: string) => mixHex(c, COLOR.shadow, 0.14);
const DIM_TO = mixHex(COLOR.ground, COLOR.board, 0.22);
const bustTf = (x: number, y: number, r: number, facing: -1 | 1) => `translate(${f3(x)} ${f3(y)}) scale(${f3((-facing * r) / R)} ${f3(r / R)})`;
/** Bust's pose plus `sour` 0..1: the mouth turns into a small downturned arc, a short brow lowers over the eye,
 *  and the head droops a little on the face side (chin down, SOUR.droop deg). sour 0 = Bust exactly. */
export type CustomerPose = BustPose & { sour?: number };
export const SOUR = { droop: 4, mouthDown: 6, brow: 0.6 } as const;
/**
 * CustomerBust — x, y = the HEAD CENTRE (world); r = head radius; as macintoshShared's Bust (same drawing, same
 * props) with `pose.sour`. With sour 0 it renders the same SVG as Bust (pixel for pixel: the brow is not drawn,
 * the droop is 0 and the mouth string is Bust's). Draw CrowdShadow first, then the busts back to front.
 */
export const CustomerBust: React.FC<{ x: number; y: number; r: number; spec: BustSpec; facing?: -1 | 1; pose?: CustomerPose; bodyLen?: number }> = ({
  x,
  y,
  r,
  spec,
  facing = spec.facing,
  pose = {},
  bodyLen = BUST.bodyLen,
}) => {
  const uid = `mm${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const dim = clamp01(pose.dim ?? 0);
  const tone = (c: string) => (dim > 0.001 ? mixHex(c, DIM_TO, 0.85 * dim) : c);
  const skin = tone(spec.skin);
  const hair = tone(spec.hair);
  const top = tone(spec.top);
  const cap = tone(spec.cap ?? spec.hair);
  const ink = tone(COLOR.inkDark);
  const sour = clamp01(pose.sour ?? 0);
  // the droop: chin down toward the face side = a negative tilt (Bust's + tilt is chin up)
  const tilt = (pose.tilt ?? 0) - SOUR.droop * sour;
  const bob = pose.bob ?? 0;
  const smile = clamp01(pose.smile ?? 0) * (1 - sour);
  const content = clamp01(pose.content ?? 0);
  const blinkK = 1 - 0.85 * clamp01(pose.blink ?? 0);
  const [nx, ny] = BUST.neck;
  const md = SOUR.mouthDown * sour;
  // Bust's mouth (sour 0: identical numbers), its corners dropping and its middle rising with `sour`
  const mouth = `M${f3(-0.88 * R)} ${f3(0.44 * R - 1 + md)}Q${f3(-0.75 * R)} ${f3(0.44 * R + 1 + 7 * smile - 1.4 * md)} ${f3(-0.6 * R)} ${f3(0.44 * R - 2 - 3 * smile + 0.9 * md)}`;
  const eye: P2 = [-0.5 * R, -0.08 * R];
  const grad = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c)} />
      <stop offset="1" stopColor={footOf(c)} />
    </linearGradient>
  );
  // the brow: a short ink stroke above the eye, its inner (nose-side) end lowered with sour; drawn only when sour
  const browIn = smoothstep(sour / 0.45);
  const brow = `M${f3(eye[0] + 0.2 * R)} ${f3(eye[1] - 0.24 * R)}Q${f3(eye[0])} ${f3(eye[1] - 0.3 * R)} ${f3(eye[0] - 0.2 * R)} ${f3(eye[1] - 0.24 * R + SOUR.brow * 0.16 * R * sour)}`;
  return (
    <g transform={bustTf(x, y, r, facing)}>
      <defs>
        {grad("sk", skin, -60, 60)}
        {grad("hr", hair, -70, 70)}
        <linearGradient id={`${uid}tp`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(BUST.shoulderY)} x2="0" y2={f3(BUST.shoulderY + BODY_FADE)}>
          <stop offset="0" stopColor={topOf(top)} />
          <stop offset="0.3" stopColor={footOf(top)} />
          <stop offset="1" stopColor={mixHex(footOf(top), COLOR.ground, 0.84)} />
        </linearGradient>
        {grad("cp", cap, -70, -10)}
      </defs>
      <path d={NECK_D} fill={footOf(footOf(skin))} />
      <path d={torsoD(bodyLen)} fill={`url(#${uid}tp)`} />
      {(() => {
        const creases = ARM_CREASES.map((d, i) => <path key={i} d={d} stroke={footOf(footOf(top))} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.45} />);
        if (bodyLen >= CREASE_END + 2) return creases;
        return (
          <g>
            <defs>
              <clipPath id={`${uid}tc`}>
                <path d={torsoD(bodyLen)} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${uid}tc)`}>{creases}</g>
          </g>
        );
      })()}
      <path d={`M-24 ${BUST.shoulderY + 1}Q4 ${BUST.shoulderY + 27} 34 ${BUST.shoulderY + 1}`} stroke={footOf(footOf(top))} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
      <g transform={`translate(0 ${f3(-bob)}) rotate(${f3(-tilt)} ${nx} ${ny})`}>
        {spec.hairStyle === "pony" ? <path d={ponyTailD()} fill={`url(#${uid}hr)`} /> : null}
        <path d={HEAD_D} fill={`url(#${uid}sk)`} />
        <circle cx={0.16 * R} cy={0.1 * R} r={0.15 * R} fill={mixHex(skin, COLOR.shadow, 0.08)} />
        <circle cx={-0.42 * R} cy={0.3 * R} r={0.14 * R} fill="#D9846E" opacity={(0.3 + 0.12 * smile) * (1 - 0.6 * dim)} />
        <g opacity={f3(1 - content)}>
          <ellipse cx={eye[0]} cy={eye[1]} rx={0.095 * R} ry={f3(0.095 * R * blinkK)} fill={ink} />
        </g>
        {content > 0.001 ? (
          <path
            d={`M${f3(eye[0] - 0.13 * R)} ${f3(eye[1] + 0.02 * R)}Q${f3(eye[0])} ${f3(eye[1] - 0.13 * R)} ${f3(eye[0] + 0.13 * R)} ${f3(eye[1] + 0.02 * R)}`}
            stroke={ink}
            strokeWidth={3.6}
            strokeLinecap="round"
            fill="none"
            opacity={f3(content)}
          />
        ) : null}
        <path d={mouth} stroke={mixHex(ink, skin, 0.25)} strokeWidth={3.4} strokeLinecap="round" fill="none" />
        {spec.mustache ? (
          <path
            d={`M${f3(-0.98 * R)} ${f3(0.32 * R)}C${f3(-0.92 * R)} ${f3(0.2 * R)} ${f3(-0.62 * R)} ${f3(0.2 * R)} ${f3(-0.56 * R)} ${f3(0.34 * R)}C${f3(-0.7 * R)} ${f3(0.3 * R)} ${f3(-0.86 * R)} ${f3(0.4 * R)} ${f3(-0.98 * R)} ${f3(0.32 * R)}Z`}
            fill={`url(#${uid}hr)`}
          />
        ) : null}
        {HAIR_FRONT[spec.hairStyle]().map((d, i) => (
          <path key={i} d={d} fill={`url(#${uid}hr)`} />
        ))}
        {spec.hairStyle === "cap" ? capD().map((d, i) => <path key={`c${i}`} d={d} fill={`url(#${uid}cp)`} />) : null}
        {browIn > 0.001 ? <path d={brow} stroke={mixHex(ink, skin, 0.15)} strokeWidth={3.6} strokeLinecap="round" fill="none" opacity={f3(browIn)} /> : null}
        {spec.glasses ? (
          <g stroke={ink} strokeWidth={3.4} fill="none" strokeLinecap="round">
            <circle cx={eye[0] - 0.03 * R} cy={eye[1] + 0.02 * R} r={0.24 * R} />
            <path d={`M${f3(eye[0] + 0.21 * R)} ${f3(eye[1] - 0.02 * R)}L${f3(0.02 * R)} ${f3(-0.02 * R)}`} />
          </g>
        ) : null}
      </g>
    </g>
  );
};
