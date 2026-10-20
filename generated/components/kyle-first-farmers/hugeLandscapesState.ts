// ---------------------------------------------------------------------------
// hugeLandscapesState: the layout and the schedules of cut E (43_HugeLandscapes).
// Pure data + pure functions of E's frame f (E f0 = D f240); no JSX.
//
// E runs on cut D's world (allAboutEnergyState: the pictorial-map ground, the
// forest generator, the river, the clearing and its farm) at the same scale:
// every person is PEOPLE = 1 (a man 310 world px). D's frame at its f240 is the
// rectangle V0: inside it E draws nothing new that is there on f0; E's own
// landscape (glades, deer) lies outside V0, its forest identical to D's near V0.
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

/** D's frame on its last frame (E's f0), world px */
export const V0 = { x0: CAM_END.x - 540 / CAM_END.k, x1: CAM_END.x + 540 / CAM_END.k, y0: CAM_END.y - 960 / CAM_END.k, y1: CAM_END.y + 960 / CAM_END.k };
/** a tree whose drawing lies wholly outside V0 (base, size): only such trees may differ from D's forest */
export const treeFreeOfV0 = (x: number, y: number, s: number) => x - 175 * s > V0.x1 + 2 || x + 175 * s < V0.x0 - 2 || y + 30 < V0.y0 || y - 700 * s > V0.y1;

// ---------------------------------------------------------------------------
// THE NORTH BANK: the water's edge, and the path the band walks along it
// ---------------------------------------------------------------------------
export const bankY = (x: number) => riverY(x) - riverW(x) / 2;
export const pathY = (x: number) => bankY(x) - 34;

// ---------------------------------------------------------------------------
// THE TWO SQUARES ("a unit of land"): identical, side by side; the farm one over
// D's farmyard (field ends, stooks, carriers, the heap, the longhouse, the goats),
// the wild one on forest inside the band's range
// ---------------------------------------------------------------------------
export const SQ = 1990;
export const FARM_SQ: P2 = [50, -1360];
export const WILD_SQ: P2 = [2930, -1360];
/** both drawn by a tip from the top-left corner, clockwise, at once */
export const SQ_F0 = 170;
export const SQ_F1 = 207;

// ---------------------------------------------------------------------------
// THE BAND (four adults walking west along the north bank to their camp; then a
// child comes out of the hut from behind its mother: five)
// ---------------------------------------------------------------------------
/** the band's brisk walk: stride 52 units, 24 frames a cycle (4.33 world px a frame) */
export const BAND_STRIDE = 52;
export const WALK_V = (2 * BAND_STRIDE * PEOPLE) / 24;
/** the hut (HideTent), its door (dx 46 units), its base just behind the path */
export const TENT = { x: 3640, scale: 1.15 };
export const TENT_BASE = bankY(TENT.x) - 82;
export const DOOR_X = TENT.x + 46 * TENT.scale;
/** the band stops on this frame (eased over STOP_EASE frames before it) */
export const STOP_F = 100;
export const STOP_EASE = 14;
export type Member = { id: "A" | "B" | "W" | "M"; x1: number; woman: boolean; seed: number };
/** walking west: W (a basket of gathered food) leads to the front of the hut, the mother (M) stops at its door,
 *  the men A and B (spears, bows on their backs) at the rear. Found trekking, most of them are still on their way
 *  in. (The bank rises eastward: whoever stands in front of the hut must stand west of its door to sort in front.) */
