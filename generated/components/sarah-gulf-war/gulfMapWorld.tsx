// ---------------------------------------------------------------------------
// gulfMapWorld: THE GULF MAP WORLD of sarah-gulf-war (Dwarkesh 3D style), built with cut 12 (InvadedKuwaitForOil),
// reused by cut 26. A real baked map of southern Iraq, Kuwait, northern Saudi Arabia and the head of the Persian Gulf
// (gulfMapData.ts + gulfmapLevels*.ts, scripts/maps/configs/gulf.mjs, tiles in public/sarah-gulf-war/gulfmap/) laid as a
// GROUND PLANE inside the teal air, under ONE pinhole camera; small 3D props on it at symbolic map scale. The pattern is
// kyle-rome-industrial/medMapWorld (a WebGL ray cast per pixel onto Y = 0, every SVG overlay projected through the same
// camera, painter's order by depth). RENDER WITH --gl=angle. Read-only for cut 26: changes after MAP_READY keep the old
// exports and are logged in <clip>/animation_source/notes/SHARED_CHANGES.md.
//
// EXPORTS (the pure half lives in gulfMapCore.ts and is re-exported here, unchanged)
//   camera:  W, H, F, type Cam / CamKey3, camFrom(tx, ty, tz, D, pitchDeg, yawDeg), makeTrack(keys, duration),
//            toScreen(cam, X, Y, Zm), groundAt, horizonY, distTo, northYaw, LIGHT, SHADOW_DIR
//   cut 12:  CUT12_KEYS, CUT12_DURATION, cut12Track ({ camAt, path }), CUT12_END_FRAME (173), CUT12_END_CAM (the camera
//            on cut 12's last frame: cut 26 opens on it), CUT12_REST
//   haze:    hazeOf(dist, D), the ground's distance haze (shader and overlays share it)
//   the air: gulfAir(cam, frame, rest) -> { v (AirView for <AirStage>), near, far, fogTo(hex, dist), fogAmt, airHexAt }
//   ground:  <GulfGround cam frame air lit /> (WebGL2): the land a warm sand-umber, the sea a teal-petrol inside the
//            air, a soft cream coast, the Shatt al-Arab, THE OIL FIELDS glowing ORANGE in the ground by `lit` (per field
//            0..1: the glow spreads from the field's heart to its soft rim, litFront), the mottle, the distance haze;
//            transparent above the horizon (AirStage's air shows)
//   fields:  FIELDS (from gulfMapData), FIELD_KEYS, KUWAIT_FIELDS, IRAQ_FIELDS, fieldQ, fieldLitAt(frame) (cut 12's
//            timeline: Kuwait's five light as their tanks roll in; Iraq's stay 0), FIELD_ENTRY, LIT_RAMP, litFront;
//            DERRICKS, derrickRise(d, litOf, frame), derrickItem(cam, air, d, rise, uid) (an oil derrick rising out of the
//            ground as the glow front passes its spot)
//   column:  TANKS (18 TankDef: group, field, path, s0, stop), tankAt(def, frame) -> TankState, V (km per frame),
//            TANK_L, ROAD_PATH, BORDER_S, JAHRA_S, STACK_S / STACK_AT (cut 12's debt stack on the road at Kuwait City),
//            LEAD_STACK_S, leadFrameAt; tankItems(cam, air, pose, uid) + tankShadowItem (an Iraqi tank: low hull,
//            tracks, a turret and gun, muted olive-khaki, nose the way it drives)
//   overlays (ground level, draw before standing things): borderItems(cam, air, key) (world-space dashes),
//            roadItem(cam, air, s0?, s1?), cityDot(cam, air, at, u), <GroundLabel> (Fell SC lying on the ground, its
//            "up" on a fixed bearing; slides up the ground while it fades in), <Billboard> (an upright soft plate with
//            text, facing the camera, anchored at a 3D point), GULF_FONT, INK
//   meshes:  type Face / Item, faceItems, strokeItem, groundShadowItem, paint (far first), boxFacesXf
//   places:  re-exported from gulfMapData (PLACES, ROAD, BORDERS, FIELDS, SHATT, ORIGIN, project)
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { AIR, formTone, makeAirView, mixHex, rgbHex, type AirScene, type AirView, type Mat, type RGB } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BORDERS, FIELDS, MASK_BOX, MASK_LAND_D, ORIGIN, PLACES, ROAD, SHATT, project } from "./gulfMapData";
import { GULFMAP_LEVELS_GULF, GULFMAP_PAD, GULFMAP_TILE, type GulfmapLevel } from "./gulfmapLevels";
import {
  F,
  FIELD_KEYS,
  H,
  LIGHT,
  ROAD_PATH,
  SHADOW_DIR,
  W,
  c01,
  cross,
  distTo,
  dot,
  hazeScale,
  horizonY,
  norm3,
  pointAt,
  sstep,
  sub3,
  toScreen,
  type Cam,
  type Derrick,
  type FieldKey,
  type P2,
  type V3,
} from "./gulfMapCore";

export * from "./gulfMapCore";
export { BORDERS, FIELDS, ORIGIN, PLACES, ROAD, SHATT, project };

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export const GULF_FONT = fellSC;
export const INK = "#E9DDBF";

const PAL = AIR.A;
const f2 = (v: number) => v.toFixed(2);

// ===================================================================================================================
// THE AIR (palette A, mood day): the medium of one frame
// ===================================================================================================================
const AIR_SCENE: AirScene = { look: "A", mood: "day", F, fogNear: 400, fogVis: 3000, fogMax: 0.9, hLow: 0, hHigh: 2600, moteUnit: 320 };
export type GulfAir = { v: AirView; near: RGB; far: RGB; D: number; fogTo: (hex: string, dist: number) => string; fogAmt: (dist: number) => number; airHexAt: (dist: number) => string };
const camOf = (c: Cam) => ({ x: c.C[0], y: c.C[1], z: -c.C[2] });
export const hazeOfCam = (cam: Cam, dist: number) => {
  const r = dist / hazeScale(cam.D);
  const h0 = 0.8 * sstep(1.7, 4.6, r);
  return h0 + (1 - h0) * sstep(3.6, 14, r);
};
export const gulfAir = (cam: Cam, frame: number, rest: Cam): GulfAir => {
  const v = makeAirView({ scene: AIR_SCENE, frame, horizon: horizonY(cam), cam: camOf(cam), rest: camOf(rest) });
  const near = v.airAt(cam.D * 1.5, 0);
  const far = v.airAt(1e9, 0);
  const airAtDist = (dist: number): RGB => {
    const t = sstep(1.4, 4.2, dist / hazeScale(cam.D));
    return [near[0] + (far[0] - near[0]) * t, near[1] + (far[1] - near[1]) * t, near[2] + (far[2] - near[2]) * t];
  };
  const fogAmt = (dist: number) => hazeOfCam(cam, dist);
  const fogTo = (hex: string, dist: number) => mixHex(hex, rgbHex(airAtDist(dist)), fogAmt(dist));
  return { v, near, far, D: cam.D, fogTo, fogAmt, airHexAt: (d) => rgbHex(airAtDist(d)) };
};

