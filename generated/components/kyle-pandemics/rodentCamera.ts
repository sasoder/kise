// ---------------------------------------------------------------------------
// rodentCamera: the one perspective camera, the disease's front and the figure plan of RodentFromCentralAsia
// (kyle-pandemics, cut 1). Pure data + maths (no React); the WebGL ground (rodentGround.tsx) and every SVG / canvas
// overlay use exactly these functions, so the map, the stain, the marmot, the label and the figures sit on one ground.
//
// THE WORLD: the baked map (rodentMapData.ts, LCC, world px) is the GROUND PLANE. 3D point (X, Y, Zm): X = map x
// (east), Y = height above the ground (up +), Zm = map y (south +; north recedes from the camera). The origin
// (75.5 E, 42.7 N, the Chuy valley by Issyk-Kul) is (0, 0, 0). Creatures are drawn at one symbolic scale: the marmot
// sits ~40 world px tall (~65 km), a European figure stands FIG_H (so at the continental view the marmot is a mark).
//
// THE CAMERA: a pinhole (focal F px, the frame's centre the principal point) aimed at a target T from a distance D,
// pitched down by `pitch`, yawed to the local north of the map at the target (LCC meridians converge on the pole:
// "the camera always looks north", so north-up stays readable everywhere) plus an arc offset that is only used
// round the marmot in the opening push-in (it returns to 0 before the map shows). One eased track: keys -> pchip (log D)
// -> the house damped follow (CAM_STIFF / CAM_DAMP), pre-rolled so f0 is already moving. One VP: the ground's
// receding lines meet on the horizon on the frame's centre line.
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip } from "../kits/maps/incaShared";
import { FIGS } from "./rodentMapData";
import { FIG_S } from "./rodentFrontData";
import { AWAY, HOLE, HOLE_RA, MARMOT, MOUND, MOUTH, POLE, RIGHT, RIVULETS, WELL, YAW0, local, moundY, northYaw } from "./rodentPlace";

export { AWAY, HOLE, HOLE_RA, MARMOT, MOUND, MOUTH, POLE, RIGHT, RIVULETS, WELL, YAW0, local, moundY, northYaw };

export const FPS = 30000 / 1001;
export const DURATION = 207;
export const W = 1080;
export const H = 1920;
/** focal length, px (vertical field ~72 deg) */
export const F = 1300;

export type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ---------------------------------------------------------------------------
// THE CAMERA TRACK
// ---------------------------------------------------------------------------
/** target (map x, height, map y), distance D, pitch (deg), the arc's yaw offset from local north (deg) */
export type CamKey = { f: number; tx: number; ty: number; tz: number; D: number; pitch: number; arc: number };
const K = (f: number, r: number, a: number, ty: number, D: number, pitch: number, arc = 0): CamKey => {
  const [tx, tz] = local(r, a);
  return { f, tx, ty, tz, D, pitch, arc };
};
const KM = (f: number, tx: number, tz: number, D: number, pitch: number): CamKey => ({ f, tx, ty: 0, tz, D, pitch, arc: 0 });
export const CAM_KEYS: CamKey[] = [
  // the push-in that arcs round the marmot (from its right toward the burrow mouth)
  K(0, 3, 5, 34, 100, 5, 30),
  K(44, 0, 0, 23, 86, 12, 13),
  // V3: the target a little higher and back (the marmot's taller V3 head keeps >= 80 px clear of the frame top)
  K(84, HOLE_RA[0], HOLE_RA[1], 11.2, 63, 23, -3),
  K(93, HOLE_RA[0] - 1, HOLE_RA[1] - 4, 8, 75, 25, -2),
  // the crane
  K(102, -9, -14, 1, 230, 28, 0),
  K(110, -14, -6, 0, 560, 32, 0),
  K(117, -40, 30, 0, 1020, 37, 0),
  K(125, -150, 90, 0, 1620, 41, 0),
  // west with the front, landing as a high oblique over the Mediterranean, looking north: Europe fills the height
  KM(146, -1900, 60, 2550, 63),
  KM(170, -3592, -106, 2350, 56.5),
  KM(206, -3622, -105, 2300, 57),
];

