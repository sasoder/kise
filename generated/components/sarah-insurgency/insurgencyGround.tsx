// ---------------------------------------------------------------------------
// insurgencyGround: THE FLOOR of sarah-insurgency, drawn in WebGL2 by casting each pixel's ray from the clip's one
// camera (insurgencyCamera.ts) onto the plane Y = 0 (generalised from kyle-pandemics/rodentGround.tsx). Exact
// perspective, one VP, mipmapped + anisotropic (no shimmer on the far map), and the same maths as every SVG overlay,
// so the pieces sit on the map. RENDER WITH --gl=angle. Re-exported by insurgencyShared.tsx (the API is there).
//
// LAYERS (one shader): the baked map in the MAP STYLE's own colours (insChinaLevels / insAtlanticLevels: umber land,
// hand-coloured rim, dark petrol sea, cream engraved coast + 4 water-lines, faint graticule, dashed cream period
// borders), each fragment picking its level by its own screen scale k (crossfaded in the levels' k bands) -> or, for
// the PAGE, the umber page with a faint engraved laid-line texture and an optional graticule -> the paper mottle
// (world-space octaves by D) -> up to two TERRITORY layers (a region mask: a flat wash + a world-space hatch,
// cream for the occupier or orange for the home side, an optional monotone travelling front with a crisp bright
// edge) -> the distance fog into the air at that distance (hazeOf / airMixOf, relative to D: crisp near, sinking
// into the air far; converging on the horizon's air, no edge) -> above the horizon: transparent (AirStage's air).
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { INSCHINA_LEVELS_CHINA, INSCHINA_PAD, INSCHINA_TILE } from "./insChinaLevels";
import { INSATLANTIC_LEVELS_ATLANTIC } from "./insAtlanticLevels";
import { H, W, fogFor, type Cam, type Fog, type P2 } from "./insurgencyCamera";

const TILE_DIR = "sarah-insurgency";
type Level = { name: string; s: number; kBake: number; band: [number, number] | null; x0: number; y0: number; tw: number; cols: number; rows: number; cells: string; colors: string[] };
export type GroundWorld = "china" | "atlantic" | "page";
const LEVELS: Record<Exclude<GroundWorld, "page">, Level[]> = { china: INSCHINA_LEVELS_CHINA, atlantic: INSATLANTIC_LEVELS_ATLANTIC };
// both sets were baked with the same tile and pad
const TILE = INSCHINA_TILE;
const PAD = INSCHINA_PAD;

/** a territory layer: a region (its land-clipped fill d, world px) washed + hatched; optional travelling front */
export type Front = { kind: "radial"; at: P2; reach: number; rough?: number } | { kind: "linear"; at: P2; dir: P2; reach: number; rough?: number };
export type TerritoryLayer = {
  /** the region's fill path (world px), e.g. OCCUPIED_1939.d */
  d: string;
  color: "cream" | "orange";
  /** 0..1 master */
  amount?: number;
  /** flat tint (default cream 0.12, orange 0.22) */
  wash?: number;
  /** hatch line strength (default 0.45) */
  hatch?: number;
  /** hatch angle on the map, deg (default 45) */
  angle?: number;
  /** hatch spacing in screen px at the target (default 9) */
  px?: number;
  /** a monotone travelling front: covered where field < reach (radial: distance from `at`; linear: along `dir`) */
  front?: Front;
  /** the front's bright edge (default 0.9) */
  edge?: number;
};
export type GroundAir = { near: [number, number, number]; far: [number, number, number] };

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
uniform sampler2D tL0, tL1, tL2, tL3, tMot, tH0, tH1;
uniform vec4 uL0, uL1, uL2, uL3;     // level boxes x0, y0, w, h (world)
uniform vec2 uB1, uB2, uB3;          // k bands of levels 1..3
uniform int uN;                      // number of levels (0 = the page)
uniform vec3 uPageCol;
uniform float uGrat;                 // page graticule spacing (world; 0 = off)
uniform vec2 uMotO;                  // mottle octave tile size, blend
uniform float uMot;                  // mottle strength
uniform vec3 uFogA;                  // a0, a1, m
uniform vec4 uFogB;                  // b0, b1, c0, c1
uniform vec3 uAirNear, uAirFar;
uniform vec4 uHB0, uHB1;             // mask boxes
uniform vec3 uHC0, uHC1;             // layer colours
uniform vec4 uHA0, uHA1;             // amount, wash, hatch, edge
uniform vec4 uHF0, uHF1;             // front: kind, ax, ay, reach
uniform vec4 uHD0, uHD1;             // front dir x, y, rough, hatch angle (rad)
uniform vec4 uHP0, uHP1;             // hatch period A, B, blend, -
uniform vec3 uDbg;                   // debug disc: x, z, radius (0 = off)

