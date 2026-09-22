import { AbsoluteFill } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  makeTone,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  DASH_OFF_PX,
  DASH_ON_PX,
  INK,
  INK_HI,
  INK_LO,
  Label,
  MARCH_PX_PER_F,
  STROKE_PX,
  THREAD_PX,
  lerp,
} from "./alignShared";

// ---------------------------------------------------------------------------
// `Noam_Airgapping`, FILM B — the air-gap world. Orange Dwarkesh, grid
// background, 24 fps, 1080x1920, opaque, muted.
//
// ONE WORLD, ONE CLOCK, THREE WINDOWS. Global frame G = round((t - 58.559) *
// 24). Every cut renders `<AirgapFrame G={G0 + f} cam={...} />` and nothing in
// this file is keyed to a cut: a cut only chooses where the camera is.
//   58_VeryHighBar          G0   0  speech ends G146  DURATION 162
//   EXTRA 64_NotSufficient   G0 146  speech ends G180  DURATION  50
//   66_TemperatureChannel   G0 180  speech ends G546  DURATION 381
//
// THE VOCABULARY (<= 5 element types on any frame):
//   A COMPUTER = a desktop tower, one stroke, closed outlines: case (r 6 % of
//     width, 360 x 690, height 1.92x width), two feet, a six-slot vent grille
//     and a power button along the top (INK_LO), and a side-panel window
//     (INK_LO) through which the CPU chip (Lucide `cpu`) and later the
//     thermometer are seen. The chip's CORE is a solid orange square — the AI
//     lives there. ACCENT_DEEP = dormant, ACCENT = running hot / lit. Its pins
//     tick to the deep tone one at a time with compute (hashed per pin, never
//     in unison) and light ACCENT when the chip runs hot.
//   ORANGE = THE ROGUE AI AND EVERYTHING IT DOES: cores, pin ticks, the packets
//     on the cable (its traffic), the heat shimmer, the heat wavefronts, the
//     mercury, and the HEAT CABLE (the bits laid in the gap + its packets).
//   WHITE = our hardware and our measures, INK_HI / INK_LO only.
//
// GEOMETRY (world px; K_REST 0.957 is the wide framing, pair + gap = 91 % of
// the frame width; world strokes are STROKE_PX 6.5 screen px there):
//   towers 360 x 690, tops at 500, case bottom 1190, feet to 1204; gap GAP0 200
//   (cabled) -> GAP1 300 (air-gapped). Chip centre 140 in from the OUTER wall
//   at y 870 — the cable, the heat channel and the heat cable all run on that
//   axis. Thermometer (Lucide, scale 8.5) at 290 in, against the inner wall.
//   AIR GAP marker above the gap, label above it (y 404).
//
// SCHEDULE (global G):
//   G < 82    packets both ways on the cable
//   G6-51     the bar rises with three kicks and a big rise; guide rides it,
//             retracts G64-94
//   G101-107  coupler pops apart; G106-121 halves reel in; G108-131 slide apart
//   G114-125  AIR GAP marker + label; G312-322 marker INK_LO -> INK_HI
//   G150-206  heat shimmer off the left inner wall
//   G366-379  thermometers slide up
//   G404-434  left chip hot, pins lit, mercury up (peak on "hot" G448)
//   G406-436  heat arcs every 6 f; right mercury rises from ~G463
//   G450+     SIGNAL, pulse-length: a 1 = two arcs 3 f apart, a 0 = one arc,
//             slot every 8 f for the five LAID bits (every 14 f after). Each
//             laid slot's leading arc lays its bit on the chip axis in the gap
//             (dash = 1, packet dot = 0), left to right, G475-532 — the cable
//             coming back, made of heat. From G530 packets run along it into
//             the right tower; the right core lights ripe from ~G551.
// ---------------------------------------------------------------------------

export const FPS = 24;
export { ACCENT, ACCENT_DEEP, INK, INK_HI, INK_LO };

// --- the weights -------------------------------------------------------------
export const K_REST = 0.957;
/** world px; 6.5 screen px at the rest framing */
export const STROKE_W = STROKE_PX / K_REST;
export const THREAD_W = THREAD_PX / K_REST;
export const DASH_ON = DASH_ON_PX / K_REST;
export const DASH_OFF = DASH_OFF_PX / K_REST;
export const MARCH = MARCH_PX_PER_F / K_REST;
/** a packet: 18 world px across (~17 screen px at the wide framing) — the cable's
 *  packets, the heat cable's packets and its dot bits are all this one shape */
export const PACKET_R = 9;

export const TONE = makeTone(ACCENT_DEEP, ACCENT);

// --- the towers ----------------------------------------------------------------
// A desktop tower, one stroke, closed outlines: the case (r = 6 % of width),
// two feet, a vent grille of six short slots and a power button along the top,
// and a side-panel WINDOW through which the chip and the thermometer are seen.
export const PAIR_CX = 540;
export const TW = 360;
export const TH = 690;
export const TOP_Y = 500;
export const CASE_BOT = TOP_Y + TH; // 1190
export const FOOT_H = 14;
export const GROUND_Y = CASE_BOT + FOOT_H; // 1204, the feet's soles
export const TOWER_R = Math.round(0.06 * TW); // 22
export const GAP0 = 200;
export const GAP1 = 300;

