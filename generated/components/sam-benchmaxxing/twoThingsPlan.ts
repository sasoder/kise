// ---------------------------------------------------------------------------
// twoThingsPlan — the pure plan of cut 9, TwoThingsToCareAbout (sam-benchmaxxing): the two cards' geometry on the
// chart plane (benchShared chart px), their rise and flip curves, and the camera glides. No React, so a planner
// script can import it.
//
// GEOMETRY. Two ThingCards of one width W stand side by side in slots on the apron's ground line (benchShared
// GROUND), centred about x 540 with a gap G. W is chosen so a revealed card read at k ~1.02 is ~826 px wide on screen
// and its label's cap height is >= 64 px (benchShared: cap = 0.718 x 0.112 x W x k).
// Vertical framing (screen px; ground line on screen = 960 + (GROUND - look.y) k):
//   * opening (k ~0.53): the ground line sits just ABOVE the first caption band (y ~1078), so a rising card's amber
//     numeral emerges above y 1080 and never crosses a band; numerals ~190-235 px tall over the push.
//   * reveal holds (k ~1.02-1.05): ground at y ~1290 (between the bands), card top ~y 143, glyph ~y 350-700, label
//     ~y 868-1055: everything readable stays above y 1080.
// CAMERA. One rightward journey (see the camera block below); look x never decreases.
// ---------------------------------------------------------------------------
import { GROUND, thingH } from "./benchShared";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

/** card width (chart px), gap between the cards, the two slot centres (card 1 left, card 2 right) */
export const CARD_W = 810;
export const CARD_H = thingH(CARD_W);
export const CARD_GAP = 40;
export const PITCH = CARD_W + CARD_GAP;
export const C1 = 540 - PITCH / 2;
export const C2 = 540 + PITCH / 2;

/** Beats (frames from the comp start at 24000/1001; the brief's word table). */
export const BEAT = {
  two: 8,
  things: 14,
  we: 23,
  models: 43,
  goodAt: 55,
  one: 66,
  scientific: 73,
  discovery: 88,
  and1: 103,
  cannotDo: 127,
  and2: 144,
  other: 149,
  being: 156,
  nice: 164,
  with: 178,
} as const;

// --- the rise: each card comes up out of its slot, a soft start and a weighty settle (npsColumnsPlan's travel ease)
const travel = (u: number) => {
  const x = clamp01(u);
  const quad = x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
  return 0.55 * ss(x) + 0.45 * quad;
};
/** card 1 starts before f0 (already moving on frame 0), card 2 a few frames behind it ("two ... things") */
export const RISE = [
  { f0: -14, f1: 10 },
  { f0: -13, f1: 11 },
] as const;
export const riseOf = (i: 0 | 1, f: number) => travel((f - RISE[i].f0) / (RISE[i].f1 - RISE[i].f0));

// --- the flips: card 1 on "scientific", card 2 on "being nice" (ThingCard eases flip with smoothstep itself)
export const FLIP = [
  { f0: 70, f1: 86 },
  { f0: 152, f1: 168 },
] as const;
export const flipOf = (i: 0 | 1, f: number) => clamp01((f - FLIP[i].f0) / (FLIP[i].f1 - FLIP[i].f0));

// --- the soft light catching the sealed backs' edges during the push (0..1), gone as each card turns
export const EDGE_LIGHT = { f0: 20, f1: 52 } as const;
export const edgeLightOf = (i: 0 | 1, f: number) => ss((f - EDGE_LIGHT.f0) / (EDGE_LIGHT.f1 - EDGE_LIGHT.f0)) * (1 - ss(flipOf(i, f) / 0.1));

/** the lifted numeral overlay on a sealed back: full while sealed, easing back to the plain numeral over the first
 *  part of the turn (it narrows with the face; ThingCard's turn shade darkens the plain one beneath) */
export const numeralLiftOf = (i: 0 | 1, f: number) => 1 - ss(flipOf(i, f) / 0.4);

// --- the camera (benchShared benchCam = museShared makeClockCam: glides are eased deltas of look x / y and ln k)
/** the ground line's screen y for a look */
export const groundY = (look: { y: number; k: number }) => 960 + (GROUND - look.y) * look.k;
/** the look y that puts the ground line at screen y `gy` under zoom k */
export const lookYFor = (gy: number, k: number) => GROUND - (gy - 960) / k;

// The camera travels RIGHT for the whole cut (the user: "pan to the right where they get revealed"): the sealed pair
// opens off-centre right (card 1's centre right of the frame's middle, the pair spanning x ~490-1060, empty apron
// and sky to the left), a slow drift right and in through the announce, an eased acceleration right and in onto
// card 1 for its turn, a slow creep right on the hold, the pan right to card 2, a slow creep right to the cut.
// End: card 2 centred (~x 540); card 1 shows at the left edge only as a plain strip (< its 0.165 w label margin).
const K0 = 0.4;
const K1 = 0.5;
const K2 = 0.525;
const K3 = 1.02;
const K4 = 1.035;
const K5 = 0.995;
const K6 = 1.005;
/** targets (before the damped follower): look x and the ground line's screen y at each key; x only ever grows */
const X0 = C1 - 92; // card 1's centre right of the middle (x ~576), card 2 a touch past the right edge
const X1 = C1 - 70;
const X2 = C1 - 46; // the announce drift
const X3 = C1 + 6; // on card 1
const X4 = C1 + 46; // the hold's creep right
const X5 = C2 + 4 / K5; // on card 2, centred
const X6 = X5 + 14; // the end creep: card 2 settles at ~x 522
const G0 = 1072;
const G1 = 1074;
const G2 = 1092;
const G3 = 1290;
const G4 = 1292;
const G5 = 1296;
const G6 = 1300;
const Y = (g: number, k: number) => lookYFor(g, k);

export const CAM_START = { x: X0, y: Y(G0, K0), k: K0 } as const;
export const CAM_GLIDES = [
  { f0: -30, f1: 30, dx: X1 - X0, dy: Y(G1, K1) - Y(G0, K0), k: K1 },
  { f0: 14, f1: 68, dx: X2 - X1, dy: Y(G2, K2) - Y(G1, K1), k: K2 },
  { f0: 52, f1: 86, dx: X3 - X2, dy: Y(G3, K3) - Y(G2, K2), k: K3 },
  { f0: 84, f1: 134, dx: X4 - X3, dy: Y(G4, K4) - Y(G3, K3), k: K4 },
  { f0: 118, f1: 156, dx: X5 - X4, dy: Y(G5, K5) - Y(G4, K4), k: K5 },
  { f0: 156, f1: 230, dx: X6 - X5, dy: Y(G6, K6) - Y(G5, K5), k: K6 },
] as const;
