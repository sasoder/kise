import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_LIFT, FRAME_H, camEase, clamp01, hash, smoothstep, sway } from "./fieldShared";
import {
  BLACK,
  BLUE,
  ORANGE,
  PURPLE,
  SHADOW,
  WHITE,
  World,
  runCamera2,
  worldToScreen,
} from "./cottageShared";

export const FPS = 24;
// Clip "anna - elon", the line at 35.30 s on the edit timeline:
//   "I'm also not, you know, in the business of encouraging fascism to take
//    over social media."
// f0 = 35.30 s; a word at t seconds lands on frame round((t - 35.30) * 24).
// Speech ends at f115 ("media" 106-115); the next line ("So maybe he should be
// more careful") starts at f119, and the resolved frame holds under it to the
// end: 116 frames of speech + a 28-frame tail = 144.
export const DURATION = 144;

// ---------------------------------------------------------------------------
// "NOT IN THE BUSINESS" V2 — "LOCKSTEP". Core memory podcast graphic standard
// (reference `PeakForSolar.tsx`), in the world of this speaker's previous clip
// (`cottageShared.tsx`, imported read-only: colours, SHADOW, the paper, World,
// runCamera2, worldToScreen).
//
// V1 was a typographic placard (her words in huge type over a grid of X app
// tiles) and was rejected as forced, ugly and confusing. V2 has NO TEXT AT ALL:
// no letters, labels or numbers. The one mark is the X logo, as a glyph.
//
// THE IDEA. Social media is a free crowd of white dots, each drifting its own
// way, with the X at its centre. From the X a wave turns the crowd into a rigid
// rectangle of rank and file that marches in lockstep: the uniformity takes
// over. She is not part of it: the wave stops short of her, and the few dots
// around her stay free. The chain colours are her verdict — "not" — and appear
// on her crown and nowhere else; never on the X, never on a dot.
//
// THE BEATS (whisper word onsets, frames by the rule above):
//   not 1-15 · you know 18-28 · in 31 · the 33 · business 36 · of 40 ·
//   encouraging 46-56 · fascism 56-73 · to 73 · take 79 · over 84-90 ·
//   social 90 · media 106-115 · (next line 119)
//
// HOUSE STYLE. 1080x1920, 24 fps, OPAQUE. PaperGround (dimmed 0.88, blurred
// 3 px, parallax 0.15, drift -0.3 px/f) via cottageShared's World. White
// #FFFFFF ink; every white element sits on a #000000 copy at +4/+4 world px,
// zero blur, drawn as an SVG copy. Chain #FFB765 / #BC37FF / #0046FF raw: no
// bloom, blend, gradient, glow or opacity on any colour layer. Nothing fades,
// nothing springs or overshoots, nothing flashes.
//
// V2 ROUND 2, on the director's review ("the idea reads; at rest everything is
// too small and too dense"): fewer, bigger dots (r 12 -> 18, pitch 56 -> 74),
// a bigger X (120 -> 170), a bigger her (head r 52 -> 64, her dots r 18), and
// a tight composition that fills the column at rest (k ~1). Timings unchanged.
//
// THE OBJECTS, world px (k = 1: one world px = one screen px), on x 540.
//   HER — public/person.png rebuilt as one SVG path, measured off the 512 px
//     PNG (alpha coverage per row; area and centroid fits; residual 0.2 px):
//       head: circle, centre (256.0, 143.35), r 102.39
//       body: top 265.8, foot 471.07, half-width 215 (x 41..471); a flat top
//             of half-width 19 running into an elliptical shoulder arc
//             (rx 196, ry 193) that meets the vertical side at y 458.8; bottom
//             corners r 11
//       gap head -> body 20.1; glyph 430 x 430.1
//     drawn at head r 64 (scale 0.6251): glyph 268.9 x 268.8, head centre
//     204.85 above the foot, body top 128.31 above it, half-width 134.39,
//     flat 11.88, arc 122.51 x 120.64, corners 6.88. Her place is derived
//     from the crowd: her crown top sits GAP_TO_HER = 160 below the crowd's
//     lowest ink (959.9), so her glyph centre is (540, 1290.3), top 1155.9,
//     foot 1424.7 (+4 shadow = COMP_BOTTOM 1428.7).
//   THE CROWD — 74 dots: 68 that regiment + her 6. Poisson-disk (Bridson,
//     min separation 62, seed 7) over a superellipse (n 2.4, semi-axes
//     445 x 290) centred on the X at (540, 690), then thinned by a feather
//     (fieldShared's rule: a seat survives if a draw falls under it; its
//     radius is 18 * (0.7 + 0.3 * feather), so 14.4..18). The feather is 2.5
//     rows (x 62 px) wide, straddling the boundary; on the lower edge, facing
//     her, it is 3.5 rows and sits further in, so the crowd thins toward her.
//     The count is made exact (68) by dropping the most-feathered survivor.
//     Clear radius 156 round the X (110 scaled with the X). Extent x 79..996,
//     y 384..960. Her 6 dots (r 18) are placed by hand, loosely and
//     asymmetrically at her sides and shoulders, 206-232 px from her centre,
//     none above her crown.
//     WANDER: two sines per axis per dot, amplitudes 3.75-5 + 1.5-2 px
//     (<= 7 per axis, <= 9.9 overall), periods 60-120 f, own phases: never in
//     unison.
//   THE X — simple-icons "x" (the X logo, 24-unit viewBox, copied from
//     TwitterToX.tsx's X_PATH), 170 wide x 153.7 tall, bbox centred on
//     (540, 690), on the hard shadow. No tile, no colour. It never moves.
//   THE FORMATION — a square lattice, pitch 74, 11 x 7 centred on the X, less
//     the X's clear 3 x 3 cell = 68 slots, exactly one per regimenting dot.
//     Dot centres x 170..910, y 468..912 — the one hard rectangle in the piece.
//     The X sits in the 3 x 3 hole with 45 px (sideways) / 53 px (vertically)
//     between its ink and the nearest dot edges.
//     ASSIGNMENT: one L2-optimal matching (Kuhn-Munkres on squared travel) of
//     all 68 dots onto the 68 slots: the least total movement, and order-
//     preserving, so the crowd contracts onto the lattice instead of dots
//     swapping sides. Travel max 101 px, mean 49; no two paths cross.
//
// THE GESTURES — one continuous evolving picture; each gesture has its words.
//   1. f0-28   "not". SHE ENTERS AS THE CORE MEMORY STACK: orange silhouette
//              copy f0, purple f2, blue f4, white core + its shadow f6, each
//              rising 90 world px to its own rest on Easing.bezier(0.16, 1,
//              0.3, 1) over 22 f (core lands f28). At rest the colours are her
//              CROWN: whole-silhouette copies 12 (blue) / 24 (purple) / 36
//              (orange) px above the core, showing as rims over her head and
//              shoulders; the core's shadow sits at the back of the stack.
//              Her 6 free dots are around her, wandering, from f0; the crowd's
//              lowest dots peek in at the top edge (the X does not).
//   2. f15-24  "you know". Hold: the camera's creep-in (k 2.05 -> 2.07), the
//              paper's drift, the dots' wander. Nothing else.
//   3. f23-56  "in the business of encouraging". THE PULL-BACK: one eased move
//              back and up (see THE CAMERA). The crowd has existed from f0 —
//              wandering — and slides in from the top; the X enters at f29.
//              Landed (99%) by ~f53, still by f60.
//   4. f56-72  "fascism". THE SEED RING: the 16 dots the matching sends to the
//              16 slots round the X's cell (+2 neighbours sitting on those
//              slots, see MAKE WAY) set off f56.2-59.8 (58 +- 2, hashed),
//              glide into their slots over 10 f on a smoothstep (radius easing
//              to 18 with them), and land f66-70: a square of order round the
//              X. They join the march on the next beat, f72.
//   5. f79-112 "take over social media". THE FRONT: a growing copy of the
//              crowd's own outline, expanding from the X on one eased AREA
//              clock (radius^2 on a smoothstep, f79 -> f100) so the number of
//              dots it reaches per frame rises and falls smoothly (starts f79
//              -> f99, 1-4 a frame). Each dot glides into its slot over 10 f
//              when the front reaches it (+-2 f hashed), its radius easing to
//              18 so the formation is uniform, and joins the march on the next
//              beat. The last lands f109.8. The front STOPS at a clearance of
//              270 round her centre: her dots never regiment and keep
//              wandering.
//   6. f112-143 HOLD on the resolved frame: the formation marches in unison
//              (f120, f132), her dots drift, she stands with her crown.
//   THE MARCH: a global clock. Every 12 f (beats 72, 84, 96, 108, 120, 132) all
//   regimented dots dip 10 px down and back up on one 8 f raised cosine,
//   exactly in phase; a dot joins on the first beat after it lands.
//   MAKE WAY (no new gesture — collision handling): a dot that has not yet
//   landed is eased aside by dots that have already set off, via a monotone
//   separation map (see `dotsAt`) that fades to zero as it lands; and a dot
//   still wandering within 36 px of a slot when that slot's dot sets off sets
//   off with it (12 dots, 2 of them with the seed). Measured on every frame:
//   the closest any two dot edges come is 13.8 px.
//
// THE CAMERA — cottageShared's runCamera2 (the house CAM_STIFF / CAM_DAMP
// tracker with an x channel) on a per-frame track of three summed eased glides
// (camEase). Each glide eases k AND the screen y of the composition's bottom
// (her foot's shadow) on one curve and cy is solved from the two, so the foot
// can never swing below its landing. cx is 540 throughout; the hand's sway on
// top.
//   OPEN   f0        k 2.05, her crowned glyph (crown top .. foot shadow,
//                    centre 1274.3) on screen y 835; her dots' outer edges at
//                    screen x 95..1005
//   CREEP  f0-30     k +0.03, warp 1, centre held
//   MOVE   f20-50    k -> K_REST, the whole composition (crowd top 383.8 ..
//                    foot shadow 1428.7, centre 906.2) on 835; warp 0.6, speed
//                    early. K_REST = 0.9776, set by the crowd's width: its 921
//                    world px (with shadow) fill screen x 89..990.
//   CREEP  f54-150   k -0.03, re-centring on the FORMATION's composition
//                    (formation top 450 .. 1428.7, centre 939.4) as it squares
//                    up; still creeping on the last frame
//   THE DAMPED NUMBERS (no sway):
//     f     k        cx       cy
//     0     2.0500   540.00   1335.26   open
//     26    1.9297   540.00   1313.43   the pull-back under way
//     56    0.9813   540.00   1036.25   "fascism": landed (0.22 %/f of k)
//     79    0.9739   540.00   1038.53   "take"
//     112   0.9599   540.00   1055.74   formation complete
//     143   0.9488   540.00   1069.73   last frame
//   MEASURED, every frame, sway included:
//     open f0-24: her, her 6 dots, and the crowd's 11 lowest dots cut by the
//       top edge; the X's ink is 197 px above the frame at f0 and enters f29.
//     rest (f60): crowd top screen y 324, foot shadow 1346 (centred on 835),
//       crowd x 89..990. Resolved (f143): formation x 172..912, y 367..827,
//       her foot shadow 1296.
//     caption band: the lowest ink anywhere is screen y 1351.6 (f82); nothing
//       below 1400 on any frame (asserted at module load).
//     speeds: a dot's own glide peaks at 15.3 screen px/f; during the pull-back
//       the camera carries the entering crowd at up to 56.9 px/f (f34).
//
// DEVIATIONS from the brief, and why (round 1's accepted by the director).
//   * K_OPEN 2.05, NOT ~1.6: the tightest open that keeps her 6 dots inside
//     the frame with ~65 px to spare, and so hides the most of the crowd.
//   * THE SEED IS THE WHOLE FIRST RING, 16 (+2), NOT ~8: 8 of the ring's 16
//     slots filled scattered round the X and did not read as order.
//   * THE ASSIGNMENT IS ONE L2-OPTIMAL MATCHING, not greedy nearest-slot in
//     wave order (greedy left long crossing paths and an overlap); the
//     timing still follows the wave.
//   * REGIMENTED DOTS EASE TO ONE SIZE (r 18) on their glide; her dots keep
//     theirs (also 18). No colour changes anywhere.
//   * THE MOVE'S KEYS ARE f20-50 (brief f26-54), so it lands before
//     "fascism" despite the damper's lag.
//   Round 2:
//   * MIN SEPARATION 62, NOT ~66. At 66, a crowd that spans x 90..990 holds
//     only 47-58 dots, which forces a 9 x 7 formation (54) that resolves to a
//     628 px-wide rectangle — small again. At 62 the crowd holds 68 and the
//     11 x 7 formation resolves 740 px wide.
//   * THE REST SPAN IS SCREEN y 324..1346 (x 89..990), not 330..1380: centred
//     on 835 as the house rule asks, with k set by the crowd's width (the
//     binding limit), the composition spans 1022 px.
//   * 11 CROWD DOTS PEEK IN AT THE OPEN, cut by the top edge (the director
//     allowed "a few"). Fewer would need a wider gap to her (smaller at rest)
//     or a tighter open (her dots off the sides).
//   * HER 6 DOTS WERE RE-PLACED, not just scaled: at her sides and shoulders
//     and none above her crown, so they fit the tight open and keep the gap
//     between the crowd and her clear.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE BEATS. f = round((t - 35.30) * 24).
// ---------------------------------------------------------------------------
export const BEATS = {
  not: 1,
  youKnow: 18,
  in: 31,
  the: 33,
  business: 36,
  of: 40,
  encouraging: 46,
  fascism: 56,
  to: 73,
  take: 79,
  over: 84,
  social: 90,
  media: 106,
  speechEnd: 115,
  nextLine: 119,
};

