import {PortraitPaper,PortraitWorld,PortraitFilm} from "./portraitShared";
// Portrait adaptation of Tom's approved latest animation. Original word timing and sources retained below.
// ---------------------------------------------------------------------------
// SkyrootOrbitPortrait (skyroot-trailer, cut 4). Core Memory podcast style, the ARCHIVE COLLAGE at 16:9 (the Pushp /
// Mikkel trailer look, on ../skyroot-trailer/skyrootShared). Opaque 2048x1080, 23.976 fps, 76 frames; finals --scale 2 (4096x2160).
//
// CHECK LINE: Skyroot's own rocket lifted off from India and went all the way round into orbit — the trail that leaves
// the Indian coast closes into an orbit around the Earth.
//
// THE LINE: "We have launched India's first private rocket to orbit."
// WORD -> FRAME: have 1 · launched 3 · India's 10 · first 18 · private 26 · rocket 48 · to 59 · orbit 63 · speech ends ~69.
// DURATION: the slot 4.379 -> 7.549 s (sequence f105-f181) = 3.170 s x 23.976 = 76 frames (f0..f75). Before: the speaker
// on camera; after (f76): the minimal news card "45 days ago".
//
// THE MOTION (rev 3): one continuous camera over ONE 3D scene, projected orthographically: the b&w photo Earth (a sphere
// re-projected per frame from the NASA EPIC full disc), the rocket's path (a 3D curve: the climb from the pad, then a
// circular orbit round the Earth's centre) and its white exhaust trail, drawn by the nozzle. No caption bands: the whole
// 2048x1080 frame, balanced round its middle. Three phases that blend with no stall:
//  1. f0-f6 LIFT-OFF: looking along the horizon from the south, the globe huge, its limb across the lower frame, Vikram-1
//     (b&w cut-out, hard shadow, ~545 px) standing on Sriharikota at the top of the limb, its middle at the frame's
//     middle. It lifts on "launched" (f3), gathering speed slowly.
//  2. ~f6-f30 FOLLOW: the camera locks onto the rocket (caught up by f12) and climbs with it, the rocket just left of and
//     below the middle (sky ahead), its trail streaming out of frame behind. The Earth falls away below, its curvature
//     growing, the limb slipping just past the frame's bottom ~f20-f33 (at most ~50 px); the camera banks with the rocket
//     round the Earth (the horizon under it stays level) as it gently pitches over east in a gravity turn, pointing along
//     its flight (the trail flows straight out of the nozzle). The paper drifts down faintly.
//  3. ~f30-f60 REVEAL: one pull-back (log zoom, one lobe) and a crane down (tilt 81 -> 64), still on the rocket, then
//     easing onto a fixed point: the Earth comes back up as a big cap, its lower part out of frame (radius ~845, centre
//     ~(1023, 1450)), the pad low on its left; the orbit (a near face-on circle, 1.42 Earth radii, tipped 25 deg toward
//     us) sweeps across the frame above it, concentric with the cap, the rocket riding its crest near the middle (~(1000,
//     380)) flying right. The planned orbit, DASHED (thinner, lighter than the trail), opens out from the join both ways
//     f34-f56; the rocket merges into it tangentially ~f46 (from f28-f42 its nose eases onto the line ahead) and its solid
//     trail overwrites the dashes.
//  4. f60-f75 SETTLED: the camera creeps; the rocket glides on along the arc at ~5 px/f, the globe turning a hair, film
//     life on. On "orbit" (f63) it is on the orbit, flying, and its solid trail (the climb arc and the orbit flown) takes
//     the chain crown: three touching thin stripes stepping up out of its upper side.
// CHAIN = SKYROOT'S OWN (skyrootShared legend): here the crown on Skyroot's own trail into orbit, once, on "orbit".
//
// SOURCES: FACTS.txt (animation_source/assets): Vikram-1's first flight ("Mission Aagaman") lifted off 18 Jul 2026 from the
// First Launch Pad, Satish Dhawan Space Centre, Sriharikota (India's east coast; pad ~13.72 N 80.23 E), reached a ~450 km
// LEO at 60 deg on the first attempt (ISRO; Al Jazeera; Space.com; SpaceNews; Bloomberg; Wikipedia "Vikram-1"). The orbit
// here is collage scale (radius 1.42 Earth radii so it reads; the real one is 1.07) and is not a real ground track.
// Earth: NASA DSCOVR EPIC natural-colour full disc, 28 Mar 2024 07:15 UTC, centroid 11.2 N 74.8 E (public domain; NASA
// EPIC Team; animation_source/assets/earth_india_disc.png). Rocket: skyrootShared VIKRAM1 (ISRO photo of the flight
// vehicle on the pad, GODL-India).
// ---------------------------------------------------------------------------
import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CHAIN, EARTH, H, INK, RocketCutOut, SHADOW, SKYROOT_FILTER, SkyrootFilmLife, SkyrootPaper, VIKRAM1, W, chainProgress, clamp } from "../skyroot-trailer/skyrootShared";