export const CHIP_U = 140;
export const CHIP_Y = TOP_Y + 370; // 870
export const CHIP_S = 128;
export const CHIP_R = 14;
export const CORE_S = 60;
export const PIN_L = 18;
export const PIN_OFF = [-38, 0, 38];

export const GRILLE_US = [170, 200, 230, 260, 290, 320].map((u) => u - 8);
export const GRILLE_Y0 = TOP_Y + 42;
export const GRILLE_Y1 = TOP_Y + 86;
export const BUTTON_U = 66;
export const BUTTON_Y = TOP_Y + 64;
export const BUTTON_R = 13;
export const WIN_U0 = 18;
export const WIN_U1 = TW - 18;
export const WIN_Y0 = TOP_Y + 124;
export const WIN_Y1 = CASE_BOT - 40;
export const WIN_R = 12;
export const FEET: [number, number][] = [
  [40, 96],
  [264, 320],
];

// thermometer: Lucide `thermometer` (24 box) at scale THERMO_S
export const THERMO_S = 8.5;
export const THERMO_U = 290;
export const THERMO_Y0 = CHIP_Y - 12 * THERMO_S; // the 24-box origin's world y
export const THERMO_PATH = "M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z";
export const BULB_CY = THERMO_Y0 + 18 * THERMO_S;
export const BULB_R = 4 * THERMO_S;
export const STEM_HALF = 2 * THERMO_S;
export const THERMO_TOP = THERMO_Y0 + 2 * THERMO_S;
export const THERMO_BOT = THERMO_Y0 + 22 * THERMO_S;
export const MERC_R = 18;
export const MERC_W = 13;
export const MERC_TOP = THERMO_TOP + 20;

// --- the schedule ----------------------------------------------------------------
export const SLIDE: [number, number] = [108, 131];
export const slideU = (G: number) => smoothstep((G - SLIDE[0]) / (SLIDE[1] - SLIDE[0]));
export const gapAt = (G: number) => lerp(GAP0, GAP1, slideU(G));

/** side -1 = left tower, +1 = right tower */
export type Side = -1 | 1;
export const innerX = (side: Side, G: number) => PAIR_CX + (side * gapAt(G)) / 2;
export const outerX = (side: Side, G: number) => PAIR_CX + side * (gapAt(G) / 2 + TW);
/** a point u px in from a tower's OUTER wall */
export const uX = (side: Side, u: number, G: number) => outerX(side, G) - side * u;
export const chipX = (side: Side, G: number) => uX(side, CHIP_U, G);
export const thermoX = (side: Side, G: number) => uX(side, THERMO_U, G);

// packets
export const PKT_V = 8;
export const PKT_PERIOD = 8;
export const PKT_LAST = 82;
const PKT_FIRST = -120;

// the coupler
export const PLUG_W = 38;
export const PLUG_H = 32;
export const POP: [number, number] = [101, 107];
export const POP_D = 14;
export const RETRACT: [number, number] = [106, 121];
const popU = (G: number) => {
  const u = clamp01((G - POP[0]) / (POP[1] - POP[0]));
  return 1 - (1 - u) * (1 - u) * (1 - u);
};
const retractU = (G: number) => smoothstep((G - RETRACT[0]) / (RETRACT[1] - RETRACT[0]));

// the bar
export const BAR_W = 560;
export const BAR_CAP = 24;
export const BAR_Y0 = TOP_Y - 100; // 520
const BAR_KICKS: { c: number; s: number; a: number }[] = [
  { c: 19.5, s: 2.2, a: 80 },
  { c: 30.8, s: 2.0, a: 100 },
  { c: 37.2, s: 1.9, a: 120 },
  { c: 45.4, s: 3.6, a: 480 },
];
const BAR_BASE = 55;
// the standard normal CDF, Abramowitz-Stegun 7.1.26 on erf (|err| < 1.5e-7)
const erf = (x: number) => {
  const s = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return s * y;
};
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
export const barRise = (G: number) => {
  let r = BAR_BASE * smoothstep((G - 8) / 46);
  for (const q of BAR_KICKS) r += q.a * Phi((G - q.c) / q.s);
  return r;
};
export const barY = (G: number) => BAR_Y0 - barRise(G);
export const BAR_FINAL_Y = BAR_Y0 - BAR_BASE - BAR_KICKS.reduce((s, q) => s + q.a, 0);
export const barIn = (G: number) => smoothstep((G - 6) / 10);
export const GUIDE_BASE_Y = TOP_Y - 8;
export const GUIDE_RETRACT: [number, number] = [64, 94];

// the marker
export const MARK_Y = TOP_Y - 26; // 594
export const MARK_TICK = 16;
export const MARK_IN: [number, number] = [114, 124];
export const LABEL_F0 = 115;
export const LABEL_SIZE = 40;
export const MARK_BRIGHT: [number, number] = [312, 322];
export const markOpacity = (G: number) =>
  lerp(INK_LO, INK_HI, smoothstep((G - MARK_BRIGHT[0]) / (MARK_BRIGHT[1] - MARK_BRIGHT[0])));

// the shimmer
export const SHIMMER = [
  { u: 16, t0: 150, t1: 190, h: 170, ph: 0.0 },
  { u: 38, t0: 158, t1: 198, h: 200, ph: 2.1 },
  { u: 60, t0: 166, t1: 206, h: 150, ph: 4.0 },
];

