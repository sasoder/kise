import React from "react";
import { iconShadow, makeTone } from "./fieldShared";
import { HIGHLIGHT, arriveEase } from "./levelUp";
import {
  ACCENT,
  AXIS_END,
  AXIS_X0,
  BRACKET_X,
  DATA_W,
  DOT_R,
  FRAME_H,
  FRAME_W,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  JOIN_34,
  LEN_P10,
  LEN_P7Z,
  LEN_P15,
  LEN_P7S,
  LEN_P8,
  LINE0,
  P10,
  P15,
  P7S,
  P7Z,
  P8,
  cameraTrack,
  camEq,
  clamp01,
  enterU,
  lookOf,
  pathD,
  pathPoint,
  pathTangent,
  rungEase,
  smoothstep,
  sz,
  tipAt,
  tipLen,
  toScreen,
  wordOn,
  yOf,
} from "./chinaGrowthGeom";
import type { Cam, Glide, Pt } from "./chinaGrowthGeom";
import { DashedPath, HatchFill, HeadLedPath, Label, Ring, labelCapH } from "./chinaGrowthShared";

// ---------------------------------------------------------------------------
// chinaGrowthSeg4 — builder C's layer and camera for cut 4, TrulyDramatic,
// S 829-1087: "But, you know, going from seven to maybe one and a half is like
// a truly dramatic thing for the Chinese and global economy."
// The gesture list (word -> S frames) is in TrulyDramatic.tsx's header.
//
// ONE MOTION: the camera rises to the stretch of the line where it fell from
// 7 % to 1.5 %, measures that fall (ring, level line, bracket, ring), fills
// the gap, and pulls all the way back to the whole arc while a highlight runs
// the line from its start to the tip.
//
// Everything is a function of the story clock S. The layer draws nothing
// before its first gesture (S 865); camSeg4(829) === JOIN_34 exactly.
// ---------------------------------------------------------------------------

const W = (w: string) => wordOn("TrulyDramatic", w);
export const S_IN = 829;
export const S_OUT = 1087;

// --- the schedule (S frames) ---------------------------------------------------
/** Ring sweeps: B's material and timing (12 f, arriveEase tail 0.15). */
export const RING_F = 12;
const RING_TAIL = 0.15;
/** "seven" (873.4): the ring round P7S, "7%" lands on the word. */
export const RING7_S0 = 865;
export const LAND7 = W("seven");
/** "to maybe" (889.7-916.1): the 7 % level line, P7S -> BRACKET_X. */
export const LEVEL_S0 = 880;
export const LEVEL_S1 = 908;
/** The bracket leaves the level line's end and traces the fall to 1.5 %.
 *  26 f, not 20: 550 world px at k ~1.45 must stay under 45 screen px/f. */
export const BR_S0 = 904;
export const BR_S1 = 930;
/** "one" (916.1): the ring round P15; its connector reaches the bracket's foot
 *  as the bracket lands; "1.5%" lands with the bracket, on "half" (927.6). */
export const RING15_S0 = 913;
export const CONN_S0 = 920;
export const CONN_S1 = BR_S1;
export const LAND15 = BR_S1 - 1;
/** "dramatic" (972.7): the wedge the line fell through fills, ONE top-down wipe
 *  from 7 % to 1.5 %; the level line and connector recede to INK_LO as it
 *  lands. The cut's one click. */
export const FILL_S0 = 958;
export const FILL_S1 = 988;
export const RECEDE_S0 = FILL_S1 - 4;
/** "global economy" (1045.2-1072.6): the highlight runs the line. It starts on
 *  the first frame the line's start sits >= HL_IN_PX inside the frame (solved
 *  off the camera below), lands on the tip at HL_S1 and has faded by HL_OUT. */
const HL_IN_PX = 60;
export const HL_S1 = 1080;
export const HL_FADE_S0 = 1078;
export const HL_OUT = 1086;

