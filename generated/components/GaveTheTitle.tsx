// ---------------------------------------------------------------------------
// GaveTheTitle (file 7_GaveTheTitle; Dwarkesh Patel with Si Sheppard, "Texcoco").
// Dwarkesh map style, "beyond maps" umber page; the cast is texcocoFigures.
// Opaque 1080x1920, 23.976 fps, 95 frames (f0..f94).
//
// CHECK LINE: "Moctezuma, an outsider, settled Texcoco's succession himself by
// putting the crown on one brother and leaving the other with nothing."
//
// THE LINE: "Moctezuma stepped in and gave the title to one of those brothers."
// WORD -> FRAME: Moctezuma 2 · stepped 11 · in 18 · and 27 · gave 35 · the 46 ·
//   TITLE 59 · to 66 · one 73 · of 78 · those 81 · brothers 85 (ends ~91).
//
// THE MOTION (one gesture): f0 the two brothers of Texcoco face each other,
// each reaching for the ORANGE diadem that hangs between them. Moctezuma comes
// forward out of the shade behind them (f2-f30, growing and lightening), takes
// the diadem out of the air (left hand f22, the right joins f38), turns to the
// left brother and sets it on his head (it lands f59-f62, "title"). The crowned
// brother, who bowed to receive it, straightens and lifts his chin, a hand on
// his chest; the other's arm falls, his head drops and turns away, his fist
// closes (f60-f84). Moctezuma's hand rests on the crowned shoulder. The camera
// pushes in and left onto the crowning, then eases back to hold all three.
// Orange = Texcoco's own: the diadem (the title) and the band on the passed-over
// brother's topknot (bothSidesFigures' TopknotBand, worn from f0; BothSides opens on it).
//
// END STATE: GAVE_END = gaveState(94) (every pose, place, the diadem, the
// camera); <GaveTableau s={GAVE_END} /> under GAVE_END.cam is frame 94 exactly.
// gaveState(f) for f > 94 holds the poses and keeps the idle and the creep going.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { smootherstep, smoothstep } from "./incaShared";
import { Brother, Diadem, Moctezuma, SPECS, STAND, figureAnchors, toLocal, type FigPose } from "./texcocoFigures";
import { FPS, Label, TexcocoPage, WorldSvg, idle, makeCamera, poseTrack, shadeInk, track, type Cam, type P2 } from "./texcocoShared";
import { add, mix, mix2, mul, rot } from "./stringsMotion";
import { TopknotBand } from "./bothSidesFigures";

export { FPS };
export const DURATION = 95;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// LAYOUT (world px; the camera starts at k 1, so world = screen at f0)
// ---------------------------------------------------------------------------
export const B0_AT: P2 = [281, 1238];
export const B0_SCALE = 2.3;
export const B1_AT: P2 = [801, 1242];
export const B1_SCALE = 2.26;
/** where the diadem hangs at f0 (its anchor = the middle of the face it would sit on) */
const DIADEM_START: P2 = [500, 452];
const DIADEM_SCALE = B0_SCALE * SPECS.brother0.headScale;
const T = { take: 21, land: 61 };

const b0w = (w: P2) => toLocal(w, B0_AT, B0_SCALE);
const b1w = (w: P2) => toLocal(w, B1_AT, B1_SCALE);

