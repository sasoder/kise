// doTheOppositeParts — cut-local 3D pieces of DoTheOpposite (scott-aircraft-order, cut 14), mounted in <AirStage world>.
// Read-only use of the world; nothing here is shared.
//   <CrownStripes type items>  United's amber crown stripe on each new jet: a band hugging the top of the fuselage
//                         (the world's own section curve, fusePoint) from ahead of the wing back to the tail cone, so
//                         the oncoming line reads amber-tipped where its fins are near edge-on. Fogged by distance with
//                         the world's fog law (AIR_FOG) toward its haze (SKY haze low, glow high), so far stripes melt
//                         into the air with their jets. Pattern: twoHundredParts AmberCrowns (cut 3), conformed and fogged.
// Raw colours in a ShaderMaterial, as the world does (the canvas is flat + linear: hex values land as written).
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { SPECS, fusePoint, type JetType } from "./aircraftModels";
import { AIR_FOG, type FieldItem } from "./aircraftShared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const hexV = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

const VERT = /* glsl */ `
attribute float aT;
attribute float aS;
varying float vT;
varying float vS;
varying vec3 vW;
void main() {
  vT = aT;
  vS = aS;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uFoot;
uniform vec3 uHazeLo;
uniform vec3 uHazeHi;
uniform vec3 uFog;
varying float vT;
varying float vS;
varying vec3 vW;
void main() {
  // amberFoot toward the wing, amberTop toward the tail (the lit end); the band's edges a touch deeper
  vec3 col = mix(uFoot, uTop, vT) * (1.0 - 0.1 * vS * vS);
  float d = length(vW - cameraPosition);
  float fog = uFog.z * (1.0 - exp(-max(0.0, d - uFog.x) / uFog.y));
  vec3 haze = mix(uHazeLo, uHazeHi, smoothstep(0.0, 320.0, vW.y));
  gl_FragColor = vec4(mix(col, haze, fog), 1.0);
}`;

/** where the band runs: s from `from` to `to` (fractions of the length behind the nose), half-angle `phi` around the crown */
const BAND = { from: 0.4, to: 0.95, phi: 0.42, lift: 0.06, segs: 28, rows: 4 } as const;

/** United's amber crown stripe on every new jet (same at / heading as its <Jet>; on the ground, no pitch); `capacity`
 *  fixes the instance buffer so jets can join without rebuilding it. */
export const CrownStripes: React.FC<{ type: JetType; items: FieldItem[]; capacity: number }> = ({ type, items, capacity }) => {
  const n = Math.min(items.length, capacity);
  const o = useMemo(() => {
    const sp = SPECS[type];
    const pos: number[] = [];
    const at: number[] = [];
    const as: number[] = [];
    const idx: number[] = [];
    const cols = BAND.rows + 1;
    for (let i = 0; i <= BAND.segs; i++) {
      const u = i / BAND.segs;
      const s = sp.L * (BAND.from + (BAND.to - BAND.from) * u);
      for (let j = 0; j < cols; j++) {
        const v = j / BAND.rows;
        const phi = (v * 2 - 1) * BAND.phi;
        const p = fusePoint(sp, s, phi);
        // lift the band off the skin along its outward direction (up and out by phi)
        pos.push(p[0], p[1] + BAND.lift * Math.cos(phi), p[2] + BAND.lift * Math.sin(phi));
        at.push(u);
        as.push(v * 2 - 1);
      }
    }
    for (let i = 0; i < BAND.segs; i++)
      for (let j = 0; j < BAND.rows; j++) {
        const a = i * cols + j;
        const b = a + cols;
        idx.push(a, b, b + 1, a, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(at), 1));
    g.setAttribute("aS", new THREE.BufferAttribute(new Float32Array(as), 1));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      uniforms: {
        uTop: { value: hexV(COLOR.amberTop) },
        uFoot: { value: hexV(COLOR.amberFoot) },
        uHazeLo: { value: hexV(SKY.haze) },
        uHazeHi: { value: hexV(SKY.glow) },
        uFog: { value: new THREE.Vector3(AIR_FOG.near, AIR_FOG.vis, AIR_FOG.max) },
      },
    });
    const m = new THREE.InstancedMesh(g, mat, Math.max(1, capacity));
    m.frustumCulled = false;
    return m as Any;
  }, [type, capacity]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S1 = new THREE.Vector3(1, 1, 1);
  items.slice(0, n).forEach((it, i) => {
    // the world's <Jet>: group at (X, alt, -Z), rotated (90 - heading) about y
    E.set(0, (90 - (it.heading ?? 0)) * D2R, 0);
    Q.setFromEuler(E);
    M.compose(new THREE.Vector3(it.at[0], it.alt ?? 0, -it.at[1]), Q, S1);
    o.setMatrixAt(i, M);
  });
  o.count = n;
  o.instanceMatrix.needsUpdate = true;
  return <primitive object={o} />;
};
