// ---------------------------------------------------------------------------
// rodentSteppe3D: the steppe things of RodentFromCentralAsia (kyle-pandemics, cut 1) as REAL 3D VOLUMES in the cut's
// one camera (rodentCamera.ts), drawn with three.js on a transparent canvas over the WebGL ground (rodentGround.tsx):
// the grey marmot (Marmota baibacina, the Tian Shan plague reservoir), its burrow of loose earth with the mouth, the
// pebbles and clods, the grass tufts, and the orange seep lying ON the earth's surface. As the camera arcs round and
// cranes up, silhouettes, shading and foreshortening change like real lit objects; the marmot casts a real shadow.
//
// THE ENGRAVED MANNER in 3D (one light from the upper left, fixed in the world): every surface is stepped into a lit
//   tone, a mid tone and a shade tone (N.L with the shadow map), the mid and shade tones carry hatching fixed to the
//   object (fur hatch along the body's meridians, broken into strokes; soil lines along the earth's contours), a dark
//   outline from back faces (an inverted hull, ~2 px), atmospheric haze toward the page by distance / D (hazeAt).
//   Fur: grizzled cream-umber, a pale belly, flecks fixed in the body's own space (they never swim).
// THE MARMOT: body (a lathed pear), haunches, feet, forearms and paws held at the chest, a short dark-tipped tail; the
//   head: a broad flat skull, a pale muzzle, a dark nose, two cream incisors, small bead eyes set high, small low ears.
//   Its life (headAt): sniffs, turns its head to the camera (f22-36), blinks (f47), nods, turns away west (f56-70);
//   the body sways and breathes, the tail flicks.
// THE BURROW: a mesh of the earth's height (rodentPlace moundY: an irregular heap + the apron of thrown-out soil), the
//   mouth a real pit; the rim fades into the ground (no hard edge). THE SEEP (rodentPlace RIVULETS / WELL): orange
//   wells up in the pit (f82-86) and runs as one broad wet tongue down the fall line, parting into lobes near the
//   bottom; it is a mask in the earth's own shader, so it lies exactly on the surface; the ground shader's pools take
//   over where the lobes reach the ground.
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";
// three ships no type declarations in this repo (no @types/three, nothing may be installed): imported untyped, its
// objects typed loosely. ts-ignore, not ts-expect-error: whether tsc reports the missing types here depends on other files
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as THREE from "three";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type O = any;
import { AWAY, F, H, HAZE, HOLE, MARMOT, MOUND, RIGHT, RIVULETS, W, WELL, moundY, steppeAt, toScreen, type Cam } from "./rodentCamera";
import { FALL_ANG, SPOIL, earthRadius } from "./rodentPlace";

THREE.ColorManagement.enabled = false;

const hex = (h: string) => new THREE.Color(h);
const DARK = "#17120D";
const LAND = "#3F3428";
const FUR = { lit: "#CDB98E", mid: "#987E55", shade: "#5A4830", pale: "#E8DCBC", tip: "#2F251A" };
const EARTH = { lit: "#8A7350", mid: "#64533A", shade: "#2E251B" };
const ACCENT = "#FFB000";
const ACCENT_DEEP = "#D98A0C";

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const win = (f: number, a: number, b: number) => ease((f - a) / (b - a));

/** the head's life: turn (0 = to the west, 1 = to the camera), nod (rad), sniff 0..1, blink 1 open .. 0.1 shut */
export const headAt = (f: number) => {
  const turn = win(f, 22, 36) * (1 - win(f, 56, 70));
  const sniff = Math.max(win(f, 3, 7) * (1 - win(f, 17, 21)), win(f, 73, 77) * (1 - win(f, 86, 90)));
  const nod = (-2.6 * sniff * Math.sin(f * 1.9) + 5 * Math.sin(Math.PI * win(f, 44, 52)) - 4 * win(f, 66, 76)) * (Math.PI / 180);
  const blink = 1 - 0.9 * Math.max(0, Math.sin(Math.max(0, Math.min(1, (f - 47) / 5)) * Math.PI));
  return { turn, sniff, nod, blink };
};

/** the world light: from the upper left of the f0 view, a little toward the camera (unit, pointing TO the light) */
const L3 = new THREE.Vector3(-0.55 * RIGHT[0] - 0.35 * AWAY[0], 0.78, -0.55 * RIGHT[1] - 0.35 * AWAY[1]).normalize();
const R3 = new THREE.Vector3(RIGHT[0], 0, RIGHT[1]);
const A3 = new THREE.Vector3(AWAY[0], 0, AWAY[1]);

// ---------------------------------------------------------------------------
// SHADERS
// ---------------------------------------------------------------------------
const COMMON_UNIFORMS = () => ({
  uLight: { value: L3.clone() },
  uCamPos: { value: new THREE.Vector3() },
  uD: { value: 100 },
  uHaze: { value: new THREE.Vector3(HAZE.a, HAZE.b, HAZE.max) },
  uLand: { value: hex(LAND) },
  uOpacity: { value: 1 },
});
const VERT_HEAD = /* glsl */ `
attribute vec3 aLN;
varying vec3 vLw;
#include <common>
#include <shadowmap_pars_vertex>
varying vec3 vObj;
varying vec3 vObjN;
varying vec3 vNw;
varying vec3 vWorld;
varying vec2 vUv;
`;
const VERT_BODY = /* glsl */ `
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <project_vertex>
  vec4 worldPosition = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  worldPosition = instanceMatrix * worldPosition;
  #endif
  worldPosition = modelMatrix * worldPosition;
  #include <shadowmap_vertex>
  vObj = position;
  vObjN = normal;
  vUv = uv;
  vNw = inverseTransformDirection(transformedNormal, viewMatrix);
  vec3 ln = length(aLN) > 0.5 ? aLN : objectNormal;
  vLw = normalize((modelMatrix * vec4(ln, 0.0)).xyz);
  vWorld = worldPosition.xyz;
`;
const FRAG_HEAD = /* glsl */ `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform vec3 uLight;
uniform vec3 uCamPos;
uniform float uD;
uniform vec3 uHaze;
uniform vec3 uLand;
uniform float uOpacity;
varying vec3 vObj;
varying vec3 vObjN;
varying vec3 vNw;
varying vec3 vWorld;
varying vec2 vUv;
varying vec3 vLw;
float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float h31(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float hazeOf(vec3 w) { return uHaze.z * sstep(uHaze.x, uHaze.y, distance(w, uCamPos) / uD); }
/** 0 lit, 1 mid, 2 shade: stepped N.L with the cast shadow */
float tone(vec3 n) {
  float nl = dot(normalize(n), uLight);
  float sh = getShadowMask();
  float e = nl * mix(0.15, 1.0, sh);
  return e > 0.6 ? 0.0 : (e > 0.12 ? 1.0 : 2.0);
}
/** the fur's light: ONE smooth terminator per form (the lit side, a narrow mid band at the terminator, the shade
 *  side), the cast shadow only where it is clearly in shadow (no speckled islands) */
float toneFur(vec3 n) {
  float nl = dot(normalize(n), uLight);
  // the cast shadow only well inside the lit side (at grazing light it would only add stair-steps)
  float sh = step(0.5, getShadowMask());
  float e = nl > 0.3 ? mix(-0.1, nl, sh) : nl;
  return e > 0.16 ? 0.0 : (e > 0.02 ? 1.0 : 2.0);
}
float lineAA(float q, float period, float width) {
  float fw = fwidth(q);
  float d = abs(fract(q / period + 0.5) - 0.5) * period;
  float vis = sstep(1.6, 3.5, period / max(fw, 1e-6));
  return (1.0 - sstep(width * 0.5 - fw * 0.7, width * 0.5 + fw * 0.7, d)) * vis;
}
`;

