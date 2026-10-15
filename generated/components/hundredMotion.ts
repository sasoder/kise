// ---------------------------------------------------------------------------
// hundredMotion: HundredAgainstHundredThousand (the clip
// "Sheppard_Cajamarca_infinite_KD") -- every moving thing as pure maths (no
// React), so the check scripts read the exact motion the component draws. See
// HundredAgainstHundredThousand.tsx's header for the words, the gestures, the
// counts and the sources. All positions are in the Cajamarca local plan
// (metres, x east, y south; incaShared), time in frames at 24 fps.
//   the world     read-only: incaShared (PLAZA, ROAD_TO_CAMP, the camera
//                 runners), vastArmyMotion (the settled 80,000 and its road
//                 frame), ambushMotion (the 6,000 in the square, CROWD0, and
//                 the 168 at their posts, SPANIARDS[].stand)
//   the camera    one C1 track: ln k and the plaza's screen point are each the
//                 integral of cosine-tapered velocity bumps (makeTrack) on the
//                 same windows, anchored on the plaza's box centre
//   the plaza     6,000 cream: a death front leaves the hall fronts, the gate
//                 foot and the platform on f117 and closes on the middle by
//                 ~f140; 4,800 fall where they stand; 1,200 press out through
//                 the two gates, 600 of them fall at the street mouths
//   the riders    the 62 horse leave their halls, ride out of the plaza beside
//                 the platform on its open-country side (~f117) and gallop
//                 east in three loose groups (north wing / the road / south
//                 wing) through the three divisions, slowing to a halt at the
//                 end of the half league (~2.85 km)
//   the plain     the settled 80,000 breathing (stragglers still arriving);
//                 2,600 fall in the riders' corridors (within 25 m of a
//                 rider's path, thick near the town and thinning outward);
//                 the rest within ~80 m flee sideways 30-80 m (an eased,
//                 smoothed field); the army starts to stream back east
// ---------------------------------------------------------------------------
import { INK_CONTEXT, INK_FULL, PLAZA, SCREEN_CX, SCREEN_CY, clamp01, hash, makeTrack, packCrowd, pchip, pointInPoly, smoothstep, smootherstep, type Bump, type Cam, type Gate, type Hall, type P2 } from "./incaShared";
import { A_KIND, N_ARMY, PLAZA_C, armyProgress, armySD, frameAt, ih } from "./vastArmyMotion";
import { CROWD0, LITTER, N_CROWD, SPANIARDS as AMB } from "./ambushMotion";
import { DEAD_EASE_F, DEAD_FALL_M } from "./hundredShared";

// ---------------------------------------------------------------------------
// TIMELINE. In-point 7.54 s on the edit timeline (the SRT); word onsets from
// the word-level re-transcription; f = round((t - 7.54) * 24).
// "encounter" ends 16.54 s: round((16.54 - 7.54) * 24) = round(9.00 * 24) =
// 216, + the 16-frame house tail = 232 frames (f0..f231).
// ---------------------------------------------------------------------------
export const FPS = 24;
export const IN_POINT = 7.54;
export const DURATION = 232;
export const LAST = DURATION - 1;
export const W = {
  hundred: 0,
  something: 8,
  against: 17,
  almost: 32,
  hundredK: 40, // "100,000" (ends f57)
  hundredKEnd: 57,
  what: 61,
  is: 65,
  astonishing: 67,
  is2: 79,
  that: 93,
  these: 96,
  hundred2: 101,
  conquistadors: 105,
  kill: 119,
  close: 128,
  to: 134,
  tenK: 136, // "10,000"
  of: 149,
  the: 154,
  enemy: 156, // ends f161
  they: 165,
  suffer: 169,
  zero: 174,
  casualties: 180, // ends f191
  this: 191,
  is3: 196,
  the2: 197,
  first: 200,
  encounter: 205, // ends f216
  lineEnd: 216,
};

// ---------------------------------------------------------------------------
// small maths
// ---------------------------------------------------------------------------
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
const dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1];
const len = (a: P2) => Math.hypot(a[0], a[1]);
const unit = (a: P2): P2 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const segDist = (p: P2, a: P2, b: P2) => {
  const ab = sub(b, a);
  const t = clamp01(dot(sub(p, a), ab) / (dot(ab, ab) || 1));
  return len(sub(p, add(a, mul(ab, t))));
};
/** the integral of smoothstep(x / T) from 0 (a C1 start from rest into unit speed) */
const rampInt = (x: number, T: number) => {
  if (x <= 0) return 0;
  if (x >= T) return x - T / 2;
  const z = x / T;
  return T * (z * z * z - (z * z * z * z) / 2);
};

// ---------------------------------------------------------------------------
// THE CAMERA (revision 2: one track, five moves, at most two zoom reversals,
// >= 80 f apart). The plaza's box centre PLAZA_C is the anchor: its screen
// point P = (px, py) and ln k are each the integral of cosine-tapered
// velocity bumps (makeTrack, C1). cx = PLAZA_C.x - (px - 540) / k.
//   creep     f-120..20  the pre-roll (f-91..-1, played by the cut before this
//                        one: f0 IS A JOIN FRAME): a 3.5 % creep in (to f6)
//                        and the plaza drifting left; still moving on f0
//   1 pull    f1..42     k 2.0 -> 0.2 ("against almost 100,000"), the plaza
//                        gliding to (200, 764): the army fills the frame to
//                        the right and runs off it (the camp off the edge)
//   2 breath  f44..80    a 3 % creep in (the first reversal, ~f43)
//   3 push    f70..118   k -> 2.2 onto the plaza, its box centre at (460, 835),
//                        landing ~f114
//   4 kill    f108..140  a 3 % creep in while the front crosses the square;
//             f126..168  then the follow: k -> 0.62 with a pan east (the
//                        second reversal, ~f127), the plaza to (300, 625), the
//                        riders' lanes through the front division at the right
//   5 hold    f160..200  a slow creep on out (no reversal) through "zero"
//   6 out     f190..262  the end pull-back, k -> 0.43 on f231 (still moving),
//                        the plaza to (330, 640)
// ---------------------------------------------------------------------------
export const K_OPEN = 2.0;
export const K_WIDE = 0.2;
export const K_NEAR = 2.2;
export const K_FOLLOW = 0.62;
export const K_END = 0.43;
/** the pre-roll's creep in (its last few % land by f6) */
const CREEP_K = 1.035;
const BREATH = 1.03;
const KILL_CREEP = 1.03;
const HOLD = 0.975;
/** the plaza's screen point at each framing */
export const P_OPEN: P2 = [540, 815];
export const P_WIDE: P2 = [200, 764];
export const P_BREATH: P2 = [196, 765];
export const P_NEAR: P2 = [460, 835];
export const P_KILL: P2 = [456, 832];
export const P_FOLLOW: P2 = [250, 680];
export const P_HOLD: P2 = [255, 683];
export const P_END: P2 = [300, 700];
export const WINDOWS = {
  creep: [-120, 20, 0.3],
  creepK: [-120, 6, 1],
  pull: [1, 42, 0.64],
  breath: [44, 80, 1],
  push: [70, 118, 0.6],
  killCreep: [108, 140, 1],
  follow: [126, 168, 0.7],
  hold: [160, 200, 1],
  out: [190, 262, 0.8],
} as const;
type WinKey = keyof typeof WINDOWS;
const bumpOf = (w: WinKey, area: number): Bump => [WINDOWS[w][0], WINDOWS[w][1], area, WINDOWS[w][2]];
/** the camera tables reach back past the preceding cut's pre-roll (f-91) */
export const F_PRE = -100;
const T_LO = -140;
const track = (bumps: Bump[], v0: number) => makeTrack(bumps, v0, T_LO, 480);
/** the share of a window's bump that falls after f0 (the creep began in the
 *  pre-roll; the next glide's area takes only what is left of it) */
