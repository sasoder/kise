// ---------------------------------------------------------------------------
// marmot3D (V3): the tarbagan marmot (Marmota sibirica) of RodentFromCentralAsia (kyle-pandemics, cut 1) as ONE
// sculpted mesh for three.js, used by rodentSteppe3D.tsx.
//
// THE MODEL: a signed-distance sculpture (smooth unions of ellipsoids and tapered capsules), meshed once with surface
// nets (normals from the field's gradient), standing up at its burrow in the sentinel pose after the reference photo
// (clip image 04.2b, a tarbagan in Mongolia): heavy haunches sitting on the ground with the hind feet forward, a pear
// body narrowing to sloping shoulders and a thick short neck, a broad flat head with a short blunt muzzle, small round
// ears low on the sides of the head, short strong forelimbs held at the chest with the paws hanging, a short tail
// lying behind. Local units = world px (feet at y 0, +z its front), ~39 tall like the V2 marmot, so the cut's framing
// holds.
// THE RIG: a skeleton (body, neck, head, muzzle, tail) with smooth weights, so the head turns, nods and sniffs and the
// tail flicks as one skin (no seams): the old rig's motion (headAt, the sway, the breath) drives these bones.
// THE LOOK (V3: soft painted form light): wrapped light from the upper left with the cast shadow map, the shadow side
// sinking toward the air's shade, a cream rim on the edges turned up to the light, a faint bounce of the air from
// below, the air's haze by distance plus `fog`. Fur: 10 shells of strands combed down the body (alpha to coverage),
// grizzled (dark guard-hair tips on the back, pale bands on the flanks). Colouring of the tarbagan: a sandy-buff coat,
// a darker grizzled back, a buff belly, a dark brown cap from the crown down to the eyes, the eye in a dark band, a pale
// patch on the muzzle, a dark nose pad, pale cheeks and chin, darker feet, a dark tail tip. Never orange (orange is the
// disease in this clip): the warm tones stay sandy.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as THREE from "three";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type O = any;
type V3 = [number, number, number];

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
};
/** an ellipsoid's distance (the usual bound: exact on the surface, close nearby) */
const sdEll = (x: number, y: number, z: number, c: V3, r: V3) => {
  const px = (x - c[0]) / r[0];
  const py = (y - c[1]) / r[1];
  const pz = (z - c[2]) / r[2];
  const k0 = Math.hypot(px, py, pz);
  const k1 = Math.hypot(px / r[0], py / r[1], pz / r[2]);
  return k1 < 1e-9 ? -Math.min(r[0], r[1], r[2]) : (k0 * (k0 - 1)) / k1;
};
/** a capsule tapering from ra at a to rb at b */
const sdCap = (x: number, y: number, z: number, a: V3, b: V3, ra: number, rb: number) => {
  const pa = [x - a[0], y - a[1], z - a[2]];
  const ba = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const h = Math.max(0, Math.min(1, (pa[0] * ba[0] + pa[1] * ba[1] + pa[2] * ba[2]) / (ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2])));
  return Math.hypot(pa[0] - ba[0] * h, pa[1] - ba[1] * h, pa[2] - ba[2] * h) - (ra + (rb - ra) * h);
};

// ---------------------------------------------------------------------------
// THE SCULPTURE (bind pose; x across, y up, z its front)
// ---------------------------------------------------------------------------
/** the head is authored in its own coordinates round the design pivot HL, then scaled by HS, tilted up a little
 *  (it looks up and out, as in the photo) and set forward on the neck at the bind pivot HB (= the head bone) */
