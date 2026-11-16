// ---------------------------------------------------------------------------
// NotOptimallyAdapted (rsi-stupidest-species, cut 19), REVISION 3: THE CLUMSY STEP-UP (rev 3 polishes the fall; 3b: the near arm flings wide round the face, a low swing round). Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 73 frames. Built on cut B's world stupidestStairs.tsx
// (read-only; STAIRS_READY.md) and B's exports (StupidestPossibleSpecies.tsx: the fire's place sets the lamp grid);
// the human is covidFolk's Commuter v0 (read-only; every climbing pose is built here from its pose channels).
//
// CHECK LINE: "We got there first, but we were not built for it: he only just makes it up onto the lit step."
//
// THE LINE: "not because we were in any sense optimally adapted to it."
// WORD -> FRAME: not -2 · because 5 · we 12 · were 19 · in 22 · any 25 · sense 29 · optimally 35 · adapted 49 · to 56 ·
//   it 67 (Whisper onsets from the composition start; may run ~0.2-0.4 s early)
// DURATION: the slot 19.353 -> 22.397 s (sequence frames 464-537) = 3.044 s x 23.976 = 73 frames (f0..f72).
//
// THE PICTURE: B's staircase, low and close: the human on the step below the civilization step (step 0, its row of
// lit stone lamp bowls), at a gap in the lamps. The riser is about his neck height (B's world: 1.45 m; he is 1.83 m).
// Seen three-quarter from behind-side (facing screen right, his face in profile), so the effort shows.
// THE ACTION (one thing, unhurried, every move >= 8 frames and eased):
//   f0-27   hands flat on the top, the near foot then the far foot planted on the riser (scuffs), he presses up to
//           straight arms and swings the near knee up onto the top (planted from KNEE.on = 27).
//   f27-51  THE BALANCE, driven by two curves with set velocities (cubic Hermite: falls accelerate, stops decelerate):
//           the thigh's angle about the planted knee (THIGH) and the torso's lean (TORSO). He comes up over the knee
//           (f27-32); his weight drifts behind the knee and he tips back, hips and torso as one unit pivoting about the
//           knee, the head lagging (f32-40); one reactive windmill of both arms (f33-43.5, a circle about each shoulder,
//           the far arm a frame behind, its wrist trailing the elbow; the near arm on its own wide circle NEAR_ANG,
//           flung out in front of the face at f37 and up behind the head at f38, so it never crosses the face); the hang (f40); he throws his weight forward,
//           the head leading (f39.5-47), and the hands slap down onto the top (f47, coming in from above with their
//           speed): a small overshoot squashes the arms (f48) and he settles onto them (f48-51).
//   f51-61  he swings round off the knee, low and still leaned (SWING_LEAN, the chin tucked, the legs folded under
//           until the seat is close): the hips arc across and down onto the edge (slow off the knee, faster as they
//           drop, landing at f59), the seat gives (deepest ~f61), a little rebound; the dangling legs swing once and
//           damp out; facing us, he sits out of breath (panting), glances down at the drop and back up (to f72).
// Contacts: the hands on the stone (exact world points) f0-26 and f47-52, the knee on its point f27-51, the hips on the
// edge from f59. Pure per frame.
// Colour: no orange on him (orange = intelligence: the dashed species, off-frame here). The lamps glow steadily.
//
// CAMERA: one slow push (stairCam, one designed lobe in ln px/m, moving at f0) from a full figure on the lower step to
// a medium of him sitting between two lamps. Checked per frame by
// scripts/clips/rsi-stupidest-species/check-not-optimally-adapted.ts.
//
// SOURCES: none.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirShadow, AirStage, WorldSvg, airRamp, rgbHex, swayCam, type AirWorld, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as Covid from "../kyle-covid/covidFolk";
import { DashedSpecies, HeadGlow, Lamp, Stairs, U, inFront, lampXs, speciesOf, stairCam, stairsAirOf, stepAnchor, stepOf, type StairCam } from "./stupidestStairs";
import { FIRE_AT, HEAD_GLOW, moteView } from "./StupidestPossibleSpecies";

export const FPS = 24000 / 1001;
export const DURATION = 73;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const sst = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const m = (v: number) => v * U;

// ---- the place: a gap in the lamp row on the civilization step (step 0), climbed from the step below (-1) ------------
/** between two lamp places right of B's fire (far from the dashed species on the steps above, which stay out of
 *  frame); the two lamps either side of it are left out, so his gap is 2 m wide and his head never crosses a flame */
export const CLIMB_X = FIRE_AT.X + m(1.34 + 0.335);
export const LAMP_XS2 = lampXs([{ x: CLIMB_X, clear: 0.4 }], FIRE_AT.X);
/** the lamps stand further back on the tread than B's (0.22 m), so the lit top reads as a surface in front of them */
export const LAMP_BACK = 0.7;
export const LEDGE_Y = stepOf(0).Y;
export const FLOOR_Y = stepOf(-1).Y;
export const RISER_M = (FLOOR_Y - LEDGE_Y) / U;

// ---- the beats ------------------------------------------------------------------------------------------------------
export const HAUL = { a: 1, b: 24 };
export const KNEE = { swing: [15, 27] as [number, number], on: 27 };
export const LETGO = { a: 26, b: 33 };
/** the tip back over the drop (the hips pivoting back about the planted knee) and the hang at its far end */
export const WOBBLE = { a: 32, b: 41 };
/** the throw forward (a: the head leads), the hands slapping down on the top (on), planted until off */
export const CATCH = { a: 39.5, b: 47, on: 47, off: [52, 57] as [number, number] };
/** the swing round off the knee to sit: the hips arc over and land on the edge at land, the plop's low point ~b */
export const SWIVEL = { a: 51, b: 61, land: 59.5 };
export const REST_T = { look: [61, 70] as [number, number], back: [67, 77] as [number, number] };