const after0 = (w: WinKey) => 1 + track([bumpOf(w, 1)], 0)(T_LO);
/** a channel: fixed bumps, then "out" solved so the channel passes vEnd on LAST */
const channel = (v0: number, fixed: [WinKey, number][], vEnd: number) => {
  const base = track(fixed.map(([w, a]) => bumpOf(w, a)), v0);
  const uO = track([bumpOf("out", 1)], 0);
  const a = (vEnd - base(LAST)) / uO(LAST);
  return { track: track([...fixed.map(([w, ar]) => bumpOf(w, ar)), bumpOf("out", a)], v0), out: a };
};
const LK = channel(
  Math.log(K_OPEN),
  [
    ["creepK", Math.log(CREEP_K)],
    ["pull", Math.log(K_WIDE / K_OPEN) - Math.log(CREEP_K) * after0("creepK")],
    ["breath", Math.log(BREATH)],
    ["push", Math.log(K_NEAR / (K_WIDE * BREATH))],
    ["killCreep", Math.log(KILL_CREEP)],
    ["follow", Math.log(K_FOLLOW / (K_NEAR * KILL_CREEP))],
    ["hold", Math.log(HOLD)],
  ],
  Math.log(K_END),
);
const CREEP_P: P2 = [-24, -4];
const pChannel = (c: 0 | 1) =>
  channel(
    P_OPEN[c],
    [
      ["creep", CREEP_P[c]],
      ["pull", P_WIDE[c] - P_OPEN[c] - CREEP_P[c] * after0("creep")],
      ["breath", P_BREATH[c] - P_WIDE[c]],
      ["push", P_NEAR[c] - P_BREATH[c]],
      ["killCreep", P_KILL[c] - P_NEAR[c]],
      ["follow", P_FOLLOW[c] - P_KILL[c]],
      ["hold", P_HOLD[c] - P_FOLLOW[c]],
    ],
    P_END[c],
  );
const PX = pChannel(0);
const PY = pChannel(1);
export const CAM_AREAS = { lnk: LK.out, px: PX.out, py: PY.out };
/** the plaza's authored screen point at f */
export const plazaScreen = (f: number): P2 => [PX.track(f), PY.track(f)];
/** the authored camera at frame f (no sway); valid from F_PRE (the preceding
 *  cut's pre-roll, f-91..-1, continues the opening creep) to the last frame */
export const camAt = (f: number): Cam => {
  const k = Math.exp(LK.track(f));
  return { k, cx: PLAZA_C[0] - (PX.track(f) - SCREEN_CX) / k, cy: PLAZA_C[1] - (PY.track(f) - SCREEN_CY) / k };
};
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));

// ---------------------------------------------------------------------------
// THE PLAZA (incaShared PLAZA via ambushMotion): halls, gates, the platform
// ---------------------------------------------------------------------------
const HALLS = PLAZA.halls as Hall[];
const GATES = PLAZA.gates as Gate[];
const hallIx = (name: string) => HALLS.findIndex((h) => h.name === name);
const H_NE = hallIx("northeast");
const H_W = hallIx("west");
const H_SE = hallIx("southeast");
const FORT_C = PLAZA.fortress.centre as P2;
const CORNER = PLAZA.corners.fortress as P2;
/** the two ways out on the open-country side: through the NE and SE walls,
 *  20 m from the fortress corner, either side of the platform */
const wallPt = (to: P2, dist: number): P2 => add(CORNER, mul(unit(sub(to, CORNER)), dist));
export const EXIT_N: P2 = wallPt(PLAZA.corners.northwest as P2, 20);
export const EXIT_S: P2 = wallPt(PLAZA.corners.southwest as P2, 20);
/** the plaza's box bottom (the numerals hang under it) */
/** the foot step out behind the front's start */
const T_FRONT_FOOT = 118;
const ENC = PLAZA.enclosure as P2[];
export const PLAZA_BOTTOM = Math.max(...ENC.map((p) => p[1]));

