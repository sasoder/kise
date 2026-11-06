// ORG_WORLD_READY
import React, { useId } from "react";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  ALPHA,
  COLOR,
  EDGE,
  Label,
  StoutStage,
  amberBandFor,
  camFor,
  clamp01,
  labelWidth,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  toScreen,
  type Pool,
} from "../kits/cheeky-pint/stoutShared";
import { PEG, PegSlot, PersonPeg, pegGeometry, pegPath, sinkDepth } from "../kits/cheeky-pint/talentShared";
import { UnionShadow, circlePath, toneFoot, toneTop, type SilItem } from "../kits/cheeky-pint/museShared";
import { AUDI_MARK, FERRARI_MARK, REDBULL_MARK } from "./orgLogos";

// ===========================================================================
// orgWorld — THE TEAM PRINCIPALS' LINE, the one world of the clip "toto - i run mercedes like a 20 person
// company" (Cheeky Pint S4E01, Toto Wolff), stout system (stoutShared, palette B1; talentShared pegs;
// museShared shadows). Four cuts share it: A FerrariOneOfTen, B RedBullShareholders, C AudiHiredToRun,
// D ReportToSomeone. API notes: animation_source/notes/ORG_READY.md in the clip folder.
//
// THE WORLD (world px; up is negative y). One long cream LEDGE (the pit wall) along FLOOR_Y = 0, a slot per
// person standing on it. Left to right, in the order Toto names them:
//   FERRARI  x 0     ten pegs at pitch 84 (the principal 5th from the left, cream, headset); a bus rule over
//                    their heads, a stem up to the amber CEO on a cream "CEO" card; the prancing horse tile.
//   RED BULL x 960   one principal; a stem up to a cream "SHAREHOLDERS" platform carrying four amber pegs;
//                    the bulls-and-sun tile.
//   AUDI     x 1770  the principal's slot (+ a second slot at 1860); above, a tall narrow chain: three kraft
//                    managers on desk cards, an amber corporate top, the four-rings tile; one vertical rule.
// GRAMMAR. kraft = anyone, cream = the team principal, amber = the power to decide over him. Everything
// enters by rising out of a slot (pegs out of the ledge or a card's top edge; cards and tiles out of a slot
// cut in the board) and leaves by sinking back. Rules are printed on the board (no shadow) and draw by a
// moving tip. One shadow per object or touching group (the ledge + everyone standing on it = one).
// Edges, slot lines and rules are SCREEN px (pass the camera's k); everything else is world px.
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `ow${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
type P = [number, number];

// ===========================================================================
// LAYOUT (world px) — every builder reads these; never retype a number
// ===========================================================================
export const FLOOR_Y = 0;
/** An ordinary peg (talentShared PEG.S) and the principal (1.25x). */
export const PEG_SIZE = PEG.S; // 72
export const PRINCIPAL_SIZE = 90;
/** The pit wall: a cream ledge from x0 to x1, its top on FLOOR_Y, H thick. */
export const LEDGE = { x0: -1300, x1: 3100, h: 10 } as const;
/** Card text (world px, ink on cream): readable from k ~0.85 (29 px) up. */
export const CARD_TEXT = 34;
/** The "TEAM PRINCIPAL" card hanging under the ledge (world px). */
export const PLABEL = { text: "TEAM PRINCIPAL", gap: 6, h: 56, padX: 26, px: CARD_TEXT } as const;
/** A rule's width (SCREEN px) and its clearance from a head / a card (world px). */
export const RULE_W = 3;
export const HEAD_GAP = 10;
/** Logo tiles: cream cards with the mark stamped in ink; the mark's ink box fills MARK_FILL of the binding side. */
export const MARK_FILL = 0.8;

const ferrariXs = Array.from({ length: 10 }, (_, i) => (i - 4.5) * 84);
export const FERRARI = {
  x: 0,
  pitch: 84,
  /** all ten feet x, left to right */
  xs: ferrariXs,
  /** index of the principal in xs (5th from the left) */
  pIndex: 4,
  px: ferrariXs[4], // -42
  /** the nine others, left to right (FerrariState.row follows this order) */
  otherXs: ferrariXs.filter((_, i) => i !== 4),
  busY: -170,
  ceo: { x: 0, top: -300, w: 132, h: 54 }, // the CEO card: the peg's feet on its top edge
  tile: { x: 0, y: -480, w: 156, h: 156 }, // centre
} as const;

export const REDBULL = {
  x: 960,
  px: 960,
  card: { x: 960, top: -300, w: 380, h: 60, text: "SHAREHOLDERS", px: 30 },
  holderXs: [-126, -42, 42, 126].map((d) => 960 + d),
  tile: { x: 960, y: -480, w: 236, h: 140 },
} as const;

const AUDI_LEVELS = [-180, -320, -460];
export const AUDI = {
  x: 1770,
  px: 1770,
  /** the second hire's slot (cut C), right of the principal */
  secondX: 1860,
  /** the pay slip's slot on the ledge, left of the principal (cut C) */
  slipX: 1630,
  desk: { w: 112, h: 28 },
  /** desk tops (= the managers' feet), bottom to top */
  levels: AUDI_LEVELS,
  /** the corporate top's desk top */
  top: -600,
  tile: { x: 1770, y: -753, w: 240, h: 110 },
  slip: { w: 124, h: 50, text: "SALARY", px: 24 },
  chip: { w: 104, h: 30, text: "+ BONUS", px: 18 },
} as const;

/** Principal feet, per team. */
export const PRINCIPAL_AT = {
  ferrari: { x: FERRARI.px, y: FLOOR_Y },
  redbull: { x: REDBULL.px, y: FLOOR_Y },
  audi: { x: AUDI.px, y: FLOOR_Y },
} as const;

/** The reporting route of each principal, head -> the amber above him (world polylines, drawn order).
 *  Cut D's pulses travel these; Audi's ends at the corporate top's desk. */
export const REPORT_PATHS: Record<"ferrari" | "redbull" | "audi", P[]> = {
  ferrari: [
    [FERRARI.px, -PRINCIPAL_SIZE - HEAD_GAP],
    [FERRARI.px, FERRARI.busY],
    [FERRARI.ceo.x, FERRARI.busY],
    [FERRARI.ceo.x, FERRARI.ceo.top + FERRARI.ceo.h],
  ],
  redbull: [
    [REDBULL.px, -PRINCIPAL_SIZE - HEAD_GAP],
    [REDBULL.px, REDBULL.card.top + REDBULL.card.h],
  ],
  audi: [
    [AUDI.px, -PRINCIPAL_SIZE - HEAD_GAP],
    [AUDI.px, AUDI.top + AUDI.desk.h],
  ],
};
/** Audi's chain, desk by desk (cut D's dashed road): the bottom edge of each desk, bottom to top. */
export const AUDI_DESK_BOTTOMS = [...AUDI_LEVELS, AUDI.top].map((y) => y + AUDI.desk.h);

// ===========================================================================
// CAMERAS
// ===========================================================================
/** World -> screen (no sway). */
export const orgToScreen = (c: Cam, x: number, y: number) => toScreen(c, x, y);
/** A camera that puts world (wx, FLOOR_Y) at screen (sx, sy) with zoom k. */
export const ledgeCam = (wx: number, k: number, sy = 960, sx = 540): Cam => camFor(wx, FLOOR_Y, sx, sy, k);
/** Each structure at home: its principal's ledge at screen y 960 (Audi 985: its tower is tall), the whole structure readable, the tile top
 *  below y ~260, the neighbours fully off frame. */
export const HOME = {
  ferrari: ledgeCam(0, 1.05),
  redbull: ledgeCam(960, 1.05),
  audi: ledgeCam(1786, 0.885, 985),
} as const;
/** All three teams in one frame (cut D): principals ~40 px tall, the ledge at y 950. */
export const RECAP: Cam = ledgeCam(766, 0.444, 950);
/** The pool's home per team (world point the light follows) and its strength. */
export const POOL_AT = {
  ferrari: { x: 0, y: -240, strength: 1.6 },
  redbull: { x: 960, y: -240, strength: 1.6 },
  audi: { x: 1770, y: -380, strength: 1.6 },
  recap: { x: 766, y: -300, strength: 1.4 },
} as const;

/**
 * OrgStage — the set every cut uses: StoutStage (B1 ground, parallax + drift on the story clock S, pool, sway,
 * vignette, grain) with the world drawn under `cam`. S = frame + the cut's slot start (A 96, B 298, C 515,
 * D 1051). `rest` = the cut's opening camera (the ground's parallax origin).
 */
export const OrgStage: React.FC<{ S: number; cam: Cam; rest?: Cam; pool?: Pool; sway?: boolean; children?: React.ReactNode; overlay?: React.ReactNode }> = ({
  S,
  cam,
  rest,
  pool = null,
  sway = true,
  children,
  overlay,
}) => (
  <StoutStage S={S} cam={cam} rest={rest ?? cam} pool={pool} sway={sway} overlay={overlay}>
    {children}
  </StoutStage>
);

// ===========================================================================
// THE PEG GEOMETRY (talentShared's house bust, a 429-unit box; head and shoulders apart for the lit rim)
// ===========================================================================
const U = 429;
const HEAD = { cy: 327, r: 102 };
const SH_H = 204;
const headPath = (x: number, y: number, size: number, inset = 0) => {
  const u = size / U;
  const r = HEAD.r * u - inset / 2;
  const cy = y - HEAD.cy * u + inset / 2;
  return `M${f3(x + r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(x - r)} ${f3(cy)}A${f3(r)} ${f3(r)} 0 1 1 ${f3(x + r)} ${f3(cy)}Z`;
};
const shoulderPath = (x: number, y: number, size: number, inset = 0) => {
  const u = size / U;
  const q = (SH_H * u - inset) / (SH_H * u);
  const X = (a: number) => f3(x + (a - 255.5) * u);
  const Y = (b: number) => f3(y + (b - 470) * u * q);
  return (
    `M${X(41)} ${Y(458)}C${X(41)} ${Y(352)} ${X(126)} ${Y(266)} ${X(232)} ${Y(266)}L${X(279)} ${Y(266)}` +
    `C${X(385)} ${Y(266)} ${X(470)} ${Y(352)} ${X(470)} ${Y(458)}L${X(470)} ${Y(462)}Q${X(470)} ${Y(470)} ${X(462)} ${Y(470)}` +
    `L${X(49)} ${Y(470)}Q${X(41)} ${Y(470)} ${X(41)} ${Y(462)}Z`
  );
};

// --- the headset (ink), relative to the head: band over the top, one ear cup (viewer's right), a mic boom --
/** How far above its seat the headset starts when it is put on (x the peg's size). */
const HS_DROP = 0.55;
const headsetGeom = (x: number, feet: number, size: number, on: number) => {
  const g = pegGeometry(x, feet, size);
  const r = g.head.r;
  const cx = g.head.x;
  const cy = g.head.y - (1 - clamp01(on)) * HS_DROP * size;
  const R = r * 0.97;
  const a0 = (-168 * Math.PI) / 180;
  const a1 = (-12 * Math.PI) / 180;
  const band = `M${f3(cx + R * Math.cos(a0))} ${f3(cy + R * Math.sin(a0))}A${f3(R)} ${f3(R)} 0 0 1 ${f3(cx + R * Math.cos(a1))} ${f3(cy + R * Math.sin(a1))}`;
  const cup = { x: cx + r * 0.84, y: cy + r * 0.1, r: r * 0.36 };
  const pad = { x: cx - r * 0.93, y: cy - r * 0.14, r: r * 0.16 };
  const boom = `M${f3(cup.x - r * 0.08)} ${f3(cup.y + r * 0.3)}Q${f3(cup.x - r * 0.05)} ${f3(cy + r * 0.78)} ${f3(cx + r * 0.3)} ${f3(cy + r * 0.74)}`;
  const mic = { x: cx + r * 0.27, y: cy + r * 0.74, r: r * 0.15 };
  return { band, bandW: r * 0.22, boomW: r * 0.13, cup, pad, boom, mic, r };
};

// ===========================================================================
// THE PRINCIPAL (and any peg that must turn cream): a card peg whose tone runs kraft -> cream
// ===========================================================================
export type PrincipalState = {
  /** 0 = sunk in his slot (only the slot shows) .. 1 = standing */
  rise: number;
  /** 0 = kraft (board) .. 1 = cream (the subject) */
  warm: number;
  /** 0 = off (held above the head, unseen) .. 1 = on */
  headset: number;
  /** 0..1: the TEAM PRINCIPAL card's stout entrance (blur-in + 24 px slide-up); it also exits by this */
  label: number;
  /** 0..1 travel lift (a peg that moves lifts one elevation) */
  lift?: number;
};
/** The silhouette of a peg (cut at its slot line while sunk) + the headset when on: for one union shadow. */
export const principalSil = (x: number, y: number, size: number, rise: number, headset = 0): SilItem[] => {
  const sink = 1 - clamp01(rise);
  if (sink >= 0.995) return [];
  const feet = y + sinkDepth(sink, size);
  const clip = sink > 0 ? { x: x - size, y: y - 3 * size, w: 2 * size, h: 3 * size } : undefined;
  const out: SilItem[] = [{ d: pegPath(x, feet, size), clip }];
  if (headset > 0.6) {
    const h = headsetGeom(x, feet, size, headset);
    out.push({ d: circlePath(h.cup.x, h.cup.y, h.cup.r), clip });
    out.push({ d: h.band, stroke: h.bandW, clip });
  }
  return out;
};
/**
 * PrincipalPeg — a person cut from card, lit from above (talentShared's PersonPeg recipe) whose tone runs
 * kraft -> cream by `warm`, with the pit-wall headset (`headset` 0..1 lowers it onto the head) and `shade`
 * (0..1, the dim: the tone falls toward the ground's). `rise` 0..1 out of its slot (clipped at the slot
 * line: never shrinks or fades). `shadow` false when a group draws the one shadow (TeamLine does for the
 * ledge). Size: PRINCIPAL_SIZE for a principal, PEG_SIZE for an ordinary peg that turns cream (cut C).
 */
export const PrincipalPeg: React.FC<{
  x: number;
  y: number;
  k: number;
  size?: number;
  warm?: number;
  rise?: number;
  headset?: number;
  shade?: number;
  lift?: number;
  shadow?: boolean;
  slot?: "cream" | "ground" | null;
}> = ({ x, y, k, size = PRINCIPAL_SIZE, warm = 1, rise = 1, headset = 1, shade = 0, lift = 0, shadow = false, slot = null }) => {
  const uid = uidOf(useId());
  const s = 1 - clamp01(rise);
  const w = clamp01(warm);
  const sh = clamp01(shade);
  const dy = sinkDepth(s, size);
  const feet = y + dy;
  const g = pegGeometry(x, feet, size);
  const gone = s >= 0.995;
  const top = mixHex(mixHex(COLOR.board, COLOR.cream, w), COLOR.ground, sh * 0.7);
  const foot = mixHex(mixHex(COLOR.boardFoot, COLOR.creamFoot, w), COLOR.ground, sh * 0.7);
  const e = EDGE.CREAM / k;
  const rimA = lerp(ALPHA.edgeBoard, ALPHA.edge, w) * (1 - 0.6 * sh);
  const rim = (base: string) => mixHex(base, COLOR.edge, rimA);
  const ao = Math.min(EDGE.FOOT_AO / k, 0.2 * size);
  const hs = clamp01(headset);
  const H = headsetGeom(x, feet, size, hs);
  const hsA = smoothstep(hs / 0.45);
  const ink = mixHex(COLOR.inkDark, COLOR.ground, sh * 0.4);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(g.top)} x2="0" y2={f3(feet)}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={foot} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y - ao)} x2="0" y2={f3(y)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO * 1.6} />
        </linearGradient>
        <clipPath id={`${uid}s`}>
          <path d={pegPath(x, feet, size)} />
        </clipPath>
        <clipPath id={`${uid}c`}>
          <rect x={f3(x - size)} y={f3(y - 3 * size)} width={f3(2 * size)} height={f3(3 * size)} />
        </clipPath>
      </defs>
      {shadow && !gone ? <UnionShadow sil={principalSil(x, y, size, rise, hs)} s={size / 96} lift={lift} contact={{ x, y, w: size * 0.8 }} /> : null}
      {gone ? null : (
        <g clipPath={s > 0 ? `url(#${uid}c)` : undefined}>
          <path d={headPath(x, feet, size)} fill={rim(top)} />
          <path d={shoulderPath(x, feet, size)} fill={rim(mixHex(top, foot, 0.5))} />
          <path d={headPath(x, feet, size, e)} fill={`url(#${uid}b)`} />
          <path d={shoulderPath(x, feet, size, e)} fill={`url(#${uid}b)`} />
          <rect x={f3(x - size / 2 + (8 * size) / U)} y={f3(y - ao)} width={f3(size * (1 - 16 / U))} height={f3(ao)} fill={`url(#${uid}ao)`} clipPath={`url(#${uid}s)`} />
          {hs > 0.001 ? (
            <g opacity={f3(hsA)}>
              <path d={H.band} fill="none" stroke={ink} strokeWidth={f3(H.bandW)} strokeLinecap="round" />
              <path d={H.boom} fill="none" stroke={ink} strokeWidth={f3(H.boomW)} strokeLinecap="round" />
              <path d={circlePath(H.pad.x, H.pad.y, H.pad.r)} fill={ink} />
              <path d={circlePath(H.cup.x, H.cup.y, H.cup.r)} fill={ink} />
              <path d={circlePath(H.mic.x, H.mic.y, H.mic.r)} fill={ink} />
            </g>
          ) : null}
        </g>
      )}
      {slot ? <PegSlot x={x} y={y} size={size} k={k} on={slot} /> : null}
    </g>
  );
};

