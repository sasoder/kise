// ---------------------------------------------------------------------------
// HubsOfExchange (kyle-rome-industrial, cut 56). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 120 frames. RENDER WITH --gl=angle (the map ground is WebGL2).
// One continuous pinhole camera over the shared Mediterranean map world (medMapWorld.tsx, read-only), opening on cut
// 45's last frame (WheatForGlass END_CAM_KEY, asserted at module load).
//
// CHECK LINE: "Roman cities were the knots of this trade network — routes converge on them from every direction —
// and in a few of them there was real technology (the lit Pharos of Alexandria)."
//
// THE LINE: "[Cities are these sort of like] hubs of productivity and exchange. And there's some technology. [I mean…]"
// WORD -> FRAME (Whisper, heard ~6 frames later): hubs -8 · of 7 · productivity 18 · and 34 · exchange 49 · And 72 ·
//   there's 74 · some 80 · technology 86 · (I, on camera, 114)
// DURATION: the slot 56.924 -> 60.928 s = 4.004 s x 29.97 = 120 frames (f0..f119).
//
// THE MOTION: f0 is cut 45's last frame (the eastern Mediterranean, the two ships, Alexandria, the Sidon workshop).
// f0-54 the camera pulls back and swings round (one lobe; yaw 9 -> -68, pitch 77 -> 46) into an OBLIQUE view looking
// west-north-west along the length of the Mediterranean from above the Levant (director, Oct 26): Alexandria near at
// the bottom left, Antioch near at the bottom right (both below the caption bands), Ephesus and the Aegean mid-way,
// Carthage and Rome far up the frame in the haze (FarAir veils the top); the wide drifts f54-62. On the way the great
// cities rise out of the ground as 3D clusters (stone walls with towers, a temple, red-tile houses; each building
// rises at full size out of the ground, clipped by it, the centre first), each as it comes into frame: Antioch f2,
// Ephesus f13, Rome f29 (with its amphitheatre), Carthage f37. Sea lanes are drawn by moving tips (thin cream lines on
// the water; five out of Alexandria's harbour mouth from f2, then between the other hubs), roads by dashed tips on the
// land, all meeting at the hubs; ships sail the lanes and pack trains walk the roads at constant speed. Cut 45's EGYPT
// / SYRIA slide back off (f18-36). f62-104 the camera eases down toward Alexandria (one lobe, peak 7.7 %/frame at f85;
// yaw back to -5; the Pharos glides on one eased screen path to x 410, y 860, its rise leading so it is above the
// caption bands from f80) until its harbour, the moles and the Pharos fill the frame with the lanes fanning out from
// the harbour mouth; the Pharos lights its fire ORANGE on "some technology" (f82 catch -> f96 full), a soft glow on
// the water and a faint beam sweeping over the sea from f90. f104-119 settled: the beam sweeping, a grain ship sailing
// in from the west, cut 45's glass ship come to rest outside the eastern mole (it slows from f46, stops ~f92, sail
// brailed), a slow creep.
// The cities (Alexandria too, by moving the camera: scaledView) grow as map symbols with their distance from the
// camera, like cut 45's ships: 1x nearer than 950 world px (so f0 and the end are exact), 1.9x by 3000.
// JOIN: f0 is cut 45's f294 pixel for pixel (frame-difference max 0); cut 45's clock continues as 294 + f.
// Orange = technology only: the Pharos fire (and, carried over from cut 45, the Sidon furnace, which banks down to a
// faint ember during the pull-back and is out of frame by "technology"). Lanes, roads, people, cities never orange.
//
// DEPTH: medMapWorld's pinhole (F 1300): D 870 -> 1850 (the oblique wide, f48-58) -> ~240 (f104), pitch 77 -> 46 ->
// 43, yaw 9 -> -68 (west-north-west) -> -5 (about the local meridian at Alexandria). Fog: the ground's haze
// (hazeOf). Cities at one symbolic scale with Alexandria (M_WPX = 1.2 world px per metre): Rome's walls 50 m in radius,
// the others 40 m. Ships at SHIP_WPX x shipGrow(D) (cut 45's), pack animals at 2.4 x M_WPX.
//
// SOURCES: the map, Alexandria, the Pharos, the ships: medMapWorld / WheatForGlass (cut 45). City sites (Natural Earth
//   coordinates in medMapData PLACES): Rome 12.48 E 41.89 N (Ostia its port), Carthage 10.33 E 36.85 N, Ephesus
//   27.34 E 37.94 N, Antioch 36.16 E 36.20 N (Seleucia Pieria its port); the clusters are schematic, not plans.
//   The lanes: schematic courses between the ports (Alexandria-Ostia south of Crete and Sicily, the grain route;
//   Alexandria-Carthage along the African coast; Alexandria-Ephesus by Rhodes; Alexandria-Seleucia east of Cyprus;
//   Carthage-Ostia; Ephesus-Antioch along the Anatolian coast; Ephesus west to the Ostia lane). Roads: the Via Appia
//   (Rome-Capua) and Via Flaminia (Rome-Ariminum), Carthage inland, Ephesus-Sardis, Antioch-Beroea and -Apamea,
//   Antioch-Seleucia, Alexandria-Canopus; drawn approximately. The Pharos's fire (a fire at the top, by day smoke):
//   Strabo 17.1.6; the sweeping beam is a picture-book device.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirHorizonHaze, AirStage, mixHex, pchip, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import {
  GroundLabel,
  H,
  HARBOUR,
  M_WPX,
  MedGround,
  PLACES,
  W,
  alexandriaItems,
  boxFaces,
  camFrom,
  corbitaItems,
  distTo,
  faceItems,
  groundAt,
  medAir,
  northYaw,
  paint,
  pathAt,
  project,
  quayPt,
  shipWaterItem,
  smoothPath,
  toScreen,
  wakeItem,
  workshopItems,
  type Cam,
  type Face,
  type Item,
  type MedAir,
  type P2,
  type Path,
  type V3,
} from "./medMapWorld";
import { EGYPT, END_CAM_KEY, camAt as camAt45, GLASS_PATH, LowAir, SYRIA, WHEAT_PATH, WORKSHOP, shipPoses } from "./WheatForGlass";

