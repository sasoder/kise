// ---------------------------------------------------------------------------
// spreadGround: the GROUND PLANE of SpreadsForACentury (kyle-vaccine, cut 53), drawn in WebGL2 by casting each pixel's
// ray from the cut's one camera (spreadCamera.ts) onto the plane Y = 0 (the pattern of kyle-pandemics/rodentGround.tsx:
// exact perspective, one VP, mipmapped, the same maths as every overlay). RENDER WITH --gl=angle.
//
// LAYERS (one shader): the baked map (spreadLevels: s0 the whole view, s1 the Mediterranean to Britain, s2 England;
// each fragment picks its level by its own screen scale, crossfaded in the levels' k bands; land the style's warm
// sand-umber, sea a deeper air-petrol, the coast a soft light line) -> a soft world-space mottle -> THE PRACTICE
// (SMALLPOX plum, matte, never glowing): the trails' fronts (capsules whose tips move at constant speed, each point
// widening once the tip has passed) and the towns' stain discs, one organic edge (fixed world-space noise, so the edge
// creeps and never flickers), clipped to land, ink pooled darker at the edge; the towns' ink dots on top (each spreads
// when the tip reaches it) -> THE VACCINE (ORANGE, the one glowing material): at the Berkeley dot, one point that
// kindles and grows into a soft glow warming the land round it -> distance haze into the air (orange takes half).
// The plan (towns, trails, timings) is spreadPlan.ts, uploaded once as a float texture.
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { SPREAD_LEVELS_SPREAD, SPREAD_PAD, SPREAD_TILE, type SpreadLevel } from "./spreadLevels";
import { LAND_D, project } from "./spreadMapData";
import { F, H, POLE, TRACK, W, type Cam } from "./spreadCamera";
import { BERKELEY, DOTS, DOT_R, INK_T, KINDLE, SEGS, STAIN_T } from "./spreadPlan";

const TILE_DIR = "kyle-vaccine-map";
/** the land masks: world boxes and texels per world px (a coarse one over the whole spread, a fine one over England) */
const MASKS = [
  { x0: -3200, y0: -2600, x1: 6000, y1: 7200, s: 0.3 },
  { x0: -850, y0: -1150, x1: 950, y1: 1450, s: 1.4 },
];

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uBuf;
uniform float uScale;
uniform vec3 uC, uF, uR, uU;
uniform float uFocal, uD;
uniform sampler2D tE0, tE1, tE2, tM0, tM1, tMot;
uniform highp sampler2D tPlan;
uniform vec4 uE0, uE1, uE2;
uniform vec4 uM0, uM1;
uniform vec2 uB1, uB2;
uniform vec2 uMotO;
uniform float uT;          // the frame
uniform int uNDot, uNSeg;
uniform float uDotR;       // a town dot's world radius now (size 1)
uniform vec2 uBerk;
uniform float uCoreR, uGlowR, uGlowA;
uniform vec3 uAirNear, uAirFar, uShadow;
uniform vec2 uPole;        // the LCC pole's image
uniform vec2 uBrit[7];     // Britain and Ireland (world px): outside it the plum recedes as the camera settles
uniform float uDim;         // 0 -> 1: the continental stain's recede (25 %)
uniform vec2 uPolar;       // distances from it of 79 N and 62 N (the far north dissolves into the air between them)

const vec3 POX = vec3(142.0, 69.0, 82.0) / 255.0;
const vec3 POX_D = vec3(106.0, 46.0, 58.0) / 255.0;
const vec3 POX_INK = vec3(84.0, 32.0, 44.0) / 255.0;
const vec3 ACC = vec3(255.0, 176.0, 0.0) / 255.0;
const vec3 ACC_D = vec3(217.0, 138.0, 12.0) / 255.0;
const vec3 ACC_HOT = vec3(255.0, 231.0, 168.0) / 255.0;
const vec3 SEA = vec3(42.0, 69.0, 68.0) / 255.0;
const float INK_T = ${INK_T.toFixed(1)};
const float STAIN_T = ${STAIN_T.toFixed(1)};

float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float easeOut(float x) { float t = clamp(x, 0.0, 1.0); return 1.0 - (1.0 - t) * (1.0 - t) * (1.0 - t); }

