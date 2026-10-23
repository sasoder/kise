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
/** V2's camera (delivered 00ea220): the V1 base with the V2 middle offsets; kept for the V3 end and the comparison */
export const cameraV2 = (f: number): ACam => {
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
export const REST_A = cameraV2(0);

// ---- V3 (Revision 1: "rushed; the pillars are too far from each other") -------------------------------------------
const smooth5 = (t: number) => {
  const u = c01(t);
  return u * u * u * (u * (6 * u - 15) + 10);
};
/** the turn's profile: zero rate at both ends, a flatter middle than smooth5 (peak rate ~1.65 x mean, not 1.875) */
const V3_TURN = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u) * 0.6 + u * u * u * (u * (6 * u - 15) + 10) * 0.4;
};
/** the glide (plan): straight down the avenue on a heading of `avenue` degrees (nearly along the world's depth, so
 *  the avenue opens symmetrically: the world camera has no yaw, only a lens shift) until l0, then a soft bend right
 *  over l0..l1 onto a heading solved so the glide ends exactly on V2's end eye, and from e0 a soft ease onto V2's
 *  approach heading. The late heading `mid` and the cruise are solved together. Speed (frames): a gentle ease out of
 *  f0 (V1's own f0 speed) over easeIn, one near-constant calm cruise, a soft ease from easeOut0 into V2's end creep;
 *  the camera blends into V2's end over join0..f185. */
export const V3_SPEED = { easeIn: 34, easeOut0: 140, join0: 168 };
export const V3_HEAD = { avenue: 15, l0: 90, l1: 130, e0: 134 };
const V3_END = cameraV2(DURATION - 1);
const V3_PRE = cameraV2(DURATION - 2);
const V3_V0 = Math.hypot(cameraV2(1).X - cameraV2(0).X, cameraV2(1).Zc - cameraV2(0).Zc) / U;
const V3_VE = Math.hypot(V3_END.X - V3_PRE.X, V3_END.Zc - V3_PRE.Zc) / U;
const V3_LEAN = Math.atan(-cameraV2(0).sh / cameraV2(0).F);
const V3_HEND = Math.atan2(V3_END.X - cameraV2(DURATION - 12).X, V3_END.Zc - cameraV2(DURATION - 12).Zc);
const v3Speed = (f: number, vc: number) => {
  const a = smooth5(f / V3_SPEED.easeIn);
  const b = smooth5((f - V3_SPEED.easeOut0) / (DURATION - 1 - V3_SPEED.easeOut0));
  return (V3_V0 + (vc - V3_V0) * a) * (1 - b) + V3_VE * b;
};
const V3_AVE = (V3_HEAD.avenue * Math.PI) / 180;
const v3Heading = (f: number, mid: number) =>
  V3_AVE + (mid - V3_AVE) * smooth5((f - V3_HEAD.l0) / (V3_HEAD.l1 - V3_HEAD.l0)) + (V3_HEND - mid) * smooth5((f - V3_HEAD.e0) / (DURATION - 1 - V3_HEAD.e0));
