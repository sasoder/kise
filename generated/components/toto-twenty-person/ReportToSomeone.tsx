// ---------------------------------------------------------------------------
// ReportToSomeone (toto-twenty-person, cut 42). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 283 frames. Palette B1. The shared world: orgWorld.tsx v2 (REVISION_1: no ledge, no
// slots, no labels; the three structures side by side, each principal's feet on FLOOR_Y).
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
// THE MOTION: one camera move, a pull back then one long push in. f0 is cut C's last frame (C_END_CAM, C_END_POOL x
// the breath, AUDI_END_C and C's pay props; all imported). The camera pulls back to the recap (f0-f38, "of these
// people"): all three teams in one frame, centred mid-frame (their visual centre at y 660), their whole span centred
// across with 60 px side margins. A warm bead runs up each principal's reporting line to the amber above him (Ferrari
// f38 up his spoke to the CEO, Red Bull f46 up the stem and out along the four branches to the owners, Audi f54 up
// the one rule behind the managers to the top), each line staying a little brighter behind it, steady by f67. From
// f70 one eased push in on Audi's principal (the truck leads, the zoom runs to ~f190); Ferrari and Red Bull dim by
// tone (f80-f104) and leave left. "A decision" (f129-f139): the decision, an amber document with a cream rosette seal
// and ink tick, enters beside his head (the stout entrance) and he raises it (f139). On "escalated it through the
// hierarchy" a dashed cream road draws up the tower's right side, peg by peg, to the amber top (f170-f207), and a
// hollow cream ghost of the decision climbs it, stopping beside each manager; the real one never moves: the ghost and
// road fade back into the board (f207-f215) as he lowers it. "Might be exposed" (f230-f250): the tower, the second
// hire and the pay dim by tone, the light gathers on him alone. "Lose your job": his reporting line snaps up away
// from his head into the lowest manager (f256-f263); he dims (f256-f266) and drops out by his entrance run back
// (slide down, blur out, his shadow shrinking), the decision and his F1 tag going with him (f262-f277). His light
// stays on the empty spot under the standing tower; a slow creep in about the spot keeps the hold alive to f282.
// Contacts: each bead leaves the head on its first frame and reaches the amber on its last; the road starts at the
// decision's top edge (f170) and stops beside the amber top (f207); the decision is drawn in his exit group, so it
// slides and fades with him.
// JOIN: f0 = AudiHiredToRun's last frame (camera, pool, world exact; the house sway runs on C's clock continued so the
// world lands pixel for pixel; ground drift and grain run on S, accepted).
// AMBER = the power to decide over the principal (Ferrari's CEO, Red Bull's owners, Audi's top); in this cut the
// principal who decides alone briefly holds an amber decision. Cream = the principals.
//
// SOURCES: no figures. Logos: orgWorld (orgLogos.ts). F1 tag: orgWorld's F1Tag (public/cheekypint2/dts/f1.svg).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { COLOR, EDGE, amberBandFor, bloomFilter, clamp01, lerp, mixHex, smoothstep, toScreen } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, camCheck, circlePath, liftAt, makeClockCam, makePoolTrack, restToRest } from "../kits/cheeky-pint/museShared";
import {
  AUDI,
  Appear,
  BOSS_SIZE,
  F1Tag,
  FERRARI_DONE,
  FLOOR_Y,
  FerrariOrg,
  LogoTile,
  OrgPeg,
  OrgRule,
  OrgStage,
  PEG_SIZE,
  PRINCIPAL_SIZE,
  PrincipalPeg,
  REDBULL,
  REDBULL_DONE,
  REPORT_PATHS,
  RULE_GAP,
  RULE_W,
  RedBullOrg,
  TEAM_BOX,
  feetCam,
  partialPolyline,
  pegAnchor,
  polylineLength,
  principalSil,
  ruleColor,
  stoutEntrance,
  type AudiState,
  type FerrariState,
  type P,
  type RedBullState,
} from "./orgWorld";
import { AUDI_END_C, C_END_CAM, C_END_POOL, C_REST, CAudiExtras, C_PAY_BOX, DURATION as C_DURATION, SLOT_START as C_SLOT_START } from "./AudiHiredToRun";

export const FPS = 25;
export const DURATION = 283;
export const SLOT_START = 1051; // story clock S = frame + 1051
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
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
/** The pool's breath (x (1 + 0.05 sin(S / 11))), on C's clock continued for the same reason. */
const breathAt = (f: number) => 1 + 0.05 * Math.sin((f + C_LAST_S) / 11);
/** C's ground parallax origin: keeps the ground's scale and parallax continuous across the join. */
const REST: Cam = C_REST;

