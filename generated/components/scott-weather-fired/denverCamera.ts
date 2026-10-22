// ---------------------------------------------------------------------------------------------------------------
// denverCamera — the perspective camera, the air (fog) and the light of the Denver world (scott-weather-fired).
// Pure TypeScript (no React): usable from components, canvases and module-load asserts. Re-exported by denverWorld.
//
// WORLD: statute miles. x = east, y = north, z = up; origin = the Jeppesen Terminal on the ground (z 0).
// CAMERA (DenCam): an orbit about a ground target, so it travels continuously from a low oblique to straight down:
//   tx, ty    the ground point the camera looks at (it projects to the frame centre, 540 x 960)
//   dist      miles from the eye to that target
//   pitch     degrees below the horizontal (0 = level, 90 = straight down)
//   heading   degrees, 0 = looking north, + turns toward the east (clockwise seen from above)
//   fov       the VERTICAL field of view in degrees (the frame is 1080 x 1920)
// makeView(cam) -> DenView: the eye, the basis (r, u, f), the focal length F (px), horizonY (screen y of the horizon;
// -Infinity once the camera looks straight down), and project(x, y, z) -> {x, y, d} (screen px, depth d in miles
// along the view axis; d <= NEAR means behind the lens: project returns null).
// Damped camera keys (CRAFT.md Camera, the kit's cameraTrack): denCameraTrack(start, glides, frames) superposes eased
// glides of tx, ty, ln dist, pitch, heading, ln tan(fov/2) and runs oceanShared's damped follower (CAM_STIFF /
// CAM_DAMP) over them; makeDenClock(start, glides, S_END, PRE) samples it on a story clock at full precision.
// AIR: fogAt(view, x, y, z) = the veil (0..FOG_MAX) between the eye and a world point through an exponential haze
// layer (dense near the ground, thin aloft: a top-down view from high sees the ground through little haze, a low
// oblique sees the far plains dissolve). airRgb = the haze colour (from droneSeaShared's SKY).
// ---------------------------------------------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF, camEase } from "../kits/cheeky-pint/oceanShared";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";

export const W = 1080;
export const H = 1920;
export const CX = 540;
export const CY = 960;
export const NEAR = 0.05; // miles

export type V3 = [number, number, number];
export type DenCam = { tx: number; ty: number; dist: number; pitch: number; heading: number; fov: number };
export type DenView = {
  cam: DenCam;
  eye: V3;
  r: V3;
  u: V3;
  f: V3;
  /** focal length, px */
  F: number;
  /** screen y of the horizon (no roll); -Infinity when looking straight down */
  horizonY: number;
  project: (x: number, y: number, z?: number) => { x: number; y: number; d: number } | null;
  /** px per mile for a length lying across the view at world point (x, y, z) */
  scaleAt: (x: number, y: number, z?: number) => number;
  /** the ground point under screen (sx, sy), or null above the horizon */
  unproject: (sx: number, sy: number) => { x: number; y: number } | null;
};

