import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, StoutStage, bloomFilter, clamp01, lerp, smoothstep } from "./stoutShared";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import { AMBER, ATMO, KEY_LIGHT, MVO_TEX, NIGHT, WATER } from "./marsOceanShared";

// ---------------------------------------------------------------------------
// NoEyesOnIt — Cheeky Pint S4E02 (Will O'Brien, Ulysses), "we've mapped more of Mars than the ocean".
// 1080x1920, 23.976 fps, opaque.
//
// LINE (sequence 00:00:08:07 -> 00:00:13:22): "there's a part of Earth, over 75% of it we have no eyes on,
//   and have no clue really what's down there"
// CHECK LINE: The ocean floor we've actually measured is just thin ship tracks — the rest of the planet's
//   seafloor, most of it, is dark to us.
// DURATION = 135 frames (5.631 s x 23.976) + 12 hold frames as handle = 147.
// ONSETS (f): a 4 · part 6 · of 12 · Earth 17 · over 23 · 75 28 · of 37 · it 46 · we 53 · have 57 · no 61 ·
//   eyes 68 · on 76 · and 80 · have 83 · no 86 · clue 91 · really 102 · what's 110 · down 121 · there 125-130.
//
// THE MOTION (round 4: planet -> darkness -> one ship). We open on the Pacific-facing seafloor globe (lon -150,
// lat -15, 940 px) showing the WHOLE ocean floor in full relief — the GEBCO_2026 shaded relief in one warm sand
// material under the key light, the way a finished map would look; land quiet; it turns and the camera drifts
// in. On "over 75% of it we have no eyes on" (f28 -> ~f74) the dark closes over every UNMEASURED cell: one
// soft front travelling across the planet from its shadow side, basins a little before shelves, its edge
// broken by slow noise. What stays lit is exactly the measured cells (GEBCO TID, area-fraction weighted), the
// same sand with its relief. Then the globe turns the South Pacific round (f56 -> f100) and on "and have no
// clue really what's down there" one damped log-speed push (f80 -> ~f132, x86) goes from the planet down into
// the dark, arriving at a single survey ship (world space all along; it appears as the camera arrives) whose
// amber sonar fan extends its lit swath across a vast dark seafloor; it sails on through the living hold.
// One orthographic projection all the way; three resolutions of the same recoloured data hand off by screen
// density. Land wears the clip's Earth (MarsVsOcean's daymap, MVO_TEX.earth), quietened. Textures:
// scripts/bake-noeyes-textures.py -> public/marsocean/noeyes_*.
// Measured = the GEBCO_2026 TID grid (white = sonar-measured cells). No numbers, no labels.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 147;