// ---------------------------------------------------------------------------
// HER — public/person.png rebuilt as a path. Measured off the 512 px PNG
// (alpha coverage per row, area and centroid fits):
// ---------------------------------------------------------------------------
const PNG = {
  headCy: 143.35,
  headR: 102.39,
  bodyTop: 265.8,
  foot: 471.07,
  halfW: 215,
  flatHalf: 19,
  rx: 196,
  ry: 193,
  corner: 11,
  top: 40.96,
};
export const HEAD_R = 64;
export const P_SCALE = HEAD_R / PNG.headR;
export const HEAD_UP = (PNG.foot - PNG.headCy) * P_SCALE; // head centre above the foot
export const BODY_UP = (PNG.foot - PNG.bodyTop) * P_SCALE; // body top above the foot
export const BODY_HALF = PNG.halfW * P_SCALE;
export const FLAT_HALF = PNG.flatHalf * P_SCALE;
export const BODY_RX = PNG.rx * P_SCALE;
export const BODY_RY = PNG.ry * P_SCALE;
export const CORNER = PNG.corner * P_SCALE;
export const HER_H = (PNG.foot - PNG.top) * P_SCALE; // 268.9

/** The glyph in local coords: x about her axis, y up from the foot (foot = 0). */
const n2 = (v: number) => Number(v.toFixed(3));
export const PERSON_D = (() => {
  const hy = -HEAD_UP;
  const bt = -BODY_UP;
  const r = HEAD_R;
  const head = `M${n2(-r)} ${n2(hy)} a${r} ${r} 0 1 0 ${n2(2 * r)} 0 a${r} ${r} 0 1 0 ${n2(-2 * r)} 0 Z`;
  const body = [
    `M${n2(-FLAT_HALF)} ${n2(bt)}`,
    `H${n2(FLAT_HALF)}`,
    `A${n2(BODY_RX)} ${n2(BODY_RY)} 0 0 1 ${n2(BODY_HALF)} ${n2(bt + BODY_RY)}`,
    `V${n2(-CORNER)}`,
    `A${n2(CORNER)} ${n2(CORNER)} 0 0 1 ${n2(BODY_HALF - CORNER)} 0`,
    `H${n2(-BODY_HALF + CORNER)}`,
    `A${n2(CORNER)} ${n2(CORNER)} 0 0 1 ${n2(-BODY_HALF)} ${n2(-CORNER)}`,
    `V${n2(bt + BODY_RY)}`,
    `A${n2(BODY_RX)} ${n2(BODY_RY)} 0 0 1 ${n2(-FLAT_HALF)} ${n2(bt)}`,
    "Z",
  ].join(" ");
  return `${head} ${body}`;
})();

