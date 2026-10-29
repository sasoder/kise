// ===================================================================================================================
// streetWorld — THE SHARED WORLD of robert-old-buildings (Dwarkesh Podcast; an older New York writer: "my apartment is
// on the 15th floor of an apartment house. Across the street is a building that's 15 stories or 16 stories high ...
// look at all the beautiful carving that's done in the stonework of that building up on the roof").
// Dwarkesh 3D style (styles/dwarkesh-3d.md): a pre-war Manhattan side street INSIDE the misty teal air (palette A, mood
// day; kits/dwarkesh-3d re-exports the medium). Built by cut 26 (FifteenthFloor); cut 32 (CarvedCrownAcross) imports
// it read-only. Changes after STREET_READY.md are logged in animation_source/notes/SHARED_CHANGES.md.
//
// WHY REAL 3D: the carved crown has to read as sculpted volume (brackets, cartouches, swags, lion masks, urns catching
// the upper-left light with soft core shadows and cream rims) and both cuts move a camera through the street (a 45 m
// crane, a look across and up): three.js geometry (boxes, lathes, extrusions, displaced reliefs) through ONE custom
// shader (soft form light from the camera's upper left, cream rim, procedural brick / ashlar / rustication, fog per
// fragment toward the medium's own air by distance and height) inside the kit's <AirStage> (backdrop, shafts, motes,
// grade, vignette, grain, the orange bloom), as scott-aircraft-order/aircraftShared.tsx puts three.js into its stage.
// RENDER WITH --gl=angle.
//
// WORLD UNITS: metres. X along the street (+ to the right as seen from the street looking at HIS facade), Y up (the
// street = 0), Z across the street: HIS facade is the plane z = 0 (his building behind it, z < 0, facing +Z); the
// BUILDING ACROSS has its facade on z = STREET.across (18 m), its body z > 18, facing -Z.
//
// API
//   STOREY, GROUND_STOREY, floorY(n)        storey heights; the bottom of floor n (1 = ground floor) in metres
//   HIS                                     his building: { x0, x1, bays, bayW, winW, winH, sillUp, top, ... }
//   HIS_WINDOW                              { floor: 15, bay, x, y (centre), z: 0, w, h, sill, head, room } his window
//   ACROSS                                  the building across: { z, x0, x1, bays, crown: { y0, y1, cornice, top } }
//   STREET                                  { across: 18, kerbNear, kerbFar, ... }
//   StreetCam                               { x, y, z, yaw (deg, 0 = looking at HIS facade toward -Z, 180 = looking
//                                           across toward +Z, + turns right), pitch (deg, + looks up), f (focal px),
//                                           cy? (screen row of the optical axis, a lens shift; default 960) }
//   streetProject(cam, [x, y, z]) -> { x, y, s (px per metre there), d (depth) }   pin 2D overlays to the world
//   horizonRow(cam)                         the eye-level row on screen
//   CUT26_END_CAM                           where FifteenthFloor settles (his window big in the upper half)
//   CUT32_START_CAM                         a suggestion: inside his room behind the window, looking across
//   <StreetStage cam rest frame lamp? curtain? glow? air? shafts? motes? bloom? overlay? front? extra?>
//       the frame: the AirStage medium around ONE three.js canvas holding the whole street. lamp 0..1 = his window's
//       lamp (warm cream, never orange), glow 0..1 = the crown's accent (hand-carved stonework, the ONE orange of
//       the clip): the relief keeps its stone colour and gains a thin warm-orange RIM along its curved edges
//       (ACCENT_DEEP leaning red), plus the kit's orange-only bloom raised to >= 0.45 x glow for a soft halo;
//       extra = more three.js children (use the exported materials' conventions).
//   <CarvedCrown glow />                    the crown alone (three.js; already inside <StreetStage>, exported for
//                                           probes and for cut 32's own staging)
//   STREET_AIR                              the AirScene defaults (fog by distance in metres, hHigh 60 m)
// ===================================================================================================================
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { AIR, AirStage, ACCENT, ACCENT_DEEP, hexRgb, lerp, makeAirView, type AirScene } from "../kits/dwarkesh-3d/dwarkesh3d";
import { acanthusScroll, cartouche, eggAndDart, ellipsoid, extrudeZY, giantConsole, latheS, lionMask, swag, tube, volute } from "./streetOrnament";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
export type V3 = [number, number, number];
const W = 1080;
const H = 1920;
const D2R = Math.PI / 180;
const PAL = AIR.A;

// ===================================================================================================================
// DIMENSIONS
// ===================================================================================================================
export const STOREY = 3.2;
export const GROUND_STOREY = 4.6;
/** the bottom of floor n (1 = the ground floor) */
export const floorY = (n: number) => (n <= 1 ? 0 : GROUND_STOREY + (n - 2) * STOREY);

export const STREET = { across: 18, walk: 3.2, kerbH: 0.16 } as const;

/** HIS building: a plain pre-war brick apartment house, 15 storeys, rusticated limestone base (floors 1-2), stone
 *  quoins, sills and lintels, a stone band over floor 12, a modest cornice on plain S-profile modillions over floor 15,
 *  a brick parapet. His window is the FIRST bay in from the LEFT corner (x 1.05; the facade runs x -0.7 .. 22.3, its
 *  entrance at x 10.8), so the corner and the air over the low brownstone next door frame it. */
export const HIS = (() => {
  // windows in PAIRS (the pre-war rhythm): a group = half pier 0.5 | window 1.1 | mullion pier 0.4 | window 1.1 | 0.5
  const groups = 6;
  const groupW = 3.6;
  const corner = 0.7;
  const width = groups * groupW + 2 * corner;
  // his window is the first bay in from the LEFT corner (so the corner, and the air past it over the low brownstone,
  // stay in frame beside it), kept at world x 1.05 where the room, the building across and cut 32's cameras expect it
  const x0 = 1.05 - corner - 1.05;
  return {
    groups,
    groupW,
    /** windows per row */
    bays: groups * 2,
    corner,
    x0,
    x1: x0 + width,
    /** the facade's centre line (the entrance) */
    xMid: x0 + width / 2,
    depth: 26,
    floors: 15,
    winW: 1.1,
    winH: 1.95,
    sillUp: 0.85,
    reveal: 0.22,
    cornice: floorY(16),
    /** the centre of window i (0 .. bays-1) */
    bayX: (i: number) => x0 + corner + Math.floor(i / 2) * groupW + (i % 2 === 0 ? 1.05 : 2.55),
  };
})();
const HIS_BAY = 0;
export const HIS_WINDOW = (() => {
  const floor = 15;
  const sill = floorY(floor) + HIS.sillUp;
  const head = sill + HIS.winH;
  return {
    floor,
    bay: HIS_BAY,
    x: HIS.bayX(HIS_BAY),
    y: (sill + head) / 2,
    z: 0,
    w: HIS.winW,
    h: HIS.winH,
    sill,
    head,
    /** the room behind it (world box) */
    room: { x0: Math.max(HIS.bayX(HIS_BAY) - 2.1, HIS.x0 + 0.3), x1: HIS.bayX(HIS_BAY) + 2.1, y0: floorY(floor) + 0.05, y1: floorY(floor) + 2.95, z0: -HIS.reveal, z1: -4.4 },
    /** the lamp bulb (world) */
    lamp: [HIS.bayX(HIS_BAY) + 0.3, floorY(floor) + 1.22, -1.7] as V3,
  };
})();

/** THE BUILDING ACROSS: limestone / cream-grey stone, 15 storeys + a 16th attic storey inside the carved crown. */
export const ACROSS = (() => {
  const bays = 11;
  const bayW = 2.2;
  const corner = 1.6;
  const width = bays * bayW + 2 * corner;
  const x0 = HIS_WINDOW.x - width / 2;
  const cornice = floorY(15) + 2.8;
  return {
    z: STREET.across,
    bays,
    bayW,
    corner,
    x0,
    x1: x0 + width,
    depth: 26,
    winW: 1.18,
    winH: 1.95,
    sillUp: 0.85,
    reveal: 0.24,
    bayX: (i: number) => x0 + corner + (i + 0.5) * bayW,
    crown: {
      /** floor 15, the giant-console storey (his eye level), begins the carved zone */
      y0: floorY(15),
      /** floor 15's (shorter) window height */
      winH15: 1.75,
      /** the frieze (lion masks, swags) under the main cornice */
      cornice,
      /** the main cornice: the corona's soffit (the consoles' tops) and its top */
      soffit: cornice + 0.9,
      corniceTop: cornice + 1.5,
      /** the mansard (floor 16, the attic storey inside the crown) */
      atticY0: cornice + 1.75,
      atticY1: cornice + 5.1,
      /** the cresting's top (the big cartouches) */
      top: cornice + 7.4,
    },
  };
})();

/** the main cornice's corona: how far it projects from the across facade (m), and the consoles under it */
const CORONA_PROJ = 2.15;
const CONSOLE_PROJ = 1.3;

