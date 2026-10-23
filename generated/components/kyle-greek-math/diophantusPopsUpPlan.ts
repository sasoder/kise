// ---------------------------------------------------------------------------
// diophantusPopsUpPlan — the camera, the rises and the Romans' walk of cut A (DiophantusPopsUp, kyle-greek-math).
// Pure numbers (no React): the cut and the audit scripts both read it. The world is greekStairWorld (read only).
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip } from "../kits/maps/incaShared";
import { COLUMNS, U, type StairCam } from "./greekStairWorld";

export const FPS = 30000 / 1001;
/** the slot 4.738 -> 10.944 s: sequence frames 142 -> 328 at 29.97 */
export const DURATION = 186;

/** the stair camera plus a horizontal lens shift `sh` (screen px, + moves the picture right): the world's camera has
 *  no yaw, so the shift frames Diophantus as the flight curves toward him (the vertical shift is the world's hy) */
export type ACam = StairCam & { sh: number };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---- the camera keys (metres; F and hy and sh in px) ---------------------------------------------------------------
type Key = [number, number];
export const KEYS: Record<"X" | "E" | "Zc" | "F" | "hy" | "look", Key[]> = {
  X: [
    [0, 1.95],
    [30, 3.15],
    [55, 4.3],
    [80, 5.7],
    [100, 7.8],
    [135, 15.2],
    [165, 19.1],
    [185, 19.55],
  ],
  E: [
    [0, 11.7],
    [22, 11.42],
    [60, 10.68],
    [110, 10.6],
    [185, 10.6],
  ],
  Zc: [
    [0, 2.0],
    [26, 5.2],
    [50, 9.8],
    [70, 18.0],
    [88, 28],
    [100, 33.5],
    [130, 44.5],
    [165, 53.0],
    [185, 53.55],
  ],
  F: [
    [0, 1000],
    [50, 1100],
    [90, 1640],
    [130, 2160],
    [160, 2440],
    [185, 2500],
  ],
  hy: [
    [0, 770],
    [45, 758],
    [160, 384],
    [185, 374],
  ],
  /** how much the lens shift frames Diophantus (0 = no shift, 1 = his column at LOOK_X) */
  look: [
    [0, 0],
    [45, 0],
    [92, 1],
    [185, 1],
  ],
};
/** where the look puts Diophantus's column (screen x) */
export const LOOK_X = 540;
/** before the look takes him: the frame leans left by this look angle (tan; ~23 deg), over Euclid's right shoulder
 *  toward the first column (a constant angle, so the lean holds while the lens tightens) */
export const LOOK_BIAS_TAN = 0.47;
const DIO = COLUMNS[3];

/** the keyed target (pchip per channel; F in log space) */
const CH = {
  X: pchip(KEYS.X),
  E: pchip(KEYS.E),
  Zc: pchip(KEYS.Zc),
  lnF: pchip(KEYS.F.map(([f, v]) => [f, Math.log(v)] as Key)),
  hy: pchip(KEYS.hy),
  look: pchip(KEYS.look),
};
/** the shift that puts Diophantus's column at LOOK_X (a fixed world point: it never bobs) */
const lookShift = (X: number, Zc: number, F: number) => LOOK_X - 540 - (F * (DIO.X / U - X)) / (DIO.Z / U - Zc);
const target = (f: number) => {
  const X = CH.X(f);
  const Zc = CH.Zc(f);
  const lnF = CH.lnF(f);
  const w = c01(CH.look(f));
  return [X, CH.E(f), Zc, lnF, CH.hy(f), (1 - w) * LOOK_BIAS_TAN * Math.exp(lnF) + w * lookShift(X, Zc, Math.exp(lnF))];
};

/** the base camera (V1, approved at f0-14 and f110-185) through the kit's damped follow (cameraC's pattern: CAM_STIFF
 *  / CAM_DAMP, LEAD 5, pre-rolled so it is already gliding at f0) */
