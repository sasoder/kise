import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import { clamp, clamp01, hash, smoothstep, sway } from "./fieldShared";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// LopsidedV2: the user's revision of Lopsided (V1 stays untouched). Same
// idea, same line, same balance, same 44 : 1, same LOPSIDED landing. The
// user: "way too choppy and looks unfinished. The camera movement can be much
// smoother. It should also track more to the background... for the parts
// where there isn't a lot of motion, add movement with subtle or bigger
// zooms." What changed:
//   - The page is in WORLD space: the approved 1080x1920 umber page tiled
//     three wide (320 px crossfaded overlaps, alternate tiles flipped
//     vertically, at 1.04 so no edge ever shows; the 4K backdrop's mottle is
//     ~2x coarser than the approved page, so it is not used) pans
//     and zooms with the marks and the balance, one printed sheet. Film grain
//     (manchuria/grain.png) and the vignette stay in screen space. The marks'
//     own drift / sway is cut to a third.
//   - One authored camera: every channel (cx, cy, ln k) is the integral of
//     overlapping cosine-tapered velocity bumps, so it is C1 (C2 inside the
//     bumps) from f0 to f243 with no plateaus; the pour adds a critically
//     damped follow of the heavy pan. Pan peak ~21 screen px/f (V1: 40).
//   - The beam follows a low-passed landed count (tau 6 f) through one
//     underdamped spring: no per-landing kicks, no steps.
//   - Dots fly slower, rounder eased arcs (quadratic Bezier, eased in time)
//     and settle 3 f into their slot. The balance is built 0.9x V1 so the
//     k 1.3 pour close-up keeps both pans inside the frame.
//   - Question-mark slide-ups ease over 14 f.
//
// Sarah Paine, Russo-Japanese War clip "Almost no battle is actually
// decisive", straight after NotConveyingAnything:
//   "[if you use it to mean] important — in what way? And for instance, I
//    would use different words for a battle where the casualty rates are
//    really skewed. I would use the word 'lopsided.'"
//
// IN-POINT 23.16 s = f0. 24 fps, f = round((t - 23.16) * 24):
//   important f0 · in f12 · what f18 · way? f24 (-f36) · and f36 · for f43 ·
//   instance f50 · I f64 · would f70 · use f75 · different f84 · words f92 ·
//   for a f100 · battle f119 · where f126 · the f133 · casualty f143 ·
//   rates f163 · are f169 · really f173 · skewed f177 (-f193) · I f193 ·
//   would f196 · use f199 · the f204 · word f206 · lopsided f210
//   (line ends f228 = 32.68 s)
// DURATION = 228 + 16 (tail) = 244 frames = 10.17 s.
//
// THE FIGURES (illustrative proxy, never on screen). Battle of Tsushima,
// 27-28 May 1905, killed: Russian 4,380 · Japanese 117 (Wikipedia, "Battle of
// Tsushima", infobox casualties). At 1 dot = 100 killed: 44 dots vs 1 dot.
// The battle is never named and no number appears. Cream only, 1.0 / 0.5.
//
// THE GESTURES, each with its word:
//   1. "important, in what way?" f0-36: five IM Fell English question marks
//      around (540, 835) slide up 24 px + fade over 14 f each, landing f10 /
//      f15 / f19 / f24 (the big one, "way?") / f26; a faint drift / sway.
//      Camera: slow push-in k 1.00 -> ~1.10 (already moving on f0).  — f-4..44
//   2. "And for instance, I would use different words" f26-106: the pan
//      right across the page (1036 world px, tapered, peak ~21 screen px/f),
//      the marks leave frame left ~f80, the balance arrives softly ~f100 at
//      k ~1.12 and the camera keeps a gentle drift right.          — f26-156
//   3. The balance on the page the whole time, breathing +-0.4 deg.
//   4. "for a battle" f94-140: slow creep in toward the fulcrum (k 1.12 ->
//      1.28, cy up to the balance's middle) while the swords glyph slides up
//      onto the plate, landing f119.                              — f94-140
//   5. "where the casualty rates are really skewed" f121-190: the dead leave
//      the glyph on eased rounded arcs: 1 dot to the LEFT pan (lands f141),
//      44 to the RIGHT (land f143 -> f190, hashed). Each settles 3 f into its
//      slot. Beam: (right - left) landed count through two cascaded
//      low-passes (3.5 f each) -> a saturating target (20.5 deg for 44 : 1)
//      plus a lean from the smoothed arrival rate (the dots' momentum, 12 f
//      lead) -> one underdamped spring (w 0.25, zeta 0.35): the beam passes
//      20 deg ~f186, overshoots once to ~23 deg (~f197, "skewed"), dips to
//      ~20.0 and settles at 20.5. No kicks, no steps. The
//      camera drifts right and down after the sinking pan (damped follow),
//      k ~1.28 -> 1.31.                                           — f121-196
//   6. "lopsided" f188-226: one eased pull-back to k ~1.02 framing balance +
//      word; LOPSIDED slides up, landing f210.                    — f188-226
//   7. Tail f216-243: slow ~2% creep in (still moving on the last frame),
//      the residual spring, breath and house sway.                 — f216-243
// Caption band: every frame is asserted: nothing of the balance, the pile or
// the word below screen y1150, both pans inside x 30..1050 once landed.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 244;
export const W = 1080;
export const H = 1920;