/** the fur: stepped tones, regions (the pale chest and belly, the darker back; the head's darker crown and muzzle
 *  tip, the black nose; the tail's dark tip), a dense hatch that follows the form (lines along the surface's own
 *  length, broken into short strokes) and grizzle flecks; all on the surface's own uv, so nothing swims */
type FurOpts = { region?: number; hatchN?: number; len?: number; flecks?: number };
const furMaterial = (pal: { lit: string; mid: string; shade: string; pale?: string }, opts: FurOpts = {}) =>
  new THREE.ShaderMaterial({
    lights: true,
    transparent: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      {
        ...COMMON_UNIFORMS(),
        uLit: { value: hex(pal.lit) },
        uMid: { value: hex(pal.mid) },
        uShade: { value: hex(pal.shade) },
        uPale: { value: hex(pal.pale ?? pal.lit) },
        uRegion: { value: opts.region ?? 0 },
        uHatchN: { value: opts.hatchN ?? 60 },
        uLen: { value: opts.len ?? 20 },
        uFlecks: { value: opts.flecks ?? 1 },
      },
    ]),
    vertexShader: `${VERT_HEAD}\nvoid main() {\n${VERT_BODY}\n}`,
    fragmentShader: `${FRAG_HEAD}
uniform vec3 uLit, uMid, uShade, uPale;
uniform float uRegion, uHatchN, uLen, uFlecks;
void main() {
  float t = toneFur(vLw);
  float u = vUv.x;
  float v = vUv.y;
  // regions
  float front = 1.0 - sstep(0.05, 0.15, abs(fract(u - 0.25 + 0.5) - 0.5));
  float back = 1.0 - sstep(0.12, 0.3, abs(fract(u - 0.75 + 0.5) - 0.5));
  float pale = 0.0;
  float dark = 0.0;
  float black = 0.0;
  if (uRegion > 0.5 && uRegion < 1.5) {
    pale = front * sstep(0.12, 0.22, v) * (1.0 - sstep(0.7, 0.82, v)) * 0.85;
    dark = back * 0.6;
  } else if (uRegion > 1.5 && uRegion < 2.5) {
    float du = abs(fract(u - 0.25 + 0.5) - 0.5);
    float dd = abs(fract(u - 0.75 + 0.5) - 0.5);
    float side = 1.0 - sstep(0.06, 0.14, min(abs(fract(u + 0.5) - 0.5), abs(fract(u - 0.5 + 0.5) - 0.5)));
    // the crown and the back of the neck a little darker; the cheeks and the chin pale
    dark = (1.0 - sstep(0.12, 0.22, du)) * (1.0 - sstep(0.62, 0.74, v)) * 0.45;
    pale = max((1.0 - sstep(0.14, 0.26, dd)) * sstep(0.42, 0.56, v), side * sstep(0.6, 0.72, v) * (1.0 - sstep(0.93, 0.97, v)) * 0.85);
    // the nose: a small dark triangle at the top of the muzzle's front, its point down
    float nz = clamp((0.988 - v) / 0.036, 0.0, 1.0);
    black = sstep(0.95, 0.958, v) * (1.0 - sstep(0.075 * nz + 0.005, 0.075 * nz + 0.02, du));
  } else if (uRegion > 2.5) {
    dark = sstep(0.55, 0.75, v);
  }
  vec3 lit = mix(uLit, uPale, pale);
  vec3 mid = mix(uMid, uLit, pale * 0.8);
  vec3 shd = mix(uShade, uMid, pale * 0.6);
  vec3 col = t < 0.5 ? lit : (t < 1.5 ? mid : shd);
  col = mix(col, col * 0.62, dark);
  col = mix(col, vec3(0.09, 0.07, 0.05), black);
  // the fur hatch: dense lines along the surface's length, broken into short strokes
  float q = u * uHatchN;
  float seg = floor(v * uLen / 0.9 + h31(vec3(floor(q), 3.0, 1.0)) * 5.0);
  float stroke = step(0.42, h31(vec3(floor(q), seg, 7.0)));
  float hatch = lineAA(q, 1.0, 0.36) * stroke;
  col = mix(col, vec3(${hexToVec(DARK)}), hatch * (t < 0.5 ? 0.06 : (t < 1.5 ? 0.28 : 0.6)) * (1.0 - black));
  // grizzle: flecks on the surface's own grid
  vec2 g = vec2(q * 0.5, v * uLen * 0.7);
  vec2 cell = floor(g);
  float fh = h31(vec3(cell, 9.0));
  vec2 cc = cell + 0.5 + (vec2(h31(vec3(cell, 1.7)), h31(vec3(cell, 3.1))) - 0.5) * 0.5;
  float fw = max(length(fwidth(g)), 1e-5);
  float dot1 = 1.0 - sstep(0.15 - fw, 0.15 + fw, length(g - cc));
  float fv = sstep(1.2, 3.0, 1.0 / fw);
  col = mix(col, vec3(${hexToVec(DARK)}), uFlecks * fv * dot1 * step(0.86, fh) * 0.4 * (1.0 - pale) * (1.0 - black));
  col = mix(col, uPale, uFlecks * fv * dot1 * (1.0 - step(0.12, fh)) * 0.45 * (1.0 - black));
  col = mix(col, uLand, hazeOf(vWorld));
  gl_FragColor = vec4(col, uOpacity);
}`,
  });
function hexToVec(h: string) {
  const c = new THREE.Color(h);
  return `${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)}`;
}
/** a flat-colour part (eyes, nose, teeth): still stepped, no hatch */
const flatMaterial = (lit: string, shade: string) => furMaterial({ lit, mid: lit, shade }, { hatchN: 0.0001, flecks: 0, len: 0.0001 });

