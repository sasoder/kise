// ---------------------------------------------------------------------------
// macintoshShared — the shared world of the clip "sam - personal agents haven't had their macintosh moment"
// (sam-macintosh-moment, Cheeky Pint S4E07, Sam Altman). Owned by the cut-16 builder (CantImagineLifeWithout);
// cut 26 (SmallNumberOfIdeasAway) imports it read-only. Later changes keep old exports and are logged in
// animation_source/notes/SHARED_CHANGES.md.
//
// WHAT IS HERE
//   CROWD            the ordered cast (10 specs: skin, hair, clothes, facing) — cut 16's speakers are CROWD[0..4],
//                    cut 26 reuses the list (cycled) as the mainstream crowd
//   Bust             a picture-book head-and-shoulders card figure in the cabinCast look (scott-free-wifi/cabinCast:
//                    big round head, nose bump, one dot eye, tiny mouth, blush dot, simple hair shapes, flat matte
//                    stout fills, top-lit ramp per part, no outlines). Head in PROFILE (facing -1 left / +1 right),
//                    shoulders frontal, the body running straight down `bodyLen`. NEVER realistic.
//   bustSil / CrowdShadow   the crowd's ONE shadow layer (every bust's union silhouette in one UnionShadow)
//   SpeechBubble     cream card bubble + tail (one shadow for the union), a mark inside that slides up in, and an
//                    amber heart that joins it beside the mark (the mark eases left to make room)
//   LoveHeart        the amber heart (band gradient, hot top, the fixed bloom)
//   CodexGlyph / ChatGPTGlyph / DotsGlyph   the three real marks redrawn as one-colour ink stamps (inline paths),
//                    sized as ONE family by stoutShared's opticalFit (pass the tile size they sit in)
//   CodexMark / ChatGPTMark / DotsMark      the same marks on a cream TILE (MarkTile: one shadow, lit top edge)
//
// SOURCES (images/logos/LOGOS_READY.md of the clip, image agent 2026-10-28)
//   ChatGPT = the OpenAI blossom (2025 symbol), Commons "File:OpenAI logo 2025 (symbol).svg"; chatgpt.com uses the
//     same blossom as its favicon ("ChatGPT blossom logo").
//   Codex = the 2025-26 Codex app icon (scalloped cloud with a ">_" prompt knocked out), lobehub icons codex.svg
//     (@lobehub/icons-static-svg 1.101.0, mark (c) OpenAI): the blob is ink, the prompt stays tile.
//   Dots = OpenAI's "dots" icon, a thick solid ring (chatgpt.com/features/dots, dots-o-icon-updated.svg).
//   Fill / centroid of each mark measured off the 2048 px ink PNGs (alpha > 0.5 box): blossom 0.404, Codex 0.699,
//   ring 0.663, centroids ~0.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import {
  ALPHA,
  COLOR,
  EDGE,
  FONT_LABEL,
  FONT_NUM,
  TRACK,
  bloomFilter,
  clamp01,
  easeOutCubic,
  mixHex,
  opticalFit,
  rectPath,
  type Elevation,
} from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, type SilItem } from "../kits/cheeky-pint/museShared";
import { CLOTH, HAIR, SKIN, type HairStyle } from "../scott-free-wifi/cabinCast";