// ===================================================================================================================
// THE GROUND (WebGL2)
// ===================================================================================================================
const TILE_DIR = "sarah-gulf-war/gulfmap";
/** the river mask's texels per world px */
const MASK_S = 4;
const NF = FIELD_KEYS.length;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uBuf;
uniform float uScale;
uniform vec3 uC, uF, uR, uU;
uniform float uFocal, uDh;
uniform sampler2D tL0, tL1, tL2, tL3, tRiver, tMot;
uniform vec4 uL0, uL1, uL2, uL3;
uniform vec2 uB1, uB2, uB3;
uniform vec4 uMaskBox;
uniform float uTime;
uniform vec2 uMotO;
uniform vec3 uAirNear, uAirFar, uGroundOff, uSeaNew, uGDark, uShadow, uCream, uRiverCol, uOil, uOilDeep, uOilHot;
uniform vec4 uFA[${NF}];
uniform vec4 uFB[${NF}];
uniform vec4 uFW[${NF}];

const vec3 LAND = vec3(63.0, 52.0, 40.0) / 255.0;
const vec3 SEA = vec3(27.0, 34.0, 38.0) / 255.0;

float sstep(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec3 level(sampler2D t, vec4 box, vec2 p) { return texture(t, (p - box.xy) / box.zw).rgb; }
float inset(vec4 box, vec2 p) {
  vec2 a = p - box.xy;
  vec2 b = box.xy + box.zw - p;
  return min(min(a.x, a.y), min(b.x, b.y));
}
vec3 mapAt(vec2 p, float k) {
  vec3 c = level(tL0, uL0, p);
  float inL0 = sstep(0.0, 60.0, inset(uL0, p));
  float lk = log(k);
  float w1 = sstep(log(uB1.x), log(uB1.y), lk) * sstep(0.0, 40.0, inset(uL1, p) * k);
  c = mix(c, level(tL1, uL1, p), w1);
  float w2 = sstep(log(uB2.x), log(uB2.y), lk) * sstep(0.0, 40.0, inset(uL2, p) * k);
  c = mix(c, level(tL2, uL2, p), w2);
  float w3 = sstep(log(uB3.x), log(uB3.y), lk) * sstep(0.0, 40.0, inset(uL3, p) * k);
  c = mix(c, level(tL3, uL3, p), w3);
  return mix(LAND, c, inL0);
}

void main() {
  vec2 fc = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) / uScale;
  float a = (fc.x - 540.0) / uFocal;
  float bb = -(fc.y - 960.0) / uFocal;
  vec3 dir = uF + a * uR + bb * uU;
  if (dir.y > -1e-6) { outColor = vec4(0.0); return; }
  float t = -uC.y / dir.y;
  vec3 P = uC + t * dir;
  vec2 p = P.xz;
  float dist = t * length(dir);
  float hr = dist / uDh;
  float hz0 = 0.8 * sstep(1.7, 4.6, hr);
  float haze = hz0 + (1.0 - hz0) * sstep(3.6, 14.0, hr);

  float wpp = max(length(dFdx(p)), length(dFdy(p))) * uScale;
  float k = 1.0 / max(wpp, 1e-6);
  vec3 col = mapAt(p, k);
  vec2 ox = dFdx(p) * 0.9;
  vec2 oy = dFdy(p) * 0.9;
  vec3 LUM = vec3(0.3, 0.59, 0.11);
  float ln = sstep(0.42, 0.62, dot(col, LUM));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p + ox, k), LUM)));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p - ox, k), LUM)));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p + oy, k), LUM)));
  ln = max(ln, sstep(0.42, 0.62, dot(mapAt(p - oy, k), LUM)));
  float seaW = 1.0 - sstep(0.03, 0.09, length(col - SEA));
  col = mix(col + uGroundOff + 0.03, uSeaNew + (col - SEA) * 0.85, seaW);
  col = mix(col, vec3(0.95, 0.92, 0.86), ln * 0.6 * (1.0 - sstep(1.7, 4.2, hr)));

  // the Shatt al-Arab
  vec2 mu = (p - uMaskBox.xy) / uMaskBox.zw;
  float inMask = step(0.0, mu.x) * step(mu.x, 1.0) * step(0.0, mu.y) * step(mu.y, 1.0);
  float riv = texture(tRiver, mu).r * inMask;
  col = mix(col, uRiverCol, riv * 0.9);

  // the mottle (world space, two octaves)
  {
    float m0 = texture(tMot, p / uMotO.x).a;
    float m1 = texture(tMot, p / (uMotO.x * 2.0)).a; // no offset: m1 must equal the next octave's m0, or the mottle jumps at each crossing
    float mm = mix(m0, m1, uMotO.y);
    col = mix(col, uShadow, clamp(mm * 0.3, 0.0, 1.0));
  }
  // dune ripples in the desert (world space, warped by the mottle): only near the ground, so the follow reads as travel
  {
    float wn = texture(tMot, p / 11.0 + 0.11).a;
    float rip = 0.5 + 0.5 * sin(dot(p, vec2(0.55, 0.83)) * 1.75 + wn * 7.0);
    rip *= 0.6 + 0.4 * sin(dot(p, vec2(-0.83, 0.55)) * 0.31 + wn * 3.0);
    col = mix(col, uShadow, (1.0 - seaW) * (1.0 - riv) * sstep(8.0, 20.0, k) * rip * 0.085);
  }

  // THE OIL FIELDS: a soft orange glow in the ground, spreading from the field's heart to its rim by lit
  float oilW = 0.0;
  for (int i = 0; i < ${NF}; i++) {
    float lit = uFB[i].z;
    if (lit <= 0.001) continue;
    vec2 d = p - uFA[i].xy;
    vec2 ax = uFA[i].zw;
    vec2 ac = vec2(-ax.y, ax.x);
    float u = dot(d, ax) / uFB[i].x;
    float v = dot(d, ac) / uFB[i].y;
    float rho = length(vec2(u, v));
    if (rho > 2.5) continue;
    float th = atan(v, u);
    vec4 w = uFW[i];
    float wob = 1.0 + 0.1 * sin(2.0 * th + w.x) + 0.07 * sin(3.0 * th + w.y) + 0.045 * sin(5.0 * th + w.z) + 0.025 * sin(7.0 * th + w.w);
    float q = rho / wob;
    float e = clamp(1.3 / uFB[i].y, 0.1, 0.3);
    float inside = 1.0 - sstep(1.0 - e, 1.0 + 0.35 * e, q);
    float front = lit * 1.42;
    float rev = 1.0 - sstep(front - 0.4, front, q);
    float g = inside * rev;
    // the glow's spill round the rim (soft light on the sand), and a hot band at the travelling front
    float halo = (1.0 - sstep(0.95, 2.1, q)) * (1.0 - sstep(front - 0.2, front + 0.15, q)) * 0.4;
    float hot = (1.0 - sstep(0.0, 0.22, abs(q - (front - 0.2)))) * (1.0 - sstep(1.1, 1.3, front)) * inside;
    // well pads: a faint grid of brighter dots, world-anchored (visible up close)
    vec2 gp = p / 2.6;
    vec2 gc = floor(gp);
    vec2 jit = vec2(hash2(gc), hash2(gc + 7.3)) * 0.5 + 0.25;
    float pad = (1.0 - sstep(0.06, 0.13, length(fract(gp) - jit))) * sstep(4.0, 9.0, k);
    float breathe = 0.95 + 0.05 * sin(uTime * 0.07 + float(i) * 1.7);
    vec3 oc = mix(uOil, uOilDeep, sstep(0.25, 1.0, q));
    oc = mix(oc, uOilHot, pad * 0.45 + hot * 0.35);
    col = mix(col, uOilDeep * 0.85 + col * 0.15, halo * lit);
    col = mix(col, oc * breathe, g * 0.94);
    oilW = max(oilW, max(g, halo * lit));
  }

  col = mix(col, mix(uAirNear, uAirFar, sstep(1.4, 4.2, hr)), haze * (1.0 - 0.5 * oilW));
  outColor = vec4(col, 1.0);
}`;

type GLRes = { gl: WebGL2RenderingContext; loc: Record<string, WebGLUniformLocation | null>; boxes: [number, number, number, number][] };

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`gulfMapWorld: ${src} did not load`));
    im.src = src;
  });
const stitch = async (L: GulfmapLevel) => {
  const c = document.createElement("canvas");
  c.width = L.cols * GULFMAP_TILE;
  c.height = L.rows * GULFMAP_TILE;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const jobs: Promise<void>[] = [];
  for (let r = 0; r < L.rows; r++)
    for (let q = 0; q < L.cols; q++) {
      const code = L.cells[r * L.cols + q];
      if (code === "#") {
        jobs.push(
          loadImg(staticFile(`${TILE_DIR}/gulf-${L.name}-${q}-${r}.png`)).then((im) => {
            ctx.drawImage(im, GULFMAP_PAD, GULFMAP_PAD, GULFMAP_TILE, GULFMAP_TILE, q * GULFMAP_TILE, r * GULFMAP_TILE, GULFMAP_TILE, GULFMAP_TILE);
          }),
        );
      } else if (code !== ".") {
        ctx.fillStyle = L.colors[code.charCodeAt(0) - 97];
        ctx.fillRect(q * GULFMAP_TILE, r * GULFMAP_TILE, GULFMAP_TILE, GULFMAP_TILE);
      }
    }
  await Promise.all(jobs);
  return c;
};
/** the Shatt al-Arab as a mask (stroked, clipped to land) */
const riverCanvas = () => {
  const b = MASK_BOX;
  const c = document.createElement("canvas");
  c.width = Math.ceil((b.x1 - b.x0) * MASK_S);
  c.height = Math.ceil((b.y1 - b.y0) * MASK_S);
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.setTransform(MASK_S, 0, 0, MASK_S, -b.x0 * MASK_S, -b.y0 * MASK_S);
  const p = new Path2D();
  (SHATT as P2[]).forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])));
  ctx.strokeStyle = "#fff";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 1.1;
  ctx.stroke(p);
  ctx.globalCompositeOperation = "destination-in";
  ctx.fill(new Path2D(MASK_LAND_D), "evenodd");
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
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`gulfMapWorld shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`gulfMapWorld link: ${gl.getProgramInfoLog(prog)}`);
  return prog;
};
const UNIFORMS = [
  "uBuf", "uScale", "uC", "uF", "uR", "uU", "uFocal", "uDh", "tL0", "tL1", "tL2", "tL3", "tRiver", "tMot", "uL0", "uL1", "uL2", "uL3", "uB1", "uB2", "uB3",
  "uMaskBox", "uTime", "uMotO", "uAirNear", "uAirFar", "uGroundOff", "uSeaNew", "uGDark", "uShadow", "uCream", "uRiverCol", "uOil", "uOilDeep", "uOilHot", "uFA", "uFB", "uFW",
];
const init = async (canvas: HTMLCanvasElement): Promise<GLRes> => {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) throw new Error("gulfMapWorld: no WebGL2 (render with --gl=angle)");
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
  const levels = GULFMAP_LEVELS_GULF;
  if (levels.length !== 4) throw new Error("gulfMapWorld: expects the 4 levels g0..g3");
  for (const L of levels) if (L.cols * GULFMAP_TILE > maxTex || L.rows * GULFMAP_TILE > maxTex) throw new Error(`gulfMapWorld: level ${L.name} exceeds MAX_TEXTURE_SIZE ${maxTex}`);
  const canv = await Promise.all(levels.map(stitch));
  canv.forEach((c, i) => {
    texFrom(gl, i, c, {});
    c.width = 1;
    c.height = 1;
  });
  const rv = riverCanvas();
  texFrom(gl, 4, rv, { mask: true });
  rv.width = 1;
  const mot = await loadImg(staticFile(`${TILE_DIR}/mottle.png`));
  texFrom(gl, 5, mot, { repeat: true });
  ["tL0", "tL1", "tL2", "tL3", "tRiver", "tMot"].forEach((n, i) => gl.uniform1i(loc[n], i));
  const boxes = levels.map((L) => [L.x0, L.y0, L.cols * L.tw, L.rows * L.tw] as [number, number, number, number]);
  return { gl, loc, boxes };
};

