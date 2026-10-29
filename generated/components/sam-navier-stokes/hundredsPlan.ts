// ---------------------------------------------------------------------------
// hundredsPlan — the camera and the vortex field of HundredsOfMillionsOfMath (sam-navier-stokes, cut 19).
// Pure data + maths (no React): the cut imports it, and so can a planning script.
//
// CAMERA: cut 10's own track continued (its creep, so f0 joins pixel for pixel and keeps its velocity) PLUS one
// damped glide (aircraftShared airTrack, from rest) that trucks right, rises, turns right and tips down from looking
// up at the big vortex to looking out over the deck. The big one leaves frame left; the field enters from the right.
//
// FIELD: a jittered grid of smaller vortices standing out of the deck, placed only OUTSIDE cut 10's last view (none of
// them exists in f0), so every one enters whole from the right frame edge as the camera turns, or out of the haze far
// off. Each one's amber fill climbs to its low level from the frame it comes into shot (derived from its projection).
// ---------------------------------------------------------------------------
import { random } from "remotion";
import { airCamAt, airProject, airTrack, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { CUT10_END, NS_VORTEX, cut10Cam, deckTopAt, vortexAxis, vortexReach } from "./vortexSky";

export const DUR19 = 110;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (v: number) => {
  const t = c01(v);
  return t * t * (3 - 2 * t);
};

// ----- the camera ---------------------------------------------------------------------------------------------------
/** cut 10's track, sampled past its end: valid to cut-10 f140, then extrapolated at its last velocity */
const LAST = 140;
const baseCam = (f: number): SideCam => {
  const g = CUT10_END.f + f;
  if (g <= LAST) return cut10Cam(g);
  const a = cut10Cam(LAST - 1);
  const b = cut10Cam(LAST);
  const k = g - LAST;
  return { ...b, x: b.x + (b.x - a.x) * k, y: b.y + (b.y - a.y) * k, z: b.z + (b.z - a.z) * k, pitch: (b.pitch ?? 0) + ((b.pitch ?? 0) - (a.pitch ?? 0)) * k };
};
/** the move, as offsets from the continued cut-10 camera (airTrack: starts at rest, damped follow) */
export const MOVE = { x: 3000, y: 2600, z: -5600, yaw: 31, pitch: 22.8, horizon: 160 };
const DELTA = airTrack(
  { mode: "side", x: 0, y: 0, z: 0, f: 1, horizon: 0, yaw: 0, pitch: 0 } as SideCam,
  [
    // the truck and the turn: from f0 (continuing the creep) through "way less", "average one", into the field
    { f0: 0, f1: 70, to: { z: MOVE.z }, warp: 0.7 },
    { f0: 0, f1: 94, to: { x: MOVE.x } },
    { f0: 0, f1: 98, to: { yaw: MOVE.yaw }, warp: 0.9 },
    // the rise and the tip down over the deck: lands the field on "hundreds of millions" .. "math"
    { f0: 0, f1: 98, to: { y: MOVE.y, pitch: MOVE.pitch, horizon: MOVE.horizon } },
    // then a slow living creep (forward over the field)
    { f0: 92, f1: 150, to: { z: MOVE.z + 260, x: MOVE.x + 140 } },
  ],
  DUR19 + 4,
);
export const cam19 = (f: number): SideCam => {
  const b = baseCam(f);
  const d = airCamAt(DELTA, f) as SideCam;
  return { mode: "side", x: b.x + d.x, y: b.y + d.y, z: b.z + d.z, f: b.f, horizon: (b.horizon ?? 800) + (d.horizon ?? 0), yaw: (b.yaw ?? 0) + (d.yaw ?? 0), pitch: (b.pitch ?? 0) + (d.pitch ?? 0) };
};

// ----- the field ----------------------------------------------------------------------------------------------------
export type FieldVortex = {
  at: V3;
  height: number;
  seed: number;
  /** spin phase offset (deg) on top of the seed's own */
  phase: number;
  /** its low amber level (fraction of its height) */
  fill: number;
  /** the frame it first comes into shot (fill climbs from here) */
  enter: number;
  /** tube thickness factor (far ones fatter, so tubes stay > ~1.5 px) */
  tube: number;
  /** distance from the end camera (m) */
  dist: number;
  detail: "hi" | "lo" | "field";
  /** the deck's heads hide its foot (ray-marched per fragment: only the nearer ones, the cost is per pixel) */
  occlude: boolean;
};
/** nearer than this (m from the end camera) a field vortex's foot is hidden by the deck's heads; farther, its foot
 *  sits just under the deck surface instead (too few pixels to see the difference, and the march is the cost) */
const OCCLUDE_NEAR = 11000;
/** the small vortices' shape: vortexSky's squat field eddy */
export const DETAIL = "field" as const;
const GRID = 2100;
const NEAR = 5000;
const SEEDS = 36;
const H_MIN = 0.27 * NS_VORTEX.height;
const H_MAX = 0.42 * NS_VORTEX.height;
/** a vortex's screen extent at a camera: its axis at five heights, +- its reach */
const extent = (cam: SideCam, v: { at: V3; height: number; seed: number }) => {
  let x0 = 1e9;
  let x1 = -1e9;
  let y0 = 1e9;
  let y1 = -1e9;
  let ok = true;
  for (const h of [0.08, 0.3, 0.5, 0.7, 0.95]) {
    const a = vortexAxis(v, h);
    const r = vortexReach(v, h, DETAIL) * 1.05 + 40;
    const p = airProject(cam, a);
    if (p.d < 50) ok = false;
    x0 = Math.min(x0, p.x - r * p.s);
    x1 = Math.max(x1, p.x + r * p.s);
    y0 = Math.min(y0, p.y);
    y1 = Math.max(y1, p.y);
  }
  return { x0, x1, y0, y1, ok };
};
const inFrame = (e: ReturnType<typeof extent>, m = 0) => e.ok && e.x1 > -m && e.x0 < 1080 + m && e.y1 > -m && e.y0 < 1920 + m;

/** THE REVEAL ROW (hand-placed, relative to the big one's foot): the first smaller vortices, just right of cut 10's
 *  last view, a diagonal running back to the right so 4-6 read at once on "average one" (f38); each its own seed. */
export const ROW: { x: number; d: number; h: number; seed: number }[] = [
  // placed by where they stand on "average one" (f38): x = the core's screen x there (px), d = distance along the
  // view on the ground (m); each is checked to be wholly off cut 10's last frame (f0)
  { x: 625, d: 8500, h: 0.46, seed: 2 },
  { x: 945, d: 12500, h: 0.44, seed: 3 },
  { x: 1045, d: 17000, h: 0.42, seed: 4 },
  { x: 790, d: 21000, h: 0.42, seed: 5 },
  { x: 880, d: 26000, h: 0.4, seed: 6 },
  { x: 770, d: 30000, h: 0.4, seed: 7 },
];
export const ROW_F = 38;
/** THE END'S NEAR ONES: placed by where they stand in the settled end frame (f104): x = the axis' screen x, foot = the
 *  foot's screen y (fully in frame, the amber visible above the bottom edge); ~30-35 % of the frame height there */
export const HERO: { x: number; foot: number; h: number; seed: number }[] = [
  { x: 290, foot: 1700, h: 0.58, seed: 40 },
  { x: 790, foot: 1730, h: 0.52, seed: 41 },
];
export const HERO_F = 104;
const buildField = (): FieldVortex[] => {
  const cams = Array.from({ length: DUR19 }, (_, f) => cam19(f));
  const c0 = cams[0];
  const cEnd = cams[DUR19 - 1];
  const out: FieldVortex[] = [];
  let n = 0;
  const S0 = CUT10_END.S;
  const footAt = (X: number, Z: number) => {
    let top = 1e9;
    for (const S of [S0, S0 + 36, S0 + 73, S0 + 110]) top = Math.min(top, deckTopAt([X, Z], S));
    return top;
  };
  // in shot = the body (its axis, low down where the amber is) inside the frame, not just a fine outer tip
  const enterOf = (v: { at: V3; height: number; seed: number }) => {
    for (let f = 0; f < DUR19; f++) {
      const p = airProject(cams[f], vortexAxis(v, 0.2));
      if (p.d > 50 && p.x > 0 && p.x < 1040 && p.y > 0 && p.y < 1920) return f;
    }
    return -1;
  };
  const cR = cams[ROW_F];
  const yw = (cR.yaw ?? 0) * (Math.PI / 180);
  const rowXZ = ROW.map((r) => {
    const right = ((r.x - 540) * r.d) / cR.f;
    return [cR.x + r.d * Math.sin(yw) + right * Math.cos(yw), cR.z + r.d * Math.cos(yw) - right * Math.sin(yw)];
  });
  const cH = cams[HERO_F];
  const ywH = (cH.yaw ?? 0) * (Math.PI / 180);
  const deckMin = (X: number, Z: number) => Math.min(...[0, 36, 73, 110].map((k) => deckTopAt([X, Z], S0 + k)));
  const heroV = HERO.map((r) => {
    for (let d = 2500; d < 20000; d += 25) {
      const right = ((r.x - 540) * d) / cH.f;
      const X = cH.x + d * Math.sin(ywH) + right * Math.cos(ywH);
      const Z = cH.z + d * Math.cos(ywH) - right * Math.sin(ywH);
      const v = { at: [X, deckMin(X, Z) - 60, Z] as V3, height: r.h * NS_VORTEX.height, seed: r.seed };
      if (airProject(cH, vortexAxis(v, 0)).y < r.foot) return v;
    }
    throw new Error("hundredsPlan: no place for an end hero");
  });
  heroV.forEach((v, i) => {
    const dist = Math.hypot(v.at[0] - cEnd.x, v.at[2] - cEnd.z);
    if (inFrame(extent(c0, v), 30)) throw new Error(`hundredsPlan: end hero ${i} is in cut 10's last frame`);
    out.push({ ...v, phase: random(`hm19-hero-${i}`) * 360, fill: 0.42, enter: enterOf(v), tube: 1, dist, detail: DETAIL, occlude: true });
  });
  ROW.forEach((r, i) => {
    const [X, Z] = rowXZ[i];
    const top = Math.max(2100, footAt(X, Z));
    const v = { at: [X, top - 60, Z] as V3, height: r.h * NS_VORTEX.height, seed: r.seed };
    const dist = Math.hypot(X - cEnd.x, Z - cEnd.z);
    out.push({ ...v, phase: random(`hm19-row-${i}`) * 360, fill: 0.42, enter: enterOf(v), tube: 1, dist, detail: DETAIL, occlude: true, f0: inFrame(extent(c0, v), 30) } as FieldVortex & { f0: boolean });
  });
  for (let gz = -3; gz <= 40; gz++) {
    for (let gx = -8; gx <= 46; gx++) {
      const R = (k: string) => random(`hm19-${gx}-${gz}-${k}`);
      const X = gx * GRID + (gz % 2) * GRID * 0.5 + lerp(-0.42, 0.42, R("x")) * GRID;
      const Z = gz * GRID + lerp(-0.42, 0.42, R("z")) * GRID;
      // keep clear of the big one and of the camera's path
      if (Math.hypot(X - NS_VORTEX.at[0], Z - NS_VORTEX.at[2]) < 4200) continue;
      if (rowXZ.some(([rx, rz]) => Math.hypot(X - rx, Z - rz) < GRID * 0.8)) continue;
      if (heroV.some((v) => Math.hypot(X - v.at[0], Z - v.at[2]) < GRID * 1.1)) continue;
      let near = false;
      for (const c of cams) if (Math.hypot(X - c.x, Z - c.z) < NEAR) near = true;
      if (near) continue;
      // the deck under it: the foot sinks into a heap (skip the clear gaps)
      const top = footAt(X, Z);
      if (top < 2000) continue;
      const height = lerp(H_MIN, H_MAX, R("h"));
      const seed = 8 + (n % SEEDS);
      const v = { at: [X, top - (Math.hypot(X - cEnd.x, Z - cEnd.z) < OCCLUDE_NEAR ? 60 : 20), Z] as V3, height, seed };
      // none of them in cut 10's last frame (f0 joins); only the ones that come into shot at all
      if (inFrame(extent(c0, v), 30)) continue;
      const enter = enterOf(v);
      if (enter < 0) continue;
      const dist = Math.hypot(X - cEnd.x, Z - cEnd.z);
      n++;
      out.push({
        at: v.at,
        height,
        seed,
        phase: R("p") * 360,
        fill: lerp(0.4, 0.44, R("f")),
        enter,
        tube: Math.max(1, Math.min(1.5, 0.7 + dist / 30000)),
        dist,
        detail: DETAIL,
        occlude: dist < OCCLUDE_NEAR,
      });
    }
  }
  // draw far to near (the depth buffer sorts anyway; this keeps the order stable)
  out.sort((a, b) => b.dist - a.dist);
  return out;
};
export const FIELD: FieldVortex[] = buildField();
/** the time a small vortex's amber takes to climb to its level after it comes into shot */
export const FILL_CLIMB = 12;
/** the amber starts FILL_LEAD frames before the body is in (its arms come in first), so each one arrives already filling */
export const FILL_LEAD = 6;
export const fieldFill = (v: FieldVortex, f: number) => v.fill * sstep((f - v.enter + FILL_LEAD) / FILL_CLIMB);

/** a vortex is drawn only while some part of it is in (or within `m` px of) the frame */
export const fieldVisible = (v: FieldVortex, cam: SideCam, m = 60) => inFrame(extent(cam, v), m);

// JOIN: cut 19's f0 is cut 10's f109, exactly (camera); the cut asserts this at module load
{
  const a = cam19(0) as unknown as Record<string, number>;
  const b = CUT10_END.cam as unknown as Record<string, number>;
  for (const k of ["x", "y", "z", "f", "horizon", "pitch"]) {
    if (Math.abs((a[k] ?? 0) - (b[k] ?? 0)) > 1e-6) throw new Error(`hundredsPlan: cam19(0).${k} ${a[k]} != CUT10_END.cam.${k} ${b[k]}`);
  }
  if (Math.abs(a.yaw ?? 0) > 1e-9) throw new Error("hundredsPlan: cam19(0) has a yaw");
}
