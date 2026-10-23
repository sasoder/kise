// ---------------------------------------------------------------------------
// SunnyAirportStormLine (scott-radar-map, cut 5 "5_SunnyAirportStormLine"). Cheeky Pint style, the realistic "at sea"
// variant carried into the air (styles/cheeky-pint.md § Realistic ocean variant), in the weather clip's Denver world
// (scott-weather-fired/denverWorld.tsx, read-only) carried to Chicago O'Hare (ohareWorld.tsx). Opaque 1080x1920,
// 23.976 fps, 184 frames.
//
// CHECK LINE: "O'Hare itself sits in sunshine, but a wall of thunderstorms on the horizon cuts across the departure
// routes, so the planes can't get out."
//
// THE LINE: "(there was a day where) the weather was over the horizon, but it was sunny at the airport. But you had to
// fly through this line of thunderstorms. And so the routes were closed, right? You couldn't."
// WORD -> FRAME: the -11 · weather 5 · was 13 · over 18 · the 25 · horizon 28 · but 38 · It 55 · was 57 · sunny 59 ·
//   at 64 · the 69 · airport 71 · But 79 · you 87 · had 90 · to 92 · fly 94 · through 98 · this 104 · line 108 · of 113 ·
//   thunderstorms 116 · And 128 · so 130 · the 134 · routes 141 · were 148 · closed 153 · right 163 · You 167 ·
//   couldn't 176 (ends f183)
// DURATION: slot 5.547 -> 13.222 s = 7.675 s x 23.976 = 184 frames (f0..f183). Story clock S = f.
//
//
// THE MOTION (revision 1, director review 1): one continuous camera move that follows the words, moving from f0
// (fov 72): it opens tilted up on the storm wall, drifting forward with a slow pan ("the weather was over the horizon");
// from "but" (f38) it cranes down and forward onto O'Hare, BIG at "sunny at the airport" (f59-f90: the runway field
// ~92 % of the frame width, centred y ~880; the tilt leads the move); from ~f70 it follows the departures out, tilting
// back up so the wall fills the upper band by "thunderstorms" (f116), and settles ~f152 with the airport in the lower
// middle (y ~960-1270, ~85 % wide) and the wall across the top (towers ~250-540, the dark shelf and rain to ~600),
// then creeps. The storm line (21 cells ~21 mi west, the world's storm life, toned to heavy warm-slate lower bodies,
// a continuous dark shelf with falling rain curtains to the ground, anvil shelves on the big towers) boils from f0;
// in-cloud flickers f9, f26, f117, f158. The airport sits in a crisp warm sun pool (its ground re-drawn over the air,
// a screen-lit pool round it, the ground beyond a touch darker, the ground under and in front of the line darker
// still); parked and taxiing jets glint once each around f34-f92; "O'HARE" stands over the terminals f58-f116.
// Three westbound departures (28R, 27C, 27L) roll (f74 / 80 / 86, 16 f, accelerating) and lift off (f90 / 96 / 102);
// at lift-off each ROUTE draws ahead of its jet as a cream contrail line along a smooth departure curve (the runway
// heading easing into a gentle turn over 0.8-5 mi, a steady smooth climb) out to the storm line (tip at the wall
// f120 / 126 / 132); there its last 6 mi turn amber, flooding back from the wall over 10 f, with a soft amber glow
// where it dies in the cloud. Each jet peels off its route into a holding circle drawn as a cream contrail (fixes
// f124 / 127 / 159; circles ~345x89, 345x89, 296x54 px at rest). The jets lined up on 28C and 27R never go; the next
// jets on the parallel taxiways ease to a stop in their queues by f156. f160-f183: jets circling, queues waiting in
// the sun, the wall boiling; only the camera creeps.
// REVISION 1 (user, 2026-10-23: "glitching in the clouds ... which clouds are in the front and in the back"): the
// storm elements no longer depth-sort per frame (neighbouring towers swapped at f15, f33, f53 as the camera panned and
// tilted); ohareWorld draws them in one fixed back-to-front order by world x (rankX), each anvil just behind its own
// tower, each tower's rain just after it, the squall shelf at its own fixed rank. Nothing else changed.
// CONTACT FRAMES: amber lights when the route tip reaches the wall (state from the visible tip, not a timer); each hold
// begins at its jet's fix (tangent to the route: a continuous peel); no two jets come closer than 1.29 jet lengths
// (audited per frame).
// AMBER = the weather's reach on the routes (COMMON.md); cream = jets, routes, holding contrails; no UI symbols.
// CUT-LOCAL CHOICES: airborne jets drawn at a near-constant 62 px (map-symbol scale as in the weather clip), ground
// jets capped at 0.17 mi; the routes climb to 1.25 mi at the wall (into the dark base); holds low (0.1-0.25 mi) and
// 3-6 mi out so the camera sees them open; the storm line ~21 mi west (the NOAA 15 Jul 2024 reference frames show such
// a line 60+ mi west an hour out; nearer here so it reads).
//
// SOURCES: O'Hare layout traced from the FAA airport diagram AL-166 (KORD, effective 01 OCT 2026, public domain) and
// the USDA NAIP 2023 orthophoto (public domain), both in assets-src/scott-radar-map/ (SOURCES.md); baked by
// scripts/clips/scott-radar-map/bake-ohare.py and bake-ohare-aerial.py. Expressways schematic. No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import {
  CELL_DRIFT,
  HAZE,
  STORM_BOIL,
  WorldLabel,
  clamp01,
  flickerAt,
  fogAt,
  hash01,
  hexRgb,
  lerp,
  makeDenClock,
  makeView,
  mixRgb,
  rgbHex,
  smooth,
  type DenCam,
  type DenView,
  type StormState,
} from "../scott-weather-fired/denverWorld";
import { OhareStage, airJetNodes, lineD, runwayById, type AirPose } from "./ohareWorld";

