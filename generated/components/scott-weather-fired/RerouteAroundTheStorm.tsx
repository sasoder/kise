// ---------------------------------------------------------------------------------------------------------------
// RerouteAroundTheStorm (scott-weather-fired, cut 35 "35_RerouteAroundTheStorm", a director's suggestion over ENABLED
// V1). Cheeky Pint style, the realistic "at sea" variant carried into the air (styles/cheeky-pint.md § Realistic ocean
// variant; the shared world denverWorld.tsx and cut 5 WorstCaseCornerPosts.tsx, both read-only). Opaque 1080x1920,
// 23.976 fps, 194 frames.
//
// CHECK LINE: "the imagined storms disappear, only one real storm is left in the south-east, the planes route around
// it, and Denver's airport keeps landing and launching jets."
//
// THE LINE: "But when you look at the data, like, well, sometimes the weather is to the southeast. But in most cases,
// use different arrival routes and departure routes, but you can keep the airport running."
// WORD -> FRAME: But 0 · when 8 · look 13 · data 21 · sometimes 39 · weather 50 · southeast 65 · (But 74) · most 96 ·
//   cases 103 · use 107 · different 126 · arrival 134 · routes 143 · and 151 · departure 158 · routes 164 · but 171 ·
//   keep 179 · airport 187 · running 191
// DURATION: slot 35.953 -> 44.044 s = 8.091 s x 23.976 = 194 frames (f0..f193).
// CLOCKS: f0 = cut 5's last frame (f179), pixel for pixel (proved with a still-vs-still difference image); every clock
//   continues: cut-5 clock k = 179 + f, story clock S = WORST_S0 + k. Cut 5's camera track, traffic schedule, holds
//   and ghost storms are re-derived here from its exports and asserted equal at module load (k 160..179).
//
// THE MOTION: one continuous change on cut 5's raised oblique, the slow creep continuing (a slow push and a pan of
// ~1 mile east that brings the real storm in from the frame edge). "When you look at the data" (f8-f40): the five
// ghost forecast storms drain back into the haze one after another (their amber glow going with them), all but the
// east one, which over f39-f65 ("sometimes the weather is to the southeast") becomes the one REAL storm: opaque, dark-
// based, raining, boiling (the world's storm life), its shadow on the ground over the south-east corridor's old turn,
// in-cloud flickers at f61 / f121 / f173; it keeps swelling to ~f130 so its west flank covers that turn. The last jet
// on the old south-east route slips past its west edge (lands ~f89). "In most cases, use different arrival routes"
// (f74-f150): the held jets peel out of their holding circles one per 28 f at each post (NW f76, NE f80, SE f84,
// SW f88; empty by f144) and rejoin their streams, their circle contrails fading; fresh jets stream in from the frame
// corners and the four corridors fill back to full (one jet per 20 f at each post); the south-east stream leaves its
// old corridor at the post and bends around the storm's WEST side, hooking over the field onto runway 17L (the old
// piece under the storm stays empty). "And departure routes" (rolls from f104): departures rise out of the runway
// tone, roll, lift off and climb out between the corridors, fanning outward (west, south, north, and one south-south-
// east that swings wide of the storm). "Keep the airport running" (f179-f193): a busy, settled, living frame.
// AMBER = the weather's reach: only the ghosts' glow as they drain and the real storm's in-cloud flickers. No text, no
// squares, no gate frames.
// CAUSE -> EFFECT: the storm is real (opaque, raining) from f65 before any south-east jet takes the new route (the
//   first leaves the old corridor at the post at f~85); a held jet leaves its circle only where it passes the hold fix.
//
// CUT-LOCAL CHOICES (world and cut 5 untouched): the south-east ghost is cut 5's east ghost (its base is east of the
// field at the frame's right edge: the forecast cell nearest the south-east corridor); the real storm grows from it
// (size 0.46 -> 0.64, growth -> 1) and is painted in this cut's own canvas so it can turn from translucent to opaque
// (the world's cell painter, rain and shadow helpers; the stage's cells list stays empty, as in cut 5). Jets behind it
// pass behind it. Departures use 16L (south) and 26 (west), which no arrival stream lands on after the reroute.
//
// SOURCES: DEN layout per denverAirfield.ts (LAYOUT_SOURCE); corner posts per cut 5 (assets-src/scott-weather-fired/
// SOURCES.md). No figures on screen.
// ---------------------------------------------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import {
  AirStage,
  DEN_COLORS,
  HAZE,
  RUNWAYS,
  SUN_DIR,
  cellItems,
  cellShadow,
  clamp01,
  flickerAt,
  fogAt,
  hexRgb,
  jetPlanPoints,
  lerp,
  makeDenClock,
  makeView,
  mixRgb,
  paintCloudItem,
  projectPoly,
  resetCloudPool,
  rgbCss,
  rgbHex,
  shadowOffset,
  smooth,
  type DenCam,
  type DenGlide,
  type DenView,
  type StormState,
} from "./denverWorld";
import {
  AREA_END,
  JET_SPEED,
  WORST_CAM,
  WORST_CAM_START,
  WORST_CORRIDORS,
  WORST_GHOSTS,
  WORST_GHOST_LOOK,
  WORST_HOLDS,
  WORST_HOLD_LAP,
  WORST_LIMIT_AT,
  WORST_POSTS,
  WORST_POST_Z,
  WORST_S0,
  worstGhostsAt,
  worstJetLenAt,
  worstJetPosesAt,
  worstUpSpeed,
  type WorstCorridor,
  type WorstPostId,
} from "./WorstCaseCornerPosts";