// --- geometry (world px at K_REF, through sz(k)) -----------------------------
/** The marker ring round a point on the line: B's radius (clears DOT_R 11.5). */
export const RING_R = 26;
/** Half the bracket's end caps. */
export const CAP_HALF = 18;
/** Ring edge / cap end -> a label's caps, and the level line -> "7%"'s caps. */
const LABEL_GAP = 10;
const LEVEL_LABEL_GAP = 12;
/** A dashed line starts this far outside its ring. */
const RING_CLEAR = 3;
export const Y7 = yOf(7.0);
export const Y15 = yOf(1.5);
/** The highlight: a soft segment, ACCENT -> HIGHLIGHT -> ACCENT along its length:
 *  a HIGHLIGHT core over the middle HL_CORE of it, easing to ACCENT at both ends.
 *  140 world px, not 120: at the wide shot's k 0.6 a 120 px cosine bell left ~22
 *  screen px near HIGHLIGHT on a 6 px line and did not read at half size. */
export const HL_HALF = 70;
const HL_CORE = 0.45;

// --- eases -----------------------------------------------------------------------
/** A head that leaves from rest, cruises and lands: its speed ramps in on a
 *  smoothstep over the first `a` of the time, holds, and arrives on an
 *  ease-out cubic over the last `b`. C1, monotone, 0 -> 1. */
const headVmax = (a: number, b: number) => 1 / (1 - a / 2 - (2 * b) / 3);
export const headEase = (u: number, a = 0.12, b = 0.3) => {
  const t = clamp01(u);
  const vm = headVmax(a, b);
  if (a > 0 && t <= a) {
    const x = t / a;
    return vm * a * (x * x * x - (x * x * x * x) / 2);
  }
  if (t <= 1 - b) return vm * (a / 2 + (t - a));
  const s = (t - (1 - b)) / b;
  return vm * (a / 2 + (1 - a - b) + (b / 3) * (1 - Math.pow(1 - s, 3)));
};
const prog = (S: number, s0: number, s1: number) => clamp01((S - s0) / (s1 - s0));

// --- the camera --------------------------------------------------------------------
// A list of glides (A's rig) written as absolute LOOKS (content centre) + k;
// each becomes a delta from the one before, so retuning one waypoint never
// moves the ones after it. Track frame f = S - S_IN.
type Way = { f0: number; f1: number; x: number; y: number; k: number; warp?: number; even?: number };

/** The whole chart's world box at k (line start, axis end, "10%" caps top,
 *  the tip's dot): the final framing's content. */
export const chartBox = (k: number) => {
  const s = sz(k);
  const capV = labelCapH("value", k);
  return {
    x0: Math.min(AXIS_X0 - (INK_W * s) / 2, LINE0.x - (DATA_W * s) / 2),
    x1: AXIS_END + (INK_W * s) / 2,
    y0: P10.y - (12 + DOT_R) * s - capV,
    y1: yOf(-1.45) + DOT_R * s,
  };
};
/** The last frame's zoom: the whole chart inside x 60-1020 with the sway (3 px). */
export const K_FINAL = (() => {
  let k = 0.6;
  for (let i = 0; i < 6; i++) {
    const b = chartBox(k);
    k = (480 - 3) / ((b.x1 - b.x0) / 2);
  }
  return k;
})();
const BOX_END = chartBox(K_FINAL);
/** The whole chart's centre: the final look. */
export const LOOK_END = { x: (BOX_END.x0 + BOX_END.x1) / 2, y: (BOX_END.y0 + BOX_END.y1) / 2 };
/** The pull-back lands a breath wider than the last frame; the tail pushes back in. */
export const K_LAND = K_FINAL / 1.035;

/** The tail's push back in starts once the pull-back has landed (its
 *  acceleration would otherwise add to the landing's deceleration) and runs
 *  past the cut, so the last frame is still moving. */
const TAIL_S0 = 1048;
const TAIL_S1 = 1104;
const START: Cam = lookOf(JOIN_34); // (1440, yOf(0.2)) at k 1.30
/** The measured gap's framing: P7S's ring to "1.5%" inside x 60-1020 at the
 *  push's deepest k (1.60), centred on the gap. */
