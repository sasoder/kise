import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  CaptionStripDebug,
  ChainEcho,
  EASE_LAND,
  FPS as SHARED_FPS,
  Figure,
  INK,
  Newspaper,
  PAPERS_NUMBER,
  PAPER_BASE,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  TallPaper,
  WorldTall,
  camEase,
  clamp,
  gridPos,
  runCamera2,
  sway,
  textRise,
  type,
} from "./deathCountShared";

// ---------------------------------------------------------------------------
// "ROCK COLLAPSED / NEWSPAPER REPORTS" — cut A of "brent - the mine death
// count" (Core Memory, Brent Underwood). 1080 x 1920, 24000/1001 fps, 220
// frames, opaque. Core memory graphic standard; legend in deathCountShared.
//
// CHECK LINE: "The roof came down on the men working under it and they are
// still in there; and the newspapers could not even say how many: somewhere
// between 8 and 30."
//
// THE MOTION. One world, two stations, one move. LEFT: a mine in section (the
// surface and a headframe up top, the shaft down the right side, a level with
// a room) whose thin ceiling slab cracks, drops on the men and is followed
// down by the rock above it until the room is a jammed pile; the camera pushes
// in to a close-up of the men at the foot of the pile and they turn black.
// Then ONE peaked pan to the right (bezier 0.8, 0, 0.2, 1) lands on a
// newspaper, under which the count rises into rows of ten: eight solid
// figures, then twenty-two hollow ones, and the numerals "8 - 30" under the
// caption strip.
//
// THE WORDS (local frames, f0 = sequence frame 208):
//   the f7 · rock f15 · collapsed f20-33 · on a number of f33-47 ·
//   miners f47-56 · they f68 · died f83-90 · and they're f90-100 ·
//   still there f100-108 · And if you look at the f111-126 ·
//   newspaper f126-133 · reports f133-143 · it says f148-155 ·
//   between f155-166 · 8 f166-180 · and f180 · 30 f189-198 ·
//   people f198-205 · died f205-214 · END f220
//
// THE BEATS:
//   f0      deep in a mine: sky, the ground line, a headframe over the collar,
//           the shaft, the level's room with its thin cracked slab under a low
//           worked-out gap, four men swinging picks (the fourth half cut by
//           the left edge: the picture never says how many), "200 FT"
//   f0-18   the cracks run through; three chips drop off the underside
//   f18-24  the slab lets go in ten blocks, the middle first
//   f27-31  the blocks over the men reach them (each man goes over, and drops
//           his pick, on the frame rock touches him); f29-32 the blocks
//           between them hit the floor, each lying over ONE man's shoulder
//   f25-46  the rock over the gap follows it down, course by course; the hole
//           it leaves is the new roof: lopsided, ragged, highest to the right
//   f56     the last block is at rest: the room is a jammed pile, and the men
//           are still visible at its foot (nothing rests in front of a body)
//   f58-100 the camera pushes in to the close-up (k 1.04 -> 1.47, each man
//           250 px); f83-106 each man is traced in black from one point, then
//           the black fills him from the ground up
//   f106-146 THE PAN, 1424 world px to the right, out across the shaft, the
//           rock margin, the ragged edge of the section and open paper
//   f124-160 the newspaper prints; f132-158 three more sheets rise behind it
//   f138-156 three rules; f165-180 eight SOLID figures rise into their slots
//           from behind the first rule; f182-198 twenty-two HOLLOW ones, row
//           by row; "8" f169, "- 30" f187
//   f138-220 the newspaper's frame creeps in at one steady rate from the
//           landing to the last frame (k 0.975 -> 1.03): the hold is alive
//
// THE CAMERA — two keyed tracks (the mine, the newspaper), each damped by
// runCamera2, joined by the pan's bezier directly: the follower never smears
// the pan, and the bezier's slope is 0 at both ends, so there is no kink.
// The mine's framing keeps the frame's left edge on world x 0 and the floor
// line just above the caption strip at every k. During the burst the world
// layer gets a horizontal-only Gaussian, sigma 0.22 x the screen px travelled
// that frame (the paper's plane, at 0.15 of the camera, gets 0.15 of it).
// THE DAMPED NUMBERS (no sway; floor = the room floor's screen y; left = the
// world x on the frame's left edge; px/f = the camera's screen px that frame):
//     f    k      cx       cy     floor   left   px/f
//     0    1.000    540.0   960.0   1050      0    0.0
//     12   1.005    537.2   960.4   1050      0    0.4
//     24   1.013    532.8   966.0   1045      0    1.8
//     30   1.018    530.7   974.6   1037      0    0.6   the dip's bottom, 14 px
//     40   1.025    527.1   964.7   1047      0    1.1
//     58   1.037    520.7   962.4   1051      0    0.4   the push-in starts
//     70   1.086    497.7   965.4   1052      0    4.3
//     83   1.258    429.9   974.0   1056      0    6.9
//     90   1.366    395.8   978.4   1058      0    5.9
//     100  1.461    369.7   981.7   1060      0    1.7   the close-up
//     106  1.474    366.3   982.2   1060      0    0.5   the pan starts
//     118  1.440    472.5   981.0   1059     97   32.2
//     126  1.207   1075.6   971.6   1055    628  202.0   the peak
//     134  1.008   1680.4   961.8      -   1145   27.6
//     146  0.978   1790.0   960.0      -   1238    0.5   landed (under 2 px/f from f145)
//     160  0.987   1790.0   960.0      -   1243    0.0
//     178  1.000   1790.0   960.0      -   1250    0.0
//     198  1.014   1790.0   960.0      -   1257    0.0
//     219  1.029   1790.0   960.0      -   1265    0.0
//
// THE ROCK IS NOT ANIMATED BY HAND. Every block that falls is a tile of the
// slab or of the roof over it (so the intact rock is exactly those tiles, and
// the hole a block leaves is its own outline). Where each comes to rest is
// worked out once, at load (`pack`): the four floor blocks are seated beside
// the men, the men's bodies are then marked as ground nothing may rest in
// front of, and every other block is dropped in release order onto a height
// map of the pile. Each falls under one gravity, turning as it goes, and never
// lands before the block it bears on.
// ---------------------------------------------------------------------------

export const FPS = SHARED_FPS;
export const DURATION = 220;