const PATH: ACam[] = (() => {
  const PRE = 60;
  const LEAD = 5;
  const END = DURATION + 40;
  let s = target(-PRE + LEAD);
  let v = s.map(() => 0);
  const out: ACam[] = [];
  for (let f = -PRE + 1; f <= END; f++) {
    const tg = target(Math.min(f + LEAD, END));
    v = v.map((vi, i) => vi + (tg[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) {
      const [X, E, Zc, lnF, hy, sh] = s;
      out.push({ X: X * U, E: E * U, Zc: Zc * U, F: Math.exp(lnF), hy, sh });
    }
  }
  return out;
})();
const baseA = (f: number): ACam => {
  const i = Math.max(0, Math.min(PATH.length - 2, Math.floor(f)));
  const a = PATH[i];
  const b = PATH[i + 1];
  const t = c01(f - i);
  return { X: lerp(a.X, b.X, t), E: lerp(a.E, b.E, t), Zc: lerp(a.Zc, b.Zc, t), F: Math.exp(lerp(Math.log(a.F), Math.log(b.F), t)), hy: lerp(a.hy, b.hy, t), sh: lerp(a.sh, b.sh, t) };
};
/** V2 (director's review): the middle reshaped by smooth offsets on the base camera, exactly zero (with zero slope)
 *  before f14 and after f110, so the approved opening and ending are untouched. E: the eye rises up and forward over
 *  Euclid (he sinks out through the bottom edge, the landing drops away under the frame) and comes back down to the
 *  base by f110. tan: the look (tan of its angle, + right) turns right earlier and more evenly than the base, so the
 *  left column holds the frame while it rises. Metres, px, tan. */
export const OFFSETS: Record<"X" | "E" | "Zc" | "lnF" | "hy" | "tan", Key[]> = {
  X: [
    [14, 0],
    [22, -0.1],
    [30, -0.35],
    [50, -0.45],
    [80, -0.24],
    [110, 0],
  ],
  E: [
    [14, 0],
    [30, 2.2],
    [62, 1.1],
    [90, 0.25],
    [110, 0],
  ],
  Zc: [
    [14, 0],
    [24, 0.35],
    [36, 1.0],
    [50, 1.45],
    [70, 1.5],
    [90, 0.75],
    [110, 0],
  ],
  lnF: [
    [14, 0],
    [110, 0],
  ],
  hy: [
    [14, 0],
    [110, 0],
  ],
  tan: [
    [14, 0],
    [110, 0],
  ],
};
/** V2 look: one smooth turn (a single lobe) from the base's lean at f14 (tan -0.47, ~25 deg left) to its look on
 *  Diophantus at f100 (LOOK_T1, ~19 deg right), fastest ~f57 while the first column slides out; from f100 on, the
 *  base's own slow relaxation. Blended in and out through the same window as the offsets. */
export const LOOK_T = { f0: 14, t0: -0.47, f1: 100 };
const OFF = Object.fromEntries(Object.entries(OFFSETS).map(([k, keys]) => [k, pchip(keys, true)])) as Record<keyof typeof OFFSETS, (f: number) => number>;
/** the offsets fade in over f14-24 and out over f100-110 through a smootherstep window (zero velocity and zero
 *  acceleration at both joins: the new middle eases out of the approved opening and into the approved ending) */
const smoother = (t: number) => {
  const u = c01(t);
  return u * u * u * (u * (6 * u - 15) + 10);
};
export const OFF_JOIN = { f0: 14, f1: 110, w: 6 };
const win = (f: number) => smoother((f - OFF_JOIN.f0) / OFF_JOIN.w) * smoother((OFF_JOIN.f1 - f) / OFF_JOIN.w);
const off = (k: keyof typeof OFFSETS, f: number) => (f <= OFF_JOIN.f0 || f >= OFF_JOIN.f1 ? 0 : OFF[k](f) * win(f));
const LOOK_T1 = -baseA(LOOK_T.f1).sh / baseA(LOOK_T.f1).F;
const smoothT = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
export const cameraA = (f: number): ACam => {
  const b = baseA(f);
  // outside the reshaped middle: the V1 camera itself, bit for bit
  if (f <= OFF_JOIN.f0 || f >= OFF_JOIN.f1) return b;
  const F = Math.exp(Math.log(b.F) + off("lnF", f));
  const tanB = -b.sh / b.F;
  const target = f < LOOK_T.f1 ? LOOK_T.t0 + (LOOK_T1 - LOOK_T.t0) * smoothT((f - LOOK_T.f0) / (LOOK_T.f1 - LOOK_T.f0)) : tanB;
  const w = f <= OFF_JOIN.f0 || f >= OFF_JOIN.f1 ? 0 : win(f);
  const tan = tanB + (target - tanB) * w + off("tan", f);
  return { X: b.X + off("X", f) * U, E: b.E + off("E", f) * U, Zc: b.Zc + off("Zc", f) * U, F, hy: b.hy + off("hy", f), sh: -F * tan };
};
export const REST_A = cameraA(0);

/** project a world point (X, H, Z; units) to screen px with the shift (no sway) */
export const screenA = (c: ACam, X: number, H: number, Z: number): [number, number] => {
  const D = Z - c.Zc;
  return [540 + c.sh + (c.F * (X - c.X)) / D, c.hy - (c.F * (H - c.E)) / D];
};

// ---- the rises ------------------------------------------------------------------------------------------------------
/** a column surfaces from the dense low air, rises and settles softly. The world draws a scholar only once his feet
 *  are within ~1.3 m of the low air's floor (figVeil), which a column passes at rise ~0.10-0.23: the profile goes
 *  through that window slowly (he surfaces over ~9 frames instead of popping in), then rises, then settles with a
 *  long soft deceleration (the world clamps rise at 1, so the settle approaches from below: no overshoot). */
const RISE_SHAPE = pchip(
  [
    [0, 0],
    [0.4, 0.26],
    [0.62, 0.76],
    [0.84, 0.97],
    [1, 1],
  ],
  true,
);
const springUp = (f: number, f0: number, dur: number) => c01(RISE_SHAPE(c01((f - f0) / dur)));
/** COLUMNS order: archimedes, apollonius, ptolemy, diophantus */
export const RISE = {
  archimedes: { f0: -1, dur: 1 },
  ptolemy: { f0: -1, dur: 1 },
  apollonius: { f0: -1, dur: 1 },
  diophantus: { f0: 70, dur: 42 },
};
/** V1's rise of the world's Archimedes (from f4): kept up to f14 (still deep in the low air, unseen) so the approved
 *  opening renders exactly as V1, then held there through the middle */
const V1_ARCHIMEDES = { f0: 4, dur: 40 };
/** V2: the world's Archimedes, Apollonius and Ptolemy stay sunk through the new middle (the cut draws its own two lone
 *  columns there); from f110 on they stand as in V1 (all behind the eye or far off-screen in the approved ending, but
 *  standing keeps V1's page, so f110-185 render pixel for pixel as approved) */
export const WORLD_COLS_STAND_FROM = 110;
export const riseA = (f: number): number[] =>
  COLUMNS.map((c) => {
    const r = RISE[c.id as keyof typeof RISE];
    if (r.f0 < 0) {
      if (f >= WORLD_COLS_STAND_FROM) return 1;
      return c.id === "archimedes" ? springUp(Math.min(f, OFF_JOIN.f0), V1_ARCHIMEDES.f0, V1_ARCHIMEDES.dur) : 0;
    }
    return springUp(f, r.f0, r.dur);
  });

// ---- the Romans at the column's foot: a dominus in his toga and a freeman in his tunic strolling left along the
// terrace (RomeFolk's walk: the feet stay planted when X advances walkAdvance(1) units a frame) ----------------------
export const WALKERS = [
  { id: "roman0", kind: "dominus" as const, variant: 0, endX: 23.0, Z: 78.6, phase0: 0.15 },
  { id: "roman1", kind: "freeman" as const, variant: 0, endX: 24.35, Z: 79.4, phase0: 0.62 },
];

// ---- V2: the cut's own lone columns (the world's Archimedes / Apollonius / Ptolemy stay sunk in A) ------------------
/** two lone columns placed for this flight, drawn exactly like the world's (same shaft, capital, scholar and work):
 *  the first on the left (Archimedes, the sphere in the cylinder) settles by "interesting" (~f52), the second on the
 *  right (Apollonius, the cone and its section) by "pop up" (~f82); each slides out of the frame as the glide turns
 *  toward Diophantus. X, Z, top in metres (top = the capital's top = the scholar's feet), R the shaft radius. */
export type LoneCol = { id: string; X: number; Z: number; top: number; R: number; work: "sphereCylinder" | "cone"; variant: number; dir: 1 | -1; rise: { f0: number; dur: number } };
export const LONE: LoneCol[] = [
  { id: "a-archimedes", X: 0.0, Z: 21.0, top: 9.0, R: 0.5, work: "sphereCylinder", variant: 5, dir: 1, rise: { f0: 8, dur: 40 } },
  { id: "a-apollonius", X: 13.0, Z: 41.0, top: 9.0, R: 0.48, work: "cone", variant: 6, dir: -1, rise: { f0: 44, dur: 38 } },
];
export const loneRise = (c: LoneCol, f: number) => springUp(f, c.rise.f0, c.rise.dur);
/** a lone column's drop at rise 0..1 (the world's riseOffset: at 0 his head is ~1 m under the low air's floor) */
export const loneDrop = (c: LoneCol, rise: number) => (1 - c01(rise)) * (c.top + 3.0) * U;