const vec3 SHADOW = vec3(34.0, 24.0, 15.0) / 255.0;
const vec3 INK = vec3(233.0, 221.0, 191.0) / 255.0;

float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float inset(vec4 box, vec2 p) { vec2 a = p - box.xy; vec2 b = box.xy + box.zw - p; return min(min(a.x, a.y), min(b.x, b.y)); }
vec3 lv(sampler2D t, vec4 box, vec2 p) { return texture(t, (p - box.xy) / box.zw).rgb; }
float fade(vec2 band, vec4 box, vec2 p, float k) {
  return sstep(log(band.x), log(band.y), log(k)) * sstep(0.0, 40.0, inset(box, p) * k);
}
vec3 mapAt(vec2 p, float k) {
  vec3 c = lv(tL0, uL0, p);
  if (uN > 1) c = mix(c, lv(tL1, uL1, p), fade(uB1, uL1, p, k));
  if (uN > 2) c = mix(c, lv(tL2, uL2, p), fade(uB2, uL2, p, k));
  if (uN > 3) c = mix(c, lv(tL3, uL3, p), fade(uB3, uL3, p, k));
  return c;
}
float lines(float q, float period, float width) {
  float fw = fwidth(q);
  float d = abs(fract(q / period + 0.5) - 0.5) * period;
  float vis = sstep(2.2, 4.0, period / max(fw, 1e-6));
  return (1.0 - sstep(width * 0.5 - fw * 0.7, width * 0.5 + fw * 0.7, d)) * vis;
}
float field(vec4 F, vec4 Dd, vec2 p) {
  if (F.x < 1.5) {
    vec2 d = p - F.yz;
    float r = length(d);
    float L = log(r + 1.0);
    float a = atan(d.y, d.x);
    float n1 = 0.5 * sin(3.0 * a + 1.7 * L + 0.3) + 0.3 * sin(5.0 * a - 2.3 * L + 1.1) + 0.2 * sin(8.0 * a + 3.1 * L + 2.0);
    return r * (1.0 + Dd.z * n1);
  }
  float s = dot(p - F.yz, Dd.xy);
  vec2 q = vec2(-Dd.y, Dd.x);
  float t = dot(p - F.yz, q);
  return s + Dd.z * (0.55 * sin(t / 37.0 + 1.3) + 0.3 * sin(t / 13.0 + 0.4) + 0.15 * sin(t / 5.3 + 2.1));
}
vec3 territory(vec3 col, vec2 p, sampler2D m, vec4 box, vec3 C, vec4 A, vec4 F, vec4 Dd, vec4 P, float k) {
  if (A.x <= 0.0) return col;
  float inBox = step(0.0, inset(box, p));
  float mk = texture(m, (p - box.xy) / box.zw).r * inBox;
  if (mk <= 0.002) return col;
  float cover = 1.0;
  float edge = 0.0;
  if (F.x > 0.5) {
    float s = field(F, Dd, p);
    float fs = fwidth(s);
    cover = 1.0 - sstep(-fs * 0.8, fs * 0.8, s - F.w);
    edge = (1.0 - sstep(fs * 1.4, fs * 3.0, F.w - s)) * cover;
  }
  float o = mk * cover * A.x;
  if (o <= 0.0) return col;
  vec2 hd = vec2(cos(Dd.w), sin(Dd.w));
  float q = dot(p, vec2(-hd.y, hd.x));
  float h = mix(lines(q, P.x, P.x * 0.16), lines(q, P.y, P.y * 0.16), P.z);
  vec3 c = mix(col, C, A.y);
  c = mix(c, C, A.z * h);
  c = mix(c, mix(C, vec3(1.0, 0.97, 0.88), 0.25), A.w * edge);
  return mix(col, c, o);
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / uScale;
  float a = (fc.x - ${W / 2}.0) / uFocal;
  float bb = -(fc.y - ${H / 2}.0) / uFocal;
  vec3 dir = uF + a * uR + bb * uU;
  if (dir.y > -1e-6) { outColor = vec4(0.0); return; }
  float t = -uC.y / dir.y;
  vec3 P3 = uC + t * dir;
  vec2 p = P3.xz;
  float rel = t * length(dir) / uD;
  float wpp = max(length(dFdx(p)), length(dFdy(p))) * uScale;
  float k = 1.0 / max(wpp, 1e-6);

  vec3 col;
  if (uN > 0) {
    col = mapAt(p, k);
  } else {
    col = uPageCol;
    // the page: faint engraved laid lines (world space, two octaves) and chain lines across them
    float per = exp2(floor(log2(uD * 0.006)));
    float laid = mix(lines(p.y, per, per * 0.18), lines(p.y, per * 2.0, per * 0.36), fract(log2(uD * 0.006)));
    float chain = lines(p.x, per * 22.0, per * 0.5);
    col = mix(col, SHADOW, 0.1 * laid);
    col = mix(col, INK, 0.035 * chain);
    if (uGrat > 0.0) col = mix(col, INK, 0.12 * max(lines(p.x, uGrat, uGrat * 0.004 + 0.6 / k), lines(p.y, uGrat, uGrat * 0.004 + 0.6 / k)));
  }
  // the paper mottle, world space, two octaves
  if (uMot > 0.0) {
    float m0 = texture(tMot, p / uMotO.x).a;
    float m1 = texture(tMot, p / (uMotO.x * 2.0) + 0.37).a;
    col = mix(col, SHADOW, clamp(mix(m0, m1, uMotO.y) * uMot, 0.0, 1.0));
    // a finer octave (the paper's fibre near the lens), lighter and darker both, faded out where it would alias
    float m2 = texture(tMot, p / (uMotO.x * 0.125) + 0.71).a;
    float m3 = texture(tMot, p / (uMotO.x * 0.25) + 0.19).a;
    float fine = mix(m2, m3, uMotO.y) - 0.5;
    float fz = 1.0 - sstep(1.2, 3.0, rel);
    col *= 1.0 + 0.32 * uMot * fine * fz;
  }
  col = territory(col, p, tH0, uHB0, uHC0, uHA0, uHF0, uHD0, uHP0, k);
  col = territory(col, p, tH1, uHB1, uHC1, uHA1, uHF1, uHD1, uHP1, k);
  if (uDbg.z > 0.0 && length(p - uDbg.xy) < uDbg.z) col = vec3(1.0, 0.0, 1.0);
  // the distance fog: the ground sinks into the air at its distance, converging on the horizon's air
  float h0 = uFogA.z * sstep(uFogA.x, uFogA.y, rel);
  float haze = h0 + (1.0 - h0) * sstep(uFogB.x, uFogB.y, rel);
  vec3 air = mix(uAirNear, uAirFar, sstep(uFogB.z, uFogB.w, rel));
  outColor = vec4(mix(col, air, haze), 1.0);
}`;

type Mask = { tex: WebGLTexture; box: [number, number, number, number] };
type GLRes = {
  gl: WebGL2RenderingContext;
  loc: Record<string, WebGLUniformLocation | null>;
  boxes: [number, number, number, number][];
  levels: Level[];
  masks: Map<string, Mask>;
  empty: WebGLTexture;
};

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`insurgencyGround: ${src} did not load`));
    im.src = src;
  });
/** a level's tiles stitched into one canvas */
const stitch = async (world: string, L: Level) => {
  const c = document.createElement("canvas");
  c.width = L.cols * TILE;
  c.height = L.rows * TILE;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const jobs: Promise<void>[] = [];
  for (let r = 0; r < L.rows; r++)
    for (let q = 0; q < L.cols; q++) {
      const code = L.cells[r * L.cols + q];
      if (code === "#") {
        jobs.push(
          loadImg(staticFile(`${TILE_DIR}/${world}-${L.name}-${q}-${r}.png`)).then((im) => {
            ctx.drawImage(im, PAD, PAD, TILE, TILE, q * TILE, r * TILE, TILE, TILE);
          }),
        );
      } else if (code !== ".") {
        ctx.fillStyle = L.colors[code.charCodeAt(0) - 97];
        ctx.fillRect(q * TILE, r * TILE, TILE, TILE);
      }
    }
  await Promise.all(jobs);
  return c;
};
const texFrom = (gl: WebGL2RenderingContext, unit: number, src: TexImageSource, opts: { mask?: boolean; repeat?: boolean }) => {
  const t = gl.createTexture() as WebGLTexture;
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
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`insurgencyGround shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`insurgencyGround link: ${gl.getProgramInfoLog(prog)}`);
  return prog;
};
const UNIFORMS = [
  "uBuf", "uScale", "uC", "uF", "uR", "uU", "uFocal", "uD", "tL0", "tL1", "tL2", "tL3", "tMot", "tH0", "tH1", "uL0", "uL1", "uL2", "uL3", "uB1", "uB2", "uB3", "uN",
  "uPageCol", "uGrat", "uMotO", "uMot", "uFogA", "uFogB", "uAirNear", "uAirFar", "uHB0", "uHB1", "uHC0", "uHC1", "uHA0", "uHA1", "uHF0", "uHF1", "uHD0", "uHD1", "uHP0", "uHP1", "uDbg",
];
// texture units: 0..3 levels, 4 mottle, 5..6 territory masks
const init = async (canvas: HTMLCanvasElement, world: GroundWorld): Promise<GLRes> => {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) throw new Error("insurgencyGround: no WebGL2 (render with --gl=angle)");
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
  const levels = world === "page" ? [] : LEVELS[world];
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  for (const L of levels) if (L.cols * TILE > maxTex || L.rows * TILE > maxTex) throw new Error(`insurgencyGround: level ${L.name} exceeds MAX_TEXTURE_SIZE ${maxTex}`);
  const canv = await Promise.all(levels.map((L) => stitch(world, L)));
  const mot = await loadImg(staticFile(`${TILE_DIR}/mottle.png`));
  canv.forEach((c, i) => {
    texFrom(gl, i, c, {});
    c.width = 1;
    c.height = 1;
  });
  // unused level / mask units get a 1x1 black texture
  const one = document.createElement("canvas");
  one.width = 1;
  one.height = 1;
  const empty = texFrom(gl, 7, one, { mask: true });
  for (let i = levels.length; i < 4; i++) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, empty);
  }
  texFrom(gl, 4, mot, { repeat: true });
  for (const u of [5, 6]) {
    gl.activeTexture(gl.TEXTURE0 + u);
    gl.bindTexture(gl.TEXTURE_2D, empty);
  }
  ["tL0", "tL1", "tL2", "tL3", "tMot", "tH0", "tH1"].forEach((n, i) => gl.uniform1i(loc[n], i));
  const boxes = levels.map((L) => [L.x0, L.y0, L.cols * L.tw, L.rows * L.tw] as [number, number, number, number]);
  return { gl, loc, boxes, levels, masks: new Map(), empty };
};