// the thermometers
export const THERMO_IN: Record<string, [number, number]> = { L: [366, 376], R: [369, 379] };
export const thermoIn = (side: Side, G: number) => {
  const w = THERMO_IN[side < 0 ? "L" : "R"];
  return smoothstep((G - w[0]) / (w[1] - w[0]));
};

// the heat
export const V_ARC = 10;
export const ARC_HB = 120;
/** chip centre to its own inner wall */
export const DX_WALL = TW - CHIP_U; // 220
/** left chip centre to the right thermometer's stem (at GAP1) */
export const DX_END = GAP1 + 2 * TW - THERMO_U - CHIP_U - STEM_HALF; // 573
export const ARC_ABSORB = 46;
export const HEAT_BIRTHS = Array.from({ length: 6 }, (_, j) => 406 + 6 * j); // 406..436
// THE SIGNAL. Pulse-length coding: every slot sends a group — a 1 is two arcs
// 3 f apart (a long hot pulse), a 0 is one arc (a short one). The first LAID
// slots each lay their bit in the gap as their leading arc sweeps over its spot
// on the chip axis; the slots after that keep the channel running.
export const SLOT_T0 = 450;
export const SLOT_P = 8;
export const BITS = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1];
export const LAID = 5;
/** after the laid slots the channel keeps running, sparser, so the line reads */
export const SLOT_P_TAIL = 14;
export const slotT = (s: number) =>
  s < LAID ? SLOT_T0 + SLOT_P * s : SLOT_T0 + SLOT_P * LAID + SLOT_P_TAIL * (s - LAID);
export const groupOff = (b: number) => (b ? [0, 3] : [0]);
export type ArcBirth = { t: number; kind: "heat" | "bit"; slot: number };
export const ARCS: ArcBirth[] = [
  ...HEAT_BIRTHS.map((t) => ({ t, kind: "heat" as const, slot: -1 })),
  ...BITS.flatMap((b, s) =>
    groupOff(b).map((o) => ({ t: slotT(s) + o, kind: "bit" as const, slot: s })),
  ),
];
/** frames from birth to the arc's middle touching the right stem */
export const TRANSIT = DX_END / V_ARC;

// chip heat, left: ramp to hot, then the signal's pulses (long for a 1)
const heatRamp = (G: number) => smoothstep((G - 404) / 30);
const signalMix = (G: number) => smoothstep((G - 440) / 10);
const pulse = (G: number) => {
  let p = 0;
  BITS.forEach((b, s) => {
    const c = slotT(s) + (b ? 1.5 : 0);
    const w = b ? 2.6 : 1.5;
    p = Math.max(p, Math.exp(-((G - c) * (G - c)) / (2 * w * w)));
  });
  return p;
};
export const heatL = (G: number) => {
  const sig = 0.45 + 0.55 * pulse(G);
  return lerp(heatRamp(G), sig, signalMix(G));
};
export const pinsL = (G: number) => smoothstep((G - 410) / 20) * lerp(1, 0.5 + 0.5 * pulse(G), signalMix(G));

// first-order lag for the mercury, precomputed per frame
const G_MAX = 640;
const lagTrack = (src: (G: number) => number, tau: number) => {
  const out: number[] = [];
  let v = src(0);
  for (let G = 0; G <= G_MAX; G++) {
    v += (src(G) - v) / tau;
    out.push(v);
  }
  return out;
};
const MERC_L = lagTrack((G) => 0.88 * heatL(G), 4);
export const mercuryL = (G: number) => MERC_L[Math.max(0, Math.min(G_MAX, Math.round(G)))];

/** An arc's radius from the left chip centre at G. */
export const arcR = (a: ArcBirth, G: number) => V_ARC * (G - a.t);
/** 0..1: how far an arc has been absorbed into the right stem. */
export const absorbU = (a: ArcBirth, G: number) =>
  smoothstep((arcR(a, G) - (DX_END - ARC_ABSORB)) / ARC_ABSORB);

// the right mercury: heat arcs warm it and mostly stay; a signal arc spikes it
// and mostly decays, so the level ticks up and down with each group
const HEAT_W = 0.065;
const HEAT_KEEP = 0.8;
const BIT_W = 0.085;
const BIT_KEEP = 0.1;
const BIT_TAU = 8;
export const mercuryR = (G: number) => {
  let v = 0;
  for (const a of ARCS) {
    const u = absorbU(a, G);
    if (u <= 0) continue;
    // time since this arc was fully absorbed (0 while absorbing)
    const tDone = (G - a.t) - TRANSIT;
    const decay = tDone <= 0 ? 1 : Math.exp(-tDone / (a.kind === "heat" ? 40 : BIT_TAU));
    const keep = a.kind === "heat" ? HEAT_KEEP : BIT_KEEP;
    const w = a.kind === "heat" ? HEAT_W : BIT_W;
    v += w * u * (keep + (1 - keep) * decay);
  }
  return Math.min(0.97, v);
};

