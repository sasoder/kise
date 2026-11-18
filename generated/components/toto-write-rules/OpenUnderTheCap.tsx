// ---------------------------------------------------------------------------
// OpenUnderTheCap (toto-write-rules, cut 3). Cheeky Pint style, the picture-book world (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 217 frames. Car, crew and idea bubbles: rulesShared.tsx; the camera projection
// (TrackCam, laneK, project, OnLane, pullOut, planeCam): toto-champion-eight/trackWorld.tsx (imported, never edited).
// The garage, the paddock and the money fence are this cut's own world, below.
// REVISION 2 (director review 2): the cap is a low WALL of stacked banknote bricks (front and sides, 0.9 m, kept under
// the wheel hubs on screen) between four chunky bundle pillars; pillars and wall build up row by row out of the ground
// on "budget cap" (f96-112); the "$200M" sign hangs from a pole just outside the front-right corner (it rises with the
// pillars) and slides in along its arm (f112-124), so no blank board at the close; bigger bold idea bubbles; the two
// outward ideas drift out and bump to a stop on the mid pillars' tops (f194 right, f200 left).
// REVISION 1 (director review 1): the car is the hero in the nearest plane, cream on a dark garage, ~780 px at f0;
// the wild parts are much bigger (rulesShared change 1); a shorter pull-out (car ~515 px wide), the plot filling
// x 65-1015 with four chunky banknote pillars and ropes, the front rope rising up the front posts on "cap"; grass,
// not grey asphalt, round the plot; the crew pull the stand levers before the car comes down.
//
// CHECK LINE: "Toto's dream rules: one spending limit, $200M, and inside it the engineers can build anything."
//
// THE LINE: "The innovation | part in me and listening to my engineers is free reign. Have a budget cap that is 200
// million and then make it as open as you want. | That would be magnificent..."
// WORD -> FRAME (from the comp start): part 8 · in 14 · me 21 · and 25 · listening 30 · to 37 · my 44 · engineers 47 ·
// is 58 · free 66 · reign 72 · have 89 · a 92 · budget 96 · cap 102 · that 108 · is 116 · 200 123 · million 136 ·
// and 146 · then 156 · make 162 · it 174 · as 178 · open 184 · as 191 · you 196 · want 200 (ends ~210).
// DURATION: the slot 3.760 -> 12.440 s = 8.68 s x 25 = 217 frames (f0..f216).
//
// THE MOTION: one continuous shot. f0-30 close, side view: a plain cream F1 card car on two stands in the nearest
// plane, in front of the open, dark team garage; two crew behind its ends and the designer at an easel behind its
// middle (sage team shirts, radio headsets); a slow creep in. f32/f40/f48 ("listening to my engineers") each lifts
// a hand and a small amber idea bubble rises out from behind their head with an ink sketch (fan, stilt wing, extra
// wheels). f66-86 ("free reign") the bubbles fly onto their mounts and the parts come out of the car into them (the
// fan slides out past the tail, the stilt wing rises out of the engine cover ~2.5 m up on two struts, the small
// wheel slides out from behind the front tyre); each bubble is absorbed into its part; the crew cheer (f84-104).
// f89-140 ("budget cap that is 200 million") one eased pull-out with a crane up: the car and garage stand in a plot
// fenced by four tall pillars of stacked green banknote bundles with ropes between; the front rope rises up the
// front posts into place on "cap" (f100-110); on "200 million" the cream sign on the gate post reads "$200M"
// (slides up, f114-126). f150-210 ("make it as open as you want"): a second, taller wing tier rises (bubble lands
// f176), the fan spins up (bubble absorbed f186), two more ideas drift outward and bump to a stop at the side ropes
// (contact f194 right, f200 left; the fence holds); the lead and the mechanic pull the stand levers (hands on
// f186, pull f188-200) and the car comes down onto its wheels. Settled and alive to f216 (fan turning, bubbles
// bobbing at the rope, a slow creep).
// CAUSE -> EFFECT: each part comes out only once its bubble sits over its mount (bubbles land f78-82, parts arrive
// f84-86); the fan's spin-up starts when its bubble is absorbed (f186); the car comes down only while the levers
// are pulled (contact f186, first drop f188).
// AMBER = engineering freedom: the ideas and the radical parts they become (bubbles, wing, fan, small wheel). The
// fence is green/board, never amber: money is the limit, not the freedom. Cream = the subject (the car).
//
// SOURCES: "$200M" is the budget cap Toto names in the line (spoken figure; no other numbers on screen). Car on
// champShared's true-scale F1 proportions; the wild parts after the 1968 stilt wings, the Brabham BT46B fan car and
// the Tyrrell P34 six-wheeler, drawn cute.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_NUM, GRAIN, GROUND, VIGNETTE, amberBandFor, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { CLOTH } from "../scott-free-wifi/cabinCast";
import { OnLane, TRACK_COLOR, horizonY, laneK, planeCam, project, pullOut, type TrackCam } from "../toto-champion-eight/trackWorld";
import { CAR, ENGINEER, ENGINEERS, Engineer, IdeaBubble, M, WildCar, engineerHead, restPose, type EngineerPose, type EngineerSpec, type IdeaKind, type P2 } from "./rulesShared";