const hex01 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
const LAND01 = hex01("#3F3428");
export const SEA_HEX = "#2B4545";
export const OIL = { lit: "#FFB000", deep: "#D98A0C", hot: "#FFD27A" };
export type GroundAir = { near: RGB; far: RGB };
export type Lit = Partial<Record<FieldKey, number>>;
const draw = (R: GLRes, cam: Cam, frame: number, scale: number, air: GroundAir, lit: Lit) => {
  const { gl, loc } = R;
  const lv = GULFMAP_LEVELS_GULF;
  const u3 = (n: string, v: number[]) => gl.uniform3fv(loc[n], v);
  u3("uAirNear", air.near.map((v) => v / 255));
  u3("uAirFar", air.far.map((v) => v / 255));
  const gm = hex01(PAL.ground.mid);
  gl.uniform3f(loc.uGroundOff, gm[0] - LAND01[0], gm[1] - LAND01[1], gm[2] - LAND01[2]);
  u3("uSeaNew", hex01(SEA_HEX));
  u3("uGDark", hex01(PAL.ground.dark));
  u3("uShadow", hex01(PAL.shadow));
  u3("uCream", hex01(PAL.cream));
  u3("uRiverCol", hex01("#3E6662"));
  u3("uOil", hex01(OIL.lit));
  u3("uOilDeep", hex01(OIL.deep));
  u3("uOilHot", hex01(OIL.hot));
  const FA: number[] = [];
  const FB: number[] = [];
  const FW: number[] = [];
  for (const k of FIELD_KEYS) {
    const fd = FIELDS[k];
    FA.push(fd.centre[0], fd.centre[1], fd.axis[0], fd.axis[1]);
    FB.push(fd.a, fd.b, c01(lit[k] ?? 0), 0);
    FW.push(fd.wob[0], fd.wob[1], fd.wob[2], fd.wob[3]);
  }
  gl.uniform4fv(loc.uFA, FA);
  gl.uniform4fv(loc.uFB, FB);
  gl.uniform4fv(loc.uFW, FW);
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform2f(loc.uBuf, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform1f(loc.uScale, scale);
  u3("uC", cam.C);
  u3("uF", cam.f);
  u3("uR", cam.r);
  u3("uU", cam.u);
  gl.uniform1f(loc.uFocal, F);
  gl.uniform1f(loc.uDh, hazeScale(cam.D));
  ["uL0", "uL1", "uL2", "uL3"].forEach((n, i) => gl.uniform4fv(loc[n], R.boxes[i]));
  gl.uniform2fv(loc.uB1, lv[1].band as [number, number]);
  gl.uniform2fv(loc.uB2, lv[2].band as [number, number]);
  gl.uniform2fv(loc.uB3, lv[3].band as [number, number]);
  gl.uniform4f(loc.uMaskBox, MASK_BOX.x0, MASK_BOX.y0, MASK_BOX.x1 - MASK_BOX.x0, MASK_BOX.y1 - MASK_BOX.y0);
  gl.uniform1f(loc.uTime, frame);
  const ml = Math.log2(cam.D * 1.1);
  const mo = Math.floor(ml);
  gl.uniform2f(loc.uMotO, Math.pow(2, mo), ml - mo);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
};

let SHARED: Promise<GLRes> | null = null;
/** the ground canvas (full frame, under every overlay). lit: each oil field's glow 0..1 */
export const GulfGround: React.FC<{ cam: Cam; frame: number; air: GroundAir; lit: Lit }> = ({ cam, frame, air, lit }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [res, setRes] = useState<GLRes | null>(null);
  const [handle] = useState(() => delayRender("gulfMapWorld: building the ground textures", { timeoutInMilliseconds: 240000 }));
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
    draw(res, cam, frame, scale, air, lit);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [res, cam, frame, scale, handle, air, lit]);
  return <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

// ===================================================================================================================
// MESHES: flat-shaded faces projected through the camera, lit from the upper left, fogged; painter items
// ===================================================================================================================
export type Face = { pts: V3[]; mat: Mat; cull?: boolean; flat?: string; line?: boolean; rim?: boolean; bias?: number; op?: number };
export type Item = { z: number; el: React.ReactNode };
export const lineOfMat = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);
const NEAR = 0.15;
/** one face -> its screen path, fill and outline (null when culled or behind the lens) */
const faceDraw = (cam: Cam, air: GulfAir, fc: Face, fogBoost = 0) => {
  const cs = fc.pts.map((q) => {
    const d: V3 = [q[0] - cam.C[0], q[1] - cam.C[1], q[2] - cam.C[2]];
    return [dot(d, cam.r), dot(d, cam.u), dot(d, cam.f)] as V3;
  });
  if (cs.some((c) => c[2] < NEAR)) return null;
  const sc = cs.map((c) => ({ x: W / 2 + (F * c[0]) / c[2], y: H / 2 - (F * c[1]) / c[2] }));
  const n0 = norm3(cross(sub3(fc.pts[1], fc.pts[0]), sub3(fc.pts[2], fc.pts[0])));
  const cen: V3 = [0, 0, 0];
  fc.pts.forEach((q) => {
    cen[0] += q[0] / fc.pts.length;
    cen[1] += q[1] / fc.pts.length;
    cen[2] += q[2] / fc.pts.length;
  });
  const toCam = sub3(cam.C, cen);
  let n = n0;
  if (dot(n0, toCam) < 0) {
    if (fc.cull) return null;
    n = [-n0[0], -n0[1], -n0[2]];
  }
  const dist = Math.hypot(toCam[0], toCam[1], toCam[2]);
  const fogA = c01(air.fogAmt(dist) + fogBoost);
  const base = fc.flat ?? formTone(fc.mat, dot(n, LIGHT), PAL.shadow);
  const a2 = air.airHexAt(dist);
  const fill = mixHex(base, a2, fogA);
  const ln = mixHex(lineOfMat(fc.mat), a2, fogA);
  const d = `M${sc.map((s) => `${f2(s.x)},${f2(s.y)}`).join("L")}Z`;
  const z = dot(sub3(cen, cam.C), cam.f) - (fc.bias ?? 0);
  return { d, fill, ln, z, sc, fogA };
};
/** faces -> painter items (one per visible face) */
export const faceItems = (cam: Cam, air: GulfAir, faces: Face[], uid: string, o: { lw?: number; fogBoost?: number } = {}): Item[] => {
  const out: Item[] = [];
  const lw = o.lw ?? 0.9;
  faces.forEach((fc, i) => {
    const r = faceDraw(cam, air, fc, o.fogBoost);
    if (!r) return;
    out.push({
      z: r.z,
      el: (
        <g key={`${uid}-${i}`} opacity={fc.op ?? 1}>
          <path d={r.d} fill={r.fill} stroke={fc.line === false ? r.fill : r.ln} strokeWidth={fc.line === false ? 0.6 : lw} strokeLinejoin="round" />
          {fc.rim ? <path d={`M${f2(r.sc[0].x)},${f2(r.sc[0].y)}L${f2(r.sc[1].x)},${f2(r.sc[1].y)}`} stroke={PAL.cream} strokeOpacity={0.5 * (1 - r.fogA)} strokeWidth={lw * 1.3} strokeLinecap="round" /> : null}
        </g>
      ),
    });
  });
  return out;
};
/** faces drawn as ONE painter item (an object's own faces sorted far first inside it), at the object's depth z */
export const objectItem = (cam: Cam, air: GulfAir, faces: Face[], uid: string, z: number, o: { lw?: number; fogBoost?: number; extra?: Item[]; op?: number } = {}): Item => {
  const items = [...faceItems(cam, air, faces, uid, o), ...(o.extra ?? [])];
  items.sort((a, b) => b.z - a.z);
  return {
    z,
    el: (
      <g key={uid} opacity={o.op ?? 1}>
        {items.map((q) => q.el)}
      </g>
    ),
  };
};
/** a stroked 3D polyline as one painter item at its mean depth */
export const strokeItem = (cam: Cam, air: GulfAir, pts: V3[], color: string, widthWpx: number, key: string, o: { op?: number; cap?: "round" | "butt"; bias?: number; minPx?: number } = {}): Item | null => {
  const sc = pts.map((q) => toScreen(cam, q[0], q[1], q[2]));
  if (sc.some((s) => s.z < 0.05)) return null;
  const cen = pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length, a[2] + q[2] / pts.length] as V3, [0, 0, 0] as V3);
  const dist = Math.hypot(cen[0] - cam.C[0], cen[1] - cam.C[1], cen[2] - cam.C[2]);
  const s = sc.reduce((a, q) => a + q.s, 0) / sc.length;
  const col = air.fogTo(color, dist);
  const z = dot(sub3(cen, cam.C), cam.f) - (o.bias ?? 0);
  return {
    z,
    el: <path key={key} d={`M${sc.map((q) => `${f2(q.x)},${f2(q.y)}`).join("L")}`} fill="none" stroke={col} strokeWidth={Math.max(o.minPx ?? 0.6, widthWpx * s)} strokeLinecap={o.cap ?? "round"} strokeLinejoin="round" opacity={o.op ?? 1} />,
  };
};
/** a soft shadow ellipse on the ground at (x, y): rx along `ang` (rad from map +x), ry across; offset away from the light */
export const groundShadowItem = (cam: Cam, air: GulfAir, x: number, y: number, rx: number, ry: number, amt: number, key: string, ang = 0, off = 0.3): Item | null =>
  groundBlobItem(cam, air, x, y, rx, ry, amt, key, ang, off, PAL.shadow);
