// ---------------------------------------------------------------------------
// rodentGround: the GROUND PLANE of RodentFromCentralAsia (kyle-pandemics, cut 1), drawn in WebGL2 by casting each
// pixel's ray from the cut's one camera (rodentCamera.ts) onto the plane Y = 0. Exact perspective, one VP, mipmapped
// (no shimmer on the far map), and the same maths as the SVG / canvas overlays, so everything sits on one ground.
//
// LAYERS (one shader): the baked map (rodentLevels: e0 whole extent, e1 the steppe-to-Europe band, e2 the origin;
// each fragment picks its level by its own screen scale, crossfaded in the levels' k bands) -> the STEPPE at low
// altitude (a lighter umber near, broken engraved streaks along the local north, i.e. to the VP), crossfaded into
// the map by camera distance (steppeAt) -> the paper mottle on the ground (world-space octaves) -> THE DISEASE
// (the front's field < reach (rodentCamera THE FRONT: the seep's pools near the burrow, the baked travel-time
// field front.f32 farther out), clipped to land: an orange wash, an orange hatch whose period is screen-steady, a crisp
// bright front edge) -> atmospheric depth toward the page (hazeAt) -> above the horizon, the page.
// V3 (AIR_READY.md, palette A): the map's land remapped to the warm ground, its seas and lakes to the teal medium, the
// steppe in soft ground tones, the mottle only soft patches, distance fogging into the air at that distance (`air`),
// and the sky transparent so AirStage's air shows above the horizon.
// The land mask is drawn here from the vector land (rodentMapData LAND_D minus LAKES_D): a coarse one over the
// band the front crosses and a fine one round the origin.
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { RODENT_LEVELS_EURASIA, RODENT_PAD, RODENT_TILE, type RodentLevel } from "./rodentLevels";
import { LAKES_D, LAND_D, project } from "./rodentMapData";
import { F, H, HAZE, MOUTH, NEAR, POLE, POOL_OFF, RIGHT, RIVULETS, AWAY, W, reachAt, steppeAt, type Cam } from "./rodentCamera";
import { FRONT_GRID } from "./rodentFrontData";
import { AIR } from "./pandemicAir";

const TILE_DIR = "kyle-pandemics/rodent";
/** the land masks: world boxes and texels per world px */
const MASKS = [
  { x0: -5600, y0: -2100, x1: 1800, y1: 2500, s: 0.55 },
  { x0: -700, y0: -800, x1: 700, y1: 600, s: 2.4 },
];

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uBuf;        // drawing buffer size (px)
uniform float uScale;     // buffer px per frame px
uniform vec3 uC, uF, uR, uU;
uniform float uFocal, uD;
uniform sampler2D tE0, tE1, tE2, tM0, tM1, tMot;
uniform vec4 uE0, uE1, uE2;   // level texture world boxes: x0, y0, w, h
uniform vec4 uM0, uM1;        // mask world boxes
uniform vec2 uB1, uB2;        // k bands of e1, e2
uniform float uSteppe;
uniform float uReach;
uniform vec2 uMouth;
uniform vec2 uPole;
uniform vec2 uPool0, uPool1, uPool2;
uniform vec3 uPoolOff;
uniform vec3 uNear;           // r0, r1, amp
uniform highp sampler2D tFront;
uniform vec3 uG;              // the front grid: x0, y0, cell
uniform vec4 uHatch;          // spacing A, spacing B, blend t, -
uniform vec3 uHaze;           // a, b, max
uniform vec2 uRight, uAway;   // fixed world axes at the origin (the steppe's streaks)
uniform vec2 uMotO;           // mottle octave: tile world size, blend t
uniform float uOrange;        // 0..1 master for the disease layer (1 once it exists)
uniform vec3 uAirNear, uAirFar; // V3: the medium at about the target's distance and at the horizon
uniform vec3 uGroundOff;      // V3: the map's land family lifted to the warm ground (AIR.A ground)
uniform vec3 uSeaNew;         // V3: the sea in the teal medium
uniform vec3 uGMid, uGLit, uGDark, uShadow;

