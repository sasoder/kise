// ---------------------------------------------------------------------------
// artisanalPlan: the numbers of ArtisanalToIndustrial (kyle-rome-industrial, cut 65): the district's layout, the
// throwing, the carriers and the one continuous pull-back. Pure functions of the frame. Units: the cast's (a man ~312
// = 1.75 m, U = 178 per metre); X across, Y height (floor 0, up -), Z depth behind the front plane (londonDepth).
// ---------------------------------------------------------------------------
import { type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 30000 / 1001;
export const DURATION = 263;
export const U = 178;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
export const frac = (v: number) => v - Math.floor(v);
/** a stable 0..1 hash of two integers */
export const h01 = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// THE POTTER'S STATION (romeCast POTTER: the wheel wheelDX in front of his feet, the stool stoolDX behind)
// ---------------------------------------------------------------------------
export const WHEEL_DX = 112;
export const STOOL_DX = -6;
/** the bowl's middle above the floor (the anchor the camera keeps on screen) */
export const BOWL_Y = -94;

// ---------------------------------------------------------------------------
// THE DISTRICT: columns of identical potters along Z (every one facing screen right), all converging on the kiln
// ---------------------------------------------------------------------------
export const XS = 460; // column spacing
export const ZS = 600; // potter spacing along a column
export const COL_MIN = -9;
export const COL_MAX = 12;
export const ROW_MAX = 17;
/** rows in front of the artisan (none in his own column: the aisle that leads the eye back to him) */
export const ROW_MIN = -4;

// the kiln and its stacking floor (the camera's end centre is the kiln's X, see camera below)
/** the kiln (La Graufesenque's great kilns: a brick firing chamber over a firebox, loaded with columns of nested
 *  vessels): a barrel-vaulted brick chamber, its front cut away so the load shows. W inner half width, T wall, z0 the
 *  cut, z1 the back wall's inner face, floor the chamber floor's height over the firebox, wall the side walls' height
 *  above it, rise the vault's */
export const KILN = { W: 1100, T: 190, z0: 2900, z1: 4300, floor: 230, wall: 480, rise: 760 };
/** the stacking yard: rows of tall stacks of upturned bowls in front of the kiln and beside it, a lane up the middle */
export const YARD_STACKS = { z0: 1850, z1: 2650, dz: 200, dx: 190, half: 1750, lane: 270, n: 13, side: { x0: 1500, x1: 3100, z0: 2850, z1: 5000, dz: 260 } };
/** boards of drying bowls on the floor among the near rows (the foreground's texture) */
export const BOARDS = { zs: [-900, -1500, -2100, -2700], len: 240, bowls: 4, dx: 330 };
/** a row's boards: a dense yard between the potter rows (every dx), clear of the artisan's own feet and wheel in the
 *  close-up; the -450 row only under him, the close-up's foreground (the close-up's foreground) */
export const boardXs = (Z: number, x0: number, x1: number) => {
  if (Z === -450) return [56];
  const out: number[] = [];
  for (let X = 56 + Math.ceil((x0 - 56) / BOARDS.dx) * BOARDS.dx; X <= x1; X += BOARDS.dx) {
    if (Z === -330 && X + BOARDS.len / 2 > -20 && X - BOARDS.len / 2 < 190) continue;
    out.push(X + (Z === -330 ? 0 : ((Math.round(Z / 600) % 2) * BOARDS.dx) / 2));
  }
  return out;
};
/** the cart of crated bowls leaving along the lane before the stacking yard (a man pushing it, constant pace) */
export const CART = { Z: 1650, X0: 900, stride: 30, cycle: 40 };
export const cartX = (f: number, xk: number) => xk + CART.X0 + ((2 * CART.stride) / CART.cycle) * f;
/** the plaza kept clear of potters (the steps, the kiln and a margin) */
export const plazaHas = (X: number, Z: number, XK: number) => {
  const d = Math.abs(X - XK);
  return (d < YARD_STACKS.half + 260 && Z > YARD_STACKS.z0 - 350 && Z < KILN.z1 + 700) || (d < YARD_STACKS.side.x1 + 200 && Z > YARD_STACKS.side.z0 - 300 && Z < YARD_STACKS.side.z1 + 300);
};

// ---------------------------------------------------------------------------
// THE CAMERA: one continuous pull-back and rise from f0. Every channel rides one progress p(f) whose speed is a single
// smooth lobe (a cosine rise from before f0, an even plateau, a long cosine settle into a slow creep to the cut).
// ---------------------------------------------------------------------------
const speed = (f: number) => {
  if (f < -30) return 0;
  if (f < 55) return 0.5 * (1 - Math.cos((Math.PI * (f + 30)) / 85));
  if (f < 165) return 1;
  if (f < 262) return 0.03 + 0.97 * 0.5 * (1 + Math.cos((Math.PI * (f - 165)) / 97));
  return 0.03;
};
const STEP = 0.25;
const TAB: number[] = (() => {
  const out: number[] = [];
  let s = 0;
  for (let f = -30; f <= DURATION + 20; f += STEP) {
    out.push(s);
    s += speed(f + STEP / 2) * STEP;
  }
  return out;
})();
const cum = (f: number) => {
  const x = (f + 30) / STEP;
  const i = Math.max(0, Math.min(TAB.length - 2, Math.floor(x)));
  return mix(TAB[i], TAB[i + 1], x - i);
};
const C0 = cum(0);
const C1 = cum(DURATION);
/** the camera's progress 0 (f0) .. 1 (the cut) */
export const camP = (f: number) => (cum(f) - C0) / (C1 - C0);

export const CAM = {
  k0: 4.2,
  k1: 0.46,
  eye0: -80,
  eye1: -1000,
  /** the bowl's screen point at f0 and at the end */
  s0: [775, 950] as [number, number],
  s1: [560, 1045] as [number, number],
  dRef: 3000,
  dolly: 0.6,
};
export const kAt = (p: number) => Math.exp(mix(Math.log(CAM.k0), Math.log(CAM.k1), p));
/** the rise lags the pull-back a little (the clones stay behind his back through the close-up) */
export const eyeAt = (p: number) => mix(CAM.eye0, CAM.eye1, Math.pow(p, 1.6));
/** the 2D camera: the zoom on log k, and the centre (cx, cy) moving straight and monotone in the world on the same
 *  progress, so the vanishing point never swings (no weave): the bowl starts at s0 on screen and lands on s1 */
const camEnd = (k: number, s: [number, number]) => ({ cx: WHEEL_DX - (s[0] - 540) / k, cy: BOWL_Y - (s[1] - 960) / k });
const C_A = camEnd(CAM.k0, CAM.s0);
const C_B = camEnd(CAM.k1, CAM.s1);
export const camOf = (p: number): Cam => ({ k: kAt(p), cx: mix(C_A.cx, C_B.cx, p), cy: mix(C_A.cy, C_B.cy, p * p) });
export const depthOf = (p: number): DepthOpts => ({ eyeY: eyeAt(p), dRef: CAM.dRef, kRef: CAM.k1, dolly: CAM.dolly });
/** the kiln stands on the camera's end centre line: the vanishing point lands on it */
export const XK = camOf(1).cx;
/** the kiln's cut face (the smoke and the painter's order key on it) */
export const ZK = KILN.z0;
/** the depth fog's reach: short in the close-up (the far district a soft wall of air behind the artisan), long in the wide */
export const fogVisAt = (p: number) => 450 * Math.pow(9000 / 450, p);
/** in the close-up the far district dissolves completely into the air; the wide keeps the medium's 0.9 */
export const fogMaxAt = (p: number) => mix(0.985, 0.9, ease(p / 0.45));
/** the people's fog reach: short in the close-up (the clones behind him are only shapes in the air), long in the wide */
export const figVisAt = (p: number) => 260 * Math.pow(9000 / 260, p);
export const figMaxAt = (p: number) => mix(0.95, 0.75, ease(p / 0.45));
/** the artisan recedes a little into the crowd as the district takes the frame */
export const heroDim = (f: number) => 0.15 * ease((f - 150) / 90);


// ---------------------------------------------------------------------------
// THE THROWING (the artisan): three pulls draw the lump up into the bowl, then the same slow pull as everyone
// ---------------------------------------------------------------------------
export const HERO_PULLS: [number, number][] = [
  [4, 28],
  [36, 60],
  [68, 92],
];
export const heroForm = (f: number) => HERO_PULLS.reduce((m, [a, b]) => m + ease((f - a) / (b - a)) / 3, 0);
/** the common pull of every potter: phase 0..1, hands up the wall slowly, back down to its foot quickly */
export const POT_CYCLE = 44;
export const pullRise = (phase: number) => {
  const u = frac(phase);
  return u < 0.72 ? ease(u / 0.72) : 1 - ease((u - 0.72) / 0.28);
};
/** the artisan's hand height on the wall (0 foot .. 1 rim): his three pulls, then (from f104) the common pull */
const HERO_PHASE0 = 104;
export const heroRise = (f: number) => {
  const P = HERO_PULLS;
  for (let i = 0; i < P.length; i++) {
    const [a, b] = P[i];
    if (f < a) return i > 0 ? 1 - ease((f - P[i - 1][1]) / 6) : 0;
    if (f <= b) return ease((f - a) / (b - a));
  }
  if (f < HERO_PHASE0) return 1 - ease((f - P[P.length - 1][1]) / 12);
  return pullRise((f - HERO_PHASE0) / POT_CYCLE);
};
export const potterPhase = (i: number, f: number) => f / POT_CYCLE + 0.16 * (h01(i, 3) - 0.5);
/** the kick wheel's turn (cycles): already spinning at f0 */
export const wheelTurn = (seed: number, f: number) => 0.3 * seed + f / 26;

// ---------------------------------------------------------------------------
// THE CARRIERS: boards of drying bowls on the shoulder, walking (constant speed, planted feet) toward the kiln
// ---------------------------------------------------------------------------
export const WALK_CYCLE = 30;
export const WALK_STRIDE = 44;
/** units per frame (the planted foot travels 2 x stride per cycle) */
export const WALK_V = (2 * WALK_STRIDE) / WALK_CYCLE;
export type Carrier = { Z: number; X0: number; dir: 1 | -1; ph: number; variant: number };
export const CARRIERS: Carrier[] = [
  { Z: 300, X0: -1150, dir: 1, ph: 0.1, variant: 2 },
  { Z: 300, X0: -1800, dir: 1, ph: 0.55, variant: 2 },
  { Z: 900, X0: 1900, dir: -1, ph: 0.3, variant: 2 },
  { Z: 900, X0: -1300, dir: 1, ph: 0.65, variant: 2 },
  { Z: 1500, X0: 2450, dir: -1, ph: 0.8, variant: 2 },
  { Z: 1500, X0: -1900, dir: 1, ph: 0.2, variant: 2 },
  { Z: 3300, X0: 3900, dir: -1, ph: 0.45, variant: 2 },
  { Z: 4500, X0: -3300, dir: 1, ph: 0.9, variant: 2 },
];
export const carrierX = (c: Carrier, f: number) => c.X0 + c.dir * WALK_V * f;
