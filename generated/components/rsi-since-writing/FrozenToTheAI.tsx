// ---------------------------------------------------------------------------
// FrozenToTheAI (rsi-since-writing, cut 102). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 131 frames.
// One office inside the misty teal air (AirStage, palette A, the shared world sinceWritingWorld + sinceWritingFolk,
// read-only) on a londonDepth one-point perspective, from the kit kits/dwarkesh-3d/dwarkesh3d. Cut 1's office: the same
// room (window high on the left, morning sun 0.15), the same human v0, the same plain cream mug (1.45x).
//
// CHECK LINE: "To an AI thinking thousands of times faster, we would look frozen in time."
//
// THE LINE: "it seems extremely likely that future AIs will be thinking at least thousands of times faster than humans. To"
// WORD -> FRAME (f0 = sequence frame 2468, 102.9362 s): off -9 · it -1 · seems 1 · extremely 5 · likely 14 · that 24 ·
// future 31 · AIs 37 · will 48 · be 51 · thinking 54 · at 64 · least 75 · thousands 81 · of 92 · times 97 ·
// faster 101 · than 110 · humans. 115 · To 125 · (slot ends 131) put 132
// DURATION: the slot 102.9362 -> 108.4000 s (sequence frames 2468-2599) = 131 frames at 24000/1001 (f0..f130).
//
// THE MOTION: you (Human v0) stand FROZEN mid-pour: the glass pot tipped over the empty cream mug in your other hand,
// the front of the coffee column hanging in the air above the mug (it has not reached it yet), droplets suspended beside
// it and in the gap below its front, your eyes mid-blink; the wall clock's second hand advances 1/1000 of its pace
// (still); the air's motes nearly still (the grain keeps running on twos). THE ROBOT (tenEarthsBot v0, the AI; revision
// 1 swaps it in for the Genius, the concept unchanged) moves at normal speed: on f0 it has just walked out from behind
// you (deeper in the room, Z 140), a quick short-legged walk with planted feet, its head turned round to the pour and
// its screen eyes at the screen's left edge on the hanging droplets (f0-20); the head comes back round dipping, the
// eyes leading right (f20-28, never on us), into near-profile toward its standing desk; its stride eases to a planted
// stop behind the desk (f26-38), it turns three-quarter toward us (f32-44) and works in a flurry, eyes down on the
// sheets: a two-hand relay, the left hand takes the top sheet off the IN pile (its left) up to a glance-read in front
// of it, the right hand takes it on and lays it on the DONE pile (its right), one sheet every 2.4 frames from f50,
// every 1.6 frames from "times" (the pace steps up f87-98 as the plate lands) to the end: 42 sheets, IN 48 -> 5,
// DONE 4 -> 46. Faint ghosts trail the flying sheet and the hands smear. On "thousands of times faster" a plate
// "1,000×" slides up above it (f86-98). Camera: one continuous move from close on your frozen face and the pour
// (k 2.3) right and back (f4-84, one lobe) to frame you and the busy robot side by side (k 1.98), then a slow creep.
// CAUSE -> EFFECT: a sheet leaves the IN pile on the frame the left hand starts it (the pile steps down that frame) and
// rides the left hand by its left end; at the read point the right hand holds its right end; it lands flat on the DONE
// pile on the frame its carry ends (the pile steps up). Every hand path is continuous from sheet to sheet.
// Orange = the AI only (the robot); the sheets, the plate and the mug cream; you in white and slate.
//
// CUT-LOCAL DRAWING (the world modules are unchanged): the big cream mug (cut 1's, copied), the coffee pot at 1.3x
// (sinceWritingProps' geometry, copied, with a fine edge so the glass reads), the frozen stream (FrozenStream: a thicker
// column than the module's CoffeeStream, with a hanging front and fixed droplets), the standing desk (AirBox), the frozen
// air (the AirStage's motes run on a near-still clock; its grain is off and redrawn here on twos), the walk's stop (the
// stance ankle integrated into `at` while the stride eases out), the sheet work (covidGripTo on the sheet's grips, then
// each wrist nudged until the drawn mitten sits on its grip), thin piles (ThinStack: the module's SheetStack with a
// 0.6-unit sheet so 48 sheets stay under the robot's short reach), the ghosts and the hand smear.
// CHECKS: scripts/clips/rsi-since-writing/check-frozen-to-the-ai.ts (camera, faces / pour / plate vs the keep-in box and
// the caption bands, plate vs clock and faces, stance slip, both hands on their grips, a per-anchor pop detector).
//
// DEPTH: cut 1's: eye Y -260, dRef 1700 at kRef 1.32, dolly 0.5, fog by the eye (officeScene(0.15)). You X -170 Z -40
// (dir 1); the robot (240 units, 1.35 m) walks at Z 140 from X 38 and stops at X ~125 behind the standing desk (top
// Y -80 at its reach, X 18..228, Z 50..112); IN pile X 85, DONE pile X 179 (Z 81, yaw 90), the read point X 133 Y -103
// Z 70; the clock on the back wall X -75 Y -500; the plate X 130, Y -330, Z 140 (cap ~75 px).
//
// SOURCES: none on screen beyond the speaker's own figure ("at least thousands of times": 1,000×).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirShadow, AirStage, WorldSvg, airWorldOf, makeCamera, mixHex, swayCam, type AirWorld, type DepthOpts, type Persp } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BOT_SHADOW, BOT_SKIN, Bot, botAnchorsLocal, botGripTo, botRig } from "../rsi-ten-earths/tenEarthsBot";
import { MAT_LAMINATE } from "../rsi-ten-earths/tenEarthsHall";
import { HUMAN_POSES, buildHuman, type HumanPose, type MugState, type P2, type PotState } from "./sinceWritingFolk";
import { CovidPaint } from "../kyle-covid/covidFolk";
import { POSES, breathe, closedD, covidGripTo, ellPts, lerpPose, tubeD, type CShape, type CovidPose } from "../kyle-covid/covidFolkBody";
import { add, mul, rot, sub } from "../kits/maps/stringsMotion";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";
import { MUG, mugShapes, potShapes } from "./sinceWritingProps";
import { MAT_FRAME, MAT_LEG, OFFICE, OfficeRoom, OfficeShafts, OfficeTint, Plate, SHEET, WorkSheet, officeScene, plateT, type SheetPose } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 131;
export const schema = z.object({ guides: z.boolean().default(false) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, x: number) => {
  const u = c01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (x: number) => sst(0, 1, x);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const frac = (v: number) => v - Math.floor(v);

// ---------------------------------------------------------------------------
// THE SET (cut 1's office)
// ---------------------------------------------------------------------------
export const SUN_T = 0.15;
export const DEPTH: DepthOpts = { eyeY: -260, dRef: 1700, kRef: 1.32, dolly: 0.5 };
const ROOM = { ...OFFICE, win: { ...OFFICE.win, x0: -660, x1: -130, sill: -330, head: -600 } };
export const YOU = { X: -170, Z: -40 };
export const AI_Z = 140;
/** the standing desk: top surface Y (up -), X span, Z span */
export const DESK = { top: -80, th: 6, x0: 18, x1: 228, z0: 50, z1: 112 };
export const IN = { X: 85, Z: 81, yaw: 90, seed: 11, n0: 48 };
export const DONE = { X: 179, Z: 81, yaw: 90, seed: 5, n0: 4 };
export const CLOCK = { X: -75, Y: -500, R: 48 };
export const PLATE = { X: 130, Y: -330, Z: AI_Z, f0: 86, dur: 12, size: 64 };
/** the frozen clock: 9:41:17, the second hand at 1/1000 of its pace */
const clockT = (f: number) => 9 * 3600 + 41 * 60 + 17.3 + f / FPS / 1000;
/** the air's clock (motes): nearly still */
const airClock = (f: number) => 400 + f * 0.02;

// ---------------------------------------------------------------------------
// THE CAMERA: close on your face and the stream (a creep, f0-8), one move right and back (f8-104) that frames you and
// the robot at its desk, a slow creep to the end.
// ---------------------------------------------------------------------------
const camKeys = makeCamera([
  { f: 0, k: 2.3, wx: -125, wy: -235, sx: 540, sy: 760 },
  { f: 4, k: 2.29, wx: -123, wy: -236, sx: 540, sy: 760 },
  { f: 36, k: 2.12, wx: -20, wy: -270, sx: 540, sy: 720 },
  { f: 84, k: 1.98, wx: 5, wy: -285, sx: 540, sy: 700 },
  { f: 130, k: 1.95, wx: 7, wy: -285, sx: 540, sy: 700 },
]);
export const camOf = (f: number) => swayCam(camKeys(f), f);
const REST = camOf(0);

// ---------------------------------------------------------------------------
// YOU, FROZEN: pour(1, 0.55) held (breath frozen), the eyes mid-blink, the cream mug at 1.45x in the far hand, the
// glass pot at 1.3x raised higher over it (a long, readable stream)
// ---------------------------------------------------------------------------
export const MUG_S = 1.45;
const BIG = { r: MUG.r * MUG_S, h: MUG.h * MUG_S, out: MUG.handleOut * MUG_S };
const CREAM_MUG = { glaze: "#ECE5D4", lip: "#FBF8EF", inner: "#B5AA97", coffee: "#4A3426", crema: "#6B5038", edge: "#5F6A66" };
const bigPt = (m: MugState, p: P2): P2 => add(m.base, rot(p, m.tilt));
const bigHandle = (m: MugState): P2 => bigPt(m, [m.handle * (BIG.r + BIG.out * 0.75), -BIG.h * 0.55]);
export const bigMouth = (m: MugState) => ({ c: bigPt(m, [0, -BIG.h]), rx: BIG.r * 0.92, ry: BIG.r * 0.3, rot: m.tilt });
const bigMugShapes = (m: MugState): CShape[] => {
  const { r, h, out: ho } = BIG;
  const T = (x: number, y: number) => bigPt(m, [x, y]);
  const out: CShape[] = [];
  const hs = m.handle;
  const hp: P2[] = [T(hs * (r - 1), -h * 0.82), T(hs * (r + ho * 0.85), -h * 0.78), T(hs * (r + ho), -h * 0.52), T(hs * (r + ho * 0.7), -h * 0.27), T(hs * (r - 1), -h * 0.22)];
  out.push({ d: tubeD(hp, [3.4, 3.6, 3.6, 3.4, 3.2].map((w) => w * MUG_S)), fill: CREAM_MUG.glaze, sh: 0.6 });
  const ry = r * 0.3;
  const body: P2[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI - (Math.PI * i) / 10;
    body.push(T(Math.cos(a) * r * 0.95, Math.sin(a) * ry * 0.95 - 0.5));
  }
  body.push(T(r, -h));
  for (let i = 1; i < 10; i++) {
    const a = (Math.PI * i) / 10;
    body.push(T(Math.cos(a) * r, -h - Math.sin(a) * ry));
  }
  body.push(T(-r, -h));
  const bodyD = closedD(body, 0.5);
  out.push({ d: bodyD, fill: CREAM_MUG.glaze });
  out.push({ d: bodyD, fill: CREAM_MUG.edge, det: 1.1, keep: true, op: 0.45 });
  const mo = bigMouth(m);
  const mouthD = closedD(ellPts(mo.c, mo.rx, mo.ry, mo.rot, 18), 0.9);
  out.push({ d: mouthD, fill: CREAM_MUG.inner, sh: 0 });
  const lv = c01(m.level);
  if (lv > 0.02) {
    const drop = (1 - lv) * ry * 1.6;
    const cc = bigPt(m, [0, -h + drop]);
    out.push({ d: closedD(ellPts(cc, mo.rx * 0.97, mo.ry * 0.97, mo.rot, 18), 0.9), fill: mixC(CREAM_MUG.coffee, CREAM_MUG.crema, 0.25), sh: 0, clip: mouthD });
  }
  out.push({ d: closedD(ellPts(mo.c, mo.rx * 1.02, mo.ry * 1.05, mo.rot, 18), 0.9), fill: CREAM_MUG.lip, det: 1.4, keep: true, op: 0.85 });
  return out;
};

// the pot (sinceWritingProps' carafe geometry, copied and scaled by POT_S about its grip)
export const POT_S = 1.3;
const POT_INK = { glass: "#DCE2D9", band: "#4E5558", coffee: "#4A3426", sheen: "#F7F4EA" };
const POT_BODY: P2[] = [
  [15, -14],
  [15, -8],
  [10, -2],
  [8.5, 8],
  [11, 17],
  [18, 22],
  [30, 22],
  [37, 17],
  [39.5, 8],
  [38, -2],
  [33, -8],
  [33, -14],
];
const POT_BAND: P2[] = [
  [13.5, -21],
  [34.5, -21],
  [35, -13],
  [13, -13],
];
const POT_LIP: P2[] = [
  [33.5, -21],
  [41.5, -24.5],
  [41, -20.5],
  [35, -15],
];
const POT_HANDLE: P2[] = [
  [14, -18],
  [3.5, -18.5],
  [-1, -8],
  [0, 6],
  [9.5, 11],
];
const POT_GRIP: P2 = [-0.6, -4];
const POT_SPOUT: P2 = [41.6, -23.4];
const potPt = (p: PotState, q: P2): P2 => add(p.grip, rot([(q[0] - POT_GRIP[0]) * p.sx * POT_S, (q[1] - POT_GRIP[1]) * POT_S], p.tilt));
const bigPotSpout = (p: PotState) => potPt(p, POT_SPOUT);
const bigPotGripForSpout = (q: P2, tilt: number): P2 => add(q, mul(rot([(POT_SPOUT[0] - POT_GRIP[0]) * POT_S, (POT_SPOUT[1] - POT_GRIP[1]) * POT_S], tilt), -1));
const clipBelow = (poly: P2[], y0: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ain = a[1] >= y0;
    const bin = b[1] >= y0;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (y0 - a[1]) / (b[1] - a[1]);
      out.push([a[0] + (b[0] - a[0]) * t, y0]);
    }
  }
  return out;
};
const densify = (poly: P2[], n = 4): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
};
const bigPotShapes = (p: PotState): CShape[] => {
  const T = (q: P2) => potPt(p, q);
  const out: CShape[] = [];
  out.push({ d: tubeD(POT_HANDLE.map(T), [3.6, 3.8, 4, 3.8, 3.4].map((w) => w * POT_S)), fill: POT_INK.band, sh: 0.4 });
  const potBody = closedD(densify(POT_BODY).map(T), 0.6);
  out.push({ d: potBody, fill: POT_INK.glass, sh: 0.35, op: 0.8 });
  out.push({ d: potBody, fill: POT_INK.band, det: 1.1, keep: true, op: 0.55 });
  const lv = c01(p.level);
  if (lv > 0.02) {
    const mid = T([24, 22 - lv * 30]);
    const liq = clipBelow(densify(POT_BODY, 6).map(T), mid[1]);
    if (liq.length > 2) out.push({ d: closedD(liq, 0.4), fill: POT_INK.coffee, sh: 0.5 });
  }
  out.push({ d: tubeD([T([13, -6]), T([11.5, 4]), T([13, 13])], [1.4, 1.8, 1.2].map((w) => w * POT_S)), fill: POT_INK.sheen, sh: 0, op: 0.55 });
  out.push({ d: closedD(POT_LIP.map(T), 0.3), fill: mixC(POT_INK.glass, POT_INK.band, 0.25), sh: 0.3, op: 0.85 });
  out.push({ d: closedD(POT_BAND.map(T), 0.35), fill: POT_INK.band, sh: 0.5 });
  return out;
};