const vec3 LAND = vec3(63.0, 52.0, 40.0) / 255.0;
const vec3 LAND_RIM = vec3(106.0, 88.0, 56.0) / 255.0;
const vec3 DARK = vec3(23.0, 18.0, 13.0) / 255.0;
const vec3 ACC = vec3(255.0, 176.0, 0.0) / 255.0;
const vec3 ACC_D = vec3(217.0, 138.0, 12.0) / 255.0;
const vec3 MOT = vec3(10.0, 7.0, 4.0) / 255.0;
const vec3 SEA = vec3(27.0, 34.0, 38.0) / 255.0;

float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

vec3 level(sampler2D t, vec4 box, vec2 p) {
  vec2 uv = (p - box.xy) / box.zw;
  return texture(t, uv).rgb;
}
float inset(vec4 box, vec2 p) {
  vec2 a = p - box.xy;
  vec2 b = box.xy + box.zw - p;
  return min(min(a.x, a.y), min(b.x, b.y));
}
/** the baked map at p (the levels crossfaded by the screen scale k) */
vec3 mapAt(vec2 p, float k) {
  vec3 c = level(tE0, uE0, p);
  float inE0 = sstep(0.0, 300.0, inset(uE0, p));
  float w1 = sstep(log(uB1.x), log(uB1.y), log(k)) * sstep(0.0, 40.0, inset(uE1, p) * k);
  c = mix(c, level(tE1, uE1, p), w1);
  float w2 = sstep(log(uB2.x), log(uB2.y), log(k)) * sstep(0.0, 40.0, inset(uE2, p) * k);
  c = mix(c, level(tE2, uE2, p), w2);
  return mix(LAND, c, inE0);
}

float grid(vec2 p) {
  ivec2 sz = textureSize(tFront, 0);
  vec2 g = (p - uG.xy) / uG.z - 0.5;
  ivec2 c = clamp(ivec2(floor(g)), ivec2(0), sz - 2);
  vec2 f = clamp(g - vec2(c), 0.0, 1.0);
  float a = texelFetch(tFront, c, 0).r;
  float b = texelFetch(tFront, c + ivec2(1, 0), 0).r;
  float d = texelFetch(tFront, c + ivec2(0, 1), 0).r;
  float e = texelFetch(tFront, c + ivec2(1, 1), 0).r;
  return mix(mix(a, b, f.x), mix(d, e, f.x), f.y);
}
float field(vec2 p) {
  vec2 d = p - uMouth;
  float r = length(d);
  float near = min(min(length(p - uPool0) + uPoolOff.x, length(p - uPool1) + uPoolOff.y), length(p - uPool2) + uPoolOff.z);
  float L = log(r + 1.0);
  float a = atan(d.y, d.x);
  float n1 = 0.5 * sin(3.0 * a + 1.7 * L + 0.3) + 0.3 * sin(5.0 * a - 2.3 * L + 1.1) + 0.2 * sin(8.0 * a + 3.1 * L + 2.0);
  near *= 1.0 + uNear.z * n1 * sstep(2.0, 12.0, r);
  float b = sstep(uNear.x, uNear.y, r);
  if (b <= 0.0) return near;
  // farther out: the baked field, its edge roughened at a middle scale
  float far = grid(p) + b * (7.0 * sin(p.x / 41.0 + 1.3 * sin(p.y / 57.0)) + 5.0 * sin(p.y / 29.0 + p.x / 83.0 + 0.7));
  return mix(near, far, b);
}