export const FPS = 25;
export const DURATION = 217;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const ss = (a: number, b: number, f: number) => smoothstep((f - a) / (b - a));
const ss5 = (a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// ===========================================================================
// THE WORLD (metres; x across, h up, z depth away from the camera; the car's plane is z = 0, the nearest subject)
// ===========================================================================
/** the garage behind the car: open front at zF, back wall at zB, interior half-width X, opening H, facade top T */
const G = { X: 3.2, pillar: 0.35, zF: 2.0, zB: 6.0, H: 3.6, T: 4.2 } as const;
/** the cash wall: four chunky banknote pillars (front corners at z front, two more at z mid) and a low wall of
 *  stacked bundles between them (front and sides); the sign pole stands just outside the front-right corner */
const FENCE = { X: 3.2, front: -3.2, mid: -1.8, postH: 1.35, wallH: 0.9, bundleW: 0.7, bundleH: 0.15, brickL: 0.62, poleX: 3.95, poleH: 4.05 } as const;
/** the "$200M" sign: hung from the pole's arm, metres; it slides in along the arm from the pole (`slide` m) */
const SIGN = { x0: 1.6, x1: 3.2, h0: 3.2, h1: 3.88, z: -3.25, slide: 2.6 } as const;
/** the car: its cockpit x (the car shifted 0.25 m right of centre, so the fan stays in frame at the close) */
const CAR_X = (-CAR.mid + 0.25) * M;
const LIFT0 = 0.2 * M;

// ===========================================================================
// BEATS
// ===========================================================================
export const BEAT = {
  pullFrom: 89, // have
  pullTo: 140,
  postsFrom: 96, // budget 96 .. cap 102: the pillars and the wall build up row by row
  postsTo: 110,
  wallFrom: 98,
  wallTo: 112,
  signFrom: 112, // slides in along its arm, lands by "200" f123 .. before "million" f136
  signTo: 124,
  cheerFrom: 84,
  cheerTo: 104,
  reachFrom: 178, // hands on the levers by f186
  pullLever: 188, // the car comes down f188-200 ("open" f184 .. "as you" f196)
  leverTo: 200,
  releaseFrom: 206,
} as const;

// ===========================================================================
// THE CAMERA: close on the car, a short eased pull-out with a crane up, slow creeps either side
// ===========================================================================
const K0 = 0.345;
const K_PRE = 0.352;
const K1 = 0.24;
const K_END = 0.243;
const D0 = 9 * M;
const DOLLY = 0.8;
const SHIFT = 190; // the user's standing "move it down" on 9:16 Cheeky Pint
export const pullAt = (f: number) => ss5(BEAT.pullFrom, BEAT.pullTo, f);
export const camAt = (f: number): TrackCam => {
  const p = pullAt(f);
  const pre = ss(-20, BEAT.pullFrom, f);
  const creep = ss(BEAT.pullTo, DURATION + 30, f);
  const kPre = lerp(K0, K_PRE, pre);
  const kPull = Math.exp(Math.log(kPre) + (Math.log(K1) - Math.log(kPre)) * p);
  const k = kPull * (1 + (K_END / K1 - 1) * creep);
  const D = pullOut(K0, D0, Math.min(K0, k), DOLLY).D;
  return {
    x: 0.03 * M * Math.sin(f / 61),
    k,
    D,
    eye: (1.4 + 2.8 * p) * M,
    groundY: lerp(860, 738, p),
    dx: 0,
    dy: SHIFT + 1.2 * Math.sin(f / 23),
  };
};
/** a world point on lane zFrom -> the world point on lane zTo that lands on the same screen pixel */
const toLane = (cam: TrackCam, wx: number, wy: number, zFrom: number, zTo: number): P2 => {
  const s = project(cam, wx, wy, zFrom);
  const kB = laneK(cam, zTo);
  return [cam.x + (s[0] - 540 - (cam.dx ?? 0)) / kB, (s[1] - (horizonY(cam) + cam.eye * kB) - (cam.dy ?? 0)) / kB];
};

// ===========================================================================
// THE STANDS AND THEIR LEVERS (car lane): the lever's top is where the crew's hand goes
// ===========================================================================
const liftAt = (f: number) => {
  const u = ss5(BEAT.pullLever, BEAT.leverTo, f);
  const settle = 0.012 * M * Math.sin(clamp01((f - BEAT.leverTo + 2) / 10) * Math.PI) * (f > BEAT.leverTo - 2 ? 1 : 0);
  return LIFT0 * (1 - u) - settle;
};
/** stand bases (world x) and their levers: from a pivot on the base up and outward; `drop` 0..1 swings it down */
const STANDS = [
  { x: CAR_X + -1.98 * M, dir: -1 },
  { x: CAR_X + 2.9 * M, dir: 1 },
] as const;
const leverTop = (i: number, f: number): P2 => {
  const s = STANDS[i];
  const drop = ss5(BEAT.pullLever, BEAT.leverTo, f);
  const ang = lerp(68, 30, drop) * (Math.PI / 180);
  const L = 1.1 * M;
  const pivot: P2 = [s.x + s.dir * 0.12 * M, -0.1 * M];
  return [pivot[0] + s.dir * Math.cos(ang) * L, pivot[1] - Math.sin(ang) * L];
};

// ===========================================================================
// THE CREW
// ===========================================================================
type Crew = { id: "lead" | "mech" | "designer"; spec: EngineerSpec; x: number; z: number; face: 1 | -1 };
const SIZE = 2.1;
const CREW: Record<Crew["id"], Crew> = {
  lead: { id: "lead", spec: ENGINEERS.lead, x: -2.75, z: 0.9, face: 1 },
  designer: { id: "designer", spec: ENGINEERS.designer, x: 0.78, z: 1.8, face: -1 },
  mech: { id: "mech", spec: ENGINEERS.mech, x: 2.75, z: 0.9, face: -1 },
};
/** the easel the designer draws at (metres) */
const EASEL = { x: -0.06, z: 1.8, w: 0.95, h0: 1.0, h1: 1.8 } as const;

/** a hand lift for an idea: up over 8 f from `at`, held, back down over 12 f at `down` */
const liftHand = (f: number, at: number, down: number) => ss(at, at + 8, f) * (1 - ss(down, down + 12, f));
const blinkOf = (f: number, seeds: number[]) => {
  for (const b of seeds) {
    const u = f - b;
    if (u >= 0 && u < 5) return [0.5, 1, 1, 0.6, 0.2][Math.floor(u)];
  }
  return 0;
};
const cheerAt = (f: number) => ss(BEAT.cheerFrom, BEAT.cheerFrom + 7, f) * (1 - ss(BEAT.cheerTo - 6, BEAT.cheerTo + 6, f));
const mix = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** a world point on the car's lane -> the hip-local hand target of a crew member (rig px) */
const handTo = (c: Crew, f: number, w: P2, bob: number): P2 => {
  const q = toLane(camAt(f), w[0], w[1], 0, c.z * M);
  const rigX = (q[0] - c.x * M) / (SIZE * (c.face === 1 ? -1 : 1));
  const rigY = q[1] / SIZE;
  return [rigX - ENGINEER.hip[0], rigY - ENGINEER.hip[1] + bob];
};
const poseOf = (id: Crew["id"], f: number): EngineerPose => {
  const c = CREW[id];
  const cheer = cheerAt(f);
  const breathe = 1.6 * Math.sin(f / 13 + (id === "mech" ? 1.7 : id === "designer" ? 3.1 : 0));
  const hop = 10 * Math.max(0, Math.sin(((f - BEAT.cheerFrom) / 18) * Math.PI)) * (f > BEAT.cheerFrom && f < BEAT.cheerFrom + 18 ? 1 : 0);
  const bob = breathe + hop;
  const idea: P2 = [-130, -205];
  const cheerNear: P2 = [-150, -232];
  const cheerFar: P2 = [80, -282];
  if (id === "designer") {
    // draws at the easel (small loops), lifts a hand for the wing ideas, cheers
    const up = Math.max(liftHand(f, 38, 60), liftHand(f, 148, 170));
    const loop: P2 = [-112 + 9 * Math.sin(f / 3.1), -60 + 7 * Math.cos(f / 2.3)];
    const hand = mix(mix(loop, idea, up), cheerNear, cheer);
    const farHand = mix([16, 0], cheerFar, cheer);
    const drawing = (1 - up) * (1 - cheer);
    return restPose({ hand, farHand, lean: -2 * cheer + 3 * drawing, tilt: -4 * drawing + 6 * up + 8 * cheer, smile: 0.3 + 0.7 * Math.max(cheer, up * 0.5, ss(196, 206, f) * 0.6), happy: cheer, blink: blinkOf(f, [26, 133, 196]), bob: bob * 0.9 });
  }
  // the lead (fan ideas, the rear lever) and the mechanic (wheels idea, the overflow idea, the front lever)
  const up = id === "lead" ? Math.max(liftHand(f, 30, 56), liftHand(f, 154, 170)) : Math.max(liftHand(f, 46, 66), liftHand(f, 158, 172));
  const rest: P2 = id === "lead" ? [-22, 4] : [-26, 2];
  const grip = ss(BEAT.reachFrom, BEAT.reachFrom + 8, f) * (1 - ss(BEAT.releaseFrom, BEAT.releaseFrom + 9, f));
  const lever = handTo(c, f, leverTop(id === "lead" ? 0 : 1, f), bob);
  let hand = mix(mix(rest, idea, up), cheerNear, cheer);
  hand = mix(hand, lever, grip);
  const farHand = mix(id === "lead" ? [14, 2] : [12, 4], cheerFar, cheer);
  const stoop = grip * (8 + 6 * ss5(BEAT.pullLever, BEAT.leverTo, f));
  return restPose({
    hand,
    farHand,
    lean: -3 * cheer - stoop,
    tilt: 6 * up + 8 * cheer - 8 * grip,
    smile: 0.35 + 0.65 * Math.max(cheer, up * 0.5, ss(198, 208, f) * 0.6),
    happy: cheer,
    blink: id === "lead" ? blinkOf(f, [18, 120, 210]) : blinkOf(f, [9, 75, 150]),
    bob: id === "lead" ? bob : bob * 0.8,
  });
};

// ===========================================================================
// THE PARTS (WildCar props over time)
// ===========================================================================
const partsAt = (f: number) => ({
  fan: ss5(73, 85, f),
  wing: ss5(74, 86, f),
  wheels: ss5(76, 86, f),
  wing2: ss5(172, 184, f),
  // idle turn once out; the spin-up when its second bubble is absorbed (f186)
  fanSpeed: 5 * ss(80, 90, f) + 27 * ss(186, 202, f),
});
const fanSpinAt = (f: number) => {
  let a = 0;
  const n = Math.max(0, Math.ceil(f * 2));
  const h = n ? f / n : 0;
  for (let i = 0; i < n; i++) a += partsAt((i + 0.5) * h).fanSpeed * h;
  return a;
};

// ===========================================================================
// THE BUBBLES
// ===========================================================================
type BubbleSpec = {
  key: string;
  kind: IdeaKind;
  who: Crew["id"];
  rise: [number, number];
  fly: [number, number];
  absorb?: [number, number];
  /** a car point (car metres) on z = 0 */
  car?: () => P2;
  /** a stop on top of a cash-wall pillar (metres: pillar x, its top, its depth): it bumps and settles there */
  perch?: { x: number; h: number; z: number; side: 1 | -1 };
  /** the hover offset over the head (metres: forward, up) */
  hover: P2;
};
const R_BUB = 0.67 * M;
const BUBBLES: BubbleSpec[] = [
  { key: "fan", kind: "fan", who: "lead", rise: [32, 48], fly: [67, 80], absorb: [80, 87], car: () => [CAR.fan.to[0], CAR.fan.to[1]], hover: [0.3, 1.25] },
  { key: "wing", kind: "wing", who: "designer", rise: [40, 56], fly: [66, 78], absorb: [80, 88], car: () => [CAR.wing.x, CAR.wing.y1], hover: [0.3, 1.25] },
  { key: "wheels", kind: "wheels", who: "mech", rise: [48, 62], fly: [68, 82], absorb: [82, 88], car: () => [CAR.wheels.to[0], CAR.wheels.to[1]], hover: [0.3, 1.25] },
  // "make it as open as you want": a second, taller wing tier; the fan spun up
  { key: "wing2", kind: "wing", who: "designer", rise: [150, 164], fly: [164, 176], absorb: [178, 186], car: () => [CAR.wing.x - 0.04, CAR.wing.y2], hover: [0.25, 1.25] },
  { key: "fan2", kind: "fan", who: "lead", rise: [156, 170], fly: [170, 182], absorb: [182, 188], car: () => [CAR.fan.to[0], CAR.fan.to[1]], hover: [0.3, 1.25] },
  // two more drift outward and stop at the side ropes: the fence holds
  { key: "outR", kind: "wheels", who: "mech", rise: [160, 174], fly: [174, 194], perch: { x: FENCE.X, h: FENCE.postH, z: FENCE.mid, side: 1 }, hover: [0.6, 0.6] },
  { key: "outL", kind: "wing", who: "lead", rise: [166, 180], fly: [180, 200], perch: { x: -FENCE.X - 0.16, h: FENCE.postH, z: FENCE.mid, side: -1 }, hover: [-0.25, 1.0] },
];

type BubbleState = { x: number; y: number; z: number; tail: number; absorb: number; behind: boolean; squash: number } | null;
const bubbleAt = (b: BubbleSpec, f: number): BubbleState => {
  if (f < b.rise[0]) return null;
  const crew = CREW[b.who];
  const pose = poseOf(b.who, f);
  const head = engineerHead(crew.x * M, 0, SIZE, crew.face, pose);
  const fwd = crew.face;
  const r = ss5(b.rise[0], b.rise[1], f);
  const hoverX = head[0] + fwd * b.hover[0] * M;
  const hoverY = head[1] - b.hover[1] * M;
  const bob = 0.05 * M * Math.sin((f - b.rise[0]) / 7);
  let x = lerp(head[0], hoverX, r);
  let y = lerp(head[1], hoverY, Math.pow(r, 0.8)) + bob * r;
  let zz = crew.z;
  const tail = r * (1 - ss(b.fly[0], b.fly[0] + 6, f));
  let squash = 0;
  if (f >= b.fly[0]) {
    if (b.car) {
      const u = ss5(b.fly[0], b.fly[1], f);
      const t = b.car();
      const tx = CAR_X + t[0] * M;
      const ty = -t[1] * M - liftAt(f);
      x = lerp(x, tx, u);
      y = lerp(y, ty, u) - 0.3 * M * Math.sin(u * Math.PI);
      zz = lerp(crew.z, 0, u);
    } else if (b.perch) {
      // drifts outward and drops onto the pillar top: it bumps (a damped hop and a squash) and stays (the wall holds)
      const R = b.perch;
      const stopX = R.x * M;
      const stopY = -(R.h * M + R_BUB * 0.97);
      const v = clamp01((f - b.fly[0]) / (b.fly[1] - b.fly[0]));
      const d = 1 - Math.pow(1 - v, 2.4);
      x = lerp(x, stopX, d);
      // no lift on the way out: it stays under the sign and drops onto the pillar
      y = lerp(y, stopY, d * d);
      zz = lerp(crew.z, R.z, d);
      const t = f - b.fly[1];
      if (t > 0) {
        y -= 0.14 * M * Math.exp(-t / 4) * Math.abs(Math.sin(t / 2.1));
        y += 0.025 * M * (1 - Math.cos(t / 9)) * 0.5;
        squash = 0.12 * Math.exp(-t / 3) * Math.max(0, Math.cos(t / 2.1));
      }
    }
  }
  const absorb = b.absorb ? clamp01((f - b.absorb[0]) / (b.absorb[1] - b.absorb[0])) : 0;
  if (absorb >= 1) return null;
  return { x, y, z: zz, tail, absorb, behind: f < b.rise[1] - 2, squash };
};

// ===========================================================================
// DRAWING HELPERS
// ===========================================================================
const quadD = (pts: P2[]) => `M${pts.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}Z`;
/** the bundles: a muted banknote green (board-leaning), a lighter edge, a cream paper strap; never amber */
const MONEY = { note: "#7F9466", noteAlt: "#889C6D", edge: "#A7B78A", strap: "#EDE3CC", dark: "#56653F" } as const;

/** how far a stack of n rows has built by frame f: rows push up out of the ground one at a time (eased each) */
const builtRows = (n: number, a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a)) * n;
  const i = Math.floor(u);
  return Math.min(n, i + smoothstep(u - i));
};
/** one bundle brick between two corners on a vertical plane (metres): [x, z] at each end, h0..h1 */
const Brick: React.FC<{ cam: TrackCam; a: [number, number]; b: [number, number]; h0: number; h1: number; tone: string; strap: boolean }> = ({ cam, a, b, h0, h1, tone, strap }) => {
  const P = (x: number, h: number, z: number) => project(cam, x * M, -h * M, z * M);
  const q = [P(a[0], h0, a[1]), P(b[0], h0, b[1]), P(b[0], h1, b[1]), P(a[0], h1, a[1])];
  const edge = Math.min(0.035, (h1 - h0) * 0.3);
  const top = [P(a[0], h1 - edge, a[1]), P(b[0], h1 - edge, b[1]), q[2], q[3]];
  const mid = (t: number, h: number): P2 => P(lerp(a[0], b[0], t), h, lerp(a[1], b[1], t));
  return (
    <g>
      <path d={quadD(q)} fill={tone} stroke={mixHex(COLOR.board, MONEY.dark, 0.5)} strokeWidth={f3(0.018 * laneK(cam, a[1] * M) * M)} strokeLinejoin="round" />
      <path d={quadD(top)} fill={MONEY.edge} />
      {strap ? <path d={quadD([mid(0.44, h0), mid(0.56, h0), mid(0.56, h1), mid(0.44, h1)])} fill={MONEY.strap} /> : null}
    </g>
  );
};
/** a run of the low cash wall from a to b ([x, z] metres), built to height H (metres; rows rise out of the ground) */
const MoneyWall: React.FC<{ cam: TrackCam; a: [number, number]; b: [number, number]; H: number; seed: number }> = ({ cam, a, b, H, seed }) => {
  if (H <= 0.002) return null;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bh = FENCE.bundleH;
  const n = Math.ceil(H / bh);
  const out: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    // row r counted down from the top: its slot is [H - (r+1) bh, H - r bh], cut at the ground
    const h1 = H - r * bh;
    const h0 = Math.max(0, h1 - bh);
    if (h1 <= 0.004) continue;
    const off = (r % 2) * FENCE.brickL * 0.5;
    for (let t0 = -off; t0 < L; t0 += FENCE.brickL) {
      const s0 = Math.max(0, t0 + 0.012);
      const s1 = Math.min(L, t0 + FENCE.brickL - 0.012);
      if (s1 - s0 < 0.05) continue;
      const pa: [number, number] = [lerp(a[0], b[0], s0 / L), lerp(a[1], b[1], s0 / L)];
      const pb: [number, number] = [lerp(a[0], b[0], s1 / L), lerp(a[1], b[1], s1 / L)];
      const tone = hash(seed * 17 + r * 5.1 + t0 * 3.3) > 0.5 ? MONEY.note : MONEY.noteAlt;
      out.push(<Brick key={`${r}_${f3(t0)}`} cam={cam} a={pa} b={pb} h0={h0} h1={h1} tone={tone} strap={s1 - s0 > 0.4} />);
    }
  }
  return <g>{out}</g>;
};
/** a chunky pillar of stacked bundles at (x, z) metres, built to height H (rows rise out of the ground) */
const BuiltPost: React.FC<{ cam: TrackCam; x: number; z: number; H: number; seed: number }> = ({ cam, x, z, H, seed }) => {
  if (H <= 0.002) return null;
  const P = (xm: number, hm: number) => project(cam, xm * M, -hm * M, z * M);
  const bh = FENCE.bundleH;
  const s = laneK(cam, z * M) * M;
  const W = FENCE.bundleW;
  const base = P(x, 0);
  const out: React.ReactNode[] = [
    <ellipse key="sh" cx={f3(base[0] + 0.14 * s)} cy={f3(base[1])} rx={f3(0.55 * s)} ry={f3(Math.max(1.5, 0.06 * s))} fill={COLOR.shadow} opacity={0.4} style={{ filter: `blur(${f3(0.04 * s)}px)` }} />,
  ];
  const n = Math.ceil(H / bh);
  for (let r = 0; r < n; r++) {
    const h1 = H - r * bh;
    const h0 = Math.max(0, h1 - bh);
    if (h1 <= 0.004) continue;
    const jx = (hash(seed * 31 + r * 7.3) - 0.5) * 0.06;
    const a = P(x - W / 2 + jx, h1);
    const b = P(x + W / 2 + jx, h0);
    const w = b[0] - a[0];
    const hh = b[1] - a[1];
    out.push(
      <g key={r}>
        <rect x={f3(a[0])} y={f3(a[1])} width={f3(w)} height={f3(hh)} rx={f3(Math.min(hh, w) * 0.16)} fill={r % 2 ? MONEY.note : MONEY.noteAlt} stroke={mixHex(COLOR.board, MONEY.dark, 0.5)} strokeWidth={f3(0.018 * s)} />
        <rect x={f3(a[0])} y={f3(a[1])} width={f3(w)} height={f3(Math.max(0.8, Math.min(hh, 0.035 * s)))} fill={MONEY.edge} />
        <rect x={f3(a[0] + w * 0.42)} y={f3(a[1])} width={f3(w * 0.16)} height={f3(hh)} fill={MONEY.strap} />
      </g>,
    );
  }
  const top = P(x - W / 2, H);
  const bot = P(x + W / 2, 0);
  out.push(<rect key="lit" x={f3(top[0])} y={f3(top[1])} width={f3((bot[0] - top[0]) * 0.1)} height={f3(bot[1] - top[1])} fill="#FFF6E2" opacity={0.18} />);
  out.push(<rect key="shd" x={f3(bot[0] - (bot[0] - top[0]) * 0.14)} y={f3(top[1])} width={f3((bot[0] - top[0]) * 0.14)} height={f3(bot[1] - top[1])} fill={COLOR.shadow} opacity={0.18} />);
  return <g>{out}</g>;
};

