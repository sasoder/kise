// energyCore: constants, materials and geometry helpers of the scott-nolan-wind energy world (see energyWorld.tsx).
// Built on nuclearWorld (scott-nolan-uranium): its shared light/fog uniforms, its clay lighting (copied below so one
// shader can carry per-vertex colours and analytic contact shadows on a plinth top), its draw order.
// WORLD: X right, Y up (board = 0), Z away from the camera. three's z = -Z: geometry is built in world X/Y/Z and
// flipped once by `flipZ`, meshes are placed with position.set(X, Y, -Z).
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// @ts-expect-error untyped module
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { SHADOW_DIR, nuclearMaterial } from "../scott-nolan-uranium/nuclearWorld";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any;
export type V3 = [number, number, number];
export const D2R = Math.PI / 180;
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const frac = (v: number) => v - Math.floor(v);
export const hash01 = (n: number) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);
export const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** quintic ease 0..1 over [a, b] */
export const glide = (a: number, b: number, f: number) => {
  const t = c01((f - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const hexRGB = (h: string): V3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const vec3Of = (h: string) => new THREE.Vector3(...hexRGB(h));

// ===================================================================================================================
// THE PALETTE OF THE ENERGY WORLD (house B1 plus the few deep browns real things need; nothing black, nothing blue)
// ===================================================================================================================
export const EW_COLOR = {
  cream: COLOR.cream,
  creamFoot: COLOR.creamFoot,
  /** the plinths: one step under the plants' cream, so a plant separates from its plinth */
  plinth: "#E9DECB",
  board: COLOR.board,
  boardFoot: COLOR.boardFoot,
  /** the inside of hollow things (cooling tower, cutaway, the hall's floor) */
  hollow: "#8E7259",
  /** coal: deep brown, not black */
  coal: "#5B3E2B",
  /** solar cells: dark brown under cream frames */
  cell: "#4A3122",
  /** server racks */
  rack: "#5A4030",
  /** sockets' holes, fan wells */
  well: "#3A2618",
  /** smoke: warm brown-grey, lit top and shaded foot */
  smokeLit: "#B3A391",
  smokeShade: "#7D6B5B",
  /** gas exhaust: a pale haze */
  hazeLit: "#EFE6D7",
  hazeShade: "#C9BBA7",
} as const;

// ===================================================================================================================
// THE ROW. Five plinths, one row, left to right. Every cut places the row from these.
// ===================================================================================================================
export const PLANTS = ["coal", "gas", "nuclear", "wind", "solar"] as const;
export type PlantKind = (typeof PLANTS)[number];
/** a plinth: W across (X), D deep (Z), H tall; R its corner radius */
export const PLINTH = { W: 204, D: 220, H: 56, R: 9 } as const;
export const ROW_PITCH = 214;
/** plinth centres on the board, [X, Z] */
export const LINEUP: Record<PlantKind, [number, number]> = {
  coal: [-2 * ROW_PITCH, 0],
  gas: [-ROW_PITCH, 0],
  nuclear: [0, 0],
  wind: [ROW_PITCH, 0],
  solar: [2 * ROW_PITCH, 0],
};
/** the plant stands on the back of its plinth; the front is an apron (local z, from the plinth centre) */
export const APRON = { Z0: -PLINTH.D / 2, Z1: -22 } as const;
/** the slot in the apron's top where a glass column rises (cut B), local to the plinth centre */
export const SLOT = { x: 0, z: -66, r: 36 } as const;
/** the socket on the plinth's front face, local: centre height and radius */
export const SOCKET = { y: 28, r: 20, PIN_DX: 10, PIN_R: 4.8 } as const;

export const plinthTop = () => PLINTH.H;
/** world [X, Y, Z] of a plinth's top centre */
export const plinthTopOf = (k: PlantKind): V3 => [LINEUP[k][0], PLINTH.H, LINEUP[k][1]];
/** world [X, Z] of the slot in a plinth's apron (cut B's glass columns) */
export const slotOf = (k: PlantKind): [number, number] => [LINEUP[k][0] + SLOT.x, LINEUP[k][1] + SLOT.z];
/** the socket on a plinth's front face: its face centre (world) and the direction a plug travels to seat (+Z) */
export const socketOf = (k: PlantKind): { pos: V3; dir: V3 } => ({ pos: [LINEUP[k][0], SOCKET.y, LINEUP[k][1] - PLINTH.D / 2], dir: [0, 0, 1] });

// ===================================================================================================================
// MATERIALS. One clay shader (nuclearWorld's lighting) with per-vertex colour, a dim/lift tone per object and analytic
// contact shadows on one horizontal surface (a plinth top, a roof): uOcc = capsules (x, z, len, r) in WORLD X/Z.
// ===================================================================================================================
const NW = () => nuclearMaterial("clay").uniforms;
export const sharedUniforms = () => {
  const u = NW();
  return {
    uL: u.uL,
    uFogRange: u.uFogRange,
    uFogCol: u.uFogCol,
    uShade: u.uShade,
    uCream: u.uCream,
    uCreamFoot: u.uCreamFoot,
    uAmberTop: u.uAmberTop,
    uAmberFoot: u.uAmberFoot,
    uAmberHot: u.uAmberHot,
    uBoardTone: u.uBoardTone,
  };
};
export const COMMON_GLSL = /* glsl */ `
uniform vec3 uL;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uShade;
uniform vec3 uCream;
uniform vec3 uCreamFoot;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec3 uBoardTone;
float fogAt(vec3 w) { return smoothstep(uFogRange.x, uFogRange.y, length(w - cameraPosition)); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 clayShade(vec3 base, vec3 n, vec3 V) {
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.42, 0.86, ndl);
  vec3 col = mix(base * uShade, base * 1.02, lit);
  col += base * vec3(0.10, 0.055, 0.02) * (1.0 - lit) * (0.45 - 0.45 * n.y);
  float graze = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 1.5);
  col *= 1.0 - 0.16 * graze * (1.0 - smoothstep(0.05, 0.7, n.y));
  col += base * 0.07 * pow(max(dot(n, normalize(uL + V)), 0.0), 16.0);
  col = mix(col, uCream, 0.4 * pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0) * smoothstep(0.05, 0.7, n.y));
  return col;
}
`;
export const MAX_OCC = 40;
const EC_VERT = /* glsl */ `
attribute vec3 aCol;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vC = aCol;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const EC_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform vec4 uOcc[${MAX_OCC}];
uniform float uOccN;
uniform float uOccY;
uniform vec2 uShDir;
uniform vec3 uShadowCol;
uniform float uDim;
uniform float uLift;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
float capsule(vec2 p, vec4 o) {
  vec2 d = uShDir; vec2 s = vec2(-d.y, d.x);
  vec2 r = p - o.xy;
  vec2 q = vec2(dot(r, d), dot(r, s));
  float t = clamp(q.x / max(o.z, 0.0001), 0.0, 1.0);
  float soft = o.w * 0.6 * (0.35 + 3.0 * t);
  float rad = o.w * (1.0 + 0.25 * t);
  vec2 c = vec2(q.x - clamp(q.x, 0.0, o.z), q.y);
  float a = 1.0 - smoothstep(rad - soft, rad + soft, length(c));
  return a * mix(1.0, 0.55, t);
}
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float light = step(0.55, dot(vC, vec3(0.333)));
  vec3 base = mix(vC, mix(vC * 0.86, uBoardTone, light), uDim);
  base = mix(base, uCream * 1.03, uLift * 0.6 * light);
  vec3 col = clayShade(base, n, V);
  if (uOccN > 0.5 && n.y > 0.7 && abs(vW.y - uOccY) < 0.8) {
    vec2 p = vec2(vW.x, -vW.z);
    float a = 0.0;
    for (int i = 0; i < ${MAX_OCC}; i++) {
      if (float(i) < uOccN) a = max(a, capsule(p, uOcc[i]));
    }
    col = mix(col, uShadowCol, 0.46 * 0.85 * a);
  }
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
export type ShadowCap = { x: number; z: number; len: number; r: number };
/** a new clay material (own uniforms for dim/lift and the contact shadows on the surface at height occY) */
export const energyClay = (occ: ShadowCap[] = [], occY = 0) => {
  const arr = [];
  for (let i = 0; i < MAX_OCC; i++) {
    const o = occ[i];
    arr.push(o ? new THREE.Vector4(o.x, o.z, o.len, o.r) : new THREE.Vector4(0, 0, 0, 0));
  }
  return new THREE.ShaderMaterial({
    vertexShader: EC_VERT,
    fragmentShader: EC_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      ...sharedUniforms(),
      uOcc: { value: arr },
      uOccN: { value: Math.min(MAX_OCC, occ.length) },
      uOccY: { value: occY },
      uShDir: { value: new THREE.Vector2(SHADOW_DIR[0], SHADOW_DIR[1]) },
      uShadowCol: { value: vec3Of(COLOR.shadow) },
      uDim: { value: 0 },
      uLift: { value: 0 },
    },
  });
};

// ===================================================================================================================
// GEOMETRY HELPERS (world X/Y/Z, y = bottom unless said)
// ===================================================================================================================
/** paint a geometry with one colour (the clay shader's aCol) */
export const paint = (g: Any, hex: string, mul = 1) => {
  const n = g.attributes.position.count;
  const c = hexRGB(hex);
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a[i * 3] = c[0] * mul;
    a[i * 3 + 1] = c[1] * mul;
    a[i * 3 + 2] = c[2] * mul;
  }
  g.setAttribute("aCol", new THREE.BufferAttribute(a, 3));
  return g;
};
/** keep only the attributes the clay shader needs, so any three geometries merge */
const tidy = (g: Any) => {
  let o = g.index ? g.toNonIndexed() : g;
  if (o === g) o = g.clone();
  for (const k of Object.keys(o.attributes)) if (k !== "position" && k !== "normal" && k !== "aCol" && k !== "uv") o.deleteAttribute(k);
  if (!o.attributes.uv) o.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(o.attributes.position.count * 2), 2));
  return o;
};
export const merge = (list: Any[]) => mergeGeometries(list.map(tidy), false);
/** world Z -> three z, once per finished geometry */
export const flipZ = (g: Any) => {
  g.scale(1, 1, -1);
  // a mirror reverses the winding: swap two corners of every triangle so front faces stay front faces
  if (g.index) {
    const a = g.index.array;
    for (let i = 0; i + 2 < a.length; i += 3) {
      const t = a[i + 1];
      a[i + 1] = a[i + 2];
      a[i + 2] = t;
    }
    g.index.needsUpdate = true;
  } else {
    for (const k of Object.keys(g.attributes)) {
      const at = g.attributes[k];
      const n = at.itemSize;
      const arr = at.array;
      for (let v = 0; v + 2 < at.count; v += 3) {
        for (let c = 0; c < n; c++) {
          const t = arr[(v + 1) * n + c];
          arr[(v + 1) * n + c] = arr[(v + 2) * n + c];
          arr[(v + 2) * n + c] = t;
        }
      }
      at.needsUpdate = true;
    }
  }
  return g;
};
export const rbox = (w: number, h: number, d: number, x: number, y: number, z: number, r: number, hex: string, seg = 3) => {
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01));
  g.translate(x, y + h / 2, z);
  return paint(g, hex);
};
export const box = (w: number, h: number, d: number, x: number, y: number, z: number, hex: string) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return paint(g, hex);
};
export const lathe = (pts: [number, number][], seg = 48, hex: string = EW_COLOR.cream, phiStart = 0, phiLength = Math.PI * 2) =>
  paint(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(Math.max(0.0001, p[0]), p[1])), seg, phiStart, phiLength), hex);
export const cyl = (r0: number, r1: number, h: number, x: number, y: number, z: number, hex: string, seg = 32, open = false) => {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg, 1, open);
  g.translate(x, y + h / 2, z);
  return paint(g, hex);
};
export const mesh = (g: Any, m: Any, order = 1) => {
  const me = new THREE.Mesh(g, m);
  me.frustumCulled = false;
  me.renderOrder = order;
  return me;
};
export { THREE };