export const FPS = 30000 / 1001;
export const DURATION = 120;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const f2 = (v: number) => v.toFixed(2);
const LL = (lon: number, lat: number): P2 => project(lon, lat);
/** cut 45's frame for a cut-56 frame: f0 IS cut 45's last frame (f294), pixel for pixel; its ships, furnace, sea
 *  shimmer and air continue from there */
const F45 = (f: number) => 294 + f;

// ===================================================================================================================
// THE CAMERA: keys -> pchip (held ends) -> the house damped follow, started AT REST on cut 45's last camera (no lead,
// so f0 is END_CAM_KEY exactly; asserted below)
// ===================================================================================================================
const END = END_CAM_KEY;
/** the cities grow as map symbols with their distance from the camera (as cut 45's ships with the camera's): 1x
 *  nearer than 950 world px (Alexandria at cut 45's end view and on the push-in: the join and the end are exact),
 *  1.9x by 3000 (the far hubs up the oblique wide, so they read through the perspective) */
export const cityGrow = (dist: number) => 1 + 0.9 * sstep(Math.log(950), Math.log(3000), Math.log(dist));
const growAt = (cam: Cam, O: P2) => cityGrow(distTo(cam, O[0], 0, O[1]));
/** Alexandria's growth origin (its quay line) and the Pharos's foot as drawn at growth k */
const ALEX_O: P2 = quayPt(0, 0);
const PH0 = quayPt(HARBOUR.pharos[0] * M_WPX, HARBOUR.pharos[1] * M_WPX);
const pharosAt = (k: number): P2 => [ALEX_O[0] + (PH0[0] - ALEX_O[0]) * k, ALEX_O[1] + (PH0[1] - ALEX_O[1]) * k];
type Key = { f: number; tx?: number; tz?: number; D: number; pitch: number; yaw: number };
/** distance, pitch and yaw keys; the target (tx, tz) is keyed up to the wide, then solved so the Pharos glides on one
 *  straight eased screen path from where the wide leaves it to its place in the last frame */
export const CAM_KEYS: Key[] = [
  { f: 0, tx: END.tx, tz: END.tz, D: END.D, pitch: END.pitch, yaw: END.yaw },
  // the pull-back and swing round into the oblique wide: looking west-north-west along the Mediterranean from above
  // the Levant, Alexandria and Antioch near (below the caption bands), Ephesus and Athens mid-way, Rome and Carthage
  // far up in the haze
  { f: 54, tx: -535, tz: -652, D: 1860, pitch: 46, yaw: -68 },
  // through the wide without a stop (a slow drift on), then down toward Alexandria
  { f: 62, tx: -520, tz: -641, D: 1810, pitch: 45.5, yaw: -66 },
  { f: 98, D: 250, pitch: 43.5, yaw: -4.5 },
  { f: 119, D: 234, pitch: 42.8, yaw: -4.8 },
];
const PUSH = { f0: 62, f1: 102, to: [410, 860] as P2 };
const EASE_Y = Easing.bezier(0.4, 0, 0.15, 1);
const makeCamTrack = (keys: Key[], duration: number) => {
  const tk = keys.filter((q) => q.tx !== undefined);
  const chT = [pchip(tk.map((q) => [q.f, q.tx!] as [number, number]), true), pchip(tk.map((q) => [q.f, q.tz!] as [number, number]), true)];
  const ch = [
    pchip(keys.map((q) => [q.f, Math.log(q.D)] as [number, number]), true),
    pchip(keys.map((q) => [q.f, q.pitch] as [number, number]), true),
    pchip(keys.map((q) => [q.f, q.yaw] as [number, number]), true),
  ];
  // where the Pharos sits on screen when the push begins
  const pre = (f: number) => {
    const [lD, p, y] = ch.map((c) => c(f));
    return { D: Math.exp(lD), p, y, tx: chT[0](Math.min(f, PUSH.f0)), tz: chT[1](Math.min(f, PUSH.f0)) };
  };
  const c0 = pre(PUSH.f0);
  const cam0 = camFrom(c0.tx, 0, c0.tz, c0.D, c0.p, c0.y);
  const A0 = pharosAt(growAt(cam0, ALEX_O));
  const s0 = toScreen(cam0, A0[0], 0, A0[1]);
  const ease = Easing.inOut(Easing.sin);
  const target = (fIn: number) => {
    const f = Math.max(0, fIn);
    const q = pre(f);
    if (f <= PUSH.f0) return [q.tx, q.tz, Math.log(q.D), q.p, q.y];
    const t = c01((f - PUSH.f0) / (PUSH.f1 - PUSH.f0));
    const u = ease(t);
    // the Pharos climbs out of the caption bands early in the push (its rise leads its sideways glide), so it lights
    // above them
    const uy = EASE_Y(t);
    const P: P2 = [s0.x + (PUSH.to[0] - s0.x) * u, s0.y + (PUSH.to[1] - s0.y) * uy];
    // the ground offset from the target to the point seen at P (independent of the target): T = A - g(P)
    const g = groundAt(camFrom(0, 0, 0, q.D, q.p, q.y), P[0], P[1])!;
    // Alexandria's growth depends on where the camera ends up: a few fixed-point passes
    let A = pharosAt(1);
    for (let it = 0; it < 4; it++) A = pharosAt(growAt(camFrom(A[0] - g[0], 0, A[1] - g[1], q.D, q.p, q.y), ALEX_O));
    return [A[0] - g[0], A[1] - g[1], Math.log(q.D), q.p, q.y];
  };
  let s = target(0);
  let v = s.map(() => 0);
  const raw: number[][] = [[...s]];
  for (let fr = 1; fr <= duration + 2; fr++) {
    const t = target(fr);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    raw.push([...s]);
  }
  const at = (q: number[]) => camFrom(q[0], 0, q[1], Math.exp(q[2]), q[3], q[4]);
  const camAt = (frame: number): Cam => {
    const i = Math.max(0, Math.min(raw.length - 2, Math.floor(frame)));
    const t = Math.max(0, Math.min(1, frame - i));
    return at(raw[i].map((a, j) => a + (raw[i + 1][j] - a) * t));
  };
  return { camAt, raw };
};
const TRACK = makeCamTrack(CAM_KEYS, DURATION);
export const camAt = TRACK.camAt;
export const CAM_RAW = TRACK.raw;
// the join: f0 is cut 45's last camera
{
  const c = camAt(0);
  const e = [c.T[0] - END.tx, c.T[2] - END.tz, c.D - END.D, c.pitch - END.pitch, c.yaw - END.yaw];
  if (e.some((x) => Math.abs(x) > 1e-6)) throw new Error(`HubsOfExchange: f0 camera does not match cut 45's end (${e.join(",")})`);
}
/** cut 45's REST camera (its f0): the air's motes and shafts parallax against it, so the medium joins too */
const REST_AIR: Cam = camAt45(0);