// the garage interior: dark board tones so the cream car reads against it
const DARK = {
  wall: mixHex(COLOR.board, COLOR.ground, 0.55),
  wallTop: mixHex(COLOR.board, COLOR.ground, 0.4),
  floor: mixHex(COLOR.boardFoot, COLOR.ground, 0.62),
  sideL: mixHex(COLOR.board, COLOR.ground, 0.72),
  sideR: mixHex(COLOR.board, COLOR.ground, 0.5),
  ceil: mixHex(COLOR.board, COLOR.ground, 0.78),
} as const;
const GRASS = { far: "#A7A56F", mid: "#929A5A", near: "#7D8748", tuft: "#717B3F", tuftLit: "#ADB16D" } as const;
const APRON = mixHex(TRACK_COLOR.asphaltLight, COLOR.cream, 0.45);

// ===========================================================================
// THE CUT
// ===========================================================================
const OpenUnderTheCap: React.FC<z.infer<typeof schema>> = () => {
  const uid = `ouc${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const S = useCurrentFrame();
  const cam = camAt(S);
  const kz = (zm: number) => laneK(cam, zm * M);
  const P = (xm: number, hm: number, zm: number) => project(cam, xm * M, -hm * M, zm * M);
  const hor = horizonY(cam) + (cam.dy ?? 0);
  const band = amberBandFor(planeCam(cam, 0));
  const parts = partsAt(S);
  const lift = liftAt(S);
  const fanSpin = fanSpinAt(S);
  const k0 = kz(0);

  // ---- sky, far trees, the grass of the paddock ----
  const sky = (
    <g>
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, hor + 70))} fill={`url(#${uid}sky)`} />
      <rect x={-60} y={-60} width={1200} height={f3(Math.max(0, hor + 70))} fill={`url(#${uid}sun)`} />
      <g style={{ filter: "blur(16px)" }}>
        {[
          { x: 160, h: 700, w: 420, t: 24, a: 0.3, v: 0.14 },
          { x: 820, h: 560, w: 520, t: 20, a: 0.26, v: 0.1 },
          { x: 480, h: 400, w: 640, t: 16, a: 0.26, v: 0.08 },
        ].map((q, i) => (
          <ellipse key={i} cx={f3(((q.x + S * q.v) % 1500) - 200)} cy={f3(hor - q.h * Math.sqrt(k0 / 0.3))} rx={q.w} ry={q.t} fill={q.h > 450 ? SKY.cloudHi : SKY.cloudLo} opacity={q.a} />
        ))}
      </g>
    </g>
  );
  const farZ = 34;
  const trees: React.ReactNode[] = [];
  for (let i = -14; i <= 14; i++) {
    const xm = i * 3.0 + (hash(i + 3) - 0.5) * 1.6;
    const hm = 5 + 4 * hash(i * 1.7 + 11);
    const r = (1.6 + 1.2 * hash(i * 2.9 + 5)) * kz(farZ) * M;
    const [bx, by] = P(xm, 0, farZ);
    const cy = P(xm, hm - 1.2, farZ)[1];
    const t = Math.floor(hash(i * 5.1) * 4) % 4;
    trees.push(
      <g key={i}>
        <rect x={f3(bx - 0.12 * kz(farZ) * M)} y={f3(cy)} width={f3(0.24 * kz(farZ) * M)} height={f3(by - cy)} fill={mixHex(TRACK_COLOR.trunk, SKY.haze, 0.45)} />
        <circle cx={f3(bx)} cy={f3(cy)} r={f3(r)} fill={mixHex(TRACK_COLOR.tree[t], SKY.haze, 0.42)} />
        <circle cx={f3(bx - r * 0.25)} cy={f3(cy - r * 0.2)} r={f3(r * 0.66)} fill={mixHex(TRACK_COLOR.treeLit[t], SKY.haze, 0.42)} />
      </g>,
    );
  }
  // grass tufts on rows of the near ground (random per row; they ride the camera in world space)
  const tufts: React.ReactNode[] = [];
  for (let row = 0; row < 14; row++) {
    const zr = FENCE.front - 0.5 - row * 0.55;
    if (cam.D + zr * M < 0.8 * M) break;
    const kr = kz(zr) * M;
    for (let i = 0; i < 22; i++) {
      const xm = -9 + 18 * hash(row * 13.1 + i * 3.7);
      const [x0, y0] = P(xm, 0, zr);
      if (x0 < -40 || x0 > 1120) continue;
      const hh = (0.07 + 0.08 * hash(row + i * 5.3)) * kr;
      const ww = 0.06 * kr;
      const col = hash(row * 2.1 + i) > 0.5 ? GRASS.tuft : GRASS.tuftLit;
      tufts.push(
        <path key={`${row}_${i}`} d={`M${f3(x0 - ww * 1.6)} ${f3(y0)}L${f3(x0 - ww * 0.9)} ${f3(y0 - hh)}L${f3(x0 - ww * 0.2)} ${f3(y0)}L${f3(x0 + ww * 0.3)} ${f3(y0 - hh * 1.3)}L${f3(x0 + ww)} ${f3(y0)}L${f3(x0 + ww * 1.5)} ${f3(y0 - hh * 0.8)}L${f3(x0 + ww * 2)} ${f3(y0)}Z`} fill={col} />,
      );
    }
  }
  const apron = quadD([P(-FENCE.X - 0.3, 0, FENCE.front - 0.3), P(FENCE.X + 0.3, 0, FENCE.front - 0.3), P(FENCE.X + 0.3, 0, G.zB + 1), P(-FENCE.X - 0.3, 0, G.zB + 1)]);
  const apronLine = quadD([P(-FENCE.X, 0, -1.25), P(FENCE.X, 0, -1.25), P(FENCE.X, 0, -1.1), P(-FENCE.X, 0, -1.1)]);

  // ---- the garage (behind the car) ----
  const X = G.X;
  const Xo = G.X + G.pillar;
  const wall = quadD([P(-X, 0, G.zB), P(X, 0, G.zB), P(X, G.H, G.zB), P(-X, G.H, G.zB)]);
  const floorD = quadD([P(-X, 0, G.zF), P(X, 0, G.zF), P(X, 0, G.zB), P(-X, 0, G.zB)]);
  const sideL = quadD([P(-X, 0, G.zF), P(-X, 0, G.zB), P(-X, G.H, G.zB), P(-X, G.H, G.zF)]);
  const sideR = quadD([P(X, 0, G.zF), P(X, 0, G.zB), P(X, G.H, G.zB), P(X, G.H, G.zF)]);
  const ceil = quadD([P(-X, G.H, G.zF), P(X, G.H, G.zF), P(X, G.H, G.zB), P(-X, G.H, G.zB)]);
  const roof = quadD([P(-Xo, G.T, G.zF), P(Xo, G.T, G.zF), P(Xo, G.T, G.zB + 0.3), P(-Xo, G.T, G.zB + 0.3)]);
  const facade = `${quadD([P(-Xo, 0, G.zF), P(-X, 0, G.zF), P(-X, G.T, G.zF), P(-Xo, G.T, G.zF)])}${quadD([P(X, 0, G.zF), P(Xo, 0, G.zF), P(Xo, G.T, G.zF), P(X, G.T, G.zF)])}${quadD([P(-X, G.H, G.zF), P(X, G.H, G.zF), P(X, G.T, G.zF), P(-X, G.T, G.zF)])}`;
  const fasciaBand = quadD([P(-Xo, G.H + 0.18, G.zF), P(Xo, G.H + 0.18, G.zF), P(Xo, G.H + 0.36, G.zF), P(-Xo, G.H + 0.36, G.zF)]);
  const drum = quadD([P(-X, G.H - 0.24, G.zF + 0.05), P(X, G.H - 0.24, G.zF + 0.05), P(X, G.H, G.zF + 0.05), P(-X, G.H, G.zF + 0.05)]);
  const capD = quadD([P(-Xo - 0.05, G.T, G.zF), P(Xo + 0.05, G.T, G.zF), P(Xo + 0.05, G.T - 0.08, G.zF), P(-Xo - 0.05, G.T - 0.08, G.zF)]);
  const wallBand = quadD([P(-X, 2.3, G.zB), P(X, 2.3, G.zB), P(X, 2.55, G.zB), P(-X, 2.55, G.zB)]);
  const peg = quadD([P(-2.6, 1.05, G.zB), P(-0.8, 1.05, G.zB), P(-0.8, 2.05, G.zB), P(-2.6, 2.05, G.zB)]);
  const tools = [-2.4, -2.1, -1.8, -1.45, -1.1].map((tx, i) => {
    const top = P(tx, 1.9, G.zB);
    const bot = P(tx, 1.9 - (0.4 + 0.2 * hash(i + 2)), G.zB);
    return <path key={i} d={`M${f3(top[0])} ${f3(top[1])}L${f3(bot[0])} ${f3(bot[1])}`} stroke={mixHex(COLOR.ground, COLOR.shadow, 0.3)} strokeWidth={f3(0.07 * kz(G.zB) * M)} strokeLinecap="round" />;
  });
  const lights = [-1.6, 1.6].map((lx, i) => {
    const a = P(lx - 0.9, G.H - 0.02, 3.8);
    const b = P(lx + 0.9, G.H - 0.16, 3.8);
    return <rect key={i} x={f3(a[0])} y={f3(a[1])} width={f3(b[0] - a[0])} height={f3(Math.max(1, b[1] - a[1]))} rx={f3((b[1] - a[1]) / 2)} fill="#FFF0D2" opacity={0.85} />;
  });
  const tyreStack = [0, 1, 2, 3].map((i) => {
    const zt = 5.3;
    const a = P(2.1, 0.24 * (i + 1), zt);
    const b = P(2.9, 0.24 * i, zt);
    return <rect key={i} x={f3(a[0])} y={f3(a[1])} width={f3(b[0] - a[0])} height={f3(b[1] - a[1])} rx={f3((b[1] - a[1]) * 0.4)} fill={mixHex(COLOR.inkDark, COLOR.ground, 0.3)} />;
  });

  // ---- the fence ----
  const postH = FENCE.postH * builtRows(Math.round(FENCE.postH / FENCE.bundleH), BEAT.postsFrom, BEAT.postsTo, S) / Math.round(FENCE.postH / FENCE.bundleH);
  const wallRows = Math.round(FENCE.wallH / FENCE.bundleH);
  const wallH = (FENCE.wallH * builtRows(wallRows, BEAT.wallFrom, BEAT.wallTo, S)) / wallRows;
  // the front wall stays under the car's wheel hubs on screen on every camera state (it never hides the wheels-to-body read)
  const hubW = CAR.tyreR * M + lift;
  const capFront = (cam.eye - ((cam.eye - hubW) * k0) / kz(FENCE.front)) / M - 0.04;
  const frontH = Math.max(0, Math.min(wallH, capFront));
  const innerX = FENCE.X - FENCE.bundleW / 2;
  const sideA = FENCE.front + FENCE.bundleW / 2;
  const sideB = FENCE.mid - FENCE.bundleW / 2;
  const midPosts = [-1, 1].map((sd) => <BuiltPost key={`m${sd}`} cam={cam} x={sd * FENCE.X} z={FENCE.mid} H={postH} seed={sd + 3} />);
  const frontPosts = [-1, 1].map((sd) => <BuiltPost key={`f${sd}`} cam={cam} x={sd * FENCE.X} z={FENCE.front} H={postH} seed={sd + 7} />);
  const sideWalls = [-1, 1].map((sd) => <MoneyWall key={`s${sd}`} cam={cam} a={[sd * FENCE.X, sideB]} b={[sd * FENCE.X, sideA]} H={wallH} seed={sd + 11} />);
  const frontWall = <MoneyWall cam={cam} a={[-innerX, FENCE.front]} b={[innerX, FENCE.front]} H={frontH} seed={5} />;

  // ---- the stands and their levers (car lane) ----
  const standTone = mixHex(COLOR.board, COLOR.inkDark, 0.45);
  const standLit = mixHex(COLOR.board, COLOR.cream, 0.15);
  const stands = STANDS.map((s, i) => {
    const top = -lift + 0.05 * M;
    const colW = 0.1 * M;
    const padW = 0.36 * M;
    const baseW = 0.62 * M;
    return (
      <g key={i}>
        <path d={`M${f3(s.x - baseW / 2)} 0L${f3(s.x - colW)} ${f3(-0.12 * M)}L${f3(s.x + colW)} ${f3(-0.12 * M)}L${f3(s.x + baseW / 2)} 0Z`} fill={standTone} />
        <rect x={f3(s.x - colW / 2)} y={f3(Math.min(-0.12 * M, top))} width={f3(colW)} height={f3(Math.max(0, -0.12 * M - top))} fill={standLit} />
        <rect x={f3(s.x - padW / 2)} y={f3(top - 0.045 * M)} width={f3(padW)} height={f3(0.045 * M)} rx={f3(0.015 * M)} fill={standTone} />
      </g>
    );
  });

  // the levers sit in front of the car (the stand handles stick out toward the camera), so the pull reads
  const levers = STANDS.map((s, i) => {
    const pivot: P2 = [s.x + s.dir * 0.12 * M, -0.1 * M];
    const lt = leverTop(i, S);
    return (
      <g key={i}>
        <path d={`M${f3(pivot[0])} ${f3(pivot[1])}L${f3(lt[0])} ${f3(lt[1])}`} stroke={mixHex(COLOR.board, COLOR.inkDark, 0.55)} strokeWidth={f3(0.075 * M)} strokeLinecap="round" />
        <path d={`M${f3(pivot[0])} ${f3(pivot[1])}L${f3(lt[0])} ${f3(lt[1])}`} stroke={mixHex(COLOR.board, COLOR.cream, 0.2)} strokeWidth={f3(0.025 * M)} strokeLinecap="round" transform={`translate(${f3(-0.012 * M)} ${f3(-0.012 * M)})`} />
        <circle cx={f3(lt[0])} cy={f3(lt[1])} r={f3(0.075 * M)} fill={mixHex(CLOTH.rust, COLOR.board, 0.2)} />
      </g>
    );
  });

  // ---- the easel ----
  const easel = (() => {
    const zE = EASEL.z;
    const lx = EASEL.x;
    const a = P(lx - EASEL.w / 2, EASEL.h1, zE);
    const b = P(lx + EASEL.w / 2, EASEL.h0, zE);
    const legs = [
      [P(lx - 0.38, 0, zE), P(lx - 0.18, EASEL.h0 + 0.2, zE)],
      [P(lx + 0.38, 0, zE), P(lx + 0.18, EASEL.h0 + 0.2, zE)],
    ];
    const lw = 0.05 * kz(zE) * M;
    const paper = [a[0] + (b[0] - a[0]) * 0.07, a[1] + (b[1] - a[1]) * 0.08, (b[0] - a[0]) * 0.86, (b[1] - a[1]) * 0.84];
    const sk = (ux: number, uy: number): P2 => [paper[0] + ux * paper[2], paper[1] + uy * paper[3]];
    const ink = mixHex(COLOR.inkDark, COLOR.board, 0.3);
    const carLine = [sk(0.12, 0.66), sk(0.3, 0.5), sk(0.52, 0.48), sk(0.88, 0.62), sk(0.86, 0.7), sk(0.12, 0.72)];
    return (
      <g>
        {legs.map(([p, q], i) => (
          <path key={i} d={`M${f3(p[0])} ${f3(p[1])}L${f3(q[0])} ${f3(q[1])}`} stroke={mixHex(COLOR.board, COLOR.cream, 0.2)} strokeWidth={f3(lw)} strokeLinecap="round" />
        ))}
        <rect x={f3(a[0])} y={f3(a[1])} width={f3(b[0] - a[0])} height={f3(b[1] - a[1])} rx={f3(lw * 0.5)} fill={mixHex(COLOR.board, COLOR.cream, 0.15)} />
        <rect x={f3(paper[0])} y={f3(paper[1])} width={f3(paper[2])} height={f3(paper[3])} fill="#FBF5EA" />
        <path d={`M${carLine.map((p) => `${f3(p[0])} ${f3(p[1])}`).join("L")}Z`} fill="none" stroke={ink} strokeWidth={f3(lw * 0.3)} strokeLinejoin="round" />
        {[sk(0.28, 0.76), sk(0.72, 0.76)].map((c, i) => (
          <circle key={i} cx={f3(c[0])} cy={f3(c[1])} r={f3(paper[3] * 0.08)} fill="none" stroke={ink} strokeWidth={f3(lw * 0.3)} />
        ))}
        <path d={`M${f3(sk(0.3, 0.48)[0])} ${f3(sk(0.3, 0.48)[1])}L${f3(sk(0.3, 0.18)[0])} ${f3(sk(0.3, 0.18)[1])}M${f3(sk(0.5, 0.48)[0])} ${f3(sk(0.5, 0.48)[1])}L${f3(sk(0.5, 0.18)[0])} ${f3(sk(0.5, 0.18)[1])}M${f3(sk(0.2, 0.16)[0])} ${f3(sk(0.2, 0.16)[1])}L${f3(sk(0.62, 0.16)[0])} ${f3(sk(0.62, 0.16)[1])}`} stroke={ink} strokeWidth={f3(lw * 0.3)} strokeLinecap="round" />
      </g>
    );
  })();

  // ---- the bubbles ----
  const states = BUBBLES.map((b) => ({ b, s: bubbleAt(b, S) }));
  const drawBubble = (b: BubbleSpec, s: NonNullable<BubbleState>) => {
    const crew = CREW[b.who];
    const head = engineerHead(crew.x * M, 0, SIZE, crew.face, poseOf(b.who, S));
    const from = toLane(cam, head[0], head[1], crew.z * M, s.z * M);
    const kB = kz(s.z);
    const bandB = amberBandFor(planeCam(cam, s.z * M));
    return (
      <OnLane key={b.key} cam={cam} z={s.z * M}>
        <g transform={s.squash > 0.001 ? `translate(${f3(s.x)} ${f3(s.y)}) scale(${f3(1 - s.squash)} ${f3(1 + s.squash * 0.6)}) translate(${f3(-s.x)} ${f3(-s.y)})` : undefined}>
          <IdeaBubble x={s.x} y={s.y} r={R_BUB} kind={b.kind} k={kB} amberBand={bandB} from={from} tail={s.tail} absorb={s.absorb} spin={b.kind === "fan" ? S * 6 : 0} wobble={3 * Math.sin(S / 9 + b.rise[0])} bold />
        </g>
      </OnLane>
    );
  };
  const bubblesBehind = (who: Crew["id"]) => states.filter((q) => q.s && q.s.behind && q.b.who === who).map((q) => drawBubble(q.b, q.s as NonNullable<BubbleState>));
  // bubbles over the car's lane and behind it are drawn before the cash wall; the perched ones (on the pillar tops) after it
  const bubblesFront = states.filter((q) => q.s && !q.s.behind && q.s.z > -0.6).map((q) => drawBubble(q.b, q.s as NonNullable<BubbleState>));
  const bubblesPerched = states.filter((q) => q.s && !q.s.behind && q.s.z <= -0.6).map((q) => drawBubble(q.b, q.s as NonNullable<BubbleState>));
  const crewNode = (id: Crew["id"]) => {
    const c = CREW[id];
    return (
      <g key={id}>
        {bubblesBehind(id)}
        <OnLane cam={cam} z={c.z * M}>
          <Engineer x={c.x * M} y={0} size={SIZE} face={c.face} spec={c.spec} pose={poseOf(id, S)} />
        </OnLane>
      </g>
    );
  };

  // ---- the sign: a pole just outside the front-right corner (rises with the pillars); the board slides in along its arm ----
  const poleRows = Math.round(FENCE.poleH / FENCE.bundleH);
  const poleH = (FENCE.poleH * builtRows(poleRows, BEAT.postsFrom, BEAT.postsTo, S)) / poleRows;
  const signIn = ss5(BEAT.signFrom, BEAT.signTo, S);
  const sign = (() => {
    const zS = SIGN.z;
    const s = kz(zS) * M;
    const iron = mixHex(COLOR.board, COLOR.inkDark, 0.4);
    const pb = P(FENCE.poleX, 0, zS);
    const pt = P(FENCE.poleX, poleH, zS);
    const pw = 0.12 * s;
    const armUp = poleH >= FENCE.poleH - 0.01;
    const slide = (1 - signIn) * SIGN.slide;
    const sway = 0.6 * Math.sin(S / 21) + 2.5 * Math.sin(clamp01((S - BEAT.signTo + 2) / 12) * Math.PI) * Math.exp(-Math.max(0, S - BEAT.signTo) / 8) * (S > BEAT.signTo - 2 ? 1 : 0);
    const a = P(SIGN.x0 + slide, SIGN.h1, zS);
    const b = P(SIGN.x1 + slide, SIGN.h0, zS);
    const cx = (a[0] + b[0]) / 2;
    const w = b[0] - a[0];
    const h = b[1] - a[1];
    const arm0 = P(FENCE.poleX, FENCE.poleH - 0.1, zS);
    const arm1 = P(SIGN.x0 - 0.1, FENCE.poleH - 0.1, zS);
    const hangY = arm0[1];
    const textPx = 0.48 * s;
    return (
      <g>
        <rect x={f3(pb[0] - pw / 2)} y={f3(pt[1])} width={f3(pw)} height={f3(Math.max(0, pb[1] - pt[1]))} fill={iron} />
        {armUp ? <rect x={f3(arm1[0])} y={f3(hangY - 0.045 * s)} width={f3(arm0[0] - arm1[0])} height={f3(0.09 * s)} rx={f3(0.03 * s)} fill={iron} /> : null}
        {signIn > 0.001 ? (
          <g transform={`rotate(${f3(sway)} ${f3(cx)} ${f3(hangY)})`}>
            {[0.12, 0.88].map((t, i) => (
              <path key={i} d={`M${f3(a[0] + w * t)} ${f3(hangY)}L${f3(a[0] + w * t)} ${f3(a[1])}`} stroke={iron} strokeWidth={f3(0.035 * s)} />
            ))}
            <rect x={f3(a[0] + 0.05 * s)} y={f3(a[1] + 0.06 * s)} width={f3(w)} height={f3(h)} rx={f3(0.07 * s)} fill={COLOR.shadow} opacity={0.25} style={{ filter: `blur(${f3(0.04 * s)}px)` }} />
            <rect x={f3(a[0])} y={f3(a[1])} width={f3(w)} height={f3(h)} rx={f3(0.07 * s)} fill={`url(#${uid}sign)`} />
            <rect x={f3(a[0] + 0.06 * s)} y={f3(a[1] + 0.06 * s)} width={f3(w - 0.12 * s)} height={f3(h - 0.12 * s)} rx={f3(0.04 * s)} fill="none" stroke={mixHex(COLOR.creamFoot, COLOR.board, 0.4)} strokeWidth={f3(0.022 * s)} />
            <text x={f3(cx)} y={f3(a[1] + h / 2 + textPx * 0.36)} fontFamily={FONT_NUM} fontSize={f3(textPx)} letterSpacing="-0.015em" textAnchor="middle" fill={COLOR.inkDark} style={{ fontFeatureSettings: '"lnum" 1' }}>
              $200M
            </text>
          </g>
        ) : null}
      </g>
    );
  })();

  return (
    <AbsoluteFill style={{ backgroundColor: SKY.haze, overflow: "hidden" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id={`${uid}sky`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1250)} x2="0" y2={f3(hor)}>
            <stop offset="0" stopColor={SKY.top} />
            <stop offset="0.24" stopColor={SKY.upper} />
            <stop offset="0.46" stopColor={SKY.amber} />
            <stop offset="0.66" stopColor={SKY.mid} />
            <stop offset="0.83" stopColor={SKY.low} />
            <stop offset="0.93" stopColor={SKY.glow} />
            <stop offset="1" stopColor={SKY.haze} />
          </linearGradient>
          <radialGradient id={`${uid}sun`} gradientUnits="userSpaceOnUse" cx={220} cy={f3(hor - 330)} r={760}>
            <stop offset="0" stopColor={SKY.sun} stopOpacity="0.7" />
            <stop offset="0.35" stopColor={SKY.sun} stopOpacity="0.24" />
            <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}gnd`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor)} x2="0" y2="1920">
            <stop offset="0" stopColor={mixHex(GRASS.far, SKY.haze, 0.5)} />
            <stop offset="0.25" stopColor={GRASS.far} />
            <stop offset="0.6" stopColor={GRASS.mid} />
            <stop offset="1" stopColor={mixHex(GRASS.near, COLOR.shadow, 0.18)} />
          </linearGradient>
          <linearGradient id={`${uid}wall`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(P(0, G.H, G.zB)[1])} x2="0" y2={f3(P(0, 0, G.zB)[1])}>
            <stop offset="0" stopColor={DARK.wallTop} />
            <stop offset="1" stopColor={DARK.wall} />
          </linearGradient>
          <linearGradient id={`${uid}fac`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(P(0, G.T, G.zF)[1])} x2="0" y2={f3(P(0, 0, G.zF)[1])}>
            <stop offset="0" stopColor={mixHex(COLOR.board, COLOR.cream, 0.55)} />
            <stop offset="1" stopColor={mixHex(COLOR.board, COLOR.cream, 0.25)} />
          </linearGradient>
          <linearGradient id={`${uid}sign`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(P(0, SIGN.h1, SIGN.z)[1])} x2="0" y2={f3(P(0, SIGN.h0, SIGN.z)[1])}>
            <stop offset="0" stopColor={mixHex(COLOR.cream, "#FFF4E2", 0.3)} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
        </defs>
        {sky}
        <rect x={-60} y={f3(hor - 2)} width={1200} height={f3(Math.max(0, 2000 - hor))} fill={`url(#${uid}gnd)`} />
        <g style={{ filter: "blur(1.2px)" }}>{trees}</g>
        <rect x={-60} y={f3(hor - 6)} width={1200} height={30} fill={SKY.haze} opacity={0.5} style={{ filter: "blur(10px)" }} />
        <path d={apron} fill={APRON} />
        <path d={apronLine} fill={mixHex(CLOTH.sage, COLOR.cream, 0.35)} opacity={0.8} />
        {/* the garage: roof, back wall, floor, side walls, ceiling (dark, so the cream car reads) */}
        <path d={roof} fill={mixHex(COLOR.board, COLOR.cream, 0.4)} />
        <path d={wall} fill={`url(#${uid}wall)`} />
        <path d={wallBand} fill={mixHex(CLOTH.sage, COLOR.ground, 0.35)} />
        <path d={peg} fill={mixHex(COLOR.board, COLOR.ground, 0.3)} />
        {tools}
        <path d={floorD} fill={DARK.floor} />
        <path d={sideL} fill={DARK.sideL} />
        <path d={sideR} fill={DARK.sideR} />
        <path d={ceil} fill={DARK.ceil} />
        {lights}
        {tyreStack}
        <path d={drum} fill={mixHex(COLOR.board, COLOR.ground, 0.2)} />
        <path d={facade} fill={`url(#${uid}fac)`} />
        <path d={fasciaBand} fill={mixHex(CLOTH.sage, COLOR.cream, 0.1)} />
        <path d={capD} fill="#FFF6E6" opacity={0.8} />
        {/* the crew (far to near) and the easel, all behind the car */}
        <g>{easel}</g>
        {crewNode("designer")}
        {crewNode("lead")}
        {crewNode("mech")}
        {/* THE CAR, the nearest subject, on its stands */}
        <OnLane cam={cam} z={0}>
          {stands}
          <WildCar x={CAR_X} y={0} k={k0} amberBand={band} lift={lift} wing={parts.wing} wing2={parts.wing2} fan={parts.fan} wheels={parts.wheels} fanSpin={fanSpin} fanSpeed={parts.fanSpeed} />
          {levers}
        </OnLane>
        {bubblesFront}
        {/* the cash wall (in front of the car's lane): side runs, the mid pillars, the front run, the front pillars */}
        {sideWalls}
        {midPosts}
        {frontWall}
        {frontPosts}
        {sign}
        {bubblesPerched}
        {tufts}
      </svg>
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <Grain S={S} />
    </AbsoluteFill>
  );
};

/** the kit's grain on twos (as StoutStage / TrackStage) */
const Grain: React.FC<{ S: number }> = ({ S }) => {
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hash(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash(g2 + 7) * 2 - 1) * GRAIN.travel;
  return (
    <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
      <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (1080 - GROUND.W) / 2 + grx, top: (1920 - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
    </AbsoluteFill>
  );
};

export default OpenUnderTheCap;
