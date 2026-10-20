// ---------------------------------------------------------------------------
// moveOnPlan — the timing, camera and kinematics of MoveOnToTheNext (cut 31),
// kept free of JSX so a check script can sample every frame. WORLD px, +y down.
//
// Everything that flies in formation is placed in the FORMATION frame
// u = x - V * f (the formation flies right at V world px per frame); the camera
// is a keyed track in u too (cu), so world cx = cu + V * f. Things that leave
// the formation (the hit aircraft, the ejected crew, the chutes) are integrated
// in world px from the frame they leave it.
// ---------------------------------------------------------------------------
import { Easing, interpolate } from "remotion";
import { camEase, clamp, runCamera2 } from "../kits/core-memory/cerroShared";
import { JET_LEN } from "./zachShared";

export const W = 2048;
export const H = 1080;
export const DURATION = 145;
export const V = 22; // formation speed, world px / frame

// -- beats (local frames, words.json at 24000/1001, whisper ~0.1-0.3 s early) --
export const BEAT = {
  two: 29,
  pilots: 37,
  iran: 53,
  okay: 67,
  mq9: 101,
  move: 115,
  next: 134,
  one: 139,
} as const;
export const HIT1 = 45; // missile 1 touches the F-15's belly (contact frame)
export const EJECT_REAR = 48; // the back seater goes first (F-15E sequence)
export const EJECT_FRONT = 50;
export const HIT2 = 112; // missile 2 touches the lead uncrewed jet's belly
export const SURGE_F0 = 114; // the next jet surges for the lead slot
export const SURGE_F1 = 136; // ... and is in it

// -- the F-15E, side view: metres from the nose tip (x aft) and the belly (y up) --
export const F15_LEN = 940; // world px nose tip -> nozzle (~46 % of the frame at k 1)
export const M = F15_LEN / 19.4; // world px per metre (F-15E length 19.43 m)
export const F15_XC = 9.7; // the glyph's centre, metres
export const F15_YC = 1.8;
export const f15Local = (xm: number, ym: number): [number, number] => [
  (F15_XC - xm) * M,
  (F15_YC - ym) * M,
];
export const F15_U = 0;
export const F15_Y = 400;
export const SILL_M = 2.6; // the canopy's lower edge (its shadow draws the cockpit sill) // canopy sill height, metres

const bob = (f: number, phase: number) => 3 * Math.sin(f / 13 + phase);

/** A hit aircraft noses over and dives: pitch eases toward `maxDeg`, it flies
 *  along its nose, gathering `acc` per frame of speed in the dive, and gravity
 *  adds `g` per frame of sink; `kick` is the sink the hit itself knocks in.
 *  Integrated per frame from the contact. */
const dive = (
  t: number,
  maxDeg: number,
  tau: number,
  acc: number,
  g: number,
  kick = 0,
) => {
  let du = 0;
  let dy = 0;
  for (let i = 1; i <= t; i++) {
    const th = (maxDeg * (1 - Math.exp(-i / tau)) * Math.PI) / 180;
    const sp = V + acc * i;
    du += sp * Math.cos(th) - V;
    dy += sp * Math.sin(th) + g * i + kick;
  }
  const angle = t > 0 ? maxDeg * (1 - Math.exp(-t / tau)) : 0;
  return { du, dy, angle };
};

export type Place = { x: number; y: number; angle: number };

/** The F-15E's centre in WORLD px and its pitch (deg, + = nose down). */
export const f15At = (f: number): Place => {
  const t = f - HIT1;
  const d = dive(Math.max(0, t), 58, 9, 1.6, 1.4, 3);
  const yb = bob(Math.min(f, HIT1), 0);
  return { x: F15_U + d.du + V * f, y: F15_Y + yb + d.dy, angle: d.angle };
};

/** plane-local px -> world px for a placement */
export const toWorld = (p: Place, lx: number, ly: number) => {
  const a = (p.angle * Math.PI) / 180;
  return {
    x: p.x + lx * Math.cos(a) - ly * Math.sin(a),
    y: p.y + lx * Math.sin(a) + ly * Math.cos(a),
  };
};

// -- the crew ------------------------------------------------------------------
export type Crew = {
  seat: [number, number];
  te: number;
  rise: number;
  tauX: number;
  phase: number;
};
export const CREW: Crew[] = [
  // rear cockpit (WSO): goes first, highest, sheds its forward speed fastest
  {
    seat: f15Local(6.95, 3.47),
    te: EJECT_REAR,
    rise: 290,
    tauX: 4,
    phase: 0.6,
  },
  // front cockpit (pilot)
  {
    seat: f15Local(5.35, 3.38),
    te: EJECT_FRONT,
    rise: 312,
    tauX: 14,
    phase: 2.4,
  },
];
const softplus = (v: number) => Math.log(1 + Math.exp(v));

