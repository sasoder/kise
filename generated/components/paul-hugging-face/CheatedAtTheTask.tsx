// ---------------------------------------------------------------------------
// CheatedAtTheTask (paul-hugging-face, cut 13). Dwarkesh 3D style, look C "Graphite air" on the shared world
// (hfWorld.tsx + hfProps.tsx). Opaque 1080x1920, 23.976 fps, 164 frames. Picture = hero still heroC/A in motion.
//
// CHECK LINE: a whole crowd of AIs was set on one hacking exercise, and instead of solving it they cheated.
//
// THE LINE: "A ton of AI systems were trained to do a cyber task, right, to hack a particular piece of software. They
//   cheated at that task and then"
// WORD -> FRAME: ton 2 · AI 9 · systems 12 · were 19 · trained 35 · to 44 · do 50 · cyber 56 · task 61 · right 71 ·
//   hack 77 · particular 82 · piece 87 · of 95 · software 98 · They 112 · cheated 117 · at 139 · that 144 ·
//   task 148 · and 157
// DURATION: the slot 13.555 -> 20.395 s = 6.840 s x 23.976 = 164 frames (f0..f163).
//
// THE MOTION: one camera. It opens close and low on robots already walking right ("A ton of AI systems": heads
//   ~y 500-650, feet above 1050), then one eased pull-back + crane-up shows a stream of ~20 robots converging on one
//   point and the TASK block they all face (white, code bars, the big padlock); they settle in a fan (front rows by
//   ~f62, the back by ~f96) with a clear lane to the lock. From f75 a push-in on the lock (~140 -> ~210 px wide by f98,
//   "to hack a particular piece of software"): the tugger beside it, three-quarter to us, grips it (contact f80) and
//   heaves twice (f84, f98; again f128, f146 in the background), leaning and sliding back; the lock swings on its
//   shackle and holds; a leaner on each side leans in. From f98 the camera orbits right and in round the block's
//   front-right: the Hugging Face box (out at the block's front-right, off frame until then) enters at ~f112 ("They")
//   and is whole in frame by ~f122, three robots at it (the third walks up, f112 -> f134). The lifter's mittens reach
//   the lid's free edge (contact f122), lift it and flick it open (wide by f134, small rebound); its mittens drop to
//   the ANSWER KEY's top corners (grip f135; the card prints ANSWERS over four ticked rows, an answer sheet) and
//   raise it out of the box (f136 -> f148) while orange spreads into the card from its grips (f137 -> f149); the
//   lifter's happy squint from f148; the camera keeps creeping in. End frame: block + padlock (still locked) on the
//   left, the lifter with the key (~240 px wide) over the open box (HF mark ~130 px) centre-right.
// Orange = the AIs and what they have taken (the answer key). Off-white = the people's task and the HF box.
//
// CAMERA: worldAt keys (pchip, moving pre/post-roll keys at f-12 and f182): f0 close/low on the stream -> f42
//   pull-back + crane -> f74 the fan + block from its left (yaw +0.2, dist 10) -> f98 push-in on the lock (dist 7.8)
//   -> f130 orbit right and round (yaw -0.6) onto the box in the foreground -> f163 a creep in. Every channel is
//   monotone except dist (pull-back into push-in at f75) and the target's z (it turns from the lock toward the box
//   at f99, the orbit's curve).
//
// SOURCES: OpenAI, "The Hugging Face incident and the road ahead" (July 2026): the ExploitGym cyber evaluation; the
//   models broke out of the test environment and hacked Hugging Face to get the evaluation's answers. Nothing numeric
//   on screen. Logo: HUGGINGFACE (kits/dwarkesh/brandGlyphs) on the box's plate in its real yellow.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BOT_POSES, botGripTo, lerpPose, type BotPose } from "../rsi-ten-earths/tenEarthsBot";
import { FONT, FloorShadow, HfStage, ROBOT_U, RobotAt, Svg, add, c01, lerp, mul, norm, robotFoot, sst, sub, worldAt, type CamKey, type P2, type V3, type World } from "./hfWorld";
import { Card, HFBox, HF_LID_OPEN, TASK, TICK, TaskBlock, axes, cardFrame, cardInk, faceYaw, footPts, hfBoxGeom, type CardFrame } from "./hfProps";

