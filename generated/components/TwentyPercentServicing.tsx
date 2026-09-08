import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camEase,
  camMove,
  clamp,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dylan Patel, clip `Dylan_Debt_Crisis`, cut 3 (cuts 1-2 are `TenTimesTheCost`
// and `RateOfInterestHigher`): "Currently 20% of tax revenue spending goes
// towards servicing the debt, basically paying interest payments on the debt".
//
// SRT span 0:31.800 -> 0:38.299 at 24fps.
// round((38.299 - 31.800) * 24) = round(6.499 * 24) = round(155.976) = 156
// frames of speech, plus a 16 frame tail so the resolved state holds = 172.
export const DURATION = 172;

// ---------------------------------------------------------------------------
// "Twenty of a hundred, paid into a pile of bills."
//
// icons pass: the debt field of deep dots -> a pile of white bill glyphs; a
// treasury over the hundred; tier drops below (user note 2026-09-08: "a bit too
// abstract, use icons like the data centers")
//
// Money is the field's dots, as in cut 1. Tax revenue is ONE countable block of
// 100 solid dots, 10 x 10 at a 22px step, deep at rest, standing under a
// TREASURY — a classical facade in white ink with its own small shadow, static
// for the whole piece, because the revenue is the government's and it is
// already there when the line starts. The twenty percent is the block's BOTTOM
// two rows: they light to ripe and drop out into their own tier BELOW the
// block, because spending leaves the treasury downward before it flows right.
// The debt is a PILE OF BILLS — white bill glyphs on their own jittered
// lattice, 88 x 96 world px each, running off the top, the right and the bottom
// of the frame at every camera position, with a left edge that undulates and
// thins out into nothing. Servicing the debt is the twenty flying one by one
// out of the tier onto the FACE of twenty distinct bills, going deep on
// arrival and then shrinking away: paid, gone, and the pile is not one bill
// smaller for it.
//
// The nouns are glyphs, the money is dots. Nothing else: no text, no people,
// no lines, no strokes.
//
// Geometry (world px; world x centre 540 at the open, screen y 835 = content
// centre; the composition spans y -410 (the pediment) .. +200 (the tier), so
// the content centre is -105 and the camera carries it at both zooms):
//   treasury  origin (540, -140), 344 wide x 270 tall, so it spans y -410..-140
//             and stands 41px above the block's top row. Two base steps, five
//             columns, an entablature and a pediment; inline rects and one
//             path, white, one `iconShadow(k)` on the group.
//   block     10 x 10 dots, step 22, centred (540, 0): x 441..639, y -99..+99.
//   tier      the bottom two rows (i = 8, 9) dropped to y +178 and +200, same
//             columns — 79px under the eight rows that stay.
//   the pile  bills on a 104 x 122 lattice from x 980 to 3740 and y -2400 to
//             +2400: 28 x 40 cells, each row phase-shifted 0..1 step, each bill
//             jittered inside its own cell (so two bills can never touch),
//             scaled 0.9-1.1. Its left edge is the only one anything ever sees:
//             the nominal edge undulates along y by `wobble` and the pile
//             dissolves into it over 4 columns — density from ~0.15 at the
//             outermost column up to 1.0, scale tapering 0.8 -> 1.0.
//
// Every gesture is one word. Nothing else happens.
//   open on the treasury and the hundred: one 10 x 10
//     block of deep dots under a white facade, k 1.5.
//     Nothing else is in frame — at k 1.5 the frame
//     reaches world x 903 and the nearest bill's left
//     edge is beyond 920                             — "currently"          f0
//   the bottom two rows DROP OUT: each of the twenty
//     goes ripe as it leaves and falls to its tier
//     seat (y +178 / +200) on its own shallow arc,
//     ease-out, launch order hashed within the two
//     rows, travel 12 frames each, the last seated
//     by f40. The eighty stay deep and do not move   — "twenty percent"     f12-40
//   hold. The block IS the revenue; there is nothing
//     to add to it. Breath and sway only            — "of tax revenue"     f48-60
//   the ONE camera move, and the only one: pull back
//     k 1.5 -> 0.8 and pan cx 540 -> 800 together,
//     keyed f70-88 warp 0.72, settled (|dk| < 0.5%/f
//     and |dcx| < 1px/f) at f96 — three frames ahead
//     of "servicing". It reveals the debt: a pile of
//     bills bleeding off the top, the right and the
//     bottom with a thinning, undulating left edge.
//     Nothing else moves while it runs              — "spending goes
//                                                      towards"            f70-88
//   the STREAM: the twenty leave the tier one at a
//     time, hashed order, each on its own shallow
//     arc onto the FACE of its own bill. Travel 11
//     frames, departures f88 -> f139 at ~2.7 frames
//     apart, so the first lands on "servicing" (f99)
//     and the last on "debt" (f150). On landing each
//     ramps ripe -> deep over 4 frames and then
//     shrinks to nothing over 6: paid, and the bill
//     is exactly as it was. Nothing refills the tier — "servicing the debt,
//                                                      basically paying
//                                                      interest payments on
//                                                      the debt"           f88-150
//   hold resolved: the treasury and eighty deep dots
//     on the left, the pile of bills on the right,
//     the tier gone. Breath and sway only           — tail                 f150-172
//
// There is no ambient layer beyond breath and sway. The treasury does not
// build, the bills do not move, nothing blinks: the two holds are carried by
// the breath on the dots and the camera's sway.
//
// orange dwarkesh style: ACCENT / ACCENT_DEEP, solid dots with no stroke, the
// unread -> lit ladder carried by tone, white ink at OP_READ for both glyphs,
// BG_DIM 0.45, one global drop-shadow 2/7/0.12, a per-icon drop-shadow 2/3/0.38
// on the treasury and on every bill, `feather` + `wobble` on the pile's one
// visible edge, one eased camera move (warp 0.72) with cy taken off the eased k.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(), // the treasury and the bills; the only white in the piece
  accent: z.string(), // ripe: the twenty, lit and in flight
  accentDeep: z.string(), // deep: money at rest, and a bill just paid
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotOpacity: z.number(), // a dot is solid; the ladder is tone
  beats: z.object({
    currently: z.number(), // "currently"
    twenty: z.number(), // "20"
    percent: z.number(), // "percent"
    ofTax: z.number(), // "of tax"
    revenue: z.number(), // "revenue"
    spendingGoes: z.number(), // "spending goes"
    towards: z.number(), // "towards"
    servicing: z.number(), // "servicing"
    theDebt: z.number(), // "the debt"
    basically: z.number(), // "basically"
    payingInterest: z.number(), // "paying interest"
    paymentsOnThe: z.number(), // "payments on the"
    debt: z.number(), // "debt"
    end: z.number(), // speech ends; tail to 172
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    currently: 0,
    twenty: 12,
    percent: 26,
    ofTax: 48,
    revenue: 60,
    spendingGoes: 68,
    towards: 88,
    servicing: 99,
    theDebt: 112,
    basically: 120,
    payingInterest: 130,
    paymentsOnThe: 138,
    debt: 150,
    end: 156,
  },
});

