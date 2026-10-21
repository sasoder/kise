// ---------------------------------------------------------------------------
// anotherPandemicGoose3d: the wild goose of AnotherPandemicRoad V2 (kyle-pandemics, cut 47), built as real 3D geometry
// with three.js (@remotion/three) and drawn through the cut's one pinhole camera (the same F, eye, horizon lens shift),
// in the engraved manner: flat stepped tones lit from the upper left (lit / mid / shade), screen-space hatching on the
// shade side, dark casing (an inverted hull on the solid parts, a dark rim and shaft line on every feather).
//
// THE BIRD (a greylag, Anser anser; studied from references: heavy, deep-bellied body carried level; long thick neck
// with lengthwise furrows; a big head with a deep wedge-shaped orange-pink bill and a pale nail; pink legs, webbed feet;
// grey-brown upperparts in pale-edged rows; barred flanks; a white undertail; in flight long, broad wings with dark
// primaries and a grey forewing, the neck stretched out). Built as: a deformed body ellipsoid with a tapered rear and
// a short tail fan; a neck tube along a curve; a head and bill; legs; and two articulated wings (shoulder, elbow,
// wrist) carrying ~45 feathers each (9 primaries, 10 secondaries, 4 tertials, 6 primary coverts, greater and median
// covert rows, a forewing membrane). Folding is the joints closing: the humerus swings back, the forearm forward,
// the hand back over the tail; every feather's direction turns smoothly with its bone (no snapping), so the flight ->
// flare -> landing -> fold is continuous.
// THE DISEASE (orange): a soft stain with orange hatching through the breast and belly, orange threads up the lower
// neck; the bill and feet are orange too (a greylag's are orange-pink).
// LOCAL UNITS: cm (x forward, y up, z to its right), origin between its feet; GS scales it into the world (world units
// are cm). The pose timeline is goosePoseAt in anotherPandemicGoose.tsx.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { F, type Cam3 } from "./anotherPandemicWorld";
import type { GoosePose } from "./anotherPandemicGoose";

/** a big greylag, drawn a little over life size so it reads on a phone (~1.2 m bill to tail) */
export const GS = 1.3;

