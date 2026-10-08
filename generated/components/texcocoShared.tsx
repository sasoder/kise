// ---------------------------------------------------------------------------
// texcocoShared: the page, camera, label and motion helpers of the "Texcoco"
// clip's figure cuts (GaveTheTitle, BothSides). Dwarkesh map style, "beyond
// maps" umber page (incaShared's PlanPage: land #3F3428, world-space mottle,
// grain, vignette), cream ink, IM Fell English SC. The cast is texcocoFigures.
//   TexcocoPage cam            the page; children draw over it (WorldSvg inside)
//   WorldSvg cam               a full-frame svg in world px
//   Label                      stringsShared's slide-up label at a world point
//   makeCamera(keys)           incaShared's pchip camera (CamKey: world point at a screen point at zoom k)
//   poseTrack(keys)            a FigPose through keyed poses, every channel a monotone cubic (no stops between keys)
//   shadeInk(t)                the cream inks sunk toward the page (a figure standing further back)
//   idle(pose, g, seed)        the settled-but-alive drift, a pure function of the GLOBAL frame g
//   walkPose(base, phase)      one step cycle laid over a pose; WALK.advance(scale) = px per frame
// ---------------------------------------------------------------------------
import React from "react";
import { INK, LAND, PlanPage, WorldSvg, makeCamera, mixColor, pchip, type Cam, type CamKey, type P2 } from "./incaShared";
import { type ArmPose, type FigPose, type Ink } from "./texcocoFigures";

export { Label } from "./stringsShared";
export { WorldSvg, makeCamera };
export type { Cam, CamKey, P2 };

export const FPS = 24000 / 1001;

export const TexcocoPage: React.FC<{ cam: Cam; vignette?: number; children?: React.ReactNode }> = ({ cam, vignette = 0.55, children }) => (
  <PlanPage cam={cam} vignette={vignette}>
    {children}
  </PlanPage>
);

/** the cream inks at tone t (1 = full; lower = sunk toward the page: a figure further back). Outlines stay dark. */
export const shadeInk = (t: number): Ink => ({ main: mixColor(LAND, INK, t), deep: mixColor(LAND, "#D3C5A2", t), hair: mixColor(LAND, "#8C7F60", t) });

// ---------------------------------------------------------------------------
// POSE TRACKS
// ---------------------------------------------------------------------------
const flatArm = (a: ArmPose) => [a.w[0], a.w[1], a.elbow[0], a.elbow[1], a.fist, a.hand];
const flat = (q: FigPose) => [q.yaw, q.headYaw, q.roll, q.pitch, q.lean, q.crouch, ...flatArm(q.armL), ...flatArm(q.armR), q.footL[0], q.footL[1], q.footR[0], q.footR[1], q.liftL, q.liftR, q.brow, q.lids, q.mouth, q.hem];
const unArm = (v: number[], i: number): ArmPose => ({ w: [v[i], v[i + 1]], elbow: [v[i + 2], v[i + 3]], fist: v[i + 4], hand: v[i + 5] });
const unflat = (v: number[]): FigPose => ({
  yaw: v[0],
  headYaw: v[1],
  roll: v[2],
  pitch: v[3],
  lean: v[4],
  crouch: v[5],
  armL: unArm(v, 6),
  armR: unArm(v, 12),
  footL: [v[18], v[19]],
  footR: [v[20], v[21]],
  liftL: v[22],
  liftR: v[23],
  brow: v[24],
  lids: v[25],
  mouth: v[26],
  hem: v[27],
});
/** a pose through keys [frame, pose]: each channel a monotone cubic, so the motion
 *  flows through the keys without stopping and never overshoots; held before and after */
