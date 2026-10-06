import {
  camFromTrack,
  clamp01,
  cumLen,
  easeInOutCubic,
  easeOutCubic,
  glideTargetAt,
  hash01,
  runFollower,
  smoothstep,
} from "./chinatalkShared";
import type { Cam, Glide, Pt } from "./chinatalkShared";

// ---------------------------------------------------------------------------
// enoughGeom -- the world, the clocks and the camera of EnoughRepresentativeData
// (Bharat, "Synthetic data needs real data", ChinaTalk, cut C). World px, y down,
// origin = the centre of the real-data block. Everything is a function of the
// local frame f (0 = edit frame 951).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const IN = 951;
export const DURATION = 183;

// --- the pattern: a solid 7x7 block with a hollow diamond and a core ------------
export const N = 7;
export const PITCH = 42;
export const SIDE = 30;
export const CORNER = 3;
const MOTIF = ["XXXXXXX", "XXX.XXX", "XX.X.XX", "X.XXX.X", "XX.X.XX", "XXX.XXX", "XXXXXXX"];
export type Cell = { i: number; j: number; x: number; y: number };
export const CELLS: Cell[] = [];
for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    if (MOTIF[j][i] === "X") CELLS.push({ i, j, x: (i - 3) * PITCH, y: (j - 3) * PITCH });
  }
}
export const BLOCK_HALF = 3 * PITCH + SIDE / 2; // 141

// --- the ENOUGH outline --------------------------------------------------------------
export const OUT_HALF = BLOCK_HALF + 16; // 157
export const OUT_R = 16;
/** Half the outline: from the top centre round to the bottom centre (sgn +1 = clockwise, the right side). */
export const outlineHalf = (sgn: 1 | -1): Pt[] => {
  const h = OUT_HALF;
  const r = OUT_R;
  const pts: Pt[] = [{ x: 0, y: -h }];
  const arc = (cx: number, cy: number, a0: number, a1: number) => {
    for (let n = 0; n <= 8; n++) {
      const a = a0 + ((a1 - a0) * n) / 8;
      pts.push({ x: sgn * (cx + r * Math.cos(a)), y: cy + r * Math.sin(a) });
    }
  };
  arc(h - r, -h + r, -Math.PI / 2, 0);
  arc(h - r, h - r, 0, Math.PI / 2);
  pts.push({ x: 0, y: h });
  return pts;
};
export const OUT_RIGHT = outlineHalf(1);
export const OUT_LEFT = outlineHalf(-1);
export const OUT_HALF_LEN = (() => {
  const c = cumLen(OUT_RIGHT);
  return c[c.length - 1];
})();
/** The whole loop, clockwise from the top centre (for the marching dashes). */
export const OUT_LOOP: Pt[] = [...OUT_RIGHT, ...OUT_LEFT.slice(0, -1).reverse()];
export const OUT_PERIM = 2 * OUT_HALF_LEN;
export const DASH_N = 42;
export const DASH_FRAC = 0.56;
/** dashes march this many world px per frame */
export const MARCH = 0.85;

// --- the ink block: squares are GATHERED (they drop in a short way and settle) ---------
/** Fill order: bottom-up with noise (a measure filling to the ENOUGH line); the core lands last. */
const ORDER = (() => {
  const rest = CELLS.filter((c) => !(c.i === 3 && c.j === 3));
  const score = (c: Cell) => ((6 - c.j) / 6) * 0.72 + hash01(c.i * 3 + 1, c.j * 5 + 2) * 0.6;
  rest.sort((a, b) => score(a) - score(b));
  return [...rest, CELLS.find((c) => c.i === 3 && c.j === 3)!];
})();
export const PRESENT_AT_OPEN = 16;
export const LAST_LAND = 60.5;
/** The frame each square (in fill order) settles. 16 of 41 are in before / on f0. */
const landOf = (n: number) => {
  if (n < 16) return -36 + (40 * n) / 15; // ... -1.3, 1.3, 4: two are in flight on f0
  if (n < 22) return 8 + (n - 16) * 3.2; // "so we need to have": one every ~3 f
  if (n < 34) return 26 + (n - 22) * 1.4; // "enough": faster
  if (n < 39) return 44 + (n - 34) * 2.5; // "representative": the last ones, deliberate
  if (n === 39) return 57;
  return LAST_LAND; // the core, on "data"
};
export const LAND_F = 10;
export const DROP = 46; // world px a square travels to its cell
export type InkSq = Cell & { land: number; dx: number };
export const INK_SQUARES: InkSq[] = ORDER.map((c, n) => ({
  ...c,
  land: landOf(n),
  dx: n === ORDER.length - 1 ? 0 : (hash01(c.i + 11, c.j + 3) - 0.5) * 22,
}));
/** A square's state at f: offset from its cell and opacity (0 = not yet). */
export const inkSqAt = (s: InkSq, f: number) => {
  const u = clamp01((f - (s.land - LAND_F)) / LAND_F);
  if (u <= 0) return null;
  const e = easeOutCubic(u);
  return { ox: s.dx * (1 - e), oy: -DROP * (1 - e), op: smoothstep(u / 0.45) };
};