/** the inverted hull: back faces pushed out along the normal by ~uPx screen px */
const outlineMaterial = () =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    uniforms: { uPx: { value: 2.2 }, uF: { value: F }, uCol: { value: hex(DARK) }, uOpacity: { value: 1 } },
    vertexShader: `
uniform float uPx;
uniform float uF;
float h21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  // fur on the outline: the edge thickens in little tufts (fixed on the surface's own uv)
  vec2 g = uv * vec2(90.0, 28.0);
  float tuft = h21(floor(g)) * (1.0 - abs(fract(g.x) - 0.5) * 2.0);
  mv.xyz += n * uPx * (1.0 + 1.6 * tuft) * (-mv.z) / uF;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `uniform vec3 uCol; uniform float uOpacity; void main() { gl_FragColor = vec4(uCol, uOpacity); }`,
  });

// ---------------------------------------------------------------------------
// THE MARMOT (local units = world px; +y up, +z its front; feet at the origin)
// ---------------------------------------------------------------------------
type Part = { mesh: O; hull: O };
type V3 = [number, number, number];
const vn = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const h = (a: number, b: number) => hash(a * 7.13 + b * 157.1, 3.7);
  return h(xi, yi) * (1 - sx) * (1 - sy) + h(xi + 1, yi) * sx * (1 - sy) + h(xi, yi + 1) * (1 - sx) * sy + h(xi + 1, yi + 1) * sx * sy;
};
/** a swept surface: rings along v (0..1), u (0..1) around; fn(v, theta) -> the point. uv = (u, v); the seam's normals
 *  are shared so no crease shows; the fur's broken silhouette is a small noise on the radius (done inside fn) */
const sweep = (rings: number, around: number, fn: (v: number, th: number) => V3) => {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= rings; i++)
    for (let j = 0; j <= around; j++) {
      const v = i / rings;
      const u = j / around;
      const p = fn(v, (j % around) * ((Math.PI * 2) / around));
      pos.push(p[0], p[1], p[2]);
      uv.push(u, v);
    }
  const row = around + 1;
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < around; j++) {
      const a = i * row + j;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  // the winding must face out (the sweeps turn either way round their axis): test a middle ring
  const mid = Math.floor(rings / 2) * row;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let j = 0; j < around; j++) {
    cx += pos[(mid + j) * 3] / around;
    cy += pos[(mid + j) * 3 + 1] / around;
    cz += pos[(mid + j) * 3 + 2] / around;
  }
  const t0 = new THREE.Vector3(pos[mid * 3], pos[mid * 3 + 1], pos[mid * 3 + 2]);
  const t1 = new THREE.Vector3(pos[(mid + 1) * 3], pos[(mid + 1) * 3 + 1], pos[(mid + 1) * 3 + 2]);
  const t2 = new THREE.Vector3(pos[(mid + row) * 3], pos[(mid + row) * 3 + 1], pos[(mid + row) * 3 + 2]);
  const fn0 = new THREE.Vector3().crossVectors(t2.clone().sub(t0), t1.clone().sub(t0));
  if (fn0.dot(t0.clone().sub(new THREE.Vector3(cx, cy, cz))) < 0) for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
  g.setIndex(idx);
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i <= rings; i++) {
    const a = i * row;
    const b = a + around;
    const x = (n.getX(a) + n.getX(b)) / 2;
    const y = (n.getY(a) + n.getY(b)) / 2;
    const z = (n.getZ(a) + n.getZ(b)) / 2;
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
  // the end rings collapse to points: give them the axis direction
  return g;
};
/** piecewise-linear then smoothed table lookup: keys [[v, value]...] */
const tab = (keys: [number, number][]) => (v: number) => {
  if (v <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (v <= keys[i][0]) {
      const t = (v - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      const e = t * t * (3 - 2 * t);
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * e;
    }
  return keys[keys.length - 1][1];
};
/** fur on the outline: the radius breathes a little with a noise, so the silhouette is broken into tufts */
const furR = (r: number, th: number, v: number, seed: number, amt = 0.035) => r * (1 + 0 * amt * (vn(th * 4.2 + seed, v * 26 + seed * 3) - 0.5));

// THE BODY (marmot units = world px; +y up, +z its front; feet at y 0): plump hips and belly, sloping shoulders,
// a thick neck. Sections are ellipses, deeper at the belly than at the back, the haunches bulging at the sides low.
const BODY_Y = (v: number) => (v < 0.94 ? 0.4 + (31.6 * v) / 0.94 : 32 + ((v - 0.94) / 0.06) * 2.5);
const BODY_A = tab([
  [0, 0.4],
  [0.03, 9.0],
  [0.12, 12.2],
  [0.2, 12.4],
  [0.3, 11.0],
  [0.42, 11.4],
  [0.55, 10.2],
  [0.66, 8.9],
  [0.76, 7.5],
  [0.86, 6.1],
  [0.95, 5.7],
  [1, 2.0],
]);
const BODY_F = tab([
  [0, 0.4],
  [0.03, 8.0],
  [0.15, 10.4],
  [0.3, 11.2],
  [0.42, 12.4],
  [0.54, 11.2],
  [0.66, 9.9],
  [0.76, 8.2],
  [0.86, 6.7],
  [0.95, 6.1],
  [1, 2.0],
]);
const BODY_B = tab([
  [0, 0.4],
  [0.03, 8.4],
  [0.15, 10.4],
  [0.35, 9.4],
  [0.55, 8.6],
  [0.72, 7.6],
  [0.86, 6.3],
  [0.95, 5.8],
  [1, 2.0],
]);
const BODY_Z = tab([
  [0, -0.6],
  [0.4, -0.2],
  [0.8, 0.6],
  [1, 1.0],
]);
/** a table smoothed over a window of v (the form's broad light: one lit side, one shade side) */
const smoothT = (f: (v: number) => number, w = 0.14) => (v: number) => {
  let s = 0;
  for (let k = -5; k <= 5; k++) s += f(Math.max(0, Math.min(1, v + (k / 5) * w)));
  return s / 11;
};
const SA = smoothT(BODY_A);
const SF = smoothT(BODY_F);
const SB = smoothT(BODY_B);
/** set a geometry's lighting normals (aLN) from a smoothed twin built on the same grid */
const withLightNormals = (g: O, twin: O) => {
  g.setAttribute("aLN", twin.attributes.normal.clone());
  return g;
};
const bodyGeo = () =>
  withLightNormals(bodyGeoRaw(), sweep(72, 88, (v, th) => {
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const wF = Math.max(0, Math.min(1, (sn + 0.45) / 0.9));
    const b = SB(v) + (SF(v) - SB(v)) * wF * wF * (3 - 2 * wF);
    return [SA(v) * c, BODY_Y(v), BODY_Z(v) + b * sn];
  }));
const bodyGeoRaw = () =>
  sweep(72, 88, (v, th) => {
    const c = Math.cos(th);
    const sn = Math.sin(th);
    let a = BODY_A(v);
    // the haunches: bulges at the sides, low
    a += 2.2 * Math.exp(-(((v - 0.15) / 0.08) ** 2)) * Math.pow(Math.abs(c), 3);
    // front and back depths blended smoothly round the sides (a hard switch would crease the surface there)
    const wF = Math.max(0, Math.min(1, (sn + 0.45) / 0.9));
    const b = BODY_B(v) + (BODY_F(v) - BODY_B(v)) * wF * wF * (3 - 2 * wF);
    const r = furR(1, th, v, 1.3);
    return [a * c * r, BODY_Y(v), BODY_Z(v) + b * sn * r];
  });
// THE HEAD (head units; origin at the neck pivot; +z its nose): a broad flat skull flowing into a broad short muzzle.
// Sections round the z axis: x half-width, y up / down half-heights, centre height.
const HEAD_Z = (v: number) => -5.6 + 15 * v;
const HEAD_X = tab([
  [0, 0.3],
  [0.06, 4.6],
  [0.2, 6.6],
  [0.36, 7.1],
  [0.52, 6.6],
  [0.64, 5.3],
  [0.74, 4.3],
  [0.86, 3.7],
  [0.94, 3.1],
  [0.985, 2.1],
  [1, 0.5],
]);
const HEAD_UP = tab([
  [0, 0.3],
  [0.06, 3.6],
  [0.25, 4.6],
  [0.45, 4.4],
  [0.62, 3.4],
  [0.78, 2.6],
  [0.9, 2.3],
  [0.97, 1.7],
  [1, 0.5],
]);
const HEAD_DN = tab([
  [0, 0.3],
  [0.06, 4.2],
  [0.3, 5.6],
  [0.5, 4.9],
  [0.68, 3.6],
  [0.82, 2.9],
  [0.93, 2.4],
  [0.985, 1.6],
  [1, 0.5],
]);
const HEAD_C = tab([
  [0, 3.4],
  [0.4, 3.2],
  [0.7, 2.2],
  [1, 1.4],
]);
/** a point on the head's surface at v (0 back .. 1 nose) and angle th (0 = +x, pi/2 = up) */
const headPt = (v: number, th: number, r = 1): V3 => {
  // the muzzle's sections go squarer toward the nose (a blunt, boxy muzzle)
  const sq = 1 - 0.3 * Math.max(0, Math.min(1, (v - 0.6) / 0.3));
  const cs = Math.cos(th);
  const sn0 = Math.sin(th);
  const sn = Math.sign(sn0) * Math.pow(Math.abs(sn0), sq);
  const csq = Math.sign(cs) * Math.pow(Math.abs(cs), sq);
  const wU = Math.max(0, Math.min(1, (sn0 + 0.45) / 0.9));
  const hy = HEAD_DN(v) + (HEAD_UP(v) - HEAD_DN(v)) * wU * wU * (3 - 2 * wU);
  return [HEAD_X(v) * csq * r, HEAD_C(v) + hy * sn * r, HEAD_Z(v)];
};
const headGeo = () => withLightNormals(sweep(60, 80, (v, th) => headPt(v, th, 1)), sweep(60, 80, (v, th) => headPtSmooth(v, th)));
/** the head's broad form for its light: the same sections, its tables smoothed */
const HXs = smoothT(HEAD_X, 0.18);
const HUs = smoothT(HEAD_UP, 0.18);
const HDs = smoothT(HEAD_DN, 0.18);
const headPtSmooth = (v: number, th: number): V3 => {
  const sn = Math.sin(th);
  const wU = Math.max(0, Math.min(1, (sn + 0.45) / 0.9));
  const hy = HDs(v) + (HUs(v) - HDs(v)) * wU * wU * (3 - 2 * wU);
  return [HXs(v) * Math.cos(th), HEAD_C(v) + hy * sn, HEAD_Z(v)];
};
/** a limb: a tube from a to b, radius ra -> rb, rounded ends */
const limbGeo = (a: V3, b: V3, ra: number, rb: number) => {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const ax = B.clone().sub(A);
  const L = ax.length();
  ax.normalize();
  const ref = Math.abs(ax.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const e1 = new THREE.Vector3().crossVectors(ax, ref).normalize();
  const e2 = new THREE.Vector3().crossVectors(ax, e1).normalize();
  return sweep(22, 20, (v, th) => {
    // rounded ends: a half-dome of the limb's own radius at each end
    const along = -ra + v * (L + ra + rb);
    let r = ra + ((rb - ra) * Math.max(0, Math.min(L, along))) / L;
    if (along < 0) r = ra * Math.sqrt(Math.max(0.0004, 1 - (along / ra) ** 2));
    if (along > L) r = rb * Math.sqrt(Math.max(0.0004, 1 - ((along - L) / rb) ** 2));
    r *= furR(1, th, v, a[0], 0.04);
    const p = A.clone().addScaledVector(ax, along).addScaledVector(e1, Math.cos(th) * r).addScaledVector(e2, Math.sin(th) * r);
    return [p.x, p.y, p.z];
  });
};
/** an arm grown out of the body: a bent tube (shoulder inside the body -> elbow -> wrist), thick at the shoulder,
 *  tapering to the wrist, a rounded wrist end; its start is buried in the body so arm and shoulder read as one form */
const armGeo = (sh: V3, el: V3, wr: V3, r0: number, r1: number) => {
  const P0 = new THREE.Vector3(...sh);
  const P1 = new THREE.Vector3(...el);
  const P2 = new THREE.Vector3(...wr);
  const at = (t: number) => P0.clone().multiplyScalar((1 - t) * (1 - t)).addScaledVector(P1, 2 * (1 - t) * t).addScaledVector(P2, t * t);
  const tan = (t: number) => P1.clone().sub(P0).multiplyScalar(2 * (1 - t)).addScaledVector(P2.clone().sub(P1), 2 * t).normalize();
  const ref = new THREE.Vector3(0, 0, 1);
  return sweep(26, 20, (v, th) => {
    const t = Math.min(1, v * 1.08);
    const T = tan(t);
    const e1 = new THREE.Vector3().crossVectors(T, ref).normalize();
    const e2 = new THREE.Vector3().crossVectors(T, e1).normalize();
    let r = r0 + (r1 - r0) * Math.pow(t, 0.8);
    let c = at(t);
    if (v * 1.08 > 1) {
      // the rounded wrist end
      const over = (v * 1.08 - 1) / 0.08;
      c = c.addScaledVector(T, over * r1);
      r = r1 * Math.sqrt(Math.max(0.0004, 1 - over * over));
    }
    const p = c.addScaledVector(e1, Math.cos(th) * r).addScaledVector(e2, Math.sin(th) * r);
    return [p.x, p.y, p.z];
  });
};
type Rig = {
  root: O;
  sway: O;
  head: O;
  muzzle: O;
  eyes: O[];
  tail: O;
  parts: Part[];
  materials: O[];
  hulls: O[];
};
const buildMarmot = (): Rig => {
  const materials: O[] = [];
  const hulls: O[] = [];
  const parts: Part[] = [];
  const add = (parent: O, geo: O, mat: O, pos: V3 = [0, 0, 0], scale: V3 = [1, 1, 1], rot: V3 = [0, 0, 0], outline = true) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    materials.push(mat);
    let hull = mesh;
    if (outline) {
      const hm = outlineMaterial();
      hulls.push(hm);
      hull = new THREE.Mesh(geo, hm);
      hull.position.copy(mesh.position);
      hull.scale.copy(mesh.scale);
      hull.rotation.copy(mesh.rotation);
      parent.add(hull);
    }
    parts.push({ mesh, hull });
    return mesh;
  };
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const root = new THREE.Group();
  const sway = new THREE.Group();
  root.add(sway);
  // one continuous body from the hips to the neck
  add(sway, bodyGeo(), furMaterial(FUR, { region: 1, hatchN: 120, len: 33 }));
  // the hind feet, short and bent, poking forward under the belly
  for (const s of [-1, 1]) add(sway, limbGeo([s * 5.4, 1.2, 4.0], [s * 4.6, 0.9, 9.6], 2.1, 1.7), furMaterial({ lit: FUR.lit, mid: FUR.mid, shade: FUR.shade }, { hatchN: 30, len: 6 }));
  // the forearms: short, from the shoulders down onto the belly; small paws with dark claws held at the chest
  for (const s of [-1, 1]) {
    add(sway, armGeo([s * 4.4, 25.6, 2.6], [s * 7.3, 21.0, 6.4], [s * 3.7, 19.3, 10.7], 2.9, 1.45), furMaterial(FUR, { hatchN: 44, len: 9 }));
    // the paw, small and curled down over the belly, three dark claws
    add(sway, sphere, furMaterial({ lit: FUR.lit, mid: FUR.mid, shade: FUR.shade }, { hatchN: 16, len: 3, flecks: 0 }), [s * 3.35, 18.65, 11.15], [1.25, 0.85, 1.1], [0.7, 0, 0]);
    for (let k = 0; k < 3; k++) add(sway, sphere, flatMaterial("#2A2016", "#120D09"), [s * 3.35 + (k - 1) * 0.55, 17.95, 11.55], [0.2, 0.42, 0.2], [0.7, 0, 0], false);
  }
  // the tail: short, behind, low, dark-tipped
  const tail = new THREE.Group();
  tail.position.set(0, 3.0, -7.6);
  sway.add(tail);
  add(tail, limbGeo([0, 0, 0], [0, -1.6, -6.4], 2.0, 1.4), furMaterial(FUR, { region: 3, hatchN: 26, len: 7 }));
  // the head: pivot at the top of the neck
  const head = new THREE.Group();
  head.position.set(0, 30.6, 1.6);
  sway.add(head);
  const HS: V3 = [1.12, 1.08, 1.06];
  const hs = (p: V3): V3 => [p[0] * HS[0], p[1] * HS[1], p[2] * HS[2]];
  add(head, headGeo(), furMaterial(FUR, { region: 2, hatchN: 96, len: 16 }), [0, 0, 0], HS);
  const muzzle = new THREE.Group();
  head.add(muzzle);
  // the incisors: small, barely showing under the muzzle
  for (const s of [-1, 1]) add(muzzle, new THREE.BoxGeometry(0.36, 0.55, 0.3), flatMaterial(FUR.pale, FUR.lit), hs([s * 0.19, HEAD_C(0.9) - HEAD_DN(0.9) + 0.15, HEAD_Z(0.9)]), [0.85, 0.85, 0.85], [0, 0, 0], false);
  // the eyes: small dark beads set high on the head's sides
  const eyes: O[] = [];
  for (const s of [-1, 1]) {
    const p = hs(headPt(0.56, s > 0 ? 0.78 : Math.PI - 0.78, 1.0));
    eyes.push(add(head, sphere, flatMaterial("#14100B", "#0A0806"), [p[0], p[1], p[2]], [0.55, 0.55, 0.55], [0, 0, 0], false));
  }
  // the ears: small, rounded, low at the back of the head
  for (const s of [-1, 1]) {
    const p = hs(headPt(0.27, s > 0 ? 0.95 : Math.PI - 0.95, 1.0));
    add(head, sphere, furMaterial({ lit: FUR.mid, mid: FUR.shade, shade: FUR.tip }, { hatchN: 10, len: 2, flecks: 0 }), [p[0], p[1] - 0.2, p[2] - 0.2], [1.25, 1.05, 0.62], [0.35, s * 0.6, 0]);
  }
  return { root, sway, head, muzzle, eyes, tail, parts, materials, hulls };
};

// ---------------------------------------------------------------------------
// THE BURROW: the earth's height as a mesh, the mouth a pit, the rim fading into the ground; the seep as a mask
// ---------------------------------------------------------------------------
const PIT_DEPTH = 4.2;
const buildEarth = () => {
  const NS = 180;
  const NR = 64;
  const pos: number[] = [];
  const edge: number[] = [];
  const pit: number[] = [];
  const idx: number[] = [];
  const vtx = (x: number, z: number, e: number) => {
    const dh = Math.hypot(x - HOLE.at[0], z - HOLE.at[1]) / HOLE.r;
    const p = dh < 1 ? 1 - dh * dh : 0;
    pos.push(x, moundY(x, z) - PIT_DEPTH * p, z);
    edge.push(e);
    pit.push(Math.max(0, Math.min(1, (1 - dh) / 0.3)));
  };
  vtx(MOUND.c[0], MOUND.c[1], 1);
  for (let j = 0; j < NS; j++) {
    const th = (j / NS) * Math.PI * 2;
    const R = earthRadius(th) * 1.06;
    const ux = R3.x * Math.cos(th) + A3.x * Math.sin(th);
    const uz = R3.z * Math.cos(th) + A3.z * Math.sin(th);
    for (let i = 1; i <= NR; i++) {
      const f = i / NR;
      const r = R * Math.pow(f, 0.85);
      vtx(MOUND.c[0] + ux * r, MOUND.c[1] + uz * r, 1 - Math.max(0, Math.min(1, (f - 0.86) / 0.14)));
    }
  }
  const at = (j: number, i: number) => 1 + (j % NS) * NR + (i - 1);
  for (let j = 0; j < NS; j++) {
    idx.push(0, at(j, 1), at(j + 1, 1));
    for (let i = 1; i < NR; i++) {
      idx.push(at(j, i), at(j + 1, i + 1), at(j + 1, i));
      idx.push(at(j, i), at(j, i + 1), at(j + 1, i + 1));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aEdge", new THREE.Float32BufferAttribute(edge, 1));
  g.setAttribute("aPit", new THREE.Float32BufferAttribute(pit, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.ShaderMaterial({
    lights: true,
    transparent: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      {
        ...COMMON_UNIFORMS(),
        uLit: { value: hex(EARTH.lit) },
        uMid: { value: hex(EARTH.mid) },
        uShade: { value: hex(EARTH.shade) },
        uHatchDir: { value: new THREE.Vector2(0.5, 0.86) },
        // the seep
        uWell: { value: 0 },
        uLip: { value: new THREE.Vector2() },
        uFall: { value: new THREE.Vector2() },
        uLen: { value: 0 },
        uL: { value: 1 },
        uHoleR: { value: HOLE.r },
        uLobeA: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
        uLobeW: { value: new THREE.Vector3() },
      },
    ]),
    vertexShader: `${VERT_HEAD}
