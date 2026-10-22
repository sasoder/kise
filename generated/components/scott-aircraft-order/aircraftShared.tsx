// AIRCRAFT_READY
// ===================================================================================================================
// aircraftShared — THE AIRFIELD of scott-aircraft-order (Cheeky Pint S4E05, Scott Kirby, "the biggest aircraft order
// in history"). The Cheeky Pint "at sea" look (droneSeaShared / oceanShared: a warm hazy golden-hour medium, lit cream
// machines, one amber, Söhne, stout grain, brown vignette, nothing black) carried into the AIR over a desert airfield.
// Amber = UNITED (its fins; in cuts 5-6 the bet's outcome). Everyone else: cream fins with their real mark in ink.
//
// THE MODEL. Real 3D (three.js through @remotion/three, ONE pinhole camera shared with the 2D layers): the jets are
// parametric lofts of their real proportions (aircraftModels.ts), painted with canvas liveries (aircraftPaint.ts), lit
// by ONE key light from the upper left, fogged by distance into the horizon haze. The ground (concrete apron, desert)
// is a shader plane in the same scene; the sky, sun, clouds, dust, grade, vignette and grain are 2D layers around it.
// RENDER EVERY CUT WITH --gl=angle (WebGL).
//
// WORLD UNITS: metres. X right, Y up (ground = 0), Z AWAY from the camera (into the picture). Headings in degrees on
// the ground: 0 = nose toward +Z (away / up the screen in plan), 90 = toward +X (right), -90 = toward -X (LEFT, the
// default side profile), 180 = toward the camera.
//
// API
//   AirCam                 { mode: "side", x, y (eye height), z, f (focal px), horizon? (screen row of the horizon at
//                          pitch 0, lens shift; 960), yaw? (deg, + turns right), pitch? (deg, + looks down) }
//                        | { mode: "plan", x, z, k (screen px per metre), rot? (deg) }: straight down, screen up = +Z,
//                          the sun's shadows fall to the lower right.
//   airProject(cam, [X, Y, Z]) -> { x, y, s (screen px per metre there), d (depth m) }   pin 2D overlays to the world
//   horizonRow(cam)        the horizon's screen y (side mode)
//   airTrack(start, glides, frames) -> AirCam[]   oceanShared's damped follower over every camera field;
//                          AirGlide = { f0, f1, to: { x?, y?, z?, f?, horizon?, yaw?, pitch?, k?, rot? }, warp? }
//                          (each glide eases from the previous target of a field to its own; f and k in log space)
//   airCamAt(track, f)     sample a track at a (fractional) frame
//   <AirStage cam S rest? world ground? overlay? under? sky? motes? grade? grain? vignette? bloom? shimmer?>
//                          the frame: sky (side mode), the 3D layer (ground + `world`: jets, yard, markings) with the
//                          fixed amber bloom, `overlay` (screen px SVG/HTML above the 3D, below the grade), sun veil,
//                          dust motes, grade, vignette, grain. `S` = story clock (frames) for ambient life.
//   GroundSpec             { aprons: [x0, z0, x1, z1][] (concrete), joints? (slab m) }; default: the yard's apron.
//   <Jet type airline at heading? alt? pitch? drain? stored? gear? detail? shadow? sweep?>  one airliner in `world`.
//                          type: B787_9 | B787_10 | B777 | B747 | A380 | A340 | A330 | B737MAX | A321
//                          airline: united | qantas | britishAirways | lufthansa | airFrance | klm | delta | american |
//                          virginAtlantic | cathay | singapore | emirates | plain
//                          at [X, Z] = the fuselage centre on the ground; alt (m) lifts it; pitch (deg, nose up);
//                          drain 0..1 tones it into the haze (parked / retired, never opacity); stored 0..1 wipes white
//                          covers over the inlets and cockpit windows and slides chocks under the wheels.
//   <B787 variant="9"|"10" facing="left"|"right" yaw? ...>, <B777>, <B747>, <A380>, <A340>, <A330>, <B737MAX>, <A321>
//                          side-profile shorthands (nose LEFT by default; yaw turns the nose away from the camera).
//   <B787Plan> <B737Plan> <A321Plan>   plan shorthands (heading 0 = nose up the screen).
//   <JetField type airline items=[{at, heading, alt?}] drain? detail?>  hundreds of jets (instanced; cut 3's grids).
//   jetPoint(type, at, heading, local, alt?, pitch?) -> [X, Y, Z]   a named point on a placed jet (JET_POINTS[type])
//   JET_DIMS[type]         { length, span, height, L } (m)
//   <Runway at heading length width paint? progress?>  asphalt strip with threshold keys, centreline dashes, edge lines,
//                          aiming-point blocks and touchdown bars (paint "cream" | "amber"; progress 0..1 paints the
//                          markings along it from the near threshold)
//   <TaxiLine pts width? paint? dashed?>   a painted line on the ground through world [X, Z] points
//   <Hangar at heading doors>  the final-assembly hangar (YARD.hangar): doors 0 shut .. 1 open, warm light inside
//   <Yard drain? stored? doors? hide?>      THE YARD of cuts 1-2: the parked row, United at its front, the hangar, the
//                          lane and stand markings. drain / stored: a number or (slot index 1..8) => number.
//   YARD                   { united, slots[1..8] ({airline, type, at, heading}), hangar {at, heading, width, height,
//                          bays, doorW, doorH, door (world rect of the centre door)}, lane {from, to, heading, at(s)} }
//   YARD_CAM_WIDE, YARD_CAM_ROW, YARD_CAM_UNITED, YARD_CAM_HANGAR   suggested cameras
//   LIGHT                  the key light (world, toward the light) per mode; AIR_FOG the fog; AIR_COLOR the palette
//
// PERFORMANCE: geometry and liveries are built once per type / airline and cached; the yard wide renders in ~0.3-0.6 s
// a frame at concurrency 4 (see AIRCRAFT_READY.md).
// ===================================================================================================================
import React, { useId, useMemo } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { CAM_DAMP, CAM_STIFF, GRADE, camEase } from "../kits/cheeky-pint/oceanShared";
import { COLOR, GRAIN, GROUND } from "../kits/cheeky-pint/stoutShared";
import { SPECS, buildJet, jetPoints, type Detail, type JetType, type MeshData, type V3 } from "./aircraftModels";
import { paintCovers, paintFin, paintSkin, type Airline } from "./aircraftPaint";

