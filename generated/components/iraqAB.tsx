// ---------------------------------------------------------------------------
// iraqAB: THE A+B SCENE of "Sheppard_Regime_change_in_Iraq_was_the_easy_part"
// (Dwarkesh with Si Sheppard; Dwarkesh map style) on THE IRAQ WORLD
// (iraqShared.tsx). One global-clock scene (g = the Premiere sequence frame,
// 24 fps) rendered by cut A LimitedObjectives (g12..276) and cut B
// RegimeChangeInBaghdad (g277..598); cut C (builder M) opens on its g598 state.
// IraqABScene renders ANY g >= 12; past g525 nothing moves but the camera's slow
// pull-back creep (it rests at g700), the men's faint hashed drift and the house
// sway = the B_END state.
//
// A "Speaking of Iraq, the war that didn't go remotely as well as the first one.
//    The first one was for limited objectives. This one's for unlimited
//    objectives,"
// B "regime change in Baghdad. That part turns out to be easy. But the problem
//    when you do regime change is the loaded diaper is yours, right? Because now
//    what?"
//
// ORANGE = WHAT AMERICA TAKES ON: Kuwait (1991), then the whole of Iraq (2003),
// the columns, the ground that becomes "yours". Everything else cream.
// Throughout: Iraq lifted off its neighbours (IraqLand: a warm wash + inner rim),
// the Tigris, Euphrates and Shatt al-Arab as fine cream lines (0.45), the
// neighbours' borders fine dashed cream (0.45).
//
// GESTURES (global frames; word onsets in SPD/iraq/cut_frames.md):
//  A1 g12  open wide on Iraq + neighbours, k 0.85 (centroid at y820), Iraq's
//          border a crisp cream line (3 px, 0.9); the camera already creeping in
//          (k 0.85 -> 0.91).
//  A2 "Iraq" g24: IRAQ (IM Fell SC, 64 px, 0.5 em spacing) slides up at Iraq's
//          centre (starts g16).
//  A3 "the first one" g108-140: the camera glides SE to Kuwait (k 1.6, Kuwait's
//          centroid at (690, 850), southern Iraq above; lands g132); IRAQ drops
//          to the 0.45 rung (g108-130; it stays on screen, top left).
//  A4 "the first one was for limited objectives" g132-169: the 1991 OBJECTIVE:
//          orange hatch fills Kuwait behind a crisp straight front travelling
//          NNW from the Saudi border (parallel to it), reaching the Iraq border
//          on "objectives" g169 and stopping; the Kuwait-Iraq border lights solid
//          orange (W_OBJ 4.2 px; g165-174). No arrows, no year, no Kuwait label.
//  A5 "This one's for unlimited objectives" g194-258: the camera pulls back to
//          the whole of Iraq (k 0.94, centroid at y812; lands g250); from the two
//          ends of the lit Kuwait segment an orange DASHED line (4.2 px, 22 px
//          dashes) runs both ways round Iraq's whole border (east: coast, Iran,
//          Turkey; west: Saudi, Jordan, Syria), the two heads meeting at the
//          Syria-Turkey tripoint (the far north-west corner) on "objectives" g258.
//          Kuwait's hatch recedes to 0.3 (g201-250).
//  A6 to g276: creep (k 0.94 -> 0.97); a faint highlight travels the dashed
//          outline from the meeting point (g258-300).
//  B1 "regime change in Baghdad" g277-296: BAGHDAD (IM Fell roman 44 px) +
//          cream dot land on "Baghdad" (dot g284-294, label starts g288); IRAQ
//          fades out (g277-296; it would sit under Baghdad and the men). From g277
//          two compact marching bodies of 33 men (3 abreast x 11 deep, 14 world
//          px apart, the tail following the head along the route, nothing left
//          behind) stream out of their Kuwait assembly areas (3rd Infantry
//          Division west of the Euphrates, I MEF east) and race north.
//  B2 "That part turns out to be easy" g313-352: the bodies decelerate into
//          Baghdad and, on arrival ("easy" g352; rear ranks by g363), merge into
//          one rounded crowd massed on Baghdad's south side (blue noise, >= 12.5
//          world px apart); the thin orange ring closes round the Baghdad dot
//          (g343-355). The camera follows north on its own track (whole Iraq ->
//          Baghdad at k 1.5, y835; g288-346).
//  B3 "But the problem when you do regime change" g356-451: a slow creep, the
//          ring highlight; then from "problem" g404 one slow continuous pull-back
//          from Baghdad (k 1.5 -> 1.05 by ~g468) that reveals the rest of the
//          country - the size of what lies beyond - and flows on into B4.
//  B4 "is the loaded diaper is yours" g451-504: the crowd fans out from Baghdad
//          across the whole country (each man to his own point of an organic,
//          variable-spacing blue noise; staggered starts and durations), and the
//          orange hatch (0.45) spreads behind them from Baghdad as a crisp front
//          (Iraq's own outline scaled about Baghdad, 6 px feather) meeting the
//          dashed outline EXACTLY on "yours" g504; the dashed outline settles to
//          solid orange (g500-510). The pull-back lands on the whole of Iraq
//          (k 0.94, g~500).
//  B5 "right? Because now what?" g525-598: everything has stopped bar a very
//          slight hashed drift of the men; a big orange country with a thin
//          scatter of men in it; a very slow pull-back creep (k 0.94 -> 0.905 by
//          g700). = THE B_END STATE.
//
// SOURCES. UNSC Res. 678 (1990: the 1991 objective = expel Iraq from Kuwait;
// ground war 24-28 Feb 1991). 2003 invasion from Kuwait 20 Mar 2003, Baghdad fell
// 9 Apr 2003 (Wikipedia "2003 invasion of Iraq"): 3rd Infantry Division via
// Tallil / An Nasiriyah, As Samawah, An Najaf, the Karbala Gap, Baghdad airport;
// I MEF via Safwan, An Nasiriyah, Ad Diwaniyah, An Numaniyah, the Diyala bridge.
// Borders + rivers: Natural Earth 10m (borders unchanged 1991-2006).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing } from "remotion";
import {
  BAGHDAD,
  CityDot,
  DASH_OBJ,
  DashedBorder,
  Dots,
  Hatch,
  Highlight,
  IRAQ_BOX,
  IRAQ_CENTROID,
  IRAQ_D,
  IRAQ_RING,
  IRAQ_ROUTE,
  IRAQ_SEG,
  IraqBorder,
  IraqLand,
  KUWAIT_CENTROID,
  KUWAIT_D,
  KUWAIT_POLYS,
  LABEL_LEAD,
  Label,
  MapStack,
  OTHER_BORDERS_D,
  PaperTop,
  RUNG,
  ROUTE_ARMY,
  ROUTE_MARINES,
  Ring,
  Rivers,
  RouteLine,
  SEA,
  W_OBJ,
  WorldSvg,
  clamp01,
  easeInOutSine,
  hash,
  inIraq,
  makeCamTrack,
  project,
  revealHalfPlane,
  revealScaled,
  smoothstep,
  swayCam,
  type Cam,
  type Dot,
  type P2,
  type Route,
} from "./iraqShared";

