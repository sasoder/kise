// ===================================================================================================================
// cashBundle — THE CASH of sam-gigawatt-cost (Cheeky Pint S4E07, Sam Altman). Owner: cut 6 (SeventyBillionAGigawatt).
// Other cuts import it read-only (changes: add names, keep old ones, log in animation_source/notes/SHARED_CHANGES.md).
// The user's note on cut 6: "gold should be cash instead". The dollars are now real banknote bundles.
//
// WHAT IT IS. A bundle of US-style notes: pale sage / green-grey paper, its long sides and ends showing the paper
// edges of the notes layer on layer, its top the face of the top note (a fine double border, a central oval with a
// lighter field and a stylised bust-free medallion, "100" in the corners, a "$" each side of the oval), and an AMBER
// paper strap around its middle (amber stays the dollars' accent: it keeps its stout colour through AirStage's grade
// and blooms like every amber). Lit by the stage's ONE key light (aircraftShared LIGHT: side, or plan when the eye is
// far up), a contact darkening at the foot of every bundle (so a stack reads as touching layers), distance fog.
//
// CHEAP: every bundle in one call is ONE instanced draw (a box per instance, all detail procedural in the shader plus
// one shared canvas texture for the note face), so a few hundred or a few thousand bundles cost one draw.
//
// WORLD UNITS: metres, aircraftShared's (X right, Y up, Z away from the camera). A bundle's local frame: L along x
// (the note's length), W along z (its height), H up (its thickness); origin = the centre of its FOOT (it stands on y 0).
// heading (deg) turns it in plan like campusWorld (0 = local +z toward world +Z, 90 = toward world +X).
//
// API (everything goes inside <AirStage world>; render with --gl=angle)
//   BUNDLE_REAL          { L 0.156, W 0.066, H 0.011 } a real strapped bundle of 100 notes (m); scale it freely
//   type BundleSize      { L, W, H }
//   type BundleItem      { at: [X, Y, Z] (foot centre), heading?, size?, seed? }
//   <CashBundles items size? lift? clip? fog? fogSpec? light? renderOrder? strap?>  ONE instanced draw of many bundles.
//                        lift (m): added to every bundle's world Y (a stack rising out of a slot); clip: hide what is
//                        below world y 0 (inside the slot). Keep the item COUNT fixed across frames (it rebuilds).
//   <CashBundle at heading? size?>       one bundle
//   <CashStack at heading? n size? gap? jitter?>   n bundles stacked neatly (a straight pile, tiny hand offsets)
//   <CashBrick at heading? nx nz ny size? jitter?>  a brick / pallet: nx (along L) x nz (along W) x ny (courses)
//                        bundles, for large sums
//   cashStackItems(...), cashBrickItems(...) -> BundleItem[]   the same layouts as plain items, so several stacks or
//                        bricks can be merged into ONE <CashBundles> draw
//   <CashShadow rects light? soft? strength? renderOrder?>  soft contact shadows on the ground for free-standing cash:
//                        rects = [{ at: [X, Z], heading?, L, W, h }] (footprint + height); painted without a depth test
//                        (draw it after any ground/apron layer it must darken: renderOrder above theirs)
//   CASH_COLOR           the paper / ink / strap tones
// ===================================================================================================================
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { random } from "remotion";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { LIGHT, type V3 } from "../scott-aircraft-order/aircraftShared";
import { CAMPUS_FOG } from "./campusWorld";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));

export const BUNDLE_REAL = { L: 0.156, W: 0.066, H: 0.011 } as const;
export type BundleSize = { L: number; W: number; H: number };
export type BundleItem = { at: V3; heading?: number; size?: BundleSize; seed?: number };
export type FogSpec = { near: number; vis: number; max: number };

export const CASH_COLOR = {
  /** the note's face paper (sage) and its fine ink */
  face: "#C5CEAE",
  faceHi: "#DCE2CB",
  ink: "#56664B",
  /** the paper edges, light and dark leaves */
  edgeHi: "#D9DFC8",
  edgeLo: "#A7B395",
  /** the shade side of paper: a warm grey-green, never black */
  shade: "#7C8370",
} as const;
/** the strap's share of the bundle's length */
const STRAP = 0.2;

