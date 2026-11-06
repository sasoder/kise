// ---------------------------------------------------------------------------
// AudiHiredToRun (toto-twenty-person, cut 20). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 278 frames. Palette B1. The shared world: orgWorld.tsx v2 (REVISION_1: no ledge, no
// boxes under people, no labels, symmetric structures, the principal bottom centre). The pay: payProps.tsx.
//
// CHECK LINE: "at Audi the team sits at the bottom of a tall corporate tower, and it's run by people hired in from
// the group and from F1, on a salary and a bonus".
//
// THE LINE: "Then you have a strictly corporate structure like Audi, where you have people from the group and
// from... Formula One are being hired to run the team, they have a salary, they might have a bonus, so"
// WORD -> FRAME: you 3 · have 6 · a 11 · strictly 15 · corporate 24 · structure 36 · like 51 · Audi 62 (ends 71) ·
// where 76 · you 85 · have 95 · people 98 · from 106 · the 121 · group 127 · and 134 · from... 146 · Formula 170 ·
// One 177 · are 184 · being 190 · hired 195 · to 207 · run 215 · the 221 · team 226 · they 234 · have 238 · a 241 ·
// salary 241 · they 250 · might 255 · have 258 · a 262 · bonus 265 (ends 273) · so 273
// DURATION: slot 20.600 -> 31.720 s = 11.120 s x 25 = 278 frames (f0..f277). S = frame + 515.
//
// THE MOTION: from HOME.redbull the camera trucks right to Audi (f0-38, pulling back a touch on the way, peak
// ~42 px/f) and cranes up the tower as it builds level by level over the principal's empty spot ("strictly
// corporate structure": the three kraft managers f22, f31, f40, the corporate top f49); the top warms to amber and
// the four-rings tile settles above him on "like Audi" (f56-69, rings readable ~f66). The camera cranes back down
// to HOME.audi (f72-~118) and holds (sway, drift, grain, the pool's breath). "people from the group": a kraft peg
// slides out from behind the lowest manager (quickly) and glides down to stand beside the empty spot, on the right (f98-134).
// "from... Formula One": a second kraft peg with the small F1 tag glides in from the right, high over the group
// hire's head (f146-207), drops down the clear channel between the tower and the hire (~30 px each side) and
// curves into the principal's spot on "hired" (lands f207). "to run the team": he warms to cream and the headset lowers onto him (f207-225), his rule
// draws up from his head to the corporate top (f218-234); the group hire warms to cream beside him (f209-223).
// "salary": the pay envelope with its banknotes enters on the other side, mirroring the hire (f240-250); "bonus":
// the ribboned BONUS envelope joins it and three coins land on their stack (f260-274). Living hold on HOME.audi.
// Contacts: the group hire is drawn under the lowest manager until it has slid out from behind him; each hire's
// own (lifted) shadow hands over to the world state's shadow on the frame it lands (group f134, F1 f207).
// AMBER = the power to decide over the principal (Audi: the corporate top); cream = the principal (and, at Audi,
// the hire beside him: AUDI_DONE); kraft = anyone. The pay is real-object colour (REVISION_1 #7).
//
// SOURCES: the four rings = orgLogos AUDI_MARK (Commons Audi-Logo_2016.svg); the F1 mark = public/cheekypint2/dts/
// f1.svg (the ® dropped). No names or figures on screen (the hired managers stay anonymous).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { amberBandFor, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { LIFT_DY, UnionShadow, camCheck, makeClockCam, makePoolTrack, restToRest } from "../kits/cheeky-pint/museShared";
import {
  AUDI,
  AUDI_DONE,
  AUDI_EMPTY,
  AudiOrg,
  BOSS_SIZE,
  F1Tag,
  FERRARI_DONE,
  FLOOR_Y,
  FerrariOrg,
  HOME,
  OrgStage,
  PEG_SIZE,
  POOL_AT,
  PRINCIPAL_SIZE,
  PrincipalPeg,
  REDBULL_DONE,
  RedBullOrg,
  principalSil,
  type AudiState,
  type WorldState,
} from "./orgWorld";
import { PAY, PayProps, payBox } from "./payProps";
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
type P2 = [number, number];