export const G_START = 12;
export const A_IN = 12;
export const A_DUR = 265;
export const B_IN = 277;
export const B_DUR = 322;
export const B_END_G = B_IN + B_DUR - 1; // 598

// ---------------------------------------------------------------------------
// TIMING (global frames)
// ---------------------------------------------------------------------------
export const T = {
  iraqLabel: 24 - LABEL_LEAD,
  iraqDim: [108, 130] as [number, number],
  kuwaitFront: [132, 169] as [number, number],
  kuwaitLight: [165, 174] as [number, number],
  kuwaitRecede: [201, 250] as [number, number],
  heads: [194, 258] as [number, number],
  outlineHL: [258, 300] as [number, number],
  iraqOut: [277, 296] as [number, number],
  baghdadDot: [284, 294] as [number, number],
  baghdadLabel: 296 - LABEL_LEAD,
  columns: [277, 352] as [number, number],
  merge: 330, // the front rank starts merging into the crowd
  ring: [343, 355] as [number, number],
  ringHL: [356, 420] as [number, number],
  fan: 451,
  front: [453, 504] as [number, number],
  solid: [500, 510] as [number, number],
};

// ---------------------------------------------------------------------------
// THE CAMERA: framings joined by velocity bumps (makeCamTrack)
// ---------------------------------------------------------------------------
const C = IRAQ_CENTROID;
export const camAB = makeCamTrack(
  [
    { p: C, k: 0.85, sy: 820 }, // F0 A1 the open
    { p: C, k: 0.91, sy: 816 }, // F1 its creep
    { p: KUWAIT_CENTROID, k: 1.6, sx: 690, sy: 850 }, // F2 Kuwait (A3)
    { p: KUWAIT_CENTROID, k: 1.65, sx: 690, sy: 848 }, // F3 its creep
    { p: C, k: 0.94, sy: 812 }, // F4 whole Iraq (A5)
    { p: C, k: 0.97, sy: 812 }, // F5 its creep (A6)
    { p: BAGHDAD, k: 1.5, sy: 835 }, // F6 Baghdad (B2)
    { p: BAGHDAD, k: 1.52, sy: 835 }, // F7 the creep (B3)
    { p: C, k: 1.05, sy: 822 }, // F8 the pull-back from "problem" (B3)
    { p: C, k: 0.94, sy: 812 }, // F9 whole Iraq (B4)
    { p: C, k: 0.905, sy: 812 }, // F10 the slow pull-back (B5 -> rests g700)
  ],
  [
    { from: 0, to: 150 },
    { from: 90, to: 132 },
    { from: 120, to: 215 },
    { from: 194, to: 250 },
    { from: 240, to: 300 },
    { from: 288, to: 346 },
    { from: 340, to: 412 },
    { from: 402, to: 470, taper: 1 },
    { from: 444, to: 502 },
    { from: 494, to: 700 },
  ],
);
/** the camera as rendered (sway on the global clock) */
export const camShownAB = (g: number): Cam => swayCam(camAB(g), g);

