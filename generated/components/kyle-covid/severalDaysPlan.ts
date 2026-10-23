// ---------------------------------------------------------------------------
// severalDaysPlan — the plan of SeveralDaysBeforeIllness (kyle-covid, cut 21): the depth camera's truck, the light
// cycle (the time-lapse of several days), THE CARRIER's walk, cough and sit, the passers-by he breathes on, the
// people behind, the lampposts, the shops and the bench. Pure functions of the frame (no React); the cut draws them.
// Units: the cast's (a man ~312 = 1.75 m, U = 178 per metre); X across (+ = screen right), Y up = -, Z depth behind
// the front plane (the Carrier's walk line Z 0).
// ---------------------------------------------------------------------------
import type { DepthOpts } from "../kyle-london/londonDepth";
import type { Cam } from "../kits/maps/incaShared";
import { POSES, breathe, covidAnchors, lerpPose, walkPose, type CovidKind, type CovidPose, type P2 } from "./covidFolk";

export const FPS = 30000 / 1001;
export const DURATION = 158;
export const U = 178;

// ---- helpers ------------------------------------------------------------------------------------------------------
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** a smoother step (C2) */
export const sst5 = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
export const hash1 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** distance covered at constant speed v until frame a, then a raised-cosine deceleration to rest at b (one lobe) */
export const travel = (f: number, v: number, a: number, b: number) => {
  if (f <= a) return v * f;
  const T = b - a;
  const t = Math.min(f, b) - a;
  return v * a + v * (t / 2 + (T / (2 * Math.PI)) * Math.sin((Math.PI * t) / T));
};
const speedAt = (f: number, a: number, b: number) => (f <= a ? 1 : f >= b ? 0 : 0.5 * (1 + Math.cos((Math.PI * (f - a)) / (b - a))));

// ===================================================================================================================
// THE DEPTH CAMERA (review 1: pushed in, the eye lowered): eye 1.12 m up (the horizon at the Carrier's chest), the
// front plane 760 units (4.3 m) from the eye at k 2.9 (the walking Carrier ~50 % of the frame's height); a zoom is half
// dolly. The camera TRUCKS right with him a little slower than his pace (he drifts slowly into the frame's right half:
// the street he walked opens on the left), decelerates in one lobe (f92-f124) and settles; for the bench it pushes in a
// little (k 2.9 -> 3.0: seated ~40 %) and tilts (the floor row 1445 -> 1370).
// ===================================================================================================================
export const DEPTH: DepthOpts = { eyeY: -200, dRef: 760, kRef: 2.9, dolly: 0.5 };
export const K0 = 2.9;
export const K1 = 3.0;
/** the Carrier's walk: stride (units, the cast's default 44) and frames per cycle (two steps) */
export const STRIDE = 50;
export const CYCLE = 28;
export const V_WALK = (2 * STRIDE) / CYCLE;
/** his walk: constant pace, then slowing f100 -> stop f122 */
export const HERO_DEC = [100, 122] as const;
export const HERO_X0 = 0;
/** the camera's truck: CAM_V, decelerating f92 -> f136 */
export const CAM_DEC = [92, 124] as const;
export const CAM_X0 = 29;
export const CAM_V = 3.15;
/** the zoom and tilt (one lobe, with the truck's deceleration) */
const ZOOM = [96, 140] as const;
const FLOOR_SY0 = 1445;
const FLOOR_SY1 = 1370;
export const camAt = (f: number): Cam => {
  const z = sst5(ZOOM[0], ZOOM[1], f);
  const k = Math.exp(lerp(Math.log(K0), Math.log(K1), z));
  const sy = lerp(FLOOR_SY0, FLOOR_SY1, z);
  return { k, cx: CAM_X0 + travel(f, CAM_V, CAM_DEC[0], CAM_DEC[1]), cy: 0 - (sy - 960) / k };
};

