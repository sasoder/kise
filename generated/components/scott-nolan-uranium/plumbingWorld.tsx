// ---------------------------------------------------------------------------
// plumbingWorld: the pipework of IncrediblyComplicated (scott-nolan-uranium). Only that cut uses it.
//
// Every object here is a tube swept along an orthogonal path with rounded elbows. A flange, a valve body, a gauge's drum are
// bumps in the tube's radius, so the tip lays them as it passes: nothing fades or scales in. A handwheel is laid the same way:
// a stem out of the valve, spokes out of the hub, the rim swept around from a spoke.
// Layout (rows along X, long runs along Z, branches between them) is computed once at module load from a seeded generator,
// with a clearance check so pipes never pass through each other, and a check on the final camera so a gap stays open
// in front of the pellet. World units as in nuclearWorld. Scale logic: mains r 6-8, process lines r 3.5-5, instrument lines r 2.4.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
import { COLOR } from "../kits/cheeky-pint/stoutShared";
import { SHADOW_LEN, SHADOW_DIR, SoftShadows, nuclearMaterial, nuclearCamAt, nuclearProject, nuclearTrack, withClayAttrs, type NuclearCam, type ShadowItem, type V3 } from "./nuclearWorld";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len3 = (a: V3) => Math.sqrt(dot(a, a));
const norm3 = (a: V3): V3 => {
  const l = len3(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ===================================================================================================================
// CAMERA. Run-up frames before f0 so the camera is already moving on the first frame.
// ===================================================================================================================
export const PLUMB_DURATION = 77;
const PLUMB_DURATION_END = PLUMB_DURATION - 1;
const PRE = 16;
const TRACK = nuclearTrack(
  { tx: 0, ty: 10, tz: 0, d: 218, yaw: -13, pitch: 37, f: 2200, cy: 900, cx: 540 },
  [
    { f0: 0, f1: PRE + 60, to: { d: 505, yaw: 9, pitch: 43, cy: 880 } },
    { f0: PRE + 56, f1: PRE + 130, to: { d: 526, yaw: 14 } },
  ],
  PLUMB_DURATION + PRE,
);
/** The camera the layout's checks use: f76 of this track is the end frame. */
const plumbCamAt = (f: number): NuclearCam => TRACK[Math.max(0, Math.min(TRACK.length - 1, f + PRE))];
/** The camera on screen: the same path, stretched in time so the pull-back keeps going through the fill (to about f60), same f0 and f76. */
const CAM_STRETCH = 8;
export const plumbViewAt = (f: number): NuclearCam => {
  const s = Math.sin((Math.PI * f) / PLUMB_DURATION_END);
  return nuclearCamAt(TRACK, PRE + f - CAM_STRETCH * s * s);
};

// ===================================================================================================================
// PATHS
// ===================================================================================================================
type Prim = { k: "l"; a: V3; d: V3; len: number } | { k: "a"; c: V3; u: V3; v: V3; R: number; th: number; len: number };
const primAt = (p: Prim, t: number): { pos: V3; tan: V3 } => {
  if (p.k === "l") return { pos: add(p.a, p.d, t), tan: p.d };
  const th = t / p.R;
  const co = Math.cos(th);
  const si = Math.sin(th);
  return { pos: add(add(p.c, p.u, p.R * co), p.v, p.R * si), tan: add([p.u[0] * -si, p.u[1] * -si, p.u[2] * -si], p.v, co) };
};
const pathPrims = (pts: V3[], rf: number): Prim[] => {
  const out: Prim[] = [];
  let from = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const q = pts[i];
    const dIn = norm3(sub(q, from));
    if (i === pts.length - 1) {
      out.push({ k: "l", a: from, d: dIn, len: len3(sub(q, from)) });
      break;
    }
    const dOut = norm3(sub(pts[i + 1], q));
    const R = Math.min(rf, len3(sub(q, pts[i - 1])) * 0.45, len3(sub(pts[i + 1], q)) * 0.45);
    const start = add(q, dIn, -R);
    out.push({ k: "l", a: from, d: dIn, len: len3(sub(start, from)) });
    out.push({ k: "a", c: add(start, dOut, R), u: [-dOut[0], -dOut[1], -dOut[2]], v: dIn, R, th: Math.PI / 2, len: (R * Math.PI) / 2 });
    from = add(q, dOut, R);
  }
  return out;
};
const pathAt = (prims: Prim[], s: number) => {
  let rest = s;
  for (let i = 0; i < prims.length; i++) {
    if (rest <= prims[i].len || i === prims.length - 1) return primAt(prims[i], Math.min(rest, prims[i].len));
    rest -= prims[i].len;
  }
  return primAt(prims[0], 0);
};

type Feature = { kind: "flange" | "bulge"; s: number; w: number; R: number };
type Dial = { R: number; a0: number };
export type Run = {
  id: number;
  pts: V3[];
  prims: Prim[];
  L: number;
  polyL: number;
  r: number;
  t0: number;
  v: number;
  features: Feature[];
  shadow: boolean;
  dial?: Dial;
};
const EASE = 1.35;
/** the tip travels at speed v and slows into its landing */
const durOf = (run: Pick<Run, "L" | "v">) => (run.L * EASE) / run.v;
export const tipAt = (run: Run, f: number) => {
  const tau = c01((f - run.t0) / durOf(run));
  return run.L * (1 - Math.pow(1 - tau, EASE));
};
const frameAtS = (run: Run, s: number) => run.t0 + durOf(run) * (1 - Math.pow(1 - c01(s / run.L), 1 / EASE));
const endFrame = (run: Pick<Run, "t0" | "L" | "v">) => run.t0 + durOf(run);
const radiusAt = (run: Run, s: number) => {
  let r = run.r;
  for (const q of run.features) {
    const d = Math.abs(s - q.s);
    if (q.kind === "flange") {
      const b = Math.max(0.5, q.w * 0.45);
      if (d < q.w + b) r = Math.max(r, run.r + (q.R - run.r) * (1 - smooth(q.w, q.w + b, d)));
    } else if (d < q.w) {
      const c = Math.cos((Math.PI * d) / (2 * q.w));
      r = Math.max(r, run.r + (q.R - run.r) * c * c);
    }
  }
  return r;
};

// ===================================================================================================================
// THE LAYOUT
// ===================================================================================================================
const RUNS: Run[] = [];
let seq = 0;
const mkRun = (pts: V3[], r: number, t0: number, v: number, opts?: { rf?: number; features?: Feature[]; shadow?: boolean; prims?: Prim[]; dial?: Dial }): Run => {
  const prims = opts?.prims ?? pathPrims(pts, opts?.rf ?? Math.max(r * 2.1, 5));
  let L = 0;
  for (const p of prims) L += p.len;
  let polyL = 0;
  for (let i = 1; i < pts.length; i++) polyL += len3(sub(pts[i], pts[i - 1]));
  const run: Run = { id: seq++, pts, prims, L, polyL: polyL || L, r, t0, v, features: opts?.features ?? [], shadow: opts?.shadow ?? true, dial: opts?.dial };
  RUNS.push(run);
  return run;
};

// ----- clearance: every straight stretch in the world, with its radius and owner
type Seg = { a: V3; b: V3; r: number; owner: number };
const SEGS: Seg[] = [];
const register = (run: Run, extra = 0) => {
  for (let i = 1; i < run.pts.length; i++) SEGS.push({ a: run.pts[i - 1], b: run.pts[i], r: run.r + extra, owner: run.id });
};
const segDist = (p1: V3, q1: V3, p2: V3, q2: V3) => {
  const d1 = sub(q1, p1);
  const d2 = sub(q2, p2);
  const r = sub(p1, p2);
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  let s = 0;
  let t = 0;
  if (a < 1e-9 && e < 1e-9) return len3(r);
  if (a < 1e-9) t = c01(f / e);
  else {
    const c = dot(d1, r);
    if (e < 1e-9) s = c01(-c / a);
    else {
      const b = dot(d1, d2);
      const den = a * e - b * b;
      s = den > 1e-9 ? c01((b * f - c * e) / den) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = c01(-c / a);
      } else if (t > 1) {
        t = 1;
        s = c01((b - c) / a);
      }
    }
  }
  return len3(sub(add(p1, d1, s), add(p2, d2, t)));
};
const clear = (pts: V3[], r: number, exempt: number[], gap = 2.5) => {
  for (let i = 1; i < pts.length; i++) {
    for (const q of SEGS) {
      if (exempt.indexOf(q.owner) >= 0) continue;
      if (segDist(pts[i - 1], pts[i], q.a, q.b) < r + q.r + gap) return false;
    }
  }
  return true;
};