// ---------------------------------------------------------------------------
// deterministic random
// ---------------------------------------------------------------------------
const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
const segDist = (p: P2, a: P2, b: P2) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1e-12;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
const borderDist = (p: P2) => {
  let best = Infinity;
  for (let i = 1; i < IRAQ_RING.length; i++) best = Math.min(best, segDist(p, IRAQ_RING[i - 1], IRAQ_RING[i]));
  return best;
};

// ---------------------------------------------------------------------------
// KUWAIT'S FRONT: a straight front parallel to the Kuwait-Saudi border, travelling
// NNW to the Iraq border
// ---------------------------------------------------------------------------
const TRIPOINT = IRAQ_ROUTE.pointAt(0);
const KS_COAST = project(48.42, 28.53);
const FRONT_N: P2 = (() => {
  const t = [KS_COAST[0] - TRIPOINT[0], KS_COAST[1] - TRIPOINT[1]];
  const l = Math.hypot(t[0], t[1]);
  let n: P2 = [t[1] / l, -t[0] / l];
  if (n[1] > 0) n = [-n[0], -n[1]]; // northward (world y up is negative)
  return n;
})();
const FRONT_D = (() => {
  const ds = KUWAIT_POLYS.flatMap((poly) => poly[0]).map(([x, y]) => (x - TRIPOINT[0]) * FRONT_N[0] + (y - TRIPOINT[1]) * FRONT_N[1]);
  return { lo: Math.min(...ds), hi: Math.max(...ds) };
})();
const kuwaitFrontDist = (g: number, k: number) => {
  const u = easeInOutSine((g - T.kuwaitFront[0]) / (T.kuwaitFront[1] - T.kuwaitFront[0]));
  return FRONT_D.lo - 10 / k + (FRONT_D.hi + 8 / k - (FRONT_D.lo - 10 / k)) * u;
};

