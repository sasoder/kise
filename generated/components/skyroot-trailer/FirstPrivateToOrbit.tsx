// ---------------------------------------------------------------------------
// FirstPrivateToOrbit (skyroot-trailer, cut 4). Core Memory podcast style, the ARCHIVE COLLAGE at 16:9 (the Pushp /
// Mikkel trailer look, on ./skyrootShared). Opaque 2048x1080, 23.976 fps, 76 frames; finals --scale 2 (4096x2160).
//
// CHECK LINE: Skyroot's own rocket lifted off from India and went all the way round into orbit — the trail that leaves
// the Indian coast closes into an orbit around the Earth.
//
// THE LINE: "We have launched India's first private rocket to orbit."
// WORD -> FRAME: have 1 · launched 3 · India's 10 · first 18 · private 26 · rocket 48 · to 59 · orbit 63 · speech ends ~69.
// DURATION: the slot 4.379 -> 7.549 s (sequence f105-f181) = 3.170 s x 23.976 = 76 frames (f0..f75). Before: the speaker
// on camera; after (f76): the minimal news card "45 days ago".
//
// THE MOTION: one continuous crane-up and pull-back over ONE 3D scene, projected orthographically: the b&w photo Earth
// (a sphere re-projected per frame from the NASA EPIC full disc), the rocket's path (a 3D curve: the climb from the pad,
// then a circular orbit round the Earth's centre) and its white exhaust trail, drawn by the nozzle. At f0 the camera
// looks along the horizon from the south: the globe is huge, its limb across the lower frame, Vikram-1 (b&w cut-out,
// hard shadow, ~540 px, wholly above the caption bands) standing on Sriharikota at the top of the limb. It lifts on "launched" (f3), climbs and pitches
// over east (screen right) while the camera rises over the globe and pulls back (one log-zoom and one tilt, each a
// smoothed key track creeping from f0), then swings a little round the Earth's axis as it settles: India comes to face
// us just left of centre and the globe resolves into the whole disc (radius ~290, centre ~(1024, 350), its lower edge
// crossing the first caption band). The destination orbit is there before the rocket: a DASHED ring (a planned path,
// thinner and lighter than the trail) drawn on by a tip running once round it f8-f34, front half over the globe, back
// half behind it. The rocket leads its own solid trail: it climbs, pitches over and merges tangentially into the ring's
// crest (~f21), then flies on along it at a calm ~4-5 px/f, nose on the ring, its trail overwriting the dashes. On
// "orbit" (f63) it is on the orbit, flying, in front of the globe on the upper arc, and its solid trail (the climb arc
// and the orbit flown) takes the chain crown: three touching thin stripes stepping up out of its upper side. f63-f75:
// it flies on, the globe turning a hair, film life on.
// CHAIN = SKYROOT'S OWN (skyrootShared legend): here the crown on Skyroot's own trail into orbit, once, on "orbit".
//
// SOURCES: FACTS.txt (animation_source/assets): Vikram-1's first flight ("Mission Aagaman") lifted off 18 Jul 2026 from the
// First Launch Pad, Satish Dhawan Space Centre, Sriharikota (India's east coast; pad ~13.72 N 80.23 E), reached a ~450 km
// LEO at 60 deg on the first attempt (ISRO; Al Jazeera; Space.com; SpaceNews; Bloomberg; Wikipedia "Vikram-1"). The orbit
// here is collage scale (radius 2.15 Earth radii so it reads; the real one is 1.07) and is not a real ground track.
// Earth: NASA DSCOVR EPIC natural-colour full disc, 28 Mar 2024 07:15 UTC, centroid 11.2 N 74.8 E (public domain; NASA
// EPIC Team; animation_source/assets/earth_india_disc.png). Rocket: skyrootShared VIKRAM1 (ISRO photo of the flight
// vehicle on the pad, GODL-India).
// ---------------------------------------------------------------------------
import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CHAIN, CaptionBands, EARTH, H, INK, RocketCutOut, SHADOW, SKYROOT_FILTER, SkyrootFilmLife, SkyrootPaper, VIKRAM1, W, chainProgress, clamp } from "./skyrootShared";

export const FPS = 24000 / 1001;
export const DURATION = 76;
export const schema = z.object({ bands: z.boolean().default(false), debug: z.boolean().default(false) });
export const defaultProps = schema.parse({});

// -- assets (skyrootShared) -----------------------------------------------------------------------------------------------
/** The EPIC disc as a texture: px of the disc centre and radius in earth_india.png, and the view centroid (north up). */
const TEX = { src: EARTH.src, cx: EARTH.cx * EARTH.size, cy: EARTH.cy * EARTH.size, r: EARTH.r * EARTH.size, lat0: 11.2, lon0: 74.8 };

// -- 3D ---------------------------------------------------------------------------------------------------------------
type V3 = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));