// --- the synthetic tiles ---------------------------------------------------------------
export const TILE_S = 0.92;
export const DX = 335;
export const DY = 335; // no labels: one even lattice
export const TILE_HALF = BLOCK_HALF * TILE_S; // 129.7
export const DORMANT_OP = 0.35;
export type RedSq = {
  x: number; // home, tile-local (unscaled block coordinates)
  y: number;
  present: boolean;
  ox: number; // misplaced offset (block coordinates); 0 if in place
  oy: number;
  arrive: number; // the frame the front reaches its home
  dist: number; // world distance of its home from the centre
};
export type Tile = { gx: number; gy: number; cx: number; cy: number; rot: number; offx: number; offy: number; near: number; squares: RedSq[] };

// The copy front: a ring from the outline outward at an even speed.
export const WAVE_F0 = 87;
export const WAVE_R0 = 150;
export const WAVE_F1 = 124;
export const WAVE_R1 = 643; // the farthest corner square (637.7) is reached on 123.6
export const WAVE_V = (WAVE_R1 - WAVE_R0) / (WAVE_F1 - WAVE_F0);
export const waveR = (f: number) => WAVE_R0 + WAVE_V * (f - WAVE_F0);
const arriveAt = (d: number) => WAVE_F0 + (d - WAVE_R0) / WAVE_V;

export const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  let t = 0;
  for (let gy = -1; gy <= 1; gy++) {
    for (let gx = -1; gx <= 1; gx++) {
      if (gx === 0 && gy === 0) continue;
      t++;
      const cx = gx * DX;
      const cy = gy * DY;
      const isPresent = (c: Cell) => hash01(t * 17 + c.i * 5 + 1, c.j * 7 + t) < 0.36;
      // cells a misplaced square may sit in: inside the 7x7, not holding a dormant square, not taken
      const taken = new Set<string>(CELLS.filter(isPresent).map((c) => `${c.i},${c.j}`));
      const squares: RedSq[] = CELLS.map((c) => {
        const present = isPresent(c);
        let ox = 0;
        let oy = 0;
        if (present && hash01(t * 3 + c.j, c.i * 13 + 5) < 0.26) {
          const start = Math.floor(hash01(c.i + t * 9, c.j + 40) * 8);
          const steps = [[1, 1], [-1, 1], [2, 0], [0, -2], [-1, -1], [1, -1], [-2, 0], [0, 2], [1, 0], [0, 1], [-1, 0], [0, -1]];
          for (let n = 0; n < steps.length; n++) {
            const [di, dj] = steps[(start + n) % steps.length];
            const i = c.i + di;
            const j = c.j + dj;
            if (i < 0 || j < 0 || i >= N || j >= N || taken.has(`${i},${j}`)) continue;
            taken.add(`${i},${j}`);
            ox = di * PITCH;
            oy = dj * PITCH;
            break;
          }
        }
        const dist = Math.hypot(cx + c.x * TILE_S, cy + c.y * TILE_S);
        return { x: c.x, y: c.y, present, ox, oy, arrive: arriveAt(dist), dist };
      });
      const nearD = Math.hypot(Math.max(0, Math.abs(cx) - TILE_HALF), Math.max(0, Math.abs(cy) - TILE_HALF));
      out.push({
        gx,
        gy,
        cx,
        cy,
        rot: (hash01(t, 77) - 0.5) * 7,
        offx: (hash01(t, 5) - 0.5) * 16,
        offy: (hash01(t, 9) - 0.5) * 16,
        near: arriveAt(nearD),
        squares,
      });
    }
  }
  return out;
})();
export const SETTLE_F = 36;
/** 1 = askew (dormant), 0 = square on the grid. Starts when the front reaches the tile. */
export const tileAskew = (tile: Tile, f: number) => 1 - easeInOutCubic((f - tile.near) / SETTLE_F);

