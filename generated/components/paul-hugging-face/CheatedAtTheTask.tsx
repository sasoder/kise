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
//   shackle and holds; a leaner on each side leans in. NEW CHEAT: the lock is never opened, they go round it. From f98
//   the camera orbits right round the block's front-right corner (side face in view from ~f112, "They"; round by
//   ~f124) onto its RIGHT side, where two robots who were hidden behind it have already unscrewed a panel in the
//   side's rear half (loose screws on the floor below). The lifter's mittens on the panel's top edge (f117), a short
//   pull (f117 -> f123), then it lets go and the panel falls open outward onto the floor (f123 -> f129, one small
//   bounce) as a ramp; warm orange light spills out of the opening, across the panel's inner face and the floor. The
//   lifter rocks back a touch, turns and leans into the lit opening (f124 -> f132), both mittens in onto the butt
//   end of the big orange FLAG's pole (f132), and draws it out butt first in one eased arc, the pole always running
//   through the opening, the furled cloth coming out last (f132 -> f140); in the same motion it swings the pole round
//   in front of the side and up overhead, the cloth unfurling as it rises (f140 -> f152), a small overshoot and settle
//   (f152 -> f158), then holds it high, waving: a 1.05 x 0.68 m cloth on a 1.7 m pole, bright orange with a soft
//   bloom (theirs now). The pole is drawn in front of the lifter and its two mittens are drawn again over the pole
//   (the same robot, clipped to its mittens), so the hands visibly hold it throughout. Happy squint from f150, the
//   helper cheers, hands up. Meanwhile the tugger keeps heaving at the padlock (f128, f146) and it
//   stays shut. End frame: the padlock still hanging locked at the block's front on the left (x ~190-280, the tugger
//   whole beside it), the open side with the light and the ramp centre-right, the lifter with the flag held high
//   (pole top ~y 600, feet ~y 1100, ramp tip ~y 1215, helper inside x 1000).
// Orange = the AIs and what they have taken (the flag). Off-white = the people's task (the strongbox).
//
// CAMERA: worldAt keys (pchip, moving pre/post-roll keys at f-12 and f182): f0 close/low on the stream -> f42
//   pull-back + crane -> f74 the fan + block from its left (yaw +0.2, dist 10) -> f98 push-in on the lock (dist 7.8)
//   -> f126 orbit right round the corner onto the right side (yaw -0.92, dist 7.6, target up to the side's opening)
//   -> f163 a slow creep in and on round (yaw -1.01, dist 7.47). Every channel is monotone except dist (pull-back
//   into push-in at f75).
//
// SOURCES: OpenAI, "The Hugging Face incident and the road ahead" (July 2026): the ExploitGym cyber evaluation; the
//   models broke out of the test environment and hacked Hugging Face to get the evaluation's answers. Nothing numeric
//   on screen. No logos (the HF box is gone from this cut).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BOT_POSES, botAnchors, botGripTo, lerpPose, type BotPose } from "../rsi-ten-earths/tenEarthsBot";
import { ACCENT, ACCENT_DEEP, FloorShadow, HfStage, MATS, Prism, ROBOT_U, RobotAt, Svg, add, c01, cross, dot, lerp, mixHexL as mixHex, mixMat, mul, n2, norm, robotFoot, rrect, sst, sub, worldAt, type CamKey, type P2, type V3, type World } from "./hfWorld";
import { TASK, TaskBlock, faceYaw, footPts } from "./hfProps";

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
/** the strongbox's way round: a panel in the rear half of its RIGHT side (screws already out), hinged at its bottom
 *  edge, that falls open outward onto the floor; the prize inside is an orange flag (capture the flag) */