// ===================================================================================================================
// MATERIALS (the city's, as medMapWorld's Alexandria)
// ===================================================================================================================
const PLASTER: Mat = { lit: "#D9CDB2", mid: "#B3A587", dark: "#6E6450" };
const ROOF: Mat = { lit: "#A0684A", mid: "#7A4C36", dark: "#3E261C" };
const STONE: Mat = { lit: "#A89784", mid: "#7F6F5E", dark: "#3E342A" };
const MARBLE: Mat = { lit: "#EFE5D0", mid: "#D3C5A6", dark: "#8E8470" };
const SAND: Mat = { lit: "#C2AE86", mid: "#A08D68", dark: "#5E513C" };
const ANIMAL: Mat = { lit: "#8C6E52", mid: "#6A523C", dark: "#3A2B1E" };
const BUNDLE: Mat = { lit: "#D9C9A2", mid: "#B8A47C", dark: "#776A50" };

// ===================================================================================================================
// THE CITIES: clusters built in city metres (M_WPX world px per metre, Alexandria's scale), oriented to the local
// meridian. Each building rises out of the ground at full size (translated up from below, clipped at the ground).
// ===================================================================================================================
const hash01 = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
type Bldg = { faces: Face[]; c: V3; top: number; delay: number };
type CitySpec = { id: string; anchor: P2; inland: [number, number]; at: P2; R: number; t0: number; rise: number; temple: [number, number, number]; arena?: [number, number] };
/** a point offset from a map point by (east, north) world px along the local parallel / meridian */
const offsetEN = (p: P2, e: number, n: number): P2 => {
  const ny = (northYaw(p[0], p[1]) * Math.PI) / 180;
  return [p[0] + Math.cos(ny) * e + Math.sin(ny) * n, p[1] + Math.sin(ny) * e - Math.cos(ny) * n];
};
/** a city: its anchor on the coast (or at the end of its port road), the walls' centre inland of it */
const city = (id: string, anchor: P2, inland: [number, number], R: number, t0: number, rise: number, temple: [number, number, number], arena?: [number, number]): CitySpec => {
  const l = Math.hypot(inland[0], inland[1]) || 1;
  const d = (R + 3) * M_WPX;
  return { id, anchor, inland, at: offsetEN(anchor, (inland[0] / l) * d, (inland[1] / l) * d), R, t0, rise, temple, arena };
};
const CITY_SPECS: CitySpec[] = [
  city("antioch", PLACES.antioch, [0, 0], 40, 2, 18, [-6, 10, 0.3]),
  city("ephesus", LL(27.36, 37.94), [0.55, 0.85], 40, 13, 18, [8, 6, -0.4]),
  city("carthage", LL(10.3, 36.84), [-0.5, -0.9], 40, 37, 18, [4, 12, 0.2]),
  city("rome", LL(12.33, 41.77), [0.75, 0.6], 50, 29, 20, [-14, 18, 0], [22, -20]),
];
const cityBuild = (S: CitySpec): Bldg[] => {
  const ny = (northYaw(S.at[0], S.at[1]) * Math.PI) / 180;
  const E: P2 = [Math.cos(ny), Math.sin(ny)];
  const N: P2 = [Math.sin(ny), -Math.cos(ny)];
  /** city metres (e east, n north, h up) -> world */
  const Cp = (e: number, n: number, h = 0): V3 => [S.at[0] + (E[0] * e + N[0] * n) * M_WPX, h * M_WPX, S.at[1] + (E[1] * e + N[1] * n) * M_WPX];
  const out: Bldg[] = [];
  const add = (faces: Face[], e: number, n: number, top: number) => {
    const r = Math.hypot(e, n) / S.R;
    out.push({ faces, c: Cp(e, n, top / 2), top, delay: S.t0 + r * (S.rise - 9) + 2.5 * (hash01(out.length + S.R, 3) - 0.5) });
  };
  // the temple: a podium, a cream cella, a terracotta gable roof with cream pediments
  {
    const [te, tn, ta] = S.temple;
    const ca = Math.cos(ta);
    const sa = Math.sin(ta);
    const P = (a: number, b: number, y: number): V3 => Cp(te + a * ca - b * sa, tn + a * sa + b * ca, y);
    const L = S.id === "rome" ? 13 : 10;
    const Wd = S.id === "rome" ? 8 : 6.5;
    const fs: Face[] = [...boxFaces(P, -Wd - 1.6, Wd + 1.6, -L - 2, L + 2, 0, 1.8, STONE), ...boxFaces(P, -Wd, Wd, -L, L, 1.8, 9, MARBLE)];
    const ov = 0.8;
    const top = 12.4;
    fs.push({ pts: [P(-Wd - ov, -L - ov, 8.8), P(-Wd - ov, L + ov, 8.8), P(0, L + ov, top), P(0, -L - ov, top)], mat: ROOF, rim: true });
    fs.push({ pts: [P(0, -L - ov, top), P(0, L + ov, top), P(Wd + ov, L + ov, 8.8), P(Wd + ov, -L - ov, 8.8)], mat: ROOF });
    fs.push({ pts: [P(-Wd, -L, 9), P(Wd, -L, 9), P(0, -L, top - 0.2)], mat: MARBLE });
    fs.push({ pts: [P(Wd, L, 9), P(-Wd, L, 9), P(0, L, top - 0.2)], mat: MARBLE });
    add(fs, te, tn, top);
  }
  // Rome's amphitheatre: an elliptical ring wall, its terraces, the sand arena
  if (S.arena) {
    const [ae, an] = S.arena;
    const A = 15;
    const B = 12;
    const NS = 22;
    const ring = (k: number, y: number, s: number): V3 => {
      const t = (k / NS) * Math.PI * 2;
      return Cp(ae + Math.cos(t) * A * s, an + Math.sin(t) * B * s, y);
    };
    const fs: Face[] = [];
    fs.push({ pts: Array.from({ length: NS }, (_, k) => ring(k, 0.6, 0.62)), mat: SAND, line: false, bias: -2 });
    for (let k = 0; k < NS; k++) {
      fs.push({ pts: [ring(k, 0, 1), ring(k + 1, 0, 1), ring(k + 1, 9, 1), ring(k, 9, 1)], mat: STONE, line: k % 2 === 0 });
      fs.push({ pts: [ring(k, 9, 1), ring(k + 1, 9, 1), ring(k + 1, 3, 0.64), ring(k, 3, 0.64)], mat: PLASTER, line: false });
    }
    add(fs, ae, an, 9);
  }
  // the houses: a jittered grid inside the walls, clear of the temple and the arena
  let i = 0;
  const step = 10.4;
  for (let n = -S.R; n <= S.R; n += step)
    for (let e = -S.R; e <= S.R; e += step) {
      i++;
      const je = e + (hash01(i, 4 + S.R) - 0.5) * 2.6;
      const jn = n + (hash01(i, 5 + S.R) - 0.5) * 2.6;
      if (Math.hypot(je, jn) > S.R - 7) continue;
      if (Math.abs(je - S.temple[0]) < 14 && Math.abs(jn - S.temple[1]) < 17) continue;
      if (S.arena && Math.hypot((je - S.arena[0]) / 20, (jn - S.arena[1]) / 17) < 1) continue;
      if (hash01(i, 1 + S.R) < 0.12) continue;
      const w = 6 + 3 * hash01(i, 2);
      const d = 6 + 3 * hash01(i, 3);
      const h = 4 + 3.5 * hash01(i, 6);
      const roof = hash01(i, 7) < 0.22 ? 0 : 1.6 + 1.2 * hash01(i, 8);
      const ang = (hash01(i, 9) - 0.5) * 0.14;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const P = (a: number, b: number, y: number): V3 => Cp(je + a * ca - b * sa, jn + a * sa + b * ca, y);
      const fs = boxFaces(P, -w / 2, w / 2, -d / 2, d / 2, 0, h, PLASTER);
      if (roof > 0) {
        const ov = 0.4;
        const [x0, x1, y0, y1] = [-w / 2 - ov, w / 2 + ov, -d / 2 - ov, d / 2 + ov];
        const top = h + roof;
        fs.push({ pts: [P(x0, y0, h - 0.2), P(x1, y0, h - 0.2), P(x1, 0, top), P(x0, 0, top)], mat: ROOF, rim: true });
        fs.push({ pts: [P(x0, 0, top), P(x1, 0, top), P(x1, y1, h - 0.2), P(x0, y1, h - 0.2)], mat: ROOF });
        fs.push({ pts: [P(-w / 2, -d / 2, h), P(-w / 2, d / 2, h), P(-w / 2, 0, top)], mat: PLASTER });
        fs.push({ pts: [P(w / 2, d / 2, h), P(w / 2, -d / 2, h), P(w / 2, 0, top)], mat: PLASTER });
      }
      add(fs, je, jn, h + roof);
    }
  // the walls: a ring of stone curtain walls with square towers at every other corner
  const NW = S.R > 60 ? 22 : 16;
  const wr = (k: number) => {
    const t = (k / NW) * Math.PI * 2 + 0.2;
    const r = S.R * (1 + 0.05 * Math.sin(3 * t + S.R));
    return [Math.cos(t) * r, Math.sin(t) * r] as P2;
  };
  for (let k = 0; k < NW; k++) {
    const a = wr(k);
    const b = wr(k + 1);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const t: P2 = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const nn: P2 = [-t[1], t[0]];
    const P = (x: number, y: number, h: number): V3 => Cp(a[0] + t[0] * x + nn[0] * y, a[1] + t[1] * x + nn[1] * y, h);
    const fs = boxFaces(P, 0, L, -1.1, 1.1, 0, 4.6, STONE);
    if (k % 2 === 0) fs.push(...boxFaces((x, y, h) => Cp(a[0] + x, a[1] + y, h), -2.3, 2.3, -2.3, 2.3, 0, 7.2, STONE));
    add(fs, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, k % 2 === 0 ? 7.2 : 4.6);
  }
  return out;
};
const CITIES = CITY_SPECS.map((S) => ({ S, b: cityBuild(S) }));

