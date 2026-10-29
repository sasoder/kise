// ===================================================================================================================
// openaiBuddy3d — the OpenAI blossom as a cute 3D character (sam-benchmaxxing; built for cut 9 TwoThingsToCareAbout,
// REV 2, and reused by cut 18 NoBenchmarkForNice on its "nice to work with" tile: read it, don't fork it).
//   The mark is the REAL OpenAI blossom: the path of public/sam-benchmaxxing/openai_mark.svg (Commons, PD-textlogo),
//   copied verbatim into MARK_D below (not redrawn), parsed by three's SVGLoader (holes by the fill rule), uniform
//   scale, extruded with a small rounded bevel. A cute stylised face sits on the knot: two ink eyes on small cream
//   discs (ink alone vanishes on the dark clay) with white catchlights, and a small ink smile on a cream underlay
//   under the centre hexagon, all floating a hair in front of the face so they read over the gaps between the bands.
//   Material (default tone "dark"): a rich ink brown clay close to OpenAITile's ink blossom, toon-lit (two soft bands, a lighter top, a crisp cream sheen on the bevels
//   that face the key light, a faint broad sheen up-left on the face), raw palette colours (flat + linear canvas).
//   `tone: "caramel"` is the lighter alternative (cut 9 REV 1b's smiley clay).
// Exports
//   <OpenAIBuddy pose tone?>           the character as an R3F object: mark height 1, centred on the mark's box, the
//                                      face toward +z (use it inside your own ThreeCanvas / scene)
//   <OpenAIBuddyLayer x cy height pose opacity? z? rotY? rotZ? tone?>
//                                      its own transparent 1080x1920 ThreeCanvas whose camera maps the plane z = 0
//                                      one to one onto screen px (mount it in BenchStage's `html` slot): (x, cy) =
//                                      screen centre of the mark, `height` = mark height in screen px (chart px x k);
//                                      `z` px toward the camera (negative = behind the card plane, smaller by
//                                      perspective), `rotY` / `rotZ` radians (the arrival's settling turn).
//   BuddyPose { squash, sway, tilt, wink, blink, glance }   squash > 0 = squashed (pivot at the foot, volume kept),
//                                      sway = turn about y, tilt = lean about z, wink = left eye 0 open .. 1 shut,
//                                      blink = both eyes, glance = pupils' offset {x, y} in eye radii (-1..1).
//   BUDDY_ASPECT                        mark width / height (16.78 / 16.511).
// Pure per frame (BenchStage's overlay can be mounted twice).
// ===================================================================================================================
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { COLOR, mixHex } from "../kits/cheeky-pint/stoutShared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

/** public/sam-benchmaxxing/openai_mark.svg's viewBox and its one path, verbatim */
const MARK_VB = { x: 1.547, y: 1.745, w: 16.78, h: 16.511 } as const;
const MARK_D =
  "M11.248 18.25q-.825 0-1.568-.314a4.3 4.3 0 0 1-1.32-.874 4 4 0 0 1-1.304.214 4 4 0 0 1-2.046-.544 4.27 4.27 0 0 1-1.518-1.485 4 4 0 0 1-.56-2.095q0-.48.131-1.04A4.4 4.4 0 0 1 2.04 10.71a4.07 4.07 0 0 1 .017-3.4 4.2 4.2 0 0 1 1.056-1.418 3.8 3.8 0 0 1 1.6-.842 3.9 3.9 0 0 1 .76-1.683q.593-.759 1.451-1.188a4.04 4.04 0 0 1 1.832-.429q.825 0 1.567.313.742.314 1.32.875a4 4 0 0 1 1.304-.215q1.106 0 2.046.545a4.14 4.14 0 0 1 1.501 1.485q.578.941.578 2.095 0 .48-.132 1.04.66.61 1.023 1.419.363.792.363 1.666 0 .892-.38 1.717a4.3 4.3 0 0 1-1.072 1.435 3.8 3.8 0 0 1-1.584.825 3.8 3.8 0 0 1-.775 1.683 4.06 4.06 0 0 1-1.436 1.188 4.04 4.04 0 0 1-1.832.429m-4.076-2.062q.825 0 1.435-.347l3.103-1.782a.36.36 0 0 0 .164-.313v-1.42L7.881 14.62a.67.67 0 0 1-.726 0l-3.118-1.798a.5.5 0 0 1-.017.115v.198q0 .841.396 1.551.413.693 1.139 1.089a3.2 3.2 0 0 0 1.617.412m.165-2.69a.4.4 0 0 0 .181.05q.083 0 .165-.05l1.238-.71-3.977-2.31a.7.7 0 0 1-.363-.643v-3.58q-.825.362-1.32 1.122a2.9 2.9 0 0 0-.495 1.65q0 .809.413 1.55.412.743 1.072 1.123zm3.91 3.663q.875 0 1.585-.396a2.96 2.96 0 0 0 1.534-2.64v-3.564a.32.32 0 0 0-.165-.297l-1.254-.726v4.604a.7.7 0 0 1-.363.643l-3.119 1.799a3 3 0 0 0 1.783.577m.627-6.039V8.878L10.01 7.822 8.129 8.878v2.244l1.881 1.056zM7.057 5.859a.7.7 0 0 1 .363-.644l3.119-1.798a3 3 0 0 0-1.782-.578q-.874 0-1.584.396A2.96 2.96 0 0 0 6.05 4.324a3.07 3.07 0 0 0-.396 1.551v3.547q0 .199.165.314l1.237.726zm8.383 7.887q.825-.364 1.303-1.123.495-.758.495-1.65a3.15 3.15 0 0 0-.412-1.55q-.413-.743-1.073-1.123l-3.086-1.782q-.099-.065-.181-.049a.3.3 0 0 0-.165.05l-1.238.692 3.993 2.327a.6.6 0 0 1 .264.264.64.64 0 0 1 .1.363zm-3.317-8.382a.63.63 0 0 1 .726 0l3.135 1.831v-.297q0-.792-.396-1.501a2.86 2.86 0 0 0-1.105-1.155q-.71-.43-1.65-.43-.825 0-1.436.347L8.294 5.941a.36.36 0 0 0-.165.314v1.418z";
