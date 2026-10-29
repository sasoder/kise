// ===================================================================================================================
// gigawattCost — THE COST COLUMN of sam-gigawatt-cost (Cheeky Pint S4E07, Sam Altman: "a gigawatt of AI should cost
// $20 billion, not $70"). Owner: cut 6 (SeventyBillionAGigawatt). Cut 7 imports it read-only and draws the SAME
// column at $20B (20/70 of the $70B height) beside the same campus (campusWorld.tsx, cut 5's, read-only).
// The medium is the Scott "air" look (scott-aircraft-order/aircraftShared.tsx AirStage, read-only): render with
// --gl=angle; everything 3D goes inside <AirStage world>, the readout and year labels in its `overlay`.
//
// WHAT IT IS. The dollars are GOLD: a neat stack of bullion slabs (each a tapered ingot, the classic stacked-gold
// silhouette), ONE SLAB = $5B, so $70B = 14 slabs and $20B = 4. The stack rises out of a real slot in a concrete
// apron in front of the campus, under the stage's one key light (LIGHT.side, from the upper left and a little in
// front), with a contact ring and a cast shadow on the apron. Nothing floats.
//
// WORLD UNITS: metres, as aircraftShared: X right, Y up (ground 0), Z AWAY from the camera. The campus sits at
// [0, 0], heading 0 (campusWorld: pad x -495..365, z -200..200). The column stands on the near apron, front right
// of the campus (COST.at), so its shadow (right and back) falls on open apron, never on the campus.
//
// API
//   COST                 { perSlab ($B), slab {L, W, H, taper} (m), at [X, Z] (the column's centre), slot margin,
//                        apron [x0, z0, x1, z1], years {...} }
//   costHeight(billions) the stack's height in metres (billions / perSlab * slab.H)
//   costTop(billions, at?) the world point at the centre of the stack's top face [X, Y, Z]
//   <CostApron at? billions rise open? years? glow?>  the concrete apron (paints over the desert, under the campus
//                        pad): slab joints, the slot (open 0..1 = a seam parting to the full mouth), the column's
//                        contact ring and cast shadow (exact swept box of the visible stack), and the five year
//                        tiles (years: 0..5, each tile turns from unlit glass to lit amber as the front passes;
//                        rule 0..1: the rule's entrance, surfacing out of the concrete left to right; 0 = bare apron).
//   <GoldColumn billions rise at?>  the slab stack: `rise` 0..1 = how much of it has come up out of the slot (the
//                        whole stack translates; what is below the apron is hidden), billions = its full size.
//   <CostReadout cam text sub enter px?>  the readout over the column's top (SCREEN svg; pin it with the same
//                        cam): Söhne Dreiviertelfett numerals in cream that cast one soft shadow down-right, the
//                        stout entrance (blur in + 24 px slide up); `sub` in Kräftig caps under it.
//   <YearMarks cam years px?>  the numerals 1..5 over the year tiles and "YEARS" after them (ink on the concrete)
//   CUT6_END_CAM         cut 6's resolved camera (its last frame). Cut 7 opens on it.
// ===================================================================================================================
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR, FONT_LABEL, FONT_NUM, TRACK } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, LIGHT, airCamAt, airProject, airTrack, type AirCam, type AirGlide, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { CAMPUS, CAMPUS_FOG, campusToWorld } from "./campusWorld";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const D2R = Math.PI / 180;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const easeOut3 = (v: number) => 1 - Math.pow(1 - c01(v), 3);

// ===================================================================================================================
// GEOMETRY
// ===================================================================================================================
export const COST = {
  /** one slab = $5B: $70B = 14 slabs, $20B = 4 */
  perSlab: 5,
  /** one ingot (m): L along X (faces the camera), W along Z, H tall; each side face leans in by `taper` */
  slab: { L: 100, W: 56, H: 28, taper: 5 },
  /** the column's centre on the apron [X, Z] and its heading (deg, campusWorld's convention): turned a little so
   *  its lit left face shows beside its front */
  at: [-97, -490] as [number, number],
  heading: -14,
  /** the slot's mouth is the slab's base plus this margin on every side (m) */
  slot: 3,
  /** the concrete apron [x0, z0, x1, z1]: from the campus pad's front edge toward the camera; its near edge is the
   *  rule the year tiles stand on */
  apron: [-1400, -705, 1500, -200] as [number, number, number, number],
  /** the five year tiles: inlaid along the apron's near edge, x0 + i * pitch, centred on z */
  years: { x0: -247, pitch: 75, w: 52, d: 30, z: -662 },
} as const;
export const COST_70 = 70;
export const costHeight = (billions: number) => (billions / COST.perSlab) * COST.slab.H;
export const costTop = (billions: number, at: [number, number] = COST.at): V3 => [at[0], costHeight(billions), at[1]];
/** the far edge of the stack's top face (where its readout stands), world */
export const costTopFar = (billions: number, at: [number, number] = COST.at): V3 => campusToWorld(at, COST.heading, [0, costHeight(billions), COST.slab.W / 2 - COST.slab.taper]);
/** world centre of year tile i (0..4) */
export const yearAt = (i: number): V3 => [COST.years.x0 + i * COST.years.pitch, 0, COST.years.z];