// ===================================================================================================================
// THE LIGHT CYCLE (the "several days"; review 2: unmistakably days, not hours): a time-lapse that starts on the first
// morning (8 am) and runs two and a half clearly separate day / night cycles to the third day's noon (day, night,
// day, night, day: the clock constant from f0, slowing into the last morning f80-f112 so the illness lands in full
// daylight). Each day the SUN crosses: its time-lapse shadows sweep across the pavement (long to the right in the
// morning, short at noon, long to the left in the evening), the shafts and the sun's glow swing with it; each night
// is clearly night (the air dark, the windows, the lanterns and the street lamps lit).
// night(f) 0 day .. 1 night: a cosine of the clock, its day and night held a little longer (smooth, never a flicker)
// ===================================================================================================================
/** the clock in days: 0 = noon of day 1 (f0 = 8 am, -0.16), 1 = the next noon; the end CLOCK_END (day 3, noon) */
const CLOCK0 = -0.16;
const CLOCK_END = 2;
const CLOCK_DEC = [80, 112] as const;
const CLOCK_RATE = (CLOCK_END - CLOCK0) / (CLOCK_DEC[0] + (CLOCK_DEC[1] - CLOCK_DEC[0]) / 2);
export const clockAt = (f: number) => CLOCK0 + travel(Math.max(0, f), CLOCK_RATE, CLOCK_DEC[0], CLOCK_DEC[1]);
export const NIGHTS = 2;
export const nightAt = (f: number) => sst(0.04, 0.96, 0.5 - 0.5 * Math.cos(2 * Math.PI * clockAt(f)));
/** which day it is (0-based; a new day starts at midnight) */
export const dayAt = (f: number) => Math.floor(clockAt(f) + 0.5);
/** the street lamps and the shop windows: on through the dusk, off through the dawn (each light its own threshold) */
export const lightsOn = (f: number, th = 0.4) => sst(Math.max(0.02, th - 0.32), Math.min(0.98, th + 0.36), nightAt(f));
/** the sun now: up (0 night .. 1 high day: the shadows' strength), the ground shadow's length per unit of height and
 *  its direction on the ground (X, Z): +X (to the right) in the morning (the sun low on the left), +Z (toward the
 *  shops, short) at noon (the sun high behind the camera), -X in the evening; side -1 morning .. +1 evening */
export const sunAt = (f: number) => {
  const c = clockAt(f);
  const h = 2 * Math.PI * (c - Math.round(c));
  const ce = Math.cos(h);
  const up = sst(0.04, 0.42, ce);
  const elev = (Math.max(0.16, ce) * 62 * Math.PI) / 180;
  const hc = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, h));
  const th = Math.PI / 2 + hc * 0.94;
  return { up, len: Math.min(3.2, 1 / Math.tan(elev)), dir: [Math.cos(th), Math.sin(th)] as P2, side: Math.sin(hc) };
};

// ===================================================================================================================
// THE SET (world X): the shop row's front plane, the pavement, the kerb, the road; the lampposts in front; the bench
// ===================================================================================================================
export const Z_SHOP = 780;
export const Z_KERB = -240;
export const Z_LAMP = -214;
/** the road surface lies a kerb's height below the pavement */
export const ROAD_Y = 22;
export type ShopKind = "cafe" | "bakery" | "books" | "laundry" | "florist";
export type Shop = { kind: ShopKind; x0: number; x1: number };
/** the shop row (X), left to right, with an alley (a gap into the deep air) between the bakery and the bookshop */
export const SHOPS: Shop[] = [
  { kind: "laundry", x0: -760, x1: -330 },
  { kind: "cafe", x0: -320, x1: 140 },
  { kind: "bakery", x0: 150, x1: 520 },
  { kind: "books", x0: 660, x1: 1060 },
  { kind: "florist", x0: 1070, x1: 1500 },
];
export const ALLEY = { x0: 520, x1: 660 };
export const SHOP_H = 600;
/** the lampposts at the pavement's front edge (X); the last one stands beside the bench */
export const LAMPS = [-75, 600];
/** the street lamps along the back of the pavement (by the shop fronts, behind everyone): their heads in view, so each
 *  night shows lamps lit along the street */
export const BACK_LAMPS = [145, 590, 1035];
export const Z_BACK_LAMP = 690;
/** bollards along the kerb (low: they slide past under the people, the foreground's parallax) */
export const BOLLARDS = [-300, -150, 0, 150, 300, 450, 600, 750];
/** the bench (backless: a timber seat on two iron frames) on the pavement, facing the street */
export const BENCH = { x0: 300, x1: 560, z0: 34, z1: 92, h: 82 };

