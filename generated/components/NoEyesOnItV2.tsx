import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, StoutStage, bloomFilter, clamp01, lerp, smoothstep } from "./stoutShared";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import { AMBER, ATMO, KEY_LIGHT, MVO_TEX, NIGHT, WATER } from "./marsOceanShared";

// ---------------------------------------------------------------------------
// NoEyesOnItV2 (improvement loop on the delivered NoEyesOnIt; same 147 f, same words) — Cheeky Pint S4E02 (Will O'Brien, Ulysses), "we've mapped more of Mars than the ocean".
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
const CLOSE = { x0: 2515, y0: 2539, n: 1280 } as const; // scripts/bake-noeyes2-textures.py
const RAD_PER_TILEPX = (TILE.span / TILE.n) * D2R;
const tileToGeo = (x: number, y: number) => ({ lon: TILE.lon0 + (TILE.span * x) / TILE.n, lat: TILE.lat0 - (TILE.span * y) / TILE.n });

/** THE SITE (V2): a real track end (a single-beam line, GEBCO_2026 TID) inside the emptiest stretch of the tile:
 *  1.4 % measured within ~400 km (scratch void search over every track end). The ship sails on from it, straight
 *  out into the unmeasured dark, its fan painting a NEW strip (a live survey: that strip is not in the grid yet). */
const F = { x: 3311.5, y: 3278.5 };
const U = (() => {
  const l = Math.hypot(0.844, 0.536);
  return { x: -0.844 / l, y: -0.536 / l }; // into the void (tile px axes: x east, y south)
})();
const SWATH_HALF = 11.5; // tile px: the fan's half reach on the floor = the painted strip's half width
const SHIP = {
  v: 0.85, // tile px per frame (constant)
  start: -90, // the frame it left the track end (before the cut): the strip behind it is ~200 px long at the end
  len: 46, // hull length, world units (exaggerated: a real ship is 0.15; it shrinks with the map)
  beam: 0.2, // beam / length
};
/** along-track position of the fan (midship), tile px from F along U */
const shipS = (f: number) => SHIP.v * (f - SHIP.start);
const alongToTile = (s: number, perp = 0) => ({ x: F.x + U.x * s - U.y * perp, y: F.y + U.y * s + U.x * perp });

// --- projection (marsOceanShared's convention: M = Ry(lon) Rx(-lat), view normal -> body) --------------
type View = { cx: number; cy: number; r: number; lon: number; lat: number; roll?: number };
const viewToBody = (lon: number, lat: number, roll = 0): number[][] => {
  const cy = Math.cos(lon * D2R);
  const sy = Math.sin(lon * D2R);
  const cx = Math.cos(-lat * D2R);
  const sx = Math.sin(-lat * D2R);
  const cz = Math.cos(roll * D2R);
  const sz = Math.sin(roll * D2R);
  // Ry * Rx * Rz
  const A = [
    [cy, sy * sx, sy * cx],
    [0, cx, -sx],
    [-sy, cy * sx, cy * cx],
  ];
  const Rz = [
    [cz, -sz, 0],
    [sz, cz, 0],
    [0, 0, 1],
  ];
  return A.map((row) => [0, 1, 2].map((j) => row[0] * Rz[0][j] + row[1] * Rz[1][j] + row[2] * Rz[2][j]));
};
const project = (v: View, lon: number, lat: number) => {
  const M = viewToBody(v.lon, v.lat, v.roll ?? 0);
  const P = [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)];
  const n = [0, 1, 2].map((j) => M[0][j] * P[0] + M[1][j] * P[1] + M[2][j] * P[2]);
  return { x: v.cx + v.r * n[0], y: v.cy - v.r * n[1], z: n[2] };
};

// --- the camera ----------------------------------------------------------------------------------------
// One damped follower (fieldShared's CAM_STIFF / CAM_DAMP) on each channel; the TARGETS are eased curves
// evaluated per frame (never a few linear keys). lnR is the zoom (R = the globe's radius in screen px).
const R0 = 4.6 / RAD_PER_TILEPX; // where the globe push would land (4.6 screen px per tile px); the plane rig takes over first
const RW = 1 / RAD_PER_TILEPX; // Earth's radius in WORLD units (1 unit = one tile px of latitude, ~0.68 km)
const RG0 = 470; // the opening globe: 940 px wide
const DRIFT = 0.0036; // ln R per frame: the slow push that runs through the whole cut (visible from frame 0)
const GLOBE_SCREEN = { x: 540, y: 930 };
/** where the push aims: the ship comes to the true middle of the frame */
const SHIP_SCREEN = { x: 540, y: 960 };
const ease5 = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** the opening globe faces the Pacific (lon -108, lat -15) and turns west -> east as Earth turns, 0.22 deg/f: by
 *  ~f90 the turn itself has brought the ship's patch of sea (lon -128) to the middle; one direction throughout */
const GLOBE0 = { lon: -96, lat: -15 };
const SPIN = 0.38; // deg per frame
/** THE FLOOD (f23 "over" -> ~f50): the dark opens in the deepest basins and spreads outward */
export const floodT = (f: number) => clamp01((f - 23) / 27);
/** the latitude swing south to the ship (f56 -> f100), while the spin carries the longitude */
const turnT = (f: number) => ease5((f - 48) / 40);
/** THE PUSH (f60 -> f112): one log-speed push aimed straight at the ship, with a slow turn of the view (roll)
 *  that lines the frame up for the side view, so the tilt itself barely turns */
