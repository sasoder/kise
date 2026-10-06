import { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, camEase, toScreen } from "./chinatalkShared";
import type { Cam } from "./chinatalkShared";
import { INK_HI, INK_LO, TILE_H, TILE_PITCH_X, TILE_PITCH_Y, TILE_W, hash01, huntPath, lerp, mStrokePx, rungAt, smoothstep } from "./mavenShared";
import type { Pt } from "./mavenShared";

// ---------------------------------------------------------------------------
// dataItselfTallGeom — the world, clocks and camera of cut A `DataItselfTall`
// (1080x1920) and the picture `NoRelevantTargetsTall` picks up. No React.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 113;
/** content centre on the portrait frame (chinatalkShared: FRAME_H / 2 - CAM_LIFT) */
export const SCREEN_CY = FRAME_H / 2 - CAM_LIFT;
export const CAPTION_Y = 1400;

// --- the portrait follower: chinatalkShared's damped follower, following ln k ------
export const tallTrack = (targetAt: (f: number) => Cam, f0: number, f1: number) => {
  const cams: Cam[] = [];
  const t0 = targetAt(f0);
  let c = { x: t0.x, y: t0.y, k: Math.log(t0.k) };
  let v = { x: 0, y: 0, k: 0 };
  for (let f = f0; f <= f1; f++) {
    const tl = targetAt(f);
    if (f > f0) {
      v = {
        x: v.x + (tl.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (tl.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (Math.log(tl.k) - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    const kk = Math.exp(c.k);
    cams.push({ x: c.x, y: c.y + CAM_LIFT / kk, k: kk });
  }
  const camAt = (S: number): Cam => {
    const t = Math.max(0, Math.min(cams.length - 1, S - f0));
    const i = Math.max(0, Math.min(cams.length - 2, Math.floor(t)));
    const u = t - i;
    const a = cams[i];
    const b = cams[i + 1] ?? a;
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u)) };
  };
  return { camAt, cams, last: cams[cams.length - 1] };
};
export const lookOfTall = (c: Cam): Cam => ({ x: c.x, y: c.y - CAM_LIFT / c.k, k: c.k });
/** max |dv| (px/f^2) and max speed (px/f) of fixed world points on the portrait frame */
export const tallCamJerk = (camAt: (S: number) => Cam, S0: number, S1: number) => {
  let maxA = 0;
  let atS = S0;
  let maxV = 0;
  let atV = S0;
  for (let S = S0 + 1; S < S1; S++) {
    const c0 = camAt(S - 1);
    const c1 = camAt(S);
    const c2 = camAt(S + 1);
    for (const [ox, oy] of [
      [-420, -700],
      [420, 500],
      [0, 0],
    ]) {
      const wx = c1.x + ox / c1.k;
      const wy = c1.y + oy / c1.k;
      const s0 = toScreen(c0, wx, wy);
      const s1 = toScreen(c1, wx, wy);
      const s2 = toScreen(c2, wx, wy);
      const vv = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      if (vv > maxV) {
        maxV = vv;
        atV = S;
      }
      const a = Math.hypot(s2.x - 2 * s1.x + s0.x, s2.y - 2 * s1.y + s0.y);
      if (a > maxA) {
        maxA = a;
        atS = S;
      }
    }
  }
  return { maxA, atS, maxV, atV };
};

// --- the field: 5 x 7 standard tiles, centred on the world origin -----------------
export const COLS = 5;
export const ROWS = 7;
export const tileX = (col: number) => (col - 2) * TILE_PITCH_X;
export const tileY = (row: number) => (row - 3) * TILE_PITCH_Y;
export const GRID_Y0 = tileY(0) - TILE_H / 2;
export const GRID_Y1 = tileY(ROWS - 1) + TILE_H / 2;
/** the frame the lens lets go of: bottom row, centre column */
export const HERO = { col: 2, row: 6 };
export const DATA_WORD_F = 93;
export const DATA_LABEL_Y = GRID_Y0 - 62;
export const TITLE_PX = 60;

// --- the camera: one long pull-back; the field's bottom edge settles above the captions ---
/** opening zoom: the hero frame is 860 px wide on screen */
export const K0 = 860 / TILE_W;
/** the wide: tiles 165 px, the field 906 px wide */
export const K_WIDE = 165 / TILE_W;
export const K_LAST = K_WIDE * 0.966;
/** the grid's bottom edge on screen: under the centred hero at the open, y 1364 in the wide */
const BOTTOM_SY0 = SCREEN_CY + (TILE_H / 2) * K0;
const BOTTOM_SY1 = 1364;
const PULL_F0 = 0;
const PULL_F1 = 88;
export const camTargetAt = (f: number): Cam => {
  const e = camEase((f - PULL_F0) / (PULL_F1 - PULL_F0), 0.8);
  const lk = Math.log(K0) + (Math.log(K_WIDE) - Math.log(K0)) * e + (Math.log(K_LAST) - Math.log(K_WIDE)) * camEase((f - 78) / (150 - 78), 0.85);
  const k = Math.exp(lk);
  return { x: 0, y: GRID_Y1 - (lerp(BOTTOM_SY0, BOTTOM_SY1, e) - SCREEN_CY) / k, k };
};
const TRACK = tallTrack(camTargetAt, -16, DURATION + 2);
export const camAt = TRACK.camAt;
export const END_CAM: Cam = camAt(DURATION - 1);
export const camReport = () => tallCamJerk(camAt, 0, DURATION - 1);

// --- the write-in wave ---------------------------------------------------------------
export const WRITE_F = 17;
const firstVisible = (col: number, row: number) => {
  for (let f = 0; f <= DURATION; f++) {
    const c = camAt(f);
    const a = toScreen(c, tileX(col) - TILE_W / 2, tileY(row) - TILE_H / 2);
    const b = toScreen(c, tileX(col) + TILE_W / 2, tileY(row) + TILE_H / 2);
    if (b.x > 0 && a.x < FRAME_W && b.y > 0 && a.y < FRAME_H) return f;
  }
  return DURATION;
};
const WRITE_START: number[][] = [];
for (let col = 0; col < COLS; col++) {
  WRITE_START.push([]);
  for (let row = 0; row < ROWS; row++) {
    const hero = col === HERO.col && row === HERO.row;
    const ring = Math.max(Math.abs(col - HERO.col), Math.abs(row - HERO.row));
    const jitter = hash01(col * 7 + 3, row * 13 + 1) * 3.5;
    WRITE_START[col].push(hero ? -14 : Math.max(5 + (ring - 1) * 2, firstVisible(col, row) - 5) + jitter);
  }
}
export const tileReveal = (col: number, row: number, S: number) => (S - WRITE_START[col][row]) / WRITE_F;
export const writeStart = (col: number, row: number) => WRITE_START[col][row];

// --- the model's eye: one continuous path over four frames ------------------------------
export const STATIONS = [
  { col: 2, row: 6 },
  { col: 3, row: 6 },
  { col: 3, row: 5 },
  { col: 2, row: 4 },
];
export const HOPS = [
  { f0: 44, f1: 56 },
  { f0: 65, f1: 77 },
  { f0: 87, f1: 100 },
];
export const HUNT_SEED = 11;
/** bracket side (world px): 36 at the opening (235 px), ~86 in the wide (109 px, dashed square 33 px) */
export const bracketSize = (k: number) => 35.6 * Math.pow(K0 / k, 0.535);
export const pieceStrokePx = (k: number) => Math.max(3.2, mStrokePx(TILE_W * k));
export const huntOffset = (S: number, size: number): Pt => {
  const h = huntPath(HUNT_SEED, S * 0.8);
  return { x: h.x * Math.max(18, TILE_W / 2 - size / 2 - 7), y: h.y * Math.max(12, TILE_H / 2 - size / 2 - 6) };
};
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
export const tileRung = (col: number, row: number, S: number) => {
  for (let i = 0; i < HOPS.length; i++) {
    if (STATIONS[i].col === col && STATIONS[i].row === row) return rungAt(S, HOPS[i].f0 + 3, INK_HI, INK_LO);
  }
  return INK_HI;
};
/** the lowest subject ink on screen at S (px, sway included) */
export const lowestInkY = (S: number) => toScreen(camAt(S), 0, GRID_Y1).y + 5 + 3;