export type P = { x: number; y: number };

export const WORLD_W = 1080;
export const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the only one: the pull-back on "spending goes
// towards", keyed f70-88, warp 0.72 so the speed is early in it. This is the
// first piece in the set whose camera also PANS, because the two things it has
// to hold — the treasury and its block on the left, the pile's edge on the
// right — do not share a centre: the block stays where it opened and the frame
// widens to the right of it.
//
// `camMove` writes k and cy as one key per frame off a warped smoothstep, and
// `runCamera` damps them. The x track is the same curve (`camEase`, the same
// f0..f1 and the same warp) run through a copy of that damper below with the
// same CAM_STIFF / CAM_DAMP, so the pan and the zoom settle on the same frame
// and the move reads as one hand.
//
// The content centre is -105 at both ends: the composition runs from the
// pediment at world y -410 to the tier at +200, and the midpoint of that is
// what sits at screen y 835 through the whole piece.
//
//   f0-70   k 1.5, cx 540, centre -105. The composition sits at screen y
//           377..1293 and world x 368..712, inside a frame that spans world x
//           180..900 and world y -662..618. The nearest bill's left edge is at
//           world 928, so no bill is in frame, sway included.
//   f70-88  -> k 0.8, cx 800, centre -105. Traced through the damper: |dk| <
//           0.5%/frame and |dcx| < 1px/frame from f96 — the settle frame, three
//           frames before "servicing" (f99). At rest the treasury and the block
//           sit at screen x 194..470 and 253..411 respectively, the pile's
//           first bills begin at screen x ~684, and the frame spans world x
//           125..1475 and world y -1149..1252, so the pile bleeds off the top,
//           the right and the bottom.
// ---------------------------------------------------------------------------
export const BLOCK_CX = 540;
export const CONTENT_CY = -105;
export const K_OPEN = 1.5;
export const K_FINAL = 0.8;
export const CX_OPEN = 540;
export const CX_FINAL = 800;
const CAM_F0 = 70;
const CAM_F1 = 88;
export const CAM_WARP = 0.72;