// ---- the camera ------------------------------------------------------------------------------------------------------
type Spec = { sx: number; sy: number; pxm: number; dist: number; eyeRight: number; eyeUp: number };
export const SPEC_OPEN: Spec = { sx: 560, sy: 690, pxm: 205, dist: 7, eyeRight: -0.5, eyeUp: 3.1 };
export const SPEC_END: Spec = { sx: 540, sy: 830, pxm: 330, dist: 7, eyeRight: -0.7, eyeUp: 2.7 };
export const LOBE = { A: 1.5, B: 1.7, F0: -26, F1: 96 };
const N_INT = 1200;
const S_TAB = (() => {
  const tab = [0];
  const v = (i: number) => Math.pow(i / N_INT, LOBE.A) * Math.pow(1 - i / N_INT, LOBE.B);
  for (let i = 0; i < N_INT; i++) tab.push(tab[i] + (v(i) + v(i + 1)) / 2);
  return tab.map((q) => q / tab[N_INT]);
})();
const sRaw = (f: number) => {
  const x = ((f - LOBE.F0) / (LOBE.F1 - LOBE.F0)) * N_INT;
  if (x <= 0) return 0;
  if (x >= N_INT) return 1;
  const i = Math.floor(x);
  return S_TAB[i] + (S_TAB[i + 1] - S_TAB[i]) * (x - i);
};
const S0 = sRaw(0);
const S1 = sRaw(DURATION - 1);
export const moveS = (f: number) => (sRaw(f) - S0) / (S1 - S0);
export const specAt = (f: number): Spec => {
  const s = moveS(f);
  const P = SPEC_OPEN;
  const Q = SPEC_END;
  return { sx: lerp(P.sx, Q.sx, s), sy: lerp(P.sy, Q.sy, s), pxm: Math.exp(lerp(Math.log(P.pxm), Math.log(Q.pxm), s)), dist: lerp(P.dist, Q.dist, s), eyeRight: lerp(P.eyeRight, Q.eyeRight, s), eyeUp: lerp(P.eyeUp, Q.eyeUp, s) };
};
export const camTrack = (f: number): StairCam => {
  const s = specAt(f);
  return stairCam({ X: CLIMB_X, Y: LEDGE_Y, Z: 0, sx: s.sx, sy: s.sy, pxm: s.pxm, dist: s.dist, eyeRight: s.eyeRight, eyeUp: s.eyeUp });
};
export const camOf = (f: number): StairCam => {
  const c = camTrack(f);
  const w = swayCam(c, f);
  return { ...c, cx: w.cx, cy: w.cy };
};
const REST = camOf(0);

// ---- the human's poses (figure units: 1 unit = 1 world unit at his depth; y up is negative) -------------------------
const HUMAN_KIND: Covid.CovidKind = "commuter";
/** facing screen right and a little away (between profile and back three-quarter): the face in profile */
const YAW = 1.62;
const arm = (w: P2, elbow: P2, fist = 0.4, hand = 0): Covid.CovidPose["armL"] => ({ w, elbow, fist, hand });
/** the hand bent down off the forearm, so the open mitten lies flat on the stone (palm down) */
const PALM = -55;
/** the far foot's pitch while it is pressed sole-on to the riser (toes up) */
const RISER_LIFT = -62;
/** the elbow hint while the hands are down on the stone: back and down (bent, behind the hands, never up past the head) */
const ELB: P2 = [-0.8, 0.7];
const base = (): Covid.CovidPose => ({ ...Covid.POSES.turnTo(YAW), headYaw: 1.35 });
/** f0: on his toes at the riser, reaching up onto the ledge (the arms are solved onto the grips) */
const pReach = (): Covid.CovidPose => ({ ...base(), crouch: 20, lean: 4, pitch: -16, look: [0.5, -0.7], liftL: -12, liftR: -12, footL: [-6, 0], footR: [10, 0], worry: 0.35, open: 0.1, lids: 0.2, brow: 0.5, armL: arm([60, -200], ELB, 0, PALM), armR: arm([70, -200], ELB, 0, PALM) });
/** mid-haul: elbows up, the near knee coming up, the far leg hanging, gritted effort */
const pHaul = (): Covid.CovidPose => ({ ...base(), crouch: 12, lean: 6, pitch: -4, look: [0.6, -0.3], footL: [40, -60], liftL: RISER_LIFT, footR: [10, -20], liftR: 0, worry: 0.6, open: 0.3, lids: 0.5, brow: 0.8, hunch: 0.45, armL: arm([60, -150], ELB, 0, PALM), armR: arm([70, -150], ELB, 0, PALM) });
/** kneeling on the near knee at the edge (the shin back along the tread), the far leg dangling over the riser */
const pKneel = (): Covid.CovidPose => ({ ...base(), crouch: 108, lean: 14, pitch: 6, look: [0.6, 0.1], footL: [-70, -24], liftL: 0, footR: [10, 60], liftR: 25, worry: 0.5, open: 0.3, lids: 0.3, brow: 0.5, hunch: 0.2 });
/** the knee just landed on the edge: the thigh level on the top, the shin folded under over the edge, the hips still
 *  low at the lip (then he hauls himself up over the knee into pUp) */
const pMount = (): Covid.CovidPose => ({ ...pKneel(), crouch: 108, lean: 52, pitch: 14, footL: [-10, -5], liftL: 10, liftR: RISER_LIFT, worry: 0.6, open: 0.35, lids: 0.45, brow: 0.8, hunch: 0.4 });
/** straightened up on the knee, arms coming free */
const pUp = (): Covid.CovidPose => ({ ...pKneel(), crouch: 70, lean: 0, pitch: 0, look: [0.4, 0], worry: 0.4, open: 0.2, lids: 0.1, brow: 0, hunch: 0 });
/** tipping back over the drop: the face turned toward us, alarmed (face and head channels; the body comes from the
 *  balance curves below) */