// ---------------------------------------------------------------------------
// THE WORLD, world px, everything centred on x 540.
// ---------------------------------------------------------------------------
export const AXIS_X = 540;
export const X_CY = 690; // the X, and the crowd's centre
export const X_W = 170;
// simple-icons "x" (the X logo), 24-unit viewBox — copied from TwitterToX.tsx
export const X_PATH =
  "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z";
const X_UNITS = { x0: 0, x1: 24, y0: 1.153, y1: 22.846 };
export const X_SCALE = X_W / (X_UNITS.x1 - X_UNITS.x0);
export const X_H = (X_UNITS.y1 - X_UNITS.y0) * X_SCALE;
const X_TX = AXIS_X - ((X_UNITS.x0 + X_UNITS.x1) / 2) * X_SCALE;
const X_TY = X_CY - ((X_UNITS.y0 + X_UNITS.y1) / 2) * X_SCALE;


// -- the crowd --------------------------------------------------------------
export const DOT_R = 18;
export const MIN_SEP = 62;
export const BLOB_A = 445;
export const BLOB_B = 290;
export const BLOB_N = 2.4;
export const X_CLEAR = 156; // 110 scaled with the X (120 -> 170)
export const ROW = MIN_SEP; // one "row" of the Poisson crowd, px, for the feather
export const FEATHER_ROWS = 2.5;
export const EDGE_OUT = 1.25; // rows past the nominal boundary where density reaches 0
export const TAIL_ROWS = 3.5; // the lower edge (facing her) thins over more rows...
export const TAIL_OUT = 0.7; // ...inward: it does not reach further down
export const CLEARANCE = 270; // the front stops this far from her centre
export const CROWD_SEED = 7;