// ===========================================================================
// THE PAY (cut C's own props): mirroring the second hire, the bonus on the outer side
// ===========================================================================
/** The pay's placement: the salary envelope's foot centre, its scale (the whole group ~336 px wide at HOME.audi,
 *  SALARY / BONUS cap height ~24 px), the bonus on the outer (left) side. The group's centre mirrors the hire's. */
export const C_PAY = { x: AUDI.px - 152, y: FLOOR_Y, scale: 1.12, side: -1 as const } as const;

// ===========================================================================
// THE CAMERA — truck right, crane up with the tower, crane back down to HOME.audi and hold
// ===========================================================================
const START = HOME.redbull;
/** The crane's top: the corporate top and the rings tile in the frame's middle, k 1.2. */
const K_UP = 1.2;
const DY_UP = -490;
/** Cut C's last camera (cut D opens on it): HOME.audi. */
export const C_END_CAM: Cam = HOME.audi;
/** Cut C's last pool point (before the breath x (1 + 0.05 sin(S / 11)) that A, B and C apply). */
export const C_END_POOL = POOL_AT.audi;
const CAM = makeClockCam(
  { x: START.x, y: START.y, k: START.k },
  [
    { f0: 0, f1: 38, dx: AUDI.px - START.x, warp: 0.75 }, // truck right to Audi
    { f0: 0, f1: 16, k: 0.82, warp: 0.8 }, // pulling back a touch while it trucks
    { f0: 18, f1: 44, k: K_UP }, // then in for the crane
    { f0: 14, f1: 66, dy: DY_UP }, // crane up with the tower
    { f0: 72, f1: 114, dy: HOME.audi.y - (START.y + DY_UP), k: HOME.audi.k }, // and back down to HOME.audi
  ],
  DURATION,
);
/** From f200 the camera lands EXACTLY on HOME.audi (the follower settled ~f125; this only removes the residue). */
const camAt = (f: number): Cam => {
  const c = CAM.at(f);
  const t = smoothstep((f - 200) / 30);
  return { x: lerp(c.x, C_END_CAM.x, t), y: lerp(c.y, C_END_CAM.y, t), k: lerp(c.k, C_END_CAM.k, t) };
};
const POOL_TRACK = makePoolTrack(
  POOL_AT.redbull,
  [
    { f0: 0, f1: 38, x: AUDI.px, y: -300 },
    { f0: 14, f1: 66, x: AUDI.px, y: -560 },
    { f0: 72, f1: 118, x: C_END_POOL.x, y: C_END_POOL.y, strength: C_END_POOL.strength },
  ],
  DURATION,
);
/** The pool breathes on the story clock as in cuts A and B (x (1 + 0.05 sin(S / 11))). */
const poolAt = (f: number) => {
  const p = POOL_TRACK(f);
  const t = smoothstep((f - 200) / 30);
  const breath = 1 + 0.05 * Math.sin((f + SLOT_START) / 11);
  return { x: lerp(p.x, C_END_POOL.x, t), y: lerp(p.y, C_END_POOL.y, t), strength: lerp(p.strength, C_END_POOL.strength, t) * breath };
};
/** The ground's parallax origin: cut A's opening camera, as in cut B, so the board carries on across the joins.
 *  Exported for cut D (C_REST), which opens on this cut's last frame. */
const REST: Cam = camA(0);
export const C_REST: Cam = REST;

// ===========================================================================
// THE TIMELINE (frames)
// ===========================================================================
const T = {
  managers: [22, 31, 40], // each manager's stout entrance starts (bottom to top), over LEVEL_F
  levelF: 10,
  top: 49,
  topAmber: [57, 69],
  tile: [56, 67],
  group: [98, 134], // out from behind the lowest manager, down to AUDI.secondX
  f1: [146, 207], // in from the right, high over the group hire, down into the principal's spot
  warmF: [207, 221],
  headset: [211, 225],
  rule: [218, 234],
  warmG: [209, 223],
  salary: [240, 250],
  bonus: [260, 275],
} as const;

