// ---------------------------------------------------------------------------
// slavesInTheWorkshopPlan: the numbers of cut D (SlavesInTheWorkshop, kyle-rome-slavery cut 33), Revision 1. Pure
// functions of the cut's own frame f (0..142), in cut C's local stage coordinates (./marketWorkshopWorld, read only):
// X across (the seam at X = 0), Y height (floor Y = 0, up is - Y), Z depth behind the front edge.
//   - the slabs: split 1 -> 0 over f0-30 (one smootherstep, no bump), the crack heals back to front f30-46
//   - the walkers: FOOTSTEPS planted in 3D (each foot fixed on the floor / the treads while it bears weight, swung
//     to its next foothold in one eased arc), the hip a smooth track through the feet's midpoints, the walk phase
//     from the step times (so the heel peel and arm swing match the plants)
//   - the sit: one eased timeline (stand -> turned to face us, back to the stool -> seated at the wheel), the feet
//     stepping to the wheel, the hips landing on the seat on the contact frame
//   - the throwing pulls, the wheel spin-up, the camera (C's own camera continued, one push-in lobe, a gentle creep)
// ---------------------------------------------------------------------------
import { C_END, FRONT_STATIONS, MAIN_SLAVE, PLATFORM, STEPS, WAITING, cutCCamBase, mainSlavePose, waitingPose } from "./marketWorkshopWorld";
import { POTTER, track } from "./romeCast";
import type { Cam } from "../kits/maps/incaShared";

export const DURATION = 143;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
export const smoother = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** cut C's ambient frame: the life runs on from C's f210 */
export const G = (f: number) => C_END.frame + f;

// ---------------------------------------------------------------------------
// THE SLABS
// ---------------------------------------------------------------------------
export const CLOSE: readonly [number, number] = [0, 30];
export const splitAt = (f: number) => (f <= CLOSE[0] ? 1 : 1 - smoother((f - CLOSE[0]) / (CLOSE[1] - CLOSE[0])));
export const HEAL: readonly [number, number] = [30, 46];
export const seamAt = (f: number) => (f <= HEAL[0] ? 1 : 1 - ease((f - HEAL[0]) / (HEAL[1] - HEAL[0])));
/** V3 (the air): the floor continues toward the camera out of the dense air once the slabs touch (f26 -> f92, under
 *  the push-in), so the landing is floor to the bottom edge with a little soft near foreground */
export const FRONT: readonly [number, number] = [26, 92];
export const frontAt = (f: number) => smoother((f - FRONT[0]) / (FRONT[1] - FRONT[0]));
/** the rack's last bowls come down while they walk in */
export const stackAt = (f: number) => (f <= 20 ? C_END.stack : mix(C_END.stack, 1, ease((f - 20) / 100)));

// ---------------------------------------------------------------------------
// THE SEATS (the two front stations: D_STATIONS.md; facing right, the wheel to the potter's right)
// ---------------------------------------------------------------------------
export type Seat = { X: number; Z: number; dir: 1 | -1; variant: number };
const stationDir = (i: number) => ((FRONT_STATIONS[i] as { dir?: 1 | -1 }).dir ?? -1) as 1 | -1;
/** C's stations once they carry dir 1 (D_STATIONS); until then D's own copy of those numbers (preview only) */
export const C_HAS_D_STATIONS = stationDir(0) === 1 && stationDir(1) === 1;
/** the fettered man, who goes down first, takes the front seat (along the front); the chalk-footed man, behind him,
 *  crosses behind to the second seat, so their paths part instead of running side by side */
export const SEATS: { main: Seat; wait: Seat } = C_HAS_D_STATIONS
  ? { main: { ...FRONT_STATIONS[1], dir: 1 }, wait: { ...FRONT_STATIONS[0], dir: 1 } }
  : { main: { X: 80, Z: 250, dir: 1, variant: 1 }, wait: { X: 70, Z: 70, dir: 1, variant: 0 } };
export const seatPlace = (s: Seat) => ({ feet: s.X, wheel: s.X + s.dir * POTTER.wheelDX, stool: s.X + s.dir * POTTER.stoolDX });

