import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import { z } from "zod";

/**
 * FiveDaysReal — Brent Underwood, "five days in the mine" (Cerro Gordo).
 *
 * CHECK LINE: "He ropes down that shaft, steps off at a lamp-lit level, and
 * stays: five days go by down there."
 *
 * The DownTheShaft world and look (photoreal-leaning composite, NOT a house
 * style): the same cut-away under the hoist house, the same timbered shaft and
 * lamp-lit level stations, one camera move, one white readout. 1080x1920,
 * 24000/1001 fps, 178 frames (170 in the slot, 8 of trim handle).
 *
 * Words (interviewer), local frame of the onset:
 *   and then     f0-10
 *   you          f11
 *   rappel       f20
 *   down         f35
 *   this         f46
 *   shaft        f54   (ends f63)
 *   and          f70   <- he is down
 *   you have     f79-92    DAY 1 (f84)
 *   at times     f93-110   DAY 2 (f99)
 *   stayed       f111      DAY 3 (f114)
 *   down there   f123-132  DAY 4 (f128)
 *   for like     f133-141
 *   five         f142  <- DAY 5 lands
 *   days         f148
 *   straight     f156  (ends f166; the edit cuts away at f170)
 *
 * The move: we open inside the cut-away with the lip a quarter of the way down
 * the frame and a man on a rope just under the collar's timbers; he sits back
 * into his harness and lets the rope run (f8), and the camera goes with him,
 * 700 ft of rock and three levels' lamps streaking past the pool of his
 * headlamp. He brakes from f54, hangs at the 700 ft station at f70, swings to
 * the lamp side, plants a foot, lets go of the rope and steps in, while the
 * camera pushes right in on the camp (f66-f86). Then the lantern goes down to
 * an ember and comes back four times: each time the readout is a day further
 * and he is doing something else in a camp that has grown, until DAY 5 finds
 * him sitting against a post by the lantern with a cup in his hand.
 *
 * World: plate x, world y (0 = the cut lip, 10 px = 1 ft; the 700 ft station's
 * floor is y 7000). The camera zooms about the screen point (540, 978): that is
 * where the station floor comes to rest (the room's middle is then at screen y
 * 800). "Camera y" below is the world y of the frame's TOP edge; speed is how
 * fast the rock crosses the screen.
 *
 *   frame   camera y   zoom   speed px/f   what
 *   f0       -205      2.60       2        the collar at screen y 435-475; he hangs 6 ft under its timbers
 *                                          (head y 600, feet y 765), about 145 px of him; the camera drifts
 *   f12      -183      2.60      40        he has let the rope run (f8); the blur is coming in
 *   f20       216      2.60     216        50 ft down
 *   f30      1302      2.60     408
 *   f54      5207      2.60     470        full speed (183 world px a frame); he rides at screen y 750; the brake goes on
 *   f62      6353      2.60     231        he sinks to y 870 as the camera stops ahead of him
 *   f70      6637      2.69       0        he hangs at the level; the push-in has begun (f66-f86)
 *   f86      6796      4.80       0        at rest on the camp: floor at screen y 978, the room 340-375 px high, he 300 px
 *   f142     6798      4.85       0        DAY 5; the creep in is 2 % from here to f178
 *   f170     6802      4.94       0        the cut
 *
 * At the camp the frame is plate x 315..540: the lantern, the man and his kit
 * across the width, the hanging rope at the right edge.
 *
 * The rappel's rhythm: three checks (f25, f37, f48), each takes a quarter to a
 * third off his speed for a few frames. The camera follows a smoothed copy of
 * his path, so at each check he rides up about 40 px in the frame and settles
 * back, his legs give, and he swings a few px on the rope throughout.
 *
 * Light on the way down: his headlamp throws a cool pool on the timbering, both
 * walls and the far wall, some 250 px above and below him (the same window
 * again, with the timbers re-drawn and lit, seen through a mask that goes with
 * him). In it about one wall timber in four is pale new wood, the bearers are
 * light or dark at random and the lagging changes tone board by board: under
 * the blur those are the dashes that go past him. Our own lamp on the rock is
 * a third up and wider for the fall (f12-f68), the rope is bright for a long
 * way above him, and he carries a thin cool edge all round plus a brighter one
 * from above. The three levels he passes have their lamp's light taken off the
 * rock (baked); each lamp is drawn as one narrow streak: a bright core in a
 * short warm halo.
 *
 * Motion blur: vertical, on the world only (he is camera-locked and sharp, the
 * rope is a vertical line). It follows the speed gradually and is eased over
 * two frames either side, so it comes in over f10-f15 and goes over f63-f69.
 * The timber sets are 156 px apart on screen, evenly: at speed the rock's blur
 * is at least 54 px wide (sigma), so they cannot strobe against the frame
 * rate. The lit timbering in his pool gets 0.42 of it, so its (irregular)
 * lights stay dashes; the lamps' streaks get 0.55.
 *
 * The days: DAY 1 is there at f84, DAY 2 f99, DAY 3 f114, DAY 4 f128, DAY 5
 * f142. A night is nine frames: the lantern goes down over the four frames
 * before the day lands, to 12 % (an ember), and comes back over the next five,
 * eased; that leaves five or six fully lit frames a day. The number ticks over
 * on the frame the day lands, whole and at full strength on every frame; man
 * and camp change across that frame, at the bottom of the dip, and so that
 * nothing gives the change away his headlamp, its spot on the wall and the
 * stove's flame go down with the lantern.
 *   DAY 1  just arrived: standing by the shaft with his pack on, looking down the drift
 *   DAY 2  crouched at a block of the rock face, the hammer coming down twice; pack against the post, a coil of rope
 *   DAY 3  along the drift, a hand up on the rock, his headlamp's cool light on the wall; a bucket, the bedroll still rolled
 *   DAY 4  on one knee at a small stove, stirring a pot, a little steam; the bedroll laid out
 *   DAY 5  sitting against the timber post by the lantern, knees up, a cup in his hand; bedroll and pack beside him
 *
 * The hold (f142-f178): he raises the cup, drinks and lowers it once (f151 to
 * f169), his head turns a little, steam drifts off the cup and the pot, the
 * lantern flutters and gutters three times (about +-12 %), dust drifts in its
 * light, the rope sways, and the camera creeps in 2 %.
 *
 * The step off the rope (f69-f81): the rope lowers him the last half foot as
 * he swings to the lamp side; the near foot reaches down and is PLANTED at
 * f74.5; he lets go (f75) as the body comes over that foot; the other foot
 * swings through and is planted ahead of it at f78.5; he straightens up.
 * Neither foot moves once it is down. The rope, let go at the shaft's wall, is
 * one straight line that swings back to plumb over about fifteen frames, a
 * little past, and keeps a slight sway to the end.
 *
 * Layers, back to front:
 *   1. the WORLD, one window with the move's motion blur: the 1x plate; over it
 *      the plates baked at the scale they are seen at (scripts/bake-five-days-
 *      real.py): the collar at 2.6x (with the ground carried on up the frame),
 *      the three levels he passes with their lamps off, the 700 ft station at
 *      5x with its lamp separable (a low-lamp plate, and a lamp plate shown at
 *      the lamp's level). The close plates cross-fade in and out while the
 *      fall's blur hides it. The hoist cable of DownTheShaft is painted out:
 *      there is one rope in this cut.
 *   2. the shaft's timbering lit by his headlamp (baked at 2x and 2.6x), the
 *      same window again, seen only through the pool that travels with him
 *   3. the rope, the camp and the man: live silhouettes with a rim of light on
 *      the side it comes from, soft shadows on floor and wall; the steam
 *   4. darkness below ground, cut open by the pool of our own lamp
 *   5. the lamps' light and the dust, world space, streaked by the move
 *   6. fine grain, new every frame
 *   7. the readout "DAY n" in DownTheShaft's type, over a hairline that ends at
 *      the shaft wall just above the station's roof. No depth, no title.
 */

export const FPS = 24000 / 1001;
export const DURATION = 178;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const { fontFamily } = loadFont("normal", { weights: ["500", "600"], subsets: ["latin"] });

// ---- frame and world ----
const W = 1080;
const H = 1920;
const PLATE_W = 1400;
const PLATE_H = 10132;
const PLATE_Y0 = 28;
const CAP_Y0 = -208;
const CAP_H = 328;
const SHAFT_X = 530;
const XL = 493; // the shaft's left wall
const FLOOR = 7000; // the 700 ft station
const ROOF_AT_SHAFT = 6921; // its roof where the shaft comes in
const LAMP_X = 459; // its lamp
const LAMP_Y = 6939;
const CAMP_R = 130; // the camp lamp's reach, as baked
// boxes of the baked plates: plate x, world y, width, height (world px)
const COLLAR = { x: 300, y: -320, w: 460, h: 1520 };
const LIT = { x: 475, w: 110 };
const SHAFT_LIT_Y = { y: 28, h: 7272 };
const PATCH = { x: 516, y: 28, w: 20, h: 7872 };
const STATION = { x: 300, y: 6560, w: 440, h: 820 };
const STATION_ON = { x: 300, y: 6700, w: 440, h: 600 };
const STATION_FLAT = { x: 300, y: 6890, w: 120, h: 130 };
// the levels he passes: the baked plate with the lamp's light taken off the rock (its box), and the lamp (plate x, world y)
const PASSED = [
  { src: staticFile("cerro/shaft/fd_level_200.jpg"), box: { x: 203, y: 1874, w: 784, h: 150 }, lamp: [601, 1937] },
  { src: staticFile("cerro/shaft/fd_level_400.jpg"), box: { x: 53, y: 3872, w: 794, h: 152 }, lamp: [459, 3936] },
  { src: staticFile("cerro/shaft/fd_level_550.jpg"), box: { x: 223, y: 5376, w: 804, h: 148 }, lamp: [601, 5440] },
];