// ----- the gap: nothing nearer than the pellet may cross its screen disc on the settled camera; nothing behind crowds it
const CHECK_FRAMES = [46, 55, 66, 76];
const HOLE_FRONT = 100;
const HOLE_REAR = 58;
const opensGap = (pts: V3[], r: number, front = HOLE_FRONT) => {
  for (const fr of CHECK_FRAMES) {
    const c = plumbCamAt(fr);
    const o = nuclearProject(c, [0, 10, 0]);
    for (let i = 1; i < pts.length; i++) {
      const n = Math.max(2, Math.ceil(len3(sub(pts[i], pts[i - 1])) / 8));
      for (let j = 0; j <= n; j++) {
        const p = add(pts[i - 1], sub(pts[i], pts[i - 1]), j / n);
        const q = nuclearProject(c, p);
        if (q.d <= 0) continue;
        const dist = Math.hypot(q.x - o.x, q.y - o.y) - r * q.s;
        if (dist < (q.d < o.d ? front : HOLE_REAR)) return false;
      }
    }
  }
  return true;
};
/** how big a stretch gets on the settled camera: no pipe may swell into a wall of cream */
const notTooClose = (pts: V3[], r: number) => {
  const c = plumbCamAt(76);
  for (const p of pts) {
    const q = nuclearProject(c, p);
    if (q.d < 90 || r * 2 * q.s > 240) return false;
  }
  return true;
};
const onScreen = (p: V3, m = 0) => {
  const c = plumbCamAt(60);
  const q = nuclearProject(c, p);
  return q.d > 0 && q.x > m && q.x < 1080 - m && q.y > m && q.y < 1920 - m;
};
const inBands = (p: V3) => {
  for (const fr of [55, 76]) {
    const y = nuclearProject(plumbCamAt(fr), p).y;
    if ((y > 1030 && y < 1290) || (y > 1320 && y < 1500)) return true;
  }
  return false;
};

// ----- seeded choice
let seed = 41;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length) % a.length];
const rr = (a: number, b: number) => a + (b - a) * rnd();

// ----- features
const flangeAt = (s: number, r: number): Feature => ({ kind: "flange", s, w: Math.max(0.8, r * 0.26), R: r * 1.42 + 0.5 });
const addFlanges = (L: number, r: number, skipA = 10, skipB = 10) => {
  const out: Feature[] = [];
  if (r < 3.4) return out;
  let s = skipA + rr(12, 60);
  const step = r >= 6 ? rr(92, 128) : rr(70, 104);
  while (s < L - skipB) {
    out.push(flangeAt(s, r));
    s += step;
  }
  return out;
};
const valveBody = (s: number, r: number): Feature[] => [
  flangeAt(s - r * 1.95, r),
  { kind: "bulge", s, w: r * 1.75, R: r * 1.62 },
  flangeAt(s + r * 1.95, r),
];