export const FPS = 24000 / 1001;
export const DURATION = 184;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P2 = { x: number; y: number };
const TAU = Math.PI * 2;
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===================================================================================================================
// CAMERA: one continuous move that follows the words, moving from f0 (fov 72 throughout):
//   K_WALL (f0-f30)  tilted up toward the horizon on the storm wall, drifting forward ("over the horizon")
//   K_FIELD (f59-78) craned down and forward from "but" (f38) onto the sunlit airport, O'Hare big
//   K_REST (~f155)   from "fly through" (f94) it follows the departures out, tilting back up so the wall fills the
//                    upper band by "thunderstorms" (f116); the airport in the lower middle, the wall across the top
// then a creep to the end
// ===================================================================================================================
export const K_WALL: DenCam = { tx: -7.5, ty: 0.15, dist: 13.5, pitch: 7.5, heading: 275, fov: 72 };
export const K_FIELD: DenCam = { tx: 0.3, ty: 0.12, dist: 4.15, pitch: 32, heading: 270, fov: 72 };
export const K_REST: DenCam = { tx: -1.5, ty: 0.12, dist: 6.2, pitch: 20.5, heading: 270, fov: 72 };
const glideTo = (from: DenCam, to: DenCam, f0: number, f1: number, warp = 1) => ({ f0, f1, dtx: to.tx - from.tx, dty: to.ty - from.ty, dist: to.dist, pitch: to.pitch, fov: to.fov, warp });
export const CAM = makeDenClock(
  K_WALL,
  [
    // the opening drift: already moving at f0
    { f0: -40, f1: 60, dtx: -0.4, dist: K_WALL.dist * 0.92, pitch: K_WALL.pitch + 2.5 },
    // a slow pan from the wall's north end back to due west, under the whole opening and crane
    { f0: -30, f1: 72, heading: 270 },
    // the crane: the tilt down leads, the move forward and up follows (so the field grows steadily, never overshoots)
    { f0: 20, f1: 60, pitch: K_FIELD.pitch },
    { f0: 24, f1: 68, dtx: K_FIELD.tx - (K_WALL.tx - 0.4), dty: K_FIELD.ty - K_WALL.ty, dist: K_FIELD.dist, warp: 0.8 },
    glideTo(K_FIELD, K_REST, 70, 152, 1),
    { f0: 140, f1: 330, dtx: -0.35, dist: K_REST.dist * 0.93 },
  ],
  DURATION + 10,
  60,
);

