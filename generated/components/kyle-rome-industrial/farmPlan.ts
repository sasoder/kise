// ---------------------------------------------------------------------------
// farmPlan: THE ROMAN FARM, the shared world of kyle-rome-industrial cuts 13 (MostlyFarmers) and 20
// (ModernYieldsMissing). Pure data and maths, no React: the eye -> camera conversion, the valley's layout (fields,
// walls, tracks, trees, villa, town, hills), every farmer, the ox team, the cart, and the wheat tufts. The drawing is
// ./farmWorld.tsx; this file is what a cut reads to place its camera and its own things.
//
// UNITS: the cast's (kyle-rome-slavery/romeFolk): a man ~312 tall = 1.75 m, U = 178 per metre. X across (screen right
// +), Y height (ground Y = 0, up is - Y), Z depth (into the picture +). londonDepth's model: the camera stands at
// Z = -Dc (< 0) and sees the world through a pinhole; this file drives it with a plain 3D EYE instead:
//   FarmEye { X, H (eye height, up +), Z (the eye's own depth, < 0), F (focal length, screen px), hy (the horizon's
//   screen row) }  ->  farmView(eye) = { cam (WorldSvg's 2D camera), depth (londonDepth DepthOpts) }
// A ground point (X, 0, Z) lands on screen at x = 540 + (X - eye.X) * s, y = hy + eye.H * s with s = F / (Z - eye.Z)
// (screen px per unit at that depth); a point at height h (up +) at y = hy + (eye.H - h) * s (screenOf below).
//
// THE VALLEY (Z rows from near to far; the depth lane X 1550..1850 runs from the cross track to the town gate):
//   N  Z -2700..-1450   the near field (cut 13's nearest reapers, at the frame's foot in its wide)
//      Z -1300..-850    the cross track (dirt, ruts); a dry-stone wall at Z -650..-560 along its far verge
//   A  Z  -350..1700    the hero's field (X -1550..1450): THE HERO reaps at X 0, Z 0 facing screen right, three
//                       neighbours in echelon behind him to the left; the left neighbour field; right of the lane
//   B  Z  2000..4200    the PLOUGH field X -200..1450: the ox team (two oxen, yoke, ard, ploughman) ploughing toward
//                       screen left at Z 2900; reapers either side
//      Z  4250..4450    a cross lane (the cart of sheaves creeps along it to the right)
//   C..G Z 4500..22000  fields to the haze (wheat being reaped, stubble with stooks, an olive grove, fallow); the
//                       villa rustica at Z 8200..9600 on the left
//   town Z 24000..29500 a small walled town on a gentle rise at the lane's end (X ~ -1100..4700); hills behind
// ---------------------------------------------------------------------------
import { random } from "remotion";
import type { Cam, DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 30000 / 1001;
/** cast units per metre */
export const U = 178;
/** (Oct 26) the people are drawn 1.12x the cast's size (picture-book proportion), so far reapers stay readable;
 *  FarmerFig, the ploughman and every pose anchor use it */
export const FIG_SCALE = 1.12;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const rnd = (seed: string | number) => random(`farm-${seed}`);

// ===================================================================================================================
// THE EYE
// ===================================================================================================================
export type FarmEye = { X: number; H: number; Z: number; F: number; hy: number };
/** the WorldSvg camera + londonDepth options that show the world from this eye (dolly 0: the eye IS where it says) */
/** londonDepth puts the camera at Z = -Dc in front of its front plane Z = 0. An eye at Z < -300 uses the world's own
 *  front plane (zOff 0: cut 13); an eye further in (cut 20 down among the fields) gets a front plane zOff = eye.Z +
 *  1200 in front of it, and farmAirOf shifts every depth by zOff (the picture is the same pinhole either way). */
export const zOffOf = (e: FarmEye) => (e.Z < -300 ? 0 : e.Z + 1200);
export const farmView = (e: FarmEye): { cam: Cam; depth: DepthOpts; zOff: number } => {
  const zOff = zOffOf(e);
  const Dc = zOff - e.Z;
  const k = e.F / Dc;
  const eyeY = -e.H;
  return { cam: { k, cx: e.X, cy: eyeY - (e.hy - 960) / k }, depth: { eyeY, dRef: Dc, kRef: k, dolly: 0 }, zOff };
};
/** screen px per world unit at depth Z */
export const scaleAt = (e: FarmEye, Z: number) => e.F / Math.max(1e-3, Z - e.Z);
/** a world point (h = height above the ground, up +) on screen */
export const screenOf = (e: FarmEye, X: number, h: number, Z: number): [number, number] => {
  const s = scaleAt(e, Z);
  return [540 + (X - e.X) * s, e.hy + (e.H - h) * s];
};
export const lerpEye = (a: FarmEye, b: FarmEye, t: number): FarmEye => ({
  X: mix(a.X, b.X, t),
  H: mix(a.H, b.H, t),
  Z: -Math.exp(mix(Math.log(-a.Z), Math.log(-b.Z), t)),
  F: mix(a.F, b.F, t),
  hy: mix(a.hy, b.hy, t),
});

/** the medium: fog by world depth Z (a crane cut: the high wide must not bury the payoff), tuned to the valley's depth */
export const FARM_SCENE = { mood: "day" as const, fogNear: 600, fogVis: 10500, fogMax: 0.9, hLow: 0, hHigh: 5200, moteUnit: U };
/** the people's fog by depth: local colour survives in rows N and A, far rows sink */
export const FARM_FIG_FOG = { near: 700, vis: 11000, max: 0.82 };

// ===================================================================================================================
// THE LAYOUT
// ===================================================================================================================
export type FieldKind = "reap" | "wheat" | "stubble" | "plough" | "olive" | "fallow";
export type Field = {
  id: string;
  row: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  kind: FieldKind;
  /** wheat tuft spacing (world units) for this row: fixed per row, never by camera (no level-of-detail pops) */
  tuft: number;
  /** a reap field: the standing wheat is on the side the reapers face; boundary X = bx + slope * (Z - z0) */
  reap?: { dir: 1 | -1; bx: number; slope: number };
  /** (Oct 26, after READY) a second team on the field's RIGHT side, facing screen left: the standing wheat is also
   *  left of X = bx + slope * (Z - z0) (two teams converging on one strip of standing wheat) */
  reap2?: { bx: number; slope: number };
};
type RowDef = { id: string; z0: number; z1: number; tuft: number; cells: [number, number, FieldKind, (1 | -1)?][] };
export const LANE = { x0: 1550, x1: 1850, z0: -850, z1: 24200 };
export const CROSS_TRACK = { z0: -1300, z1: -850 };
export const CROSS_LANE = { z0: 4250, z1: 4450 };
export const NEAR_WALL = { z0: -650, z1: -560, h: 120 };
const ROWS: RowDef[] = [
  { id: "N", z0: -2700, z1: -1450, tuft: 50, cells: [[-4200, -1250, "stubble"], [-1150, 3300, "reap", -1], [3400, 6000, "wheat"]] },
  { id: "A", z0: -780, z1: 1700, tuft: 52, cells: [[-5200, -3100, "stubble"], [-3000, -1650, "reap", 1], [-1550, 1450, "reap", 1], [1950, 3700, "reap", -1], [3800, 6200, "fallow"]] },
  { id: "B", z0: 2000, z1: 4150, tuft: 64, cells: [[-5600, -3600, "wheat"], [-2900, -500, "reap", -1], [-400, 1450, "plough"], [1950, 3900, "reap", -1], [4000, 7000, "stubble"]] },
  { id: "C", z0: 4550, z1: 7000, tuft: 80, cells: [[-7000, -4300, "fallow"], [-4200, -1600, "reap", 1], [-1500, 1450, "reap", -1], [1950, 4400, "reap", 1], [4500, 8000, "olive"]] },
  { id: "D", z0: 7400, z1: 10600, tuft: 104, cells: [[-8200, -4300, "wheat"], [-1700, 1450, "reap", 1], [1950, 5200, "reap", -1], [5300, 9000, "stubble"]] },
  { id: "E", z0: 11000, z1: 15400, tuft: 140, cells: [[-10000, -5400, "stubble"], [-5300, -1500, "reap", 1], [-1400, 1450, "reap", -1], [1950, 6200, "reap", -1], [6300, 11000, "fallow"]] },
  { id: "G", z0: 15900, z1: 22000, tuft: 190, cells: [[-12000, -6600, "wheat"], [-6500, -2300, "stubble"], [-2200, 1450, "reap", 1], [1950, 6800, "reap", -1], [6900, 13000, "stubble"]] },
];
const reapLine = (row: RowDef, x0: number, x1: number, dir: 1 | -1) => {
  // the boundary runs diagonally (the reapers work in echelon): it starts near the field's back edge on the side the
  // reapers came from and leans toward the near edge; the standing wheat is ahead of them
  const w = x1 - x0;
  const back = dir === 1 ? x0 + 0.42 * w : x1 - 0.42 * w;
  const slope = (dir === 1 ? -1 : 1) * 0.55 * (w / (row.z1 - row.z0)) * 0.6;
  return { dir, bx: back, slope };
};
export const FIELDS: Field[] = ROWS.flatMap((row) =>
  row.cells.map(([x0, x1, kind, dir], i): Field => {
    const f: Field = { id: `${row.id}${i}`, row: row.id, x0, x1, z0: row.z0, z1: row.z1, kind, tuft: row.tuft };
    if (kind === "reap") f.reap = reapLine(row, x0, x1, dir ?? 1);
    return f;
  }),
);
// the hero's field: the boundary passes just ahead of the hero's hands at X ~ 70, Z 0 and runs back to the left
const fieldById0 = (id: string) => FIELDS.find((f) => f.id === id) as Field;
const HERO_FIELD = FIELDS.find((f) => f.id === "A2") as Field;
HERO_FIELD.reap = { dir: 1, bx: 75 + 0.92 * 780, slope: -0.92 };
// the near field: reapers facing screen left, the boundary leaning back to the right
const NEAR_FIELD = FIELDS.find((f) => f.id === "N1") as Field;
NEAR_FIELD.reap = { dir: -1, bx: 1450, slope: -0.5 };
// (Oct 26) second teams and lane-side teams inside cut 13's end view, so reapers fill the whole valley
HERO_FIELD.reap2 = { bx: 1384, slope: -0.5 };
fieldById0("B1").reap = { dir: -1, bx: -1000, slope: 0.25 };
fieldById0("B3").reap = { dir: 1, bx: 2120, slope: 0.12 };
fieldById0("C2").reap = { dir: 1, bx: -900, slope: -0.24 };
fieldById0("C2").reap2 = { bx: 450, slope: 0.25 };
fieldById0("D1").reap2 = { bx: 1150, slope: 0.08 };
// the plough field ends at Z 3250; behind it a strip of wheat with its own team (B2b)
fieldById0("B2").z1 = 3250;
FIELDS.push({ id: "B2b", row: "B", x0: -400, x1: 1450, z0: 3350, z1: 4150, kind: "reap", tuft: 64, reap: { dir: -1, bx: 900, slope: 0.35 } });
export const fieldById = (id: string) => FIELDS.find((f) => f.id === id) as Field;
/** is (X, Z) standing wheat in this field? */
export const standingAt = (f: Field, X: number, Z: number) => {
  if (f.kind === "wheat") return true;
  if (f.kind !== "reap" || !f.reap) return false;
  const b = f.reap.bx + f.reap.slope * (Z - f.z0);
  if (f.reap.dir === 1 ? X <= b : X >= b) return false;
  if (f.reap2 && X >= f.reap2.bx + f.reap2.slope * (Z - f.z0)) return false;
  return true;
};
/** the standing wheat's left and right edges at depth Z (null: none standing) */
export const standingSpan = (f: Field, Z: number): [number, number] | null => {
  if (f.kind === "wheat") return [f.x0, f.x1];
  if (f.kind !== "reap" || !f.reap) return null;
  const b = f.reap.bx + f.reap.slope * (Z - f.z0);
  let L = f.reap.dir === 1 ? b : f.x0;
  let R = f.reap.dir === 1 ? f.x1 : b;
  if (f.reap2) R = Math.min(R, f.reap2.bx + f.reap2.slope * (Z - f.z0));
  L = Math.max(L, f.x0);
  R = Math.min(R, f.x1);
  return R > L ? [L, R] : null;
};
export const boundaryX = (f: Field, Z: number) => (f.reap ? f.reap.bx + f.reap.slope * (Z - f.z0) : (f.x0 + f.x1) / 2);

// ---- the wheat tufts (world space, fixed) --------------------------------------------------------------------------
export type Tuft = { X: number; Z: number; h: number; lean: number; n: number; ph: number };
const tuftsOf = (f: Field): Tuft[] => {
  if (f.kind !== "wheat" && f.kind !== "reap") return [];
  const out: Tuft[] = [];
  const s = f.tuft;
  const nx = Math.floor((f.x1 - f.x0) / s);
  const nz = Math.floor((f.z1 - f.z0) / s);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const key = `${f.id}:${i}:${j}`;
      const X = f.x0 + (i + 0.15 + 0.7 * rnd(`${key}x`)) * s;
      const Z = f.z0 + (j + 0.15 + 0.7 * rnd(`${key}z`)) * s;
      if (!standingAt(f, X, Z)) continue;
      // sparse: a few gaps
      if (rnd(`${key}g`) < 0.12) continue;
      out.push({ X, Z, h: 104 + 34 * rnd(`${key}h`), lean: (rnd(`${key}l`) - 0.5) * 0.22, n: 2 + Math.floor(rnd(`${key}n`) * 3), ph: rnd(`${key}p`) * 6.283 });
    }
  return out;
};
export const TUFTS: Record<string, Tuft[]> = Object.fromEntries(FIELDS.map((f) => [f.id, tuftsOf(f)]));
/** the wind: the sway (units at the ear) of a tuft at a frame */
export const windAt = (t: Tuft, frame: number) => 5 * Math.sin(frame * 0.075 + t.ph + t.X * 0.0011) + 2.5 * Math.sin(frame * 0.19 + t.ph * 1.7);