/** integrate the glide frame by frame (8 substeps) from V1's f0 eye: per frame X, Z, arc s (metres) and heading */
const v3Integrate = (mid: number, vc: number) => {
  const X = [cameraV2(0).X / U];
  const Z = [cameraV2(0).Zc / U];
  const S = [0];
  const SUB = 8;
  for (let f = 1; f < DURATION; f++) {
    let x = X[f - 1];
    let z = Z[f - 1];
    let s = S[f - 1];
    for (let k = 0; k < SUB; k++) {
      const t = f - 1 + (k + 0.5) / SUB;
      const v = v3Speed(t, vc) / SUB;
      const h = v3Heading(t, mid);
      x += v * Math.sin(h);
      z += v * Math.cos(h);
      s += v;
    }
    X.push(x);
    Z.push(z);
    S.push(s);
  }
  return { X, Z, S };
};
/** solve (mid heading, cruise) so the glide's last frame is V2's end eye (2-D Newton, finite differences) */
const V3_SOL = (() => {
  const tx = V3_END.X / U;
  const tz = V3_END.Zc / U;
  let m = 0.35;
  let vc = 0.36;
  const err = (mm: number, v: number) => {
    const r = v3Integrate(mm, v);
    return [r.X[DURATION - 1] - tx, r.Z[DURATION - 1] - tz];
  };
  for (let it = 0; it < 30; it++) {
    const e = err(m, vc);
    if (Math.hypot(e[0], e[1]) < 1e-7) break;
    const dm = 1e-5;
    const dv = 1e-5;
    const em = err(m + dm, vc);
    const ev = err(m, vc + dv);
    const j11 = (em[0] - e[0]) / dm;
    const j21 = (em[1] - e[1]) / dm;
    const j12 = (ev[0] - e[0]) / dv;
    const j22 = (ev[1] - e[1]) / dv;
    const det = j11 * j22 - j12 * j21;
    m -= (j22 * e[0] - j12 * e[1]) / det;
    vc -= (-j21 * e[0] + j11 * e[1]) / det;
  }
  return { mid: m, vc, ...v3Integrate(m, vc) };
})();
export const V3_MID_DEG = (V3_SOL.mid * 180) / Math.PI;
export const V3_CRUISE = V3_SOL.vc;
export const V3_LENGTH = V3_SOL.S[DURATION - 1];
export const V3_S = { s: V3_SOL.S, vc: V3_SOL.vc };
/** the glide at frame f (fractional): plan position (m) and heading tan */
const v3At = (f: number) => {
  const i = Math.max(0, Math.min(DURATION - 2, Math.floor(f)));
  const t = c01(f - i);
  return { X: lerp(V3_SOL.X[i], V3_SOL.X[i + 1], t), Z: lerp(V3_SOL.Z[i], V3_SOL.Z[i + 1], t), tan: Math.tan(v3Heading(f, V3_SOL.mid)) };
};
/** the frame at which the glide reaches arc s (m) */
export const v3FrameAt = (sm: number) => {
  const S = V3_SOL.S;
  for (let f = 0; f < DURATION - 1; f++) if (S[f + 1] >= sm) return f + (sm - S[f]) / Math.max(1e-9, S[f + 1] - S[f]);
  return DURATION - 1;
};
/** the glide by arc length s (m): plan position and heading tan */
export const v3PathAt = (sm: number) => v3At(v3FrameAt(sm));
/** E (eye height, m): up over Euclid as the glide leaves the landing, then down to the scholars' eye level */
export const V3_E: Key[] = [
  [0, 11.69],
  [24, 12.75],
  [70, 11.1],
  [140, 10.62],
  [185, 10.6],
];
const V3_EF = pchip(V3_E, true);
const DIO_TAN = (X: number, Zc: number) => (DIO.X / U - X) / (DIO.Z / U - Zc);
/** V3 look (the world camera has no yaw: the look is the lens shift sh = -F tan(look)): from V1's f0 lean (onto
 *  Euclid's landing) round onto the avenue's heading by turn1 in one slow, flat-middled turn (the vanishing point
 *  comes to the frame's centre as the first column rises), then from dio0 onto Diophantus by dio1 */
export const V3_LOOK = { turn1: 84, dio0: 100, dio1: 168 };
/** the V3 camera: the driven glide, E, a single-lobe zoom and horizon row, the look; blended into V2's end camera over
 *  join0..f185 (V2's end composition, as delivered) */
