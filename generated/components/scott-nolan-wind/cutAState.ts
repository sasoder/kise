// cutAState: cut A's (WhatTypeOfEnergy) camera track and plug path, exported so cut C (HaveToBeNuclear) opens on cut A's
// resolved frame pixel for pixel: CUT_A_END_CAM is the camera on cut A's last frame (f56), CUT_A_PLUG_END the plug there.
import { nuclearCamAt, nuclearTrack, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import type { V3 } from "./energyCore";

export const CUT_A_DURATION = 57;
/** cut A's story clock at its f0 (S = CUT_A_S0 + f): smoke, rotor, glint and core shimmer run on it */
export const CUT_A_S0 = 600;
/** the camera: opens close on the plug over the middle of the row, one crane back and down to the wide */
export const CUT_A_TRACK = nuclearTrack(
  { tx: 15, ty: 470, tz: -300, d: 1550, yaw: -4, pitch: 22, f: 3000, cx: 540, cy: 450 },
  [
    { f0: -10, f1: 50, to: { tx: 0, ty: 0, tz: -650, d: 2750, yaw: 0, pitch: 36, cy: 1180 } },
    { f0: 40, f1: 100, to: { d: 2820 } },
  ],
  CUT_A_DURATION,
);
export const cutACamAt = (f: number): NuclearCam => nuclearCamAt(CUT_A_TRACK, f);
/**
 * cut A v2 (plant labels): the same track with the opening lifted, so the labels under the plinths clear the caption
 * band (y 1080) from f0. The lift (screen px on cy) eases out to nothing by f40, so cut A v2's last frame is exactly
 * CUT_A_END_CAM. cutACamAt / CUT_A_END_CAM keep the v1 values (cut C imports them).
 */
export const CUT_A_V2_LIFT = { cy: -60, until: 40 } as const;
export const cutACamAtV2 = (f: number): NuclearCam => {
  const c = cutACamAt(f);
  const t = Math.min(1, Math.max(0, f / CUT_A_V2_LIFT.until));
  return { ...c, cy: c.cy + CUT_A_V2_LIFT.cy * (1 - t * t * (3 - 2 * t)) };
};

// the plug's drift along the row: it comes in over nuclear's right, passes over nuclear without stopping and eases toward
// gas, its prongs leading, looking about as it goes; on the last frame it hangs between gas and nuclear, still drifting
export const CUT_A_PLUG = { x: -168, dx: 180, tau: 22, y: 570, z: -300 } as const;
const D2R = Math.PI / 180;
/** the plug at cut A's frame f: face centre (world), prong direction, roll (degrees) */
/** cut A hangs its cable further aside, so it drops beside the cooling tower rather than across it */
export const CUT_A_DRAPE: [number, number] = [0.55, 0.5];
export const cutAPlugAt = (f: number): { end: V3; dir: V3; roll: number; drape: [number, number] } => {
  const P = CUT_A_PLUG;
  const x = P.x + P.dx * Math.exp(-(f + 2) / P.tau);
  const y = P.y + 6 * Math.sin(f * 0.1 + 0.9);
  const z = P.z + 5 * Math.sin(f * 0.07);
  // prongs lead along the row, turned a little into it; the turn wanders as if it were looking
  const e = (22 + 9 * Math.sin(f * 0.095 + 0.4)) * D2R;
  return { end: [x, y, z], dir: [-Math.cos(e), -0.1, Math.sin(e)], roll: 90, drape: CUT_A_DRAPE };
};
export const CUT_A_END_CAM: NuclearCam = cutACamAt(CUT_A_DURATION - 1);
export const CUT_A_PLUG_END = cutAPlugAt(CUT_A_DURATION - 1);

/**
 * cut A v2: the same plug path, but the cable's hanging run lands so that it crosses the label row in the gap between
 * NUCLEAR and WIND in every frame (it never runs across a label). The landing point is drape[0] of the plug's height
 * beside the tail; it eases from just under the plug (the opening) to beside it, which keeps the cable's touchdown on
 * the board nearly still while the plug drifts left. drape[1] stays CUT_A_DRAPE's.
 */
export const cutADrapeV2 = (f: number): [number, number] => [-0.09 + 0.47 * (1 - Math.exp(-f / 14)), CUT_A_DRAPE[1]];
export const cutAPlugAtV2 = (f: number): { end: V3; dir: V3; roll: number; drape: [number, number] } => ({ ...cutAPlugAt(f), drape: cutADrapeV2(f) });
/** cut A v2's last frame (where cut C v2 opens): camera (equal to CUT_A_END_CAM) and plug + cable (end, dir, roll, drape) */
export const CUT_A_END_CAM_V2: NuclearCam = cutACamAtV2(CUT_A_DURATION - 1);
export const CUT_A_PLUG_END_V2 = cutAPlugAtV2(CUT_A_DURATION - 1);