// THE BITS IN THE GAP — the cable coming back, made of heat. Laid on the chip
// axis where the cable ran, left to right, in the packet's own shape: a 0 is a
// packet dot, a 1 a short dash of the same height.
export const DASH_W = 48;
export const BIT_GAP = 16;
export const bitW = (b: number) => (b ? DASH_W : 2 * PACKET_R);
const LAID_W = BITS.slice(0, LAID).reduce((a, b) => a + bitW(b), 0) + (LAID - 1) * BIT_GAP;
/** bit s's left edge, world x (the gap is at GAP1 by the time any is laid) */
export const bitX = (s: number) => {
  const x0 = PAIR_CX - LAID_W / 2;
  let x = x0;
  for (let i = 0; i < s; i++) x += bitW(BITS[i]) + BIT_GAP;
  return x;
};
/** the frame slot s's leading arc reaches its bit's left edge */
export const bitAt = (s: number) => slotT(s) + (bitX(s) - chipX(-1, 400)) / V_ARC;
/** 0..1: bit s grown from its left edge — at the sweep's own speed, >= 3 f */
export const bitGrow = (s: number, G: number) =>
  s >= LAID ? 0 : clamp01((G - bitAt(s)) / Math.max(3, bitW(BITS[s]) / V_ARC));
export const LINE_DONE = bitAt(LAID - 1) + 3;

// the heat cable's traffic: packets from the left wall to the right wall along
// the laid line, once it is there
export const HP_T0 = 530;
export const HP_PERIOD = 8;
export const HP_V = 14;
export const heatPackets = (G: number) => {
  const xl = innerX(-1, G);
  const xr = innerX(1, G);
  const travel = (xr - xl) / HP_V;
  const out: number[] = [];
  for (let t0 = HP_T0; t0 <= G; t0 += HP_PERIOD) {
    const t = G - t0;
    if (t <= travel) out.push(xl + HP_V * t);
  }
  return out;
};
export const FIRST_HP_ARRIVE = HP_T0 + (GAP1 / HP_V);
/** the right chip lights ripe when the first packet reaches its tower */
export const chipR = (G: number) => smoothstep((G - FIRST_HP_ARRIVE + 1) / 10);

/** idle life of a dormant core: a slight tone drift, never alpha */
export const idleTone = (G: number, side: Side) => 0.07 + 0.06 * Math.sin(G * 0.09 + (side < 0 ? 0 : 2.4));

// COMPUTE TICKS. The AI is running: each pin, on its own hashed clock, flicks
// to the deep tone for a few frames and back. Sparse, individual, never in
// unison — 24 pins at periods of 46-96 f is one tick every ~3 f overall.
const hashN = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
export const pinTick = (side: Side, pin: number, G: number) => {
  const i = (side < 0 ? 0 : 12) + pin;
  const per = 46 + 50 * hashN(i, 1);
  const ph = per * hashN(i, 2);
  const t = (((G + ph) % per) + per) % per;
  // up over 2 f, down over 6 f
  return t < 2 ? t / 2 : t < 8 ? 1 - (t - 2) / 6 : 0;
};

// ---------------------------------------------------------------------------
// THE CAMERA. Targets are sums of eased glides over GLOBAL G (so a later cut is
// the earlier cut's target plus its own glides), run through fieldShared's
// damper constants with a key per frame. `content y` is where the content
// centre sits; the camera's cy adds CAM_LIFT / k so that point lands on screen
// y 835. A later cut starts its damper from the earlier cut's STATE (position
// and velocity) at the join, so the join is exact in position and speed.
// ---------------------------------------------------------------------------
export type Glide = { a: number; b: number; dk?: number; dx?: number; dy?: number; warp?: number };
export type CamTarget = (G: number) => { k: number; x: number; y: number };

export const glideTarget = (
  base: { k: number; x: number; y: number },
  glides: Glide[],
  parent?: CamTarget,
): CamTarget => (G: number) => {
  const p = parent ? parent(G) : base;
  let { k, x, y } = p;
  for (const g of glides) {
    const e = camEase((G - g.a) / (g.b - g.a), g.warp ?? 1);
    k += (g.dk ?? 0) * e;
    x += (g.dx ?? 0) * e;
    y += (g.dy ?? 0) * e;
  }
  return { k, x, y };
};

/** The film's opening framing: the cabled pair at 80 % of the frame width, the
 *  content centre (pair + the bar that is about to rise) on screen y 835. */
export const CAM_TARGET_BASE = { k: 1.06, x: PAIR_CX, y: 802 };

export type CamState = { cx: number; cy: number; k: number; vx: number; vy: number; vk: number };

/** The damped camera from g0 to g1 inclusive, table index = G - g0. */
export const dampTrack = (target: CamTarget, g0: number, g1: number, init?: CamState) => {
  const t0 = target(g0);
  let s: CamState = init ?? { cx: t0.x, cy: t0.y + CAM_LIFT / t0.k, k: t0.k, vx: 0, vy: 0, vk: 0 };
  const out: CamState[] = [{ ...s }];
  for (let G = g0 + 1; G <= g1; G++) {
    const t = target(G);
    const ty = t.y + CAM_LIFT / t.k;
    const vx = s.vx + (t.x - s.cx) * CAM_STIFF - s.vx * CAM_DAMP;
    const vy = s.vy + (ty - s.cy) * CAM_STIFF - s.vy * CAM_DAMP;
    const vk = s.vk + (t.k - s.k) * CAM_STIFF - s.vk * CAM_DAMP;
    s = { cx: s.cx + vx, cy: s.cy + vy, k: s.k + vk, vx, vy, vk };
    out.push({ ...s });
  }
  return out;
};

/** A cut's camera at global G: the damped table plus the shared hand sway,
 *  keyed on G so that the sway is continuous across the joins. */
