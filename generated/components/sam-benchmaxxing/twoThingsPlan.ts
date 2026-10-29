// ---------------------------------------------------------------------------
// twoThingsPlan — the pure plan of cut 9, TwoThingsToCareAbout (sam-benchmaxxing), REV 1 (user notes 2026-10-29,
// notes/REV1_9_TwoThings.md): the two cards' geometry on the chart plane (benchShared chart px), their pop, flips,
// the 3D objects' pops and the camera glides. No React, so a planner script can import it.
//
// GEOMETRY. Two cards of one width W stand side by side in slots on the apron's ground line (benchShared GROUND),
// centred about x 540 with a gap G. W is chosen so a revealed card read at k ~1.0 is ~810-826 px wide on screen and its
// label's cap height is >= 64 px (cap = 0.718 x 0.112 x W x k). Each revealed front carries a slot across its face
// (twoThingsCard OBJ_SLOT_Y x h from the card top) above the two-line label; the card's 3D object rises out of it.
// Vertical framing (screen px; ground line on screen = 960 + (GROUND - look.y) k):
//   * the centred pair (k ~0.55-0.64): ground just ABOVE the first caption band (y ~1076), so a popping card's amber
//     numeral is never in a band;
//   * the reveal holds (k ~1.0): ground at y ~1290-1296, card top ~y 145, object ~y 375-815, label ~y 868-1060.
// ---------------------------------------------------------------------------
import { GROUND, thingH } from "./benchShared";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** an ease-out with a little overshoot past 1 that settles back (the "pop"); s = overshoot strength */
export const popEase = (u: number, s = 1.2) => {
  const x = clamp01(u) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};

/** card width (chart px), gap between the cards, the two slot centres (card 1 left, card 2 right) */
export const CARD_W = 810;
export const CARD_H = thingH(CARD_W);
export const CARD_GAP = 40;
export const PITCH = CARD_W + CARD_GAP;
export const C1 = 540 - PITCH / 2;
export const C2 = 540 + PITCH / 2;

/** the 3D objects, in chart px at k 1 (they scale with the camera): the flask's height, the smiley's diameter and its
 *  hover above the slot once out */
export const FLASK_H = 432;
export const SMILEY_D = 392;
export const SMILEY_HOVER = 22;

/** Beats (frames from the comp start at 24000/1001; the brief's word table). */
export const BEAT = {
  two: 8,
  things: 14,
  we: 23,
  goodAt: 55,
  one: 66,
  is: 70,
  scientific: 73,
  discovery: 88,
  cannotDo: 127,
  and2: 144,
  other: 149,
  being: 156,
  nice: 164,
  work: 175,
  with: 178,
} as const;

// --- the slots part, then each card POPS up out of its slot on "two things" (card 2 three frames behind card 1)
export const SLOT_OPEN = [
  { f0: 0, f1: 4 },
  { f0: 1, f1: 7 },
] as const;
export const slotOpenOf = (i: 0 | 1, f: number) => ss((f - SLOT_OPEN[i].f0) / (SLOT_OPEN[i].f1 - SLOT_OPEN[i].f0));
export const RISE = [
  { f0: 2, f1: 20 },
  { f0: 5, f1: 23 },
] as const;
/** 0 = hidden in the slot, 1 = standing; overshoots ~4% (the card hops a little clear of its slot and drops back) */
/** u^1.45 under the pop: a visible start from f0 (card 1 moving from f2), about half up 6 f later ("two"), then the pop */
export const riseOf = (i: 0 | 1, f: number) => (f <= RISE[i].f0 ? 0 : popEase(Math.pow(Math.min(1, (f - RISE[i].f0) / (RISE[i].f1 - RISE[i].f0)), 1.45), 1.0));

// --- the flips: card 1 on "scientific", card 2 on "being nice" (the card copy eases flip with smoothstep itself)
export const FLIP = [
  { f0: 70, f1: 81 },
  { f0: 152, f1: 162 },
] as const;
export const flipOf = (i: 0 | 1, f: number) => clamp01((f - FLIP[i].f0) / (FLIP[i].f1 - FLIP[i].f0));

// --- the 3D objects rise out of the front's slot once the front faces us, with a pop (overshoot) and a settle
export const OBJ_POP = [
  { f0: 80, f1: 92 },
  { f0: 161, f1: 173 },
] as const;
/** 0 = below the slot (hidden), 1 = out and resting; overshoots past 1 and settles */
export const objPopOf = (i: 0 | 1, f: number) => (f <= OBJ_POP[i].f0 ? 0 : popEase((f - OBJ_POP[i].f0) / (OBJ_POP[i].f1 - OBJ_POP[i].f0), 1.4));
/** the smiley's wink around "work with": the left eye closes and opens (0 open .. 1 shut) */
export const WINK = { f0: 173, f1: 182 } as const;
export const winkOf = (f: number) => {
  const u = clamp01((f - WINK.f0) / (WINK.f1 - WINK.f0));
  return Math.sin(Math.PI * u) ** 2;
};

// --- the soft light catching the sealed backs' edges during the hold (0..1), gone as each card turns
export const EDGE_LIGHT = { f0: 22, f1: 52 } as const;
export const edgeLightOf = (i: 0 | 1, f: number) => ss((f - EDGE_LIGHT.f0) / (EDGE_LIGHT.f1 - EDGE_LIGHT.f0)) * (1 - ss(flipOf(i, f) / 0.1));

// --- the camera (benchShared benchCam = museShared makeClockCam: glides are eased deltas of look x / y and ln k)
/** the ground line's screen y for a look */
export const groundY = (look: { y: number; k: number }) => 960 + (GROUND - look.y) * look.k;
/** the look y that puts the ground line at screen y `gy` under zoom k */
export const lookYFor = (gy: number, k: number) => GROUND - (gy - 960) / k;

// The pair centred (look x 540) through the announce with a slow push; the zoom into card 1 on "One is"; a slow creep
// right on its hold; the pan right to card 2 on "And the other" (centred, card 1's edge only as a plain strip left);
// a slow creep to the cut.
const K0 = 0.55;
const K1 = 0.585;
const K2 = 0.64;
const K3 = 1.02;
const K4 = 1.03;
const K5 = 0.998;
const K6 = 1.006;
const X0 = 540;
const X3 = C1; // centred on card 1
const X4 = C1 + 30; // the hold's creep right
const X5 = C2 + 4; // centred on card 2
const X6 = X5 + 10; // the end creep
const G0 = 1074;
const G1 = 1076;
const G2 = 1078;
const G3 = 1290;
const G4 = 1292;
const G5 = 1296;
const G6 = 1300;
const Y = (g: number, k: number) => lookYFor(g, k);

export const CAM_START = { x: X0, y: Y(G0, K0), k: K0 } as const;
export const CAM_GLIDES = [
  { f0: -30, f1: 24, dx: 0, dy: Y(G1, K1) - Y(G0, K0), k: K1 },
  { f0: 18, f1: 66, dx: 0, dy: Y(G2, K2) - Y(G1, K1), k: K2 },
  { f0: 60, f1: 82, dx: X3 - X0, dy: Y(G3, K3) - Y(G2, K2), k: K3 },
  { f0: 80, f1: 138, dx: X4 - X3, dy: Y(G4, K4) - Y(G3, K3), k: K4 },
  { f0: 136, f1: 160, dx: X5 - X4, dy: Y(G5, K5) - Y(G4, K4), k: K5 },
  { f0: 158, f1: 230, dx: X6 - X5, dy: Y(G6, K6) - Y(G5, K5), k: K6 },
] as const;