// ---- brother 0 (left; he is crowned). He faces right: his far, leading arm is armR
const B0_BASE: FigPose = {
  ...STAND,
  yaw: 0.86,
  headYaw: 0.98,
  pitch: -11,
  lean: 3,
  brow: -0.4,
  armL: { w: [-36, -152], elbow: [-0.7, 1], fist: 0.3, hand: 0 },
  armR: { w: b0w([422, 492]), elbow: [0.2, 1], fist: 0, hand: -8 },
};
const b0Track = poseTrack([
  [0, B0_BASE],
  [20, { ...B0_BASE, armR: { ...B0_BASE.armR, w: b0w([426, 486]) } }],
  [32, { ...B0_BASE, pitch: -8, lean: 1.5, armR: { ...B0_BASE.armR, w: b0w([414, 530]), fist: 0.15 } }],
  [47, { ...B0_BASE, pitch: 3, lean: 2.5, lids: 0.2, brow: -0.2, armR: { w: b0w([401, 720]), elbow: [0.2, 1], fist: 0.2, hand: 0 } }],
  [60, { ...B0_BASE, pitch: 9, lean: 3.5, lids: 0.35, brow: 0, armR: { w: [34, -150], elbow: [0.5, 1], fist: 0.25, hand: 0 }, armL: { w: [-30, -160], elbow: [-0.7, 1], fist: 0.25, hand: 0 } }],
  [78, { ...B0_BASE, pitch: -7, lean: -0.5, lids: 0, brow: -0.15, mouth: 0.7, armR: { w: [32, -150], elbow: [0.5, 1], fist: 0.25, hand: 0 }, armL: { w: [-2, -192], elbow: [-1, 0.5], fist: 0.1, hand: 28 } }],
  [94, { ...B0_BASE, pitch: -8, lean: -0.8, lids: 0, brow: -0.15, mouth: 0.7, armR: { w: [32, -151], elbow: [0.5, 1], fist: 0.25, hand: 0 }, armL: { w: [-1, -193], elbow: [-1, 0.5], fist: 0.1, hand: 28 } }],
]);

// ---- brother 1 (right; passed over). He faces left: his far, leading arm is armL
const B1_BASE: FigPose = {
  ...STAND,
  yaw: -0.86,
  headYaw: -0.98,
  pitch: -11,
  lean: -3,
  brow: -0.4,
  armL: { w: b1w([642, 476]), elbow: [-0.2, 1], fist: 0, hand: 8 },
  armR: { w: [30, -156], elbow: [0.3, 1], fist: 0.3, hand: 0 },
};
const b1Track = poseTrack([
  [0, B1_BASE],
  [8, { ...B1_BASE, armL: { ...B1_BASE.armL, w: b1w([676, 512]) } }],
  [15, { ...B1_BASE, pitch: -8, lean: -1, brow: 0.2, armL: { ...B1_BASE.armL, w: b1w([767, 628]), elbow: [0.7, 1], fist: 0.15 } }],
  [58, { ...B1_BASE, pitch: -1, lean: -1, brow: 0.6, mouth: -0.4, armL: { w: b1w([767, 650]), elbow: [0.7, 1], fist: 0.3, hand: 4 }, armR: { ...B1_BASE.armR, fist: 0.5 } }],
  [72, { ...B1_BASE, yaw: -0.78, headYaw: -0.45, pitch: 9, lean: 0.5, brow: 0.85, lids: 0.3, mouth: -0.8, armL: { w: [-30, -152], elbow: [-0.5, 1], fist: 0.5, hand: 0 }, armR: { w: [33, -186], elbow: [0.7, 1], fist: 0.8, hand: 0 } }],
  [84, { ...B1_BASE, yaw: -0.7, headYaw: 0.36, pitch: 16, lean: 2, brow: 1, lids: 0.45, mouth: -1, armL: { w: [-28, -150], elbow: [-0.5, 1], fist: 0.6, hand: 0 }, armR: { w: [32, -200], elbow: [0.7, 1], fist: 0.92, hand: 0 } }],
  [94, { ...B1_BASE, yaw: -0.68, headYaw: 0.42, pitch: 17, lean: 2.3, brow: 1, lids: 0.45, mouth: -1, armL: { w: [-28, -150], elbow: [-0.5, 1], fist: 0.6, hand: 0 }, armR: { w: [32, -202], elbow: [0.7, 1], fist: 1, hand: 0 } }],
]);

