// RussiaAMultiple: the timeline, the authored camera track and the raster LOD
// blend. Pure maths, no React, so the raster bake
// (scripts/bake-multiple-rasters.mjs) reads the exact same camera.
import { PLATE_BOTTOM } from "./multipleMapData";

export const FPS = 24;
// Clip SRT 21.02 s -> 32.34 s (end of "navy"). In-point 21.02 s = f0.
// round((32.34 - 21.02) * 24) = round(271.68) = 272, + the 16-frame tail = 288.
export const DURATION = 288;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Word onsets, frames from f0.
export const W = {
  russia: 0,
  wasA: 10,
  multiple: 22,
  of: 33,
  these: 43,
  quantifiable: 53,
  measures: 70,
  over: 82,
  japan: 90,
  by: 100,
  territory: 114,
  population: 140,
  industrial: 160,
  base: 174,
  resource: 186,
  endowment: 195,
  size1: 214,
  army: 227,
  size2: 239,
  navy: 252,
  lineEnd: 272,
};

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------------------
// THE PAGE LAYOUT (world px; world == screen at k 1). The map plate feathers
// into the umber page round PLATE_BOTTOM (no rule: one page); TERRITORY and
// x54 sit just under it, the ledger's five rows under them, one centred column.
// ---------------------------------------------------------------------------
export const PB = PLATE_BOTTOM;
export const FEATHER = [PB - 70, PB + 80] as const; // the map fades out over 150 px
export const TERR_SIZE = 44;
export const X54_SIZE = 72;
export const TERR_BASE = PB + 74; // TERRITORY baseline
export const X54_BASE = TERR_BASE + 72; // x54 baseline
export const ROW0_BASE = X54_BASE + 76; // POPULATION's baseline
export const ROW_PITCH = 160;
export const ROW_LABEL = 42; // px
export const NUM_SIZE = 52;
export const BAR_H = 38;
export const JP_BAR_TOP = 12; // below the label baseline: each label hugs its own bars
export const RU_BAR_TOP = JP_BAR_TOP + BAR_H + 5;
export const ROW_BOTTOM = RU_BAR_TOP + BAR_H; // 93: ~38 px of air above the next label
export const numeralBase = (i: number) => rowBase(i) + RU_BAR_TOP + BAR_H / 2 + 0.14 * NUM_SIZE;
export const rowBase = (i: number) => ROW0_BASE + i * ROW_PITCH;
export const LEDGER_TOP = TERR_BASE - 31;
export const LEDGER_BOTTOM = rowBase(4) + ROW_BOTTOM + 10;

// ---------------------------------------------------------------------------
// THE CAMERA. Screen centre C = (540, 960).
//   PULL-BACK (f-24 -> f106): a zoom about a moving anchor. The world point P
//   in the Sea of Japan sits on the screen anchor A(f), which travels from
//   (just right of centre, y ~920) at the close to where P lands in the wide
//   (x ~928, y ~700), while ln k falls from the close to the wide on one
//   smooth profile G(f): c = P - (A - C) / k. A zoom about a point that stays
//   near Japan is what makes Russia "keep going" westward while Japan slides
//   to the east edge; screen motion stays bounded at every k (a centre that
//   lerped in world px would whip at k 4).
//   AFTER (f96 ->): cy, cx and ln k gain the integrals of overlapping cosine-
//   tapered velocity bumps (LopsidedV2), started before the pull-back lands so
//   no channel ever rests: a 3 % breath-creep, the glide south onto the ledger,
//   the ease out to the final framing and its 2.5 % creep.
// Every channel is C1; nothing chases.
// ---------------------------------------------------------------------------
const C = { x: WIDTH / 2, y: HEIGHT / 2 };
export const K_OPEN = 4.2;
export const K_WIDE = 0.86;
const P = { x: 940, y: 1060 }; // the Sea of Japan / Japan's west coast
// the close: world (935, 1040) on screen (540, 835)
const C_OPEN = { x: 935, y: 1040 + (C.y - 835) / K_OPEN };
// the wide: centred on x 540, x54 foot on screen y ~1120 once it lands,
// so the empire + TERRITORY x54 block centres near y ~735
export const C_WIDE = { x: 540, y: X54_BASE + 18 - (1120 - C.y) / K_WIDE };
const A0 = { x: C.x + (P.x - C_OPEN.x) * K_OPEN, y: C.y + (P.y - C_OPEN.y) * K_OPEN };
const A1 = { x: C.x + (P.x - C_WIDE.x) * K_WIDE, y: C.y + (P.y - C_WIDE.y) * K_WIDE };
export const F_WIDE = 106;

