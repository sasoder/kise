// InterventionV2: the timeline, the camera and the ring on the world pair's
// global clock (G 0 = 10.599 s; the word table W is worldCamera's, read-only).
// Pure maths, no React, so the check scripts read the exact camera and timings
// the component draws. See InterventionV2.tsx's header for the gestures.
import { ARCS, LIT_BOUNDS, PLACES } from "./worldMapData";
import { W, clamp01, pchip, ramp } from "./worldCamera";

export { W };
export const FPS = 24;
// 10.599 s -> 25.480 s: round(14.881 x 24) = 357, + the 16-frame house tail.
export const DURATION = 373;
export const G_LAST = DURATION - 1;

// ---------------------------------------------------------------------------
// THE TIMELINE (global frames == local frames)
// ---------------------------------------------------------------------------
export const T = {
  armiesOut: [52, 84] as const, // the armies fade as Korea gets small (k ~9 -> ~3)
  usLabel: 80, // UNITED STATES slides up, landed on "united" 88 -> ~94
  usSpread: [84, 102] as const, // the USA lights, a wash spreading from its west coast
  wave: [107, 126] as const, // the 15 partners start lighting, ordered by distance from Korea
  waveSpread: 14, // each partner's wash spreads over 14 f (the last is full by f140)
  usLabelOut: [138, 152] as const, // the only words after this are the ring's
  rungDrop: [140, 164] as const, // the partners dim to the low rung on the way in
  ringDraw: [152, 175] as const, // the 6 deg ring draws round the peninsula, closing ~"civil" 177
  civil: W.civil - 8, // CIVIL slides up
  ringPower: [188, 200] as const, // "becomes": the ring starts to carry the war outward
  regional: W.regional - 8, // REGIONAL slides up as CIVIL goes
  dashed: [W.potential - 4, W.potential + 6] as const, // the ring turns dashed on "potential"
  global: W.global - 8, // GLOBAL slides up as REGIONAL goes
};

/** the ring's radius (deg): 6 -> 28 on "becomes" -> ~75 on "global" -> 92 -> breathing out to 104 */
const RING_R = pchip([
  [188, 6],
  [212, 28],
  [226, 28.6],
  [254, 75],
  [268, 92],
  [G_LAST, 104],
]);
export const ringR = (g: number) => (g < 188 ? 6 : RING_R(g));

// the partners' calm wave: lighting frame from their distance to Korea
const PARTNERS = Object.keys(ARCS).filter((g) => g !== "USA");
const dMin = Math.min(...PARTNERS.map((g) => ARCS[g].distDeg));
const dMax = Math.max(...PARTNERS.map((g) => ARCS[g].distDeg));
export const LIGHT_AT: Record<string, number> = {
  USA: T.usSpread[0],
  ...Object.fromEntries(PARTNERS.map((g) => [g, T.wave[0] + ((T.wave[1] - T.wave[0]) * (ARCS[g].distDeg - dMin)) / (dMax - dMin)])),
};
export const spreadFrames = (g: string) => (g === "USA" ? T.usSpread[1] - T.usSpread[0] : T.waveSpread);

// ---------------------------------------------------------------------------
// THE CAMERA: three channels (ln k, and the SCREEN position sx, sy of the
// middle of the peninsula, the anchor), each the sum of a few eased MOVES.
// A move is the integral of a trapezoid velocity with smoothstep shoulders
// (so every channel is C1 and each move reads as one gesture); consecutive
// moves overlap by a few frames, so the camera never stops dead. World point
// X is drawn at  (sx, sy) + k (X - anchor).
// ---------------------------------------------------------------------------
export const ANCHOR = { x: PLACES.koreaMid[0], y: PLACES.koreaMid[1] };
const WIDE_MARGIN = 44;
const LIT_X0 = Math.min(...Object.values(LIT_BOUNDS).map((b) => b[0]));
const LIT_X1 = Math.max(...Object.values(LIT_BOUNDS).map((b) => b[2]));
export const K_WIDE = (1080 - 2 * WIDE_MARGIN) / (LIT_X1 - LIT_X0); // 1.297: every lit polity inside, 44 px margins
const CX_WIDE = (LIT_X0 + LIT_X1) / 2;
const wideS = (k: number) => [540 + k * (ANCHOR.x - CX_WIDE), 835 + k * (ANCHOR.y - 835)] as const;

