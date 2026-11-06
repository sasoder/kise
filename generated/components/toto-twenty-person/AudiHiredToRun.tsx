// ---------------------------------------------------------------------------
// AudiHiredToRun (toto-twenty-person, cut 20). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 278 frames. Palette B1. The shared world: orgWorld.tsx (the team principals' line).
//
// CHECK LINE: "at Audi the team sits at the bottom of a tall corporate ladder, and it's run by managers hired in
// from the group and from F1, on a salary and a bonus".
//
// THE LINE: "Then you have a strictly corporate structure like Audi, where you have people from the group and
// from... Formula One are being hired to run the team, they have a salary, they might have a bonus, so"
// WORD -> FRAME: you 3 · have 6 · a 11 · strictly 15 · corporate 24 · structure 36 · like 51 · Audi 62 (ends 71) ·
// where 76 · you 85 · have 95 · people 98 · from 106 · the 121 · group 127 · and 134 · from... 146 · Formula 170 ·
// One 177 · are 184 · being 190 · hired 195 · to 207 · run 215 · the 221 · team 226 · they 234 · have 238 · a 241 ·
// salary 241 · they 250 · might 255 · have 258 · a 262 · bonus 265 (ends 273) · so 273
// DURATION: slot 20.600 -> 31.720 s = 11.120 s x 25 = 278 frames (f0..f277). S = frame + 515.
//
// THE MOTION: one crane up the tower, then one long descent onto the team. From HOME.redbull the camera trucks
// right along the ledge to Audi's two empty slots (f0-32, peak ~41 px/f) and cranes up as the chain builds level
// by level above them (f19-61: desk card out of its slot, kraft manager out of the desk, the spine drawing up to the
// next desk's slot); at the top the corporate peg warms to amber and the four-rings tile rises (f52-72, "like
// Audi", rings readable f66). Then ONE eased move (f74-~205) descends the chain after a kraft peg that peels out
// from behind the lowest manager and travels down beside the rule to the ledge (f98-134, "people from the group")
// while pushing in to k 1.85 close on the ledge (C_END_CAM): the principal ~166 px, the slots and the slip in the
// middle, the lowest desks and the rule running up out of frame. A principal-sized peg with a small F1 tag slides
// in from the left (f146-182, "from... Formula One"). On "hired" both step into the two empty slots (f195-211),
// warm to cream, the F1 one gets the headset and the TEAM PRINCIPAL card (by f233), and his rule draws up the tower
// (f222-236). A blank pay slip rises out of the ledge (f239-247, "salary"), SALARY comes in whole (f247-256), the
// "+ BONUS" chip lands stacked squarely on top of it, centred (f265-273, "bonus"). From ~f205 the camera holds (sway, drift, grain, the pool's
// breath) and lands exactly on C_END_CAM with AUDI_END_C (cut D opens on it and pulls back).
// Contacts: the spine's tip reaches each desk's slot line on the frame that desk starts rising (f30, f41, f52);
// the group hire is drawn behind the lowest manager until it slides out (f98); each hire touches its slot on
// the frame it is handed to the world state (second f209, principal f211).
// DEVIATION from the brief: the F1 hire slides in from the LEFT edge (from the rest of F1, Red Bull's side)
// and waits left of the slots, while the group hire waits right of them. Coming from the right, the F1 peg
// would have to pass through the group peg (or the group peg through him) to reach the principal's slot,
// which is LEFT of the second slot in orgWorld; from the left both simply step inward into their slots.
// AMBER = the power to decide over the principal (Audi: the corporate top); cream = the principal; kraft = anyone.
//
// SOURCES: the four rings = orgLogos AUDI_MARK (Commons Audi-Logo_2016.svg); the F1 mark = public/cheekypint2/dts/
// f1.svg (the ® dropped). Chain (VW -> AUDI AG -> Audi Motorsport / Sauber -> team) per LOGOS_READY.md; no names
// or figures on screen (the hired managers stay anonymous: Binotto from Ferrari, Wheatley from Red Bull, who left
// in March 2026).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { amberBandFor, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { LIFT_DY, UnionShadow, camCheck, makeClockCam, makePoolTrack, restToRest, type SilItem } from "../kits/cheeky-pint/museShared";
import {
  AUDI,
  AUDI_EMPTY,
  FERRARI_DONE,
  FLOOR_Y,
  FerrariOrg,
  HOME,
  OrgStage,
  PEG_SIZE,
  POOL_AT,
  PRINCIPAL_SIZE,
  PrincipalPeg,
  AUDI_DONE_C,
  AUDI_CHIP_C,
  AudiOrgC,
  F1Tag,
  REDBULL_DONE,
  RedBullOrg,
  TeamLine,
  chipRectC,
  ledgeCam,
  ledgeContents,
  principalLabelRect,
  principalSil,
  type AudiStateC,
  type LedgeSlot,
  type WorldStateC,
} from "./orgWorld";
import { camAt as camA } from "./FerrariOneOfTen";