// ===========================================================================
// CARDS, TILES, LABELS
// ===========================================================================
/** The house entrance for a card that must be read (Label's: slide up 24 SCREEN px + fade + blur 6 -> 0). */
const entranceOf = (t: number) => {
  const a = 1 - Math.pow(1 - clamp01(t), 3);
  return { a, lift: (1 - a) * 24, blur: 6 * (1 - a) };
};
/** A cream card's body: one gradient (toned by dim), the lit top edge. */
const CardBody: React.FC<{ x0: number; y0: number; w: number; h: number; k: number; dim?: number; r?: number }> = ({ x0, y0, w, h, k, dim = 0, r = 4 }) => {
  const uid = uidOf(useId());
  const rr = Math.min(r, h / 2, w / 2);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor={toneTop(dim)} />
          <stop offset="1" stopColor={toneFoot(dim)} />
        </linearGradient>
      </defs>
      <path d={rectPath(x0, y0, w, h, rr)} fill={`url(#${uid}g)`} />
      <path
        d={`M${f3(x0 + rr)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x0 + w - rr)}`}
        stroke={COLOR.edge}
        strokeOpacity={f3(lerp(ALPHA.edge, ALPHA.edgeBoard, clamp01(dim)))}
        strokeWidth={f3(EDGE.CREAM / k)}
      />
    </g>
  );
};
/** A slot cut in the board (where a card or tile rises from): the stout slot line + a faint lit lower lip.
 *  It shows only while something stands in it or is rising out of it. */