export type { JetType, Airline, V3 };
export { JET_TYPES } from "./aircraftModels";
export { AIRLINES } from "./aircraftPaint";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const W = 1080;
const H = 1920;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const uidOf = (raw: string) => `air${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ===================================================================================================================
// PALETTE, LIGHT, FOG
// ===================================================================================================================
export const AIR_COLOR = {
  haze: SKY.haze,
  glow: SKY.glow,
  cream: COLOR.cream,
  ink: COLOR.inkDark,
  shadow: COLOR.shadow,
  amberTop: COLOR.amberTop,
  amberFoot: COLOR.amberFoot,
  amberHot: COLOR.amberHot,
  /** the ground's materials before fog */
  concrete: "#AE9D81",
  concreteLo: "#9C8B70",
  joint: "#7E6F5A",
  desert: "#B78F64",
  desertLo: "#9E7752",
  asphalt: "#6F6052",
  paint: "#EFE6D3",
  /** what `drain` tones toward: the haze, a little toward board */
  drain: "#D3BC99",
  /** the shade side of a lit volume (multiplied into the local colour) */
  shadeMul: "#8C7E70",
  bounce: "#E9CFA6",
} as const;
/** Toward the key light (world, normalised): side views take the low sun from the upper LEFT and a little in front
 *  (the visible sides lit, the tops brightest, shadows falling behind-right); plan views from the upper left of the
 *  screen (shadows to the lower right). */
const nrm = (x: number, y: number, z: number): V3 => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
};
export const LIGHT = { side: nrm(-0.55, 0.8, -0.27), plan: nrm(-0.5, 0.8, 0.36) } as const;
/** Fog by distance (m): none nearer than `near`, then max * (1 - exp(-(d - near) / vis)). */
export const AIR_FOG = { near: 80, vis: 2400, max: 0.93 } as const;
export const fogAmount = (d: number) => AIR_FOG.max * (1 - Math.exp(-Math.max(0, d - AIR_FOG.near) / AIR_FOG.vis));

// ===================================================================================================================
// CAMERA
// ===================================================================================================================
export type SideCam = { mode: "side"; x: number; y: number; z: number; f: number; horizon?: number; yaw?: number; pitch?: number; near?: number };
export type PlanCam = { mode: "plan"; x: number; z: number; k: number; rot?: number };
export type AirCam = SideCam | PlanCam;
/** the plan camera's eye height (a far pinhole is all but orthographic: 0.2 % size change per 100 m of altitude) */
export const PLAN_EYE = 50000;
type Pin = { x: number; y: number; z: number; f: number; horizon: number; yaw: number; pitch: number };
const toPin = (c: AirCam): Pin =>
  c.mode === "plan"
    ? { x: c.x, y: PLAN_EYE, z: c.z, f: c.k * PLAN_EYE, horizon: 960, yaw: c.rot ?? 0, pitch: 90 }
    : { x: c.x, y: c.y, z: c.z, f: c.f, horizon: c.horizon ?? 960, yaw: c.yaw ?? 0, pitch: c.pitch ?? 0 };
const D2R = Math.PI / 180;
/** World point -> screen px (+ the scale in px per metre at that depth and the depth). */
export const airProject = (cam: AirCam, p: V3) => {
  const q = toPin(cam);
  const rx = p[0] - q.x;
  const ry = p[1] - q.y;
  const rz = p[2] - q.z;
  const sy = Math.sin(q.yaw * D2R);
  const cy = Math.cos(q.yaw * D2R);
  const sp = Math.sin(q.pitch * D2R);
  const cp = Math.cos(q.pitch * D2R);
  // yaw: forward f0 = (sin, 0, cos), right r0 = (cos, 0, -sin); pitch tips forward down
  const fx = sy * cp;
  const fy = -sp;
  const fz = cy * cp;
  const ux = sy * sp;
  const uy = cp;
  const uz = cy * sp;
  const d = rx * fx + ry * fy + rz * fz;
  const right = rx * cy - rz * sy;
  const up = rx * ux + ry * uy + rz * uz;
  const dd = Math.max(1e-6, d);
  return { x: 540 + (q.f * right) / dd, y: q.horizon - (q.f * up) / dd, s: q.f / dd, d };
};
/** The horizon's screen row (side mode; plan mode has none: -1e9). */
export const horizonRow = (cam: AirCam) => (cam.mode === "plan" ? -1e9 : (cam.horizon ?? 960) - cam.f * Math.tan((cam.pitch ?? 0) * D2R));

export type AirGlide = { f0: number; f1: number; to: Partial<Record<"x" | "y" | "z" | "f" | "horizon" | "yaw" | "pitch" | "k" | "rot", number>>; warp?: number };
const LOG_FIELDS = ["f", "k"];
/** oceanShared's damped camera over every numeric field of an AirCam (f and k eased in log space). */
export const airTrack = (start: AirCam, glides: AirGlide[], frames: number): AirCam[] => {
  const keys = Object.keys(start).filter((k) => k !== "mode") as (keyof AirGlide["to"])[];
  for (const g of glides) for (const k of Object.keys(g.to)) if (keys.indexOf(k as keyof AirGlide["to"]) < 0) keys.push(k as keyof AirGlide["to"]);
  const base = start as unknown as Record<string, number>;
  const startOf = (k: string) => (base[k] !== undefined ? base[k] : k === "horizon" ? 960 : 0);
  const T: Record<string, number>[] = [];
  for (let f = 0; f <= frames + 2; f++) {
    const o: Record<string, number> = {};
    for (const k of keys) {
      const isLog = LOG_FIELDS.indexOf(k) >= 0;
      const tr = (v: number) => (isLog ? Math.log(v) : v);
      let v = tr(startOf(k));
      let prev = v;
      for (const g of glides) {
        const tgt = g.to[k];
        if (tgt === undefined) continue;
        const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
        v += (tr(tgt) - prev) * e;
        prev = tr(tgt);
      }
      o[k] = v;
    }
    T.push(o);
  }
  const out: AirCam[] = [];
  const c: Record<string, number> = { ...T[0] };
  const vel: Record<string, number> = {};
  for (const k of keys) vel[k] = 0;
  for (let f = 0; f < T.length; f++) {
    if (f > 0) {
      for (const k of keys) {
        vel[k] = vel[k] + (T[f][k] - c[k]) * CAM_STIFF - vel[k] * CAM_DAMP;
        c[k] = c[k] + vel[k];
      }
    }
    const o: Record<string, number | string> = { mode: start.mode };
    for (const k of keys) o[k] = LOG_FIELDS.indexOf(k) >= 0 ? Math.exp(c[k]) : c[k];
    out.push(o as unknown as AirCam);
  }
  return out;
};
/** sample a track at a fractional frame */
export const airCamAt = (track: AirCam[], f: number): AirCam => {
  const a = Math.max(0, Math.min(track.length - 2, Math.floor(f)));
  const t = c01(f - a);
  const A = track[a] as unknown as Record<string, number>;
  const B = track[a + 1] as unknown as Record<string, number>;
  const o: Record<string, number | string> = { mode: track[a].mode };
  for (const k of Object.keys(A)) if (k !== "mode") o[k] = LOG_FIELDS.indexOf(k) >= 0 ? Math.exp(lerp(Math.log(A[k]), Math.log(B[k]), t)) : lerp(A[k], B[k], t);
  return o as unknown as AirCam;
};

// ===================================================================================================================
// SHADERS
// ===================================================================================================================
const FOG_GLSL = /* glsl */ `
uniform vec4 uFog;     // near, vis, max, off (1 in plan views)
uniform vec3 uHazeLo;
uniform vec3 uHazeHi;
float airFogAt(vec3 w) {
  float d = length(w - cameraPosition);
  return uFog.z * (1.0 - exp(-max(0.0, d - uFog.x) / uFog.y)) * (1.0 - uFog.w);
}
vec3 airFogCol(vec3 w) { return mix(uHazeLo, uHazeHi, smoothstep(0.0, 320.0, w.y)); }
`;
const JET_VERT = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aAux;
uniform float uSlide;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vLN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  vec3 p = position + aAux.yzw * uSlide;
  mat4 m = modelMatrix;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
#endif
  vec4 wp = m * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(m) * normal);
  vLN = normal;
  vCol = aCol;
  vUv = uv;
  vAux = aAux;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const JET_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uCream;
uniform vec3 uShade;
uniform vec3 uBounce;
uniform float uDrain;
uniform vec3 uDrainCol;
uniform float uStored;
uniform float uMode;   // 0 parts, 1 skin, 2 fin, 3 covers, 4 flat (unlit: interior light)
uniform float uGlow;   // the amber fin's glow
uniform float uBright; // a flat multiplier (hangar interior)
uniform vec3 uCoverCol;
uniform sampler2D uMap;
uniform sampler2D uMap2;
uniform sampler2D uCov;
${FOG_GLSL}
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vLN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  vec3 base = vCol;
  if (uMode > 0.5 && uMode < 1.5) {
    base = texture2D(uMap, vUv).rgb;
    vec4 c = texture2D(uCov, vUv);
    if (c.r > 0.5 && c.g < uStored * 1.06 - 0.03) base = uCoverCol;
  } else if (uMode > 1.5 && uMode < 2.5) {
    base = vLN.z > 0.0 ? texture2D(uMap2, vUv).rgb : texture2D(uMap, vUv).rgb;
  } else if (uMode > 2.5 && uMode < 3.5) {
    if (uStored <= 0.001) discard;
    if (vAux.x > 0.0 && vAux.x > uStored) discard;
  }
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 col;
  if (uMode > 3.5) {
    col = base * uBright;
  } else {
    float ndl = dot(n, uL);
    float lit = smoothstep(-0.38, 0.8, ndl);
    col = mix(base * uShade, base * 1.03, lit);
    col *= 1.0 + 0.04 * max(n.y, 0.0);
    col = mix(col, col * uBounce, 0.3 * max(-n.y, 0.0));
    float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
    // form: grazing edges that do not face up sink a little (rounds tubes seen from above), a broad weak sheen
    float graze = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 1.3);
    col *= 1.0 - 0.3 * graze * (1.0 - smoothstep(0.05, 0.7, n.y));
    float sheen = pow(max(dot(n, normalize(uL + V)), 0.0), 14.0);
    col += base * 0.09 * sheen;
    col = mix(col, uCream, 0.55 * fres * smoothstep(0.05, 0.7, n.y));
    float amber = uGlow * smoothstep(0.3, 0.6, base.r - base.b);
    col = mix(col, base * mix(0.96, 1.02, lit), amber * 0.92);
  }
  col = mix(col, uDrainCol, uDrain * 0.52);
  float gr = dot(col, vec3(0.3, 0.55, 0.15));
  col = mix(col, vec3(gr) * vec3(1.04, 1.0, 0.93), uDrain * 0.45);
  float f = airFogAt(vW);
  f = 1.0 - (1.0 - f) * (1.0 - 0.22 * uDrain);
  gl_FragColor = vec4(mix(col, airFogCol(vW), f), 1.0);
}`;
const GROUND_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GROUND_FRAG = /* glsl */ `
uniform vec4 uAprons[8];
uniform float uNA;
uniform float uJoint;
uniform float uTime;
uniform float uShimmer;
uniform vec3 uConc;
uniform vec3 uConcLo;
uniform vec3 uJointCol;
uniform vec3 uDes;
uniform vec3 uDesLo;
${FOG_GLSL}
varying vec3 vW;
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
  return s;
}
void main() {
  vec2 p = vec2(vW.x, -vW.z);       // world X, Z (Z away)
  float d = length(vW - cameraPosition);
  // heat shimmer: the far ground wavers sideways in thin bands
  float far = smoothstep(900.0, 2600.0, d) * uShimmer;
  p.x += far * 1.6 * sin(p.y * 0.045 + uTime * 0.21) * sin(p.y * 0.013 - uTime * 0.07);
  vec2 dp = fwidth(p);
  float px = max(dp.x, dp.y);            // metres per pixel here
  // concrete or desert
  float conc = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uNA) break;
    vec4 a = uAprons[i];
    vec2 lo = a.xy;
    vec2 hi = a.zw;
    vec2 q = min(p - lo, hi - p);
    conc = max(conc, smoothstep(-2.0, 2.0, min(q.x, q.y)));
  }
  // desert: warm sand, low dunes of tone, scrub specks
  float dn = fbm(p * 0.004);
  float dm = fbm(p * 0.05);
  vec3 des = mix(uDesLo, uDes, smoothstep(0.25, 0.75, dn));
  des *= 0.94 + 0.1 * dm;
  float scrub = smoothstep(0.82, 0.9, vnoise(p * 0.6)) * (1.0 - smoothstep(0.3, 1.2, px));
  des = mix(des, uDesLo * 0.72, scrub * 0.55);
  // concrete: slabs, each its own tone; joints; stains
  vec2 cell = floor(p / uJoint);
  float slab = h2(cell);
  vec3 con = mix(uConcLo, uConc, 0.5 + 0.5 * slab);
  con *= 0.95 + 0.07 * fbm(p * 0.35);
  con = mix(con, uConcLo * 0.86, smoothstep(0.62, 0.8, fbm(p * 0.02 + 3.0)) * 0.35);
  // tyre scuffs and oil: long soft streaks along Z, and darker spots
  float streak = smoothstep(0.55, 0.85, fbm(vec2(p.x * 0.25, p.y * 0.012))) * (1.0 - smoothstep(0.2, 0.9, px));
  con = mix(con, uConcLo * 0.8, streak * 0.14);
  float spot = smoothstep(0.78, 0.9, fbm(p * 0.09 + 11.0));
  con = mix(con, uConcLo * 0.72, spot * 0.3);
  vec2 g = abs(fract(p / uJoint + 0.5) - 0.5) * uJoint;  // distance to the nearest joint (m)
  float jw = 0.07;
  float line = 1.0 - smoothstep(jw, jw + px * 1.2, min(g.x, g.y));
  line *= 0.32;
  line *= 1.0 - smoothstep(0.08, 0.45, px);              // joints fade out before they alias
  con = mix(con, uJointCol, line * 0.75);
  vec3 col = mix(des, con, conc);
  // the shadows of the high cloud banks drift slowly across the airfield
  float cs = smoothstep(0.5, 0.74, fbm(p * 0.0017 + vec2(uTime * 0.0016, uTime * 0.0006)));
  col *= 1.0 - 0.2 * cs * uShimmer;
  // the far band shimmers with a pale mirage of the sky
  float mir = far * smoothstep(0.55, 1.0, sin(p.y * 0.021 + uTime * 0.05) * 0.5 + 0.5) * 0.18;
  col = mix(col, uHazeLo, mir);
  float f = airFogAt(vW);
  gl_FragColor = vec4(mix(col, airFogCol(vW), f), 1.0);
}`;
const DECAL_VERT = /* glsl */ `
attribute vec3 aCol;
varying vec3 vCol;
varying vec3 vW;
varying vec2 vUv;
void main() {
  mat4 m = modelMatrix;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
#endif
  vec4 wp = m * vec4(position, 1.0);
  vW = wp.xyz;
  vCol = aCol;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DECAL_FRAG = /* glsl */ `