// ===================================================================================================================
// THE STORM LINE: a squall line of thunderstorms ~30 mi west of O'Hare, north-south across the view
// ===================================================================================================================
export const LINE_X = -21;
const rnd = (i: number, k: number) => {
  const h = Math.sin(i * k + 4.1) * 43758.5453;
  return h - Math.floor(h);
};
/** 21 cells along the line, unevenly spaced in two loose ranks, a few big towers among smaller ones (a squall line,
 *  not a hedge): size 0.5-1.05, growth 0.5-0.675 (tops ~3-6.5 mi) */
const LINE: { id: string; x: number; y: number; seed: number; size: number; g: number }[] = Array.from({ length: 21 }, (_, i) => {
  const r1 = rnd(i, 12.9898);
  const r2 = rnd(i, 78.233);
  const r3 = rnd(i, 37.719);
  const y = -19 + (38 * i) / 20 + (r3 - 0.5) * 1.3;
  const big = i % 5 === 2 || i % 7 === 4;
  const size = big ? 0.9 + 0.15 * r2 : 0.5 + 0.3 * r2;
  return { id: `L${i}`, x: LINE_X + (i % 2 ? 1.6 : -1.4) + (r1 - 0.5) * 1.6 + 0.08 * y, y, seed: 201 + i * 7, size, g: big ? 0.66 : 0.5 + 0.15 * r1 };
});
/** the big towers' anvils: shelves at their tops spreading along the line (the tower top pierces each from below) */
const ANVILS = LINE.filter((c) => c.g >= 0.66).map((c, i) => ({ x: c.x - 0.9, y: c.y, zTop: 6.25 * c.size, thick: 1.5 * c.size, half: 5.2 * c.size, seed: 3 + i * 1.7, rankX: c.x }));
/** the line's x at a given y (its cells' mean, for the routes' ends) */
const lineXAt = (y: number) => LINE_X + 0.08 * y;
export const lineXAtY = lineXAt;
/** in-cloud flickers (start frames) per cell: two spaced in "the weather was over the horizon", one on
 *  "thunderstorms", one late */
const FLICKERS: Record<string, number[]> = { L9: [9], L14: [26], L7: [117], L12: [158] };
const cellsAt = (S: number): (StormState & { rankX: number })[] =>
  LINE.map((c) => ({
    id: c.id,
    rankX: c.x,
    x: c.x,
    y: c.y,
    seed: c.seed,
    size: c.size,
    vx: CELL_DRIFT.vx,
    vy: CELL_DRIFT.vy,
    anvilDir: 270,
    growth: Math.min(0.675, c.g + 0.03 * smooth(-40, 260, S)),
    boil: STORM_BOIL * 1.3,
    storminess: 1,
    rainStrength: 1.6,
    flicker: FLICKERS[c.id] ? flickerAt(S, FLICKERS[c.id]) : 0,
  }));