// ===========================================================================
// THE CAMERA — pull back to the recap, one long push in on Audi's principal, a slow creep on the empty spot
// ===========================================================================
/** The recap: the three teams' whole span (Ferrari's ring to Audi's second hire, the pay included) centred in the
 *  frame with equal side margins (RECAP_MARGIN, as orgWorld's RECAP), as large as that allows. Centred vertically in
 *  the picture area: the group's visual centre (world y -375, halfway from the tiles' top to the feet) at RECAP_MID_SY,
 *  so the recap reads mid-frame (feet at ~y 784, tiles' top at ~y 536). */
const RECAP_MARGIN = 60;
const RECAP_MID_SY = 660;
const RECAP_MID_Y = (TEAM_BOX.redbull.y0 + FLOOR_Y) / 2;
const RECAP_X0 = Math.min(TEAM_BOX.ferrari.x0, C_PAY_BOX.x0);
const RECAP_X1 = Math.max(TEAM_BOX.audi.x1, C_PAY_BOX.x1);
const RECAP_K = (1080 - 2 * RECAP_MARGIN) / (RECAP_X1 - RECAP_X0);
const RECAP_D: Cam = feetCam((RECAP_X0 + RECAP_X1) / 2, RECAP_K, RECAP_MID_SY + (FLOOR_Y - RECAP_MID_Y) * RECAP_K);
/** The push in: his feet at y 950, the whole tower (tile included) above him, the pay and the second hire beside. */
const K_END = 1.1;
const END_FEET_SY = 950;
const END: Cam = feetCam(AUDI.px, K_END, END_FEET_SY);
const K_HOLD = 1.13;
const START: Cam = C_END_CAM;
const CAM = makeClockCam(
  { x: START.x, y: START.y, k: START.k },
  [
    // the pull back: the zoom out leads (front-loaded), the rise to mid-frame and the truck left follow at the
    // wide k (peak ~43 px/f; settled by f38, the first bead)
    { f0: 0, f1: 20, k: RECAP_D.k, warp: 0.7 },
    { f0: 4, f1: 32, dy: RECAP_D.y - START.y },
    { f0: 6, f1: 31, dx: RECAP_D.x - START.x },
    // the push in: the truck onto Audi leads (he is centred for the decision, f129), the zoom runs on
    { f0: 70, f1: 168, dx: END.x - RECAP_D.x, dy: END.y - RECAP_D.y },
    { f0: 74, f1: 190, k: K_END, warp: 0.85 },
    { f0: 214, f1: 330, k: K_HOLD }, // the creep (finishes past the cut: still moving at f282)
  ],
  DURATION,
);
/** The creep zooms about the empty spot: the k glide alone would zoom about the frame's centre. */
const camRaw = (f: number): Cam => {
  const c = CAM.at(f);
  if (c.k <= K_END) return c;
  // keep world (AUDI.px, FLOOR_Y) where END puts it while k grows past K_END
  const t = clamp01((f - 200) / 20);
  const anchored = { x: AUDI.px, y: FLOOR_Y - (END_FEET_SY - 960) / c.k, k: c.k };
  return { x: lerp(c.x, anchored.x, t), y: lerp(c.y, anchored.y, t), k: c.k };
};
/** The frame's camera with the house sway folded in (the stage gets sway off). */
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
    { f0: 0, f1: 30, x: REDBULL.x, y: -340, strength: 1.4 },
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
type TeamId = "ferrari" | "redbull" | "audi";
const T = {
  pulse: { ferrari: [38, 50], redbull: [46, 57], audi: [54, 67] } as Record<TeamId, [number, number]>,
  dimTeams: [80, 104] as const, // Ferrari and Red Bull dim by tone as the push begins
  card: [129, 139] as const, // the decision's stout entrance ("take a decision")
  cardLift: 139, // he raises it over 7 f
  cardSettle: 207, // lowers it over 8 f
  dimAudi: [230, 250] as const,
  retract: [256, 263] as const, // his line snaps up away from him
  shade: [256, 266] as const, // he dims
  exit: [262, 277] as const, // he drops out (his entrance run back)
};
/** How bright a rule ends after its bead (ruleColor's `bright`). */
const BRIGHT = 0.8;
const AUDI_DIM = 0.6;
const HIS_SHADE = 0.45;

