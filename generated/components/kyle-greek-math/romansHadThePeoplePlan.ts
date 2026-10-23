// ---------------------------------------------------------------------------
// romansHadThePeoplePlan: the CAMERA of cut F (RomansHadThePeople, kyle-greek-math, 74.074 s), React-free so bun checks
// run it. The world, its data and E's camera: ./athensRomePlan.ts (read-only). F opens on cut E's last frame
// (E_END.path = cameraE(132)) and makes one move: a truck right with a rise, a pull-back and a lens widen, together on
// one bell, that brings the vast Roman crowd before the Colosseum into frame and settles on the comparison picture
// (Athens small at the left, the Roman sea on the right/centre), then creeps.
// ---------------------------------------------------------------------------
import { bell, cameraE, type Cam3 } from "./athensRomePlan";

/** E's last frame (cut E's own numbering) */
export const E_LAST = 132;
/** E's path continued past its end: E's slow creep (x +1.25, z -4.6, hy -0.12 per frame) carried on under F's move,
 *  so F leaves E at E's own velocity */
const baseOf = (f: number): Cam3 => cameraE(E_LAST + f);
/** the depth the pull-back is measured at (between the crowds' front rows and the Athenians' middle) */
const Z_REF = -3000;
/** the landing (the bell's end, before the creep), solved from the picture: the Athenian crowd's middle at x ~150
 *  (all 223 and the eight scholars in shot, the rock and the Parthenon above them at the left, temple top y ~690), the
 *  empty plain and the track between, the Roman crowd's front corner at x ~600 with its front edge at y ~1040-1060, its
 *  sea running back and right to the Colosseum in the haze (x ~770-940, y ~620-690); the horizon at y ~606. Eye 35 m up,
 *  F 700 px. Both crowds' front figures ~22-23 px: with Athens in shot this is the most the world allows (the Roman
 *  front corner stands ~7200 units right of the Athenians' middle at the same depth: ~22 figure heights apart). */
export const F_LAND: Cam3 = { x: 6047, h: 6260, z: -13952, F: 700, hy: 606 };
/** the move: one bell from f0 (leaving at E's own velocity, E's creep carried underneath) to f1, every channel on it
 *  (x linear, distance and focal length in log, h and hy linear); the lens widen runs on the same bell a few frames
 *  ahead (lead), so the Roman crowd's edge comes in from the right by f16 while the truck is still accelerating */
export const F_MOVE = { f1: 54, a: 1.0, b: 2.4, lead: 8 };
const P = bell(0, F_MOVE.f1, F_MOVE.a, F_MOVE.b);
const PF = bell(0, F_MOVE.f1 - F_MOVE.lead, F_MOVE.a, F_MOVE.b);
/** the creep after the landing: a slow drift right (units per frame), ramping in under the bell's deceleration */
export const F_CREEP = { x: 16, from: 22, ramp: 34 };
const CREEP_AT: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= 200; f++) {
    const u = Math.max(0, Math.min(1, (f - 0.5 - F_CREEP.from) / F_CREEP.ramp));
    out.push(out[f - 1] + F_CREEP.x * u * u * (3 - 2 * u));
  }
  return out;
})();
const creepX = (f: number) => {
  if (f <= 0) return 0;
  const i = Math.min(199, Math.floor(f));
  return CREEP_AT[i] + (CREEP_AT[i + 1] - CREEP_AT[i]) * (f - i);
};
const B1 = baseOf(F_MOVE.f1);
/** F's camera path (without the hand-held sway; the component adds swayCam3 on the life frame) */
export const pathF = (f: number): Cam3 => {
  const b = baseOf(f);
  const p = P(f);
  const d0 = Z_REF - b.z;
  const d1 = Z_REF - B1.z;
  const dLand = Z_REF - F_LAND.z;
  const d = d0 * Math.pow(dLand / d1, p);
  return {
    x: b.x + (F_LAND.x - B1.x) * p + creepX(f),
    h: b.h + (F_LAND.h - B1.h) * p,
    z: Z_REF - d,
    F: b.F * Math.pow(F_LAND.F / B1.F, PF(f)),
    hy: b.hy + (F_LAND.hy - B1.hy) * p,
  };
};
/** the move's progress 0..1 (the bell, without the creep): drives the extra low-air sink over the near plain */
export const moveProgress = (f: number) => P(f);