const CAM = camMove({
  f0: CAM_F0,
  f1: CAM_F1,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_CY,
  c1: CONTENT_CY,
  warp: CAM_WARP,
});
const CAM_FR = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [
  CONTENT_CY + CAM_LIFT / K_OPEN,
  ...CAM.CY,
  CONTENT_CY + CAM_LIFT / K_FINAL,
];

// The x track: the same eased curve, one key per frame, over the same span.
const CAM_CX = (() => {
  const F: number[] = [0];
  const X: number[] = [CX_OPEN];
  const span = CAM_F1 - CAM_F0;
  for (let i = 0; i <= span; i++) {
    F.push(CAM_F0 + i);
    X.push(CX_OPEN + (CX_FINAL - CX_OPEN) * camEase(i / span, CAM_WARP));
  }
  F.push(DURATION);
  X.push(CX_FINAL);
  return { F, X };
})();

// A copy of `runCamera`'s spring for the x track — same stiffness, same
// damping, so the pan has the same weight as the zoom it travels with.
// fieldShared is shared with three delivered cuts and is not touched for this.
export const runCameraX = (upto: number, F: number[], CX: number[]) => {
  let cx = CX[0];
  let vx = 0;
  for (let f = 1; f <= upto; f++) {
    const tx = interpolate(f, F, CX, clamp);
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
  }
  return cx;
};

// ---------------------------------------------------------------------------
// The treasury. Tax revenue is the government's, so the hundred stands under a
// building: a classical facade in white ink — two base steps, five columns, an
// entablature and a pediment — with the same small per-icon shadow the racks in
// cut 1 carry. Its origin is its bottom centre at world (540, -140), it is 344
// wide and 270 tall, so it spans y -410..-140 and its base sits 41px clear of
// the block's top row at -99.
//
// It is STATIC: it does not build, it does not fade in, nothing about it moves
// for 172 frames. The word is "currently" — the building is already there.
// ---------------------------------------------------------------------------
export const TREASURY: P = { x: BLOCK_CX, y: -140 };
export type Rect = { x: number; y: number; w: number; h: number; r: number };
export const TREASURY_RECTS: Rect[] = [
  { x: -170, y: -30, w: 340, h: 30, r: 4 }, // the lower base step
  { x: -150, y: -52, w: 300, h: 24, r: 4 }, // the upper base step
  { x: -134, y: -190, w: 28, h: 140, r: 6 }, // five columns
  { x: -74, y: -190, w: 28, h: 140, r: 6 },
  { x: -14, y: -190, w: 28, h: 140, r: 6 },
  { x: 46, y: -190, w: 28, h: 140, r: 6 },
  { x: 106, y: -190, w: 28, h: 140, r: 6 },
  { x: -156, y: -212, w: 312, h: 24, r: 4 }, // the entablature
];
export const TREASURY_PEDIMENT = "M-172,-218 L172,-218 L0,-270 Z";