export const poseTrack = (keys: [number, FigPose][]) => {
  const fl = keys.map(([f, q]) => [f, flat(q)] as [number, number[]]);
  const ch = fl[0][1].map((_, i) => pchip(fl.map(([f, v]) => [f, v[i]] as [number, number]), true));
  const f0 = keys[0][0];
  const f1 = keys[keys.length - 1][0];
  return (f: number): FigPose => {
    const x = Math.max(f0, Math.min(f1, f));
    return unflat(ch.map((c) => c(x)));
  };
};
/** a scalar through keys [frame, value], the same way */
export const track = (keys: [number, number][]) => {
  const c = pchip(keys, true);
  const f0 = keys[0][0];
  const f1 = keys[keys.length - 1][0];
  return (f: number) => c(Math.max(f0, Math.min(f1, f)));
};

/** settled but alive: the hem sways a hair, the head drifts; a pure function of the global frame g */
export const idle = (q: FigPose, g: number, seed = 0, amount = 1): FigPose => ({
  ...q,
  hem: q.hem + amount * 1.5 * Math.sin(g / 10.5 + seed * 2.1),
  roll: q.roll + amount * 0.45 * Math.sin(g / 16 + seed * 1.3),
  lean: q.lean + amount * 0.25 * Math.sin(g / 21 + seed * 0.7),
});

// ---------------------------------------------------------------------------
// THE WALK: one cycle laid over a pose (he walks the way his body faces)
// ---------------------------------------------------------------------------
export const WALK = {
  /** how far a planted foot travels under him, units */
  stride: 44,
  /** frames per full cycle (two steps) at 23.976 fps */
  cycle: 24,
  /** px per frame the figure must advance (add to its `at` x, in the facing direction) so the planted foot does not slide */
  advance: (scale: number, cycle = 24, stride = 44) => (2 * stride * scale) / cycle,
};
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
/** phase 0..1 through one cycle (phase = frames / WALK.cycle); amount 0..1 blends from `base` into the walk */
export const walkPose = (base: FigPose, phase: number, amount = 1, stride = WALK.stride): FigPose => {
  const dir = Math.sin(base.yaw) >= 0 ? 1 : -1;
  const leg = (u0: number) => {
    const u = frac(u0);
    if (u < 0.5) {
      // planted: it travels back under him; the heel peels off at the end
      const v = u / 0.5;
      const peel = Math.max(0, (v - 0.62) / 0.38);
      const land = Math.max(0, 1 - v / 0.14);
      const lift = 30 * ease(peel) - 14 * land;
      return { x: stride * (0.5 - v), y: -Math.max(0, Math.sin((lift * Math.PI) / 180)) * 24, lift };
    }
    // swinging forward: it lifts, the toes come up to land on the heel
    const v = (u - 0.5) / 0.5;
    return { x: stride * (-0.5 + ease(v)), y: -15 * Math.sin(Math.PI * v) - 12 * (1 - v) * (1 - v), lift: 30 * (1 - ease(Math.min(1, v * 1.6))) - 14 * ease(Math.max(0, (v - 0.45) / 0.55)) };
  };
  const L = leg(phase);
  const R = leg(phase + 0.5);
  const sw = Math.sin(2 * Math.PI * (phase + 0.1));
  const a = amount;
  return {
    ...base,
    crouch: base.crouch + a * (2.5 + 2.2 * Math.cos(4 * Math.PI * phase)),
    lean: base.lean + a * 2.5 * dir,
    footL: [base.footL[0] + a * dir * L.x, base.footL[1] + a * L.y],
    footR: [base.footR[0] + a * dir * R.x, base.footR[1] + a * R.y],
    liftL: base.liftL + a * dir * L.lift,
    liftR: base.liftR + a * dir * R.lift,
    armL: { ...base.armL, w: [base.armL.w[0] + a * dir * 13 * sw, base.armL.w[1] - a * 3 * Math.abs(sw)] },
    armR: { ...base.armR, w: [base.armR.w[0] - a * dir * 13 * sw, base.armR.w[1] - a * 3 * Math.abs(sw)] },
    hem: base.hem - a * dir * 3.5 * Math.cos(4 * Math.PI * phase),
  };
};
