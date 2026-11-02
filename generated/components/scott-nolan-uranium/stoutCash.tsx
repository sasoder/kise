// ===================================================================================================================
// stoutCash: the real banknote bundle of sam-gigawatt-cost/cashBundle.tsx (the user rejected gold for money), carried into
// nuclearWorld's stage. Same paper, note face, leaves and hand offsets. Two differences, both on purpose:
//  - lit by nuclearWorld's one KEY_LIGHT, no sky haze (the cash stays near the camera, in front of the fog);
//  - the strap is plain cream paper, not amber: in this clip amber is uranium fuel and nothing else (COMMON.md).
// Bundles: origin = the centre of the foot, L along local x, W along local z, H up. heading as cashBundle
// (the long axis points along (cos h, -sin h) in world X, Z). One instanced draw; keep items.length fixed.
// ===================================================================================================================
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, type V3 } from "./nuclearWorld";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));

export const BUNDLE_REAL = { L: 0.156, W: 0.066, H: 0.011 } as const;
export type BundleSize = { L: number; W: number; H: number };
export type BundleItem = { at: V3; heading: number; seed: number };
const CASH_COLOR = {
  face: "#C5CEAE",
  faceHi: "#DCE2CB",
  ink: "#56664B",
  edgeHi: "#D9DFC8",
  edgeLo: "#A7B395",
  shade: "#7C8370",
} as const;
const STRAP = 0.2;