const audiAt = (f: number): AudiState => {
  const inF = f >= T.f1[1];
  const inG = f >= T.group[1];
  return {
    ...AUDI_EMPTY,
    managers: T.managers.map((m) => lin(f, m, m + T.levelF)),
    top: lin(f, T.top, T.top + T.levelF),
    topAmber: win(f, T.topAmber[0], T.topAmber[1]),
    tile: lin(f, T.tile[0], T.tile[1]),
    principal: inF ? { appear: 1, warm: win(f, T.warmF[0], T.warmF[1]), headset: ease(f, T.headset[0], T.headset[1]) } : AUDI_EMPTY.principal,
    second: inG ? { appear: 1, warm: win(f, T.warmG[0], T.warmG[1]) } : AUDI_EMPTY.second,
    rule: ease(f, T.rule[0], T.rule[1]),
  };
};

// ===========================================================================
// THE TWO HIRES while they travel (before they are handed to the world state)
// ===========================================================================
/** a cubic Bezier sampled into an arc-length table, so a hire moves along it at the eased pace */
const cubic = (p0: P2, p1: P2, p2: P2, p3: P2, n = 48): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  });
const along = (pts: P2[]) => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1];
  return (u: number): P2 => {
    const d = clamp01(u) * L;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const t = (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t)];
  };
};
const M0 = AUDI.managers[0];
/** the group hire: x and y on their own eases, x front-loaded, so it slides out from behind the lowest manager
 *  quickly (~5 f) and only then comes down onto the floor at AUDI.secondX */
const groupPos = (u: number): P2 => [lerp(M0.x, AUDI.secondX, restToRest(clamp01(u / 0.42))), lerp(M0.feet, FLOOR_Y, restToRest(clamp01((u - 0.16) / 0.84)))];
/** the F1 hire: in from off the right edge, high over the group hire's head, then down between the hire and the
 *  lowest manager into the principal's spot */
const F1_HIGH = -150;
const F1_X0 = 2700;
const F1_PATH = along([
  ...cubic([F1_X0, F1_HIGH], [2550, F1_HIGH], [2400, F1_HIGH], [2250, F1_HIGH], 16).slice(0, -1),
  ...cubic([2250, F1_HIGH], [2156, F1_HIGH], [2156, FLOOR_Y], [AUDI.px, FLOOR_Y]),
]);
/** lift up over the first 18 %, held, settled over the last 22 % */
const LIFT_ENV = (u: number) => (u <= 0 || u >= 1 ? 0 : smoothstep(u / 0.18) * (1 - smoothstep((u - 0.78) / 0.22)));
type Hire = { on: boolean; x: number; feet: number; lift: number; shadow: number };
const OFF: Hire = { on: false, x: 0, feet: 0, lift: 0, shadow: 0 };
const groupAt = (f: number): Hire => {
  if (f < T.group[0] || f >= T.group[1]) return OFF;
  const u = (f - T.group[0]) / (T.group[1] - T.group[0]);
  const [x, y] = groupPos(u);
  const lift = LIFT_ENV(u);
  // its shadow grows out from behind the manager's as it slides out (no doubled shadow at the start)
  return { on: true, x, feet: y - LIFT_DY * lift, lift, shadow: smoothstep(u / 0.2) };
};
const f1At = (f: number): Hire => {
  if (f < T.f1[0] || f >= T.f1[1]) return OFF;
  const u = (f - T.f1[0]) / (T.f1[1] - T.f1[0]);
  const [x, y] = F1_PATH(restToRest(u));
  const lift = LIFT_ENV(u);
  return { on: true, x, feet: y - LIFT_DY * lift, lift, shadow: 1 };
};

// ===========================================================================
// THE STATE THIS CUT ENDS ON (cut D opens on it)
// ===========================================================================
/** Cut C's last Audi state (orgWorld's AUDI_DONE: the tower, both hires cream), drawn with OrgWorld / AudiOrg at
 *  C_END_CAM, pool C_END_POOL (+ breath), PLUS this cut's own extras: AudiExtrasC (the F1 tag, the pay). */
export const AUDI_END_C: AudiState = AUDI_DONE;
export const WORLD_END_C: WorldState = { ferrari: FERRARI_DONE, redbull: REDBULL_DONE, audi: AUDI_END_C };
/**
 * AudiExtrasC — what cut C adds to orgWorld's Audi: the F1 tag on the principal's chest and the pay (salary +
 * bonus) at C_PAY. Defaults = cut C's last frame. `dim` 0..1 tones them toward the board (cut D).
 */
