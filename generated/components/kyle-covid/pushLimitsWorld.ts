// ---------------------------------------------------------------------------
// pushLimitsWorld — the pure world of PushTheLimitsOnLatency (kyle-covid, cut 39): the crane camera, the plaza, the
// crowd's layout, the wave's kindle times, the sick three and the medics' choreography. No React here.
//
// UNITS: the cast's (a man ~312 = 1.75 m, U = 178 per metre). X across (+ = screen right), Y height (floor 0, up -),
// Z depth (+ = away from the camera). THE RING'S CENTRE IS THE WORLD ORIGIN (X 0, Z 0): the londonDepth front plane
// runs through it, so the people in front of the ring stand at negative Z.
//
// THE CAMERA is a real crane eye (shift lens, so verticals stay vertical: the billboard cast stands upright): eye at
// lateral X = ex, height He above the floor, horizontal distance Dr in front of the ring's centre, focal F screen px,
// the ring's centre drawn at screen row ys. It maps exactly onto a londonDepth perspective per frame:
//   eyeY = -He, Dc = Dr (dRef = Dr, kRef = k, dolly 1), k = F / Dr, cx = ex, cy = (960 - ys) / k.
// One continuous move: depression and distance ride one bell-shaped speed profile (one acceleration lobe, one
// deceleration lobe) from f0 to ~f138, then a gentle creep to the end.
// ---------------------------------------------------------------------------
import type { Cam, DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { POSES, lerpPose, standAt, type CovidPose } from "./covidFolkBody";

export const U = 178;
export const DURATION = 160;
/** the focal length in screen px (a ~44 deg horizontal lens on 1080) */
export const F = 2000;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---- the camera ---------------------------------------------------------------------------------------------------
export type Eye = { ex: number; He: number; Dr: number; ys: number; theta: number; s: number };
/** f0: the closer high view of the sick three; END: the settled wide (CONTROL, f135) */
export const CAM0 = { Dr: 1600, theta: (36 * Math.PI) / 180, ys: 760, ex: 0 };
export const CAM1 = { Dr: 3774, theta: (49 * Math.PI) / 180, ys: 752, ex: 0 };
/** the speed profile: a slow drift from f0 (the close view holds the first kindling), then ONE bell f18..LOBE_END
 *  (one acceleration lobe, one deceleration lobe, peak ~f78), then a creep to the end */
const LOBE_A = 18;
const LOBE_END = 140;
const DRIFT = 0.07;
const CREEP = 0.12;
const speed = (f: number) => {
  if (f >= LOBE_END) return CREEP;
  const g = f < LOBE_A ? 0 : Math.pow(Math.sin((Math.PI * (f - LOBE_A)) / (LOBE_END - LOBE_A)), 2);
  return lerp(DRIFT, CREEP, c01(f / LOBE_END)) + g;
};
const PROG: number[] = (() => {
  const out = [0];
  let acc = 0;
  const N = 8;
  for (let f = 0; f < DURATION + 2; f++) {
    for (let i = 0; i < N; i++) acc += speed(f + (i + 0.5) / N) / N;
    out.push(acc);
  }
  // normalise so the lobe's end (f138) is u ~0.985 and the creep runs on to ~1.02 at the last frame
  const at = out[138];
  return out.map((v) => (v / at) * 0.985);
})();
export const progressAt = (f: number) => {
  const i = Math.max(0, Math.min(PROG.length - 2, Math.floor(f)));
  return lerp(PROG[i], PROG[i + 1], f - i);
};
export const eyeAt = (f: number): Eye => {
  const u = progressAt(f);
  const Dr = Math.exp(lerp(Math.log(CAM0.Dr), Math.log(CAM1.Dr), u));
  const theta = lerp(CAM0.theta, CAM1.theta, u);
  const ys = lerp(CAM0.ys, CAM1.ys, u);
  const ex = lerp(CAM0.ex, CAM1.ex, u);
  return { ex, He: Dr * Math.tan(theta), Dr, ys, theta, s: F / Dr };
};
export const camOf = (e: Eye): { cam: Cam; depth: DepthOpts } => {
  const k = F / e.Dr;
  return { cam: { k, cx: e.ex, cy: (960 - e.ys) / k }, depth: { eyeY: -e.He, dRef: e.Dr, kRef: k, dolly: 1 } };
};
/** a 3D point to the screen (px) and its scale (screen px per unit) at this eye */
export const toScreen = (e: Eye, X: number, Y: number, Z: number): { x: number; y: number; s: number } | null => {
  const d = e.Dr + Z;
  if (d < 60) return null;
  const s = F / d;
  return { x: 540 + (X - e.ex) * s, y: e.ys - e.He * (F / e.Dr) + (Y + e.He) * s, s };
};
/** the floor point under a screen pixel (inverse of toScreen at Y = 0) */
export const floorAt = (e: Eye, sx: number, sy: number): { X: number; Z: number } | null => {
  const yh = e.ys - e.He * (F / e.Dr);
  if (sy <= yh + 1) return null;
  const d = (e.He * F) / (sy - yh);
  return { X: e.ex + ((sx - 540) * d) / F, Z: d - e.Dr };
};
export const horizonY = (e: Eye) => e.ys - e.He * (F / e.Dr);

// ---- the plaza ----------------------------------------------------------------------------------------------------
/** the ring of barrier panels: a hexagon (points to the front and back) of circumradius RING_R round the origin */
export const RING_R = 2.1 * U;
export const RING_IN = RING_R * Math.cos(Math.PI / 6);
export const PANEL = { len: RING_R, h: 0.9 * U, board0: 0.36 * U, foot: 0.3 * U };
/** the bench the three sick sit on (stone, 46 cm seat, 2 m long), its front edge toward the camera */
export const BENCH = { X0: -1.0 * U, X1: 1.0 * U, Z0: 0.12 * U, Z1: 0.56 * U, h: 82 };
/** building fronts across the back of the plaza (their base line) */
export const FACADE_Z = 9.2 * U;
/** the floor's extent */
export const FLOOR = { x0: -30 * U, x1: 30 * U, z0: -10 * U, z1: 24 * U };
/** two more stone benches out in the crowd (the plaza's furniture; nobody on them) */
export const EXTRA_BENCHES = [
  { X0: -8.2 * U, X1: -6.5 * U, Z0: 6.2 * U, Z1: 6.64 * U },
  { X0: 5.4 * U, X1: 7.1 * U, Z0: -4.9 * U, Z1: -4.46 * U },
];

// ---- the sick three (live figures) --------------------------------------------------------------------------------
// all three on the bench: a woman slumped, a man coughing into his fist, a man with a hand to his forehead
export type SickSpec = { kind: "commuter" | "elder" | "youth" | "parent"; variant: number; X: number; Z: number; seat: boolean };
export const SICK: SickSpec[] = [
  { kind: "commuter", variant: 2, X: -0.64 * U, Z: 0.24 * U, seat: true },
  { kind: "elder", variant: 2, X: 0.02 * U, Z: 0.27 * U, seat: true },
  { kind: "parent", variant: 1, X: 0.66 * U, Z: 0.24 * U, seat: true },
];

// ---- a planted-feet walk (the stance foot holds still; the body moves by what it slides back) ---------------------
/** X (units, from 0) per frame f0..f1 of a walk with this phase and amount profile; the planted foot over each sub-step
 *  is the one in stance at the step's start (facing left the pose is mirrored, which swaps the feet) */
export const integrateWalk = (dir: 1 | -1, phaseAt: (f: number) => number, amtAt: (f: number) => number, f0: number, f1: number, stopAt = Infinity) => {
  const xs: number[] = [];
  let X = 0;
  const SUB = 4;
  const poseAt = (f: number) => POSES.walk(dir, phaseAt(f), Math.max(0, amtAt(f)));
  for (let f = f0; f <= f1; f++) {
    if (f > f0 && f <= stopAt) {
      for (let j = 0; j < SUB; j++) {
        const fa = f - 1 + j / SUB;
        const fb = f - 1 + (j + 1) / SUB;
        const qa = poseAt(fa);
        const qb = poseAt(fb);
        const ph = phaseAt(fa);
        const uL = ph - Math.floor(ph);
        const stanceL = (uL < 0.5) === (dir === 1);
        X += stanceL ? qa.footL[0] - qb.footL[0] : qa.footR[0] - qb.footR[0];
      }
    }
    xs.push(X);
  }
  return xs;
};

// ---- the medics and their panels ---------------------------------------------------------------------------------
// Six health workers (covidFolk kind "medic") each carry one barrier panel in by its top rail (both hands, the panel at
// their side, its feet off the ground), walking briskly along a lane at their spot's depth, in from beyond the frame's
// edge (the widening frame reveals them). At the spot the walk winds down on planted feet, the panel swings round into
// the ring's line while it is lowered (SET frames), its feet touch the paving on the contact frame, the hands let go,
// and the worker turns to face the ring. The last contact closes the ring on CONTROL (f135).
export type WorkerPlan = { k: number; a: number; spot: [number, number]; dir: 1 | -1; side: 1 | -1; gs: number; amount: number; cycle: number; tContact: number; set: number; variant: number; yawEnd: number; phiEnd: number; finalC: [number, number] };
export type PanelState = { X: number; Z: number; phi: number; lift: number };
export type WorkerState = { X: number; Z: number; pose: CovidPose; walking: boolean; panel: PanelState; grip: number; contact: number };
const DEG = Math.PI / 180;
/** angle of the panel's centre round the ring, contact frame, walk cycle; gs = where along the panel the hands hold
 *  its top rail (panel-local, -0.5..0.5: 0 the middle; the two front panels are held near their OUTER end, so their
 *  medics end up at the ring's lower corners instead of in front of it) */
const PLAN_IN: { a: number; tContact: number; cycle: number; gs: number; amount?: number }[] = [
  { a: 180, tContact: 108, cycle: 21, gs: 0.22, amount: 2.15 },
  { a: 0, tContact: 113, cycle: 21, gs: -0.22, amount: 2.15 },
  { a: 240, tContact: 118, cycle: 21, gs: -0.2, amount: 2.15 },
  { a: 300, tContact: 123, cycle: 21, gs: 0.2, amount: 2.15 },
  { a: 120, tContact: 128, cycle: 21, gs: 0.22, amount: 2.3 },
  { a: 60, tContact: 133, cycle: 21, gs: -0.22, amount: 2.3 },
];
const angWrap = (v: number) => {
  // a panel is symmetric: its orientation is defined mod PI; pick the equivalent nearest 0
  let x = v % Math.PI;
  if (x > Math.PI / 2) x -= Math.PI;
  if (x < -Math.PI / 2) x += Math.PI;
  return x;
};
/** how far outside the rail the medic stands */
const STAND_OFF = 0.44 * U;
const planOf = (q: (typeof PLAN_IN)[number], k: number, amount: number): WorkerPlan => {
  const a = q.a * DEG;
  const phiEnd = angWrap(a + Math.PI / 2);
  const finalC: [number, number] = [RING_IN * Math.cos(a), RING_IN * Math.sin(a)];
  const g: [number, number] = [finalC[0] + q.gs * PANEL.len * Math.cos(phiEnd), finalC[1] + q.gs * PANEL.len * Math.sin(phiEnd)];
  const spot: [number, number] = [g[0] + STAND_OFF * Math.cos(a), g[1] + STAND_OFF * Math.sin(a)];
  const dir: 1 | -1 = Math.cos(a) > 0.01 ? -1 : 1;
  const side: 1 | -1 = Math.sin(a) > 0.3 ? -1 : 1;
  // the final facing: toward the ring's centre (yaw 0 = facing us, + = toward screen right, PI = away)
  const yawEnd = Math.atan2(-spot[0], spot[1]);
  return { k, a, spot, dir, side, gs: q.gs, amount, cycle: q.cycle, tContact: q.tContact, set: Math.abs(Math.sin(a)) < 0.3 ? 20 : 16, variant: k % 2, yawEnd, phiEnd, finalC };
};
const easeIO = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};
const DECEL = 14;
const PRE = 90;
/** the worker's whole track, f -PRE .. DURATION: planted-feet walk integration, then the set-down and the turn */
const trackOf = (w: WorkerPlan): WorkerState[] => {
  const tStop = w.tContact - w.set;
  const amtAt = (f: number) => w.amount * (1 - easeIO((f - (tStop - DECEL)) / DECEL));
  const phaseAt = (f: number) => (f + 3 * w.k) / w.cycle;
  const walkPose = (f: number) => POSES.walk(w.dir, phaseAt(f), Math.max(0, amtAt(f)));
  // the stance foot stays planted: the body moves by what the stance foot slides back
  const xs = integrateWalk(w.dir, phaseAt, amtAt, -PRE, DURATION, tStop);
  const shift = w.spot[0] - xs[xs.length - 1];
  const out: WorkerState[] = [];
  const Z = w.spot[1];
  // the hands' point on the rail, relative to the feet, while carrying (a little ahead, on the panel's side)
  const handOff = (f: number) => {
    const ph = phaseAt(f);
    const am = Math.max(0, amtAt(f)) / w.amount;
    return { X: 0.05 * U * w.dir, Z: w.side * 0.36 * U, phi: 0.025 * am * Math.sin(2 * Math.PI * ph), lift: 0.07 * U - 0.012 * U * am * Math.cos(4 * Math.PI * ph) };
  };
  const gEnd: [number, number] = [w.finalC[0] + w.gs * PANEL.len * Math.cos(w.phiEnd), w.finalC[1] + w.gs * PANEL.len * Math.sin(w.phiEnd)];
  const fromGrip = (gx: number, gz: number, phi: number, lift: number): PanelState => ({ X: gx - w.gs * PANEL.len * Math.cos(phi), Z: gz - w.gs * PANEL.len * Math.sin(phi), phi, lift });
  const yaw0 = 0.9 * w.dir;
  for (let f = -PRE; f <= DURATION; f++) {
    const Xw = xs[f + PRE] + shift;
    let pose: CovidPose;
    let panel: PanelState;
    let grip = 1;
    let contact = 0;
    const walking = f < tStop;
    if (walking) {
      pose = walkPose(f);
      const h = handOff(f);
      panel = fromGrip(Xw + h.X, Z + h.Z, h.phi, h.lift);
    } else {
      // standing on planted feet: the panel swings round the hands into the ring's line while it is lowered
      const u = c01((f - tStop) / w.set);
      const e = easeIO(u);
      const h = handOff(tStop);
      const gx = Xw + h.X + (gEnd[0] - (Xw + h.X)) * e;
      const gz = Z + h.Z + (gEnd[1] - (Z + h.Z)) * e;
      panel = fromGrip(gx, gz, h.phi + (w.phiEnd - h.phi) * e, h.lift * (1 - easeIO((u - 0.2) / 0.8)));
      contact = f >= w.tContact ? 1 : 0;
      const turnT = easeIO((f - tStop - 4) / (w.set + 16));
      const yaw = yaw0 + (w.yawEnd - yaw0) * turnT;
      // out of the last walk pose into the stand over a few frames (no foot or arm pop at the stop)
      pose = lerpPose(walkPose(tStop), { ...standAt(yaw), headYaw: yaw }, easeIO((f - tStop) / 9));
      grip = 1 - easeIO((f - w.tContact - 4) / 11);
    }
    out.push({ X: Xw, Z, pose, walking, panel, grip, contact });
  }
  return out;
};
/** the panel's leading tip is just beyond the frame's edge at ENTER_F: solve each medic's walking amount for it */
export const ENTER_F = 48;
const solvePlan = (q: (typeof PLAN_IN)[number], k: number): WorkerPlan => {
  let lo = 0.8;
  let hi = 3.2;
  for (let it = 0; it < 26; it++) {
    const am = (lo + hi) / 2;
    const w = planOf(q, k, am);
    const st = trackOf(w)[PRE + ENTER_F];
    const tipS = w.dir === 1 ? 0.5 : -0.5;
    const tip = toScreen(eyeAt(ENTER_F), st.panel.X + tipS * PANEL.len * Math.cos(st.panel.phi), 0, st.panel.Z);
    const off = tip ? (w.dir === 1 ? tip.x < -40 : tip.x > 1120) : true;
    if (off) hi = am;
    else lo = am;
  }
  return planOf(q, k, hi);
};
export const WORKERS: WorkerPlan[] = PLAN_IN.map((q, k) => (q.amount ? planOf(q, k, q.amount) : solvePlan(q, k)));
export const WORKER_TRACKS: WorkerState[][] = WORKERS.map(trackOf);
export const workerAt = (k: number, f: number) => WORKER_TRACKS[k][Math.max(0, Math.min(DURATION + PRE, Math.round(f) + PRE))];
/** a panel's corner (local s along it, -0.5..0.5 of its length; height Y up -) in world 3D */
export const panelPt = (p: PanelState, s: number, Y: number): [number, number, number] => [p.X + Math.cos(p.phi) * s * PANEL.len, Y - p.lift, p.Z + Math.sin(p.phi) * s * PANEL.len];