// ---------------------------------------------------------------------------
// THE OUTLINE: two heads round Iraq from the Kuwait segment's ends
// ---------------------------------------------------------------------------
const LEN = IRAQ_ROUTE.len;
const MEET = IRAQ_SEG.syria.s0; // the Syria-Turkey-Iraq tripoint
const headsU = (g: number) => easeInOutSine((g - T.heads[0]) / (T.heads[1] - T.heads[0]));
export const eastHead = (g: number) => IRAQ_SEG.kuwait.s1 + (MEET - IRAQ_SEG.kuwait.s1) * headsU(g);
export const westHead = (g: number) => LEN - (LEN - MEET) * headsU(g);

// ---------------------------------------------------------------------------
// THE MEN. Two marching bodies (3 abreast x 11 deep), then one crowd south of
// Baghdad, then the scatter. Index i < N_BODY = 3ID, i >= N_BODY = I MEF; the
// same index is the same man in every phase.
// ---------------------------------------------------------------------------
const ABREAST = 3;
const RANKS = 11;
export const N_BODY = ABREAST * RANKS; // 33
export const N_MEN = 2 * N_BODY; // 66
const RANK_GAP = 14; // world px (>= 13.6 screen px at the race's k 0.97)
const FILE_GAP = 14;
const COL_EASE = Easing.bezier(0.32, 0, 0.18, 1);
const colU = (g: number) => COL_EASE(clamp01((g - T.columns[0]) / (T.columns[1] - T.columns[0])));
/** man i's place in his marching body at head arclength sHead */
const bodyPos = (route: Route, sHead: number, j: number): { p: P2; op: number } => {
  const rank = Math.floor(j / ABREAST);
  const file = (j % ABREAST) - (ABREAST - 1) / 2;
  const s = sHead - rank * RANK_GAP + (hash(j, 11) - 0.5) * 1.6;
  const [x, y] = route.pointAt(Math.max(0, s));
  // the files' direction from a long chord (the body wheels through a bend instead
  // of pinching on its inside)
  const a = route.pointAt(Math.max(0, s) - 70);
  const b = route.pointAt(Math.max(0, s) + 70);
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const [tx, ty] = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  const lat = file * FILE_GAP + (hash(j, 12) - 0.5) * 1.6;
  return { p: [x - ty * lat, y + tx * lat], op: s <= 0 ? 0 : clamp01(s / 10) };
};
const routeOf = (i: number) => (i < N_BODY ? ROUTE_ARMY : ROUTE_MARINES);

