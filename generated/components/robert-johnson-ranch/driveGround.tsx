// ---------------------------------------------------------------------------
// driveGround: THE LAND of DriveOutOfAustin (robert-johnson-ranch, cut 6), drawn in WebGL2: every pixel's ray from the
// cut's one camera (driveCamera.ts) is marched onto the real terrain west of Austin (AWS Terrain Tiles z11, baked by
// assets-src/robert-johnson-ranch/bake_drive.py into the local metric frame, relief exaggerated) and painted in the
// style's ground ramp: the baked ground colour (grass, limestone slopes, blackland soil east of the Balcones, water,
// Austin's pale footprint), soft form light from the afternoon sun in the south-west, cream on the lit slopes, cedar
// (Ashe juniper) as a world-space stipple of dark clumps, the two roads (US 290 cream-grey, the ranch road pale
// caliche, uneven, two ruts), each revealed up to its tip, and the distance taking the land into the air.
// Exact perspective and one VP, the same maths as the SVG overlays. RENDER WITH --gl=angle.
// The heights are also kept on the CPU (useDriveHeights) so the overlays can be hidden behind ridges exactly.
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { F, H, W, type Cam } from "./driveCamera";
import { GRID, GRID_O, ROAD_GRID } from "./driveRouteData";

const DIR = "robert-johnson-ranch/drive";

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
out vec4 outColor;
uniform vec2 uBuf;
uniform float uScale;
uniform vec3 uC, uF, uR, uU;
uniform float uFocal, uD;
uniform sampler2D tH, tA, tRd, tH2, tA2;
uniform vec3 uGrid;     // x0, z0, cell (the inner grid, 50 m)
uniform vec2 uGridN;    // nx, nz
uniform vec3 uGrid2;    // the outer grid (150 m, the whole offline DEM)
uniform vec2 uGridN2;
uniform vec3 uRGrid;
uniform vec2 uRGridN;
uniform vec4 uRoad;     // highway width, highway tip, dirt width, dirt tip (m)
uniform vec3 uSun;
uniform vec3 uAirNear, uAirFar;
uniform vec3 uShadow, uCream;

const float HMAX = 1300.0;
const float HMIN = -420.0;
float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// two grids: the inner 50 m window round the route, the outer 150 m grid over the whole offline DEM; the inner one
// fades into the outer over its last 3 km. Past the outer grid the edge texels repeat, but the land is the air there
// (haze below), so nothing past the DEM is ever seen.
float hRaw(ivec2 c) { return texelFetch(tH, clamp(c, ivec2(0), ivec2(uGridN) - 1), 0).r; }
float hRaw2(ivec2 c) { return texelFetch(tH2, clamp(c, ivec2(0), ivec2(uGridN2) - 1), 0).r; }
float boxOut(vec2 p, vec3 g, vec2 n) { vec2 hi = g.xy + n * g.z; return max(max(g.x - p.x, p.x - hi.x), max(g.y - p.y, p.y - hi.y)); }
float innerW(vec2 p) { return sstep(0.0, 3000.0, -boxOut(p, uGrid, uGridN)); }
float heightAt(vec2 p) {
  vec2 g = (p - uGrid2.xy) / uGrid2.z - 0.5;
  vec2 i = floor(g);
  vec2 f = g - i;
  ivec2 c = ivec2(i);
  float h = mix(mix(hRaw2(c), hRaw2(c + ivec2(1, 0)), f.x), mix(hRaw2(c + ivec2(0, 1)), hRaw2(c + ivec2(1, 1)), f.x), f.y);
  float w = innerW(p);
  if (w > 0.0) {
    g = (p - uGrid.xy) / uGrid.z - 0.5;
    i = floor(g);
    f = g - i;
    c = ivec2(i);
    float hi = mix(mix(hRaw(c), hRaw(c + ivec2(1, 0)), f.x), mix(hRaw(c + ivec2(0, 1)), hRaw(c + ivec2(1, 1)), f.x), f.y);
    h = mix(h, hi, w);
  }
  return h;
}
vec4 rRaw(ivec2 c) { c = clamp(c, ivec2(0), ivec2(uRGridN) - 1); return texelFetch(tRd, c, 0); }
vec4 roadAt(vec2 p) {
  vec2 g = (p - uRGrid.xy) / uRGrid.z - 0.5;
  vec2 i = floor(g);
  vec2 f = g - i;
  ivec2 c = ivec2(i);
  vec4 r = mix(mix(rRaw(c), rRaw(c + ivec2(1, 0)), f.x), mix(rRaw(c + ivec2(0, 1)), rRaw(c + ivec2(1, 1)), f.x), f.y);
  vec2 hi = uRGrid.xy + uRGridN * uRGrid.z;
  float o = max(max(uRGrid.x - p.x, p.x - hi.x), max(uRGrid.y - p.y, p.y - hi.y));
  if (o > -uRGrid.z) r.xz = vec2(1e5);
  return r;
}

