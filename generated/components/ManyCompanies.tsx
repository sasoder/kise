import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp,
  clamp01,
  hash,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { KRAFT_BASE, KRAFT_BLUR, KRAFT_DIM, KRAFT_SRC, KraftBackground } from "./d1Shared";
// The clip's shared module. The tiles, the marks, the leak, the centre, the
// hexagon and the camera this cut resolves on all live there; nothing that the
// three cuts have to agree on is restated in this file.
import {
  BrandName,
  BrandTile,
  CENTER,
  DataDot,
  EFX_REST,
  EFX_SPOT,
  LEAK_FALL,
  LEAK_LIFE,
  LEAK_SLOW,
  LEAK_FAST,
  RING_ORDER,
  RING_TILE,
  hexPos,
  leakDots,
} from "./equifaxShared";

export const FPS = 24;
// Christina, on the Cheeky Pint, on breaches and churn:
// "many companies have had humongous data breaches — you know, Equifax was a
//  great — yeah, Equifax."
//
// SRT span 0:00.000 -> 0:05.679 at 24fps.
// round(5.679 * 24) = round(136.3) = 136 frames of speech, plus the house's
// 16 frame tail so the resolved state holds = 152.
export const DURATION = 152;

// Word onsets, in frames from the composition's start (= 0:00.000):
//   f0 many · f7 companies · f19 have · f27 had · f36 humongous · f58 data
//   · f68 breaches · f85 you know · f86 equifax · f97 was · f102 a · f106 great
//   · f109 yeah · f121 equifax · f136 end · tail to f152
//
// The inflections that actually bend the motion:
//   f36  humongous — the whole crowd finishes landing in its scatter, and the
//                    first tile drips: the settle hands straight over to the leak
//   f52  (wave)    — the seventh tile has started; all seven are breached
//   f58  data      — the leaks are established, falling in every part of the
//                    frame; the word lands on a picture, not on a first dot
//   f68  breaches  — the camera has just landed on them
//   f86  equifax   — the cut's ONE ink click: the wordmark brightens, its leak
//                    turns amber and steps up to LEAK_FAST
//   f106 great     — the push has landed; six frames of held breath
//   f121 equifax   — the lean-in to k 1.45 has just landed; nothing else moves
//   f136 end       — speech ends; the resolved state runs to f152
//
// ---------------------------------------------------------------------------
// "Many companies" — ONE MOTION: A CROWD GATHERS, LEAKS, AND RESOLVES.
//
// Seven brand tiles on the kraft. Six are square company marks — Target,
// Facebook, LinkedIn, Adobe, T-Mobile, Home Depot, every one of them with a
// documented giant breach — and the seventh is the wide EQUIFAX wordmark. A
// BREACH IS A TILE LEAKING DATA DOTS OUT OF ITS BOTTOM EDGE. That is the only
// mechanism in the cut and it is literal enough to read with no sound.
//
// The whole cut is one gesture in three inflections: the crowd gathers in from
// every side into a loose scatter, every tile starts leaking, and then the
// scatter RESOLVES into a tidy hexagon with Equifax in the middle — the
// messiest thing in the frame becoming the most ordered picture, on the word
// "Equifax". Nothing pops in and nothing stops: a tile that has landed sways,
// a tile that is travelling drags its own leak along with it, and the leaks run
// from f40 to the last frame.
//
//   PHASE 1 · GATHER (f0 -> f36, "many companies have had")
//     f0 is seven tiles outside the content band, on a ring around CENTER, each
//     one out on the side its scatter position is on (the ring is pushed out to
//     clear the band where it has to be, and the bottom 90 degrees of it is
//     empty — nothing may enter through the caption band). They leave on hashed
//     frames f0-f8 and travel on `flow` into the scatter, the NEAREST landing
//     first (f26) and the farthest last (f36), each landing a zero-sloped
//     `back(0.75)` bump. "Humongous" at f36 is the settle of the whole crowd,
//     not a new gesture.
//     Camera: k 1.12 -> 1.20, keyed f0-f26, lands f30 — the gather pulls the
//     lens in with it.
//
//   PHASE 2 · LEAK (f36 -> f78, "humongous data breaches, you know")
//     The tiles hold, swaying 2.5 px on hashed periods. From f40 — four frames
//     after the crowd has settled, ON "humongous" — the leaks start, one wave
//     centre-outward across f40-f52, the tile nearest CENTER first, each at
//     LEAK_SLOW with its own hashed phase so no two drip in step. Equifax leaks
//     too, ink, at the same rate: at this point it is one of the crowd. By f52
//     all seven are breached, sixteen frames before "breaches".
//     Camera: k 1.20 -> 1.28, keyed f34-f58, lands f62 — before "breaches".
//     Then the leaks are the motion.
//
//   PHASE 3 · SPOTLIGHT (f78 -> f124, "Equifax was a great — yeah, Equifax")
//     From f78 the Equifax tile travels from its scatter position to CENTER on
//     a `flow` ease, landing f96, growing EFX_REST -> EFX_SPOT over the same
//     window. On its word at f86 it takes the cut's ONE single-object ink click
//     (0.9 -> 1.0 for four frames, settling to 0.95 and held) and its leak
//     turns ACCENT and steps up to LEAK_FAST — the amber leak is the humongous
//     one. The dots already in the air stay ink and finish their fall.
//     At the same time the six company tiles travel from the scatter onto
//     hexPos(i) (f80 -> f104, hashed +/- 3 frames) and dim 0.9 -> OP_UNREAD
//     across f88-f104. Their leaks never stop and travel with them.
//     Camera: k 1.28 -> 1.40 keyed f72-f90, lands f97, before "great" at f106;
//     a dead-still held breath f100-f106; then k 1.40 -> K_FINAL_CUT1 (1.45)
//     keyed f106-f114, landing f122 — on "yeah, Equifax". That lean-in is the
//     payoff and nothing else in the frame moves for it.
//
//   TAIL (f124 -> f152)
//     The hexagon of six dimmed tiles leaking slowly in ink, Equifax bright at
//     the centre leaking fast in amber, the camera holding on `sway` alone.
//     The last frame is the resolved frame. EFX_FINAL (= CENTER) is the shared
//     module's; the camera cut 3 should open on is K_FINAL_CUT1 (1.45) with
//     CUT_LIFT (170), both exported from THIS file — see the CAMERA block: the
//     shared K_FINAL_1 (1.28) is left untouched for the other two builders but
//     this cut no longer resolves on it.
//
// DEVIATIONS FROM THE BRIEF, each argued where it is set:
//   * the entry ring is the band's own outline pushed out by ENTRY_CLEAR rather
//     than a circle of radius 700 (ENTRY), and the seven are dealt round it in
//     sorted slots rather than dropped on it — at a flat 700 two tiles start
//     stacked on each other and four start off screen; ENTRY_CLEAR is 30 rather
//     than the 60 of the first pass, which is the pull-in the revision brief
//     authorises for the new opening k;
//   * the camera keys all end about 6 frames before their briefed landings
//     (CAMERA), because the damper costs about that, and the cut carries three
//     camera stills rather than the one COMMON.md allows — see the CAMERA block;
//   * the six scatter positions are hashed around six anchors rather than hashed
//     over the whole rectangle (SCATTER), because the plain sampling came out
//     bottom-heavy with an empty top third;
//   * the spotlight leak is 180 px wide rather than 240 (LEAK_W_EFX), which is
//     the narrowing the brief authorises, and every leak is drawn UNDER every
//     tile so a dot that reaches the lower ring row is occluded rather than
//     crossing it;
//   * (REVISION 1) the camera resolves on a local K_FINAL_CUT1 = 1.45 with a
//     local CUT_LIFT = 170 instead of the shared K_FINAL_1 / CAM_LIFT — the
//     shared constants are left exactly as the other two builders have them;
//   * (REVISION 1) PUSH lands f96 where the revision brief says f97: the keys
//     are unchanged at f72-f90 and the damper settles one frame sooner because
//     the move is 0.12 of k rather than 0.16. Ten frames ahead of "great"
//     instead of nine.
// ---------------------------------------------------------------------------

