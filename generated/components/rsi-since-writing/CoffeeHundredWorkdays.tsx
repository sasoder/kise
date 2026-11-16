// ---------------------------------------------------------------------------
// CoffeeHundredWorkdays (rsi-since-writing, cut 2). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 117 frames.
// One office inside the misty teal air (AirStage, palette A, the shared world sinceWritingWorld + sinceWritingFolk,
// read-only) on a londonDepth one-point perspective, from the kit kits/dwarkesh-3d/dwarkesh3d.
//
// CHECK LINE: "In the time you drink one morning coffee, an AI gets a hundred workdays done."
//
// THE LINE: "would have a huge edge if it could get 100 workdays done before you finish your morning coffee."
// WORD -> FRAME (f0 = sequence frame 53, 2.2105 s): would -5 · have 2 · a 6 · huge 9 · edge 17 · if 27 · it 37 ·
// could 38 · get 41 · 100 46 · workdays 53 · done 68 · before 74 · you 82 · finish 87 · your 93 · morning 100 ·
// coffee 105 · (slot ends 117) AIs 117
// DURATION: the slot 2.2105 -> 7.0904 s (sequence frames 53-170) = 117 frames at 24000/1001 (f0..f116).
//
// THE MOTION (Revision 1: the robot, the contrast in the picture, one tag): one office in morning light (sunT 0.15,
// the window high on the left, long soft shafts). Two desks a little apart, facing each other across the gap: YOU (Human
// v0, white shirt) at the left desk with a full, steaming cream mug, your hand on it from f0; THE ROBOT (the sister
// clip's tenEarthsBot v0, read-only) at the right desk, typing (BOT_POSES.typeAtDesk, mittens on the keyboard). No
// monitors (the desks stay clear so the stack reads against the wall in the gap). Both are in shot from f0.
// The robot's finished WorkSheets (one sheet = one workday) lift off the pad by its keyboard and arc, in a loose flock,
// onto a stack on the floor in the gap: one by one at first (f6, 14, ...), quickening to ~5 a frame around "100
// workdays" (peak ~f36-46), slowing so the last few land alone and the 100th lands on "done" (f68); no 101st.
// You sip slowly through the whole slot (SIP): sip 1 f4-46 (the level drops 0.85 -> 0.45), the mug held in front of
// your chest f46-62, sip 2 (the last) f62-105: it drains, you tip it back out and set the EMPTY mug down on "coffee"
// (f105), letting go by f112. The steam thins out over the last sip (gone by f96).
// The one label: a slate luggage tag "100 / WORKDAYS" (cream Caslon, PLATE_FONT) on a string from a binder clip on the
// top sheets' front edge, in world space in front of the stack's face; it drops on as the 100th sheet lands (f68-73)
// and swings to rest. No counter, no floating type.
// THE CAMERA: one continuous slow push-in (k 1.64 -> 1.75, f0-102), then a creep; living hold (typing, breath, air).
// CAUSE -> EFFECT: a sheet leaves the pad on its launch frame (flightOf: 20 frames for the first sheets, 14 in the
// stream); the stack steps on the landing frame (the flyer's last frame is exactly at stackTop(n + 1)); the tag comes
// with the 100th. The mug rides your hand while held (the grip re-solved on its handle every frame).
// Orange = the AI only (the robot); the sheets and the mug cream, you in white and slate, the tag slate and cream.
// THE MUG (cut-local): mugShapes' geometry at 1.45x (MUG_S) in cream, painted in the figure's build in place of the
// pose's own mug (the near hand over its handle); the sip arm solved with covidGripTo onto its handle.
//
// DEPTH: eye Y -260, dRef 1700 at kRef 1.32, dolly 0.5, fog by the eye (officeScene(0.15)). Seats at Z 0: you X -215
// (dir 1), the robot X +200 (dir -1); desks x 48..173 along each sitter's dir, Z -30..220 (the gap X -42..27); the pad
// on its desk X 92, Z -2; the floor stack X -8, Z -200 (yaw 88: the A4's long side to us); the tag at Z -222. The window
// moved to X -660..-130, Y -330..-600 (OfficeRoom's room prop; the module is unchanged).
// CHECKS: scripts/clips/rsi-since-writing/check-coffee-hundred.ts (camera, count, faces / tag / landing point vs the
// keep-in box and caption bands, you at x >= 65, sheets vs faces and the mittens, the pop audit: mittens on the keys, the
// mug riding the hand, the mug's speed, the mug down from f105).
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
import { CREAM, OFFICE, OfficeDesk, OfficeRoom, OfficeShafts, OfficeTint, PLATE_FONT, SheetStack, WorkSheet, MugSteam, officeScene, sheetFlight, stackTop, type SheetPose } from "./sinceWritingWorld";
import type { AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 24000 / 1001;
export const DURATION = 117;
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
export const STACK = { X: -8, Z: -200, yaw: 88, seed: 3 };
/** the one label: a luggage tag "100 / WORKDAYS" on a string from a binder clip on the top sheets' front edge, hanging
 *  in front of the stack's face (world space: Z just in front of the face), dropped on as the 100th sheet lands */
export const TAG = { Z: -222, drop: 22, W: 100, H: 70, numSize: 36, labSize: 13.5, labSpacing: 0.05, f0: 68 };
/** the room: the window high on the left (the low morning sun at the upper left; the stack against the plain wall) */
const ROOM = { ...OFFICE, win: { ...OFFICE.win, x0: -660, x1: -130, sill: -330, head: -600 } };
export const TOTAL = 100;

// ---------------------------------------------------------------------------
// THE COUNT: landing frames of sheets 1..100 from an eased rate (a slow start, a peak ~f36, slowing to the 100th on
// f68 "done"). N(f) = 1 + integral_6^f rate, rate = BASE + PEAK * exp(-((f - MID) / SIG)^2), PEAK solved so N(68) = 100.
// ---------------------------------------------------------------------------
const F_FIRST = 6;
const F_LAST = 68;
const BASE = 0.15;
const MID = 36;
const SIG = 12;
/** flight frames of sheet i (0-based): the early, lone sheets float (20 frames, the close-up's long drop to the floor),
 *  the stream at the peak flies in 14 */
export const flightOf = (i: number) => 14 + 6 * (1 - Math.min(1, i / 24));
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
const PEAK = (TOTAL - 1 - BASE * (F_LAST - F_FIRST)) / gaussInt(F_FIRST, F_LAST);
export const LAND: number[] = (() => {
  // invert N(f) by marching in small steps
  const out: number[] = [F_FIRST];
  let f = F_FIRST;
  let N = 1;
  const h = 0.002;
  while (out.length < TOTAL) {
    const r = BASE + PEAK * Math.exp(-(((f + h / 2 - MID) / SIG) ** 2));
    const next = N + r * h;
    const target = out.length + 1;
    if (next >= target) {
      out.push(f + ((target - N) / r));
    }
    N = next;
    f += h;
  }
  out[TOTAL - 1] = F_LAST;
  return out;
})();
/** one sheet's flight at tau 0..1 on the world's sheetFlight, two changes made here (cut-local): the progress along the
 *  arc runs nearly even (sheetFlight eases out hard, which bunched the dense stream into a ladder over the stack) and
 *  the arc is lower (APEX_KEEP of its height: the stream passes under the monitor's screen). Exactly `to` at tau 1. */
const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const progress = (tau: number) => {
  const t = c01(tau);
  return 0.5 * t * t * (3 - 2 * t) + 0.5 * (1 - Math.pow(1 - t, 1.35));
};
/** a sheet's share of the arc's height (0.25-0.8, its own) */
const keepOf = (seed: number) => 0.25 + 0.55 * hash(seed, 1);
export const flightAt = (from: SheetPose, to: SheetPose, tau: number, seed: number): SheetPose => {
  const s = progress(tau);
  const u = 1 - Math.pow(1 - s, 1 / 1.7);
  const q = sheetFlight(from, to, u, seed);
  const dist = Math.hypot(to.X - from.X, to.Z - from.Z, to.Y - from.Y);
  const apex = 30 + 0.32 * dist;
  // a loose flock, not one line: each sheet keeps its own share of the arc's height and drifts sideways a little
  // (zero at both ends, so it still leaves the pad and lands on the stack exactly)
  const keep = keepOf(seed);
  const mid = Math.sin(Math.PI * s);
  return {
    ...q,
    X: q.X + (hash(seed, 2) - 0.5) * 50 * mid,
    Y: q.Y + (1 - keep) * apex * 4 * s * (1 - s),
    Z: q.Z + (hash(seed, 3) - 0.5) * 60 * mid,
    yaw: q.yaw + (hash(seed, 4) - 0.5) * 70 * mid,
    roll: q.roll + (hash(seed, 5) - 0.5) * 30 * mid,
  };
};
/** sheets on the floor stack at frame f */
export const countAt = (f: number) => {
  let n = 0;
  for (const l of LAND) if (l <= f + 1e-9) n++;
  return n;
};

// ---------------------------------------------------------------------------
// THE CAMERA: one continuous move, both sitters in shot throughout: a slow push-in (one lobe, f0-102, k 1.48 -> 1.60)
// as the stack rises between them, then a creep.
// ---------------------------------------------------------------------------
const camKeys = makeCamera([
  { f: 0, k: 1.64, wx: -10, wy: -160, sx: 540, sy: 960 },
  { f: 102, k: 1.75, wx: -10, wy: -165, sx: 540, sy: 960 },
  { f: 116, k: 1.755, wx: -10, wy: -165, sx: 540, sy: 960 },
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
/** sip 1: up f4-16, tip in f14-20, drink to f34, tip out f34-38, down to the hold f36-46; sip 2 (the last): up f62-72,
 *  tip in f69-75, drink (it drains) to f94, tip out f94-98, down f97-105: the empty mug lands on "coffee" (f105) */
export const SIP = {
  e: keyed([[0, 0], [4, 0], [16, 1], [36, 1], [46, 0.3], [62, 0.3], [72, 1], [97, 1], [105, 0]]),
  tip: keyed([[0, 0], [14, 0], [20, 1], [34, 1], [38, 0], [69, 0], [75, 1], [94, 1], [98, 0]]),
  drink: keyed([[0, 0], [15, 0], [21, 1], [33, 1], [38, 0], [71, 0], [77, 1], [93, 1], [98, 0]]),
  level: keyed([[0, 0.85], [20, 0.85], [33, 0.45], [76, 0.45], [93, 0]]),
  hold: keyed([[0, 1], [105, 1], [112, 0]]),
  steam: keyed([[0, 1], [74, 1], [96, 0]]),
};
/** the frame the empty mug lands on the desk ("coffee") */
export const MUG_DOWN = 105;
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
  const tilt = -(62 + 12 * sst(84, 94, f)) * tipA;
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
// sheets' front edge; it drops on as the 100th sheet lands (f68: in over 3 frames, the string goes taut by f73) and
// swings to rest (a damped pendulum about the clip, settled by ~f90). One plane at TAG.Z: a uniform perspective scale.
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
  const flyers: React.ReactNode[] = [];
  // newest first, so the sheets nearer the stack (nearer the camera) paint over the ones just leaving
  for (let i = TOTAL - 1; i >= 0; i--) {
    const land = LAND[i];
    const D = flightOf(i);
    const launch = land - D;
    if (frame < launch || frame >= land) continue;
    const to = stackTop(STACK.X, STACK.Z, i + 1, 0, STACK.yaw, STACK.seed);
    flyers.push(<WorkSheet key={i} A={A} pose={flightAt(padTop, to, (frame - launch) / D, i + 1)} uid={`fl${i}`} shadowY={0} />);
  }

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
          <SheetStack A={A} X={STACK.X} Z={STACK.Z} n={n} yaw={STACK.yaw} seed={STACK.seed} uid="stack" />
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