const D2R = Math.PI / 180;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number) => {
  const u = clamp01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const makeView = (cam: DenCam): DenView => {
  const h = cam.heading * D2R;
  const p = Math.min(89.999, Math.max(-10, cam.pitch)) * D2R;
  const sh = Math.sin(h);
  const ch = Math.cos(h);
  const sp = Math.sin(p);
  const cp = Math.cos(p);
  const f: V3 = [sh * cp, ch * cp, -sp];
  const r: V3 = [ch, -sh, 0];
  const u: V3 = [sh * sp, ch * sp, cp];
  const eye: V3 = [cam.tx - f[0] * cam.dist, cam.ty - f[1] * cam.dist, -f[2] * cam.dist];
  const F = CY / Math.tan((cam.fov * D2R) / 2);
  const horizonY = cam.pitch >= 89.999 ? -Infinity : CY - F * Math.tan(p);
  const project = (x: number, y: number, z = 0) => {
    const dx = x - eye[0];
    const dy = y - eye[1];
    const dz = z - eye[2];
    const d = dx * f[0] + dy * f[1] + dz * f[2];
    if (d <= NEAR) return null;
    const xc = dx * r[0] + dy * r[1];
    const yc = dx * u[0] + dy * u[1] + dz * u[2];
    return { x: CX + (F * xc) / d, y: CY - (F * yc) / d, d };
  };
  const scaleAt = (x: number, y: number, z = 0) => {
    const d = (x - eye[0]) * f[0] + (y - eye[1]) * f[1] + (z - eye[2]) * f[2];
    return d <= NEAR ? 0 : F / d;
  };
  const unproject = (sx: number, sy: number) => {
    const a = (sx - CX) / F;
    const b = -(sy - CY) / F;
    const dir: V3 = [f[0] + a * r[0] + b * u[0], f[1] + a * r[1] + b * u[1], f[2] + a * r[2] + b * u[2]];
    if (dir[2] >= -1e-9) return null;
    const t = -eye[2] / dir[2];
    return { x: eye[0] + t * dir[0], y: eye[1] + t * dir[1] };
  };
  return { cam, eye, r, u, f, F, horizonY, project, scaleAt, unproject };
};

// ---- the camera track: the kit's damped follower over the orbit parameters ------------------------------------
export type DenGlide = {
  f0: number;
  f1: number;
  /** target moves (miles) */
  dtx?: number;
  dty?: number;
  /** absolute values reached at f1 (each optional) */
  dist?: number;
  pitch?: number;
  heading?: number;
  fov?: number;
  warp?: number;
};
type Raw = { tx: number; ty: number; ld: number; pitch: number; heading: number; lf: number };
const toRaw = (c: DenCam): Raw => ({ tx: c.tx, ty: c.ty, ld: Math.log(c.dist), pitch: c.pitch, heading: c.heading, lf: Math.log(Math.tan((c.fov * D2R) / 2)) });
const fromRaw = (r: Raw): DenCam => ({ tx: r.tx, ty: r.ty, dist: Math.exp(r.ld), pitch: r.pitch, heading: r.heading, fov: (2 * Math.atan(Math.exp(r.lf))) / D2R });
const KEYS: (keyof Raw)[] = ["tx", "ty", "ld", "pitch", "heading", "lf"];

/** Superposed eased glides, then the damped follower (oceanShared CAM_STIFF / CAM_DAMP). Frames 0..frames+2. */
export const denCameraTrack = (start: DenCam, glides: DenGlide[], frames: number): DenCam[] => {
  const s0 = toRaw(start);
  const T: Raw[] = [];
  for (let fr = 0; fr <= frames + 2; fr++) {
    const t: Raw = { ...s0 };
    const prev: Raw = { ...s0 };
    for (const g of glides) {
      const e = camEase((fr - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
      t.tx += (g.dtx ?? 0) * e;
      t.ty += (g.dty ?? 0) * e;
      const abs: Partial<Raw> = {};
      if (g.dist !== undefined) abs.ld = Math.log(g.dist);
      if (g.pitch !== undefined) abs.pitch = g.pitch;
      if (g.heading !== undefined) abs.heading = g.heading;
      if (g.fov !== undefined) abs.lf = Math.log(Math.tan((g.fov * D2R) / 2));
      for (const k of ["ld", "pitch", "heading", "lf"] as const) {
        const v = abs[k];
        if (v !== undefined) {
          t[k] += (v - prev[k]) * e;
          prev[k] = v;
        }
      }
    }
    T.push(t);
  }
  const out: DenCam[] = [];
  let c: Raw = { ...T[0] };
  let vel: Raw = { tx: 0, ty: 0, ld: 0, pitch: 0, heading: 0, lf: 0 };
  for (let fr = 0; fr < T.length; fr++) {
    if (fr > 0) {
      const t = T[fr];
      const nv = { ...vel };
      const nc = { ...c };
      for (const k of KEYS) {
        nv[k] = vel[k] + (t[k] - c[k]) * CAM_STIFF - vel[k] * CAM_DAMP;
        nc[k] = c[k] + nv[k];
      }
      vel = nv;
      c = nc;
    }
    out.push(fromRaw(c));
  }
  return out;
};
/** A track on a story clock with a pre-roll (S 0 already moving if a glide starts before it), sampled continuously. */
export const makeDenClock = (start: DenCam, glides: DenGlide[], S_END: number, PRE = 40) => {
  const track = denCameraTrack(
    start,
    glides.map((g) => ({ ...g, f0: g.f0 + PRE, f1: g.f1 + PRE })),
    S_END + PRE + 4,
  ).slice(PRE);
  const at = (S: number): DenCam => {
    const a = Math.max(0, Math.min(track.length - 2, Math.floor(S)));
    const t = Math.max(0, Math.min(1, S - a));
    const A = toRaw(track[a]);
    const B = toRaw(track[a + 1]);
    const o = {} as Raw;
    for (const k of KEYS) o[k] = lerp(A[k], B[k], t);
    return fromRaw(o);
  };
  return { track, at };
};
/** Interpolate two cameras in the track's own space (log distance, log tan fov). */
export const mixCam = (a: DenCam, b: DenCam, t: number): DenCam => {
  const A = toRaw(a);
  const B = toRaw(b);
  const o = {} as Raw;
  for (const k of KEYS) o[k] = lerp(A[k], B[k], t);
  return fromRaw(o);
};

// ---- the air ------------------------------------------------------------------------------------------------------
/** The haze: extinction per mile at the ground, its scale height (miles), the veil's ceiling. */
export const AIR = { beta: 0.07, H: 1.3, max: 0.94 } as const;
export const FOG_MAX = AIR.max;
/** Mean haze density along a straight path between heights z0 and z1 (exponential layer). */
const meanDensity = (z0: number, z1: number) => {
  const a = Math.max(0, z0);
  const b = Math.max(0, z1);
  if (Math.abs(a - b) < 1e-4) return Math.exp(-a / AIR.H);
  return (AIR.H * (Math.exp(-Math.min(a, b) / AIR.H) - Math.exp(-Math.max(a, b) / AIR.H))) / Math.abs(a - b);
};
/** The veil (0..FOG_MAX) between the eye and a world point. */
export const fogAt = (v: DenView, x: number, y: number, z = 0, boost = 1) => {
  const L = Math.hypot(x - v.eye[0], y - v.eye[1], z - v.eye[2]);
  const tau = AIR.beta * boost * L * meanDensity(v.eye[2], z);
  return AIR.max * (1 - Math.exp(-tau));
};
/** The haze colour (RGB 0..255). Far, low air is the horizon's haze; a touch warmer/deeper in the near air. */
export type RGB = [number, number, number];
export const hexRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const rgbHex = (c: RGB) => `#${c.map((q) => Math.max(0, Math.min(255, Math.round(q))).toString(16).padStart(2, "0")).join("")}`;
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgbCss = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${Math.round(clamp01(a) * 1000) / 1000})`;
export const HAZE: RGB = hexRgb("#EFD6A8"); // between SKY.glow and SKY.haze: the air the plains dissolve into
export const HAZE_FAR: RGB = hexRgb(SKY.haze);
/** A colour seen through the air at a world point. */
export const fogRgb = (v: DenView, c: RGB, x: number, y: number, z = 0, boost = 1): RGB => mixRgb(c, HAZE, fogAt(v, x, y, z, boost));

// ---- the light ----------------------------------------------------------------------------------------------------
/** The low sun in the west (upper left of the default view): azimuth (deg from north, clockwise), elevation. */
export const SUN = { azimuth: 268, elevation: 14 } as const;
/** Unit vector toward the sun (world). */
export const SUN_DIR: V3 = (() => {
  const a = SUN.azimuth * D2R;
  const e = SUN.elevation * D2R;
  return [Math.sin(a) * Math.cos(e), Math.cos(a) * Math.cos(e), Math.sin(e)];
})();
/** Ground offset of a shadow cast from height z (miles): shadows fall away from the sun, softened (shortened) so a
 *  storm's shadow stays near its storm (the brief: to the lower right / east-north-east). */
export const shadowOffset = (z: number, shorten = 0.14): { x: number; y: number } => {
  const k = (z / Math.tan(SUN.elevation * D2R)) * shorten;
  const a = SUN.azimuth * D2R;
  return { x: -Math.sin(a) * k, y: -Math.cos(a) * k + 0.12 * z };
};
