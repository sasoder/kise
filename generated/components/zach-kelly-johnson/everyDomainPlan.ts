// ---------------------------------------------------------------------------
// everyDomainPlan — the pure plan of EveryDomainInNumbers (zach-kelly-johnson, cut 26): the camera, the three
// subjects' paths and the production-run slots. No React here, so a check script can import it.
//
// WORLD: plane px of the resolved frame. At the landing camera (x 540, y 960, k 1) every plane's world px equal
// screen px (archiveShared's default rest camera), so the numbers below ARE the resolved frame's layout.
// ---------------------------------------------------------------------------
import { Easing } from "remotion";

export const DURATION = 188;
export const W = 1080;
export const H = 1920;

// ---- the cross-section (world y) ----
export const HORIZON_Y = 700; // the sea's far horizon (on the SEA plane): high enough that the sea reads in perspective
export const CUT_Y = 968; // the near water line, where the surface plate meets the deep (DEEP plane)

// ---- planes (archiveShared depth: 1 = focus plane, > 1 farther) ----
export const D_SKY = 2.6;
export const D_SEA = 1.22; // the sea plate and, behind its horizon, the rockets
export const D_NEAR = 1; // ships, the deep, the subs

// ---- the camera: one pull-back from f0, one deceleration lobe landing at f110, then a slow creep ----
export const F_LAND = 110;
export const K0 = 1.6;
const LN_K0 = Math.log(K0);
const V_START = 0.55; // normalised speed at f0 (already moving when the cut opens)
const V_LAND = 0.07; // normalised speed at the landing = the creep's speed
/** Cubic Hermite 0 -> 1 with end speeds V_START, V_LAND. */
const herm = (s: number) => {
  const s2 = s * s;
  const s3 = s2 * s;
  return V_START * (s3 - 2 * s2 + s) + (3 * s2 - 2 * s3) + V_LAND * (s3 - s2);
};
const CREEP = (LN_K0 * V_LAND) / F_LAND; // ln-k per frame after the landing (continuous speed)
export const camK = (f: number) => {
  if (f <= F_LAND) return Math.exp(LN_K0 * (1 - herm(Math.max(0, f) / F_LAND)));
  return Math.exp(-CREEP * (f - F_LAND));
};
// a little tilt and pan inside the same move: open on the ship at the surface, lean into the deep, then the sky
export const CX0 = 404;
export const CY0 = 897; // the opening frames the ship and the near water line ~18 px higher than at first (clear of the first caption band)
const panEase = Easing.bezier(0.42, 0, 0.3, 1);
const panU = (f: number, f0: number) => panEase(Math.min(1, Math.max(0, (f - f0) / (F_LAND - f0))));
export const camX = (f: number) => CX0 + (W / 2 - CX0) * panU(f, 0);
export const camY = (f: number) => CY0 + (H / 2 - CY0) * panU(f, 38);
export const camAt = (f: number) => ({ x: camX(f), y: camY(f), k: camK(f) });

/** archiveShared's dolly (same formula as depthTransform): plane px -> screen px. */
export const toScreen = (f: number, d: number, x: number, y: number) => {
  const { x: cx, y: cy, k } = camAt(f);
  const kd = d === 1 ? k : d / (d - (1 - 1 / k));
  const xd = W / 2 + (cx - W / 2) / d;
  const yd = H / 2 + (cy - H / 2) / d;
  return { x: W / 2 + (x - xd) * kd, y: H / 2 + (y - yd) * kd, k: kd };
};

// ---- the run: copies step out from behind each subject ----
export const F_RUN = 100; // first chain layer of the first copy
export const COPY_GAP = 4; // frames between copies: at most two copies of a run are in colour at once
export const RUN_STAGGER = 1; // frames between chain layers (orange, purple, blue, then the photo core)
export const RUN_TRAVEL = 14; // frames each layer travels, EASE_LAND
export const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

/** [orange, purple, blue, core] progress of copy i at frame f (0 = still behind the subject). */
export const runProgress = (f: number, i: number): [number, number, number, number] => {
  const p = (j: number) => {
    const s = F_RUN + i * COPY_GAP + j * RUN_STAGGER;
    return EASE_LAND(Math.min(1, Math.max(0, (f - s) / RUN_TRAVEL)));
  };
  return [p(0), p(1), p(2), p(3)];
};

export type Slot = { dx: number; dy: number; s: number; air: number };

// ---- SHIPS: sail left at constant speed; the run is a column in echelon receding astern (up-right, smaller) ----
export const SHIP_LEN = 540;
export const SHIP_WL = 957; // lead's waterline
export const SHIP_V = 1.3; // world px per frame, leftward
export const SHIP_X150 = 300; // lead's centre x at f150
export const shipX = (f: number) => SHIP_X150 - SHIP_V * (f - 150);
/** perspective on the sea: a ship at scale s floats with its waterline s of the way from the horizon to the lead's. */
const wl = (s: number) => HORIZON_Y + (SHIP_WL - HORIZON_Y) * s;
/** The column in perspective: each farther destroyer smaller, its waterline nearer the horizon, receding up and to the
 * right (astern), each one's bow tucked only behind the nearer ship's after deck so every silhouette reads whole. */
