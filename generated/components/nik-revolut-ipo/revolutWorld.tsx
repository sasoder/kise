// REVOLUT_WORLD
// ===================================================================================================================
// revolutWorld: nik-revolut-ipo's slab world map with TWO tone channels per country, a clip-local copy of the board
// floor and world slab of scott-nolan-uranium/nuclearWorld.tsx (which stays untouched: its WorldSlab has one global
// `dim` and one amber channel, and its floor context is private). Everything else (NuclearStage: camera rig, shadow
// resolve, bloom, cream pool, vignette, grain) comes from nuclearWorld itself; pass `floor={false}` to NuclearStage and
// put <RevolutWorld> in its `world`. RENDER WITH --gl=angle.
//
//   tone per country (ISO alpha-2): { cream: 0..1, amber: 0..1, raise?: multiplier }
//     base = board clay mixed toward cream by `cream`; amber sweeps west -> east across the country by `amber` and
//     lifts it out of the slab (WORLD_SLAB.RAISE x raise).
//   useRevolutBoard(): call at the top of the cut (suspends until the board texture is loaded).
//
// ADDITIONS (logged per the clip's rule: add, never change; StillToLaunch renders pixel-identical, proven by a
// difference blend of its f0 and f117 before/after):
//   - EuropeAlreadyTheirs (cut 21): CountryTone.lift (0..1, default 0), a lift out of the slab that is NOT tied to
//     amber (WORLD_SLAB.RAISE x lift, added to the amber raise), so a country can warm board -> cream and rise a little.
// ===================================================================================================================
import React, { useMemo } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { geoPath } from "d3-geo";
// @ts-expect-error untyped module
import { feature } from "topojson-client";
import countries50 from "world-atlas/countries-50m.json";
import { COLOR, GROUND } from "../kits/cheeky-pint/stoutShared";
import { KEY_LIGHT, SHADOW_DIR, SHADOW_LEN, WORLD_SLAB, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { ISO_NUM, projTall } from "./revolutGeo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const hex3 = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const col3 = (h: string) => new THREE.Vector3(...hex3(h));

// --- uniforms and shading: as nuclearWorld (same light, palette, clay) ----------------------------------------------
const U = {
  uL: { value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], -KEY_LIGHT[2]) },
  uFogRange: { value: new THREE.Vector2(1e5, 2e5) },
  uFogCol: { value: col3(COLOR.ground) },
  uShade: { value: col3("#A88A6E") },
  uCream: { value: col3(COLOR.cream) },
  uCreamFoot: { value: col3(COLOR.creamFoot) },
  uAmberTop: { value: col3(COLOR.amberTop) },
  uAmberFoot: { value: col3(COLOR.amberFoot) },
  uAmberHot: { value: col3(COLOR.amberHot) },
  uBoardTone: { value: col3(COLOR.board) },
  uBoardFoot: { value: col3(COLOR.boardFoot) },
};
const COMMON_GLSL = /* glsl */ `
uniform vec3 uL;
uniform vec2 uFogRange;
uniform vec3 uFogCol;
uniform vec3 uShade;
uniform vec3 uCream;
uniform vec3 uCreamFoot;
uniform vec3 uAmberTop;
uniform vec3 uAmberFoot;
uniform vec3 uAmberHot;
uniform vec3 uBoardTone;
uniform vec3 uBoardFoot;
float fogAt(vec3 w) { return smoothstep(uFogRange.x, uFogRange.y, length(w - cameraPosition)); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 clayShade(vec3 base, vec3 n, vec3 V) {
  float ndl = dot(n, uL);
  float lit = smoothstep(-0.42, 0.86, ndl);
  vec3 col = mix(base * uShade, base * 1.02, lit);
  col += base * vec3(0.10, 0.055, 0.02) * (1.0 - lit) * (0.45 - 0.45 * n.y);
  float graze = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 1.5);
  col *= 1.0 - 0.16 * graze * (1.0 - smoothstep(0.05, 0.7, n.y));
  col += base * 0.07 * pow(max(dot(n, normalize(uL + V)), 0.0), 16.0);
  col = mix(col, uCream, 0.4 * pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 3.0) * smoothstep(0.05, 0.7, n.y));
  return col;
}
`;