// ---------------------------------------------------------------------------
// THE 168 (ambushMotion SPANIARDS: after the trap opened, at their stand
// positions): 62 horse in the halls (21 NE / 20 W / 21 SE), Pizarro + 24 on
// the platform, Candia + 8 at its parapet, 72 at the two gates.
// THE FOOT AT THE KILLING (f117 on, behind the front): Candia's 9 hold the
// platform; at each gate the 8 nearest the street spread across the street
// mouth (Trujillo: 8 men at each street mouth), a loose line 7 m out, 6 m
// apart; the other 81 walk into the square behind the front in three loose
// bodies: 28 fanning in from each gate, Pizarro's 25 down from the platform to
// the litter; so on "zero" the 106 stand among the dead, every one apart.
// ---------------------------------------------------------------------------
export const N_HORSE = AMB.filter((s) => s.role === "horse").length;
type Foot = { p: P2; id: number; to: P2; t0: number; T: number; role: string };
const INTERIOR = PLAZA.interior as P2[][];
/** a tiny Hungarian (min-cost assignment, square; ambushMotion's) */
const hungarian = (cost: number[][]) => {
  const n = cost.length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const pp = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    pp[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = pp[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[pp[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      j0 = j1;
    } while (pp[j0] !== 0);
    do {
      const j1 = way[j0];
      pp[j0] = pp[j1];
      j0 = j1;
    } while (j0);
  }
  const ans = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (pp[j] > 0) ans[pp[j] - 1] = j - 1;
  return ans;
};
export const FOOT: Foot[] = (() => {
  const all = AMB.filter((s) => s.role !== "horse");
  const out: Foot[] = all.map((s) => ({ p: s.stand as P2, id: s.id, to: s.stand as P2, t0: 1e9, T: 1, role: s.role }));
  // the street mouths: at each gate the 8 nearest the street spread into a
  // loose line across it, 7 m out, 6 m apart
  GATES.forEach((g) => {
    const n = unit(g.n as P2);
    const t = unit(sub(g.b as P2, g.a as P2));
    const guards = out
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.role === "gate" && len(sub(f.p, g.p as P2)) < 20)
      .sort((a, b) => dot(sub(b.f.p, g.p as P2), n) - dot(sub(a.f.p, g.p as P2), n))
      .slice(0, 8)
      .sort((a, b) => dot(sub(a.f.p, g.p as P2), t) - dot(sub(b.f.p, g.p as P2), t));
    guards.forEach(({ i }, q) => {
      const lat = -35 + 10 * q + 0.6 * (hash(out[i].id, 61) - 0.5);
      out[i].to = add(add(g.p as P2, mul(n, 7 + 1.5 * (hash(out[i].id, 62) - 0.5))), mul(t, lat));
      out[i].t0 = T_FRONT_FOOT + 2 * hash(out[i].id, 63);
      out[i].T = 14;
    });
  });
  // the walkers: per gate the 28 not at the mouth fan out into the square (the
  // free wedge between the hall fronts); Pizarro's 25 go down into
  // the square to the litter (he seized Atahualpa there: Xerez p.55), a loose
  // body 19 m round it; each group an even blue-noise spread (~6 m apart),
  // each man to his place by an optimal assignment (no two paths cross)
  const walk = (ids: number[], targets: P2[]) => {
    const asg = hungarian(ids.map((i) => targets.map((q) => len(sub(out[i].p, q)) ** 1.5)));
    ids.forEach((i, m) => {
      const f = out[i];
      f.to = targets[asg[m]];
      const D = len(sub(f.to, f.p));
      f.t0 = T_FRONT_FOOT + 4 * hash(f.id, 64);
      f.T = Math.max(16, D / 2.6);
    });
  };
  const inside = (q: P2) => pointInPoly(INTERIOR, q[0], q[1]);
  // the bodies' places: a fan into the free wedge inside each gate (its apex
  // ~16 m in from the gate on the corner's bisector, +-27 deg, out to 64 m),
  // Pizarro's 25 round the litter (25 m); then all the places relaxed apart
  // to >= 9.5 m (each man reads on his own at the f174 framing), inside the square
  const groups: { ids: number[]; pts: P2[] }[] = [];
  GATES.forEach((g, gi) => {
    const inward = mul(unit(g.n as P2), -1);
    const a0 = Math.atan2(inward[1], inward[0]);
    const apex = add(g.p as P2, mul(inward, 16));
    const fan: P2[] = [];
    for (let k2 = 0; k2 <= 12; k2++) {
      const a = a0 - 0.471 + (0.942 * k2) / 12;
      fan.push(add(apex, [64 * Math.cos(a), 64 * Math.sin(a)]));
    }
    for (let k2 = 12; k2 >= 0; k2--) {
      const a = a0 - 0.471 + (0.942 * k2) / 12;
      fan.push(add(apex, [4 * Math.cos(a), 4 * Math.sin(a)]));
    }
    const ids = out.map((f, i) => ({ f, i })).filter(({ f, i }) => f.role === "gate" && f.t0 >= 1e9 && len(sub(all[i].stand as P2, g.p as P2)) < 20).map(({ i }) => i);
    groups.push({ ids, pts: packCrowd(fan, ids.length, undefined, 81 + gi) });
  });
  const piz = out.map((f, i) => ({ f, i })).filter(({ f }) => f.role === "pizarro").map(({ i }) => i);
  const ring: P2[] = Array.from({ length: 40 }, (_, k2) => add(LITTER, [25 * Math.cos((k2 / 40) * 6.2832), 23 * Math.sin((k2 / 40) * 6.2832)]));
  groups.push({ ids: piz, pts: packCrowd(ring, piz.length, undefined, 83) });
  const allPts = groups.flatMap((g) => g.pts.map((q) => [q[0], q[1]] as P2));
  const MIN_D = 9.5;
  for (let it = 0; it < 60; it++) {
    const d = allPts.map(() => [0, 0] as P2);
    for (let i = 0; i < allPts.length; i++)
      for (let j = i + 1; j < allPts.length; j++) {
        const e = sub(allPts[j], allPts[i]);
        const l = len(e);
        if (l >= MIN_D || l < 1e-9) continue;
        const m = (0.5 * (MIN_D - l)) / l;
        d[i] = sub(d[i], mul(e, m));
        d[j] = add(d[j], mul(e, m));
      }
    allPts.forEach((q, i) => {
      const nq = add(q, d[i]);
      if (inside(nq)) allPts[i] = nq;
      else if (inside(add(q, mul(d[i], 0.3)))) allPts[i] = add(q, mul(d[i], 0.3));
    });
  }
  let off = 0;
  for (const g of groups) {
    walk(g.ids, allPts.slice(off, off + g.ids.length));
    off += g.ids.length;
  }
  return out;
})();
if (N_HORSE !== 62 || FOOT.length !== 106) throw new Error("hundredMotion: the 168 do not add up (62 horse + 106 foot)");
export const FOOT_ARRIVED = Math.max(...FOOT.filter((f) => f.t0 < 1e9).map((f) => f.t0 + f.T));
/** a foot soldier's position (he walks to his place behind the front, then stands; a hair of idle sway) */
export const footAt = (i: number, f: number): P2 => {
  const { p, id, to, t0, T } = FOOT[i];
  const e = smootherstep((f - t0) / T);
  const q: P2 = [p[0] + (to[0] - p[0]) * e, p[1] + (to[1] - p[1]) * e];
  return [q[0] + 0.22 * Math.sin(f * (0.05 + 0.03 * hash(id, 41)) + 6.283 * hash(id, 42)), q[1] + 0.22 * Math.sin(f * (0.045 + 0.03 * hash(id, 43)) + 6.283 * hash(id, 44))];
};

// ---------------------------------------------------------------------------
// THE RIDERS. Each hall's group rides out of its doorways (3 m into the
// square) and out of the plaza beside the platform, then gallops east along
// its own corridor in the road frame (s along ROAD_TO_CAMP from the plaza's
// east corner, d lateral, + north): the NE hall's group through the north
// division (d -> ~+600), the W hall's group along the road through the centre
// division, the SE hall's group through the south division (d -> ~-570).
// A loose group: each rider has his own lateral place (+-W(s)), wobble and
// pace. Speed along his path: 15 m/f in the square, a gallop of 73 m/f once
// out (x his pace 0.94..1.04), easing from f143 to a walk at the end of the
// half league (~2.85 km out by f231, still moving).
// ---------------------------------------------------------------------------
export const GROUPS = ["north", "road", "south"] as const;
const GROUP_OF_HALL = (h: number) => (h === H_NE ? 0 : h === H_W ? 1 : 2);
const sstep = smoothstep;
/** each group's corridor centre line d(s) (m, + north) */
export const groupD = (g: number, s: number) =>
  g === 0
    ? 240 * sstep(s / 820) + 0.08 * Math.max(0, s - 1000)
    : g === 2
      ? -(232 * sstep(s / 800) + 0.08 * Math.max(0, s - 1000))
      : 20 * Math.sin(s / 520) * sstep(s / 500);
/** a group's half-width (m): the riders fan out from the corner */
export const groupW = (s: number) => 4 + 58 * sstep((s - 20) / 600);
export const V_IN = 11; // m/f in the square (<= 26 px/f at k 2.2)
export const T_DEP: number[] = [];
T_DEP[H_NE] = 108;
T_DEP[H_W] = 103;
T_DEP[H_SE] = 108;
/** the gallop on the plain (m/f along the path, x his pace), matched to the
 *  follow so the riders stay in frame at <= ~30 px/f: an easy start while
 *  the camera is close, the full gallop through the front division as it
 *  pulls back (f140..158), easing to a walk by the end */
export const V_PLAIN = pchip([
  [110, 10],
  [128, 11],
  [136, 14],
  [144, 21],
  [150, 30],
  [156, 34],
  [160, 26],
  [166, 12],
  [174, 5.5],
  [191, 3.8],
  [210, 3.2],
  [231, 2.6],
  [262, 1],
]);
const S_JOIN = 26; // the plain path starts this far down the road
const S_STEP = 2;
const S_MAX = 3600;
const NS = Math.round((S_MAX - S_JOIN) / S_STEP) + 1;
export type Rider = {
  id: number;
  group: number;
  hall: number;
  pace: number;
  lat: number; // -1..1 his place across the group
  tDep: number;
  /** the dense path (1 m), cumulative length, s-tag (NaN in the plaza) */
  xs: Float64Array;
  ys: Float64Array;
  cum: Float64Array;
  lExit: number; // path length at the wall
  /** L(t): path length at time t (table from T_TAB0, 8 per frame) */
  lTab: Float64Array;
  /** on the plain grid (s = S_JOIN + j * S_STEP): lateral d and pass time */
  dOnS: Float64Array;
  tOnS: Float64Array;
};
const T_TAB0 = 96;
const T_TAB1 = 300;
const TSUB = 8;
export const riderD = (group: number, lat: number, wobPh: number, wobL: number, s: number) =>
  groupD(group, s) + lat * groupW(s) + 4.5 * Math.sin(s / wobL + wobPh) * sstep(s / 300);
export const RIDERS: Rider[] = (() => {
  const out: Rider[] = [];
  const horse = AMB.filter((s) => s.role === "horse");
  for (const h of [H_NE, H_W, H_SE]) {
    const hall = HALLS[h];
    const g = GROUP_OF_HALL(h);
    const men = horse.filter((m) => m.hall === h);
    const n = unit(hall.toSquare as P2);
    // the hall front's east end (the end nearer the platform), 3 m into the square
    const [fa, fb] = hall.front as [P2, P2];
    const eastEnd = len(sub(fa, FORT_C)) < len(sub(fb, FORT_C)) ? fa : fb;
    const along = unit(sub(eastEnd, len(sub(fa, FORT_C)) < len(sub(fb, FORT_C)) ? fb : fa));
    // order the group by distance to its way out (the file they leave in)
    const ordered = men
      .map((m) => {
        const dw = hall.doorways[m.door].p as P2;
        return { m, dw, key: h === H_W ? dot(sub(dw, FORT_C), [0, 1]) : -dot(sub(dw, eastEnd), along) };
      })
      .sort((a, b) => a.key - b.key);
    ordered.forEach(({ m, dw }, q) => {
      const id = m.id;
      const lat = 2 * (((q + 0.5) * 0.6180339887 + 0.37 * g) % 1) - 1;
      const exitPt: P2 = h === H_NE ? EXIT_N : h === H_SE ? EXIT_S : dot(sub(dw, LITTER), [0, 1]) < 0 ? EXIT_N : EXIT_S;
      // the plaza: out of his doorway, then along the front (NE / SE) or
      // straight across the square (W), to the way out beside the platform
      const ctrl: P2[] = [m.stand as P2, add(dw, mul(n, 3))];
      if (h !== H_W) ctrl.push(add(add(eastEnd, mul(n, 3)), mul(along, 4)));
      else ctrl.push([58, exitPt === EXIT_N ? 0.5 : 18]);
      const wallTang = unit(sub(exitPt, CORNER));
      const ex = add(exitPt, mul(wallTang, 2.4 * (hash(id, 51) - 0.5)));
      ctrl.push(ex);
      // the plain: (s, d) from S_JOIN
      const wobPh = 6.283 * hash(id, 52);
      const wobL = 260 + 140 * hash(id, 53);
      const plain: P2[] = [];
      const plainS: number[] = [];
      for (let j = 0; j < NS; j++) {
        const s = S_JOIN + j * S_STEP;
        plain.push(frameAt(s, riderD(g, lat, wobPh, wobL, s)));
        plainS.push(s);
      }
      // resample everything at 1 m, then a light gaussian smoothing (sigma 3 m)
      const raw: P2[] = [];
      const rawS: number[] = [];
      const pushSeg = (a: P2, b: P2, sa: number, sb: number) => {
        const L = len(sub(b, a));
        const nSeg = Math.max(1, Math.ceil(L / 1));
        for (let i = 0; i < nSeg; i++) {
          const u = i / nSeg;
          raw.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
          rawS.push(sa + (sb - sa) * u);
        }
      };
      for (let i = 0; i + 1 < ctrl.length; i++) pushSeg(ctrl[i], ctrl[i + 1], NaN, NaN);
      pushSeg(ctrl[ctrl.length - 1], plain[0], NaN, NaN);
      for (let i = 0; i + 1 < plain.length; i++) pushSeg(plain[i], plain[i + 1], plainS[i], plainS[i + 1]);
      raw.push(plain[plain.length - 1]);
      rawS.push(plainS[plainS.length - 1]);
      const sig = 3;
      const R = 3 * sig;
      const wts = Array.from({ length: 2 * R + 1 }, (_, j) => Math.exp(-((j - R) * (j - R)) / (2 * sig * sig)));
      const N = raw.length;
      const xs = new Float64Array(N);
      const ys = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        let ax = 0;
        let ay = 0;
        let ws = 0;
        // the start (his stand) stays pinned: the smoothing fades in over the first metres
        for (let j = -R; j <= R; j++) {
          const q2 = Math.max(0, Math.min(N - 1, i + j));
          ax += raw[q2][0] * wts[j + R];
          ay += raw[q2][1] * wts[j + R];
          ws += wts[j + R];
        }
        const pin = smoothstep(i / 6);
        xs[i] = raw[i][0] + (ax / ws - raw[i][0]) * pin;
        ys[i] = raw[i][1] + (ay / ws - raw[i][1]) * pin;
      }
      const cum = new Float64Array(N);
      for (let i = 1; i < N; i++) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
      // the wall: the first sample past the exit point along the path
      let iEx = 0;
      let bd = Infinity;
      for (let i = 0; i < N && Number.isNaN(rawS[i]); i++) {
        const d = Math.hypot(xs[i] - ex[0], ys[i] - ex[1]);
        if (d < bd) [bd, iEx] = [d, i];
      }
      const lExit = cum[iEx];
      // his speed: 15 m/f in the square (from rest), the gallop once past the
      // wall (eased up over 7 f), then the ease to a walk
      const pace = 0.94 + 0.1 * hash(id, 54);
      const tDep = T_DEP[h] + 1.2 * (hash(id, 55) - 0.5) + (h === H_W ? 0 : 0.35 * (q % 3));
      const lTab = new Float64Array((T_TAB1 - T_TAB0) * TSUB + 1);
      let L = 0;
      let tEx = Infinity;
      for (let i = 0; i < lTab.length; i++) {
        const t = T_TAB0 + i / TSUB;
        lTab[i] = L;
        let v = V_IN * smoothstep((t - tDep) / 4);
        if (L >= lExit && tEx === Infinity) tEx = t;
        if (tEx < Infinity) v = V_IN + (Math.max(0.5, V_PLAIN(t)) * pace - V_IN) * smoothstep((t - tEx) / 6);
        L = Math.min(cum[N - 1], L + v / TSUB);
      }
      // the plain grid: d and the pass time
      const dOnS = new Float64Array(NS);
      const tOnS = new Float64Array(NS).fill(Infinity);
      let i0 = 0;
      let ti = 0;
      for (let j = 0; j < NS; j++) {
        const s = S_JOIN + j * S_STEP;
        dOnS[j] = riderD(g, lat, wobPh, wobL, s);
        while (i0 < N - 1 && !(rawS[i0] >= s)) i0++;
        const Lj = cum[i0];
        while (ti < lTab.length - 1 && lTab[ti] < Lj) ti++;
        if (lTab[ti] >= Lj) tOnS[j] = T_TAB0 + ti / TSUB;
      }
      out.push({ id, group: g, hall: h, pace, lat, tDep, xs, ys, cum, lExit, lTab, dOnS, tOnS });
    });
  }
  if (out.length !== 62) throw new Error(`hundredMotion: ${out.length} riders, not 62`);
  return out;
})();
const lOf = (r: Rider, f: number) => {
  if (f <= T_TAB0) return 0;
  const x = (Math.min(T_TAB1, f) - T_TAB0) * TSUB;
  const i = Math.min(r.lTab.length - 2, Math.floor(x));
  return r.lTab[i] + (r.lTab[i + 1] - r.lTab[i]) * (x - i);
};
const pathAtL = (r: Rider, L: number): P2 => {
  const c = r.cum;
  let lo = 0;
  let hi = c.length - 1;
  if (L <= 0) return [r.xs[0], r.ys[0]];
  if (L >= c[hi]) return [r.xs[hi], r.ys[hi]];
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c[m] <= L) lo = m;
    else hi = m;
  }
  const u = (L - c[lo]) / (c[hi] - c[lo] || 1);
  return [r.xs[lo] + (r.xs[hi] - r.xs[lo]) * u, r.ys[lo] + (r.ys[hi] - r.ys[lo]) * u];
};
/** a rider's position at f (standing in his hall before he sets off, a hair of idle sway) */
export const riderAt = (r: Rider, f: number): P2 => {
  const p = pathAtL(r, lOf(r, f));
  const idle = 1 - smoothstep((f - r.tDep) / 3);
  if (idle <= 0) return p;
  return [p[0] + idle * 0.22 * Math.sin(f * (0.05 + 0.03 * hash(r.id, 41)) + 6.283 * hash(r.id, 42)), p[1] + idle * 0.22 * Math.sin(f * (0.045 + 0.03 * hash(r.id, 43)) + 6.283 * hash(r.id, 44))];
};
/** how far out (m of path) a rider is at f, for the checks */
export const riderL = lOf;