/** A stem out of a valve, three spokes out of the hub, the rim swept round from the first spoke. */
const addHandwheel = (run: Run, s: number, dir: V3 = [0, 1, 0], tStart?: number) => {
  const p = pathAt(run.prims, s).pos;
  const Rw = Math.max(run.r * 1.72, 8.5);
  const h = Rw * 1.5 + run.r * 0.5;
  const stemR = Math.max(1.5, run.r * 0.26);
  const top = add(p, dir, h);
  const t0 = tStart ?? frameAtS(run, s) + 0.5;
  const stem = mkRun([p, top], stemR, t0, h / 3.2, { shadow: false, features: [{ kind: "flange", s: h, w: 1.3, R: stemR * 1.9 }] });
  const t1 = endFrame(stem) - 1;
  const fwd = norm3(sub(run.pts[1], run.pts[0]));
  const a = norm3(cross(dir, Math.abs(dot(dir, fwd)) > 0.9 ? [1, 0, 0] : fwd));
  const b = norm3(cross(dir, a));
  const rimR = Math.max(1.5, Rw * 0.17);
  const spokeR = Math.max(1.05, rimR * 0.62);
  for (let i = 0; i < 3; i++) {
    const th = (i * Math.PI * 2) / 3 + 0.4;
    const e = add(add(top, a, Rw * Math.cos(th)), b, Rw * Math.sin(th));
    mkRun([top, e], spokeR, t1, Rw / 2.2, { shadow: false });
  }
  const th0 = 0.4;
  const u = add([a[0] * Math.cos(th0), a[1] * Math.cos(th0), a[2] * Math.cos(th0)], b, Math.sin(th0));
  const v = add([a[0] * -Math.sin(th0), a[1] * -Math.sin(th0), a[2] * -Math.sin(th0)], b, Math.cos(th0));
  const len = Rw * Math.PI * 2;
  mkRun([top], rimR, t1 + 1.6, len / 4.4, { shadow: false, prims: [{ k: "a", c: top, u, v, R: Rw, th: Math.PI * 2, len }] });
  SEGS.push({ a: add(top, a, -Rw), b: add(top, a, Rw), r: rimR + 1, owner: stem.id });
  SEGS.push({ a: add(top, b, -Rw), b: add(top, b, Rw), r: rimR + 1, owner: stem.id });
  SEGS.push({ a: p, b: top, r: stemR, owner: stem.id });
};
const GAUGE_DIR = norm3([0, 0.74, -0.67]);
const addGauge = (run: Run, s: number, t0Min = 0) => {
  const p = pathAt(run.prims, s).pos;
  const R = 8;
  const h = 9 + R * 0.5;
  const top = add(p, GAUGE_DIR, h);
  const t0 = Math.max(frameAtS(run, s) + 0.5, t0Min);
  const stem = mkRun([p, top], 1.7, t0, h / 3.5, {
    shadow: false,
    features: [{ kind: "flange", s: h - 0.9, w: 2.4, R }],
    dial: { R, a0: rr(-0.7, 0.7) },
  });
  SEGS.push({ a: p, b: top, r: R, owner: stem.id });
};

// ----- the first two pipes: run past the pellet and out of frame (brief: f6-25)
const LV_ROW = [14, 52, 90, 128];
const LV_LONG = [33, 71, 109, 147];
const P1 = (() => {
  const v = 12.5;
  const pts: V3[] = [[-260, 11, 54], [37, 11, 54], [37, 11, -340]];
  // the tip reaches the frame's left edge at about f6
  const f: Feature[] = [flangeAt(214, 6), flangeAt(337, 6), ...valveBody(378, 6)];
  const run = mkRun(pts, 6, 6 - 188 / v, v, { rf: 13, features: f });
  register(run);
  addHandwheel(run, 378);
  return run;
})();
const P2 = (() => {
  const v = 16;
  const pts: V3[] = [[300, 33, 92], [-41, 33, 92], [-41, 33, -340]];
  const f: Feature[] = [flangeAt(262, 4.5), flangeAt(400, 4.5), flangeAt(476, 4.5)];
  const run = mkRun(pts, 4.5, 11 - 208 / v, v, { rf: 10, features: f });
  register(run);
  return run;
})();

// the first two pipes (with the first one's handwheel) keep the screen's clock
const LAST_OWN_CLOCK = P2.id;