/** a face moved down by `drop` world px and clipped to the ground (Y >= 0); null if wholly underground */
const riseFace = (fc: Face, drop: number): Face | null => {
  if (drop <= 1e-6) return fc;
  const p = fc.pts.map((q) => [q[0], q[1] - drop, q[2]] as V3);
  if (p.every((q) => q[1] >= 0)) return { ...fc, pts: p };
  if (p.every((q) => q[1] <= 0)) return null;
  const out: V3[] = [];
  for (let k = 0; k < p.length; k++) {
    const a = p[k];
    const b = p[(k + 1) % p.length];
    if (a[1] >= 0) out.push(a);
    if (a[1] >= 0 !== b[1] >= 0) {
      const t = a[1] / (a[1] - b[1]);
      out.push([a[0] + (b[0] - a[0]) * t, 0, a[2] + (b[2] - a[2]) * t]);
    }
  }
  if (out.length < 3) return null;
  return { ...fc, pts: out, rim: fc.rim && p.every((q) => q[1] >= 0) };
};
const RISE_LEN = 11;
/** draw a set scaled by k about the ground point O: the same picture as scaling its geometry, by moving the camera
 *  (C' = O + (C - O) / k: screen positions identical, depths and distances / k), so the shared Alexandria grows too */
const scaledView = (cam: Cam, air: MedAir, O: P2, k: number) => {
  if (Math.abs(k - 1) < 1e-9) return { cam, air };
  const O3: V3 = [O[0], 0, O[1]];
  const sc = (p: V3): V3 => [O3[0] + (p[0] - O3[0]) / k, O3[1] + (p[1] - O3[1]) / k, O3[2] + (p[2] - O3[2]) / k];
  const cam2: Cam = { ...cam, C: sc(cam.C), T: sc(cam.T), D: cam.D / k };
  const air2: MedAir = { ...air, fogAmt: (d) => air.fogAmt(d * k), airHexAt: (d) => air.airHexAt(d * k), fogTo: (h, d) => air.fogTo(h, d * k) };
  return { cam: cam2, air: air2 };
};
const rezed = (items: (Item | null)[], k: number): Item[] => items.filter((q): q is Item => !!q).map((q) => ({ z: q.z * k, el: q.el }));
const cityItems = (cam0: Cam, air0: MedAir, frame: number): Item[] => {
  const items: Item[] = [];
  CITIES.forEach(({ S, b }) => {
    const k = growAt(cam0, S.anchor);
    const { cam, air } = scaledView(cam0, air0, S.anchor, k);
    const part: Item[] = [];
    b.forEach((B, i) => {
      const u = c01((frame - B.delay) / RISE_LEN);
      if (u <= 0) return;
      const e = Easing.out(Easing.cubic)(u);
      const drop = (1 - e) * (B.top + 0.6) * M_WPX;
      const s = toScreen(cam, B.c[0], B.c[1], B.c[2]);
      if (s.z < 0.5) return;
      const fs = B.faces.map((f) => riseFace(f, drop)).filter((f): f is Face => !!f);
      if (!fs.length) return;
      part.push({ z: s.z, el: <g key={`${S.id}${i}`}>{paint(faceItems(cam, air, fs, `${S.id}${i}`, { lw: 0.7 }))}</g> });
    });
    items.push(...rezed(part, k));
  });
  return items;
};
/** Alexandria (medMapWorld's, read-only) grown about its quay line, with its Pharos lit */
const alexItems = (cam0: Cam, air0: MedAir, frame: number): Item[] => {
  const k = growAt(cam0, ALEX_O);
  const { cam, air } = scaledView(cam0, air0, ALEX_O, k);
  return rezed([...alexandriaItems(cam, air, F45(frame), { pharosLit: LIT(frame) }), ...pharosLight(cam, air, frame)], k);
};
/** a lane point near Alexandria follows the grown harbour (full at the mouth, none beyond ~420 world px) */
const alexWarp = (p: P2, k: number): P2 => {
  if (Math.abs(k - 1) < 1e-9) return p;
  const d = Math.hypot(p[0] - ALEX_O[0], p[1] - ALEX_O[1]);
  const m = 1 + (k - 1) * (1 - sstep(60, 420, d));
  return [ALEX_O[0] + (p[0] - ALEX_O[0]) * m, ALEX_O[1] + (p[1] - ALEX_O[1]) * m];
};