export const FPS = 25;
export const DURATION = 278;
export const SLOT_START = 515; // the slot's first frame in the sequence (story clock S = frame + 515)
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** Eased 0..1 over [f0, f1] (rest to rest, the house soft landing). */
const ease = (f: number, f0: number, f1: number) => restToRest(clamp01((f - f0) / (f1 - f0)));
const win = (f: number, f0: number, f1: number) => smoothstep((f - f0) / (f1 - f0));
const lin = (f: number, f0: number, f1: number) => clamp01((f - f0) / (f1 - f0));

// ===========================================================================
// THE CAMERA — truck right, crane up with the chain, then ONE long descent + push-in onto the ledge
// ===========================================================================
/** The top of the crane: the amber top's desk at the frame's middle, pegs ~85 px. */
const K_TOP = 1.18;
const Y_TOP = AUDI.top;
const START = HOME.redbull;
/** Cut C's last camera (cut D opens on it): close on the Audi ledge, the principal ~166 px tall, the ledge at
 *  screen y 925 so the TEAM PRINCIPAL card ends above y 1065; the lowest desks and the rule run up out of frame. */
export const C_END_CAM: Cam = ledgeCam(AUDI.px + 5, 1.85, 925);
/** Cut C's last pool point (before the breath x (1 + 0.05 sin(S / 11)) that A, B and C apply). */
export const C_END_POOL = { x: AUDI.px + 5, y: -150, strength: 1.6 } as const;
const CAM = makeClockCam(
  { x: START.x, y: START.y, k: START.k },
  [
    { f0: 0, f1: 32, dx: AUDI.px - START.x, warp: 0.75 }, // truck right along the ledge (peak ~41 px/f)
    { f0: 0, f1: 14, k: 0.88, warp: 0.8 }, // easing back a touch while it trucks
    { f0: 16, f1: 66, dy: Y_TOP - START.y, k: K_TOP }, // crane up with the chain
    // one long move: down the chain after the group hire (front-loaded, so the ledge is settled for the F1 slide)
    // while pushing in to the close ledge framing
    { f0: 74, f1: 160, dy: C_END_CAM.y - Y_TOP, dx: C_END_CAM.x - AUDI.px },
    { f0: 78, f1: 200, k: C_END_CAM.k },
  ],
  DURATION,
);
/** The last frames land EXACTLY on C_END_CAM (the follower has long settled there; this only removes the residue). */
const camAt = (f: number): Cam => {
  const c = CAM.at(f);
  const t = smoothstep((f - 240) / 30);
  return { x: lerp(c.x, C_END_CAM.x, t), y: lerp(c.y, C_END_CAM.y, t), k: lerp(c.k, C_END_CAM.k, t) };
};
const POOL_TRACK = makePoolTrack(
  POOL_AT.redbull,
  [
    { f0: 0, f1: 32, x: AUDI.px, y: -300 },
    { f0: 16, f1: 66, x: AUDI.px, y: AUDI.top - 40 },
    { f0: 76, f1: 180, x: C_END_POOL.x, y: C_END_POOL.y, strength: C_END_POOL.strength },
  ],
  DURATION,
);
/** The pool breathes on the story clock as in cuts A and B (x (1 + 0.05 sin(S / 11))). */
const poolAt = (f: number) => {
  const p = POOL_TRACK(f);
  const t = smoothstep((f - 240) / 30);
  const breath = 1 + 0.05 * Math.sin((f + SLOT_START) / 11);
  return { x: lerp(p.x, C_END_POOL.x, t), y: lerp(p.y, C_END_POOL.y, t), strength: lerp(p.strength, C_END_POOL.strength, t) * breath };
};
/** The ground's parallax origin: cut A's opening camera, as in cut B, so the board carries on across the joins. */
const REST: Cam = camA(0);