// ---- camera ----
const AX = 540; // the screen point the camera zooms about
const AY = 978;
const Z0 = 2.6; // on the rope
const Z1 = 4.8; // at the camp
const CAM_TOP0 = -196; // world y of the frame's top edge once the opening drift is over
const DRIFT = 12; // world px the camera drifts down before the fall takes over (it is never quite still at the top)
const HIP0 = 68; // world y of his hip at the start: on the rope, 6 ft under the collar's timbers
const HIP1 = 6962; // and hanging at the station
const DROP = HIP1 - HIP0;
const CATCH = 24.5; // world px by which the camera lets him get ahead (he then rides at screen y 750)
const EXTRA = CAM_TOP0 + DROP - CATCH + AY / Z0 - FLOOR; // the camera brakes this much ahead of him, so the floor comes to rest at AY
const CAMP_X = 427.5; // plate x that comes to rest at screen x 540: the camp across the width, the hanging rope at the right edge
const ROPE_X = 528;

// ---- timing ----
const F_GO = 8;
const F_ARRIVE = 70;
const F_PUSH0 = 66;
const F_PUSH1 = 86;
const F_RELEASE = 75;
const DAY_AT = [84, 99, 114, 128, 142];
const EMBER = 0.12; // the lantern at its lowest: an ember, never out
const CHECKS = [
  { f: 25, d: 0.3, w: 4 },
  { f: 37, d: 0.27, w: 4 },
  { f: 48, d: 0.3, w: 4 },
];

type V = [number, number];
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const smoother = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const bump = (u: number) => (Math.abs(u) < 1 ? 0.5 * (1 + Math.cos(Math.PI * u)) : 0);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** A smooth curve through (frame, value) keys (Catmull-Rom; flat before the first and after the last). */
const spline = (keys: V[], f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  const n = keys.length - 1;
  if (f >= keys[n][0]) return keys[n][1];
  let i = 0;
  while (f > keys[i + 1][0]) i++;
  const [f0, v0] = keys[i];
  const [f1, v1] = keys[i + 1];
  const m0 = i > 0 ? (v1 - keys[i - 1][1]) / (f1 - keys[i - 1][0]) : 0;
  const m1 = i < n - 1 ? (keys[i + 2][1] - v0) / (keys[i + 2][0] - f0) : 0;
  const d = f1 - f0;
  const t = (f - f0) / d;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * v0 + (t3 - 2 * t2 + t) * d * m0 + (-2 * t3 + 3 * t2) * v1 + (t3 - t2) * d * m1;
};

// ---- his descent: speed -> position, tabulated once ----
const STEP = 0.125;
const T_MIN = -16;
const N_T = Math.round((DURATION + 32) / STEP) + 1;
const checkAt = (f: number, late = 0) => CHECKS.reduce((s, c) => s + c.d * bump((f - c.f - late) / c.w), 0);
const speedShape = (f: number) => Math.pow(smooth(F_GO, 38, f), 0.75) * (1 - smooth(54, F_ARRIVE, f)) * (1 - checkAt(f));
const [HIP_T, FOLLOW_T] = (() => {
  const raw = new Array<number>(N_T).fill(0);
  for (let i = 1; i < N_T; i++) {
    const f = T_MIN + i * STEP;
    raw[i] = raw[i - 1] + 0.5 * (speedShape(f - STEP) + speedShape(f)) * STEP;
  }
  const k = DROP / raw[N_T - 1];
  const hip = raw.map((v) => HIP0 + v * k);
  // what the camera follows: his path with the checks smoothed out (a Gaussian, 1.3 frames); from the braking on, him exactly
  const SIG = 1.3 / STEP;
  const R = Math.round(3 * SIG);
  const ker = Array.from({ length: 2 * R + 1 }, (_, i) => Math.exp(-0.5 * ((i - R) / SIG) ** 2));
  const ks = ker.reduce((a, b) => a + b, 0);
  const follow = hip.map((_, i) => {
    let s = 0;
    for (let j = -R; j <= R; j++) s += ker[j + R] * hip[Math.min(N_T - 1, Math.max(0, i + j))];
    return lerp(s / ks, hip[i], smooth(52, 60, T_MIN + i * STEP));
  });
  return [hip, follow];
})();
const tab = (t: number[], f: number) => {
  const u = Math.min(N_T - 1.001, Math.max(0, (f - T_MIN) / STEP));
  const i = Math.floor(u);
  return t[i] + (t[i + 1] - t[i]) * (u - i);
};
export const hipDrop = (f: number) => tab(HIP_T, f);

// ---- the camera ----
const lag = (d: number) => d - CATCH * (1 - Math.exp(-d / CATCH)) - EXTRA * smooth(DROP - 1500, DROP, d);
/** World y that lies under screen y AY. */
export const anchorY = (f: number) => CAM_TOP0 - DRIFT * Math.exp(-Math.max(0, f + 4) / 15) + lag(tab(FOLLOW_T, f) - HIP0) + AY / Z0;
const anchorX = (f: number) => lerp(SHAFT_X, CAMP_X, smoother(F_PUSH0 + 1, F_PUSH1, f));
/** The slow creep in: about 1 % over the days, then 2 % more over the hold from DAY 5 to the last frame. */
const creep = (f: number) => {
  const a = Math.max(0, f - 82);
  const b = Math.max(0, f - 136);
  return (0.01 * ((a * a) / (a + 10))) / 56 + (0.02 * ((b * b) / (b + 8))) / 36;
};
export const zoom = (f: number) => Z0 * Math.pow(Z1 / Z0, smoother(F_PUSH0, F_PUSH1, f)) * (1 + creep(f));

// ---- motion blur ----
const BLUR_PAD = 420;
const GLOW_PAD = 420;
const blurOf = (speed: number) => {
  // it comes in gradually with the speed; by ~85 px a frame it is wide enough to carry the evenly spaced timber sets
  // (156 px apart on screen) across the frame rate
  const fast = Math.sqrt(54 * 54 + 0.28 * speed * (0.28 * speed));
  return lerp(0.035 * speed, fast, smooth(8, 112, speed));
};
const speedAt = (f: number) => Math.abs(anchorY(f + 0.5) - anchorY(f - 0.5)) * zoom(f);
/** The blur of a frame: eased over the two frames either side, so it neither snaps on at the start nor off at the end. */
const blurSigma = (f: number) => {
  const s = (blurOf(speedAt(f - 2)) + 2 * blurOf(speedAt(f - 1)) + 3 * blurOf(speedAt(f)) + 2 * blurOf(speedAt(f + 1)) + blurOf(speedAt(f + 2))) / 9;
  return s < 0.6 ? 0 : s;
};
/** 1 while he is on his way down: our own lamp is turned up on the rock so the bedding streaks carry. */
const liftAt = (f: number) => smooth(12, 24, f) * (1 - smooth(57, 68, f));

// ---- light ----
const GLOW =
  "radial-gradient(circle closest-side, rgba(255,226,170,0.95) 0%, rgba(255,190,110,0.55) 5%, rgba(255,160,80,0.26) 16%, rgba(255,140,60,0.10) 40%, rgba(255,130,50,0.03) 70%, rgba(255,130,50,0) 100%)";
const DARK = "5,8,12";
/** The lamp's brightness, frame by frame: two slow swings and an irregular flutter, about +-9 % (DownTheShaft's). */
const flicker = (f: number) => {
  const t = f / FPS;
  const n0 = random(`flick-${Math.floor(f)}`) - 0.5;
  const n1 = random(`flick-${Math.floor(f) - 1}`) - 0.5;
  return 1 + 0.045 * Math.sin(2 * Math.PI * 1.7 * t + 0.7) + 0.03 * Math.sin(2 * Math.PI * 4.1 * t + 2.1) + 0.07 * (0.65 * n0 + 0.35 * n1);
};
/** In the hold the flame is less steady: a wider flutter and three irregular gutters, about +-12 %. */
const holdFlicker = (f: number) => 1 + 1.35 * (flicker(f) - 1) - 0.1 * (bump((f - 152.5) / 2.2) + 0.7 * bump((f - 164) / 1.8) + bump((f - 173.5) / 2.4));
/** 1 = the lantern is up, EMBER = turned right down. Four nights: four frames down to the frame the day lands on,
 *  five frames back up, eased. It never goes out. */
const nightLevel = (f: number) => {
  let dip = 0;
  for (let i = 1; i < DAY_AT.length; i++) {
    const T = DAY_AT[i];
    dip = Math.max(dip, f <= T ? smoother(T - 4.2, T - 0.2, f) : 1 - smoother(T + 0.2, T + 5.2, f));
  }
  return 1 - (1 - EMBER) * dip;
};
/** How much of day n's man and camp is there: each takes over from the one before across the frame its day lands on. */
const dayIn = (n: number, f: number) => (n <= 1 ? 1 : smooth(DAY_AT[n - 1] - 0.7, DAY_AT[n - 1] + 0.9, f));
const dayOut = (n: number, f: number) => (n >= 5 ? 1 : 1 - smooth(DAY_AT[n] - 0.9, DAY_AT[n] + 0.7, f));
const lampFall = (x: number, y: number) => Math.min(1, 1.2 / (1 + ((x - LAMP_X) ** 2 + (1.15 * (y - LAMP_Y)) ** 2) / (CAMP_R * CAMP_R)));