/** Superellipse boundary radius in the direction (ux, uy). */
const boundaryR = (ux: number, uy: number) =>
  Math.pow(Math.pow(Math.abs(ux) / BLOB_A, BLOB_N) + Math.pow(Math.abs(uy) / BLOB_B, BLOB_N), -1 / BLOB_N);

/** The blob's own normalised radius: 0 at the X, 1 on its boundary. */
export const blobRho = (x: number, y: number) => {
  const dx = x - AXIS_X;
  const dy = y - X_CY;
  const r = Math.hypot(dx, dy);
  if (r < 1e-9) return 0;
  return r / boundaryR(dx / r, dy / r);
};

/** How far below the axis a direction points, 0..1: the lower edge faces her. */
const downness = (x: number, y: number) => {
  const dx = x - AXIS_X;
  const dy = y - X_CY;
  const r = Math.hypot(dx, dy) || 1;
  return smoothstep((dy / r - 0.35) / 0.55);
};

/** 0..1: the chance a seat exists, and the scale of its radius. */
export const crowdFeather = (x: number, y: number) => {
  const dx = x - AXIS_X;
  const dy = y - X_CY;
  const r = Math.hypot(dx, dy);
  if (r < 1e-9) return 1;
  const ux = dx / r;
  const uy = dy / r;
  const theta = Math.atan2(uy, ux);
  const wob = 0.35 * (Math.sin(theta * 3 + 1.3) * 0.6 + Math.sin(theta * 5 + 4.1) * 0.4);
  const R = boundaryR(ux, uy);
  const down = downness(x, y);
  // the feather straddles the nominal boundary: half density ON it
  const width = FEATHER_ROWS + down * (TAIL_ROWS - FEATHER_ROWS);
  const out = EDGE_OUT + down * (TAIL_OUT - EDGE_OUT);
  const insideRows = (R - r) / ROW + wob + out;
  return smoothstep(clamp01(insideRows / width));
};

// seeded PRNG (mulberry32) — deterministic layout
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Bridson Poisson-disk sampling over the region where the feather is > 0. */
export const poisson = (seed: number, minSep: number = MIN_SEP) => {
  const rnd = mulberry32(seed);
  const x0 = AXIS_X - BLOB_A - 120;
  const x1 = AXIS_X + BLOB_A + 120;
  const y0 = X_CY - BLOB_B - 120;
  const y1 = X_CY + BLOB_B + (EDGE_OUT + 1) * ROW + 40;
  const cell = minSep / Math.SQRT2;
  const gw = Math.ceil((x1 - x0) / cell);
  const gh = Math.ceil((y1 - y0) / cell);
  const grid: number[] = new Array(gw * gh).fill(-1);
  const pts: { x: number; y: number }[] = [];
  const inRegion = (x: number, y: number) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1 && crowdFeather(x, y) > 0 &&
    Math.hypot(x - AXIS_X, y - X_CY) >= X_CLEAR;
  const fits = (x: number, y: number) => {
    const gx = Math.floor((x - x0) / cell);
    const gy = Math.floor((y - y0) / cell);
    for (let j = Math.max(0, gy - 2); j <= Math.min(gh - 1, gy + 2); j++) {
      for (let i = Math.max(0, gx - 2); i <= Math.min(gw - 1, gx + 2); i++) {
        const q = grid[j * gw + i];
        if (q >= 0 && Math.hypot(pts[q].x - x, pts[q].y - y) < minSep) return false;
      }
    }
    return true;
  };
  const add = (x: number, y: number) => {
    pts.push({ x, y });
    grid[Math.floor((y - y0) / cell) * gw + Math.floor((x - x0) / cell)] = pts.length - 1;
    return pts.length - 1;
  };
  const active: number[] = [add(AXIS_X + X_CLEAR + 30, X_CY + 10)];
  while (active.length) {
    const ai = Math.floor(rnd() * active.length);
    const p = pts[active[ai]];
    let placed = false;
    for (let t = 0; t < 40; t++) {
      const ang = rnd() * Math.PI * 2;
      const rad = minSep * (1 + 0.5 * rnd());
      const x = p.x + Math.cos(ang) * rad;
      const y = p.y + Math.sin(ang) * rad;
      if (inRegion(x, y) && fits(x, y)) {
        active.push(add(x, y));
        placed = true;
        break;
      }
    }
    if (!placed) active.splice(ai, 1);
  }
  return pts;
};