// THE FINE RELIEF: the DEM is 50 m, so close up its bilinear cells read as smooth blobs while from afar the same
// land reads ridged and eroded. Procedural gullies and crests (ridged value noise, 260 m down to ~6 m) and small
// bumps add relief below the grid, in the shading normal only, each octave faded in by how many pixels its
// wavelength covers: far off they average away, close up they keep the eroded look at every distance.
uint hu(uvec2 q) { uint h = q.x * 1597334677u ^ q.y * 3812015801u; h = (h ^ (h >> 16)) * 2246822519u; h ^= h >> 13; return h; }
float hv(vec2 i) { return float(hu(uvec2(ivec2(i) + 65536)) >> 8) / 16777216.0; }
// value noise with its derivative: (v, dv/dx, dv/dy), v in 0..1
vec3 vnoised(vec2 x) {
  vec2 i = floor(x);
  vec2 f = x - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  float a = hv(i), b = hv(i + vec2(1.0, 0.0)), c = hv(i + vec2(0.0, 1.0)), d = hv(i + vec2(1.0, 1.0));
  float k1 = b - a, k2 = c - a, k4 = a - b - c + d;
  return vec3(a + k1 * u.x + k2 * u.y + k4 * u.x * u.y, du * vec2(k1 + k4 * u.y, k2 + k4 * u.x));
}
// the gradient (dh/dx, dh/dz) of the fine relief at p (world axes: a per-pixel frame would swirl far from the origin);
// st: how steep (0..1), steeper ground gets deeper gullies
vec2 fineGrad(vec2 p, float st, float fp) {
  vec2 g = vec2(0.0);
  float lam = 260.0;
  float amp = 0.08 + 0.09 * sstep(0.04, 0.25, st);
  const mat2 R0 = mat2(0.8, 0.6, -0.6, 0.8);
  mat2 M = mat2(1.0);
  for (int k = 0; k < 6; k++) {
    float w = sstep(2.5, 7.0, lam / fp);
    if (w > 0.0) {
      // octave k lives in q = M p (each turned, so the lines never align); d/dp = (d/dq) M
      vec2 q = M * p;
      // gullies and crests: ridged noise (1 - |2v - 1|)
      vec3 v = vnoised(q / lam + float(k) * 17.3);
      float sg = sign(2.0 * v.x - 1.0);
      g += w * amp * lam * ((-2.0 * sg * v.yz / lam) * M);
      // bumps
      vec3 b = vnoised(q / (0.55 * lam) + float(k) * 5.1 + 40.0);
      g += w * 0.04 * lam * ((b.yz / (0.55 * lam)) * M);
    }
    lam *= 0.48;
    M = R0 * M;
  }
  return g;
}
// fine albedo mottle at the same scales
float fineTone(vec2 p, float fp) {
  float m = 0.0;
  float lam = 120.0;
  for (int k = 0; k < 3; k++) {
    m += sstep(2.0, 6.0, lam / fp) * (vnoised(p / lam + 91.0 + float(k) * 7.0).x - 0.5);
    lam *= 0.42;
  }
  return m;
}

