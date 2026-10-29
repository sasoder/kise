// ---------------------------------------------------------------------------
// notToBenchmax3d — the pure plan of cut 26 NotToBenchmax rev 2 (sam-benchmaxxing): OpenAI's amber column and its tile
// seen from a LOW THREE-QUARTER angle (front-right, looking up along the column), the camera following the cap up.
// No React. Geometry in benchShared's world: the chart plane is Z = ZC (330 m); chart px <-> metres by S0 (7 px/m):
// world x = (chartX - 540) / S0, world y = (GROUND - chartY) / S0, the column's front face lies IN the chart plane
// (so its 2D drawing is benchShared's BenchColumn + OpenAITile, mapped onto the screen by the exact homography of that
// plane under the AirCam), and the column is a square box running back from it (depth = its width).
// ---------------------------------------------------------------------------
import { type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { GROUND, ROW, S0, ZC, glassH } from "./benchShared";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const D2R = Math.PI / 180;

export const FPS_26 = 24000 / 1001;
export const DURATION_26 = 50;

// ---------------------------------------------------------------------------
// THE COLUMN (OpenAI's, slot 2: chart x 540, world x 0)
// ---------------------------------------------------------------------------
/** column width = depth (m), tile size (m), the tile slab's thickness (m) */
export const COL_M = ROW.col / S0;
export const TILE_M = ROW.tile / S0;
export const TILE_T = 4;
/** the climb: fill in rungs, already climbing at f0, decelerating into its settle by ~f26 */
export const CLIMB = { r0: 10.6, r1: 14, f0: -10, f1: 26 } as const;
export const rungsAt = (f: number) => {
  const u = c01((f - CLIMB.f0) / (CLIMB.f1 - CLIMB.f0));
  // a soft, weighty deceleration (velocity highest at the start, no overshoot)
  const e = 1 - Math.pow(1 - u, 2.4);
  return CLIMB.r0 + (CLIMB.r1 - CLIMB.r0) * e;
};
/** the glass top (= the tile's floor) in chart px and in metres */
export const capChartY = (f: number) => GROUND - glassH(rungsAt(f));
export const capM = (f: number) => glassH(rungsAt(f)) / S0;

/** chart px (on the plane Z = ZC) -> world metres */
export const chartToWorld = (x: number, y: number, z: number = ZC): V3 => [(x - 540) / S0, (GROUND - y) / S0, z];

// ---------------------------------------------------------------------------
// THE CAMERA — front-right of the column at ~30 deg off its face normal, 12-24 m below the tile, looking up 3-12 deg;
// it cranes up with the cap and tilts up (one eased move, f-3..26) and then creeps (a slow arc ~3 deg around the
// column and ~3 m closer) to the cut.
// ---------------------------------------------------------------------------
export const CAM_PLAN = { az: 30, dist: 70, below0: 12.2, below: 24, f: 1450, pitch0: -3, pitch: -12 } as const;
/** the follow: a crane-up with a tilt. The camera rises with the cap but a little less (12 -> 24 m below the tile)
 *  while tilting up (3 -> 12 deg), so the tile holds its place in the upper middle, the horizon sinks ~200 px and the
 *  rungs stream down past us; both settle by ~f26. Then a slow creep. */
export const FOLLOW = { f0: -3, f1: 26 } as const;
const ease = (u: number) => {
  const x = c01(u);
  return 1 - Math.pow(1 - x, 2.2);
};
const smooth = (u: number) => {
  const x = c01(u);
  return x * x * (3 - 2 * x);
};
const tileMidAt = (f: number) => capM(f) + TILE_M / 2;
export const cam26 = (f: number): SideCam => {
  const e = ease((f - FOLLOW.f0) / (FOLLOW.f1 - FOLLOW.f0));
  // the creep: a slow arc ~3 deg around the column and ~3 m closer, from f16 to past the cut
  const c = smooth((f - 16) / 70);
  const az = CAM_PLAN.az - 3 * c;
  const dist = CAM_PLAN.dist - 3 * c;
  const cx = dist * Math.sin(az * D2R);
  const cz = ZC - dist * Math.cos(az * D2R);
  const yaw = Math.atan2(0 - cx, ZC - cz) / D2R;
  return {
    mode: "side",
    x: cx,
    y: tileMidAt(f) - (CAM_PLAN.below0 + (CAM_PLAN.below - CAM_PLAN.below0) * e),
    z: cz,
    f: CAM_PLAN.f,
    horizon: 960,
    yaw,
    pitch: CAM_PLAN.pitch0 + (CAM_PLAN.pitch - CAM_PLAN.pitch0) * e + 0.4 * c,
  };
};

// ---------------------------------------------------------------------------
// PROJECTION — airProject's pinhole, as an affine map to homogeneous screen coords (so a plane maps by a homography)
// ---------------------------------------------------------------------------
/** world point -> homogeneous screen [X, Y, W] (screen = X / W, Y / W), exactly airProject's model */
export const projH = (cam: SideCam, p: V3): [number, number, number] => {
  const yaw = (cam.yaw ?? 0) * D2R;
  const pitch = (cam.pitch ?? 0) * D2R;
  const hor = cam.horizon ?? 960;
  const rx = p[0] - cam.x;
  const ry = p[1] - cam.y;
  const rz = p[2] - cam.z;
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  const sp = Math.sin(pitch);
  const cp = Math.cos(pitch);
  const d = rx * sy * cp + ry * -sp + rz * cy * cp;
  const right = rx * cy - rz * sy;
  const up = rx * sy * sp + ry * cp + rz * cy * sp;
  return [540 * d + cam.f * right, hor * d - cam.f * up, d];
};
export const proj = (cam: SideCam, p: V3) => {
  const h = projH(cam, p);
  const w = Math.max(1e-6, h[2]);
  return { x: h[0] / w, y: h[1] / w, s: cam.f / w };
};
/**
 * The CSS matrix3d that maps an element's local px (p, q) to screen px, for an element whose local px are chart px
 * scaled by `ss` with its top-left at chart (x0, y0): local (p, q) = chart (x0 + p / ss, y0 + q / ss) on the plane
 * Z = ZC (or a parallel plane `z`, e.g. a slab's back face). Use with transform-origin 0 0 on an element at left 0,
 * top 0.
 */
export const chartPlaneMatrix3d = (cam: SideCam, x0: number, y0: number, ss: number, z: number = ZC) => {
  const at = (p: number, q: number) => projH(cam, chartToWorld(x0 + p / ss, y0 + q / ss, z));
  const O = at(0, 0);
  const P = at(1, 0);
  const Q = at(0, 1);
  const n = O[2];
  // H columns: d/dp, d/dq, origin (normalised by the origin's W)
  const h = [
    [(P[0] - O[0]) / n, (Q[0] - O[0]) / n, O[0] / n],
    [(P[1] - O[1]) / n, (Q[1] - O[1]) / n, O[1] / n],
    [(P[2] - O[2]) / n, (Q[2] - O[2]) / n, O[2] / n],
  ];
  const v = [h[0][0], h[1][0], 0, h[2][0], h[0][1], h[1][1], 0, h[2][1], 0, 0, 1, 0, h[0][2], h[1][2], 0, h[2][2]];
  return `matrix3d(${v.map((x) => x.toPrecision(10)).join(",")})`;
};
