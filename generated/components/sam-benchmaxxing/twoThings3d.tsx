// ===================================================================================================================
// twoThings3d — cut 9's flask (TwoThingsToCareAbout, sam-benchmaxxing, REV 2): "scientific discovery" as tasteful
// stylised 3D in the cheeky-pint palette, arriving fully formed in front of card 1's revealed face.
//   <ThingObjects>  a transparent WebGL layer (@remotion/three ThreeCanvas) the size of the frame, mounted in
//                   BenchStage's `html` slot (above the chart overlay, so the object stands IN FRONT of the card;
//                   AirStage's own `world` canvas is under the overlay). Its camera maps the plane z = 0 one to one onto
//                   screen px (x right, y up = -screen y), with a mild perspective (eye 2600 px out), so an object
//                   placed at a card's screen point and scaled by the look's k sits on the card under any camera.
//   Flask           an Erlenmeyer flask of clear glass (a fresnel glass shader: near-clear face-on, warm umber edges
//                   where the glass turns away, crisp key-light streaks, a thick lip), AMBER liquid inside (the score's
//                   colour) with a meniscus and a few bubbles rising, three white graduation ticks that ride the slow
//                   turntable turn (so the turn reads on a round body).
// The second object (the OpenAI blossom with a face) is its own module, openaiBuddy3d.tsx (cut 18 reuses it).
// Raw palette colours in ShaderMaterials (the canvas is flat + linear, as the world's). Never clipped (REV 2).
// Pure per frame (AirStage mounts the overlay twice: once, and once more for the amber keep).
// ===================================================================================================================
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { random } from "remotion";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const W = 1080;
const H = 1920;
const EYE_Z = 2600;
const hexV = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
/** the key light (above-left, a little in front), in the layer's frame (y up, z toward the eye) */
const KEY = new THREE.Vector3(-0.55, 0.72, 0.5).normalize();

// ---------------------------------------------------------------------------------------------- the camera rig
const Rig: React.FC = () => {
  const { camera, gl } = useThree();
  const c = camera as Any;
  c.fov = (2 * Math.atan(H / 2 / EYE_Z) * 180) / Math.PI;
  c.aspect = W / H;
  c.near = 20;
  c.far = 8000;
  c.position.set(W / 2, -H / 2, EYE_Z);
  c.rotation.set(0, 0, 0);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  (gl as Any).sortObjects = true;
  return null;
};