export const schema = z.object({
  levelTag: z.string(),
  countLow: z.string(),
  countHigh: z.string(),
  debugCaptions: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = {
  levelTag: "200 FT",
  countLow: "8",
  countHigh: "30",
  debugCaptions: false,
};

// -- small maths -----------------------------------------------------------------
type Pt = { x: number; y: number };
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => camEase(u, 1);
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const DEG = Math.PI / 180;

const centroid = (poly: Pt[]): Pt => {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const w = p.x * q.y - q.x * p.y;
    a += w;
    cx += (p.x + q.x) * w;
    cy += (p.y + q.y) * w;
  }
  return { x: cx / (3 * a), y: cy / (3 * a) };
};
const rotPoly = (poly: Pt[], c: Pt, deg: number): Pt[] => {
  const co = Math.cos(deg * DEG);
  const si = Math.sin(deg * DEG);
  return poly.map((p) => ({
    x: c.x + (p.x - c.x) * co - (p.y - c.y) * si,
    y: c.y + (p.x - c.x) * si + (p.y - c.y) * co,
  }));
};
const polyD = (poly: Pt[]) => `M${poly.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")} Z`;

// ===========================================================================
// STATION 1 — THE MINE IN SECTION (world px; at f0 the camera is k 1 at
// (540, 960), so world = screen there). Sky is the paper; the rock starts at
// the ground line, which rises gently to the left (the mountain's flank). A
// headframe stands on the bench over the shaft collar; the shaft runs down the
// right side; the room (the stope) opens into it through the level's station;
// the lower levels all come off the same shaft.
// ===========================================================================
const FLOOR = 1050;
const FLOOR_LIFT = SHADOW_OFF; // a thing on the floor shows its shadow as a line
const BASE_Y = FLOOR - FLOOR_LIFT;
const ROOM = { x0: -260, x1: 820, top: 700 }; // 350 tall
const SLAB_TOP = 648; // the slab is 52 thick: thinner than everything else
const VOID = { x0: -260, x1: 814, top: 618 }; // the low worked-out gap over the slab
const SHAFT = { x0: 900, x1: 970 };
const COLLAR_Y = 215;
const STATION = { x: ROOM.x1 - 1, y: 930, w: SHAFT.x0 - ROOM.x1 + 2, h: FLOOR - 930 };
const DRIFTS = [
  { x: -700, y: 1330, w: 1601, h: 42 },
  { x: 610, y: 1372, w: 42, h: 188 },
  { x: 180, y: 1560, w: 1400, h: 42 }, // through the shaft and out of the section's edge
  { x: -700, y: 1790, w: 1601, h: 42 },
];
/** the ground: the mountain's flank, with a flat bench at the collar */
const GROUND: Pt[] = [
  { x: -800, y: 48 },
  { x: -300, y: 110 },
  { x: 0, y: 142 },
  { x: 250, y: 168 },
  { x: 500, y: 185 },
  { x: 730, y: 205 },
  { x: 840, y: COLLAR_Y },
  { x: 1104, y: COLLAR_Y },
];
/** the ragged right edge of the rock mass: the edge of the section drawing */
const ROCK_EDGE_X = 1140;
const ROCK_BOTTOM = 2500;
const ROCK_D = (() => {
  const pts: string[] = GROUND.map((q) => `${q.x} ${q.y}`);
  let y = COLLAR_Y + 14;
  let i = 0;
  while (y < ROCK_BOTTOM) {
    const x = ROCK_EDGE_X + (i % 2 === 0 ? -1 : 1) * (10 + hash(i, 17) * 30);
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
    y += 46 + hash(i, 29) * 84;
    i++;
  }
  return `M${pts.join(" L")} L${ROCK_EDGE_X} ${ROCK_BOTTOM} L-800 ${ROCK_BOTTOM} Z`;
})();

// -- the men (defined first: the rock is packed AROUND where they end up) ---------------
const MINER_S = 170;
const MINER_TOP = BASE_Y - 0.9 * MINER_S; // box top when standing
/** x = where he stands; tilt / slide = how the rock leaves him */
const MINERS = [
  { x: 0, tilt: -14, slide: -4, phase: 0.6 },
  { x: 212, tilt: 20, slide: 6, phase: 0.1 },
  { x: 428, tilt: -14, slide: -6, phase: 0.45 },
  { x: 640, tilt: -22, slide: -8, phase: 0.78 },
];
/** the bust as two convex polygons about its base centre (cx, BASE_Y), turned
 *  `deg` about that point; `grow` fattens it (the contact test's tolerance) */
const silhouette = (cx: number, deg: number, grow = 0) => {
  const co = Math.cos(deg * DEG);
  const si = Math.sin(deg * DEG);
  const tr = (x: number, y: number): Pt => ({ x: cx + x * co - y * si, y: BASE_Y + x * si + y * co });
  const sr = 0.38 * MINER_S + grow;
  const hr = 0.17 * MINER_S + grow;
  const shoulders: Pt[] = [];
  for (let a = 0; a <= 180; a += 6) shoulders.push(tr(sr * Math.cos(a * DEG), -sr * Math.sin(a * DEG)));
  const head: Pt[] = [];
  for (let a = 0; a < 360; a += 20) head.push(tr(hr * Math.cos(a * DEG), -0.63 * MINER_S + hr * Math.sin(a * DEG)));
  return { shoulders, head };
};
const REST = MINERS.map((m) => silhouette(m.x + m.slide, m.tilt));
const STAND = MINERS.map((m) => silhouette(m.x, 0, 3));
/** how far the block beside each man reaches over his right shoulder */
const SHOULDER_OVERLAP = 32;
const REST_RIGHT = REST.map((r) => r.shoulders.reduce((mx, q) => Math.max(mx, q.x), -Infinity));

const GRAV = 6.4; // world px / frame^2
const BOUNCE_F = 5;

// -- the pieces: everything that falls ------------------------------------------------
type Mark = { a: Pt; b: Pt; f1: number };
type Piece = {
  kind: "chip" | "slab" | "roof";
  src: Pt[];
  hull: Pt[];
  c: Pt;
  d: string;
  release: number;
  T: number; // fall frames; 0 = never lets go
  dx: number;
  dy: number;
  rot: number;
  bounce: number;
  thetas: number[];
  shifts: number[];
  marks: Mark[];
  /** hand-seated: its left edge at rest, and its turn (the floor blocks) */
  fix?: { left: number; rot: number };
};

const mk = (
  kind: Piece["kind"],
  src: Pt[],
  release: number,
  thetas: number[],
  shifts: number[],
  hull: Pt[] = src,
  marks: Mark[] = [],
): Piece => ({
  kind,
  src,
  hull,
  c: centroid(src),
  d: polyD(src),
  release,
  T: 0,
  dx: 0,
  dy: 0,
  rot: 0,
  bounce: 0,
  thetas,
  shifts,
  marks,
});

const range = (a: number, b: number, step: number) => {
  const out: number[] = [];
  for (let v = a; v <= b + 1e-6; v += step) out.push(v);
  return out;
};

// chips: three flakes off the slab's underside before it goes
const CHIPS = [
  { x: 110, f: 2.4, block: 3, drift: -10 },
  { x: 320, f: 7.3, block: 5, drift: 12 },
  { x: 536, f: 12.6, block: 7, drift: -8 },
];
const CHIP_W = 22;
const CHIP_H = 22;
const chipTri = (x: number): Pt[] => [
  { x: x - CHIP_W, y: ROOM.top },
  { x: x + 6, y: ROOM.top - CHIP_H },
  { x: x + CHIP_W, y: ROOM.top },
];

// The slab's joints (top x, bottom x): ten blocks. Blocks 2, 4, 6, 8 hang over
// the four men; blocks 3, 5, 7, 9 hang over the floor between them.
const JOINT_X = [-260, -156, -52, 60, 156, 272, 368, 488, 584, 700, 820];
// slanted so the floor blocks (3, 5, 7, 9) are the narrower ones along their bottom edge
const JOINT_SLANT = [0, 6, -7, -6, 7, -6, 6, -7, 6, -6, 0];
const JOINTS = JOINT_X.map((x, i) =>
  i === JOINT_X.length - 1 ? { top: x - 6, bot: x } : { top: x + JOINT_SLANT[i], bot: x - JOINT_SLANT[i] },
);
const N_SLAB = JOINTS.length - 1;
// the middle goes first, then outward
const SLAB_RELEASE = [23.8, 23.0, 22.2, 21.0, 20.0, 19.0, 18.2, 19.4, 20.4, 21.4];
const SLAB_MARKS: Mark[][] = [
  [],
  [],
  [],
  [{ a: { x: 78, y: SLAB_TOP }, b: { x: 92, y: SLAB_TOP + 28 }, f1: 12 }],
  [],
  [{ a: { x: 346, y: SLAB_TOP }, b: { x: 334, y: SLAB_TOP + 26 }, f1: 9 }],
  [],
  [{ a: { x: 560, y: SLAB_TOP }, b: { x: 572, y: SLAB_TOP + 28 }, f1: 15 }],
  [],
  [{ a: { x: 770, y: ROOM.top }, b: { x: 754, y: ROOM.top - 28 }, f1: 14 }],
];
/** the floor blocks: seated by hand so each lies over ONE man's shoulder */
const FLOOR_BLOCKS: Record<number, { man: number; rot: number }> = {
  3: { man: 0, rot: -3 },
  5: { man: 1, rot: 2 },
  7: { man: 2, rot: -2 },
  9: { man: 3, rot: 3 },
};
/** the joint cracks: which end they start from, how far they are at f0, when
 *  they are through */
const CRACKS = [
  { joint: 3, from: "bot", p0: 0.3, f1: 17 },
  { joint: 4, from: "top", p0: 0.5, f1: 13 },
  { joint: 5, from: "bot", p0: 0.4, f1: 15 },
  { joint: 6, from: "top", p0: 0.62, f1: 9 },
  { joint: 7, from: "bot", p0: 0.55, f1: 11 },
  { joint: 8, from: "top", p0: 0.35, f1: 16 },
  { joint: 9, from: "bot", p0: 0.3, f1: 17 },
  { joint: 10, from: "bot", p0: 0.25, f1: 18 },
] as const;

// The roof over the gap: a jittered lattice of blocks. What lets go is LOPSIDED
// on purpose (a long low left side, ragged steps, the highest point well right
// of centre, a short steep right side): a caved roof, not a gable.
const LX0 = -260;
const LDX = 108;
const LROW = 60;
const latt = (j: number, r: number): Pt => {
  const jx = j === 0 || (j === 10 && r === 0) ? 0 : r === 0 ? (hash(j, 3) - 0.5) * 24 : (hash(j * 3 + 1, r * 7 + 2) - 0.5) * 48;
  const jy = r === 0 ? 0 : (hash(j * 5 + 2, r * 11 + 5) - 0.5) * (r === 1 ? 26 : 38);
  return { x: LX0 + j * LDX + jx, y: VOID.top - r * LROW + jy };
};
const cell = (j: number, r: number): Pt[] => [latt(j, r + 1), latt(j + 1, r + 1), latt(j + 1, r), latt(j, r)];
const MID_X = 410;
type CellKind = "B" | "H" | "D1" | "D2" | "ul" | "ur" | "ll" | "lr";
const ROOF: Array<{ j: number; r: number; kind: CellKind }> = [
  ...range(0, 9, 1).map((j) => ({ j, r: 0, kind: "B" as CellKind })),
  ...range(0, 7, 1).map((j) => ({ j, r: 1, kind: "H" as CellKind })),
  { j: 8, r: 1, kind: "D1" },
  { j: 9, r: 1, kind: "B" },
  { j: 5, r: 2, kind: "lr" },
  { j: 6, r: 2, kind: "H" },
  { j: 7, r: 2, kind: "D2" },
  { j: 8, r: 2, kind: "H" },
  { j: 9, r: 2, kind: "ll" },
  { j: 7, r: 3, kind: "lr" },
  { j: 8, r: 3, kind: "D1" },
];
const ROOF_F0 = [24.5, 30, 35.5, 39.5];
const ROOF_MID = [MID_X, MID_X, 560, 640];

const T_FLAT = range(-10, 10, 2);
// the blocks that land on the men come to rest askew, one end on a head (not level, like a hat)
const T_HEAD = [-17, -14, -11, -9, 9, 11, 14, 17];
const S_HEAD = range(-40, 40, 4);
const T_BLOCK = [...range(-32, 32, 4), ...range(62, 118, 4), ...range(-118, -62, 4)];
const T_ANY = range(0, 355, 5);
const SHIFTS = range(-128, 128, 4);

const buildPieces = (): Piece[] => {
  const out: Piece[] = [];
  for (const ch of CHIPS) out.push(mk("chip", chipTri(ch.x), ch.f, [0], [ch.drift]));
  for (let i = 0; i < N_SLAB; i++) {
    const a = JOINTS[i];
    const b = JOINTS[i + 1];
    const hull: Pt[] = [
      { x: a.top, y: SLAB_TOP },
      { x: b.top, y: SLAB_TOP },
      { x: b.bot, y: ROOM.top },
      { x: a.bot, y: ROOM.top },
    ];
    const src: Pt[] = [hull[0], hull[1], hull[2]];
    for (const ch of CHIPS.filter((c) => c.block === i).sort((p, q) => q.x - p.x)) {
      const t = chipTri(ch.x);
      src.push(t[2], t[1], t[0]);
    }
    src.push(hull[3]);
    const overMan = i === 2 || i === 4 || i === 6 || i === 8;
    const piece = mk("slab", src, SLAB_RELEASE[i], overMan ? T_HEAD : T_FLAT, overMan ? S_HEAD : range(-14, 14, 2), hull, SLAB_MARKS[i]);
    const fb = FLOOR_BLOCKS[i];
    if (fb) piece.fix = { left: REST_RIGHT[fb.man] - SHOULDER_OVERLAP, rot: fb.rot };
    out.push(piece);
  }
  for (const c of ROOF) {
    const q = cell(c.j, c.r);
    const mt = lerpPt(q[0], q[1], 0.5 + (hash(c.j, 53 + c.r) - 0.5) * 0.3);
    const mb = lerpPt(q[3], q[2], 0.5 + (hash(c.j, 59 + c.r) - 0.5) * 0.3);
    const tri = { ul: [q[0], q[1], q[3]], lr: [q[1], q[2], q[3]], ur: [q[0], q[1], q[2]], ll: [q[0], q[2], q[3]] };
    const parts: Pt[][] =
      c.kind === "B"
        ? [q]
        : c.kind === "H"
          ? [
              [q[0], mt, mb, q[3]],
              [mt, q[1], q[2], mb],
            ]
          : c.kind === "D1"
            ? [tri.ur, tri.ll]
            : c.kind === "D2"
              ? [tri.ul, tri.lr]
              : [tri[c.kind]];
    parts.forEach((part, n) => {
      const xc = centroid(part).x;
      const rel =
        ROOF_F0[c.r] +
        (Math.abs(xc - ROOF_MID[c.r]) / LDX) * (c.r === 0 ? 1.1 : c.r === 1 ? 1.0 : 1.3) +
        hash(c.j * 2 + n, 41 + c.r * 7) * (1 + c.r * 0.2);
      out.push(mk("roof", part, rel, part.length === 3 ? T_ANY : T_BLOCK, SHIFTS));
    });
  }
  return out.sort((p, q) => p.release - q.release);
};

// -- the packer: drop each piece onto a height map of the pile -------------------------
const COL = 4;
const NCOL = Math.ceil((ROOM.x1 - ROOM.x0) / COL);
const GAP = 7; // paper between two resting pieces
const PAD = 1; // columns of sideways clearance
const WALL = 5;
const VOID_CAP = 34; // a pocket deeper than this costs no more: blocks may bridge the gaps between the men

const spanAt = (poly: Pt[], x: number): [number, number] | null => {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a.x <= x && b.x >= x) || (b.x <= x && a.x >= x)) {
      if (a.x === b.x) {
        lo = Math.min(lo, a.y, b.y);
        hi = Math.max(hi, a.y, b.y);
      } else {
        const y = a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
      }
    }
  }
  return hi >= lo ? [lo, hi] : null;
};
const profile = (poly: Pt[]) => {
  let xmin = Infinity;
  let xmax = -Infinity;
  for (const p of poly) {
    xmin = Math.min(xmin, p.x);
    xmax = Math.max(xmax, p.x);
  }
  const i0 = Math.floor((xmin - ROOM.x0) / COL);
  const i1 = Math.max(i0, Math.ceil((xmax - ROOM.x0) / COL) - 1);
  const top: number[] = [];
  const bot: number[] = [];
  for (let i = i0; i <= i1; i++) {
    const xa = Math.max(xmin, ROOM.x0 + i * COL);
    const xb = Math.min(xmax, ROOM.x0 + (i + 1) * COL);
    let lo = Infinity;
    let hi = -Infinity;
    for (const xs of [xa, xb]) {
      const s = spanAt(poly, xs);
      if (s) {
        lo = Math.min(lo, s[0]);
        hi = Math.max(hi, s[1]);
      }
    }
    for (const p of poly) {
      if (p.x >= xa && p.x <= xb) {
        lo = Math.min(lo, p.y);
        hi = Math.max(hi, p.y);
      }
    }
    top.push(lo);
    bot.push(hi);
  }
  return { xmin, xmax, i0, i1, top, bot };
};