// per-group pass time and centre on the plain grid
const sIx = (s: number) => Math.max(0, Math.min(NS - 1, Math.round((s - S_JOIN) / S_STEP)));
const G_T = [0, 1, 2].map((g) => {
  const a = new Float64Array(NS).fill(Infinity);
  for (const r of RIDERS) if (r.group === g) for (let j = 0; j < NS; j++) a[j] = Math.min(a[j], r.tOnS[j]);
  return a;
});
const G_C = [0, 1, 2].map((g) => {
  const a = new Float64Array(NS);
  const rs = RIDERS.filter((r) => r.group === g);
  for (let j = 0; j < NS; j++) a[j] = rs.reduce((acc, r) => acc + r.dOnS[j], 0) / rs.length;
  return a;
});

// ---------------------------------------------------------------------------
// THE PLAZA CROWD: the 6,000 of ambushMotion's CROWD0 (80 bearers first), at
// the moment of the ambush, each man swaying on his own phase.
//   the front   leaves the hall fronts, the 106 foot (the gates, the
//               platform) on f117 and crosses the square by ~f140 (2.1 m/f,
//               +-3 f hashed jitter); the riders' own tracks across the square
//               (f106..f119) take the men within 3 m of them as they pass
//   the dead    4,800 fall where they stand (the front or a rider)
//   survivors   1,200 (weighted toward the gates) press out through the gates
//               from f113, along a funnel into the opening and out into the
//               street; 600 of them fall at the street mouths (2..22 m out,
//               all by f151); 600 get away into the town, slowing
// ---------------------------------------------------------------------------
export const N_PLAZA_DEAD = 4800;
export const N_SURVIVORS = 1200;
export const N_MOUTH_DEAD = 600;
export const N_FIELD_DEAD = 2600;
export const N_DEAD = N_PLAZA_DEAD + N_MOUTH_DEAD + N_FIELD_DEAD;
export const T_FRONT = 117;
/** every death has begun by f190 and finished easing (6 f) by f196: the
 *  square's 5,400 by f151 (as before), the fields' 2,600 as the riders cut
 *  their lanes through the front division (0.72-1.1 km out), which the
 *  camera's follow reaches from ~f156 (riders in frame at <= ~30 px/f) */