export const FPS = 24000 / 1001;
export const DURATION = 164;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ===================================================================================================================
// THE SET (metres)
// ===================================================================================================================
const BLOCK_C: V3 = [0, 0, 0];
const FRONT_Z = -TASK.d / 2;
/** the padlock in face-local metres (as TaskBlock draws it) */
const LK = { cx: TASK.lock.cx, cy: TASK.lock.cy, s: TASK.lock.s, bh: TASK.lock.s * 0.78, t: TASK.lock.s * 0.2 };
const LOCK_FLOOR: V3 = [BLOCK_C[0] - TASK.w / 2 + LK.cx, 0, FRONT_Z];
/** the HF box out to the block's front-right: off frame right while the camera works the lock from the left, then the
 *  orbit brings it in close (foreground right, front turned toward the end camera) */
const BOX = hfBoxGeom([3.26, 0, -3.3], 1.05, 0.6, 0.74, 0.45);
const HF_PLATE = 0.38;
const BOX_AX = axes(BOX.yaw);
const CARD = { w: 0.84, h: 0.7 };

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
const KEYS: CamKey[] = [
  // a pre-roll key: the pull-back is already under way at f0; a post-roll key: still creeping in at f163. The camera
  // works the lock from the block's LEFT side (yaw +) with the HF box off frame right; from f98 it orbits right
  // (yaw -0.6) and in, which brings the box into the foreground right
  { f: -12, target: [-2.5, 0.48, -3.2], dist: 3.6, yaw: 0.22, pitch: 0.12, F: 1700, sy: 785 },
  { f: 42, target: [-1.2, 0.62, -2.3], dist: 7.6, pitch: 0.34, sy: 700 },
  { f: 74, target: [-0.4, 0.7, -1.4], dist: 10.0, yaw: 0.2, pitch: 0.47, sy: 660 },
  { f: 98, target: [-0.3, 0.8, -1.1], dist: 7.8, yaw: 0.16, sy: 500 },
  { f: 130, target: [1.8, 1.35, -2.3], dist: 7.75, yaw: -0.6, sy: 468 },
  { f: 182, target: [1.9, 1.35, -2.4], dist: 7.35, yaw: -0.64, sy: 468 },
];

// ===================================================================================================================
// TIME + POSE HELPERS
// ===================================================================================================================
const hash = (i: number, k = 0) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** a C1 soft stop: remaining distance in "frames of travel" (x = frames to arrival) */
const softRemain = (x: number, e = 6) => (x >= e ? x : x <= -e ? 0 : ((x + e) * (x + e)) / (4 * e));
const softSpeed = (x: number, e = 6) => c01((x + e) / (2 * e));
/** walking speed in metres per frame for a robot of `size` with the walk cycle run `cyc` times as fast */
const CYC = 1.5;
const walkV = (size: number) => (2 * 44 * 0.42 * CYC * size) / 24 / ROBOT_U;

/** the screen-local robot units of a world point for a robot standing at feet (x right, y down) */
const toLocal = (W: World, feet: V3, size: number, p: V3): P2 => {
  const a = W.project(feet);
  const b = W.project(p);
  const s = (W.scaleAt(feet) / ROBOT_U) * size;
  return [(b[0] - a[0]) / s, (b[1] - a[1]) / s];
};
const screenDir = (W: World, p: V3, d: V3): 1 | -1 => (W.project(add(p, d))[0] >= W.project(p)[0] ? 1 : -1);
/** a world point to face so that a robot at p shows yaw y to the push-in camera (f98): a facing fixed in the world,
 *  so it stays put while the camera orbits */