export const FPS = 24000 / 1001;
export const DURATION = 76;
export const schema = z.object({ debug: z.boolean().default(false) });
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
const ss = (t: number) => t * t * (3 - 2 * t);
const c01 = (t: number) => Math.max(0, Math.min(1, t));
/** Earth's radius on screen at f0 and at the resolved frame. */
export const RS0 = 1500;
export const R_END = 850;
const U_END = Math.log(RS0 / R_END);
/** u = ln(RS0 / Rs): a slow ease out through the follow (the Earth falls away), then the reveal's one pull-back, its
 *  speed peaking ~f40 and settled by ~f58, a creep after. */
const U = track(
  [
    [-40, -0.03],
    [0, 0],
    [10, 0.01],
    [20, 0.04],
    [28, 0.09],
    [36, 0.22],
    [44, 0.38],
    [50, U_END - 0.07],
    [56, U_END - 0.01],
    [60, U_END],
    [75, U_END + 0.03],
    [116, U_END + 0.07],
  ],
  4,
);
/** The camera's tilt: 81 deg = looking along the horizon from the south (the pad on the limb), 0 = EPIC's own view. It
 *  holds near the horizon through the follow (the limb falls straight away below the rocket), then cranes down in the
 *  reveal so the Earth's cap shows its face, India on it. */
const TAU = track(
  [
    [-40, 81.5],
    [0, 81],
    [22, 80.5],
    [30, 78.8],
    [38, 74.5],
    [46, 69],
    [52, 66],
    [58, 64.6],
    [75, 64.1],
    [116, 63.4],
  ],
  4,
);
/** The roll that stands the pad at 12 o'clock (all through the lift-off and the follow) ... */
const ROLL = (tau: number) => {
  const c = Math.cos(rad(tau));
  const s = Math.sin(rad(tau));
  const py = PAD[1] * c + PAD[2] * s;
  return (Math.atan2(PAD[0], py) * 180) / Math.PI * Math.min(1, tau / 60);
};
/** The globe's own turn about its axis (texture only: the orbit and the trail are in space): a hair, eastward. */
const SPIN_PER_F = 0.03; // degrees per frame
/** Where the focus sits on screen: the rocket's middle through the lift-off and the follow (a little left and low once
 *  it has pitched over: sky ahead of it), rising to just above the frame's middle as the reveal resolves. */
const SX = track(
  [
    [-40, 1024],
    [0, 1024],
    [12, 1024],
    [30, 960],
    [44, 975],
    [58, 1000],
    [116, 1006],
  ],
  4,
);
const SY = track(
  [
    [-40, 560],
    [0, 560],
    [12, 560],
    [22, 575],
    [32, 590],
    [44, 505],
    [58, 380],
    [116, 376],
  ],
  4,
);

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

/** The resolved view: the pad rolled ROLL_END deg round to the cap's upper left, so the rocket, flown on round the Earth,
 *  rides the orbit's crest over the middle of the frame. */