const SIDE_X = BLOCK_C[0] + TASK.w / 2;
const HOLE = { z0: 0.2, z1: 0.75, y0: 0.35, y1: 1.45 };
const HOLE_ZC = (HOLE.z0 + HOLE.z1) / 2;
const PANEL_H = HOLE.y1 - HOLE.y0;
const PANEL_W = HOLE.z1 - HOLE.z0;
const PANEL_T = 0.05;
/** the angle (from upright, outward) at which the falling panel's top edge meets the floor */
const PANEL_LAND = Math.acos(-(HOLE.y0 - 0.02) / PANEL_H);
const FLAG = { pole: 1.7, w: 1.05, h: 0.68 };
const HOLE_C: V3 = [SIDE_X, (HOLE.y0 + HOLE.y1) / 2, HOLE_ZC];

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
const KEYS: CamKey[] = [
  // a pre-roll key: the pull-back is already under way at f0; a post-roll key: still creeping in at f163. The camera
  // works the lock from the block's LEFT side (yaw +), the crew behind the block's right rear hidden by it; from f98 it
  // orbits right round the front-right corner (yaw -1.0) onto the right side, the padlock still in view on the left
  { f: -12, target: [-2.5, 0.48, -3.2], dist: 3.6, yaw: 0.22, pitch: 0.12, F: 1700, sy: 785 },
  { f: 42, target: [-1.2, 0.62, -2.3], dist: 7.6, pitch: 0.34, sy: 700 },
  { f: 74, target: [-0.4, 0.7, -1.4], dist: 10.0, yaw: 0.2, pitch: 0.47, sy: 660 },
  { f: 98, target: [-0.3, 0.8, -1.1], dist: 7.8, yaw: 0.16, sy: 500 },
  { f: 126, target: [1.15, 2.0, 0.05], dist: 7.6, yaw: -0.92, pitch: 0.36, sy: 500 },
  { f: 182, target: [1.2, 2.0, 0.1], dist: 7.45, yaw: -1.02, pitch: 0.34, sy: 500 },
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
  [0.3, 0, FRONT_Z - 0.82],
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
/** the padlock's screen outline (convex hull of its body and shackle), for drawing it again over robots that stand
 *  behind it once the camera is round on the right */
const hull = (pts: P2[]): P2[] => {
  const q = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const crossZ = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const p of q) {
    while (lo.length >= 2 && crossZ(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: P2[] = [];
  for (const p of [...q].reverse()) {
    while (up.length >= 2 && crossZ(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const lockHull = (W: World, shake: number, tug: number): P2[] => {
  const bodyY = LK.cy + LK.bh * 0.18;
  const shR = LK.s * 0.3;
  const shY = LK.cy + LK.bh * 0.18 - LK.bh / 2;
  const pts: V3[] = [];
  for (const x of [LK.cx - LK.s / 2, LK.cx + LK.s / 2]) for (const y of [bodyY - LK.bh / 2, bodyY + LK.bh / 2]) for (const z of [0, LK.t]) pts.push(lockPoint(x, y, z, shake, tug));
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (Math.PI * i) / 8;
    pts.push(lockPoint(LK.cx + (shR + LK.s * 0.07) * Math.cos(a), shY - shR * 0.55 + (shR + LK.s * 0.07) * Math.sin(a), LK.t * 0.5, shake, tug));
  }
  return hull(pts.map(W.project));
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
// THE WAY ROUND: the side panel (pulled, then falling open), the light inside, the flag pulled out and held up
// ===================================================================================================================
/** the crew at the block's right rear (hidden by the block until the orbit): the lifter and a helper */
const LIFTER = { p: [1.97, 0, 1.0] as V3, size: 1.15, variant: 0, seed: 31 };
const HELPER = { p: [2.32, 0, 1.42] as V3, size: 0.9, variant: 2, seed: 32 };
/** facings fixed in the world, given as the yaw the END camera (f163) sees */
const WEND = worldAt(KEYS, 163);
const lookEnd = (p: V3, y: number): V3 => {
  const fh = norm([WEND.f[0], 0, WEND.f[2]]);
  return add(p, add(mul(WEND.r, Math.sin(y)), mul(fh, -Math.cos(y))));
};

const REACH0 = 110; // the lifter reaches for the panel's top edge
const GRIP0 = 117; // mittens on it; it pulls the top out a little
const FALL0 = 123; // let go: the panel falls open
const FALL1 = 129; // it hits the floor (one small bounce)
const IN0 = 126; // the lifter leans in and reaches into the opening
const FLAG0 = 132; // mittens on the pole's butt end: out through the hole, round and up
const FLAG1 = 150; // held high
const PULL_A = 0.14;
const panelAngle = (f: number) => {
  if (f <= GRIP0) return 0;
  if (f <= FALL0) return PULL_A * sst(GRIP0, FALL0, f);
  if (f <= FALL1) return PULL_A + (PANEL_LAND - PULL_A) * ((f - FALL0) / (FALL1 - FALL0)) ** 2;
  return PANEL_LAND - 0.16 * Math.abs(Math.sin((Math.PI * (f - FALL1)) / 5)) * Math.exp(-(f - FALL1) / 4);
};
/** the light from inside: a crack of it as the panel is pulled, full once it is down */
const lightAt = (f: number) => 0.25 * sst(GRIP0 + 2, FALL0, f) + 0.75 * sst(FALL0, FALL1 + 3, f);
/** a point on the panel's outer face: along its width (z) and up it (h 0..PANEL_H), at angle a */
const panelPt = (a: number, zz: number, h: number): V3 => [SIDE_X + h * Math.sin(a), HOLE.y0 + h * Math.cos(a), zz];

/** THE FLAG'S ONE GESTURE. Stored inside: the pole lies along DIR_IN, its butt just inside the opening (F), the cloth
 *  furled round its top deep in the box. Mittens on the butt end (FLAG0): the butt comes out first along one eased
 *  arc, the pole always running through the opening (a guide point slides from just inside it to its plane), until
 *  the top end clears (T_CLEAR); then, in the same motion, the pole swings round (away from the wall, in front of the
 *  side face) and up overhead, the cloth unfurling as it clears and rises, a small overshoot to the left and a
 *  settle (T_UP -> T_SET), then held high, waving. The lifter's two mittens stay on the pole's butt end throughout. */
const T_CLEAR = 140;
const T_UP = 152;
const T_SET = 158;
const FLAG_F: V3 = [SIDE_X, 0.85, 0.58];
const DIR_IN: V3 = norm([-0.9, 0.3, -0.25]);
const B_S: V3 = add(FLAG_F, mul(DIR_IN, 0.03));
const B_C: V3 = add(FLAG_F, mul(norm([1.48, 1.02, -0.43]), FLAG.pole + 0.15));
const D_CC: V3 = norm(sub(FLAG_F, B_C));
const B_F: V3 = add([1.93, 0.95, 0.56], mul(WEND.r, 0.03));
/** the two grip points along the pole from its butt (the robot's screen-left mitten higher up) */
const GRIP_U: [number, number] = [0.2, 0.04];
const bez3 = (a: V3, b: V3, c: V3, d: V3, t: number): V3 => {
  const u = 1 - t;
  return add(add(mul(a, u * u * u), mul(b, 3 * u * u * t)), add(mul(c, 3 * u * t * t), mul(d, t * t * t)));
};
const ease = (t: number) => t * t * (3 - 2 * t);
const flagPose = (f: number): { butt: V3; dir: V3; unf: number } => {
  if (f <= FLAG0) return { butt: B_S, dir: DIR_IN, unf: 0 };
  if (f <= T_CLEAR) {
    const t = ease((f - FLAG0) / (T_CLEAR - FLAG0));
    const butt = bez3(B_S, sub(FLAG_F, mul(DIR_IN, 0.5)), sub(FLAG_F, mul(D_CC, FLAG.pole * 0.75)), B_C, t);
    const G = add(FLAG_F, mul(DIR_IN, 0.25 * (1 - t)));
    return { butt, dir: norm(sub(G, butt)), unf: 0 };
  }
  const t = c01((f - T_CLEAR) / (T_UP - T_CLEAR));
  const e = ease(t);
  const toCam = norm([-WEND.f[0], 0, -WEND.f[2]]);
  const dirUp: V3 = norm(add(add([0, 1, 0], mul(WEND.r, -0.22)), mul(toCam, 0.15)));
  // azimuth (floor plane, from +x toward +z) turns first, round through -z while the pole is low, then it rises
  const azEl = (d: V3) => [Math.atan2(d[2], d[0]), Math.asin(Math.max(-1, Math.min(1, d[1])))];
  const [a0, e0] = azEl(D_CC);
  let [a1] = azEl(dirUp);
  const e1 = azEl(dirUp)[1];
  while (a1 < a0) a1 += 2 * Math.PI;
  const A_MID = 4.1;
  const az = t < 0.4 ? lerp(a0, A_MID, sst(0, 0.4, t)) : lerp(A_MID, a1, sst(0.4, 1, t));
  const el = lerp(e0, e1, sst(0.08, 1, t));
  const d0: V3 = [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
  const over = 0.1 * Math.sin(Math.PI * c01((f - T_UP + 3) / (T_SET - T_UP + 3)));
  const sway = 0.03 * Math.sin((f - T_SET) * 0.16) * sst(T_SET - 2, T_SET + 6, f);
  // pushed out from the wall while it sweeps round (the top stays well clear of the side face, 15-90 cm off it from
  // f142, so it reads as in front of the wall, never as sliding along it)
  const outX = 0.45 * sst(0, 0.25, t) * (1 - sst(0.65, 1, t));
  const dir = norm(add(add(d0, [outX, 0, 0]), mul(WEND.r, over + sway)));
  const butt = bez3(B_C, add(B_C, [0, 0.2, -0.2]), add(B_F, [0.3, 0.1, -0.2]), B_F, e);
  return { butt, dir, unf: sst(0.25, 1, e) };
};
/** the lifter's two grip points on the pole: [its screen-left mitten, its screen-right mitten] */
const flagGrips = (f: number): [V3, V3] => {
  const { butt, dir } = flagPose(f);
  return [add(butt, mul(dir, GRIP_U[0])), add(butt, mul(dir, GRIP_U[1]))];
};
/** the flag's world geometry: the pole and the cloth as strips across it (furled, then unfurling and waving) */
const flagGeom = (f: number) => {
  const { butt, dir, unf } = flagPose(f);
  const top = add(butt, mul(dir, FLAG.pole));
  // the cloth hangs off the pole toward +z (the side's rear), across the pole; its wave is along the cloth's normal
  const cw = norm([0, -dir[2], dir[1]]);
  const nrm = norm(cross(dir, cw));
  const N = 7;
  const w = FLAG.w * lerp(0.065, 1, unf);
  const ph = (t: number) => Math.PI * 2 * (t * 1.1 - f * 0.07);
  const amp = 0.01 + 0.075 * unf;
  const edge = (t: number, y: number): V3 => add(add(sub(top, mul(dir, y)), mul(cw, t * w)), mul(nrm, amp * t * Math.sin(ph(t))));
  const strips: { q: V3[]; shade: number }[] = [];
  for (let i = 0; i < N; i++) {
    const t0 = i / N;
    const t1 = (i + 1) / N;
    const q: V3[] = [edge(t0, 0), edge(t1, 0)];
    // a swallow-tail notch cut into the free end
    if (i === N - 1) q.push(edge(t1 - 0.13, FLAG.h / 2));
    q.push(edge(t1, FLAG.h), edge(t0, FLAG.h));
    strips.push({ q, shade: lerp(0.3, 1, unf) * Math.cos(ph((t0 + t1) / 2)) });
  }
  return { base: butt, top, strips, s: unf };
};
/** keep the part of a polygon on one side of the plane x = SIDE_X */
const clipX = (poly: V3[], keepOut: boolean): V3[] => {
  const inside = (p: V3) => (keepOut ? p[0] >= SIDE_X : p[0] < SIDE_X);
  const out: V3[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (SIDE_X - a[0]) / (b[0] - a[0]);
      out.push([SIDE_X, lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);
    }
  }
  return out;
};
/** the part of the segment a-b on one side of the plane x = SIDE_X */
const FLAG_LIT = "#FFE07A";
const FLAG_MID = "#FFBE1A";
const FLAG_DARK = "#E08600";
const clipSegX = (a: V3, b: V3, keepOut: boolean): [V3, V3] | null => {
  const q = clipX([a, b], keepOut);
  return q.length >= 2 ? [q[0], q[1]] : null;
};
const FlagArt: React.FC<{ W: World; f: number; part: "in" | "out" }> = ({ W, f, part }) => {
  const g = flagGeom(f);
  const keepOut = part === "out";
  const pole = clipSegX(g.base, g.top, keepOut);
  const k = W.scaleAt(g.top);
  const tone = (hex: string) => W.toneO(hex, g.top);
  const P = (q: V3) => {
    const p2 = W.project(q);
    return `${n2(p2[0])},${n2(p2[1])}`;
  };
  const topIn = g.top[0] >= SIDE_X === keepOut;
  return (
    <g>
      <defs>
        <filter id={`bloom${part}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={n2(0.09 * k)} />
        </filter>
      </defs>
      {pole ? <path d={`M${P(pole[0])}L${P(pole[1])}`} stroke={W.tone("#3A342E", g.base)} strokeWidth={n2(0.055 * k)} strokeLinecap="round" fill="none" /> : null}
      {/* a soft bloom behind the cloth (stronger as it unfurls) */}
      <g filter={`url(#bloom${part})`} opacity={0.35 + 0.55 * g.s}>
        {g.strips.map((st, i) => {
          const q = clipX(st.q, keepOut);
          return q.length < 3 ? null : <path key={i} d={`M${q.map(P).join("L")}Z`} fill="#FFB000" stroke="#FFB000" strokeWidth={n2(0.06 * k)} strokeLinejoin="round" />;
        })}
      </g>
      {g.strips.map((st, i) => {
        const q = clipX(st.q, keepOut);
        if (q.length < 3) return null;
        const fill = st.shade > 0 ? mixHex(FLAG_MID, FLAG_LIT, 0.8 * st.shade) : mixHex(FLAG_MID, FLAG_DARK, -0.5 * st.shade);
        return <path key={i} d={`M${q.map(P).join("L")}Z`} fill={tone(fill)} stroke={tone(fill)} strokeWidth={0.8} strokeLinejoin="round" />;
      })}
      {g.base[0] >= SIDE_X === keepOut ? <circle cx={n2(W.project(g.base)[0])} cy={n2(W.project(g.base)[1])} r={n2(0.034 * W.scaleAt(g.base))} fill={W.tone("#2E2924", g.base)} /> : null}
      {topIn ? <circle cx={n2(W.project(g.top)[0])} cy={n2(W.project(g.top)[1])} r={n2(0.024 * k)} fill={tone("#E3A23A")} /> : null}
    </g>
  );
};

/** the side panel at its angle: a thin slab hinged at its bottom outer edge, with the four screw holes on its face */
const PanelArt: React.FC<{ W: World; a: number; light: number }> = ({ W, a, light }) => {
  const up: V3 = [Math.sin(a), Math.cos(a), 0];
  const out: V3 = [Math.cos(a), -Math.sin(a), 0];
  const hinge: V3 = [SIDE_X, HOLE.y0, HOLE_ZC];
  const o = sub(hinge, mul(out, PANEL_T));
  const mat = MATS.clay;
  const capMat = mixMat(mat, { lit: "#FFE2A6", mid: "#F2C27A", dark: "#B7864A" }, 0.55 * light * c01(a / 0.6));
  const outerSeen = dot(out, sub(W.pos, hinge)) > 0;
  const hs = [
    [HOLE.z0 + 0.07, 0.08],
    [HOLE.z1 - 0.07, 0.08],
    [HOLE.z1 - 0.07, PANEL_H - 0.08],
    [HOLE.z0 + 0.07, PANEL_H - 0.08],
  ].map(([zz, h]) => panelPt(a, zz, h));
  const k = W.scaleAt(hinge);
  return (
    <Svg id="panel">
      <Prism W={W} outline={rrect(PANEL_W, PANEL_H, 0.03, 5, 0, PANEL_H / 2)} o={o} u={[0, 0, 1]} v={up} n={out} depth={PANEL_T} mat={mat} capMat={capMat} uid="panel" line={1} ao={0} />
      {outerSeen
        ? hs.map((h, i) => {
            const p2 = W.project(h);
            return <circle key={i} cx={n2(p2[0])} cy={n2(p2[1])} r={n2(0.017 * k)} fill={W.tone("#4A453F", h)} />;
          })
        : null}
    </Svg>
  );
};

/** loose screws on the floor below the opening (they came out before we got round) */
const SCREWS: [V3, number][] = [
  [[1.93, 0, 0.08], 0.3],
  [[2.16, 0, -0.04], 1.6],
  [[2.42, 0, 0.14], 2.4],
  [[2.58, 0, 0.66], 0.9],
];
const Screws: React.FC<{ W: World }> = ({ W }) => (
  <Svg id="screws">
    {SCREWS.map(([p, ang], i) => {
      const d: V3 = [Math.cos(ang) * 0.07, 0, Math.sin(ang) * 0.07];
      const a = W.project(add(p, [0, 0.012, 0]));
      const b = W.project(add(add(p, d), [0, 0.01, 0]));
      const k = W.scaleAt(p);
      return (
        <g key={i}>
          <path d={`M${n2(a[0])},${n2(a[1])}L${n2(b[0])},${n2(b[1])}`} stroke={W.tone("#6E6861", p)} strokeWidth={n2(0.014 * k)} strokeLinecap="round" />
          <ellipse cx={n2(a[0])} cy={n2(a[1])} rx={n2(0.024 * k)} ry={n2(0.013 * k)} fill={W.tone("#B9B2A7", p)} stroke={W.tone("#57524C", p)} strokeWidth={0.8} />
        </g>
      );
    })}
  </Svg>
);

/** the lifter: reaches for the panel's top edge, pulls it out until it falls; then a small rock back, turns and leans
 *  into the lit opening, both mittens in onto the pole's butt end, draws it out and swings it up overhead (turning
 *  back to us as it rises), holds it high (happy squint) */
const lifterYaw = (f: number) => lerp(-0.75, -1.4, sst(124, 130, f) * (1 - sst(139, 148, f)));
const lifterLean = (f: number) => 3 * Math.sin(Math.PI * c01((f - 124) / 5)) - 14 * sst(127, 132, f) * (1 - sst(133, 138, f)) - 2 * sst(133, 138, f) * (1 - sst(139, 145, f));
/** how closed the gripping mittens are */
const lifterFist = (f: number) => 0.9 * sst(IN0 + 3, FLAG0, f);
const lifterPose = (W: World, f: number): BotPose => {
  const { p, size, seed } = LIFTER;
  const base: BotPose = { ...BOT_POSES.turnTo(faceYaw(W, p, lookEnd(p, lifterYaw(f))), f, seed), look: [-0.5, 0.2] };
  const loc = (q: V3) => toLocal(W, p, size, q);
  const onEdge = (b0: BotPose, aa: number) => botGripTo(b0, { L: loc(panelPt(aa, HOLE.z1 - 0.2, PANEL_H)), R: loc(panelPt(aa, HOLE.z1 - 0.04, PANEL_H)) });
  const blend = (q0: BotPose, q1: BotPose, t: number): BotPose => (t <= 0.001 ? q0 : t >= 0.999 ? q1 : (lerpPose(q0, q1, t) as BotPose));
  let q: BotPose;
  let lean = 0;
  if (f < GRIP0) q = blend(botGripTo(base, {}), onEdge(base, 0), sst(REACH0, GRIP0, f));
  else if (f < FALL0) {
    q = onEdge(base, panelAngle(f));
    lean = 6 * sst(GRIP0, FALL0, f);
  } else {
    // the lean is in the pose before the arms are solved, so the mittens land on the pole
    const bl: BotPose = { ...base, lean: (base.lean ?? 0) + lifterLean(f) };
    const free = blend(onEdge(bl, PULL_A), botGripTo(bl, {}), sst(FALL0, FALL0 + 4, f));
    const [gL, gR] = flagGrips(f);
    const tg = { L: loc(gL), R: loc(gR) };
    const onPole = f >= IN0 ? botGripTo(botGripTo(botGripTo(bl, tg), tg), tg) : free;
    q = blend(free, onPole, sst(IN0, FLAG0, f));
    lean = 6 * (1 - sst(FALL0, FALL0 + 4, f));
    const fist = lifterFist(f);
    if (fist > 0) q = { ...q, armL: { ...q.armL, fist }, armR: { ...q.armR, fist } } as BotPose;
  }
  const happy = sst(FLAG1 - 2, FLAG1 + 8, f);
  return { ...q, lean: (q.lean ?? 0) + lean, laugh: 0.55 * happy, look: [lerp(-0.5, 0.1, sst(FLAG0, FLAG1, f)), lerp(0.2, -0.3, sst(FLAG0, FLAG1, f))], mouth: 0.15 + 0.25 * happy };
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
type Item = { d: number; kind: "bot" | "prop"; node: React.ReactNode; behind: boolean };
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

  // --- the crew at the side
  const lifter = lifterPose(W, frame);
  const cheer = sst(FLAG1 - 3, FLAG1 + 7, frame);
  const helperPose: BotPose = { ...BOT_POSES.turnTo(faceYaw(W, HELPER.p, lookEnd(HELPER.p, -0.45)), frame, HELPER.seed), look: [-0.5, lerp(0.3, -0.3, sst(FLAG0, FLAG1, frame))], laugh: 0.45 * cheer, mouth: 0.15 + 0.2 * cheer };
  const helper = botGripTo(helperPose, cheer > 0.01 ? { L: [lerp(-34, -40, cheer), lerp(-70, -128, cheer)], R: [lerp(34, 40, cheer), lerp(-70, -128, cheer)] } : {});

  // --- the panel, the light, the flag
  const pa = panelAngle(frame);
  const light = lightAt(frame);
  const sideSeen = W.pos[0] > SIDE_X + 0.05;
  const holeQ = [
    [HOLE.z0, HOLE.y0],
    [HOLE.z1, HOLE.y0],
    [HOLE.z1, HOLE.y1],
    [HOLE.z0, HOLE.y1],
  ].map(([zz, y]) => W.project([SIDE_X + 0.003, y, zz]));
  const holeD = `M${holeQ.map((q) => `${n2(q[0])},${n2(q[1])}`).join("L")}Z`;
  const kH = W.scaleAt([SIDE_X, (HOLE.y0 + HOLE.y1) / 2, HOLE_ZC]);
  const glowC = W.project([SIDE_X - 0.3, HOLE.y0 + 0.35, HOLE_ZC]);
  const holeLayer =
    sideSeen && pa > 0.004 ? (
      <Svg id="hole">
        <defs>
          <filter id="holeHalo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={n2(0.14 * kH)} />
          </filter>
          <radialGradient id="holeLight" gradientUnits="userSpaceOnUse" cx={n2(glowC[0])} cy={n2(glowC[1])} r={n2(0.8 * kH)}>
            <stop offset="0" stopColor="#FFF0C8" stopOpacity={light} />
            <stop offset="0.4" stopColor="#FFC94D" stopOpacity={light} />
            <stop offset="1" stopColor={ACCENT_DEEP} stopOpacity={light} />
          </radialGradient>
          <clipPath id="holeClip">
            <path d={holeD} />
          </clipPath>
        </defs>
        {/* warm light on the block's side round the opening */}
        <path d={holeD} fill={ACCENT} opacity={0.75 * light} filter="url(#holeHalo)" />
        <path d={holeD} fill={W.tone("#2A2119", HOLE_C)} />
        <path d={holeD} fill="url(#holeLight)" />
        {/* the wall's thickness: a shaded lip along the top and the far edge */}
        <path d={`M${n2(holeQ[3][0])},${n2(holeQ[3][1])}L${n2(holeQ[2][0])},${n2(holeQ[2][1])}`} stroke={ACCENT_DEEP} strokeOpacity={0.8} strokeWidth={n2(0.05 * kH)} clipPath="url(#holeClip)" />
        <g clipPath="url(#holeClip)">
          <FlagArt W={W} f={frame} part="in" />
        </g>
      </Svg>
    ) : null;

  // --- painter's order: the block, then every robot and prop by depth (far first)
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
  bot("helper", HELPER.p, helper, HELPER.variant, HELPER.size);
  // the panel: hidden by the block while the camera is on the left; drawn over the side face once round
  if (sideSeen) {
    const mid = panelPt(pa, HOLE_ZC, PANEL_H / 2);
    items.push({ d: W.depth(mid), kind: "prop", behind: false, node: <PanelArt key="panel" W={W} a={pa} light={light} /> });
  }
  // the flag's outside part: in front of the lifter's body (the pole held in front of it), then the lifter's own
  // mittens drawn again over the pole (the same robot, clipped to its two mittens)
  const fg = flagGeom(frame);
  const dLift = W.depth(add(LIFTER.p, [0, 0.5, 0]));
  if (sideSeen && (fg.top[0] > SIDE_X || fg.base[0] > SIDE_X)) {
    items.push({
      d: dLift - 0.02,
      kind: "prop",
      behind: false,
      node: (
        <Svg key="flagOut" id="flagOut" glow={lerp(0.6, 1.6, fg.s)}>
          <FlagArt W={W} f={frame} part="out" />
        </Svg>
      ),
    });
    if (frame >= FLAG0) {
      const at = W.project(LIFTER.p);
      const sc = (W.scaleAt(LIFTER.p) / ROBOT_U) * LIFTER.size;
      const an = botAnchors(LIFTER.variant, lifter, at, sc);
      const fist = lifterFist(frame);
      const mitt = (m: P2, wr: P2, key: string) => {
        const ang = (Math.atan2(m[1] - wr[1], m[0] - wr[0]) * 180) / Math.PI;
        return <ellipse key={key} cx={n2(m[0])} cy={n2(m[1])} rx={n2(1.12 * lerp(10.8, 9, fist) * sc)} ry={n2(1.12 * lerp(8.6, 9, fist) * sc)} transform={`rotate(${n2(ang)} ${n2(m[0])} ${n2(m[1])})`} />;
      };
      items.push({
        d: dLift - 0.03,
        kind: "prop",
        behind: false,
        node: (
          <Svg key="mitts" id="mitts" glow={0.35}>
            <defs>
              <clipPath id="mittClip">
                {mitt(an.mittenL, an.wristL, "l")}
                {mitt(an.mittenR, an.wristR, "r")}
              </clipPath>
            </defs>
            <g clipPath="url(#mittClip)">
              <RobotAt W={W} p={LIFTER.p} pose={lifter} uid="lifterMitts" variant={LIFTER.variant} size={LIFTER.size} />
            </g>
          </Svg>
        ),
      });
    }
  }
  // the padlock again, clipped to its outline, at its own depth: the tugger's grip side is behind it from the right
  if (W.pos[0] > 0.5) {
    const hl = lockHull(W, shake, tug);
    items.push({
      d: W.depth(lockPoint(LK.cx, LK.cy, LK.t, shake, tug)),
      kind: "prop",
      behind: false,
      node: (
        <div key="lockAgain" style={{ position: "absolute", inset: 0, clipPath: `polygon(${hl.map((q) => `${n2(q[0])}px ${n2(q[1])}px`).join(",")})` }}>
          <TaskBlock W={W} c={BLOCK_C} uid="task2" shake={shake} tug={tug} />
        </div>
      ),
    });
  }
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

  // the light's spill on the floor out of the opening
  const spillP: V3 = [SIDE_X + 0.55, 0, HOLE_ZC];
  const spillC = W.project(spillP);
  const spillK = W.scaleAt(spillP);
  const robotsAt: V3[] = [...crowd.map((c) => c.p), tg.p, ...leaners.map((l) => l.p), LIFTER.p, HELPER.p];
  const shadows = (
    <>
      <FloorShadow W={W} pts={footPts(BLOCK_C, TASK.w, TASK.d)} uid="blkS" soft={0.35} reach={0.7} />
      {robotsAt.map((p, i) => (
        <FloorShadow key={i} W={W} pts={robotFoot(p, 0.2)} uid={`rS${i}`} soft={0.1} reach={0.18} />
      ))}
      {sideSeen && light > 0.01 ? (
        <Svg id="spill">
          <defs>
            <filter id="spillBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={n2(0.22 * spillK)} />
            </filter>
          </defs>
          <ellipse cx={n2(spillC[0])} cy={n2(spillC[1])} rx={n2(0.85 * spillK)} ry={n2(0.32 * spillK)} fill={ACCENT} opacity={0.42 * light} filter="url(#spillBlur)" />
        </Svg>
      ) : null}
      {W.pos[0] > SIDE_X ? <Screws W={W} /> : null}
    </>
  );
  return (
    <HfStage W={W} floor={{ pool: [0.6, 0, -0.6], poolR: 5, oz: 0.1 }} shadows={shadows}>
      {back}
      <TaskBlock W={W} c={BLOCK_C} uid="task" shake={shake} tug={tug} />
      {holeLayer}
      {front}
    </HfStage>
  );
};

export default CheatedAtTheTask;