// ===================================================================================================================
// THE DEPARTURES: three westbound departures (28R, 27C, 27L); the jets lined up on 28C and 27R never go. Each lead
// jet waits lined up at its runway's east threshold, rolls (accelerating) and lifts off; at lift-off its ROUTE draws
// ahead of it as a cream contrail line (a moving tip, easing in) along a smooth departure curve (the runway heading
// easing into a gentle turn onto the route heading) out to the storm line, climbing steadily; where it meets the
// storms its last miles light amber (when the tip arrives: the weather's reach). The jet climbs out along its route
// and, short of the wall, peels off into a holding circle (tangent to the route at the hold fix), drawing the circle as
// a cream contrail.
// ===================================================================================================================
const V_AIR = 0.105; // miles / frame after lift-off (a timelapse)
const T_ROLL = 16; // frames of take-off roll (accelerating 0 -> V_AIR): roll length V_AIR * T_ROLL / 2 = 0.84 mi
const L_ROLL = (V_AIR * T_ROLL) / 2;
const T_TIP = 30; // frames for a route's tip to run from lift-off to the wall
const STUB_MI = 6; // the amber stub: the route's last miles before the wall
const WALL_Z = 1.25; // the routes' altitude where they meet the storms (in the dark base, under the towers)
type DepSpec = { id: string; rw: string; roll: number | null; head: number; sFix: number; r: number; side: 1 | -1 };
/** roll = the frame the take-off roll starts (lift-off = roll + T_ROLL; null = never goes); head = the route heading
 *  (deg, a gentle fan so every route meets the wall inside the frame); sFix = the hold fix's distance (miles) along
 *  the route from lift-off; side = which way the holding circle turns off the route (+1 = left, i.e. south for a
 *  westbound route) */
const DEPS: DepSpec[] = [
  { id: "28R", rw: "10L/28R", roll: 74, head: 263, sFix: 3.6, r: 1.0, side: 1 },
  { id: "27C", rw: "9C/27C", roll: 80, head: 277, sFix: 3.3, r: 1.0, side: -1 },
  { id: "27L", rw: "9R/27L", roll: 86, head: 270.5, sFix: 6.0, r: 1.15, side: -1 },
  { id: "28C", rw: "10C/28C", roll: null, head: 270, sFix: 5, r: 1, side: 1 },
  { id: "27R", rw: "9L/27R", roll: null, head: 270, sFix: 5, r: 1, side: -1 },
];
type Path = { pts: P2[]; cum: number[]; L: number };
type Dep = DepSpec & {
  thr: P2; // the east threshold (roll start)
  lift: P2; // lift-off point
  path: Path; // lift-off -> the smooth turn -> the fix -> the wall end (densified)
  fix: P2;
  dir: P2; // the route's direction at the fix
  zFix: number; // the hold's altitude (the route's altitude at the fix)
  tLift: number;
  tFix: number;
};
const mkPath = (pts: P2[]): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, L: cum[cum.length - 1] };
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
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), h: Math.atan2(b.x - a.x, b.y - a.y) };
};
const D2R = Math.PI / 180;
/** the departure curve's heading at distance s from lift-off: the runway heading easing into the route heading
 *  (smoothstep over 0.8-5 mi: C1, no kink) */
const headingAt = (hRw: number, hRoute: number, s: number) => hRw + (hRoute - hRw) * smooth(0.8, 5.0, s);
export const DEPARTURES: Dep[] = DEPS.map((d) => {
  const rw = runwayById(d.rw);
  const thr = { x: rw.x1, y: rw.y1 }; // east end
  const rl = Math.hypot(rw.x0 - rw.x1, rw.y0 - rw.y1);
  const ux = (rw.x0 - rw.x1) / rl;
  const uy = (rw.y0 - rw.y1) / rl;
  const lift = { x: thr.x + ux * L_ROLL, y: thr.y + uy * L_ROLL };
  const hRw = Math.atan2(ux, uy) / D2R;
  const hRoute = d.head > 180 && hRw < 0 ? d.head - 360 : d.head;
  const pts: P2[] = [lift];
  let p = { ...lift };
  const ds = 0.1;
  for (let s = 0; s < 80; s += ds) {
    const h = headingAt(hRw, hRoute, s + ds / 2) * D2R;
    p = { x: p.x + Math.sin(h) * ds, y: p.y + Math.cos(h) * ds };
    pts.push(p);
    if (p.x <= lineXAt(p.y) + 1.0) break;
  }
  const path = mkPath(pts);
  const f = pathAt(path, d.sFix);
  const hf = headingAt(hRw, hRoute, d.sFix) * D2R;
  const tLift = d.roll === null ? Infinity : d.roll + T_ROLL;
  return { ...d, thr, lift, path, fix: { x: f.x, y: f.y }, dir: { x: Math.sin(hf), y: Math.cos(hf) }, zFix: WALL_Z * Math.pow(d.sFix / path.L, 1.4), tLift, tFix: tLift + d.sFix / V_AIR };
});
const FLYING = DEPARTURES.filter((d) => d.roll !== null);
/** the route's altitude at distance s along it: a steady, smooth climb (zero slope at lift-off) to WALL_Z */
const routeZ = (d: Dep, s: number) => WALL_Z * Math.pow(clamp01(s / d.path.L), 1.4);
/** the route tip's distance along its path at frame f (0 before lift-off; eases into the wall) */
const tipS = (d: Dep, f: number) => {
  const u = clamp01((f - d.tLift) / T_TIP);
  return d.path.L * (1 - Math.pow(1 - u, 2.2));
};