const GroundSlot: React.FC<{ x: number; y: number; w: number; k: number; a: number }> = ({ x, y, w, k, a }) => {
  if (a <= 0.002) return null;
  const ww = w + (2 * EDGE.SLOT_LIP) / k;
  const h = EDGE.SLOT / k;
  return (
    <g opacity={f3(a)}>
      <rect x={f3(x - ww / 2)} y={f3(y - h / 2)} width={f3(ww)} height={f3(h)} fill={COLOR.shadow} fillOpacity={0.9} />
      <rect x={f3(x - ww / 2)} y={f3(y + h / 2)} width={f3(ww)} height={f3(1 / k)} fill={COLOR.board} fillOpacity={0.3} />
    </g>
  );
};
/** Where a rising card is: its top-left at `rise` (it comes up out of the slot at its bottom edge). */
const risen = (top: number, h: number, rise: number) => top + (1 - clamp01(rise)) * (h + 2);

/** Text centred in a card (world px size), ink. Uses stoutShared's Label so the face is Söhne Kräftig caps. */
const CardText: React.FC<{ x: number; cy: number; k: number; text: string; px: number; enter?: number; dim?: number }> = ({ x, cy, k, text, px, enter = 1 }) => (
  <Label x={x} y={cy + (px * 0.718) / 2} k={k} text={text} px={px * k} tone="dark" enter={enter} />
);

export type MarkId = "ferrari" | "redbull" | "audi";
/** A team mark stamped in ink on its tile's local box (w x h), centred: the ink box fills MARK_FILL of the
 *  binding side. Red Bull: ink sun, its bulls' keylines in the tile's own colour, ink bulls. */
const Mark: React.FC<{ id: MarkId; w: number; h: number; ink: string; tile: string }> = ({ id, w, h, ink, tile }) => {
  const box = id === "ferrari" ? FERRARI_MARK.ink : id === "redbull" ? REDBULL_MARK.ink : AUDI_MARK.ink;
  const [bx, by, bw, bh] = box;
  const sc = Math.min((MARK_FILL * w) / bw, (MARK_FILL * h) / bh) * (id === "audi" ? 0.92 : id === "ferrari" ? 1.08 : 1);
  const ox = w / 2 - (bx + bw / 2) * sc;
  const oy = h / 2 - (by + bh / 2) * sc;
  const tf = `translate(${fx(ox)} ${fx(oy)}) scale(${fx(sc)})`;
  if (id === "ferrari") return <path transform={tf} d={FERRARI_MARK.d} fill={ink} />;
  if (id === "audi")
    return (
      <g transform={tf}>
        <path transform={`translate(0 ${AUDI_MARK.ty})`} d={AUDI_MARK.d} fill={ink} />
      </g>
    );
  return (
    <g transform={tf}>
      <path d={REDBULL_MARK.sun} fill={ink} />
      {REDBULL_MARK.keyline.map((d, i) => (
        <path key={`k${i}`} d={d} fill={tile} fillRule="evenodd" />
      ))}
      {REDBULL_MARK.bulls.map((d, i) => (
        <path key={`b${i}`} d={d} fill={ink} fillRule="evenodd" />
      ))}
    </g>
  );
};
/**
 * LogoTile — a team's real mark as an ink stamp on a cream tile, centred on (x, y), w x h. It rises out of
 * a slot in the board at its bottom edge (`rise` 0..1, clipped at the slot line); `dim` tones it to board.
 * One shadow (its own, scaled to its size).
 */
