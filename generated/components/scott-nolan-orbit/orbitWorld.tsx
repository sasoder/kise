// ORBIT_WORLD
// ===================================================================================================================
// orbitWorld: cut C of scott-nolan-orbit (SolarInSunSyncOrbit). On energyWorld / nuclearWorld (imported, never
// copied): the board's sky, the solar array as its own object (it lifts off its plinth and re-folds into a satellite),
// the satellite's own canvas (shares the stage's camera, above the globe), the dawn-dusk orbit drawn in screen space
// around marsOceanShared's LitGlobe. RENDER WITH --gl=angle.
//
// WORLD: energyWorld's (X right, Y up, board = 0, Z away; three z = -Z). The array's group frame ("local"): at rest on
// the plinth it is the world's axes in three coords (x right, y up, z toward the camera) with its origin at the middle
// of the four rows; at the end it is the satellite's frame: x = the span (the direction of travel), y = the panels'
// normal (toward the sun), z = x cross y (toward Earth).
//
// THE ORBIT (view space of the end camera: x right, y up, z toward the viewer; orthographic, like LitGlobe):
// the sun SUN = (-cos a, 0, sin a) (left, toward the viewer). A dawn-dusk sun-synchronous orbit lies in the terminator
// plane (its normal points at the sun), so the ring is the circle of radius RING x the globe's radius in the plane
// spanned by UP and W = (sin a, 0, cos a); the satellite rides at its top, just above the day/night line, moving +W;
// its wings run along W and face SUN. The camera turns with the satellite about SUN, which leaves the globe's outline,
// the terminator, the ring and the sun where they are on screen: only Earth's surface slides (the globe turns about
// SUN) and the trail pays out behind the satellite (its tail stays fixed in the sun's frame).
// ===================================================================================================================
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { CameraRig, nuclearEye, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { COMMON_GLSL, EW_COLOR, LINEUP, PLINTH, SOLAR, THREE, cyl, energyClay, merge, plantContactCaps, rbox, sharedUniforms, vec3Of, type Any, type ShadowCap } from "../scott-nolan-wind/energyWorld";
import { SHADOW_DIR, SHADOW_LEN } from "../scott-nolan-uranium/nuclearWorld";

const W = 1080;
const H = 1920;
const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** smootherstep over [a, b] */
export const ease = (f: number, a: number, b: number) => {
  const t = c01((f - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const hexRgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const c = A.map((v, i) => Math.round(255 * lerp(v, B[i], c01(t))));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// ===================================================================================================================
// THE ARRAY (energyPlants' SOLAR rows, as their own object)
// ===================================================================================================================
const TILT = SOLAR.tilt * D2R;
const ROW_YC = SOLAR.y0 + (SOLAR.slope / 2) * Math.sin(TILT);
const ROW_DZ = (SOLAR.slope / 2) * Math.cos(TILT);
const ARRAY_MID_Z = (Math.max(...SOLAR.rows) + Math.min(...SOLAR.rows)) / 2;
/** the group frame's origin at rest (three coords): the middle of the four rows on the solar plinth */
export const ARRAY_HOME: [number, number, number] = [LINEUP.solar[0], PLINTH.H + ROW_YC, -(LINEUP.solar[1] + ARRAY_MID_Z)];
/** world (X, Y, Z-away) of the array's middle at rest */
export const ARRAY_HOME_WORLD: [number, number, number] = [ARRAY_HOME[0], ARRAY_HOME[1], -ARRAY_HOME[2]];

/** the satellite: a bus with two stub booms, two wings of two rows each (the four ground rows) */
export const SAT = { BUS: { x: 36, y: 24, z: 30 }, BOOM: 8, GAP: 2 } as const;
const WING_X = SAT.BUS.x / 2 + SAT.BOOM + SOLAR.len / 2;
const ROW_Z = SOLAR.slope / 2 + SAT.GAP / 2;
/** row i (SOLAR.rows order: back to front) at rest and in the satellite, in the group frame */
const ROWS = SOLAR.rows.map((rz, i) => {
  const z0 = -(rz - ARRAY_MID_Z);
  // the front pair becomes the trailing (left, -x) wing, the back pair the leading wing; within a wing the nearer row
  // goes to +z (toward Earth)
  const left = i >= 2;
  const zf = left ? (i === 3 ? ROW_Z : -ROW_Z) : i === 1 ? ROW_Z : -ROW_Z;
  return { z0, xf: left ? -WING_X : WING_X, zf, stagger: left ? 0 : 1.5 };
});
/** the legs: a front and a back post at three stations per row (energyPlants' solar), as top point + length */
const LEGS = SOLAR.rows.flatMap((rz) =>
  [-SOLAR.len * 0.38, 0, SOLAR.len * 0.38].flatMap((lx) => [
    { x: lx, z: -(rz - ROW_DZ * 0.8 - ARRAY_MID_Z), len: SOLAR.y0 + 0.5 },
    { x: lx, z: -(rz + ROW_DZ * 0.8 - ARRAY_MID_Z), len: SOLAR.y0 + 2 * (SOLAR.slope / 2) * Math.sin(TILT) - 0.5 },
  ]),
);

// the cells: energyPlants' look (modules 8 x 2, cells 4 x 3, a travelling glint) plus an amber front: the sun's power
const CELL_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vU = uv;
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const CELL_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform vec3 uCell; uniform vec3 uFrame; uniform vec3 uGlintC; uniform float uGlint; uniform float uDim;
uniform vec3 uSpanC; uniform vec3 uSpanDir; uniform float uSpanHalf; uniform float uFront; uniform float uGlintW; uniform float uFlight;
varying vec3 vW; varying vec3 vN; varying vec2 vU;
float lineAt(float v, float n, float w) { float f = abs(fract(v * n + 0.5) - 0.5) / n; return 1.0 - smoothstep(w * 0.5, w * 0.5 + fwidth(v) * 1.2, f); }
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float mod1 = max(lineAt(vU.x, 8.0, 0.006), lineAt(vU.y, 2.0, 0.035)) * (1.0 - 0.55 * uFlight);
  // in flight (seen small, against the haze) the fine cell lines step back so each module reads as solid dark glass
  float cellL = max(lineAt(vU.x, 32.0, 0.0022), lineAt(vU.y, 6.0, 0.016)) * (1.0 - 0.8 * uFlight);
  // ground: dark brown cells under cream frames
  vec3 cell = uCell * mix(0.86, 1.0, smoothstep(-0.2, 0.9, dot(n, uL))) * (1.0 - 0.22 * uFlight);
  vec3 col = mix(cell, mix(cell, uFrame, 0.32), cellL);
  col = mix(col, uFrame * 0.94, mod1);
  col += vec3(0.05, 0.04, 0.03) * pow(1.0 - abs(dot(n, V)), 2.0);
  // the glint: one soft band travelling along the row
  float gx = vU.x + 0.35 * (1.0 - vU.y);
  float g = exp(-pow((gx - uGlint) / uGlintW, 2.0));
  col = mix(col, uGlintC, 0.62 * (1.0 - 0.6 * uFlight) * g * (1.0 - mod1 * 0.5));
  // full sun: the cells turn amber behind a soft front sweeping along the span (from the sun's side)
  float s = dot(vW - uSpanC, uSpanDir) / uSpanHalf;
  float a = 1.0 - smoothstep(uFront - 0.22, uFront + 0.22, s);
  vec3 amb = mix(uAmberFoot, uAmberTop, 0.35 + 0.65 * vU.y);
  amb = mix(amb, uAmberHot, 0.28 * smoothstep(0.82, 1.0, vU.y));
  vec3 ac = mix(amb, uAmberFoot * 0.78, 0.55 * cellL);
  ac = mix(ac, uFrame * 0.96, mod1);
  col = mix(col, ac, a);
  col = mix(col, uBoardTone * 0.62, uDim * 0.5);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 1.0);
}`;

type ArrayMeshes = { group: Any; rows: { slab: Any; frame: Any; cells: Any }[]; legs: Any[]; bus: Any; cellMat: Any; clay: Any };
const buildArray = (): ArrayMeshes => {
  const clay = energyClay();
  const cellMat = new THREE.ShaderMaterial({
    vertexShader: CELL_VERT,
    fragmentShader: CELL_FRAG,
    extensions: { derivatives: true },
    uniforms: {
      ...sharedUniforms(),
      uCell: { value: vec3Of(EW_COLOR.cell) },
      uFrame: { value: vec3Of(EW_COLOR.cream) },
      uGlintC: { value: vec3Of("#E8D9BF") },
      uGlint: { value: 0 },
      uGlintW: { value: 0.075 },
      uDim: { value: 0 },
      uSpanC: { value: new THREE.Vector3() },
      uSpanDir: { value: new THREE.Vector3(1, 0, 0) },
      uSpanHalf: { value: 1 },
      uFront: { value: -2 },
      uFlight: { value: 0 },
    },
  });
  const group = new THREE.Group();
  group.matrixAutoUpdate = false;
  const slabGeo = (() => {
    const g = new THREE.BoxGeometry(SOLAR.len, 2.4, SOLAR.slope);
    const n = g.attributes.position.count;
    const c = hexRgb(EW_COLOR.cream);
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set(c, i * 3);
    g.setAttribute("aCol", new THREE.BufferAttribute(a, 3));
    return g;
  })();
  const cellGeo = (() => {
    const g = new THREE.PlaneGeometry(SOLAR.len - 4, SOLAR.slope - 4);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 1.25, 0);
    return g;
  })();
  const rows = ROWS.map(() => {
    const r = new THREE.Group();
    r.matrixAutoUpdate = false;
    const slab = new THREE.Mesh(slabGeo, clay);
    const cells = new THREE.Mesh(cellGeo, cellMat);
    for (const m of [slab, cells]) {
      m.frustumCulled = false;
      m.renderOrder = 2;
      r.add(m);
    }
    group.add(r);
    return { slab: r, frame: slab, cells };
  });
  const legGeo = (() => {
    const g = cyl(1.6, 1.6, 1, 0, -1, 0, EW_COLOR.creamFoot, 8);
    return g;
  })();
  const legs = LEGS.map(() => {
    const m = new THREE.Mesh(legGeo, clay);
    m.frustumCulled = false;
    m.renderOrder = 2;
    group.add(m);
    return m;
  });
  const busGeo = (() => {
    const b = SAT.BUS;
    const body = rbox(b.x, b.y, b.z, 0, -b.y / 2, 0, 4, "#E7DDCA");
    // the earth face: a darker card plate, proud of the bus (toward +z = Earth)
    const face = rbox(b.x * 0.7, b.y * 0.62, 2.2, 0, -b.y * 0.31, b.z / 2, 0.8, "#C9BBA3");
    const booms = [-1, 1].map((s) => {
      const g = cyl(2.6, 2.6, SAT.BOOM + 4, 0, -(SAT.BOOM + 4) / 2, 0, "#C9BBA3", 12);
      g.rotateZ(Math.PI / 2);
      g.translate(s * (b.x / 2 + SAT.BOOM / 2), 0, 0);
      return g;
    });
    return merge([body, face, ...booms]);
  })();
  const bus = new THREE.Mesh(busGeo, clay);
  bus.frustumCulled = false;
  bus.matrixAutoUpdate = false;
  bus.renderOrder = 2;
  group.add(bus);
  return { group, rows, legs, bus, cellMat, clay };
};

/** the array's state at frame f: where its group frame is, how it is turned, how far it has folded */
export type ArrayPose = {
  /** the group frame's origin (three coords) */
  at: [number, number, number];
  /** the group's orientation as a three quaternion (identity at rest) */
  q: Any;
  /** 0 = rows on the ground .. 1 = wings out */
  fold: number;
  /** 0 = legs out .. 1 = retracted */
  legs: number;
  /** the bus: 0 = inside the plinth, 0.4 = up under the rows, 1 = centred between the wings */
  bus: number;
  /** the amber front along the span: -1.6 (none) .. 1.6 (all amber) */
  front: number;
  glint: number;
  dim?: number;
  /** 0 = the ground rows' thin frames .. 1 = flight: thick solid panels, the cell grid quieter */
  flight?: number;
};
const QI = new THREE.Quaternion();
const M4 = new THREE.Matrix4();
const V3a = new THREE.Vector3();
const S1 = new THREE.Vector3(1, 1, 1);
const rowQGround = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), TILT);
/** the array (or the satellite it becomes); mount in a three scene */
export const SolarArray: React.FC<{ pose: ArrayPose }> = ({ pose }) => {
  const o = useMemo(buildArray, []);
  const G = new THREE.Matrix4().compose(new THREE.Vector3(...pose.at), pose.q, S1);
  o.group.matrix.copy(G);
  o.group.matrixWorldNeedsUpdate = true;
  ROWS.forEach((r, i) => {
    const p = c01(pose.fold);
    // out along the span first, then the rows close up into their wing and turn square
    const px = ease(p, 0.0 + r.stagger * 0.04, 0.62 + r.stagger * 0.04);
    const pz = ease(p, 0.3, 1);
    const pr = ease(p, 0.15, 0.9);
    const q = new THREE.Quaternion().slerpQuaternions(rowQGround, QI, pr);
    M4.compose(V3a.set(lerp(0, r.xf, px), 0, lerp(r.z0, r.zf, pz)), q, S1);
    o.rows[i].slab.matrix.copy(M4);
    o.rows[i].slab.matrixWorldNeedsUpdate = true;
    // the frame thickens downward (its top, under the cells, stays put): 2.4 -> 7.2 units in flight
    const th = 1 + 2 * c01(pose.flight ?? 0);
    o.rows[i].frame.scale.set(1, th, 1);
    o.rows[i].frame.position.set(0, -(th - 1) * 1.2, 0);
  });
  const lg = 1 - c01(pose.legs);
  LEGS.forEach((L, i) => {
    const m = o.legs[i];
    // a post hangs from its top under the row; it slides up into the frame as it retracts
    m.position.set(L.x, -ROW_YC + L.len, L.z);
    m.scale.set(1, Math.max(0.0001, L.len * lg), 1);
    m.visible = lg > 0.002;
  });
  // the bus's centre: inside the plinth (top 2.5 under the plinth's top) -> up under the rows' lowest edge -> centred
  const b = c01(pose.bus);
  const restC = -ROW_YC - SAT.BUS.y / 2 - 2.5;
  const underC = -ROW_YC + SOLAR.y0 - 1.6 - SAT.BUS.y / 2;
  const busY = b < 0.4 ? lerp(restC, underC, ease(b, 0, 0.4)) : lerp(underC, 0, ease(b, 0.4, 1));
  M4.compose(V3a.set(0, busY, 0), QI, S1);
  o.bus.matrix.copy(M4);
  o.bus.matrixWorldNeedsUpdate = true;
  const u = o.cellMat.uniforms;
  u.uGlint.value = pose.glint;
  u.uFront.value = pose.front;
  u.uDim.value = pose.dim ?? 0;
  u.uFlight.value = c01(pose.flight ?? 0);
  // the span axis in the world: the group's x
  u.uSpanDir.value.set(1, 0, 0).applyQuaternion(pose.q);
  u.uSpanC.value.set(...pose.at);
  u.uSpanHalf.value = WING_X + SOLAR.len / 2;
  return <primitive object={o.group} />;
};

/** the solar plinth's contact shadows while the array rises L units: they slide away along the light (off the plinth's
 *  back, as a rising caster's shadow does) and soften into one union */
export const liftedCaps = (L: number): ShadowCap[] => {
  // beyond the first lift the shadow is pushed off the plinth faster than the true offset (a far, faint shadow would
  // not sit as a grey patch on the plinth top while the craft is hundreds of units up)
  const k = L * SHADOW_LEN * (1 + Math.max(0, L - 45) / 60);
  return plantContactCaps("solar").map((c) => ({
    x: c.x + SHADOW_DIR[0] * k,
    z: c.z + SHADOW_DIR[1] * k,
    len: c.len,
    r: c.r * (1 + Math.min(L, 120) / 40),
  }));
};

// ===================================================================================================================
// THE SKY (in the stage's scene): a dome around the eye, behind the board (the board occludes it), alpha 0 like the
// floor so the shadow resolve leaves it alone. At altitude 0 it is the ground colour (the board's endless espresso);
// climbing, the horizon warms to haze and the sky above darkens to space. The fog colour = its horizon colour.
// ===================================================================================================================
const SKY_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SKY_FRAG = /* glsl */ `
uniform vec3 uHor; uniform vec3 uMid; uniform vec3 uTop; uniform float uBand; uniform float uDrop;
varying vec3 vW;
void main() {
  vec3 d = normalize(vW - cameraPosition);
  float e = d.y + uDrop;
  vec3 col = mix(uHor, uMid, smoothstep(0.0, uBand, e));
  col = mix(col, uTop, smoothstep(uBand * 0.8, uBand * 0.8 + 0.55, e));
  gl_FragColor = vec4(col, 0.0);
}`;
export type SkyLook = { hor: string; mid: string; top: string; band: number; drop?: number };
export const SkyDome: React.FC<{ cam: NuclearCam; look: SkyLook }> = ({ cam, look }) => {
  const o = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 48, 32);
    const m = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.NoBlending,
      uniforms: { uHor: { value: new THREE.Vector3() }, uMid: { value: new THREE.Vector3() }, uTop: { value: new THREE.Vector3() }, uBand: { value: 0.3 }, uDrop: { value: 0 } },
    });
    const me = new THREE.Mesh(g, m);
    me.frustumCulled = false;
    me.renderOrder = -99;
    return { me, m };
  }, []);
  const e = nuclearEye(cam);
  const R = 0.8 * Math.max(cam.d * 40, 4000);
  o.me.position.set(e[0], e[1], -e[2]);
  o.me.scale.set(R, R, R);
  o.m.uniforms.uHor.value.set(...hexRgb(look.hor));
  o.m.uniforms.uMid.value.set(...hexRgb(look.mid));
  o.m.uniforms.uTop.value.set(...hexRgb(look.top));
  o.m.uniforms.uBand.value = look.band;
  o.m.uniforms.uDrop.value = look.drop ?? 0;
  return <primitive object={o.me} />;
};

// ===================================================================================================================
// THE SATELLITE'S CANVAS: the stage's camera (CameraRig), a transparent clear, stout's amber bloom keyed like the stage's
// ===================================================================================================================
const ClearRig: React.FC = () => {
  const { gl } = useThree();
  (gl as Any).setClearColor(new THREE.Color(0, 0, 0), 0);
  return null;
};
export const SatCanvas: React.FC<{ cam: NuclearCam; id: string; children: React.ReactNode }> = ({ cam, id, children }) => (
  <AbsoluteFill>
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          {/* the stage's amber key (nuclearWorld): alpha = how amber a pixel is; cream falls below zero */}
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 0.68  0 0 0 0 0.12  1.6 0 -2.3 0 -0.38" result="o" />
          <feGaussianBlur in="o" stdDeviation="3.5" result="b1" />
          <feGaussianBlur in="o" stdDeviation="12" result="b2" />
          <feGaussianBlur in="o" stdDeviation="30" result="b3" />
          <feComponentTransfer in="b1" result="b1a">
            <feFuncA type="linear" slope="0.576" />
          </feComponentTransfer>
          <feComponentTransfer in="b2" result="b2a">
            <feFuncA type="linear" slope="0.32" />
          </feComponentTransfer>
          <feComponentTransfer in="b3" result="b3a">
            <feFuncA type="linear" slope="0.096" />
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
    <AbsoluteFill style={{ filter: `url(#${id})` }}>
      <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true }}>
        <CameraRig cam={cam} />
        <ClearRig />
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  </AbsoluteFill>
);