// ---- walls, boundary stones, tracks, trees -------------------------------------------------------------------------
export type Wall = { x0: number; x1: number; z0: number; z1: number; h: number };
export const WALLS: Wall[] = [
  // low dry-stone walls between some fields (the near wall and the lane walls were cut: they read as dead slabs)
  { x0: -1640, x1: -1570, z0: -760, z1: 1700, h: 90 },
  { x0: -3500, x1: -1600, z0: 4190, z1: 4250, h: 90 },
  { x0: -5500, x1: -1600, z0: 7130, z1: 7190, h: 90 },
  { x0: -4180, x1: -4120, z0: 4550, z1: 7000, h: 90 },
  { x0: -8200, x1: -1800, z0: 10700, z1: 10770, h: 90 },
  { x0: -5420, x1: -5350, z0: 11000, z1: 15400, h: 90 },
];
export type Stone = { X: number; Z: number };
export const STONES: Stone[] = [
  { X: -1600, Z: -790 },
  { X: -2900, Z: -790 },
  { X: 1500, Z: -1430 },
  { X: -1200, Z: -1430 },
  { X: -250, Z: 1990 },
  { X: 1500, Z: 1990 },
  { X: -3550, Z: 1990 },
  { X: 3750, Z: -790 },
];
export type Tree = { X: number; Z: number; s: number; seed: number };
export const TREES: Tree[] = (() => {
  const t: Tree[] = [];
  // the olive grove (row C right of the lane): a grid, a little irregular
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3; j++) {
      const key = `ol${i}${j}`;
      t.push({ X: 2400 + i * 700 + (rnd(`${key}x`) - 0.5) * 120, Z: 4900 + j * 780 + (rnd(`${key}z`) - 0.5) * 140, s: 0.85 + 0.3 * rnd(`${key}s`), seed: i * 7 + j });
    }
  // single olives along the walls and the lane
  const singles: [number, number, number][] = [
    [-2300, -820, 1.15],
    [2350, -700, 1.05],
    [-4300, 1900, 1.1],
    [2300, 1900, 1.0],
    [-3700, 4400, 0.95],
    [5200, 4300, 1.05],
    [-1000, 7250, 1.0],
    [-6200, 7300, 1.1],
    [2200, 7300, 0.9],
    [-4600, 10900, 1.0],
    [700, 10850, 0.95],
    [5800, 10900, 1.1],
    [-7600, 15700, 1.1],
    [2400, 15700, 1.0],
    [7400, 15600, 0.95],
    [-3400, 22300, 1.2],
    [5300, 22500, 1.15],
  ];
  singles.forEach(([X, Z, s], i) => t.push({ X, Z, s, seed: 40 + i }));
  return t;
})();

