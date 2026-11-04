// NUCLEAR_WORLD
// ===================================================================================================================
// nuclearWorld: the shared 3D world of scott-nolan-uranium (Cheeky Pint S4E04, Scott Nolan, General Matter). Cheeky Pint
// STOUT in real 3D: the espresso board is the floor of a three.js scene, objects are soft cream clay under ONE key light
// from the upper left, each with one soft shadow, fog into the ground colour, amber = uranium fuel with a fixed bloom.
// RENDER EVERY CUT WITH --gl=angle.
//
// WORLD UNITS: X right, Y up (board = 0), Z away from the camera (north on the map). Map scale: WORLD_MAP_WIDTH units
// span lon -130..150. A centrifuge is CENTRIFUGE.H units tall by default.
//
// API: see NUCLEAR_STAGE_READY.md beside the brief. Summary:
//   NuclearCam = { tx, ty, tz, d, yaw, pitch, f, cy, cx }: an orbit around a target. d = distance, yaw + turns right,
//     pitch + looks down, f = focal px (k = f / d screen px per unit at the target), cy / cx = the target's screen point.
//   nuclearProject(cam, [X, Y, Z]) -> { x, y, s, d }          pin 2D overlays to the world
//   nuclearEye(cam) -> [X, Y, Z]
//   nuclearTrack(start, glides, frames), nuclearCamAt(track, f)   the damped camera (d and f in log space)
//   <NuclearStage cam S world overlay? under? pool? grain? vignette? bloom? fog? floor?>
//   nuclearMaterial("clay" | "clayDim" | "amberFuel" | "glass" | "clayInst" | "clayDimInst"), <SoftShadows items y? />
//   <FuelPellet at y? h? lying? yaw? shadow?>
//   <Centrifuge at y? h? mode="solid"|"cutaway" rise? S shadow?>, <CentrifugeField items=[{at, h?, rise?, y?}] S />
//   <WorldSlab highlight={{US: 0..1}} dim? />, mapProject(lon, lat) -> [X, Z], WORLD_SLAB, slabTop(raise?)
// ===================================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// @ts-expect-error untyped module
import { geoEqualEarth, geoPath, geoProjection } from "d3-geo";
// @ts-expect-error untyped module
import { feature } from "topojson-client";
import countries50 from "world-atlas/countries-50m.json";
import { CAM_DAMP, CAM_STIFF, camEase } from "../kits/cheeky-pint/oceanShared";
import { COLOR, GRAIN, GROUND } from "../kits/cheeky-pint/stoutShared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
export type V3 = [number, number, number];
const W = 1080;
const H = 1920;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const frac = (v: number) => v - Math.floor(v);
const hash01 = (n: number) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const col3 = (h: string) => new THREE.Vector3(...hex3(h));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ===================================================================================================================
// LIGHT, CAMERA
// ===================================================================================================================
const nrm = (x: number, y: number, z: number): V3 => {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
};
/** Toward the one key light (world): upper left, a little toward the viewer, so uprights show a lit face. */
export const KEY_LIGHT: V3 = nrm(-0.56, 0.8, -0.14);
/** A caster of height h throws its shadow this far along SHADOW_DIR. */
export const SHADOW_DIR: [number, number] = (() => {
  const l = Math.hypot(KEY_LIGHT[0], KEY_LIGHT[2]);
  return [-KEY_LIGHT[0] / l, -KEY_LIGHT[2] / l];
})();
export const SHADOW_LEN = 0.72 * (Math.hypot(KEY_LIGHT[0], KEY_LIGHT[2]) / KEY_LIGHT[1]);

export type NuclearCam = { tx: number; ty: number; tz: number; d: number; yaw: number; pitch: number; f: number; cy: number; cx: number };
export const nuclearEye = (c: NuclearCam): V3 => {
  const sy = Math.sin(c.yaw * D2R);
  const cy = Math.cos(c.yaw * D2R);
  const sp = Math.sin(c.pitch * D2R);
  const cp = Math.cos(c.pitch * D2R);
  return [c.tx - sy * cp * c.d, c.ty + sp * c.d, c.tz - cy * cp * c.d];
};
/** World point -> screen px, the scale there (px per unit) and the depth. */
export const nuclearProject = (c: NuclearCam, p: V3) => {
  const e = nuclearEye(c);
  const rx = p[0] - e[0];
  const ry = p[1] - e[1];
  const rz = p[2] - e[2];
  const sy = Math.sin(c.yaw * D2R);
  const cy = Math.cos(c.yaw * D2R);
  const sp = Math.sin(c.pitch * D2R);
  const cp = Math.cos(c.pitch * D2R);
  const d = rx * sy * cp - ry * sp + rz * cy * cp;
  const right = rx * cy - rz * sy;
  const up = rx * sy * sp + ry * cp + rz * cy * sp;
  const dd = Math.max(1e-6, d);
  return { x: c.cx + (c.f * right) / dd, y: c.cy - (c.f * up) / dd, s: c.f / dd, d };
};
export type NuclearGlide = { f0: number; f1: number; to: Partial<Omit<NuclearCam, never>>; warp?: number };
const LOG_FIELDS = ["d", "f"];
/** The house damped follower over every camera field (d and f in log space), f = 0..frames+2. */
export const nuclearTrack = (start: NuclearCam, glides: NuclearGlide[], frames: number): NuclearCam[] => {
  const keys = Object.keys(start) as (keyof NuclearCam)[];
  const tr = (k: string, v: number) => (LOG_FIELDS.indexOf(k) >= 0 ? Math.log(v) : v);
  const out: NuclearCam[] = [];
  const pos: Record<string, number> = {};
  const vel: Record<string, number> = {};
  for (const k of keys) {
    pos[k] = tr(k, start[k]);
    vel[k] = 0;
  }
  for (let f = 0; f <= frames + 2; f++) {
    const o: Record<string, number> = {};
    for (const k of keys) {
      let v = tr(k, start[k]);
      let prev = v;
      for (const g of glides) {
        const t = g.to[k];
        if (t === undefined) continue;
        v += (tr(k, t) - prev) * camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
        prev = tr(k, t);
      }
      if (f > 0) {
        vel[k] = vel[k] + (v - pos[k]) * CAM_STIFF - vel[k] * CAM_DAMP;
        pos[k] += vel[k];
      }
      o[k] = LOG_FIELDS.indexOf(k) >= 0 ? Math.exp(pos[k]) : pos[k];
    }
    out.push(o as NuclearCam);
  }
  return out;
};
export const nuclearCamAt = (track: NuclearCam[], f: number): NuclearCam => {
  const a = Math.max(0, Math.min(track.length - 2, Math.floor(f)));
  const t = c01(f - a);
  const A = track[a] as Record<string, number>;
  const B = track[a + 1] as Record<string, number>;
  const o: Record<string, number> = {};
  for (const k of Object.keys(A)) o[k] = LOG_FIELDS.indexOf(k) >= 0 ? Math.exp(lerp(Math.log(A[k]), Math.log(B[k]), t)) : lerp(A[k], B[k], t);
  return o as NuclearCam;
};