// ===========================================================================
// THE TIMELINE (frames)
// ===========================================================================
/** Each level of the chain starts rising on these frames: desks 0..2, then the corporate top's desk. */
const LEVEL_F = [19, 30, 41, 52] as const;
const DESK_F = 10; // a desk card's rise
const MGR_LAG = 4; // its manager starts rising this many frames later
const MGR_F = 9;
const T = {
  topAmber: [60, 72],
  tile: [58, 69],
  // the group hire: out from behind the lowest manager, down beside the rule, onto the ledge right of the slots
  group: [98, 134],
  groupX: AUDI.secondX + 85,
  // the F1 hire: in from the left along the ledge, waits left of the slots
  f1: [146, 182],
  f1X0: 1335, // just off the left edge as the slide starts (the camera is pushing in)
  f1X: AUDI.px - 95,
  // both step into the slots
  stepG: [195, 209],
  stepF: [197, 211],
  warmG: [209, 223],
  warmF: [211, 225],
  headset: [213, 227],
  label: [220, 232],
  link: [222, 236],
  slip: [239, 247], // a blank card rises out of its slot ("salary" f241)
  slipText: [247, 256], // then SALARY comes in whole
  chip: [265, 273],
} as const;

/** The spine's drawn fraction: its tip reaches desk i+1's slot line on the frame that desk starts rising. */
const SPINE_SEG = AUDI.levels.length; // three segments: desk0 -> desk1 -> desk2 -> the top desk
const spineAt = (f: number) => {
  let t = 0;
  for (let i = 0; i < SPINE_SEG; i++) t += lin(f, LEVEL_F[i] + 6, LEVEL_F[i + 1]) / SPINE_SEG;
  return t;
};

const audiAt = (f: number): AudiStateC => {
  const desks = [0, 1, 2].map((i) => ease(f, LEVEL_F[i], LEVEL_F[i] + DESK_F));
  const managers = [0, 1, 2].map((i) => ease(f, LEVEL_F[i] + MGR_LAG, LEVEL_F[i] + MGR_LAG + MGR_F));
  const inF = f >= T.stepF[1];
  const inG = f >= T.stepG[1];
  return {
    ...AUDI_EMPTY,
    desks,
    managers,
    spine: spineAt(f),
    topDesk: ease(f, LEVEL_F[3], LEVEL_F[3] + DESK_F),
    top: ease(f, LEVEL_F[3] + MGR_LAG, LEVEL_F[3] + MGR_LAG + MGR_F),
    topAmber: win(f, T.topAmber[0], T.topAmber[1]),
    tile: ease(f, T.tile[0], T.tile[1]),
    principal: inF
      ? { rise: 1, warm: win(f, T.warmF[0], T.warmF[1]), headset: ease(f, T.headset[0], T.headset[1]), label: lin(f, T.label[0], T.label[1]) }
      : AUDI_EMPTY.principal,
    second: inG ? { rise: 1, warm: win(f, T.warmG[0], T.warmG[1]) } : AUDI_EMPTY.second,
    link: win(f, T.link[0], T.link[1]),
    slip: ease(f, T.slip[0], T.slip[1]),
    chip: lin(f, T.chip[0], T.chip[1]),
    slipText: lin(f, T.slipText[0], T.slipText[1]),
    f1Tag: inF ? 1 : 0,
  };
};

