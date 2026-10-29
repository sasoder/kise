// ===================================================================================================================
// tenXWorld — the output yard of cut 7, TenXEveryYear (sam-gigawatt-cost). Own file of cut 7. Everything here goes
// inside <AirStage world> (ground={null}) after cut 6's world (DesertGround, CostApron, GigawattCampus, HallsAlight,
// CampusWarmth, GoldColumn), and is pure per frame (AirStage mounts `world` twice).
//
//   <ApronReach>        cut 6's apron carried forward past its near edge (z -705) to REACH's near edge, in the same
//                       concrete (CostApron's slab formula, copied, so the joints run on without a seam); it paints
//                       over the old lit lip and draws its own at the new edge.
//   <YardGround units>  on the concrete: the MOUTH (an open ramp trench along the campus's front edge, the units come
//                       up out of it), each unit's contact shadow and the union of their cast shadows (exact swept
//                       boxes under LIGHT.side, soft penumbra), in one decal.
//   <WorkUnits units>   the hundred cream cubes (instanced), lit by the stage's one key light; anything still below
//                       the apron (coming up the ramp) is not drawn.
//
// Render order (all in three's transparent pass): CostApron -2.5 < ApronReach -2.45 < YardGround -2.4 < campus pad -2
// < halls 0 < HallsAlight 0.5 < GoldColumn 1 = WorkUnits 1 < CampusWarmth 5.
// ===================================================================================================================
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { SKY } from "../kits/cheeky-pint/droneSeaShared";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, LIGHT } from "../scott-aircraft-order/aircraftShared";
import { CAMPUS_FOG } from "./campusWorld";
import { MOUTH, REACH, UNIT, type UnitState } from "./tenXPlan";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const v3 = (h: string) => new THREE.Vector3(...hex3(h));
const N_UNITS = 100;

