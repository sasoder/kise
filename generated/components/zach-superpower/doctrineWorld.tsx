import React from "react";
import { Easing, interpolate } from "remotion";
import {
  BLACK,
  EASE_LAND,
  Figure,
  INK,
  OP_MID,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  TallPaper,
  WorldTall,
  camEase,
  clamp,
  runCamera2,
  sway,
  type,
} from "../kits/core-memory/deathCountShared";
import { Inked } from "../kits/core-memory/cerroShared";

// ---------------------------------------------------------------------------
// THE DOCTRINE WORLD — zach-superpower (Core Memory, Zach Shore of Hermeus).
// Owner: the builder of cut 51 (AskPermissionInterfaces). Cut 57
// (MarineKnowsWhatToDo) imports this file and opens pixel for pixel on cut
// 51's last frame. Read-only for everyone else.
//
// LEGEND (this world): white ink on squared paper, every white thing on its
// hard black copy at +4/+4. FURNITURE IS DIM (the sandbag wall and the
// commanders' desks sit at OP_MID, so the white people in front of / behind
// them separate in value). No chain echo anywhere here: in this clip the chain
// means COPIES, and nothing in the doctrine world is a copy. No rank labels;
// the five-pointed star over the top post is the only Soviet mark.
//
// WORLD (world px; at k 1 with the camera on (540, 960) world = screen):
//   THE SQUAD   five soldiers (Figure busts, size 100, a chunky dome helmet
//               with a short brim) crouched behind a low sandbag wall
//               x 262..838, top 1712, on the ground line y 1800. The fourth
//               from the left (x 606) is the SERGEANT: a radio pack pokes up
//               behind his left shoulder (x 664..706, top 1624), its handset
//               on a coiled cord.
//   UNDER FIRE  black tracer dashes come in from the right, low, and stop on
//               the wall's face; three small white dust puffs kick out of
//               each hit; the soldier nearest a hit ducks. Continuous for any
//               t (the schedule runs from t -40 to t 400).
//   THE CHAIN   four commander posts (a bust in a peaked cap behind a dim desk
//               with a field phone), alternating right / left of the spine and
//               further apart going up (platoon, company, battalion, regiment),
//               and a white five-pointed star over the top one. The links are
//               org-chart elbows: from each joint the cable goes UP, turns, and
//               runs ACROSS into the next post's joint (the "interface": a white
//               plug block at the desk's inner end). The first link leaves the
//               top of the sergeant's radio pack.
//   THE QUESTION a white speech pill with a black "?" (Barlow 900). It rises out
//               of the radio pack (from behind the wall and the squad), climbs
//               the cable, stops at each joint for a beat while that commander
//               picks up his handset, and goes on. It never reaches an answer:
//               after the third joint it creeps toward the top post on an
//               asymptote (it never arrives, for any t).
//
// TIME: every function here takes `t` = cut 51's frame (0..127). Cut 57 passes
// t = JOIN_T + its own frame, so its f0 is t 127 = cut 51's last frame.
// ---------------------------------------------------------------------------

export const DOC_FPS = 24000 / 1001;
/** cut 51's last frame; cut 57's f0 */
export const JOIN_T = 127;

type Pt = { x: number; y: number };
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => camEase(u, 1);
const DEG = Math.PI / 180;
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ===========================================================================
// THE SQUAD
// ===========================================================================
export const GROUND_Y = 1800;
export const WALL = { x0: 262, x1: 838, top: 1712, bottom: GROUND_Y } as const;
const BAG_H = 44;
const BAG_RX = 15;
/** the sandbags: two courses, the top one set in and staggered */
export const BAGS: { x: number; y: number; w: number; h: number }[] = [
  ...Array.from({ length: 6 }, (_, i) => ({ x: WALL.x0 + i * 96, y: WALL.top + BAG_H, w: 92, h: BAG_H })),
  ...Array.from({ length: 6 }, (_, i) => ({ x: WALL.x0 + 12 + i * 92, y: WALL.top, w: 88, h: BAG_H })),
];

export const SOLDIER_S = 100;
/** bust box top (Figure y) of a soldier at rest = SOLDIER_YB + lift */
/** bust box top when not ducking: shoulders top 28 px above the wall top */
export const SOLDIER_YB = WALL.top - 28 - 0.52 * SOLDIER_S; // 1632
/** x = the bust's centre; lift = extra crouch (px down); tilt = deg */
export const SOLDIERS = [
  { x: 330, lift: 4, tilt: -3 },
  { x: 422, lift: 0, tilt: 2 },
  { x: 514, lift: 6, tilt: -2 },
  { x: 606, lift: 0, tilt: 0 },
  { x: 750, lift: 3, tilt: 3 },
] as const;
export const SERGEANT = 3;
/** head centre of soldier i at rest (no duck), world px */
export const soldierHead = (i: number): Pt => ({
  x: SOLDIERS[i].x,
  y: SOLDIER_YB + SOLDIERS[i].lift + 0.27 * SOLDIER_S,
});
/** the radio pack on the sergeant's back (its bottom is hidden by the wall) */
export const PACK = { x0: 662, x1: 710, top: 1648, cx: 686 } as const;

