// ---------------------------------------------------------------------------
// ReportToSomeone (toto-twenty-person, cut 42). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 283 frames. Palette B1. The shared world: orgWorld.tsx (the team principals' line).
//
// CHECK LINE: "every one of those team principals answers to someone above him, and one who decides alone
// without going up the chain can lose his job".
//
// THE LINE: "[all] of these people, they need to fundamentally report to someone, and there's always the risk
// that by... if you take a decision without having actually escalated it through the hierarchy, you might be
// exposed and lose your job. So"
// WORD -> FRAME: (all -4) · of 2 · these 6 · people 10 · they 20 · need 24 · to 28 · fundamentally 30 ·
// report 38 · to 52 · someone 59 (ends 68) · and 68 · there's 78 · always 86 · the 91 · risk 95 · that 102 ·
// by 109 · if 122 · you 127 · take 129 · a 134 · decision 137 · without 145 · having 154 · actually 164 ·
// escalated 173 · it 192 · through 195 · the 201 · hierarchy 204 (ends 212) · you 212 · might 230 · be 238 ·
// exposed 243 · and 254 · lose 262 · your 267 · job 272 (ends 280) · so 280
// DURATION: slot 42.040 -> 53.360 s = 11.320 s x 25 = 283 frames (f0..f282). S = frame + 1051.
//
// THE MOTION: one camera move, a pull back then one long push in. f0 is cut C's last frame (C_END_CAM, C_END_POOL
// x the breath, AUDI_END_C with its F1 tag; all imported). The camera pulls back to RECAP (f0-f36, "of these
// people": the zoom out leads about Audi, the truck left follows; Ferrari's row, Red Bull's owners, Audi's tower on
// the one ledge, settled ~f36-f40); a warm bead runs up each principal's reporting rule to the amber above him
// (Ferrari f38, Red Bull f46, Audi f54, behind Audi's desks where the rule is), each rule staying a little brighter
// behind it, steady by f67. From f70 one eased push in on Audi's principal (the truck leads, the zoom runs to
// ~f205); Ferrari and Red Bull dim by tone (f80-f104) and leave left. An amber decision card (a document, ink tick)
// rises out of his slot behind his right shoulder to beside his head (f129-f139) and lifts (f139-f147). On
// "escalated it through the hierarchy" a faint dashed road draws up from the card's top, desk by desk, to under the
// amber top's desk (f173-f205; the tip eases to a stop at each desk), but the card never takes it: it settles back
// (f207-f215). "Might be exposed" (f230-f250): the tower and the ledge dim by tone, the light gathers on him alone.
// "Lose your job" (f256-f272): he sinks straight into his slot with headset, F1 tag and card (the TEAM PRINCIPAL
// card runs its stout entrance back, f256-f267); his slot opens into an empty pocket under the standing tower; a
// slow creep in about the slot keeps the hold alive to f282.
// Contacts: each bead leaves the head on its first frame and reaches the amber's card on its last; the road's tip
// starts at the lifted card's top edge (f173) and stops under the amber top's desk (f205); the card is in his slot
// from f129 and sinks with him (same rate, his body in front of it) until f272.
// JOIN: proved with a still-vs-still difference against AudiHiredToRun f277 (the cards and world: 0 difference;
// the house sway runs on C's clock continued so the world lands exactly; ground drift and grain run on S).
// AMBER = the power to decide over the principal (Ferrari's CEO, Red Bull's shareholders, Audi's corporate top);
// in this cut the principal who decides alone briefly holds an amber decision card. Cream = the principals.
//
// SOURCES: no figures. Logos: orgWorld (orgLogos.ts). F1 tag: cut C's F1Tag (public/cheekypint2/dts/f1.svg).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { ALPHA, COLOR, EDGE, GEO, amberBandFor, bloomFilter, clamp01, lerp, mixHex, smoothstep, toScreen } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, camCheck, liftAt, makeClockCam, makePoolTrack, restToRest, type SilItem } from "../kits/cheeky-pint/museShared";
import { PegSlot } from "../kits/cheeky-pint/talentShared";
import {
  AUDI,
  AudiOrgC,
  F1Tag,
  chipRectC,
  FERRARI_DONE,
  FLOOR_Y,
  FerrariOrg,
  OrgStage,
  PEG_SIZE,
  POOL_AT,
  PRINCIPAL_SIZE,
  PrincipalLabel,
  PrincipalPeg,
  FERRARI,
  LEDGE,
  REDBULL_DONE,
  REPORT_PATHS,
  RULE_W,
  RedBullOrg,
  TeamLine,
  ledgeCam,
  ledgeContents,
  partialPolyline,
  polylineLength,
  principalLabelRect,
  ruleColor,
  slipRect,
  type AudiStateC,
  type FerrariState,
  type RedBullState,
  type WorldStateC,
} from "./orgWorld";
import { camAt as camA } from "./FerrariOneOfTen";
import { AUDI_END_C, C_END_CAM, C_END_POOL, DURATION as C_DURATION, SLOT_START as C_SLOT_START } from "./AudiHiredToRun";