/** The EPIC frame E: the Earth's centre at the origin, radius 1; z toward EPIC's camera, x right, y up (north up). */
export const geoE = (lat: number, lon: number): V3 => {
  const p = rad(lat);
  const p0 = rad(TEX.lat0);
  const dl = rad(lon - TEX.lon0);
  return [Math.cos(p) * Math.sin(dl), Math.sin(p) * Math.cos(p0) - Math.cos(p) * Math.sin(p0) * Math.cos(dl), Math.sin(p) * Math.sin(p0) + Math.cos(p) * Math.cos(p0) * Math.cos(dl)];
};
/** The First Launch Pad, SDSC-SHAR, Sriharikota. */
export const PAD = geoE(13.72, 80.23);
const NORTH: V3 = [0, Math.cos(rad(TEX.lat0)), Math.sin(rad(TEX.lat0))];

// -- tracks: coarse keys, linearly interpolated, box-smoothed per frame at module load (EighteenHundredCloser's helper)
const PRE = 40;
const POST = 40;
const track = (keys: [number, number][], win: number) => {
  const F = keys.map((k) => k[0]);
  const V = keys.map((k) => k[1]);
  const raw: number[] = [];
  for (let f = -PRE - win; f <= DURATION + POST + win; f++) raw.push(interpolate(f, F, V, clamp));
  const out: number[] = [];
  for (let f = -PRE; f <= DURATION + POST; f++) {
    let s = 0;
    for (let i = -win; i <= win; i++) s += raw[f + PRE + win + i];
    out.push(s / (2 * win + 1));
  }
  return (f: number) => {
    const c = Math.max(-PRE, Math.min(DURATION + POST, f)) + PRE;
    const a = Math.floor(c);
    const b = Math.min(a + 1, out.length - 1);
    return out[a] + (out[b] - out[a]) * (c - a);
  };
};

// -- the camera -------------------------------------------------------------------------------------------------------
/** Earth's radius on screen at f0 and at the resolved frame. */
export const RS0 = 1500;
export const R_END = 295;
const U_END = Math.log(RS0 / R_END);
/** u = ln(RS0 / Rs): the log of the pull-back, creeping from f0, settled by ~f56, a creep after. */
const U = track(
  [
    [-40, -0.1],
    [0, 0],
    [6, 0.12],
    [12, 0.5],
    [18, 1.0],
    [24, 1.3],
    [32, 1.5],
    [42, U_END],
    [75, U_END + 0.03],
    [116, U_END + 0.06],
  ],
  4,
);
/** The camera's tilt: 81 deg = looking along the horizon from the south (the pad on the limb), 0 = EPIC's own view. */
const TAU = track(
  [
    [-40, 82],
    [0, 81],
    [6, 79],
    [14, 62],
    [22, 32],
    [29, 11],
    [36, 2.5],
    [50, 0.5],
    [116, -1.5],
  ],
  4,
);
/** The roll that stands the pad at 12 o'clock at f0; none at the end. */
const ROLL = (tau: number) => {
  const c = Math.cos(rad(tau));
  const s = Math.sin(rad(tau));
  const py = PAD[1] * c + PAD[2] * s;
  return (Math.atan2(PAD[0], py) * 180) / Math.PI * Math.min(1, tau / 60);
};
/** The globe's own turn about its axis (texture only: the orbit and the trail are in space): a hair, eastward. */
const SPIN_PER_F = 0.03; // degrees per frame
/** The camera's swing round the Earth's axis as it settles (deg about E's y; none through the lift-off): India slides a
 *  little left of the disc's centre, so the climb from the coast has room to arc east into the orbit's crest and the
 *  rocket has the crest's gentle stretch to fly along. */
export const YAW_END = -20;
const YAW = (f: number) => {
  const t = Math.max(0, Math.min(1, (f - 16) / 30));
  return YAW_END * t * t * (3 - 2 * t);
};

/** The focus: Q (view coords, Earth radii, y up) sits at screen point S. Q moves from the rocket on the pad to just
 *  below the globe's centre, so the globe centre lands at (1024, ~400). */
const QX = track(
  [
    [-40, 0],
    [0, 0],
    [20, 0.08],
    [32, 0.1],
    [44, 0],
    [116, 0],
  ],
  4,
);
const QY = track(
  [
    [-40, 1.02],
    [0, 1.02],
    [8, 1.06],
    [14, 1.55],
    [20, 1.6],
    [27, 0.3],
    [32, -0.45],
    [38, -0.62],
    [44, -0.66],
    [116, -0.66],
  ],
  4,
);
const S = { x: W / 2, y: 540 };