// the station's floor, read off the bake (plate x 150, 160 .. 500)
const FLOOR_T = [
  6999.2, 7000.5, 7002.2, 7002.3, 7003.1, 7003.3, 7006.5, 7005.8, 7006.7, 7005.4, 7002.3, 7004.6, 7002.0, 6999.6, 7000.4, 6999.6, 7000.0, 6999.1, 6999.2, 6999.9, 6998.8,
  6998.5, 7001.5, 7001.1, 7001.7, 7001.5, 7002.1, 7002.0, 7001.5, 7000.9, 7000.0, 7000.1, 7000.0, 7000.0, 7000.0, 7000.0,
];
const floorAt = (x: number) => {
  const u = Math.min(FLOOR_T.length - 1.001, Math.max(0, (x - 150) / 10));
  const i = Math.floor(u);
  return FLOOR_T[i] + (FLOOR_T[i + 1] - FLOOR_T[i]) * (u - i);
};

// ---- the man: a jointed silhouette, 65 px standing (6 ft and a hard hat at 10 px = 1 ft) ----
const RIG = { torso: 20, neck: 8.4, ua: 11, fa: 10, th: 15, sh: 15, foot: 6.2 };
const DEVICE: V = [9.2, -5.5]; // the descender, in front of his belly (local: +x forward, +y down)
type Hold = { p: V; k: number } | null; // a world point a hand or an ankle is held to, and how firmly (0..1)
type Pose = {
  x: number; // hip, world
  y: number;
  face: number; // -1 looks left
  rot: number; // the whole body about the hip, degrees clockwise
  torso: number; // lean forward from upright
  head: number; // nod, relative to the torso
  ua1: number; // near arm: upper arm and forearm, from straight down, + forward
  fa1: number;
  ua2: number;
  fa2: number;
  th1: number; // near leg: thigh and shin from straight down, + forward; foot from level, + toes down
  sh1: number;
  ft1: number;
  th2: number;
  sh2: number;
  ft2: number;
  pack: number; // on his back
  helmet: number;
  plant1?: Hold; // a foot planted on the floor does not move when the body does
  plant2?: Hold;
};
type Prim =
  | { k: "l"; a: V; b: V; w: number }
  | { k: "t"; a: V; b: V; ra: number; rb: number }
  | { k: "c"; c: V; r: number }
  | { k: "e"; c: V; rx: number; ry: number; rot: number }
  | { k: "p"; d: string; sw?: number };

const D2R = Math.PI / 180;
const dirDown = (a: number): V => [Math.sin(a * D2R), Math.cos(a * D2R)];
const dirUp = (a: number): V => [Math.sin(a * D2R), -Math.cos(a * D2R)];
const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k];
const mix = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** Two-bone reach from s to t; the joint goes to the +perpendicular side (side = 1) or the other. Returns [joint, end]. */
const reach = (s: V, t: V, l1: number, l2: number, side = 1): [V, V] => {
  let dx = t[0] - s[0];
  let dy = t[1] - s[1];
  let d = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.02;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
  }
  const dd = Math.max(d, Math.abs(l1 - l2) + 0.02);
  const a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a)) * side;
  const ux = dx / d;
  const uy = dy / d;
  return [
    [s[0] + ux * a - uy * h, s[1] + uy * a + ux * h],
    [s[0] + dx, s[1] + dy],
  ];
};

const buildMan = (p: Pose, grip1: Hold = null, grip2: Hold = null) => {
  const cr = Math.cos(p.rot * D2R);
  const sr = Math.sin(p.rot * D2R);
  const tf = (l: V): V => [p.x + l[0] * p.face * cr - l[1] * sr, p.y + l[0] * p.face * sr + l[1] * cr];
  const inv = (w: V): V => {
    const dx = w[0] - p.x;
    const dy = w[1] - p.y;
    return [(dx * cr + dy * sr) * p.face, -dx * sr + dy * cr];
  };
  const up = dirUp(p.torso);
  const back: V = [-Math.cos(p.torso * D2R), -Math.sin(p.torso * D2R)];
  const hipC: V = [up[0] * 1.5, up[1] * 1.5];
  const shoulder: V = [up[0] * RIG.torso, up[1] * RIG.torso];
  const armRoot: V = [up[0] * (RIG.torso - 1.6), up[1] * (RIG.torso - 1.6)];
  const hu = dirUp(p.torso + p.head);
  const hf: V = [Math.cos((p.torso + p.head) * D2R), Math.sin((p.torso + p.head) * D2R)];
  const headC = add(shoulder, hu, RIG.neck);
  const arm = (ua: number, fa: number, g: Hold): [V, V] => {
    const e = add(armRoot, dirDown(ua), RIG.ua);
    const h = add(e, dirDown(fa), RIG.fa);
    if (!g || g.k <= 0) return [e, h];
    const [e2, h2] = reach(armRoot, mix(h, inv(g.p), g.k), RIG.ua, RIG.fa);
    return [mix(e, e2, Math.min(1, g.k * 1.5)), h2];
  };
  const leg = (th: number, sh: number, ft: number, plant?: Hold): [V, V, V] => {
    let k = add([0, 0], dirDown(th), RIG.th);
    let a = add(k, dirDown(sh), RIG.sh);
    let fa = ft;
    if (plant && plant.k > 0) {
      // the ankle goes to (and then stays on) its spot on the floor; the knee stays in front
      [k, a] = reach([0, 0], mix(a, inv(plant.p), plant.k), RIG.th, RIG.sh, -1);
      fa = lerp(ft, 0, plant.k);
    }
    return [k, a, add(a, [Math.cos(fa * D2R), Math.sin(fa * D2R)], RIG.foot)];
  };
  const [e1, h1] = arm(p.ua1, p.fa1, grip1);
  const [e2, h2] = arm(p.ua2, p.fa2, grip2);
  const [k1, a1, t1] = leg(p.th1, p.sh1, p.ft1, p.plant1);
  const [k2, a2, t2] = leg(p.th2, p.sh2, p.ft2, p.plant2);
  const L = (a: V, b: V, w: number): Prim => ({ k: "l", a: tf(a), b: tf(b), w });
  const T = (a: V, b: V, ra: number, rb: number): Prim => ({ k: "t", a: tf(a), b: tf(b), ra, rb });
  const prims: Prim[] = [];
  // far side first (one colour, so the order only matters for the eye of whoever edits this)
  prims.push(T([0, 0], k2, 2.9, 2.15), T(k2, a2, 2.2, 1.6), L(a2, t2, 3.1), { k: "c", c: tf(a2), r: 2.2 });
  prims.push(T(armRoot, e2, 1.9, 1.55), T(e2, h2, 1.5, 1.2), { k: "c", c: tf(h2), r: 1.6 });
  if (p.pack > 0.01) {
    const pa = add(add([0, 0], up, 5.2), back, 8.0);
    const pb = add(add([0, 0], up, 5.2 + 13 * p.pack), back, 8.0);
    prims.push(T(pa, pb, 4.5, 4.0), L(add(pb, up, 1.5), add(shoulder, back, 2), 2.6));
  }
  prims.push(T(hipC, shoulder, 4.9, 5.4));
  prims.push(T([0, 0], k1, 3.0, 2.2), T(k1, a1, 2.25, 1.65), L(a1, t1, 3.1), { k: "c", c: tf(a1), r: 2.2 });
  prims.push(L(shoulder, headC, 3.4), { k: "e", c: tf(headC), rx: 3.7, ry: 4.3, rot: (p.torso + p.head) * p.face + p.rot });
  if (p.helmet > 0.5) {
    const hc = add(headC, hu, 2.3);
    prims.push({ k: "e", c: tf(hc), rx: 5.0, ry: 3.5, rot: (p.torso + p.head) * p.face + p.rot });
    prims.push(L(add(add(headC, hu, 1.2), hf, 2.6), add(add(headC, hu, 0.8), hf, 7.0), 1.5));
  }
  prims.push(T(armRoot, e1, 2.0, 1.6), T(e1, h1, 1.55, 1.25), { k: "c", c: tf(h1), r: 1.7 });
  const lampPt = tf(add(add(headC, hu, 2.0), hf, 5.3));
  const low = Math.max(tf(a1)[1], tf(a2)[1], tf(t1)[1], tf(t2)[1]) + 2.5;
  return { prims, hand1: tf(h1), hand2: tf(h2), head: tf(headC), lampPt, device: tf(DEVICE), brake: tf([DEVICE[0] - 1.2, DEVICE[1] + 5.5]), low };
};
type Man = ReturnType<typeof buildMan>;

const POSE_KEYS = ["x", "y", "rot", "torso", "head", "ua1", "fa1", "ua2", "fa2", "th1", "sh1", "ft1", "th2", "sh2", "ft2", "pack"] as const;
const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const o = { ...a };
  for (const k of POSE_KEYS) o[k] = lerp(a[k], b[k], t);
  return o;
};
const base: Pose = { x: 0, y: 0, face: -1, rot: 0, torso: 0, head: 0, ua1: 0, fa1: 0, ua2: 0, fa2: 0, th1: 0, sh1: 0, ft1: 0, th2: 0, sh2: 0, ft2: 0, pack: 1, helmet: 1 };
// on the rope with his legs still under him, the moment before he lets it run
const READY: Pose = { ...base, torso: -3, head: 14, ua1: 55, fa1: 150, ua2: 20, fa2: 60, th1: 34, sh1: 16, ft1: 14, th2: 16, sh2: 2, ft2: 20 };
// sitting in the harness, hands on the rope (the arms are taken by the grips)
const RAPPEL: Pose = { ...base, torso: -16, head: 30, ua1: 55, fa1: 150, ua2: 20, fa2: 60, th1: 88, sh1: 4, ft1: 6, th2: 66, sh2: 22, ft2: 16 };
const STAND: Pose = { ...base, torso: 3, head: 6, ua1: 6, fa1: 14, ua2: -8, fa2: 4, th1: 5, sh1: -3, ft1: 0, th2: -6, sh2: -9, ft2: 0 };
/** Stand a pose on the floor at plate x (or sit / lie it: clear is the px between hip and floor). */
const onFloor = (p: Pose, x: number, clear?: number): Pose => {
  const q = { ...p, x, y: 0 };
  const fy = floorAt(x);
  return { ...q, y: clear === undefined ? fy - buildMan(q).low : fy - clear };
};

