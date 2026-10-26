// ---------------------------------------------------------------------------
// medMapWorld: THE MEDITERRANEAN MAP WORLD of kyle-rome-industrial (Dwarkesh 3D style), built with cut 45
// (WheatForGlass), reused by cut 56 (HubsOfExchange). A real baked map of the Mediterranean (medMapData.ts +
// medmapLevels*.ts, scripts/maps/configs/kyle-rome-industrial.mjs, tiles in public/kyle-rome-industrial/medmap/) laid as a
// GROUND PLANE inside the teal air, under ONE pinhole camera; small 3D props on it at map scale. The pattern is
// kyle-pandemics/RodentFromCentralAsia (rodentCamera / rodentGround): a WebGL ray cast per pixel onto the plane Y = 0,
// and every SVG overlay projected through the same camera, so everything sits on one ground. Read-only for cut 56:
// changes after MEDMAP_READY keep the old exports and are logged in <notes>/SHARED_CHANGES.md.
//
// THE WORLD (medMapData.ts): map world px, ~1 km each (LCC 33/43 N, centre meridian 18 E). 3D point (X, Y, Zm):
//   X = map x (east), Y = height above the ground (up +), Zm = map y (south +; north recedes). The ORIGIN (29.90 E,
//   31.20 N, Alexandria's Great Harbour) is (0, 0, 0). Things on it are drawn at SYMBOLIC scales:
//   - ALEXANDRIA at the origin (the quay, its paving and people, the harbour basin, the moles, the houses, the Pharos):
//     M_WPX = 1.2 world px per metre (a man 1.75 m = 2.1 world px), so a cut can stand people on its quay close up
//     and the whole city is a small cluster (~100 x 130 world px) on the delta's western edge at the eastern-Med view;
//   - ships: SHIP_WPX (= M_WPX: the 35 m model) in the harbour; a cut may grow a ship's scale as its camera climbs (a
//     map symbol: cut 45 grows it 2.4x by the eastern-Med view);
//   - the glass workshop at Sidon at WORKSHOP_M (6.6 world px per metre: a building that reads at the eastern-Med view).
//
// EXPORTS
//   camera:  W, H, F (focal px), type Cam / CamKey3, camFrom(tx, ty, tz, D, pitchDeg, yawDeg), makeTrack(keys, duration)
//            -> { camAt(frame), path }, toScreen(cam, X, Y, Zm) -> { x, y, z, s }, groundAt(cam, sx, sy),
//            horizonY(cam), northYaw(x, y) (deg: the local meridian, 0 = map-up, + = east), M_WPX, QUAY (the quay's
//            local frame at the origin: quayPt(u, v), u along the coast ENE, v toward the sea NNW, metres * M_WPX)
//   city:    alexandriaItems(cam, air, frame, { pharosLit }) (houses, the two moles round the harbour basin, the
//            Pharos at its mouth; pharosLit 0..1 lights its fire ORANGE, for cut 56), HARBOUR (mooring, mouth, Pharos)
//   haze:    hazeOf(dist, D), the ground's distance haze (one function for the shader and every overlay)
//   the air: medAir(cam, frame, rest) -> { v (AirView for <AirStage>), near, far (RGB), fogTo(hex, dist) }
//   ground:  <MedGround cam frame air quay /> (WebGL2: RENDER WITH --gl=angle): the map's land a warm sand-umber, the
//            seas a teal-petrol inside the air, a soft coast rim, the Nile and its fertile fan (fields of khaki-ochre
//            wheat), the quay's paving and harbour water round the origin (weight `quay` 0..1), a slow sea shimmer, the
//            distance haze; transparent above the horizon (AirStage's air shows)
//   meshes:  type Face, faceItems(cam, air, faces, uid) -> painter items { z, el }; LIGHT
//   props:   corbitaFaces(o) + <Corbita> (a Roman merchant ship: rounded hull, swan-neck stern, one square cream sail,
//            the artemon; cargo "wheat" sacks | "glass" crates | "none"), shipOnPath(path, s) / makePath(pts),
//            <Wake>, <GlassWorkshop> (Sidon: a workshop and its beehive furnace, the mouth glowing ORANGE: glassblowing,
//            invented on this coast in the 1st c. BC, is the clip's technology accent), <GroundLabel> (map type lying on
//            the ground, Fell SC, sliding north while it fades in), MED_FONT
//   places:  re-exported from medMapData (PLACES, ROUTES, NILE, DELTA, ORIGIN, ALEX_COAST, project)
// ---------------------------------------------------------------------------
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { AIR, formTone, makeAirView, mixHex, rgbHex, type AirScene, type AirView, type Mat, type RGB } from "../kyle-pandemics/pandemicAir";
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip } from "../kits/maps/incaShared";
import { ALEX_COAST, DELTA, MASK_BOX, MASK_LAND_D, NILE, ORIGIN, PLACES, ROUTES, project } from "./medMapData";
import { MEDMAP_LEVELS_MED, MEDMAP_PAD, MEDMAP_TILE, type MedmapLevel } from "./medmapLevels";

export { ALEX_COAST, DELTA, NILE, ORIGIN, PLACES, ROUTES, project };

export const W = 1080;
export const H = 1920;
/** focal length, px (vertical field ~72 deg), as the rodent camera */
export const F = 1300;
/** symbolic scale of people, goods and ships on the map: world px per metre (a man 1.75 m = 5 world px) */
export const M_WPX = 1.2;
/** the glass workshop's scale (world px per metre): three times the people's, so it reads at the eastern-Med view */
export const WORKSHOP_M = 6.6;
const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export const MED_FONT = fellSC;

