// ---------------------------------------------------------------------------
// PlanetsOfGeniuses (rsi-ten-earths, cut 27 at 27.07 s; REV 1). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 123 frames. One stage inside the misty teal air (AirStage, palette A) on a
// londonDepth one-point perspective from the kit kits/dwarkesh-3d/dwarkesh3d; the world is the clip's shared modules,
// read-only: tenEarthsHall (the HALL_COMPACT data-center building of cut 1, its roof with chillers and skylights) and
// tenEarthsGlobe (the OrangeEarth of cut 9: ACCENT seas, ACCENT_DEEP continents, cream rim, air halo).
//
// CHECK LINE: "In a few more years the AIs in data centers will add up to whole planets' worth of minds: many Earths
//   of them."
//
// THE LINE: "just a few more years after that, we'll end up with many planets worth of geniuses in a data center. Let"
// WORD -> FRAME: within -3 · just 3 · a 8 · few 12 · more 18 · years 24 · after 30 · that, 35 · we'll 46 · end 50 ·
//   up 53 · with 56 · many 60 · planets 64 · worth 76 · of 90 · geniuses 94 · in 105 · a 107 · data 109 ·
//   center. 112 · Let 122
// DURATION: the slot 27.0687 -> 32.1988 s (sequence frames 649-772) = 5.130 s x 23.976 = 123 frames (f0..f122).
//
// THE MOTION: one crane-up and pull-back from f0 (already moving) over the same compact data-center building that
// cut 1 walked up to, its front wall shut, its two roof skylights warm with the orange of the Geniuses inside; the
// move peaks ~f40 and settles ~f96 into a slow creep to the last frame. From "after that" (f30) the orange Earths
// (each one Earth's worth of AIs) rise out of the building one after another, one every 5.5 frames (f30 ... f74,
// nine): each comes up from behind the roof's back parapet at full size and full colour (the building occludes it;
// nothing scales or fades in), straight up out of the roof, then out to its place. They settle as planets hanging in
// deep air, no two touching (gaps 29-60 px on screen), in TWO depths: a near arc of five big Earths (222 px crown,
// 198-200, 182-184 px) low over the roof, and a farther, higher, hazier rank of four (112-124 px) above and between
// them, heights a little uneven (x 95-988, y 403-904). Order: the near crown (landed f57); the two far inner ones (up
// behind the crown and out); the two near outer ones; the two far outer ones; the two near inner ones last, filling
// the arc between (landed f90 / f96, "geniuses" f94), so no Earth ever passes a settled one at its own depth. Living
// hold: the planets turn slowly (0.15 deg/f) and bob ~4.5 px, out of phase, the skylights glow, the camera creeps back.
// REV 1 (the user: "looks good"; "can we add like that kind of light flash glimmer effect? When he says geniuses"): on
// "geniuses" (f94) a warm cream-white glint passes over the Earths left to right, each catching it by its screen x
// (f93 far left .. f107 far right): a soft specular band sweeps across the disc and a small four-point star blooms and
// fades on its lit upper-left limb (~10 f each; see THE GLINT). Nothing else changed (frames outside f94-f119 are
// take 1's pixel for pixel).
// CAUSE: the skylights' glow (the AIs inside) is on from f0; every Earth comes OUT of the building (from behind its
//   roof), first visible frame = its top on the back parapet's line (EMERGE_F), never from an edge or from nothing.
// Orange = THE AIs only (COMMON.md): the Earths and the skylights' glow from the Geniuses inside. The building
//   oatmeal / stone, the road stone with a cream line, the ground sand-umber, the air teal.
//
// DEPTH: a physical camera (londonDepth with dolly 1: Dc = D, so a world point's scale is F / (D + Z)): the focal
//   F = 1586 px (cut 1's lens), the eye E units up, D in front of the building's front plane, the horizon held at
//   screen row H. f0: D 2700, E 1300 (7.3 m, 2.6 m over the roof), H 540 (the building 917 px wide, its roof at
//   y ~675-770); the settle (f96): D 3625, E 1900 (10.7 m), H 650 (the building x 206-879, the roof's back edge at
//   y ~944, the skylights at y ~1033-1053, the front wall y 1096-1498 below as robust context: plain wall, no detail
//   that matters). Creep after f96: D +2.6 and E +1.3 units per frame. The Earths: radius R_E 480
//   units (they are drawn at the AIs' scale, not the planet's), at depths Z 3200 (the near crown) to 4700 (the near
//   ends) and 8600 to 9900 (the far rank), all behind the building's back wall (Z 1833); each keeps its depth while it
//   rises. The far rank takes its own depth veil (earthFog, ~0.55 at Z 9000; orange takes half). Fog by depth
//   (fogBy "depth", fogVis 14000, HALL_READY's cut-2 setting): the building stays clear, the far Earths take a veil.
//
// SOURCES: none on screen (no text, no numbers). Land shapes on the Earths: Natural Earth 1:110m (tenEarthsGlobe).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, AIR, AirFloor, AirHorizonHazeW, AirStage, MAT, WorldSvg, airWorldOf, c01, lerp, mixHex, smoothstep, swayCam, type AirWorld, type Cam, type DepthOpts, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DataCenter, HALL_COMPACT, roofY } from "./tenEarthsHall";
import { GlobeLayer, type GlobeSpec } from "./tenEarthsGlobe";