export const FPS = 24000 / 1001;
export const DURATION = 194;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** cut 5's last frame: this cut's f0 (cut-5 clock k = K0 + f) */
export const K0 = 179;

type P2 = { x: number; y: number };
type P3 = [number, number, number];
type PostId = WorstPostId;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const polyD = (pts: P2[]) => (pts.length > 2 ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}Z` : "");
const lineD = (pts: P2[]) => (pts.length > 1 ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}` : "");
const TAU = Math.PI * 2;
const W = 1080;
const H = 1920;
const GATE_Z = WORST_POST_Z;

// ===================================================================================================================
// THE CAMERA: cut 5's track (same start, same two glides, so it is identical through k 179), plus a slow push and a
// pan east from k 179 (an eased glide starting at rest: velocity-continuous)
// ===================================================================================================================
const PAN_MI = 0.8;
const C5_GLIDES: DenGlide[] = [
  {
    f0: -4,
    f1: 70,
    dtx: AREA_END.tx - WORST_CAM_START.tx,
    dty: AREA_END.ty - WORST_CAM_START.ty,
    dist: AREA_END.dist,
    pitch: AREA_END.pitch,
    heading: AREA_END.heading,
    warp: 0.85,
  },
  { f0: 64, f1: 260, dist: AREA_END.dist * 0.95, dty: 0.25 },
];
const CAM_K = makeDenClock(WORST_CAM_START, [...C5_GLIDES, { f0: K0, f1: K0 + 250, dtx: PAN_MI }], K0 + DURATION + 12, 40);
export const camAt = (f: number): DenCam => CAM_K.at(K0 + f);

// ===================================================================================================================
// PATHS (cut 5's helpers, re-stated cut-locally: pathAt / fillet / mkPath)
// ===================================================================================================================
type Path = { pts: P2[]; cum: number[]; L: number };
const mkPath = (pts: P2[]): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, L: cum[cum.length - 1] };
};
const wrapA = (x: number) => {
  let y = x;
  while (y > Math.PI) y -= TAU;
  while (y < -Math.PI) y += TAU;
  return y;
};
const pathAt = (p: Path, s: number) => {
  const d = Math.max(0, Math.min(p.L, s));
  let lo = 0;
  let hi = p.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p.cum[m] <= d) lo = m;
    else hi = m;
  }
  const a = p.pts[lo];
  const b = p.pts[hi];
  const l = p.cum[hi] - p.cum[lo] || 1;
  const t = (d - p.cum[lo]) / l;
  const seg = (i: number) => {
    const j = Math.max(0, Math.min(p.pts.length - 2, i));
    return Math.atan2(p.pts[j + 1].x - p.pts[j].x, p.pts[j + 1].y - p.pts[j].y);
  };
  const sc = seg(lo);
  const hA = sc + wrapA(seg(lo - 1) - sc) * 0.5;
  const hB = sc + wrapA(seg(lo + 1) - sc) * 0.5;
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), h: lerp(hA, hB, t) };
};
const fillet = (pts: P2[], r: number): P2[] => {
  const out: P2[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y);
    const l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const u1 = { x: (b.x - a.x) / l1, y: (b.y - a.y) / l1 };
    const u2 = { x: (c.x - b.x) / l2, y: (c.y - b.y) / l2 };
    const cross = u1.x * u2.y - u1.y * u2.x;
    const th = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y)));
    if (th < 1e-3) {
      out.push(b);
      continue;
    }
    const t = Math.min(r * Math.tan(th / 2), l1 * 0.45, l2 * 0.45);
    const rr = t / Math.tan(th / 2);
    const p1 = { x: b.x - u1.x * t, y: b.y - u1.y * t };
    const sgn = cross > 0 ? 1 : -1;
    const n = { x: -u1.y * sgn, y: u1.x * sgn };
    const C = { x: p1.x + n.x * rr, y: p1.y + n.y * rr };
    const a0 = Math.atan2(p1.y - C.y, p1.x - C.x);
    const steps = Math.max(4, Math.ceil(th / 0.04));
    for (let k = 0; k <= steps; k++) {
      const ang = a0 + sgn * th * (k / steps);
      out.push({ x: C.x + Math.cos(ang) * rr, y: C.y + Math.sin(ang) * rr });
    }
  }
  out.push(pts[pts.length - 1]);
  const dense: P2[] = [out[0]];
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1];
    const b = out[i];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(l / 0.25));
    for (let k = 1; k <= n; k++) dense.push({ x: lerp(a.x, b.x, k / n), y: lerp(a.y, b.y, k / n) });
  }
  return dense;
};