export const BAND: Member[] = [
  { id: "W", x1: TENT.x - 110, woman: true, seed: 3 },
  { id: "M", x1: DOOR_X, woman: true, seed: 4 },
  { id: "B", x1: TENT.x + 520, woman: false, seed: 2 },
  { id: "A", x1: TENT.x + 730, woman: false, seed: 1 },
];
export const byId = (id: Member["id"]) => BAND.find((m) => m.id === id)!;
/** distance still to walk at frame f (world px): v x (STOP_F - f) with the speed eased to 0 over STOP_EASE */
export const toGo = (f: number) => {
  const a = STOP_F - STOP_EASE;
  if (f >= STOP_F) return 0;
  if (f <= a) return WALK_V * (a - f) + (WALK_V * STOP_EASE) / 2;
  // speed v (1 - u)^... : v * (1 - sstep-ish): use linear decel v * (STOP_F - f) / STOP_EASE
  const r = STOP_F - f;
  return (WALK_V * r * r) / (2 * STOP_EASE);
};
/** the men set off again, back east into their range (B first, A a few frames later): turn, then walk */
export const WALKON = { A: 276, B: 268, turn: 14 };
export const walkOnDist = (m: Member, f: number) => {
  if (m.id !== "A" && m.id !== "B") return 0;
  const t = f - WALKON[m.id] - WALKON.turn;
  if (t <= 0) return 0;
  // speed eases up over 10 frames
  return t < 10 ? (WALK_V * t * t) / 20 : WALK_V * (t - 5);
};
export const memberX = (m: Member, f: number) => m.x1 + toGo(f) + walkOnDist(m, f);
/** the walk's amount at frame f (1 walking, 0 standing) */
export const walkAmt = (f: number) => (f >= STOP_F ? 0 : f <= STOP_F - STOP_EASE ? 1 : (STOP_F - f) / STOP_EASE);
/** the food heap at the hut (cream, tiny), W tips her basket onto it */
export const FOOD = { at: [TENT.x - 222, pathY(TENT.x - 222) + 8] as P2, width: 170, height: 70, scale: 1 };
export const POUR_F0 = 110;
export const POUR_F1 = 128;
/** the child: out of the hut's door behind M (stooped), up, then out from behind her to her east side */
export const CHILD = { emerge0: 130, emerge1: 142, walk0: 142, walk1: 174, dx: -104 };