// --- the board floor (as nuclearWorld's, with the land's soft shadow) ------------------------------------------------
let boardTex: Any = null;
let boardWait: Promise<void> | null = null;
const loadBoard = () => {
  if (boardWait) return boardWait;
  const h = delayRender("revolutWorld board texture");
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
export const useRevolutBoard = () => {
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

// --- the land: world-atlas 50m on the tall projection, one id per country ---------------------------------------------
/** home bboxes (lon0, lat0, lon1, lat1): overseas territories stay board when their country is lit */
const HOME_BOX: Record<string, [number, number, number, number]> = {
  "250": [-6, 41, 10, 52], // France: not French Guiana, Reunion ...
  "528": [3, 50, 8, 54], // Netherlands: not the Caribbean islands
  "826": [-9, 49, 2, 61], // UK: not the Falklands ...
  "578": [3, 57, 32, 72], // Norway: not Svalbard, Jan Mayen (outside the EEA)
};
/** split countries: polygons matching `part` get their own tone id (key `as`), e.g. the US's Alaska and Hawaii stay
 *  cream while the lower 48 warm to amber */
const SPLIT: Record<string, { as: string; part: (ring: [number, number][]) => boolean }> = {
  "840": {
    as: "840x",
    part: (ring) => ring.some(([lon, lat]) => lon < -129 || lat > 50 || lon > 0),
  },
};
/** tone key for the US outside the lower 48 (Alaska, Hawaii, the Aleutians) */
export const US_OUTSIDE_LOWER48 = "840x";
type Ring = [number, number][];
const ringArea = (r: Ring) => {
  let a = 0;
  for (let i = 0; i < r.length; i++) {
    const p = r[i];
    const q = r[(i + 1) % r.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};
const pointIn = (pt: [number, number], r: Ring) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if (r[i][1] > pt[1] !== r[j][1] > pt[1] && pt[0] < ((r[j][0] - r[i][0]) * (pt[1] - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) inside = !inside;
  }
  return inside;
};
type LandData = { geo: Any; shadow: Any; mask: Any; box: [number, number, number, number]; ids: Map<string, number>; dropped: string[] };
const landCache = new Map<number, LandData>();
const buildLand = (islandMin: number): LandData => {
  const have = landCache.get(islandMin);
  if (have) return have;
  const fc = feature(countries50 as Any, (countries50 as Any).objects.countries) as Any;
  const ids = new Map<string, number>();
  const kept = new Set<string>();
  const seen = new Set<string>();
  const pos: number[] = [];
  const nor: number[] = [];
  const top: number[] = [];
  const idA: number[] = [];
  const ua: number[] = [];
  const idx: number[] = [];
  const allRings: Ring[] = [];
  let nextId = 1;
  for (const f of fc.features) {
    const cid = String(f.id ?? "");
    if (cid === "010") continue; // Antarctica: off the crop
    const id = cid && ids.has(cid) ? (ids.get(cid) as number) : nextId++;
    if (cid) {
      ids.set(cid, id);
      seen.add(cid);
    }
    const polys: Any[] = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const split = SPLIT[cid];
    let altId = 0;
    if (split) {
      altId = ids.get(split.as) ?? nextId++;
      ids.set(split.as, altId);
    }
    const made: { outer: Ring; holes: Ring[]; home: boolean; alt: boolean }[] = [];
    for (const coords of polys) {
      const rings: Ring[] = [];
      let cur: Ring | null = null;
      const ctx = {
        beginPath() {},
        moveTo(x: number, y: number) {
          cur = [[x, -y]];
          rings.push(cur);
        },
        lineTo(x: number, y: number) {
          if (cur) cur.push([x, -y]);
        },
        closePath() {},
        arc() {},
      };
      geoPath(projTall, ctx)({ type: "Polygon", coordinates: coords });
      if (!rings.length) continue;
      const clean = rings
        .map((r) => {
          const out: Ring = [];
          for (const p of r) {
            const l = out[out.length - 1];
            if (!l || Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.02) out.push(p);
          }
          if (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 0.02) out.pop();
          return out;
        })
        .filter((r) => r.length >= 3 && Math.abs(ringArea(r)) > islandMin);
      if (!clean.length) continue;
      clean.sort((a, b) => Math.abs(ringArea(b)) - Math.abs(ringArea(a)));
      const sign = Math.sign(ringArea(clean[0]));
      const outers: { outer: Ring; holes: Ring[] }[] = [];
      for (const r of clean) {
        if (Math.sign(ringArea(r)) === sign) outers.push({ outer: r, holes: [] });
        else {
          const host = outers.find((o) => pointIn(r[0], o.outer));
          if (host) host.holes.push(r);
        }
      }
      const home = HOME_BOX[cid];
      const lonlat0 = coords[0][0];
      const isHome = !home || (lonlat0[0] >= home[0] && lonlat0[0] <= home[2] && lonlat0[1] >= home[1] && lonlat0[1] <= home[3]);
      const isAlt = !!split && split.part(coords[0]);
      for (const o of outers) made.push({ ...o, home: isHome, alt: isAlt });
    }
    if (made.length && cid) kept.add(cid);
    // the amber sweep runs west -> east across the country's biggest home polygon (Alaska, Hawaii clamp to its start)
    let big: Ring | null = null;
    for (const m of made) if (m.home && !m.alt && (!big || Math.abs(ringArea(m.outer)) > Math.abs(ringArea(big)))) big = m.outer;
    let minX = 0;
    let maxX = 1;
    if (big) {
      minX = Math.min(...big.map((p) => p[0]));
      maxX = Math.max(...big.map((p) => p[0]));
    }
    const span = Math.max(1, maxX - minX);
    for (const m of made) {
      const vid = m.home ? (m.alt ? altId : id) : 0;
      const uOf = (x: number) => (m.home ? c01((x - minX) / span) : 0);
      const contour = m.outer.map((p) => new THREE.Vector2(p[0], p[1]));
      const holes = m.holes.map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
      const faces = THREE.ShapeUtils.triangulateShape(contour, holes);
      const base = pos.length / 3;
      for (const p of [m.outer, ...m.holes].flat()) {
        pos.push(p[0], 0, -p[1]);
        nor.push(0, 1, 0);
        top.push(1);
        idA.push(vid);
        ua.push(uOf(p[0]));
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
            idA.push(vid);
            ua.push(uOf(p[0]));
          }
        }
        for (let i = 0; i < n; i++) {
          const a = b + i * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute("aTop", new THREE.BufferAttribute(new Float32Array(top), 1));
  g.setAttribute("aId", new THREE.BufferAttribute(new Float32Array(idA), 1));
  g.setAttribute("aU", new THREE.BufferAttribute(new Float32Array(ua), 1));
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
  const dropped = Object.keys(ISO_NUM).filter((k) => seen.has(ISO_NUM[k]) && !kept.has(ISO_NUM[k]));
  const made: LandData = { geo: g, mask: raster(WORLD_SLAB.PPU, WORLD_SLAB.PPU * 1.25), shadow: raster(1.6, 1.6 * 2.6), box: [minX, minZ, bw, bh], ids, dropped };
  landCache.set(islandMin, made);
  return made;
};
/** ISO codes the slab leaves out at this islandMin (microstates, small islands) */
export const droppedCountries = (islandMin: number) => buildLand(islandMin).dropped;

const LAND_VERT = /* glsl */ `
attribute float aTop;
attribute float aId;
attribute float aU;
uniform vec4 uTone[260];
uniform float uT;
uniform float uRaise;
varying vec3 vW;
varying vec3 vN;
varying float vWall;
varying float vH;
varying float vHi;
varying float vCr;
varying float vUw;
varying vec2 vLoc;
void main() {
  vLoc = vec2(position.x, -position.z);
  float wall = step(1.5, aTop);
  float tp = wall > 0.5 ? aTop - 2.0 : 1.0;
  vec4 tone = uTone[int(aId + 0.5)];
  float rs = smoothstep(0.0, 0.6, tone.y) * tone.z + tone.w;
  vec3 p = position;
  p.y = tp * (uT + uRaise * rs);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vN = normal;
  vWall = wall;
  vH = tp;
  vHi = tone.y;
  vCr = tone.x;
  vUw = aU;
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
varying float vHi;
varying float vCr;
varying float vUw;
varying vec2 vLoc;
void main() {
  vec2 p = vLoc;
  vec2 uv = (p - uBox.xy) / uBox.zw;
  vec2 e = 1.0 / vec2(textureSize(uMask, 0));
  float mx = texture2D(uMask, uv + vec2(e.x, 0.0)).r - texture2D(uMask, uv - vec2(e.x, 0.0)).r;
  float mz = texture2D(uMask, uv + vec2(0.0, e.y)).r - texture2D(uMask, uv - vec2(0.0, e.y)).r;
  vec3 V = normalize(cameraPosition - vW);
  vec3 n;
  float wall = vWall;
  if (wall > 0.5) {
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
  vec3 cream = mix(uCreamFoot, uCream, 0.55 + 0.45 * mott);
  vec3 board = mix(uBoardFoot, uBoardTone, 0.55 + 0.45 * mott);
  vec3 base = mix(board, cream, vCr);
  vec3 col = clayShade(base, n, V);
  if (wall > 0.5) col *= mix(0.62, 1.0, smoothstep(0.0, 0.8, vH));
  // amber (still to launch) sweeps west -> east across the country: a flat key, no pulse
  float w = vHi * 1.42;
  float tone = smoothstep(vUw, vUw + 0.42, w);
  if (tone > 0.001) {
    float lit = smoothstep(-0.3, 0.9, dot(n, uL));
    vec3 amb = mix(uAmberFoot, uAmberTop, 0.35 + 0.65 * lit);
    if (wall > 0.5) amb *= mix(0.72, 0.96, vH);
    col = mix(col, amb, tone);
  }
  gl_FragColor = vec4(mix(col, uFogCol, fogAt(vW)), 0.0);
}`;

/** lift: 0..1 of WORLD_SLAB.RAISE, independent of amber (default 0; added for EuropeAlreadyTheirs) */
export type CountryTone = { cream?: number; amber?: number; raise?: number; lift?: number };
/** The board floor plus the land slab, each country toned. In NuclearStage's `world`, with `floor={false}` on the stage. */
export const RevolutWorld: React.FC<{
  cam: NuclearCam;
  tones: Record<string, CountryTone>;
  /** world units one board texture spans (fixed for a cut) */
  boardUnits: number;
  /** fog start and end in multiples of cam.d: the same values given to NuclearStage */
  fog: [number, number];
  islandMin?: number;
}> = ({ cam, tones, boardUnits, fog, islandMin = 1.2 }) => {
  U.uFogRange.value.set(cam.d * fog[0], cam.d * fog[1]);
  const o = useMemo(() => {
    const d = buildLand(islandMin);
    const landMat = new THREE.ShaderMaterial({
      vertexShader: LAND_VERT,
      fragmentShader: LAND_FRAG,
      side: THREE.DoubleSide,
      blending: THREE.NoBlending,
      uniforms: {
        ...U,
        uTone: { value: Array.from({ length: 260 }, () => new THREE.Vector4(0, 0, 1, 0)) },
        uT: { value: WORLD_SLAB.T },
        uRaise: { value: WORLD_SLAB.RAISE },
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
    return { d, landMat, land, floorMat, floor };
  }, [islandMin]);
  o.floorMat.uniforms.uTex.value = boardTex;
  o.floorMat.uniforms.uBoardUnits.value = boardUnits;
  const arr = o.landMat.uniforms.uTone.value as Any[];
  for (const v of arr) v.set(0, 0, 1, 0);
  for (const k of Object.keys(tones)) {
    const id = o.d.ids.get(ISO_NUM[k] ?? k);
    if (id === undefined) continue;
    const t = tones[k];
    arr[id].set(c01(t.cream ?? 0), c01(t.amber ?? 0), t.raise ?? 1, t.lift ?? 0);
  }
  return (
    <>
      <primitive object={o.floor} />
      <primitive object={o.land} />
    </>
  );
};