// ===================================================================================================================
// THE NETWORK: sea lanes (thin cream lines on the water) and roads (dashed, on the land), each drawn by a moving tip
// ===================================================================================================================
/** just outside Alexandria's harbour mouth, where the lanes meet */
const MOUTH_OUT = quayPt((HARBOUR.mouth[0] + 8) * M_WPX, (HARBOUR.mouth[1] + 22) * M_WPX);
/** out past the Pharos and the western mole, where the westbound lanes turn along the coast */
const WEST_OUT = quayPt(-24 * M_WPX, 118 * M_WPX);
const OSTIA_P = LL(12.24, 41.7);
const CARTH_P = LL(10.4, 36.9);
const EPH_P = LL(27.2, 37.92);
const SEL_P = LL(35.88, 36.1);
type Lane = { id: string; path: Path; from: number; to: number; road?: boolean };
const lane = (id: string, ctrl: P2[], from: number, to: number, road = false): Lane => ({ id, path: smoothPath(ctrl, 16), from, to, road });
/** a city's walls' centre (roads run in under its houses) */
const cityAt = (id: string): P2 => CITY_SPECS.find((c) => c.id === id)!.at;
const OSTIA_LANE_CTRL: P2[] = [MOUTH_OUT, WEST_OUT, LL(27.5, 32.8), LL(24.5, 34.35), LL(21.0, 35.5), LL(18.0, 36.3), LL(15.6, 36.4), LL(13.0, 36.85), LL(12.3, 37.45), LL(13.1, 38.45), LL(13.4, 39.6), LL(12.85, 40.8), OSTIA_P];
export const LANES: Lane[] = [
  // the five lanes out of Alexandria's harbour mouth (drawn outward: the hub at f0 is the only one standing)
  lane("alexOstia", OSTIA_LANE_CTRL, 4, 44),
  lane("alexSel", [MOUTH_OUT, LL(30.6, 31.95), LL(32.3, 32.8), LL(33.9, 34.25), LL(35.0, 35.35), LL(35.55, 35.95), SEL_P], 3, 26),
  lane("alexEph", [MOUTH_OUT, LL(29.6, 32.2), LL(28.9, 34.0), LL(28.25, 35.45), LL(27.45, 36.1), LL(26.85, 36.65), LL(26.95, 37.4), EPH_P], 6, 30),
  lane("alexCar", [MOUTH_OUT, WEST_OUT, LL(26.0, 32.1), LL(23.0, 33.15), LL(20.5, 33.25), LL(17.0, 32.9), LL(14.0, 33.6), LL(12.0, 34.6), LL(11.6, 36.0), LL(11.25, 37.2), LL(10.6, 37.05), CARTH_P], 8, 50),
  lane("alexSid", [MOUTH_OUT, LL(30.9, 32.4), LL(32.2, 33.1), LL(33.4, 33.4), LL(34.5, 33.6), LL(35.3, 33.56)], 2, 22),
  // between the other hubs (drawn into the later hub)
  lane("antEph", [SEL_P, LL(35.45, 36.05), LL(34.6, 35.98), LL(33.0, 35.72), LL(31.0, 35.95), LL(29.0, 36.2), LL(28.3, 36.55), LL(27.6, 37.05), LL(27.15, 37.55), EPH_P], 14, 40),
  lane("carOst", [CARTH_P, LL(10.75, 37.45), LL(11.3, 38.6), LL(11.8, 40.0), LL(12.1, 41.2), OSTIA_P], 40, 56),
  lane("ephWest", [EPH_P, LL(26.9, 37.45), LL(25.9, 37.12), LL(24.85, 36.45), LL(23.4, 36.12), LL(21.0, 35.95), LL(18.6, 36.32)], 22, 52),
  // roads (dashed), into the cities
  lane("appia", [LL(15.4, 41.0), LL(14.25, 41.08), LL(13.6, 41.3), LL(13.05, 41.62), cityAt("rome")], 34, 52, true),
  lane("flaminia", [LL(12.6, 43.7), LL(12.75, 43.0), LL(12.65, 42.4), cityAt("rome")], 36, 54, true),
  lane("carIn", [LL(8.4, 35.9), LL(9.2, 36.3), LL(9.7, 36.5), cityAt("carthage")], 40, 56, true),
  lane("sardis", [LL(29.8, 38.6), LL(28.8, 38.45), LL(28.1, 38.25), cityAt("ephesus")], 18, 36, true),
  lane("beroea", [LL(37.8, 36.05), LL(37.15, 36.2), LL(36.75, 36.25), cityAt("antioch")], 8, 26, true),
  lane("apamea", [LL(36.6, 34.9), LL(36.4, 35.4), LL(36.35, 35.85), cityAt("antioch")], 10, 28, true),
  lane("seleucia", [SEL_P, LL(36.05, 36.16), PLACES.antioch], 6, 14, true),
  lane("canopus", [LL(30.75, 31.12), LL(30.3, 31.18), LL(30.07, 31.24), quayPt(48 * M_WPX, -24 * M_WPX)], 4, 24, true),
];
const tipS = (L: Lane, f: number) => L.path.len * Easing.inOut(Easing.sin)(c01((f - L.from) / (L.to - L.from)));
/** a lane or a road as one ground-level layer: the drawn part (screen polyline), the moving tip */
const LaneLine: React.FC<{ cam: Cam; air: MedAir; L: Lane; frame: number }> = ({ cam, air, L, frame }) => {
  const s = tipS(L, frame);
  if (s <= 0) return null;
  const pts = L.path.pts;
  const segs: string[] = [];
  let cur: string[] = [];
  let distSum = 0;
  let n = 0;
  let last: { x: number; y: number } | null = null;
  const flush = () => {
    if (cur.length > 1) segs.push(cur.join(""));
    cur = [];
  };
  const k = growAt(cam, ALEX_O);
  for (let i = 0; i < pts.length; i++) {
    if (L.path.cum[i] > s) break;
    const p = alexWarp(pts[i], k);
    const q = toScreen(cam, p[0], 0.3, p[1]);
    if (q.z < 0.5) {
      flush();
      continue;
    }
    cur.push(`${cur.length ? "L" : "M"}${f2(q.x)},${f2(q.y)}`);
    last = q;
    distSum += distTo(cam, p[0], 0, p[1]);
    n++;
  }
  // the tip itself (between samples)
  const tp = alexWarp(pathAt(L.path, s).at, k);
  const tq = toScreen(cam, tp[0], 0.3, tp[1]);
  if (tq.z > 0.5) {
    cur.push(`${cur.length ? "L" : "M"}${f2(tq.x)},${f2(tq.y)}`);
    last = tq;
  }
  flush();
  if (!segs.length && !last) return null;
  const dist = n ? distSum / n : distTo(cam, tp[0], 0, tp[1]);
  const fogA = air.fogAmt(dist);
  const col = mixHex("#F3EBDD", air.airHexAt(dist), fogA * 0.85);
  const wPx = L.road ? 1.5 : 1.9;
  const drawing = s < L.path.len - 0.5;
  const tipA = drawing ? 1 : 0;
  return (
    <g>
      {segs.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={col} strokeOpacity={L.road ? 0.6 : 0.55} strokeWidth={wPx} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L.road ? "5 6" : undefined} />
      ))}
      {tipA > 0 && tq.z > 0.5 ? (
        <g>
          <circle cx={f2(tq.x)} cy={f2(tq.y)} r={7} fill="#F3EBDD" opacity={0.22} />
          <circle cx={f2(tq.x)} cy={f2(tq.y)} r={2.6} fill="#F6F0E2" opacity={0.95} />
        </g>
      ) : null}
    </g>
  );
};