// ===================================================================================================================
// THE REAL STORM (cut 5's east ghost) and THE SOUTH-EAST REROUTE
// ===================================================================================================================
const STORM_IDX = 5;
const STORM_G = WORST_GHOSTS[STORM_IDX];
/** realness 0 (cut 5's translucent ghost) -> 1 (an opaque, raining thunderstorm) over "sometimes ... southeast" */
const realAt = (f: number) => smooth(39, 65, f);
/** in-cloud flickers (cut frames) */
const STORM_FLICKERS = [61, 121, 173];
const STORM_GROWTH = 0.7;
const stormState = (f: number): StormState => {
  const k = K0 + f;
  const gh = worstGhostsAt(k)[STORM_IDX];
  const r = realAt(f);
  // it matures on "southeast", then keeps swelling slowly so its west flank comes over the old corridor's turn
  const size = STORM_G.size + 0.04 * smooth(36, 66, f) + 0.14 * smooth(58, 132, f);
  return {
    ...gh,
    size,
    // growth stays a towering cell (the world's anvil is a flat shelf that reads as pale discs from this raised view)
    growth: lerp(gh.growth, STORM_GROWTH, smooth(34, 68, f)),
    // the heavy slate base of a thunderstorm comes with realness
    storminess: lerp(smooth(0.45, 0.95, gh.growth), 1, r),
    glow: (gh.glow ?? 0) * (1 - r),
    rain: r,
    rainStrength: r,
    shadowStrength: r,
    boil: lerp(gh.boil ?? 1, 1.25, smooth(30, 70, f)),

    flicker: flickerAt(f, STORM_FLICKERS, 3) * r,
  };
};
export const STORM_XY: P2 = { x: STORM_G.x, y: STORM_G.y };

const SE = WORST_CORRIDORS.SE;
/** the new south-east route: from the hold fix through the post as before, then leaning north-north-west up the west
 *  side of the storm, a broad hook over the top (left turn) and down the final for 17L (southbound), touchdown */
const RW17L = RUNWAYS.find((r) => r.id === "17L/35R") ?? RUNWAYS[0];
const R17L_THR: P2 = { x: RW17L.x0, y: Math.max(RW17L.y0, RW17L.y1) };
const SE_NEW: Path = (() => {
  const hookR = 0.82;
  const xW = R17L_THR.x;
  const xE = xW + 2 * hookR;
  const yC = 2.2;
  const pre = [SE.hold, SE.gate, { x: SE.gate.x - 0.32, y: 0.15 }, { x: xE, y: yC }];
  const arc: P2[] = [];
  for (let i = 1; i < 24; i++) {
    const a = (Math.PI * i) / 24;
    arc.push({ x: xW + hookR + hookR * Math.cos(a), y: yC + hookR * Math.sin(a) });
  }
  const post = [{ x: xW, y: yC }, R17L_THR, { x: xW, y: R17L_THR.y - 0.2 }];
  return mkPath(fillet([...pre, ...arc, ...post], 0.9));
})();
const SE_NEW_DIR: P2 = { x: 0, y: -1 };

// ===================================================================================================================
// TRAFFIC: cut 5's schedule continued (jets keep their index and fix time), the holds released, the streams refilled
// ===================================================================================================================
const HOLD_LAP = WORST_HOLD_LAP;
const SLOT_T = HOLD_LAP / 3;
const GAP0 = 22; // cut 5's opening spacing (frames at the fix)
const GAP_FULL = 20; // the refilled streams
const LATER = [98, 126, 182, 238]; // cut 5's later jets (frames after the first hold) that already exist by k 179
const TD_MI = 0.2;
const ROLL_TAU = 11;
const RAMP = 12; // frames a released jet takes from holding speed to stream speed
const DIST_TAB: number[] = (() => {
  const out = [0];
  let d = 0;
  for (let i = 1; i <= 4000 && d < 200; i++) {
    for (let k = 0; k < 4; k++) d += worstUpSpeed(d) * 0.25;
    out.push(d);
  }
  return out;
})();
const distBefore = (tau: number) => {
  const i = Math.floor(tau);
  if (i >= DIST_TAB.length - 1) return DIST_TAB[DIST_TAB.length - 1];
  return lerp(DIST_TAB[i], DIST_TAB[i + 1], tau - i);
};

/** a jet reaching the fix at t is not yet in the air at the join, or is still far beyond the frame there (so it is
 *  invisible on cut 5's frames) */