const GAP_LOOK = { x: 1132, y: 1572 };
/** The first glide lands DRIFT_PX short of GAP_LOOK along its own direction, so
 *  the hold-drift that follows continues it instead of turning. */
const DRIFT_PX = 22;
const G1_LAND = (() => {
  const dx = GAP_LOOK.x - START.x;
  const dy = GAP_LOOK.y - START.y;
  const L = Math.hypot(dx, dy);
  return { x: GAP_LOOK.x - (dx / L) * DRIFT_PX, y: GAP_LOOK.y - (dy / L) * DRIFT_PX };
})();
const waysWith = (kTail: number): Way[] => [
  // "But, you know, going from": up the slide to where it fell, landing ~5 f before "seven"
  { f0: 829, f1: 864, x: G1_LAND.x, y: G1_LAND.y, k: 1.4, warp: 0.95 },
  // the hold-drift: the same direction, decaying
  { f0: 850, f1: 900, x: GAP_LOOK.x, y: GAP_LOOK.y, k: 1.42 },
  // "to maybe one and a half is like a truly dramatic thing": ONE long even
  // creep in on the gap (a trapezoid: ramps in under the level line, cruises
  // through the bracket, decelerates through the fill and decays to the held
  // breath before the release)
  { f0: 870, f1: 998, x: GAP_LOOK.x, y: GAP_LOOK.y, k: 1.6, even: 0.42 },
  // "for the Chinese and global economy.": all the way back to the whole arc,
  // early enough that the line's start is in frame for the highlight (~S 1045)
  { f0: 994, f1: 1046, x: LOOK_END.x, y: LOOK_END.y, k: K_LAND, warp: 0.95 },
  // tail: a slow push back in, still moving on the last frame
  { f0: TAIL_S0, f1: TAIL_S1, x: LOOK_END.x, y: LOOK_END.y, k: kTail },
];
const glidesOf = (ways: Way[]): Glide[] => {
  let prev = { x: START.x, y: START.y };
  return ways.map((w) => {
    const g: Glide = {
      f0: w.f0 - S_IN,
      f1: w.f1 - S_IN,
      dx: w.x - prev.x,
      dy: w.y - prev.y,
      k: w.k,
      warp: w.warp,
      even: w.even,
    };
    prev = { x: w.x, y: w.y };
    return g;
  });
};
const FRAMES = S_OUT - S_IN + 2;
const trackWith = (kTail: number) => cameraTrack(START, glidesOf(waysWith(kTail)), FRAMES);
/** The tail's target, solved so the last frame sits exactly at K_FINAL. */
export const K_TAIL = (() => {
  let lo = K_LAND;
  let hi = K_FINAL * 1.3;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (trackWith(mid)[S_OUT - S_IN].k < K_FINAL) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();
export const WAYS_4 = waysWith(K_TAIL);
export const GLIDES_4 = glidesOf(WAYS_4);
export const CAM_SEG4_TRACK: Cam[] = trackWith(K_TAIL);

/** The camera for S 829-1087 (camera centre + zoom; fractional S interpolates). */
export const camSeg4 = (S: number): Cam => {
  const t = Math.max(0, Math.min(CAM_SEG4_TRACK.length - 1, S - S_IN));
  const i = Math.min(CAM_SEG4_TRACK.length - 2, Math.floor(t));
  const u = t - i;
  const a = CAM_SEG4_TRACK[i];
  const b = CAM_SEG4_TRACK[i + 1];
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, k: a.k + (b.k - a.k) * u };
};
if (!camEq(camSeg4(S_IN), JOIN_34)) {
  throw new Error(`chinaGrowthSeg4: camSeg4(829) ${JSON.stringify(camSeg4(S_IN))} != JOIN_34`);
}

// --- the highlight -----------------------------------------------------------------
// Its centre's arc length, tabled per frame by a governor. It starts on the
// first frame the line's start is HL_IN_PX inside the frame (never off-frame),
// runs at V screen px/f relative to the line on hlProfile, and wherever the
// camera's own motion already moves the line on screen it slows so the TOTAL
// screen speed stays under HL_CAP. V is solved so it lands on the tip at
// HL_S1; then it rides the tip while it fades (HL_FADE_S0 -> HL_OUT).
const HL_CAP = 44;
/** It is governed from this far outside the frame, so it never crosses the edge fast. */
const HL_MARGIN = 160;
/** Its speed profile over its run (u 0..1): eases in over the first HL_A, cruises,
 *  arrives onto the tip on an ease-out over the last HL_B. */
const HL_A = 0.06;
const HL_B = 0.15;
const hlProfile = (u: number) => {
  if (u < HL_A) return smoothstep(u / HL_A);
  if (u <= 1 - HL_B) return 1;
  const s = clamp01((u - (1 - HL_B)) / HL_B);
  return (1 - s) * (1 - s);
};
/** The first frame the line's start sits >= HL_IN_PX inside the frame. */
export const HL_S0 = (() => {
  for (let S = 1000; S < HL_S1 - 20; S++) {
    if (toScreen(camSeg4(S), LINE0.x, LINE0.y).x >= HL_IN_PX) return S;
  }
  throw new Error("chinaGrowthSeg4: the line's start never comes into frame");
})();
/** The segment's centre starts half a segment-half before LINE0, so it slides
 *  onto the line's start as it fades in. */
const HL_H0 = -HL_HALF / 2;
const hlRun = (V: number): number[] => {
  const out = [HL_H0];
  let h = HL_H0;
  const n = HL_S1 - HL_S0;
  for (let i = 0; i < n; i++) {
    const S = HL_S0 + i;
    const c0 = camSeg4(S);
    const c1 = camSeg4(S + 1);
    const hc = Math.max(0, h);
    const p = pathPoint(hc);
    const a = toScreen(c0, p.x, p.y);
    const b = toScreen(c1, p.x, p.y);
    const v = { x: b.x - a.x, y: b.y - a.y };
    const t = pathTangent(hc);
    const tv = t.x * v.x + t.y * v.y;
    const disc = tv * tv - (v.x * v.x + v.y * v.y) + HL_CAP * HL_CAP;
    const dMax = disc > 0 ? Math.max(0, -tv + Math.sqrt(disc)) : 0;
    const M = HL_MARGIN;
    const onScreen = a.x > -M && a.x < FRAME_W + M && a.y > -M && a.y < FRAME_H + M;
    const want = V * hlProfile((i + 0.5) / n);
    const D = onScreen ? Math.min(want, dMax) : want;
    h += D / c1.k;
    out.push(h);
  }
  return out;
};
export const HL_V = (() => {
  const target = tipLen(HL_S1);
  let lo = 1;
  let hi = 400;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const r = hlRun(mid);
    if (r[r.length - 1] < target) lo = mid;
    else hi = mid;
  }
  const v = (lo + hi) / 2;
  const end = hlRun(v);
  if (Math.abs(end[end.length - 1] - target) > 1) {
    throw new Error(`chinaGrowthSeg4: the highlight cannot reach the tip by S ${HL_S1} under ${HL_CAP} px/f`);
  }
  return v;
})();
const HL_TABLE: number[] = (() => {
  const r = hlRun(HL_V);
  r[r.length - 1] = tipLen(HL_S1);
  return r;
})();
/** The highlight at S: centre arc length and intensity (0 = not drawn). */
export const highlightAt = (S: number): { h: number; I: number } => {
  if (S <= HL_S0) return { h: HL_TABLE[0], I: 0 };
  const I = smoothstep((S - HL_S0) / 4) * (1 - smoothstep((S - HL_FADE_S0) / (HL_OUT - HL_FADE_S0)));
  if (S >= HL_S1) return { h: tipLen(S), I };
  const t = S - HL_S0;
  const i = Math.min(HL_TABLE.length - 2, Math.floor(t));
  const u = t - i;
  return { h: HL_TABLE[i] + (HL_TABLE[i + 1] - HL_TABLE[i]) * u, I };
};
const TONE = makeTone(ACCENT, HIGHLIGHT);
/** The soft profile along the segment (d in -1..1): 1 over the core, easing to 0
 *  at +-HL_HALF. */