// ---- the step off the rope. He swings to the lamp side as the rope lowers him the last half foot, reaches down with
// the near foot and PLANTS it (f74.5); the body comes over that foot while he lets go of the rope; the other foot
// swings through and is planted ahead of it (f78.5); he straightens up. Neither foot moves once it is down. ----
const HANG_X = ROPE_X + DEVICE[0];
const FOOT1: V = [492.5, FLOOR - 2.5];
const FOOT2: V = [481.5, FLOOR - 2.5];
const F_STEP = F_ARRIVE - 1; // the step-off's clock starts here
const HIP_X: V[] = [
  [F_STEP, HANG_X],
  [F_STEP + 2, 533],
  [F_STEP + 4, 519],
  [F_STEP + 5.5, 504],
  [F_STEP + 7.5, 495],
  [F_STEP + 9.5, 488.5],
  [F_STEP + 12, 486],
  [F_STEP + 15, 486],
];
const HIP_Y: V[] = [
  [F_STEP, hipDrop(F_STEP)],
  [F_STEP + 3, 6965.5],
  [F_STEP + 5.5, 6970.3],
  [F_STEP + 7.5, 6968.6],
  [F_STEP + 9.5, 6969.0],
  [F_STEP + 12, 6968.6],
  [F_STEP + 15, 6968.6],
];
const STEP_POSES: { f: number; p: Pose }[] = [
  { f: F_STEP, p: RAPPEL },
  { f: F_STEP + 4, p: { ...RAPPEL, torso: -2, head: 20, th1: 40, sh1: 22, ft1: 16, th2: 30, sh2: -6, ft2: 22 } },
  { f: F_STEP + 6.5, p: { ...RAPPEL, torso: 9, head: 8, ua1: 40, fa1: 80, ua2: 6, fa2: 30, th1: 22, sh1: 2, ft1: 0, th2: -8, sh2: -44, ft2: 44 } },
  { f: F_STEP + 9, p: { ...STAND, torso: 7, head: 4, ua1: 22, fa1: 44, ua2: -14, fa2: 2, th2: 30, sh2: -20, ft2: 10 } },
  { f: F_STEP + 12.5, p: STAND },
];
const manArrive = (f: number) => {
  let i = 0;
  while (i < STEP_POSES.length - 2 && f > STEP_POSES[i + 1].f) i++;
  const a = STEP_POSES[i];
  const b = STEP_POSES[i + 1];
  const p = mixPose(a.p, b.p, smooth(a.f, b.f, f));
  const k2 = smooth(F_STEP + 6.3, F_STEP + 9.5, f);
  return {
    p: {
      ...p,
      x: spline(HIP_X, f),
      y: spline(HIP_Y, f),
      plant1: { p: FOOT1, k: smooth(F_STEP + 2.2, F_STEP + 5.5, f) },
      plant2: { p: [FOOT2[0], FOOT2[1] - 3.2 * Math.sin(Math.PI * k2)] as V, k: k2 },
    },
    g1: 1 - smooth(F_STEP + 5.2, F_STEP + 6.8, f),
    g2: 1 - smooth(F_STEP + 4.5, F_STEP + 6.2, f),
  };
};

// the days (2..5: the pose is a function of the frames since its day landed, so each is doing something)
const SIT_X = 418; // DAY 5: he sits with his back against the timber post at plate x 410
const dayPose = (n: number, f: number): Pose => {
  const t = f - DAY_AT[n - 1];
  if (n === 2) {
    // crouched at a block of the rock face, the hammer coming down twice while the lantern is up
    const sw = 0.5 - 0.5 * Math.cos(4 * Math.PI * clamp01((t - 2.5) / 9));
    return onFloor({ ...base, pack: 0, torso: 30, head: -8, ua1: lerp(120, 72, sw), fa1: lerp(178, 116, sw), ua2: 60, fa2: 86, th1: 108, sh1: -24, ft1: 0, th2: 42, sh2: -96, ft2: 172 }, 358);
  }
  if (n === 3) {
    // along the drift, a hand up on the rock, looking where his headlamp lies on the wall
    return onFloor({ ...base, pack: 0, torso: 6, head: -15 + 3 * Math.sin(t * 0.45), ua1: 124 + 2 * Math.sin(t * 0.45), fa1: 156 + 5 * Math.sin(t * 0.45), ua2: 2, fa2: 10, th1: 8, sh1: -2, ft1: 0, th2: -10, sh2: -15, ft2: 0 }, 379);
  }
  if (n === 4) {
    // on one knee at the stove, stirring the pot
    const stir = Math.sin(t * 0.8);
    return onFloor({ ...base, face: 1, pack: 0, torso: 22, head: 14, ua1: 46 + 3 * stir, fa1: 84 + 9 * stir, ua2: 28, fa2: 62, th1: 92, sh1: 6, ft1: 0, th2: 12, sh2: -84, ft2: 172 }, 424, 16.9);
  }
  // sitting against the post by the lantern, knees up, a cup in his hand: he raises it, drinks, and lowers it once
  // in the hold (f151-f169), and looks about a little
  const up = smooth(9, 15.5, t) * (1 - smooth(20.5, 27, t));
  const look = Math.sin((2 * Math.PI * (t + 4)) / 52);
  return onFloor(
    { ...base, face: 1, pack: 0, torso: -9, head: 9 - 15 * up + 7 * look * (1 - up), ua1: lerp(58, 95, up), fa1: lerp(104, 212, up), ua2: 42, fa2: 96 + 2 * look, th1: 128, sh1: 38, ft1: 3, th2: 120, sh2: 47, ft2: 3 },
    SIT_X,
    5.2,
  );
};
/** How far the cup is up at his mouth on DAY 5 (0 on his knee, 1 drinking). */
const cupUp = (f: number) => smooth(9, 15.5, f - DAY_AT[4]) * (1 - smooth(20.5, 27, f - DAY_AT[4]));

// ---- the camp's things (world px), each a dark shape with a rim of lamp light. The camp fills in day by day. ----
type Thing = { id: string; from: number; to: number; x: number; tone: string; prims: (fy: number) => Prim[] };
const STOVE_X = 443;
const THINGS: Thing[] = [
  // the block he works at
  { id: "block", from: 2, to: 5, x: 334, tone: "17,16,15", prims: (fy) => [{ k: "p", d: `M 323 ${fy + 0.5} L 324.5 ${fy - 6.5} L 329 ${fy - 10} L 337 ${fy - 9} L 341.5 ${fy - 4.6} L 342.5 ${fy + 0.5} Z` }, { k: "p", d: `M 344 ${fy + 0.5} L 345.2 ${fy - 3.2} L 349 ${fy - 2.8} L 350 ${fy + 0.5} Z` }] },
  { id: "coil", from: 2, to: 5, x: 481, tone: "26,23,19", prims: (fy) => [
    { k: "e", c: [481, fy - 1.5], rx: 6.0, ry: 1.7, rot: 0 },
    { k: "e", c: [481.3, fy - 3.3], rx: 5.0, ry: 1.5, rot: 0 },
    { k: "p", d: `M 475.4 ${fy - 1.2} C 472.5 ${fy - 0.6}, 471.5 ${fy - 0.2}, 469.6 ${fy - 0.4}`, sw: 1.0 },
  ] },
  // his pack, against the post
  { id: "pack", from: 2, to: 5, x: 403, tone: "13,13,13", prims: (fy) => [
    { k: "p", d: `M 397.4 ${fy + 0.3} L 398.2 ${fy - 9} C 398.4 ${fy - 15}, 407.6 ${fy - 15.6}, 408.4 ${fy - 9.4} L 409.6 ${fy + 0.3} Z` },
    { k: "e", c: [397.2, fy - 4.0], rx: 2.0, ry: 3.1, rot: 0 },
    { k: "p", d: `M 400.2 ${fy - 14.2} C 401 ${fy - 17.6}, 405.6 ${fy - 17.6}, 406.2 ${fy - 14.4}`, sw: 0.9 },
  ] },
  { id: "bucket", from: 3, to: 5, x: 470, tone: "19,21,23", prims: (fy) => [
    { k: "p", d: `M 466.3 ${fy + 0.3} L 465.3 ${fy - 9} L 474.7 ${fy - 9} L 473.7 ${fy + 0.3} Z` },
    { k: "p", d: `M 465.6 ${fy - 8.6} C 466 ${fy - 14.5}, 474 ${fy - 14.5}, 474.4 ${fy - 8.6}`, sw: 0.8 },
  ] },
  // the bedroll: still rolled on day 3, laid out from day 4
  { id: "roll", from: 3, to: 3, x: 392, tone: "22,21,17", prims: (fy) => [{ k: "l", a: [389.6, fy - 3.7], b: [394.4, fy - 3.7], w: 7.4 }, { k: "l", a: [390.2, fy - 7.6], b: [390.2, fy], w: 0.9 }, { k: "l", a: [393.8, fy - 7.6], b: [393.8, fy], w: 0.9 }] },
  { id: "bed", from: 4, to: 5, x: 372, tone: "24,23,18", prims: (fy) => [{ k: "l", a: [352, fy - 1.4], b: [391, fy - 1.4], w: 3.0 }, { k: "p", d: `M 386 ${fy - 2.8} C 388 ${fy - 5.4}, 392 ${fy - 5.2}, 392.6 ${fy - 2.6} Z` }, { k: "l", a: [352.5, fy - 2.8], b: [358, fy - 3.1], w: 2.2 }] },
  // the stove: a gas canister, a burner, a pot with its lid
  { id: "stove", from: 4, to: 5, x: STOVE_X, tone: "20,20,22", prims: (fy) => [
    { k: "p", d: `M ${STOVE_X - 2.9} ${fy + 0.3} L ${STOVE_X - 2.9} ${fy - 2.6} C ${STOVE_X - 2.9} ${fy - 4}, ${STOVE_X + 2.9} ${fy - 4}, ${STOVE_X + 2.9} ${fy - 2.6} L ${STOVE_X + 2.9} ${fy + 0.3} Z` },
    { k: "l", a: [STOVE_X - 2.6, fy - 5.0], b: [STOVE_X + 2.6, fy - 5.0], w: 0.9 },
    { k: "l", a: [STOVE_X, fy - 5.0], b: [STOVE_X, fy - 3.6], w: 1.0 },
    { k: "p", d: `M ${STOVE_X - 5.0} ${fy - 6.2} L ${STOVE_X - 5.3} ${fy - 12.6} L ${STOVE_X + 5.3} ${fy - 12.6} L ${STOVE_X + 5.0} ${fy - 6.2} Z` },
    { k: "l", a: [STOVE_X - 5.9, fy - 13.0], b: [STOVE_X + 5.9, fy - 13.0], w: 1.1 },
    { k: "c", c: [STOVE_X, fy - 14.2], r: 0.9 },
    { k: "l", a: [STOVE_X + 5.2, fy - 10.6], b: [STOVE_X + 9.6, fy - 11.5], w: 1.0 },
  ] },
];
// day 3: where his headlamp lies on the wall
const SPOT = { x: 351, y: 6953, rx: 36, ry: 30 };