// ---------------------------------------------------------------------------
// THE GROUND (left half: the catasta's top and its three treads; the floor elsewhere)
// ---------------------------------------------------------------------------
export const groundY = (X: number, Z: number) => {
  let y = 0;
  if (X >= PLATFORM.X0 && X <= PLATFORM.X1 && Z >= PLATFORM.Z0 && Z <= PLATFORM.Z1) y = -PLATFORM.H;
  for (const s of STEPS) if (X >= s.X0 && X <= s.X1 && Z >= s.Z0 && Z <= s.Z1) y = Math.min(y, s.top);
  return y;
};

// ---------------------------------------------------------------------------
// FOOTSTEPS
// ---------------------------------------------------------------------------
export type V3 = [number, number, number];
export type Foot = "L" | "R";
export type Plant = { foot: Foot; p: V3; t: number };
const v3 = (X: number, Z: number, Y?: number): V3 => [X, Y ?? groundY(X, Z), Z];
const lerp3 = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const mid3 = (a: V3, b: V3): V3 => lerp3(a, b, 0.5);

/** a walk: the start feet, then footholds (X, Z; Y from the ground unless given) alternating from `first`; any gap
 *  between consecutive footholds longer than maxStep (3D) is split on the line between them. Each step takes T frames
 *  (the first one a little longer: he sets off), the first lift at t0. */
export const makeWalk = (o: { startHip: V3; startL: V3; startR: V3; first: Foot; holds: [number, number, number?][]; maxStep: number; t0: number; T: number }) => {
  // a hold is [X, Z, duration factor (default 1; a tread-to-tread step is quicker)]
  // expand the holds so that no step (the distance between the planted foot and the new foothold) exceeds maxStep
  const plants: Plant[] = [];
  let cur: Record<Foot, V3> = { L: o.startL, R: o.startR };
  let foot = o.first;
  const other = (ft: Foot): Foot => (ft === "L" ? "R" : "L");
  let t = o.t0;
  const push = (p: V3, fac: number) => {
    const dur = (plants.length === 0 ? o.T * 1.25 : o.T) * fac;
    t += dur;
    plants.push({ foot, p, t });
    cur = { ...cur, [foot]: p };
    foot = other(foot);
  };
  for (const h of o.holds) {
    const target = v3(h[0], h[1]);
    const fac = h[2] ?? 1;
    // a step longer than maxStep (from the planted foot) is split into equal steps on the line to the hold
    const planted = cur[other(foot)];
    const d = Math.hypot(target[0] - planted[0], target[1] - planted[1], target[2] - planted[2]);
    const n = Math.max(1, Math.ceil(d / o.maxStep));
    for (let k = 1; k < n; k++) {
      const q = lerp3(planted, target, k / n);
      push(v3(q[0], q[2]), fac);
    }
    push(target, fac);
  }
  // the hip: through the feet's midpoint at each plant (both feet down), held at the ends
  const keys: [number, V3][] = [[o.t0, o.startHip]];
  let cL = o.startL;
  let cR = o.startR;
  for (const pl of plants) {
    if (pl.foot === "L") cL = pl.p;
    else cR = pl.p;
    keys.push([pl.t, mid3(cL, cR)]);
  }
  const hipT = [0, 1, 2].map((c) => track(keys.map(([kt, p]) => [kt, p[c]] as [number, number])));
  const tEnd = plants[plants.length - 1].t;
  // before he sets off: exactly where cut C put him (no spline round-off at f0)
  const hip = (f: number): V3 => (f <= o.t0 ? o.startHip : [hipT[0](f), hipT[1](f), hipT[2](f)]);
  /** a foot's 3D position (and its lift above its line, units) at f */
  const footAt = (ft: Foot, f: number): { p: V3; swing: number } => {
    let prev: V3 = ft === "L" ? o.startL : o.startR;
    let lift = o.t0;
    for (let i = 0; i < plants.length; i++) {
      const pl = plants[i];
      if (pl.foot !== ft) continue;
      // it leaves the floor when the other foot has just landed (or at the first lift)
      let li = o.t0;
      for (let j = i - 1; j >= 0; j--)
        if (plants[j].foot !== ft) {
          li = plants[j].t + 1;
          break;
        }
      lift = li;
      if (f < lift) return { p: prev, swing: 0 };
      if (f < pl.t) {
        const v = (f - lift) / (pl.t - lift);
        const e = smoother(v);
        const p = lerp3(prev, pl.p, e);
        const drop = Math.max(0, prev[1] - pl.p[1]);
        const H = 11 + 0.15 * drop;
        return { p: [p[0], p[1] - H * Math.sin(Math.PI * v), p[2]], swing: v };
      }
      prev = pl.p;
    }
    return { p: prev, swing: 0 };
  };
  /** the walk phase (walkPose: the L foot lands at whole phases, the R foot at halves): a smooth (C1) track through
   *  the footfalls, so a change of step length (the treads, the floor) does not kink the heel peel or the arm swing */
  // plant i lands at phase (first R: 0.5, 1, 1.5, ...; first L: 1, 1.5, ...): L on whole phases, R on halves
  const phs = plants.map((_, i) => (plants[0].foot === "R" ? 0.5 : 1) + 0.5 * i);
  const phaseT = track([[o.t0, phs[0] - 0.5], ...plants.map((pl, i) => [pl.t, phs[i]] as [number, number])]);
  const phaseAt = (f: number) => phaseT(f);
  /** 0 standing .. 1 walking (in over the first step, out over the last) */
  const amountAt = (f: number) => {
    const t1 = plants[0].t;
    const tl = plants.length > 1 ? plants[plants.length - 2].t : o.t0;
    return Math.min(smoother((f - o.t0) / (t1 - o.t0)), 1 - smoother((f - tl) / (tEnd - tl)));
  };
  return { plants, hip, footAt, phaseAt, amountAt, tEnd, t0: o.t0 };
};
export type Walk = ReturnType<typeof makeWalk>;

