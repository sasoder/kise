// ---------------------------------------------------------------------------
// allAboutEnergyStateV2: the cold-review V2 of cut D's timing (AllAboutEnergyV2). It imports the delivered state
// (allAboutEnergyState.ts, untouched) and overrides only what happens BEFORE the join: from f238 on every value
// here is the delivered one, and at f240 the frame is the delivered f240 pixel for pixel (cut E opens on it).
//
// What V2 changes (all before ~f232):
// - The heap starts at ZERO: the first kernels land at f126, thrown by carrier 0 (no earlier day's heap).
// - Carrier 1 comes ~32 frames earlier (picks at f63 instead of f95) and takes over: carrier 0 shakes f112-155,
//   carrier 1 f140-228, their throws overlapping f140-150 so the heap's growth speeds up into "efficiently" (f153).
//   Carrier 0 then waits, facing home, until his delivered walk back (f192); carrier 1 shakes longer and lowers at
//   f228 exactly as delivered.
// - Carrier 1's last kernels land on "energy" (f225): the heap is complete there (the delivered f238 amount) and
//   holds until the delivered schedule's next sheaf (carrier 2, from f232) lands from f242.
// - The kernels fly 14 frames (not 10) on scattered, varied ballistic arcs out of the shaken ears.
// - The close-up camera widens to keep both shakers in shot, and blends back to the delivered camera by f230.
// ---------------------------------------------------------------------------
import { runCamera, type Cam, type CamKey } from "./firstFarmersShared";
import { CAM_KEYS, CARRY_V, HEAP, LEGS, LOWER, RAISE, SHAKE, camAt, heapAmount, shakeOf, type Leg } from "./allAboutEnergyState";

export * from "./allAboutEnergyState";

/** from this frame on, the heap's amount and its kernels in flight are the delivered ones */
export const V2_JOIN = 238;
/** the V2 throws' flight (frames) */
export const V2_FLIGHT = 12;


/** a shake: carrier c at (x, y); the sheaf shaken from t0 for `dur` frames (motion), its kernels leave over
 *  [t0, outEnd), `yield` = share of the full heap, `flight` = frames in the air */
export type ShakeV2 = { n: number; c: number; x: number; y: number; t0: number; dur: number; outEnd: number; yield: number; flight: number };
const S0 = shakeOf(0);
const S1 = shakeOf(1);
/** V2's first two shakes (carriers 0 and 1, the delivered spots); shakes 2.. are the delivered ones */
export const SHAKE0_V2: ShakeV2 = { n: 0, c: S0.c, x: S0.x, y: S0.y, t0: 112, dur: 43, outEnd: 150, yield: 0.2, flight: V2_FLIGHT };
export const SHAKE1_V2: ShakeV2 = { n: 1, c: S1.c, x: S1.x, y: S1.y, t0: 140, dur: 88, outEnd: 213, yield: 0.31, flight: V2_FLIGHT };
export const shakeV2 = (n: number): ShakeV2 => {
  if (n === 0) return SHAKE0_V2;
  if (n === 1) return SHAKE1_V2;
  const s = shakeOf(n);
  return { n, c: s.c, x: s.x, y: s.y, t0: s.t0, dur: SHAKE, outEnd: s.t0 + SHAKE, yield: 0.24, flight: HEAP.flight };
};
// the hand-off must land exactly on the delivered heap: 0.2 + 0.31 = the delivered amount at f238
if (Math.abs(SHAKE0_V2.yield + SHAKE1_V2.yield - heapAmount(V2_JOIN)) > 1e-9) throw new Error(`V2 heap does not meet the delivered heap at f${V2_JOIN}`);
if (SHAKE1_V2.outEnd + SHAKE1_V2.flight > V2_JOIN || SHAKE1_V2.t0 + SHAKE1_V2.dur !== shakeOf(1).t0 + SHAKE) throw new Error("V2 shake 1 must end as delivered");

