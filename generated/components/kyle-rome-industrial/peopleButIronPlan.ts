// ---------------------------------------------------------------------------
// peopleButIronPlan — the camera and the layout of PeopleButIron (kyle-rome-industrial, cut 34). Pure data and maths,
// no React: the cut, its audit scripts and its sheets read the same numbers.
//
// UNITS: the cast's (a man ~312 tall = 1.75 m, U = 178 per metre). X across (+ right), Y height (floor 0, up -),
// Z depth behind the front plane (the front row of workers stands on Z ~ 0).
//
// THE CAMERA is a real eye, not a 2D pan: eye X (Ex), eye height (Eh, up +), its distance in front of the front
// plane (Dc) and a fixed focal F (screen px); a vertical lens shift keeps the front row's feet on the screen row
// FEET_Y (verticals stay vertical, every receding edge meets the one horizon). Each channel is the integral of
// raised-cosine velocity bumps (incaShared makeTrack): one lobe per move, no keys to stall on.
//   Ex  one lateral glide, left to right, flat (even) speed through its middle (f ~50-135)
//   Eh  up from 2.1 m to 4.3 m (the rising reveal of the yard, f0-84), then down to 2.1 m onto the smith (f92-190)
//   Dc  back from 1000 to 1520 (the pull-back, f0-76), then in to ~750 (the push-in on the smith, f110-190), then a
//       slow creep in to the last frame (the resolved picture stays alive)
// londonDepth's perspective is fed per frame with { eyeY: -Eh, dRef: Dc, kRef: k, dolly: 1 } and the 2D camera
// { k: F / Dc, cx: Ex, cy }, so p(X, Y, Z) is exactly the pinhole projection of this eye.
// ---------------------------------------------------------------------------
import { makeTrack, type Cam } from "../kits/maps/incaShared";
import type { DepthOpts } from "../kyle-london/londonDepth";

export const FPS = 30000 / 1001;
export const DURATION = 206;
export const U = 178;
/** focal length, screen px */
export const F = 1750;
/** the screen row of the front row's feet (Z = 0) */
const FEET_Y = makeTrack([[96, 190, -62, 1]], 1095);

const EX = makeTrack([[2, 182, 1840, 0.55]], -1120);
const EH = makeTrack(
  [
    [-6, 84, 380, 1],
    [92, 190, -380, 1],
  ],
  380,
);
const DC = makeTrack(
  [
    [-6, 76, 520, 1],
    [110, 190, -760, 1],
    [176, 290, -50, 1],
  ],
  1000,
);

export type Eye = { f: number; Ex: number; Eh: number; Dc: number; H: number; k: number; cam: Cam; depth: DepthOpts };
export const eyeAt = (f: number): Eye => {
  const Ex = EX(f);
  const Eh = EH(f);
  const Dc = DC(f);
  const k = F / Dc;
  // the horizon row that puts the front row's feet (Y 0, Z 0) on FEET_Y
  const H = FEET_Y(f) - (Eh * F) / Dc;
  const cy = -Eh - (H - 960) / k;
  return { f, Ex, Eh, Dc, H, k, cam: { k, cx: Ex, cy }, depth: { eyeY: -Eh, dRef: Dc, kRef: k, dolly: 1 } };
};
/** the screen point of a world point (for audits) */
export const screenOf = (e: Eye, X: number, Y: number, Z: number): [number, number] => {
  const d = e.Dc + Z;
  return [540 + ((X - e.Ex) * F) / d, e.H + ((Y + e.Eh) * F) / d];
};

// ---------------------------------------------------------------------------
// THE TIMELINE (the brief's word table; Whisper runs ~6 frames early)
// ---------------------------------------------------------------------------
/** the smith's blows: phase 0 of POSES.strike = the hammer head on the blade. "Iron" is heard ~f161: contact f160,
 *  one more at f190; the blows before (f100, f130) are seen on the glide */
export const SMITH_PERIOD = 30;
export const SMITH_CONTACT = 160;