type P2 = [number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;
const uidOf = (raw: string) => `mm${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
export { CLOTH, HAIR, SKIN };
export type { HairStyle };

// ===========================================================================
// THE CAST
// ===========================================================================
export type BustSpec = {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  /** the cap's colour (hairStyle "cap") */
  cap?: string;
  glasses?: boolean;
  mustache?: boolean;
  /** which way the profile looks when the cut does not say: -1 left, +1 right */
  facing: -1 | 1;
};
/** The crowd, in a fixed order (cut 16 uses 0..4 as its five speakers, left to right). Varied skin, hair, clothes;
 *  clothes in the cabinCast's warm muted tones (never amber: amber is the love / the missing ideas). */
export const CROWD: BustSpec[] = [
  { skin: SKIN.light, hair: HAIR.ink, hairStyle: "bob", top: CLOTH.sage, facing: 1 },
  { skin: SKIN.deep, hair: HAIR.ink, hairStyle: "cap", cap: CLOTH.terracotta, top: CLOTH.oat, facing: -1 },
  { skin: SKIN.tan, hair: HAIR.chestnut, hairStyle: "curly", top: CLOTH.denim, glasses: true, facing: 1 },
  { skin: SKIN.cream, hair: HAIR.auburn, hairStyle: "bun", top: CLOTH.plum, facing: -1 },
  { skin: SKIN.board, hair: HAIR.grey, hairStyle: "bald", top: CLOTH.moss, glasses: true, mustache: true, facing: -1 },
  { skin: SKIN.deeper, hair: HAIR.ink, hairStyle: "pony", top: CLOTH.terracotta, facing: 1 },
  { skin: SKIN.light, hair: HAIR.sandy, hairStyle: "crop", top: CLOTH.slate, facing: -1 },
  { skin: SKIN.tan, hair: HAIR.ink, hairStyle: "crop", top: CLOTH.rust, facing: 1 },
  { skin: SKIN.deep, hair: HAIR.ink, hairStyle: "curly", top: CLOTH.cream, facing: -1 },
  { skin: SKIN.cream, hair: HAIR.chestnut, hairStyle: "bob", top: CLOTH.brown, facing: 1 },
];

// ===========================================================================
// THE BUST — geometry in HEAD UNITS (head radius R = 60, origin = head centre, profile facing LEFT, y down);
// a bust of world radius r is drawn at scale r / 60, mirrored for facing +1.
// ===========================================================================
const R = 60;
export const BUST = {
  R,
  /** the shoulder line (top of the torso card) below the head centre, head units */
  shoulderY: 68,
  /** the torso's half-widths from the bust axis (behind / in front of the face side), head units */
  backX: 94,
  frontX: 78,
  /** the neck pivot (head bob / tilt) */
  neck: [6, 52] as P2,
  /** default body length below the head centre, head units (runs off the bottom of the frame) */
  bodyLen: 840,
} as const;
/** the torso card: rounded shoulders, a crew-neck scoop, straight sides down to `len` (head units, facing left) */
const torsoD = (len: number) => {
  const y = BUST.shoulderY;
  const L = -BUST.frontX;
  const Rr = BUST.backX;
  // the sides flare out a little below the shoulders (an A-line: a torso with arms, never a straight column)
  const flare = 0.04 * (len - y - 54);
  return (
    `M${f3(L - flare)} ${len}C${f3(L - flare * 0.55)} ${f3(y + 54 + (len - y) * 0.35)} ${L} ${y + 120} ${L} ${y + 54}` +
    `C${L} ${y + 16} ${L + 22} ${y + 2} ${L + 50} ${y}` +
    `L-24 ${y}Q4 ${y + 26} 34 ${y}` +
    `L${Rr - 50} ${y}C${Rr - 20} ${y + 2} ${Rr} ${y + 16} ${Rr} ${y + 54}` +
    `C${Rr} ${y + 120} ${f3(Rr + flare * 0.55)} ${f3(y + 54 + (len - y) * 0.35)} ${f3(Rr + flare)} ${len}Z`
  );
};
/** where the arm creases end (head units below the head centre) */
const CREASE_END = BUST.shoulderY + 200;
/** the arms' inner creases (head units): where each hanging arm meets the chest, short soft folds (clipped to the
 *  torso when `bodyLen` ends above CREASE_END) */
const ARM_CREASES = [
  `M${-BUST.frontX + 30} ${BUST.shoulderY + 70}C${-BUST.frontX + 26} ${BUST.shoulderY + 110} ${-BUST.frontX + 24} ${BUST.shoulderY + 150} ${-BUST.frontX + 20} ${BUST.shoulderY + 200}`,
  `M${BUST.backX - 30} ${BUST.shoulderY + 70}C${BUST.backX - 26} ${BUST.shoulderY + 110} ${BUST.backX - 24} ${BUST.shoulderY + 150} ${BUST.backX - 20} ${BUST.shoulderY + 200}`,
];
/** how far below the shoulder line (head units) the body has sunk into the dim ground tone: the light falls on
 *  heads and shoulders, the bodies recede into the board below (they never read as columns / bars) */
export const BODY_FADE = 330;
const NECK_D = `M-18 26L30 26L30 ${BUST.shoulderY + 30}L-18 ${BUST.shoulderY + 30}Z`;

const polar = (r: number, deg: number): P2 => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
const arcPts = (r: number, a0: number, a1: number, n = 24) => {
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) out.push(polar(r, lerp(a0, a1, i / n)));
  return out;
};
const ptsD = (pts: P2[]) => pts.map((p, i) => `${i ? "L" : "M"}${f3(p[0])} ${f3(p[1])}`).join("");
const circleD = (cx: number, cy: number, r: number) =>
  `M${f3(cx + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(cx + r)} ${f3(cy)}Z`;
// the hair shapes: copied from cabinCast (head-local, R = 60, facing left)
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
/** the dim tone a receding bust drains to (toward the ground, never black) */
const DIM_TO = mixHex(COLOR.ground, COLOR.board, 0.22);

export type BustPose = {
  /** head tilt about the neck (deg, + = chin up toward the facing side) */
  tilt?: number;
  /** head lift (head units, + = up): a nod / a talking bob */
  bob?: number;
  /** 0 neutral .. 1 a clear smile */
  smile?: number;
  /** 0 open dot eye .. 1 a content closed arc */
  content?: number;
  /** 0 open .. 1 shut (a blink) */
  blink?: number;
  /** 0 lit .. 1 drained to the dim ground tone (by tone, never opacity) */
  dim?: number;
};
/** The transform of a bust's group (world): translate to the head centre, scale r/60, mirrored for facing +1
 *  (the head geometry is drawn facing left). */
const bustTf = (x: number, y: number, r: number, facing: -1 | 1) => `translate(${f3(x)} ${f3(y)}) scale(${f3((-facing * r) / R)} ${f3(r / R)})`;

/**
 * Bust — x, y = the HEAD CENTRE (world); r = the head radius (world px; head diameter 2r, hair adds ~7 %).
 * The body runs straight down `bodyLen` head units (default off the frame). Draw the crowd's shadow first
 * (CrowdShadow), then the busts back to front.
 */
export const Bust: React.FC<{ x: number; y: number; r: number; spec: BustSpec; facing?: -1 | 1; pose?: BustPose; bodyLen?: number }> = ({
  x,
  y,
  r,
  spec,
  facing = spec.facing,
  pose = {},
  bodyLen = BUST.bodyLen,
}) => {
  const uid = uidOf(useId());
  const dim = clamp01(pose.dim ?? 0);
  const tone = (c: string) => (dim > 0.001 ? mixHex(c, DIM_TO, 0.85 * dim) : c);
  const skin = tone(spec.skin);
  const hair = tone(spec.hair);
  const top = tone(spec.top);
  const cap = tone(spec.cap ?? spec.hair);
  const ink = tone(COLOR.inkDark);
  const tilt = pose.tilt ?? 0;
  const bob = pose.bob ?? 0;
  const smile = clamp01(pose.smile ?? 0);
  const content = clamp01(pose.content ?? 0);
  const blinkK = 1 - 0.85 * clamp01(pose.blink ?? 0);
  const [nx, ny] = BUST.neck;
  const mouth = `M${f3(-0.88 * R)} ${f3(0.44 * R - 1)}Q${f3(-0.75 * R)} ${f3(0.44 * R + 1 + 7 * smile)} ${f3(-0.6 * R)} ${f3(0.44 * R - 2 - 3 * smile)}`;
  const eye: P2 = [-0.5 * R, -0.08 * R];
  const grad = (id: string, c: string, y0: number, y1: number) => (
    <linearGradient id={`${uid}${id}`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y1)}>
      <stop offset="0" stopColor={topOf(c)} />
      <stop offset="1" stopColor={footOf(c)} />
    </linearGradient>
  );
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
      {/* the neck (in the chin's shadow), then the torso card over it with its crew-neck scoop */}
      <path d={NECK_D} fill={footOf(footOf(skin))} />
      <path d={torsoD(bodyLen)} fill={`url(#${uid}tp)`} />
      {(() => {
        const creases = ARM_CREASES.map((d, i) => <path key={i} d={d} stroke={footOf(footOf(top))} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.45} />);
        // a short body ends above the creases' foot: clip them to the torso card (a long body draws them as is)
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
      {/* the head: tilt about the neck, then the bob */}
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

/** A bust's union silhouette (head + hair as a slightly larger disc, nose, torso) for the crowd's one shadow. */
export const bustSil = (x: number, y: number, r: number, facing: -1 | 1, bodyLen: number = BUST.bodyLen): SilItem[] => [
  { d: circleD(0, 0, 1.08 * R) + circleD(-0.97 * R, 0.1 * R, 0.19 * R) + torsoD(bodyLen), tf: bustTf(x, y, r, facing) },
];
/** The crowd's ONE shadow layer: every bust's silhouette in one UnionShadow (they touch: one object). */
export const CrowdShadow: React.FC<{
  busts: { x: number; y: number; r: number; facing: -1 | 1; bodyLen?: number }[];
  elevation?: Elevation;
  lift?: number;
  strength?: number;
  /** the recipe's scale (shadows are drawn for TILE-scale objects): default r / 60 of the first bust */
  s?: number;
}> = ({ busts, elevation = "rest", lift = 0, strength = 1, s }) => (
  <UnionShadow
    sil={busts.flatMap((b) => bustSil(b.x, b.y, b.r, b.facing, b.bodyLen))}
    s={s ?? (busts[0] ? busts[0].r / R : 1)}
    elevation={elevation}
    lift={lift}
    strength={strength}
  />
);

/** Two seeded blinks over a cut (3 frames each) for cast member i. */
export const blinkAt = (i: number, f: number) => {
  const b1 = 11 + ((i * 37) % 23);
  const b2 = b1 + 33 + ((i * 17) % 19);
  const one = (b: number) => {
    const t = f - b;
    return t < 0 || t > 3 ? 0 : t < 1.5 ? t / 1.5 : (3 - t) / 1.5;
  };
  return Math.max(one(b1), one(b2));
};

// ===========================================================================
// THE MARKS — ink stamps, one family (opticalFit), centred on (x, y); `size` = the tile they sit in
// ===========================================================================
export type MarkId = "codex" | "chatgpt" | "dots";
/** the OpenAI blossom (2025 symbol) — ChatGPT's mark */
const BLOSSOM_D =
  "M11.248 18.25q-.825 0-1.568-.314a4.3 4.3 0 0 1-1.32-.874 4 4 0 0 1-1.304.214 4 4 0 0 1-2.046-.544 4.27 4.27 0 0 1-1.518-1.485 4 4 0 0 1-.56-2.095q0-.48.131-1.04A4.4 4.4 0 0 1 2.04 10.71a4.07 4.07 0 0 1 .017-3.4 4.2 4.2 0 0 1 1.056-1.418 3.8 3.8 0 0 1 1.6-.842 3.9 3.9 0 0 1 .76-1.683q.593-.759 1.451-1.188a4.04 4.04 0 0 1 1.832-.429q.825 0 1.567.313.742.314 1.32.875a4 4 0 0 1 1.304-.215q1.106 0 2.046.545a4.14 4.14 0 0 1 1.501 1.485q.578.941.578 2.095 0 .48-.132 1.04.66.61 1.023 1.419.363.792.363 1.666 0 .892-.38 1.717a4.3 4.3 0 0 1-1.072 1.435 3.8 3.8 0 0 1-1.584.825 3.8 3.8 0 0 1-.775 1.683 4.06 4.06 0 0 1-1.436 1.188 4.04 4.04 0 0 1-1.832.429m-4.076-2.062q.825 0 1.435-.347l3.103-1.782a.36.36 0 0 0 .164-.313v-1.42L7.881 14.62a.67.67 0 0 1-.726 0l-3.118-1.798a.5.5 0 0 1-.017.115v.198q0 .841.396 1.551.413.693 1.139 1.089a3.2 3.2 0 0 0 1.617.412m.165-2.69a.4.4 0 0 0 .181.05q.083 0 .165-.05l1.238-.71-3.977-2.31a.7.7 0 0 1-.363-.643v-3.58q-.825.362-1.32 1.122a2.9 2.9 0 0 0-.495 1.65q0 .809.413 1.55.412.743 1.072 1.123zm3.91 3.663q.875 0 1.585-.396a2.96 2.96 0 0 0 1.534-2.64v-3.564a.32.32 0 0 0-.165-.297l-1.254-.726v4.604a.7.7 0 0 1-.363.643l-3.119 1.799a3 3 0 0 0 1.783.577m.627-6.039V8.878L10.01 7.822 8.129 8.878v2.244l1.881 1.056zM7.057 5.859a.7.7 0 0 1 .363-.644l3.119-1.798a3 3 0 0 0-1.782-.578q-.874 0-1.584.396A2.96 2.96 0 0 0 6.05 4.324a3.07 3.07 0 0 0-.396 1.551v3.547q0 .199.165.314l1.237.726zm8.383 7.887q.825-.364 1.303-1.123.495-.758.495-1.65a3.15 3.15 0 0 0-.412-1.55q-.413-.743-1.073-1.123l-3.086-1.782q-.099-.065-.181-.049a.3.3 0 0 0-.165.05l-1.238.692 3.993 2.327a.6.6 0 0 1 .264.264.64.64 0 0 1 .1.363zm-3.317-8.382a.63.63 0 0 1 .726 0l3.135 1.831v-.297q0-.792-.396-1.501a2.86 2.86 0 0 0-1.105-1.155q-.71-.43-1.65-.43-.825 0-1.436.347L8.294 5.941a.36.36 0 0 0-.165.314v1.418z";
/** the Codex app icon: the scalloped cloud with ">_" knocked out (evenodd) */
const CODEX_D =
  "M8.086.457a6.105 6.105 0 013.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 00.107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 01-.18 1.631.167.167 0 00.04.155 5.982 5.982 0 011.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 01-2.934 1.851.162.162 0 00-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 00-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 01-2.595-.622 6.058 6.058 0 01-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 01-.495-1.283 6.11 6.11 0 01-.017-3.064.166.166 0 00.008-.074.115.115 0 00-.037-.064 5.958 5.958 0 01-1.38-2.202 5.196 5.196 0 01-.333-1.589 6.915 6.915 0 01.188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 00.087-.087A6.016 6.016 0 015.635 2.31C6.315 1.464 7.132.846 8.086.457zm-.804 7.85a.848.848 0 00-1.473.842l1.694 2.965-1.688 2.848a.849.849 0 001.46.864l1.94-3.272a.849.849 0 00.007-.854l-1.94-3.393zm5.446 6.24a.849.849 0 000 1.695h4.848a.849.849 0 000-1.696h-4.848z";
/** OpenAI's dots icon: a thick solid ring */
const DOTS_D =
  "M40.0391 0C62.152 0 80.0781 17.9261 80.0781 40.0391C80.0781 62.152 62.152 80.0781 40.0391 80.0781C17.9261 80.0781 0 62.152 0 40.0391C0 17.9261 17.9261 0 40.0391 0ZM40.0391 24.1992C31.2907 24.1992 24.1992 31.2907 24.1992 40.0391C24.1992 48.7874 31.2907 55.8789 40.0391 55.8789C48.7874 55.8789 55.8789 48.7874 55.8789 40.0391C55.8789 31.2907 48.7874 24.1992 40.0391 24.1992Z";
/** each mark's ink box in its own units, its silhouette fill and centroid offset (measured), its path */
export const MARKS: Record<MarkId, { box: [number, number, number, number]; fill: number; cy: number; d: string }> = {
  chatgpt: { box: [1.68, 1.75, 16.65, 16.5], fill: 0.404, cy: 0, d: BLOSSOM_D },
  codex: { box: [0, 0, 24, 24], fill: 0.699, cy: 0, d: CODEX_D },
  dots: { box: [0, 0, 80.08, 80.08], fill: 0.663, cy: 0, d: DOTS_D },
};
/** where a mark lands for a tile of `size` (world px): its scale and its drawn box width / height */
export const markFit = (id: MarkId, size: number) => {
  const m = MARKS[id];
  const fit = opticalFit(m.box[2], m.box[3], m.fill, m.cy, size);
  return { sc: fit.sc, w: m.box[2] * fit.sc, h: m.box[3] * fit.sc, dy: fit.cy - size / 2 };
};
export const Glyph: React.FC<{ id: MarkId; x: number; y: number; size: number; color?: string }> = ({ id, x, y, size, color = COLOR.inkDark }) => {
  const m = MARKS[id];
  const fit = markFit(id, size);
  const ox = x - (m.box[0] + m.box[2] / 2) * fit.sc;
  const oy = y + fit.dy - (m.box[1] + m.box[3] / 2) * fit.sc;
  return <path transform={`translate(${f3(ox)} ${f3(oy)}) scale(${f3(fit.sc)})`} d={m.d} fill={color} fillRule="evenodd" />;
};
type GlyphProps = { x: number; y: number; size: number; color?: string };
export const CodexGlyph: React.FC<GlyphProps> = (p) => <Glyph id="codex" {...p} />;
export const ChatGPTGlyph: React.FC<GlyphProps> = (p) => <Glyph id="chatgpt" {...p} />;
/** Dots: the ring; `wordmark` adds OpenAI's lowercase "dots" under it (FONT_NUM, ink) for a tile that must name it */
export const DotsGlyph: React.FC<GlyphProps & { wordmark?: boolean }> = ({ wordmark = false, ...p }) => {
  if (!wordmark) return <Glyph id="dots" {...p} />;
  const ring = 0.74 * p.size;
  const fs = 0.2 * p.size;
  return (
    <g>
      <Glyph id="dots" x={p.x} y={p.y - 0.11 * p.size} size={ring} color={p.color} />
      <text x={f3(p.x)} y={f3(p.y + 0.36 * p.size)} fontFamily={FONT_NUM} fontSize={f3(fs)} textAnchor="middle" fill={p.color ?? COLOR.inkDark} letterSpacing="-0.01em">
        dots
      </text>
    </g>
  );
};

/**
 * MarkTile — a mark on a cream card tile: one shadow (UnionShadow at `elevation`, `lift` toward the next level),
 * the lit top edge, the mark in ink by the optical rule. x = the tile's centre, floor = its bottom (world).
 * `dim` drains the card to board by tone. Exported as CodexMark / ChatGPTMark / DotsMark.
 */
export const MarkTile: React.FC<{
  mark: MarkId;
  x: number;
  floor: number;
  size: number;
  k: number;
  elevation?: Elevation;
  lift?: number;
  dim?: number;
  shadow?: number;
  radius?: number;
  wordmark?: boolean;
}> = ({ mark, x, floor, size, k, elevation = "rest", lift = 0, dim = 0, shadow = 1, radius, wordmark = false }) => {
  const uid = uidOf(useId());
  const r = radius ?? size * 0.16;
  const y0 = floor - size;
  const d = rectPath(x - size / 2, y0, size, size, r);
  const dm = clamp01(dim);
  const topC = mixHex(COLOR.cream, COLOR.board, dm);
  const footC = mixHex(COLOR.creamFoot, COLOR.boardFoot, dm);
  const s = size / 96;
  return (
    <g>
      <UnionShadow sil={[{ d }]} s={s} elevation={elevation} lift={lift} contact={elevation === "rest" ? { x, y: floor, w: size } : null} strength={shadow} />
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(floor)}>
          <stop offset="0" stopColor={topC} />
          <stop offset="1" stopColor={footC} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${uid}g)`} />
      <path d={`M${f3(x - size / 2 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x + size / 2 - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dm)} strokeWidth={f3(EDGE.CREAM / k)} />
      {mark === "dots" ? <DotsGlyph x={x} y={y0 + size / 2} size={size} wordmark={wordmark} /> : <Glyph id={mark} x={x} y={y0 + size / 2} size={size} />}
    </g>
  );
};
type MarkTileProps = Omit<React.ComponentProps<typeof MarkTile>, "mark">;
export const CodexMark: React.FC<MarkTileProps> = (p) => <MarkTile mark="codex" {...p} />;
export const ChatGPTMark: React.FC<MarkTileProps> = (p) => <MarkTile mark="chatgpt" {...p} />;
export const DotsMark: React.FC<MarkTileProps> = (p) => <MarkTile mark="dots" {...p} />;

// ===========================================================================
// THE HEART — amber, the clip's one glow (cut 16: the love people have for Codex / ChatGPT)
// ===========================================================================
/** a heart in a unit box (width 1, centred on 0,0; lobes at y -0.44, tip at +0.42) */
const HEART_UNIT =
  "M0 0.42C-0.1 0.31 -0.5 0.06 -0.5 -0.18C-0.5 -0.34 -0.38 -0.44 -0.25 -0.44C-0.12 -0.44 -0.03 -0.36 0 -0.25" +
  "C0.03 -0.36 0.12 -0.44 0.25 -0.44C0.38 -0.44 0.5 -0.34 0.5 -0.18C0.5 0.06 0.1 0.31 0 0.42Z";
export const heartPath = (x: number, y: number, w: number) => `translate(${f3(x)} ${f3(y)}) scale(${f3(w)})`;
/** LoveHeart — centred on (x, y), `w` wide (world). The amber band gradient top to tip with a hot top, the fixed
 *  bloom (never a pulse). `glow` 0..1 scales only the bloom's presence during the entrance. */
export const LoveHeart: React.FC<{ x: number; y: number; w: number; k: number; glow?: number }> = ({ x, y, w, k, glow = 1 }) => {
  const uid = uidOf(useId());
  return (
    <g style={{ filter: glow > 0.02 ? bloomFilter(k) : undefined }}>
      <defs>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} />
          <stop offset="0.22" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
      </defs>
      <path transform={heartPath(x, y, w)} d={HEART_UNIT} fill={`url(#${uid}h)`} />
    </g>
  );
};

// ===========================================================================
// THE SPEECH BUBBLE — a cream card: rounded body + a tail toward its speaker, ONE shadow for the union
// ===========================================================================
export type BubbleTail = {
  /** the tail's root on the body's bottom edge: x offset from the body centre (world) */
  root: number;
  /** the tail's tip (world) */
  tip: P2;
  /** the root's width (world) */
  width?: number;
};
/** the body and tail paths (world) */
export const bubbleGeom = (x: number, y: number, w: number, h: number, tail: BubbleTail, r = Math.min(h * 0.32, w * 0.2)) => {
  const body = rectPath(x - w / 2, y - h / 2, w, h, r);
  const yb = y + h / 2;
  const tw = tail.width ?? w * 0.2;
  const ax = x + tail.root - tw / 2;
  const bx = x + tail.root + tw / 2;
  const [tx, ty] = tail.tip;
  const L = ty - yb;
  // the two flanks bow the same way (toward the tip's side), so the tail reads as one curved wedge
  const lean = tx - (x + tail.root);
  const tailD =
    `M${f3(ax)} ${f3(yb - 12)}` +
    `C${f3(ax + lean * 0.1)} ${f3(yb + L * 0.4)} ${f3(tx - lean * 0.35 - tw * 0.18)} ${f3(ty - L * 0.3)} ${f3(tx)} ${f3(ty)}` +
    `C${f3(tx - lean * 0.45 + tw * 0.08)} ${f3(ty - L * 0.45)} ${f3(bx + lean * 0.05)} ${f3(yb + L * 0.3)} ${f3(bx)} ${f3(yb - 12)}Z`;
  return { body, tail: tailD, r, top: y - h / 2, bottom: yb };
};

/** the bubble's content layout (fractions of w / h): the mark's tile size, the heart's width, the gap mark-heart, the
 *  row's centre with and without a name under it, the name's baseline */
export const BUBBLE_LAYOUT = { markSize: 0.56, heartW: 0.36, gap: 0.06, rowDy: 0.0, rowDyLabelled: -0.13, labelBase: 0.335 } as const;

const entrance = (u: number, k: number) => {
  const a = easeOutCubic(clamp01(u));
  return { dy: ((1 - a) * 24) / k, opacity: a, blur: (6 * (1 - a)) / k };
};

/**
 * SpeechBubble — (x, y) = the body's centre (world), w x h its size. One shadow for body + tail (+ the heart, which
 * sits on the card) at `elevation` easing toward the next level by `lift` (a rising bubble floats, then settles).
 * The content is a ROW (mark, then heart) with an optional product NAME centred under it:
 *   `mark` slides up into the body by `markIn` (0..1, the house text entrance: 24 screen px, blur, opacity), clipped
 *   to the body; `label` (FONT_LABEL caps, inkDark, `labelPx` world px) comes in with it on the same entrance.
 *   `heartIn` (0..1): the mark eases left (leading by about half an entrance, so they never overlap) and the amber
 *   heart comes in beside it with the same entrance; mark + heart end centred as a pair.
 * `markSize` / `heartW` override the layout's fractions (world px).
 */
export const SpeechBubble: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  tail: BubbleTail;
  k: number;
  mark?: MarkId | null;
  markIn?: number;
  heartIn?: number;
  label?: string;
  labelPx?: number;
  markSize?: number;
  heartW?: number;
  elevation?: Elevation;
  lift?: number;
  shadow?: number;
  /** the shadow recipe's scale (default w / 180) */
  s?: number;
}> = ({ x, y, w, h, tail, k, mark = null, markIn = 0, heartIn = 0, label, labelPx = 30, markSize, heartW, elevation = "lifted", lift = 0, shadow = 1, s }) => {
  const uid = uidOf(useId());
  const g = bubbleGeom(x, y, w, h, tail);
  const L = BUBBLE_LAYOUT;
  const hIn = clamp01(heartIn);
  const mSize = markSize ?? L.markSize * w;
  const hW = heartW ?? L.heartW * w;
  const gap = L.gap * w;
  const mW = mark ? markFit(mark, mSize).w : 0;
  const rowY = y + (label ? L.rowDyLabelled : L.rowDy) * h;
  // the mark makes room first (it leads the heart by about half an entrance), so the two never overlap
  const shift = lerp(0, -(gap + hW) / 2, smoothRest((heartIn + 0.55) / 1.0));
  const heartX = x + (mW + gap) / 2;
  const me = entrance(markIn, k);
  const he = entrance(hIn, k);
  const comp = (TRACK.label * labelPx) / 2;
  return (
    <g>
      <UnionShadow sil={[{ d: g.body }, { d: g.tail }]} s={s ?? w / 180} elevation={elevation} lift={lift} strength={shadow} />
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(g.top)} x2="0" y2={f3(tail.tip[1])}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <path d={g.body} />
        </clipPath>
      </defs>
      <path d={g.tail} fill={`url(#${uid}g)`} />
      <path d={g.body} fill={`url(#${uid}g)`} />
      <path d={`M${f3(x - w / 2 + g.r)} ${f3(g.top + EDGE.CREAM / k / 2)}H${f3(x + w / 2 - g.r)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={f3(EDGE.CREAM / k)} />
      <g clipPath={`url(#${uid}c)`}>
        {mark && me.opacity > 0.002 ? (
          <g opacity={f3(me.opacity)} style={{ filter: me.blur > 0.05 ? `blur(${f3(me.blur)}px)` : undefined }}>
            <Glyph id={mark} x={x + shift} y={rowY + me.dy} size={mSize} />
            {label ? (
              <text
                x={f3(x + comp)}
                y={f3(y + L.labelBase * h + me.dy)}
                fontFamily={FONT_LABEL}
                fontWeight={500}
                fontSize={f3(labelPx)}
                letterSpacing={`${TRACK.label}em`}
                textAnchor="middle"
                fill={COLOR.inkDark}
                style={{ fontFeatureSettings: '"case" 1, "lnum" 1' }}
              >
                {label.toUpperCase()}
              </text>
            ) : null}
          </g>
        ) : null}
        {he.opacity > 0.002 ? (
          <g opacity={f3(he.opacity)}>
            <LoveHeart x={heartX} y={rowY + he.dy} w={hW} k={k} glow={he.opacity} />
          </g>
        ) : null}
      </g>
    </g>
  );
};
/** rest-to-rest for a short in-card move */
const smoothRest = (t: number) => {
  const c = clamp01(t);
  return c * c * c * (c * (c * 6 - 15) + 10);
};
