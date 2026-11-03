// energyDataCenter: the data center (a long low hall, rooftop chillers with turning fans, a glass front showing rows of
// server racks with tiny cream status lights) and the power cable that rises out of its roof to a big two-prong plug.
// The cable is driven by its end point: give it the plug's face centre and the prongs' direction; it seats into a
// plinth's socket at socketOf(kind). `current` 0..1 runs amber from the plug back to the hall; DataCenter `lit` 0..1
// turns the racks' lights amber in a wave from the cable's side.
import React, { useMemo } from "react";
import { SHADOW_DIR, SHADOW_LEN, SoftShadows, nuclearMaterial, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import {
  COMMON_GLSL,
  EW_COLOR,
  THREE,
  box,
  c01,
  energyClay,
  flipZ,
  hash01,
  lathe,
  merge,
  mesh,
  rbox,
  sharedUniforms,
  smooth,
  vec3Of,
  type Any,
  type V3,
} from "./energyCore";

// ===================================================================================================================
// THE HALL. Local: origin at the footprint's centre on the board, x across, z away (world), y up.
// ===================================================================================================================
export const DC = { W: 400, D: 150, H: 90 } as const;
/** the hall's footprint centre on the board, world [X, Z] (in front of the row, toward the camera) */
export const DC_AT: [number, number] = [-10, -1250];
const GLAND = { x: -40, z: DC.D / 2 - 20, r: 13, h: 12 } as const;
/** where the cable leaves the roof (world): the top of the cable gland */
export const DC_OUTLET: V3 = [DC_AT[0] + GLAND.x, DC.H + GLAND.h, DC_AT[1] + GLAND.z];
const RACK = { w: 21, h: 62, d: 28, gap: 1.5, perPod: 5, aisle: 16, rows: [-DC.D / 2 + 30, -DC.D / 2 + 70, -DC.D / 2 + 110] } as const;
const CHILLERS = { xs: [-140, -70, 0, 70, 140], zs: [-36, 16], w: 46, h: 13, d: 36 } as const;

const hallParts = () => {
  const { W, D, H } = DC;
  const parts: Any[] = [];
  // shell: back wall, side walls, roof slab with a parapet
  parts.push(box(W, H - 8, 6, 0, 0, D / 2 - 3, EW_COLOR.cream));
  for (const s of [-1, 1]) parts.push(box(6, H - 8, D, s * (W / 2 - 3), 0, 0, EW_COLOR.cream));
  parts.push(rbox(W + 8, 9, D + 8, 0, H - 9, 0, 2.5, EW_COLOR.cream));
  parts.push(box(W + 8, 4.5, 3, 0, H, -(D / 2 + 2.5), EW_COLOR.cream));
  parts.push(box(W + 8, 4.5, 3, 0, H, D / 2 + 2.5, EW_COLOR.cream));
  for (const s of [-1, 1]) parts.push(box(3, 4.5, D + 8, s * (W / 2 + 2.5), H, 0, EW_COLOR.cream));
  // the front: kick plate, fascia, mullions (the glass is its own mesh)
  parts.push(box(W, 8, 7, 0, 0, -D / 2 + 3.5, EW_COLOR.cream));
  parts.push(box(W, 13, 7, 0, H - 22, -D / 2 + 3.5, EW_COLOR.cream));
  const nM = 8;
  for (let i = 1; i < nM; i++) parts.push(box(3.2, H - 30, 4.5, -W / 2 + (i * W) / nM, 8, -D / 2 + 3.2, EW_COLOR.creamFoot));
  // the inside: a dim floor and lining, so the racks and their lights read
  parts.push(box(W - 12, 1, D - 10, 0, 0, 0, EW_COLOR.hollow));
  parts.push(box(W - 12, H - 10, 1, 0, 0, D / 2 - 6.6, EW_COLOR.hollow));
  for (const s of [-1, 1]) parts.push(box(1, H - 10, D - 10, s * (W / 2 - 6.6), 0, 0, EW_COLOR.hollow));
  // server racks: three rows of pods
  const racks: { x: number; z: number }[] = [];
  const podW = RACK.perPod * (RACK.w + RACK.gap) - RACK.gap;
  const nPods = 3;
  const span = nPods * podW + (nPods - 1) * RACK.aisle;
  for (const rz of RACK.rows)
    for (let p = 0; p < nPods; p++)
      for (let i = 0; i < RACK.perPod; i++) {
        const x = -span / 2 + p * (podW + RACK.aisle) + i * (RACK.w + RACK.gap) + RACK.w / 2;
        parts.push(box(RACK.w, RACK.h, RACK.d, x, 1, rz, EW_COLOR.rack));
        racks.push({ x, z: rz });
      }
  // rooftop chillers: cream units, two fan wells each
  for (const cz of CHILLERS.zs)
    for (const cx of CHILLERS.xs) {
      parts.push(rbox(CHILLERS.w, CHILLERS.h, CHILLERS.d, cx, H, cz, 2.2, EW_COLOR.cream));
      for (const fx of [-11, 11]) parts.push(lathe([[11.6, H + CHILLERS.h + 0.05], [11.6, H + CHILLERS.h - 2], [0.001, H + CHILLERS.h - 2]], 28, EW_COLOR.creamFoot).translate(cx + fx, 0, cz));
    }
  // the cable gland
  parts.push(lathe([[GLAND.r + 3, H], [GLAND.r + 3, H + 3], [GLAND.r, H + 4], [GLAND.r, H + GLAND.h - 2], [GLAND.r - 2, H + GLAND.h], [0.001, H + GLAND.h]], 32, EW_COLOR.cream).translate(GLAND.x, 0, GLAND.z));
  return { geo: flipZ(merge(parts)), racks };
};

// the lights: one plane per rack front; columns of tiny LEDs, a few blinking slowly; cream, amber when `lit` reaches it
const LIGHT_VERT = /* glsl */ `
attribute float aU; attribute float aSeed;
varying vec2 vUv; varying float vU; varying float vSeed; varying vec3 vW;
void main() { vUv = uv; vU = aU; vSeed = aSeed; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const LIGHT_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uS; uniform float uLit; uniform vec3 uRack; uniform vec3 uLed;
varying vec2 vUv; varying float vU; varying float vSeed; varying vec3 vW;
void main() {
  // the rack's face: a slightly lighter door with a dark vent band
  vec3 col = uRack * 1.08;
  vec2 g = vec2(vUv.x * 3.0, vUv.y * 14.0);
  vec2 cellId = floor(g);
  vec2 f = fract(g);
  float h = h21(cellId + vSeed * 31.0);
  float led = (1.0 - smoothstep(0.16, 0.26, abs(f.x - 0.3))) * (1.0 - smoothstep(0.12, 0.22, abs(f.y - 0.5)));
  float on = step(0.22, h);
  float blink = step(0.82, h) * step(0.5, fract(uS / (38.0 + 40.0 * h) + h));
  on *= 1.0 - blink * 0.85;
  float inBay = step(0.06, vUv.y) * step(vUv.y, 0.94);
  float amber = smoothstep(vU - 0.12, vU + 0.02, uLit * 1.14 - 0.02);
  vec3 ledCol = mix(uLed, mix(uAmberTop, uAmberHot, 0.35), amber);
  col = mix(col, ledCol, led * on * inBay);
  // a soft halo round each lit led
  float halo = (1.0 - smoothstep(0.0, 0.5, length((f - vec2(0.3, 0.5)) * vec2(1.0, 0.6)))) * on * inBay;
  col = mix(col, ledCol, 0.18 * halo);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
const lightGeo = (racks: { x: number; z: number }[]) => {
  const list: Any[] = [];
  racks.forEach((r, i) => {
    const g = new THREE.PlaneGeometry(RACK.w - 3, RACK.h - 6);
    g.rotateY(Math.PI);
    g.translate(r.x, 1 + RACK.h / 2, r.z - RACK.d / 2 - 0.25);
    const n = g.attributes.position.count;
    // the wave starts at the cable's side of the hall (the gland's x) and runs both ways
    const u = Math.abs(r.x - GLAND.x) / (DC.W / 2 + Math.abs(GLAND.x)) * 0.8 + ((r.z - RACK.rows[0]) / (RACK.rows[2] - RACK.rows[0])) * 0.2;
    g.setAttribute("aU", new THREE.BufferAttribute(new Float32Array(n).fill(c01(u)), 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(n).fill(hash01(i + 3)), 1));
    list.push(g.toNonIndexed());
  });
  const total = list.reduce((s: number, g: Any) => s + g.attributes.position.count, 0);
  const out = new THREE.BufferGeometry();
  for (const [name, size] of [["position", 3], ["normal", 3], ["uv", 2], ["aU", 1], ["aSeed", 1]] as const) {
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const g of list) {
      arr.set(g.attributes[name].array, o);
      o += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return flipZ(out);
};
// the fans: a disc in each well, four broad blades turning
const FAN_VERT = /* glsl */ `
attribute float aPh;
varying vec2 vUv; varying float vPh; varying vec3 vW;
void main() { vUv = uv; vPh = aPh; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const FAN_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uS; uniform vec3 uWell; uniform vec3 uBlade;
varying vec2 vUv; varying float vPh; varying vec3 vW;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x) + uS * 0.21 + vPh * 6.28318;
  float blade = smoothstep(0.35, 0.7, cos(a * 4.0 - r * 1.2)) * step(0.2, r) * (1.0 - smoothstep(0.86, 0.92, r));
  vec3 col = mix(uWell, uBlade, blade * 0.85);
  col = mix(col, uBlade, 1.0 - smoothstep(0.14, 0.2, r));
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
const fanGeo = () => {
  const list: Any[] = [];
  let k = 0;
  for (const cz of CHILLERS.zs)
    for (const cx of CHILLERS.xs)
      for (const fx of [-11, 11]) {
        const g = new THREE.PlaneGeometry(21, 21);
        g.rotateX(-Math.PI / 2);
        g.translate(cx + fx, DC.H + CHILLERS.h - 1.6, cz);
        g.setAttribute("aPh", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(hash01(k++ + 50)), 1));
        list.push(g.toNonIndexed());
      }
  const total = list.reduce((s: number, g: Any) => s + g.attributes.position.count, 0);
  const out = new THREE.BufferGeometry();
  for (const [name, size] of [["position", 3], ["normal", 3], ["uv", 2], ["aPh", 1]] as const) {
    const arr = new Float32Array(total * size);
    let o = 0;
    for (const g of list) {
      arr.set(g.attributes[name].array, o);
      o += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  }
  return flipZ(out);
};
let hallCache: { geo: Any; lights: Any; fans: Any; glass: Any } | null = null;
const hallGeos = () => {
  if (hallCache) return hallCache;
  const h = hallParts();
  const glass = new THREE.PlaneGeometry(DC.W - 6, DC.H - 30);
  glass.rotateY(Math.PI);
  glass.translate(0, 8 + (DC.H - 30) / 2, -DC.D / 2 + 3.2);
  hallCache = { geo: h.geo, lights: lightGeo(h.racks), fans: fanGeo(), glass: flipZ(glass) };
  return hallCache;
};
/** the hall's one board shadow (world) */
export const dataCenterShadowItems = (alpha = 1): ShadowItem[] => {
  const out: ShadowItem[] = [];
  const r = 30;
  const nx = 12;
  const nz = 5;
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      if (i > 0 && i < nx - 1 && j > 0 && j < nz - 1) continue;
      out.push({ x: DC_AT[0] - DC.W / 2 + 22 + (i * (DC.W - 44)) / (nx - 1), z: DC_AT[1] - DC.D / 2 + 22 + (j * (DC.D - 44)) / (nz - 1), len: DC.H * SHADOW_LEN, r, soft: 12, alpha });
    }
  return out;
};
export type DataCenterProps = {
  S: number;
  /** 0..1: the racks' lights go amber in a wave from the cable's side */
  lit?: number;
  dim?: number;
  shadow?: boolean;
};
export const DataCenter: React.FC<DataCenterProps> = ({ S, lit = 0, dim = 0, shadow = true }) => {
  const o = useMemo(() => {
    const g = hallGeos();
    // contact shadows of the chillers and the gland on the roof
    const occ = [];
    for (const cz of CHILLERS.zs) for (const cx of CHILLERS.xs) for (const dx of [-12, 12]) occ.push({ x: DC_AT[0] + cx + dx, z: DC_AT[1] + cz, len: CHILLERS.h * SHADOW_LEN * 1.4, r: 15 });
    occ.push({ x: DC_AT[0] + GLAND.x, z: DC_AT[1] + GLAND.z, len: GLAND.h * SHADOW_LEN * 1.4, r: GLAND.r });
    const mat = energyClay(occ, DC.H);
    const body = mesh(g.geo, mat, 1);
    const lm = new THREE.ShaderMaterial({ vertexShader: LIGHT_VERT, fragmentShader: LIGHT_FRAG, uniforms: { ...sharedUniforms(), uS: { value: 0 }, uLit: { value: 0 }, uRack: { value: vec3Of(EW_COLOR.rack) }, uLed: { value: vec3Of(EW_COLOR.cream) } } });
    const lights = mesh(g.lights, lm, 2);
    const fm = new THREE.ShaderMaterial({ vertexShader: FAN_VERT, fragmentShader: FAN_FRAG, uniforms: { ...sharedUniforms(), uS: { value: 0 }, uWell: { value: vec3Of(EW_COLOR.well) }, uBlade: { value: vec3Of(EW_COLOR.board) } } });
    const fans = mesh(g.fans, fm, 2);
    const glass = mesh(g.glass, nuclearMaterial("glass"), 8);
    for (const m of [body, lights, fans, glass]) m.position.set(DC_AT[0], 0, -DC_AT[1]);
    return { body, mat, lights, lm, fans, fm, glass };
  }, []);
  o.mat.uniforms.uDim.value = c01(dim);
  o.lm.uniforms.uS.value = S;
  o.lm.uniforms.uLit.value = c01(lit);
  o.fm.uniforms.uS.value = S;
  return (
    <>
      {shadow ? <SoftShadows items={dataCenterShadowItems()} /> : null}
      <primitive object={o.body} />
      <primitive object={o.lights} />
      <primitive object={o.fans} />
      <primitive object={o.glass} />
    </>
  );
};