export const AudiExtrasC: React.FC<{ k: number; dim?: number; f1Tag?: number; salary?: number; bonus?: number }> = ({ k, dim = 0, f1Tag = 1, salary = 1, bonus = 1 }) => (
  <g>
    {f1Tag > 0.5 ? <F1Tag x={AUDI.px} feet={FLOOR_Y} k={k} dim={dim} /> : null}
    <PayProps x={C_PAY.x} y={C_PAY.y} k={k} scale={C_PAY.scale} side={C_PAY.side} salary={salary} bonus={bonus} dim={dim} />
  </g>
);

/** The names cut D imports: the extras, and the pay's settled world box (salary + bonus + coins). */
export const CAudiExtras = AudiExtrasC;
export const C_PAY_BOX = payBox(C_PAY.x, C_PAY.y, C_PAY.scale, C_PAY.side, true);

// ===========================================================================
// LOAD-TIME CHECKS: the join, the end state, the camera, the pay's size, collisions of everything that moves
// ===========================================================================
{
  const fail = (m: string) => {
    throw new Error(`AudiHiredToRun: ${m}`);
  };
  const same = (a: Cam, b: Cam) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.k - b.k) < 1e-9;
  if (!same(camAt(0), HOME.redbull)) fail("f0 camera is not HOME.redbull");
  for (let f = 232; f < DURATION; f++) if (!same(camAt(f), C_END_CAM)) fail(`camera off HOME.audi at f${f}`);
  const cc = camCheck(camAt, 0, DURATION - 1);
  if (cc.maxV > 48) fail(`camera speed ${cc.maxV.toFixed(1)} px/f at f${cc.atV}`);
  // the end state, and f0 = AUDI_EMPTY
  const eq = (a: unknown, b: unknown): boolean =>
    typeof a === "number" && typeof b === "number"
      ? Math.abs(a - b) < 1e-9
      : typeof a === "object" && a !== null && typeof b === "object" && b !== null
        ? Object.keys(b).every((key) => eq((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) && Object.keys(a).length === Object.keys(b).length
        : a === b;
  if (!eq(audiAt(DURATION - 1), AUDI_DONE)) fail(`end state differs from AUDI_DONE: ${JSON.stringify(audiAt(DURATION - 1))}`);
  if (!eq(audiAt(0), AUDI_EMPTY)) fail("f0 Audi state is not AUDI_EMPTY");
  if (T.bonus[1] > DURATION - 2 || T.salary[1] > T.bonus[0]) fail("the pay does not settle before the end");
  // the pay at HOME.audi: ~300-340 px wide, its words' cap height >= 24 px, its centre mirroring the second hire,
  // clear of the principal's shoulders, inside the picture area and the frame's left side
  const pb = payBox(C_PAY.x, C_PAY.y, C_PAY.scale, C_PAY.side, true);
  const kE = C_END_CAM.k;
  const wPx = (pb.x1 - pb.x0) * kE;
  if (wPx < 300 || wPx > 340) fail(`pay ${wPx.toFixed(0)} px wide`);
  const cap = Math.min(PAY.salary.sticker.px, PAY.bonus.text.px) * C_PAY.scale * kE * 0.718;
  if (cap < 24) fail(`pay words cap ${cap.toFixed(1)} px`);
  if (Math.abs((pb.x0 + pb.x1) / 2 - (2 * AUDI.px - AUDI.secondX)) > 25) fail("pay not mirroring the second hire");
  if (pb.x1 > AUDI.px - PRINCIPAL_SIZE / 2 - 18) fail("pay crowds the principal");
  if (540 + (pb.x0 - C_END_CAM.x) * kE < 60) fail("pay outside the picture area");
  // collisions: each travelling hire (its real outline: shoulders + head) against every peg standing then
  type Shape = { r: [number, number, number, number]; c: [number, number, number] };
  const pegShape = (x: number, feet: number, size: number): Shape => ({
    r: [x - (size / 2) * 0.95, x + (size / 2) * 0.95, feet - size * 0.47, feet],
    c: [x, feet - (size * 327) / 429, (size * 102) / 429],
  });
  const dRR = (a: number[], b: number[]) => {
    const dx = Math.max(b[0] - a[1], a[0] - b[1], 0);
    const dy = Math.max(b[2] - a[3], a[2] - b[3], 0);
    return dx === 0 && dy === 0 ? -1 : Math.hypot(dx, dy);
  };
  const dRC = (r: number[], c: number[]) => Math.hypot(c[0] - clamp(c[0], r[0], r[1]), c[1] - clamp(c[1], r[2], r[3])) - c[2];
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const dist = (a: Shape, b: Shape) => Math.min(dRR(a.r, b.r), dRC(a.r, b.c), dRC(b.r, a.c), Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) - a.c[2] - b.c[2]);
  let groupOut = false;
  for (let f = 0; f < DURATION; f++) {
    const s = audiAt(f);
    const statics: [string, Shape][] = [];
    AUDI.managers.forEach((m, i) => {
      if (s.managers[i] > 0) statics.push([`manager${i}`, pegShape(m.x, m.feet, m.size)]);
    });
    if (s.top > 0) statics.push(["top", pegShape(AUDI.top.x, AUDI.top.feet, BOSS_SIZE)]);
    if (s.principal.appear > 0) statics.push(["principal", pegShape(AUDI.px, FLOOR_Y, PRINCIPAL_SIZE)]);
    if (s.second.appear > 0) statics.push(["second", pegShape(AUDI.secondX, FLOOR_Y, PEG_SIZE)]);
    const g = groupAt(f);
    const h = f1At(f);
    const gs = pegShape(g.x, g.feet, PEG_SIZE);
    const hs = pegShape(h.x, h.feet, PRINCIPAL_SIZE);
    if (g.on && !groupOut && dist(gs, pegShape(M0.x, M0.feet, M0.size)) >= 2) groupOut = true;
    for (const [n, b] of statics) {
      // the group hire starts hidden behind the lowest manager and slides out from behind him
      if (g.on && (groupOut || n !== "manager0") && dist(gs, b) < 2) fail(`group hire touches ${n} at f${f}`);
      if (h.on && dist(hs, b) < 20) fail(`F1 hire touches ${n} at f${f} (${dist(hs, b).toFixed(1)})`);
    }
    if (g.on && h.on && dist(gs, hs) < 20) fail(`the hires touch at f${f}`);
    // the F1 hire (and its shadow) wholly off the right edge before its glide
    if (f === T.f1[0] && 540 + (h.x - PRINCIPAL_SIZE / 2 - 24 - camAt(f).x) * camAt(f).k < 1080) fail("the F1 hire shows before its glide");
  }
  // the landings are seamless: each path ends exactly on its spot
  const gl = groupPos(1);
  const fl = F1_PATH(1);
  if (Math.hypot(gl[0] - AUDI.secondX, gl[1] - FLOOR_Y) > 1e-6 || Math.hypot(fl[0] - AUDI.px, fl[1] - FLOOR_Y) > 1e-6) fail("a hire's path misses its spot");
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
  const g = groupAt(f);
  const h = f1At(f);
  const traveller = (p: Hire, size: number) => (
    <g>
      <UnionShadow sil={principalSil(p.x, p.feet, size, 0)} s={size / 96} lift={p.lift} contact={{ x: p.x, y: p.feet, w: size * 0.8 }} strength={p.shadow} />
      <PrincipalPeg x={p.x} y={p.feet} k={k} size={size} warm={0} appear={1} headset={0} shadow={false} />
    </g>
  );
  return (
    <OrgStage S={S} cam={cam} rest={REST} pool={poolAt(f)}>
      <FerrariOrg k={k} band={band} s={FERRARI_DONE} />
      <RedBullOrg k={k} band={band} s={REDBULL_DONE} />
      {/* the group hire is drawn under the tower: it starts hidden behind the lowest manager */}
      {g.on ? traveller(g, PEG_SIZE) : null}
      <AudiOrg k={k} band={band} s={a} />
      <AudiExtrasC k={k} f1Tag={f >= T.f1[1] ? 1 : 0} salary={lin(f, T.salary[0], T.salary[1])} bonus={lin(f, T.bonus[0], T.bonus[1])} />
      {h.on ? (
        <g>
          {traveller(h, PRINCIPAL_SIZE)}
          <F1Tag x={h.x} feet={h.feet} k={k} />
        </g>
      ) : null}
    </OrgStage>
  );
};

export default AudiHiredToRun;