export const LogoTile: React.FC<{ id: MarkId; x: number; y: number; w: number; h: number; k: number; rise?: number; dim?: number }> = ({ id, x, y, w, h, k, rise = 1, dim = 0 }) => {
  const uid = uidOf(useId());
  const ri = clamp01(rise);
  if (ri <= 0.001) return null;
  const bottom = y + h / 2;
  const y0 = risen(y - h / 2, h, ri);
  const x0 = x - w / 2;
  const clip = { x: x0 - 40, y: y0 - 40, w: w + 80, h: bottom - y0 + 40 };
  const tileTop = toneTop(dim);
  const ink = mixHex(COLOR.inkDark, COLOR.board, clamp01(dim) * 0.35);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f3(clip.x)} y={f3(clip.y)} width={f3(clip.w)} height={f3(clip.h)} />
        </clipPath>
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor={tileTop} />
          <stop offset="1" stopColor={toneFoot(dim)} />
        </linearGradient>
      </defs>
      <UnionShadow sil={[{ d: rectPath(x0, y0, w, h), clip }]} s={Math.min(w, h) / 96} contact={ri > 0.98 ? { x, y: bottom, w: w * 0.86 } : null} />
      <g clipPath={`url(#${uid}c)`}>
        <CardBody x0={x0} y0={y0} w={w} h={h} k={k} dim={dim} />
        <g transform={`translate(${fx(x0)} ${fx(y0)})`}>
          <Mark id={id} w={w} h={h} ink={ink} tile={`url(#${uid}t)`} />
        </g>
      </g>
      <GroundSlot x={x} y={bottom} w={w} k={k} a={Math.min(1, ri * 6)} />
    </g>
  );
};

/**
 * PrincipalLabel — the ink "TEAM PRINCIPAL" on a small cream card hanging just under the ledge, centred
 * on the principal's x; `t` 0..1 = the stout entrance (and exit, by running it back). Its own shadow.
 */
export const PrincipalLabel: React.FC<{ x: number; k: number; t: number; dim?: number; y?: number }> = ({ x, k, t, dim = 0, y = FLOOR_Y }) => {
  const en = entranceOf(t);
  if (en.a <= 0.002) return null;
  const w = labelWidth(PLABEL.text, PLABEL.px) + 2 * PLABEL.padX;
  const y0 = y + LEDGE.h + PLABEL.gap + en.lift / k;
  const x0 = x - w / 2;
  return (
    <g opacity={f3(en.a)} style={en.blur > 0.05 ? { filter: `blur(${f3(en.blur / k)}px)` } : undefined}>
      <UnionShadow sil={[{ d: rectPath(x0, y0, w, PLABEL.h) }]} s={0.6} />
      <CardBody x0={x0} y0={y0} w={w} h={PLABEL.h} k={k} dim={dim} />
      <CardText x={x} cy={y0 + PLABEL.h / 2} k={k} text={PLABEL.text} px={PLABEL.px} />
    </g>
  );
};
/** The label card's world rect (for collision / caption-band checks). */
export const principalLabelRect = (x: number, y = FLOOR_Y) => {
  const w = labelWidth(PLABEL.text, PLABEL.px) + 2 * PLABEL.padX;
  return { x: x - w / 2, y: y + LEDGE.h + PLABEL.gap, w, h: PLABEL.h };
};

// ===========================================================================
// RULES (reporting lines): printed on the board, cream, SCREEN-px width, drawn by a moving tip
// ===========================================================================
/** The part of a polyline from its start to fraction t of its length. */
export const partialPolyline = (pts: P[], t: number): P[] => {
  const u = clamp01(t);
  if (u <= 0 || pts.length < 2) return [];
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const L = seg.reduce((a, b) => a + b, 0);
  let left = u * L;
  const out: P[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(pts[i + 1]);
      left -= seg[i];
    } else {
      const f = seg[i] > 0 ? left / seg[i] : 0;
      out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]);
      break;
    }
  }
  return out;
};
/** A polyline's length (world px). */
export const polylineLength = (pts: P[]) => pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
/** The rule colour: lo cream (drawn) .. hi cream (`bright`, cut D) .. the ground (`dim`). */
export const ruleColor = (bright = 0, dim = 0) => mixHex(mixHex(COLOR.inkCreamLo, COLOR.inkCream, clamp01(bright)), COLOR.ground, clamp01(dim) * 0.55);
/** A rule along `pts`, drawn to fraction t. */
export const OrgRule: React.FC<{ pts: P[]; t?: number; k: number; bright?: number; dim?: number; w?: number }> = ({ pts, t = 1, k, bright = 0, dim = 0, w = RULE_W }) => {
  const p = partialPolyline(pts, t);
  if (p.length < 2) return null;
  return (
    <path
      d={`M${p.map((q) => `${f3(q[0])} ${f3(q[1])}`).join("L")}`}
      fill="none"
      stroke={ruleColor(bright, dim)}
      strokeWidth={f3(w / k)}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    />
  );
};

// ===========================================================================
// STATES — every channel 0..1; cuts drive them per frame
// ===========================================================================
export type FerrariState = {
  /** the horse tile rising out of its slot */
  tile: number;
  principal: PrincipalState;
  /** the nine others' rise, left to right (FERRARI.otherXs) */
  row: number[];
  /** each head's drop line, drawn up from the head to the bus */
  drops: number;
  /** optional: each head's own drop (10 values, xs order; overrides `drops`) */
  dropEach?: number[];
  /** optional: the nine others' drops draw DOWN from the bus to the head (the principal's always draws up) */
  dropsDown?: boolean;
  /** the bus, drawn outward at one speed from `busFrom` (default the stem, x 0) to both ends */
  bus: number;
  /** optional: where the bus starts drawing (world x) */
  busFrom?: number;
  /** the stem, drawn up from the bus to the CEO card */
  stem: number;
  /** the CEO card rising out of its slot; the CEO peg rising out of the card; its kraft -> amber blend */
  ceoCard: number;
  ceo: number;
  ceoAmber: number;
  /** the ink "CEO" on the card (stout entrance) */
  ceoLabel: number;
  /** rules brighter (cut D) */
  bright: number;
  /** the whole structure dimmed by tone (cut D) */
  dim: number;
};
export type RedBullState = {
  tile: number;
  principal: PrincipalState;
  /** the rule from his head up to the platform */
  stem: number;
  /** the platform card rising out of its slot */
  card: number;
  /** the four shareholders' rise, left to right (REDBULL.holderXs) */
  holders: number[];
  /** their kraft -> amber blend (together) */
  amber: number;
  /** the ink "SHAREHOLDERS" on the card */
  cardLabel: number;
  bright: number;
  dim: number;
};
export type AudiState = {
  tile: number;
  principal: PrincipalState;
  /** the second hire in AUDI.secondX's slot: rise and kraft -> cream */
  second: { rise: number; warm: number };
  /** the rule from the principal's head up to the lowest desk */
  link: number;
  /** the spine rule from the lowest desk up to the corporate top's desk (behind desks and pegs) */
  spine: number;
  /** the three desk cards and their managers, bottom to top */
  desks: number[];
  managers: number[];
  /** the corporate top: its desk, its peg, its kraft -> amber blend */
  topDesk: number;
  top: number;
  topAmber: number;
  /** cut C's pay slip rising out of the ledge at AUDI.slipX, and the "+ BONUS" chip landing on it */
  slip: number;
  chip: number;
  bright: number;
  dim: number;
};
export type WorldState = { ferrari: FerrariState; redbull: RedBullState; audi: AudiState };

