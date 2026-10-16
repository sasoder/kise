import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { BLOOM_LAYERS, COLOR } from "./stoutShared";

// ===========================================================================
// marsOceanShared — Cheeky Pint S4E02 "we've mapped more of Mars than the ocean" (Will O'Brien, Ulysses).
// "Cheeky Pint, but realistic underwater / space": real textures on lit spheres, the stout B1 stage for space,
// stout amber (with its bloom) = LIGHT = what is seen / mapped; water is a petrol murk, never black.
//
// THE API (stable; see marsOceanShared.READY)
//   tokens   WATER (surface/mid/deep/darkest + murk), KEY_LIGHT, NIGHT, ATMO, AMBER (stout's amber), MVO_TEX
//   <LitGlobe texture cx cy r lon lat roll? light? ocean? emissive? atmosphere? grade? width? height? />
//            a WebGL lit sphere (orthographic) from an equirectangular map (lon -180..180 left->right, north up),
//            drawn on a transparent full-frame canvas (default 1080x1920, screen px). One key light from the
//            upper left (stout's), soft terminator, never-black night side, thin atmosphere rim.
//            `ocean` replaces water with the murk (mask PNG: R = water, G = shelf 0 deep .. 1 shallow);
//            `ocean.reveal` 0..1 lets the map's own colour show through the murk; `emissive` adds an UNLIT glow
//            layer (R channel = intensity; e.g. measured seafloor in amber). `grid` paints a static graticule on
//            the sphere (optionally land only: it stops at the coast).
//   globeView({ cx, cy, r, lon, lat, roll }) + projectGlobe(view, lon, lat) -> { x, y, z } (z > 0 = visible)
//   <GlobeLines view lines color? width? opacity? bloom? limbFade? heads? />   SVG polylines in lon/lat drawn
//            ON the sphere (hidden on the far side), each to its own progress p 0..1 — graticules, ship tracks.
//   meridianLine(lon, fromLat?, toLat?), parallelLine(lat, fromLon, toLon)   polyline helpers (2 deg steps)
// Seek-safe: textures load once per canvas under delayRender; every frame draws synchronously in a layout
// effect (preserveDrawingBuffer). Render with --gl=angle.
// ===========================================================================

// --- tokens ---------------------------------------------------------------------------------------
/** Water: the brief's suggested values, warmed a touch; never black (L* >= ~12 in the darkest corner). */
export const WATER = {
  surface: "#2F7377",
  mid: "#1D4B58",
  deep: "#163542",
  darkest: "#10262F",
  /** the globe's ocean murk: unlit petrol, lit side .. terminator, + a faint shelf lift near coasts */
  murkLit: "#1B4552",
  murkDark: "#0F242D",
  murkShelf: "#245660",
  /** the floor: the middle of an ocean basin once it has sunk (= darkest) */
  murkDeep: "#0E222B",
} as const;
/** Stout's amber (= light = what is seen / mapped) and its bloom, imported, never restated. */
export const AMBER = { top: COLOR.amberTop, foot: COLOR.amberFoot, hot: COLOR.amberHot, bloom: BLOOM_LAYERS } as const;
/** The one key light, view space (x right, y up, z toward the viewer): above, slightly left, as stout. */
export const KEY_LIGHT: [number, number, number] = [-0.62, 0.56, 0.46];
/** "Mapped" is ONE material: the same graticule on every body (GlobeLines draw-on, GlobeGrid static). */
export const GRID = { step: 10, opacity: 0.92, maxLat: 80, poleFade: 14, limbFade: 0.85, width: (k = 1) => 1.35 + 0.22 * k } as const;
/** The night side is a deep warm brown (the stage's shadow family), never black. */
export const NIGHT = "#2A1A10";
/** Atmosphere rims. */
export const ATMO = {
  mars: { color: "#E8A47A", width: 7, strength: 0.55 },
  earth: { color: "#8FC7D2", width: 8, strength: 0.5 },
} as const;
/** The clip's prepared textures (public/marsocean/, mvo_ = this clip's prep; originals untouched). */
export const MVO_TEX = {
  mars: "marsocean/mars_8k.jpg",
  earth: "marsocean/mvo_earth_color_4k.jpg", // Solar System Scope daymap, 4096x2048
  earthOcean: "marsocean/mvo_earth_ocean_4k.png", // R = water (soft coast), G = shelf (blurred Blue Marble bathy, 1 shallow), B = basin (0 coast .. 1 middle)
  earthGridLand: "marsocean/mvo_earth_gridland_4k.png", // land that carries the grid: land minus islands under ~3.5 deg
} as const;