// ===========================================================================
// THE CHAIN OF COMMAND
// ===========================================================================
export type Side = "R" | "L";
export type Post = {
  /** "R": the desk runs right of the joint; "L": left of it */
  side: Side;
  /** the joint (the interface plug) at the desk's inner end */
  joint: Pt;
  /** desk top y */
  D: number;
  /** the commander's bust size */
  s: number;
  /** desk width */
  w: number;
  /** desk x span */
  x0: number;
  x1: number;
  /** the phone box */
  phone: { x0: number; x1: number; y0: number; y1: number };
  /** the commander's bust centre x and head centre */
  bx: number;
  head: Pt;
};
const POST_SPEC: { side: Side; jx: number; D: number; s: number }[] = [
  // R posts sit right of the f0 frame (x >= 897), L posts left of it (x <= 217), so the
  // open shows only the squad and its own cable; the company's run (y 1115) passes just
  // above the f0 frame's top edge (world y ~1135).
  { side: "R", jx: 905, D: 1393, s: 170 }, // platoon
  { side: "L", jx: 196, D: 1108, s: 178 }, // company
  { side: "R", jx: 905, D: 803, s: 186 }, // battalion
  { side: "L", jx: 196, D: 478, s: 194 }, // regiment, under the star
];
const JOINT_DY = 7; // the plug sits on the desk slab
const SLAB_H = 14;
const PANEL_H = 0.4; // x s
const PHONE_GAP = 50; // joint -> phone body
/** the bust: shoulders top this far (x s) above the desk top */
const BUST_TOP = 0.84; // box top = D - BUST_TOP * s
export const POSTS: Post[] = POST_SPEC.map((p) => {
  const dir = p.side === "R" ? 1 : -1;
  const phW = 0.5 * p.s;
  const phH = 0.24 * p.s;
  const ph0 = p.jx + dir * PHONE_GAP;
  const ph1 = ph0 + dir * phW;
  const bx = ph1 + dir * 0.55 * p.s;
  const inner = p.jx - dir * 10;
  const outer = bx + dir * 0.47 * p.s;
  return {
    side: p.side,
    joint: { x: p.jx, y: p.D + JOINT_DY },
    D: p.D,
    s: p.s,
    w: Math.abs(outer - inner),
    x0: Math.min(inner, outer),
    x1: Math.max(inner, outer),
    phone: { x0: Math.min(ph0, ph1), x1: Math.max(ph0, ph1), y0: p.D - phH, y1: p.D },
    bx,
    head: { x: bx, y: p.D - (BUST_TOP - 0.27) * p.s },
  };
});
/** the commander's bust box top-left */
const postBustBox = (p: Post) => ({ x: p.bx - p.s / 2, y: p.D - BUST_TOP * p.s });