type Mat = [V3, V3, V3]; // rows
const matVec = (m: Mat, v: V3): V3 => [dot(m[0], v), dot(m[1], v), dot(m[2], v)];
const matMul = (a: Mat, b: Mat): Mat => {
  const bt: Mat = [
    [b[0][0], b[1][0], b[2][0]],
    [b[0][1], b[1][1], b[2][1]],
    [b[0][2], b[1][2], b[2][2]],
  ];
  return a.map((r) => [dot(r, bt[0]), dot(r, bt[1]), dot(r, bt[2])]) as Mat;
};
const transpose = (m: Mat): Mat => [
  [m[0][0], m[1][0], m[2][0]],
  [m[0][1], m[1][1], m[2][1]],
  [m[0][2], m[1][2], m[2][2]],
];
const rotX = (deg: number): Mat => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [
    [1, 0, 0],
    [0, c, s],
    [0, -s, c],
  ];
};
const rotY = (deg: number): Mat => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [
    [c, 0, s],
    [0, 1, 0],
    [-s, 0, c],
  ];
};
const rotZ = (deg: number): Mat => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1],
  ];
};
/** Rotation about an axis (Rodrigues), as a matrix. */
const rotAxis = (a: V3, deg: number): Mat => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  const t = 1 - c;
  const [x, y, zz] = a;
  return [
    [t * x * x + c, t * x * y - s * zz, t * x * zz + s * y],
    [t * x * y + s * zz, t * y * y + c, t * y * zz - s * x],
    [t * x * zz - s * y, t * y * zz + s * x, t * zz * zz + c],
  ];
};

export const camAt = (f: number, qOverride?: { x: number; y: number }) => {
  const u = U(f);
  const Rs = RS0 * Math.exp(-u);
  const tau = TAU(f);
  const roll = ROLL(tau);
  const yaw = YAW(f);
  const M = matMul(matMul(rotZ(roll), rotX(tau)), rotY(yaw)); // E -> view
  const qx = qOverride ? qOverride.x : QX(f);
  const qy = qOverride ? qOverride.y : QY(f);
  const C = { x: S.x - Rs * qx, y: S.y + Rs * qy };
  const toView = (p: V3) => matVec(M, p);
  const toScreen = (p: V3) => {
    const v = matVec(M, p);
    return { x: C.x + Rs * v[0], y: C.y - Rs * v[1], z: v[2] };
  };
  return { u, p: Math.max(0, Math.min(1, u / U_END)), Rs, tau, roll, M, C, toView, toScreen, spin: SPIN_PER_F * f };
};

// -- the path (static, in space) ------------------------------------------------------------------------------------------
/** The orbit: a circle of radius RHO round the Earth's centre, tilted so the resolved frame shows a wide ellipse, its
 *  major axis rising a little to the right, the UPPER arc in front of the globe (the lower arc passes behind it). */
export const RHO = 2.15;
/** The ring as the RESOLVED camera sees it (after the swing): wide, tilted a hair (rising to the left), the upper arc in
 *  front of the globe; then turned back into E. */
const ORBIT_N_END = norm([-0.03, 0.9, -0.33]);
const A_END = norm(sub([1, 0, 0], mul(ORBIT_N_END, dot([1, 0, 0], ORBIT_N_END))));
let B_END = cross(ORBIT_N_END, A_END);
// travel clockwise on screen in the resolved view: x dy - y dx < 0 (y up)
if (A_END[0] * B_END[1] - A_END[1] * B_END[0] > 0) B_END = mul(B_END, -1);
const UNYAW = rotY(-YAW_END);
const ORBIT_A = matVec(UNYAW, A_END);
const ORBIT_B = matVec(UNYAW, B_END);
const orbitPt = (th: number): V3 => mul(add(mul(ORBIT_A, Math.cos(th)), mul(ORBIT_B, Math.sin(th))), RHO);
const orbitTan = (th: number): V3 => norm(add(mul(ORBIT_A, -Math.sin(th)), mul(ORBIT_B, Math.cos(th))));
/** Where the climb joins the orbit: the TOP of the resolved ellipse (max y in the E view, where its tangent is level):
 *  the climb can rise from India and turn right into it without a hook. */
const TH_J = (() => {
  let best = 0;
  let by = -1e9;
  for (let i = 0; i < 7200; i++) {
    const th = (i / 7200) * 2 * Math.PI;
    const p = orbitPt(th);
    if (p[1] > by) {
      by = p[1];
      best = th;
    }
  }
  return best;
})();
export const J = orbitPt(TH_J);
const TJ = orbitTan(TH_J);
/** The climb: a cubic Hermite from the pad (leaving radially, upright: mostly +z, toward EPIC's camera) to J (arriving
 *  along the orbit, level in the E view). The views turn about the screen x axis, so x (east) is shared by every view:
 *  x rises late and monotonically (the pitch-over east), z early (the climb), y in the middle (the rise in the E view). */