type V3 = [number, number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const nlerp = (a: V3, b: V3, t: number): V3 => norm([mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]);
/** rotate v about a unit axis k by angle a (Rodrigues) */
const rot = (v: V3, k: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
};
const hex = (h: string): V3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const mixc = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// ---- the palette (styles/dwarkesh-map.md plus the goose's natural umbers) ------------------------------------------
const DARK = hex("#17120D");
const BACK = hex("#6B5A44"); // grey-brown upperparts
const BACK_D = hex("#4E4033");
const PALE = hex("#D3C5A2"); // pale feather edges
const FLANK = hex("#7A6A52");
const BREAST = hex("#A99B7D");
const BELLY = hex("#C9BC9C");
const UNDERTAIL = hex("#E2D7BC");
const NECK = hex("#7A6950");
const HEAD = hex("#6E5D47");
const PRIM = hex("#2E261D");
const SEC = hex("#3B3127");
const FOREWING = hex("#8A7E68"); // a greylag's pale grey forewing
const ORANGE = hex("#FFB000");
const ORANGE_DEEP = hex("#D98A0C");
const UNDERWING = hex("#9A8F7A");

// ---------------------------------------------------------------------------
// THE ENGRAVED MATERIAL
// ---------------------------------------------------------------------------
const VERT = /* glsl */ `
attribute vec3 acol;
attribute vec2 auv;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vObj;
void main() {
  vCol = acol;
  vUv = auv;
  vObj = position;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;
const FRAG = /* glsl */ `
uniform vec3 uLight;
uniform vec3 uDark;
uniform vec3 uUnder;
uniform vec3 uOrange;
uniform float uMode;     // 0 plain, 1 body (bars, undertail, stain), 2 neck (furrows, threads), 3 feather (rim, shaft)
uniform float uHatch;    // hatch spacing, px
uniform vec4 uStain[4];  // body-space blob centres (xyz) and radii (w)
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vObj;
void main() {
  vec3 n = normalize(vN);
  vec3 base = vCol;
  if (!gl_FrontFacing) { n = -n; if (uMode > 2.5) base = mix(base, uUnder, 0.55); }
  float ndl = dot(n, uLight);
  float tone = ndl > 0.38 ? 1.0 : (ndl > -0.1 ? 0.8 : 0.6);
  float hx = gl_FragCoord.x + gl_FragCoord.y;
  float stain = 0.0;
  if (uMode > 0.5 && uMode < 1.5) {
    // the body: barred flanks (darker bars with pale edges) along the sides, under the folded wing
    float side = smoothstep(9.0, 12.5, abs(vObj.z)) * (1.0 - smoothstep(29.0, 33.0, vObj.y)) * smoothstep(17.0, 22.0, vObj.y) * (1.0 - smoothstep(14.0, 22.0, vObj.x));
    float b = sin(vObj.x * 0.78 + vObj.y * 0.35);
    base = mix(base, base * 0.86, side * smoothstep(0.65, 0.92, b));
    base = mix(base, mix(base, vec3(0.83, 0.77, 0.64), 0.28), side * smoothstep(-0.2, -0.05, b) * (1.0 - smoothstep(-0.05, 0.1, b)));
    for (int i = 0; i < 4; i++) {
      float d = length(vObj - uStain[i].xyz) / uStain[i].w;
      stain += exp(-d * d * 1.6);
    }
    stain = clamp(stain, 0.0, 1.0);
  }
  if (uMode > 1.5 && uMode < 2.5) {
    // the neck: lengthwise furrows; orange threads up its lower half
    float f = fract(vUv.y * 9.0);
    base = mix(base, base * 0.68, smoothstep(0.78, 0.92, f) * (1.0 - smoothstep(0.92, 1.0, f)));
    float th = (1.0 - smoothstep(0.25, 0.55, vUv.x)) * smoothstep(0.86, 0.97, fract(vUv.y * 3.0 + vUv.x * 1.4));
    stain = th * 0.9;
  }
  vec3 col = base * tone;
  if (stain > 0.01) {
    // the disease: a soft orange stain, and orange hatching across it
    vec3 o = mix(uOrange * 0.92, uOrange * 0.78, step(tone, 0.7));
    col = mix(col, o, stain * 0.62);
    float hh = fract((gl_FragCoord.x - gl_FragCoord.y) / (uHatch * 0.9));
    if (hh < 0.32) col = mix(col, uOrange, stain * 0.8);
  }
  if (tone < 0.7) {
    float h = fract(hx / uHatch);
    if (h < 0.3) col *= 0.7;
  }
  if (uMode > 2.5) {
    float a = abs(vUv.x);
    if (a > 0.84) col = uDark;                       // the feather's rim
    else if (a < 0.07 && vUv.y < 0.92) col *= 0.62;  // its shaft
  }
  gl_FragColor = vec4(col, 1.0);
}`;
const OUTLINE_VERT = /* glsl */ `
uniform float uThick;
void main() {
  vec3 p = position + normal * uThick;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uDark;
void main() { gl_FragColor = vec4(uDark, 1.0); }`;

/** the light: rays travel (0.5, 1, 0.8) in the world (right, down, away); in three (x, -y, -z), toward the light */
const LIGHT3 = new THREE.Vector3(-0.5, 1, 0.8).normalize();

const makeMat = (mode: number, side: number = THREE.FrontSide) =>
  new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    side,
    uniforms: {
      uLight: { value: LIGHT3 },
      uDark: { value: new THREE.Vector3(...DARK) },
      uUnder: { value: new THREE.Vector3(...UNDERWING) },
      uOrange: { value: new THREE.Vector3(...ORANGE) },
      uMode: { value: mode },
      uHatch: { value: 5.0 },
      uStain: { value: [new THREE.Vector4(0, 0, 0, 1), new THREE.Vector4(0, 0, 0, 1), new THREE.Vector4(0, 0, 0, 1), new THREE.Vector4(0, 0, 0, 1)] },
    },
  });
const makeOutline = (thick: number) =>
  new THREE.ShaderMaterial({ vertexShader: OUTLINE_VERT, fragmentShader: OUTLINE_FRAG, side: THREE.BackSide, uniforms: { uThick: { value: thick }, uDark: { value: new THREE.Vector3(...DARK) } } });

// ---------------------------------------------------------------------------
// GEOMETRY BUILDERS
// ---------------------------------------------------------------------------
type Geo = { pos: number[]; col: number[]; uv: number[]; idx: number[] };
const newGeo = (): Geo => ({ pos: [], col: [], uv: [], idx: [] });
const toBuffer = (g: Geo) => {
  const b = new THREE.BufferGeometry();
  b.setAttribute("position", new THREE.Float32BufferAttribute(g.pos, 3));
  b.setAttribute("acol", new THREE.Float32BufferAttribute(g.col, 3));
  b.setAttribute("auv", new THREE.Float32BufferAttribute(g.uv, 2));
  b.setIndex(g.idx);
  b.computeVertexNormals();
  return b;
};
const vtx = (g: Geo, p: V3, c: V3, uv: [number, number]) => {
  g.pos.push(p[0], p[1], p[2]);
  g.col.push(c[0], c[1], c[2]);
  g.uv.push(uv[0], uv[1]);
  return g.pos.length / 3 - 1;
};
/** a deformed sphere: f maps a unit-sphere point (and its lat/long) to a position and a colour */
const blob = (g: Geo, nu: number, nv: number, f: (u: V3, lon: number, lat: number) => { p: V3; c: V3 }) => {
  const base = g.pos.length / 3;
  for (let j = 0; j <= nv; j++) {
    const lat = -Math.PI / 2 + (j / nv) * Math.PI;
    for (let i = 0; i <= nu; i++) {
      const lon = (i / nu) * 2 * Math.PI;
      // the sphere's poles along x (fore-aft), so the long axis has no seam at the breast
      const u: V3 = [Math.sin(lat), Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon)];
      const r = f(u, lon, lat);
      vtx(g, r.p, r.c, [i / nu, j / nv]);
    }
  }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i;
      const b = a + nu + 1;
      g.idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
};
/** a tube along points with radii (rings of n), coloured by c(t, phi) */
const tube = (g: Geo, pts: V3[], radii: number[], n: number, c: (t: number, phi: number) => V3, cap = true) => {
  const base = g.pos.length / 3;
  const m = pts.length;
  let prevN: V3 = [0, 0, 1];
  for (let k = 0; k < m; k++) {
    const t = k / (m - 1);
    const tan = norm(sub(pts[Math.min(m - 1, k + 1)], pts[Math.max(0, k - 1)]));
    // a stable frame: the side axis kept close to the previous ring's
    let side = norm(cross(tan, [0, 0, 1]));
    if (k > 0) side = norm(sub(prevN, mul(tan, dot(prevN, tan))));
    else side = norm(cross([0, 1, 0], tan).map((v) => v) as V3);
    if (!isFinite(side[0])) side = [0, 0, 1];
    prevN = side;
    const up = norm(cross(side, tan));
    for (let i = 0; i <= n; i++) {
      const phi = (i / n) * 2 * Math.PI;
      const dir = add(mul(up, Math.cos(phi)), mul(side, Math.sin(phi)));
      vtx(g, add(pts[k], mul(dir, radii[k])), c(t, phi), [t, i / n]);
    }
  }
  for (let k = 0; k < m - 1; k++)
    for (let i = 0; i < n; i++) {
      const a = base + k * (n + 1) + i;
      const b = a + n + 1;
      g.idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  if (cap) {
    const tip = vtx(g, pts[m - 1], c(1, 0), [1, 0]);
    const last = base + (m - 1) * (n + 1);
    for (let i = 0; i < n; i++) g.idx.push(last + i, last + i + 1, tip);
  }
};
/** one feather: a flat vane from base along dir (length L, width W), its plane spanned by dir and `across`; the uv
 *  carries the rim / shaft lines (x: -1 rim .. 0 shaft .. 1 rim; y: 0 base .. 1 tip); `round` 0 pointed .. 1 rounded */
const feather = (g: Geo, base: V3, dir: V3, across: V3, L: number, W: number, cBase: V3, cTip: V3, round: number, lift: V3) => {
  const n = 7;
  const b0 = g.pos.length / 3;
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    // the vane's half-width along the feather: narrow at the base, full in the middle, closing at the tip
    const hw = (W / 2) * (t < 0.2 ? mix(0.45, 1, t / 0.2) : t < 0.7 ? 1 : mix(1, round * 0.55, Math.pow((t - 0.7) / 0.3, 1.4)));
    const along = add(add(base, mul(dir, L * t)), lift);
    const col = mixc(cBase, cTip, Math.pow(t, 2.2));
    const tt = t === 1 && round < 0.2 ? 0 : 1;
    vtx(g, add(along, mul(across, -hw * tt)), col, [-1, t]);
    vtx(g, along, col, [0, t]);
    vtx(g, add(along, mul(across, hw * tt)), col, [1, t]);
  }
  for (let k = 0; k < n; k++) {
    const a = b0 + k * 3;
    const b = a + 3;
    g.idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
  }
};

// ---------------------------------------------------------------------------
// THE WING: joints and feathers (right wing, z+; the left is its mirror)
// ---------------------------------------------------------------------------
const SHOULDER: V3 = [11, 36, 8];
const BONE = { hum: 14, fore: 17, hand: 11 };
// spread (in the shoulder's horizontal plane, before the raise) and folded directions
const SPREAD = { hum: norm([0.12, 0, 1]), fore: norm([-0.04, 0, 1]), hand: norm([-0.28, 0, 1]) };
const FOLD = { hum: norm([-0.84, -0.05, 0.5]), fore: norm([0.98, 0.04, -0.1]), hand: norm([-0.99, 0.02, -0.08]) };
type WingPose = { w: number; raise: number; sweep: number };

const buildWing = (g: Geo, p: WingPose, mirror: 1 | -1) => {
  const w = p.w;
  // the raise (dihedral) and a little forward sweep act on the spread part
  const raiseAxis: V3 = [1, 0, 0];
  const r = (v: V3) => rot(rot(v, raiseAxis, -p.raise * w), [0, 1, 0], p.sweep * w);
  const dh = r(nlerp(FOLD.hum, SPREAD.hum, w));
  const df = r(nlerp(FOLD.fore, SPREAD.fore, w));
  const dk = r(nlerp(FOLD.hand, SPREAD.hand, Math.pow(w, 0.8)));
  const S = SHOULDER;
  const E = add(S, mul(dh, BONE.hum));
  const Wr = add(E, mul(df, BONE.fore));
  const T = add(Wr, mul(dk, BONE.hand));
  // the wing's "up": spread it is the plane's normal (raised with it); folded it is the body's side (out)
  const upSpread = r([0, 1, 0]);
  const upFold: V3 = norm([0, 0.35, 1]);
  const up = nlerp(upFold, upSpread, w);
  const back: V3 = r([-1, 0, 0]);
  const backFold: V3 = norm([-1, -0.42, 0.05]); // folded, the flight feathers hang back and down over the flank
  const m = (v: V3): V3 => [v[0], v[1], v[2] * mirror];
  const M = (v: V3): V3 => [v[0], v[1], v[2] * mirror];
  const put = (base: V3, dir: V3, L: number, W: number, cb: V3, ct: V3, round: number, layer: number) => {
    const across = norm(cross(up, dir));
    feather(g, M(base), m(dir), m(across), L, W, cb, ct, round, m(mul(up, layer)));
  };
  // primaries: 9 along the hand, the outermost at the tip pointing out along the hand, the inner fanning back
  for (let i = 0; i < 9; i++) {
    const u = i / 8; // 0 outer .. 1 inner
    const base = add(T, mul(sub(Wr, T), u * 0.95));
    const spreadDir = norm(rot(dk, up, mix(0, 0.8, u)));
    const dir = nlerp(norm([-1, 0.04 + 0.01 * i, -0.06]), spreadDir, w);
    put(base, dir, mix(31, 23, u), mix(6.4, 7.2, u), PRIM, mixc(PRIM, BACK_D, 0.2), 0.15, 0.12 * (9 - i) + 0.05);
  }
  // secondaries: 10 along the forearm, pointing back
  for (let j = 0; j < 10; j++) {
    const u = j / 9; // 0 at the wrist .. 1 at the elbow
    const base = add(Wr, mul(sub(E, Wr), u));
    const dir = nlerp(backFold, norm(add(back, mul(df, -0.15 * (1 - u)))), w);
    put(base, dir, mix(18, 15, u), 7.4, SEC, mixc(SEC, PALE, 0.35), 0.7, 0.2 + 0.08 * j);
  }
  // tertials: 4 by the elbow, long and pale-edged, lying on the back when folded
  for (let j = 0; j < 4; j++) {
    const base = add(E, mul(sub(S, E), j / 5));
    const dir = nlerp(norm([-1, -0.05, -0.12]), norm(add(back, [0, 0, -0.3])), w);
    put(base, dir, 14 - j, 6, BACK, PALE, 0.9, 1.4 + 0.12 * j);
  }
  // primary coverts: 6 over the hand's base
  for (let i = 0; i < 6; i++) {
    const base = add(Wr, mul(sub(T, Wr), (i + 0.3) / 6.5));
    const dir = nlerp(norm([-1, 0.06, -0.02]), norm(rot(dk, up, 0.9 + 0.1 * i)), w);
    put(base, dir, 9, 4.5, BACK_D, mixc(BACK_D, PALE, 0.55), 0.8, 1.2 + 0.05 * i);
  }
  // greater coverts: a row along the forearm over the secondaries' bases
  for (let j = 0; j < 10; j++) {
    const u = (j + 0.4) / 10;
    const base = add(add(Wr, mul(sub(E, Wr), u)), mul(norm(cross(up, df)), 0));
    const dir = nlerp(norm([-1, -0.25, 0.04]), back, w);
    put(base, dir, 9.5, 6, BACK, PALE, 1, 1.6 + 0.04 * j);
  }
  // median coverts: a second row, further forward, smaller
  for (let j = 0; j < 9; j++) {
    const u = (j + 0.5) / 9.5;
    const base0 = add(Wr, mul(sub(E, Wr), u));
    const fwd = nlerp([1, 0, 0], r([1, 0, 0]), w);
    const base = add(base0, mul(fwd, 3.2));
    const dir = nlerp(norm([-1, -0.12, 0.03]), back, w);
    put(base, dir, 6.5, 5.2, mixc(BACK, FOREWING, w * 0.6), PALE, 1, 2.2 + 0.04 * j);
  }
  // the forewing (patagium and lesser coverts): a strip from the shoulder along the arm, its leading edge rounded
  const n = 8;
  const b0 = g.pos.length / 3;
  const fw = mixc(BACK, FOREWING, w);
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const onArm = t < 0.5 ? add(S, mul(sub(E, S), t * 2)) : add(E, mul(sub(Wr, E), (t - 0.5) * 2));
    const fwd = nlerp([1, 0, 0], r([1, 0, 0]), w);
    const lead = add(onArm, mul(fwd, 3.5 + 1.5 * Math.sin(Math.PI * t)));
    const trail = add(onArm, mul(fwd, -1));
    const lift = mul(up, 2.6);
    vtx(g, M(add(lead, lift)), fw, [-1, t]);
    vtx(g, M(add(onArm, lift)), fw, [0, t]);
    vtx(g, M(add(trail, lift)), fw, [-0.5, t]);
  }
  for (let k = 0; k < n; k++) {
    const a = b0 + k * 3;
    const b = a + 3;
    g.idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
  }
  return { S: M(S), E: M(E), W: M(Wr), T: M(T) };
};

// ---------------------------------------------------------------------------
// THE CAMERA: the cut's pinhole (F px per unit at unit depth, horizon at HZ by a lens shift)
// ---------------------------------------------------------------------------
const CameraRig: React.FC<{ cam: Cam3 }> = ({ cam }) => {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pc = camera as any;
  pc.fov = (2 * Math.atan(960 / F) * 180) / Math.PI;
  pc.aspect = 1080 / 1920;
  pc.near = 5;
  pc.far = 30000;
  pc.position.set(cam.X, -cam.eye, -cam.Z);
  pc.rotation.set(0, 0, 0);
  pc.setViewOffset(1080, 1920, 0, 960 - cam.HZ, 1080, 1920);
  pc.updateProjectionMatrix();
  pc.updateMatrixWorld();
  return null;
};

// ---------------------------------------------------------------------------
// THE GOOSE
// ---------------------------------------------------------------------------
const BODY_C: V3 = [-3, 28, 0];
/** standing, it sits down on its short legs (cm) */
const SIT = 4;
const bodyShape = (u: V3): V3 => {
  const [ux, uy, uz] = u;
  const ax = ux >= 0 ? 29 : 33;
  const t = c01((-ux - 0.3) / 0.7); // toward the tail
  const taper = 1 - 0.66 * Math.pow(t, 1.3);
  let y = uy * 13.5 * taper;
  const z = uz * 14.5 * taper * (1 + 0.04 * Math.max(0, ux));
  // the breast full and carried low, the belly deep, the rear lifting to the tail
  y -= 3.2 * Math.max(0, ux) * Math.max(0, ux);
  if (uy < 0) y *= 1.08 - 0.12 * t;
  y += 5 * t * t;
  return add(BODY_C, [ux * ax, y, z]);
};
const bodyColour = (u: V3): V3 => {
  const [ux, uy] = u;
  let c = FLANK;
  c = mixc(c, BACK_D, c01((uy - 0.35) / 0.4));
  c = mixc(c, BREAST, c01((ux - 0.15) / 0.4) * c01((0.45 - uy) / 0.4));
  c = mixc(c, BELLY, c01((-uy - 0.3) / 0.4) * c01((ux + 0.4) / 0.5));
  c = mixc(c, UNDERTAIL, c01((-ux - 0.55) / 0.25) * c01((0.1 - uy) / 0.4));
  return c;
};

const Bird: React.FC<{ pose: GoosePose }> = ({ pose }) => {
  const mats = useMemo(
    () => ({ body: makeMat(1), neck: makeMat(2), plain: makeMat(0), feathers: makeMat(3, THREE.DoubleSide), line: makeOutline(0.42), lineThin: makeOutline(0.3) }),
    [],
  );
  // the stain's blobs (body space): through the breast and belly, one creeping back along the flank
  mats.body.uniforms.uStain.value = [new THREE.Vector4(18, 22, 3, 9), new THREE.Vector4(8, 18, -5, 8), new THREE.Vector4(22, 30, -4, 6), new THREE.Vector4(-6, 20, 8, 6)];
  const geos = useMemo(() => {
    // ---- body (static)
    const gb = newGeo();
    blob(gb, 48, 32, (u) => ({ p: bodyShape(u), c: bodyColour(u) }));
    // the tail: a short closed fan of dark feathers with pale tips
    const gt = newGeo();
    for (let i = 0; i < 7; i++) {
      const a = ((i - 3) / 3) * 0.32;
      const base: V3 = [-28, 33.5, 0];
      const dir = norm([-Math.cos(a), 0.22, Math.sin(a)]);
      feather(gt, base, dir, norm(cross([0, 1, 0], dir)), 13, 4.4, BACK_D, PALE, 1, [0, 0.05 * i, 0]);
    }
    // scapulars and mantle: rows of broad, pale-edged feathers over the back and the top of the flank (the greylag's
    // barred upperparts); they lie on the body, over the folded wing's base
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 6; i++) {
        for (const side of [1, -1]) {
          const x = 12 - i * 6.5 - r * 2.5;
          const y = 41.5 - r * 2.2 - i * 0.25;
          const zc = side * (5 + r * 3.4);
          const dir = norm([-1, -0.3 - 0.08 * r, side * (0.18 + 0.12 * r)]);
          const across = norm(cross([0, 1, side * 0.6], dir));
          feather(gt, [x, y, zc], dir, across, 10 - r, 7.5, BACK, PALE, 1, [0, 0.3 * (3 - r) + 0.02 * i, side * 0.4 * (3 - r)]);
        }
      }
    }
    return { body: toBuffer(gb), tail: toBuffer(gt) };
  }, []);
  // ---- the neck and head (depend on reach / head turn)
  const head0: V3 = [mix(22, 62, pose.reach), mix(70, 42, pose.reach), 0];
  const ctrl: V3 = [mix(23, 45, pose.reach), mix(50, 40, pose.reach), 0];
  const base: V3 = [16, 33, 0];
  const nPts: V3[] = [];
  const nRad: number[] = [];
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    const a = add(mul(base, 1 - t), mul(ctrl, t));
    const b = add(mul(ctrl, 1 - t), mul(head0, t));
    nPts.push(add(mul(a, 1 - t), mul(b, t)));
    nRad.push(mix(7.8, 4.2, Math.pow(Math.min(1, t / 0.75), 0.75)) + 0.6 * Math.max(0, t - 0.85) / 0.15);
  }
  const gn = newGeo();
  tube(gn, nPts, nRad, 18, (t) => mixc(mixc(BREAST, NECK, c01(t / 0.25)), HEAD, c01((t - 0.8) / 0.2)), false);
  const neckGeo = toBuffer(gn);
  // the head: an ellipsoid along the head's direction, the forehead sloping into a deep wedge bill
  const hp = ((mix(-14, -2, pose.reach) + pose.headPitch) * Math.PI) / 180;
  const hy = (pose.headYaw * Math.PI) / 180;
  const hd: V3 = norm([Math.cos(hp) * Math.cos(hy), Math.sin(hp), Math.cos(hp) * Math.sin(hy)]);
  const hs: V3 = norm(cross(hd, [0, 1, 0]));
  const hu: V3 = norm(cross(hs, hd));
  const H = (f: number, u: number, s: number): V3 => add(add(add(head0, mul(hd, f)), mul(hu, u)), mul(hs, s));
  const gh = newGeo();
  blob(gh, 24, 16, (u) => {
    const [ux, uy, uz] = u;
    const f = ux * (ux > 0 ? 8.6 : 7.4) + 1.2;
    let up = uy * 5.6;
    if (ux > 0 && uy > 0) up -= 1.8 * ux * uy; // the forehead slopes into the bill
    return { p: H(f, up + 0.6, uz * 4.9), c: HEAD };
  });
  const headGeo = toBuffer(gh);
  // the bill: a deep wedge (rings from its base at the face to the tip), orange; the nail pale
  const gbill = newGeo();
  const bPts: V3[] = [];
  const bRad: number[] = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    bPts.push(H(8.2 + 12.5 * t, mix(0.2, -0.6, t * t), 0));
    bRad.push(mix(3.3, 1.0, Math.pow(t, 0.9)));
  }
  tube(gbill, bPts, bRad, 14, (t) => (t > 0.86 ? PALE : mixc(ORANGE_DEEP, ORANGE, 0.35)));
  // flatten the bill's sides (a wedge, deeper than wide)
  const bp = gbill.pos;
  for (let i = 0; i < bp.length; i += 3) {
    const p: V3 = [bp[i], bp[i + 1], bp[i + 2]];
    const rel = sub(p, head0);
    const sidec = dot(rel, hs);
    const q = add(p, mul(hs, -sidec * 0.3));
    bp[i] = q[0];
    bp[i + 1] = q[1];
    bp[i + 2] = q[2];
  }
  const billGeo = toBuffer(gbill);
  const eyes = [H(3.2, 2.0, 4.4), H(3.2, 2.0, -4.4)];
  // ---- the legs and feet (feet on the stone when it stands; tucked back in flight, thrown forward in the flare)
  const legs = ([1, -1] as const).map((side) => {
    const hip: V3 = [1, 17, 5 * side];
    const stand: V3 = [2 + pose.shift * 0.4, side === 1 ? 0 : 5 * pose.lift, 5.6 * side];
    const tuck: V3 = [-15, 22, 4 * side];
    const fwd: V3 = [13, 4, 5 * side];
    const air = add(mul(tuck, 1 - pose.legFwd), mul(fwd, pose.legFwd));
    return { hip, foot: add(mul(air, 1 - pose.leg), mul(stand, pose.leg)), side };
  });
  // ---- the wings
  const gw = newGeo();
  const wp: WingPose = { w: pose.wing, raise: (pose.raise * Math.PI) / 180, sweep: 0.18 * c01((pose.raise - 30) / 40) };
  buildWing(gw, wp, 1);
  buildWing(gw, wp, -1);
  const wingGeo = toBuffer(gw);
  const legGeo = useMemo(() => new THREE.CylinderGeometry(1.25, 1.1, 1, 10, 1, true), []);
  const toeGeo = useMemo(() => {
    const g = newGeo();
    feather(g, [0, 0, 0], [1, 0, 0], [0, 0, 1], 8.5, 7, ORANGE_DEEP, ORANGE_DEEP, 0.2, [0, 0, 0]);
    return toBuffer(g);
  }, []);
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(0.95, 10, 8), []);
  const eyeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(...DARK) }), []);
  const legMat = useMemo(() => makeMat(0), []);
  const legGeoCol = useMemo(() => {
    const g = legGeo.clone();
    const n = g.attributes.position.count;
    const col: number[] = [];
    const uv: number[] = [];
    for (let i = 0; i < n; i++) {
      col.push(...ORANGE_DEEP);
      uv.push(0, 0);
    }
    g.setAttribute("acol", new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute("auv", new THREE.Float32BufferAttribute(uv, 2));
    return g;
  }, [legGeo]);
  // the body's frame: it pitches about BODY_C, dips as it takes its weight, shifts its weight forward
  const pitchR = (pose.pitch * Math.PI) / 180;
  const bodyM = new THREE.Matrix4()
    .makeTranslation(BODY_C[0] + pose.shift, BODY_C[1] - pose.dip - SIT * pose.leg, BODY_C[2])
    .multiply(new THREE.Matrix4().makeRotationZ(pitchR))
    .multiply(new THREE.Matrix4().makeTranslation(-BODY_C[0], -BODY_C[1], -BODY_C[2]));
  const legNodes = legs.map((l, k) => {
    // the hip rides on the body; the foot blends from the body's frame (in the air) to the stone (standing)
    const hipW = new THREE.Vector3(...l.hip).applyMatrix4(bodyM);
    const airL = add(mul([-15, 22, 4 * l.side], 1 - pose.legFwd), mul([13, 4, 5 * l.side], pose.legFwd));
    const airW = new THREE.Vector3(...airL).applyMatrix4(bodyM);
    const standW = new THREE.Vector3(2 + pose.shift * 0.4, l.side === 1 ? 0 : 5 * pose.lift, 5.6 * l.side);
    const footV = airW.clone().lerp(standW, pose.leg);
    const mid = hipW.clone().add(footV).multiplyScalar(0.5);
    const dirV = footV.clone().sub(hipW);
    const L = dirV.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirV.clone().normalize());
    const toeDir = new THREE.Vector3(1, 0, 0);
    return (
      <group key={k}>
        <mesh geometry={legGeoCol} material={legMat} position={mid} quaternion={q} scale={[1, L, 1]} />
        <mesh geometry={legGeo} material={mats.lineThin} position={mid} quaternion={q} scale={[1.25, L, 1.25]} />
        {[-0.45, 0, 0.45].map((a, i) => (
          <mesh key={i} geometry={toeGeo} material={mats.feathers} position={footV} rotation={[0, -a + Math.atan2(toeDir.z, toeDir.x), 0]} />
        ))}
      </group>
    );
  });
  const bodyMat = new THREE.Matrix4().copy(bodyM);
  return (
    <group>
      {legNodes}
      <group matrix={bodyMat} matrixAutoUpdate={false}>
        <mesh geometry={geos.body} material={mats.body} />
        <mesh geometry={geos.body} material={mats.line} />
        <mesh geometry={geos.tail} material={mats.feathers} />
        <mesh geometry={neckGeo} material={mats.neck} />
        <mesh geometry={neckGeo} material={mats.line} />
        <mesh geometry={headGeo} material={mats.plain} />
        <mesh geometry={headGeo} material={mats.line} />
        <mesh geometry={billGeo} material={mats.plain} />
        <mesh geometry={billGeo} material={mats.lineThin} />
        {eyes.map((e, i) => (
          <mesh key={i} geometry={eyeGeo} material={eyeMat} position={e} />
        ))}
        <mesh geometry={wingGeo} material={mats.feathers} />
      </group>
    </group>
  );
};

/** the goose in the scene: a full-frame transparent canvas over the cut's SVG world, the same camera */
export const Goose3D: React.FC<{ cam: Cam3; pose: GoosePose }> = ({ cam, pose }) => {
  const yaw = (pose.yaw * Math.PI) / 180;
  return (
    <ThreeCanvas width={1080} height={1920} flat linear style={{ position: "absolute", left: 0, top: 0 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <CameraRig cam={cam} />
      <group position={[pose.pos[0], -pose.pos[1], -pose.pos[2]]} rotation={[0, yaw, 0]} scale={GS}>
        <Bird pose={pose} />
      </group>
    </ThreeCanvas>
  );
};