/** the star over the top post */
const TOP = POSTS[POSTS.length - 1];
export const STAR = { cx: TOP.bx, cy: TOP.D - (BUST_TOP - 0.05) * TOP.s - 26 - 88, R: 88, r: 0.43 * 88 } as const;
const starD = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -90 + i * 36;
    const rr = i % 2 === 0 ? STAR.R : STAR.r;
    pts.push(`${(STAR.cx + rr * Math.cos(a * DEG)).toFixed(2)} ${(STAR.cy + rr * Math.sin(a * DEG)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
})();

// -- the cable: org-chart elbows (up, round the corner, across) --------------
const CORNER_R = 40;
type Route = { d: string; pts: Pt[]; cum: number[]; len: number };
/** a polyline with every inner corner rounded (quadratic, radius r), sampled */
const route = (v: Pt[], r = CORNER_R): Route => {
  const pts: Pt[] = [v[0]];
  let d = `M${v[0].x} ${v[0].y}`;
  for (let i = 1; i < v.length; i++) {
    const p = v[i];
    if (i < v.length - 1) {
      const a = v[i - 1];
      const b = v[i + 1];
      const la = Math.hypot(p.x - a.x, p.y - a.y);
      const lb = Math.hypot(b.x - p.x, b.y - p.y);
      const ra = Math.min(r, la / 2);
      const rb = Math.min(r, lb / 2);
      const s0 = { x: p.x - ((p.x - a.x) / la) * ra, y: p.y - ((p.y - a.y) / la) * ra };
      const s1 = { x: p.x + ((b.x - p.x) / lb) * rb, y: p.y + ((b.y - p.y) / lb) * rb };
      // straight run to the corner's start
      const last = pts[pts.length - 1];
      const n0 = Math.max(1, Math.ceil(Math.hypot(s0.x - last.x, s0.y - last.y) / 8));
      for (let k = 1; k <= n0; k++) pts.push({ x: lerp(last.x, s0.x, k / n0), y: lerp(last.y, s0.y, k / n0) });
      for (let k = 1; k <= 12; k++) {
        const u = k / 12;
        pts.push({
          x: (1 - u) * (1 - u) * s0.x + 2 * u * (1 - u) * p.x + u * u * s1.x,
          y: (1 - u) * (1 - u) * s0.y + 2 * u * (1 - u) * p.y + u * u * s1.y,
        });
      }
      d += ` L${s0.x} ${s0.y} Q${p.x} ${p.y} ${s1.x} ${s1.y}`;
    } else {
      const last = pts[pts.length - 1];
      const n0 = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 8));
      for (let k = 1; k <= n0; k++) pts.push({ x: lerp(last.x, p.x, k / n0), y: lerp(last.y, p.y, k / n0) });
      d += ` L${p.x} ${p.y}`;
    }
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { d, pts, cum, len: cum[cum.length - 1] };
};
const atLen = (r: Route, s: number): Pt => {
  const L = Math.max(0, Math.min(r.len, s));
  let lo = 0;
  let hi = r.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (r.cum[m] <= L) lo = m;
    else hi = m;
  }
  const seg = r.cum[hi] - r.cum[lo] || 1;
  const u = (L - r.cum[lo]) / seg;
  return { x: lerp(r.pts[lo].x, r.pts[hi].x, u), y: lerp(r.pts[lo].y, r.pts[hi].y, u) };
};

/** where the first link leaves the radio pack */
export const CABLE_START: Pt = { x: PACK.cx, y: PACK.top + 2 };
/** the four links, as drawn: pack -> J1, J1 -> J2, J2 -> J3, J3 -> J4 */
export const LINKS: Route[] = POSTS.map((p, i) => {
  const a = i === 0 ? CABLE_START : POSTS[i - 1].joint;
  return route([a, { x: a.x, y: p.joint.y }, p.joint]);
});
/** the pill starts hidden behind the wall, under the pack */
const EMERGE_Y = WALL.top + 46;
/** the pill's own routes (hop 0 starts behind the wall, under the pack) */
export const PILL_ROUTES: Route[] = POSTS.map((p, i) => {
  if (i > 0) return LINKS[i];
  return route([{ x: PACK.cx, y: EMERGE_Y }, { x: PACK.cx, y: p.joint.y }, p.joint]);
});

// ===========================================================================
// THE QUESTION'S SCHEDULE (frames of cut 51)
// ===========================================================================
/** each hop: depart frame, arrive frame (hop 3 never arrives: see CREEP) */
export const HOPS = [
  { from: 32, to: 56 }, // out of the radio (clear of the squad by f46, "doctrine"), up, across to the platoon
  { from: 61, to: 82 }, // up and across to the company ("radio ... ask permission")
  { from: 87, to: 103 }, // up and across to the battalion ("what do I do?")
] as const;
/** after the third joint: a creep toward the regiment that never arrives */
export const CREEP = { from: 108, tau: 50, reach: 0.85 } as const;
/** frame each post's commander starts lifting his handset (the pill touched his joint the frame before) */
export const PICKUP_F = [HOPS[0].to + 1, HOPS[1].to + 1, HOPS[2].to + 1, 1e6]; // the top post never picks up
const PICKUP_FRAMES = 8;

/** Travel profile per hop: a trapezoid of SCREEN speed (smooth ramps of `ramp`
 *  of the hop at each end), turned into world speed by dividing by the damped
 *  camera's k, so the pill crosses the screen evenly while the camera pulls
 *  back. Tabulated once (lazily: the camera is defined further down). */
const HOP_RAMP = [0.4, 0.22, 0.22];
let hopTables: number[][] | null = null;
const HOP_N = 240;
const hopTable = (i: number) => {
  if (!hopTables) {
    hopTables = HOPS.map((h, j) => {
      const cum = [0];
      for (let n = 1; n <= HOP_N; n++) {
        const u = (n - 0.5) / HOP_N;
        const r = HOP_RAMP[j];
        const w = u < r ? smooth(u / r) : u > 1 - r ? smooth((1 - u) / r) : 1;
        const k = dampedK(h.from + u * (h.to - h.from));
        cum.push(cum[n - 1] + w / k);
      }
      const tot = cum[HOP_N];
      return cum.map((c) => c / tot);
    });
  }
  return hopTables[i];
};
const hopProgress = (i: number, u: number) => {
  const tab = hopTable(i);
  const x = clamp01(u) * HOP_N;
  const n = Math.min(HOP_N - 1, Math.floor(x));
  return lerp(tab[n], tab[n + 1], x - n);
};

export type QuestionState = {
  x: number;
  y: number;
  /** 0..3: the hop it is on or has just finished */
  hop: number;
  phase: "hidden" | "travel" | "pause" | "creep";
  /** joints it has reached so far (0..3) */
  reached: number;
};
/** the question pill's centre at frame t (any t) */
export const questionAt = (t: number): QuestionState => {
  if (t < HOPS[0].from) {
    const p = PILL_ROUTES[0].pts[0];
    return { x: p.x, y: p.y, hop: 0, phase: "hidden", reached: 0 };
  }
  for (let i = 0; i < HOPS.length; i++) {
    const h = HOPS[i];
    const next = i + 1 < HOPS.length ? HOPS[i + 1].from : CREEP.from;
    if (t <= h.to) {
      const r = PILL_ROUTES[i];
      const p = atLen(r, r.len * hopProgress(i, (t - h.from) / (h.to - h.from)));
      return { ...p, hop: i, phase: "travel", reached: i };
    }
    if (t < next) {
      const p = POSTS[i].joint;
      return { x: p.x, y: p.y, hop: i, phase: "pause", reached: i + 1 };
    }
  }
  const r = PILL_ROUTES[3];
  const tt = t - CREEP.from;
  // ease off the joint, then a creep on an asymptote: it never arrives
  const s = r.len * CREEP.reach * (1 - Math.exp(-tt / CREEP.tau)) * smooth(clamp01(tt / 5));
  const p = atLen(r, s);
  return { ...p, hop: 3, phase: "creep", reached: 3 };
};

// ===========================================================================
// THE SERGEANT'S HANDSET
// ===========================================================================
/** handset pose: earpiece end and mouthpiece end, world px */
export type HandsetPose = { ear: Pt; mouth: Pt; bow: number };
const SGT_REST: HandsetPose = { ear: { x: 562, y: WALL.top - 9 }, mouth: { x: 618, y: WALL.top - 9 }, bow: -1 };
const sgtRaised = (duck: number): HandsetPose => {
  const h = soldierHead(SERGEANT);
  return { ear: { x: h.x + 27, y: h.y - 4 + duck }, mouth: { x: h.x + 34, y: h.y + 48 + duck }, bow: -1 };
};
/** "communist doctrine" f28-41: the sergeant lifts the handset to his ear (the line runs on to "radio") */
export const SGT_RAISE = { from: 28, to: 41 } as const;
export const sergeantHandsetAt = (t: number): HandsetPose => {
  const u = interpolate(t, [SGT_RAISE.from, SGT_RAISE.to], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const up = sgtRaised(soldierDuck(SERGEANT, t));
  // it lifts on an arc (up first, then over to the ear)
  const lift = Math.sin(u * Math.PI) * 16;
  return {
    ear: { x: lerp(SGT_REST.ear.x, up.ear.x, u), y: lerp(SGT_REST.ear.y, up.ear.y, u) - lift },
    mouth: { x: lerp(SGT_REST.mouth.x, up.mouth.x, u), y: lerp(SGT_REST.mouth.y, up.mouth.y, u) - lift },
    bow: -1,
  };
};

/** a commander's handset: on the phone's cradle, then at his inner ear from PICKUP_F */
export const postHandsetAt = (i: number, t: number): HandsetPose => {
  const p = POSTS[i];
  const dir = p.side === "R" ? 1 : -1;
  const sc = p.s / 100;
  const pcx = (p.phone.x0 + p.phone.x1) / 2;
  const rest: HandsetPose = {
    ear: { x: pcx - dir * 0.27 * p.s, y: p.phone.y0 - 0.075 * p.s },
    mouth: { x: pcx + dir * 0.27 * p.s, y: p.phone.y0 - 0.075 * p.s },
    bow: -1,
  };
  const ear: HandsetPose = {
    ear: { x: p.head.x - dir * 0.2 * p.s, y: p.head.y - 0.02 * p.s },
    mouth: { x: p.head.x - dir * 0.27 * p.s, y: p.head.y + 0.42 * p.s },
    bow: dir,
  };
  const u = interpolate(t, [PICKUP_F[i], PICKUP_F[i] + PICKUP_FRAMES], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  const lift = Math.sin(u * Math.PI) * 14 * sc;
  return {
    ear: { x: lerp(rest.ear.x, ear.ear.x, u), y: lerp(rest.ear.y, ear.ear.y, u) - lift },
    mouth: { x: lerp(rest.mouth.x, ear.mouth.x, u), y: lerp(rest.mouth.y, ear.mouth.y, u) - lift },
    bow: lerp(rest.bow, ear.bow, u),
  };
};

// ===========================================================================
// UNDER FIRE: tracers, dust, ducks
// ===========================================================================
export const TRACER = { speed: 130, len: 150, width: 8, startX: 2600 } as const;
export type Tracer = { launch: number; impact: Pt; start: Pt; hitT: number; seed: number };
/** the schedule: t -40 .. 400, one every 5-11 frames, now and then a pair */
export const TRACERS: Tracer[] = (() => {
  const out: Tracer[] = [];
  let t = -40;
  let n = 0;
  while (t < 400) {
    const pair = hash(n, 3) < 0.18;
    for (let k = 0; k < (pair ? 2 : 1); k++) {
      const u = hash(n * 2 + k, 7);
      const xI = WALL.x1 - 14 - (WALL.x1 - WALL.x0 - 60) * Math.pow(u, 1.4);
      // on the top course only: the lower course sits in the caption band while the camera is close
      const yI = WALL.top + 12 + 26 * hash(n * 2 + k, 11);
      // shallow, descending to the left; never above the wall's top along the wall
      const want = (1.2 + 2.8 * hash(n * 2 + k, 13)) * DEG;
      const tanA = Math.min(Math.tan(want), (yI - WALL.top - 8) / Math.max(1, WALL.x1 - xI));
      const start = { x: TRACER.startX, y: yI - (TRACER.startX - xI) * tanA };
      const dist = Math.hypot(start.x - xI, start.y - yI);
      const launch = t + k * 2;
      out.push({ launch, impact: { x: xI, y: yI }, start, hitT: launch + dist / TRACER.speed, seed: n * 2 + k });
    }
    t += 7 + Math.floor(hash(n, 5) * 8);
    n++;
  }
  return out;
})();

const PUFF_FRAMES = 13;
const DUCK_DEPTH = 7;
/** how far soldier i is ducked at t (world px down) */
export const soldierDuck = (i: number, t: number, gate: (tr: Tracer) => boolean = (tr) => defaultTracerGate(tr)) => {
  let d = 0;
  const x = SOLDIERS[i].x;
  for (const tr of TRACERS) {
    if (Math.abs(tr.impact.x - x) > 62) continue;
    if (tr.hitT > t || tr.hitT < t - 16) continue;
    if (!gate(tr)) continue;
    const tau = t - tr.hitT;
    if (tau < 0 || tau > 16) continue;
    const v = tau < 3 ? smooth(tau / 3) : 1 - smooth((tau - 3) / 13);
    d = Math.max(d, v);
  }
  return d * DUCK_DEPTH;
};

// ===========================================================================
// DRAWING
// ===========================================================================
const helmetD = (S: number) => {
  // a round steel helmet, frontal: a tall dome over the head and a thin rim
  // that arches a little over the face (box-local, Figure's box)
  const cx = 0.5 * S;
  const base = 0.29 * S;
  const rx = 0.235 * S;
  const ry = 0.28 * S;
  const bw = 0.278 * S; // rim half-width
  const th = 0.048 * S; // rim thickness
  const arch = 0.022 * S;
  const y0 = base - th / 2;
  const dome = `M${cx - rx} ${base} A${rx} ${ry} 0 0 1 ${cx + rx} ${base} Z`;
  const rim = `M${cx - bw} ${y0 + arch} Q${cx} ${y0 - arch} ${cx + bw} ${y0 + arch} A${th / 2} ${th / 2} 0 0 1 ${cx + bw} ${y0 + arch + th} Q${cx} ${y0 - arch + th} ${cx - bw} ${y0 + arch + th} A${th / 2} ${th / 2} 0 0 1 ${cx - bw} ${y0 + arch} Z`;
  return `${dome} ${rim}`;
};
const capD = (s: number) => {
  // an officer's peaked cap, frontal: a wide crown, a band, a short visor
  const cx = 0.5 * s;
  const t0 = 0.05 * s;
  const t1 = 0.165 * s;
  const tw = 0.29 * s;
  const bwid = 0.185 * s;
  const crown = `M${cx - tw} ${t0 + 0.02 * s} Q${cx - tw} ${t0} ${cx - tw + 0.03 * s} ${t0} L${cx + tw - 0.03 * s} ${t0} Q${cx + tw} ${t0} ${cx + tw} ${t0 + 0.02 * s} L${cx + bwid} ${t1} L${cx - bwid} ${t1} Z`;
  const band = `M${cx - bwid} ${t1 - 0.002 * s} L${cx + bwid} ${t1 - 0.002 * s} L${cx + bwid} ${t1 + 0.055 * s} L${cx - bwid} ${t1 + 0.055 * s} Z`;
  const visor = `M${cx - 0.2 * s} ${t1 + 0.05 * s} Q${cx} ${t1 + 0.13 * s} ${cx + 0.2 * s} ${t1 + 0.05 * s} Z`;
  return `${crown} ${band} ${visor}`;
};

/** a telephone receiver from `ear` to `mouth`: a bowed handle with a cup at
 *  each end on the inside of the bow; sc = size/100 (draw it inside <Inked>) */
export const handsetShape = (pose: HandsetPose, fill: string, sc = 1) => {
  const dx = pose.mouth.x - pose.ear.x;
  const dy = pose.mouth.y - pose.ear.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const bow = pose.bow * 0.3 * L;
  const c = { x: (pose.ear.x + pose.mouth.x) / 2 + nx * bow, y: (pose.ear.y + pose.mouth.y) / 2 + ny * bow };
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cw = 24 * sc;
  const ch = 15 * sc;
  const cup = (p: Pt) => {
    const q = { x: p.x - nx * pose.bow * 3 * sc, y: p.y - ny * pose.bow * 3 * sc };
    return (
      <rect
        x={-cw / 2}
        y={-ch / 2}
        width={cw}
        height={ch}
        rx={6 * sc}
        fill={fill}
        transform={`translate(${q.x} ${q.y}) rotate(${ang})`}
      />
    );
  };
  return (
    <g>
      <path
        d={`M${pose.ear.x} ${pose.ear.y} Q${c.x} ${c.y} ${pose.mouth.x} ${pose.mouth.y}`}
        fill="none"
        stroke={fill}
        strokeWidth={10 * sc}
        strokeLinecap="round"
      />
      {cup(pose.ear)}
      {cup(pose.mouth)}
    </g>
  );
};
/** a coiled cord from a to b: a wave along the line (it hangs a little) */
export const cordD = (a: Pt, b: Pt, amp = 6, wave = 13, sag = 10) => {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(2, Math.round(L / wave));
  const ux = (b.x - a.x) / (L || 1);
  const uy = (b.y - a.y) / (L || 1);
  const pts: string[] = [];
  const N = n * 8;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const w = Math.sin(u * n * 2 * Math.PI) * amp * Math.sin(u * Math.PI) ** 0.3;
    const hang = Math.sin(u * Math.PI) * sag;
    pts.push(`${(a.x + ux * L * u - uy * w).toFixed(2)} ${(a.y + uy * L * u + ux * w + hang).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
};

/** the dim wall (OP_MID), on its shadow */
export const WallShape: React.FC = () => (
  <g opacity={OP_MID}>
    <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
      {BAGS.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={BAG_RX} fill={SHADOW} />
      ))}
    </g>
    {BAGS.map((b, i) => (
      <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={BAG_RX} fill={INK} />
    ))}
  </g>
);