const CLIMB_OUT = 0.7; // the start tangent's length (radial)
const CLIMB_IN = 1.6; // the end tangent's length (along the orbit)
const CB: V3[] = [PAD, mul(PAD, 1 + CLIMB_OUT / 3), sub(J, mul(TJ, CLIMB_IN / 3)), J];
const bez = (t: number): V3 => {
  const w = [(1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3];
  return [0, 1, 2].map((i) => w.reduce((a, wk, k) => a + wk * CB[k][i], 0)) as V3;
};
/** The path as a dense polyline with cumulative arc length: the climb, then 1.3 laps from J. */
const PATH: V3[] = [];
const PATH_S: number[] = [];
{
  const N_CLIMB = 600;
  for (let i = 0; i <= N_CLIMB; i++) PATH.push(bez(i / N_CLIMB));
  const N_LAP = 1800;
  const sign = Math.sign(dot(TJ, orbitTan(TH_J + 1e-3))) >= 0 ? 1 : -1;
  for (let i = 1; i <= N_LAP * 1.3; i++) PATH.push(orbitPt(TH_J + sign * (i / N_LAP) * 2 * Math.PI));
  let s = 0;
  PATH_S.push(0);
  for (let i = 1; i < PATH.length; i++) {
    s += Math.hypot(...sub(PATH[i], PATH[i - 1]));
    PATH_S.push(s);
  }
}
export const S_J = PATH_S[600];
/** Arc length at which the lap closes (back at J). */
export const S_CLOSE = S_J + 2 * Math.PI * RHO;
/** The path samples with their arc length (checks and plots). */
export const pathPoints = () => PATH.map((p, i) => ({ p, s: PATH_S[i] }));
const idxAt = (s: number) => {
  let lo = 0;
  let hi = PATH_S.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (PATH_S[m] <= s) lo = m;
    else hi = m;
  }
  return lo;
};
export const pathAt = (s: number) => {
  const i = Math.min(idxAt(s), PATH.length - 2);
  const t = Math.max(0, Math.min(1, (s - PATH_S[i]) / (PATH_S[i + 1] - PATH_S[i])));
  const p = add(PATH[i], mul(sub(PATH[i + 1], PATH[i]), t));
  // tangent from a short chord (smooth at the sample scale)
  const a = PATH[Math.max(0, i - 2)];
  const b = PATH[Math.min(PATH.length - 1, i + 3)];
  return { p, t: norm(sub(b, a)), i };
};

// -- the rocket's travel (arc length along the path) and the dashed ring's drawing tip ----- -------------------------------------------
/** The rocket: still at f0, lifting on "launched" (f3), up to the lift-off pace V1 (screen px/f, world speed ~ 1/Rs while
 *  the camera pulls back), then from DEC0 it eases into its orbit and from DEC1 flies on at a calm GLIDE_PX, along the
 *  crest of the near (upper) arc, always in view in front of the globe. */
const V1 = 93.2; // screen px per frame, the lift-off pace (v5's, kept)
const DEC0 = 13;
const DEC1 = 24;
export const GLIDE_PX = 4.5; // screen px per frame once in orbit
const ss = (t: number) => t * t * (3 - 2 * t);
const c01 = (t: number) => Math.max(0, Math.min(1, t));
const RsAt = (f: number) => RS0 * Math.exp(-U(f));
const SUB = 20;
const ROCKET_TABLE = (() => {
  const v = (f: number) => {
    const acc = ss(c01(f / 12));
    const dec = ss(c01((f - DEC0) / (DEC1 - DEC0)));
    return (V1 * acc * (1 - dec) + GLIDE_PX * dec) / RsAt(f);
  };
  const table: number[] = [0];
  for (let f = 1; f <= DURATION + 2; f++) {
    let a = 0;
    for (let i = 0; i < SUB; i++) a += v(f - 1 + (i + 0.5) / SUB) / SUB;
    table.push(table[f - 1] + a);
  }
  return table;
})();
const lerpTable = (table: number[], f: number) => {
  const c = Math.max(0, Math.min(table.length - 1, f));
  const a = Math.floor(c);
  const b = Math.min(a + 1, table.length - 1);
  return table[a] + (table[b] - table[a]) * (c - a);
};
export const sAt = (f: number) => lerpTable(ROCKET_TABLE, f);
/** The planned orbit: a DASHED ring, drawn on ahead of time by a tip running once round it from J at a constant
 *  angular speed, RING_F0 to RING_F1 (front half over the globe, back half behind it), so it is there before the rocket
 *  arrives. Dashes sit at fixed places on the ring (they never crawl as the camera pulls back). */
