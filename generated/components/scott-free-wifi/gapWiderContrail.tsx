// ---------------------------------------------------------------------------
// gapWiderContrail — cut 4 GapWiderEveryDay's own contrail (scott-free-wifi). A cut-local variant of wifiSky's
// <Contrail> (same geometry: two camera-facing ribbons, one per engine, drawn from the jet's path history, widening,
// merging and fraying with age, carried by the air), with two changes for a cut whose jets MOVE through still air:
//   1. the frayed puffs are keyed to the moment each bit of vapour left the engine (its emission frame), not to its
//      age fraction, so a puff stays put in the air while its jet flies away from it (wifiSky's puffs ride along
//      with the jet, which reads right only in the jet-fixed frame);
//   2. denser and whiter: a fuller profile, less fraying, a lighter belly and less distance fog, so the trails draw
//      the wedge against the sky.
// Must sit inside <CruiseStage world> (it reads the three.js camera through the shader's cameraPosition only).
// wifiSky.tsx itself is not touched.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { type JetType, type V3 } from "../scott-aircraft-order/aircraftShared";
import { SPECS } from "../scott-aircraft-order/aircraftModels";
import { CRUISE } from "./wifiSky";

const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));

/** world <- jet local (x forward, y up, z starboard), pitched about the main gear (wifiSky's jetLocal, restated) */
const jetLocal = (type: JetType, at: [number, number], heading: number, alt: number, pitch: number, local: V3): V3 => {
  const sp = SPECS[type];
  const px = sp.L / 2 - sp.gear.main[0].s * sp.L;
  const pr = pitch * D2R;
  const lx0 = local[0] - px;
  const lx = px + lx0 * Math.cos(pr) - local[1] * Math.sin(pr);
  const ly = lx0 * Math.sin(pr) + local[1] * Math.cos(pr);
  const h = heading * D2R;
  return [at[0] + Math.sin(h) * lx + Math.cos(h) * local[2], alt + ly, at[1] + Math.cos(h) * lx - Math.sin(h) * local[2]];
};

const NOISE = /* glsl */ `
float h21(vec2 p) {
  p = mod(p, 4096.0);
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm3(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vn(p); p = p * 2.07 + vec2(13.7, 5.1); a *= 0.5; }
  return s / 0.875;
}`;