// --- cut 6's camera: ONE slow push (damped start, damped landing) toward the column and the campus --------------
export const CUT6_FRAMES = 132;
export const CUT6_CAM_START: SideCam = { mode: "side", x: -95, y: 440, z: -1000, f: 1000, pitch: 14.4, yaw: -0.3, horizon: 719 };
const CUT6_GLIDES: AirGlide[] = [{ f0: 0, f1: 150, to: { x: -112, y: 432, z: -949, pitch: 14.6, yaw: 0.4 } }];
export const CUT6_TRACK = airTrack(CUT6_CAM_START, CUT6_GLIDES, CUT6_FRAMES + 2);
export const cut6CamAt = (f: number) => airCamAt(CUT6_TRACK, f) as SideCam;
/** cut 6's resolved camera (its last frame, f131); cut 7 opens on it */
export const CUT6_END_CAM: SideCam = cut6CamAt(CUT6_FRAMES - 1);

// ===================================================================================================================
// SHADERS
// ===================================================================================================================
const COMMON_GLSL = /* glsl */ `
uniform vec4 uCFog;   // near, vis, max
uniform vec3 uHazeLo;
uniform vec3 uHazeHi;
float cFogAt(vec3 w) {
  float d = length(w - cameraPosition);
  return uCFog.z * (1.0 - exp(-max(0.0, d - uCFog.x) / uCFog.y));
}
vec3 cFogCol(vec3 w) { return mix(uHazeLo, uHazeHi, smoothstep(0.0, 320.0, w.y)); }
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
float band(float x, float lo, float hi, float pw) {
  float a = clamp(x - pw * 0.5, lo, hi);
  float b = clamp(x + pw * 0.5, lo, hi);
  return (b - a) / max(pw, 1e-4);
}
float sdBox2(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
`;

// --- the gold slabs --------------------------------------------------------------------------------------------------
const GOLD_VERT = /* glsl */ `
attribute vec3 aSlab;     // slab index, local height in the slab (0..H), face kind (0 top, 1 side)
uniform float uLift;      // world y of the stack's base (<= 0 while it is still coming up)
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec3 vSlab;
void main() {
  vec3 p = position;
  p.y += uLift;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vSlab = aSlab;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GOLD_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uTop;
uniform vec3 uFoot;
uniform vec3 uHot;
uniform vec3 uShade;
uniform float uFullH;
uniform float uSlabH;
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec3 vSlab;
void main() {
  // what is still below the apron (inside the slot) is not seen
  if (vW.y < 0.0) discard;
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  // the stout amber band: amberTop at the stack's top, amberFoot at its foot
  float hy = clamp(vW.y / max(uFullH, 1.0), 0.0, 1.0);
  vec3 base = mix(uFoot, uTop, smoothstep(0.0, 1.0, hy));
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.45, 0.85, ndl);
  vec3 col = mix(base * uShade, base * 1.02, lit);
  // tops catch the sky and the sun: toward the hot cream-gold
  float up = max(n.y, 0.0);
  col = mix(col, uHot, 0.42 * smoothstep(0.85, 1.0, up));
  // gold's specular: a soft broad sheen and a tight glint
  vec3 Hh = normalize(uL + V);
  float nh = max(dot(n, Hh), 0.0);
  col += uHot * (0.16 * pow(nh, 6.0) + 0.22 * pow(nh, 40.0));
  // a faint metal grain along the ingot (cast surface), never strobing
  float pw = length(fwidth(vW.xz));
  col *= 1.0 + 0.03 * (vnoise(vW.xz * 0.45 + vW.y * 0.8) - 0.5) * (1.0 - smoothstep(0.3, 1.2, pw));
  // the joint: each slab sits in the shade of the ingot above it at the top of its side faces, and darkens into
  // its contact with the one below at the foot
  if (vSlab.z > 0.5) {
    float y = vSlab.y;
    float py = max(fwidth(y), 1e-3);
    float foot = 1.0 - smoothstep(0.0, 2.2 + py, y);
    float head = smoothstep(uSlabH - 3.0 - py, uSlabH, y);
    col *= 1.0 - 0.26 * foot - 0.1 * head;
    // the hot edge along each ingot's top rim catches the key light
    col = mix(col, uHot, 0.35 * smoothstep(uSlabH - 0.9 - py, uSlabH, y) * lit);
  }
  float f = cFogAt(vW) * 0.3;
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), 1.0);
}`;