// one octave of the cedar stipple: dark clumps in world-space cells, averaged out when they shrink below a pixel
float cedar(vec2 p, float cs, float rad, float dens, float fp, float seed) {
  vec2 g = p / cs;
  vec2 id = floor(g);
  float best = 0.0;
  for (int dy = -1; dy <= 1; dy++)
    for (int dx = -1; dx <= 1; dx++) {
      vec2 q = id + vec2(dx, dy);
      float hsh = hash2(q + seed);
      if (hsh > dens) continue;
      vec2 ctr = (q + 0.2 + 0.6 * vec2(hash2(q + seed + 3.1), hash2(q + seed + 7.7))) * cs;
      float r = rad * cs * (0.7 + 0.6 * hash2(q + seed + 1.3));
      float d = length(p - ctr);
      best = max(best, 1.0 - sstep(r - fp * 0.8, r + fp * 0.8, d));
    }
  float avg = dens * 3.14159 * rad * rad;
  return mix(avg, best, sstep(0.5, 2.5, rad * cs / fp));
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / uScale;
  float a = (fc.x - ${W / 2}.0) / uFocal;
  float bb = -(fc.y - ${H / 2}.0) / uFocal;
  vec3 dir = normalize(uF + a * uR + bb * uU);
  if (dir.y > -1e-5) { outColor = vec4(0.0); return; }
  float t0 = max(0.0, (uC.y - HMAX) / -dir.y);
  float t1 = (uC.y - HMIN) / -dir.y;
  float tFar = min(t1, uD * 16.0);
  float t = t0;
  float tp = t0;
  bool hit = false;
  for (int i = 0; i < 260; i++) {
    vec3 P = uC + dir * t;
    float dy = P.y - heightAt(P.xz);
    if (dy < 0.0) { hit = true; break; }
    tp = t;
    t += max(dy * 0.5, t * 0.0012);
    if (t > tFar) break;
  }
  float r = t / uD;
  vec3 farAir = mix(uAirNear, uAirFar, sstep(1.4, 5.0, r));
  if (!hit) {
    // past the march: the far land is already the air
    outColor = vec4(uAirFar, 1.0);
    return;
  }
  for (int i = 0; i < 8; i++) {
    float tm = 0.5 * (tp + t);
    vec3 P = uC + dir * tm;
    if (P.y - heightAt(P.xz) < 0.0) t = tm; else tp = tm;
  }
  vec3 P = uC + dir * t;
  vec2 p = P.xz;
  float e = uGrid.z;
  float hC = heightAt(p);
  float hx0 = heightAt(p - vec2(e, 0.0)), hx1 = heightAt(p + vec2(e, 0.0));
  float hz0 = heightAt(p - vec2(0.0, e)), hz1 = heightAt(p + vec2(0.0, e));
  vec3 n0 = normalize(vec3(hx0 - hx1, 2.0 * e, hz0 - hz1));
  // the footprint of a pixel on the ground (m)
  float fp = t / (uFocal * uScale) / max(0.25, dot(n0, -dir));
  // the fine relief below the grid (shading only)
  vec2 slope0 = n0.xz / n0.y;
  vec2 fg = fineGrad(p, 1.0 - n0.y, fp);
  vec3 n = normalize(vec3(slope0.x - fg.x, 1.0, slope0.y - fg.y));
  // the painted ground
  vec2 uv = (p - uGrid.xy) / (uGridN * uGrid.z);
  float lod = max(0.0, log2(fp / uGrid.z) + 0.3);
  vec2 uv2 = (p - uGrid2.xy) / (uGridN2 * uGrid2.z);
  float lod2 = max(0.0, log2(fp / uGrid2.z) + 0.3);
  float wIn = innerW(p);
  vec4 alb = textureLod(tA2, uv2, lod2);
  if (wIn > 0.0) alb = mix(alb, textureLod(tA, uv, lod), wIn);
  vec3 base = alb.rgb * (1.0 + 0.16 * fineTone(p, fp));
  float dens = alb.a;
  // form light: the afternoon sun from the south-west, a soft terminator, the shade sinking toward the shadow colour
  float ndl = dot(n, uSun);
  float sh = sstep(-0.1, 0.95, ndl);
  float shR = sstep(-0.1, 0.95, dot(n0, uSun));
  vec3 lit = base * 1.13;
  vec3 shade = mix(base * 0.58, uShadow, 0.18);
  vec3 col = mix(shade, lit, sh);
  // cream on the slopes that face the sun
  float steep = 1.0 - n.y;
  col = mix(col, uCream, 0.2 * sstep(0.72, 0.97, ndl) * sstep(0.06, 0.22, steep));
  // crests (convex) lift a little, hollows sink: soft ambient occlusion from the curvature
  float lap = (hx0 + hx1 + hz0 + hz1 - 4.0 * hC) / (e * e);
  col *= 1.0 + 0.1 * tanh(-lap * 250.0);
  // cedar: single trees and clumps, darker local colour, lit by the same sun
  float c1 = cedar(p, 38.0, 0.22, dens * 0.9, fp, 11.0);
  float c2 = cedar(p, 90.0, 0.16, dens * 0.5, fp, 37.0);
  float cov = clamp(max(c1, c2 * 0.9), 0.0, 1.0);
  vec3 cedarC = mix(vec3(0.24, 0.245, 0.18), vec3(0.37, 0.38, 0.28), sh);
  col = mix(col, cedarC, cov * 0.5);

  // THE ROADS (dirt first, the highway over it)
  vec4 rd = roadAt(p);
  float aa = fp * 0.9;
  {
    float wD = uRoad.z * (1.0 + 0.1 * sin(rd.w / 170.0) + 0.07 * sin(rd.w / 53.0 + 1.3));
    float dd = rd.w > uRoad.w ? length(vec2(rd.z, rd.w - uRoad.w)) : rd.z;
    float c = 1.0 - sstep(0.5 * wD - aa, 0.5 * wD + aa, dd);
    if (c > 0.0) {
      vec3 dirt = vec3(0.83, 0.785, 0.655);
      // two faint ruts
      float rw = max(0.05 * wD, aa);
      float rut = (1.0 - sstep(rw - aa, rw + aa, abs(rd.z - 0.2 * wD))) * sstep(0.6, 2.0, 0.05 * wD / fp);
      dirt = mix(dirt, vec3(0.66, 0.6, 0.48), 0.35 * rut * (rd.z < 0.3 * wD ? 1.0 : 0.0));
      // a darker trodden edge
      dirt = mix(dirt, vec3(0.62, 0.57, 0.46), 0.5 * sstep(0.32 * wD, 0.5 * wD, dd));
      dirt *= mix(0.86, 1.06, shR);
      col = mix(col, dirt, c);
    }
  }
  {
    float wH = uRoad.x;
    float dd = rd.y > uRoad.y ? length(vec2(rd.x, rd.y - uRoad.y)) : rd.x;
    float c = 1.0 - sstep(0.5 * wH - aa, 0.5 * wH + aa, dd);
    if (c > 0.0) {
      vec3 hw = vec3(0.735, 0.71, 0.645);
      hw = mix(hw, vec3(0.52, 0.49, 0.43), 0.55 * sstep(0.36 * wH, 0.5 * wH, dd));
      hw *= mix(0.84, 1.05, shR);
      col = mix(col, hw, c);
    }
  }

  // distance takes the land into the air
  float hz0v = 0.62 * sstep(1.4, 4.6, r);
  float haze = hz0v + (1.0 - hz0v) * sstep(4.0, 13.0, r);
  // toward the edge of the offline DEM the land goes into the air (fully air AT the edge: nothing past it is seen)
  haze = max(haze, sstep(-30000.0, -2000.0, boxOut(p, uGrid2, uGridN2)));
  col = mix(col, farAir, haze);
  outColor = vec4(col, 1.0);
}`;

type GLRes = { gl: WebGL2RenderingContext; loc: Record<string, WebGLUniformLocation | null> };

/** the heights on the CPU (visual metres, NZ rows north -> south x NX cols west -> east) */
export type Heights = { h: Float32Array; nx: number; nz: number; ho: Float32Array };

const fetchU16 = async (name: string) => {
  const r = await fetch(staticFile(`${DIR}/${name}`));
  if (!r.ok) throw new Error(`driveGround: ${name} did not load`);
  const raw = new Uint8Array(await r.arrayBuffer());
  let bytes = raw;
  if (raw[0] === 0x1f && raw[1] === 0x8b) {
    const ds = new Blob([raw]).stream().pipeThrough(new DecompressionStream("gzip"));
    bytes = new Uint8Array(await new Response(ds).arrayBuffer());
  }
  return new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
};
let HEIGHTS: Promise<Heights> | null = null;
export const loadHeights = () => {
  if (!HEIGHTS) {
    HEIGHTS = Promise.all([fetchU16("height.u16z"), fetchU16("height_o.u16z")]).then(([u, uo]) => {
      if (u.length !== GRID.nx * GRID.nz || uo.length !== GRID_O.nx * GRID_O.nz) throw new Error("driveGround: height grid size mismatch");
      const h = new Float32Array(u.length);
      for (let i = 0; i < u.length; i++) h[i] = u[i] / 10 - 1000;
      const ho = new Float32Array(uo.length);
      for (let i = 0; i < uo.length; i++) ho[i] = uo[i] / 10 - 1000;
      return { h, nx: GRID.nx, nz: GRID.nz, ho };
    });
  }
  return HEIGHTS;
};
/** bilinear height (the shader's exact sampling) */
const bilin = (a: Float32Array, nx: number, nz: number, G: { x0: number; z0: number; cell: number }, x: number, z: number) => {
  const gx = (x - G.x0) / G.cell - 0.5;
  const gz = (z - G.z0) / G.cell - 0.5;
  const i = Math.floor(gx);
  const j = Math.floor(gz);
  const fx = gx - i;
  const fz = gz - j;
  const g = (c: number, r: number) => a[Math.max(0, Math.min(nz - 1, r)) * nx + Math.max(0, Math.min(nx - 1, c))];
  return (g(i, j) * (1 - fx) + g(i + 1, j) * fx) * (1 - fz) + (g(i, j + 1) * (1 - fx) + g(i + 1, j + 1) * fx) * fz;
};
const sst = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const heightOf = (H0: Heights, x: number, z: number) => {
  const ho = bilin(H0.ho, GRID_O.nx, GRID_O.nz, GRID_O, x, z);
  const o = Math.max(GRID.x0 - x, x - (GRID.x0 + GRID.nx * GRID.cell), GRID.z0 - z, z - (GRID.z0 + GRID.nz * GRID.cell));
  const w = sst(0, 3000, -o);
  return w > 0 ? ho + (bilin(H0.h, H0.nx, H0.nz, GRID, x, z) - ho) * w : ho;
};
/** the heights for the overlays (delayRender until loaded) */
export const useDriveHeights = () => {
  const [H0, setH] = useState<Heights | null>(null);
  const [handle] = useState(() => delayRender("driveGround: heights for the overlays", { timeoutInMilliseconds: 120000 }));
  useEffect(() => {
    loadHeights()
      .then((v) => {
        setH(v);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return H0;
};

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`driveGround: ${src} did not load`));
    im.src = src;
  });

const compile = (gl: WebGL2RenderingContext) => {
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type) as WebGLShader;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`driveGround shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`driveGround link: ${gl.getProgramInfoLog(prog)}`);
  return prog;
};