const pack = (pieces: Piece[]) => {
  const H: number[] = new Array(NCOL).fill(FLOOR - FLOOR_LIFT + GAP);
  const LAND: number[] = new Array(NCOL).fill(0);
  const seat = (p: Piece, pr: ReturnType<typeof profile>, dx: number, dy: number, rot: number) => {
    p.dx = dx;
    p.dy = dy;
    p.rot = rot;
    p.T = Math.sqrt((2 * dy) / GRAV);
    const n0 = pr.i1 - pr.i0;
    let support = 0;
    for (let i = pr.i0 - PAD; i <= pr.i1 + PAD; i++) {
      if (i < 0 || i >= NCOL) continue;
      const b = pr.bot[Math.max(0, Math.min(n0, i - pr.i0))] + dy;
      if (H[i] - GAP - b < 14) support = Math.max(support, LAND[i]); // a column it bears on
    }
    // never land before the thing it rests on has landed
    if (p.release + p.T < support + 0.4) p.release = support + 0.4 - p.T;
    for (let i = pr.i0 - PAD; i <= pr.i1 + PAD; i++) {
      if (i < 0 || i >= NCOL) continue;
      const t = pr.top[Math.max(0, Math.min(n0, i - pr.i0))] + dy;
      if (t < H[i]) {
        H[i] = t;
        LAND[i] = p.release + p.T;
      }
    }
  };
  // 1. the floor blocks, seated by hand beside the men
  for (const p of pieces) {
    if (!p.fix) continue;
    const rp = rotPoly(p.src, p.c, p.fix.rot);
    const sx = p.fix.left - rp.reduce((mn, q) => Math.min(mn, q.x), Infinity);
    const pr = profile(rp.map((q) => ({ x: q.x + sx, y: q.y })));
    let dy = Infinity;
    for (let i = pr.i0; i <= pr.i1; i++) {
      if (i < 0 || i >= NCOL) continue;
      dy = Math.min(dy, H[i] - GAP - pr.bot[i - pr.i0]);
    }
    seat(p, pr, sx, dy, p.fix.rot);
  }
  // 2. the men: nothing else may come to rest in front of a body
  for (const r of REST) {
    for (let i = 0; i < NCOL; i++) {
      let top = Infinity;
      for (const x of [ROOM.x0 + i * COL, ROOM.x0 + (i + 0.5) * COL, ROOM.x0 + (i + 1) * COL]) {
        for (const poly of [r.shoulders, r.head]) {
          const sp = spanAt(poly, x);
          if (sp) top = Math.min(top, sp[0]);
        }
      }
      if (top < H[i]) {
        H[i] = top;
        LAND[i] = 0; // he was standing there all along
      }
    }
  }
  // 3. everything else, in the order it lets go
  pieces.forEach((p, n) => {
    if (p.fix) return;
    if (p.kind === "chip") {
      // chips lie on the floor and are buried; they do not prop anything up
      let maxY = -Infinity;
      for (const q of p.src) maxY = Math.max(maxY, q.y);
      p.dy = FLOOR - FLOOR_LIFT - maxY;
      p.dx = p.shifts[0];
      p.rot = 0;
      p.T = Math.sqrt((2 * p.dy) / GRAV);
      p.bounce = 12;
      return;
    }
    let best: { score: number; dx: number; dy: number; rot: number; pr: ReturnType<typeof profile> } | null = null;
    for (const th of p.thetas) {
      const rp = rotPoly(p.src, p.c, th);
      const pr0 = profile(rp);
      for (const sx of p.shifts) {
        if (pr0.xmin + sx < ROOM.x0 + WALL || pr0.xmax + sx > ROOM.x1 - WALL) continue;
        const pr = sx === 0 ? pr0 : profile(rp.map((q) => ({ x: q.x + sx, y: q.y })));
        const n0 = pr.i1 - pr.i0;
        let dy = Infinity;
        for (let i = pr.i0 - PAD; i <= pr.i1 + PAD; i++) {
          if (i < 0 || i >= NCOL) continue;
          const b = pr.bot[Math.max(0, Math.min(n0, i - pr.i0))];
          dy = Math.min(dy, H[i] - GAP - b);
        }
        if (dy < 24) continue;
        let v = 0;
        let cnt = 0;
        for (let i = pr.i0; i <= pr.i1; i++) {
          if (i < 0 || i >= NCOL) continue;
          v += Math.min(VOID_CAP, H[i] - GAP - pr.bot[i - pr.i0] - dy);
          cnt++;
        }
        const voidH = v / Math.max(1, cnt);
        // a narrow slot left beside the piece can never be filled: avoid making one
        let slots = 0;
        for (const side of [-1, 1]) {
          const edge = side < 0 ? pr.i0 : pr.i1;
          const edgeBot = pr.bot[side < 0 ? 0 : n0] + dy;
          let w = 0;
          let i = edge + side;
          while (i >= 0 && i < NCOL && H[i] - GAP > edgeBot + 26 && w < 16) {
            w++;
            i += side;
          }
          if (w > 0 && w < 16) slots += 1;
        }
        // a block standing on end reads as a spike: prefer it lying down
        let top = Infinity;
        let bottom = -Infinity;
        for (let i = 0; i <= n0; i++) {
          top = Math.min(top, pr.top[i]);
          bottom = Math.max(bottom, pr.bot[i]);
        }
        const aspect = (bottom - top) / Math.max(1, pr.xmax - pr.xmin);
        const score =
          slots * 22 +
          Math.max(0, aspect - 1.15) * 60 +
          voidH * 1.3 -
          (p.c.y + dy) * 1.0 +
          Math.abs(sx) * 0.1 +
          Math.abs(th > 180 ? 360 - th : th) * 0.02 +
          hash(n, th + sx) * 2;
        if (!best || score < best.score) best = { score, dx: sx, dy, rot: th > 180 ? th - 360 : th, pr };
      }
    }
    if (!best) return; // nowhere to go: it stays in the roof
    p.bounce = p.kind === "roof" && p.src.length === 3 ? 8 : 0;
    seat(p, best.pr, best.dx, best.dy, best.rot);
  });
  return H;
};