float lines(float q, float period, float width) {
  float fw = fwidth(q);
  float d = abs(fract(q / period + 0.5) - 0.5) * period;
  float vis = sstep(2.2, 4.0, period / max(fw, 1e-6));
  return (1.0 - sstep(width * 0.5 - fw * 0.7, width * 0.5 + fw * 0.7, d)) * vis;
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / uScale; // frame px, y down
  float a = (fc.x - ${W / 2}.0) / uFocal;
  float bb = -(fc.y - ${H / 2}.0) / uFocal;
  vec3 dir = uF + a * uR + bb * uU;
  // V3: above the horizon the air shows through (AirStage paints it)
  if (dir.y > -1e-6) { outColor = vec4(0.0); return; }
  float t = -uC.y / dir.y;
  vec3 P = uC + t * dir;
  vec2 p = P.xz;
  float dist = t * length(dir);
  // V3 r2: lighter haze on the near map; the far ground converges continuously on the air at the horizon (no edge)
  float hz0 = 0.8 * sstep(1.6, 4.4, dist / uD);
  float haze = hz0 + (1.0 - hz0) * sstep(3.5, 14.0, dist / uD);

  // the map: per-fragment level by screen scale (frame px per world px)
  float wpp = max(length(dFdx(p)), length(dFdy(p))) * uScale;
  float k = 1.0 / max(wpp, 1e-6);
  vec3 col = mapAt(p, k);
  // V3 r2: the map's cream lines (coasts, water-lines) read at a heavier weight on the near map: their coverage
  // widened by ~1 px (the brightest of five taps)
  vec2 ox = dFdx(p) * 0.9;
  vec2 oy = dFdy(p) * 0.9;
  vec3 LUM = vec3(0.3, 0.59, 0.11);
  float ln = sstep(0.42, 0.62, dot(col, LUM));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p + ox, k), LUM)));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p - ox, k), LUM)));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p + oy, k), LUM)));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p - oy, k), LUM)));
  // V3: the land warm brown like the ground, the seas and lakes in the teal medium (the map's own lines kept: the
  // remap is an offset of each family, so the cream coasts and water-lines keep their contrast)
  float seaW = 1.0 - sstep(0.03, 0.09, length(col - SEA));
  col = mix(col + uGroundOff + 0.03, uSeaNew + (col - SEA) * 0.85, seaW);
  col = mix(col, vec3(0.95, 0.92, 0.86), ln * 0.7 * (1.0 - sstep(1.6, 4.0, dist / uD)));

  // the steppe (low altitude): a lighter umber near and broken engraved streaks toward the VP
  if (uSteppe > 0.001) {
    float across = dot(p, uRight);
    float along = dot(p, uAway);
    // faint furrows receding to the VP
    float fur = lines(across, 4.6, 0.32) * (0.55 + 0.45 * sin(along * 0.07 + across * 0.9));
    // the grass's engraving: short strokes across the view, scattered in a jittered grid
    vec2 cell = vec2(2.3, 3.1);
    vec2 g = vec2(across, along) / cell;
    vec2 gi = floor(g);
    float hsh = hash1(gi.x * 157.0 + gi.y * 13.0);
    vec2 gf = fract(g) - vec2(0.5, 0.25 + 0.5 * hash1(gi.x * 31.0 + gi.y * 7.0));
    float len = 0.25 + 0.2 * hash1(gi.x * 3.0 + gi.y * 101.0);
    float fy = fwidth(along) / cell.y;
    float strokeV = (1.0 - sstep(0.035, 0.035 + fy * 1.4, abs(gf.y))) * (1.0 - sstep(len - 0.05, len, abs(gf.x))) * step(0.45, hsh);
    float vis = sstep(2.0, 5.0, cell.y / max(fwidth(along), 1e-6));
    float nearLift = 0.3 * (1.0 - sstep(0.6, 2.6, dist / uD));
    // V3: the steppe in the warm ground's soft tones (no engraved dark: the streaks only a texture)
    vec3 steppe = mix(uGMid, uGLit, nearLift);
    steppe = mix(steppe, uGDark, 0.08 * fur + 0.14 * strokeV * vis);
    col = mix(col, steppe, uSteppe);
  }

  // the paper mottle, world space, two octaves
  {
    float m0 = texture(tMot, p / uMotO.x).a;
    float m1 = texture(tMot, p / (uMotO.x * 2.0) + 0.37).a;
    float m = mix(m0, m1, uMotO.y);
    col = mix(col, uShadow, clamp(m * 0.4, 0.0, 1.0));
  }

  // the disease: the field under the front, clipped to land
  if (uOrange > 0.0) {
    float s = field(p);
    float fs = fwidth(s);
    float inside = 1.0 - sstep(-fs * 0.8, fs * 0.8, s - uReach);
    float land0 = texture(tM0, (p - uM0.xy) / uM0.zw).r * step(0.0, inset(uM0, p));
    float land1 = texture(tM1, (p - uM1.xy) / uM1.zw).r;
    float land = mix(land0, land1, sstep(0.0, 30.0, inset(uM1, p)));
    float o = inside * land * uOrange;
    if (o > 0.0) {
      // the hatch runs along the parallels (arcs round the pole's image): the camera looks along the local
      // meridian, so they lie across the frame and the westward pan slides along them (no strobing)
      float hq = length(p - uPole);
      float hA = lines(hq, uHatch.x, uHatch.x * 0.22);
      float hB = lines(hq, uHatch.y, uHatch.y * 0.22);
      float hatch = mix(hA, hB, uHatch.z);
      vec3 wash = mix(col, ACC_D, 0.3);
      wash = mix(wash, ACC, 0.5 * hatch);
      // the front's edge: a crisp bright line ~2.4 px inside the boundary
      float edge = 1.0 - sstep(fs * 1.6, fs * 3.2, uReach - s);
      wash = mix(wash, ACC, 0.9 * edge);
      col = mix(col, wash, o);
    }
  }

  // V3: distance takes the ground into the air at that distance (near air -> the horizon's)
  col = mix(col, mix(uAirNear, uAirFar, sstep(1.4, 4.2, dist / uD)), haze);
  outColor = vec4(col, 1.0);
}`;

type GLRes = {
  gl: WebGL2RenderingContext;
  prog: WebGLProgram;
  loc: Record<string, WebGLUniformLocation | null>;
  boxes: { e: [number, number, number, number][]; m: [number, number, number, number][] };
};

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`rodentGround: ${src} did not load`));
    im.src = src;
  });

/** a level's tiles stitched into one canvas (each tile's inner TILE x TILE texels) */
const stitch = async (L: RodentLevel) => {
  const c = document.createElement("canvas");
  c.width = L.cols * RODENT_TILE;
  c.height = L.rows * RODENT_TILE;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const jobs: Promise<void>[] = [];
  for (let r = 0; r < L.rows; r++)
    for (let q = 0; q < L.cols; q++) {
      const code = L.cells[r * L.cols + q];
      if (code === "#") {
        jobs.push(
          loadImg(staticFile(`${TILE_DIR}/eurasia-${L.name}-${q}-${r}.png`)).then((im) => {
            ctx.drawImage(im, RODENT_PAD, RODENT_PAD, RODENT_TILE, RODENT_TILE, q * RODENT_TILE, r * RODENT_TILE, RODENT_TILE, RODENT_TILE);
          }),
        );
      } else if (code !== ".") {
        ctx.fillStyle = L.colors[code.charCodeAt(0) - 97];
        ctx.fillRect(q * RODENT_TILE, r * RODENT_TILE, RODENT_TILE, RODENT_TILE);
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
  ctx.fillStyle = "#000";
  ctx.fill(new Path2D(LAKES_D), "nonzero");
  // Iceland: untouched in 1347-51 (reached only in 1402): out of the mask
  const [ix, iy] = project(-18.6, 64.9);
  ctx.beginPath();
  ctx.ellipse(ix, iy, 260, 200, 0, 0, Math.PI * 2);
  ctx.fill();
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
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`rodentGround shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`rodentGround link: ${gl.getProgramInfoLog(prog)}`);
  return prog;
};