// ===========================================================================
// THE TWO HIRES while they are the cut's own (before they are handed to the world state)
// ===========================================================================
/** A hire's pose; `lw` = its weight in the ledge's one shadow (standing on it), `own` = its own lifted shadow. */
type Hire = { x: number; y: number; lift: number; on: boolean; lw: number; own: number };
const weights = (y: number, lift: number) => {
  const lw = (1 - lift) * clamp01(1 - Math.abs(y - FLOOR_Y) / 24);
  return { lw, own: 1 - lw };
};
const LIFT_ENV = (u: number) => (u <= 0 || u >= 1 ? 0 : smoothstep(u / 0.18) * (1 - smoothstep((u - 0.78) / 0.22)));
/** The group hire: x leads (clear of the desk) before it descends; it lands right of the second slot. */
const groupAt = (f: number): Hire => {
  if (f < T.group[0]) return { x: AUDI.px, y: AUDI.levels[0], lift: 0, on: false, lw: 0, own: 0 };
  if (f >= T.stepG[1]) return { x: AUDI.secondX, y: FLOOR_Y, lift: 0, on: false, lw: 0, own: 0 };
  if (f >= T.stepG[0]) {
    const u = (f - T.stepG[0]) / (T.stepG[1] - T.stepG[0]);
    const lift = LIFT_ENV(u);
    return { x: lerp(T.groupX, AUDI.secondX, restToRest(u)), y: FLOOR_Y, lift, on: true, ...weights(FLOOR_Y, lift) };
  }
  const u = clamp01((f - T.group[0]) / (T.group[1] - T.group[0]));
  const ux = restToRest(clamp01(u / 0.5));
  const uy = restToRest(clamp01((u - 0.22) / 0.78));
  const X1 = AUDI.px + 112; // clear of the desk (its right edge + half a peg)
  const x = ux < 1 ? lerp(AUDI.px, X1, ux) : X1;
  const xx = lerp(x, T.groupX, restToRest(clamp01((u - 0.3) / 0.7)));
  const y = lerp(AUDI.levels[0], FLOOR_Y, uy);
  const lift = LIFT_ENV(u);
  const wts = weights(y, lift);
  // peeling off the desk its shadow grows out of the manager's (no doubled shadow at the start)
  return { x: xx, y, lift, on: true, lw: wts.lw, own: wts.own * smoothstep(u / 0.18) };
};
/** The F1 hire: slides in from the left along the ledge, waits, steps right into the principal's slot. */
const f1At = (f: number): Hire => {
  if (f < T.f1[0]) return { x: T.f1X0, y: FLOOR_Y, lift: 0, on: false, lw: 0, own: 0 };
  if (f >= T.stepF[1]) return { x: AUDI.px, y: FLOOR_Y, lift: 0, on: false, lw: 0, own: 0 };
  if (f >= T.stepF[0]) {
    const u = (f - T.stepF[0]) / (T.stepF[1] - T.stepF[0]);
    const lift = LIFT_ENV(u);
    return { x: lerp(T.f1X, AUDI.px, restToRest(u)), y: FLOOR_Y, lift, on: true, ...weights(FLOOR_Y, lift) };
  }
  const u = clamp01((f - T.f1[0]) / (T.f1[1] - T.f1[0]));
  const lift = LIFT_ENV(u);
  return { x: lerp(T.f1X0, T.f1X, restToRest(u, 2.2)), y: FLOOR_Y, lift, on: true, ...weights(FLOOR_Y, lift) };
};

// ===========================================================================
// THE STATE THIS CUT ENDS ON (cut D opens on it)
// ===========================================================================
/** Cut C's last frame: orgWorld's WORLD_DONE_C (Ferrari and Red Bull done, Audi = AUDI_DONE_C: the close-up
 *  slip + chip, the F1 tag on the principal), drawn with OrgWorldC, at C_END_CAM, pool C_END_POOL (+ breath). */
export const AUDI_END_C: AudiStateC = AUDI_DONE_C;

