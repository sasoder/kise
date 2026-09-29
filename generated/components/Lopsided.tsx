import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { z } from "zod";
import { clamp, clamp01, hash, smoothstep, sway } from "./fieldShared";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// Lopsided: a battle on the fulcrum, its dead in the pans.
//
// Sarah Paine, Russo-Japanese War clip "Almost no battle is actually
// decisive", straight after NotConveyingAnything. She asks her own question
// and answers it:
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
// The battle is never named and no number appears: it stands in for "a
// battle where the casualty rates are really skewed".
//
// THE WORLD (world px == screen px at k 1). One page. Five question marks
// stand on it around (540, 835); the balance stands on the same page PAN_D
// px further right, centred on world x 540 + PAN_D. The camera travels from
// one to the other. Cream only, 1.0 / 0.5 ladder: no orange (orange is Japan
// on the maps; this is a definitional cut, like NotConveyingAnything).
//
// THE GESTURES, each with its word:
//   1. "important, in what way?" f0-36: five IM Fell English question marks
//      (one ~280 px tall at 1.0, four 105-165 px, three of them at 0.5) each
//      slide up 24 px while fading in, individually eased, landing f10 / f15
//      / f19 / f24 (the big one, "way?") / f26. They drift and sway on hashed
//      phases for as long as they are on screen.                  — f-2..26
//   2. "And for instance, I would use different words" f34-88: the pan. One
//      smoothstep glide right, PAN_D = 1450 world px, f34 -> f88 (peak 40.3
//      px/f, under the 45 cap). The marks leave frame left ~f62; the
//      standing balance enters from the right and comes to rest centred f88,
//      4 f before "words".                                        — f34-88
//   3. The balance, on the page the whole time: slim post on a two-step
//      base, a 600 px beam on a pivot, two 210 px shallow dishes each hung
//      plumb from a beam end by three thin lines. Empty, it breathes
//      +-0.4 deg.                                                  — always
//   4. "for a battle" f105-119: the crossed-swords glyph (the clip's battle
//      symbol from NotConveyingAnything, 90 px box) slides up 24 px while
//      fading in onto the plate at the top of the post, landing f119. — f105-119
//   5. "where the casualty rates are really skewed" f128-186: the dead fall
//      out of the glyph on their own ballistic arcs: 1 dot into the LEFT pan
//      (lands f141), 44 into the RIGHT pan (land f143 -> f186, hashed, no two
//      on one frame-time), heaping 9-8-7-6-5-4-3-2 at 1.35 dot pitch. The
//      beam is DRIVEN BY THE LANDED DOTS: target = 20.5 deg x a signed
//      saturating function of (right - left) landed (tau 40 dots), followed
//      by a damped spring (w 0.24 rad/f, zeta 0.5); each landing also hands
//      the beam its momentum (0.2 deg/f). The lone left dot dips it left
//      (f141-145), then the beam steps down with the stream, passes 20 deg
//      as the last dots land (f186), overshoots once to ~23.8 deg (f188,
//      "skewed") and settles at 20.5 by ~f212. Pans stay plumb; the dots
//      ride in their pan.                                         — f128-212
//   6. "lopsided" f200-210: LOPSIDED (IM Fell English SC, widely spaced caps,
//      ~75 px cap height, cream 1.0) slides up 24 px under the balance,
//      landing f210. The only word in the piece.                 — f200-210
//   7. Tail f210-244: ~2% creep in on the balance (f200 -> f252, still
//      moving on the last frame), the beam's residual spring + breath, the
//      house sway.                                               — f200-244
//
// STYLE: NotConveyingAnything's page: umber land backdrop in screen space
// (5% oversize, a +-29 px parallax drift over the pan), cream ink #E9DDBF
// with a dark halo, the house vignette. Glyph and balance outline 2.6 px,
// beam 3.0, hang lines 1.4 (NCA's stem weight). Dark page fill #2A2119 in
// the beam, pivot, post, base and dishes; no gradients.
// Caption band: the heavy pan (at its overshoot) and the word are asserted
// above y1150 on every frame.
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
  vignette: z.number(),
  word: z.string(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  vignette: 0.32,
  word: "LOPSIDED",
});