const bell = (d: number) => smoothstep((1 - Math.abs(d)) / (1 - HL_CORE));

// --- the layer's state at S (exported for the probes) ---------------------------------
export const seg4State = (S: number) => {
  const ring7 = arriveEase(prog(S, RING7_S0, RING7_S0 + RING_F), RING_TAIL);
  const level = headEase(prog(S, LEVEL_S0, LEVEL_S1), 0.12, 0.3);
  const br = headEase(prog(S, BR_S0, BR_S1), 0.15, 0.3);
  const ring15 = arriveEase(prog(S, RING15_S0, RING15_S0 + RING_F), RING_TAIL);
  const conn = headEase(prog(S, CONN_S0, CONN_S1), 0.2, 0.35);
  const fill = headEase(prog(S, FILL_S0, FILL_S1), 0.15, 0.2);
  const recede = INK_HI - (INK_HI - INK_LO) * rungEase(S, RECEDE_S0);
  return { ring7, level, br, ring15, conn, fill, recede };
};

/** Where the two numbers sit at camera k (anchor "start", y = caps centre). */
export const label7At = (k: number) => {
  const s = sz(k);
  return { x: P7S.x + (RING_R + LABEL_GAP) * s, y: Y7 - (INK_W / 2 + LEVEL_LABEL_GAP) * s - labelCapH("value", k) / 2 };
};
export const label15At = (k: number) => {
  const s = sz(k);
  return { x: BRACKET_X + (CAP_HALF + LABEL_GAP) * s, y: Y15 };
};

