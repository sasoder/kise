// energyColumn: a glass column rising out of the slot in a plinth's apron (cut B), filled amber (nuclear) or cream /
// board tint (the others), with rungs. The glass and fill look is CompeteGlobally's (scott-nolan-uranium), copied.
import React, { useMemo } from "react";
import { SHADOW_LEN, nuclearMaterial, type ShadowItem } from "../scott-nolan-uranium/nuclearWorld";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { EW_COLOR, PLINTH, SLOT, THREE, slotOf, smooth, vec3Of, type PlantKind } from "./energyCore";

export const COLUMN = { R: SLOT.r - 5, CORNER: 8 } as const;
export type ColumnFill = "amber" | "cream";
const SHARED_GLSL = /* glsl */ `
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uCream;
uniform vec3 uBoardTone;
uniform vec3 uL;
uniform float uF;
float fogAt(vec3 w) { return smoothstep(uFogRange.x, uFogRange.y, length(w - cameraPosition)); }
`;
const VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
void main() {
  vL = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GLASS_FRAG = /* glsl */ `
${SHARED_GLSL}
uniform float uR;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float nv = abs(dot(n, V));
  float px = length(cameraPosition - vW) / uF;
  float wall = smoothstep(0.25, 0.6, 1.0 - abs(n.y));
  float edge = uR * (1.0 - sqrt(max(0.0, 1.0 - nv * nv))) / px;
  float hair = wall * (1.0 - smoothstep(1.3, 2.5, edge));
  float back = wall * (1.0 - smoothstep(2.5, 5.0, edge)) * (1.0 - hair);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), V));
  float s = dot(n, right);
  float streak = wall * smoothstep(0.58, 0.68, -s) * (1.0 - smoothstep(0.76, 0.84, -s)) * (1.0 - smoothstep(1.8, 3.2, 1.0 / px));
  float rim = (1.0 - wall) * pow(1.0 - nv, 2.0);
  vec3 col = mix(uCream, uBoardTone * 0.72, back);
  float a = 0.03 + 0.1 * streak + 0.9 * hair + 0.42 * back + 0.22 * rim;
  float fg = fogAt(vW);
  gl_FragColor = vec4(mix(col, uFogCol, fg), a * (1.0 - fg));
}`;
const FILL_FRAG = /* glsl */ `
${SHARED_GLSL}
uniform float uH;
uniform float uBase;
uniform float uRung;
uniform vec3 uTopC;
uniform vec3 uFootC;
uniform vec3 uHotC;
uniform float uRr;
varying vec3 vW;
varying vec3 vN;
varying vec3 vL;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  float px = length(cameraPosition - vW) / uF;
  float y = vW.y - uBase;
  float top = smoothstep(0.5, 0.95, n.y);
  float lit = smoothstep(-0.55, 0.95, dot(n, uL));
  float band = clamp(y / max(uH, 1.0), 0.0, 1.0);
  vec3 col = mix(uFootC, uTopC, 0.3 + 0.7 * mix(lit, band, 0.35));
  float dr = abs(y / uRung - floor(y / uRung + 0.5)) * uRung / px;
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), V));
  float side = smoothstep(0.1, 0.2, -dot(n, right));
  float rung = (1.0 - smoothstep(0.8, 1.7, dr)) * step(uRung * 0.5, y) * (1.0 - smoothstep(uH - px * 10.0, uH - px * 5.0, y)) * (1.0 - top) * side;
  col = mix(col, uFootC * 0.7, 0.6 * rung);
  float hotWall = smoothstep(uH - px * 2.6, uH - px * 0.6, y) * (1.0 - top);
  col = mix(col, uHotC, hotWall);
  float close = smoothstep(2.2, 4.0, 1.0 / px);
  float rr = length(vL.xz) / uRr;
  float hotTop = 0.45 + close * 0.5 * smoothstep(0.93, 0.995, rr);
  col = mix(col, mix(uTopC, uHotC, clamp(hotTop, 0.0, 1.0)), top);
  float fg = fogAt(vW);
  gl_FragColor = vec4(mix(col, uFogCol, fg), 1.0);
}`;
const FILLS: Record<ColumnFill, [string, string, string]> = {
  amber: [COLOR.amberTop, COLOR.amberFoot, COLOR.amberHot],
  cream: [EW_COLOR.cream, EW_COLOR.board, "#FFFFFF"],
};
const SLOT_FRAG = /* glsl */ `
varying vec2 vUv;
uniform vec3 uC;
uniform float uA;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  gl_FragColor = vec4(uC, uA * (1.0 - smoothstep(0.84, 1.0, r)));
}`;
const SLOT_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export type PlinthColumnProps = {
  /** which plinth's slot */
  kind: PlantKind;
  /** 0 sunk in the slot .. 1 standing (the slot opens as it starts) */
  rise: number;
  /** the glass's height above the plinth top (world units) */
  height: number;
  /** the fill's height above the plinth top (world units) */
  level: number;
  fill?: ColumnFill;
  /** cam.f, for the constant-width hairline */
  camF: number;
  /** world units per rung */
  rung?: number;
  /** draw order among several columns (0, 1, 2 ...) */
  order?: number;
};
export const PlinthColumn: React.FC<PlinthColumnProps> = ({ kind, rise, height, level, fill = "cream", camF, rung = 40, order = 0 }) => {
  const R = COLUMN.R;
  const o = useMemo(() => {
    const shared = nuclearMaterial("glass").uniforms;
    const glassU = { ...shared, uF: { value: 1 }, uR: { value: R } };
    const glassGeo = new THREE.LatheGeometry([new THREE.Vector2(R, 0), new THREE.Vector2(R, 1)], 96, 0, Math.PI * 2);
    const back = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.BackSide, uniforms: glassU }));
    const front = new THREE.Mesh(glassGeo, new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.FrontSide, uniforms: glassU }));
    const cap = new THREE.Mesh(new THREE.CircleGeometry(R, 96).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: glassU }));
    const [t, f, h] = FILLS[fill];
    const fillMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FILL_FRAG,
      uniforms: { ...shared, uF: { value: 1 }, uH: { value: 1 }, uBase: { value: 0 }, uRung: { value: 40 }, uTopC: { value: vec3Of(t) }, uFootC: { value: vec3Of(f) }, uHotC: { value: vec3Of(h) }, uRr: { value: R * 0.965 } },
    });
    const fillGeo = new THREE.CylinderGeometry(R * 0.965, R * 0.965, 1, 96, 1, false);
    fillGeo.translate(0, 0.5, 0);
    const amber = new THREE.Mesh(fillGeo, fillMat);
    const sg = new THREE.PlaneGeometry(1, 1);
    sg.rotateX(-Math.PI / 2);
    const slot = new THREE.Mesh(sg, new THREE.ShaderMaterial({ vertexShader: SLOT_VERT, fragmentShader: SLOT_FRAG, transparent: true, depthWrite: false, uniforms: { uC: { value: vec3Of(COLOR.shadow) }, uA: { value: 0.5 } } }));
    for (const m of [back, front, cap, amber, slot]) m.frustumCulled = false;
    return { back, front, cap, amber, slot, glassU, fillMat };
  }, [R, fill]);
  const [X, Z] = slotOf(kind);
  const base = PLINTH.H;
  o.glassU.uF.value = camF;
  o.fillMat.uniforms.uF.value = camF;
  o.fillMat.uniforms.uRung.value = rung;
  o.back.renderOrder = 3 + order;
  o.amber.renderOrder = 2;
  o.front.renderOrder = 12 + order;
  o.cap.renderOrder = 12 + order;
  o.slot.renderOrder = 1;
  const sink = (1 - rise) * (height + 8);
  for (const m of [o.back, o.front]) {
    m.scale.set(1, Math.max(0.01, height), 1);
    m.position.set(X, base - sink, -Z);
  }
  o.cap.position.set(X, base - sink + height, -Z);
  const lv = Math.max(0.01, Math.min(level, rise * height));
  o.amber.scale.set(1, lv, 1);
  o.amber.position.set(X, base, -Z);
  o.amber.visible = level > 0.02 && rise > 0;
  o.fillMat.uniforms.uH.value = lv;
  o.fillMat.uniforms.uBase.value = base;
  const size = SLOT.r * 2 * smooth(0, 0.04, rise);
  o.slot.scale.set(size, 1, size);
  o.slot.position.set(X, base + 0.4, -Z);
  o.slot.visible = rise > 0;
  return rise > 0 ? (
    <>
      <primitive object={o.slot} />
      <primitive object={o.back} />
      <primitive object={o.amber} />
      <primitive object={o.front} />
      <primitive object={o.cap} />
    </>
  ) : null;
};
/** a column's soft board shadow (falls past the plinth's right edge), for the cut's SoftShadows layer */
export const columnShadowItems = (kind: PlantKind, rise: number, height: number, level: number): ShadowItem[] => {
  if (rise <= 0) return [];
  const [X, Z] = slotOf(kind);
  const out: ShadowItem[] = [{ x: X, z: Z, len: (PLINTH.H + height * rise) * SHADOW_LEN, r: COLUMN.R * 0.95, soft: COLUMN.R * 0.5, alpha: 0.26 * smooth(0, 0.05, rise) }];
  if (level > 0.02) out.push({ x: X, z: Z, len: (PLINTH.H + level) * SHADOW_LEN, r: COLUMN.R * 0.92, soft: COLUMN.R * 0.45, alpha: 0.9 * smooth(0, 60, level) });
  return out;
};
