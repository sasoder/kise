// believePulse: cut B's own objects on top of costCurveWorld (scott-nolan-orbit, BelieveTheSolarCurve).
//   <SolarPulse head pops>  the "believe" pulse: a hot amber head riding the solar curve and a kick on each bead it passes
//   <BelieveMarks ...>      the panel and the cell, drawn here (CostChart's own marks off) so B can lift the panel when the
//                           pulse lands, run its glint, and let the battery cell sag; on B's f0 they equal CostChart's marks.
// The pulse's beads are drawn over the curve's own beads, a little larger, in the curve's own amber shading (copied from
// costCurveWorld's LINE_FRAG amber branch), so a bead whose kick has settled is pixel-identical to the curve's bead.
import React, { useMemo } from "react";
import { COMMON_GLSL, THREE, c01, sharedUniforms, type Any, type V3 } from "../scott-nolan-wind/energyWorld";
import { BatteryMark, CHART, DEFAULT_TONE, SolarMark, pointAt, rowsOf, type Series } from "./costCurveWorld";

const VERT = /* glsl */ `
varying vec3 vW;
varying vec3 vN;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uHot;
varying vec3 vW;
varying vec3 vN;
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 n = normalize(vN);
  if (dot(n, V) < 0.0) n = -n;
  float lit = smoothstep(-0.5, 0.9, dot(n, uL));
  vec3 amb = mix(uAmberFoot, uAmberTop, lit);
  amb = mix(amb, uAmberHot, 0.55 * pow(max(n.y, 0.0), 5.0));
  // the kick: toward the hot amber, most on the lit side, and a white-hot core facing the camera (the sun's power, lit up)
  amb = mix(amb, uAmberHot, uHot * (0.45 + 0.4 * lit));
  amb = mix(amb, vec3(1.0, 0.94, 0.78), uHot * 0.55 * pow(max(dot(n, V), 0.0), 1.5));
  gl_FragColor = vec4(mix(amb, uFogCol, fogAt(vW)), 1.0);
}`;
const mat = (hot: number) => {
  const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, side: THREE.FrontSide, uniforms: { ...sharedUniforms(), uHot: { value: hot } } });
  return m;
};
let sphere: Any = null;
const sphereGeo = () => {
  if (!sphere) sphere = new THREE.SphereGeometry(1, 32, 20);
  return sphere;
};
const ROWS = rowsOf("solar");

/** a bead's kick: how much bigger (0..) and how hot (0..1) */
export type Pop = { grow: number; hot: number };
export type SolarPulseProps = {
  /** the pulse head's year on the solar curve; undefined = no head */
  head?: number;
  /** the head's radius (world units) */
  headR?: number;
  /** the head's tail: spheres trailing it along the curve, [years behind, radius factor] each */
  tail?: [number, number][];
  /** per data row (rowsOf("solar") order): the bead's kick; grow <= 0.002 draws nothing over the curve's own bead */
  pops: Pop[];
};
export const PULSE_TAIL: [number, number][] = [
  [0.45, 0.8],
  [0.9, 0.62],
  [1.4, 0.46],
  [2, 0.32],
];
export const SolarPulse: React.FC<SolarPulseProps> = ({ head, headR = CHART.BEAD_R * 2.1, tail = PULSE_TAIL, pops }) => {
  const o = useMemo(() => {
    const beads = ROWS.map(() => {
      const m = new THREE.Mesh(sphereGeo(), mat(0));
      m.frustumCulled = false;
      m.renderOrder = 1;
      return m;
    });
    const hs = [0, ...PULSE_TAIL].map(() => {
      const h = new THREE.Mesh(sphereGeo(), mat(1));
      h.frustumCulled = false;
      h.renderOrder = 1;
      return h;
    });
    const g = new THREE.Group();
    beads.forEach((b) => g.add(b));
    hs.forEach((h) => g.add(h));
    return { g, beads, hs };
  }, []);
  ROWS.forEach((r, i) => {
    const b = o.beads[i];
    const p = pops[i] ?? { grow: 0, hot: 0 };
    b.visible = p.grow > 0.002;
    if (!b.visible) return;
    b.position.set(r.p[0], r.p[1], -r.p[2]);
    b.scale.setScalar(CHART.BEAD_R * (1 + p.grow));
    b.material.uniforms.uHot.value = c01(p.hot);
  });
  const parts: [number, number][] = [[0, 1], ...tail];
  o.hs.forEach((h: Any, i: number) => {
    const t = parts[i];
    h.visible = head !== undefined && !!t && head - t[0] >= ROWS[0].year;
    if (!h.visible || head === undefined || !t) return;
    const p = pointAt("solar", head - t[0]);
    h.position.set(p[0], p[1], -p[2]);
    h.scale.setScalar(headR * t[1]);
  });
  return <primitive object={o.g} />;
};

export type BelieveMarksProps = {
  /** CostChart's mark centres (marksAt) and scale, as on A's last frame */
  at: Record<Series, V3>;
  scale?: number;
  /** the panel's lift (world Y) when the pulse lands, the battery cell's sag (world Y, down positive) */
  lift?: number;
  sag?: number;
  /** the cell's tip (degrees, its + end dips) */
  tilt?: number;
  glint: number;
  dim?: Partial<Record<Series, number>>;
};
/** the two objects, in CostChart's order and props, plus B's lift and sag */
export const BelieveMarks: React.FC<BelieveMarksProps> = ({ at, scale = 1, lift = 0, sag = 0, tilt = 0, glint, dim = {} }) => (
  <>
    <BatteryMark at={[at.battery[0], at.battery[1] - sag, at.battery[2]]} dim={dim.battery} tone={DEFAULT_TONE.battery} scale={scale} tilt={tilt} />
    <SolarMark at={[at.solar[0], at.solar[1] + lift, at.solar[2]]} dim={dim.solar} tone={DEFAULT_TONE.solar} glint={glint} scale={scale} />
  </>
);