// --- the gap: the wedge the line fell through ---------------------------------------
// Closed by the 7 % level line (top), the bracket (right), the connector
// (bottom) and the orange line itself from P15 back up to P7S (the curved left
// edge). Every edge is inset by half its own stroke + 2 screen px, and the two
// ring discs are cut out, so the hatch never paints over a line or a ring.
const WEDGE_STEP = 2; // world px of arc between curve samples
const arcPts = (c: Pt, r: number, a0: number, a1: number): Pt[] => {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.12));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return out;
};
/** The wedge at camera k, as a closed polygon (world px). */
export const wedgeAt = (k: number): Pt[] => {
  const s = sz(k);
  const gap = 2 / k;
  const inLine = (DATA_W * s) / 2 + gap;
  const inInk = (INK_W * s) / 2 + gap;
  const rc = (RING_R + INK_W / 2) * s + gap;
  const yTop = Y7 + inInk;
  const yBot = Y15 - inInk;
  const xRight = BRACKET_X - inInk;
  // the curved edge, offset toward the wedge (the line runs down-right, so the
  // inside is on its upper-right normal)
  const curve: Pt[] = [];
  for (let len = LEN_P7S; len <= LEN_P15; len += WEDGE_STEP) {
    const p = pathPoint(len);
    const t = pathTangent(len);
    curve.push({ x: p.x + t.y * inLine, y: p.y - t.x * inLine });
  }
  // trim it where it leaves P7S's ring disc and where it enters P15's
  const d7 = (q: Pt) => Math.hypot(q.x - P7S.x, q.y - P7S.y) - rc;
  const d15 = (q: Pt) => Math.hypot(q.x - P15.x, q.y - P15.y) - rc;
  const cross = (a: Pt, b: Pt, fa: number, fb: number): Pt => {
    const u = fa / (fa - fb);
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  };
  let i0 = 0;
  while (i0 < curve.length - 1 && d7(curve[i0]) < 0) i0++;
  let i1 = curve.length - 1;
  while (i1 > i0 && d15(curve[i1]) < 0) i1--;
  const c0 = i0 > 0 ? cross(curve[i0 - 1], curve[i0], d7(curve[i0 - 1]), d7(curve[i0])) : curve[0];
  const c1 = i1 < curve.length - 1 ? cross(curve[i1], curve[i1 + 1], d15(curve[i1]), d15(curve[i1 + 1])) : curve[curve.length - 1];
  // where the ring circles meet the top and bottom edges
  const topX = P7S.x + Math.sqrt(Math.max(0, rc * rc - (yTop - Y7) ** 2));
  const botX = P15.x + Math.sqrt(Math.max(0, rc * rc - (Y15 - yBot) ** 2));
  const ang = (c: Pt, q: Pt) => Math.atan2(q.y - c.y, q.x - c.x);
  return [
    { x: xRight, y: yTop },
    { x: topX, y: yTop },
    ...arcPts(P7S, rc, ang(P7S, { x: topX, y: yTop }), ang(P7S, c0)).slice(1, -1),
    c0,
    ...curve.slice(i0, i1 + 1),
    c1,
    ...arcPts(P15, rc, ang(P15, c1), ang(P15, { x: botX, y: yBot })).slice(1, -1),
    { x: botX, y: yBot },
    { x: xRight, y: yBot },
  ];
};
/** The polygon clipped to y <= yMax (Sutherland-Hodgman, one edge): the wipe. */
const clipAbove = (poly: Pt[], yMax: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ina = a.y <= yMax;
    const inb = b.y <= yMax;
    if (ina) out.push(a);
    if (ina !== inb) {
      const u = (yMax - a.y) / (b.y - a.y);
      out.push({ x: a.x + (b.x - a.x) * u, y: yMax });
    }
  }
  return out;
};

