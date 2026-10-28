// ===================================================================================================================
// campusWorld — THE CAMPUS WORLD of sam-gigawatt-cost (Cheeky Pint S4E07, Sam Altman: "a gigawatt of AI should
// cost $20 billion, not $70"). Owner: cut 5 (SupplyWayUp). Cuts 6 and 7 import it read-only as "one gigawatt".
// The medium is the Scott "air" look (scott-aircraft-order/aircraftShared.tsx AirStage, imported read-only): a warm
// hazy golden-hour desert, lit cream buildings under ONE key light from the upper left, distance fog into the haze.
//
// THE REAL MODEL. OpenAI / Oracle "Stargate" at Abilene, Texas (Crusoe's campus): about 1.2 GW in EIGHT long
// two-storey data halls in two rows of four, rooftop cooling, an on-site substation beside them. Drawn here at
// plausible real dimensions (each hall 290 x 72 m, 18 m to the roof; the campus pad ~860 x 400 m), not surveyed.
//
// WORLD UNITS: metres, as aircraftShared: X right, Y up (ground 0), Z AWAY from the camera. Campus LOCAL frame:
// x along the halls' length, z across them, origin = the centre of the spine road between the two rows. heading
// (deg) turns the campus in plan like the jets: 0 = local +z toward world +Z, 90 = local +z toward world +X.
//
// API (everything 3D goes inside <AirStage world>; render with --gl=angle)
//   <DesertGround roads? shimmer?>  the desert floor with a grid of graded roads, fogged with CAMPUS_FOG. Pass
//                       ground={null} to AirStage and put this first in `world` (the stage's own ground uses the
//                       airfield's 2.4 km fog, far too thick for a km-scale field). roads: RoadGrid | null.
//   <GigawattCampus at heading? rise? glow? detail?>  ONE gigawatt: eight halls + substation on their concrete pad.
//                       rise 0..1: a paving front sweeps across the pad (0-0.2), then the substation and the halls
//                       rise one after another out of slots in it, centre halls first (0.08-1.0); never fades or scales. glow 0..1: amber (the
//                       dollars) leaks from the halls' louvre bands and pools on the pad between them.
//   <DataHall at heading? rise? glow?>  one hall alone on its own small pad (same materials).
//   <CampusField items=[{at, heading?, rise?, glow?}] detail?>  many campuses, instanced (one draw per part).
//   <CampusWarmth at heading? glow>  the amber warmth gathering in the air over a campus (soft billboards).
//   campusToWorld(at, heading, [x, y, z]) -> [X, Y, Z]   a local campus point in the world (pin overlays with
//                       aircraftShared airProject)
//   hallRise(rise, group) / padSpread(rise)   the JS mirror of the shader's rise curves
//   CAMPUS              dimensions (m): hall, halls[], pad, yard, cell (the field grid pitch), roads
//   CAMPUS_FOG          { near, vis, max } the world's distance fog (also used by DesertGround)
//   CAMPUS_CAM_CLOSE, CAMPUS_CAM_FIELD   suggested side cameras (one campus filling ~80 % of the width; a field of
//                       them to the horizon)
//
// MATERIALS: one lit shader (the aircraftShared jet shader's mode-0 lighting, copied) with procedural detail (wall
// panel joints, louvre slats and bay pilasters, cooler fans, transformer fins), faded by pixel size so nothing
// strobes. Shadows: each pad computes its buildings' shadows ANALYTICALLY (exact swept-box distance per fragment,
// soft penumbra), so there are no shadow maps and no one-frame cut-outs; shadows grow with each hall as it rises.
// ===================================================================================================================
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, LIGHT, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));

// ===================================================================================================================
// DIMENSIONS
// ===================================================================================================================
const HALL = { length: 290, width: 72, height: 18, storey: 9 } as const;
const HALL_X = 185; // row centres at x = -185 (row A) and +185 (row B); the spine road (80 m) between them
/** hall order of rising (z centres -144, -48, 48, 144: 72 m halls, 24 m gaps): the inner halls first, then the outer */
const HALL_ORDER: [number, number][] = [
  [-1, -48],
  [1, -48],
  [-1, 48],
  [1, 48],
  [-1, -144],
  [1, -144],
  [-1, 144],
  [1, 144],
];
export const CAMPUS = {
  hall: HALL,
  /** hall centres [x, z] in rise order (group 0..7) */
  halls: HALL_ORDER.map(([s, z]) => [s * HALL_X, z] as [number, number]),
  /** the concrete pad [x0, z0, x1, z1] */
  pad: [-495, -200, 365, 200] as [number, number, number, number],
  /** the substation yard (gravel, fenced) [x0, z0, x1, z1] */
  yard: [-472, -82, -382, 82] as [number, number, number, number],
  /** the field grid: one campus per cell; cell [x0, z0, x1, z1] around the campus origin, roads on its edges */
  cell: [-550, -255, 420, 255] as [number, number, number, number],
  pitch: [970, 510] as [number, number],
  road: 16,
  /** roof height incl. the cooler rows */
  top: HALL.height + 2.8,
} as const;
/** a local campus point -> world [X, Y, Z] */
export const campusToWorld = (at: [number, number], heading: number, local: V3): V3 => {
  const h = heading * D2R;
  const c = Math.cos(h);
  const s = Math.sin(h);
  return [at[0] + local[0] * c + local[2] * s, local[1], at[1] - local[0] * s + local[2] * c];
};

/** the world's distance fog (m): none nearer than `near`, then max * (1 - exp(-(d - near) / vis)) */
export const CAMPUS_FOG = { near: 160, vis: 5200, max: 0.94 } as const;
export const campusFogAt = (d: number) => CAMPUS_FOG.max * (1 - Math.exp(-Math.max(0, d - CAMPUS_FOG.near) / CAMPUS_FOG.vis));

