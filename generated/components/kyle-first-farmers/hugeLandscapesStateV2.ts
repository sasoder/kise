// ---------------------------------------------------------------------------
// hugeLandscapesStateV2: the layout and the schedules of cut E V2 (43_HugeLandscapes, cold-review pass).
// Pure data + pure functions of E's frame f (E f0 = D f240); no JSX.
//
// E runs on cut D's world (allAboutEnergyState) at the same scale: every person is PEOPLE = 1 (a man 310 world px).
// D's frame at its f240 is the rectangle V0: E draws nothing new inside it that is there on f0; E's own landscape
// (the camp meadow, glades, deer) lies outside V0, its forest identical to D's near V0.
// V2: the band's camp stands on a meadow SOUTH of the river (the river stays outside the range); the range is a
// closed loop that grows outward around the camp; the farm square sits over the field and the heap.
// ---------------------------------------------------------------------------
import { CAM_END, HOUSE, PEOPLE, riverW, riverY } from "./allAboutEnergyState";
import { runCamera, type Cam, type CamKey } from "./firstFarmersShared";
import type { P2 } from "./firstFarmersShared";

export const FPS = 30000 / 1001;
export const DURATION = 334;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const smoother = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** D's frame on its last frame (E's f0), world px */
export const V0 = { x0: CAM_END.x - 540 / CAM_END.k, x1: CAM_END.x + 540 / CAM_END.k, y0: CAM_END.y - 960 / CAM_END.k, y1: CAM_END.y + 960 / CAM_END.k };
/** a tree whose drawing lies wholly outside V0 (base, size): only such trees may differ from D's forest */
export const treeFreeOfV0 = (x: number, y: number, s: number) => x - 175 * s > V0.x1 + 2 || x + 175 * s < V0.x0 - 2 || y + 30 < V0.y0 || y - 700 * s > V0.y1;

export const bankY = (x: number) => riverY(x) - riverW(x) / 2;
/** the south bank (the water's edge on the near side) */
export const southBankY = (x: number) => riverY(x) + riverW(x) / 2;

// ---------------------------------------------------------------------------
// THE TWO SQUARES ("a unit of land"): identical, side by side; the farm one over D's field and the heap (its
// right edge just clear of the goats), the wild one on forest inside the band's range
// ---------------------------------------------------------------------------
export const SQ = 3150;
/** the farm square frames the whole field, the heap and the longhouse; the wild one is its twin inside the range */
export const FARM_SQ: P2 = [-1120, -1635];
export const WILD_SQ: P2 = [2700, -1635];
/** both drawn at once on "unit" (f196), in mirror motion: the farm square counter-clockwise from its top-right
 *  corner, the wild one clockwise from its top-left corner (the corners facing each other across the gap) */
export const SQ_F0 = 186;
export const SQ_F1 = 206;

// ---------------------------------------------------------------------------
// THE BAND on the camp meadow south of the river (flat ground, y = CAMP_Y): four adults walking west to the hut
// (found close up on "huge"); a child comes out of the hut from behind its mother: five. Then the two hunters set
// off again, west across the range toward a distant deer.
// ---------------------------------------------------------------------------
export const BAND_STRIDE = 52;
export const WALK_V = (2 * BAND_STRIDE * PEOPLE) / 24;
export const CAMP_Y = -1820;
export const TENT = { x: 4250, scale: 1.15 };
export const TENT_BASE = CAMP_Y - 56;
export const DOOR_X = TENT.x + 46 * TENT.scale;
export const STOP_F = 100;
export const STOP_EASE = 14;
export type Member = { id: "A" | "B" | "W" | "M"; x1: number; woman: boolean; seed: number; dy: number };
/** walking west: W (a basket of gathered food) leads to the front of the hut, the mother (M) stops at its door,
 *  the men A and B (spears, bows on their backs) at the rear. dy: a little depth between them */