export const WORLD_W = 1080;
export const WORLD_H = 1600;

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---------------------------------------------------------------------------
// THE TRAVEL CURVES, exactly as the approved D1 set uses them: `flow` for a
// travel (eased at both ends, one speed in the middle, so a crowd reads as one
// body), and the settle as a single zero-sloped lobe rather than a back-out
// ease clamped at 1 — a clamped back-out puts a step in velocity two thirds of
// the way through every landing, which is the one thing the velocity scan is
// there to catch.
// ---------------------------------------------------------------------------
const FLOW_A = 0.28;
const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};

const SETTLE_U0 = 4 / 7;
const overshoot = (u: number) => {
  const w = clamp01((clamp01(u) - SETTLE_U0) / (1 - SETTLE_U0));
  return 64 * w ** 3 * (1 - w) ** 3;
};
export const SETTLE_PX = 3;

// One travel: from a to b between f0 and f1, on `flow`, with the landing bump
// applied ALONG the travel.
const travel = (
  f: number,
  f0: number,
  f1: number,
  a: { x: number; y: number },
  b: { x: number; y: number },
) => {
  const u = clamp01((f - f0) / (f1 - f0));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const s = Math.min(SETTLE_PX, 0.02 * d) * overshoot(u);
  const g = flow(u);
  return { x: a.x + dx * g + (dx / d) * s, y: a.y + dy * g + (dy / d) * s };
};

// ---------------------------------------------------------------------------
// THE CAST. Index 0..5 are the six company tiles in RING_ORDER; index 6 is
// Equifax. One index set, so every track in the file is one loop.
// ---------------------------------------------------------------------------
export const N_RING = RING_ORDER.length; // 6
export const EFX = N_RING; // 6: the wordmark's index
export const N_ALL = N_RING + 1; // 7
export const CAST: BrandName[] = [...RING_ORDER, "EQUIFAX"];

