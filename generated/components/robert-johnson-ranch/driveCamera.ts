// ---------------------------------------------------------------------------
// driveCamera: the one perspective camera, the car's drive and the symbolic scale of DriveOutOfAustin
// (robert-johnson-ranch, cut 6). Pure data + maths (no React): the WebGL ground (driveGround.tsx) and every SVG
// overlay (driveProps.tsx) use exactly these functions, so the land, the roads, the car and the labels sit on one ground.
//
// THE WORLD (driveRouteData.ts, baked by assets-src/robert-johnson-ranch/bake_drive.py): metres, origin downtown
// Austin, X east, Y up (the VISUAL height: the relief exaggerated), Z SOUTH. A pinhole camera (focal F px, the frame's
// centre the principal point) aimed at a target T from a distance D, pitched down by `pitch`, turned to the compass
// azimuth `az` (0 = looking north, 270 = west). One keyed track (pchip, log D) through the house damped follow
// (CAM_STIFF / CAM_DAMP), pre-rolled so f0 is already moving. The target rides a heavily smoothed copy of the car's
// path (never the car itself), plus a keyed lead along the view.
//
// SYMBOLIC SCALE: the car, the road widths, the cattle guard and the farm are drawn at one symbolic scale that grows
// with the camera's distance (a toy car on a relief model: carLen(f) = CAR_G * (D / D_G)^0.85 m), so the car stays
// ~70-120 px long while the land under it widens from a city edge to 30 km of hills. The guard and the farm are
// frozen at the scale of their own moment.
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip } from "../kits/maps/incaShared";
import { DIRT, DIRT_LEN, HWY, LEG_M, PLACE } from "./driveRouteData";

export const FPS = 24000 / 1001;
export const DURATION = 322;
export const W = 1080;
export const H = 1920;
export const F = 1300;

export type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// THE SYMBOLIC SCALE
// ---------------------------------------------------------------------------
/** the camera distance at the cattle guard and the car's length there (m) */
export const D_G = 4300;
export const CAR_G = 480;
export const carLenAtD = (D: number) => CAR_G * Math.pow(D / D_G, 0.85);
/** road widths as a fraction of the car's length, by frame (close: real-ish; high: a ribbon) */
const RHO_H = pchip([
  [0, 0.5],
  [60, 0.4],
  [110, 0.45],
  [140, 0.6],
  [200, 0.6],
  [300, 0.32],
  [322, 0.32],
]);
const RHO_D = pchip([
  [0, 0.8],
  [140, 0.8],
  [205, 0.8],
  [270, 0.4],
  [322, 0.36],
]);
/** THE FARM at the road's end, at its own frozen symbolic scale (m per house-unit): a = along the road's last heading
 *  (beyond its end), b = to the road's left */
export const FARM_SCALE = 5400;
export const farmGeo = () => {
  const e = at(DIRT_PL, DIRT_LEN);
  const hd = headingAt(DIRT_PL, DIRT_LEN - 400, 400);
  const ea: V3 = [hd.dx, 0, hd.dz];
  const eb: V3 = [hd.dz, 0, -hd.dx];
  return { e, ea, eb };
};
export const farmPoint = (a: number, b: number) => {
  const { e, ea, eb } = farmGeo();
  return { x: e.x + ea[0] * a * FARM_SCALE + eb[0] * b * FARM_SCALE, z: e.z + ea[2] * a * FARM_SCALE + eb[2] * b * FARM_SCALE };
};
/** the camera's aim at the end: between the parked car and the house */
const FARM_AIM = 0.45;
/** the cattle guard: on the dirt road where it crosses the fence line beside the highway */
export const GUARD = (() => {
  const wH = 0.6 * CAR_G;
  const s = 0.5 * wH + 2.2 * CAR_G;
  return { s, span: 1.1 * CAR_G, depth: 0.36 * CAR_G, fenceOff: s, post: 0.07 * CAR_G };
})();