export const PIECES = buildPieces();
export const PILE_TOP = pack(PIECES);

/** the slab's blocks, left to right */
const SLAB_BY_INDEX: Piece[] = PIECES.filter((p) => p.kind === "slab").sort((a, b) => a.c.x - b.c.x);

const piecePose = (p: Piece, f: number) => {
  const t = f - p.release;
  if (p.T <= 0 || t <= 0) return null;
  const u = Math.min(1, t / p.T);
  let dy = p.dy * u * u;
  if (t > p.T && p.bounce > 0) {
    const v = (t - p.T) / BOUNCE_F;
    if (v < 1) dy -= p.bounce * 4 * v * (1 - v);
  }
  return { dx: p.dx * u, dy, rot: p.rot * u };
};
const pieceTransform = (p: Piece, pose: { dx: number; dy: number; rot: number }) =>
  `translate(${(p.c.x + pose.dx).toFixed(2)} ${(p.c.y + pose.dy).toFixed(2)}) rotate(${pose.rot.toFixed(3)}) translate(${(-p.c.x).toFixed(2)} ${(-p.c.y).toFixed(2)})`;

/** the frame the last piece has come to rest: the room is sealed */
export const SEALED_F = Math.ceil(
  PIECES.reduce((m, p) => (p.T > 0 ? Math.max(m, p.release + p.T + (p.bounce > 0 ? BOUNCE_F : 0)) : m), 0),
);

