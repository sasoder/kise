// ---------------------------------------------------------------------------
// CoffeeHundredWorkdays (rsi-since-writing, cut 2). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 147 frames.
// One office inside the misty teal air (AirStage, palette A, the shared world sinceWritingWorld + sinceWritingFolk,
// read-only) on a londonDepth one-point perspective, from the kit kits/dwarkesh-3d/dwarkesh3d.
//
// CHECK LINE: "In the time you drink one morning coffee, an AI gets a hundred workdays done."
//
// THE LINE: "(Even an AI exactly) as smart as you would have a huge edge if it could get 100 workdays done before you
// finish your morning coffee."
// WORD -> FRAME (f0 = sequence frame 23, 0.959 s): as 6 · smart 13 · as 18 · you 21 · would 25 · have 32 · a 36 ·
// huge 39 · edge 47 · if 57 · it 67 · could 68 · get 71 · 100 76 · workdays 83 · done 98 · before 104 · you 112 ·
// finish 117 · your 123 · morning 130 · coffee 135 · (slot ends 147) AIs 147
// DURATION: the slot 0.959 -> 7.090 s (sequence frames 23-170) = 147 frames at 24000/1001 (f0..f146).
//
// THE MOTION (Revision 2: tight on the robot, then the pan to you): one office in morning light (sunT 0.15, the
// window high on the left, long soft shafts). Two desks a little apart, facing each other across the gap: YOU (Human
// v0, white shirt) at the left desk with a steaming cream mug; THE ROBOT (the sister clip's tenEarthsBot v0, read-only)
// at the right desk, typing (BOT_POSES.typeAtDesk, mittens on the keyboard). No monitors (the stack reads against the
// wall in the gap).
// f0-94: close on the robot at work and pushing in (k 3.4 -> 4.4, 1.29x, drifting a touch left; the robot ~810 px tall
// at f0, its face at y ~730), its finished WorkSheets (one sheet = one workday) lifting off the pad by its keyboard
// and arcing onto the growing stack on the floor at the left edge of frame (one solid pile from the floor up, a soft
// contact shadow under it). You are out of shot to the left, sipping (sip 1 f34-76: the level drops 0.85 -> 0.45; the
// mug held at the chest f76-92). The count: the first sheet lands f8, one at a time, then small loose sheaves (2-5)
// around "100 workdays" (f76-83; never more than ~8 flights in the air, landing >= 2.3 frames apart, each on its own
// arc), slowing so the last few land alone and the 100th lands alone on "done" (f98); no 101st. f94-130: one smooth
// pan / truck left with a pull-back (k 4.4 -> 1.76, a gentle ease; peak ~14 px/f) to the two-shot: both desks, the stack
// with its tag, you on the last sip (f92-128: it drains), setting the EMPTY mug down on "coffee" (f135), letting go by
// f142; then a creep and a living hold (typing, breath, the air). The tag drops onto the stack at f103-106 (as the pan
// brings the stack in from the edge: at f98 the tag would hang off the left edge) and swings to rest.
// The one label: a slate luggage tag "100 / WORKDAYS" (cream Caslon, PLATE_FONT) on a string from a binder clip on the
// top sheets' front edge, in world space in front of the stack's face. No counter, no floating type.
// CAUSE -> EFFECT: a flight leaves the pad on its launch frame (FLY: 16-19 frames for the first sheets, 14-17 in the
// stream); the stack steps on the landing frame (the flight's last frame is just above stackTop(n + 1), still moving);
// the tag comes once the 100th is down. The mug rides your hand while held (the grip re-solved on its handle every frame).
// Orange = the AI only (the robot); the sheets and the mug cream, you in white and slate, the tag slate and cream.
// THE MUG (cut-local): mugShapes' geometry at 1.45x (MUG_S) in cream, painted in the figure's build in place of the
// pose's own mug (the near hand over its handle); the sip arm solved with covidGripTo onto its handle.
//
// DEPTH: eye Y -260, dRef 1700 at kRef 1.32, dolly 0.5, fog by the eye (officeScene(0.15)). Seats at Z 0: you X -215
// (dir 1), the robot X +200 (dir -1); desks x 48..173 along each sitter's dir, Z -30..220 (the gap X -42..27); the pad
// on its desk X 92, Z -2; the floor stack X 40, Z -165 (yaw 88: the A4's long side to us; in front of the robot's desk, so the close-up holds
// it at the left edge); the tag at Z -187. The window
// moved to X -660..-130, Y -330..-600 (OfficeRoom's room prop; the module is unchanged).
// CHECKS: scripts/clips/rsi-since-writing/check-coffee-hundred.ts (camera, count, faces / tag / landing point vs the
// keep-in box and caption bands, you at x >= 65, sheets vs faces and the mittens, the pop audit: mittens on the keys, the
// mug riding the hand, the mug's speed, the mug down from f135).
//
// SOURCES: none on screen. 100 = the speaker's number (his own illustration).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, makeCamera, swayCam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BOT_POSES, Bot } from "../rsi-ten-earths/tenEarthsBot";
import { HUMAN_DESK, HUMAN_POSES, buildHuman, type HumanPose, type MugState, type P2 } from "./sinceWritingFolk";
import { CovidPaint } from "../kyle-covid/covidFolk";
import { closedD, covidGripTo, ellPts, tubeD, type CShape } from "../kyle-covid/covidFolkBody";
import { add, mix2, mul, rot } from "../kits/maps/stringsMotion";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";
import { MUG, mugShapes } from "./sinceWritingProps";
import { CREAM, OFFICE, SHEET, OfficeDesk, OfficeRoom, OfficeShafts, OfficeTint, PLATE_FONT, SheetStack, WorkSheet, MugSteam, officeScene, sheetFlight, stackTop, type SheetPose } from "./sinceWritingWorld";
import type { AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 24000 / 1001;
export const DURATION = 147;
export const schema = z.object({ guides: z.boolean().default(false) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, x: number) => {
  const u = c01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ---------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------
export const SUN_T = 0.15;
export const DEPTH: DepthOpts = { eyeY: -260, dRef: 1700, kRef: 1.32, dolly: 0.5 };
/** the seats (the world probe's cut-1 layout): two desks side by side, the sitters facing each other across the gap */
export const YOU = { X: -215, Z: 0 };
export const AI = { X: 200, Z: 0 };
/** the pad on its desk between the keyboard and the monitor (the source of the sheets) */
export const PAD = { X: AI.X - 108, Y: -132, Z: -2, n: 7, yaw: -3, seed: 7 };
/** the stack on the floor in front of the gap between the desks (the long side of the A4 to us) */
export const STACK = { X: 40, Z: -165, yaw: 88, seed: 3 };
/** the one label: a luggage tag "100 / WORKDAYS" on a string from a binder clip on the top sheets' front edge, hanging
 *  in front of the stack's face (world space: Z just in front of the face), dropped on as the 100th sheet lands */
export const TAG = { Z: STACK.Z - 22, drop: 12, W: 100, H: 70, numSize: 36, labSize: 13.5, labSpacing: 0.05, f0: 103 };
/** the room: the window high on the left (the low morning sun at the upper left; the stack against the plain wall) */
const ROOM = { ...OFFICE, win: { ...OFFICE.win, x0: -660, x1: -130, sill: -330, head: -600 } };
export const TOTAL = 100;

// ---------------------------------------------------------------------------
// THE COUNT: N(f) = 1 + integral_F_FIRST^f rate, rate = BASE + PEAK * exp(-((f - MID) / SIG)^2), PEAK solved so
// N(98) = 100: a slow start, a peak ~f66, slowing so the last few land alone and the 100th lands alone on "done" (f98).
// THE FLIGHTS: the sheets fly in groups (FLY) landing at least CADENCE frames apart: one sheet at a time while the rate
// is low, a small sheaf of 2-3 (fanned, separating a little in the air) at the peak, so at most ~6-7 flights are ever in
// the air. Each flight leaves the pad with an ease-in and lands with way on (no hover over the stack, no ladder), on
// its own arc (height, sideways drift, flutter: its seed).
// ---------------------------------------------------------------------------
const F_FIRST = 8;
const F_LAST = 98;
const BASE = 0.55;
const MID = 58;
const SIG = 20;
const CADENCE = 2.3;
/** the 99th lands by F_99 (the last few alone, slowing), the 100th alone on F_LAST */
const F_99 = 94;
const gaussInt = (a: number, b: number) => {
  // integral of exp(-((f - MID)/SIG)^2) from a to b (fine Riemann sum, module load only)
  let s = 0;
  const n = 4000;
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const f = a + (i + 0.5) * h;
    s += Math.exp(-(((f - MID) / SIG) ** 2)) * h;
  }
  return s;
};
const PEAK = (TOTAL - 2 - BASE * (F_99 - F_FIRST)) / gaussInt(F_FIRST, F_99);
/** the continuous count N(f) (1 at F_FIRST, 99 at F_99) */
const countN = (() => {
  const h = 0.01;
  const tab: number[] = [];
  let N = 1;
  for (let f = F_FIRST; f <= F_99 + h; f += h) {
    tab.push(N);
    N += (BASE + PEAK * Math.exp(-(((f + h / 2 - MID) / SIG) ** 2))) * h;
  }
  const scale = (TOTAL - 2) / (tab[Math.round((F_99 - F_FIRST) / h)] - 1);
  return (f: number) => (f <= F_FIRST ? 1 : 1 + (tab[Math.min(tab.length - 1, Math.round((f - F_FIRST) / h))] - 1) * scale);
})();
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** one flight: sheets first..first+size-1 (0-based), landing at frame `land` after `D` frames in the air */
export type Flight = { first: number; size: number; land: number; D: number; seed: number };
export const FLY: Flight[] = (() => {
  const out: Flight[] = [];
  let count = 1;
  let t = F_FIRST;
  out.push({ first: 0, size: 1, land: t, D: 0, seed: 1 });
  while (count < TOTAL - 1) {
    // the next landing: no sooner than CADENCE after the last, and not before the next whole sheet is due
    let tn = t + CADENCE;
    while (countN(tn) < count + 1 - 1e-9 && tn < F_99) tn += 0.01;
    tn = Math.min(tn, F_99);
    const size = tn >= F_99 ? TOTAL - 1 - count : Math.max(1, Math.min(TOTAL - 1 - count, Math.floor(countN(tn) + 1e-6) - count));
    out.push({ first: count, size, land: tn, D: 0, seed: out.length + 1 });
    count += size;
    t = tn;
  }
  // the 100th, alone, on "done"
  out.push({ first: TOTAL - 1, size: 1, land: F_LAST, D: 0, seed: out.length + 1 });
  // flight times: the first, lone sheets float (17-19 frames), the stream flies in 12-15
  for (const g of out) g.D = 14 + 3 * hash(g.seed, 7) + 2 * (1 - Math.min(1, g.first / 12));
  return out;
})();
/** landing frame of each sheet 1..100 (0-based index): its flight's */
export const LAND: number[] = FLY.flatMap((g) => Array.from({ length: g.size }, () => g.land));
/** sheets on the floor stack at frame f */
export const countAt = (f: number) => {
  let n = 0;
  for (const g of FLY) if (g.land <= f + 1e-9) n += g.size;
  return n;
};
/** progress along the arc: an ease-in off the pad, still moving at the stack (slope 0.3 at tau 1) */
const progress = (tau: number) => {
  const t = c01(tau);
  return 0.7 * t * t * (3 - 2 * t) + 0.3 * t * t * (2 - t);
};
/** a flight's share of the arc's height (0.6-0.97, its own: the close-up keeps the arcs low, under the robot's face) */
const keepOf = (seed: number) => 0.6 + 0.37 * hash(seed, 1);
/** one sheet's flight at tau 0..1 on the world's sheetFlight (cut-local: the progress above, each flight's own arc height
 *  and sideways drift). Exactly `to` at tau 1. */
export const flightAt = (from: SheetPose, to: SheetPose, tau: number, seed: number): SheetPose => {
  const s = progress(tau);
  const u = 1 - Math.pow(1 - s, 1 / 1.7);
  const q = sheetFlight(from, to, u, seed);
  const dist = Math.hypot(to.X - from.X, to.Z - from.Z, to.Y - from.Y);
  const apex = 30 + 0.32 * dist;
  const keep = keepOf(seed);
  const mid = Math.sin(Math.PI * s);
  return {
    ...q,
    X: q.X + (hash(seed, 2) - 0.5) * 44 * mid,
    Y: q.Y + (1 - keep) * apex * 4 * s * (1 - s),
    Z: q.Z + (hash(seed, 3) - 0.5) * 40 * mid,
    yaw: q.yaw + (hash(seed, 4) - 0.5) * 80 * mid,
    roll: q.roll + (hash(seed, 5) - 0.5) * 34 * mid,
  };
};
/** the sheets in the air at frame f: sheet index and pose. A sheaf is ONE object in the air: its sheets lie on each
 *  other (one sheet's thickness apart, a few degrees and units out of square), so it reads as a small loose bundle */
export const flyersAt = (f: number, padTop: SheetPose) => {
  const out: { i: number; pose: SheetPose }[] = [];
  // the newest flights first, so the ones nearer the stack (nearer the camera) paint over the ones just leaving
  for (const g of [...FLY].reverse()) {
    const launch = g.land - g.D;
    if (g.D <= 0 || f < launch || f >= g.land) continue;
    const tau = (f - launch) / g.D;
    const to = stackTop(STACK.X, STACK.Z, g.first + 1, 0, STACK.yaw, STACK.seed);
    const q = flightAt(padTop, to, tau, g.seed);
    const loose = Math.sin(Math.PI * c01(tau));
    // the bottom sheet first (painted under the ones above it)
    for (let j = 0; j < g.size; j++) {
      out.push({
        i: g.first + j,
        pose: {
          ...q,
          X: q.X + (hash(g.seed, 10 + j) - 0.5) * 5 * loose,
          Y: q.Y - j * 1.3,
          Z: q.Z + (hash(g.seed, 20 + j) - 0.5) * 5 * loose,
          yaw: q.yaw + (hash(g.seed, 30 + j) - 0.5) * 10 * loose,
        },
      });
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE CAMERA: one continuous move: close on the robot, a visible push-in drifting a touch left (f0-94), then the pan /
// truck left with a pull-back to the two-shot (f94-130, pchip: the push-in eases into the pull-back), then a creep.
// The f106 key holds the pan back while the pull-back gets going, so the robot's face (moving right as we pan left) stays
// inside the keep-in box.
// ---------------------------------------------------------------------------
const camKeys = makeCamera([
  { f: 0, k: 3.4, wx: 127, wy: -160, sx: 540, sy: 960 },
  { f: 94, k: 4.4, wx: 114, wy: -172, sx: 540, sy: 960 },
  { f: 106, k: 3.3, wx: 92, wy: -172, sx: 540, sy: 960 },
  { f: 130, k: 1.76, wx: -8, wy: -165, sx: 540, sy: 960 },
  { f: 146, k: 1.745, wx: -12, wy: -166, sx: 540, sy: 960 },
]);
export const camOf = (f: number) => swayCam(camKeys(f), f);
const REST = camOf(0);

// ---------------------------------------------------------------------------
// YOU: two slow sips across the whole slot, the hand on the mug from f0. Each channel is eased between its keys (zero
// speed at every key): e = where the mug is between the desk (0) and the lips (1), with a hold at e 0.3 in front of the
// chest between the sips; tip = tipped into the lips; drink = the head's drink (eyes closing, head back); level = the
// coffee (drops on each sip, empty on the second); hold = the hand's grip (lets go after "coffee").
// ---------------------------------------------------------------------------
const keyed = (keys: [number, number][]) => (f: number) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [fa, va] = keys[i - 1];
    const [fb, vb] = keys[i];
    if (f <= fb) return va + (vb - va) * sst(fa, fb, f);
  }
  return keys[keys.length - 1][1];
};
/** sip 1 (off screen): up f34-46, tip in f44-50, drink to f64, tip out f64-68, down to the hold f66-76; sip 2 (the last,
 *  revealed by the pan): up f92-102, tip in f99-105, drink (it drains) to f124, tip out f124-128, down f127-135: the
 *  empty mug lands on "coffee" (f135) */
export const SIP = {
  e: keyed([[0, 0], [34, 0], [46, 1], [66, 1], [76, 0.3], [92, 0.3], [102, 1], [127, 1], [135, 0]]),
  tip: keyed([[0, 0], [44, 0], [50, 1], [64, 1], [68, 0], [99, 0], [105, 1], [124, 1], [128, 0]]),
  drink: keyed([[0, 0], [45, 0], [51, 1], [63, 1], [68, 0], [101, 0], [107, 1], [123, 1], [128, 0]]),
  level: keyed([[0, 0.85], [50, 0.85], [63, 0.45], [106, 0.45], [123, 0]]),
  hold: keyed([[0, 1], [135, 1], [142, 0]]),
  steam: keyed([[0, 1], [104, 1], [126, 0]]),
};
/** the frame the empty mug lands on the desk ("coffee") */
export const MUG_DOWN = 135;
// ---------------------------------------------------------------------------
// THE MUG (cut-local, Rev 1): a plain cream mug, 1.45x the props module's MUG so it reads at the resolved scale, drawn
// here (mugShapes' geometry, scaled; the world modules are unchanged) and swapped into the figure's paint in place of
// the pose's own mug (so the near hand still wraps the handle). The sip is seatedSip's timing and arm, re-aimed for the
// bigger mug (its face-side rim on the lips) and with the head turned on toward profile while the mug is up, so the
// tipped mug stands clear of the face, its tip angle against the wall.
// ---------------------------------------------------------------------------
export const MUG_S = 1.45;
const BIG = { r: MUG.r * MUG_S, h: MUG.h * MUG_S, out: MUG.handleOut * MUG_S };
const CREAM_MUG = { glaze: "#ECE5D4", lip: "#FBF8EF", inner: "#B5AA97", coffee: "#4A3426", crema: "#6B5038", edge: "#5F6A66" };
/** the head's extra turn toward profile while the mug is up (radians on covidFolk's headYaw) */
export const PROFILE_TURN = 0.38;
/** how far forward (units) the untipped mug is held off the lips */
const AWAY = 17;
const bigPt = (m: MugState, p: P2): P2 => add(m.base, rot(p, m.tilt));
const bigHandle = (m: MugState): P2 => bigPt(m, [m.handle * (BIG.r + BIG.out * 0.75), -BIG.h * 0.55]);
export const bigMouth = (m: MugState) => ({ c: bigPt(m, [0, -BIG.h]), rx: BIG.r * 0.92, ry: BIG.r * 0.3, rot: m.tilt });
const bigBaseForRim = (q: P2, tilt: number, side: -1 | 1): P2 => add(q, mul(rot([side * BIG.r, -BIG.h], tilt), -1));
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
  // a fine edge so the cream reads against the white shirt and the pale wall
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
// the mouth of the drinking head turned to profile (built once, as seatedSip does for its own head)
let SIP_MOUTH: P2 | null = null;
const sipMouth = (): P2 => {
  if (!SIP_MOUTH) {
    const p = HUMAN_POSES.seatedSip(1, 0.5, 0).pose;
    SIP_MOUTH = buildHuman(0, { ...p, headYaw: p.headYaw + PROFILE_TURN }).anchors.mouth;
  }
  return SIP_MOUTH;
};
/** your pose at frame f (the big mug in `mug`; `pose.mug` is the module's small mug, only a marker for the paint swap) */
export const youAt = (f: number): { pose: HumanPose; mug: MugState } => {
  const e = SIP.e(f);
  const tipA = SIP.tip(f);
  const drink = SIP.drink(f);
  const lvl = SIP.level(f);
  const held = SIP.hold(f);
  // the seated rest pose (seatedSip at t 0: the far hand on the desk, the breath), with the drinking head laid on as
  // seatedSip does it (pitch back 9, lean back 2, lids 0.65, the smile off)
  const src = HUMAN_POSES.seatedSip(1, 0, f, lvl);
  const p0 = src.pose;
  // the last sip tips steeper as the mug drains
  const tilt = -(62 + 12 * sst(114, 124, f)) * tipA;
  const atMouth = bigBaseForRim(add(sipMouth(), [2, 1]), tilt, -1);
  const arc: P2 = [10 * Math.sin(Math.PI * e), -4 * Math.sin(Math.PI * e)];
  // held off the face (forward, away from it) whenever it is up but not tipped into the lips: it comes up in front of
  // the chin, tips in to drink, tips back out and leaves forward, never crossing the face
  const off: P2 = [AWAY * e * (1 - tipA), 0];
  const mug: MugState = { base: add(add(mix2(HUMAN_DESK.mug, atMouth, e), arc), off), tilt, level: lvl, handle: -1 };
  const grip = mix2(add(HUMAN_DESK.rest, [-4, 0]), bigHandle(mug), held);
  const head: HumanPose = {
    ...p0,
    pitch: p0.pitch - 9 * drink,
    lean: p0.lean - 2 * drink,
    lids: 0.65 * drink,
    mouth: 0.18 * (1 - drink),
    headYaw: p0.headYaw + PROFILE_TURN * sst(0.45, 0.95, e),
  };
  const q = covidGripTo("officer", 3, head, { L: grip }, [0, 0], 1) as HumanPose;
  return { pose: { ...q, armL: { ...q.armL, fist: 0.2 + 0.65 * held, hand: 10 - 18 * held }, armR: p0.armR, mug: src.mug }, mug };
};
/** you, painted: the figure's build with its mug swapped for the big cream one */
const You: React.FC<{ f: number; at: P2; scale: number; fog: ReturnType<ReturnType<typeof airWorldOf>["folkFog"]>; unitPx: number }> = ({ f, at, scale, fog, unitPx }) => {
  const y = youAt(f);
  const b = buildHuman(0, y.pose, { frame: f });
  const small = mugShapes(y.pose.mug as MugState);
  const i = b.shapes.findIndex((s) => s.d === small[0].d);
  const shapes = i >= 0 ? [...b.shapes.slice(0, i), ...bigMugShapes(y.mug), ...b.shapes.slice(i + small.length)] : [...b.shapes, ...bigMugShapes(y.mug)];
  return <CovidPaint shapes={shapes} at={at} scale={scale} uid="you" fog={fog} unitPx={unitPx} />;
};

// ---------------------------------------------------------------------------
// THE TAG: "100 / WORKDAYS" on a slate luggage tag (cream Caslon, PLATE_FONT), its string from a binder clip on the top
// sheets' front edge; it drops on as the pan brings the finished stack in (f103: in over 3 frames, the string taut by
// f108) and swings to rest (a damped pendulum about the clip, settled by ~f125). One plane at TAG.Z: a uniform perspective scale.
// ---------------------------------------------------------------------------
const TAG_INK = { card: "#3C514E", rule: "#8FA39E", clip: "#262E2D", wire: "#A9B1AE", string: "#D9D1C0" };
const easeOutBack = (x: number) => {
  const c = 1.4;
  const t = c01(x) - 1;
  return 1 + (c + 1) * t * t * t + c * t * t;
};
/** the tag's state at frame f: on 0..1, the drop (units above its hang), the swing (deg) */
export const tagAt = (f: number) => {
  const t = f - TAG.f0;
  if (t < 0) return { on: 0, lift: 0, ang: 0 };
  const on = sst(0, 3, t);
  const lift = 22 * (1 - easeOutBack(t / 5));
  const ang = 11 * Math.exp(-Math.max(0, t - 2) / 7) * Math.sin(Math.max(0, t - 2) * 0.58);
  return { on, lift, ang };
};
/** the clip's point (world units): the top sheet's front edge at the stack's centre */
export const tagPin = () => {
  const top = stackTop(STACK.X, STACK.Z, TOTAL, 0, STACK.yaw, STACK.seed);
  return { X: top.X, Y: top.Y, Z: TAG.Z + 3 };
};
const StackTag: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const st = tagAt(frame);
  if (st.on <= 0) return null;
  const pin = tagPin();
  const r = A.P.r(TAG.Z);
  const pc = A.P.p(pin.X, pin.Y, TAG.Z);
  const tone = (hex: string) => A.tone(hex, TAG.Z, 200);
  const { W, H, drop } = TAG;
  const y0 = drop - st.lift;
  // the card: a luggage tag, the top corners cut
  const cut = 11;
  const card = `M${-W / 2 + cut} ${y0} L${W / 2 - cut} ${y0} L${W / 2} ${y0 + cut} L${W / 2} ${y0 + H} L${-W / 2} ${y0 + H} L${-W / 2} ${y0 + cut} Z`;
  const inset = 4.5;
  const rule = `M${-W / 2 + cut + 1} ${y0 + inset} L${W / 2 - cut - 1} ${y0 + inset} L${W / 2 - inset} ${y0 + cut + 1} L${W / 2 - inset} ${y0 + H - inset} L${-W / 2 + inset} ${y0 + H - inset} L${-W / 2 + inset} ${y0 + cut + 1} Z`;
  const hole: P2 = [0, y0 + 7];
  return (
    <g opacity={st.on} transform={`translate(${pc[0].toFixed(2)} ${pc[1].toFixed(2)}) scale(${r.toFixed(4)})`}>
      <defs>
        <filter id="tagsh" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
      </defs>
      <g transform={`rotate(${st.ang.toFixed(3)})`}>
        {/* its soft shadow on the stack's face */}
        <path d={card} transform="translate(2.5 3.5)" fill={tone("#2A2620")} opacity={0.32} filter="url(#tagsh)" />
        {/* the string, the card, the reinforced hole */}
        <path d={`M0 0 L${-1.2} ${hole[1]} M0 0 L${1.2} ${hole[1]}`} stroke={tone(TAG_INK.string)} strokeWidth={0.9} fill="none" />
        <path d={card} fill={tone(TAG_INK.card)} />
        <path d={rule} fill="none" stroke={tone(TAG_INK.rule)} strokeWidth={0.7} opacity={0.75} />
        <circle cx={hole[0]} cy={hole[1]} r={3.2} fill={tone(TAG_INK.rule)} />
        <circle cx={hole[0]} cy={hole[1]} r={1.6} fill={tone("#1E2625")} />
        <text x={0} y={y0 + 17 + TAG.numSize * 0.66} textAnchor="middle" fill={tone(CREAM)} style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: TAG.numSize, fontVariantNumeric: "lining-nums" }}>
          100
        </text>
        <text x={TAG.labSize * TAG.labSpacing * 0.5} y={y0 + H - 10} textAnchor="middle" fill={tone(CREAM)} style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: TAG.labSize, letterSpacing: TAG.labSize * TAG.labSpacing }}>
          WORKDAYS
        </text>
      </g>
      {/* the binder clip on the top sheets' front edge (it does not swing) */}
      <path d="M-4 -6 L-6.5 -15 M4 -6 L6.5 -15" stroke={tone(TAG_INK.wire)} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      <path d="M-7.5 -5 L7.5 -5 L6.5 4 L-6.5 4 Z" fill={tone(TAG_INK.clip)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FLOOR STACK: the world's SheetStack, clipped to its own silhouette (the module's foot shadow sits off to the right
// of the stack and does not grow), over a cut-local contact shadow: centred under the stack's footprint, soft and light,
// spreading and darkening a little as the pile grows; nothing before the first sheet lands.
// ---------------------------------------------------------------------------
const hull = (pts: [number, number][]) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: [number, number][] = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
/** the stack's footprint corners (world X, Z), grown by `m` units on each side (covers the sheets' jitter) */
const footprint = (m: number): [number, number][] => {
  const a = STACK.yaw * (Math.PI / 180);
  const hw = SHEET.w / 2 + m;
  const hl = SHEET.l / 2 + m;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([u, v]) => [STACK.X + u * hw * Math.cos(a) + v * hl * Math.sin(a), STACK.Z - u * hw * Math.sin(a) + v * hl * Math.cos(a)]);
};
const FloorStack: React.FC<{ A: AirWorld; n: number }> = ({ A, n }) => {
  if (n <= 0) return null;
  const P = A.P;
  const topY = stackTop(STACK.X, STACK.Z, n, 0, STACK.yaw, STACK.seed).Y;
  const fp = footprint(5);
  const sil = hull([...fp.map(([x, z]) => P.p(x, 1, z) as [number, number]), ...fp.map(([x, z]) => P.p(x, topY - 1, z) as [number, number])]);
  const grow = c01(n / 70);
  const sh = footprint(6 + 10 * grow).map(([x, z]) => P.p(x, 0, z));
  const cx = sh.reduce((t, q) => t + q[0], 0) / 4;
  const cy = sh.reduce((t, q) => t + q[1], 0) / 4;
  const rx = (Math.max(...sh.map((q) => q[0])) - Math.min(...sh.map((q) => q[0]))) / 2;
  const ry = (Math.max(...sh.map((q) => q[1])) - Math.min(...sh.map((q) => q[1]))) / 2;
  const a = (0.2 + 0.14 * grow) * (1 - A.fog(STACK.Z));
  return (
    <g>
      <defs>
        <radialGradient id="stk-cs">
          <stop offset="0" stopColor="#2A2620" stopOpacity={a} />
          <stop offset="0.55" stopColor="#2A2620" stopOpacity={0.55 * a} />
          <stop offset="1" stopColor="#2A2620" stopOpacity={0} />
        </radialGradient>
        <clipPath id="stk-clip">
          <path d={`M${sil.map((q) => `${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join("L")}Z`} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry * 1.15} fill="url(#stk-cs)" />
      <g clipPath="url(#stk-clip)">
        <SheetStack A={A} X={STACK.X} Z={STACK.Z} n={n} yaw={STACK.yaw} seed={STACK.seed} uid="stack" />
      </g>
    </g>
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

const CoffeeHundredWorkdays: React.FC<z.infer<typeof schema>> = ({ guides }) => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, scene: officeScene(SUN_T) });

  // you
  const ya = A.P.at(YOU.X, YOU.Z);
  const you = youAt(frame);
  const mugTop = bigMouth(you.mug).c;
  // the robot
  const ga = A.P.at(AI.X, AI.Z);
  const gPose = BOT_POSES.typeAtDesk(-1, frame);

  // the paper
  const n = countAt(frame);
  const padTop = stackTop(PAD.X, PAD.Z, PAD.n + 1, PAD.Y, PAD.yaw, PAD.seed);
  // no floor shadows under the sheets in the air (the only shadow on the floor is the stack's own)
  const flyers = flyersAt(frame, padTop).map(({ i, pose }) => <WorkSheet key={i} A={A} pose={pose} uid={`fl${i}`} />);

  return (
    <AbsoluteFill>
      <AirStage v={A.v} shafts={0} bloom={0.22} overlay={<OfficeTint sunT={SUN_T} />}>
        <WorldSvg cam={cam}>
          <OfficeRoom A={A} sunT={SUN_T} uid="room" room={ROOM} />
          {/* you, at the left desk */}
          <OfficeDesk A={A} X={YOU.X} Z={YOU.Z} dir={1} uid="yd" layer="back" monitor={false} />
          <You f={frame} at={ya.at} scale={ya.scale} fog={A.folkFog(YOU.Z)} unitPx={A.k} />
          <MugSteam at={[ya.at[0] + mugTop[0] * ya.scale, ya.at[1] + mugTop[1] * ya.scale]} scale={ya.scale * MUG_S} frame={frame} amount={SIP.steam(frame)} uid="steam" />
          <MugSteam at={[ya.at[0] + mugTop[0] * ya.scale, ya.at[1] + mugTop[1] * ya.scale]} scale={ya.scale * MUG_S * 0.8} frame={frame + 40} amount={0.7 * SIP.steam(frame)} uid="steam2" />
          <OfficeDesk A={A} X={YOU.X} Z={YOU.Z} dir={1} uid="ydf" layer="front" monitor={false} />
          {/* the robot, at the right desk, the pad by its keyboard */}
          <OfficeDesk A={A} X={AI.X} Z={AI.Z} dir={-1} uid="gd" layer="back" monitor={false} keyboard />
          <SheetStack A={A} X={PAD.X} Z={PAD.Z} Y={PAD.Y} n={PAD.n} yaw={PAD.yaw} seed={PAD.seed} uid="pad" />
          <Bot variant={0} pose={gPose} at={ga.at} scale={ga.scale} uid="ai" frame={frame} fog={A.folkFog(AI.Z)} unitPx={A.k} />
          <OfficeDesk A={A} X={AI.X} Z={AI.Z} dir={-1} uid="gdf" layer="front" monitor={false} keyboard />
          {/* the stack on the floor, the sheets in flight, the tag */}
          <FloorStack A={A} n={n} />
          {flyers}
          <StackTag A={A} frame={frame} />
          <OfficeShafts A={A} sunT={SUN_T} uid="sh" room={ROOM} />
        </WorldSvg>
      </AirStage>
      {guides ? <Guides /> : null}
    </AbsoluteFill>
  );
};

export default CoffeeHundredWorkdays;