export const INK = "#E9DDBF";
const SHADE = "#140F0A";
const FILL = "#2A2119";

export const schema = z.object({
  ink: z.string(),
  backdropSrc: z.string(),
  grainSrc: z.string(),
  grainOpacity: z.number(),
  vignette: z.number(),
  word: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  grainSrc: "manchuria/grain.png",
  grainOpacity: 0.6,
  vignette: 0.32,
  word: "LOPSIDED",
});

const SW = 2.6;
const SW_BEAM = 3.0;
const SW_HANG = 1.4;
const HALO = 2;
const HALO_OP = 0.45;
const DIM = 0.5;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CAPTION_TOP = 1150;

export const T = {
  glyph: [105, 119] as const,
  leftLand: 141,
  rightLand: [143, 190] as const,
  word: [202, 210] as const,
};

export const CY = 835;
const X0 = W / 2;
export const BX = 1600; // the balance's world x

// ---------------------------------------------------------------------------
// Part 1: the question marks, around world (540, 835).
// ---------------------------------------------------------------------------
const QM_EM = 0.7;
type Mark = { x: number; y: number; h: number; op: number; land: number; rot: number };
const MARK_EASE = 14;
const MARKS: Mark[] = [
  { x: -224, y: -186, h: 150, op: DIM, land: 10, rot: -9 },
  { x: 234, y: 158, h: 165, op: DIM, land: 15, rot: 7 },
  { x: 210, y: -214, h: 110, op: 1, land: 19, rot: 10 },
  { x: 12, y: 0, h: 280, op: 1, land: 24, rot: -3 },
  { x: -202, y: 190, h: 125, op: DIM, land: 26, rot: -6 },
];
const markPose = (m: Mark, i: number, f: number) => {
  const u = clamp01((f - (m.land - MARK_EASE)) / MARK_EASE);
  const p1 = 29 + 13 * hash(i, 1);
  const p2 = 33 + 15 * hash(i, 2);
  const p3 = 37 + 17 * hash(i, 3);
  return {
    op: m.op * smoothstep((f - (m.land - MARK_EASE)) / (MARK_EASE - 2)),
    dx: 2.3 * Math.sin(f / p1 + 6.28 * hash(i, 4)),
    dy: 24 * (1 - EASE_LAND(u)) + 2 * Math.sin(f / p2 + 6.28 * hash(i, 5)),
    rot: m.rot + 0.8 * Math.sin(f / p3 + 6.28 * hash(i, 6)),
  };
};

// ---------------------------------------------------------------------------
// Part 2: the balance (0.9x V1), local coords, pivot at (0, 0).
// ---------------------------------------------------------------------------
const L = 270;
const HANG = 164;
const DISH_HW = 95;
const DISH_D = 25;
const DISH_R = (DISH_HW * DISH_HW + DISH_D * DISH_D) / (2 * DISH_D);
const BEAM_MID = 5.9;
const BEAM_END = 3.2;
const HOOK_R = 4.5;
const PIVOT_R = 8;

const SWORDS = [
  "m13 19 6-6",
  "M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5",
  "m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586",
  "m16 16 4 4",
  "m19 21 2-2",
  "m5 14 4 4",
  "m5 21-2-2",
  "M7.5 16.5 4 20",
];
const GLYPH = 84;
const GLYPH_INK_HALF = (GLYPH * 9) / 24;
const PLATE_Y = -27;
const PLATE_HW = 20;
const GLYPH_Y = PLATE_Y - 6 - GLYPH_INK_HALF;
const POST_HW = 4.5;

// ---- the dead ------------------------------------------------------------
const DOT_R = 6.3;
const PITCH = 1.35 * 2 * DOT_R;
const ROW_H = PITCH * 0.866;
const FLOOR = HANG + 4;
const ROWS = [9, 8, 7, 6, 5, 4, 3, 2];
const N_RIGHT = ROWS.reduce((a, b) => a + b, 0);
const N_LEFT = 1;