export const T_DEAD_BY = 190;
const T_LAST_DEATH = 190;
const V_SURV = 2.3; // m/f, pressing toward the gates
const fallDir = (from: P2, i: number, seed: number): P2 => {
  const a = Math.atan2(from[1], from[0]) + (hash(i, seed) - 0.5) * 1.4;
  return [Math.cos(a) * DEAD_FALL_M, Math.sin(a) * DEAD_FALL_M];
};
type Survivor = {
  gate: number;
  tGo: number;
  p0: P2;
  c: P2;
  g: P2;
  out: P2; // unit, into the street
  lIn: number; // the funnel's length
  bez: Float64Array; // arclength table (17)
  yInf: number; // how far he would run, slowing
  yDie: number; // a mouth death: metres past the gate (or Infinity)
};
export const PLAZA_TD = new Float64Array(N_CROWD).fill(Infinity);
const PLAZA_FALL = new Float32Array(N_CROWD * 2);
export const PLAZA_KIND = new Uint8Array(N_CROWD); // 0 front, 2 mouth dead, 3 escaped
/** the riders' wake across the square: (dx, dy, t0) per man (t0 Infinity: none) */
const PLAZA_WAKE = new Float32Array(N_CROWD * 3).fill(Infinity);
const SURV: (Survivor | null)[] = new Array(N_CROWD).fill(null);
const bezAt = (S: Survivor, u: number): P2 => {
  const a = (1 - u) * (1 - u);
  const b = 2 * u * (1 - u);
  const c = u * u;
  return [a * S.p0[0] + b * S.c[0] + c * S.g[0], a * S.p0[1] + b * S.c[1] + c * S.g[1]];
};
/** a survivor's distance walked at t (a C1 start from rest) */
const survSigma = (S: Survivor, t: number) => V_SURV * rampInt(t - S.tGo, 6);
const survPos = (S: Survivor, t: number): P2 => {
  const sg = survSigma(S, t);
  if (sg < S.lIn) {
    // arclength -> u via the table
    const tab = S.bez;
    let k = 0;
    while (k < 15 && tab[k + 1] < sg) k++;
    const u = (k + (sg - tab[k]) / (tab[k + 1] - tab[k] || 1)) / 16;
    return bezAt(S, u);
  }
  const y = sg - S.lIn;
  const o = S.yInf * (1 - Math.exp(-y / S.yInf));
  return add(S.g, mul(S.out, o));
};
(() => {
  const fronts = HALLS.map((h) => h.front as [P2, P2]);
  const feet = FOOT.map((q) => q.p); // their posts (where the front leaves from)
  // rider tracks across the square (path samples up to the wall, with times)
  const TC = 3; // a 3 m grid of the track samples
  const tracks = new Map<number, { x: number; y: number; t: number }[]>();
  const tKey = (cx: number, cy: number) => (cx + 4096) * 8192 + (cy + 4096);
  for (const r of RIDERS) {
    let ti = 0;
    for (let i = 0; i < r.cum.length && r.cum[i] <= r.lExit; i += 1) {
      const L = r.cum[i];
      while (ti < r.lTab.length - 1 && r.lTab[ti] < L) ti++;
      const kk = tKey(Math.floor(r.xs[i] / TC), Math.floor(r.ys[i] / TC));
      const b = tracks.get(kk);
      const q = { x: r.xs[i], y: r.ys[i], t: T_TAB0 + ti / TSUB };
      if (b) b.push(q);
      else tracks.set(kk, [q]);
    }
  }
  const dSrc = new Float64Array(N_CROWD);
  const srcOf: P2[] = [];
  let dMax = 0;
  for (let i = 0; i < N_CROWD; i++) {
    const p = CROWD0[i];
    let best = Infinity;
    let from: P2 = [1, 0];
    for (const [a, b] of fronts) {
      const d = segDist(p, a, b);
      if (d < best) {
        best = d;
        const ab = sub(b, a);
        const t = clamp01(dot(sub(p, a), ab) / dot(ab, ab));
        from = sub(p, add(a, mul(ab, t)));
      }
    }
    for (const q of feet) {
      const d = len(sub(p, q));
      if (d < best) [best, from] = [d, sub(p, q)];
    }
    dSrc[i] = best;
    srcOf.push(from);
    dMax = Math.max(dMax, best);
  }
  const vFront = dMax / 20.5;
  // the riders' tracks: the men within 4.5 m of a passing rider shove aside
  // (a wake, eased over 5 f); the front does the killing in the square
  const trackT = new Float64Array(N_CROWD).fill(Infinity);
  const trackFrom: P2[] = new Array(N_CROWD);
  for (let i = 0; i < N_CROWD; i++) {
    const p = CROWD0[i];
    const cx = Math.floor(p[0] / TC);
    const cy = Math.floor(p[1] / TC);
    for (let a = cx - 1; a <= cx + 1; a++)
      for (let b = cy - 1; b <= cy + 1; b++) {
        const cell = tracks.get(tKey(a, b));
        if (!cell) continue;
        for (const q of cell) {
          const ex = p[0] - q.x;
          const ey = p[1] - q.y;
          if (ex * ex + ey * ey < 20.25 && q.t < trackT[i]) {
            trackT[i] = q.t;
            trackFrom[i] = [ex, ey];
          }
        }
      }
  }
  // the survivors: 1,200, weighted toward the gates, never on a rider's track
  const gateP = GATES.map((g) => g.p as P2);
  const keys: { i: number; key: number; gd: number; gi: number }[] = [];
  for (let i = 0; i < N_CROWD; i++) {
    const p = CROWD0[i];
    let gd = Infinity;
    let gi = 0;
    gateP.forEach((g, q) => {
      const d = len(sub(p, g));
      if (d < gd) [gd, gi] = [d, q];
    });
    if (trackT[i] < Infinity) continue;
    const w = Math.exp(-gd / 50);
    keys.push({ i, key: -Math.log(1 - ih(i, 5, 811) * 0.999999) / w, gd, gi });
  }
  keys.sort((a, b) => a.key - b.key);
  const surv = keys.slice(0, N_SURVIVORS);
  // each survivor's way out: a funnel (quadratic Bezier) into the opening,
  // then out along the street, fanning a little and slowing
  for (const { i, gd, gi } of surv) {
    const G = GATES[gi];
    const n = unit(G.n as P2); // outward
    const t = unit(sub(G.b as P2, G.a as P2));
    const p0 = CROWD0[i];
    const latIn = dot(sub(p0, G.p as P2), t);
    const lat = Math.max(-3.6, Math.min(3.6, latIn * 0.12 + 1.4 * (ih(i, 6, 812) - 0.5)));
    const g = add(G.p as P2, mul(t, lat));
    const c = sub(G.p as P2, mul(n, Math.min(30, 0.55 * gd)));
    const fan = (lat / 3.6) * 0.45 + 0.5 * (ih(i, 7, 813) - 0.5);
    const out: P2 = [n[0] * Math.cos(fan) - n[1] * Math.sin(fan), n[0] * Math.sin(fan) + n[1] * Math.cos(fan)];
    const S: Survivor = { gate: gi, tGo: 112 + gd * 0.12 + 2 * ih(i, 8, 814), p0, c, g, out, lIn: 0, bez: new Float64Array(17), yInf: 55 + 45 * ih(i, 9, 815), yDie: Infinity };
    let acc = 0;
    let prev = bezAt(S, 0);
    for (let k = 1; k <= 16; k++) {
      const q = bezAt(S, k / 16);
      acc += len(sub(q, prev));
      S.bez[k] = acc;
      prev = q;
    }
    S.lIn = acc;
    SURV[i] = S;
  }
  // the street mouths: 600 of those who reach 2..22 m past the gate by f151
  const mouth: { i: number; key: number; y: number; t: number }[] = [];
  for (const { i } of surv) {
    const S = SURV[i] as Survivor;
    const yd = 2 + 16 * ih(i, 10, 816);
    // the walked distance at which he is yd metres out (o = yInf (1 - e^-y/yInf))
    if (yd >= S.yInf * 0.98) continue;
    const y = -S.yInf * Math.log(1 - yd / S.yInf);
    const sg = S.lIn + y;
    const t = S.tGo + sg / V_SURV + 3; // rampInt inverse past the ramp
    if (t <= T_LAST_DEATH) mouth.push({ i, key: ih(i, 11, 817), y, t });
  }
  if (mouth.length < N_MOUTH_DEAD) throw new Error(`hundredMotion: only ${mouth.length} survivors reach the street mouths by f${T_LAST_DEATH}`);
  mouth.sort((a, b) => a.key - b.key);
  for (const m of mouth.slice(0, N_MOUTH_DEAD)) {
    const S = SURV[m.i] as Survivor;
    S.yDie = m.y;
    PLAZA_TD[m.i] = m.t;
    PLAZA_KIND[m.i] = 2;
    const f = fallDir(S.out, m.i, 818);
    PLAZA_FALL[2 * m.i] = f[0];
    PLAZA_FALL[2 * m.i + 1] = f[1];
  }
  for (let i = 0; i < N_CROWD; i++) {
    if (SURV[i]) {
      if (PLAZA_KIND[i] !== 2) PLAZA_KIND[i] = 3;
      continue;
    }
    const tf = T_FRONT + dSrc[i] / vFront + 3 * (2 * ih(i, 12, 819) - 1);
    if (trackT[i] < Infinity) {
      const e = trackFrom[i];
      const l = Math.hypot(e[0], e[1]) || 1;
      const push = 0.6 + 0.55 * (4.5 - Math.min(4.5, l));
      PLAZA_WAKE[3 * i] = (e[0] / l) * push;
      PLAZA_WAKE[3 * i + 1] = (e[1] / l) * push;
      PLAZA_WAKE[3 * i + 2] = trackT[i] - 1;
    }
    {
      // the jitter never runs ahead of the front's start: reflected at f117
      PLAZA_TD[i] = tf < T_FRONT ? 2 * T_FRONT - tf : tf;
      PLAZA_KIND[i] = 0;
      const fd = fallDir(srcOf[i], i, 822);
      PLAZA_FALL[2 * i] = fd[0];
      PLAZA_FALL[2 * i + 1] = fd[1];
    }
  }
})();
export const PLAZA_FRONT_MAX = Math.max(...Array.from(PLAZA_TD).filter((t, i) => PLAZA_KIND[i] <= 1 && t < Infinity));