export const FPS = 24000 / 1001;
export const DURATION = 123;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;

// ===================================================================================================================
// THE BUILDING (cut 1's HALL_COMPACT: outside X +-765, Z -53 .. 1833, roof top Y -837, parapet top Y -917)
// ===================================================================================================================
export const HALL = HALL_COMPACT;
export const EX0 = HALL.x0 - HALL.wall;
export const EX1 = HALL.x1 + HALL.wall;
export const EZ0 = HALL.z0 - HALL.wall;
export const EZ1 = HALL.z1 + HALL.wall;
export const PARA_Y = roofY(HALL) - HALL.parapet;
/** the skylights' glow: what the glass shows of the lit hall (the Geniuses' orange) */
const SKY_GLOW = 0.8;

// ===================================================================================================================
// THE CAMERA: a physical eye (focal F, distance D to the front plane, eye height E, the horizon's screen row H).
// One eased lobe from f0 (already moving, ~40 % of its peak speed) to the settle at T1, then a slow creep.
// ===================================================================================================================
export const F = 1586;
const K0 = { D: 2700, E: 1300, H: 540 };
const K1 = { D: 3625, E: 1900, H: 650 };
const T1 = 96;
const PRE = 14;
/** the creep (units per frame once it is on): the camera keeps backing off and rising a little to the last frame */
const CREEP = { D: 2.6, E: 1.3, f0: 66, f1: 100 };
const SUB = 8;
const lobeW = (t: number) => (t >= T1 ? 0 : Math.sin((Math.PI * (Math.max(0, t) + PRE)) / (T1 + PRE)));
const integ = (w: (t: number) => number, a: number, b: number) => {
  let s = 0;
  const n = Math.max(1, Math.round(Math.abs(b - a) * SUB));
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) s += 0.5 * h * (w(a + i * h) + w(a + (i + 1) * h));
  return s;
};
const LOBE_TOTAL = integ(lobeW, 0, T1);
const creepW = (t: number) => smoothstep(CREEP.f0, CREEP.f1, t);
/** progress 0..1 of the main move, and the creep's integral (frames), tabulated at quarter frames */
const TAB_STEP = 0.25;
const TAB_N = Math.ceil((DURATION + 4) / TAB_STEP);
const U_TAB: number[] = [];
const C_TAB: number[] = [];
{
  let u = 0;
  let c = 0;
  for (let i = 0; i <= TAB_N; i++) {
    if (i > 0) {
      const a = (i - 1) * TAB_STEP;
      const b = i * TAB_STEP;
      u += integ(lobeW, a, b);
      c += integ(creepW, a, b);
    }
    U_TAB.push(Math.min(1, u / LOBE_TOTAL));
    C_TAB.push(c);
  }
}
const tab = (T: number[], f: number) => {
  const x = Math.max(0, Math.min(TAB_N - 1e-6, f / TAB_STEP));
  const i = Math.floor(x);
  return lerp(T[i], T[i + 1], x - i);
};
export type Eye = { D: number; E: number; H: number };
export const eyeAt = (f: number): Eye => {
  const u = tab(U_TAB, f);
  const c = tab(C_TAB, f);
  return { D: lerp(K0.D, K1.D, u) + CREEP.D * c, E: lerp(K0.E, K1.E, u) + CREEP.E * c, H: lerp(K0.H, K1.H, u) };
};
/** the 2D camera and the depth options for an eye (no sway) */
export const camOfEye = (e: Eye): Cam => {
  const k = F / e.D;
  return { k, cx: 0, cy: -e.E - (e.H - 960) / k };
};
export const depthOfEye = (e: Eye): DepthOpts => ({ eyeY: -e.E, dRef: e.D, kRef: F / e.D, dolly: 1 });
export const camAt = (f: number): Cam => swayCam(camOfEye(eyeAt(f)), f);
const REST = camAt(0);
const SCENE = { fogVis: 14000 };
export const airOf = (f: number): AirWorld => airWorldOf({ cam: camAt(f), rest: REST, depth: depthOfEye(eyeAt(f)), frame: f, scene: SCENE, fogBy: "depth" });