/** The crew member's head centre (world px), lean (deg) and frames since
 *  ejection s (< 0 = still in the seat). */
export const crewAt = (c: Crew, f: number) => {
  if (f < c.te) {
    const p = f15At(f);
    const w = toWorld(p, c.seat[0], c.seat[1]);
    return { x: w.x, y: w.y, rot: p.angle, s: f - c.te };
  }
  const s = f - c.te;
  const p = f15At(c.te);
  const w0 = toWorld(p, c.seat[0], c.seat[1]);
  const a = (p.angle * Math.PI) / 180;
  const up = { x: Math.sin(a), y: -Math.cos(a) };
  const r = c.rise * (1 - Math.exp(-s / 3.5));
  const descent = 1.5 * 2 * softplus((s - 9) / 2) - 1.5 * 2 * softplus(-4.5);
  return {
    x: w0.x + up.x * r + V * c.tauX * (1 - Math.exp(-s / c.tauX)),
    y: w0.y + up.y * r + descent,
    rot: p.angle * Math.exp(-s / 3),
    s,
  };
};

/** The chute's deploy state at s frames after ejection. It streams up OUT of
 *  the figure (its base starts behind the torso), then the canopy snaps open. */
export const CHUTE_W = 200;
export const CHUTE_H = 92;
export const CHUTE_BASE = -140; // the dome's skirt above the head centre, open
export const chuteAt = (s: number) => {
  const d1 = interpolate(s, [3, 9], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const d2 = interpolate(s, [6, 14], [0, 1], {
    easing: Easing.out(Easing.back(1.3)),
    ...clamp,
  });
  const base = 28 + (CHUTE_BASE - 28) * d1;
  const w = CHUTE_W * (0.13 + 0.87 * d2);
  const h = CHUTE_H * (0.3 + 0.7 * d1) * (1 + 0.3 * (1 - Math.min(1, d2)));
  const swing =
    s > 10 ? 3.5 * Math.sin((s - 10) / 6) * Math.min(1, (s - 10) / 8) : 0;
  return {
    on: s >= 3,
    base,
    w,
    h,
    swing,
    armsUp: interpolate(s, [0, 5], [0, 1], clamp),
  };
};

// -- the column of uncrewed jets ------------------------------------------------
export const K_COL = 0.85; // the camera at the column
export const JET_SCREEN = 420; // screen px nose -> nozzle at K_COL
export const JET_SCALE = JET_SCREEN / K_COL / JET_LEN; // 4.12 -> 494 world px
export const CU_FINAL = 2060; // the camera's u at the column
export const SLOT_SX = [1450, 975, 500]; // slot centres, screen x at K_COL
export const SLOT_Y = [236, 262, 288]; // world y: in trail, stepped down aft
export const slotU = (i: number) => CU_FINAL + (SLOT_SX[i] - W / 2) / K_COL;
export const JET3_U0 = CU_FINAL + (-270 - W / 2) / K_COL; // the next one, off frame left

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const SURGE_EASE = Easing.bezier(0.45, 0, 0.2, 1);
const CLOSE_EASE = Easing.bezier(0.4, 0, 0.2, 1);
const JOIN_EASE = Easing.bezier(0.2, 0.45, 0.25, 1); // already moving when it enters
const prog = (f: number, f0: number, f1: number, e: (t: number) => number) =>
  interpolate(f, [f0, f1], [0, 1], { easing: e, ...clamp });

/** Jet i of the column: 0 the lead (hit), 1 the next one (the surge, with the
 *  crown), 2 closes up, 3 joins from behind. World px + pitch. */
export const jetAt = (i: number, f: number): Place & { visible: boolean } => {
  if (i === 0) {
    const d = dive(Math.max(0, f - HIT2), 60, 6, 2.2, 1.4, 11);
    const yb = bob(Math.min(f, HIT2), 1.1);
    return {
      x: slotU(0) + d.du + V * f,
      y: SLOT_Y[0] + yb + d.dy,
      angle: d.angle,
      visible: true,
    };
  }
  if (i === 1) {
    const p = prog(f, SURGE_F0, SURGE_F1, SURGE_EASE);
    return {
      x: lerp(slotU(1), slotU(0), p) + V * f,
      y: lerp(SLOT_Y[1], SLOT_Y[0], p) + bob(f, 2.3),
      angle: 0,
      visible: true,
    };
  }
  // jet 2 closes up one place; jet 3 (the next one behind it) is already moving when it enters from off
  // frame left, and never comes closer to jet 2 than the column's pitch.
  const p2 = prog(f, SURGE_F0, 138, CLOSE_EASE);
  const u2 = lerp(slotU(2), slotU(1), p2);
  if (i === 2) {
    return {
      x: u2 + V * f,
      y: lerp(SLOT_Y[2], SLOT_Y[1], p2) + bob(f, 3.9),
      angle: 0,
      visible: true,
    };
  }
  const gap = lerp(
    slotU(2) - JET3_U0,
    slotU(1) - slotU(2),
    prog(f, HIT2, 140, JOIN_EASE),
  );
  return {
    x: u2 - gap + V * f,
    y: SLOT_Y[2] + bob(f, 5.2),
    angle: 0,
    visible: f >= HIT2,
  };
};

/** The surge's crown step (world px): opens with the next jet's speed to 26
 *  and closes with it — the chain marks the surge only. */
const surgeSpeed = (f: number) =>
  (prog(f + 0.5, SURGE_F0, SURGE_F1, SURGE_EASE) -
    prog(f - 0.5, SURGE_F0, SURGE_F1, SURGE_EASE)) *
  (slotU(0) - slotU(1));
let SP_MAX = 0;
for (let f = SURGE_F0; f <= SURGE_F1; f += 0.25) {
  const v = surgeSpeed(f);
  if (v > SP_MAX) SP_MAX = v;
}
export const surgeStep = (f: number) => {
  if (f < SURGE_F0 || f > SURGE_F1) return 0;
  // in proportion to the speed both ways (26 at the peak), less a 1.5 px dead
  // band so it reaches exactly 0 — fully stacked behind the core — as the jet
  // settles (~f133), with no sub-pixel colour fringe before it goes
  const r = Math.min(1, surgeSpeed(f) / SP_MAX);
  return Math.max(0, 26 * r - 1.5) * (26 / 24.5);
};

// -- the missiles ----------------------------------------------------------------
// One straight line in the formation frame at constant speed, from below the
// frame to the contact point; drawn up to the contact frame, then gone into the
// aircraft (it is painted BEHIND the aircraft it hits). Each is ~170 screen px
// long at its camera (k 1.32 at f45, k 0.853 at f112). Behind it a short
// exhaust streak (TRAIL_LENS lengths, a STROKE-wide taper) rides along. At contact the
// missile carries on INTO the aircraft: the caller clips missile and trail to
// the half-plane below the target's belly line (`bellyLy`, target-local), so
// it is swallowed in ~3 frames; the streak follows it in and drains away over
// TRAIL_DRAIN frames.
export type Shot = {
  len: number; // world px nose -> tail
  bellyLy: number; // the contact's y in the target's local frame (world px, unscaled)
  f0: number;
  f1: number;
  cu: number;
  cy: number;
  speed: number;
  deg: number;
};
export const TRAIL_DRAIN = 6;
export const TRAIL_LENS = 1.5; // the streak, in missile lengths behind the tail
const contact1 = (() => {
  const p = f15At(HIT1);
  const [lx, ly] = f15Local(11.0, 0.06);
  const w = toWorld(p, lx, ly);
  return { u: w.x - V * HIT1, y: w.y };
})();
export const SHOT1: Shot = {
  len: 128,
  bellyLy: f15Local(11.0, 0.06)[1],
  f0: 34,
  f1: HIT1,
  cu: contact1.u,
  cy: contact1.y,
  speed: 46,
  deg: 68,
};
const contact2 = (() => {
  const p = jetAt(0, HIT2);
  return { u: p.x - V * HIT2 - 8 * JET_SCALE, y: p.y + 11.5 * JET_SCALE };
})();
export const SHOT2: Shot = {
  len: 200,
  bellyLy: 11.5 * JET_SCALE,
  f0: 100,
  f1: HIT2,
  cu: contact2.u,
  cy: contact2.y,
  speed: 87,
  deg: 72,
};
const shotPoint = (s: Shot, back: number, f: number) => {
  const a = (s.deg * Math.PI) / 180;
  return { x: s.cu - Math.cos(a) * back + V * f, y: s.cy + Math.sin(a) * back };
};
/** The missile's nose (world px) and heading (deg, SVG sense), or null. It
 *  runs on past contact until its tail is in (clipped by the caller). */
export const missileAt = (s: Shot, f: number) => {
  if (f < s.f0 || s.speed * (f - s.f1) > s.len + s.speed) return null;
  const p = shotPoint(s, s.speed * (s.f1 - f), f);
  return { ...p, angle: -s.deg };
};
/** The exhaust streak: from its far end (a) to the missile's tail (b), or
 *  null. Only TRAIL_LENS missile lengths long, it rides with the missile and
 *  never reaches the frame edge; after contact it follows the missile into the
 *  belly and drains away over TRAIL_DRAIN frames. */
export const trailAt = (s: Shot, f: number) => {
  if (f < s.f0 || f >= s.f1 + TRAIL_DRAIN) return null;
  const start = s.speed * (s.f1 - s.f0) + s.len; // the path's start, behind the tail at f0
  const tail = Math.max(0, s.speed * (s.f1 - f) + s.len);
  const drain = interpolate(f, [s.f1, s.f1 + TRAIL_DRAIN], [0, 1], {
    easing: Easing.in(Easing.quad),
    ...clamp,
  });
  const far = Math.min(start, tail + TRAIL_LENS * s.len * (1 - drain));
  if (far - tail < 1) return null;
  return { a: shotPoint(s, far, f), b: shotPoint(s, tail, f) };
};

// -- the camera ------------------------------------------------------------------
// Keyed per frame through camEase, followed by the house damped tracker.
//   OPEN+PUSH f0-40   k 1.00 -> 1.34 onto the canopy (warp 1.7: a creep, then
//                     the push through "two ... pilots")
//   PULL      f40-58  k 1.34 -> 0.98, up to the chutes
//   PAN       f58-97  k 0.98 -> 0.85, right along the formation to the column
//   CREEP     f97-145 k 0.85 -> 0.875
type Seg = {
  f0: number;
  f1: number;
  u: [number, number];
  y: [number, number];
  k: [number, number];
  warp: number;
};
const SEGS: Seg[] = [
  { f0: 0, f1: 40, u: [60, 150], y: [540, 461], k: [1.0, 1.34], warp: 1.7 },
  { f0: 40, f1: 58, u: [150, 20], y: [461, 330], k: [1.34, 0.98], warp: 1 },
  {
    f0: 58,
    f1: 97,
    u: [20, CU_FINAL],
    y: [330, 395],
    k: [0.98, K_COL],
    warp: 1,
  },
  {
    f0: 97,
    f1: DURATION,
    u: [CU_FINAL, CU_FINAL + 40],
    y: [395, 395],
    k: [K_COL, 0.875],
    warp: 1,
  },
];
export const CAM_F: number[] = [];
export const CAM_U: number[] = [];
export const CAM_Y: number[] = [];
export const CAM_K: number[] = [];
for (const s of SEGS) {
  for (let f = s.f0 === 0 ? 0 : s.f0 + 1; f <= s.f1; f++) {
    const g = camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    CAM_F.push(f);
    CAM_U.push(lerp(s.u[0], s.u[1], g));
    CAM_Y.push(lerp(s.y[0], s.y[1], g));
    CAM_K.push(lerp(s.k[0], s.k[1], g));
  }
}
/** The damped camera: world centre (cx, cy) on screen centre, zoom k. */
export const camAt = (f: number) => {
  const c = runCamera2(f, CAM_F, CAM_Y, CAM_U, CAM_K);
  return { cu: c.cx, cx: c.cx + V * f, cy: c.cy, k: c.k };
};
/** The fast pan's horizontal blur (screen px sigma): 0.18 x the formation's
 *  screen speed against the camera, ramped in from 20 px/f, exactly 0 when slow. */
export const panBlurAt = (f: number) => {
  if (f < 1) return 0;
  const a = camAt(f);
  const b = camAt(f - 1);
  const v = Math.abs(a.cu - b.cu) * a.k;
  return 0.18 * v * interpolate(v, [20, 36], [0, 1], clamp);
};

// The paper's parallax rest point: centred on the camera's whole travel, weighted
// by the slack the paper box has at each end (it must never show its edge).
const PAPER_SLACK = (k: number) => (3072 * (1 + (k - 1) * 0.3) - W) / 2;
export const PAPER_REST_X = (() => {
  const a0 = camAt(0);
  const a1 = camAt(DURATION - 1);
  const wa = (a0.k * 0.15) / PAPER_SLACK(a0.k);
  const wb = (a1.k * 0.15) / PAPER_SLACK(a1.k);
  return (wa * a0.cx + wb * a1.cx) / (wa + wb);
})();
export const paperSlack = PAPER_SLACK;

export const toScreen = (
  cam: { cx: number; cy: number; k: number },
  x: number,
  y: number,
) => ({
  x: W / 2 + (x - cam.cx) * cam.k,
  y: H / 2 + (y - cam.cy) * cam.k,
});