const HEAD_TILT = (-7 * Math.PI) / 180;
const HS = 1.15;
const HL: V3 = [0, 31.2, 1.6];
const HP: V3 = [0, 31.4, 2.7];
/** a bind-pose point -> head-design coordinates */
const toHeadLocal = (x: number, y: number, z: number): V3 => {
  const c = Math.cos(-HEAD_TILT);
  const s = Math.sin(-HEAD_TILT);
  const dy = y - HP[1];
  const dz = z - HP[2];
  return [x / HS, HL[1] + (dy * c - dz * s) / HS, HL[2] + (dy * s + dz * c) / HS];
};
/** head-design coordinates -> the bind pose */
const toBind = (p: V3): V3 => {
  const c = Math.cos(HEAD_TILT);
  const s = Math.sin(HEAD_TILT);
  const dy = (p[1] - HL[1]) * HS;
  const dz = (p[2] - HL[2]) * HS;
  return [p[0] * HS, HP[1] + dy * c - dz * s, HP[2] + dy * s + dz * c];
};
export const MARMOT_SDF = (x: number, y: number, z: number) => {
  const ax = Math.abs(x);
  // the trunk: haunches sitting on the ground, the belly sagging forward low, a narrower chest, sloping shoulders
  let d = sdEll(x, y, z, [0, 8.2, 0.0], [10.4, 8.6, 9.6]);
  d = smin(d, sdEll(x, y, z, [0, 13.6, 2.2], [9.2, 8.2, 8.8]), 4);
  d = smin(d, sdEll(x, y, z, [0, 21.6, 1.2], [6.9, 7.2, 6.6]), 4);
  d = smin(d, sdEll(x, y, z, [0, 26.6, 0.9], [5.4, 4.4, 5.1]), 3);
  // the thighs bulging low at the sides, the hind feet flat on the ground pointing forward
  d = smin(d, sdEll(ax, y, z, [6.0, 5.4, 2.2], [4.4, 4.9, 6.0]), 2.5);
  d = smin(d, sdEll(ax, y, z, [4.5, 0.9, 6.6], [1.9, 1.0, 3.7]), 1.3);
  // the neck: thick and short, carrying the head forward
  d = smin(d, sdCap(x, y, z, [0, 26.2, 0.6], [0, 31.0, 2.6], 4.5, 4.1), 2.5);
  // the head: a broad flat skull, a short blunt muzzle, full cheeks, small round ears (head-design coordinates)
  const [lx, hy, hz] = toHeadLocal(x, y, z);
  const lax = Math.abs(lx);
  // V3 r2 (less cute): a flatter, broader skull, a longer blunt muzzle
  let h = sdEll(lx, hy, hz, [0, 34.1, 2.2], [5.1, 3.15, 5.0]);
  h = smin(h, sdEll(lx, hy, hz, [0, 33.0, 7.0], [2.6, 2.25, 3.5]), 1.6);
  h = smin(h, sdEll(lax, hy, hz, [2.7, 32.6, 4.6], [2.3, 1.9, 2.6]), 1.2);
  h = smin(h, sdEll(lax, hy, hz, [4.1, 35.8, 0.5], [1.05, 1.1, 0.7]), 0.5);
  d = smin(d, h * HS, 2);
  // the forelimbs: upper arm from the shoulder (merged into it), the forearm forward to the wrist, the paw hanging;
  // forearm and paw stand clear of the belly (a plain union), so the paws read held at the chest
  const upper = sdCap(ax, y, z, [4.9, 25.8, 1.9], [5.5, 20.9, 4.9], 2.3, 1.9);
  d = smin(d, upper, 1.5);
  let fore = sdCap(ax, y, z, [5.5, 20.9, 4.9], [3.2, 20.0, 9.9], 1.75, 1.25);
  fore = smin(fore, sdEll(ax, y, z, [2.7, 19.0, 10.6], [1.3, 1.05, 1.2]), 0.7);
  d = Math.min(d, smin(fore, upper, 0.9));
  // the tail: short, lying behind on the ground
  d = smin(d, sdCap(x, y, z, [0, 3.4, -8.0], [0, 1.5, -14.6], 2.0, 1.45), 1.6);
  // standing on the ground
  return Math.max(d, -(y + 0.25));
};
/** the eyes, the nose pad, the incisors (head-design coordinates placed in the bind pose) */
export const EYES: V3[] = [toBind([4.3, 35.35, 3.6]), toBind([-4.3, 35.35, 3.6])];
export const NOSE: V3 = toBind([0, 33.55, 10.3]);
export const TEETH: V3[] = [toBind([0.2, 31.25, 9.45]), toBind([-0.2, 31.25, 9.45])];
/** the whiskers' roots on the muzzle's sides (head-design coordinates, +x side) */
const WHISKER_ROOTS: V3[] = [
  [1.75, 33.3, 9.3],
  [1.95, 32.9, 9.0],
  [2.1, 32.5, 8.7],
  [1.9, 33.6, 8.8],
  [2.15, 32.2, 8.3],
];