// the crowd: one rounded mass on Baghdad's south side (blue noise, min 12.5 world px)
const RING_R = 16; // screen px (the Baghdad ring)
const CROWD_MIN = 12.5;
export const CROWD: P2[] = (() => {
  const r = rng(90403);
  for (let scale = 1; scale < 3; scale *= 1.06) {
    const rx = 58 * scale;
    const ry = 44 * scale;
    const c: P2 = [BAGHDAD[0] + 2, BAGHDAD[1] + RING_R / 1.5 + 5 + ry];
    const pts: P2[] = [];
    for (let tries = 0; tries < 30000 && pts.length < N_MEN; tries++) {
      const a = r() * 2 * Math.PI;
      const q = Math.sqrt(r());
      const p: P2 = [c[0] + Math.cos(a) * q * rx, c[1] + Math.sin(a) * q * ry];
      if (pts.every((o) => Math.hypot(o[0] - p[0], o[1] - p[1]) >= CROWD_MIN)) pts.push(p);
    }
    if (pts.length >= N_MEN) return pts;
  }
  throw new Error("crowd does not fit");
})();
// assign the crowd: 3ID to the western slots, I MEF to the eastern; within each, by
// 2-opt on the squared distance from each man's body place at the merge
const assign = (starts: P2[], targets: P2[]) => {
  const d2 = (a: P2, b: P2) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const asg = starts.map((_, i) => i);
  for (let pass = 0; pass < 40; pass++) {
    let improved = false;
    for (let i = 0; i < asg.length; i++)
      for (let j = i + 1; j < asg.length; j++) {
        const now = d2(starts[i], targets[asg[i]]) + d2(starts[j], targets[asg[j]]);
        const sw = d2(starts[i], targets[asg[j]]) + d2(starts[j], targets[asg[i]]);
        if (sw < now - 1e-6) {
          [asg[i], asg[j]] = [asg[j], asg[i]];
          improved = true;
        }
      }
    if (!improved) break;
  }
  return asg.map((a) => targets[a]);
};
const SLOT: P2[] = (() => {
  const byX = CROWD.map((p, i) => ({ p, i })).sort((a, b) => a.p[0] - b.p[0]);
  const west = byX.slice(0, N_BODY).map((q) => q.p);
  const east = byX.slice(N_BODY).map((q) => q.p);
  const at = (i: number) => bodyPos(routeOf(i), routeOf(i).len, i % N_BODY).p;
  const a = assign(
    Array.from({ length: N_BODY }, (_, j) => at(j)),
    west,
  );
  const b = assign(
    Array.from({ length: N_BODY }, (_, j) => at(N_BODY + j)),
    east,
  );
  return [...a, ...b];
})();
/** the merge window of man i: front ranks first */
const mergeW = (i: number, g: number) => {
  const rank = Math.floor((i % N_BODY) / ABREAST);
  const t0 = T.merge + rank * 1.1 + 2 * hash(i, 13);
  return easeInOutSine((g - t0) / 22);
};
/** a very slight hashed drift (world px), ramped in after arrival */
const drift = (i: number, g: number): P2 => {
  const a = 1.1 * smoothstep((g - 352) / 30);
  if (a <= 0) return [0, 0];
  const w1 = 0.03 + 0.025 * hash(i, 21);
  const w2 = 0.027 + 0.025 * hash(i, 22);
  return [a * Math.sin(g * w1 + 6.283 * hash(i, 23)), a * Math.sin(g * w2 + 6.283 * hash(i, 24))];
};
const crowdPos = (i: number, g: number): P2 => {
  const d = drift(i, g);
  return [SLOT[i][0] + d[0], SLOT[i][1] + d[1]];
};
/** the men before the fan-out */
const marchAt = (g: number): Dot[] =>
  Array.from({ length: N_MEN }, (_, i) => {
    const route = routeOf(i);
    const b = bodyPos(route, route.len * colU(g), i % N_BODY);
    const w = g < T.merge ? 0 : mergeW(i, g);
    if (w <= 0) return { x: b.p[0], y: b.p[1], t: 1, op: b.op };
    const c = crowdPos(i, g);
    return { x: b.p[0] + (c[0] - b.p[0]) * w, y: b.p[1] + (c[1] - b.p[1]) * w, t: 1, op: b.op };
  });
if (marchAt(T.columns[1]).some((d) => (d.op ?? 1) < 1)) throw new Error("every man must be out of Kuwait on arrival");

// ---------------------------------------------------------------------------
// THE FAN-OUT and the front from Baghdad
// ---------------------------------------------------------------------------
const FRONT_S_END = 1.04;
export const frontScale = (g: number) => FRONT_S_END * easeInOutSine((g - T.front[0]) / (T.front[1] - T.front[0]));
const frontTime = (s: number) => {
  const u = clamp01(s / FRONT_S_END);
  return T.front[0] + ((T.front[1] - T.front[0]) * Math.acos(1 - 2 * u)) / Math.PI;
};
/** where the men end: an organic blue noise (variable spacing, random acceptance radii)
 *  over the whole country, >= 20 world px inside the border */