vec3 level(sampler2D t, vec4 box, vec2 p) { return texture(t, (p - box.xy) / box.zw).rgb; }
float inset(vec4 box, vec2 p) { vec2 a = p - box.xy; vec2 b = box.xy + box.zw - p; return min(min(a.x, a.y), min(b.x, b.y)); }
vec3 mapAt(vec2 p, float k) {
  vec3 c = level(tE0, uE0, p);
  float inE0 = sstep(0.0, 200.0, inset(uE0, p));
  float w1 = sstep(log(uB1.x), log(uB1.y), log(k)) * sstep(0.0, 40.0, inset(uE1, p) * k);
  c = mix(c, level(tE1, uE1, p), w1);
  float w2 = sstep(log(uB2.x), log(uB2.y), log(k)) * sstep(0.0, 40.0, inset(uE2, p) * k);
  c = mix(c, level(tE2, uE2, p), w2);
  return mix(SEA, c, inE0);
}

// fixed world-space value noise (the stain's organic edge)
float h21(vec2 q) { q = fract(q * vec2(123.34, 456.21)); q += dot(q, q + 45.32); return fract(q.x * q.y); }
float vnoise(vec2 x) {
  vec2 i = floor(x); vec2 f = fract(x); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p / 160.0) + 0.3 * vnoise(p / 63.0 + 7.1) + 0.2 * vnoise(p / 23.0 + 3.7); }