// ---- the villa rustica and the town ---------------------------------------------------------------------------------
export const VILLA = { x0: -4000, x1: -2100, z0: 8300, z1: 9500, h: 560, ridge: 300, yard: { x0: -4100, x1: -1900, z0: 7900, z1: 8300, h: 170 } };
/** the town on its rise: the ground lifts to `rise` at its back; buildings [x0, x1, z0, z1, wall h, roof h, kind] */
export const TOWN = {
  x0: -1300,
  x1: 4900,
  z0: 24200,
  z1: 29500,
  rise: 380,
  wallH: 470,
  gateX: 1700,
  houses: [
    [-900, 200, 25000, 25900, 520, 230, 0],
    [400, 1300, 24900, 25700, 600, 250, 0],
    [2150, 3100, 24900, 25800, 560, 240, 0],
    [3300, 4400, 25100, 26000, 500, 220, 0],
    [-700, 600, 26400, 27400, 680, 260, 0],
    [800, 2300, 26300, 27500, 980, 420, 1],
    [2600, 3700, 26500, 27400, 640, 250, 0],
    [3800, 4600, 26400, 27200, 560, 230, 0],
    [-400, 1000, 27900, 28900, 700, 260, 0],
    [1300, 2600, 28100, 29000, 760, 280, 0],
    [2900, 4200, 27900, 28800, 690, 260, 0],
  ] as [number, number, number, number, number, number, number][],
};
/** the ground's lift under the town (a gentle rise) */
export const townRise = (Z: number) => TOWN.rise * Math.pow(c01((Z - (TOWN.z0 - 1500)) / (TOWN.z1 - TOWN.z0 + 1500)), 1.4);
/** the hills behind the valley: [Z, base X centre, height profile] layers, far to near */
export const HILLS = [
  { Z: 78000, peaks: [[-60000, 5200], [-30000, 9800], [-8000, 7200], [12000, 10400], [36000, 7600], [62000, 11000]] as [number, number][] },
  { Z: 52000, peaks: [[-40000, 4800], [-22000, 6400], [-9000, 3000], [3000, 2400], [16000, 4200], [30000, 6800], [46000, 5200]] as [number, number][] },
  { Z: 36000, peaks: [[-30000, 3600], [-18000, 2600], [-11000, 900], [-4000, 300], [8000, 260], [14000, 1100], [21000, 2800], [32000, 3800]] as [number, number][] },
];

