// ---------------------------------------------------------------------------
// TechnologicalAdvantages (cut A of "Sheppard_Conquistador_Advantages";
// Dwarkesh Patel with Si Sheppard). Dwarkesh map style, "beyond maps" umber
// page; the cast is techAdvFigures. Opaque 1080x1920, 23.976 fps, 107 frames.
//
// CHECK LINE: After this cut the viewer can say: "the conquistador's edge is
// his steel - helmet, breastplate, sword - against a warrior armed with wood,
// stone and cotton."
//
// THE LINE: "[In the grand scheme of things,] the technological advantages
// that the conquistadors had over these empires [are not that shockingly big]"
// WORD -> FRAME: the -3 · technological 2 · advantages 14-29 · that 29 ·
//   the 44 · conquistadors 48-72 · had 72 · over 80 · these 87 · empires 92-101.
//
// THE MOTION (one move): we are close on the conquistador, waist-up. Orange
// ink is laid down him in pen strokes, top to bottom: the morion, the gorget
// and pauldrons, the breastplate, the tassets, the hilt (f2-f31). His hand
// goes to the hilt and he draws: the blade leaves the scabbard already orange
// and comes round to a guard at his waist, point forward (f31-f75), while the
// camera makes ONE eased pull-back and pan left that finds the Aztec warrior
// already standing there; he brings shield and macuahuitl up into his own
// guard as he comes into frame, and stays cream. Settled two-shot by f95,
// then it holds, alive. An inventory, not a triumph: no glow, no text.
// Orange = the Spaniard's steel, nothing else.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { pchip, smoothstep } from "./incaShared";
import { add, mix, mix2, rot } from "./stringsMotion";
import { FPS, TexcocoPage, WorldSvg, makeCamera, track, type P2 } from "./texcocoShared";
import { CONQ_IDLE, CONQ_K, Conquistador, WAR_K, WAR_READY, Warrior, conqRig, holdAt, swordInScabbard, warRig, wristFrom, type ConqPose, type Steel, type WarPose } from "./techAdvFigures";

export { FPS };
export const DURATION = 107;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// LAYOUT (world px = the final two-shot's screen px)
// ---------------------------------------------------------------------------
/** px per figure unit */
const U = 3.05;
const FEET_Y = 1566;
/** he steps in as he draws: his hips travel SHIFT units toward the warrior */
const SHIFT = 10;
const CONQ_X = 540 + 131 * U;
const WAR_X = 540 - 126 * U;
const c01 = (v: number) => Math.max(0, Math.min(1, v));

const T = {
  ink0: 2,
  reach0: 15,
  grip: 30,
  pull0: 31,
  clear: 55,
  guard: 87,
  step0: 36,
  step1: 66,
  war0: 50,
  war1: 86,
};

// ---- the ink: a front of pen strokes travelling down him at a constant pace
const INK_SPEED = 11.4;
const steelAt = (f: number): Steel => {
  const lead = -352 + INK_SPEED * (f - T.ink0);
  return f < T.ink0 ? { lead: null } : lead > 60 ? { lead, all: true } : { lead };
};

// ---- the conquistador
const stance = track([[T.step0, 0], [T.step1, 1]]);
const tilt = track([[0, 74], [24, 74], [40, 46], [DURATION, 46]]);
const scabBack = track([[57, 0], [84, 36]]);
/** his off hand lets the scabbard go once the blade is out, and hangs at his side */
const letGo = track([[57, 0], [78, 1]]);
const outC = pchip([[29, 0], [T.pull0, 0], [43, 66], [52, 121], [58, 135], [61, 137]]);
const out = (f: number) => (f <= T.pull0 ? 0 : f >= 61 ? 137 : outC(f));
const swing = track([[T.clear - 1, 0], [T.guard, 180]]);
/** the sword arm's elbow, from its shoulder: it swings out to his side as the hand crosses before it */
const elbowX = track([[0, -4], [30, -4], [41, -36], [55, -27], [70, -34], [T.guard, -8]]);
const elbowY = track([[0, 58], [30, 58], [41, 45], [55, 53], [70, 46], [T.guard, 31]]);
const free = track([[T.clear - 1, 0], [T.guard, 1]]);
const reach = track([[T.reach0, 0], [T.grip, 1]]);
const glance = (f: number) => Math.sin(Math.PI * c01((f - 16) / 26)) ** 2;
const HANG = conqRig(CONQ_IDLE).far.grip;

