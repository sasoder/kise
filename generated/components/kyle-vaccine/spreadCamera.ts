// ---------------------------------------------------------------------------
// spreadCamera: the one perspective camera of SpreadsForACentury (kyle-vaccine, cut 53). Pure maths (no React): the
// WebGL ground (spreadGround.tsx), the labels and the checks all project through exactly these functions, so the map,
// the plum stain, the orange light and the labels sit on one ground. Pattern: kyle-pandemics/rodentCamera.ts.
//
// THE WORLD: the baked map (spreadMapData.ts, LCC, ~1 km per world px, Berkeley at (0, 0)) is the GROUND PLANE.
// 3D point (X, Y, Zm): X = map x (east), Y = height (up +), Zm = map y (south +; north recedes from the camera).
//
// THE CAMERA: a pinhole (focal F px, the frame's centre the principal point) aimed at a target T on the ground from a
// distance D, pitched down by `pitch`, yawed to the local north of the map at the target (LCC meridians converge on
// the pole, so north stays up everywhere). ONE MOVE: the target rides one cubic Bezier from over the Sahara (f0) round
// the eastern Mediterranean and north-west onto England, log D falls 6200 -> 1000 and the pitch steepens 45 -> 53 deg,
// all on ONE progress u(f), the integral of a single speed bump (Rev 1: peak ~f99, after "spreads" f51) over a small
// constant creep: a gentle drift through the head while the map opens, one acceleration and one deceleration lobe
// into England by ~f140, then a slow creep to the last frame (f181).
// ---------------------------------------------------------------------------
import { project } from "./spreadMapData";

export const FPS = 30000 / 1001;
/** Rev 1: the slot stretched to 50.751 -> 56.823 s (182 f); the head f0-f45 covers "it may come from Africa, it may come
 *  from China", the old cut's beats sit ~49 f later */
export const DURATION = 182;
export const W = 1080;
export const H = 1920;
/** focal length, px */
export const F = 1300;

export type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** the LCC pole's image (meridians are straight lines through it) */
export const POLE = project(10, 89.99999);
/** the yaw (rad) that looks along the local meridian toward the pole at map point (x, z) */
export const northYaw = (x: number, z: number) => Math.atan2(POLE[0] - x, -(POLE[1] - z));

// ---------------------------------------------------------------------------
// THE TRACK
// ---------------------------------------------------------------------------
const ll = (lon: number, lat: number) => project(lon, lat);
/** the target's Bezier (lon/lat control points, projected): the Sahara -> the eastern Med -> the Alps -> England */
export const PATH_LL: [number, number][] = [
  [12, 22],
  [22, 30],
  [2, 51.5],
  [-2.0, 51.25],
];
export const TRACK = { D0: 6200, D1: 1000, pitch0: 45, pitch1: 53, peak: 99, width: 26, creep: 0.05, dExp: 2.0 };
export type Track = typeof TRACK;
/** the camera's progress u(f) (0 at f0, 1 at the last frame): the integral of one speed bump over a small creep */
const progressOf = (T: Track) => {
  const speed = (f: number) => Math.exp(-Math.pow((f - T.peak) / T.width, 2)) + T.creep;
  const n = (DURATION - 1) * 8;
  const tab = [0];
  let s = 0;
  for (let i = 1; i <= n; i++) {
    const a = (i - 1) / 8;
    const b = i / 8;
    s += ((speed(a) + speed(b)) / 2) * (b - a);
    tab.push(s);
  }
  const U = tab.map((v) => v / s);
  return (f: number) => {
    const x = Math.max(0, Math.min(DURATION - 1, f)) * 8;
    const i = Math.min(U.length - 2, Math.floor(x));
    return U[i] + (U[i + 1] - U[i]) * (x - i);
  };
};
export type Cam = { C: V3; f: V3; r: V3; u: V3; D: number; pitch: number; yaw: number; T: V3 };
export const camFrom = (tx: number, tz: number, D: number, pitchDeg: number): Cam => {
  const yaw = northYaw(tx, tz);
  const p = (pitchDeg * Math.PI) / 180;
  const f: V3 = [Math.sin(yaw) * Math.cos(p), -Math.sin(p), -Math.cos(yaw) * Math.cos(p)];
  const r: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const u = cross(r, f);
  const C: V3 = [tx - D * f[0], -D * f[1], tz - D * f[2]];
  return { C, f, r, u, D, pitch: pitchDeg, yaw, T: [tx, 0, tz] };
};
/** a camera track from a Bezier (lon/lat) and its numbers (the cut uses PATH_LL / TRACK; the checks try others) */
export const makeTrack = (path: [number, number][], T: Track) => {
  const B = path.map(([a, b]) => ll(a, b));
  const bez = (u: number): [number, number] => {
    const v = 1 - u;
    const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
    return [w.reduce((s, q, i) => s + q * B[i][0], 0), w.reduce((s, q, i) => s + q * B[i][1], 0)];
  };
  const progress = progressOf(T);
  return (frame: number): Cam => {
    const u = progress(frame);
    const [tx, tz] = bez(u);
    const D = Math.exp(Math.log(T.D0) + (Math.log(T.D1) - Math.log(T.D0)) * Math.pow(u, T.dExp));
    return camFrom(tx, tz, D, T.pitch0 + (T.pitch1 - T.pitch0) * u);
  };
};
/** the camera at frame f (fractional frames allowed) */
export const camAt = makeTrack(PATH_LL, TRACK);

export type Scr = { x: number; y: number; z: number; s: number };
/** a 3D point -> screen (x, y), its depth along the view axis z and its scale s (screen px per world px) */
export const toScreen = (cam: Cam, X: number, Y: number, Zm: number): Scr => {
  const d: V3 = [X - cam.C[0], Y - cam.C[1], Zm - cam.C[2]];
  const z = dot(d, cam.f);
  const zz = Math.max(z, 1e-6);
  return { x: W / 2 + (F * dot(d, cam.r)) / zz, y: H / 2 - (F * dot(d, cam.u)) / zz, z, s: F / zz };
};
/** the ground point under a screen pixel (null above the horizon) */
export const groundAt = (cam: Cam, sx: number, sy: number): [number, number] | null => {
  const a = (sx - W / 2) / F;
  const b = -(sy - H / 2) / F;
  const dir: V3 = [cam.f[0] + a * cam.r[0] + b * cam.u[0], cam.f[1] + a * cam.r[1] + b * cam.u[1], cam.f[2] + a * cam.r[2] + b * cam.u[2]];
  if (dir[1] >= -1e-9) return null;
  const t = -cam.C[1] / dir[1];
  return [cam.C[0] + t * dir[0], cam.C[2] + t * dir[2]];
};
/** the screen-space horizon y (on the centre line) */
export const horizonY = (cam: Cam) => H / 2 - F * Math.tan((cam.pitch * Math.PI) / 180);
/** distance from the eye to a ground point */
export const distTo = (cam: Cam, x: number, z: number) => Math.hypot(x - cam.C[0], cam.C[1], z - cam.C[2]);

/** the caption bands (CRAFT.md) */
export const BANDS: [number, number][] = [
  [1080, 1250],
  [1360, 1460],
];
export const inBand = (y: number, pad = 6) => BANDS.some(([a, b]) => y > a - pad && y < b + pad);