type Move = { a: number; b: number; d: number; sh?: number }; // frames a..b, total change d, shoulder fraction
/** the eased progress 0..1 of a trapezoid-velocity move (smoothstep shoulders, C1) */
const moveU = (g: number, a: number, b: number, sh: number) => {
  const L = b - a;
  const r = Math.max(1e-6, sh * L); // shoulder length
  const x = Math.max(0, Math.min(L, g - a));
  // velocity: smoothstep up over [0, r], 1 in the middle, smoothstep down over [L - r, L]
  // integral of smoothstep over [0, t] (t in [0,1]): t^3 - t^4 / 2
  const S = (t: number) => t * t * t - (t * t * t * t) / 2;
  const total = L - r; // area under the trapezoid
  let area: number;
  if (x <= r) area = r * S(x / r);
  else if (x <= L - r) area = r * 0.5 + (x - r);
  else area = r * 0.5 + (L - 2 * r) + (r * 0.5 - r * S((L - x) / r));
  return clamp01(area / total);
};
const channel = (v0: number, moves: Move[]) => (g: number) => moves.reduce((v, m) => v + m.d * moveU(g, m.a, m.b, m.sh ?? 0.3), v0);

const K0 = 22; // the Korea close, as V1 (and cut 1's end frame)
const K_US = 2.3; // the pull-back's first leg: Korea small at the left, the USA in frame for "united"
const K_REG = 4.6; // the push-in: the 6 deg ring round the peninsula
const K_REG2 = 3.8; // ... eased out a little as the ring grows to 28 deg
const K_END = 1.95; // the closing push toward Korea
const [WX, WY] = wideS(K_WIDE);
const [WX2, WY2] = wideS(K_WIDE * 1.015);
const L = Math.log;

const LNK = channel(L(K0), [
  { a: -14, b: 40, d: L(1.03), sh: 0.45 }, // 1. the held breath: a 3 % creep in, already moving on f0
  { a: 16, b: 96, d: L(K_US / (K0 * 1.03)), sh: 0.25 }, // 2a. the long pull-back ...
  { a: 82, b: 128, d: L(K_WIDE / K_US), sh: 0.42 }, // 2b. ... flowing on out to the world wide
  { a: 118, b: 146, d: L(1.015), sh: 0.5 }, // creep on the wide
  { a: 132, b: 180, d: L(K_REG / (K_WIDE * 1.015)), sh: 0.34 }, // 3a. ONE push-in to Asia-Pacific
  { a: 174, b: 192, d: L(1.02), sh: 0.5 }, // creep on the ring
  { a: 186, b: 216, d: L(K_REG2 / (K_REG * 1.02)), sh: 0.45 }, // 3b. eased out a little with the ring
  { a: 208, b: 224, d: L(0.985), sh: 0.5 }, // creep, gathering into
  { a: 216, b: 250, d: L(K_WIDE / (K_REG2 * 0.985)), sh: 0.34 }, // 4. ONE pull-back to the world wide
  { a: 244, b: 270, d: L(1.012), sh: 0.5 }, // creep on the wide
  { a: 262, b: 420, d: L(K_END / (K_WIDE * 1.012)), sh: 0.4 }, // 5. the slow push toward Korea (still moving at f372)
]);
const SX = channel(540, [
  { a: 12, b: 96, d: 150 - 540, sh: 0.5 },
  { a: 82, b: 128, d: WX - 150, sh: 0.42 },
  { a: 118, b: 146, d: WX2 - WX, sh: 0.5 },
  { a: 132, b: 180, d: 540 - WX2, sh: 0.4 },
  { a: 216, b: 250, d: WX - 540, sh: 0.4 },
  { a: 244, b: 270, d: WX2 - WX, sh: 0.5 },
  { a: 262, b: 420, d: 530 - WX2, sh: 0.4 },
]);
const SY = channel(835, [
  { a: 20, b: 96, d: 829 - 835, sh: 0.4 },
  { a: 82, b: 128, d: WY - 829, sh: 0.42 },
  { a: 118, b: 146, d: WY2 - WY, sh: 0.5 },
  { a: 132, b: 180, d: 810 - WY2, sh: 0.4 },
  { a: 186, b: 216, d: 752 - 810, sh: 0.45 },
  { a: 216, b: 250, d: WY - 752, sh: 0.4 },
  { a: 244, b: 270, d: WY2 - WY, sh: 0.5 },
  { a: 262, b: 420, d: 700 - WY2, sh: 0.4 },
]);

/** the camera at global frame g: zoom k, the anchor's screen position, and the world point at screen (540, 960) */
export const camAt = (g: number) => {
  const k = Math.exp(LNK(g));
  const sx = SX(g);
  const sy = SY(g);
  return { k, sx, sy, cx: ANCHOR.x + (540 - sx) / k, cy: ANCHOR.y + (960 - sy) / k };
};
export const CAM_TRACK = Array.from({ length: G_LAST + 1 }, (_, g) => camAt(g));
export { ramp };
