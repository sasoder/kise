// reactorVessel: the objects of cut 9 (FissionLongTime), on nuclearWorld.
//   <PwrVessel at S rods shadow?>  a cutaway pressurised water reactor vessel standing on the board, cream clay, amber core.
//   <PhotoPrint at yaw url>        a real b&w photographic print lying on the board: paper border, curl, one soft shadow.
// Proportions follow a typical four-loop PWR vessel (about 5 m across outside, 13 m tall to the head, a 3.4 m wide, 4 m tall
// core, control rod drive housings above the head). One departure: the core sits about 1 m higher than the real one, on a
// support skirt, so the amber clears the caption bands (y 1080-1250) and only plain lower shell stands in them.
import React, { useMemo } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLOR, GROUND } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, SHADOW_DIR, SHADOW_LEN, SoftShadows, nuclearMaterial, withClayAttrs } from "./nuclearWorld";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const D2R = Math.PI / 180;
const hex3 = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);

// ===================================================================================================================
// THE VESSEL. Units: 65 units = 1 m, so the whole object is VESSEL.H = 1250 units tall.
// ===================================================================================================================
export const VESSEL = {
  H: 1250,
  R: 163, // outside radius of the shell
  RI: 143, // inside radius
  DOME_Y: 191, // where the lower head meets the cylinder
  CUT_Y0: 352, // the window's sill
  CUT_Y1: 812, // the window's lintel
  CORE_Y0: 362,
  CORE_Y1: 622,
  CORE_R: 112,
  NOZZLE_Y: 722,
  FLANGE_Y0: 820,
  FLANGE_Y1: 868,
  HEAD_TOP: 990,
  OPEN_HALF: 64, // half the angle of the wedge sliced away
  OPEN_DIR: -3, // the wedge's centre, degrees toward +X from facing the camera
} as const;

const lathe = (pts: [number, number][], seg = 96, phiStart = 0, phiLength = Math.PI * 2) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg, phiStart, phiLength);
const merged = (list: Any[]) => mergeGeometries(list, false);
const onAxisArc = (r: number, cy: number, a0: number, a1: number, n: number, ry = r): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    out.push([Math.max(0.001, r * Math.cos(a)), cy + ry * Math.sin(a)]);
  }
  return out;
};
const quad = (a: number[], b: number[], c: number[], d: number[]) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c, ...d]), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(8), 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
};
const cutFace = (phi: number, r0: number, r1: number, y0: number, y1: number) => {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  return quad([r0 * s, y0, r0 * c], [r1 * s, y0, r1 * c], [r1 * s, y1, r1 * c], [r0 * s, y1, r0 * c]);
};

/** a pipe stub out of the shell along the azimuth phi: tapered, with a lip and a dim bore */
const nozzle = (phi: number, y: number, tone: number) => {
  const { R } = VESSEL;
  const body = lathe(
    [
      [66, R - 12],
      [64, R - 5],
      [56, R + 14],
      [44, R + 46],
      [40, R + 92],
      [46, R + 96],
      [47, R + 104],
      [43, R + 108],
      [29, R + 108],
      [27, R + 100],
    ],
    48,
  );
  const m = new THREE.Matrix4();
  // lathe axis +Y -> the radial direction (sin phi, 0, cos phi), then up to the nozzle's height
  m.makeRotationAxis(new THREE.Vector3(Math.cos(phi), 0, -Math.sin(phi)), Math.PI / 2);
  m.setPosition(0, y, 0);
  body.applyMatrix4(m);
  return withClayAttrs(body, tone);
};