// The hold: one travelling highlight in the same outward order.
export const HL_F0 = 136;
export const HL_F1 = 178;
export const HL_BAND = 58;
export const hlR = (f: number) => WAVE_R0 - HL_BAND + (WAVE_R1 + 2 * HL_BAND - WAVE_R0) * clamp01((f - HL_F0) / (HL_F1 - HL_F0));

// --- the camera: a creep, one long pull-back, a creep ------------------------------------------
const K_OPEN0 = 2.3;
const K_OPEN1 = 2.5;
const K_WIDE = 0.955;
const K_END = 1.0;
const PRE = 24;
const START: Cam = { x: 0, y: 0, k: K_OPEN0 };
export const GLIDES: Glide[] = [
  { f0: -PRE, f1: 60, k: K_OPEN1 },
  { f0: 55, f1: 93, k: K_WIDE },
  { f0: 96, f1: 200, k: K_END },
];
const TRACK = runFollower((f) => glideTargetAt(START, GLIDES, f), -PRE, DURATION + 2).cams;
export const camAt = camFromTrack(TRACK, -PRE);
export const REST_CAM: Cam = TRACK[TRACK.length - 3];

/** One stroke weight for the cut: ~6 screen px in the wide, ~8 in the close-up (world px). */
export const strokeW = (k: number) => 6.2 * Math.pow(k, -0.7);

// --- the solid pass: two wet ink tips from the top centre down both sides --------------------
// Each tip keeps a near-constant SCREEN speed while the camera pulls back
// (world speed ~ 1 / k), with soft ends.
export const SOLID_F0 = 54;
export const SOLID_F1 = 88;
const SOLID_STEP = 0.25;
const SOLID_TAB = (() => {
  const tab = [0];
  let s = 0;
  const n = Math.round((SOLID_F1 - SOLID_F0) / SOLID_STEP);
  for (let i = 1; i <= n; i++) {
    const u = (i - 0.5) / n;
    const f = SOLID_F0 + u * (SOLID_F1 - SOLID_F0);
    s += (smoothstep(u / 0.22) * smoothstep((1 - u) / 0.18)) / Math.pow(camAt(f).k, 1.12);
    tab.push(s);
  }
  return tab.map((v) => (v / s) * OUT_HALF_LEN);
})();
/** Arc length written by each tip at f. */
export const solidLen = (f: number) => {
  const x = clamp01((f - SOLID_F0) / (SOLID_F1 - SOLID_F0)) * (SOLID_TAB.length - 1);
  const i = Math.min(SOLID_TAB.length - 2, Math.floor(x));
  return SOLID_TAB[i] + (SOLID_TAB[i + 1] - SOLID_TAB[i]) * (x - i);
};
/** The frame at which arc length s was written. */
export const solidTimeAt = (s: number) => {
  let a = SOLID_F0;
  let b = SOLID_F1;
  for (let i = 0; i < 24; i++) {
    const m = (a + b) / 2;
    if (solidLen(m) < s) a = m;
    else b = m;
  }
  return (a + b) / 2;
};

/** Screen-space fade of the synthetic tiles toward the frame sides and the caption band,
 *  and out of the close-up: they come up out of the paper as the pull-back opens the frame. */
export const frameFade = (cam: Cam, x: number, y: number) => {
  const sx = 540 + (x - cam.x) * cam.k;
  const sy = 960 + (y - cam.y) * cam.k;
  return (1 - smoothstep((cam.k - 1.55) / 0.7)) * smoothstep(Math.min(sx, 1080 - sx) / 50) * smoothstep(sy / 50) * (1 - smoothstep((sy - 1405) / 45));
};