const Cap: React.FC<{ x: number; y: number; k: number; grow: number }> = ({ x, y, k, grow }) => {
  const g = clamp01(grow);
  if (g <= 0.001) return null;
  const h = CAP_HALF * sz(k) * (1 - Math.pow(1 - g, 3));
  return (
    <line
      x1={(x - h).toFixed(3)}
      y1={y.toFixed(3)}
      x2={(x + h).toFixed(3)}
      y2={y.toFixed(3)}
      stroke={INK}
      strokeWidth={(INK_W * sz(k)).toFixed(3)}
      strokeLinecap="round"
    />
  );
};

export const Seg4Layer: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  if (S < RING7_S0) return null;
  const k = cam.k;
  const s = sz(k);
  const st = seg4State(S);
  const out: React.ReactNode[] = [];

  // -- the highlight: under every white mark, over the orange line --
  const hl = highlightAt(S);
  if (hl.I > 0.002) {
    const L = tipLen(S);
    const a = Math.max(0, hl.h - HL_HALF);
    const b = Math.min(L, hl.h + HL_HALF);
    const hc = Math.max(0, Math.min(L, hl.h));
    const c0 = pathPoint(hc);
    const tg = pathTangent(hc);
    const c: Pt = { x: c0.x + tg.x * (hl.h - hc), y: c0.y + tg.y * (hl.h - hc) };
    const stops: React.ReactNode[] = [];
    for (let i = 0; i <= 12; i++) {
      const off = i / 12;
      stops.push(<stop key={i} offset={off.toFixed(4)} stopColor={TONE(hl.I * bell(2 * off - 1))} />);
    }
    const dots: React.ReactNode[] = [];
    const vtx: [number, Pt][] = [
      [LEN_P10, P10],
      [LEN_P7Z, P7Z],
      [LEN_P8, P8],
    ];
    const tip = tipAt(S);
    vtx.push([tip.len, tip]);
    for (const [len, p] of vtx) {
      const t = hl.I * bell((len - hl.h) / HL_HALF);
      if (t > 0.01 && len <= L + 0.5) {
        dots.push(<circle key={len} cx={p.x.toFixed(3)} cy={p.y.toFixed(3)} r={(DOT_R * s).toFixed(3)} fill={TONE(t)} />);
      }
    }
    out.push(
      <g key="hl">
        <defs>
          <linearGradient
            id="cg4-hl"
            gradientUnits="userSpaceOnUse"
            x1={(c.x - tg.x * HL_HALF).toFixed(3)}
            y1={(c.y - tg.y * HL_HALF).toFixed(3)}
            x2={(c.x + tg.x * HL_HALF).toFixed(3)}
            y2={(c.y + tg.y * HL_HALF).toFixed(3)}
          >
            {stops}
          </linearGradient>
        </defs>
        {b - a > 0.5 ? (
          <path
            d={pathD(a, b)}
            fill="none"
            stroke="url(#cg4-hl)"
            strokeWidth={(DATA_W * s).toFixed(3)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {dots}
      </g>,
    );
  }

  // -- the gap: the wedge the line fell through, ONE top-down wipe --
  if (st.fill > 0.0005) {
    const region = clipAbove(wedgeAt(k), Y7 + (Y15 - Y7) * st.fill);
    if (region.length >= 3) {
      out.push(
        <HatchFill
          key="gap"
          id="cg4-gap"
          region={region}
          k={k}
          color={INK}
          rung={INK_LO}
          anchor={{ x: BRACKET_X, y: Y7 }}
        />,
      );
    }
  }

  // -- the 7 % level line: from P7S's ring along 7 % to the bracket --
  if (st.level > 0.0005) {
    const x0 = P7S.x + (RING_R + RING_CLEAR) * s;
    out.push(
      <DashedPath
        key="level"
        points={[
          { x: x0, y: Y7 },
          { x: BRACKET_X, y: Y7 },
        ]}
        k={k}
        S={S}
        draw={st.level}
        rung={st.recede}
        headIn={0.1}
        headOut={0.12}
      />,
    );
  }

  // -- the connector: P15's ring -> the bracket's foot --
  if (st.conn > 0.0005) {
    const x0 = P15.x + (RING_R + RING_CLEAR) * s;
    out.push(
      <DashedPath
        key="conn"
        points={[
          { x: x0, y: Y15 },
          { x: BRACKET_X, y: Y15 },
        ]}
        k={k}
        S={S}
        draw={st.conn}
        rung={st.recede}
        headIn={0.15}
        headOut={0.2}
      />,
    );
  }

  // -- the bracket: down from the level line's end to 1.5 %, end caps --
  if (st.br > 0.0005) {
    const capTop = prog(S, BR_S0, BR_S0 + 6);
    const capBot = clamp01((st.br - 0.955) / 0.045);
    out.push(
      <g key="bracket">
        <HeadLedPath
          points={[
            { x: BRACKET_X, y: Y7 },
            { x: BRACKET_X, y: Y15 },
          ]}
          k={k}
          draw={st.br}
          rung={INK_HI}
          headIn={0.06}
          headOut={0.1}
        />
        <g style={{ filter: iconShadow(k) }}>
          <Cap x={BRACKET_X} y={Y7} k={k} grow={capTop} />
          <Cap x={BRACKET_X} y={Y15} k={k} grow={capBot} />
        </g>
      </g>,
    );
  }

  // -- the rings: P7S on "seven", P15 on "one" --
  if (st.ring7 > 0) out.push(<Ring key="r7" x={P7S.x} y={P7S.y} k={k} r={RING_R} draw={st.ring7} rung={INK_HI} />);
  if (st.ring15 > 0) out.push(<Ring key="r15" x={P15.x} y={P15.y} k={k} r={RING_R} draw={st.ring15} rung={INK_HI} />);

  // -- the two numbers: the two ends of the measured fall --
  const l7 = label7At(k);
  const l15 = label15At(k);
  out.push(
    <Label key="l7" text="7%" x={l7.x} y={l7.y} k={k} size="value" anchor="start" appear={enterU(S, LAND7)} />,
    <Label key="l15" text="1.5%" x={l15.x} y={l15.y} k={k} size="value" anchor="start" appear={enterU(S, LAND15)} />,
  );

  return <>{out}</>;
};