let faceTex: Any = null;
const noteFace = () => {
  if (faceTex) return faceTex;
  const W = 1024;
  const H = 434;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d") as CanvasRenderingContext2D;
  g.fillStyle = CASH_COLOR.face;
  g.fillRect(0, 0, W, H);
  // soft guilloche field: faint concentric waves across the note
  g.strokeStyle = CASH_COLOR.ink;
  g.globalAlpha = 0.1;
  g.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    for (let x = 0; x <= W; x += 8) {
      const y = 30 + i * 15 + 6 * Math.sin(x * 0.03 + i * 0.7);
      if (x === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;
  // the double border
  g.strokeStyle = CASH_COLOR.ink;
  g.lineWidth = 9;
  g.strokeRect(22, 22, W - 44, H - 44);
  g.lineWidth = 3;
  g.strokeRect(42, 42, W - 84, H - 84);
  // the central oval: a lighter field, a fine double ring, a plain stylised medallion (no portrait)
  const cx = W / 2;
  const cy = H / 2;
  g.fillStyle = CASH_COLOR.faceHi;
  g.beginPath();
  g.ellipse(cx, cy, 118, 142, 0, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 8;
  g.beginPath();
  g.ellipse(cx, cy, 118, 142, 0, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(cx, cy, 100, 124, 0, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 0.55;
  g.fillStyle = CASH_COLOR.ink;
  g.beginPath();
  g.ellipse(cx, cy + 10, 52, 70, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;
  // the corner marks and the "$" either side of the oval
  g.fillStyle = CASH_COLOR.ink;
  g.textBaseline = "middle";
  g.font = "bold 84px Helvetica, Arial, sans-serif";
  g.textAlign = "left";
  g.fillText("100", 64, 96);
  g.fillText("100", 64, H - 92);
  g.textAlign = "right";
  g.fillText("100", W - 64, 96);
  g.fillText("100", W - 64, H - 92);
  g.textAlign = "center";
  g.font = "bold 150px Helvetica, Arial, sans-serif";
  g.fillText("$", cx - 250, cy + 6);
  g.fillText("$", cx + 250, cy + 6);
  faceTex = new THREE.CanvasTexture(cv);
  faceTex.anisotropy = 8;
  faceTex.needsUpdate = true;
  return faceTex;
};

const VERT = /* glsl */ `
attribute float iSeed;
uniform vec3 uSize;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
varying vec3 vLN;
varying float vSeed;
void main() {
  vec3 lp = position * uSize;
  vec4 wp = modelMatrix * instanceMatrix * vec4(lp, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vL = vec3(lp.x, lp.y, -lp.z);
  vLN = vec3(normal.x, normal.y, -normal.z);
  vSeed = iSeed;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */ `
uniform sampler2D uFace;
uniform vec3 uLgt;
uniform vec3 uSize;
uniform vec3 uEdgeHi;
uniform vec3 uEdgeLo;
uniform vec3 uShade;
uniform vec3 uStrapA;
uniform vec3 uStrapB;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
varying vec3 vLN;
varying float vSeed;
float h1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec2 sw = vec2(vL.x / uSize.x + 0.5, vL.z / uSize.z + 0.5);
  float yf = vL.y / max(uSize.y, 1e-4);
  bool top = vLN.y > 0.5;
  bool bottom = vLN.y < -0.5;
  bool longSide = abs(vLN.z) > 0.5;
  float pwx = fwidth(sw.x);
  float hs = ${(STRAP * 0.5).toFixed(3)};
  float strap = (top || bottom || longSide) ? clamp((hs - abs(sw.x - 0.5)) / max(pwx, 1e-4) + 0.5, 0.0, 1.0) : 0.0;
  vec3 base;
  if (top || bottom) {
    base = texture2D(uFace, vec2(sw.x, sw.y)).rgb;
  } else {
    float leaves = 14.0;
    float u = yf * leaves;
    float py = fwidth(u);
    float k = floor(u);
    float fr = fract(u);
    float leaf = h1(k + vSeed * 17.0);
    vec3 c = mix(uEdgeLo, uEdgeHi, 0.35 + 0.65 * leaf);
    float seam = 1.0 - smoothstep(0.0, 0.18 + py, min(fr, 1.0 - fr));
    c = mix(c, uEdgeLo * 0.9, seam * 0.5);
    base = mix(c, mix(uEdgeLo, uEdgeHi, 0.6), smoothstep(0.35, 0.9, py));
    base *= 0.97 + 0.04 * sin(vL.x * 3.1 / max(uSize.x, 1e-3) * 6.2831 + vSeed * 9.0);
  }
  if (strap > 0.0) {
    float e = abs(sw.x - 0.5) / hs;
    base = mix(base, mix(uStrapA, uStrapB, smoothstep(0.75, 1.0, e)), strap);
  }
  base *= 0.95 + 0.08 * vSeed;
  if (!top && !bottom) {
    float ex = longSide ? sw.x : sw.y;
    float pe = longSide ? pwx : fwidth(sw.y);
    float seamE = 1.0 - smoothstep(0.0, 0.012 + pe * 1.2, min(ex, 1.0 - ex));
    base *= 1.0 - 0.3 * seamE;
  } else {
    float pe = max(pwx, fwidth(sw.y));
    float rim = 1.0 - smoothstep(0.0, 0.015 + pe * 1.2, min(min(sw.x, 1.0 - sw.x), min(sw.y, 1.0 - sw.y) * 0.42));
    base *= 1.0 - 0.25 * rim;
  }
  float lit = smoothstep(-0.4, 0.85, dot(n, uLgt));
  vec3 col = mix(base * uShade / max(uEdgeHi, vec3(0.2)), base * 1.02, lit);
  col += base * 0.06 * pow(max(dot(n, normalize(uLgt + V)), 0.0), 10.0);
  if (!top && !bottom) {
    float py2 = fwidth(yf);
    col *= 1.0 - 0.28 * (1.0 - smoothstep(0.0, 0.12 + py2, yf));
    col = mix(col, col * 1.08, smoothstep(0.9, 1.0, yf));
  }
  gl_FragColor = vec4(col, 1.0);
}`;

/** Many bundles of one size in one draw. Keep items.length fixed across frames. */
export const StoutCash: React.FC<{ items: BundleItem[]; size: BundleSize }> = ({ items, size }) => {
  const n = Math.max(1, items.length);
  const o = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    const iSeed = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    g.setAttribute("iSeed", iSeed);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uFace: { value: noteFace() },
        uLgt: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
        uSize: { value: new THREE.Vector3(1, 1, 1) },
        uEdgeHi: { value: v3(CASH_COLOR.edgeHi) },
        uEdgeLo: { value: v3(CASH_COLOR.edgeLo) },
        uShade: { value: v3(CASH_COLOR.shade) },
        uStrapA: { value: v3(COLOR.cream) },
        uStrapB: { value: v3(COLOR.creamFoot) },
      },
    });
    const mesh = new THREE.InstancedMesh(g, mat, n);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    return { mesh, mat, iSeed };
  }, [n]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S1 = new THREE.Vector3(1, 1, 1);
  const P = new THREE.Vector3();
  items.forEach((it, i) => {
    E.set(0, -it.heading * D2R, 0);
    Q.setFromEuler(E);
    P.set(it.at[0], it.at[1], -it.at[2]);
    M.compose(P, Q, S1);
    o.mesh.setMatrixAt(i, M);
    o.iSeed.setX(i, it.seed);
  });
  o.mesh.count = items.length;
  o.mesh.instanceMatrix.needsUpdate = true;
  o.iSeed.needsUpdate = true;
  o.mat.uniforms.uSize.value.set(size.L, size.H, size.W);
  return <primitive object={o.mesh} />;
};