attribute float aEdge;
attribute float aPit;
varying float vEdge;
varying float vPit;
void main() {
${VERT_BODY}
  vEdge = aEdge;
  vPit = aPit;
}`,
    fragmentShader: `${FRAG_HEAD}
uniform vec3 uLit, uMid, uShade;
uniform vec2 uHatchDir;
uniform float uWell, uLen, uL, uHoleR;
uniform vec2 uLip, uFall;
uniform vec4 uLobeA[3];
uniform vec3 uLobeW;
varying float vEdge;
varying float vPit;
float capsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r * (1.0 - 0.25 * h);
}
void main() {
  float t = tone(vNw);
  vec3 col = t < 0.5 ? uLit : (t < 1.5 ? uMid : uShade);
  vec2 p = vWorld.xz;
  // the house hatch, fixed on the earth, in the shade; soil lines along the contours, broken
  float hq = dot(p, uHatchDir);
  col = mix(col, vec3(${hexToVec(DARK)}), lineAA(hq, 0.85, 0.22) * (t > 1.5 ? 0.5 : (t > 0.5 ? 0.18 : 0.0)));
  // loose soil: crumbs and clods stippled over the heap (fixed on it), darker in the shade
  vec2 sg = p * 1.6;
  vec2 sc = floor(sg);
  float sh = h31(vec3(sc, 2.0));
  vec2 sp = sc + 0.5 + (vec2(h31(vec3(sc, 4.0)), h31(vec3(sc, 6.0))) - 0.5) * 0.6;
  float sw = max(length(fwidth(sg)), 1e-5);
  float crumb = (1.0 - sstep(0.16 - sw, 0.16 + sw, length(sg - sp))) * sstep(1.2, 3.0, 1.0 / sw);
  col = mix(col, vec3(${hexToVec(DARK)}), crumb * step(0.55, sh) * 0.45 * sstep(0.2, 0.8, vWorld.y));
  col = mix(col, vec3(${hexToVec(EARTH.lit)}) * 1.15, crumb * (1.0 - step(0.15, sh)) * 0.6 * sstep(0.2, 0.8, vWorld.y));
  // the mouth: a dark pit
  col = mix(col, vec3(0.055, 0.043, 0.031), sstep(0.0, 0.5, vPit));
  // THE SEEP: the well in the pit, the broad tongue down the fall line, its lobes near the bottom
  vec2 n = vec2(-uFall.y, uFall.x);
  vec2 q = p - uLip;
  float along = dot(q, uFall);
  float across = dot(q, n);
  float tt = along / uL;
  float w = uHoleR * (1.25 + 1.1 * tt) * (1.0 + 0.08 * sin(tt * 11.0 + 1.3));
  float wob = across > 0.0 ? 0.5 * sin(tt * 17.0 + 0.4) + 0.3 * sin(tt * 31.0 + 1.1) : 0.5 * sin(tt * 13.0 + 2.2) + 0.3 * sin(tt * 27.0 + 0.3);
  float dT = max(abs(across) - (w * 0.5 + wob), max(-along, along - uLen));
  float dS = dT;
  for (int k = 0; k < 3; k++) {
    if (uLobeA[k].w > 0.0) dS = min(dS, capsule(p, uLobeA[k].xy, uLobeA[k].zw, uLobeW[k] * 0.5));
  }
  float aa = max(fwidth(dS), 1e-4);
  float seep = (1.0 - sstep(-aa, aa, dS)) * step(0.001, uLen);
  float well = uWell * sstep(0.2, 0.6, vPit);
  vec3 wet = mix(vec3(${hexToVec(ACCENT_DEEP)}), vec3(${hexToVec(ACCENT)}), 0.35 * (t < 0.5 ? 1.0 : 0.0));
  wet = mix(wet, vec3(0.6, 0.37, 0.04), 0.6 * (1.0 - sstep(-3.0 * aa, -aa, dS)) * seep);
  col = mix(col, mix(vec3(0.66, 0.41, 0.04), vec3(${hexToVec(ACCENT_DEEP)}), uWell), well);
  col = mix(col, wet, seep);
  col = mix(col, uLand, hazeOf(vWorld));
  gl_FragColor = vec4(col, uOpacity * vEdge);
}`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  return { mesh, mat };
};

/** clods and pebbles on the apron and round the foot: small lit volumes */
const buildBits = () => {
  type Bit = { x: number; z: number; r: number; pebble: boolean; seed: number };
  const bits: Bit[] = [];
  for (let i = 0; i < 80; i++) {
    const onApron = i < 50;
    let x: number;
    let z: number;
    if (onApron) {
      const a = (hash(i, 7) - 0.5) * 1.9;
      const d = SPOIL.r * (0.3 + 0.95 * Math.sqrt(hash(i, 8)));
      const dx = Math.cos(FALL_ANG + a);
      const dz = Math.sin(FALL_ANG + a);
      x = SPOIL.c[0] + (R3.x * dx + A3.x * dz) * d;
      z = SPOIL.c[1] + (R3.z * dx + A3.z * dz) * d;
    } else {
      const th = hash(i, 9) * Math.PI * 2;
      const r = earthRadius(th) * (0.92 + 0.2 * hash(i, 10));
      x = MOUND.c[0] + (R3.x * Math.cos(th) + A3.x * Math.sin(th)) * r;
      z = MOUND.c[1] + (R3.z * Math.cos(th) + A3.z * Math.sin(th)) * r;
    }
    if (Math.hypot(x - HOLE.at[0], z - HOLE.at[1]) < HOLE.r * 1.7) continue;
    // keep the seep's path clear
    const fx = R3.x * Math.cos(FALL_ANG) + A3.x * Math.sin(FALL_ANG);
    const fz = R3.z * Math.cos(FALL_ANG) + A3.z * Math.sin(FALL_ANG);
    const qx = x - HOLE.at[0];
    const qz = z - HOLE.at[1];
    const along = qx * fx + qz * fz;
    const across = Math.abs(-qx * fz + qz * fx);
    if (along > 0 && along < 22 && across < 6) continue;
    bits.push({ x, z, r: 0.45 + 0.9 * hash(i, 11), pebble: hash(i, 12) < 0.4, seed: i });
  }
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const out: O[] = [];
  const mats: O[] = [];
  for (const pebble of [true, false]) {
    const list = bits.filter((b) => b.pebble === pebble);
    const mat = pebble ? furMaterial({ lit: "#B8A27A", mid: "#8B7652", shade: "#4F4230" }, { hatchN: 0.0001, flecks: 0 }) : furMaterial({ lit: "#6E5B3E", mid: "#4A3D2B", shade: "#2A2219" }, { hatchN: 0.0001, flecks: 0 });
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const m = new THREE.Matrix4();
    list.forEach((b, k) => {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(hash(b.seed, 20) * 6, hash(b.seed, 21) * 6, hash(b.seed, 22) * 6));
      const s = new THREE.Vector3(b.r * (1 + 0.3 * hash(b.seed, 23)), b.r * (0.55 + 0.2 * hash(b.seed, 24)), b.r);
      m.compose(new THREE.Vector3(b.x, moundY(b.x, b.z) + s.y * 0.4, b.z), q, s);
      im.setMatrixAt(k, m);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    out.push(im);
    mats.push(mat);
  }
  return { meshes: out, mats };
};

// ---------------------------------------------------------------------------
// GRASS TUFTS: blades as thin curved strips standing on the ground, swaying, lit on their facing side
// ---------------------------------------------------------------------------
type Tuft = { x: number; z: number; h: number; seed: number };
export const TUFTS: Tuft[] = (() => {
  const out: Tuft[] = [];
  const G = 9;
  const Rr = 300;
  let n = 0;
  for (let i = -Rr; i <= Rr; i += G)
    for (let j = -Rr; j <= Rr; j += G) {
      n++;
      if (hash(n, 1) > 0.16) continue;
      const x = MOUND.c[0] + i + (hash(n, 2) - 0.5) * G * 0.9;
      const z = MOUND.c[1] + j + (hash(n, 3) - 0.5) * G * 0.9;
      const r = Math.hypot(x - MOUND.c[0], z - MOUND.c[1]);
      if (r > Rr || r < MOUND.R * 1.35) continue;
      out.push({ x, z, h: 4.2 + 3.4 * hash(n, 4), seed: n });
    }
  return out;
})();
const buildTufts = () => {
  const pos: number[] = [];
  const hf: number[] = [];
  const ph: number[] = [];
  const side: number[] = [];
  const idx: number[] = [];
  let v = 0;
  for (const t of TUFTS) {
    const nb = 5 + Math.floor(hash(t.seed, 5) * 3);
    const rot = hash(t.seed, 6) * Math.PI * 2;
    for (let b = 0; b < nb; b++) {
      const ang = rot + (b / nb) * Math.PI * 2 + (hash(t.seed, 30 + b) - 0.5) * 0.8;
      const lean = 0.35 + 0.5 * hash(t.seed, 10 + b);
      const hh = t.h * (0.55 + 0.45 * hash(t.seed, 20 + b));
      const dx = Math.cos(ang);
      const dz = Math.sin(ang);
      // the blade's flat faces the way it leans; a strip of 5 rows, narrowing to the tip
      const nx = -dz;
      const nz = dx;
      const S = 5;
      for (let k = 0; k <= S; k++) {
        const u = k / S;
        const w = 0.32 * (1 - u * 0.9);
        const off = lean * hh * 0.55 * u * u;
        const cx = t.x + dx * (off + 0.35);
        const cz = t.z + dz * (off + 0.35);
        const y = hh * u * (1 - 0.15 * u);
        for (const sgn of [-1, 1]) {
          pos.push(cx + nx * w * sgn, y, cz + nz * w * sgn);
          hf.push(u);
          ph.push(t.seed * 0.7 + t.x * 0.004);
          side.push(hash(t.seed, 40 + b));
        }
      }
      for (let k = 0; k < S; k++) {
        const a = v + k * 2;
        idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
      v += (S + 1) * 2;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aH", new THREE.Float32BufferAttribute(hf, 1));
  g.setAttribute("aPh", new THREE.Float32BufferAttribute(ph, 1));
  g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: { ...COMMON_UNIFORMS(), uTime: { value: 0 }, uWind: { value: new THREE.Vector2(R3.x, R3.z) }, uLitC: { value: hex("#B9A980") }, uShadeC: { value: hex("#5C4D36") } },
    vertexShader: `