const pushT = (f: number) => smoothstep((f - 56) / 56);
const ROLL_END = -50; // deg
/** the push's aim: where the ship is at the hand-off to the plane rig */
const ANCHOR_F = 106;
const ANCHOR = (() => {
  const t = alongToTile(shipS(ANCHOR_F));
  return tileToGeo(t.x, t.y);
})();
const targets = (f: number) => {
  const pu = pushT(f);
  const lnR = Math.log(RG0) + DRIFT * f + (Math.log(R0) - Math.log(RG0) - DRIFT * 112) * pu;
  // (smoothstep, not ease5: the push is visibly under way from f60)
  const cx = lerp(GLOBE_SCREEN.x, SHIP_SCREEN.x, pu);
  const cy = lerp(GLOBE_SCREEN.y, SHIP_SCREEN.y, pu);
  const tu = turnT(f);
  // the spin hands over to the aim early (f54 -> f90) so the damped follower has settled before the zoom is close
  const lon = lerp(GLOBE0.lon - SPIN * f, ANCHOR.lon, ease5((f - 54) / 36));
  const lat = lerp(GLOBE0.lat, ANCHOR.lat, tu);
  const roll = ROLL_END * ease5((f - 62) / 46);
  return { lnR, cx, cy, lon, lat, roll };
};
const damp = (vals: number[][]) => {
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
const globeCache = new Map<number, View>();
const globeAt = (frame: number): View => {
  const hit = globeCache.get(frame);
  if (hit) return hit;
  const vals: number[][] = [];
  // the follower starts already moving (pre-rolled from f-40): no ramp-up stall on frame 0
  for (let f = -40; f <= frame; f++) {
    const t = targets(f);
    vals.push([t.lnR, t.cx, t.cy, t.lon, t.lat, t.roll]);
  }
  const [lnR, cx, cy, lon, lat, roll] = damp(vals);
  const out = { cx, cy, r: Math.exp(lnR), lon, lat, roll };
  globeCache.set(frame, out);
  return out;
};

// --- THE PLANE RIG (the ending: down under the hull) ------------------------------------------------------------
// WORLD = the globe's own orthographic projection plane about ORIGIN (fixed), in units of RW: e east, n north, z up;
// the seafloor is z = 0 and the sea surface z = SEA_D. A point (e, n) on the floor IS the sphere point whose
// orthographic projection it is, so a top-down perspective camera of focal FOC at height H draws the floor exactly
// as the globe of radius R = FOC * RW / H does: the hand-off is seamless. Then the camera dollies in and tilts
// from top-down to a low oblique view beneath the waterline, following the ship.
export const FOC = 2000; // px
export const SEA_D = 96; // the water column's height in world units (vertically exaggerated ~x5: a 15 km swath, a deep sea)
/** the hand-off: when the globe draws ~1 screen px per world unit */
export const HANDOFF_F = (() => {
  for (let f = 84; f < DURATION; f++) if (globeAt(f).r * RAD_PER_TILEPX >= 1) return f;
  return DURATION;
})();
const ORIGIN = (() => {
  const g = globeAt(HANDOFF_F);
  return { lon: g.lon, lat: g.lat };
})();
const ORIGIN_VIEW: View = { cx: 0, cy: 0, r: RW, lon: ORIGIN.lon, lat: ORIGIN.lat };
/** lon/lat -> world (e, n) */
export const toWorld = (lon: number, lat: number) => {
  const q = project(ORIGIN_VIEW, lon, lat);
  return { e: q.x, n: -q.y };
};
/** world (e, n) -> lon/lat (inverse orthographic about ORIGIN) */
export const fromWorld = (e: number, n: number) => {
  const dx = e / RW;
  const dy = n / RW;
  const dz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
  const M = viewToBody(ORIGIN.lon, ORIGIN.lat);
  const b = [0, 1, 2].map((i) => M[i][0] * dx + M[i][1] * dy + M[i][2] * dz);
  return { lon: Math.atan2(b[0], b[2]) / D2R, lat: Math.asin(Math.max(-1, Math.min(1, b[1]))) / D2R };
};
const shipWorld = (f: number) => {
  const t = alongToTile(shipS(f));
  const g = tileToGeo(t.x, t.y);
  return toWorld(g.lon, g.lat);
};
/** the ship's heading in world (unit, toward the bow) */
const HEAD = (() => {
  const a = shipWorld(0);
  const b = shipWorld(DURATION - 1);
  const l = Math.hypot(b.e - a.e, b.n - a.n);
  return { e: (b.e - a.e) / l, n: (b.n - a.n) / l };
})();
export type Cam3 = { pos: [number, number, number]; right: [number, number, number]; up: [number, number, number]; fwd: [number, number, number]; pp: { x: number; y: number }; foc: number };
const camFrom = (pivot: [number, number, number], dist: number, pitchDeg: number, yawDeg: number, pp: { x: number; y: number }): Cam3 => {
  const p = pitchDeg * D2R;
  const hx = Math.cos(yawDeg * D2R);
  const hy = Math.sin(yawDeg * D2R);
  const pos: [number, number, number] = [pivot[0] + dist * Math.cos(p) * hx, pivot[1] + dist * Math.cos(p) * hy, pivot[2] + dist * Math.sin(p)];
  const fwd: [number, number, number] = [-Math.cos(p) * hx, -Math.cos(p) * hy, -Math.sin(p)];
  const up: [number, number, number] = [-Math.sin(p) * hx, -Math.sin(p) * hy, Math.cos(p)];
  const right: [number, number, number] = [fwd[1] * up[2] - fwd[2] * up[1], fwd[2] * up[0] - fwd[0] * up[2], fwd[0] * up[1] - fwd[1] * up[0]];
  return { pos, right, up, fwd, pp, foc: FOC };
};
/** world -> screen for a plane-rig camera (z > 0 = in front) */
export const proj3 = (c: Cam3, e: number, n: number, z: number) => {
  const v = [e - c.pos[0], n - c.pos[1], z - c.pos[2]];
  const xc = v[0] * c.right[0] + v[1] * c.right[1] + v[2] * c.right[2];
  const yc = v[0] * c.up[0] + v[1] * c.up[1] + v[2] * c.up[2];
  const zc = v[0] * c.fwd[0] + v[1] * c.fwd[1] + v[2] * c.fwd[2];
  return { x: c.pp.x + (c.foc * xc) / zc, y: c.pp.y - (c.foc * yc) / zc, z: zc };
};
/** the END view (from ~f136): low under the waterline, ahead of the ship and off to its side, looking back along
 *  the track: the hull hangs from the bright surface in the upper third, the fan wedge drops to the floor at
 *  y ~1030 (above the caption bands), the lit swath recedes behind the ship into the dark */
const END = { dist: 380, pitch: 10, yawFromBow: 38, pp: { x: 560, y: 850 } };
const TILT_F = { a: HANDOFF_F, b: 138 };
const ORBIT = 0.16; // deg per frame
const yawEnd = (() => {
  // the camera stands ahead of the ship (in its bow direction), turned END.yawFromBow off the track
  const base = Math.atan2(HEAD.n, HEAD.e) / D2R;
  return base + END.yawFromBow;
})();
export type Rig = { mode: "globe"; g: View; shipS: number } | { mode: "plane"; g: View; c: Cam3; shipS: number; tilt: number; dist: number };
const rigCache = new Map<number, Rig>();
export const rigAt = (frame: number): Rig => {
  const hit = rigCache.get(frame);
  if (hit) return hit;
  const g = globeAt(frame);
  let out: Rig;
  if (frame < HANDOFF_F) out = { mode: "globe", g, shipS: shipS(frame) };
  else {
    const t = ease5((frame - TILT_F.a) / (TILT_F.b - TILT_F.a));
    const tz = smoothstep((frame - TILT_F.a) / (TILT_F.b - TILT_F.a)); // the dolly leads the tilt a little
    // the globe camera, as a top-down plane camera
    const cg = toWorld(g.lon, g.lat);
    const lnHg = Math.log((FOC * RW) / g.r);
    const sw = shipWorld(frame);
    const pivot: [number, number, number] = [lerp(cg.e, sw.e, tz), lerp(cg.n, sw.n, tz), 0];
    const lnD = lerp(lnHg, Math.log(END.dist) - 0.0025 * (frame - TILT_F.b), tz);
    // yaw: top-down north-up is the camera standing SOUTH (-90 deg); unwrap to the nearest turn
    // the globe's roll r shows world-up at (90 + r) deg: the top-down camera stands at yaw (r - 90)
    const y0 = (g.roll ?? 0) - 90;
    let y1 = yawEnd;
    while (y1 - y0 > 180) y1 -= 360;
    while (y1 - y0 < -180) y1 += 360;
    // ... and a slow orbit that keeps going through the hold (a living last frame)
    const yaw = lerp(y0, y1 + ORBIT * (frame - TILT_F.b), t);
    const pitch = lerp(90, END.pitch, t);
    const pp = { x: lerp(g.cx, END.pp.x, tz), y: lerp(g.cy, END.pp.y, tz) };
    out = { mode: "plane", g, c: camFrom(pivot, Math.exp(lnD), pitch, yaw, pp), shipS: shipS(frame), tilt: t, dist: Math.exp(lnD) };
  }
  rigCache.set(frame, out);
  return out;
};
/** the old single-view API (globe frames), for the parts that only need the globe */
export const viewAt = (frame: number): View & { shipS: number } => ({ ...globeAt(frame), shipS: shipS(frame) });

// --- textures --------------------------------------------------------------------------------------------
const TEX = [
  "marsocean/noeyes_global_relief_8k.jpg", // 0: R shade, G depth, B land (global, equirect)
  "marsocean/gebco2026_measured_mask_8k.png", // 1: measured (global)
  "marsocean/noeyes_tile_relief_4k.jpg", // 2: the South Pacific tile
  "marsocean/spacific_measured_mask_4k.png", // 3
  "marsocean/noeyes2_close_relief.jpg", // 4: the close-up window around the V2 site, x3
  "marsocean/noeyes2_close_mask.png", // 5
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
      img.onerror = () => reject(new Error(`NoEyesOnItV2: could not load ${src}`));
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
uniform float uTileW, uCloseW, uDebug, uFlood, uHL, uZoomLit, uStatic, uFlare, uMurkStep;
uniform vec3 uFloorBrown;
uniform float uPlane, uFoc, uRw, uSeaD, uFogAmt, uFogLen, uUnder;
uniform vec2 uPP;
uniform vec3 uCamPos, uCamR, uCamU, uCamF;
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
  // THE PLANE RIG: a perspective ray onto the floor (z = 0) of the globe's own projection plane; the floor point
  // (e, n) IS the sphere point whose orthographic projection it is, so the rest of the shading is unchanged
  vec3 rd = vec3(0.0, 0.0, -1.0);
  float tFloor = -1.0;
  float tSurf = -1.0;
  if (uPlane > 0.5) {
    rd = normalize(uCamR * ((p.x - uPP.x) / uFoc) - uCamU * ((p.y - uPP.y) / uFoc) + uCamF);
    if (rd.z < -1e-5) tFloor = -uCamPos.z / rd.z;
    if (tFloor > 6000.0) tFloor = -1.0; // toward the horizon: only water
    if (rd.z > 1e-5) tSurf = max(uSeaD - uCamPos.z, 0.0) / rd.z;
    vec3 hw = tFloor > 0.0 ? uCamPos + rd * tFloor : vec3(uCamPos.xy, 0.0);
    d = hw.xy / uRw;
  }
  float rr = length(d);
  float edgePx = uPlane > 0.5 ? 1.0e4 : (1.0 - rr) * uR;
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
    // THE SHIP'S OWN STRIP (V2): painted by its fan from the track end (s = 0) up to the fan (s = uShipS)
    vec2 q = tp - uF;
    float s = dot(q, uU);
    vec2 uP = vec2(uU.y, -uU.x);
    float perp = abs(dot(q, uP));
    float aw = max(length(vec2(dot(tgx, uU), dot(tgy, uU))), 0.6);
    float pw = max(length(vec2(dot(tgx, uP), dot(tgy, uP))), 0.6);
    float strip = smoothstep(uSwathHalf + pw, uSwathHalf - pw, perp);
    float painted = strip * smoothstep(-aw, aw, s) * (1.0 - smoothstep(uShipS - aw, uShipS + aw, s));
    float fresh = painted * exp(-max(uShipS - s, 0.0) / 30.0);

    // MEASURED AMOUNT = the AREA FRACTION of measured cells under this screen px: the mask's mip / box
    // average, linear (no gain, no gamma, no minimum width). A 1 km swath under a 5 km px lights it ~20 %.
    // (The 8k global mask's mean over the tile's region is 0.0904; the 4k tile's is 0.0910: unbiased.)
    float mRaw = clamp(mC, 0.0, 1.0);
    // single-beam lines (1 px of dotted soundings) stay faint threads wherever the finer data can tell them
    // from swaths (~22 px; wide, over a fixed ~8 tile px footprint); soft dots in the close-up
    float wide = smoothstep(0.2, 0.55, mW);
    // (V2: only in the close-up, so no track changes weight while the tile hands over: it just widens)
    float m = mix(mRaw, mix(clamp(mS * 1.5, 0.0, 1.0) * 0.4, mRaw, wide), uCloseW);
    m *= smoothstep(0.02, 0.06, m); // a speck of a few stray cells is not a ghost
    // ... nor is an isolated cell: a line still covers ~1/6 of the wider footprint, a lone dot ~1/36
    m *= smoothstep(0.025, 0.07, mS);
    // under the water the single-beam soundings, magnified by perspective, stay faint (they are points, not swaths)
    // under the water only the ship's own strip reveals the floor: the grid's tracks fade out with the descent
    m *= 1.0 - 0.9 * uFogAmt;
    float land = smoothstep(0.35, 0.65, relC.b);

    // THE SEAFLOOR MATERIAL, one at every zoom: GEBCO relief under the key light in warm sand (umber shadows ->
    // sand highlights), broad depth as tone (ridges and shelves lighter, basins deeper), finer as we go in
    // (at globe scale the relief is a fraction of a px: its contrast is lifted so ridges, trenches and
    // seamounts still read; broad depth carries the basins)
    float sh = clamp(0.5 + (relC.r - 0.5) * 2.2, 0.0, 1.2);
    vec3 lit = mix(uLitLo, uLitHi, smoothstep(0.05, 0.95, sh)) * (0.85 + 0.2 * sh) * (0.7 + 0.45 * relC.g);
    lit = min(lit, uLitHi * 1.02); // no hot specks on seamount peaks
    // V2 WEIGHT: at globe scale the seen seafloor is a QUIET warm thread (full coverage ~L* 27, no glow);
    // dense survey blocks a touch brighter; it rises continuously to its full light as the zoom comes in
    // the ship's own fresh strip: the full light, its relief a little gentler (no dashes at grazing angles)
    float shO = clamp(0.5 + (mix(relC.r, relS.r, 0.45) - 0.5) * mix(1.1, 2.2, uFogAmt), 0.0, 1.2);
    vec3 litOwn = mix(uLitLo, uLitHi, smoothstep(0.0, 1.0, shO)) * (0.9 + 0.15 * shO);
    litOwn = mix(litOwn, litOwn * vec3(1.06, 0.97, 0.82), uFogAmt); // warmer under the water: amber-lit sand
    // V2 STATIC LIGHT: what the grid has seen is a quiet warm thread (~L* 27 when fully covered, no glow, shelves
    // capped); on "no eyes" it flares one step brighter, crisp and thin; then through the dive it sinks to faint
    // scratches, so the only lit thing at the end is the ship's own strip
    float dense = smoothstep(0.5, 0.9, mS);
    lit *= (0.6 + 0.1 * dense) * uStatic;
    lit = min(lit, uLitHi * (0.4 + 0.06 * dense) * uStatic);
    // dimmed, the threads stay AMBER (thin light), never tan or pink
    float lumL = dot(lit, vec3(0.2126, 0.7152, 0.0722));
    // a YELLOW-leaning amber: a dimmed orange drifts to red-brown (reads pink over petrol); this stays amber
    vec3 amberN = vec3(1.0, 0.8, 0.38) / dot(vec3(1.0, 0.8, 0.38), vec3(0.2126, 0.7152, 0.0722));
    lit = mix(lit, lumL * amberN * 0.95, smoothstep(0.0, 0.3, 1.0 - uStatic));
    lit = mix(lit, lit * 1.35 + uAmber * 0.05, uFlare);
    // dimmed, a thread is still a faint LIGHTER scratch, never a dark one (a luminance floor, in its own hue:
    // a per-channel max against petrol would turn amber pink)
    float lumD = dot(uDarkest * 1.25, vec3(0.2126, 0.7152, 0.0722));
    float lumT = dot(lit, vec3(0.2126, 0.7152, 0.0722));
    lit *= max(1.0, lumD / max(lumT, 1e-4));
    // THE MURK: a deep, heavy petrol with almost no relief (L* ~19-20 at the subject, never black)
    float depthS = relS.g;
    // V2: darker and FLAT: deep petrol (L* ~13-15 at the subject), no relief at globe scale (deep water),
    // only a soft depth gradient; the faintest relief comes back in the close-up
    vec3 murk = uDarkest * (1.04 + 0.1 * (depthS - 0.3)) * (1.0 + 0.16 * uCloseW * (1.0 - uFogAmt) * (relS.r - 0.5));
    murk *= 1.0 - 0.12 * uMurkStep; // on "no eyes": the dark deepens a step
    // under the water (plane rig): the floor is a distinct deep brown-dark plain, its relief faint
    // ... a deep brown-teal HAZE with no relief at all: the unseen floor falls away into the murk
    vec3 floorC = uFloorBrown * (0.96 + 0.08 * vnoise(vec3(tp * 0.004, 1.7)));
    murk = mix(murk, floorC, uFogAmt);

    // THE FLOOD (V2): the dark opens in many places at once: the deepest basins first, as patches spreading
    // outward from mid-ocean toward ridges and coasts, merging until only the measured cells are left lit. The
    // order is the RANK of the broad depth (GEBCO relief at ~3 deg, land counted as shallow) over the ocean,
    // so the dark advances at an even rate; slow noise breaks the patch edges.
    vec3 broad = textureLod(uGRel, guv, 6.5).rgb;
    float bd = mix(broad.g, 1.0, smoothstep(0.1, 0.5, broad.b));
    float rank = bd < 0.145 ? mix(0.05, 0.25, smoothstep(0.07, 0.145, bd))
               : bd < 0.224 ? mix(0.25, 0.5, (bd - 0.145) / 0.079)
               : bd < 0.341 ? mix(0.5, 0.75, (bd - 0.224) / 0.117)
               : mix(0.75, 0.97, smoothstep(0.341, 0.81, bd));
    rank = mix(0.0, 0.05, smoothstep(0.0, 0.07, bd)) * step(bd, 0.07) + rank * step(0.07, bd);
    float thr = rank + 0.08 * (vnoise(b * 5.0) - 0.5) + 0.03 * (vnoise(b * 13.0) - 0.5);
    float fl = smoothstep(thr - 0.16, thr + 0.16, uFlood); // wide feathered edges that grow smoothly
    // what stays lit: the measured fraction (exactly m once the flood has passed)
    float mEff = 1.0 - (1.0 - m) * fl;
    // AFTER the front: what we have SEEN (the measured fraction m) in the warm sand material, the rest murk
    vec3 seen = mix(murk, lit, m);
    // partial coverage keeps the SAND's hue at its honest (lower) lightness: dim sand on dark, not a grey ghost
    float lumS = dot(seen, vec3(0.2126, 0.7152, 0.0722));
    vec3 warm = lit * (lumS / max(dot(lit, vec3(0.2126, 0.7152, 0.0722)), 1e-3));
    // (fully hue-kept once dimmed: a faint amber thread over petrol, never a grey-pink blend)
    seen = mix(seen, warm, smoothstep(0.03, 0.25, m) * (1.0 - smoothstep(0.75, 1.0, m)) * mix(0.7, 1.0, smoothstep(0.0, 0.3, 1.0 - uStatic)));
    // BEFORE the front: Earth's whole ocean floor as a bathymetric map: abyssal blue -> lighter teal on ridges
    // and shelves, the GEBCO relief lit by the key light (crisp). The front changes both at once: unmeasured
    // cells sink into the murk, measured cells warm into the sand.
    float shB = clamp(0.5 + (relC.r - 0.5) * 3.0, 0.0, 1.4);
    vec3 bathy = mix(uBathyDeep, uBathyMid, smoothstep(0.0, 0.55, relC.g));
    bathy = mix(bathy, uBathyShelf, smoothstep(0.5, 1.0, relC.g));
    bathy *= 0.62 + 0.62 * shB;
    // on "Earth": the measured cells brighten a little in place (already there, nothing appears), so they are
    // seen before the rest goes dark
    bathy = mix(bathy, bathy * 1.32 + vec3(0.05, 0.045, 0.02), clamp(m, 0.0, 1.0) * uHL * 0.75);
    vec3 sea = mix(bathy, seen, fl);
    sea = mix(sea, litOwn, painted); // the ship's own strip, always lit
    // close-up only: the swath's edges catch the amber; the fresh swath still holds the fan's light
    float rim = clamp(m * (1.0 - smoothstep(0.35, 0.95, mS)) * 1.6, 0.0, 1.0) * wide * uCloseW;
    sea = mix(sea, uAmber, rim * 0.25);
    sea = mix(sea, uAmberHot, fresh * 0.45);
    // LAND: quiet, a muted earth tone with dim relief
    // the same Earth as MarsVsOcean (its daymap), quietened: desaturated, dimmed, ice held down, GEBCO relief on it
    // ice and snow (bright, unsaturated) take the same earthy tone, so Antarctica is land, not a grey hole
    vec3 day = textureGrad(uEarth, guv, ggx, ggy).rgb;
    float dl = dot(day, vec3(0.2126, 0.7152, 0.0722));
    float dsat = (max(day.r, max(day.g, day.b)) - min(day.r, min(day.g, day.b))) / max(1e-3, max(day.r, max(day.g, day.b)));
    float ice = smoothstep(0.55, 0.8, dl) * (1.0 - smoothstep(0.08, 0.25, dsat));
    // natural Earth (f0): MarsVsOcean's daymap, lightly muted (greens, tans, white ice), GEBCO relief on it
    vec3 nat = mix(vec3(dl), day, 0.85) * 0.92 * (0.86 + 0.5 * (relC.r - 0.5));
    nat = mix(nat, nat * 0.62, ice); // ice never the brightest thing in frame
    // after the front: a touch quieter (desaturated, dimmed; ice held to a cool pale grey)
    // after the dark: the same Earth, a little quieter (never grey)
    vec3 quiet = mix(vec3(dot(nat, vec3(0.2126, 0.7152, 0.0722))), nat, 0.85) * 0.86;
    vec3 earth = mix(nat, quiet, fl);
    vec3 c = mix(sea, earth, land);

    // the sphere's light (marsOceanShared's model): one key from the upper left, soft terminator, warm night
    float ndl = dot(n, normalize(uL));
    float ndl0 = dot(vec3(0.0, 0.0, 1.0), normalize(uL));
    float sft = smoothstep(-0.25, 0.45, ndl);
    float lt = 0.6 + 0.4 * sft * (0.35 + 0.65 * clamp(ndl, 0.0, 1.0)) / (0.35 + 0.65 * ndl0);
    lt /= 0.6 + 0.4 * smoothstep(-0.25, 0.45, ndl0);
    lt = min(lt, 1.0); // faces toward the key never lift the murk above its own tone
    float limb = mix(mix(0.72, 0.95, smoothstep(600.0, 1600.0, uR)), 1.0, pow(z, 0.45));
    // the shadow side is a deep warm petrol-brown, never black
    vec3 shaded = c * lt * limb + uNight * 0.3 * (1.0 - sft);
    // what we have seen keeps a little of its own light past the terminator
    c = mix(shaded, c * 0.92, m * (1.0 - land) * 0.3 * (1.0 - sft));
    // atmosphere just inside the limb
    float rimA = pow(1.0 - z, 2.6) * uAtmoA * (0.25 + 0.75 * sideLit) * (0.35 + 0.65 * sft);
    c = mix(c, uAtmo, clamp(rimA, 0.0, 1.0));
    // THE WATER (plane rig, faded in with the tilt): the floor seen through the water column, fogging to a
    // deep petrol with distance; looking up from under the surface: the bright ceiling of the surface
    if (uPlane > 0.5) {
      float tEnter = uCamPos.z > uSeaD ? (uSeaD - uCamPos.z) / min(rd.z, -1e-5) : 0.0;
      // the water's own tone by the ray's direction only (lighter looking up, deep petrol looking down): no seams
      float hm = clamp(uCamPos.z / uSeaD * 0.5 + rd.z * 1.6 + 0.25, 0.0, 1.0);
      vec3 fogC = mix(uDarkest * 1.12, uMid * 0.95, smoothstep(0.35, 1.0, hm) * 0.55);
      // below: the floor through the water (or water only toward the horizon); above: the lit underside of the
      // surface; one soft gradient across the horizon (never a hard line)
      vec3 below = fogC;
      if (tFloor > 0.0) {
        float Lw = max(tFloor - max(tEnter, 0.0), 0.0);
        // the far floor always fogs out completely; the ship's strip carries its light further than the dark floor
        below = mix(c, fogC, (1.0 - exp(-Lw / (uFogLen * (1.0 + 1.5 * painted)))) * mix(uFogAmt, 1.0, smoothstep(1200.0, 5000.0, Lw)));
      }
      float ts = max(uSeaD - uCamPos.z, 0.0) / max(rd.z, 0.02);
      vec3 ceilC = mix(uMid * 1.2, vec3(0.46, 0.64, 0.63), smoothstep(0.05, 0.9, rd.z) * 0.7);
      vec3 above = mix(ceilC, fogC, 1.0 - exp(-ts / (uFogLen * 0.8)));
      above = mix(fogC, above, uFogAmt * uUnder);
      c = mix(below, above, smoothstep(-0.015, 0.11, rd.z));
    }
    if (any(isnan(c))) c = uDarkest;
    // the darkest anything gets: L* ~12 (deep petrol at sea, deep brown on the floor), never black; a LUMINANCE
    // floor, so a brown floor is lifted in its own hue, never toward petrol (which would turn it purple)
    float lumF = dot(uDarkest * 1.02, vec3(0.2126, 0.7152, 0.0722));
    float lumC = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = lumC < lumF ? (lumC > 1e-4 ? c * (lumF / lumC) : uDarkest * 1.02) : c;
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
  "uAtmo", "uAtmoW", "uAtmoA", "uDebug", "uFlood", "uHL", "uZoomLit", "uStatic", "uFlare", "uMurkStep", "uFloorBrown", "uPlane", "uFoc", "uRw", "uSeaD", "uFogAmt", "uFogLen", "uUnder", "uPP", "uCamPos", "uCamR", "uCamU", "uCamF",
];
type GLState = { gl: WebGL2RenderingContext; u: Record<string, WebGLUniformLocation | null> };

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const s = gl.createShader(type) as WebGLShader;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`NoEyesOnItV2 shader: ${gl.getShaderInfoLog(s)}`);
  return s;
};
const initGL = (canvas: HTMLCanvasElement, imgs: HTMLImageElement[]): GLState => {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("NoEyesOnItV2: WebGL2 unavailable (render with --gl=angle)");
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (max < 8192) throw new Error(`NoEyesOnItV2: MAX_TEXTURE_SIZE ${max} < 8192`);
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`NoEyesOnItV2 link: ${gl.getProgramInfoLog(prog)}`);
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
  // (V2: wide bands, so each hand-off is a crossfade of >= 6 frames even in the fastest part of the push)
  const closeW = smoothstep((Math.log(pxPerTile) - Math.log(1.1)) / (Math.log(4.0) - Math.log(1.1)));
  const pxPerGlobal = pxPerTile * (8192 / 360) ** -1 * (4096 / 25);
  const tileW = smoothstep((Math.log(pxPerGlobal) - Math.log(0.45)) / (Math.log(1.8) - Math.log(0.45)));
  return { closeW, tileW };
};

