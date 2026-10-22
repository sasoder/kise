// ---------------------------------------------------------------------------
// pandemicFolk — THE PEOPLE of the Kyle Harper pandemics clip (kyle-pandemics, V3), take 2: the DRAWN cast in the
// approved style A "gouache" (style frames: pandemicFolkSketch / pandemicFolkFrames, director's pick Oct 21). A
// picture-book cast: flat matte colour shapes, no outline, one soft crescent shadow per shape from the upper-left
// light, gouache grain + dry-brush mottling + hand-wobbly edges, dot eyes, a small nose, blush, mitten hands. Orange
// (#FFB000 / #D98A0C) only where the disease is. Replaces the retired realistic pandemicCast*.
//
// UNITS: figure units, feet at the origin, up is -y; the Worker is ~512 units to the top of his cap (a woman ~470, a
// child ~375). FIGURE_PX(px) = the scale (px per unit) that makes the Worker px tall. Draw inside a full-frame <svg>.
//
// THE WORKER (cuts 32 and 74) — a 2.5D rig (pandemicFolkWorker): every part is a lathe / band / surface curve /
// feature turned at a yaw, so he turns without flips; crossings (an arm behind the body, an ear coming round, the
// thumb) crossfade over a short range of depth, never pop.
//   <FolkWorker pose x y scale uid see? inside? mirror? dist? eyeY? inks? />   x, y = screen px of his feet
//   buildWorker(pose, opts) -> { shapes, anchors }       anchors only: workerAnchors(pose, x, y, scale, opts)
//   POSES (pure; pose objects, mix with mixPose(a, b, t)):
//     stand(yaw = 0)            standing, weight on his left leg, head tipped a touch (the style-frame stance)
//     slack(frame)              cut 32: the worn-out man, slumped, head bowed, arms hanging close, breathing + a slow sway
//     breathe(pose, frame)      breathing (~4.2 s) + a slow weight sway over any pose
//     turn(t, from = 150)       cut 74: back three-quarter (facing away, head bowed) -> profile (facing screen right) ->
//                               front; the head leads and lifts; the eyes turn to the glance and look at us from t ~0.55
//                               (pose.glance / pose.look). Sample it on 2s for a hand-animated feel: turn(onTwos(f) / N)
//     reach(t)                  cut 74: from the front stand, both arms rise toward the camera (the left 5% later), the
//                               mittens droop, the head tilts and bows a little, a small dark-oval mouth opens, the eyes
//                               turn ORANGE (blank). Pass dist={REACH_DIST} so the hands grow as they come at us; reach(t, base) starts from any pose (default turn(1)).
//     pose fields: yaw headYaw headPitch headRoll bodyPitch bodyRoll slump breath armR armL glance look orange mouth brows
//   ANCHORS (figure units, x right, y down; add the feet position x scale): eyeL eyeR mouth nose chin headCenter crown
//     backOfHead nape | trachea sternumTop sternum sternumBottom shoulderL shoulderR chest lungsTL lungsBR (the lungs'
//     box) lungL lungR | handL handR feet  (L = HIS left)
//   SEE-THROUGH (cut 32): see 0..1 — torso, clothes and arms fade as one layer to (1 - 0.65 see) (~35 % at see 1), a
//     soft band of their own colour is kept at the outer edge, and `inside` (SVG in figure units: glass lungs, the
//     orange disease) is drawn between the faded body and that edge. The head stays opaque.
//
// THE CROWD (cuts 13 and 1) — front-facing drawings (pandemicFolkCrowd) baked into sprites:
//   crowdKinds: c1900 man | woman | boy | girl | oldMan | oldWoman ; medieval man | woman | child | old
//   crowdDrawing(kind, ink, seed) -> { shapes, hUnits, wUnits }   ink "orange" (TB's toll) | "cream" (the living /
//     other diseases) | "dead" (#8A7B62, the fallen) | "natural"; skin and hair stay natural; seed varies skin, hair,
//     height and mirrors some (the light stays upper left).
//   crowdSpriteReq(kind, ink, seed, hPx) -> SpriteReq; useFolkSprites(reqs) bakes them (gouache filter baked in, once per
//     render tab); blitFolk(ctx, sprite, x, y, hPx, { alpha, rot, pivot }) inside <FolkCanvas draw />.
//   sway(frame, seed) -> { rot, sy }    the walk-free idle: a slow sway about the feet and a breath
//   fall(t, dir) -> { rot, pivot }      the cut-1 fall: tips over about the edge of a foot (gravity: slow, then
//     quicker), lands flat, a small settle; dir +1 falls to screen right, -1 to the left. Hand the pivot (figure units)
//     and rot to blitFolk. inkSwap: crossfade two sprites (e.g. orange -> dead) by alpha.
// Probes: pandemicFolkProbe.tsx (src/Root.PandemicFolk.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { FolkPaint } from "./pandemicFolkPaint";
import { STAND, buildWorker, mixPose, type ArmPose, type BuildOpts, type WorkerAnchors, type WorkerPose } from "./pandemicFolkWorker";

export { FolkPaint, FolkCanvas, blitFolk, useFolkSprites, type Shape, type Sprite, type SpriteReq } from "./pandemicFolkPaint";
export { buildWorker, mixPose, STAND, WORKER_INKS, workerBodyProjector, type WorkerPose, type ArmPose, type WorkerAnchors, type BuildOpts, type Thread } from "./pandemicFolkWorker";
export { CROWD_KINDS, crowdDrawing, crowdSpriteReq, sway, fall, type CrowdKind, type CrowdInk } from "./pandemicFolkCrowd";