/** a world point on screen through a camera (the WorldSvg transform after the depth kit's p) */
export const toScreen = (cam: Cam, e: Eye, X: number, Y: number, Z: number): [number, number, number] => {
  const r = e.D / (e.D + Z);
  const px = cam.cx + (X - cam.cx) * r;
  const py = -e.E + (Y + e.E) * r;
  return [540 + (px - cam.cx) * cam.k, 960 + (py - cam.cy) * cam.k, cam.k * r];
};
/** a screen point at depth Z back to the world (inverse of toScreen) */
const toWorld = (cam: Cam, e: Eye, sx: number, sy: number, Z: number): [number, number] => {
  const r = e.D / (e.D + Z);
  const px = cam.cx + (sx - 540) / cam.k;
  const py = cam.cy + (sy - 960) / cam.k;
  return [cam.cx + (px - cam.cx) / r, -e.E + (py + e.E) / r];
};
/** the back parapet's top edge on screen at frame f: its row and its x span (the line every Earth rises over) */
export const parapetAt = (f: number) => {
  const cam = camAt(f);
  const e = eyeAt(f);
  const a = toScreen(cam, e, EX0, PARA_Y, EZ1);
  const b = toScreen(cam, e, EX1, PARA_Y, EZ1);
  return { y: a[1], x0: a[0], x1: b[0] };
};

// ===================================================================================================================
// THE EARTHS: one world radius, depth by their size in the arch; the arch's slots laid out on screen at the settle
// ===================================================================================================================
export const R_E = 480;
/** THE SLOTS (screen centre and radius at the settle camera, f96), in emergence order. Two depths, no two touching
 *  (gaps 31-58 px on screen): a NEAR arc of five big Earths (222 / 198-200 / 184-186 px) low over the roof, and a
 *  FARTHER, higher, hazier rank of four (112-128 px) above and between them. Laid out by a gap relaxation in the
 *  box x 92-988, y 402-902 (layout2.py in the scratch), heights left a little uneven on purpose.
 *  ORDER (one every BEAT frames): the near crown; the two far inner ones (up behind the crown and out); the two near
 *  outer ones (out low over the roof's corners); the two far outer ones; the two near inner ones last (they fill the
 *  arc between the crown and the outer ones, so no Earth ever has to pass a settled one at its own depth).
 *  ex = where it comes up (screen x at its emergence; inside the parapet's span), rise = its straight rise (world, in
 *  Earth radii) before it curves out, lon/lat = the face it shows (different continents, like cut 9's ten) */