// ---------------------------------------------------------------------------
// THE SCATTER. Seven hashed positions inside x 220-860, y 540-1130, with the
// Equifax tile parked in the upper-left third. The six squares are drawn by
// rejection: at least SCATTER_SEP between two square centres, and a clear gap
// around the wordmark's own 300 x 96 box, which is far too wide for a
// centre-distance test to keep clear of.
//
// It is a loop with a fixed hash and a fixed order, so the picture is the same
// on every render and on every machine, and it is evaluated ONCE at module
// scope rather than per frame.
// ---------------------------------------------------------------------------
export const SCATTER_X0 = 220;
export const SCATTER_X1 = 860;
export const SCATTER_Y0 = 450; // see SCATTER_ANCHORS: the brief's 540 has no room left in it
export const SCATTER_Y1 = 1130;
export const SCATTER_SEP = 150; // centre to centre, two square tiles
export const SCATTER_GAP = 26; // clear air between a square and the wordmark

export const EFX_SCATTER = { x: 400, y: 640 };

// DEVIATION, and the reason. Sampling all six positions from one hash over the
// whole rectangle was tried first and rejected on two counts, both measured:
//   * it put five of the six squares below y 920 and left the top of the region
//     empty, so the "scatter" read as a row with a hole over it;
//   * and it dropped squares onto positions that were already ON a hexagon
//     vertex, so the shortest assignment gave two of them a 35 px walk. A tile
//     that does not visibly move makes the hexagon read as something that was
//     always there rather than as something that forms.
// A third thing the plain sampling cannot know is that a square inside the
// SPOTLIGHT's box is still under the wordmark at f86-96, when the wordmark is
// arriving there and growing — which reads as a collision, not as a resolve.
//
// So the six are sampled around six ANCHORS, each jittered by up to
// SCATTER_JITTER on a hash, and every candidate — anchor or jitter — has to
// pass all four tests below or it is rejected (the anchor is the fallback). The
// positions are still hashed and still irregular; what is fixed is that the
// crowd fills its area, keeps out from under the wordmark at both ends of its
// travel, and has somewhere to walk when the hexagon forms.
//
// Note what the region actually allows. The wordmark at rest blocks x 182-618
// over y 524-756 and the spotlight blocks x 308-772 over y 719-951, and the
// region is only 220-860 by 540-1130 — so a square can sit high in the frame
// only out to the right of the wordmark, and the crowd comes out bottom-
// weighted because the picture makes it so, not by accident.
//
// AND THE REGION'S TOP IS 450, NOT THE BRIEF'S 540. That is the deviation the
// rest of this block forces. Inside y 540-1130 the only air above the spotlight
// is the strip to the RIGHT of the wordmark, so at most one square can sit high
// in the frame — and the hexagon has TWO top vertices, hex1 (670, 610) and
// hex2 (410, 610). Whichever square is assigned to the second of them has to
// walk up from the bottom, and it walks through the middle: measured, LinkedIn
// ended up entirely BEHIND the Equifax tile at f93, 84 px of overlap on every
// side, at the exact moment the wordmark is landing. Sixty more pixels of
// headroom (the band's own top is 200, and the tile's top edge at y 450 is
// 408) puts a square above the wordmark as well as beside it, both top
// vertices are fed from the top, no path goes near the centre, and the
// scatter's centroid lands at (566, 818) — 17 px from CENTER, where the brief's
// own region could only manage 131 px low.
export const SCATTER_JITTER = 22;
export const SCATTER_HEX_CLEAR = 140; // a walk of at least a tile and a half
export const SPOT_GAP = 20; // clear air between a square and the spotlight
export const SCATTER_ANCHORS = [
  { x: 300, y: 480 },
  { x: 640, y: 470 },
  { x: 838, y: 700 },
  { x: 820, y: 1080 },
  { x: 540, y: 1130 },
  { x: 255, y: 1050 },
];