export const BAND: Member[] = [
  { id: "W", x1: TENT.x - 110, woman: true, seed: 3, dy: 6 },
  { id: "M", x1: DOOR_X, woman: true, seed: 4, dy: 0 },
  { id: "B", x1: TENT.x + 500, woman: false, seed: 2, dy: 22 },
  { id: "A", x1: TENT.x + 720, woman: false, seed: 1, dy: 34 },
];
export const byId = (id: Member["id"]) => BAND.find((m) => m.id === id)!;
/** distance still to walk at frame f (world px), the speed eased to 0 over STOP_EASE */
export const toGo = (f: number) => {
  const a = STOP_F - STOP_EASE;
  if (f >= STOP_F) return 0;
  if (f <= a) return WALK_V * (a - f) + (WALK_V * STOP_EASE) / 2;
  const r = STOP_F - f;
  return (WALK_V * r * r) / (2 * STOP_EASE);
};
/** the hunters set off again (B first), west across the range toward the deer; they keep facing west (no turn) */
export const TREK = { B: 122, A: 130, ease: 14 };
export const trekDist = (m: Member, f: number) => {
  if (m.id !== "A" && m.id !== "B") return 0;
  const t = f - TREK[m.id];
  if (t <= 0) return 0;
  return t < TREK.ease ? (WALK_V * t * t) / (2 * TREK.ease) : WALK_V * (t - TREK.ease / 2);
};
export const memberX = (m: Member, f: number) => m.x1 + toGo(f) - trekDist(m, f);
export const memberY = (m: Member) => CAMP_Y + m.dy;
export const walkAmt = (f: number) => (f >= STOP_F ? 0 : f <= STOP_F - STOP_EASE ? 1 : (STOP_F - f) / STOP_EASE);
export const FOOD = { at: [TENT.x - 222, CAMP_Y + 14] as P2, width: 170, height: 70, scale: 1 };
export const POUR_F0 = 110;
export const POUR_F1 = 128;
export const CHILD = { emerge0: 130, emerge1: 142, walk0: 142, walk1: 174, dx: -104 };

// ---------------------------------------------------------------------------
// THE CAMP MEADOW south of the river (open ground in front of the band and to the west, so the hunters' trek and
// the deer they walk toward read), wholly outside V0
// ---------------------------------------------------------------------------
export const MEADOW = { x0: 3330, x1: 5650, y1: -1230 };
export const inMeadow = (x: number, y: number) => {
  if (x < MEADOW.x0 || x > MEADOW.x1) return false;
  const yb = MEADOW.y1 - 110 * (0.5 + 0.5 * Math.sin(x / 300 + 0.8)) * Math.min(1, (x - MEADOW.x0) / 200, (MEADOW.x1 - x) / 200);
  return y > southBankY(x) - 60 && y < yb;
};
export const meadowOutline = (): P2[] => {
  const top: P2[] = [];
  const bot: P2[] = [];
  for (let x = MEADOW.x0 - 30; x <= MEADOW.x1 + 30; x += 40) {
    top.push([x, southBankY(x) + 10]);
    bot.push([x, MEADOW.y1 - 160 - 90 * Math.sin(x / 300 + 0.8)]);
  }
  return [...top, ...bot.reverse()];
};

