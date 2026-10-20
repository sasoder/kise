// ---------------------------------------------------------------------------
// disgustingLondonWorld: the world column, the camera and the timeline of
// DisgustingLondon (kyle-london, cut 2). Pure data + maths (no React), so a
// check script can read the camera path and the beat positions.
//
// THE WORLD (world px, y down; x 540 = the frame's centre line; one tall column):
//   St Paul's (cross top y 30, dome springline y 700, peristyle to y 965) behind
//   the distant roofs (y ~905 ->), the near row house (roof ridge 1200, 2nd floor,
//   1st floor with THE sash window 1700-2040, shop 2128-2450), the street below
//   (house foot y 2450; the kennel, the open central gutter, 2575-2635).
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";

export const FPS = 30000 / 1001;
export const DURATION = 115;

// ---- the cathedral --------------------------------------------------------
/** V2: the cathedral and the distant city are drawn in their own coordinates and set down by SKY_SHIFT, so the dome
 *  stands just behind the house roof (a shorter tilt) */
export const SKY_SHIFT = 300; // the distant roofs' strip (the cathedral is placed in the component)
export const DOME = { cx: 540, spring: 700, rx: 315, ry: 330 }; // dome top = 370 (drawing coordinates; + SKY_SHIFT in the world)
export const CROSS_TOP = 30;
/** LONDON's baseline (world): just under the peristyle, over the dark city roofs */
export const LONDON_Y = 1372;

// ---- the near house ---------------------------------------------------------
export const HOUSE = { x0: 235, x1: 845 };
export const FOOT = 2400; // where the house meets the street
export const ROOF = { ridge: 1474, eaves: 1604 }; // V2: no second floor; the roof sits on the first floor
export const FLOOR2 = { top: 1320, bottom: 1620 };
export const FLOOR1 = { top: 1620, bottom: 2120 };
export const FASCIA = { top: 2120, bottom: 2146 };
export const WIN = { x0: 330, x1: 630, y0: 1660, y1: 2070 };
export const SILL = { x0: 312, x1: 648, y0: 2070, y1: 2088 };
/** the house leans: x' = x + LEAN * (y - FOOT) (its top stands ~19 px right of its foot) */
export const LEAN = -0.015;
export const lean = (x: number, y: number) => x + LEAN * (y - FOOT);

// ---- the street -------------------------------------------------------------
/** the kennel: a broad open channel brimming with sludge, running along the street */
export const KENNEL = { y0: 2474, y1: 2590, surf: 2532 };
export const HEAP = { x0: 664, x1: 874, top: 2368, base: 2436, cx: 770 };

// ---- the timeline (frames from the composition start) ------------------------
export const T = {
  londonIn: 2, // LONDON slides up, fully up by f16 (the word "London" 18)
  sashUp: [42, 50] as const, // r3: begins on "century" (42) // the lower sash thrown up
  armOut: [46, 56] as const, // forearm + pot are lifted up into the open window from the dark room, then out
  tip: [54, 66] as const, // the pot tips 0 -> TIP_DEG
  pour: [62, 130] as const, // slop leaves the lip from f62 and is still pouring at the cut (a second slosh ~f100)
  contact: 79, // the first slop meets the kennel (the word "disgusting" 80)
};
export const TIP_DEG = 62; // r2: tipped less, so the pot stays wide and low (a chamber pot, not a jug)

// ---- the camera ---------------------------------------------------------------
/** the camera's target keys: the world point (cx, cy) at the frame centre at zoom k */
export type CamTarget = { f: number; cx: number; cy: number; k: number };
export const CAM_KEYS: CamTarget[] = [
  { f: 0, cx: 594, cy: 1906, k: 0.7 },
  { f: 20, cx: 592, cy: 1960, k: 0.72 },
  { f: 42, cx: 588, cy: 2100, k: 0.8 },
  { f: 62, cx: 586, cy: 2330, k: 0.96 },
  { f: 75, cx: 588, cy: 2470, k: 1.05 },
  { f: 114, cx: 590, cy: 2496, k: 1.08 },
];

/** monotone cubic through [x, y] keys, one-sided end slopes (a track never starts at rest) */
const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

export type Cam = { k: number; cx: number; cy: number };
/** the keys -> pchip (k in log space) -> the house damped follow (CAM_STIFF / CAM_DAMP of
 *  kits/dwarkesh/fieldShared), pre-rolled 60 frames so f0 is already in steady motion */
