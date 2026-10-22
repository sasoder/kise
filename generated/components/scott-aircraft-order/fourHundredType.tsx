// ---------------------------------------------------------------------------
// fourHundredType — ListForFourHundredMillion's "$400M" as REAL 3D type (cut-local; scott-aircraft-order).
//
// The glyphs are Söhne Dreiviertelfett's own outlines (public/Sohne-Dreiviertelfett.otf, FONT_NUM), baked by
// scripts/clips/scott-aircraft-order/bake-400m-glyphs.ts into fourHundredGlyphs.ts, turned into THREE.Shapes (holes
// by winding and containment) and extruded (THREE.ExtrudeGeometry, a small bevel). The word stands on the apron in
// world metres, drawn in its OWN ThreeCanvas through a camera that copies aircraftShared's pinhole (CameraRig /
// airProject), so it sits in the same world as the jet and the cash and above the cash overlay. Shading: the clip's
// ONE key light (aircraftShared LIGHT.side): the face stout amber (amberTop -> amberFoot from cap height to the
// baseline, held near its paint like United's fin), the front bevel's upward faces amberHot (the 2 px hot top edge),
// the extruded sides amber at the face running back into umber, lit / shaded by the key light (shaded sides deep
// brown, never black). Anything below the apron (y < 0) is not drawn: the word rises out of the apron as through a
// slot. Its one cast shadow (union of the face and back outlines swept along the sun onto the apron) and a tight
// contact shadow are SVG in the overlay, like the heap's.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLOR, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import { LIGHT, airProject, fogAmount, type SideCam } from "./aircraftShared";
import { FOUR_HUNDRED, type GlyphCmd } from "./fourHundredGlyphs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
type V3 = [number, number, number];
const W = 1080;
const H = 1920;
const D2R = Math.PI / 180;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

/** the word's build (em units: 1 em = TYPE3D.em metres in the world) */
export const TYPE3D = {
  /** metres per em */
  em: 5.77,
  /** extrusion depth (em) */
  depth: 0.24,
  /** bevel (em): ~2 screen px at the word's distance */
  bevel: 0.0095,
} as const;
/** the word's lowest point (the "$" tail) and highest (the "$" top), em */
const Y_LO = -0.102;
const Y_HI = 0.818;
export const TYPE_TOP_M = (Y_HI + TYPE3D.bevel) * TYPE3D.em;

