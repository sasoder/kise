// ---------------------------------------------------------------------------
// disgustingLondonWorldV5: the world column, the camera, the timeline and (V5, the depth pass) the one perspective
// camera of DisgustingLondonV5 (kyle-london, cut 2). A copy of disgustingLondonWorldV2.ts with the DEPTH section added
// at the end; everything above it is V2's, unchanged. Pure data + maths (no React).
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
export const SKY_SHIFT = 360;
export const DOME = { cx: 540, spring: 700, rx: 315, ry: 330 }; // dome top = 370 (drawing coordinates; + SKY_SHIFT in the world)
export const CROSS_TOP = 30;
/** LONDON's baseline (world): just under the peristyle, over the dark city roofs */
export const LONDON_Y = 1388;

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
  londonIn: 4, // LONDON slides up, lands f18 (the word "London" 18)
  sashUp: [45, 51] as const, // the lower sash thrown up
  armOut: [46, 56] as const, // forearm + pot are lifted up into the open window from the dark room, then out
  tip: [54, 66] as const, // the pot tips 0 -> TIP_DEG
  pour: [62, 86] as const, // slop leaves the lip (one connected pour until after contact; it thins and tears off f81-86)
  contact: 79, // the first slop meets the kennel (the word "disgusting" 80)
};
export const TIP_DEG = 102;