const PAL = AIR.A;
export type V3 = [number, number, number];
export type P2 = [number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const f2 = (v: number) => v.toFixed(2);

// ===================================================================================================================
// THE CAMERA (rodentCamera's pinhole: a target T, a distance D, pitched down, yawed; one VP on the centre line)
// ===================================================================================================================
export type Cam = { C: V3; f: V3; r: V3; u: V3; D: number; pitch: number; yaw: number; T: V3 };
/** yaw in degrees: the bearing of the view (0 = map-up, + = toward the east) */
export const camFrom = (tx: number, ty: number, tz: number, D: number, pitchDeg: number, yawDeg: number): Cam => {
  const yaw = (yawDeg * Math.PI) / 180;
  const p = (pitchDeg * Math.PI) / 180;
  const f: V3 = [Math.sin(yaw) * Math.cos(p), -Math.sin(p), -Math.cos(yaw) * Math.cos(p)];
  const r: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const u = cross(r, f);
  const C: V3 = [tx - D * f[0], ty - D * f[1], tz - D * f[2]];
  return { C, f, r, u, D, pitch: pitchDeg, yaw: yawDeg, T: [tx, ty, tz] };
};
/** the LCC pole's image: the map's meridians are rays from it */
export const POLE: P2 = project(18, 89.99999);
/** the bearing (deg) of the local meridian at map point (x, y): "looking north" there */
export const northYaw = (x: number, y: number) => (Math.atan2(POLE[0] - x, -(POLE[1] - y)) * 180) / Math.PI;

/** a camera key: target (map x, height, map y), distance, pitch (deg down), yaw (deg, bearing) */
export type CamKey3 = { f: number; tx: number; ty?: number; tz: number; D: number; pitch: number; yaw: number };
/** keys -> pchip per channel (log D) -> the house damped follow (CAM_STIFF / CAM_DAMP), pre-rolled so f0 is already
 *  moving as the keys say (rodentCamera's track) */
export const makeTrack = (keys: CamKey3[], duration: number, o: { pre?: number; lead?: number } = {}) => {
  const ch = [
    pchip(keys.map((q) => [q.f, q.tx] as [number, number])),
    pchip(keys.map((q) => [q.f, q.ty ?? 0] as [number, number])),
    pchip(keys.map((q) => [q.f, q.tz] as [number, number])),
    pchip(keys.map((q) => [q.f, Math.log(q.D)] as [number, number])),
    pchip(keys.map((q) => [q.f, q.pitch] as [number, number])),
    pchip(keys.map((q) => [q.f, q.yaw] as [number, number])),
  ];
  const target = (f: number) => ch.map((c) => c(f));
  const PRE = o.pre ?? 60;
  const LEAD = o.lead ?? 5;
  let s = target(-PRE + LEAD);
  let v = s.map(() => 0);
  const raw: number[][] = [];
  for (let fr = -PRE + 1; fr <= duration + 2; fr++) {
    const t = target(fr + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (fr >= 0) raw.push([...s]);
  }
  const at = (q: number[]) => camFrom(q[0], q[1], q[2], Math.exp(q[3]), q[4], q[5]);
  const path = raw.map(at);
  const camAt = (frame: number): Cam => {
    const i = Math.max(0, Math.min(raw.length - 2, Math.floor(frame)));
    const t = Math.max(0, Math.min(1, frame - i));
    if (t === 0) return path[i];
    return at(raw[i].map((a, j) => a + (raw[i + 1][j] - a) * t));
  };
  return { camAt, path, raw };
};

export type Scr = { x: number; y: number; z: number; s: number };
/** a 3D point -> screen (x, y), its depth along the view axis z and its scale s (screen px per world px) */
export const toScreen = (cam: Cam, X: number, Y: number, Zm: number): Scr => {
  const d: V3 = [X - cam.C[0], Y - cam.C[1], Zm - cam.C[2]];
  const z = dot(d, cam.f);
  const zz = Math.max(z, 1e-6);
  return { x: W / 2 + (F * dot(d, cam.r)) / zz, y: H / 2 - (F * dot(d, cam.u)) / zz, z, s: F / zz };
};
/** the ground point under a screen pixel (null above the horizon) */
export const groundAt = (cam: Cam, sx: number, sy: number): P2 | null => {
  const a = (sx - W / 2) / F;
  const b = -(sy - H / 2) / F;
  const dir: V3 = [cam.f[0] + a * cam.r[0] + b * cam.u[0], cam.f[1] + a * cam.r[1] + b * cam.u[1], cam.f[2] + a * cam.r[2] + b * cam.u[2]];
  if (dir[1] >= -1e-9) return null;
  const t = -cam.C[1] / dir[1];
  return [cam.C[0] + t * dir[0], cam.C[2] + t * dir[2]];
};
/** the screen-space horizon y (on the centre line) */
export const horizonY = (cam: Cam) => H / 2 - F * Math.tan((cam.pitch * Math.PI) / 180);
/** distance from the camera to a 3D point */
export const distTo = (cam: Cam, X: number, Y: number, Zm: number) => Math.hypot(X - cam.C[0], Y - cam.C[1], Zm - cam.C[2]);

// ===================================================================================================================
// THE QUAY'S FRAME AT THE ORIGIN: u along the coast (ENE), v out to sea (NNW), both in world px
// ===================================================================================================================
const QO = ALEX_COAST.mid;
const QC = ALEX_COAST.dir;
const QN = ALEX_COAST.sea;
export const QUAY = {
  O: QO as P2,
  C: QC as P2,
  N: QN as P2,
  /** half-length of the paved quay along the coast, its depth inland (world px) */
  half: 46 * M_WPX,
  depth: 44 * M_WPX,
  /** the bearing (deg) of the view straight out to sea */
  seaYaw: (Math.atan2(QN[0], -QN[1]) * 180) / Math.PI,
};
/** the world point u along the quay, v out to sea (world px) */
export const quayPt = (u: number, v: number): P2 => [QO[0] + QC[0] * u + QN[0] * v, QO[1] + QC[1] * u + QN[1] * v];

// ===================================================================================================================
// HAZE (the ground's distance haze; every overlay uses the same function)
// ===================================================================================================================
/** the haze's distance scale: the camera distance, held up close (a close-up still sees the harbour behind) */
export const hazeScale = (D: number) => Math.hypot(D, 30);
export const hazeOf = (dist: number, D: number) => {
  const r = dist / hazeScale(D);
  const h0 = 0.8 * sstep(1.6, 4.4, r);
  return h0 + (1 - h0) * sstep(3.5, 14, r);
};

// ===================================================================================================================
// THE AIR (AIR_READY.md, palette A, mood day): the medium of one frame
// ===================================================================================================================
const AIR_SCENE: AirScene = { look: "A", mood: "day", F, fogNear: 400, fogVis: 3000, fogMax: 0.9, hLow: 0, hHigh: 2600, moteUnit: 320 };
export type MedAir = { v: AirView; near: RGB; far: RGB; D: number; fogTo: (hex: string, dist: number) => string; fogAmt: (dist: number) => number; airHexAt: (dist: number) => string };
const camOf = (c: Cam) => ({ x: c.C[0], y: c.C[1], z: -c.C[2] });
export const medAir = (cam: Cam, frame: number, rest: Cam): MedAir => {
  const v = makeAirView({ scene: AIR_SCENE, frame, horizon: horizonY(cam), cam: camOf(cam), rest: camOf(rest) });
  const near = v.airAt(cam.D * 1.5, 0);
  const far = v.airAt(1e9, 0);
  const airAtDist = (dist: number): RGB => {
    const t = sstep(1.4, 4.2, dist / hazeScale(cam.D));
    return [near[0] + (far[0] - near[0]) * t, near[1] + (far[1] - near[1]) * t, near[2] + (far[2] - near[2]) * t];
  };
  const fogAmt = (dist: number) => hazeOf(dist, cam.D);
  const fogTo = (hex: string, dist: number) => mixHex(hex, rgbHex(airAtDist(dist)), fogAmt(dist));
  return { v, near, far, D: cam.D, fogTo, fogAmt, airHexAt: (d) => rgbHex(airAtDist(d)) };
};

// ===================================================================================================================
// THE GROUND (WebGL2)
// ===================================================================================================================
const TILE_DIR = "kyle-rome-industrial/medmap";
/** the fertile-land masks' texels per world px */
const MASK_S = 4;

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
uniform sampler2D tL0, tL1, tL2, tL3, tFert, tRiver, tMot;
uniform vec4 uL0, uL1, uL2, uL3;   // level world boxes: x0, y0, w, h
uniform vec2 uB1, uB2, uB3;        // k bands
uniform vec4 uMaskBox;
uniform float uQuay;               // the quay layer's weight (0..1)
uniform vec2 uQO, uQC, uQN, uQExt; // the quay frame: origin, along, sea; half-length, depth
uniform float uM;                  // world px per metre
uniform float uTime;
uniform vec2 uMotO;
uniform vec3 uAirNear, uAirFar, uGroundOff, uSeaNew, uGMid, uGLit, uGDark, uShadow;
uniform vec3 uStoneLit, uStoneMid, uStoneDark, uCream;
uniform vec3 uWheatA, uWheatB, uWheatC, uRiverCol;

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
  float inL0 = sstep(0.0, 200.0, inset(uL0, p));
  float lk = log(k);
  float w1 = sstep(log(uB1.x), log(uB1.y), lk) * sstep(0.0, 40.0, inset(uL1, p) * k);
  c = mix(c, level(tL1, uL1, p), w1);
  float w2 = sstep(log(uB2.x), log(uB2.y), lk) * sstep(0.0, 40.0, inset(uL2, p) * k);
  c = mix(c, level(tL2, uL2, p), w2);
  float w3 = sstep(log(uB3.x), log(uB3.y), lk) * sstep(0.0, 40.0, inset(uL3, p) * k);
  c = mix(c, level(tL3, uL3, p), w3);
  return mix(LAND, c, inL0);
}
/** anti-aliased lines at period, width (in q's units), faded out as they get too fine on screen */
float lines(float q, float period, float width) {
  float fw = fwidth(q);
  float d = abs(fract(q / period + 0.5) - 0.5) * period;
  float vis = sstep(2.5, 5.0, period / max(fw, 1e-6));
  return (1.0 - sstep(width * 0.5 - fw * 0.7, width * 0.5 + fw * 0.7, d)) * vis;
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
  float hz0 = 0.8 * sstep(1.6, 4.4, hr);
  float haze = hz0 + (1.0 - hz0) * sstep(3.5, 14.0, hr);

  float wpp = max(length(dFdx(p)), length(dFdy(p))) * uScale;
  float k = 1.0 / max(wpp, 1e-6);
  vec3 col = mapAt(p, k);
  // the map's cream lines (coast, water-lines) a touch heavier on the near map (rodentGround's five taps)
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
  col = mix(col, vec3(0.95, 0.92, 0.86), ln * 0.62 * (1.0 - sstep(1.6, 4.0, hr)));

  // the Nile's fertile land: fields of wheat (khaki-ochre, muted), dykes between them, furrows up close
  vec2 mu = (p - uMaskBox.xy) / uMaskBox.zw;
  float inMask = step(0.0, mu.x) * step(mu.x, 1.0) * step(0.0, mu.y) * step(mu.y, 1.0);
  float fert = texture(tFert, mu).r * inMask;
  if (fert > 0.002) {
    float ca = 0.42;
    vec2 q = vec2(cos(ca) * p.x + sin(ca) * p.y, -sin(ca) * p.x + cos(ca) * p.y);
    vec2 cs = vec2(3.6, 2.4);
    float row = floor(q.y / cs.y);
    float qx = q.x + 0.5 * cs.x * mod(row, 2.0);
    vec2 cell = vec2(floor(qx / cs.x), row);
    float h = hash2(cell);
    vec3 tone = h < 0.45 ? uWheatA : (h < 0.8 ? uWheatB : uWheatC);
    tone *= 0.96 + 0.08 * hash2(cell + 17.0);
    float dyke = max(lines(qx, cs.x, 0.22), lines(q.y, cs.y, 0.22));
    float fur = lines(q.y, 0.42, 0.13) * sstep(4.0, 9.0, k);
    vec3 fc2 = mix(tone, uGDark, 0.38 * dyke + 0.1 * fur);
    col = mix(col, fc2, fert * 0.9);
  }
  float riv = texture(tRiver, mu).r * inMask;
  col = mix(col, uRiverCol, riv * 0.92);

  // the quay at the origin: paving on the land side, harbour water on the sea side
  if (uQuay > 0.001) {
    vec2 d0 = p - uQO;
    float u = dot(d0, uQC);
    float v = dot(d0, uQN);
    float alongW = 1.0 - sstep(uQExt.x * 0.82, uQExt.x, abs(u));
    vec3 qc;
    float qw;
    if (v < 0.0) {
      // paving: courses 0.5 m deep, stones 0.8 m long, running bond; the coping: one course of big stones at the edge
      float m = uM;
      float vv = -v;
      bool coping = vv < 0.62 * m;
      float rowH = coping ? 0.62 * m : 0.5 * m;
      float vr = coping ? vv : vv - 0.62 * m;
      float row = floor(vr / rowH) + (coping ? 100.0 : 0.0);
      float len = coping ? 1.4 * m : 0.8 * m;
      float uu = u + 0.5 * len * mod(row, 2.0) + 0.27 * len * hash2(vec2(row, 3.0));
      vec2 stone = vec2(floor(uu / len), row);
      float hs = hash2(stone);
      vec3 base = mix(uStoneMid, uStoneLit, 0.45 + 0.3 * hs);
      if (coping) base = mix(uStoneLit, uCream, 0.12);
      float jt = max(lines(uu, len, 0.06 * m), coping ? 0.0 : lines(vr, rowH, 0.06 * m));
      jt = max(jt, lines(vv, 0.62 * m, 0.07 * m) * (1.0 - step(0.9 * m, vv)));
      qc = mix(base, uStoneDark, 0.22 * jt);
      // the coping's lit edge
      float edge = 1.0 - sstep(0.0, 0.06 * m + fwidth(v) * 1.2, vv);
      qc = mix(qc, uCream, 0.55 * edge);
      qw = alongW * (1.0 - sstep(uQExt.y * 0.7, uQExt.y, vv));
    } else {
      // harbour water: the sea's teal, slow ripples along the quay, the quay wall's shadow on the water
      float rip = 0.5 + 0.5 * sin(v / (0.9 * uM) * 6.2831 - uTime * 0.05 + 0.6 * sin(u / (7.0 * uM) + uTime * 0.013));
      float rip2 = 0.5 + 0.5 * sin((v * 0.6 + u * 0.35) / (1.7 * uM) * 6.2831 + uTime * 0.035);
      qc = uSeaNew * (0.95 + 0.05 * rip + 0.04 * rip2);
      qc = mix(qc, uShadow, 0.35 * (1.0 - sstep(0.0, 0.9 * uM, v)));
      qw = alongW * (1.0 - sstep(66.0 * uM, 80.0 * uM, v));
    }
    col = mix(col, qc, qw * uQuay);
  }

  // the sea's slow shimmer: soft travelling ripples, a few glints (screen-steady scale, world-anchored)
  {
    float sea2 = seaW * (1.0 - uQuay * 0.9);
    if (sea2 > 0.01) {
      float per = 22.0 / k;
      float lp = log2(per);
      float o = floor(lp);
      float bl = lp - o;
      float p1 = exp2(o);
      float s1 = sin((p.x * 0.8 + p.y * 0.6) / p1 * 6.2831 + uTime * 0.09) * sin((p.x * -0.5 + p.y * 0.86) / (p1 * 1.7) * 6.2831 - uTime * 0.06);
      float s2 = sin((p.x * 0.8 + p.y * 0.6) / (p1 * 2.0) * 6.2831 + uTime * 0.09) * sin((p.x * -0.5 + p.y * 0.86) / (p1 * 3.4) * 6.2831 - uTime * 0.06);
      float s = mix(s1, s2, bl);
      float glint = sstep(0.55, 0.95, s);
      col = mix(col, uCream, glint * 0.07 * sea2 * (1.0 - haze));
      col *= 1.0 + 0.025 * s * sea2;
    }
  }

  // the mottle on the ground (world space, two octaves; soft patches only)
  {
    float m0 = texture(tMot, p / uMotO.x).a;
    float m1 = texture(tMot, p / (uMotO.x * 2.0) + 0.37).a;
    float mm = mix(m0, m1, uMotO.y);
    col = mix(col, uShadow, clamp(mm * 0.3, 0.0, 1.0));
  }

  col = mix(col, mix(uAirNear, uAirFar, sstep(1.4, 4.2, hr)), haze);
  outColor = vec4(col, 1.0);
}`;

type GLRes = { gl: WebGL2RenderingContext; loc: Record<string, WebGLUniformLocation | null>; boxes: [number, number, number, number][] };

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(`medMapWorld: ${src} did not load`));
    im.src = src;
  });
const stitch = async (L: MedmapLevel) => {
  const c = document.createElement("canvas");
  c.width = L.cols * MEDMAP_TILE;
  c.height = L.rows * MEDMAP_TILE;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const jobs: Promise<void>[] = [];
  for (let r = 0; r < L.rows; r++)
    for (let q = 0; q < L.cols; q++) {
      const code = L.cells[r * L.cols + q];
      if (code === "#") {
        jobs.push(
          loadImg(staticFile(`${TILE_DIR}/med-${L.name}-${q}-${r}.png`)).then((im) => {
            ctx.drawImage(im, MEDMAP_PAD, MEDMAP_PAD, MEDMAP_TILE, MEDMAP_TILE, q * MEDMAP_TILE, r * MEDMAP_TILE, MEDMAP_TILE, MEDMAP_TILE);
          }),
        );
      } else if (code !== ".") {
        ctx.fillStyle = L.colors[code.charCodeAt(0) - 97];
        ctx.fillRect(q * MEDMAP_TILE, r * MEDMAP_TILE, MEDMAP_TILE, MEDMAP_TILE);
      }
    }
  await Promise.all(jobs);
  return c;
};
/** the fertile land (the delta's fan + a strip along the Nile, clipped to land) and the river, as two masks */
const maskCanvases = () => {
  const b = MASK_BOX;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = Math.ceil((b.x1 - b.x0) * MASK_S);
    c.height = Math.ceil((b.y1 - b.y0) * MASK_S);
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(MASK_S, 0, 0, MASK_S, -b.x0 * MASK_S, -b.y0 * MASK_S);
    return { c, ctx };
  };
  const pathOf = (pts: P2[], close = false) => {
    const p = new Path2D();
    pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])));
    if (close) p.closePath();
    return p;
  };
  const land = new Path2D(MASK_LAND_D);
  // fertile
  const fe = mk();
  fe.ctx.fillStyle = "#fff";
  fe.ctx.strokeStyle = "#fff";
  fe.ctx.lineJoin = "round";
  fe.ctx.lineCap = "round";
  fe.ctx.fill(pathOf(DELTA, true));
  fe.ctx.lineWidth = 15;
  fe.ctx.stroke(pathOf(NILE.main));
  fe.ctx.lineWidth = 9;
  fe.ctx.stroke(pathOf(NILE.rosetta));
  fe.ctx.stroke(pathOf(NILE.damietta));
  fe.ctx.globalCompositeOperation = "destination-in";
  fe.ctx.fill(land, "evenodd");
  // the river
  const rv = mk();
  rv.ctx.strokeStyle = "#fff";
  rv.ctx.lineJoin = "round";
  rv.ctx.lineCap = "round";
  rv.ctx.lineWidth = 1.7;
  rv.ctx.stroke(pathOf(NILE.main));
  rv.ctx.lineWidth = 1.15;
  rv.ctx.stroke(pathOf(NILE.rosetta));
  rv.ctx.stroke(pathOf(NILE.damietta));
  rv.ctx.globalCompositeOperation = "destination-in";
  rv.ctx.fill(land, "evenodd");
  return [fe.c, rv.c];
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
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`medMapWorld shader: ${gl.getShaderInfoLog(s)}`);
    return s;
  };
  const prog = gl.createProgram() as WebGLProgram;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(`medMapWorld link: ${gl.getProgramInfoLog(prog)}`);
  return prog;
};
const UNIFORMS = [
  "uBuf", "uScale", "uC", "uF", "uR", "uU", "uFocal", "uDh", "tL0", "tL1", "tL2", "tL3", "tFert", "tRiver", "tMot", "uL0", "uL1", "uL2", "uL3", "uB1", "uB2", "uB3",
  "uMaskBox", "uQuay", "uQO", "uQC", "uQN", "uQExt", "uM", "uTime", "uMotO", "uAirNear", "uAirFar", "uGroundOff", "uSeaNew", "uGMid", "uGLit", "uGDark", "uShadow",
  "uStoneLit", "uStoneMid", "uStoneDark", "uCream", "uWheatA", "uWheatB", "uWheatC", "uRiverCol",
];
const init = async (canvas: HTMLCanvasElement): Promise<GLRes> => {
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false, alpha: true });
  if (!gl) throw new Error("medMapWorld: no WebGL2 (render with --gl=angle)");
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
  const levels = MEDMAP_LEVELS_MED;
  if (levels.length !== 4) throw new Error("medMapWorld: expects the 4 levels m0..m3");
  for (const L of levels) if (L.cols * MEDMAP_TILE > maxTex || L.rows * MEDMAP_TILE > maxTex) throw new Error(`medMapWorld: level ${L.name} exceeds MAX_TEXTURE_SIZE ${maxTex}`);
  const canv = await Promise.all(levels.map(stitch));
  canv.forEach((c, i) => {
    texFrom(gl, i, c, {});
    c.width = 1;
    c.height = 1;
  });
  const [fe, rv] = maskCanvases();
  texFrom(gl, 4, fe, { mask: true });
  texFrom(gl, 5, rv, { mask: true });
  fe.width = 1;
  rv.width = 1;
  const mot = await loadImg(staticFile(`${TILE_DIR}/mottle.png`));
  texFrom(gl, 6, mot, { repeat: true });
  ["tL0", "tL1", "tL2", "tL3", "tFert", "tRiver", "tMot"].forEach((n, i) => gl.uniform1i(loc[n], i));
  const boxes = levels.map((L) => [L.x0, L.y0, L.cols * L.tw, L.rows * L.tw] as [number, number, number, number]);
  return { gl, loc, boxes };
};

const hex01 = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
const LAND01 = hex01("#3F3428");
/** the wheat fields (muted khaki-ochre, nowhere near the orange): ripe, greener, stubble */
export const WHEAT = { a: "#A0925F", b: "#8C8A5E", c: "#B3A479" };
export const SEA_HEX = "#2B4545";
export type GroundAir = { near: RGB; far: RGB };
const draw = (R: GLRes, cam: Cam, frame: number, scale: number, air: GroundAir, quay: number) => {
  const { gl, loc } = R;
  const lv = MEDMAP_LEVELS_MED;
  const u3 = (n: string, v: number[]) => gl.uniform3fv(loc[n], v);
  u3("uAirNear", air.near.map((v) => v / 255));
  u3("uAirFar", air.far.map((v) => v / 255));
  const gm = hex01(PAL.ground.mid);
  gl.uniform3f(loc.uGroundOff, gm[0] - LAND01[0], gm[1] - LAND01[1], gm[2] - LAND01[2]);
  u3("uSeaNew", hex01(SEA_HEX));
  u3("uGMid", gm);
  u3("uGLit", hex01(PAL.ground.lit));
  u3("uGDark", hex01(PAL.ground.dark));
  u3("uShadow", hex01(PAL.shadow));
  u3("uStoneLit", hex01(PAL.stone.lit));
  u3("uStoneMid", hex01(PAL.stone.mid));
  u3("uStoneDark", hex01(PAL.stone.dark));
  u3("uCream", hex01(PAL.cream));
  u3("uWheatA", hex01(WHEAT.a));
  u3("uWheatB", hex01(WHEAT.b));
  u3("uWheatC", hex01(WHEAT.c));
  u3("uRiverCol", hex01("#3E6662"));
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
  gl.uniform1f(loc.uQuay, quay);
  gl.uniform2fv(loc.uQO, QO);
  gl.uniform2fv(loc.uQC, QC);
  gl.uniform2fv(loc.uQN, QN);
  gl.uniform2f(loc.uQExt, QUAY.half, QUAY.depth);
  gl.uniform1f(loc.uM, M_WPX);
  gl.uniform1f(loc.uTime, frame);
  const ml = Math.log2(cam.D * 1.1);
  const mo = Math.floor(ml);
  gl.uniform2f(loc.uMotO, Math.pow(2, mo), ml - mo);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
};

let SHARED: Promise<GLRes> | null = null;
/** the ground canvas (full frame, under every overlay). quay: the paved quay + harbour water at the origin (0..1) */
export const MedGround: React.FC<{ cam: Cam; frame: number; air: GroundAir; quay?: number }> = ({ cam, frame, air, quay = 0 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [res, setRes] = useState<GLRes | null>(null);
  const [handle] = useState(() => delayRender("medMapWorld: building the ground textures", { timeoutInMilliseconds: 240000 }));
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
    draw(res, cam, frame, scale, air, quay);
    if (!done.current) {
      done.current = true;
      continueRender(handle);
    }
  }, [res, cam, frame, scale, handle, air, quay]);
  return <canvas ref={ref} width={Math.round(W * scale)} height={Math.round(H * scale)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

// ===================================================================================================================
// MESHES: flat-shaded faces projected through the camera, painter-sorted, lit from the upper left, fogged
// ===================================================================================================================
/** the light: from the upper left of a north-looking frame (west, high, a little from the viewer's side) */
export const LIGHT: V3 = norm3([-0.55, 0.78, 0.3]);
export type Face = {
  pts: V3[];
  mat: Mat;
  /** (default) two-sided: never culled, lit from whichever side faces the camera; painter order by depth keeps a
   *  convex volume right. `cull: true` drops a face turned away */
  two?: boolean;
  cull?: boolean;
  /** a flat colour (no form light) */
  flat?: string;
  /** draw the outline (default true) */
  line?: boolean;
  /** a cream rim on the face's first edge */
  rim?: boolean;
  /** depth bias (world px, + = drawn later) */
  bias?: number;
  /** orange (half the fog, the accent outline) */
  orange?: boolean;
  op?: number;
};
export type Item = { z: number; el: React.ReactNode };
export const ORANGE_LINE = "#8A4A0E";
export const lineOfMat = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);
/** faces -> painter items (one per visible face) */
export const faceItems = (cam: Cam, air: MedAir, faces: Face[], uid: string, o: { lw?: number; fogBoost?: number } = {}): Item[] => {
  const out: Item[] = [];
  const lw = o.lw ?? 0.9;
  faces.forEach((fc, i) => {
    // clip against the near plane in camera space (a face crossing it is cut, never dropped: no pops)
    const NEAR = 0.15;
    const cs = fc.pts.map((q) => {
      const d: V3 = [q[0] - cam.C[0], q[1] - cam.C[1], q[2] - cam.C[2]];
      return [dot(d, cam.r), dot(d, cam.u), dot(d, cam.f)] as V3;
    });
    let poly = cs;
    if (cs.some((c) => c[2] < NEAR)) {
      const out: V3[] = [];
      for (let k = 0; k < cs.length; k++) {
        const a = cs[k];
        const b = cs[(k + 1) % cs.length];
        if (a[2] >= NEAR) out.push(a);
        if (a[2] >= NEAR !== b[2] >= NEAR) {
          const t = (NEAR - a[2]) / (b[2] - a[2]);
          out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
        }
      }
      if (out.length < 3) return;
      poly = out;
    }
    const sc = poly.map((c) => ({ x: W / 2 + (F * c[0]) / c[2], y: H / 2 - (F * c[1]) / c[2] }));
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
      if (fc.cull) return;
      n = [-n0[0], -n0[1], -n0[2]];
    }
    const dist = Math.hypot(toCam[0], toCam[1], toCam[2]);
    const fogA = c01(air.fogAmt(dist) + (o.fogBoost ?? 0));
    const ndl = dot(n, LIGHT);
    const base = fc.flat ?? formTone(fc.mat, ndl, PAL.shadow);
    const air2 = air.airHexAt(dist);
    const fill = mixHex(base, air2, fc.orange ? fogA * 0.5 : fogA);
    const ln = mixHex(fc.orange ? ORANGE_LINE : lineOfMat(fc.mat), air2, fogA);
    const d = `M${sc.map((s) => `${f2(s.x)},${f2(s.y)}`).join("L")}Z`;
    const z = dot(sub3(cen, cam.C), cam.f) - (fc.bias ?? 0);
    out.push({
      z,
      el: (
        <g key={`${uid}-${i}`} opacity={fc.op ?? 1}>
          <path d={d} fill={fill} stroke={fc.line === false ? fill : ln} strokeWidth={fc.line === false ? 0.6 : lw} strokeLinejoin="round" />
          {fc.rim && poly === cs ? <path d={`M${f2(sc[0].x)},${f2(sc[0].y)}L${f2(sc[1].x)},${f2(sc[1].y)}`} stroke={PAL.cream} strokeOpacity={0.5 * (1 - fogA)} strokeWidth={lw * 1.3} strokeLinecap="round" /> : null}
        </g>
      ),
    });
  });
  return out;
};
/** a stroked 3D polyline (a mast, a rope, an oar) as one painter item at its mean depth */
export const strokeItem = (cam: Cam, air: MedAir, pts: V3[], color: string, widthWpx: number, key: string, o: { op?: number; cap?: "round" | "butt"; bias?: number; minPx?: number } = {}): Item | null => {
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
/** a soft shadow ellipse on the ground (or on the water) at a world point: rx, ry in world px along (east, south) */
export const groundShadowItem = (cam: Cam, air: MedAir, x: number, y: number, rx: number, ry: number, amt: number, key: string, ang = 0): Item | null => {
  const N = 18;
  const pts: P2[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const ex = Math.cos(a) * rx;
    const ey = Math.sin(a) * ry;
    const wx = x + ex * Math.cos(ang) - ey * Math.sin(ang);
    const wy = y + ex * Math.sin(ang) + ey * Math.cos(ang);
    const s = toScreen(cam, wx, 0, wy);
    if (s.z < 0.05) return null;
    pts.push([s.x, s.y]);
  }
  const c = toScreen(cam, x, 0, y);
  const dist = distTo(cam, x, 0, y);
  const a = amt * (1 - air.fogAmt(dist));
  if (a < 0.01) return null;
  const rpx = Math.max(...pts.map((q) => Math.hypot(q[0] - c.x, q[1] - c.y)));
  return {
    z: c.z + 1e6,
    el: (
      <g key={key}>
        <defs>
          <radialGradient id={`${key}-g`} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={f2(rpx)}>
            <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.55 * a} />
            <stop offset="0.55" stopColor={PAL.shadow} stopOpacity={0.3 * a} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
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

// ===================================================================================================================
// THE SHIP: a Roman merchant ship (corbita / Alexandrian grain ship) — rounded hull, swan-neck stern, one square cream
// sail on a yard, the small artemon at the bow, two steering oars. Ship-local (a forward to the bow, b to starboard,
// y up from the waterline), metres; placed at `at` heading `heading` (rad, bearing: 0 = map-up, + = east).
// ===================================================================================================================
/** a ship's default scale (world px per metre of the 35 m model) */
export const SHIP_WPX = M_WPX;
export const SHIP = { L: 35, B: 9.2, free: 2.6, sheerEnd: 2.4, mastA: 1.5, mastH: 21, yardH: 19.2, yardW: 16.5, sailFoot: 7.2 };
export const HULL_MAT: Mat = { lit: "#9C7A55", mid: "#6E5339", dark: "#3A2B1D" };
const DECK_MAT: Mat = { lit: "#B39470", mid: "#8A6E4E", dark: "#4A3826" };
const WALE_MAT: Mat = { lit: "#6A513A", mid: "#4E3B2A", dark: "#2E2219" };
export const SAIL_MAT: Mat = { lit: "#F1E8D6", mid: "#D8CBB0", dark: "#9A8C72" };
export const SACK_MAT: Mat = { lit: "#D9C9A2", mid: "#B8A47C", dark: "#776A50" };
export const CRATE_MAT: Mat = { lit: "#A98A62", mid: "#7C6244", dark: "#3F2F20" };
export const GLASS = { lit: "#CFE6DC", mid: "#9CC7BD", dark: "#5E8C86", line: "#4E7772" };

/** brace: the yard and sail turned about the mast (rad; sailors brace the yard to the wind; default 0.5) so the sail
 *  shows its face from the side too */
export type ShipPose = { at: P2; heading: number; scale?: number; roll?: number; pitch?: number; heave?: number; sail?: number; cargo?: "wheat" | "glass" | "none"; deep?: number; brace?: number };
/** the ship's local frame -> world 3D */
const shipXf = (o: ShipPose) => {
  const s = o.scale ?? SHIP_WPX;
  const fw: P2 = [Math.sin(o.heading), -Math.cos(o.heading)];
  const rt: P2 = [Math.cos(o.heading), Math.sin(o.heading)];
  const roll = o.roll ?? 0;
  const pit = o.pitch ?? 0;
  const heave = (o.heave ?? 0) - (o.deep ?? 0);
  return (a: number, b: number, y: number): V3 => {
    // small roll (about the keel) and pitch (about the beam), then place
    const y1 = y + b * Math.sin(roll) + a * Math.sin(pit) + heave;
    const b1 = b * Math.cos(roll) - y * Math.sin(roll);
    return [o.at[0] + (fw[0] * a + rt[0] * b1) * s, y1 * s, o.at[1] + (fw[1] * a + rt[1] * b1) * s];
  };
};
/** half-beam and sheer of the hull at station a (metres) */
const hullAt = (a: number) => {
  const h = SHIP.L / 2;
  const t = Math.abs(a) / h;
  const bow = a > 0;
  const w = (SHIP.B / 2) * Math.pow(Math.max(0, 1 - Math.pow(t, bow ? 2.4 : 2.0)), bow ? 0.55 : 0.5);
  const sheer = SHIP.free + SHIP.sheerEnd * Math.pow(t, 2.2) * (bow ? 0.8 : 1.15);
  return { w: Math.max(0.12, w), sheer };
};
export const corbitaParts = (o: ShipPose) => {
  const P = shipXf(o);
  const faces: Face[] = [];
  const N = 16;
  const h = SHIP.L / 2;
  const st = Array.from({ length: N + 1 }, (_, i) => -h + (2 * h * i) / N);
  // the hull sides: two strips per side (the bilge tucked in below, the topsides), wale decals along the top
  for (let i = 0; i < N; i++) {
    const a0 = st[i];
    const a1 = st[i + 1];
    const A = hullAt(a0);
    const B = hullAt(a1);
    for (const side of [-1, 1]) {
      const lo0 = A.w * 0.82;
      const lo1 = B.w * 0.82;
      const mid0 = A.sheer * 0.45;
      const mid1 = B.sheer * 0.45;
      const q1: V3[] = [P(a0, side * lo0, 0), P(a1, side * lo1, 0), P(a1, side * B.w, mid1), P(a0, side * A.w, mid0)];
      const q2: V3[] = [P(a0, side * A.w, mid0), P(a1, side * B.w, mid1), P(a1, side * B.w * 0.98, B.sheer), P(a0, side * A.w * 0.98, A.sheer)];
      faces.push({ pts: side > 0 ? q1 : [...q1].reverse(), mat: HULL_MAT, line: false });
      faces.push({ pts: side > 0 ? q2 : [...q2].reverse(), mat: HULL_MAT, line: false, rim: false });
      // the wale: a dark strake just under the gunwale
      const wl: V3[] = [P(a0, side * A.w * 0.995, A.sheer - 0.75), P(a1, side * B.w * 0.995, B.sheer - 0.75), P(a1, side * B.w * 0.99, B.sheer - 0.38), P(a0, side * A.w * 0.99, A.sheer - 0.38)];
      faces.push({ pts: side > 0 ? wl : [...wl].reverse(), mat: WALE_MAT, line: false, bias: 0.01 });
    }
    // the deck strip (the inside of the bulwark seen from above as one surface)
    const dk: V3[] = [P(a0, -A.w * 0.98, A.sheer - 0.25), P(a0, A.w * 0.98, A.sheer - 0.25), P(a1, B.w * 0.98, B.sheer - 0.25), P(a1, -B.w * 0.98, B.sheer - 0.25)];
    faces.push({ pts: dk, mat: DECK_MAT, line: false, two: true, bias: -0.02 });
  }
  // the transom at the stern and the stem at the bow (closing caps)
  const sA = hullAt(-h);
  faces.push({ pts: [P(-h, -sA.w, 0), P(-h, sA.w, 0), P(-h, sA.w, sA.sheer), P(-h, -sA.w, sA.sheer)], mat: HULL_MAT, two: true });
  const bA = hullAt(h);
  faces.push({ pts: [P(h, -bA.w, 0), P(h, bA.w, 0), P(h, bA.w, bA.sheer), P(h, -bA.w, bA.sheer)], mat: HULL_MAT, two: true });
  // strokes: the swan-neck sternpost, the stem, the mast, the yard, the artemon, the steering oars, the stays
  const strokes: { pts: V3[]; color: string; w: number; key: string }[] = [];
  const sh = hullAt(-h).sheer;
  strokes.push({ pts: [P(-h + 0.4, 0, sh - 0.4), P(-h - 0.3, 0, sh + 1.0), P(-h - 0.4, 0, sh + 2.2), P(-h + 0.05, 0, sh + 3.2), P(-h + 0.7, 0, sh + 3.45), P(-h + 1.1, 0, sh + 3.1)], color: HULL_MAT.mid, w: 0.32, key: "neck" });
  const bh = hullAt(h).sheer;
  strokes.push({ pts: [P(h - 0.6, 0, 0), P(h + 0.5, 0, bh * 0.5), P(h + 0.3, 0, bh + 0.6)], color: HULL_MAT.mid, w: 0.45, key: "stem" });
  const deckAtMast = hullAt(SHIP.mastA).sheer - 0.25;
  strokes.push({ pts: [P(SHIP.mastA, 0, deckAtMast), P(SHIP.mastA, 0, SHIP.mastH)], color: "#6A5038", w: 0.42, key: "mast" });
  const brace = o.brace ?? 0.5;
  /** a point da forward of the mast, b across, braced about the mast */
  const BR = (da: number, b: number, y: number) => P(SHIP.mastA + da * Math.cos(brace) - b * Math.sin(brace), da * Math.sin(brace) + b * Math.cos(brace), y);
  strokes.push({ pts: [BR(0.3, -SHIP.yardW / 2, SHIP.yardH), BR(0.3, SHIP.yardW / 2, SHIP.yardH)], color: "#5E4630", w: 0.32, key: "yard" });
  strokes.push({ pts: [P(SHIP.mastA, 0, SHIP.mastH), P(h + 0.2, 0, bh + 0.4)], color: "#8A7A60", w: 0.08, key: "stay" });
  strokes.push({ pts: [P(SHIP.mastA, 0, SHIP.mastH), P(-h + 1.2, 0, sh + 0.2)], color: "#8A7A60", w: 0.08, key: "bstay" });
  // the artemon: a small mast raked forward over the bow
  strokes.push({ pts: [P(h - 2.5, 0, bh - 0.2), P(h + 3.0, 0, bh + 6.0)], color: "#6A5038", w: 0.26, key: "art" });
  for (const side of [-1, 1]) strokes.push({ pts: [P(-h + 3.4, side * (hullAt(-h + 3.4).w + 0.1), hullAt(-h + 3.4).sheer + 0.6), P(-h + 0.6, side * (hullAt(-h + 3.4).w + 0.6), -0.4)], color: "#5E4630", w: 0.3, key: `oar${side}` });
  // the sail: a billowed square under the yard (two-sided), subdivided for its soft form light; brail lines
  const sail = o.sail ?? 1;
  const NX = 6;
  const NY = 4;
  const sw = SHIP.yardW / 2 - 0.6;
  const sy0 = SHIP.yardH - 0.2;
  const sy1 = SHIP.sailFoot;
  const sp = (i: number, j: number): V3 => {
    const u = i / NX;
    const v = j / NY;
    const b = -sw + 2 * sw * u;
    const y = sy0 + (sy1 - sy0) * v;
    const bulge = sail * 1.9 * (1 - Math.pow(2 * u - 1, 2)) * Math.sin(Math.PI * (0.15 + 0.85 * v));
    return BR(0.55 + bulge, b * (1 - 0.06 * v), y);
  };
  // the sail is drawn as ONE smooth cloth (corbitaItems: a soft gradient across it), never as shaded tiles
  const sailGrid = Array.from({ length: NX + 1 }, (_, i) => Array.from({ length: NY + 1 }, (_, j) => sp(i, j)));
  const brails = [1.5, 3, 4.5].map((x, i) => ({ pts: Array.from({ length: NY + 1 }, (_, j) => sp(x, j)), color: "#BCAE92", w: 0.05, key: `br${i}` }));
  // the artemon's small sail
  const artSail: V3[] = [P(h + 1.4, -1.6, bh + 4.4), P(h + 1.4, 1.6, bh + 4.4), P(h + 0.6, 1.4, bh + 1.6), P(h + 0.6, -1.4, bh + 1.6)];
  faces.push({ pts: artSail, mat: SAIL_MAT, two: true, line: false });
  // cargo on deck: rows of sacks (pale oatmeal) or straw crates with glass in them
  const cargo = o.cargo ?? "none";
  const cargoFaces: Face[] = [];
  const glints: { p: V3; key: string }[] = [];
  if (cargo !== "none") {
    const rows = cargo === "wheat" ? [-9, -6.5, -4, 5, 7.5, 10] : [-8.5, -5.5, 5.2, 8.2];
    rows.forEach((a, ri) => {
      const w = hullAt(a).w * 0.78;
      const n = cargo === "wheat" ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const b0 = -w + ((2 * w) / n) * k + 0.15;
        const b1 = -w + ((2 * w) / n) * (k + 1) - 0.15;
        const y0 = hullAt(a).sheer - 0.25;
        const ht = cargo === "wheat" ? 1.05 : 1.2;
        const len = cargo === "wheat" ? 1.9 : 2.3;
        const m = cargo === "wheat" ? SACK_MAT : CRATE_MAT;
        const box = boxFaces(P, a - len / 2, a + len / 2, b0, b1, y0, y0 + ht, m, cargo === "wheat" ? 0.22 : 0);
        cargoFaces.push(...box);
        if (cargo === "glass") glints.push({ p: P(a, (b0 + b1) / 2, y0 + ht + 0.05), key: `gl${ri}-${k}` });
      }
    });
  }
  return { faces: [...faces, ...cargoFaces], strokes: [...strokes, ...brails], glints, P, sailGrid };
};
/** an axis box in a local frame P(a, b, y) (a0 < a1, b0 < b1, y0 < y1); `round` pulls the top edges in (a sack) */
export const boxFaces = (P: (a: number, b: number, y: number) => V3, a0: number, a1: number, b0: number, b1: number, y0: number, y1: number, mat: Mat, round = 0): Face[] => {
  const ia = (a1 - a0) * round;
  const ib = (b1 - b0) * round;
  const t = (a: number, b: number): V3 => P(a, b, y1);
  const top: V3[] = [t(a0 + ia, b0 + ib), t(a0 + ia, b1 - ib), t(a1 - ia, b1 - ib), t(a1 - ia, b0 + ib)];
  const bot = (a: number, b: number): V3 => P(a, b, y0);
  const ym = y1 - (y1 - y0) * 0.25;
  const m = (a: number, b: number): V3 => P(a, b, ym);
  const fs: Face[] = [
    { pts: top, mat, rim: true },
    { pts: [bot(a1, b0), bot(a1, b1), m(a1, b1), m(a1, b0)], mat },
    { pts: [bot(a0, b1), bot(a0, b0), m(a0, b0), m(a0, b1)], mat },
    { pts: [bot(a0, b0), bot(a1, b0), m(a1, b0), m(a0, b0)], mat },
    { pts: [bot(a1, b1), bot(a0, b1), m(a0, b1), m(a1, b1)], mat },
    // the shoulders between the mid ring and the (inset) top
    { pts: [m(a1, b0), m(a1, b1), top[2], top[3]], mat },
    { pts: [m(a0, b1), m(a0, b0), top[0], top[1]], mat },
    { pts: [m(a0, b0), m(a1, b0), top[3], top[0]], mat },
    { pts: [m(a1, b1), m(a0, b1), top[1], top[2]], mat },
  ];
  return fs;
};

/** the ship as painter items: its faces, strokes, the glass glints, its shadow on the water */
export const corbitaItems = (cam: Cam, air: MedAir, o: ShipPose, uid: string, lw = 0.9): Item[] => {
  const parts = corbitaParts(o);
  const items: Item[] = faceItems(cam, air, parts.faces, uid, { lw });
  // the sail: one smooth cloth, its outline the grid's border, a soft gradient from its lit edge to its shaded edge
  {
    const G = parts.sailGrid;
    const NX = G.length - 1;
    const NY = G[0].length - 1;
    const ring: V3[] = [...G.map((c) => c[0]), ...G[NX].slice(1), ...[...G].reverse().map((c) => c[NY]).slice(1), ...G[0].slice(1, NY).reverse()];
    const sc = ring.map((q) => toScreen(cam, q[0], q[1], q[2]));
    if (sc.every((q) => q.z > 0.05)) {
      const toneAt = (i: number) => {
        const a = G[Math.max(0, i - 1)][Math.floor(NY / 2)];
        const b = G[Math.min(NX, i + 1)][Math.floor(NY / 2)];
        const c = G[i][0];
        const d = G[i][NY];
        let n = norm3(cross(sub3(b, a), sub3(d, c)));
        const toCam = sub3(cam.C, G[i][Math.floor(NY / 2)]);
        if (dot(n, toCam) < 0) n = [-n[0], -n[1], -n[2]];
        const mid = G[i][Math.floor(NY / 2)];
        return air.fogTo(formTone(SAIL_MAT, dot(n, LIGHT) * 0.7 + 0.2, PAL.shadow, 0.15), Math.hypot(...sub3(mid, cam.C)));
      };
      const pL = toScreen(cam, ...G[0][Math.floor(NY / 2)]);
      const pR = toScreen(cam, ...G[NX][Math.floor(NY / 2)]);
      const cen = G[Math.floor(NX / 2)][Math.floor(NY / 2)];
      const z = dot(sub3(cen, cam.C), cam.f) + 0.3;
      const gid = `${uid}-sailg`;
      items.push({
        z,
        el: (
          <g key={gid}>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={f2(pL.x)} y1={f2(pL.y)} x2={f2(pR.x)} y2={f2(pR.y)}>
                <stop offset="0" stopColor={toneAt(0)} />
                <stop offset="0.5" stopColor={toneAt(Math.floor(NX / 2))} />
                <stop offset="1" stopColor={toneAt(NX)} />
              </linearGradient>
            </defs>
            <path d={`M${sc.map((q) => `${f2(q.x)},${f2(q.y)}`).join("L")}Z`} fill={`url(#${gid})`} stroke={air.fogTo(SAIL_MAT.dark, Math.hypot(...sub3(cen, cam.C)))} strokeOpacity={0.5} strokeWidth={0.7} strokeLinejoin="round" />
          </g>
        ),
      });
    }
  }
  parts.strokes.forEach((s) => {
    const it = strokeItem(cam, air, s.pts, s.color, s.w * (o.scale ?? SHIP_WPX), `${uid}-${s.key}`, { minPx: 0.5 });
    if (it) items.push(it);
  });
  parts.glints.forEach((g) => {
    const sc = toScreen(cam, g.p[0], g.p[1], g.p[2]);
    if (sc.z < 0.05) return;
    const r = Math.max(0.8, 0.45 * (o.scale ?? SHIP_WPX) * sc.s);
    const dist = distTo(cam, g.p[0], g.p[1], g.p[2]);
    items.push({
      z: sc.z - 0.5,
      el: (
        <g key={`${uid}-${g.key}`}>
          <ellipse cx={f2(sc.x - r * 0.8)} cy={f2(sc.y)} rx={f2(r * 0.55)} ry={f2(r * 0.8)} fill={air.fogTo(GLASS.mid, dist)} />
          <ellipse cx={f2(sc.x + r * 0.7)} cy={f2(sc.y + r * 0.1)} rx={f2(r * 0.5)} ry={f2(r * 0.7)} fill={air.fogTo(GLASS.lit, dist)} />
        </g>
      ),
    });
  });
  return items;
};
/** the ship's soft shadow / darkening on the water round the hull (drawn on the ground, before the ship) */
export const shipWaterItem = (cam: Cam, air: MedAir, o: ShipPose, uid: string): Item | null => {
  const s = o.scale ?? SHIP_WPX;
  const fw: P2 = [Math.sin(o.heading), -Math.cos(o.heading)];
  return groundShadowItem(cam, air, o.at[0] + fw[0] * 0 + 1.2 * s, o.at[1] + 1.0 * s, SHIP.L * 0.58 * s, SHIP.B * 0.9 * s, 0.55, `${uid}-wsh`, Math.atan2(fw[1], fw[0]));
};

