import {
  CY,
  H,
  INK_HI,
  INK_LO,
  TILE_H,
  TILE_PITCH_X,
  TILE_PITCH_Y,
  TILE_W,
  W,
  camEase,
  camFromTrack,
  hash01,
  huntPath,
  mCamJerk,
  mRunFollower,
  mStrokePx,
  mToScreen,
  rungAt,
  smoothstep,
} from "./mavenShared";
import type { Cam, Pt } from "./mavenShared";

// ---------------------------------------------------------------------------
// dataItselfGeom — the world, clocks and camera of cut A `DataItself` (and the
// picture cut B `NoRelevantTargets` picks up). No React here.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 113;

// --- the field: 9 x 4 standard tiles, centred on the world origin -------------
export const COLS = 9;
export const ROWS = 4;
export const tileX = (col: number) => (col - 4) * TILE_PITCH_X;
export const tileY = (row: number) => (row - 1.5) * TILE_PITCH_Y;
export const GRID_X0 = tileX(0) - TILE_W / 2;
export const GRID_X1 = tileX(COLS - 1) + TILE_W / 2;
export const GRID_Y0 = tileY(0) - TILE_H / 2;
export const GRID_Y1 = tileY(ROWS - 1) + TILE_H / 2;
/** the frame the lens lets go of: bottom row, centre column */
export const HERO = { col: 4, row: 3 };
/** DATA sits above the grid (caps centre, world) */
export const DATA_LABEL_Y = -285;
export const DATA_WORD_F = 93;

// --- the camera: one long pull-back that keeps the grid's bottom edge put -------
/** opening zoom: the hero frame is 620 px wide on screen */
export const K0 = 620 / TILE_W;
export const K_WIDE = 1.1;
export const K_LAST = 1.06;
/** the grid's bottom edge holds this screen y through the whole pull-back */
export const BOTTOM_SY = 706;
/** the LOOK y that puts the grid's bottom edge on BOTTOM_SY at zoom k */
export const lookYAt = (k: number) => GRID_Y1 - (BOTTOM_SY - CY) / k;
const PULL_F0 = 0;
const PULL_F1 = 88;
export const camTargetAt = (f: number): Cam => {
  const lk =
    Math.log(K0) +
    (Math.log(K_WIDE) - Math.log(K0)) * camEase((f - PULL_F0) / (PULL_F1 - PULL_F0), 0.8) +
    // the hold: the pull-back never quite stops (a decaying drift out to the last frame)
    (Math.log(K_LAST) - Math.log(K_WIDE)) * camEase((f - 78) / (150 - 78), 0.85);
  const k = Math.exp(lk);
  return { x: 0, y: lookYAt(k), k };
};
const CAM_F0 = -16;
const TRACK = mRunFollower(camTargetAt, CAM_F0, DURATION + 2);
export const camAt = camFromTrack(TRACK.cams, CAM_F0);
/** the last camera of A: the paper's rest camera, and where B picks up */
export const END_CAM: Cam = camAt(DURATION - 1);
export const END_STATE = TRACK.states[DURATION - 1 - CAM_F0];
export const camReport = () => mCamJerk(camAt, 0, DURATION - 1);

// --- the write-in wave: each tile starts just before the frame edge reaches it ---
export const WRITE_F = 17;
const firstVisible = (col: number, row: number) => {
  const x0 = tileX(col) - TILE_W / 2;
  const x1 = tileX(col) + TILE_W / 2;
  const y0 = tileY(row) - TILE_H / 2;
  const y1 = tileY(row) + TILE_H / 2;
  for (let f = 0; f <= DURATION; f++) {
    const c = camAt(f);
    const a = mToScreen(c, x0, y0);
    const b = mToScreen(c, x1, y1);
    if (b.x > 0 && a.x < W && b.y > 0 && a.y < H) return f;
  }
  return DURATION;
};
const WRITE_START: number[][] = [];
for (let col = 0; col < COLS; col++) {
  WRITE_START.push([]);
  for (let row = 0; row < ROWS; row++) {
    const hero = col === HERO.col && row === HERO.row;
    const ring = Math.max(Math.abs(col - HERO.col), Math.abs(row - HERO.row));
    // the wave runs outward from the hero; never later than 5 f before the tile enters the frame
    const jitter = hash01(col * 7 + 3, row * 13 + 1) * 3.5;
    WRITE_START[col].push(hero ? -14 : Math.max(5 + (ring - 1) * 2, firstVisible(col, row) - 5) + jitter);
  }
}
/** raw reveal progress of tile (col, row) at S */
export const tileReveal = (col: number, row: number, S: number) => (S - WRITE_START[col][row]) / WRITE_F;
export const writeStart = (col: number, row: number) => WRITE_START[col][row];

// --- the model's eye: one continuous path over four frames ------------------------
/** hop i leaves STATIONS[i] at HOPS[i].f0 and is over STATIONS[i + 1] at HOPS[i].f1 */
export const STATIONS = [
  { col: 4, row: 3 },
  { col: 5, row: 3 },
  { col: 5, row: 2 },
  { col: 4, row: 1 },
];
export const HOPS = [
  { f0: 44, f1: 56 },
  { f0: 65, f1: 77 },
  { f0: 87, f1: 100 },
];
export const HUNT_SEED = 11;
/** bracket side (world px): 36 at the opening (170 px on screen), ~78 in the wide (a detection box most of a tile) */
export const bracketSize = (k: number) => 35.6 * Math.pow(K0 / k, 0.535);
/** the bracket's ink weight = the tiles' weight (one stroke weight in the piece) */
export const pieceStrokePx = (k: number) => Math.max(2.9, mStrokePx(TILE_W * k));
/** the hunting wander inside a standard tile for a bracket `size` wide, world px */
export const huntOffset = (S: number, size: number): Pt => {
  const h = huntPath(HUNT_SEED, S * 0.8);
  const rx = Math.max(20, TILE_W / 2 - size / 2 - 7);
  const ry = Math.max(14, TILE_H / 2 - size / 2 - 6);
  return { x: h.x * rx, y: h.y * ry };
};
/** the centre of the tile the bracket is over / travelling between */
export const bracketBase = (S: number): Pt => {
  let x = tileX(STATIONS[0].col);
  let y = tileY(STATIONS[0].row);
  for (let i = 0; i < HOPS.length; i++) {
    const e = smoothstep((S - HOPS[i].f0) / (HOPS[i].f1 - HOPS[i].f0));
    x += (tileX(STATIONS[i + 1].col) - tileX(STATIONS[i].col)) * e;
    y += (tileY(STATIONS[i + 1].row) - tileY(STATIONS[i].row)) * e;
  }
  return { x, y };
};
export const bracketAt = (S: number, k: number): Pt => {
  const b = bracketBase(S);
  const o = huntOffset(S, bracketSize(k));
  return { x: b.x + o.x, y: b.y + o.y };
};
/** a searched frame drops to INK_LO as the bracket leaves it */
export const tileRung = (col: number, row: number, S: number) => {
  for (let i = 0; i < HOPS.length; i++) {
    if (STATIONS[i].col === col && STATIONS[i].row === row) return rungAt(S, HOPS[i].f0 + 3, INK_HI, INK_LO);
  }
  return INK_HI;
};
