// ---------------------------------------------------------------------------------------------------------------
// WorstCaseCornerPosts (scott-weather-fired, cut 27 "27_WorstCaseCornerPosts"). Cheeky Pint style, the realistic
// "at sea" variant carried into the air (styles/cheeky-pint.md § Realistic ocean variant; the shared world
// denverWorld.tsx, read-only). Opaque 1080x1920, 23.976 fps, 180 frames.
//
// CHECK LINE: "air traffic flows into Denver through four gates; a forecast blanket of possible storms covers the
// whole area, so all four gates get squeezed and the flow of planes drops to a trickle."
//
// THE LINE: "[So the FAA just] takes the worst case. We don't know where the thunderstorm will be. They limit all the
// corner posts, all the... And they just pull down the amount of traffic that's coming through the airport
// proactively."
// WORD -> FRAME: takes 3 · the 8 · worst 11 · case 16 · We 22 · don't 24 · know 27 · where 29 · the 32 ·
//   thunderstorm 36 · will 45 · be 49 · They 56 · limit 57 · all 62 · the 68 · corner 72 · posts 78 · all 89 ·
//   the... 92 · And 106 · they 110 · just 112 · pull 117 · down 121 · the 125 · amount 128 · of 131 · traffic 133 ·
//   that's 141 · coming 146 · through 150 · the 154 · airport 156 · proactively 163
// DURATION: slot 27.861 -> 35.369 s = 7.508 s x 23.976 = 180 frames (f0..f179). Story clock S = 614 + f (sequence
//   frame 668 minus cut 1's in, frame 54).
//
// THE MOTION (v4, revision 3: no gate frames, even pacing): one continuous move. f0 = DEN_CAM_ESTABLISH on a clear
// afternoon (no storms), jets on approach; from f0 the camera pulls up and tilts to a RAISED OBLIQUE (pitch 44,
// heading 0; one damped glide settled by ~f75, then a slow creep): DEN big in the middle on the world's aerial, four
// arrival streams pouring in from the four frame corners past the four corner posts (NW, NE, SE, SW; nothing drawn at
// a post: a post is where its stream turns for the field), 3D airliners at altitude with soft ground shadows,
// descending to four runways (one pinwheel flow: NW -> 16R, NE -> 17R, SE -> 26, SW -> 7).
// "We don't know where the thunderstorm will be" (f22-f46): six GHOST forecast storms rise out of the haze round the
// field's west, north and east, one after another clockwise (4 f apart): the world's storm cells (with the world's
// storm life, boil 0.8) drawn as translucent cream-white towers (~48 %) with a steady warm-amber glow inside the lower
// body = possible storms (the worst-case forecast), not real ones; the field stays in sun.
// "Limit all the corner posts" (from f57, staggered NW 59 / NE 63 / SE 67 / SW 71): the jets reaching each post break
// into a HOLDING CIRCLE beside the post instead of flowing through, one more every 28 f (1 -> 2 -> 3 circling, three
// places 120 degrees apart on an 84-frame circle, each drawing the circle as a fading contrail); the circles fill by
// ~f128 and circle on slowly to the end. "Pull down the amount of traffic": fewer jets are fed in (the streams open
// from the frame corners inward over ~f70-140) and the few still coming slip through each post half a place between
// two circling jets: a trickle lands. By ~f150 a calm settled frame: three jets circling at each post, sparse streams,
// a jet now and then landing. Nothing new starts after ~f155. No jet is deleted mid-air: every jet enters beyond the
// frame (fading up out of the haze far out) and leaves only by landing (it drains into the runway tone as it rolls out).
// AMBER = the weather's reach (the worst-case forecast storms). Cream jets and contrails; nothing else amber. No text.
//
// CUT-LOCAL CHOICES (world files untouched): the corner posts sit a few miles off the field (not the true ~46 mi; the
// corner-post figure in SOURCES.md is schematic and gives no distances), placed in screen space at the end camera so
// the four streams come from the four frame corners and the holds stay out of the caption bands; jets are drawn at a
// near-constant size at the field's distance (world length follows the camera, like a map symbol: ~40 px at f0, ~54 px
// in the end view, bigger near the camera by perspective); the traffic is a scripted schedule (arrival times at each
// hold fix), so the holds build exactly 1 -> 2 -> 3 and no two jets ever meet; the inbound leg flies faster the farther
// out (cruise -> approach) so the thinning sweeps in from the corners within the cut.
//
// EXPORTS FOR CUT 6 (opens on this cut's last frame; never rename): WORST_S0, WORST_CAM (.at(f)), WORST_CAM_END,
// WORST_POSTS, WORST_POST_Z, WORST_CORRIDORS, WORST_HOLDS, WORST_HOLD_LAP, worstUpSpeed, WORST_LIMIT_AT,
// worstJetPosesAt(f), WORST_JETS_END, worstJetLenAt(f), WORST_GHOSTS, worstGhostsAt(f), WORST_GHOST_LOOK, and the
// drawing helpers' look (cream jets, contrails as below).
//
// SOURCES: DEN layout per denverAirfield.ts (LAYOUT_SOURCE); the four arrival corner posts NE / SE / SW / NW per
// assets-src/scott-weather-fired/SOURCES.md (NWS Denver CWSU, "Denver Air Route Traffic Control Thunderstorm Patterns",
// fig. 2). No figures on screen.
// ---------------------------------------------------------------------------------------------------------------
import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import {
  AirStage,
  DEN_CAM_ESTABLISH,
  DEN_COLORS,
  HAZE,
  RUNWAYS,
  SUN_DIR,
  cellItems,
  clamp01,
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
  rgbHex,
  shadowOffset,
  smooth,
  type DenCam,
  type DenView,
  type StormState,
} from "./denverWorld";