const floatTex = (gl: WebGL2RenderingContext, unit: number, w: number, h: number, data: Float32Array, rgba: boolean) => {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.texImage2D(gl.TEXTURE_2D, 0, rgba ? gl.RGBA32F : gl.R32F, w, h, 0, rgba ? gl.RGBA : gl.RED, gl.FLOAT, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
};

const init = async (canvas: HTMLCanvasElement): Promise<GLRes> => {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) throw new Error("driveGround: no WebGL2 (render with --gl=angle)");
  const prog = compile(gl);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const names = ["uBuf", "uScale", "uC", "uF", "uR", "uU", "uFocal", "uD", "tH", "tA", "tRd", "tH2", "tA2", "uGrid", "uGridN", "uGrid2", "uGridN2", "uRGrid", "uRGridN", "uRoad", "uSun", "uAirNear", "uAirFar", "uShadow", "uCream"];
  const loc: GLRes["loc"] = {};
  for (const n of names) loc[n] = gl.getUniformLocation(prog, n);
  const [Hh, road, alb, alb2] = await Promise.all([loadHeights(), fetchU16("road.u16z"), loadImg(staticFile(`${DIR}/albedo.png`)), loadImg(staticFile(`${DIR}/albedo_o.png`))]);
  floatTex(gl, 0, Hh.nx, Hh.nz, Hh.h, false);
  floatTex(gl, 3, GRID_O.nx, GRID_O.nz, Hh.ho, false);
  const nR = ROAD_GRID.nx * ROAD_GRID.nz;
  if (road.length !== nR * 4) throw new Error("driveGround: road grid size mismatch");
  const rf = new Float32Array(nR * 4);
  for (let i = 0; i < nR; i++) {
    rf[i * 4] = road[i * 4] / ROAD_GRID.distScale;
    rf[i * 4 + 1] = road[i * 4 + 1] * ROAD_GRID.arcScale;
    rf[i * 4 + 2] = road[i * 4 + 2] / ROAD_GRID.distScale;
    rf[i * 4 + 3] = road[i * 4 + 3] * ROAD_GRID.arcScale;
  }
  floatTex(gl, 2, ROAD_GRID.nx, ROAD_GRID.nz, rf, true);
  for (const [unit, img] of [
    [1, alb],
    [4, alb2],
  ] as const) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  gl.uniform1i(loc.tH, 0);
  gl.uniform1i(loc.tA, 1);
  gl.uniform1i(loc.tRd, 2);
  gl.uniform1i(loc.tH2, 3);
  gl.uniform1i(loc.tA2, 4);
  gl.uniform3f(loc.uGrid2, GRID_O.x0, GRID_O.z0, GRID_O.cell);
  gl.uniform2f(loc.uGridN2, GRID_O.nx, GRID_O.nz);
  gl.uniform3f(loc.uGrid, GRID.x0, GRID.z0, GRID.cell);
  gl.uniform2f(loc.uGridN, GRID.nx, GRID.nz);
  gl.uniform3f(loc.uRGrid, ROAD_GRID.x0, ROAD_GRID.z0, ROAD_GRID.cell);
  gl.uniform2f(loc.uRGridN, ROAD_GRID.nx, ROAD_GRID.nz);
  return { gl, loc };
};

