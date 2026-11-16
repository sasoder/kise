// SURVIVED_SLAB
// ===================================================================================================================
// survivedSlab: ThreeOrFourSurvived's slab map, a clip-local variant of nik-revolut-ipo/revolutWorld.tsx (which stays
// untouched; its land material and board loader are private, so the floor, the land build and the shaders are restated
// here). Same board floor, clay, key light, tall Miller projection and slab (WORLD_SLAB) as the sister world, with two
// changes for this cut:
//   - EUROPE IS THE LIT STAGE: European land is board, as in the sister world; all other land (Africa, the Middle East,
//     Turkey, Russia, the Caucasus, Greenland, overseas territories) recedes to the style's dark tone (ground mixed
//     toward board), so the empty North African plain stops pulling the eye.
//   - ISLANDS: rings under ISLAND_MIN sq units are dropped, and Corsica and Sardinia by box (under the low camera of
//     the pull-out their thick slabs read as standing lumps). Sicily, Ireland, Iceland and the big Danish and Baltic
//     islands stay.
// Put <SurvivedSlab> in NuclearStage's `world` with `floor={false}`; call useSurvivedBoard() at the top of the cut.
// ===================================================================================================================
import React, { useMemo } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR, GROUND } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, SHADOW_DIR, SHADOW_LEN, WORLD_SLAB, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { slabRings, type Ring } from "./survivedLand";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const col3 = (h: string) => new THREE.Vector3(...hex3(h));

/** the dark rung of the tone ladder (ground mixed toward board): the land that is not Europe */
export const DARK_LAND = 0.3;

// --- uniforms and shading: as revolutWorld / nuclearWorld (same light, palette, clay) ---------------------------------
const mix3 = (a: string, b: string, t: number) => {
  const A = hex3(a);
  const B = hex3(b);
  return new THREE.Vector3(...A.map((v, i) => v + (B[i] - v) * t));
};
const U = {
  uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
  uFogRange: { value: new THREE.Vector2(1e5, 2e5) },
  uFogCol: { value: col3(COLOR.ground) },
  uShade: { value: col3("#A88A6E") },
  uCream: { value: col3(COLOR.cream) },
  uBoardTone: { value: col3(COLOR.board) },
  uBoardFoot: { value: col3(COLOR.boardFoot) },
  uDarkTone: { value: mix3(COLOR.ground, COLOR.board, DARK_LAND) },
};
const COMMON_GLSL = /* glsl */ `
uniform vec3 uL;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uShade;
uniform vec3 uCream;
uniform vec3 uBoardTone;
uniform vec3 uBoardFoot;
uniform vec3 uDarkTone;
float fogAt(vec3 w) { return smoothstep(uFogRange.x, uFogRange.y, length(w - cameraPosition)); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 clayShade(vec3 base, vec3 n, vec3 V, float rim) {
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.42, 0.86, ndl);
  vec3 col = mix(base * uShade, base * 1.02, lit);
  col += base * vec3(0.10, 0.055, 0.02) * (1.0 - lit) * (0.45 - 0.45 * n.y);
  float graze = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 1.5);
  col *= 1.0 - 0.16 * graze * (1.0 - smoothstep(0.05, 0.7, n.y));
  col += base * 0.07 * pow(max(dot(n, normalize(uL + V)), 0.0), 16.0);
  col = mix(col, uCream, rim * 0.4 * pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0) * smoothstep(0.05, 0.7, n.y));
  return col;
}
`;