const offFrameAtJoin = (c: WorstCorridor, t: number) => {
  for (let kk = K0 - 20; kk <= K0; kk++) {
    const d = distBefore(t - kk);
    if (d >= c.up.L) continue;
    const p = pathAt(c.up, c.up.L - d);
    const q = makeView(CAM_K.at(kk)).project(p.x, p.y, GATE_Z + Math.min(1.4, 0.035 * d));
    if (q && q.x > -150 && q.x < W + 150 && q.y > -150 && q.y < H + 150) return false;
  }
  return true;
};
/** the first hold release at each post: the first pass of a held jet over the fix from these cut frames */
const RELEASE_FROM: Record<PostId, number> = { NW: 74, NE: 78, SE: 82, SW: 86 };
type Route = { down: Path; landDir: P2 };
type Arr = { idx: number; a: number; hold: boolean; release: number; route: Route };
const ARRIVALS: Record<PostId, Arr[]> = (() => {
  const out = {} as Record<PostId, Arr[]>;
  for (const id of WORST_POSTS) {
    const c = WORST_CORRIDORS[id];
    const j1 = WORST_LIMIT_AT[id] + 2;
    const old: Route = { down: c.down, landDir: c.landDir };
    const neu: Route = id === "SE" ? { down: SE_NEW, landDir: SE_NEW_DIR } : old;
    const list: Arr[] = [];
    let idx = 0;
    for (let k = 40; k >= 1; k--) list.push({ idx: idx++, a: j1 - 2 - GAP0 * k, hold: false, release: 0, route: old });
    // the held jets: each leaves its circle the first time it passes the fix at or after the release start
    const rs = K0 + RELEASE_FROM[id];
    const rel: number[] = [];
    for (let h = 0; h < 3; h++) {
      const a = j1 + h * SLOT_T;
      const n = Math.ceil((rs - a) / HOLD_LAP);
      rel.push(a + n * HOLD_LAP);
      list.push({ idx: idx++, a, hold: true, release: a + n * HOLD_LAP, route: neu });
    }
    const r0 = Math.min(...rel);
    const r2 = Math.max(...rel);
    // cut 5's later jets keep their fix times; the south-east ones from the third on take the new route
    LATER.forEach((dt, i) => list.push({ idx: idx++, a: j1 + dt, hold: false, release: 0, route: id === "SE" && i >= 2 ? neu : old }));
    // new jets: half a place between two releases while jets still circle (only where they are still beyond the
    // frame at k 179), then the full stream
    const fresh: number[] = [];
    for (const t of [r0 + SLOT_T / 2, r0 + (3 * SLOT_T) / 2]) {
      if (list.some((l) => Math.abs(l.a - t) < 1)) continue;
      if (!offFrameAtJoin(c, t)) continue;
      fresh.push(t);
    }
    for (let t = r2 + SLOT_T / 2; t < K0 + DURATION + 140; t += GAP_FULL) fresh.push(t);
    for (const t of fresh) list.push({ idx: idx++, a: t, hold: false, release: 0, route: neu });
    out[id] = list;
  }
  return out;
})();

type JetPose = { x: number; y: number; z: number; h: number; drain: number; loopTh: number; side: number; haze?: boolean; rel?: number };
/** distance along the route after leaving the fix at frame t0 (through jets at stream speed; released jets ease up
 *  from holding speed) */
const downS = (c: WorstCorridor, j: Arr, k: number) => {
  if (!j.hold) return { s: Math.fround(JET_SPEED * (k - j.a)), tTd: j.a + j.route.down.L / JET_SPEED };
  const vH = (TAU * c.loopR) / HOLD_LAP;
  const t = k - j.release;
  const dv = JET_SPEED - vH;
  const u = clamp01(t / RAMP);
  const s = t < RAMP ? vH * t + dv * RAMP * (u * u * u - (u * u * u * u) / 2) : JET_SPEED * t - (dv * RAMP) / 2;
  return { s, tTd: j.release + (j.route.down.L + (dv * RAMP) / 2) / JET_SPEED };
};
const arrPose = (id: PostId, j: Arr, k: number): JetPose | null => {
  const c = WORST_CORRIDORS[id];
  if (k <= j.a) {
    const d = distBefore(j.a - k);
    if (d >= c.up.L) return null;
    // Math.fround: cut 5 keeps its path distances and circle angles in Float32 arrays (bit-exact join)
    const s = Math.fround(c.up.L - d);
    const p = pathAt(c.up, s);
    const z = GATE_Z + Math.min(1.4, 0.035 * (c.up.L - s));
    return { x: p.x, y: p.y, z, h: p.h, drain: 1 - smooth(0, 14, s), loopTh: -1, side: c.outer, haze: true };
  }
  if (j.hold && k < j.release) {
    const th = Math.fround(((TAU * c.loopR) / HOLD_LAP / c.loopR) * (k - j.a));
    const u = c.inDir;
    const n = { x: -u.y * c.outer, y: u.x * c.outer };
    const C = { x: c.hold.x + n.x * c.loopR, y: c.hold.y + n.y * c.loopR };
    const x = C.x + c.loopR * (-n.x * Math.cos(th) + u.x * Math.sin(th));
    const y = C.y + c.loopR * (-n.y * Math.cos(th) + u.y * Math.sin(th));
    const dx = n.x * Math.sin(th) + u.x * Math.cos(th);
    const dy = n.y * Math.sin(th) + u.y * Math.cos(th);
    return { x, y, z: GATE_Z, h: Math.atan2(dx, dy), drain: 0, loopTh: th, side: c.outer };
  }
  const R = j.route;
  const ds = downS(c, j, k);
  let s = ds.s;
  let drain = 0;
  if (s >= R.down.L) {
    const tt = k - ds.tTd;
    s = R.down.L + JET_SPEED * ROLL_TAU * (1 - Math.exp(-tt / ROLL_TAU));
    // rolled out, it drains into the runway tone (a little sooner than in cut 5: the refilled streams land 14-20 f apart)
    drain = smooth(3, 16, tt);
    if (drain >= 0.999) return null;
  }
  let x: number;
  let y: number;
  let h: number;
  if (s <= R.down.L) {
    const p = pathAt(R.down, s);
    x = p.x;
    y = p.y;
    h = p.h;
  } else {
    const end = R.down.pts[R.down.pts.length - 1];
    x = end.x + R.landDir.x * (s - R.down.L);
    y = end.y + R.landDir.y * (s - R.down.L);
    h = Math.atan2(R.landDir.x, R.landDir.y);
  }
  const sThr = R.down.L - TD_MI;
  const z = s <= c.sGate ? GATE_Z : s >= sThr ? 0 : GATE_Z * Math.pow(1 - (s - c.sGate) / (sThr - c.sGate), 1.15);
  return { x, y, z, h, drain, loopTh: -1, side: c.outer, rel: j.hold ? k - j.release : undefined };
};