const RING_F0 = 8;
const RING_F1 = 34;
export const ringTipAt = (f: number) => 2 * Math.PI * c01((f - RING_F0) / (RING_F1 - RING_F0)); // radians past J
const DASH_PERIOD_PX = 38; // dash + gap, measured along the ring as the resolved camera sees it (even there)
const DASH_ON = 0.58; // the dash's share of a period


// -- the rocket on screen ----------------------------------------------------------------------------------------------------
export const L0 = 545; // rocket length on screen at f0
export const L_POW = 0.44; // it shrinks slower than the Earth (collage scale): L = L0 (Rs/RS0)^L_POW
/** The projected tangent (screen, unit) of the path at frame f, as the camera sees it then. */
const screenDir = (f: number) => {
  const cam = camAt(f);
  const s = sAt(f);
  const tv = cam.toView(pathAt(s).t);
  const l = Math.hypot(tv[0], tv[1]);
  const tx = tv[0] / l;
  const ty = -tv[1] / l;
  // once the orbit line is drawn ahead of it, the rocket lies along the CHORD to the path point a rocket length ahead
  // (its nose on the line, not overshooting the curve)
  const w = ss(c01((f - CHORD_F0) / 8));
  if (w <= 0) return { x: tx, y: ty, l };
  const L = L0 * Math.pow(cam.Rs / RS0, L_POW);
  const b = cam.toScreen(pathAt(s).p);
  let s2 = s + L / (cam.Rs * Math.max(0.05, l));
  let q = cam.toScreen(pathAt(s2).p);
  s2 = s + (s2 - s) * (L / Math.max(1, Math.hypot(q.x - b.x, q.y - b.y)));
  q = cam.toScreen(pathAt(s2).p);
  const cl = Math.hypot(q.x - b.x, q.y - b.y);
  const x = tx * (1 - w) + ((q.x - b.x) / cl) * w;
  const y = ty * (1 - w) + ((q.y - b.y) / cl) * w;
  const n = Math.hypot(x, y);
  return { x: x / n, y: y / n, l };
};
/** The rocket's heading: the projected tangent (from CHORD_F0 the chord) averaged over +-3 frames (a rigid body swings
 *  round the curve instead of snapping); its nozzle stays exactly on the path. */
const CHORD_F0 = 18;
const ROT_W = [1, 2, 3, 4, 3, 2, 1];
export const rocketAt = (f: number) => {
  const cam = camAt(f);
  const s = sAt(f);
  const { p } = pathAt(s);
  const base = cam.toScreen(p);
  let ax = 0;
  let ay = 0;
  ROT_W.forEach((w, i) => {
    const d = screenDir(Math.max(0, f + i - 3));
    ax += w * d.x;
    ay += w * d.y;
  });
  const dl = screenDir(f).l;
  const ux = ax / Math.hypot(ax, ay);
  const uy = ay / Math.hypot(ax, ay);
  const L = L0 * Math.pow(cam.Rs / RS0, L_POW);
  const rot = (Math.atan2(ux, -uy) * 180) / Math.PI; // CSS deg clockwise from nose-up
  const nose = { x: base.x + ux * L, y: base.y + uy * L };
  return { cam, s, base, nose, ux, uy, L, wpx: L * VIKRAM1.bodyW * (VIKRAM1.w / VIKRAM1.h) / (VIKRAM1.baseY - VIKRAM1.noseY), rot, z: base.z, dirLen: dl };
};

// -- the globe: a sphere re-projected per frame from the EPIC disc (canvas, grey, mip-mapped) ----------------------------
type Level = { w: number; h: number; data: Float32Array };
let texPromise: Promise<Level[]> | null = null;
const loadTexture = () => {
  if (!texPromise) {
    texPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("no 2d context"));
        ctx.drawImage(img, 0, 0);
        const src = ctx.getImageData(0, 0, c.width, c.height).data;
        const w0 = c.width;
        const h0 = c.height;
        const l0 = new Float32Array(w0 * h0);
        for (let i = 0; i < w0 * h0; i++) l0[i] = 0.2126 * src[i * 4] + 0.7152 * src[i * 4 + 1] + 0.0722 * src[i * 4 + 2];
        const levels: Level[] = [{ w: w0, h: h0, data: l0 }];
        while (levels[levels.length - 1].w > 64) {
          const p = levels[levels.length - 1];
          const w = p.w >> 1;
          const h = p.h >> 1;
          const d = new Float32Array(w * h);
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              const i = 2 * y * p.w + 2 * x;
              d[y * w + x] = 0.25 * (p.data[i] + p.data[i + 1] + p.data[i + p.w] + p.data[i + p.w + 1]);
            }
          levels.push({ w, h, data: d });
        }
        resolve(levels);
      };
      img.onerror = () => reject(new Error(`could not load ${TEX.src}`));
      img.src = staticFile(TEX.src);
    });
  }
  return texPromise;
};
const sampleLevel = (lv: Level, x: number, y: number) => {
  const xf = Math.max(0, Math.min(lv.w - 1.001, x - 0.5));
  const yf = Math.max(0, Math.min(lv.h - 1.001, y - 0.5));
  const x0 = xf | 0;
  const y0 = yf | 0;
  const fx = xf - x0;
  const fy = yf - y0;
  const i = y0 * lv.w + x0;
  const d = lv.data;
  return (d[i] * (1 - fx) + d[i + 1] * fx) * (1 - fy) + (d[i + lv.w] * (1 - fx) + d[i + lv.w + 1] * fx) * fy;
};
/** Inset of the texture radius so the EPIC disc's dark space never bleeds in at the limb. */
const TEX_R = TEX.r * 0.985;