// ---------------------------------------------------------------------------
// SURFACE NETS
// ---------------------------------------------------------------------------
const meshSDF = (f: (x: number, y: number, z: number) => number, lo: V3, hi: V3, h: number) => {
  const nx = Math.ceil((hi[0] - lo[0]) / h) + 1;
  const ny = Math.ceil((hi[1] - lo[1]) / h) + 1;
  const nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
  const V = new Float32Array(nx * ny * nz);
  const id = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[id(i, j, k)] = f(lo[0] + i * h, lo[1] + j * h, lo[2] + k * h);
  const cid = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const vert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const pos: number[] = [];
  const C = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ];
  const E = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let neg = 0;
        for (let c = 0; c < 8; c++) {
          cv[c] = V[id(i + C[c][0], j + C[c][1], k + C[c][2])];
          if (cv[c] < 0) neg++;
        }
        if (neg === 0 || neg === 8) continue;
        let sx = 0;
        let sy = 0;
        let sz = 0;
        let n = 0;
        for (const [a, b] of E) {
          if (cv[a] < 0 === cv[b] < 0) continue;
          const t = cv[a] / (cv[a] - cv[b]);
          sx += C[a][0] + (C[b][0] - C[a][0]) * t;
          sy += C[a][1] + (C[b][1] - C[a][1]) * t;
          sz += C[a][2] + (C[b][2] - C[a][2]) * t;
          n++;
        }
        vert[cid(i, j, k)] = pos.length / 3;
        pos.push(lo[0] + (i + sx / n) * h, lo[1] + (j + sy / n) * h, lo[2] + (k + sz / n) * h);
      }
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, c, b, a, d, c);
    else idx.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const v0 = V[id(i, j, k)] < 0;
        // the x edge (i,j,k)-(i+1,j,k): the cells round it in y, z
        if (i < nx - 1 && v0 !== V[id(i + 1, j, k)] < 0) quad(vert[cid(i, j - 1, k - 1)], vert[cid(i, j, k - 1)], vert[cid(i, j, k)], vert[cid(i, j - 1, k)], v0);
        if (j < ny - 1 && v0 !== V[id(i, j + 1, k)] < 0) quad(vert[cid(i - 1, j, k - 1)], vert[cid(i - 1, j, k)], vert[cid(i, j, k)], vert[cid(i, j, k - 1)], v0);
        if (k < nz - 1 && v0 !== V[id(i, j, k + 1)] < 0) quad(vert[cid(i - 1, j - 1, k)], vert[cid(i, j - 1, k)], vert[cid(i, j, k)], vert[cid(i - 1, j, k)], v0);
      }
  // normals from the field's gradient; the winding checked against them
  const nrm: number[] = [];
  const e = h * 0.3;
  for (let v = 0; v < pos.length; v += 3) {
    const [x, y, z] = [pos[v], pos[v + 1], pos[v + 2]];
    const gx = f(x + e, y, z) - f(x - e, y, z);
    const gy = f(x, y + e, z) - f(x, y - e, z);
    const gz = f(x, y, z + e) - f(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1;
    nrm.push(gx / l, gy / l, gz / l);
  }
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const ux = pos[b] - pos[a];
    const uy = pos[b + 1] - pos[a + 1];
    const uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a];
    const vy = pos[c + 1] - pos[a + 1];
    const vz = pos[c + 2] - pos[a + 2];
    const fx = uy * vz - uz * vy;
    const fy = uz * vx - ux * vz;
    const fz = ux * vy - uy * vx;
    if (fx * nrm[a] + fy * nrm[a + 1] + fz * nrm[a + 2] < 0) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
  }
  return { pos, nrm, idx };
};