/** one soldier (box-local Figure + helmet), ducked by `duck` px */
export const Soldier: React.FC<{ i: number; duck: number }> = ({ i, duck }) => {
  const s = SOLDIERS[i];
  const S = SOLDIER_S;
  const x = s.x - S / 2;
  const y = SOLDIER_YB + s.lift + duck;
  return (
    <g transform={`translate(${x} ${y}) rotate(${s.tilt} ${0.5 * S} ${0.9 * S})`}>
      <Figure x={0} y={0} size={S} mode="solid" />
      <Inked render={(fill) => <path d={helmetD(S)} fill={fill} />} />
    </g>
  );
};

/** the squad: everything behind the wall (masked by it), the sergeant's
 *  handset and cord, then the dim wall in front. `question` is drawn behind
 *  the squad and the wall (it rises out of the radio pack). */
export const SquadLayer: React.FC<{ t: number; id?: string; behind?: React.ReactNode }> = ({ t, id = "dw", behind }) => {
  const hs = sergeantHandsetAt(t);
  const sgtDuck = soldierDuck(SERGEANT, t);
  const cordA = hs.mouth;
  const cordB = { x: PACK.x0 + 6, y: PACK.top + 30 + sgtDuck };
  return (
    <g>
      <defs>
        <mask id={`${id}-wall`} maskUnits="userSpaceOnUse" x={-2000} y={-3000} width={6000} height={7000}>
          <rect x={-2000} y={-3000} width={6000} height={7000} fill="#FFFFFF" />
          {BAGS.map((b, i) => (
            <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={BAG_RX} fill="#000000" />
          ))}
          <rect x={WALL.x0 + BAG_RX} y={WALL.top + 10} width={WALL.x1 - WALL.x0 - 2 * BAG_RX} height={WALL.bottom - WALL.top + 400} fill="#000000" />
        </mask>
      </defs>
      <g mask={`url(#${id}-wall)`}>
        {/* the radio pack, behind the sergeant and his neighbour: a squat box, two knobs */}
        <Inked
          render={(fill) => (
            <rect x={PACK.x0} y={PACK.top + sgtDuck} width={PACK.x1 - PACK.x0} height={WALL.top + 20 - PACK.top} rx={7} fill={fill} />
          )}
        />
        <circle cx={PACK.x0 + 12} cy={PACK.top + 13 + sgtDuck} r={5.5} fill={BLACK} />
        <rect x={PACK.x0 + 22} y={PACK.top + 9 + sgtDuck} width={18} height={8} rx={2} fill={BLACK} />
        {behind}
        {SOLDIERS.map((_, i) => (
          <Soldier key={i} i={i} duck={soldierDuck(i, t)} />
        ))}
      </g>
      <WallShape />
      {/* the coiled cord, then the handset (on the wall's top until "radio") */}
      <Inked render={(fill) => <path d={cordD(cordA, cordB, 3.5, 10, 8)} fill="none" stroke={fill} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />} />
      <Inked render={(fill) => handsetShape(hs, fill)} />
      {/* the ground the wall stands on */}
      <Inked render={(fill) => <rect x={-1600} y={GROUND_Y} width={4400} height={STROKE} fill={fill} opacity={OP_MID} />} />
    </g>
  );
};