const Globe: React.FC<{ frame: number }> = ({ frame }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [levels, setLevels] = useState<Level[] | null>(null);
  const [handle] = useState(() => delayRender("EPIC texture"));
  const done = useRef(false);
  useLayoutEffect(() => {
    let live = true;
    loadTexture()
      .then((l) => {
        if (live) setLevels(l);
      })
      .catch((e) => cancelRender(e));
    return () => {
      live = false;
    };
  }, []);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const cw = Math.round(W * dpr);
  const chh = Math.round(H * dpr);
  useLayoutEffect(() => {
    if (!levels || !ref.current) return;
    const cam = camAt(frame);
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(cw, chh);
    const out = img.data;
    const Rd = cam.Rs * dpr; // radius in device px
    const cx = cam.C.x * dpr;
    const cy = cam.C.y * dpr;
    // view -> texture frame: E = M^T v, then undo the globe's spin about its axis
    const Mt = matMul(rotAxis(NORTH, -cam.spin), transpose(cam.M));
    const lvF = Math.max(0, Math.log2(TEX_R / Rd));
    const lA = Math.min(levels.length - 1, Math.floor(lvF));
    const lB = Math.min(levels.length - 1, lA + 1);
    const mix = lA === lB ? 0 : lvF - lA;
    const sA = 1 / 2 ** lA;
    const sB = 1 / 2 ** lB;
    const x0 = Math.max(0, Math.floor(cx - Rd - 2));
    const x1 = Math.min(cw - 1, Math.ceil(cx + Rd + 2));
    const y0 = Math.max(0, Math.floor(cy - Rd - 2));
    const y1 = Math.min(chh - 1, Math.ceil(cy + Rd + 2));
    for (let j = y0; j <= y1; j++) {
      const vy = -(j + 0.5 - cy) / Rd;
      for (let i = x0; i <= x1; i++) {
        const vx = (i + 0.5 - cx) / Rd;
        const d2 = vx * vx + vy * vy;
        const d = Math.sqrt(d2);
        const cov = Math.max(0, Math.min(1, (1 - d) * Rd + 0.5));
        if (cov <= 0) continue;
        const vz = Math.sqrt(Math.max(0, 1 - d2));
        const ex = Mt[0][0] * vx + Mt[0][1] * vy + Mt[0][2] * vz;
        const ey = Mt[1][0] * vx + Mt[1][1] * vy + Mt[1][2] * vz;
        const tx = TEX.cx + ex * TEX_R;
        const ty = TEX.cy - ey * TEX_R;
        let L = sampleLevel(levels[lA], tx * sA, ty * sA);
        if (mix > 0) L = L * (1 - mix) + sampleLevel(levels[lB], tx * sB, ty * sB) * mix;
        const o = (j * cw + i) * 4;
        out[o] = L;
        out[o + 1] = L;
        out[o + 2] = L;
        out[o + 3] = cov * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [levels, frame, cw, chh, dpr, handle]);
  return <canvas ref={ref} width={cw} height={chh} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, filter: SKYROOT_FILTER }} />;
};

// -- the trail ------------------------------------------------------------------------------------------------------------
/** The trail: a little over half the body's width, never under 11 px (chunky at phone size). */
const trailWidth = (L: number) => Math.max(11, (0.6 * L * VIKRAM1.bodyW * VIKRAM1.w) / VIKRAM1.h);
const TRAIL_SHADOW = 5;

type Run = { front: boolean; pts: { x: number; y: number }[] };
export const trailRuns = (f: number, sFrom = 0): Run[] => {
  const r = rocketAt(f);
  const cam = r.cam;
  const sEnd = r.s;
  const iEnd = idxAt(sEnd);
  const runs: Run[] = [];
  let cur: Run | null = null;
  const step = 2;
  for (let i = idxAt(sFrom); i <= iEnd + 1; i += i < iEnd - 1 ? step : 1) {
    const p = i > iEnd ? pathAt(sEnd).p : PATH[i];
    const q = cam.toScreen(p);
    const front = q.z >= 0;
    if (!cur || cur.front !== front) {
      const prev: { x: number; y: number } | null = cur ? cur.pts[cur.pts.length - 1] : null;
      cur = { front, pts: prev ? [prev] : [] };
      runs.push(cur);
    }
    cur.pts.push({ x: q.x, y: q.y });
  }
  return runs;
};

/** An evenodd path: everything outside the circle (cx, cy, r). */
const outsideCircle = (cx: number, cy: number, r: number) => `M-4000 -4000 H6000 V6000 H-4000 Z M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} Z`;
const runsPath = (runs: Run[]) => runs.map((x) => "M" + x.pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")).join(" ");
/** The trail in two layers: the part behind the globe (under it) and the part in front (over it). The front layer
 *  repeats the back part's white outside the disc over the front part's shadow, so where the trail passes from behind
 *  to in front (the ellipse's ends) no black cap shows across the white. */
const Trail: React.FC<{ frame: number; front: boolean }> = ({ frame, front }) => {
  const clipId = `orbit-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const r = rocketAt(frame);
  if (r.s <= 1e-4) return null;
  const w = trailWidth(r.L);
  const all = trailRuns(frame).filter((x) => x.pts.length > 1);
  const mine = all.filter((x) => x.front === front);
  if (!mine.length) return null;
  const d = runsPath(mine);
  // the crown's copies start part way up the climb: at the foot the shifted copies would peek out beside the pad
  const crownD = runsPath(trailRuns(frame, CROWN_FROM * S_J).filter((x) => x.front && x.pts.length > 1));
  const back = front ? all.filter((x) => !x.front) : [];
  const C = r.cam.C;
  const stroke = { fill: "none", strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {back.length ? (
        <defs>
          {[0, globeShadowOff(r.cam.Rs)].map((o, i) => (
            <clipPath key={o} id={`${clipId}-${i}`}>
              <path clipRule="evenodd" d={outsideCircle(C.x + o, C.y + o, r.cam.Rs + 0.5)} />
            </clipPath>
          ))}
        </defs>
      ) : null}
      {front
        ? chainProgress(frame, CROWN_START, { travel: CROWN_TRAVEL, stagger: 1 }).map((p, i) =>
            p > 0 ? <path key={CHAIN[i]} d={crownD} transform={`translate(0 ${-(3 - i) * CROWN_STEP_PX * p})`} stroke={CHAIN[i]} {...stroke} /> : null,
          )
        : null}
      <path d={d} transform={`translate(${TRAIL_SHADOW} ${TRAIL_SHADOW})`} stroke={SHADOW} {...stroke} />
      {back.length ? (
        <g clipPath={`url(#${clipId}-1)`}>
          <path d={runsPath(back)} stroke={INK} clipPath={`url(#${clipId}-0)`} {...stroke} />
        </g>
      ) : null}
      <path d={d} stroke={INK} {...stroke} />
    </svg>
  );
};