const ROLL_END = 55;
const viewFrom = (tau: number, rollOff: number): Mat => matMul(rotZ(ROLL(tau) + rollOff), rotX(tau));

// -- the path (static, in space) ------------------------------------------------------------------------------------------
/** The orbit: a circle of radius RHO round the Earth's centre, designed in the view of F_RING (the settled frame): nearly
 *  face-on (its top tipped RING_TILT toward us), so its upper arc sweeps across the frame concentric with the Earth's cap,
 *  in front of the globe. */
export const RHO = 1.42;
const RING_TILT = 25;
const F_RING = 63;
const M_RING = viewFrom(TAU(F_RING), ROLL_END);
const ORBIT_A = matVec(transpose(M_RING), [1, 0, 0]);
const ORBIT_B = matVec(transpose(M_RING), [0, Math.cos(rad(RING_TILT)), Math.sin(rad(RING_TILT))]);
/** The plane through the pad and the same horizontal: the climb starts in it and turns into the orbit's own plane as it
 *  rises (the two differ only in depth: seen face-on, a hair). */
const PAD_B = norm(sub(PAD, mul(ORBIT_A, dot(PAD, ORBIT_A))));
const orbitPt = (th: number): V3 => mul(add(mul(ORBIT_A, Math.cos(th)), mul(ORBIT_B, Math.sin(th))), RHO);
/** Flown clockwise on screen (theta decreasing: left to right over the top). */
const DIR = -1;
/** The climb, a gravity turn in the orbit's plane: from the pad (theta TH_P, radius 1) its heading leaves the local
 *  vertical at once and tips over to the local horizontal, psi = 90 deg (1 - (1 - u)^TURN_P) over its length (u = 0..1),
 *  so it pitches over low and early, then climbs on a long, gently curving arc and meets the orbit along it (psi 90,
 *  its turn rate falling to the ring's own). Its length is solved so it ends at radius RHO; where it joins is J. */
const TURN_P = 2.0;
const TH_P = Math.atan2(dot(PAD, PAD_B), dot(PAD, ORBIT_A));
const N_CLIMB = 600;
const CLIMB: V3[] = (() => {
  const psi = (u: number) => (Math.PI / 2) * (1 - (1 - u) ** TURN_P);
  let ic = 0;
  for (let i = 0; i < N_CLIMB; i++) ic += Math.cos(psi((i + 0.5) / N_CLIMB)) / N_CLIMB;
  const len = (RHO - 1) / ic;
  const out: V3[] = [];
  let r = 1;
  let th = TH_P;
  let u = 0;
  const at = () => {
    const w = ss(u);
    const b = norm(add(mul(PAD_B, 1 - w), mul(ORBIT_B, w)));
    return mul(add(mul(ORBIT_A, Math.cos(th)), mul(b, Math.sin(th))), r);
  };
  out.push(at());
  for (let i = 0; i < N_CLIMB; i++) {
    const p = psi((i + 0.5) / N_CLIMB);
    const ds = len / N_CLIMB;
    const rm = r + (Math.cos(p) * ds) / 2;
    r += Math.cos(p) * ds;
    th += (DIR * Math.sin(p) * ds) / rm;
    u = (i + 1) / N_CLIMB;
    out.push(at());
  }
  return out;
})();
const TH_J = Math.atan2(dot(CLIMB[N_CLIMB], ORBIT_B), dot(CLIMB[N_CLIMB], ORBIT_A));
export const J = orbitPt(TH_J);
/** The path as a dense polyline with cumulative arc length: the climb, then 1.3 laps from J. */
const PATH: V3[] = [];
const PATH_S: number[] = [];
{
  for (let i = 0; i < N_CLIMB; i++) PATH.push(CLIMB[i]);
  PATH.push(J);
  const N_LAP = 1800;
  for (let i = 1; i <= N_LAP * 1.3; i++) PATH.push(orbitPt(TH_J + DIR * (i / N_LAP) * 2 * Math.PI));
  let s = 0;
  PATH_S.push(0);
  for (let i = 1; i < PATH.length; i++) {
    s += Math.hypot(...sub(PATH[i], PATH[i - 1]));
    PATH_S.push(s);
  }
}
export const S_J = PATH_S[N_CLIMB];
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