// ===================================================================================================================
// SHARED UNIFORMS, MATERIALS
// ===================================================================================================================
const U = {
  uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
  uFogRange: { value: new THREE.Vector2(1e5, 2e5) },
  uFogCol: { value: col3(COLOR.ground) },
  uShade: { value: col3("#A88A6E") },
  uCream: { value: col3(COLOR.cream) },
  uCreamFoot: { value: col3(COLOR.creamFoot) },
  uAmberTop: { value: col3(COLOR.amberTop) },
  uAmberFoot: { value: col3(COLOR.amberFoot) },
  uAmberHot: { value: col3(COLOR.amberHot) },
  uBoardTone: { value: col3(COLOR.board) },
};
const COMMON_GLSL = /* glsl */ `
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
// soft clay: wrapped key, warm terminator, board bounce from below, a broad weak sheen and a cream rim on upward edges
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
const CLAY_VERT = /* glsl */ `
attribute float aTone;
attribute float aMark;
attribute float aPhase;
varying vec3 vW;
varying vec3 vN;
varying vec3 vP;
varying float vTone;
varying float vMark;
varying float vPh;
void main() {
  mat4 m = modelMatrix;
#ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  vPh = aPhase;
#else
  vPh = 0.0;
#endif
  vec4 wp = m * vec4(position, 1.0);
  vW = wp.xyz;
  vP = position;
  vN = normalize(mat3(m) * normal);
  vTone = aTone;
  vMark = aMark;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CLAY_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uKind;  // 0 cream, 1 board, 2 amber
uniform float uSpin;
varying vec3 vW;
varying vec3 vN;
varying vec3 vP;
varying float vTone;
varying float vMark;
varying float vPh;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  vec3 col;
  if (uKind > 1.5) {
    float lit = smoothstep(-0.5, 0.9, dot(n, uL));
    col = mix(uAmberFoot, uAmberTop, lit);
    col = mix(col, uAmberHot, 0.5 * pow(max(n.y, 0.0), 6.0));
  } else {
    vec3 base = uKind > 0.5 ? uBoardTone : mix(uCreamFoot, uCream, vTone);
    col = clayShade(base, n, V);
    if (vMark > 0.5) {
      // the turning machine shows in a faint seam that travels around the casing
      float a = atan(vP.z, vP.x) + uSpin + vPh;
      col *= 1.0 - 0.13 * smoothstep(0.86, 0.995, cos(a));
    }
  }
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
export type NuclearMaterialKind = "clay" | "clayDim" | "amberFuel" | "glass" | "clayInst" | "clayDimInst";
const makeClay = (kind: number) =>
  new THREE.ShaderMaterial({
    vertexShader: CLAY_VERT,
    fragmentShader: CLAY_FRAG,
    side: THREE.DoubleSide,
    uniforms: { ...U, uKind: { value: kind }, uSpin: { value: 0 } },
  });
const GLASS_VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GLASS_FRAG = /* glsl */ `
${COMMON_GLSL}
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float nv = abs(dot(normalize(vN), V));
  float rim = pow(1.0 - nv, 3.2);
  float hair = smoothstep(0.86, 0.985, 1.0 - nv);
  float spec = pow(max(dot(normalize(vN), normalize(uL + V)), 0.0), 60.0);
  float a = 0.045 + 0.34 * rim + 0.5 * hair + 0.35 * spec;
  gl_FragColor = vec4(mix(uCream, uFogCol, fogAt(vW)), a * (1.0 - fogAt(vW)));
}`;
const makeGlass = (side: number) =>
  new THREE.ShaderMaterial({ vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side, uniforms: { ...U } });
const matCache = new Map<string, Any>();
/** One of the clip's materials (cached). The clay materials need aTone/aMark, see withClayAttrs; "...Inst" go on InstancedMesh with aPhase. */
export const nuclearMaterial = (k: NuclearMaterialKind) => {
  const have = matCache.get(k);
  if (have) return have;
  const m = k === "glass" ? makeGlass(THREE.DoubleSide) : makeClay(k === "clayDim" || k === "clayDimInst" ? 1 : k === "amberFuel" ? 2 : 0);
  matCache.set(k, m);
  return m;
};
/** give any three geometry the attributes the clay shader reads (tone 0 foot .. 1 top, mark 1 = the travelling seam) */
export const withClayAttrs = (g: Any, tone = 1, mark = 0) => {
  const n = g.attributes.position.count;
  g.setAttribute("aTone", new THREE.BufferAttribute(new Float32Array(n).fill(tone), 1));
  g.setAttribute("aMark", new THREE.BufferAttribute(new Float32Array(n).fill(mark), 1));
  return g;
};

// ===================================================================================================================
// SHADOWS. Every caster's soft shadow goes into the frame buffer's ALPHA with MAX blending, and one full-frame quad then
// multiplies the floor by it, so overlapping shadows of a group never double up: one shadow per object, one per group.
// Draw order: board (-100), land (-90), shadows (-80), resolve (-70), objects (0+).
// ===================================================================================================================
export type ShadowItem = { x: number; z: number; len: number; r: number; soft?: number; alpha?: number; dirX?: number; dirZ?: number };
const SHADOW_VERT = /* glsl */ `
attribute vec3 aA;    // x, z, length
attribute vec4 aB;    // radius, soft, alpha, y
attribute vec2 aDir;
varying vec2 vQ;
varying vec3 vC;
varying float vAlphaOut;
void main() {
  float pad = aB.x * 1.3 + aB.y * 3.6;
  vec2 d = aDir; vec2 s = vec2(-d.y, d.x);
  float along = mix(-pad, aA.z + pad, position.x);
  float across = position.y * pad * 1.0;
  float widen = 1.0 + 0.5 * position.x;
  vec2 q = vec2(along, across * widen);
  vec2 wxz = aA.xy + d * q.x + s * q.y;
  vQ = q;
  vC = vec3(aA.z, aB.x, aB.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(wxz.x, aB.w, -wxz.y, 1.0);
  vAlphaOut = aB.z;
}`;
const SHADOW_FRAG = /* glsl */ `
varying vec2 vQ;
varying vec3 vC;
varying float vAlphaOut;
void main() {
  float t = clamp(vQ.x / max(vC.x, 0.0001), 0.0, 1.0);
  float soft = vC.z * (0.35 + 3.0 * t);            // the penumbra opens away from the contact
  float rad = vC.y * (1.0 + 0.25 * t);
  vec2 c = vec2(vQ.x - clamp(vQ.x, 0.0, vC.x), vQ.y);
  float a = 1.0 - smoothstep(rad - soft, rad + soft, length(c));
  a *= mix(1.0, 0.55, t);
  gl_FragColor = vec4(0.0, 0.0, 0.0, a * vAlphaOut);
}`;
const shadowQuad = () => {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
};
const makeShadowMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: SHADOW_VERT,
    fragmentShader: SHADOW_FRAG,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.MaxEquation,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
  });
