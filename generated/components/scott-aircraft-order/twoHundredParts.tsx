// twoHundredParts — cut-local 3D pieces of TwoHundredWideBodies (scott-aircraft-order, cut 25), mounted in
// <AirStage world> next to the world's JetFields. Read-only use of the world; nothing here is shared.
//   <AsphaltApron rects>  dark warm asphalt aprons laid on the world's ground (a value-noise mottle, a faint lift toward
//                         the haze), drawn after the ground and before every jet, shadow and paint line.
//   <AmberCrowns type items>  one amber stripe per jet along the crown from mid-fuselage to the tail cone (instanced),
//                         so United's amber reads from straight above at the payoff zoom, where the fins are lines.
// Raw colours in ShaderMaterials, as the world does (the canvas is flat + linear: hex values land as written).
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { JET_DIMS, JET_POINTS, type FieldItem, type JetType } from "./aircraftShared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const hexV = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

/** the apron's asphalt: warm grey-brown, lit and low (mottle between them), a touch of haze */
export const ASPHALT = { hi: "#5C5044", lo: "#4E4339", haze: "#D9C3A0", lift: 0.05 } as const;

const ASPHALT_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = vec2(wp.x, -wp.z);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const ASPHALT_FRAG = /* glsl */ `
uniform vec3 uHi;
uniform vec3 uLo;
uniform vec3 uHaze;
uniform float uLift;
varying vec2 vP;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  float m = 0.55 * vn(vP / 140.0) + 0.3 * vn(vP / 38.0 + 7.3) + 0.15 * vn(vP / 9.0 - 3.1);
  vec3 col = mix(uLo, uHi, smoothstep(0.2, 0.8, m));
  gl_FragColor = vec4(mix(col, uHaze, uLift), 1.0);
}`;

/** Dark asphalt aprons [x0, z0, x1, z1] (world m) on the ground. */
export const AsphaltApron: React.FC<{ rects: [number, number, number, number][] }> = ({ rects }) => {
  const key = JSON.stringify(rects);
  const mesh = useMemo(() => {
    const pos: number[] = [];
    const idx: number[] = [];
    for (const [x0, z0, x1, z1] of rects) {
      const b = pos.length / 3;
      pos.push(x0, 0.02, -z0, x1, 0.02, -z0, x1, 0.02, -z1, x0, 0.02, -z1);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      vertexShader: ASPHALT_VERT,
      fragmentShader: ASPHALT_FRAG,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      uniforms: { uHi: { value: hexV(ASPHALT.hi) }, uLo: { value: hexV(ASPHALT.lo) }, uHaze: { value: hexV(ASPHALT.haze) }, uLift: { value: ASPHALT.lift } },
    });
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false;
    m.renderOrder = -2.9;
    return m;
  }, [key]);
  return <primitive object={mesh} />;
};

const STRIPE_VERT = /* glsl */ `
attribute float aT;
varying float vT;
void main() {
  vT = aT;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const STRIPE_FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uFoot;
varying float vT;
void main() { gl_FragColor = vec4(mix(uFoot, uTop, vT), 1.0); }`;

/** where the stripe runs on each type: from `from` (fraction of the length behind the nose) to the tail, `w` m wide */
const STRIPE: Partial<Record<JetType, { from: number; to: number; w: number }>> = {
  B787_9: { from: 0.5, to: 0.97, w: 2.9 },
  B737MAX: { from: 0.6, to: 0.96, w: 2.0 },
  A321: { from: 0.6, to: 0.96, w: 2.0 },
};

/** United's amber crown stripe on every jet of a field (same items as its JetField; heading 0 = nose up). */
export const AmberCrowns: React.FC<{ type: JetType; items: FieldItem[] }> = ({ type, items }) => {
  const n = items.length;
  const o = useMemo(() => {
    const st = STRIPE[type] ?? { from: 0.6, to: 0.96, w: 2 };
    const L = JET_DIMS[type].length;
    const y = JET_POINTS[type].crownMid[1] + 0.6;
    // local: x forward (nose +L/2), y up, z starboard
    const xa = L / 2 - st.from * L;
    const xb = L / 2 - st.to * L;
    const w2 = st.w / 2;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([xa, y, -w2, xb, y, -w2, xb, y, w2, xa, y, w2]), 3));
    // aT: 0 = amberFoot toward the wing, 1 = amberTop at the tail (the lit end)
    g.setAttribute("aT", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 0]), 1));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const mat = new THREE.ShaderMaterial({
      vertexShader: STRIPE_VERT,
      fragmentShader: STRIPE_FRAG,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      uniforms: { uTop: { value: hexV(COLOR.amberTop) }, uFoot: { value: hexV(COLOR.amberFoot) } },
    });
    const m = new THREE.InstancedMesh(g, mat, Math.max(1, n));
    m.frustumCulled = false;
    m.renderOrder = 1;
    return m as Any;
  }, [type, n]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S1 = new THREE.Vector3(1, 1, 1);
  items.forEach((it, i) => {
    E.set(0, (90 - (it.heading ?? 0)) * D2R, 0);
    Q.setFromEuler(E);
    M.compose(new THREE.Vector3(it.at[0], it.alt ?? 0, -it.at[1]), Q, S1);
    o.setMatrixAt(i, M);
  });
  o.count = n;
  o.instanceMatrix.needsUpdate = true;
  return <primitive object={o} />;
};