/** the stream's fall from the spout to the mouth (units) */
export const STREAM_H = 68;
/** the pot's tip (deg) */
export const POT_TILT = 40;
/** the frozen moment (the pose's frame: its breath held) */
const FROZEN_F = 37;
export const FROZEN = (() => {
  const src = HUMAN_POSES.pour(1, 0.55, FROZEN_F);
  const q0 = src.pose;
  const ch = buildHuman(0, q0).anchors.chest;
  // the mug in the far hand in front of his belly (as pour), the pot raised over it, tipped to 75 deg
  const mugGrip: P2 = add(ch, [64, 76]);
  const m0: MugState = { base: [0, 0], tilt: 0, level: 0, handle: -1 };
  const mug: MugState = { ...m0, base: sub(mugGrip, bigHandle(m0)) };
  const mouth = bigMouth(mug).c;
  const tilt = POT_TILT;
  const spout: P2 = add(mouth, [-3, -STREAM_H]);
  const potGrip = bigPotGripForSpout(spout, tilt);
  const pot: PotState = { grip: potGrip, tilt, level: 0.6, sx: 1 };
  const q = covidGripTo("officer", 3, q0, { L: potGrip, R: mugGrip }, [0, 0], 1) as HumanPose;
  // mid-blink: the lids half down, the eyes on the mug
  const pose: HumanPose = { ...q, armL: { ...q.armL, fist: q0.armL.fist, hand: q0.armL.hand }, armR: { ...q.armR, fist: q0.armR.fist, hand: q0.armR.hand }, mug: src.mug, pot: src.pot, lids: 0.55, look: [0.3, 0.75] as P2 };
  return { pose, mug, pot, spout: bigPotSpout(pot), mouth };
})();
/** you, painted: the figure's build with the module's mug and pot swapped for the big cream mug and the big pot */
const You: React.FC<{ at: P2; scale: number; fog: ReturnType<AirWorld["folkFog"]>; unitPx: number }> = ({ at, scale, fog, unitPx }) => {
  const b = buildHuman(0, FROZEN.pose, { frame: FROZEN_F });
  const sm = mugShapes(FROZEN.pose.mug as MugState);
  const sp = potShapes(FROZEN.pose.pot as PotState);
  const i = b.shapes.findIndex((s) => s.d === sm[0].d);
  const shapes = i >= 0 ? [...b.shapes.slice(0, i), ...bigMugShapes(FROZEN.mug), ...bigPotShapes(FROZEN.pot), ...b.shapes.slice(i + sm.length + sp.length)] : [...b.shapes, ...bigMugShapes(FROZEN.mug), ...bigPotShapes(FROZEN.pot)];
  return <CovidPaint shapes={shapes} at={at} scale={scale} uid="you" fog={fog} unitPx={unitPx} />;
};