// ===================================================================================================================
// PATHS (sea lanes, a ship's course) and the wake
// ===================================================================================================================
export type Path = { pts: P2[]; cum: number[]; len: number };
export const makePath = (pts: P2[]): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
/** a centripetal Catmull-Rom through control points (world px), sampled every ~step */
export const smoothPath = (ctrl: P2[], per = 24): Path => {
  const out: P2[] = [];
  const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const tj = (a: P2, b: P2) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, 0.5);
    const t0 = 0;
    const t1 = t0 + tj(p0, p1);
    const t2 = t1 + tj(p1, p2);
    const t3 = t2 + tj(p2, p3);
    for (let k = 0; k < per; k++) {
      const t = t1 + ((t2 - t1) * k) / per;
      const L = (a: P2, b: P2, ta: number, tb: number): P2 => [((tb - t) / (tb - ta)) * a[0] + ((t - ta) / (tb - ta)) * b[0], ((tb - t) / (tb - ta)) * a[1] + ((t - ta) / (tb - ta)) * b[1]];
      const A1 = L(p0, p1, t0, t1);
      const A2 = L(p1, p2, t1, t2);
      const A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2);
      const B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return makePath(out);
};
/** the point and heading (rad bearing) at arclength s */
export const pathAt = (p: Path, s: number): { at: P2; heading: number } => {
  const ss = Math.max(0, Math.min(p.len, s));
  let i = 0;
  while (i < p.cum.length - 2 && p.cum[i + 1] < ss) i++;
  const t = (ss - p.cum[i]) / Math.max(1e-9, p.cum[i + 1] - p.cum[i]);
  const a = p.pts[i];
  const b = p.pts[i + 1];
  // heading: a smoothed tangent (over ~6 world px) so a sampled corner never snaps the bow
  const back = pointAt(p, ss - 3);
  const fwd = pointAt(p, ss + 3);
  return { at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], heading: Math.atan2(fwd[0] - back[0], -(fwd[1] - back[1])) };
};
const pointAt = (p: Path, s: number): P2 => {
  if (s <= 0) {
    const d = [p.pts[1][0] - p.pts[0][0], p.pts[1][1] - p.pts[0][1]];
    const l = Math.hypot(d[0], d[1]) || 1;
    return [p.pts[0][0] + (d[0] / l) * s, p.pts[0][1] + (d[1] / l) * s];
  }
  if (s >= p.len) {
    const n = p.pts.length;
    const d = [p.pts[n - 1][0] - p.pts[n - 2][0], p.pts[n - 1][1] - p.pts[n - 2][1]];
    const l = Math.hypot(d[0], d[1]) || 1;
    return [p.pts[n - 1][0] + (d[0] / l) * (s - p.len), p.pts[n - 1][1] + (d[1] / l) * (s - p.len)];
  }
  let i = 0;
  while (i < p.cum.length - 2 && p.cum[i + 1] < s) i++;
  const t = (s - p.cum[i]) / Math.max(1e-9, p.cum[i + 1] - p.cum[i]);
  return [p.pts[i][0] + (p.pts[i + 1][0] - p.pts[i][0]) * t, p.pts[i][1] + (p.pts[i + 1][1] - p.pts[i][1]) * t];
};
/** a faint wake on the water behind a ship at arclength s (the passed course, fading toward its tail) */
export const wakeItem = (cam: Cam, air: MedAir, p: Path, s: number, lenWpx: number, uid: string, amt = 1, sternOff = 0): Item | null => {
  const N = 14;
  const segs: React.ReactNode[] = [];
  let zSum = 0;
  let n = 0;
  for (let i = 0; i < N; i++) {
    const sa = s - sternOff - (lenWpx * i) / N;
    const sb = s - sternOff - (lenWpx * (i + 1)) / N;
    if (sb < 0) break;
    const a = pointAt(p, sa);
    const b = pointAt(p, sb);
    const A = toScreen(cam, a[0], 0, a[1]);
    const B = toScreen(cam, b[0], 0, b[1]);
    if (A.z < 0.05 || B.z < 0.05) break;
    const dist = distTo(cam, a[0], 0, a[1]);
    const op = amt * 0.42 * Math.pow(1 - i / N, 1.4) * (1 - air.fogAmt(dist));
    zSum += A.z;
    n++;
    segs.push(<path key={i} d={`M${f2(A.x)},${f2(A.y)}L${f2(B.x)},${f2(B.y)}`} stroke={PAL.cream} strokeOpacity={op} strokeWidth={Math.max(0.8, 1.6 * M_WPX * A.s * (1 - (0.6 * i) / N))} strokeLinecap="round" />);
  }
  if (!n) return null;
  return { z: zSum / n + 1e6 - 1, el: <g key={uid}>{segs}</g> };
};

