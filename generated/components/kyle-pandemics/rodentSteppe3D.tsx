// ---------------------------------------------------------------------------
// rodentSteppe3D: the steppe things of RodentFromCentralAsia (kyle-pandemics, cut 1) as REAL 3D VOLUMES in the cut's
// one camera (rodentCamera.ts), drawn with three.js on a transparent canvas over the WebGL ground (rodentGround.tsx):
// the marmot (V3: a tarbagan, Marmota sibirica, marmot3D.ts), its burrow of loose earth with the mouth, the
// pebbles and clods, the grass tufts, and the orange seep lying ON the earth's surface. As the camera arcs round and
// cranes up, silhouettes, shading and foreshortening change like real lit objects; the marmot casts a real shadow.
//
// THE BURROW, PEBBLES, TUFTS keep the V2 engraved manner in 3D (one light from the upper left, fixed in the world:
//   stepped lit / mid / shade tones with the shadow map, hatching fixed to the object, haze toward the page by
//   distance / D (hazeAt)); their re-lighting for the medium comes with the AirStage integration (AIR_READY.md).
// THE MARMOT (V3, marmot3D.ts): one sculpted skinned mesh with fur shells, soft form light, a cream rim, the shadow
//   side sinking into the air (`air`, creatureAir.ts: A by default) and fogged by distance plus `fog`. Its life (headAt,
//   unchanged): sniffs, turns its head to the camera (f22-36), blinks (f47), nods, turns away west (f56-70); the body
//   sways and breathes, the tail flicks; now on its skeleton (body, neck, head, muzzle, tail).
// <Steppe3D cam frame air? fog? probe? />: `probe` hides the burrow, the bits and the tufts (the look sheets).
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
import { buildMarmot3D, BONE_AT, FUR_LEN, type MarmotRig } from "./marmot3D";
import { AIR_A, type Air } from "./creatureAir";

THREE.ColorManagement.enabled = false;