// ===================================================================================================================
// THE SHIPS: cut 45's two (continued exactly) and the lanes' traffic, at cut 45's symbol scale (shipGrow), constant
// speed. Each is off frame at f0 (the join) and sails into view as the camera opens.
// ===================================================================================================================
const V_SHIP = 1.75;
const rev = (p: Path): Path => smoothPath([...p.pts].reverse().filter((_, i, a) => i % 6 === 0 || i === a.length - 1), 4);
const laneOf = (id: string) => LANES.find((l) => l.id === id)!.path;
type Traffic = { id: string; path: Path; s0: number; v: number; cargo: "wheat" | "glass" | "none"; ph: number };
const INTO_ALEX_OST = rev(laneOf("alexOstia"));
const INTO_ALEX_CAR = rev(laneOf("alexCar"));
export const TRAFFIC: Traffic[] = [
  // inbound to Alexandria: in the last frame they sail in toward the harbour mouth
  { id: "inO", path: INTO_ALEX_OST, s0: INTO_ALEX_OST.len - 278, v: V_SHIP, cargo: "none", ph: 0.7 },
  { id: "inC", path: INTO_ALEX_CAR, s0: INTO_ALEX_CAR.len - 470, v: V_SHIP, cargo: "wheat", ph: 1.9 },
  // the wide's traffic
  { id: "ostA", path: laneOf("alexOstia"), s0: 1000, v: 2.2, cargo: "wheat", ph: 2.6 },
  { id: "carA", path: laneOf("alexCar"), s0: 880, v: 2.2, cargo: "none", ph: 3.4 },
  { id: "carO", path: rev(laneOf("carOst")), s0: 160, v: 2.2, cargo: "none", ph: 4.1 },
  { id: "antE", path: laneOf("antEph"), s0: 780, v: 2.2, cargo: "glass", ph: 5.0 },
  { id: "ephW", path: rev(laneOf("ephWest")), s0: 260, v: 2.2, cargo: "none", ph: 5.7 },
];
/** the glass ship's arrival: cut 45's constant-speed arclength in, a constant deceleration over its last DEC world px
 *  to a stop STOP short of its course's end (clear of the eastern mole); v = speed / cruising speed */
