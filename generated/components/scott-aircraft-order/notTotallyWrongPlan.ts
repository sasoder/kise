// ---------------------------------------------------------------------------
// notTotallyWrongPlan — the motion plan of NotTotallyWrong (scott-aircraft-order, cut 37), pure numbers.
// WORLD = metres on the ground, seen from directly above: x across the runway (+ = right of the centreline on
// screen), s ALONG it (+ = up the screen, the direction of the landing). The threshold is s 0, the centreline x 0.
// SCREEN: y = 960 - (s - cam.s) * cam.k, x = 540 + (x - cam.x) * cam.k (k = screen px per metre).
// ---------------------------------------------------------------------------

import { CAM_DAMP, CAM_STIFF } from "../kits/cheeky-pint/oceanShared";

export const FRAMES = 89;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ss = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- the runway (ICAO Annex 14 markings, 60 m wide; see the cut's header for the one compression) ------------
export const RWY = {
  W: 60, // width
  LEN: 3200, // threshold to the far end
  OVERRUN: 300, // past the far end (desert, dim)
  /** THE TARGET: one bullseye on the centreline at the ideal touchdown spot (the aiming point, ICAO's 150-400 m
   *  in; see the cut's header): a ring of centre radius R and width w, and a dot */
  RING: { s: 190, R: 7.0, w: 1.6, dot: 1.8 },
  /** THE ZONE ("not totally wrong"): the bracketed rectangle the corners open out to: the runway's full width (and a
   *  little over its edges), from just before the ring to far up the runway */
  ZONE: { x: 33, s0: 178, s1: 470 },
  /** threshold piano keys: 16 stripes 1.8 m wide, 30 m long, starting 6 m in from the threshold */
  KEYS: { s0: 6, len: 30, n: 16, w: 1.8 },
  /** centreline: 30 m stripes, 20 m gaps, 0.9 m wide, from past the keys */
  CL: { s0: 60, dash: 30, gap: 20, w: 0.9 },
  EDGE: { w: 0.9 }, // the side stripes
  LIGHTS: { pitch: 60, off: 1.5 }, // the edge lights: every 60 m, 1.5 m outside the edge
} as const;

// --- the jet (787-9: length 62.8, span 60.1; the world's JET_POINTS.B787_9: main gear 1.38 m ahead of the
// fuselage centre, 4.9 m either side; nose +31.4, tail -31.4, wing tips -15.3) ------------------------------------
export const JET = { L: 62.8, SPAN: 60.1, GEAR_X: 1.3816, GEAR_Z: 4.9, NOSE: 31.4 - 1.3816, TAIL: 31.4 + 1.3816 } as const;

/** the beats (frames) */
export const BEAT = {
  ringOn: [15, 22] as [number, number], // the target lights from its dot outward, lit by "right" (f22)
  arms: [41, 44] as [number, number], // the four corners grow out of the ring's box ("just have to be")
  zone: [44, 68] as [number, number], // ... and open out to the zone on one smooth ease-out ("not" f47 .. "totally"):
  // the top corners pass the jet's nose by f54 (before contact) and peak under ~55 screen px per frame
  dim: [44, 60] as [number, number], // the desert / overrun recede by tone
  touch: 60, // main gear contact (the shadow meets the jet)
} as const;

// --- the jet's travel: s(f) of the MAIN GEAR -------------------------------------------------------------------
const S0 = -4; // f0: the main gear 4 m short of the threshold, the nose over the piano keys
const S_TD = 345; // the touchdown point: 155 m past the target (and 11 m to its right: X_OFF)
const R = 1.08; // approach speed at f0 / at touchdown (a slight bleed in the float)
const V_TD = (2 * (S_TD - S0)) / (BEAT.touch * (1 + R));
const V0 = R * V_TD;
const V_END = 0.8; // still rolling at the last frame
const velAt = (f: number) => {
  if (f < 0) return V0;
  if (f < BEAT.touch) return V0 + ((V_TD - V0) * f) / BEAT.touch;
  const u = c01((f - BEAT.touch) / (FRAMES - BEAT.touch));
  return V_TD + (V_END - V_TD) * (1 - Math.pow(1 - u, 1.3));
};
// integrate once on a fine grid (f -60 .. FRAMES + 4)
const STEP = 0.05;
const F_LO = -60;
const S_TAB: number[] = (() => {
  const out: number[] = [];
  let s = S0 + V0 * F_LO;
  for (let f = F_LO; f <= FRAMES + 4 + 1e-9; f += STEP) {
    out.push(s);
    s += velAt(f + STEP / 2) * STEP;
  }
  // shift so s(0) = S0 exactly
  const i0 = Math.round(-F_LO / STEP);
  const d = S0 - out[i0];
  return out.map((v) => v + d);
})();
/** the main gear's s at frame f (continuous) */
export const gearS = (f: number) => {
  const p = (f - F_LO) / STEP;
  const i = Math.max(0, Math.min(S_TAB.length - 2, Math.floor(p)));
  return lerp(S_TAB[i], S_TAB[i + 1], p - i);
};
export const speedAt = velAt;

/** height of the main gear above the runway (m): 15 m (50 ft) over the threshold, a long flat float, zero at
 *  BEAT.touch with zero sink (the float ends tangent to the ground) */
export const ALT0 = 24;
export const altAt = (f: number) => {
  if (f >= BEAT.touch) return 0;
  const u = c01(f / BEAT.touch);
  // the descent slows into a long float (kept high enough that the shadow's gap reads from above) and meets the
  // ground with a small sink (a landing, not a hover)
  return ALT0 * Math.pow(1 - u, 0.85);
};
/** nose-up pitch (deg): ~2.5 on the approach, the flare to ~5.5 over the float, held through the contact, then the
 *  nose comes down after the main gear is on (f60 -> ~f76) */
export const pitchAt = (f: number) => {
  const flare = ss((f - 26) / 26);
  const derot = ss((f - (BEAT.touch + 2)) / 15);
  return (2.5 + 3 * flare) * (1 - derot);
};

// --- the camera (metres): one continuous follow + pull-back, then a slow creep ---------------------------------
// The plan view is turned by a CONSTANT ROT degrees (never animated) so the runway runs on a diagonal from the lower
// left to the upper right through the frame. The camera is tracked as a LOOK point on the centreline (s) that sits on
// screen at (ANCHOR_X, ANCHOR_Y), and k (screen px per metre). The track itself runs on the vertical scale k * COS (how fast
// s climbs the screen), so the framing maths stays one-dimensional.
export type PlanCam = { x: number; s: number; k: number };
export const ROT = 17; // deg: +Z (up the runway) points up and to the RIGHT
const COS = Math.cos((ROT * Math.PI) / 180);
const SIN = Math.sin((ROT * Math.PI) / 180);
export const ANCHOR_X = 548; // the look point's screen x (balances the payoff: target lower left, jet upper right)
export const ANCHOR_Y = 920; // ... and its screen y (the whole picture sits 40 px high: room for the zone's lower corners)
const K0 = 9.2 * COS; // f0: span ~550 px (k 9.2)
const KP = 5.5 * COS; // the payoff: span ~330 px (k 5.5)
const YJ0 = 770; // f0: the main gear's screen y (on the centreline)
const CV = 0.985; // the camera's travel against the jet's (the jet drifts a touch up the frame)
const DEC: [number, number] = [47, 74]; // the follow eases out
const KZ: [number, number] = [-10, 58]; // the pull-back
const KW = 0.8;
const CREEP = { f0: 62, f1: 170, ds: 8 };
const STIFF = CAM_STIFF; // the house damped follower (oceanShared, as the world's airTrack)
const DAMP = CAM_DAMP;
const PRE = 60;
const vCam = (f: number) => velAt(f) * CV * (1 - ss((f - DEC[0]) / (DEC[1] - DEC[0])));
const runTrack = (sStart: number, kStart: number): PlanCam[] => {
  const T: { s: number; k: number }[] = [];
  let sAcc = sStart;
  for (let f = -PRE; f <= FRAMES + 3; f++) {
    // target: integrated eased velocity (+ the creep), log-eased zoom
    if (f > -PRE) {
      // midpoint integral over [f-1, f]
      let a = 0;
      for (let j = 0; j < 10; j++) a += vCam(f - 1 + (j + 0.5) / 10) / 10;
      sAcc += a;
    }
    const kz = ss(Math.pow(c01((f - KZ[0]) / (KZ[1] - KZ[0])), KW));
    T.push({ s: sAcc + CREEP.ds * ss((f - CREEP.f0) / (CREEP.f1 - CREEP.f0)), k: Math.exp(lerp(Math.log(kStart), Math.log(KP), kz)) });
  }
  const out: PlanCam[] = [];
  let c = { ...T[0] };
  let v = { s: 0, k: 0 };
  for (let i = 0; i < T.length; i++) {
    if (i > 0) {
      v = { s: v.s + (T[i].s - c.s) * STIFF - v.s * DAMP, k: v.k + (T[i].k - c.k) * STIFF - v.k * DAMP };
      c = { s: c.s + v.s, k: c.k + v.k };
    }
    if (i >= PRE) out.push({ x: 0, s: c.s, k: c.k });
  }
  return out;
};
/** solve the start so that f0 frames the jet at K0 with its gear on screen y YJ0 */
export const CAM: PlanCam[] = (() => {
  let sStart = S0 - 400;
  let kStart = K0;
  let tr = runTrack(sStart, kStart);
  for (let it = 0; it < 50; it++) {
    const want = S0 - (960 - YJ0) / tr[0].k;
    sStart += want - tr[0].s;
    kStart *= K0 / tr[0].k;
    tr = runTrack(sStart, kStart);
  }
  return tr;
})();
/** the camera at frame f: the look point s on the centreline and the true k (px per metre) */
export const camAt = (f: number): PlanCam => {
  const a = Math.max(0, Math.min(CAM.length - 2, Math.floor(f)));
  const t = c01(f - a);
  return { x: 0, s: lerp(CAM[a].s, CAM[a + 1].s, t), k: lerp(CAM[a].k, CAM[a + 1].k, t) / COS };
};
/** the world camera centre [X, Z] for the stage's plan camera (rot = -ROT in its convention: + turns right) */
export const camCentre = (c: PlanCam): [number, number] => {
  const dx = (ANCHOR_X - 540) / c.k; // screen offset of the look point, in metres
  // screen right = rx cos + rz sin ; screen up = -rx sin + rz cos  (r = point - centre)
  const rx = dx * COS;
  const rz = dx * SIN;
  const dy = (960 - ANCHOR_Y) / c.k;
  return [c.x - rx + dy * SIN, c.s - rz - dy * COS];
};
/** world (x across, s along) -> screen px under the turned plan camera */
export const toScr = (c: PlanCam, x: number, s: number) => {
  const [cx, cz] = camCentre(c);
  const rx = x - cx;
  const rz = s - cz;
  return { x: 540 + (rx * COS + rz * SIN) * c.k, y: 960 - (-rx * SIN + rz * COS) * c.k };
};

// --- the amber fronts (s on the runway, metres) ---------------------------------------------------------------
/** the target's light: a radius running from the dot out over the ring */
export const ringFront = (f: number) => (RWY.RING.R + RWY.RING.w) * 1.15 * ss((f - BEAT.ringOn[0]) / (BEAT.ringOn[1] - BEAT.ringOn[0]));
/** the zone's corners at frame f: the box (x half-width, s0, s1), the arm length (m) and how open it is (0..1) */
export const zoneAt = (f: number) => {
  const R = RWY.RING;
  const Z = RWY.ZONE;
  const h0 = R.R + R.w + 1.6; // the ring's box
  // a soft ease-out: half smoothstep, half quadratic ease-out (a smooth start, most of the travel early, a long settle)
  const u = c01((f - BEAT.zone[0]) / (BEAT.zone[1] - BEAT.zone[0]));
  const e = 0.45 * ss(u) + 0.55 * (1 - (1 - u) * (1 - u));
  const x = lerp(h0, Z.x, e);
  const s0 = lerp(R.s - h0, Z.s0, e);
  const s1 = lerp(R.s + h0, Z.s1, e);
  const grow = ss((f - BEAT.arms[0]) / (BEAT.arms[1] - BEAT.arms[0]));
  const arm = 0.24 * Math.min(2 * x, s1 - s0) * grow;
  return { x, s0, s1, arm, open: e, on: grow };
};

// --- the miss to the side: the jet drifts right of the centreline over the approach and lands off-centre --------
export const X_OFF = 11; // m (18 % of the runway's width)
const DRIFT: [number, number] = [4, 58];
export const jetX = (f: number) => X_OFF * ss((f - DRIFT[0]) / (DRIFT[1] - DRIFT[0]));
/** the heading follows the drift (a drawn thing travels the way it points): deg, + = right */
export const headingAt = (f: number) => (Math.atan2(jetX(f + 0.5) - jetX(f - 0.5), gearS(f + 0.5) - gearS(f - 0.5)) * 180) / Math.PI;

// --- the touchdown: tyre marks and tyre smoke (world metres) ----------------------------------------------------
/** the rear axle trails the main-gear reference by ~0.9 m; each bogie's wheel pairs sit 0.75 m either side */
const AXLE_BACK = 0.9;
export const TYRE_XS = [-JET.GEAR_Z - 0.75, -JET.GEAR_Z + 0.75, JET.GEAR_Z - 0.75, JET.GEAR_Z + 0.75].map((x) => x + X_OFF);
export const MARK = { s0: 0, len: 30 };
MARK.s0 = gearS(BEAT.touch) - AXLE_BACK;
/** how far the tyres have drawn their marks by frame f (the spin-up skid: MARK.len metres, then clean rolling) */
export const markReach = (f: number) => (f < BEAT.touch ? MARK.s0 - 1 : Math.min(MARK.s0 + MARK.len, gearS(f) - AXLE_BACK));
const hash01 = (n: number) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
/** the puffs: two short puffs per bogie (born on contact and 1.5 frames later), left where the tyres touched,
 *  billowing, pushed back by the spinning wheels and drifting a little outward and downwind, thinning out */
export const PUFFS_PER_SIDE = 2;
export const puffsAt = (f: number) => {
  const out: { x: number; s: number; r: number; a: number; seed: number }[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < PUFFS_PER_SIDE; i++) {
      const seed = (side + 2) * 10 + i;
      const born = BEAT.touch + i * 1.5;
      const age = f - born;
      if (age < 0) {
        out.push({ x: 0, s: 0, r: 0, a: 0, seed });
        continue;
      }
      const s0 = gearS(born) - AXLE_BACK;
      const back = (2.2 + 1.2 * hash01(seed + 1)) * (1 - Math.exp(-age / 5)) + 0.08 * age;
      const x = X_OFF + side * (JET.GEAR_Z + 0.4 + 1.6 * (1 - Math.exp(-age / 8))) + 0.05 * age;
      const r = 1.1 + (5.6 + 1.8 * hash01(seed + 5)) * (1 - Math.exp(-age / 6.5)) + 0.08 * age;
      const a = (i === 0 ? 0.78 : 0.62) * Math.exp(-age / (8.5 + 2.5 * hash01(seed + 7)));
      out.push({ x, s: s0 - back, r, a, seed });
    }
  }
  return out;
};