export const schema = z.object({
  /** measurement only: the canvas outputs R = measured area fraction x ocean, G = ocean, B = disc (no stage) */
  debugMeasured: z.boolean().default(false),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the data's geometry -----------------------------------------------------------------------------
const D2R = Math.PI / 180;
/** The South Pacific tile: lon -140..-115, lat -20..-45, 4096 px square (px centres at i + 0.5). */
const TILE = { lon0: -140, lat0: -20, span: 25, n: 4096 } as const;
/** The baked close-up window of the tile (tile px) — scripts/bake-noeyes-textures.py CLOSE. */
const CLOSE = { x0: 1340, y0: 920, n: 1280 } as const;
const RAD_PER_TILEPX = (TILE.span / TILE.n) * D2R;
const tileToGeo = (x: number, y: number) => ({ lon: TILE.lon0 + (TILE.span * x) / TILE.n, lat: TILE.lat0 - (TILE.span * y) / TILE.n });

/** THE SWATH: a real multibeam track in the TID grid (fitted centreline y = 0.5077 x + 552.2, ~22 px wide);
 *  its real end (free end) at F; it runs from there to the lower right. The ship sails toward F. */
const F = { x: 1922.5, y: 0.5077 * 1922 + 552.2 + 0.5 };
const U = (() => {
  const l = Math.hypot(1, 0.5077);
  return { x: 1 / l, y: 0.5077 / l };
})();
const SWATH_HALF = 16; // tile px: the strip in which the swath ahead of the ship is not yet measured
const SHIP = {
  s0: 112, // along-track (tile px from F) at frame 0
  len: 20, // hull length, tile px (exaggerated: a real ship is 0.15 px; it shrinks with the map)
  beam: 0.2, // beam / length
};
/** along-track position of the sonar fan (midship), tile px from F; constant speed, reaching F on the last frame */
const shipS = (f: number) => SHIP.s0 * (1 - f / (DURATION - 1));
const alongToTile = (s: number, perp = 0) => ({ x: F.x + U.x * s - U.y * perp, y: F.y + U.y * s + U.x * perp });

// --- projection (marsOceanShared's convention: M = Ry(lon) Rx(-lat), view normal -> body) --------------
type View = { cx: number; cy: number; r: number; lon: number; lat: number };
const viewToBody = (lon: number, lat: number): number[][] => {
  const cy = Math.cos(lon * D2R);
  const sy = Math.sin(lon * D2R);
  const cx = Math.cos(-lat * D2R);
  const sx = Math.sin(-lat * D2R);
  // Ry * Rx
  return [
    [cy, sy * sx, sy * cx],
    [0, cx, -sx],
    [-sy, cy * sx, cy * cx],
  ];
};
const project = (v: View, lon: number, lat: number) => {
  const M = viewToBody(v.lon, v.lat);
  const P = [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)];
  const n = [0, 1, 2].map((j) => M[0][j] * P[0] + M[1][j] * P[1] + M[2][j] * P[2]);
  return { x: v.cx + v.r * n[0], y: v.cy - v.r * n[1], z: n[2] };
};

// --- the camera ----------------------------------------------------------------------------------------
// One damped follower (fieldShared's CAM_STIFF / CAM_DAMP) on each channel; the TARGETS are eased curves
// evaluated per frame (never a few linear keys). lnR is the zoom (R = the globe's radius in screen px).
const R0 = 4.6 / RAD_PER_TILEPX; // the END: 4.6 screen px per tile px (~0.15 km / px), the swath ~100 px wide
const RG0 = 470; // the opening globe: 940 px wide
const RG1 = 505; // ... drifting a little in until the push
const GLOBE_SCREEN = { x: 540, y: 930 };
/** where the camera's seafloor anchor (the ship's place on frame ANCHOR_F) sits at the end: the ship and its
 *  fan sail through y ~900-950 (above the caption bands; the swath on the top edge no longer hugs it) */
const SHIP_SCREEN = { x: 560, y: 925 };
const ease5 = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** the opening globe faces the Pacific: lon -150, lat -15, turning west -> east as Earth turns */
const GLOBE0 = { lon: -150, lat: -15 };
const SPIN = 0.1; // deg per frame
/** THE FLOOD (f28 -> f72, through "over 75% of it we have no eyes on"): the darkness closes over every
 *  unmeasured cell; the front reaches the last of them by ~f74, just before "on" (76). */
export const floodT = (f: number) => clamp01((f - 28) / 46);
/** THE TURN (f56 -> f100): the globe brings the South Pacific (the ship's patch of sea) round to the front */
const turnT = (f: number) => ease5((f - 56) / 44);
/** THE PUSH (f80 -> f132, "and have no clue really what's down there"): one log-speed push from the planet down
 *  to the ship; then the living hold (the ship sails on, its swath growing) */
const pushT = (f: number) => ease5((f - 80) / 52);
/** The camera's end anchor is on the SEAFLOOR, not on the ship: the point the ship reaches on frame ANCHOR_F.
 *  So in the hold the ship visibly sails up-left and the swath visibly lengthens behind it. */
const ANCHOR_F = 138;
const ANCHOR = (() => {
  const t = alongToTile(shipS(ANCHOR_F));
  return tileToGeo(t.x, t.y);
})();
const targets = (f: number) => {
  const pu = pushT(f);
  // ... and in the hold a slow creep in (+6 %) along with the sailing ship, so the last frames keep moving
  const lnR = lerp(Math.log(RG0), Math.log(RG1), clamp01(f / 80)) + Math.log(R0 / RG1) * pu + 0.06 * smoothstep((f - 118) / 40);
  const cx = lerp(GLOBE_SCREEN.x, SHIP_SCREEN.x, pu);
  const cy = lerp(GLOBE_SCREEN.y, SHIP_SCREEN.y, pu);
  // the focus: the turning Pacific -> the ship's anchor (a turn of the globe, done before the push gets close)
  const tu = turnT(f);
  const lon = lerp(GLOBE0.lon - SPIN * f, ANCHOR.lon, tu);
  const lat = lerp(GLOBE0.lat, ANCHOR.lat, tu);
  return { lnR, cx, cy, lon, lat };
};
const damp = (vals: number[][]) => {
  // vals[f][ch]: targets per frame; returns the damped value at the last frame
  const n = vals[0].length;
  const x = vals[0].slice();
  const v = new Array(n).fill(0);
  for (let f = 1; f < vals.length; f++) {
    for (let c = 0; c < n; c++) {
      v[c] += (vals[f][c] - x[c]) * CAM_STIFF - v[c] * CAM_DAMP;
      x[c] += v[c];
    }
  }
  return x;
};
const camCache = new Map<number, View & { shipS: number }>();
export const viewAt = (frame: number): View & { shipS: number } => {
  const hit = camCache.get(frame);
  if (hit) return hit;
  const vals: number[][] = [];
  // the follower starts already moving with the opening spin (no ramp-up stall on frame 0)
  for (let f = -40; f <= frame; f++) {
    const t = targets(f);
    vals.push([t.lnR, t.cx, t.cy, t.lon, t.lat]);
  }
  const [lnR, cx, cy, lon, lat] = damp(vals);
  const out = { cx, cy, r: Math.exp(lnR), lon, lat, shipS: shipS(frame) };
  camCache.set(frame, out);
  return out;
};

// --- textures --------------------------------------------------------------------------------------------
const TEX = [
  "marsocean/noeyes_global_relief_8k.jpg", // 0: R shade, G depth, B land (global, equirect)
  "marsocean/gebco2026_measured_mask_8k.png", // 1: measured (global)
  "marsocean/noeyes_tile_relief_4k.jpg", // 2: the South Pacific tile
  "marsocean/spacific_measured_mask_4k.png", // 3
  "marsocean/noeyes_close_relief.jpg", // 4: the close-up window, x3
  "marsocean/noeyes_close_mask.png", // 5
  MVO_TEX.earth, // 6: the clip's Earth colour (MarsVsOcean's globe): land wears it, quietened, so both cuts are one Earth
] as const;
const imgCache = new Map<string, Promise<HTMLImageElement>>();
const loadImage = (src: string) => {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`NoEyesOnIt: could not load ${src}`));
      img.src = staticFile(src);
    });
    imgCache.set(src, p);
  }
  return p;
};

const hexRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

// --- the shader ------------------------------------------------------------------------------------------
const VS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uGRel, uGMask, uTRel, uTMask, uCRel, uCMask, uEarth;
uniform vec2 uRes, uCenter;
uniform float uR;
uniform mat3 uM;
uniform vec3 uL;
uniform float uTileW, uCloseW, uDebug, uFlood;
uniform vec2 uF, uU;
uniform float uShipS, uSwathHalf;
uniform float uTime;
uniform vec3 uBathyDeep, uBathyMid, uBathyShelf, uDeep, uMid, uDarkest, uLitLo, uLitHi, uAmber, uAmberHot, uLand, uNight, uAtmo;
uniform float uAtmoW, uAtmoA;
out vec4 o;
const float PI = 3.14159265358979;
const float TILE_N = 4096.0;
const vec4 CLOSE = vec4(${CLOSE.x0.toFixed(1)}, ${CLOSE.y0.toFixed(1)}, ${CLOSE.n.toFixed(1)}, 0.0);

float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float feather(vec2 uv, float w) {
  vec2 e = min(uv, 1.0 - uv);
  return smoothstep(0.0, w, min(e.x, e.y));
}
// relief (shade, depth, land) and measured, crisp and soft, from the three sources by weight.
// mW = the measured coverage over a fixed ~8 TILE px footprint: a real swath (~22 px) fills it, a single-beam
// line (1 px) does not, so at close range thin lines stay faint threads and only swaths catch the amber.
void sampleAll(vec2 guv, vec2 ggx, vec2 ggy, vec2 tp, vec2 tgx, vec2 tgy, float soft,
               out vec3 relC, out vec3 relS, out float mC, out float mS, out float mW, out float wT) {
  relC = textureGrad(uGRel, guv, ggx, ggy).rgb;
  relS = textureGrad(uGRel, guv, ggx * soft, ggy * soft).rgb;
  mC = textureGrad(uGMask, guv, ggx, ggy).r;
  mS = textureGrad(uGMask, guv, ggx * 6.0, ggy * 6.0).r;
  mW = 1.0;
  wT = 0.0;
  vec2 tuv = tp / TILE_N;
  if (uTileW > 0.0 && tuv.x > 0.0 && tuv.x < 1.0 && tuv.y > 0.0 && tuv.y < 1.0) {
    float w = uTileW * feather(tuv, 0.06);
    wT = w;
    vec2 gx = tgx / TILE_N, gy = tgy / TILE_N;
    relC = mix(relC, textureGrad(uTRel, tuv, gx, gy).rgb, w);
    relS = mix(relS, textureGrad(uTRel, tuv, gx * soft, gy * soft).rgb, w);
    mC = mix(mC, textureGrad(uTMask, tuv, gx, gy).r, w);
    mS = mix(mS, textureGrad(uTMask, tuv, gx * 6.0, gy * 6.0).r, w);
    mW = mix(mW, textureLod(uTMask, tuv, 3.0).r, w);
    vec2 cuv = (tp - CLOSE.xy) / CLOSE.z;
    if (uCloseW > 0.0 && cuv.x > 0.0 && cuv.x < 1.0 && cuv.y > 0.0 && cuv.y < 1.0) {
      float wc = uCloseW * feather(cuv, 0.12);
      vec2 cgx = tgx / CLOSE.z, cgy = tgy / CLOSE.z;
      relC = mix(relC, textureGrad(uCRel, cuv, cgx, cgy).rgb, wc);
      relS = mix(relS, textureGrad(uCRel, cuv, cgx * soft, cgy * soft).rgb, wc);
      mC = mix(mC, textureGrad(uCMask, cuv, cgx, cgy).r, wc);
      mS = mix(mS, textureGrad(uCMask, cuv, cgx * 6.0, cgy * 6.0).r, wc);
      mW = mix(mW, textureLod(uCMask, cuv, 4.585).r, wc);
    }
  }
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 d = (p - uCenter) / uR;
  d.y = -d.y;
  float rr = length(d);
  float edgePx = (1.0 - rr) * uR;
  float outer = uAtmoW * 4.0 + 2.0;
  if (edgePx < -outer) { o = uDebug > 0.5 ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(0.0); return; }
  vec2 l2 = normalize(uL.xy + 1e-5);
  float sideLit = clamp(dot(normalize(d + 1e-6), l2) * 0.75 + 0.45, 0.0, 1.0);
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
    vec2 guv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
    vec2 ggx = dFdx(guv); vec2 ggy = dFdy(guv);
    ggx.x -= round(ggx.x); ggy.x -= round(ggy.x);
    // tile px (continuous) of this point
    float lonD = lon * 180.0 / PI, latD = lat * 180.0 / PI;
    vec2 tp = vec2((lonD + 140.0) / 25.0 * TILE_N, (-20.0 - latD) / 25.0 * TILE_N);
    vec2 tgx = dFdx(tp), tgy = dFdy(tp);
    // screen px per tile px (for the screen-constant softening of the murk)
    float soft = 9.0; // the murk's softening: ~9 screen px at every zoom
    vec3 relC, relS; float mC, mS, mW, wT;
    sampleAll(guv, ggx, ggy, tp, tgx, tgy, soft, relC, relS, mC, mS, mW, wT);
    // the 8k global mask MAGNIFIED (the end push): it is a binary grid, so its bilinear value is cut at 0.5 with
    // a 1 px antialiased edge: crisp cell edges, the same area (never applied where the finer tile is used)
    float gTexPerPx = max(length(ggx * vec2(8192.0, 4096.0)), length(ggy * vec2(8192.0, 4096.0)));
    float magG = smoothstep(1.0, 0.7, gTexPerPx) * (1.0 - wT);
    float aaw = max(fwidth(mC), 1e-3);
    mC = mix(mC, smoothstep(0.5 - aaw, 0.5 + aaw, mC), magG);

    // the swath ahead of the ship is not measured yet; the fresh swath glows behind the fan
    vec2 q = tp - uF;
    float s = dot(q, uU);
    float perp = abs(q.x * uU.y - q.y * uU.x);
    float strip = smoothstep(uSwathHalf + 1.5, uSwathHalf - 1.5, perp) * smoothstep(-40.0, -30.0, s);
    float aw = max(length(vec2(dot(tgx, uU), dot(tgy, uU))), 0.6);
    float hide = strip * (1.0 - smoothstep(uShipS - aw, uShipS + aw, s));
    mC *= 1.0 - hide;
    mS *= 1.0 - hide;
    float fresh = strip * smoothstep(uShipS - aw, uShipS + aw, s) * exp(-max(s - uShipS, 0.0) / 34.0);

    // MEASURED AMOUNT = the AREA FRACTION of measured cells under this screen px: the mask's mip / box
    // average, linear (no gain, no gamma, no minimum width). A 1 km swath under a 5 km px lights it ~20 %.
    // (The 8k global mask's mean over the tile's region is 0.0904; the 4k tile's is 0.0910: unbiased.)
    float mRaw = clamp(mC, 0.0, 1.0);
    // single-beam lines (1 px of dotted soundings) stay faint threads wherever the finer data can tell them
    // from swaths (~22 px; wide, over a fixed ~8 tile px footprint); soft dots in the close-up
    float wide = smoothstep(0.2, 0.55, mW);
    float m = mix(mix(mRaw, clamp(mS * 1.5, 0.0, 1.0), uCloseW) * 0.4, mRaw, wide);
    m *= smoothstep(0.02, 0.06, m); // a speck of a few stray cells is not a ghost
    float land = smoothstep(0.35, 0.65, relC.b);

    // THE SEAFLOOR MATERIAL, one at every zoom: GEBCO relief under the key light in warm sand (umber shadows ->
    // sand highlights), broad depth as tone (ridges and shelves lighter, basins deeper), finer as we go in
    // (at globe scale the relief is a fraction of a px: its contrast is lifted so ridges, trenches and
    // seamounts still read; broad depth carries the basins)
    float sh = clamp(0.5 + (relC.r - 0.5) * mix(3.2, 1.9, uTileW), 0.0, 1.4);
    vec3 lit = mix(uLitLo, uLitHi, smoothstep(0.05, 0.95, sh)) * (0.8 + 0.35 * sh) * (0.5 + 0.95 * relC.g);
    // THE MURK: a deep, heavy petrol with almost no relief (L* ~19-20 at the subject, never black)
    float depthS = relS.g;
    vec3 murk = mix(uDarkest, uDeep, 0.78 + 0.22 * depthS) * (1.0 + mix(0.12, 0.3, uCloseW) * (relS.r - 0.5));

    // THE FLOOD: over every unmeasured cell the dark closes in, one soft front travelling across the planet
    // from its shadow side (lower right) toward the light, reaching the deep basins a little before the
    // shelves, its edge broken by a slow noise (water closing over, not a wipe). Measured cells stay lit.
    vec2 dirU = dd / max(length(dd), 1e-4) * min(length(dd) * 1.4, 1.0);
    float thr = 0.5 + 0.36 * dot(dirU, l2) + 0.2 * (depthS - 0.35) + 0.16 * (vnoise(b * 4.0) - 0.5) + 0.06 * (vnoise(b * 13.0) - 0.5);
    float fl = smoothstep(thr - 0.07, thr + 0.07, uFlood);
    // what stays lit: the measured fraction (exactly m once the flood has passed)
    float mEff = 1.0 - (1.0 - m) * fl;
    // AFTER the front: what we have SEEN (the measured fraction m) in the warm sand material, the rest murk
    vec3 seen = mix(murk, lit, m);
    // partial coverage keeps the SAND's hue at its honest (lower) lightness: dim sand on dark, not a grey ghost
    float lumS = dot(seen, vec3(0.2126, 0.7152, 0.0722));
    vec3 warm = lit * (lumS / max(dot(lit, vec3(0.2126, 0.7152, 0.0722)), 1e-3));
    seen = mix(seen, warm, smoothstep(0.03, 0.25, m) * (1.0 - smoothstep(0.75, 1.0, m)) * 0.7);
    // BEFORE the front: Earth's whole ocean floor as a bathymetric map: abyssal blue -> lighter teal on ridges
    // and shelves, the GEBCO relief lit by the key light (crisp). The front changes both at once: unmeasured
    // cells sink into the murk, measured cells warm into the sand.
    float shB = clamp(0.5 + (relC.r - 0.5) * mix(3.0, 1.9, uTileW), 0.0, 1.4);
    vec3 bathy = mix(uBathyDeep, uBathyMid, smoothstep(0.0, 0.55, relC.g));
    bathy = mix(bathy, uBathyShelf, smoothstep(0.5, 1.0, relC.g));
    bathy *= 0.62 + 0.62 * shB;
    vec3 sea = mix(bathy, seen, fl);
    // close-up only: the swath's edges catch the amber; the fresh swath still holds the fan's light
    float rim = clamp(m * (1.0 - smoothstep(0.35, 0.95, mS)) * 1.6, 0.0, 1.0) * wide * uCloseW;
    sea = mix(sea, uAmber, rim * 0.25);
    sea = mix(sea, uAmberHot, fresh * m * 0.3);
    // LAND: quiet, a muted earth tone with dim relief
    // the same Earth as MarsVsOcean (its daymap), quietened: desaturated, dimmed, ice held down, GEBCO relief on it
    // ice and snow (bright, unsaturated) take the same earthy tone, so Antarctica is land, not a grey hole
    vec3 day = textureGrad(uEarth, guv, ggx, ggy).rgb;
    float dl = dot(day, vec3(0.2126, 0.7152, 0.0722));
    float dsat = (max(day.r, max(day.g, day.b)) - min(day.r, min(day.g, day.b))) / max(1e-3, max(day.r, max(day.g, day.b)));
    float ice = smoothstep(0.55, 0.8, dl) * (1.0 - smoothstep(0.08, 0.25, dsat));
    // natural Earth (f0): MarsVsOcean's daymap, lightly muted (greens, tans, white ice), GEBCO relief on it
    vec3 nat = mix(vec3(dl), day, 0.85) * 0.92 * (0.86 + 0.5 * (relC.r - 0.5));
    // after the front: a touch quieter (desaturated, dimmed; ice held to a cool pale grey)
    vec3 dq = mix(vec3(dl), day, 0.6);
    dq = dq * (0.62 / max(0.62, dl * 1.15)) * 0.86;
    vec3 quiet = mix(dq, vec3(0.62, 0.62, 0.6), ice * 0.6) * (0.84 + 0.5 * (relC.r - 0.5));
    vec3 earth = mix(nat, quiet, fl);
    vec3 c = mix(sea, earth, land);

    // the sphere's light (marsOceanShared's model): one key from the upper left, soft terminator, warm night
    float ndl = dot(n, normalize(uL));
    float ndl0 = dot(vec3(0.0, 0.0, 1.0), normalize(uL));
    float sft = smoothstep(-0.25, 0.45, ndl);
    float lt = 0.6 + 0.4 * sft * (0.35 + 0.65 * clamp(ndl, 0.0, 1.0)) / (0.35 + 0.65 * ndl0);
    lt /= 0.6 + 0.4 * smoothstep(-0.25, 0.45, ndl0);
    lt = min(lt, 1.0); // faces toward the key never lift the murk above its own tone
    float limb = mix(0.72, 1.0, pow(z, 0.45));
    // the shadow side is a deep warm petrol-brown, never black
    vec3 shaded = c * lt * limb + uNight * 0.3 * (1.0 - sft);
    // what we have seen keeps a little of its own light past the terminator
    c = mix(shaded, c * 0.92, m * (1.0 - land) * 0.3 * (1.0 - sft));
    // atmosphere just inside the limb
    float rimA = pow(1.0 - z, 2.6) * uAtmoA * (0.25 + 0.75 * sideLit) * (0.35 + 0.65 * sft);
    c = mix(c, uAtmo, clamp(rimA, 0.0, 1.0));
    colP = c * cover;
    aP = cover;
    if (uDebug > 0.5) { o = vec4(mEff * (1.0 - land) * cover, (1.0 - land) * cover, mRaw * (1.0 - land) * cover, 1.0); return; }
  }
  vec3 hc = uAtmo * halo;
  o = vec4(colP + hc * (1.0 - aP), aP + halo * (1.0 - aP));
}`;

const UNIFORMS = [
  "uGRel", "uGMask", "uTRel", "uTMask", "uCRel", "uCMask", "uEarth", "uRes", "uCenter", "uR", "uM", "uL", "uTileW", "uCloseW", "uF", "uU",
  "uShipS", "uSwathHalf", "uTime", "uBathyDeep", "uBathyMid", "uBathyShelf", "uDeep", "uMid", "uDarkest", "uLitLo", "uLitHi", "uAmber", "uAmberHot", "uLand", "uNight",
  "uAtmo", "uAtmoW", "uAtmoA", "uDebug", "uFlood",
];
type GLState = { gl: WebGL2RenderingContext; u: Record<string, WebGLUniformLocation | null> };

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const s = gl.createShader(type) as WebGLShader;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`NoEyesOnIt shader: ${gl.getShaderInfoLog(s)}`);
  return s;
};
const initGL = (canvas: HTMLCanvasElement, imgs: HTMLImageElement[]): GLState => {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("NoEyesOnIt: WebGL2 unavailable (render with --gl=angle)");
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (max < 8192) throw new Error(`NoEyesOnIt: MAX_TEXTURE_SIZE ${max} < 8192`);
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`NoEyesOnIt link: ${gl.getProgramInfoLog(prog)}`);
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const global = i <= 1 || i === 6;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, global ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.generateMipmap(gl.TEXTURE_2D);
  });
  const u: GLState["u"] = {};
  for (const nm of UNIFORMS) u[nm] = gl.getUniformLocation(prog, nm);
  return { gl, u };
};

/** Hand-offs by screen density: the close-up window while a tile px is >= ~2 screen px, the tile while a
 *  GLOBAL px (7.2 tile px) is >= ~1.2 screen px. Same recolouring in all three: only the resolution changes. */
const weights = (r: number) => {
  const pxPerTile = r * RAD_PER_TILEPX;
  const closeW = smoothstep((pxPerTile - 1.6) / (2.6 - 1.6));
  const pxPerGlobal = pxPerTile * (8192 / 360) ** -1 * (4096 / 25);
  const tileW = smoothstep((pxPerGlobal - 0.7) / (1.25 - 0.7));
  return { closeW, tileW };
};

const SeafloorGlobe: React.FC<{ v: View & { shipS: number }; time: number; flood: number; debug?: boolean }> = ({ v, time, flood, debug = false }) => {
  const W = 1080;
  const H = 1920;
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<GLState | null>(null);
  const [handle] = useState(() => delayRender("NoEyesOnIt textures", { timeoutInMilliseconds: 240000 }));
  const released = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all(TEX.map(loadImage))
      .then((imgs) => {
        if (!alive || !ref.current) return;
        st.current = initGL(ref.current, imgs);
        setReady(true);
      })
      .catch((e) => cancelRender(e));
    return () => {
      alive = false;
    };
  }, []);
  useLayoutEffect(() => {
    const s = st.current;
    if (!ready || !s) return;
    const { gl, u } = s;
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const M = viewToBody(v.lon, v.lat);
    gl.uniformMatrix3fv(u.uM, false, [M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]);
    ["uGRel", "uGMask", "uTRel", "uTMask", "uCRel", "uCMask", "uEarth"].forEach((nm, i) => gl.uniform1i(u[nm], i));
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uCenter, v.cx, v.cy);
    gl.uniform1f(u.uR, v.r);
    gl.uniform3f(u.uL, KEY_LIGHT[0], KEY_LIGHT[1], KEY_LIGHT[2]);
    const w = weights(v.r);
    gl.uniform1f(u.uTileW, w.tileW);
    gl.uniform1f(u.uCloseW, w.closeW);
    gl.uniform2f(u.uF, F.x, F.y);
    gl.uniform2f(u.uU, U.x, U.y);
    gl.uniform1f(u.uShipS, v.shipS);
    gl.uniform1f(u.uSwathHalf, SWATH_HALF);
    gl.uniform1f(u.uTime, time);
    gl.uniform3f(u.uDeep, ...hexRgb(WATER.deep));
    gl.uniform3f(u.uMid, ...hexRgb(WATER.mid));
    gl.uniform3f(u.uDarkest, ...hexRgb(WATER.darkest));
    gl.uniform3f(u.uLitLo, ...hexRgb(LOOK.litLo));
    gl.uniform3f(u.uLitHi, ...hexRgb(LOOK.litHi));
    gl.uniform3f(u.uAmber, ...hexRgb(AMBER.top));
    gl.uniform3f(u.uAmberHot, ...hexRgb(AMBER.hot));
    gl.uniform3f(u.uLand, ...hexRgb(LOOK.land));
    gl.uniform3f(u.uBathyDeep, ...hexRgb(LOOK.bathyDeep));
    gl.uniform3f(u.uBathyMid, ...hexRgb(LOOK.bathyMid));
    gl.uniform3f(u.uBathyShelf, ...hexRgb(LOOK.bathyShelf));
    gl.uniform3f(u.uNight, ...hexRgb(NIGHT));
    gl.uniform3f(u.uAtmo, ...hexRgb(ATMO.earth.color));
    gl.uniform1f(u.uAtmoW, ATMO.earth.width);
    gl.uniform1f(u.uAtmoA, ATMO.earth.strength);
    gl.uniform1f(u.uDebug, debug ? 1 : 0);
    // the front's threshold spans ~0.15 .. 0.85 across the disc (measured on the sheet): a near-constant-speed sweep, eased only at its ends
    gl.uniform1f(u.uFlood, lerp(0.08, 0.96, 0.65 * flood + 0.35 * smoothstep(flood)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    if (!released.current) {
      released.current = true;
      continueRender(handle);
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

/** This cut's own colours (on top of marsOceanShared's WATER): the measured seafloor's warm light, land. */
const LOOK = {
  litLo: "#5C4631", // the lit seafloor in its own shadow: warm umber
  litHi: "#EED6A8", // ... on its lit faces: warm sand (the close-up's old gold brought down to meet the globe)
  bathyDeep: "#1B4870", // the bathymetric map (f0): abyssal plains and trenches
  bathyMid: "#2C7193", // ... the slopes and rises
  bathyShelf: "#6FB3B0", // ... ridges, seamounts, shelves: lighter teal
  land: "#5E4E3A", // quiet earth, brown (darker than the lit seafloor; never a hole)
  hull: COLOR.cream,
  hullFoot: COLOR.creamFoot,
  deck: "#D9CDB8",
  foam: "#EAF2EE",
} as const;

// --- the ship (SVG, screen px; drawn from world points so it scales and turns with the map) -------------
const Ship: React.FC<{ v: View; frame: number }> = ({ v, frame }) => {
  const sS = shipS(frame);
  const P = (s: number, perp = 0) => {
    const t = alongToTile(s, perp);
    const g = tileToGeo(t.x, t.y);
    return project(v, g.lon, g.lat);
  };
  const mid = P(sS);
  const bow = P(sS - SHIP.len * 0.5);
  const len = Math.hypot(bow.x - mid.x, bow.y - mid.y) * 2; // screen px
  if (len < 0.6 || mid.z <= 0) return null;
  // it shrinks with the map; below a few px it is simply too small to see (no sticker)
  // it is in world space the whole time: sub-px on the globe, it APPEARS by the camera arriving (no fade)
  const vis = 1;
  const ang = (Math.atan2(bow.y - mid.y, bow.x - mid.x) * 180) / Math.PI; // the bow's direction
  const k = len / SHIP.len; // screen px per tile px here
  const fanHalf = 11.5 * k; // the swath's half width: the sonar fan's reach on the seafloor
  const L = len;
  const B = len * SHIP.beam;
  const r = (x: number) => Math.round(x * 1000) / 1000;
  // hull: fine bow, parallel body, square transom (bow at +x)
  const hull = `M ${r(L * 0.5)} 0 C ${r(L * 0.4)} ${r(-B * 0.36)}, ${r(L * 0.26)} ${r(-B * 0.5)}, ${r(L * 0.1)} ${r(-B * 0.5)} L ${r(-L * 0.47)} ${r(-B * 0.5)} Q ${r(-L * 0.5)} ${r(-B * 0.5)}, ${r(-L * 0.5)} ${r(-B * 0.44)} L ${r(-L * 0.5)} ${r(B * 0.44)} Q ${r(-L * 0.5)} ${r(B * 0.5)}, ${r(-L * 0.47)} ${r(B * 0.5)} L ${r(L * 0.1)} ${r(B * 0.5)} C ${r(L * 0.26)} ${r(B * 0.5)}, ${r(L * 0.4)} ${r(B * 0.36)}, ${r(L * 0.5)} 0 Z`;
  const wakeLen = 3.2 * L;
  const kel = Math.tan((19.5 * Math.PI) / 180);
  const sw = Math.max(0.5, B * 0.1);
  const id = "neo";
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, opacity: vis }}>
      <defs>
        <linearGradient id={`${id}fan`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={AMBER.hot} stopOpacity={0.35} />
          <stop offset="0.12" stopColor={AMBER.hot} stopOpacity={1} />
          <stop offset="0.88" stopColor={AMBER.hot} stopOpacity={1} />
          <stop offset="1" stopColor={AMBER.hot} stopOpacity={0.35} />
        </linearGradient>
        <linearGradient id={`${id}spill`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={AMBER.top} stopOpacity={0.4} />
          <stop offset="1" stopColor={AMBER.top} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}wash`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={LOOK.foam} stopOpacity={0.75} />
          <stop offset="0.35" stopColor={LOOK.foam} stopOpacity={0.3} />
          <stop offset="1" stopColor={LOOK.foam} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}arm`} gradientUnits="userSpaceOnUse" x1={r(L * 0.3)} y1="0" x2={r(L * 0.3 - wakeLen)} y2="0">
          <stop offset="0" stopColor={LOOK.foam} stopOpacity={0.7} />
          <stop offset="1" stopColor={LOOK.foam} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={LOOK.hull} />
          <stop offset="1" stopColor={LOOK.hullFoot} />
        </linearGradient>
        <filter id={`${id}soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r(Math.max(0.3, B * 0.08))} />
        </filter>
        <filter id={`${id}sh`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r(Math.max(0.4, B * 0.14))} />
        </filter>
      </defs>
      <g transform={`translate(${r(mid.x)} ${r(mid.y)}) rotate(${r(ang)})`}>
        {/* the sonar fan's light on the seafloor: a line across the track, its warmth spilling behind it */}
        <rect x={r(-L * 0.8)} y={r(-fanHalf)} width={r(L * 0.8)} height={r(fanHalf * 2)} fill={`url(#${id}spill)`} />
        <g style={{ filter: bloomFilter(1) }}>
          <rect x={r(-Math.max(1, k * 0.45))} y={r(-fanHalf)} width={r(Math.max(2, k * 0.9))} height={r(fanHalf * 2)} fill={`url(#${id}fan)`} />
        </g>
        {/* the wake on the surface: the screw's wash astern and the two Kelvin arms */}
        <g filter={`url(#${id}soft)`}>
          <path
            d={`M ${r(-L * 0.5)} ${r(-B * 0.38)} L ${r(-L * 0.5 - wakeLen)} ${r(-B * 0.9)} L ${r(-L * 0.5 - wakeLen)} ${r(B * 0.9)} L ${r(-L * 0.5)} ${r(B * 0.38)} Z`}
            fill={`url(#${id}wash)`}
          />
          <path d={`M ${r(L * 0.3)} ${r(-B * 0.46)} L ${r(L * 0.3 - wakeLen)} ${r(-B * 0.46 - wakeLen * kel)}`} stroke={`url(#${id}arm)`} strokeWidth={r(sw)} fill="none" />
          <path d={`M ${r(L * 0.3)} ${r(B * 0.46)} L ${r(L * 0.3 - wakeLen)} ${r(B * 0.46 + wakeLen * kel)}`} stroke={`url(#${id}arm)`} strokeWidth={r(sw)} fill="none" />
          <path d={`M ${r(L * 0.5)} 0 C ${r(L * 0.42)} ${r(-B * 0.42)}, ${r(L * 0.3)} ${r(-B * 0.62)}, ${r(L * 0.1)} ${r(-B * 0.68)}`} stroke={LOOK.foam} strokeOpacity={0.55} strokeWidth={r(sw)} fill="none" />
          <path d={`M ${r(L * 0.5)} 0 C ${r(L * 0.42)} ${r(B * 0.42)}, ${r(L * 0.3)} ${r(B * 0.62)}, ${r(L * 0.1)} ${r(B * 0.68)}`} stroke={LOOK.foam} strokeOpacity={0.55} strokeWidth={r(sw)} fill="none" />
        </g>
        {/* one key light, upper left: the hull's soft shadow falls down-right */}
        <path d={hull} fill={COLOR.shadow} opacity={0.4} transform={`translate(${r(B * 0.16)} ${r(B * 0.2)})`} filter={`url(#${id}sh)`} />
        <path d={hull} fill={`url(#${id}hull)`} />
        {/* bulwark line, foredeck, bridge (with its window band), funnel, aft working deck + A-frame */}
        <path d={hull} fill="none" stroke={LOOK.hullFoot} strokeWidth={r(Math.max(0.4, B * 0.05))} />
        <rect x={r(L * 0.02)} y={r(-B * 0.36)} width={r(L * 0.22)} height={r(B * 0.72)} rx={r(B * 0.06)} fill="#FFFFFF" />
        <rect x={r(L * 0.215)} y={r(-B * 0.32)} width={r(L * 0.025)} height={r(B * 0.64)} fill={COLOR.inkDark} opacity={0.7} />
        <rect x={r(L * 0.04)} y={r(-B * 0.36)} width={r(L * 0.17)} height={r(B * 0.06)} fill={LOOK.hullFoot} />
        <rect x={r(-L * 0.06)} y={r(-B * 0.14)} width={r(L * 0.07)} height={r(B * 0.28)} rx={r(B * 0.05)} fill={AMBER.foot} />
        <rect x={r(-L * 0.45)} y={r(-B * 0.4)} width={r(L * 0.36)} height={r(B * 0.8)} rx={r(B * 0.04)} fill={LOOK.deck} />
        <path
          d={`M ${r(-L * 0.47)} ${r(-B * 0.36)} L ${r(-L * 0.41)} ${r(-B * 0.36)} L ${r(-L * 0.41)} ${r(B * 0.36)} L ${r(-L * 0.47)} ${r(B * 0.36)}`}
          stroke={COLOR.inkDark}
          strokeOpacity={0.6}
          strokeWidth={r(Math.max(0.4, B * 0.07))}
          fill="none"
        />
        <rect x={r(-L * 0.3)} y={r(-B * 0.22)} width={r(L * 0.1)} height={r(B * 0.18)} fill={COLOR.board} />
      </g>
    </svg>
  );
};

const NoEyesOnIt: React.FC<Props> = ({ debugMeasured }) => {
  const frame = useCurrentFrame();
  const v = viewAt(frame);
  if (debugMeasured) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <SeafloorGlobe v={v} time={frame / FPS} flood={floodT(frame)} debug />
      </AbsoluteFill>
    );
  }
  const cam = { x: 540, y: 960, k: 1 };
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground }}>
      <StoutStage
        S={frame}
        cam={cam}
        pool={{ x: v.cx, y: v.cy, strength: 1 }}
        overlay={
          <>
            <SeafloorGlobe v={v} time={frame / FPS} flood={floodT(frame)} />
            <Ship v={v} frame={frame} />
          </>
        }
      />
    </AbsoluteFill>
  );
};

export default NoEyesOnIt;