// -- the men, moving ---------------------------------------------------------------
const SWING_PERIOD = 21;
const TOPPLE_F = 6;

// SAT, convex polygons
const overlap = (a: Pt[], b: Pt[]) => {
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const nx = q.y - p.y;
      const ny = p.x - q.x;
      let a0 = Infinity;
      let a1 = -Infinity;
      let b0 = Infinity;
      let b1 = -Infinity;
      for (const v of a) {
        const d = v.x * nx + v.y * ny;
        a0 = Math.min(a0, d);
        a1 = Math.max(a1, d);
      }
      for (const v of b) {
        const d = v.x * nx + v.y * ny;
        b0 = Math.min(b0, d);
        b1 = Math.max(b1, d);
      }
      if (a1 < b0 || b1 < a0) return false;
    }
  }
  return true;
};
const hullAt = (p: Piece, f: number): Pt[] | null => {
  const pose = piecePose(p, f);
  if (!pose) return null;
  return rotPoly(p.hull, p.c, pose.rot).map((q) => ({ x: q.x + pose.dx, y: q.y + pose.dy }));
};
/** the frame the first rock is touching each standing man (head or shoulders) */
export const CONTACT_F = STAND.map((st) => {
  for (let f = 0; f < 120; f++) {
    for (const p of PIECES) {
      if (p.kind === "chip") continue;
      const h = hullAt(p, f);
      if (h && (overlap(h, st.head) || overlap(h, st.shoulders))) return f;
    }
  }
  return 999;
});
const PICK_L = 118;
const PICK_HEAD = 34; // half the head
const minerPose = (i: number, f: number) => {
  const m = MINERS[i];
  const fc = CONTACT_F[i];
  const p = 1 - Math.pow(1 - clamp01((f - fc) / TOPPLE_F), 3);
  const deg = m.tilt * p;
  const xc = m.x + m.slide * p;
  // the pick: swung from the shoulder while he works. When he is hit it is
  // knocked flat to the floor, where the block beside him lands on it.
  const swing = 24 + 26 * Math.sin(2 * Math.PI * (Math.min(f, fc) / SWING_PERIOD + m.phase));
  const lx = 0.3 * MINER_S;
  const ly = -0.3 * MINER_S;
  const co = Math.cos(deg * DEG);
  const si = Math.sin(deg * DEG);
  const hand = { x: xc + lx * co - ly * si, y: BASE_Y + lx * si + ly * co };
  return {
    x: xc - MINER_S / 2,
    y: MINER_TOP,
    deg,
    pick: {
      x: hand.x + (REST_RIGHT[i] - SHOULDER_OVERLAP + 12 - hand.x) * p,
      y: hand.y + (FLOOR - 14 - hand.y) * p,
      phi: swing + (90 - swing) * p,
      len: PICK_L + (84 - PICK_L) * p,
      head: PICK_HEAD + (8 - PICK_HEAD) * p,
    },
  };
};
const minerTransform = (pose: { x: number; y: number; deg: number }) =>
  `translate(${pose.x.toFixed(2)} ${pose.y.toFixed(2)}) rotate(${pose.deg.toFixed(3)} ${0.5 * MINER_S} ${0.9 * MINER_S})`;