attribute float aH;
attribute float aPh;
attribute float aSide;
uniform float uTime;
uniform vec2 uWind;
varying vec3 vWorld;
varying float vH;
varying float vSide;
void main() {
  vec3 p = position;
  float sway = (0.09 * sin(uTime / 13.0 + aPh) + 0.05 * sin(uTime / 5.3 + aPh * 1.7)) * aH * aH * 6.0;
  p.xz += uWind * sway;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  vH = aH;
  vSide = aSide;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: `
uniform vec3 uCamPos, uHaze, uLand, uLitC, uShadeC;
uniform float uD, uOpacity;
varying vec3 vWorld;
varying float vH;
varying float vSide;
float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
void main() {
  // one face of each blade toward the light, the other away; darker at the root
  float lit = (gl_FrontFacing ? 1.0 : 0.0) * step(0.35, vSide) + (gl_FrontFacing ? 0.0 : 1.0) * (1.0 - step(0.35, vSide));
  vec3 col = mix(uShadeC, uLitC, lit * sstep(0.1, 0.6, vH));
  col = mix(vec3(0.09, 0.07, 0.05), col, sstep(0.0, 0.25, vH));
  float hz = uHaze.z * sstep(uHaze.x, uHaze.y, distance(vWorld, uCamPos) / uD);
  col = mix(col, uLand, hz);
  gl_FragColor = vec4(col, uOpacity);
}`,
  });
  return { mesh: new THREE.Mesh(g, mat), mat };
};