// ---------------------------------------------------------------------------
// Strokes and ladder (as NotConveyingAnything).
// ---------------------------------------------------------------------------
const SW = 2.6; // glyph + balance outline
const SW_BEAM = 3.0;
const SW_HANG = 1.4;
const HALO = 2;
const HALO_OP = 0.45;
const DIM = 0.5;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const CAPTION_TOP = 1150;

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  pan: [34, 88] as const,
  glyph: [105, 119] as const,
  leftLand: 141,
  rightLand: [143, 186] as const,
  word: [200, 210] as const,
  creep: [200, 252] as const,
};

// ---------------------------------------------------------------------------
// The camera: world (cx, CY) -> screen (540, 835).
// ---------------------------------------------------------------------------
export const CY = 835;
const X0 = W / 2;
export const PAN_D = 1450;
export const BX = X0 + PAN_D; // the balance's world x
const CREEP_K = 1.02;
export const camCX = (f: number) => X0 + PAN_D * smoothstep((f - T.pan[0]) / (T.pan[1] - T.pan[0]));
export const camK = (f: number) => Math.pow(CREEP_K, smoothstep((f - T.creep[0]) / (T.creep[1] - T.creep[0])));

// ---------------------------------------------------------------------------
// Part 1: the question marks, around world (540, 835).
// h = ink height in px (IM Fell "?" ink ~0.70 em), rot = resting tilt, deg.
// ---------------------------------------------------------------------------
const QM_EM = 0.7;
type Mark = { x: number; y: number; h: number; op: number; land: number; dur: number; rot: number };
const MARKS: Mark[] = [
  { x: -228, y: -196, h: 150, op: DIM, land: 10, dur: 12, rot: -9 },
  { x: 238, y: 176, h: 165, op: DIM, land: 15, dur: 13, rot: 7 },
  { x: 214, y: -232, h: 110, op: 1, land: 19, dur: 12, rot: 10 },
  { x: 12, y: 8, h: 280, op: 1, land: 24, dur: 14, rot: -3 },
  { x: -206, y: 222, h: 125, op: DIM, land: 26, dur: 12, rot: -6 },
];
const markPose = (m: Mark, i: number, f: number) => {
  const u = clamp01((f - (m.land - m.dur)) / m.dur);
  const p1 = 29 + 13 * hash(i, 1);
  const p2 = 33 + 15 * hash(i, 2);
  const p3 = 37 + 17 * hash(i, 3);
  return {
    op: m.op * clamp01((f - (m.land - m.dur)) / (m.dur - 2)),
    dx: 7 * Math.sin(f / p1 + 6.28 * hash(i, 4)),
    dy: 24 * (1 - EASE_LAND(u)) + 6 * Math.sin(f / p2 + 6.28 * hash(i, 5)),
    rot: m.rot + 2.4 * Math.sin(f / p3 + 6.28 * hash(i, 6)),
  };
};

// ---------------------------------------------------------------------------
// Part 2: the balance, local coords with the pivot at (0, 0); world
// (BX, PIVOT_Y). Positive tilt = right end down.
// ---------------------------------------------------------------------------
const L = 300; // beam half-length
const HANG = 182; // beam end -> dish rim
const DISH_HW = 105; // dish half-width (210 px)
const DISH_D = 28; // dish depth under the rim
const DISH_R = (DISH_HW * DISH_HW + DISH_D * DISH_D) / (2 * DISH_D); // bowl arc radius

// the swords, the clip's battle glyph (Lucide `swords`, as in NotConveyingAnything)
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
const GLYPH = 90; // box, ink spans 3..21 of 24 -> 67.5 px
const GLYPH_INK_HALF = (GLYPH * 9) / 24;
const PLATE_Y = -30; // the plate at the top of the post the battle stands on
const PLATE_HW = 22;
const GLYPH_Y = PLATE_Y - 6 - GLYPH_INK_HALF; // glyph centre
const POST_HW = 5;