export const SCATTER: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  const halfR = RING_TILE / 2;
  const efxHalfW = EFX_REST.w / 2;
  const efxHalfH = EFX_REST.h / 2;
  const ok = (x: number, y: number) => {
    if (x < SCATTER_X0 || x > SCATTER_X1 || y < SCATTER_Y0 || y > SCATTER_Y1) return false;
    // clear of the wordmark where it sits in the crowd
    if (
      Math.abs(x - EFX_SCATTER.x) < efxHalfW + halfR + SCATTER_GAP &&
      Math.abs(y - EFX_SCATTER.y) < efxHalfH + halfR + SCATTER_GAP
    )
      return false;
    // clear of the wordmark where it ends up, at its spotlight size
    if (
      Math.abs(x - CENTER.x) < EFX_SPOT.w / 2 + halfR + SPOT_GAP &&
      Math.abs(y - CENTER.y) < EFX_SPOT.h / 2 + halfR + SPOT_GAP
    )
      return false;
    // far enough from every vertex that the resolve is a walk, not a nudge
    for (let v = 0; v < N_RING; v++) {
      const h = hexPos(v);
      if (Math.hypot(h.x - x, h.y - y) < SCATTER_HEX_CLEAR) return false;
    }
    for (const p of out) if (Math.hypot(p.x - x, p.y - y) < SCATTER_SEP) return false;
    return true;
  };
  for (let i = 0; i < N_RING; i++) {
    const a = SCATTER_ANCHORS[i];
    let placed = false;
    for (let t = 0; t < 60 && !placed; t++) {
      const x = a.x + (hash(i * 97 + t, 11) * 2 - 1) * SCATTER_JITTER;
      const y = a.y + (hash(i * 97 + t, 29) * 2 - 1) * SCATTER_JITTER;
      if (!ok(x, y)) continue;
      out.push({ x, y });
      placed = true;
    }
    if (!placed) out.push(a);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// SCATTER -> HEX. Which scattered square walks to which vertex of the hexagon.
// All 720 assignments are scored on total path length and the shortest one that
// sends no path THROUGH the centre tile's box is taken — a square crossing the
// wordmark while the wordmark is arriving there is the one thing that makes the
// resolve read as a collision rather than as an order emerging.
//
// ASSIGN[i] is the scatter slot that company i (= RING_ORDER[i], resolving on
// hexPos(i)) starts from.
// ---------------------------------------------------------------------------
const CENTRE_BOX_W = EFX_SPOT.w + RING_TILE; // 424: the wordmark plus a tile's width of air
const CENTRE_BOX_H = EFX_SPOT.h + RING_TILE; // 192

const crossesCentre = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  // Liang-Barsky against the centre box.
  const x0 = CENTER.x - CENTRE_BOX_W / 2;
  const x1 = CENTER.x + CENTRE_BOX_W / 2;
  const y0 = CENTER.y - CENTRE_BOX_H / 2;
  const y1 = CENTER.y + CENTRE_BOX_H / 2;
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const test = (p: number, q: number) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  return (
    test(-dx, a.x - x0) && test(dx, x1 - a.x) && test(-dy, a.y - y0) && test(dy, y1 - a.y)
  );
};

export const ASSIGN: number[] = (() => {
  const idx = [0, 1, 2, 3, 4, 5];
  const perms: number[][] = [];
  const walk = (rest: number[], acc: number[]) => {
    if (rest.length === 0) {
      perms.push(acc);
      return;
    }
    for (let i = 0; i < rest.length; i++)
      walk([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, rest[i]]);
  };
  walk(idx, []);
  let best: number[] = idx;
  let bestScore = Infinity;
  for (const p of perms) {
    let len = 0;
    let cross = 0;
    for (let i = 0; i < N_RING; i++) {
      const a = SCATTER[p[i]];
      const b = hexPos(i);
      len += Math.hypot(b.x - a.x, b.y - a.y);
      if (crossesCentre(a, b)) cross++;
    }
    const score = cross * 100000 + len;
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
})();

// Where tile i sits in the scatter, and where it resolves.
export const scatterOf = (i: number) => (i === EFX ? EFX_SCATTER : SCATTER[ASSIGN[i]]);
export const restOf = (i: number) => (i === EFX ? CENTER : hexPos(i));

// ---------------------------------------------------------------------------
// THE ENTRY RING. The brief asks for a ring of radius ~700 around CENTER, for
// entries from every side, and for nothing to come in through the caption band
// at the bottom. At a flat 700 those three cannot all hold: the band is 960 x
// 1250, so its own half-diagonal is 788 and a ray leaving diagonally is still
// INSIDE the band at 700 — four of the seven start on top of the picture.
//
// So the ring is not a circle at all: it is the BAND'S OWN OUTLINE, pushed out
// by ENTRY_CLEAR. That is what "just outside the band" means, it is 480 to 729
// px from CENTER depending on the direction (the brief's ~700 is its diagonal),
// and it is the reading that makes the opening work: at a flat 700 the four
// tiles coming in from the sides start 130 px off SCREEN, so "many companies"
// opens on a sheet with three marks on it and nothing else, and the ease-in
// keeps it that way for half a second. On the band's outline every one of the
// seven is on screen at f0, ringing the frame, and the travels are 200 px
// shorter into the bargain.
//
// REVISION 1: ENTRY_CLEAR IS 30, NOT 60. The scale pass took the opening k from
// 0.94 to 1.12, and at 1.12 the screen is 1080 / 1.12 = 964 world px wide —
// which is the band's own 960. So the band's outline is now almost exactly the
// screen's edge, and 60 px outside it is 60 px off screen: measured at k 1.12
// with ENTRY_CLEAR 60, only four of the seven were on screen at f0 (Adobe,
// T-Mobile and Home Depot entirely off it), which is the failure the brief's
// own check is written to catch. At 30 all seven are on screen at f0 — 100, 98,
// 41, 29, 19, 18 and 17 per cent of their area — every entry is still outside
// the content band on every side, and the travels shorten by another 30 px. A direction whose ray would leave through the
// BOTTOM edge is excluded outright (the wedge is the bottom 90 degrees,
// DOWN_LO..DOWN_HI), which is what keeps every entry at y <= 1450 as well as
// out of the caption band.
//
// AND THE SEVEN ARE DEALT ROUND THAT ARC, NOT DROPPED ON IT. Taking each
// tile's angle straight off its own scatter direction and clamping it out of
// the wedge was tried and is wrong twice over: two tiles whose scatter is
// anywhere below the centre both clamp to the SAME wedge boundary and start the
// cut stacked on each other (measured at f0: T-Mobile exactly behind Home Depot
// at (1055, 1350), and LinkedIn half over the Equifax wordmark). So the tiles
// are SORTED by their own direction and then dealt one to each of seven equal
// slots around the allowed 270 degrees, each jittered on a hash. Every tile
// still comes in from roughly its own side — the ordering is its own — and no
// two can ever share a doorway: the closest two can get is ENTRY_SLOT minus
// twice the jitter, 15.4 degrees, which is about 200 world px out at the ring.
// ---------------------------------------------------------------------------
export const ENTRY_CLEAR = 30; // how far outside the band a tile starts
export const BAND_X0 = 60;
export const BAND_X1 = 1020;
export const BAND_Y0 = 200;
export const BAND_Y1 = 1450;
const DOWN_LO = Math.PI / 4; // 45 degrees
const DOWN_HI = (3 * Math.PI) / 4; // 135 degrees

// How far CENTER is from the band's edge along a direction.
const bandExit = (th: number) => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  let t = Infinity;
  if (c > 1e-6) t = Math.min(t, (BAND_X1 - CENTER.x) / c);
  if (c < -1e-6) t = Math.min(t, (BAND_X0 - CENTER.x) / c);
  if (s > 1e-6) t = Math.min(t, (BAND_Y1 - CENTER.y) / s);
  if (s < -1e-6) t = Math.min(t, (BAND_Y0 - CENTER.y) / s);
  return t;
};