// The coolant pipes: each nozzle runs on as one thick pipe with one rounded elbow that bends away into depth, far past the frame.
// [nozzle azimuth, azimuth after the elbow], degrees off OPEN_DIR. Azimuth 90 = +X, 180 = straight away from the camera.
const PIPES: [number, number][] = [
  [96, 128],
  [-96, -135],
  [140, 130],
  [-140, -137],
];
const PIPE = { R: 41, ELBOW_R: 150, LONG: 3600 } as const;
const pipePath = (az0: number, az1: number) => {
  const dirAt = (az: number): [number, number] => [Math.sin((VESSEL.OPEN_DIR + az) * D2R), Math.cos((VESSEL.OPEN_DIR + az) * D2R)];
  const d0 = dirAt(az0);
  const start: [number, number] = [d0[0] * (VESSEL.R + 90), d0[1] * (VESSEL.R + 90)];
  const elbow: [number, number][] = [start, [start[0] + d0[0] * 34, start[1] + d0[1] * 34]];
  const N = 32;
  const step = (Math.abs(az1 - az0) * D2R * PIPE.ELBOW_R) / N;
  let p = elbow[1];
  for (let i = 1; i <= N; i++) {
    const d = dirAt(az0 + ((az1 - az0) * (i - 0.5)) / N);
    p = [p[0] + d[0] * step, p[1] + d[1] * step];
    elbow.push(p);
  }
  return { elbow, end: p, dir: dirAt(az1) };
};
const pipeGeos = (y: number) => {
  const out: Any[] = [];
  for (const [a0, a1] of PIPES) {
    const { elbow, end, dir } = pipePath(a0, a1);
    const curve = new THREE.CatmullRomCurve3(elbow.map((q) => new THREE.Vector3(q[0], y, q[1])), false, "centripetal");
    out.push(withClayAttrs(new THREE.TubeGeometry(curve, 64, PIPE.R, 32, false), 0.92));
    const run = new THREE.LineCurve3(new THREE.Vector3(end[0], y, end[1]), new THREE.Vector3(end[0] + dir[0] * PIPE.LONG, y, end[1] + dir[1] * PIPE.LONG));
    out.push(withClayAttrs(new THREE.TubeGeometry(run, 8, PIPE.R, 32, false), 0.92));
  }
  return out;
};

type VesselParts = { clay: Any; dim: Any; rods: Any; rodTips: Any; core: Any; water: Any; waterTop: Any };
let partsCache: VesselParts | null = null;
const CELL = 19.5;
/** the lattice cells that fit inside the core's circle; `every` thins it for the control rods */
const coreCells = (every = 1) => {
  const out: [number, number][] = [];
  const n = Math.ceil(VESSEL.CORE_R / CELL) + 1;
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      if (every > 1 && ((i + n) % every !== 0 || (j + n) % every !== 0)) continue;
      const x = i * CELL;
      const z = j * CELL;
      if (Math.hypot(Math.abs(x) + CELL * 0.28, Math.abs(z) + CELL * 0.28) <= VESSEL.CORE_R) out.push([x, z]);
    }
  }
  return out;
};
const ROD_CELLS = coreCells(2);
/** rod tip at this height when `rods` = 0 and 1 */
export const ROD_TIP = { from: 644, to: 692 } as const;