// ===================================================================================================================
// THE PLUG AND CABLE
// ===================================================================================================================
/** the plug: local +Y = the prongs' direction, y = 0 its face. LEN = face to the cable's root; PRONG = pin length. */
export const PLUG = { R: 25, LEN: 96, PRONG: 27, PIN_DX: 10, PIN_R: 4.2 } as const;
export const CABLE_R = 7;
let plugCache: Any = null;
const plugGeo = () => {
  if (plugCache) return plugCache;
  const R = PLUG.R;
  const body = lathe(
    [
      [0.001, 0], [R - 1.5, 0], [R - 0.3, -0.8], [R, -2.4], [R + 0.6, -6], [R + 1, -12],
      [R + 1, -15], [R - 0.4, -16.6], [R + 1, -18.2], [R + 1, -22], [R - 0.4, -23.6], [R + 1, -25.2], [R + 1, -29], [R - 0.4, -30.6], [R + 1, -32.2],
      [R + 1, -40], [R - 1, -48], [R - 5, -54], [R - 9.5, -58.5], [11.5, -61], [11.5, -63], [10, -70], [8.6, -79], [CABLE_R + 0.4, -88], [CABLE_R, -PLUG.LEN],
    ],
    48,
    EW_COLOR.cream,
  );
  const pins = [-1, 1].map((s) => {
    const p = lathe([[PLUG.PIN_R, -1], [PLUG.PIN_R, PLUG.PRONG - 3], [PLUG.PIN_R - 0.6, PLUG.PRONG - 0.8], [PLUG.PIN_R - 2, PLUG.PRONG + 0.2], [0.001, PLUG.PRONG + 0.5]], 20, EW_COLOR.board);
    p.translate(s * PLUG.PIN_DX, 0, 0);
    return p;
  });
  // a shallow collar on the face round the pins
  const collar = lathe([[R - 5, 0.01], [R - 5, 1.2], [R - 6.4, 1.8], [0.001, 1.8]], 48, EW_COLOR.creamFoot);
  plugCache = merge([body, collar, ...pins]);
  return plugCache;
};
const CABLE_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() { vU = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }`;
const CABLE_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uCurrent; uniform float uLen;
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  vec3 col = clayShade(uCream, n, V);
  // the current: amber from the plug end (u = 1) back toward the hall, a hot front
  float front = 1.0 - uCurrent;
  float w = 24.0 / uLen;
  float a = uCurrent > 0.001 ? smoothstep(front - w * 0.5, front + w * 0.5, vU.x) : 0.0;
  float lit = smoothstep(-0.5, 0.9, dot(n, uL));
  vec3 amb = mix(uAmberFoot, uAmberTop, lit);
  amb = mix(amb, uAmberHot, 0.45 * pow(max(n.y, 0.0), 5.0));
  float hot = uCurrent > 0.001 && uCurrent < 0.999 ? exp(-pow((vU.x - front) / (w * 0.9), 2.0)) : 0.0;
  amb = mix(amb, uAmberHot, 0.55 * hot);
  col = mix(col, amb, a);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;
const toThree = (p: V3) => new THREE.Vector3(p[0], p[1], -p[2]);
const norm3 = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
export type CablePath = { from: V3; end: V3; dir: V3; lead?: number; drape?: [number, number] };
const bez = (p0: V3, p1: V3, p2: V3, p3: V3, n: number, skipFirst: boolean): V3[] => {
  const out: V3[] = [];
  for (let i = skipFirst ? 1 : 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const e = t ** 3;
    out.push([0, 1, 2].map((k) => a * p0[k] + b * p1[k] + c * p2[k] + e * p3[k]) as V3);
  }
  return out;
};
/** the cable's centre line (world points, gland -> plug root): up out of the roof's gland, over the hall's back edge
 *  onto the board, along the board toward the row, then lifting off the board into the plug's tail. */
export const cablePoints = ({ from, end, dir, lead, drape = [0.42, 0.32] }: CablePath, n = 120): V3[] => {
  const d = norm3(dir);
  const tail: V3 = [end[0] - d[0] * PLUG.LEN, end[1] - d[1] * PLUG.LEN, end[2] - d[2] * PLUG.LEN];
  const h = Math.max(0, tail[1] - CABLE_R);
  const r = CABLE_R;
  // it leaves the plug's tail and hangs down beside it (away from the prongs, a little toward the hall) to the board
  const hl = Math.hypot(d[0], d[2]);
  const hx = hl > 0.2 ? [d[0] / hl, d[2] / hl] : [0, 1];
  const lift: V3 = [tail[0] - hx[0] * (20 + h * drape[0]), r, tail[2] - hx[1] * (20 + h * drape[0]) - (30 + h * drape[1])];
  const touch: V3 = [from[0], r, DC_AT[1] + DC.D / 2 + 70];
  const span = Math.hypot(lift[0] - touch[0], lift[2] - touch[2]);
  // on the board it arrives at the lift point heading back under the plug
  const bv = [tail[0] - lift[0], tail[2] - lift[2] + 40];
  const bl = Math.hypot(bv[0], bv[1]) || 1;
  const bdir: [number, number] = [bv[0] / bl, bv[1] / bl];
  const n1 = Math.round(n * 0.18);
  const n2 = Math.round(n * 0.42);
  const n3 = n - n1 - n2;
  const seg1 = bez(from, [from[0], from[1] + 70, from[2]], [touch[0], r, touch[2] - 70], touch, n1, false);
  const seg2 = bez(touch, [touch[0], r, touch[2] + span * 0.45], [lift[0] - bdir[0] * span * 0.45, r, lift[2] - bdir[1] * span * 0.45], lift, n2, true);
  const ld = lead ?? 24 + h * 0.3;
  const seg3 = bez(lift, [lift[0] + bdir[0] * (10 + h * 0.22), r, lift[2] + bdir[1] * (10 + h * 0.22)], [tail[0] - d[0] * ld, tail[1] - d[1] * ld, tail[2] - d[2] * ld], tail, n3, true);
  return [...seg1, ...seg2, ...seg3];
};
export type PowerCableProps = {
  /** the plug's face centre (world): where the prongs start. Seated = socketOf(kind).pos */
  end: V3;
  /** the prongs' direction (world, any length). Seated = socketOf(kind).dir */
  dir: V3;
  /** the plug's roll about its axis (degrees); 0 = prongs side by side, level */
  roll?: number;
  /** 0..1: amber current from the plug back along the cable to the hall */
  current?: number;
  /** the cable's root (default the hall's gland, DC_OUTLET) */
  from?: V3;
  /** how far the cable runs straight out of the plug's tail before it droops (world units; default from its height) */
  lead?: number;
  /** where the hanging run meets the board, per unit of the plug's height: [beside the tail, toward the hall]; default [0.42, 0.32] */
  drape?: [number, number];
  shadow?: boolean;
};
/** the thick cream cable out of the data center's roof, ending in the plug */
export const PowerCable: React.FC<PowerCableProps> = ({ end, dir, roll = 0, current = 0, from = DC_OUTLET, lead, drape, shadow = true }) => {
  const o = useMemo(() => {
    const cm = new THREE.ShaderMaterial({ vertexShader: CABLE_VERT, fragmentShader: CABLE_FRAG, uniforms: { ...sharedUniforms(), uCurrent: { value: 0 }, uLen: { value: 1000 } } });
    const cable = mesh(new THREE.BufferGeometry(), cm, 1);
    const pm = energyClay();
    const plug = mesh(plugGeo(), pm, 1);
    return { cable, cm, plug, pm, last: "" };
  }, []);
  const pts = cablePoints({ from, end, dir, lead, drape }, 160);
  const key = JSON.stringify([from, end, dir, lead, drape]);
  if (key !== o.last) {
    const curve = new THREE.CatmullRomCurve3(pts.map(toThree), false, "centripetal");
    const g = new THREE.TubeGeometry(curve, 320, CABLE_R, 18, false);
    o.cable.geometry.dispose();
    o.cable.geometry = g;
    o.cm.uniforms.uLen.value = curve.getLength();
    o.last = key;
  }
  o.cm.uniforms.uCurrent.value = c01(current);
  // the plug's frame: +Y along the prongs, +X level (the pins side by side), then the roll
  const Y = toThree(norm3(dir)).normalize();
  let X = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), Y);
  if (X.lengthSq() < 1e-6) X = new THREE.Vector3(1, 0, 0);
  X.normalize();
  X.applyAxisAngle(Y, (roll * Math.PI) / 180);
  const Z = new THREE.Vector3().crossVectors(X, Y).normalize();
  const m = new THREE.Matrix4().makeBasis(X, Y, Z);
  o.plug.quaternion.setFromRotationMatrix(m);
  o.plug.position.copy(toThree(end));
  const items: ShadowItem[] = [];
  if (shadow) {
    // the cable and plug float: each sample throws a soft blob along the light by its height
    const L = SHADOW_LEN;
    for (let i = 8; i < pts.length; i++) {
      const p = pts[i];
      const h = p[1];
      items.push({ x: p[0] + SHADOW_DIR[0] * h * L, z: p[2] + SHADOW_DIR[1] * h * L, len: 2, r: CABLE_R * 1.05 + h * 0.02, soft: 3 + h * 0.04, alpha: 0.7 * (1 - smooth(300, 900, h)) });
    }
    const dd = norm3(dir);
    for (let i = 0; i <= 8; i++) {
      const t = (i / 8) * PLUG.LEN;
      const p: V3 = [end[0] - dd[0] * t, end[1] - dd[1] * t, end[2] - dd[2] * t];
      items.push({ x: p[0] + SHADOW_DIR[0] * p[1] * L, z: p[2] + SHADOW_DIR[1] * p[1] * L, len: 4, r: PLUG.R * 0.95 + p[1] * 0.015, soft: 6 + p[1] * 0.04, alpha: 0.8 * (1 - smooth(260, 900, p[1])) });
    }
  }
  return (
    <>
      {shadow ? <SoftShadows items={items} /> : null}
      <primitive object={o.cable} />
      <primitive object={o.plug} />
    </>
  );
};