/** a plaza man's sway (the house's: a lean toward / away from the litter, a small drift) */
const plazaSway = (i: number, f: number, x: number, y: number): P2 => {
  const lx = LITTER[0] - x;
  const ly = LITTER[1] - y;
  const ld = Math.hypot(lx, ly) || 1;
  const lean = 0.19 * Math.sin(f * (0.07 + 0.03 * hash(i, 71)) + 6.283 * hash(i, 72));
  const ax = 0.13 * Math.sin(f * (0.05 + 0.04 * hash(i, 73)) + 6.283 * hash(i, 74));
  const ay = 0.13 * Math.sin(f * (0.045 + 0.045 * hash(i, 75)) + 6.283 * hash(i, 76));
  return [x + (lx / ld) * lean + ax, y + (ly / ld) * lean + ay];
};
/** plaza man i at frame f: position (frozen at his death, plus the fall) and
 *  how dead he is (0 living .. 1 dead) */
export const plazaManAt = (i: number, f: number): { x: number; y: number; q: number } => {
  const tD = PLAZA_TD[i];
  const t = Math.min(f, tD);
  const S = SURV[i];
  let [x, y] = S && t > S.tGo ? survPos(S, t) : CROWD0[i];
  const wt = PLAZA_WAKE[3 * i + 2];
  if (t > wt) {
    const e = smoothstep((t - wt) / 5);
    x += PLAZA_WAKE[3 * i] * e;
    y += PLAZA_WAKE[3 * i + 1] * e;
  }
  [x, y] = plazaSway(i, t, x, y);
  const u = f - tD;
  const q = u <= 0 ? 0 : u >= DEAD_EASE_F ? 1 : smoothstep(u / DEAD_EASE_F);
  if (q > 0) {
    x += PLAZA_FALL[2 * i] * q;
    y += PLAZA_FALL[2 * i + 1] * q;
  }
  return { x, y, q };
};

// ---------------------------------------------------------------------------
// THE ARMY ON THE PLAIN: vastArmyMotion's 80,000, settled (armySD at its
// end), except the stragglers still arriving: they walk on vast's own clock
// slowed to a quarter, fv = 186 + f / 4 (1,400 still moving on f0, the last
// settling by ~f96, before any rider comes).
//   the corridors  2,600 of the men within 25 m of a rider's path fall as he
//                  passes (t_pass <= f146, so every death has begun by f151):
//                  picked by weighted keys, weight exp(-(s - 700) / 650)
//                  (thick near the town, thinning outward), fading to nothing
//                  for passes after f138
//   the flight     every living man flees sideways from each group's centre
//                  line: an eased displacement 80 / (1 + (a / 150)^3) m (a =
//                  his distance from the line: 80 m on it, ~53 m at the outer
//                  rider + 80 m, monotone so no two men cross), over 16 f from
//                  3 f before the group reaches his s; the men who fall had
//                  barely begun (a quarter of it)
//   the stream     the living drift back east (+s) at 0.3 + 1.0 near (m/f;
//                  near = exp(-(a / 220)^2) of the nearest group line), fading
//                  to nothing toward the camp; it starts when the riders reach
//                  his s, or when the panic does (45 m/f beyond them)
// ---------------------------------------------------------------------------
const FV0 = 186;
const FV_RATE = 0.25;
export const vastFrame = (f: number) => FV0 + f * FV_RATE;
export const KILL_R = 25;
const T_PASS_MAX = 185;
const FLEE_OUT = 28;
const FLEE_FALL = 120;
const FLEE_T = 16;
const FLEE_LEAD = 3;
const DEAD_FLEE = 0.25;
export const A_S = new Float32Array(N_ARMY);
export const A_D = new Float32Array(N_ARMY);
/** the stragglers (still walking on f0) and the frame each settles */
const STRAG: number[] = [];
const STRAG_SETTLE = new Float32Array(N_ARMY);
export const A_TD = new Float32Array(N_ARMY).fill(Infinity);
const A_FALL = new Float32Array(N_ARMY * 2); // (ds, dd)
const A_FLEE_D = new Float32Array(N_ARMY * 3);
const A_FLEE_S = new Float32Array(N_ARMY * 3);
const A_FLEE_T = new Float32Array(N_ARMY * 3).fill(Infinity);
const A_DRIFT_V = new Float32Array(N_ARMY);
const A_DRIFT_T = new Float32Array(N_ARMY);
const A_PH = new Float32Array(N_ARMY * 4);
/** men within 25 m of a rider's path before T_PASS_MAX (the 2,600 are picked from them) */
export let CORRIDOR_MEN = 0;
/** a man's flight from a group's line (m), by his distance a from it and the
 *  group's half-width We: inside the group he is carried out past its edge
 *  (to We + 12 .. We + 28: the lane clears), outside it the push falls off
 *  over ~120 m (28 m at the edge); monotone in a, so no two men cross, and
 *  two lanes 240 m apart only press the strip between them into a soft bank
 *  (~1.7x, feathered by each man's share) */