export const FPS = 25;
export const DURATION = 283;
export const SLOT_START = 1051; // story clock S = frame + 1051
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
type P = [number, number];
const win = (f: number, f0: number, f1: number) => smoothstep((f - f0) / (f1 - f0));

// ===========================================================================
// THE JOIN: cut C's last frame
// ===========================================================================
/** C's last frame on its own clock: the house sway here runs on C's clock continued (f0 = C's last sway), so the
 *  world joins pixel for pixel; the ground drift and grain run on this slot's story clock S (they differ, accepted). */
const C_LAST_S = C_SLOT_START + C_DURATION - 1;
const swayAt = (f: number) => {
  const s = f + C_LAST_S;
  return { dx: 3 * Math.sin(s / 23), dy: 5 * Math.sin(s / 19) };
};
/** The pool's breath (cuts A-C: x (1 + 0.05 sin(S / 11))), on C's clock continued for the same reason. */
const breathAt = (f: number) => 1 + 0.05 * Math.sin((f + C_LAST_S) / 11);
/** C's ground parallax origin (cut A's opening camera, as C takes it): keeps the ground's scale and parallax
 *  continuous across the join; only the drift (S) and the grain differ. */
const REST: Cam = camA(0);

// ===========================================================================
// THE CAMERA — pull back to RECAP, one long push in on Audi's principal, a slow creep on the empty slot
// ===========================================================================
/** The end: the principal's slot at screen y 950, the whole tower (tile included) standing above it. */
/** D's own recap framing (orgWorld's RECAP touches both edges): all three structures with ~56 px side margins,
 *  the ledge at y 950, as large as that allows. */
const RECAP_MARGIN = 56;
const RECAP_X0 = FERRARI.xs[0] - PEG_SIZE / 2;
const RECAP_X1 = Math.max(AUDI.secondX + PEG_SIZE / 2, AUDI.tile.x + AUDI.tile.w / 2, principalLabelRect(AUDI.px).x + principalLabelRect(AUDI.px).w);
const RECAP_D: Cam = ledgeCam((RECAP_X0 + RECAP_X1) / 2, (1080 - 2 * RECAP_MARGIN) / (RECAP_X1 - RECAP_X0), 950);
const K_END = 1.1;
const END: Cam = ledgeCam(AUDI.px, K_END, 950);
const K_HOLD = 1.13;
const START: Cam = C_END_CAM;
const CAM = makeClockCam(
  { x: START.x, y: START.y, k: START.k },
  [
    // the pull back: the zoom out leads (about Audi, front-loaded), the truck left follows at the wide k
    { f0: 0, f1: 22, k: RECAP_D.k, warp: 0.8 },
    { f0: 9, f1: 28, dx: RECAP_D.x - START.x, dy: RECAP_D.y - START.y },
    // the push in: the truck onto Audi leads (he is centred for the card, f129), the zoom runs on to ~f206
    { f0: 70, f1: 168, dx: END.x - RECAP_D.x, dy: END.y - RECAP_D.y },
    { f0: 74, f1: 190, k: K_END, warp: 0.85 },
    { f0: 214, f1: 330, k: K_HOLD }, // the creep (finishes past the cut: still moving at f282)
  ],
  DURATION,
);
/** The creep zooms about the empty slot: the k glide alone would zoom about the frame's centre. */
const camRaw = (f: number): Cam => {
  const c = CAM.at(f);
  if (c.k <= K_END) return c;
  // keep world (AUDI.px, FLOOR_Y) where END puts it while k grows past K_END
  const sEnd = toScreen(END, AUDI.px, FLOOR_Y);
  const t = clamp01((f - 200) / 20);
  const anchored = { x: AUDI.px - (sEnd.x - 540) / c.k, y: FLOOR_Y - (sEnd.y - 960) / c.k, k: c.k };
  return { x: lerp(c.x, anchored.x, t), y: lerp(c.y, anchored.y, t), k: c.k };
};
/** The frame's camera with the house sway folded in (StoutStage gets sway off). */
const camAt = (f: number): Cam => {
  const c = camRaw(f);
  const s = swayAt(f);
  return { x: c.x - s.dx / c.k, y: c.y - s.dy / c.k, k: c.k };
};

// ===========================================================================
// THE LIGHT
// ===========================================================================
const POOL = makePoolTrack(
  C_END_POOL,
  [
    { f0: 0, f1: 30, x: POOL_AT.recap.x, y: POOL_AT.recap.y, strength: POOL_AT.recap.strength },
    { f0: 76, f1: 200, x: AUDI.px, y: -330, strength: 1.6 },
    { f0: 226, f1: 250, x: AUDI.px, y: -70, strength: 1.2 },
    { f0: 262, f1: 280, x: AUDI.px, y: -30, strength: 1.2 }, // the light stays on the empty spot
  ],
  DURATION,
);
/** The light gathering on him alone ("might be exposed"): a tight warm pool in screen px, 0..1. */
const tightAt = (f: number) => win(f, 228, 252);