// ===================================================================================================================
// THE CARRIER (covidFolk Carrier v0, the same man as cut 3): walks right at the frame's middle, glowing, well, smiling;
// greets each passer-by (a glance, a small nod, a "hi": the puff); from f100 he slows, the illness shows (pale, the
// flush, droopy lids) and he coughs (fist, f106-f130); he stops (f122), turns to the street and sinks onto the bench
// (f120-f140); then a living slump (head bowed, slow breath) to the end.
// ===================================================================================================================
export const heroX = (f: number) => HERO_X0 + travel(f, V_WALK, HERO_DEC[0], HERO_DEC[1]);
/** the walk's stride amount: full, shortening into the stop */
const strideAmt = (f: number) => lerp(1, 0.55, sst(HERO_DEC[0], HERO_DEC[1] - 2, f));
/** the walk phase from the distance walked (planted feet: the phase advances by distance / (2 stride amount)) */
const PHASE_DT = 0.25;
const PHASE_T: number[] = (() => {
  const out = [0];
  let ph = 0;
  for (let f = 0; f < DURATION + 2; f += PHASE_DT) {
    const fm = f + PHASE_DT / 2;
    const v = V_WALK * speedAt(fm, HERO_DEC[0], HERO_DEC[1]);
    ph += (v * PHASE_DT) / (2 * STRIDE * strideAmt(fm));
    out.push(ph);
  }
  return out;
})();
const rawPhase = (f: number) => {
  const i = Math.max(0, Math.min(PHASE_T.length - 2, Math.floor(f / PHASE_DT)));
  const t = c01(f / PHASE_DT - i);
  return lerp(PHASE_T[i], PHASE_T[i + 1], t);
};
/** the phase at f0, chosen so that he comes to rest at mid-stance of his near (L) foot with the far foot mid-swing
 *  (frac 0.25): the swinging foot then simply comes down beside it */
const PHASE0 = (() => {
  const end = rawPhase(HERO_DEC[1]);
  return 0.25 - (end - Math.floor(end)) + 1;
})();
export const heroPhase = (f: number) => PHASE0 + rawPhase(f);
const F_STOP = HERO_DEC[1];
/** the encounters' greeting: a head turn and look toward the passer-by, a small nod, a "hi" */
export type Greet = { turn: number; open: number; nod: number };
/** the pose at frame f (before the greeting, the cough and the illness), plus his feet's anchor rule */
/** his walk turned a little toward us (yaw 0.74, the cast's walk is 0.9): both lungs' glow reads through the puffer */
const WALK_BASE: CovidPose = { ...POSES.walk(1, 0, 0), yaw: 0.74, headYaw: 0.78 };
const walkAt = (f: number): CovidPose => walkPose(WALK_BASE, heroPhase(f), strideAmt(f), STRIDE);
/** standing at rest after the stop: the stance foot stays, the swinging foot comes down beside it */
const STOP_POSE: CovidPose = (() => {
  const w = walkAt(F_STOP);
  return { ...w, footL: [w.footL[0], 0], footR: [w.footL[0] - 9, -1], liftL: 0, liftR: 0, crouch: 1, lean: 1.5 };
})();
/** seated on the bench: turned to the street (yaw -0.14, a little toward screen left), head bowed, sick */
export const SIT_YAW = -0.32;
const sitPose = (f: number): CovidPose => {
  const s = POSES.slump(1, f);
  return { ...s, yaw: SIT_YAW, headYaw: SIT_YAW - 0.12, lean: -2, roll: -2, pitch: s.pitch - 4, armL: { w: [-10, -112], elbow: [-0.3, 1], fist: 0.1, hand: 10 }, armR: { w: [16, -110], elbow: [0.3, 1], fist: 0.1, hand: -10 } };
};
/** turning to the street, standing (the turn leads the sit) */
const turnPose = (yaw: number): CovidPose => ({ ...STOP_POSE, yaw, headYaw: yaw });
export const SIT = [124, 142] as const;
/** the cough fit (two coughs, the near fist to the mouth): done before he turns through front (the cast's near arm
 *  is chosen by facing: a cough across the turn would switch hands) */