// ---------------------------------------------------------------------------
// THE FROZEN STREAM (cut-local): a thick coffee ribbon from the spout to the mouth (figure units, drawn at the
// figure's at/scale), frozen ripples, suspended droplets with a cream glint, a frozen splash crown at the rim
// ---------------------------------------------------------------------------
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const COFFEE = "#4A3426";
const COFFEE_LIT = "#8A6A4E";
const GLINT = "#F3EBDD";
/** how far down the fall the stream's front hangs (0 spout .. 1 mouth): the front has not reached the mug */
export const FRONT_S = 0.6;
/** the stream's half width (units) at the spout's lip, and at the front's neck */
const W_TOP = 6.6;
const W_LOW = 4.4;
/** droplets beside the column (s along the fall, side, offset units, radius units) */
const SIDE_DROPS: { s: number; side: number; off: number; r: number }[] = [
  { s: 0.16, side: 1, off: 12.5, r: 3.4 },
  { s: 0.32, side: -1, off: 13.5, r: 2.8 },
  { s: 0.47, side: 1, off: 14.5, r: 4 },
];
/** droplets in the gap below the front, falling toward the mug (s, x offset units, radius units) */
const GAP_DROPS: { s: number; dx: number; r: number }[] = [
  { s: 0.72, dx: -1.5, r: 4.8 },
  { s: 0.84, dx: 3, r: 3.6 },
  { s: 0.94, dx: -1, r: 2.6 },
];
const FrozenStream: React.FC<{ at: P2; scale: number }> = ({ at, scale }) => {
  const W = (p: P2): P2 => [at[0] + p[0] * scale, at[1] + p[1] * scale];
  const from = FROZEN.spout;
  const to: P2 = add(FROZEN.mouth, [0, -2]);
  const ctl: P2 = [from[0] + 9, from[1] + (to[1] - from[1]) * 0.28];
  const B = (s: number): P2 => [(1 - s) * (1 - s) * from[0] + 2 * (1 - s) * s * ctl[0] + s * s * to[0], (1 - s) * (1 - s) * from[1] + 2 * (1 - s) * s * ctl[1] + s * s * to[1]];
  const N = 36;
  const L: P2[] = [];
  const R: P2[] = [];
  const hi: P2[] = [];
  const half = (s: number) => {
    const u = s / FRONT_S;
    // wide at the lip, narrowing as it falls, frozen beads along it, a neck and a round bulb at the front
    const base = mix(W_TOP, W_LOW, Math.sqrt(u)) * (1 + 0.14 * Math.sin(u * 17 + 0.8) * sst(0.1, 0.3, u)) * (1 + 0.3 * (1 - sst(0, 0.14, u)));
    return base * (1 - 0.22 * sst(0.7, 0.86, u) + 0.45 * sst(0.86, 1, u));
  };
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * FRONT_S;
    const p = B(s);
    const q = B(Math.min(1, s + 0.01));
    const p0 = B(Math.max(0, s - 0.01));
    const tx = q[0] - p0[0];
    const ty = q[1] - p0[1];
    const tl = Math.hypot(tx, ty) || 1;
    const n: P2 = [-ty / tl, tx / tl];
    const w = half(s);
    L.push(W([p[0] + n[0] * w, p[1] + n[1] * w]));
    R.push(W([p[0] - n[0] * w, p[1] - n[1] * w]));
    hi.push(W([p[0] - n[0] * w * 0.45, p[1] - n[1] * w * 0.45]));
  }
  // the front's round cap: a half circle below the last section
  const tip = B(FRONT_S);
  const tq = B(FRONT_S - 0.01);
  const ang = Math.atan2(tip[1] - tq[1], tip[0] - tq[0]);
  const wEnd = half(FRONT_S);
  const cap: P2[] = [];
  for (let i = 1; i < 12; i++) {
    const a = ang + Math.PI / 2 - (Math.PI * i) / 12;
    cap.push(W([tip[0] + Math.cos(a) * wEnd, tip[1] + Math.sin(a) * wEnd * 1.15]));
  }
  const body = `M${L.map(Pt).join("L")}L${cap.reverse().map(Pt).join("L")}L${[...R].reverse().map(Pt).join("L")}Z`;
  const drop = (c: P2, r: number, key: string) => {
    const C = W(c);
    const rr = r * scale;
    return (
      <g key={key}>
        <ellipse cx={f2(C[0])} cy={f2(C[1])} rx={f2(rr * 0.9)} ry={f2(rr * 1.12)} fill={COFFEE} />
        <ellipse cx={f2(C[0] + rr * 0.25)} cy={f2(C[1] + rr * 0.3)} rx={f2(rr * 0.5)} ry={f2(rr * 0.55)} fill={COFFEE_LIT} opacity={0.4} />
        <circle cx={f2(C[0] - rr * 0.32)} cy={f2(C[1] - rr * 0.4)} r={f2(rr * 0.3)} fill={GLINT} opacity={0.9} />
      </g>
    );
  };
  const side = SIDE_DROPS.map((d, i) => {
    const p = B(d.s);
    return drop([p[0] + d.side * d.off, p[1] + (i % 2 ? 2 : -1.5)], d.r, `d${i}`);
  });
  const gap = GAP_DROPS.map((d, i) => {
    const p = B(d.s);
    return drop([p[0] + d.dx, p[1]], d.r, `g${i}`);
  });
  const glint = W([tip[0] - wEnd * 0.4, tip[1] - wEnd * 0.1]);
  return (
    <g>
      <path d={body} fill={COFFEE} />
      <path d={`M${hi.slice(2, -4).map(Pt).join("L")}`} stroke={COFFEE_LIT} strokeOpacity={0.75} strokeWidth={f2(1.4 * scale)} fill="none" strokeLinecap="round" />
      <path d={`M${hi.slice(3, -6).map(Pt).join("L")}`} stroke={GLINT} strokeOpacity={0.6} strokeWidth={f2(0.55 * scale)} fill="none" strokeLinecap="round" strokeDasharray={`${f2(6 * scale)} ${f2(8 * scale)}`} />
      <circle cx={f2(glint[0])} cy={f2(glint[1])} r={f2(wEnd * 0.32 * scale)} fill={GLINT} opacity={0.85} />
      {side}
      {gap}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE ROBOT: a walk with planted feet (the robot's own stance ankle, botRig, integrated into `at`), a glance back at
// the droplets, a stop (the stride eases to nothing over one step), a turn three-quarter toward us, then the sheet work.
// ---------------------------------------------------------------------------
/** walk cadence (x the cast's 24-frame cycle: the robot's quick short-legged walk) */
const CAD = 1.8;
const PH0 = 0.08;
const STOP0 = 26;
const STOP1 = 38;
/** the walk-to-work blend */
const TURN0 = 32;
const TURN1 = 44;
export const X_START = 38;
const walkPhase = (f: number) => PH0 + (f * CAD) / 24;
const walkAmt = (f: number) => 1 - sst(STOP0, STOP1, f);
const walkRaw = (f: number): CovidPose => POSES.walk(1, walkPhase(Math.min(f, STOP1)), walkAmt(f));
/** at's x shift (units) so the stance foot stays planted: the integral of the stance ankle's travel */
const SHIFT: number[] = (() => {
  const SUB = 6;
  const out: number[] = [0];
  const ankles = (f: number): [number, number] => {
    const r = botRig(walkRaw(f));
    return [r.legL.A[0], r.legR.A[0]];
  };
  let s = 0;
  let prev = ankles(0);
  for (let f = 0; f < DURATION + 2; f++) {
    for (let k = 1; k <= SUB; k++) {
      const a = f + (k - 1) / SUB;
      const b = f + k / SUB;
      const cur = ankles(b);
      const lA = frac(walkPhase(Math.min(a, STOP1))) < 0.5;
      const lB = frac(walkPhase(Math.min(b, STOP1))) < 0.5;
      if (lA === lB) s -= lA ? cur[0] - prev[0] : cur[1] - prev[1];
      prev = cur;
    }
    out.push(s);
  }
  return out;
})();
export const aiX = (f: number) => {
  const i = Math.max(0, Math.min(SHIFT.length - 2, Math.floor(f)));
  return X_START + mix(SHIFT[i], SHIFT[i + 1], f - i);
};
export const AI_STOP_X = X_START + SHIFT[STOP1 + 1];

/** the glance back at the droplets while it walks past */
const glanceAt = (f: number) => 1 - sst(20, 28, f);

// ---- the sheet work: a relay flurry ----
// The IN pile on its left, the DONE pile on its right, the read point between them in front of its chest. Sheet i
// rides the LEFT hand (by its left end) off the IN top up to the read point, rolled up to face it (u 0-0.5), where the
// RIGHT hand takes its right end and lays it on the DONE top (u 0.5-1); meanwhile the left hand drops back to the next
// IN sheet and the right hand comes back up to the read point. The hands never cross; every path is continuous across
// sheets (a sheet's lay grip IS the right hand's next start, the next IN top the left hand's return).
/** one sheet's thickness in these piles (a ream reads as a ream: the module's 2.5 would stack 50 sheets shoulder high) */
export const T_SHEET = 0.6;
const jit = (i: number, seed: number) => ({ dx: (random(`sw-jx${seed}-${i}`) - 0.5) * 4, dz: (random(`sw-jz${seed}-${i}`) - 0.5) * 4, dyaw: (random(`sw-jy${seed}-${i}`) - 0.5) * 5 });
const thinTop = (X: number, Z: number, n: number, Y: number, yaw: number, seed: number): SheetPose => {
  const i = Math.max(0, Math.round(n) - 1);
  const j = jit(i, seed);
  return { X: X + j.dx, Y: Y - (i + 1) * T_SHEET, Z: Z + j.dz, yaw: yaw + j.dyaw, pitch: 0, roll: 0, curl: 0 };
};
const inTop = (n: number) => thinTop(IN.X, IN.Z, n, DESK.top, IN.yaw, IN.seed);
const doneTop = (n: number) => thinTop(DONE.X, DONE.Z, n, DESK.top, DONE.yaw, DONE.seed);
/** the read point: in front of its chest, the sheet rolled up toward it and us */
export const R0 = { X: 133, Y: -103, Z: 70, roll: 64 };
export const WORK0 = 44;
/** sheets per frame: one every 2.4 frames from f50, one every 1.6 from "times" (f98) to the end */
export const RATE1 = 0.42;
export const RATE2 = 0.62;
const rateAt = (f: number) => RATE1 * sst(WORK0, 50, f) + (RATE2 - RATE1) * sst(87, 98, f);
const PROG: number[] = (() => {
  const SUB = 8;
  const out = [0];
  let s = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    for (let k = 0; k < SUB; k++) s += rateAt(f + (k + 0.5) / SUB) / SUB;
    out.push(s);
  }
  return out;
})();
/** the work's progress at frame f (sheets started; floor = the sheet in flight, frac = its progress) */
export const progAt = (f: number) => {
  const i = Math.max(0, Math.min(PROG.length - 2, Math.floor(f)));
  return Math.max(0, mix(PROG[i], PROG[i + 1], Math.max(0, f - i)));
};
/** a sheet-local point (u across, v along the long side, -1..1) in world units (sinceWritingWorld's sheetPt, copied) */
const D2R = Math.PI / 180;
const sheetPt = (q: SheetPose, u: number, v: number) => {
  let x = (u * SHEET.w) / 2;
  let y = -c01(q.curl) * 9 * u * u + c01(q.curl) * 3 * v * v;
  let z = (v * SHEET.l) / 2;
  const cr = Math.cos(q.roll * D2R);
  const sr = Math.sin(q.roll * D2R);
  [x, y] = [x * cr - y * sr, x * sr + y * cr];
  const cp = Math.cos(q.pitch * D2R);
  const sp = Math.sin(q.pitch * D2R);
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  const cy = Math.cos(q.yaw * D2R);
  const sy = Math.sin(q.yaw * D2R);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  return { X: q.X + x, Y: q.Y + y, Z: q.Z + z };
};
type V3o = { X: number; Y: number; Z: number };
/** the left hand pinches a sheet at its left end, the right hand at its right end (yaw 90: the long side across X), on
 *  the roll axis, the grip just outside the edge so the mitten is not hidden under the sheet */
const gripL = (q: SheetPose) => sheetPt(q, 0, -1.1);
const gripR = (q: SheetPose) => sheetPt(q, 0, 1.1);
/** the read pose of sheet i (a touch of variety per sheet) */
const readPose = (i: number): SheetPose => ({
  X: R0.X + (random(`rx${i}`) - 0.5) * 4,
  Y: R0.Y + (random(`ry${i}`) - 0.5) * 4,
  Z: R0.Z,
  yaw: 90 + (random(`rw${i}`) - 0.5) * 6,
  pitch: (random(`rp${i}`) - 0.5) * 6,
  roll: R0.roll,
  curl: 0.1,
});
/** sheet i at its progress u 0..1: up off the IN top to the read point, then down onto the DONE top */
const flight = (i: number, u: number): SheetPose => {
  const rd = readPose(i);
  const a = u < 0.5 ? inTop(IN.n0 - i) : rd;
  const b = u < 0.5 ? rd : doneTop(DONE.n0 + i + 1);
  const e = ease(u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5);
  const arc = Math.sin(Math.PI * e);
  // (on the way down to DONE the sheet swings out first, then settles: the right hand keeps clear of its shoulder)
  const eX = u < 0.5 ? e : sst(0, 0.75, e);
  return { X: mix(a.X, b.X, eX), Y: mix(a.Y, b.Y, e) - (u < 0.5 ? 0 : 2) * arc, Z: mix(a.Z, b.Z, e), yaw: mix(a.yaw, b.yaw, e), pitch: mix(a.pitch, b.pitch, e), roll: mix(a.roll, b.roll, e), curl: mix(a.curl, b.curl, e) + 0.06 * arc };
};
const arcTo = (a: V3o, b: V3o, e: number, lift: number): V3o => ({ X: mix(a.X, b.X, e), Y: mix(a.Y, b.Y, e) - lift * Math.sin(Math.PI * e), Z: mix(a.Z, b.Z, e) });
/** both hands' 3D targets at progress p */
export const handsAt = (p: number): { L: V3o; R: V3o } => {
  if (p <= 0) return { L: gripL(inTop(IN.n0)), R: gripR(doneTop(DONE.n0)) };
  const i = Math.floor(p);
  const u = p - i;
  if (u < 0.5) return { L: gripL(flight(i, u)), R: arcTo(gripR(doneTop(DONE.n0 + i)), gripR(readPose(i)), ease(u / 0.5), -6) };
  return { L: arcTo(gripL(readPose(i)), gripL(inTop(IN.n0 - i - 1)), ease((u - 0.5) / 0.5), 9), R: gripR(flight(i, u)) };
};
/** the work's state at frame f: the hands' targets, the sheet in flight (and its ghosts), the piles */
export const workAt = (f: number) => {
  const p = progAt(f);
  const hands = handsAt(p);
  if (p <= 0) return { p, hands, sheet: null as SheetPose | null, nIn: IN.n0, nDone: DONE.n0 };
  const i = Math.floor(p);
  return { p, hands, sheet: flight(i, p - i), nIn: IN.n0 - i - 1, nDone: DONE.n0 + i };
};
/** the sheet in flight at progress p (for its ghosts) */
const sheetAtP = (p: number) => (p <= 0 ? null : flight(Math.floor(p), p - Math.floor(p)));
/** the ghost lags (in sheets) and their opacities */
const GHOSTS = [
  { lag: 0.11, op: 0.32 },
  { lag: 0.22, op: 0.14 },
];

/** a world point (X, Y, Z) as figure-local units of a figure standing at (X0, Z0) */
const toLocal = (P: Persp, X0: number, Z0: number, q: V3o): P2 => {
  const { at, scale } = P.at(X0, Z0);
  const w = P.p(q.X, q.Y, q.Z);
  return [(w[0] - at[0]) / scale, (w[1] - at[1]) / scale];
};

/** the robot's pose and X at frame f (P: this frame's perspective, for the hands on the sheets) */
export const aiAt = (f: number, P: Persp): { X: number; pose: CovidPose } => {
  const X = aiX(f);
  const g = glanceAt(f);
  const w0 = walkRaw(f);
  const turnDown = f > 15 ? Math.sin(Math.PI * g) : 0;
  // the robot's face is a screen: its dot eyes slide across it (look past 1 moves them further), so the glance puts
  // the head round to screen left AND the eyes at the screen's left edge; walking on, it faces its desk (head in
  // near-profile, eyes ahead and down). As the head comes round it dips and the eyes lead it right: never on us
  const walk: CovidPose = { ...w0, mouth: 0.05, headYaw: mix(0.9, -0.9, g), pitch: w0.pitch + 12 * g + turnDown * 14, look: [mix(1.4, -2.5, g) + 1.6 * turnDown, Math.min(2.4, mix(0.9, 1.5, g) + 0.9 * turnDown)] as P2, lids: 0.1 * g + 0.35 * turnDown };
  if (f < TURN0) return { X, pose: walk };
  // working: three-quarter toward us behind the desk, leaning in, the screen level with its eyes low (half-lidded, down
  // on the read point), both hands on the sheets
  const wk = workAt(f);
  const base = breathe({ ...POSES.turnTo(0.38), mouth: 0, lean: 5, pitch: 40, roll: -2, headYaw: 0.2, lids: 0.35, look: [0.1, 2.6] as P2, footL: [-7, 0], footR: [9, -1] }, (f * (30000 / 1001)) / FPS, 0.7) as CovidPose;
  // the elbows out to the sides (a sheet held up in front of the chest, both hands low over the piles)
  base.armL = { ...base.armL, elbow: [-1, 0.3] as P2 };
  base.armR = { ...base.armR, elbow: [1, 0.3] as P2 };
  const hL = toLocal(P, X, AI_Z, wk.hands.L);
  const hR = toLocal(P, X, AI_Z, wk.hands.R);
  const solved = botGripTo({ ...base, armL: { ...base.armL, fist: 0.75, hand: 8 }, armR: { ...base.armR, fist: 0.75, hand: -8 } }, { L: hL, R: hR });
  let work: CovidPose = { ...solved, armL: { ...solved.armL, fist: 0.75, hand: 8 }, armR: { ...solved.armR, fist: 0.75, hand: -8 } };
  // botGripTo aims the wrist along the rig's own forearm; the drawn mitten hangs off the soft elbow, so when the elbow
  // folds it lands off the grip: nudge each wrist (rig units: / the arm's 0.585) by the mitten's miss until it is on
  for (let it = 0; it < 14; it++) {
    const an = botAnchorsLocal(0, work);
    const eL = sub(hL, an.handL);
    const eR = sub(hR, an.handR);
    if (Math.max(Math.hypot(eL[0], eL[1]), Math.hypot(eR[0], eR[1])) < 0.3) break;
    work = { ...work, armL: { ...work.armL, w: add(work.armL.w, mul(eL, 0.7 / 0.585)) }, armR: { ...work.armR, w: add(work.armR.w, mul(eR, 0.7 / 0.585)) } };
  }
  const t = sst(TURN0, TURN1, f);
  return { X, pose: t >= 1 ? work : lerpPose(walk, work, t) };
};

/** the piles: sinceWritingWorld's SheetStack, copied with the thin sheet (T_SHEET) */
const ThinStack: React.FC<{ A: AirWorld; X: number; Z: number; n: number; uid: string; Y: number; yaw: number; seed: number }> = ({ A, X, Z, n, uid, Y, yaw, seed }) => {
  const P = A.P;
  const N = Math.max(0, Math.round(n));
  if (N <= 0) return null;
  const camX = P.vp[0];
  const camZ = -P.Dc;
  const els: React.ReactNode[] = [];
  const hw = SHEET.w / 2;
  const hl = SHEET.l / 2;
  const L = [-0.6, -0.8];
  const lw = 0.4 * P.r(Z);
  els.push(<AirShadow key="sh" A={A} X={X} Z={Z} w={SHEET.w * 0.95} d={SHEET.l * 0.6} Y={Y} uid={`${uid}-sh`} amt={0.75} />);
  const sides: string[] = ["", "", "", ""];
  const sideCol: string[] = [];
  const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
  for (let i = 0; i < N - 1; i++) {
    const j = jit(i, seed);
    const cx = X + j.dx;
    const cz = Z + j.dz;
    const a = (yaw + j.dyaw) * D2R;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const corner = (u: number, v: number): P2 => [cx + u * hw * ca + v * hl * sa, cz - u * hw * sa + v * hl * ca];
    const cs = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    const yT = Y - (i + 1) * T_SHEET;
    const yB = Y - i * T_SHEET;
    for (let k = 0; k < 4; k++) {
      const p = cs[k];
      const q = cs[(k + 1) % 4];
      const nx = q[1] - p[1];
      const nz = -(q[0] - p[0]);
      const mx = (p[0] + q[0]) / 2;
      const mz = (p[1] + q[1]) / 2;
      if (nx * (camX - mx) + nz * (camZ - mz) <= 0) continue;
      sides[k] += poly([P.p(p[0], yB, p[1]), P.p(q[0], yB, q[1]), P.p(q[0], yT, q[1]), P.p(p[0], yT, p[1])]);
      if (!sideCol[k]) {
        const nl = Math.hypot(nx, nz) || 1;
        const ndl = -((nx / nl) * L[0] + (nz / nl) * L[1]);
        sideCol[k] = mixHex("#CDBFA4", "#EEE5D2", c01(0.5 + 0.5 * ndl));
      }
    }
  }
  const hM = -(Y - (N * T_SHEET) / 2);
  const tone = (hex: string) => A.tone(hex, Z, hM);
  sides.forEach((d, k) => {
    if (d) els.push(<path key={`s${k}`} d={d} fill={tone(sideCol[k] ?? "#E2D8C4")} stroke={tone("#A4957A")} strokeWidth={f2(lw)} strokeOpacity={0.5} strokeLinejoin="round" />);
  });
  const top = thinTop(X, Z, N, Y, yaw, seed);
  if (top.Y > P.horizonY) els.push(<WorkSheet key="top" A={A} pose={top} uid={`${uid}-top`} />);
  return <g>{els}</g>;
};

/** the hands' motion smear: a faint skin-toned stroke along each hand's path over the last fraction of a sheet */
const HandSmear: React.FC<{ A: AirWorld; p: number }> = ({ A, p }) => {
  if (p <= 0) return null;
  const out: React.ReactNode[] = [];
  for (const side of ["L", "R"] as const) {
    const pts: P2[] = [];
    for (let k = 0; k <= 6; k++) {
      const q = Math.max(0, p - (0.2 * k) / 6);
      const h = handsAt(q)[side];
      pts.push(A.P.p(h.X, h.Y, h.Z));
    }
    const len = pts.slice(1).reduce((s, v, k) => s + Math.hypot(v[0] - pts[k][0], v[1] - pts[k][1]), 0);
    if (len < 6) continue;
    const w = 8 * A.P.r(AI_Z);
    out.push(<path key={side} d={`M${pts.map(Pt).join("L")}`} stroke={BOT_SKIN} strokeOpacity={0.3} strokeWidth={f2(w)} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// THE STANDING DESK (cut-local, the office's laminate and steel)
// ---------------------------------------------------------------------------
const StandingDesk: React.FC<{ A: AirWorld }> = ({ A }) => {
  const D = DESK;
  return (
    <g>
      <AirShadow A={A} X={(D.x0 + D.x1) / 2 + 8} Z={(D.z0 + D.z1) / 2} w={(D.x1 - D.x0) * 0.6} d={46} uid="dsk-sh" amt={0.55} />
      {/* the back legs, the modesty panel, the front legs, the top */}
      <AirBox A={A} X0={D.x0 + 4} X1={D.x0 + 12} Y0={D.top + D.th} Y1={0} Z0={D.z1 - 10} Z1={D.z1 - 4} mat={MAT_LEG} uid="dl-bl" />
      <AirBox A={A} X0={D.x1 - 12} X1={D.x1 - 4} Y0={D.top + D.th} Y1={0} Z0={D.z1 - 10} Z1={D.z1 - 4} mat={MAT_LEG} uid="dl-br" />
      <AirBox A={A} X0={D.x0 + 12} X1={D.x1 - 12} Y0={D.top + D.th} Y1={-34} Z0={D.z0 + 10} Z1={D.z0 + 14} mat={MAT_FRAME} uid="dl-pn" rim={0} />
      <AirBox A={A} X0={D.x0 + 4} X1={D.x0 + 12} Y0={D.top + D.th} Y1={0} Z0={D.z0 + 4} Z1={D.z0 + 10} mat={MAT_LEG} uid="dl-fl" />
      <AirBox A={A} X0={D.x1 - 12} X1={D.x1 - 4} Y0={D.top + D.th} Y1={0} Z0={D.z0 + 4} Z1={D.z0 + 10} mat={MAT_LEG} uid="dl-fr" />
      <AirBox A={A} X0={D.x0} X1={D.x1} Y0={D.top} Y1={D.top + D.th} Z0={D.z0} Z1={D.z1} mat={MAT_LAMINATE} uid="dl-top" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GRAIN on twos (the AirStage's own, redrawn here: its stage runs on the frozen air clock)
// ---------------------------------------------------------------------------
const hash01 = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  const g2 = Math.floor(frame / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * 96;
  const gry = (hash01(g2 + 7) * 2 - 1) * 96;
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.3 }}>
      <Img src={staticFile("cheekypint2/grain.png")} style={{ position: "absolute", left: (1080 - 1296) / 2 + grx, top: (1920 - 2304) / 2 + gry, width: 1296, height: 2304 }} />
    </AbsoluteFill>
  );
};

const Guides: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={65} y={290} width={950} height={780} fill="none" stroke="#2B6F8F" strokeWidth={2} strokeDasharray="10 8" opacity={0.8} />
    <rect x={0} y={1080} width={1080} height={170} fill="#2B6F8F" opacity={0.15} />
    <rect x={0} y={1360} width={1080} height={100} fill="#2B6F8F" opacity={0.15} />
    <line x1={0} x2={1080} y1={800} y2={800} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
    <line x1={0} x2={1080} y1={880} y2={880} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
    <line x1={955} x2={955} y1={900} y2={1920} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
  </svg>
);

const FrozenToTheAI: React.FC<z.infer<typeof schema>> = ({ guides }) => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame: airClock(frame), scene: officeScene(SUN_T) });

  const ya = A.P.at(YOU.X, YOU.Z);
  const ai = aiAt(frame, A.P);
  const ga = A.P.at(ai.X, AI_Z);
  const wk = workAt(frame);
  const plateIn = plateT(frame, PLATE.f0, PLATE.dur);

  return (
    <AbsoluteFill>
      <AirStage v={A.v} shafts={0} bloom={0.22} grain={0} overlay={<OfficeTint sunT={SUN_T} />}>
        <WorldSvg cam={cam}>
          <OfficeRoom A={A} sunT={SUN_T} uid="room" room={ROOM} clock={{ X: CLOCK.X, Y: CLOCK.Y, secondT: clockT(frame), R: CLOCK.R }} />
          {/* the robot, deeper in the room, behind you and then behind its desk */}
          <AirShadow A={A} X={ai.X} Z={AI_Z} w={BOT_SHADOW.w} d={BOT_SHADOW.d} uid="ai-sh" amt={BOT_SHADOW.amt} />
          <Bot variant={0} pose={ai.pose} at={ga.at} scale={ga.scale} uid="ai" frame={frame} fog={A.folkFog(AI_Z)} unitPx={A.k} />
          <StandingDesk A={A} />
          <HandSmear A={A} p={wk.p} />
          <ThinStack A={A} X={IN.X} Z={IN.Z} Y={DESK.top} n={wk.nIn} yaw={IN.yaw} seed={IN.seed} uid="in" />
          <ThinStack A={A} X={DONE.X} Z={DONE.Z} Y={DESK.top} n={wk.nDone} yaw={DONE.yaw} seed={DONE.seed} uid="done" />
          {GHOSTS.map((gh, k) => {
            const q = sheetAtP(wk.p - gh.lag);
            return q && wk.p - gh.lag > 0 ? (
              <g key={`gh${k}`} opacity={gh.op}>
                <WorkSheet A={A} pose={q} uid={`gh${k}`} />
              </g>
            ) : null;
          })}
          {wk.sheet ? <WorkSheet A={A} pose={wk.sheet} uid="carry" /> : null}
          {plateIn > 0 ? <Plate A={A} X={PLATE.X} Y={PLATE.Y} Z={PLATE.Z} text="1,000×" t={plateIn} uid="plate" size={PLATE.size} /> : null}
          {/* you, frozen mid-pour, in front */}
          <AirShadow A={A} X={YOU.X} Z={YOU.Z} w={62} d={30} uid="you-sh" amt={0.8} />
          <You at={ya.at} scale={ya.scale} fog={A.folkFog(YOU.Z)} unitPx={A.k} />
          <FrozenStream at={ya.at} scale={ya.scale} />
          <OfficeShafts A={A} sunT={SUN_T} uid="sh" room={ROOM} strength={0.6} />
        </WorldSvg>
      </AirStage>
      <Grain frame={frame} />
      {guides ? <Guides /> : null}
    </AbsoluteFill>
  );
};

export default FrozenToTheAI;
