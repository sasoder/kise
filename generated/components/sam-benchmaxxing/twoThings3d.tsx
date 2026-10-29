// ===================================================================================================================
// twoThings3d — cut 9's 3D objects (TwoThingsToCareAbout, sam-benchmaxxing, REV 1): the two things Sam names, as
// tasteful stylised 3D in the cheeky-pint palette, each rising out of the slot on its card's revealed front.
//   <ThingObjects>  ONE transparent WebGL layer (@remotion/three ThreeCanvas) the size of the frame, mounted in
//                   BenchStage's `html` slot (above the chart overlay, so the objects stand IN FRONT of the cards;
//                   AirStage's own `world` canvas is under the overlay). Its camera maps the plane z = 0 one to one onto
//                   screen px (x right, y up = -screen y), with a mild perspective (eye 2600 px out), so an object
//                   placed at a card's screen point and scaled by the look's k sits on the card under any camera.
//   Flask           scientific discovery: an Erlenmeyer flask of clear glass (a fresnel glass shader: near-clear
//                   face-on, warm umber edges where the glass turns away, crisp key-light streaks, a thick lip),
//                   AMBER liquid inside (the score's colour) with a meniscus and a few bubbles rising, three white
//                   graduation ticks that ride the slow turntable turn (so the turn reads on a round body).
//   Smiley          nice to work with: a chunky caramel clay pebble (board family, warm; not amber) with an ink smile
//                   and two ink eyes with cream catchlights, toon-lit with a crisp cream sheen; it
//                   squashes and settles as it pops, bobs gently, sways a little, and winks once on "work with".
// Both are clipped at their slot line (a fragment discard below it), so they rise OUT of the card's slot (the house
// slot joint) instead of scaling in. Raw palette colours in ShaderMaterials (the canvas is flat + linear, as the world's).
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

// ---------------------------------------------------------------------------------------------- the smiley's clay
/** the smiley's own colour: a warm caramel clay in the board family (board pushed warm and a step deeper), so it pops
 *  off the cream card by tone; NOT amber (amber stays the numerals and the liquid) */
const CARAMEL = "#D3884A";
const CARAMEL_LIT = mixHex(CARAMEL, COLOR.cream, 0.22);
const CARAMEL_SHADE = mixHex(CARAMEL, COLOR.inkDark, 0.34);
/** toon clay: two soft bands (lit / shade) with a narrow terminator, a crisp cream sheen blob under the key light,
 *  a warm bounce on the shadow side's rim, and a darker edge where the surface turns away (holds the silhouette) */