// ---------------------------------------------------------------------------
// POLYLINES
// ---------------------------------------------------------------------------
type PL = { x: number[]; z: number[]; h: number[]; s: number[] };
const plOf = (rows: readonly (readonly number[])[]): PL => ({ x: rows.map((r) => r[0]), z: rows.map((r) => r[1]), h: rows.map((r) => r[2]), s: rows.map((r) => r[3]) });
export const HWY_PL = plOf(HWY);
export const DIRT_PL = plOf(DIRT);
const seek = (a: number[], v: number) => {
  let lo = 0;
  let hi = a.length - 1;
  if (v <= a[0]) return 0;
  if (v >= a[hi]) return hi - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (a[m] <= v) lo = m;
    else hi = m;
  }
  return lo;
};
/** a point on a polyline at arc s: [x, z, h] and the unit heading (dx, dz) */
export const at = (p: PL, s: number) => {
  const i = seek(p.s, s);
  const t = clamp01((s - p.s[i]) / Math.max(1e-6, p.s[i + 1] - p.s[i]));
  const dx = p.x[i + 1] - p.x[i];
  const dz = p.z[i + 1] - p.z[i];
  const l = Math.hypot(dx, dz) || 1;
  return { x: lerp(p.x[i], p.x[i + 1], t), z: lerp(p.z[i], p.z[i + 1], t), h: lerp(p.h[i], p.h[i + 1], t), dx: dx / l, dz: dz / l };
};
/** a smoother heading (averaged over +-w metres) */
export const headingAt = (p: PL, s: number, w: number) => {
  const a = at(p, s - w);
  const b = at(p, s + w);
  const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  return { dx: (b.x - a.x) / l, dz: (b.z - a.z) / l };
};