// ----- rows along X
type RowSpec = { z: number; y: number; r: number; dir: 1 | -1; t0: number; n?: number; frames?: number };
const ROW_TABLE: RowSpec[] = [
  // behind the pellet, close: the first to multiply
  { z: 78, y: LV_ROW[0], r: 7.5, dir: 1, t0: 26 },
  { z: 128, y: LV_ROW[1], r: 6.5, dir: -1, t0: 27 },
  { z: 150, y: LV_ROW[0], r: 3.6, dir: 1, t0: 28, n: 2 },
  { z: 196, y: LV_ROW[2], r: 7.5, dir: 1, t0: 29 },
  { z: 232, y: LV_ROW[0], r: 6.5, dir: -1, t0: 30 },
  { z: 262, y: LV_ROW[1], r: 4, dir: 1, t0: 31, n: 3 },
  { z: 322, y: LV_ROW[2], r: 7, dir: -1, t0: 32 },
  { z: 366, y: LV_ROW[0], r: 7.5, dir: 1, t0: 33 },
  { z: 412, y: LV_ROW[3], r: 7, dir: 1, t0: 33 },
  { z: 470, y: LV_ROW[1], r: 7.5, dir: -1, t0: 34 },
  { z: 540, y: LV_ROW[2], r: 7.5, dir: 1, t0: 35, n: 2 },
  { z: 620, y: LV_ROW[1], r: 8, dir: -1, t0: 36 },
  { z: 720, y: LV_ROW[3], r: 8, dir: 1, t0: 36 },
  // in front of it, lower in the frame: come later, as the camera has made room
  { z: -118, y: LV_ROW[1], r: 7, dir: 1, t0: 34 },
  { z: -150, y: LV_ROW[1], r: 3.6, dir: -1, t0: 36, n: 2 },
  { z: -205, y: LV_ROW[1], r: 7.5, dir: -1, t0: 37 },
  { z: -172, y: LV_ROW[2], r: 5, dir: 1, t0: 38 },
  { z: -232, y: LV_ROW[2], r: 7.5, dir: 1, t0: 40 },
  { z: -262, y: LV_ROW[1], r: 4.2, dir: 1, t0: 41, n: 2 },
];
const OFF_FRAME_LEAD = 3.5;
const halfWidth = (y: number, z: number) => {
  const c = plumbCamAt(76);
  const q = nuclearProject(c, [0, y, z]);
  return (540 / 2200) * Math.max(120, q.d) + Math.abs(z) * 0.3 + 70;
};
type Row = { run: Run; y: number; z: number; x0: number; x1: number };
const ROWS: Row[] = [];
for (const spec of ROW_TABLE) {
  for (let i = 0; i < (spec.n ?? 1); i++) {
    const z = spec.z + i * spec.r * 2.9;
    const hw = halfWidth(spec.y, z);
    const x0 = -spec.dir * hw;
    const x1 = spec.dir * hw;
    const pts: V3[] = [[x0, spec.y, z], [x1, spec.y, z]];
    if (!clear(pts, spec.r, [], 1.5) || !opensGap(pts, spec.r) || !notTooClose(pts, spec.r)) continue;
    const L = hw * 2;
    const v = L / (spec.frames ?? 15);
    const run = mkRun(pts, spec.r, spec.t0 - OFF_FRAME_LEAD + i * 1.5, v, { features: addFlanges(L, spec.r, 14, 14) });
    register(run);
    ROWS.push({ run, y: spec.y, z, x0, x1 });
  }
}

// ----- feeders: low lines that come in from the frame's sides and tee into the first two pipes, so those two become the trunk
type Feeder = { z: number; side: 1 | -1; r: number; t0: number };
const FEEDERS: Feeder[] = [
  { z: -62, side: 1, r: 4.2, t0: 28 },
  { z: -112, side: 1, r: 5, t0: 31 },
  { z: -168, side: 1, r: 3.6, t0: 34 },
  { z: -226, side: 1, r: 5, t0: 37 },
  { z: -74, side: -1, r: 3.6, t0: 29 },
  { z: -128, side: -1, r: 3.6, t0: 32 },
  { z: -190, side: -1, r: 4.2, t0: 35 },
];
for (const q of FEEDERS) {
  const trunk = q.side > 0 ? P1 : P2;
  const tx = trunk.pts[2][0];
  const y = trunk.pts[2][1];
  const hw = halfWidth(y, q.z);
  const pts: V3[] = [[q.side * hw, y, q.z], [tx, y, q.z]];
  if (!clear(pts, q.r, [trunk.id], 1.5) || !opensGap(pts, q.r)) continue;
  const L = Math.abs(hw * q.side - tx);
  const run = mkRun(pts, q.r, q.t0 - OFF_FRAME_LEAD, L / 12, { features: [...addFlanges(L, q.r, 14, 20), flangeAt(L - trunk.r - q.r * 1.4, q.r)] });
  register(run);
}

// ----- long runs along Z, a level between the rows, so they cross over and under
type LongSpec = { x: number; y: number; z0: number; z1: number; r: number; t0: number; frames: number };
const LONG_TABLE: LongSpec[] = [
  { x: -92, y: LV_LONG[1], z0: 380, z1: -300, r: 6.5, t0: 28, frames: 19 },
  { x: 96, y: LV_LONG[1], z0: -300, z1: 480, r: 6.5, t0: 29, frames: 20 },
  { x: -64, y: LV_LONG[2], z0: -300, z1: 300, r: 4.2, t0: 31, frames: 17 },
  { x: 142, y: LV_LONG[0], z0: 640, z1: -300, r: 7.5, t0: 31, frames: 20 },
  { x: -148, y: LV_LONG[2], z0: 720, z1: -300, r: 7, t0: 32, frames: 20 },
  { x: 62, y: LV_LONG[2], z0: 800, z1: 110, r: 7, t0: 32, frames: 18 },
  { x: -30, y: LV_LONG[1], z0: 820, z1: 120, r: 7.5, t0: 33, frames: 18 },
  { x: 205, y: LV_LONG[2], z0: -240, z1: 760, r: 7, t0: 33, frames: 20 },
  { x: -236, y: LV_LONG[1], z0: -160, z1: 760, r: 7.5, t0: 34, frames: 20 },
  { x: 118, y: LV_LONG[3], z0: 820, z1: -180, r: 5, t0: 35, frames: 20 },
  { x: -105, y: LV_LONG[3], z0: -220, z1: 780, r: 5, t0: 36, frames: 20 },
  { x: 16, y: LV_LONG[3], z0: 860, z1: 150, r: 7.5, t0: 37, frames: 17 },
  { x: 290, y: LV_LONG[1], z0: 860, z1: 120, r: 8, t0: 37, frames: 17 },
  { x: -300, y: LV_LONG[2], z0: 120, z1: 860, r: 8, t0: 37, frames: 17 },
];
const LONGS: { run: Run; x: number; y: number; z0: number; z1: number }[] = [];
for (const spec of LONG_TABLE) {
  // a run that ends inside the frame turns down to a foot on the board: no pipe stops in mid-air
  const pts: V3[] = [[spec.x, spec.y, spec.z0], [spec.x, spec.y, spec.z1]];
  if ([40, 60, 76].some((fr) => {
    const q = nuclearProject(plumbCamAt(fr), pts[1]);
    return q.d > 0 && q.x > -90 && q.x < 1170 && q.y > -90 && q.y < 2010;
  })) pts.push([spec.x, 0, spec.z1]);
  if (!clear(pts, spec.r, [], 1.5) || !opensGap(pts, spec.r) || !notTooClose(pts, spec.r)) continue;
  const L = Math.abs(spec.z1 - spec.z0) + (pts.length > 2 ? spec.y : 0);
  const run = mkRun(pts, spec.r, spec.t0 - OFF_FRAME_LEAD, L / spec.frames, { features: addFlanges(L, spec.r, 14, 14) });
  register(run);
  LONGS.push({ run, x: spec.x, y: spec.y, z0: spec.z0, z1: spec.z1 });
}