const conqState = (f: number) => {
  const st = stance(f);
  const s = c01((f - 38) / 23);
  const base: ConqPose = {
    ...CONQ_IDLE,
    headYaw: mix(-0.8, -0.98, st) + 0.05 * glance(f) + 0.015 * Math.sin(f / 19),
    roll: 0.5 * Math.sin(f / 17 + 1),
    pitch: mix(-2, -1, st) + 7 * glance(f),
    lean: mix(0, -5.5, st) + 0.25 * Math.sin(f / 23),
    crouch: mix(0, 11, st) + 0.7 * Math.sin(f / 12.5),
    footFar: [-(24 + SHIFT) * smoothstep(s) + SHIFT * st, -7 * Math.sin(Math.PI * s) ** 2],
    footNear: [SHIFT * st, 0],
    liftFar: 9 * Math.sin(Math.PI * s) * Math.cos(Math.PI * s),
    liftNear: 0,
    brow: mix(0.3, 0.62, st),
    lids: 0.12 * glance(f),
    mouth: mix(0, -0.25, st),
  };
  const rig = conqRig(base);
  const scabDir = tilt(f) + scabBack(f) + 0.6 * Math.sin(f / 15);
  // the sword: on the scabbard's line until its point is clear, then it comes round to the guard
  const line = swordInScabbard(rig.mouth, tilt(f) + 0.6 * Math.sin(f / 15) * (1 - c01((f - 50) / 6)), out(f));
  const fr = free(f);
  const guardG = add(rig.hip, rot([-45, -21], base.lean));
  const arc = Math.sin(Math.PI * fr);
  const g = add(mix2(line.g, guardG, fr), [56 * arc, 2 * arc]);
  const sword = { g: add(g, [0, 0.5 * Math.sin(f / 11) * fr]), dir: line.dir + swing(f) + 1.2 * Math.sin(f / 14) * fr };
  // his sword hand: it leaves his side for the hilt, then it IS the sword's grip
  const a = reach(f);
  const H = add(mix2(HANG, sword.g, a), [-12 * Math.sin(Math.PI * a), -3 * Math.sin(Math.PI * a)]);
  // the elbow hangs under the shoulder while the forearm sweeps round it (it foreshortens as the hand
  // crosses before it); in the guard it sits out at his side
  const farElbow: P2 = [elbowX(f), elbowY(f)];
  const handAng = mix(0, -22, a) + 64 * fr;
  const far = { w: wristFrom(add(rig.far.S, farElbow), H, CONQ_K, handAng), elbow: [-0.3, 1] as P2, fist: mix(0.35, 1, smoothstep((a - 0.5) * 2)), hand: handAng };
  // his other hand steadies the scabbard at its throat and tips it for the draw
  const throat = add(rig.mouth, rot([7, 0], scabDir));
  const lg = letGo(f);
  const hang = add(rig.hip, [36, 20 + 0.8 * Math.sin(f / 11)]);
  const near = holdAt(rig.near.S, mix2(add(throat, [1.5, -1]), hang, lg), CONQ_K, [1, 0.3], mix(26, 4, lg), mix(0.9, 0.45, lg));
  const pose: ConqPose = { ...base, far, farElbow, near };
  return { pose, at: [CONQ_X - SHIFT * U * st, FEET_Y] as P2, sword, scab: scabDir, steel: steelAt(f), sheathed: f < T.clear + 1 };
};