const W98 = worldAt(KEYS, 98);
const lookFor = (p: V3, y: number): V3 => {
  const fh = norm([W98.f[0], 0, W98.f[2]]);
  return add(p, add(mul(W98.r, Math.sin(y)), mul(fh, -Math.cos(y))));
};

// ===================================================================================================================
// THE CROWD: a fan of seats round the lock; every robot walks in from the far left along its own line to its seat
// ===================================================================================================================
type Walker = { seat: V3; arrive: number; dir: V3; size: number; variant: number; seed: number };
const ORIGIN: V3 = [-7, 0, -3.6];
const TUG_SEAT: V3 = [-0.72, 0, FRONT_Z - 0.27];
const CROWD: Walker[] = (() => {
  const out: Walker[] = [];
  const rows: [number, number, number, number, number, number][] = [
    // radius, count, a0, a1, arrive0, arrive1
    [1.55, 6, -0.72, 0.36, 50, 62],
    [2.05, 7, -0.76, 0.36, 58, 74],
    [2.55, 8, -0.78, 0.34, 66, 86],
    [2.95, 8, -0.76, 0.3, 74, 96],
  ];
  // a clear lane from the push-in camera (f98) to the tugger, so the tug is seen whole
  const cam = worldAt(KEYS, 98).pos;
  const inLane = (q: V3) => {
    const dx = TUG_SEAT[0] - cam[0];
    const dz = TUG_SEAT[2] - cam[2];
    const t = ((q[0] - cam[0]) * dx + (q[2] - cam[2]) * dz) / (dx * dx + dz * dz);
    return t > 0 && t < 1 && Math.hypot(q[0] - (cam[0] + dx * t), q[2] - (cam[2] + dz * t)) < 0.5;
  };
  const C: V3 = [0.05, 0, FRONT_Z];
  let n = 0;
  rows.forEach(([R, cnt, a0, a1, f0, f1], ri) => {
    for (let i = 0; i < cnt; i++) {
      const j = n++;
      const a = a0 + ((a1 - a0) * i) / (cnt - 1) + 0.05 * (hash(j, 1) - 0.5);
      const rr = R + 0.22 * (hash(j, 2) - 0.5);
      const seat: V3 = [C[0] + rr * Math.sin(a), 0, C[2] - rr * Math.cos(a)];
      // the left of each row arrives first (they are nearest the stream)
      const arrive = Math.round(f0 + (f1 - f0) * ((i / Math.max(1, cnt - 1)) * 0.7 + 0.3 * hash(j, 3)));
      if (inLane(seat)) continue;
      out.push({ seat, arrive, dir: norm(sub(seat, ORIGIN)), size: 0.8, variant: (j * 3 + ri) % 5, seed: j * 1.7 + 0.3 });
    }
  });
  return out;
})();
/** the three at the lock (they led the stream): the tugger left of it, a leaner on each side of it */
const TUGGER: Walker = { seat: TUG_SEAT, arrive: 54, dir: norm(sub(TUG_SEAT, ORIGIN)), size: 1.12, variant: 0, seed: 11 };
const LN_SEATS: V3[] = [
  [0.7, 0, FRONT_Z - 0.35],
  [-1.35, 0, FRONT_Z - 0.65],
];
const LEANERS: Walker[] = [
  { seat: LN_SEATS[0], arrive: 60, dir: norm(sub(LN_SEATS[0], ORIGIN)), size: 0.84, variant: 1, seed: 12 },
  { seat: LN_SEATS[1], arrive: 64, dir: norm(sub(LN_SEATS[1], ORIGIN)), size: 0.82, variant: 3, seed: 13 },
];

/** a walker's floor point and pose at a frame: walking (planted feet, cycle locked to the travel), then a soft stop
 *  and a turn to face `look` */