// ---- the camera ---------------------------------------------------------------
/** the camera's target keys: the world point (cx, cy) at the frame centre at zoom k */
export type CamTarget = { f: number; cx: number; cy: number; k: number };
export const CAM_KEYS: CamTarget[] = [
  { f: 0, cx: 540, cy: 1290, k: 0.84 },
  { f: 20, cx: 540, cy: 1480, k: 0.86 },
  { f: 45, cx: 552, cy: 1930, k: 0.93 },
  { f: 62, cx: 572, cy: 2250, k: 1.08 },
  { f: 78, cx: 590, cy: 2482, k: 1.3 },
  { f: 94, cx: 594, cy: 2518, k: 1.38 },
  { f: 114, cx: 598, cy: 2526, k: 1.42 },
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
export const SLOP_V0: [number, number] = [12, -3.2]; // thrown out over the street
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
  const shake = f > 82 && f < 96 ? 6 * Math.sin(((f - 82) / 14) * Math.PI * 2) * Math.sin(((f - 82) / 14) * Math.PI) : 0;
  return base + shake;
};
export const rot = ([x, y]: [number, number], deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
};
export const pivotAt = (f: number): [number, number] => {
  const a = armOut(f);
  return [PIVOT_IN[0] + (PIVOT_OUT[0] - PIVOT_IN[0]) * a, PIVOT_IN[1] + (PIVOT_OUT[1] - PIVOT_IN[1]) * a];
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

// =====================================================================================================================
// V5 DEPTH: ONE PINHOLE CAMERA (one-point perspective, DEPTH.md rules 1, 5, 6)
// V2's 2D camera (cx, cy, k) is read as a pinhole looking straight at the house front (the plane z = 0; z grows away
// from us) from a distance D = FOCAL / k, so V2's push-in is a real dolly. A 3D point (x, y, z) is drawn at its
// facade-equivalent point (where the ray from the eye meets z = 0), then through V2's unchanged camera transform: the
// house front renders exactly as in V2, and everything nearer or farther gets its perspective and its parallax from
// the same eye. The eye: Xe = cam.cx (the VP on the frame's centre line), Ye = the eye height, a pedestal that comes
// down with the tilt (EYE_Y[0] at f0 -> EYE_Y[1] at f114, linear in cam.cy), always above the street (FOOT 2400).
// Horizon on screen: y 1299 (f0), 963 (f45), 527 (f79), 453 (f114). Lens shift, no pitch: verticals stay vertical.
// =====================================================================================================================
export const FOCAL = 1100;
export const EYE_Y: [number, number] = [1700, 2170];
const CY0 = CAM_PATH[0].cy;
const CY1 = CAM_PATH[DURATION - 1].cy;
export type Eye = { X: number; Y: number; D: number };
export const eyeOf = (cam: Cam): Eye => ({ X: cam.cx, Y: EYE_Y[0] + ((cam.cy - CY0) * (EYE_Y[1] - EYE_Y[0])) / (CY1 - CY0), D: FOCAL / cam.k });
/** the facade-equivalent scale of depth z (1 on the house front, > 1 nearer, < 1 farther) */
export const depthScale = (e: Eye, z: number) => e.D / (e.D + z);
export type P3 = [number, number, number];
/** a 3D point -> its facade-equivalent (world) point */
export const proj = (e: Eye, x: number, y: number, z: number): [number, number] => {
  const s = e.D / (e.D + z);
  return [e.X + (x - e.X) * s, e.Y + (y - e.Y) * s];
};
/** the SVG transform that draws a flat drawing (its own coords = 3D x, y) standing at depth z */
export const planeAt = (e: Eye, z: number) => {
  const s = depthScale(e, z);
  return `matrix(${s} 0 0 ${s} ${e.X * (1 - s)} ${e.Y * (1 - s)})`;
};
/** a far layer drawn as it looked from the reference eye r, carried to the eye e (it stands at depth z) */
export const layerFrom = (e: Eye, r: Eye, z: number) => {
  const q = depthScale(e, z) / depthScale(r, z);
  return `matrix(${q} 0 0 ${q} ${e.X - r.X * q} ${e.Y - r.Y * q})`;
};
export const layerPoint = (e: Eye, r: Eye, z: number, x: number, y: number): [number, number] => {
  const q = depthScale(e, z) / depthScale(r, z);
  return [e.X + (x - r.X) * q, e.Y + (y - r.Y) * q];
};
/** the eye at a frame without the hand's sway (the reference for the far layers) */
export const eyeAtFrame = (f: number) => eyeOf(camAt(f));

/** the depths (world px; ~100 px = 1 m) */
export const Z = {
  dome: 9000, // St Paul's: effectively at infinity (it rides the horizon)
  city: 1500, // the distant roofs and LONDON
  ridge: 300,
  eaves: -40,
  head: -22, // the window's head
  sill: -28,
  sash: 46, // the window's sashes and the room: a thick wall
  fascia: -24,
  shopPanes: 24,
  door: 44,
  step: -30,
  neighL: -30,
  neighR: -50,
  pot: -60, // the pot and forearm, held out in front of the window
};
/** the kennel: a channel across the street (far inner wall, the sludge surface, the near lip) */
export const KENNEL3 = { zFar: -186, zNear: -344, depth: 22, hitZ: -252 };
export const SURF_Y = FOOT + KENNEL3.depth;
/** the refuse heap: a low mound against the wall */
export const HEAP3 = { cx: 770, rx: 104, z0: 0, z1: -88, h: 62 };

/** ONE LIGHT, upper left and a little in front (direction of travel: right, down, into the scene) */
export const LIGHT: P3 = [0.5, 1, 0.8];
/** the shadow on the house front (z = 0) of a point at depth z < 0: its offset */
export const wallShadowOffset = (z: number): [number, number] => [(LIGHT[0] * -z) / LIGHT[2], (LIGHT[1] * -z) / LIGHT[2]];
/** where the shadow of a 3D point falls: on the street (y = FOOT) or, if the ray meets the house first, on its front */
export const shadowOf = (x: number, y: number, z: number, groundY = FOOT): P3 => {
  const tg = (groundY - y) / LIGHT[1];
  const zg = z + LIGHT[2] * tg;
  if (zg <= 0) return [x + LIGHT[0] * tg, groundY, zg];
  const tw = -z / LIGHT[2];
  return [x + LIGHT[0] * tw, y + LIGHT[1] * tw, 0];
};

/** ATMOSPHERIC DEPTH (one function for the cut): 1 on the house front and nearer, toward ~0.55 at infinity */
export const depthTint = (z: number) => (z <= 0 ? 1 : 1 - 0.45 * (1 - Math.exp(-z / 2000)));