/** cut 51's default: no new tracer is fired once the camera is wide (k < 0.7 at launch),
 *  so the wide is clean; those already in flight land and puff */
export const TRACER_K_MIN = 0.7;
export const defaultTracerGate = (tr: Tracer) => dampedK(Math.max(0, tr.launch)) >= TRACER_K_MIN;
/** the incoming fire: tracers (black, no shadow) and the dust they kick up.
 *  `gate` decides which tracers are fired at all (cut 57 can pass its own). */
export const FireLayer: React.FC<{ t: number; gate?: (tr: Tracer) => boolean }> = ({ t, gate = defaultTracerGate }) => {
  const dashes: React.ReactNode[] = [];
  const puffs: React.ReactNode[] = [];
  for (const tr of TRACERS) {
    if (t < tr.launch || t > tr.hitT + PUFF_FRAMES) continue;
    if (!gate(tr)) continue;
    const dx = tr.impact.x - tr.start.x;
    const dy = tr.impact.y - tr.start.y;
    const D = Math.hypot(dx, dy);
    const ux = dx / D;
    const uy = dy / D;
    const head = Math.min(D, (t - tr.launch) * TRACER.speed);
    const tail = Math.max(0, (t - tr.launch) * TRACER.speed - TRACER.len);
    if (tail < D - 0.5) {
      dashes.push(
        <line
          key={`tr${tr.seed}`}
          x1={tr.start.x + ux * tail}
          y1={tr.start.y + uy * tail}
          x2={tr.start.x + ux * head}
          y2={tr.start.y + uy * head}
          stroke={BLACK}
          strokeWidth={TRACER.width}
          strokeLinecap="round"
        />,
      );
    }
    const tau = t - tr.hitT;
    if (tau >= 0 && tau <= PUFF_FRAMES) {
      const u = tau / PUFF_FRAMES;
      const go = Easing.out(Easing.cubic)(u);
      const op = 1 - clamp01((tau - 4) / (PUFF_FRAMES - 4));
      const blobs = [
        { a: -18, d: 22, r: 8 },
        { a: -58, d: 30, r: 11 },
        { a: -96, d: 22, r: 7 },
      ];
      puffs.push(
        <Inked
          key={`pf${tr.seed}`}
          opacity={op}
          render={(fill) => (
            <>
              {blobs.map((b, j) => {
                const a = (b.a + (hash(tr.seed, j) - 0.5) * 24) * DEG;
                const dd = b.d * (0.8 + 0.4 * hash(tr.seed, j + 5)) * go;
                const rr = b.r * (0.55 + 0.75 * go);
                return <circle key={j} cx={tr.impact.x + Math.cos(a) * dd} cy={tr.impact.y + Math.sin(a) * dd} r={rr} fill={fill} />;
              })}
            </>
          )}
        />,
      );
    }
  }
  return (
    <g>
      {dashes}
      {puffs}
    </g>
  );
};