const P_OFF: PrincipalState = { rise: 0, warm: 0, headset: 0, label: 0 };
const P_ON: PrincipalState = { rise: 1, warm: 1, headset: 1, label: 1 };
export const FERRARI_EMPTY: FerrariState = {
  tile: 0,
  principal: P_OFF,
  row: Array(9).fill(0),
  drops: 0,
  bus: 0,
  stem: 0,
  ceoCard: 0,
  ceo: 0,
  ceoAmber: 0,
  ceoLabel: 0,
  bright: 0,
  dim: 0,
};
export const FERRARI_DONE: FerrariState = {
  tile: 1,
  principal: P_ON,
  row: Array(9).fill(1),
  drops: 1,
  bus: 1,
  stem: 1,
  ceoCard: 1,
  ceo: 1,
  ceoAmber: 1,
  ceoLabel: 1,
  bright: 0,
  dim: 0,
};
export const REDBULL_EMPTY: RedBullState = {
  tile: 0,
  principal: P_OFF,
  stem: 0,
  card: 0,
  holders: Array(4).fill(0),
  amber: 0,
  cardLabel: 0,
  bright: 0,
  dim: 0,
};
/** Red Bull while cut A plays and as cut B opens: his principal already standing on the ledge, kraft, the
 *  headset on, no label; nothing above him yet. */
export const REDBULL_START: RedBullState = { ...REDBULL_EMPTY, principal: { rise: 1, warm: 0, headset: 1, label: 0 } };
export const REDBULL_DONE: RedBullState = {
  tile: 1,
  principal: P_ON,
  stem: 1,
  card: 1,
  holders: Array(4).fill(1),
  amber: 1,
  cardLabel: 1,
  bright: 0,
  dim: 0,
};
export const AUDI_EMPTY: AudiState = {
  tile: 0,
  principal: P_OFF,
  second: { rise: 0, warm: 0 },
  link: 0,
  spine: 0,
  desks: Array(3).fill(0),
  managers: Array(3).fill(0),
  topDesk: 0,
  top: 0,
  topAmber: 0,
  slip: 0,
  chip: 0,
  bright: 0,
  dim: 0,
};
/** Audi resolved (cut C's end): both slots filled and cream, the principal with headset and label, the
 *  chain built, the amber top, the tile, the pay slip with its bonus chip. Builder C may refine this under
 *  a new name (SHARED_CHANGES.md). */
export const AUDI_DONE: AudiState = {
  tile: 1,
  principal: P_ON,
  second: { rise: 1, warm: 1 },
  link: 1,
  spine: 1,
  desks: Array(3).fill(1),
  managers: Array(3).fill(1),
  topDesk: 1,
  top: 1,
  topAmber: 1,
  slip: 1,
  chip: 1,
  bright: 0,
  dim: 0,
};
/** The world as cut A ends and cut B opens. */
export const WORLD_AFTER_A: WorldState = { ferrari: FERRARI_DONE, redbull: REDBULL_START, audi: AUDI_EMPTY };
/** Everything resolved (cut D's recap). */
export const WORLD_DONE: WorldState = { ferrari: FERRARI_DONE, redbull: REDBULL_DONE, audi: AUDI_DONE };

// ===========================================================================
// THE LEDGE + whoever stands on it (one object, one shadow)
// ===========================================================================
export type LedgeSlot = { x: number; size: number; open?: boolean };
/** Everything standing on the ledge in a world state: silhouettes for the one shadow, and the slots. */
export const ledgeContents = (w: WorldState) => {
  const sil: SilItem[] = [];
  const slots: LedgeSlot[] = [];
  const F = w.ferrari;
  FERRARI.otherXs.forEach((x, i) => {
    sil.push(...principalSil(x, FLOOR_Y, PEG_SIZE, F.row[i] ?? 0));
    slots.push({ x, size: PEG_SIZE });
  });
  sil.push(...principalSil(FERRARI.px, FLOOR_Y, PRINCIPAL_SIZE, F.principal.rise, F.principal.headset));
  slots.push({ x: FERRARI.px, size: PRINCIPAL_SIZE });
  const R = w.redbull;
  sil.push(...principalSil(REDBULL.px, FLOOR_Y, PRINCIPAL_SIZE, R.principal.rise, R.principal.headset));
  slots.push({ x: REDBULL.px, size: PRINCIPAL_SIZE });
  const A = w.audi;
  sil.push(...principalSil(AUDI.px, FLOOR_Y, PRINCIPAL_SIZE, A.principal.rise, A.principal.headset));
  slots.push({ x: AUDI.px, size: PRINCIPAL_SIZE, open: A.principal.rise < 0.02 });
  sil.push(...principalSil(AUDI.secondX, FLOOR_Y, PEG_SIZE, A.second.rise));
  slots.push({ x: AUDI.secondX, size: PEG_SIZE, open: A.second.rise < 0.02 });
  if (A.slip > 0.001) {
    const r = slipRect(A.slip);
    sil.push({ d: rectPath(r.x, r.y, r.w, r.h), clip: { x: r.x - 20, y: -400, w: r.w + 40, h: 400 } });
  }
  return { sil, slots };
};
/**
 * TeamLine — the cream pit wall from LEDGE.x0 to x1 on FLOOR_Y, with its slots (a stout joint where a peg
 * stands, an open pocket where a slot is empty), and the ONE shadow of the ledge and of every silhouette
 * standing on it (`sil`, from ledgeContents). Draw it before the pegs that stand on it.
 */
export const TeamLine: React.FC<{ k: number; sil?: SilItem[]; slots?: LedgeSlot[]; dim?: number; x0?: number; x1?: number }> = ({
  k,
  sil = [],
  slots = [],
  dim = 0,
  x0 = LEDGE.x0,
  x1 = LEDGE.x1,
}) => {
  const d = rectPath(x0, FLOOR_Y, x1 - x0, LEDGE.h, 3);
  return (
    <g>
      <UnionShadow sil={[{ d }, ...sil]} s={0.75} />
      <CardBody x0={x0} y0={FLOOR_Y} w={x1 - x0} h={LEDGE.h} k={k} dim={dim} r={3} />
      {slots.map((s, i) => (
        <PegSlot key={i} x={s.x} y={FLOOR_Y} size={s.size} k={k} on="cream" open={s.open} />
      ))}
    </g>
  );
};

// ===========================================================================
// A CARD WITH PEGS STANDING ON IT (the CEO card, the shareholders' platform, a desk): one object, one shadow
// ===========================================================================
type CardPeg = { x: number; rise: number; amber: number };
const CardWithPegs: React.FC<{
  x: number;
  top: number;
  w: number;
  h: number;
  k: number;
  rise: number;
  pegs: CardPeg[];
  dim: number;
  band: [number, number];
  text?: { text: string; px: number; enter: number };
}> = ({ x, top, w, h, k, rise, pegs, dim, band, text }) => {
  const uid = uidOf(useId());
  const ri = clamp01(rise);
  if (ri <= 0.001) return null;
  const y0 = risen(top, h, ri);
  const x0 = x - w / 2;
  const bottom = top + h;
  const cardClip = { x: x0 - 40, y: y0 - 400, w: w + 80, h: bottom - y0 + 400 };
  const sil: SilItem[] = [{ d: rectPath(x0, y0, w, h), clip: cardClip }];
  for (const p of pegs) sil.push(...principalSil(p.x, y0, PEG_SIZE, p.rise));
  const shade = dim * 0.55;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f3(cardClip.x)} y={f3(cardClip.y)} width={f3(cardClip.w)} height={f3(cardClip.h)} />
        </clipPath>
      </defs>
      <UnionShadow sil={sil} s={0.9} contact={ri > 0.98 ? { x, y: bottom, w: w * 0.86 } : null} />
      <g clipPath={`url(#${uid}c)`}>
        <CardBody x0={x0} y0={y0} w={w} h={h} k={k} dim={dim} />
      </g>
      <GroundSlot x={x} y={bottom} w={w} k={k} a={Math.min(1, ri * 6)} />
      {pegs.map((p, i) => (
        <PersonPeg
          key={i}
          x={p.x}
          y={y0}
          k={k}
          size={PEG_SIZE}
          blend={p.amber * (1 - 0.75 * dim)}
          shade={shade}
          sink={1 - clamp01(p.rise)}
          shadow={false}
          slot={ri > 0.98 ? "cream" : null}
          amberBand={band}
        />
      ))}
      {text ? <CardText x={x} cy={y0 + h / 2} k={k} text={text.text} px={text.px} enter={text.enter} /> : null}
    </g>
  );
};