/** a soft ground-hugging blob in any colour (dust behind a moving tank): painted on the ground layer like a shadow */
export const groundBlobItem = (cam: Cam, air: GulfAir, x: number, y: number, rx: number, ry: number, amt: number, key: string, ang = 0, off = 0.3, color: string = PAL.shadow): Item | null => {
  const N = 20;
  const ox = x + SHADOW_DIR[0] * off * Math.max(rx, ry);
  const oy = y + SHADOW_DIR[1] * off * Math.max(rx, ry);
  const pts: P2[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ex = Math.cos(a) * rx;
    const ey = Math.sin(a) * ry;
    const s = toScreen(cam, ox + ex * Math.cos(ang) - ey * Math.sin(ang), 0, oy + ex * Math.sin(ang) + ey * Math.cos(ang));
    if (s.z < 0.05) return null;
    pts.push([s.x, s.y]);
  }
  const c = toScreen(cam, ox, 0, oy);
  const a = amt * (1 - air.fogAmt(distTo(cam, ox, 0, oy)));
  if (a < 0.01) return null;
  const rpx = Math.max(...pts.map((q) => Math.hypot(q[0] - c.x, q[1] - c.y)));
  return {
    z: c.z + 1e6,
    el: (
      <g key={key}>
        <defs>
          <radialGradient id={`${key}-g`} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={f2(rpx)}>
            <stop offset="0" stopColor={color} stopOpacity={0.6 * a} />
            <stop offset="0.55" stopColor={color} stopOpacity={0.34 * a} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={`M${pts.map((q) => `${f2(q[0])},${f2(q[1])}`).join("L")}Z`} fill={`url(#${key}-g)`} />
      </g>
    ),
  };
};
/** painter's order: far first */
export const paint = (items: (Item | null)[]) =>
  items
    .filter((q): q is Item => !!q)
    .sort((a, b) => b.z - a.z)
    .map((q) => q.el);