// --- math -----------------------------------------------------------------------------------------
export type GlobeView = { cx: number; cy: number; r: number; lon: number; lat: number; roll?: number };
export const globeView = (v: GlobeView) => v;
const D2R = Math.PI / 180;
/** Rows of M = Ry(lon) Rx(-lat) Rz(roll): view normal -> body point. */
const viewToBody = (lon: number, lat: number, roll = 0): number[][] => {
  const cy = Math.cos(lon * D2R);
  const sy = Math.sin(lon * D2R);
  const cx = Math.cos(-lat * D2R);
  const sx = Math.sin(-lat * D2R);
  const cz = Math.cos(roll * D2R);
  const sz = Math.sin(roll * D2R);
  const Ry = [
    [cy, 0, sy],
    [0, 1, 0],
    [-sy, 0, cy],
  ];
  const Rx = [
    [1, 0, 0],
    [0, cx, -sx],
    [0, sx, cx],
  ];
  const Rz = [
    [cz, -sz, 0],
    [sz, cz, 0],
    [0, 0, 1],
  ];
  const mul = (A: number[][], B: number[][]) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
  return mul(mul(Ry, Rx), Rz);
};
/** Where body point (lon, lat) lands on screen for a view: x, y (screen px), z (> 0 = the visible side). */
export const projectGlobe = (v: GlobeView, lon: number, lat: number) => {
  const M = viewToBody(v.lon, v.lat, v.roll ?? 0);
  const P = [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)];
  // n = M^T P
  const n = [0, 1, 2].map((j) => M[0][j] * P[0] + M[1][j] * P[1] + M[2][j] * P[2]);
  return { x: v.cx + v.r * n[0], y: v.cy - v.r * n[1], z: n[2] };
};

// --- texture cache (decoded once per page) --------------------------------------------------------
const imgCache = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (src: string) => {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`LitGlobe: could not load ${src}`));
      img.src = /^(https?:|data:|blob:|\/)/.test(src) ? src : staticFile(src);
    });
    imgCache.set(src, p);
  }
  return p;
};