export const fleeOf = (a: number, We: number) => (a < We ? We + 12 + 16 * (a / We) - a : FLEE_OUT * (1 - smoothstep((a - We) / FLEE_FALL)));
(() => {
  for (let i = 0; i < N_ARMY; i++) {
    const [s, d] = armySD(i, 400);
    A_S[i] = s;
    A_D[i] = d;
    if (armyProgress(i, vastFrame(F_PRE)) < 1) {
      STRAG.push(i);
      let f = F_PRE;
      while (f < 400 && armyProgress(i, vastFrame(f)) < 1) f += 1;
      STRAG_SETTLE[i] = f;
    }
    A_PH[4 * i] = 6.2832 * ih(i, 5, 903);
    A_PH[4 * i + 1] = 6.2832 * ih(i, 6, 904);
    A_PH[4 * i + 2] = 0.035 + 0.035 * ih(i, 7, 905);
    A_PH[4 * i + 3] = 0.035 + 0.035 * ih(i, 8, 906);
  }
  // the corridors: candidates and their pass times
  const cand: { i: number; key: number; t: number; dd: number }[] = [];
  for (let i = 0; i < N_ARMY; i++) {
    const s = A_S[i];
    const d = A_D[i];
    const j = sIx(s);
    let tp = Infinity;
    let rd = 0;
    for (const r of RIDERS) {
      const t = r.tOnS[j];
      if (t > T_PASS_MAX) continue;
      const dd = d - r.dOnS[j];
      if (dd > KILL_R || dd < -KILL_R) continue;
      if (t < tp) [tp, rd] = [t, dd];
    }
    if (tp === Infinity) continue;
    const w = Math.exp(-(s - 700) / 400) * (1 - smoothstep((tp - (T_PASS_MAX - 8)) / 8));
    if (w <= 1e-6) continue;
    cand.push({ i, key: -Math.log(1 - ih(i, 21, 831) * 0.999999) / w, t: tp, dd: rd });
  }
  CORRIDOR_MEN = cand.length;
  if (cand.length < N_FIELD_DEAD) throw new Error(`hundredMotion: only ${cand.length} men in the corridors`);
  cand.sort((a, b) => a.key - b.key);
  for (const c of cand.slice(0, N_FIELD_DEAD)) {
    const i = c.i;
    A_TD[i] = Math.min(T_LAST_DEATH, c.t + Math.max(0.5, 2 + 3 * (2 * ih(i, 22, 832) - 1)));
    // he falls forward and away from the rider
    const a = Math.atan2(Math.sign(c.dd || 1) * 0.8, 0.6) + (ih(i, 23, 833) - 0.5) * 1.2;
    A_FALL[2 * i] = Math.cos(a) * DEAD_FALL_M;
    A_FALL[2 * i + 1] = Math.sin(a) * DEAD_FALL_M;
  }
  // the flight and the stream. Each group's line runs at slope m = dD/ds in
  // the road frame; a man flees along its perpendicular (so the corridor
  // clears square to the riders' path), by fleeOf of his perpendicular
  // distance and the group's half-width, x his own share (inside the group
  // 0.9..1.15, outside 0.35..1.15: the banks feather instead of stacking into
  // a hard edge), from his own moment (+-2 f)
  const slope = (g: number, j: number) => (G_C[g][Math.min(NS - 1, j + 4)] - G_C[g][Math.max(0, j - 4)]) / (S_STEP * (Math.min(NS - 1, j + 4) - Math.max(0, j - 4)));
  for (let i = 0; i < N_ARMY; i++) {
    const s = A_S[i];
    const d = A_D[i];
    const j = sIx(s);
    let near = 0;
    let tS = 119 + Math.max(0, s - 650) / 45;
    const shareOut = 0.35 + 0.8 * ih(i, 31, 841);
    const shareIn = 0.9 + 0.25 * ih(i, 37, 844);
    for (let g = 0; g < 3; g++) {
      const tg = G_T[g][j];
      if (tg === Infinity) continue;
      const u = d - G_C[g][j];
      const m = slope(g, j);
      const cs = 1 / Math.sqrt(1 + m * m);
      const a = Math.abs(u) * cs;
      const We = groupW(s) + 4.5;
      const A = fleeOf(a, We) * (a < We ? shareIn : shareOut) * (A_TD[i] < Infinity ? DEAD_FLEE : 1);
      if (A > 0.05) {
        const sg = u >= 0 ? 1 : -1;
        A_FLEE_D[3 * i + g] = sg * A * cs;
        A_FLEE_S[3 * i + g] = -sg * A * m * cs;
        A_FLEE_T[3 * i + g] = tg - FLEE_LEAD + 4 * (ih(i, 32 + g, 842) - 0.5);
      }
      near = Math.max(near, Math.exp(-((a / 220) ** 2)));
      tS = Math.min(tS, tg);
    }
    A_DRIFT_V[i] = (0.3 + 1.0 * near) * (1 - smoothstep((s - 1500) / 3500)) * (0.75 + 0.5 * ih(i, 36, 843));
    A_DRIFT_T[i] = tS;
  }
})();
export const STRAGGLERS = STRAG.length;
/** of them, still walking on f0 */
export const STRAGGLERS_F0 = STRAG.filter((i) => STRAG_SETTLE[i] > 0).length;
export const STRAG_LAST = Math.max(0, ...STRAG.map((i) => STRAG_SETTLE[i]));
if (STRAG_LAST >= 110) throw new Error(`hundredMotion: a straggler still walking on f${STRAG_LAST}`);
const STRAG_SET = new Uint8Array(N_ARMY);
for (const i of STRAG) STRAG_SET[i] = 1;

// ---------------------------------------------------------------------------
// THE COUNTS (asserted): 4,800 in the square, 600 at the street mouths, 2,600
// in the fields = 8,000, every one fallen by "enemy" (f156) and none after
// ---------------------------------------------------------------------------
export const COUNTS = (() => {
  let square = 0;
  let mouth = 0;
  let field = 0;
  let escaped = 0;
  let late = 0;
  for (let i = 0; i < N_CROWD; i++) {
    const t = PLAZA_TD[i];
    if (PLAZA_KIND[i] === 3) escaped++;
    if (t === Infinity) continue;
    if (t > T_LAST_DEATH) late++;
    if (PLAZA_KIND[i] === 2) mouth++;
    else square++;
  }
  for (let i = 0; i < N_ARMY; i++) {
    const t = A_TD[i];
    if (t === Infinity) continue;
    if (t > T_LAST_DEATH) late++;
    field++;
  }
  return { square, mouth, field, escaped, late, total: square + mouth + field };
})();
if ((COUNTS.square !== N_PLAZA_DEAD || COUNTS.mouth !== N_MOUTH_DEAD || COUNTS.field !== N_FIELD_DEAD || COUNTS.total !== 8000 || COUNTS.late !== 0)
  ) throw new Error(`hundredMotion: the dead do not add up ${JSON.stringify(COUNTS)}`);
/** how many have begun to fall by frame f */
export const deadBy = (f: number) => {
  let n = 0;
  for (let i = 0; i < N_CROWD; i++) if (PLAZA_TD[i] <= f) n++;
  for (let i = 0; i < N_ARMY; i++) if (A_TD[i] <= f) n++;
  return n;
};
if (deadBy(T_DEAD_BY) !== 8000) throw new Error(`hundredMotion: 8,000 must have fallen by f${T_DEAD_BY}`);