// ---------------------------------------------------------------------------
// THE LAYOUT
// ---------------------------------------------------------------------------
/** the smith (feet), facing right; the anvil stands where his hammer head lands */
export const SMITH = { X: 640, Z: 0 };
/** the rope team's block on its rollers (its left-front corner at f0) and the rope's run toward the front right */
export const BLOCK = { X: -860, Z: 800, w: 250, d: 170, h: 130, roll: 15 };
/** the rope's run in plan (radians from +X; negative = toward us): the team recedes diagonally back to the block */
export const ROPE_ANG = -0.72;
/** block speed, units per frame (it inches along) */
export const BLOCK_V = 0.85;
/** the stone-cutters at the opening (f0) */
export const CUTTERS_X = -1130;

/** the far works: the colonnade going up and the stepped quarry face */
export const COLONNADE = { Z: 6800, X0: -200, X1: 3600 };

// a seeded hash (Remotion's random is fine too; this one is pure and fast)
export const h01 = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export type Station =
  | { kind: "dress" | "pick"; id: number; X: number; Z: number; dir: 1 | -1; who: "slave" | "freeman"; variant: number; period: number; off: number }
  | { kind: "carry"; id: number; X: number; Z: number; dir: 1 | -1; who: "slave" | "freeman"; variant: number; off: number }
  | { kind: "stack" | "heap"; id: number; X: number; Z: number; size: number };

/** the yard behind the front row: work stations on staggered rows that widen with depth (so heads never overlap),
 *  each a hand-worker (a stone-dresser at a slab, a quarryman with a pick at the rock) or a carrier with a basket, with
 *  blocks stacked and rubble heaped between them */
export const STATIONS: Station[] = (() => {
  const out: Station[] = [];
  const rows = [950, 1450, 2000, 2650, 3400, 4250, 5200];
  let id = 0;
  rows.forEach((Z0, ri) => {
    const sx = 430 + 0.085 * Z0;
    // the frustum swept by the whole camera path at this depth (with a margin)
    const half = (540 * (1500 + Z0)) / F + 160;
    const x0 = -1120 - half;
    const x1 = 760 + half;
    const off = (ri % 2) * 0.5 * sx + h01(ri, 9) * 60;
    for (let X = x0 + off; X <= x1; X += sx) {
      const n = id++;
      const jx = (h01(n, 1) - 0.5) * 0.3 * sx;
      const jz = (h01(n, 2) - 0.5) * 0.22 * (rows[Math.min(ri + 1, rows.length - 1)] - Z0);
      const XX = X + jx;
      const ZZ = Z0 + jz;
      // keep the forge's back and the rack clear (the payoff frame), and the rope team's lane
      if (ZZ < 1800 && XX > 500 && XX < 1250) continue;
      if (ZZ < 1300 && XX > -1000 && XX < 100) continue;
      const r = h01(n, 3);
      const dir: 1 | -1 = h01(n, 4) < 0.5 ? 1 : -1;
      const who: "slave" | "freeman" = h01(n, 5) < 0.62 ? "slave" : "freeman";
      const variant = Math.floor(h01(n, 6) * (who === "slave" ? 5 : 3));
      if (r < 0.24) out.push({ kind: h01(n, 7) < 0.5 ? "stack" : "heap", id: n, X: XX, Z: ZZ, size: 0.8 + 0.5 * h01(n, 8) });
      else if (r < 0.4 && ri < 4 && !(ri < 2 && XX > -1700 && XX < 500)) out.push({ kind: "carry", id: n, X: XX, Z: Z0 + 0.5 * (rows[ri + 1] - Z0), dir, who, variant, off: h01(n, 10) * 30 });
      else out.push({ kind: r < 0.66 ? "dress" : "pick", id: n, X: XX, Z: ZZ, dir, who, variant, period: 27 + Math.floor(h01(n, 11) * 9), off: Math.floor(h01(n, 12) * 30) });
    }
  });
  return out;
})();