const pWobble = (): Covid.CovidPose => ({ ...pKneel(), pitch: -6, headYaw: 0.95, roll: -6, look: [-0.4, 0.6], worry: 1, open: 0.85, lids: 0, brow: -0.8, hunch: 0 });
/** thrown forward over the tread, both hands down on it (face and head channels) */
const pCatch = (): Covid.CovidPose => ({ ...pKneel(), pitch: 18, headYaw: 1.25, roll: 4, look: [0.5, 0.4], worry: 0.8, open: 0.45, lids: 0.15, brow: -0.2 });
/** sitting on the edge facing us, the legs dangling over the riser, hands on the edge beside him, out of breath */
const pSit = (): Covid.CovidPose => ({
  ...Covid.POSES.sit(1, 82),
  yaw: 0.3,
  headYaw: 0.15,
  lean: 0,
  pitch: 6,
  look: [0, 0.1],
  armL: arm([-48, -96], [-0.6, 1], 0.1, 20),
  armR: arm([58, -96], [0.6, 1], 0.1, 20),
  worry: 0.35,
  open: 0.5,
  lids: 0.35,
  brow: 0.2,
  mouth: 0.2,
  hunch: 0.35,
});

// ---- the balance on the knee (f27-51): curves with set velocities at their keys (cubic Hermite), so falls accelerate,
// stops decelerate and nothing moves linearly ----------------------------------------------------------------------------
type Key = [number, number, number];
/** cubic Hermite through [frame, value, slope per frame] keys (held flat outside them) */
const herm = (keys: Key[], f: number): number => {
  if (f <= keys[0][0]) return keys[0][1];
  const n = keys.length - 1;
  if (f >= keys[n][0]) return keys[n][1];
  let i = 0;
  while (f > keys[i + 1][0]) i++;
  const [f0, v0, m0] = keys[i];
  const [f1, v1, m1] = keys[i + 1];
  const h = f1 - f0;
  const t = (f - f0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * v0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * v1 + (t3 - t2) * h * m1;
};
/** the thigh's angle about the planted knee (rad, + = the hips forward of the knee, toward the lamps): up over the knee
 *  from the mount (f27-32), the centre of mass drifting behind the knee and the tip back accelerating (f32-36), slowed
 *  by the windmill to a hang (f39-41), the throw forward accelerating into the slap (f47), a small overshoot as the
 *  hands take the weight (f48) and the settle onto them */
/** the thrown-forward pose the hands catch in: the thigh's angle and the torso's lean */
const CAUGHT = { th: 0.15, lean: 66 };
export const THIGH: Key[] = [
  [27, -0.835, 0],
  [29.5, -0.36, 0.25],
  [32.5, 0.07, 0],
  [36, -0.14, -0.08],
  [39, -0.29, -0.025],
  [40, -0.305, 0],
  [40.6, -0.3, 0.02],
  [47, CAUGHT.th, 0.16],
  [48, CAUGHT.th + 0.065, 0],
  [50, CAUGHT.th + 0.03, 0],
  [51, CAUGHT.th + 0.035, 0.005],
];
/** the torso's lean (deg, + = toward the lamps): with the thigh as one unit through the tip, further forward in the
 *  throw (the reach) */
export const TORSO: Key[] = [
  [27, 52, 0],
  [29.5, 26, -10],
  [32.5, 1, 0],
  [36, -12, -4.5],
  [39, -20, -1.3],
  [40, -21, 0],
  [40.6, -20.6, 1.2],
  [47, CAUGHT.lean, 10],
  [48, CAUGHT.lean + 5, 0],
  [50, CAUGHT.lean + 1, 0],
  [51, CAUGHT.lean + 1.5, 0.2],
];
/** the windmill (fraction of each arm's turn): one reactive circle that starts after the tip does, fastest mid-fall,
 *  ending with the hands hanging under the shoulders as the throw carries them down onto the top */
const WIND: Key[] = [
  [33, 0, 0],
  [35.5, 0.17, 0.1],
  [39, 0.62, 0.12],
  [42, 0.94, 0.05],
  [43.5, 1, 0],
];
/** the torso's lean through the swing round to sit (deg): it stays forward while the hips arc down, comes up only as
 *  they land, and carries on a touch at the plop (the hips stop, the chest doesn't) before settling upright */
const SWING_LEAN: Key[] = [
  [51, CAUGHT.lean + 1.5, 0.2],
  [54, 54, -6.5],
  [57, 33, -7.5],
  [59.5, 15, -5],
  [61, 10, -1],
  [64, 2.5, -1.5],
  [67, 0, 0],
];
/** the near arm's own circle (the wrist's angle about the shoulder, deg, 0 = toward the lamps, -90 = up): the head sits
 *  right over the near shoulder in this side view, so the near arm flings up wide (NEAR_OUT) and fast over the top,
 *  out in front of the face on one frame (f37) and already up behind it on the next (f38), never across it */
const NEAR_ANG: Key[] = [
  [33.5, 63.4, 0],
  [35, 52, -12],
  [36, 28, -38],
  [37, -22, -82],
  [38, -128, -80],
  [39, -175, -42],
  [40, -203, -33],
  [41, -242, -25],
  [42, -261, -12],
  [43.5, -270, 0],
];
/** how much further out the near arm's circle reaches over the top (units added to its radius) */
const NEAR_OUT = 33;
export const thighAt = (f: number) => herm(THIGH, f);
export const torsoAt = (f: number) => herm(TORSO, f);
/** the planted shin (knee to ankle, units) and the thigh's length */
const SHIN: P2 = [-62, -22];
const THIGH_L = 71;
const KNEEL_CROUCH = 70;
/** the far leg hanging from the hips over the drop, and how far it kicks forward-up as he tips back (2 frames late) */
const FAR_HANG: P2 = [11, 95];
const FAR_KICK: P2 = [48, -30];

/** the kneeling body at f (f >= KNEE.on): the knee planted, the thigh at thighAt, the torso at torsoAt, the head lagging
 *  the tip and leading the throw, the arms windmilling (circles about the shoulders, the hands trailing the elbows) */
const kneelPose = (f: number): Covid.CovidPose => {
  let q = Covid.lerpPose(pMount(), pUp(), sst(KNEE.on, 32, f));
  q = Covid.lerpPose(q, pWobble(), sst(33, 37, f));
  q = Covid.lerpPose(q, pCatch(), sst(CATCH.a + 1, CATCH.on - 1, f));
  // the legs: the hips at thighAt about the knee, the shin flat behind it (hip = at + (0, crouch - 152), ankle = at +
  // foot + (1, -15))
  const th = thighAt(f);
  const hipRel: P2 = [THIGH_L * Math.sin(th), -THIGH_L * Math.cos(th)];
  const lift = 152 - KNEEL_CROUCH;
  const footL: P2 = [SHIN[0] - hipRel[0] - 1, SHIN[1] - hipRel[1] - lift + 15];
  const kick = sst(0, 1, c01((0.07 - thighAt(f - 2)) / 0.42));
  const far: P2 = [FAR_HANG[0] + FAR_KICK[0] * kick, FAR_HANG[1] + FAR_KICK[1] * kick];
  const footR: P2 = [far[0] - 1, far[1] + 15 - lift];
  // the head: lags the tip (stays forward while the body goes back), then leads the throw (the chin goes first)
  const lam = torsoAt(f);
  const lag = f < CATCH.a ? torsoAt(f - 2) - lam : 0;
  const lead = 16 * sst(CATCH.a - 1, CATCH.a + 3, f) * (1 - sst(CATCH.on, CATCH.on + 5, f));
  const jolt = 5 * Math.max(0, Math.sin(Math.PI * c01((f - CATCH.on) / 3)));
  q = { ...q, crouch: KNEEL_CROUCH, lean: lam, footL, liftL: 0, footR, pitch: q.pitch + 0.55 * lag + lead + jolt, roll: q.roll - 0.25 * lag };
  // the arms: out for balance after letting go, then one circle (front, up, back, down, front) about each shoulder, the
  // far arm 0.6 rad behind; each wrist trails its own circle by 1.2 frames and the elbow leads along the circle
  const a0 = Covid.covidAnchors(HUMAN_KIND, q, [0, 0], 1);
  // (each arm's circle runs front, up, back, down and ends hanging straight down: the far arm starts further back, so
  // it turns further)
  const swing = (sh: P2, rest: P2, behind: number, side: number): Covid.CovidPose["armL"] => {
    const R = 0.8 * Math.hypot(rest[0], rest[1]);
    const a0r = Math.atan2(rest[1], rest[0]);
    const turn = a0r - Math.PI / 2 + 2 * Math.PI;
    const al = a0r - turn * herm(WIND, f - 1.2 - behind);
    const lead2 = a0r - turn * herm(WIND, f - behind);
    const w: P2 = [sh[0] + R * Math.cos(al), sh[1] + R * Math.sin(al)];
    const spin = c01(turn * (herm(WIND, f + 1 - behind) - herm(WIND, f - 1 - behind)));
    const elbow = lerp2([0.2 * side, 1], [Math.sin(lead2), -Math.cos(lead2)], c01(spin * 2.5));
    return arm(w, elbow, 0.1, 10);
  };
  // the near arm: its own wide circle (NEAR_ANG); the elbow leads as elsewhere, except over the top (f36-39) where it
  // trails, low and out in front, then up behind the head, so neither bone crosses the face
  const nearArm = (): Covid.CovidPose["armL"] => {
    const sh = a0.shoulderL;
    const R = 0.8 * Math.hypot(40, 80) + NEAR_OUT * sst(35, 37, f) * (1 - sst(38.6, 40.8, f));
    const al = (herm(NEAR_ANG, f) * Math.PI) / 180;
    const w: P2 = [sh[0] + R * Math.cos(al), sh[1] + R * Math.sin(al)];
    const lead2 = (herm(NEAR_ANG, f + 1.2) * Math.PI) / 180;
    const spin = (Math.abs(herm(NEAR_ANG, f + 1) - herm(NEAR_ANG, f - 1)) * Math.PI) / 180;
    const trail = 1 - sst(37.2, 37.8, f);
    const tang = lerp2([Math.sin(lead2), -Math.cos(lead2)], [-Math.sin(al), Math.cos(al)], trail);
    return arm(w, lerp2([0.2, 1], tang, c01(spin * 2.5)), 0.1, 10);
  };
  q = { ...q, armL: nearArm(), armR: swing(a0.shoulderR, [-30, 86], 1.1, -1) };
  return q;
};

export const humanPoseAt = (f: number): Covid.CovidPose => {
  let q = pReach();
  q = Covid.lerpPose(q, pHaul(), sst(7, 16, f));
  q = Covid.lerpPose(q, pMount(), sst(KNEE.swing[0], KNEE.swing[1], f));
  // the near leg stays on its riser step until it lets go (FOOT.nearOff), then swings the knee up onto the top
  const legS = sst(FOOT.nearOff[0], KNEE.on, f);
  const qm = pMount();
  const qh = Covid.lerpPose(pReach(), pHaul(), sst(7, 16, f));
  q = { ...q, footL: lerp2(qh.footL, qm.footL, legS), liftL: lerp(qh.liftL ?? 0, qm.liftL ?? 0, legS) };
  if (f >= KNEE.on) q = kneelPose(f);
  const qk = q;
  q = Covid.lerpPose(q, pSit(), sst(SWIVEL.a, SWIVEL.land, f));
  // the swing round stays low and leaned: the torso keeps its forward lean while the hips drop (SWING_LEAN), the chin
  // tucked, the legs folded under until the seat is close, so he never stands up tall over the edge before the plop
  if (f > SWIVEL.a) {
    const sl = sst(SWIVEL.a + 2, SWIVEL.land + 0.5, f);
    const qs = pSit();
    const tuck = Math.sin(Math.PI * c01((f - SWIVEL.a) / (SWIVEL.land + 2 - SWIVEL.a)));
    q = {
      ...q,
      lean: herm(SWING_LEAN, f),
      pitch: q.pitch + 9 * tuck,
      hunch: (q.hunch ?? 0) + 0.25 * tuck,
      footL: lerp2(qk.footL, qs.footL, sl),
      footR: lerp2(qk.footR, qs.footR, sl),
      liftL: lerp(qk.liftL ?? 0, qs.liftL ?? 0, sl),
      liftR: lerp(qk.liftR ?? 0, qs.liftR ?? 0, sl),
      sit: lerp(qk.sit ?? 0, qs.sit ?? 0, sl),
    };
  }
  // landed on the edge: the dangling legs swing forward once and damp out
  if (f > SWIVEL.land) {
    const t = f - SWIVEL.land;
    const sw = 13 * Math.exp(-t / 4.5) * Math.sin((2 * Math.PI * t) / 9);
    q = { ...q, footL: [q.footL[0] + sw, q.footL[1] - 0.25 * Math.abs(sw)], footR: [q.footR[0] + 0.85 * sw, q.footR[1] - 0.2 * Math.abs(sw)] };
  }
  // sitting: panting (the chest heaving, the mouth working), a glance down at the drop and back
  const rest = sst(SWIVEL.b - 4, SWIVEL.b + 2, f);
  if (rest > 0) {
    const pant = rest * (1 - 0.45 * sst(60, 72, f));
    const ph = ((f - SWIVEL.b) / 11) * 2 * Math.PI;
    const down = sst(REST_T.look[0], REST_T.look[1], f) * (1 - sst(REST_T.back[0], REST_T.back[1], f));
    q = {
      ...q,
      hunch: (q.hunch ?? 0) + pant * 0.25 * (0.5 + 0.5 * Math.sin(ph)),
      open: (q.open ?? 0) + pant * 0.18 * Math.sin(ph + 0.6),
      pitch: q.pitch + down * 16,
      headYaw: q.headYaw + down * 0.25,
      look: [lerp(q.look?.[0] ?? 0, 0.35, down), lerp(q.look?.[1] ?? 0, 0.85, down)],
      lids: (q.lids ?? 0) + 0.15 * down,
    };
  }
  return Covid.breathe(q, f, 1.2);
};

// ---- where he is: the world point under the figure, from his contacts --------------------------------------------------
/** the standing place on the lower step (toes near the riser) */
export const STAND = { X: CLIMB_X - m(0.68), Z: -m(0.22) };
/** the knee's point on the tread (the joint's centre, a knee-cap above the stone), on the lit top in front of the lamps */
export const KNEE_AT = { X: CLIMB_X - m(0.2), Z: m(0.2), up: 11 };
/** the hands flat on the top: the haul (both in front of him) and the catch (further along) */
export const GRIP_HAUL = { L: { X: CLIMB_X - m(0.11), Z: m(0.1) }, R: { X: CLIMB_X - m(0.15), Z: m(0.2) } };
export const GRIP_CATCH = { L: { X: CLIMB_X + m(0.3), Z: m(0.32) }, R: { X: CLIMB_X + m(0.42), Z: m(0.38) } };
/** the far foot pressed sole-on against the riser face while he heaves (the ankle a little off the stone) */
export const FOOT_RISER = { X: CLIMB_X - m(0.3), Y: FLOOR_Y - m(1.3), Z: -m(0.07) };
/** the near foot pressed flat on the riser first (low, in front of him, in plain view), the step he pushes off */
export const NEAR_RISER = { X: CLIMB_X - m(0.4), Y: FLOOR_Y - m(0.55), Z: -m(0.07) };
/** the near foot: up onto the low riser point (nearUp), pushing, off it into the knee swing (nearOff); the far foot:
 *  up off the floor onto the high riser point once his hips rise (up), held there until the knee is down (off) */
export const FOOT = { nearUp: [1, 9] as [number, number], nearOff: [16, 23] as [number, number], up: [9, 17] as [number, number], off: [29, 36] as [number, number] };
/** the seat: his hips on the nosing */
export const SEAT_AT = { X: CLIMB_X + m(0.02), Z: m(0.1), up: 16 };

/** the figure's world point and depth this frame */
/** the place with the knee pinned on its point (pose q) */
const kneePinned = (A: AirWorld, q: Covid.CovidPose): P2 => {
  const a0 = Covid.covidAnchors(HUMAN_KIND, q, [0, 0], 1);
  const sk = A.P.r(KNEE_AT.Z);
  const kp = A.P.p(KNEE_AT.X, LEDGE_Y - KNEE_AT.up, KNEE_AT.Z);
  return [kp[0] - a0.kneeL[0] * sk, kp[1] - a0.kneeL[1] * sk];
};
export const placeAt = (A: AirWorld, f: number): { at: P2; Z: number; scale: number } => {
  const q = humanPoseAt(f);
  const a0 = Covid.covidAnchors(HUMAN_KIND, q, [0, 0], 1);
  // the haul: from the standing place the body rises ~1 m toward the ledge and in (a slow pull in two goes: up to his
  // chest at the edge, a stall and a small sag, then the second heave as the knee comes up)
  // (up onto his toes off the floor foot, then the big heave off the far foot on the riser; a stall and a small sag
  // between, where the effort shows)
  const sag = 0.04 * sst(14, 17, f) * (1 - sst(18, 22, f));
  const h = 0.04 * sst(4, 12, f) + 0.96 * sst(11, 27, f) - sag;
  const Zh = lerp(STAND.Z, -m(0.1), sst(6, 28, f));
  const ph = A.P.p(STAND.X + m(0.12) * h, FLOOR_Y - m(0.95) * h, Zh);
  const wk = sst(12, KNEE.on, f);
  const Zk = KNEE_AT.Z;
  if (f <= SWIVEL.a) {
    const at = lerp2(ph, kneePinned(A, q), wk);
    const Z = lerp(Zh, Zk, wk);
    return { at, Z, scale: A.P.r(Z) };
  }
  // the swing round: the hips leave the knee and arc round and down onto the edge (a quadratic Bezier, bowed: across
  // first, then down; slow off the knee, speeding up as they drop, landing at SWIVEL.land with their speed), then the plop: the seat gives a little (deepest
  // ~f61), a small rebound, settled
  const qs = humanPoseAt(SWIVEL.a);
  const hipK = (() => {
    const at = kneePinned(A, qs);
    const sk = A.P.r(Zk);
    const h0 = Covid.covidAnchors(HUMAN_KIND, qs, [0, 0], 1).hip;
    return [at[0] + h0[0] * sk, at[1] + h0[1] * sk] as P2;
  })();
  const Zs = SEAT_AT.Z;
  const seat = A.P.p(SEAT_AT.X, LEDGE_Y - SEAT_AT.up, Zs);
  const u = c01((f - SWIVEL.a) / (SWIVEL.land - SWIVEL.a));
  const sB = u * u * (2 - u);
  const ctl: P2 = [lerp(hipK[0], seat[0], 0.75), lerp(hipK[1], seat[1], 0.25)];
  const bez = (t: number): P2 => [
    (1 - t) * (1 - t) * hipK[0] + 2 * (1 - t) * t * ctl[0] + t * t * seat[0],
    (1 - t) * (1 - t) * hipK[1] + 2 * (1 - t) * t * ctl[1] + t * t * seat[1],
  ];
  const tl = Math.max(0, f - SWIVEL.land);
  const settle = f > SWIVEL.land ? 6 * Math.exp(-tl / 2.6) * Math.sin((Math.PI * tl) / 4.2) : 0;
  const Z = lerp(Zk, Zs, sB);
  const sc = A.P.r(Z);
  const hip = bez(sB);
  const at: P2 = [hip[0] - a0.hip[0] * sc, hip[1] - a0.hip[1] * sc + settle * sc];
  return { at, Z, scale: sc };
};
/** how much the hands are on the ledge (0 = free), and where */
/** the catch comes in accelerating (the hands slap down onto the top at CATCH.on with their speed) */
const catchIn = (f: number) => c01((f - CATCH.a - 2.5) / (CATCH.on - CATCH.a - 2.5)) ** 2;
export const gripW = (f: number) => (1 - sst(LETGO.a, LETGO.b, f)) + catchIn(f) * (1 - sst(CATCH.off[0], CATCH.off[1], f));
export const gripAt = (A: AirWorld, f: number, free: { L: P2; R: P2 }): { L: P2; R: P2 } | undefined => {
  const w = gripW(f);
  if (w < 1e-3) return undefined;
  const G = f < 35 ? GRIP_HAUL : GRIP_CATCH;
  const L = A.P.p(G.L.X, LEDGE_Y - 5, G.L.Z);
  const R = A.P.p(G.R.X, LEDGE_Y - 5, G.R.Z);
  // on and off the stone the hands travel on an arc from above (they come down onto it, they lift off it)
  const up = 16 * A.P.r(G.L.Z) * Math.sin(Math.PI * c01(w));
  const arc = (a: P2, b: P2): P2 => [lerp(a[0], b[0], w), lerp(a[1], b[1], w) - up];
  return { L: arc(free.L, L), R: arc(free.R, R) };
};
/** the feet's world targets this frame and how much each is held to its target (0 = the pose's own) */
export const feetAt = (A: AirWorld, f: number) => {
  // the floor points: where the ankles are at f0 (standing on STAND), as world points re-projected each frame
  const a0 = Covid.covidAnchors(HUMAN_KIND, humanPoseAt(0), [0, 0], 1);
  const floorOf = (l: P2): P2 => A.P.p(STAND.X + l[0], FLOOR_Y + l[1], STAND.Z);
  const flL = floorOf(a0.ankleL);
  const flR = floorOf(a0.ankleR);
  const riser = A.P.p(FOOT_RISER.X, FOOT_RISER.Y, FOOT_RISER.Z);
  const nRiser = A.P.p(NEAR_RISER.X, NEAR_RISER.Y, NEAR_RISER.Z);
  const un = sst(FOOT.nearUp[0], FOOT.nearUp[1], f);
  const rz = A.P.r(FOOT_RISER.Z);
  // the near foot lifts up and forward onto the riser in an arc (out from the wall a little, then onto it)
  const L: P2 = [lerp(flL[0], nRiser[0], un) - Math.sin(Math.PI * un) * 8 * rz, lerp(flL[1], nRiser[1], un) - Math.sin(Math.PI * un) * 10 * rz];
  const u = sst(FOOT.up[0], FOOT.up[1], f);
  // the far foot travels up in an arc (out from the wall a little, then onto it)
  const R: P2 = [lerp(flR[0], riser[0], u) - Math.sin(Math.PI * u) * 10 * A.P.r(FOOT_RISER.Z), lerp(flR[1], riser[1], u) - Math.sin(Math.PI * u) * 14 * A.P.r(FOOT_RISER.Z)];
  return {
    L,
    wL: 1 - sst(FOOT.nearOff[0], FOOT.nearOff[1], f),
    R,
    wR: 1 - sst(FOOT.off[0], FOOT.off[1], f),
    // the scuffs: only once the sole is on the stone
    scuffN: sst(FOOT.nearUp[1] - 2, FOOT.nearUp[1], f) * (1 - sst(FOOT.nearOff[0], FOOT.nearOff[0] + 3, f)),
    scuffF: sst(FOOT.up[1] - 2, FOOT.up[1], f) * (1 - sst(FOOT.off[0], FOOT.off[0] + 3, f)),
    nRiser,
    riser,
  };
};
/** the pose with the held feet solved onto their world points (the ankle offsets re-measured twice) */
const withFeet = (A: AirWorld, f: number, q: Covid.CovidPose, at: P2, scale: number): Covid.CovidPose => {
  const ft = feetAt(A, f);
  let r = q;
  for (let it = 0; it < 3; it++) {
    const a = Covid.covidAnchors(HUMAN_KIND, r, at, scale);
    const fix = (cur: P2, ank: P2, T: P2, w: number): P2 => (w < 1e-4 ? cur : [cur[0] + ((T[0] - ank[0]) / scale) * w, cur[1] + ((T[1] - ank[1]) / scale) * w]);
    r = { ...r, footL: fix(r.footL, a.ankleL, ft.L, ft.wL), footR: fix(r.footR, a.ankleR, ft.R, ft.wR) };
  }
  return r;
};
/** the mittens' screen angle while they are down on the stone: lying flat along the top, fingers forward */
const HAND_FLAT = 4;
const angOf = (a: P2, b: P2) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
export const humanAnchorsAt = (A: AirWorld, f: number) => {
  const pl = placeAt(A, f);
  let q = withFeet(A, f, humanPoseAt(f), pl.at, pl.scale);
  const free = Covid.covidAnchors(HUMAN_KIND, q, pl.at, pl.scale);
  const grip = gripAt(A, f, { L: free.handL, R: free.handR });
  if (!grip) return { q, pl, grip, an: free };
  // palms down: turn each mitten (by the grip weight) until it lies flat on the stone, whatever the forearm does
  const w = gripW(f);
  for (let it = 0; it < 3; it++) {
    const a = Covid.covidAnchors(HUMAN_KIND, q, pl.at, pl.scale, { grip });
    q = {
      ...q,
      armL: { ...q.armL, hand: q.armL.hand + w * wrap(HAND_FLAT - angOf(a.wristL, a.mittenL)) },
      armR: { ...q.armR, hand: q.armR.hand + w * wrap(HAND_FLAT - angOf(a.wristR, a.mittenR)) },
    };
  }
  return { q, pl, grip, an: Covid.covidAnchors(HUMAN_KIND, q, pl.at, pl.scale, { grip }) };
};

const HumanFig: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => {
  const { q, pl, grip, an } = humanAnchorsAt(A, frame);
  const fog = A.folkFog(pl.Z, -LEDGE_Y);
  const onFloor = 1 - sst(6, 14, frame);
  const onLedge = sst(KNEE.swing[1] - 6, KNEE.on, frame);
  const ft = feetAt(A, frame);
  const kneeDown = sst(KNEE.on - 3, KNEE.on, frame) * (1 - sst(SWIVEL.a, SWIVEL.a + 5, frame));
  const gw = gripW(frame);
  const G = frame < 35 ? GRIP_HAUL : GRIP_CATCH;
  const rz = A.P.r(0);
  return (
    <g>
      {onFloor > 0.01 ? <AirShadow A={A} X={STAND.X} Z={STAND.Z} Y={FLOOR_Y} w={60} d={30} uid="noaHsF" amt={0.8 * onFloor} /> : null}
      {onLedge > 0.01 ? <AirShadow A={A} X={lerp(KNEE_AT.X + m(0.1), SEAT_AT.X, sst(SWIVEL.a, SWIVEL.b, frame))} Z={lerp(KNEE_AT.Z, SEAT_AT.Z + m(0.06), sst(SWIVEL.a, SWIVEL.b, frame))} Y={LEDGE_Y} w={66} d={26} uid="noaHsL" amt={0.6 * onLedge} /> : null}
      {kneeDown > 0.01 ? <AirShadow A={A} X={KNEE_AT.X} Z={KNEE_AT.Z} Y={LEDGE_Y} w={24} d={12} uid="noaHsK" amt={0.9 * kneeDown} /> : null}
      {gw > 0.01 ? (
        <g>
          <AirShadow A={A} X={G.L.X} Z={G.L.Z} Y={LEDGE_Y} w={18} d={9} uid="noaHsHL" amt={0.8 * gw} />
          <AirShadow A={A} X={G.R.X} Z={G.R.Z} Y={LEDGE_Y} w={18} d={9} uid="noaHsHR" amt={0.8 * gw} />
        </g>
      ) : null}
      <defs>
        <radialGradient id="noaScuff">
          <stop offset="0" stopColor={AIR.A.shadow} stopOpacity={0.78} />
          <stop offset="0.55" stopColor={AIR.A.shadow} stopOpacity={0.4} />
          <stop offset="1" stopColor={AIR.A.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {([[ft.nRiser, ft.scuffN], [ft.riser, ft.scuffF]] as [P2, number][]).map(([p, o], i) =>
        o > 0.01 ? <ellipse key={i} opacity={o} cx={p[0] + 10 * rz} cy={p[1] + 14 * rz} rx={32 * rz} ry={17 * rz} fill="url(#noaScuff)" /> : null,
      )}
      <HeadGlow c={an.headC} rW={an.headR} amt={HEAD_GLOW.human} uid="noaHg" />
      <Covid.CovidFigure kind={HUMAN_KIND} variant={0} pose={q} at={pl.at} scale={pl.scale} grip={grip} uid="noaHuman" fog={{ rgb: fog.rgb, amount: fog.amount }} unitPx={A.k} frame={frame} />
    </g>
  );
};

/** the step's edge, so it reads at sheet size: the riser face a shade darker toward its foot, and a cream lip along
 *  the nosing with a thin lit band on the top's front (drawn over the step's own block, under everything on it) */
export const EDGE = { riserDark: [0.1, 0.24] as [number, number], lip: 0.022, band: 0.06, bandA: 0.32, lipA: 0.85 };
const StepEdge: React.FC<{ A: AirWorld; i: number; uid: string; riser?: boolean; amt?: number }> = ({ A, i, uid, riser = true, amt = 1 }) => {
  const s = stepOf(i);
  const below = stepOf(i - 1).Y;
  const P = A.P;
  const pt = (q: P2) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`;
  const poly = (q: P2[]) => `M${q.map(pt).join("L")}Z`;
  const a = P.p(s.X0, s.Y, s.Z0);
  const b = P.p(s.X1, s.Y, s.Z0);
  const c = P.p(s.X1, below, s.Z0);
  const d = P.p(s.X0, below, s.Z0);
  const bandB = P.p(s.X1, s.Y, s.Z0 + m(EDGE.band));
  const bandA = P.p(s.X0, s.Y, s.Z0 + m(EDGE.band));
  const cream = AIR.A.cream;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}rd`} gradientUnits="userSpaceOnUse" x1="0" y1={a[1].toFixed(2)} x2="0" y2={d[1].toFixed(2)}>
          <stop offset="0" stopColor={AIR.A.shadow} stopOpacity={EDGE.riserDark[0] * amt} />
          <stop offset="1" stopColor={AIR.A.shadow} stopOpacity={EDGE.riserDark[1] * amt} />
        </linearGradient>
      </defs>
      {riser ? <path d={poly([a, b, c, d])} fill={`url(#${uid}rd)`} /> : null}
      <path d={poly([a, b, bandB, bandA])} fill={cream} opacity={EDGE.bandA * amt} />
      <path d={`M${pt(a)}L${pt(b)}`} stroke={cream} strokeWidth={m(EDGE.lip) * P.r(s.Z0)} strokeOpacity={EDGE.lipA * amt} strokeLinecap="round" />
    </g>
  );
};