// ---------------------------------------------------------------------------
// GEOMETRY (built once)
// ---------------------------------------------------------------------------
type Pt = [number, number];
/** a glyph's contours as polylines (em, y up), each a closed ring */
const contoursOf = (cmds: GlyphCmd[], x0: number, steps = 10): Pt[][] => {
  const rings: Pt[][] = [];
  let cur: Pt[] = [];
  let p: Pt = [0, 0];
  for (const c of cmds) {
    const t = c[0] as string;
    const n = c.slice(1) as number[];
    if (t === "M") {
      if (cur.length) rings.push(cur);
      p = [n[0] + x0, n[1]];
      cur = [p];
    } else if (t === "L") {
      p = [n[0] + x0, n[1]];
      cur.push(p);
    } else if (t === "Q") {
      const a = p;
      for (let i = 1; i <= steps; i++) {
        const s = i / steps;
        const u = 1 - s;
        cur.push([u * u * a[0] + 2 * u * s * (n[0] + x0) + s * s * (n[2] + x0), u * u * a[1] + 2 * u * s * n[1] + s * s * n[3]]);
      }
      p = [n[2] + x0, n[3]];
    } else if (t === "C") {
      const a = p;
      for (let i = 1; i <= steps; i++) {
        const s = i / steps;
        const u = 1 - s;
        const b0 = u * u * u;
        const b1 = 3 * u * u * s;
        const b2 = 3 * u * s * s;
        const b3 = s * s * s;
        cur.push([b0 * a[0] + b1 * (n[0] + x0) + b2 * (n[2] + x0) + b3 * (n[4] + x0), b0 * a[1] + b1 * n[1] + b2 * n[3] + b3 * n[5]]);
      }
      p = [n[4] + x0, n[5]];
    } else if (t === "Z") {
      if (cur.length) rings.push(cur);
      cur = [];
    }
  }
  if (cur.length) rings.push(cur);
  // drop a closing point that repeats the first
  return rings.map((r) => (r.length > 1 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 1e-6 ? r.slice(0, -1) : r));
};
const area = (r: Pt[]) => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};
const inside = (pt: Pt, r: Pt[]) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i];
    const b = r[j];
    if (a[1] > pt[1] !== b[1] > pt[1] && pt[0] < ((b[0] - a[0]) * (pt[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
};
/** the word, centred on x = 0 (em), every glyph's rings */
const WORD_X0 = -FOUR_HUNDRED.width / 2;
export const WORD_RINGS: Pt[][][] = FOUR_HUNDRED.glyphs.map((g) => contoursOf(g.cmds, g.x + WORD_X0));

/** THREE.Shapes: a ring whose winding matches the glyph's largest ring is a solid, the others are holes, each hole
 *  going to the smallest solid that contains it */
const shapesOf = (rings: Pt[][]) => {
  const big = rings.reduce((m, r) => (Math.abs(area(r)) > Math.abs(area(m)) ? r : m), rings[0]);
  const solidSign = Math.sign(area(big));
  const solids = rings.filter((r) => Math.sign(area(r)) === solidSign);
  const holes = rings.filter((r) => Math.sign(area(r)) !== solidSign);
  const toV = (r: Pt[]) => r.map(([x, y]) => new THREE.Vector2(x, y));
  const shapes = solids.map((r) => new THREE.Shape(toV(r)));
  for (const h of holes) {
    let best = -1;
    let bestA = Infinity;
    solids.forEach((s, i) => {
      if (inside(h[0], s) && Math.abs(area(s)) < bestA) {
        best = i;
        bestA = Math.abs(area(s));
      }
    });
    if (best >= 0) shapes[best].holes.push(new THREE.Path(toV(h)));
  }
  return shapes;
};

let GEO: Any = null;
/** the extruded word in em units: x centred, baseline y 0, the FACE at z 0 (toward +z = toward the camera), the back
 *  at z -depth */
const wordGeo = () => {
  if (GEO) return GEO;
  const shapes = WORD_RINGS.flatMap((r) => shapesOf(r));
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth: TYPE3D.depth - 2 * TYPE3D.bevel,
    bevelEnabled: true,
    bevelThickness: TYPE3D.bevel,
    bevelSize: TYPE3D.bevel,
    bevelOffset: -TYPE3D.bevel * 0.5,
    bevelSegments: 2,
    curveSegments: 1,
  });
  // ExtrudeGeometry runs z from -bevel to depth - bevel: put the face at 0
  g.translate(0, 0, -(TYPE3D.depth - TYPE3D.bevel));
  // smooth normals along the curves (the 0s, the $), crisp at the corners and the face / side edges
  GEO = toCreasedNormals(g, 32 * D2R);
  return GEO;
};

// ---------------------------------------------------------------------------
// MATERIAL: the clip's key light, stout amber face, amber-to-umber sides
// ---------------------------------------------------------------------------
const TYPE_VERT = /* glsl */ `
varying vec3 vL;
varying vec3 vLN;
varying vec3 vW;
varying vec3 vN;
void main() {
  vL = position;
  vLN = normal;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const TYPE_FRAG = /* glsl */ `
uniform vec3 uL;
uniform vec3 uTop;
uniform vec3 uFoot;
uniform vec3 uHot;
uniform vec3 uSideFront;
uniform vec3 uSideBack;
uniform vec3 uShadeMul;
uniform vec3 uBounce;
uniform vec3 uHaze;
uniform float uCap;
uniform float uDepth;
uniform float uFog;
varying vec3 vL;
varying vec3 vLN;
varying vec3 vW;
varying vec3 vN;
void main() {
  if (vW.y < 0.0) discard;
  vec3 n = normalize(vN);
  vec3 ln = normalize(vLN);
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.38, 0.8, ndl);
  vec3 col;
  if (ln.z > 0.97) {
    // the face: stout amber, top -> foot, held near its paint (the fin's rule)
    vec3 base = mix(uFoot, uTop, smoothstep(0.0, uCap, vL.y));
    col = base * mix(0.93, 1.02, lit);
  } else if (ln.z > 0.15 && vL.z > -0.03) {
    // the front bevel: its upward faces are the hot top edge, the rest amber
    col = ln.y > 0.6 ? mix(uTop, uHot, 0.7) : mix(uFoot * 0.86, uTop, lit);
  } else {
    // the extruded sides: amber at the face running back into umber, lit by the key light
    float t = clamp(-vL.z / uDepth, 0.0, 1.0);
    vec3 base = mix(uSideFront, uSideBack, smoothstep(0.0, 0.85, t));
    col = mix(base * uShadeMul, base * 1.1, lit);
    col = mix(col, col * uBounce, 0.25 * max(-n.y, 0.0));
  }
  // occlusion where the word meets the apron (and, while it rises, at the slot it comes out of)
  col *= mix(0.74, 1.0, smoothstep(0.0, 0.45, vW.y));
  gl_FragColor = vec4(mix(col, uHaze, uFog), 1.0);
}`;
const hex3 = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
/** the sides: a deep amber at the face edge, umber at the back; the shade multiplier keeps them brown, never black */
export const TYPE_COLOR = { sideFront: "#D88A12", sideBack: "#7A4518", shadeMul: "#82684F", bounce: "#E9CFA6" } as const;
const makeMat = () =>
  new THREE.ShaderMaterial({
    vertexShader: TYPE_VERT,
    fragmentShader: TYPE_FRAG,
    uniforms: {
      uL: { value: new THREE.Vector3(LIGHT.side[0], LIGHT.side[1], -LIGHT.side[2]) },
      uTop: { value: hex3(COLOR.amberTop) },
      uFoot: { value: hex3(COLOR.amberFoot) },
      uHot: { value: hex3(COLOR.amberHot) },
      uSideFront: { value: hex3(TYPE_COLOR.sideFront) },
      uSideBack: { value: hex3(TYPE_COLOR.sideBack) },
      uShadeMul: { value: hex3(TYPE_COLOR.shadeMul) },
      uBounce: { value: hex3(TYPE_COLOR.bounce) },
      uHaze: { value: hex3("#EFD5A7") },
      uCap: { value: FOUR_HUNDRED.capHeight },
      uDepth: { value: TYPE3D.depth },
      uFog: { value: 0 },
    },
  });

// ---------------------------------------------------------------------------
// PLACEMENT
// ---------------------------------------------------------------------------
/** where the word stands: its face's base centre [X, Z] on the apron, its turn (deg; like the heap's: its right end
 *  nearer the camera) and its rise (m; 0 = standing on the apron, negative = still under it) */
export type TypePlace = { at: [number, number]; turn: number; rise: number };
/** em-local (x along the word, y up, z toward the camera from the face) -> world [X, Y, Z] */
export const typeToWorld = (p: TypePlace, x: number, y: number, z: number): V3 => {
  const c = Math.cos(p.turn * D2R);
  const s = Math.sin(p.turn * D2R);
  const e = TYPE3D.em;
  // U (along the word) = (c, s) in (X, Z); the face normal (toward the camera) = (s, -c)
  return [p.at[0] + x * e * c + z * e * s, y * e + p.rise, p.at[1] + x * e * s - z * e * c];
};

// ---------------------------------------------------------------------------
// THE CANVAS (aircraftShared's camera, copied: CameraRig is not exported)
// ---------------------------------------------------------------------------
const Rig: React.FC<{ cam: SideCam }> = ({ cam }) => {
  const { camera } = useThree();
  const c = camera as Any;
  const horizon = cam.horizon ?? 960;
  c.fov = (2 * Math.atan(960 / cam.f) * 180) / Math.PI;
  c.aspect = W / H;
  c.near = 1;
  c.far = 5000;
  c.position.set(cam.x, cam.y, -cam.z);
  c.rotation.order = "YXZ";
  c.rotation.set(-(cam.pitch ?? 0) * D2R, -(cam.yaw ?? 0) * D2R, 0);
  c.setViewOffset(W, H, 0, 960 - horizon, W, H);
  c.updateProjectionMatrix();
  c.updateMatrixWorld();
  return null;
};
const Word: React.FC<{ cam: SideCam; p: TypePlace }> = ({ cam, p }) => {
  const o = useMemo(() => {
    const mesh = new THREE.Mesh(wordGeo(), makeMat());
    mesh.frustumCulled = false;
    return mesh;
  }, []);
  // three: (X, Y, -Z); the word's local +x runs along U = (cos, sin) in (X, Z) -> (cos, 0, -sin): a turn about +Y
  o.position.set(p.at[0], p.rise, -p.at[1]);
  o.rotation.set(0, p.turn * D2R, 0);
  o.scale.set(TYPE3D.em, TYPE3D.em, TYPE3D.em);
  o.updateMatrixWorld();
  o.material.uniforms.uFog.value = fogAmount(airProject(cam, [p.at[0], 2, p.at[1]]).d);
  return <primitive object={o} />;
};

/** the word's one cast shadow and its contact shadow on the apron (SVG, screen px) */
const SUN = { x: -LIGHT.side[0] / LIGHT.side[1], z: -LIGHT.side[2] / LIGHT.side[1] };
const shadowPath = (cam: SideCam, p: TypePlace, cap: number) => {
  const segs: string[] = [];
  for (const glyph of WORD_RINGS) {
    for (const z of [0, -TYPE3D.depth]) {
      for (const ring of glyph) {
        const pts = ring.map(([x, y]) => {
          const w = typeToWorld(p, x, y, z);
          const h = Math.max(0, Math.min(cap, w[1]));
          const q = airProject(cam, [w[0] + SUN.x * h, 0, w[2] + SUN.z * h]);
          return `${f3(q.x)} ${f3(q.y)}`;
        });
        segs.push(`M${pts.join("L")}Z`);
      }
    }
  }
  return segs.join(" ");
};
/** where the word meets the apron: per glyph, the x intervals (em) of its slice at the ground (y_em = level) */
const sliceAt = (level: number) => {
  const out: [number, number][] = [];
  for (const glyph of WORD_RINGS) {
    const xs: number[] = [];
    for (const ring of glyph) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        if (a[1] > level !== b[1] > level) xs.push(a[0] + ((level - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
    }
    xs.sort((u, v) => u - v);
    for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]);
  }
  return out;
};
/** the slot / contact: a dark band on the apron under every part of the word that meets it (a little past it all
 *  round: the occlusion of a heavy object standing on concrete) */
const contactPath = (cam: SideCam, p: TypePlace) => {
  const level = -p.rise / TYPE3D.em + 0.004;
  const pad = 0.035;
  const front = 0.12;
  const segs: string[] = [];
  for (const [a, b] of sliceAt(level)) {
    const quad = [
      [a - pad, front],
      [b + pad, front],
      [b + pad, -TYPE3D.depth - pad],
      [a - pad, -TYPE3D.depth - pad],
    ].map(([x, z]) => {
      const w = typeToWorld(p, x, 0, z);
      const q = airProject(cam, [w[0], 0, w[2]]);
      return `${f3(q.x)} ${f3(q.y)}`;
    });
    segs.push(`M${quad.join("L")}Z`);
  }
  return segs.join(" ");
};
export const TypeShadow: React.FC<{ cam: SideCam; p: TypePlace }> = ({ cam, p }) => {
  if (p.rise + Y_HI * TYPE3D.em <= 0) return null;
  const s = airProject(cam, typeToWorld(p, 0, 0, 0)).s;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <g style={{ filter: `blur(${f3(Math.max(1, s * 0.05))}px)` }} opacity={0.42}>
        <path d={shadowPath(cam, p, 1e9)} fill={COLOR.shadow} fillRule="nonzero" />
      </g>
      <g style={{ filter: `blur(${f3(Math.max(0.8, s * 0.03))}px)` }} opacity={0.5}>
        <path d={shadowPath(cam, p, 0.45)} fill={COLOR.shadow} fillRule="nonzero" />
      </g>
      <g style={{ filter: `blur(${f3(Math.max(0.8, s * 0.03))}px)` }} opacity={0.62}>
        <path d={contactPath(cam, p)} fill={COLOR.shadow} />
      </g>
    </svg>
  );
};

/** the word itself (above everything in the overlay), with the stout fixed bloom */
export const TypeWord: React.FC<{ cam: SideCam; p: TypePlace; bloom?: number }> = ({ cam, p, bloom = 1.4 }) => {
  if (p.rise + Y_HI * TYPE3D.em <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, filter: bloomFilter(bloom) }}>
      <ThreeCanvas width={W} height={H} flat linear style={{ position: "absolute", left: 0, top: 0 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
        <Rig cam={cam} />
        <Word cam={cam} p={p} />
      </ThreeCanvas>
    </div>
  );
};
export const TYPE_Y = { lo: Y_LO, hi: Y_HI } as const;