// ===========================================================================
// LOAD-TIME CHECKS: the join, the end state, the camera, collisions of everything that moves
// ===========================================================================
{
  const fail = (m: string) => {
    throw new Error(`AudiHiredToRun: ${m}`);
  };
  const c0 = camAt(0);
  if (Math.abs(c0.x - HOME.redbull.x) > 1e-6 || Math.abs(c0.y - HOME.redbull.y) > 1e-6 || Math.abs(c0.k - HOME.redbull.k) > 1e-9) fail("f0 camera is not HOME.redbull");
  const cE = camAt(DURATION - 1);
  if (cE.x !== C_END_CAM.x || cE.y !== C_END_CAM.y || cE.k !== C_END_CAM.k) fail("last camera is not C_END_CAM");
  // the end framing: readable things above y 1065, SALARY and + BONUS cap height >= 28 px, the principal ~150-170 px
  const scr = (x: number, y: number) => ({ x: 540 + (x - cE.x) * cE.k, y: 960 + (y - cE.y) * cE.k });
  const lab = principalLabelRect(AUDI.px);
  if (scr(0, lab.y + lab.h).y > 1065) fail(`TEAM PRINCIPAL card bottom at y ${scr(0, lab.y + lab.h).y.toFixed(0)}`);
  if (AUDI.slip.px * 0.718 * cE.k < 28 || AUDI_CHIP_C.px * 0.718 * cE.k < 28) fail("slip / chip text under 28 px cap height");
  const ch = chipRectC(1);
  if (scr(ch.x, 0).x < 40 || scr(AUDI.secondX + PEG_SIZE / 2, 0).x > 1040) fail("the ledge group does not fit the frame");
  if (PRINCIPAL_SIZE * cE.k < 150 || PRINCIPAL_SIZE * cE.k > 170) fail(`principal ${(PRINCIPAL_SIZE * cE.k).toFixed(0)} px`);
  // the F1 hire starts wholly off the left edge
  const c146 = camAt(T.f1[0]);
  if (540 + (T.f1X0 + PRINCIPAL_SIZE / 2 + 8 - c146.x) * c146.k > -2) fail("the F1 hire shows before its slide");
  const near = (a: unknown, b: unknown): boolean =>
    typeof a === "number" && typeof b === "number"
      ? Math.abs(a - b) < 1e-9
      : typeof a === "object" && a !== null && typeof b === "object" && b !== null
        ? Object.keys(b).every((key) => near((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) && Object.keys(a).length === Object.keys(b).length
        : a === b;
  if (!near(audiAt(DURATION - 1), AUDI_DONE_C)) fail(`end state differs from AUDI_DONE_C: ${JSON.stringify(audiAt(DURATION - 1))}`);
  if (!near(audiAt(0), { ...AUDI_EMPTY, slipText: 0, f1Tag: 0 })) fail("f0 Audi state is not AUDI_EMPTY");
  const cc = camCheck(camAt, 0, DURATION - 1);
  if (cc.maxV > 60) fail(`camera speed ${cc.maxV.toFixed(1)} px/f at f${cc.atV}`);
  // collisions: a moving peg's box against every other box it could meet (world px, 2 px tolerance)
  type Box = { x0: number; x1: number; y0: number; y1: number };
  const pegBox = (x: number, feet: number, size: number): Box => ({ x0: x - size / 2, x1: x + size / 2, y0: feet - size, y1: feet });
  const hit = (a: Box, b: Box) => a.x0 < b.x1 - 2 && b.x0 < a.x1 - 2 && a.y0 < b.y1 - 2 && b.y0 < a.y1 - 2;
  for (let f = 0; f < DURATION; f++) {
    const s = audiAt(f);
    const g = groupAt(f);
    const h = f1At(f);
    const statics: [string, Box, boolean][] = [];
    AUDI.levels.forEach((y, i) => {
      if (s.desks[i] > 0) statics.push([`desk${i}`, { x0: AUDI.px - AUDI.desk.w / 2, x1: AUDI.px + AUDI.desk.w / 2, y0: y, y1: y + AUDI.desk.h }, i === 0]);
      if (s.managers[i] > 0) statics.push([`manager${i}`, pegBox(AUDI.px, y, PEG_SIZE), i === 0]);
    });
    if (s.slip > 0) statics.push(["slip", { x0: AUDI.slipX - AUDI.slip.w / 2, x1: AUDI.slipX + AUDI.slip.w / 2, y0: -AUDI.slip.h, y1: 0 }, false]);
    if (s.principal.rise > 0) statics.push(["principal", pegBox(AUDI.px, 0, PRINCIPAL_SIZE), false]);
    if (s.second.rise > 0) statics.push(["second", pegBox(AUDI.secondX, 0, PEG_SIZE), false]);
    const gb = pegBox(g.x, g.y - LIFT_DY * g.lift, PEG_SIZE);
    const hb = pegBox(h.x, h.y - LIFT_DY * h.lift, PRINCIPAL_SIZE);
    for (const [n, b, home] of statics) {
      // the group hire starts hidden behind the lowest manager (on its desk) and peels out of it
      const leaving = home && f < T.group[0] + 12;
      if (g.on && !leaving && hit(gb, b)) fail(`group hire hits ${n} at f${f}`);
      if (h.on && hit(hb, b)) fail(`F1 hire hits ${n} at f${f}`);
    }
    if (g.on && h.on && hit(gb, hb)) fail(`the hires collide at f${f}`);
  }
}

// ===========================================================================
// THE CUT
// ===========================================================================
const AudiHiredToRun: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + SLOT_START;
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  const a = audiAt(f);
  const w: WorldStateC = { ferrari: FERRARI_DONE, redbull: REDBULL_DONE, audi: a };
  const g = groupAt(f);
  const h = f1At(f);
  // the ledge's one shadow carries a hire while it stands on it; while it travels its own (lifted) shadow takes over
  const L = ledgeContents(w);
  const restSil: SilItem[] = [];
  if (g.on && g.lw > 0.002) restSil.push(...principalSil(g.x, FLOOR_Y, PEG_SIZE, 1).map((q) => ({ ...q, a: g.lw })));
  if (h.on && h.lw > 0.002) restSil.push(...principalSil(h.x, FLOOR_Y, PRINCIPAL_SIZE, 1).map((q) => ({ ...q, a: h.lw })));
  const slots: LedgeSlot[] = L.slots;
  const gFeet = g.y - LIFT_DY * g.lift;
  const hFeet = h.y - LIFT_DY * h.lift;
  const ownShadow = (p: Hire, size: number, feet: number) =>
    p.own > 0.002 ? <UnionShadow sil={principalSil(p.x, feet, size, 1)} s={0.75} elevation="rest" lift={p.lift} strength={p.own} contact={null} /> : null;
  const tag = h.on ? <F1Tag x={h.x} feet={hFeet} k={k} /> : null; // after the hand-over AudiOrgC draws it
  return (
    <OrgStage S={S} cam={cam} rest={REST} pool={poolAt(f)}>
      <TeamLine k={k} sil={[...L.sil, ...restSil]} slots={slots} />
      <FerrariOrg k={k} band={band} s={w.ferrari} />
      <RedBullOrg k={k} band={band} s={w.redbull} />
      {/* the group hire is drawn under the chain: it starts hidden behind the lowest manager */}
      {g.on ? (
        <g>
          {ownShadow(g, PEG_SIZE, gFeet)}
          <PrincipalPeg x={g.x} y={gFeet} k={k} size={PEG_SIZE} warm={0} rise={1} headset={0} shadow={false} />
        </g>
      ) : null}
      <AudiOrgC k={k} band={band} s={a} />
      {h.on ? (
        <g>
          {ownShadow(h, PRINCIPAL_SIZE, hFeet)}
          <PrincipalPeg x={h.x} y={hFeet} k={k} size={PRINCIPAL_SIZE} warm={0} rise={1} headset={0} shadow={false} />
        </g>
      ) : null}
      {tag}
    </OrgStage>
  );
};

export default AudiHiredToRun;