// --- the apron -------------------------------------------------------------------------------------------------------
const APRON_VERT = /* glsl */ `
${COMMON_GLSL}
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const APRON_FRAG = /* glsl */ `
uniform vec4 uApron;      // x0, z0, x1, z1 (world X, Z)
uniform vec4 uCol;        // column centre X, Z, half L, half W (base)
uniform vec2 uColRot;     // cos, sin of the column's heading
uniform float uColH;      // visible height of the stack (m)
uniform float uOpen;      // the slot: 0 a closed seam .. 1 the full mouth
uniform float uMargin;
uniform vec3 uLw;         // toward the light (world)
uniform vec4 uYears;      // x0, pitch, half w, half d
uniform float uYearZ;
uniform float uYearOn[5]; // 0..1 lit
uniform float uFront;     // the run front along the rule (world X), -1e5 = not started
uniform float uRule;      // the rule's entrance 0..1: it comes up out of the concrete, left to right
uniform vec3 uConc;
uniform vec3 uConcLo;
uniform vec3 uJoint;
uniform vec3 uShadow;
uniform vec3 uEdge;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec3 uGlass;
${COMMON_GLSL}
varying vec3 vW;
void edgeS(vec2 p, vec2 a, vec2 b, inout float d, inout float s) {
  vec2 e = a - b;
  vec2 w = p - b;
  vec2 q = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
  d = min(d, dot(q, q));
  bvec3 c = bvec3(p.y >= b.y, p.y < a.y, e.x * w.y > e.y * w.x);
  if (all(c) || all(not(c))) s *= -1.0;
}
// exact signed distance to an axis-aligned box (half size b) swept along v: its shadow on the ground
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
  edgeS(q, p5, p0, d, s);
  edgeS(q, p0, p1, d, s);
  edgeS(q, p1, p2, d, s);
  edgeS(q, p2, p3, d, s);
  edgeS(q, p3, p4, d, s);
  edgeS(q, p4, p5, d, s);
  return s * sqrt(d);
}
void main() {
  // world (X, Z), Z away from the camera
  vec2 p = vec2(vW.x, -vW.z);
  vec2 fw = fwidth(p);
  float pw = max(max(fw.x, fw.y), 0.02);
  vec2 ac = (uApron.xy + uApron.zw) * 0.5;
  vec2 ah = (uApron.zw - uApron.xy) * 0.5;
  float sdA = sdBox2(p - ac, ah);
  float a = 1.0 - smoothstep(-pw * 0.5, pw * 0.5, sdA);
  if (a <= 0.001) discard;
  // concrete: 7.5 m slabs (the campus pad's), each its own tone; joints; broad stains
  vec2 cell = floor(p / 7.5);
  float slab = h2(cell + 11.3);
  vec3 col = mix(uConcLo, uConc, 0.55 + 0.45 * slab);
  col *= 0.95 + 0.07 * fbm(p * 0.35);
  col = mix(col, uConcLo * 0.9, smoothstep(0.62, 0.8, fbm(p * 0.018 + 7.0)) * 0.28);
  vec2 g = abs(fract(p / 7.5 + 0.5) - 0.5) * 7.5;
  float line = (1.0 - smoothstep(0.07, 0.07 + pw * 1.2, min(g.x, g.y))) * 0.3 * (1.0 - smoothstep(0.08, 0.45, pw));
  col = mix(col, uJoint, line * 0.75);
  // the near edge: the slab's lit lip
  float lip = band(p.y - uApron.y, 0.0, 1.4, fw.y);
  col = mix(col, uEdge, lip * 0.7);

  // --- the year rule: five tiles inlaid along the near edge, joined by a thin groove the run front lights ---
  vec3 col0 = col;
  float ruleZ = uYearZ;
  float x0 = uYears.x - uYears.z;
  float x1 = uYears.x + 4.0 * uYears.y + uYears.z;
  float groove = band(abs(p.y - ruleZ), 0.0, 1.1, fw.y) * band(p.x, x0, x1, fw.x);
  float lit = groove * (1.0 - smoothstep(uFront - 2.0, uFront + 2.0, p.x));
  col = mix(col, uJoint * 0.75, groove * 0.85);
  vec3 amb = mix(uAmberTop, uAmberHot, 0.18);
  col = mix(col, amb, lit);
  float emis = lit;
  for (int i = 0; i < 5; i++) {
    vec2 c = vec2(uYears.x + float(i) * uYears.y, ruleZ);
    vec2 q = p - c;
    float sd = sdBox2(q, uYears.zw);
    float inT = 1.0 - smoothstep(-pw * 0.5, pw * 0.5, sd);
    if (inT > 0.0) {
      // unlit: a dark glass panel set in the concrete; lit: amber from within, hottest at its centre
      float on = uYearOn[i];
      float r = length(q / uYears.zw);
      vec3 off = mix(uGlass, uGlass * 0.82, smoothstep(0.0, 1.2, r));
      vec3 onc = mix(mix(uAmberHot, uAmberTop, 0.6), uAmberTop, smoothstep(0.0, 1.0, r));
      onc = mix(onc, uAmberFoot, 0.35 * smoothstep(0.6, 1.0, max(abs(q.x) / uYears.z, abs(q.y) / uYears.w)));
      col = mix(col, mix(off, onc, on), inT);
      emis = max(emis, on * inT);
    }
    // the tile's frame: a thin cream rim catching the key light, a dark seam on the far side
    float rim = band(sd, 0.0, 1.2, pw) * (1.0 - smoothstep(0.0, 2.0, sd));
    col = mix(col, uEdge, rim * 0.6);
    // amber spills onto the concrete around a lit tile
    col = mix(col, uAmberTop, uYearOn[i] * 0.4 * exp(-max(sd, 0.0) / 5.0) * step(0.0, sd));
  }
  // the entrance: a soft front sweeps left to right while the whole rule surfaces out of the concrete tone
  float rx = mix(x0 - 60.0, x1 + 60.0, uRule);
  float reveal = (1.0 - smoothstep(rx - 50.0, rx + 10.0, p.x)) * smoothstep(0.0, 0.6, uRule);
  col = mix(col0, col, reveal);
  emis *= reveal;

  // --- the slot, the column's contact and its cast shadow ---
  // into the column's own frame (campusToWorld inverted)
  vec2 cw = p - uCol.xy;
  vec2 cq = vec2(cw.x * uColRot.x - cw.y * uColRot.y, cw.x * uColRot.y + cw.y * uColRot.x);
  vec2 mouth = uCol.zw + vec2(uMargin);
  vec2 seam = vec2(mouth.x, mix(0.25, mouth.y, uOpen));
  float sdS = sdBox2(cq, seam);
  float slotIn = 1.0 - smoothstep(-pw * 0.5, pw * 0.5, sdS);
  // the recess: deep toward its near wall (we look down onto the far inner wall, which the light reaches a little)
  float far = clamp((cq.y / max(seam.y, 0.01)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 pit = mix(uShadow * 0.92, mix(uShadow, uConcLo, 0.3), smoothstep(0.55, 1.0, far));
  // its lips: the near lip lit (cream rim), a thin dark line on the far edge
  float nearLip = band(sdS, 0.0, 1.0, pw) * step(cq.y, 0.0);
  float sh = 0.0;
  float ao = 0.0;
  if (uColH > 0.05) {
    vec2 Lw2 = vec2(uLw.x, uLw.z);
    vec2 Lxz = vec2(Lw2.x * uColRot.x - Lw2.y * uColRot.y, Lw2.x * uColRot.y + Lw2.y * uColRot.x);
    vec2 v = -Lxz / max(uLw.y, 0.05) * uColH;
    float sd = sdSwept(cq, uCol.zw, v);
    float pen = 0.6 + 0.012 * uColH + 0.7 * pw;
    sh = 1.0 - smoothstep(-pen, pen, sd);
    float sdb = sdBox2(cq, uCol.zw);
    ao = (1.0 - smoothstep(0.0, 9.0 + pw, sdb)) * smoothstep(0.0, 6.0, uColH);
  }
  col = mix(col, col * 0.8, ao * 0.5);
  col = mix(col, uShadow, sh * 0.5 * (1.0 - emis * 0.7));
  col = mix(col, pit, slotIn);
  col = mix(col, uEdge, nearLip * 0.65 * (1.0 - slotIn));

  float f = cFogAt(vW) * (1.0 - 0.5 * emis);
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), a);
}`;

// ===================================================================================================================
// MATERIALS
// ===================================================================================================================
const fogUniforms = () => ({
  uCFog: { value: new THREE.Vector4(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max, 0) },
  uHazeLo: { value: v3(SKY.haze) },
  uHazeHi: { value: v3(SKY.glow) },
});
/** the key light in three space (z flipped), side views only */
const useLight = (): V3 => {
  useThree();
  const L = LIGHT.side;
  return [L[0], L[1], -L[2]];
};

/** the slab stack's geometry: n tapered ingots, flat-shaded (non-indexed), local origin = the stack's foot centre,
 *  three-local (x, y, -z). A slab's small deterministic offset keeps it a hand-stacked pile, not an extrusion. */
const stackCache = new Map<number, Any>();
const stackGeo = (n: number) => {
  const have = stackCache.get(n);
  if (have) return have;
  const { L, W, H, taper: t } = COST.slab;
  const pos: number[] = [];
  const nor: number[] = [];
  const aux: number[] = [];
  const quad = (a: V3, b: V3, c: V3, d: V3, si: number, yA: number[], kind: number) => {
    // normal from the quad (a, b, c) in world-like coords, then three-local z flip
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let nx = u[1] * v[2] - u[2] * v[1];
    let ny = u[2] * v[0] - u[0] * v[2];
    let nz = u[0] * v[1] - u[1] * v[0];
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    const P = [a, b, c, a, c, d];
    const Y = [yA[0], yA[1], yA[2], yA[0], yA[2], yA[3]];
    P.forEach((q, i) => {
      pos.push(q[0], q[1], -q[2]);
      nor.push(nx, ny, -nz);
      aux.push(si, Y[i], kind);
    });
  };
  for (let i = 0; i < n; i++) {
    const jx = (Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1;
    const jz = (Math.sin(i * 78.233 + 1.7) * 43758.5453) % 1;
    const ox = jx * 1.6;
    const oz = jz * 1.2;
    const y0 = i * H;
    const y1 = y0 + H;
    const bx = L / 2;
    const bz = W / 2;
    const tx = L / 2 - t;
    const tz = W / 2 - t;
    // corners (world-like: x, y, z with z away from the camera); B = base, T = top
    const B = [
      [ox - bx, y0, oz - bz],
      [ox + bx, y0, oz - bz],
      [ox + bx, y0, oz + bz],
      [ox - bx, y0, oz + bz],
    ] as V3[];
    const T = [
      [ox - tx, y1, oz - tz],
      [ox + tx, y1, oz - tz],
      [ox + tx, y1, oz + tz],
      [ox - tx, y1, oz + tz],
    ] as V3[];
    // sides: front (-z), right (+x), back (+z), left (-x); outward normals: wind so (b-a) x (c-a) points out
    quad(B[1], B[0], T[0], T[1], i, [0, 0, H, H], 1);
    quad(B[2], B[1], T[1], T[2], i, [0, 0, H, H], 1);
    quad(B[3], B[2], T[2], T[3], i, [0, 0, H, H], 1);
    quad(B[0], B[3], T[3], T[0], i, [0, 0, H, H], 1);
    // top
    quad(T[0], T[3], T[2], T[1], i, [H, H, H, H], 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("aSlab", new THREE.BufferAttribute(new Float32Array(aux), 3));
  g.computeBoundingSphere();
  stackCache.set(n, g);
  return g;
};

// ===================================================================================================================
// COMPONENTS (pure per frame: AirStage mounts `world` twice)
// ===================================================================================================================
/** GoldColumn — the stack of gold slabs for `billions` (whole slabs of COST.perSlab), risen `rise` 0..1 out of
 *  its slot at `at`. The whole stack translates up; the part still in the slot is hidden. */
export const GoldColumn: React.FC<{ billions: number; rise: number; at?: [number, number]; fog?: number }> = ({ billions, rise, at = COST.at, fog = 1 }) => {
  const L = useLight();
  const n = Math.max(1, Math.round(billions / COST.perSlab));
  const fullH = n * COST.slab.H;
  const o = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: GOLD_VERT,
      fragmentShader: GOLD_FRAG,
      transparent: true,
      depthWrite: true,
      depthTest: true,
      // closed convex ingots: the near faces win the depth test, so the winding does not matter
      side: THREE.DoubleSide,
      uniforms: {
        ...fogUniforms(),
        uLift: { value: 0 },
        uL: { value: new THREE.Vector3(0, 1, 0) },
        uTop: { value: v3(COLOR.amberTop) },
        uFoot: { value: v3(COLOR.amberFoot) },
        uHot: { value: v3(COLOR.amberHot) },
        // the shade side of gold: a deep warm brown-gold, never black
        uShade: { value: new THREE.Vector3(0.7, 0.58, 0.5) },
        uFullH: { value: 1 },
        uSlabH: { value: COST.slab.H },
      },
    });
    const mesh = new THREE.Mesh(stackGeo(n), mat);
    mesh.frustumCulled = false;
    // after the campus buildings (renderOrder 0, transparent pass) and the pads (no depth test)
    mesh.renderOrder = 1;
    return { mesh, mat };
  }, [n]);
  const u = o.mat.uniforms;
  u.uLift.value = -(1 - c01(rise)) * (fullH + 1);
  u.uFullH.value = fullH;
  u.uL.value.set(L[0], L[1], L[2]);
  u.uCFog.value.set(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max * fog, 0);
  o.mesh.position.set(at[0], 0, -at[1]);
  o.mesh.rotation.set(0, -COST.heading * D2R, 0);
  o.mesh.visible = rise > 0.0005;
  return <primitive object={o.mesh} />;
};

/** CostApron — the concrete apron in front of the campus with the column's slot, contact and shadow, and the year
 *  rule. `billions` + `rise` must match the GoldColumn (the shadow is the visible stack's). `years` 0..5: tile i is
 *  lit by c01(years - i); `front` is the run front along the rule (world X; default from `years`). */
export const CostApron: React.FC<{ billions: number; rise: number; open?: number; years?: number; rule?: number; at?: [number, number]; fog?: number }> = ({
  billions,
  rise,
  open = 1,
  years = 0,
  rule = 1,
  at = COST.at,
  fog = 1,
}) => {
  const L = LIGHT.side;
  useThree();
  const o = useMemo(() => {
    const [x0, z0, x1, z1] = COST.apron;
    const geo = new THREE.PlaneGeometry(x1 - x0 + 4, z1 - z0 + 4);
    geo.rotateX(-Math.PI / 2);
    geo.translate((x0 + x1) / 2, 0, -(z0 + z1) / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: APRON_VERT,
      fragmentShader: APRON_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        ...fogUniforms(),
        uApron: { value: new THREE.Vector4(x0, z0, x1, z1) },
        uCol: { value: new THREE.Vector4(0, 0, 0, 0) },
        uColRot: { value: new THREE.Vector2(1, 0) },
        uColH: { value: 0 },
        uOpen: { value: 1 },
        uMargin: { value: COST.slot },
        uLw: { value: new THREE.Vector3(L[0], L[1], L[2]) },
        uYears: { value: new THREE.Vector4(COST.years.x0, COST.years.pitch, COST.years.w / 2, COST.years.d / 2) },
        uYearZ: { value: COST.years.z },
        uYearOn: { value: [0, 0, 0, 0, 0] },
        uFront: { value: -1e5 },
        uRule: { value: 1 },
        uConc: { value: v3(AIR_COLOR.concrete) },
        uConcLo: { value: v3(AIR_COLOR.concreteLo) },
        uJoint: { value: v3(AIR_COLOR.joint) },
        uShadow: { value: v3(COLOR.shadow) },
        uEdge: { value: v3(COLOR.cream) },
        uAmberTop: { value: v3(COLOR.amberTop) },
        uAmberFoot: { value: v3(COLOR.amberFoot) },
        uAmberHot: { value: v3(COLOR.amberHot) },
        uGlass: { value: v3("#76604B") },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    // over the desert (opaque, -3), under the campus pad (-2): both paint without a depth test
    mesh.renderOrder = -2.5;
    return { mesh, mat };
  }, []);
  const u = o.mat.uniforms;
  const n = Math.max(1, Math.round(billions / COST.perSlab));
  const fullH = n * COST.slab.H;
  // the visible stack: the slab's base footprint (the widest part) over the visible height
  u.uCol.value.set(at[0], at[1], COST.slab.L / 2, COST.slab.W / 2);
  u.uColRot.value.set(Math.cos(COST.heading * D2R), Math.sin(COST.heading * D2R));
  u.uColH.value = Math.max(0, c01(rise) * (fullH + 1) - 1);
  u.uOpen.value = c01(open);
  u.uYearOn.value = [0, 1, 2, 3, 4].map((i) => c01(years - i));
  u.uRule.value = c01(rule);
  // the run front: the groove is lit up to the centre of the tile being reached (tile 0's left edge at years 0)
  const yx = (t: number) => COST.years.x0 - COST.years.w / 2 + t * COST.years.pitch;
  u.uFront.value = years > 0 ? yx(Math.min(years, 4.5)) : -1e5;
  u.uCFog.value.set(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max * fog, 0);
  return <primitive object={o.mesh} />;
};

// --- the halls alight (the install beat) -----------------------------------------------------------------------------
const FILL_VERT = /* glsl */ `
attribute vec2 aHall;     // hall index (rise order), local height 0..1
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec2 vHall;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vHall = aHall;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FILL_FRAG = /* glsl */ `
uniform float uFill[8];
uniform vec3 uAmber;
uniform vec3 uHot;
uniform vec3 uL;
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec2 vHall;
void main() {
  int i = int(vHall.x + 0.5);
  float fl = 0.0;
  for (int k = 0; k < 8; k++) if (k == i) fl = uFill[k];
  // the light fills each hall from the floor up (a soft front), then holds
  float front = fl * 1.25;
  float a = smoothstep(front, front - 0.25, vHall.y) * smoothstep(0.0, 0.15, fl);
  if (a < 0.003) discard;
  vec3 n = normalize(vN);
  float top = smoothstep(0.5, 0.95, n.y);
  vec3 col = mix(uAmber, uHot, 0.18 + 0.25 * top);
  float alpha = a * mix(0.56, 0.34, top);
  float f = cFogAt(vW) * 0.5;
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), alpha * (1.0 - f * 0.5));
}`;
const fillGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const pos: number[] = [];
    const nor: number[] = [];
    const aux: number[] = [];
    const { length: L, width: W } = CAMPUS.hall;
    const Ht = CAMPUS.top + 0.4;
    const e = 0.5;
    CAMPUS.halls.forEach(([hx, hz], i) => {
      const x0 = hx - L / 2 - e;
      const x1 = hx + L / 2 + e;
      const z0 = hz - W / 2 - e;
      const z1 = hz + W / 2 + e;
      // faces: front (-z), back, left, right, top; world-like (x, y, z) -> three (x, y, -z)
      const F: [V3[], V3][] = [
        [[[x0, 0, z0], [x1, 0, z0], [x1, Ht, z0], [x0, Ht, z0]], [0, 0, -1]],
        [[[x1, 0, z1], [x0, 0, z1], [x0, Ht, z1], [x1, Ht, z1]], [0, 0, 1]],
        [[[x0, 0, z1], [x0, 0, z0], [x0, Ht, z0], [x0, Ht, z1]], [-1, 0, 0]],
        [[[x1, 0, z0], [x1, 0, z1], [x1, Ht, z1], [x1, Ht, z0]], [1, 0, 0]],
        [[[x0, Ht, z0], [x1, Ht, z0], [x1, Ht, z1], [x0, Ht, z1]], [0, 1, 0]],
      ];
      for (const [q, n] of F) {
        for (const j of [0, 1, 2, 0, 2, 3]) {
          pos.push(q[j][0], q[j][1], -q[j][2]);
          nor.push(n[0], n[1], -n[2]);
          aux.push(i, q[j][1] / Ht);
        }
      }
    });
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
    g.setAttribute("aHall", new THREE.BufferAttribute(new Float32Array(aux), 2));
    g.computeBoundingSphere();
    return g;
  };
})();
/** HallsAlight — the install: light comes on inside the campus's eight halls (campusWorld's GigawattCampus at
 *  [0, 0], heading 0), each filling with amber from the floor up, centre halls first (CAMPUS.halls' rise order).
 *  `fill` 0..1 over the whole sweep; 1 = all eight lit. Draw it after GigawattCampus. */