/** a region mask (R8) rasterised from its d over its own bbox, at most 4096 texels on a side, at most 2 per world px */
const pathBox = (d: string): [number, number, number, number] => {
  const nums = d.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? [];
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = +nums[i];
    const y = +nums[i + 1];
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return [x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8];
};
const maskOf = (R: GLRes, d: string, unit: number): Mask => {
  const key = `${d.length}:${d.slice(0, 64)}:${d.slice(-64)}`;
  const hit = R.masks.get(key);
  if (hit) return hit;
  const box = pathBox(d);
  const s = Math.min(2, 4096 / Math.max(box[2], box[3]));
  const c = document.createElement("canvas");
  c.width = Math.ceil(box[2] * s);
  c.height = Math.ceil(box[3] * s);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(s, 0, 0, s, -box[0] * s, -box[1] * s);
  ctx.fillStyle = "#fff";
  ctx.fill(new Path2D(d), "evenodd");
  const tex = texFrom(R.gl, unit, c, { mask: true });
  c.width = 1;
  c.height = 1;
  const m = { tex, box };
  R.masks.set(key, m);
  return m;
};

const hex01 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
const INK01 = hex01("#E9DDBF");
const ORANGE01 = hex01("#FFB000");
const PAGE01 = hex01("#4B3E2F");