export const camOf = (table: CamState[], g0: number) => (G: number) => {
  const s = table[Math.max(0, Math.min(table.length - 1, Math.round(G) - g0))];
  const d = sway(G);
  return { cx: s.cx + d.dx, cy: s.cy + d.dy, k: s.k };
};

/** Throws if two cameras disagree by more than 0.3 % at the join. */
export const assertJoin = (name: string, a: { cx: number; cy: number; k: number }, b: { cx: number; cy: number; k: number }) => {
  const dk = Math.abs(a.k - b.k) / a.k;
  const dx = (Math.abs(a.cx - b.cx) * a.k) / FRAME_W;
  const dy = (Math.abs(a.cy - b.cy) * a.k) / FRAME_H;
  if (dk > 0.003 || dx > 0.003 || dy > 0.003) {
    throw new Error(`${name}: camera join drifts (dk ${dk}, dx ${dx}, dy ${dy})`);
  }
};

// ---------------------------------------------------------------------------
// DRAWING helpers
// ---------------------------------------------------------------------------
const rrect = (x0: number, y0: number, w: number, h: number, r: number) => {
  const x1 = x0 + w;
  const y1 = y0 + h;
  return (
    `M${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 1 ${x1} ${y0 + r} V${y1 - r} ` +
    `A${r} ${r} 0 0 1 ${x1 - r} ${y1} H${x0 + r} A${r} ${r} 0 0 1 ${x0} ${y1 - r} V${y0 + r} ` +
    `A${r} ${r} 0 0 1 ${x0 + r} ${y0} Z`
  );
};

const WHITE: [number, number, number] = [255, 255, 255];
const rgbOf = (h: string): [number, number, number] => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const DEEP_RGB = rgbOf(ACCENT_DEEP);
const RIPE_RGB = rgbOf(ACCENT);
const mix3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const css = (c: [number, number, number]) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

const Tower: React.FC<{ side: Side; G: number; k: number }> = ({ side, G, k }) => {
  const xo = outerX(side, G);
  const xi = innerX(side, G);
  const x0 = Math.min(xo, xi);
  const cx = chipX(side, G);
  const hot = side < 0 ? heatL(G) : chipR(G);
  const tone = Math.max(idleTone(G, side) * (1 - hot), hot);
  const lit = side < 0 ? pinsL(G) : chipR(G);
  const h = CHIP_S / 2;
  const pinLines: React.ReactNode[] = [];
  let pin = 0;
  const put = (key: string, x1: number, y1: number, x2: number, y2: number) => {
    const c = mix3(mix3(WHITE, DEEP_RGB, pinTick(side, pin, G)), RIPE_RGB, lit);
    pin++;
    pinLines.push(<line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke={css(c)} />);
  };
  for (const o of PIN_OFF) {
    put(`t${o}`, cx + o, CHIP_Y - h, cx + o, CHIP_Y - h - PIN_L);
    put(`b${o}`, cx + o, CHIP_Y + h, cx + o, CHIP_Y + h + PIN_L);
    put(`l${o}`, cx - h, CHIP_Y + o, cx - h - PIN_L, CHIP_Y + o);
    put(`r${o}`, cx + h, CHIP_Y + o, cx + h + PIN_L, CHIP_Y + o);
  }
  const wx0 = Math.min(uX(side, WIN_U0, G), uX(side, WIN_U1, G));
  return (
    <g style={{ filter: iconShadow(k) }}>
      <g fill="none" stroke={INK} strokeWidth={STROKE_W} strokeLinecap="round" strokeLinejoin="round">
        <path d={rrect(x0, TOP_Y, TW, TH, TOWER_R)} />
        {FEET.map(([a, b]) => {
          const xa = uX(side, a, G);
          const xb = uX(side, b, G);
          const d = Math.sign(xb - xa);
          return (
            <path
              key={a}
              d={`M${xa} ${CASE_BOT} L${xa + 6 * d} ${GROUND_Y} L${xb - 6 * d} ${GROUND_Y} L${xb} ${CASE_BOT}`}
            />
          );
        })}
      </g>
      <g fill="none" stroke={INK} strokeWidth={STROKE_W} strokeLinecap="round" opacity={INK_LO}>
        {GRILLE_US.map((u) => (
          <line key={u} x1={uX(side, u, G)} y1={GRILLE_Y0} x2={uX(side, u, G)} y2={GRILLE_Y1} />
        ))}
        <circle cx={uX(side, BUTTON_U, G)} cy={BUTTON_Y} r={BUTTON_R} />
        <path d={rrect(wx0, WIN_Y0, WIN_U1 - WIN_U0, WIN_Y1 - WIN_Y0, WIN_R)} />
      </g>
      <g strokeWidth={STROKE_W} strokeLinecap="round">
        {pinLines}
      </g>
      <path d={rrect(cx - h, CHIP_Y - h, CHIP_S, CHIP_S, CHIP_R)} fill="none" stroke={INK} strokeWidth={STROKE_W} />
      <rect
        x={cx - CORE_S / 2}
        y={CHIP_Y - CORE_S / 2}
        width={CORE_S}
        height={CORE_S}
        rx={6}
        fill={TONE(tone)}
      />
    </g>
  );
};