/** A lead jet at frame f: lined up (before the roll), rolling, climbing out along the route, holding. */
type JetState = { pose: AirPose; phase: "lined" | "roll" | "climb" | "hold"; holdTh: number; s: number };
const leadJet = (d: Dep, f: number): JetState => {
  const hRw = Math.atan2(d.lift.x - d.thr.x, d.lift.y - d.thr.y);
  if (d.roll === null || f <= d.roll) return { pose: { x: d.thr.x, y: d.thr.y, z: 0, h: hRw }, phase: "lined", holdTh: -1, s: 0 };
  if (f <= d.tLift) {
    const t = f - d.roll;
    const u = (0.5 * V_AIR * t * t) / T_ROLL / L_ROLL;
    return { pose: { x: lerp(d.thr.x, d.lift.x, u), y: lerp(d.thr.y, d.lift.y, u), z: 0, h: hRw }, phase: "roll", holdTh: -1, s: 0 };
  }
  const s = (f - d.tLift) * V_AIR;
  if (s <= d.sFix) {
    const p = pathAt(d.path, s);
    const p2 = pathAt(d.path, s + 0.3);
    const dh = Math.atan2(Math.sin(p2.h - p.h), Math.cos(p2.h - p.h));
    return { pose: { x: p.x, y: p.y, z: routeZ(d, s), h: p.h, bank: Math.max(-0.5, Math.min(0.5, dh * 2.2)) }, phase: "climb", holdTh: -1, s };
  }
  // the hold: level at the fix's altitude
  const th = (s - d.sFix) / d.r;
  const n = { x: -d.dir.y * d.side, y: d.dir.x * d.side };
  const C = { x: d.fix.x + n.x * d.r, y: d.fix.y + n.y * d.r };
  const x = C.x - n.x * d.r * Math.cos(th) + d.dir.x * d.r * Math.sin(th);
  const y = C.y - n.y * d.r * Math.cos(th) + d.dir.y * d.r * Math.sin(th);
  const tx = n.x * Math.sin(th) + d.dir.x * Math.cos(th);
  const ty = n.y * Math.sin(th) + d.dir.y * Math.cos(th);
  return { pose: { x, y, z: d.zFix, h: Math.atan2(tx, ty), bank: -smooth(0, 0.6, th) * 0.42 * d.side }, phase: "hold", holdTh: th, s };
};
const holdCentre = (d: Dep) => {
  const n = { x: -d.dir.y * d.side, y: d.dir.x * d.side };
  return { x: d.fix.x + n.x * d.r, y: d.fix.y + n.y * d.r };
};