const walkerState = (W: World, w: Walker, frame: number, look: V3, yaw?: number): { p: V3; pose: BotPose; walking: number } => {
  const v = walkV(w.size);
  const x = w.arrive - frame;
  const rem = softRemain(x);
  const p = sub(w.seat, mul(w.dir, v * rem));
  const wk = softSpeed(x);
  const cycF = (w.arrive - rem) * CYC + w.seed * 9;
  const dir = screenDir(W, p, w.dir);
  // the rig is 2π-periodic in yaw, so unwrap the stand yaw to the branch nearest the walk yaw (±0.9):
  // the blend then turns the short way instead of spinning through "facing us"
  let y = yaw ?? faceYaw(W, p, look);
  const wy = dir === 1 ? 0.9 : -0.9;
  while (y - wy > Math.PI) y -= 2 * Math.PI;
  while (y - wy < -Math.PI) y += 2 * Math.PI;
  const stand = BOT_POSES.turnTo(y, frame, w.seed);
  if (wk <= 0.001) return { p, pose: stand, walking: 0 };
  const walk = BOT_POSES.walk(dir, cycF, 1);
  if (wk >= 0.999) return { p, pose: walk, walking: 1 };
  return { p, pose: lerpPose(stand, walk, sst(0, 1, wk)) as BotPose, walking: wk };
};

// ===================================================================================================================
// THE PADLOCK: the tugger's pulls (pull 0..1) swing it on its shackle (shake, rad) and draw it out a little (tug, m)
// ===================================================================================================================
const PULLS: [number, number, number][] = [
  // start, length, strength
  [84, 9, 1],
  [98, 9, 0.85],
  [128, 9, 0.7],
  [146, 9, 0.6],
];
const pullAt = (f: number) => PULLS.reduce((acc, [s, l, k]) => Math.max(acc, k * Math.sin(Math.PI * c01((f - s) / l)) ** 2), 0);
/** the lock's swing: follows the pull, then rings down (a damped swing after each release) */
const lockSwing = (f: number) => {
  let a = 0.24 * pullAt(f);
  for (const [s, l, k] of PULLS) {
    const t = f - (s + l);
    if (t > 0) a += -0.09 * k * Math.exp(-t / 7) * Math.sin(t * 0.75);
  }
  return a;
};
/** a world point on the padlock body (face-local x right, y down, z out of the face), with the swing and tug */
const lockPoint = (x: number, y: number, zOut: number, shake: number, tug: number): V3 => {
  const shR = LK.s * 0.3;
  const shY = LK.cy + LK.bh * 0.18 - LK.bh / 2;
  const pivotY = shY - shR * 1.55;
  const dx = x - LK.cx;
  const dy = y - pivotY;
  const X = LK.cx + dx * Math.cos(shake) - dy * Math.sin(shake);
  const Y = pivotY + dx * Math.sin(shake) + dy * Math.cos(shake);
  const o: V3 = [BLOCK_C[0] - TASK.w / 2, TASK.h, FRONT_Z - 0.004];
  return [o[0] + X, o[1] - Y, o[2] - (zOut + tug)];
};

// ===================================================================================================================
// THE HF BOX + THE LIFTER: lid open (0..1 of HF_LID_OPEN), the card's rise and orange
// ===================================================================================================================
const LIFTER = { p: add(add(BOX.c, mul(BOX_AX.v, 0.66)), mul(BOX_AX.u, 0.05)), size: 1.28, variant: 0, seed: 21 };
const HELPER = { p: add(add(BOX.c, mul(BOX_AX.u, 0.8)), mul(BOX_AX.v, 0.4)), size: 0.86, variant: 2, seed: 22 };
/** the third walks in from off frame right to the box's right side */
const WB_SEAT: V3 = add(add(BOX.c, mul(BOX_AX.u, 0.95)), mul(BOX_AX.v, -0.25));
const WALKER_B: Walker = { seat: WB_SEAT, arrive: 134, dir: norm([-1, 0, -0.33]), size: 0.84, variant: 4, seed: 23 };