const Thermometer: React.FC<{ side: Side; G: number; k: number }> = ({ side, G, k }) => {
  const t = thermoIn(side, G);
  if (t <= 0) return null;
  const x = thermoX(side, G);
  const dy = 24 / K_REST * (1 - t);
  const level = side < 0 ? mercuryL(G) : mercuryR(G);
  const rm = MERC_R * smoothstep(level / 0.12);
  const top = lerp(BULB_CY, MERC_TOP, clamp01((level - 0.06) / 0.94));
  const s = THERMO_S;
  return (
    <g transform={`translate(0 ${dy.toFixed(3)})`} opacity={t}>
      {rm > 0.3 ? (
        <g fill={ACCENT}>
          <circle cx={x} cy={BULB_CY} r={rm} />
          {top < BULB_CY - rm * 0.5 ? (
            <rect x={x - MERC_W / 2} y={top} width={MERC_W} height={BULB_CY - top} rx={MERC_W / 2} />
          ) : null}
        </g>
      ) : null}
      <g style={{ filter: iconShadow(k) }}>
        <g transform={`translate(${(x - 12 * s).toFixed(3)} ${THERMO_Y0}) scale(${s})`}>
          <path
            d={THERMO_PATH}
            fill="none"
            stroke={INK}
            strokeWidth={STROKE_W / s}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </g>
  );
};

/** Packets in flight on the cable at G, both ways, in world x. */
export const cablePackets = (G: number) => {
  const xl = innerX(-1, G);
  const xr = innerX(1, G);
  const len = xr - xl;
  const travel = len / PKT_V;
  const out: number[] = [];
  for (let t0 = PKT_FIRST; t0 <= Math.min(PKT_LAST, G); t0 += PKT_PERIOD) {
    const tt = G - t0;
    if (tt >= 0 && tt <= travel) out.push(xl + PKT_V * tt);
    const t1 = t0 + PKT_PERIOD / 2;
    const tt1 = G - t1;
    if (t1 <= PKT_LAST && tt1 >= 0 && tt1 <= travel) out.push(xr - PKT_V * tt1);
  }
  return out;
};

/** The left plug's mating face and the right plug's, world x. */
export const plugFaces = (G: number) => {
  const pu = popU(G);
  const ru = retractU(G);
  // far enough in that the prongs (16 px past the face) are inside the wall too
  const lEnd = innerX(-1, G) - 24;
  const rEnd = innerX(1, G) + PLUG_W + 4;
  const l0 = PAIR_CX - POP_D * pu;
  const r0 = PAIR_CX + POP_D * pu;
  return { l: lerp(l0, lEnd, ru), r: lerp(r0, rEnd, ru) };
};

const Cable: React.FC<{ G: number; k: number }> = ({ G, k }) => {
  if (G >= RETRACT[1]) return null;
  const xl = innerX(-1, G);
  const xr = innerX(1, G);
  const y = CHIP_Y;
  const { l, r } = plugFaces(G);
  const hw = STROKE_W / 2;
  const pk = cablePackets(G).filter((x) => G < POP[0] || x < l - PLUG_W || x > r + PLUG_W);
  const idL = "agCableL";
  const idR = "agCableR";
  return (
    <>
      <defs>
        <clipPath id={idL}>
          <rect x={xl + hw} y={y - 200} width={Math.max(0, PAIR_CX + 200 - xl)} height={400} />
        </clipPath>
        <clipPath id={idR}>
          <rect x={PAIR_CX - 200} y={y - 200} width={Math.max(0, xr - hw - (PAIR_CX - 200))} height={400} />
        </clipPath>
      </defs>
      <g style={{ filter: iconShadow(k) }} stroke={INK} strokeWidth={STROKE_W} fill="none" strokeLinecap="round">
        <g clipPath={`url(#${idL})`}>
          {l - PLUG_W > xl ? <line x1={xl} y1={y} x2={l - PLUG_W} y2={y} /> : null}
          <path d={rrect(l - PLUG_W + hw, y - PLUG_H / 2, PLUG_W - STROKE_W, PLUG_H, 5)} />
          {/* the prongs, only where they are out of the socket */}
          {r - l > 1 ? (
            <g strokeLinecap="butt">
              <line x1={l + hw} y1={y - 8} x2={Math.min(l + 16, r - hw)} y2={y - 8} />
              <line x1={l + hw} y1={y + 8} x2={Math.min(l + 16, r - hw)} y2={y + 8} />
            </g>
          ) : null}
        </g>
        <g clipPath={`url(#${idR})`}>
          {r + PLUG_W < xr ? <line x1={r + PLUG_W} y1={y} x2={xr} y2={y} /> : null}
          <path d={rrect(r + hw, y - PLUG_H / 2, PLUG_W - STROKE_W, PLUG_H, 5)} />
        </g>
      </g>
      <defs>
        <clipPath id="agCableGap">
          <rect x={xl + hw} y={y - 60} width={Math.max(0, xr - xl - 2 * hw)} height={120} />
        </clipPath>
      </defs>
      <g fill={ACCENT} clipPath="url(#agCableGap)">
        {pk.map((x, i) => (
          <circle key={i} cx={x} cy={y} r={PACKET_R} />
        ))}
      </g>
    </>
  );
};