uniform float uMode;     // 0 painted (vertex colour), 1 shadow (texture coverage)
uniform sampler2D uTex;
uniform float uBias;
uniform float uOpacity;
uniform vec3 uShadowCol;
uniform float uProgress; // painted decals: shown where vUv.x <= progress
${FOG_GLSL}
varying vec3 vCol;
varying vec3 vW;
varying vec2 vUv;
void main() {
  float f = airFogAt(vW);
  if (uMode > 0.5) {
    float a = texture2D(uTex, vUv, uBias).r * uOpacity * (1.0 - f);
    gl_FragColor = vec4(uShadowCol, a);
  } else {
    if (vUv.x > uProgress) discard;
    gl_FragColor = vec4(mix(vCol, airFogCol(vW), f), uOpacity);
  }
}`;

// ===================================================================================================================
// THE STAGE CONTEXT (inside the canvas)
// ===================================================================================================================
type StageCtx = { cam: AirCam; S: number; plan: boolean; light: V3; fog: number };
const Ctx = React.createContext<StageCtx | null>(null);
const useStage = () => {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("aircraftShared: a world component was used outside <AirStage world>");
  return c;
};
const setFog = (m: Any, st: StageCtx) => {
  m.uniforms.uFog.value.set(AIR_FOG.near, AIR_FOG.vis, AIR_FOG.max * st.fog, st.plan ? 1 : 0);
};
const fogUniforms = () => ({
  uFog: { value: new THREE.Vector4(AIR_FOG.near, AIR_FOG.vis, AIR_FOG.max, 0) },
  uHazeLo: { value: v3(SKY.haze) },
  uHazeHi: { value: v3(SKY.glow) },
});
const makeJetMat = (mode: number) =>
  new THREE.ShaderMaterial({
    vertexShader: JET_VERT,
    fragmentShader: JET_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      ...fogUniforms(),
      uL: { value: new THREE.Vector3(0, 1, 0) },
      uCream: { value: v3(COLOR.cream) },
      uShade: { value: v3(AIR_COLOR.shadeMul) },
      uBounce: { value: v3(AIR_COLOR.bounce) },
      uDrain: { value: 0 },
      uDrainCol: { value: v3(AIR_COLOR.drain) },
      uStored: { value: 0 },
      uSlide: { value: 1 },
      uMode: { value: mode },
      uGlow: { value: 0 },
      uBright: { value: 1 },
      uCoverCol: { value: v3("#FBF8F0") },
      uMap: { value: null },
      uMap2: { value: null },
      uCov: { value: null },
    },
  });
const setLight = (m: Any, L: V3) => m.uniforms.uL.value.set(L[0], L[1], -L[2]);

// --- geometry and texture caches ---------------------------------------------------------------------------------
const geoCache = new Map<string, Any>();
const toGeo = (key: string, d: MeshData) => {
  const have = geoCache.get(key);
  if (have) return have;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(d.pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(d.nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(d.uv, 2));
  g.setAttribute("aCol", new THREE.BufferAttribute(d.col, 3));
  g.setAttribute("aAux", new THREE.BufferAttribute(d.aux, 4));
  g.setIndex(new THREE.BufferAttribute(d.idx, 1));
  g.computeBoundingSphere();
  geoCache.set(key, g);
  return g;
};
const texCache = new Map<string, Any>();
const canvasTex = (key: string, make: () => HTMLCanvasElement, aniso = 8) => {
  const have = texCache.get(key);
  if (have) return have;
  const t = new THREE.CanvasTexture(make());
  t.flipY = false;
  t.anisotropy = aniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  texCache.set(key, t);
  return t;
};
const jetGeos = (type: JetType, det: Detail) => {
  const b = buildJet(type, det);
  return {
    skin: toGeo(`${type}:${det}:skin`, b.skin),
    fin: toGeo(`${type}:${det}:fin`, b.fin),
    parts: toGeo(`${type}:${det}:parts`, b.parts),
    gear: toGeo(`${type}:${det}:gear`, b.gear),
    covers: toGeo(`${type}:${det}:covers`, b.covers),
  };
};
/** the jet's planform, blurred: its soft contact shadow (cached per type) */
const SHADOW_PX = 6;
const SHADOW_PAD = 7;
const shadowTex = (type: JetType) =>
  canvasTex(
    `${type}:shadow`,
    () => {
      const b = buildJet(type, "lo");
      const sp = SPECS[type];
      const span = sp.overall.span;
      const wM = sp.L + 2 * SHADOW_PAD;
      const hM = span + 2 * SHADOW_PAD + 4;
      const cw = Math.ceil(wM * SHADOW_PX);
      const ch = Math.ceil(hM * SHADOW_PX);
      const a = document.createElement("canvas");
      a.width = cw;
      a.height = ch;
      const ctx = a.getContext("2d") as CanvasRenderingContext2D;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = "#fff";
      ctx.setTransform(SHADOW_PX, 0, 0, SHADOW_PX, cw / 2, ch / 2);
      const t = b.plan;
      // one small path per triangle batch (one huge path of thousands of subpaths fills unreliably)
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 0.3;
      for (let i0 = 0; i0 < t.length; i0 += 6 * 200) {
        ctx.beginPath();
        for (let i = i0; i < Math.min(t.length, i0 + 6 * 200); i += 6) {
          ctx.moveTo(-t[i], t[i + 1]);
          ctx.lineTo(-t[i + 2], t[i + 3]);
          ctx.lineTo(-t[i + 4], t[i + 5]);
          ctx.closePath();
        }
        ctx.fill("nonzero");
        ctx.stroke();
      }
      const o = document.createElement("canvas");
      o.width = cw;
      o.height = ch;
      const oc = o.getContext("2d") as CanvasRenderingContext2D;
      oc.filter = `blur(${SHADOW_PX * 0.9}px)`;
      oc.drawImage(a, 0, 0);
      return o;
    },
    4,
  );
const shadowGeo = (type: JetType) => {
  const key = `${type}:shadowquad`;
  const have = geoCache.get(key);
  if (have) return have;
  const sp = SPECS[type];
  const g = new THREE.PlaneGeometry(sp.L + 2 * SHADOW_PAD, sp.overall.span + 2 * SHADOW_PAD + 4);
  g.rotateX(-Math.PI / 2);
  // the canvas: x = -local x (nose to the left of the canvas), y = local z
  const uv = g.attributes.uv;
  const pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    uv.setXY(i, 0.5 - lx / (sp.L + 2 * SHADOW_PAD), 0.5 + lz / (sp.overall.span + 2 * SHADOW_PAD + 4));
  }
  uv.needsUpdate = true;
  g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
  geoCache.set(key, g);
  return g;
};
const makeDecalMat = (mode: number) => {
  const m = new THREE.ShaderMaterial({
    vertexShader: DECAL_VERT,
    fragmentShader: DECAL_FRAG,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: {
      ...fogUniforms(),
      uMode: { value: mode },
      uTex: { value: null },
      uBias: { value: 0 },
      uOpacity: { value: 1 },
      uShadowCol: { value: v3(COLOR.shadow) },
      uProgress: { value: 2 },
    },
  });
  return m;
};

// ===================================================================================================================
// JETS
// ===================================================================================================================
export const JET_DIMS = (Object.keys(SPECS) as JetType[]).reduce(
  (o, t) => ({ ...o, [t]: { length: SPECS[t].overall.length, span: SPECS[t].overall.span, height: SPECS[t].overall.height, L: SPECS[t].L } }),
  {} as Record<JetType, { length: number; span: number; height: number; L: number }>,
);
export const JET_POINTS = (Object.keys(SPECS) as JetType[]).reduce((o, t) => ({ ...o, [t]: jetPoints(t) }), {} as Record<JetType, ReturnType<typeof jetPoints>>);
/** a LOCAL point (x forward, y up, z starboard; see JET_POINTS) of a jet placed at `at` with `heading` -> world [X, Y, Z] */
export const jetPoint = (type: JetType, at: [number, number], heading: number, local: V3, alt = 0, pitch = 0): V3 => {
  void type;
  const h = heading * D2R;
  const pr = pitch * D2R;
  // pitch about the local origin (the fuselage centre at ground level)
  const lx = local[0] * Math.cos(pr) - local[1] * Math.sin(pr);
  const ly = local[0] * Math.sin(pr) + local[1] * Math.cos(pr);
  const fwd: V3 = [Math.sin(h), 0, Math.cos(h)];
  const rgt: V3 = [Math.cos(h), 0, -Math.sin(h)];
  return [at[0] + fwd[0] * lx + rgt[0] * local[2], ly + alt, at[1] + fwd[2] * lx + rgt[2] * local[2]];
};

export type JetProps = {
  type: JetType;
  airline: Airline;
  /** [X, Z] of the fuselage centre on the ground (m) */
  at: [number, number];
  /** deg: 0 nose away (+Z), 90 right, -90 left (default), 180 toward the camera */
  heading?: number;
  /** height above the ground (m) */
  alt?: number;
  /** nose-up pitch (deg) */
  pitch?: number;
  /** 0..1: toned into the haze (parked, retired) */
  drain?: number;
  /** 0..1: storage covers wiped on, chocks slid in */
  stored?: number;
  /** the landing gear (default: down when alt < 30 m) */
  gear?: boolean;
  /** "hi" (default), "lo" (fields, far), "auto" (by projected size: only for jets that do not change size) */
  detail?: Detail | "auto";
  /** contact shadow strength 0..1 (default 1) */
  shadow?: number;
};
type JetObj = { group: Any; inner: Any; meshes: Record<string, Any>; mats: Record<string, Any>; shadow: Any; shadowMat: Any };
const makeJetObj = (type: JetType, airline: Airline, det: Detail): JetObj => {
  const g = jetGeos(type, det);
  const mats = { skin: makeJetMat(1), fin: makeJetMat(2), parts: makeJetMat(0), gear: makeJetMat(0), covers: makeJetMat(3) };
  mats.skin.uniforms.uMap.value = canvasTex(`${type}:${airline}:skin`, () => paintSkin(type, airline));
  mats.skin.uniforms.uCov.value = canvasTex(`${type}:covers`, () => paintCovers(type), 2);
  mats.fin.uniforms.uMap.value = canvasTex(`${type}:${airline}:finP`, () => paintFin(type, airline, false));
  mats.fin.uniforms.uMap2.value = canvasTex(`${type}:${airline}:finS`, () => paintFin(type, airline, true));
  mats.fin.uniforms.uGlow.value = airline === "united" ? 1 : 0;
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  const meshes: Record<string, Any> = {};
  for (const k of ["skin", "fin", "parts", "gear", "covers"] as const) {
    const m = new THREE.Mesh(g[k], mats[k]);
    m.frustumCulled = false;
    inner.add(m);
    meshes[k] = m;
  }
  const shadowMat = makeDecalMat(1);
  shadowMat.uniforms.uTex.value = shadowTex(type);
  const shadow = new THREE.Mesh(shadowGeo(type), shadowMat);
  shadow.frustumCulled = false;
  shadow.renderOrder = -1;
  return { group, inner, meshes, mats, shadow, shadowMat };
};
const updateJetObj = (o: JetObj, p: JetProps, st: StageCtx) => {
  const sp = SPECS[p.type];
  const heading = p.heading ?? -90;
  const alt = p.alt ?? 0;
  const pitch = p.pitch ?? 0;
  o.group.position.set(p.at[0], alt, -p.at[1]);
  o.group.rotation.set(0, (90 - heading) * D2R, 0);
  // pitch about the main gear
  const mg = sp.gear.main[0].s * sp.L;
  const px = sp.L / 2 - mg;
  o.inner.position.set(px, 0, 0);
  o.inner.rotation.set(0, 0, pitch * D2R);
  for (const m of o.inner.children) m.position.set(-px, 0, 0);
  o.meshes.gear.visible = p.gear ?? alt < 30;
  const stored = c01(p.stored ?? 0);
  o.meshes.covers.visible = stored > 0.001 && o.meshes.gear.visible;
  for (const k of Object.keys(o.mats)) {
    const m = o.mats[k];
    setFog(m, st);
    setLight(m, st.light);
    m.uniforms.uDrain.value = c01(p.drain ?? 0) * (k === "covers" ? 0.35 : 1);
    m.uniforms.uStored.value = stored;
    m.uniforms.uSlide.value = 1 - c01((stored - 0.35) / 0.4) * c01((stored - 0.35) / 0.4) * (3 - 2 * c01((stored - 0.35) / 0.4));
  }
  // the contact shadow: under the jet, pushed along the sun by its height (+ a little for the body's own height)
  const L = st.light;
  const hEff = alt + (st.plan ? 4 : 2.5);
  const dx = (-L[0] / L[1]) * hEff;
  const dz = (-L[2] / L[1]) * hEff;
  o.shadow.position.set(p.at[0] + dx, 0.06, -(p.at[1] + dz));
  o.shadow.rotation.set(0, (90 - heading) * D2R, 0);
  const s = 1 + alt * 0.004;
  o.shadow.scale.set(s, 1, s);
  setFog(o.shadowMat, st);
  o.shadowMat.uniforms.uBias.value = Math.min(4, Math.log2(1 + alt / 6));
  o.shadowMat.uniforms.uOpacity.value = (p.shadow ?? 1) * 0.5 * Math.exp(-alt / 220) * (1 - 0.35 * c01(p.drain ?? 0));
};
/** One airliner in the world (inside <AirStage world>). */
export const Jet: React.FC<JetProps> = (p) => {
  const st = useStage();
  // default "hi": an automatic switch would pop the geometry mid-move; "auto" picks once by size (still jets only)
  let det: Detail = "hi";
  if (p.detail === "lo") det = "lo";
  else if (p.detail === "auto") {
    const pr = airProject(st.cam, [p.at[0], p.alt ?? 0, p.at[1]]);
    det = pr.s * SPECS[p.type].L < 260 ? "lo" : "hi";
  }
  const o = useMemo(() => makeJetObj(p.type, p.airline, det), [p.type, p.airline, det]);
  updateJetObj(o, p, st);
  return (
    <>
      <primitive object={o.shadow} />
      <primitive object={o.group} />
    </>
  );
};

// --- shorthands ----------------------------------------------------------------------------------------------------
type Side = Omit<JetProps, "type" | "heading"> & { facing?: "left" | "right"; yaw?: number; heading?: number };
const sideHeading = (p: Side) => p.heading ?? (p.facing === "right" ? 90 - (p.yaw ?? 0) : -90 + (p.yaw ?? 0));
export const B787: React.FC<Side & { variant?: "9" | "10" }> = ({ variant = "10", ...p }) => <Jet {...p} type={variant === "9" ? "B787_9" : "B787_10"} heading={sideHeading(p)} />;
export const B777: React.FC<Side> = (p) => <Jet {...p} type="B777" heading={sideHeading(p)} />;
export const B747: React.FC<Side> = (p) => <Jet {...p} type="B747" heading={sideHeading(p)} />;
export const A380: React.FC<Side> = (p) => <Jet {...p} type="A380" heading={sideHeading(p)} />;
export const A340: React.FC<Side> = (p) => <Jet {...p} type="A340" heading={sideHeading(p)} />;
export const A330: React.FC<Side> = (p) => <Jet {...p} type="A330" heading={sideHeading(p)} />;
export const B737MAX: React.FC<Side> = (p) => <Jet {...p} type="B737MAX" heading={sideHeading(p)} />;
export const A321: React.FC<Side> = (p) => <Jet {...p} type="A321" heading={sideHeading(p)} />;
type Plan = Omit<JetProps, "type">;
export const B787Plan: React.FC<Plan & { variant?: "9" | "10" }> = ({ variant = "9", ...p }) => <Jet {...p} type={variant === "10" ? "B787_10" : "B787_9"} heading={p.heading ?? 0} />;
export const B737Plan: React.FC<Plan> = (p) => <Jet {...p} type="B737MAX" heading={p.heading ?? 0} />;
export const A321Plan: React.FC<Plan> = (p) => <Jet {...p} type="A321" heading={p.heading ?? 0} />;

// --- fields (instanced) --------------------------------------------------------------------------------------------
export type FieldItem = { at: [number, number]; heading?: number; alt?: number };
/** Many jets of one type and airline in one draw per part (cut 3's grids): no gear, contact shadows included. */
export const JetField: React.FC<{ type: JetType; airline: Airline; items: FieldItem[]; drain?: number; detail?: Detail; shadow?: number }> = ({ type, airline, items, drain = 0, detail = "lo", shadow = 1 }) => {
  const st = useStage();
  const n = items.length;
  const o = useMemo(() => {
    const g = jetGeos(type, detail);
    const mats = { skin: makeJetMat(1), fin: makeJetMat(2), parts: makeJetMat(0) };
    mats.skin.uniforms.uMap.value = canvasTex(`${type}:${airline}:skin`, () => paintSkin(type, airline));
    mats.skin.uniforms.uCov.value = canvasTex(`${type}:covers`, () => paintCovers(type), 2);
    mats.fin.uniforms.uMap.value = canvasTex(`${type}:${airline}:finP`, () => paintFin(type, airline, false));
    mats.fin.uniforms.uMap2.value = canvasTex(`${type}:${airline}:finS`, () => paintFin(type, airline, true));
    mats.fin.uniforms.uGlow.value = airline === "united" ? 1 : 0;
    const meshes = (["skin", "fin", "parts"] as const).map((k) => {
      const m = new THREE.InstancedMesh(g[k], mats[k], Math.max(1, n));
      m.frustumCulled = false;
      return m;
    });
    const smat = makeDecalMat(1);
    smat.uniforms.uTex.value = shadowTex(type);
    const sh = new THREE.InstancedMesh(shadowGeo(type), smat, Math.max(1, n));
    sh.frustumCulled = false;
    sh.renderOrder = -1;
    return { mats, meshes, sh, smat };
  }, [type, airline, detail, n]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S1 = new THREE.Vector3(1, 1, 1);
  const L = st.light;
  items.forEach((it, i) => {
    const h = it.heading ?? 0;
    const alt = it.alt ?? 0;
    E.set(0, (90 - h) * D2R, 0);
    Q.setFromEuler(E);
    M.compose(new THREE.Vector3(it.at[0], alt, -it.at[1]), Q, S1);
    for (const m of o.meshes) m.setMatrixAt(i, M);
    const hEff = alt + (st.plan ? 4 : 2.5);
    M.compose(new THREE.Vector3(it.at[0] + (-L[0] / L[1]) * hEff, 0.06, -(it.at[1] + (-L[2] / L[1]) * hEff)), Q, S1);
    o.sh.setMatrixAt(i, M);
  });
  for (const m of [...o.meshes, o.sh]) {
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  }
  for (const k of Object.keys(o.mats)) {
    const m = (o.mats as Record<string, Any>)[k];
    setFog(m, st);
    setLight(m, L);
    m.uniforms.uDrain.value = drain;
  }
  setFog(o.smat, st);
  o.smat.uniforms.uOpacity.value = 0.5 * shadow;
  return (
    <>
      <primitive object={o.sh} />
      {o.meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
};

// ===================================================================================================================
// GROUND, MARKINGS
// ===================================================================================================================
export type GroundSpec = { aprons: [number, number, number, number][]; joints?: number };
const Ground: React.FC<{ spec: GroundSpec; shimmer: number }> = ({ spec, shimmer }) => {
  const st = useStage();
  const o = useMemo(() => {
    const geo = new THREE.PlaneGeometry(160000, 160000);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: GROUND_VERT,
      fragmentShader: GROUND_FRAG,
      uniforms: {
        ...fogUniforms(),
        uAprons: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)) },
        uNA: { value: 0 },
        uJoint: { value: 7.5 },
        uTime: { value: 0 },
        uShimmer: { value: 1 },
        uConc: { value: v3(AIR_COLOR.concrete) },
        uConcLo: { value: v3(AIR_COLOR.concreteLo) },
        uJointCol: { value: v3(AIR_COLOR.joint) },
        uDes: { value: v3(AIR_COLOR.desert) },
        uDesLo: { value: v3(AIR_COLOR.desertLo) },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -3;
    return { mesh, mat };
  }, []);
  const u = o.mat.uniforms;
  spec.aprons.slice(0, 8).forEach((a, i) => u.uAprons.value[i].set(Math.min(a[0], a[2]), Math.min(a[1], a[3]), Math.max(a[0], a[2]), Math.max(a[1], a[3])));
  u.uNA.value = Math.min(8, spec.aprons.length);
  u.uJoint.value = spec.joints ?? 7.5;
  u.uTime.value = st.S;
  u.uShimmer.value = shimmer;
  setFog(o.mat, st);
  return <primitive object={o.mesh} />;
};
/** quads on the ground, built from [X, Z] corner lists, with a colour and a progress coordinate (0..1) */
type Quad = { pts: [number, number][]; col: string; t: number };
const decalGeo = (quads: Quad[], y = 0.04) => {
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (const q of quads) {
    const b = pos.length / 3;
    const c = hex3(q.col);
    for (const p of q.pts) {
      pos.push(p[0], y, -p[1]);
      col.push(c[0], c[1], c[2]);
      uv.push(q.t, 0);
    }
    for (let k = 1; k + 1 < q.pts.length; k++) idx.push(b, b + k, b + k + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  return g;
};
const rectAlong = (cx: number, cz: number, hd: number, a0: number, a1: number, b0: number, b1: number): [number, number][] => {
  // a along the heading, b across it (to the right)
  const h = hd * D2R;
  const f: [number, number] = [Math.sin(h), Math.cos(h)];
  const r: [number, number] = [Math.cos(h), -Math.sin(h)];
  const P = (a: number, b: number): [number, number] => [cx + f[0] * a + r[0] * b, cz + f[1] * a + r[1] * b];
  return [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)];
};
const PaintedDecal: React.FC<{ quads: Quad[]; progress?: number; opacity?: number; y?: number; order?: number }> = ({ quads, progress = 2, opacity = 1, y = 0.04, order = -2 }) => {
  const st = useStage();
  const key = JSON.stringify(quads.length) + quads.map((q) => q.pts.map((p) => p.join(",")).join(";") + q.col).join("|");
  const o = useMemo(() => {
    const mesh = new THREE.Mesh(decalGeo(quads, y), makeDecalMat(0));
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    return mesh;
  }, [key, y, order]);
  setFog(o.material, st);
  o.material.uniforms.uProgress.value = progress;
  o.material.uniforms.uOpacity.value = opacity;
  return <primitive object={o} />;
};
/**
 * Runway — an asphalt strip with its paint: threshold piano keys at both ends, the centreline dashes (30 m dash, 20 m
 * gap), edge lines, the aiming-point blocks and touchdown-zone bars. `at` = its centre, `heading` along it (the near
 * threshold is at the -heading end). paint: "cream" (default) or "amber" (cut 5: the runway that counts); progress
 * 0..1 paints the markings from the near threshold onward.
 */
export const Runway: React.FC<{ at: [number, number]; heading: number; length?: number; width?: number; paint?: "cream" | "amber"; progress?: number; asphalt?: boolean }> = ({
  at,
  heading,
  length = 3000,
  width = 45,
  paint = "cream",
  progress = 2,
  asphalt = true,
}) => {
  const col = paint === "amber" ? COLOR.amberTop : AIR_COLOR.paint;
  const L2 = length / 2;
  const marks: Quad[] = [];
  const tOf = (a: number) => (a + L2) / length;
  const add = (a0: number, a1: number, b0: number, b1: number) => marks.push({ pts: rectAlong(at[0], at[1], heading, a0, a1, b0, b1), col, t: tOf((a0 + a1) / 2) });
  // edge lines
  for (let a = -L2; a < L2; a += 60) {
    add(a, Math.min(L2, a + 60), -width / 2 + 0.3, -width / 2 + 1.2);
    add(a, Math.min(L2, a + 60), width / 2 - 1.2, width / 2 - 0.3);
  }
  for (const end of [-1, 1]) {
    const base = end * L2;
    const into = -end;
    // threshold keys
    const n = 8;
    const kw = 1.8;
    for (let i = 0; i < n; i++) {
      const b = -width / 2 + 3 + i * ((width - 6) / n) + (i >= n / 2 ? 1.6 : 0) - 0.8;
      add(base + into * 6, base + into * 36, b, b + kw);
    }
    // aiming point blocks (400 m in) and touchdown bars
    add(base + into * 400, base + into * 460, -9, -3);
    add(base + into * 400, base + into * 460, 3, 9);
    for (const m of [150, 300, 600, 750]) {
      for (const s of [-1, 1]) add(base + into * m, base + into * (m + 22), s * 4, s * 7);
    }
  }
  // centreline dashes
  for (let a = -L2 + 100; a < L2 - 100; a += 50) add(a, a + 30, -0.45, 0.45);
  const strip: Quad[] = asphalt ? [{ pts: rectAlong(at[0], at[1], heading, -L2 - 20, L2 + 20, -width / 2 - 4, width / 2 + 4), col: AIR_COLOR.asphalt, t: 0 }] : [];
  return (
    <>
      {asphalt ? <PaintedDecal quads={strip} y={0.02} order={-2.5} /> : null}
      <PaintedDecal quads={marks} progress={progress} y={0.05} order={-2} />
    </>
  );
};
/** TaxiLine — a painted line on the ground through world [X, Z] points (solid, or dashed every `dash` m). */
export const TaxiLine: React.FC<{ pts: [number, number][]; width?: number; paint?: "cream" | "amber"; dash?: number; progress?: number }> = ({ pts, width = 0.45, paint = "cream", dash = 0, progress = 2 }) => {
  const col = paint === "amber" ? COLOR.amberTop : AIR_COLOR.paint;
  const quads: Quad[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, z0] = pts[i - 1];
    const [x1, z1] = pts[i];
    const l = Math.hypot(x1 - x0, z1 - z0);
    const hd = Math.atan2(x1 - x0, z1 - z0) / D2R;
    const step = dash > 0 ? dash * 2 : l;
    for (let a = 0; a < l; a += step) {
      const a1 = Math.min(l, a + (dash > 0 ? dash : l));
      quads.push({ pts: rectAlong(x0, z0, hd, a, a1, -width / 2, width / 2), col, t: (acc + (a + a1) / 2) / total });
    }
    acc += l;
  }
  return <PaintedDecal quads={quads} progress={progress} y={0.045} />;
};

// ===================================================================================================================
// THE HANGAR
// ===================================================================================================================
const HANGAR_COL = {
  wall: "#C9B79C",
  wallLo: "#A8967D",
  roof: "#8A7864",
  pier: "#BFAD92",
  door: "#B7A68C",
  doorLine: "#9A8970",
  inFloor: "#D9B47F",
  inWall: "#A88761",
  inWallLit: "#EFCB92",
  inCeil: "#5F4A38",
  beam: "#4A3A2C",
  lamp: "#FFF4DC",
  fascia: "#8E7B63",
} as const;
type BoxSpec = { c: V3; s: V3; col: string; mode?: number; bright?: number };
const boxesGeo = (boxes: BoxSpec[]) => {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (const b of boxes) {
    const [cx, cy, cz] = b.c;
    const [sx, sy, sz] = b.s.map((v) => v / 2);
    const c = hex3(b.col);
    const faces: { n: V3; u: V3; v: V3 }[] = [
      { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
      { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
      { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
      { n: [0, -1, 0], u: [0, 0, 1], v: [1, 0, 0] },
      { n: [0, 0, 1], u: [0, 1, 0], v: [1, 0, 0] },
      { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
    ];
    for (const f of faces) {
      const base = pos.length / 3;
      const ctr: V3 = [cx + f.n[0] * sx, cy + f.n[1] * sy, cz + f.n[2] * sz];
      const U: V3 = [f.u[0] * sx, f.u[1] * sy, f.u[2] * sz];
      const Vv: V3 = [f.v[0] * sx, f.v[1] * sy, f.v[2] * sz];
      for (const [a, bb] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        pos.push(ctr[0] + U[0] * a + Vv[0] * bb, ctr[1] + U[1] * a + Vv[1] * bb, ctr[2] + U[2] * a + Vv[2] * bb);
        nor.push(...f.n);
        col.push(...c);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("aAux", new THREE.BufferAttribute(new Float32Array((pos.length / 3) * 4), 4));
  g.setIndex(idx);
  return g;
};
/** The hangar's layout in its LOCAL frame: x along the façade (right, seen from outside), y up, z INTO the building. */
export const HANGAR = { width: 300, height: 38, depth: 210, bays: 3, doorW: 72, doorH: 27, pier: 30, panels: 3, wallT: 3 } as const;
const bayCentres = () => {
  const { width, bays, doorW, pier } = HANGAR;
  const used = bays * doorW + (bays - 1) * pier;
  const x0 = -used / 2 + doorW / 2;
  void width;
  return Array.from({ length: bays }, (_, i) => x0 + i * (doorW + pier));
};
const hangarStatic = () => {
  const { width, height, depth, doorW, doorH, wallT } = HANGAR;
  const out: BoxSpec[] = [];
  const bc = bayCentres();
  // the façade: the lintel over the doors, the piers and ends
  out.push({ c: [0, (doorH + height) / 2, wallT / 2], s: [width, height - doorH, wallT], col: HANGAR_COL.wall });
  const edges: number[] = [-width / 2];
  for (const c of bc) edges.push(c - doorW / 2, c + doorW / 2);
  edges.push(width / 2);
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    out.push({ c: [(a + b) / 2, doorH / 2, wallT / 2], s: [b - a, doorH, wallT], col: HANGAR_COL.pier });
  }
  // the shell: roof (with a raised clerestory over the bays), sides, back
  out.push({ c: [0, height + 1, depth / 2], s: [width + 2, 2, depth + 2], col: HANGAR_COL.roof });
  out.push({ c: [0, height + 4.5, depth * 0.55], s: [width * 0.72, 5, depth * 0.6], col: HANGAR_COL.wallLo });
  out.push({ c: [0, height + 7.3, depth * 0.55], s: [width * 0.72 + 1, 0.8, depth * 0.6 + 1], col: HANGAR_COL.roof });
  out.push({ c: [-width / 2, height / 2, depth / 2], s: [wallT, height, depth], col: HANGAR_COL.wallLo });
  out.push({ c: [width / 2, height / 2, depth / 2], s: [wallT, height, depth], col: HANGAR_COL.wallLo });
  out.push({ c: [0, height / 2, depth], s: [width, height, wallT], col: HANGAR_COL.wallLo });
  // ribs on the façade (horizontal cladding bands) and a roof parapet
  for (const y of [doorH + 2.2, height - 1.2]) out.push({ c: [0, y, -0.3], s: [width, 0.6, 0.6], col: HANGAR_COL.wallLo });
  // the fascia: a darker band along the top of the façade
  out.push({ c: [0, height - 2.6, -0.4], s: [width + 0.4, 2.2, 0.5], col: HANGAR_COL.fascia });
  // the door heads' track beams and the piers' vertical ribs
  for (const c of bc) out.push({ c: [c, doorH + 0.6, -1.4], s: [doorW + 2 * 13, 1.2, 2.2], col: HANGAR_COL.wallLo });
  for (let x = -width / 2 + 3; x < width / 2; x += 6) {
    if (bc.some((c) => Math.abs(x - c) < doorW / 2 + 1)) continue;
    out.push({ c: [x, doorH / 2, -0.15], s: [0.35, doorH, 0.3], col: HANGAR_COL.wallLo });
  }
  return out;
};
const hangarInterior = () => {
  const { width, height, depth, wallT } = HANGAR;
  const out: BoxSpec[] = [];
  const iw = width - 2 * wallT - 1;
  // the lit inside: floor, back wall, ceiling, with rows of lamps
  out.push({ c: [0, 0.05, depth / 2], s: [iw, 0.1, depth - 4], col: HANGAR_COL.inFloor });
  out.push({ c: [0, height / 2, depth - wallT / 2 - 1], s: [iw, height, 0.5], col: HANGAR_COL.inWall });
  out.push({ c: [0, height - 0.3, depth / 2], s: [iw, 0.4, depth - 4], col: HANGAR_COL.inCeil });
  for (const sd of [-1, 1]) out.push({ c: [sd * (iw / 2 - 0.3), height / 2, depth / 2], s: [0.5, height, depth - 4], col: HANGAR_COL.inWall });
  // the bays' inner walls (between the doors, running back), so each door opens into its own lit bay
  for (const c of bayCentres().slice(0, -1)) {
    const x = c + HANGAR.doorW / 2 + HANGAR.pier / 2;
    out.push({ c: [x, height / 2, depth / 2 + 2], s: [HANGAR.pier - 2, height, depth - 8], col: HANGAR_COL.inWall });
  }
  // the back wall's lit band, roof trusses across the bays, rows of lamps
  out.push({ c: [0, height * 0.42, depth - wallT / 2 - 1.4], s: [iw, height * 0.38, 0.3], col: HANGAR_COL.inWallLit });
  for (let z = 10; z < depth - 6; z += 18) out.push({ c: [0, height - 2.4, z], s: [iw, 2.2, 1.2], col: HANGAR_COL.beam });
  for (let x = -iw / 2 + 14; x < iw / 2; x += 26) for (let z = 16; z < depth - 8; z += 18) out.push({ c: [x, height - 3.7, z], s: [5, 0.5, 2], col: HANGAR_COL.lamp });
  return out;
};
export type HangarProps = { at: [number, number]; heading: number; doors?: number };
/** world <- hangar local (x along the façade to the right seen from outside, z into the building) */
export const hangarToWorld = (at: [number, number], heading: number, local: V3): V3 => {
  // the façade's outward normal points along `heading`; local +z is the opposite (inward); local +x = right seen
  // from outside (facing the façade, i.e. looking along -normal)
  const h = heading * D2R;
  const nrmV: [number, number] = [Math.sin(h), Math.cos(h)];
  const rightV: [number, number] = [-Math.cos(h), Math.sin(h)];
  return [at[0] + rightV[0] * local[0] - nrmV[0] * local[2], local[1], at[1] + rightV[1] * local[0] - nrmV[1] * local[2]];
};
/** Hangar — the final-assembly hangar: a long low shell, three huge door bays whose panels telescope aside, warm
 *  light inside. `at` = the façade's centre on the ground, `heading` = the way the doors face. */
export const Hangar: React.FC<HangarProps> = ({ at, heading, doors = 0 }) => {
  const st = useStage();
  const o = useMemo(() => {
    const group = new THREE.Group();
    const lit = makeJetMat(0);
    const glow = makeJetMat(4);
    glow.uniforms.uBright.value = 1.0;
    const shell = new THREE.Mesh(boxesGeo(hangarStatic()), lit);
    const inside = new THREE.Mesh(boxesGeo(hangarInterior()), glow);
    group.add(shell, inside);
    // door panels: per bay, `panels` each side; each its own mesh so it can slide
    const panelMat = makeJetMat(0);
    const panels: { mesh: Any; closedX: number; openX: number }[] = [];
    const { doorW, doorH, panels: np } = HANGAR;
    const pw = doorW / (2 * np);
    for (const c of bayCentres()) {
      for (const side of [-1, 1]) {
        for (let k = 0; k < np; k++) {
          const boxes: BoxSpec[] = [{ c: [0, doorH / 2, 0], s: [pw + 0.4, doorH - 0.2, 0.8], col: HANGAR_COL.door }];
          for (let r = 1; r < 6; r++) boxes.push({ c: [0, (doorH * r) / 6, -0.45], s: [pw, 0.25, 0.1], col: HANGAR_COL.doorLine });
          boxes.push({ c: [side * (pw / 2 - 0.2), doorH / 2, -0.45], s: [0.3, doorH - 0.4, 0.1], col: HANGAR_COL.doorLine });
          const m = new THREE.Mesh(boxesGeo(boxes), panelMat);
          m.position.z = -0.8 - k * 1.1;
          group.add(m);
          const closedX = c + side * (pw / 2 + k * pw);
          const openX = c + side * (doorW / 2 + pw / 2 + 0.6);
          panels.push({ mesh: m, closedX, openX });
        }
      }
    }
    for (const ch of group.children) ch.frustumCulled = false;
    return { group, mats: [lit, glow, panelMat], panels };
  }, []);
  const d = c01(doors);
  for (const p of o.panels) p.mesh.position.x = lerp(p.closedX, p.openX, d);
  // place: local z into the building = -heading direction; three rotation.y maps local +x/+z
  const h = heading * D2R;
  o.group.position.set(at[0], 0, -at[1]);
  // local axes in world: x -> right (-cos h, sin h) ; z -> inward (-sin h, -cos h). three z = -world Z.
  // rotation.y = theta maps local x (1,0,0) to (cos t, 0, -sin t) = world (cos t, sin t) => cos t = -cos h, sin t = sin h
  o.group.rotation.set(0, Math.atan2(Math.sin(h), -Math.cos(h)), 0);
  // local +z runs INTO the building: a mirror in z (the materials are double-sided; normals stay right)
  o.group.scale.set(1, 1, -1);
  for (const m of o.mats) {
    setFog(m, st);
    setLight(m, st.light);
  }
  // warm light spilling out of the open doors onto the apron
  const spill: React.ReactNode[] = bayCentres().map((c, i) => {
    const a = hangarToWorld(at, heading, [c, 0, -1]);
    return <LightSpill key={i} at={[a[0], a[2]]} heading={heading} width={HANGAR.doorW} reach={230} amount={0.9 * d} color="#FFD99C" />;
  });
  return (
    <>
      {spill}
      <primitive object={o.group} />
    </>
  );
};
const spillTex = () =>
  canvasTex(
    "spill",
    () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      const x = c.getContext("2d") as CanvasRenderingContext2D;
      x.fillStyle = "#000";
      x.fillRect(0, 0, 256, 256);
      // a trapezoid widening away from the door (v 0 = the door), fading with distance; soft sides
      const o = document.createElement("canvas");
      o.width = 256;
      o.height = 256;
      const y = o.getContext("2d") as CanvasRenderingContext2D;
      const g = y.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.5, "rgba(255,255,255,0.6)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      y.fillStyle = g;
      y.beginPath();
      y.moveTo(60, 0);
      y.lineTo(196, 0);
      y.lineTo(246, 256);
      y.lineTo(10, 256);
      y.closePath();
      y.fill();
      x.filter = "blur(10px)";
      x.drawImage(o, 0, 0);
      return c;
    },
    2,
  );
/** a soft pool of warm light on the ground in front of an opening (at = the opening's centre, heading = outward) */
export const LightSpill: React.FC<{ at: [number, number]; heading: number; width: number; reach: number; amount: number; color?: string }> = ({ at, heading, width, reach, amount, color = "#FFE9BE" }) => {
  const st = useStage();
  const o = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(12), 3));
    // uv: u across, v from the door (0) outward (1)
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) + 0.5, 0.5 + pos.getZ(i));
    const m = makeDecalMat(1);
    m.uniforms.uTex.value = spillTex();
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1.5;
    return mesh;
  }, []);
  const h = heading * D2R;
  // centre half a reach out from the opening; local -z (three) = outward
  const cx = at[0] + Math.sin(h) * reach * 0.5;
  const cz = at[1] + Math.cos(h) * reach * 0.5;
  o.position.set(cx, 0.07, -cz);
  o.rotation.set(0, -h + Math.PI, 0);
  o.scale.set(width * 1.15, 1, reach);
  const m = o.material;
  setFog(m, st);
  m.uniforms.uShadowCol.value.set(...hex3(color));
  m.uniforms.uOpacity.value = amount;
  o.visible = amount > 0.002;
  return <primitive object={o} />;
};

// ===================================================================================================================
// THE YARD (cuts 1-2)
// ===================================================================================================================
export type YardSlot = { airline: Airline; type: JetType; at: [number, number]; heading: number };
const ROW_HEADING = -90;
const ROW0: [number, number] = [-18, 172];
const ROW_STEP: [number, number] = [46, 122];
const ROW_AIRLINES: [Airline, JetType][] = [
  ["britishAirways", "B747"],
  ["airFrance", "A380"],
  ["qantas", "B747"],
  ["delta", "B777"],
  ["klm", "B747"],
  ["singapore", "A380"],
  ["american", "A330"],
  ["virginAtlantic", "A340"],
];
const HANGAR_AT: [number, number] = [-250, 950];
const HANGAR_HEADING = 168;
const laneFrom = hangarToWorld(HANGAR_AT, HANGAR_HEADING, [0, 0, 150]);
const laneTo = hangarToWorld(HANGAR_AT, HANGAR_HEADING, [0, 0, -1100]);
export const YARD = {
  /** United's jet at the row's front (a 787-10, nose left) */
  united: { airline: "united" as Airline, type: "B787_10" as JetType, at: ROW0, heading: ROW_HEADING },
  /** the parked row, slot 1 (nearest after United) .. 8 (farthest, toward the right horizon) */
  slots: ROW_AIRLINES.map(([airline, type], i) => ({
    airline,
    type,
    at: [ROW0[0] + ROW_STEP[0] * (i + 1), ROW0[1] + ROW_STEP[1] * (i + 1)] as [number, number],
    heading: ROW_HEADING,
  })) as YardSlot[],
  rowHeading: ROW_HEADING,
  rowStep: ROW_STEP,
  hangar: {
    at: HANGAR_AT,
    heading: HANGAR_HEADING,
    width: HANGAR.width,
    height: HANGAR.height,
    doorW: HANGAR.doorW,
    doorH: HANGAR.doorH,
    /** the centre door's corners on the ground (world [X, Z]) */
    door: [hangarToWorld(HANGAR_AT, HANGAR_HEADING, [-HANGAR.doorW / 2, 0, 0]), hangarToWorld(HANGAR_AT, HANGAR_HEADING, [HANGAR.doorW / 2, 0, 0])].map((p) => [p[0], p[2]]) as [number, number][],
  },
  /** the lane: from deep inside the centre bay (s 0, 150 m in) out through the door (s 150) toward the foreground */
  lane: {
    from: [laneFrom[0], laneFrom[2]] as [number, number],
    to: [laneTo[0], laneTo[2]] as [number, number],
    heading: HANGAR_HEADING,
    /** s metres along the lane from inside the hangar (the door is at s 150) */
    doorS: 150,
    at: (s: number): [number, number] => {
      const p = hangarToWorld(HANGAR_AT, HANGAR_HEADING, [0, 0, 150 - s]);
      return [p[0], p[2]];
    },
  },
  apron: [
    [-1100, -200, 1300, 1700],
    [-900, 1700, 400, 2000],
  ] as [number, number, number, number][],
} as const;
/** the yard wide: United lower-middle, the row to the right horizon, the hangar on the left horizon */
export const YARD_CAM_WIDE: SideCam = { mode: "side", x: 0, y: 24, z: 0, f: 1450, horizon: 720 };
/** along the row, mid-way: fins at reading size */
export const YARD_CAM_ROW: SideCam = { mode: "side", x: 150, y: 14, z: 260, f: 1450, horizon: 760, yaw: 8 };
/** close on United's jet (fin and fuselage) */
export const YARD_CAM_UNITED: SideCam = { mode: "side", x: -10, y: 12, z: 50, f: 1450, horizon: 760 };
/** turned toward the hangar and the lane */
export const YARD_CAM_HANGAR: SideCam = { mode: "side", x: -20, y: 26, z: 0, f: 1450, horizon: 720, yaw: -15 };
export const YARD_GROUND: GroundSpec = { aprons: YARD.apron.map((a) => [...a] as [number, number, number, number]) };

type PerSlot = number | ((slot: number) => number);
const perSlot = (v: PerSlot | undefined, i: number) => (v === undefined ? 0 : typeof v === "number" ? v : v(i));
/**
 * Yard — the place of cuts 1-2: the parked row (drain / stored per slot 1..8), United at its front (unitedDrain /
 * unitedStored, default 0), the hangar (doors 0..1), the lane's centreline and the stands' lead-in lines. `hide`
 * leaves out parts a cut draws itself ("united", "row", "hangar", "lines").
 */
export const Yard: React.FC<{ drain?: PerSlot; stored?: PerSlot; doors?: number; unitedDrain?: number; unitedStored?: number; hide?: ("united" | "row" | "hangar" | "lines")[] }> = ({
  drain,
  stored,
  doors = 0,
  unitedDrain = 0,
  unitedStored = 0,
  hide = [],
}) => {
  const has = (k: "united" | "row" | "hangar" | "lines") => hide.indexOf(k) < 0;
  return (
    <>
      {has("lines") ? (
        <>
          <TaxiLine pts={[YARD.lane.at(140), YARD.lane.at(1250)]} width={0.6} />
          {[YARD.united, ...YARD.slots].map((s, i) => {
            const nose = jetPoint(s.type, s.at, s.heading, JET_POINTS[s.type].nose);
            const tail = jetPoint(s.type, s.at, s.heading, JET_POINTS[s.type].tail);
            return <TaxiLine key={i} pts={[[nose[0] - 14, nose[2]], [tail[0] + 6, tail[2]]]} width={0.4} />;
          })}
        </>
      ) : null}
      {has("hangar") ? <Hangar at={YARD.hangar.at} heading={YARD.hangar.heading} doors={doors} /> : null}
      {has("row")
        ? YARD.slots.map((s, i) => <Jet key={i} type={s.type} airline={s.airline} at={s.at} heading={s.heading} drain={perSlot(drain, i + 1)} stored={perSlot(stored, i + 1)} />)
        : null}
      {has("united") ? <Jet type={YARD.united.type} airline="united" at={YARD.united.at} heading={YARD.united.heading} drain={unitedDrain} stored={unitedStored} /> : null}
    </>
  );
};

// ===================================================================================================================
// 2D LAYERS: SKY, SUN, DUST
// ===================================================================================================================
const CLOUDS = [
  { x: 160, h: 620, w: 460, t: 30, a: 0.3, v: 0.16 },
  { x: 860, h: 520, w: 560, t: 24, a: 0.26, v: 0.12 },
  { x: 480, h: 380, w: 680, t: 20, a: 0.28, v: 0.1 },
  { x: 1300, h: 270, w: 520, t: 15, a: 0.24, v: 0.08 },
  { x: 260, h: 170, w: 760, t: 12, a: 0.3, v: 0.06 },
  { x: 1050, h: 820, w: 400, t: 34, a: 0.2, v: 0.2 },
] as const;
const Sky: React.FC<{ cam: SideCam; S: number }> = ({ cam, S }) => {
  const uid = uidOf(useId());
  const hor = horizonRow(cam);
  const yawPx = (cam.yaw ?? 0) * D2R * cam.f;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(hor - 1250)} x2="0" y2={f3(hor)}>
          <stop offset="0" stopColor={SKY.top} />
          <stop offset="0.24" stopColor={SKY.upper} />
          <stop offset="0.46" stopColor={SKY.amber} />
          <stop offset="0.66" stopColor={SKY.mid} />
          <stop offset="0.83" stopColor={SKY.low} />
          <stop offset="0.93" stopColor={SKY.glow} />
          <stop offset="1" stopColor={SKY.haze} />
        </linearGradient>
        <radialGradient id={`${uid}u`} gradientUnits="userSpaceOnUse" cx={f3(230 - yawPx * 0.9)} cy={f3(hor - 320)} r={780}>
          <stop offset="0" stopColor={SKY.sun} stopOpacity="0.72" />
          <stop offset="0.35" stopColor={SKY.sun} stopOpacity="0.24" />
          <stop offset="1" stopColor={SKY.sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-20} y={-20} width={W + 40} height={H + 40} fill={SKY.haze} />
      <rect x={-20} y={-20} width={W + 40} height={Math.max(0, hor + 22)} fill={`url(#${uid}s)`} />
      <rect x={-20} y={-20} width={W + 40} height={Math.max(0, hor + 22)} fill={`url(#${uid}u)`} />
      <g style={{ filter: "blur(16px)" }}>
        {CLOUDS.map((c, i) => {
          const cx = ((((c.x + S * c.v - yawPx * 0.98) % 2700) + 2700) % 2700) - 800;
          return <ellipse key={i} cx={f3(cx)} cy={f3(hor - c.h)} rx={c.w} ry={c.t} fill={c.h > 400 ? SKY.cloudHi : SKY.cloudLo} opacity={c.a} />;
        })}
      </g>
      <rect x={-20} y={f3(hor - 90)} width={W + 40} height={110} fill={SKY.haze} opacity={0.55} style={{ filter: "blur(20px)" }} />
    </svg>
  );
};
/** dust motes drifting in the warm air: three depth layers, parallax against the camera (screen space) */
const Motes: React.FC<{ cam: AirCam; rest: AirCam; S: number; density: number; layer: 0 | 1 | 2 }> = ({ cam, rest, S, density, layer }) => {
  const uid = uidOf(useId());
  const L = [
    { n: 120, r: [1.2, 2.2], a: [0.18, 0.4], par: 0.25, blur: 0 },
    { n: 60, r: [1.8, 3.4], a: [0.22, 0.48], par: 0.6, blur: 0 },
    { n: 10, r: [8, 18], a: [0.06, 0.12], par: 1.4, blur: 1 },
  ][layer];
  const pan =
    cam.mode === "side" && rest.mode === "side"
      ? { x: (((cam.yaw ?? 0) - (rest.yaw ?? 0)) * D2R * cam.f + (cam.x - rest.x) * 6) * L.par, y: -(cam.y - rest.y) * 6 * L.par }
      : cam.mode === "plan" && rest.mode === "plan"
        ? { x: (cam.x - rest.x) * cam.k * L.par * 0.1, y: -(cam.z - rest.z) * cam.k * L.par * 0.1 }
        : { x: 0, y: 0 };
  const n = Math.round(L.n * density);
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const hh = layer * 1000 + i * 7.13;
    const sp = 0.6 + 0.8 * hash01(hh + 3.1);
    const x = ((((hash01(hh) * 1300 + S * 0.35 * sp + 6 * Math.sin(S * 0.03 + hh) - pan.x) % 1300) + 1300) % 1300) - 110;
    const y = ((((hash01(hh + 1.7) * 2100 - S * 0.08 * sp + 5 * Math.sin(S * 0.021 + hh * 2) - pan.y) % 2100) + 2100) % 2100) - 90;
    const r = lerp(L.r[0], L.r[1], hash01(hh + 6.6));
    const a = lerp(L.a[0], L.a[1], hash01(hh + 8.8)) * (0.55 + 0.45 * (1 - y / H));
    dots.push(<circle key={i} cx={f3(x)} cy={f3(y)} r={f3(r)} fill={`url(#${uid}g)`} opacity={f3(a)} />);
  }
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, filter: L.blur ? "blur(2px)" : undefined }}>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor={COLOR.inkCream} stopOpacity="1" />
          <stop offset="0.5" stopColor={COLOR.inkCream} stopOpacity="0.7" />
          <stop offset="1" stopColor={COLOR.inkCream} stopOpacity="0" />
        </radialGradient>
      </defs>
      {dots}
    </svg>
  );
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const CameraRig: React.FC<{ cam: AirCam }> = ({ cam }) => {
  const { camera } = useThree();
  const q = toPin(cam);
  const c = camera as Any;
  c.fov = (2 * Math.atan(960 / q.f) * 180) / Math.PI;
  c.aspect = W / H;
  if (cam.mode === "plan") {
    c.near = PLAN_EYE - 3000;
    c.far = PLAN_EYE + 200;
  } else {
    c.near = cam.near ?? 3;
    c.far = 90000;
  }
  c.position.set(q.x, q.y, -q.z);
  c.rotation.order = "YXZ";
  c.rotation.set(-q.pitch * D2R, -q.yaw * D2R, 0);
  c.setViewOffset(W, H, 0, 960 - q.horizon, W, H);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  return null;
};
export type AirStageProps = {
  cam: AirCam;
  /** story clock (frames): clouds, dust, shimmer */
  S: number;
  /** the cut's opening camera (parallax origin of the dust) */
  rest?: AirCam;
  /** the 3D world: <Jet>, <Yard>, <Runway>, <Hangar>, <JetField>, <TaxiLine> ... */
  world?: React.ReactNode;
  ground?: GroundSpec | null;
  /** screen-px layers above the 3D (pin them with airProject) */
  overlay?: React.ReactNode;
  /** screen-px layers between the sky and the 3D (things at infinity) */
  under?: React.ReactNode;
  sky?: boolean;
  motes?: number;
  grade?: number;
  grain?: number;
  vignette?: number;
  /** the fixed amber bloom (stout bloomFilter recipe, isolated to amber pixels) */
  bloom?: number;
  shimmer?: number;
  /** scales the distance fog (1 = the clip's air; 0 = none, for diagrams) */
  fog?: number;
  /** keep amber at its stout colour through the grade and the sun veil (a second, amber-masked copy of the world and
   *  the overlay above the grade; default true) */
  amberKeep?: boolean;
};
export const AirStage: React.FC<AirStageProps> = ({ cam, S, rest, world, ground = YARD_GROUND, overlay, under, sky = true, motes = 1, grade = 1, grain = 1, vignette = 1, bloom = 1, shimmer = 1, fog = 1, amberKeep = true }) => {
  const uid = uidOf(useId());
  const plan = cam.mode === "plan";
  const light = plan ? LIGHT.plan : LIGHT.side;
  const ctx: StageCtx = { cam, S, plan, light, fog };
  const g2 = Math.floor(S / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 7) * 2 - 1) * GRAIN.travel;
  const hor = horizonRow(cam);
  const r = rest ?? cam;
  const canvas = () => (
    <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <CameraRig cam={cam} />
      <Ctx.Provider value={ctx}>
        {ground ? <Ground spec={ground} shimmer={shimmer} /> : null}
        {world}
      </Ctx.Provider>
    </ThreeCanvas>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: plan ? AIR_COLOR.concrete : SKY.haze, overflow: "hidden" }}>
      {!plan && sky ? <Sky cam={cam as SideCam} S={S} /> : null}
      {under}
      {bloom > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id={`${uid}bl`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              {/* alpha = how amber a pixel is (red high, blue low): cream, haze, sand and concrete fall below zero */}
              <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 0.68  0 0 0 0 0.12  1.6 0 -2.3 0 -0.38" result="o" />
              <feGaussianBlur in="o" stdDeviation="3.5" result="b1" />
              <feGaussianBlur in="o" stdDeviation="12" result="b2" />
              <feGaussianBlur in="o" stdDeviation="30" result="b3" />
              <feComponentTransfer in="b1" result="b1a">
                <feFuncA type="linear" slope={f3(0.36 * bloom * 1.6)} />
              </feComponentTransfer>
              <feComponentTransfer in="b2" result="b2a">
                <feFuncA type="linear" slope={f3(0.2 * bloom * 1.6)} />
              </feComponentTransfer>
              <feComponentTransfer in="b3" result="b3a">
                <feFuncA type="linear" slope={f3(0.06 * bloom * 1.6)} />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="b3a" />
                <feMergeNode in="b2a" />
                <feMergeNode in="b1a" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      ) : null}
      <AbsoluteFill style={bloom > 0 ? { filter: `url(#${uid}bl)` } : undefined}>{canvas()}</AbsoluteFill>
      {overlay}
      {/* the sun's veiling light in the air, in front of the world (sky and far ground share it: no horizon step) */}
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          background: plan
            ? `radial-gradient(ellipse 1300px 1500px at 120px -120px, rgba(251,233,196,0.22) 0%, rgba(251,233,196,0.07) 45%, rgba(251,233,196,0) 100%)`
            : `radial-gradient(ellipse 1250px 1400px at ${f3(230 - (((cam as SideCam).yaw ?? 0) * D2R * (cam as SideCam).f) * 0.9)}px ${f3(hor - 320)}px, rgba(251,233,196,0.34) 0%, rgba(251,233,196,0.1) 42%, rgba(251,233,196,0) 100%)`,
        }}
      />
      {motes > 0 ? <Motes cam={cam} rest={r} S={S} density={motes} layer={0} /> : null}
      {motes > 0 ? <Motes cam={cam} rest={r} S={S} density={motes} layer={1} /> : null}
      {motes > 0 ? <Motes cam={cam} rest={r} S={S} density={motes} layer={2} /> : null}
      {grade > 0 ? (
        <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: grade, background: `linear-gradient(to bottom, ${GRADE.top} 0%, ${GRADE.mid} 45%, ${GRADE.bottom} 100%)` }} />
      ) : null}
      {/* AMBER KEEPS ITS COLOUR: the soft-light grade and the sun veil would lift the stout amber toward lemon. A second
          copy of the world and the overlay, masked to amber pixels by their own colour, sits above the grade, so the
          amber reads #FFB000 -> #E38E00 after it (vignette and grain still fall on it). */}
      {amberKeep ? (
        <>
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <defs>
              <filter id={`${uid}am`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                {/* mask alpha = how amber a pixel is (red high, blue low); cream, haze, sky, sand, concrete -> 0 */}
                <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 -5.2 0 -2.2" result="m" />
                <feComposite in="SourceGraphic" in2="m" operator="in" />
              </filter>
            </defs>
          </svg>
          <AbsoluteFill style={{ filter: `url(#${uid}am)` }}>
            {canvas()}
            {overlay}
          </AbsoluteFill>
        </>
      ) : null}
      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 104% 100% at 50% 46%, rgba(34,21,11,0) 45%, rgba(34,21,11,${f3(0.14 * vignette)}) 72%, rgba(34,21,11,${f3(0.3 * vignette)}) 100%)`,
          }}
        />
      ) : null}
      {grain > 0 ? (
        <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity * grain }}>
          <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (W - GROUND.W) / 2 + grx, top: (H - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