// ===================================================================================================================
// THE QUEUES: the next jets taxi in behind three runway ends from f0 and ease to a stop in a short queue there after
// the routes close (stopped by QUEUE_STOP): nobody else goes
// ===================================================================================================================
type QueueJet = { key: string; dep: string; slot: number; s0: number; side: 1 | -1 };
const QUEUE_SPACING = 0.22;
const QUEUE_STOP = 156;
/** slot = place in the queue (1 = next to go); s0 = miles west of the threshold at f0 (they taxi east toward it) */
const QUEUES: QueueJet[] = [
  { key: "q28R1", dep: "28R", slot: 1, s0: 0.75, side: 1 },
  { key: "q27C1", dep: "27C", slot: 1, s0: 0.7, side: 1 },
  { key: "q27C2", dep: "27C", slot: 2, s0: 1.05, side: 1 },
  { key: "q28C1", dep: "28C", slot: 1, s0: 0.8, side: -1 },
  { key: "q28C2", dep: "28C", slot: 2, s0: 1.15, side: -1 },
  { key: "q27R1", dep: "27R", slot: 1, s0: 0.7, side: 1 },
];
/** a queue jet's distance west of its threshold at f (taxiing east at a steady pace, easing to a stop in its slot) */
const queueS = (q: QueueJet, f: number) => {
  const slotS = q.slot * QUEUE_SPACING;
  return slotS + (q.s0 - slotS) * (1 - smooth(-60, QUEUE_STOP, f));
};
/** the queue line: the parallel taxiway beside the runway (side +1 = north, -1 = south, away from the neighbouring
 *  runway), from the threshold westward, jets facing east toward the runway end */
const QUEUE_OFF = 0.25;
const queuePose = (q: QueueJet, f: number): AirPose => {
  const d = DEPARTURES.find((e) => e.id === q.dep) as Dep;
  const s = queueS(q, f);
  const off = QUEUE_OFF * q.side;
  return { x: d.thr.x - s, y: d.thr.y + off, z: 0, h: Math.PI / 2 };
};

// ===================================================================================================================
// DRAWING
// ===================================================================================================================
/** the jets' drawn length (miles): a near-constant screen size (a touch smaller with distance) */
/** jets in the air keep a near-constant screen size (JET_PX long, a map-symbol scale as in the weather clip); on the
 *  ground they keep to the airfield's scale (capped at GROUND_LEN miles, so queues and rolling jets never overlap),
 *  easing from one to the other over the first 0.2 mi of climb */
const JET_PX = 62;
const GROUND_LEN = 0.17;
const jetLen = (v: DenView, x: number, y: number, z = 1) => {
  const air = JET_PX / Math.max(1e-6, v.scaleAt(x, y, z));
  const ground = Math.min(air, GROUND_LEN);
  return lerp(ground, air, smooth(0, 0.2, z));
};
const CREAM_RGB = hexRgb(COLOR.cream);
type Item = { d: number; node: React.ReactNode };

/** a route as a cream contrail line along its path up to its tip (perspective width), and its amber stub */
const routeNodes = (v: DenView, d: Dep, f: number): { items: Item[]; amber: React.ReactNode[] } => {
  const items: Item[] = [];
  const amber: React.ReactNode[] = [];
  const s1 = tipS(d, f);
  if (s1 <= 0.01) return { items, amber };
  // the amber floods back from the wall once the tip has run into it: the route's last STUB_MI miles over 10 frames
  const tw = d.tLift + T_TIP;
  const stubFront = d.path.L - STUB_MI * smooth(0, 10, f - tw + 1);
  const stubOn = smooth(-1, 3, f - tw);
  const step = 0.25;
  for (let s = 0; s < s1; s += step) {
    const sb = Math.min(s1, s + step);
    const a = pathAt(d.path, s);
    const b = pathAt(d.path, sb);
    const qa = v.project(a.x, a.y, routeZ(d, s));
    const qb = v.project(b.x, b.y, routeZ(d, sb));
    if (!qa || !qb) continue;
    const k = v.scaleAt(a.x, a.y, routeZ(d, s));
    const w = Math.max(1.4, Math.min(7, 0.028 * k));
    const fog = fogAt(v, a.x, a.y, routeZ(d, s));
    const inStub = sb > stubFront ? stubOn : 0;
    const col = rgbHex(mixRgb(CREAM_RGB, HAZE, fog * 0.6));
    const op = 0.86 * (1 - 0.35 * fog) * (1 - inStub);
    if (op > 0.01) items.push({ d: qa.d, node: <path key={`r${d.id}${s.toFixed(2)}`} d={lineD([qa, qb])} stroke={col} strokeWidth={f3(w)} strokeLinecap="round" opacity={f3(op)} fill="none" /> });
    if (inStub > 0.001) amber.push(<path key={`a${d.id}${s.toFixed(2)}`} d={lineD([qa, qb])} stroke={COLOR.amberTop} strokeWidth={f3(Math.max(2.4, w * 1.5))} strokeLinecap="round" opacity={f3(inStub)} fill="none" />);
  }
  // where the route dies in the storm: a soft amber glow at its end (lit with the stub)
  if (stubOn > 0.001) {
    const e = pathAt(d.path, d.path.L);
    const q = v.project(e.x, e.y, WALL_Z);
    if (q) {
      const k = v.scaleAt(e.x, e.y, WALL_Z);
      const R = Math.max(10, 0.9 * k);
      amber.push(<ellipse key={`g${d.id}`} cx={f3(q.x)} cy={f3(q.y)} rx={f3(R)} ry={f3(R * 0.55)} fill={COLOR.amberTop} opacity={f3(0.32 * stubOn)} style={{ filter: `blur(${f3(R * 0.4)}px)` }} />);
      amber.push(<ellipse key={`h${d.id}`} cx={f3(q.x)} cy={f3(q.y)} rx={f3(R * 0.32)} ry={f3(R * 0.22)} fill={COLOR.amberHot} opacity={f3(0.55 * stubOn)} style={{ filter: `blur(${f3(R * 0.12)}px)` }} />);
    }
  }
  return { items, amber };
};