const N = 120;
const VERT = /* glsl */ `
attribute vec3 aC;       // the trail's centre at this sample (three coords)
attribute vec3 aTan;     // its direction
attribute vec2 aQ;       // x: side -1..1, y: age 0..1
attribute float aW;      // half width (m)
attribute float aA;      // opacity
attribute float aE;      // the frame this vapour left the engine (fixed in the air)
uniform float uPush;     // m: pushed back along its view ray (same screen place, deeper), see the push prop
varying vec2 vQ;
varying float vA;
varying float vUp;
varying float vE;
varying vec3 vW;
void main() {
  vec3 V = normalize(cameraPosition - aC);
  vec3 side = normalize(cross(normalize(aTan), V));
  vec3 p = aC + side * aQ.x * aW;
  vQ = aQ;
  vA = aA;
  vE = aE;
  vUp = side.y * aQ.x;
  vW = p;
  vec4 v = viewMatrix * vec4(p, 1.0);
  float d = max(1.0, -v.z);
  v.xyz *= (d + uPush) / d;
  gl_Position = projectionMatrix * v;
}`;
const FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBelly;
uniform vec3 uFogCol;
uniform float uSeed;
uniform float uPuff;     // puffs per frame of emission
varying vec2 vQ;
varying float vA;
varying float vUp;
varying float vE;
varying vec3 vW;
${NOISE}
void main() {
  float s = abs(vQ.x);
  // a full, dense core; with age it frays into puffs that stay where they were emitted
  float prof = exp(-s * s * 2.2) * (1.0 - smoothstep(0.86, 1.0, s));
  float n = fbm3(vec2(vE * uPuff + uSeed, vQ.x * 1.4 + 3.0));
  float puff = mix(1.0, 0.5 + 0.85 * n, smoothstep(0.1, 0.7, vQ.y));
  float a = prof * puff * vA;
  vec3 col = mix(uBelly, uTop, smoothstep(-0.7, 0.5, vUp));
  float d = length(vW - cameraPosition);
  float fg = 0.6 * (1.0 - exp(-max(0.0, d - 200.0) / 5200.0));
  gl_FragColor = vec4(mix(col, uFogCol, fg), min(1.0, a));
}`;

export type GapWiderTrailPose = { at: [number, number]; alt?: number; heading?: number; pitch?: number };
export type GapWiderContrailProps = {
  type: JetType;
  /** where the jet was at frame t */
  path: (t: number) => GapWiderTrailPose;
  /** the story clock (frames) */
  S: number;
  /** the air's velocity (m / frame); this cut flies through still air */
  air?: V3;
  /** frames of trail */
  age?: number;
  /** half width at the engine and how much it grows by the trail's end (m) */
  width?: number;
  spread?: number;
  /** frames between the engine and the first visible vapour */
  lag?: number;
  opacity?: number;
  /** m: draw the trail this much deeper along each view ray (its screen place unchanged), so nearer jets it sweeps
   *  past occlude it: a climbing jet's trail passes BEHIND the jets of the row it leaves instead of over them */
  push?: number;
};
/** Two dense contrails behind a jet whose puffs stay put in the air. */
export const GapWiderContrail: React.FC<GapWiderContrailProps> = ({ type, path, S, air = [0, 0, 0], age = 150, width = 2.2, spread = 22, lag = 2.5, opacity = 1, push = 0 }) => {
  const o = useMemo(() => {
    const mk = (seed: number) => {
      const n = (N + 1) * 2;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aC", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aTan", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute("aQ", new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      g.setAttribute("aW", new THREE.BufferAttribute(new Float32Array(n), 1));
      g.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(n), 1));
      g.setAttribute("aE", new THREE.BufferAttribute(new Float32Array(n), 1));
      const idx: number[] = [];
      for (let i = 0; i < N; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
      const m = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTop: { value: v3("#FFF9EF") },
          uBelly: { value: v3("#E4D5BE") },
          uFogCol: { value: v3(SKY.glow) },
          uSeed: { value: seed },
          uPuff: { value: 0.24 },
          uPush: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(g, m);
      mesh.frustumCulled = false;
      mesh.renderOrder = 5;
      return { g, mesh };
    };
    return [mk(1.7), mk(23.1)];
  }, []);
  const sp = SPECS[type];
  const eng = sp.engines[0];
  const ws = sp.wing;
  // the engine's exhaust in jet-local coords (x forward, y up, z starboard)
  const exX = sp.L / 2 - ws.x0 * sp.L + eng.ahead - eng.len - 0.5;
  const exY = sp.belly + sp.H / 2 + ws.y0 - eng.drop;
  for (let e = 0; e < 2; e++) {
    const side = e === 0 ? -1 : 1;
    const g = o[e].g;
    o[e].mesh.material.uniforms.uPush.value = push;
    const C = g.attributes.aC.array as Float32Array;
    const Tn = g.attributes.aTan.array as Float32Array;
    const Q = g.attributes.aQ.array as Float32Array;
    const Wd = g.attributes.aW.array as Float32Array;
    const A = g.attributes.aA.array as Float32Array;
    const E = g.attributes.aE.array as Float32Array;
    const pts: V3[] = [];
    const ems: number[] = [];
    for (let i = 0; i <= N; i++) {
      const a = lag + (age - lag) * (i / N);
      const pose = path(S - a);
      const u = i / N;
      const zIn = eng.z * side * (1 - 0.55 * Math.pow(u, 0.7));
      const w = jetLocal(type, pose.at, pose.heading ?? -90, pose.alt ?? CRUISE, pose.pitch ?? 0, [exX, exY, zIn]);
      pts.push([w[0] + air[0] * a, w[1] + air[1] * a - 0.04 * a, w[2] + air[2] * a]);
      ems.push(S - a);
    }
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const p = pts[i];
      const q = pts[Math.min(N, i + 1)];
      const r = pts[Math.max(0, i - 1)];
      const hw = width + spread * Math.pow(u, 0.65);
      const al = opacity * smoothFade(u) * (1 - 0.3 * u);
      for (let k = 0; k < 2; k++) {
        const j = i * 2 + k;
        C[j * 3] = p[0];
        C[j * 3 + 1] = p[1];
        C[j * 3 + 2] = -p[2];
        Tn[j * 3] = q[0] - r[0];
        Tn[j * 3 + 1] = q[1] - r[1];
        Tn[j * 3 + 2] = -(q[2] - r[2]);
        Q[j * 2] = k === 0 ? -1 : 1;
        Q[j * 2 + 1] = u;
        Wd[j] = hw;
        A[j] = al;
        E[j] = ems[i];
      }
    }
    for (const k of ["aC", "aTan", "aQ", "aW", "aA", "aE"]) g.attributes[k].needsUpdate = true;
  }
  return (
    <>
      <primitive object={o[0].mesh} />
      <primitive object={o[1].mesh} />
    </>
  );
};
/** a trail's opacity along its age: forms over the first stretch, thins out to nothing at its end */
const smoothFade = (u: number) => {
  const a = c01(u / 0.05);
  const b = c01((1 - u) / 0.3);
  return a * a * (3 - 2 * a) * (b * b * (3 - 2 * b));
};