const Bar: React.FC<{ G: number; k: number }> = ({ G, k }) => {
  const a = barIn(G);
  if (a <= 0) return null;
  const y = barY(G);
  const x0 = PAIR_CX - BAR_W / 2;
  const x1 = PAIR_CX + BAR_W / 2;
  const gu = smoothstep((G - GUIDE_RETRACT[0]) / (GUIDE_RETRACT[1] - GUIDE_RETRACT[0]));
  const gTop = y + BAR_CAP + 6;
  const gBot = lerp(GUIDE_BASE_Y, gTop, gu);
  return (
    <g opacity={a}>
      {gBot - gTop > 1 ? (
        <g style={{ filter: iconShadow(k) }} opacity={INK_LO}>
          <line
            x1={PAIR_CX}
            y1={gBot}
            x2={PAIR_CX}
            y2={gTop}
            stroke={INK}
            strokeWidth={THREAD_W}
            strokeDasharray={`${DASH_ON.toFixed(3)} ${DASH_OFF.toFixed(3)}`}
            strokeDashoffset={(-MARCH * G - (GUIDE_BASE_Y - gBot)).toFixed(3)}
          />
        </g>
      ) : null}
      <g style={{ filter: iconShadow(k) }} stroke={INK} strokeWidth={STROKE_W} strokeLinecap="round" opacity={INK_HI}>
        <line x1={x0} y1={y} x2={x1} y2={y} />
        <line x1={x0} y1={y - BAR_CAP} x2={x0} y2={y + BAR_CAP} />
        <line x1={x1} y1={y - BAR_CAP} x2={x1} y2={y + BAR_CAP} />
      </g>
    </g>
  );
};

const Marker: React.FC<{ G: number; k: number }> = ({ G, k }) => {
  const u = smoothstep((G - MARK_IN[0]) / (MARK_IN[1] - MARK_IN[0]));
  if (u <= 0) return null;
  const xl = innerX(-1, G);
  const xr = innerX(1, G);
  const half = ((xr - xl) / 2) * u;
  const op = markOpacity(G);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={op}>
      <g stroke={INK} strokeWidth={STROKE_W} strokeLinecap="round">
        <line x1={xl} y1={MARK_Y - MARK_TICK * u} x2={xl} y2={MARK_Y + MARK_TICK * u} />
        <line x1={xr} y1={MARK_Y - MARK_TICK * u} x2={xr} y2={MARK_Y + MARK_TICK * u} />
      </g>
      <line
        x1={PAIR_CX - half}
        y1={MARK_Y}
        x2={PAIR_CX + half}
        y2={MARK_Y}
        stroke={INK}
        strokeWidth={THREAD_W}
        strokeDasharray={`${DASH_ON.toFixed(3)} ${DASH_OFF.toFixed(3)}`}
        strokeDashoffset={(-MARCH * G + half).toFixed(3)}
      />
    </g>
  );
};

/** The heat shimmer: thin deep-orange strands wavering off the left tower's
 *  inner wall. Drawn on from the bottom, retracted from the bottom, no alpha. */