export const FPS = 24000 / 1001;
export const DURATION = 180;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** Story clock at f0: sequence frame of 27.861 s (668) minus cut 1's in (54). */
export const WORST_S0 = 614;

type P2 = { x: number; y: number };
type P3 = [number, number, number];
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const polyD = (pts: P2[]) => (pts.length > 2 ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}Z` : "");
const lineD = (pts: P2[]) => (pts.length > 1 ? `M${pts.map((p) => `${f3(p.x)} ${f3(p.y)}`).join("L")}` : "");
const TAU = Math.PI * 2;
const W = 1080;
const H = 1920;

// ===================================================================================================================
// THE FIELD AND THE END CAMERA
// ===================================================================================================================
/** the runway complex (from the world's runway data, so a re-laid airfield follows) */
const FIELD_BOX = (() => {
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
  return { x0, x1, y0, y1 };
})();
const FIELD: P2 = { x: (FIELD_BOX.x0 + FIELD_BOX.x1) / 2, y: (FIELD_BOX.y0 + FIELD_BOX.y1) / 2 };
/** end framing: the field ~520 px wide (runway span at its centre line), centred at y 800 */
const END_PITCH = 44;
const FIELD_PX = 520;
const FIELD_SCREEN_Y = 800;
export const AREA_END: DenCam = (() => {
  let dist = 20;
  let ty = FIELD.y - 2;
  for (let i = 0; i < 60; i++) {
    const v = makeView({ tx: FIELD.x, ty, dist, pitch: END_PITCH, heading: 0, fov: 60 });
    const a = v.project(FIELD_BOX.x0, FIELD.y, 0);
    const b = v.project(FIELD_BOX.x1, FIELD.y, 0);
    const c = v.project(FIELD.x, FIELD.y, 0);
    if (!a || !b || !c) break;
    dist *= Math.pow((b.x - a.x) / FIELD_PX, 0.7);
    ty -= ((c.y - FIELD_SCREEN_Y) / v.scaleAt(FIELD.x, FIELD.y, 0)) * 0.7;
  }
  return { tx: FIELD.x, ty, dist, pitch: END_PITCH, heading: 0, fov: 60 };
})();
export const WORST_CAM_START: DenCam = DEN_CAM_ESTABLISH;
export const WORST_CAM = makeDenClock(
  WORST_CAM_START,
  [
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
    // the living frame: a slow creep in over the trickle
    { f0: 64, f1: 260, dist: AREA_END.dist * 0.95, dty: 0.25 },
  ],
  DURATION + 10,
  40,
);
const endView = makeView(AREA_END);
/** the point at altitude zp under screen (sx, sy) of a view */
const rayAt = (v: DenView, sx: number, sy: number, zp: number): P2 => {
  const a = (sx - 540) / v.F;
  const b = -(sy - 960) / v.F;
  const d: P3 = [v.f[0] + a * v.r[0] + b * v.u[0], v.f[1] + a * v.r[1] + b * v.u[1], v.f[2] + a * v.r[2] + b * v.u[2]];
  const t = (zp - v.eye[2]) / d[2];
  return { x: v.eye[0] + t * d[0], y: v.eye[1] + t * d[1] };
};

// ===================================================================================================================
// THE CORRIDORS: corner posts, paths, the traffic schedule
// ===================================================================================================================
type PostId = "NE" | "SE" | "SW" | "NW";
const POSTS: PostId[] = ["NW", "NE", "SE", "SW"];
/** the corner posts' (and holding circles') altitude (miles) */
export const GATE_Z = 0.85;
/** where each corner post sits in the END view (screen px; `gate` in a corridor), and the frame corner its stream comes from */
const GATE_SCREEN: Record<PostId, P2> = { NW: { x: 235, y: 470 }, NE: { x: 845, y: 470 }, SE: { x: 935, y: 880 }, SW: { x: 180, y: 880 } };
const CORNER_SCREEN: Record<PostId, P2> = { NW: { x: -40, y: -60 }, NE: { x: 1120, y: -60 }, SE: { x: 1120, y: 1990 }, SW: { x: -40, y: 1990 } };
/** each corridor lands on its own runway in one pinwheel flow (no head-on pairs) */
const LANDING: Record<PostId, { id: string; dir: P2; final: number }> = {
  NW: { id: "16R/34L", dir: { x: 0, y: -1 }, final: 1.7 },
  NE: { id: "17R/35L", dir: { x: 0, y: -1 }, final: 1.5 },
  SE: { id: "8/26", dir: { x: -1, y: 0 }, final: 1.7 },
  SW: { id: "7/25", dir: { x: 1, y: 0 }, final: 0.6 },
};

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
/** Round every interior corner with an arc of radius r, then densify. */
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

/** the hold at each corner post: the hold fix this far before the post, the holding circle's radius (miles) */
const HOLD: Record<PostId, { back: number; r: number }> = {
  NW: { back: 0.35, r: 0.8 },
  NE: { back: 0.35, r: 0.8 },
  SE: { back: 1.1, r: 0.65 },
  SW: { back: 1.1, r: 0.65 },
};
/** one holding circle takes HOLD_LAP frames; its three places pass the fix SLOT_T frames apart, so the three jets that
 *  join it (SLOT_T apart) circle 120 degrees apart and never meet */
const HOLD_LAP = 84;
const SLOT_T = HOLD_LAP / 3;
const holdSpeed = (r: number) => (TAU * r) / HOLD_LAP;
/** cruise speed at the fix and through the post (miles / frame, a timelapse) */
export const JET_SPEED = 0.08;
/** the inbound leg: jets enter FAR_MI out (deep in the haze or off-frame) and fly faster the farther out they are
 *  (cruise -> approach: v = JET_SPEED x (1 + d / CRUISE_MI), d = miles to the hold fix), so a change in the entry
 *  rate sweeps in from the frame corners within the cut */
const FAR_MI = 44;
const CRUISE_MI = 6;
const upSpeed = (d: number) => JET_SPEED * (1 + Math.pow(Math.max(0, d) / CRUISE_MI, 1.5));
/** miles before the fix a jet is tau frames before it reaches the fix (the cruise law integrated back from the fix) */
const DIST_TAB: number[] = (() => {
  const out = [0];
  let d = 0;
  for (let i = 1; i <= 4000 && d < 200; i++) {
    for (let k = 0; k < 4; k++) d += upSpeed(d) * 0.25;
    out.push(d);
  }
  return out;
})();
const distBefore = (tau: number) => {
  const i = Math.floor(tau);
  if (i >= DIST_TAB.length - 1) return DIST_TAB[DIST_TAB.length - 1];
  return lerp(DIST_TAB[i], DIST_TAB[i + 1], tau - i);
};
/** touchdown point (miles), roll-out decay (frames); final lengths per corridor in LANDING */
const TD_MI = 0.2;
const ROLL_TAU = 11;

type Corridor = {
  id: PostId;
  gate: P2;
  inDir: P2; // unit: the direction jets fly through the gate
  up: Path; // far point -> hold fix
  down: Path; // hold fix -> gate -> final -> touchdown
  hold: P2;
  sGate: number; // the gate's distance along `down`
  landDir: P2;
  outer: 1 | -1; // the holding loop's side (+1 = left of the inbound track)
  loopR: number;
};
export const CORRIDORS: Record<PostId, Corridor> = (() => {
  const out = {} as Record<PostId, Corridor>;
  for (const id of POSTS) {
    const G = rayAt(endView, GATE_SCREEN[id].x, GATE_SCREEN[id].y, GATE_Z);
    // inbound from the frame corner: the ground under that corner, seen from the gate
    const cs = CORNER_SCREEN[id];
    const g = endView.unproject(cs.x, cs.y) ?? rayAt(endView, cs.x, cs.y, 0);
    let ux = G.x - g.x;
    let uy = G.y - g.y;
    const ul = Math.hypot(ux, uy);
    ux /= ul;
    uy /= ul;
    const far = { x: G.x - ux * FAR_MI, y: G.y - uy * FAR_MI };
    const hold = { x: G.x - ux * HOLD[id].back, y: G.y - uy * HOLD[id].back };
    const rw = RUNWAYS.find((r) => r.id === LANDING[id].id) ?? RUNWAYS[0];
    const d = LANDING[id].dir;
    const ends = [
      { x: rw.x0, y: rw.y0 },
      { x: rw.x1, y: rw.y1 },
    ];
    const thr = ends.reduce((best, e) => (e.x * d.x + e.y * d.y < best.x * d.x + best.y * d.y ? e : best));
    const fa = { x: thr.x - d.x * LANDING[id].final, y: thr.y - d.y * LANDING[id].final };
    const td = { x: thr.x + d.x * TD_MI, y: thr.y + d.y * TD_MI };
    const p2 = { x: G.x + ux * 0.7, y: G.y + uy * 0.7 };
    const down = mkPath(fillet([hold, G, p2, fa, thr, td], 0.9));
    // the loop side: whichever keeps the loop deeper inside the end frame (both sides stay clear of the downstream
    // path, which leaves from the gate, past the hold fix's loop)
    const nl = { x: -uy, y: ux };
    const margin = (sg: number) => {
      const q = endView.project(hold.x + nl.x * sg * HOLD[id].r, hold.y + nl.y * sg * HOLD[id].r, GATE_Z);
      return q ? Math.min(q.x, W - q.x, q.y, H - q.y) : -1e9;
    };
    const outer: 1 | -1 = margin(1) >= margin(-1) ? 1 : -1;
    out[id] = { id, gate: G, inDir: { x: ux, y: uy }, up: mkPath([far, hold]), down, hold, sGate: HOLD[id].back, landDir: d, outer, loopR: HOLD[id].r };
  }
  return out;
})();

/** THE SCHEDULE (per post, frames at the hold fix). Before "limit all the corner posts" the jets pass every GAP0
 *  frames. From LIMIT_AT (staggered across the posts) the next three jets join the holding circle one place apart
 *  (1 -> 2 -> 3 circling) and circle on to the end; the jets still fed in are fewer and slip through the post half a
 *  place between two circling jets (gaps open from the frame corners inward): a trickle lands. */
const GAP0 = 22;
export const WORST_LIMIT_AT: Record<PostId, number> = { NW: 57, NE: 61, SE: 65, SW: 69 };
/** frames after the first hold that the later, fewer jets reach the fix (half a place off the circling jets) */
const LATER = [98, 126, 182, 238, 322];
type Sched = { a: number; hold: boolean; release: number };
const SCHEDULE: Record<PostId, Sched[]> = (() => {
  const out = {} as Record<PostId, Sched[]>;
  for (const id of POSTS) {
    const j1 = WORST_LIMIT_AT[id] + 2;
    const list: Sched[] = [];
    for (let k = 40; k >= 1; k--) list.push({ a: j1 - 2 - GAP0 * k, hold: false, release: 0 });
    list.push({ a: j1, hold: true, release: Infinity });
    list.push({ a: j1 + SLOT_T, hold: true, release: Infinity });
    list.push({ a: j1 + 2 * SLOT_T, hold: true, release: Infinity });
    for (const dt of LATER) list.push({ a: j1 + dt, hold: false, release: 0 });
    out[id] = list;
  }
  return out;
})();

/** one jet's state at each frame 0..DURATION (mode 0 none, 1 inbound, 2 holding, 3 down, 4 rolled out) */
type JetRec = { mode: Int8Array; s: Float32Array; th: Float32Array; side: 1 | -1; tTd: number; vTd: number };
const TRAFFIC: Record<PostId, JetRec[]> = (() => {
  const out = {} as Record<PostId, JetRec[]>;
  const nF = DURATION + 1;
  for (const id of POSTS) {
    const c = CORRIDORS[id];
    const om = holdSpeed(c.loopR) / c.loopR;
    out[id] = SCHEDULE[id].map((sc) => {
      const rec: JetRec = { mode: new Int8Array(nF), s: new Float32Array(nF), th: new Float32Array(nF), side: c.outer, tTd: Infinity, vTd: JET_SPEED };
      const tDown = sc.hold ? sc.release : sc.a;
      rec.tTd = tDown + c.down.L / JET_SPEED;
      for (let f = 0; f < nF; f++) {
        if (f <= sc.a) {
          const d = distBefore(sc.a - f);
          if (d >= c.up.L) continue;
          rec.mode[f] = 1;
          rec.s[f] = c.up.L - d;
        } else if (sc.hold && f < sc.release) {
          rec.mode[f] = 2;
          rec.th[f] = om * (f - sc.a);
        } else {
          const sd = JET_SPEED * (f - tDown);
          rec.mode[f] = sd >= c.down.L ? 4 : 3;
          rec.s[f] = sd;
        }
      }
      return rec;
    });
  }
  return out;
})();

type JetPose = { x: number; y: number; z: number; h: number; drain: number; loopTh: number; side: number; haze?: boolean };
const jetPose = (c: Corridor, j: JetRec, f: number): JetPose | null => {
  const m = j.mode[f];
  if (m === 0) return null;
  if (m === 1) {
    const s = j.s[f];
    const p = pathAt(c.up, s);
    // inbound: a gentle descent toward the gate's altitude
    const z = GATE_Z + Math.min(1.4, 0.035 * (c.up.L - s));
    // it comes out of the haze: the first miles of the inbound leg (90 mi out, beyond the frame or deep in the veil)
    return { x: p.x, y: p.y, z, h: p.h, drain: 1 - smooth(0, 14, s), loopTh: -1, side: j.side, haze: true };
  }
  if (m === 2) {
    const th = j.th[f];
    const u = c.inDir;
    const n = { x: -u.y * j.side, y: u.x * j.side };
    const C = { x: c.hold.x + n.x * c.loopR, y: c.hold.y + n.y * c.loopR };
    const x = C.x + c.loopR * (-n.x * Math.cos(th) + u.x * Math.sin(th));
    const y = C.y + c.loopR * (-n.y * Math.cos(th) + u.y * Math.sin(th));
    const dx = n.x * Math.sin(th) + u.x * Math.cos(th);
    const dy = n.y * Math.sin(th) + u.y * Math.cos(th);
    return { x, y, z: GATE_Z, h: Math.atan2(dx, dy), drain: 0, loopTh: th, side: j.side };
  }
  let s = j.s[f];
  let drain = 0;
  let x: number;
  let y: number;
  let h: number;
  if (m === 4) {
    const tt = f - j.tTd;
    s = c.down.L + j.vTd * ROLL_TAU * (1 - Math.exp(-tt / ROLL_TAU));
    drain = smooth(3, 22, tt);
    if (drain >= 0.999) return null;
  }
  if (s <= c.down.L) {
    const p = pathAt(c.down, s);
    x = p.x;
    y = p.y;
    h = p.h;
  } else {
    const end = c.down.pts[c.down.pts.length - 1];
    x = end.x + c.landDir.x * (s - c.down.L);
    y = end.y + c.landDir.y * (s - c.down.L);
    h = Math.atan2(c.landDir.x, c.landDir.y);
  }
  // level to the gate, then down the approach to the threshold
  const sThr = c.down.L - TD_MI;
  const z = s <= c.sGate ? GATE_Z : s >= sThr ? 0 : GATE_Z * Math.pow(1 - (s - c.sGate) / (sThr - c.sGate), 1.15);
  return { x, y, z, h, drain, loopTh: -1, side: j.side };
};

/** jet length (miles) for a near-constant size at the field's distance: ~40 px at f0, ~54 px in the end view */
const jetLenFor = (v: DenView, pull: number) => lerp(40, 54, pull) / (v.scaleAt(FIELD.x, FIELD.y, 0) || 1);
/** Audit helper (per-jet continuity check): every live jet's screen position, opacity and state at frame f. */
export const worstJetsAt = (f: number) => {
  const v = makeView(WORST_CAM.at(f));
  const len = jetLenFor(v, smooth(0, 75, f));
  const out: { key: string; x: number; y: number; op: number; loop: boolean; px: number }[] = [];
  for (const id of POSTS) {
    TRAFFIC[id].forEach((j, ji) => {
      const p = jetPose(CORRIDORS[id], j, f);
      if (!p) return;
      const q = v.project(p.x, p.y, p.z);
      if (!q) return;
      out.push({ key: `${id}${ji}`, x: q.x, y: q.y, op: 1 - p.drain * p.drain, loop: p.loopTh >= 0, px: len * v.scaleAt(p.x, p.y, p.z) });
    });
  }
  return out;
};

// ===================================================================================================================
// DRAWING: light, the 3D airliner
// ===================================================================================================================
const SUN3: P3 = [SUN_DIR[0], SUN_DIR[1], SUN_DIR[2]];
const CREAM = hexRgb(COLOR.cream);
const CREAM_FOOT = hexRgb(COLOR.creamFoot);
type Item = { d: number; node: React.ReactNode };
/** The 3D airliner: plan body (lit from above), a fuselage spine, the vertical fin; ground shadow separately. */
const jetNodes = (v: DenView, key: string, p: JetPose, len: number, runwayRgb: [number, number, number]): { body: Item | null; shadow: React.ReactNode } => {
  const q = v.project(p.x, p.y, p.z);
  if (!q) return { body: null, shadow: null };
  const fog = fogAt(v, p.x, p.y, p.z);
  const sh = shadowOffset(p.z);
  const op = 1 - p.drain * p.drain;
  const s = Math.sin(p.h);
  const c = Math.cos(p.h);
  // jet-local (a across to the right, b forward, z up) -> world
  const W3 = (a: number, b: number, zz: number): P3 => [p.x + (a * c + b * s) * len, p.y + (-a * s + b * c) * len, p.z + zz * len];
  const fogged = (col: [number, number, number]) => mixRgb(mixRgb(col, HAZE, fog), p.haze ? HAZE : runwayRgb, p.drain);
  const plan = projectPoly(v, jetPlanPoints(p.x, p.y, p.h, len, p.z));
  // fuselage spine: a lit ridge along the body
  const spine = projectPoly(v, [W3(-0.045, 0.43, 0.035), W3(0.045, 0.43, 0.035), W3(0.05, -0.38, 0.035), W3(-0.05, -0.38, 0.035)]);
  // vertical fin at the tail: a quad in the jet's vertical plane
  const fin = projectPoly(v, [W3(0, -0.3, 0.03), W3(0, -0.47, 0.03), W3(0, -0.5, 0.2), W3(0, -0.42, 0.2)]);
  const finN: P3 = [c, -s, 0]; // the fin's right-hand normal
  const finLit = Math.abs(finN[0] * SUN3[0] + finN[1] * SUN3[1]);
  const shadowPts = projectPoly(v, jetPlanPoints(p.x + sh.x, p.y + sh.y, p.h, len, 0));
  const shOp = 0.34 * (1 - fog) * lerp(1, 0.55, clamp01(p.z / 2)) * op;
  return {
    shadow: <path key={`s${key}`} d={polyD(shadowPts)} fill={COLOR.shadow} opacity={f3(shOp)} />,
    body: {
      d: q.d,
      node: (
        <g key={`j${key}`} opacity={f3(op)}>
          <path d={polyD(plan)} fill={rgbHex(fogged(mixRgb(CREAM_FOOT, CREAM, 0.55)))} stroke={rgbHex(fogged(hexRgb(DEN_COLORS.jetShade)))} strokeWidth={0.8} strokeLinejoin="round" />
          <path d={polyD(spine)} fill={rgbHex(fogged(CREAM))} />
          <path d={polyD(fin)} fill={rgbHex(fogged(mixRgb(CREAM_FOOT, CREAM, clamp01(0.3 + finLit))))} stroke={rgbHex(fogged(hexRgb(DEN_COLORS.jetShade)))} strokeWidth={0.6} strokeLinejoin="round" />
        </g>
      ),
    },
  };
};

// ===================================================================================================================
// GHOST FORECAST STORMS (the worst case): the world's cells, translucent cream, amber inner glow, soft amber rim
// ===================================================================================================================
/** possible storms round the field's west, north and east at mid-distance (where this camera sees them obliquely, as
 *  towers), one after another clockwise from the west; each placed by where its base sits in the END view (screen px) */
const GHOSTS: { sx: number; sy: number; size: number; seed: number; t: number; g: number }[] = [
  { sx: 55, sy: 745, size: 0.46, seed: 101, t: 22, g: 0.82 },
  { sx: 345, sy: 250, size: 0.55, seed: 103, t: 26, g: 0.86 },
  { sx: 470, sy: 70, size: 0.6, seed: 105, t: 30, g: 0.84 },
  { sx: 640, sy: 140, size: 0.62, seed: 107, t: 34, g: 0.9 },
  { sx: 800, sy: 265, size: 0.55, seed: 109, t: 38, g: 0.84 },
  { sx: 1025, sy: 745, size: 0.46, seed: 113, t: 42, g: 0.8 },
];
const GHOST_XY: P2[] = GHOSTS.map((g) => rayAt(endView, g.sx, g.sy, 0));
const ghostState = (gh: (typeof GHOSTS)[number], f: number, i: number): StormState => ({
  id: `ghost${gh.seed}`,
  x: GHOST_XY[i].x,
  y: GHOST_XY[i].y,
  seed: gh.seed,
  size: gh.size,
  // it rises out of the haze: the cell billows up (the world's growth) as it appears, then keeps boiling slowly
  growth: lerp(gh.g - 0.22, gh.g, smooth(gh.t - 4, gh.t + 22, f)) + 0.03 * smooth(gh.t + 22, 200, f),
  rain: 0,
  rainStrength: 0,
  shadowStrength: 0,
  // a steady warm glow lit inside the lower body (the world's strike glow, held, never flickering)
  glow: 0.3,
  // the world's storm life, a little gentler: the possible storms billow softly on the story clock
  boil: 0.8,
});
const GhostCanvas: React.FC<{ v: DenView; f: number; S: number; idx: number }> = ({ v, f, S, idx }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const gh = GHOSTS[idx];
  const key = JSON.stringify([v.cam, f, idx]);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    resetCloudPool();
    const st = ghostState(gh, f, idx);
    const its = cellItems(v, st, S).filter((it) => it.type === "cell");
    for (const it of its) paintCloudItem(ctx, it);
    // lift the volume toward cream-white, then a soft warm-amber glow inside its lower body
    const sz = gh.size;
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgba(250,245,234,0.3)";
    ctx.fillRect(0, 0, W, H);
    const core = v.project(st.x, st.y, 1.9 * sz);
    const k = v.scaleAt(st.x, st.y, 1.9 * sz);
    if (core) {
      const g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, Math.max(30, 3.4 * sz * k));
      g.addColorStop(0, "rgba(255,180,40,0.6)");
      g.addColorStop(0.45, "rgba(255,176,0,0.34)");
      g.addColorStop(1, "rgba(255,176,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = "source-over";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const e = smooth(gh.t, gh.t + 14, f);
  if (e <= 0) return null;
  const haze = lerp(14, 0, e);
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: 0.48 * e, filter: haze > 0.2 ? `blur(${f3(haze)}px)` : undefined }}
    />
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const WorstCaseCornerPosts: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = WORST_S0 + f;
  const cam = WORST_CAM.at(f);
  const v = makeView(cam);
  const pull = smooth(0, 75, f);
  const len = jetLenFor(v, pull);
  const runwayRgb = hexRgb(DEN_COLORS.runway);

  const items: Item[] = [];
  const shadows: React.ReactNode[] = [];
  const trails: React.ReactNode[] = [];
  for (const id of POSTS) {
    const c = CORRIDORS[id];
    TRAFFIC[id].forEach((j, ji) => {
      const p = jetPose(c, j, f);
      if (!p) return;
      const nodes = jetNodes(v, `${id}${ji}`, p, len, runwayRgb);
      if (!nodes.body) return;
      items.push(nodes.body);
      shadows.push(nodes.shadow);
      // a held jet draws its holding circle as a fading contrail (three quarters of a circle behind it)
      if (p.loopTh > 0) {
        const u = c.inDir;
        const n = { x: -u.y * p.side, y: u.x * p.side };
        const C = { x: c.hold.x + n.x * c.loopR, y: c.hold.y + n.y * c.loopR };
        const back = Math.min(p.loopTh, TAU * 0.75);
        const segs = 28;
        const lag = (len * 0.5) / c.loopR;
        for (let sI = 0; sI < segs; sI++) {
          const t0 = p.loopTh - lag - (back * sI) / segs;
          const t1 = p.loopTh - lag - (back * (sI + 1)) / segs;
          if (t1 < 0) break;
          const pa = [t0, t1].map((th) => v.project(C.x + c.loopR * (-n.x * Math.cos(th) + u.x * Math.sin(th)), C.y + c.loopR * (-n.y * Math.cos(th) + u.y * Math.sin(th)), GATE_Z));
          if (!pa[0] || !pa[1]) continue;
          trails.push(
            <path
              key={`t${id}${ji}_${sI}`}
              d={lineD([pa[0], pa[1]])}
              stroke={COLOR.cream}
              strokeWidth={f3(Math.max(2, len * v.scaleAt(C.x, C.y, GATE_Z) * 0.085))}
              strokeLinecap="round"
              opacity={f3(0.62 * (1 - sI / segs) * smooth(0, 0.8, p.loopTh))}
              fill="none"
            />,
          );
        }
      }
    });
  }
  items.sort((a, b) => b.d - a.d);
  return (
    <AirStage
      S={S}
      v={v}
      cells={[]}
      ground={
        <g>
          <defs>
            <filter id="wcSoftShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={f3(Math.max(1.2, 0.05 * v.scaleAt(FIELD.x, FIELD.y, 0)))} />
            </filter>
          </defs>
          <g filter="url(#wcSoftShadow)">{shadows}</g>
        </g>
      }
      over={
        <g>
          {GHOSTS.map((_, i) => (
            <foreignObject key={`gh${i}`} x={0} y={0} width={W} height={H}>
              <GhostCanvas v={v} f={f} S={S} idx={i} />
            </foreignObject>
          ))}
          <g>{trails}</g>
          {items.map((it) => it.node)}
        </g>
      }
    />
  );
};

export default WorstCaseCornerPosts;

// ===================================================================================================================
// EXPORTS FOR A FOLLOW-ON CUT (cut 6 opens on this cut's last frame). Stable names; never rename.
// ===================================================================================================================
export type WorstPostId = PostId;
export type WorstCorridor = Corridor;
export type WorstJetPose = JetPose;
/** the four corner posts (NW, NE, SE, SW) */
export const WORST_POSTS: readonly PostId[] = POSTS;
/** the posts' and holds' altitude (miles) */
export const WORST_POST_Z = GATE_Z;
/** this cut's last frame's camera (f179) */
export const WORST_CAM_END: DenCam = WORST_CAM.at(DURATION - 1);
/** the corridors: post position (`gate`), inbound direction, inbound path (`up`: far point -> hold fix), the path
 *  through the post to touchdown (`down`), hold fix, landing direction, holding-circle side and radius */
export const WORST_CORRIDORS: Record<PostId, Corridor> = CORRIDORS;
/** each post's holding circle (miles): the fix where jets join and leave it, its centre, radius, side, altitude */
export const WORST_HOLDS: Record<PostId, { fix: P2; centre: P2; r: number; side: 1 | -1; z: number }> = (() => {
  const out = {} as Record<PostId, { fix: P2; centre: P2; r: number; side: 1 | -1; z: number }>;
  for (const id of POSTS) {
    const c = CORRIDORS[id];
    const n = { x: -c.inDir.y * c.outer, y: c.inDir.x * c.outer };
    out[id] = { fix: c.hold, centre: { x: c.hold.x + n.x * c.loopR, y: c.hold.y + n.y * c.loopR }, r: c.loopR, side: c.outer, z: GATE_Z };
  }
  return out;
})();
/** frames per holding circle (speed = 2 pi r / lap) and the inbound cruise speed law (miles / frame at d miles before the fix) */
export const WORST_HOLD_LAP = HOLD_LAP;
export const worstUpSpeed = upSpeed;
/** every live jet at frame f (0..179): its post, index, world pose (x, y, z miles, heading rad, drain 0..1, loopTh =
 *  angle flown round the holding circle or -1) and phase (1 inbound, 2 holding, 3 through the post / approach,
 *  4 rolled out) */
export const worstJetPosesAt = (f: number) => {
  const out: { post: PostId; idx: number; phase: number; pose: JetPose }[] = [];
  for (const id of POSTS) {
    TRAFFIC[id].forEach((j, idx) => {
      const pose = jetPose(CORRIDORS[id], j, f);
      if (pose) out.push({ post: id, idx, phase: j.mode[f], pose });
    });
  }
  return out;
};
/** the jets as they stand on the last frame */
export const WORST_JETS_END = worstJetPosesAt(DURATION - 1);
/** the jets' drawn length (miles) at frame f (a near-constant screen size at the field) */
export const worstJetLenAt = (f: number) => jetLenFor(makeView(WORST_CAM.at(f)), smooth(0, 75, f));
/** the ghost forecast storms: spec (world position, size, seed, appearance frame, growth) and their states at f */
export const WORST_GHOSTS = GHOSTS.map((g, i) => ({ id: `ghost${g.seed}`, x: GHOST_XY[i].x, y: GHOST_XY[i].y, size: g.size, seed: g.seed, appearAt: g.t, growth: g.g }));
export const worstGhostsAt = (f: number): StormState[] => GHOSTS.map((g, i) => ghostState(g, f, i));
/** how the ghosts are drawn: canvas opacity, the cream lift and the amber lower-body glow */
export const WORST_GHOST_LOOK = { opacity: 0.48, creamLift: 0.3, glowZ: 1.9, glowR: 3.4, glowCore: 0.6 } as const;

// ---- module-load checks -------------------------------------------------------------------------------------------
{
  const q = endView.project(FIELD.x, FIELD.y, 0);
  if (!q || Math.abs(q.y - FIELD_SCREEN_Y) > 4) throw new Error("WorstCaseCornerPosts: end camera does not frame the field");
}