// The allowed arc, measured from its start at DOWN_HI: 270 degrees of it.
export const ENTRY_ARC = 2 * Math.PI - (DOWN_HI - DOWN_LO);
export const ENTRY_SLOT = ENTRY_ARC / N_ALL;
export const ENTRY_JITTER = 0.3; // of a slot, either way

export const ENTRY: { x: number; y: number }[] = (() => {
  // where each tile WANTS to come in from, as a position along the allowed arc
  const want = Array.from({ length: N_ALL }, (_, i) => {
    const s = scatterOf(i);
    const th = Math.atan2(s.y - CENTER.y, s.x - CENTER.x);
    let u = (th - DOWN_HI) % (2 * Math.PI);
    if (u < 0) u += 2 * Math.PI;
    // a direction inside the wedge maps to whichever end of the arc is nearer
    if (u > ENTRY_ARC) u = u - ENTRY_ARC < 2 * Math.PI - u ? ENTRY_ARC : 0;
    return { i, u };
  });
  want.sort((a, b) => a.u - b.u);
  const out: { x: number; y: number }[] = new Array(N_ALL);
  want.forEach((w, n) => {
    const u = (n + 0.5 + ENTRY_JITTER * (hash(w.i, 41) * 2 - 1)) * ENTRY_SLOT;
    const th = DOWN_HI + u;
    const r = bandExit(th) + ENTRY_CLEAR;
    out[w.i] = { x: CENTER.x + r * Math.cos(th), y: CENTER.y + r * Math.sin(th) };
  });
  return out;
})();

// ---------------------------------------------------------------------------
// PHASE 1. The crowd leaves on hashed frames and lands NEAREST FIRST, so the
// wave's order is the geometry's and no stagger is authored on top of it.
// ---------------------------------------------------------------------------
export const GATHER_GO0 = 0;
export const GATHER_GO1 = 8;
export const GATHER_LAND0 = 26;
export const GATHER_LAND1 = 36; // "humongous"

const gatherDist = (i: number) => {
  const a = ENTRY[i];
  const b = scatterOf(i);
  return Math.hypot(b.x - a.x, b.y - a.y);
};
// rank 0 = shortest travel = lands first
const rankBy = (score: (i: number) => number) => {
  const order = Array.from({ length: N_ALL }, (_, i) => i).sort((a, b) => score(a) - score(b));
  const r: number[] = new Array(N_ALL);
  order.forEach((i, n) => (r[i] = n));
  return r;
};
export const GATHER_RANK = rankBy(gatherDist);
export const goAt = (i: number) => GATHER_GO0 + (GATHER_GO1 - GATHER_GO0) * hash(i, 7);
export const landAt = (i: number) =>
  GATHER_LAND0 + ((GATHER_LAND1 - GATHER_LAND0) * GATHER_RANK[i]) / (N_ALL - 1);

// ---------------------------------------------------------------------------
// PHASE 2. The leaks, centre-outward: the tile nearest CENTER in the scatter
// drips first.
//
// REVISION 1: the wave runs f40-f52, not f56-f66. It starts ON "humongous"
// (f36, four frames after the crowd has finished landing) rather than two
// frames before "data" (f58). f36-f56 was the cut's one flat stretch — the
// gather had settled, the leaks had not begun, and the only thing moving was
// the sway and a camera creep. Now the settle hands straight over to the first
// drip: all seven are leaking by f52, sixteen frames before "breaches", and
// "data" at f58 lands on a frame where the leak is already established rather
// than on its first dot. The wave's shape is untouched — same LEAK_SLOW, same
// ink, same centre-outward rank, same per-tile hashed phase.
// ---------------------------------------------------------------------------
export const LEAK_F0 = 40;
export const LEAK_F1 = 52;
export const LEAK_RANK = rankBy((i) => {
  const s = scatterOf(i);
  return Math.hypot(s.x - CENTER.x, s.y - CENTER.y);
});
export const leakStart = (i: number) =>
  LEAK_F0 + ((LEAK_F1 - LEAK_F0) * LEAK_RANK[i]) / (N_ALL - 1);