/** the joint: a chunky white plug block with a black socket */
const Joint: React.FC<{ p: Pt; size?: number }> = ({ p, size = 28 }) => (
  <g>
    <Inked render={(fill) => <rect x={p.x - size / 2} y={p.y - size / 2} width={size} height={size} rx={6} fill={fill} />} />
    <circle cx={p.x} cy={p.y} r={size * 0.17} fill={BLACK} />
  </g>
);

/** one commander post: bust behind the dim desk, the phone, the handset */
const PostGlyph: React.FC<{ i: number; t: number; id: string }> = ({ i, t, id }) => {
  const p = POSTS[i];
  const box = postBustBox(p);
  const dir = p.side === "R" ? 1 : -1;
  const sc = p.s / 100;
  const hs = postHandsetAt(i, t);
  const pcx = (p.phone.x0 + p.phone.x1) / 2;
  const cordB = { x: pcx + dir * 0.36 * (p.phone.x1 - p.phone.x0), y: p.phone.y0 + 0.08 * p.s };
  const panelH = PANEL_H * p.s;
  const phW = p.phone.x1 - p.phone.x0;
  const phH = p.phone.y1 - p.phone.y0;
  const phoneD = (() => {
    const b0 = p.phone.x0;
    const b1 = p.phone.x1;
    const tIn = 0.14 * phW;
    const y0 = p.phone.y0;
    const y1 = p.phone.y1;
    const r = 5 * sc;
    return `M${b0 + tIn + r} ${y0} L${b1 - tIn - r} ${y0} Q${b1 - tIn} ${y0} ${b1 - tIn + 1} ${y0 + r} L${b1} ${y1} L${b0} ${y1} L${b0 + tIn - 1} ${y0 + r} Q${b0 + tIn} ${y0} ${b0 + tIn + r} ${y0} Z`;
  })();
  const prongW = 0.1 * p.s;
  const prongH = 0.06 * p.s;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-desk-${i}`}>
          <rect x={p.x0 - 400} y={p.D - 2000} width={p.w + 800} height={2000} />
        </clipPath>
      </defs>
      {/* the commander, behind his desk */}
      <g clipPath={`url(#${id}-desk-${i})`}>
        <Figure x={box.x} y={box.y} size={p.s} mode="solid" />
        <g transform={`translate(${box.x} ${box.y})`}>
          <Inked render={(fill) => <path d={capD(p.s)} fill={fill} />} />
        </g>
      </g>
      {/* the dim desk */}
      <g opacity={OP_MID}>
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
          <rect x={p.x0 - 8} y={p.D} width={p.w + 16} height={SLAB_H} fill={SHADOW} />
          <rect x={p.x0} y={p.D + SLAB_H} width={p.w} height={panelH} fill={SHADOW} />
        </g>
        <rect x={p.x0 - 8} y={p.D} width={p.w + 16} height={SLAB_H} fill={INK} />
        <rect x={p.x0} y={p.D + SLAB_H} width={p.w} height={panelH} fill={INK} />
      </g>
      {/* the phone: a desk set with its cradle, its dial, its cord, its handset */}
      <Inked
        render={(fill) => (
          <>
            <path d={phoneD} fill={fill} />
            <rect x={p.phone.x0 + 0.14 * phW} y={p.phone.y0 - prongH} width={prongW} height={prongH + 2} rx={2} fill={fill} />
            <rect x={p.phone.x1 - 0.14 * phW - prongW} y={p.phone.y0 - prongH} width={prongW} height={prongH + 2} rx={2} fill={fill} />
          </>
        )}
      />
      <circle cx={pcx} cy={p.phone.y0 + 0.55 * phH} r={0.075 * p.s} fill={BLACK} />
      <circle cx={pcx} cy={p.phone.y0 + 0.55 * phH} r={0.026 * p.s} fill={INK} />
      <Inked
        render={(fill) => (
          <path d={cordD(hs.mouth, cordB, 3.5 * sc, 9 * sc, 10 * sc)} fill="none" stroke={fill} strokeWidth={4 * sc} strokeLinecap="round" strokeLinejoin="round" />
        )}
      />
      <Inked render={(fill) => handsetShape(hs, fill, sc)} />
    </g>
  );
};