// ---- Moctezuma: he comes forward out of the shade, turning to the left brother
const mocX = track([[0, 630], [24, 642], [38, 628], [58, 590], [78, 598], [94, 600]]);
const mocY = track([[0, 1180], [14, 1204], [30, 1224], [94, 1226]]);
const mocScale = track([[0, 1.8], [14, 2.15], [30, 2.5], [94, 2.5]]);
const mocTone = track([[0, 0.5], [10, 0.64], [26, 1], [94, 1]]);
const MOC_BASE: FigPose = {
  ...STAND,
  yaw: -0.2,
  headYaw: -0.38,
  pitch: -8,
  armL: { w: [-44, -176], elbow: [-0.5, 1], fist: 0.25, hand: 0 },
  armR: { w: [32, -158], elbow: [0.2, 1], fist: 0.25, hand: 0 },
};
const mocTrack = poseTrack([
  [0, MOC_BASE],
  [24, { ...MOC_BASE, yaw: -0.46, headYaw: -0.62, pitch: -6, lean: 3, roll: 7, armL: { w: [-60, -260], elbow: [0.3, 1], fist: 0.5, hand: 0 }, armR: { w: [24, -164], elbow: [0.2, 1], fist: 0.3, hand: 0 } }],
  [40, { ...MOC_BASE, yaw: -0.86, headYaw: -0.98, pitch: 0, lean: -5, armL: { w: [-90, -270], elbow: [0.3, 1], fist: 0.5, hand: 0 }, armR: { w: [-34, -196], elbow: [0.4, 1], fist: 0.4, hand: 0 } }],
  [59, { ...MOC_BASE, yaw: -1.02, headYaw: -1.12, pitch: 8, lean: -9, crouch: 2, armL: { w: [-120, -250], elbow: [0.3, 1], fist: 0.5, hand: 0 }, armR: { w: [-90, -250], elbow: [0.4, 1], fist: 0.55, hand: 0 } }],
  [80, { ...MOC_BASE, yaw: -0.9, headYaw: -1.06, pitch: 6, lean: -5, crouch: 0, mouth: 0.3, armL: { w: [-6, -172], elbow: [0.4, 1], fist: 0.3, hand: 0 }, armR: { w: [-70, -230], elbow: [0.4, 1], fist: 0.12, hand: -30 } }],
  [94, { ...MOC_BASE, yaw: -0.89, headYaw: -1.06, pitch: 6, lean: -4.6, crouch: 0, mouth: 0.3, armL: { w: [-6, -172], elbow: [0.4, 1], fist: 0.3, hand: 0 }, armR: { w: [-70, -230], elbow: [0.4, 1], fist: 0.12, hand: -30 } }],
]);
/** how firmly each of his hands is on the diadem, and his right hand on the crowned shoulder */
const gripL = track([[10, 0], [22, 1], [62, 1], [78, 0]]);
const gripR = track([[36, 0], [49, 1], [63, 1], [72, 0]]);
const onShoulder = track([[63, 0], [77, 1]]);

// ---- the camera: all three; in and left onto the crowning; back a little to hold all three
const camAt = makeCamera([
  { f: 0, k: 1.14, wx: 541, wy: 714, sx: 540, sy: 960 },
  { f: 30, k: 1.18, wx: 532, wy: 718, sx: 540, sy: 960 },
  { f: 58, k: 1.22, wx: 524, wy: 724, sx: 540, sy: 960 },
  { f: 82, k: 1.175, wx: 548, wy: 728, sx: 540, sy: 960 },
  { f: 94, k: 1.2, wx: 548, wy: 732, sx: 540, sy: 960 },
]);