// A leak is as wide as the tile it falls out of, less its margins. The
// spotlight's is 180 rather than the 240 the brief sizes it at: at 240 the
// outermost dots of the centre tile's fall reach the lower ring tiles' row, and
// the brief's own layout check authorises the narrowing. Every leak is drawn
// UNDER every tile in any case, so a dot that does reach a tile goes behind it.
export const LEAK_W_EFX = 180;
export const LEAK_W_RING = 58;

// ---------------------------------------------------------------------------
// PHASE 3. The resolve. Equifax goes first (f78) and the ring follows two
// frames later, so the centre is claimed before the hexagon closes around it.
// ---------------------------------------------------------------------------
export const EFX_GO = 78;
export const EFX_LAND = 96;
export const RING_GO = 80;
export const RING_DUR = 24;
export const RING_HASH = 3;
export const ringGo = (i: number) => RING_GO + RING_HASH * (hash(i, 13) * 2 - 1);

export const CLICK_F = 86; // "Equifax" — the cut's one single-object ink click
export const CLICK_DUR = 4;
export const CLICK_SETTLE = 8; // frames from the click's peak back to the held level
export const OP_CLICK = 1.0;
export const OP_EFX_HELD = 0.95;
export const DIM_F0 = 88;
export const DIM_F1 = 104;

// The hold. A tile that has landed is never dead: it breathes 2.5 px on its own
// hashed period, ramped in over SWAY_IN frames from its landing so the settle
// and the sway are one motion rather than two.
export const TILE_SWAY = 2.5;
export const SWAY_IN = 10;
export const swayPeriod = (i: number) => 38 + 14 * hash(i, 19);
const tileSway = (i: number, f: number) => {
  const amp = TILE_SWAY * smoothstep((f - landAt(i)) / SWAY_IN);
  const p = swayPeriod(i);
  return {
    dx: amp * 0.6 * Math.sin((2 * Math.PI * (f - hash(i, 23) * p)) / p),
    dy: amp * Math.sin((2 * Math.PI * (f - hash(i, 31) * p)) / (p * 1.17)),
  };
};

// ---------------------------------------------------------------------------
// ONE AUTHORED TRACK PER TILE, spanning the whole cut: the gather, the resolve
// and the sway, added together. A phase that has not started contributes its
// own start position, so the track is continuous by construction.
// ---------------------------------------------------------------------------
export const tileAt = (i: number, f: number) => {
  const a = ENTRY[i];
  const s = scatterOf(i);
  const r = restOf(i);
  const g = travel(f, goAt(i), landAt(i), a, s);
  const go = i === EFX ? EFX_GO : ringGo(i);
  const end = i === EFX ? EFX_LAND : ringGo(i) + RING_DUR;
  const m = travel(f, go, end, s, r);
  const w = tileSway(i, f);
  return { x: g.x + (m.x - s.x) + w.dx, y: g.y + (m.y - s.y) + w.dy };
};

// Equifax grows into its spotlight over the same window it travels in.
export const efxSize = (f: number) => {
  const u = flow(clamp01((f - EFX_GO) / (EFX_LAND - EFX_GO)));
  return {
    w: lerp(EFX_REST.w, EFX_SPOT.w, u),
    h: lerp(EFX_REST.h, EFX_SPOT.h, u),
  };
};
export const tileSize = (i: number, f: number) =>
  i === EFX ? efxSize(f) : { w: RING_TILE, h: RING_TILE };

// The ink ladder. The six recede to OP_UNREAD as the subject arrives; the
// subject takes the one click and holds a step above where it started.
export const ringInk = (f: number) => interpolate(f, [DIM_F0, DIM_F1], [OP_READ, OP_UNREAD], clamp);
export const efxInk = (f: number) =>
  f < CLICK_F
    ? OP_READ
    : f < CLICK_F + CLICK_DUR
      ? OP_CLICK
      : interpolate(
          f,
          [CLICK_F + CLICK_DUR, CLICK_F + CLICK_DUR + CLICK_SETTLE],
          [OP_CLICK, OP_EFX_HELD],
          clamp,
        );
export const inkAt = (i: number, f: number) => (i === EFX ? efxInk(f) : ringInk(f));