export const SHIP_SLOTS: Slot[] = [
  { s: 0.72, dx: 296, air: 0.3 },
  { s: 0.52, dx: 488, air: 0.5 },
  { s: 0.38, dx: 628, air: 0.66 },
].map(({ s, dx, air }) => ({ dx, dy: wl(s) - SHIP_WL, s, air }));

// ---- SUBS: glide left in the deep; the run is a staggered pack (above, below, behind) ----
export const SUB_LEN = 630;
export const SUB_Y = 1652; // lead's waterline row (the hull's middle; the sail rises above it, the belly hangs below)
export const SUB_V = 1.3;
export const SUB_X150 = 400;
export const subX = (f: number) => SUB_X150 - SUB_V * (f - 150);
export const SUB_SLOTS: Slot[] = [
  { dx: 330, dy: -112, s: 0.78, air: 0.3 },
  { dx: 360, dy: 122, s: 0.66, air: 0.45 },
  { dx: -170, dy: 136, s: 0.56, air: 0.58 },
];

// ---- ROCKETS: rise out from behind the horizon, then climb slowly; the run is a row receding left ----
export const ROCKET_LEN = 304; // nose to nozzle, plane px
export const ROCKET_X = 772;
export const F_LAUNCH = 56; // its nose is at the horizon
export const F_CRUISE = 104; // from here it climbs at ROCKET_V
export const ROCKET_V = 1.35;
export const ROCKET_NOZZLE_END = 424; // nozzle y at the last frame
const BRAKE_POW = 1.2; // the climb brakes as (1 - u)^BRAKE_POW
const NOZZLE_CRUISE = ROCKET_NOZZLE_END + ROCKET_V * (DURATION - 1 - F_CRUISE);
const NOZZLE_LAUNCH = HORIZON_Y + ROCKET_LEN; // nose on the horizon
/** Nozzle y (plane px, D_SEA): out of the horizon fast, braking into a steady climb by F_CRUISE (C1 at the join). */
export const rocketY = (f: number) => {
  if (f >= F_CRUISE) return NOZZLE_CRUISE - ROCKET_V * (f - F_CRUISE);
  const T = F_CRUISE - F_LAUNCH;
  const dist = NOZZLE_LAUNCH - NOZZLE_CRUISE;
  // speed v(u) = V + (v0 - V) (1 - u)^n over u in [0, 1]; its integral fixes v0
  const n1 = BRAKE_POW + 1;
  const v0 = (dist / T - ROCKET_V) * n1 + ROCKET_V;
  const u = (f - F_LAUNCH) / T;
  if (u <= 0) return NOZZLE_LAUNCH + v0 * (F_LAUNCH - f); // still rising behind the horizon
  const covered = T * (ROCKET_V * u + ((v0 - ROCKET_V) / n1) * (1 - Math.pow(1 - u, n1)));
  return NOZZLE_LAUNCH - covered;
};
export const ROCKET_SLOTS: Slot[] = [0.9, 0.81, 0.73, 0.66].map((s, i) => {
  const dx = -[122, 236, 343, 444][i];
  // farther rockets at the same height sit a little nearer the horizon
  return { dx, dy: 0, s, air: [0.15, 0.28, 0.4, 0.5][i] };
});
/** A rocket copy's nozzle y given the lead's: farther = nearer the horizon. */
export const rocketSlotY = (leadY: number, s: number) => HORIZON_Y - (HORIZON_Y - leadY) * (0.55 + 0.45 * s);

// ---- exhaust: the smoke hangs where it was made, so the column below a rocket is its own past path ----
export const TRAIL_W0 = 0.75; // the column's width at the nozzle, in body widths
export const TRAIL_GROW = 0.62; // px of width it gains per frame of age (the slow billow)
export const TRAIL_MAX_AGE = 150; // frames of trail kept (older smoke is below the horizon anyway)

// ---- the cut-outs (public/zach-kelly-johnson/B/), measured off their alpha ----
/** USS O'Hare (DDR-889), bow left. Visible hull x 60..1790; the waterline at the centre column is row 638 and slopes
 * up 1.07 deg toward the stern (a few degrees off the beam): levelled about that point. Masthead row ~149. */
export const SHIP_IMG = { src: "zach-kelly-johnson/B/cutout_destroyer_ohare_ddr889_side_facing-left.png", w: 1800, h: 660, vis: 1730, ax: 925, ay: 638, level: 1.07, top: 149 };
/** USS Skipjack (SS-184), bow RIGHT in the file (flipped to sail left). Hull x 100..1800; waterline row 169.5 at
 * x 900, 1.3 deg lower toward the bow: levelled. Sail top row 58. The belly is the hull side mirrored below the
 * waterline (BELLY rows), darker. */
export const SUB_IMG = { src: "zach-kelly-johnson/B/cutout_submarine_skipjack_ss184_broadside_facing-right.png", w: 1800, h: 194, vis: 1700, cx: 950, wl: 169.5, lx: 900, level: -1.32, top: 58, belly: 46 };
/** Mercury-Redstone 3, vertical. Used rows 0..1692 (the pad gear below is cut); body centre x 173; right of the body
 * the umbilical and steam are clipped off along a mirror of the left fin. */
export const ROCKET_IMG = { src: "zach-kelly-johnson/B/cutout_rocket_mercury_redstone3_vertical.png", w: 416, h: 1800, used: 1692, cx: 173, body: 150, top: 30 };