// ===================================================================================================================
// THE PEOPLE AND ANIMALS
// ===================================================================================================================
export type Role = "reap" | "bind" | "carry" | "glean" | "stand" | "walk";
export type Farmer = {
  id: string;
  kind: "freeman" | "slave";
  variant: number;
  X: number;
  Z: number;
  dir: 1 | -1;
  role: Role;
  /** phase offset (0..1) of the work cycle */
  ph: number;
  /** reap cycle length, frames */
  cyc: number;
  /** carry / walk: X travel per frame (world units; + = screen right) */
  vx?: number;
  /** the field the farmer stands in */
  field?: string;
  /** muted tunic override */
  tunic?: string;
  /** sheaves already lying behind a reaper / a binder's bundle count */
  sheaves?: number;
};
const KINDS: [Farmer["kind"], number, string?][] = [
  ["slave", 0],
  ["freeman", 0],
  ["slave", 1],
  ["freeman", 1, "#9A9070"],
  ["slave", 2],
  ["freeman", 2],
  ["slave", 3],
  ["slave", 4],
  ["freeman", 3],
];
const castOf = (i: number) => KINDS[i % KINDS.length];
const reapersIn = (fid: string, n: number, opts: { first?: number; step?: number; seed: number; at?: number }): Farmer[] => {
  const f = fieldById(fid);
  const r = f.reap as NonNullable<Field["reap"]>;
  const d = f.z1 - f.z0;
  const out: Farmer[] = [];
  for (let i = 0; i < n; i++) {
    const zf = (opts.first ?? 0.12) + i * (opts.step ?? (0.8 / Math.max(1, n)));
    const Z = f.z0 + zf * d + (rnd(`${fid}r${i}z`) - 0.5) * 60;
    const X = boundaryX(f, Z) - r.dir * 70;
    const [kind, variant, tunic] = castOf(opts.seed + i);
    out.push({ id: `${fid}r${i}`, kind, variant, X, Z, dir: r.dir, role: "reap", ph: rnd(`${fid}r${i}p`), cyc: 38 + Math.floor(rnd(`${fid}r${i}c`) * 10), field: fid, tunic, sheaves: 1 + Math.floor(rnd(`${fid}r${i}s`) * 2) });
  }
  return out;
};
/** a team along a field's second (right-hand) line, facing screen left */
const reapers2In = (fid: string, n: number, opts: { first: number; step: number; seed: number }): Farmer[] => {
  const f = fieldById(fid);
  const r = f.reap2 as NonNullable<Field["reap2"]>;
  const d = f.z1 - f.z0;
  return Array.from({ length: n }, (_, i): Farmer => {
    const Z = f.z0 + (opts.first + i * opts.step) * d + (rnd(`${fid}q${i}z`) - 0.5) * 50;
    const X = r.bx + r.slope * (Z - f.z0) + 70;
    const [kind, variant, tunic] = castOf(opts.seed + i);
    return { id: `${fid}q${i}`, kind, variant, X, Z, dir: -1, role: "reap", ph: rnd(`${fid}q${i}p`), cyc: 38 + Math.floor(rnd(`${fid}q${i}c`) * 10), field: fid, tunic, sheaves: 1 + Math.floor(rnd(`${fid}q${i}s`) * 2) };
  });
};
/** THE HERO: the cut-13 close-up reaper (row A, X 0, Z 0, facing screen right) */
export const HERO: Farmer = { id: "hero", kind: "freeman", variant: 0, X: 0, Z: 0, dir: 1, role: "reap", ph: 0.08, cyc: 44, field: "A2", sheaves: 1 };
export const FARMERS: Farmer[] = [
  HERO,
  // the hero's neighbours in echelon (same field), and a binder on the stubble
  { id: "A2n1", kind: "slave", variant: 1, X: -510, Z: 560, dir: 1, role: "reap", ph: 0.55, cyc: 41, field: "A2", sheaves: 2 },
  { id: "A2n2", kind: "slave", variant: 0, X: -950, Z: 1040, dir: 1, role: "reap", ph: 0.3, cyc: 46, field: "A2", sheaves: 1 },
  { id: "A2n3", kind: "freeman", variant: 2, X: -1370, Z: 1500, dir: 1, role: "reap", ph: 0.8, cyc: 40, field: "A2", sheaves: 1 },
  { id: "A2b", kind: "slave", variant: 3, X: -900, Z: 300, dir: -1, role: "bind", ph: 0.2, cyc: 52, field: "A2" },
  // the hero's field, second team converging from the right, its binder; a carrier and a gleaner on the left stubble
  ...reapers2In("A2", 5, { first: 0.375, step: 0.141, seed: 4 }),
  { id: "A2b2", kind: "slave", variant: 4, X: 1340, Z: 640, dir: -1, role: "bind", ph: 0.45, cyc: 50, field: "A2" },
  { id: "A2c", kind: "freeman", variant: 2, X: -1500, Z: 180, dir: 1, role: "carry", ph: 0.3, cyc: 30, field: "A2" },
  // the left neighbour field and right of the lane (row A)
  ...reapersIn("A1", 2, { first: 0.2, step: 0.45, seed: 3 }),
  ...reapersIn("A3", 3, { first: 0.15, step: 0.3, seed: 5 }),
  { id: "A3b", kind: "slave", variant: 3, X: 3200, Z: 300, dir: -1, role: "bind", ph: 0.7, cyc: 50, field: "A3" },
  // row B: either side of the plough field
  ...reapersIn("B1", 5, { first: 0.08, step: 0.19, seed: 1 }),
  { id: "B1b", kind: "slave", variant: 4, X: -560, Z: 3100, dir: -1, role: "bind", ph: 0.6, cyc: 50, field: "B1" },
  { id: "B1b2", kind: "freeman", variant: 3, X: -760, Z: 2350, dir: -1, role: "bind", ph: 0.1, cyc: 54, field: "B1" },
  { id: "B3g", kind: "slave", variant: 3, X: 2030, Z: 2450, dir: 1, role: "glean", ph: 0.6, cyc: 60, field: "B3" },
  { id: "C2g2", kind: "slave", variant: 1, X: -1430, Z: 6300, dir: 1, role: "glean", ph: 0.2, cyc: 60, field: "C2" },
  ...reapersIn("B3", 5, { first: 0.07, step: 0.19, seed: 6 }),
  ...reapersIn("B2b", 5, { first: 0.06, step: 0.2, seed: 5 }),
  { id: "B2bb", kind: "slave", variant: 0, X: 1330, Z: 3800, dir: -1, role: "bind", ph: 0.3, cyc: 50, field: "B2b" },
  { id: "B3b", kind: "slave", variant: 3, X: 2015, Z: 3150, dir: 1, role: "bind", ph: 0.15, cyc: 48, field: "B3" },
  // row C
  ...reapersIn("C1", 4, { first: 0.1, step: 0.22, seed: 2 }),
  ...reapersIn("C2", 5, { first: 0.06, step: 0.18, seed: 4 }),
  ...reapers2In("C2", 5, { first: 0.08, step: 0.18, seed: 2 }),
  { id: "C2b", kind: "slave", variant: 0, X: -1420, Z: 5350, dir: 1, role: "bind", ph: 0.4, cyc: 50, field: "C2" },
  { id: "C2b2", kind: "slave", variant: 3, X: 1260, Z: 5900, dir: -1, role: "bind", ph: 0.8, cyc: 50, field: "C2" },
  ...reapersIn("C3", 4, { first: 0.1, step: 0.22, seed: 7 }),
  { id: "C2g", kind: "slave", variant: 3, X: 1100, Z: 5000, dir: -1, role: "glean", ph: 0.4, cyc: 60, field: "C2" },
  // row D
  ...reapersIn("D1", 5, { first: 0.08, step: 0.18, seed: 8 }),
  ...reapers2In("D1", 4, { first: 0.1, step: 0.22, seed: 3 }),
  ...reapersIn("D2", 4, { first: 0.1, step: 0.22, seed: 0 }),
  // row E
  ...reapersIn("E1", 4, { first: 0.12, step: 0.22, seed: 3 }),
  ...reapersIn("E2", 4, { first: 0.12, step: 0.22, seed: 6 }),
  ...reapersIn("E3", 4, { first: 0.12, step: 0.22, seed: 1 }),
  // row G (far: they melt into the air)
  ...reapersIn("G2", 4, { first: 0.12, step: 0.22, seed: 5 }),
  ...reapersIn("G3", 4, { first: 0.12, step: 0.22, seed: 2 }),
  // the near field (row N): facing screen left
  { id: "N1r0", kind: "slave", variant: 2, X: 1180, Z: -2030, dir: -1, role: "reap", ph: 0.35, cyc: 42, field: "N1", sheaves: 2 },
  { id: "N1r1", kind: "freeman", variant: 1, X: 780, Z: -2100, dir: -1, role: "reap", ph: 0.7, cyc: 45, field: "N1", tunic: "#9A9070", sheaves: 1 },
  { id: "N1r2", kind: "slave", variant: 4, X: 380, Z: -2020, dir: -1, role: "reap", ph: 0.05, cyc: 40, field: "N1", sheaves: 2 },
  { id: "N1b", kind: "slave", variant: 3, X: -150, Z: -2060, dir: 1, role: "bind", ph: 0.5, cyc: 50, field: "N1" },
  // on the lane toward town, and at the town gate (not in a field: only these few)
  { id: "L1", kind: "freeman", variant: 2, X: 1700, Z: 13600, dir: 1, role: "stand", ph: 0, cyc: 30 },
  { id: "T1", kind: "freeman", variant: 0, X: 1450, Z: 24050, dir: 1, role: "stand", ph: 0, cyc: 30 },
  { id: "T2", kind: "freeman", variant: 3, X: 1980, Z: 24020, dir: -1, role: "stand", ph: 0, cyc: 30 },
  { id: "T3", kind: "slave", variant: 1, X: 2200, Z: 23950, dir: -1, role: "stand", ph: 0.5, cyc: 30 },
];