// ---- the warrior: he was standing ready; he sinks into his guard as the camera finds him
const WAR_GUARD: WarPose = {
  ...WAR_READY,
  headYaw: 0.93,
  pitch: 3,
  lean: 5,
  crouch: 11,
  far: { w: [60, -181], elbow: [-0.5, 1], fist: 1, hand: 0 },
  near: { w: [43, -224], elbow: [0, 1], fist: 1, hand: 0 },
  footFar: [26, 0],
  footNear: [-11, 0],
  brow: 0.8,
  mouth: -0.5,
  club: -66,
  shield: 5,
};
const guardUp = track([[T.war0, 0], [T.war1, 1]]);
/** his shield comes forward only once the sword's point has gone by */
const shieldUp = track([[80, 0], [98, 1]]);
const clubUp = track([[T.war0 + 2, 0], [T.war1 + 2, 1]]);
const warState = (f: number) => {
  const w = guardUp(f);
  const cu = clubUp(f);
  const s = c01((f - (T.war0 + 4)) / 22);
  const A = WAR_READY;
  const B = WAR_GUARD;
  const lift = Math.sin(Math.PI * w);
  const pose: WarPose = {
    headYaw: mix(A.headYaw, B.headYaw, w) + 0.015 * Math.sin(f / 18 + 2),
    roll: 0.5 * Math.sin(f / 16 + 0.5),
    pitch: mix(A.pitch, B.pitch, w),
    lean: mix(A.lean, B.lean, w) + 0.3 * Math.sin(f / 22 + 1),
    crouch: mix(A.crouch, B.crouch, w) + 0.7 * Math.sin(f / 13 + 2),
    far: { w: add(mix2(A.far.w, B.far.w, shieldUp(f)), [0, -4 * Math.sin(Math.PI * shieldUp(f)) + 0.8 * Math.sin(f / 12)]), elbow: A.far.elbow, fist: 1, hand: 0 },
    near: { w: add(mix2(A.near.w, B.near.w, cu), [0, -5 * Math.sin(Math.PI * cu) + 0.7 * Math.sin(f / 10 + 1)]), elbow: mix2(A.near.elbow, B.near.elbow, cu), fist: 1, hand: mix(-20, -30, cu) },
    footFar: [mix(A.footFar[0], B.footFar[0], smoothstep(s)), -6 * Math.sin(Math.PI * s) ** 2],
    footNear: mix2(A.footNear, B.footNear, w),
    liftFar: -8 * Math.sin(Math.PI * s) * Math.cos(Math.PI * s),
    liftNear: 0,
    brow: mix(A.brow, B.brow, w),
    lids: 0,
    mouth: mix(A.mouth, B.mouth, w),
    hem: 1.6 * Math.sin(f / 10.5) - 5 * lift,
    club: mix(A.club, B.club, cu) + 0.9 * Math.sin(f / 13) * cu,
    shield: mix(A.shield, B.shield, w),
  };
  return { pose, at: [WAR_X, FEET_Y] as P2 };
};

// ---------------------------------------------------------------------------
// THE CAMERA: close on him, following the ink down; then one pull-back and pan
// left to the two-shot; a slow creep in to the end
// ---------------------------------------------------------------------------
const HEAD0 = add([CONQ_X, FEET_Y], [-9 * U, -286 * U]);
const K0 = 1.8;
const K1 = 1.68;
const camAt = makeCamera([
  { f: 0, k: K0, wx: HEAD0[0], wy: HEAD0[1], sx: 590, sy: 590 },
  { f: 29, k: K1, wx: HEAD0[0], wy: HEAD0[1], sx: 575, sy: 500 },
  { f: 95, k: 1.014, wx: 541, wy: 961, sx: 540, sy: 960 },
  { f: DURATION, k: 1, wx: 539, wy: 960, sx: 540, sy: 960 },
]);

const TechnologicalAdvantages: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const c = conqState(frame);
  const w = warState(frame);
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Warrior pose={w.pose} at={w.at} scale={U} uid="ta-w" />
          <Conquistador pose={c.pose} at={c.at} scale={U} sword={c.sword} scab={c.scab} steel={c.steel} sheathed={c.sheathed} uid="ta-c" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default TechnologicalAdvantages;

/** review sheet: both figures at full size, at the frame given by `at` (default: the settled guard) */
export const sheetSchema = z.object({ at: z.number() });
export const TechAdvSheet: React.FC<z.infer<typeof sheetSchema>> = ({ at }) => {
  const cam = { k: 1, cx: 540, cy: 960 };
  const c = conqState(at);
  const w = warState(at);
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          <Warrior pose={w.pose} at={w.at} scale={U} uid="sh-w" />
          <Conquistador pose={c.pose} at={c.at} scale={U} sword={c.sword} scab={c.scab} steel={c.steel} sheathed={c.sheathed} uid="sh-c" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
/** the rigs, for measuring */
export const techAdvProbe = (f: number) => ({ conq: conqState(f), war: warState(f), cam: camAt(f), warRig: warRig(warState(f).pose), kw: WAR_K });