// ---------------------------------------------------------------------------
// THE RANGE LOOP: the band's trail. Two pieces: the walked trail laid at the
// mother's heels from S0 (where she is when the band is found), and a tip that
// leaves S0 southward, crosses the river, runs all the way round the landscape
// and comes back along the north bank from the west to the band's front, where
// it closes as they reach their camp.
// ---------------------------------------------------------------------------
export const TRAIL_F0 = 30;
export const TRAIL_F1 = 98;
export const S0: P2 = [memberX(byId("A"), TRAIL_F0) + 40, pathY(memberX(byId("A"), TRAIL_F0) + 40)];
const CTRL: P2[] = [
  S0,
  [S0[0] - 30, riverY(S0[0] - 30)],
  [S0[0] - 90, riverY(S0[0] - 90) + riverW(S0[0] - 90) / 2 + 70],
  [3300, -1720],
  [2760, -1480],
  [2500, -1150],
  [2470, -400],
  [2500, 600],
  [2620, 1500],
  [2560, 2700],
  [2760, 4100],
  [3100, 5300],
  [3700, 5950],
  [4500, 6120],
  [5200, 5700],
  [5500, 4700],
  [5330, 3300],
  [5580, 1800],
  [5470, 0],
  [5600, -1900],
  [5430, -3700],
  [5550, -4700],
  [5000, -5450],
  [3900, -5330],
  [2800, -5650],
  [1500, -5430],
  [300, -5600],
  [-450, -5050],
  [-520, -4100],
  [-680, -3300],
  [-420, -2600],
  [-330, pathY(-330)],
];
/** centripetal-ish Catmull-Rom through the control points, n samples per span */
const catmull = (pts: P2[], n: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : [p2[0] + 60, pathY(p2[0] + 60)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
};
/** the tip's whole path, densely sampled, with its cumulative length */
export const TIP_PATH: P2[] = (() => {
  const raw = catmull(CTRL, 24);
  // a low, irregular wobble across the line (a walked range, not a drawn box), none near the river crossing or the bank
  let s0 = 0;
  const sl = raw.map((p, i) => (i ? (s0 += Math.hypot(p[0] - raw[i - 1][0], p[1] - raw[i - 1][1])) : 0));
  const tot = s0;
  const a: P2[] = raw.map((p, i) => {
    const q = raw[Math.min(raw.length - 1, i + 1)];
    const o = raw[Math.max(0, i - 1)];
    const tx = q[0] - o[0];
    const ty = q[1] - o[1];
    const tl = Math.hypot(tx, ty) || 1;
    const fade = sstep(sl[i] / 1800) * sstep((tot - sl[i]) / 1800);
    const w = fade * (70 * Math.sin(sl[i] / 820 + 0.7) + 38 * Math.sin(sl[i] / 310 + 2.1) + 16 * Math.sin(sl[i] / 120 + 0.4));
    return [p[0] - (ty / tl) * w, p[1] + (tx / tl) * w];
  });
  const end = byId("W").x1 - 30;
  for (let x = -330; x <= end; x += 40) a.push([x, pathY(x)]);
  a.push([end, pathY(end)]);
  return a;
})();
export const TIP_LEN: number[] = (() => {
  const L = [0];
  for (let i = 1; i < TIP_PATH.length; i++) L.push(L[i - 1] + Math.hypot(TIP_PATH[i][0] - TIP_PATH[i - 1][0], TIP_PATH[i][1] - TIP_PATH[i - 1][1]));
  return L;
})();
export const TIP_TOTAL = TIP_LEN[TIP_LEN.length - 1];
/** the tip's progress 0..1 at frame f: a quick start, a steady run, a slow close */
export const tipU = (f: number) => {
  const u = c01((f - TRAIL_F0) / (TRAIL_F1 - TRAIL_F0));
  // speed: ramps up over the first 10 %, flat, ramps down over the last 22 %
  const a = 0.1;
  const b = 0.22;
  const vmax = 1 / (1 - a / 2 - b / 2);
  if (u < a) return (vmax * u * u) / (2 * a);
  if (u < 1 - b) return vmax * (a / 2 + (u - a));
  const r = 1 - u;
  return 1 - (vmax * r * r) / (2 * b);
};
/** the drawn part of the tip's path at frame f */
export const tipPrefix = (f: number): P2[] => {
  const s = tipU(f) * TIP_TOTAL;
  if (s <= 0) return [];
  const out: P2[] = [];
  for (let i = 0; i < TIP_PATH.length; i++) {
    if (TIP_LEN[i] <= s) out.push(TIP_PATH[i]);
    else {
      const p = TIP_PATH[i - 1];
      const q = TIP_PATH[i];
      const t = (s - TIP_LEN[i - 1]) / (TIP_LEN[i] - TIP_LEN[i - 1]);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      break;
    }
  }
  return out;
};
/** the walked trail at frame f: from S0 west to the mother's heels */
export const walkedTrail = (f: number): P2[] => {
  if (f < TRAIL_F0) return [];
  const xe = byId("A").x1 + toGo(f) + 40;
  const out: P2[] = [];
  for (let x = S0[0]; x > xe; x -= 30) out.push([x, pathY(x)]);
  out.push([xe, pathY(xe)]);
  return out;
};

// ---------------------------------------------------------------------------
// THE LANDSCAPE beyond D's frame: glades (trees left out) and deer
// ---------------------------------------------------------------------------
export type Glade = { cx: number; cy: number; rx: number; ry: number };
/** the wild square's one deer stands in a small glade; two more graze a glade low in the range */
export const GLADES: Glade[] = [
  { cx: 4080, cy: -200, rx: 430, ry: 460 },
  { cx: 4300, cy: 4380, rx: 620, ry: 520 },
];
/** the band's camp meadow: open ground behind the north bank from just east of D's frame to past the men */
export const MEADOW = { x0: 3300, x1: 4760, depth: 640 };
export const inMeadow = (x: number, y: number) => {
  if (x < MEADOW.x0 || x > MEADOW.x1) return false;
  const b = bankY(x);
  // ragged back edge: a few trees stand into it
  const d = MEADOW.depth * (0.82 + 0.18 * Math.sin(x / 260 + 1.3)) * Math.min(1, (x - MEADOW.x0) / 110, (MEADOW.x1 - x) / 260 + 0.25);
  return y > b - d && y < b + 40;
};
export const inGlade = (x: number, y: number) => inMeadow(x, y) || GLADES.some((g) => ((x - g.cx) / g.rx) ** 2 + ((y - g.cy) / g.ry) ** 2 < 1);
/** the meadow's ground outline (world), for its lighter tint */
export const meadowOutline = (): P2[] => {
  const top: P2[] = [];
  const bot: P2[] = [];
  for (let x = MEADOW.x0 - 40; x <= MEADOW.x1 + 60; x += 40) {
    const b = bankY(x);
    const d = MEADOW.depth * (0.82 + 0.18 * Math.sin(x / 260 + 1.3)) * Math.min(1, Math.max(0, (x - MEADOW.x0) / 110), (MEADOW.x1 - x) / 260 + 0.25);
    top.push([x, b - Math.max(0, d) * 0.85]);
    bot.push([x, b + 6]);
  }
  return [...top, ...bot.reverse()];
};
export type DeerSpec = { at: P2; dir: 1 | -1; stag: boolean; seed: number; scale: number };
export const WILD_DEER: DeerSpec[] = [
  { at: [4060, 0], dir: -1, stag: true, seed: 1, scale: 1 },
  { at: [4140, 4290], dir: 1, stag: false, seed: 2, scale: 0.95 },
  { at: [4470, 4430], dir: -1, stag: true, seed: 3, scale: 1 },
  { at: [5150, pathY(5150) + 8], dir: 1, stag: false, seed: 4, scale: 0.95 },
  { at: [5350, pathY(5350) + 10], dir: -1, stag: true, seed: 5, scale: 1 },
];

// ---------------------------------------------------------------------------
// THE CAMERA (E frames; f0 = D's camera at its f240 exactly)
// ---------------------------------------------------------------------------
/** the wide (the range loop is drawn), a drift toward the band's camp (they feed, the child), the resolved frame */
export const CAM_WIDE = { x: 2483, y: 250, k: 0.145 };
/** foragers ~100 px tall (k 0.32), the band in the upper middle, the farm below the caption bands / off frame */
export const CAM_CAMP = { x: 3900, y: -1950, k: 0.32 };
export const CAM_RES = { x: 2400, y: 268, k: 0.158 };
const CAM_KEYS: CamKey[] = [
  { f: -30, ...CAM_END },
  { f: 0, ...CAM_END },
  { f: 58, ...CAM_WIDE },
  { f: 84, x: CAM_WIDE.x + 60, y: CAM_WIDE.y - 40, k: CAM_WIDE.k * 1.02 },
  { f: 124, ...CAM_CAMP },
  { f: 158, x: CAM_CAMP.x - 50, y: CAM_CAMP.y + 20, k: CAM_CAMP.k * 1.03 },
  { f: 226, ...CAM_RES },
  { f: 340, x: CAM_RES.x - 10, y: CAM_RES.y + 6, k: CAM_RES.k * 1.025 },
];
/** E's camera: f0 is D's camera on its f240 exactly (then firstFarmersShared's pchip + damped follow) */
export const camE = (f: number): Cam => (f <= 0 ? CAM_END : runCamera(CAM_KEYS, f));

// ---------------------------------------------------------------------------
// THE FARM's new people: out of the longhouse door (behind the heap's right
// flank), along the house front and into the yard right of the heap. A first
// group comes out during the wide (the square is already full when it is laid
// down); more come out on "such higher rates of energy". Brisk walk: stride 52,
// 24 frames a cycle (4.33 world px a frame).
// ---------------------------------------------------------------------------
export const DOOR: P2 = [HOUSE.at[0] - 0.12 * (HOUSE.len / 2) * HOUSE.scale, HOUSE.at[1]];
export const DOOR_W = 110 * HOUSE.scale;
export const DOOR_H = 250 * HOUSE.scale;
export const CROWD_STRIDE = 52;
export const CROWD_V = (2 * CROWD_STRIDE * PEOPLE) / 20;
/** the step out of the dark doorway (inside -> just in front of the wall) */
const P_IN: P2 = [DOOR[0], DOOR[1] - 26];
const P_OUT: P2 = [DOOR[0] + 12, DOOR[1] + 36];
/** where the yard path rounds the heap's right foot (they cross the heap's base line clear of the dome) */
const ROUND: P2[] = [[1770, 40], [1712, 172]];
export type Arrival = { t0: number; path: P2[]; woman: boolean; child: boolean; seed: number; face: 1 | -1 };
const arr = (t0: number, slot: P2, o: { woman?: boolean; child?: boolean; seed: number; face?: 1 | -1; round?: boolean }): Arrival => ({
  t0,
  path: [P_IN, P_OUT, ...(o.round ? ROUND : []), slot],
  woman: !!o.woman,
  child: !!o.child,
  seed: o.seed,
  face: o.face ?? (slot[0] > 1800 ? -1 : 1),
});
export const ARRIVALS: Arrival[] = [
  // the first group (out during the wide). The front yard, the longest walk, first: they are still coming in on
  // "such higher rates of energy"; then the front rows right of the heap
  arr(2, [1452, 334], { seed: 31, round: true }),
  arr(8, [1330, 396], { woman: true, seed: 32, round: true }),
  arr(14, [1206, 352], { seed: 33, round: true }),
  arr(20, [1270, 468], { child: true, seed: 34, round: true }),
  arr(26, [1104, 430], { woman: true, seed: 35, round: true }),
  arr(32, [1944, 214], { seed: 11 }),
  arr(38, [1836, 204], { woman: true, seed: 12 }),
  arr(44, [1880, 236], { child: true, seed: 13 }),
  arr(50, [1726, 222], { seed: 14, face: -1 }),
  arr(56, [1548, 262], { woman: true, seed: 15, round: true }),
  arr(62, [1622, 284], { child: true, seed: 16, round: true }),
  arr(68, [1430, 196], { seed: 17, round: true }),
  arr(76, [1952, 136], { woman: true, seed: 18 }),
  arr(84, [1846, 128], { seed: 19 }),
  arr(92, [1736, 140], { woman: true, seed: 20, face: -1 }),
  // more of them on "such higher rates of energy": the back rows, nearer the door
  arr(196, [1960, 58], { seed: 21 }),
  arr(205, [1852, 50], { woman: true, seed: 22 }),
  arr(213, [1906, 84], { child: true, seed: 23 }),
  arr(222, [1742, 62], { seed: 24, face: -1 }),
  arr(231, [1972, -22], { woman: true, seed: 25 }),
  arr(240, [1862, -30], { seed: 26 }),
  arr(249, [1810, -4], { child: true, seed: 27 }),
  arr(258, [1756, -24], { woman: true, seed: 28, face: -1 }),
  arr(268, [1950, -100], { seed: 29 }),
  arr(278, [1846, -108], { woman: true, seed: 30 }),
];
/** the step out takes STEP_F frames; then the walk at CROWD_V along the rest of the path */
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
  // ease the last 30 world px
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
export { sstep, c01 };

/** the closed range loop as a polygon (the tip's path, then back east along the bank to S0) */
export const LOOP_POLY: P2[] = (() => {
  const out: P2[] = TIP_PATH.filter((_, i) => i % 3 === 0);
  const x0 = TIP_PATH[TIP_PATH.length - 1][0];
  for (let x = x0; x < S0[0]; x += 60) out.push([x, pathY(x)]);
  return out;
})();
export const WASH_F0 = TRAIL_F1;
export const WASH_F1 = TRAIL_F1 + 26;