export const HallsAlight: React.FC<{ fill: number; fog?: number }> = ({ fill, fog = 1 }) => {
  const o = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: FILL_VERT,
      fragmentShader: FILL_FRAG,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: { ...fogUniforms(), uFill: { value: [0, 0, 0, 0, 0, 0, 0, 0] }, uAmber: { value: v3(COLOR.amberTop) }, uHot: { value: v3(COLOR.amberHot) }, uL: { value: new THREE.Vector3(0, 1, 0) } },
    });
    const mesh = new THREE.Mesh(fillGeo(), mat);
    mesh.frustumCulled = false;
    // after the halls (0), before the gold (1)
    mesh.renderOrder = 0.5;
    return { mesh, mat };
  }, []);
  const u = o.mat.uniforms;
  // eight staggered fills: hall i starts at 0.09 i of the sweep and takes 0.37 of it
  u.uFill.value = Array.from({ length: 8 }, (_, i) => c01((fill - 0.09 * i) / 0.37));
  u.uCFog.value.set(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max * fog, 0);
  o.mesh.visible = fill > 0.001;
  return <primitive object={o.mesh} />;
};

// ===================================================================================================================
// TYPE (SCREEN svg layers for AirStage's `overlay`, pinned to the world with airProject)
// ===================================================================================================================
/** a text that casts one soft shadow down-right (the key light is above-left): cream alone washes out in the haze */
const Cast: React.FC<{ x: number; y: number; px: number; font: string; text: string; color: string; track: number; weight?: number; shadow?: number }> = ({
  x,
  y,
  px,
  font,
  text,
  color,
  track,
  weight,
  shadow = 0.78,
}) => {
  const t = (fill: string) => (
    <text x={f3(x)} y={f3(y)} fontFamily={font} fontWeight={weight} fontSize={f3(px)} letterSpacing={`${track}em`} textAnchor="middle" fill={fill} style={{ fontFeatureSettings: '"lnum" 1' }}>
      {text}
    </text>
  );
  return (
    <g>
      {shadow > 0 ? (
        <g transform={`translate(${f3(px * 0.022)} ${f3(px * 0.038)})`} style={{ filter: `blur(${f3(px * 0.05)}px)` }} opacity={f3(shadow)}>
          {t(COLOR.shadow)}
        </g>
      ) : null}
      {t(color)}
    </g>
  );
};