/** a holding jet's circle drawn behind it as a fading cream contrail (three quarters of a circle at most) */
const holdTrail = (v: DenView, d: Dep, th: number, len: number): Item[] => {
  const out: Item[] = [];
  if (th <= 0) return out;
  const C = holdCentre(d);
  const n = { x: -d.dir.y * d.side, y: d.dir.x * d.side };
  const back = Math.min(th, TAU * 0.78);
  const segs = 40;
  const lag = (len * 0.55) / d.r;
  const at = (a: number) => v.project(C.x - n.x * d.r * Math.cos(a) + d.dir.x * d.r * Math.sin(a), C.y - n.y * d.r * Math.cos(a) + d.dir.y * d.r * Math.sin(a), d.zFix);
  const k = v.scaleAt(C.x, C.y, d.zFix);
  for (let i = 0; i < segs; i++) {
    const t0 = th - lag - (back * i) / segs;
    const t1 = th - lag - (back * (i + 1)) / segs;
    if (t0 < 0) break;
    const qa = at(t0);
    const qb = at(Math.max(0, t1));
    if (!qa || !qb) continue;
    out.push({
      d: qa.d + 0.001,
      node: <path key={`t${d.id}${i}`} d={lineD([qa, qb])} stroke={COLOR.cream} strokeWidth={f3(Math.max(1.6, 0.03 * k))} strokeLinecap="round" opacity={f3(0.8 * (1 - i / segs) * smooth(0, 0.5, th))} fill="none" />,
    });
  }
  return out;
};