// ---------------------------------------------------------------------------
// Tax revenue: ONE block of a hundred solid dots, 10 x 10 at a 22px step,
// centred on world (540, 0), deep at rest. A hundred is the whole point — the
// line says a percentage, so the thing the percentage is of has to be countable
// without being counted for you.
//
// The tier is where the BOTTOM two rows go: the same ten columns, at y +178 and
// +200, 79px under the eight rows that stay (their bottom row is at +55).
// Below, not above: the space above the block is the treasury, and spending
// leaves a treasury downward before it flows right.
// ---------------------------------------------------------------------------
export const BLK_N = 10;
export const BLK_STEP = 22;
export const BLK_X = Array.from({ length: BLK_N }, (_, j) => BLOCK_CX - 99 + BLK_STEP * j);
export const BLK_Y = Array.from({ length: BLK_N }, (_, i) => -99 + BLK_STEP * i);
const TIER_ROWS = 2;
export const TIER_ROW0 = BLK_N - TIER_ROWS; // 8: the first block row that leaves
export const TIER_Y = [178, 200];
const TWENTY = BLK_N * TIER_ROWS;

// ---------------------------------------------------------------------------
// The debt: a pile of BILLS. One bill is 88 x 96 world px — a rounded top, a
// torn receipt bottom of eleven teeth, and four cut-out lines taken out of it
// by `fillRule="evenodd"` so the field shows through them, exactly the way the
// rack's slots do in cut 1. White, with one `iconShadow(k)` each.
//
// (The path in the brief closed 8px past its own left wall and 6px short of its
// stated height; this is the same drawing with eleven 8px teeth instead of
// twelve, which lands it exactly on 88 x 96 with x -44..44 and y -48..48.)
// ---------------------------------------------------------------------------
export const BILL_W = 88;
export const BILL_H = 96;
export const BILL_D = [
  // the body: rounded top corners, straight sides, a torn bottom
  "M-36,-48 h72 a8,8 0 0 1 8,8 v82 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 l-8,-6 l-8,6 v-88 a8,8 0 0 1 8,-8 z",
  // four cut-out lines, the last one short
  "M-22,-32 h44 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-44 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
  "M-22,-12 h44 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-44 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
  "M-22,8 h44 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-44 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
  "M-22,28 h24 a4,4 0 0 1 4,4 v2 a4,4 0 0 1 -4,4 h-24 a4,4 0 0 1 -4,-4 v-2 a4,4 0 0 1 4,-4 z",
].join(" ");

// The pile's lattice: step 104 x 122 over world x 980..3740 and y -2400..+2400,
// so at k 0.8 it runs off the top, the right and the bottom of the frame and at
// k 1.5 it is entirely outside it.
//
// Three things keep it from reading as a wall of identical stationery:
//   - every ROW is phase-shifted along x by 0..1 step, so no column of bills
//     ever lines up down the pile;
//   - every bill is jittered off its cell and scaled 0.9-1.1, and the jitter is
//     CLAMPED into its own 104 x 122 cell, so two bills can never touch (white
//     on white with no stroke merges into a blob and the pile stops being
//     countable);
//   - the phase is positive-only, so no bill can ever drift left of x 980.
//
// The LEFT edge is the only one anything ever sees. Its nominal x is 0.3 steps
// inside the first column and undulates along y by `wobble` (evaluated on
// y * 0.15 so one period is about seven rows rather than one), and the pile
// dissolves into it over EDGE_FEATHER = 4 columns: a cell exists if its hash
// falls under 0.15 + 0.85 * feather, and what survives out there is drawn down
// to 0.8 scale. The outermost column keeps about one bill in seven.
// ---------------------------------------------------------------------------
export const STEP_X = 104;
export const STEP_Y = 122;
const FIELD_X0 = BLOCK_CX + 440; // 980
const FIELD_X1 = BLOCK_CX + 3200; // 3740
const FIELD_Y0 = -2400;
const FIELD_Y1 = 2400;
const EDGE_FEATHER = 4; // columns
const EDGE_BIAS = 0.3; // steps: where the nominal edge sits inside column 0
const EDGE_WOB = 0.55; // steps of undulation, +/- 1.05 after `wobble`
const EDGE_WOB_RATE = 0.15; // slows `wobble` to ~7 rows a period at this step
const EDGE_SEED = 2.1;
const DENS_MIN = 0.15; // the outermost column's survival rate
const EDGE_S_MIN = 0.8; // a surviving bill's scale out there
const JITTER = 0.3;

