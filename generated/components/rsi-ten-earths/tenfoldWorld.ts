// ---------------------------------------------------------------------------
// tenfoldWorld — the pure world of TenfoldEveryYear (rsi-ten-earths, cut 89, rev 1): the floor's slot grid, the five
// waves of robots (1 -> 10 -> 100 -> 1,000 -> 10,000 -> the sea), each robot's entrance (its floor hatch opens, it
// rises on its lift, it boots up) and the camera (one continuous crane up and back in log space with a slight orbit).
// No React here: the cut and scripts/clips/rsi-ten-earths/check-tenfold-every-year.ts both import it.
//
// UNITS: the cast's (U = 178 per metre; the robot 240 = 1.35 m). X across (+ = right), Y height (floor 0, up -), Z depth
//   (+ = away). THE HERO (THE Bot, v0) stands on slot (0, 0) at the origin, facing -Z (us).
//
// THE FLOOR: a raised data-center floor of square tiles TILE = 80 (0.45 m). Every robot stands on its own SLOT of 2 x 2
//   tiles (160 = 0.9 m), which is the top of its lift. Slots run in tidy blocks of 10 x 10 with a one-tile aisle (80)
//   between blocks: slot (i, j) (integers, no gaps) sits at X = 160 i + 80 floor((i + 4) / 10), Z = 160 j + 80 floor(j / 10)
//   (the hero's block is files -4..5, rows 0..9; a block's pitch is BP = 1680).
//
// THE WAVES (self-similar: 5 x 2, then 10 x 10, of robots and then of blocks):
//   L0 the hero.   L1 = files -2..2 x rows 0..1 (5 x 2: 10).   L2 = the hero's block (10 x 10: 100).
//   L3 = block columns -2..2 x block rows 0..1 (5 x 2 blocks: 1,000).   L4 = block columns -4..5 x block rows 0..9
//   (10 x 10 blocks: 10,000).   L5 = every other slot in sight, in front of and behind the field, out to the haze.
//   Each wave is a ripple running outward from the hero (by distance; L5 by log distance, so it runs out to the
//   horizon). A robot's entrance from its t0: the hatch's two leaves slide apart (0..OPEN), it rises out of the floor on
//   its lift (RISE0..RISE1, eased into the stop, its tile the lift's top so the hatch is shut again when it lands) and it
//   boots up (BOOT0..BOOT1: BOT_POSES.bootUp).
//
// THE CAMERA: a real eye on a shift lens (verticals stay vertical, the horizon a screen row Hy) with a yaw: eye at
//   (Xe, height He, Ze), focal F px, looking along (sin yaw, cos yaw). Keyed as the framing of a target point on the floor
//   (the hero's feet: its screen row and its height in px, S = F / D, D the eye's horizontal distance to it): ln px and
//   ln He in pchip keys,
//   smoothed by a gaussian so the move is one eased lobe without corners.
// ---------------------------------------------------------------------------
import { pchip } from "../kits/maps/incaShared";