/** the rise curves (mirrored exactly in GLSL below). group 0..7 = halls in HALL_ORDER, 8 = the control house,
 *  9 = the transformers and gantries */
const groupStart = (g: number) => (g > 8.5 ? 0.1 : g > 7.5 ? 0.08 : 0.12 + 0.075 * g);
export const hallRise = (rise: number, group: number) => {
  const u = c01((rise - groupStart(group)) / 0.35);
  return u * u * (3 - 2 * u);
};
export const padSpread = (rise: number) => {
  const u = c01(rise / 0.2);
  return 1 - (1 - u) * (1 - u);
};

/** suggested cameras */
export const CAMPUS_CAM_CLOSE: SideCam = { mode: "side", x: -40, y: 640, z: -1180, f: 1150, pitch: 31, yaw: 2 };
export const CAMPUS_CAM_FIELD: SideCam = { mode: "side", x: -60, y: 1000, z: -2450, f: 860, pitch: 21, yaw: 1.5 };

// ===================================================================================================================
// COLOURS (before light and fog)
// ===================================================================================================================
const CC = {
  wall: COLOR.cream,
  roof: "#E4DAC7",
  parapet: COLOR.cream,
  louvre: "#A39580",
  cooler: "#D2C7B4",
  fan: "#7C6D5C",
  door: "#B5A68F",
  house: "#ECE2CF",
  transformer: "#A79E8F",
  gantry: "#C2B6A1",
  asphalt: "#857563",
  gravel: "#A0927D",
  verge: "#D6BC98",
  /** the plain: the airfield's desert lifted a step toward the haze (a km-scale field reads lighter, like the refs) */
  desert: "#C3A07A",
  desertLo: "#AE8B66",
} as const;