const init = async (canvas: HTMLCanvasElement): Promise<GLRes> => {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) throw new Error("rodentGround: no WebGL2 (render with --gl=angle)");
  const prog = compile(gl);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const names = ["uBuf", "uScale", "uC", "uF", "uR", "uU", "uFocal", "uD", "tE0", "tE1", "tE2", "tM0", "tM1", "tMot", "uE0", "uE1", "uE2", "uM0", "uM1", "uB1", "uB2", "uSteppe", "uReach", "uMouth", "uPole", "uPool0", "uPool1", "uPool2", "uPoolOff", "uNear", "tFront", "uG", "uHatch", "uHaze", "uRight", "uAway", "uMotO", "uOrange", "uAirNear", "uAirFar", "uGroundOff", "uSeaNew", "uGMid", "uGLit", "uGDark", "uShadow"];
  const loc: GLRes["loc"] = {};
  for (const n of names) loc[n] = gl.getUniformLocation(prog, n);
  const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const levels = RODENT_LEVELS_EURASIA;
  for (const L of levels) if (L.cols * RODENT_TILE > maxTex || L.rows * RODENT_TILE > maxTex) throw new Error(`rodentGround: level ${L.name} exceeds MAX_TEXTURE_SIZE ${maxTex}`);
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
  const buf32 = await fetch(staticFile(`${TILE_DIR}/front.f32`)).then((r) => {
    if (!r.ok) throw new Error("rodentGround: front.f32 did not load");
    return r.arrayBuffer();
  });
  const fld = new Float32Array(buf32);
  if (fld.length !== FRONT_GRID.cols * FRONT_GRID.rows) throw new Error("rodentGround: front.f32 does not match FRONT_GRID");
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, FRONT_GRID.cols, FRONT_GRID.rows, 0, gl.RED, gl.FLOAT, fld);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  ["tE0", "tE1", "tE2", "tM0", "tM1", "tMot", "tFront"].forEach((n, i) => gl.uniform1i(loc[n], i));
  gl.uniform3f(loc.uG, FRONT_GRID.x0, FRONT_GRID.y0, FRONT_GRID.cell);
  const e = levels.map((L) => [L.x0, L.y0, L.cols * L.tw, L.rows * L.tw] as [number, number, number, number]);
  const m = MASKS.map((q) => [q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0] as [number, number, number, number]);
  return { gl, prog, loc, boxes: { e, m } };
};