/** Her own few free dots, placed by hand round her glyph centre (dx, dy, r):
 *  loose and asymmetric, at her sides and shoulders, none above her crown, so
 *  the gap between the crowd and her stays clear. */
export const POCKET: { dx: number; dy: number; r: number }[] = [
  { dx: -205, dy: 18, r: DOT_R },
  { dx: -170, dy: -136, r: DOT_R },
  { dx: -196, dy: 124, r: DOT_R },
  { dx: 156, dy: -150, r: DOT_R },
  { dx: 210, dy: -24, r: DOT_R },
  { dx: 198, dy: 108, r: DOT_R },
];

export type Dot = {
  x: number;
  y: number;
  r: number;
  free: boolean;
  rho: number;
  // wander: two sinusoids per axis, periods 60-120 f, own phases
  wx: [number, number, number, number, number, number];
  wy: [number, number, number, number, number, number];
};

export const WANDER_A1 = 5;
export const WANDER_A2 = 2;

const makeWander = (i: number, k: number): Dot["wx"] => [
  WANDER_A1 * (0.75 + 0.25 * hash(i, k + 1)),
  60 + 60 * hash(i, k + 2),
  Math.PI * 2 * hash(i, k + 3),
  WANDER_A2 * (0.75 + 0.25 * hash(i, k + 4)),
  60 + 60 * hash(i, k + 5),
  Math.PI * 2 * hash(i, k + 6),
];

export const FORM_COLS = 11;
export const FORM_ROWS = 7;
/** The formation's slot count: the rectangle less the X's clear 3 x 3 cell. */
export const N_SLOTS = FORM_COLS * FORM_ROWS - 9;

/** THE CROWD (all of it regiments): Poisson seats thinned by the feather. */
const CROWD: Dot[] = (() => {
  const raw = poisson(CROWD_SEED);
  const rnd = mulberry32(CROWD_SEED * 31 + 5);
  // Thinning by the feather: a seat survives if a uniform draw falls under
  // its feather (fieldShared's rule). The count is then made exact by
  // dropping the most-feathered survivors (or restoring the least-feathered
  // rejects), so the interior is never thinned.
  const scored = raw.map((p) => {
    const f = crowdFeather(p.x, p.y);
    return { ...p, f, keep: rnd() < f };
  });
  const kept0 = scored.filter((p) => p.keep).sort((a, b) => b.f - a.f);
  const rejected = scored.filter((p) => !p.keep).sort((a, b) => b.f - a.f);
  const kept = (
    kept0.length >= N_SLOTS ? kept0.slice(0, N_SLOTS) : [...kept0, ...rejected.slice(0, N_SLOTS - kept0.length)]
  ).sort((a, b) => a.y - b.y || a.x - b.x);
  return kept.map((p, i) => ({
    x: p.x,
    y: p.y,
    r: DOT_R * (0.7 + 0.3 * p.f),
    free: false,
    rho: blobRho(p.x, p.y),
    wx: makeWander(i, 10),
    wy: makeWander(i, 20),
  }));
})();

// -- her place, from the crowd ---------------------------------------------------
/** Edge-to-edge, world px, between the crowd's lowest ink and the top of her
 *  (her crown, or her highest free dot, whichever is higher). */
export const GAP_TO_HER = 160;
export const CROWN_STEP = 12;
export const CROWN = 3 * CROWN_STEP;
export const CROWD_BOTTOM = Math.max(...CROWD.map((d) => d.y + d.r));
/** How far above her glyph centre she (crown) or her dots reach. */
const HER_REACH_UP = Math.max(HER_H / 2 + CROWN, ...POCKET.map((q) => q.r - q.dy));
export const HER_CY = CROWD_BOTTOM + GAP_TO_HER + HER_REACH_UP; // glyph centre
export const HER_FOOT = HER_CY + HER_H / 2;
export const HER_TOP = HER_FOOT - HER_H;

export const DOTS: Dot[] = [
  ...CROWD,
  ...POCKET.map((q, k) => {
    const x = AXIS_X + q.dx;
    const y = HER_CY + q.dy;
    const i = CROWD.length + k;
    return { x, y, r: q.r, free: true, rho: blobRho(x, y), wx: makeWander(i, 10), wy: makeWander(i, 20) };
  }),
];
// the front stops short of her: no crowd dot may sit inside her clearance
for (const d of CROWD) {
  if (Math.hypot(d.x - AXIS_X, d.y - HER_CY) < CLEARANCE) {
    throw new Error("NotInTheBusinessV2: a crowd dot sits inside her clearance");
  }
}

export const wander = (d: Dot, f: number) => ({
  x:
    d.wx[0] * Math.sin((2 * Math.PI * f) / d.wx[1] + d.wx[2]) +
    d.wx[3] * Math.sin((2 * Math.PI * f) / d.wx[4] + d.wx[5]),
  y:
    d.wy[0] * Math.sin((2 * Math.PI * f) / d.wy[1] + d.wy[2]) +
    d.wy[3] * Math.sin((2 * Math.PI * f) / d.wy[4] + d.wy[5]),
});