// ===================================================================================================================
// CAMERA
// ===================================================================================================================
export type StreetCam = { x: number; y: number; z: number; yaw: number; pitch: number; f: number; cy?: number };
const basis = (c: StreetCam) => {
  const sy = Math.sin(c.yaw * D2R);
  const cyw = Math.cos(c.yaw * D2R);
  const sp = Math.sin(c.pitch * D2R);
  const cp = Math.cos(c.pitch * D2R);
  return {
    fwd: [cp * sy, sp, -cp * cyw] as V3,
    right: [cyw, 0, sy] as V3,
    up: [-sp * sy, cp, sp * cyw] as V3,
  };
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** world point -> screen px, px per metre there, depth along the view axis */
export const streetProject = (c: StreetCam, p: V3) => {
  const B = basis(c);
  const r: V3 = [p[0] - c.x, p[1] - c.y, p[2] - c.z];
  const d = Math.max(1e-6, dot(r, B.fwd));
  return { x: 540 + (c.f * dot(r, B.right)) / d, y: (c.cy ?? 960) - (c.f * dot(r, B.up)) / d, s: c.f / d, d };
};
export const horizonRow = (c: StreetCam) => (c.cy ?? 960) + c.f * Math.tan(c.pitch * D2R);

/** FifteenthFloor's settled frame: three-quarter from his window's right, looking slightly down; the window ~438 px
 *  wide at ~(710, 640), the corner's quoins and a slice of air at the left */
export const CUT26_END_CAM: StreetCam = { x: HIS_WINDOW.x + 0.75, y: HIS_WINDOW.y - 0.3, z: 3.0, yaw: -22, pitch: -10, f: 1200 };
/** a suggested opening for CarvedCrownAcross: inside his room, a step behind the window, looking across and up */
export const CUT32_START_CAM: StreetCam = { x: HIS_WINDOW.x, y: HIS_WINDOW.y - 0.25, z: -2.6, yaw: 180, pitch: 6, f: 1250 };

// ===================================================================================================================
// THE AIR (metres)
// ===================================================================================================================
export const STREET_AIR: AirScene = { look: "A", mood: "day", F: 1500, fogNear: 4, fogVis: 85, fogMax: 0.92, hLow: 0, hHigh: 62, moteUnit: 4 };
/** extra veils in the shader: lighter air with height (veil), the dense low air over the street (low, lowH metres) */
const VEIL = { veil: 0.1, low: 0.62, lowH: 7.5 };

// ===================================================================================================================
// COLOURS (local, before fog)
// ===================================================================================================================
export const COL = {
  brick: "#7C4D39",
  brickSide: "#73483A",
  mortar: "#9A8E7C",
  hisStone: "#ADA08A",
  hisStoneDk: "#978A74",
  sash: "#C9BC9F",
  glass: "#2A2B27",
  shade: "#CBBC9C",
  shade2: "#B9AE96",
  across: "#C4B9A3",
  acrossDk: "#AFA48E",
  carve: "#D6CBB3",
  slate: "#1E2430",
  asphalt: "#5B5246",
  walk: "#857659",
  kerb: "#8E8473",
  door: "#4A3A2C",
  plaster: "#E4C99C",
  floorWood: "#8A6A4A",
  curtain: "#EFE2C6",
  lampShade: "#F3DCAE",
  plant: "#4F5A40",
  chair: "#7A5A48",
  brown: "#6A5040",
  buff: "#A08A6C",
};
const rgb01 = (h: string): V3 => {
  const c = hexRgb(h);
  return [c[0] / 255, c[1] / 255, c[2] / 255];
};
const v3 = (h: string) => new THREE.Vector3(...rgb01(h));
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const shadeHex = (h: string, k: number): string => {
  const c = hexRgb(h);
  return `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0")).join("")}`;
};

// ===================================================================================================================
// GEOMETRY BUILDER. Per vertex: position, normal, colour, uv (world-plane metres for the procedural materials, or
// 0..1 for panes and decals), aux = [material, rim, carved mask (the accent glow), variety].
// ===================================================================================================================
export const M = { plain: 0, brick: 1, ashlar: 2, rustic: 3, glass: 4, shade: 5, interior: 6, lampShade: 7, far: 8, ground: 9, walk: 10, slate: 11 } as const;
type Aux = [number, number, number, number];
export class GB {
  pos: number[] = [];
  nor: number[] = [];
  col: number[] = [];
  uv: number[] = [];
  aux: number[] = [];
  idx: number[] = [];
  vtx(p: V3, n: V3, c: V3, uv: [number, number], a: Aux) {
    this.pos.push(p[0], p[1], p[2]);
    this.nor.push(n[0], n[1], n[2]);
    this.col.push(c[0], c[1], c[2]);
    this.uv.push(uv[0], uv[1]);
    this.aux.push(a[0], a[1], a[2], a[3]);
    return this.pos.length / 3 - 1;
  }
  /** a quad a b c d (any winding; the material is double-sided), flat normal n */
  quad(a: V3, b: V3, c: V3, d: V3, n: V3, col: string | V3, uvs: [number, number][], aux: Aux) {
    const cc = typeof col === "string" ? rgb01(col) : col;
    const i0 = this.vtx(a, n, cc, uvs[0], aux);
    const i1 = this.vtx(b, n, cc, uvs[1], aux);
    const i2 = this.vtx(c, n, cc, uvs[2], aux);
    const i3 = this.vtx(d, n, cc, uvs[3], aux);
    this.idx.push(i0, i1, i2, i0, i2, i3);
  }
  /** an axis-aligned box; faces in `skip` are left out (px nx py ny pz nz); uv = world-plane metres */
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: string, aux: Aux, skip = "", side?: string) {
    const sc = side ?? col;
    if (!skip.includes("pz")) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], col, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], aux);
    if (!skip.includes("nz")) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], col, [[-x1, y0], [-x0, y0], [-x0, y1], [-x1, y1]], aux);
    if (!skip.includes("px")) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], sc, [[-z1, y0], [-z0, y0], [-z0, y1], [-z1, y1]], aux);
    if (!skip.includes("nx")) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], sc, [[z0, y0], [z1, y0], [z1, y1], [z0, y1]], aux);
    if (!skip.includes("py")) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], col, [[x0, z1], [x1, z1], [x1, z0], [x0, z0]], aux);
    if (!skip.includes("ny")) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], sc, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], aux);
  }
  /** append raw triangles (positions, normals) with one colour and aux */
  tris(p: number[], n: number[], col: string | V3, aux: Aux, uvs?: number[]) {
    const cc = typeof col === "string" ? rgb01(col) : col;
    const base = this.pos.length / 3;
    for (let i = 0; i < p.length / 3; i++) {
      this.vtx([p[3 * i], p[3 * i + 1], p[3 * i + 2]], [n[3 * i], n[3 * i + 1], n[3 * i + 2]], cc, uvs ? [uvs[2 * i], uvs[2 * i + 1]] : [p[3 * i], p[3 * i + 1]], aux);
      this.idx.push(base + i);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("aCol", new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute("aAux", new THREE.Float32BufferAttribute(this.aux, 4));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

// ===================================================================================================================
// SHADERS
// ===================================================================================================================
const AIR_GLSL = /* glsl */ `
uniform vec3 uL;
uniform vec3 uCream;
uniform vec3 uShadow;
uniform vec4 uFog;     // near, vis, max, eyeT
uniform vec4 uAirH;    // hLow, hHigh, veil, low
uniform float uLowH;
uniform float uRampT[10];
uniform vec3 uRampC[10];
vec3 rampAt(float t) {
  vec3 c = uRampC[0];
  for (int i = 1; i < 10; i++) {
    if (t > uRampT[i - 1]) c = mix(uRampC[i - 1], uRampC[i], clamp((t - uRampT[i - 1]) / (uRampT[i] - uRampT[i - 1]), 0.0, 1.0));
  }
  return c;
}
vec3 airAt(float d, float h) {
  float hn = clamp((h - uAirH.x) / (uAirH.y - uAirH.x), 0.0, 1.0);
  float tH = mix(uFog.w + 0.22, uFog.w - 0.18, hn);
  float w = 1.0 - exp(-max(0.0, d) / (2.5 * uFog.y + uFog.x));
  return rampAt(mix(tH, uFog.w, w));
}
float fogAmt(float d, float h) {
  float f = uFog.z * (1.0 - exp(-max(0.0, d - uFog.x) / uFog.y));
  float veil = uAirH.z * smoothstep(12.0, 60.0, h);
  float low = uAirH.w * (1.0 - smoothstep(0.0, uLowH, h)) * (1.0 - exp(-d / 9.0));
  return 1.0 - (1.0 - f) * (1.0 - veil) * (1.0 - low);
}
vec3 inAirK(vec3 col, vec3 w, float k) {
  float d = length(w - cameraPosition);
  return mix(col, airAt(d, w.y), k * fogAmt(d, w.y));
}
vec3 inAir(vec3 col, vec3 w) { return inAirK(col, w, 1.0); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;
const SOLID_VERT = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aAux;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vCol = aCol;
  vUv = uv;
  vAux = aAux;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SOLID_FRAG = /* glsl */ `
${AIR_GLSL}
uniform vec3 uMortar;
uniform vec3 uAccent;
uniform vec3 uAccentDeep;
uniform float uGlow;
uniform float uLamp;
uniform vec3 uLampPos;
uniform vec3 uLampCol;
uniform float uTime;
uniform vec3 uSweep;   // a soft band of cream light on the building across: centre y, half-width, amount
uniform vec3 uSweepCol;   // the band's tint (default: the medium's cream)
uniform float uSweepGlint; // the pane glint's strength (default 1)
uniform vec4 uGlowRim;    // the rim's smoothstep edges (lo, hi), its alpha clamp, the lit-face warmth multiplier
uniform vec3 uCrownShade; // the corona's core shadow on the crown storey: on (0/1), soffit y, corona projection
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec4 vAux;
// running-bond brick, faded to its average colour where a course gets thinner than a few pixels
vec3 brick(vec3 base, vec2 p) {
  float ch = 0.0677;
  float bw = 0.203;
  float row = floor(p.y / ch);
  float bx = p.x / bw + 0.5 * mod(row, 2.0);
  float colI = floor(bx);
  vec2 f = vec2(fract(bx) * bw, fract(p.y / ch) * ch);
  float e = min(min(f.x, bw - f.x), min(f.y, ch - f.y));
  float px = max(fwidth(p.y), fwidth(p.x));
  float mort = 1.0 - smoothstep(0.0045 - px * 0.6, 0.0045 + px * 0.6, e);
  float vis = 1.0 - smoothstep(0.009, 0.026, px);
  float hv = h21(vec2(colI, row));
  float hv2 = h21(vec2(row, colI + 7.0));
  vec3 b = base * (0.86 + 0.26 * hv) * vec3(1.0 + 0.05 * (hv2 - 0.5), 1.0, 1.0 - 0.05 * (hv2 - 0.5));
  vec3 detail = mix(b, uMortar, mort * 0.85);
  vec3 avg = mix(base * 0.99, uMortar, 0.12);
  return mix(avg, detail, vis);
}
// stone courses: blocks bw x ch with thin joints; rust > 0 deepens the bed joints into channels
vec3 stone(vec3 base, vec2 p, float bw, float ch, float rust) {
  float row = floor(p.y / ch);
  float bx = p.x / bw + 0.5 * mod(row, 2.0);
  vec2 f = vec2(fract(bx) * bw, fract(p.y / ch) * ch);
  float px = max(fwidth(p.y), fwidth(p.x));
  float jv = 1.0 - smoothstep(0.004 - px * 0.6, 0.004 + px * 0.6, min(f.x, bw - f.x));
  float jh = 1.0 - smoothstep(0.004 + rust * 0.03 - px * 0.6, 0.004 + rust * 0.03 + px * 0.6, min(f.y, ch - f.y));
  // a channel is lit on its lower lip and dark under the upper one
  float lower = step(f.y, ch * 0.5);
  float vis = 1.0 - smoothstep(0.01, 0.05, px);
  float hv = h21(vec2(floor(bx), row));
  vec3 b = base * (0.95 + 0.08 * hv);
  vec3 jc = mix(base * 0.62, base * 0.86, rust * lower);
  vec3 detail = mix(b, jc, max(jv * 0.55, jh * mix(0.55, 0.9, rust)));
  vec3 avg = base * mix(0.97, 0.9, rust);
  return mix(avg, detail, vis);
}
// the crown seen close (cut 32's landing): the height veil thins on it, so its slate and its shadows keep their depth
// as in the photographs (only when the crown is drawn: uCrownShade.x; distant views keep the full veil)
float crownFogK() {
  if (uCrownShade.x < 0.5 || vW.z < 15.5) return 1.0;
  float up = smoothstep(${(ACROSS.crown.y0 - 3.0).toFixed(2)}, ${(ACROSS.crown.y0 - 0.2).toFixed(2)}, vW.y);
  return 1.0 - 0.4 * up * (1.0 - smoothstep(10.0, 40.0, length(vW - cameraPosition)));
}
vec3 lightIt(vec3 base, vec3 n, vec3 V, float rim) {
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.45, 0.95, ndl);
  vec3 dark = mix(base * 0.5, uShadow, 0.28);
  vec3 col = mix(dark, base * 1.14, lit);
  // reflected air on faces turned down / away
  col += airAt(30.0, vW.y) * 0.07 * clamp(-n.y, 0.0, 1.0);
  float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 2.2);
  col = mix(col, uCream, rim * 0.62 * fres * smoothstep(0.05, 0.75, ndl));
  return col;
}
void main() {
  vec3 n = normalize(vN);
  if (dot(n, normalize(cameraPosition - vW)) < 0.0) n = -n;
  vec3 V = normalize(cameraPosition - vW);
  float m = vAux.x;
  vec3 base = vCol;
  float rim = vAux.y;
  vec3 col;
  if (m > 3.5 && m < 4.5) {
    // dark glass: the room's dark behind a reflection of the lit air, brighter toward the top of the pane
    vec3 refl = airAt(400.0, vW.y + 25.0);
    float k = 0.12 + 0.26 * smoothstep(0.0, 1.0, vUv.y) + 0.06 * vAux.w;
    float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
    col = mix(base, refl, k + 0.3 * fres);
    if (uSweep.z > 0.0 && vW.z > 16.0) {
      // the panes of the building across catch the passing band: a cream glint, brightest on a diagonal streak
      float ks = uSweep.z * exp(-pow((vW.y - uSweep.x) / max(uSweep.y, 0.01), 2.0));
      float streak = 1.0 - smoothstep(0.0, 0.22, abs(vUv.x - 0.65 * vUv.y - 0.15));
      col = mix(col, uSweepCol * 1.2, ks * uSweepGlint * (0.6 + 0.35 * streak));
    }
    gl_FragColor = vec4(inAir(col, vW), 1.0);
    return;
  }
  if (m > 5.5 && m < 6.5) {
    // the room, lit by the lamp (warm cream, never orange): soft falloff, a little Lambert toward the bulb
    vec3 toL = uLampPos - vW;
    float dl = length(toL);
    float ndl = 0.55 + 0.45 * dot(n, toL / max(dl, 1e-4));
    float fall = 1.0 / (1.0 + pow(dl / 1.35, 2.0));
    float flick = 1.0 + 0.025 * sin(uTime * 0.9) + 0.015 * sin(uTime * 2.3 + 1.0);
    // the shade throws its light down and sideways: the ceiling stays dimmer
    float up = clamp(-n.y, 0.0, 1.0) * step(uLampPos.y + 0.3, vW.y);
    float light = 0.1 + uLamp * flick * (0.1 + 2.3 * fall * ndl) * (1.0 - 0.45 * up);
    col = base * light * mix(vec3(1.0), uLampCol, 0.7 * uLamp);
    // indoors: only a little of the street's air reaches it
    gl_FragColor = vec4(inAirK(col, vW, 0.35), 1.0);
    return;
  }
  if (m > 6.5 && m < 7.5) {
    // the lamp shade: lit from within
    float flick = 1.0 + 0.025 * sin(uTime * 0.9);
    col = mix(base * 0.42, base * 1.02 * flick, uLamp);
    gl_FragColor = vec4(inAirK(col, vW, 0.35), 1.0);
    return;
  }
  if (m > 0.5 && m < 1.5) base = brick(base, vUv);
  else if (m > 1.5 && m < 2.5) base = stone(base, vUv, 1.15, 0.58, 0.0);
  else if (m > 2.5 && m < 3.5) base = stone(base, vUv, 1.4, 0.55, 1.0);
  else if (m > 10.5 && m < 11.5) base = stone(base, vUv, 0.34, 0.17, 0.35);
  else if (m > 7.5 && m < 8.5) {
    // a far facade: a window grid by bays and storeys
    vec2 g = vec2(vUv.x / 2.3, (vUv.y - 1.2) / 3.2);
    vec2 f = fract(g);
    float px = fwidth(g.y);
    float win = smoothstep(0.24 - px, 0.24 + px, f.x) * (1.0 - smoothstep(0.76 - px, 0.76 + px, f.x)) * smoothstep(0.27 - px, 0.27 + px, f.y) * (1.0 - smoothstep(0.88 - px, 0.88 + px, f.y));
    win *= step(0.0, vUv.y - 1.2) * step(0.0, vAux.w - vUv.y);
    vec3 refl = mix(base * 0.35, airAt(300.0, vW.y + 25.0), 0.35);
    base = mix(base, refl, win * 0.85);
  } else if (m > 8.5 && m < 9.5) {
    float nz = h21(floor(vUv * 3.0)) * 0.06 + h21(floor(vUv * 11.0)) * 0.04;
    base *= 0.95 + nz;
  } else if (m > 9.5 && m < 10.5) {
    vec2 f = fract(vUv / 1.5);
    float px = fwidth(vUv.x) / 1.5;
    float j = 1.0 - smoothstep(0.012 - px, 0.012 + px, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)));
    base = mix(base * (0.96 + 0.06 * h21(floor(vUv / 1.5))), base * 0.7, j * 0.6);
  }
  col = lightIt(base, n, V, rim);
  if (uCrownShade.x > 0.5 && vW.z > 15.5 && vW.y < uCrownShade.y && vW.y > uCrownShade.y - 3.0) {
    // the deep corona's core shadow on the crown storey (a stylised steep light, slope 1.6): the frieze and the wall
    // under the soffit fall into a band of shade; the consoles' fronts, standing out, catch light lower down
    float zl = ${ACROSS.z.toFixed(2)} - vW.z;
    float zc = zl + (uCrownShade.y - vW.y) * 1.6;
    float sh = 1.0 - smoothstep(uCrownShade.z - 0.35, uCrownShade.z + 0.1, zc);
    col = mix(col, col * 0.55 + uShadow * 0.12, 0.8 * sh);
  }
  if (uSweep.z > 0.0 && vW.z > 16.0) {
    // the band of cream light on the building across: the stone lifts clearly past its own cream (amt 1 = plainly lit)
    float k = uSweep.z * exp(-pow((vW.y - uSweep.x) / max(uSweep.y, 0.01), 2.0));
    col = mix(col, uSweepCol * 1.16, 0.7 * k) + uSweepCol * 0.12 * k;
  }
  if (vAux.z > 0.001) {
    // THE ACCENT: hand-carved stonework (the clip's one orange). glow 0..1 = the carving touched by warm light, NOT
    // painted: the relief keeps its stone body colour (warmed only a little on its lit faces), and a warm orange RIM
    // runs along its edges, where the carved surface turns away from the eye (strongest where it also faces the
    // light). StreetStage raises the kit's orange-only bloom with glow, which spreads the rims into a soft halo.
    float g = uGlow * vAux.z;
    float ndl = dot(n, uL);
    float lit = smoothstep(-0.45, 0.95, ndl);
    float fres = 1.0 - clamp(abs(dot(n, V)), 0.0, 1.0);
    // only where the carved surface CURVES away (its normal turning per metre): a flat side face seen edge-on stays
    // stone, so the orange is a thin line along the relief's rounded edges, never a painted plane
    float curv = length(fwidth(vN)) / max(length(fwidth(vW)), 1e-5);
    float rimK = smoothstep(0.1, 0.7, fres) * smoothstep(0.3, 1.8, curv);
    col *= mix(vec3(1.0), vec3(1.05, 0.99, 0.92), g * lit * uGlowRim.w);
    // a deep, red-leaning orange (the grade lifts it toward amber; it must still read orange, not gold)
    // (a half-mixed orange over cream reads as tan or gold, so the rim is sharpened: where it is, it is nearly whole)
    vec3 rimC = mix(mix(uAccentDeep, vec3(0.93, 0.42, 0.04), 0.6), uAccent, 0.12 + 0.25 * lit);
    float a = clamp(g * smoothstep(uGlowRim.x, uGlowRim.y, rimK) * (0.85 + 0.25 * lit), 0.0, uGlowRim.z);
    col = mix(col, rimC, a);
    float d = length(vW - cameraPosition);
    // the rim takes half the fog (the one glowing material)
    gl_FragColor = vec4(mix(col, airAt(d, vW.y), crownFogK() * fogAmt(d, vW.y) * (1.0 - 0.5 * a)), 1.0);
    return;
  }
  gl_FragColor = vec4(inAirK(col, vW, crownFogK()), 1.0);
}`;
/** soft shadows laid on walls (uv 0..1, v = 0 at the casting edge): the medium's shadow colour, fading with the fog */
const DECAL_FRAG = /* glsl */ `
${AIR_GLSL}
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  float s = vAux.y;
  float a = vAux.x * pow(1.0 - clamp(vUv.y, 0.0, 1.0), 1.4) * smoothstep(0.0, s, vUv.x) * smoothstep(0.0, s, 1.0 - vUv.x);
  float d = length(vW - cameraPosition);
  a *= 1.0 - fogAmt(d, vW.y);
  gl_FragColor = vec4(uShadow, a);
}`;
/** his window's glass over the lit room: a faint reflection of the air, thinner while the lamp is on */
const GLASS_FRAG = /* glsl */ `
${AIR_GLSL}
uniform float uLamp;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  vec3 n = normalize(vN);
  if (dot(n, normalize(cameraPosition - vW)) < 0.0) n = -n;
  vec3 V = normalize(cameraPosition - vW);
  float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0);
  vec3 refl = airAt(400.0, vW.y + 25.0);
  float a = (0.08 + 0.2 * smoothstep(0.2, 1.0, vUv.y) + 0.35 * fres) * (1.0 - 0.85 * uLamp);
  gl_FragColor = vec4(inAir(refl, vW), a);
}`;
/** the lamp's spill: an additive cream glow quad (uv 0..1 radial) */
const SPILL_FRAG = /* glsl */ `
${AIR_GLSL}
uniform float uLamp;
uniform vec3 uLampCol;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  vec2 q = (vUv - 0.5) * 2.0;
  float r = length(q * vec2(1.0, 0.8));
  float a = vAux.x * uLamp * pow(max(0.0, 1.0 - r), 2.2);
  float d = length(vW - cameraPosition);
  a *= 1.0 - fogAmt(d, vW.y);
  gl_FragColor = vec4(uLampCol * a, a);
}`;
/** the curtains: cloth panels with folds, stirring in a draught (uTime), lit through by the lamp */
const CURTAIN_VERT = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aAux;
uniform float uTime;
uniform float uStir;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  // uv.x across the panel (0 = the gathered edge), uv.y down from the rod (0 = rod)
  float fold = sin(uv.x * 28.0 + aAux.w * 3.0) * 0.035;
  float hang = uv.y * uv.y;
  float stir = uStir * hang * (0.055 * sin(uTime * 0.21 + uv.x * 2.0 + aAux.w) + 0.03 * sin(uTime * 0.47 + uv.y * 3.0 + aAux.w * 2.0));
  vec3 p = position + vec3(stir * 0.6 * aAux.z, 0.0, fold + stir);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normalize(vec3(-cos(uv.x * 28.0 + aAux.w * 3.0) * 0.5, 0.0, 1.0));
  vCol = aCol;
  vUv = uv;
  vAux = aAux;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CURTAIN_FRAG = /* glsl */ `