export type Cam = {
  /** the camera's position (3D) */
  C: V3;
  /** forward, right, up (unit) */
  f: V3;
  r: V3;
  u: V3;
  D: number;
  pitch: number;
  yaw: number;
  T: V3;
  arc: number;
};
export const camFrom = (tx: number, ty: number, tz: number, D: number, pitchDeg: number, arcDeg = 0): Cam => {
  const yaw = northYaw(tx, tz) + (arcDeg * Math.PI) / 180;
  const p = (pitchDeg * Math.PI) / 180;
  const f: V3 = [Math.sin(yaw) * Math.cos(p), -Math.sin(p), -Math.cos(yaw) * Math.cos(p)];
  const r: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const u = cross(r, f);
  const C: V3 = [tx - D * f[0], ty - D * f[1], tz - D * f[2]];
  return { C, f, r, u, D, pitch: pitchDeg, yaw, T: [tx, ty, tz], arc: arcDeg };
};
const PATH: Cam[] = (() => {
  const ch = [
    pchip(CAM_KEYS.map((q) => [q.f, q.tx] as [number, number])),
    pchip(CAM_KEYS.map((q) => [q.f, q.ty] as [number, number])),
    pchip(CAM_KEYS.map((q) => [q.f, q.tz] as [number, number])),
    pchip(CAM_KEYS.map((q) => [q.f, Math.log(q.D)] as [number, number])),
    pchip(CAM_KEYS.map((q) => [q.f, q.pitch] as [number, number])),
    pchip(CAM_KEYS.map((q) => [q.f, q.arc] as [number, number])),
  ];
  const target = (f: number) => ch.map((c) => c(f));
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = s.map(() => 0);
  const out: Cam[] = [];
  for (let fr = -PRE + 1; fr <= DURATION + 2; fr++) {
    const t = target(fr + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (fr >= 0) out.push(camFrom(s[0], s[1], s[2], Math.exp(s[3]), s[4], s[5]));
  }
  return out;
})();
/** the camera at frame f (fractional frames interpolate the track: sub-frame sampling for checks) */
export const camAt = (frame: number): Cam => {
  const i = Math.max(0, Math.min(PATH.length - 2, Math.floor(frame)));
  const t = Math.max(0, Math.min(1, frame - i));
  if (t === 0) return PATH[i];
  const a = PATH[i];
  const b = PATH[i + 1];
  const m = (x: number, y: number) => x + (y - x) * t;
  return camFrom(m(a.T[0], b.T[0]), m(a.T[1], b.T[1]), m(a.T[2], b.T[2]), Math.exp(m(Math.log(a.D), Math.log(b.D))), m(a.pitch, b.pitch), m(a.arc, b.arc));
};

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
/** camera height above the ground */
export const altitude = (cam: Cam) => cam.C[1];

// ---------------------------------------------------------------------------
// ATMOSPHERIC DEPTH (one function for the ground shader and every overlay): 0 near, toward 1 far
// ---------------------------------------------------------------------------
export const HAZE = { a: 1.1, b: 3.9, max: 0.85 };
export const hazeAt = (dist: number, D: number) => {
  const u = Math.max(0, Math.min(1, (dist / D - HAZE.a) / (HAZE.b - HAZE.a)));
  return HAZE.max * u * u * (3 - 2 * u);
};
/** the steppe -> map crossfade by camera distance: 1 = the steppe (grass, ground streaks), 0 = the map */
export const STEPPE = { d0: 420, d1: 1150 };
export const steppeAt = (D: number) => {
  const u = Math.max(0, Math.min(1, Math.log(D / STEPPE.d0) / Math.log(STEPPE.d1 / STEPPE.d0)));
  return 1 - u * u * (3 - 2 * u);
};

// ---------------------------------------------------------------------------
// THE FRONT: one field s(p) over the ground; the disease covers the land where s < reach(t), so it never retreats.
// Near the burrow s is the distance to the seep's pools (each offset so its pool opens when its rivulet reaches the
// ground), ragged by a self-similar noise; farther out it is the baked travel-time field (rodentFrontData /
// front.f32, scripts/clips/kyle-pandemics/bake-rodent-front.mjs): fast along the steppe corridor, the coasts and the
// big rivers, slow in the open sea, petering out irregularly south, north and east, with tongues from its noise.
// The ground shader computes the same; the figures' arrivals use the field at their sites (FIG_S).
// ---------------------------------------------------------------------------
/** the front's reach S(t): grows exponentially out of the pools, then runs at a constant speed V (softplus) */
export const REACH = { V: 49, tau: 6.5, t1: 119.4 };
export const reachAt = (t: number) => REACH.V * REACH.tau * Math.log1p(Math.exp((t - REACH.t1) / REACH.tau));
/** the frame the front reaches field value s */
export const arrivalOf = (s: number) => REACH.t1 + REACH.tau * Math.log(Math.expm1(s / (REACH.V * REACH.tau)));
/** each pool's offset: its rivulet's arrival frame as a field value */
export const POOL_OFF = RIVULETS.map((r) => reachAt(r.arrive));
/** where the near field hands over to the baked one (world px from the mouth) */
export const NEAR = { r0: 45, r1: 165, amp: 0.16 };

// ---------------------------------------------------------------------------
// THE FIGURES: the European field (FIGS), each with its arrival frame; exactly every second one falls
// ---------------------------------------------------------------------------
export const FIG_H = 290;
export const FALL = { delay: 1, dur: 9 };
export type Fig = { i: number; x: number; y: number; arrive: number; falls: boolean; variant: number; dir: -1 | 1; seed: number };
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const CAP_TOP = 1080;
const BANDS: [number, number][] = [
  [1080, 1250],
  [1360, 1460],
];
const inBand = (y: number) => BANDS.some(([a, b]) => y > a - 6 && y < b + 6);
/** a figure's head on screen (its top) at frame f */
const headScr = (cam: Cam, x: number, y: number) => {
  const feet = toScreen(cam, x, 0, y);
  return { y: feet.y - FIG_H * feet.s * 0.86, feetY: feet.y, x: feet.x };
};
export const FIGURES: Fig[] = (() => {
  // the sites whose head would sit in a caption band (or below the first band) at any frame from its arrival on
  // are left out; then, in the order the front reaches them, every second one falls (pairs: the one with fewer
  // fallen neighbours falls), so exactly half go down, spread evenly
  const keep = FIGS.map((p, i) => ({ i, x: p[0], y: p[1], arrive: arrivalOf(FIG_S[i]) })).filter((q) => {
    for (let f = Math.max(140, Math.floor(q.arrive) - 2); f < DURATION; f++) {
      const h = headScr(camAt(f), q.x, q.y);
      if (h.x < -60 || h.x > W + 60) continue;
      // the head standing, and lying (at the feet), stay above the first band
      if (inBand(h.y) || h.y > CAP_TOP - 6 || h.feetY > CAP_TOP - 6) return false;
    }
    return true;
  });
  keep.sort((a, b) => a.arrive - b.arrive);
  if (keep.length % 2) keep.pop(); // an even field: exactly half fall
  const out: Fig[] = keep.map((q) => ({ ...q, falls: false, variant: Math.floor(hash(q.i, 3) * 4), dir: hash(q.i, 5) < 0.5 ? -1 : 1, seed: q.i }));
  const spacing = 210;
  for (let k = 0; k + 1 < out.length; k += 2) {
    const deadNear = (q: Fig) => out.filter((o) => o.falls && Math.hypot(o.x - q.x, o.y - q.y) < spacing * 1.6).length;
    const a = out[k];
    const b = out[k + 1];
    const da = deadNear(a);
    const db = deadNear(b);
    if (da < db || (da === db && (k / 2) % 2 === 0)) a.falls = true;
    else b.falls = true;
  }
  return out;
})();
/** a figure's fall at frame f: 0 standing .. 1 lying (gravity: slow off the vertical, fast to the ground) */
export const fallAt = (q: Fig, f: number) => {
  if (!q.falls) return 0;
  const u = Math.max(0, Math.min(1, (f - q.arrive - FALL.delay) / FALL.dur));
  return u * u;
};
