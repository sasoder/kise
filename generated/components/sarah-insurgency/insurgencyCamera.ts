// ---------------------------------------------------------------------------
// insurgencyCamera: THE ONE PROJECTION of sarah-insurgency (pure maths, no React). The WebGL ground
// (insurgencyGround.tsx) and every SVG overlay (pieces, labels, lines) use exactly these functions, so every piece
// sits on the map. Re-exported by insurgencyShared.tsx (its header is the clip's API).
//
// THE WORLD: a map world's px (1 world px ~ 1 km in both maps) laid as the ground plane. A 3D point is (X, Y, Z):
// X = map x (east), Y = height above the ground (up +), Z = map y (south +; north recedes from a camera that looks
// north). The page world has no map: the same units, any origin.
//
// THE CAMERA: a pinhole (focal F px, the frame's centre the principal point, no roll) aimed at a target T on (or
// above, ty) the ground from a distance D, pitched down by `pitch` deg, yawed by `yaw` deg (0 = looking north on the
// flat map, i.e. toward -Z; 90 = east, +X; clockwise seen from above). A conic map's meridians are not parallel:
// "look north" at a place is northYaw(project, lon, lat) (LCC: ~0 on the centre meridian).
// One keyed track per cut: keys -> monotone cubic (pchip; D and F in log space) -> the house damped follow
// (CAM_STIFF / CAM_DAMP), pre-rolled so f0 is already moving and trailing the keys by LEAD frames. Cuts write a few
// coarse keys. camTrack(keys)(frame) is cached per keys array (pass a module-level array).
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip } from "../kits/maps/incaShared";

export const FPS = 24;
export const W = 1080;
export const H = 1920;
/** the default focal length, px (vertical field ~72 deg, as RodentFromCentralAsia) */
export const F_DEFAULT = 1300;