// -- the formation ------------------------------------------------------------
export const PITCH = 74;
export const REG = DOTS.map((d, i) => (d.free ? -1 : i)).filter((i) => i >= 0);
export const N_REG = REG.length;
export const SLOTS: { x: number; y: number }[] = (() => {
  const s: { x: number; y: number }[] = [];
  const hc = (FORM_COLS - 1) / 2;
  const hr = (FORM_ROWS - 1) / 2;
  for (let r = -hr; r <= hr; r++) {
    for (let c = -hc; c <= hc; c++) {
      if (Math.abs(c) <= 1 && Math.abs(r) <= 1) continue; // the X's clear cell
      s.push({ x: AXIS_X + c * PITCH, y: X_CY + r * PITCH });
    }
  }
  return s;
})();

// -- the assignment -----------------------------------------------------------
/** Kuhn-Munkres on a square cost matrix: row -> column, minimum total cost. */
const hungarian = (cost: number[][]): number[] => {
  const n = cost.length;
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(Infinity);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const ans = new Array<number>(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j] > 0) ans[p[j] - 1] = j - 1;
  return ans;
};

/** dot index -> slot index (-1 for her free dots). One L2-optimal matching
 *  of the whole crowd onto the lattice: the least total squared travel. It is
 *  order-preserving — for any two dots (p1 - p2) . (s1 - s2) >= 0 — so the
 *  crowd contracts onto the lattice without two paths swapping sides. */
export const SLOT_OF: number[] = (() => {
  if (N_REG !== SLOTS.length) {
    throw new Error(`NotInTheBusinessV2: ${N_REG} regimenting dots for ${SLOTS.length} slots`);
  }
  const cost = REG.map((i) => SLOTS.map((sl) => (sl.x - DOTS[i].x) ** 2 + (sl.y - DOTS[i].y) ** 2));
  const match = hungarian(cost);
  const slotOf = new Array<number>(DOTS.length).fill(-1);
  REG.forEach((i, k) => {
    slotOf[i] = match[k];
  });
  return slotOf;
})();

/** THE SEED RING: the 16 slots round the X's clear 3 x 3 cell, and the dots
 *  the matching sends there — the dots nearest the X. */
const isInnerRing = (sl: { x: number; y: number }) =>
  Math.max(Math.abs(sl.x - AXIS_X), Math.abs(sl.y - X_CY)) < 2.5 * PITCH;
export const IS_SEED = new Set(REG.filter((i) => isInnerRing(SLOTS[SLOT_OF[i]])));
export const SEED_COUNT = IS_SEED.size;
/** Wave order: the seed ring first, then everyone else by the blob's own
 *  normalised radius (the front is a growing copy of the blob's outline). */
export const ORDER: number[] = [
  ...REG.filter((i) => IS_SEED.has(i)),
  ...REG.filter((i) => !IS_SEED.has(i)).sort((a, b) => DOTS[a].rho - DOTS[b].rho),
];

// -- the timing ---------------------------------------------------------------
export const GLIDE_F = 10; // frames a dot takes to glide into its slot
export const GLIDE_JITTER = 2; // +- frames of hashed start
export const SEED_F = 58; // the seed ring sets off on "fascism"
export const FRONT_F0 = BEATS.take; // 79: the front leaves the seed ring
export const FRONT_F1 = 100; // ...and reaches the last regimenting dot
export const FRONT_WARP = 1;
export const MARCH_PERIOD = 12;
export const MARCH_PHASE = 0; // beats on multiples of 12: 72, 84 "over", 96, 108, 120, 132
export const MARCH_DIP = 10;
export const MARCH_F = 8;
export const R_FORM = DOT_R; // every regimented dot ends the same size

const RHO_S = Math.min(...ORDER.slice(SEED_COUNT).map((i) => DOTS[i].rho));
const RHO_E = Math.max(...ORDER.map((i) => DOTS[i].rho));
/** The front's radius on an AREA clock: the swept area grows on one eased
 *  curve, so the rate of dots it reaches rises and falls smoothly. */
export const frontRho = (f: number) =>
  Math.sqrt(
    RHO_S * RHO_S +
      (RHO_E * RHO_E - RHO_S * RHO_S) * camEase((f - FRONT_F0) / (FRONT_F1 - FRONT_F0), FRONT_WARP),
  );

