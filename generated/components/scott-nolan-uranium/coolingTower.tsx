// ---------------------------------------------------------------------------
// coolingTower: the amber hyperboloid cooling tower and its steam plume at the centre of IncrediblyComplicated (take 2).
//
// TOWER. A natural-draught cooling tower in real proportions: a hyperboloid shell (base radius 0.40 H, waist 0.25 H about two
// thirds up, rim 0.29 H), a rounded lip at the rim, and the open base: the shell stands on a ring of short diagonal columns in
// crossed pairs. The amber clay of nuclearWorld's "amberFuel" (same three tokens and hot top), shaded a little deeper on the
// side away from the key so the waist reads, and darker inside so the mouth reads open; the one glow; one soft shadow.
// PLUME. Soft cream volume: overlapping camera-facing puffs with a lit-sphere shading under the one key light, emitted
// continuously from inside the mouth (the plume is in steady state before f0), rising, swelling, leaning a little and thinning
// out as it climbs. Nothing pops: a puff condenses inside the mouth and thins away at the top. Drawn after every opaque object,
// depth-tested, sorted back to front each frame, and it never writes the canvas alpha.
// World units as in nuclearWorld; the tower stands at the origin.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, SHADOW_LEN, SoftShadows, withClayAttrs, type V3 } from "./nuclearWorld";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const hex = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

// ===================================================================================================================
// THE TOWER
// ===================================================================================================================
export const TOWER_H = 28;
const LEG_H = 0.095 * TOWER_H; // the open base: the shell starts on top of the columns
const SHELL = 0.022 * TOWER_H; // wall thickness
const WAIST_Y = 0.68 * TOWER_H;
const WAIST_R = 0.25 * TOWER_H;
const C = 0.544 * TOWER_H; // hyperboloid: r(y) = WAIST_R * sqrt(1 + ((y - WAIST_Y) / C)^2), so r(0) = 0.40 H and r(H) = 0.29 H
export const towerRadiusAt = (y: number) => WAIST_R * Math.sqrt(1 + ((y - WAIST_Y) / C) ** 2);
export const TOWER = { H: TOWER_H, base: towerRadiusAt(0), waist: WAIST_R, rim: towerRadiusAt(TOWER_H), legH: LEG_H } as const;

const towerGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    // one closed lathe: up the outside, over the rounded lip, down the inside, round the bottom edge
    const pts: [number, number][] = [];
    const n = 44;
    const lipR = SHELL * 0.95;
    for (let i = 0; i <= n; i++) {
      const y = LEG_H + ((TOWER_H - lipR - LEG_H) * i) / n;
      pts.push([towerRadiusAt(y) + SHELL / 2, y]);
    }
    const yl = TOWER_H - lipR;
    const rc = towerRadiusAt(yl);
    for (let i = 1; i < 12; i++) {
      const a = (Math.PI * i) / 12;
      pts.push([rc + Math.cos(a) * (SHELL / 2 + 0.25 * lipR * Math.sin(a)) + 0.18 * lipR * Math.sin(a), yl + Math.sin(a) * lipR * 1.05]);
    }
    for (let i = n; i >= 0; i--) {
      const y = LEG_H + ((TOWER_H - lipR - LEG_H) * i) / n;
      pts.push([towerRadiusAt(y) - SHELL / 2, y]);
    }
    for (let i = 1; i < 6; i++) {
      const a = Math.PI + (Math.PI * i) / 6;
      pts.push([towerRadiusAt(LEG_H) + Math.cos(a) * (SHELL / 2), LEG_H + Math.sin(a) * SHELL * 0.5]);
    }
    pts.push([towerRadiusAt(LEG_H) + SHELL / 2, LEG_H]);
    g = withClayAttrs(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 112));
    return g;
  };
})();
/** the base columns: crossed pairs of short diagonals round the foot of the shell */
const LEG_PAIRS = 16;
const legsGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const parts: Any[] = [];
    const r0 = towerRadiusAt(LEG_H) + SHELL * 0.1;
    const legR = Math.max(0.42, SHELL * 0.6);
    for (let i = 0; i < LEG_PAIRS * 2; i++) {
      const lean = i % 2 ? 1 : -1;
      const a0 = (Math.PI * 2 * Math.floor(i / 2)) / LEG_PAIRS;
      const da = (Math.PI * 2) / LEG_PAIRS / 2;
      const foot = new THREE.Vector3(Math.cos(a0 - lean * da * 0.5) * r0 * 1.015, 0, Math.sin(a0 - lean * da * 0.5) * r0 * 1.015);
      const head = new THREE.Vector3(Math.cos(a0 + lean * da * 0.5) * r0, LEG_H + SHELL * 0.3, Math.sin(a0 + lean * da * 0.5) * r0);
      const len = foot.distanceTo(head);
      const c = new THREE.CylinderGeometry(legR, legR, len, 8, 1, false);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), head.clone().sub(foot).normalize());
      const m = new THREE.Matrix4().compose(foot.clone().add(head).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
      c.applyMatrix4(m);
      parts.push(c.toNonIndexed());
    }
    let count = 0;
    for (const p of parts) count += p.attributes.position.count;
    const pos = new Float32Array(count * 3);
    const nor = new Float32Array(count * 3);
    let o = 0;
    for (const p of parts) {
      pos.set(p.attributes.position.array, o * 3);
      nor.set(p.attributes.normal.array, o * 3);
      o += p.attributes.position.count;
    }
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    withClayAttrs(g);
    return g;
  };
})();