// ===========================================================================
// THE TIMELINE (frames)
// ===========================================================================
const T = {
  pulse: { ferrari: [38, 50], redbull: [46, 57], audi: [54, 67] } as Record<"ferrari" | "redbull" | "audi", [number, number]>,
  dimTeams: [80, 104] as const, // Ferrari and Red Bull dim by tone as the push begins
  cardRise: [129, 139] as const,
  cardLift: 139, // lift up over 8 f
  cardSettle: 207, // settles back down over 8 f
  dimAudi: [230, 250] as const,
  sink: [256, 272] as const,
  label: [256, 267] as const,
};
/** How bright a rule ends after its bead (ruleColor's `bright`). */
const BRIGHT = 0.8;
const AUDI_DIM = 0.6;
const LEDGE_DIM = 0.3;

const pulseU = (f: number, id: "ferrari" | "redbull" | "audi") => {
  const [a, b] = T.pulse[id];
  return restToRest(clamp01((f - a) / (b - a)), 2);
};
const teamsDim = (f: number) => win(f, T.dimTeams[0], T.dimTeams[1]);
const audiDim = (f: number) => AUDI_DIM * win(f, T.dimAudi[0], T.dimAudi[1]);
const principalRise = (f: number) => 1 - smoothstep(clamp01((f - T.sink[0]) / (T.sink[1] - T.sink[0])));
const labelT = (f: number) => 1 - clamp01((f - T.label[0]) / (T.label[1] - T.label[0]));

// ===========================================================================
// THE DECISION CARD — an amber document with an ink tick, raised out of his slot behind his right shoulder
// ===========================================================================
/** World px. It rises out of HIS slot, behind him (he is drawn over it), and is held up beside his head: its
 *  left edge tucked behind his head, its right edge inside his slot and clear of the second hire. `held` = its
 *  bottom when held (above his shoulder line), `lift` = the extra raise when he picks it up. */