// ===================================================================================================================
// GEOMETRY (built in three-local coordinates: x, y, zt = -z)
// ===================================================================================================================
type Mat = 0 | 1 | 2 | 3 | 5 | 6; // 0 plain, 1 cladding, 2 louvre band, 3 roof, 5 transformer fins, 6 cooler strip
type Box = { c: V3; s: V3; col: string; g: number; mat: Mat; topCol?: string; topMat?: Mat; org?: number };
const SINK: Record<number, number> = { 8: 7.8, 9: 15.2 };
const sinkOf = (g: number) => SINK[g] ?? CAMPUS.top + 0.8;
const boxesGeo = (boxes: Box[]) => {
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const aux: number[] = [];
  const idx: number[] = [];
  const faces: { n: V3; u: V3; v: V3 }[] = [
    { n: [1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
    { n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { n: [0, 0, 1], u: [0, 1, 0], v: [1, 0, 0] },
    { n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
  ];
  for (const b of boxes) {
    const [cx, cy, cz] = b.c;
    const [sx, sy, sz] = [b.s[0] / 2, b.s[1] / 2, b.s[2] / 2];
    for (const f of faces) {
      const top = f.n[1] > 0.5;
      const c = hex3(top && b.topCol ? b.topCol : b.col);
      const mat = top && b.topMat !== undefined ? b.topMat : b.mat;
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
        // campus local (x, y, z) -> three-local (x, y, -z)
        pos.push(ctr[0] + U[0] * a + Vv[0] * bb, ctr[1] + U[1] * a + Vv[1] * bb, -(ctr[2] + U[2] * a + Vv[2] * bb));
        nor.push(f.n[0], f.n[1], -f.n[2]);
        col.push(...c);
        aux.push(b.g, mat, -(b.org ?? 0), sinkOf(b.g));
      }
      // the z flip mirrors the winding; the material is double-sided, so either order renders
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(col), 3));
  g.setAttribute("aAux", new THREE.BufferAttribute(new Float32Array(aux), 4));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
};
const hallBoxes = (hx: number, hz: number, g: number, detail: Detail): Box[] => {
  const { length: L, width: W, height: H } = HALL;
  const out: Box[] = [];
  out.push({ c: [hx, H / 2, hz], s: [L, H, W], col: CC.wall, g, mat: 1, topCol: CC.roof, topMat: 3 });
  // parapet
  for (const s of [-1, 1]) {
    out.push({ c: [hx, H + 0.6, hz + s * (W / 2 - 0.3)], s: [L, 1.2, 0.6], col: CC.parapet, g, mat: 0 });
    out.push({ c: [hx + s * (L / 2 - 0.3), H + 0.6, hz], s: [0.6, 1.2, W], col: CC.parapet, g, mat: 0 });
  }
  // louvre bands on both long walls, one per storey
  for (const s of [-1, 1]) for (const y of [5.2, 14.2]) out.push({ c: [hx, y, hz + s * (W / 2 + 0.15)], s: [L - 6, 3.4, 0.3], col: CC.louvre, g, mat: 2 });
  // the rooftop cooler rows (dry coolers / air handlers; procedural units and fans)
  for (const s of [-1, 1]) out.push({ c: [hx, H + 1.4, hz + s * 17], s: [L - 22, 2.8, 6], col: CC.cooler, g, mat: 6, org: hz + s * 17 });
  if (detail === "hi") {
    // loading doors in the end walls
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push({ c: [hx + sx * (L / 2 + 0.15), 2.6, hz + sz * 20], s: [0.3, 5.2, 9], col: CC.door, g, mat: 0 });
  }
  return out;
};
const substationBoxes = (detail: Detail): Box[] => {
  const out: Box[] = [];
  out.push({ c: [-452, 3.5, -64], s: [26, 7, 12], col: CC.house, g: 8, mat: 0 });
  for (const z of [-34, -12, 10, 32, 54]) out.push({ c: [-427, 3.3, z], s: [9, 6.6, 7], col: CC.transformer, g: 9, mat: 5 });
  if (detail === "hi") {
    const zs = [-48, -20, 8, 36, 64];
    for (const x of [-449, -406]) for (const z of zs) out.push({ c: [x, 7, z], s: [1.1, 14, 1.1], col: CC.gantry, g: 9, mat: 0 });
    for (const z of zs) out.push({ c: [-427.5, 13.6, z], s: [43, 0.9, 0.9], col: CC.gantry, g: 9, mat: 0 });
    for (const x of [-449, -406]) out.push({ c: [x, 13.6, 8], s: [0.9, 0.9, 112], col: CC.gantry, g: 9, mat: 0 });
  }
  return out;
};
export type Detail = "hi" | "lo";
type Layout = "campus" | "hall";
const geoCache = new Map<string, Any>();
const layoutGeo = (layout: Layout, detail: Detail) => {
  const key = `${layout}:${detail}`;
  const have = geoCache.get(key);
  if (have) return have;
  const boxes = layout === "hall" ? hallBoxes(0, 0, 0, detail) : [...CAMPUS.halls.flatMap(([x, z], i) => hallBoxes(x, z, i, detail)), ...substationBoxes(detail)];
  const g = boxesGeo(boxes);
  geoCache.set(key, g);
  return g;
};
/** the shadow casters of a layout in three-local coords: rect (cx, czt, bx, bz) + (body height, sink, group, louvred) */
const casters = (layout: Layout) => {
  const out: { r: [number, number, number, number]; h: [number, number, number, number] }[] = [];
  const hall = (x: number, z: number, g: number) => out.push({ r: [x, -z, HALL.length / 2, HALL.width / 2], h: [HALL.height + 1.4, sinkOf(g), g, 1] });
  if (layout === "hall") hall(0, 0, 0);
  else {
    CAMPUS.halls.forEach(([x, z], i) => hall(x, z, i));
    out.push({ r: [-452, 64, 13, 6], h: [7, sinkOf(8), 8, 0] });
    out.push({ r: [-427, -10, 4.5, 47.5], h: [6.6, sinkOf(9), 9, 0] });
  }
  return out;
};
/** pad [cx, czt, bx, bz], yard, spine, in three-local coords */
const padOf = (layout: Layout) => {
  if (layout === "hall") return { pad: [0, 0, HALL.length / 2 + 26, HALL.width / 2 + 24], yard: [0, 0, 0, 0], spine: [0, 0, 0, 0] };
  const [x0, z0, x1, z1] = CAMPUS.pad;
  const [yx0, yz0, yx1, yz1] = CAMPUS.yard;
  return {
    pad: [(x0 + x1) / 2, -(z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2],
    yard: [(yx0 + yx1) / 2, -(yz0 + yz1) / 2, (yx1 - yx0) / 2, (yz1 - yz0) / 2],
    spine: [0, 0, 6, (z1 - z0) / 2],
  };
};

// ===================================================================================================================
// SHADERS
// ===================================================================================================================
const COMMON_GLSL = /* glsl */ `
uniform vec4 uCFog;   // near, vis, max, off (1 in plan views)
uniform vec3 uHazeLo;
uniform vec3 uHazeHi;
float cFogAt(vec3 w) {
  float d = length(w - cameraPosition);
  return uCFog.z * (1.0 - exp(-max(0.0, d - uCFog.x) / uCFog.y)) * (1.0 - uCFog.w);
}
vec3 cFogCol(vec3 w) { return mix(uHazeLo, uHazeHi, smoothstep(0.0, 320.0, w.y)); }
float groupStart(float g) { return g > 8.5 ? 0.1 : (g > 7.5 ? 0.08 : 0.12 + 0.075 * g); }
float campusRise(float r, float g) {
  float u = clamp((r - groupStart(g)) / 0.35, 0.0, 1.0);
  return u * u * (3.0 - 2.0 * u);
}
float padSpread(float r) { float u = clamp(r / 0.2, 0.0, 1.0); return 1.0 - (1.0 - u) * (1.0 - u); }
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
// a 1D box-filtered band: coverage of [lo, hi] by a pixel of width pw centred on x
float band(float x, float lo, float hi, float pw) {
  float a = clamp(x - pw * 0.5, lo, hi);
  float b = clamp(x + pw * 0.5, lo, hi);
  return (b - a) / max(pw, 1e-4);
}
`;
const BLD_VERT = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aAux;      // group, material, pattern origin (zt), sink
attribute float iRise;
attribute float iGlow;
${COMMON_GLSL}
varying vec3 vCol;
varying vec3 vN;
varying vec3 vLN;
varying vec3 vW;
varying vec3 vL;
varying vec4 vAux;
varying float vGlow;
void main() {
  float gr = campusRise(iRise, aAux.x);
  vec3 p = position;
  p.y -= (1.0 - gr) * aAux.w;
  mat4 m = modelMatrix;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
#endif
  vec4 wp = m * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(m) * normal);
  vLN = normal;
  vL = position;
  vCol = aCol;
  vAux = aAux;
  vGlow = iGlow;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const BLD_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uCream;
uniform vec3 uShade;
uniform vec3 uBounce;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec3 uFan;
${COMMON_GLSL}
varying vec3 vCol;
varying vec3 vN;
varying vec3 vLN;
varying vec3 vW;
varying vec3 vL;
varying vec4 vAux;
varying float vGlow;
void main() {
  if (vW.y < -0.04) discard;
  vec3 base = vCol;
  float mat = vAux.y;
  vec3 ln = vLN;
  bool side = abs(ln.y) < 0.5;
  float along = abs(ln.x) > 0.5 ? vL.z : vL.x;   // a wall's horizontal coordinate
  float emis = 0.0;
  vec3 amber = uAmberTop;
  if (mat > 0.5 && mat < 1.5 && side) {
    // cladding: vertical panel joints every 3 m, a darker plinth
    float pw = fwidth(along);
    float g = abs(fract(along / 3.0 + 0.5) - 0.5) * 3.0;
    float line = (1.0 - smoothstep(0.07, 0.07 + pw * 1.2, g)) * (1.0 - smoothstep(0.12, 0.5, pw));
    base *= 1.0 - 0.06 * line;
    base *= mix(0.88, 1.0, smoothstep(0.5, 1.6, vL.y));
  } else if (mat > 1.5 && mat < 2.5) {
    // louvre band: 12 m bays between cream pilasters; slats every 0.45 m. Lit from inside: amber between the slats.
    float pw = fwidth(along);
    float bay = abs(fract(along / 12.0 + 0.5) - 0.5) * 12.0;
    float pil = 1.0 - smoothstep(0.55, 0.55 + pw, bay);
    float py = fwidth(vL.y);
    float sl = 0.5 + 0.5 * cos(6.2831853 * vL.y / 0.45);
    sl = mix(sl, 0.5, smoothstep(0.08, 0.3, py));
    vec3 off = base * mix(0.74, 1.0, sl);
    vec3 on = mix(mix(uAmberTop, uAmberHot, 0.22), uAmberFoot * 0.86, sl * 0.75);
    float g = vGlow * (1.0 - pil) * (side ? 1.0 : 0.0);
    base = mix(mix(off, uCream * 0.97, pil), on, g);
    amber = on;
    emis = g;
  } else if (mat > 2.5 && mat < 3.5) {
    // roof membrane: faint seams along the hall every 2 m, soft weathering
    float pw = fwidth(vL.z);
    float g = abs(fract(vL.z / 2.0 + 0.5) - 0.5) * 2.0;
    base *= 1.0 - 0.035 * (1.0 - smoothstep(0.05, 0.05 + pw, g)) * (1.0 - smoothstep(0.1, 0.4, pw));
    base *= 0.97 + 0.05 * vnoise(vL.xz * 0.05);
  } else if (mat > 4.5 && mat < 5.5 && side) {
    // transformer radiator fins
    float pw = fwidth(along);
    float fin = 0.5 + 0.5 * cos(6.2831853 * along / 0.6);
    fin = mix(fin, 0.5, smoothstep(0.1, 0.35, pw));
    base *= mix(0.78, 1.0, fin);
  } else if (mat > 5.5) {
    // cooler strip: 9 m units on an 11 m pitch (dark gaps); two fans per unit on top; slatted sides
    float pw = fwidth(vL.x);
    float u = mod(vL.x + 5.5, 11.0) - 5.5;
    float gap = band(abs(u), 4.5, 6.0, pw) * (1.0 - smoothstep(0.6, 1.6, pw));
    if (!side) {
      vec2 q = vec2(abs(u) - 2.25, vL.z - vAux.z);
      float r = length(q);
      float pr = length(fwidth(q));
      float fan = (1.0 - smoothstep(1.85 - pr * 0.5, 1.85 + pr * 0.5, r)) * (1.0 - smoothstep(0.4, 1.2, pr));
      float hub = 1.0 - smoothstep(0.45 - pr * 0.5, 0.45 + pr * 0.5, r);
      base = mix(base, uFan, fan * (1.0 - hub) * 0.85);
      base = mix(base, mix(base, uFan, 0.3), smoothstep(0.6, 1.8, pr));
    } else {
      float sl = 0.5 + 0.5 * cos(6.2831853 * along / 0.5);
      sl = mix(sl, 0.5, smoothstep(0.1, 0.35, pw));
      base *= mix(0.84, 1.0, sl);
    }
    base = mix(base, uFan * 0.9, gap * 0.8);
  }
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.38, 0.8, ndl);
  vec3 col = mix(base * uShade, base * 1.03, lit);
  col *= 1.0 + 0.04 * max(n.y, 0.0);
  col = mix(col, col * uBounce, 0.3 * max(-n.y, 0.0));
  float sheen = pow(max(dot(n, normalize(uL + V)), 0.0), 14.0);
  col += base * 0.07 * sheen;
  float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
  col = mix(col, uCream, 0.4 * fres * smoothstep(0.05, 0.7, n.y));
  // amber is lit from inside: not shaded by the key light
  col = mix(col, amber * mix(0.97, 1.02, lit), emis * 0.94);
  float f = cFogAt(vW) * (1.0 - 0.5 * emis);
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), 1.0);
}`;
const PAD_VERT = /* glsl */ `
attribute float iRise;
attribute float iGlow;
uniform vec3 uL;
uniform vec3 uFrom;
${COMMON_GLSL}
varying vec2 vP;
varying vec3 vW;
varying float vRise;
varying float vGlow;
varying vec2 vSV;
varying vec2 vOrg;
varying vec2 vDir;
void main() {
  mat4 m = modelMatrix;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
#endif
  vec4 wp = m * vec4(position, 1.0);
  vW = wp.xyz;
  vP = position.xz;
  vRise = iRise;
  vGlow = iGlow;
  vec3 lL = transpose(mat3(m)) * uL;
  vSV = -lL.xz / max(lL.y, 0.05);
  // the paving front sweeps each pad away from uFrom (the campus the ripple starts at)
  vec3 o = (m * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vOrg = o.xz;
  vec2 dv = o.xz - uFrom.xz;
  vDir = length(dv) > 1.0 ? normalize(dv) : vec2(0.0, -1.0);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PAD_FRAG = /* glsl */ `
uniform vec4 uR[10];
uniform vec4 uRH[10];   // body height, sink, group, louvred
uniform float uNR;
uniform vec4 uPad;
uniform vec4 uYard;
uniform vec4 uSpine;
uniform vec3 uConc;
uniform vec3 uConcLo;
uniform vec3 uJointCol;
uniform vec3 uAsph;
uniform vec3 uGravel;
uniform vec3 uShadow;
uniform vec3 uAmber;
${COMMON_GLSL}
varying vec2 vP;
varying vec3 vW;
varying float vRise;
varying float vGlow;
varying vec2 vSV;
varying vec2 vOrg;
varying vec2 vDir;
float sdBox2(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
void edge(vec2 p, vec2 a, vec2 b, inout float d, inout float s) {
  vec2 e = a - b;
  vec2 w = p - b;
  vec2 q = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
  d = min(d, dot(q, q));
  bvec3 c = bvec3(p.y >= b.y, p.y < a.y, e.x * w.y > e.y * w.x);
  if (all(c) || all(not(c))) s *= -1.0;
}
// exact signed distance to an axis-aligned box (half size b, at the origin) swept along v (its shadow on the ground)
float sdSwept(vec2 q, vec2 b, vec2 v) {
  if (v.x < 0.0) { q.x = -q.x; v.x = -v.x; }
  if (v.y < 0.0) { q.y = -q.y; v.y = -v.y; }
  v = max(v, vec2(0.01));
  vec2 p0 = vec2(-b.x, -b.y);
  vec2 p1 = vec2(b.x, -b.y);
  vec2 p2 = vec2(b.x + v.x, -b.y + v.y);
  vec2 p3 = vec2(b.x + v.x, b.y + v.y);
  vec2 p4 = vec2(-b.x + v.x, b.y + v.y);
  vec2 p5 = vec2(-b.x, b.y);
  float d = dot(q - p0, q - p0);
  float s = 1.0;
  edge(q, p5, p0, d, s);
  edge(q, p0, p1, d, s);
  edge(q, p1, p2, d, s);
  edge(q, p2, p3, d, s);
  edge(q, p3, p4, d, s);
  edge(q, p4, p5, d, s);
  return s * sqrt(d);
}
void main() {
  vec2 p = vP;
  vec2 fw = fwidth(p);
  float pw = max(max(fw.x, fw.y), 0.02);
  float spread = padSpread(vRise);
  if (spread <= 0.0) discard;
  // the pad is paved by a straight front sweeping across it (never scaled): visible behind the front
  float R = length(uPad.zw) + length(uPad.xy);
  float front = dot(vW.xz - vOrg, vDir) - mix(-R, R, spread);
  float sdPad = max(sdBox2(p - uPad.xy, uPad.zw), front);
  float a = 1.0 - smoothstep(-pw * 0.5, pw * 0.5, sdPad);
  if (a <= 0.001) discard;
  // concrete: slabs, each its own tone; joints; stains
  vec2 cell = floor(p / 7.5);
  float slab = h2(cell + 3.7);
  vec3 col = mix(uConcLo, uConc, 0.55 + 0.45 * slab);
  col *= 0.95 + 0.07 * fbm(p * 0.35);
  col = mix(col, uConcLo * 0.88, smoothstep(0.62, 0.8, fbm(p * 0.02 + 3.0)) * 0.3);
  vec2 g = abs(fract(p / 7.5 + 0.5) - 0.5) * 7.5;
  float line = (1.0 - smoothstep(0.07, 0.07 + pw * 1.2, min(g.x, g.y))) * 0.3 * (1.0 - smoothstep(0.08, 0.45, pw));
  col = mix(col, uJointCol, line * 0.75);
  // the ring road inside the pad edge and the spine road between the rows
  float sdFull = sdBox2(p - uPad.xy, uPad.zw);
  float ring = band(sdFull, -19.0, -8.0, pw);
  float spine = uSpine.z > 0.0 ? band(sdBox2(p - uSpine.xy, uSpine.zw), -1e4, 0.0, pw) : 0.0;
  col = mix(col, uAsph * (0.96 + 0.06 * vnoise(p * 0.08)), max(ring, spine) * 0.92);
  // the substation's gravel yard and its fence
  if (uYard.z > 0.0) {
    float sdy = sdBox2(p - uYard.xy, uYard.zw);
    float yard = band(sdy, -1e4, 0.0, pw);
    col = mix(col, uGravel * (0.92 + 0.12 * vnoise(p * 1.3)), yard);
    col = mix(col, uJointCol * 0.9, band(sdy, -0.6, 0.0, pw) * 0.8);
  }
  // shadows (exact swept boxes), contact darkening, the slots the buildings rise out of, the amber spill
  float sh = 0.0;
  float ao = 0.0;
  float slot = 0.0;
  float spill = 0.0;
  for (int i = 0; i < 10; i++) {
    if (float(i) >= uNR) break;
    vec4 r = uR[i];
    vec4 rh = uRH[i];
    float gr = campusRise(vRise, rh.z);
    float hv = rh.x - (1.0 - gr) * rh.y;
    vec2 q = p - r.xy;
    float sdb = sdBox2(q, r.zw);
    float open = smoothstep(0.0, 0.04, gr) * (1.0 - smoothstep(0.8, 1.0, gr));
    slot = max(slot, band(sdb, 0.0, 2.2, pw) * open);
    if (hv > 0.05 && sdb < hv * 1.2 + 8.0) {
      float sd = sdSwept(q, r.zw, vSV * hv);
      float pen = 0.35 + 0.035 * hv + 0.7 * pw;
      sh = max(sh, 1.0 - smoothstep(-pen, pen, sd));
      ao = max(ao, (1.0 - smoothstep(0.0, 5.0 + pw, sdb)) * smoothstep(0.05, 3.0, hv));
    }
    if (rh.w > 0.5 && vGlow > 0.0) {
      float dz = abs(q.y) - r.w;
      float inX = 1.0 - smoothstep(r.z - 6.0, r.z + 8.0, abs(q.x));
      spill = max(spill, vGlow * inX * step(0.0, dz) * exp(-dz / 7.5) * smoothstep(0.3, 1.0, gr));
    }
  }
  col = mix(col, uAmber, spill * 0.5);
  col = mix(col, col * 0.8, ao * 0.4);
  col = mix(col, uShadow, sh * 0.52);
  col = mix(col, uShadow, slot * 0.75);
  float f = cFogAt(vW) * (1.0 - 0.4 * spill);
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), a);
}`;
const GROUND_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GROUND_FRAG = /* glsl */ `
uniform float uTime;
uniform float uShimmer;
uniform vec3 uDes;
uniform vec3 uDesLo;
uniform vec3 uAsph;
uniform vec3 uVerge;
uniform vec4 uRoad;      // origin x, origin z, pitch x, pitch z (world X, Z)
uniform vec4 uRoadBox;   // x0, z0, x1, z1 (world): roads only inside
uniform float uRoadW;
${COMMON_GLSL}
varying vec3 vW;
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  float d = length(vW - cameraPosition);
  float far = smoothstep(2500.0, 9000.0, d) * uShimmer;
  p.x += far * 2.2 * sin(p.y * 0.03 + uTime * 0.21) * sin(p.y * 0.009 - uTime * 0.07);
  vec2 fw = fwidth(p);
  float px = max(fw.x, fw.y);
  // desert: warm sand in broad patches of tone, low dunes, wind streaks, scrub specks
  float big = fbm(p * 0.00045 + 5.0);
  float dn = fbm(p * 0.0025);
  float dm = fbm(p * 0.03);
  float streak = fbm(vec2(p.x * 0.0012, p.y * 0.006) + 9.0);
  vec3 col = mix(uDesLo, uDes, smoothstep(0.2, 0.8, dn * 0.6 + big * 0.4));
  col *= 0.92 + 0.12 * smoothstep(0.3, 0.7, big);
  col *= 0.95 + 0.08 * dm;
  col = mix(col, uVerge, smoothstep(0.55, 0.8, streak) * 0.18);
  float scrub = smoothstep(0.82, 0.9, vnoise(p * 0.35)) * (1.0 - smoothstep(0.5, 2.0, px));
  col = mix(col, uDesLo * 0.74, scrub * 0.5);
  // the graded road grid: paved roads along the rows (X), graded tracks between the columns (Z), pale verges;
  // fading out at the edges of the plotted land
  if (uRoadW > 0.0) {
    vec2 qb = min(p - uRoadBox.xy, uRoadBox.zw - p);
    float inside = smoothstep(0.0, 400.0, min(qb.x, qb.y));
    float hw = uRoadW * 0.5;
    // graded tracks between every second column only (fewer lines: farmland, not floor tiles)
    float dx = (fract((p.x - uRoad.x) / (2.0 * uRoad.z) + 0.5) - 0.5) * 2.0 * uRoad.z;
    float dz = (fract((p.y - uRoad.y) / uRoad.w + 0.5) - 0.5) * uRoad.w;
    float verge = max(band(dz, -hw - 6.0, hw + 6.0, fw.y), band(dx, -hw * 0.7 - 4.0, hw * 0.7 + 4.0, fw.x));
    float paved = band(dz, -hw, hw, fw.y);
    float track = band(dx, -hw * 0.7, hw * 0.7, fw.x);
    col = mix(col, uVerge * (0.96 + 0.06 * dm), verge * 0.3 * inside);
    col = mix(col, uVerge * 1.04, track * 0.4 * inside);
    col = mix(col, uAsph * (0.95 + 0.08 * vnoise(p * 0.05)), paved * 0.72 * inside);
  }
  // the shadows of the high cloud banks drift slowly across the plain
  float cs = smoothstep(0.5, 0.74, fbm(p * 0.0011 + vec2(uTime * 0.0016, uTime * 0.0006)));
  col *= 1.0 - 0.16 * cs * uShimmer;
  float mir = far * smoothstep(0.55, 1.0, sin(p.y * 0.014 + uTime * 0.05) * 0.5 + 0.5) * 0.16;
  col = mix(col, uHazeLo, mir);
  float f = cFogAt(vW);
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), 1.0);
}`;
const WARM_VERT = /* glsl */ `
attribute vec2 aCorner;
attribute vec4 aBill;     // centre x, y, zt (three-local), alpha
attribute vec2 aSize;     // half width, half height (m)
${COMMON_GLSL}
varying vec2 vC;
varying vec3 vW;
varying float vA;
void main() {
  vec3 c = (modelMatrix * vec4(aBill.xyz, 1.0)).xyz;
  vec3 right = normalize(vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]));
  right = normalize(vec3(right.x, 0.0, right.z));
  vec3 w = c + right * aCorner.x * aSize.x + vec3(0.0, 1.0, 0.0) * aCorner.y * aSize.y;
  vW = w;
  vC = aCorner;
  vA = aBill.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const WARM_FRAG = /* glsl */ `
uniform float uGlow;
uniform vec3 uAmber;
uniform vec3 uAmberHot;
${COMMON_GLSL}
varying vec2 vC;
varying vec3 vW;
varying float vA;
void main() {
  float r = length(vC);
  float a = 1.0 - smoothstep(0.0, 1.0, r);
  a = a * a * uGlow * vA;
  // the base sits on the roofs: the warmth fades in above the roofline, not as a hard edge
  a *= smoothstep(-1.0, -0.35, vC.y);
  if (a < 0.002) discard;
  vec3 col = mix(uAmber, uAmberHot, 0.25 * (1.0 - r));
  float f = cFogAt(vW) * 0.45;
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), a * (1.0 - f * 0.4));
}`;

// ===================================================================================================================
// MATERIALS
// ===================================================================================================================
const fogUniforms = () => ({
  uCFog: { value: new THREE.Vector4(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max, 0) },
  uHazeLo: { value: v3(SKY.haze) },
  uHazeHi: { value: v3(SKY.glow) },
});
/** the key light (three space) and fog switch for the current camera: plan views have their eye far up */
const useView = () => {
  const { camera } = useThree();
  const plan = (camera as Any).position.y > 20000;
  const L = plan ? LIGHT.plan : LIGHT.side;
  return { plan, L: [L[0], L[1], -L[2]] as V3 };
};
const setView = (m: Any, v: { plan: boolean; L: V3 }, fog: number) => {
  m.uniforms.uCFog.value.set(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max * fog, v.plan ? 1 : 0);
  if (m.uniforms.uL) m.uniforms.uL.value.set(v.L[0], v.L[1], v.L[2]);
};
const makeBldMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: BLD_VERT,
    fragmentShader: BLD_FRAG,
    side: THREE.DoubleSide,
    // drawn in three's transparent pass (alpha stays 1, depth is written) so it comes AFTER the pads, which paint the
    // ground without a depth test (no z-fighting with the ground plane kilometres out)
    transparent: true,
    depthWrite: true,
    uniforms: {
      ...fogUniforms(),
      uL: { value: new THREE.Vector3(0, 1, 0) },
      uCream: { value: v3(COLOR.cream) },
      uShade: { value: v3(AIR_COLOR.shadeMul) },
      uBounce: { value: v3(AIR_COLOR.bounce) },
      uAmberTop: { value: v3(COLOR.amberTop) },
      uAmberFoot: { value: v3(COLOR.amberFoot) },
      uAmberHot: { value: v3(COLOR.amberHot) },
      uFan: { value: v3(CC.fan) },
    },
  });
const makePadMat = (layout: Layout) => {
  const cs = casters(layout);
  const P = padOf(layout);
  const R = Array.from({ length: 10 }, (_, i) => new THREE.Vector4(...(cs[i]?.r ?? [0, 0, 0, 0])));
  const RH = Array.from({ length: 10 }, (_, i) => new THREE.Vector4(...(cs[i]?.h ?? [0, 0, 0, 0])));
  return new THREE.ShaderMaterial({
    vertexShader: PAD_VERT,
    fragmentShader: PAD_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      ...fogUniforms(),
      uL: { value: new THREE.Vector3(0, 1, 0) },
      uFrom: { value: new THREE.Vector3(0, 0, 0) },
      uR: { value: R },
      uRH: { value: RH },
      uNR: { value: cs.length },
      uPad: { value: new THREE.Vector4(...P.pad) },
      uYard: { value: new THREE.Vector4(...P.yard) },
      uSpine: { value: new THREE.Vector4(...P.spine) },
      uConc: { value: v3(AIR_COLOR.concrete) },
      uConcLo: { value: v3(AIR_COLOR.concreteLo) },
      uJointCol: { value: v3(AIR_COLOR.joint) },
      uAsph: { value: v3(CC.asphalt) },
      uGravel: { value: v3(CC.gravel) },
      uShadow: { value: v3(COLOR.shadow) },
      uAmber: { value: v3(COLOR.amberTop) },
    },
  });
};

// ===================================================================================================================
// THE GROUND
// ===================================================================================================================
export type RoadGrid = { origin: [number, number]; pitch: [number, number]; width: number; box: [number, number, number, number] };
/** the field's road grid: roads on the cell edges of a campus grid whose cell (0, 0) holds a campus at [0, 0] */
export const FIELD_ROADS: RoadGrid = { origin: [CAMPUS.cell[0], CAMPUS.cell[3]], pitch: CAMPUS.pitch, width: 11, box: [-14000, -1800, 14000, 30000] };
/** DesertGround — the desert floor (replace AirStage's ground: ground={null}), with an optional road grid. */
export const DesertGround: React.FC<{ roads?: RoadGrid | null; shimmer?: number; S: number; fog?: number }> = ({ roads = FIELD_ROADS, shimmer = 1, S, fog = 1 }) => {
  const view = useView();
  const o = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200000, 200000);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: GROUND_VERT,
      fragmentShader: GROUND_FRAG,
      uniforms: {
        ...fogUniforms(),
        uTime: { value: 0 },
        uShimmer: { value: 1 },
        uDes: { value: v3(CC.desert) },
        uDesLo: { value: v3(CC.desertLo) },
        uAsph: { value: v3(CC.asphalt) },
        uVerge: { value: v3(CC.verge) },
        uRoad: { value: new THREE.Vector4(0, 0, 1000, 1000) },
        uRoadBox: { value: new THREE.Vector4(0, 0, 0, 0) },
        uRoadW: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -3;
    return { mesh, mat };
  }, []);
  const u = o.mat.uniforms;
  u.uTime.value = S;
  u.uShimmer.value = shimmer;
  if (roads) {
    u.uRoad.value.set(roads.origin[0], roads.origin[1], roads.pitch[0], roads.pitch[1]);
    u.uRoadBox.value.set(...roads.box);
    u.uRoadW.value = roads.width;
  } else u.uRoadW.value = 0;
  setView(o.mat, view, fog);
  return <primitive object={o.mesh} />;
};

// ===================================================================================================================
// CAMPUSES
// ===================================================================================================================
export type CampusItem = { at: [number, number]; heading?: number; rise?: number; glow?: number };
const FieldOf: React.FC<{ items: CampusItem[]; layout: Layout; detail: Detail; fog: number; from?: [number, number] }> = ({ items, layout, detail, fog, from }) => {
  const view = useView();
  const n = Math.max(1, items.length);
  const o = useMemo(() => {
    const shared = layoutGeo(layout, detail);
    // own geometry objects (shared static buffers) so each mesh carries its own per-instance rise and glow
    const g = new THREE.BufferGeometry();
    for (const k of ["position", "normal", "aCol", "aAux"]) g.setAttribute(k, shared.getAttribute(k));
    g.setIndex(shared.getIndex());
    const iRise = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    const iGlow = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    g.setAttribute("iRise", iRise);
    g.setAttribute("iGlow", iGlow);
    const bmat = makeBldMat();
    const bld = new THREE.InstancedMesh(g, bmat, n);
    bld.frustumCulled = false;
    bld.renderOrder = 0;
    const P = padOf(layout);
    const pg = new THREE.PlaneGeometry(2 * (P.pad[2] + 2), 2 * (P.pad[3] + 2));
    pg.rotateX(-Math.PI / 2);
    pg.translate(P.pad[0], 0, P.pad[1]);
    const pRise = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    const pGlow = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    pg.setAttribute("iRise", pRise);
    pg.setAttribute("iGlow", pGlow);
    const pmat = makePadMat(layout);
    const pad = new THREE.InstancedMesh(pg, pmat, n);
    pad.frustumCulled = false;
    pad.renderOrder = -2;
    return { bld, pad, bmat, pmat, iRise, iGlow, pRise, pGlow };
  }, [layout, detail, n]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S1 = new THREE.Vector3(1, 1, 1);
  items.forEach((it, i) => {
    E.set(0, -(it.heading ?? 0) * D2R, 0);
    Q.setFromEuler(E);
    M.compose(new THREE.Vector3(it.at[0], 0, -it.at[1]), Q, S1);
    o.bld.setMatrixAt(i, M);
    o.pad.setMatrixAt(i, M);
    const r = c01(it.rise ?? 1);
    const gl = c01(it.glow ?? 0);
    o.iRise.setX(i, r);
    o.pRise.setX(i, r);
    o.iGlow.setX(i, gl);
    o.pGlow.setX(i, gl);
  });
  o.bld.count = items.length;
  o.pad.count = items.length;
  for (const a of [o.bld.instanceMatrix, o.pad.instanceMatrix, o.iRise, o.iGlow, o.pRise, o.pGlow]) a.needsUpdate = true;
  setView(o.bmat, view, fog);
  setView(o.pmat, view, fog);
  const fr = from ?? items[0]?.at ?? [0, 0];
  o.pmat.uniforms.uFrom.value.set(fr[0], 0, -fr[1]);
  return (
    <>
      <primitive object={o.pad} />
      <primitive object={o.bld} />
    </>
  );
};
/** many campuses in one draw per part; `from` (world [X, Z]) = where the ripple starts: each pad is paved by a front
 *  sweeping away from it (default: the first item) */
export const CampusField: React.FC<{ items: CampusItem[]; detail?: Detail; fog?: number; from?: [number, number] }> = ({ items, detail = "lo", fog = 1, from }) => (
  <FieldOf items={items} layout="campus" detail={detail} fog={fog} from={from} />
);
/** ONE gigawatt: the eight-hall Stargate-style campus + substation on its pad */
export const GigawattCampus: React.FC<CampusItem & { detail?: Detail; fog?: number }> = ({ detail = "hi", fog = 1, ...it }) => <FieldOf items={[it]} layout="campus" detail={detail} fog={fog} />;
/** one data hall on its own small pad */
export const DataHall: React.FC<CampusItem & { detail?: Detail; fog?: number }> = ({ detail = "hi", fog = 1, ...it }) => <FieldOf items={[it]} layout="hall" detail={detail} fog={fog} />;

/** CampusWarmth — the amber warmth (the value) gathering in the air over a campus's roofs; glow 0..1 */
export const CampusWarmth: React.FC<{ at: [number, number]; heading?: number; glow: number; fog?: number }> = ({ at, heading = 0, glow, fog = 1 }) => {
  const view = useView();
  const o = useMemo(() => {
    // [x, y, z (campus local), half width, half height, alpha]: one broad low layer over the hall block, a softer
    // taller one over its middle, one over each row
    const B: [number, number, number, number, number, number][] = [
      [0, 22, 0, 440, 28, 0.5],
      [0, 36, 0, 340, 54, 0.3],
      [-HALL_X, 26, 0, 200, 32, 0.3],
      [HALL_X, 26, 0, 200, 32, 0.3],
    ];
    const corner: number[] = [];
    const bill: number[] = [];
    const size: number[] = [];
    const idx: number[] = [];
    B.forEach(([x, y, z, w, h, a], i) => {
      for (const [cx, cy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        corner.push(cx, cy);
        bill.push(x, y, -z, a);
        size.push(w, h);
      }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(corner.length * 1.5), 3));
    g.setAttribute("aCorner", new THREE.BufferAttribute(new Float32Array(corner), 2));
    g.setAttribute("aBill", new THREE.BufferAttribute(new Float32Array(bill), 4));
    g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(size), 2));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      vertexShader: WARM_VERT,
      fragmentShader: WARM_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { ...fogUniforms(), uGlow: { value: 0 }, uAmber: { value: v3(COLOR.amberTop) }, uAmberHot: { value: v3(COLOR.amberHot) } },
    });
    const mesh = new THREE.Mesh(g, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    return { mesh, mat };
  }, []);
  o.mesh.position.set(at[0], 0, -at[1]);
  o.mesh.rotation.set(0, -heading * D2R, 0);
  o.mat.uniforms.uGlow.value = c01(glow);
  o.mesh.visible = glow > 0.002;
  setView(o.mat, view, fog);
  return <primitive object={o.mesh} />;
};