// ---------------------------------------------------------------------------
// PER FRAME
// ---------------------------------------------------------------------------
/** the army's look */
const DRIFT_PX = 0.3;
const fleeE = (x: number) => (x <= 0 ? 0 : x >= FLEE_T ? 1 : smootherstep(x / FLEE_T));
/** an army man's road coordinates at t (before the fall) */
const armyST = (i: number, t: number): P2 => {
  let s: number;
  let d: number;
  if (STRAG_SET[i] && t < STRAG_SETTLE[i]) [s, d] = armySD(i, vastFrame(t));
  else {
    s = A_S[i];
    d = A_D[i];
  }
  for (let g = 0; g < 3; g++) {
    const ft = A_FLEE_T[3 * i + g];
    if (ft === Infinity || t <= ft) continue;
    const e = fleeE(t - ft);
    d += A_FLEE_D[3 * i + g] * e;
    s += A_FLEE_S[3 * i + g] * e;
  }
  const dv = A_DRIFT_V[i];
  if (dv > 0) s += dv * rampInt(t - A_DRIFT_T[i], 20);
  return [s, d];
};
/** an army man at f, for the checks: world point and how dead */
export const armyManAt = (i: number, f: number, k: number) => {
  const tD = A_TD[i];
  const u = f - tD;
  const q = u <= 0 ? 0 : u >= DEAD_EASE_F ? 1 : smoothstep(u / DEAD_EASE_F);
  let [s, d] = armyST(i, Math.min(f, tD));
  s += A_FALL[2 * i] * q;
  d += A_FALL[2 * i + 1] * q;
  const [x, y] = frameAt(s, d);
  const amp = (DRIFT_PX / k) * (1 - q);
  return { x: x + amp * Math.sin(f * A_PH[4 * i + 2] + A_PH[4 * i]), y: y + amp * Math.sin(f * A_PH[4 * i + 3] + A_PH[4 * i + 1]), q };
};

/** dots of one frame, split by state: living (layers), dead, and the dying in
 *  N_Q buckets of q (each bucket drawn at its mid q) */
export const N_Q = 4;
export type DotSplit = { living: Float32Array[]; dead: Float32Array; dying: Float32Array[] };
const grow = (a: Float32Array<ArrayBuffer>, n: number): Float32Array<ArrayBuffer> => {
  if (n <= a.length) return a;
  const b = new Float32Array(Math.max(n, a.length * 2));
  b.set(a);
  return b;
};
const split = (n: number, nLayers: number, at: (i: number) => { x: number; y: number; q: number }, layerOf: (i: number) => number = (i) => i % nLayers): DotSplit => {
  // (layers may be uneven, e.g. the army's fields vs its divisions: each grows)
  const living = Array.from({ length: nLayers }, () => new Float32Array(Math.ceil(n / nLayers) * 2));
  const lc = new Array(nLayers).fill(0);
  let dead = new Float32Array(1024);
  let dc = 0;
  const dying = Array.from({ length: N_Q }, () => new Float32Array(256));
  const yc = new Array(N_Q).fill(0);
  for (let i = 0; i < n; i++) {
    const { x, y, q } = at(i);
    if (q <= 0) {
      const L = layerOf(i);
      living[L] = grow(living[L], lc[L] + 2);
      living[L][lc[L]++] = x;
      living[L][lc[L]++] = y;
    } else if (q >= 1) {
      dead = grow(dead, dc + 2);
      dead[dc++] = x;
      dead[dc++] = y;
    } else {
      const b = Math.min(N_Q - 1, Math.floor(q * N_Q));
      dying[b] = grow(dying[b], yc[b] + 2);
      dying[b][yc[b]++] = x;
      dying[b][yc[b]++] = y;
    }
  }
  return { living: living.map((a, L) => a.subarray(0, lc[L])), dead: dead.subarray(0, dc), dying: dying.map((a, b) => a.subarray(0, yc[b])) };
};
/** the living army in 6 interleaved layers: 0..2 the fields and the camp,
 *  3..5 the three divisions (their own, lower alpha: the dense masses stay a
 *  stipple under ~0.6 tone while the thin fields still read in the wide) */
export const ARMY_LAYERS = 6;
export const ARMY_DIVISION_LAYERS = [3, 4, 5];
/** the army at frame f (world metres) */
export const armyFrame = (f: number, k: number): DotSplit =>
  split(N_ARMY, ARMY_LAYERS, (i) => armyManAt(i, f, k), (i) => (i % 3) + (A_KIND[i] === 1 ? 3 : 0));
/** the 6,000 in the square at frame f (world metres) */
export const plazaFrame = (f: number): DotSplit => split(N_CROWD, 1, (i) => plazaManAt(i, f));
/** the bucket's mid q */
export const bucketQ = (b: number) => (b + 0.5) / N_Q;

// ---------------------------------------------------------------------------
// THE LOOKS (screen px / rungs at zoom k), shared by the component and by
// HundredOpeningLayers (hundredOpening.tsx). f0 IS A JOIN FRAME: the cut
// before this one ("he has some 160, 190 conquistadors") plays f-91..-1 of
// this timeline on camAt and ends on exactly this f0 picture: the square
// packed with the 6,000 (cream dots, the full rung 0.865, a 0.9 px dark
// casing, radius crowdR(k) * k = 1.95 px at k 1.3); the 168 at their posts as
// cased orange dots (orangeR 3.0 px at k 1.3, casing 1.4 px; the 62 horse
// standing in their halls, Pizarro's 25 and Candia's 9 on the platform, 72 at
// the gates; no glyphs); "168" standing under the plaza (no entrance here).
// ---------------------------------------------------------------------------
/** the hold's zoom on "zero" (the "0" lands at 160 px there) */
export const K_ZERO = camAt(W.zero).k;
export const lnk01 = (k: number, a: number, b: number) => smoothstep((Math.log(k) - Math.log(a)) / (Math.log(b) - Math.log(a)));
export const LOOK = {
  /** the square's 6,000: daylight between the men at every framing (radius
   *  0.53 px x k = 0.36 of their 1.46 m spacing; 1.06 px at k 2), a speck
   *  floor of 0.6 px in the wide; the full rung; no casing */
  crowdR: (k: number) => Math.max(0.6, 0.53 * k),
  crowdOpacity: INK_FULL,
  crowdCasing: 0,
  /** the plain's 80,000: a stipple of ARMY_LAYERS interleaved low-alpha
   *  layers (never a slab): radius (px) and per-layer alpha, low in the wide
   *  where the dots overlap, higher close up where they stand apart */
  armyR: (k: number) => 0.65 + 0.45 * lnk01(k, 0.2, 1.2),
  armyMax: 0.4,
  /** a division layer's alpha */
  armyAlpha: (k: number, wide = 0.4) => wide + (0.75 - wide) * lnk01(k, 0.45, 1.0),
  /** a fields / camp layer's alpha (thinner ground: brighter dots) */
  fieldAlpha: (k: number) => 0.66 + (0.8 - 0.66) * lnk01(k, 0.45, 1.0),
  /** the 168: cased orange dots, a speck in the wide, 3.0 px close */
  orangeR: (k: number) => 1.85 + 1.15 * lnk01(k, 0.5, 2.0),
  orangeCasing: 1.2,
  /** the causeway (context rung) */
  roadOpacity: INK_CONTEXT,
  roadWidth: 1.4,
  roadCasing: 2.2,
};
/** the numerals ("168", then "0"): IM Fell English roman (incaShared
 *  NumeralLabel), world-anchored under the plaza's box, the label size law */
export const NUMERAL = {
  anchor: [PLAZA_C[0], PLAZA_BOTTOM] as P2,
  /** 160 px where each numeral lands ("168" at k 2.0 on f0, "0" at the hold's
   *  k on f174), x (k / k_land)^0.75 within 80..100 % (the label size law) */
  size168: (k: number) => 160 * Math.min(1, Math.max(0.8, Math.pow(k / K_OPEN, 0.75))),
  size0: (k: number) => 160 * Math.min(1, Math.max(0.8, Math.pow(k / K_ZERO, 0.75))),
  /** the baseline below the anchor: a 16 px gap above the figures (IM Fell's
   *  ascending figures stand ~0.6 em) */
  dy: (size: number) => 16 + 0.6 * size,
  /** "0" slides up from f166, full on "zero" (f174) */
  zeroF0: W.zero - 8,
  frames: 12,
  fade: 8,
};
/** "168": standing at the full rung through the pre-roll and f0, to the
 *  context rung f14-f24, gone by f34 */
export const op168 = (f: number) => (INK_FULL - (INK_FULL - INK_CONTEXT) * smoothstep((f - 14) / 10)) * (1 - smoothstep((f - 22) / 12));
/** "0": the full rung, to the context rung as the camera leaves it (f192-f204) */
export const op0 = (f: number) => INK_FULL - (INK_FULL - INK_CONTEXT) * smoothstep((f - 192) / 12);