/** the chain: the cable (behind), the posts, the star, the joints */
export const ChainLayer: React.FC<{ t: number; id?: string }> = ({ t, id = "dw" }) => (
  <g>
    {LINKS.map((r, i) => (
      <Inked
        key={`l${i}`}
        render={(fill) => <path d={r.d} fill="none" stroke={fill} strokeWidth={STROKE} strokeLinecap="butt" strokeLinejoin="round" />}
      />
    ))}
    {POSTS.map((_, i) => (
      <PostGlyph key={`p${i}`} i={i} t={t} id={id} />
    ))}
    <Inked render={(fill) => <path d={starD} fill={fill} strokeLinejoin="round" stroke={fill} strokeWidth={4} />} />
    {POSTS.map((p, i) => (
      <Joint key={`j${i}`} p={p.joint} />
    ))}
  </g>
);

export const PILL = { w: 124, h: 88, glyph: 70 } as const;
/** the question: a white speech pill on its shadow, a black "?" */
export const QuestionPill: React.FC<{ t: number; opacity?: number }> = ({ t, opacity = 1 }) => {
  const q = questionAt(t);
  if (q.phase === "hidden") return null;
  const x0 = q.x - PILL.w / 2;
  const y0 = q.y - PILL.h / 2;
  const shape = (fill: string) => (
    <>
      <rect x={x0} y={y0} width={PILL.w} height={PILL.h} rx={PILL.h / 2} fill={fill} />
      <path d={`M${x0 + 30} ${y0 + PILL.h - 6} L${x0 + 20} ${y0 + PILL.h + 18} L${x0 + 54} ${y0 + PILL.h - 6} Z`} fill={fill} />
    </>
  );
  return (
    <g opacity={opacity === 1 ? undefined : opacity}>
      <Inked render={shape} />
      <text x={q.x} y={q.y + 0.35 * PILL.glyph} textAnchor="middle" fill={BLACK} style={type(PILL.glyph, 900)}>
        ?
      </text>
    </g>
  );
};

/**
 * The whole world at frame t, in paint order. Cut 51 uses the defaults.
 * For cut 57: `chainOpacity` / `questionOpacity` (1 = as in cut 51) let the
 * chain drain into the dim tone; `squad` replaces SquadLayer with the
 * caller's own (moving) squad, drawn at the same place in the paint order;
 * `fire` false stops drawing the tracers and dust.
 */
export const DoctrineScene: React.FC<{
  t: number;
  id?: string;
  chainOpacity?: number;
  questionOpacity?: number;
  squad?: React.ReactNode;
  fire?: boolean;
  tracerGate?: (tr: Tracer) => boolean;
}> = ({ t, id = "dw", chainOpacity = 1, questionOpacity = 1, squad, fire = true, tracerGate }) => {
  const q = questionAt(t);
  // while it is still coming out of the radio it is behind the squad and the wall
  const behind = q.phase === "travel" && q.hop === 0 && q.y > PACK.top - 60;
  return (
    <g>
      {chainOpacity > 0 ? (
        <g opacity={chainOpacity === 1 ? undefined : chainOpacity}>
          <ChainLayer t={t} id={id} />
        </g>
      ) : null}
      {behind || questionOpacity <= 0 ? null : <QuestionPill t={t} opacity={questionOpacity} />}
      {squad ?? <SquadLayer t={t} id={id} behind={behind ? <QuestionPill t={t} /> : null} />}
      {fire ? <FireLayer t={t} gate={tracerGate} /> : null}
    </g>
  );
};