/** orient a convex solid's faces outward (each face's winding flipped if its normal points at the solid's centre) */
export const orientOut = (fs: Face[]): Face[] => {
  const all = fs.flatMap((f) => f.pts);
  const c: V3 = [0, 0, 0];
  all.forEach((q) => {
    c[0] += q[0] / all.length;
    c[1] += q[1] / all.length;
    c[2] += q[2] / all.length;
  });
  return fs.map((f) => {
    const n = cross(sub3(f.pts[1], f.pts[0]), sub3(f.pts[2], f.pts[0]));
    const m = f.pts.reduce((a, q) => [a[0] + q[0] / f.pts.length, a[1] + q[1] / f.pts.length, a[2] + q[2] / f.pts.length] as V3, [0, 0, 0] as V3);
    return dot(n, sub3(m, c)) < 0 ? { ...f, pts: [...f.pts].reverse() } : f;
  });
};
/** a closed prism in a local frame X(a, b, y) (a forward, b right, y up): a convex a-y profile extruded across b0..b1,
 *  faces oriented outward and back-face culled */
export const prismFaces = (X: (a: number, b: number, y: number) => V3, prof: [number, number][], b0: number, b1: number, mat: Mat, o: { bias?: number } = {}): Face[] => {
  const fs: Face[] = [];
  const n = prof.length;
  fs.push({ pts: prof.map(([a, y]) => X(a, b1, y)), mat, cull: true, bias: o.bias });
  fs.push({ pts: prof.map(([a, y]) => X(a, b0, y)), mat, cull: true, bias: o.bias });
  for (let i = 0; i < n; i++) {
    const [a0, y0] = prof[i];
    const [a1, y1] = prof[(i + 1) % n];
    fs.push({ pts: [X(a0, b0, y0), X(a1, b0, y1), X(a1, b1, y1), X(a0, b1, y0)], mat, cull: true, bias: o.bias });
  }
  return orientOut(fs);
};