// ---- departures: rise out of the runway tone at the start of the roll, roll, lift off, climb out between corridors --
const RW16L = RUNWAYS.find((r) => r.id === "16L/34R") ?? RUNWAYS[0];
const RW26 = RUNWAYS.find((r) => r.id === "8/26") ?? RUNWAYS[0];
const D16: P2 = { x: RW16L.x0, y: Math.max(RW16L.y0, RW16L.y1) - 0.08 };
const D26: P2 = { x: Math.max(RW26.x0, RW26.x1) - 0.08, y: RW26.y0 };
const depPath = (pts: P2[], r: number) => mkPath(fillet(pts, r));
const DEP_ROUTES = {
  // west: off 16L, a right turn out between the south-west and north-west corridors
  W: depPath([D16, { x: D16.x, y: 1.35 }, { x: -2.6, y: 0.85 }, { x: -16, y: 0.4 }], 1.0),
  // south: off 16L straight out, a touch west of south, between the south-west and south-east corridors
  S: depPath([D16, { x: D16.x, y: -0.4 }, { x: D16.x - 0.21 * 14, y: -0.4 - 14 }], 1.4),
  // south-east: off 16L, a left turn across the south of the field, then a wide swing out to the south-east, well
  // south of the storm, climbing over the south-east arrivals
  SE: depPath([D16, { x: D16.x, y: 0.6 }, { x: 0.7, y: -2.3 }, { x: 0.7 + 0.84 * 14, y: -2.3 - 14 }], 1.4),
  // north: off 26 westbound, a right turn up the middle between the north-west and north-east corridors
  N: depPath([D26, { x: 0.15, y: D26.y }, { x: -0.05, y: 3.4 }, { x: -0.25, y: 30 }], 0.9),
} as const;
type DepKey = keyof typeof DEP_ROUTES;
/** roll starts (cut frames) */
const DEPS: { route: DepKey; t0: number }[] = [
  { route: "N", t0: 97 },
  { route: "W", t0: 98 },
  { route: "S", t0: 118 },
  { route: "SE", t0: 138 },
  { route: "W", t0: 158 },
  { route: "N", t0: 176 },
  { route: "S", t0: 178 },
];
const ROLL_F = 24; // frames from brake release to lift-off (accelerating to stream speed)
const LIFT_S = (JET_SPEED * ROLL_F) / 2;
const depS = (t: number) => (t <= ROLL_F ? (JET_SPEED * t * t) / (2 * ROLL_F) : LIFT_S + JET_SPEED * (t - ROLL_F) + 0.0021 * (t - ROLL_F) * (t - ROLL_F));
const depPose = (d: (typeof DEPS)[number], f: number): JetPose | null => {
  const t = f - d.t0;
  if (t < 0) return null;
  const P = DEP_ROUTES[d.route];
  const s = depS(t);
  if (s >= P.L) return null;
  const p = pathAt(P, s);
  const sl = Math.max(0, s - LIFT_S);
  const z = Math.min(3.2, 0.17 * sl + 0.012 * sl * sl);
  return { x: p.x, y: p.y, z, h: p.h, drain: 1 - smooth(0, 13, t), loopTh: -1, side: 1 };
};