export const COUGH = [99, 127] as const;
export const SICK = [102, 132] as const;
export const heroSick = (f: number) => sst(SICK[0], SICK[1], f);
export const heroPoseRaw = (f: number): CovidPose => {
  let q: CovidPose;
  if (f < F_STOP - 4) q = walkAt(f);
  else {
    // the last steps settle into the stop (the swinging foot comes down), the body turns to the street, then sits
    const settle = sst(F_STOP - 4, F_STOP + 2, f);
    let s = lerpPose(walkAt(Math.min(f, F_STOP)), STOP_POSE, settle);
    const turn = sst(F_STOP - 1, SIT[0] + 8, f);
    if (turn > 0) s = lerpPose(s, turnPose(SIT_YAW + 0.1), turn);
    const sit = sst(SIT[0], SIT[1], f);
    q = sit > 0 ? lerpPose(s, sitPose(f), sit) : s;
  }
  return q;
};
/** the feet's world anchor: during the walk the hips travel (heroX), after the stop the feet stay where they landed
 *  (the stance foot through the settle, the feet's midpoint through the sit) and the hips move over them */
const footRef = (q: CovidPose, w: number) => {
  const a = covidAnchors("carrier", q, [0, 0], 1);
  const stance = (a.heelL[0] + a.toeL[0]) / 2;
  const mid = (a.heelL[0] + a.toeL[0] + a.heelR[0] + a.toeR[0]) / 4;
  return lerp(stance, mid, w);
};
const FEET_X = heroX(F_STOP) + footRef(heroPoseRaw(F_STOP), 0);
export const heroAtX = (f: number) => {
  if (f <= F_STOP) return heroX(f);
  const q = heroPoseRaw(f);
  return FEET_X - footRef(q, sst(F_STOP + 2, SIT[0] + 6, f));
};
export { F_STOP };

// ===================================================================================================================
// THE PASSERS-BY he breathes on: covidFolk figures walking left in the mid-ground, one at a time, evenly spaced. As
// each comes up to him he glances at them, smiles and says hi (the puff: a soft breath of specks that drifts onto
// their face); the specks reach their mouth (contact) and their chest kindles over the next ~16 frames; they walk on
// behind him (left), glowing, unaware.
// ===================================================================================================================
export type Walker = {
  id: string;
  kind: CovidKind;
  variant: number;
  Z: number;
  /** walking: dir (+1 right), stride, cycle */
  dir: 1 | -1;
  stride: number;
  cycle: number;
  /** X at frame 0 */
  x0: number;
  /** infected 0..1 as a function of the frame (a passer-by kindles at its encounter) */
  inf: (f: number) => number;
  /** encounter: ks = the frame their chest starts to kindle (the first specks reach their mouth), the puff's birth
   *  window before it, the kindle, and fe = the frame they cross behind him on screen (CROSS_LEAD later) */
  enc?: { ks: number; fe: number; puff: [number, number]; kindle: [number, number] };
  hold?: { L?: "phone" | "cup" | "handbag" | "none"; R?: "phone" | "cup" | "handbag" | "none" };
  seed: number;
  /** stops (stands) from frame `stopAt`, turns to restYaw (default 3/4 toward us) and then acts: "chat" (talking
   *  with a neighbour: head and mouth, a little gesture) or "wait" (looking about) */
  stopAt?: number;
  restYaw?: number;
  act?: "chat" | "wait";
};
export const walkerV = (w: Walker) => (2 * w.stride) / w.cycle;
const rOf = (Z: number, f: number) => {
  const k = camAt(f).k;
  const Dc = DEPTH.dRef * Math.pow(DEPTH.kRef / k, DEPTH.dolly);
  return Dc / (Dc + Z);
};
/** frames a walker takes to come to rest (its speed falls linearly to 0: half a stride more) */
export const STOP_T = 12;
/** the walker's X (its hips) along the walk at frame f, before the feet-anchor correction of a stop */
const walkerHipX = (w: Walker, f: number) => {
  const v = walkerV(w);
  const fs = w.stopAt ?? Infinity;
  if (f <= fs) return w.x0 + w.dir * v * f;
  const t = Math.min(f - fs, STOP_T);
  return w.x0 + w.dir * v * (fs + t - (t * t) / (2 * STOP_T));
};
/** the walk phase from the distance walked (planted feet); a walker that stops is phased (like him) so it comes to
 *  rest at mid-stance, the swinging foot mid-air under the body: it simply comes down beside the other */