// ---------------------------------------------------------------------------
// THE RANGE: a closed loop that grows outward around the camp (f27 "huge" -> f90), its cream territory fill
// arriving as it closes. Final shape: star-shaped about the camp (C), clear of the river and of the clearing.
// ---------------------------------------------------------------------------
export const RANGE_F0 = 27;
export const RANGE_F1 = 90;
export const FILL_F0 = 78;
export const FILL_F1 = 100;
export const RANGE_C: P2 = [4250, CAMP_Y - 60];
const RANGE_CTRL: P2[] = [
  [4250, -2080],
  [5200, -2100],
  [6000, -1900],
  [6250, -900],
  [6180, 600],
  [6300, 2200],
  [6050, 4200],
  [5300, 5650],
  [4100, 6100],
  [3250, 5850],
  [2700, 4900],
  [2560, 3300],
  [2470, 1700],
  [2450, 200],
  [2460, -900],
  [2470, -1300],
  [2560, -1700],
  [3100, -2030],
  [3700, -2060],
];
/** the final loop, smoothed (closed Catmull-Rom) with a low wobble */
const RANGE_FINAL: P2[] = (() => {
  const n = RANGE_CTRL.length;
  const out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = RANGE_CTRL[(i - 1 + n) % n];
    const p1 = RANGE_CTRL[i];
    const p2 = RANGE_CTRL[(i + 1) % n];
    const p3 = RANGE_CTRL[(i + 2) % n];
    for (let j = 0; j < 20; j++) {
      const t = j / 20;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out.map((p, i) => {
    const th = (i / out.length) * Math.PI * 2;
    const w = 32 * Math.sin(th * 7 + 0.7) + 16 * Math.sin(th * 17 + 2.1);
    const dx = p[0] - RANGE_C[0];
    const dy = p[1] - RANGE_C[1];
    const l = Math.hypot(dx, dy) || 1;
    // the top edge (by the river) stays put: no wobble where the loop runs close above the camp
    const top = sstep((l - 300) / 500);
    return [p[0] + (dx / l) * w * top, p[1] + (dy / l) * w * top] as P2;
  });
})();
/** how far the range has grown at frame f (0..1) */
export const rangeU = (f: number) => smoother((f - RANGE_F0) / (RANGE_F1 - RANGE_F0));
/** the loop at frame f: every point travels out from the camp to its place (the camp stays inside throughout) */
export const rangeAt = (f: number): P2[] => {
  const u = rangeU(f);
  if (u <= 0) return [];
  // it starts as a small ring round the camp (r 260), then reaches out
  return RANGE_FINAL.map((p) => {
    const dx = p[0] - RANGE_C[0];
    const dy = p[1] - RANGE_C[1];
    const l = Math.hypot(dx, dy) || 1;
    const r0 = Math.min(260, l);
    const r = r0 + (l - r0) * u;
    return [RANGE_C[0] + (dx / l) * r, RANGE_C[1] + (dy / l) * r] as P2;
  });
};
export const rangeFill = (f: number) => sstep((f - FILL_F0) / (FILL_F1 - FILL_F0));

// ---------------------------------------------------------------------------
// THE LANDSCAPE beyond D's frame: glades and deer
// ---------------------------------------------------------------------------
export type Glade = { cx: number; cy: number; rx: number; ry: number };
export const GLADES: Glade[] = [
  { cx: 4320, cy: -640, rx: 420, ry: 360 },
  { cx: 4300, cy: 5900, rx: 620, ry: 460 },
];
export const inGlade = (x: number, y: number) => inMeadow(x, y) || GLADES.some((g) => ((x - g.cx) / g.rx) ** 2 + ((y - g.cy) / g.ry) ** 2 < 1);
export type DeerSpec = { at: P2; dir: 1 | -1; stag: boolean; seed: number; scale: number; walk?: { f0: number; f1: number; dx: number } };
/** deer 0: the wild square's one stag; on "such higher rates of energy" it walks slowly out of its square (east,
 *  into the trees). deer 3: the distant deer the hunters trek toward, at the meadow's west end. */
export const WILD_DEER: DeerSpec[] = [
  { at: [4300, -790], dir: 1, stag: true, seed: 1, scale: 1 },
  { at: [4140, 5850], dir: 1, stag: false, seed: 2, scale: 0.95 },
  { at: [4470, 5960], dir: -1, stag: true, seed: 3, scale: 1 },
  { at: [3480, -1770], dir: 1, stag: true, seed: 6, scale: 1 },
  { at: [5150, bankY(5150) - 26], dir: 1, stag: false, seed: 4, scale: 0.95 },
];
/** a deer's position and walk at frame f */
export const deerAt = (d: DeerSpec, f: number) => {
  if (!d.walk) return { at: d.at, dist: 0, moving: 0 };
  const u = c01((f - d.walk.f0) / (d.walk.f1 - d.walk.f0));
  // a slow amble: eases in, then steady
  const e = u < 0.15 ? (u * u) / 0.3 : u - 0.075;
  const dist = (d.walk.dx * e) / 0.925;
  return { at: [d.at[0] + d.dir * dist, d.at[1]] as P2, dist, moving: u > 0 && u < 1 ? Math.min(1, u * 8) : 0 };
};

// ---------------------------------------------------------------------------
// THE FARM's new people: out of the longhouse door (behind the heap's right flank), round the heap's right foot
// and into the yard in front of the heap, inside the farm square. A first group comes out during the wide (the
// square is already full when it is laid down); four carry baskets of grain to a second heap in the yard and tip
// them out on "higher" and "energy"; more come out of the door in two bursts (f252, f294).
// ---------------------------------------------------------------------------
export const DOOR: P2 = [HOUSE.at[0] - 0.12 * (HOUSE.len / 2) * HOUSE.scale, HOUSE.at[1]];
export const DOOR_W = 110 * HOUSE.scale;
export const DOOR_H = 250 * HOUSE.scale;
export const CROWD_STRIDE = 62;
export const CROWD_V = (2 * CROWD_STRIDE * PEOPLE) / 18;
const P_IN: P2 = [DOOR[0], DOOR[1] - 26];
const P_OUT: P2 = [DOOR[0] + 12, DOOR[1] + 36];
const ROUND: P2[] = [[1690, 30], [1676, 176], [1560, 250]];
/** the second heap, in the yard right of the big one, against the longhouse's end: it piles up past the farm
 *  square's right edge (orange; fed by the basket carriers on "higher" and "energy") */
export const HEAP2 = { at: [1835, 330] as P2, width: 370, height: 620, scale: 1 };
export type Arrival = { t0: number; path: P2[]; woman: boolean; child: boolean; seed: number; face: 1 | -1; pour?: { f0: number; share: number } };
const arr = (t0: number, slot: P2, o: { woman?: boolean; child?: boolean; seed: number; face?: 1 | -1; pour?: { f0: number; share: number }; via?: P2[] }): Arrival => ({
  t0,
  path: [P_IN, P_OUT, ...ROUND, ...(o.via ?? []), slot],
  woman: !!o.woman,
  child: !!o.child,
  seed: o.seed,
  face: o.face ?? -1,
  pour: o.pour,
});
export const ARRIVALS: Arrival[] = [
  // the basket carriers (first out): they stand at HEAP2's left foot, facing it; two tip together on "higher"
  // (f256: the heap jumps), then the rest in turn up to "energy"
  arr(2, [1592, 360], { seed: 31, face: 1, pour: { f0: 254, share: 0.26 } }),
  arr(8, [1560, 424], { woman: true, seed: 32, face: 1, pour: { f0: 257, share: 0.26 } }),
  arr(14, [1600, 300], { seed: 33, face: 1, pour: { f0: 276, share: 0.12 } }),
  arr(20, [1520, 392], { woman: true, seed: 34, face: 1, pour: { f0: 286, share: 0.12 } }),
  arr(26, [1540, 270], { seed: 35, face: 1, pour: { f0: 296, share: 0.12 } }),
  arr(32, [1500, 440], { woman: true, seed: 36, face: 1, pour: { f0: 306, share: 0.12 } }),
  // the first group: the yard in front of the heap
  arr(40, [800, 330], { seed: 11, via: [[1100, 300]] }),
  arr(46, [690, 390], { woman: true, seed: 12, via: [[1100, 300]] }),
  arr(50, [610, 300], { child: true, seed: 13, via: [[1100, 300]] }),
  arr(54, [560, 420], { seed: 14, face: 1, via: [[1100, 300]] }),
  arr(58, [440, 360], { woman: true, seed: 15, face: 1, via: [[1100, 300]] }),
  arr(64, [960, 330], { seed: 19, via: [[1100, 300]] }),
  arr(70, [1300, 400], { child: true, seed: 17 }),
  arr(76, [1250, 300], { woman: true, seed: 18 }),
  arr(84, [880, 430], { seed: 16, via: [[1100, 300]] }),
  // more of them, round the heap and into the yard just as "higher" lands (f260), and again on "energy" (f303)
  arr(144, [1180, 240], { seed: 24 }),
  arr(149, [1110, 360], { woman: true, seed: 25 }),
  arr(154, [1210, 440], { child: true, seed: 26 }),
  arr(187, [1050, 250], { woman: true, seed: 27, via: [[1100, 280]] }),
  arr(192, [1000, 380], { seed: 28, via: [[1100, 300]] }),
  arr(197, [1150, 470], { woman: true, seed: 29 }),
];
/** HEAP2's amount at frame f: each carrier's share comes out over 14 frames from pour.f0 + 4 */
export const POUR_LEN = 16;
export const heap2Amount = (f: number) => {
  let a = 0;
  for (const r of ARRIVALS) if (r.pour) a += r.pour.share * sstep((f - r.pour.f0 - 4) / (POUR_LEN - 4));
  return Math.min(1, a);
};
export const STEP_F = 14;
/** an arrival at frame f: where, how far walked (for the legs), moving or not, facing */
export const arrivalAt = (a: Arrival, f: number): { at: P2; dist: number; moving: number; dir: 1 | -1; inside: boolean; out: number } | null => {
  const t = f - a.t0;
  if (t < 0) return null;
  if (t < STEP_F) {
    const u = sstep(t / STEP_F);
    const at: P2 = [P_IN[0] + (P_OUT[0] - P_IN[0]) * u, P_IN[1] + (P_OUT[1] - P_IN[1]) * u];
    return { at, dist: u * 40, moving: 1, dir: 1, inside: at[1] < DOOR[1] + 1, out: u };
  }
  let d = (t - STEP_F) * CROWD_V;
  const legs = a.path.slice(1);
  let total = 0;
  for (let i = 1; i < legs.length; i++) total += Math.hypot(legs[i][0] - legs[i - 1][0], legs[i][1] - legs[i - 1][1]);
  const left = total - d;
  if (left < 30) d = total - (left > 0 ? (left * left) / 60 : 0);
  const moving = left > 0 ? Math.min(1, left / 30) : 0;
  let rem = Math.min(d, total);
  for (let i = 1; i < legs.length; i++) {
    const p = legs[i - 1];
    const q = legs[i];
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (rem <= l || i === legs.length - 1) {
      const u = Math.min(1, rem / l);
      const dir = moving > 0 ? ((q[0] - p[0] >= 0 ? 1 : -1) as 1 | -1) : a.face;
      return { at: [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u], dist: 40 + Math.min(d, total), moving, dir, inside: false, out: 1 };
    }
    rem -= l;
  }
  return null;
};
/** the frame an arrival reaches the end of its path */
export const arrivalEnd = (a: Arrival) => {
  const legs = a.path.slice(1);
  let total = 0;
  for (let i = 1; i < legs.length; i++) total += Math.hypot(legs[i][0] - legs[i - 1][0], legs[i][1] - legs[i - 1][1]);
  return a.t0 + STEP_F + total / CROWD_V;
};

// ---------------------------------------------------------------------------
// THE CAMERA (E frames; f0 = D's camera at its f240 exactly). Out of the clearing straight to the band (found close
// on "huge"), a long pull-back as the range grows round them, a slow drift toward the camp over "feed / grow /
// reproduce" (the farm stays whole in frame), then out to the two squares and a creep.
// ---------------------------------------------------------------------------
export const CAM_BAND = { x: 4560, y: -2010, k: 0.25 };
export const CAM_WIDE = { x: 2600, y: 300, k: 0.14 };
/** closer on the camp for the pour, the child and the hunters setting off (farm off frame, bands clear) */
export const CAM_CAMP = { x: 4700, y: -1153, k: 0.24 };
/** the payoff: both squares side by side, each ~41% of the frame width, their bottoms above y 1040 */
/** the squares drawn: both whole in frame, their bottoms above y 1040 */
export const CAM_RES = { x: 2365, y: 927, k: 0.136 };
/** the payoff: pushed in, both squares side by side across the top half (each ~43% of the width) */
export const CAM_PAY = { x: 2365, y: 974, k: 0.148 };
const CAM_KEYS: CamKey[] = [
  { f: -30, ...CAM_END },
  { f: 0, ...CAM_END },
  { f: 36, ...CAM_BAND },
  { f: 92, ...CAM_WIDE },
  { f: 128, ...CAM_CAMP },
  { f: 142, x: CAM_CAMP.x - 40, y: CAM_CAMP.y + 10, k: CAM_CAMP.k * 0.995 },
  { f: 192, ...CAM_RES },
  { f: 244, ...CAM_PAY },
  { f: 340, x: CAM_PAY.x, y: 985, k: 0.151 },
];
/** E's camera: f0 is D's camera on its f240 exactly (then firstFarmersShared's pchip + damped follow) */
export const camE = (f: number): Cam => (f <= 0 ? CAM_END : runCamera(CAM_KEYS, f));

export { sstep, c01, smoother };