const SeafloorGlobe: React.FC<{ rig: Rig; time: number; flood: number; frame: number; debug?: boolean }> = ({ rig, time, flood, frame, debug = false }) => {
  const v = { ...rig.g, shipS: rig.shipS };
  const plane = rig.mode === "plane" ? rig : null;
  // the screen density that drives the LOD and the light: the globe's, or the plane rig's at its pivot
  const rEq = plane ? (FOC * RW) / plane.dist : v.r;
  const W = 1080;
  const H = 1920;
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef<GLState | null>(null);
  const [handle] = useState(() => delayRender("NoEyesOnItV2 textures", { timeoutInMilliseconds: 240000 }));
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
    const M = plane ? viewToBody(ORIGIN.lon, ORIGIN.lat) : viewToBody(v.lon, v.lat, v.roll ?? 0);
    gl.uniformMatrix3fv(u.uM, false, [M[0][0], M[1][0], M[2][0], M[0][1], M[1][1], M[2][1], M[0][2], M[1][2], M[2][2]]);
    ["uGRel", "uGMask", "uTRel", "uTMask", "uCRel", "uCMask", "uEarth"].forEach((nm, i) => gl.uniform1i(u[nm], i));
    gl.uniform2f(u.uRes, W, H);
    gl.uniform2f(u.uCenter, v.cx, v.cy);
    gl.uniform1f(u.uR, v.r);
    gl.uniform3f(u.uL, KEY_LIGHT[0], KEY_LIGHT[1], KEY_LIGHT[2]);
    const w = weights(rEq);
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
    gl.uniform1f(u.uFlood, lerp(-0.08, 1.06, 0.7 * flood + 0.3 * smoothstep(flood)));
    gl.uniform1f(u.uHL, smoothstep((frame - 15) / 14));
    // the seen seafloor's light rises with the zoom (screen px per tile px 0.12 -> 1.5): continuous
    gl.uniform1f(u.uZoomLit, smoothstep((Math.log(rEq * RAD_PER_TILEPX) - Math.log(0.12)) / (Math.log(1.5) - Math.log(0.12))));
    // on "no eyes" (f61 -> f76) everything static dims a little further; the live survey heads keep glowing
    // on "no eyes" (f61 -> f76) the web dims a step; through the fall it holds as faint amber threads
    gl.uniform1f(u.uStatic, 1 - 0.25 * smoothstep((frame - 61) / 15) - 0.15 * smoothstep((frame - 80) / 16));
    gl.uniform1f(u.uFlare, 0);
    gl.uniform1f(u.uMurkStep, smoothstep((frame - 61) / 12));
    gl.uniform3f(u.uFloorBrown, ...hexRgb(LOOK.floor));
    gl.uniform1f(u.uPlane, plane ? 1 : 0);
    gl.uniform1f(u.uFoc, FOC);
    gl.uniform1f(u.uRw, RW);
    gl.uniform1f(u.uSeaD, SEA_D);
    // the water closes in as the camera sinks into it: one long, smooth fall-off (light dying with depth)
    gl.uniform1f(u.uFogAmt, plane ? smoothstep((plane.tilt - 0.05) / 0.8) : 0);
    gl.uniform1f(u.uFogLen, 1100);
    // the bright ceiling of the surface comes in as the camera sinks below it (never a hard line)
    // the bright surface band comes in slowly with the tilt (time-driven, ~20 frames: never a pop)
    gl.uniform1f(u.uUnder, plane ? smoothstep((frame - 116) / 22) : 0);
    if (plane) {
      gl.uniform2f(u.uPP, plane.c.pp.x, plane.c.pp.y);
      gl.uniform3f(u.uCamPos, ...plane.c.pos);
      gl.uniform3f(u.uCamR, ...plane.c.right);
      gl.uniform3f(u.uCamU, ...plane.c.up);
      gl.uniform3f(u.uCamF, ...plane.c.fwd);
    }
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
  antifoul: "#7A2E24", // below the waterline: red antifouling
  antifoulDeep: "#5A2420",
  hullBlue: "#233B5A", // the research vessel's dark blue topsides
  floor: "#2C2A22", // the unseen seafloor: a deep brown-teal haze under the water: a deep brown-dark plain (never black)
} as const;