const GLASS_STOP = GLASS_PATH.len - 44;
const GLASS_DEC = 30;
const glassArrive = (sLin: number) => {
  const s1 = GLASS_STOP - GLASS_DEC;
  if (sLin <= s1) return { s: sLin, v: 1 };
  const x = Math.min(sLin - s1, 2 * GLASS_DEC);
  const t = x / (2 * GLASS_DEC);
  return { s: s1 + 2 * GLASS_DEC * (t - (t * t) / 2), v: 1 - t };
};
const bob = (frame: number, ph: number) => ({ roll: 0.025 * Math.sin(frame * 0.07 + ph), pitch: 0.012 * Math.sin(frame * 0.05 + ph * 1.7), heave: 0.08 * Math.sin(frame * 0.06 + ph) });
const shipItems = (cam: Cam, air: MedAir, frame: number): (Item | null)[] => {
  const items: (Item | null)[] = [];
  // cut 45's two, exactly as its tradeItems (without its Alexandria: drawn below with the Pharos lit). The glass ship
  // ends its voyage outside Alexandria's eastern mole: it slows to a stop there (its sail brailed up as it comes in)
  const sp = shipPoses(F45(frame), cam.D);
  const g = glassArrive(sp.gS);
  const glass = g.s === sp.gS ? sp.glass : { ...sp.glass, ...pathAt(GLASS_PATH, g.s), sail: 1 - 0.65 * (1 - g.v) };
  items.push(
    shipWaterItem(cam, air, sp.wheat, "wsw"),
    wakeItem(cam, air, WHEAT_PATH, sp.wS, 150, "wwk", 1, 18 * sp.wheat.scale),
    ...corbitaItems(cam, air, sp.wheat, "wship"),
    shipWaterItem(cam, air, glass, "gsw"),
    wakeItem(cam, air, GLASS_PATH, g.s, 150, "gwk", g.v, 18 * sp.glass.scale),
    ...corbitaItems(cam, air, glass, "gship"),
  );
  const scale = sp.wheat.scale;
  TRAFFIC.forEach((T) => {
    const s = T.s0 + T.v * frame;
    if (s > T.path.len - 4) return;
    const p = pathAt(T.path, s);
    const pose = { at: p.at, heading: p.heading, scale, cargo: T.cargo, deep: 0.25, sail: 1, brace: -0.5, ...bob(frame, T.ph) };
    items.push(shipWaterItem(cam, air, pose, `${T.id}w`), wakeItem(cam, air, T.path, s, 150, `${T.id}k`, 1, 18 * scale), ...corbitaItems(cam, air, pose, T.id));
  });
  return items;
};

// ===================================================================================================================
// THE PACK TRAINS: four loaded pack animals nose to tail, walking the roads at constant speed (map symbols)
// ===================================================================================================================
const PACK_K = 4 * M_WPX;
/** only roads off frame at f0 (the join): a train in cut 45's last frame would appear from nothing */
const TRAINS: { road: string; s0: number; v: number }[] = [
  { road: "appia", s0: 60, v: 1.0 },
  { road: "carIn", s0: 30, v: 1.0 },
  { road: "sardis", s0: 40, v: 1.0 },
];
const trainItems = (cam: Cam, air: MedAir, frame: number): Item[] => {
  const items: Item[] = [];
  TRAINS.forEach((T, ti) => {
    const L = LANES.find((l) => l.id === T.road)!;
    for (let k = 0; k < 4; k++) {
      const s = T.s0 + T.v * frame - k * 4.2 * PACK_K;
      // on the road (it walks whether or not the tip has drawn the road yet), gone into the city at its end
      if (s < 0 || s > L.path.len - 3) continue;
      const p = pathAt(L.path, s);
      const fw: P2 = [Math.sin(p.heading), -Math.cos(p.heading)];
      const rt: P2 = [Math.cos(p.heading), Math.sin(p.heading)];
      const step = Math.sin(frame * 0.5 + k * 1.3 + ti) * 0.08;
      const P = (a: number, b: number, y: number): V3 => [p.at[0] + (fw[0] * a + rt[0] * b) * PACK_K, (y + Math.abs(step)) * PACK_K, p.at[1] + (fw[1] * a + rt[1] * b) * PACK_K];
      const fs: Face[] = [
        ...boxFaces(P, -1.2, 1.2, -0.35, 0.35, 0.7, 1.45, ANIMAL),
        ...boxFaces(P, 1.1, 1.75, -0.2, 0.2, 1.2, 1.85, ANIMAL),
        ...boxFaces(P, -0.8, 0.8, -0.75, -0.3, 1.0, 1.75, BUNDLE, 0.15),
        ...boxFaces(P, -0.8, 0.8, 0.3, 0.75, 1.0, 1.75, BUNDLE, 0.15),
      ];
      const c = toScreen(cam, ...P(0, 0, 1));
      if (c.z < 0.5) continue;
      items.push({ z: c.z, el: <g key={`tr${ti}-${k}`}>{paint(faceItems(cam, air, fs, `tr${ti}-${k}`, { lw: 0.6 }))}</g> });
    }
  });
  return items;
};