// ===========================================================================
// THE THREE TEAMS
// ===========================================================================
type TeamProps = { k: number; band: [number, number]; ledgePegShadows?: boolean };

/** Ferrari: the ten on the ledge, the bus and stem, the CEO on his card, the horse tile. The ledge pegs cast
 *  no shadow of their own (TeamLine casts the one shadow) unless `ledgePegShadows`. */
export const FerrariOrg: React.FC<TeamProps & { s: FerrariState }> = ({ k, band, s, ledgePegShadows = false }) => {
  const dim = s.dim;
  const shade = dim * 0.55;
  const pTop = -PRINCIPAL_SIZE - HEAD_GAP;
  const oTop = -PEG_SIZE - HEAD_GAP;
  const from = s.busFrom ?? FERRARI.ceo.x;
  const reach = Math.max(from - FERRARI.xs[0], FERRARI.xs[9] - from);
  const busL = Math.max(FERRARI.xs[0], from - clamp01(s.bus) * reach);
  const busR = Math.min(FERRARI.xs[9], from + clamp01(s.bus) * reach);
  return (
    <g>
      {/* rules (printed on the board, behind everything) */}
      {FERRARI.xs.map((x, i) => {
        const up: P[] = [
          [x, i === FERRARI.pIndex ? pTop : oTop],
          [x, FERRARI.busY],
        ];
        const pts = s.dropsDown && i !== FERRARI.pIndex ? [up[1], up[0]] : up;
        return <OrgRule key={i} pts={pts} t={s.dropEach?.[i] ?? s.drops} k={k} bright={s.bright} dim={dim} />;
      })}
      {s.bus > 0.001 && busR > busL ? <OrgRule pts={[[busL, FERRARI.busY], [busR, FERRARI.busY]]} k={k} bright={s.bright} dim={dim} /> : null}
      <OrgRule pts={[[FERRARI.ceo.x, FERRARI.busY], [FERRARI.ceo.x, FERRARI.ceo.top + FERRARI.ceo.h]]} t={s.stem} k={k} bright={s.bright} dim={dim} />
      {/* the ten on the ledge */}
      {FERRARI.otherXs.map((x, i) => (
        <PersonPeg key={i} x={x} y={FLOOR_Y} k={k} size={PEG_SIZE} tone="kraft" shade={shade} sink={1 - clamp01(s.row[i] ?? 0)} shadow={ledgePegShadows} />
      ))}
      <PrincipalPeg x={FERRARI.px} y={FLOOR_Y} k={k} warm={s.principal.warm * (1 - 0.8 * dim)} shade={shade * 0.5} rise={s.principal.rise} headset={s.principal.headset} lift={s.principal.lift} shadow={ledgePegShadows} />
      {/* the CEO */}
      <CardWithPegs
        x={FERRARI.ceo.x}
        top={FERRARI.ceo.top}
        w={FERRARI.ceo.w}
        h={FERRARI.ceo.h}
        k={k}
        rise={s.ceoCard}
        pegs={[{ x: FERRARI.ceo.x, rise: s.ceo, amber: s.ceoAmber }]}
        dim={dim}
        band={band}
        text={{ text: "CEO", px: CARD_TEXT, enter: s.ceoLabel }}
      />
      <LogoTile id="ferrari" {...FERRARI.tile} k={k} rise={s.tile} dim={dim} />
      <PrincipalLabel x={FERRARI.px} k={k} t={s.principal.label} dim={dim} />
    </g>
  );
};

/** Red Bull: the principal, the stem up to the shareholders' platform (four amber pegs), the bulls tile. */
export const RedBullOrg: React.FC<TeamProps & { s: RedBullState }> = ({ k, band, s, ledgePegShadows = false }) => {
  const dim = s.dim;
  const C = REDBULL.card;
  return (
    <g>
      <OrgRule pts={REPORT_PATHS.redbull} t={s.stem} k={k} bright={s.bright} dim={dim} />
      <PrincipalPeg x={REDBULL.px} y={FLOOR_Y} k={k} warm={s.principal.warm * (1 - 0.8 * dim)} shade={dim * 0.3} rise={s.principal.rise} headset={s.principal.headset} lift={s.principal.lift} shadow={ledgePegShadows} />
      <CardWithPegs
        x={C.x}
        top={C.top}
        w={C.w}
        h={C.h}
        k={k}
        rise={s.card}
        pegs={REDBULL.holderXs.map((x, i) => ({ x, rise: s.holders[i] ?? 0, amber: s.amber }))}
        dim={dim}
        band={band}
        text={{ text: C.text, px: C.px, enter: s.cardLabel }}
      />
      <LogoTile id="redbull" {...REDBULL.tile} k={k} rise={s.tile} dim={dim} />
      <PrincipalLabel x={REDBULL.px} k={k} t={s.principal.label} dim={dim} />
    </g>
  );
};

/** The pay slip's world rect at rise r (it stands on the ledge at AUDI.slipX). */
export const slipRect = (r = 1) => ({ x: AUDI.slipX - AUDI.slip.w / 2, y: risen(-AUDI.slip.h, AUDI.slip.h, r), w: AUDI.slip.w, h: AUDI.slip.h });

/** Audi: the empty (or filled) slots, the chain of desks with kraft managers, the amber top, the rings tile,
 *  the rule up the middle, the pay slip. */