// ===========================================================================
// THE CAMERA (cut 51) — exported for cut 57's join
// ===========================================================================
/** world bounds of everything at the wide (shadows included) */
export const CONTENT = (() => {
  const top = STAR.cy - STAR.R - 6;
  const bottom = GROUND_Y + STROKE + SHADOW_OFF;
  const left = Math.min(WALL.x0, ...POSTS.map((p) => p.x0 - 8));
  const right = Math.max(WALL.x1 + SHADOW_OFF, ...POSTS.map((p) => p.x1 + 8 + SHADOW_OFF));
  return { top, bottom, left, right };
})();
/** the resolved wide: content between screen y 72 and 1060 (above the captions) */
const WIDE_TOP_SY = 72;
const WIDE_BOTTOM_SY = 1060;
export const K_WIDE = (WIDE_BOTTOM_SY - WIDE_TOP_SY) / (CONTENT.bottom - CONTENT.top);
export const CX_WIDE = (CONTENT.left + CONTENT.right) / 2;
export const CY_WIDE = CONTENT.bottom - (WIDE_BOTTOM_SY - 960) / K_WIDE;

/** f0: close on the squad, faces at screen y ~890, k 1.70 */
export const K_OPEN = 1.7;
const FACE_Y = soldierHead(SERGEANT).y;
const FACE_SY = 890;
export const CX_OPEN = 540;
export const CY_OPEN = FACE_Y + (960 - FACE_SY) / K_OPEN;
/** a push-in that never stops (per frame, in log k), with the pull-back laid over it */
const CREEP_RATE = Math.log(1.035) / 56;
export const MOVE_F0 = 26;
export const MOVE_F1 = 106;
export const MOVE_WARP = 1.0;
const CX_LEAN = 85;
const G_SY_OPEN = 960 + (GROUND_Y - CY_OPEN) * K_OPEN;
const G_SY_WIDE = 960 + (GROUND_Y - CY_WIDE) * K_WIDE;

const CAM_LEN = 400; // keys out to t 400 so cut 57 can reuse the track's tail if it wants
export const CAM_F: number[] = [];
export const CAM_K: number[] = [];
export const CAM_CX: number[] = [];
export const CAM_CY: number[] = [];
for (let f = 0; f <= CAM_LEN; f++) {
  const e = camEase((f - MOVE_F0) / (MOVE_F1 - MOVE_F0), MOVE_WARP);
  const lk = Math.log(K_OPEN) + CREEP_RATE * f + (Math.log(K_WIDE) - Math.log(K_OPEN) - CREEP_RATE * MOVE_F1) * e;
  const k = Math.exp(lk);
  const gsy = lerp(G_SY_OPEN, G_SY_WIDE, e);
  CAM_F.push(f);
  CAM_K.push(k);
  // the frame leans right while the question goes out to the platoon (right of the
  // squad), and is back on the chain's centre by the wide: one smooth bump
  const lean = CX_LEAN * smooth(clamp01((f - MOVE_F0) / 30)) * (1 - smooth(clamp01((f - 58) / 42)));
  CAM_CX.push(lerp(CX_OPEN, CX_WIDE, e) + lean);
  // keep the ground line on its screen track: cy from the eased k
  CAM_CY.push(GROUND_Y - (gsy - 960) / k);
}
/** the damped camera's k at every frame (for the pill's even screen speed) */
let K_DAMPED: number[] | null = null;
const dampedK = (t: number) => {
  if (!K_DAMPED) {
    K_DAMPED = [];
    for (let f = 0; f <= 200; f++) K_DAMPED.push(runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K).k);
  }
  const f = Math.max(0, Math.min(199.999, t));
  const n = Math.floor(f);
  return lerp(K_DAMPED[n], K_DAMPED[n + 1], f - n);
};
/** the damped camera at frame t of cut 51 (no sway) */
export const doctrineCameraAt = (t: number) => runCamera2(t, CAM_F, CAM_CY, CAM_CX, CAM_K);
/** the exact camera on cut 51's last frame (t 127): damped state + sway */
export const CAM_LAST = (() => {
  const c = doctrineCameraAt(JOIN_T);
  const s = sway(JOIN_T);
  return { cx: c.cx, cy: c.cy, k: c.k, swayDx: s.dx, swayDy: s.dy };
})();
/** the paper photograph's rest (TallPaper cxRest / cyRest) */
export const PAPER_REST = { cx: (CX_OPEN + CX_WIDE) / 2, cy: (CY_OPEN + CY_WIDE) / 2 } as const;

/**
 * The full frame: the paper and the world under camera (cx, cy, k), plus the
 * hand's sway in SCREEN px. Cut 51 renders `<DoctrineFrame t={f} cam={doctrineCameraAt(f)} />`;
 * cut 57 renders it with t = JOIN_T + f and its own camera, starting from CAM_LAST.
 * `paperFrame` drives the paper's drift (default t).
 */
export const DoctrineFrame: React.FC<{
  t: number;
  cam: { cx: number; cy: number; k: number };
  swayAt?: number;
  paperFrame?: number;
  id?: string;
  children?: React.ReactNode;
}> = ({ t, cam, swayAt, paperFrame, id = "dw", children }) => {
  const s = sway(swayAt ?? t);
  return (
    <>
      <TallPaper frame={paperFrame ?? t} cx={cam.cx} cy={cam.cy} k={cam.k} cxRest={PAPER_REST.cx} cyRest={PAPER_REST.cy} />
      <WorldTall cx={cam.cx} cy={cam.cy} k={cam.k} sx={540 + s.dx} sy={960 + s.dy} id={id}>
        {children ?? <DoctrineScene t={t} id={id} />}
      </WorldTall>
    </>
  );
};

/** EASE_LAND re-exported so cut 57 matches the house landing */
export { EASE_LAND };