// ===================================================================================================================
// THE GLASS WORKSHOP (Sidon): a plastered workshop with a red-brown tiled roof, and its beehive furnace whose mouth
// glows ORANGE; a thin wisp of smoke from the furnace's vent. Footprint metres at WORKSHOP_M.
// ===================================================================================================================
const PLASTER: Mat = { lit: "#D9CDB2", mid: "#B3A587", dark: "#6E6450" };
const ROOF: Mat = { lit: "#A0684A", mid: "#7A4C36", dark: "#3E261C" };
const KILN: Mat = { lit: "#A89580", mid: "#7E6C5A", dark: "#3E342A" };
export const workshopParts = (at: P2, facing: number, scale = WORKSHOP_M) => {
  // local: a toward `facing` (the sea), b to its right; metres
  const fw: P2 = [Math.sin(facing), -Math.cos(facing)];
  const rt: P2 = [Math.cos(facing), Math.sin(facing)];
  const P = (a: number, b: number, y: number): V3 => [at[0] + (fw[0] * a + rt[0] * b) * scale, y * scale, at[1] + (fw[1] * a + rt[1] * b) * scale];
  const faces: Face[] = [];
  // the workshop: a long low house (a 0..-8, b -9..3), walls 4.2 m, a gable roof along b
  const a0 = -8;
  const a1 = 0;
  const b0 = -9;
  const b1 = 2;
  const wh = 4.2;
  const rh = 6.4;
  faces.push(...boxFaces(P, a0, a1, b0, b1, 0, wh, PLASTER));
  // the roof: two slopes meeting at the ridge (along b at a mid), eaves overhanging
  const am = (a0 + a1) / 2;
  const ov = 0.6;
  faces.push({ pts: [P(a1 + ov, b0 - ov, wh - 0.3), P(a1 + ov, b1 + ov, wh - 0.3), P(am, b1 + ov, rh), P(am, b0 - ov, rh)], mat: ROOF, rim: true });
  faces.push({ pts: [P(am, b0 - ov, rh), P(am, b1 + ov, rh), P(a0 - ov, b1 + ov, wh - 0.3), P(a0 - ov, b0 - ov, wh - 0.3)], mat: ROOF });
  faces.push({ pts: [P(a0, b0, wh), P(a1, b0, wh), P(am, b0, rh)], mat: PLASTER, two: true });
  faces.push({ pts: [P(a1, b1, wh), P(a0, b1, wh), P(am, b1, rh)], mat: PLASTER, two: true });
  // a dark doorway on the sea side
  faces.push({ pts: [P(a1 + 0.02, -4.2, 0), P(a1 + 0.02, -2.6, 0), P(a1 + 0.02, -2.6, 2.6), P(a1 + 0.02, -4.2, 2.6)], mat: { lit: "#3A2D22", mid: "#33281E", dark: "#22180F" }, line: false, bias: 0.05 });
  // the beehive furnace beside it (centre a -1.5, b 7), radius 3.6 m, height 5 m: rings of faces
  const fc: [number, number] = [-2.2, 7.4];
  const R = 3.7;
  const HT = 5.2;
  const NA = 14;
  const NV = 5;
  const kp = (i: number, j: number): V3 => {
    const ang = (i / NA) * Math.PI * 2;
    const v = j / NV;
    const r = R * Math.sqrt(Math.max(0, 1 - v * v)) * (1 - 0.06 * v);
    return P(fc[0] + Math.cos(ang) * r, fc[1] + Math.sin(ang) * r, HT * v);
  };
  for (let i = 0; i < NA; i++) for (let j = 0; j < NV; j++) faces.push({ pts: [kp(i, j), kp(i + 1, j), kp(i + 1, j + 1), kp(i, j + 1)].reverse(), mat: KILN, line: false });
  // the furnace mouth on the sea side: an arch
  const mouth: V3[] = [];
  const mw = 1.55;
  const mh = 2.5;
  for (let k = 0; k <= 10; k++) {
    const ang = Math.PI * (k / 10);
    mouth.push(P(fc[0] + R * 0.985, fc[1] - Math.cos(ang) * mw, 0.15 + (mh - mw) + Math.sin(ang) * mw));
  }
  mouth.push(P(fc[0] + R * 0.985, fc[1] + mw, 0.15), P(fc[0] + R * 0.985, fc[1] - mw, 0.15));
  // the goods by the door: straw crates of glass stacked on the sea side, and three tall glass jars
  const GL: Mat = { lit: GLASS.lit, mid: GLASS.mid, dark: GLASS.dark };
  const crate = (a: number, b: number, y: number) => faces.push(...boxFaces(P, a - 0.9, a + 0.9, b - 0.9, b + 0.9, y, y + 1.5, CRATE_MAT));
  crate(2.0, -7.6, 0);
  crate(2.1, -5.6, 0);
  crate(2.0, -6.6, 1.5);
  crate(3.9, -6.8, 0);
  const jar = (a: number, b: number, r: number, h: number) => {
    const N = 10;
    const pt = (i: number, y: number, rr: number): V3 => P(a + Math.cos((i / N) * Math.PI * 2) * rr, b + Math.sin((i / N) * Math.PI * 2) * rr, y);
    for (let i = 0; i < N; i++) faces.push({ pts: [pt(i, 0, r * 0.8), pt(i + 1, 0, r * 0.8), pt(i + 1, h * 0.75, r), pt(i, h * 0.75, r)], mat: GL, line: false });
    for (let i = 0; i < N; i++) faces.push({ pts: [pt(i, h * 0.75, r), pt(i + 1, h * 0.75, r), pt(i + 1, h, r * 0.35), pt(i, h, r * 0.35)], mat: GL, line: false });
  };
  jar(2.2, -2.0, 0.75, 2.2);
  jar(3.4, -1.1, 0.6, 1.8);
  jar(2.4, 0.1, 0.65, 2.0);
  return { faces, P, mouth, mouthC: P(fc[0] + R, fc[1], 0.15 + mh * 0.5), vent: P(fc[0], fc[1], HT + 0.1), kilnR: R };
};
export const workshopItems = (cam: Cam, air: MedAir, at: P2, facing: number, frame: number, uid: string, o: { glow?: number; scale?: number; lw?: number } = {}): Item[] => {
  const scale = o.scale ?? WORKSHOP_M;
  const parts = workshopParts(at, facing, scale);
  const items = faceItems(cam, air, parts.faces, uid, { lw: o.lw ?? 0.9 });
  const glow = o.glow ?? 1;
  // the mouth: deep orange inside, the hot core flickering slowly; a soft glow round it (the clip's accent)
  const ms = parts.mouth.map((q) => toScreen(cam, q[0], q[1], q[2]));
  const mc = toScreen(cam, parts.mouthC[0], parts.mouthC[1], parts.mouthC[2]);
  if (ms.every((s) => s.z > 0.05)) {
    const dist = distTo(cam, parts.mouthC[0], parts.mouthC[1], parts.mouthC[2]);
    const fl = 0.85 + 0.1 * Math.sin(frame * 0.21) + 0.05 * Math.sin(frame * 0.53 + 1.3);
    const rg = 7 * scale * mc.s;
    const fogA = air.fogAmt(dist) * 0.5;
    items.push({
      z: mc.z - 2 * scale,
      el: (
        <g key={`${uid}-mouth`}>
          <defs>
            <radialGradient id={`${uid}-glow`} gradientUnits="userSpaceOnUse" cx={f2(mc.x)} cy={f2(mc.y)} r={f2(rg)}>
              <stop offset="0" stopColor="#FFB000" stopOpacity={0.55 * glow * fl * (1 - fogA)} />
              <stop offset="0.35" stopColor="#FFB000" stopOpacity={0.22 * glow * fl * (1 - fogA)} />
              <stop offset="1" stopColor="#FFB000" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={f2(mc.x)} cy={f2(mc.y)} r={f2(rg)} fill={`url(#${uid}-glow)`} />
          <path d={`M${ms.map((s) => `${f2(s.x)},${f2(s.y)}`).join("L")}Z`} fill={mixHex("#D98A0C", "#FFB000", glow * fl)} stroke={ORANGE_LINE} strokeWidth={0.8} strokeLinejoin="round" />
        </g>
      ),
    });
  }
  // the smoke: soft puffs rising from the vent and drifting east, each on its own clock (living, never a loop jump)
  const vs = toScreen(cam, parts.vent[0], parts.vent[1], parts.vent[2]);
  if (vs.z > 0.05) {
    const puffs: React.ReactNode[] = [];
    const NP = 7;
    for (let i = 0; i < NP; i++) {
      const life = 70;
      const t = (((frame + (i * life) / NP) % life) + life) % life / life;
      const rise = t * 9 * scale;
      const drift = t * t * 5 * scale;
      const fwx = Math.cos(facing);
      const p3: V3 = [parts.vent[0] + drift * fwx, parts.vent[1] + rise, parts.vent[2] + drift * Math.sin(facing)];
      const s = toScreen(cam, p3[0], p3[1], p3[2]);
      if (s.z < 0.05) continue;
      const r = (0.8 + 2.2 * t) * scale * s.s;
      const a = 0.22 * Math.sin(Math.PI * t) * (1 - air.fogAmt(distTo(cam, p3[0], p3[1], p3[2])));
      puffs.push(<circle key={i} cx={f2(s.x)} cy={f2(s.y)} r={f2(r)} fill={`url(#${uid}-smk)`} opacity={f2(a)} />);
    }
    items.push({
      z: vs.z - 3 * scale,
      el: (
        <g key={`${uid}-smoke`}>
          <defs>
            <radialGradient id={`${uid}-smk`}>
              <stop offset="0" stopColor={PAL.creamLo} stopOpacity={1} />
              <stop offset="1" stopColor={PAL.creamLo} stopOpacity={0} />
            </radialGradient>
          </defs>
          {puffs}
        </g>
      ),
    });
  }
  return items;
};