// ===================================================================================================================
// THE NOTE FACE (one shared canvas texture; drawn once per tab, deterministic)
// ===================================================================================================================
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

// ===================================================================================================================
// SHADER
// ===================================================================================================================
const COMMON_GLSL = /* glsl */ `
uniform vec4 uFog;   // near, vis, max, off
uniform vec3 uHazeLo;
uniform vec3 uHazeHi;
float fogAt(vec3 w) {
  float d = length(w - cameraPosition);
  return uFog.z * (1.0 - exp(-max(0.0, d - uFog.x) / uFog.y)) * (1.0 - uFog.w);
}
vec3 fogCol(vec3 w) { return mix(uHazeLo, uHazeHi, smoothstep(0.0, 320.0, w.y)); }
float h1(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
`;
const VERT = /* glsl */ `
attribute vec3 iSize;
attribute float iSeed;
uniform float uLift;
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;      // local position in metres (x along L, y up from the foot, z along W)
varying vec3 vLN;     // local normal
varying vec3 vSize;
varying float vSeed;
void main() {
  // the unit box: x, z in -0.5..0.5, y in 0..1
  vec3 lp = position * iSize;
  vec4 wp = modelMatrix * instanceMatrix * vec4(lp, 1.0);
  wp.y += uLift;
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  vL = vec3(lp.x, lp.y, -lp.z);
  vLN = vec3(normal.x, normal.y, -normal.z);
  vSize = iSize;
  vSeed = iSeed;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */ `
uniform sampler2D uFace;
uniform vec3 uLgt;
uniform float uClip;
uniform float uStrap;
uniform vec3 uFaceC;
uniform vec3 uEdgeHi;
uniform vec3 uEdgeLo;
uniform vec3 uShade;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec3 uInk;
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
varying vec3 vLN;
varying vec3 vSize;
varying float vSeed;
void main() {
  if (uClip > 0.5 && vW.y < 0.0) discard;
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec2 sw = vec2(vL.x / vSize.x + 0.5, vL.z / vSize.z + 0.5);   // 0..1 along L, along W
  float yf = vL.y / max(vSize.y, 1e-4);                           // 0..1 up the bundle
  bool top = vLN.y > 0.5;
  bool bottom = vLN.y < -0.5;
  bool longSide = abs(vLN.z) > 0.5;
  // the strap: a band around the middle (across the top, both long sides and the bottom)
  float pwx = fwidth(sw.x);
  float hs = uStrap * 0.5;
  float strap = (top || bottom || longSide) ? clamp((hs - abs(sw.x - 0.5)) / max(pwx, 1e-4) + 0.5, 0.0, 1.0) : 0.0;
  vec3 base;
  float amber = 0.0;
  if (top || bottom) {
    base = texture2D(uFace, vec2(sw.x, sw.y)).rgb;
  } else {
    // the paper edges: leaves layer on layer (light and dark), each its own tone; faded by pixel size so they never strobe
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
    // a slight wave in the ends (the notes are not cut flush)
    base *= 0.97 + 0.04 * sin(vL.x * 3.1 / max(vSize.x, 1e-3) * 6.2831 + vSeed * 9.0);
  }
  // the strap: amber paper, its two edges a hair darker, a faint print line along it
  if (strap > 0.0) {
    float e = abs(sw.x - 0.5) / hs;
    vec3 sc = mix(uAmberTop, uAmberFoot, 0.25 + 0.35 * smoothstep(0.75, 1.0, e));
    if (top) sc = mix(sc, uAmberHot, 0.18);
    base = mix(base, sc, strap);
    amber = strap;
  }
  // each bundle its own hair of tone; a fine dark seam where it meets its neighbours (the bundles read one by one)
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
  float ndl = dot(n, uLgt);
  float lit = smoothstep(-0.4, 0.85, ndl);
  vec3 col = mix(base * uShade / max(uEdgeHi, vec3(0.2)), base * 1.02, lit);
  // amber paper keeps most of its glow on the shade side (the stout amber is never dull)
  col = mix(col, base * mix(0.86, 1.02, lit), amber * 0.75);
  // the paper's soft sheen
  vec3 Hh = normalize(uLgt + V);
  col += base * 0.06 * pow(max(dot(n, Hh), 0.0), 10.0);
  // the contact: each bundle darkens into what it stands on; the top edge of a side catches the light
  if (!top && !bottom) {
    float py2 = fwidth(yf);
    col *= 1.0 - 0.28 * (1.0 - smoothstep(0.0, 0.12 + py2, yf));
    col = mix(col, col * 1.08, smoothstep(0.9, 1.0, yf));
  }
  float f = fogAt(vW) * (1.0 - 0.6 * amber);
  gl_FragColor = vec4(mix(col, fogCol(vW), f), 1.0);
}`;

// ===================================================================================================================
// COMPONENTS (pure per frame: AirStage mounts `world` twice)
// ===================================================================================================================
const boxGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  };
})();
const useLightOf = (light?: "side" | "plan"): V3 => {
  const { camera } = useThree();
  const plan = light ? light === "plan" : (camera as Any).position.y > 20000;
  const L = plan ? LIGHT.plan : LIGHT.side;
  return [L[0], L[1], -L[2]];
};

/** CashBundles — many bundles in ONE instanced draw. Keep `items.length` fixed across frames. */
export const CashBundles: React.FC<{
  items: BundleItem[];
  size?: BundleSize;
  lift?: number;
  clip?: boolean;
  fog?: number;
  fogSpec?: FogSpec;
  light?: "side" | "plan";
  renderOrder?: number;
  strap?: number;
}> = ({ items, size = BUNDLE_REAL, lift = 0, clip = false, fog = 1, fogSpec = CAMPUS_FOG, light, renderOrder = 1, strap = STRAP }) => {
  const L = useLightOf(light);
  const n = Math.max(1, items.length);
  const o = useMemo(() => {
    const shared = boxGeo();
    const g = new THREE.BufferGeometry();
    for (const k of ["position", "normal", "uv"]) g.setAttribute(k, shared.getAttribute(k));
    g.setIndex(shared.getIndex());
    const iSize = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    const iSeed = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    g.setAttribute("iSize", iSize);
    g.setAttribute("iSeed", iSeed);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      // drawn in the transparent pass (alpha stays 1, depth written): after pads and aprons that paint without a
      // depth test
      transparent: true,
      depthWrite: true,
      depthTest: true,
      uniforms: {
        uFog: { value: new THREE.Vector4(0, 1, 0, 0) },
        uHazeLo: { value: v3(SKY.haze) },
        uHazeHi: { value: v3(SKY.glow) },
        uFace: { value: noteFace() },
        uLgt: { value: new THREE.Vector3(0, 1, 0) },
        uLift: { value: 0 },
        uClip: { value: 0 },
        uStrap: { value: STRAP },
        uFaceC: { value: v3(CASH_COLOR.face) },
        uEdgeHi: { value: v3(CASH_COLOR.edgeHi) },
        uEdgeLo: { value: v3(CASH_COLOR.edgeLo) },
        uShade: { value: v3(CASH_COLOR.shade) },
        uAmberTop: { value: v3(COLOR.amberTop) },
        uAmberFoot: { value: v3(COLOR.amberFoot) },
        uAmberHot: { value: v3(COLOR.amberHot) },
        uInk: { value: v3(CASH_COLOR.ink) },
      },
    });
    const mesh = new THREE.InstancedMesh(g, mat, n);
    mesh.frustumCulled = false;
    return { mesh, mat, iSize, iSeed };
  }, [n]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const E = new THREE.Euler();
  const S1 = new THREE.Vector3(1, 1, 1);
  items.forEach((it, i) => {
    E.set(0, -(it.heading ?? 0) * D2R, 0);
    Q.setFromEuler(E);
    M.compose(new THREE.Vector3(it.at[0], it.at[1], -it.at[2]), Q, S1);
    o.mesh.setMatrixAt(i, M);
    const s = it.size ?? size;
    o.iSize.setXYZ(i, s.L, s.H, s.W);
    o.iSeed.setX(i, it.seed ?? random(`cash${i}`));
  });
  o.mesh.count = items.length;
  o.mesh.instanceMatrix.needsUpdate = true;
  o.iSize.needsUpdate = true;
  o.iSeed.needsUpdate = true;
  o.mesh.renderOrder = renderOrder;
  const u = o.mat.uniforms;
  u.uFog.value.set(fogSpec.near, fogSpec.vis, fogSpec.max * fog, 0);
  u.uLgt.value.set(L[0], L[1], L[2]);
  u.uLift.value = lift;
  u.uClip.value = clip ? 1 : 0;
  u.uStrap.value = strap;
  return <primitive object={o.mesh} />;
};

/** a local point of a placed thing (heading as campusWorld) -> world */
const place = (at: V3, heading: number, lx: number, ly: number, lz: number): V3 => {
  const h = heading * D2R;
  const c = Math.cos(h);
  const s = Math.sin(h);
  return [at[0] + lx * c + lz * s, at[1] + ly, at[2] - lx * s + lz * c];
};

/** n bundles stacked neatly on `at` (foot centre), tiny deterministic hand offsets (`jitter` x the bundle size) */
export const cashStackItems = (at: V3, n: number, size: BundleSize = BUNDLE_REAL, heading = 0, gap = 0, jitter = 0.02, seed = "stack"): BundleItem[] =>
  Array.from({ length: n }, (_, i) => {
    const jx = (random(`${seed}x${i}`) - 0.5) * jitter * size.L;
    const jz = (random(`${seed}z${i}`) - 0.5) * jitter * size.W;
    const jh = (random(`${seed}h${i}`) - 0.5) * jitter * 40;
    return { at: place(at, heading, jx, i * (size.H + gap), jz), heading: heading + jh, size, seed: random(`${seed}s${i}`) };
  });

/** a brick / pallet: nx (along L) x nz (along W) x ny courses of bundles, centred on `at` (foot centre) */
export const cashBrickItems = (at: V3, nx: number, nz: number, ny: number, size: BundleSize = BUNDLE_REAL, heading = 0, jitter = 0.015, seed = "brick"): BundleItem[] => {
  const out: BundleItem[] = [];
  for (let y = 0; y < ny; y++)
    for (let z = 0; z < nz; z++)
      for (let x = 0; x < nx; x++) {
        const k = `${seed}${x}:${y}:${z}`;
        const lx = (x - (nx - 1) / 2) * size.L + (random(`${k}x`) - 0.5) * jitter * size.L;
        const lz = (z - (nz - 1) / 2) * size.W + (random(`${k}z`) - 0.5) * jitter * size.W;
        out.push({ at: place(at, heading, lx, y * size.H, lz), heading, size, seed: random(`${k}s`) });
      }
  return out;
};

export const CashBundle: React.FC<{ at: V3; heading?: number; size?: BundleSize; fog?: number; fogSpec?: FogSpec }> = ({ at, heading = 0, size = BUNDLE_REAL, fog, fogSpec }) => (
  <CashBundles items={[{ at, heading, size, seed: 0.37 }]} size={size} fog={fog} fogSpec={fogSpec} />
);
export const CashStack: React.FC<{ at: V3; n: number; heading?: number; size?: BundleSize; gap?: number; jitter?: number; fog?: number; fogSpec?: FogSpec }> = ({
  at,
  n,
  heading = 0,
  size = BUNDLE_REAL,
  gap = 0,
  jitter = 0.02,
  fog,
  fogSpec,
}) => <CashBundles items={cashStackItems(at, n, size, heading, gap, jitter)} size={size} fog={fog} fogSpec={fogSpec} />;
export const CashBrick: React.FC<{ at: V3; nx: number; nz: number; ny: number; heading?: number; size?: BundleSize; jitter?: number; fog?: number; fogSpec?: FogSpec }> = ({
  at,
  nx,
  nz,
  ny,
  heading = 0,
  size = BUNDLE_REAL,
  jitter = 0.015,
  fog,
  fogSpec,
}) => <CashBundles items={cashBrickItems(at, nx, nz, ny, size, heading, jitter)} size={size} fog={fog} fogSpec={fogSpec} />;

// --- contact shadows on the ground --------------------------------------------------------------------------------
const SH_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const SH_FRAG = /* glsl */ `
uniform vec4 uR[16];    // centre X, Z, half L, half W
uniform vec4 uRH[16];   // height, cos, sin, on
uniform float uN;
uniform vec3 uLw;
uniform vec3 uShadow;
uniform float uSoft;
uniform float uStrength;
varying vec3 vW;
float sdBox2(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  float a = 0.0;
  for (int i = 0; i < 16; i++) {
    if (float(i) >= uN) break;
    vec4 r = uR[i];
    vec4 rh = uRH[i];
    vec2 w = p - r.xy;
    vec2 q = vec2(w.x * rh.y - w.y * rh.z, w.x * rh.z + w.y * rh.y);
    vec2 L = vec2(uLw.x, uLw.z);
    vec2 Lq = vec2(L.x * rh.y - L.y * rh.z, L.x * rh.z + L.y * rh.y);
    vec2 v = -Lq / max(uLw.y, 0.05) * rh.x;
    // the cast shadow as a series of the footprint slid along v (soft), plus the contact under the foot
    float best = 1e5;
    for (int k = 0; k < 9; k++) {
      float t = float(k) / 8.0;
      best = min(best, sdBox2(q - v * t, r.zw));
    }
    float pen = uSoft * (0.5 + 0.15 * rh.x / max(r.w, 1e-3));
    float castA = 1.0 - smoothstep(-pen, pen, best);
    float contact = 1.0 - smoothstep(0.0, uSoft * 0.8, sdBox2(q, r.zw));
    a = max(a, (0.5 * castA + 0.3 * contact) * rh.w);
  }
  if (a < 0.003) discard;
  gl_FragColor = vec4(uShadow, a * uStrength);
}`;
export type ShadowRect = { at: [number, number]; heading?: number; L: number; W: number; h: number };
/** CashShadow — soft contact + cast shadows on the ground (y 0) for free-standing cash (up to 16 rects). */
export const CashShadow: React.FC<{ rects: ShadowRect[]; light?: "side" | "plan"; soft?: number; strength?: number; renderOrder?: number; extent?: number }> = ({
  rects,
  light,
  soft = 0.05,
  strength = 1,
  renderOrder = -1.5,
  extent = 4000,
}) => {
  const L = useLightOf(light);
  const o = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: SH_VERT,
      fragmentShader: SH_FRAG,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uR: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },
        uRH: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) },
        uN: { value: 0 },
        uLw: { value: new THREE.Vector3(0, 1, 0) },
        uShadow: { value: v3(COLOR.shadow) },
        uSoft: { value: 0.05 },
        uStrength: { value: 1 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    return { mesh, mat };
  }, []);
  const u = o.mat.uniforms;
  rects.slice(0, 16).forEach((r, i) => {
    const h = (r.heading ?? 0) * D2R;
    u.uR.value[i].set(r.at[0], r.at[1], r.L / 2, r.W / 2);
    u.uRH.value[i].set(r.h, Math.cos(h), Math.sin(h), 1);
  });
  u.uN.value = Math.min(16, rects.length);
  // three space light back to world (z flip)
  u.uLw.value.set(L[0], L[1], -L[2]);
  u.uSoft.value = soft;
  u.uStrength.value = strength;
  // a plane over the rects' neighbourhood
  const xs = rects.map((r) => r.at[0]);
  const zs = rects.map((r) => r.at[1]);
  const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  const cz = zs.length ? (Math.min(...zs) + Math.max(...zs)) / 2 : 0;
  const span = xs.length ? Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) + extent : extent;
  o.mesh.position.set(cx, 0.01, -cz);
  o.mesh.scale.set(span, 1, span);
  o.mesh.renderOrder = renderOrder;
  return <primitive object={o.mesh} />;
};