type Def = { key: string; near: boolean; x: number; y: number; rpx: number; ex: number; rise: number; lon: number; lat: number };
const DEFS: Def[] = [
  { key: "nC", near: true, x: 538, y: 513, rpx: 111, ex: 538, rise: 2.2, lon: 100, lat: 24 },
  { key: "fIL", near: false, x: 290, y: 462, rpx: 62, ex: 420, rise: 2.2, lon: -62, lat: 20 },
  { key: "fIR", near: false, x: 795, y: 463, rpx: 61, ex: 660, rise: 2.2, lon: 42, lat: 18 },
  { key: "nOL", near: true, x: 185, y: 804, rpx: 92, ex: 430, rise: 1.8, lon: 140, lat: 15 },
  { key: "nOR", near: true, x: 900, y: 806, rpx: 91, ex: 650, rise: 1.8, lon: -20, lat: 24 },
  { key: "fOL", near: false, x: 151, y: 575, rpx: 59, ex: 410, rise: 2.2, lon: 12, lat: 22 },
  { key: "fOR", near: false, x: 932, y: 556, rpx: 56, ex: 700, rise: 2.0, lon: -150, lat: 20 },
  { key: "nIL", near: true, x: 350, y: 660, rpx: 99, ex: 445, rise: 1.6, lon: 168, lat: 16 },
  { key: "nIR", near: true, x: 739, y: 648, rpx: 100, ex: 635, rise: 1.6, lon: -108, lat: 14 },
];
/** the first Earth's top crosses the back parapet on EMERGE_F ("after that"), then one every BEAT frames */
export const EMERGE_F = 30;
export const BEAT = 5.5;
const SETTLE_EYE = eyeAt(T1);
const SETTLE_CAM = camOfEye(SETTLE_EYE);

export type Planet = Def & {
  i: number;
  Z: number;
  fe: number;
  T: number;
  fl: number;
  /** world path (X, Y at its depth), sampled: straight up until it has cleared the parapet, then a cubic into its
   *  slot whose first tangent is vertical (one smooth curve, no corner) */
  pts: [number, number][];
  /** cumulative arclength at each sample */
  L: number[];
  bobPh: number;
};
/** a cubic's point */
const bez = (P: [number, number][], t: number): [number, number] => {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
};
const N_RISE = 24;
const N_CURVE = 120;
const arcTable = (pts: [number, number][]) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return L;
};
/** the point at arclength fraction s */
const pointAt = (pts: [number, number][], L: number[], s: number): [number, number] => {
  const target = c01(s) * L[L.length - 1];
  let i = 0;
  while (i < L.length - 2 && L[i + 1] < target) i++;
  const seg = L[i + 1] - L[i];
  const u = seg > 0 ? c01((target - L[i]) / seg) : 0;
  return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)];
};
/** flight speed cap (screen px per frame at the start of the ease-out) */
const VMAX = (rpx: number) => lerp(38, 42, c01((111 - rpx) / 55));

export const PLANETS: Planet[] = DEFS.map((d, i) => {
  // the depth whose scale gives the slot's radius at the settle camera
  const Z = (R_E * F) / d.rpx - SETTLE_EYE.D;
  const [XS, YS] = toWorld(SETTLE_CAM, SETTLE_EYE, d.x, d.y, Z);
  const fe = EMERGE_F + BEAT * i;
  const ce = camOfEye(eyeAt(fe));
  const ee = eyeAt(fe);
  const pa = parapetAt(fe);
  const re = (R_E * F) / (ee.D + Z);
  const [XE, YE] = toWorld(ce, ee, d.ex, pa.y + re, Z);
  // the straight rise out of the roof, then one cubic into the slot whose first tangent is vertical: on up and out
  // when the slot is higher, or a short lob over and down onto it when the slot is lower than the end of the rise
  const YC = YE - d.rise * R_E;
  const dx = XS - XE;
  const up = Math.max(0, YC - YS);
  const C: [number, number][] = [
    [XE, YC],
    [XE, YC - Math.max(0.75 * up, 0.22 * Math.abs(dx))],
    [XS - 0.5 * dx, YS + 0.03 * up],
    [XS, YS],
  ];
  const pts: [number, number][] = [];
  for (let k = 0; k < N_RISE; k++) pts.push([XE, lerp(YE, YC, k / N_RISE)]);
  for (let k = 0; k <= N_CURVE; k++) pts.push(bez(C, k / N_CURVE));
  const L = arcTable(pts);
  // duration from the screen length (ease-out: start speed 2 L / T)
  const lenPx = L[L.length - 1] * (F / (SETTLE_EYE.D + Z));
  const T = Math.max(12, (2 * lenPx) / VMAX(d.rpx));
  return { ...d, i, Z, fe, T, fl: fe + T, pts, L, bobPh: (i * 2.1) % (2 * Math.PI) };
});