// -- the rocket's travel (arc length along the path) -----------------------------------------------------------------------
/** The rocket: still at f0, lifting on "launched" (f3), up to the climb pace V1 (screen px/f against the Earth; world
 *  speed V1 / Rs), then from DEC0 it eases into its orbit and from DEC1 flies on at a calm GLIDE_PX. */
const V1 = 40;
const ACC_F = 24; // frames to reach V1 (a heavy rocket gathering speed: the Earth falls away gradually)
const DEC0 = 34;
const DEC1 = 56;
export const GLIDE_PX = 5;
const RsAt = (f: number) => RS0 * Math.exp(-U(f));
const SUB = 20;
const ROCKET_TABLE = (() => {
  const v = (f: number) => {
    const acc = ss(c01(f / ACC_F));
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
export const L0 = 545; // rocket length on screen at f0
export const L_POW = 0.44; // it shrinks slower than the Earth (collage scale): L = L0 (Rs/RS0)^L_POW
/** From CHORD_F0 the rocket lies along the chord to the path point a rocket length ahead (its nose on the line). */
const CHORD_F0 = 28;
const CHORD_RAMP = 14;
const LAt = (f: number) => L0 * Math.pow(RsAt(f) / RS0, L_POW);

// -- the camera's focus and the camera ---------------------------------------------------------------------------------------
/** The rocket's middle (world), as it is drawn: half a rocket length up its axis from the nozzle (the tangent, then from
 *  CHORD_F0 the chord to the path point a rocket length ahead). */
const midAt = (f: number) => {
  const s = sAt(f);
  const { p, t } = pathAt(s);
  const lw = LAt(f) / RsAt(f);
  const w = ss(c01((f - CHORD_F0) / CHORD_RAMP));
  const tan = mul(t, lw / 2);
  const chord = mul(sub(pathAt(s + lw).p, p), 0.5);
  return add(p, add(mul(tan, 1 - w), mul(chord, w)));
};
const MID_REST = midAt(0);
/** The focus (world): the rocket on the pad, then locking onto the climbing rocket (LOCK_IN, the camera catching up), held
 *  through the follow and the reveal, then easing (LOCK_OUT) onto a fixed point, the rocket's middle at F_HOLD, so the
 *  settled frame holds still and the rocket glides on along the arc. */
const LOCK_IN: [number, number] = [2, 12];
const LOCK_OUT: [number, number] = [40, 60];
const F_HOLD = 63;
const MID_HOLD = midAt(F_HOLD);
const focusAt = (f: number): V3 => {
  const li = ss(c01((f - LOCK_IN[0]) / (LOCK_IN[1] - LOCK_IN[0])));
  const lo = ss(c01((f - LOCK_OUT[0]) / (LOCK_OUT[1] - LOCK_OUT[0])));
  const m = midAt(f);
  const q = add(MID_REST, mul(sub(m, MID_REST), li));
  return add(q, mul(sub(MID_HOLD, q), lo));
};

/** The camera's roll follows the focus round the Earth (its angle about the resolved view's axis, from the pad's), so the
 *  horizon under the climbing rocket stays level and the pitch-over reads against it; it reaches ROLL_END as the focus
 *  settles. */
const angRing = (p: V3) => {
  const v = matVec(M_RING, p);
  return (Math.atan2(v[0], v[1]) * 180) / Math.PI;
};
const ANG0 = angRing(MID_REST);
const ANG_HOLD = angRing(MID_HOLD);
const ROLL_OFF = (f: number) => (ROLL_END * (angRing(focusAt(f)) - ANG0)) / (ANG_HOLD - ANG0);
/** The view rotation (E -> view) at frame f. */
const viewM = (f: number): Mat => viewFrom(TAU(f), ROLL_OFF(f));

export const camAt = (f: number) => {
  const u = U(f);
  const Rs = RS0 * Math.exp(-u);
  const tau = TAU(f);
  const roll = ROLL(tau) + ROLL_OFF(f);
  const M = viewM(f); // E -> view
  const qv = matVec(M, focusAt(f));
  const C = { x: SX(f) - Rs * qv[0], y: SY(f) + Rs * qv[1] };
  const toView = (p: V3) => matVec(M, p);
  const toScreen = (p: V3) => {
    const v = matVec(M, p);
    return { x: C.x + Rs * v[0], y: C.y - Rs * v[1], z: v[2] };
  };
  return { u, p: Math.max(0, Math.min(1, u / U_END)), Rs, tau, roll, M, C, toView, toScreen, spin: SPIN_PER_F * f };
};

/** The planned orbit: a DASHED ring, drawn on during the pull-back by two tips running from J both ways round it at a
 *  constant angular speed, RING_F0 to RING_F1, so it opens out across the frame as the reveal widens. Dashes sit at fixed
 *  places on the ring (they never crawl as the camera moves). */
const RING_F0 = 34;
const RING_F1 = 56;
export const ringTipAt = (f: number) => Math.PI * c01((f - RING_F0) / (RING_F1 - RING_F0)); // radians from J, each way
const DASH_PERIOD_PX = 38; // dash + gap, measured along the ring as the resolved camera sees it (even there)
const DASH_ON = 0.58; // the dash's share of a period



// -- the rocket on screen ----------------------------------------------------------------------------------------------------
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
  const w = ss(c01((f - CHORD_F0) / CHORD_RAMP));
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
  const chh = Math.round(2800 * dpr);
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
  return <canvas ref={ref} width={cw} height={chh} style={{ position: "absolute", left: 0, top: 0, width: W, height: 2800, filter: SKYROOT_FILTER }} />;
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
    const q = cam.toScreen(orbitPt(TH_J + DIR * a));
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
  for (const [a0, b0] of DASHES) {
    // forward from J (ahead of the rocket) up to the tip, and backward from J (behind it) down to 2 pi - tip
    let a = a0;
    let b = b0;
    if (a0 < tip) b = Math.min(tip, b0);
    else if (b0 > 2 * Math.PI - tip) a = Math.max(a0, 2 * Math.PI - tip);
    else continue;
    if (b <= a) continue;
    const pts: string[] = [];
    const n = 5;
    let zMid = 0;
    for (let k = 0; k <= n; k++) {
      const th = TH_J + DIR * (a + ((b - a) * k) / n);
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
/** The paper (the sky): a faint 60 px drop from the lift-off to the settle (the camera climbing with the rocket) and a
 *  slow 5 % pull-back, through PaperGround's own parallax (scale 1 + (k - 1) 0.3, shift (y - y0) k 0.15). */
const paperCam = (frame: number) => {
  const e = ss(c01((frame - 3) / 57));
  const k = 1 - e / 6;
  return { x: W / 2, y: H / 2 - (60 * e) / (0.15 * k), k, x0: W / 2, y0: H / 2 };
};

const SkyrootOrbitPortrait: React.FC<z.infer<typeof schema>> = ({ debug }) => {
  const frame = useCurrentFrame();
  const r = rocketAt(frame);
  const rocketBehind = r.z < 0;
  return (
    <AbsoluteFill>
      <PortraitFilm frame={frame} seed="skyroot-4">
        <PortraitPaper frame={frame}/><PortraitWorld scale={.70} top={310}>
        <DashedRing frame={frame} front={false} />
        <Trail frame={frame} front={false} />
        {rocketBehind ? <Rocket frame={frame} /> : null}
        <GlobeShadow frame={frame} />
        <Globe frame={frame} />
        <DashedRing frame={frame} front />
        <Trail frame={frame} front />
        {rocketBehind ? null : <Rocket frame={frame} />}
        {debug ? <Debug frame={frame} /> : null}
      </PortraitWorld></PortraitFilm>
    </AbsoluteFill>
  );
};

export default SkyrootOrbitPortrait;