// ---------------------------------------------------------------------------
// THE CAMERA. Four moves and one held breath, through one damped `runCamera`.
// `cy = CENTER.y + CUT_LIFT / k` off the same eased k, so the content centre
// sits on screen y 790 at every zoom. The centre never moves: everything in
// this cut converges ON CENTER, so a camera that also walked would be a second
// motion doing the same job.
//
// REVISION 1 — SCALE. The whole track is raised by the same shape: nothing in
// the world moved, the lens is simply closer. At the old k 1.00 an 84 px mark
// was 84 screen px — 21 px on a phone — and two thirds of the sheet was empty.
//
//   was  0.94 -> 1.00 -> 1.06 -> 1.22 -> 1.28
//   now  1.12 -> 1.20 -> 1.28 -> 1.40 -> 1.45
//
// and the framing lift goes 125 -> CUT_LIFT 170, putting CENTER on screen y 790
// instead of 835. That is what buys the bottom margin at the new zoom: the
// lower ring tiles sit at world y 1060, their leak reaches world 1272, and at
// k 1.45 that is screen 1424 — inside the 1450 the captions leave. The ring's
// own x extents, world 238..842, come out at screen 102..978.
//
// K_FINAL_1 (1.28) IS STILL 1.28 IN THE SHARED MODULE and is deliberately not
// touched — cut 2 and cut 3 are building against it. This cut no longer
// resolves on it: it resolves on K_FINAL_CUT1 (1.45) with CUT_LIFT (170), both
// exported from this file, and CUT 3 SHOULD OPEN ON THOSE TWO rather than on
// K_FINAL_1, which now describes nothing.
//
// EVERY KEY ENDS SIX FRAMES BEFORE ITS BRIEFED LANDING. The damper
// (CAM_STIFF 0.09 / CAM_DAMP 0.468) costs about six frames on a move this size,
// which is the same allowance the approved D1 cuts make; the briefed landings
// — f30, f66, f100, f122 — are what the scan measures, not the key ends.
//
//   CREEP  f0-f26    1.12 -> 1.20  the gather pulls the lens in; lands f30
//   PRESS  f34-f58   1.20 -> 1.28  onto the leaks; lands f62, before "breaches"
//   PUSH   f72-f90   1.28 -> 1.40  with the resolve; lands f97, before "great"
//   (held breath f100-f106: the camera is the only still thing; the leaks and
//    the sway and the kraft's own drift are all still running under it)
//   LEAN   f106-f114 1.40 -> 1.45  the payoff; lands f122, on "yeah, Equifax"
//
// PRESS AND PUSH BOTH LEAVE EARLIER THAN THE BRIEF KEYS THEM (f34 for f44, f72
// for f78) AND THAT IS THE ONLY REASON. The cut brief's own camera — creep,
// hold, creep, hold, push — parks the lens for 14 frames over f30-f44 and 10
// over f66-f76, and f36-f56 is the one stretch of this cut where nothing else
// is LANDING either — the crowd has settled and the resolve is forty frames
// off, and after REVISION 1 it is the leak wave that carries it. A
// longer, slower 1.20 -> 1.28 creep costs nothing, motivates itself on the
// leaks it is about to be looking at, and takes the zoom's stills to 4, 9 and 9
// frames — which is what the house allows, once. The landings stay ahead of
// their words: f63 is 5 frames before "breaches" and f96 is 10 before "great".
// Measured stills in the zoom: f33-36, f65-73, f99-107, then the resolved hold
// from f125. The hand (`sway`) and the sheet's own drift run under all of them,
// and from f40 so do seven leaks, so none of those windows is a dead frame —
// REVISION 1's leak wave is what fills the f36-f56 stretch those stills used to
// sit in.
//
// THE PEAK ZOOM RATE IS NOW 0.63% A FRAME, on PUSH at f84, and that is the one
// thing in this revision worth a second look. The house floor for a move that
// has to READ as a move is about 1% a frame, and the old track cleared it at
// 0.99%. The briefed endpoints are the reason: 1.28 -> 1.40 is a 9.4% zoom
// where 1.06 -> 1.22 was 15%, so the same 18-frame window carries two thirds of
// the rate. PUSH's window is left exactly as briefed rather than tightened on
// my own judgement — closing it to about 11 frames is what it would take to put
// the peak back at 1%, and that is a different push, not a rescaled one. If the
// spotlight reads soft, that is the knob.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.12;
export const K_LEAK = 1.2;
export const K_BREACH = 1.28;
export const K_SPOT = 1.4;
export const K_FINAL_CUT1 = 1.45;

// The framing lift, this cut's own. `camMove` writes cy off CAM_LIFT (125), so
// every move is re-lifted by the difference against ITS OWN eased k — the whole
// point of taking cy off the eased k rather than off the endpoints is that
// CAM_LIFT / k is not linear in k, and a constant added to cy would undo it.
export const CUT_LIFT = 170;
const relift = (m: { F: number[]; K: number[]; CY: number[] }) => ({
  F: m.F,
  K: m.K,
  CY: m.CY.map((cy, n) => cy + (CUT_LIFT - CAM_LIFT) / m.K[n]),
});