vec4 plan(int i, int row) { return texelFetch(tPlan, ivec2(i, row), 0); }
bool inBrit(vec2 q) {
  bool c = false;
  for (int i = 0, j = 6; i < 7; j = i++) {
    vec2 a = uBrit[i]; vec2 b = uBrit[j];
    if ((a.y > q.y) != (b.y > q.y) && q.x < (b.x - a.x) * (q.y - a.y) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / uScale;
  float a = (fc.x - ${W / 2}.0) / uFocal;
  float bb = -(fc.y - ${H / 2}.0) / uFocal;
  vec3 dir = uF + a * uR + bb * uU;
  if (dir.y > -1e-6) { outColor = vec4(0.0); return; }
  float t = -uC.y / dir.y;
  vec3 P = uC + t * dir;
  vec2 p = P.xz;
  float dist = t * length(dir);
  float wpp = max(length(dFdx(p)), length(dFdy(p))) * uScale; // world px per frame px
  float k = 1.0 / max(wpp, 1e-6);

  vec3 col = mapAt(p, k);
  // the soft mottle (world space, two octaves crossfaded by the zoom)
  {
    float m0 = texture(tMot, p / uMotO.x).a;
    float m1 = texture(tMot, p / (uMotO.x * 2.0) + 0.37).a;
    col = mix(col, uShadow, clamp(mix(m0, m1, uMotO.y) * 0.22, 0.0, 1.0));
  }

  // ---- THE PRACTICE: the trails' fronts and the towns' stains (one signed distance, organic edge) ----
  float sd = 1e9;
  float rLoc = 30.0;
  for (int i = 0; i < uNSeg; i++) {
    vec4 g = plan(i, 2);
    vec4 tm = plan(i, 3);
    if (uT < tm.x) continue;
    float q = clamp((uT - tm.x) / max(tm.y - tm.x, 1e-3), 0.0, 1.0);
    vec2 d = g.zw - g.xy;
    float h = clamp(dot(p - g.xy, d) / max(dot(d, d), 1e-6), 0.0, q);
    vec2 c = g.xy + d * h;
    float tau = uT - (tm.x + h * (tm.y - tm.x));
    float r = tm.z * (0.32 + 0.6 * easeOut(tau / 10.0) + 0.3 * (1.0 - exp(-tau / 80.0)));
    float s = length(p - c) - r;
    if (s < sd) { sd = s; rLoc = r; }
  }
  for (int i = 0; i < uNDot; i++) {
    vec4 g = plan(i, 0);
    if (uT < g.z) continue;
    float tau = uT - g.z;
    float R = plan(i, 1).x;
    float r = R * (0.8 * easeOut(tau / STAIN_T) + 0.35 * (1.0 - exp(-tau / 80.0)));
    float s = length(p - g.xy) - r;
    if (s < sd) { sd = s; rLoc = r; }
  }
  float landM;
  {
    float l0 = texture(tM0, (p - uM0.xy) / uM0.zw).r * step(0.0, inset(uM0, p));
    float l1 = texture(tM1, (p - uM1.xy) / uM1.zw).r;
    landM = mix(l0, l1, sstep(0.0, 30.0, inset(uM1, p)));
  }
  float recede = inBrit(p) ? 1.0 : 1.0 - 0.25 * uDim;
  if (sd < 300.0) {
    float n = fbm(p) - 0.5;
    float rr0 = clamp(rLoc, 6.0, 150.0);
    float sdn = sd + 1.25 * rr0 * n;
    // ink soaking into paper: a soft feathered edge, a faint bleed just outside it, pigment pooled a little darker
    // just inside it, a lighter body
    float fe = max(1.6 * wpp, 0.12 * rr0);
    float inside = (1.0 - sstep(-fe, fe, sdn)) * landM;
    float bleed = pow(1.0 - sstep(0.0, 0.6 * rr0 + 4.0 * wpp, sdn), 1.5) * landM;
    float rim = 1.0 - sstep(0.0, max(3.0 * wpp, 0.2 * rr0), -sdn);
    vec3 st = mix(col, POX_D, 0.46);
    st = mix(st, POX_INK, 0.26 * rim);
    col = mix(col, mix(col, POX_D, 0.46), 0.32 * bleed * (1.0 - inside) * recede);
    col = mix(col, st, inside * recede);
  }

  // ---- the towns' ink dots ----
  for (int i = 0; i < uNDot; i++) {
    vec4 g = plan(i, 0);
    if (uT < g.z) continue;
    float rd = uDotR * g.w * easeOut((uT - g.z) / INK_T);
    float s = length(p - g.xy) - rd;
    if (s > 3.0 * wpp) continue;
    float fs = 0.8 * wpp;
    float cov = 1.0 - sstep(-fs, fs, s);
    vec3 dc = mix(POX_INK, POX_D, 0.35 * sstep(-rd, -0.35 * rd, s));
    col = mix(col, dc, cov * recede);
  }

  // ---- THE VACCINE: the orange light at Berkeley ----
  float orange = 0.0;
  if (uGlowA > 0.0) {
    float r = length(p - uBerk);
    float G = uGlowA * exp(-pow(r / uGlowR, 2.0));
    col = mix(col, ACC_D, 0.5 * G);
    col += ACC * 0.22 * G;
    float s = r - uCoreR;
    float fs = 0.8 * wpp;
    float cov = 1.0 - sstep(-fs, fs, s);
    vec3 cc = mix(ACC, ACC_HOT, 0.6 * (1.0 - sstep(0.0, uCoreR * 0.8, r)));
    col = mix(col, cc, cov);
    orange = max(cov, G);
  }

  // ---- distance haze into the air (the near map clear, the far ground converging on the air at the horizon) ----
  float rr = dist / uD;
  float haze = 0.82 * sstep(1.3, 3.5, rr) + 0.18 * sstep(3.0, 6.0, rr);
  // the far north (the pole's region, which the wide opening frame looks over) dissolves into the air
  haze = max(haze, pow(1.0 - sstep(uPolar.x, uPolar.y, length(p - uPole)), 1.6));
  vec3 air = mix(uAirNear, uAirFar, sstep(1.4, 3.6, rr));
  col = mix(col, air, haze * (1.0 - 0.5 * orange));
  outColor = vec4(col, 1.0);
}`;

type GLRes = { gl: WebGL2RenderingContext; loc: Record<string, WebGLUniformLocation | null>; boxes: { e: [number, number, number, number][]; m: [number, number, number, number][] } };

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`spreadGround: ${src} did not load`));
    im.src = src;
  });

/** a level's tiles stitched into one canvas */
const stitch = async (L: SpreadLevel) => {
  const c = document.createElement("canvas");
  c.width = L.cols * SPREAD_TILE;
  c.height = L.rows * SPREAD_TILE;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const jobs: Promise<void>[] = [];
  for (let r = 0; r < L.rows; r++)
    for (let q = 0; q < L.cols; q++) {
      const code = L.cells[r * L.cols + q];
      if (code === "#") {
        jobs.push(
          loadImg(staticFile(`${TILE_DIR}/spread-${L.name}-${q}-${r}.png`)).then((im) => {
            ctx.drawImage(im, SPREAD_PAD, SPREAD_PAD, SPREAD_TILE, SPREAD_TILE, q * SPREAD_TILE, r * SPREAD_TILE, SPREAD_TILE, SPREAD_TILE);
          }),
        );
      } else if (code !== ".") {
        ctx.fillStyle = L.colors[code.charCodeAt(0) - 97];
        ctx.fillRect(q * SPREAD_TILE, r * SPREAD_TILE, SPREAD_TILE, SPREAD_TILE);
      }
    }
  await Promise.all(jobs);
  return c;
};
const maskCanvas = (m: (typeof MASKS)[number]) => {
  const c = document.createElement("canvas");
  c.width = Math.ceil((m.x1 - m.x0) * m.s);
  c.height = Math.ceil((m.y1 - m.y0) * m.s);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(m.s, 0, 0, m.s, -m.x0 * m.s, -m.y0 * m.s);
  ctx.fillStyle = "#fff";
  ctx.fill(new Path2D(LAND_D), "evenodd");
  return c;
};
const texFrom = (gl: WebGL2RenderingContext, unit: number, src: TexImageSource, opts: { mask?: boolean; repeat?: boolean }) => {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  if (opts.mask) gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, src);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const wrap = opts.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  const an = gl.getExtension("EXT_texture_filter_anisotropic");
  if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  return t;
};
const compile = (gl: WebGL2RenderingContext) => {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type) as WebGLShader;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`spreadGround shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`spreadGround link: ${gl.getProgramInfoLog(prog)}`);
  return prog;
};