const rawWalkerPhase = (w: Walker, f: number) => Math.abs(walkerHipX(w, f) - w.x0) / (2 * w.stride);
const phaseOff = (w: Walker) => {
  if (w.stopAt === undefined) return hash1(w.seed * 3.3);
  const end = rawWalkerPhase(w, w.stopAt + STOP_T);
  return 0.25 - (end - Math.floor(end)) + 1;
};
export const walkerPhase = (w: Walker, f: number) => rawWalkerPhase(w, f) + phaseOff(w);
/** the walkers' yaw (the cast's walk is 0.9; a little toward us so a kindled chest reads as two lungs) */
const WALKER_YAW = 0.78;
const walkerBase = (w: Walker): CovidPose => ({ ...POSES.walk(w.dir, 0, 0), yaw: w.dir * WALKER_YAW, headYaw: w.dir * 0.8 });
/** a stopping walker's rest: the stance foot stays, the other comes down beside it; then a turn toward us (3/4) */
const restOf = (w: Walker) => {
  const fEnd = (w.stopAt ?? 0) + STOP_T;
  const ph = walkerPhase(w, fEnd);
  const q = walkPose(walkerBase(w), ph, 1, w.stride);
  const stanceL = ph - Math.floor(ph) < 0.5;
  const sx = stanceL ? q.footL[0] : q.footR[0];
  const rest: CovidPose = { ...q, footL: stanceL ? [sx, 0] : [sx - w.dir * 4, -1], footR: stanceL ? [sx - w.dir * 4, -1] : [sx, 0], liftL: 0, liftR: 0, crouch: 0.5, lean: 0.5 * w.dir };
  return { fEnd, rest, stanceL };
};
export const walkerPose = (w: Walker, f: number): CovidPose => {
  const base = walkerBase(w);
  if (w.stopAt === undefined || f <= w.stopAt + STOP_T - 4) return walkPose(base, walkerPhase(w, f), 1, w.stride);
  const { fEnd, rest } = restOf(w);
  const settle = sst(fEnd - 4, fEnd + 3, f);
  let q = lerpPose(walkPose(base, walkerPhase(w, Math.min(f, fEnd)), 1, w.stride), rest, settle);
  const yaw = w.restYaw ?? w.dir * 0.42;
  const turn = sst(fEnd + 1, fEnd + 20, f);
  if (turn > 0) q = lerpPose(q, { ...rest, yaw, headYaw: yaw * 0.8 }, turn);
  // the rest is alive: breathing, and talking with a neighbour or looking about
  const live = sst(fEnd + 6, fEnd + 26, f);
  if (live > 0) {
    const toward: 1 | -1 = yaw >= 0 ? 1 : -1;
    const a = w.act === "chat" ? POSES.chat(q, f, toward, 0.7, w.seed) : { ...q, headYaw: q.headYaw + 0.25 * Math.sin(f / 23 + w.seed), look: [0.5 * Math.sin(f / 23 + w.seed), 0] as P2 };
    q = lerpPose(q, a, live);
  }
  return breathe(q, f, 1, w.seed);
};
/** a foot's (or the feet's) x in a pose, rig units from the hips */
const footX = (kind: CovidKind, variant: number, q: CovidPose, which: "L" | "R" | "mid") => {
  const a = covidAnchors(kind, q, [0, 0], 1, { variant });
  const L = (a.heelL[0] + a.toeL[0]) / 2;
  const R = (a.heelR[0] + a.toeR[0]) / 2;
  return which === "L" ? L : which === "R" ? R : (L + R) / 2;
};
const REST_CACHE = new Map<string, { fEnd: number; ref: number; which: "L" | "R" }>();
/** the walker's X at frame f: along its walk; after a stop the stance foot stays where it landed and the hips move
 *  over it as it turns (so no foot slides) */
export const walkerX = (w: Walker, f: number) => {
  if (w.stopAt === undefined || f <= w.stopAt + STOP_T) return walkerHipX(w, f);
  let c = REST_CACHE.get(w.id);
  if (!c) {
    const { fEnd, stanceL } = restOf(w);
    const which = stanceL ? "L" : "R";
    c = { fEnd, which, ref: walkerHipX(w, fEnd) + footX(w.kind, w.variant, walkerPose(w, fEnd), which) };
    REST_CACHE.set(w.id, c);
  }
  return c.ref - footX(w.kind, w.variant, walkerPose(w, f), c.which);
};
/** frames from the kindle's start to the crossing. At this framing a passer-by's body starts to pass behind his ~17
 *  frames before the centres cross, so the CONTACT (the specks reaching the face) is staged just before their face
 *  passes his, and the kindle grows over 32 frames: it starts as they pass behind him and is seen growing as they
 *  come out on his left. The next puff starts only after the previous face has passed his mouth. */