export const AudiOrg: React.FC<TeamProps & { s: AudiState }> = ({ k, band, s, ledgePegShadows = false }) => {
  const uid = uidOf(useId());
  const dim = s.dim;
  const D = AUDI.desk;
  const linkPts: P[] = [
    [AUDI.px, -PRINCIPAL_SIZE - HEAD_GAP],
    [AUDI.px, AUDI.levels[0] + D.h],
  ];
  const spinePts: P[] = [
    [AUDI.px, AUDI.levels[0] + D.h],
    [AUDI.px, AUDI.top + D.h],
  ];
  const slip = slipRect(s.slip);
  const chip = entranceOf(s.chip);
  return (
    <g>
      <OrgRule pts={spinePts} t={s.spine} k={k} bright={s.bright} dim={dim} />
      <OrgRule pts={linkPts} t={s.link} k={k} bright={s.bright} dim={dim} />
      {/* the two hires on the ledge */}
      <PrincipalPeg x={AUDI.px} y={FLOOR_Y} k={k} warm={s.principal.warm * (1 - 0.8 * dim)} shade={dim * 0.3} rise={s.principal.rise} headset={s.principal.headset} lift={s.principal.lift} shadow={ledgePegShadows} />
      <PrincipalPeg x={AUDI.secondX} y={FLOOR_Y} k={k} size={PEG_SIZE} warm={s.second.warm * (1 - 0.8 * dim)} shade={dim * 0.3} rise={s.second.rise} headset={0} shadow={ledgePegShadows} />
      {/* the pay slip (its shadow is in the ledge's) */}
      {s.slip > 0.001 ? (
        <g>
          <defs>
            <clipPath id={`${uid}sl`}>
              <rect x={f3(slip.x - 20)} y={-400} width={f3(slip.w + 40)} height={400} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${uid}sl)`}>
            <CardBody x0={slip.x} y0={slip.y} w={slip.w} h={slip.h} k={k} dim={dim} />
            <CardText x={AUDI.slipX} cy={slip.y + slip.h / 2} k={k} text={AUDI.slip.text} px={AUDI.slip.px} />
          </g>
          <PegSlot x={AUDI.slipX} y={FLOOR_Y} size={AUDI.slip.w + 8} k={k} on="cream" />
          {chip.a > 0.002 ? (
            <g opacity={f3(chip.a)} style={chip.blur > 0.05 ? { filter: `blur(${f3(chip.blur / k)}px)` } : undefined}>
              {(() => {
                const cx0 = AUDI.slipX - AUDI.chip.w / 2 + 14;
                const cy0 = slip.y - AUDI.chip.h * 0.55 + chip.lift / k;
                return (
                  <>
                    <UnionShadow sil={[{ d: rectPath(cx0, cy0, AUDI.chip.w, AUDI.chip.h) }]} s={0.4} />
                    <CardBody x0={cx0} y0={cy0} w={AUDI.chip.w} h={AUDI.chip.h} k={k} dim={dim} />
                    <CardText x={cx0 + AUDI.chip.w / 2} cy={cy0 + AUDI.chip.h / 2} k={k} text={AUDI.chip.text} px={AUDI.chip.px} />
                  </>
                );
              })()}
            </g>
          ) : null}
        </g>
      ) : null}
      {/* the chain, bottom to top */}
      {AUDI.levels.map((y, i) => (
        <CardWithPegs key={i} x={AUDI.px} top={y} w={D.w} h={D.h} k={k} rise={s.desks[i] ?? 0} pegs={[{ x: AUDI.px, rise: s.managers[i] ?? 0, amber: 0 }]} dim={dim} band={band} />
      ))}
      <CardWithPegs x={AUDI.px} top={AUDI.top} w={D.w} h={D.h} k={k} rise={s.topDesk} pegs={[{ x: AUDI.px, rise: s.top, amber: s.topAmber }]} dim={dim} band={band} />
      <LogoTile id="audi" {...AUDI.tile} k={k} rise={s.tile} dim={dim} />
      <PrincipalLabel x={AUDI.px} k={k} t={s.principal.label} dim={dim} />
    </g>
  );
};

/**
 * OrgWorld — the whole line in one call: the ledge with its one shadow, then the three teams. `cam` gives
 * k and the frame's amber band. Children (a cut's own extras) are drawn on top, in world px.
 */
export const OrgWorld: React.FC<{ cam: Cam; w: WorldState; ledgeDim?: number; children?: React.ReactNode }> = ({ cam, w, ledgeDim = 0, children }) => {
  const k = cam.k;
  const band = amberBandFor(cam);
  const L = ledgeContents(w);
  return (
    <g>
      <TeamLine k={k} sil={L.sil} slots={L.slots} dim={ledgeDim} />
      <FerrariOrg k={k} band={band} s={w.ferrari} />
      <RedBullOrg k={k} band={band} s={w.redbull} />
      <AudiOrg k={k} band={band} s={w.audi} />
      {children}
    </g>
  );
};

// ===========================================================================
// LOAD-TIME CHECKS (the framing the four cuts rely on)
// ===========================================================================
{
  const fail = (m: string) => {
    throw new Error(`orgWorld: ${m}`);
  };
  const sx = (c: Cam, x: number) => toScreen(c, x, 0).x;
  const sy = (c: Cam, y: number) => toScreen(c, 0, y).y;
  const lab = principalLabelRect(0);
  // each home: ledge at 960, tile top below 260, label above the caption band, neighbours fully off frame
  const homes: [string, Cam, number, number, number][] = [
    // name, cam, structure top (world), left neighbour's right edge, right neighbour's left edge
    ["ferrari", HOME.ferrari, FERRARI.tile.y - FERRARI.tile.h / 2, -Infinity, REDBULL.card.x - REDBULL.card.w / 2],
    ["redbull", HOME.redbull, REDBULL.tile.y - REDBULL.tile.h / 2, FERRARI.xs[9] + PEG_SIZE / 2, AUDI.slipX - AUDI.slip.w / 2],
    ["audi", HOME.audi, AUDI.tile.y - AUDI.tile.h / 2, REDBULL.card.x + REDBULL.card.w / 2, Infinity],
  ];
  for (const [n, c, top, l, r] of homes) {
    if (Math.abs(sy(c, FLOOR_Y) - (n === "audi" ? 985 : 960)) > 0.5) fail(`${n}: ledge at ${sy(c, FLOOR_Y)}`);
    if (sy(c, top) < 260) fail(`${n}: tile top at y ${sy(c, top).toFixed(0)}`);
    if (sy(c, lab.y + lab.h) > 1065) fail(`${n}: label bottom at y ${sy(c, lab.y + lab.h).toFixed(0)}`);
    if (Number.isFinite(l) && sx(c, l) > -12) fail(`${n}: left neighbour shows (x ${sx(c, l).toFixed(0)})`);
    if (Number.isFinite(r) && sx(c, r) < 1092) fail(`${n}: right neighbour shows (x ${sx(c, r).toFixed(0)})`);
  }
  // the recap: everything inside the frame, principals >= ~40 px
  const left = FERRARI.xs[0] - PEG_SIZE / 2;
  const right = Math.max(AUDI.secondX + PEG_SIZE / 2, AUDI.tile.x + AUDI.tile.w / 2, principalLabelRect(AUDI.px).x + principalLabelRect(AUDI.px).w);
  if (sx(RECAP, left) < 12 || sx(RECAP, right) > 1068) fail(`recap: ${sx(RECAP, left).toFixed(0)}..${sx(RECAP, right).toFixed(0)}`);
  if (PRINCIPAL_SIZE * RECAP.k < 39.5) fail(`recap: principal ${(PRINCIPAL_SIZE * RECAP.k).toFixed(1)} px`);
  if (COLOR.amberTop !== "#FFB000") fail("palette must be B1");
}

// ===========================================================================
// SHARED_CHANGES — additions by builder C (AudiHiredToRun, director rev 1); nothing above is changed.
// Logged in animation_source/notes/SHARED_CHANGES.md. Cut C ends close on the Audi ledge (k ~1.85), where the
// original slip text and "+ BONUS" chip are too small and the slip's text rose with its card; these names give
// the close-up versions, and the F1 tag the principal wears from cut C on. Cut D opens on AUDI_DONE_C via
// OrgWorldC (or AudiOrgC).
// ===========================================================================
/** The F1 logo (public/cheekypint2/dts/f1.svg, viewBox 320 x 80) without its ®. */
export const F1_MARK = {
  box: [0, 0, 320, 80] as const,
  d: "M45.2583 80L80.7417 45.575H80.7333C94.7167 32.0167 100.392 29.9583 127.058 29.9583H233.408L264.008 0H123.025C87.3333 0 77.2417 3.4 56.3083 24.1167L0 80H45.2583ZM127.7 34.7417H228.842L200.792 62.7917H128.225C114.925 62.7917 111.983 63.4167 105.383 70.0167L95.4 80H53.4333L84.4583 48.975C96.6417 36.8 100.842 34.7417 127.7 34.7417ZM320 0L239.783 80H190.175L270.175 0H320Z",
};
/** The tag on a PRINCIPAL_SIZE peg's chest: w x h (world px), its bottom `foot` above the peg's feet; the mark
 *  fills `fill` of its width. */
export const F1_TAG = { w: 64, h: 24, foot: 6, fill: 0.8 } as const;
/** F1Tag — the F1 mark stamped in ink on a tiny cream tag, on the chest of the peg whose feet are at (x, feet). */
export const F1Tag: React.FC<{ x: number; feet: number; k: number; dim?: number }> = ({ x, feet, k, dim = 0 }) => {
  const x0 = x - F1_TAG.w / 2;
  const y0 = feet - F1_TAG.foot - F1_TAG.h;
  const sc = (F1_TAG.fill * F1_TAG.w) / F1_MARK.box[2];
  const mx = x - (F1_MARK.box[2] * sc) / 2;
  const my = y0 + F1_TAG.h / 2 - (F1_MARK.box[3] * sc) / 2;
  const ink = mixHex(COLOR.inkDark, COLOR.board, clamp01(dim) * 0.35);
  return (
    <g>
      <UnionShadow sil={[{ d: rectPath(x0, y0, F1_TAG.w, F1_TAG.h, 3) }]} s={0.28} />
      <CardBody x0={x0} y0={y0} w={F1_TAG.w} h={F1_TAG.h} k={k} dim={dim} r={3} />
      <path transform={`translate(${fx(mx)} ${fx(my)}) scale(${fx(sc)})`} d={F1_MARK.d} fill={ink} />
    </g>
  );
};
/** The close-up "+ BONUS" chip (cap height >= 28 px at k 1.8): a second, smaller card stacked squarely ON the
 *  slip, centred on it, its bottom resting on the slip's top edge (rev 2: no longer straddling a corner).
 *  `inset` = how far each side sits in from the slip's sides (world px). */
export const AUDI_CHIP_C = { w: 116, h: 38, text: "+ BONUS", px: 22, inset: 4 } as const;
/** cut C's Audi state: AudiState + the slip's text entrance (after the card has landed) + the F1 tag on the
 *  principal. AudiOrgC draws `slip` / `chip` itself (the close-up versions); AudiOrg never sees them. */
export type AudiStateC = AudiState & { slipText: number; f1Tag: number };
export const AUDI_DONE_C: AudiStateC = { ...AUDI_DONE, slipText: 1, f1Tag: 1 };
export type WorldStateC = { ferrari: FerrariState; redbull: RedBullState; audi: AudiStateC };
export const WORLD_DONE_C: WorldStateC = { ferrari: FERRARI_DONE, redbull: REDBULL_DONE, audi: AUDI_DONE_C };
/** The chip's world rect at entrance t (its resting place at t = 1). */
export const chipRectC = (slipRise = 1) => {
  const s = slipRect(slipRise);
  return { x: AUDI.slipX - AUDI_CHIP_C.w / 2, y: s.y - AUDI_CHIP_C.h, w: AUDI_CHIP_C.w, h: AUDI_CHIP_C.h };
};
/** AudiPaySlipC — the pay slip rising out of its ledge slot with a BLANK face, then "SALARY" in whole
 *  (`text`, the stout entrance), then the "+ BONUS" chip landing on it (`chip`, the stout entrance). */
export const AudiPaySlipC: React.FC<{ k: number; slip: number; text: number; chip: number; dim?: number }> = ({ k, slip: rise, text, chip: chipT, dim = 0 }) => {
  const uid = uidOf(useId());
  if (rise <= 0.001) return null;
  const slip = slipRect(rise);
  const chip = entranceOf(chipT);
  const c = chipRectC(rise);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}sl`}>
          <rect x={f3(slip.x - 20)} y={-400} width={f3(slip.w + 40)} height={400} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${uid}sl)`}>
        <CardBody x0={slip.x} y0={slip.y} w={slip.w} h={slip.h} k={k} dim={dim} />
        {text > 0.001 ? <CardText x={AUDI.slipX} cy={slip.y + slip.h / 2} k={k} text={AUDI.slip.text} px={AUDI.slip.px} enter={text} /> : null}
      </g>
      <PegSlot x={AUDI.slipX} y={FLOOR_Y} size={AUDI.slip.w + 8} k={k} on="cream" />
      {chip.a > 0.002 ? (
        <g opacity={f3(chip.a)} style={chip.blur > 0.05 ? { filter: `blur(${f3(chip.blur / k)}px)` } : undefined}>
          <UnionShadow sil={[{ d: rectPath(c.x, c.y + chip.lift / k, c.w, c.h) }]} s={0.45} />
          <CardBody x0={c.x} y0={c.y + chip.lift / k} w={c.w} h={c.h} k={k} dim={dim} />
          <CardText x={c.x + c.w / 2} cy={c.y + chip.lift / k + c.h / 2} k={k} text={AUDI_CHIP_C.text} px={AUDI_CHIP_C.px} />
        </g>
      ) : null}
    </g>
  );
};
/** AudiOrgC — Audi with the close-up pay slip and chip, and the F1 tag on the principal (when f1Tag > 0.5). */
export const AudiOrgC: React.FC<TeamProps & { s: AudiStateC }> = ({ k, band, s, ledgePegShadows = false }) => (
  <g>
    <AudiOrg k={k} band={band} s={{ ...s, slip: 0, chip: 0 }} ledgePegShadows={ledgePegShadows} />
    <AudiPaySlipC k={k} slip={s.slip} text={s.slipText} chip={s.chip} dim={s.dim} />
    {s.f1Tag > 0.5 && s.principal.rise > 0.98 ? <F1Tag x={AUDI.px} feet={FLOOR_Y} k={k} dim={s.dim} /> : null}
  </g>
);
/** OrgWorldC — OrgWorld with AudiOrgC (the world as cut C ends it). */
export const OrgWorldC: React.FC<{ cam: Cam; w: WorldStateC; ledgeDim?: number; children?: React.ReactNode }> = ({ cam, w, ledgeDim = 0, children }) => {
  const k = cam.k;
  const band = amberBandFor(cam);
  const L = ledgeContents(w);
  return (
    <g>
      <TeamLine k={k} sil={L.sil} slots={L.slots} dim={ledgeDim} />
      <FerrariOrg k={k} band={band} s={w.ferrari} />
      <RedBullOrg k={k} band={band} s={w.redbull} />
      <AudiOrgC k={k} band={band} s={w.audi} />
      {children}
    </g>
  );
};
{
  // the close-up chip: its text fits with padding, it sits on the slip clear of the slip's text and of the principal
  const tw = labelWidth(AUDI_CHIP_C.text, AUDI_CHIP_C.px);
  if (tw > AUDI_CHIP_C.w - 14) throw new Error(`orgWorld (C): "+ BONUS" ${tw.toFixed(0)} wide in a ${AUDI_CHIP_C.w} chip`);
  const c = chipRectC(1);
  const s = slipRect(1);
  const textTop = s.y + s.h / 2 - (AUDI.slip.px * 0.718) / 2;
  if (c.y + c.h > textTop - 2) throw new Error("orgWorld (C): the chip covers SALARY");
  if (Math.abs(c.y + c.h - s.y) > 0.01) throw new Error("orgWorld (C): the chip does not rest on the slip's top edge");
  if (Math.abs(c.x - (s.x + AUDI_CHIP_C.inset)) > 0.01 || Math.abs(c.x + c.w - (s.x + s.w - AUDI_CHIP_C.inset)) > 0.01)
    throw new Error("orgWorld (C): the chip is not centred on the slip with its inset");
  if (c.x + c.w > AUDI.px - PRINCIPAL_SIZE / 2 - 8) throw new Error("orgWorld (C): the chip touches the principal");
}
