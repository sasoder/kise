// ORG_WORLD_READY (v2, REVISION_1)
import React, { useId } from "react";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { ALPHA, COLOR, EDGE, StoutStage, amberBandFor, camFor, clamp01, easeOutCubic, lerp, mixHex, rectPath, smoothstep, toScreen, type Pool } from "../kits/cheeky-pint/stoutShared";
import { PersonPeg, pegGeometry, pegPath } from "../kits/cheeky-pint/talentShared";
import { UnionShadow, circlePath, toneFoot, toneTop, type SilItem } from "../kits/cheeky-pint/museShared";
import { AUDI_MARK, FERRARI_MARK, REDBULL_MARK } from "./orgLogos";

// ===========================================================================
// orgWorld v2 — the one world of the clip "toto - i run mercedes like a 20 person company" (Cheeky Pint
// S4E01, Toto Wolff), stout system (stoutShared, palette B1; talentShared pegs; museShared shadows).
// Four cuts share it: A FerrariOneOfTen, B RedBullShareholders, C AudiHiredToRun, D ReportToSomeone.
// API notes: animation_source/notes/ORG_V2_READY.md in the clip folder. Design: REVISION_1.md.
//
// THE WORLD (world px; up is negative y). No ledge, no slots, no label cards, no boxes under people: pegs
// stand freely on the stout board, each with its own soft contact shadow. Thin cream rules (printed on the
// board, no shadow) are the reporting lines. Three structures side by side, every one mirror-symmetric
// about its own x, its principal's feet at (team x, FLOOR_Y):
//   FERRARI  x 0     the hub: the amber CEO (1.3x) at the ring's centre; ten reports on an ellipse
//                    (angles 90 + k x 36 deg, k = 0 at the bottom = the principal, cream with his headset);
//                    a spoke from each report in to the CEO; the prancing horse tile centred above.
//   RED BULL x 1020  the owners: the principal; above him four amber owners (1.3x) on a gentle arc; one
//                    stem from his head fanning into four branches; the bulls tile centred above.
//   AUDI     x 2040  the tower: the principal; above him three kraft managers stacked, the amber top (1.3x),
//                    the rings tile; one vertical rule from his head to the top's feet. Room beside him
//                    for the second hire (AUDI.secondX) and the pay props (AUDI.pay), drawn by cut C.
// HOME framings all share one zoom (K_HOME = 1: world px = screen px) and put the principal's feet at the
// SAME screen spot (540, FEET_SY), so moving between teams is a pure horizontal truck.
// GRAMMAR. kraft = anyone, cream = the team principal, amber = the power to decide over him. Everything
// appears by the stout entrance (blur in + 24 SCREEN px slide up + settle, its shadow growing in; `appear`
// 0..1) and leaves by running it back. Rules draw by a moving tip. One shadow per object.
// Rule widths are SCREEN px (pass the camera's k); everything else is world px.
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `ow${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
export type P = [number, number];

// ===========================================================================
// SIZES (world px)
// ===========================================================================
/** Where every principal's feet stand (world y). Not a drawn line. */
export const FLOOR_Y = 0;
/** An ordinary peg (a report, a manager, the second hire) and the principal: equal (he is one of ten). */
export const PEG_SIZE = 84;
export const PRINCIPAL_SIZE = 84;
/** A decision-maker (Ferrari's CEO, Red Bull's owners, Audi's top): ~1.3x, amber. */
export const BOSS_SIZE = 110;
/** A rule's width (SCREEN px) and its clearance from a body (world px). */
export const RULE_W = 3;
export const RULE_GAP = 10;
/** Logo tiles: cream cards with the mark stamped in ink; the mark's ink box fills MARK_FILL of the binding side. */
export const MARK_FILL = 0.8;
/** Every tile's top edge (world y): screen y 280 at HOME. */
const TILE_TOP = -750;

// ===========================================================================
// THE PEG SHAPE (talentShared's house bust: size wide x size tall, head circle on rounded shoulders)
// ===========================================================================
/** The point of a peg that rules aim at: inside the shoulders, on its axis. */
export const pegAnchor = (x: number, feet: number, size: number): P => [x, feet - 0.4 * size];
/** The visual centre of a peg (half its height). */
export const pegCentreY = (feet: number, size: number) => feet - size / 2;
const insideBust = (px: number, py: number, x: number, feet: number, size: number) => {
  const hr = 0.238 * size;
  const hy = feet - 0.762 * size;
  if ((px - x) ** 2 + (py - hy) ** 2 <= hr * hr) return true;
  const top = feet - 0.475 * size;
  if (py < top || py > feet) return false;
  const half = 0.5 * size;
  const ax = Math.abs(px - x);
  if (ax > half) return false;
  const r = 0.445 * size;
  if (py < top + r && ax > half - r) return (ax - (half - r)) ** 2 + (py - (top + r)) ** 2 <= r * r;
  return true;
};
/** Where a ray from a peg's anchor along unit direction (dx, dy) leaves its silhouette (+ `gap`). */
export const bustExit = (x: number, feet: number, size: number, dx: number, dy: number, gap = RULE_GAP): P => {
  const [ax, ay] = pegAnchor(x, feet, size);
  // the LAST point along the ray still inside (the ray may cross the neck's gap between shoulders and head)
  let t = 0;
  for (let u = 0; u < 2 * size; u += 0.25) if (insideBust(ax + dx * u, ay + dy * u, x, feet, size)) t = u;
  return [ax + dx * (t + gap), ay + dy * (t + gap)];
};
/** A rule between two pegs: from where it leaves peg A toward peg B, to where it meets peg B (each + gap). */
export const ruleBetween = (a: { x: number; feet: number; size: number }, b: { x: number; feet: number; size: number }, gap = RULE_GAP): P[] => {
  const [ax, ay] = pegAnchor(a.x, a.feet, a.size);
  const [bx, by] = pegAnchor(b.x, b.feet, b.size);
  const L = Math.hypot(bx - ax, by - ay);
  const dx = (bx - ax) / L;
  const dy = (by - ay) / L;
  return [bustExit(a.x, a.feet, a.size, dx, dy, gap), bustExit(b.x, b.feet, b.size, -dx, -dy, gap)];
};

// ===========================================================================
// LAYOUT (world px) — every builder reads these; never retype a number
// ===========================================================================
export type PegSpot = { x: number; feet: number; size: number };
const deg = Math.PI / 180;

const FX = 0;
const RX = 410;
const RY = 240;
const RING_CY = FLOOR_Y - PRINCIPAL_SIZE / 2 - RY; // -282: the ring's centre (and the CEO's visual centre)
/** Ring slot k (0..9): angle 90 + k*36 deg (screen convention, y down: 90 = bottom). k 0 = the principal;
 *  k 1..4 run up the LEFT side, 5 is the top, 6..9 come down the right; k and 10-k are mirror images. */
const ringSpot = (k: number): PegSpot & { angle: number; cy: number } => {
  const a = (90 + 36 * k) * deg;
  const x = FX + RX * Math.cos(a);
  const cy = RING_CY + RY * Math.sin(a);
  const size = k === 0 ? PRINCIPAL_SIZE : PEG_SIZE;
  return { x: Math.abs(x - FX) < 1e-9 ? FX : x, cy, feet: cy + size / 2, size, angle: (90 + 36 * k) % 360 };
};
const FERRARI_RING = Array.from({ length: 10 }, (_, k) => ringSpot(k));
const FERRARI_CEO: PegSpot = { x: FX, feet: RING_CY + BOSS_SIZE / 2, size: BOSS_SIZE };
export const FERRARI = {
  x: FX,
  px: FX,
  rx: RX,
  ry: RY,
  /** the ring's centre = the CEO's visual centre */
  cy: RING_CY,
  /** the ten reports in ring order (k 0 = the principal at the bottom) */
  ring: FERRARI_RING,
  /** the nine others, k 1..9 (FerrariState.others follows this order) */
  others: FERRARI_RING.slice(1),
  /** the symmetric wave outward from the principal: pairs of ring indices [k, 10 - k], then the top alone */
  wave: [[1, 9], [2, 8], [3, 7], [4, 6], [5]] as number[][],
  ceo: FERRARI_CEO,
  /** each report's spoke, report -> CEO (ring order) */
  spokes: FERRARI_RING.map((r) => ruleBetween(r, FERRARI_CEO)),
  tile: { x: FX, y: TILE_TOP + 72, w: 144, h: 144 }, // centre
} as const;

const RB = 1020;
const RB_OWNERS: PegSpot[] = [
  { x: RB - 330, feet: -385, size: BOSS_SIZE },
  { x: RB - 110, feet: -430, size: BOSS_SIZE },
  { x: RB + 110, feet: -430, size: BOSS_SIZE },
  { x: RB + 330, feet: -385, size: BOSS_SIZE },
];
const RB_FORK: P = [RB, -250];
const RB_P: PegSpot = { x: RB, feet: FLOOR_Y, size: PRINCIPAL_SIZE };
export const REDBULL = {
  x: RB,
  px: RB,
  /** the four owners, left to right (RedBullState.owners follows this order) */
  owners: RB_OWNERS,
  /** where the stem fans into four */
  fork: RB_FORK,
  /** the stem: from the principal's head up to the fork */
  stem: [bustExit(RB, FLOOR_Y, PRINCIPAL_SIZE, 0, -1), RB_FORK] as P[],
  /** the four branches: fork -> each owner's feet (left to right) */
  branches: RB_OWNERS.map((o) => {
    const [ox, oy] = [o.x, o.feet + RULE_GAP];
    return [RB_FORK, [ox, oy]] as P[];
  }),
  principal: RB_P,
  tile: { x: RB, y: TILE_TOP + 66, w: 224, h: 132 },
} as const;

const AU = 2040;
const AU_TILE = { x: AU, w: 240, h: 110 };
const AU_TILE_BOTTOM = TILE_TOP + AU_TILE.h;
const AU_GAP = (FLOOR_Y - PRINCIPAL_SIZE - AU_TILE_BOTTOM - 3 * PEG_SIZE - BOSS_SIZE) / 5; // ~38.8: the even gap up the tower
const AU_MANAGERS: PegSpot[] = [0, 1, 2].map((i) => ({ x: AU, feet: FLOOR_Y - PRINCIPAL_SIZE - AU_GAP - i * (PEG_SIZE + AU_GAP), size: PEG_SIZE }));
const AU_TOP: PegSpot = { x: AU, feet: AU_MANAGERS[2].feet - PEG_SIZE - AU_GAP, size: BOSS_SIZE };
export const AUDI = {
  x: AU,
  px: AU,
  gap: AU_GAP,
  /** the three kraft managers, bottom to top */
  managers: AU_MANAGERS,
  /** the amber corporate top */
  top: AU_TOP,
  /** the second hire (cut C) stands here, on FLOOR_Y, an ordinary peg */
  secondX: AU + 220,
  /** the pay props' room (cut C draws them), mirroring the second hire: centred on x, standing on FLOOR_Y,
   *  at most w x h */
  pay: { x: AU - 220, w: 190, h: 150 },
  /** the one rule: from the principal's head up to the top's feet (the pegs between stand over it) */
  rule: [bustExit(AU, FLOOR_Y, PRINCIPAL_SIZE, 0, -1), [AU, AU_TOP.feet + RULE_GAP]] as P[],
  tile: { x: AU, y: TILE_TOP + AU_TILE.h / 2, w: AU_TILE.w, h: AU_TILE.h },
} as const;

/** Principal feet, per team. */
export const PRINCIPAL_AT = {
  ferrari: { x: FERRARI.px, y: FLOOR_Y },
  redbull: { x: REDBULL.px, y: FLOOR_Y },
  audi: { x: AUDI.px, y: FLOOR_Y },
} as const;

/** The reporting route of each principal, head -> the amber above him (world polylines, drawn order).
 *  Cut D's pulses travel these. Red Bull's ends at the fork (the branches carry on to the four). */
export const REPORT_PATHS: Record<"ferrari" | "redbull" | "audi", P[]> = {
  ferrari: FERRARI.spokes[0],
  redbull: REDBULL.stem,
  audi: AUDI.rule,
};

// ===========================================================================
// CAMERAS
// ===========================================================================
/** World -> screen (no sway). */
export const orgToScreen = (c: Cam, x: number, y: number) => toScreen(c, x, y);
/** Every HOME's zoom and the principal's feet on screen (x 540). */
export const K_HOME = 1;
export const FEET_SY = 1030;
/** A camera that puts world (wx, FLOOR_Y) at screen (sx, sy) with zoom k. */
export const feetCam = (wx: number, k = K_HOME, sy = FEET_SY, sx = 540): Cam => camFor(wx, FLOOR_Y, sx, sy, k);
/** Each structure at home: centred, its principal's feet at (540, FEET_SY), zoom K_HOME. Only x differs. */
export const HOME = {
  ferrari: feetCam(FERRARI.x),
  redbull: feetCam(REDBULL.x),
  audi: feetCam(AUDI.x),
} as const;

/** Each team's world bounding box (pegs, tile; Audi's includes the second hire and the pay room). */
export const TEAM_BOX = (() => {
  const box = (spots: PegSpot[], tile: { x: number; y: number; w: number; h: number }, extra: [number, number, number, number][] = []) => {
    const r = [Infinity, Infinity, -Infinity, -Infinity];
    const add = (x0: number, y0: number, x1: number, y1: number) => {
      r[0] = Math.min(r[0], x0);
      r[1] = Math.min(r[1], y0);
      r[2] = Math.max(r[2], x1);
      r[3] = Math.max(r[3], y1);
    };
    for (const s of spots) add(s.x - s.size / 2, s.feet - s.size, s.x + s.size / 2, s.feet);
    add(tile.x - tile.w / 2, tile.y - tile.h / 2, tile.x + tile.w / 2, tile.y + tile.h / 2);
    for (const e of extra) add(...e);
    return { x0: r[0], y0: r[1], x1: r[2], y1: r[3] };
  };
  return {
    ferrari: box([...FERRARI.ring, FERRARI.ceo], FERRARI.tile),
    redbull: box([REDBULL.principal, ...REDBULL.owners], REDBULL.tile),
    audi: box([{ x: AU, feet: FLOOR_Y, size: PRINCIPAL_SIZE }, ...AUDI.managers, AUDI.top, { x: AUDI.secondX, feet: FLOOR_Y, size: PEG_SIZE }], AUDI.tile, [
      [AUDI.pay.x - AUDI.pay.w / 2, FLOOR_Y - AUDI.pay.h, AUDI.pay.x + AUDI.pay.w / 2, FLOOR_Y],
    ]),
  };
})();

/** All three teams in one frame (cut D): the whole line 60 px clear of each side, the feet at screen y 1000. */
export const RECAP: Cam = (() => {
  const x0 = TEAM_BOX.ferrari.x0;
  const x1 = TEAM_BOX.audi.x1;
  const k = (1080 - 2 * 60) / (x1 - x0);
  return camFor((x0 + x1) / 2, FLOOR_Y, 540, 1000, k);
})();
/** The pool's home per team (world point the light follows) and its strength. */
export const POOL_AT = {
  ferrari: { x: FERRARI.x, y: FERRARI.cy, strength: 1.6 },
  redbull: { x: REDBULL.x, y: -380, strength: 1.6 },
  audi: { x: AUDI.x, y: -400, strength: 1.6 },
  recap: { x: RECAP.x, y: -340, strength: 1.4 },
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
// THE STOUT ENTRANCE (appear 0..1; exits run it back)
// ===========================================================================
/** a = opacity (ease-out cubic), lift = how far below its place it still is (SCREEN px, 24 -> 0), blur (SCREEN
 *  px, 6 -> 0), shadow = its shadow's strength (grows in after the body: a^2). */
export const stoutEntrance = (t: number) => {
  const a = easeOutCubic(clamp01(t));
  return { a, lift: (1 - a) * 24, blur: 6 * (1 - a), shadow: a * a };
};
/** Wrap a body in its entrance: opacity, the slide (SCREEN px / k) and the blur. */
export const Appear: React.FC<{ t: number; k: number; children?: React.ReactNode }> = ({ t, k, children }) => {
  const en = stoutEntrance(t);
  if (en.a <= 0.002) return null;
  if (en.a >= 0.9995) return <g>{children}</g>;
  return (
    <g opacity={f3(en.a)} transform={`translate(0 ${fx(en.lift / k)})`} style={en.blur > 0.05 ? { filter: `blur(${f3(en.blur / k)}px)` } : undefined}>
      {children}
    </g>
  );
};

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
  const a0 = -168 * deg;
  const a1 = -12 * deg;
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
  /** 0..1: the stout entrance (0 = not there) */
  appear: number;
  /** 0 = kraft (board) .. 1 = cream (the subject) */
  warm: number;
  /** 0 = off (held above the head, unseen) .. 1 = on */
  headset: number;
  /** 0..1 travel lift (a peg that moves lifts one elevation) */
  lift?: number;
  /** 0..1 the dim (the tone falls toward the ground's) */
  shade?: number;
};
/** The silhouette of a standing peg + the headset when on: for one union shadow. */
export const principalSil = (x: number, feet: number, size: number, headset = 0): SilItem[] => {
  const out: SilItem[] = [{ d: pegPath(x, feet, size) }];
  if (headset > 0.6) {
    const h = headsetGeom(x, feet, size, headset);
    out.push({ d: circlePath(h.cup.x, h.cup.y, h.cup.r) });
    out.push({ d: h.band, stroke: h.bandW });
  }
  return out;
};
/**
 * PrincipalPeg — a person cut from card, lit from above (talentShared's PersonPeg recipe) whose tone runs
 * kraft -> cream by `warm`, with the pit-wall headset (`headset` 0..1 lowers it onto the head) and `shade`
 * (0..1, the dim). `appear` 0..1 = the stout entrance; its own contact shadow grows in with it.
 */
export const PrincipalPeg: React.FC<{
  x: number;
  y: number;
  k: number;
  size?: number;
  warm?: number;
  appear?: number;
  headset?: number;
  shade?: number;
  lift?: number;
  shadow?: boolean;
}> = ({ x, y, k, size = PRINCIPAL_SIZE, warm = 1, appear = 1, headset = 1, shade = 0, lift = 0, shadow = true }) => {
  const uid = uidOf(useId());
  const en = stoutEntrance(appear);
  if (en.a <= 0.002) return null;
  const w = clamp01(warm);
  const sh = clamp01(shade);
  const feet = y;
  const g = pegGeometry(x, feet, size);
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
    <Appear t={appear} k={k}>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(g.top)} x2="0" y2={f3(feet)}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={foot} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y - ao)} x2="0" y2={f3(y)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <clipPath id={`${uid}s`}>
          <path d={pegPath(x, feet, size)} />
        </clipPath>
      </defs>
      {shadow ? <UnionShadow sil={principalSil(x, feet, size, hs)} s={size / 96} lift={lift} contact={{ x, y: feet, w: size * 0.8 }} strength={en.shadow / Math.max(en.a, 1e-3)} /> : null}
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
    </Appear>
  );
};

/**
 * OrgPeg — anyone else: talentShared's PersonPeg (kraft .. amber by `amber`, the amber bloom, its own contact
 * shadow) standing free at feet (x, y), with the stout entrance (`appear`). `band` = amberBandFor(cam).
 */
export const OrgPeg: React.FC<{ x: number; y: number; k: number; size?: number; appear?: number; amber?: number; shade?: number; lift?: number; band?: [number, number] }> = ({
  x,
  y,
  k,
  size = PEG_SIZE,
  appear = 1,
  amber = 0,
  shade = 0,
  lift = 0,
  band,
}) => {
  const en = stoutEntrance(appear);
  if (en.a <= 0.002) return null;
  return (
    <Appear t={appear} k={k}>
      <PersonPeg x={x} y={y} k={k} size={size} blend={amber} shade={shade} lift={lift} shadow shadowStrength={en.shadow / Math.max(en.a, 1e-3)} amberBand={band} />
    </Appear>
  );
};

// ===========================================================================
// TILES
// ===========================================================================
/** A cream card's body: one gradient (toned by dim), the lit top edge. */
export const CardBody: React.FC<{ x0: number; y0: number; w: number; h: number; k: number; dim?: number; r?: number }> = ({ x0, y0, w, h, k, dim = 0, r = 4 }) => {
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
 * LogoTile — a team's real mark as an ink stamp on a cream tile, centred on (x, y), w x h, lying on the board
 * (one shadow, scaled to its size). `appear` 0..1 = the stout entrance; `dim` tones it to board.
 */
export const LogoTile: React.FC<{ id: MarkId; x: number; y: number; w: number; h: number; k: number; appear?: number; dim?: number }> = ({ id, x, y, w, h, k, appear = 1, dim = 0 }) => {
  const uid = uidOf(useId());
  const en = stoutEntrance(appear);
  if (en.a <= 0.002) return null;
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  const ink = mixHex(COLOR.inkDark, COLOR.board, clamp01(dim) * 0.35);
  return (
    <Appear t={appear} k={k}>
      <defs>
        <linearGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor={toneTop(dim)} />
          <stop offset="1" stopColor={toneFoot(dim)} />
        </linearGradient>
      </defs>
      <UnionShadow sil={[{ d: rectPath(x0, y0, w, h) }]} s={Math.min(w, h) / 96} strength={en.shadow / Math.max(en.a, 1e-3)} />
      <CardBody x0={x0} y0={y0} w={w} h={h} k={k} dim={dim} />
      <g transform={`translate(${fx(x0)} ${fx(y0)})`}>
        <Mark id={id} w={w} h={h} ink={ink} tile={`url(#${uid}t)`} />
      </g>
    </Appear>
  );
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
/** A rule along `pts`, drawn from its start to fraction t. */
export const OrgRule: React.FC<{ pts: P[]; t?: number; k: number; bright?: number; dim?: number; w?: number }> = ({ pts, t = 1, k, bright = 0, dim = 0, w = RULE_W }) => {
  const p = partialPolyline(pts, t);
  if (p.length < 2) return null;
  return (
    <path
      d={`M${p.map((q) => `${f3(q[0])} ${f3(q[1])}`).join("L")}`}
      fill="none"
      stroke={ruleColor(bright, dim)}
      strokeWidth={f3(w / k)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

// ===========================================================================
// STATES — every channel 0..1; cuts drive them per frame
// ===========================================================================
export type FerrariState = {
  /** the horse tile's entrance */
  tile: number;
  principal: PrincipalState;
  /** the nine others' entrances, ring order k 1..9 (FERRARI.others) */
  others: number[];
  /** each report's spoke drawn from the report in toward the CEO, ring order k 0..9 */
  spokes: number[];
  /** the CEO's entrance and his kraft -> amber blend */
  ceo: number;
  ceoAmber: number;
  /** rules brighter (cut D) */
  bright: number;
  /** the whole structure dimmed by tone (cut D) */
  dim: number;
};
export type RedBullState = {
  tile: number;
  principal: PrincipalState;
  /** the stem from his head up to the fork */
  stem: number;
  /** the four branches, fork -> owner, left to right */
  branches: number[];
  /** the four owners' entrances, left to right (REDBULL.owners) */
  owners: number[];
  /** their kraft -> amber blend (together) */
  amber: number;
  bright: number;
  dim: number;
};
export type AudiState = {
  tile: number;
  principal: PrincipalState;
  /** the second hire at AUDI.secondX: entrance and kraft -> cream */
  second: { appear: number; warm: number };
  /** the one rule, drawn up from the principal's head to the top's feet */
  rule: number;
  /** the three managers' entrances, bottom to top */
  managers: number[];
  /** the top's entrance and his kraft -> amber blend */
  top: number;
  topAmber: number;
  bright: number;
  dim: number;
};
export type WorldState = { ferrari: FerrariState; redbull: RedBullState; audi: AudiState };

const P_OFF: PrincipalState = { appear: 0, warm: 0, headset: 0 };
const P_ON: PrincipalState = { appear: 1, warm: 1, headset: 1 };
export const FERRARI_EMPTY: FerrariState = { tile: 0, principal: P_OFF, others: Array(9).fill(0), spokes: Array(10).fill(0), ceo: 0, ceoAmber: 0, bright: 0, dim: 0 };
export const FERRARI_DONE: FerrariState = { tile: 1, principal: P_ON, others: Array(9).fill(1), spokes: Array(10).fill(1), ceo: 1, ceoAmber: 1, bright: 0, dim: 0 };
export const REDBULL_EMPTY: RedBullState = { tile: 0, principal: P_OFF, stem: 0, branches: Array(4).fill(0), owners: Array(4).fill(0), amber: 0, bright: 0, dim: 0 };
/** Red Bull as cut A leaves it: nothing there yet (off frame at HOME.ferrari). Cut B brings it in. */
export const REDBULL_START: RedBullState = REDBULL_EMPTY;
export const REDBULL_DONE: RedBullState = { tile: 1, principal: P_ON, stem: 1, branches: Array(4).fill(1), owners: Array(4).fill(1), amber: 1, bright: 0, dim: 0 };
export const AUDI_EMPTY: AudiState = { tile: 0, principal: P_OFF, second: { appear: 0, warm: 0 }, rule: 0, managers: Array(3).fill(0), top: 0, topAmber: 0, bright: 0, dim: 0 };
/** Audi resolved (the tower, both hires cream). Cut C's pay props are its own (drawn in its own file). */
export const AUDI_DONE: AudiState = { tile: 1, principal: P_ON, second: { appear: 1, warm: 1 }, rule: 1, managers: Array(3).fill(1), top: 1, topAmber: 1, bright: 0, dim: 0 };
/** The world as cut A ends and cut B opens. */
export const WORLD_AFTER_A: WorldState = { ferrari: FERRARI_DONE, redbull: REDBULL_START, audi: AUDI_EMPTY };
/** Everything resolved (cut D's recap). */
export const WORLD_DONE: WorldState = { ferrari: FERRARI_DONE, redbull: REDBULL_DONE, audi: AUDI_DONE };

// ===========================================================================
// THE THREE TEAMS
// ===========================================================================
type TeamProps = { k: number; band: [number, number] };

/** Ferrari: the ring of ten, the spokes in to the CEO, the amber CEO at the centre, the horse tile above. */
export const FerrariOrg: React.FC<TeamProps & { s: FerrariState }> = ({ k, band, s }) => {
  const dim = s.dim;
  const shade = dim * 0.55;
  const p = s.principal;
  return (
    <g>
      {FERRARI.spokes.map((pts, i) => (
        <OrgRule key={i} pts={pts} t={s.spokes[i] ?? 0} k={k} bright={s.bright} dim={dim} />
      ))}
      <LogoTile id="ferrari" {...FERRARI.tile} k={k} appear={s.tile} dim={dim} />
      {FERRARI.others.map((o, i) => (
        <OrgPeg key={i} x={o.x} y={o.feet} k={k} size={o.size} appear={s.others[i] ?? 0} shade={shade} band={band} />
      ))}
      <OrgPeg x={FERRARI.ceo.x} y={FERRARI.ceo.feet} k={k} size={BOSS_SIZE} appear={s.ceo} amber={s.ceoAmber * (1 - 0.75 * dim)} shade={shade} band={band} />
      <PrincipalPeg x={FERRARI.px} y={FLOOR_Y} k={k} appear={p.appear} warm={p.warm * (1 - 0.8 * dim)} shade={Math.max(shade * 0.5, p.shade ?? 0)} headset={p.headset} lift={p.lift} />
    </g>
  );
};

/** Red Bull: the principal, the stem fanning into four branches, the four amber owners, the bulls tile. */
export const RedBullOrg: React.FC<TeamProps & { s: RedBullState }> = ({ k, band, s }) => {
  const dim = s.dim;
  const p = s.principal;
  return (
    <g>
      <OrgRule pts={REDBULL.stem} t={s.stem} k={k} bright={s.bright} dim={dim} />
      {REDBULL.branches.map((pts, i) => (
        <OrgRule key={i} pts={pts} t={s.branches[i] ?? 0} k={k} bright={s.bright} dim={dim} />
      ))}
      <LogoTile id="redbull" {...REDBULL.tile} k={k} appear={s.tile} dim={dim} />
      {REDBULL.owners.map((o, i) => (
        <OrgPeg key={i} x={o.x} y={o.feet} k={k} size={o.size} appear={s.owners[i] ?? 0} amber={s.amber * (1 - 0.75 * dim)} shade={dim * 0.55} band={band} />
      ))}
      <PrincipalPeg x={REDBULL.px} y={FLOOR_Y} k={k} appear={p.appear} warm={p.warm * (1 - 0.8 * dim)} shade={Math.max(dim * 0.3, p.shade ?? 0)} headset={p.headset} lift={p.lift} />
    </g>
  );
};

/** Audi: the one rule, the principal and the second hire, the three managers, the amber top, the rings tile. */
export const AudiOrg: React.FC<TeamProps & { s: AudiState }> = ({ k, band, s }) => {
  const dim = s.dim;
  const p = s.principal;
  return (
    <g>
      <OrgRule pts={AUDI.rule} t={s.rule} k={k} bright={s.bright} dim={dim} />
      <LogoTile id="audi" {...AUDI.tile} k={k} appear={s.tile} dim={dim} />
      {AUDI.managers.map((m, i) => (
        <OrgPeg key={i} x={m.x} y={m.feet} k={k} size={m.size} appear={s.managers[i] ?? 0} shade={dim * 0.55} band={band} />
      ))}
      <OrgPeg x={AUDI.top.x} y={AUDI.top.feet} k={k} size={BOSS_SIZE} appear={s.top} amber={s.topAmber * (1 - 0.75 * dim)} shade={dim * 0.55} band={band} />
      <PrincipalPeg x={AUDI.px} y={FLOOR_Y} k={k} appear={p.appear} warm={p.warm * (1 - 0.8 * dim)} shade={Math.max(dim * 0.3, p.shade ?? 0)} headset={p.headset} lift={p.lift} />
      <PrincipalPeg x={AUDI.secondX} y={FLOOR_Y} k={k} size={PEG_SIZE} appear={s.second.appear} warm={s.second.warm * (1 - 0.8 * dim)} shade={dim * 0.3} headset={0} />
    </g>
  );
};

/**
 * OrgWorld — the three teams in one call. `cam` gives k and the frame's amber band. Children (a cut's own
 * extras) are drawn on top, in world px.
 */
export const OrgWorld: React.FC<{ cam: Cam; w: WorldState; children?: React.ReactNode }> = ({ cam, w, children }) => {
  const k = cam.k;
  const band = amberBandFor(cam);
  return (
    <g>
      <FerrariOrg k={k} band={band} s={w.ferrari} />
      <RedBullOrg k={k} band={band} s={w.redbull} />
      <AudiOrg k={k} band={band} s={w.audi} />
      {children}
    </g>
  );
};

// ===========================================================================
// THE F1 TAG (cut C on): the F1 mark on a tiny cream tag on the principal's chest
// ===========================================================================
/** The F1 logo (public/cheekypint2/dts/f1.svg, viewBox 320 x 80) without its ®. */
export const F1_MARK = {
  box: [0, 0, 320, 80] as const,
  d: "M45.2583 80L80.7417 45.575H80.7333C94.7167 32.0167 100.392 29.9583 127.058 29.9583H233.408L264.008 0H123.025C87.3333 0 77.2417 3.4 56.3083 24.1167L0 80H45.2583ZM127.7 34.7417H228.842L200.792 62.7917H128.225C114.925 62.7917 111.983 63.4167 105.383 70.0167L95.4 80H53.4333L84.4583 48.975C96.6417 36.8 100.842 34.7417 127.7 34.7417ZM320 0L239.783 80H190.175L270.175 0H320Z",
};
/** The tag on a PRINCIPAL_SIZE peg's chest: w x h (world px), its bottom `foot` above the peg's feet. */
export const F1_TAG = { w: 60, h: 22, foot: 6, fill: 0.8 } as const;
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

// ===========================================================================
// LOAD-TIME CHECKS (the framing the four cuts rely on)
// ===========================================================================
{
  const fail = (m: string) => {
    throw new Error(`orgWorld: ${m}`);
  };
  const S = (c: Cam, x: number, y: number) => toScreen(c, x, y);
  const homes = [
    ["ferrari", HOME.ferrari, TEAM_BOX.ferrari, FERRARI.x],
    ["redbull", HOME.redbull, TEAM_BOX.redbull, REDBULL.x],
    ["audi", HOME.audi, TEAM_BOX.audi, AUDI.x],
  ] as const;
  const boxes = [TEAM_BOX.ferrari, TEAM_BOX.redbull, TEAM_BOX.audi];
  homes.forEach(([n, c, b, x], i) => {
    // the principal's feet at the same screen spot
    const ft = S(c, x, FLOOR_Y);
    if (Math.abs(ft.x - 540) > 1e-6 || Math.abs(ft.y - FEET_SY) > 1e-6 || c.k !== K_HOME) fail(`${n}: feet at ${ft.x}, ${ft.y}`);
    // the structure inside the picture area (x 60..1020, y 260..1070) and mirror-symmetric about the frame's centre
    const a = S(c, b.x0, b.y0);
    const z = S(c, b.x1, b.y1);
    if (a.x < 60 - 1e-6 || z.x > 1020 + 1e-6 || a.y < 260 || z.y > 1070) fail(`${n}: box ${a.x.toFixed(0)},${a.y.toFixed(0)} .. ${z.x.toFixed(0)},${z.y.toFixed(0)}`);
    if (Math.abs(a.x + z.x - 1080) > 1e-6 && n !== "audi") fail(`${n}: not centred (${a.x.toFixed(1)} .. ${z.x.toFixed(1)})`);
    // neighbours wholly off frame (12 px for their shadows)
    if (i > 0 && S(c, boxes[i - 1].x1, 0).x > -12) fail(`${n}: left neighbour shows`);
    if (i < 2 && S(c, boxes[i + 1].x0, 0).x < 1092) fail(`${n}: right neighbour shows`);
  });
  // mirror symmetry of the spots themselves
  for (let k = 1; k < 10; k++) {
    const a = FERRARI.ring[k];
    const b = FERRARI.ring[10 - k];
    if (Math.abs(a.x - FX + (b.x - FX)) > 1e-6 || Math.abs(a.feet - b.feet) > 1e-6) fail(`ring ${k} / ${10 - k} not mirrored`);
  }
  REDBULL.owners.forEach((o, i) => {
    const m = REDBULL.owners[3 - i];
    if (Math.abs(o.x - RB + (m.x - RB)) > 1e-6 || o.feet !== m.feet) fail("owners not mirrored");
  });
  if (Math.abs(AUDI.secondX - AU + (AUDI.pay.x - AU)) > 1e-6) fail("Audi's second hire and pay room not mirrored");
  // nothing overlaps on the ring: neighbours' boxes clear by >= 40 px; the tile clear of the top report
  for (let k = 0; k < 10; k++) {
    const a = FERRARI.ring[k];
    const b = FERRARI.ring[(k + 1) % 10];
    const clear = Math.max(Math.abs(a.x - b.x) - (a.size + b.size) / 2, Math.abs(a.cy - b.cy) - (a.size + b.size) / 2);
    if (clear < 40) fail(`ring ${k} / ${(k + 1) % 10} only ${clear.toFixed(0)} apart`);
  }
  if (FERRARI.tile.y + FERRARI.tile.h / 2 > FERRARI.ring[5].feet - PEG_SIZE - 30) fail("tile on the top report");
  if (REDBULL.tile.y + REDBULL.tile.h / 2 > REDBULL.owners[1].feet - BOSS_SIZE - 30) fail("tile on the owners");
  // the recap: everything inside the frame
  const l = S(RECAP, TEAM_BOX.ferrari.x0, 0).x;
  const r = S(RECAP, TEAM_BOX.audi.x1, 0).x;
  const t = S(RECAP, 0, Math.min(...boxes.map((b) => b.y0))).y;
  if (l < 59.9 || r > 1020.1 || t < 260) fail(`recap: ${l.toFixed(0)}..${r.toFixed(0)}, top ${t.toFixed(0)}`);
  if (COLOR.amberTop !== "#FFB000") fail("palette must be B1");
}
