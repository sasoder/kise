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
// THE MOTION: one office in morning light (sunT 0.15, the window high on the left: the low sun at the upper left, long
// soft shafts), the world probe's cut-1 layout: two desks side by side a little apart, YOU (Human v0, white shirt) at the
// left desk facing right with a steaming cream mug, the Genius (v0) at the right desk facing you, typing. Each finished
// WorkSheet (one sheet = one workday) lifts off the pad by his keyboard and arcs, in a loose flock, onto a stack on the
// floor in front of the gap between the desks. The landings follow an eased count: one by one at first (f6, 14, ...),
// quickening to ~3 a frame on "100 workdays" (peak ~f52), 89 down by "done" (f68), then slowing so the last few land
// alone and the 100th lands on f100 ("morning"); no 101st. On "100 workdays" (f46-58) a plate slides up in the air
// directly above where the stack ends (pinned there in the world from its entrance) and counts the stack (it shows the
// sheets that have landed); the stack grows up toward it and the 100th sheet lands just under it (the flights are
// capped under the plate: FLIGHT_CEIL). The camera opens close on the Genius (k 2.15, his face at y ~670, the stack's
// place at the left) with a slow creep, then makes one move f62-104 (one lobe): it pulls back to k 1.57 and eases left,
// bringing you in from the left edge (f65-96): you take the mug (f70-75), lift it (f75-86) as your head turns toward
// profile, tip it into your lips and drink (f86-98: the coffee drains, the steam thins out by f100), tip it back out
// (held forward, clear of the face) and set it down empty on "coffee" (f98-107), letting go by f112. Resolved
// f104-116: faces at y ~831, the desks and the stack's base in y 1100-1260, the plate "100 / WORKDAYS" at y 653-757
// between the heads; you with the empty mug, the Genius still typing; living hold (typing, breath, the air, a creep).
// CAUSE -> EFFECT: a sheet leaves the pad on its launch frame (flightOf: 20 frames for the first sheets, 14 in the
// stream); the stack's count steps on the landing frame (the flyer's last frame is exactly at stackTop(n + 1)); the
// plate's number is the stack's count. The mug rides his hand from the grasp (f75) to the release (f107-112).
// Orange = the AI only (the Genius); the sheets and the mug cream, you in white and slate.
// THE MUG (cut-local): mugShapes' geometry at 1.45x (MUG_S) in cream, painted in the figure's build in place of the
// pose's own mug (the near hand over its handle); the sip arm re-solved (covidGripTo) onto its bigger handle.
//
// DEPTH: eye Y -260, dRef 1700 at kRef 1.32, dolly 0.5, fog by the eye (officeScene(0.15)). Seats at Z 0: you X -235
// (dir 1), the Genius X +240 (dir -1); desks x 48..173 along each sitter's dir, Z -30..220; the pad on his desk X 132,
// Z -2; the floor stack X 44, Z -200 (yaw 88: the A4's long side to us); the plate X 44, Z -220, numeral Y -318 (size
// 42), WORKDAYS Y -286 (size 28: cap ~34 px at rest). The stack sits right of the gap's centre so the wide plate stays
// in the keep-in box in the close opening (the human is still hidden off the left edge there). The window moved to
// X -660..-130, Y -330..-600 (OfficeRoom's room prop; the module is unchanged).
// CHECKS: scripts/clips/rsi-since-writing/check-coffee-hundred.ts (camera lobes, count, faces / plate / landing point
// vs the keep-in box and caption bands, the plate vs the faces and the stack, you at x >= 65 once fully in, sheets vs
// faces, the typing hands and the plate's type, every frame).
//
// SOURCES: none on screen. 100 = the speaker's number (his own illustration).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, makeCamera, swayCam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { GENIUS_POSES, Genius } from "../rsi-ten-earths/tenEarthsGenius";
import { HUMAN_DESK, HUMAN_POSES, buildHuman, type HumanPose, type MugState, type P2 } from "./sinceWritingFolk";
import { CovidPaint } from "../kyle-covid/covidFolk";
import { closedD, covidGripTo, ellPts, tubeD, type CShape } from "../kyle-covid/covidFolkBody";
import { add, mix2, mul, rot } from "../kits/maps/stringsMotion";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";
import { MUG, mugShapes } from "./sinceWritingProps";
import { OFFICE, OfficeDesk, OfficeRoom, OfficeShafts, OfficeTint, Plate, SheetStack, WorkSheet, MugSteam, officeScene, sheetFlight, stackTop, type SheetPose } from "./sinceWritingWorld";

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
export const YOU = { X: -235, Z: 0 };
export const AI = { X: 240, Z: 0 };
/** the pad on his desk between the keyboard and the monitor (the source of the sheets) */
export const PAD = { X: AI.X - 108, Y: -132, Z: -2, n: 7, yaw: -3, seed: 7 };
/** the stack on the floor in front of the gap between the desks (the long side of the A4 to us) */
export const STACK = { X: 44, Z: -200, yaw: 88, seed: 3 };
/** the counter plate in the air directly above where the stack ends (fixed from its entrance) */
export const PLATE = { X: STACK.X, Z: -220, numY: -318, numSize: 42, labY: -286, labSize: 28, labSpacing: 0.04, f0: 46, dur: 12 };
/** the room: the window high on the left (the low morning sun at the upper left; the stack against the plain wall) */
const ROOM = { ...OFFICE, win: { ...OFFICE.win, x0: -660, x1: -130, sill: -330, head: -600 } };
export const TOTAL = 100;