// ---------------------------------------------------------------------------
// THE SKELETON AND WEIGHTS
// ---------------------------------------------------------------------------
export const BONE_AT = { body: [0, 0, 0] as V3, neck: [0, 27.6, 1.3] as V3, head: HP, muzzle: toBind([0, 33.0, 7.2]), tail: [0, 3.4, -8.0] as V3 };
/** body 0, neck 1, head 2, muzzle 3, tail 4 */
const weightsAt = (x: number, y: number, z: number): [number[], number[]] => {
  const tail = ss(-8.2, -10.6, z) * (1 - ss(5.5, 8.5, y));
  if (tail > 0) return [[0, 4, 1, 2], [1 - tail, tail, 0, 0]];
  const upper = ss(26.6, 29.6, y);
  const head = ss(29.6, 32.6, y);
  const muz = head * ss(8.2, 10.4, z) * (1 - ss(36, 37.5, y));
  void x;
  return [
    [0, 1, 2, 3],
    [1 - upper, upper - head, head - muz, muz],
  ];
};

// ---------------------------------------------------------------------------
// SHADERS
// ---------------------------------------------------------------------------
const VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
uniform float uShell;
uniform float uFurLen;
varying vec3 vObj;
varying vec3 vObjN;
varying vec3 vNw;
varying vec3 vWorld;
void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  transformed += normal * uShell * uFurLen;
  #include <skinning_vertex>
  #include <project_vertex>
  vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
  #include <shadowmap_vertex>
  vObj = position;
  vObjN = normal;
  vNw = normalize(inverseTransformDirection(transformedNormal, viewMatrix));
  vWorld = worldPosition.xyz;
}`;
const FRAG = /* glsl */ `
#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform vec3 uLight;
uniform vec3 uCamPos;
uniform float uD;
uniform vec3 uHaze;
uniform vec3 uAirBody;
uniform vec3 uAirShade;
uniform vec3 uAirLight;
uniform vec3 uRim;
uniform float uFog;
uniform float uOpacity;
uniform float uShell;
uniform float uFurLen;
uniform float uCell;
uniform float uFurVis;
uniform vec3 uEyeL;
uniform vec3 uEyeR;
varying vec3 vObj;
varying vec3 vObjN;
varying vec3 vNw;
varying vec3 vWorld;
float sst(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float h31(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float hazeOf(vec3 w) { return uHaze.z * sst(uHaze.x, uHaze.y, distance(w, uCamPos) / uD); }
// the head tilt (as in the sculpture): head-local coordinates of a bind-pose point
vec3 headLocal(vec3 p) {
  float c = cos(${(-HEAD_TILT).toFixed(5)});
  float s = sin(${(-HEAD_TILT).toFixed(5)});
  float dy = p.y - ${HP[1].toFixed(3)};
  float dz = p.z - ${HP[2].toFixed(3)};
  return vec3(p.x / ${HS.toFixed(3)}, ${HL[1].toFixed(3)} + (dy * c - dz * s) / ${HS.toFixed(3)}, ${HL[2].toFixed(3)} + (dy * s + dz * c) / ${HS.toFixed(3)});
}
/** the tarbagan's coat at a bind-pose point: x = base colour; also returns the guard-hair darkness in w */
vec4 coat(vec3 p, vec3 n) {
  vec3 SIDE = vec3(0.50, 0.385, 0.25);
  vec3 BACK = vec3(0.27, 0.195, 0.125);
  vec3 BELLY = vec3(0.62, 0.465, 0.29);
  vec3 PALE = vec3(0.80, 0.72, 0.58);
  vec3 CAP = vec3(0.095, 0.072, 0.05);
  vec3 FEET = vec3(0.40, 0.31, 0.21);
  float headR = sst(30.4, 32.4, p.y);
  float dorsal = sst(-0.55, 0.6, dot(n, normalize(vec3(0.0, 0.25, -1.0)))) * (1.0 - headR);
  float front = sst(0.0, 0.75, n.z) * (1.0 - headR) * (1.0 - sst(25.0, 28.0, p.y)) ;
  vec3 col = mix(SIDE, BACK, dorsal);
  col = mix(col, BELLY, front * 0.85);
  float guard = max(dorsal, 0.35 * (1.0 - front));
  // the head: a dark brown cap over the crown and forehead running forward along the bridge to the nose (narrowing),
  // a dark ring round the eye, the cheeks and the lips pale buff, a pale patch round the nose pad, the ears buff
  vec3 q = headLocal(p);
  float ax = abs(q.x);
  float capW = mix(6.3, 1.4, sst(5.5, 9.6, q.z));
  float cap = sst(34.45, 34.75, q.y + 0.1 * (q.z - 3.0)) * (1.0 - sst(capW - 0.8, capW, ax)) * (1.0 - sst(9.9, 10.4, q.z));
  vec3 eyeC = vec3(${EYES[0][0].toFixed(3)}, ${EYES[0][1].toFixed(3)}, ${EYES[0][2].toFixed(3)});
  float eyeRing = 1.0 - sst(0.55, 0.95, length(vec3(abs(p.x), p.y, p.z) - eyeC));
  vec3 noseC = vec3(${NOSE[0].toFixed(3)}, ${NOSE[1].toFixed(3)}, ${NOSE[2].toFixed(3)});
  float noseP = 1.0 - sst(0.8, 1.35, length(p - noseC));
  float cheek = (1.0 - sst(33.6, 34.6, q.y)) * sst(1.2, 2.4, ax) * sst(1.0, 3.0, q.z);
  float chin = (1.0 - sst(31.6, 32.6, q.y)) * sst(4.5, 6.5, q.z);
  float ear = sst(3.3, 3.9, ax) * sst(35.1, 35.8, q.y) * (1.0 - sst(1.6, 2.6, q.z));
  vec3 hc = mix(SIDE, BACK, 0.35);
  hc = mix(hc, mix(SIDE, PALE, 0.55), cheek);
  hc = mix(hc, PALE, chin * 0.9);
  hc = mix(hc, vec3(0.58, 0.45, 0.30), ear);
  hc = mix(hc, CAP, max(cap * 0.97, eyeRing * 0.9));
  hc = mix(hc, PALE, noseP * 0.85);
  col = mix(col, hc, headR);
  guard = mix(guard, max(0.3, cap), headR);
  // the feet and the paws darker; the tail's tip dark
  float paws = sst(9.4, 10.2, p.z) * (1.0 - sst(20.4, 21.4, p.y)) * sst(16.0, 17.0, p.y);
  float hfeet = (1.0 - sst(1.6, 2.6, p.y)) * sst(4.0, 6.0, p.z);
  col = mix(col, FEET, max(paws, hfeet) * 0.8);
  float tip = sst(-12.4, -14.0, p.z) * (1.0 - sst(5.0, 7.0, p.y));
  col = mix(col, CAP, tip * 0.9);
  return vec4(col, guard);
}
/** how long the fur grows here (0..1 of FUR_LEN): bare round the eyes, short on the muzzle, the ears, the paws */
float furMask(vec3 p) {
  float headR = sst(30.4, 32.4, p.y);
  vec3 q = headLocal(p);
  vec3 eyeC = vec3(${EYES[0][0].toFixed(3)}, ${EYES[0][1].toFixed(3)}, ${EYES[0][2].toFixed(3)});
  vec3 noseC = vec3(${NOSE[0].toFixed(3)}, ${NOSE[1].toFixed(3)}, ${NOSE[2].toFixed(3)});
  float m = sst(0.6, 1.3, length(vec3(abs(p.x), p.y, p.z) - eyeC));
  m = min(m, mix(1.0, 0.25, sst(6.5, 9.0, q.z) * headR));
  m = min(m, mix(0.15, 1.0, sst(0.6, 1.5, length(p - noseC))));
  m = min(m, mix(1.0, 0.35, sst(3.4, 4.0, abs(q.x)) * sst(35.0, 35.8, q.y) * (1.0 - sst(1.8, 2.8, q.z))));
  m = min(m, mix(1.0, 0.35, sst(9.2, 10.0, p.z) * (1.0 - sst(20.6, 21.6, p.y)) * sst(15.0, 16.5, p.y)));
  m = min(m, mix(1.0, 0.4, (1.0 - sst(1.4, 2.4, p.y)) * sst(5.0, 7.0, p.z)));
  return m;
}
vec3 light(vec3 base, float ao) {
  vec3 N = normalize(vNw);
  vec3 V = normalize(uCamPos - vWorld);
  float nl = dot(N, uLight);
  float sh = getShadowMask();
  float wrap = clamp((nl + 0.2) / 1.2, 0.0, 1.0);
  float lt = wrap * mix(0.35, 1.0, sh);
  float k = sst(0.18, 0.8, lt);
  vec3 shadeC = mix(base * 0.36, uAirShade, 0.35);
  vec3 litC = base * 1.07;
  vec3 col = mix(shadeC, litC, k) * ao;
  // the cream rim on the edges turned up to the light
  float fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
  float up = clamp(dot(N, normalize(uLight + vec3(0.0, 0.8, 0.0))), 0.0, 1.0);
  col = mix(col, uRim, fr * sst(0.15, 0.75, up) * 0.7);
  // the air bounced up into the underside
  col = mix(col, mix(uAirBody, uAirLight, 0.5), fr * sst(0.0, -0.7, N.y) * 0.3);
  return mix(col, uAirBody, clamp(hazeOf(vWorld) + uFog, 0.0, 1.0));
}
`;
const FRAG_SKIN = /* glsl */ `${FRAG}
void main() {
  vec4 c = coat(vObj, normalize(vObjN));
  // the underfur: the coat a step darker (the fur's depth), the bare skin round the eyes and the nose its own colour
  gl_FragColor = vec4(light(c.rgb * 0.74, 1.0), uOpacity);
}`;
const FRAG_SHELL = /* glsl */ `${FRAG}
void main() {
  vec3 n = normalize(vObjN);
  float h = uShell;
  // the fur lies down the body and back over the head
  float headR = sst(30.4, 32.4, vObj.y);
  vec3 comb = normalize(mix(vec3(0.0, -1.0, -0.25), vec3(0.0, -0.35, -1.0), headR));
  comb = normalize(comb - dot(comb, n) * n + 1e-4);
  vec3 bp = (vObj - comb * h * uFurLen * 1.4) / uCell;
  vec3 c = floor(bp);
  vec3 sp = c + 0.2 + 0.6 * vec3(h31(c), h31(c + 7.13), h31(c + 3.31));
  vec3 d = bp - sp;
  d -= dot(d, n) * n;
  float r = length(d);
  float len = (0.45 + 0.55 * h31(c + 1.93)) * furMask(vObj);
  if (h > len) discard;
  float rad = 0.36 * (1.0 - 0.85 * h / len);
  float fw = max(fwidth(r), 1e-4);
  float cov = (1.0 - sst(rad - fw, rad + fw, r)) * uFurVis;
  if (cov < 0.02) discard;
  vec4 co = coat(vObj, n);
  // grizzle: the strand's own shade; on the back dark guard-hair tips, elsewhere pale bands
  float sv = h31(c + 5.71);
  vec3 col = co.rgb * mix(0.74, 1.16, sv);
  float tipT = sst(0.5, 0.85, h / len);
  // guard hairs: dark tips; agouti bands: a pale ring under the tip
  col = mix(col, vec3(0.13, 0.10, 0.07), co.a * tipT * step(0.4, sv) * 0.9);
  float band = sst(0.35, 0.5, h / len) * (1.0 - sst(0.62, 0.75, h / len));
  col = mix(col, col * 1.3 + 0.05, band * step(0.55, sv) * 0.55);
  gl_FragColor = vec4(light(col, mix(0.72, 1.0, h)), cov * uOpacity);
}`;
const FRAG_FLAT = /* glsl */ `${FRAG}
uniform vec3 uCol;
uniform float uGloss;
void main() {
  vec3 col = light(uCol, 1.0);
  // a wet sheen (the eyes, the nose): a soft highlight toward the light, no hard dot
  vec3 N = normalize(vNw);
  vec3 V = normalize(uCamPos - vWorld);
  float sp = pow(clamp(dot(N, normalize(uLight + V)), 0.0, 1.0), 18.0);
  col = mix(col, uRim, sp * uGloss);
  gl_FragColor = vec4(col, uOpacity);
}`;
const OUT_VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
uniform float uPx;
uniform float uF;
void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
  vec3 n = normalize(normalMatrix * objectNormal);
  mv.xyz += n * uPx * (-mv.z) / uF;
  gl_Position = projectionMatrix * mv;
}`;
const OUT_FRAG = /* glsl */ `uniform vec3 uCol; uniform float uOpacity; void main() { gl_FragColor = vec4(uCol, uOpacity); }`;

// ---------------------------------------------------------------------------
// BUILD
// ---------------------------------------------------------------------------
export type MarmotRig = {
  root: O;
  bones: { body: O; neck: O; head: O; muzzle: O; tail: O };
  eyes: O[];
  /** every material with the common lighting uniforms */
  materials: O[];
  shells: O[];
  outline: O;
  meshes: O[];
  whiskers: O;
};
export const SHELLS = 10;
export const FUR_LEN = 0.85;
export const buildMarmot3D = (opts: { light: O; haze: [number, number, number]; F: number }): MarmotRig => {
  const { pos, nrm, idx } = meshSDF(MARMOT_SDF, [-14, -0.6, -17.5], [14, 41, 13.5], 0.3);
  const skinI: number[] = [];
  const skinW: number[] = [];
  for (let v = 0; v < pos.length; v += 3) {
    const [i, w] = weightsAt(pos[v], pos[v + 1], pos[v + 2]);
    skinI.push(...i);
    skinW.push(...w);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinI, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinW, 4));
  geo.setIndex(idx);
  geo.computeBoundingSphere();

  const root = new THREE.Group();
  const mk = (at: V3, parent: O, rel: V3 | null) => {
    const b = new THREE.Bone();
    const r = rel ?? [0, 0, 0];
    b.position.set(at[0] - r[0], at[1] - r[1], at[2] - r[2]);
    if (parent) parent.add(b);
    return b;
  };
  const body = mk(BONE_AT.body, null, null);
  const neck = mk(BONE_AT.neck, body, BONE_AT.body);
  const head = mk(BONE_AT.head, neck, BONE_AT.neck);
  const muzzle = mk(BONE_AT.muzzle, head, BONE_AT.head);
  const tail = mk(BONE_AT.tail, body, BONE_AT.body);
  root.add(body);
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([body, neck, head, muzzle, tail]);

  const common = () => ({
    uLight: { value: opts.light.clone() },
    uCamPos: { value: new THREE.Vector3() },
    uD: { value: 100 },
    uHaze: { value: new THREE.Vector3(...opts.haze) },
    uAirBody: { value: new THREE.Color("#3F3428") },
    uAirShade: { value: new THREE.Color("#17120D") },
    uAirLight: { value: new THREE.Color("#6A5838") },
    uRim: { value: new THREE.Color("#E9DDBF") },
    uFog: { value: 0 },
    uOpacity: { value: 1 },
    uShell: { value: 0 },
    uFurLen: { value: FUR_LEN },
    uCell: { value: 0.2 },
    uFurVis: { value: 1 },
  });
  const materials: O[] = [];
  const meshes: O[] = [];
  const skinned = (mat: O, cast: boolean) => {
    const m = new THREE.SkinnedMesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = true;
    m.frustumCulled = false;
    root.add(m);
    m.bind(skeleton);
    meshes.push(m);
    return m;
  };
  const skinMat = new THREE.ShaderMaterial({ lights: true, transparent: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, common()]), vertexShader: VERT, fragmentShader: FRAG_SKIN });
  materials.push(skinMat);
  skinned(skinMat, true);
  const shells: O[] = [];
  for (let i = 1; i <= SHELLS; i++) {
    const m = new THREE.ShaderMaterial({ lights: true, transparent: false, alphaToCoverage: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, common()]), vertexShader: VERT, fragmentShader: FRAG_SHELL });
    m.uniforms.uShell.value = i / SHELLS;
    m.extensions = { derivatives: true };
    materials.push(m);
    shells.push(m);
    skinned(m, false);
  }
  // the outline: back faces pushed out (the dark of the deep fur at the silhouette, in the coat's own dark)
  const outline = new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, uniforms: { uPx: { value: 1.6 }, uF: { value: opts.F }, uCol: { value: new THREE.Color("#2A2016") }, uOpacity: { value: 1 } }, vertexShader: OUT_VERT, fragmentShader: OUT_FRAG });
  skinned(outline, false);

  // the eyes, the nose pad, the teeth, the claws: small rigid parts on their bones
  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const flat = (col: string, gloss: number) => {
    const m = new THREE.ShaderMaterial({
      lights: true,
      transparent: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, common(), { uCol: { value: new THREE.Color(col) }, uGloss: { value: gloss } }]),
      vertexShader: VERT,
      fragmentShader: FRAG_FLAT,
    });
    materials.push(m);
    return m;
  };
  const part = (bone: O, boneAt: V3, at: V3, scale: V3, mat: O, rot: V3 = [0, 0, 0]) => {
    const m = new THREE.Mesh(sphere, mat);
    m.position.set(at[0] - boneAt[0], at[1] - boneAt[1], at[2] - boneAt[2]);
    m.scale.set(...scale);
    m.rotation.set(...rot);
    m.castShadow = false;
    m.receiveShadow = true;
    bone.add(m);
    return m;
  };
  const eyeMat = flat("#100C08", 0.55);
  const eyes = EYES.map((p) => part(head, BONE_AT.head, p, [0.47, 0.42, 0.47], eyeMat, [0, 0, 0]));
  part(muzzle, BONE_AT.muzzle, NOSE, [0.62, 0.4, 0.36], flat("#2A2019", 0.3));
  const tooth = flat("#E6DCC2", 0.2);
  TEETH.forEach((p) => part(muzzle, BONE_AT.muzzle, p, [0.12, 0.25, 0.1], tooth));
  const claw = flat("#1E1610", 0.2);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) part(body, BONE_AT.body, [s * (2.15 + k * 0.38), 18.05, 11.5], [0.13, 0.5, 0.15], claw, [0.6, 0, 0]);
    for (let k = 0; k < 4; k++) part(body, BONE_AT.body, [s * (3.8 + k * 0.5), 0.35, 10.15], [0.17, 0.17, 0.4], claw);
  }
  // the whiskers: fine pale hairs fanning out and back from the muzzle's sides (on the muzzle bone)
  const wpos: number[] = [];
  for (const sd of [-1, 1])
    WHISKER_ROOTS.forEach((r0, i) => {
      const len = 4.2 + 1.2 * ((i * 0.618) % 1);
      const drop = -0.25 - 0.3 * (i % 3);
      let prev = toBind([sd * r0[0], r0[1], r0[2]]);
      for (let k = 1; k <= 4; k++) {
        const t = k / 4;
        const q = toBind([sd * (r0[0] + len * t), r0[1] + drop * t * t * 2 + 0.25 * t, r0[2] - len * 0.55 * t]);
        wpos.push(prev[0] - BONE_AT.muzzle[0], prev[1] - BONE_AT.muzzle[1], prev[2] - BONE_AT.muzzle[2], q[0] - BONE_AT.muzzle[0], q[1] - BONE_AT.muzzle[1], q[2] - BONE_AT.muzzle[2]);
        prev = q;
      }
    });
  const wg = new THREE.BufferGeometry();
  wg.setAttribute("position", new THREE.Float32BufferAttribute(wpos, 3));
  const whiskerMat = new THREE.LineBasicMaterial({ color: new THREE.Color("#D9CDB4"), transparent: true, opacity: 0.6 });
  const whiskers = new THREE.LineSegments(wg, whiskerMat);
  muzzle.add(whiskers);
  return { root, bones: { body, neck, head, muzzle, tail }, eyes, materials, shells, outline, meshes, whiskers: whiskerMat };
};