/** CostReadout — "$70B" over the column's top and its unit under it. `px` = the numeral's size at scale 1 (world
 *  space: it scales with the column's own projected scale relative to `refScale`). enter 0..1 = the stout entrance. */
export const CostReadout: React.FC<{ cam: AirCam; billions: number; rise?: number; text: string; sub?: string; enter: number; subEnter?: number; px?: number; refScale: number; at?: [number, number] }> = ({
  cam,
  billions,
  rise = 1,
  text,
  sub,
  enter,
  subEnter,
  px = 184,
  refScale,
  at = COST.at,
}) => {
  // it stands on the stack's top as it comes up (the rise is landed by the time the type is readable)
  // the far top edge of the stack: the type stands just above it
  const P = airProject(cam, costTopFar(billions * c01(rise), at));
  const k = P.s / refScale;
  const num = px * k;
  const subPx = 54 * k;
  const gap = 30 * k;
  const ent = (e: number) => {
    const a = easeOut3(e);
    return { a, lift: (1 - a) * 24, blur: 6 * (1 - a) };
  };
  const E = ent(enter);
  const ES = ent(subEnter ?? enter);
  const subBase = P.y - gap;
  const numBase = sub ? subBase - subPx * 0.72 - 24 * k : P.y - gap;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {E.a > 0.002 ? (
        <g opacity={f3(E.a)} style={{ filter: E.blur > 0.05 ? `blur(${f3(E.blur)}px)` : undefined }}>
          <Cast x={P.x} y={numBase + E.lift} px={num} font={FONT_NUM} weight={700} text={text} color={COLOR.inkCream} track={TRACK.numeral} />
        </g>
      ) : null}
      {sub && ES.a > 0.002 ? (
        <g opacity={f3(ES.a)} style={{ filter: ES.blur > 0.05 ? `blur(${f3(ES.blur)}px)` : undefined }}>
          <Cast x={P.x} y={subBase + ES.lift} px={subPx} font={FONT_LABEL} text={sub} color={COLOR.inkCream} track={TRACK.label} shadow={0.7} />
        </g>
      ) : null}
    </svg>
  );
};