// ---------------------------------------------------------------------------
// THE SCENE
// ---------------------------------------------------------------------------
type Scene3 = {
  renderer: O;
  scene: O;
  camera: O;
  light: O;
  rig: Rig;
  earth: ReturnType<typeof buildEarth>;
  bits: ReturnType<typeof buildBits>;
  tufts: ReturnType<typeof buildTufts>;
  catcher: O;
  bodyFwd: O;
  bodySide: O;
};
const init = (canvas: HTMLCanvasElement, scale: number): Scene3 => {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
  renderer.setPixelRatio(1);
  renderer.setSize(Math.round(W * scale), Math.round(H * scale), false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera((2 * Math.atan(H / 2 / F) * 180) / Math.PI, W / H, 0.5, 50000);
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  const sc = light.shadow.camera as O;
  sc.left = -55;
  sc.right = 55;
  sc.top = 55;
  sc.bottom = -55;
  sc.near = 1;
  sc.far = 400;
  light.shadow.bias = -0.0006;
  light.shadow.normalBias = 0.25;
  light.position.set(MOUND.c[0] + L3.x * 200, L3.y * 200, MOUND.c[1] + L3.z * 200);
  light.target.position.set(MOUND.c[0], 0, MOUND.c[1]);
  scene.add(light);
  scene.add(light.target);
  // the shadow on the open ground round the burrow
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.ShadowMaterial({ color: hex(DARK), opacity: 0.5, transparent: true }));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.set(MOUND.c[0], 0.02, MOUND.c[1]);
  catcher.receiveShadow = true;
  scene.add(catcher);
  const earth = buildEarth();
  scene.add(earth.mesh);
  const bits = buildBits();
  bits.meshes.forEach((m) => scene.add(m));
  const tufts = buildTufts();
  scene.add(tufts.mesh);
  // the marmot on its seat, facing toward the f0 camera and the west
  const rig = buildMarmot();
  const fwd = A3.clone().multiplyScalar(-0.75).add(R3.clone().multiplyScalar(-0.66)).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
  rig.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, fwd));
  rig.root.position.set(MARMOT.at[0], moundY(MARMOT.at[0], MARMOT.at[1]) - 0.5, MARMOT.at[1]);
  scene.add(rig.root);
  return { renderer, scene, camera, light, rig, earth, bits, tufts, catcher, bodyFwd: fwd, bodySide: side };
};