export const SCATTER_END: P2[] = (() => {
  const r = rng(20030409);
  for (let sc = 1; sc > 0.3; sc *= 0.93) {
    const pts: { p: P2; rad: number }[] = [];
    for (let tries = 0; tries < 40000 && pts.length < N_MEN; tries++) {
      const p: P2 = [IRAQ_BOX.x0 + r() * (IRAQ_BOX.x1 - IRAQ_BOX.x0), IRAQ_BOX.y0 + r() * (IRAQ_BOX.y1 - IRAQ_BOX.y0)];
      if (!inIraq(p[0], p[1])) continue;
      const rad = sc * (30 + 62 * Math.pow(r(), 1.3));
      if (pts.some((o) => Math.hypot(o.p[0] - p[0], o.p[1] - p[1]) < 0.5 * (rad + o.rad))) continue;
      if (Math.hypot(p[0] - BAGHDAD[0], p[1] - BAGHDAD[1]) < 24) continue; // keep the city and its ring clear
      if (borderDist(p) < 20) continue;
      pts.push({ p, rad });
    }
    if (pts.length >= N_MEN) return pts.map((q) => q.p);
  }
  throw new Error("scatter does not fit");
})();
type Fan = { p0: P2; p1: P2; t0: number; t1: number };
export const FAN: Fan[] = (() => {
  const starts = SLOT.map((p) => p);
  const ends = assign(starts, SCATTER_END);
  const rhoOf = (p: P2) => {
    for (let s = 0.01; s <= 1.0001; s += 0.005) {
      const q: P2 = [BAGHDAD[0] + (p[0] - BAGHDAD[0]) / s, BAGHDAD[1] + (p[1] - BAGHDAD[1]) / s];
      if (inIraq(q[0], q[1])) return s;
    }
    return 1;
  };
  return starts.map((p0, i) => {
    const p1 = ends[i];
    const dist = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const dur = Math.max(16, Math.min(44, dist / 15 + 8 + 6 * hash(i, 3)));
    const due = frontTime(rhoOf(p1)) - 2;
    const t0 = Math.max(T.fan + 12 * hash(i, 1), due - dur);
    return { p0, p1, t0, t1: Math.min(522, t0 + dur) };
  });
})();
const fanAt = (g: number): Dot[] =>
  FAN.map((q, i) => {
    const u = easeInOutSine((g - q.t0) / (q.t1 - q.t0));
    const d = drift(i, g);
    return { x: q.p0[0] + (q.p1[0] - q.p0[0]) * u + d[0], y: q.p0[1] + (q.p1[1] - q.p0[1]) * u + d[1], t: 1 };
  });
/** the men at global frame g (index-stable) */
export const dotsAt = (g: number): Dot[] => (g < T.fan ? marchAt(g) : fanAt(g));

// ---------------------------------------------------------------------------
// LABELS
// ---------------------------------------------------------------------------
const IRAQ_LABEL_AT: P2 = [600, 870]; // inside Iraq near its centre (44.4 E 32.65 N); on screen in the Kuwait framing
export const BAGHDAD_LABEL_SIZE = 44;
export const IRAQ_HATCH_OP = 0.45; // Iraq's fill (B4/B5), so the men read on it
export const KUWAIT_HATCH_END = 0.3;