// -- the chain: on the rocket's own solid trail ------------------------------------------------------------------------------
/** The chain crown (SKYROOT'S OWN), once, on "orbit": the solid trail (the climb arc and the orbit flown so far) takes
 *  it as a thin arch does: three touching thin stripes stepping UP out of its upper side, orange outermost, then purple,
 *  blue and the white trail, opening f59-f66 and staying (they grow with the trail as the rocket flies on). */
const CROWN_START = 59;
const CROWN_TRAVEL = 5;
const CROWN_STEP_PX = 7; // per colour: ~1.6 px each at 480 px wide
const CROWN_FROM = 0.3; // the crowned trail starts this far up the climb (a fraction of it)

// -- the rocket -------------------------------------------------------------------------------------------------------------
const Rocket: React.FC<{ frame: number }> = ({ frame }) => {
  const r = rocketAt(frame);
  const sh = interpolate(r.L, [260, 545], [5, 6], clamp);
  return <RocketCutOut rocket={VIKRAM1} x={r.base.x} y={r.base.y} height={r.L} rot={r.rot} pivot={0} shadow={sh} />;
};

// -- the dashed ring (the planned orbit) --------------------------------------------------------------------------------
const DASH_W = 7;
const DASH_SHADOW = 3;
const DASH_OP = 0.85; // a planned path: lighter than the flown trail (OP_MID read too faint at phone size)
type Dash = { front: boolean; pts: string };
/** The dashes' places on the ring (radians past J), spaced evenly along the ring as the RESOLVED camera sees it, so the
 *  settled frame shows an even dashed ellipse (no squashed dashes at its ends); fixed to the ring for every camera. */