const TOWER_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uTop;
uniform vec3 uFoot;
uniform vec3 uHot;
uniform vec3 uDeep;
uniform vec2 uBand;
uniform vec3 uHyp; // waist radius, waist height, C: the shell's centre line
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  // the inner wall: nearer the axis than the shell's centre line (the legs and the outside are not)
  float dy = (vW.y - uHyp.y) / uHyp.z;
  bool inside = length(vW.xz) < uHyp.x * sqrt(1.0 + dy * dy) && vW.y > 1.0;
  // curvature: the key from the upper left wraps round the shell, lit on the left, falling off to a deeper amber on the right
  vec3 Lh = normalize(vec3(uL.x, 0.0, uL.z));
  vec2 nh = normalize(n.xz + vec2(1e-5));
  float side = dot(nh, Lh.xz);
  float lit = 0.72 * smoothstep(-0.75, 0.8, side) + 0.28 * smoothstep(-0.4, 0.9, dot(n, uL));
  vec3 col = mix(uDeep, uTop, lit);
  // a soft broad highlight down the lit side, and the hot top edge on upward faces
  col = mix(col, uHot, 0.42 * smoothstep(0.55, 0.98, side) * (1.0 - abs(n.y)));
  col = mix(col, uHot, 0.5 * pow(max(n.y, 0.0), 6.0));
  // the shade band under the rim lip
  col *= 1.0 - 0.16 * smoothstep(uBand.x, uBand.x + 1.6, vW.y) * (1.0 - smoothstep(uBand.y - 0.8, uBand.y, vW.y)) * (inside ? 0.0 : 1.0);
  // inside: the open mouth reads hollow, darkest low down
  if (inside) col = mix(uDeep * 0.5, uDeep * 0.85, smoothstep(uBand.y - 9.0, uBand.y + 1.0, vW.y));
  gl_FragColor = vec4(col, 1.0);
}`;
const TOWER_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
let towerMat: Any = null;
const towerMaterial = () => {
  if (!towerMat) {
    towerMat = new THREE.ShaderMaterial({
      vertexShader: TOWER_VERT,
      fragmentShader: TOWER_FRAG,
      side: THREE.DoubleSide,
      uniforms: {
        uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
        uTop: { value: hex(COLOR.amberTop) },
        uHot: { value: hex(COLOR.amberHot) },
        // the shade side: amberFoot taken a step deeper, still amber (no brown)
        uDeep: { value: hex(COLOR.amberFoot).multiplyScalar(0.86) },
        uBand: { value: new THREE.Vector2(TOWER_H * 0.82, TOWER_H - SHELL * 0.95) },
        uHyp: { value: new THREE.Vector3(WAIST_R, WAIST_Y, C) },
      },
    });
  }
  return towerMat;
};
export const CoolingTower: React.FC<{ shadow?: number }> = ({ shadow = 1 }) => {
  const o = useMemo(() => {
    const mat = towerMaterial();
    const shell = new THREE.Mesh(towerGeo(), mat);
    const legs = new THREE.Mesh(legsGeo(), mat);
    for (const m of [shell, legs]) {
      m.frustumCulled = false;
      m.renderOrder = 2;
    }
    const grp = new THREE.Group();
    grp.add(shell);
    grp.add(legs);
    return grp;
  }, []);
  return (
    <>
      {shadow > 0 ? <SoftShadows items={[{ x: 0, z: 0, len: TOWER_H * SHADOW_LEN * 0.9, r: TOWER.base * 0.92, soft: TOWER.base * 0.35, alpha: shadow }]} /> : null}
      <primitive object={o} />
    </>
  );
};

// ===================================================================================================================
// THE PLUME
// ===================================================================================================================
const PUFFS = 64;
const LIFE = 84; // frames a puff lives
const PERIOD = LIFE / PUFFS;
const RISE = 1.9 * TOWER_H; // how far a puff climbs above the rim over its life: a column about twice the tower
const LEAN: [number, number] = [-0.5, -0.06]; // drift at the top, per unit of rise (x, z): straight up out of the mouth, then up and left
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};
export type Puff = { p: V3; r: number; a: number };
/** the plume at story time S (continuous: every puff's state is a function of S alone) */
export const plumeAt = (S: number): Puff[] => {
  const out: Puff[] = [];
  const rim = TOWER.rim;
  const k0 = Math.floor((S - LIFE) / PERIOD);
  for (let k = k0; k <= k0 + PUFFS + 1; k++) {
    const age = S - k * PERIOD;
    if (age < 0 || age > LIFE) continue;
    const u = age / LIFE;
    // born just inside the mouth; rises quickly at first and slows as it cools
    const rise = RISE * (1 - Math.pow(1 - u, 1.55)) - 0.12 * TOWER_H;
    const v = Math.max(0, rise) / RISE;
    const jx = (hash(k) - 0.5) * rim * 0.5;
    const jz = (hash(k + 50) - 0.5) * rim * 0.5;
    // billow: each puff turns slowly round the column's axis and breathes a little as it climbs
    const curl = (0.15 + 0.55 * v) * rim;
    const ph = hash(k + 9) * 6.28 + u * 3.1;
    const lean = RISE * v * v;
    out.push({
      p: [jx + LEAN[0] * lean + Math.cos(ph) * curl, TOWER_H + rise, jz + LEAN[1] * lean + Math.sin(ph) * curl * 0.6],
      r: rim * (0.52 + 1.25 * v + 0.1 * hash(k + 3)) * (1 + 0.08 * Math.sin(u * 8 + hash(k + 4) * 6.28)),
      // condenses inside the mouth, thins away at the top
      a: smooth(0, 0.1, u) * (1 - smooth(0.55, 1, u)) * (0.6 + 0.16 * hash(k + 7)),
    });
  }
  return out;
};
const toLight = new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]);
const PLUME_VERT = /* glsl */ `
attribute vec3 aPos;
attribute vec2 aRA;
varying vec2 vQ;
varying float vA;
void main() {
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 w = aPos + (right * position.x + up * position.y) * aRA.x;
  vQ = position.xy;
  vA = aRA.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const PLUME_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uLit;
uniform vec3 uShade;
varying vec2 vQ;
varying float vA;
void main() {
  float d = length(vQ);
  if (d > 1.0) discard;
  // a soft lit sphere: brighter toward the key, warm shade away from it, feathered edge
  vec3 n = vec3(vQ, sqrt(max(0.0, 1.0 - d * d)));
  vec3 L = normalize((viewMatrix * vec4(uL, 0.0)).xyz);
  float lit = smoothstep(-0.42, 0.86, dot(n, L));
  vec3 col = mix(uShade, uLit, lit);
  float a = vA * (1.0 - smoothstep(0.3, 1.0, d)) * 0.9;
  gl_FragColor = vec4(col, a);
}`;
export const SteamPlume: React.FC<{ S: number }> = ({ S }) => {
  const o = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const P = new THREE.InstancedBufferAttribute(new Float32Array((PUFFS + 4) * 3), 3);
    const RA = new THREE.InstancedBufferAttribute(new Float32Array((PUFFS + 4) * 2), 2);
    g.setAttribute("aPos", P);
    g.setAttribute("aRA", RA);
    const m = new THREE.ShaderMaterial({
      vertexShader: PLUME_VERT,
      fragmentShader: PLUME_FRAG,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: { uL: { value: toLight }, uLit: { value: hex(COLOR.cream) }, uShade: { value: hex("#D2C2AA") } },
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 8;
    return { mesh, g, P, RA };
  }, []);
  return <PlumeBody o={o} S={S} />;
};
const PlumeBody: React.FC<{ o: Any; S: number }> = ({ o, S }) => {
  const puffs = plumeAt(S);
  // back to front along the camera's view: the eye is above and in front, so higher and nearer puffs draw last
  puffs.sort((a, b) => a.p[1] - b.p[1] || b.p[2] - a.p[2]);
  puffs.forEach((q, i) => {
    o.P.setXYZ(i, q.p[0], q.p[1], -q.p[2]);
    o.RA.setXY(i, q.r, q.a);
  });
  o.g.instanceCount = puffs.length;
  o.P.needsUpdate = true;
  o.RA.needsUpdate = true;
  return <primitive object={o.mesh} />;
};

/** world points on the tower's outline and the plume's envelope, for the clearance check */
export const towerOutlinePoints = (): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i <= 16; i++) {
    const y = (TOWER_H * i) / 16;
    const r = towerRadiusAt(Math.max(y, LEG_H)) + SHELL;
    for (let j = 0; j < 24; j++) {
      const a = (Math.PI * 2 * j) / 24;
      out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
  }
  return out;
};