// ===================================================================================================================
// THE TANK: an Iraqi tank (a T-72 / T-55 read): long tracks with rounded ends, a low hull with a sloped glacis, a low
// domed turret set back, a long gun. Model units: the hull 1.0 long (TANK_L world px each); a forward, b right, y up.
// ===================================================================================================================
export const TANK_MAT: Mat = { lit: "#9A9774", mid: "#7C7A5A", dark: "#45442F" };
export const TRACK_MAT: Mat = { lit: "#6E6B53", mid: "#545240", dark: "#2E2D22" };
const GUN_MAT: Mat = { lit: "#8E8C68", mid: "#6A684C", dark: "#3A392A" };
export type TankPose = { at: P2; heading: number; scale: number; bob?: number; recoil?: number };
const tankXf = (o: TankPose) => {
  const fw: P2 = [Math.sin(o.heading), -Math.cos(o.heading)];
  const rt: P2 = [Math.cos(o.heading), Math.sin(o.heading)];
  const s = o.scale;
  const bob = o.bob ?? 0;
  return (a: number, b: number, y: number): V3 => [o.at[0] + (fw[0] * a + rt[0] * b) * s, (y + (y > 0.05 ? bob : 0)) * s, o.at[1] + (fw[1] * a + rt[1] * b) * s];
};
/** the muzzle's reach ahead of the tank's centre, in model units */
export const TANK_MUZZLE = 0.66;
export const tankFaces = (o: TankPose) => {
  const X = tankXf(o);
  const tracks: Face[] = [];
  const trackProf: [number, number][] = [
    [0.52, 0.035],
    [0.47, 0.115],
    [-0.47, 0.115],
    [-0.52, 0.04],
    [-0.47, 0.0],
    [0.47, 0.0],
  ];
  tracks.push(...prismFaces(X, trackProf, -0.29, -0.18, TRACK_MAT), ...prismFaces(X, trackProf, 0.18, 0.29, TRACK_MAT));
  const hullProf: [number, number][] = [
    [0.5, 0.1],
    [0.36, 0.175],
    [-0.47, 0.18],
    [-0.5, 0.1],
  ];
  const hull = prismFaces(X, hullProf, -0.27, 0.27, TANK_MAT);
  // the turret: a low dome as an octagonal frustum, set back of centre
  const tc: [number, number] = [-0.07, 0];
  const turret: Face[] = [];
  const N = 8;
  const r0 = 0.19;
  const r1 = 0.13;
  const y0 = 0.175;
  const y1 = 0.27;
  const ring = (r: number, y: number) => Array.from({ length: N }, (_, i) => {
    const t = ((i + 0.5) / N) * Math.PI * 2;
    return X(tc[0] + Math.cos(t) * r * 1.08, tc[1] + Math.sin(t) * r, y);
  });
  const lo = ring(r0, y0);
  const hi = ring(r1, y1);
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    turret.push({ pts: [lo[i], lo[j], hi[j], hi[i]], mat: TANK_MAT, cull: true });
  }
  turret.push({ pts: [...hi], mat: TANK_MAT, cull: true });
  turret.push({ pts: [...lo], mat: TANK_MAT, cull: true });
  const turretO = orientOut(turret);
  // the gun: a slim box from the turret's front to the muzzle
  const gy = 0.225;
  const gw = 0.022;
  const g0 = tc[0] + 0.15;
  const g1 = tc[0] + TANK_MUZZLE + 0.07 - (o.recoil ?? 0);
  const gun = prismFaces(
    X,
    [
      [g1, gy - gw],
      [g1, gy + gw],
      [g0, gy + gw * 1.3],
      [g0, gy - gw * 1.3],
    ],
    -gw,
    gw,
    GUN_MAT,
  );
  return { tracks, hull, turret: turretO, gun, X };
};
/** a tank as ONE painter item (layered: tracks, hull, then gun / turret in the order the view needs) */
export const tankItems = (cam: Cam, air: GulfAir, o: TankPose, uid: string, lw = 0.8): Item => {
  const t = tankFaces(o);
  const fw: V3 = [Math.sin(o.heading), 0, -Math.cos(o.heading)];
  const away = dot(fw, cam.f) > 0;
  const layer = (fs: Face[], key: string) => faceItems(cam, air, fs, `${uid}-${key}`, { lw }).sort((a, b) => b.z - a.z).map((q) => q.el);
  const c = t.X(0, 0, 0.12);
  const z = dot(sub3(c, cam.C), cam.f);
  return {
    z,
    el: (
      <g key={uid}>
        {layer(t.tracks, "tr")}
        {layer(t.hull, "hl")}
        {away ? layer(t.gun, "gn") : null}
        {layer(t.turret, "tu")}
        {away ? null : layer(t.gun, "gn")}
      </g>
    ),
  };
};
/** the tank's soft contact shadow */
export const tankShadowItem = (cam: Cam, air: GulfAir, o: TankPose, uid: string, amt = 0.85): Item | null => {
  const ang = o.heading - Math.PI / 2;
  return groundShadowItem(cam, air, o.at[0], o.at[1], 0.62 * o.scale, 0.36 * o.scale, amt, `${uid}-sh`, ang, 0.22);
};

// ===================================================================================================================
// THE DERRICK: a lattice oil derrick (four legs tapering to a crown, girts), dark iron against the glowing field.
// It RISES out of the ground (clipped at Y = 0), never fades in. DERRICK_SCALE world px per model unit (tower 1 tall).
// ===================================================================================================================
export const DERRICK_SCALE = 5.2;
const IRON = "#4A4236";
const IRON_LIT = "#8A7E68";
/** clip a 3D segment to Y >= 0 (null if wholly below) */
const clipY = (a: V3, b: V3): [V3, V3] | null => {
  if (a[1] < 0 && b[1] < 0) return null;
  if (a[1] >= 0 && b[1] >= 0) return [a, b];
  const t = a[1] / (a[1] - b[1]);
  const m: V3 = [a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t];
  return a[1] < 0 ? [m, b] : [a, m];
};
export const derrickItem = (cam: Cam, air: GulfAir, d: Derrick, rise: number, uid: string, scale = DERRICK_SCALE): Item | null => {
  if (rise <= 0) return null;
  const s = scale;
  const sink = (1 - rise) * 1.04;
  const P = (a: number, b: number, y: number): V3 => [d.at[0] + a * s, (y - sink) * s, d.at[1] + b * s];
  const half = (y: number) => 0.17 * (1 - y) + 0.03 * y;
  const legs: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
  const segs: { a: V3; b: V3; lit: boolean; w: number }[] = [];
  // the legs (the two toward the light lit)
  legs.forEach(([i, j]) => {
    const lit = i * LIGHT[0] + j * LIGHT[2] > 0;
    segs.push({ a: P(i * half(0), j * half(0), 0), b: P(i * half(1), j * half(1), 1), lit, w: 0.022 });
  });
  // girts and a few cross braces
  for (const y of [0.22, 0.44, 0.64, 0.82]) {
    const h = half(y);
    for (let q = 0; q < 4; q++) {
      const [i0, j0] = legs[q];
      const [i1, j1] = legs[(q + 1) % 4];
      segs.push({ a: P(i0 * h, j0 * h, y), b: P(i1 * h, j1 * h, y), lit: false, w: 0.012 });
    }
  }
  for (const [ya, yb] of [
    [0, 0.22],
    [0.22, 0.44],
    [0.44, 0.64],
  ] as [number, number][]) {
    const ha = half(ya);
    const hb = half(yb);
    for (let q = 0; q < 4; q++) {
      const [i0, j0] = legs[q];
      const [i1, j1] = legs[(q + 1) % 4];
      segs.push({ a: P(i0 * ha, j0 * ha, ya), b: P(i1 * hb, j1 * hb, yb), lit: false, w: 0.009 });
    }
  }
  // the crown block
  segs.push({ a: P(-0.06, 0, 1.02), b: P(0.06, 0, 1.02), lit: true, w: 0.035 });
  const base = P(0, 0, 0.45);
  const dist = distTo(cam, base[0], Math.max(0, base[1]), base[2]);
  const fogA = air.fogAmt(dist);
  const els: React.ReactNode[] = [];
  segs.forEach((g, i) => {
    const c = clipY(g.a, g.b);
    if (!c) return;
    const A = toScreen(cam, ...c[0]);
    const B = toScreen(cam, ...c[1]);
    if (A.z < 0.05 || B.z < 0.05) return;
    const col = mixHex(g.lit ? IRON_LIT : IRON, air.airHexAt(dist), fogA);
    els.push(<path key={i} d={`M${f2(A.x)},${f2(A.y)}L${f2(B.x)},${f2(B.y)}`} stroke={col} strokeWidth={Math.max(g.lit ? 1.5 : 0.9, g.w * s * (A.s + B.s) * 0.5)} strokeLinecap="round" />);
  });
  const c = toScreen(cam, d.at[0], 0, d.at[1]);
  return { z: c.z - 0.3 * s, el: <g key={uid}>{els}</g> };
};
export const derrickShadowItem = (cam: Cam, air: GulfAir, d: Derrick, rise: number, uid: string, scale = DERRICK_SCALE): Item | null =>
  rise <= 0 ? null : groundShadowItem(cam, air, d.at[0], d.at[1], 0.3 * scale, 0.24 * scale, 0.75 * c01(rise * 2), `${uid}-sh`, 0, 0.35);