/** the plan as a float texture: row 0 dots (x, z, arrive, size), row 1 (R, -, -, -), row 2 segs (x0, z0, x1, z1), row 3 (a0, a1, w, -) */
const planTexture = (gl: WebGL2RenderingContext, unit: number) => {
  const n = Math.max(DOTS.length, SEGS.length);
  const data = new Float32Array(n * 4 * 4);
  const put = (i: number, row: number, v: number[]) => data.set(v, (row * n + i) * 4);
  DOTS.forEach((d, i) => {
    put(i, 0, [d.x, d.z, d.arrive, d.size]);
    put(i, 1, [d.R, 0, 0, 0]);
  });
  SEGS.forEach((s, i) => {
    put(i, 2, [s.x0, s.z0, s.x1, s.z1]);
    put(i, 3, [s.a0, s.a1, s.w, 0]);
  });
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, n, 4, 0, gl.RGBA, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};

const UNIFORMS = ["uBuf", "uScale", "uC", "uF", "uR", "uU", "uFocal", "uD", "tE0", "tE1", "tE2", "tM0", "tM1", "tMot", "tPlan", "uE0", "uE1", "uE2", "uM0", "uM1", "uB1", "uB2", "uMotO", "uT", "uNDot", "uNSeg", "uDotR", "uBerk", "uCoreR", "uGlowR", "uGlowA", "uAirNear", "uAirFar", "uShadow", "uPole", "uPolar", "uBrit", "uDim"];

const init = async (canvas: HTMLCanvasElement): Promise<GLRes> => {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) throw new Error("spreadGround: no WebGL2 (render with --gl=angle)");
  const prog = compile(gl);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const loc: GLRes["loc"] = {};
  for (const n of UNIFORMS) loc[n] = gl.getUniformLocation(prog, n);
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const levels = SPREAD_LEVELS_SPREAD;
  for (const L of levels) if (L.cols * SPREAD_TILE > maxTex || L.rows * SPREAD_TILE > maxTex) throw new Error(`spreadGround: level ${L.name} exceeds MAX_TEXTURE_SIZE ${maxTex}`);
  const canv = await Promise.all(levels.map(stitch));
  const mot = await loadImg(staticFile(`${TILE_DIR}/mottle.png`));
  canv.forEach((c, i) => {
    texFrom(gl, i, c, {});
    c.width = 1;
    c.height = 1;
  });
  MASKS.forEach((m, i) => {
    const c = maskCanvas(m);
    texFrom(gl, 3 + i, c, { mask: true });
    c.width = 1;
    c.height = 1;
  });
  texFrom(gl, 5, mot, { repeat: true });
  planTexture(gl, 6);
  ["tE0", "tE1", "tE2", "tM0", "tM1", "tMot", "tPlan"].forEach((n, i) => gl.uniform1i(loc[n], i));
  const e = levels.map((L) => [L.x0, L.y0, L.cols * L.tw, L.rows * L.tw] as [number, number, number, number]);
  const m = MASKS.map((q) => [q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0] as [number, number, number, number]);
  return { gl, loc, boxes: { e, m } };
};

const sub = (a: [number, number], b: [number, number]): [number, number] => [a[0] - b[0], a[1] - b[1]];
/** Britain and Ireland, a coarse ring (lon/lat): the continent's plum recedes 25 % over DIM so Britain and the orange lead */
const BRIT = new Float32Array(
  (
    [
      [-6.5, 49.8],
      [1.6, 50.8],
      [2.2, 52.9],
      [-1.0, 56.5],
      [-1.5, 61],
      [-11, 58.5],
      [-11, 51.2],
    ] as [number, number][]
  ).flatMap(([lon, lat]) => project(lon, lat)),
);
const DIM = { f0: 62, f1: 86 };
const hex01 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));