// ---- readout (DownTheShaft's) ----
const READ_LINE_Y = 566;
const DIGIT_W = 78;
const DIGIT_H = 172;
const WHITE = "rgba(255,255,255,0.92)";
const READ_RIGHT = 746; // right edge of the numeral, once the camera is at rest (108 px from the shaft wall)
const F_READ = 80.3; // it is there by f84, when he has straightened up

// ---- life in the hold ----
const DUST_W = 110;
const DUST_H = 22;
const DUST = Array.from({ length: 26 }, (_, i) => ({
  x: random(`fd-dust-x-${i}`) * DUST_W,
  y: random(`fd-dust-y-${i}`) * DUST_H,
  vx: (random(`fd-dust-vx-${i}`) - 0.5) * 0.6,
  vy: (random(`fd-dust-vy-${i}`) - 0.6) * 0.18,
  r: 0.5 + random(`fd-dust-r-${i}`) * 0.6,
  ph: random(`fd-dust-ph-${i}`) * Math.PI * 2,
}));

const PLATE = staticFile("cerro/shaft/underground_plate.jpg");
const CAP = staticFile("cerro/shaft/underground_cap.png");
const GRAIN = staticFile("cerro/shaft/grain_tile.png");
const FD_COLLAR = staticFile("cerro/shaft/fd_collar.jpg");
const FD_COLLAR_LIT = staticFile("cerro/shaft/fd_collar_lit.jpg");
const FD_SHAFT_LIT = staticFile("cerro/shaft/fd_shaft_lit.jpg");
const FD_PATCH = staticFile("cerro/shaft/fd_shaft_patch.png");
const FD_OFF = staticFile("cerro/shaft/fd_station_off.jpg");
const FD_ON = staticFile("cerro/shaft/fd_station_on.jpg");
const FD_FLAT = staticFile("cerro/shaft/fd_station_flat.jpg");
const GRAIN_W = 1216;
const GRAIN_H = 2048;

const box = (b: { x: number; y: number; w: number; h: number }, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  left: b.x,
  top: b.y,
  width: b.w,
  height: b.h,
  maxWidth: "none",
  ...extra,
});

const drawPrims = (ps: Prim[], key: string) =>
  ps.map((q, i) => {
    const k = `${key}-${i}`;
    if (q.k === "l") return <line key={k} x1={q.a[0]} y1={q.a[1]} x2={q.b[0]} y2={q.b[1]} strokeWidth={q.w} strokeLinecap="round" />;
    if (q.k === "t") {
      // a limb that tapers: two discs and the quad between them
      const dx = q.b[0] - q.a[0];
      const dy = q.b[1] - q.a[1];
      const n = Math.hypot(dx, dy) || 1;
      const nx = -dy / n;
      const ny = dx / n;
      return (
        <g key={k} stroke="none">
          <circle cx={q.a[0]} cy={q.a[1]} r={q.ra} />
          <circle cx={q.b[0]} cy={q.b[1]} r={q.rb} />
          <path d={`M ${q.a[0] + nx * q.ra} ${q.a[1] + ny * q.ra} L ${q.b[0] + nx * q.rb} ${q.b[1] + ny * q.rb} L ${q.b[0] - nx * q.rb} ${q.b[1] - ny * q.rb} L ${q.a[0] - nx * q.ra} ${q.a[1] - ny * q.ra} Z`} />
        </g>
      );
    }
    if (q.k === "c") return <circle key={k} cx={q.c[0]} cy={q.c[1]} r={q.r} stroke="none" />;
    if (q.k === "e") return <ellipse key={k} cx={q.c[0]} cy={q.c[1]} rx={q.rx} ry={q.ry} stroke="none" transform={`rotate(${q.rot} ${q.c[0]} ${q.c[1]})`} />;
    return q.sw ? <path key={k} d={q.d} fill="none" strokeWidth={q.sw} strokeLinecap="round" /> : <path key={k} d={q.d} stroke="none" />;
  });

/** A silhouette with light on the side it comes from (the bake's figure: the shape minus itself moved away from the
 *  lamp), twice: a tight hot edge and a broad soft wrap that gives the shape some roundness. `around` adds a thin
 *  edge of light all the way round: what a lit wall behind him does. */
const Sil: React.FC<{ id: string; tone: string; toward: V; rim: string; wrap: string; rimK: number; width?: number; around?: number; children: React.ReactNode }> = ({
  id,
  tone,
  toward,
  rim,
  wrap,
  rimK,
  width = 0.85,
  around = 0,
  children,
}) => {
  const n = Math.hypot(toward[0], toward[1]) || 1;
  const dx = -toward[0] / n;
  const dy = -toward[1] / n;
  return (
    <>
      <filter id={id} x="-60%" y="-120%" width="220%" height="340%" colorInterpolationFilters="sRGB">
        <feOffset in="SourceAlpha" dx={dx * width * 2.6} dy={dy * width * 2.6} result="movedFar" />
        <feComposite in="SourceAlpha" in2="movedFar" operator="out" />
        <feGaussianBlur stdDeviation={width * 1.25} result="wrapA" />
        <feFlood floodColor={wrap} floodOpacity={clamp01(0.3 * rimK)} />
        <feComposite in2="wrapA" operator="in" result="wrap" />
        <feOffset in="SourceAlpha" dx={dx * width} dy={dy * width} result="moved" />
        <feComposite in="SourceAlpha" in2="moved" operator="out" />
        <feGaussianBlur stdDeviation={0.28} result="edgeA" />
        <feFlood floodColor={rim} floodOpacity={clamp01(rimK)} />
        <feComposite in2="edgeA" operator="in" result="edge" />
        <feMorphology in="SourceAlpha" operator="erode" radius={0.55} result="core" />
        <feComposite in="SourceAlpha" in2="core" operator="out" />
        <feGaussianBlur stdDeviation={0.22} result="ringA" />
        <feFlood floodColor={rim} floodOpacity={clamp01(around)} />
        <feComposite in2="ringA" operator="in" result="ring" />
        <feMerge result="lit">
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="wrap" />
          <feMergeNode in="ring" />
          <feMergeNode in="edge" />
        </feMerge>
        <feComposite in="lit" in2="SourceAlpha" operator="in" />
      </filter>
      <g filter={`url(#${id})`} fill={`rgb(${tone})`} stroke={`rgb(${tone})`}>
        {children}
      </g>
    </>
  );
};