// ---------------------------------------------------------------------------
// THE OVERLAYS (inside a WorldSvg) and the LABELS (screen svgs) at global frame g.
// Split for cut C: ABUnder (land lift, rivers, neighbours' borders, hatches) and
// ABOver (Iraq's border / objective outline, highlights, Baghdad, the men);
// ABOverlays = both. Fade knobs (default = today's look): hatch (multiplier on both
// hatches), men (per-man opacity by index), baghdad (dot + ring), borderOpacity /
// borderWidth (the orange outline once it is solid).
// ---------------------------------------------------------------------------
export type ABFade = {
  hatch?: number;
  men?: (i: number) => number;
  baghdad?: number;
  borderOpacity?: number;
  borderWidth?: number;
};
export const ABUnder: React.FC<{ g: number; cam: Cam; fade?: ABFade }> = ({ g, cam, fade = {} }) => {
  const k = cam.k;
  const hm = fade.hatch ?? 1;
  const kFront = g < T.kuwaitFront[0] ? null : g <= T.kuwaitFront[1] + 1 ? kuwaitFrontDist(g, k) : null;
  const kOp = g < T.kuwaitFront[0] ? 0 : 1 - (1 - KUWAIT_HATCH_END) * smoothstep((g - T.kuwaitRecede[0]) / (T.kuwaitRecede[1] - T.kuwaitRecede[0]));
  const fs = frontScale(g);
  return (
    <>
      <IraqLand cam={cam} />
      <Rivers cam={cam} />
      <DashedBorder d={OTHER_BORDERS_D} cam={cam} />
      {kOp * hm > 0 ? (
        <Hatch id="abKw" d={KUWAIT_D} cam={cam} opacity={kOp * hm} reveal={kFront === null ? undefined : revealHalfPlane(TRIPOINT, FRONT_N, kFront)} feather={6} />
      ) : null}
      {g >= T.front[0] && hm > 0 ? (
        <Hatch id="abIq" d={IRAQ_D} cam={cam} opacity={IRAQ_HATCH_OP * hm} reveal={fs < FRONT_S_END - 1e-4 ? revealScaled(IRAQ_RING, BAGHDAD, fs) : undefined} feather={6} />
      ) : null}
    </>
  );
};
export const ABOver: React.FC<{ g: number; cam: Cam; fade?: ABFade }> = ({ g, cam, fade = {} }) => {
  const lit = smoothstep((g - T.kuwaitLight[0]) / (T.kuwaitLight[1] - T.kuwaitLight[0]));
  const started = g > T.heads[0];
  const eH = started ? eastHead(g) : IRAQ_SEG.kuwait.s1;
  const wH = started ? westHead(g) : LEN;
  const solid = smoothstep((g - T.solid[0]) / (T.solid[1] - T.solid[0]));
  const bOp = fade.borderOpacity ?? 1;
  const bW = fade.borderWidth ?? W_OBJ;
  const hlU = (g - T.outlineHL[0]) / (T.outlineHL[1] - T.outlineHL[0]);
  const hlOp = hlU > 0 && hlU < 1 ? 0.5 * Math.sin(Math.PI * hlU) : 0;
  const rU = (g - T.ringHL[0]) / (T.ringHL[1] - T.ringHL[0]);
  const rOp = rU > 0 && rU < 1 ? 0.5 * smoothstep(rU / 0.15) * smoothstep((1 - rU) / 0.15) : 0;
  const bg = fade.baghdad ?? 1;
  const men = g >= T.columns[0] ? dotsAt(g) : [];
  const menF = fade.men;
  return (
    <>
      {/* Iraq's border: cream where the orange has not reached */}
      <IraqBorder cam={cam} s0={0} s1={IRAQ_SEG.kuwait.s1} opacity={1 - lit} />
      {wH - eH > 0.5 ? <IraqBorder cam={cam} s0={eH} s1={wH} /> : null}
      {/* the Kuwait segment, lit */}
      <RouteLine route={IRAQ_ROUTE} cam={cam} s0={0} s1={IRAQ_SEG.kuwait.s1} opacity={lit * bOp} width={bW} />
      {/* the dashed objective round the whole country */}
      {started ? (
        <>
          <RouteLine route={IRAQ_ROUTE} cam={cam} s0={IRAQ_SEG.kuwait.s1} s1={eH} dash={solid} width={bW} dashBase={DASH_OBJ} opacity={bOp} />
          <RouteLine route={IRAQ_ROUTE} cam={cam} s0={wH} s1={LEN} dash={solid} width={bW} dashBase={DASH_OBJ} opacity={bOp} />
        </>
      ) : null}
      {hlOp > 0 ? <Highlight cam={cam} route={IRAQ_ROUTE} s={MEET - 520 * hlU} len={110} opacity={hlOp} width={W_OBJ + 1.4} /> : null}
      {/* Baghdad */}
      <CityDot x={BAGHDAD[0]} y={BAGHDAD[1]} cam={cam} opacity={bg * smoothstep((g - T.baghdadDot[0]) / (T.baghdadDot[1] - T.baghdadDot[0]))} />
      <Ring x={BAGHDAD[0]} y={BAGHDAD[1]} cam={cam} r={RING_R} opacity={bg} progress={easeInOutSine((g - T.ring[0]) / (T.ring[1] - T.ring[0]))} />
      {rOp * bg > 0 ? <Highlight cam={cam} ring={{ x: BAGHDAD[0], y: BAGHDAD[1], r: RING_R }} s={rU * 1.2} len={26} opacity={rOp * bg} width={3.6} /> : null}
      {/* the men */}
      {men.length ? <Dots dots={menF ? men.map((d, i) => ({ ...d, op: (d.op ?? 1) * menF(i) })) : men} cam={cam} /> : null}
    </>
  );
};
export const ABOverlays: React.FC<{ g: number; cam: Cam; fade?: ABFade }> = ({ g, cam, fade }) => (
  <>
    <ABUnder g={g} cam={cam} fade={fade} />
    <ABOver g={g} cam={cam} fade={fade} />
  </>
);
export const ABLabels: React.FC<{ g: number; cam: Cam; baghdadOpacity?: number }> = ({ g, cam, baghdadOpacity = 1 }) => {
  const iraqOp =
    (1 - (1 - RUNG.mid) * smoothstep((g - T.iraqDim[0]) / (T.iraqDim[1] - T.iraqDim[0]))) * (1 - smoothstep((g - T.iraqOut[0]) / (T.iraqOut[1] - T.iraqOut[0])));
  return (
    <>
      {iraqOp > 0.002 ? (
        <Label text="IRAQ" x={IRAQ_LABEL_AT[0]} y={IRAQ_LABEL_AT[1]} cam={cam} frame={g} f0={T.iraqLabel} size={64} spacing={0.5} dy={22} opacity={iraqOp} />
      ) : null}
      <Label
        text="Baghdad"
        font="roman"
        x={BAGHDAD[0]}
        y={BAGHDAD[1]}
        cam={cam}
        frame={g}
        f0={T.baghdadLabel}
        size={BAGHDAD_LABEL_SIZE}
        dy={-RING_R - 12}
        opacity={baghdadOpacity}
      />
    </>
  );
};
/** the whole page at global frame g (any g >= 12; past g598 = the B_END state) */
export const IraqABScene: React.FC<{ g: number; vignette?: number; cam?: Cam }> = ({ g, vignette = 0.55, cam }) => {
  const c = cam ?? camShownAB(g);
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={c} />
      <WorldSvg cam={c}>
        <ABOverlays g={g} cam={c} />
      </WorldSvg>
      <ABLabels g={g} cam={c} />
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};
/** THE B_END CONTRACT for cut C: the state at g598 (and later) */
export const B_END = {
  g: B_END_G,
  cam: camAB(B_END_G),
  camVel: (() => {
    const a = camAB(B_END_G - 0.5);
    const b = camAB(B_END_G + 0.5);
    return { lnk: Math.log(b.k) - Math.log(a.k), cx: b.cx - a.cx, cy: b.cy - a.cy };
  })(),
  camRest: camAB(700),
};