// ===================================================================================================================
// THE ORBIT (screen space, orthographic like LitGlobe)
// ===================================================================================================================
export type Orbit = { a: number; R: number; ring: number };
/** the sun, the ring's second axis, in view space (x right, y up, z to the viewer) */
export const orbitAxes = (o: Orbit) => {
  const a = o.a * D2R;
  return { sun: [-Math.cos(a), 0, Math.sin(a)] as [number, number, number], w: [Math.sin(a), 0, Math.cos(a)] as [number, number, number] };
};
/** the ring point at angle t (0 = the satellite's place, + = ahead) relative to the globe's centre: screen dx, dy, depth z */
export const ringPoint = (o: Orbit, t: number) => {
  const { w } = orbitAxes(o);
  const r = o.R * o.ring;
  const vx = r * Math.sin(t) * w[0];
  const vy = r * Math.cos(t);
  const vz = r * Math.sin(t) * w[2];
  return { dx: vx, dy: -vy, z: vz, hidden: vz < 0 && vx * vx + vy * vy < o.R * o.R };
};
/** the globe's centre (screen) that puts the ring's point at angle `s` (0 = the ring's top) on the satellite's screen point */
export const globeCentre = (o: Orbit, sat: { x: number; y: number }, s = 0) => {
  const p = ringPoint(o, s);
  return { x: sat.x - p.dx, y: sat.y - p.dy };
};
/** the orbit ring (the satellite's altitude, in the terminator's plane), drawn out from the satellite (ring angle s) in
 *  both directions to +-ext rad (ext = PI closes the loop). The near half is a thin cream line (over the globe it is
 *  held to `overDisc` of cream, so it stays low-contrast where it crosses the caption bands); the far half is hidden
 *  behind the globe and dimmer where it shows beside it. */