export type GroundProps = {
  world: GroundWorld;
  cam: Cam;
  air: GroundAir;
  territory?: TerritoryLayer[];
  /** mottle strength (default 0.42) */
  mottle?: number;
  fog?: Fog;
  /** the page: graticule spacing in world units (0 = none) */
  graticule?: number;
  /** a debug disc painted by the shader at a map point (the lock check): [x, z, radius] */
  debug?: [number, number, number];
};

const draw = (R: GLRes, p: GroundProps, scale: number) => {
  const { gl, loc } = R;
  const { cam } = p;
  const fog = p.fog ?? fogFor(cam);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform2f(loc.uBuf, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform1f(loc.uScale, scale);
  gl.uniform3fv(loc.uC, cam.C);
  gl.uniform3fv(loc.uF, cam.f);
  gl.uniform3fv(loc.uR, cam.r);
  gl.uniform3fv(loc.uU, cam.u);
  gl.uniform1f(loc.uFocal, cam.F);
  gl.uniform1f(loc.uD, cam.D);
  const L = R.levels;
  gl.uniform1i(loc.uN, L.length);
  ["uL0", "uL1", "uL2", "uL3"].forEach((n, i) => gl.uniform4fv(loc[n], R.boxes[i] ?? [0, 0, 1, 1]));
  ["uB1", "uB2", "uB3"].forEach((n, i) => gl.uniform2fv(loc[n], (L[i + 1]?.band ?? [1e6, 2e6]) as [number, number]));
  gl.uniform3fv(loc.uPageCol, PAGE01);
  gl.uniform1f(loc.uGrat, p.graticule ?? 0);
  const ml = Math.log2(cam.D * 1.1);
  const mo = Math.floor(ml);
  gl.uniform2f(loc.uMotO, Math.pow(2, mo), ml - mo);
  gl.uniform1f(loc.uMot, p.mottle ?? 0.42);
  gl.uniform3f(loc.uFogA, fog.a0, fog.a1, fog.m);
  gl.uniform4f(loc.uFogB, fog.b0, fog.b1, fog.c0, fog.c1);
  gl.uniform3fv(loc.uAirNear, p.air.near);
  gl.uniform3fv(loc.uAirFar, p.air.far);
  const layers = (p.territory ?? []).slice(0, 2);
  for (let i = 0; i < 2; i++) {
    const t = layers[i];
    const sfx = String(i);
    if (!t || (t.amount ?? 1) <= 0) {
      gl.uniform4f(loc[`uHA${sfx}`], 0, 0, 0, 0);
      gl.activeTexture(gl.TEXTURE5 + i);
      gl.bindTexture(gl.TEXTURE_2D, R.empty);
      continue;
    }
    const m = maskOf(R, t.d, 5 + i);
    gl.activeTexture(gl.TEXTURE5 + i);
    gl.bindTexture(gl.TEXTURE_2D, m.tex);
    gl.uniform4fv(loc[`uHB${sfx}`], m.box);
    gl.uniform3fv(loc[`uHC${sfx}`], t.color === "orange" ? ORANGE01 : INK01);
    gl.uniform4f(loc[`uHA${sfx}`], t.amount ?? 1, t.wash ?? (t.color === "orange" ? 0.22 : 0.12), t.hatch ?? 0.45, t.edge ?? 0.9);
    const fr = t.front;
    if (fr) {
      gl.uniform4f(loc[`uHF${sfx}`], fr.kind === "radial" ? 1 : 2, fr.at[0], fr.at[1], fr.reach);
      const dir = fr.kind === "linear" ? fr.dir : ([1, 0] as P2);
      const n = Math.hypot(dir[0], dir[1]) || 1;
      gl.uniform4f(loc[`uHD${sfx}`], dir[0] / n, dir[1] / n, fr.rough ?? (fr.kind === "radial" ? 0.12 : 0), ((t.angle ?? 45) * Math.PI) / 180);
    } else {
      gl.uniform4f(loc[`uHF${sfx}`], 0, 0, 0, 0);
      gl.uniform4f(loc[`uHD${sfx}`], 1, 0, 0, ((t.angle ?? 45) * Math.PI) / 180);
    }
    // the hatch: ~px screen px at the target, octaves of 2 crossfaded (world space: no swimming)
    const hl = Math.log2(((t.px ?? 9) * cam.D) / cam.F);
    const ho = Math.floor(hl);
    gl.uniform4f(loc[`uHP${sfx}`], Math.pow(2, ho), Math.pow(2, ho + 1), hl - ho, 0);
  }
  gl.uniform3fv(loc.uDbg, p.debug ?? [0, 0, 0]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
};

/** THE FLOOR: a full-frame canvas under every overlay. world "china" | "atlantic" (MapGround3D) or "page" (PageGround3D) */
export const Ground3D: React.FC<GroundProps> = (props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const res = useRef<Promise<GLRes> | null>(null);
  const [ready, setReady] = useState<GLRes | null>(null);
  const [handle] = useState(() => delayRender(`insurgencyGround: ${props.world} textures`, { timeoutInMilliseconds: 240000 }));
  const done = useRef(false);
  const scale = typeof window === "undefined" ? 1 : Math.min(1, window.devicePixelRatio || 1);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c || res.current) return;
    res.current = init(c, props.world);
    res.current.then(setReady).catch((err) => cancelRender(err));
  }, [props.world]);
  useLayoutEffect(() => {
    if (!ready) return;
    draw(ready, props, scale);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  });
  return <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};
export const MapGround3D: React.FC<Omit<GroundProps, "world" | "graticule"> & { world: "china" | "atlantic" }> = (p) => <Ground3D {...p} />;
export const PageGround3D: React.FC<Omit<GroundProps, "world">> = (p) => <Ground3D {...p} world="page" />;