export const FPS = 24000 / 1001;
export const DURATION = 156;
export const U = 178;
export const T = 160;
export const AISLE = 80;
export const TILE = 80;
export const BP = 10 * T + AISLE;
export const BOT_H = 240;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sm = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const hash = (a: number, b: number, s = 0) => {
  const v = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

// ===================================================================================================================
// THE GRID AND THE WAVES
// ===================================================================================================================
export const blockCol = (i: number) => Math.floor((i + 4) / 10);
export const blockRow = (j: number) => Math.floor(j / 10);
export const xOf = (i: number) => i * T + AISLE * blockCol(i);
export const zOf = (j: number) => j * T + AISLE * blockRow(j);
export const levelOf = (i: number, j: number): number => {
  if (i === 0 && j === 0) return 0;
  if (i >= -2 && i <= 2 && j >= 0 && j <= 1) return 1;
  const c = blockCol(i);
  const b = blockRow(j);
  if (c === 0 && b === 0) return 2;
  if (c >= -2 && c <= 2 && b >= -1 && b <= 0) return 3;
  if (c >= -4 && c <= 5 && b >= -2 && b <= 7) return 4;
  return 5;
};
/** the field of 10,000 (L0..L4): files and rows */
export const FIELD = { i0: -44, i1: 55, j0: -20, j1: 79 };
/** the sea's reach in rows (Z ~ -17,000 .. 235,000) */
export const SEA = { j0: -100, j1: 1400 };
/** the aisle between block columns c and c + 1: its centre X */
export const aisleX = (c: number) => c * BP + 5 * T + AISLE / 2 + T / 2;

/** each wave: its ripple's start frame and span (frames from the nearest robot's t0 to the farthest's) */
export const WAVES = [
  { start: 0, span: 0 },
  { start: 13, span: 6 },
  { start: 44, span: 9 },
  { start: 79, span: 13 },
  { start: 98, span: 14 },
  { start: 118, span: 22 },
];
/** a robot's entrance, in frames from its t0 (the near waves L1, L2); the far waves (L3+) are quicker (their hatches
 *  only a few px wide, open for a few frames) */
export const OPEN = 4;
export const RISE0 = 3;
export const RISE1 = 14;
export const BOOT0 = 13;
export const BOOT1 = 29;
const QUICK = { open: 2.5, rise0: 1.5, rise1: 9 };
/** the lift's travel: the robot starts this far under the floor (its antenna tip hidden) */
export const DEPTH = 300;

const LV_R: { r0: number; r1: number }[] = (() => {
  const out = Array.from({ length: 6 }, () => ({ r0: Infinity, r1: 0 }));
  for (let j = FIELD.j0; j <= FIELD.j1; j++)
    for (let i = FIELD.i0; i <= FIELD.i1; i++) {
      const L = levelOf(i, j);
      const r = Math.hypot(xOf(i), zOf(j));
      out[L].r0 = Math.min(out[L].r0, r);
      out[L].r1 = Math.max(out[L].r1, r);
    }
  out[0] = { r0: 0, r1: 1 };
  // the sea starts just outside the field (its nearest slots, in front of it) and runs out to the haze
  out[5] = { r0: 3300, r1: 150000 };
  return out;
})();
/** a robot's t0 (the frame its hatch starts to open) */
export const t0Of = (i: number, j: number, L = levelOf(i, j)) => {
  if (L === 0) return -100;
  const w = WAVES[L];
  const r = Math.hypot(xOf(i), zOf(j));
  const { r0, r1 } = LV_R[L];
  const u = L === 5 ? Math.log(Math.max(r, r0) / r0) / Math.log(r1 / r0) : (r - r0) / Math.max(1, r1 - r0);
  // a hair of per-slot jitter so a ring never lands as one flat line
  return w.start + w.span * c01(u) + (L >= 3 ? 0.8 * (hash(i, j, 3) - 0.5) : 0);
};
export type Entry = { open: number; rise: number; boot: number; u: number };
const riseEase = (x: number) => 1 - Math.pow(1 - c01(x), 2.4);
export const entryAt = (f: number, t0: number, L = 1): Entry => {
  const u = f - t0;
  const q = L >= 5 ? QUICK : { open: OPEN, rise0: RISE0, rise1: RISE1 };
  return {
    u,
    open: u <= 0 ? 0 : u >= q.open ? 1 : sst(0, q.open, u),
    rise: u <= q.rise0 ? 0 : u >= q.rise1 ? 1 : riseEase((u - q.rise0) / (q.rise1 - q.rise0)),
    boot: c01((u - BOOT0) / (BOOT1 - BOOT0)),
  };
};
/** the radius (from the hero) out to which wave L's robots are at least half risen at frame f (no jitter); 0 before
 *  it starts, Infinity once the whole wave is up (the far texture LOD uses it for the risen part of a row) */
export const risenR = (L: number, f: number) => {
  const w = WAVES[L];
  const { r0, r1 } = LV_R[L];
  const q = L >= 5 ? QUICK : { open: OPEN, rise0: RISE0, rise1: RISE1 };
  const u = (f - (q.rise0 + 0.251 * (q.rise1 - q.rise0)) - w.start) / w.span;
  if (u < 0) return 0;
  if (u >= 1) return Infinity;
  return L === 5 ? r0 * Math.pow(r1 / r0, u) : r0 + (r1 - r0) * u;
};
/** the frame a robot of wave L has landed (risen) from its t0 */
export const landOf = (L: number) => (L >= 5 ? QUICK.rise1 : RISE1);
export const variantOf = (i: number, j: number) => (i === 0 && j === 0 ? 0 : 1 + Math.floor(hash(i, j, 1) * 4));
export const seedOf = (i: number, j: number) => hash(i, j, 2);

/** every robot of the field (L0..L4), with its t0 (the sea is generated per frame by the cut) */
export type Robot = { i: number; j: number; X: number; Z: number; L: number; t0: number; v: number; seed: number };

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export type Eye = { Xe: number; Ze: number; He: number; Hy: number; F: number; yaw: number; cs: number; sn: number; Xt: number; Zt: number; S: number };
type Key = { f: number; px: number; He: number; Hy: number; F: number; yaw: number };
/** the framings: the hero's height on screen (px), the eye's height He and the horizon's row Hy. One continuous move,
 *  near steady in log space: the eye backs off (0.85 -> 12 m from the hero) and rises (1.25 -> 31 m) and stays
 *  GRAZING (the view's centre 11 -> 20 deg down, the horizon y 660 -> ~596). f0 close and low on the hero at eye level;
 *  f32 the 5 x 2 of ten; f60 the block of 100 (~147 px robots); then the field is environment: the 1,000 and the
 *  10,000 rise in perspective around and in front of it, their near rows big, running off both sides and back into
 *  the haze; f155 the sea to the horizon. The eye looks at the hero (slid 80 right with the block of 100's centre). */
const KEYS: Key[] = [
  { f: 0, px: 425, He: 222, Hy: 662, F: 1500, yaw: -9 },
  { f: 18, px: 285, He: 330, Hy: 655, F: 1480, yaw: -8 },
  { f: 32, px: 225, He: 420, Hy: 645, F: 1460, yaw: -7 },
  { f: 60, px: 147, He: 760, Hy: 585, F: 1400, yaw: -5 },
  { f: 80, px: 95, He: 1150, Hy: 560, F: 1350, yaw: -3.5 },
  { f: 98, px: 64, He: 1650, Hy: 545, F: 1300, yaw: -2 },
  { f: 114, px: 45, He: 2350, Hy: 545, F: 1220, yaw: 0 },
  { f: 130, px: 32, He: 3400, Hy: 560, F: 1130, yaw: 2 },
  { f: 155, px: 19.5, He: 5540, Hy: 596, F: 990, yaw: 4.2 },
  { f: 175, px: 18.5, He: 5800, Hy: 600, F: 980, yaw: 4.6 },
];
const keyCurve = (pick: (k: Key) => number, log = false) =>
  pchip(
    KEYS.map((k) => [k.f, log ? Math.log(pick(k)) : pick(k)] as [number, number]),
    false,
  );
/** a curve smoothed by a gaussian (sigma in frames, tabulated at quarter frames) */
const smoothed = (raw: (f: number) => number, sig: number) => {
  const step = 0.25;
  const f0 = -30;
  const n = Math.round((DURATION + 40 - f0) / step);
  const R = Math.ceil((3 * sig) / step);
  const tab = Array.from({ length: n + 1 }, (_, i) => {
    let a = 0;
    let w = 0;
    for (let j = -R; j <= R; j++) {
      const g = Math.exp(-0.5 * ((j * step) / sig) ** 2);
      a += g * raw(f0 + (i + j) * step);
      w += g;
    }
    return a / w;
  });
  return (f: number) => {
    const u = Math.max(0, Math.min(n - 1e-6, (f - f0) / step));
    const i = Math.floor(u);
    return lerp(tab[i], tab[i + 1], u - i);
  };
};
/** the opening is held still before f0 (the move eases out of rest from f0) */
const held = (c: (f: number) => number) => (f: number) => c(Math.max(0, f));
const SIG = 7;
const LN_PX = smoothed(held(keyCurve((k) => k.px, true)), SIG);
const LN_HE = smoothed(held(keyCurve((k) => k.He, true)), SIG);
const HY = smoothed(held(keyCurve((k) => k.Hy)), SIG);
const FL = smoothed(held(keyCurve((k) => k.F)), SIG);
const YAW = smoothed(held(keyCurve((k) => k.yaw)), SIG);

export const eyeAt = (f: number): Eye => {
  const S = Math.exp(LN_PX(f)) / BOT_H;
  const He = Math.exp(LN_HE(f));
  const F = FL(f);
  const yaw = (YAW(f) * Math.PI) / 180;
  // the target slides half the 1,000's asymmetry (its right edge is 160 further out) to the right as it comes up
  const Xt = 80 * sst(35, 60, f);
  const Zt = 0;
  const D = F / S;
  const cs = Math.cos(yaw);
  const sn = Math.sin(yaw);
  return { Xe: Xt - D * sn, Ze: Zt - D * cs, He, Hy: HY(f), F, yaw, cs, sn, Xt, Zt, S };
};
/** a world point on screen (no sway): x, y, px per unit, the camera depth d; null behind the eye */
export const toScreen = (e: Eye, X: number, Y: number, Z: number) => {
  const rx = X - e.Xe;
  const rz = Z - e.Ze;
  const d = rx * e.sn + rz * e.cs;
  if (d < 1) return null;
  const s = e.F / d;
  return { x: 540 + (rx * e.cs - rz * e.sn) * s, y: e.Hy + (e.He + Y) * s, s, d };
};
/** the camera depth of a floor point */
export const depthOf = (e: Eye, X: number, Z: number) => (X - e.Xe) * e.sn + (Z - e.Ze) * e.cs;
/** the floor point (X, Z) under screen (x, y) (y below the horizon) */
export const floorAt = (e: Eye, x: number, y: number) => {
  const d = (e.F * e.He) / Math.max(1e-3, y - e.Hy);
  const xc = ((x - 540) * d) / e.F;
  return { X: e.Xe + xc * e.cs + d * e.sn, Z: e.Ze - xc * e.sn + d * e.cs, d };
};

// ===================================================================================================================
// THE FIELD (L0..L4): each robot's t0 is its ripple's; the ten's and the hundred's are held back until the hatch fits
// the frame (x 65..1015) under the camera, so they never spill past the sides while they come up (from the 1,000 on
// the field is environment: it runs off the sides and into the haze on purpose)
// ===================================================================================================================
const KEEP_X0 = 65;
const KEEP_X1 = 1015;
const fitFrom = (X: number, Z: number, t0: number) => {
  const half = T / 2 - 2;
  for (let f = Math.floor(t0); f < DURATION; f++) {
    const e = eyeAt(f);
    const a = toScreen(e, X - half, 0, Z - half);
    const b = toScreen(e, X + half, 0, Z - half);
    if (a && b && a.x >= KEEP_X0 && b.x <= KEEP_X1) return Math.max(t0, f);
  }
  return t0;
};
export const FIELD_BOTS: Robot[] = (() => {
  const out: Robot[] = [];
  for (let j = FIELD.j0; j <= FIELD.j1; j++)
    for (let i = FIELD.i0; i <= FIELD.i1; i++) {
      const L = levelOf(i, j);
      if (L > 4) continue;
      const X = xOf(i);
      const Z = zOf(j);
      const t = t0Of(i, j, L);
      out.push({ i, j, X, Z, L, t0: L >= 1 && L <= 2 ? fitFrom(X, Z, t) : t, v: variantOf(i, j), seed: seedOf(i, j) });
    }
  return out;
})();