// ===================================================================================================================
// DRAWING: cut 5's 3D airliner (its look, re-stated cut-locally) and the ghosts' look
// ===================================================================================================================
const FIELD = (() => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const r of RUNWAYS) {
    x0 = Math.min(x0, r.x0, r.x1);
    x1 = Math.max(x1, r.x0, r.x1);
    y0 = Math.min(y0, r.y0, r.y1);
    y1 = Math.max(y1, r.y0, r.y1);
  }
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
})();
/** cut 5's near-constant jet size after its pull-up: 54 px at the field's distance */
const jetLenFor = (v: DenView) => 54 / (v.scaleAt(FIELD.x, FIELD.y, 0) || 1);
const SUN3: P3 = [SUN_DIR[0], SUN_DIR[1], SUN_DIR[2]];
const CREAM = hexRgb(COLOR.cream);
const CREAM_FOOT = hexRgb(COLOR.creamFoot);
type Item = { d: number; behind: boolean; node: (op: number) => React.ReactNode };
const jetNodes = (v: DenView, key: string, p: JetPose, len: number, runwayRgb: [number, number, number]): { body: Item | null; shadow: React.ReactNode } => {
  const q = v.project(p.x, p.y, p.z);
  if (!q) return { body: null, shadow: null };
  const fog = fogAt(v, p.x, p.y, p.z);
  const sh = shadowOffset(p.z);
  const op = 1 - p.drain * p.drain;
  const s = Math.sin(p.h);
  const c = Math.cos(p.h);
  const W3 = (a: number, b: number, zz: number): P3 => [p.x + (a * c + b * s) * len, p.y + (-a * s + b * c) * len, p.z + zz * len];
  const fogged = (col: [number, number, number]) => mixRgb(mixRgb(col, HAZE, fog), p.haze ? HAZE : runwayRgb, p.drain);
  const plan = projectPoly(v, jetPlanPoints(p.x, p.y, p.h, len, p.z));
  const spine = projectPoly(v, [W3(-0.045, 0.43, 0.035), W3(0.045, 0.43, 0.035), W3(0.05, -0.38, 0.035), W3(-0.05, -0.38, 0.035)]);
  const fin = projectPoly(v, [W3(0, -0.3, 0.03), W3(0, -0.47, 0.03), W3(0, -0.5, 0.2), W3(0, -0.42, 0.2)]);
  const finN: P3 = [c, -s, 0];
  const finLit = Math.abs(finN[0] * SUN3[0] + finN[1] * SUN3[1]);
  const shadowPts = projectPoly(v, jetPlanPoints(p.x + sh.x, p.y + sh.y, p.h, len, 0));
  const shOp = 0.34 * (1 - fog) * lerp(1, 0.55, clamp01(p.z / 2)) * op;
  const behind = isBehindStorm(v, p, q.d);
  return {
    shadow: <path key={`s${key}`} d={polyD(shadowPts)} fill={COLOR.shadow} opacity={f3(shOp)} />,
    body: {
      d: q.d,
      behind,
      node: (k: number) => (
        <g key={`j${key}_${k < 1 ? "u" : "o"}`} opacity={f3(op * k)}>
          <path d={polyD(plan)} fill={rgbHex(fogged(mixRgb(CREAM_FOOT, CREAM, 0.55)))} stroke={rgbHex(fogged(hexRgb(DEN_COLORS.jetShade)))} strokeWidth={0.8} strokeLinejoin="round" />
          <path d={polyD(spine)} fill={rgbHex(fogged(CREAM))} />
          <path d={polyD(fin)} fill={rgbHex(fogged(mixRgb(CREAM_FOOT, CREAM, clamp01(0.3 + finLit))))} stroke={rgbHex(fogged(hexRgb(DEN_COLORS.jetShade)))} strokeWidth={0.6} strokeLinejoin="round" />
        </g>
      ),
    },
  };
};
/** a jet (or trail) is behind the storm when it is farther from the eye than the storm's column and north of it */
const isBehindStorm = (v: DenView, p: { x: number; y: number; z: number }, d: number) => {
  const sq = v.project(STORM_XY.x, STORM_XY.y, 1.0);
  return !!sq && d > sq.d && p.y > STORM_XY.y + 0.4;
};

/** one ghost forecast storm as cut 5 draws it (its canvas look), with a drain (0 = as in cut 5, 1 = gone into the
 *  haze) or, for the south-east one, a realness (0 = the ghost, 1 = an opaque thunderstorm with its rain) */
const GhostCanvas: React.FC<{ v: DenView; st: StormState; S: number; real: number; opacity: number; haze: number; tag: string }> = ({ v, st, S, real, opacity, haze, tag }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify([v.cam, st, S, real, tag]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    resetCloudPool();
    const its = cellItems(v, st, S).filter((it) => it.type === "cell" || real > 0);
    its.sort((a, b) => b.d - a.d);
    for (const it of its) paintCloudItem(ctx, it);
    const ghost = 1 - real;
    if (ghost > 0) {
      const sz = st.size ?? 1;
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = `rgba(250,245,234,${WORST_GHOST_LOOK.creamLift * ghost})`;
      ctx.fillRect(0, 0, W, H);
      const core = v.project(st.x, st.y, WORST_GHOST_LOOK.glowZ * sz);
      const k = v.scaleAt(st.x, st.y, WORST_GHOST_LOOK.glowZ * sz);
      if (core) {
        const g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, Math.max(30, WORST_GHOST_LOOK.glowR * sz * k));
        g.addColorStop(0, `rgba(255,180,40,${WORST_GHOST_LOOK.glowCore * ghost})`);
        g.addColorStop(0.45, `rgba(255,176,0,${0.34 * ghost})`);
        g.addColorStop(1, "rgba(255,176,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (opacity <= 0) return null;
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity, filter: haze > 0.2 ? `blur(${f3(haze)}px)` : undefined }}
    />
  );
};
/** the five other ghosts drain back into the haze one after another, west first, clockwise (as they rose in cut 5) */
const GHOST_DRAIN_AT = [8, 12.5, 17, 21.5, 26];
const GHOST_DRAIN_F = 14;

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const collectJets = (f: number, v: DenView) => {
  const k = K0 + f;
  const len = jetLenFor(v);
  const runwayRgb = hexRgb(DEN_COLORS.runway);
  const items: Item[] = [];
  const shadows: React.ReactNode[] = [];
  const trails: { behind: boolean; node: (op: number) => React.ReactNode }[] = [];
  for (const id of WORST_POSTS) {
    const c = WORST_CORRIDORS[id];
    for (const j of ARRIVALS[id]) {
      const p = arrPose(id, j, k);
      if (!p) continue;
      const nodes = jetNodes(v, `${id}${j.idx}`, p, len, runwayRgb);
      if (!nodes.body) continue;
      items.push(nodes.body);
      shadows.push(nodes.shadow);
      // a held jet draws its holding circle as a fading contrail (cut 5); after it leaves the circle the contrail
      // stays where it was drawn and fades away
      const held = p.loopTh > 0;
      const relT = p.rel ?? -1;
      if (j.hold && (held || (relT >= 0 && relT < 26))) {
        const thNow = held ? p.loopTh : ((TAU * c.loopR) / HOLD_LAP / c.loopR) * (j.release - j.a);
        const fade = held ? 1 : 1 - smooth(0, 26, relT);
        const u = c.inDir;
        const n = { x: -u.y * c.outer, y: u.x * c.outer };
        const C = { x: c.hold.x + n.x * c.loopR, y: c.hold.y + n.y * c.loopR };
        const back = Math.min(thNow, TAU * 0.75);
        const segs = 28;
        const lag = (len * 0.5) / c.loopR;
        const behind = isBehindStorm(v, { x: C.x, y: C.y, z: GATE_Z }, v.project(C.x, C.y, GATE_Z)?.d ?? 0);
        const segNodes: ((op: number) => React.ReactNode)[] = [];
        for (let sI = 0; sI < segs; sI++) {
          const t0 = thNow - lag - (back * sI) / segs;
          const t1 = thNow - lag - (back * (sI + 1)) / segs;
          if (t1 < 0) break;
          const pa = [t0, t1].map((th) => v.project(C.x + c.loopR * (-n.x * Math.cos(th) + u.x * Math.sin(th)), C.y + c.loopR * (-n.y * Math.cos(th) + u.y * Math.sin(th)), GATE_Z));
          if (!pa[0] || !pa[1]) continue;
          const d = lineD([pa[0], pa[1]]);
          const w = f3(Math.max(2, len * v.scaleAt(C.x, C.y, GATE_Z) * 0.085));
          const o = 0.62 * (1 - sI / segs) * smooth(0, 0.8, thNow) * fade;
          segNodes.push((op: number) => <path key={`t${id}${j.idx}_${sI}_${op < 1 ? "u" : "o"}`} d={d} stroke={COLOR.cream} strokeWidth={w} strokeLinecap="round" opacity={f3(o * op)} fill="none" />);
        }
        trails.push({ behind, node: (op: number) => <g key={`tg${id}${j.idx}_${op < 1 ? "u" : "o"}`}>{segNodes.map((sn) => sn(op))}</g> });
      }
    }
  }
  DEPS.forEach((d, i) => {
    const p = depPose(d, f);
    if (!p) return;
    const nodes = jetNodes(v, `D${i}`, p, len, runwayRgb);
    if (!nodes.body) return;
    items.push(nodes.body);
    shadows.push(nodes.shadow);
  });
  items.sort((a, b) => b.d - a.d);
  return { items, shadows, trails, len };
};

