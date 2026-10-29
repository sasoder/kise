// ---------------------------------------------------------------------------
// everyCostPlan — the pure plan of cut 4, EveryCostGoesDown (sam-gigawatt-cost): the row's geometry in the cut's
// world px (the chart plane, AirStage's Z = ZC, as scott-radar-map/npsColumnsPlan.ts), the three drains, the camera
// and the chart-plane <-> AirCam mapping. No React, so a planner script can import it.
// ---------------------------------------------------------------------------

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** The apron slab's near cut edge (world px). The objects stand just behind it, the columns come out of slots in it. */
export const GROUND = 1000;
/** the objects' feet stand a hair behind the cut edge (radar cut's phones) */
export const FOOT = GROUND - 4;

/** The cost columns: one width, one glass height for all three at f0 (the speaker gives no numbers). */
export const COL = { w: 120, H: 540, headroom: 24, rung: 60 } as const;
/** the fill (the cost) at f0: the glass less its headroom */
export const FILL0 = COL.H - COL.headroom;

/** THE ROW (world px, left to right): the pylon and the chip each with its column `GAP` to its right, `SPACE`
 *  between groups; the supply chain is a container yard, its column standing between two stacks (so the last,
 *  deepest drain sits inside the row, not at its very end). */
const GAP = 26;
const SPACE = 58;
/** one 20 ft container's side (world px) and its height */
export const BOX_W = 170;
export const BOX_H = 76;
export const PYLON = { x: -10, half: 140, h: 644 } as const;
const colX = (o: { x: number; half: number }) => o.x + o.half + GAP + COL.w / 2;
const nextX = (o: { x: number; half: number }, half: number) => colX(o) + COL.w / 2 + SPACE + half;
export const CHIP = { x: nextX(PYLON, 170), half: 170, h: 359 } as const;
/** the yard: a stack five high left of the column, three high right of it */
export const BOX_L = { x: nextX(CHIP, BOX_W / 2), half: BOX_W / 2, levels: 5 } as const;
const COL3 = colX(BOX_L);
export const BOX_R = { x: COL3 + COL.w / 2 + GAP + BOX_W / 2, half: BOX_W / 2, levels: 3 } as const;
export const COLS = [
  { key: "energy", x: colX(PYLON), drain: { f0: 11, f1: 20 }, to: 0.56 },
  { key: "chips", x: colX(CHIP), drain: { f0: 40, f1: 48 }, to: 0.48 },
  { key: "supply", x: COL3, drain: { f0: 75, f1: 84 }, to: 0.4 },
] as const;
/** the row's ends and the centre of each group */
export const ROW = { x0: PYLON.x - PYLON.half, x1: BOX_R.x + BOX_R.half } as const;
export const GROUP_C = [
  (PYLON.x - PYLON.half + COLS[0].x + COL.w / 2) / 2,
  (CHIP.x - CHIP.half + COLS[1].x + COL.w / 2) / 2,
  (BOX_L.x - BOX_L.half + ROW.x1) / 2,
] as const;

/** Beats (frames at 24000/1001 from f0; the brief's whisper table). */
export const BEAT = { cost: 2, energy: 8, should1: 13, down1: 20, chips: 38, should2: 42, down2: 48, rest: 55, supply: 69, chain: 73, should3: 78, down3: 84 } as const;

/** a drain: a soft start, an even middle, a weighty settle (liquid slows as the level reaches the slot's valve) */
const travel = (u: number) => {
  const x = clamp01(u);
  const quad = x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
  return 0.5 * ss(x) + 0.5 * quad;
};
/** the amber fill (world px above the slot) of column i at frame f */
export const fillAt = (i: number, f: number) => {
  const c = COLS[i];
  return FILL0 * (1 - (1 - c.to) * travel((f - c.drain.f0) / (c.drain.f1 - c.drain.f0)));
};
/** how fast column i is draining (0..1, for the slot's valve opening) */
export const drainingAt = (i: number, f: number) => {
  const c = COLS[i];
  const u = (f - c.drain.f0 + 2) / (c.drain.f1 - c.drain.f0 + 4);
  return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u);
};

// --- the camera (makeClockCam LOOK + k) ------------------------------------------------------------------------
/** close beats: each group about 60 % of the frame width; the cut edge at screen y ~1020 */
export const K_CLOSE = 1.3;
/** the wide: the whole row across ~90 % of the width, the cut edge at screen y ~1034 */
export const K_WIDE = 972 / (ROW.x1 - ROW.x0);
export const LOOK_Y = (k: number, edge: number) => GROUND - (edge - 960) / k;
export const CAM_START = { x: -280, y: LOOK_Y(K_CLOSE, 1018), k: K_CLOSE } as const;
const WIDE_X = (ROW.x0 + ROW.x1) / 2;
/** the pull-back's target zoom (the damped follower lands it on K_WIDE at f92, still creeping) */
const K_PULL = 0.64;
const PAN = 1250;
/** One glide along the row that runs from before f0 (the pylon group centre-left at f8, the chip group centred
 *  ~f38), and from f50 one blended pull-back that eases the rightward travel into a turn: the yard's column sits at
 *  screen x ~860-870 through its drain (k 1.0 -> 0.7), and the whole row lands at ~95 % of the width by f92, still
 *  creeping. Solved against the damped follower (house numbers: max |dv| 2.26 px/f^2 at f57, max speed 21 px/f). */
export const CAM_GLIDES = [
  { f0: -40, f1: 74, dx: PAN, dy: 0 },
  { f0: 50, f1: 88, dx: WIDE_X - (CAM_START.x + PAN), dy: LOOK_Y(K_PULL, 1034) - CAM_START.y, k: K_PULL },
] as const;

// ---------------------------------------------------------------------------
// THE CHART PLANE IN THE WORLD (aircraftShared's pinhole, side mode, yaw 0, pitch 0), as npsColumnsPlan.ts /
// costChartPlan.ts: the columns, objects and the earth section live on the plane Z = ZC (the apron's cut front
// edge); a plane of constant Z projects flat, so the 2D look maps exactly onto a side AirCam.
// ---------------------------------------------------------------------------
export const F0 = 2310;
export const ZC = 330;
/** The eye height (m). Raised from the house 18 m (rev 2) so the apron recedes in perspective from the bottom edge
 *  to the row: the lens shift in `airCamOf` keeps the chart plane exactly where it was on screen (a plane of constant
 *  Z maps the same at any eye height; only the horizon and the ground move), so the objects and the columns sit
 *  where rev 1 approved them while the camera looks down onto the floor in front of them. */
export const EYE = 30;
export const S0 = F0 / ZC;
export const airCamOf = (c: { x: number; y: number; k: number }) => ({
  mode: "side" as const,
  x: (c.x - 540) / S0,
  y: EYE,
  z: 0,
  f: F0 * c.k,
  horizon: 960 + c.k * (GROUND - c.y - S0 * EYE),
});
/** THE LOW GOLDEN-HOUR SUN, low behind the row on the upper left (where the sky's glow is): each metre of height
 *  casts its shadow 0.55 m to the right and 1.9 m toward the camera along the apron (sun elevation ~26 deg). */
export const SUN_SHADOW = { x: 0.55, z: -1.9 } as const;
/** chart-plane world px -> AirStage metres (Y up from the ground) */
export const toWorld = (x: number, y: number): [number, number, number] => [(x - 540) / S0, (GROUND - y) / S0, ZC];