// ---------------------------------------------------------------------------
// THE COUNT: landing frames of sheets 1..100 from an eased rate (a slow start, a peak ~f72, slowing to the 100th on
// f100). N(f) = 1 + integral_6^f rate, rate = BASE + PEAK * exp(-((f - MID) / SIG)^2), PEAK solved so N(100) = 100.
// ---------------------------------------------------------------------------
const F_FIRST = 6;
const F_LAST = 100;
const BASE = 0.12;
const MID = 52;
const SIG = 16;
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
/** the ceiling of the flights (world Y, down +): under the plate's label and its soft plate, which hang above the
 *  stack's end (the late sheets, landing just under the plate, rise onto the stack instead of arcing over it) */
export const FLIGHT_CEIL = PLATE.labY + 0.55 * PLATE.labSize + 14;
const keepCache = new Map<number, number>();
/** a sheet's share of the arc: its own (0.25-0.8), cut so the whole flight stays under FLIGHT_CEIL */
const keepOf = (from: SheetPose, to: SheetPose, seed: number, apex: number) => {
  const own = 0.25 + 0.55 * hash(seed, 1);
  const hit = keepCache.get(seed);
  if (hit !== undefined) return hit;
  let k = own;
  for (let j = 1; j < 40; j++) {
    const s = progress(j / 40);
    const qy = sheetFlight(from, to, 1 - Math.pow(1 - s, 1 / 1.7), seed).Y;
    const a = apex * 4 * s * (1 - s);
    // Y = qy + (1 - k) a >= CEIL  ->  k <= 1 - (CEIL - qy) / a
    if (a > 1e-6) k = Math.min(k, 1 - (FLIGHT_CEIL - qy) / a);
  }
  k = Math.max(0, k);
  keepCache.set(seed, k);
  return k;
};
export const flightAt = (from: SheetPose, to: SheetPose, tau: number, seed: number): SheetPose => {
  const s = progress(tau);
  const u = 1 - Math.pow(1 - s, 1 / 1.7);
  const q = sheetFlight(from, to, u, seed);
  const dist = Math.hypot(to.X - from.X, to.Z - from.Z, to.Y - from.Y);
  const apex = 30 + 0.32 * dist;
  // a loose flock, not one line: each sheet keeps its own share of the arc's height and drifts sideways a little
  // (zero at both ends, so it still leaves the pad and lands on the stack exactly)
  const keep = keepOf(from, to, seed, apex);
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
// THE CAMERA: one continuous move. A slow creep close on the Genius (f0-62, k 2.15 -> 2.06), the pull-back and pan
// left in one lobe (f62-104, to k 1.57) that brings you in, then a slow creep.
// ---------------------------------------------------------------------------
const camKeys = makeCamera([
  { f: 0, k: 2.15, wx: 134, wy: -96, sx: 540, sy: 960 },
  { f: 62, k: 2.06, wx: 131, wy: -104, sx: 540, sy: 960 },
  { f: 104, k: 1.57, wx: -11, wy: -148, sx: 540, sy: 960 },
  { f: 116, k: 1.56, wx: -13, wy: -148, sx: 540, sy: 960 },
]);
export const camOf = (f: number) => swayCam(camKeys(f), f);
const REST = camOf(0);

// ---------------------------------------------------------------------------
// YOU: the sip, warped onto the words (seatedSip's t: grasp 0-0.1, lift 0.1-0.36, tip + drink 0.36-0.62, tip back +
// lower 0.62-0.92, release 0.92-1)
// ---------------------------------------------------------------------------
const SIP_KEYS: [number, number][] = [
  [70, 0],
  [75, 0.1],
  [86, 0.36],
  [90, 0.44],
  [94, 0.62],
  [98, 0.74],
  [107, 0.92],
  [112, 1],
];
export const sipTAt = (f: number) => {
  if (f <= SIP_KEYS[0][0]) return 0;
  for (let i = 1; i < SIP_KEYS.length; i++) {
    const [fa, ta] = SIP_KEYS[i - 1];
    const [fb, tb] = SIP_KEYS[i];
    if (f <= fb) return ta + (tb - ta) * ((f - fa) / (fb - fa));
  }
  return 1;
};
/** the coffee in the mug: drunk while the mug is tipped */
const levelAt = (f: number) => 0.8 * (1 - sst(86, 96, f));
const steamAt = (f: number) => 1 * (1 - sst(86, 101, f));

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
  const u = sipTAt(f);
  const lvl = levelAt(f);
  const src = HUMAN_POSES.seatedSip(1, u, f, lvl);
  const grasp = sst(0, 0.1, u);
  const lift = sst(0.1, 0.36, u) - sst(0.74, 0.92, u);
  const tipA = sst(0.3, 0.42, u) - sst(0.62, 0.74, u);
  const release = sst(0.92, 1, u);
  const tilt = -62 * tipA;
  const e = sst(0, 1, lift);
  const atMouth = bigBaseForRim(add(sipMouth(), [2, 1]), tilt, -1);
  const arc: P2 = [10 * Math.sin(Math.PI * e), -4 * Math.sin(Math.PI * e)];
  // held off the face (forward, away from it) whenever it is up but not tipped into the lips: it comes up in front of
  // the chin, tips in to drink, tips back out and leaves forward, never crossing the face
  const off: P2 = [AWAY * e * (1 - tipA), 0];
  const mug: MugState = { base: add(add(mix2(HUMAN_DESK.mug, atMouth, e), arc), off), tilt, level: lvl * (1 - 0.06 * sst(0.4, 0.62, u)), handle: -1 };
  const restHand = HUMAN_DESK.rest;
  const grip = mix2(mix2(restHand, bigHandle(mug), grasp), add(restHand, [-4, 0]), release);
  const turned: HumanPose = { ...src.pose, headYaw: src.pose.headYaw + PROFILE_TURN * sst(0, 0.55, lift) };
  const q = covidGripTo("officer", 3, turned, { L: grip }, [0, 0], 1) as HumanPose;
  return { pose: { ...q, armL: { ...q.armL, fist: src.pose.armL.fist, hand: src.pose.armL.hand }, armR: src.pose.armR, mug: src.mug }, mug };
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
  // the Genius
  const ga = A.P.at(AI.X, AI.Z);
  const gPose = GENIUS_POSES.typeAtDesk(-1, frame);

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
  // the plate: slides up on "100 workdays" (f46), counts the stack
  const plateIn = c01((frame - PLATE.f0) / PLATE.dur);

  return (
    <AbsoluteFill>
      <AirStage v={A.v} shafts={0} bloom={0.22} overlay={<OfficeTint sunT={SUN_T} />}>
        <WorldSvg cam={cam}>
          <OfficeRoom A={A} sunT={SUN_T} uid="room" room={ROOM} />
          {/* you, at the left desk */}
          <OfficeDesk A={A} X={YOU.X} Z={YOU.Z} dir={1} uid="yd" layer="back" />
          <You f={frame} at={ya.at} scale={ya.scale} fog={A.folkFog(YOU.Z)} unitPx={A.k} />
          <MugSteam at={[ya.at[0] + mugTop[0] * ya.scale, ya.at[1] + mugTop[1] * ya.scale]} scale={ya.scale * MUG_S} frame={frame} amount={steamAt(frame)} uid="steam" />
          <MugSteam at={[ya.at[0] + mugTop[0] * ya.scale, ya.at[1] + mugTop[1] * ya.scale]} scale={ya.scale * MUG_S * 0.8} frame={frame + 40} amount={0.7 * steamAt(frame)} uid="steam2" />
          <OfficeDesk A={A} X={YOU.X} Z={YOU.Z} dir={1} uid="ydf" layer="front" />
          {/* the Genius, at the right desk, the pad by his keyboard */}
          <OfficeDesk A={A} X={AI.X} Z={AI.Z} dir={-1} uid="gd" layer="back" />
          <SheetStack A={A} X={PAD.X} Z={PAD.Z} Y={PAD.Y} n={PAD.n} yaw={PAD.yaw} seed={PAD.seed} uid="pad" />
          <Genius variant={0} pose={gPose} at={ga.at} scale={ga.scale} uid="ai" frame={frame} fog={A.folkFog(AI.Z)} unitPx={A.k} />
          <OfficeDesk A={A} X={AI.X} Z={AI.Z} dir={-1} uid="gdf" layer="front" />
          {/* the stack on the floor, the sheets in flight, the counter */}
          <SheetStack A={A} X={STACK.X} Z={STACK.Z} n={n} yaw={STACK.yaw} seed={STACK.seed} uid="stack" />
          {flyers}
          {plateIn > 0 ? (
            <>
              <Plate A={A} X={PLATE.X} Y={PLATE.numY} Z={PLATE.Z} text={`${n}`} t={plateIn} uid="pn" size={PLATE.numSize} />
              <Plate A={A} X={PLATE.X} Y={PLATE.labY} Z={PLATE.Z} text="WORKDAYS" t={plateIn} uid="pw" size={PLATE.labSize} plate={0.7} letterSpacing={PLATE.labSpacing} />
            </>
          ) : null}
          <OfficeShafts A={A} sunT={SUN_T} uid="sh" room={ROOM} />
        </WorldSvg>
      </AirStage>
      {guides ? <Guides /> : null}
    </AbsoluteFill>
  );
};

export default CoffeeHundredWorkdays;