export const BUDDY_ASPECT = MARK_VB.w / MARK_VB.h;
/** the extrusion in mark heights */
const DEPTH = 0.15;
const BEVEL = 0.022;

const W = 1080;
const H = 1920;
const EYE_Z = 2600;
const hexV = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
/** the key light (above-left, a little in front), y up, z toward the eye (the same key as cut 9's flask) */
const KEY = new THREE.Vector3(-0.55, 0.72, 0.5).normalize();

export type BuddyTone = "dark" | "caramel";
const TONES: Record<BuddyTone, { col: string; lit: string; shade: string }> = {
  // the default: a rich ink brown, the ink of the blossom on benchShared's OpenAITile (COLOR.inkDark; the stage's grade
  // lifts it to the same tone as the labels' ink), a lit top a step toward board, the shade a step deeper (never black)
  dark: { col: COLOR.inkDark, lit: mixHex(COLOR.inkDark, COLOR.board, 0.2), shade: mixHex(COLOR.inkDark, COLOR.shadow, 0.3) },
  // cut 9 REV 1b's smiley clay
  caramel: { col: "#D3884A", lit: mixHex("#D3884A", COLOR.cream, 0.22), shade: mixHex("#D3884A", COLOR.inkDark, 0.34) },
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
/** toon clay: soft lit / shade bands, a lighter top, crisp cream sheen where a bevel faces the sheen direction,
 *  a faint broad sheen up-left on the flat face (local position), a lighter top-to-foot drift on the face */
const CLAY_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uLit;
uniform vec3 uCol;
uniform vec3 uShade;
uniform vec3 uSheen;
uniform vec3 uSheenDir;
uniform float uFace;
varying vec3 vN;
varying vec3 vW;
varying vec3 vL;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float ndl = dot(n, uL);
  float band = smoothstep(-0.25, -0.05, ndl);
  float top = smoothstep(0.62, 0.8, ndl);
  vec3 col = mix(uShade, uCol, band);
  col = mix(col, uLit, top);
  // the flat face: a drift lighter toward the top-left, and one soft broad sheen up there
  float facing = smoothstep(0.85, 0.97, dot(n, V));
  float drift = clamp(0.5 + 0.9 * vL.y - 0.4 * vL.x, 0.0, 1.0);
  col = mix(col, uLit, uFace * facing * 0.18 * drift);
  float blob = exp(-(pow((vL.x + 0.2) / 0.2, 2.0) + pow((vL.y - 0.24) / 0.15, 2.0)));
  col = mix(col, uSheen, uFace * facing * 0.12 * blob);
  // crisp sheen on the bevels turned toward the key
  float sh = dot(n, uSheenDir);
  col = mix(col, uSheen, 0.85 * smoothstep(0.86, 0.93, sh) * (1.0 - facing));
  gl_FragColor = vec4(col, 1.0);
}`;
/** flat-ish solid (ink, cream discs, catchlights): lambert wrap, a small spec */
const SOLID_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uCol;
uniform vec3 uShade;
uniform float uSpec;
varying vec3 vN;
varying vec3 vW;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float lit = smoothstep(-0.6, 0.8, dot(n, uL));
  vec3 col = mix(uShade, uCol, lit);
  float s = pow(max(dot(n, normalize(uL + V)), 0.0), 40.0);
  col = mix(col, vec3(1.0), uSpec * s);
  gl_FragColor = vec4(col, 1.0);
}`;
const clayMat = (tone: BuddyTone) => {
  const t = TONES[tone];
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: CLAY_FRAG,
    uniforms: {
      uL: { value: KEY.clone() },
      uLit: { value: hexV(t.lit) },
      uCol: { value: hexV(t.col) },
      uShade: { value: hexV(t.shade) },
      uSheen: { value: hexV(COLOR.cream) },
      uSheenDir: { value: new THREE.Vector3(-0.6, 0.72, 0.36).normalize() },
      uFace: { value: 1 },
    },
  });
};
const solidMat = (col: string, shade: string, spec = 0.2) =>
  new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: SOLID_FRAG,
    uniforms: { uL: { value: KEY.clone() }, uCol: { value: hexV(col) }, uShade: { value: hexV(shade) }, uSpec: { value: spec } },
  });