// ---- the dead: 1 dot left, 44 dots right --------------------------------
const DOT_R = 7; // 14 px
const PITCH = 1.35 * 2 * DOT_R; // 18.9 px, >= 1.25 diameters
const ROW_H = PITCH * 0.866;
const FLOOR = HANG + 4; // row-0 centre, 4 px into the bowl (pan-local, hang point = origin)
const ROWS = [9, 8, 7, 6, 5, 4, 3, 2];
const N_RIGHT = ROWS.reduce((a, b) => a + b, 0); // 44
const N_LEFT = 1;

type Slot = { x: number; y: number };
const SLOTS: Slot[] = (() => {
  const out: Slot[] = [];
  ROWS.forEach((n, r) => {
    // row r, hashed order within the row (rows fill bottom-up, so every dot
    // lands on two that are already there)
    const row: (Slot & { o: number })[] = [];
    for (let j = 0; j < n; j++) {
      const id = out.length + j;
      row.push({
        x: (j - (n - 1) / 2) * PITCH + 0.6 * (hash(id, 11) - 0.5),
        y: FLOOR - r * ROW_H + 0.6 * (hash(id, 12) - 0.5),
        o: hash(id, 13),
      });
    }
    row.sort((a, b) => a.o - b.o).forEach(({ x, y }) => out.push({ x, y }));
  });
  return out;
})();
if (SLOTS.length !== 44) throw new Error("Lopsided: the right pan needs 44 dots");
// no overlap: every pair >= 1.25 diameters apart
(() => {
  let min = Infinity;
  for (let a = 0; a < SLOTS.length; a++)
    for (let b = a + 1; b < SLOTS.length; b++) min = Math.min(min, Math.hypot(SLOTS[a].x - SLOTS[b].x, SLOTS[a].y - SLOTS[b].y));
  if (min < 1.25 * 2 * DOT_R) throw new Error(`Lopsided: pile spacing ${min.toFixed(2)} < 1.25 d`);
  // the pile stays inside the dish at the floor and inside the hang lines above
  for (const s of SLOTS) {
    const up = HANG - s.y; // height of the dot centre above the rim
    const lineHW = DISH_HW * (1 - (up + DOT_R) / HANG);
    if (Math.abs(s.x) + DOT_R > Math.max(lineHW, 0) + 0.01 && up + DOT_R > 0)
      throw new Error(`Lopsided: a dot pokes through the hang lines (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
  }
})();
// the lone dot rests off-centre, so it never reads as a bob on the middle line
const LEFT_SLOT: Slot = { x: -30, y: FLOOR };
// every dot's bottom stays inside the bowl's arc
(() => {
  const cy = HANG + DISH_D - DISH_R;
  for (const s of [...SLOTS, LEFT_SLOT])
    if (s.y > HANG - DOT_R && Math.hypot(s.x, s.y - cy) > DISH_R - DOT_R)
      throw new Error(`Lopsided: a dot pokes through the dish (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`);
})();

// landing times: right dots spread over f143 -> f186, hashed, strictly increasing
const RIGHT_LAND: number[] = (() => {
  const [a, b] = T.rightLand;
  const out: number[] = [];
  for (let i = 0; i < N_RIGHT; i++) {
    const u = i / (N_RIGHT - 1);
    const g = u + 0.07 * Math.sin(Math.PI * u); // a touch denser late
    out.push(a + (b - a) * clamp01(g) + (i > 0 && i < N_RIGHT - 1 ? 0.8 * (hash(i, 21) - 0.5) : 0));
  }
  for (let i = 1; i < out.length; i++) if (out[i] <= out[i - 1] + 0.2) out[i] = out[i - 1] + 0.2;
  return out;
})();

type Dot = { side: -1 | 1; slot: Slot; land: number; dur: number; lift: number; ox: number; oy: number };
export const DOTS: Dot[] = [
  { side: -1, slot: LEFT_SLOT, land: T.leftLand, dur: 15, lift: 66, ox: -4, oy: 2 },
  ...SLOTS.map((slot, i) => ({
    side: 1 as const,
    slot,
    land: RIGHT_LAND[i],
    dur: 15 + 3 * hash(i, 31),
    lift: 40 + 38 * hash(i, 32),
    ox: 10 * (hash(i, 33) - 0.5),
    oy: 10 * (hash(i, 34) - 0.5),
  })),
];

// ---- the beam, driven by the landed dots ----------------------------------
const TILT_MAX = 20.5; // deg, where the 44 : 1 imbalance settles
const TAU = 40; // saturation scale, in dots
const OMEGA = 0.24; // rad / frame
const ZETA = 0.5;
const KICK = 0.2; // deg / frame of beam velocity per landing dot (its momentum)
const BREATH = 0.4; // deg
const sat = (d: number) => Math.sign(d) * (1 - Math.exp(-Math.abs(d) / TAU));
const SAT_FULL = sat(N_RIGHT - N_LEFT);
const landedDiff = (t: number) => DOTS.reduce((acc, d) => acc + (t >= d.land ? d.side : 0), 0);
export const tiltTarget = (t: number) => (TILT_MAX * sat(landedDiff(t))) / SAT_FULL;

const SUB = 16;
const SIM: number[] = (() => {
  let th = 0;
  let v = 0;
  const out: number[] = [0];
  for (let f = 0; f < DURATION + 8; f++) {
    for (let s = 0; s < SUB; s++) {
      const t = f + s / SUB;
      for (const d of DOTS) if (d.land >= t && d.land < t + 1 / SUB) v += d.side * KICK;
      const a = OMEGA * OMEGA * (tiltTarget(t) - th) - 2 * ZETA * OMEGA * v;
      v += a / SUB;
      th += v / SUB;
    }
    out.push(th);
  }
  return out;
})();
export const springTilt = (f: number) => {
  const i = Math.max(0, Math.min(SIM.length - 2, Math.floor(f)));
  const u = clamp01(f - i);
  return SIM[i] + (SIM[i + 1] - SIM[i]) * u;
};
export const tiltDeg = (f: number) => springTilt(f) + BREATH * Math.sin(f / 21 + 0.7);
const TILT_PEAK = Math.max(...SIM.map(Math.abs)) + BREATH;

const endPt = (deg: number, side: -1 | 1) => {
  const a = (deg * Math.PI) / 180;
  return { x: side * L * Math.cos(a), y: side * L * Math.sin(a) };
};

// the ground (base bottom) clears the heavy pan at its overshoot by 12 px
const HEAVY_LOW = L * Math.sin((TILT_PEAK * Math.PI) / 180) + HANG + DISH_D;
const GROUND = Math.ceil(HEAVY_LOW + 12);
const STEP1 = { hw: 58, h: 12 };
const STEP2 = { hw: 92, h: 15 };

// the word
const WORD_SIZE = 108; // cap height ~0.7 em = ~75 px
const WORD_CAP = 0.7 * WORD_SIZE;
const WORD_TRACK = 0.24; // em
const WORD_GAP = 46; // ground -> cap top
const WORD_BASE_L = GROUND + WORD_GAP + WORD_CAP; // local baseline
const WORD_SINK = 0.13 * WORD_SIZE; // IM Fell caps' serifs sit ~14 px under the baseline (measured on the still)

// group: glyph top (or the light pan's hang point, whichever is higher) ->
// word baseline, centred on y835
const GROUP_TOP = Math.min(GLYPH_Y - GLYPH_INK_HALF, -L * Math.sin((TILT_PEAK * Math.PI) / 180));
export const PIVOT_Y = CY - (GROUP_TOP + WORD_BASE_L + WORD_SINK) / 2;

// dot position in world at frame f
const panOrigin = (f: number, side: -1 | 1) => {
  const e = endPt(tiltDeg(f), side);
  return { x: BX + e.x, y: PIVOT_Y + e.y };
};
export const dotPos = (d: Dot, f: number) => {
  const t0 = d.land - d.dur;
  if (f < t0) return null;
  const po = panOrigin(f, d.side);
  const tx = po.x + d.slot.x;
  const ty = po.y + d.slot.y;
  if (f >= d.land) return { x: tx, y: ty, op: 1 };
  const u = (f - t0) / d.dur;
  const sx = BX + d.ox;
  const sy = PIVOT_Y + GLYPH_Y + d.oy;
  return {
    x: sx + (tx - sx) * u,
    y: sy + (ty - sy) * u - 4 * d.lift * u * (1 - u),
    op: clamp01((f - t0) / 3),
  };
};

// Flights apart: in launch order, each dot takes the first of 40 hashed
// (flight time, lift, spout offset) variants whose arc keeps >= 1.2 diameters from every
// dot already placed (sampled at quarter frames once it is out of the glyph)
// and never moves faster than 44 px/f;
// failing that, the variant with the most clearance. Deterministic, once.
(() => {
  const CLEAR = 1.2 * 2 * DOT_R;
  const placed: Dot[] = [];
  const clearance = (d: Dot) => {
    // the close-up speed cap: no flight faster than 44 px/f
    for (let f = d.land - d.dur; f < d.land; f += 1) {
      const p = dotPos(d, f)!;
      const q = dotPos(d, Math.min(f + 1, d.land))!;
      if (Math.hypot(q.x - p.x, q.y - p.y) > 44) return -1;
    }
    let min = Infinity;
    for (let f = d.land - d.dur + 3; f < d.land; f += 0.25) {
      const p = dotPos(d, f)!;
      for (const q of placed) {
        const o = dotPos(q, f);
        if (o) min = Math.min(min, Math.hypot(p.x - o.x, p.y - o.y));
      }
    }
    return min;
  };
  [...DOTS]
    .sort((a, b) => a.land - a.dur - (b.land - b.dur))
    .forEach((d, n) => {
      if (d.side === -1) {
        placed.push(d);
        return;
      }
      let best = { c: -1, lift: d.lift, ox: d.ox, oy: d.oy, dur: d.dur };
      for (let v = 0; v < 40; v++) {
        d.dur = 14.5 + 4 * hash(n, 130 + v);
        d.lift = 30 + 60 * hash(n, 40 + v);
        d.ox = 16 * (hash(n, 70 + v) - 0.5);
        d.oy = 12 * (hash(n, 100 + v) - 0.5);
        const c = clearance(d);
        if (c > best.c) best = { c, lift: d.lift, ox: d.ox, oy: d.oy, dur: d.dur };
        if (c >= CLEAR) break;
      }
      d.lift = best.lift;
      d.ox = best.ox;
      d.oy = best.oy;
      d.dur = best.dur;
      placed.push(d);
    });
})();

// caption band: the heavy pan (lowest possible) and the word, screen space,
// at the maximum creep and sway
(() => {
  const kMax = CREEP_K;
  const toScreen = (yWorld: number) => CY + (yWorld - CY) * kMax + 2.5;
  const panLow = toScreen(PIVOT_Y + HEAVY_LOW);
  const wordLow = toScreen(PIVOT_Y + WORD_BASE_L + WORD_SINK);
  const baseLow = toScreen(PIVOT_Y + GROUND);
  if (Math.max(panLow, wordLow, baseLow) >= CAPTION_TOP)
    throw new Error(`Lopsided: caption band breached (pan ${panLow.toFixed(1)}, word ${wordLow.toFixed(1)})`);
})();

// ---------------------------------------------------------------------------
const Lopsided: React.FC<Props> = ({ ink, backdropSrc, vignette, word }) => {
  const frame = useCurrentFrame();

  const k = camK(frame);
  const cx = camCX(frame);
  const drift = sway(frame);
  const tx = X0 - cx * k + drift.dx * 0.6;
  const ty = CY - CY * k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;

  // backdrop: screen space, a slight parallax drift over the pan
  const bgX = -0.04 * (cx - X0 - PAN_D / 2) + drift.dx * 0.3;
  const bgY = drift.dy * 0.25;
  const bgScale = 1.05 + 0.25 * (k - 1);

  const halo = { stroke: SHADE, strokeOpacity: HALO_OP };
  const tilt = tiltDeg(frame);

  // the battle
  const gOp = interpolate(frame, [T.glyph[0], T.glyph[1] - 2], [0, 1], clamp);
  const gDy = interpolate(frame, [T.glyph[0], T.glyph[1]], [24, 0], { easing: EASE_LAND, ...clamp });

  // the word
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

  const postTop = PLATE_Y;
  const postBot = GROUND - STEP2.h - STEP1.h;
  const beamD = `M${-L},-3.5L0,-6.5L${L},-3.5L${L},3.5L0,6.5L${-L},3.5Z`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: `${X0}px ${CY}px`,
          transform: `translate(${bgX.toFixed(3)}px, ${bgY.toFixed(3)}px) scale(${bgScale.toFixed(5)})`,
        }}
      >
        <Img
          src={staticFile(backdropSrc)}
          style={{ position: "absolute", left: -W * 0.05, top: -H * 0.05, width: W * 1.1, height: H * 1.1 }}
        />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <g transform={camT}>
          {/* part 1: the question marks */}
          {cx - X0 < 1200
            ? MARKS.map((m, i) => {
                const p = markPose(m, i, frame);
                if (p.op <= 0.001) return null;
                const size = m.h / QM_EM;
                const mx = X0 + m.x + p.dx;
                const my = CY + m.y + p.dy;
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
                      style={{ fontFamily: fell, fontSize: size }}
                    >
                      ?
                    </text>
                  </g>
                );
              })
            : null}

          {/* part 2: the balance */}
          <g transform={`translate(${BX} ${PIVOT_Y.toFixed(3)})`}>
            {/* base and post */}
            {outline(
              `M${-STEP2.hw},${GROUND}L${STEP2.hw},${GROUND}L${STEP2.hw},${GROUND - STEP2.h}L${-STEP2.hw},${GROUND - STEP2.h}Z`,
              "step2",
            )}
            {outline(
              `M${-STEP1.hw},${GROUND - STEP2.h}L${STEP1.hw},${GROUND - STEP2.h}L${STEP1.hw},${postBot}L${-STEP1.hw},${postBot}Z`,
              "step1",
            )}
            {outline(`M${-POST_HW},${postBot}L${POST_HW},${postBot}L${POST_HW},${postTop}L${-POST_HW},${postTop}Z`, "post")}
            {outline(`M${-PLATE_HW},${PLATE_Y}L${PLATE_HW},${PLATE_Y}`, "plate")}

            {/* the pans, plumb from the beam ends */}
            {pan(-1)}
            {pan(1)}

            {/* the beam and pivot */}
            <g transform={`rotate(${tilt.toFixed(4)})`}>
              {outline(beamD, "beam", SW_BEAM)}
              {[-L, L].map((x) => (
                <g key={`hook-${x}`}>
                  <circle cx={x} cy={0} r={5} fill={FILL} {...halo} strokeWidth={SW + HALO} />
                  <circle cx={x} cy={0} r={5} fill="none" stroke={ink} strokeWidth={SW} />
                </g>
              ))}
            </g>
            <circle cx={0} cy={0} r={9} fill={FILL} {...halo} strokeWidth={SW + HALO} />
            <circle cx={0} cy={0} r={9} fill="none" stroke={ink} strokeWidth={SW} />
            <circle cx={0} cy={0} r={2.4} fill={ink} />

            {/* the battle on the fulcrum */}
            {gOp > 0.001 ? (
              <g opacity={gOp} transform={`translate(0 ${(GLYPH_Y + gDy).toFixed(3)}) scale(${GLYPH / 24}) translate(-12 -12)`}>
                {SWORDS.map((d) => (
                  <path
                    key={`h-${d}`}
                    d={d}
                    fill="none"
                    stroke={SHADE}
                    strokeOpacity={HALO_OP}
                    strokeWidth={SW + HALO}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {SWORDS.map((d) => (
                  <path
                    key={`i-${d}`}
                    d={d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={SW}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            ) : null}

            {/* the word */}
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

          {/* the dead, falling and heaped (world space) */}
          {DOTS.map((d, i) => {
            const p = dotPos(d, frame);
            if (!p) return null;
            return (
              <g key={`d-${i}`} opacity={p.op}>
                <circle cx={p.x} cy={p.y} r={DOT_R + 1.2} fill={SHADE} fillOpacity={HALO_OP} />
                <circle cx={p.x} cy={p.y} r={DOT_R} fill={ink} />
              </g>
            );
          })}
        </g>
      </svg>

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

export default Lopsided;