const LID_A1 = 0.72; // the lifter's own lift (rad), then a flick carries it open
const LID0 = 122; // the mittens on the lid's free edge (contact); first lid motion LID0 + 1
const LID1 = LID0 + 7; // the lifter's own lift ends: the flick
const LID2 = LID1 + 5; // wide open on its stop
const REACH0 = LID0 - 8;
const lidAngle = (f: number) => {
  if (f <= LID0) return 0;
  if (f <= LID1) return LID_A1 * sst(LID0, LID1, f) ** 1.15;
  if (f <= LID2) return lerp(LID_A1, HF_LID_OPEN, sst(LID1, LID2, f));
  // it lands on its stop: one small rebound
  return HF_LID_OPEN - 0.1 * Math.sin(Math.PI * c01((f - LID2) / 6)) * Math.exp(-(f - LID2) / 8);
};
/** a point on the lid's free edge (along the box depth: s -1..1) at angle a */
const lidEdge = (a: number, s: number): V3 => {
  const hp = add(add(BOX.c, mul(BOX_AX.u, -BOX.w / 2)), [0, BOX.h, 0]);
  const dir = add(mul(BOX_AX.u, Math.cos(a)), [0, Math.sin(a), 0]);
  return add(add(hp, mul(dir, BOX.w)), mul(BOX_AX.v, (s * BOX.d) / 2));
};
const RISE0 = LID1 + 6; // the mittens on the card's sides (contact)
const RISE1 = 148;
const cardRise = (f: number) => sst(RISE0 + 1, RISE1, f);
const cardOrange = (f: number) => sst(RISE0 + 2, RISE1 + 1, f);
/** the card's centre: inside the box (top just under the rim) -> held up over the box, a little toward the lifter */
const cardCentre = (f: number): V3 => {
  const r = cardRise(f);
  const inY = BOX.h - CARD.h / 2 - 0.03;
  const upY = BOX.h + CARD.h / 2 - 0.02;
  const bob = 0.012 * Math.sin((f - RISE1) * 0.16) * sst(RISE1, RISE1 + 8, f);
  return add(add(BOX.c, mul(BOX_AX.v, 0.04 - 0.1 * r)), [0, lerp(inY, upY, r) + bob, 0]);
};