${AIR_GLSL}
uniform float uLamp;
uniform vec3 uLampCol;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vW;
varying vec4 vAux;
void main() {
  vec3 n = normalize(vN);
  float folds = 0.78 + 0.22 * n.x * 2.0;
  float through = 0.38 + 0.72 * uLamp * (0.75 + 0.25 * (1.0 - vUv.y));
  vec3 col = vCol * folds * through * mix(vec3(1.0), uLampCol, 0.4 * uLamp);
  gl_FragColor = vec4(inAirK(col, vW, 0.5), 1.0);
}`;

// ===================================================================================================================
// MATERIALS (one set per canvas)
// ===================================================================================================================
const airUniforms = () => ({
  uL: { value: new THREE.Vector3(-0.55, 0.78, 0.3) },
  uCream: { value: v3(PAL.cream) },
  uShadow: { value: v3(PAL.shadow) },
  uFog: { value: new THREE.Vector4(STREET_AIR.fogNear, STREET_AIR.fogVis, STREET_AIR.fogMax, PAL.eyeT) },
  uAirH: { value: new THREE.Vector4(0, STREET_AIR.hHigh, VEIL.veil, VEIL.low) },
  uLowH: { value: VEIL.lowH },
  uRampT: { value: PAL.ramp.map((r) => r[0]).concat(Array(Math.max(0, 10 - PAL.ramp.length)).fill(1)).slice(0, 10) },
  uRampC: { value: PAL.ramp.map((r) => v3(r[1])).concat(Array(Math.max(0, 10 - PAL.ramp.length)).fill(v3(PAL.ramp[PAL.ramp.length - 1][1]))).slice(0, 10) },
});
type Mats = { solid: Any; decal: Any; glass: Any; spill: Any; curtain: Any };
const LAMP_COL = "#FAE6C6";
const makeMats = (): Mats => {
  const solid = new THREE.ShaderMaterial({
    vertexShader: SOLID_VERT,
    fragmentShader: SOLID_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      ...airUniforms(),
      uMortar: { value: v3(COL.mortar) },
      uAccent: { value: v3(ACCENT) },
      uAccentDeep: { value: v3(ACCENT_DEEP) },
      uGlow: { value: 0 },
      uLamp: { value: 0 },
      uLampPos: { value: new THREE.Vector3(...HIS_WINDOW.lamp) },
      uLampCol: { value: v3(LAMP_COL) },
      uTime: { value: 0 },
      uSweep: { value: new THREE.Vector3(0, 1, 0) },
      uSweepCol: { value: v3(PAL.cream) },
      uSweepGlint: { value: 1 },
      uGlowRim: { value: new THREE.Vector4(0.12, 0.55, 0.95, 1) },
      uCrownShade: { value: new THREE.Vector3(0, ACROSS.crown.soffit, CORONA_PROJ) },
    },
  });
  const decal = new THREE.ShaderMaterial({
    vertexShader: SOLID_VERT,
    fragmentShader: DECAL_FRAG,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: airUniforms(),
  });
  const glass = new THREE.ShaderMaterial({
    vertexShader: SOLID_VERT,
    fragmentShader: GLASS_FRAG,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: { ...airUniforms(), uLamp: { value: 0 } },
  });
  const spill = new THREE.ShaderMaterial({
    vertexShader: SOLID_VERT,
    fragmentShader: SPILL_FRAG,
    // front faces only (the facade quad faces +Z, the sill quad +Y): from inside his room the facade quad is culled,
    // so it can no longer veil the view out and vanish as the eye crosses it. Colour adds exactly as
    // AdditiveBlending did (src x srcAlpha + dst); alpha is left as it was, so it never lifts the sky behind.
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.AddEquation,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    uniforms: { ...airUniforms(), uLamp: { value: 0 }, uLampCol: { value: v3(LAMP_COL) } },
  });
  const curtain = new THREE.ShaderMaterial({
    vertexShader: CURTAIN_VERT,
    fragmentShader: CURTAIN_FRAG,
    side: THREE.DoubleSide,
    uniforms: { ...airUniforms(), uLamp: { value: 0 }, uLampCol: { value: v3(LAMP_COL) }, uTime: { value: 0 }, uStir: { value: 1 } },
  });
  return { solid, decal, glass, spill, curtain };
};

// ===================================================================================================================
// HIS BUILDING
// ===================================================================================================================
const A0: Aux = [M.plain, 0.6, 0, 0];
const aux = (m: number, rim = 0.6, carve = 0, w = 0): Aux => [m, rim, carve, w];
/** a soft shadow decal on a wall facing +Z (or -Z with flip): top edge y0, hanging down by h, skewed right by dx */
const decalZ = (D: GB, x0: number, x1: number, y0: number, h: number, z: number, amt: number, soft = 0.15, dx = 0) => {
  D.quad([x0, y0, z], [x1, y0, z], [x1 + dx, y0 - h, z], [x0 + dx, y0 - h, z], [0, 0, 1], "#000000", [[0, 0], [1, 0], [1, 1], [0, 1]], [amt, soft, 0, 0]);
};
/** a vertical shadow strip (the jamb's shadow on glass): left edge x0 sharp, fading to the right over w */
const decalSide = (D: GB, x0: number, w: number, y0: number, y1: number, z: number, amt: number) => {
  D.quad([x0, y1, z], [x0, y0, z], [x0 + w, y0, z], [x0 + w, y1, z], [0, 0, 1], "#000000", [[0.5, 0], [0.5, 0], [0.5, 1], [0.5, 1]], [amt, 0.0001, 0, 0]);
};

type Built = { solid: Any; decal: Any; glass: Any; spill: Any; curtain: Any; inner: Any };
let BUILT: Built | null = null;

/** one window opening in a wall facing +Z at z = 0 (or the across building's -Z face via `flip`): reveals, sash,
 *  glass (or nothing when `open`, for his lit window), sill, lintel; and the shadows they cast */
const windowAt = (S: GB, D: GB, o: { x: number; sill: number; w: number; h: number; reveal: number; stone: string; seed: number; open?: boolean; inner?: GB; lintel?: "flat" | "none"; brick?: boolean }) => {
  const { x, sill, w, h, reveal } = o;
  const xl = x - w / 2;
  const xr = x + w / 2;
  const head = sill + h;
  const wallM = o.brick === false ? M.ashlar : M.brick;
  const wallC = o.brick === false ? COL.across : COL.brick;
  // reveals (jambs, soffit) in the wall's material; the sill's top in stone
  S.quad([xl, sill, 0], [xl, head, 0], [xl, head, -reveal], [xl, sill, -reveal], [1, 0, 0], wallC, [[0, sill], [0, head], [reveal, head], [reveal, sill]], aux(wallM, 0.2));
  S.quad([xr, sill, 0], [xr, head, 0], [xr, head, -reveal], [xr, sill, -reveal], [-1, 0, 0], wallC, [[0, sill], [0, head], [reveal, head], [reveal, sill]], aux(wallM, 0.2));
  S.quad([xl, head, 0], [xr, head, 0], [xr, head, -reveal], [xl, head, -reveal], [0, -1, 0], wallC, [[xl, 0], [xr, 0], [xr, reveal], [xl, reveal]], aux(wallM, 0));
  S.quad([xl, sill, 0], [xr, sill, 0], [xr, sill, -reveal], [xl, sill, -reveal], [0, 1, 0], o.stone, [[xl, 0], [xr, 0], [xr, reveal], [xl, reveal]], aux(M.plain, 0.5));
  // the outer stone sill (lugs past the jambs) and the flat stone lintel with a keystone
  S.box(xl - 0.1, xr + 0.1, sill - 0.14, sill, 0, 0.09, o.stone, aux(M.plain, 0.8), "nz");
  if (o.lintel !== "none") {
    S.box(xl - 0.12, xr + 0.12, head, head + 0.3, 0, 0.03, o.stone, aux(M.plain, 0.5), "nz");
    S.box(x - 0.13, x + 0.13, head - 0.02, head + 0.36, 0, 0.06, shadeHex(o.stone, 1.03), aux(M.plain, 0.7), "nz");
  }
  decalZ(D, xl - 0.08, xr + 0.12, sill - 0.14, 0.32, 0.002, 0.42, 0.18, 0.06);
  // the sash: frame, meeting rail, two panes (lower sash a little proud of the upper)
  const zs = -reveal + 0.07;
  const fw = 0.065;
  const sash = COL.sash;
  const mid = sill + h * 0.5;
  S.box(xl, xr, sill, sill + fw, zs - 0.05, zs, sash, aux(M.plain, 0.5), "nz");
  S.box(xl, xr, head - fw, head, zs - 0.06, zs - 0.02, sash, aux(M.plain, 0.4), "nz");
  S.box(xl, xl + fw, sill, head, zs - 0.05, zs, sash, aux(M.plain, 0.5), "nz");
  S.box(xr - fw, xr, sill, head, zs - 0.05, zs, sash, aux(M.plain, 0.5), "nz");
  S.box(xl + fw, xr - fw, mid - 0.035, mid + 0.035, zs - 0.04, zs + 0.005, sash, aux(M.plain, 0.6), "nz");
  if (o.inner) {
    // his open window is seen from INSIDE in cut 32: the sash boxes' back faces (and the outer sill's), which the
    // street never sees, go in a separate mesh that StreetScene draws only while the eye is near or inside
    const I = o.inner;
    I.box(xl, xr, sill, sill + fw, zs - 0.05, zs, sash, aux(M.plain, 0.5), "pz px nx py ny");
    I.box(xl, xr, head - fw, head, zs - 0.06, zs - 0.02, sash, aux(M.plain, 0.4), "pz px nx py ny");
    I.box(xl, xl + fw, sill, head, zs - 0.05, zs, sash, aux(M.plain, 0.5), "pz px nx py ny");
    I.box(xr - fw, xr, sill, head, zs - 0.05, zs, sash, aux(M.plain, 0.5), "pz px nx py ny");
    I.box(xl + fw, xr - fw, mid - 0.035, mid + 0.035, zs - 0.04, zs + 0.005, sash, aux(M.plain, 0.6), "pz px nx py ny");
  }
  // the jamb's and head's shadows across the sash and glass (light from the upper left)
  decalSide(D, xl + fw, 0.2, sill + fw, head - fw, zs + 0.012, 0.42);
  decalZ(D, xl + fw, xr - fw, head - fw, 0.34, zs + 0.012, 0.4, 0.05, 0.12);
  if (o.open) return;
  const g = (y0: number, y1: number, z: number, k: number) =>
    S.quad([xl + fw, y0, z], [xr - fw, y0, z], [xr - fw, y1, z], [xl + fw, y1, z], [0, 0, 1], shadeHex(COL.glass, 0.9 + 0.25 * k), [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.glass, 0, 0, k));
  const k = hash01(o.seed);
  g(sill + fw, mid - 0.035, zs - 0.03, k);
  g(mid + 0.035, head - fw, zs - 0.05, k);
  // life behind the glass: a pulled shade, or curtains at the sides, or nothing
  const kind = hash01(o.seed + 3.3);
  const zb = zs - 0.09;
  if (kind < 0.42) {
    const drop = 0.18 + 0.75 * hash01(o.seed + 5.1);
    const yb = head - fw - drop * (h - 2 * fw) * 0.95;
    S.quad([xl + fw, yb, zb], [xr - fw, yb, zb], [xr - fw, head - fw, zb], [xl + fw, head - fw, zb], [0, 0, 1], hash01(o.seed + 9) < 0.5 ? COL.shade : COL.shade2, [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.shade, 0, 0, 0));
    S.box(xl + fw + 0.02, xr - fw - 0.02, yb - 0.03, yb + 0.005, zb, zb + 0.02, COL.shade2, aux(M.plain, 0.4), "");
  } else if (kind < 0.7) {
    const cw = (w - 2 * fw) * (0.22 + 0.12 * hash01(o.seed + 6.2));
    const cc = hash01(o.seed + 7.7) < 0.5 ? COL.shade : "#B7A58A";
    S.quad([xl + fw, sill + fw, zb], [xl + fw + cw, sill + fw, zb], [xl + fw + cw * 0.8, head - fw, zb], [xl + fw, head - fw, zb], [0, 0, 1], cc, [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.shade, 0, 0, 0));
    S.quad([xr - fw - cw, sill + fw, zb], [xr - fw, sill + fw, zb], [xr - fw, head - fw, zb], [xr - fw - cw * 0.8, head - fw, zb], [0, 0, 1], cc, [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.shade, 0, 0, 0));
  }
};

/** a wall facing +Z at z = 0 between x0..x1, y0..y1, with window holes (rects [xl, xr, yb, yt]) cut out */
const wallWithHoles = (S: GB, x0: number, x1: number, y0: number, y1: number, holes: [number, number, number, number][], col: string, a: Aux) => {
  // split into horizontal bands at every hole's bottom and top
  const ys = new Set<number>([y0, y1]);
  for (const h of holes) {
    if (h[2] > y0 && h[2] < y1) ys.add(h[2]);
    if (h[3] > y0 && h[3] < y1) ys.add(h[3]);
  }
  const Y = [...ys].sort((a2, b) => a2 - b);
  for (let i = 0; i < Y.length - 1; i++) {
    const ya = Y[i];
    const yb = Y[i + 1];
    const ym = (ya + yb) / 2;
    const cut = holes.filter((h) => h[2] < ym && h[3] > ym).sort((a2, b) => a2[0] - b[0]);
    let xa = x0;
    for (const h of cut) {
      if (h[0] > xa) S.quad([xa, ya, 0], [h[0], ya, 0], [h[0], yb, 0], [xa, yb, 0], [0, 0, 1], col, [[xa, ya], [h[0], ya], [h[0], yb], [xa, yb]], a);
      xa = Math.max(xa, h[1]);
    }
    if (x1 > xa) S.quad([xa, ya, 0], [x1, ya, 0], [x1, yb, 0], [xa, yb, 0], [0, 0, 1], col, [[xa, ya], [x1, ya], [x1, yb], [xa, yb]], a);
  }
};

const buildHis = (S: GB, D: GB, G: GB, SP: GB, C: GB, IN: GB) => {
  const { x0, x1, bays, winW, winH, sillUp, reveal } = HIS;
  const base = floorY(3);
  const topY = HIS.cornice;
  // ---- the brick shaft, floors 3..15, with its window holes
  const holes: [number, number, number, number][] = [];
  for (let fl = 3; fl <= 15; fl++) {
    for (let b = 0; b < bays; b++) {
      const x = HIS.bayX(b);
      const sill = floorY(fl) + sillUp;
      holes.push([x - winW / 2, x + winW / 2, sill, sill + winH]);
    }
  }
  wallWithHoles(S, x0, x1, base, topY, holes, COL.brick, aux(M.brick, 0.15));
  // the brick returns (party walls) above the neighbours, in shade on the right, a little lit on the left
  S.quad([x0, floorY(7) + 1.0, 0], [x0, topY + 2.9, 0], [x0, topY + 2.9, -HIS.depth], [x0, floorY(7) + 1.0, -HIS.depth], [-1, 0, 0], COL.brickSide, [[0, floorY(7)], [0, topY], [HIS.depth, topY], [HIS.depth, floorY(7)]], aux(M.brick, 0.1));
  S.quad([x1, floorY(12) + 1.0, 0], [x1, topY + 2.9, 0], [x1, topY + 2.9, -HIS.depth], [x1, floorY(12) + 1.0, -HIS.depth], [1, 0, 0], COL.brickSide, [[0, floorY(12)], [0, topY], [-HIS.depth, topY], [-HIS.depth, floorY(12)]], aux(M.brick, 0.1));
  // ---- windows of the shaft
  for (let fl = 3; fl <= 15; fl++) {
    for (let b = 0; b < bays; b++) {
      const his = fl === HIS_WINDOW.floor && b === HIS_WINDOW.bay;
      windowAt(S, D, { x: HIS.bayX(b), sill: floorY(fl) + sillUp, w: winW, h: winH, reveal, stone: COL.hisStone, seed: fl * 31 + b * 7.3, open: his, inner: his ? IN : undefined });
    }
  }
  // ---- quoins at both corners, floors 3..15 (alternating long and short blocks, a hair proud)
  for (let y = base; y < topY - 0.3; y += 0.62) {
    const k = Math.round((y - base) / 0.62) % 2;
    const len = k ? 0.5 : 0.82;
    S.box(x0, x0 + len, y + 0.02, y + 0.6, 0, 0.03, COL.hisStone, aux(M.plain, 0.5), "nz");
    S.box(x1 - len, x1, y + 0.02, y + 0.6, 0, 0.03, COL.hisStone, aux(M.plain, 0.5), "nz");
  }
  // ---- the rusticated limestone base, floors 1-2, with its own taller windows and the entrance
  const doorX = HIS.xMid;
  const baseHoles: [number, number, number, number][] = [];
  for (let b = 0; b < bays; b++) {
    const x = HIS.bayX(b);
    if (b !== 5 && b !== 6) baseHoles.push([x - 0.6, x + 0.6, 1.25, 3.85]);
    baseHoles.push([x - winW / 2, x + winW / 2, floorY(2) + 0.95, floorY(2) + 0.95 + winH]);
  }
  baseHoles.push([doorX - 1.15, doorX + 1.15, 0.0, 3.6]);
  wallWithHoles(S, x0, x1, 0, base, baseHoles, COL.hisStone, aux(M.rustic, 0.2));
  for (let b = 0; b < bays; b++) {
    const x = HIS.bayX(b);
    if (b !== 5 && b !== 6) windowAt(S, D, { x, sill: 1.25, w: 1.2, h: 2.6, reveal: 0.3, stone: COL.hisStoneDk, seed: 900 + b, lintel: "none", brick: false });
    windowAt(S, D, { x, sill: floorY(2) + 0.95, w: winW, h: winH, reveal: 0.3, stone: COL.hisStoneDk, seed: 950 + b, lintel: "none", brick: false });
  }
  // the entrance: a deep stone surround, a pair of panelled doors with glass, a transom, two lanterns
  const dx0 = doorX - 1.15;
  const dx1 = doorX + 1.15;
  S.quad([dx0, 0, 0], [dx0, 3.6, 0], [dx0, 3.6, -0.6], [dx0, 0, -0.6], [1, 0, 0], COL.hisStone, [[0, 0], [0, 3.6], [0.6, 3.6], [0.6, 0]], aux(M.plain, 0.2));
  S.quad([dx1, 0, 0], [dx1, 3.6, 0], [dx1, 3.6, -0.6], [dx1, 0, -0.6], [-1, 0, 0], COL.hisStone, [[0, 0], [0, 3.6], [0.6, 3.6], [0.6, 0]], aux(M.plain, 0.2));
  S.quad([dx0, 3.6, 0], [dx1, 3.6, 0], [dx1, 3.6, -0.6], [dx0, 3.6, -0.6], [0, -1, 0], COL.hisStone, [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.plain, 0));
  S.box(dx0, dx1, 0, 2.75, -0.62, -0.58, COL.door, aux(M.plain, 0.3), "nz");
  S.box(dx0, dx1, 2.75, 2.85, -0.62, -0.55, COL.door, aux(M.plain, 0.3), "nz");
  S.quad([dx0 + 0.1, 2.85, -0.59], [dx1 - 0.1, 2.85, -0.59], [dx1 - 0.1, 3.55, -0.59], [dx0 + 0.1, 3.55, -0.59], [0, 0, 1], "#3B3A33", [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.glass, 0, 0, 0.5));
  for (const s of [-1, 1]) {
    const px = doorX + s * 0.55;
    S.quad([px - 0.36, 0.95, -0.575], [px + 0.36, 0.95, -0.575], [px + 0.36, 2.5, -0.575], [px - 0.36, 2.5, -0.575], [0, 0, 1], "#3A3934", [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.glass, 0, 0, 0.3));
  }
  decalZ(D, dx0, dx1, 3.6, 1.1, -0.57, 0.5, 0.12, 0.25);
  // the door surround: pilasters and an entablature
  S.box(dx0 - 0.5, dx0, 0, 3.9, 0, 0.18, COL.hisStone, aux(M.plain, 0.6), "nz");
  S.box(dx1, dx1 + 0.5, 0, 3.9, 0, 0.18, COL.hisStone, aux(M.plain, 0.6), "nz");
  S.box(dx0 - 0.7, dx1 + 0.7, 3.9, 4.35, 0, 0.32, COL.hisStone, aux(M.plain, 0.8), "nz");
  decalZ(D, dx0 - 0.7, dx1 + 0.7, 3.9, 0.5, 0.181, 0.35, 0.1, 0.15);
  for (const s of [-1, 1]) {
    const lx = doorX + s * 1.95;
    S.box(lx - 0.13, lx + 0.13, 2.3, 2.75, 0.18, 0.44, "#4C4438", aux(M.plain, 0.4), "nz");
    S.box(lx - 0.1, lx + 0.1, 2.36, 2.7, 0.2, 0.42, "#EADCBC", aux(M.plain, 0.3), "nz");
  }
  // ---- the belt course over floor 2, the band over floor 12, the cornice over 15, the parapet
  const course = (y: number, hgt: number, proj: number, col: string, shadow = 0.45) => {
    S.box(x0 - 0.05, x1 + 0.05, y, y + hgt, 0, proj, col, aux(M.plain, 0.85), "nz");
    decalZ(D, x0, x1, y, proj * 1.6 + 0.15, 0.003, shadow, 0.02, proj * 0.7);
  };
  course(base - 0.05, 0.42, 0.26, COL.hisStone);
  S.box(x0 - 0.05, x1 + 0.05, base + 0.37, base + 0.45, 0, 0.32, COL.hisStone, aux(M.plain, 0.9), "nz");
  course(floorY(13) - 0.12, 0.3, 0.12, COL.hisStone, 0.35);
  // the cornice: a stone frieze, plain brackets, the corona and a cymatium
  S.box(x0, x1, topY, topY + 0.6, 0, 0.05, COL.hisStone, aux(M.plain, 0.5), "nz");
  S.box(x0, x1, topY + 0.6, topY + 1.55, -0.05, 0.0, COL.hisStoneDk, aux(M.plain, 0.2), "nz");
  // plain S-profile modillions (no carving: his house is the plain one) under the corona
  const modProf: [number, number][] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    modProf.push([0.12 + 0.44 * (1 - t) - 0.06 * Math.sin(Math.PI * 2 * t) * (1 - t), topY + 1.02 - t * 0.42]);
  }
  modProf.push([0, topY + 0.6], [0, topY + 1.02]);
  for (let x = x0 + 0.35; x < x1 - 0.2; x += 0.62) extrudeZY(S, [...modProf].reverse(), x - 0.09, x + 0.09, rgb01(COL.hisStone), aux(M.plain, 0.7), 0.6, triZY);
  decalZ(D, x0, x1, topY + 0.6, 1.0, 0.052, 0.55, 0.02, 0.35);
  S.box(x0 - 0.4, x1 + 0.4, topY + 1.02, topY + 1.38, 0, 0.78, COL.hisStone, aux(M.plain, 0.9), "");
  S.box(x0 - 0.45, x1 + 0.45, topY + 1.38, topY + 1.55, 0, 0.85, shadeHex(COL.hisStone, 1.04), aux(M.plain, 1.0), "");
  wallWithHoles(S, x0, x1, topY + 1.55, topY + 2.75, [], COL.brick, aux(M.brick, 0.1));
  S.box(x0 - 0.06, x1 + 0.06, topY + 2.75, topY + 2.92, -0.3, 0.06, COL.hisStone, aux(M.plain, 0.9), "");
  // ---- HIS window's room: lit plaster, a wooden floor, a lamp on a side table, an armchair, a plant, curtains
  const R = HIS_WINDOW.room;
  const wx = HIS_WINDOW.x;
  const plaster = COL.plaster;
  const I = (m: number = M.interior): Aux => [m, 0, 0, 0];
  S.quad([R.x0, R.y0, R.z1], [R.x1, R.y0, R.z1], [R.x1, R.y1, R.z1], [R.x0, R.y1, R.z1], [0, 0, 1], plaster, [[0, 0], [1, 0], [1, 1], [0, 1]], I());
  S.quad([R.x0, R.y0, R.z0], [R.x0, R.y0, R.z1], [R.x0, R.y1, R.z1], [R.x0, R.y1, R.z0], [1, 0, 0], shadeHex(plaster, 0.96), [[0, 0], [1, 0], [1, 1], [0, 1]], I());
  S.quad([R.x1, R.y0, R.z0], [R.x1, R.y0, R.z1], [R.x1, R.y1, R.z1], [R.x1, R.y1, R.z0], [-1, 0, 0], shadeHex(plaster, 0.96), [[0, 0], [1, 0], [1, 1], [0, 1]], I());
  S.quad([R.x0, R.y1, R.z0], [R.x1, R.y1, R.z0], [R.x1, R.y1, R.z1], [R.x0, R.y1, R.z1], [0, -1, 0], shadeHex(plaster, 1.02), [[0, 0], [1, 0], [1, 1], [0, 1]], I());
  S.quad([R.x0, R.y0, R.z0], [R.x1, R.y0, R.z0], [R.x1, R.y0, R.z1], [R.x0, R.y0, R.z1], [0, 1, 0], COL.floorWood, [[0, 0], [1, 0], [1, 1], [0, 1]], I());
  // the inner face of the facade wall around the opening (seen from inside in cut 32)
  wallWithHolesInner(S, R.x0, R.x1, R.y0, R.y1, R.z0, [[wx - HIS.winW / 2, wx + HIS.winW / 2, HIS_WINDOW.sill, HIS_WINDOW.head]], plaster);
  // a picture rail, a framed print on the back wall (no text), a radiator under the window
  S.box(R.x0, R.x1, R.y1 - 0.42, R.y1 - 0.38, R.z1, R.z1 + 0.03, shadeHex(plaster, 0.85), I(), "");
  S.box(wx - 1.35, wx - 0.55, R.y0 + 1.25, R.y0 + 1.85, R.z1, R.z1 + 0.03, "#6E5A44", I(), "");
  S.box(wx - 1.3, wx - 0.6, R.y0 + 1.3, R.y0 + 1.8, R.z1, R.z1 + 0.035, "#B9A27E", I(), "");
  S.box(wx - 0.55, wx + 0.55, R.y0 + 0.12, R.y0 + 0.72, R.z0 - 0.25, R.z0 - 0.08, "#C8B89A", I(), "");
  // the side table and the lamp (a pleated drum shade lit from within)
  const L = HIS_WINDOW.lamp;
  S.box(L[0] - 0.3, L[0] + 0.3, R.y0 + 0.62, R.y0 + 0.67, L[2] - 0.3, L[2] + 0.3, "#5E554C", I(), "");
  S.box(L[0] - 0.03, L[0] + 0.03, R.y0, R.y0 + 0.62, L[2] - 0.03, L[2] + 0.03, "#5B4230", I(), "");
  S.box(L[0] - 0.06, L[0] + 0.06, R.y0 + 0.67, R.y0 + 1.0, L[2] - 0.06, L[2] + 0.06, "#8C7457", I(), "");
  lathe(S, [
    [0.24, L[1] - 0.18],
    [0.16, L[1] + 0.2],
  ], L[0], L[2], 24, COL.lampShade, I(M.lampShade));
  // the armchair (left of the window, its back to the wall) and a tall plant in a pot (right)
  // the armchair deeper in the room, its back to the far wall, angled to the window
  const ax = wx - 0.35;
  const az = -3.2;
  S.box(ax - 0.45, ax + 0.45, R.y0, R.y0 + 0.45, az - 0.4, az + 0.4, COL.chair, I(), "");
  S.box(ax - 0.45, ax + 0.45, R.y0 + 0.45, R.y0 + 1.05, az - 0.5, az - 0.3, COL.chair, I(), "");
  S.box(ax - 0.55, ax - 0.4, R.y0 + 0.3, R.y0 + 0.68, az - 0.45, az + 0.4, shadeHex(COL.chair, 0.92), I(), "");
  S.box(ax + 0.4, ax + 0.55, R.y0 + 0.3, R.y0 + 0.68, az - 0.45, az + 0.4, shadeHex(COL.chair, 0.92), I(), "");
  const px = wx - 0.48;
  lathe(S, [
    [0.15, R.y0],
    [0.19, R.y0 + 0.36],
  ], px, -0.75, 16, "#8A5A40", I());
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.4;
    const len = 0.55 + 0.35 * hash01(i + 40);
    const tilt = 0.5 + 0.35 * hash01(i + 50);
    leaf(S, [px, R.y0 + 0.36, -0.75], a, len, tilt, shadeHex(COL.plant, 0.9 + 0.25 * hash01(i + 60)), I());
  }
  // the curtains: two panels gathered at the sides of the opening, just inside the sash
  const cz = -HIS.reveal - 0.12;
  const cy0 = HIS_WINDOW.head + 0.22;
  const cy1 = HIS_WINDOW.sill - 0.35;
  curtainPanel(C, wx - HIS.winW / 2 - 0.25, wx - HIS.winW / 2 + 0.3, cy0, cy1, cz, 1, 0.3);
  curtainPanel(C, wx + HIS.winW / 2 + 0.25, wx + HIS.winW / 2 - 0.3, cy0, cy1, cz, -1, 1.7);
  S.box(wx - HIS.winW / 2 - 0.35, wx + HIS.winW / 2 + 0.35, cy0, cy0 + 0.035, cz - 0.03, cz + 0.01, "#8C7457", I(), "");
  // his window's glass (transparent, over the lit room) and the lamp's spill on the sill and reveals
  const fw = 0.065;
  const zs = -HIS.reveal + 0.07;
  const mid = HIS_WINDOW.sill + HIS.winH * 0.5;
  const xl = wx - HIS.winW / 2 + fw;
  const xr = wx + HIS.winW / 2 - fw;
  G.quad([xl, HIS_WINDOW.sill + fw, zs - 0.03], [xr, HIS_WINDOW.sill + fw, zs - 0.03], [xr, mid - 0.035, zs - 0.03], [xl, mid - 0.035, zs - 0.03], [0, 0, 1], "#000000", [[0, 0], [1, 0], [1, 1], [0, 1]], A0);
  G.quad([xl, mid + 0.035, zs - 0.05], [xr, mid + 0.035, zs - 0.05], [xr, HIS_WINDOW.head - fw, zs - 0.05], [xl, HIS_WINDOW.head - fw, zs - 0.05], [0, 0, 1], "#000000", [[0, 0], [1, 0], [1, 1], [0, 1]], A0);
  SP.quad([wx - 1.7, HIS_WINDOW.y - 1.7, 0.02], [wx + 1.7, HIS_WINDOW.y - 1.7, 0.02], [wx + 1.7, HIS_WINDOW.y + 1.6, 0.02], [wx - 1.7, HIS_WINDOW.y + 1.6, 0.02], [0, 0, 1], "#000000", [[0, 0], [1, 0], [1, 1], [0, 1]], [0.16, 0, 0, 0]);
  SP.quad([wx - 0.95, HIS_WINDOW.sill + 0.001, 0.12], [wx + 0.95, HIS_WINDOW.sill + 0.001, 0.12], [wx + 0.95, HIS_WINDOW.sill + 0.001, -0.3], [wx - 0.95, HIS_WINDOW.sill + 0.001, -0.3], [0, 1, 0], "#000000", [[0, 0], [1, 0], [1, 1], [0, 1]], [0.2, 0, 0, 0]);
};
/** the inner face of a facade wall (facing -Z, at z) with holes */
const wallWithHolesInner = (S: GB, x0: number, x1: number, y0: number, y1: number, z: number, holes: [number, number, number, number][], col: string) => {
  const T = new GB();
  wallWithHoles(T, x0, x1, y0, y1, holes, col, [M.interior, 0, 0, 0]);
  for (let i = 0; i < T.pos.length / 3; i++) T.pos[3 * i + 2] = z;
  for (let i = 0; i < T.nor.length / 3; i++) T.nor[3 * i + 2] = -1;
  appendGB(S, T);
};
const appendGB = (S: GB, T: GB) => {
  const base = S.pos.length / 3;
  S.pos.push(...T.pos);
  S.nor.push(...T.nor);
  S.col.push(...T.col);
  S.uv.push(...T.uv);
  S.aux.push(...T.aux);
  for (const i of T.idx) S.idx.push(base + i);
};
/** a lathe (vertical axis at x, z) through profile points [radius, y] */
export const lathe = (S: GB, prof: [number, number][], x: number, z: number, seg: number, col: string, a: Aux) => {
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i];
    const [r1, y1] = prof[i + 1];
    const dy = y1 - y0;
    const dr = r1 - r0;
    const ln = Math.hypot(dy, dr) || 1;
    for (let s = 0; s < seg; s++) {
      const a0 = (s / seg) * Math.PI * 2;
      const a1 = ((s + 1) / seg) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      const nx = (Math.cos(am) * dy) / ln;
      const nz = (Math.sin(am) * dy) / ln;
      const ny = -dr / ln;
      const P = (r: number, y: number, ang: number): V3 => [x + r * Math.cos(ang), y, z + r * Math.sin(ang)];
      S.quad(P(r0, y0, a0), P(r0, y0, a1), P(r1, y1, a1), P(r1, y1, a0), [nx, ny, nz], col, [[0, 0], [1, 0], [1, 1], [0, 1]], a);
    }
  }
};
/** a leaf: a long thin quad bending out and down from the stem base */
const leaf = (S: GB, at: V3, ang: number, len: number, tilt: number, col: string, a: Aux) => {
  const dx = Math.cos(ang);
  const dz = Math.sin(ang) * 0.5;
  const pts: V3[] = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const r = len * t * Math.sin(tilt + 0.5 * t);
    const y = len * (1.3 * t - 0.75 * t * t);
    pts.push([at[0] + dx * r, at[1] + y, at[2] + dz * r]);
  }
  for (let i = 0; i < 4; i++) {
    const w0 = 0.07 * Math.sin(Math.PI * (i / 4)) + 0.01;
    const w1 = 0.07 * Math.sin(Math.PI * ((i + 1) / 4)) + 0.01;
    const sx = -dz;
    const sz = dx;
    const p0 = pts[i];
    const p1 = pts[i + 1];
    S.quad([p0[0] - sx * w0, p0[1], p0[2] - sz * w0], [p0[0] + sx * w0, p0[1], p0[2] + sz * w0], [p1[0] + sx * w1, p1[1], p1[2] + sz * w1], [p1[0] - sx * w1, p1[1], p1[2] - sz * w1], [0, 0, 1], col, [[0, 0], [1, 0], [1, 1], [0, 1]], a);
  }
};
/** a curtain panel: a grid from its gathered outer edge xa to its inner edge xb, uv.x 0 at xa, uv.y 0 at the rod */
const curtainPanel = (C: GB, xa: number, xb: number, y0: number, y1: number, z: number, dir: number, seed: number) => {
  const nx = 14;
  const ny = 12;
  const col = rgb01(COL.curtain);
  const base = C.pos.length / 3;
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const v = j / ny;
      // the inner edge swings in a little toward the bottom (a tie-back look)
      const x = lerp(xa, xb, u) - dir * 0.12 * u * Math.sin(Math.PI * v * 0.8);
      C.vtx([x, lerp(y0, y1, v), z], [0, 0, 1], col, [u, v], [0, 0, dir, seed]);
    }
  }
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = base + j * (nx + 1) + i;
      C.idx.push(a, a + 1, a + nx + 2, a, a + nx + 2, a + nx + 1);
    }
};

// ===================================================================================================================
// THE STREET, THE NEIGHBOURS, THE FAR ROWS
// ===================================================================================================================
const buildStreet = (S: GB, D: GB) => {
  const X0 = -420;
  const X1 = 420;
  const zA = STREET.across;
  // pavements on both sides, kerbs, the roadway
  S.quad([X0, 0.0, 0], [X1, 0.0, 0], [X1, 0.0, STREET.walk], [X0, 0.0, STREET.walk], [0, 1, 0], COL.walk, [[X0, 0], [X1, 0], [X1, STREET.walk], [X0, STREET.walk]], aux(M.walk, 0.2));
  S.quad([X0, 0.0, zA - STREET.walk], [X1, 0.0, zA - STREET.walk], [X1, 0.0, zA], [X0, 0.0, zA], [0, 1, 0], COL.walk, [[X0, zA - STREET.walk], [X1, zA - STREET.walk], [X1, zA], [X0, zA]], aux(M.walk, 0.2));
  S.quad([X0, -STREET.kerbH, STREET.walk], [X1, -STREET.kerbH, STREET.walk], [X1, -STREET.kerbH, zA - STREET.walk], [X0, -STREET.kerbH, zA - STREET.walk], [0, 1, 0], COL.asphalt, [[X0, 0], [X1, 0], [X1, 12], [X0, 12]], aux(M.ground, 0));
  S.quad([X0, -STREET.kerbH, STREET.walk], [X1, -STREET.kerbH, STREET.walk], [X1, 0, STREET.walk], [X0, 0, STREET.walk], [0, 0, 1], COL.kerb, [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.plain, 0.5));
  S.quad([X0, -STREET.kerbH, zA - STREET.walk], [X1, -STREET.kerbH, zA - STREET.walk], [X1, 0, zA - STREET.walk], [X0, 0, zA - STREET.walk], [0, 0, -1], COL.kerb, [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.plain, 0.5));
  // a far-reaching ground below everything (the street continues into the haze)
  S.quad([X0 - 600, -0.2, -400], [X1 + 600, -0.2, -400], [X1 + 600, -0.2, 420], [X0 - 600, -0.2, 420], [0, 1, 0], COL.asphalt, [[0, 0], [1, 0], [1, 1], [0, 1]], aux(M.ground, 0));
  // a cast-iron street lamp at his kerb, a hydrant: scale in the street at the crane's foot
  {
    const lx = HIS.xMid - 5.2;
    const lz = STREET.walk - 0.45;
    const iron = rgb01("#3B3F39");
    latheS(S, [
      [0.2, 0],
      [0.19, 0.25],
      [0.12, 0.45],
      [0.1, 0.9],
      [0.075, 1.0],
      [0.065, 4.3],
      [0.09, 4.4],
      [0.06, 4.55],
    ], lx, lz, iron, aux(M.plain, 0.5), 14);
    S.box(lx - 0.2, lx + 0.2, 4.55, 4.6, lz - 0.2, lz + 0.2, "#3B3F39", aux(M.plain, 0.6), "");
    S.box(lx - 0.16, lx + 0.16, 4.6, 5.05, lz - 0.16, lz + 0.16, "#EADCBC", aux(M.plain, 0.3), "");
    latheS(S, [
      [0.26, 5.05],
      [0.2, 5.15],
      [0.05, 5.4],
      [0.0, 5.48],
    ], lx, lz, iron, aux(M.plain, 0.7), 4);
    const hx = HIS.xMid + 6.4;
    latheS(S, [
      [0.2, 0],
      [0.18, 0.08],
      [0.14, 0.12],
      [0.14, 0.55],
      [0.17, 0.6],
      [0.15, 0.68],
      [0.07, 0.8],
      [0.0, 0.84],
    ], hx, lz, rgb01("#5E6461"), aux(M.plain, 0.6), 14);
    S.box(hx - 0.27, hx + 0.27, 0.36, 0.46, lz - 0.06, lz + 0.06, "#5E6461", aux(M.plain, 0.5), "");
  }
  // his near neighbours: a six-storey brownstone walk-up on the left, an eleven-storey buff-brick house on the right
  const nb = (xa: number, xb: number, top: number, col: string, z: number, side: 1 | -1, seed: number) => {
    const T = new GB();
    T.box(xa, xb, 0, top, z - 20, z, col, aux(M.far, 0.3, 0, top), "");
    if (side === -1) for (let i = 0; i < T.pos.length / 3; i++) T.pos[3 * i + 2] = 2 * STREET.across - T.pos[3 * i + 2];
    if (side === -1) for (let i = 0; i < T.nor.length / 3; i++) T.nor[3 * i + 2] = -T.nor[3 * i + 2];
    appendGB(S, T);
    // a cornice slab
    const C = new GB();
    C.box(xa - 0.2, xb + 0.2, top, top + 0.5, z - 0.2, z + 0.55, shadeHex(col, 1.08), aux(M.plain, 0.8), "");
    if (side === -1) for (let i = 0; i < C.pos.length / 3; i++) C.pos[3 * i + 2] = 2 * STREET.across - C.pos[3 * i + 2];
    if (side === -1) for (let i = 0; i < C.nor.length / 3; i++) C.nor[3 * i + 2] = -C.nor[3 * i + 2];
    appendGB(S, C);
    void seed;
  };
  nb(HIS.x0 - 17.5, HIS.x0, floorY(7) + 1.0, COL.brown, 0.4, 1, 1);
  nb(HIS.x1, HIS.x1 + 19, floorY(12) + 1.0, COL.buff, -0.3, 1, 2);
  // the far rows on both sides: varied widths and heights, brick and stone, receding into the haze
  const palette = ["#7A5442", "#A08A6C", "#8E7660", "#B0A188", "#6E5848", "#9B7B5E", "#C0B49C"];
  const row = (from: number, dir: 1 | -1, side: 1 | -1, seed: number) => {
    let x = from;
    let i = 0;
    while (Math.abs(x) < 400) {
      const w = 12 + 16 * hash01(seed + i * 3.1);
      const fl = 5 + Math.floor(11 * hash01(seed + i * 5.7));
      const top = floorY(fl + 1) + 1.0;
      const xa = dir > 0 ? x : x - w;
      const xb = dir > 0 ? x + w : x;
      nb(xa, xb, top, palette[Math.floor(hash01(seed + i * 9.3) * palette.length)], (hash01(seed + i) - 0.5) * 0.8, side, seed + i);
      x += dir * w;
      i++;
    }
  };
  row(HIS.x1 + 19, 1, 1, 10);
  row(HIS.x0 - 17.5, -1, 1, 20);
  void D;
};

// ===================================================================================================================
// THE BUILDING ACROSS (its crown: see CarvedCrown below)
// ===================================================================================================================
/** mirror a GB built facing +Z at z = 0 onto the across facade (facing -Z at z = ACROSS.z), keeping x */
const toAcross = (T: GB) => {
  for (let i = 0; i < T.pos.length / 3; i++) T.pos[3 * i + 2] = ACROSS.z - T.pos[3 * i + 2];
  for (let i = 0; i < T.nor.length / 3; i++) T.nor[3 * i + 2] = -T.nor[3 * i + 2];
  return T;
};
const buildAcross = (S: GB, D: GB) => {
  const T = new GB();
  const TD = new GB();
  const { x0, x1, bays, winW, winH, sillUp, reveal } = ACROSS;
  const shaftTop = ACROSS.crown.y0;
  const holes: [number, number, number, number][] = [];
  for (let fl = 3; fl <= 14; fl++)
    for (let b = 0; b < bays; b++) {
      const x = ACROSS.bayX(b);
      const sill = floorY(fl) + sillUp;
      holes.push([x - winW / 2, x + winW / 2, sill, sill + winH]);
    }
  wallWithHoles(T, x0, x1, floorY(3), shaftTop, holes, COL.across, aux(M.ashlar, 0.2));
  for (let fl = 3; fl <= 14; fl++)
    for (let b = 0; b < bays; b++) windowAt(T, TD, { x: ACROSS.bayX(b), sill: floorY(fl) + sillUp, w: winW, h: winH, reveal, stone: COL.acrossDk, seed: 3000 + fl * 17 + b * 3.1, brick: false });
  const bh: [number, number, number, number][] = [];
  for (let b = 0; b < bays; b++) {
    const x = ACROSS.bayX(b);
    bh.push([x - 0.65, x + 0.65, 1.2, 3.9]);
    bh.push([x - winW / 2, x + winW / 2, floorY(2) + 0.95, floorY(2) + 0.95 + winH]);
  }
  wallWithHoles(T, x0, x1, 0, floorY(3), bh, COL.acrossDk, aux(M.rustic, 0.2));
  for (let b = 0; b < bays; b++) {
    windowAt(T, TD, { x: ACROSS.bayX(b), sill: 1.2, w: 1.3, h: 2.7, reveal: 0.3, stone: COL.acrossDk, seed: 3900 + b, lintel: "none", brick: false });
    windowAt(T, TD, { x: ACROSS.bayX(b), sill: floorY(2) + 0.95, w: winW, h: winH, reveal: 0.3, stone: COL.acrossDk, seed: 3950 + b, lintel: "none", brick: false });
  }
  T.box(x0 - 0.05, x1 + 0.05, floorY(3) - 0.05, floorY(3) + 0.4, 0, 0.3, COL.across, aux(M.plain, 0.85), "nz");
  // side returns (light stone), in case a camera looks along the street
  T.quad([x0, 0, 0], [x0, ACROSS.crown.corniceTop, 0], [x0, ACROSS.crown.corniceTop, -ACROSS.depth], [x0, 0, -ACROSS.depth], [-1, 0, 0], COL.acrossDk, [[0, 0], [0, 50], [26, 50], [26, 0]], aux(M.ashlar, 0.1));
  T.quad([x1, 0, 0], [x1, ACROSS.crown.corniceTop, 0], [x1, ACROSS.crown.corniceTop, -ACROSS.depth], [x1, 0, -ACROSS.depth], [1, 0, 0], COL.acrossDk, [[0, 0], [0, 50], [26, 50], [26, 0]], aux(M.ashlar, 0.1));
  appendGB(S, toAcross(T));
  appendGB(D, toAcross(TD));
};

// ===================================================================================================================
// THE CARVED CROWN of the building across, modelled on the Dorilton (171 W 71st St, Janes & Leo, 1900-02; reference
// photos 03 + 02 in <clip>/images/reference_carving/; the lion mask from 04): floor 15 is the giant-console storey
// (storey-tall carved brackets on every pier, each with a shield-and-scroll head and a draped garland), its windows in
// eared surrounds; a frieze of lion masks and swags; the main cornice on the consoles (egg-and-dart, corona); then
// the slate mansard (floor 16, the attic storey) with carved dormers under segmental hoods, and on the roof a stone
// cresting of big shell-topped cartouches flanked by acanthus scrolls. Built facing +Z at z = 0 (facade-local) and
// mirrored onto the across facade. aux.z = 1 marks CARVED stone (the accent glow); walls, plain courses, the corona,
// the slate and the sashes are 0 (they stay as they are when the carving glows).
// ===================================================================================================================
const triZY = (pts: [number, number][]) => THREE.ShapeUtils.triangulateShape(pts.map(([zz, yy]) => new THREE.Vector2(zz, yy)), []) as number[][];
const shiftZ = (T: GB, dz: number) => {
  for (let i = 0; i < T.pos.length / 3; i++) T.pos[3 * i + 2] += dz;
  return T;
};
let CROWN: { solid: Any; decal: Any } | null = null;
export const buildCrownGeo = () => {
  if (CROWN) return CROWN;
  const T = new GB();
  const TD = new GB();
  const { x0, x1, bays, winW, sillUp, reveal } = ACROSS;
  const c = ACROSS.crown;
  const carve = rgb01(COL.carve);
  const carveDk = rgb01(shadeHex(COL.carve, 0.55));
  const K: Aux = [M.plain, 0.9, 1, 0];
  const P = (rim = 0.8): Aux => [M.plain, rim, 0, 0];
  const f15 = c.y0;
  const wh = c.winH15;
  const piers: number[] = [x0 + ACROSS.corner * 0.5];
  for (let b = 0; b < bays - 1; b++) piers.push((ACROSS.bayX(b) + ACROSS.bayX(b + 1)) / 2);
  piers.push(x1 - ACROSS.corner * 0.5);
  // ---- floor 15: the wall, the windows in eared surrounds with a carved keystone
  const holes: [number, number, number, number][] = [];
  for (let b = 0; b < bays; b++) holes.push([ACROSS.bayX(b) - winW / 2, ACROSS.bayX(b) + winW / 2, f15 + sillUp, f15 + sillUp + wh]);
  wallWithHoles(T, x0, x1, f15, c.cornice, holes, COL.across, aux(M.ashlar, 0.2));
  for (let b = 0; b < bays; b++) {
    const x = ACROSS.bayX(b);
    const sill = f15 + sillUp;
    const head = sill + wh;
    windowAt(T, TD, { x, sill, w: winW, h: wh, reveal, stone: COL.acrossDk, seed: 5000 + b, lintel: "none", brick: false });
    const fw = 0.15;
    const xl = x - winW / 2;
    const xr = x + winW / 2;
    T.box(xl - fw, xl, sill, head, 0, 0.06, COL.carve, P(0.6), "nz");
    T.box(xr, xr + fw, sill, head, 0, 0.06, COL.carve, P(0.6), "nz");
    T.box(xl - fw - 0.08, xr + fw + 0.08, head, head + fw, 0, 0.06, COL.carve, P(0.7), "nz");
    T.box(xl - fw - 0.08, xl - fw, head - 0.2, head, 0, 0.06, COL.carve, P(0.6), "nz");
    T.box(xr + fw, xr + fw + 0.08, head - 0.2, head, 0, 0.06, COL.carve, P(0.6), "nz");
    T.box(xl - 0.2, xr + 0.2, sill - 0.12, sill, 0, 0.16, COL.carve, P(0.9), "nz");
    T.box(x - 0.13, x + 0.13, head - 0.05, head + 0.22, 0, 0.1, COL.carve, P(0.8), "nz");
    ellipsoid(T, [x, head + 0.08, 0.1], [0.09, 0.12, 0.05], carve, K, 10, true);
    decalZ(TD, xl - 0.2, xr + 0.25, sill - 0.12, 0.3, 0.002, 0.35, 0.15, -0.05);
  }
  // ---- the frieze: a lion mask over every window, short swags to the consoles either side
  const fr0 = c.cornice;
  T.box(x0, x1, fr0, fr0 + 0.6, 0, 0.06, COL.across, P(0.4), "nz");
  T.box(x0 - 0.04, x1 + 0.04, fr0 - 0.05, fr0 + 0.05, 0, 0.12, COL.carve, P(0.8), "nz");
  for (let b = 0; b < bays; b++) {
    const x = ACROSS.bayX(b);
    lionMask(T, [x, fr0 + 0.3, 0.06], 0.25, carve, carveDk, K);
    swag(T, [x - 0.78, fr0 + 0.44, 0.06], [x - 0.28, fr0 + 0.44, 0.06], 0.16, 0.05, carve, K, 5);
    swag(T, [x + 0.28, fr0 + 0.44, 0.06], [x + 0.78, fr0 + 0.44, 0.06], 0.16, 0.05, carve, K, 5);
  }
  // ---- the giant consoles on every pier, from floor 15's sill line up to the corona
  const cTop = c.soffit;
  const cH = cTop - (f15 + sillUp - 0.05);
  for (const px of piers) giantConsole(T, px, cTop, 0.56, cH, CONSOLE_PROJ, carve, carveDk, K, triZY, [M.plain, 0.9, 0.45, 0]);
  // ---- the main cornice: bed moulding with egg-and-dart between the consoles, the corona, a cymatium
  T.box(x0 - 0.05, x1 + 0.05, fr0 + 0.6, cTop, 0, 0.2, COL.carve, P(0.6), "nz");
  eggAndDart(T, x0, x1, fr0 + 0.75, 0.2, 0.12, carve, K);
  // the corona: a deep overhang (~0.85 m past the consoles' fronts) on a shadowed soffit, modillions under its lip;
  // StreetStage throws its core shadow over the frieze (uCrownShade)
  const soffitC = shadeHex(COL.carve, 0.38);
  T.box(x0 - 0.9, x1 + 0.9, cTop, cTop + 0.44, 0, CORONA_PROJ, COL.carve, P(1.0), "", soffitC);
  T.box(x0 - 0.96, x1 + 0.96, cTop + 0.44, c.corniceTop, 0, CORONA_PROJ + 0.08, shadeHex(COL.carve, 1.03), P(1.0), "");
  // scrolled modillions: a thick root at the dentil line tapering on an S to a short tip under the corona's lip
  const mzb = CONSOLE_PROJ - 0.1;
  const mzt = CORONA_PROJ - 0.12;
  const crownMod: [number, number][] = [[mzt, cTop], [mzt, cTop - 0.11]];
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    crownMod.push([mzt - (mzt - mzb) * t, cTop - 0.11 - 0.2 * t * t + 0.035 * Math.sin(Math.PI * 2 * t) * (1 - t)]);
  }
  crownMod.push([mzb, cTop]);
  for (let x = x0 - 0.6; x < x1 + 0.6; x += 0.46) {
    if (piers.some((q) => Math.abs(q - x) < 0.45)) continue;
    extrudeZY(T, [...crownMod].reverse(), x - 0.075, x + 0.075, rgb01(shadeHex(COL.carve, 0.8)), P(0.7), 0.6, triZY);
  }
  T.box(x0 - 0.9, x1 + 0.9, cTop - 0.1, cTop, CONSOLE_PROJ - 0.15, CONSOLE_PROJ - 0.02, COL.carve, P(0.6), "", soffitC);
  decalZ(TD, x0, x1, fr0 + 0.6, 1.4, 0.21, 0.45, 0.02, -0.5);
  // the gutter and the mansard's foot
  T.box(x0 - 0.1, x1 + 0.1, c.corniceTop, c.atticY0, -0.2, 0.3, COL.across, P(0.8), "");
  // ---- the mansard: a bell of slate from the foot back to the roof, the dormers through it
  const my0 = c.atticY0;
  const my1 = c.atticY1;
  const mz = (t: number) => 0.18 - 0.55 * t - 1.7 * Math.pow(t, 4);
  const prof: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    prof.push([mz(t), my0 + t * (my1 - my0)]);
  }
  prof.push([-4.5, my1]);
  prof.push([-4.5, my0]);
  extrudeZY(T, prof, x0 - 0.05, x1 + 0.05, rgb01(COL.slate), aux(M.slate, 0.08), 0.5, triZY);
  // the dormers: big ones under segmental hoods on the even bays, small plain ones between
  for (let b = 0; b < bays; b++) {
    const big = b % 2 === 0;
    const x = ACROSS.bayX(b);
    const dw = big ? 1.75 : 1.25;
    const dwin = big ? 1.05 : 0.8;
    const dh = big ? 1.5 : 1.15;
    const ds = my0 + 0.35;
    const dTop = ds + dh + (big ? 0.55 : 0.3);
    const D2 = new GB();
    const D2D = new GB();
    // the front with its window, in a stone surround; cheeks back into the slate
    wallWithHoles(D2, x - dw / 2, x + dw / 2, my0, dTop, [[x - dwin / 2, x + dwin / 2, ds, ds + dh]], COL.across, aux(M.ashlar, 0.3));
    windowAt(D2, D2D, { x, sill: ds, w: dwin, h: dh, reveal: 0.18, stone: COL.acrossDk, seed: 7000 + b, lintel: "none", brick: false });
    D2.box(x - dw / 2, x + dw / 2, my0, dTop, -2.6, 0, COL.across, aux(M.ashlar, 0.3), "pz");
    D2.box(x - dwin / 2 - 0.14, x - dwin / 2, ds, ds + dh, 0, 0.06, COL.carve, P(0.6), "nz");
    D2.box(x + dwin / 2, x + dwin / 2 + 0.14, ds, ds + dh, 0, 0.06, COL.carve, P(0.6), "nz");
    D2.box(x - dw / 2 - 0.08, x + dw / 2 + 0.08, ds - 0.12, ds, 0, 0.14, COL.carve, P(0.9), "nz");
    if (big) {
      // a segmental hood: two moulded arcs, a carved keystone with a shell, scroll ends
      const hy = ds + dh + 0.12;
      const R = dw * 0.62;
      const arc = (t: number, rr: number): V3 => {
        const ang = Math.PI / 2 + (t - 0.5) * 1.6;
        return [x + R * Math.cos(ang) * 1.0, hy - R * Math.sin(1.6 / 2) * 0 + R * (Math.sin(ang) - Math.cos(0.8)) * 0.55, rr];
      };
      tube(D2, (t) => arc(t, 0.14), () => 0.085, carve, K, 24, 8);
      tube(D2, (t) => { const p = arc(t, 0.2); return [p[0], p[1] + 0.12, p[2]]; }, () => 0.07, carve, K, 24, 8);
      D2.box(x - 0.14, x + 0.14, hy - 0.12, hy + 0.32, 0, 0.18, COL.carve, [M.plain, 0.8, 0.6, 0], "nz");
      for (let i = 0; i < 5; i++) {
        const ang = Math.PI * (0.15 + (0.7 * i) / 4);
        tube(D2, (t) => [x + Math.cos(ang) * 0.22 * t, hy + 0.32 + Math.sin(ang) * 0.24 * t, 0.17], (t) => 0.035 + 0.02 * Math.sin(Math.PI * t), carve, K, 6, 5);
      }
      for (const k of [-1, 1] as const) volute(D2, [x + k * (dw / 2 + 0.02), hy - 0.05, 0.12], 0.13, 1.4, 0.03, k === 1 ? -1 : 1, carve, K, "xy", k === 1 ? 0 : Math.PI);
    } else {
      D2.box(x - dw / 2 - 0.06, x + dw / 2 + 0.06, dTop - 0.16, dTop, 0, 0.14, COL.carve, P(0.9), "");
      ellipsoid(D2, [x, ds + dh + 0.12, 0.08], [0.1, 0.1, 0.05], carve, K, 10, true);
    }
    // the dormer's roof back into the slate
    D2.box(x - dw / 2 - 0.05, x + dw / 2 + 0.05, dTop, dTop + 0.08, -2.6, 0.05, COL.slate, aux(M.slate, 0.4), "");
    appendGB(T, shiftZ(D2, 0.3));
    appendGB(TD, shiftZ(D2D, 0.3));
  }
  // ---- the cresting: a stone rail of small scrolled crest units, big shell-topped cartouches with acanthus scrolls
  const cz = mz(1) + 0.05;
  T.box(x0 - 0.05, x1 + 0.05, my1, my1 + 0.22, cz - 0.6, cz + 0.12, COL.carve, P(1.0), "");
  const bigX = [ACROSS.bayX(1) - 0.0, ACROSS.bayX(5), ACROSS.bayX(9)];
  for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.85) {
    if (bigX.some((q) => Math.abs(q - x) < 1.9)) continue;
    T.box(x - 0.16, x + 0.16, my1 + 0.22, my1 + 0.5, cz - 0.1, cz + 0.08, COL.carve, P(0.8), "");
    volute(T, [x, my1 + 0.62, cz + 0.06], 0.12, 1.3, 0.03, 1, carve, K, "xy", -Math.PI / 2);
  }
  for (const bx of bigX) {
    const big = bx === ACROSS.bayX(5);
    const w = big ? 1.9 : 1.6;
    const cy = my1 + 0.22 + 0.36 * w * 1.15 + 0.32;
    T.box(bx - w * 0.22, bx + w * 0.22, my1 + 0.2, my1 + 0.48, cz - 0.25, cz + 0.12, COL.carve, P(0.9), "");
    cartouche(T, [bx, cy, cz + 0.05], w, w * 1.15, carve, K);
    for (const k of [-1, 1] as const) acanthusScroll(T, bx + k * w * 0.42, my1 + 0.5, cz + 0.05, w * 0.85, k, carve, K);
  }
  CROWN = { solid: toAcross(T).geo(), decal: toAcross(TD).geo() };
  return CROWN;
};

const built = (): Built => {
  if (BUILT) return BUILT;
  const S = new GB();
  const D = new GB();
  const G = new GB();
  const SP = new GB();
  const C = new GB();
  const IN = new GB();
  buildHis(S, D, G, SP, C, IN);
  buildStreet(S, D);
  buildAcross(S, D);
  BUILT = { solid: S.geo(), decal: D.geo(), glass: G.geo(), spill: SP.geo(), curtain: C.geo(), inner: IN.geo() };
  return BUILT;
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const CameraRig: React.FC<{ cam: StreetCam }> = ({ cam }) => {
  const { camera } = useThree();
  const c = camera as Any;
  c.fov = (2 * Math.atan(960 / cam.f) * 180) / Math.PI;
  c.aspect = W / H;
  c.near = 0.05;
  c.far = 3000;
  c.position.set(cam.x, cam.y, cam.z);
  c.rotation.order = "YXZ";
  c.rotation.set(cam.pitch * D2R, -cam.yaw * D2R, 0);
  c.setViewOffset(W, H, 0, 960 - (cam.cy ?? 960), W, H);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  return null;
};
/** the key light: from the camera's upper left and a little in front (the style's light, whichever way we look) */
const lightFor = (cam: StreetCam): V3 => {
  const B = basis({ ...cam, pitch: 0 });
  const l: V3 = [-0.55 * B.right[0] + 0.3 * -B.fwd[0], 0.78, -0.55 * B.right[2] + 0.3 * -B.fwd[2]];
  const n = Math.hypot(...l);
  return [l[0] / n, l[1] / n, l[2] / n];
};
/** the sweep: y centre (m), w half-width (m, default 2.5), amt 0..1 (clamped), col the band's tint (hex, default the
 *  medium's cream), glint the pane glint's strength (default 1) */
export type Sweep = { y: number; w?: number; amt: number; col?: string; glint?: number };
/** the glow's rim: lo/hi its smoothstep edges (default 0.12 / 0.55), max its alpha clamp (default 0.95), warm a
 *  multiplier on the lit faces' body warmth (default 1) */
export type GlowRim = { lo?: number; hi?: number; max?: number; warm?: number };
export type StreetStageProps = {
  cam: StreetCam;
  rest: StreetCam;
  frame: number;
  /** his window's lamp 0..1 */
  lamp?: number;
  /** the curtains' stir 0..1+ */
  curtain?: number;
  /** the crown's accent glow 0..1 */
  glow?: number;
  /** the glow's rim shape (see GlowRim; every field defaults to today's look) */
  glowRim?: GlowRim;
  /** a soft band of cream light passing over the building across (its storeys counted by eye): y centre (m), w
   *  half-width (m), amt 0..1 */
  sweep?: Sweep;
  /** more three.js children inside the canvas */
  extra?: React.ReactNode;
  air?: Partial<AirScene>;
  shafts?: number;
  motes?: number;
  bloom?: number;
  overlay?: React.ReactNode;
  front?: React.ReactNode;
  /** hide parts (probes) */
  hide?: "crown"[];
};
const StreetScene: React.FC<{ cam: StreetCam; frame: number; lamp: number; curtain: number; glow: number; glowRim?: GlowRim; sweep?: Sweep; eyeT: number; air: AirScene; hide: string[] }> = ({ cam, frame, lamp, curtain, glow, glowRim, sweep, eyeT, air, hide }) => {
  const mats = useMemo(makeMats, []);
  const B = built();
  const CR = buildCrownGeo();
  const L = lightFor(cam);
  const all = [mats.solid, mats.decal, mats.glass, mats.spill, mats.curtain];
  for (const m of all) {
    m.uniforms.uL.value.set(L[0], L[1], L[2]);
    m.uniforms.uFog.value.set(air.fogNear, air.fogVis, air.fogMax, eyeT);
    m.uniforms.uAirH.value.set(air.hLow, air.hHigh, VEIL.veil, VEIL.low);
    if (m.uniforms.uLamp) m.uniforms.uLamp.value = lamp;
    if (m.uniforms.uTime) m.uniforms.uTime.value = frame;
  }
  mats.solid.uniforms.uGlow.value = glow;
  mats.solid.uniforms.uSweep.value.set(sweep?.y ?? 0, sweep?.w ?? 2.5, Math.min(1, Math.max(0, sweep?.amt ?? 0)));
  mats.solid.uniforms.uSweepCol.value.copy(v3(sweep?.col ?? PAL.cream));
  mats.solid.uniforms.uSweepGlint.value = sweep?.glint ?? 1;
  mats.solid.uniforms.uGlowRim.value.set(glowRim?.lo ?? 0.12, glowRim?.hi ?? 0.55, glowRim?.max ?? 0.95, glowRim?.warm ?? 1);
  mats.solid.uniforms.uCrownShade.value.x = hide.includes("crown") ? 0 : 1;
  mats.curtain.uniforms.uStir.value = curtain;
  return (
    <>
      <mesh geometry={B.solid} material={mats.solid} />
      {/* his window's inside closures: only near or inside it (they are hidden from the street; cut 26 never draws them) */}
      {cam.z < 1.0 ? <mesh geometry={B.inner} material={mats.solid} /> : null}
      {hide.includes("crown") ? null : <mesh geometry={CR.solid} material={mats.solid} />}
      <mesh geometry={B.curtain} material={mats.curtain} />
      <mesh geometry={B.decal} material={mats.decal} renderOrder={2} />
      {hide.includes("crown") ? null : <mesh geometry={CR.decal} material={mats.decal} renderOrder={2} />}
      <mesh geometry={B.glass} material={mats.glass} renderOrder={3} />
      <mesh geometry={B.spill} material={mats.spill} renderOrder={4} />
    </>
  );
};
export const streetAirView = (cam: StreetCam, rest: StreetCam, frame: number, air?: Partial<AirScene>) => {
  const scene: AirScene = { ...STREET_AIR, ...air, F: cam.f };
  const B0 = basis({ ...rest, pitch: 0 });
  const toV = (c: StreetCam) => ({ x: dot([c.x, 0, c.z], B0.right), y: c.y, z: dot([c.x, 0, c.z], B0.fwd) });
  return makeAirView({ scene, frame, horizon: horizonRow(cam), cam: toV(cam), rest: toV(rest) });
};
export const StreetStage: React.FC<StreetStageProps> = ({ cam, rest, frame, lamp = 0, curtain = 1, glow = 0, glowRim, sweep, extra, air, shafts = 1, motes = 1, bloom = 0, overlay, front, hide = [] }) => {
  const v = streetAirView(cam, rest, frame, air);
  // the glowing carving's soft halo: the kit's orange-only bloom, raised with glow (a cut's own bloom wins if higher)
  const bl = Math.max(bloom, 0.45 * glow);
  return (
    <AirStage v={v} shafts={shafts} motes={motes} bloom={bl} overlay={overlay} front={front}>
      <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <CameraRig cam={cam} />
        <StreetScene cam={cam} frame={frame} lamp={lamp} curtain={curtain} glow={glow} glowRim={glowRim} sweep={sweep} eyeT={v.eyeT} air={v.scene} hide={hide} />
        {extra}
      </ThreeCanvas>
    </AirStage>
  );
};
/** the crown alone as a three.js mesh, for a canvas a cut stages itself (StreetStage already draws it; pass
 *  hide={["crown"]} there and this as `extra` to transform it, e.g. a probe). Lit and fogged for `cam`. */
export const CarvedCrown: React.FC<{ cam: StreetCam; glow?: number; eyeT?: number }> = ({ cam, glow = 0, eyeT = PAL.eyeT }) => {
  const mats = useMemo(makeMats, []);
  const CR = buildCrownGeo();
  const L = lightFor(cam);
  for (const m of [mats.solid, mats.decal]) {
    m.uniforms.uL.value.set(L[0], L[1], L[2]);
    m.uniforms.uFog.value.set(STREET_AIR.fogNear, STREET_AIR.fogVis, STREET_AIR.fogMax, eyeT);
  }
  mats.solid.uniforms.uGlow.value = glow;
  mats.solid.uniforms.uCrownShade.value.x = 1;
  return (
    <>
      <mesh geometry={CR.solid} material={mats.solid} />
      <mesh geometry={CR.decal} material={mats.decal} renderOrder={2} />
    </>
  );
};