const CAM_PATH: Cam[] = (() => {
  const pk = pchip(CAM_KEYS.map((q) => [q.f, Math.log(q.k)]));
  const px = pchip(CAM_KEYS.map((q) => [q.f, q.cx]));
  const py = pchip(CAM_KEYS.map((q) => [q.f, q.cy]));
  const target = (f: number) => [px(f), py(f), pk(f)];
  const PRE = 60;
  // the follow trails its target by ~5 f: lead the target so the follow lands where the keys say
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = [0, 0, 0];
  const out: Cam[] = [];
  for (let f = -PRE + 1; f <= DURATION + 2; f++) {
    const t = target(f + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) out.push({ cx: s[0], cy: s[1], k: Math.exp(s[2]) });
  }
  return out;
})();
/** the camera at an integer frame (the house hand's sway is added in the component) */
export const camAt = (frame: number): Cam => CAM_PATH[Math.max(0, Math.min(CAM_PATH.length - 1, Math.round(frame)))];
export const toScreen = (cam: Cam, x: number, y: number): [number, number] => [540 + (x - cam.cx) * cam.k, 960 + (y - cam.cy) * cam.k];

// ---- the slop: one stream of particles, pure functions of the frame ------------------
/** gravity (world px / f^2), solved so the first slop leaves the lip on T.pour[0] and meets the kennel on T.contact */
export const SLOP_V0: [number, number] = [12, -7]; // thrown out and a little up, so the fall visibly accelerates
export const solveG = (lipY: number) => {
  const t = T.contact - T.pour[0];
  return (2 * (KENNEL.surf - lipY - SLOP_V0[1] * t)) / (t * t);
};

// ---- the forearm and the chamber pot ---------------------------------------------------
/** pot-local points (a squat chamber pot in profile, its mouth up, the loop handle on the left; origin = the handle's root) */
export const POT = {
  rimL: [24, -66] as [number, number],
  rimR: [196, -66] as [number, number],
  centre: [110, 0] as [number, number],
  grip: [4, -26] as [number, number],
};
/** the pot turns about this pot-local point (the wrist rolls, the handle rises over it) */
export const POT_PIVOT: [number, number] = [70, -10];
/** the pivot in the world once the arm is out (in front of the window's open lower half), and back in the dark room */
export const PIVOT_OUT: [number, number] = [520, 1990];
/** Cold: as it tips, the pot is also lowered out over the sill (shorter fall, bigger frame) */
export const TIP_DROP = 0;
export const PIVOT_IN: [number, number] = [492, 2156]; // the pot wholly below the window's bottom rail (lifted up from inside the room)
/** the elbow, relative to the grip (the forearm reaches out of the room toward us, down-left to up-right) */
export const ELBOW_OFF: [number, number] = [-150, 52];
const easeIO = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const lin = (f: number, a: number, b: number) => Math.max(0, Math.min(1, (f - a) / (b - a)));
/** 0 -> 1 as the arm comes out */
export const armOut = (f: number) => easeIO(lin(f, T.armOut[0], T.armOut[1]));
/** the tip angle (deg, clockwise) at frame f (fractional frames allowed): the tip with a little throw, then a shake at ~f84 */
export const tipAngle = (f: number) => {
  const u = lin(f, T.tip[0], T.tip[1]);
  const base = TIP_DEG * (u * u * (3 - 2 * u));
  // a second slosh: the wrist tips it further to get the rest out (f94-108), then eases back a little
  const shake = 14 * easeIO(lin(f, 94, 102)) - 6 * easeIO(lin(f, 104, 114));
  return base + shake;
};
export const rot = ([x, y]: [number, number], deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
};
export const pivotAt = (f: number): [number, number] => {
  const a = armOut(f);
  const drop = TIP_DROP * easeIO(lin(f, T.tip[0], T.tip[1]));
  return [PIVOT_IN[0] + (PIVOT_OUT[0] - PIVOT_IN[0]) * a, PIVOT_IN[1] + (PIVOT_OUT[1] - PIVOT_IN[1]) * a + drop];
};
/** a pot-local point in the world at frame f */
export const potPoint = (f: number, q: [number, number]): [number, number] => {
  const pv = pivotAt(f);
  const r = rot([q[0] - POT_PIVOT[0], q[1] - POT_PIVOT[1]], tipAngle(f));
  return [pv[0] + r[0], pv[1] + r[1]];
};
export const gripAt = (f: number) => potPoint(f, POT.grip);
/** the pour point: the lower of the rim's two ends, world */
export const lipAt = (f: number): [number, number] => {
  const a = potPoint(f, POT.rimL);
  const b = potPoint(f, POT.rimR);
  return a[1] > b[1] ? a : b;
};