/** The frame the front reaches blob radius rho (bisection on the eased clock). */
const frontAt = (rho: number) => {
  let lo = FRONT_F0;
  let hi = FRONT_F1;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (frontRho(mid) < rho) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

export type Plan = { start: number; land: number; beat: number; sx: number; sy: number };
/** NO SLOT FILLS ON A WANDERER: if a dot is still wandering within
 *  CLEAR_OF_SLOT px of a slot when that slot's dot sets off, it sets off too
 *  (CLEAR_LEAD frames later) — so the wave carries its neighbours along
 *  instead of landing on them. One pass in wave order. */
export const CLEAR_OF_SLOT = 2 * DOT_R;
export const CLEAR_LEAD = 1;
export const PULLED: number[] = [];
export const PLAN: (Plan | null)[] = (() => {
  const start = DOTS.map((d, i) => {
    if (d.free) return NaN;
    const jitter = GLIDE_JITTER * (2 * hash(i, 91) - 1);
    return IS_SEED.has(i) ? SEED_F + jitter : Math.max(FRONT_F0, frontAt(d.rho) + jitter);
  });
  const byStart = [...REG].sort((a, b) => start[a] - start[b]);
  for (const a of byStart) {
    const sa = SLOTS[SLOT_OF[a]];
    for (const b of REG) {
      if (start[b] <= start[a] + CLEAR_LEAD) continue;
      if (Math.hypot(DOTS[b].x - sa.x, DOTS[b].y - sa.y) < CLEAR_OF_SLOT) {
        start[b] = start[a] + CLEAR_LEAD;
        PULLED.push(b);
      }
    }
  }
  return DOTS.map((d, i) => {
    if (d.free) return null;
    const land = start[i] + GLIDE_F;
    const beat = Math.ceil((land - MARCH_PHASE) / MARCH_PERIOD) * MARCH_PERIOD + MARCH_PHASE;
    const sl = SLOTS[SLOT_OF[i]];
    return { start: start[i], land, beat, sx: sl.x, sy: sl.y };
  });
})();

/** The march: every regimented dot dips MARCH_DIP px on the same beat. */
export const marchDip = (f: number, beat: number) => {
  if (f < beat) return 0;
  const u = ((f - MARCH_PHASE) % MARCH_PERIOD) / MARCH_F;
  if (u >= 1) return 0;
  return MARCH_DIP * 0.5 * (1 - Math.cos(2 * Math.PI * u));
};

/** Processing order for a frame: every regimenting dot by its start, her
 *  free dots last. A dot's position depends only on dots earlier in it. */
const START_ORDER: number[] = DOTS.map((_, i) => i).sort((a, b) => {
  const sa = PLAN[a]?.start ?? Infinity;
  const sb = PLAN[b]?.start ?? Infinity;
  return sa - sb || a - b;
});

/** MAKE WAY: a dot that has not yet landed is eased aside by any dot that has
 *  already set off. Centre distance d (< c) is mapped to
 *    sep(d) = S0 * (1 + (d / c)^2),   S0 = r1 + r2 + MIN_GAP,  c = 2 * S0
 *  which is monotone (no fold, so nothing is flicked across), meets d with
 *  slope 1 at c (no kink), and never lets the two edges come closer than
 *  MIN_GAP. A slot therefore never fills on top of a neighbour. */
export const MIN_GAP = 8;
export type DotState = { x: number; y: number; r: number };
/** Every dot's world position and radius at frame f. */
export const dotsAt = (f: number): DotState[] => {
  const out: DotState[] = new Array(DOTS.length);
  const moving: number[] = [];
  for (const i of START_ORDER) {
    const d = DOTS[i];
    const w = wander(d, f);
    const fx = d.x + w.x;
    const fy = d.y + w.y;
    const p = PLAN[i];
    const e = p ? smoothstep((f - p.start) / GLIDE_F) : 0;
    let st: DotState;
    if (!p || e <= 0) st = { x: fx, y: fy, r: d.r };
    else if (e < 1) st = { x: fx + (p.sx - fx) * e, y: fy + (p.sy - fy) * e, r: d.r + (R_FORM - d.r) * e };
    else st = { x: p.sx, y: p.sy + marchDip(f, p.beat), r: R_FORM };
    // make way — weight 1 while wandering, fading to 0 as the dot lands, so a
    // landed dot sits exactly on its slot (slots are PITCH apart, beyond reach)
    const wgt = 1 - e * e;
    if (wgt > 0) {
      for (const j of moving) {
        const q = out[j];
        const dx = st.x - q.x;
        const dy = st.y - q.y;
        const dist = Math.hypot(dx, dy) || 1e-6;
        const s0 = q.r + st.r + MIN_GAP;
        const c = 2 * s0;
        if (dist < c) {
          const sep = s0 * (1 + (dist / c) ** 2);
          const m = wgt * (sep - dist);
          st = { ...st, x: st.x + (dx / dist) * m, y: st.y + (dy / dist) * m };
        }
      }
    }
    out[i] = st;
    if (p && f > p.start) moving.push(i);
  }
  return out;
};

// -- her crown and entrance ----------------------------------------------------
export const RISE = 90;
export const RISE_F = 22;
export const STAGGER = 2;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
export const STACK = [
  { key: "orange", color: ORANGE, start: 0, up: 3 * CROWN_STEP },
  { key: "purple", color: PURPLE, start: STAGGER, up: 2 * CROWN_STEP },
  { key: "blue", color: BLUE, start: 2 * STAGGER, up: CROWN_STEP },
] as const;
export const CORE_START = 3 * STAGGER;
export const riseAt = (f: number, start: number) =>
  RISE * (1 - EASE_LAND(clamp01((f - start) / RISE_F)));

// -- the camera -------------------------------------------------------------------
export const CROWD_TOP = Math.min(...DOTS.map((d) => d.y - d.r));
export const FORM_TOP = X_CY - ((FORM_ROWS - 1) / 2) * PITCH - R_FORM;
export const COMP_BOTTOM = HER_FOOT + SHADOW;
export const K_OPEN = 2.05;
export const K_CREEP_IN = 0.03;
/** The rest framing: the whole composition (crowd top to her foot's shadow)
 *  spans REST_SPAN screen px, centred on 835, and the crowd's width stays
 *  inside REST_WIDTH. */
export const REST_SPAN = 1030;
export const REST_WIDTH = 900;
export const CROWD_W =
  Math.max(...DOTS.map((d) => d.x + d.r + SHADOW)) - Math.min(...DOTS.map((d) => d.x - d.r));
export const K_REST = Math.min(REST_SPAN / (HER_FOOT + SHADOW - Math.min(...DOTS.map((d) => d.y - d.r))), REST_WIDTH / CROWD_W);
export const K_CREEP_OUT = 0.03;
/** Her crowned glyph, centred on screen y 835 at the open. */
export const C_OPEN = (HER_TOP - CROWN + COMP_BOTTOM) / 2;
/** The whole composition, crowd top to her foot's shadow. */
export const C_REST = (CROWD_TOP + COMP_BOTTOM) / 2;
/** The same once the crowd has squared up into the formation. */
export const C_FORM = (FORM_TOP + COMP_BOTTOM) / 2;
/** Where a content centre c at zoom k puts the composition's bottom on screen. */
const bottomOnScreen = (c: number, k: number) => FRAME_H / 2 - CAM_LIFT + (COMP_BOTTOM - c) * k;
export const S_OPEN = bottomOnScreen(C_OPEN, K_OPEN);
export const S_CREPT = bottomOnScreen(C_OPEN, K_OPEN + K_CREEP_IN);
export const S_REST = bottomOnScreen(C_REST, K_REST);
export const S_FORM = bottomOnScreen(C_FORM, K_REST - K_CREEP_OUT);
// Each glide eases k and the SCREEN y of the composition's bottom (her foot's
// shadow) on one curve, and cy is solved from the two. Easing the content
// centre instead lets the foot swing through a maximum mid-move (it touched
// screen y 1409 at f46); keyed like this the foot's screen y is monotone.
type Glide = { f0: number; f1: number; warp: number; dk: number; ds: number };
export const GLIDES: Glide[] = [
  // creep in on her, "you know"
  { f0: 0, f1: 30, warp: 1, dk: K_CREEP_IN, ds: S_CREPT - S_OPEN },
  // THE MOVE: pull back and tilt up to the whole composition, speed early
  { f0: 20, f1: 50, warp: 0.6, dk: K_REST - K_OPEN - K_CREEP_IN, ds: S_REST - S_CREPT },
  // creep out while the crowd squares up, re-centring on the formation
  { f0: 54, f1: 150, warp: 1, dk: -K_CREEP_OUT, ds: S_FORM - S_REST },
];
const TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CX: number[] = [];
  for (let f = 0; f <= DURATION + 24; f++) {
    let k = K_OPEN;
    let sb = S_OPEN;
    for (const g of GLIDES) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp);
      k += g.dk * e;
      sb += g.ds * e;
    }
    F.push(f);
    K.push(k);
    CY.push(COMP_BOTTOM - (sb - FRAME_H / 2) / k);
    CX.push(AXIS_X);
  }
  return { F, K, CY, CX };
})();
export const NIB2_CAM_F = TRACK.F;
export const NIB2_CAM_K = TRACK.K;
export const NIB2_CAM_CY = TRACK.CY;
export const NIB2_CAM_CX = TRACK.CX;
/** The damped camera at frame f, without sway. */
export const nib2Camera = (f: number) => runCamera2(f, NIB2_CAM_F, NIB2_CAM_CY, NIB2_CAM_CX, NIB2_CAM_K);
/** With the hand's sway, as drawn. */
export const nib2CameraSway = (f: number) => {
  const c = nib2Camera(f);
  const s = sway(f);
  return { cx: c.cx + s.dx, cy: c.cy + s.dy, k: c.k };
};
const REST = { cx: NIB2_CAM_CX[0], cy: NIB2_CAM_CY[0] };