// ---- the crowd ----------------------------------------------------------------------------------------------------
export type CrowdKindName = "commuter" | "elder" | "youth" | "parent" | "child";
export type StandView = "front" | "left" | "right";
export type Person = {
  i: number;
  X: number;
  Z: number;
  kind: CrowdKindName;
  seed: number;
  view: StandView;
  /** a walker: crosses the frame at yaw ~0.9, feet planted (dir +1 = screen right), X(f) = X + dir * WALK_ADV * f */
  walk?: { dir: 1 | -1; ph: number };
  /** the frame the chest begins to kindle (-999: glowing at f0; Infinity: never) and who passed it on */
  tInf: number;
  from: number;
  /** the sprite's size tier (px, a man's height) */
  hPx: number;
  sway: number;
  /** drawn as a LIVE figure (the first ring, close at f0): "chat" stands and chats facing `toward`; "walk" chats, then
   *  walks away along its track (X per frame from f0) */
  live?: "chat" | "walk";
  toward?: 1 | -1;
  variant?: number;
  track?: number[];
  lw?: LiveWalker;
};
/** the first ring in front of the bench: well-looking, glowing, chatting, then walking off left and right */
export type LiveWalker = { kind: CrowdKindName; variant: number; X: number; Z: number; dir: 1 | -1; toward: 1 | -1; tStart: number; amount: number; cycle: number };
export const LIVE_WALKERS: LiveWalker[] = [
  { kind: "parent", variant: 0, X: 1.3 * U, Z: -2.95 * U, dir: 1, toward: -1, tStart: 10, amount: 1.25, cycle: 26 },
  { kind: "youth", variant: 1, X: -0.45 * U, Z: -2.9 * U, dir: -1, toward: 1, tStart: 18, amount: 1.2, cycle: 26 },
  { kind: "commuter", variant: 3, X: 0.45 * U, Z: -3.3 * U, dir: 1, toward: -1, tStart: 27, amount: 1.2, cycle: 27 },
  { kind: "elder", variant: 1, X: -1.4 * U, Z: -3.35 * U, dir: -1, toward: 1, tStart: 34, amount: 1.1, cycle: 28 },
];
export const lwPhase = (w: LiveWalker, f: number) => (f - w.tStart) / w.cycle;
export const lwAmount = (w: LiveWalker, f: number) => {
  // a smooth start (zero slope at both ends of the ramp): no kink as the walk takes over
  const u = c01((f - w.tStart) / 20);
  return w.amount * u * u * (3 - 2 * u);
};
const LW_TRACKS = LIVE_WALKERS.map((w) => integrateWalk(w.dir, (f) => lwPhase(w, f), (f) => lwAmount(w, f), 0, DURATION).map((x) => w.X + x));
/** a walker's speed in units per frame (the cast's walk at WALK_CYCLE 30, amount 1: 2 x 44 / 30) */
export const WALK_ADV = (2 * 44) / 30;
export const WALK_PHASES = 15;
export const KINDLE = 12;
/** the clearing round the sick (nobody stands in it): a little deeper in front, where standing figures would cover the ring */
const clearOf = (X: number, Z: number) => Math.hypot(X / (2.95 * U), Z / (Z < 0 ? 3.45 * U : 2.95 * U));
/** keep-out zones for the crowd (trees, planters, bench, the medics' lanes): filled in by the cut */
export type KeepOut = { X: number; Z: number; r: number } | { x0: number; x1: number; z0: number; z1: number };
export const KEEP_OUT: KeepOut[] = [];
/** the medics' lanes: from where each first shows (a little before) to his spot, the panel's length and side included */
export const WORKER_LANES = WORKERS.map((w) => {
  let fVis = DURATION;
  for (let f = 0; f < DURATION; f++) {
    const st = workerAt(w.k, f);
    const q = toScreen(eyeAt(f), st.X, 0, st.Z);
    if (q && q.x + 1.4 * U * q.s > -30 && q.x - 1.4 * U * q.s < 1110) {
      fVis = f;
      break;
    }
  }
  const x0 = workerAt(w.k, Math.max(0, fVis - 12)).X;
  // clear a little more in front of the lane (nearer the camera): a stander there would cover the medic on screen
  const z0 = w.spot[1] + Math.min(0, w.side * 0.36 * U) - 1.05 * U;
  const z1 = w.spot[1] + Math.max(0, w.side * 0.36 * U) + 0.5 * U;
  return { k: w.k, fVis, x0: Math.min(x0, w.spot[0]) - 1.3 * U, x1: Math.max(x0, w.spot[0]) + 1.3 * U, z0, z1 };
});
for (const l of WORKER_LANES) KEEP_OUT.push({ x0: l.x0, x1: l.x1, z0: l.z0, z1: l.z1 });
// the ground each panel sweeps while it swings into the ring's line (nobody stands where a panel passes)
for (const w of WORKERS) {
  for (let f = w.tContact - w.set; f <= w.tContact; f += 2) {
    const st = workerAt(w.k, f);
    for (let i = 0; i <= 6; i++) {
      const q = panelPt(st.panel, -0.5 + i / 6, 0);
      KEEP_OUT.push({ X: q[0], Z: q[2], r: 0.42 * U });
    }
  }
}
for (const [i, w] of LIVE_WALKERS.entries()) {
  const xs = LW_TRACKS[i];
  KEEP_OUT.push({ x0: Math.min(w.X, xs[DURATION]) - 0.6 * U, x1: Math.max(w.X, xs[DURATION]) + 0.6 * U, z0: w.Z - 0.7 * U, z1: w.Z + 0.6 * U });
}
const inKeepOut = (X: number, Z: number, pad: number) =>
  EXTRA_BENCHES.some((b) => X > b.X0 - 0.5 * U - pad && X < b.X1 + 0.5 * U + pad && Z > b.Z0 - 0.7 * U - pad && Z < b.Z1 + 0.35 * U + pad) ||
  KEEP_OUT.some((k) => ("r" in k ? Math.hypot(X - k.X, Z - k.Z) < k.r + pad : X > k.x0 - pad && X < k.x1 + pad && Z > k.z0 - pad && Z < k.z1 + pad));