// --- the board floor (as revolutWorld's, with the land's soft shadow) -------------------------------------------------
let boardTex: Any = null;
let boardWait: Promise<void> | null = null;
const loadBoard = () => {
  if (boardWait) return boardWait;
  const h = delayRender("survivedSlab board texture");
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
/** Call at the top of the cut: suspends until the board texture is in. */
export const useSurvivedBoard = () => {
  const [, force] = React.useState(0);
  if (!boardTex) throw loadBoard().then(() => force(1));
};
const FLOOR_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uTex;
uniform sampler2D uLandShadow;
uniform vec4 uLandBox;
uniform vec2 uLandOff;
uniform float uBoardUnits;
varying vec3 vW;
void main() {
  vec2 p = vec2(vW.x, -vW.z);
  vec3 col = texture2D(uTex, p / uBoardUnits + 0.5).rgb;
  float s = texture2D(uLandShadow, (p - uLandOff - uLandBox.xy) / uLandBox.zw).r;
  col = mix(col, ${"vec3(" + hex3(COLOR.shadow).map((v) => v.toFixed(4)).join(",") + ")"}, 0.7 * s);
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 0.0);
}`;
const FLOOR_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

type LandData = { geo: Any; shadow: Any; mask: Any; box: [number, number, number, number] };
let landCache: LandData | null = null;
const buildLand = (): LandData => {
  if (landCache) return landCache;
  const pos: number[] = [];
  const nor: number[] = [];
  const top: number[] = [];
  const dk: number[] = [];
  const idx: number[] = [];
  const allRings: Ring[] = [];
  for (const m of slabRings()) {
    const dark = m.europe ? 0 : 1;
    const contour = m.outer.map((p) => new THREE.Vector2(p[0], p[1]));
    const holes = m.holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    const faces = THREE.ShapeUtils.triangulateShape(contour, holes);
    const base = pos.length / 3;
    for (const p of [m.outer, ...m.holes].flat()) {
      pos.push(p[0], 0, -p[1]);
      nor.push(0, 1, 0);
      top.push(1);
      dk.push(dark);
    }
    for (const fa of faces) idx.push(base + fa[0], base + fa[1], base + fa[2]);
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
          top.push(tt + 2);
          dk.push(dark);
        }
      }
      for (let i = 0; i < n; i++) {
        const a = b + i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("aTop", new THREE.BufferAttribute(new Float32Array(top), 1));
  g.setAttribute("aDark", new THREE.BufferAttribute(new Float32Array(dk), 1));
  g.setIndex(idx);
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
  landCache = { geo: g, mask: raster(WORLD_SLAB.PPU, WORLD_SLAB.PPU * 1.25), shadow: raster(1.6, 1.6 * 2.6), box: [minX, minZ, bw, bh] };
  return landCache;
};

const LAND_VERT = /* glsl */ `
attribute float aTop;
attribute float aDark;
uniform float uT;
varying vec3 vW;
varying vec3 vN;
varying float vWall;
varying float vH;
varying float vDark;
varying vec2 vLoc;
void main() {
  vLoc = vec2(position.x, -position.z);
  float wall = step(1.5, aTop);
  float tp = wall > 0.5 ? aTop - 2.0 : 1.0;
  vec3 p = position;
  p.y = tp * uT;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normal;
  vWall = wall;
  vH = tp;
  vDark = aDark;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LAND_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uMask;
uniform vec4 uBox;
uniform float uBevel;
varying vec3 vW;
varying vec3 vN;
varying float vWall;
varying float vH;
varying float vDark;
varying vec2 vLoc;
void main() {
  vec2 p = vLoc;
  vec2 uv = (p - uBox.xy) / uBox.zw;
  vec2 e = 1.0 / vec2(textureSize(uMask, 0));
  float mx = texture2D(uMask, uv + vec2(e.x, 0.0)).r - texture2D(uMask, uv - vec2(e.x, 0.0)).r;
  float mz = texture2D(uMask, uv + vec2(0.0, e.y)).r - texture2D(uMask, uv - vec2(0.0, e.y)).r;
  vec3 V = normalize(cameraPosition - vW);
  vec3 n;
  if (vWall > 0.5) {
    n = normalize(vN);
    if (dot(n, V) < 0.0) n = -n;
    vec3 toView = normalize(vec3(V.x, 0.0, V.z));
    n = normalize(mix(n, toView, 0.8) + vec3(0.0, 0.9 * smoothstep(0.35, 1.0, vH) + 0.05, 0.0));
  } else {
    n = normalize(vec3(-mx * uBevel, 1.0, mz * uBevel));
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
  vec3 board = mix(uBoardFoot, uBoardTone, 0.55 + 0.45 * mott);
  vec3 base = mix(board, uDarkTone * (0.94 + 0.08 * mott), vDark);
  vec3 col = clayShade(base, n, V, 1.0 - 0.75 * vDark);
  if (vWall > 0.5) col *= mix(0.62, 1.0, smoothstep(0.0, 0.8, vH));
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 0.0);
}`;

/** The board floor plus the land slab: Europe board, everything else dark. In NuclearStage's `world` (`floor={false}`). */
export const SurvivedSlab: React.FC<{ cam: NuclearCam; boardUnits: number; fog: [number, number] }> = ({ cam, boardUnits, fog }) => {
  U.uFogRange.value.set(cam.d * fog[0], cam.d * fog[1]);
  const o = useMemo(() => {
    const d = buildLand();
    const landMat = new THREE.ShaderMaterial({
      vertexShader: LAND_VERT,
      fragmentShader: LAND_FRAG,
      side: THREE.DoubleSide,
      blending: THREE.NoBlending,
      uniforms: {
        ...U,
        uT: { value: WORLD_SLAB.T },
        uMask: { value: d.mask },
        uBox: { value: new THREE.Vector4(d.box[0], d.box[1], d.box[2], d.box[3]) },
        uBevel: { value: 13 },
      },
    });
    const land = new THREE.Mesh(d.geo, landMat);
    land.frustumCulled = false;
    land.renderOrder = -90;
    const fg = new THREE.PlaneGeometry(200000, 200000);
    fg.rotateX(-Math.PI / 2);
    const l = (WORLD_SLAB.T + 1.5) * SHADOW_LEN * 1.5;
    const floorMat = new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      blending: THREE.NoBlending,
      uniforms: {
        ...U,
        uTex: { value: boardTex },
        uLandShadow: { value: d.shadow },
        uLandBox: { value: new THREE.Vector4(d.box[0], d.box[1], d.box[2], d.box[3]) },
        uLandOff: { value: new THREE.Vector2(SHADOW_DIR[0] * l, SHADOW_DIR[1] * l) },
        uBoardUnits: { value: 1296 },
      },
    });
    const floor = new THREE.Mesh(fg, floorMat);
    floor.frustumCulled = false;
    floor.renderOrder = -100;
    return { landMat, land, floorMat, floor };
  }, []);
  o.floorMat.uniforms.uTex.value = boardTex;
  o.floorMat.uniforms.uBoardUnits.value = boardUnits;
  return (
    <>
      <primitive object={o.floor} />
      <primitive object={o.land} />
    </>
  );
};