// ---------------------------------------------------------------------------
// THE TWO WALKERS
// ---------------------------------------------------------------------------
/** the start feet in 3D: C's own pose's feet (figure units = world units at his depth) */
const startFeet = (X: number, Y: number, Z: number, footL: [number, number], footR: [number, number]) => ({
  startHip: [X, Y, Z] as V3,
  startL: [X + footL[0], Y + footL[1], Z] as V3,
  startR: [X + footR[0], Y + footR[1], Z] as V3,
});
const mainStart = startFeet(MAIN_SLAVE.X, MAIN_SLAVE.Y, MAIN_SLAVE.Z, mainSlavePose(C_END.frame).footL, mainSlavePose(C_END.frame).footR);
const waitStart = startFeet(WAITING[0].X, WAITING[0].Y, WAITING[0].Z, waitingPose(0, C_END.frame).footL, waitingPose(0, C_END.frame).footR);
/** where he stops: just in front of his stool (its front edge is ~25 in front of the seat), to sit straight back */
const seatStand = (s: Seat) => [s.X + 2, s.Z - 32] as [number, number];

/** the head lifts, he turns (TURN), then sets off (t0) */
export const TURN = { main: [24, 34] as const, wait: [2, 10] as const };
export const WALKS = {
  // the chalk-footed slave: to the platform's front, down the steps by the middle tread (their left side), across the seam, to the
  // second seat. His first foot leaves the floor at f32, just after the slabs touch (his first footfall f44).
  main: makeWalk({
    ...mainStart,
    first: "R",
    maxStep: 94,
    t0: 32,
    T: 10,
    holds: [
      // the left lane of the steps (the fettered man is on the right lane ahead of him), crossing them on a diagonal
      [-146, 100],
      [-112, 52],
      [-82, 10],
      // one straight line back into the workshop to the second seat, behind the fettered man (who keeps to the front)
      [seatStand(SEATS.main)[0], seatStand(SEATS.main)[1]],
    ],
  }),
  // the fettered slave (the chain: no step longer than ~70 between his feet): from the head of the steps down a tread
  // at a time (quicker, shorter steps), across the seam, along the front to the front seat
  wait: makeWalk({
    ...waitStart,
    first: "R",
    maxStep: 70,
    t0: 8,
    T: 10.5,
    holds: [
      [-100, 96],
      [-92, 70, 0.75],
      [-84, 50, 0.75],
      [-76, 30, 0.75],
      [-66, 9, 0.8],
      // along the front of the workshop to the front seat (short fettered steps)
      [-28, 14, 0.86],
      [22, 18, 0.9],
      [seatStand(SEATS.wait)[0], seatStand(SEATS.wait)[1], 0.9],
    ],
  }),
};
export type Who = keyof typeof WALKS;