// ---------------------------------------------------------------------------------------------- the mark
let MARK_GEO: Any = null;
/** the extruded mark: height 1, centred on its box, face at z = 0 toward +z, back at z = -DEPTH */
const markGeo = () => {
  if (MARK_GEO) return MARK_GEO;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VB.x} ${MARK_VB.y} ${MARK_VB.w} ${MARK_VB.h}"><path d="${MARK_D}"/></svg>`;
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.flatMap((p: Any) => SVGLoader.createShapes(p));
  const s = 1 / MARK_VB.h;
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth: (DEPTH - 2 * BEVEL) / s,
    bevelEnabled: true,
    bevelThickness: BEVEL / s,
    bevelSize: (BEVEL * 0.8) / s,
    bevelOffset: (-BEVEL * 0.8) / s,
    bevelSegments: 4,
    curveSegments: 14,
  });
  // svg units -> mark heights, centred; y flipped (svg y runs down) together with z, so the winding stays right and
  // the extrusion's start cap (z = -bevel) becomes the face
  g.translate(-(MARK_VB.x + MARK_VB.w / 2), -(MARK_VB.y + MARK_VB.h / 2), 0);
  g.scale(s, -s, -s);
  g.translate(0, 0, -BEVEL);
  g.computeBoundingBox();
  MARK_GEO = g;
  return g;
};

// the face, in mark heights (the knot's centre hexagon is ~0.23 wide, centred ~(0.004, 0))
const FACE = {
  eyeX: 0.165,
  eyeY: 0.035,
  eyeRx: 0.052,
  eyeRy: 0.075,
  disc: 1.55, // the cream disc behind each eye, x the eye radii
  smileY: -0.185,
  smileW: 0.115,
  smileDip: 0.05,
  smileR: 0.021,
  z: 0.012,
};

export type BuddyPose = { squash: number; sway: number; tilt: number; wink: number; blink: number; glance: { x: number; y: number } };
export const BUDDY_REST: BuddyPose = { squash: 0, sway: 0, tilt: 0, wink: 0, blink: 0, glance: { x: 0, y: 0 } };

