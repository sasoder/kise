import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_LIFT, camMove, clamp01, hash, smoothstep, sway } from "./fieldShared";
import {
  BAR_GAP,
  BAR_H,
  BLACK,
  BLUE,
  ORANGE,
  PURPLE,
  SHADOW,
  STROKE,
  WHITE,
  World,
  runCamera2,
} from "./cottageShared";

export const FPS = 24;
// Clip "anna - elon", the line at 13.00 s on the edit timeline. f0 = 13.00 s;
// frame = round((t - 13.00) * 24). The next graphic (ProxyForIntelligence,
// "his use of the English language...") starts at 19.75 s:
// round((19.75 - 13.00) * 24) = 162 frames, so this cut ends exactly where it
// begins and the editor can butt them together or trim.
export const DURATION = 162;

// ---------------------------------------------------------------------------
// "GOOD SYNTAX" — the establishing shot for the idea of syntax. NO TEXT: no
// letters, labels or numbers anywhere. Loose words fall into order, and the
// hidden structure between them appears.
//
// THE LINE: "As a linguist, I'm completely obsessed with men with good syntax."
// (then "And Elon has an amazing syntax", under the hold).
//
// WORD ONSETS (word-level whisper pass), frame = round((t - 13.00) * 24):
//   As f5 · a f11 · linguist f13-25 · I'm f26 · completely f30 ·
//   obsessed f44-56 · with f56 · men f68-82 · with f82 · good f90 ·
//   syntax f96-108 · And f115 · Elon f121 · amazing f137 · syntax f146-156
//
// HOUSE STYLE: the core memory podcast graphic standard (PeakForSolar). 1080 x
// 1920, 24 fps, OPAQUE. cottageShared's `World`: dimmed, blurred squared paper
// at parallax 0.15, drift -0.3 px/f, 1 + (k - 1) * 0.3 scale. White #FFFFFF
// ink, every white element on a hard #000000 shadow at +4/+4 world px, zero
// blur, drawn as an SVG copy. One stroke weight, 6 world px, on every arch.
// Chain colours raw hex, no bloom/blend/fade; their one job here is ANNA'S
// VERDICT, "good syntax": the crown on the root arch and nowhere else.
//
// THE OBJECTS (world px; at k 1 one world px is one screen px)
//   WORDS   seven cottageShared word-bars (white, BAR_H 28, pill ends), the same
//           object the next cut uses. Lengths 104 54 80 112 60 90 108. Landed:
//           one line, BAR_GAP 20 gaps, x 176..904 (728 wide) centred on 540,
//           bar centres on LINE_Y 981.32 (tops 967.32).
//   SCATTER the open: the seven float in a 687 x 524 cloud (ink x 199..886,
//           y 722..1246) centred on the sentence, tilted -31 -25 -19 -13 +16
//           +22 +28 deg (no two alike), >= 128.9 world px of paper between any
//           two. Chosen by a collision-checked search (scratchpad gs/search.ts):
//           an even ring around the empty middle where the line will form,
//           length-weighted centroid within 22 px of the centre, every bar
//           travels >= 110 px. Each drifts on hashed noise (6-8.5 px per axis,
//           <= 12 px combined, periods 70-130 f) with a +-2 deg sway, each on
//           its own phase.
//   ARCHES  a projective (non-crossing) nested set of seven circular segments
//           over the bar tops, sagitta 0.42 x span, 6 px white strokes on the
//           hard shadow, each running on 8 px below its bar top so the bar's
//           white covers the end:
//             id    bars  feet (world x)   span   height
//             l23   2-3   414 .. 506        92     38.6   local
//             l56   5-6   731 .. 829        98     41.2   local
//             l01   0-1   251 .. 327        76     31.9   local
//             l34   3-4   554 .. 636        82     34.4   local
//             p36   3-6   538 .. 845       307    128.9   phrase
//             p03   0-3   235 .. 522       287    120.5   phrase
//             root  0-6   219 .. 861       642    269.6   ROOT
//           Feet that share a bar sit 16 px apart (10 px of paper between
//           strokes, 6 after the shadow), ordered so nothing crosses: arches
//           arriving from the left inner-first, then arches leaving outer-
//           first. The middle bar is the hinge (l23 p03 | p36 l34); bar 0
//           carries root p03 l01, bar 6 l56 p36 root. The end clusters sit
//           inboard enough that the crown lands on the flat of the bar top.
//   CROWN   on the ROOT only: orange, purple and blue copies of the root sit
//           concentrically behind it at 24 / 16 / 8 px, each the root's stroke
//           widened OUTWARD by its offset (PeakForSolar's crown: each copy is
//           the core made bigger), so at rest the white wears three touching
//           8 px stripes: blue nearest, purple, orange outermost. No shadow on
//           the colours; the white keeps its own. Drawn only along the part of
//           the root that exists.
//   COMPOSITION at rest: crown top 670.68 .. bar-shadow bottom 999.32, centre
//           835.00, on screen y 835 at the resting camera.
//
// THE GESTURES — one continuous evolving picture. Nothing else moves except
// the paper's drift and the camera's hand.
//   1. f0-26 "As a linguist": the scattered words float. Only the drift.
//   2. f26-103 "I'm completely obsessed with men with good syntax": ONE
//      convergence. Each bar leaves its scatter pose on its own clock (starts
//      f31 26 37 29 40 34 28 for bars 0-6) and lands in its slot (f98 101 95
//      92 103 96 99: hashed, never left to right, all on "good syntax"). Path:
//      a quadratic curve bent 3-17 % of its travel; tilt unwinds to 0 on the
//      same clock; the drift fades with (1 - e). Clock: smoothstep (ease-in-out;
//      the arrival is an ease-out with no overshoot). Bars are still visibly
//      travelling (>= 2 px/f) until ~6 f before landing, 92 % there 12 f out;
//      peak 6.6 world px/f. Measured every 0.25 f: never less than 19.7 world
//      px of paper between any two inks (bars 1/2 at f93.5, neighbours
//      closing to their 20 px gap). Residual 0.3-0.8 px two frames before each
//      landing, exactly 0 on it.
//   3. f100-118 "syntax": the arches draw on, each a stroke growing from its
//      left foot to its right foot (shadow in step, round cap on the tip) on
//      bezier(0.4, 0, 0.2, 1), one clock 1.4 f apart, small to big: l23 f100,
//      l56 f101.4, l01 f102.8, l34 f104.2 (8 f each), p36 f105.6, p03 f107
//      (9 f), root f108.4-118.4 (10 f). Each starts only after both its bars
//      have landed.
//   4. f116-142 "good" (the verdict): the crown rises from behind the root as
//      it completes: orange f116, purple f118, blue f120, each easing its
//      offset from 0 on bezier(0.16, 1, 0.3, 1) over 22 f (rest f138 / 140 /
//      142). The first colour shows at f118 on a complete arch. The cut's
//      only colour.
//   5. f142-161 "and Elon has an amazing syntax": HOLD. The sentence and the
//      arches are perfectly still; the camera creeps, the paper drifts.
//
// THE CAMERA — `camMove` curves (a key per frame; cy from the eased content
// centre + CAM_LIFT / k, so a content centre sits on screen y 835), damped by
// cottageShared's runCamera2, with fieldShared's hand sway on top. cx 540.
//   OPEN   f0        k 1.12, the scatter cloud's centre (983.84) on 835.
//   PUSH   f20-80    k 1.12 -> 1.22, centre -> the line (983.32), warp 1: the
//                    held breath of "completely obsessed", 0.21 %/f at most.
//   PULL   f84-118   k 1.22 -> 1.00, centre -> 835 (the line plus arches),
//                    warp 0.85: pulls back and tilts up as the arches rise,
//                    landing as the root completes.
//   CREEP  f124-161  k 1.00 -> 1.02 (still creeping on the last frame).
//   DAMPED (no sway):   f     k        cx       cy
//                       0     1.1200   540.00   1095.45
//                       26    1.1208   540.00   1095.36
//                       56    1.1745   540.00   1089.99
//                       90    1.2103   540.00   1080.08
//                       104   1.1034   540.00   1018.09
//                       124   1.0011   540.00    960.61
//                       161   1.0190   540.00    957.67
//   Zoom speed peaks at 0.21 %/f in the push and 0.81 %/f in the pull (f104);
//   under 0.06 %/f from f124. One acceleration and one settle lobe per move.
//
// FRAMING (measured every frame, sway included): all ink inside screen x
// 92.7 (f76) .. 989.2 (f87), y 537.7 (f28) .. 1140.8 (f38): nothing near the
// caption band (the gate is 1400). Ink centre on screen y 835 at f0, 833 at
// f124, 831 at f161 (the creep scales about the frame centre). At 270 px wide
// the scatter reads as loose tiles and the rest as a line under arches and a
// rainbow.
//
// DEVIATIONS from the brief, and why.
//   * PUSH TO k 1.22, NOT ~1.28. The line is 728 wide, and it is nearly formed
//     at the top of the push; at 1.28 its ink reached screen x 78..1010 at f85,
//     edge to edge. At 1.22 it keeps >= 91 px of margin.
//   * ARCH CLOCK 1.4 f APART, NOT ~3 f; THE ROOT COMPLETES AT f118, NOT ~f124.
//     Seven arches 3 f apart from f100 put the root's start at f118, after the
//     crown's fixed f116 start, so the crown would rise on an undrawn root. A
//     2 f clock was rendered: a lone orange fringe trailed the root's pen at
//     f118. On the 1.4 f clock the order still reads small to big, and the
//     crown rises on a complete arch.
//   * THE CROWN IS THREE TOUCHING 8 px STRIPES, the root's stroke widened by
//     8 / 16 / 24, rather than three 6 px strokes at those offsets. Both were
//     rendered side by side: the literal version leaves 2 px slivers between
//     colours (paper on the left leg, the white's black shadow on the right)
//     and at 270 px wide mixes into a muddy band. The arches themselves all
//     keep the one 6 px weight.
//   * THE CONVERGENCE CLOCK IS SMOOTHSTEP, not a pure ease-out. With
//     bezier(0.45, 0, 0.2, 1) the line was visibly formed by f80 and nothing
//     landed on "good syntax". Smoothstep's arrival is still an ease-out, with
//     no overshoot.
//   * LANDINGS f92-103, not to f104, so both bars of every local arch have
//     landed before its draw starts on the 1.4 f clock.
//   * THE HAND SWAY stays on the camera, as in PeakForSolar; the sentence and
//     arches are still in world space throughout the hold.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE LINE. Seven word-bars, cottageShared's object: white, BAR_H tall, pill
// ends, BAR_GAP apart, centred on x 540.
// ---------------------------------------------------------------------------
export const CX = 540;
export const BAR_R = BAR_H / 2;
export const LENS = [104, 54, 80, 112, 60, 90, 108];
export const N_BARS = LENS.length;
export const LINE_W = LENS.reduce((a, b) => a + b, 0) + (N_BARS - 1) * BAR_GAP; // 728
export const LINE_X0 = CX - LINE_W / 2; // 176
/** Each bar's slot: left edge, right edge, centre (world x). */
export const SLOT = (() => {
  const out: { x0: number; x1: number; cx: number }[] = [];
  let x = LINE_X0;
  for (const l of LENS) {
    out.push({ x0: x, x1: x + l, cx: x + l / 2 });
    x += l + BAR_GAP;
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE ARCHES — a projective (non-crossing) nested set over the seven bars:
// four local arcs between neighbours, two phrase arcs that meet on the middle
// bar, and the root over the whole line. `at` is the draw-on start frame,
// `dur` its length; one clock 1.4 f apart, small to big.
// ---------------------------------------------------------------------------
export type ArcSpec = { id: string; a: number; b: number; level: 0 | 1 | 2; at: number; dur: number };
export const ARCS: ArcSpec[] = [
  { id: "l23", a: 2, b: 3, level: 0, at: 100, dur: 8 },
  { id: "l56", a: 5, b: 6, level: 0, at: 101.4, dur: 8 },
  { id: "l01", a: 0, b: 1, level: 0, at: 102.8, dur: 8 },
  { id: "l34", a: 3, b: 4, level: 0, at: 104.2, dur: 8 },
  { id: "p36", a: 3, b: 6, level: 1, at: 105.6, dur: 9 },
  { id: "p03", a: 0, b: 3, level: 1, at: 107, dur: 9 },
  { id: "root", a: 0, b: 6, level: 2, at: 108.4, dur: 10 },
];
export const ROOT = ARCS.length - 1;
/** Arch height (sagitta above the bar tops) per unit span. */
export const H_RATIO = 0.42;
/** Centre-to-centre spacing of arch feet that share a bar. */
export const FOOT_PITCH = 16;
/** How far below the bar top an arch's stroke runs, hidden by the bar. */
export const TUCK = 8;

// THE CROWN: three copies of the root, stacked behind it like PeakForSolar's
// peak-bar crown. Each is the root's stroke widened OUTWARD by its offset, so
// at rest the three read as 8 px stripes (blue, purple, orange) outside the
// white with no paper between them.
export const CROWN = [
  { key: "orange", color: ORANGE, off: 24, at: 116 },
  { key: "purple", color: PURPLE, off: 16, at: 118 },
  { key: "blue", color: BLUE, off: 8, at: 120 },
] as const;
export const CROWN_OUT = 24;
export const CROWN_F = 22;
export const EASE_CROWN = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_DRAW = Easing.bezier(0.4, 0, 0.2, 1);

// Feet. On a bar that carries several arch ends, the ends are ordered so no two
// arches cross: arches arriving from the left, inner (short) first; then arches
// leaving to the right, outer (long) first.
const span = (s: ArcSpec) => s.b - s.a;
type FootRef = { arc: number; side: "L" | "R" };
const FEET_ON_BAR: FootRef[][] = (() => {
  const out: FootRef[][] = [];
  for (let j = 0; j < N_BARS; j++) {
    const arriving = ARCS.map((s, i) => ({ s, i }))
      .filter((q) => q.s.b === j)
      .sort((p, q) => span(p.s) - span(q.s))
      .map((q) => ({ arc: q.i, side: "R" as const }));
    const leaving = ARCS.map((s, i) => ({ s, i }))
      .filter((q) => q.s.a === j)
      .sort((p, q) => span(q.s) - span(p.s))
      .map((q) => ({ arc: q.i, side: "L" as const }));
    out.push([...arriving, ...leaving]);
  }
  return out;
})();
// The crown's outer edge must land on the flat part of the end bars' tops (past
// the pill cap), so the root's feet keep this much bar outside them.
const ROOT_FOOT_INSET = BAR_R + CROWN_OUT + STROKE / 2 + 2;
const FOOT_X: number[][] = ARCS.map(() => [0, 0]);
for (let j = 0; j < N_BARS; j++) {
  const feet = FEET_ON_BAR[j];
  const n = feet.length;
  const xs = feet.map((_, k) => SLOT[j].cx + (k - (n - 1) / 2) * FOOT_PITCH);
  let shift = 0;
  feet.forEach((ft, k) => {
    if (ft.arc !== ROOT) return;
    if (ft.side === "L") shift = Math.max(shift, SLOT[j].x0 + ROOT_FOOT_INSET - xs[k]);
    else shift = Math.min(shift, SLOT[j].x1 - ROOT_FOOT_INSET - xs[k]);
  });
  feet.forEach((ft, k) => {
    FOOT_X[ft.arc][ft.side === "L" ? 0 : 1] = xs[k] + shift;
  });
}

/** The root's height; the composition is solved from it. */
const ROOT_SAG = H_RATIO * (FOOT_X[ROOT][1] - FOOT_X[ROOT][0]);

// ---------------------------------------------------------------------------
// WHERE THE LINE SITS. The resting composition — crown top to the bars' shadow
// bottom — is centred on world y 835, which the resting camera puts on screen
// y 835 (CAM_LIFT).
// ---------------------------------------------------------------------------
export const CONTENT_REST = 835;
// crown top = LINE_Y - BAR_R - ROOT_SAG - STROKE/2 - CROWN_OUT
// bottom    = LINE_Y + BAR_R + SHADOW
export const LINE_Y =
  (2 * CONTENT_REST + BAR_R + ROOT_SAG + STROKE / 2 + CROWN_OUT - BAR_R - SHADOW) / 2;
export const BAR_TOP = LINE_Y - BAR_R;
export const COMP_TOP = BAR_TOP - ROOT_SAG - STROKE / 2 - CROWN_OUT;
export const COMP_BOTTOM = LINE_Y + BAR_R + SHADOW;

// ---------------------------------------------------------------------------
// ARCH GEOMETRY. Each arch is a circular segment on the bar tops with sagitta
// H_RATIO * span; the stroke runs on past each foot down to BAR_TOP + TUCK so
// the bar's white covers its end.
// ---------------------------------------------------------------------------
export type ArcGeom = { cx: number; cy: number; r: number; phi0: number; phi1: number; xl: number; xr: number; sag: number };
export const ARC_GEOM: ArcGeom[] = ARCS.map((_, i) => {
  const xl = FOOT_X[i][0];
  const xr = FOOT_X[i][1];
  const c = xr - xl;
  const sag = H_RATIO * c;
  const r = (c * c) / 4 / (2 * sag) + sag / 2;
  const cx = (xl + xr) / 2;
  const cy = BAR_TOP - sag + r;
  const beta = Math.asin(clamp01Signed((BAR_TOP + TUCK - cy) / r));
  return { cx, cy, r, phi0: -Math.PI - beta, phi1: beta, xl, xr, sag };
});
function clamp01Signed(v: number) {
  return Math.max(-1, Math.min(1, v));
}

const pt = (g: ArcGeom, r: number, phi: number) => ({
  x: g.cx + r * Math.cos(phi),
  y: g.cy + r * Math.sin(phi),
});
/** The arch from its left end to fraction p of the way along, at radius r. */
export const arcPath = (g: ArcGeom, p: number, r: number = g.r, dx = 0, dy = 0) => {
  const a = g.phi0;
  const b = g.phi0 + (g.phi1 - g.phi0) * p;
  const s = pt(g, r, a);
  const e = pt(g, r, b);
  const large = b - a > Math.PI ? 1 : 0;
  const n = (v: number) => v.toFixed(2);
  return `M${n(s.x + dx)} ${n(s.y + dy)} A${n(r)} ${n(r)} 0 ${large} 1 ${n(e.x + dx)} ${n(e.y + dy)}`;
};
/** How much of arch i is drawn at frame f (0..1). */
export const arcProgress = (i: number, f: number) => {
  const s = ARCS[i];
  return EASE_DRAW(clamp01((f - s.at) / s.dur));
};
/** A crown colour's current offset at frame f. */
export const crownOff = (c: (typeof CROWN)[number], f: number) =>
  c.off * EASE_CROWN(clamp01((f - c.at) / CROWN_F));

// ---------------------------------------------------------------------------
// THE SCATTER AND THE CONVERGENCE. Each bar floats at its scatter pose (world
// x, y relative to LINE_Y, tilt in degrees), then travels to its slot on ONE
// eased clock — a quadratic curve bent by `bend` x its travel, tilt unwinding
// on the same clock — while its drift noise fades with (1 - e).
// The scatter was chosen by a collision-checked search (scratchpad gs/search.ts):
// measured on this file, every pair keeps >= 19.7 world px of paper between
// inks in flight.
// ---------------------------------------------------------------------------
export const SCATTER = [
  { x: 250, dy: -144, rot: -19, bend: 0.17 },
  { x: 437, dy: -244, rot: -25, bend: 0.15 },
  { x: 353, dy: 238, rot: -31, bend: -0.08 },
  { x: 766, dy: -59, rot: -13, bend: 0.11 },
  { x: 671, dy: -226, rot: 16, bend: 0.03 },
  { x: 513, dy: 116, rot: 22, bend: 0.17 },
  { x: 824, dy: 140, rot: 28, bend: 0.04 },
];
/** Convergence start and landing frames per bar (hashed, not left to right). */
export const START = [31, 26, 37, 29, 40, 34, 28];
export const LAND = [98, 101, 95, 92, 103, 96, 99];
export const EASE_CONVERGE = smoothstep;
const TAU = Math.PI * 2;
export const NOISE = LENS.map((_, i) => ({
  ax: 6 + 2.5 * hash(i, 1),
  ay: 6 + 2.5 * hash(i, 2),
  px: 70 + 60 * hash(i, 3),
  py: 70 + 60 * hash(i, 4),
  pr: 70 + 60 * hash(i, 5),
  fx: TAU * hash(i, 6),
  fy: TAU * hash(i, 7),
  fr: TAU * hash(i, 8),
}));
export const SWAY_DEG = 2;

export type Pose = { x: number; y: number; rot: number };
export const barPose = (i: number, f: number): Pose => {
  const s = SCATTER[i];
  const sx = s.x;
  const sy = LINE_Y + s.dy;
  const tx = SLOT[i].cx;
  const ty = LINE_Y;
  const e = EASE_CONVERGE(clamp01((f - START[i]) / (LAND[i] - START[i])));
  const dx = tx - sx;
  const dy = ty - sy;
  const d = Math.hypot(dx, dy);
  const qx = (sx + tx) / 2 + (-dy / d) * s.bend * d;
  const qy = (sy + ty) / 2 + (dx / d) * s.bend * d;
  const w = 1 - e;
  const n = NOISE[i];
  return {
    x: w * w * sx + 2 * w * e * qx + e * e * tx + w * n.ax * Math.sin((TAU * f) / n.px + n.fx),
    y: w * w * sy + 2 * w * e * qy + e * e * ty + w * n.ay * Math.sin((TAU * f) / n.py + n.fy),
    rot: w * (s.rot + SWAY_DEG * Math.sin((TAU * f) / n.pr + n.fr)),
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA — keyed as eased per-frame curves (`camMove`), cy from an eased
// content centre + CAM_LIFT / k, damped by cottageShared's runCamera2.
// ---------------------------------------------------------------------------
/** Ink bbox of the bars at frame f (shadow included). */
export const barsBox = (f: number) => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < N_BARS; i++) {
    const p = barPose(i, f);
    const h = (LENS[i] - BAR_H) / 2;
    const t = (p.rot * Math.PI) / 180;
    const ex = Math.abs(Math.cos(t)) * h + BAR_R;
    const ey = Math.abs(Math.sin(t)) * h + BAR_R;
    x0 = Math.min(x0, p.x - ex);
    x1 = Math.max(x1, p.x + ex + SHADOW);
    y0 = Math.min(y0, p.y - ey);
    y1 = Math.max(y1, p.y + ey + SHADOW);
  }
  return { x0, x1, y0, y1 };
};
const OPEN_BOX = barsBox(0);
export const C_OPEN = (OPEN_BOX.y0 + OPEN_BOX.y1) / 2;
export const C_PUSH = LINE_Y + SHADOW / 2;
export const K_OPEN = 1.12;
export const K_PUSH = 1.22;
export const K_REST = 1.0;
export const K_CREEP = 0.02;
export const PUSH_F0 = 20;
export const PUSH_F1 = 80;
export const PUSH_WARP = 1;
export const PULL_F0 = 84;
export const PULL_F1 = 118;
export const PULL_WARP = 0.85;
export const CREEP_F0 = 124;
export const CREEP_F1 = 161;

const PUSH = camMove({ f0: PUSH_F0, f1: PUSH_F1, k0: K_OPEN, k1: K_PUSH, c0: C_OPEN, c1: C_PUSH, warp: PUSH_WARP });
const PULL = camMove({ f0: PULL_F0, f1: PULL_F1, k0: K_PUSH, k1: K_REST, c0: C_PUSH, c1: CONTENT_REST, warp: PULL_WARP });
const CREEP = camMove({
  f0: CREEP_F0,
  f1: CREEP_F1,
  k0: K_REST,
  k1: K_REST + K_CREEP,
  c0: CONTENT_REST,
  c1: CONTENT_REST,
  warp: 1,
});
export const GS_CAM_F = [0, ...PUSH.F, ...PULL.F, ...CREEP.F];
export const GS_CAM_K = [K_OPEN, ...PUSH.K, ...PULL.K, ...CREEP.K];
export const GS_CAM_CY = [C_OPEN + CAM_LIFT / K_OPEN, ...PUSH.CY, ...PULL.CY, ...CREEP.CY];
export const GS_CAM_CX = GS_CAM_F.map(() => CX);
export const gsCamera = (f: number) => runCamera2(f, GS_CAM_F, GS_CAM_CY, GS_CAM_CX, GS_CAM_K);
const REST = { cx: CX, cy: GS_CAM_CY[0] };

export const schema = z.object({
  ink: z.string(),
  shadow: z.string(),
  // the hand on the camera, as in PeakForSolar
  sway: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  ink: WHITE,
  shadow: BLACK,
  sway: true,
});

const GoodSyntax: React.FC<Props> = ({ ink, shadow, sway: withSway }) => {
  const frame = useCurrentFrame();
  const cam = gsCamera(frame);
  const d = withSway ? sway(frame) : { dx: 0, dy: 0 };

  const poses = LENS.map((_, i) => barPose(i, frame));
  const bar = (i: number, p: Pose, fill: string, off: number) => (
    <rect
      key={`b${i}-${off}`}
      x={-LENS[i] / 2}
      y={-BAR_R}
      width={LENS[i]}
      height={BAR_H}
      rx={BAR_R}
      fill={fill}
      transform={`translate(${(p.x + off).toFixed(3)} ${(p.y + off).toFixed(3)}) rotate(${p.rot.toFixed(4)})`}
    />
  );

  const prog = ARCS.map((_, i) => arcProgress(i, frame));
  const arcStroke = (i: number, fill: string, off: number) =>
    prog[i] > 0 ? (
      <path
        key={`a${i}-${off}`}
        d={arcPath(ARC_GEOM[i], prog[i], ARC_GEOM[i].r, off, off)}
        fill="none"
        stroke={fill}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    ) : null;

  const root = ARC_GEOM[ROOT];
  return (
    <World frame={frame} cam={{ cx: cam.cx + d.dx, cy: cam.cy + d.dy, k: cam.k }} rest={REST}>
      {/* 1. every hard shadow, so bars and arches cast one shadow together */}
      {poses.map((p, i) => bar(i, p, shadow, SHADOW))}
      {ARCS.map((_, i) => arcStroke(i, shadow, SHADOW))}

      {/* 2. the crown: the root widened outward, orange at the back */}
      {prog[ROOT] > 0
        ? CROWN.map((c) => {
            const o = crownOff(c, frame);
            if (o <= 0.01) return null;
            return (
              <path
                key={c.key}
                d={arcPath(root, prog[ROOT], root.r + o / 2)}
                fill="none"
                stroke={c.color}
                strokeWidth={STROKE + o}
                strokeLinecap="butt"
              />
            );
          })
        : null}

      {/* 3. the arches, white */}
      {ARCS.map((_, i) => arcStroke(i, ink, 0))}

      {/* 4. the bars, white, over the arches' tucked ends */}
      {poses.map((p, i) => bar(i, p, ink, 0))}
    </World>
  );
};

export default GoodSyntax;