const DASHES: [number, number][] = (() => {
  const cam = camAt(DURATION - 1);
  const n = 4000;
  const th: number[] = [];
  const len: number[] = [0];
  let prev = cam.toScreen(orbitPt(TH_J));
  th.push(0);
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const q = cam.toScreen(orbitPt(TH_J + a));
    len.push(len[i - 1] + Math.hypot(q.x - prev.x, q.y - prev.y));
    th.push(a);
    prev = q;
  }
  const total = len[n];
  const count = Math.round(total / DASH_PERIOD_PX);
  const at = (l: number) => {
    let i = 0;
    while (i < n && len[i + 1] < l) i++;
    const u = (l - len[i]) / Math.max(1e-9, len[i + 1] - len[i]);
    return th[i] + (th[i + 1] - th[i]) * u;
  };
  const out: [number, number][] = [];
  for (let k = 0; k < count; k++) out.push([at((k * total) / count), at(((k + DASH_ON) * total) / count)]);
  return out;
})();
export const ringDashes = (f: number): Dash[] => {
  const cam = camAt(f);
  const tip = ringTipAt(f);
  const out: Dash[] = [];
  for (const [a, b0] of DASHES) {
    if (a >= tip) break;
    const b = Math.min(tip, b0);
    const pts: string[] = [];
    const n = 5;
    let zMid = 0;
    for (let k = 0; k <= n; k++) {
      const th = TH_J + a + ((b - a) * k) / n;
      const q = cam.toScreen(orbitPt(th));
      if (k === Math.floor(n / 2)) zMid = q.z;
      pts.push(`${q.x.toFixed(2)} ${q.y.toFixed(2)}`);
    }
    out.push({ front: zMid >= 0, pts: "M" + pts.join(" L") });
  }
  return out;
};
const DashedRing: React.FC<{ frame: number; front: boolean }> = ({ frame, front }) => {
  const dashes = ringDashes(frame).filter((d) => d.front === front);
  if (!dashes.length) return null;
  const d = dashes.map((x) => x.pts).join(" ");
  const stroke = { fill: "none", strokeWidth: DASH_W, strokeLinecap: "butt" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: DASH_OP }}>
      <path d={d} transform={`translate(${DASH_SHADOW} ${DASH_SHADOW})`} stroke={SHADOW} {...stroke} />
      <path d={d} stroke={INK} {...stroke} />
    </svg>
  );
};

/** The globe's hard shadow offset (screen px): 7 when huge, 5 resolved. */
function globeShadowOff(Rs: number) {
  return interpolate(Rs, [R_END, RS0], [5, 7], clamp);
}
const GlobeShadow: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = camAt(frame);
  const sh = globeShadowOff(cam.Rs);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <circle cx={cam.C.x + sh} cy={cam.C.y + sh} r={cam.Rs} fill={SHADOW} />
    </svg>
  );
};

const Debug: React.FC<{ frame: number }> = ({ frame }) => {
  const cam = camAt(frame);
  const pts: string[] = [];
  for (let i = 0; i < PATH.length; i += 6) {
    const q = cam.toScreen(PATH[i]);
    pts.push(`${q.x.toFixed(1)},${q.y.toFixed(1)}`);
  }
  const r = rocketAt(frame);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <polyline points={pts.join(" ")} fill="none" stroke="#f0f" strokeWidth={2} strokeDasharray="8 8" />
      <text x={20} y={50} fill="#f0f" fontSize={36} fontFamily="monospace">
        f{frame} Rs {cam.Rs.toFixed(0)} tau {cam.tau.toFixed(1)} L {r.L.toFixed(0)} z {r.z.toFixed(2)}
      </text>
    </svg>
  );
};

// -- the cut ------------------------------------------------------------------------------------------------------------------
/** The paper (the sky): a slow 5 % pull-back and a 40 px drop as the camera cranes up, through PaperGround's own
 *  parallax (scale 1 + (k - 1) 0.3, shift (y - y0) k 0.15). */
const paperCam = (e: number) => {
  const k = 1 - e / 6;
  return { x: W / 2, y: H / 2 - (40 * e) / (0.15 * k), k, x0: W / 2, y0: H / 2 };
};

const FirstPrivateToOrbit: React.FC<z.infer<typeof schema>> = ({ bands, debug }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const r = rocketAt(frame);
  const ease = cam.p * cam.p * (3 - 2 * cam.p);
  const rocketBehind = r.z < 0;
  return (
    <AbsoluteFill>
      <SkyrootFilmLife frame={frame} seed="skyroot-4">
        <SkyrootPaper frame={frame} cam={paperCam(ease)} />
        <DashedRing frame={frame} front={false} />
        <Trail frame={frame} front={false} />
        {rocketBehind ? <Rocket frame={frame} /> : null}
        <GlobeShadow frame={frame} />
        <Globe frame={frame} />
        <DashedRing frame={frame} front />
        <Trail frame={frame} front />
        {rocketBehind ? null : <Rocket frame={frame} />}
        {debug ? <Debug frame={frame} /> : null}
      </SkyrootFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default FirstPrivateToOrbit;