/** YearMarks — the numerals 1..5 standing over the year tiles (ink, Söhne Dreiviertelfett), "YEARS" after the 5;
 *  each numeral enters (the stout entrance) as its tile lights: `years` 0..5 as CostApron. */
export const YearMarks: React.FC<{ cam: AirCam; years: number; px?: number; refScale: number; label?: number }> = ({ cam, years, px = 64, refScale, label }) => {
  const out: React.ReactNode[] = [];
  const P0 = airProject(cam, yearAt(2));
  const k = P0.s / refScale;
  for (let i = 0; i < 5; i++) {
    const c = yearAt(i);
    // on the tile's far edge, standing up
    const P = airProject(cam, [c[0], 0, c[2] + COST.years.d / 2 + 4]);
    const e = easeOut3((years - i) * 1.6);
    if (e <= 0.002) continue;
    out.push(
      <g key={i} opacity={f3(e)} style={{ filter: e < 1 ? `blur(${f3(6 * (1 - e))}px)` : undefined }}>
        <text x={f3(P.x)} y={f3(P.y - 14 * k + (1 - e) * 24)} fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(px * k)} textAnchor="middle" fill={COLOR.inkDark} style={{ fontFeatureSettings: '"lnum" 1' }}>
          {i + 1}
        </text>
      </g>,
    );
  }
  const le = easeOut3(label ?? (years - 0.2) * 1.4);
  if (le > 0.002) {
    // under the middle tile, on the concrete between the rule and the apron's near edge (cap top 16 px below)
    const c = yearAt(2);
    const P = airProject(cam, [c[0], 0, c[2] - COST.years.d / 2 - 3]);
    const lp = px * 0.6 * k;
    out.push(
      <g key="y" opacity={f3(le)} style={{ filter: le < 1 ? `blur(${f3(6 * (1 - le))}px)` : undefined }}>
        <text x={f3(P.x)} y={f3(P.y + 16 * k + lp * 0.72 + (1 - le) * 24)} fontFamily={FONT_LABEL} fontSize={f3(lp)} letterSpacing="0.06em" textAnchor="middle" fill={COLOR.inkDark}>
          YEARS
        </text>
      </g>,
    );
  }
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {out}
    </svg>
  );
};