export type GroundAir = { near: [number, number, number]; far: [number, number, number] };
const hex01 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
const LAND01 = hex01("#3F3428");
const draw = (R: GLRes, cam: Cam, frame: number, scale: number, air: GroundAir) => {
  const { gl, loc } = R;
  gl.uniform3fv(loc.uAirNear, air.near);
  gl.uniform3fv(loc.uAirFar, air.far);
  const gm = hex01(AIR.A.ground.mid);
  gl.uniform3f(loc.uGroundOff, gm[0] - LAND01[0], gm[1] - LAND01[1], gm[2] - LAND01[2]);
  gl.uniform3fv(loc.uSeaNew, hex01("#2B4545"));
  gl.uniform3fv(loc.uGMid, gm);
  gl.uniform3fv(loc.uGLit, hex01(AIR.A.ground.lit));
  gl.uniform3fv(loc.uGDark, hex01(AIR.A.ground.dark));
  gl.uniform3fv(loc.uShadow, hex01(AIR.A.shadow));
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
  const lv = RODENT_LEVELS_EURASIA;
  gl.uniform2fv(loc.uB1, lv[1].band as [number, number]);
  gl.uniform2fv(loc.uB2, lv[2].band as [number, number]);
  gl.uniform1f(loc.uSteppe, steppeAt(cam.D));
  const reach = reachAt(frame);
  gl.uniform1f(loc.uReach, reach);
  gl.uniform1f(loc.uOrange, reach > Math.min(...POOL_OFF) ? 1 : 0);
  gl.uniform2fv(loc.uMouth, MOUTH);
  gl.uniform2fv(loc.uPole, POLE);
  gl.uniform2fv(loc.uPool0, RIVULETS[0].end);
  gl.uniform2fv(loc.uPool1, RIVULETS[1].end);
  gl.uniform2fv(loc.uPool2, RIVULETS[2].end);
  gl.uniform3f(loc.uPoolOff, POOL_OFF[0], POOL_OFF[1], POOL_OFF[2]);
  gl.uniform3f(loc.uNear, NEAR.r0, NEAR.r1, NEAR.amp);
  // the hatch: ~9 screen px at the target, octaves of 2 crossfaded
  const hl = Math.log2((13 * cam.D) / F);
  const ho = Math.floor(hl);
  gl.uniform4f(loc.uHatch, Math.pow(2, ho), Math.pow(2, ho + 1), hl - ho, 0);
  gl.uniform3f(loc.uHaze, HAZE.a, HAZE.b, HAZE.max);
  gl.uniform2fv(loc.uRight, RIGHT);
  gl.uniform2fv(loc.uAway, AWAY);
  // the mottle tile ~1.1 D wide, octaves of 2
  const ml = Math.log2(cam.D * 1.1);
  const mo = Math.floor(ml);
  gl.uniform2f(loc.uMotO, Math.pow(2, mo), ml - mo);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
};

let SHARED: Promise<GLRes> | null = null;
/** the ground canvas (full frame, under every overlay) */
export const RodentGround: React.FC<{ cam: Cam; frame: number; air: GroundAir }> = ({ cam, frame, air }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [res, setRes] = useState<GLRes | null>(null);
  const [handle] = useState(() => delayRender("rodentGround: building the ground textures", { timeoutInMilliseconds: 240000 }));
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