export const CREEP = relift(
  camMove({ f0: 0, f1: 26, k0: K_OPEN, k1: K_LEAK, c0: CENTER.y, c1: CENTER.y }),
);
export const PRESS = relift(
  camMove({
    f0: 34,
    f1: 58,
    k0: K_LEAK,
    k1: K_BREACH,
    c0: CENTER.y,
    c1: CENTER.y,
  }),
);
export const PUSH = relift(
  camMove({
    f0: 72,
    f1: 90,
    k0: K_BREACH,
    k1: K_SPOT,
    c0: CENTER.y,
    c1: CENTER.y,
    warp: 0.82,
  }),
);
export const LEAN = relift(
  camMove({
    f0: 106,
    f1: 114,
    k0: K_SPOT,
    k1: K_FINAL_CUT1,
    c0: CENTER.y,
    c1: CENTER.y,
  }),
);
export const CY_FINAL = CENTER.y + CUT_LIFT / K_FINAL_CUT1;
export const CAM_F = [...CREEP.F, ...PRESS.F, ...PUSH.F, ...LEAN.F, DURATION];
export const CAM_K = [...CREEP.K, ...PRESS.K, ...PUSH.K, ...LEAN.K, K_FINAL_CUT1];
export const CAM_CY = [...CREEP.CY, ...PRESS.CY, ...PUSH.CY, ...LEAN.CY, CY_FINAL];

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // the ripe tone: Equifax's leak once it is the subject
  accentDeep: z.string(), // the set's shared palette
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  ringTile: z.number(),
  leakFall: z.number(),
  leakLife: z.number(),
  beats: z.object({
    many: z.number(), // "many"
    companies: z.number(), // "companies"
    have: z.number(), // "have"
    had: z.number(), // "had"
    humongous: z.number(), // "humongous" — the crowd finishes landing
    data: z.number(), // "data" — the leaks are two frames old
    breaches: z.number(), // "breaches" — every tile is leaking
    youKnow: z.number(), // "you know"
    equifax1: z.number(), // "Equifax" — the ink click, the leak turns amber
    was: z.number(), // "was"
    a: z.number(), // "a"
    great: z.number(), // "great" — the push has landed; held breath
    yeah: z.number(), // "yeah"
    equifax2: z.number(), // "Equifax" — the lean-in has landed
    end: z.number(), // speech ends; tail to 152
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  ringTile: RING_TILE,
  leakFall: LEAK_FALL,
  leakLife: LEAK_LIFE,
  beats: {
    many: 0,
    companies: 7,
    have: 19,
    had: 27,
    humongous: 36,
    data: 58,
    breaches: 68,
    youKnow: 85,
    equifax1: 86,
    was: 97,
    a: 102,
    great: 106,
    yeah: 109,
    equifax2: 121,
    end: 136,
  },
});

// Every dot in the air at a frame, for every tile, with the colour its own tile
// gives it. Equifax is the only tile whose leak changes: the dots born before
// its word stay ink and finish their fall, and only the ones born after it are
// amber, which is why `leakDots` hands back each dot's birth frame.
type Dot = { key: string; x: number; y: number; opacity: number; color: string };

const dotsFor = (
  i: number,
  frame: number,
  ink: string,
  accent: string,
  fall: number,
  life: number,
): Dot[] => {
  const p = tileAt(i, frame);
  const s = tileSize(i, frame);
  const y = p.y + s.h / 2;
  const alpha = inkAt(i, frame);
  const start = leakStart(i);
  if (i !== EFX) {
    return leakDots({
      frame,
      seed: 3 + i * 17,
      start,
      rate: LEAK_SLOW,
      x: p.x,
      y,
      width: LEAK_W_RING,
      fall,
      life,
    }).map((d) => ({ key: `r${i}-${d.key}`, x: d.x, y: d.y, opacity: d.opacity * alpha, color: ink }));
  }
  const slow = leakDots({
    frame,
    seed: 401,
    start,
    rate: LEAK_SLOW,
    x: p.x,
    y,
    width: LEAK_W_EFX,
    fall,
    life,
  })
    .filter((d) => d.birth < CLICK_F)
    .map((d) => ({ key: `e${d.key}`, x: d.x, y: d.y, opacity: d.opacity * OP_READ, color: ink }));
  const fast = leakDots({
    frame,
    seed: 733,
    start: CLICK_F,
    rate: LEAK_FAST,
    x: p.x,
    y,
    width: LEAK_W_EFX,
    fall,
    life,
  }).map((d) => ({ key: `a${d.key}`, x: d.x, y: d.y, opacity: d.opacity * alpha, color: accent }));
  return [...slow, ...fast];
};

const ManyCompanies: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  leakFall,
  leakLife,
}) => {
  const frame = useCurrentFrame();

  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTER.x + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const tiles = Array.from({ length: N_ALL }, (_, i) => {
    const p = tileAt(i, frame);
    const s = tileSize(i, frame);
    return { i, brand: CAST[i], x: p.x, y: p.y, w: s.w, h: s.h, op: inkAt(i, frame) };
  });

  const dots: Dot[] = [];
  for (let i = 0; i < N_ALL; i++)
    dots.push(...dotsFor(i, frame, ink, accent, leakFall, leakLife));

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CENTER.x}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the breaches. UNDER every tile, so a record comes out from
                beneath its own bottom edge and goes behind anything it
                reaches on the way down. */}
            {dots.map((d) => (
              <DataDot key={d.key} x={d.x} y={d.y} k={k} opacity={d.opacity} color={d.color} />
            ))}

            {/* the seven companies. The six squares are drawn first so the
                wordmark is on top of them as it arrives at the centre. */}
            {tiles.map((t) => (
              <BrandTile
                key={t.brand}
                x={t.x}
                y={t.y}
                brand={t.brand}
                w={t.w}
                h={t.h}
                k={k}
                opacity={t.op}
              />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

export default ManyCompanies;