// CAPTION SAFETY, asserted: her foot's shadow and every dot (with its shadow)
// stays above screen y 1400 on every frame.
export const CAPTION_LIMIT = 1400;
export const lowestInk = () => {
  let worst = -Infinity;
  let at = -1;
  for (let f = 0; f < DURATION; f++) {
    const cam = nib2CameraSway(f);
    let y = worldToScreen(AXIS_X, COMP_BOTTOM, cam).y;
    for (const p of dotsAt(f)) {
      y = Math.max(y, worldToScreen(p.x, p.y + p.r + SHADOW, cam).y);
    }
    if (y > worst) {
      worst = y;
      at = f;
    }
  }
  return { y: worst, f: at };
};
{
  const low = lowestInk();
  if (low.y > CAPTION_LIMIT) {
    throw new Error(`NotInTheBusinessV2: ink reaches screen y ${low.y.toFixed(1)} at f${low.f} (caption band)`);
  }
}

export const schema = z.object({
  sway: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ sway: true });

const NotInTheBusinessV2: React.FC<Props> = ({ sway: withSway }) => {
  const frame = useCurrentFrame();
  const cam = withSway ? nib2CameraSway(frame) : nib2Camera(frame);
  const dots = dotsAt(frame);
  const xShape = (off: number, fill: string) => (
    <path
      d={X_PATH}
      fill={fill}
      transform={`translate(${X_TX + off} ${X_TY + off}) scale(${X_SCALE})`}
    />
  );
  const person = (dy: number, fill: string, off = 0) => (
    <path d={PERSON_D} fill={fill} transform={`translate(${AXIS_X + off} ${HER_FOOT + dy + off})`} />
  );
  return (
    <World frame={frame} cam={cam} rest={REST}>
      {/* THE CROWD — every shadow first, so no dot's shadow ever lies on another */}
      <g>
        {dots.map((p, i) => (
          <circle key={`s${i}`} cx={p.x + SHADOW} cy={p.y + SHADOW} r={p.r} fill={BLACK} />
        ))}
        {dots.map((p, i) => (
          <circle key={`w${i}`} cx={p.x} cy={p.y} r={p.r} fill={WHITE} />
        ))}
      </g>

      {/* THE X, at the crowd's centre */}
      {xShape(SHADOW, BLACK)}
      {xShape(0, WHITE)}

      {/* HER: the core's shadow at the back, the chain, the white core */}
      {frame >= CORE_START ? person(riseAt(frame, CORE_START), BLACK, SHADOW) : null}
      {STACK.map((l) =>
        frame >= l.start ? <g key={l.key}>{person(riseAt(frame, l.start) - l.up, l.color)}</g> : null,
      )}
      {frame >= CORE_START ? person(riseAt(frame, CORE_START), WHITE) : null}
    </World>
  );
};

export default NotInTheBusinessV2;