/** the lower frame sinks into the dense low air (the style: a big flat face in the bottom third reads as dead space) */
export const LOW_FADE = { from: 1180, to: 1920, amt: 0.62, t: 0.4 };
const LowFade: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const c = A.cam;
  const wy = (sy: number) => c.cy + (sy - 960) / c.k;
  const x0 = c.cx - 600 / c.k;
  const col = rgbHex(airRamp("A", LOW_FADE.t));
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}lf`} gradientUnits="userSpaceOnUse" x1="0" y1={wy(LOW_FADE.from).toFixed(2)} x2="0" y2={wy(LOW_FADE.to).toFixed(2)}>
          {[0, 0.25, 0.5, 0.75, 1].map((q) => (
            <stop key={q} offset={q} stopColor={col} stopOpacity={(LOW_FADE.amt * q * q * (3 - 2 * q)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={wy(LOW_FADE.from).toFixed(2)} width={(1200 / c.k).toFixed(2)} height={((LOW_FADE.to - LOW_FADE.from + 20) / c.k).toFixed(2)} fill={`url(#${uid}lf)`} />
    </g>
  );
};

const NotOptimallyAdapted: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = stairsAirOf({ cam, rest: REST, frame });
  const onStep = (i: number): React.ReactNode => {
    if (i >= 1) {
      if (!inFront(A, stepAnchor(i).Z)) return null;
      const sp = speciesOf(i);
      return <DashedSpecies A={A} at={stepAnchor(i)} H={sp.H} headR={sp.headR} glow={sp.glow} a={sp.a} frame={frame} uid={`noaQ${i}`} seed={i} shape={sp.shape} brain={sp.brain} />;
    }
    if (i === 0)
      return (
        <g>
          <StepEdge A={A} i={0} uid="noaE0" />
          {LAMP_XS2.map((x, k) => (
            <Lamp key={k} A={A} X={x} Y={LEDGE_Y} Z={m(LAMP_BACK)} lit={1} frame={frame} uid={`noaLamp${k}`} seed={k * 1.37 + 0.4} />
          ))}
        </g>
      );
    // drawn after step 0 (its lamps) and the lower step's block: he is in front of both throughout
    if (i === -1)
      return (
        <g>
          <StepEdge A={A} i={-1} uid="noaE1" riser={false} amt={0.6} />
          <HumanFig A={A} frame={frame} />
        </g>
      );
    return null;
  };
  return (
    <AirStage v={moteView(A.v)} bloom={0.22}>
      <WorldSvg cam={cam}>
        <Stairs A={A} onStep={onStep} uid="noaSt" />
        <LowFade A={A} uid="noaLow" />
      </WorldSvg>
    </AirStage>
  );
};

export default NotOptimallyAdapted;
