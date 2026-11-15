// ---------------------------------------------------------------------------
// NotOptimallyAdapted (rsi-stupidest-species, cut 19). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 73 frames. Built on the shared world W1 THE SPECIES TOWER (speciesTower.tsx, read-only;
// TOWER_READY.md is its API) and W2's Chimp (stupidestFolk.tsx, read-only): this cut adds only its camera track, the
// ideal occupant's timing and the human's gaze.
//
// CHECK LINE: "We filled the civilization niche first, but it was never built to our measure: we are small in it."
//
// THE LINE: "not because we were in any sense optimally adapted to it."
// WORD -> FRAME: not -2 · because 5 · we 12 · were 19 · in 22 · any 25 · sense 29 · optimally 35 · adapted 49 · to 56 ·
//   it 67 (Whisper onsets from the composition start; may run ~0.2-0.4 s early)
// DURATION: the slot 19.353 -> 22.397 s (sequence frames 464-537) = 3.044 s x 23.976 = 73 frames (f0..f72).
//
// THE MOTION: one slow push-in on the human's lit alcove, already moving at f0 (the whole arch in frame, the cornice
// under it, the chimp in its softly lit niche below, as cut B left them), settling at TOWER_CAM.C_resolved by f58 and creeping
// on. On "we were in any sense optimally" (f13-f47) a moving orange tip draws the IDEAL OCCUPANT, the dashed outline of
// the big-headed figure the alcove was made for, up its left side, round its head near the crown, down its right side;
// the human's eyes follow the tip. On "adapted to it" (f49-f60) the outline is whole and breathing faintly and the human
// tilts his head up at it, a small turn; living hold to f72. Its one job: the niche fits something far bigger than us.
// Orange = intelligence (the clip's rule); DASHED orange = a better-fitted intelligence that does not exist. The human
// and the chimp are never orange. No labels, no numbers.
//
// CAMERA: one designed lobe (camTrack): the progress integrates a skewed bump started at f -16 (so f0 already moves),
// ln k runs from OPEN (1.10 x TOWER_CAM.C_open: the chimp's face then starts at y ~1258, below caption band 1, instead
// of y 1237 inside it) to TOWER_CAM.C_resolved (f58), anchored on the human's sill point (screen y 1008 -> 1000), then a
// 2 % creep easing in from f34 under the lobe's tail (one speed lobe, no stall), plus the house swayCam. Measured
// (scripts/clips/rsi-stupidest-species/check-not-optimally-adapted.ts): alcove crown y 459 -> 332, jambs x 379-701 ->
// 344-736, sill y 1008 -> ~1000, human 207 -> 252 px, his face y 831 -> 787, the chimp's face y 1257 -> 1306 (below
// band 1, in the gap above band 2); every outline point inside the keep-in box.
// DEPTH: the tower's own depth camera (towerPersp), fog by world depth (towerAirOf). The dashed tower above the capital
// is off (show.dashed 0): it is far above this frame on every frame, so the shared module's unoccluded dashes never draw.
//
// SOURCES: none (no real figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, swayCam, type Cam, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as Covid from "../kyle-covid/covidFolk";
import { HUMAN_SPOT, OCCUPANT, OCCUPANT_UV, TOWER, TOWER_CAM, TowerScene, frameAt, hy, nicheOf, nichePt, screenOf3, towerAirOf, type OccupantFn } from "./speciesTower";
import { CHIMP_POSES, Chimp } from "./stupidestFolk";
import type { AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 24000 / 1001;
export const DURATION = 73;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const sst = (a: number, b: number, f: number) => {
  const u = c01((f - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ---- the camera ---------------------------------------------------------------------------------------------------
// One eased lobe, already moving at f0: the progress s(f) integrates a skewed bump t^A (1 - t)^B over [F0, F1] (F0 < 0),
// renormalised so s(0) = 0 (OPEN) and s(F1) = 1 (C_resolved). ln k runs linearly in s; the human's sill point runs on a
// straight screen path from SY_OPEN to its C_resolved place. From C0 a creep in by CREEP eases in on the same anchor.
export const CAM = { A: 1.3, B: 2.2, F0: -16, F1: 58, CREEP: 1.02, C0: 34, OPEN_ZOOM: 1.1, SY_OPEN: 1008 };
const N_INT = 1200;
const S_TAB = (() => {
  const tab = [0];
  const v = (i: number) => {
    const t = i / N_INT;
    return Math.pow(t, CAM.A) * Math.pow(1 - t, CAM.B);
  };
  for (let i = 0; i < N_INT; i++) tab.push(tab[i] + (v(i) + v(i + 1)) / 2);
  return tab.map((q) => q / tab[N_INT]);
})();
const sRaw = (f: number) => {
  const x = ((f - CAM.F0) / (CAM.F1 - CAM.F0)) * N_INT;
  if (x <= 0) return 0;
  if (x >= N_INT) return 1;
  const i = Math.floor(x);
  return S_TAB[i] + (S_TAB[i + 1] - S_TAB[i]) * (x - i);
};
const S0 = sRaw(0);
export const moveS = (f: number) => (sRaw(f) - S0) / (1 - S0);
const SILL_RES = screenOf3(TOWER_CAM.C_resolved, HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z);
const LNK_OPEN = Math.log(TOWER_CAM.C_open.k * CAM.OPEN_ZOOM);
const LNK_RES = Math.log(TOWER_CAM.C_resolved.k);
export const camTrack = (f: number): Cam => {
  const s = moveS(f);
  // the creep eases in (u^2, no ease-out) under the lobe's tail, so the speed never drops to a stall between them
  const u = Math.max(0, (f - CAM.C0) / (DURATION - 1 - CAM.C0));
  const creep = Math.log(CAM.CREEP) * u * u;
  const k = Math.exp(LNK_OPEN + (LNK_RES - LNK_OPEN) * s + creep);
  const sy = CAM.SY_OPEN + (SILL_RES[1] - CAM.SY_OPEN) * s;
  return frameAt(k, HUMAN_SPOT.X, HUMAN_SPOT.Y, HUMAN_SPOT.Z, 540, sy);
};
const REST = swayCam(camTrack(0), 0);

// ---- the ideal occupant: drawn by its tip on "we were in any sense optimally" ---------------------------------------
// A trapezoid speed profile (5-frame ramps, constant speed between): the tip draws like a hand, not a spring.
export const OCC = { f0: 13, f1: 47, ramp: 5 };
export const occProgress = (f: number) => {
  const { f0, f1, ramp } = OCC;
  const T = f1 - f0;
  const vMax = 1 / (T - ramp);
  const t = Math.max(0, Math.min(T, f - f0));
  if (t < ramp) return (vMax * t * t) / (2 * ramp);
  if (t > T - ramp) {
    const r = T - t;
    return 1 - (vMax * r * r) / (2 * ramp);
  }
  return vMax * (t - ramp / 2);
};
/** the tip's point (world px) at progress p: the same projected outline and arc length as IdealOccupant draws */
const occTip = (A: AirWorld, p: number): P2 => {
  const n = nicheOf("human");
  const pts: P2[] = OCCUPANT_UV.map(([u, v]) => A.P.p(...nichePt(n, u, v, OCCUPANT.inset)));
  pts.push(pts[0]);
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const upto = L[L.length - 1] * c01(p);
  for (let i = 1; i < pts.length; i++) {
    if (L[i] >= upto) {
      const q = (upto - L[i - 1]) / (L[i] - L[i - 1] || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q];
    }
  }
  return pts[pts.length - 1];
};

// ---- the human: eyes on the tip while it draws, then a small lift of the head to the outline's head ------------------
// f0 = the tower's default human (humanPose: pitch -8, look [0.05, -0.65]), as cut B leaves him.
export const LOOK = { follow0: 10, follow1: 16, release0: 45, release1: 52, lift0: 49, lift1: 61 };
const humanPoseAt = (A: AirWorld, frame: number): Covid.CovidPose => {
  const q = Covid.POSES.front();
  const head = A.P.p(HUMAN_SPOT.X, hy(TOWER.cornY + 1.6), HUMAN_SPOT.Z);
  const tip = occTip(A, occProgress(frame));
  const halfW = A.P.r(HUMAN_SPOT.Z) * 1.35 * 178;
  // the eyes follow the tip across (x only; he keeps looking up), easing on and off the follow
  const follow = sst(LOOK.follow0, LOOK.follow1, frame) * (1 - sst(LOOK.release0, LOOK.release1, frame));
  const lx = Math.max(-1, Math.min(1, (tip[0] - head[0]) / halfW)) * 0.85 * follow;
  const lift = sst(LOOK.lift0, LOOK.lift1, frame);
  return Covid.breathe(
    {
      ...q,
      pitch: (q.pitch ?? 0) - 8 - 14 * lift,
      headYaw: (q.headYaw ?? 0) + 0.14 * lx + 0.12 * lift,
      look: [0.05 * (1 - follow) * (1 - lift) + lx + 0.1 * lift, -0.65 - 0.3 * lift],
    },
    frame,
  );
};

// ---- the chimp in its niche, lit as cut B lights it (CHIMP_LIGHT.md; copied from StupidestPossibleSpecies.tsx) ----------
// A soft cool-cream glow on the niche's back wall and a faint pool on its floor, weaker and cooler than the human's warm
// niche, so the chimp reads as a dark silhouette with its tan face clear. The chimp holds B's last pose (it looks out:
// B eases to it over f148-170 and holds it to f219).
export const CHIMP_LIGHT = { core: "#F1ECDC", mid: "#D8D3BF", edge: "#A39F8C", a: 0.62 };
export const CHIMP_POSE = { headYaw: 0.45, look: [0.58, -0.05] as P2, pitch: -1 };
const ChimpNicheLight: React.FC<{ A: AirWorld }> = ({ A }) => {
  const n = nicheOf("chimp");
  const c = A.P.p(...nichePt(n, 0, n.h * 0.46, n.depth)); // the glow's centre on the back wall
  const a = A.P.p(...nichePt(n, -n.w / 2, 0, n.depth));
  const b = A.P.p(...nichePt(n, n.w / 2, 0, n.depth));
  const wPx = Math.abs(b[0] - a[0]); // the niche's width (world px at the back wall)
  const fl = A.P.p(...nichePt(n, 0, 0, n.depth * 0.45)); // the floor pool's centre
  const g = CHIMP_LIGHT.a;
  return (
    <g>
      <defs>
        <radialGradient
          id="noaChL"
          gradientUnits="userSpaceOnUse"
          cx={c[0].toFixed(2)}
          cy={c[1].toFixed(2)}
          r={(wPx * 0.78).toFixed(2)}
          gradientTransform={`translate(${c[0].toFixed(2)} ${c[1].toFixed(2)}) scale(1 1.35) translate(${(-c[0]).toFixed(2)} ${(-c[1]).toFixed(2)})`}
        >
          <stop offset="0" stopColor={CHIMP_LIGHT.core} stopOpacity={0.9 * g} />
          <stop offset="0.5" stopColor={CHIMP_LIGHT.mid} stopOpacity={0.55 * g} />
          <stop offset="1" stopColor={CHIMP_LIGHT.edge} stopOpacity={0.12 * g} />
        </radialGradient>
        <radialGradient id="noaChF">
          <stop offset="0" stopColor={CHIMP_LIGHT.core} stopOpacity={0.4 * g} />
          <stop offset="1" stopColor={CHIMP_LIGHT.core} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={c[0] - wPx * 1.2} y={c[1] - wPx * 1.6} width={wPx * 2.4} height={wPx * 3.2} fill="url(#noaChL)" />
      <ellipse cx={fl[0]} cy={fl[1]} rx={wPx * 0.55} ry={wPx * 0.16} fill="url(#noaChF)" />
    </g>
  );
};
const chimpInNiche: OccupantFn = ({ A, anchor, at, scale, frame }) => (
  <g>
    <ChimpNicheLight A={A} />
    <Chimp variant={0} pose={CHIMP_POSES.sit(1, frame, CHIMP_POSE)} at={at} scale={scale} uid="noaChimp" fog={A.folkFog(anchor.Z)} unitPx={A.cam.k} />
  </g>
);

const NotOptimallyAdapted: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = swayCam(camTrack(frame), frame);
  const A = towerAirOf({ cam, rest: REST, frame });
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <TowerScene
          A={A}
          frame={frame}
          show={{ dashed: 0, idealOccupant: occProgress(frame) }}
          human={{ pose: humanPoseAt(A, frame) }}
          occupants={{ chimp: chimpInNiche }}
          uid="noa"
        />
      </WorldSvg>
    </AirStage>
  );
};

export default NotOptimallyAdapted;
