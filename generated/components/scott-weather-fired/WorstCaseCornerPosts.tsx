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
// THE MOTION: one continuous move. f0 = DEN_CAM_ESTABLISH on a clear afternoon (no storms), jets on approach; from f0
// the camera pulls up and tilts to a RAISED OBLIQUE (pitch 47, heading 0; one damped glide settled by ~f75, then a slow
// creep): DEN big in the middle on the world's aerial, four approach corridors pouring in from the four frame corners,
// each through a cream GATE IN THE SKY (a lit frame at the altitude the jets fly; its own soft ground shadow), the jets
// 3D airliners at altitude with soft ground shadows offset by their height, descending to four runways (one pinwheel
// flow: NW -> 16R, NE -> 16L, SE -> 26, SW -> 7).
// "We don't know where the thunderstorm will be" (f22-f46): six GHOST forecast storms rise out of the haze round the
// field's west, north and east, one after another clockwise (4 f apart): the world's storm cells drawn as translucent
// cream-white towers (~48 %) with a steady warm-amber glow inside the lower body = possible storms (the worst-case
// forecast), not real ones; the field stays in sun.
// "Limit all the corner posts" (f57-f90): all four gate frames close in together to a narrow slot, and the stream
// behind each bunches (jets slow in the last miles before the gate, from f60). "Pull down the amount of traffic"
// (f104-f165): each gate's release spacing opens, so jets that reach the hold fix while the slot is busy peel into a
// holding loop beside the corridor (a short contrail draws it) and come round again; behind the gates the spacing opens
// to a trickle. No jet is deleted mid-air: every jet enters beyond the frame and leaves only by landing (it drains into
// the runway tone as it rolls out). f165-f179: a trickle onto the runways, loops circling, the ghosts all round.
// AMBER = the weather's reach (the worst-case forecast storms). Cream jets and gates; nothing else amber. No text.
//
// CUT-LOCAL CHOICES (world files untouched): the gates sit a few miles off the field (not the true ~46 mi; the
// corner-post figure in SOURCES.md is schematic and gives no distances), placed in screen space at the end camera so
// the four corridors come from the four frame corners and the gates and loops stay out of the caption bands; jets are
// drawn at a near-constant size at the field's distance (world length follows the camera, like a map symbol: ~40 px at
// f0, ~54 px at the gates in the end view, bigger near the camera by perspective); gates, streams and ghost storms are
// cut-local (the world's CornerPost / ArrivalStream are laid out for 46-mile gates).
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
  TEX,
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
// THE CORRIDORS: gates, paths, the traffic simulation
// ===================================================================================================================
type PostId = "NE" | "SE" | "SW" | "NW";
const POSTS: PostId[] = ["NW", "NE", "SE", "SW"];
/** the gates' altitude (miles): the jets fly through the frame's middle */
export const GATE_Z = 0.85;
/** where each gate sits in the END view (screen px), and the frame corner its corridor comes from */
const GATE_SCREEN: Record<PostId, P2> = { NW: { x: 235, y: 470 }, NE: { x: 845, y: 470 }, SE: { x: 935, y: 880 }, SW: { x: 180, y: 880 } };
const CORNER_SCREEN: Record<PostId, P2> = { NW: { x: -40, y: -60 }, NE: { x: 1120, y: -60 }, SE: { x: 1120, y: 1990 }, SW: { x: -40, y: 1990 } };
/** each corridor lands on its own runway in one pinwheel flow (no head-on pairs) */
const LANDING: Record<PostId, { id: string; dir: P2; final: number }> = {
  NW: { id: "16R/34L", dir: { x: 0, y: -1 }, final: 1.7 },
  NE: { id: "16L/34R", dir: { x: 0, y: -1 }, final: 1.4 },
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

/** hold fix this far before the gate; loop radius (miles) */
const HOLD_BACK = 1.05;
const LOOP_R = 0.72;
/** per gate: the south gates hold a little farther back on a tighter loop, so the loop clears the turn toward the
 *  runway just past the gate and stays above the caption band */
const HOLD: Record<PostId, { back: number; r: number }> = {
  NW: { back: HOLD_BACK, r: LOOP_R },
  NE: { back: HOLD_BACK, r: LOOP_R },
  SE: { back: 1.3, r: 0.56 },
  SW: { back: 1.3, r: 0.56 },
};
/** cruise speed (miles / frame, a timelapse); the bunching slow-down in the last miles before the hold fix */
export const JET_SPEED = 0.08;
const SLOW_ZONE = 3.2;
/** the inbound leg: jets enter FAR_MI out (deep in the haze or off-frame) and fly faster the farther out they are
 *  (cruise -> approach: v = JET_SPEED x (1 + d / CRUISE_MI), d = miles to the hold fix), so a change in the entry
 *  rate sweeps in from the frame corners within the cut */
const FAR_MI = 44;
const CRUISE_MI = 6;
const upSpeed = (d: number) => JET_SPEED * (1 + Math.pow(Math.max(0, d) / CRUISE_MI, 1.5));
/** frames to fly the inbound leg from d0 down to d1 miles before the hold fix (no bunching) */
const upTime = (d0: number, d1: number) => {
  let t = 0;
  for (let d = d1; d < d0; d += 0.05) t += Math.min(0.05, d0 - d) / upSpeed(d + 0.025);
  return t;
};
const slowAt = (t: number) => 0.26 * smooth(58, 92, t);
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

/** full-rate spacing (frames); the gates' release spacing opens RELEASE_F0 -> RELEASE_F1 */
const GAP0 = 21;
const GAP1 = 52;
const RELEASE_F0 = 86;
const RELEASE_F1 = 118;
const releaseGap = (t: number) => lerp(GAP0 * 0.9, GAP1, smooth(RELEASE_F0, RELEASE_F1, t));
/** fewer jets fed in: the entry spacing opens GAP0 -> ENTRY_GAP1, timed per corridor so the first gap crosses the
 *  end frame's edge (the corridor's frame corner) at ~ENTRY_AT_EDGE */
const ENTRY_GAP1 = 62;
const ENTRY_AT_EDGE = 90;
/** miles before the hold fix where each corridor leaves the end frame (or fades into the haze) */
const D_EDGE: Record<PostId, number> = (() => {
  const out = {} as Record<PostId, number>;
  for (const id of POSTS) {
    const c = CORRIDORS[id];
    let dEdge = FAR_MI;
    for (let d = 0; d <= FAR_MI; d += 0.1) {
      const p = pathAt(c.up, c.up.L - d);
      const q = endView.project(p.x, p.y, GATE_Z + Math.min(1.4, 0.035 * d));
      if (!q || q.x < -40 || q.x > W + 40 || q.y < -40 || q.y > H + 40) {
        dEdge = d;
        break;
      }
    }
    // past ~22 mi out a jet is a speck in the haze: treat that as the corridor's visible edge
    out[id] = Math.min(dEdge, 22);
  }
  return out;
})();
const entryGap = (id: PostId, t: number) => {
  const t0 = ENTRY_AT_EDGE - upTime(CORRIDORS[id].up.L, D_EDGE[id]);
  return lerp(GAP0, ENTRY_GAP1, smooth(t0 - 6, t0 + 10, t));
};
const POST_PHASE: Record<PostId, number> = { NW: 0.15, NE: 0.62, SE: 0.38, SW: 0.86 };

/** one jet's recorded state at each frame 0..DURATION (mode 0 none, 1 inbound, 2 holding, 3 down, 4 rolled out) */
type JetRec = { mode: Int8Array; s: Float32Array; th: Float32Array; side: 1 | -1; tTd: number; vTd: number };
const SIM_T0 = -1500;
const DT = 0.25;
const TRAFFIC: Record<PostId, JetRec[]> = (() => {
  const out = {} as Record<PostId, JetRec[]>;
  for (const id of POSTS) {
    const c = CORRIDORS[id];
    type J = { mode: number; s: number; th: number; laps: number; side: 1 | -1; tTd: number; vTd: number; rec: JetRec };
    const jets: J[] = [];
    let nextEntry = SIM_T0 + POST_PHASE[id] * GAP0;
    let nextFree = -Infinity;
    const queue: J[] = [];
    const nF = DURATION + 1;
    for (let t = SIM_T0; t <= DURATION + 0.001; t += DT) {
      while (t >= nextEntry) {
        const rec: JetRec = { mode: new Int8Array(nF), s: new Float32Array(nF), th: new Float32Array(nF), side: 1, tTd: Infinity, vTd: 0 };
        jets.push({ mode: 1, s: (t - nextEntry) * upSpeed(c.up.L), th: 0, laps: 0, side: 1, tTd: Infinity, vTd: 0, rec });
        nextEntry += entryGap(id, nextEntry);
      }
      const slow = slowAt(t);
      for (const j of jets) {
        if (j.mode === 1) {
          const w = smooth(c.up.L - SLOW_ZONE, c.up.L, j.s);
          j.s += upSpeed(c.up.L - j.s) * (1 - slow * w) * DT;
          if (j.s >= c.up.L) {
            const over = j.s - c.up.L;
            if (queue.length === 0 && t >= nextFree) {
              j.mode = 3;
              j.s = over;
              nextFree = t + releaseGap(t);
            } else {
              j.mode = 2;
              j.th = over / c.loopR;
              // holding loops on the corridor's in-frame side (one side per gate)
              j.side = c.outer;
              j.rec.side = c.outer;
              queue.push(j);
            }
          }
        } else if (j.mode === 2) {
          const before = j.th;
          j.th += ((JET_SPEED * (1 - slow)) / c.loopR) * DT;
          if (Math.floor(j.th / TAU) > Math.floor(before / TAU)) {
            // back at the hold fix: released if first in line and the slot is free, else another lap
            if (queue[0] === j && t >= nextFree) {
              queue.shift();
              j.mode = 3;
              j.s = (j.th - TAU * Math.floor(j.th / TAU)) * c.loopR;
              nextFree = t + releaseGap(t);
            }
          }
        } else if (j.mode === 3) {
          const v = JET_SPEED * (1 - slow);
          j.s += v * DT;
          if (j.s >= c.down.L) {
            j.mode = 4;
            j.tTd = t;
            j.vTd = v;
            j.rec.tTd = t;
            j.rec.vTd = v;
          }
        }
      }
      // record at integer frames
      const fi = Math.round(t);
      if (Math.abs(t - fi) < 1e-6 && fi >= 0 && fi <= DURATION) {
        for (const j of jets) {
          j.rec.mode[fi] = j.mode;
          j.rec.s[fi] = j.s;
          j.rec.th[fi] = j.th;
        }
      }
    }
    out[id] = jets.map((j) => j.rec);
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
/** the jets' length in the end view; the gates share the jets' symbol scale (sig = len / JET_LEN_END) so a jet always
 *  fits its gate the same way */
const JET_LEN_END = jetLenFor(endView, 1);

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
// DRAWING: light, the 3D airliner, the gate frame
// ===================================================================================================================
const SUN3: P3 = [SUN_DIR[0], SUN_DIR[1], SUN_DIR[2]];
const CREAM = hexRgb(COLOR.cream);
const CREAM_FOOT = hexRgb(COLOR.creamFoot);
const BOARD = hexRgb(COLOR.board);
/** a face's colour from its normal (one key light from the low west sun, plus a soft sky fill from above) */
const shadeRgb = (n: P3, base = CREAM) => {
  const l = Math.max(0, n[0] * SUN3[0] + n[1] * SUN3[1] + n[2] * SUN3[2]);
  const sky = Math.max(0, n[2]);
  const k = clamp01(0.35 + 0.55 * l + 0.3 * sky);
  return mixRgb(mixRgb(BOARD, CREAM_FOOT, clamp01(k * 1.4)), base, clamp01((k - 0.45) * 2));
};

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

/** the gate frame (miles): opening half-width open / shut, opening half-height, bar thickness, depth */
const GATE = { open: 0.78, shut: 0.36, hh: 0.3, bar: 0.15, depth: 0.2 } as const;
type Box3 = { c: P3; ax: P3; ay: P3; az: P3; e: P3 }; // centre, unit axes, half extents
const boxCorners = (b: Box3): P3[] => {
  const out: P3[] = [];
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1])
        out.push([
          b.c[0] + b.ax[0] * b.e[0] * sx + b.ay[0] * b.e[1] * sy + b.az[0] * b.e[2] * sz,
          b.c[1] + b.ax[1] * b.e[0] * sx + b.ay[1] * b.e[1] * sy + b.az[1] * b.e[2] * sz,
          b.c[2] + b.ax[2] * b.e[0] * sx + b.ay[2] * b.e[1] * sy + b.az[2] * b.e[2] * sz,
        ]);
  return out;
};
// faces as corner indices (sx, sy, sz bits: index = sx*4 + sy*2 + sz with -1 -> 0, 1 -> 1)
const FACES: { idx: number[]; n: [number, number, number] }[] = [
  { idx: [4, 5, 7, 6], n: [1, 0, 0] },
  { idx: [0, 2, 3, 1], n: [-1, 0, 0] },
  { idx: [2, 6, 7, 3], n: [0, 1, 0] },
  { idx: [0, 1, 5, 4], n: [0, -1, 0] },
  { idx: [1, 3, 7, 5], n: [0, 0, 1] },
  { idx: [0, 4, 6, 2], n: [0, 0, -1] },
];
const convexHull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (const q of p.reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const gateBoxes = (c: Corridor, narrow: number, sig: number): Box3[] => {
  const u: P3 = [c.inDir.x, c.inDir.y, 0];
  const a: P3 = [-c.inDir.y, c.inDir.x, 0];
  const zA: P3 = [0, 0, 1];
  const w = lerp(GATE.open, GATE.shut, narrow) * sig;
  const hh = GATE.hh * sig;
  const bar = GATE.bar * sig;
  const depth = GATE.depth * sig;
  const at = (da: number, dz: number): P3 => [c.gate.x + a[0] * da, c.gate.y + a[1] * da, GATE_Z + dz];
  return [
    { c: at(-w - bar / 2, 0), ax: a, ay: u, az: zA, e: [bar / 2, depth / 2, hh + bar] },
    { c: at(w + bar / 2, 0), ax: a, ay: u, az: zA, e: [bar / 2, depth / 2, hh + bar] },
    { c: at(0, hh + bar / 2), ax: a, ay: u, az: zA, e: [w, depth / 2, bar / 2] },
    { c: at(0, -hh - bar / 2), ax: a, ay: u, az: zA, e: [w, depth / 2, bar / 2] },
  ];
};
const gateItems = (v: DenView, c: Corridor, narrow: number, sig: number): { items: Item[]; shadow: React.ReactNode } => {
  const items: Item[] = [];
  const shadows: React.ReactNode[] = [];
  gateBoxes(c, narrow, sig).forEach((b, bi) => {
    const cs = boxCorners(b);
    const pc = v.project(b.c[0], b.c[1], b.c[2]);
    if (!pc) return;
    const fog = fogAt(v, b.c[0], b.c[1], b.c[2]);
    const faces: React.ReactNode[] = [];
    FACES.forEach((F, fi) => {
      const n: P3 = [
        b.ax[0] * F.n[0] + b.ay[0] * F.n[1] + b.az[0] * F.n[2],
        b.ax[1] * F.n[0] + b.ay[1] * F.n[1] + b.az[1] * F.n[2],
        b.ax[2] * F.n[0] + b.ay[2] * F.n[1] + b.az[2] * F.n[2],
      ];
      const fc = F.idx.map((i) => cs[i]);
      const mid: P3 = [(fc[0][0] + fc[2][0]) / 2, (fc[0][1] + fc[2][1]) / 2, (fc[0][2] + fc[2][2]) / 2];
      const toEye = [v.eye[0] - mid[0], v.eye[1] - mid[1], v.eye[2] - mid[2]];
      if (n[0] * toEye[0] + n[1] * toEye[1] + n[2] * toEye[2] <= 0) return;
      const pts = projectPoly(v, fc);
      const col = rgbHex(mixRgb(shadeRgb(n), HAZE, fog));
      faces.push(<path key={fi} d={polyD(pts)} fill={col} stroke={col} strokeWidth={0.5} strokeLinejoin="round" />);
    });
    items.push({ d: pc.d, node: <g key={`g${c.id}${bi}`}>{faces}</g> });
    const sp = cs.map(([x, y, zz]) => {
      const o = shadowOffset(zz);
      return v.project(x + o.x, y + o.y, 0);
    });
    if (sp.every((q) => q)) shadows.push(<path key={`gs${c.id}${bi}`} d={polyD(convexHull(sp as P2[]))} fill={COLOR.shadow} opacity={f3(0.3 * (1 - fog))} />);
  });
  return { items, shadow: <g key={`gsh${c.id}`}>{shadows}</g> };
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
    const its = cellItems(v, st, 0).filter((it) => it.type === "cell");
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

/** soften the aerial photo's square edge into the plains (a feathered veil of the plains' tone along its border) */
const AerialFeather: React.FC<{ v: DenView }> = ({ v }) => {
  const x0 = TEX.aerial.ox;
  const y1 = TEX.aerial.oy;
  const x1 = x0 + TEX.aerial.mi;
  const y0 = y1 - TEX.aerial.mi;
  const ring = (inset: number) =>
    projectPoly(v, [
      [x0 + inset, y0 + inset, 0],
      [x1 - inset, y0 + inset, 0],
      [x1 - inset, y1 - inset, 0],
      [x0 + inset, y1 - inset, 0],
    ]);
  const k = v.scaleAt(FIELD.x, FIELD.y, 0);
  const outer = ring(-0.15);
  const inner = ring(0.45);
  const d = `${polyD(outer)} ${polyD([...inner].reverse())}`;
  return (
    <g>
      <defs>
        <filter id="wcFeather" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={f3(Math.max(2, 0.16 * k))} />
        </filter>
      </defs>
      <path d={d} fill="#B9A671" fillRule="evenodd" opacity={0.42} filter="url(#wcFeather)" />
    </g>
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
  const narrow = smooth(57, 90, f);
  const len = jetLenFor(v, pull);
  const runwayRgb = hexRgb(DEN_COLORS.runway);

  const items: Item[] = [];
  const shadows: React.ReactNode[] = [];
  const trails: React.ReactNode[] = [];
  for (const id of POSTS) {
    const c = CORRIDORS[id];
    const gi = gateItems(v, c, narrow, len / JET_LEN_END);
    items.push(...gi.items);
    shadows.push(gi.shadow);
    TRAFFIC[id].forEach((j, ji) => {
      const p = jetPose(c, j, f);
      if (!p) return;
      const nodes = jetNodes(v, `${id}${ji}`, p, len, runwayRgb);
      if (!nodes.body) return;
      items.push(nodes.body);
      shadows.push(nodes.shadow);
      // a held jet draws its loop as a short fading contrail
      if (p.loopTh > 0) {
        const u = c.inDir;
        const n = { x: -u.y * p.side, y: u.x * p.side };
        const C = { x: c.hold.x + n.x * c.loopR, y: c.hold.y + n.y * c.loopR };
        const back = Math.min(p.loopTh, TAU * 0.5);
        const segs = 20;
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
              strokeWidth={f3(Math.max(1.5, len * v.scaleAt(C.x, C.y, GATE_Z) * 0.07))}
              strokeLinecap="round"
              opacity={f3(0.55 * (1 - sI / segs) * smooth(0, 0.8, p.loopTh))}
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
          <AerialFeather v={v} />
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

// ---- module-load checks -------------------------------------------------------------------------------------------
{
  const q = endView.project(FIELD.x, FIELD.y, 0);
  if (!q || Math.abs(q.y - FIELD_SCREEN_Y) > 4) throw new Error("WorstCaseCornerPosts: end camera does not frame the field");
}