/** the bob after landing (world units at its depth, ~3-4 px on screen), eased in from rest */
const BOB_PX = 4.5;
const BOB_PER = 70;
/** the Earths' haze: their own depth veil (the building's fog by depth barely touches them), so the arch's far ends
 *  sink into the air: ~0.07 at the crown, ~0.6 at the ends (orange takes half, as A.toneO) */
const EARTH_FOG = { near: 2500, vis: 6000, max: 0.9 };
const earthFog = (Z: number) => EARTH_FOG.max * (1 - Math.exp(-Math.max(0, Z - EARTH_FOG.near) / EARTH_FOG.vis));
/** the slow turn (deg per frame) */
const TURN = 0.15;

/** where planet p is at frame f (world X, Y), or null before it comes up */
export const planetAt = (p: Planet, f: number): { X: number; Y: number } | null => {
  if (f < p.fe) return null;
  const t = c01((f - p.fe) / p.T);
  const s = 1 - Math.pow(1 - t, 2);
  const [X, Y] = pointAt(p.pts, p.L, s);
  const scale = F / (SETTLE_EYE.D + p.Z);
  const bob = ((BOB_PX / scale) * Math.sin((2 * Math.PI * (f - p.fl)) / BOB_PER + 0) * smoothstep(p.fl, p.fl + 18, f) * (p.i % 2 === 0 ? 1 : -1));
  return { X, Y: Y + bob };
};

export type Scene = { cam: Cam; eye: Eye; A: AirWorld; globes: (GlobeSpec & { i: number; Z: number })[] };
export const sceneAt = (f: number): Scene => {
  const cam = camAt(f);
  const eye = eyeAt(f);
  const A = airOf(f);
  const globes: (GlobeSpec & { i: number; Z: number })[] = [];
  PLANETS.forEach((p) => {
    const q = planetAt(p, f);
    if (!q) return;
    const [sx, sy, sc] = toScreen(cam, eye, q.X, q.Y, p.Z);
    globes.push({ i: p.i, Z: p.Z, cx: sx, cy: sy, r: R_E * sc, lon: p.lon - TURN * f, lat: p.lat, cover: 1, sea: 1, fog: earthFog(p.Z), air: A.airHex(p.Z, Math.min(-q.Y, 2300)), rim: 1 - 0.6 * earthFog(p.Z) });
  });
  // back to front
  globes.sort((a, b) => b.Z - a.Z);
  return { cam, eye, A, globes };
};

// ===================================================================================================================
// THE GROUND AND THE ROAD (cut 1's: the road X +-250 runs up to the building's front, a cream line down its middle)
// ===================================================================================================================
const ROAD_W2 = 250;
const ROAD_Z1 = -60;
const MAT_ROAD: Mat = { lit: "#8E8576", mid: "#6F675A", dark: "#3E3A33" };
const ROAD_HEX = mixHex(MAT_ROAD.lit, MAT_ROAD.mid, 0.45);
const ptsOf = (q: [number, number][]) => `M${q.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`;
const GroundStrip: React.FC<{ A: AirWorld; X0: number; X1: number; z0: number; z1: number; hex: string; n?: number }> = ({ A, X0, X1, z0, z1, hex, n = 14 }) => {
  const p = A.P.p;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = lerp(z0, z1, i / n);
    const b = lerp(z0, z1, (i + 1) / n);
    const b2 = i < n - 1 ? b + (b - a) * 0.12 : b;
    out.push(<path key={i} d={ptsOf([p(X0, 0, a), p(X1, 0, a), p(X1, 0, b2), p(X0, 0, b2)])} fill={A.tone(hex, (a + b) / 2, 0)} />);
  }
  return <g>{out}</g>;
};
const RoadJoints: React.FC<{ A: AirWorld; z0: number; course: number }> = ({ A, z0, course }) => {
  const p = A.P.p;
  let d = "";
  for (let Z = Math.ceil(z0 / course) * course; Z < ROAD_Z1; Z += course) {
    const a = p(-ROAD_W2, 0, Z);
    const b = p(ROAD_W2, 0, Z);
    d += `M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`;
  }
  return <path d={d} stroke={A.tone(MAT_ROAD.dark, -600, 0)} strokeWidth={1.6} strokeOpacity={0.28} fill="none" />;
};