// ===================================================================================================================
// ALEXANDRIA (metres in the quay frame at M_WPX: u along the coast, v out to sea; the quay's edge at v = 0): the city's
// houses on the land side, the harbour basin closed by two moles, the Pharos at the basin's mouth (three stages:
// square, octagonal, round; cream stone). Its fire is unlit here (pharosLit 0); cut 56 lights it (ORANGE).
// ===================================================================================================================
const PLASTER_C: Mat = { lit: "#D9CDB2", mid: "#B3A587", dark: "#6E6450" };
const ROOF_C: Mat = { lit: "#A0684A", mid: "#7A4C36", dark: "#3E261C" };
const STONE_C: Mat = { lit: "#A89784", mid: "#7F6F5E", dark: "#3E342A" };
const PHAROS_M: Mat = { lit: "#EFE5D0", mid: "#D3C5A6", dark: "#8E8470" };
/** a quay-frame point (metres) at height h (metres) -> 3D world */
export const Qp = (u: number, v: number, h = 0): V3 => {
  const p = quayPt(u * M_WPX, v * M_WPX);
  return [p[0], h * M_WPX, p[1]];
};
const hash01 = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** the harbour: where the grain ship lies, the basin's mouth, the Pharos (quay metres) */
export const HARBOUR = {
  moor: [0, 32] as P2,
  mouth: [22, 58] as P2,
  pharos: [10, 65] as P2,
  /** the moles' centre lines (quay metres): the long northern breakwater from the west, the short eastern arm */
  westMole: [[-38, 0], [-38, 50], [-24, 60], [6, 64]] as P2[],
  eastMole: [[44, 0], [44, 38], [34, 50]] as P2[],
};
type House = { u: number; v: number; w: number; d: number; h: number; roof: number; ang: number };
/** the houses: a jittered grid on the land side behind the quay, one street straight up from the quay (the opening
 *  camera climbs back over it) */