// ===================================================================================================================
// THE PHAROS'S LIGHT: alexandriaItems' fire (pharosLit), a wide soft halo, a glow on the water, a faint beam sweeping
// over the sea (a thin 3D wedge from the lantern, fading along its length)
// ===================================================================================================================
const LIT = (f: number) => interpolate(f, [82, 96], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
const BEAM = (f: number) => interpolate(f, [90, 102], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
const Q3 = (u: number, v: number, h: number): V3 => {
  const p = quayPt(u * M_WPX, v * M_WPX);
  return [p[0], h * M_WPX, p[1]];
};
const pharosLight = (cam: Cam, air: MedAir, frame: number): Item[] => {
  const lit = LIT(frame);
  if (lit <= 0.001) return [];
  const items: Item[] = [];
  const [pu, pv] = HARBOUR.pharos;
  const lantern = Q3(pu, pv, 30);
  const ls = toScreen(cam, ...lantern);
  if (ls.z < 0.5) return [];
  const fl = 0.9 + 0.06 * Math.sin(frame * 0.23) + 0.04 * Math.sin(frame * 0.61 + 0.7);
  const fogK = 1 - 0.5 * air.fogAmt(distTo(cam, ...lantern));
  // the glow on the water round the tower's foot
  const base = Q3(pu, pv, 0);
  const bs = toScreen(cam, ...base);
  const wr = 26 * M_WPX * bs.s;
  items.push({
    z: bs.z + 1e6 - 2,
    el: (
      <g key="phw">
        <defs>
          <radialGradient id="phw-g" gradientUnits="userSpaceOnUse" cx={f2(bs.x)} cy={f2(bs.y)} r={f2(wr)} gradientTransform={`translate(${f2(bs.x)} ${f2(bs.y)}) scale(1 0.62) translate(${f2(-bs.x)} ${f2(-bs.y)})`}>
            <stop offset="0" stopColor="#FFB000" stopOpacity={0.13 * lit * fl * fogK} />
            <stop offset="1" stopColor="#FFB000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={f2(bs.x)} cy={f2(bs.y)} rx={f2(wr)} ry={f2(wr * 0.62)} fill="url(#phw-g)" />
      </g>
    ),
  });
  // the beam: bearing sweeping over the sea (west-north-west round to north-north-east), the lantern to ~170 m out
  const bm = BEAM(frame);
  if (bm > 0.001) {
    const bearing = ((-78 + (frame - 90) * 3.4) * Math.PI) / 180;
    const half = (5.5 * Math.PI) / 180;
    const len = 170 * M_WPX;
    const far = (ang: number, h: number): V3 => [lantern[0] + Math.sin(ang) * len, h * M_WPX, lantern[2] - Math.cos(ang) * len];
    const a = far(bearing - half, 14);
    const b = far(bearing + half, 14);
    const sa = toScreen(cam, ...a);
    const sb = toScreen(cam, ...b);
    if (sa.z > 0.5 && sb.z > 0.5) {
      const mx = (sa.x + sb.x) / 2;
      const my = (sa.y + sb.y) / 2;
      const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      const z = toScreen(cam, ...mid).z;
      items.push({
        z: (z + ls.z) / 2 + 3,
        el: (
          <g key="phb">
            <defs>
              <linearGradient id="phb-g" gradientUnits="userSpaceOnUse" x1={f2(ls.x)} y1={f2(ls.y)} x2={f2(mx)} y2={f2(my)}>
                <stop offset="0" stopColor="#FFC845" stopOpacity={0.34 * bm * lit * fogK} />
                <stop offset="0.5" stopColor="#FFC845" stopOpacity={0.12 * bm * lit * fogK} />
                <stop offset="1" stopColor="#FFC845" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`M${f2(ls.x)},${f2(ls.y)}L${f2(sa.x)},${f2(sa.y)}L${f2(sb.x)},${f2(sb.y)}Z`} fill="url(#phb-g)" />
          </g>
        ),
      });
    }
  }
  // the halo round the fire (in front of the tower)
  const hr = 30 * M_WPX * ls.s;
  items.push({
    z: ls.z - 40,
    el: (
      <g key="phh">
        <defs>
          <radialGradient id="phh-g" gradientUnits="userSpaceOnUse" cx={f2(ls.x)} cy={f2(ls.y)} r={f2(hr)}>
            <stop offset="0" stopColor="#FFB000" stopOpacity={0.22 * lit * fl * fogK} />
            <stop offset="0.4" stopColor="#FFB000" stopOpacity={0.08 * lit * fl * fogK} />
            <stop offset="1" stopColor="#FFB000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={f2(ls.x)} cy={f2(ls.y)} r={f2(hr)} fill="url(#phh-g)" />
      </g>
    ),
  });
  return items;
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
/** cut 45's two labels slide back off (their entrance reversed) once the pull-back is under way, before the grown
 *  Alexandria and Antioch would stand on them (and before EGYPT would sweep huge across the push-in) */
const LABELS_OUT = (f: number) => interpolate(f, [18, 36], [1, 0], { ...clamp, easing: Easing.in(Easing.sin) });
/** the far air over the frame's top in the oblique wide: the Mediterranean recedes into the haze (and the baked map's
 *  far western edge never shows); off on cut 45's top-down view and on the push-in's close view */
const FarAir: React.FC<{ air: MedAir; cam: Cam }> = ({ air, cam }) => {
  const w = sstep(Math.log(900), Math.log(1500), Math.log(cam.D)) * sstep(64, 50, cam.pitch);
  if (w <= 0.005) return null;
  const col = (y: number) => `rgb(${air.v.airAtScreen(y).map((v) => Math.round(v)).join(",")})`;
  const stops: [number, number][] = [[0, 0.95], [300, 0.86], [440, 0.62], [560, 0.2], [720, 0]];
  return (
    <g>
      <defs>
        <linearGradient id="hoe-far" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="720">
          {stops.map(([y, a]) => (
            <stop key={y} offset={y / 720} stopColor={col(y)} stopOpacity={a * w} />
          ))}
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={720} fill="url(#hoe-far)" />
    </g>
  );
};
const lowAirW = (D: number) => sstep(Math.log(100), Math.log(450), Math.log(D));
/** the Sidon furnace banks down to an ember during the pull-back (the one orange left for the Pharos) */
const FURNACE = (f: number) => interpolate(f, [6, 50], [1, 0.3], { ...clamp, easing: Easing.inOut(Easing.sin) });

const HubsOfExchange: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const air = medAir(cam, F45(frame), REST_AIR);
  const items: (Item | null)[] = [];
  items.push(...shipItems(cam, air, frame));
  items.push(...alexItems(cam, air, frame));
  items.push(...workshopItems(cam, air, WORKSHOP.at, WORKSHOP.facing, F45(frame), "wkshop", { glow: FURNACE(frame) }));
  items.push(...cityItems(cam, air, frame));
  items.push(...trainItems(cam, air, frame));
  return (
    <AbsoluteFill style={{ backgroundColor: "#3F3428" }}>
      <AirStage v={air.v} bloom={0.22}>
        <MedGround cam={cam} frame={F45(frame)} air={{ near: air.near, far: air.far }} quay={1} />
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          <AirHorizonHaze v={air.v} below={200} id="hoe-hz" />
          <GroundLabel cam={cam} text="EGYPT" at={EGYPT.at} cap={EGYPT.cap} u={LABELS_OUT(frame)} air={air} plate={1} />
          <GroundLabel cam={cam} text="SYRIA" at={SYRIA.at} cap={SYRIA.cap} u={LABELS_OUT(frame)} air={air} plate={1} />
          {LANES.map((L) => (
            <LaneLine key={L.id} cam={cam} air={air} L={L} frame={frame} />
          ))}
          {paint(items)}
          <FarAir air={air} cam={cam} />
          <LowAir air={air} amt={0.7 * lowAirW(cam.D)} />
        </svg>
      </AirStage>
    </AbsoluteFill>
  );
};

export default HubsOfExchange;