// ===================================================================================================================
// THE GLINT (rev 1, the user: "that kind of light flash glimmer effect ... when he says geniuses ... to just highlight
// what he's talking about"). On "geniuses" (f94) a warm cream-white light passes over the Earths LEFT TO RIGHT, each
// globe catching it in turn by its screen x (the far left f93, the far right f107: ~2 f apart on average): a soft
// specular band crosses the sphere (clipped to its disc) and a small four-point star blooms and fades on its lit
// upper-left limb (~10 f each). Screen-blended over the globe layer, under the building, inside the air's grade.
// Nothing else changes: outside f94-f119 the cut renders exactly as take 1.
// ===================================================================================================================
export const GLINT = { f0: 93, spread: 14, x0: 150, x1: 932, band: 10, star: 11, starLag: 1 };
const GLINT_HEX = "#FFF5E0";
/** when a globe at screen x catches the light */
export const glintStart = (x: number) => GLINT.f0 + GLINT.spread * c01((x - GLINT.x0) / (GLINT.x1 - GLINT.x0));
const easeIO = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * c01(t));
/** a four-point star of arm length L (long arms on the axes, short ones on the diagonals) */
const starPath = (L: number) => {
  const w = (0.13 * L).toFixed(2);
  const l = L.toFixed(2);
  return `M0,-${l}Q${w},-${w} ${l},0Q${w},${w} 0,${l}Q-${w},${w} -${l},0Q-${w},-${w} 0,-${l}Z`;
};
type GlintState = { i: number; cx: number; cy: number; r: number; veil: number; band: number; bandX: number; star: number; spin: number };
export const glintsAt = (frame: number, globes: (GlobeSpec & { i: number; Z: number })[]): GlintState[] =>
  globes
    .map((g) => {
      const t0 = glintStart(g.cx);
      const u = (frame - t0) / GLINT.band;
      const v = (frame - t0 - GLINT.starLag) / GLINT.star;
      const band = u > 0 && u < 1 ? Math.pow(Math.sin(Math.PI * u), 0.8) : 0;
      const star = v > 0 && v < 1 ? Math.pow(Math.sin(Math.PI * v), 1.6) : 0;
      return { i: g.i, cx: g.cx, cy: g.cy, r: g.r, veil: 1 - 0.55 * (g.fog ?? 0), band, bandX: lerp(-1.45, 1.45, easeIO(u)), star, spin: 18 * c01(v) };
    })
    .filter((q) => q.band > 0 || q.star > 0);