const hex = (h: string) => new THREE.Color(h);
const DARK = "#17120D";
const LAND = "#3F3428";
const EARTH = { lit: "#8E7A58", mid: "#7E6A4E", shade: "#4A3D2C" };
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
  uRimC: { value: hex("#F3EBDD") },
  uShadowC: { value: hex("#22180F") },
  // V3 take 2: a clip plane (n, c): fragments with dot(n, world) + c < 0 are dropped (the far / near split round the
  // 2D marmot); (0, 0, 0, 1) keeps everything
  uClip: { value: new THREE.Vector4(0, 0, 0, 1) },
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
uniform vec4 uClip;
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
uniform vec3 uRimC;
uniform vec3 uShadowC;
/** smooth value noise (2D), 0..1 */
float gnoise(vec2 x) {
  vec2 i = floor(x);
  vec2 f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = h31(vec3(i, 0.0));
  float b = h31(vec3(i + vec2(1.0, 0.0), 0.0));
  float c = h31(vec3(i + vec2(0.0, 1.0), 0.0));
  float d = h31(vec3(i + vec2(1.0, 1.0), 0.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
/** V3: soft form light (AIR_READY): wrapped N.L with the cast shadow, 0 shade .. 1 lit, a smooth terminator */
float softK(vec3 n) {
  float nl = dot(normalize(n), uLight);
  float sh = getShadowMask();
  return sstep(0.08, 0.85, clamp((nl + 0.28) / 1.28, 0.0, 1.0) * mix(0.4, 1.0, sh));
}
vec3 tri(vec3 lit, vec3 mid, vec3 shd, float k) {
  vec3 s = mix(shd, uShadowC, 0.3);
  return k < 0.5 ? mix(s, mid, k * 2.0) : mix(mid, lit, (k - 0.5) * 2.0);
}
/** a cream rim on the edges turned up toward the light */
vec3 rimmed(vec3 col, vec3 n, float amt) {
  vec3 N = normalize(n);
  vec3 V = normalize(uCamPos - vWorld);
  float fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
  float up = clamp(dot(N, normalize(uLight + vec3(0.0, 0.8, 0.0))), 0.0, 1.0);
  return mix(col, uRimC, fr * sstep(0.15, 0.75, up) * amt);
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
  if (dot(uClip.xyz, vWorld) + uClip.w < 0.0) discard;
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
  float kk = softK(vLw);
  vec3 col = mix(mix(shd, mid, 0.55), lit, sstep(0.3, 0.52, kk));
  col = mix(col, col * 0.62, dark);
  col = mix(col, vec3(0.09, 0.07, 0.05), black);
  // the fur hatch: dense lines along the surface's length, broken into short strokes
  float q = u * uHatchN;
  float seg = floor(v * uLen / 0.9 + h31(vec3(floor(q), 3.0, 1.0)) * 5.0);
  float stroke = step(0.42, h31(vec3(floor(q), seg, 7.0)));
  float hatch = lineAA(q, 1.0, 0.36) * stroke;
  col = mix(col, vec3(${hexToVec(DARK)}), hatch * (1.0 - kk) * 0.3 * (1.0 - black) * step(1.0, uHatchN));
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
  col = rimmed(col, vNw, 0.0);
  col = mix(col, uLand, hazeOf(vWorld));
  gl_FragColor = vec4(col, uOpacity);
}`,
  });
function hexToVec(h: string) {
  const c = new THREE.Color(h);
  return `${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)}`;
}
// V3: the marmot is marmot3D.ts (a sculpted, skinned mesh with fur shells).
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
  if (dot(uClip.xyz, vWorld) + uClip.w < 0.0) discard;
  float kk = softK(vNw);
  // V3 take 2 (the picture-book hand): one flat earth colour and ONE soft shadow shape on the side turned from the
  // light, a gouache grain and a blotchy dry-brush wash fixed on the earth (no hatching, no stippled crumbs)
  vec3 col = mix(mix(uShade, uMid, 0.55), uMid * 1.06, sstep(0.3, 0.52, kk));
  vec2 p = vWorld.xz;
  col *= 1.0 + (gnoise(p * 0.9) - 0.5) * 0.16 + (gnoise(p * 9.0 + 3.1) - 0.5) * 0.1 * sstep(1.5, 4.0, 1.0 / max(length(fwidth(p * 9.0)), 1e-4));
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
  vec3 wet = mix(vec3(${hexToVec(ACCENT_DEEP)}), vec3(${hexToVec(ACCENT)}), 0.35 * sstep(0.55, 0.8, kk));
  wet = mix(wet, vec3(0.6, 0.37, 0.04), 0.6 * (1.0 - sstep(-3.0 * aa, -aa, dS)) * seep);
  col = mix(col, mix(vec3(0.66, 0.41, 0.04), vec3(${hexToVec(ACCENT_DEEP)}), uWell), well);
  col = mix(col, wet, seep);
  col = rimmed(col, vNw, 0.0);
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
uniform vec4 uClip;
varying vec3 vWorld;
varying float vH;
varying float vSide;
float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
void main() {
  if (dot(uClip.xyz, vWorld) + uClip.w < 0.0) discard;
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
  rig: MarmotRig | null;
  earth: ReturnType<typeof buildEarth>;
  bits: ReturnType<typeof buildBits>;
  tufts: ReturnType<typeof buildTufts>;
  catcher: O;
  bodyFwd: O;
  bodySide: O;
};
const init = (canvas: HTMLCanvasElement, scale: number, marmot3d: boolean): Scene3 => {
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
  // (V3 take 2: the cut draws the picture-book marmot in 2D over this layer; the 3D one is built only on request)
  const fwd = A3.clone().multiplyScalar(-0.75).add(R3.clone().multiplyScalar(-0.66)).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(up, fwd).normalize();
  const rig = marmot3d ? buildMarmot3D({ light: L3, haze: [HAZE.a, HAZE.b, HAZE.max], F }) : null;
  if (rig) {
    rig.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, fwd));
    rig.root.position.set(MARMOT.at[0], moundY(MARMOT.at[0], MARMOT.at[1]) - 0.5, MARMOT.at[1]);
    scene.add(rig.root);
  }
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

/** the V3 (take 1) 3D marmot's life on its skeleton (only when the scene was built with it) */
const drawMarmot3D = (S: Scene3, rig: MarmotRig, cam: Cam, frame: number, C: O, op: number, ppu: number, px: number, probe: boolean) => {
  rig.shells.forEach((m) => (m.uniforms.uFurVis.value = Math.max(0, Math.min(1, (ppu - 2.2) / 3.5))));
  rig.outline.uniforms.uPx.value = Math.min(1.6, 0.025 * px) + Math.min(FUR_LEN * 0.35 * ppu, 4);
  rig.outline.uniforms.uOpacity.value = op;
  rig.root.visible = op > 0.002;
  // the probe has no burrow: the shadow falls on a plane at the marmot's feet
  S.catcher.position.y = probe ? rig.root.position.y + 0.05 : 0.02;
  // the marmot's life (the V2 rig's motion, now on the skeleton)
  const hd = headAt(frame);
  const B = rig.bones;
  const lean = ((1.2 * Math.sin(frame / 21) + 0.5 * Math.sin(frame / 9.3)) * Math.PI) / 180;
  B.body.rotation.set(0, 0, lean);
  B.body.scale.set(1, 1 + 0.012 * Math.sin(frame / 6.5), 1);
  const flick = (f0: number) => Math.max(0, Math.sin(Math.max(0, Math.min(1, (frame - f0) / 10)) * Math.PI));
  B.tail.rotation.set(0, (9 * flick(14) + 7 * flick(62)) * (Math.PI / 180) * 1.6, 0);
  // the head: 0 = toward the west, 1 = toward the camera (both as yaw in the body's own frame); the turn and the nod
  // are shared by the neck and the head bones, so the neck twists smoothly
  const yawOf = (v: O) => Math.atan2(v.dot(S.bodySide), v.dot(S.bodyFwd));
  const west = R3.clone().multiplyScalar(-1);
  B.neck.rotation.set(0, 0, 0);
  B.head.rotation.set(0, 0, 0);
  rig.root.updateMatrixWorld(true);
  const head = new THREE.Vector3();
  B.head.getWorldPosition(head);
  const toCam = C.clone().sub(head).setY(0).normalize();
  const clampY = (a: number) => Math.max(-1.35, Math.min(1.35, a));
  const yaw = lerpAng(clampY(yawOf(west)), clampY(yawOf(toCam)), hd.turn);
  B.neck.rotation.set(-hd.nod * 0.4, yaw * 0.45, 0, "YXZ");
  B.head.rotation.set(-hd.nod * 0.6, yaw * 0.55, 0, "YXZ");
  const mr = [BONE_AT.muzzle[0] - BONE_AT.head[0], BONE_AT.muzzle[1] - BONE_AT.head[1], BONE_AT.muzzle[2] - BONE_AT.head[2]];
  B.muzzle.position.set(mr[0], mr[1] + 0.25 * hd.sniff * Math.sin(frame * 2.3), mr[2] + 0.2 * hd.sniff * Math.sin(frame * 2.3 + 1));
  rig.eyes.forEach((e: O) => e.scale.set(0.47, 0.42 * hd.blink, 0.47));
  rig.whiskers.opacity = 0.6 * op * Math.max(0, Math.min(1, (ppu - 3) / 4));
  void cam;
};

/** the split round the 2D marmot: a vertical plane through `at` facing the camera; "far" keeps what is beyond it,
 *  "near" what is in front */
export type StepPart = "all" | "far" | "near";
const clipFor = (cam: Cam, part: StepPart, at: [number, number, number]) => {
  if (part === "all") return [0, 0, 0, 1];
  const fx = cam.f[0];
  const fz = cam.f[2];
  const l = Math.hypot(fx, fz) || 1;
  const n = [fx / l, 0, fz / l];
  const c = -(n[0] * at[0] + n[2] * at[2]);
  return part === "far" ? [n[0], 0, n[2], c] : [-n[0], 0, -n[2], -c];
};
const draw = (S: Scene3, cam: Cam, frame: number, air: Air = AIR_A, fog = 0, probe = false, part: StepPart = "all", splitAt: [number, number, number] = [0, 0, 0]) => {
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
  rig?.materials.forEach((m) => {
    setCommon(m, op);
    m.uniforms.uAirBody.value.set(air.body);
    m.uniforms.uAirShade.value.set(air.shade);
    m.uniforms.uAirLight.value.set(air.light);
    m.uniforms.uRim.value.set(air.id === "A" ? "#F3EBDD" : "#E9DDBF");
    m.uniforms.uFog.value = fog;
  });
  setCommon(earth.mat, op);
  bits.mats.forEach((m) => setCommon(m, op));
  setCommon(tufts.mat, tA);
  // V3: the burrow, the bits and the tufts haze into the medium (the air at the target's distance)
  [earth.mat, tufts.mat, ...bits.mats].forEach((m) => m.uniforms.uLand.value.set(air.body));
  const cv = clipFor(cam, part, splitAt);
  [earth.mat, tufts.mat, ...bits.mats].forEach((m) => m.uniforms.uClip.value.set(cv[0], cv[1], cv[2], cv[3]));
  S.catcher.material.opacity = part === "near" ? 0 : 0.5;
  tufts.mat.uniforms.uTime.value = frame;
  // the fur fades out as the marmot shrinks (strands under ~2 px would only sparkle); the outline thins with it
  const px = marmotPx(cam);
  const ppu = px / 40;
  earth.mesh.visible = op > 0.002 && !probe;
  bits.meshes.forEach((m) => (m.visible = op > 0.002 && !probe));
  S.catcher.visible = op > 0.002;
  tufts.mesh.visible = tA > 0.002 && !probe;
  if (rig) drawMarmot3D(S, rig, cam, frame, C, op, ppu, px, probe);

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

const SHARED: Record<StepPart, Scene3 | null> = { all: null, far: null, near: null };
/** the 3D steppe layer (full frame, transparent, over the ground and the label, under the mark and the figures) */
export const Steppe3D: React.FC<{ cam: Cam; frame: number; air?: Air; fog?: number; probe?: boolean; marmot3d?: boolean; part?: StepPart; splitAt?: [number, number, number] }> = ({
  cam,
  frame,
  air = AIR_A,
  fog = 0,
  probe = false,
  marmot3d = false,
  part = "all",
  splitAt = [0, 0, 0],
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender("rodentSteppe3D: building the 3D steppe", { timeoutInMilliseconds: 120000 }));
  const done = useRef(false);
  const [ready, setReady] = useState(false);
  const scale = typeof window === "undefined" ? 1 : Math.min(1, window.devicePixelRatio || 1);
  useEffect(() => {
    try {
      if (!SHARED[part] && ref.current) SHARED[part] = init(ref.current, scale, marmot3d);
      setReady(true);
    } catch (e) {
      cancelRender(e as Error);
    }
  }, [scale, marmot3d, part]);
  useLayoutEffect(() => {
    const S = SHARED[part];
    if (!ready || !S) return;
    draw(S, cam, frame, air, fog, probe, part, splitAt);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [ready, cam, frame, handle, air, fog, probe, part, splitAt]);
  return <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};