/** Soft shadows on a surface at height y (board 0, land slabTop()). In `world`; give the group its items together. */
export const SoftShadows: React.FC<{ items: ShadowItem[]; y?: number }> = ({ items, y = 0.02 }) => {
  const cap = Math.max(8, Math.ceil(items.length * 1.25));
  const o = useMemo(() => {
    const g = shadowQuad();
    const A = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    const B = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4);
    const D = new THREE.InstancedBufferAttribute(new Float32Array(cap * 2), 2);
    g.setAttribute("aA", A);
    g.setAttribute("aB", B);
    g.setAttribute("aDir", D);
    const mesh = new THREE.Mesh(g, makeShadowMat());
    mesh.frustumCulled = false;
    mesh.renderOrder = -80;
    return { mesh, g, A, B, D };
  }, [cap]);
  items.forEach((s, i) => {
    o.A.setXYZ(i, s.x, s.z, s.len);
    o.B.setXYZW(i, s.r, s.soft ?? s.r * 0.6, (s.alpha ?? 1) * 0.46, y);
    o.D.setXY(i, s.dirX ?? SHADOW_DIR[0], s.dirZ ?? SHADOW_DIR[1]);
  });
  o.g.instanceCount = items.length;
  o.A.needsUpdate = o.B.needsUpdate = o.D.needsUpdate = true;
  return <primitive object={o.mesh} />;
};
const ShadowResolve: React.FC = () => {
  const mesh = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: "void main(){gl_Position=vec4(position.xy,0.0,1.0);}",
      fragmentShader: `uniform vec3 uC;void main(){gl_FragColor=vec4(uC,1.0);}`,
      uniforms: { uC: { value: col3(COLOR.shadow) } },
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.DstAlphaFactor,
      blendDst: THREE.OneMinusDstAlphaFactor,
      blendEquationAlpha: THREE.AddEquation,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.ZeroFactor,
    });
    const me = new THREE.Mesh(g, m);
    me.frustumCulled = false;
    me.renderOrder = -70;
    return me;
  }, []);
  return <primitive object={mesh} />;
};

