// ---------------------------------------------------------------------------
// anotherPandemicWorld: the world, the one pinhole camera and the timeline of AnotherPandemicRoad (kyle-pandemics,
// cut 47). Pure data + maths (no React).
//
// UNITS: 100 = 1 m. X across (0 = the path's centre line), Y height (the ground is Y = 0, up is - Y), Z depth along
// the path (away from us). ONE CAMERA (DEPTH.md rule 1): a pinhole on the path's centre line looking straight down the
// path (no pitch, no yaw: verticals stay vertical, one VP on the frame's centre line at the horizon), its eye at height
// eye (< 0), a lens shift putting the horizon at screen y HZ. A point draws at
//     d = Z - cam.Z,  s = F / d,  x = 540 + (X - cam.X) s,  y = HZ + (Y - cam.eye) s.
// The camera dollies forward (real parallax: near stones sweep out of frame, far ones hardly move), slows to the blank
// stone in the middle distance, then, after the goose lands, pushes in on it at a standing eye.
// ---------------------------------------------------------------------------

import { hash } from "../kits/maps/incaShared";

export const FPS = 30000 / 1001;
export const DURATION = 159;
export const F = 1150;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** monotone cubic (pchip) through [x, y] keys; held ends */
export const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** the dolly: a steady V0 per frame from before f0 (already travelling), one smooth deceleration over DECEL to a
 *  slow creep (CREEP per frame); then, after the landing, a steady push in on the goose (PUSH: f94 on, one sin^2
 *  speed lobe still moving at the cut) that brings the eye to PUSH_END_D in front of the blank stone by f158 */
export const V0 = 46;
export const CREEP = 0.8;
export const DECEL: [number, number] = [40, 92];
export const PUSH: [number, number] = [94, 170];
export const PUSH_END_D = 325;
/** the camera slows to STOP_D in front of the next stone at STOP_F (f92), then pushes in on the goose */
export const STOP_D = 560;
const velBase = (f: number) => {
  const u = c01((f - DECEL[0]) / (DECEL[1] - DECEL[0]));
  // a cosine ease: no jolt where it starts, settles softly into the creep
  const g = 0.5 * (1 + Math.cos(Math.PI * u));
  return CREEP + (V0 - CREEP) * g;
};
const pushShape = (f: number) => {
  const u = c01((f - PUSH[0]) / (PUSH[1] - PUSH[0]));
  return Math.pow(Math.sin(Math.PI * u), 2);
};
const SUB = 16;
const integrate = (v: (f: number) => number) => {
  const out: number[] = [0];
  let z = 0;
  for (let f = 0; f < DURATION + 4; f++) {
    for (let i = 0; i < SUB; i++) z += v(f + (i + 0.5) / SUB) / SUB;
    out.push(z);
  }
  return out;
};
const at = (t: number[], f: number) => {
  const i = Math.max(0, Math.min(t.length - 2, Math.floor(f)));
  return mix(t[i], t[i + 1], f - i);
};
const BASE = integrate(velBase);
const SHAPE = integrate(pushShape);
/** the push's size: the blank stone's front face at PUSH_END_D from the eye at f158 */
const PUSH_A = (at(BASE, 92) + STOP_D - PUSH_END_D - at(BASE, 158)) / at(SHAPE, 158);
const Z_TABLE = BASE.map((z, i) => z + PUSH_A * SHAPE[i]);
export const camZAt = (f: number) => at(Z_TABLE, f);
/** the eye: a standing eye a little raised (2.45 m); in the push it comes down a little toward the goose's level */
const EYE = pchip([
  [0, -242],
  [70, -245],
  [96, -245],
  [158, -232],
]);
/** the horizon (a lens shift, verticals stay vertical): y 615 to the landing; in the push it lowers to y 678 so the
 *  goose and the stone's carved upper face fill the frame at the cut, the year's foot just above the caption band */
const HZ_AT = pchip([
  [0, 615],
  [94, 615],
  [158, 678],
]);
export type Cam3 = { X: number; Z: number; eye: number; HZ: number };
export const camAt = (f: number): Cam3 => ({ X: 0, Z: camZAt(f), eye: EYE(f), HZ: f < 94 ? 615 : HZ_AT(f) });
export type Proj = { x: number; y: number; s: number; d: number };
/** a world point on screen (d clamped just in front of the eye) */
export const proj = (c: Cam3, X: number, Y: number, Z: number): Proj => {
  const d = Math.max(8, Z - c.Z);
  const s = F / d;
  return { x: 540 + (X - c.X) * s, y: c.HZ + (Y - c.eye) * s, s, d };
};

// ---------------------------------------------------------------------------
// THE PATH AND THE STONES
// ---------------------------------------------------------------------------
export const PATH_HALF = 200;
/** a rough standing stone: about W wide, H tall, T thick, standing at (X, Z) (Z = its front face) */
export const STONE = { W: 210, H: 350, T: 100 };
/** the year stones stand back from the path (a broad avenue), alternating left and right */
export const STONE_X = 380;
/** the year sits toward the path on its face */
export const YEAR_IN = 0; // centred on the face
/** the year's centre on the face (height) and its size (font px in world units) */
export const YEAR_Y = -150;
export const YEAR_SIZE = 68;
/** a year has left the frame when the outer end of its text reaches the frame's edge (10 px margin) */
const D_EXIT = ((STONE_X - YEAR_IN + YEAR_SIZE * 1.25) * F) / 530;
/** the frame at which each year leaves the frame. Each is readable (whole, unhidden, 36 px+ tall) for 13+ frames
 *  before it and never half-hidden behind a nearer stone: the next year's stone stands further out and back on the
 *  other side, and the years further down the road are lost in the haze (YEAR_FADE) until they are next */