/** a moving jet's glint: once, for ~10 frames, while the airport is the subject (f44-f92), staggered by key */
const jetGlint = (key: string, f: number) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h += key.charCodeAt(i) * (i + 1);
  const t0 = 46 + 40 * hash01(h * 0.37);
  const u = (f - t0) / 5;
  return Math.exp(-u * u);
};
/** gate-jet glints: a few parked jets catch the sun once, around "sunny at the airport" */
const gateGlint = (f: number) => (i: number) => {
  if (hash01(i * 7.1 + 3) > 0.32) return 0;
  const t0 = 34 + 54 * hash01(i * 3.7 + 1);
  const u = (f - t0) / 9;
  return Math.exp(-u * u) * 0.85;
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const SunnyAirportStormLine: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f;
  const v = makeView(CAM.at(f));
  const cells = cellsAt(S);

  const items: Item[] = [];
  const amber: React.ReactNode[] = [];
  const shadows: React.ReactNode[] = [];
  for (const d of DEPARTURES) {
    const r = routeNodes(v, d, f);
    items.push(...r.items);
    amber.push(...r.amber);
    const js = leadJet(d, f);
    const len = jetLen(v, js.pose.x, js.pose.y, js.pose.z);
    const jn = airJetNodes(v, d.id, js.pose, len, 1, js.pose.z < 0.01 ? jetGlint(d.id, f) : 0);
    // jets always draw over the route lines and trails at their own depth
    if (jn.body) items.push({ ...jn.body, d: jn.body.d - 0.4 });
    // the shadow stays with the jet on the ground and fades as it lifts (a shadow far from its jet reads as a second jet)
    if (js.pose.z < 0.08)
      shadows.push(
        <g key={`sh${d.id}`} opacity={f3(1 - smooth(0, 0.08, js.pose.z))}>
          {jn.shadow}
        </g>,
      );
    if (js.phase === "hold") items.push(...holdTrail(v, d, js.holdTh, len));
  }
  for (const q of QUEUES) {
    const p = queuePose(q, f);
    const jn = airJetNodes(v, q.key, p, jetLen(v, p.x, p.y, 0), 1, jetGlint(q.key, f));
    if (jn.body) items.push(jn.body);
    shadows.push(jn.shadow);
  }
  items.sort((a, b) => b.d - a.d);
  const labelIn = smooth(58, 70, f) * (1 - smooth(104, 116, f));

  return (
    <OhareStage
      S={S}
      v={v}
      cells={cells}
      stormShade={{ x: LINE_X, zTop: 5.2, zBase: 0.8, amount: 1 }}
      gloomX={LINE_X + 8}
      squall={{ x: LINE_X, y0: -26, y1: 26, zTop: 1.3, zBot: 0.55, seed: 7 }}
      anvils={ANVILS.map((a) => ({ ...a, x: a.x + CELL_DRIFT.vx * S, y: a.y + CELL_DRIFT.vy * S }))}
      gateGlint={gateGlint(f)}
      ground={<g>{shadows}</g>}
      over={
        <g>
          <g style={{ filter: bloomFilter(1) }}>{amber}</g>
          {items.map((it) => it.node)}
          <WorldLabel v={v} x={0.05} y={0.1} z={0.62} text="O'Hare" enter={labelIn} px={60} halo={1} />
        </g>
      }
    />
  );
};

export default SunnyAirportStormLine;

/** Audit helper: every jet's world pose and drawn length at frame f (lead jets + queue jets). */
export const DEP_TIMES = () => DEPARTURES.map((d) => ({ id: d.id, roll: d.roll, lift: d.tLift, fix: Math.round(d.tFix), wall: d.tLift + T_TIP }));
export const jetsAt = (f: number) => {
  const v = makeView(CAM.at(f));
  const out: { key: string; x: number; y: number; z: number; len: number; phase: string }[] = [];
  for (const d of DEPARTURES) {
    const js = leadJet(d, f);
    out.push({ key: d.id, ...js.pose, len: jetLen(v, js.pose.x, js.pose.y, js.pose.z), phase: js.phase });
  }
  for (const q of QUEUES) {
    const p = queuePose(q, f);
    out.push({ key: q.key, ...p, len: jetLen(v, p.x, p.y, 0), phase: "queue" });
  }
  return out;
};

// ---- module-load checks -------------------------------------------------------------------------------------------
// the holding circles never overlap (no two holding jets can meet)
for (let i = 0; i < FLYING.length; i++)
  for (let j = i + 1; j < FLYING.length; j++) {
    const a = holdCentre(FLYING[i]);
    const b = holdCentre(FLYING[j]);
    if (Math.hypot(a.x - b.x, a.y - b.y) < FLYING[i].r + FLYING[j].r + 0.25) throw new Error(`SunnyAirportStormLine: holds ${FLYING[i].id} / ${FLYING[j].id} overlap`);
  }