/** the orange at frame f: one eased ramp f70 -> f87 (kindle 0..1; visible from f71, "Jenner"), then the glow creeps a little wider */
export const orangeAt = (f: number) => {
  // ease-out: the point is there from the first frame of the ramp, then swells into the glow
  const K = 1 - Math.pow(1 - c01((f - KINDLE.f0) / (KINDLE.f1 - KINDLE.f0)), 2.6);
  const after = c01((f - KINDLE.f1) / 45);
  return { K, coreR: DOT_R * 1.15 * (0.2 + 0.6 * K) * (1 + 0.05 * after), glowR: 18 + 44 * K + 10 * after, glowA: 0.95 * K };
};
/** a town dot's world radius at camera distance D (size 1) */
export const dotRadius = (D: number) => DOT_R * Math.pow(D / TRACK.D1, 0.6);

export type GroundAir = { near: [number, number, number]; far: [number, number, number]; shadow: string };
const draw = (R: GLRes, cam: Cam, frame: number, scale: number, air: GroundAir) => {
  const { gl, loc } = R;
  gl.uniform3fv(loc.uAirNear, air.near);
  gl.uniform3fv(loc.uAirFar, air.far);
  gl.uniform3fv(loc.uShadow, hex01(air.shadow));
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform2f(loc.uBuf, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform1f(loc.uScale, scale);
  gl.uniform3fv(loc.uC, cam.C);
  gl.uniform3fv(loc.uF, cam.f);
  gl.uniform3fv(loc.uR, cam.r);
  gl.uniform3fv(loc.uU, cam.u);
  gl.uniform1f(loc.uFocal, F);
  gl.uniform1f(loc.uD, cam.D);
  gl.uniform4fv(loc.uE0, R.boxes.e[0]);
  gl.uniform4fv(loc.uE1, R.boxes.e[1]);
  gl.uniform4fv(loc.uE2, R.boxes.e[2]);
  gl.uniform4fv(loc.uM0, R.boxes.m[0]);
  gl.uniform4fv(loc.uM1, R.boxes.m[1]);
  const lv = SPREAD_LEVELS_SPREAD;
  gl.uniform2fv(loc.uB1, lv[1].band as [number, number]);
  gl.uniform2fv(loc.uB2, lv[2].band as [number, number]);
  // the mottle tile ~1.1 D wide, octaves of 2
  const ml = Math.log2(cam.D * 1.1);
  const mo = Math.floor(ml);
  gl.uniform2f(loc.uMotO, Math.pow(2, mo), ml - mo);
  gl.uniform1f(loc.uT, frame);
  gl.uniform1i(loc.uNDot, DOTS.length);
  gl.uniform1i(loc.uNSeg, SEGS.length);
  gl.uniform1f(loc.uDotR, dotRadius(cam.D));
  gl.uniform2f(loc.uBerk, BERKELEY.x, BERKELEY.z);
  gl.uniform2f(loc.uPole, POLE[0], POLE[1]);
  gl.uniform2fv(loc.uBrit, BRIT);
  gl.uniform1f(loc.uDim, c01((frame - DIM.f0) / (DIM.f1 - DIM.f0)));
  gl.uniform2f(loc.uPolar, Math.hypot(...sub(project(10, 79), POLE)), Math.hypot(...sub(project(10, 62), POLE)));
  const o = orangeAt(frame);
  gl.uniform1f(loc.uCoreR, o.coreR);
  gl.uniform1f(loc.uGlowR, o.glowR);
  gl.uniform1f(loc.uGlowA, o.glowA);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
};

let SHARED: Promise<GLRes> | null = null;
/** the ground canvas (full frame, under every overlay) */
export const SpreadGround: React.FC<{ cam: Cam; frame: number; air: GroundAir }> = ({ cam, frame, air }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [res, setRes] = useState<GLRes | null>(null);
  const [handle] = useState(() => delayRender("spreadGround: building the ground textures", { timeoutInMilliseconds: 240000 }));
  const done = useRef(false);
  const scale = typeof window === "undefined" ? 1 : Math.min(1, window.devicePixelRatio || 1);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (!SHARED) SHARED = init(c);
    SHARED.then(setRes).catch((err) => cancelRender(err));
  }, []);
  useLayoutEffect(() => {
    if (!res) return;
    draw(res, cam, frame, scale, air);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [res, cam, frame, scale, handle, air]);
  return <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};