const vesselParts = (): VesselParts => {
  if (partsCache) return partsCache;
  const V = VESSEL;
  const { R, RI } = V;
  const phi0 = (V.OPEN_DIR + V.OPEN_HALF) * D2R;
  const phiLen = (360 - 2 * V.OPEN_HALF) * D2R;
  const phi1 = phi0 + phiLen;

  // ---------- cream clay: skirt, lower head, closed lower shell, the sliced shell, flange, head, drive housings, nozzles
  const skirtR = 96;
  const domeC = V.DOME_Y;
  const lower: [number, number][] = [
    [0.001, 0],
    [skirtR + 14, 0],
    [skirtR + 16, 3],
    [skirtR + 16, 10],
    [skirtR + 10, 14],
    [skirtR + 2, 18],
    [skirtR, 24],
    ...onAxisArc(R, domeC, -54, 0, 26),
    [R, 250],
    [R + 1.8, 252],
    [R + 1.8, 256],
    [R, 258],
    [R, V.CUT_Y0],
    [RI, V.CUT_Y0],
  ];
  const lowerG = withClayAttrs(lathe(lower), 0.75);
  const shellOuter = withClayAttrs(
    lathe(
      [
        [R, V.CUT_Y0],
        [R, 500],
        [R + 1.8, 502],
        [R + 1.8, 506],
        [R, 508],
        [R, V.CUT_Y1],
      ],
      96,
      phi0,
      phiLen,
    ),
    1,
  );
  const faceA = withClayAttrs(cutFace(phi0, RI, R, V.CUT_Y0, V.CUT_Y1), 1);
  const faceB = withClayAttrs(cutFace(phi1, RI, R, V.CUT_Y0, V.CUT_Y1), 1);
  // the band over the window, then the flange and the bolted head
  const top: [number, number][] = [
    [RI, V.CUT_Y1],
    [R, V.CUT_Y1],
    [R, V.FLANGE_Y0 - 8],
    [R + 8, V.FLANGE_Y0 - 3],
    [R + 30, V.FLANGE_Y0],
    [R + 36, V.FLANGE_Y0 + 4],
    [R + 36, 842],
    [R + 33, 844.5],
    [R + 33, 847],
    [R + 36, 849.5],
    [R + 36, V.FLANGE_Y1 - 4],
    [R + 31, V.FLANGE_Y1],
    [R + 8, V.FLANGE_Y1 + 1],
    ...onAxisArc(R, V.FLANGE_Y1 + 3, 0, 89.9, 28, V.HEAD_TOP - V.FLANGE_Y1 - 3),
  ];
  const topG = withClayAttrs(lathe(top), 1);
  const list: Any[] = [lowerG, shellOuter, faceA, faceB, topG];
  // the closure studs around the flange
  for (let i = 0; i < 36; i++) {
    const a = ((i + 0.5) / 36) * Math.PI * 2;
    const r = R + 21;
    const stud = lathe([[0.001, 0], [5.4, 0], [5.4, 12], [3.6, 15], [0.001, 15]], 10);
    stud.translate(Math.sin(a) * r, V.FLANGE_Y1 - 1, Math.cos(a) * r);
    list.push(withClayAttrs(stud, 0.9));
  }
  // the control rod drive housings: a tight forest of tubes standing on the dome
  const headH = V.HEAD_TOP - V.FLANGE_Y1 - 3;
  const domeAt = (r: number) => V.FLANGE_Y1 + 3 + headH * Math.sqrt(Math.max(0, 1 - (r / R) * (r / R)));
  const pitch = 27;
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const x = i * pitch;
      const z = j * pitch;
      const r = Math.hypot(x, z);
      if (r > pitch * 4.2) continue;
      const y0 = domeAt(r) - 4;
      const top1 = V.H - 2 - (r / (pitch * 4.2)) * 14;
      const tube = lathe(
        [
          [9.6, y0],
          [9.6, y0 + 16],
          [7, y0 + 20],
          [7, y0 + 92],
          [9.8, y0 + 96],
          [9.8, y0 + 130],
          [7, y0 + 134],
          [7, top1 - 14],
          [8.6, top1 - 11],
          [8.6, top1 - 4],
          [5.4, top1 - 1],
          [0.001, top1],
        ],
        14,
      );
      tube.translate(x, 0, z);
      list.push(withClayAttrs(tube, 0.95));
    }
  }
  // inlet and outlet nozzles: both sides of the sliced shell, and two more behind
  for (const az of [96, -96, 140, -140]) list.push(nozzle((V.OPEN_DIR + az) * D2R, V.NOZZLE_Y, 0.9));
  list.push(...pipeGeos(V.NOZZLE_Y));
  const clay = merged(list);

  // ---------- dim clay: inside of the shell, floor and ceiling of the window, nozzle bores
  const inner = withClayAttrs(lathe([[RI, V.CUT_Y0], [RI, V.CUT_Y1]], 96, phi0, phiLen), 0.5);
  const floor = withClayAttrs(lathe([[0.001, V.CUT_Y0 + 0.5], [RI + 0.5, V.CUT_Y0 + 0.5]], 72), 0.5);
  const ceil = withClayAttrs(lathe([[0.001, V.CUT_Y1], [RI + 0.5, V.CUT_Y1]], 72), 0.5);
  const bores: Any[] = [inner, floor, ceil];
  for (const az of [96, -96, 140, -140]) {
    const p = (V.OPEN_DIR + az) * D2R;
    const b = lathe([[0.001, R + 100], [28, R + 100]], 24);
    const m = new THREE.Matrix4();
    m.makeRotationAxis(new THREE.Vector3(Math.cos(p), 0, -Math.sin(p)), Math.PI / 2);
    m.setPosition(0, V.NOZZLE_Y, 0);
    b.applyMatrix4(m);
    bores.push(withClayAttrs(b, 0.3));
  }
  const dim = merged(bores);

  // ---------- control rods: a bundle hung from above the window; the tip is the dim piece so the travel reads
  const rodList: Any[] = [];
  const tipList: Any[] = [];
  for (const [x, z] of ROD_CELLS) {
    const rod = lathe([[3.1, 0], [3.1, V.CUT_Y1 - ROD_TIP.from + 80]], 10);
    rod.translate(x, 0, z);
    rodList.push(withClayAttrs(rod, 1));
    const tip = lathe([[0.001, -3], [3.5, 0], [3.5, 14]], 10);
    tip.translate(x, 0, z);
    tipList.push(withClayAttrs(tip, 0.4));
  }

  // ---------- the fuel: square assemblies with a phase each
  const coreList: Any[] = [];
  coreCells().forEach(([x, z], i) => {
    const h = V.CORE_Y1 - V.CORE_Y0;
    const b = new THREE.BoxGeometry(CELL - 0.9, h, CELL - 0.9);
    b.translate(x, V.CORE_Y0 + h / 2, z);
    const n = b.attributes.position.count;
    const ph = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    b.setAttribute("aPh", new THREE.BufferAttribute(new Float32Array(n).fill(Math.abs(ph)), 1));
    coreList.push(b);
  });

  // ---------- the water: one glass volume that fills the vessel up to just under the lintel
  const water = lathe([[RI - 0.6, V.CUT_Y0 + 1], [RI - 0.6, 770]], 72);
  const waterTop = lathe([[0.001, 770], [RI - 0.6, 770]], 72);

  partsCache = { clay, dim, rods: merged(rodList), rodTips: merged(tipList), core: merged(coreList), water, waterTop };
  return partsCache;
};

