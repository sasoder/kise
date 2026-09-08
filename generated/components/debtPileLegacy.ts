import { interpolate } from "remotion";
import { CAM_DAMP, CAM_STIFF, clamp, feather, hash, wobble } from "./fieldShared";
import { BILL_D, arcAt, type P } from "./explainerShared";

// ---------------------------------------------------------------------------
// The treasury-and-pile world, kept for the two superseded drafts that still
// import it: `RollsOver.tsx` and `TwentyToTwentyFive.tsx`.
//
// This geometry WAS `TwentyPercentServicing.tsx` — a classical facade over a
// 10 x 10 block of tax revenue with a tier dropping out of it, and an endless
// pile of bills off to the right. The harmony pass rebuilt cut 3 as the first
// act of `DebtExplainer` (one centred column, the bar, the bond row), so none
// of it is on screen in the delivered set any more. It is moved here rather
// than deleted so the older cuts still compile and still render exactly as they
// did; nothing in the current four-piece set imports this file.
//
// `BILL_D`, `arcAt` and `P` now live in `explainerShared.tsx` and are
// re-exported here so those two files' import lists did not have to change.
// ---------------------------------------------------------------------------

export { BILL_D, arcAt };
export type { P };

export const WORLD_W = 1080;
export const WORLD_H = 2200;

export const BLOCK_CX = 540;
export const CONTENT_CY = -105;
export const K_OPEN = 1.5;
export const K_FINAL = 0.8;
export const CX_OPEN = 540;
export const CX_FINAL = 800;
export const CAM_WARP = 0.72;

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

type Bill = {
  x: number;
  y: number;
  s: number;
  fe: number;
  live: boolean;
  i: number;
};
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