export const cameraA = (f: number): ACam => {
  const v2 = cameraV2(f);
  const v20 = cameraV2(0);
  const q = v3At(f);
  const u = c01(f / (DURATION - 1));
  const lnF = lerp(Math.log(v20.F), Math.log(V3_END.F), smooth5(u * 1.06));
  const F = Math.exp(lnF);
  const hy = lerp(v20.hy, V3_END.hy, smooth5((f - 8) / 160));
  const wDio = smooth5((f - V3_LOOK.dio0) / (V3_LOOK.dio1 - V3_LOOK.dio0));
  const wAve = V3_TURN(f / V3_LOOK.turn1);
  const tan = Math.tan((V3_LEAN + (V3_AVE - V3_LEAN) * wAve) * (1 - wDio) + Math.atan(DIO_TAN(q.X, q.Z)) * wDio);
  const c: ACam = { X: q.X * U, E: V3_EF(f) * U, Zc: q.Z * U, F, hy, sh: -F * tan };
  const j = smooth5((f - V3_SPEED.join0) / (DURATION - 1 - V3_SPEED.join0));
  if (j <= 0) return c;
  return { X: lerp(c.X, v2.X, j), E: lerp(c.E, v2.E, j), Zc: lerp(c.Zc, v2.Zc, j), F: Math.exp(lerp(Math.log(c.F), Math.log(v2.F), j)), hy: lerp(c.hy, v2.hy, j), sh: lerp(c.sh, v2.sh, j) };
};

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
export const WORLD_COLS_STAND_FROM = 10000;
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
export type LoneCol = { id: string; X: number; Z: number; top: number; R: number; work: string; variant: number; dir: 1 | -1; rise: { f0: number; dur: number } };
/** V3: an avenue of lone columns close to the glide (Revision 1), alternating left / right, each placed by the frame
 *  the glide passes it: at frame `pass` it stands AVENUE.d metres ahead of the eye and AVENUE.a metres to the side of
 *  the look (so it is big and readable there, ~300 px, and slides out of the frame at a calm pace a few frames later),
 *  consecutive columns ~6-8 m apart along the glide; each is settled well before its pass; Diophantus closes the
 *  avenue. side -1 left, +1 right; top = the capital's top (the scholar's feet), so each scholar stands about at the
 *  eye as he passes. Works: Archimedes (sphere in the cylinder), Apollonius (the cone), Eratosthenes (the Earth's
 *  circumference: the circle, the two radii, the parallel rays), Hipparchus (a chord in a circle). */
export const AVENUE = { a: 3.0, d: 12.0, pass0: 54, dpass: 17, dur: 40, firstSettle: 44, lastSettle: 86 };
const AVENUE_LOOK = [
  { id: "a-archimedes", side: -1 as const, top: 9.9, work: "sphereCylinder", variant: 5 },
  { id: "a-apollonius", side: 1 as const, top: 9.5, work: "cone", variant: 6 },
  { id: "a-eratosthenes", side: -1 as const, top: 9.2, work: "eratosthenes", variant: 4 },
  { id: "a-hipparchus", side: 1 as const, top: 9.0, work: "hipparchus", variant: 2 },
];
/** settles evenly staggered from firstSettle to lastSettle ("pop up"); each rise lasts dur (97 % at 0.75 dur) */
const AVENUE_COLS = AVENUE_LOOK.map((c, i) => {
  const settle = AVENUE.firstSettle + ((AVENUE.lastSettle - AVENUE.firstSettle) * i) / (AVENUE_LOOK.length - 1);
  return { ...c, pass: AVENUE.pass0 + AVENUE.dpass * i, rise: { f0: Math.round(settle - 0.75 * AVENUE.dur), dur: AVENUE.dur } };
});
export const LONE: LoneCol[] = AVENUE_COLS.map((c) => {
  const cam = cameraA(c.pass);
  const t = -cam.sh / cam.F;
  const n = Math.hypot(1, t);
  // look axis in plan (t, 1)/n, its right normal (1, -t)/n
  const X = cam.X / U + (AVENUE.d * t) / n + (c.side * AVENUE.a) / n;
  const Z = cam.Zc / U + AVENUE.d / n - (c.side * AVENUE.a * t) / n;
  return { id: c.id, X, Z, top: c.top, R: 0.5, work: c.work, variant: c.variant, dir: c.side < 0 ? 1 : -1, rise: c.rise };
});
/** the avenue's rise: it gathers speed while still inside the low air (a lone scholar first shows at rise ~0.24),
 *  so the visible part is one soft deceleration from the surfacing to the settle (no slow-then-fast kink) */
const LONE_RISE_SHAPE = pchip(
  [
    [0, 0],
    [0.12, 0.1],
    [0.2, 0.24],
    [0.5, 0.78],
    [0.75, 0.97],
    [1, 1],
  ],
  true,
);
export const loneRise = (c: LoneCol, f: number) => c01(LONE_RISE_SHAPE(c01((f - c.rise.f0) / c.rise.dur)));
/** a lone column's drop at rise 0..1 (the world's riseOffset: at 0 his head is ~1 m under the low air's floor) */
export const loneDrop = (c: LoneCol, rise: number) => (1 - c01(rise)) * (c.top + 3.0) * U;