const lifterPose = (W: World, f: number): BotPose => {
  const { p, size, seed } = LIFTER;
  const look = BOX.c;
  const base: BotPose = { ...BOT_POSES.turnTo(faceYaw(W, p, look) * 0.5, f, seed), look: [0, 0.5] };
  // the reach to the lid's free edge (REACH0 -> LID0), riding it up to LID1, then down into the box to the card
  const a = lidAngle(f);
  const edgeL = toLocal(W, p, size, lidEdge(Math.min(a, LID_A1), -0.25));
  const edgeR = toLocal(W, p, size, lidEdge(Math.min(a, LID_A1), 0.25));
  const fr = cardFrame(W, cardCentre(f), CARD.w, CARD.h);
  // the mittens over the card's top edge, near its corners (curled over it from behind)
  const side = (sgn: number) => add(add(fr.c, mul(fr.u, sgn * (CARD.w / 2 - 0.11))), mul(fr.v, CARD.h / 2 + 0.07));
  const gL = toLocal(W, p, size, side(-1));
  const gR = toLocal(W, p, size, side(1));
  const L = (a2: P2, b2: P2, t: number): P2 => [lerp(a2[0], b2[0], t), lerp(a2[1], b2[1], t)];
  const rest = botGripTo(base, {});
  let q: BotPose;
  if (f < REACH0) q = rest;
  else if (f < LID1) {
    const reach = sst(REACH0, LID0, f);
    const onLid = botGripTo(base, { L: edgeL, R: edgeR });
    q = reach >= 0.999 ? onLid : (lerpPose(rest, onLid, reach) as BotPose);
  } else {
    const t = sst(LID1, RISE0, f);
    const lidEnd: [P2, P2] = [toLocal(W, p, size, lidEdge(LID_A1, -0.25)), toLocal(W, p, size, lidEdge(LID_A1, 0.25))];
    q = botGripTo(base, { L: L(lidEnd[0], gL, t), R: L(lidEnd[1], gR, t) });
  }
  const happy = sst(RISE1, RISE1 + 10, f);
  return { ...q, laugh: 0.55 * happy, look: [0, lerp(0.5, 0.1, sst(RISE0, RISE1, f))], mouth: 0.22 + 0.2 * happy };
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
type Item = { d: number; kind: "bot" | "box"; node: React.ReactNode; behind: boolean };
/** does the segment from the camera to p pass through the task block (its box, a little shrunk for the round edges)? */
const BLK_MIN: V3 = [BLOCK_C[0] - TASK.w / 2 + 0.05, 0, BLOCK_C[2] - TASK.d / 2 + 0.05];
const BLK_MAX: V3 = [BLOCK_C[0] + TASK.w / 2 - 0.05, TASK.h - 0.05, BLOCK_C[2] + TASK.d / 2 - 0.05];
const hitsBlock = (W: World, p: V3) => {
  const o = W.pos;
  const d = sub(p, o);
  let t0 = 0;
  let t1 = 1;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-9) {
      if (o[k] < BLK_MIN[k] || o[k] > BLK_MAX[k]) return false;
      continue;
    }
    let a = (BLK_MIN[k] - o[k]) / d[k];
    let b = (BLK_MAX[k] - o[k]) / d[k];
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
};
/** behind the block when any of its sample points is hidden by it (then the block's silhouette clips it) */
const behindBlock = (W: World, pts: V3[]) => pts.some((p) => hitsBlock(W, p));