// [from, to, area, taper] (taper 1 = a full raised cosine), or
// [from, to, area, taper, rampIn, rampOut] with explicit ramp lengths.
type Bump = [number, number, number, number] | [number, number, number, number, number, number];
export const bumpV = (bb: Bump, f: number) => {
  const [a, b, area, alpha] = bb;
  if (f <= a || f >= b) return 0;
  const len = b - a;
  const tIn = bb.length === 6 ? bb[4] : (alpha * len) / 2;
  const tOut = bb.length === 6 ? bb[5] : (alpha * len) / 2;
  const hgt = area / (len - (tIn + tOut) / 2);
  const x = f - a;
  if (x < tIn) return hgt * 0.5 * (1 - Math.cos((Math.PI * x) / tIn));
  if (x > len - tOut) return hgt * 0.5 * (1 - Math.cos((Math.PI * (len - x)) / tOut));
  return hgt;
};
const F_LO = -40;
const F_HI = DURATION + 40;
const SUB = 8;
const integrate = (bumps: Bump[]) => {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i <= (F_HI - F_LO) * SUB; i++) {
    const f = F_LO + i / SUB;
    if (i > 0) {
      const fp = f - 1 / SUB;
      const vA = bumps.reduce((s, bb) => s + bumpV(bb, fp), 0);
      const vB = bumps.reduce((s, bb) => s + bumpV(bb, f), 0);
      acc += ((vA + vB) / 2) * (1 / SUB);
    }
    out.push(acc);
  }
  return out;
};
const sample = (arr: number[], f: number) => {
  const p = (f - F_LO) * SUB;
  const i = Math.max(0, Math.min(arr.length - 2, Math.floor(p)));
  const u = clamp01(p - i);
  return arr[i] + (arr[i + 1] - arr[i]) * u;
};

// G: the pull-back's progress 0 -> 1. A slow creep already under way at f0
// ("Russia"), the long pull from ~f14 ("a multiple ..."), landing f106.
const G_RAW = integrate([
  [-24, 40, 0.07, 1],
  [12, F_WIDE, 0.93, 0.62],
]);
const G_END = sample(G_RAW, F_WIDE);
export const pullG = (f: number) => clamp01(sample(G_RAW, f) / G_END);
const LNK_OPEN = Math.log(K_OPEN);
const LNK_WIDE = Math.log(K_WIDE);
/** the anchor-only camera (no after-bumps): the pull-back alone */
export const anchorCam = (f: number) => {
  const g = pullG(f);
  const k = Math.exp(LNK_OPEN + (LNK_WIDE - LNK_OPEN) * g);
  const ax = A0.x + (A1.x - A0.x) * g;
  const ay = A0.y + (A1.y - A0.y) * g;
  return { k, cx: P.x - (ax - C.x) / k, cy: P.y - (ay - C.y) / k };
};

// THE FINAL FRAMING: TERRITORY x54 and the five rows fill y ~300 -> ~1122 at
// K_FINAL; the map's feathered southern edge (Taiwan, the Ryukyus) at the top.
export const K_FINAL = 0.905;
export const CY_FINAL = LEDGER_BOTTOM - (1122 - C.y) / K_FINAL;

// AFTER THE WIDE: cy and ln k offsets from the landed wide, each a monotone
// cubic (PCHIP, C1, no overshoot) through keys. The keys start before the
// pull-back lands, so no channel ever rests. cy: a slow drift on the wide, then
// the glide down the page, fast enough to bring each new row into the middle
// band as it inks; ln k: the 3 % breath-creep, a gentle push-in on the rows,
// the ease out to the final framing and its 2.5 % creep.
export const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
const D_FINAL = CY_FINAL - C_WIDE.y;
export const CY_KEYS: [number, number][] = [
  [98, 0],
  [114, 18],
  [134, 100],
  [146, 205],
  [164, 370],
  [190, 555],
  [216, 700],
  [240, D_FINAL - 18],
  [262, D_FINAL],
  [310, D_FINAL + 10],
];
export const K_KEYS: [number, number][] = [
  [98, K_WIDE],
  [140, K_WIDE * 1.03],
  [176, 0.965],
  [214, 0.975],
  [252, K_FINAL],
  [310, K_FINAL * 1.04],
];
const CY_OFF = pchip(CY_KEYS);
const LNK_OFF = pchip(K_KEYS.map(([f, k]) => [f, Math.log(k / K_WIDE)] as [number, number]));
export const camAt = (f: number) => {
  const a = anchorCam(Math.min(f, F_WIDE));
  return { k: Math.exp(Math.log(a.k) + LNK_OFF(f)), cx: a.cx, cy: a.cy + CY_OFF(f) };
};
export const CAM_TRACK = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));

// ---------------------------------------------------------------------------
// The raster LOD pyramid (transsib). Level bake zooms are powers of two, so the
// hatch (world-anchored, one spacing per level at 9 screen px for its kBake)
// of each level contains every line of the level below plus the lines between:
// a crossfade only fades the in-between lines in. The blend is a function of k.
// ---------------------------------------------------------------------------
export const LEVEL_DEF = [
  { name: "wide", kBake: 1, s: 1.7, band: null },
  { name: "mid", kBake: 2, s: 3.3, band: [1.25, 1.6] as const },
  { name: "close", kBake: 4, s: 4.45, band: [2.5, 3.2] as const },
];
export const levelOps = (k: number) =>
  LEVEL_DEF.map((L) => (L.band ? smoothstep(Math.log(k / L.band[0]) / Math.log(L.band[1] / L.band[0])) : 1));
export const levelDrawn = (ops: number[], i: number) => ops[i] > 0.001 && (i === ops.length - 1 || ops[i + 1] < 0.999);