// ---- the ox team -------------------------------------------------------------------------------------------------
/** the ox team ploughs the plough field (B2) toward screen LEFT (dir -1): the near ox's feet at Z, the far ox at
 *  Z + farDZ; the yoke on their necks, the pole back to the ard, the ploughman behind. X(frame) = x0 + vx * frame
 *  (the head end); one stride cycle = cyc frames */
export const OX_TEAM = { dir: -1 as const, x0: 560, vx: -2.1, Z: 2900, farDZ: 260, cyc: 44, field: "B2" };
/** where the share is (cutting the furrow) at a frame: the ard's share behind the oxen */
export const OX_LEN = 430;
export const ARD = { shareBack: 460, handleBack: 600 };
export const oxTeamX = (frame: number) => OX_TEAM.x0 + OX_TEAM.vx * frame;
export const shareX = (frame: number) => oxTeamX(frame) - OX_TEAM.dir * (OX_LEN + ARD.shareBack - 260);
/** the ploughed strips of the plough field: furrows along X; the current furrow at the team's Z ends at the share */
export const PLOUGH = { furrow: 70, doneZ0: 2050, doneZ1: 2780 };
// ---- the cart ----------------------------------------------------------------------------------------------------
/** the cart of sheaves on the cross lane between rows B and C, an ox pulling it toward screen right */
export const CART = { x0: -900, vx: 1.6, Z: 4370, cyc: 52 };
export const cartX = (frame: number) => CART.x0 + CART.vx * frame;