/** the character, mark height 1, centred on its box, face toward +z */
export const OpenAIBuddy: React.FC<{ pose: BuddyPose; tone?: BuddyTone }> = ({ pose, tone = "dark" }) => {
  const o = useMemo(() => {
    const body = new THREE.Mesh(markGeo(), clayMat(tone));
    const inkMat = solidMat(COLOR.inkDark, mixHex(COLOR.inkDark, COLOR.shadow, 0.5), 0.35);
    const discMat = solidMat(COLOR.cream, COLOR.creamFoot, 0.1);
    const glintMat = solidMat("#FFFFFF", COLOR.cream, 0);
    const sph = new THREE.SphereGeometry(1, 28, 18);
    const eyes = [-1, 1].map((sgn) => {
      const pivot = new THREE.Group();
      pivot.position.set(FACE.eyeX * sgn + 0.004, FACE.eyeY, FACE.z);
      const disc = new THREE.Mesh(sph, discMat);
      disc.scale.set(FACE.eyeRx * FACE.disc, FACE.eyeRy * FACE.disc * 0.92, 0.012);
      const lid = new THREE.Group(); // scaled in y by the blink / wink (the disc closes with it)
      lid.add(disc);
      const pupil = new THREE.Group();
      const ink = new THREE.Mesh(sph, inkMat);
      ink.scale.set(FACE.eyeRx, FACE.eyeRy, 0.02);
      ink.position.z = 0.012;
      const glint = new THREE.Mesh(sph, glintMat);
      glint.scale.set(FACE.eyeRx * 0.34, FACE.eyeRy * 0.3, 0.01);
      glint.position.set(-FACE.eyeRx * 0.36, FACE.eyeRy * 0.42, 0.03);
      pupil.add(ink, glint);
      lid.add(pupil);
      pivot.add(lid);
      return { pivot, lid, pupil };
    });
    // the smile: a short tube arc under the hexagon, with round caps
    const pts: Any[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = -1 + (2 * i) / 20;
      pts.push(new THREE.Vector3(0.004 + FACE.smileW * t, FACE.smileY - FACE.smileDip * (1 - t * t), FACE.z + 0.01));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const smile = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, FACE.smileR, 10, false), inkMat);
    // a cream underlay behind the ink line (the same sticker language as the eye discs: ink alone vanishes on dark clay)
    const back = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, FACE.smileR * 1.9, 10, false), discMat);
    back.scale.z = 0.4;
    back.position.z = -0.012;
    const caps = [pts[0], pts[pts.length - 1]].flatMap((p) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(FACE.smileR, 12, 10), inkMat);
      m.position.copy(p);
      const b = new THREE.Mesh(new THREE.SphereGeometry(FACE.smileR * 1.9, 12, 10), discMat);
      b.position.copy(p);
      b.position.z -= 0.012;
      b.scale.z = 0.4;
      return [m, b];
    });
    const face = new THREE.Group();
    face.add(body, ...eyes.map((e) => e.pivot), back, smile, ...caps);
    // turn / lean about the middle of the slab
    face.position.z = DEPTH / 2;
    const turn = new THREE.Group();
    turn.add(face);
    turn.position.y = 0.5; // so the squash pivot (this group's parent origin) is the foot
    const squashG = new THREE.Group();
    squashG.add(turn);
    squashG.position.set(0, -0.5, -DEPTH / 2);
    const root = new THREE.Group();
    root.add(squashG);
    return { root, squashG, turn, eyes };
  }, [tone]);
  const sy = 1 - pose.squash;
  const sxz = 1 / Math.sqrt(Math.max(0.3, sy));
  o.squashG.scale.set(sxz, sy, sxz);
  o.turn.rotation.set(0, pose.sway, pose.tilt);
  o.eyes.forEach((e: Any, i: number) => {
    const shut = Math.min(1, pose.blink + (i === 0 ? pose.wink : 0));
    e.lid.scale.set(1, Math.max(0.1, 1 - shut), 1);
    e.pupil.position.set(pose.glance.x * FACE.eyeRx * 0.3, pose.glance.y * FACE.eyeRy * 0.25, 0);
  });
  return <primitive object={o.root} />;
};

// ---------------------------------------------------------------------------------------------- the layer
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

const Placed: React.FC<{ x: number; cy: number; height: number; z: number; rotY: number; rotZ: number; pose: BuddyPose; tone: BuddyTone }> = ({ x, cy, height, z, rotY, rotZ, pose, tone }) => {
  const g = useMemo(() => new THREE.Group(), []);
  g.position.set(x, -cy, z);
  g.scale.setScalar(height);
  g.rotation.set(0, rotY, rotZ);
  return (
    <primitive object={g}>
      <OpenAIBuddy pose={pose} tone={tone} />
    </primitive>
  );
};

/**
 * OpenAIBuddyLayer — the character in its own transparent WebGL layer (mount in BenchStage `html`), placed in screen
 * px: (x, cy) the mark's centre, `height` its height (chart px x k). See the file header for z / rotY / rotZ.
 */
export const OpenAIBuddyLayer: React.FC<{
  x: number;
  cy: number;
  height: number;
  pose?: BuddyPose;
  opacity?: number;
  z?: number;
  rotY?: number;
  rotZ?: number;
  tone?: BuddyTone;
}> = ({ x, cy, height, pose = BUDDY_REST, opacity = 1, z = 0, rotY = 0, rotZ = 0, tone = "dark" }) => {
  if (opacity <= 0.001) return null;
  return (
    <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0, opacity }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <Rig />
      <Placed x={x} cy={cy} height={height} z={z} rotY={rotY} rotZ={rotZ} pose={pose} tone={tone} />
    </ThreeCanvas>
  );
};