// --- shaders --------------------------------------------------------------------------------------
const VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform sampler2D uOcean;
uniform sampler2D uEmis;
uniform sampler2D uGridMask;
uniform float uHasGridMask;
uniform float uHi;
uniform vec3 uCoast;
uniform float uMotes;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uR;
uniform mat3 uM;
uniform vec3 uL;
uniform float uHasOcean;
uniform float uReveal;
uniform float uTime;
uniform vec3 uMurkLit, uMurkDark, uMurkShelf, uMurkDeep;
uniform float uGlint;
uniform float uHasEmis;
uniform vec3 uEmisColor;
uniform float uEmisStrength;
uniform vec3 uAtmo;
uniform float uAtmoW, uAtmoA;
uniform vec3 uNight;
uniform float uExposure, uSat, uWarm, uAmbient, uLimb;
uniform float uGridA, uGridStep, uGridW, uGridLand, uGridMaxLat, uPoleFade, uLimbFade, uGridGlow;
uniform vec3 uGridColor;
uniform float uLayer;
out vec4 o;
const float PI = 3.14159265358979;
vec3 toLin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 toSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 d = (p - uCenter) / uR;
  d.y = -d.y;
  float rr = length(d);
  float edgePx = (1.0 - rr) * uR;
  float outer = uAtmoW * 4.0 + 2.0;
  if (edgePx < -outer || (uLayer > 0.5 && rr > 1.0 + 1.0 / uR)) { o = vec4(0.0); return; }
  vec2 l2 = normalize(uL.xy + 1e-5);
  float sideLit = clamp(dot(normalize(d + 1e-6), l2) * 0.75 + 0.45, 0.0, 1.0);
  // halo outside the limb (thin, lit side)
  float halo = uAtmoA * exp(-max(-edgePx, 0.0) / max(uAtmoW, 0.5)) * sideLit * 0.55;
  vec3 colP = vec3(0.0);
  float aP = 0.0;
  if (rr < 1.0 + 1.0 / uR) {
    float cover = clamp(edgePx + 0.5, 0.0, 1.0);
    vec2 dd = d / max(rr, 1.0);
    float z = sqrt(max(0.0, 1.0 - dot(dd, dd)));
    vec3 n = vec3(dd, z);
    vec3 b = uM * n;
    float lat = asin(clamp(b.y, -1.0, 1.0));
    float lon = atan(b.x, b.z);
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
    vec2 gx = dFdx(uv); vec2 gy = dFdy(uv);
    gx.x -= round(gx.x); gy.x -= round(gy.x);
    vec3 alb = toLin(textureGrad(uTex, uv, gx, gy).rgb);
    float ndl = dot(n, normalize(uL));
    float soft = smoothstep(-0.16, 0.32, ndl);
    float lit = soft * (0.3 + 0.7 * clamp(ndl, 0.0, 1.0));
    float limb = mix(1.0 - uLimb, 1.0, pow(z, 0.45));
    vec3 c = alb * (lit * uExposure * limb) * vec3(1.0 + uWarm, 1.0, 1.0 - uWarm) + alb * uAmbient + toLin(uNight) * 0.55 * (1.0 - soft);
    c = toSrgb(c);
    float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(luma), c, uSat);
    // highlight shoulder: ice and cloud never become the brightest thing in the frame
    float hl = smoothstep(0.5, 1.0, dot(c, vec3(0.2126, 0.7152, 0.0722)));
    c = mix(c, c * 0.7 + vec3(0.02), uHi * hl);
    float water = 0.0;
    if (uHasOcean > 0.5) {
      vec4 oc = textureGrad(uOcean, uv, gx, gy);
      water = oc.r;
      float shelf = smoothstep(0.5, 1.0, oc.g);
      float basin = oc.b;
      float ol = soft * (0.35 + 0.65 * clamp(ndl, 0.0, 1.0));
      // the SURFACE (reveal 1): the map's own water, lit, a shelf lift near coasts, a soft glint of the key light
      vec3 hv = normalize(normalize(uL) + vec3(0.0, 0.0, 1.0));
      float spec = pow(max(dot(n, hv), 0.0), 140.0) * uGlint * soft;
      vec3 surf = c + uMurkShelf * shelf * 0.3 * ol + vec3(0.95, 0.9, 0.8) * spec;
      // the DEPTH (reveal 0): a heavy petrol volume, darkening toward the middle of each basin, a slow drift
      vec3 murk = mix(uMurkDark, uMurkLit, ol);
      murk = mix(murk, uMurkShelf, shelf * 0.3 * (0.35 + 0.65 * ol));
      // depth: the basin's middle goes down to the floor tone; the continental shelf keeps a thin teal rim
      murk = mix(murk, uMurkDeep, smoothstep(0.02, 0.6, basin));
      float band = smoothstep(0.6, 0.97, oc.g) * (1.0 - smoothstep(0.02, 0.2, basin));
      murk = mix(murk, uCoast * (0.55 + 0.45 * ol), band * 0.6);
      float nz = vnoise(b * 2.6 + vec3(uTime * 0.010, 0.0, uTime * 0.007)) * 0.6 + vnoise(b * 6.0 - vec3(0.0, uTime * 0.009, 0.0)) * 0.4;
      murk *= 0.9 + 0.18 * nz;
      murk = mix(murk, uNight * 0.9 + uMurkDark * 0.4, (1.0 - soft) * 0.35);
      murk = max(murk, uMurkDeep * 0.92);
      // marine snow: very faint motes sinking (two depths: the nearer layer larger and faster)
      if (uMotes > 0.0) {
        float m = 0.0;
        for (int L = 0; L < 2; L++) {
          float fl = float(L);
          float N = fl < 0.5 ? 26.0 : 44.0;
          float spd = fl < 0.5 ? 0.0022 : 0.0012;
          vec2 q = d * N + vec2(0.0, uTime * spd * N);
          vec2 cell = floor(q);
          vec2 fq = fract(q);
          vec2 pos = vec2(0.2 + 0.6 * hash(vec3(cell, 1.7 + fl)), 0.2 + 0.6 * hash(vec3(cell + 13.1, 4.3 + fl)));
          float dpx = length(fq - pos) * uR / N;
          float rad = fl < 0.5 ? 1.1 : 0.7;
          float present = step(0.5, hash(vec3(cell, 9.9 + fl)));
          float tw = 0.65 + 0.35 * sin(uTime * 0.12 + hash(vec3(cell, 2.2)) * 6.283);
          m += (1.0 - smoothstep(rad * 0.4, rad + 0.6, dpx)) * present * tw * (fl < 0.5 ? 1.0 : 0.6);
        }
        murk = mix(murk, uCoast * 1.5, clamp(m, 0.0, 1.0) * uMotes * (1.0 - band));
      }
      // one change of state: the basins' middles sink first, the coasts last
      float t = 1.0 - uReveal;
      float local = smoothstep(0.0, 1.0, t * 1.6 - (1.0 - basin) * 0.6);
      c = mix(c, mix(surf, murk, local), water);
    }
    if (uHasEmis > 0.5) {
      float e = textureGrad(uEmis, uv, gx, gy).r;
      c += uEmisColor * e * uEmisStrength;
    }
    float g = 0.0;
    if (uGridA > 0.0) {
      // a graticule painted on the sphere: screen-px lines; meridians run into the poles (faded over uPoleFade
      // deg), parallels end at uGridMaxLat; limb fade = GlobeLines'; optionally land only
      float latD = lat * 57.29578;
      float lonD = lon * 57.29578;
      float pxLon = max(length(vec2(gx.x, gy.x)) * 360.0, 1e-5);
      float pxLat = max(length(vec2(gx.y, gy.y)) * 180.0, 1e-5);
      float dLon = abs(fract(lonD / uGridStep + 0.5) - 0.5) * uGridStep / pxLon;
      float dLat = abs(fract(latD / uGridStep + 0.5) - 0.5) * uGridStep / pxLat;
      float poleW = uPoleFade > 0.0 ? clamp((90.0 - abs(latD)) / uPoleFade, 0.0, 1.0) : 1.0;
      float inP = 1.0 - smoothstep(uGridMaxLat + 0.5, uGridMaxLat + 1.0, abs(latD));
      float lineM = (1.0 - smoothstep(uGridW * 0.5 - 0.5, uGridW * 0.5 + 0.5, dLon)) * poleW;
      float lineP = (1.0 - smoothstep(uGridW * 0.5 - 0.5, uGridW * 0.5 + 0.5, dLat)) * inP;
      float glow = (exp(-dLon / 3.0) * poleW + exp(-dLat / 3.0) * inP) * uGridGlow;
      float land = uGridLand > 0.5
        ? (uHasGridMask > 0.5 ? textureGrad(uGridMask, uv, gx, gy).r : 1.0 - smoothstep(0.2, 0.55, water))
        : 1.0;
      float limbW = (1.0 - uLimbFade + uLimbFade * pow(z, 0.4)) * smoothstep(0.06, 0.22, z);
      g = clamp(max(lineM, lineP) + glow, 0.0, 1.0) * land * uGridA * limbW;
      c = mix(c, uGridColor, g);
    }
    if (uLayer > 0.5) {
      // the grid alone (premultiplied), for a CSS bloom on its own canvas
      float a = g * cover;
      o = vec4(uGridColor * a, a);
      return;
    }
    // atmosphere just inside the limb
    float rim = pow(1.0 - z, 2.6) * uAtmoA * (0.25 + 0.75 * sideLit) * (0.35 + 0.65 * soft);
    c = mix(c, uAtmo, clamp(rim, 0.0, 1.0));
    colP = c * cover;
    aP = cover;
  }
  // halo composited under the disc (premultiplied)
  vec3 hc = uAtmo * halo;
  o = vec4(colP + hc * (1.0 - aP), aP + halo * (1.0 - aP));
}`;

type GLState = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
};

const hexRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const s = gl.createShader(type) as WebGLShader;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`LitGlobe shader: ${gl.getShaderInfoLog(s)}`);
  return s;
};

const UNIFORMS = [
  "uTex", "uOcean", "uEmis", "uRes", "uCenter", "uR", "uM", "uL", "uHasOcean", "uReveal", "uTime", "uMurkLit", "uMurkDark",
  "uMurkShelf", "uHasEmis", "uEmisColor", "uEmisStrength", "uAtmo", "uAtmoW", "uAtmoA", "uNight", "uExposure", "uSat", "uWarm",
  "uAmbient", "uLimb", "uGridA", "uGridStep", "uGridW", "uGridLand", "uGridMaxLat", "uGridColor", "uMurkDeep", "uGlint",
  "uPoleFade", "uLimbFade", "uGridGlow", "uLayer", "uGridMask", "uHasGridMask", "uHi", "uCoast", "uMotes",
];

const initGL = (canvas: HTMLCanvasElement, imgs: (HTMLImageElement | null)[]): GLState => {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("LitGlobe: WebGL2 unavailable (render with --gl=angle)");
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`LitGlobe link: ${gl.getProgramInfoLog(prog)}`);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  imgs.forEach((img, i) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    if (img) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.generateMipmap(gl.TEXTURE_2D);
  });
  const u: GLState["u"] = {};
  for (const n of UNIFORMS) u[n] = gl.getUniformLocation(prog, n);
  return { gl, prog, u };
};

export type GlobeProps = {
  /** equirectangular colour map (staticFile path), lon -180..180 left -> right, north up */
  texture: string;
  /** centre and radius on the canvas (screen px) */
  cx: number;
  cy: number;
  r: number;
  /** the body point at the disc's centre (deg) and the axis roll (deg, + = counter-clockwise) */
  lon: number;
  lat: number;
  roll?: number;
  /** view-space light direction (x right, y up, z to the viewer); default KEY_LIGHT */
  light?: [number, number, number];
  /** water as the murk: mask PNG (R = water, G = shelf); reveal 0..1 shows the map's own colour; time drives the drift */
  ocean?: {
    mask: string;
    reveal?: number;
    time?: number;
    lit?: string;
    dark?: string;
    shelf?: string;
    deep?: string;
    /** the continental-shelf rim of the sunk water (default WATER.surface) */
    coast?: string;
    glint?: number;
    /** marine snow in the sunk water: 0 off .. ~0.3 faint */
    motes?: number;
  } | null;
  /** an unlit glow layer (R = intensity), e.g. measured seafloor */
  emissive?: { src: string; color?: string; strength?: number } | null;
  atmosphere?: { color: string; width: number; strength: number } | null;
  /** exposure (lit side gain), sat(uration), warm(th) tint, ambient (unlit albedo floor), limb darkening */
  grade?: { exposure?: number; sat?: number; warm?: number; ambient?: number; limb?: number; highlight?: number };
  /** a graticule painted ON the sphere (no draw-on; use GlobeLines for that): step deg, screen-px width,
   *  landOnly = stops at the coast (needs `ocean`), maxLat = where meridians and parallels end */
  grid?: {
    step: number;
    color?: string;
    opacity?: number;
    width?: number;
    landOnly?: boolean;
    /** land that carries the grid (R), e.g. MVO_TEX.earthGridLand (no small islands); default = !ocean */
    mask?: string;
    maxLat?: number;
    poleFade?: number;
    limbFade?: number;
    glow?: number;
  } | null;
  /** "globe" (default) draws the lit sphere (+ its grid); "grid" draws ONLY the grid, premultiplied, with stout's amber
   *  bloom as a CSS filter — the same material as GlobeLines (use GlobeGrid) */
  layer?: "globe" | "grid";
  /** canvas size (screen px); default the full 1080 x 1920 frame */
  width?: number;
  height?: number;
  style?: React.CSSProperties;
};

/** LitGlobe — a realistic lit sphere from an equirectangular map, on its own transparent canvas. */
export const LitGlobe: React.FC<GlobeProps> = (p) => {
  const W = p.width ?? 1080;
  const H = p.height ?? 1920;
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<GLState | null>(null);
  const [handle] = useState(() => delayRender(`LitGlobe ${p.texture}`, { timeoutInMilliseconds: 180000 }));
  const released = useRef(false);
  const [ready, setReady] = useState(false);
  const oceanSrc = p.ocean?.mask ?? null;
  const emisSrc = p.emissive?.src ?? null;
  const gridMaskSrc = p.grid?.mask ?? null;
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadImage(p.texture),
      oceanSrc ? loadImage(oceanSrc) : Promise.resolve(null),
      emisSrc ? loadImage(emisSrc) : Promise.resolve(null),
      gridMaskSrc ? loadImage(gridMaskSrc) : Promise.resolve(null),
    ])
      .then((imgs) => {
        if (!alive || !ref.current) return;
        st.current = initGL(ref.current, imgs);
        setReady(true);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, [p.texture, oceanSrc, emisSrc, gridMaskSrc]);
  useLayoutEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    const { gl, u } = s;
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const M = viewToBody(p.lon, p.lat, p.roll ?? 0);
    // column-major for GLSL
    const m = [M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]];
    const L = p.light ?? KEY_LIGHT;
    const g = p.grade ?? {};
    const atmo = p.atmosphere ?? null;
    const oc = p.ocean ?? null;
    const em = p.emissive ?? null;
    gl.uniform1i(u.uTex, 0);
    gl.uniform1i(u.uOcean, 1);
    gl.uniform1i(u.uEmis, 2);
    gl.uniform1i(u.uGridMask, 3);
    gl.uniform1f(u.uHasGridMask, p.grid?.mask ? 1 : 0);
    gl.uniform1f(u.uHi, g.highlight ?? 0);
    gl.uniform3f(u.uCoast, ...hexRgb(p.ocean?.coast ?? WATER.surface));
    gl.uniform1f(u.uMotes, p.ocean?.motes ?? 0);
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uCenter, p.cx, p.cy);
    gl.uniform1f(u.uR, Math.max(1, p.r));
    gl.uniformMatrix3fv(u.uM, false, m);
    gl.uniform3f(u.uL, L[0], L[1], L[2]);
    gl.uniform1f(u.uHasOcean, oc ? 1 : 0);
    gl.uniform1f(u.uReveal, oc?.reveal ?? 0);
    gl.uniform1f(u.uTime, oc?.time ?? 0);
    gl.uniform3f(u.uMurkLit, ...hexRgb(oc?.lit ?? WATER.murkLit));
    gl.uniform3f(u.uMurkDark, ...hexRgb(oc?.dark ?? WATER.murkDark));
    gl.uniform3f(u.uMurkShelf, ...hexRgb(oc?.shelf ?? WATER.murkShelf));
    gl.uniform1f(u.uHasEmis, em ? 1 : 0);
    gl.uniform3f(u.uEmisColor, ...hexRgb(em?.color ?? AMBER.top));
    gl.uniform1f(u.uEmisStrength, em?.strength ?? 1);
    gl.uniform3f(u.uAtmo, ...hexRgb(atmo?.color ?? "#000000"));
    gl.uniform1f(u.uAtmoW, atmo?.width ?? 0.5);
    gl.uniform1f(u.uAtmoA, atmo ? atmo.strength : 0);
    gl.uniform3f(u.uNight, ...hexRgb(NIGHT));
    gl.uniform1f(u.uExposure, g.exposure ?? 1.15);
    gl.uniform1f(u.uSat, g.sat ?? 1);
    gl.uniform1f(u.uWarm, g.warm ?? 0.04);
    gl.uniform1f(u.uAmbient, g.ambient ?? 0.06);
    gl.uniform1f(u.uLimb, g.limb ?? 0.15);
    const gr = p.grid ?? null;
    gl.uniform1f(u.uGridA, gr ? gr.opacity ?? 0.6 : 0);
    gl.uniform1f(u.uGridStep, gr?.step ?? 15);
    gl.uniform1f(u.uGridW, gr?.width ?? 1.4);
    gl.uniform1f(u.uGridLand, gr?.landOnly ? 1 : 0);
    gl.uniform1f(u.uGridMaxLat, gr?.maxLat ?? 80);
    gl.uniform1f(u.uPoleFade, gr?.poleFade ?? GRID.poleFade);
    gl.uniform1f(u.uLimbFade, gr?.limbFade ?? GRID.limbFade);
    gl.uniform1f(u.uGridGlow, p.layer === "grid" ? 0 : gr?.glow ?? 0.22);
    gl.uniform1f(u.uLayer, p.layer === "grid" ? 1 : 0);
    gl.uniform3f(u.uMurkDeep, ...hexRgb(oc?.deep ?? WATER.murkDeep));
    gl.uniform1f(u.uGlint, oc?.glint ?? 0);
    gl.uniform3f(u.uGridColor, ...hexRgb(gr?.color ?? AMBER.top));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, ...p.style }} />;
};

/** The grid's bloom (stout's amber layers as a CSS filter, screen px): the same on SVG lines and on GlobeGrid. */
export const GRID_BLOOM = AMBER.bloom.map((l) => `drop-shadow(0 0 ${l.blur}px ${l.color})`).join(" ");
/**
 * GlobeGrid — the static graticule of a globe (GRID material) on its own canvas with the amber bloom: put it
 * right above the LitGlobe with the same view. `landOnly` needs `ocean.mask`. Width/opacity default to GRID.
 */
export const GlobeGrid: React.FC<Omit<GlobeProps, "grid" | "layer" | "atmosphere"> & {
  step?: number;
  /** line width, screen px (default GRID.width(1)) */
  lineWidth?: number;
  opacity?: number;
  landOnly?: boolean;
  /** land that carries the grid (default MVO_TEX.earthGridLand when landOnly) */
  landMask?: string;
  /** per-globe limb fade (GRID.limbFade default); lower keeps a grid near the limb legible at phone size */
  limbFade?: number;
}> = ({ step = GRID.step, lineWidth, opacity = GRID.opacity, landOnly = false, landMask, limbFade = GRID.limbFade, ...p }) => (
  <LitGlobe
    {...p}
    layer="grid"
    atmosphere={null}
    grid={{
      step,
      width: lineWidth ?? GRID.width(1),
      opacity,
      landOnly,
      mask: landOnly ? landMask ?? MVO_TEX.earthGridLand : undefined,
      maxLat: GRID.maxLat,
      poleFade: GRID.poleFade,
      limbFade,
    }}
    style={{ filter: GRID_BLOOM, ...p.style }}
  />
);

// --- lines on the sphere --------------------------------------------------------------------------
export type GlobeLine = { pts: [number, number][]; p: number };
/** A meridian as a polyline (2 deg steps), north -> south by default. */
export const meridianLine = (lon: number, fromLat = 90, toLat = -90): [number, number][] => {
  const n = Math.max(1, Math.round(Math.abs(toLat - fromLat) / 2));
  return Array.from({ length: n + 1 }, (_, i) => [lon, fromLat + ((toLat - fromLat) * i) / n] as [number, number]);
};
/** A parallel as a polyline (2 deg steps) from fromLon to toLon. */
export const parallelLine = (lat: number, fromLon: number, toLon: number): [number, number][] => {
  const n = Math.max(1, Math.round(Math.abs(toLon - fromLon) / 2));
  return Array.from({ length: n + 1 }, (_, i) => [fromLon + ((toLon - fromLon) * i) / n, lat] as [number, number]);
};
const LIMB_BINS = 8;
/**
 * GlobeLines — polylines in lon/lat drawn ON a globe view (SVG, screen px), each to its own progress p
 * (by length along the polyline, a partial last segment). The far side is hidden; `limbFade` dims segments
 * as they turn away (z), so the limb never bunches into a bright ring. `heads` brightens the last `headLen`
 * segments of a line that is still drawing (a short hot head, no dot). Bloom = stout's amber bloom (screen px).
 */
export const GlobeLines: React.FC<{
  view: GlobeView;
  lines: GlobeLine[];
  color?: string;
  width?: number;
  opacity?: number;
  bloom?: boolean;
  limbFade?: number;
  heads?: boolean;
  headColor?: string;
  /** meridians fade over the last `poleFade` deg into a pole (0 = off) — GlobeGrid's rule */
  poleFade?: number;
  /** the head's length in polyline segments (2 deg each) */
  headLen?: number;
}> = ({ view, lines, color = AMBER.top, width = 1.6, opacity = 0.9, bloom = true, limbFade = GRID.limbFade, heads = false, headColor = AMBER.hot, poleFade = 0, headLen = 4 }) => {
  const bins: string[] = Array.from({ length: LIMB_BINS }, () => "");
  const headBins: string[] = ["", "", ""];
  const f = (v: number) => (Math.round(v * 100) / 100).toString();
  for (const ln of lines) {
    const pr = Math.max(0, Math.min(1, ln.p));
    if (pr <= 0 || ln.pts.length < 2) continue;
    const segs = ln.pts.length - 1;
    const upto = pr * segs;
    const P = ln.pts.map(([lo, la]) => projectGlobe(view, lo, la));
    for (let i = 0; i < segs && i < upto; i++) {
      const a = P[i];
      const t = Math.min(1, upto - i);
      const b0 = P[i + 1];
      const b = { x: a.x + (b0.x - a.x) * t, y: a.y + (b0.y - a.y) * t, z: a.z + (b0.z - a.z) * t };
      if (a.z <= 0 && b.z <= 0) continue;
      // clip at the horizon
      let A = a;
      let B = b;
      if (A.z < 0 || B.z < 0) {
        const s = A.z / (A.z - B.z);
        const C = { x: A.x + (B.x - A.x) * s, y: A.y + (B.y - A.y) * s, z: 0 };
        if (A.z < 0) A = C;
        else B = C;
      }
      const z = (A.z + B.z) / 2;
      const latM = Math.abs((ln.pts[i][1] + ln.pts[i + 1][1]) / 2);
      const poleW = poleFade > 0 ? Math.max(0, Math.min(1, (90 - latM) / poleFade)) : 1;
      const w = (1 - limbFade + limbFade * Math.pow(Math.max(0, z), 0.4)) * poleW;
      if (w <= 0.02) continue;
      const bin = Math.min(LIMB_BINS - 1, Math.floor(w * LIMB_BINS));
      bins[bin] += `M${f(A.x)} ${f(A.y)}L${f(B.x)} ${f(B.y)}`;
      if (heads && pr < 1) {
        const back = upto - (i + Math.min(1, upto - i)); // segments between this one's end and the tip
        const hs = 1 - back / headLen;
        if (hs > 0) headBins[Math.min(2, Math.floor(hs * 3))] += `M${f(A.x)} ${f(A.y)}L${f(B.x)} ${f(B.y)}`;
      }
    }
  }
  const filter = bloom ? GRID_BLOOM : undefined;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", filter }}>
      <g fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
        {bins.map((d, i) =>
          d ? <path key={i} d={d} strokeOpacity={opacity * ((i + 0.5) / LIMB_BINS)} /> : null,
        )}
      </g>
      <g fill="none" stroke={headColor} strokeWidth={width * 1.15} strokeLinecap="round">
        {headBins.map((d, i) => (d ? <path key={i} d={d} strokeOpacity={0.3 + 0.3 * i} /> : null))}
      </g>
    </svg>
  );
};