const SAMPLE_FRAMES = [0, 20, 40, 60, 80, 100, 120, 140, 159];
/** a man of height h px standing at (X, Z) is (partly) in the frame at frame f */
const visibleAt = (f: number, X: number, Z: number, pad = 0) => {
  const e = eyeAt(f);
  const p = toScreen(e, X, 0, Z);
  if (!p) return false;
  const h = 312 * p.s;
  return p.x + 0.3 * h > -pad && p.x - 0.3 * h < 1080 + pad && p.y > -pad && p.y - h < 1920 + pad;
};
const segDist = (px: number, pz: number, ax: number, az: number, bx: number, bz: number) => {
  const vx = bx - ax;
  const vz = bz - az;
  const L2 = vx * vx + vz * vz;
  const t = L2 < 1e-6 ? 0 : c01(((px - ax) * vx + (pz - az) * vz) / L2);
  return Math.hypot(px - (ax + t * vx), pz - (az + t * vz));
};
const KIND_CUM: [CrowdKindName, number][] = [
  ["commuter", 0.4],
  ["elder", 0.55],
  ["youth", 0.75],
  ["parent", 0.9],
  ["child", 1],
];
const TIERS = [640, 420, 300, 220, 160, 116, 84, 60];
const tierFor = (h: number) => {
  let t = TIERS[0];
  for (const T of TIERS) if (T >= h * 0.98) t = T;
  return t;
};