// ----- branches: drops to the floor, links from row to row over a long-run level, blind stubs
const BRANCH_TARGET = 62;
const LATE_START = 56;
let branchCount = 0;
const feet: { x: number; y: number }[] = [];
// after the main pass, three last lines that finish in the settled frame (brief: f55-76)
const MAIN_ATTEMPTS = 900;
let lateCount = 0;
for (let attempt = 0; attempt < 4000 && lateCount < 3; attempt++) {
  const late = attempt >= MAIN_ATTEMPTS || branchCount >= BRANCH_TARGET;
  const row = pick(ROWS);
  const span = row.x1 - row.x0;
  const s = rr(0.16, 0.84) * Math.abs(span);
  const x = row.x0 + Math.sign(span) * s;
  const start: V3 = [x, row.y, row.z];
  if (!onScreen(start, late ? 200 : 40)) continue;
  if (late && nuclearProject(plumbCamAt(66), start).d > 620) continue;
  // a line that arrives in the settled frame keeps well clear of the gap and the first pipe's handwheel beside it
  const GAP_LATE = 300;
  const kind = rnd();
  let pts: V3[] = [];
  let r = pick([2.6, 3.6, 4.2, 5]);
  let target: Row | null = null;
  if (kind < 0.24 && row.y > 20) {
    // feet stay spread out: a bunch of them reads as organ pipes
    const here = nuclearProject(plumbCamAt(66), [x, 0, row.z]);
    if (feet.some((q) => Math.hypot(q.x - here.x, q.y - here.y) < 190)) continue;
    feet.push(here);
    pts = [start, [x, 0, row.z]];
    r = pick([3.6, 4.2, 5]);
  } else {
    target = pick(ROWS);
    const dz = target.z - row.z;
    if (target === row || Math.abs(dz) < 34 || Math.abs(dz) > 260) continue;
    const inRange = (x - target.x0) * (x - target.x1) < 0;
    if (!inRange) continue;
    const yb = pick(LV_LONG);
    pts = [start, [x, yb, row.z], [x, yb, target.z], [x, target.y, target.z]];
  }
  if (r >= row.run.r) r = Math.min(row.run.r * 0.7, 3.6);
  const exempt = [row.run.id, ...(target ? [target.run.id] : [])];
  if (!clear(pts, r, exempt, 3) || !opensGap(pts, r, late ? GAP_LATE : HOLE_FRONT) || !notTooClose(pts, r)) continue;
  const polyL = pts.slice(1).reduce((a, p, i) => a + len3(sub(p, pts[i])), 0);
  const frames = late ? rr(9, 13) : rr(7, 13);
  const v = polyL / frames;
  let t0 = Math.max(frameAtS(row.run, s) + 1, late ? LATE_START + lateCount * 4.5 : 28 + rnd() * 18);
  if (target) t0 = Math.max(t0, frameAtS(target.run, Math.abs(x - target.x0)) + 1 - frames * EASE * 0.8);
  if (!late && t0 + frames * EASE > 58) continue;
  if (late && (t0 > LATE_START + lateCount * 4.5 + 0.01 || t0 + frames * EASE > 76)) continue;
  const features: Feature[] = [flangeAt(r * 3.2 + 2, r)];
  if (r >= 3.6) features.push(flangeAt(polyL - r * 3.2 - 2, r));
  const run = mkRun(pts, r, t0, v, { features });
  // a drop ends on a foot; a link's end is inside its target
  if (!target) run.features.push({ kind: "flange", s: run.L - 0.6, w: Math.max(1, r * 0.3), R: r * 1.5 + 0.6 });
  register(run);
  branchCount++;
  if (late) lateCount++;
}

// ----- valves with handwheels and gauges, only where they read: on screen, out of the caption bands, not crowding the gap
const WHEEL_TARGET = 7;
const GAUGE_TARGET = 6;
const placed: { x: number; y: number }[] = [];
const fitted = (p: V3, reach: number, owner: number) => {
  if (inBands(p) || inBands(add(p, [0, 1, 0], reach)) || inBands(add(p, GAUGE_DIR, reach)) || !onScreen(p, 90)) return false;
  if (nuclearProject(plumbCamAt(76), p).s > 7) return false;
  const here = nuclearProject(plumbCamAt(66), p);
  if (placed.some((q) => Math.hypot(q.x - here.x, q.y - here.y) < 230)) return false;
  const top = add(p, [0, 1, 0], reach);
  const top2 = add(p, GAUGE_DIR, reach);
  return clear([p, top], reach * 0.55, [owner], 1) && clear([p, top2], reach * 0.55, [owner], 1);
};
const wheelCandidates = [...ROWS.map((q) => q.run), ...LONGS.map((q) => q.run)].filter((q) => q.r >= 5);
let wheels = 0;
for (let a = 0; a < 400 && wheels < WHEEL_TARGET; a++) {
  const run = pick(wheelCandidates);
  const s = rr(0.15, 0.85) * run.L;
  const p = pathAt(run.prims, s).pos;
  if (nuclearProject(plumbCamAt(60), p).d > 620 || frameAtS(run, s) > 50) continue;
  if (run.features.some((q) => Math.abs(q.s - s) < run.r * 4)) continue;
  if (!fitted(p, Math.max(run.r * 1.72, 8.5) * 1.5 + run.r, run.id)) continue;
  placed.push(nuclearProject(plumbCamAt(66), p));
  run.features.push(...valveBody(s, run.r));
  addHandwheel(run, s);
  wheels++;
}
let gauges = 0;
for (let a = 0; a < 400 && gauges < GAUGE_TARGET; a++) {
  const run = pick(wheelCandidates);
  const s = rr(0.15, 0.85) * run.L;
  const p = pathAt(run.prims, s).pos;
  if (nuclearProject(plumbCamAt(60), p).d > 640 || frameAtS(run, s) > 52) continue;
  if (run.features.some((q) => Math.abs(q.s - s) < run.r * 2.5)) continue;
  if (!fitted(p, 18, run.id)) continue;
  placed.push(nuclearProject(plumbCamAt(66), p));
  addGauge(run, s);
  gauges++;
}