const CARD = { x: 1798, w: 40, h: 52, ear: 11, held: -68, lift: 14 } as const;
const cardUp = (f: number) => smoothstep(clamp01((f - T.cardRise[0]) / (T.cardRise[1] - T.cardRise[0])));
const cardLift = (f: number) => liftAt(f, T.cardLift, T.cardSettle, 8, 8);
/** 0..1 how far the card is out of the ledge (for the checks and for drawing at all). */
const cardRise = (f: number) => (f >= T.sink[1] ? 0 : cardUp(f));
/** The card's world rect at frame f: from below the ledge up to `held`, + the lift; it sinks with him. */
const cardRect = (f: number) => {
  const bottomHeld = CARD.held - CARD.lift * cardLift(f);
  const bottomDown = FLOOR_Y + CARD.h + 2;
  const sink = (1 - principalRise(f)) * (CARD.h - CARD.held + 2);
  const bottom = lerp(bottomDown, bottomHeld, cardUp(f)) + sink;
  return { x: CARD.x - CARD.w / 2, y: bottom - CARD.h, w: CARD.w, h: CARD.h };
};
const cardPath = (x0: number, y0: number, w: number, h: number, ear: number) => {
  const r = 3;
  return (
    `M${f3(x0 + r)} ${f3(y0)}H${f3(x0 + w - ear)}L${f3(x0 + w)} ${f3(y0 + ear)}V${f3(y0 + h - r)}` +
    `Q${f3(x0 + w)} ${f3(y0 + h)} ${f3(x0 + w - r)} ${f3(y0 + h)}H${f3(x0 + r)}Q${f3(x0)} ${f3(y0 + h)} ${f3(x0)} ${f3(y0 + h - r)}` +
    `V${f3(y0 + r)}Q${f3(x0)} ${f3(y0)} ${f3(x0 + r)} ${f3(y0)}Z`
  );
};
const DecisionCard: React.FC<{ f: number; k: number; band: [number, number] }> = ({ f, k, band }) => {
  const uid = `rts${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (cardRise(f) <= 0.001) return null;
  const lift = cardLift(f);
  const c = cardRect(f);
  const amberAt = (yy: number) => mixHex(COLOR.amberTop, COLOR.amberFoot, (yy - band[0]) / Math.max(1e-6, band[1] - band[0]));
  const d = cardPath(c.x, c.y, c.w, c.h, CARD.ear);
  // out of the slot: nothing below the ledge's top shows
  const clip = { x: c.x - 80, y: -600, w: c.w + 160, h: 600 + FLOOR_Y };
  // the ink tick (Lucide check, heavy): its 24-unit box over 64 % of the card's width, a little low
  const g = 0.64 * c.w;
  const gx = CARD.x - g / 2;
  const gy = c.y + c.h * 0.6 - g / 2;
  const P = (u: number, v: number) => `${f3(gx + (u / 24) * g)} ${f3(gy + (v / 24) * g)}`;
  const tick = `M${P(20, 6)}L${P(9, 17)}L${P(4, 12)}`;
  const e = CARD.ear;
  const fold = `M${f3(c.x + c.w - e)} ${f3(c.y)}V${f3(c.y + e - 2)}Q${f3(c.x + c.w - e)} ${f3(c.y + e)} ${f3(c.x + c.w - e + 2)} ${f3(c.y + e)}H${f3(c.x + c.w)}Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>
          <rect x={f3(clip.x)} y={f3(clip.y)} width={f3(clip.w)} height={f3(clip.h)} />
        </clipPath>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(c.y)} x2="0" y2={f3(c.y + c.h)}>
          <stop offset="0" stopColor={amberAt(c.y)} />
          <stop offset="1" stopColor={amberAt(c.y + c.h)} />
        </linearGradient>
      </defs>
      {/* held in the air: one shadow at the lifted elevation, the float when he raises it */}
      <UnionShadow sil={[{ d, clip }]} s={0.5} elevation="lifted" lift={lift} />
      <g clipPath={`url(#${uid}c)`}>
        <g style={{ filter: bloomFilter(k) }}>
          <path d={d} fill={`url(#${uid}g)`} />
        </g>
        <path d={fold} fill={mixHex(COLOR.amberFoot, COLOR.inkDark, 0.18)} />
        <path d={`M${f3(c.x + 3)} ${f3(c.y + EDGE.HOT / k / 2)}H${f3(c.x + c.w - e - 0.5)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
        <path d={tick} fill="none" stroke={COLOR.inkDark} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

// ===========================================================================
// HIS SLOT: the stout joint while he stands in it, an open pocket once he is gone (eased, no pop)
// ===========================================================================
const U_PEG = 429;
const PrincipalSlot: React.FC<{ rise: number; k: number }> = ({ rise, k }) => {
  const o = 1 - smoothstep(clamp01(rise / 0.25));
  if (o <= 0) return <PegSlot x={AUDI.px} y={FLOOR_Y} size={PRINCIPAL_SIZE} k={k} on="cream" />;
  const size = PRINCIPAL_SIZE;
  const w = size * (1 - 16 / U_PEG) + (2 * EDGE.SLOT_LIP) / k;
  // closed: the slot line centred on the ledge's top; open: a pocket cut down into the ledge from just above its
  // top to a thin cream floor (the ledge's bottom lip stays), so the gap in the pit wall reads at phone size
  const yTop = lerp(FLOOR_Y - EDGE.SLOT / k / 2, FLOOR_Y - SLOT_OPEN.above, o);
  const yBot = lerp(FLOOR_Y + EDGE.SLOT / k / 2, FLOOR_Y + LEDGE.h - SLOT_OPEN.floor, o);
  return (
    <rect
      x={f3(AUDI.px - w / 2)}
      y={f3(yTop)}
      width={f3(w)}
      height={f3(yBot - yTop)}
      rx={f3(Math.min((yBot - yTop) / 2, GEO.RADIUS / 2) * o)}
      fill={mixHex(COLOR.inkDark, COLOR.shadow, o)}
      fillOpacity={f3(lerp(ALPHA.slot, 0.94, o))}
    />
  );
};
/** The vacated slot as an open pocket (world px): how far above the ledge's top it opens, the cream floor left. */
const SLOT_OPEN = { above: 6, floor: 2.5 } as const;

// ===========================================================================
// THE BEADS — a warm bead up each reporting rule; the rule stays brighter behind it
// ===========================================================================
/** Audi's rule runs behind the desks and their managers: the y ranges it is hidden in. */
const AUDI_HIDDEN: [number, number][] = AUDI.levels.map((y) => [y - PEG_SIZE, y + AUDI.desk.h] as [number, number]);
/** A polyline's part between arc lengths s0..s1 (world px). */
const subPolyline = (pts: P[], s0: number, s1: number): P[] => {
  const L = polylineLength(pts);
  if (s1 <= s0 || L <= 0) return [];
  const a = partialPolyline(pts, clamp01(s0 / L));
  const b = partialPolyline(pts, clamp01(s1 / L));
  if (b.length < 2) return [];
  const start = a.length ? a[a.length - 1] : pts[0];
  return [start, ...b.slice(a.length || 1)];
};
/** Cut a vertical 2-point polyline by hidden y ranges into its visible pieces. */
const visiblePieces = (seg: P[], hidden: [number, number][]): P[][] => {
  if (seg.length < 2) return [];
  if (!hidden.length) return [seg];
  const x = seg[0][0];
  let lo = Math.min(seg[0][1], seg[seg.length - 1][1]);
  const hi = Math.max(seg[0][1], seg[seg.length - 1][1]);
  const out: P[][] = [];
  const hs = [...hidden].sort((p, q) => p[0] - q[0]);
  for (const [h0, h1] of hs) {
    if (h1 <= lo || h0 >= hi) continue;
    if (h0 > lo)
      out.push([
        [x, lo],
        [x, h0],
      ]);
    lo = Math.max(lo, h1);
  }
  if (hi > lo)
    out.push([
      [x, lo],
      [x, hi],
    ]);
  return out;
};
const BEAD_PX = 34; // screen px
const BEAD_W = 8; // screen px
const BEAD_COLOR = mixHex(COLOR.inkCream, COLOR.amberHot, 0.55);
const Pulse: React.FC<{ id: "ferrari" | "redbull" | "audi"; f: number; k: number; dim: number }> = ({ id, f, k, dim }) => {
  const pts = REPORT_PATHS[id];
  const u = pulseU(f, id);
  if (u <= 0) return null;
  const L = polylineLength(pts);
  const s = u * L;
  const hidden = id === "audi" ? AUDI_HIDDEN : [];
  const pieces = (q: P[]) => (id === "audi" ? visiblePieces(q, hidden) : q.length >= 2 ? [q] : []);
  const line = (q: P[]) => `M${q.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}`;
  // the bead: in over the first 8 % of the run, out over the last 14 % (it enters the amber's card)
  const [a0, a1] = T.pulse[id];
  const fr = clamp01((f - a0) / (a1 - a0));
  const beadA = smoothstep(fr / 0.08) * (1 - smoothstep((fr - 0.86) / 0.14));
  const trail = subPolyline(pts, 0, s);
  const bead = subPolyline(pts, Math.max(0, s - BEAD_PX / k), s);
  return (
    <g>
      {pieces(trail).map((q, i) => (
        <path key={`t${i}`} d={line(q)} fill="none" stroke={ruleColor(BRIGHT, dim)} strokeWidth={f3(RULE_W / k)} strokeLinecap="butt" strokeLinejoin="miter" />
      ))}
      {beadA > 0.002
        ? pieces(bead).map((q, i) => (
            <path key={`b${i}`} d={line(q)} fill="none" stroke={BEAD_COLOR} strokeOpacity={f3(beadA)} strokeWidth={f3(BEAD_W / k)} strokeLinecap="round" strokeLinejoin="round" />
          ))
        : null}
    </g>
  );
};

// ===========================================================================
// THE ROAD NOT TAKEN — a dashed cream road up the right of the tower, desk to desk, to the amber top, and a hollow
// ghost of his card travelling it; the real card stays with him. Both fade back into the board by f215.
// ===========================================================================
/** The road's x: right of the desks' ends with room for the ghost (its left edge clears the desks). */
const GHOST_GAP = 6;
const ROAD_X = AUDI.px + AUDI.desk.w / 2 + GHOST_GAP + CARD.w / 2;
/** The ghost's centre stops: the lifted card, out onto the road, then beside each desk (its middle), bottom to top;
 *  the last beside the amber top's desk. */
const CARD_CY = CARD.held - CARD.lift - CARD.h / 2;
const DESK_MIDS = [...AUDI.levels, AUDI.top].map((y) => y + AUDI.desk.h / 2);
const GHOST_STOPS: P[] = [[CARD.x, CARD_CY], [ROAD_X, CARD_CY], ...DESK_MIDS.map((y) => [ROAD_X, y] as P)];
/** The ghost reaches each stop on these frames (eased segment by segment: it stops at every desk). */
const GHOST_F = [173, 178, 185, 192, 199, 207] as const;
/** The road's tip runs this many frames ahead of the ghost. */
const ROAD_LEAD = 3;
const GHOST_FADE = [207, 215] as const;
const ROAD_W = 4; // screen px
const ROAD_DASH = [14 / K_END, 9 / K_END] as const; // world px (fixed: the dashes never crawl)
/** The ghost's centre at frame f (before GHOST_F[0] it sits on the card). */
const ghostAt = (f: number): P => {
  if (f <= GHOST_F[0]) return GHOST_STOPS[0];
  for (let i = 0; i < GHOST_F.length - 1; i++) {
    if (f < GHOST_F[i + 1]) {
      const u = smoothstep((f - GHOST_F[i]) / (GHOST_F[i + 1] - GHOST_F[i]));
      return [lerp(GHOST_STOPS[i][0], GHOST_STOPS[i + 1][0], u), lerp(GHOST_STOPS[i][1], GHOST_STOPS[i + 1][1], u)];
    }
  }
  return GHOST_STOPS[GHOST_STOPS.length - 1];
};
const ghostFade = (f: number) => 1 - win(f, GHOST_FADE[0], GHOST_FADE[1]);
const Road: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  if (f < GHOST_F[0] - ROAD_LEAD || f >= GHOST_FADE[1]) return null;
  const a = ghostFade(f);
  const tip = ghostAt(f + ROAD_LEAD);
  // from the card's right edge, out along its middle, then up
  const pts: P[] = [[CARD.x + CARD.w / 2, CARD_CY]];
  if (tip[1] >= CARD_CY - 0.01) pts.push([Math.max(tip[0], CARD.x + CARD.w / 2), CARD_CY]);
  else pts.push([ROAD_X, CARD_CY], [ROAD_X, tip[1]]);
  const col = COLOR.inkCream;
  return (
    <g opacity={f3(a)}>
      {pts[1][0] - pts[0][0] > 0.5 || pts.length > 2 ? (
        <path
          d={`M${pts.map((q) => `${f3(q[0])} ${f3(q[1])}`).join("L")}`}
          fill="none"
          stroke={col}
          strokeOpacity={0.92}
          strokeWidth={f3(ROAD_W / k)}
          strokeDasharray={`${f3(ROAD_DASH[0])} ${f3(ROAD_DASH[1])}`}
          strokeLinecap="butt"
          strokeLinejoin="miter"
        />
      ) : null}
      {/* a stub into each desk once the road has passed it */}
      {DESK_MIDS.map((y, i) =>
        tip[1] <= y ? (
          <path
            key={i}
            d={`M${f3(ROAD_X)} ${f3(y)}H${f3(AUDI.px + AUDI.desk.w / 2)}`}
            stroke={col}
            strokeOpacity={0.92}
            strokeWidth={f3(ROAD_W / k)}
          />
        ) : null,
      )}
    </g>
  );
};
/** The ghost: the card's outline, fold and tick as cream hairlines, no fill, no amber. */
const GhostCard: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  if (f <= GHOST_F[0] || f >= GHOST_FADE[1]) return null;
  const a = win(f, GHOST_F[0], GHOST_F[0] + 4) * ghostFade(f);
  if (a <= 0.002) return null;
  const [cx, cy] = ghostAt(f);
  const x0 = cx - CARD.w / 2;
  const y0 = cy - CARD.h / 2;
  const e = CARD.ear;
  const g = 0.64 * CARD.w;
  const gx = cx - g / 2;
  const gy = y0 + CARD.h * 0.6 - g / 2;
  const Pt = (u: number, v: number) => `${f3(gx + (u / 24) * g)} ${f3(gy + (v / 24) * g)}`;
  const hw = 2.6 / k;
  return (
    <g opacity={f3(a)} fill="none" stroke={COLOR.inkCream} strokeLinecap="round" strokeLinejoin="round">
      <path d={cardPath(x0, y0, CARD.w, CARD.h, e)} strokeWidth={f3(hw)} />
      <path d={`M${f3(x0 + CARD.w - e)} ${f3(y0)}V${f3(y0 + e)}H${f3(x0 + CARD.w)}`} strokeWidth={f3(hw)} />
      <path d={`M${Pt(20, 6)}L${Pt(9, 17)}L${Pt(4, 12)}`} strokeWidth={f3(hw * 1.2)} />
    </g>
  );
};

// ===========================================================================
// THE WORLD STATE PER FRAME
// ===========================================================================
const ferrariAt = (f: number): FerrariState => ({ ...FERRARI_DONE, dim: teamsDim(f) });
const redbullAt = (f: number): RedBullState => ({ ...REDBULL_DONE, dim: teamsDim(f) });
const audiAt = (f: number): AudiStateC => ({
  ...AUDI_END_C,
  principal: { ...AUDI_END_C.principal, rise: AUDI_END_C.principal.rise * principalRise(f), label: AUDI_END_C.principal.label * labelT(f) },
  dim: audiDim(f),
});
const worldAt = (f: number): WorldStateC => ({ ferrari: ferrariAt(f), redbull: redbullAt(f), audi: audiAt(f) });

// ===========================================================================
// LOAD-TIME CHECKS: the join, the framing, the camera, collisions of everything that moves
// ===========================================================================
{
  const fail = (m: string) => {
    throw new Error(`ReportToSomeone: ${m}`);
  };
  const c0 = camRaw(0);
  if (c0.x !== C_END_CAM.x || c0.y !== C_END_CAM.y || c0.k !== C_END_CAM.k) fail(`f0 camera ${JSON.stringify(c0)} is not C_END_CAM`);
  const p0 = POOL(0);
  if (Math.abs(p0.x - C_END_POOL.x) > 1e-9 || Math.abs(p0.y - C_END_POOL.y) > 1e-9 || Math.abs(p0.strength - C_END_POOL.strength) > 1e-9) fail("f0 pool is not C_END_POOL");
  const w0 = worldAt(0);
  if (JSON.stringify(w0.audi) !== JSON.stringify(AUDI_END_C)) fail("f0 Audi state is not AUDI_END_C");
  if (JSON.stringify(w0.ferrari) !== JSON.stringify(FERRARI_DONE) || JSON.stringify(w0.redbull) !== JSON.stringify(REDBULL_DONE)) fail("f0 Ferrari / Red Bull not DONE");
  if (cardRise(0) !== 0 || pulseU(0, "ferrari") !== 0) fail("something extra at f0");
  // RECAP settled by ~f36: the frame within ~4 px of RECAP's (0.5 px by f40)
  const c36 = camRaw(36);
  const e36 = Math.max(Math.abs((c36.x - RECAP_D.x) * c36.k), Math.abs((c36.y - RECAP_D.y) * c36.k), Math.abs(c36.k / RECAP_D.k - 1) * 960);
  if (e36 > 4) fail(`f36 is ${e36.toFixed(1)} px from RECAP`);
  // the camera: speed and smoothness
  const cc = camCheck(camRaw, 0, DURATION - 1);
  if (cc.maxV > 60) fail(`camera speed ${cc.maxV.toFixed(1)} px/f at f${cc.atV}`);
  // the end: the empty slot at y 900-960, the tower's tile fully in frame
  const cE = camRaw(DURATION - 1);
  const slotY = toScreen(cE, AUDI.px, FLOOR_Y).y;
  if (slotY < 900 || slotY > 960) fail(`end slot at y ${slotY.toFixed(0)}`);
  if (toScreen(cE, AUDI.px, AUDI.tile.y - AUDI.tile.h / 2).y < 20) fail("end: tile top cut");
  // the label above the caption band on every frame it shows
  const lab = principalLabelRect(AUDI.px);
  for (let f = 0; f < DURATION; f++) {
    const c = camRaw(f);
    const t = labelT(f);
    if (t > 0.01 && toScreen(c, 0, lab.y + lab.h).y + 24 * Math.pow(1 - t, 3) > 1066) fail(`label in the caption band at f${f}`);
  }
  // the recap: both outer structures >= 50 px from the frame's sides; the principals as large as that allows
  if (toScreen(RECAP_D, RECAP_X0, 0).x < 50 || toScreen(RECAP_D, RECAP_X1, 0).x > 1030) fail("recap margins");
  if (PRINCIPAL_SIZE * RECAP_D.k < 36) fail(`principal ${(PRINCIPAL_SIZE * RECAP_D.k).toFixed(1)} px at the recap`);
  // collisions: the card (the only thing that moves sideways of the world) against its neighbours, every frame
  type Box = { x0: number; x1: number; y0: number; y1: number };
  const hit = (a: Box, b: Box) => a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1;
  const slip = slipRect(1);
  const cr = chipRectC(1);
  const chip = { x0: cr.x, x1: cr.x + cr.w, y0: cr.y, y1: cr.y + cr.h };
  // (the card passes BEHIND him, his head and his F1 tag: it is drawn under him; those are not collisions)
  const statics: [string, Box][] = [
    ["slip", { x0: slip.x, x1: slip.x + slip.w, y0: slip.y, y1: slip.y + slip.h }],
    ["chip", chip],
    ["second hire", { x0: AUDI.secondX - PEG_SIZE / 2, x1: AUDI.secondX + PEG_SIZE / 2, y0: -PEG_SIZE, y1: 0 }],
    ["lowest desk", { x0: AUDI.px - AUDI.desk.w / 2, x1: AUDI.px + AUDI.desk.w / 2, y0: AUDI.levels[0], y1: AUDI.levels[0] + AUDI.desk.h }],
    ["link rule", { x0: AUDI.px - 2, x1: AUDI.px + 2, y0: AUDI.levels[0] + AUDI.desk.h, y1: -PRINCIPAL_SIZE - 10 }],
  ];
  // held, the card sticks out above his shoulder line, right of his head's centre, inside his slot
  if (CARD.x - CARD.w / 2 < AUDI.px || CARD.x + CARD.w / 2 > AUDI.px + PRINCIPAL_SIZE / 2 + 4) fail("card not inside his slot, right of centre");
  for (let f = 0; f < DURATION; f++) {
    if (cardRise(f) <= 0) continue;
    const r = cardRect(f);
    const b = { x0: r.x, x1: r.x + r.w, y0: r.y, y1: Math.min(r.y + r.h, FLOOR_Y) };
    for (const [n, s] of statics) if (hit(b, s)) fail(`card hits ${n} at f${f}`);
  }
  // the ghost on its road: clear of the desks, the managers, the amber top, the tile and the second hire, every frame
  const tileBox = { x0: AUDI.tile.x - AUDI.tile.w / 2, x1: AUDI.tile.x + AUDI.tile.w / 2, y0: AUDI.tile.y - AUDI.tile.h / 2, y1: AUDI.tile.y + AUDI.tile.h / 2 };
  const tower: [string, Box][] = [
    ...[...AUDI.levels, AUDI.top].map((y, i): [string, Box] => [`desk${i}`, { x0: AUDI.px - AUDI.desk.w / 2, x1: AUDI.px + AUDI.desk.w / 2, y0: y, y1: y + AUDI.desk.h }]),
    ...[...AUDI.levels, AUDI.top].map((y, i): [string, Box] => [`peg${i}`, { x0: AUDI.px - PEG_SIZE / 2, x1: AUDI.px + PEG_SIZE / 2, y0: y - PEG_SIZE, y1: y }]),
    ["tile", tileBox],
    ["second hire", { x0: AUDI.secondX - PEG_SIZE / 2, x1: AUDI.secondX + PEG_SIZE / 2, y0: -PEG_SIZE, y1: 0 }],
  ];
  for (let f = GHOST_F[0] + 1; f < GHOST_FADE[1]; f++) {
    const [gx, gy] = ghostAt(f);
    const b = { x0: gx - CARD.w / 2, x1: gx + CARD.w / 2, y0: gy - CARD.h / 2, y1: gy + CARD.h / 2 };
    for (const [n, s] of tower) if (hit(b, s)) fail(`ghost hits ${n} at f${f}`);
  }

}

// ===========================================================================
// THE CUT
// ===========================================================================
const ReportToSomeone: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + SLOT_START;
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  const w = worldAt(f);
  const a = w.audi;
  const L = ledgeContents(w);
  // his slot is drawn by PrincipalSlot (the joint -> an open pocket)
  const slots = L.slots.filter((s) => !(s.x === AUDI.px && s.size === PRINCIPAL_SIZE));
  const sil: SilItem[] = L.sil;
  const pr = a.principal.rise;
  const sinkDy = (1 - clamp01(pr)) * (PRINCIPAL_SIZE + 2);
  const dimA = a.dim;
  const ledgeDim = LEDGE_DIM * win(f, T.dimAudi[0], T.dimAudi[1]);
  // the light gathering on him: a tight warm pool in screen px over his head and shoulders
  const tight = tightAt(f);
  const sp = toScreen(cam, AUDI.px, FLOOR_Y - lerp(PRINCIPAL_SIZE * 0.55, 14, 1 - pr));
  const overlay =
    tight > 0.002 ? (
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          background: `radial-gradient(ellipse ${f3(150 * k + 60)}px ${f3(150 * k + 80)}px at ${f3(sp.x)}px ${f3(sp.y)}px, rgba(255,214,170,${f3(0.09 * tight)}) 0%, rgba(255,214,170,${f3(0.045 * tight)}) 50%, rgba(255,214,170,0) 100%)`,
        }}
      />
    ) : null;
  const pp = POOL(f);
  const pool = { x: pp.x, y: pp.y, strength: pp.strength * breathAt(f) };
  return (
    <OrgStage S={S} cam={cam} rest={REST} pool={pool} sway={false} overlay={overlay}>
      <TeamLine k={k} sil={sil} slots={slots} dim={ledgeDim} />
      <PrincipalSlot rise={pr} k={k} />
      <FerrariOrg k={k} band={band} s={w.ferrari} />
      <RedBullOrg k={k} band={band} s={w.redbull} />
      <Pulse id="ferrari" f={f} k={k} dim={w.ferrari.dim} />
      <Pulse id="redbull" f={f} k={k} dim={w.redbull.dim} />
      {/* Audi without its principal: he is drawn below, apart from the tower's dim */}
      <AudiOrgC k={k} band={band} s={{ ...a, principal: { ...a.principal, rise: 0, label: 0 }, f1Tag: 0 }} />
      <Pulse id="audi" f={f} k={k} dim={dimA} />
      <Road f={f} k={k} />
      {/* the decision card, raised behind his right shoulder (he is drawn over it) */}
      <DecisionCard f={f} k={k} band={band} />
      <PrincipalPeg x={AUDI.px} y={FLOOR_Y} k={k} warm={a.principal.warm} rise={pr} headset={a.principal.headset} shadow={false} />
      <PrincipalLabel x={AUDI.px} k={k} t={a.principal.label} />
      {pr > 0.002 ? (
        <g>
          <defs>
            <clipPath id="rtsTagClip">
              <rect x={AUDI.px - 100} y={-300} width={200} height={300} />
            </clipPath>
          </defs>
          <g clipPath={pr < 1 ? "url(#rtsTagClip)" : undefined}>
            <F1Tag x={AUDI.px} feet={FLOOR_Y + sinkDy} k={k} />
          </g>
        </g>
      ) : null}
      {/* the ghost of his card, travelling the road he did not take */}
      <GhostCard f={f} k={k} />
    </OrgStage>
  );
};

export default ReportToSomeone;