export const FIELD_COLS = Math.round((FIELD_X1 - FIELD_X0) / STEP_X) + 1;
export const FIELD_ROWS = Math.round((FIELD_Y1 - FIELD_Y0) / STEP_Y) + 1;

// the nominal left edge at world y, in world px
const edgeAt = (y: number) =>
  FIELD_X0 + (EDGE_BIAS + wobble(y * EDGE_WOB_RATE, EDGE_SEED) * EDGE_WOB) * STEP_X;
// a row's phase along x: 0..1 step, positive only
const rowPhase = (gr: number) => hash(gr, 17) * STEP_X;
const clampAbs = (v: number, m: number) => Math.max(-m, Math.min(m, v));

type Bill = { x: number; y: number; s: number; fe: number; live: boolean; i: number };
const cellAt = (gc: number, gr: number): Bill => {
  const i = gr * FIELD_COLS + gc;
  const cxm = FIELD_X0 + rowPhase(gr) + gc * STEP_X;
  const cym = FIELD_Y0 + gr * STEP_Y;
  const fe = feather((cxm - edgeAt(cym)) / STEP_X, EDGE_FEATHER);
  const s = (0.9 + 0.2 * hash(i, 13)) * (EDGE_S_MIN + (1 - EDGE_S_MIN) * fe);
  // the jitter is clamped so the bill's box stays inside its own cell
  const jx = clampAbs(
    (hash(i, 11) - 0.5) * STEP_X * JITTER,
    Math.max(0, STEP_X / 2 - (BILL_W / 2) * s - 1),
  );
  const jy = clampAbs(
    (hash(i, 12) - 0.5) * STEP_Y * JITTER,
    Math.max(0, STEP_Y / 2 - (BILL_H / 2) * s - 1),
  );
  return {
    x: cxm + jx,
    y: cym + jy,
    s,
    fe,
    live: hash(i, 71) < DENS_MIN + (1 - DENS_MIN) * fe,
    i,
  };
};