const Shimmer: React.FC<{ G: number }> = ({ G }) => {
  const xw = innerX(-1, G);
  const strands = SHIMMER.map((s, i) => {
    const span = s.t1 - s.t0;
    const on = smoothstep((G - s.t0) / (span * 0.4));
    const off = smoothstep((G - s.t0 - span * 0.6) / (span * 0.4));
    if (on <= 0 || off >= 1) return null;
    const lift = 0.7 * (G - s.t0);
    const yB = CHIP_Y + s.h / 2 - lift;
    const yT = yB - s.h;
    const drift = 0.35 * (G - s.t0);
    const pts: string[] = [];
    const N = 24;
    for (let j = 0; j <= N; j++) {
      const q = j / N;
      if (q < off || q > on) continue;
      const y = lerp(yB, yT, q);
      const x = xw + s.u + drift + 5 * Math.sin(y / 11 + G * 0.21 + s.ph) * (0.4 + 0.6 * Math.sin(Math.PI * q));
      pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    if (pts.length < 2) return null;
    return (
      <polyline
        key={i}
        points={pts.join(" ")}
        fill="none"
        stroke={ACCENT_DEEP}
        strokeWidth={THREAD_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  });
  return <g>{strands}</g>;
};

/** One heat wavefront: a circle about the left chip, spanning +-ARC_HB
 *  vertically, emerging from the wall and collapsing into the right stem. */
export const arcGeom = (a: ArcBirth, G: number) => {
  const r = arcR(a, G);
  if (r <= DX_WALL + 0.5 || r >= DX_END) return null;
  const emerge = Math.sqrt(Math.max(0, r * r - DX_WALL * DX_WALL));
  const hb = Math.min(ARC_HB, emerge) * (1 - absorbU(a, G));
  if (hb < 0.8) return null;
  const phi = Math.asin(Math.min(1, hb / r));
  const tone = 1 - 0.75 * clamp01((r - DX_WALL) / (DX_END - DX_WALL));
  return { r, phi, hb, tone };
};

const Arcs: React.FC<{ G: number }> = ({ G }) => {
  const cx = chipX(-1, G);
  return (
    <g fill="none" strokeWidth={STROKE_W} strokeLinecap="round">
      {ARCS.map((a, i) => {
        const g = arcGeom(a, G);
        if (!g) return null;
        const x1 = cx + g.r * Math.cos(-g.phi);
        const y1 = CHIP_Y + g.r * Math.sin(-g.phi);
        const x2 = cx + g.r * Math.cos(g.phi);
        const y2 = CHIP_Y + g.r * Math.sin(g.phi);
        return (
          <path
            key={i}
            d={`M${x1.toFixed(2)} ${y1.toFixed(2)} A${g.r.toFixed(2)} ${g.r.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`}
            stroke={TONE(g.tone)}
          />
        );
      })}
    </g>
  );
};

/** The heat cable: the laid bits on the chip axis, and the packets that run
 *  along them into the right tower once the line is there. */
const HeatCable: React.FC<{ G: number }> = ({ G }) => {
  const bits: React.ReactNode[] = [];
  for (let s = 0; s < LAID; s++) {
    const g = bitGrow(s, G);
    if (g <= 0) continue;
    const x = bitX(s);
    if (BITS[s]) {
      const w = Math.max(2 * PACKET_R * g, DASH_W * g);
      bits.push(<rect key={s} x={x} y={CHIP_Y - PACKET_R} width={w} height={2 * PACKET_R} rx={PACKET_R} />);
    } else {
      bits.push(<circle key={s} cx={x + PACKET_R} cy={CHIP_Y} r={PACKET_R * g} />);
    }
  }
  const hw = STROKE_W / 2;
  const xl = innerX(-1, G) + hw;
  const xr = innerX(1, G) - hw;
  return (
    <g fill={ACCENT}>
      {bits}
      <defs>
        <clipPath id="agHeatGap">
          <rect x={xl} y={CHIP_Y - 60} width={Math.max(0, xr - xl)} height={120} />
        </clipPath>
      </defs>
      <g clipPath="url(#agHeatGap)">
        {heatPackets(G).map((x, i) => (
          <circle key={`p${i}`} cx={x} cy={CHIP_Y} r={PACKET_R} />
        ))}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WORLD at G. Draw order: bar + guide, marker, cable, towers, shimmer,
// arcs, thermometers (mercury under their outline), the received row.
// ---------------------------------------------------------------------------
export const AirgapWorld: React.FC<{ G: number; k: number }> = ({ G, k }) => {
  const labelOp = markOpacity(G);
  return (
    <>
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      >
        <Bar G={G} k={k} />
        <Marker G={G} k={k} />
        <Cable G={G} k={k} />
        <Tower side={-1} G={G} k={k} />
        <Tower side={1} G={G} k={k} />
        <Shimmer G={G} />
        <HeatCable G={G} />
        <Arcs G={G} />
        <Thermometer side={-1} G={G} k={k} />
        <Thermometer side={1} G={G} k={k} />
      </svg>
      <Label
        k={k}
        x={PAIR_CX}
        y={MARK_Y - MARK_TICK - 14 - LABEL_SIZE}
        text="AIR GAP"
        f0={LABEL_F0}
        frame={G}
        size={LABEL_SIZE}
        opacity={labelOp}
      />
    </>
  );
};


export const AirgapFrame: React.FC<{
  G: number;
  cam: { cx: number; cy: number; k: number };
  rest: { cx: number; cy: number };
  backgroundSrc: string;
  backgroundBlur: number;
  backgroundDim: number;
  parallax: number;
}> = ({ G, cam, rest, backgroundSrc, backgroundBlur, backgroundDim, parallax }) => {
  const { cx, cy, k } = cam;
  const { tx, ty } = worldTransform(cx, cy, k);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={G}
        cy={cy}
        cyRest={rest.cy}
        cx={cx}
        cxRest={rest.cx}
        k={k}
        parallax={parallax}
      />
      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <AirgapWorld G={G} k={k} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// MEASUREMENT: the world's ink as boxes (world px) at G, for the lowest-ink
// and edge-air assertions each cut runs.
// ---------------------------------------------------------------------------
export const inkBoxes = (G: number) => {
  const b: { name: string; x0: number; y0: number; x1: number; y1: number }[] = [];
  const hw = STROKE_W / 2;
  for (const side of [-1, 1] as Side[]) {
    const xo = outerX(side, G);
    const xi = innerX(side, G);
    b.push({ name: `tower${side}`, x0: Math.min(xo, xi) - hw, y0: TOP_Y - hw, x1: Math.max(xo, xi) + hw, y1: GROUND_Y + hw });
  }
  if (barIn(G) > 0) {
    const y = barY(G);
    b.push({ name: "bar", x0: PAIR_CX - BAR_W / 2 - hw, y0: y - BAR_CAP - hw, x1: PAIR_CX + BAR_W / 2 + hw, y1: y + BAR_CAP + hw });
  }
  if (G >= MARK_IN[0]) {
    b.push({ name: "label", x0: PAIR_CX - 90, y0: MARK_Y - MARK_TICK - 14 - LABEL_SIZE, x1: PAIR_CX + 90, y1: MARK_Y + MARK_TICK + hw });
  }
  return b;
};

// ---------------------------------------------------------------------------
// PROOFS
// ---------------------------------------------------------------------------
(() => {
  // the arc's end is the right stem's near edge at GAP1
  const want = thermoX(1, 400) - STEM_HALF - chipX(-1, 400);
  if (Math.abs(want - DX_END) > 1e-6) {
    throw new Error(`airgapShared: DX_END is ${DX_END}, geometry says ${want}`);
  }
  // nothing in the world outruns the cap at the closest framing (k 1.4)
  const fastest = Math.max(V_ARC, PKT_V);
  if (fastest * 1.4 > 45) throw new Error("airgapShared: arcs or packets exceed 45 screen px/f at k 1.4");
})();