const pick = (fill: string, pk: { x: number; y: number; phi: number; len: number; head: number }) => {
  const s = Math.sin(pk.phi * DEG);
  const c = Math.cos(pk.phi * DEG);
  const tx = pk.x + pk.len * s;
  const ty = pk.y - pk.len * c;
  const hl = pk.head;
  return (
    <>
      <line x1={pk.x} y1={pk.y} x2={tx} y2={ty} stroke={fill} strokeWidth={STROKE + 2} strokeLinecap="round" />
      <path
        d={`M${tx - hl * c} ${ty - hl * s} Q${tx + 0.4 * hl * s} ${ty - 0.4 * hl * c} ${tx + hl * c} ${ty + hl * s}`}
        fill="none"
        stroke={fill}
        strokeWidth={STROKE + 5}
        strokeLinecap="round"
      />
    </>
  );
};

// "they died": each man is traced in black from one point, then the black
// fills him from the ground up. Start frames per man (the middle one first).
const TAG_BASE = 428; // the level tag's baseline: on the rock between the surface and the slab
const TRACE_F0 = [92, 86, 83, 89];
const TRACE_F = 8;
const FILL_F = 6;

// the headframe over the collar: an A-frame, a sheave, a back stay
const HEAD_X = (SHAFT.x0 + SHAFT.x1) / 2; // the rope's line, down the middle of the shaft
const HEAD_TOP = COLLAR_Y - 112;
const SHEAVE = { x: HEAD_X + 26, y: HEAD_TOP - 28, r: 26 };
const headframe = (ink: string) => (
  <g fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
    <path d={`M${HEAD_X - 62} ${COLLAR_Y} L${HEAD_X - 18} ${HEAD_TOP} L${HEAD_X + 40} ${HEAD_TOP} L${HEAD_X + 62} ${COLLAR_Y}`} />
    <path d={`M${HEAD_X - 47} ${COLLAR_Y - 38} L${HEAD_X + 55} ${COLLAR_Y - 38}`} />
    <path d={`M${HEAD_X - 32} ${COLLAR_Y - 76} L${HEAD_X + 47} ${COLLAR_Y - 76}`} />
    <path d={`M${HEAD_X + 40} ${HEAD_TOP} L${HEAD_X + 128} ${COLLAR_Y}`} />
    <circle cx={SHEAVE.x} cy={SHEAVE.y} r={SHEAVE.r} />
    <circle cx={SHEAVE.x} cy={SHEAVE.y} r={5} fill={ink} />
    <path d={`M${HEAD_X} ${SHEAVE.y} L${HEAD_X} ${ROCK_BOTTOM}`} />
  </g>
);

// ===========================================================================
// STATION 2 — THE NEWSPAPER AND ITS NUMBER (world = screen at k 1 with the
// camera at (X2, 960))
// ===========================================================================
export const X2 = 1790;
const SHEET = { x: X2 - 400, y: 110, w: 800, h: 580 };
export const GRID = { x: X2 - 483, y: 718, size: 84, pitchX: 98, pitchY: 120 };
const GRID_W = 9 * GRID.pitchX + GRID.size;
const RULE_DY = 0.9 * GRID.size + SHADOW_OFF + STROKE / 2; // the row's baseline rule, from the box top
const RULE_F0 = 138; // ruled while the camera is still landing, so it never lands on an empty page
// Every figure rises straight up into its own slot from behind its row's rule
// (clipped at the rule): eight solid ones left to right, then the twenty-two
// hollow ones as one ripple. Nothing travels along a row, nothing crosses.
const SOLID_F0 = 165;
const SOLID_STAGGER = 1;
const HOLLOW_F0 = 182;
const HOLLOW_STAGGER = 8 / 21;
const FIG_TRAVEL = 8;
const RULE_TOP_DY = 0.9 * GRID.size + SHADOW_OFF; // the rule's top edge, from the box top
const FIG_RISE = RULE_TOP_DY + 4; // how far below its slot a figure starts: wholly behind the rule
const figStart = (i: number) => (i < 8 ? SOLID_F0 + i * SOLID_STAGGER : HOLLOW_F0 + (i - 8) * HOLLOW_STAGGER);
export const FIG_REST_F = PAPERS_NUMBER.map((_, i) => figStart(i) + FIG_TRAVEL);
const PRINT_F = [124, 160];
const CROWN_F0 = 132;
const NUM_SIZE = 300; // cap height 210
const NUM_BASE = 1512;
const NUM_F = { low: 169, dash: 187, high: 189 };

// ===========================================================================
// THE CAMERA
// ===========================================================================
export const PAN_F0 = 106;
export const PAN_F1 = 146;
const PAN_EASE = Easing.bezier(0.8, 0, 0.2, 1);
const MOTION_BLUR = 0.22; // sigma per screen px travelled in a frame
const MOTION_BLUR_MIN = 0.3;