export type V3 = [number, number, number];
export type P2 = [number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** a key: frame, target on the map (x, z = map x, map y; ty its height, default 0), distance D, pitch and yaw (deg),
 *  focal F (px, default F_DEFAULT) */
export type CamKey = { f: number; x: number; z: number; ty?: number; D: number; pitch: number; yaw: number; F?: number };
export type Cam = {
  /** the eye (3D) */
  C: V3;
  /** forward, right, up (unit) */
  f: V3;
  r: V3;
  u: V3;
  /** the target (3D), its distance, pitch / yaw (deg), focal (px) */
  T: V3;
  D: number;
  pitch: number;
  yaw: number;
  F: number;
};
export const camFrom = (x: number, ty: number, z: number, D: number, pitch: number, yaw: number, F = F_DEFAULT): Cam => {
  const y = yaw * RAD;
  const p = pitch * RAD;
  const f: V3 = [Math.sin(y) * Math.cos(p), -Math.sin(p), -Math.cos(y) * Math.cos(p)];
  const r: V3 = [Math.cos(y), 0, Math.sin(y)];
  const u = cross(r, f);
  const C: V3 = [x - D * f[0], ty - D * f[1], z - D * f[2]];
  return { C, f, r, u, T: [x, ty, z], D, pitch, yaw, F };
};
/** a camera from a key (no track: for stills and checks) */
export const camOfKey = (k: CamKey) => camFrom(k.x, k.ty ?? 0, k.z, k.D, k.pitch, k.yaw, k.F ?? F_DEFAULT);

export const CAM = { PREROLL: 60, LEAD: 5 };
const TRACKS = new WeakMap<CamKey[], Cam[]>();
const lerpCam = (a: Cam, b: Cam, t: number) => {
  const m = (x: number, y: number) => x + (y - x) * t;
  return camFrom(m(a.T[0], b.T[0]), m(a.T[1], b.T[1]), m(a.T[2], b.T[2]), Math.exp(m(Math.log(a.D), Math.log(b.D))), m(a.pitch, b.pitch), m(a.yaw, b.yaw), Math.exp(m(Math.log(a.F), Math.log(b.F))));
};
/** the camera track of a cut: (frame) -> Cam. Fractional frames interpolate (sub-frame checks). Keys sorted by f;
 *  yaw keys are taken as written (write them continuous: 350 -> 370, not 350 -> 10). */
export const camTrack = (keys: CamKey[], last = 2000) => {
  return (frame: number): Cam => {
    let path = TRACKS.get(keys);
    if (!path) {
      const ch = [
        pchip(keys.map((q) => [q.f, q.x] as [number, number])),
        pchip(keys.map((q) => [q.f, q.ty ?? 0] as [number, number])),
        pchip(keys.map((q) => [q.f, q.z] as [number, number])),
        pchip(keys.map((q) => [q.f, Math.log(q.D)] as [number, number])),
        pchip(keys.map((q) => [q.f, q.pitch] as [number, number])),
        pchip(keys.map((q) => [q.f, q.yaw] as [number, number])),
        pchip(keys.map((q) => [q.f, Math.log(q.F ?? F_DEFAULT)] as [number, number])),
      ];
      const target = (f: number) => ch.map((c) => c(f));
      let s = target(-CAM.PREROLL + CAM.LEAD);
      let v = s.map(() => 0);
      const out: Cam[] = [];
      const end = Math.max(last, keys[keys.length - 1].f + 60);
      for (let fr = -CAM.PREROLL + 1; fr <= end; fr++) {
        const t = target(fr + CAM.LEAD);
        v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
        s = s.map((si, i) => si + v[i]);
        if (fr >= 0) out.push(camFrom(s[0], s[1], s[2], Math.exp(s[3]), s[4], s[5], Math.exp(s[6])));
      }
      path = out;
      TRACKS.set(keys, path);
    }
    const i = Math.max(0, Math.min(path.length - 2, Math.floor(frame)));
    const t = Math.max(0, Math.min(1, frame - i));
    return t === 0 ? path[i] : lerpCam(path[i], path[i + 1], t);
  };
};

// ---------------------------------------------------------------------------
// PROJECTION
// ---------------------------------------------------------------------------
export type Scr = { x: number; y: number; z: number; s: number };
/** a 3D point -> screen (x, y), its depth along the view axis z and its scale s (screen px per world unit there) */
export const toScreen = (cam: Cam, X: number, Y: number, Z: number): Scr => {
  const d: V3 = [X - cam.C[0], Y - cam.C[1], Z - cam.C[2]];
  const z = dot(d, cam.f);
  const zz = Math.max(z, 1e-6);
  return { x: W / 2 + (cam.F * dot(d, cam.r)) / zz, y: H / 2 - (cam.F * dot(d, cam.u)) / zz, z, s: cam.F / zz };
};
/** a ground point (map x, map y) -> screen */
export const groundToScreen = (cam: Cam, x: number, z: number) => toScreen(cam, x, 0, z);
/** the eye's distance to a 3D point (the fog's distance) */
export const eyeDist = (cam: Cam, X: number, Y: number, Z: number) => Math.hypot(X - cam.C[0], Y - cam.C[1], Z - cam.C[2]);
/** the ground point under a screen pixel (null above the horizon) */
export const groundAt = (cam: Cam, sx: number, sy: number): P2 | null => {
  const a = (sx - W / 2) / cam.F;
  const b = -(sy - H / 2) / cam.F;
  const dir: V3 = [cam.f[0] + a * cam.r[0] + b * cam.u[0], cam.f[1] + a * cam.r[1] + b * cam.u[1], cam.f[2] + a * cam.r[2] + b * cam.u[2]];
  if (dir[1] >= -1e-9) return null;
  const t = -cam.C[1] / dir[1];
  return [cam.C[0] + t * dir[0], cam.C[2] + t * dir[2]];
};
/** the screen-space horizon y */
export const horizonY = (cam: Cam) => H / 2 - cam.F * Math.tan(cam.pitch * RAD);
/** the local ground Jacobian at a map point: screen px per world unit along +x (east on the map) and +z (south) */
export const groundJacobian = (cam: Cam, x: number, z: number, e = 0.5) => {
  const p = toScreen(cam, x, 0, z);
  const px = toScreen(cam, x + e, 0, z);
  const pz = toScreen(cam, x, 0, z + e);
  return { p, dx: [(px.x - p.x) / e, (px.y - p.y) / e] as P2, dz: [(pz.x - p.x) / e, (pz.y - p.y) / e] as P2 };
};
/** the yaw (deg) that looks along the local meridian toward the pole at (lon, lat) on a map world */
export const northYaw = (project: (lon: number, lat: number) => [number, number], lon: number, lat: number) => {
  const a = project(lon, lat);
  const b = project(lon, lat + 0.05);
  return Math.atan2(b[0] - a[0], -(b[1] - a[1])) / RAD;
};
/** the yaw (deg) that looks from a toward b on the map (world px) */
export const yawToward = (a: P2, b: P2) => Math.atan2(b[0] - a[0], -(b[1] - a[1])) / RAD;
/** the horizontal light direction for the pieces (camera-relative: from the upper left, a little from the lens) */
export const lightOf = (cam: Cam): V3 => {
  const fh: V3 = [Math.sin(cam.yaw * RAD), 0, -Math.cos(cam.yaw * RAD)];
  const L: V3 = [-0.55 * cam.r[0] - 0.2 * fh[0], 0.75, -0.55 * cam.r[2] - 0.2 * fh[2]];
  const n = Math.hypot(L[0], L[1], L[2]);
  return [L[0] / n, L[1] / n, L[2] / n];
};

// ---------------------------------------------------------------------------
// THE DISTANCE FOG (one function for the ground shader and every overlay; relative to the target distance D, so
// the near map stays crisp at every zoom): 0 near, toward 1 far. hazeOf(dist / D) is the fog amount; airMixOf(dist /
// D) mixes the near air (at ~1.5 D) toward the horizon's air.
// ---------------------------------------------------------------------------
export type Fog = { a0: number; a1: number; m: number; b0: number; b1: number; c0: number; c1: number };
export const FOG_DEFAULT: Fog = { a0: 1.6, a1: 4.6, m: 0.72, b0: 3.6, b1: 15, c0: 1.4, c1: 4.4 };
const sstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const hazeOf = (rel: number, fog: Fog = FOG_DEFAULT) => {
  const h0 = fog.m * sstep(fog.a0, fog.a1, rel);
  return h0 + (1 - h0) * sstep(fog.b0, fog.b1, rel);
};
export const airMixOf = (rel: number, fog: Fog = FOG_DEFAULT) => sstep(fog.c0, fog.c1, rel);
/** the fog of an oblique view with the horizon in frame: denser far away, so the far sea / land contrast melts into
 *  the air before the horizon (no hard line there), while the near map stays crisp */
export const FOG_HORIZON: Fog = { a0: 1.5, a1: 4.2, m: 0.7, b0: 3.2, b1: 10, c0: 1.3, c1: 4 };
/** THE DEFAULT FOG of a camera: FOG_DEFAULT looking down, FOG_HORIZON once the horizon nears the frame, blended by
 *  the horizon row (smooth over a move, no jump) */
export const fogFor = (cam: Cam): Fog => {
  const w = sstep(-320, 120, horizonY(cam));
  const m = (k: keyof Fog) => FOG_DEFAULT[k] + (FOG_HORIZON[k] - FOG_DEFAULT[k]) * w;
  return { a0: m("a0"), a1: m("a1"), m: m("m"), b0: m("b0"), b1: m("b1"), c0: m("c0"), c1: m("c1") };
};