/** V2's throws come in handfuls: a burst on each of the three shakes of the sheaf (the shake's own phase, as
 *  raisedR swings it) over a thin trickle, times an envelope (carrier 1's grows: a larger share lands late, so the
 *  heap still swells in the wide into "energy"). out(f) = share of the sheaf's yield out by frame f (leave time). */
const STEP = 0.05;
const outTable = (s: ShakeV2, env: (u: number) => number) => {
  const n = Math.ceil((s.outEnd - s.t0) / STEP);
  const cum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const f = s.t0 + (i + 0.5) * STEP;
    const um = (f - s.t0) / s.dur;
    const uo = (f - s.t0) / (s.outEnd - s.t0);
    cum[i + 1] = cum[i] + (0.12 + Math.sin(3 * Math.PI * um) ** 4) * env(uo) * STEP;
  }
  const total = cum[n];
  return (f: number) => {
    const x = (f - s.t0) / STEP;
    if (x <= 0) return 0;
    if (x >= n) return 1;
    const i = Math.floor(x);
    return (cum[i] + (cum[i + 1] - cum[i]) * (x - i)) / total;
  };
};
// finish pass: the first sheaf starts slow (a small pile, growing toss by toss: its height grows ~linearly)
const OUT0 = outTable(SHAKE0_V2, (u) => 0.08 + 1.9 * u);
const OUT1 = outTable(SHAKE1_V2, (u) => 0.35 + 1.3 * u);
/** how much of V2 shake n's sheaf has come out by frame f (0..1), or null for a delivered shake */
export const outOfV2 = (n: number, f: number): number | null => (n === 0 ? OUT0(f) : n === 1 ? OUT1(f) : null);
/** the heap's amount at frame f (landed share of the full heap): V2 before the join, the delivered one after */
export const heapAmountV2 = (f: number) => {
  if (f >= V2_JOIN) return heapAmount(f);
  const a = SHAKE0_V2.yield * OUT0(f - SHAKE0_V2.flight) + SHAKE1_V2.yield * OUT1(f - SHAKE1_V2.flight);
  return Math.min(1, Math.max(0, a));
};
/** the shakes whose sheaf is giving kernels at frame f (leave time) */
export const throwingAt = (f: number): ShakeV2[] => {
  const out: ShakeV2[] = [];
  for (let n = 0; n < 40; n++) {
    const s = shakeV2(n);
    if (s.t0 > f) break;
    if (f >= s.t0 && f < s.outEnd) out.push(s);
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE CARRIERS' LEGS: the delivered legs with carriers 0 and 1 re-timed before the join
// ---------------------------------------------------------------------------
const patch = (c: number, L: Leg[]): Leg[] => {
  if (c === 0) {
    // shake 0 shorter: lower at f155, turn home, wait facing home until the delivered walk back (f192)
    const out: Leg[] = [];
    for (const l of L) {
      if (l.kind === "shake" && l.n === 0) {
        const end = SHAKE0_V2.t0 + SHAKE0_V2.dur + LOWER;
        out.push({ ...l, t1: end });
        out.push({ kind: "turnL", t0: end, t1: end + 14, x: l.x, y: l.y });
        out.push({ kind: "wait", t0: end + 14, t1: 192, x: l.x, y: l.y, dir: -1 });
      } else if (l.kind === "turnL" && l.t0 === shakeOf(0).t0 + SHAKE + LOWER) {
        continue; // the delivered turn after shake 0 (f178) is replaced above
      } else out.push(l);
    }
    return out;
  }
  if (c === 1) {
    // carrier 1 picks 32 frames earlier and shakes from f140 to the delivered f228
    // finish pass: he binds out on the lane, clear of the stooks (BINDER1_V2), and follows carrier 0 to the heap
    const sh = SHAKE1_V2;
    const raise0 = sh.t0 - RAISE; // 128
    const [bx, by] = BINDER1_V2;
    const walk = Math.round((476 - bx) / CARRY_V);
    const w0 = raise0 - walk;
    return L.flatMap((l): Leg[] => {
      if (l.kind === "wait" && l.bind && l.t1 > -60 && l.t1 < 200) return [{ ...l, x: bx, y: by, t1: w0 - 14 - 26 }];
      if (l.kind === "pick" && l.take < 0 && l.t0 > -60 && l.t0 < 200) return [{ ...l, x: bx, y: by, t0: w0 - 14 - 26, t1: w0 - 14 }];
      if (l.kind === "turnR" && l.t0 > -60 && l.t0 < 200 && l.t1 <= 140) return [{ ...l, x: bx, y: by, t0: w0 - 14, t1: w0 }];
      if (l.kind === "walkR" && l.t0 > -60 && l.t0 < 200 && l.t1 <= 170) return [{ ...l, x0: bx, y0: by, t0: w0, t1: raise0 }];
      if (l.kind === "shake" && l.n === 1) return [{ ...l, t0: raise0 }];
      return [l];
    });
  }
  if (c === 2) {
    // binder 2 binds out of the cluster at the stooks (round 2: the f84-99 tangle) and walks the longer way to his
    // delivered spot, arriving at the delivered f220
    const at = BINDER2_V2;
    const walk = Math.round((548 - at[0]) / 4.14);
    const w1 = 220;
    const w0 = w1 - walk;
    return L.flatMap((l): Leg[] => {
      if (l.kind === "wait" && l.bind && l.t1 > 0 && l.t1 < 230) return [{ ...l, x: at[0], y: at[1], t1: w0 - 14 - 26 }];
      if (l.kind === "pick" && l.take < 0 && l.t0 > 0 && l.t0 < 230) return [{ ...l, x: at[0], y: at[1], t0: w0 - 14 - 26, t1: w0 - 14 }];
      if (l.kind === "turnR" && l.t0 > 0 && l.t0 < 230 && l.t1 <= 215) return [{ ...l, x: at[0], y: at[1], t0: w0 - 14, t1: w0 }];
      if (l.kind === "walkR" && l.t0 > 0 && l.t0 < 230 && l.t1 <= 221) return [{ ...l, x0: at[0], y0: at[1], t0: w0, t1: w1 }];
      return [l];
    });
  }
  return L;
};
/** finish pass: where carrier 1 binds before his first trip (the delivered (372, -8) sat in the stook cluster) */
export const BINDER1_V2: [number, number] = [40, 118];
/** round 2: where binder 2 binds before his first trip (the delivered (505, -104) sat in the stook cluster) */
export const BINDER2_V2: [number, number] = [250, -100];
export const LEGS_V2: Leg[][] = LEGS.map((L, c) => patch(c, L));

// ---------------------------------------------------------------------------
// THE CAMERA: wider over the hand-off (both shakers and the heap in shot), then the delivered pull-back;
// blended into the delivered camera over f200-230, so from f230 it IS the delivered camera
// ---------------------------------------------------------------------------
export const CAM_KEYS_V2: CamKey[] = [
  // round 2: open close on the lead reaper, then ease back and right so the echelon and then the rows of stooks
  // come in (the harvest's abundance builds by reveal)
  { f: 0, x: -232, y: 6, k: 2.05 },
  { f: 56, x: 30, y: 44, k: 1.5 },
  // finish pass: right of the field's end (no stubs at the left edge) and low enough that the longhouse is
  // cropped decisively (its walls only) until the camera opens out
  { f: 112, x: 915, y: 150, k: 1.6 },
  { f: 126, x: 935, y: 140, k: 1.5 },
  { f: 146, x: 880, y: 110, k: 1.12 },
  ...CAM_KEYS.filter((q) => q.f >= 196),
];
const sm = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * (3 - 2 * x);
};
export const camAtV2 = (f: number): Cam => {
  const w = sm((f - 200) / 30);
  if (w >= 1) return camAt(f);
  const a = runCamera(CAM_KEYS_V2, f);
  const b = camAt(f);
  return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w, k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * w) };
};