// ----- nothing at rest looks unfinished. A pipe down to the board lands on a wide base plate with a collar, and a start that the
// settled frame could see is pushed further off frame. (A post-pass, so it changes no choice made by the generator above.)
const FEET: { x: number; z: number; R: number }[] = [];
for (const run of RUNS) {
  const end = run.pts[run.pts.length - 1];
  if (run.prims[0].k === "a" || Math.abs(end[1]) > 0.01) continue;
  run.features = run.features.filter((q) => q.s < run.L - 3);
  const R = Math.min(run.r * 2.6, run.r + 9);
  run.features.push({ kind: "flange", s: run.L - 0.7, w: 0.9, R });
  run.features.push(flangeAt(run.L - 3.6 - run.r * 0.5, run.r));
  FEET.push({ x: end[0], z: end[2], R });
}
const pushStartBack = (run: Run, by: number) => {
  const d = norm3(sub(run.pts[0], run.pts[1]));
  run.pts[0] = add(run.pts[0], d, by);
  run.prims = pathPrims(run.pts, Math.max(run.r * 2.1, 5));
  run.L += by;
  run.polyL += by;
  run.t0 -= by / run.v;
  for (const q of run.features) q.s += by;
};
for (const { run } of LONGS) {
  const q = nuclearProject(plumbCamAt(76), run.pts[0]);
  if (q.d > 0 && q.x > -60 && q.x < 1140 && q.y > -60 && q.y < 1980) pushStartBack(run, 140);
}
// a flange whose pipe runs just off the frame edge would peek in as a sliver
for (const { run } of LONGS) {
  run.features = run.features.filter((f) => {
    if (f.kind !== "flange") return true;
    const q = nuclearProject(plumbCamAt(76), pathAt(run.prims, f.s).pos);
    return !(q.x < 0 || q.x > 1080);
  });
}

// a link that runs straight away from the camera and then drops into its target folds back on itself on screen and reads as a capped
// stub. Those turn sideways before they drop, so the elbow and the landing are both seen.
const foldsAt = (pts: V3[], k: number) =>
  [58, 66, 76].some((fr) => {
    const c = plumbCamAt(fr);
    const a = nuclearProject(c, pts[k - 1]);
    const b = nuclearProject(c, pts[k]);
    const e = nuclearProject(c, pts[k + 1]);
    const ux = b.x - a.x;
    const uy = b.y - a.y;
    const vx = e.x - b.x;
    const vy = e.y - b.y;
    const cosA = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
    return cosA < -0.93 && b.x > -40 && b.x < 1120 && b.y > -40 && b.y < 1960;
  });
for (const run of RUNS) {
  if (run.pts.length !== 4 || !run.shadow) continue;
  const k = foldsAt(run.pts, 1) ? 1 : foldsAt(run.pts, 2) ? 2 : 0;
  if (!k) continue;
  const corner = run.pts[k];
  const jog = Math.max(run.r * 4.6, 14);
  const inward = nuclearProject(plumbCamAt(76), corner).x > 540 ? -1 : 1;
  const side = [inward, -inward].find((q) => clear([corner, [corner[0] + q * jog, corner[1], corner[2]]], run.r, [run.id], 1));
  if (side === undefined) continue;
  const oldL = run.L;
  const shift = (p: V3): V3 => [p[0] + side * jog, p[1], p[2]];
  run.pts = [...run.pts.slice(0, k + 1), shift(corner), ...run.pts.slice(k + 1).map(shift)];
  run.prims = pathPrims(run.pts, Math.max(run.r * 2.1, 5));
  run.L = run.prims.reduce((m, q) => m + q.len, 0);
  run.polyL += jog;
  for (const q of run.features) if (q.s > oldL * 0.5) q.s += run.L - oldL;
}

// ----- the clock of the fill: a growth frame per screen frame, measured from the rendered fill so that it swells evenly from about f22
// to f56. One time warp over everything but the first two pipes, so every tee still lands after its target passes.
const GROWTH: number[] = [
  0.00, 1.00, 2.00, 3.00, 4.00, 5.00, 6.00, 7.00, 8.00, 9.00, 10.00, 11.00, 12.00, 13.00, 14.00, 15.00, 16.00, 17.01, 18.04, 19.13, 20.31, 21.66, 23.16, 24.78, 26.39, 27.86, 29.11, 30.14, 31.00, 31.75, 32.45, 33.13, 33.81, 34.49, 35.16, 35.80, 36.39, 36.93, 37.43, 37.89, 38.34, 38.78, 39.21, 39.63, 40.04, 40.44, 40.83, 41.23, 41.66, 42.14, 42.69, 43.36, 44.20, 45.28, 46.64, 48.25, 49.99, 51.73, 53.34, 54.80, 56.15, 57.43, 58.68, 59.92, 61.16, 62.39, 63.63, 64.87, 66.10, 67.34, 68.58, 69.81, 71.05, 72.27, 73.48, 74.66, 76.00,
];
const growthAt = (f: number) => GROWTH[Math.max(0, Math.min(PLUMB_DURATION - 1, f))];
const clockOf = (run: Run, f: number) => (run.id <= LAST_OWN_CLOCK ? f : growthAt(f));