// --- the ship (SVG, screen px; drawn from world points so it scales and turns with the map) -------------
// --- the ship, the survey heads, the water (SVG over the canvas, drawn from WORLD points) -------------------------
type P2 = { x: number; y: number; z: number };
/** world -> screen for the current rig (globe: through the sphere, height ignored; plane: perspective) */
const projector = (rig: Rig) => (e: number, n: number, z: number): P2 => {
  if (rig.mode === "plane") return proj3(rig.c, e, n, z);
  const ll = fromWorld(e, n);
  const q = project(rig.g, ll.lon, ll.lat);
  return { x: q.x, y: q.y, z: 1e4 - z };
};
const shade = (hex: string, k: number) => {
  const q = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${q.map((c) => Math.round(Math.max(0, Math.min(255, c * k)))).join(",")})`;
};
/** the hull outline (port half, bow -> stern), in units of L (x) and B (y) */
const OUTLINE_HALF: [number, number][] = [
  [0.5, 0],
  [0.45, 0.17],
  [0.38, 0.32],
  [0.28, 0.44],
  [0.12, 0.5],
  [-0.3, 0.5],
  [-0.47, 0.5],
  [-0.5, 0.44],
];
const OUTLINE: [number, number][] = [...OUTLINE_HALF, ...OUTLINE_HALF.slice(1).reverse().map(([x, y]) => [x, -y] as [number, number])].filter(
  (p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1],
);
const SHIP3 = { FB: 2.6, DRAFT: 3.2, L: SHIP.len, B: SHIP.len * SHIP.beam };
const LIGHT_W = (() => {
  const v = [-0.45, 0.55, 0.7];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / l);
})();
type Face = { pts: [number, number, number][]; color: string; hint: [number, number, number]; above: boolean; flat?: boolean };
const shipFaces = (): Face[] => {
  const { L, B, FB, DRAFT } = SHIP3;
  const deck = OUTLINE.map(([x, y]) => [x * L, y * B, FB] as [number, number, number]);
  const wl = OUTLINE.map(([x, y]) => [x * L * 0.995, y * B * 0.97, 0] as [number, number, number]);
  const keel = OUTLINE.map(([x, y]) => [x * L * 0.93, y * B * 0.62, -DRAFT] as [number, number, number]);
  const faces: Face[] = [];
  const nO = OUTLINE.length;
  for (let i = 0; i < nO; i++) {
    const j = (i + 1) % nO;
    const mid: [number, number, number] = [(deck[i][0] + deck[j][0]) / 2, (deck[i][1] + deck[j][1]) / 2, 0];
    const out: [number, number, number] = [mid[0] * 1.6, mid[1] * 1.6 + Math.sign(mid[1]) * 1, 0];
    // a research vessel: dark blue topsides, red antifouling below the waterline
    faces.push({ pts: [deck[i], deck[j], wl[j], wl[i]], color: LOOK.hullBlue, hint: [out[0], out[1], FB / 2], above: true });
    faces.push({ pts: [wl[i], wl[j], keel[j], keel[i]], color: LOOK.antifoul, hint: [out[0], out[1], -DRAFT / 2], above: false });
  }
  faces.push({ pts: keel.slice().reverse(), color: LOOK.antifoulDeep, hint: [0, 0, -DRAFT - 1], above: false, flat: true });
  faces.push({ pts: deck, color: "#BDB8AD", hint: [0, 0, FB + 1], above: true, flat: true });
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top: string, side: string, front?: string) => {
    const c: [number, number, number] = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    const P = (x: number, y: number, z: number) => [x, y, z] as [number, number, number];
    faces.push({ pts: [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], color: top, hint: [c[0], c[1], z1 + 1], above: true, flat: true });
    faces.push({ pts: [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], color: front ?? side, hint: [x1 + 1, c[1], c[2]], above: true });
    faces.push({ pts: [P(x0, y0, z0), P(x0, y1, z0), P(x0, y1, z1), P(x0, y0, z1)], color: side, hint: [x0 - 1, c[1], c[2]], above: true });
    faces.push({ pts: [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], color: side, hint: [c[0], y1 + 1, c[2]], above: true });
    faces.push({ pts: [P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], color: side, hint: [c[0], y0 - 1, c[2]], above: true });
  };
  const W = "#F4F1EA";
  const Ws = "#DCD6CA";
  // the aft working deck, the deckhouse and the bridge (window band forward), the funnel, the mast, the A-frame
  box(-0.48 * L, -0.06 * L, -0.42 * B, 0.42 * B, FB, FB + 0.12, "#8E8A82", "#8E8A82");
  box(-0.04 * L, 0.27 * L, -0.4 * B, 0.4 * B, FB, FB + 3.0, W, Ws);
  box(0.07 * L, 0.24 * L, -0.34 * B, 0.34 * B, FB + 3.0, FB + 5.4, W, Ws);
  box(0.235 * L, 0.248 * L, -0.33 * B, 0.33 * B, FB + 4.1, FB + 5.0, "#1E2A33", "#1E2A33");
  box(-0.03 * L, 0.03 * L, -0.11 * B, 0.11 * B, FB + 3.0, FB + 7.2, W, Ws);
  box(-0.03 * L, 0.03 * L, -0.115 * B, 0.115 * B, FB + 6.4, FB + 7.25, LOOK.hullBlue, LOOK.hullBlue);
  box(0.145 * L, 0.16 * L, -0.03 * B, 0.03 * B, FB + 5.4, FB + 11.5, "#E6E2DA", "#CFC9BE");
  box(0.14 * L, 0.165 * L, -0.24 * B, 0.24 * B, FB + 9.6, FB + 9.9, "#E6E2DA", "#CFC9BE");
  box(-0.475 * L, -0.455 * L, 0.33 * B, 0.39 * B, FB, FB + 6.6, "#E07A22", "#C2651A");
  box(-0.475 * L, -0.455 * L, -0.39 * B, -0.33 * B, FB, FB + 6.6, "#E07A22", "#C2651A");
  box(-0.478 * L, -0.452 * L, -0.39 * B, 0.39 * B, FB + 6.1, FB + 6.6, "#E07A22", "#C2651A");
  box(-0.3 * L, -0.2 * L, -0.3 * B, -0.05 * B, FB, FB + 1.4, "#5E6A72", "#4E5960");
  return faces;
};
const SHIP_FACES = shipFaces();

const Glow: React.FC<{ x: number; y: number; o: number; r?: number }> = ({ x, y, o, r = 3.4 }) => (
  <g opacity={o} style={{ filter: bloomFilter(1) }}>
    <circle cx={x} cy={y} r={r * 3} fill={AMBER.top} opacity={0.28} />
    <circle cx={x} cy={y} r={r} fill="#FFF3D6" />
  </g>
);
/** marine snow: a few faint motes in the water column near the ship (plane rig only), drifting down and astern */
const SNOW = Array.from({ length: 70 }, (_, i) => {
  const h = (k: number) => {
    const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  return { a: h(1), b: h(2), c: h(3), s: 0.5 + h(4) };
});

const Ship: React.FC<{ rig: Rig; frame: number }> = ({ rig, frame }) => {
  const P = projector(rig);
  const sw = shipWorld(frame);
  const h = HEAD;
  const port = { e: -h.n, n: h.e };
  // a slight, continuous roll and pitch (never a sudden one)
  const t = frame / FPS;
  const rollA = 1.6 * D2R * Math.sin((2 * Math.PI * t) / 3.6);
  const pitchA = 0.6 * D2R * Math.sin((2 * Math.PI * t) / 5.1 + 1.1);
  const W = (x0: number, y0: number, z0: number) => {
    const y = y0 * Math.cos(rollA) - z0 * Math.sin(rollA);
    const z1 = y0 * Math.sin(rollA) + z0 * Math.cos(rollA);
    const x = x0 * Math.cos(pitchA) - z1 * Math.sin(pitchA);
    const z = x0 * Math.sin(pitchA) + z1 * Math.cos(pitchA);
    return { e: sw.e + x * h.e + y * port.e, n: sw.n + x * h.n + y * port.n, z: SEA_D + z };
  };
  const Pw = (x: number, y: number, z: number) => {
    const w = W(x, y, z);
    return P(w.e, w.n, w.z);
  };
  const bow = Pw(SHIP3.L / 2, 0, 0);
  const stern = Pw(-SHIP3.L / 2, 0, 0);
  if (bow.z <= 0 || stern.z <= 0) return null;
  const Ls = Math.hypot(bow.x - stern.x, bow.y - stern.y);
  // the ship resolves as it grows on screen: below ~6 px it is only the glowing tip of its own swath
  const hullA = smoothstep((Ls - 6) / 18);
  const camZ = rig.mode === "plane" ? rig.c.pos[2] : 1e9;
  const under = smoothstep((SEA_D - camZ) / 8); // the camera has gone below the surface
  const camPos = rig.mode === "plane" ? rig.c.pos : null;
  const r = (x: number) => (Math.round(x * 100) / 100).toString();
  // faces: cull the far side, paint far -> near
  const faces = SHIP_FACES.map((f) => {
    const wp = f.pts.map(([x, y, z]) => W(x, y, z));
    const sp = f.pts.map(([x, y, z]) => Pw(x, y, z));
    const cx = f.pts.reduce((a, q) => a + q[0], 0) / f.pts.length;
    const cy = f.pts.reduce((a, q) => a + q[1], 0) / f.pts.length;
    const cz = f.pts.reduce((a, q) => a + q[2], 0) / f.pts.length;
    // the face normal (Newell), turned outward by the hint, then to world
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (let k = 0; k < f.pts.length; k++) {
      const a = f.pts[k];
      const b = f.pts[(k + 1) % f.pts.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]);
      ny += (a[2] - b[2]) * (a[0] + b[0]);
      nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    if (nx * (f.hint[0] - cx) + ny * (f.hint[1] - cy) + nz * (f.hint[2] - cz) < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const nl = Math.hypot(nx, ny, nz) || 1;
    const nW = [(nx * h.e + ny * port.e) / nl, (nx * h.n + ny * port.n) / nl, nz / nl];
    const c = W(cx, cy, cz);
    const toCam = camPos ? [camPos[0] - c.e, camPos[1] - c.n, camPos[2] - c.z] : [0, 0, 1];
    const facing = nW[0] * toCam[0] + nW[1] * toCam[1] + nW[2] * toCam[2];
    const depth = sp.reduce((a, q) => a + q.z, 0) / sp.length;
    const lightK = 0.74 + 0.3 * Math.max(0, nW[0] * LIGHT_W[0] + nW[1] * LIGHT_W[1] + nW[2] * LIGHT_W[2]);
    return { f, wp, sp, facing, depth, lightK };
  })
    .filter((q) => q.facing > 0)
    .sort((a, b) => b.depth - a.depth);
  // the fan: from the keel down to the floor across the track; its footprint the hot line on the floor
  const fanHalf = 11.5;
  const keel = Pw(0, 0, -SHIP3.DRAFT);
  const fl0 = P(sw.e + fanHalf * port.e, sw.n + fanHalf * port.n, 0);
  const fl1 = P(sw.e - fanHalf * port.e, sw.n - fanHalf * port.n, 0);
  const flm = P(sw.e, sw.n, 0);
  const kFloor = Math.hypot(fl0.x - fl1.x, fl0.y - fl1.y) / (2 * fanHalf); // px per unit at the footprint
  // wake on the surface (ship frame, z = 0)
  const { L, B } = SHIP3;
  const wakeLen = 2.4 * L;
  const kel = Math.tan((19.5 * Math.PI) / 180);
  const poly = (pts: [number, number][]) =>
    pts
      .map(([x, y]) => Pw(x, y, 0))
      .map((q) => `${r(q.x)},${r(q.y)}`)
      .join(" ");
  const wash = poly([
    [-L * 0.5, -B * 0.38],
    [-L * 0.5 - wakeLen, -B * 0.9],
    [-L * 0.5 - wakeLen, B * 0.9],
    [-L * 0.5, B * 0.38],
  ]);
  const armW = B * 0.12;
  const arm = (sgn: number) =>
    poly([
      [L * 0.3, sgn * B * 0.46],
      [L * 0.3 - wakeLen, sgn * (B * 0.46 + wakeLen * kel)],
      [L * 0.3 - wakeLen, sgn * (B * 0.46 + wakeLen * kel + armW)],
      [L * 0.3, sgn * (B * 0.46 + armW)],
    ]);
  const wa = Pw(-L * 0.5, 0, 0);
  const wb = Pw(-L * 0.5 - wakeLen, 0, 0);
  const blurPx = Math.max(0.3, (Ls / L) * B * 0.09);
  const id = "neo2";
  // snow (plane rig, under water)
  const snow =
    rig.mode === "plane" && under > 0
      ? SNOW.map((m, i) => {
          const t = frame / FPS;
          const x = (m.a - 0.5) * 220 - 0.6 * frame * 0.4;
          const y = (m.b - 0.5) * 220;
          const z = ((m.c * SEA_D - t * 1.6 * m.s) % SEA_D + SEA_D) % SEA_D;
          const q = Pw(x, y, z - SEA_D);
          if (q.z <= 1) return null;
          const rad = Math.max(0.5, (FOC * 0.35 * m.s) / q.z);
          return <circle key={i} cx={r(q.x)} cy={r(q.y)} r={r(rad)} fill={COLOR.inkCream} opacity={0.22 * under} />;
        })
      : null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={`${id}wedge`} gradientUnits="userSpaceOnUse" x1={r(keel.x)} y1={r(keel.y)} x2={r(flm.x)} y2={r(flm.y)}>
          <stop offset="0" stopColor={AMBER.hot} stopOpacity={0.1} />
          <stop offset="1" stopColor={AMBER.top} stopOpacity={0.42} />
        </linearGradient>
        <linearGradient id={`${id}wash`} gradientUnits="userSpaceOnUse" x1={r(wa.x)} y1={r(wa.y)} x2={r(wb.x)} y2={r(wb.y)}>
          <stop offset="0" stopColor={LOOK.foam} stopOpacity={0.95} />
          <stop offset="0.35" stopColor={LOOK.foam} stopOpacity={0.5} />
          <stop offset="1" stopColor={LOOK.foam} stopOpacity={0} />
        </linearGradient>
        <filter id={`${id}soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={r(blurPx)} />
        </filter>
      </defs>
      {snow}
      {/* the sonar fan: a thin translucent wedge from the keel to the floor, and its hot footprint on the floor */}
      <polygon points={`${r(keel.x)},${r(keel.y)} ${r(fl0.x)},${r(fl0.y)} ${r(fl1.x)},${r(fl1.y)}`} fill={`url(#${id}wedge)`} style={{ mixBlendMode: "screen" }} />
      <g style={{ filter: bloomFilter(1) }} opacity={hullA}>
        <line x1={r(fl0.x)} y1={r(fl0.y)} x2={r(fl1.x)} y2={r(fl1.y)} stroke="#FFF3D6" strokeWidth={r(Math.max(2, kFloor * 1.4))} strokeLinecap="round" />
      </g>
      {/* while the ship is too small to see: its glowing head */}
      <Glow x={flm.x} y={flm.y} o={1 - hullA} />
      {/* the wake on the surface */}
      <g filter={`url(#${id}soft)`} opacity={hullA * (1 - 0.8 * (rig.mode === "plane" ? smoothstep(rig.tilt / 0.22) : 0))}>
        <polygon points={wash} fill={`url(#${id}wash)`} />
        <polygon points={arm(1)} fill={LOOK.foam} opacity={0.75} />
        <polygon points={arm(-1)} fill={LOOK.foam} opacity={0.75} />
      </g>
      {/* the hull: one key light from the upper left; seen from below the surface, what is above it is dimmer */}
      <g opacity={hullA}>
        {faces.map((q, i) => (
          <polygon
            key={i}
            points={q.sp.map((p) => `${r(p.x)},${r(p.y)}`).join(" ")}
            fill={shade(q.f.color, q.lightK)}
            stroke={shade(q.f.color, q.lightK)}
            strokeWidth={0.6}
            strokeLinejoin="round"
            opacity={q.f.above ? 1 - 0.4 * under : 1}
          />
        ))}
      </g>
    </svg>
  );
};

const NoEyesOnItV2: React.FC<Props> = ({ debugMeasured }) => {
  const frame = useCurrentFrame();
  const rig = rigAt(frame);
  if (debugMeasured) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000" }}>
        <SeafloorGlobe rig={rig} time={frame / FPS} flood={floodT(frame)} frame={frame} debug />
      </AbsoluteFill>
    );
  }
  const cam = { x: 540, y: 960, k: 1 };
  const pool = rig.mode === "plane" ? rig.c.pp : { x: rig.g.cx, y: rig.g.cy };
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground }}>
      <StoutStage
        S={frame}
        cam={cam}
        pool={{ x: pool.x, y: pool.y, strength: 1 }}
        overlay={
          <>
            <SeafloorGlobe rig={rig} time={frame / FPS} flood={floodT(frame)} frame={frame} />
            <Ship rig={rig} frame={frame} />
          </>
        }
      />
    </AbsoluteFill>
  );
};

export default NoEyesOnItV2;