// ===================================================================================================================
// GROUND OVERLAYS: borders (world-space dashes), the road, a city dot
// ===================================================================================================================
/** a polyline on the ground as world-space dashes (dash, gap in world px), each dash a projected segment */
const dashItems = (cam: Cam, air: GulfAir, line: P2[], dash: number, gap: number, w: number, color: string, halo: string, key: string, op = 1): Item | null => {
  const path = { pts: line, cum: [0] as number[], len: 0 };
  for (let i = 1; i < line.length; i++) path.cum.push(path.cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  path.len = path.cum[path.cum.length - 1];
  const els: React.ReactNode[] = [];
  const hel: React.ReactNode[] = [];
  let zs = 0;
  let n = 0;
  for (let s = 0; s < path.len; s += dash + gap) {
    const pts: P2[] = [];
    for (let k = 0; k <= 4; k++) {
      const q = pointAt(path, Math.min(path.len, s + (dash * k) / 4));
      pts.push(q);
    }
    const sc = pts.map((q) => toScreen(cam, q[0], 0, q[1]));
    if (sc.some((q) => q.z < 0.05)) continue;
    if (sc.every((q) => q.x < -60 || q.x > W + 60 || q.y < -60 || q.y > H + 60)) continue;
    const m = pts[2];
    const dist = distTo(cam, m[0], 0, m[1]);
    const fa = air.fogAmt(dist);
    if (fa > 0.97) continue;
    const px = Math.max(1.2, w * sc[2].s);
    const d = `M${sc.map((q) => `${f2(q.x)},${f2(q.y)}`).join("L")}`;
    hel.push(<path key={`h${s}`} d={d} stroke={mixHex(halo, air.airHexAt(dist), fa)} strokeOpacity={0.55 * op * (1 - fa)} strokeWidth={px * 2.4} strokeLinecap="round" fill="none" />);
    els.push(<path key={`d${s}`} d={d} stroke={mixHex(color, air.airHexAt(dist), fa)} strokeOpacity={op * (1 - 0.5 * fa)} strokeWidth={px} strokeLinecap="round" fill="none" />);
    zs += sc[2].z;
    n++;
  }
  if (!n) return null;
  return {
    z: zs / n + 2e6,
    el: (
      <g key={key}>
        {hel}
        {els}
      </g>
    ),
  };
};
export type BorderKey = keyof typeof BORDERS;
/** a modern border as cream world-space dashes with a soft dark halo (ground level) */
export const borderItems = (cam: Cam, air: GulfAir, key: BorderKey, o: { w?: number; dash?: number; gap?: number; op?: number } = {}): Item[] =>
  (BORDERS[key] as P2[][]).map((line, i) => dashItems(cam, air, line, o.dash ?? 2.4, o.gap ?? 1.6, o.w ?? 0.22, INK, PAL.shadow, `bd-${key}-${i}`, o.op ?? 0.9)).filter((q): q is Item => !!q);

/** the road (Basra -> Kuwait City) as a pale track on the sand, s0..s1 arclength on ROAD_PATH */
export const roadItem = (cam: Cam, air: GulfAir, o: { s0?: number; s1?: number; w?: number; op?: number } = {}): Item | null => {
  const s0 = o.s0 ?? 0;
  const s1 = o.s1 ?? ROAD_PATH.len;
  const w = o.w ?? 0.42;
  const els: React.ReactNode[] = [];
  const STEP = 3;
  let zs = 0;
  let n = 0;
  for (let s = s0; s < s1; s += STEP) {
    const pts: P2[] = [];
    for (let k = 0; k <= 3; k++) pts.push(pointAt(ROAD_PATH, Math.min(s1, s + ((STEP + 0.3) * k) / 3)));
    const sc = pts.map((q) => toScreen(cam, q[0], 0, q[1]));
    if (sc.some((q) => q.z < 0.05)) continue;
    if (sc.every((q) => q.x < -60 || q.x > W + 60 || q.y < -60 || q.y > H + 60)) continue;
    const dist = distTo(cam, pts[1][0], 0, pts[1][1]);
    const fa = air.fogAmt(dist);
    const d = `M${sc.map((q) => `${f2(q.x)},${f2(q.y)}`).join("L")}`;
    const px = Math.max(0.9, w * sc[1].s);
    els.push(<path key={s} d={d} stroke={mixHex("#B9A780", air.airHexAt(dist), fa)} strokeOpacity={(o.op ?? 0.5) * (1 - fa)} strokeWidth={px} strokeLinecap="butt" fill="none" />);
    zs += sc[1].z;
    n++;
  }
  if (!n) return null;
  return { z: zs / n + 3e6, el: <g key="road">{els}</g> };
};

/** a city on the map: a cream dot with a dark ring, lying on the ground (r world px); u 0..1 its presence */
export const cityDot = (cam: Cam, air: GulfAir, at: P2, r: number, key: string): Item | null => {
  const ring = (rr: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const s = toScreen(cam, at[0] + Math.cos(a) * rr, 0, at[1] + Math.sin(a) * rr);
      if (s.z < 0.05) return null;
      pts.push(`${f2(s.x)},${f2(s.y)}`);
    }
    return `M${pts.join("L")}Z`;
  };
  const o = ring(r * 1.45);
  const i = ring(r);
  if (!o || !i) return null;
  const dist = distTo(cam, at[0], 0, at[1]);
  const fa = air.fogAmt(dist);
  const c = toScreen(cam, at[0], 0, at[1]);
  return {
    z: c.z + 1.5e6,
    el: (
      <g key={key}>
        <path d={o} fill={mixHex(PAL.shadow, air.airHexAt(dist), fa)} fillOpacity={0.75} />
        <path d={i} fill={mixHex(INK, air.airHexAt(dist), fa)} />
      </g>
    ),
  };
};