export const CITY_HOUSES: House[] = (() => {
  const out: House[] = [];
  let i = 0;
  for (let v = -12.5; v >= -42; v -= 9.8)
    for (let u = -40; u <= 40; u += 10) {
      i++;
      if (Math.abs(u) < 5 || v > -14) continue;
      if (hash01(i, 1) < 0.1) continue;
      const w = 6 + 3 * hash01(i, 2);
      const d = 6 + 3 * hash01(i, 3);
      // the column next to the street stands on the street's edge (|u| = 5 m)
      const uc = Math.abs(u) === 10 ? Math.sign(u) * (5 + w / 2) : u + (hash01(i, 4) - 0.5) * 2.4;
      out.push({ u: uc, v: v + (hash01(i, 5) - 0.5) * 2.4, w, d, h: 4 + 4 * hash01(i, 6), roof: hash01(i, 7) < 0.3 ? 0 : 1.6 + 1.2 * hash01(i, 8), ang: Math.abs(u) === 10 ? 0 : (hash01(i, 9) - 0.5) * 0.12 });
    }
  // the quay front: warehouses and houses facing the water on both sides of the street (|u| >= 5 m), so the quay is one
  // stretch of a harbour city, never an empty plaza
  for (const sd of [-1, 1]) {
    let u = 5;
    while (u < 40) {
      i++;
      const w = 7.4 + 1.2 * hash01(i, 2);
      out.push({ u: sd * (u + w / 2), v: -8.2 + (hash01(i, 5) - 0.5) * 0.8, w, d: 6.2, h: 5 + 2.5 * hash01(i, 6), roof: 1.4 + 0.8 * hash01(i, 8), ang: 0 });
      u += w + 1.6;
    }
  }
  return out;
})();
/** goods along the quay front (quay metres): stacks of sacks and amphorae waiting for ships */
export const QUAY_GOODS: { u: number; v: number; kind: "sacks" | "amphorae" }[] = [
  { u: -7.5, v: -2.6, kind: "sacks" },
  { u: -15, v: -2.2, kind: "amphorae" },
  { u: -24, v: -2.6, kind: "sacks" },
  { u: -33, v: -2.3, kind: "amphorae" },
  { u: 8.5, v: -2.4, kind: "amphorae" },
  { u: 16, v: -2.6, kind: "sacks" },
  { u: 26, v: -2.2, kind: "amphorae" },
  { u: 35, v: -2.6, kind: "sacks" },
];
const AMPH_M: Mat = { lit: "#A9765E", mid: "#83573F", dark: "#46301F" };
const SACKS_M: Mat = { lit: "#D9C9A2", mid: "#B8A47C", dark: "#776A50" };
const goodsFaces = (g: (typeof QUAY_GOODS)[number]): Face[] => {
  const P = (a: number, b: number, y: number): V3 => Qp(g.u + a, g.v + b, y);
  const fs: Face[] = [];
  if (g.kind === "sacks") {
    for (const [a, b, y] of [[-0.8, -0.4, 0], [0.4, -0.4, 0], [-0.2, 0.5, 0], [-0.2, -0.1, 0.7]] as [number, number, number][]) fs.push(...boxFaces(P, a - 0.55, a + 0.55, b - 0.4, b + 0.4, y, y + 0.7, SACKS_M, 0.22));
  } else {
    for (let k = 0; k < 6; k++) {
      const a = -1.2 + (k % 3) * 1.0;
      const b = -0.45 + Math.floor(k / 3) * 0.9;
      fs.push(...boxFaces(P, a - 0.32, a + 0.32, b - 0.32, b + 0.32, 0, 1.1, AMPH_M, 0.3));
    }
  }
  return fs;
};
/** a box house with a gable roof (roof 0 = a flat roof), in quay metres */
const houseFaces = (H: House): Face[] => {
  const ca = Math.cos(H.ang);
  const sa = Math.sin(H.ang);
  const P = (a: number, b: number, y: number): V3 => Qp(H.u + a * ca - b * sa, H.v + a * sa + b * ca, y);
  const fs = boxFaces(P, -H.w / 2, H.w / 2, -H.d / 2, H.d / 2, 0, H.h, PLASTER_C);
  if (H.roof > 0) {
    const ov = 0.4;
    const x0 = -H.w / 2 - ov;
    const x1 = H.w / 2 + ov;
    const y0 = -H.d / 2 - ov;
    const y1 = H.d / 2 + ov;
    const top = H.h + H.roof;
    fs.push({ pts: [P(x0, y0, H.h - 0.2), P(x1, y0, H.h - 0.2), P(x1, 0, top), P(x0, 0, top)], mat: ROOF_C, rim: true });
    fs.push({ pts: [P(x0, 0, top), P(x1, 0, top), P(x1, y1, H.h - 0.2), P(x0, y1, H.h - 0.2)], mat: ROOF_C });
    fs.push({ pts: [P(-H.w / 2, -H.d / 2, H.h), P(-H.w / 2, H.d / 2, H.h), P(-H.w / 2, 0, top)], mat: PLASTER_C });
    fs.push({ pts: [P(H.w / 2, H.d / 2, H.h), P(H.w / 2, -H.d / 2, H.h), P(H.w / 2, 0, top)], mat: PLASTER_C });
  }
  return fs;
};
/** a mole: stone boxes along a centre line (quay metres), width 7 m, its top 1.6 m above the water */
const moleFaces = (line: P2[]): Face[] => {
  const fs: Face[] = [];
  for (let i = 0; i + 1 < line.length; i++) {
    const [a, b] = [line[i], line[i + 1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const n: P2 = [-t[1], t[0]];
    const P = (x: number, y: number, h: number): V3 => Qp(a[0] + t[0] * x + n[0] * y, a[1] + t[1] * x + n[1] * y, h);
    fs.push(...boxFaces(P, -3.5, L + 3.5, -3.5, 3.5, -0.4, 1.6, STONE_C));
  }
  return fs;
};
/** an n-sided vertical prism (quay metres) */
const prismFaces = (c: P2, r: number, y0: number, y1: number, n: number, mat: Mat, rot = 0): Face[] => {
  const pt = (i: number, y: number): V3 => {
    const a = rot + (i / n) * Math.PI * 2;
    return Qp(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, y);
  };
  const fs: Face[] = [];
  for (let i = 0; i < n; i++) fs.push({ pts: [pt(i, y0), pt(i + 1, y0), pt(i + 1, y1), pt(i, y1)], mat, line: n < 10 });
  fs.push({ pts: Array.from({ length: n }, (_, i) => pt(i, y1)), mat, rim: true });
  return fs;
};
/** the Pharos: square base 11 m to 17 m, octagon to 27 m, round top to 33 m, the lantern and a small statue */
export const pharosFaces = (): Face[] => {
  const c = HARBOUR.pharos;
  const P = (a: number, b: number, y: number): V3 => Qp(c[0] + a, c[1] + b, y);
  return [
    ...boxFaces(P, -7, 7, -7, 7, -0.4, 1.8, STONE_C),
    ...boxFaces(P, -5.5, 5.5, -5.5, 5.5, 1.8, 17, PHAROS_M),
    ...prismFaces(c, 4.1, 17, 27, 8, PHAROS_M, Math.PI / 8),
    ...prismFaces(c, 2.4, 27, 32.5, 14, PHAROS_M),
    ...prismFaces(c, 1.5, 32.5, 34.6, 8, STONE_C, Math.PI / 8),
  ];
};
/** Alexandria as painter items: houses, moles, the Pharos (pharosLit 0..1 lights its fire: cut 56) */
export const alexandriaItems = (cam: Cam, air: MedAir, frame: number, o: { pharosLit?: number; lw?: number } = {}): Item[] => {
  const lw = o.lw ?? 0.8;
  const items: Item[] = [];
  // the houses: one painter group per house (its own faces sorted inside it)
  CITY_HOUSES.forEach((H, i) => {
    const c = Qp(H.u, H.v, H.h / 2);
    const s = toScreen(cam, c[0], c[1], c[2]);
    if (s.z < 0.5) return;
    const fi = faceItems(cam, air, houseFaces(H), `ah${i}`, { lw });
    items.push({ z: s.z, el: <g key={`ah${i}`}>{paint(fi)}</g> });
  });
  QUAY_GOODS.forEach((g, i) => {
    const c = Qp(g.u, g.v, 0.5);
    const sc = toScreen(cam, c[0], c[1], c[2]);
    if (sc.z < 0.5) return;
    items.push({ z: sc.z, el: <g key={`qg${i}`}>{paint(faceItems(cam, air, goodsFaces(g), `qg${i}`, { lw }))}</g> });
  });
  for (const [k, line] of [["wm", HARBOUR.westMole], ["em", HARBOUR.eastMole]] as [string, P2[]][]) {
    // each mole segment its own group (a long mole spans depths)
    for (let i = 0; i + 1 < line.length; i++) {
      const seg = [line[i], line[i + 1]];
      const mid = Qp((seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2, 0);
      const s = toScreen(cam, mid[0], mid[1], mid[2]);
      if (s.z < 0.5) continue;
      items.push({ z: s.z + 2, el: <g key={`${k}${i}`}>{paint(faceItems(cam, air, moleFaces(seg), `${k}${i}`, { lw }))}</g> });
    }
  }
  const pc = Qp(HARBOUR.pharos[0], HARBOUR.pharos[1], 10);
  const ps = toScreen(cam, pc[0], pc[1], pc[2]);
  if (ps.z > 0.5) {
    const lit = o.pharosLit ?? 0;
    const top = Qp(HARBOUR.pharos[0], HARBOUR.pharos[1], 30);
    const ts = toScreen(cam, top[0], top[1], top[2]);
    const fl = 0.88 + 0.08 * Math.sin(frame * 0.23) + 0.04 * Math.sin(frame * 0.61 + 0.7);
    const rg = 9 * M_WPX * ts.s;
    items.push({
      z: ps.z,
      el: (
        <g key="pharos">
          {paint(faceItems(cam, air, pharosFaces(), "phx", { lw }))}
          {lit > 0.001 ? (
            <g>
              <defs>
                <radialGradient id="phx-glow" gradientUnits="userSpaceOnUse" cx={f2(ts.x)} cy={f2(ts.y)} r={f2(rg)}>
                  <stop offset="0" stopColor="#FFB000" stopOpacity={0.75 * lit * fl} />
                  <stop offset="0.3" stopColor="#FFB000" stopOpacity={0.3 * lit * fl} />
                  <stop offset="1" stopColor="#FFB000" stopOpacity={0} />
                </radialGradient>
              </defs>
              <circle cx={f2(ts.x)} cy={f2(ts.y)} r={f2(rg)} fill="url(#phx-glow)" />
              <ellipse cx={f2(ts.x)} cy={f2(ts.y)} rx={f2(2.2 * M_WPX * ts.s)} ry={f2(2.6 * M_WPX * ts.s)} fill={mixHex("#D98A0C", "#FFB000", lit * fl)} opacity={c01(lit * 1.5)} />
            </g>
          ) : null}
        </g>
      ),
    });
  }
  return items;
};

// ===================================================================================================================
// LABELS: map type lying on the ground (rodent's GroundLabel): Fell SC caps, cream with a dark halo, aligned to the
// local parallel at the anchor; slides north `slide` screen px while it fades in (u 0..1)
// ===================================================================================================================
export const INK = "#E9DDBF";
/** plate (optional, 0..1): a soft dark plate under the word and a firmer halo, for a label over busy or khaki land */
export const GroundLabel: React.FC<{ cam: Cam; text: string; at: P2; cap: number; u: number; slide?: number; air?: MedAir; track?: number; plate?: number }> = ({ cam, text, at, cap, u, slide = 26, air, track = 0.18, plate = 0 }) => {
  if (u <= 0) return null;
  const ease = 1 - Math.pow(1 - c01(u), 3);
  const op = c01(u * 2.2);
  // the local east / north at the anchor (the parallel and the meridian)
  const ny = (northYaw(at[0], at[1]) * Math.PI) / 180;
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
  // text units: font size 100 (cap height ~ 0.66 em for Fell SC caps): world px per text unit
  const FS = 100;
  const k = cap / (FS * 0.66);
  const m = [Jt.de[0] * k, Jt.de[1] * k, -Jt.dn[0] * k, -Jt.dn[1] * k, Jt.p[0], Jt.p[1]];
  if (m.some((v) => !Number.isFinite(v))) return null;
  const dist = distTo(cam, at[0], 0, at[1]);
  const fogA = air ? air.fogAmt(dist) : 0;
  const ink = air ? air.fogTo(INK, dist) : INK;
  return (
    <g transform={`matrix(${m.map((v) => v.toFixed(5)).join(",")})`} opacity={op * (1 - 0.6 * fogA)}>
      {plate > 0 ? (
        <g>
          <defs>
            <radialGradient id={`gl-${text}-plate`}>
              <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.5 * plate} />
              <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.36 * plate} />
              <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={0} cy={0} rx={text.length * (0.72 + track) * FS * 0.62} ry={FS * 0.78} fill={`url(#gl-${text}-plate)`} />
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