const RerouteAroundTheStorm: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const k = K0 + f;
  const S = WORST_S0 + k;
  const v = makeView(camAt(f));
  const { items, shadows, trails } = collectJets(f, v);
  const real = realAt(f);
  const storm = stormState(f);
  const ghosts = worstGhostsAt(k);
  const sh = real > 0 ? cellShadow(v, storm, S) : null;
  const shadowFill = (() => {
    if (!sh) return null;
    const cx = sh.pts.reduce((a, p) => a + p.x, 0) / sh.pts.length;
    const cy = sh.pts.reduce((a, p) => a + p.y, 0) / sh.pts.length;
    const steps = 12;
    const a1 = 1 - Math.pow(1 - sh.a, 1 / steps);
    return (
      <g>
        {Array.from({ length: steps }, (_, i) => {
          const s = 1.25 - (i / (steps - 1)) * 0.75;
          return <path key={`ss${i}`} d={polyD(sh.pts.map((p) => ({ x: cx + (p.x - cx) * s, y: cy + (p.y - cy) * s })))} fill={rgbCss(hexRgb("#3A2A1E"), a1)} />;
        })}
      </g>
    );
  })();
  const under = 1 - real; // jets and contrails behind the storm show through it while it is still a ghost
  return (
    <AirStage
      S={S}
      v={v}
      cells={[]}
      ground={
        <g>
          <defs>
            <filter id="rrSoftShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={f3(Math.max(1.2, 0.05 * v.scaleAt(FIELD.x, FIELD.y, 0)))} />
            </filter>
          </defs>
          {shadowFill}
          <g filter="url(#rrSoftShadow)">{shadows}</g>
        </g>
      }
      over={
        <g>
          {WORST_GHOSTS.map((_, i) => {
            if (i === STORM_IDX) return null;
            const e = 1 - smooth(GHOST_DRAIN_AT[i], GHOST_DRAIN_AT[i] + GHOST_DRAIN_F, f);
            if (e <= 0) return null;
            // it sinks back as it goes: the growth eases down while the canvas veils into the haze
            const st = { ...ghosts[i], growth: ghosts[i].growth - 0.18 * (1 - e) };
            return (
              <foreignObject key={`gh${i}`} x={0} y={0} width={W} height={H}>
                <GhostCanvas v={v} st={st} S={S} real={0} opacity={WORST_GHOST_LOOK.opacity * e} haze={lerp(14, 0, e)} tag={`g${i}`} />
              </foreignObject>
            );
          })}
          {real > 0 ? (
            <g>
              {trails.filter((t) => t.behind).map((t) => t.node(0.999))}
              {items.filter((it) => it.behind).map((it) => it.node(0.999))}
            </g>
          ) : null}
          <foreignObject key="storm" x={0} y={0} width={W} height={H}>
            <GhostCanvas v={v} st={storm} S={S} real={real} opacity={lerp(WORST_GHOST_LOOK.opacity, 1, real)} haze={0} tag="storm" />
          </foreignObject>
          <g>{trails.map((t) => (t.behind ? (under > 0 ? t.node(under) : null) : t.node(1)))}</g>
          {items.map((it) => (it.behind ? (under > 0 ? it.node(under) : null) : it.node(1)))}
        </g>
      }
    />
  );
};