const lerpAng = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
};

/** the marmot's on-screen height (px) and the 3D layer's fade (the marmot becomes the mark) */
export const marmotPx = (cam: Cam) => {
  const feet = toScreen(cam, MARMOT.at[0], moundY(MARMOT.at[0], MARMOT.at[1]), MARMOT.at[1]);
  return MARMOT.h * feet.s;
};
export const markAt = (cam: Cam) => Math.max(0, Math.min(1, (24 - marmotPx(cam)) / 12));
/** the tufts go before the ground's streaks do: once they are a few px they read as specks */
export const tuftAlpha = (cam: Cam) => {
  const tu = Math.max(0, Math.min(1, (cam.D - 175) / (330 - 175)));
  return steppeAt(cam.D) * (1 - tu * tu * (3 - 2 * tu));
};

const draw = (S: Scene3, cam: Cam, frame: number) => {
  const { renderer, scene, camera, rig, earth, bits, tufts } = S;
  const mark = markAt(cam);
  const tA = tuftAlpha(cam);
  if (mark >= 1 && tA <= 0.001) {
    renderer.clear();
    return;
  }
  // the camera: the cut's own pinhole
  const C = new THREE.Vector3(cam.C[0], cam.C[1], cam.C[2]);
  camera.position.copy(C);
  camera.up.set(cam.u[0], cam.u[1], cam.u[2]);
  camera.near = Math.max(0.3, cam.D * 0.02);
  camera.far = cam.D * 60;
  camera.lookAt(C.x + cam.f[0], C.y + cam.f[1], C.z + cam.f[2]);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  // shared uniforms
  const op = 1 - mark;
  const setCommon = (m: O, opacity: number) => {
    m.uniforms.uCamPos.value.copy(C);
    m.uniforms.uD.value = cam.D;
    m.uniforms.uOpacity.value = opacity;
  };
  rig.materials.forEach((m) => setCommon(m, op));
  setCommon(earth.mat, op);
  bits.mats.forEach((m) => setCommon(m, op));
  setCommon(tufts.mat, tA);
  tufts.mat.uniforms.uTime.value = frame;
  // outlines ~2.2 px, thinner as the marmot shrinks
  const px = marmotPx(cam);
  rig.hulls.forEach((h) => {
    h.uniforms.uPx.value = Math.min(2.2, 0.03 * px);
    h.uniforms.uOpacity.value = op;
  });
  rig.root.visible = op > 0.002;
  earth.mesh.visible = op > 0.002;
  bits.meshes.forEach((m) => (m.visible = op > 0.002));
  S.catcher.visible = op > 0.002;
  tufts.mesh.visible = tA > 0.002;
  // the marmot's life
  const hd = headAt(frame);
  const lean = ((1.2 * Math.sin(frame / 21) + 0.5 * Math.sin(frame / 9.3)) * Math.PI) / 180;
  rig.sway.rotation.set(0, 0, lean);
  rig.sway.scale.set(1, 1 + 0.012 * Math.sin(frame / 6.5), 1);
  const flick = (f0: number) => Math.max(0, Math.sin(Math.max(0, Math.min(1, (frame - f0) / 10)) * Math.PI));
  rig.tail.rotation.set(0, (9 * flick(14) + 7 * flick(62)) * (Math.PI / 180) * 1.6, 0);
  // the head: 0 = toward the west, 1 = toward the camera (both as yaw in the body's own frame)
  const yawOf = (v: O) => Math.atan2(v.dot(S.bodySide), v.dot(S.bodyFwd));
  const west = R3.clone().multiplyScalar(-1);
  const head = new THREE.Vector3();
  rig.head.getWorldPosition(head);
  const toCam = C.clone().sub(head).setY(0).normalize();
  const clampY = (a: number) => Math.max(-1.35, Math.min(1.35, a));
  const yaw = lerpAng(clampY(yawOf(west)), clampY(yawOf(toCam)), hd.turn);
  rig.head.rotation.set(-hd.nod, yaw, 0, "YXZ");
  rig.muzzle.position.set(0, 0.25 * hd.sniff * Math.sin(frame * 2.3), 0.2 * hd.sniff * Math.sin(frame * 2.3 + 1));
  rig.eyes.forEach((e: O) => e.scale.set(0.55, 0.55 * hd.blink, 0.55));
  // the seep
  const u = earth.mat.uniforms;
  const well = ease((frame - WELL[0]) / (WELL[1] - WELL[0]));
  u.uWell.value = well;
  const fx = R3.x * Math.cos(FALL_ANG) + A3.x * Math.sin(FALL_ANG);
  const fz = R3.z * Math.cos(FALL_ANG) + A3.z * Math.sin(FALL_ANG);
  const lip: [number, number] = [HOLE.at[0] + fx * HOLE.r * 0.55, HOLE.at[1] + fz * HOLE.r * 0.55];
  const Lf = Math.hypot(RIVULETS[1].end[0] - lip[0], RIVULETS[1].end[1] - lip[1]);
  const t0 = Math.min(...RIVULETS.map((r) => r.start));
  const g = ease((frame - t0) / (RIVULETS[1].arrive - t0));
  u.uLip.value.set(lip[0], lip[1]);
  u.uFall.value.set(fx, fz);
  u.uL.value = Lf;
  u.uLen.value = Lf * g * 0.9;
  RIVULETS.forEach((rv, k) => {
    const gl = ease((frame - (rv.start + (rv.arrive - rv.start) * 0.6)) / ((rv.arrive - rv.start) * 0.4));
    const from: [number, number] = [lip[0] + fx * Lf * 0.72, lip[1] + fz * Lf * 0.72];
    const tip: [number, number] = [from[0] + (rv.end[0] - from[0]) * gl, from[1] + (rv.end[1] - from[1]) * gl];
    u.uLobeA.value[k].set(from[0], from[1], tip[0], tip[1]);
    if (gl <= 0) u.uLobeA.value[k].w = 0;
    (u.uLobeW.value as O).setComponent(k, rv.w * 1.05);
  });
  renderer.render(scene, camera);
  renderer.getContext().finish();
};

let SHARED: Scene3 | null = null;
/** the 3D steppe layer (full frame, transparent, over the ground and the label, under the mark and the figures) */
export const Steppe3D: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender("rodentSteppe3D: building the 3D steppe", { timeoutInMilliseconds: 120000 }));
  const done = useRef(false);
  const [ready, setReady] = useState(false);
  const scale = typeof window === "undefined" ? 1 : Math.min(1, window.devicePixelRatio || 1);
  useEffect(() => {
    try {
      if (!SHARED && ref.current) SHARED = init(ref.current, scale);
      setReady(true);
    } catch (e) {
      cancelRender(e as Error);
    }
  }, [scale]);
  useLayoutEffect(() => {
    if (!ready || !SHARED) return;
    draw(SHARED, cam, frame);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [ready, cam, frame, handle]);
  return <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};