// The amber fuel: rods and spacer grids drawn on each assembly's faces, a dark seam between assemblies, and a slow soft
// shimmer running up the core. The stage's bloom stays fixed; only this small tone drift lives.
const CORE_VERT = /* glsl */ `
attribute float aPh;
varying vec3 vW; varying vec3 vN; varying vec2 vU; varying float vPh;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vU = uv; vPh = aPh;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CORE_FRAG = /* glsl */ `
uniform vec3 uL; uniform vec3 uTop; uniform vec3 uFoot; uniform vec3 uHot; uniform float uS;
varying vec3 vW; varying vec3 vN; varying vec2 vU; varying float vPh;
void main() {
  vec3 n = normalize(vN);
  float lit = smoothstep(-0.55, 0.85, dot(n, uL));
  vec3 col = mix(uFoot, uTop, lit);
  float side = 1.0 - step(0.5, abs(n.y));
  float rods = 0.5 + 0.5 * cos(vU.x * 6.28318 * 5.0);
  col *= 1.0 - 0.07 * rods * side;
  float grid = smoothstep(0.82, 0.9, fract(vU.y * 5.0 + 0.1)) * (1.0 - smoothstep(0.93, 1.0, fract(vU.y * 5.0 + 0.1)));
  col = mix(col, uHot, 0.2 * grid * side);
  float ex = min(vU.x, 1.0 - vU.x);
  float ey = min(vU.y, 1.0 - vU.y);
  float seam = side > 0.5 ? ex : min(ex, ey);
  col *= mix(0.66, 1.0, smoothstep(0.0, 0.1, seam));
  col = mix(col, uHot, 0.42 * (1.0 - side));
  float sh = 0.5 + 0.5 * sin(uS * 0.17 - vW.y * 0.03 + vPh * 6.28318);
  col = mix(col, uHot, 0.1 * sh * sh);
  gl_FragColor = vec4(col, 1.0);
}`;
let coreMat: Any = null;
const getCoreMat = () => {
  if (coreMat) return coreMat;
  coreMat = new THREE.ShaderMaterial({
    vertexShader: CORE_VERT,
    fragmentShader: CORE_FRAG,
    uniforms: {
      uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
      uTop: { value: hex3(COLOR.amberTop) },
      uFoot: { value: hex3(COLOR.amberFoot) },
      uHot: { value: hex3(COLOR.amberHot) },
      uS: { value: 0 },
    },
  });
  return coreMat;
};

/** One shadow layer for the whole object: the vessel, plus the two front pipes thrown along the light from their height. */
const shadowItems = (at: [number, number], alpha: number) => {
  const items = [{ x: at[0], z: at[1], len: VESSEL.H * SHADOW_LEN, r: VESSEL.R * 0.8, soft: 34, alpha }];
  const off = VESSEL.NOZZLE_Y * SHADOW_LEN;
  for (const [a0, a1] of PIPES.slice(0, 2)) {
    const { end, dir } = pipePath(a0, a1);
    // the pipe's local z is three's: toward the camera. The board's Z runs away, hence the signs.
    items.push({
      x: at[0] + end[0] + SHADOW_DIR[0] * off,
      z: at[1] - end[1] + SHADOW_DIR[1] * off,
      len: a0 < 0 ? 1100 : 2200, // the left shadow ends out of shot until its pipe is in shot
      r: PIPE.R * 1.1,
      soft: 26,
      alpha: alpha * 0.8,
      dirX: dir[0],
      dirZ: -dir[1],
    } as (typeof items)[number]);
  }
  return items;
};

export type PwrVesselProps = {
  at: [number, number];
  /** story clock, for the shimmer */
  S: number;
  /** the control rods' travel 0..1 (ROD_TIP.from .. ROD_TIP.to) */
  rods: number;
  shadow?: number;
};
export const PwrVessel: React.FC<PwrVesselProps> = ({ at, S, rods, shadow = 1 }) => {
  const o = useMemo(() => {
    const p = vesselParts();
    const mk = (g: Any, m: Any, order: number) => {
      const me = new THREE.Mesh(g, m);
      me.frustumCulled = false;
      me.renderOrder = order;
      return me;
    };
    return {
      clay: mk(p.clay, nuclearMaterial("clay"), 1),
      dim: mk(p.dim, nuclearMaterial("clayDim"), 1),
      core: mk(p.core, getCoreMat(), 1),
      rods: mk(p.rods, nuclearMaterial("clay"), 1),
      tips: mk(p.rodTips, nuclearMaterial("clayDim"), 1),
      water: mk(p.water, nuclearMaterial("glass"), 6),
      waterTop: mk(p.waterTop, nuclearMaterial("glass"), 5),
    };
  }, []);
  for (const k of ["clay", "dim", "core", "water", "waterTop"] as const) o[k].position.set(at[0], 0, -at[1]);
  const tip = ROD_TIP.from + (ROD_TIP.to - ROD_TIP.from) * rods;
  o.rods.position.set(at[0], tip, -at[1]);
  o.tips.position.set(at[0], tip, -at[1]);
  getCoreMat().uniforms.uS.value = S;
  return (
    <>
      {shadow > 0 ? <SoftShadows items={shadowItems(at, shadow)} /> : null}
      <primitive object={o.clay} />
      <primitive object={o.dim} />
      <primitive object={o.core} />
      <primitive object={o.rods} />
      <primitive object={o.tips} />
      <primitive object={o.waterTop} />
      <primitive object={o.water} />
    </>
  );
};

// ===================================================================================================================
// THE CALM BOARD: the same board texture, used with NuclearStage floor={false}. At a low camera the board's big soft blotches
// are squeezed by the foreshortening into horizontal bands. Those low frequencies are what this removes, by the angle of view:
// from above the board is untouched, at a grazing angle only its fine fibre stays, on the board's own ground colour.
// ===================================================================================================================
const BOARD_VERT = /* glsl */ `
varying vec3 vW;
void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BOARD_FRAG = /* glsl */ `
uniform sampler2D uTex; uniform float uUnits; uniform vec3 uGround; uniform vec2 uFog;
varying vec3 vW;
void main() {
  vec2 uv = vec2(vW.x, vW.z) / uUnits + 0.5;
  vec3 tex = texture2D(uTex, uv).rgb;
  vec3 low = texture2D(uTex, uv, 4.0).rgb;
  vec3 eye = cameraPosition - vW;
  float dist = length(eye);
  float graze = eye.y / dist;
  float calm = 1.0 - smoothstep(0.3, 0.62, graze);
  vec3 col = mix(tex, uGround + (tex - low) * 0.8, calm);
  col = mix(col, uGround, smoothstep(uFog.x, uFog.y, dist));
  gl_FragColor = vec4(col, 0.0);
}`;
export const CalmBoard: React.FC<{ units: number; d: number; fog?: [number, number] }> = ({ units, d, fog = [1.6, 6] }) => {
  const entry = loadPhoto(GROUND.src, true);
  const [, force] = React.useState(0);
  if (!entry.tex) {
    throw entry.wait.then(() => force(1));
  }
  const o = useMemo(() => {
    const g = new THREE.PlaneGeometry(200000, 200000);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      vertexShader: BOARD_VERT,
      fragmentShader: BOARD_FRAG,
      blending: THREE.NoBlending,
      uniforms: { uTex: { value: entry.tex }, uUnits: { value: units }, uGround: { value: hex3(COLOR.ground) }, uFog: { value: new THREE.Vector2(1, 2) } },
    });
    const me = new THREE.Mesh(g, m);
    me.frustumCulled = false;
    me.renderOrder = -100;
    return { me, m };
  }, [entry.tex, units]);
  o.m.uniforms.uFog.value.set(d * fog[0], d * fog[1]);
  return <primitive object={o.me} />;
};