// ===================================================================================================================
// CUT 13's CAMERA (exported so cut 20 knows where 13 ended)
// ===================================================================================================================
/** the crane: one eased pull-back and rise along the line through the hero's hands, which stay near one screen row;
 *  the progress u runs on pchip keys (moving at f0, fastest through f40-70, landing by f104, then a slow creep) */
export const CUT13_START: FarmEye = { X: 40, H: 0, Z: -536, F: 1500, hy: 432 };
export const CUT13_END: FarmEye = { X: 400, H: 0, Z: -4167, F: 1500, hy: 330 };
export const HANDS_H = 80;
const RATIO = [0.354, 0.468];
/** the hero's feet drift on one straight screen path, x 470 -> 400 (the eye's X follows from it) */
export const HERO_SX = [470, 400];
export const cut13EyeOfU = (u: number): FarmEye => {
  const e = lerpEye(CUT13_START, CUT13_END, u);
  const D = -e.Z;
  const s = e.F / D;
  return { ...e, X: HERO.X + (540 - mix(HERO_SX[0], HERO_SX[1], u)) / s, H: HANDS_H + mix(RATIO[0], RATIO[1], u) * D };
};
/** the progress u(f): ONE speed lobe (a beta-shaped bell from f -6 to f 108, peak ~f61: slow off the close-up, fastest
 *  through "economy. So agriculture", landed by "dominant": u(102) = 0.985) over a constant creep (u' 0.0011 per frame,
 *  so it is already moving at f0 and still drifting at the cut). Integrated once at load. */