export const OrbitRing: React.FC<{
  o: Orbit;
  centre: { x: number; y: number };
  ext: number;
  s?: number;
  width?: number;
  color?: string;
  near?: number;
  overDisc?: number;
  far?: number;
}> = ({ o, centre, ext, s = 0, width = 3, color = COLOR.cream, near = 0.9, overDisc = 0.58, far = 0.32 }) => {
  if (ext < 0.003) return null;
  const n = Math.max(16, Math.ceil(ext * 2 * 220));
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const t = s - ext + (2 * ext * i) / n;
    const p = ringPoint(o, t);
    const inDisc = p.dx * p.dx + p.dy * p.dy < o.R * o.R;
    return { x: centre.x + p.dx, y: centre.y + p.dy, z: p.z, inDisc };
  });
  const f3 = (v: number) => v.toFixed(2);
  // runs of one look (near / over the disc / far beside it / hidden), each one path, so joints never double up
  const look = (i: number) => {
    const p = pts[i + 1];
    const q = pts[i];
    const front = p.z + q.z >= 0;
    const disc = p.inDisc || q.inDisc;
    return front ? (disc ? "disc" : "near") : disc ? "hidden" : "far";
  };
  const runs: { k: string; d: string }[] = [];
  for (let i = 0; i < n; i++) {
    const k = look(i);
    const last = runs[runs.length - 1];
    if (last && last.k === k) last.d += ` L${f3(pts[i + 1].x)} ${f3(pts[i + 1].y)}`;
    else runs.push({ k, d: `M${f3(pts[i].x)} ${f3(pts[i].y)} L${f3(pts[i + 1].x)} ${f3(pts[i + 1].y)}` });
  }
  const A: Record<string, number> = { near, disc: overDisc, far, hidden: 0 };
  const Wd: Record<string, number> = { near: width, disc: width, far: width * 0.75, hidden: 0 };
  const shown = runs.filter((r) => A[r.k] > 0);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id="orbitRingHalo" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={width * 1.2} />
        </filter>
      </defs>
      <g filter="url(#orbitRingHalo)">
        {shown.map((r, i) => (
          <path key={i} d={r.d} fill="none" stroke={color} strokeOpacity={A[r.k] * 0.22} strokeWidth={Wd[r.k] * 2.2} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      {shown.map((r, i) => (
        <path key={i} d={r.d} fill="none" stroke={color} strokeOpacity={A[r.k]} strokeWidth={Wd[r.k]} strokeLinecap="butt" strokeLinejoin="round" />
      ))}
    </svg>
  );
};

/** Earth's body orientation for LitGlobe after turning it by `alpha` (rad) about the view-space axis `k`:
 *  M = Ry(lon) Rx(-lat) Rz(roll) maps a view normal to a body point; turning the globe by Rot gives M' = M Rot^T. */
export const turnedGlobe = (lon: number, lat: number, roll: number, k: [number, number, number], alpha: number) => {
  const cy = Math.cos(lon * D2R);
  const sy = Math.sin(lon * D2R);
  const cx = Math.cos(-lat * D2R);
  const sx = Math.sin(-lat * D2R);
  const cz = Math.cos(roll * D2R);
  const sz = Math.sin(roll * D2R);
  const mul = (A: number[][], B: number[][]) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
  const M = mul(
    mul(
      [
        [cy, 0, sy],
        [0, 1, 0],
        [-sy, 0, cy],
      ],
      [
        [1, 0, 0],
        [0, cx, -sx],
        [0, sx, cx],
      ],
    ),
    [
      [cz, -sz, 0],
      [sz, cz, 0],
      [0, 0, 1],
    ],
  );
  // Rodrigues: Rot about unit k by alpha
  const [x, y, z] = k;
  const c = Math.cos(alpha);
  const s = Math.sin(alpha);
  const C = 1 - c;
  const Rot = [
    [c + x * x * C, x * y * C - z * s, x * z * C + y * s],
    [y * x * C + z * s, c + y * y * C, y * z * C - x * s],
    [z * x * C - y * s, z * y * C + x * s, c + z * z * C],
  ];
  const RT = Rot[0].map((_, j) => Rot.map((r) => r[j]));
  const N = mul(M, RT);
  const latO = Math.asin(Math.max(-1, Math.min(1, N[1][2]))) / D2R;
  const rollO = Math.atan2(N[1][0], N[1][1]) / D2R;
  const lonO = Math.atan2(N[0][2], N[2][2]) / D2R;
  return { lon: lonO, lat: latO, roll: rollO };
};

/** view-space vector (end camera: x right, y up, z to the viewer) -> three world, for a camera of pitch p (deg, + down) */
export const viewToThree = (v: [number, number, number], pitch: number) => {
  const p = pitch * D2R;
  return new THREE.Vector3(v[0], v[1] * Math.cos(p) + v[2] * Math.sin(p), -v[1] * Math.sin(p) + v[2] * Math.cos(p));
};
/** the satellite's attitude at ring angle s (group frame -> three world): x = the travel (the ring's tangent),
 *  y = SUN (the panels' normal), z = x cross y. Opt-in cheats for the picture: `yaw` (deg) turns the whole craft about
 *  the radial toward the viewer (panels face the camera more, wings read longer); `roll` (deg) turns the wings within the
 *  panel plane (+ = the wing on screen right rises). */
export const satAttitude = (o: Orbit, pitch: number, s = 0, yaw = 0, roll = 0) => {
  const { sun, w } = orbitAxes(o);
  // the radial (out from Earth's centre) at ring angle s
  const radial: [number, number, number] = [Math.sin(s) * w[0], Math.cos(s), Math.sin(s) * w[2]];
  const yw = (v: [number, number, number]): [number, number, number] => {
    // turn about view-space y (the radial at the ring's top) so +x swings toward +z (the viewer)
    const b = yaw * D2R;
    return [v[0] * Math.cos(b) + v[2] * Math.sin(b), v[1], -v[0] * Math.sin(b) + v[2] * Math.cos(b)];
  };
  const tan = yw([Math.cos(s) * w[0], -Math.sin(s), Math.cos(s) * w[2]]);
  const nrm = yw(sun);
  const up = yw(radial);
  const r = roll * D2R;
  const span: [number, number, number] = [0, 1, 2].map((i) => tan[i] * Math.cos(r) + up[i] * Math.sin(r)) as [number, number, number];
  const ex = viewToThree(span, pitch).normalize();
  const ey = viewToThree(nrm, pitch).normalize();
  ex.addScaledVector(ey, -ex.dot(ey)).normalize();
  const ez = new THREE.Vector3().crossVectors(ex, ey).normalize();
  const m = new THREE.Matrix4().makeBasis(ex, ey, ez);
  return new THREE.Quaternion().setFromRotationMatrix(m);
};