const Glints: React.FC<{ frame: number; globes: (GlobeSpec & { i: number; Z: number })[] }> = ({ frame, globes }) => {
  const gs = glintsAt(frame, globes);
  if (gs.length === 0) return null;
  const TILT = 22; // the band leans like "/" (the light from the upper left)
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="pogGlintBand" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={GLINT_HEX} stopOpacity={0} />
          <stop offset="0.38" stopColor={GLINT_HEX} stopOpacity={0.55} />
          <stop offset="0.5" stopColor={GLINT_HEX} stopOpacity={1} />
          <stop offset="0.62" stopColor={GLINT_HEX} stopOpacity={0.55} />
          <stop offset="1" stopColor={GLINT_HEX} stopOpacity={0} />
        </linearGradient>
        <radialGradient id="pogGlintGlow">
          <stop offset="0" stopColor={GLINT_HEX} stopOpacity={0.9} />
          <stop offset="0.35" stopColor={GLINT_HEX} stopOpacity={0.35} />
          <stop offset="1" stopColor={GLINT_HEX} stopOpacity={0} />
        </radialGradient>
        {gs.map((g) => (
          <clipPath key={g.i} id={`pogGlintClip${g.i}`}>
            <circle cx={g.cx} cy={g.cy} r={g.r * 0.995} />
          </clipPath>
        ))}
      </defs>
      {gs.map((g) => {
        const lx = g.cx - 0.66 * g.r;
        const ly = g.cy - 0.66 * g.r;
        const L = 0.4 * g.r;
        return (
          <g key={g.i} opacity={g.veil}>
            {g.band > 0 ? (
              <g clipPath={`url(#pogGlintClip${g.i})`}>
                <g transform={`translate(${(g.cx + g.bandX * g.r).toFixed(2)} ${g.cy.toFixed(2)}) rotate(${TILT})`}>
                  <rect x={-0.6 * g.r} y={-1.6 * g.r} width={1.2 * g.r} height={3.2 * g.r} fill="url(#pogGlintBand)" opacity={0.55 * g.band} />
                  <rect x={-0.13 * g.r} y={-1.6 * g.r} width={0.26 * g.r} height={3.2 * g.r} fill="url(#pogGlintBand)" opacity={0.5 * g.band} />
                </g>
              </g>
            ) : null}
            {g.star > 0 ? (
              <g transform={`translate(${lx.toFixed(2)} ${ly.toFixed(2)})`}>
                <circle r={0.95 * L * g.star} fill="url(#pogGlintGlow)" opacity={0.85 * g.star} />
                <g transform={`rotate(${g.spin.toFixed(2)}) scale(${(0.35 + 0.65 * g.star).toFixed(4)})`} opacity={Math.min(1, 1.6 * g.star)}>
                  <path d={starPath(L)} fill={GLINT_HEX} />
                  <path d={starPath(0.5 * L)} transform="rotate(45)" fill={GLINT_HEX} opacity={0.75} />
                </g>
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
export const PlanetsScene: React.FC<{ frame: number }> = ({ frame }) => {
  const s = sceneAt(frame);
  const { cam, A } = s;
  const z0 = A.P.zNear;
  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-16000} x1={16000} z0={-8000} z1={26000} mat={MAT.ground} course={420} melt={0.5} />
        <AirHorizonHazeW A={A} id="pog-haze" />
        <GroundStrip A={A} X0={-ROAD_W2} X1={ROAD_W2} z0={z0} z1={ROAD_Z1} hex={ROAD_HEX} />
        <GroundStrip A={A} X0={-ROAD_W2 - 14} X1={-ROAD_W2} z0={z0} z1={ROAD_Z1} hex={mixHex(MAT.stone.lit, ROAD_HEX, 0.15)} />
        <GroundStrip A={A} X0={ROAD_W2} X1={ROAD_W2 + 14} z0={z0} z1={ROAD_Z1} hex={mixHex(MAT_ROAD.dark, ROAD_HEX, 0.4)} />
        <RoadJoints A={A} z0={z0} course={420} />
        <GroundStrip A={A} X0={-8} X1={8} z0={z0} z1={ROAD_Z1} hex={mixHex(PAL.creamLo, ROAD_HEX, 0.2)} />
      </WorldSvg>
      {/* the Earths hang behind the building: it occludes them as they rise from behind its roof */}
      <GlobeLayer globes={s.globes} />
      <Glints frame={frame} globes={s.globes} />
      <WorldSvg cam={cam}>
        <DataCenter A={A} frame={frame} uid="pog" hall={HALL} cutaway={0} skyGlow={{ color: ACCENT, amount: SKY_GLOW }} />
      </WorldSvg>
    </AirStage>
  );
};

const PlanetsOfGeniuses: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <PlanetsScene frame={frame} />;
};

export default PlanetsOfGeniuses;