const K_PILE = 1.04; // by the time the room is sealed
const K_PUSH = 1.47; // the close-up on the buried men (each 250 px on screen)
const PUSH_F0 = 58;
const PUSH_F1 = 97;
// a creep that never stops, with the push-in laid over it
const R1 = Math.log(K_PILE) / PUSH_F0;
const logK = (f: number) => R1 * f + (Math.log(K_PUSH) - R1 * PUSH_F1) * smooth((f - PUSH_F0) / (PUSH_F1 - PUSH_F0));
const FLOOR_SY = [1050, 1060]; // the floor line on screen, wide and close: above the caption strip
const DIP = 17; // world px the camera's TARGET drops with the slab (about 13 damped)
const dipAt = (f: number) => DIP * (f <= 26 ? smooth((f - 18) / 8) : 1 - smooth((f - 26) / 12));
// the stope's framing: the frame's left edge stays on world x 0 (the fourth
// man stays half cut) and the floor line stays just above the caption strip
const stopeKey = (f: number) => {
  const k = Math.exp(logK(f));
  const floorY = FLOOR_SY[0] + (FLOOR_SY[1] - FLOOR_SY[0]) * clamp01((k - 1) / (K_PUSH - 1));
  return { k, cx: 540 / k, cy: FLOOR - (floorY - 960) / k + dipAt(f) };
};
// the newspaper's framing: the pan lands a touch wide and the frame never
// stops creeping in, at one steady rate, through the count and the hold
const K_LAND = 0.975;
const K_END = 1.032;
const CREEP_F0 = 138;
const paperKey = (f: number) => ({
  k: K_LAND * Math.pow(K_END / K_LAND, clamp01((f - CREEP_F0) / (DURATION - 1 - CREEP_F0))),
  cx: X2,
  cy: 960,
});

const CAM_F: number[] = [];
const A_K: number[] = [];
const A_CX: number[] = [];
const A_CY: number[] = [];
const B_K: number[] = [];
const B_CX: number[] = [];
const B_CY: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  const a = stopeKey(f);
  const b = paperKey(f);
  CAM_F.push(f);
  A_K.push(a.k);
  A_CX.push(a.cx);
  A_CY.push(a.cy);
  B_K.push(b.k);
  B_CX.push(b.cx);
  B_CY.push(b.cy);
}
const panE = (f: number) => PAN_EASE(clamp01((f - PAN_F0) / (PAN_F1 - PAN_F0)));

/** the damped camera (no sway) */
export const cameraAt = (frame: number) => {
  const a = runCamera2(frame, CAM_F, A_CY, A_CX, A_K);
  const b = runCamera2(frame, CAM_F, B_CY, B_CX, B_K);
  const e = panE(frame);
  return {
    cx: a.cx + (b.cx - a.cx) * e,
    cy: a.cy + (b.cy - a.cy) * e,
    k: a.k * Math.pow(b.k / a.k, e),
    span: b.cx - a.cx,
  };
};
/** screen px the camera travels sideways during this frame (centred) */
export const panSpeed = (frame: number) => {
  const c = cameraAt(frame);
  return Math.abs(c.span * (panE(frame + 0.5) - panE(frame - 0.5))) * c.k;
};
const CX_REST = (540 / K_PUSH + X2) / 2;