// exported so the geometry can be traced without re-deriving it in a script
export const BILLS: Bill[] = (() => {
  const out: Bill[] = [];
  for (let gr = 0; gr < FIELD_ROWS; gr++) {
    for (let gc = 0; gc < FIELD_COLS; gc++) {
      const c = cellAt(gc, gr);
      if (c.live) out.push(c);
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// Where the twenty land: the FACE of twenty distinct bills in the pile's
// feathered edge, spread down it either side of the content centre. Twenty
// bands across world y -640..+640, and in each band the live bill with the
// lowest hash; a band with nothing in it takes the nearest unclaimed candidate
// instead, so the set is always twenty distinct bills and always deterministic.
//
// (The brief asked for the first three columns over y -320..+320. A bill
// lattice steps 122px a row where the old dot field stepped 15, so that box
// holds six rows and four live bills — not twenty. The box below is the
// smallest one that holds twenty-five candidates, and every bill in it is on
// screen with a margin at the resolved camera: world x <= 1420 is screen
// x <= 1036 and world y -640..+640 is screen y 407..1471. It reaches the
// fifth column, so the last few land where the pile has gone solid.)
// ---------------------------------------------------------------------------
const LAND_X1 = 1420;
const LAND_Y0 = -640;
const LAND_Y1 = 640;
export const LANDING: Bill[] = (() => {
  const cand = BILLS.filter(
    (b) => b.y >= LAND_Y0 - STEP_Y / 2 && b.y <= LAND_Y1 + STEP_Y / 2 && b.x <= LAND_X1,
  );
  if (cand.length < TWENTY) {
    throw new Error(`TwentyPercentServicing: only ${cand.length} bills to land on`);
  }
  const taken = new Set<number>();
  const out: Bill[] = [];
  const bandH = (LAND_Y1 - LAND_Y0) / TWENTY;
  for (let b = 0; b < TWENTY; b++) {
    const y0 = LAND_Y0 + b * bandH;
    const y1 = y0 + bandH;
    const mid = (y0 + y1) / 2;
    let best: Bill | null = null;
    let bestKey = Infinity;
    for (const c of cand) {
      if (taken.has(c.i)) continue;
      if (c.y < y0 || c.y >= y1) continue;
      const key = hash(c.i, 77);
      if (key < bestKey) {
        bestKey = key;
        best = c;
      }
    }
    if (!best) {
      // nothing in this band: the nearest unclaimed bill to its centre
      let bestD = Infinity;
      for (const c of cand) {
        if (taken.has(c.i)) continue;
        const d = Math.abs(c.y - mid);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
    }
    if (!best) {
      throw new Error(`TwentyPercentServicing: no bill left for band ${b}`);
    }
    taken.add(best.i);
    out.push(best);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The two flights. Both are the same mechanism — a dot leaves on its own
// shallow arc, eases in and never overshoots — at two different scales.
//
// The DROP, f12-40 on "twenty percent": twenty launches in a hashed order, one
// every 16/19 of a frame from f12, twelve frames of travel each, so the last of
// them is seated at f40 and the tier is complete well before "of tax revenue".
//
// The STREAM, f88-150 on "servicing … the debt": twenty departures in a
// different hashed order, eleven frames of travel each, spaced 51/19 = 2.68
// frames so the FIRST lands on "servicing" (f99) and the LAST on "debt" (f150).
// Both numbers come off the beats, not off a parallel timer.
//
// A landed dot goes ripe -> deep over ABSORB frames and then shrinks to nothing
// over PAID: the payment lands on the bill, turns into debt, and is gone. The
// bill it landed on is exactly as it was.
// ---------------------------------------------------------------------------
const LIFT_END = 40;
const LIFT_DUR = 12;
const LIFT_ARC = 36; // +/- 18px of sway across a 101px fall: shallow
const STREAM_ARC = 90;
const ABSORB = 4; // frames from landing to fully deep
const PAID = 6; // and then the radius to nothing

// launch order inside the two rows, and departure order out of the tier: two
// different hashes, so the tier does not empty in the order it filled
const LIFT_RANK = (() => {
  const idx = Array.from({ length: TWENTY }, (_, t) => t);
  idx.sort((a, b) => hash(a, 51) - hash(b, 51));
  const rank = new Array<number>(TWENTY);
  idx.forEach((t, r) => {
    rank[t] = r;
  });
  return rank;
})();
const STREAM_RANK = (() => {
  const idx = Array.from({ length: TWENTY }, (_, t) => t);
  idx.sort((a, b) => hash(a, 61) - hash(b, 61));
  const rank = new Array<number>(TWENTY);
  idx.forEach((t, r) => {
    rank[t] = r;
  });
  return rank;
})();

// A dot travelling from A to B on its own shallow arc: eased in, bowed
// perpendicular to its own path, never overshooting.
export const arcAt = (a: P, b: P, lin: number, arc: number): P => {
  const e = Easing.out(Easing.cubic)(lin);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(Math.PI * e) * arc;
  return { x: a.x + dx * e + (-dy / L) * bow, y: a.y + dy * e + (dx / L) * bow };
};

const TwentyPercentServicing: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = at rest (deep), 1 = lit (ripe). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_FR, CAM_CY, CAM_K);
  const camX = runCameraX(frame, CAM_CX.F, CAM_CX.X);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the pile: only the bills whose box this frame can actually touch -------
  const halfW = FRAME_W / 2 / k;
  const halfH = FRAME_H / 2 / k;
  const vx0 = cx - halfW - STEP_X;
  const vx1 = cx + halfW + STEP_X;
  const vy0 = cy - halfH - STEP_Y;
  const vy1 = cy + halfH + STEP_Y;
  const visible: Bill[] = [];
  for (let i = 0; i < BILLS.length; i++) {
    const b = BILLS[i];
    if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue;
    visible.push(b);
  }

  // -- the twenty ------------------------------------------------------------
  // Each one's whole life in three numbers: how far it has dropped, how far it
  // has streamed, and how long it has been on its bill. Nothing runs on a timer
  // that the visible thing cannot be derived from.
  const liftGap = (LIFT_END - LIFT_DUR - beats.twenty) / (TWENTY - 1);
  const streamDur = beats.servicing - beats.towards; // 11
  const streamGap = (beats.debt - streamDur - beats.towards) / (TWENTY - 1);

  const twenty = Array.from({ length: TWENTY }, (_, t) => {
    const row = TIER_ROW0 + Math.floor(t / BLK_N);
    const col = t % BLK_N;
    const home: P = { x: BLK_X[col], y: BLK_Y[row] };
    const tier: P = { x: BLK_X[col], y: TIER_Y[Math.floor(t / BLK_N)] };
    const bill = LANDING[STREAM_RANK[t]];

    const l = clamp01((frame - (beats.twenty + LIFT_RANK[t] * liftGap)) / LIFT_DUR);
    const sDep = beats.towards + STREAM_RANK[t] * streamGap;
    const s = clamp01((frame - sDep) / streamDur);
    const landed = frame - (sDep + streamDur);
    const settled = clamp01(landed / ABSORB);
    const paid = clamp01((landed - ABSORB) / PAID);

    let p: P;
    if (s > 0) {
      p = arcAt(tier, { x: bill.x, y: bill.y }, s, (hash(t, 53) - 0.5) * STREAM_ARC);
    } else {
      p = arcAt(home, tier, l, (hash(t, 52) - 0.5) * LIFT_ARC);
    }
    // ripe as it leaves the block, ripe all the way, deep on the bill, then gone
    const lit = smoothstep(l / 0.4) * (1 - settled);
    return { p, lit, rScale: 1 - paid, seed: t };
  });

  const dotFor = (key: string, x: number, y: number, r: number, fill: string) => (
    <circle key={key} cx={x} cy={y} r={r} fill={fill} opacity={dotOpacity} />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX_OPEN}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
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
            {/* the debt: a pile of bills, each with its own small shadow */}
            {visible.map((b) => (
              <g key={`bl${b.i}`} style={{ filter: icon }}>
                <g transform={`translate(${b.x.toFixed(2)} ${b.y.toFixed(2)}) scale(${b.s.toFixed(4)})`}>
                  <path d={BILL_D} fill={ink} fillRule="evenodd" opacity={OP_READ} />
                </g>
              </g>
            ))}

            {/* the treasury: static, over the pile, under the money */}
            <g style={{ filter: icon }}>
              <g transform={`translate(${TREASURY.x} ${TREASURY.y})`}>
                {TREASURY_RECTS.map((r, i) => (
                  <rect
                    key={`tr${i}`}
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    rx={r.r}
                    fill={ink}
                    opacity={OP_READ}
                  />
                ))}
                <path d={TREASURY_PEDIMENT} fill={ink} opacity={OP_READ} />
              </g>
            </g>

            {/* tax revenue: the eighty that never move */}
            {BLK_Y.map((y, row) =>
              row >= TIER_ROW0
                ? null
                : BLK_X.map((x, col) =>
                    dotFor(
                      `b${row}-${col}`,
                      x,
                      y,
                      dotRadius * breath(frame, hash(row * BLK_N + col, 9)),
                      tone(0),
                    ),
                  ),
            )}

            {/* the twenty: in the block, in the air, in the tier, on a bill */}
            {twenty.map((d) =>
              d.rScale <= 0
                ? null
                : dotFor(
                    `t${d.seed}`,
                    d.p.x,
                    d.p.y,
                    dotRadius * d.rScale * breath(frame, hash(d.seed, 9)),
                    tone(d.lit),
                  ),
            )}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TwentyPercentServicing;