// ===================================================================================================================
// THE PRINT: one real photograph as a curled sheet of paper on the board. A three texture (delayRender), so it can never
// drop a frame; its shadow goes into the stage's shadow layer with the same MAX blending as SoftShadows.
// ===================================================================================================================
const texCache = new Map<string, { tex: Any; wait: Promise<void> }>();
const loadPhoto = (url: string, mirrored = false) => {
  const have = texCache.get(url);
  if (have) return have;
  const h = delayRender(`print ${url}`);
  const entry: { tex: Any; wait: Promise<void> } = { tex: null, wait: Promise.resolve() };
  entry.wait = new Promise<void>((res, rej) => {
    new THREE.TextureLoader().load(
      staticFile(url),
      (t: Any) => {
        t.anisotropy = 16;
        if (mirrored) t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        entry.tex = t;
        continueRender(h);
        res();
      },
      undefined,
      (e: unknown) => rej(e),
    );
  });
  texCache.set(url, entry);
  return entry;
};
const PRINT_VERT = /* glsl */ `
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); vU = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PRINT_FRAG = /* glsl */ `
uniform sampler2D uTex; uniform vec3 uL; uniform vec3 uPaper; uniform vec3 uInk; uniform vec2 uBorder;
varying vec3 vW; varying vec3 vN; varying vec2 vU;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec2 p = (vU - uBorder) / (1.0 - 2.0 * uBorder);
  vec2 aa = fwidth(vU) * 0.7;
  vec2 ins = smoothstep(uBorder - aa, uBorder + aa, vU) * (1.0 - smoothstep(1.0 - uBorder - aa, 1.0 - uBorder + aa, vU));
  float inside = ins.x * ins.y;
  float lum = dot(texture2D(uTex, clamp(p, 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
  // a silver print: its deepest tone is a deep brown-grey, not pure black
  vec3 photo = mix(uInk, vec3(0.955, 0.945, 0.92), lum);
  vec3 col = mix(uPaper, photo, inside);
  float lit = smoothstep(0.1, 0.95, dot(n, uL));
  col *= mix(0.68, 1.0, lit);
  // the print's own faint sheen, which travels as the camera moves across the curl
  col += vec3(0.05, 0.047, 0.04) * pow(max(dot(n, normalize(uL + V)), 0.0), 40.0) * inside;
  gl_FragColor = vec4(col, 1.0);
}`;
const PR_SHADOW_VERT = /* glsl */ `
varying vec2 vP;
void main() { vP = position.xz; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
const PR_SHADOW_FRAG = /* glsl */ `
uniform vec2 uHalf; uniform float uSoft; uniform float uAlpha;
varying vec2 vP;
void main() {
  vec2 q = abs(vP) - uHalf;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  float a = 1.0 - smoothstep(-uSoft, uSoft, sd);
  gl_FragColor = vec4(0.0, 0.0, 0.0, a * uAlpha);
}`;
export const printHeight = (width: number, photoAspect: number, border: number) => (width * (1 - 2 * border)) / photoAspect + 2 * border * width;

export type PhotoPrintProps = {
  url: string;
  at: [number, number];
  width: number;
  /** the picture's width / height */
  photoAspect: number;
  /** paper border, as a share of the print's width */
  border?: number;
  yaw?: number;
};
export const PhotoPrint: React.FC<PhotoPrintProps> = ({ url, at, width, photoAspect, border = 0.032, yaw = 0 }) => {
  const entry = loadPhoto(url);
  const [, force] = React.useState(0);
  if (!entry.tex) {
    throw entry.wait.then(() => force(1));
  }
  const height = printHeight(width, photoAspect, border);
  const o = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, 96, 72);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const sm = (a: number, b: number, v: number) => {
      const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    for (let i = 0; i < pos.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      // lies on the board, but the far edge curls up, most at the far right corner, and the near left corner lifts a little
      const far = sm(0.55, 1, v);
      const right = sm(0.1, 1, u);
      const nearLeft = sm(0.72, 1, 1 - v) * sm(0.72, 1, 1 - u);
      const y = 4 + far * far * (14 + 44 * right * right) + nearLeft * nearLeft * 22 + 1.2 * Math.sin(u * 5.1 + 0.6) * Math.sin(v * 3.3);
      pos.setY(i, y);
    }
    g.computeVertexNormals();
    const paperAspect = height / width;
    const m = new THREE.ShaderMaterial({
      vertexShader: PRINT_VERT,
      fragmentShader: PRINT_FRAG,
      side: THREE.DoubleSide,
      extensions: { derivatives: true },
      uniforms: {
        uTex: { value: entry.tex },
        uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
        uPaper: { value: hex3("#EFE8D9") },
        uInk: { value: hex3("#211A15") },
        uBorder: { value: new THREE.Vector2(border, border / paperAspect) },
      },
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1;
    // the one shadow: the sheet's rectangle, slid along the light by how far the paper stands off the board
    const sg = new THREE.PlaneGeometry(width + 240, height + 240);
    sg.rotateX(-Math.PI / 2);
    const sm2 = new THREE.ShaderMaterial({
      vertexShader: PR_SHADOW_VERT,
      fragmentShader: PR_SHADOW_FRAG,
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
      uniforms: { uHalf: { value: new THREE.Vector2(width / 2 - 6, height / 2 - 6) }, uSoft: { value: 18 }, uAlpha: { value: 0.8 } },
    });
    const shadow = new THREE.Mesh(sg, sm2);
    shadow.frustumCulled = false;
    shadow.renderOrder = -80;
    return { mesh, shadow };
  }, [width, height, border, entry.tex]);
  o.mesh.position.set(at[0], 0, -at[1]);
  o.mesh.rotation.set(0, yaw * D2R, 0);
  o.shadow.position.set(at[0] + SHADOW_DIR[0] * 26, 0.02, -(at[1] - 16));
  o.shadow.rotation.set(0, yaw * D2R, 0);
  return (
    <>
      <primitive object={o.shadow} />
      <primitive object={o.mesh} />
    </>
  );
};