// ===================================================================================================================
// GEOMETRY
// ===================================================================================================================
const buildTube = (run: Run) => {
  // the ring positions along the path: uniform on straights, fine on elbows, fine over each feature
  const ss: number[] = [0];
  let acc = 0;
  for (const p of run.prims) {
    const ds = Math.max(0.3, Math.min(p.k === "l" ? 3.2 : 1.6, run.r * 0.28));
    const n = Math.max(1, Math.ceil(p.len / ds));
    for (let i = 1; i <= n; i++) ss.push(acc + (p.len * i) / n);
    acc += p.len;
  }
  for (const q of run.features) {
    const reach = q.kind === "flange" ? q.w * 1.6 + 0.6 : q.w;
    const n = q.kind === "flange" ? 11 : 15;
    for (let i = 0; i <= n; i++) ss.push(q.s - reach + (2 * reach * i) / n);
  }
  const rings = ss.filter((s) => s >= 0 && s <= run.L).sort((a, b) => a - b).filter((s, i, a) => i === 0 || s - a[i - 1] > 0.04);
  // a tube carrying a wide plate or a gauge drum needs enough sides for that radius, not its own
  const widest = run.features.reduce((m, q) => Math.max(m, q.R), run.r);
  const seg = widest >= 5 ? 32 : run.r >= 3.4 ? 18 : 12;
  const pos = new Float32Array(rings.length * seg * 3);
  const nor = new Float32Array(rings.length * seg * 3);
  const first = pathAt(run.prims, 0).tan;
  let N = norm3(cross(first, Math.abs(first[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
  rings.forEach((s, i) => {
    const { pos: c, tan: T } = pathAt(run.prims, s);
    N = norm3(add(N, T, -dot(N, T)));
    const B = cross(T, N);
    const r = radiusAt(run, s);
    const dr = (radiusAt(run, s + 0.08) - radiusAt(run, s - 0.08)) / 0.16;
    const nl = Math.hypot(1, dr);
    for (let j = 0; j < seg; j++) {
      const th = (j * Math.PI * 2) / seg;
      const o = add([N[0] * Math.cos(th), N[1] * Math.cos(th), N[2] * Math.cos(th)], B, Math.sin(th));
      const k = (i * seg + j) * 3;
      pos[k] = c[0] + o[0] * r;
      pos[k + 1] = c[1] + o[1] * r;
      pos[k + 2] = -(c[2] + o[2] * r);
      const n: V3 = [(o[0] - (T[0] * dr)) / nl, (o[1] - (T[1] * dr)) / nl, (o[2] - (T[2] * dr)) / nl];
      nor[k] = n[0];
      nor[k + 1] = n[1];
      nor[k + 2] = -n[2];
    }
  });
  const idx = new Uint32Array((rings.length - 1) * seg * 6);
  let w = 0;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * seg + j;
      const b = i * seg + ((j + 1) % seg);
      const c = a + seg;
      const d = b + seg;
      idx[w++] = a;
      idx[w++] = b;
      idx[w++] = c;
      idx[w++] = b;
      idx[w++] = d;
      idx[w++] = c;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  withClayAttrs(g);
  return { g, rings, seg };
};
/** the rounded nose every tip carries: radius 1, tip at local y 0, a short skirt back over the last ring gap (rings are closer than that) */
const capGeo = (() => {
  let g: Any = null;
  return () => {
    if (g) return g;
    const pts = [[1, -0.34], [1, -0.2], [0.97, -0.11], [0.86, -0.04], [0.5, -0.008], [0.0001, 0]];
    g = withClayAttrs(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), 36));
    return g;
  };
})();
const UP = new THREE.Vector3(0, 1, 0);
type Built = { run: Run; rings: number[]; seg: number; g: Any; mesh: Any; cap: Any; dial: Any };
const buildAll = (): { root: Any; items: Built[] } => {
  const root = new THREE.Group();
  const clay = nuclearMaterial("clay");
  const dim = nuclearMaterial("clayDim");
  const items: Built[] = RUNS.map((run) => {
    const { g, rings, seg } = buildTube(run);
    const mesh = new THREE.Mesh(g, clay);
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;
    const cap = new THREE.Mesh(capGeo(), clay);
    cap.frustumCulled = false;
    cap.renderOrder = 3;
    root.add(mesh);
    root.add(cap);
    let dial: Any = null;
    if (run.dial) {
      dial = new THREE.Group();
      const box = (w: number, l: number, x: number, z: number, rot: number) => {
        const m = new THREE.Mesh(withClayAttrs(new THREE.BoxGeometry(w, 0.02, l)), dim);
        m.position.set(x, 0, z);
        m.rotation.y = rot;
        m.frustumCulled = false;
        m.renderOrder = 4;
        return m;
      };
      for (let i = 0; i < 7; i++) {
        const a = -2.2 + (i * 4.4) / 6;
        dial.add(box(0.1, 0.24, Math.sin(a) * 0.68, -Math.cos(a) * 0.68, -a));
      }
      const hand = new THREE.Group();
      hand.add(box(0.11, 0.62, 0, -0.26, 0));
      hand.name = "hand";
      dial.add(hand);
      root.add(dial);
    }
    return { run, rings, seg, g, mesh, cap, dial };
  });
  return { root, items };
};
let built: ReturnType<typeof buildAll> | null = null;

const shadowItems = (f: number): ShadowItem[] => {
  const out: ShadowItem[] = [];
  for (const run of RUNS) {
    if (!run.shadow) continue;
    const tip = tipAt(run, clockOf(run, f));
    let walked = (tip / run.L) * run.polyL;
    for (let i = 1; i < run.pts.length; i++) {
      const a = run.pts[i - 1];
      const full = sub(run.pts[i], a);
      const l = len3(full);
      const seen = Math.max(0, Math.min(l, walked));
      walked -= l;
      const b = add(a, full, seen / (l || 1));
      const ax = a[0] + a[1] * SHADOW_LEN * SHADOW_DIR[0];
      const az = a[2] + a[1] * SHADOW_LEN * SHADOW_DIR[1];
      const bx = b[0] + b[1] * SHADOW_LEN * SHADOW_DIR[0];
      const bz = b[2] + b[1] * SHADOW_LEN * SHADOW_DIR[1];
      const sl = Math.hypot(bx - ax, bz - az);
      const my = (a[1] + b[1]) / 2;
      out.push({
        x: ax,
        z: az,
        len: sl,
        r: run.r * 1.02,
        soft: run.r * 0.5 + my * 0.11,
        alpha: seen > 0 ? 0.42 + 0.58 * Math.exp(-my / 60) : 0,
        dirX: sl > 1e-4 ? (bx - ax) / sl : SHADOW_DIR[0],
        dirZ: sl > 1e-4 ? (bz - az) / sl : SHADOW_DIR[1],
      });
    }
  }
  // a base plate's contact shadow, once its pipe has landed
  RUNS.forEach((run) => {
    const end = run.pts[run.pts.length - 1];
    if (Math.abs(end[1]) > 0.01 || run.prims[0].k === "a") return;
    const foot = FEET.find((q) => q.x === end[0] && q.z === end[2]);
    if (!foot) return;
    const land = smooth(run.L - 6, run.L, tipAt(run, clockOf(run, f)));
    out.push({ x: foot.x, z: foot.z, len: 1.5, r: foot.R * 1.04, soft: foot.R * 0.2, alpha: land });
  });
  return out;
};

const q0 = new THREE.Quaternion();
const v0 = new THREE.Vector3();
export const Plumbing: React.FC<{ f: number }> = ({ f }) => {
  const b = useMemo(() => {
    if (!built) built = buildAll();
    return built;
  }, []);
  for (const it of b.items) {
    const { run } = it;
    const clock = clockOf(run, f);
    const tip = tipAt(run, clock);
    const on = clock > run.t0 && tip > 0;
    it.mesh.visible = on;
    it.cap.visible = on;
    if (it.dial) it.dial.visible = false;
    if (!on) continue;
    // the tube up to the last ring behind the tip
    let lo = 0;
    let hi = it.rings.length - 1;
    while (lo < hi) {
      const m = (lo + hi + 1) >> 1;
      if (it.rings[m] <= tip) lo = m;
      else hi = m - 1;
    }
    it.g.setDrawRange(0, lo * it.seg * 6);
    // the nose, exactly at the tip, reaching back over the last ring
    const at = pathAt(run.prims, tip);
    const r = radiusAt(run, tip);
    it.cap.position.set(at.pos[0], at.pos[1], -at.pos[2]);
    v0.set(at.tan[0], at.tan[1], -at.tan[2]);
    q0.setFromUnitVectors(UP, v0);
    it.cap.quaternion.copy(q0);
    it.cap.scale.setScalar(r);
    if (it.dial && run.dial) {
      const open = r / run.dial.R;
      if (open > 0.3) {
        it.dial.visible = true;
        it.dial.position.set(at.pos[0] + at.tan[0] * 0.02, at.pos[1] + at.tan[1] * 0.02, -(at.pos[2] + at.tan[2] * 0.02));
        it.dial.quaternion.copy(q0);
        it.dial.scale.setScalar(run.dial.R * open);
        const hand = it.dial.getObjectByName("hand");
        // the needle climbs as the line comes up to pressure and then only creeps
        hand.rotation.y = -(-2 + (run.dial.a0 + 2.4) * smooth(run.t0, run.t0 + 26, clock) + 0.004 * (clock - run.t0));
      }
    }
  }
  return (
    <>
      <SoftShadows items={shadowItems(f)} />
      <primitive object={b.root} />
    </>
  );
};

// ===================================================================================================================
// The pellet's fixed warmth on the board. Drawn over the floor and its shadows, under every object.
// ===================================================================================================================
const hexVec = (h: string) => new THREE.Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
export const FloorGlow: React.FC<{ R: number; strength: number }> = ({ R, strength }) => {
  const mesh = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: { uC: { value: hexVec(COLOR.amberFoot) }, uS: { value: strength } },
      vertexShader: "varying vec2 vQ; void main() { vQ = position.xz * 2.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 uC; uniform float uS; varying vec2 vQ; void main() { float d = length(vQ); float a = exp(-d * d * 7.0) * (1.0 - smoothstep(0.8, 1.0, d)); gl_FragColor = vec4(uC, a * uS); }",
    });
    const g = new THREE.PlaneGeometry(1, 1);
    g.rotateX(-Math.PI / 2);
    const me = new THREE.Mesh(g, m);
    me.frustumCulled = false;
    me.renderOrder = -85; // under the shadows: the pellet's own shadow lies across its warmth
    return me;
  }, [strength]);
  mesh.scale.set(R * 2, 1, R * 2);
  mesh.position.set(0, 0.05, 0);
  return <primitive object={mesh} />;
};