/** the clip's sequence rate */
export const FPS = 30000 / 1001;
export const ORANGE = "#FFB000";
export const ORANGE_DEEP = "#D98A0C";
export const DEAD = "#8A7B62";
/** the Worker's height in units (soles to the top of his cap) */
export const WORKER_UNITS = 513;
/** px per unit that makes the Worker `px` tall */
export const FIGURE_PX = (px: number) => px / WORKER_UNITS;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (t: number) => {
  const u = c01(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
/** hold every frame for two (a hand-animated feel) */
export const onTwos = (frame: number) => Math.floor(frame / 2) * 2;

// ===================================================================================================================
// POSES
// ===================================================================================================================
export const stand = (yaw = 0): WorkerPose => ({ ...STAND, yaw });
/** breathing (~4.2 s) and a slow weight sway over any pose */
export const breathe = (p: WorkerPose, frame: number, fps = FPS): WorkerPose => {
  const t = frame / fps;
  return {
    ...p,
    breath: 0.5 + 0.5 * Math.sin((t / 4.2) * 2 * Math.PI - Math.PI / 2),
    bodyRoll: p.bodyRoll + 0.55 * Math.sin((t / 6.3) * 2 * Math.PI),
    headRoll: p.headRoll + 0.8 * Math.sin((t / 6.3) * 2 * Math.PI - 0.6),
  };
};
const ARM_SLACK: ArmPose = { abd: 9, flex: 5, abd2: -6, flex2: 7, droop: 3, thumb: 0 };
/** cut 32: the worn-out man (front), breathing */
export const slack = (frame = 0, yaw = 0): WorkerPose =>
  breathe({ ...STAND, yaw, slump: 5, headPitch: 9, headRoll: 3, bodyPitch: 3, bodyRoll: -1.2, armR: ARM_SLACK, armL: { ...ARM_SLACK, abd: 10 }, brows: 2.5 }, frame);

/** cut 74: back three-quarter -> profile -> front; t 0..1 */
export const turn = (t: number, from = 150): WorkerPose => {
  const e = ease(t);
  const eh = ease(Math.min(1, t * 1.22)); // the head leads
  const yaw = from * (1 - e);
  const headWorld = from * (1 - eh);
  const g = sstep(0.5, 0.68, t);
  return {
    ...STAND,
    yaw,
    headYaw: headWorld - yaw,
    headPitch: lerp(16, 1, sstep(0.15, 0.75, t)),
    headRoll: lerp(0, STAND.headRoll, sstep(0.6, 1, t)),
    bodyRoll: lerp(0, STAND.bodyRoll, sstep(0.6, 1, t)),
    slump: lerp(4, 0, sstep(0.2, 0.8, t)),
    glance: g,
    // looking at us while the head is still turned: the pupils sit toward the camera side, settling as he faces us
    look: -1 * (1 - sstep(0.82, 1, t)),
  };
};
const ARM_REACH: ArmPose = { abd: 20, flex: 86, abd2: -6, flex2: 80, droop: 66, thumb: 1 };
/** cut 74: the zombie reach, from `base` (default: where turn() ends, eyes in the glance); t 0..1 */
export const reach = (t: number, base: WorkerPose = turn(1)): WorkerPose => {
  const aR = ease(sstep(0.0, 0.8, t));
  const aL = ease(sstep(0.05, 0.85, t));
  const e = ease(sstep(0.1, 0.9, t));
  return {
    ...base,
    armR: mixArmT(base.armR, ARM_REACH, aR),
    armL: mixArmT(base.armL, { ...ARM_REACH, abd: 23, flex: 83 }, aL),
    headRoll: lerp(base.headRoll, 13, e),
    headPitch: lerp(base.headPitch, 9, e),
    bodyPitch: lerp(base.bodyPitch, 5, ease(t)),
    bodyRoll: lerp(base.bodyRoll, 0.5, ease(t)),
    look: lerp(base.look, 0, sstep(0, 0.3, t)),
    orange: sstep(0.0, 0.3, t),
    mouth: ease(sstep(0.2, 0.75, t)),
  };
};
/** the perspective distance (units) for the reach: the hands grow as they come at us */
export const REACH_DIST = 470;
const mixArmT = (a: ArmPose, b: ArmPose, t: number): ArmPose => mixPose({ ...STAND, armR: a, armL: a }, { ...STAND, armR: b, armL: b }, t).armR;

// ===================================================================================================================
// DRAWING
// ===================================================================================================================
export const FolkWorker: React.FC<{
  pose: WorkerPose;
  x: number;
  y: number;
  scale: number;
  uid: string;
  see?: number;
  inside?: React.ReactNode;
  opacity?: number;
  /** screen px per user unit of the enclosing svg (WorldSvg: cam.k) */
  unitPx?: number;
  insideOpacity?: number;
  /** crescent shadow strength / colour (night: darker) */
  shade?: { amt: number; to: string };
} & BuildOpts> = ({ pose, x, y, scale, uid, see = 0, inside, opacity, unitPx, insideOpacity, shade, ...o }) => {
  const b = buildWorker(pose, { ...o, seeTag: see > 0 || !!inside });
  return <FolkPaint shapes={b.shapes} x={x} y={y} scale={scale} uid={uid} see={see} inside={inside} opacity={opacity} unitPx={unitPx} insideOpacity={insideOpacity} shade={shade} />;
};
/** the Worker's anchors in screen px for a pose drawn at (x, y, scale) */
export const workerAnchors = (pose: WorkerPose, x: number, y: number, scale: number, o: BuildOpts = {}): WorkerAnchors => {
  const a = buildWorker(pose, o).anchors;
  const out = {} as WorkerAnchors;
  for (const k of Object.keys(a) as (keyof WorkerAnchors)[]) out[k] = [x + a[k][0] * scale, y + a[k][1] * scale];
  return out;
};