// ---------------------------------------------------------------------------
// THE STATE AT A FRAME
// ---------------------------------------------------------------------------
export type GaveState = ReturnType<typeof gaveState>;
export const gaveState = (f: number) => {
  const b0Pose = idle(b0Track(f), f, 1);
  const b1Pose = idle(b1Track(f), f, 2);
  const b0 = figureAnchors(SPECS.brother0, b0Pose, B0_AT, B0_SCALE);
  // the diadem: it hangs, he takes it, one arc across and down onto the brow
  const e = smootherstep((f - T.take) / (T.land - T.take));
  const bob = (1 - smoothstep((f - 12) / 12)) * 3.5 * Math.sin(f / 5.5);
  const dAt = add(mix2([DIADEM_START[0], DIADEM_START[1] + bob], b0.crown.at, e), [0, -46 * Math.sin(Math.PI * e) * (1 - 0.5 * e)]);
  const diadem = { at: dAt, scale: DIADEM_SCALE, rot: mix(0, b0.crown.rot, e) - 7 * Math.sin(Math.PI * e), yaw: mix(0, b0.crown.yaw, e) };
  /** a point of the diadem (head units) in world px */
  const dw = (p: P2): P2 => add(diadem.at, rot(mul(p, diadem.scale), diadem.rot));
  // Moctezuma
  const mAt: P2 = [mocX(f), mocY(f)];
  const mScale = mocScale(f);
  const mLoc = (w: P2) => toLocal(w, mAt, mScale);
  const mp = mocTrack(f);
  const gL = gripL(f);
  const gR = gripR(f);
  const sh = onShoulder(f);
  const holdL = mLoc(add(dw([-9, -7]), [16, 30]));
  const holdR = mLoc(add(dw([25, -15]), [56, -2]));
  const rest = mLoc(add(b0.shoulderR, [60, 16]));
  const mocPose: FigPose = idle(
    {
      ...mp,
      armL: { ...mp.armL, w: mix2(mp.armL.w, holdL, gL) },
      armR: { ...mp.armR, w: mix2(mix2(mp.armR.w, holdR, gR), rest, sh) },
    },
    f,
    3,
    0.8,
  );
  const moc = figureAnchors(SPECS.moctezuma, mocPose, mAt, mScale);
  const apex = add(moc.crown.at, rot([0, -63 * moc.crown.scale], moc.crown.rot));
  return {
    frame: f,
    cam: camAt(f) as Cam,
    b0: { pose: b0Pose, at: B0_AT, scale: B0_SCALE },
    b1: { pose: b1Pose, at: B1_AT, scale: B1_SCALE },
    moc: { pose: mocPose, at: mAt, scale: mScale, tone: mocTone(f) },
    diadem,
    /** the label's world point: over the point of his own diadem */
    label: [mix(545, apex[0], 0.3), mix(262, apex[1] - 30, smoothstep((f - 16) / 30))] as P2,
  };
};
/** the last frame: every pose and place, the diadem on the brother's brow, the camera */
export const GAVE_END = gaveState(DURATION - 1);

/** the three figures and the diadem of a state (draw inside a WorldSvg under s.cam) */
export const GaveTableau: React.FC<{ s: GaveState }> = ({ s }) => {
  const ink = shadeInk(s.moc.tone);
  return (
    <>
      <Moctezuma pose={s.moc.pose} at={s.moc.at} scale={s.moc.scale} ink={ink} arms="L" uid="gt-m" />
      <Brother variant={1} pose={s.b1.pose} at={s.b1.at} scale={s.b1.scale} uid="gt-b1" />
      <Brother variant={0} pose={s.b0.pose} at={s.b0.at} scale={s.b0.scale} uid="gt-b0" />
      <Diadem {...s.diadem} uid="gt-d" />
      <Moctezuma pose={s.moc.pose} at={s.moc.at} scale={s.moc.scale} ink={ink} body={false} arms="R" uid="gt-mr" />
    </>
  );
};

const GaveTheTitle: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const s = gaveState(frame);
  // the passed-over brother's ORANGE topknot band (BothSides' overlay, mounted as there: over the tableau,
  // on his head's `crown` anchor). Its ribbon ends trail his head's turn a little and hang still (sway 0)
  // on the last frame, which is where BothSides picks them up.
  const b1Crown = figureAnchors(SPECS.brother1, s.b1.pose, s.b1.at, s.b1.scale).crown;
  const turning = (b1Track(frame).headYaw - b1Track(frame - 3).headYaw) / 0.6;
  const bandSway = (-5 * Math.max(-1, Math.min(1, turning)) * Math.cos(s.b1.pose.headYaw) + 1.1 * Math.sin((frame - (DURATION - 1)) / 9.5)) * (1 - smoothstep((frame - 84) / 10)) + 1.1 * Math.sin((frame - (DURATION - 1)) / 9.5) * smoothstep((frame - 84) / 10);
  return (
    <AbsoluteFill>
      <TexcocoPage cam={s.cam}>
        <WorldSvg cam={s.cam}>
          <GaveTableau s={s} />
          <TopknotBand crown={b1Crown} sway={bandSway} uid="gt-band" />
        </WorldSvg>
        <Label text="MOCTEZUMA" x={s.label[0]} y={s.label[1]} cam={s.cam} frame={frame} f0={-4} size={84} />
      </TexcocoPage>
    </AbsoluteFill>
  );
};

export default GaveTheTitle;