// ===========================================================================
const RockCollapsedReports: React.FC<Props> = ({ levelTag, countLow, countHigh, debugCaptions }) => {
  const frame = useCurrentFrame();

  const cam = cameraAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const speed = panSpeed(frame);
  const blurX = MOTION_BLUR * speed >= MOTION_BLUR_MIN ? MOTION_BLUR * speed : 0;

  // the paper's own plane moves at 0.15 of the camera: it gets 0.15 of the blur
  const paperBlur = blurX * 0.15 >= MOTION_BLUR_MIN ? blurX * 0.15 : 0;

  const showStope = frame <= PAN_F1;
  const showPaper = frame >= PAN_F0;

  // -- station 1 -----------------------------------------------------------------
  const released = PIECES.filter((p) => p.T > 0 && frame > p.release);
  const markLine = (m: Mark, key: string) => {
    const p = interpolate(frame, [-6, m.f1], [0, 1], clamp);
    const e = lerpPt(m.a, m.b, p);
    return <line key={key} x1={m.a.x} y1={m.a.y} x2={e.x} y2={e.y} stroke={BLACK} strokeWidth={4} strokeLinecap="butt" />;
  };

  const numeral = (vis: 0 | 1 | 2, f0: number) => {
    const r = textRise(frame, f0, k);
    if (r.opacity <= 0) return null;
    const parts = [countLow, " – ", countHigh];
    const body = (fill: string) => (
      <text x={X2} y={NUM_BASE + r.dy} textAnchor="middle" style={{ ...type(NUM_SIZE, 900), whiteSpace: "pre" }}>
        {parts.map((t, i) => (
          <tspan key={i} fill={i === vis ? fill : "none"}>
            {t}
          </tspan>
        ))}
      </text>
    );
    return (
      <g opacity={r.opacity}>
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{body(SHADOW)}</g>
        {body(INK)}
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      {paperBlur > 0 ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <filter id="rcr-paper-blur" colorInterpolationFilters="sRGB" x="-5%" y="0%" width="110%" height="100%">
              <feGaussianBlur stdDeviation={`${paperBlur} 0`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <AbsoluteFill style={paperBlur > 0 ? { filter: "url(#rcr-paper-blur)" } : undefined}>
        <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={CX_REST} cyRest={960} />
      </AbsoluteFill>
      <WorldTall cx={cx} cy={cy} k={k} blurX={blurX} id="rcr">
        {showStope ? (
          <g>
            {/* the men, in the room, behind everything that falls */}
            {MINERS.map((_, i) => {
              const pose = minerPose(i, frame);
              const t = minerTransform(pose);
              const dropped = frame >= CONTACT_F[i] + TOPPLE_F + 6; // the pick is under its block by now
              const trace = interpolate(frame, [TRACE_F0[i], TRACE_F0[i] + TRACE_F], [0, 1], clamp);
              const fill = interpolate(frame, [TRACE_F0[i] + TRACE_F, TRACE_F0[i] + TRACE_F + FILL_F], [0, 1], clamp);
              const wipe = fill * (MINER_S + 70);
              return (
                <g key={`m${i}`}>
                  <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
                    {dropped ? null : pick(SHADOW, pose.pick)}
                    <g transform={t}>
                      <Figure x={0} y={0} size={MINER_S} mode="solid" ink={SHADOW} shadow={false} />
                    </g>
                  </g>
                  {dropped ? null : pick(INK, pose.pick)}
                  <g transform={t}>
                    <Figure x={0} y={0} size={MINER_S} mode="solid" ink={INK} shadow={false} />
                  </g>
                  {trace > 0 ? (
                    <g transform={t}>
                      <Figure x={0} y={0} size={MINER_S} mode="hollow" ink={BLACK} shadow={false} draw={trace} />
                    </g>
                  ) : null}
                  {fill > 0 ? (
                    <>
                      <defs>
                        <clipPath id={`rcr-fill-${i}`}>
                          <rect x={pose.x - MINER_S / 2} y={FLOOR + 40 - wipe} width={MINER_S * 2} height={wipe} />
                        </clipPath>
                      </defs>
                      <g clipPath={`url(#rcr-fill-${i})`}>
                        <g transform={t}>
                          <Figure x={0} y={0} size={MINER_S} mode="solid" ink={BLACK} shadow={false} />
                        </g>
                      </g>
                    </>
                  ) : null}
                </g>
              );
            })}

            {/* the rock that has let go */}
            {released.map((p, n) => {
              const pose = piecePose(p, frame);
              if (!pose) return null;
              const t = pieceTransform(p, pose);
              return (
                <g key={`p${n}`}>
                  <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
                    <path d={p.d} fill={SHADOW} transform={t} />
                  </g>
                  <g transform={t}>
                    <path d={p.d} fill={INK} />
                    {p.marks.map((m, j) => markLine(m, `pm${n}-${j}`))}
                  </g>
                </g>
              );
            })}

            {/* the rock in section: white, on its hard shadow, the workings cut in */}
            <defs>
              <mask id="rcr-rock" maskUnits="userSpaceOnUse" x={-900} y={-100} width={2400} height={ROCK_BOTTOM + 200}>
                <rect x={-900} y={-100} width={2400} height={ROCK_BOTTOM + 200} fill="#FFFFFF" />
                <rect x={ROOM.x0} y={ROOM.top} width={ROOM.x1 - ROOM.x0} height={FLOOR - ROOM.top} fill="#000000" />
                <rect x={VOID.x0} y={VOID.top} width={VOID.x1 - VOID.x0} height={SLAB_TOP - VOID.top} fill="#000000" />
                <rect x={STATION.x} y={STATION.y} width={STATION.w} height={STATION.h} fill="#000000" />
                <rect x={SHAFT.x0} y={COLLAR_Y - 40} width={SHAFT.x1 - SHAFT.x0} height={ROCK_BOTTOM} fill="#000000" />
                {DRIFTS.map((h, i) => (
                  <rect key={i} x={h.x} y={h.y} width={h.w} height={h.h} fill="#000000" />
                ))}
                {released.map((p, n) => (
                  <path key={n} d={p.d} fill="#000000" stroke="#000000" strokeWidth={2} strokeLinejoin="round" />
                ))}
              </mask>
            </defs>
            <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
              <path d={ROCK_D} fill={SHADOW} mask="url(#rcr-rock)" />
            </g>
            <path d={ROCK_D} fill={INK} mask="url(#rcr-rock)" />

            {/* the cracks: black hairlines on the slab while it still hangs */}
            {CRACKS.map((c) => {
              const left: Piece | undefined = SLAB_BY_INDEX[c.joint - 1];
              const right: Piece | undefined = c.joint < N_SLAB ? SLAB_BY_INDEX[c.joint] : undefined;
              const gone = Math.min(left ? left.release : Infinity, right ? right.release : Infinity);
              if (frame > gone) return null;
              const j = JOINTS[c.joint];
              const top = { x: j.top, y: SLAB_TOP };
              const bot = { x: j.bot, y: ROOM.top };
              const a = c.from === "top" ? top : bot;
              const b = c.from === "top" ? bot : top;
              const p = interpolate(frame, [0, c.f1], [c.p0, 1], clamp);
              const e = lerpPt(a, b, p);
              return <line key={c.joint} x1={a.x} y1={a.y} x2={e.x} y2={e.y} stroke={BLACK} strokeWidth={4} strokeLinecap="butt" />;
            })}
            {PIECES.map((p, n) =>
              p.kind === "slab" && frame <= p.release ? p.marks.map((m, j) => markLine(m, `sm${n}-${j}`)) : null,
            )}

            {/* the level tag: it only identifies */}
            <text x={44} y={TAG_BASE} fill={BLACK} style={type(100, 900)}>
              {levelTag}
            </text>

            {/* the headframe on the bench, its rope down the shaft */}
            <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{headframe(SHADOW)}</g>
            {headframe(INK)}
          </g>
        ) : null}

        {showPaper ? (
          <g>
            {/* the count rises into its slots from behind each row's rule */}
            <defs>
              {[0, 1, 2].map((r) => (
                <clipPath key={r} id={`rcr-row-${r}`}>
                  <rect
                    x={GRID.x - 20}
                    y={GRID.y + r * GRID.pitchY - 20}
                    width={GRID_W + 40}
                    height={20 + RULE_TOP_DY}
                  />
                </clipPath>
              ))}
            </defs>
            {[0, 1, 2].map((r) => (
              <g key={`row${r}`} clipPath={`url(#rcr-row-${r})`}>
                {PAPERS_NUMBER.map((mode, i) => {
                  const slot = gridPos(i, { pitchX: GRID.pitchX, pitchY: GRID.pitchY });
                  const s = figStart(i);
                  if (slot.row !== r || frame < s) return null;
                  const p = interpolate(frame, [s, s + FIG_TRAVEL], [0, 1], { easing: EASE_LAND, ...clamp });
                  return (
                    <Figure key={i} x={GRID.x + slot.x} y={GRID.y + slot.y + (1 - p) * FIG_RISE} size={GRID.size} mode={mode} />
                  );
                })}
              </g>
            ))}

            {/* the rows the count stands on, ruled from the left: the occluders */}
            {[0, 1, 2].map((r) => {
              const p = interpolate(frame, [RULE_F0 + r * 3, RULE_F0 + r * 3 + 12], [0, 1], {
                easing: Easing.out(Easing.cubic),
                ...clamp,
              });
              if (p <= 0) return null;
              const y = GRID.y + r * GRID.pitchY + RULE_DY;
              return (
                <g key={`r${r}`}>
                  <line
                    x1={GRID.x + SHADOW_OFF}
                    y1={y + SHADOW_OFF}
                    x2={GRID.x + GRID_W * p + SHADOW_OFF}
                    y2={y + SHADOW_OFF}
                    stroke={SHADOW}
                    strokeWidth={STROKE}
                  />
                  <line x1={GRID.x} y1={y} x2={GRID.x + GRID_W * p} y2={y} stroke={INK} strokeWidth={STROKE} />
                </g>
              );
            })}

            {/* "reports": the cut's one chain echo, three more sheets behind */}
            <ChainEcho
              frame={frame}
              start={CROWN_F0}
              core="none"
              from={{ dx: 0, dy: 36 }}
              render={(fill) => <rect x={SHEET.x} y={SHEET.y} width={SHEET.w} height={SHEET.h - 80} fill={fill} />}
            />
            <Newspaper
              x={SHEET.x}
              y={SHEET.y}
              w={SHEET.w}
              h={SHEET.h}
              printed={interpolate(frame, PRINT_F, [0, 1], clamp)}
            />

            {numeral(0, NUM_F.low)}
            {numeral(1, NUM_F.dash)}
            {numeral(2, NUM_F.high)}
          </g>
        ) : null}
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default RockCollapsedReports;