// ---------------------------------------------------------------------------
// THE CAR'S PATH: the highway to the turn, a fillet through the junction, the dirt road to the farm
// ---------------------------------------------------------------------------
const TURN_IN = 1.4 * CAR_G;
const TURN_OUT = 0.5 * 0.6 * CAR_G + 0.9 * CAR_G;
let FILLET_END = 0;
export const CAR_PL: PL = (() => {
  const rows: number[][] = [];
  for (let i = 0; i < HWY_PL.s.length && HWY_PL.s[i] < LEG_M - TURN_IN; i++) rows.push([HWY_PL.x[i], HWY_PL.z[i], HWY_PL.h[i]]);
  const A = at(HWY_PL, LEG_M - TURN_IN);
  const J = at(HWY_PL, LEG_M);
  const B = at(DIRT_PL, TURN_OUT);
  for (let k = 0; k <= 24; k++) {
    const t = k / 24;
    const m = (a: number, j: number, b: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * j + t * t * b;
    rows.push([m(A.x, J.x, B.x), m(A.z, J.z, B.z), m(A.h, J.h, B.h)]);
  }
  FILLET_END = rows.length - 1;
  for (let i = 0; i < DIRT_PL.s.length; i++) if (DIRT_PL.s[i] > TURN_OUT + 1) rows.push([DIRT_PL.x[i], DIRT_PL.z[i], DIRT_PL.h[i]]);
  let s = 0;
  return {
    x: rows.map((r) => r[0]),
    z: rows.map((r) => r[1]),
    h: rows.map((r) => r[2]),
    s: rows.map((r, i) => (s += i === 0 ? 0 : Math.hypot(r[0] - rows[i - 1][0], r[1] - rows[i - 1][1]))),
  };
})();
/** car-path arc of the turn's start and of a dirt-road arc */
export const U_TURN = LEG_M - TURN_IN;
const FILLET_LEN = CAR_PL.s[FILLET_END] - U_TURN;
export const uOfDirt = (sd: number) => U_TURN + FILLET_LEN + (sd - TURN_OUT);
export const dirtOfU = (u: number) => u - U_TURN - FILLET_LEN + TURN_OUT;
export const U_END = uOfDirt(DIRT_LEN);
/** the bend (the second left turn) on the dirt road: 2.9 km from the highway's centre line */
export const DIRT_BEND = 2900;

// ---------------------------------------------------------------------------
// THE DRIVE: the car's arc u(f), in phases, each scaled to land on its word
//   f0..150  out of Austin along US 290: rolling, a constant cruise f30-100, slowing to the turn (U_TURN at f150)
//   f150..213 the turn through the cattle guard (front wheels on the pipes ~f160) and down the track to the bend
//   f213..304 the left bend, then 22 road-miles through the hills, stopping at the farm on FARM (f300-305)
// ---------------------------------------------------------------------------
export const U0 = 2400;
const integ = (f0: number, f1: number, v: (f: number) => number) => {
  let a = 0;
  for (let f = f0; f < f1; f += 0.25) a += 0.25 * v(f + 0.125);
  return a;
};
const shapeA = (f: number) => (f < 34 ? lerp(0.42, 1, sstep(0, 34, f)) : f < 100 ? 1 : lerp(1, 0.13, sstep(100, 150, f)));
const shapeB = (f: number) => lerp(0.13, 0.2, sstep(150, 213, f)) * (1 - 0.35 * Math.exp(-Math.pow((f - 166) / 7, 2)));
const shapeC = (f: number) => (f < 304 ? Math.max(0, Math.sin(Math.PI * Math.pow(clamp01((f - 213) / 91), 0.8)) * 1.6 + lerp(0.2, 0, sstep(213, 250, f)) * 1) : 0);
const KA = (U_TURN - U0) / integ(0, 150, shapeA);
const U_BEND = uOfDirt(DIRT_BEND);
const KB = (U_BEND - U_TURN) / integ(150, 213, shapeB);
const KC = (U_END - U_BEND) / integ(213, 304, shapeC);
/** the car's speed (m / frame) */
export const speedAt = (f: number) => (f < 150 ? KA * shapeA(f) : f < 213 ? KB * shapeB(f) : f < 304 ? KC * shapeC(f) : 0);
const U_TABLE = (() => {
  const out: number[] = [];
  let u = U0;
  const pre = KA * shapeA(0);
  for (let f = -80; f < 0; f++) out.push(U0 + pre * f);
  for (let f = 0; f <= DURATION + 4; f++) {
    out.push(u);
    u += integ(f, f + 1, speedAt);
  }
  return out;
})();
/** the car's arc along CAR_PL at frame f (fractional ok) */
export const carU = (f: number) => {
  const g = Math.max(-80, Math.min(DURATION + 4, f)) + 80;
  const i = Math.min(U_TABLE.length - 2, Math.floor(g));
  return Math.min(U_END, lerp(U_TABLE[i], U_TABLE[i + 1], g - i));
};

// ---------------------------------------------------------------------------
// THE ROAD REVEALS (the tips that draw the roads ahead of the car)
// ---------------------------------------------------------------------------
/** the highway tip (arc from downtown): a few car lengths ahead, racing to the 22-mile point by f52; it waits
 *  there until the car has turned off, then runs on west into the haze */
export const hwyTip = (f: number) => {
  const car = Math.min(carU(f), LEG_M);
  const lead = car + 3.2 * carLenAtD(camDAt(Math.max(0, f)));
  // the highway goes on past the turn (a side road on the left, not the highway's end)
  const hold = LEG_M + 2.6 * CAR_G;
  const race = lerp(lead, hold, sstep(18, 52, f));
  const on = 9000 * sstep(178, 322, f) + 7000 * sstep(178, 250, f);
  return f < 52 ? race : hold + on;
};
/** the dirt-road tip (dirt arc): the track is there (to just past the bend); from f216 the tip races on through the
 *  hills and reaches the farm by f262 ("22 miles") */
export const dirtTip = (f: number) => {
  // a stub through the guard; "there's a dirt road there" (f176-196) draws the track to the bend; then the 22 miles
  const stub = GUARD.s + 0.35 * CAR_G;
  const track = DIRT_BEND + 0.9 * CAR_G;
  const drawn = f < 216 ? lerp(stub, track, sstep(172, 198, f)) : lerp(track, DIRT_LEN, sstep(216, 262, f));
  // never behind the car's bonnet
  const front = dirtOfU(carU(f)) + 0.5 * carLen(f) + 0.6 * CAR_G;
  return Math.min(DIRT_LEN, Math.max(drawn, front));
};
export const roadWidths = (f: number, D: number) => {
  // the roads widen with the car where it is drawn larger than its symbolic size, so it still sits on them
  const L = carLenAtD(D) * Math.pow(Math.max(1, carSize(f)), 0.7);
  return { hwy: RHO_H(f) * L, dirt: RHO_D(f) * L };
};

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** f, distance D (m), pitch (deg), azimuth (deg), lead along the view (x D), rise of the target (m) */
type Key = { f: number; D: number; pitch: number; az: number; lead: number };
export const KEYS: Key[] = [
  { f: 0, D: 5000, pitch: 42, az: 268, lead: 0.0 },
  { f: 30, D: 7200, pitch: 34, az: 267, lead: 0.0 },
  { f: 62, D: 10800, pitch: 28, az: 265.5, lead: -0.02 },
  { f: 98, D: 15500, pitch: 25, az: 262.5, lead: -0.06 },
  { f: 136, D: 1700, pitch: 34, az: 240, lead: -0.45 },
  { f: 168, D: 3300, pitch: 36, az: 230, lead: -0.13 },
  { f: 208, D: 7000, pitch: 37.5, az: 213, lead: -0.12 },
  { f: 232, D: 12500, pitch: 39, az: 204, lead: -0.1 },
  { f: 255, D: 21000, pitch: 41, az: 202, lead: -0.07 },
  { f: 300, D: 50000, pitch: 44, az: 201, lead: -0.05 },
  { f: 322, D: 52000, pitch: 44.3, az: 200.6, lead: -0.05 },
];
/** the opening: the camera hangs over the city's edge while the car drives off, then follows (f0-46) */
const OPEN = { x: 200, z: 0 };
const FOLLOW = (f: number) => sstep(22, 86, f);
/** the camera's goal for the farm: from f244 the target eases from the car onto the farm */
const FARM_W = (f: number) => sstep(258, 304, f);
/** after the second turn the frame slides so the car sits right of centre and the guard leaves by the right edge */
const SIDE = pchip([
  [0, 0],
  [184, 0],
  [210, 0.18],
  [228, 0.17],
  [252, -0.12],
  [282, 0],
  [322, 0],
]);
/** around "cattle guard" the target leans toward the guard (f105-185) */
const GUARD_W = (f: number) => 0.55 * sstep(105, 130, f) * (1 - sstep(160, 190, f));

const KEY_CH = [
  pchip(KEYS.map((k) => [k.f, Math.log(k.D)] as [number, number])),
  pchip(KEYS.map((k) => [k.f, k.pitch] as [number, number])),
  pchip(KEYS.map((k) => [k.f, k.az] as [number, number])),
  pchip(KEYS.map((k) => [k.f, k.lead] as [number, number])),
];
/** a heavily smoothed copy of the car's position (gaussian over +-sigma frames), the target's anchor */
const carPosRaw = (f: number) => at(CAR_PL, carU(f));
const SM = 9;
const carSmooth = (f: number) => {
  let x = 0;
  let z = 0;
  let h = 0;
  let w = 0;
  for (let k = -3 * SM; k <= 3 * SM; k++) {
    const g = Math.exp(-0.5 * (k / SM) ** 2);
    const p = carPosRaw(f + k);
    x += g * p.x;
    z += g * p.z;
    h += g * p.h;
    w += g;
  }
  return { x: x / w, z: z / w, h: h / w };
};

export type Cam = { C: V3; f: V3; r: V3; u: V3; D: number; pitch: number; az: number; T: V3 };
export const camFrom = (tx: number, ty: number, tz: number, D: number, pitchDeg: number, azDeg: number): Cam => {
  const yaw = (azDeg * Math.PI) / 180;
  const p = (pitchDeg * Math.PI) / 180;
  const f: V3 = [Math.sin(yaw) * Math.cos(p), -Math.sin(p), -Math.cos(yaw) * Math.cos(p)];
  const r: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  const u = cross(r, f);
  const C: V3 = [tx - D * f[0], ty - D * f[1], tz - D * f[2]];
  return { C, f, r, u, D, pitch: pitchDeg, az: azDeg, T: [tx, ty, tz] };
};
const goal = (fr: number) => {
  const logD = KEY_CH[0](fr);
  const pitch = KEY_CH[1](fr);
  const az = KEY_CH[2](fr);
  const lead = KEY_CH[3](fr) * Math.exp(logD);
  const c0 = carSmooth(fr);
  const a = { x: OPEN.x, z: OPEN.z, h: PLACE.austin[2] };
  const wf = FOLLOW(fr);
  const c1 = { x: lerp(a.x, c0.x, wf), z: lerp(a.z, c0.z, wf), h: lerp(a.h, c0.h, wf) };
  const gp = at(DIRT_PL, GUARD.s);
  const gw = GUARD_W(fr);
  const c = { x: lerp(c1.x, gp.x, gw), z: lerp(c1.z, gp.z, gw), h: lerp(c1.h, gp.h, gw) };
  const w = FARM_W(fr);
  const ft = farmPoint(FARM_AIM, 0);
  const fx = ft.x;
  const fz = ft.z;
  const fh = PLACE.farm[2];
  const yaw = (az * Math.PI) / 180;
  const side = -SIDE(fr) * Math.exp(logD);
  const tx = lerp(c.x, fx, w) + Math.sin(yaw) * lead + Math.cos(yaw) * side;
  const tz = lerp(c.z, fz, w) - Math.cos(yaw) * lead + Math.sin(yaw) * side;
  const ty = lerp(c.h, fh, w);
  return [tx, ty, tz, logD, pitch, az];
};
const PATH: Cam[] = (() => {
  const PRE = 60;
  const LEAD = 5;
  let s = goal(-PRE + LEAD);
  let v = s.map(() => 0);
  const out: Cam[] = [];
  for (let fr = -PRE + 1; fr <= DURATION + 2; fr++) {
    const t = goal(Math.min(fr + LEAD, DURATION + 2));
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (fr >= 0) out.push(camFrom(s[0], s[1], s[2], Math.exp(s[3]), s[4], s[5]));
  }
  return out;
})();
export const camAt = (frame: number): Cam => {
  const i = Math.max(0, Math.min(PATH.length - 2, Math.floor(frame)));
  const t = clamp01(frame - i);
  if (t === 0) return PATH[i];
  const a = PATH[i];
  const b = PATH[i + 1];
  return camFrom(lerp(a.T[0], b.T[0], t), lerp(a.T[1], b.T[1], t), lerp(a.T[2], b.T[2], t), Math.exp(lerp(Math.log(a.D), Math.log(b.D), t)), lerp(a.pitch, b.pitch, t), lerp(a.az, b.az, t));
};
/** the camera distance at frame f (for the symbolic scale) */
export function camDAt(f: number) {
  return camAt(f).D;
}
/** the car's length (m) at frame f: by its own distance from the camera, so it keeps its size on screen while the
 *  camera hangs back over the city in the opening */
const carLenBase = (f: number) => {
  const cam = camAt(f);
  const p = at(CAR_PL, carU(f));
  const d = Math.hypot(p.x - cam.C[0], p.h - cam.C[1], p.z - cam.C[2]);
  return carLenAtD(Math.max(0.6 * cam.D, d));
};
/** the car body's on-screen size (px, the larger side of its screen box, full-res) at frame f for a length L */
export const carBodyPx = (f: number, L: number) => {
  const cam = camAt(f);
  const u = carU(f);
  const p = at(CAR_PL, u);
  const hd = headingAt(CAR_PL, u, L * 0.4);
  const xs: number[] = [];
  const ys: number[] = [];
  const pts: [number, number, number][] = [];
  for (const a of [-0.5, 0.5]) for (const b of [-0.2, 0.2]) for (const c of [0, 0.2]) pts.push([a, b, c]);
  for (const a of [-0.25, 0.16]) for (const b of [-0.185, 0.185]) pts.push([a, b, 0.335]);
  for (const [a, b, c] of pts) {
    const s = toScreen(cam, p.x + hd.dx * a * L - hd.dz * b * L, p.h + c * L, p.z + hd.dz * a * L + hd.dx * b * L);
    xs.push(s.x);
    ys.push(s.y);
  }
  return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
};
/** the car's size factor: the symbolic scale alone leaves it ~60-80 px while the camera hangs back (f0-110) and
 *  ~45 px at the farm; this lifts it to >= ~120 px (full-res) wherever the camera follows (f0-232, never below the
 *  symbolic size), then eases it to ~74 px as it pulls up beside the house (f236-300). Gaussian-smoothed over
 *  frames, so the size never pops; it scales about the car's ground contact (the Car is built up from p). */
let CAR_SZ_: number[] | null = null;
const carSzTable = (): number[] => {
  if (CAR_SZ_) return CAR_SZ_;
  const raw: number[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const L = carLenBase(f);
    const T = 134 + (74 - 134) * sstep(238, 300, f);
    const m = T / carBodyPx(f, L);
    raw.push(f < 240 ? Math.max(1, m) : m);
  }
  const sg = 6;
  CAR_SZ_ = raw.map((_, i) => {
    let a = 0;
    let wsum = 0;
    for (let k = -3 * sg; k <= 3 * sg; k++) {
      const j = Math.max(0, Math.min(raw.length - 1, i + k));
      const w = Math.exp(-(k * k) / (2 * sg * sg));
      a += w * raw[j];
      wsum += w;
    }
    return a / wsum;
  });
  return CAR_SZ_;
};
export const carSize = (f: number) => {
  const T = carSzTable();
  const x = Math.max(0, Math.min(T.length - 1.001, f));
  const i = Math.floor(x);
  return T[i] + (T[i + 1] - T[i]) * (x - i);
};
export const carLen = (f: number) => carLenBase(f) * carSize(f);

export type Scr = { x: number; y: number; z: number; s: number };
/** world (X, Y up, Z south) -> screen; z = depth along the view axis, s = px per metre there */
export const toScreen = (cam: Cam, X: number, Y: number, Z: number): Scr => {
  const d: V3 = [X - cam.C[0], Y - cam.C[1], Z - cam.C[2]];
  const z = dot(d, cam.f);
  const zz = Math.max(z, 1e-3);
  return { x: W / 2 + (F * dot(d, cam.r)) / zz, y: H / 2 - (F * dot(d, cam.u)) / zz, z, s: F / zz };
};
export const horizonY = (cam: Cam) => H / 2 - F * Math.tan((cam.pitch * Math.PI) / 180);

/** the camera's travel in its own frame (m), integrated, for the motes and shafts' parallax */
export const TRAVEL: V3[] = (() => {
  const out: V3[] = [[0, 0, 0]];
  for (let i = 1; i < PATH.length; i++) {
    const a = PATH[i - 1];
    const b = PATH[i];
    const d: V3 = [b.C[0] - a.C[0], b.C[1] - a.C[1], b.C[2] - a.C[2]];
    const fh: V3 = [Math.sin((b.az * Math.PI) / 180), 0, -Math.cos((b.az * Math.PI) / 180)];
    const p = out[i - 1];
    const turn = ((b.az - a.az) * Math.PI) / 180;
    out.push([p[0] + dot(d, b.r) + turn * 2.5 * b.D, p[1] + d[1], p[2] + dot(d, fh)]);
  }
  return out;
})();
