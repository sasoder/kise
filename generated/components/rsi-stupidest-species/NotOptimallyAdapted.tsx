// ---------------------------------------------------------------------------
// NotOptimallyAdapted (rsi-stupidest-species, cut 19), REVISION 2: THE CLUMSY STEP-UP. Dwarkesh 3D style
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
//   f0-24   hands on the ledge, he hauls himself up (the body rises 1 m) and swings his near knee up onto it
//           (the knee planted on the tread from KNEE.on).
//   f24-31  kneeling on one knee at the edge, the far leg dangling over the riser, he lets go and straightens up ...
//   f28-40  ... and wobbles back, arms windmilling once, worried, mouth open (ONE wobble).
//   f38-47  catches himself: lunges forward, both hands slapped down on the tread (planted from CATCH.on).
//   f47-59  hauls the other leg up and swivels round, plopping down to sit on the edge between two lamps, facing us.
//   f59-72  sits there out of breath (panting), glances down at the drop and back up.
// Contacts: the hands on the ledge (grip, exact world points) f0-24 and f46-51, eased on and off; the knee on the tread
// f24-47 (the figure translated so the knee joint sits on its point); the hips on the edge from f59. Pure per frame.
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
export const WOBBLE = { a: 29, b: 41 };
export const CATCH = { a: 35, b: 47, on: 47, off: [49, 55] as [number, number] };
export const SWIVEL = { a: 49, b: 61 };
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
/** tipping back over the drop: the far leg kicking out, the face turned toward us, alarmed */
const pWobble = (): Covid.CovidPose => ({ ...pKneel(), crouch: 70, lean: -21, pitch: -12, headYaw: 0.95, roll: -8, look: [-0.4, 0.6], footR: [40, 40], worry: 1, open: 0.85, lids: 0, brow: -0.8, hunch: 0 });
/** lunged forward over the tread, both hands down on it */
const pCatch = (): Covid.CovidPose => ({ ...pKneel(), armL: arm([90, -60], [-0.45, -1], 0, PALM), armR: arm([100, -60], [-0.45, -1], 0, PALM), crouch: 104, lean: 48, pitch: 22, headYaw: 1.25, roll: 4, look: [0.5, 0.4], worry: 0.8, open: 0.45, lids: 0.15, brow: -0.2 });
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

/** the windmill: each wrist on a circle about its shoulder (local units), one turn over the wobble, eased in and out */
const windmill = (q: Covid.CovidPose, f: number): Covid.CovidPose => {
  const amt = sst(LETGO.a + 1, LETGO.b + 1, f) * (1 - sst(CATCH.a + 1, CATCH.a + 10, f));
  if (amt < 1e-4) return q;
  const a0 = Covid.covidAnchors(HUMAN_KIND, q, [0, 0], 1);
  const th = 1.7 * Math.PI * sst(WOBBLE.a - 2, WOBBLE.b + 3, f);
  const R = 76;
  // the near arm circles backward (down-back-up-forward), the far arm half a turn behind
  const wL: P2 = [a0.shoulderL[0] - R * Math.sin(th + 0.4), a0.shoulderL[1] - R * Math.cos(th + 0.4)];
  const wR: P2 = [a0.shoulderR[0] - R * Math.sin(th + 0.4 + Math.PI * 0.85), a0.shoulderR[1] - R * Math.cos(th + 0.4 + Math.PI * 0.85)];
  return {
    ...q,
    armL: { ...q.armL, w: lerp2(q.armL.w, wL, amt), elbow: lerp2(q.armL.elbow, [0.3, 1], amt), fist: lerp(q.armL.fist, 0, amt), hand: lerp(q.armL.hand, 10, amt) },
    armR: { ...q.armR, w: lerp2(q.armR.w, wR, amt), elbow: lerp2(q.armR.elbow, [-0.3, 1], amt), fist: lerp(q.armR.fist, 0, amt), hand: lerp(q.armR.hand, 10, amt) },
  };
};
/** the arms while free on the knee (between the let-go and the windmill): out a little for balance */
const freeArms = (q: Covid.CovidPose): Covid.CovidPose => {
  const a0 = Covid.covidAnchors(HUMAN_KIND, q, [0, 0], 1);
  return { ...q, armL: arm([a0.shoulderL[0] + 40, a0.shoulderL[1] + 80], [0.2, 1], 0.2, 10), armR: arm([a0.shoulderR[0] - 30, a0.shoulderR[1] + 86], [-0.2, 1], 0.2, 10) };
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
  q = Covid.lerpPose(q, freeArms(pUp()), sst(LETGO.a, LETGO.b, f));
  q = Covid.lerpPose(q, pWobble(), sst(WOBBLE.a, WOBBLE.a + 8, f));
  q = Covid.lerpPose(q, pCatch(), sst(CATCH.a, CATCH.b, f));
  q = windmill(q, f);
  q = Covid.lerpPose(q, pSit(), sst(SWIVEL.a, SWIVEL.b, f));
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
export const GRIP_CATCH = { L: { X: CLIMB_X + m(0.18), Z: m(0.32) }, R: { X: CLIMB_X + m(0.32), Z: m(0.38) } };
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
  // the swivel: the hips travel from where they were on the knee to the edge (pinned by the hip), then the plop
  const qs = humanPoseAt(SWIVEL.a);
  const hipK = (() => {
    const at = kneePinned(A, qs);
    const sk = A.P.r(Zk);
    const h0 = Covid.covidAnchors(HUMAN_KIND, qs, [0, 0], 1).hip;
    return [at[0] + h0[0] * sk, at[1] + h0[1] * sk] as P2;
  })();
  const Zs = SEAT_AT.Z;
  const seat = A.P.p(SEAT_AT.X, LEDGE_Y - SEAT_AT.up, Zs);
  const ws = sst(SWIVEL.a, SWIVEL.b, f);
  // the hips swing up and over in an arc (a lift mid-swivel) and land with a small plop
  const lift = 26 * Math.sin(Math.PI * ws);
  const plop = 7 * Math.sin(Math.PI * c01((f - (SWIVEL.b - 2)) / 10)) * (1 - c01((f - (SWIVEL.b - 2)) / 10));
  const Z = lerp(Zk, Zs, ws);
  const sc = A.P.r(Z);
  const hip = lerp2(hipK, seat, ws);
  const at: P2 = [hip[0] - a0.hip[0] * sc, hip[1] - a0.hip[1] * sc - lift * sc + plop * sc];
  return { at, Z, scale: sc };
};
/** how much the hands are on the ledge (0 = free), and where */
export const gripW = (f: number) => (1 - sst(LETGO.a, LETGO.b, f)) + sst(CATCH.on - 9, CATCH.on, f) * (1 - sst(CATCH.off[0], CATCH.off[1], f));
export const gripAt = (A: AirWorld, f: number, free: { L: P2; R: P2 }): { L: P2; R: P2 } | undefined => {
  const w = gripW(f);
  if (w < 1e-3) return undefined;
  const G = f < 35 ? GRIP_HAUL : GRIP_CATCH;
  const L = A.P.p(G.L.X, LEDGE_Y - 5, G.L.Z);
  const R = A.P.p(G.R.X, LEDGE_Y - 5, G.R.Z);
  return { L: lerp2(free.L, L, w), R: lerp2(free.R, R, w) };
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