// ===================================================================================================================
// LABELS
// ===================================================================================================================
/** map type lying on the ground: Fell SC caps, cream with a dark halo; its "up" points along `up` (deg bearing, 180 =
 *  south, for a camera looking south); slides `slide` screen px up the ground while it fades in (u 0..1) */
export const GroundLabel: React.FC<{ cam: Cam; text: string; at: P2; cap: number; u: number; up?: number; slide?: number; air?: GulfAir; track?: number; plate?: number; op?: number }> = ({
  cam,
  text,
  at,
  cap,
  u,
  up = 180,
  slide = 26,
  air,
  track = 0.18,
  plate = 0,
  op: opMul = 1,
}) => {
  if (u <= 0) return null;
  const ease = 1 - Math.pow(1 - c01(u), 3);
  const op = c01(u * 2.2) * opMul;
  const ny = (up * Math.PI) / 180;
  const E: P2 = [Math.cos(ny), Math.sin(ny)];
  const N: P2 = [Math.sin(ny), -Math.cos(ny)];
  const J = (p: P2) => {
    const s0 = toScreen(cam, p[0], 0, p[1]);
    const e = 0.5;
    const se = toScreen(cam, p[0] + E[0] * e, 0, p[1] + E[1] * e);
    const sn = toScreen(cam, p[0] + N[0] * e, 0, p[1] + N[1] * e);
    return { p: [s0.x, s0.y] as P2, de: [(se.x - s0.x) / e, (se.y - s0.y) / e] as P2, dn: [(sn.x - s0.x) / e, (sn.y - s0.y) / e] as P2, z: s0.z };
  };
  const J0 = J(at);
  if (J0.z < 0.05) return null;
  const back = slide / Math.max(1e-3, Math.hypot(J0.dn[0], J0.dn[1]));
  const anchor: P2 = [at[0] - N[0] * back * (1 - ease), at[1] - N[1] * back * (1 - ease)];
  const Jt = J(anchor);
  const FS = 100;
  const k = cap / (FS * 0.66);
  const m = [Jt.de[0] * k, Jt.de[1] * k, -Jt.dn[0] * k, -Jt.dn[1] * k, Jt.p[0], Jt.p[1]];
  if (m.some((v) => !Number.isFinite(v))) return null;
  const dist = distTo(cam, at[0], 0, at[1]);
  const fogA = air ? air.fogAmt(dist) : 0;
  const ink = air ? air.fogTo(INK, dist) : INK;
  const pid = `gl-${text.replace(/[^A-Za-z0-9]/g, "")}-plate`;
  return (
    <g transform={`matrix(${m.map((v) => v.toFixed(5)).join(",")})`} opacity={op * (1 - 0.6 * fogA)}>
      {plate > 0 ? (
        <g>
          <defs>
            <radialGradient id={pid}>
              <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.5 * plate} />
              <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.36 * plate} />
              <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={0} cy={0} rx={text.length * (0.72 + track) * FS * 0.62} ry={FS * 0.82} fill={`url(#${pid})`} />
        </g>
      ) : null}
      <text
        x={0}
        y={FS * 0.33}
        textAnchor="middle"
        fill={ink}
        stroke={PAL.line}
        strokeOpacity={plate > 0 ? 0.95 : 0.8}
        strokeWidth={FS * (plate > 0 ? 0.19 : 0.15)}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: FS, letterSpacing: `${track * FS}px` }}
      >
        {text}
      </text>
    </g>
  );
};

/** an upright soft plate facing the lens, anchored (bottom centre) at a 3D point; lines of text (Fell SC); cap in world
 *  px for the first line; u 0..1 slides it up while it fades in */
export const Billboard: React.FC<{ cam: Cam; air: GulfAir; at: V3; lines: { text: string; cap: number; color?: string }[]; u: number; op?: number; slide?: number; padX?: number }> = ({ cam, air, at, lines, u, op = 1, slide = 24, padX = 0.55 }) => {
  if (u <= 0 || op <= 0) return null;
  const s0 = toScreen(cam, at[0], at[1], at[2]);
  if (s0.z < 0.05) return null;
  const ease = 1 - Math.pow(1 - c01(u), 3);
  const sc = s0.s;
  const FS = 100;
  const gapF = 0.36;
  const hs = lines.map((l) => (l.cap / 0.66) * sc);
  const totalH = hs.reduce((a, h) => a + h, 0) + hs.slice(1).reduce((a, h) => a + h * gapF, 0);
  const wide = Math.max(...lines.map((l, i) => l.text.length * 0.66 * hs[i]));
  const pw = wide + 2 * padX * hs[0];
  const ph = totalH + 1.05 * hs[0];
  const x = s0.x;
  const yBot = s0.y + slide * (1 - ease);
  const dist = distTo(cam, at[0], at[1], at[2]);
  const fa = air.fogAmt(dist);
  let yy = yBot - ph + 0.52 * hs[0];
  return (
    <g opacity={c01(u * 2) * op * (1 - 0.6 * fa)}>
      <rect x={f2(x - pw / 2)} y={f2(yBot - ph)} width={f2(pw)} height={f2(ph)} rx={f2(0.34 * hs[0])} fill={PAL.shadow} fillOpacity={0.62} />
      <rect x={f2(x - pw / 2 + 0.06 * hs[0])} y={f2(yBot - ph + 0.06 * hs[0])} width={f2(pw - 0.12 * hs[0])} height={f2(ph - 0.12 * hs[0])} rx={f2(0.3 * hs[0])} fill="none" stroke={PAL.cream} strokeOpacity={0.22} strokeWidth={Math.max(0.8, 0.03 * hs[0])} />
      {lines.map((l, i) => {
        const h = hs[i];
        if (i > 0) yy += hs[i - 1] * 0 + h * gapF;
        const y = yy + h * 0.66;
        yy += h;
        return (
          <text key={i} x={f2(x)} y={f2(y)} textAnchor="middle" fill={mixHex(l.color ?? INK, air.airHexAt(dist), fa)} style={{ fontFamily: fellSC, fontSize: (h / 1) * (FS / 100), letterSpacing: `${0.06 * h}px` }}>
            {l.text}
          </text>
        );
      })}
    </g>
  );
};