const pickKind = (a: number): CrowdKindName => (KIND_CUM.find((q) => hash(a, 5) < q[1]) ?? KIND_CUM[0])[0];
export const buildCrowd = (): Person[] => {
  const people: Person[] = [];
  const MIN = 0.86 * U;
  const span = WALK_ADV * DURATION;
  let n = 0;
  const minDAt = (Z: number) => MIN * (Z < 0 ? 1.12 : 1 - 0.1 * c01(Z / (10 * U)));
  // 1) the walkers first (their swept paths need room), then 2) the standers round them
  for (let pass = 0; pass < 2; pass++) {
    const tries = pass === 0 ? 12000 : 30000;
    for (let a = 0; a < tries; a++) {
      const seedA = a + pass * 50000;
      if (pass === 0 && people.length >= 16) break;
      const X = (hash(seedA, 1) * 2 - 1) * 22 * U;
      const Z = (pass === 0 ? -4 * U : -9.5 * U) + hash(seedA, 2) * (FACADE_Z - 0.9 * U - (pass === 0 ? -4 * U : -9.5 * U));
      const isWalker = pass === 0;
      const dir: 1 | -1 = hash(seedA, 4) < 0.5 ? 1 : -1;
      if (!SAMPLE_FRAMES.some((f) => visibleAt(f, isWalker ? X + (dir * span * f) / DURATION : X, Z, 40))) continue;
      // a walker should be seen walking: in the frame for most of the cut's second half
      if (isWalker && ![90, 125, 159].every((f) => visibleAt(f, X + (dir * span * f) / DURATION, Z, -60))) continue;
      if (isWalker) {
        let bad = false;
        for (let k = 0; k <= 10; k++) {
          const x = X + (dir * span * k) / 10;
          if (clearOf(x, Z) < 1.1 || inKeepOut(x, Z, 0.25 * U)) bad = true;
        }
        if (bad) continue;
      } else if (clearOf(X, Z) < 1 || inKeepOut(X, Z, 0)) continue;
      const minD = minDAt(Z);
      const bx = isWalker ? X + dir * span : X;
      let ok = true;
      for (const p of people) {
        let d: number;
        // two walkers: a metre apart in depth, or the same way at least 3 m apart (they never meet)
        if (p.walk && isWalker) d = Math.abs(p.Z - Z) >= 1.0 * U || (p.walk.dir === dir && Math.abs(p.X - X) > 3 * U) ? Infinity : 0;
        else if (p.walk) d = segDist(X, Z, p.X, p.Z, p.X + p.walk.dir * span, p.Z);
        else if (isWalker) d = segDist(p.X, p.Z, X, Z, bx, Z);
        else d = Math.hypot(p.X - X, p.Z - Z);
        if (d < minD * (p.walk || isWalker ? 0.95 : 1)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      const vr = hash(seedA, 6);
      const view: StandView = vr < 0.5 ? "front" : vr < 0.75 ? "left" : "right";
      const kind0 = pickKind(seedA);
      people.push({ i: n++, X, Z, kind: isWalker && kind0 === "child" ? "youth" : kind0, seed: Math.floor(hash(seedA, 7) * 24), view, walk: isWalker ? { dir, ph: Math.floor(hash(seedA, 8) * WALK_PHASES) } : undefined, tInf: Infinity, from: -1, hPx: 0, sway: hash(seedA, 9) * 6.283 });
    }
  }
  // the live first ring: the walkers in front of the bench, and the nearest standers behind it chat
  LIVE_WALKERS.forEach((w, k) => {
    people.push({ i: n++, X: w.X, Z: w.Z, kind: w.kind, seed: w.variant, view: "front", tInf: Infinity, from: -1, hPx: 160, sway: k * 1.7, live: "walk", toward: w.toward, variant: w.variant, track: LW_TRACKS[k], lw: w });
  });
  const behind = people.filter((p) => !p.live && !p.walk && p.Z > 2.5 * U && Math.abs(p.X) < 2.9 * U).sort((a, b) => Math.hypot(a.X, a.Z) - Math.hypot(b.X, b.Z)).slice(0, 5);
  for (const p of behind) {
    const others = behind.filter((q) => q !== p);
    const near = others.sort((a, b) => Math.hypot(a.X - p.X, a.Z - p.Z) - Math.hypot(b.X - p.X, b.Z - p.Z))[0];
    p.live = "chat";
    p.toward = near && near.X < p.X ? -1 : 1;
    p.variant = ((p.seed % 4) + 4) % 4;
  }
  // sizes: the tier each person keeps all shot (no tier pops), from the largest he is drawn
  for (const p of people) {
    let hmax = 0;
    for (let f = 0; f < DURATION; f += 4) {
      const X = walkerX(p, f);
      const q = toScreen(eyeAt(f), X, 0, p.Z);
      if (q && visibleAt(f, X, p.Z, 40)) hmax = Math.max(hmax, 312 * q.s);
    }
    p.hPx = tierFor(Math.max(40, hmax));
  }
  return people;
};
export const walkerX = (p: Person, f: number) => {
  if (p.track) {
    const i = Math.max(0, Math.min(p.track.length - 2, Math.floor(f)));
    return p.track[i] + (p.track[i + 1] - p.track[i]) * Math.max(0, Math.min(1, f - i));
  }
  return p.walk ? p.X + p.walk.dir * WALK_ADV * f : p.X;
};

// ---- the wave -----------------------------------------------------------------------------------------------------
/** the wave front's speed (units per frame) through the crowd, person to person */
export const WAVE_V = 0.2 * U;
export const WAVE_START = 1;
export const spreadWave = (people: Person[]) => {
  const N = people.length;
  // the first ring: everyone close round the sick is already glowing at f0
  const byR = people.map((p) => ({ p, r: Math.hypot(p.X, p.Z) })).sort((a, b) => a.r - b.r);
  const live = people.filter((p) => p.live);
  const seeds = [...live, ...byR.filter((q) => !q.p.live).slice(0, Math.max(0, 11 - live.length)).map((q) => q.p)];
  const t = new Float64Array(N).fill(Infinity);
  const from = new Int32Array(N).fill(-1);
  for (const s of seeds) t[s.i] = -999;
  // a few are never infected (the front stays ragged)
  const immune = (i: number) => hash(i, 61) < 0.07 && !seeds.some((s) => s.i === i);
  const done = new Uint8Array(N);
  const startOf = (i: number) => (t[i] < 0 ? WAVE_START + 5 * hash(i, 41) : t[i] + KINDLE * 0.5);
  for (;;) {
    let bi = -1;
    let bt = Infinity;
    for (let i = 0; i < N; i++)
      if (!done[i] && t[i] < bt) {
        bt = t[i];
        bi = i;
      }
    if (bi < 0 || !Number.isFinite(bt)) break;
    done[bi] = 1;
    const a = people[bi];
    const t0 = startOf(bi);
    for (let j = 0; j < N; j++) {
      if (done[j] || j === bi || immune(j)) continue;
      const b = people[j];
      const fa = Math.max(0, t0);
      const d = Math.hypot(walkerX(a, fa) - walkerX(b, fa), a.Z - b.Z);
      if (d > 2.9 * U) continue;
      if (hash(bi * 977 + j, 43) < 0.2) continue;
      const tt = t0 + (d / WAVE_V) * (0.7 + 0.9 * hash(bi * 31 + j, 47)) + 2 * hash(j, 53);
      if (tt < t[j]) {
        t[j] = tt;
        from[j] = bi;
      }
    }
  }
  for (const p of people) {
    p.tInf = t[p.i];
    p.from = from[p.i];
  }
  return people;
};