const FiveDaysReal: React.FC<Props> = () => {
  const frame = useCurrentFrame();

  // ---- camera ----
  const Z = zoom(frame);
  const Xa = anchorX(frame);
  const Ya = anchorY(frame);
  const sigma = blurSigma(frame);
  const lift = liftAt(frame);
  const sx = (wx: number) => AX + (wx - Xa) * Z;
  const sy = (wy: number) => AY + (wy - Ya) * Z;
  const camTop = Ya - AY / Z;
  const camBottom = camTop + H / Z;
  const lipY = sy(0);
  const world = (pad: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    transformOrigin: "0 0",
    transform: `translate(${AX - Xa * Z}px, ${AY - Ya * Z + pad}px) scale(${Z})`,
  });
  const windowStyle: React.CSSProperties = { position: "absolute", left: 0, top: -BLUR_PAD, width: W, height: H + 2 * BLUR_PAD, overflow: "hidden" };

  // the plates baked for the close views come and go inside the fall's blur
  const collarK = 1 - smooth(60, 260, camTop);
  const stationK = smooth(5600, 5850, camTop);

  // ---- light ----
  const night = nightLevel(frame);
  const fl = frame >= DAY_AT[4] ? holdFlicker(frame) : flicker(frame);
  const lampK = night * fl; // the station lamp
  const nightN = (night - EMBER) / (1 - EMBER); // 0 at the bottom of a night, 1 with the lantern up
  const onOpacity = clamp01(0.88 * lampK);
  // our own lamp on the rock: turned up by a third and wider while he is on his way down
  const liftSlope = 1 + 0.33 * lift + 0.2 * lift; // brightness x contrast
  const liftIcpt = -0.2 * lift * 0.34 * (1 + 0.33 * lift);
  const POOL = `radial-gradient(ellipse ${800 + 300 * lift}px ${1060 + 360 * lift}px at 540px ${860 - 60 * lift - 50 * smoother(F_PUSH0, F_PUSH1, frame)}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 22%, rgba(0,0,0,${0.15 - 0.05 * lift}) 46%, rgba(0,0,0,${0.4 - 0.12 * lift}) 70%, rgba(0,0,0,${0.68 - 0.16 * lift}) 90%, rgba(0,0,0,${0.8 - 0.16 * lift}) 100%)`;

  // ---- the man on the rope and stepping off it ----
  const tSec = frame / FPS;
  const calm = 1 - smooth(F_STEP - 8, F_STEP - 0.5, frame); // nothing swings by the time the step-off takes over
  const swayAmp = (0.8 + 2.2 * smooth(5, 30, frame)) * calm;
  const sway = swayAmp * (Math.sin((2 * Math.PI * frame) / 27 + 0.6) + 0.35 * Math.sin((2 * Math.PI * frame) / 11.5 + 2.0));
  const give = checkAt(frame, 1.2) / 0.3; // his body takes each check a frame late
  const settle = 2.2 * (1 - smooth(1, 7, frame)); // his weight comes onto the rope
  let pose: Pose;
  let g1 = 0;
  let g2 = 0;
  if (frame < F_STEP) {
    const sit = smooth(0.5, 11, frame); // he sits back into the harness, then lets the rope run
    const r = mixPose(READY, RAPPEL, sit);
    pose = {
      ...r,
      x: HANG_X + sway - 2.5 * (1 - sit),
      y: hipDrop(frame) - settle - 5 * (1 - sit),
      rot: -0.9 * sway + 1.5 * give,
      torso: r.torso + 5 * give,
      head: r.head - 6 * bump((frame - 42) / 8),
      th1: r.th1 + 9 * give + 2.5 * calm * Math.sin(frame * 0.31),
      sh1: r.sh1 - 12 * give + 3 * calm * Math.sin(frame * 0.27 + 1),
      th2: r.th2 + 7 * give + 2.5 * calm * Math.sin(frame * 0.23 + 2),
      sh2: r.sh2 - 9 * give + 3 * calm * Math.sin(frame * 0.29 + 0.5),
    };
    g1 = 1;
    g2 = 1;
  } else {
    const a = manArrive(frame);
    pose = a.p;
    g1 = a.g1;
    g2 = a.g2;
    // DAY 1: he has arrived; he looks down the drift, shifts the pack on his shoulders
    const d1 = frame - (F_STEP + 12.5);
    if (d1 > 0) pose = { ...pose, head: pose.head - 9 * smooth(0, 5, d1) + 3 * Math.sin(d1 * 0.45), torso: pose.torso + 1.5 * Math.sin(d1 * 0.3), ua1: pose.ua1 + 4 * Math.sin(d1 * 0.4), fa1: pose.fa1 + 6 * Math.sin(d1 * 0.4) };
  }
  // the rope: taut from the collar to the descender, slack below his brake hand; free once he lets go.
  // At the station it cannot go left of the shaft's wall above the roof: it bends over the roof's edge to him.
  const free = smooth(F_RELEASE - 0.8, F_RELEASE + 1.2, frame);
  const probe = buildMan(pose);
  const anchor: V = [ROPE_X, -37.5];
  const dev = probe.device;
  const edgeX = Math.max(dev[0], XL + 4);
  const upperX = (wy: number) =>
    wy <= ROOF_AT_SHAFT || dev[1] <= ROOF_AT_SHAFT
      ? anchor[0] + (edgeX - anchor[0]) * clamp01((wy - anchor[1]) / (Math.min(dev[1], ROOF_AT_SHAFT) - anchor[1]))
      : lerp(edgeX, dev[0], (wy - ROOF_AT_SHAFT) / Math.max(0.01, dev[1] - ROOF_AT_SHAFT));
  const gripUp: V = [upperX(dev[1] - 17), dev[1] - 17];
  const man = buildMan(pose, g1 > 0 ? { p: gripUp, k: g1 } : null, g2 > 0 ? { p: probe.brake, k: g2 } : null);
  const relDev = buildMan(manArrive(F_RELEASE).p).device;
  const relX = Math.max(relDev[0], XL + 4);
  const since = Math.max(0, frame - F_RELEASE);
  const atLevel = smooth(F_STEP - 2, F_STEP + 2, frame);
  // let go, it is ONE straight line: it swings back to plumb slowly (it is a long rope), a little past, and keeps a
  // slight sway for good
  const swing = (relX - ROPE_X) * Math.exp(-since / 20) * Math.cos((2 * Math.PI * since) / 58) + 1.5 * Math.sin((2 * Math.PI * frame) / 47 + 1.0) * smooth(F_RELEASE + 10, F_RELEASE + 40, frame);
  const ropeX = (wy: number) => {
    const upper = upperX(wy);
    const below = wy - man.hand2[1];
    // below his brake hand it hangs straight down from that hand (clear of the shaft's wall under the station's floor)
    const tail = lerp(man.hand2[0], Math.max(man.hand2[0], XL + 4), smooth(0, Math.max(1, FLOOR - man.hand2[1]), below) * atLevel) + 0.7 * Math.sin((2 * Math.PI * frame) / 23 - below / 95) * (1 - Math.exp(-Math.max(0, below) / 80)) * (1 - atLevel);
    const held = wy <= dev[1] ? upper : below <= 0 ? lerp(dev[0], man.hand2[0], (wy - dev[1]) / Math.max(0.01, man.hand2[1] - dev[1])) : tail;
    return lerp(held, ROPE_X + swing, free);
  };
  const ropePts: string[] = [];
  const ropeFrom = Math.max(anchor[1], camTop - 20);
  for (let wy = ropeFrom; wy <= camBottom + 24; wy += 6) ropePts.push(`${sx(ropeX(wy)).toFixed(1)},${sy(wy).toFixed(1)}`);
  const ropeGround = `${sx(ROPE_X - 40).toFixed(1)},${sy(-330).toFixed(1)} ${sx(ROPE_X - 9).toFixed(1)},${sy(-70).toFixed(1)} ${sx(ROPE_X - 1.5).toFixed(1)},${sy(-40).toFixed(1)}`;
  const ropeW = Math.min(5, 1.5 * Z);

  // where his light comes from: on the rope the dusk and our own lamp from above and his own lamp off the timbers
  // all round him; at the station the tungsten lamp
  const atStation = smooth(F_ARRIVE - 3, F_ARRIVE + 7, frame);
  const hx = sx(man.lampPt[0]);
  const hy = sy(man.lampPt[1]);
  // the pool his headlamp throws on the timbering: both walls and the sets, a good way above and below him
  const poolK = 1 - smooth(F_ARRIVE - 8, F_ARRIVE - 2, frame); // it goes as he comes into the station's own light
  const headPool = `radial-gradient(ellipse ${62 * Z}px ${132 * Z}px at ${sx(SHAFT_X) + 0.4 * (hx - sx(SHAFT_X))}px ${hy + 14 * Z}px, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 30%, rgba(0,0,0,0.78) 52%, rgba(0,0,0,0.36) 74%, rgba(0,0,0,0.1) 90%, rgba(0,0,0,0) 100%)`;

  /** One man: his shadow on floor and wall, himself with his light on him, the point of his headlamp. */
  const figure = (key: string, p: Pose, m: Man, weight: number, extra: React.ReactNode = null) => {
    const station = key === "rope" ? atStation : 1;
    const fallMan = lampFall(p.x, p.y - 14);
    const toward: V = [lerp(-0.15, LAMP_X - m.head[0], station), lerp(-1, LAMP_Y - (p.y - 12) - 6, station)];
    const rimK = lerp(0.62 + 0.25 * Math.exp(-Math.max(0, p.y) / 500), Math.min(0.78, (0.2 + 0.75 * fallMan) * lampK), station);
    const lying = Math.abs(p.rot) > 45;
    const shadowDir = p.x < LAMP_X ? -1 : 1;
    const shadowK = station * clamp01(0.25 + fallMan) * lampK * weight;
    const footY = lying ? floorAt(p.x) - 2.2 : m.low;
    return (
      <g key={key}>
        {shadowK > 0.01 ? (
          <>
            <g opacity={0.3 * shadowK} fill="rgb(2,3,5)" stroke="rgb(2,3,5)" filter="url(#fd-soft)" transform={`translate(${shadowDir * (3 + 5 * (1 - fallMan))} 1)`}>
              {drawPrims(m.prims, `${key}-wall`)}
            </g>
            <ellipse cx={p.x + shadowDir * (lying ? 1 : 7)} cy={footY + 0.4} rx={lying ? 34 : 15} ry={1.9} fill="rgb(2,3,5)" opacity={0.62 * shadowK} filter="url(#fd-softer)" />
          </>
        ) : null}
        <g opacity={weight}>
          <Sil
            id={`fd-rim-${key}`}
            tone="9,11,15"
            toward={toward}
            rim={station > 0.5 ? "rgb(232,168,100)" : "rgb(200,220,246)"}
            wrap={station > 0.5 ? "rgb(170,104,52)" : "rgb(110,130,152)"}
            rimK={rimK}
            width={lerp(0.85, 0.62, station)}
            around={0.62 * (1 - station)}
          >
            {drawPrims(m.prims, key)}
            {extra}
          </Sil>
        </g>
      </g>
    );
  };
  const glare = lerp(34, 15, atStation) * Z; // smaller where the lantern is the light
  const headlamp = (key: string, m: Man, k: number) =>
    k > 0.01 ? (
      <div
        key={key}
        style={{
          position: "absolute",
          left: sx(m.lampPt[0]) - glare / 2,
          top: sy(m.lampPt[1]) - glare / 2,
          width: glare,
          height: glare,
          mixBlendMode: "screen",
          opacity: k * (0.1 + 0.9 * nightN) * (0.92 + 0.08 * Math.sin(tSec * 23)),
          background: "radial-gradient(circle closest-side, rgba(236,246,255,1) 0%, rgba(214,232,255,0.9) 7%, rgba(170,205,255,0.34) 22%, rgba(150,190,255,0.10) 55%, rgba(150,190,255,0) 100%)",
        }}
      />
    ) : null;
  // who is in the picture: the man off the rope until DAY 2 takes over, then each day's man; two only across a change
  const cast: { key: string; p: Pose; m: Man; w: number; n: number }[] = [];
  const w1 = dayOut(1, frame);
  if (w1 > 0.01) cast.push({ key: "rope", p: pose, m: man, w: w1, n: 1 });
  for (let n = 2; n <= 5; n++) {
    const wn = dayIn(n, frame) * dayOut(n, frame);
    if (wn > 0.01) {
      const p = dayPose(n, frame);
      cast.push({ key: `day${n}`, p, m: buildMan(p), w: wn, n });
    }
  }
  const spotK = dayIn(3, frame) * dayOut(3, frame);

  // ---- readout ----
  const readIn = smooth(F_READ, F_READ + 3.5, frame);
  const shaftLeft = sx(XL) - 2;
  const readX = sx(XL) - 108 - READ_RIGHT; // 0 at rest
  const lineX0 = READ_RIGHT - DIGIT_W - 118 + readX;
  const ride = sy(FLOOR - 82) - (AY - 82 * Z1); // rides with the roof it points at (a few px over the hold)
  // the number ticks over like a counter on the frame its day lands: whole and at full strength on every frame
  // (it drops the last few px into place over the next two)
  const shownDay = DAY_AT.reduce((a, T) => a + (frame >= T ? 1 : 0), 0) || 1;
  const tick = shownDay > 1 ? -8 * (1 - smooth(DAY_AT[shownDay - 1], DAY_AT[shownDay - 1] + 2.2, frame)) : 0;

  const gx = Math.floor(random(`fd-grain-x-${frame}`) * (GRAIN_W - W));
  const gy = Math.floor(random(`fd-grain-y-${frame}`) * (GRAIN_H - H));
  const gFlipX = random(`fd-grain-fx-${frame}`) < 0.5 ? -1 : 1;
  const gFlipY = random(`fd-grain-fy-${frame}`) < 0.5 ? -1 : 1;

  const nearCollar = camTop - BLUR_PAD / Z < COLLAR.y + COLLAR.h && camTop < 420;
  // the levels he passes: their lamp's light is off the rock in the world, so each lamp is one clean streak (layer 5)
  const passedOff = PASSED.map((st, i) => (st.box.y + st.box.h > camTop - BLUR_PAD / Z && st.box.y < camBottom + BLUR_PAD / Z ? <Img key={`lv-${i}`} src={st.src} style={box(st.box)} /> : null));
  /** Steam: a few soft wisps that rise from (x, y) and thin out, in the lantern's light. */
  const steam = (key: string, x: number, y: number, k: number, tall = 16) =>
    k > 0.01 ? (
      <g key={key} filter="url(#fd-steam)">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const T = 28;
          const ph = ((((frame + (i * T) / 7 + 2 * (i % 3)) % T) + T) % T) / T;
          return (
            <ellipse
              key={i}
              cx={x + 2.1 * Math.sin(ph * 5.2 + i * 1.7) * ph + 0.6 * Math.sin(frame * 0.11 + i)}
              cy={y - tall * ph}
              rx={0.7 + 1.9 * ph}
              ry={1.5 + 3.4 * ph}
              fill="rgb(255,236,210)"
              opacity={Math.min(1, k * 0.47 * Math.sin(Math.PI * Math.pow(ph, 0.7)))}
            />
          );
        })}
      </g>
    ) : null;
  const nearStation = camBottom + BLUR_PAD / Z > STATION.y;
  const svgWorld = `translate(${AX - Xa * Z} ${AY - Ya * Z}) scale(${Z})`;
  const filtered = sigma > 0 || lift > 0.001;
  const spotMask = `radial-gradient(ellipse ${SPOT.rx}px ${SPOT.ry}px at ${SPOT.x - STATION_FLAT.x}px ${SPOT.y - STATION_FLAT.y}px, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0) 100%)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05080c", overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="fd-blur" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${Math.min(3, 0.05 * sigma)} ${sigma}`} />
            <feComponentTransfer>
              <feFuncR type="linear" slope={liftSlope} intercept={liftIcpt} />
              <feFuncG type="linear" slope={liftSlope} intercept={liftIcpt} />
              <feFuncB type="linear" slope={liftSlope} intercept={liftIcpt} />
            </feComponentTransfer>
          </filter>
          <filter id="fd-blur-lit" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`${Math.min(1.5, 0.02 * sigma)} ${0.42 * sigma}`} />
          </filter>
          <filter id="fd-blur-glow" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation={`0 ${0.55 * sigma}`} />
          </filter>
        </defs>
      </svg>

      {/* 1. the world: one window with the move's motion blur */}
      <div style={windowStyle}>
        <div style={{ position: "absolute", inset: 0, ...(filtered ? { filter: "url(#fd-blur)" } : {}) }}>
          <div style={world(BLUR_PAD)}>
            <Img src={PLATE} style={box({ x: 0, y: PLATE_Y0, w: PLATE_W, h: PLATE_H })} />
            <Img src={FD_PATCH} style={box(PATCH)} />
            {passedOff}
            {nearCollar ? (
              <>
                <Img src={CAP} style={box({ x: 0, y: CAP_Y0, w: PLATE_W, h: CAP_H })} />
                <Img src={FD_COLLAR} style={box(COLLAR, { opacity: collarK })} />
              </>
            ) : null}
            {nearStation ? (
              <>
                <Img src={FD_OFF} style={box(STATION, { opacity: stationK })} />
                <Img src={FD_ON} style={box(STATION_ON, { opacity: stationK * onOpacity })} />
                {/* day 3: his headlamp on the wall of the drift */}
                {spotK > 0.01 ? (
                  <div style={box(STATION_FLAT, { overflow: "hidden", opacity: spotK * (0.06 + 0.76 * nightN), WebkitMaskImage: spotMask, maskImage: spotMask })}>
                    <Img src={FD_FLAT} style={box({ x: 0, y: 0, w: STATION_FLAT.w, h: STATION_FLAT.h })} />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* 2. the timbering in the light of his headlamp: the same window, seen through a pool that goes with him */}
      {poolK > 0 ? (
        <AbsoluteFill style={{ opacity: poolK, WebkitMaskImage: headPool, maskImage: headPool }}>
          <div style={windowStyle}>
            <div style={{ position: "absolute", inset: 0, ...(sigma > 0 ? { filter: "url(#fd-blur-lit)" } : {}) }}>
              <div style={world(BLUR_PAD)}>
                <Img src={FD_SHAFT_LIT} style={box({ x: LIT.x, y: SHAFT_LIT_Y.y, w: LIT.w, h: SHAFT_LIT_Y.h })} />
                {nearCollar ? <Img src={FD_COLLAR_LIT} style={box({ x: LIT.x, y: COLLAR.y, w: LIT.w, h: COLLAR.h }, { opacity: collarK })} /> : null}
              </div>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* 3. the rope, the camp and the man: sharp (he is what the camera holds on to) */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, filter: "blur(0.6px)" }}>
        <defs>
          <filter id="fd-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={2.4} />
          </filter>
          <filter id="fd-softer" x="-50%" y="-300%" width="200%" height="700%">
            <feGaussianBlur stdDeviation="3.2 1.1" />
          </filter>
          <filter id="fd-steam" x="-100%" y="-50%" width="300%" height="200%">
            <feGaussianBlur stdDeviation={1.35} />
          </filter>
          {/* the rope catches his light for a long way up, less below him */}
          <linearGradient id="fd-rope" gradientUnits="userSpaceOnUse" x1={0} y1={hy - 1500} x2={0} y2={hy + 900}>
            <stop offset="0" stopColor="rgb(172,166,148)" />
            <stop offset="0.3" stopColor="rgb(212,206,186)" />
            <stop offset="0.6" stopColor="rgb(240,234,214)" />
            <stop offset="0.66" stopColor="rgb(232,226,206)" />
            <stop offset="0.82" stopColor="rgb(170,164,146)" />
            <stop offset="1" stopColor="rgb(128,124,110)" />
          </linearGradient>
        </defs>
        {/* the rope: over the collar's bearer from an anchor out on the ground, down the shaft */}
        <polyline points={`${ropeGround} ${ropePts.join(" ")}`} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={ropeW + 2.5} strokeLinejoin="round" style={{ filter: "blur(1.8px)" }} />
        <polyline points={`${ropeGround} ${ropePts.join(" ")}`} fill="none" stroke={atStation > 0.5 ? "rgb(198,190,168)" : "url(#fd-rope)"} strokeWidth={ropeW} strokeLinejoin="round" strokeLinecap="round" />
        <g transform={svgWorld}>
          {/* the camp's things, in the order they came */}
          {frame >= DAY_AT[1] - 1
            ? THINGS.map((t) => {
                const wt = dayIn(t.from, frame) * dayOut(t.to, frame);
                if (wt < 0.01) return null;
                const fy = floorAt(t.x);
                const k = lampFall(t.x, fy - 5);
                return (
                  <g key={t.id} opacity={wt}>
                    <ellipse cx={t.x + (t.x < LAMP_X ? -2.5 : 2.5)} cy={fy + 0.4} rx={9} ry={1.5} fill="rgb(3,4,6)" opacity={0.5 * clamp01(0.3 + k) * lampK} filter="url(#fd-softer)" />
                    <Sil id={`fd-rim-${t.id}`} tone={t.tone} toward={[LAMP_X - t.x, LAMP_Y - (fy - 5) - 10]} rim="rgb(226,160,96)" wrap="rgb(170,104,52)" rimK={(0.15 + 0.7 * k) * lampK} width={0.6}>
                      {drawPrims(t.prims(fy), t.id)}
                    </Sil>
                    {t.id === "stove" ? <ellipse cx={STOVE_X} cy={fy - 5.7} rx={2.3} ry={0.75} fill="rgb(120,176,255)" opacity={0.12 + 0.83 * nightN} /> : null}
                  </g>
                );
              })
            : null}
          {cast.map((c) =>
            figure(
              c.key,
              c.p,
              c.m,
              c.w,
              c.n === 5 ? (
                // the cup in his hand: it tips toward his mouth as it comes up
                <g transform={`rotate(${-34 * cupUp(frame)} ${c.m.hand1[0]} ${c.m.hand1[1]})`}>
                  <path d={`M ${c.m.hand1[0] - 1.5} ${c.m.hand1[1] + 0.9} L ${c.m.hand1[0] - 1.9} ${c.m.hand1[1] - 3.3} L ${c.m.hand1[0] + 1.9} ${c.m.hand1[1] - 3.3} L ${c.m.hand1[0] + 1.5} ${c.m.hand1[1] + 0.9} Z`} stroke="none" />
                  <path d={`M ${c.m.hand1[0] + 1.8} ${c.m.hand1[1] - 2.5} C ${c.m.hand1[0] + 3.8} ${c.m.hand1[1] - 2.5}, ${c.m.hand1[0] + 3.8} ${c.m.hand1[1] + 0.1}, ${c.m.hand1[0] + 1.6} ${c.m.hand1[1] + 0.1}`} fill="none" strokeWidth={0.7} />
                </g>
              ) : c.n === 2 ? (
                <>
                  <line x1={c.m.hand1[0]} y1={c.m.hand1[1]} x2={c.m.hand1[0] - 5.5} y2={c.m.hand1[1] - 5} strokeWidth={1.3} strokeLinecap="round" />
                  <line x1={c.m.hand1[0] - 6.6} y1={c.m.hand1[1] - 3.4} x2={c.m.hand1[0] - 4.2} y2={c.m.hand1[1] - 6.8} strokeWidth={2.6} strokeLinecap="round" />
                </>
              ) : null,
            ),
          )}
          {/* steam off the pot (days 4 and 5) and off his cup while it is on his knee (day 5) */}
          {steam("steam-pot", STOVE_X, floorAt(STOVE_X) - 14.6, dayIn(4, frame) * lampK * (frame >= DAY_AT[4] ? 0.6 : 1), 24)}
          {cast.map((c) => (c.n === 5 ? steam("steam-cup", c.m.hand1[0], c.m.hand1[1] - 4, c.w * lampK * (1 - 0.8 * cupUp(frame)), 15) : null))}
        </g>
      </svg>
      {/* his headlamp: a small cool point (it stays lit through the nights) */}
      {cast.map((c) => (c.p.helmet > 0.5 ? headlamp(`hl-${c.key}`, c.m, c.w * (c.n === 5 ? 0.3 : 1)) : null))}

      {/* 4. below ground it gets dark over the first 150 ft, except in the pool of our own lamp */}
      <AbsoluteFill style={{ WebkitMaskImage: POOL, maskImage: POOL }}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom, rgba(${DARK},0) ${lipY + 120 * Z}px, rgba(${DARK},0.34) ${lipY + 620 * Z}px, rgba(${DARK},0.76) ${lipY + 1150 * Z}px, rgba(${DARK},1) ${lipY + 1600 * Z}px)`,
          }}
        />
      </AbsoluteFill>

      {/* 5. the lamps' glow and the dust: world space, streaked by the move */}
      <div style={{ position: "absolute", left: 0, top: -GLOW_PAD, width: W, height: H + 2 * GLOW_PAD, overflow: "hidden", mixBlendMode: "screen", ...(sigma > 0 ? { filter: "url(#fd-blur-glow)" } : {}) }}>
        <div style={world(GLOW_PAD)}>
          {/* a level's lamp going by: a narrow streak of warm light by the shaft, a bright core in a short soft halo */}
          {PASSED.map((st, i) =>
            st.lamp[1] > camTop - 300 && st.lamp[1] < camBottom + 300 ? (
              <React.Fragment key={i}>
                <div style={{ position: "absolute", left: st.lamp[0] - 19, top: st.lamp[1] - 70, width: 38, height: 140, background: "radial-gradient(ellipse closest-side, rgba(255,176,96,0.85) 0%, rgba(255,150,70,0.4) 45%, rgba(255,140,60,0) 100%)" }} />
                <div style={{ position: "absolute", left: st.lamp[0] - 3.4, top: st.lamp[1] - 60, width: 6.8, height: 120, borderRadius: 3.4, background: "linear-gradient(to bottom, rgba(255,236,200,0) 0%, rgba(255,242,212,1) 20%, rgba(255,250,232,1) 50%, rgba(255,242,212,1) 80%, rgba(255,236,200,0) 100%)" }} />
              </React.Fragment>
            ) : null,
          )}
          {nearStation ? (
            <>
              <div
                style={{
                  position: "absolute",
                  left: LAMP_X - 85,
                  top: LAMP_Y - 85,
                  width: 170,
                  height: 170,
                  background: GLOW,
                  opacity: clamp01(0.25 + 0.75 * night) * Math.min(1, 0.9 * (1 + 1.3 * (fl - 1))),
                  transform: `scale(${(0.45 + 0.55 * night) * (1 + 0.7 * (fl - 1))})`,
                }}
              />
              {DUST.map((d, i) => {
                const wrap = (v: number, m: number) => ((v % m) + m) % m;
                const px = wrap(d.x + d.vx * frame, DUST_W);
                const x = px - 46;
                const y = wrap(d.y + d.vy * frame + 1.2 * Math.sin(d.ph + frame * 0.2), DUST_H) + 3;
                const fall = Math.pow(1 / (1 + (x * x + 4 * y * y) / (28 * 28)), 0.7);
                const edge = Math.sqrt(Math.sin((Math.PI * px) / DUST_W));
                const tw = 0.65 + 0.35 * Math.sin(d.ph * 3 + frame * 0.45);
                return (
                  <div
                    key={`d${i}`}
                    style={{
                      position: "absolute",
                      left: LAMP_X + x - d.r,
                      top: LAMP_Y + y - d.r,
                      width: d.r * 2,
                      height: d.r * 2,
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(255,236,200,1) 0%, rgba(255,224,176,0.55) 45%, rgba(255,220,170,0) 100%)",
                      opacity: Math.min(1, 1.15 * fall * edge * tw * lampK),
                    }}
                  />
                );
              })}
            </>
          ) : null}
        </div>
      </div>

      {/* 6. grain, new every frame */}
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: 0.05 }}>
        <Img src={GRAIN} style={{ position: "absolute", left: -gx, top: -gy, width: GRAIN_W, height: GRAIN_H, maxWidth: "none", transform: `scale(${gFlipX}, ${gFlipY})` }} />
      </AbsoluteFill>

      {/* 7. the one readout */}
      {readIn > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: readIn, transform: `translateY(${(1 - readIn) * 34 + ride}px)` }}>
          <div style={{ position: "absolute", left: lineX0, top: READ_LINE_Y, width: Math.max(0, shaftLeft - lineX0), height: 2.5, backgroundColor: WHITE, boxShadow: "0 1px 7px rgba(0,0,0,0.55)" }} />
          <div
            style={{
              position: "absolute",
              left: READ_RIGHT - DIGIT_W - 400 + readX,
              width: 400 + DIGIT_W,
              top: READ_LINE_Y - 172,
              height: 160,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "baseline",
              fontFamily,
              color: WHITE,
              textShadow: "0 2px 20px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.5)",
              fontVariantNumeric: "tabular-nums lining-nums",
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: "0.05em", marginRight: 12 }}>DAY</span>
            <span style={{ display: "inline-block", width: DIGIT_W, textAlign: "center", fontSize: DIGIT_H, fontWeight: 600, transform: `translateY(${tick}px)` }}>{shownDay}</span>
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default FiveDaysReal;