/** the sun: afternoon, from the south-west (azimuth 215 deg), 33 deg up; a unit vector toward it */
export const SUN: [number, number, number] = (() => {
  const az = (215 * Math.PI) / 180;
  const el = (33 * Math.PI) / 180;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
})();

export type GroundLook = { airNear: [number, number, number]; airFar: [number, number, number]; road: [number, number, number, number] };
const hex01 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
const draw = (R: GLRes, cam: Cam, scale: number, look: GroundLook) => {
  const { gl, loc } = R;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform2f(loc.uBuf, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform1f(loc.uScale, scale);
  gl.uniform3fv(loc.uC, cam.C);
  gl.uniform3fv(loc.uF, cam.f);
  gl.uniform3fv(loc.uR, cam.r);
  gl.uniform3fv(loc.uU, cam.u);
  gl.uniform1f(loc.uFocal, F);
  gl.uniform1f(loc.uD, cam.D);
  gl.uniform4fv(loc.uRoad, look.road);
  gl.uniform3fv(loc.uSun, SUN);
  gl.uniform3fv(loc.uAirNear, look.airNear);
  gl.uniform3fv(loc.uAirFar, look.airFar);
  gl.uniform3fv(loc.uShadow, hex01("#22180F"));
  gl.uniform3fv(loc.uCream, hex01("#F3EBDD"));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
};

let SHARED: Promise<GLRes> | null = null;
export const DriveGround: React.FC<{ cam: Cam; look: GroundLook }> = ({ cam, look }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [res, setRes] = useState<GLRes | null>(null);
  const [handle] = useState(() => delayRender("driveGround: building the land", { timeoutInMilliseconds: 240000 }));
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
    draw(res, cam, scale, look);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [res, cam, scale, handle, look]);
  return <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};