export const CROSS_LEAD = 10;
export const KINDLE_T = 32;
/** the passers-by's speed across the screen (px per frame at K0): one speed for all, so they stay evenly spaced */
const PASS_SPX = 13;
/** a passer-by (walking left at depth Z) whose chest starts to kindle at ks and who crosses behind him CROSS_LEAD
 *  later; its pace is set by its depth so every passer-by crosses the screen at PASS_SPX; cycle from the stride */
const passer = (id: string, kind: CovidKind, variant: number, Z: number, ks: number, stride: number, seed: number, hold?: Walker["hold"]): Walker => {
  const fe = ks + CROSS_LEAD;
  const v = PASS_SPX / (rOf(Z, 0) * K0) - CAM_V;
  const cycle = (2 * stride) / v;
  const C = camAt(fe);
  const xe = C.cx + (heroX(fe) - C.cx) / rOf(Z, fe);
  // he says hi ~8 frames before: the first specks take ~5 frames to cross the short gap and reach their face (contact
  // ks - 3), and the kindle starts at ks
  const puff: [number, number] = [ks - 8, ks - 2];
  const kindle: [number, number] = [ks, ks + KINDLE_T];
  return { id, kind, variant, Z, dir: -1, stride, cycle, x0: xe + v * fe, inf: (f) => sst(kindle[0], kindle[1], f), enc: { ks, fe, puff, kindle }, hold, seed };
};
/** the kindles' starts (evenly spaced, one at a time) */
export const ENCOUNTERS = [18, 40, 62, 84];
export const PASSERS: Walker[] = [
  passer("p1", "commuter", 3, 360, ENCOUNTERS[0], 52, 1, { R: "cup" }),
  { ...passer("p2", "elder", 0, 560, ENCOUNTERS[1], 52, 2), stopAt: 54, restYaw: 0.5, act: "chat" },
  // the last three linger: they stop a few steps on, glowing, still in the frame at the end, at three depths: the flat
  // cap and the girl a step back (they turn to each other and chat), the white-haired woman nearer us, waiting
  { ...passer("p3", "youth", 2, 600, ENCOUNTERS[2], 54, 3, { R: "phone" }), stopAt: 76, restYaw: -0.5, act: "chat" },
  { ...passer("p4", "elder", 1, 300, ENCOUNTERS[3], 48, 4, { R: "handbag" }), stopAt: 96, act: "wait" },
];

// ===================================================================================================================
// THE STREET'S OTHER PEOPLE. During the walk nobody walks behind him on his right (where his breath goes: a figure
// there would read as its target); the street's far life is the people inside the shops. In the last morning, as the
// truck settles, the first passer-by he breathed on (the teal puffer with her coffee) comes back along the street he
// walked (in from the left, between the couple and the white-haired woman in depth), glowing, days later; a well man
// walks in on the right. Each keeps one state for its whole time in the frame.
// ===================================================================================================================
const bg = (id: string, kind: CovidKind, variant: number, Z: number, dir: 1 | -1, xAt: number, fAt: number, stride: number, cycle: number, inf: number, seed: number, extra: Partial<Walker> = {}): Walker => {
  const v = (2 * stride) / cycle;
  return { id, kind, variant, Z, dir, stride, cycle, x0: xAt - dir * v * fAt, inf: () => inf, seed, ...extra };
};
export const BACKS: Walker[] = [
  bg("b2", "commuter", 0, 620, -1, 1110, 0, 46, 29, 0, 12),
  // the last morning, from the left, glowing: the teal puffer with her coffee, from days before
  bg("r1", "commuter", 3, 400, 1, 188, 157, 52, 24, 1, 21, { hold: { R: "cup" } }),
];

// ===================================================================================================================
// HIS BREATH: a faint, constant trail of specks (born at his mouth, left hanging in the air as he walks on) and, at each
// encounter, a puff steered onto the passer-by's face. World-anchored specks (each born where his mouth was).
// ===================================================================================================================
export { type P2 };