const pulseU = (f: number, id: TeamId) => {
  const [a, b] = T.pulse[id];
  return restToRest(clamp01((f - a) / (b - a)), 2);
};
const teamsDim = (f: number) => win(f, T.dimTeams[0], T.dimTeams[1]);
const audiDim = (f: number) => AUDI_DIM * win(f, T.dimAudi[0], T.dimAudi[1]);
const cardIn = (f: number) => clamp01((f - T.card[0]) / (T.card[1] - T.card[0]));
const cardLift = (f: number) => liftAt(f, T.cardLift, T.cardSettle, 7, 8);
/** 0..1 his exit (1 = standing, 0 = gone): the stout entrance run back. */
const exitT = (f: number) => 1 - clamp01((f - T.exit[0]) / (T.exit[1] - T.exit[0]));
const hisShade = (f: number) => HIS_SHADE * win(f, T.shade[0], T.shade[1]);

// ===========================================================================
// POLYLINE PIECES
// ===========================================================================
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
const lineD = (q: P[]) => `M${q.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}`;

// ===========================================================================
// HIS LINE SNAPS AWAY: Audi's rule loses its bottom end, from his head up into the lowest manager
// ===========================================================================
const AUDI_RULE_L = polylineLength(AUDI.rule);
/** How far up the rule its bottom end has gone (world px along it): to well inside the lowest manager's body. */
const RETRACT_TO = AUDI.rule[0][1] - (AUDI.managers[0].feet - 0.45 * PEG_SIZE);
const retractS = (f: number) => {
  const u = clamp01((f - T.retract[0]) / (T.retract[1] - T.retract[0]));
  // a snap: it lets go slowly, then whips up and stops inside him (ease in, short ease out)
  return RETRACT_TO * smoothstep(Math.pow(u, 0.8));
};