export const CUT13_SPEED = { f0: -6, f1: 108, a: 2.4, b: 1.7, creep: 0.0011, landF: 102, landU: 0.985 };
const U_TABLE: number[] = (() => {
  const { f0, f1, a, b, creep, landF, landU } = CUT13_SPEED;
  const bell = (f: number) => {
    const x = (f - f0) / (f1 - f0);
    return x > 0 && x < 1 ? Math.pow(x, a) * Math.pow(1 - x, b) : 0;
  };
  // trapezoid integral on a fine step
  const N = 8;
  const cum: number[] = [0];
  for (let f = 0; f < 160; f++) {
    let acc = 0;
    for (let i = 0; i < N; i++) acc += (bell(f + i / N) + bell(f + (i + 1) / N)) / (2 * N);
    cum.push(cum[f] + acc);
  }
  const k = (landU - creep * landF) / cum[landF];
  return cum.map((c, f) => c * k + creep * f);
})();
export const cut13U = (frame: number) => {
  const f = Math.max(0, Math.min(U_TABLE.length - 2, frame));
  const i = Math.floor(f);
  return U_TABLE[i] + (U_TABLE[i + 1] - U_TABLE[i]) * (f - i);
};
export const cut13EyeAt = (frame: number): FarmEye => cut13EyeOfU(cut13U(frame));