// ===================================================================================================================
// THE BOARD FLOOR
// ===================================================================================================================
let boardTex: Any = null;
let boardWait: Promise<void> | null = null;
const loadBoard = () => {
  if (boardWait) return boardWait;
  const h = delayRender("nuclearWorld board texture");
  boardWait = new Promise<void>((res, rej) => {
    new THREE.TextureLoader().load(
      staticFile(GROUND.src),
      (t: Any) => {
        t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
        t.anisotropy = 8;
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        boardTex = t;
        continueRender(h);
        res();
      },
      undefined,
      (e: unknown) => rej(e),
    );
  });
  return boardWait;
};
const FLOOR_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uTex;
uniform sampler2D uLandShadow;
uniform vec4 uLandBox;      // minX, minZ, w, h
uniform float uHasLand;
uniform vec2 uLandOff;
uniform float uBoardUnits;
uniform vec3 uLandZoom;
varying vec3 vW;
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  vec3 col = texture2D(uTex, p / uBoardUnits + 0.5).rgb;
  if (uHasLand > 0.5) {
    vec2 q = (p - uLandOff - uLandZoom.xy) / uLandZoom.z + uLandZoom.xy;
    float s = texture2D(uLandShadow, (q - uLandBox.xy) / uLandBox.zw).r;
    col = mix(col, ${"vec3(" + hex3(COLOR.shadow).map((v) => v.toFixed(4)).join(",") + ")"}, 0.7 * s);
  }
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 0.0);
}`;
const FLOOR_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FloorCtx = React.createContext<{ current: Any } | null>(null);
const Floor: React.FC<{ units: number }> = ({ units }) => {
  const o = useMemo(() => {
    const g = new THREE.PlaneGeometry(200000, 200000);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      blending: THREE.NoBlending,
      uniforms: {
        ...U,
        uTex: { value: boardTex },
        uLandShadow: { value: null },
        uLandBox: { value: new THREE.Vector4(0, 0, 1, 1) },
        uHasLand: { value: 0 },
        uLandOff: { value: new THREE.Vector2(0, 0) },
        uBoardUnits: { value: 1296 },
        uLandZoom: { value: new THREE.Vector3(0, 0, 1) },
      },
    });
    const me = new THREE.Mesh(g, m);
    me.frustumCulled = false;
    me.renderOrder = -100;
    return { me, m };
  }, []);
  o.m.uniforms.uTex.value = boardTex;
  o.m.uniforms.uBoardUnits.value = units;
  const ref = React.useContext(FloorCtx);
  if (ref) ref.current = o.m;
  return <primitive object={o.me} />;
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const SUPERSAMPLE = 2;
/** the stage's camera (exported for a second canvas that must share it exactly; opt-in, scott-nolan-orbit cut C) */
export const CameraRig: React.FC<{ cam: NuclearCam }> = ({ cam }) => {
  const { camera, gl } = useThree();
  const c = camera as Any;
  const e = nuclearEye(cam);
  c.fov = (2 * Math.atan(960 / cam.f) * 180) / Math.PI;
  c.aspect = W / H;
  c.near = Math.max(0.05, cam.d * 0.03);
  c.far = Math.max(cam.d * 40, 4000);
  c.position.set(e[0], e[1], -e[2]);
  c.rotation.order = "YXZ";
  c.rotation.set(-cam.pitch * D2R, -cam.yaw * D2R, 0);
  c.setViewOffset(W, H, 540 - cam.cx, 960 - cam.cy, W, H);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  const g = gl as Any;
  // supersampled: thin casings, coasts and glass hairlines stay clean under the moving camera
  if (g.getPixelRatio() !== SUPERSAMPLE) g.setPixelRatio(SUPERSAMPLE);
  const gc = hex3(COLOR.ground);
  g.setClearColor(new THREE.Color().setRGB(gc[0], gc[1], gc[2], THREE.LinearSRGBColorSpace), 0);
  return null;
};
export type NuclearStageProps = {
  cam: NuclearCam;
  /** story clock (frames): spin, grain */
  S: number;
  /** the 3D objects */
  world?: React.ReactNode;
  /** screen-px layers above the 3D (pin them with nuclearProject) */
  overlay?: React.ReactNode;
  /** the cream light pool's centre (screen px) and strength; default the frame's upper middle */
  pool?: { x: number; y: number; strength?: number };
  grain?: number;
  vignette?: number;
  bloom?: number;
  /** fog start and end, in multiples of cam.d from the eye */
  fog?: [number, number];
  /** world units one board texture spans. Tie it to the cut's scale: about 1296 / k at the cut's typical k (px per unit), or the board
   *  magnifies into blurred blotches. Fixed for a cut, or the board swims. */
  boardUnits?: number;
  /** false: no board plane (rare) */
  floor?: boolean;
};
const uidOf = (raw: string) => `nw${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
export const NuclearStage: React.FC<NuclearStageProps> = ({ cam, S, world, overlay, pool, grain = 1, vignette = 1, bloom = 1, fog = [1.6, 6], boardUnits = 1296, floor = true }) => {
  const uid = uidOf(React.useId());
  const [, force] = React.useState(0);
  if (!boardTex) {
    throw loadBoard().then(() => force(1));
  }
  U.uFogRange.value.set(cam.d * fog[0], cam.d * fog[1]);
  const floorRef = useMemo(() => ({ current: null as Any }), []);
  const g2 = Math.floor(S / 2);
  const grx = (hash01(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hash01(g2 + 7) * 2 - 1) * GRAIN.travel;
  const px = pool?.x ?? 430;
  const py = pool?.y ?? 760;
  const ps = pool?.strength ?? 1;
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground, overflow: "hidden" }}>
      {bloom > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <defs>
            <filter id={`${uid}bl`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              {/* alpha = how amber a pixel is (red high, blue low): cream, board and ground fall below zero */}
              <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 0.68  0 0 0 0 0.12  1.6 0 -2.3 0 -0.38" result="o" />
              <feGaussianBlur in="o" stdDeviation="3.5" result="b1" />
              <feGaussianBlur in="o" stdDeviation="12" result="b2" />
              <feGaussianBlur in="o" stdDeviation="30" result="b3" />
              <feComponentTransfer in="b1" result="b1a">
                <feFuncA type="linear" slope={(0.36 * bloom * 1.6).toFixed(3)} />
              </feComponentTransfer>
              <feComponentTransfer in="b2" result="b2a">
                <feFuncA type="linear" slope={(0.2 * bloom * 1.6).toFixed(3)} />
              </feComponentTransfer>
              <feComponentTransfer in="b3" result="b3a">
                <feFuncA type="linear" slope={(0.06 * bloom * 1.6).toFixed(3)} />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="b3a" />
                <feMergeNode in="b2a" />
                <feMergeNode in="b1a" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      ) : null}
      <AbsoluteFill style={bloom > 0 ? { filter: `url(#${uid}bl)` } : undefined}>
        <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false }}>
          <CameraRig cam={cam} />
          <FloorCtx.Provider value={floorRef}>
            {floor ? <Floor units={boardUnits} /> : null}
            <ShadowResolve />
            {world}
          </FloorCtx.Provider>
        </ThreeCanvas>
      </AbsoluteFill>
      {overlay}
      {/* the cream light pool */}
      <AbsoluteFill
        style={{
          mixBlendMode: "soft-light",
          background: `radial-gradient(ellipse 900px 1150px at ${px}px ${py}px, rgba(245,238,225,${(0.5 * ps).toFixed(3)}) 0%, rgba(245,238,225,${(0.16 * ps).toFixed(3)}) 48%, rgba(245,238,225,0) 100%)`,
        }}
      />
      {vignette > 0 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 104% 100% at 50% 46%, rgba(34,21,11,0) 42%, rgba(34,21,11,${(0.2 * vignette).toFixed(3)}) 72%, rgba(34,21,11,${(0.44 * vignette).toFixed(3)}) 100%)`,
          }}
        />
      ) : null}
      {grain > 0 ? (
        <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity * grain }}>
          <Img src={staticFile(GROUND.grain)} style={{ position: "absolute", left: (W - GROUND.W) / 2 + grx, top: (H - GROUND.H) / 2 + gry, width: GROUND.W, height: GROUND.H }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ===================================================================================================================
// FUEL PELLET: a real UO2 pellet: about 8 mm across, 10-12 mm long, chamfered, faintly dished ends. h = its length.
// ===================================================================================================================
const unitLathe = (pts: [number, number][], seg: number) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
const pelletGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    // length 1, radius 0.4 (8 mm : 10 mm), chamfer and a shallow dish at both ends
    const r = 0.4;
    const pts: [number, number][] = [
      [0.0001, 0.018], [0.14, 0.012], [0.29, 0.0], [0.345, 0.0], [0.38, 0.012], [0.396, 0.03], [r, 0.056],
      [r, 0.944], [0.396, 0.97], [0.38, 0.988], [0.345, 1.0], [0.29, 1.0], [0.14, 0.988], [0.0001, 0.982],
    ];
    g = withClayAttrs(unitLathe(pts, 48));
    return g;
  };
})();
export const PELLET_ASPECT = 0.8; // diameter / length
export const FuelPellet: React.FC<{ at: [number, number]; y?: number; h?: number; lying?: boolean; yaw?: number; shadow?: number }> = ({ at, y = 0, h = 10, lying = false, yaw = 0, shadow = 1 }) => {
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(pelletGeo(), nuclearMaterial("amberFuel"));
    m.frustumCulled = false;
    m.renderOrder = 2;
    return m;
  }, []);
  const yy = lying ? y + h * 0.4 : y;
  mesh.scale.setScalar(h);
  mesh.rotation.order = "YXZ";
  mesh.rotation.set(0, yaw * D2R, lying ? Math.PI / 2 : 0);
  mesh.position.set(at[0] + (lying ? h / 2 : 0) * Math.cos(yaw * D2R), yy, -at[1] + (lying ? h / 2 : 0) * Math.sin(yaw * D2R));
  const tall = lying ? h * 0.8 : h;
  return (
    <>
      {shadow > 0 ? <SoftShadows items={[{ x: at[0], z: at[1], len: (y + tall) * SHADOW_LEN, r: h * 0.42, alpha: shadow }]} /> : null}
      <primitive object={mesh} />
    </>
  );
};

// ===================================================================================================================
// GAS CENTRIFUGE. Unit height 1 (about 9:1): a long thin casing on a plinth, a cap with three thin pipes (feed, product,
// tails), a stub pipe at the base. The default h is CENTRIFUGE.H world units.
// ===================================================================================================================
export const CENTRIFUGE = { H: 80, R: 0.055, CASING_Y0: 0.052, CASING_Y1: 0.905 } as const;
type Parts = { casing: Any; rest: Any; solid: Any };
let partsCache: Parts | null = null;
const tube = (pts: V3[], r: number) => {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, "catmullrom", 0.1);
  return new THREE.TubeGeometry(curve, 24, r, 8, false);
};
const centrifugeParts = (): Parts => {
  if (partsCache) return partsCache;
  const R = CENTRIFUGE.R;
  const y0 = CENTRIFUGE.CASING_Y0;
  const y1 = CENTRIFUGE.CASING_Y1;
  const casingPts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) casingPts.push([R, y0 + ((y1 - y0) * i) / 24]);
  const casing = withClayAttrs(unitLathe(casingPts, 40), 1, 1);
  const base = withClayAttrs(
    unitLathe(
      [
        [0.0001, 0], [R * 1.5, 0], [R * 1.56, 0.003], [R * 1.56, 0.016], [R * 1.48, 0.021], [R * 1.14, 0.024], [R * 1.14, 0.046], [R * 1.08, 0.05], [R, 0.053], [R * 0.5, 0.053], [0.0001, 0.053],
      ],
      40,
    ),
    0.45,
    0,
  );
  const cap = withClayAttrs(
    unitLathe(
      [
        [0.0001, y1 - 0.002], [R, y1 - 0.002], [R * 1.1, y1 + 0.001], [R * 1.14, y1 + 0.006], [R * 1.14, y1 + 0.022], [R * 1.08, y1 + 0.027], [R * 0.96, y1 + 0.029], [R * 0.9, y1 + 0.036], [R * 0.68, y1 + 0.045], [R * 0.34, y1 + 0.049], [0.0001, y1 + 0.05],
      ],
      40,
    ),
    1,
    0,
  );
  const ring = (y: number) => withClayAttrs(unitLathe([[R, y - 0.0035], [R * 1.035, y - 0.002], [R * 1.035, y + 0.002], [R, y + 0.0035]], 40), 0.8, 0);
  const py = y1 + 0.04;
  const pipes = [
    tube([[R * 0.45, py, 0], [R * 0.45, py + 0.02, 0], [R * 0.45, py + 0.04, 0], [R * 0.8, py + 0.052, 0], [R * 1.6, py + 0.054, 0]], R * 0.1),
    tube([[-R * 0.25, py, R * 0.38], [-R * 0.25, py + 0.016, R * 0.38], [-R * 0.25, py + 0.032, R * 0.38], [-R * 0.3, py + 0.042, R * 0.8], [-R * 0.34, py + 0.044, R * 1.6]], R * 0.1),
    tube([[-R * 0.25, py, -R * 0.38], [-R * 0.25, py + 0.012, -R * 0.38], [-R * 0.25, py + 0.024, -R * 0.38], [-R * 0.3, py + 0.033, -R * 0.8], [-R * 0.34, py + 0.035, -R * 1.6]], R * 0.1),
    tube([[R * 1.14, 0.038, 0], [R * 1.4, 0.038, 0], [R * 1.72, 0.036, 0], [R * 1.86, 0.024, 0], [R * 1.86, 0.004, 0]], R * 0.12),
  ].map((g) => withClayAttrs(g, 0.7, 0));
  const rest = mergeGeometries([base, cap, ring(0.34), ring(0.62), ...pipes], false);
  const solid = mergeGeometries([casing.clone(), rest.clone()], false);
  partsCache = { casing, rest, solid };
  return partsCache;
};
const RISE_SINK = 1.03;
const machineShadow = (at: [number, number], h: number, rise: number, alpha = 1): ShadowItem => ({
  x: at[0],
  z: at[1],
  len: h * rise * SHADOW_LEN,
  r: h * CENTRIFUGE.R * 1.2,
  soft: h * CENTRIFUGE.R * 0.7,
  alpha: alpha * smooth(0, 0.05, rise),
});

// --- particles (a pure function of the story clock) ---------------------------------------------------------------
const HEAVY_N = 760;
const AMBER_N = 130;
const pGeoCache: { g: Any | null } = { g: null };
const PARTICLE_VERT = /* glsl */ `
attribute vec3 aC;
varying vec3 vC;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vW = wp.xyz; vC = aC; vN = normalize(mat3(modelMatrix * instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PARTICLE_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uFlat;
varying vec3 vC; varying vec3 vW; varying vec3 vN;
void main() {
  vec3 n = normalize(vN);
  float lit = smoothstep(-0.6, 0.9, dot(n, uL));
  vec3 col = mix(vC * mix(0.62, 1.04, lit), vC, uFlat);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
const makeParticles = (n: number, flat: number, col: string, order: number) => {
  if (!pGeoCache.g) pGeoCache.g = new THREE.IcosahedronGeometry(1, 2);
  const m = new THREE.ShaderMaterial({ vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG, uniforms: { ...U, uFlat: { value: flat } } });
  const g = pGeoCache.g.clone();
  const c = hex3(col);
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = 0.82 + 0.18 * hash01(i + 901);
    arr[i * 3] = c[0] * v;
    arr[i * 3 + 1] = c[1] * v;
    arr[i * 3 + 2] = c[2] * v;
  }
  g.setAttribute("aC", new THREE.InstancedBufferAttribute(arr, 3));
  const me = new THREE.InstancedMesh(g, m, n);
  me.frustumCulled = false;
  me.renderOrder = order;
  return me;
};
const M4 = new THREE.Matrix4();
const P3 = new THREE.Vector3();
const Q4 = new THREE.Quaternion();
const S3 = new THREE.Vector3();
/** the separation at clock S, in the machine's unit space. Heavy U-238 hugs the wall and sinks; a share is always being
 *  flung out from the axis. U-235 peels inward from the feed at mid height, gathers on the axis and rises to the top. */
const fillParticles = (heavy: Any, amber: Any, S: number, glow = 1) => {
  const R = CENTRIFUGE.R * 0.9;
  const y0 = 0.075;
  const y1 = 0.885;
  for (let i = 0; i < HEAVY_N; i++) {
    const a = hash01(i + 1);
    const b = hash01(i + 201);
    const c = hash01(i + 401);
    const flung = i % 8 === 0;
    const u = frac(a + S / (flung ? 46 : 150));
    let r: number;
    let y: number;
    let s = 1;
    if (flung) {
      const e = 1 - Math.pow(1 - c01(u / 0.5), 2.4);
      r = lerp(0.1, 0.72 + 0.25 * b, e);
      y = lerp(y0, y1, c) - 0.02 * u;
      s = smooth(0, 0.08, u) * (1 - smooth(0.92, 1, u));
    } else {
      r = 0.86 + 0.13 * b;
      y = lerp(y1, y0, u);
      s = smooth(0, 0.03, u) * (1 - smooth(0.97, 1, u));
    }
    const w = 0.34 + 0.05 * c;
    const th = c * 6.283 * 7 + S * w;
    P3.set(Math.cos(th) * r * R, y, Math.sin(th) * r * R);
    const sz = 0.0026 * (0.7 + 0.6 * a) * s;
    S3.set(sz, sz, sz);
    M4.compose(P3, Q4, S3);
    heavy.setMatrixAt(i, M4);
  }
  heavy.instanceMatrix.needsUpdate = true;
  for (let i = 0; i < AMBER_N; i++) {
    const a = hash01(i + 1001);
    const b = hash01(i + 1201);
    const c = hash01(i + 1401);
    const u = frac(a + S / 68);
    const g = 1 - Math.pow(1 - c01(u / 0.34), 2.2);
    const r = lerp(0.62 + 0.2 * b, 0.05 + 0.13 * b, g);
    const y = lerp(0.42 + 0.14 * c, y1, u * u * 0.5 + u * 0.5);
    const th = c * 6.283 * 5 + S * (0.46 + 0.05 * b);
    P3.set(Math.cos(th) * r * R, y, Math.sin(th) * r * R);
    const sz = 0.0037 * (1 + 0.4 * (glow - 1)) * (0.75 + 0.5 * b) * smooth(0, 0.06, u) * (1 - smooth(0.96, 1, u));
    S3.set(sz, sz, sz);
    M4.compose(P3, Q4, S3);
    amber.setMatrixAt(i, M4);
  }
  amber.instanceMatrix.needsUpdate = true;
};
const COLUMN_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uGlow;
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  float nv = abs(dot(normalize(vN), V));
  float a = pow(nv, 2.6) * smoothstep(0.0, 0.12, vU.y) * (1.0 - smoothstep(0.93, 1.0, vU.y));
  a *= mix(0.3, 0.9, smoothstep(0.1, 0.9, vU.y));
  a = min(1.0, a * uGlow);
  gl_FragColor = vec4(mix(uAmberTop, uAmberHot, nv * nv * 0.5), a * (1.0 - fogAt(vW)));
}`;
const COLUMN_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() { vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz; vU = uv; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*viewMatrix*wp; }`;
const ROTOR_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uSpin;
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() {
  float a = fract(vU.x * 18.0 + vU.y * 2.2 + uSpin * 18.0 / 6.28318);
  float line = smoothstep(0.0, 0.05, a) * (1.0 - smoothstep(0.1, 0.15, a));
  gl_FragColor = vec4(uCream, 0.1 * line * (1.0 - fogAt(vW)));
}`;
export type CentrifugeProps = {
  at: [number, number];
  /** the surface it stands on */
  y?: number;
  h?: number;
  mode?: "solid" | "cutaway";
  /** 0 sunk in its slot .. 1 standing (the land above hides the sunk part) */
  rise?: number;
  /** story clock */
  S: number;
  shadow?: number;
  /** cutaway only: strength of the amber on the axis (1 = the original look) */
  glow?: number;
};
/** One machine; `cutaway` shows the glass casing, the spinning rotor and the separation inside. */
export const Centrifuge: React.FC<CentrifugeProps> = ({ at, y = 0, h = CENTRIFUGE.H, mode = "solid", rise = 1, S, shadow = 1, glow = 1 }) => {
  const o = useMemo(() => {
    const p = centrifugeParts();
    const group = new THREE.Group();
    const solid = new THREE.Mesh(mode === "cutaway" ? p.rest : p.solid, makeClay(0));
    solid.frustumCulled = false;
    solid.renderOrder = 1;
    group.add(solid);
    let heavy: Any = null;
    let amber: Any = null;
    let rotorMat: Any = null;
    if (mode === "cutaway") {
      const axis = new THREE.Mesh(withClayAttrs(new THREE.CylinderGeometry(CENTRIFUGE.R * 0.045, CENTRIFUGE.R * 0.045, 0.84, 12), 0.8, 0), makeClay(1));
      axis.position.y = 0.48;
      axis.frustumCulled = false;
      group.add(axis);
      heavy = makeParticles(HEAVY_N, 0, "#A98A6C", 2);
      amber = makeParticles(AMBER_N, 1, COLOR.amberTop, 2);
      group.add(heavy, amber);
      const colG = new THREE.CylinderGeometry(CENTRIFUGE.R * 0.26, CENTRIFUGE.R * 0.26, 0.56, 20, 1, true);
      const col = new THREE.Mesh(colG, new THREE.ShaderMaterial({ vertexShader: COLUMN_VERT, fragmentShader: COLUMN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...U, uGlow: { value: 1 } } }));
      col.position.y = 0.61;
      col.renderOrder = 4;
      col.frustumCulled = false;
      group.add(col);
      rotorMat = new THREE.ShaderMaterial({ vertexShader: COLUMN_VERT, fragmentShader: ROTOR_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...U, uSpin: { value: 0 } } });
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(CENTRIFUGE.R * 0.93, CENTRIFUGE.R * 0.93, CENTRIFUGE.CASING_Y1 - CENTRIFUGE.CASING_Y0, 40, 1, true), rotorMat);
      rotor.position.y = (CENTRIFUGE.CASING_Y1 + CENTRIFUGE.CASING_Y0) / 2;
      rotor.renderOrder = 3;
      rotor.frustumCulled = false;
      group.add(rotor);
      const back = new THREE.Mesh(p.casing, makeGlass(THREE.BackSide));
      back.renderOrder = 3;
      back.frustumCulled = false;
      const front = new THREE.Mesh(p.casing, makeGlass(THREE.FrontSide));
      front.renderOrder = 6;
      front.frustumCulled = false;
      group.add(back, front);
    }
    return { group, heavy, amber, solid, rotorMat, column: group.children.find((c: Any) => c.material?.uniforms?.uGlow) };
  }, [mode]);
  o.group.position.set(at[0], y - (1 - rise) * h * RISE_SINK, -at[1]);
  o.group.scale.setScalar(h);
  o.solid.material.uniforms.uSpin.value = S * 0.34;
  if (o.heavy) fillParticles(o.heavy, o.amber, S, glow);
  if (o.column) o.column.material.uniforms.uGlow.value = glow;
  if (o.rotorMat) o.rotorMat.uniforms.uSpin.value = S * 0.34;
  return (
    <>
      {shadow > 0 && rise > 0 ? <SoftShadows items={[machineShadow(at, h, rise, shadow)]} y={y} /> : null}
      <primitive object={o.group} />
    </>
  );
};

export type FieldMachine = { at: [number, number]; h?: number; rise?: number; y?: number; phase?: number };
/** Many solid machines (one draw, one shared shadow layer, a slot opening under each while it rises). */
export const CentrifugeField: React.FC<{ items: FieldMachine[]; S: number; y?: number; shadow?: number; tone?: "clay" | "clayDim" }> = ({ items, S, y = 0, shadow = 1, tone = "clay" }) => {
  const n = items.length;
  const o = useMemo(() => {
    const geo = centrifugeParts().solid.clone();
    const ph = new Float32Array(Math.max(1, n));
    for (let i = 0; i < n; i++) ph[i] = hash01(i + 31) * 6.283;
    geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(ph, 1));
    const mat = makeClay(tone === "clayDim" ? 1 : 0);
    const me = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
    me.frustumCulled = false;
    me.renderOrder = 1;
    return { me, mat };
  }, [n, tone]);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const Sc = new THREE.Vector3();
  const Pp = new THREE.Vector3();
  items.forEach((it, i) => {
    const h = it.h ?? CENTRIFUGE.H;
    const r = it.rise ?? 1;
    Sc.set(h, h, h);
    Pp.set(it.at[0], (it.y ?? y) - (1 - r) * h * RISE_SINK, -it.at[1]);
    M.compose(Pp, Q, Sc);
    o.me.setMatrixAt(i, M);
  });
  o.me.count = n;
  o.me.instanceMatrix.needsUpdate = true;
  o.mat.uniforms.uSpin.value = S * 0.34;
  const shadows: ShadowItem[] = [];
  for (const it of items) {
    const r = it.rise ?? 1;
    const h = it.h ?? CENTRIFUGE.H;
    if (r <= 0) continue;
    // the slot opens as a dark ring before the machine clears it
    shadows.push({ x: it.at[0], z: it.at[1], len: 0.001, r: h * CENTRIFUGE.R * 1.5 * smooth(0, 0.08, r), soft: h * CENTRIFUGE.R * 0.25, alpha: 1 });
    shadows.push(machineShadow(it.at, h, r, shadow));
  }
  return (
    <>
      {shadows.length ? <SoftShadows items={shadows} y={y} /> : null}
      <primitive object={o.me} />
    </>
  );
};

// ===================================================================================================================
// THE WORLD SLAB. Land from world-atlas 50m as one thick cream clay card lifted off the board; the seas are the bare
// board. Equal Earth centred on lon 10, WORLD_MAP_WIDTH units over lon -130..150 at the equator.
// Geometry and bevel textures are built once per page and cached.
// ===================================================================================================================
export const WORLD_MAP_WIDTH = 1000;
export const WORLD_SLAB = { T: 3.4, RAISE: 2.6, PPU: 3.2 } as const;
/** The land's top surface: slabTop() for ordinary land, slabTop(hi) for a highlighted country at 0..1. */
export const slabTop = (hi = 0) => WORLD_SLAB.T + WORLD_SLAB.RAISE * hi;
const proj = (() => {
  const p = geoEqualEarth().rotate([-10, 0]).scale(1).translate([0, 0]).precision(0.2);
  const span = p([150, 0])[0] - p([-130, 0])[0];
  p.scale(WORLD_MAP_WIDTH / span);
  const c = p([10, 16]);
  p.translate([-c[0], -c[1]]);
  return p;
})();
/** lon, lat -> world [X, Z] */
export const mapProject = (lon: number, lat: number): [number, number] => {
  const q = proj([lon, lat]);
  return [q[0], -q[1]];
};
/** The tall map (Miller cylindrical): same width and centre as mapProject, but the high north keeps its height and Alaska
 *  its shape, so a map can fill a 9:16 frame. Use with <WorldSlab projection="tall">. */
const projTall = (() => {
  const p = geoProjection((l: number, f: number) => [l, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * f))]).rotate([-10, 0]).scale(1).translate([0, 0]).precision(0.2);
  const span = p([150, 0])[0] - p([-130, 0])[0];
  p.scale(WORLD_MAP_WIDTH / span);
  const c = p([10, 16]);
  p.translate([-c[0], -c[1]]);
  return p;
})();
/** lon, lat -> world [X, Z] on the tall map */
export const mapProjectTall = (lon: number, lat: number): [number, number] => {
  const q = projTall([lon, lat]);
  return [q[0], -q[1]];
};
export type SlabProjection = "equal-earth" | "tall";
/** ISO alpha-2 -> world-atlas numeric id */
export const ISO_NUM: Record<string, string> = {
  US: "840", RU: "643", GB: "826", FR: "250", DE: "276", NL: "528", CN: "156", JP: "392", PK: "586", IN: "356", IR: "364", BR: "076", AR: "032", ZA: "710", KP: "408", KR: "410", IQ: "368", IL: "376", AU: "036", CA: "124", ES: "724", IT: "380", UA: "804", KZ: "398", EG: "818", LY: "434", SE: "752", CH: "756", BE: "056", TR: "792", SA: "682", NO: "578", FI: "246", PL: "616", RO: "642", MX: "484", UZ: "860", NE: "562", NA: "516",
};
/** home bboxes: overseas territories (French Guiana, Reunion ...) stay plain land when their country lights up */
const HOME_BOX: Record<string, [number, number, number, number]> = {
  "250": [-6, 41, 10, 52],
  "528": [3, 50, 8, 54],
  "826": [-9, 49, 2, 61],
};
type Ring = [number, number][];
const ringArea = (r: Ring) => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};
const pointIn = (pt: [number, number], r: Ring) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if (r[i][1] > pt[1] !== r[j][1] > pt[1] && pt[0] < ((r[j][0] - r[i][0]) * (pt[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) inside = !inside;
  }
  return inside;
};
type LandData = { geo: Any; mask: Any; shadow: Any; box: [number, number, number, number]; ids: Map<string, number>; ms: number; verts: number };
const landCaches = new Map<string, LandData>();
const buildLand = (kind: SlabProjection, islandMin = 0.06): LandData => {
  const key = `${kind}:${islandMin}`;
  const have = landCaches.get(key);
  if (have) return have;
  const projection = kind === "tall" ? projTall : proj;
  const t0 = performance.now();
  const fc = feature(countries50 as Any, (countries50 as Any).objects.countries) as Any;
  const ids = new Map<string, number>();
  const pos: number[] = [];
  const nor: number[] = [];
  const top: number[] = [];
  const idA: number[] = [];
  const ua: number[] = [];
  const idx: number[] = [];
  const allRings: Ring[] = [];
  let nextId = 1;
  for (const f of fc.features) {
    const cid = String(f.id ?? "");
    if (cid === "010") continue; // Antarctica: off the crop
    const id = cid && !ids.has(cid) ? nextId++ : ids.get(cid) ?? nextId++;
    if (cid) ids.set(cid, id);
    const polys: Any[] = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    // first pass: this country's rings, for the west-east coordinate of its home polygons
    const made: { outer: Ring; holes: Ring[]; home: boolean }[] = [];
    for (const coords of polys) {
      const rings: Ring[] = [];
      let cur: Ring | null = null;
      const ctx = {
        beginPath() {},
        moveTo(x: number, y: number) {
          cur = [[x, -y]];
          rings.push(cur);
        },
        lineTo(x: number, y: number) {
          if (cur) cur.push([x, -y]);
        },
        closePath() {},
        arc() {},
      };
      geoPath(projection, ctx)({ type: "Polygon", coordinates: coords });
      if (!rings.length) continue;
      const clean = rings
        .map((r) => {
          const out: Ring = [];
          for (const p of r) {
            const l = out[out.length - 1];
            if (!l || Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.02) out.push(p);
          }
          if (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 0.02) out.pop();
          return out;
        })
        .filter((r) => r.length >= 3 && Math.abs(ringArea(r)) > islandMin);
      if (!clean.length) continue;
      clean.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
      const sign = Math.sign(ringArea(clean[0]));
      const outers: { outer: Ring; holes: Ring[] }[] = [];
      for (const r of clean) {
        if (Math.sign(ringArea(r)) === sign) outers.push({ outer: r, holes: [] });
        else {
          const host = outers.find((o) => pointIn(r[0], o.outer));
          if (host) host.holes.push(r);
        }
      }
      const home = HOME_BOX[cid];
      const lonlat0 = coords[0][0];
      const isHome = !home || (lonlat0[0] >= home[0] && lonlat0[0] <= home[2] && lonlat0[1] >= home[1] && lonlat0[1] <= home[3]);
      for (const o of outers) made.push({ ...o, home: isHome });
    }
    let minX = 1e9;
    let maxX = -1e9;
    for (const m of made) {
      if (!m.home) continue;
      for (const p of m.outer) {
        minX = Math.min(minX, p[0]);
        maxX = Math.max(maxX, p[0]);
      }
    }
    const span = Math.max(1, maxX - minX);
    for (const m of made) {
      const vid = m.home ? id : 0;
      const uOf = (x: number) => (m.home ? c01((x - minX) / span) : 0);
      // cap
      const contour = m.outer.map((p) => new THREE.Vector2(p[0], p[1]));
      const holes = m.holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
      const faces = THREE.ShapeUtils.triangulateShape(contour, holes);
      const base = pos.length / 3;
      const flat = [m.outer, ...m.holes].flat();
      for (const p of flat) {
        pos.push(p[0], 0, -p[1]);
        nor.push(0, 1, 0);
        top.push(1);
        idA.push(vid);
        ua.push(uOf(p[0]));
      }
      for (const fa of faces) idx.push(base + fa[0], base + fa[1], base + fa[2]);
      // walls
      for (const r of [m.outer, ...m.holes]) {
        allRings.push(r);
        const b = pos.length / 3;
        const n = r.length;
        for (let i = 0; i <= n; i++) {
          const p = r[i % n];
          const prev = r[(i - 1 + n) % n];
          const next = r[(i + 1) % n];
          const dx = next[0] - prev[0];
          const dz = next[1] - prev[1];
          const l = Math.hypot(dx, dz) || 1;
          for (const tt of [0, 1]) {
            pos.push(p[0], 0, -p[1]);
            nor.push(dz / l, 0, dx / l);
            top.push(tt + 2); // 2 foot, 3 top: walls
            idA.push(vid);
            ua.push(uOf(p[0]));
          }
        }
        for (let i = 0; i < n; i++) {
          const a = b + i * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
    }
    // the land mask draws everything; a country's rings are in allRings
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("aTop", new THREE.BufferAttribute(new Float32Array(top), 1));
  g.setAttribute("aId", new THREE.BufferAttribute(new Float32Array(idA), 1));
  g.setAttribute("aU", new THREE.BufferAttribute(new Float32Array(ua), 1));
  g.setIndex(idx);
  // bevel mask and shadow textures: canvas row 0 = minZ
  let minX = 1e9;
  let maxX = -1e9;
  let minZ = 1e9;
  let maxZ = -1e9;
  for (const r of allRings)
    for (const p of r) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[1]);
      maxZ = Math.max(maxZ, p[1]);
    }
  const pad = 30;
  minX -= pad;
  maxX += pad;
  minZ -= pad;
  maxZ += pad;
  const bw = maxX - minX;
  const bh = maxZ - minZ;
  const raster = (ppu: number, blur: number) => {
    const cw = Math.min(8192, Math.ceil(bw * ppu));
    const ch = Math.min(4096, Math.ceil(bh * ppu));
    const a = document.createElement("canvas");
    a.width = cw;
    a.height = ch;
    const ctx = a.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    for (const r of allRings) {
      r.forEach((p, i) => {
        const x = ((p[0] - minX) / bw) * cw;
        const y = ((p[1] - minZ) / bh) * ch;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fill("evenodd");
    const o = document.createElement("canvas");
    o.width = cw;
    o.height = ch;
    const oc = o.getContext("2d") as CanvasRenderingContext2D;
    oc.filter = `blur(${blur}px)`;
    oc.drawImage(a, 0, 0);
    const t = new THREE.CanvasTexture(o);
    t.flipY = false;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  const mask = raster(WORLD_SLAB.PPU, WORLD_SLAB.PPU * 1.25);
  const shadow = raster(1.6, 1.6 * 2.6);
  const made: LandData = { geo: g, mask, shadow, box: [minX, minZ, bw, bh], ids, ms: performance.now() - t0, verts: pos.length / 3 };
  landCaches.set(key, made);
  return made;
};
const LAND_VERT = /* glsl */ `
attribute float aTop;
attribute float aId;
attribute float aU;
uniform float uHi[260];
uniform float uT;
uniform float uRaise;
varying vec3 vW;
varying vec3 vN;
varying float vWall;
varying float vH;
varying float vHi;
varying float vUw;
varying vec2 vLoc;
void main() {
  vLoc = vec2(position.x, -position.z);
  float wall = step(1.5, aTop);
  float tp = wall > 0.5 ? aTop - 2.0 : 1.0;
  float hi = uHi[int(aId + 0.5)];
  float rs = smoothstep(0.0, 0.6, hi);
  vec3 p = position;
  p.y = tp * (uT + uRaise * rs);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normal;
  vWall = wall;
  vH = tp;
  vHi = hi;
  vUw = aU;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LAND_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uMask;
uniform vec4 uBox;
uniform float uBevel;
uniform float uDim;
varying vec3 vW;
varying vec3 vN;
varying float vWall;
varying float vH;
varying float vHi;
varying float vUw;
varying vec2 vLoc;
void main() {
  vec2 p = vLoc;
  vec2 uv = (p - uBox.xy) / uBox.zw;
  vec2 e = 1.0 / vec2(textureSize(uMask, 0));
  float mx = texture2D(uMask, uv + vec2(e.x, 0.0)).r - texture2D(uMask, uv - vec2(e.x, 0.0)).r;
  float mz = texture2D(uMask, uv + vec2(0.0, e.y)).r - texture2D(uMask, uv - vec2(0.0, e.y)).r;
  float m = texture2D(uMask, uv).r;
  vec3 V = normalize(cameraPosition - vW);
  vec3 n;
  float wall = vWall;
  if (wall > 0.5) {
    n = normalize(vN);
    if (dot(n, V) < 0.0) n = -n;
    vec3 toView = normalize(vec3(V.x, 0.0, V.z));
    n = normalize(mix(n, toView, 0.8) + vec3(0.0, 0.9 * smoothstep(0.35, 1.0, vH) + 0.05, 0.0));
  } else {
    n = normalize(vec3(-mx * uBevel, 1.0, mz * uBevel));
    // the top's soft clay surface: broad dents and a fine tooth, gone before they alias
    float pxs = length(fwidth(p));
    float dA = 0.012 * (vn((p + vec2(0.4, 0.0)) * 0.23) - vn((p - vec2(0.4, 0.0)) * 0.23));
    float dB = 0.012 * (vn((p + vec2(0.0, 0.4)) * 0.23) - vn((p - vec2(0.0, 0.4)) * 0.23));
    float fA = 0.05 * (vn((p + vec2(0.1, 0.0)) * 3.1) - vn((p - vec2(0.1, 0.0)) * 3.1));
    float fB = 0.05 * (vn((p + vec2(0.0, 0.1)) * 3.1) - vn((p - vec2(0.0, 0.1)) * 3.1));
    float vis = 1.0 - smoothstep(0.1, 0.6, pxs);
    n = normalize(n + vec3(dA + fA * vis, 0.0, dB + fB * vis) * 3.0);
  }
  vec2 q = p * 0.05;
  float mott = vn(q) * 0.6 + vn(q * 3.1) * 0.4;
  vec3 base = mix(uCreamFoot, uCream, 0.55 + 0.45 * mott);
  base = mix(base, uBoardTone, uDim);
  vec3 col = clayShade(base, n, V);
  if (wall > 0.5) col *= mix(0.62, 1.0, smoothstep(0.0, 0.8, vH));
  // the country's tone warms from west to east across it (amber is uranium: flat key, no pulse)
  float w = vHi * 1.42;
  float tone = smoothstep(vUw, vUw + 0.42, w);
  if (tone > 0.001) {
    float lit = smoothstep(-0.3, 0.9, dot(n, uL));
    vec3 amb = mix(uAmberFoot, uAmberTop, 0.35 + 0.65 * lit);
    if (wall > 0.5) amb *= mix(0.72, 0.96, vH);
    col = mix(col, amb, tone);
  }
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 0.0);
}`;
/** How long the slab took to build on this page (ms), for the stage's performance notes. */
export const worldSlabBuildMs = (kind: SlabProjection = "equal-earth", islandMin = 0.06) => landCaches.get(`${kind}:${islandMin}`)?.ms ?? -1;
/** Land as a lifted clay card. highlight: { ISO alpha-2 or numeric id: 0..1 } raises the country and warms it to amber. */
export const WorldSlab: React.FC<{
  highlight?: Record<string, number>;
  dim?: number;
  shadow?: number;
  /** scale the land in plan about a world point: a low camera on a bare floor sees no coast until m falls to 1. */
  zoomAbout?: { x: number; z: number; m: number };
  /** "equal-earth" (default, mapProject) or "tall" (mapProjectTall) */
  projection?: SlabProjection;
  /** islands smaller than this (square world units) are left out; their walls read as spikes from a low camera */
  islandMin?: number;
}> = ({ highlight, dim = 0, shadow = 1, zoomAbout, projection = "equal-earth", islandMin = 0.06 }) => {
  const floorRef = React.useContext(FloorCtx);
  const o = useMemo(() => {
    const d = buildLand(projection, islandMin);
    const mat = new THREE.ShaderMaterial({
      vertexShader: LAND_VERT,
      fragmentShader: LAND_FRAG,
      side: THREE.DoubleSide,
      blending: THREE.NoBlending,
      uniforms: {
        ...U,
        uHi: { value: new Float32Array(260) },
        uT: { value: WORLD_SLAB.T },
        uRaise: { value: WORLD_SLAB.RAISE },
        uMask: { value: d.mask },
        uBox: { value: new THREE.Vector4(d.box[0], d.box[1], d.box[2], d.box[3]) },
        uBevel: { value: 13 },
        uDim: { value: 0 },
      },
    });
    const me = new THREE.Mesh(d.geo, mat);
    me.frustumCulled = false;
    me.renderOrder = -90;
    return { d, mat, me };
  }, [projection, islandMin]);
  const hi = o.mat.uniforms.uHi.value as Float32Array;
  hi.fill(0);
  if (highlight) {
    for (const k of Object.keys(highlight)) {
      const id = o.d.ids.get(ISO_NUM[k] ?? k);
      if (id !== undefined) hi[id] = c01(highlight[k]);
    }
  }
  o.mat.uniforms.uDim.value = dim;
  const zx = zoomAbout?.x ?? 0;
  const zz = zoomAbout?.z ?? 0;
  const zm = zoomAbout?.m ?? 1;
  o.me.scale.set(zm, 1, zm);
  o.mat.uniforms.uBevel.value = 13 / zm;
  o.me.position.set(zx * (1 - zm), 0, -zz * (1 - zm));
  const fm = floorRef?.current;
  if (fm) {
    fm.uniforms.uHasLand.value = shadow > 0 ? 1 : 0;
    fm.uniforms.uLandShadow.value = o.d.shadow;
    fm.uniforms.uLandZoom.value.set(zx, zz, zm);
    fm.uniforms.uLandBox.value.set(o.d.box[0], o.d.box[1], o.d.box[2], o.d.box[3]);
    const l = (WORLD_SLAB.T + 1.5) * SHADOW_LEN * 1.5;
    fm.uniforms.uLandOff.value.set(SHADOW_DIR[0] * l, SHADOW_DIR[1] * l);
  }
  return <primitive object={o.me} />;
};