export const EXIT_F = [12, 19, 26, 33, 40];
export const YEAR_FADE: [number, number] = [1350, 1650];
export const YEARS = ["1918", "1957", "1968", "2009", "2020"];
export type Stone = { X: number; Z: number; W: number; H: number; year: string | null; seed: number; blank: "path" | "beyond" | null };
/** the blank stone in the middle of the path: the camera slows to STOP_D in front of it at STOP_F, then pushes in on the goose */
export const STOP_F = 92;
/** the next stone is the same kind as the year stones (the menhir outline, proportions, lean, carving layout), at the
 *  low end of their heights (0.9 x STONE.H, like 1918's) */
export const PATH_STONE_W = 210;
export const PATH_STONE_H = 315;
export const BLANK_Z = camZAt(STOP_F) + STOP_D;
/** the blank stones further along, beside the path again (both sides), receding into the haze */
export const BEYOND = [700, 1500, 2400, 3500, 4800, 6300, 8000];
export const STONES: Stone[] = [
  ...YEARS.map((year, i) => ({ X: (i % 2 === 0 ? -1 : 1) * STONE_X, Z: camZAt(EXIT_F[i]) + D_EXIT, W: STONE.W, H: STONE.H * (0.9 + 0.2 * ((i * 37) % 5) / 4), year, seed: i + 1, blank: null })),
  { X: 0, Z: BLANK_Z, W: PATH_STONE_W, H: PATH_STONE_H, year: null, seed: 11, blank: "path" as const },
  ...BEYOND.map((dz, i) => ({ X: (i % 2 === 0 ? -1 : 1) * STONE_X * (1 + 0.03 * i), Z: BLANK_Z + dz, W: STONE.W * (0.92 + 0.1 * (i % 3) / 2), H: STONE.H * (0.88 + 0.2 * ((i * 3) % 4) / 3), year: null, seed: 20 + i, blank: "beyond" as const })),
];

/** ATMOSPHERIC DEPTH (one function for the cut): 0 near, rising to 1 (the page tone) far away */
export const haze = (d: number) => Math.pow(c01((d - 1100) / 6400), 0.85);

/** ONE LIGHT, upper left and a little in front of the scene: the direction its rays travel (right, down, away) */
export const LIGHT: [number, number, number] = [0.5, 1, 0.8];
const LN = Math.hypot(...LIGHT);
/** brightness of a face with outward normal n (0 turned away, 1 square to the light) */
export const lightOf = (n: [number, number, number]) => Math.max(0, -(n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / LN);

// ---------------------------------------------------------------------------
// THE GOOSE (bird flu: highly pathogenic avian influenza H5N1, carried by wild waterfowl)
// ---------------------------------------------------------------------------
/** it stands on the blank stone's level top, mid-depth of the slab, turned three-quarters toward us (yaw, deg: its
 *  heading in the ground plane from + X toward + Z; negative = toward the camera) */
export type V2 = [number, number];
/** a rough standing stone (a menhir): a tall, thick pillar, a little lumpy down its sides, its top a broken slant (one
 *  shoulder high, the other well down, a chip between); it leans a little; slant and lean alternate stone to stone.
 *  Front outline, local to the stone's foot (x across, y up negative). The same for every stone, the next one too. */
export const stoneOutline = (st: Stone): V2[] => {
  const H = st.H;
  const W = st.W;
  const h = (k: number) => hash(st.seed * 17 + k, 23) - 0.5;
  const m = st.seed % 2 === 0 ? 1 : -1;
  const lean = (4 + 4 * h(11)) / H; // x shift per unit of height
  const pts: V2[] = [
    [-W / 2, 0],
    [-W / 2 - 4 + 8 * h(1), -H * 0.35],
    [-W / 2 + 2 + 8 * h(2), -H * 0.74],
    [-W * 0.38 + 8 * h(3), -H * (0.97 + 0.03 * h(4))],
    [-W * 0.14 + 10 * h(5), -H],
    [W * 0.12 + 10 * h(6), -H * (0.9 + 0.04 * h(7))],
    [W * 0.42 + 6 * h(8), -H * (0.7 + 0.05 * h(9))],
    [W / 2 + 3 * h(10), -H * 0.4],
    [W / 2, 0],
  ];
  const leant = pts.map(([x, y]) => [x - y * lean, y] as V2);
  return m === 1 ? leant : leant.map(([x, y]) => [-x, y] as V2).reverse();
};
/** the goose stands on the next stone's crown (its highest point), toward the front of the top */
const PATH_STONE = STONES.find((s) => s.blank === "path")!;
const CROWN = stoneOutline(PATH_STONE).reduce((a, p) => (p[1] < a[1] ? p : a));
export const GOOSE_REST: [number, number, number] = [CROWN[0], CROWN[1], BLANK_Z + STONE.T * 0.4];
export const GOOSE_YAW = -38;
/** where the glide starts: just off the frame's upper left, further back (it comes toward us along its heading) */
export const GOOSE_START: [number, number, number] = [-700, -900, BLANK_Z + 900];
export const G = {
  enter: 67, // the glide starts just off the frame's upper left
  flare: 84, // nose up, wings high, feet forward
  touch: 91, // CONTACT: the feet meet the stone's top (the word FLU 92)
  folded: 100, // the wings are folded (begin f92)
  shift: 140, // weight shift
  turn: 146, // head turn toward us and back
};