const CLAY_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uLit;
uniform vec3 uCol;
uniform vec3 uShade;
uniform vec3 uSheen;
uniform vec3 uBounce;
uniform vec3 uSheenDir;
uniform float uClipY;
varying vec3 vN;
varying vec3 vW;
void main() {
  if (vW.y < uClipY) discard;
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float band = smoothstep(-0.42, -0.2, ndl);
  float top = smoothstep(0.3, 0.5, ndl);
  vec3 col = mix(uShade, uCol, band);
  col = mix(col, uLit, top);
  float nv = max(dot(n, V), 0.0);
  float rim = pow(1.0 - nv, 2.2);
  col = mix(col, uBounce, 0.35 * rim * (1.0 - band));
  col = mix(col, uShade, 0.32 * smoothstep(0.55, 0.95, 1.0 - nv) * band);
  // the sheen sits high on the upper-left shoulder (a fixed direction, clear of the eyes), crisp core + soft halo
  float sh = dot(n, uSheenDir);
  col = mix(col, uSheen, 0.9 * smoothstep(0.972, 0.986, sh));
  col = mix(col, uSheen, 0.16 * smoothstep(0.88, 0.97, sh));
  gl_FragColor = vec4(col, 1.0);
}`;
const clayMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: CLAY_FRAG,
    uniforms: {
      uL: { value: KEY.clone() },
      uLit: { value: hexV(CARAMEL_LIT) },
      uCol: { value: hexV(CARAMEL) },
      uShade: { value: hexV(CARAMEL_SHADE) },
      uSheen: { value: hexV(COLOR.cream) },
      uBounce: { value: hexV(mixHex(COLOR.creamFoot, CARAMEL, 0.35)) },
      uSheenDir: { value: new THREE.Vector3(-0.55, 0.7, 0.45).normalize() },
      uClipY: { value: -1e9 },
    },
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

type Placement = { x: number; base: number; scale: number; clip: number };
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
  o.root.position.set(lx, ly, 0);
  o.root.scale.setScalar(at.scale);
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

// ---------------------------------------------------------------------------------------------- the smiley
/** a point on the smiley's front surface (ellipsoid radii 1, 0.94, DEPTH) at (x, y), lifted `out` along z */
const SMILEY_DEPTH = 0.62;
const onFront = (x: number, y: number, out: number) => {
  const q = 1 - (x * x) / 1 - (y * y) / (0.94 * 0.94);
  return new THREE.Vector3(x, y, SMILEY_DEPTH * Math.sqrt(Math.max(0, q)) + out);
};
const Smiley: React.FC<{ at: Placement; squash: number; sway: number; wink: number }> = ({ at, squash, sway, wink }) => {
  const o = useMemo(() => {
    const bodyMat = clayMat();
    const inkMat = solidMat(COLOR.inkDark, mixHex(COLOR.inkDark, COLOR.shadow, 0.5), { spec: 0.35, wrap: 0.5 });
    const glintMat = solidMat(COLOR.cream, COLOR.cream, { spec: 0, wrap: 1 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), bodyMat);
    body.scale.set(1, 0.94, SMILEY_DEPTH);
    // eyes: two ink ovals sitting on the face
    const eyeGeo = new THREE.SphereGeometry(1, 24, 16);
    const eyes = [-1, 1].map((sgn) => {
      const p = onFront(0.33 * sgn, 0.24, -0.02);
      const pivot = new THREE.Group();
      pivot.position.copy(p);
      const m = new THREE.Mesh(eyeGeo, inkMat);
      m.scale.set(0.085, 0.15, 0.06);
      pivot.add(m);
      // a small cream catchlight up-left in each eye (it winks with the eye)
      const glint = new THREE.Mesh(eyeGeo, glintMat);
      glint.scale.set(0.026, 0.034, 0.02);
      glint.position.set(-0.028, 0.06, 0.068);
      pivot.add(glint);
      return pivot;
    });
    // the smile: a tube along a gentle arc on the face
    const pts: Any[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = -1 + (2 * i) / 24;
      const x = 0.44 * t;
      const y = -0.2 - 0.17 * (1 - t * t);
      pts.push(onFront(x, y, -0.01));
    }
    const smile = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.055, 12, false), inkMat);
    const capGeo = new THREE.SphereGeometry(0.055, 12, 10);
    const caps = [pts[0], pts[pts.length - 1]].map((p) => {
      const m = new THREE.Mesh(capGeo, inkMat);
      m.position.copy(p);
      return m;
    });
    const face = new THREE.Group();
    face.add(body, ...eyes, smile, ...caps);
    const squashG = new THREE.Group(); // pivot at the base (y = 0 under it)
    face.position.y = 0.94;
    squashG.add(face);
    const root = new THREE.Group();
    root.add(squashG);
    return { root, squashG, face, eyes, mats: [bodyMat, inkMat, glintMat] };
  }, []);
  const [lx, ly] = toLayer(at.x, at.base);
  o.root.position.set(lx, ly, 0);
  // the layer's scale is the diameter / 2 (the body has radius 1)
  o.root.scale.setScalar(at.scale);
  const sy = 1 - squash;
  const sxz = 1 / Math.sqrt(Math.max(0.3, sy));
  o.squashG.scale.set(sxz, sy, sxz);
  o.face.rotation.y = sway;
  o.face.rotation.x = 0.12;
  o.eyes[0].scale.set(1, Math.max(0.12, 1 - wink), 1);
  for (const m of o.mats) m.uniforms.uClipY.value = -at.clip;
  return <primitive object={o.root} />;
};

// ---------------------------------------------------------------------------------------------- the layer
export type FlaskState = { show: boolean; x: number; base: number; height: number; clip: number; turn: number };
export type SmileyState = { show: boolean; x: number; base: number; diameter: number; clip: number; squash: number; sway: number; wink: number };
/**
 * ThingObjects — the WebGL layer (mount in BenchStage `html`). Screen px for every position: `base` = the screen y of
 * the object's foot, `clip` = the screen y of its slot line (nothing below it is drawn), `height` / `diameter` in
 * screen px (= chart px x k).
 */
export const ThingObjects: React.FC<{ f: number; flask: FlaskState; smiley: SmileyState }> = ({ f, flask, smiley }) => {
  if (!flask.show && !smiley.show) return null;
  return (
    <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <Rig />
      {flask.show ? <Flask at={{ x: flask.x, base: flask.base, scale: flask.height, clip: flask.clip }} turn={flask.turn} f={f} /> : null}
      {smiley.show ? <Smiley at={{ x: smiley.x, base: smiley.base, scale: smiley.diameter / 2, clip: smiley.clip }} squash={smiley.squash} sway={smiley.sway} wink={smiley.wink} /> : null}
    </ThreeCanvas>
  );
};