type Slot = { x: number; y: number };
const SLOTS: Slot[] = (() => {
  const out: Slot[] = [];
  ROWS.forEach((n, r) => {
    const row: (Slot & { o: number })[] = [];
    for (let j = 0; j < n; j++) {
      const id = out.length + j;
      row.push({
        x: (j - (n - 1) / 2) * PITCH + 0.5 * (hash(id, 11) - 0.5),
        y: FLOOR - r * ROW_H + 0.5 * (hash(id, 12) - 0.5),
        o: hash(id, 13),
      });
    }
    row.sort((a, b) => a.o - b.o).forEach(({ x, y }) => out.push({ x, y }));
  });
  return out;
})();
const LEFT_SLOT: Slot = { x: -27, y: FLOOR };
(() => {
  if (SLOTS.length !== 44) throw new Error("LopsidedV2: the right pan needs 44 dots");
  let min = Infinity;
  for (let a = 0; a < SLOTS.length; a++)
    for (let b = a + 1; b < SLOTS.length; b++) min = Math.min(min, Math.hypot(SLOTS[a].x - SLOTS[b].x, SLOTS[a].y - SLOTS[b].y));
  if (min < 1.25 * 2 * DOT_R) throw new Error(`LopsidedV2: pile spacing ${min.toFixed(2)} < 1.25 d`);
  const cy = HANG + DISH_D - DISH_R;
  for (const s of [...SLOTS, LEFT_SLOT]) {
    const up = HANG - s.y;
    const lineHW = DISH_HW * (1 - (up + DOT_R) / HANG);
    if (up + DOT_R > 0 && Math.abs(s.x) + DOT_R > Math.max(lineHW, 0) + 0.01)
      throw new Error(`LopsidedV2: a dot pokes through the hang lines (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
    if (s.y > HANG - DOT_R && Math.hypot(s.x, s.y - cy) > DISH_R - DOT_R)
      throw new Error(`LopsidedV2: a dot pokes through the dish (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
  }
})();

// landing times: f143 -> f190, hashed, strictly increasing
const RIGHT_LAND: number[] = (() => {
  const [a, b] = T.rightLand;
  const out: number[] = [];
  for (let i = 0; i < N_RIGHT; i++) {
    const u = i / (N_RIGHT - 1);
    out.push(a + (b - a) * u + (i > 0 && i < N_RIGHT - 1 ? 0.7 * (hash(i, 21) - 0.5) : 0));
  }
  for (let i = 1; i < out.length; i++) if (out[i] <= out[i - 1] + 0.3) out[i] = out[i - 1] + 0.3;
  return out;
})();

type Dot = { side: -1 | 1; slot: Slot; land: number; dur: number; lift: number; ox: number; oy: number };
export const DOTS: Dot[] = [
  { side: -1, slot: LEFT_SLOT, land: T.leftLand, dur: 20, lift: 70, ox: -3, oy: 2 },
  ...SLOTS.map((slot, i) => ({ side: 1 as const, slot, land: RIGHT_LAND[i], dur: 22, lift: 70, ox: 0, oy: 0 })),
];

// ---- the beam: a low-passed landed count into one spring -----------------
const TILT_MAX = 20.5; // deg, where 44 : 1 settles
const TAU_SAT = 80; // saturation scale, in dots
const COUNT_TAU = 3.5; // two cascaded low-passes (~7 f in all): no steps
const IMPACT = 12; // frames of lead: the smoothed arrival RATE leans on the pan (momentum)
const OMEGA = 0.25; // rad / frame
const ZETA = 0.35; // one graceful overshoot
const BREATH = 0.4;
const sat = (d: number) => Math.sign(d) * (1 - Math.exp(-Math.abs(d) / TAU_SAT));
const SAT_FULL = sat(N_RIGHT - N_LEFT);
const landedDiff = (t: number) => DOTS.reduce((acc, d) => acc + (t >= d.land ? d.side : 0), 0);

const SUB = 16;
const SIM = (() => {
  let c1 = 0;
  let c = 0;
  let th = 0;
  let v = 0;
  const tilt: number[] = [0];
  const count: number[] = [0];
  for (let f = 0; f < DURATION + 8; f++) {
    for (let s = 0; s < SUB; s++) {
      const t = f + s / SUB;
      c1 += (landedDiff(t) - c1) / (COUNT_TAU * SUB);
      const dc = (c1 - c) / COUNT_TAU;
      c += dc / SUB;
      // the settled angle for the weight in the pans, plus the push of the
      // weight still arriving (its smoothed rate x IMPACT frames)
      const target = (TILT_MAX * (sat(c) + (IMPACT * dc * Math.exp(-Math.abs(c) / TAU_SAT)) / TAU_SAT)) / SAT_FULL;
      v += (OMEGA * OMEGA * (target - th) - 2 * ZETA * OMEGA * v) / SUB;
      th += v / SUB;
    }
    tilt.push(th);
    count.push(c);
  }
  return { tilt, count };
})();
const lerpArr = (arr: number[], f: number) => {
  const i = Math.max(0, Math.min(arr.length - 2, Math.floor(f)));
  const u = clamp01(f - i);
  return arr[i] + (arr[i + 1] - arr[i]) * u;
};
export const springTilt = (f: number) => lerpArr(SIM.tilt, f);
export const smoothCount = (f: number) => lerpArr(SIM.count, f);
export const tiltDeg = (f: number) => springTilt(f) + BREATH * Math.sin(f / 21 + 0.7);
const TILT_PEAK = Math.max(...SIM.tilt.map(Math.abs)) + BREATH;
const rad = (d: number) => (d * Math.PI) / 180;
const endPt = (deg: number, side: -1 | 1) => ({ x: side * L * Math.cos(rad(deg)), y: side * L * Math.sin(rad(deg)) });

const HEAVY_LOW = L * Math.sin(rad(TILT_PEAK)) + HANG + DISH_D;
const GROUND = Math.ceil(HEAVY_LOW + 12);
const STEP1 = { hw: 52, h: 11 };
const STEP2 = { hw: 83, h: 13.5 };

const WORD_SIZE = 108;
const WORD_CAP = 0.7 * WORD_SIZE;
const WORD_TRACK = 0.24;
const WORD_GAP = 46;
const WORD_BASE_L = GROUND + WORD_GAP + WORD_CAP;
const WORD_SINK = 0.13 * WORD_SIZE;
const WORD_HALF_W = 395; // measured on the V1 still at k 1.0 (x ~145-935)

const GROUP_TOP = Math.min(GLYPH_Y - GLYPH_INK_HALF, -L * Math.sin(rad(TILT_PEAK)));
export const PIVOT_Y = CY - (GROUP_TOP + WORD_BASE_L + WORD_SINK) / 2;

// ---------------------------------------------------------------------------
// The camera. Each channel is the integral of overlapping velocity bumps
// (cosine tapers: C1 velocity), so the track is C1 end to end.
//   [from, to, area, taper] - taper 1 = a full raised cosine.
// ---------------------------------------------------------------------------
type Bump = [number, number, number, number];
const bumpV = ([a, b, area, alpha]: Bump, f: number) => {
  if (f <= a || f >= b) return 0;
  const len = b - a;
  const tp = (alpha * len) / 2;
  const hgt = area / (len - tp);
  const x = f - a;
  if (x < tp) return hgt * 0.5 * (1 - Math.cos((Math.PI * x) / tp));
  if (x > len - tp) return hgt * 0.5 * (1 - Math.cos((Math.PI * (len - x)) / tp));
  return hgt;
};
const F_LO = -40;
const F_HI = DURATION + 20;
const CSUB = 8;
const integrate = (bumps: Bump[], v0: number) => {
  const out: number[] = [];
  let acc = 0;
  for (let i = 0; i <= (F_HI - F_LO) * CSUB; i++) {
    const f = F_LO + i / CSUB;
    if (i > 0) {
      const fp = f - 1 / CSUB;
      const vA = bumps.reduce((s, bb) => s + bumpV(bb, fp), 0);
      const vB = bumps.reduce((s, bb) => s + bumpV(bb, f), 0);
      acc += ((vA + vB) / 2) * (1 / CSUB);
    }
    out.push(acc);
  }
  const at0 = out[(0 - F_LO) * CSUB];
  return out.map((x) => x - at0 + v0);
};
const sample = (arr: number[], f: number) => {
  const p = (f - F_LO) * CSUB;
  const i = Math.max(0, Math.min(arr.length - 2, Math.floor(p)));
  const u = clamp01(p - i);
  return arr[i] + (arr[i + 1] - arr[i]) * u;
};

// the balance's own middle (glyph top -> base), where the close-ups aim
const CY_CLOSE = PIVOT_Y + (GLYPH_Y - GLYPH_INK_HALF + GROUND) / 2;

// the pull-back, and the wide it lands on: 12 world px lower than the
// group's centre so the word's slide-up starts above the caption band
const PULL = [180, 214] as const;
const CY_WIDE = CY + 12;
const CX_DRIFT0 = 12; // on the marks
const CX_DRIFT1 = 16; // after the pan lands
const CX_BACK = 6; // the pull-back returns to BX
const PAN_AREA = BX - X0 - CX_DRIFT0 - CX_DRIFT1 + CX_BACK;
const CX_TRACK = integrate(
  [
    [-24, 44, CX_DRIFT0, 1],
    [26, 106, PAN_AREA, 0.7],
    [88, 160, CX_DRIFT1, 1],
    [PULL[0], PULL[1], -CX_BACK, 1],
  ],
  X0,
);
const CY_TRACK = integrate(
  [
    [94, 140, CY_CLOSE - CY, 1],
    [PULL[0], PULL[1], CY_WIDE - CY_CLOSE, 1],
  ],
  CY,
);
const LNK_TRACK = integrate(
  [
    [-8, 46, Math.log(1.1), 1],
    [30, 108, Math.log(1.12 / 1.1), 1],
    [94, 140, Math.log(1.28 / 1.12), 1],
    [128, 198, Math.log(1.31 / 1.28), 1],
    [PULL[0], PULL[1], Math.log(1.02 / 1.31), 1],
    [204, 264, Math.log(1.035), 1],
  ],
  0,
);

// the pour follow: a critically damped chase of the heavy pan (down) plus a
// lazy drift right, faded in from f118 and out through the pull-back
const FOLLOW = (() => {
  const TAU_F = 11;
  const ox: number[] = [];
  const oy: number[] = [];
  let x = 0;
  let vx = 0;
  let y = 0;
  let vy = 0;
  const y0 = L * Math.sin(rad(0));
  for (let i = 0; i <= (F_HI - F_LO) * CSUB; i++) {
    const f = F_LO + i / CSUB;
    const on = smoothstep((f - 118) / 44);
    const tx = 30 * on;
    const ty = 0.5 * (L * Math.sin(rad(springTilt(Math.max(0, f)))) - y0) * on;
    const dt = 1 / CSUB;
    vx += ((tx - x) / (TAU_F * TAU_F) - (2 * vx) / TAU_F) * dt;
    x += vx * dt;
    vy += ((ty - y) / (TAU_F * TAU_F) - (2 * vy) / TAU_F) * dt;
    y += vy * dt;
    const w = 1 - smoothstep((f - PULL[0]) / (PULL[1] - PULL[0]));
    ox.push(x * w);
    oy.push(y * w);
  }
  return { ox, oy };
})();

export const camCX = (f: number) => sample(CX_TRACK, f) + sample(FOLLOW.ox, f);
export const camCY = (f: number) => sample(CY_TRACK, f) + sample(FOLLOW.oy, f);
export const camK = (f: number) => Math.exp(sample(LNK_TRACK, f));
const camAt = (f: number) => {
  const d = sway(f);
  return { cx: camCX(f), cy: camCY(f), k: camK(f), sx: d.dx * 0.6, sy: d.dy * 0.5 };
};
export const toScreen = (x: number, y: number, f: number) => {
  const c = camAt(f);
  return { x: X0 + (x - c.cx) * c.k + c.sx, y: CY + (y - c.cy) * c.k + c.sy };
};

// ---- dots in flight ------------------------------------------------------
const panOrigin = (f: number, side: -1 | 1) => {
  const e = endPt(tiltDeg(f), side);
  return { x: BX + e.x, y: PIVOT_Y + e.y };
};
const SETTLE = 3;
const S_A = 1.0; // launch speed (path fraction per unit time)
const S_B = 0.45; // arrival speed: slows into the pan
const SETTLE_MAX = 2.5; // px, the deepest the settle carries a dot past its slot
const sEase = (u: number) =>
  (u * u * u - 2 * u * u + u) * S_A + (-2 * u * u * u + 3 * u * u) + (u * u * u - u * u) * S_B;
const pathAt = (d: Dot, f: number, s: number) => {
  const po = panOrigin(f, d.side);
  const ex = po.x + d.slot.x;
  const ey = po.y + d.slot.y;
  const sx = BX + d.ox;
  const sy = PIVOT_Y + GLYPH_Y + d.oy;
  const cx = sx + (ex - sx) * 0.5;
  const cy = Math.min(sy, ey) - d.lift;
  const a = (1 - s) * (1 - s);
  const b = 2 * s * (1 - s);
  const c = s * s;
  return { x: a * sx + b * cx + c * ex, y: a * sy + b * cy + c * ey, ex, ey, cx, cy };
};
export const dotPos = (d: Dot, f: number) => {
  const t0 = d.land - d.dur;
  if (f < t0) return null;
  if (f >= d.land) {
    const p = pathAt(d, f, 1);
    const tau = f - d.land;
    if (tau >= SETTLE) return { x: p.ex, y: p.ey, op: 1 };
    // the settle: carry the arrival velocity 2-3 px past the slot and ease back
    let vx = (2 * (p.ex - p.cx) * S_B) / d.dur;
    let vy = (2 * (p.ey - p.cy) * S_B) / d.dur;
    const depth = (4 / 9) * Math.hypot(vx, vy); // peak of tau (1 - tau/3)^2 is 4/9 at tau 1
    if (depth > SETTLE_MAX) {
      vx *= SETTLE_MAX / depth;
      vy *= SETTLE_MAX / depth;
    }
    const e = tau * (1 - tau / SETTLE) * (1 - tau / SETTLE);
    return { x: p.ex + vx * e, y: p.ey + vy * e, op: 1 };
  }
  const u = (f - t0) / d.dur;
  const p = pathAt(d, f, sEase(u));
  return { x: p.x, y: p.y, op: smoothstep((f - t0) / 4) };
};

// flights: each dot takes the first of 48 hashed (time, lift, spout)
// variants that never moves faster than 29.5 screen px/f and keeps >= 1.15
// diameters from every dot already placed; failing that, the most clearance
(() => {
  const CLEAR = 1.15 * 2 * DOT_R;
  const placed: Dot[] = [];
  const score = (d: Dot) => {
    const t0 = d.land - d.dur;
    if (t0 < T.glyph[1] - 2) return -2; // leaves the glyph once it is ~90% landed
    for (let f = t0; f < d.land + SETTLE; f += 0.5) {
      const p = dotPos(d, f)!;
      const q = dotPos(d, f + 1)!;
      const a = toScreen(p.x, p.y, f);
      const b = toScreen(q.x, q.y, f + 1);
      if (Math.hypot(b.x - a.x, b.y - a.y) > 29.5) return -1;
    }
    let min = Infinity;
    for (let f = t0 + 4; f < d.land; f += 0.25) {
      const p = dotPos(d, f)!;
      for (const q of placed) {
        const o = dotPos(q, f);
        if (o) min = Math.min(min, Math.hypot(p.x - o.x, p.y - o.y));
      }
    }
    return min;
  };
  DOTS.forEach((d, n) => {
    let best = { c: -3, lift: d.lift, ox: d.ox, oy: d.oy, dur: d.dur };
    for (let v = 0; v < 48; v++) {
      d.dur = d.side === -1 ? 20 + 4 * hash(n, 130 + v) : 21 + 6 * hash(n, 130 + v);
      d.lift = 35 + 60 * hash(n, 40 + v);
      d.ox = 14 * (hash(n, 70 + v) - 0.5);
      d.oy = 10 * (hash(n, 100 + v) - 0.5);
      const c = score(d);
      if (c > best.c) best = { c, lift: d.lift, ox: d.ox, oy: d.oy, dur: d.dur };
      if (c >= CLEAR) break;
    }
    Object.assign(d, { lift: best.lift, ox: best.ox, oy: best.oy, dur: best.dur });
    if (best.c < 0) throw new Error(`LopsidedV2: dot ${n} has no flight under the speed cap`);
    placed.push(d);
  });
})();

// ---- the page: the approved 1080x1920 sheet, tiled three wide -------------
// Each tile overlaps the one before by PAGE_OV and fades in across it (a
// mask), and alternate tiles are flipped vertically, so the mottle runs on
// with no seam and no mirror symmetry. The opening frame sits inside tile 0
// (V1's page as it was).
const PAGE_S = 1.04;
const TILE_W = W * PAGE_S;
const TILE_H = H * PAGE_S;
const PAGE_OV = 320;
const PAGE_X0 = X0 - TILE_W / 2;
const PAGE_Y0 = H / 2 - TILE_H / 2;
const TILES = 3;
const PAGE_X1 = PAGE_X0 + TILES * TILE_W - (TILES - 1) * PAGE_OV;

// ---- per-frame assertions -------------------------------------------------
(() => {
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    // the page covers the frame
    const wx0 = c.cx - (X0 + Math.abs(c.sx)) / c.k;
    const wx1 = c.cx + (W - X0 + Math.abs(c.sx)) / c.k;
    const wy0 = c.cy - (CY + Math.abs(c.sy)) / c.k;
    const wy1 = c.cy + (H - CY + Math.abs(c.sy)) / c.k;
    if (wx0 < PAGE_X0 + 2 || wx1 > PAGE_X1 - 2 || wy0 < PAGE_Y0 + 2 || wy1 > PAGE_Y0 + TILE_H - 2)
      throw new Error(`LopsidedV2: page edge shows at f${f}`);
    // caption band
    const tilt = tiltDeg(f);
    const r = endPt(tilt, 1);
    const l = endPt(tilt, -1);
    const lows = [
      toScreen(BX + r.x, PIVOT_Y + r.y + HANG + DISH_D, f).y,
      toScreen(BX + l.x, PIVOT_Y + l.y + HANG + DISH_D, f).y,
      toScreen(BX, PIVOT_Y + GROUND, f).y,
    ];
    const wSlide = interpolate(f, [T.word[0], T.word[1]], [24, 0], { easing: EASE_LAND, ...clamp }) / c.k;
    if (f > T.word[0]) lows.push(toScreen(BX, PIVOT_Y + WORD_BASE_L + WORD_SINK + wSlide, f).y);
    if (Math.max(...lows) >= CAPTION_TOP) throw new Error(`LopsidedV2: caption band breached at f${f} (${Math.max(...lows).toFixed(1)})`);
    // once landed, both pans (and the word) inside the frame
    if (f >= 100) {
      const xl = toScreen(BX + l.x - DISH_HW, 0, f).x;
      const xr = toScreen(BX + r.x + DISH_HW, 0, f).x;
      if (xl < 30 || xr > W - 30) throw new Error(`LopsidedV2: a pan leaves the frame at f${f} (${xl.toFixed(1)}, ${xr.toFixed(1)})`);
    }
    if (f >= T.word[0]) {
      const wl = toScreen(BX - WORD_HALF_W, 0, f).x;
      if (wl < 30) throw new Error(`LopsidedV2: the word leaves the frame at f${f}`);
    }
  }
})();

// ---------------------------------------------------------------------------
const LopsidedV2: React.FC<Props> = ({ ink, backdropSrc, grainSrc, grainOpacity, vignette, word }) => {
  const frame = useCurrentFrame();
  const c = camAt(frame);
  const k = c.k;
  const tx = X0 - c.cx * k + c.sx;
  const ty = CY - c.cy * k + c.sy;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;

  const halo = { stroke: SHADE, strokeOpacity: HALO_OP };
  const tilt = tiltDeg(frame);

  const gOp = interpolate(frame, [T.glyph[0], T.glyph[1] - 2], [0, 1], clamp);
  const gDy = interpolate(frame, [T.glyph[0], T.glyph[1]], [24, 0], { easing: EASE_LAND, ...clamp }) / k;

  const wOp = interpolate(frame, [T.word[0], T.word[1] - 1], [0, 1], clamp);
  const wDy = interpolate(frame, [T.word[0], T.word[1]], [24, 0], { easing: EASE_LAND, ...clamp }) / k;
  const track = WORD_SIZE * WORD_TRACK;

  const pan = (side: -1 | 1) => {
    const e = endPt(tilt, side);
    const rim = [-DISH_HW + 3, 0, DISH_HW - 3];
    const lines = rim.map((x) => `M0,0L${x},${HANG}`).join("");
    const dish = `M${-DISH_HW},${HANG}L${DISH_HW},${HANG}A${DISH_R},${DISH_R} 0 0 1 ${-DISH_HW},${HANG}Z`;
    return (
      <g key={`pan-${side}`} transform={`translate(${e.x.toFixed(3)} ${e.y.toFixed(3)})`}>
        <path d={lines} fill="none" {...halo} strokeWidth={SW_HANG + HALO} />
        <path d={lines} fill="none" stroke={ink} strokeWidth={SW_HANG} />
        <path d={dish} fill={FILL} {...halo} strokeWidth={SW + HALO} strokeLinejoin="round" />
        <path d={dish} fill="none" stroke={ink} strokeWidth={SW} strokeLinejoin="round" />
      </g>
    );
  };
  const outline = (d: string, key: string, w = SW) => (
    <g key={key}>
      <path d={d} fill={FILL} {...halo} strokeWidth={w + HALO} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinejoin="round" />
    </g>
  );
  const postBot = GROUND - STEP2.h - STEP1.h;
  const beamD = `M${-L},${-BEAM_END}L0,${-BEAM_MID}L${L},${-BEAM_END}L${L},${BEAM_END}L0,${BEAM_MID}L${-L},${BEAM_END}Z`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* the page, world space: pans and zooms with everything printed on it */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${k.toFixed(5)})`,
        }}
      >
        {Array.from({ length: TILES }, (_, i) => {
          const mask = i ? `linear-gradient(to right, transparent 0px, black ${PAGE_OV}px)` : undefined;
          return (
            <Img
              key={`page-${i}`}
              src={staticFile(backdropSrc)}
              style={{
                position: "absolute",
                left: PAGE_X0 + i * (TILE_W - PAGE_OV),
                top: PAGE_Y0,
                width: TILE_W,
                height: TILE_H,
                transform: i % 2 === 1 ? "scaleY(-1)" : undefined,
                WebkitMaskImage: mask,
                maskImage: mask,
              }}
            />
          );
        })}
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <g transform={camT}>
          {/* part 1: the question marks */}
          {MARKS.map((m, i) => {
            const p = markPose(m, i, frame);
            if (p.op <= 0.001) return null;
            const mx = X0 + m.x + p.dx;
            const my = CY + m.y + p.dy;
            if (toScreen(mx, my, frame).x < -300) return null;
            return (
              <g key={`q-${i}`} opacity={p.op} transform={`rotate(${p.rot.toFixed(3)} ${mx.toFixed(2)} ${my.toFixed(2)})`}>
                <text
                  x={mx}
                  y={my + m.h / 2}
                  textAnchor="middle"
                  fill={ink}
                  stroke={SHADE}
                  strokeOpacity={0.5}
                  strokeWidth={4}
                  paintOrder="stroke"
                  style={{ fontFamily: fell, fontSize: m.h / QM_EM }}
                >
                  ?
                </text>
              </g>
            );
          })}

          {/* part 2: the balance */}
          <g transform={`translate(${BX} ${PIVOT_Y.toFixed(3)})`}>
            {outline(
              `M${-STEP2.hw},${GROUND}L${STEP2.hw},${GROUND}L${STEP2.hw},${GROUND - STEP2.h}L${-STEP2.hw},${GROUND - STEP2.h}Z`,
              "step2",
            )}
            {outline(
              `M${-STEP1.hw},${GROUND - STEP2.h}L${STEP1.hw},${GROUND - STEP2.h}L${STEP1.hw},${postBot}L${-STEP1.hw},${postBot}Z`,
              "step1",
            )}
            {outline(`M${-POST_HW},${postBot}L${POST_HW},${postBot}L${POST_HW},${PLATE_Y}L${-POST_HW},${PLATE_Y}Z`, "post")}
            {outline(`M${-PLATE_HW},${PLATE_Y}L${PLATE_HW},${PLATE_Y}`, "plate")}

            {pan(-1)}
            {pan(1)}

            <g transform={`rotate(${tilt.toFixed(4)})`}>
              {outline(beamD, "beam", SW_BEAM)}
              {[-L, L].map((x) => (
                <g key={`hook-${x}`}>
                  <circle cx={x} cy={0} r={HOOK_R} fill={FILL} {...halo} strokeWidth={SW + HALO} />
                  <circle cx={x} cy={0} r={HOOK_R} fill="none" stroke={ink} strokeWidth={SW} />
                </g>
              ))}
            </g>
            <circle cx={0} cy={0} r={PIVOT_R} fill={FILL} {...halo} strokeWidth={SW + HALO} />
            <circle cx={0} cy={0} r={PIVOT_R} fill="none" stroke={ink} strokeWidth={SW} />
            <circle cx={0} cy={0} r={2.2} fill={ink} />

            {gOp > 0.001 ? (
              <g opacity={gOp} transform={`translate(0 ${(GLYPH_Y + gDy).toFixed(3)}) scale(${GLYPH / 24}) translate(-12 -12)`}>
                {SWORDS.map((d) => (
                  <path
                    key={`h-${d}`}
                    d={d}
                    fill="none"
                    stroke={SHADE}
                    strokeOpacity={HALO_OP}
                    strokeWidth={(SW + HALO) * (24 / GLYPH)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {SWORDS.map((d) => (
                  <path
                    key={`i-${d}`}
                    d={d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={SW * (24 / GLYPH)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            ) : null}

            {wOp > 0.001 ? (
              <text
                x={track / 2}
                y={WORD_BASE_L + wDy}
                textAnchor="middle"
                fill={ink}
                opacity={wOp}
                stroke={SHADE}
                strokeOpacity={0.5}
                strokeWidth={4}
                paintOrder="stroke"
                style={{ fontFamily: fellSC, fontSize: WORD_SIZE, letterSpacing: track }}
              >
                {word}
              </text>
            ) : null}
          </g>

          {/* the dead */}
          {DOTS.map((d, i) => {
            const p = dotPos(d, frame);
            if (!p) return null;
            return (
              <g key={`d-${i}`} opacity={p.op}>
                <circle cx={p.x} cy={p.y} r={DOT_R + 1.1} fill={SHADE} fillOpacity={HALO_OP} />
                <circle cx={p.x} cy={p.y} r={DOT_R} fill={ink} />
              </g>
            );
          })}
        </g>
      </svg>

      {/* film grain and vignette, screen space */}
      <Img
        src={staticFile(grainSrc)}
        style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: grainOpacity }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(
            3,
          )}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default LopsidedV2;