// ---------------------------------------------------------------------------------------------- shaders
const VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vL = position;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
/** clear glass: near-clear face-on, warm umber where it turns away (reads on cream), key-light streaks */
const GLASS_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uTint;
uniform vec3 uEdge;
uniform vec3 uSpec;
uniform float uClipY;
uniform float uBase;
uniform float uEdgeA;
varying vec3 vN;
varying vec3 vW;
void main() {
  if (vW.y < uClipY) discard;
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 V = normalize(cameraPosition - vW);
  float nv = abs(dot(n, V));
  float fr = pow(1.0 - nv, 2.4);
  vec3 col = mix(uTint, uEdge, smoothstep(0.0, 0.85, fr));
  float a = uBase + uEdgeA * fr;
  vec3 Hh = normalize(uL + V);
  float spec = pow(max(dot(n, Hh), 0.0), 70.0);
  // a soft vertical window streak on the lit side (glass's classic highlight)
  float streak = smoothstep(0.55, 0.9, dot(normalize(vec2(n.x, n.z)), normalize(vec2(-0.75, 0.66)))) * smoothstep(0.15, 0.5, nv);
  col = mix(col, uSpec, clamp(spec * 1.4 + streak * 0.55, 0.0, 1.0));
  a = max(a, clamp(spec * 0.95 + streak * 0.42, 0.0, 0.95));
  gl_FragColor = vec4(col, a);
}`;
/** the amber liquid: amberTop lit, amberFoot in the shade and low, a hot rim at the meniscus, a lighter fresnel edge */
const LIQUID_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uTop;
uniform vec3 uFoot;
uniform vec3 uHot;
uniform float uClipY;
uniform float uLevel;
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;
void main() {
  if (vW.y < uClipY) discard;
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float h = clamp(vL.y / uLevel, 0.0, 1.0);
  vec3 col = mix(uFoot, uTop, 0.2 + 0.8 * h);
  col *= 0.82 + 0.22 * smoothstep(-0.5, 0.9, ndl);
  float fr = pow(1.0 - abs(dot(n, V)), 2.0);
  col = mix(col, uHot, 0.18 * fr);
  // the surface (normal up): toward the hot edge colour
  col = mix(col, mix(uTop, uHot, 0.3), smoothstep(0.8, 0.98, n.y));
  gl_FragColor = vec4(col, 1.0);
}`;
/** a soft-lit flat colour (graduation ticks, bubbles, the smiley's ink): lambert-ish with a small spec */
const SOLID_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uCol;
uniform vec3 uShade;
uniform vec3 uSpec;
uniform float uSpecAmt;
uniform float uAlpha;
uniform float uClipY;
uniform float uWrap;
varying vec3 vN;
varying vec3 vW;
void main() {
  if (vW.y < uClipY) discard;
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float lit = smoothstep(-uWrap, 0.85, ndl);
  vec3 col = mix(uShade, uCol, lit);
  float fr = pow(1.0 - max(dot(n, V), 0.0), 2.5);
  col = mix(col, uShade, 0.28 * fr);
  float spec = pow(max(dot(n, normalize(uL + V)), 0.0), 40.0);
  col = mix(col, uSpec, uSpecAmt * spec);
  gl_FragColor = vec4(col, uAlpha);
}`;

const glassMat = (side: Any, order: number) => {
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: GLASS_FRAG,
    uniforms: {
      uL: { value: KEY.clone() },
      uTint: { value: hexV("#FFFDF6") },
      uEdge: { value: hexV(mixHex(COLOR.board, COLOR.inkDark, 0.35)) },
      uSpec: { value: hexV("#FFFFFF") },
      uClipY: { value: -1e9 },
      uBase: { value: side === THREE.BackSide ? 0.04 : 0.07 },
      uEdgeA: { value: side === THREE.BackSide ? 0.45 : 0.85 },
    },
    transparent: true,
    depthWrite: false,
    side,
  });
  m.userData.order = order;
  return m;
};
const solidMat = (col: string, shade: string, opts: { alpha?: number; spec?: number; wrap?: number; depthTest?: boolean; transparent?: boolean } = {}) =>
  new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: SOLID_FRAG,
    uniforms: {
      uL: { value: KEY.clone() },
      uCol: { value: hexV(col) },
      uShade: { value: hexV(shade) },
      uSpec: { value: hexV("#FFFFFF") },
      uSpecAmt: { value: opts.spec ?? 0.25 },
      uAlpha: { value: opts.alpha ?? 1 },
      uClipY: { value: -1e9 },
      uWrap: { value: opts.wrap ?? 0.35 },
    },
    transparent: opts.transparent ?? (opts.alpha ?? 1) < 1,
    depthTest: opts.depthTest ?? true,
    depthWrite: !(opts.transparent ?? (opts.alpha ?? 1) < 1),
  });

// ---------------------------------------------------------------------------------------------- the flask
/** the flask's profile in units of its height (r, y): a flat foot, a straight cone to the neck, the neck, a lip */
const FLASK_PROFILE: [number, number][] = [
  [0.0, 0.0],
  [0.37, 0.0],
  [0.405, 0.012],
  [0.415, 0.04],
  [0.395, 0.09],
  [0.145, 0.6],
  [0.13, 0.64],
  [0.13, 0.9],
  [0.15, 0.93],
  [0.16, 0.955],
  [0.15, 0.975],
  [0.125, 0.975],
];
/** the cone's inner radius at height y (units of height) */
const coneR = (y: number) => {
  if (y < 0.09) return 0.39;
  if (y < 0.6) return 0.395 + ((0.145 - 0.395) * (y - 0.09)) / 0.51;
  return 0.13;
};
export const FLASK_LEVEL = 0.37;
const N_BUBBLES = 8;

type Placement = { x: number; base: number; scale: number; clip: number; z: number; lean: number };
/** screen point (x right, y down) -> the layer's frame (x right, y up) */
const toLayer = (x: number, y: number) => [x, -y] as const;

const Flask: React.FC<{ at: Placement; turn: number; f: number }> = ({ at, turn, f }) => {
  const o = useMemo(() => {
    const prof = FLASK_PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
    const glassGeo = new THREE.LatheGeometry(prof, 72);
    // the liquid: the inner cone up to the level, closed by a meniscus disc
    const lp: Any[] = [new THREE.Vector2(0, 0.012)];
    for (let i = 0; i <= 10; i++) {
      const y = 0.012 + ((FLASK_LEVEL - 0.012) * i) / 10;
      lp.push(new THREE.Vector2(coneR(y) * 0.955, y));
    }
    lp.push(new THREE.Vector2(coneR(FLASK_LEVEL) * 0.9, FLASK_LEVEL + 0.006));
    lp.push(new THREE.Vector2(0, FLASK_LEVEL + 0.004));
    const liqGeo = new THREE.LatheGeometry(lp, 64);
    const liqMat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: LIQUID_FRAG,
      uniforms: {
        uL: { value: KEY.clone() },
        uTop: { value: hexV(COLOR.amberTop) },
        uFoot: { value: hexV(COLOR.amberFoot) },
        uHot: { value: hexV(COLOR.amberHot) },
        uClipY: { value: -1e9 },
        uLevel: { value: FLASK_LEVEL },
      },
    });
    const back = glassMat(THREE.BackSide, 2);
    const front = glassMat(THREE.FrontSide, 4);
    const liquid = new THREE.Mesh(liqGeo, liqMat);
    liquid.renderOrder = 1;
    const glassBack = new THREE.Mesh(glassGeo, back);
    glassBack.renderOrder = 2;
    const glassFront = new THREE.Mesh(glassGeo, front);
    glassFront.renderOrder = 5;
    // the graduation ticks: three short white arcs on the cone's front, riding the turn
    const tickMat = solidMat("#FFFFFF", mixHex(COLOR.cream, COLOR.board, 0.4), { alpha: 0.85, spec: 0.1, transparent: true });
    const ticks = [0.18, 0.27, 0.36].map((y, i) => {
      const r = coneR(y) * 1.01 + 0.004;
      const arc = i === 1 ? 0.62 : 0.4;
      const g = new THREE.TorusGeometry(r, 0.0075, 6, 24, arc);
      const m = new THREE.Mesh(g, tickMat);
      m.rotation.x = Math.PI / 2;
      m.position.y = y;
      m.rotation.z = -arc / 2 + Math.PI / 2;
      m.renderOrder = 3;
      return m;
    });
    // the bubbles (cream glints), drawn over the liquid (it is translucent amber in the picture)
    const bubMat = solidMat(mixHex(COLOR.amberHot, "#FFFFFF", 0.5), COLOR.amberTop, { alpha: 0.9, spec: 0.6, wrap: 0.6, depthTest: false, transparent: true });
    const bubGeo = new THREE.SphereGeometry(1, 14, 10);
    const bubbles = Array.from({ length: N_BUBBLES }, () => {
      const m = new THREE.Mesh(bubGeo, bubMat);
      m.renderOrder = 1.5;
      return m;
    });
    const spin = new THREE.Group();
    spin.add(liquid, glassBack, ...ticks, glassFront, ...bubbles);
    const tilt = new THREE.Group();
    tilt.add(spin);
    const root = new THREE.Group();
    root.add(tilt);
    return { root, tilt, spin, bubbles, mats: [liqMat, back, front, tickMat, bubMat] };
  }, []);
  const [lx, ly] = toLayer(at.x, at.base);
  o.root.position.set(lx, ly, at.z);
  o.root.scale.setScalar(at.scale);
  o.root.rotation.z = at.lean;
  o.tilt.rotation.x = 0.26;
  o.spin.rotation.y = turn;
  for (const m of o.mats) m.uniforms.uClipY.value = -at.clip;
  // bubbles: each rises from the foot to the surface on its own loop, wobbling a little, fading at the top
  o.bubbles.forEach((b: Any, i: number) => {
    const per = 26 + 14 * random(`bp${i}`);
    const ph = (((f + per * random(`bo${i}`)) / per) % 1 + 1) % 1;
    const y = 0.04 + ph * (FLASK_LEVEL - 0.065);
    const ang = 6.283 * random(`ba${i}`) + 0.6 * Math.sin(f * 0.11 + i);
    const rr = coneR(y) * (0.25 + 0.5 * random(`br${i}`));
    const size = (0.011 + 0.013 * random(`bs${i}`)) * (0.75 + 0.35 * ph) * (1 - Math.pow(ph, 6));
    b.position.set(Math.cos(ang) * rr, y, Math.sin(ang) * rr * 0.6 + 0.05);
    b.scale.setScalar(Math.max(1e-4, size));
  });
  return <primitive object={o.root} />;
};

// ---------------------------------------------------------------------------------------------- the layer
export type FlaskState = { show: boolean; x: number; base: number; height: number; turn: number; z: number; lean: number; opacity: number };
/**
 * ThingObjects — the flask's WebGL layer (mount in BenchStage `html`). Screen px: `base` = the screen y of the
 * flask's foot, `height` in screen px (= chart px x k), `z` px toward the camera, `lean` radians about its foot,
 * `opacity` the layer's (the arrival's first frames). Never clipped (REV 2: no slot).
 */
export const ThingObjects: React.FC<{ f: number; flask: FlaskState }> = ({ f, flask }) => {
  if (!flask.show || flask.opacity <= 0.001) return null;
  return (
    <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0, opacity: flask.opacity }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <Rig />
      <Flask at={{ x: flask.x, base: flask.base, scale: flask.height, clip: 1e9, z: flask.z, lean: flask.lean }} turn={flask.turn} f={f} />
    </ThreeCanvas>
  );
};