const COMMON_GLSL = /* glsl */ `
uniform vec4 uCFog;   // near, vis, max
uniform vec3 uHazeLo;
uniform vec3 uHazeHi;
float cFogAt(vec3 w) {
  float d = length(w - cameraPosition);
  return uCFog.z * (1.0 - exp(-max(0.0, d - uCFog.x) / uCFog.y));
}
vec3 cFogCol(vec3 w) { return mix(uHazeLo, uHazeHi, smoothstep(0.0, 320.0, w.y)); }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
  return s;
}
float band(float x, float lo, float hi, float pw) {
  float a = clamp(x - pw * 0.5, lo, hi);
  float b = clamp(x + pw * 0.5, lo, hi);
  return (b - a) / max(pw, 1e-4);
}
float sdBox2(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
`;
const PLANE_VERT = /* glsl */ `
${COMMON_GLSL}
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const fogUniforms = () => ({
  uCFog: { value: new THREE.Vector4(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max, 0) },
  uHazeLo: { value: v3(SKY.haze) },
  uHazeHi: { value: v3(SKY.glow) },
});
/** a flat plane over world rect [x0, z0, x1, z1] at y 0 (three-local z flipped) */
const planeOver = (r: readonly [number, number, number, number], pad = 2) => {
  const [x0, z0, x1, z1] = r;
  const geo = new THREE.PlaneGeometry(x1 - x0 + pad * 2, z1 - z0 + pad * 2);
  geo.rotateX(-Math.PI / 2);
  geo.translate((x0 + x1) / 2, 0, -(z0 + z1) / 2);
  return geo;
};

// ===================================================================================================================
// THE APRON'S REACH (CostApron's concrete, copied: the same 7.5 m slabs, tones, stains and joints)
// ===================================================================================================================
const REACH_FRAG = /* glsl */ `
uniform vec4 uRect;       // x0, z0, x1, z1 (world X, Z)
uniform vec3 uConc;
uniform vec3 uConcLo;
uniform vec3 uJoint;
uniform vec3 uEdge;
${COMMON_GLSL}
varying vec3 vW;
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  vec2 fw = fwidth(p);
  float pw = max(max(fw.x, fw.y), 0.02);
  vec2 ac = (uRect.xy + uRect.zw) * 0.5;
  vec2 ah = (uRect.zw - uRect.xy) * 0.5;
  float sdA = sdBox2(p - ac, ah);
  float a = 1.0 - smoothstep(-pw * 0.5, pw * 0.5, sdA);
  if (a <= 0.001) discard;
  vec2 cell = floor(p / 7.5);
  float slab = h2(cell + 11.3);
  vec3 col = mix(uConcLo, uConc, 0.55 + 0.45 * slab);
  col *= 0.95 + 0.07 * fbm(p * 0.35);
  col = mix(col, uConcLo * 0.9, smoothstep(0.62, 0.8, fbm(p * 0.018 + 7.0)) * 0.28);
  vec2 g = abs(fract(p / 7.5 + 0.5) - 0.5) * 7.5;
  float line = (1.0 - smoothstep(0.07, 0.07 + pw * 1.2, min(g.x, g.y))) * 0.3 * (1.0 - smoothstep(0.08, 0.45, pw));
  col = mix(col, uJoint, line * 0.75);
  // the new near edge: the slab's lit lip
  float lip = band(p.y - uRect.y, 0.0, 1.4, fw.y);
  col = mix(col, uEdge, lip * 0.7);
  float f = cFogAt(vW);
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), a);
}`;
/** ApronReach — the apron carried forward to REACH's near edge (paints over cut 6's lip at z -705) */
export const ApronReach: React.FC<{ fog?: number }> = ({ fog = 1 }) => {
  useThree();
  const o = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: PLANE_VERT,
      fragmentShader: REACH_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        ...fogUniforms(),
        uRect: { value: new THREE.Vector4(...REACH) },
        uConc: { value: v3(AIR_COLOR.concrete) },
        uConcLo: { value: v3(AIR_COLOR.concreteLo) },
        uJoint: { value: v3(AIR_COLOR.joint) },
        uEdge: { value: v3(COLOR.cream) },
      },
    });
    const mesh = new THREE.Mesh(planeOver(REACH), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -2.45;
    return { mesh, mat };
  }, []);
  o.mat.uniforms.uCFog.value.set(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max * fog, 0);
  return <primitive object={o.mesh} />;
};

// ===================================================================================================================
// THE YARD'S GROUND: the mouth, the contact shadows and the union cast shadow of the units
// ===================================================================================================================
const YARD_RECT = [MOUTH[0] - 70, UNIT.ze - 9 * UNIT.P - UNIT.H / 2 - 40, MOUTH[2] + 70, -200] as const;
const YARD_FRAG = /* glsl */ `
uniform vec4 uMouth;      // x0, z0, x1, z1 (world X, Z)
uniform vec4 uRect;
uniform vec4 uU[${N_UNITS}];  // centre X, Z, visible height (m), 0
uniform float uHalf;      // half the cube's edge
uniform float uH;         // the cube's edge
uniform vec3 uLw;         // toward the light (world)
uniform vec3 uConc;
uniform vec3 uConcLo;
uniform vec3 uShadow;
uniform vec3 uEdge;
${COMMON_GLSL}
varying vec3 vW;
void edgeS(vec2 p, vec2 a, vec2 b, inout float d, inout float s) {
  vec2 e = a - b;
  vec2 w = p - b;
  vec2 q = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
  d = min(d, dot(q, q));
  bvec3 c = bvec3(p.y >= b.y, p.y < a.y, e.x * w.y > e.y * w.x);
  if (all(c) || all(not(c))) s *= -1.0;
}
// exact signed distance to an axis-aligned box (half size b) swept along v (v.x, v.y >= 0): its shadow on the ground
float sdSwept(vec2 q, vec2 b, vec2 v) {
  v = max(v, vec2(0.01));
  vec2 p0 = vec2(-b.x, -b.y);
  vec2 p1 = vec2(b.x, -b.y);
  vec2 p2 = vec2(b.x + v.x, -b.y + v.y);
  vec2 p3 = vec2(b.x + v.x, b.y + v.y);
  vec2 p4 = vec2(-b.x + v.x, b.y + v.y);
  vec2 p5 = vec2(-b.x, b.y);
  float d = dot(q - p0, q - p0);
  float s = 1.0;
  edgeS(q, p5, p0, d, s);
  edgeS(q, p0, p1, d, s);
  edgeS(q, p1, p2, d, s);
  edgeS(q, p2, p3, d, s);
  edgeS(q, p3, p4, d, s);
  edgeS(q, p4, p5, d, s);
  return s * sqrt(d);
}
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  vec2 fw = fwidth(p);
  float pw = max(max(fw.x, fw.y), 0.02);
  vec2 rc = (uRect.xy + uRect.zw) * 0.5;
  vec2 rh = (uRect.zw - uRect.xy) * 0.5;
  if (sdBox2(p - rc, rh) > 0.0) discard;

  // --- the mouth: a ramp trench running down toward the campus; we look down onto its shallow near end and into
  // its deep far end, whose inner wall faces us and catches a little of the low sun ---
  vec2 mc = (uMouth.xy + uMouth.zw) * 0.5;
  vec2 mh = (uMouth.zw - uMouth.xy) * 0.5;
  float sdM = sdBox2(p - mc, mh);
  float inM = 1.0 - smoothstep(-pw * 0.5, pw * 0.5, sdM);
  float along = clamp((p.y - uMouth.y) / (uMouth.w - uMouth.y), 0.0, 1.0);   // 0 near lip .. 1 far wall
  vec3 ramp = mix(mix(uConcLo, uShadow, 0.42), uShadow * 0.9, smoothstep(0.05, 0.75, along));
  float wall = smoothstep(0.86, 0.97, along);
  ramp = mix(ramp, mix(uShadow, uConcLo, 0.32), wall * 0.8);
  // the ramp's cross-joints (where the units ride), fading by pixel size
  float rj = band(abs(fract(p.y / 6.0 + 0.5) - 0.5) * 6.0, 0.0, 0.25, fw.y) * (1.0 - smoothstep(0.1, 0.5, pw)) * (1.0 - wall);
  ramp = mix(ramp, uShadow * 0.8, rj * 0.35);
  // its lips: the near lip lit (cream rim), a thin dark line along the far one
  float nearLip = band(p.y - uMouth.y, -1.0, 0.0, fw.y) * band(p.x, uMouth.x, uMouth.z, fw.x);
  float farLip = band(p.y - uMouth.w, 0.0, 0.8, fw.y) * band(p.x, uMouth.x, uMouth.z, fw.x);

  // --- the units: contact shadow and the union of their cast shadows ---
  vec2 v1 = -vec2(uLw.x, -uLw.z) / max(uLw.y, 0.05);    // the shadow's run per metre of height (world X, Z)
  // world Z here is p.y; uLw is three-space (z flipped): toward the light in world Z is -uLw.z
  float sh = 0.0;
  float ao = 0.0;
  float reach = uH * length(v1) + uHalf * 1.5 + 12.0;
  for (int i = 0; i < ${N_UNITS}; i++) {
    vec4 u = uU[i];
    if (u.z < 0.05) continue;
    vec2 q = p - u.xy;
    if (abs(q.x) > reach || abs(q.y) > reach) continue;
    vec2 v = v1 * u.z;
    float sd = sdSwept(q, vec2(uHalf), v);
    float pen = 0.6 + 0.012 * u.z + 0.7 * pw;
    sh = max(sh, 1.0 - smoothstep(-pen, pen, sd));
    float sdb = sdBox2(q, vec2(uHalf));
    ao = max(ao, (1.0 - smoothstep(0.0, 7.0 + pw, sdb)) * smoothstep(0.0, 6.0, u.z) * step(0.0, sdb));
  }
  vec3 col = uShadow;
  float a = sh * 0.5 + (1.0 - sh) * ao * 0.22;
  // the mouth paints its own pit (the shadow falls into it as well)
  col = mix(col, ramp, inM);
  a = mix(a, 1.0, inM);
  col = mix(col, mix(ramp, uShadow, 0.5), inM * sh * 0.5);
  col = mix(col, uEdge, nearLip * 0.65);
  a = max(a, nearLip * 0.65);
  col = mix(col, uShadow, farLip * 0.6 * (1.0 - inM));
  a = max(a, farLip * 0.5);
  if (a < 0.002) discard;
  float f = cFogAt(vW);
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), a);
}`;
/** YardGround — the mouth and the units' shadows on the concrete. Pass the same `units` as WorkUnits. */
export const YardGround: React.FC<{ units: UnitState[]; fog?: number }> = ({ units, fog = 1 }) => {
  useThree();
  const L = LIGHT.side;
  const o = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: PLANE_VERT,
      fragmentShader: YARD_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        ...fogUniforms(),
        uMouth: { value: new THREE.Vector4(...MOUTH) },
        uRect: { value: new THREE.Vector4(...YARD_RECT) },
        uU: { value: Array.from({ length: N_UNITS }, () => new THREE.Vector4(0, 0, 0, 0)) },
        uHalf: { value: UNIT.H / 2 },
        uH: { value: UNIT.H },
        uLw: { value: new THREE.Vector3(L[0], L[1], -L[2]) },
        uConc: { value: v3(AIR_COLOR.concrete) },
        uConcLo: { value: v3(AIR_COLOR.concreteLo) },
        uShadow: { value: v3(COLOR.shadow) },
        uEdge: { value: v3(COLOR.cream) },
      },
    });
    const mesh = new THREE.Mesh(planeOver(YARD_RECT), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -2.4;
    return { mesh, mat };
  }, [L]);
  const u = o.mat.uniforms;
  for (let i = 0; i < N_UNITS; i++) {
    const s = units[i];
    const vis = s ? Math.max(0, Math.min(UNIT.H, s.base + UNIT.H)) : 0;
    u.uU.value[i].set(s?.x ?? 0, s?.z ?? 0, vis, 0);
  }
  u.uCFog.value.set(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max * fog, 0);
  return <primitive object={o.mesh} />;
};

// ===================================================================================================================
// THE WORK UNITS: cream cubes, the stage's card material in 3D
// ===================================================================================================================
const UNIT_VERT = /* glsl */ `
attribute vec3 aLoc;      // local position in the cube (x, y 0..H, z), world-like axes
attribute vec4 iPos;      // centre X, foot Y, centre Z (world), shown
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec3 vLoc;
void main() {
  vec3 p = vec3(iPos.x + aLoc.x, iPos.y + aLoc.y, -(iPos.z + aLoc.z));
  if (iPos.w < 0.5) p = vec3(0.0, -1e5, 0.0);
  vW = p;
  vN = normal;
  vLoc = aLoc;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const UNIT_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uCream;
uniform vec3 uCreamFoot;
uniform vec3 uShade;
uniform vec3 uBounce;
uniform float uH;
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
varying vec3 vLoc;
void main() {
  // still below the apron (coming up the ramp): not seen
  if (vW.y < 0.0) discard;
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  bool side = abs(n.y) < 0.5;
  float hh = uH * 0.5;
  // the card stock: cream on top, a touch warmer toward the foot of the sides
  vec3 base = side ? mix(uCreamFoot, uCream, smoothstep(0.0, uH, vLoc.y)) : uCream;
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.3, 1.0, ndl);
  vec3 col = mix(base * uShade, base * 1.03, lit);
  col *= 1.0 + 0.05 * max(n.y, 0.0);
  // the warm bounce off the concrete into the lower sides
  col = mix(col, col * uBounce, side ? 0.22 * (1.0 - smoothstep(0.0, uH * 0.6, vLoc.y)) : 0.0);
  // a softened edge: every face brightens toward the top rim it shares with the lit top, a hair of shade at the foot
  float pw = max(length(fwidth(vLoc)), 1e-3);
  if (side) {
    float rim = smoothstep(uH - 1.6 - pw, uH, vLoc.y);
    col = mix(col, uCream * 1.04, rim * 0.55);
    float foot = 1.0 - smoothstep(0.0, 1.4 + pw, vLoc.y);
    col *= 1.0 - 0.12 * foot;
  } else {
    float e = hh - max(abs(vLoc.x), abs(vLoc.z));
    col = mix(col, uCream * 1.05, (1.0 - smoothstep(0.0, 1.6 + pw, e)) * 0.4);
  }
  float sheen = pow(max(dot(n, normalize(uL + V)), 0.0), 14.0);
  col += base * 0.06 * sheen;
  float f = cFogAt(vW);
  gl_FragColor = vec4(mix(col, cFogCol(vW), f), 1.0);
}`;
/** one cube's geometry: flat faces (non-indexed), local origin at the foot centre, world-like local coords in aLoc */
const cubeGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const h = UNIT.H / 2;
    const H = UNIT.H;
    const pos: number[] = [];
    const nor: number[] = [];
    const loc: number[] = [];
    // faces in world-like coords (x, y, z away); three normal = (nx, ny, -nz)
    const F: [[number, number, number][], [number, number, number]][] = [
      [[[-h, 0, -h], [h, 0, -h], [h, H, -h], [-h, H, -h]], [0, 0, -1]],
      [[[h, 0, h], [-h, 0, h], [-h, H, h], [h, H, h]], [0, 0, 1]],
      [[[-h, 0, h], [-h, 0, -h], [-h, H, -h], [-h, H, h]], [-1, 0, 0]],
      [[[h, 0, -h], [h, 0, h], [h, H, h], [h, H, -h]], [1, 0, 0]],
      [[[-h, H, -h], [h, H, -h], [h, H, h], [-h, H, h]], [0, 1, 0]],
    ];
    for (const [q, n] of F) {
      for (const j of [0, 1, 2, 0, 2, 3]) {
        pos.push(q[j][0], q[j][1], -q[j][2]);
        nor.push(n[0], n[1], -n[2]);
        loc.push(q[j][0], q[j][1], q[j][2]);
      }
    }
    const b = new THREE.InstancedBufferGeometry();
    b.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    b.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
    b.setAttribute("aLoc", new THREE.BufferAttribute(new Float32Array(loc), 3));
    g = b;
    return g;
  };
})();
/** WorkUnits — the hundred cream cubes at `units` (tenXPlan unitsAt) */
export const WorkUnits: React.FC<{ units: UnitState[]; fog?: number }> = ({ units, fog = 1 }) => {
  useThree();
  const L = LIGHT.side;
  const o = useMemo(() => {
    const base = cubeGeo();
    const geo = new THREE.InstancedBufferGeometry();
    for (const k of ["position", "normal", "aLoc"]) geo.setAttribute(k, base.getAttribute(k));
    const iPos = new THREE.InstancedBufferAttribute(new Float32Array(N_UNITS * 4), 4);
    iPos.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("iPos", iPos);
    geo.instanceCount = N_UNITS;
    const mat = new THREE.ShaderMaterial({
      vertexShader: UNIT_VERT,
      fragmentShader: UNIT_FRAG,
      transparent: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
      uniforms: {
        ...fogUniforms(),
        uL: { value: new THREE.Vector3(L[0], L[1], -L[2]) },
        uCream: { value: v3(COLOR.cream) },
        uCreamFoot: { value: v3(COLOR.creamFoot) },
        uShade: { value: v3(AIR_COLOR.shadeMul) },
        uBounce: { value: v3(AIR_COLOR.bounce) },
        uH: { value: UNIT.H },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    return { mesh, mat, iPos };
  }, [L]);
  const arr = o.iPos.array as Float32Array;
  for (let i = 0; i < N_UNITS; i++) {
    const s = units[i];
    const shown = s && s.base > -UNIT.H ? 1 : 0;
    arr[i * 4] = s?.x ?? 0;
    arr[i * 4 + 1] = s?.base ?? 0;
    arr[i * 4 + 2] = s?.z ?? 0;
    arr[i * 4 + 3] = shown;
  }
  o.iPos.needsUpdate = true;
  o.mat.uniforms.uCFog.value.set(CAMPUS_FOG.near, CAMPUS_FOG.vis, CAMPUS_FOG.max * fog, 0);
  return <primitive object={o.mesh} />;
};