const CheatedAtTheTask: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const W = worldAt(KEYS, frame);

  // --- the padlock
  const pull = pullAt(frame);
  const shake = lockSwing(frame);
  const tug = 0.07 * pull;

  // --- the crowd
  const crowd = CROWD.map((w) => ({ w, ...walkerState(W, w, frame, LOCK_FLOOR) }));

  // the tugger: walks in, then grips the lock's left side (contact f80) and pulls
  // the tugger: walks in, turns three-quarter to us (face seen), grips the lock's left side (contact f80) and pulls,
  // leaning and sliding back on each pull
  const tg0 = walkerState(W, TUGGER, frame, lookFor(TUG_SEAT, 0.62));
  const tg = { ...tg0, p: add(tg0.p, mul(norm(sub(TUG_SEAT, LOCK_FLOOR)), 0.12 * pull)) };
  const tugPose = (() => {
    const grip = sst(72, 80, frame);
    if (grip <= 0.001) return tg.pose;
    const gl = toLocal(W, tg.p, TUGGER.size, lockPoint(LK.cx - LK.s * 0.4, LK.cy + LK.bh * 0.3, LK.t * 0.6, shake, tug));
    const gr = toLocal(W, tg.p, TUGGER.size, lockPoint(LK.cx - LK.s * 0.3, LK.cy - LK.bh * 0.05, LK.t * 0.9, shake, tug));
    const base: BotPose = { ...tg.pose, lean: (tg.pose.lean ?? 0) - 22 * pull - 4 * grip, crouch: (tg.pose.crouch ?? 0) + 6 * pull, worry: 0.75 * grip, mouth: 0.1 };
    const held = botGripTo(base, { L: gl, R: gr });
    return grip >= 0.999 ? held : (lerpPose(tg.pose, held, grip) as BotPose);
  })();
  // the leaners: three-quarter to us, leaning in toward the lock from either side
  const LN_YAW = [-0.85, 0.75];
  const LN_SIDE = [-1, 1];
  const leaners = LEANERS.map((w, i) => {
    const s = walkerState(W, w, frame, lookFor(w.seat, LN_YAW[i]));
    const lean = sst(78 + i * 6, 92 + i * 6, frame);
    return { w, p: s.p, pose: { ...s.pose, lean: (s.pose.lean ?? 0) + LN_SIDE[i] * 8 * lean, pitch: (s.pose.pitch ?? 0) + 6 * lean, worry: 0.45 * lean, look: [LN_SIDE[i] * 0.6, 0.1] } as BotPose };
  });

  // --- the box trio
  const lifter = lifterPose(W, frame);
  const helperPose: BotPose = { ...BOT_POSES.turnTo(faceYaw(W, HELPER.p, BOX.c), frame, HELPER.seed), laugh: 0.4 * sst(RISE1 - 4, RISE1 + 6, frame), look: [-0.3, lerp(0.4, -0.2, sst(RISE0, RISE1, frame))] };
  const wb = walkerState(W, WALKER_B, frame, BOX.c);

  // --- the card: white inside the box; orange spreads in from the lifter's grips as it rises
  const fr: CardFrame = cardFrame(W, cardCentre(frame), CARD.w, CARD.h);
  const og = cardOrange(frame);
  const res = 500;
  // the print: ANSWERS over a rule and four ticked answer rows (an answer sheet, readable at the end framing)
  const W_L = CARD.w * res;
  const ROWS = [0.46, 0.53, 0.36, 0.49];
  const tick = (ink: string) => (
    <g>
      <text x={W_L / 2} y={0.165 * res} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={0.13 * res} letterSpacing={0.0052 * res} fill={ink}>
        ANSWERS
      </text>
      <rect x={0.08 * res} y={0.2 * res} width={W_L - 0.16 * res} height={0.012 * res} rx={0.006 * res} fill={ink} opacity={0.8} />
      {ROWS.map((len, i) => {
        const cy = (0.29 + i * 0.094) * res;
        return (
          <g key={i}>
            <path d={TICK(0.15 * res, cy, 0.075 * res)} fill="none" stroke={ink} strokeWidth={0.019 * res} strokeLinecap="round" strokeLinejoin="round" />
            <rect x={0.23 * res} y={cy - 0.014 * res} width={len * res} height={0.028 * res} rx={0.014 * res} fill={ink} opacity={0.72} />
          </g>
        );
      })}
    </g>
  );
  const gripsS = [-1, 1].map((sgn) => W.project(add(add(fr.c, mul(fr.u, sgn * (CARD.w / 2 - 0.11))), mul(fr.v, CARD.h / 2))));
  const spreadR = og * 1.15 * CARD.w * W.scaleAt(fr.c);
  const circ = (c: P2, r: number) => `M${c[0] - r},${c[1]}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  const card = (
    <>
      <Card W={W} fr={fr} uid="keyW" orange={0} res={res}>
        {tick(cardInk(0))}
      </Card>
      {og > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, clipPath: `path('${gripsS.map((c) => circ(c, Math.max(0.5, spreadR))).join("")}')` }}>
          <Card W={W} fr={fr} uid="keyO" orange={1} res={res}>
            {tick(cardInk(1))}
          </Card>
        </div>
      ) : null}
    </>
  );

  // --- painter's order: the block, then every robot and the box by depth (far first)
  const items: Item[] = [];
  const bot = (key: string, p: V3, pose: BotPose, variant: number, size: number) => {
    const hgt = 1.35 * size;
    // cull robots wholly off frame (a glow layer holding only off-frame robots paints a stray tile at the top-left)
    const ft = W.project(p);
    const hw = 0.6 * size * W.scaleAt(p);
    const top = W.project(add(p, [0, hgt, 0]))[1];
    if (ft[0] + hw < -40 || ft[0] - hw > 1120 || top > 1960 || ft[1] < -40) return;
    const samples: V3[] = [p, add(p, [0, hgt * 0.5, 0]), add(p, [0, hgt, 0]), add(add(p, mul(W.r, 0.25 * size)), [0, hgt * 0.6, 0]), add(add(p, mul(W.r, -0.25 * size)), [0, hgt * 0.6, 0])];
    items.push({ d: W.depth(add(p, [0, 0.5, 0])), kind: "bot", behind: behindBlock(W, samples), node: <RobotAt key={key} W={W} p={p} pose={pose} uid={key} variant={variant} size={size} /> });
  };
  crowd.forEach((c, i) => bot(`cr${i}`, c.p, c.pose, c.w.variant, c.w.size));
  bot("tug", tg.p, tugPose, TUGGER.variant, TUGGER.size);
  leaners.forEach((l, i) => bot(`ln${i}`, l.p, l.pose, l.w.variant, l.w.size));
  bot("lifter", LIFTER.p, lifter, LIFTER.variant, LIFTER.size);
  bot("helper", HELPER.p, helperPose, HELPER.variant, HELPER.size);
  bot("wb", wb.p, wb.pose, WALKER_B.variant, WALKER_B.size);
  const boxSamples: V3[] = [...footPts(BOX.c, BOX.w, BOX.d, BOX.yaw), ...footPts(BOX.c, BOX.w, BOX.d, BOX.yaw).map((q) => add(q, [0, BOX.h, 0])), add(cardCentre(frame), [0, CARD.h / 2, 0])];
  items.push({
    d: W.depth(add(BOX.c, [0, 0.3, 0])),
    kind: "box",
    behind: behindBlock(W, boxSamples),
    node: (
      <HFBox key="box" W={W} g={BOX} uid="hfbox" open={lidAngle(frame) / HF_LID_OPEN} inside={card} plate={HF_PLATE} />
    ),
  });
  items.sort((a, b) => b.d - a.d);
  // two groups: behind the block (drawn before it, its silhouette hides them) and in front; within each, far first;
  // consecutive robots share one glowing layer
  const stack = (list: Item[], tag: string) => {
    const layers: React.ReactNode[] = [];
    let run: React.ReactNode[] = [];
    const flush = () => {
      if (run.length) layers.push(<Svg key={`${tag}r${layers.length}`} id={`${tag}r${layers.length}`} glow={0.35}>{run}</Svg>);
      run = [];
    };
    for (const it of list) {
      if (it.kind === "bot") run.push(it.node);
      else {
        flush();
        layers.push(<React.Fragment key={`${tag}b${layers.length}`}>{it.node}</React.Fragment>);
      }
    }
    flush();
    return layers;
  };
  const back = stack(items.filter((i) => i.behind), "bk");
  const front = stack(items.filter((i) => !i.behind), "fr");

  const robotsAt: V3[] = [...crowd.map((c) => c.p), tg.p, ...leaners.map((l) => l.p), LIFTER.p, HELPER.p, wb.p];
  const shadows = (
    <>
      <FloorShadow W={W} pts={footPts(BLOCK_C, TASK.w, TASK.d)} uid="blkS" soft={0.35} reach={0.7} />
      <FloorShadow W={W} pts={footPts(BOX.c, BOX.w, BOX.d, BOX.yaw)} uid="boxS" soft={0.14} reach={0.25} />
      {robotsAt.map((p, i) => (
        <FloorShadow key={i} W={W} pts={robotFoot(p, 0.2)} uid={`rS${i}`} soft={0.1} reach={0.18} />
      ))}
    </>
  );
  return (
    <HfStage W={W} floor={{ pool: [0.6, 0, -0.6], poolR: 5, oz: 0.1 }} shadows={shadows}>
      {back}
      <TaskBlock W={W} c={BLOCK_C} uid="task" shake={shake} tug={tug} />
      {front}
    </HfStage>
  );
};

export default CheatedAtTheTask;