/** the sit: starts as the last foot lands, one timeline, the hips on the seat on the contact frame */
export const SIT_LEN = 20;
export const sitStart = (who: Who) => WALKS[who].tEnd;
export const sitContact = (who: Who) => sitStart(who) + SIT_LEN;

// ---------------------------------------------------------------------------
// THE THROWING
// ---------------------------------------------------------------------------
/** each pull: the hands rise up the wall [a, b], then come back down to its foot (5 frames) */
export const pullsOf = (who: Who): [number, number][] => {
  const c = sitContact(who);
  return [
    [c + 1, c + 13],
    [c + 18, c + 32],
    [c + 37, c + 53],
  ];
};
export const bowlForm = (who: Who, f: number) => pullsOf(who).reduce((m, [a, b]) => m + ease((f - a) / (b - a)) / 3, 0);
export const handRise = (who: Who, f: number) => {
  const P = pullsOf(who);
  for (let i = 0; i < P.length; i++) {
    const [a, b] = P[i];
    if (f < a) return i > 0 ? 1 - ease((f - P[i - 1][1]) / 5) : 0;
    if (f <= b) return ease((f - a) / (b - a));
  }
  return 1 - 0.25 * ease((f - P[P.length - 1][1]) / 12);
};
/** the wheel: still (C's 0.15) until he is nearly down, kicked up to speed */
export const wheelTurn = (who: Who, f: number) => {
  const t0 = sitContact(who) - 3;
  const rate = 1 / 26;
  const x = f - t0;
  if (x <= 0) return 0.15;
  const ramp = 12;
  return 0.15 + (x < ramp ? (rate * x * x) / (2 * ramp) : rate * (x - ramp / 2));
};

// ---------------------------------------------------------------------------
// THE CAMERA: C's own camera runs on (its last lobes end in D's f50); one push-in lobe takes it to the landing on
// the two seats, then a gentle creep
// ---------------------------------------------------------------------------
const lobe = (a: number, b: number) => (f: number) => {
  const L2 = b - a;
  const x = Math.max(0, Math.min(L2, f - a));
  return (x - (L2 / (2 * Math.PI)) * Math.sin((2 * Math.PI * x) / L2)) / L2;
};
export const CAM = {
  /** landed (~f100): the two new potters in the lower-middle foreground (the front one's feet <= y ~1040), the
   *  workshop opening up beyond them (the rows of potters, the kiln, the rack of orange bowls) */
  k1: 1.9,
  cx1: 200,
  cy1: -94,
  /** the creep, to the last frame */
  k2: 1.96,
  cx2: 206,
  cy2: -92,
  push: [20, 102] as const,
  creep: [80, 142] as const,
};
const uPush = lobe(...CAM.push);
const creep = (f: number) => {
  const [a, b] = CAM.creep;
  const x = c01((f - a) / (b - a));
  return x * x;
};
export const camBase = (f: number): Cam => {
  const c = cutCCamBase(G(f));
  const w = uPush(f);
  const s = creep(f);
  // exact at f0 (w = s = 0): C's camera itself
  const k = c.k * Math.exp(w * (Math.log(CAM.k1) - Math.log(c.k)) + s * (Math.log(CAM.k2) - Math.log(CAM.k1)));
  return { k, cx: mix(c.cx, CAM.cx1, w) + s * (CAM.cx2 - CAM.cx1), cy: mix(c.cy, CAM.cy1, w) + s * (CAM.cy2 - CAM.cy1) };
};