export default RerouteAroundTheStorm;

// ===================================================================================================================
// AUDIT HELPERS and MODULE-LOAD CHECKS (the join to cut 5)
// ===================================================================================================================
/** every live jet at cut frame f: key, screen position, opacity, phase (for the per-jet continuity audit) */
export const rerouteJetsAt = (f: number) => {
  const k = K0 + f;
  const v = makeView(camAt(f));
  const out: { key: string; x: number; y: number; op: number; kind: string; wx: number; wy: number; wz: number }[] = [];
  for (const id of WORST_POSTS)
    for (const j of ARRIVALS[id]) {
      const p = arrPose(id, j, k);
      if (!p) continue;
      const q = v.project(p.x, p.y, p.z);
      if (!q) continue;
      out.push({ key: `${id}${j.idx}`, x: q.x, y: q.y, op: 1 - p.drain * p.drain, kind: p.loopTh >= 0 ? "hold" : j.route.down === SE_NEW ? "new" : "arr", wx: p.x, wy: p.y, wz: p.z });
    }
  DEPS.forEach((d, i) => {
    const p = depPose(d, f);
    if (!p) return;
    const q = v.project(p.x, p.y, p.z);
    if (!q) return;
    out.push({ key: `D${i}${d.route}`, x: q.x, y: q.y, op: 1 - p.drain * p.drain, kind: "dep", wx: p.x, wy: p.y, wz: p.z });
  });
  return out;
};
export const rerouteStormAt = (f: number) => stormState(f);
export const REROUTE_SE_NEW = SE_NEW;
/** audit: a departure on a route with a roll start t0, at cut frame f */
export const rerouteDepProbe = (route: DepKey, t0: number, f: number) => depPose({ route, t0 }, f);
{
  // the camera: identical to cut 5's track through its last frame
  for (let kk = 150; kk <= K0; kk++) {
    const a = CAM_K.at(kk);
    const b = WORST_CAM.at(kk);
    const e = Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty) + Math.abs(a.dist - b.dist) + Math.abs(a.pitch - b.pitch) + Math.abs(a.heading - b.heading) + Math.abs(a.fov - b.fov);
    if (e > 1e-9) throw new Error(`RerouteAroundTheStorm: camera differs from cut 5 at k ${kk} (${e})`);
  }
  // the traffic: every jet cut 5 has on its last frames, at the same pose, and no other
  for (let kk = 160; kk <= K0; kk++) {
    const ref = worstJetPosesAt(kk);
    const mine: { post: PostId; idx: number; p: JetPose }[] = [];
    for (const id of WORST_POSTS)
      for (const j of ARRIVALS[id]) {
        const p = arrPose(id, j, kk);
        if (p) mine.push({ post: id, idx: j.idx, p });
      }
    const vk = makeView(CAM_K.at(kk));
    for (const m of mine) {
      if (ref.some((r) => r.post === m.post && r.idx === m.idx)) continue;
      const q = vk.project(m.p.x, m.p.y, m.p.z);
      if (q && q.x > -150 && q.x < W + 150 && q.y > -150 && q.y < H + 150) throw new Error(`RerouteAroundTheStorm: extra jet ${m.post}${m.idx} in frame at k ${kk}`);
    }
    for (const r of ref) {
      const m = mine.find((q) => q.post === r.post && q.idx === r.idx);
      if (!m) throw new Error(`RerouteAroundTheStorm: jet ${r.post}${r.idx} missing at k ${kk}`);
      const e = Math.abs(m.p.x - r.pose.x) + Math.abs(m.p.y - r.pose.y) + Math.abs(m.p.z - r.pose.z) + Math.abs(wrapA(m.p.h - r.pose.h)) + Math.abs(m.p.drain - r.pose.drain);
      if (e > 1e-9) throw new Error(`RerouteAroundTheStorm: jet ${r.post}${r.idx} differs at k ${kk} (${e})`);
    }
  }
  // the jet size and the holds
  const lenErr = Math.abs(jetLenFor(makeView(camAt(0))) - worstJetLenAt(K0));
  if (lenErr > 1e-9) throw new Error(`RerouteAroundTheStorm: jet length differs from cut 5 (${lenErr})`);
  for (const id of WORST_POSTS) if (Math.abs(WORST_HOLDS[id].r - WORST_CORRIDORS[id].loopR) > 1e-9) throw new Error("RerouteAroundTheStorm: hold radius mismatch");
  // the storm at f0 is cut 5's east ghost exactly
  const s0 = stormState(0);
  const g0 = worstGhostsAt(K0)[STORM_IDX];
  if (Math.abs(s0.size! - g0.size!) > 1e-12 || Math.abs(s0.growth - g0.growth) > 1e-12 || Math.abs((s0.glow ?? 0) - (g0.glow ?? 0)) > 1e-12 || Math.abs((s0.boil ?? 1) - (g0.boil ?? 1)) > 1e-12)
    throw new Error("RerouteAroundTheStorm: the storm at f0 is not cut 5's ghost");
}