// ===========================================================================
// THE BEADS — a warm bead up each reporting line; the line stays brighter behind it
// ===========================================================================
/** Each route: the trunk from the principal's head, then (Red Bull) the branches it fans into. */
const ROUTES: Record<TeamId, { trunk: P[]; branches: P[][] }> = {
  ferrari: { trunk: REPORT_PATHS.ferrari, branches: [] },
  redbull: { trunk: REPORT_PATHS.redbull, branches: REDBULL.branches.map((b) => [...b]) },
  audi: { trunk: REPORT_PATHS.audi, branches: [] },
};
const BEAD_PX = 20; // screen px
const BEAD_W = 7; // screen px
const BEAD_COLOR = mixHex(COLOR.inkCream, COLOR.amberHot, 0.55);
const Pulse: React.FC<{ id: TeamId; f: number; k: number; dim: number; from?: number }> = ({ id, f, k, dim, from = 0 }) => {
  const u = pulseU(f, id);
  if (u <= 0) return null;
  const { trunk, branches } = ROUTES[id];
  const Lt = polylineLength(trunk);
  const Lb = branches.map((b) => polylineLength(b));
  const meanB = Lb.length ? Lb.reduce((a, b) => a + b, 0) / Lb.length : 0;
  // the trunk's share of the run: one speed up the stem, then the four branches arrive together
  const q = Lb.length ? Lt / (Lt + meanB) : 1;
  const st = Math.min(1, u / q) * Lt;
  const pb = u > q ? (u - q) / (1 - q) : 0;
  const B = BEAD_PX / k;
  // the bead: in over the first 8 % of the run, out over the last 14 % (it enters the amber)
  const [a0, a1] = T.pulse[id];
  const fr = clamp01((f - a0) / (a1 - a0));
  const beadA = smoothstep(fr / 0.08) * (1 - smoothstep((fr - 0.86) / 0.14));
  const trail: P[][] = [subPolyline(trunk, from, st), ...Lb.map((L, i) => (pb > 0 ? subPolyline(branches[i], 0, pb * L) : []))];
  const bead: P[][] = [];
  if (pb <= 0) bead.push(subPolyline(trunk, Math.max(from, st - B), st));
  else
    Lb.forEach((L, i) => {
      const s = pb * L;
      bead.push(subPolyline(branches[i], Math.max(0, s - B), s));
      if (s < B) bead.push(subPolyline(trunk, Math.max(from, Lt - (B - s)), Lt));
    });
  return (
    <g>
      {trail
        .filter((q2) => q2.length >= 2)
        .map((q2, i) => (
          <path key={`t${i}`} d={lineD(q2)} fill="none" stroke={ruleColor(BRIGHT, dim)} strokeWidth={f3(RULE_W / k)} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      {beadA > 0.002 ? (
        <g opacity={f3(beadA)}>
          {bead
            .filter((q2) => q2.length >= 2)
            .map((q2, i) => (
              <path key={`b${i}`} d={lineD(q2)} fill="none" stroke={BEAD_COLOR} strokeWidth={f3(BEAD_W / k)} strokeLinecap="round" strokeLinejoin="round" />
            ))}
        </g>
      ) : null}
    </g>
  );
};

// ===========================================================================
// AUDI'S TOWER — orgWorld's AudiOrg, drawn here in parts so the bead runs UNDER the managers, his line can snap
// away, and he (with the decision) is drawn apart, in his own exit group
// ===========================================================================
const AudiTower: React.FC<{ f: number; k: number; band: [number, number]; s: AudiState }> = ({ f, k, band, s }) => {
  const dim = s.dim;
  const cut = retractS(f);
  const rest = subPolyline(AUDI.rule, cut, AUDI_RULE_L);
  return (
    <g>
      {s.rule > 0 && rest.length >= 2 ? <OrgRule pts={rest} t={s.rule} k={k} bright={s.bright} dim={dim} /> : null}
      <Pulse id="audi" f={f} k={k} dim={dim} from={cut} />
      <LogoTile id="audi" {...AUDI.tile} k={k} appear={s.tile} dim={dim} />
      {AUDI.managers.map((m, i) => (
        <OrgPeg key={i} x={m.x} y={m.feet} k={k} size={m.size} appear={s.managers[i] ?? 0} shade={dim * 0.55} band={band} />
      ))}
      <OrgPeg x={AUDI.top.x} y={AUDI.top.feet} k={k} size={BOSS_SIZE} appear={s.top} amber={s.topAmber * (1 - 0.75 * dim)} shade={dim * 0.55} band={band} />
      <PrincipalPeg x={AUDI.secondX} y={FLOOR_Y} k={k} size={PEG_SIZE} appear={s.second.appear} warm={s.second.warm * (1 - 0.8 * dim)} shade={dim * 0.3} headset={0} />
    </g>
  );
};

// ===========================================================================
// THE DECISION — an amber document (dog-eared, two ink lines, a cream rosette seal with an ink tick and two
// terracotta ribbon tails), held up beside his head, tilted a little; one lifted shadow
// ===========================================================================
/** World px. x/cy = its centre at rest (held); lift = the extra raise; tilt (deg, clockwise). */
const CARD = { x: AUDI.px + 74, cy: -80, w: 56, h: 72, ear: 14, lift: 10, tilt: 6 } as const;
const RIBBON = "#C47B5A";
const cardCentre = (f: number): P => [CARD.x, CARD.cy - CARD.lift * cardLift(f)];
const rotAbout = (p: P, c: P, deg: number): P => {
  const a = (deg * Math.PI) / 180;
  const dx = p[0] - c[0];
  const dy = p[1] - c[1];
  return [c[0] + dx * Math.cos(a) - dy * Math.sin(a), c[1] + dx * Math.sin(a) + dy * Math.cos(a)];
};
/** The tilted card's bounding box with centre c (world px). */
const cardBox = (c: P) => {
  const cs: P[] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => rotAbout([c[0] + (sx * CARD.w) / 2, c[1] + (sy * CARD.h) / 2], c, CARD.tilt));
  return { x0: Math.min(...cs.map((p) => p[0])), x1: Math.max(...cs.map((p) => p[0])), y0: Math.min(...cs.map((p) => p[1])), y1: Math.max(...cs.map((p) => p[1])) };
};
const cardPath = (x0: number, y0: number, w: number, h: number, ear: number) => {
  const r = 4;
  return (
    `M${f3(x0 + r)} ${f3(y0)}H${f3(x0 + w - ear)}L${f3(x0 + w)} ${f3(y0 + ear)}V${f3(y0 + h - r)}` +
    `Q${f3(x0 + w)} ${f3(y0 + h)} ${f3(x0 + w - r)} ${f3(y0 + h)}H${f3(x0 + r)}Q${f3(x0)} ${f3(y0 + h)} ${f3(x0)} ${f3(y0 + h - r)}` +
    `V${f3(y0 + r)}Q${f3(x0)} ${f3(y0)} ${f3(x0 + r)} ${f3(y0)}Z`
  );
};
/** The seal (local to the card's top-left): centre, radius; the tick drawn in its 24-unit Lucide box. */
const SEAL = { cx: 0.5, cy: 0.66, r: 14 } as const;
const tickD = (cx: number, cy: number, g: number) => {
  const gx = cx - g / 2;
  const gy = cy - g / 2;
  const Pt = (u: number, v: number) => `${f3(gx + (u / 24) * g)} ${f3(gy + (v / 24) * g)}`;
  return `M${Pt(20, 6)}L${Pt(9, 17)}L${Pt(4, 12)}`;
};
const DecisionCard: React.FC<{ f: number; k: number; band: [number, number]; shade: number }> = ({ f, k, band, shade }) => {
  const uid = `rts${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const t = cardIn(f);
  if (t <= 0) return null;
  const en = stoutEntrance(t);
  const lift = cardLift(f);
  const [cx, cy] = cardCentre(f);
  const x0 = cx - CARD.w / 2;
  const y0 = cy - CARD.h / 2;
  // it dims with him (by tone, toward the ground)
  const tone = (c: string) => mixHex(c, COLOR.ground, clamp01(shade) * 0.7);
  const amberAt = (yy: number) => tone(mixHex(COLOR.amberTop, COLOR.amberFoot, (yy - band[0]) / Math.max(1e-6, band[1] - band[0])));
  const d = cardPath(x0, y0, CARD.w, CARD.h, CARD.ear);
  const e = CARD.ear;
  const fold = `M${f3(x0 + CARD.w - e)} ${f3(y0)}V${f3(y0 + e - 3)}Q${f3(x0 + CARD.w - e)} ${f3(y0 + e)} ${f3(x0 + CARD.w - e + 3)} ${f3(y0 + e)}H${f3(x0 + CARD.w)}Z`;
  const ink = tone(COLOR.inkDark);
  const sx = x0 + SEAL.cx * CARD.w;
  const sy = y0 + SEAL.cy * CARD.h;
  // two ribbon tails under the seal, notched at the ends
  const tail = (dir: 1 | -1) => {
    const w = 8;
    const a: P = [sx + dir * 3, sy + 4];
    const b: P = [sx + dir * 10, sy + SEAL.r + 9];
    const nx = -(b[1] - a[1]);
    const ny = b[0] - a[0];
    const n = Math.hypot(nx, ny);
    const ox = ((nx / n) * w) / 2;
    const oy = ((ny / n) * w) / 2;
    const mid: P = [(b[0] + a[0]) / 2, (b[1] + a[1]) / 2];
    const notch: P = [b[0] - ((b[0] - mid[0]) * 0.35), b[1] - ((b[1] - mid[1]) * 0.35)];
    return `M${f3(a[0] - ox)} ${f3(a[1] - oy)}L${f3(a[0] + ox)} ${f3(a[1] + oy)}L${f3(b[0] + ox)} ${f3(b[1] + oy)}L${f3(notch[0])} ${f3(notch[1])}L${f3(b[0] - ox)} ${f3(b[1] - oy)}Z`;
  };
  const sealTop = tone(mixHex(COLOR.cream, "#FFF4E2", 0.14));
  const sealFoot = tone(mixHex(COLOR.cream, COLOR.shadow, 0.16));
  const ribTop = tone(mixHex(RIBBON, "#FFF4E2", 0.14));
  const ribFoot = tone(mixHex(RIBBON, COLOR.shadow, 0.16));
  return (
    <Appear t={t} k={k}>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + CARD.h)}>
          <stop offset="0" stopColor={amberAt(y0)} />
          <stop offset="1" stopColor={amberAt(y0 + CARD.h)} />
        </linearGradient>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(sy - SEAL.r)} x2="0" y2={f3(sy + SEAL.r)}>
          <stop offset="0" stopColor={sealTop} />
          <stop offset="1" stopColor={sealFoot} />
        </linearGradient>
        <linearGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(sy)} x2="0" y2={f3(sy + SEAL.r + 12)}>
          <stop offset="0" stopColor={ribTop} />
          <stop offset="1" stopColor={ribFoot} />
        </linearGradient>
      </defs>
      <g transform={`rotate(${f3(CARD.tilt)} ${f3(cx)} ${f3(cy)})`}>
        {/* held up in the air: one shadow at the lifted elevation, floating a little further when he raises it */}
        <UnionShadow sil={[{ d }]} s={0.55} elevation="lifted" lift={lift} strength={en.shadow / Math.max(en.a, 1e-3)} />
        {/* the amber bloom fades out as he dims (the plain body under it) */}
        <path d={d} fill={`url(#${uid}g)`} />
        {shade < HIS_SHADE - 1e-3 ? (
          <g style={{ filter: bloomFilter(k) }} opacity={f3(1 - smoothstep(shade / HIS_SHADE))}>
            <path d={d} fill={`url(#${uid}g)`} />
          </g>
        ) : null}
        <path d={fold} fill={tone(mixHex(COLOR.amberFoot, COLOR.inkDark, 0.18))} />
        <path d={`M${f3(x0 + 4)} ${f3(y0 + EDGE.HOT / k / 2)}H${f3(x0 + CARD.w - e - 0.5)}`} stroke={tone(COLOR.amberHot)} strokeWidth={f3(EDGE.HOT / k)} />
        {/* two printed lines */}
        <path d={`M${f3(x0 + 10)} ${f3(y0 + 15)}H${f3(x0 + 34)}M${f3(x0 + 10)} ${f3(y0 + 24)}H${f3(x0 + 27)}`} stroke={ink} strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
        {/* the rosette seal: ribbon tails, the cream disc, the ink tick */}
        <path d={tail(-1)} fill={`url(#${uid}r)`} />
        <path d={tail(1)} fill={`url(#${uid}r)`} />
        <path d={circlePath(sx, sy, SEAL.r)} fill={`url(#${uid}s)`} />
        <path d={circlePath(sx, sy, SEAL.r - 2.8)} fill="none" stroke={tone(mixHex(COLOR.cream, COLOR.amberFoot, 0.35))} strokeWidth={1.3} />
        <path d={tickD(sx, sy + 0.5, 17)} fill="none" stroke={ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Appear>
  );
};

// ===========================================================================
// THE ROAD NOT TAKEN — a dashed cream road up the right of the tower, peg by peg, to the amber top, and a hollow
// ghost of the decision travelling it; the real one stays with him. Both fade back into the board by f215.
// ===========================================================================
/** The road's x: right of the tower's widest peg (the top) with room for the tilted ghost. */
const GHOST_GAP = 8;
const GHOST_HALF_W = (cardBox([0, 0]).x1 - cardBox([0, 0]).x0) / 2;
const ROAD_X = AUDI.px + BOSS_SIZE / 2 + GHOST_GAP + GHOST_HALF_W;
/** The raised decision's centre (where the ghost leaves from). */
const CARD_UP: P = [CARD.x, CARD.cy - CARD.lift];
/** Each peg's shoulder height up the tower (the managers bottom to top, then the amber top). */
const TOWER = [...AUDI.managers, AUDI.top];
const STOP_YS = TOWER.map((m) => pegAnchor(m.x, m.feet, m.size)[1]);
const GHOST_STOPS: P[] = [CARD_UP, [ROAD_X, CARD_UP[1]], ...STOP_YS.map((y) => [ROAD_X, y] as P)];
/** The ghost reaches each stop on these frames (eased segment by segment: it stops beside every peg). */
const GHOST_F = [173, 178, 185, 192, 199, 207] as const;
/** The road's tip runs this many frames ahead of the ghost. */
const ROAD_LEAD = 3;
const GHOST_FADE = [207, 215] as const;
const ROAD_W = 4; // screen px
const ROAD_DASH = [14 / K_END, 9 / K_END] as const; // world px (fixed: the dashes never crawl)
const ROAD_FOOT = cardBox(CARD_UP).y0 + 6; // starts at the raised decision's top edge
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
  const a = ghostFade(f) * win(f, GHOST_F[0] - ROAD_LEAD, GHOST_F[0] + 1);
  const tipY = Math.min(ROAD_FOOT, ghostAt(f + ROAD_LEAD)[1]);
  const col = COLOR.inkCream;
  return (
    <g opacity={f3(a)}>
      {ROAD_FOOT - tipY > 0.5 ? (
        <path
          d={`M${f3(ROAD_X)} ${f3(ROAD_FOOT)}V${f3(tipY)}`}
          fill="none"
          stroke={col}
          strokeOpacity={0.92}
          strokeWidth={f3(ROAD_W / k)}
          strokeDasharray={`${f3(ROAD_DASH[0])} ${f3(ROAD_DASH[1])}`}
          strokeLinecap="butt"
        />
      ) : null}
      {/* a stub to each peg once the road has passed it */}
      {TOWER.map((m, i) =>
        tipY <= STOP_YS[i] ? (
          <path key={i} d={`M${f3(ROAD_X)} ${f3(STOP_YS[i])}H${f3(m.x + m.size / 2 + RULE_GAP)}`} stroke={col} strokeOpacity={0.92} strokeWidth={f3(ROAD_W / k)} />
        ) : null,
      )}
    </g>
  );
};
/** The ghost: the decision's outline, fold and seal as cream hairlines, no fill, no amber. */
const GhostCard: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  if (f <= GHOST_F[0] || f >= GHOST_FADE[1]) return null;
  const a = win(f, GHOST_F[0], GHOST_F[0] + 4) * ghostFade(f);
  if (a <= 0.002) return null;
  const [cx, cy] = ghostAt(f);
  const x0 = cx - CARD.w / 2;
  const y0 = cy - CARD.h / 2;
  const e = CARD.ear;
  const sx = x0 + SEAL.cx * CARD.w;
  const sy = y0 + SEAL.cy * CARD.h;
  const hw = 2.6 / k;
  return (
    <g opacity={f3(a)} fill="none" stroke={COLOR.inkCream} strokeLinecap="round" strokeLinejoin="round" transform={`rotate(${f3(CARD.tilt)} ${f3(cx)} ${f3(cy)})`}>
      <path d={cardPath(x0, y0, CARD.w, CARD.h, e)} strokeWidth={f3(hw)} />
      <path d={`M${f3(x0 + CARD.w - e)} ${f3(y0)}V${f3(y0 + e)}H${f3(x0 + CARD.w)}`} strokeWidth={f3(hw)} />
      <path d={circlePath(sx, sy, SEAL.r)} strokeWidth={f3(hw)} />
      <path d={tickD(sx, sy + 0.5, 17)} strokeWidth={f3(hw * 1.2)} />
    </g>
  );
};

// ===========================================================================
// THE WORLD STATE PER FRAME
// ===========================================================================
const ferrariAt = (f: number): FerrariState => ({ ...FERRARI_DONE, dim: teamsDim(f) });
const redbullAt = (f: number): RedBullState => ({ ...REDBULL_DONE, dim: teamsDim(f) });
const audiAt = (f: number): AudiState => ({ ...AUDI_END_C, dim: audiDim(f) });

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
  if (Math.abs(p0.x - C_END_POOL.x) > 1e-9 || Math.abs(p0.y - C_END_POOL.y) > 1e-9 || Math.abs(p0.strength - (C_END_POOL.strength ?? 1.6)) > 1e-9) fail("f0 pool is not C_END_POOL");
  if (JSON.stringify(audiAt(0)) !== JSON.stringify(AUDI_END_C)) fail("f0 Audi state is not AUDI_END_C");
  if (JSON.stringify(ferrariAt(0)) !== JSON.stringify(FERRARI_DONE) || JSON.stringify(redbullAt(0)) !== JSON.stringify(REDBULL_DONE)) fail("f0 Ferrari / Red Bull not DONE");
  if (cardIn(0) !== 0 || pulseU(0, "ferrari") !== 0 || retractS(0) !== 0 || exitT(0) !== 1 || hisShade(0) !== 0) fail("something extra at f0");
  // the recap settled by f38 (the first bead): the frame within ~4 px of it
  const c38 = camRaw(38);
  const e38 = Math.max(Math.abs((c38.x - RECAP_D.x) * c38.k), Math.abs((c38.y - RECAP_D.y) * c38.k), Math.abs(c38.k / RECAP_D.k - 1) * 960);
  if (e38 > 4) fail(`f38 is ${e38.toFixed(1)} px from the recap`);
  // the recap mid-frame: the group's visual centre at y 640-680
  const mid = toScreen(RECAP_D, 0, RECAP_MID_Y).y;
  if (mid < 640 || mid > 680) fail(`recap centre at y ${mid.toFixed(0)}`);
  // the recap: equal side margins (>= 56 px); the tiles below y 260
  const xs = [TEAM_BOX.ferrari.x0, TEAM_BOX.audi.x1, C_PAY_BOX.x0, C_PAY_BOX.x1].map((x) => toScreen(RECAP_D, x, 0).x);
  const ml = Math.min(...xs);
  const mr = 1080 - Math.max(...xs);
  if (ml < 56 || mr < 56 || Math.abs(ml - mr) > 1) fail(`recap margins ${ml.toFixed(0)} / ${mr.toFixed(0)}`);
  if (toScreen(RECAP_D, 0, TEAM_BOX.redbull.y0).y < 260) fail("recap: tiles too high");
  // the camera: speed (house cap 45 px/f)
  const cc = camCheck(camRaw, 0, DURATION - 1);
  if (cc.maxV > 45) fail(`camera speed ${cc.maxV.toFixed(1)} px/f at f${cc.atV}`);
  // the end: the empty spot at y 900-960, the tower's tile fully in frame
  const cE = camRaw(DURATION - 1);
  const spotY = toScreen(cE, AUDI.px, FLOOR_Y).y;
  if (spotY < 900 || spotY > 960) fail(`end spot at y ${spotY.toFixed(0)}`);
  if (toScreen(cE, AUDI.px, AUDI.tile.y - AUDI.tile.h / 2).y < 40) fail("end: tile top cut");
  // everything Audi above the caption band from the push's end on
  for (let f = 190; f < DURATION; f++) if (toScreen(camRaw(f), AUDI.px, FLOOR_Y).y > 1066) fail(`feet in the caption band at f${f}`);
  // collisions
  type Box = { x0: number; x1: number; y0: number; y1: number };
  const hit = (a: Box, b: Box) => a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1;
  const pegBox = (m: { x: number; feet: number; size: number }): Box => ({ x0: m.x - m.size / 2, x1: m.x + m.size / 2, y0: m.feet - m.size, y1: m.feet });
  const tileBox: Box = { x0: AUDI.tile.x - AUDI.tile.w / 2, x1: AUDI.tile.x + AUDI.tile.w / 2, y0: AUDI.tile.y - AUDI.tile.h / 2, y1: AUDI.tile.y + AUDI.tile.h / 2 };
  const second: Box = pegBox({ x: AUDI.secondX, feet: FLOOR_Y, size: PEG_SIZE });
  const hisHead: Box = { x0: AUDI.px - 0.24 * PRINCIPAL_SIZE, x1: AUDI.px + 0.24 * PRINCIPAL_SIZE, y0: -PRINCIPAL_SIZE, y1: -0.5 * PRINCIPAL_SIZE };
  const statics: [string, Box][] = [
    ...TOWER.map((m, i): [string, Box] => [`tower peg ${i}`, pegBox(m)]),
    ["tile", tileBox],
    ["second hire", second],
    ["pay", C_PAY_BOX],
    ["his head", hisHead],
    ["the rule", { x0: AUDI.px - 2, x1: AUDI.px + 2, y0: AUDI.rule[1][1], y1: AUDI.rule[0][1] }],
  ];
  for (let f = T.card[0]; f < T.exit[1]; f++) {
    const b = cardBox(cardCentre(f));
    for (const [n, s] of statics) if (hit(b, s)) fail(`decision hits ${n} at f${f}`);
  }
  // the ghost on its road: clear of the tower, the tile, the second hire, every frame (it starts ON the decision)
  for (let f = GHOST_F[1]; f < GHOST_FADE[1]; f++) {
    const b = cardBox(ghostAt(f));
    for (const [n, s] of statics) if (n !== "his head" && hit(b, s)) fail(`ghost hits ${n} at f${f}`);
  }
  // the road clear of the tower and the tile
  for (const [n, s] of statics) if (n !== "pay" && s.x1 > ROAD_X - ROAD_W && s.y1 > STOP_YS[STOP_YS.length - 1] && s.y0 < ROAD_FOOT && n !== "his head") fail(`road crosses ${n}`);
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
  const fe = ferrariAt(f);
  const rb = redbullAt(f);
  const a = audiAt(f);
  const p = a.principal;
  const out = exitT(f);
  const en = stoutEntrance(out);
  const shade = Math.max(p.shade ?? 0, hisShade(f));
  // the light gathering on him: a tight warm pool in screen px over his head and shoulders, then on the empty spot
  const tight = tightAt(f);
  const sp = toScreen(cam, AUDI.px, FLOOR_Y - lerp(14, PRINCIPAL_SIZE * 0.55, en.a));
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
      <FerrariOrg k={k} band={band} s={fe} />
      <RedBullOrg k={k} band={band} s={rb} />
      <Pulse id="ferrari" f={f} k={k} dim={fe.dim} />
      <Pulse id="redbull" f={f} k={k} dim={rb.dim} />
      <AudiTower f={f} k={k} band={band} s={a} />
      <CAudiExtras k={k} dim={a.dim} f1Tag={0} />
      <Road f={f} k={k} />
      {/* him, the decision and his tag: one exit group (the stout entrance run back), his shadow shrinking with it */}
      <Appear t={out} k={k}>
        <DecisionCard f={f} k={k} band={band} shade={shade} />
        <UnionShadow
          sil={principalSil(AUDI.px, FLOOR_Y, PRINCIPAL_SIZE, p.headset)}
          s={PRINCIPAL_SIZE / 96}
          lift={p.lift ?? 0}
          contact={{ x: AUDI.px, y: FLOOR_Y, w: PRINCIPAL_SIZE * 0.8 }}
          strength={(stoutEntrance(p.appear).shadow / Math.max(stoutEntrance(p.appear).a, 1e-3)) * (en.shadow / Math.max(en.a, 1e-3))}
        />
        <PrincipalPeg x={AUDI.px} y={FLOOR_Y} k={k} appear={p.appear} warm={p.warm} shade={shade} headset={p.headset} lift={p.lift} shadow={false} />
        <F1Tag x={AUDI.px} feet={FLOOR_Y} k={k} dim={shade} />
      </Appear>
      {/* the ghost of the decision, travelling the road he did not take */}
      <GhostCard f={f} k={k} />
    </OrgStage>
  );
};

export default ReportToSomeone;
