// ---------------------------------------------------------------------------
// lockDoorSwarm: where every microbe of cut 56 (LockThatDoor) is on every frame (pure data, world units of
// lockDoorSet). Drawing is covidMicrobes' (the cut file); this file only moves them.
//
// ROLES
//   air     the air full of microbes (far ones fine, near ones big): placed evenly on screen at f0 per depth band
//           (a jittered grid, so spacing is kept), drifting with a slow wobble and a gentle flow toward the lit door;
//           they never reach it (the far ones would be specks; the AirStage motes are the finest dust)
//   seek    the ones that go to the door: they stream toward the lit crack (f20-60), arrive just after it has shut
//           (f62-100) and BUMP it (a hard stop and a small rebound), pile up at the latch side, then (f76-120) move
//           over the door like moths to the lit gaps: a ring round the keyhole, a row along the slit under the door
//           (on the threshold, leaving one free place), a few on the step in front, up the hinge-side seam and the
//           latch seam; then they keep searching there (a slow jiggle along the gap)
//   virion  (the cut file) the orange one
// Every position is a closed-form function of the frame (deterministic hashes; no state).
// ---------------------------------------------------------------------------
import { DZ, FL, HX, KEY, LAMP, OPEN, SILL } from "./lockDoorSet";
import type { Cam, DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";

export type V3 = [number, number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lin = (f: number, a: number, b: number) => c01((f - a) / (b - a));
const sstep = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** covidMicrobes SWARM_KINDS with features that read as microbes at any size: comma with its tail, corkscrews, hairy,
 *  tailed and bulbed rods, the spiky and the hairy sphere, the twisty one */
const FEATURED = [6, 7, 8, 9, 10, 11, 12, 13, 14];
/** the floor's height under a point (the porch flags, the threshold) */
export const floorAt = (X: number, Z: number) => {
  if (Z > SILL.z0 && Math.abs(X) < 97) return FL;
  return 0;
};

export type Mic = {
  id: number;
  role: "air" | "seek" | "ground" | "inflow";
  /** largest extent, world units */
  s: number;
  /** index into the cut's kind table (covidMicrobes' SWARM_KINDS / genomes) */
  kind: number;
  seed: number;
  /** air: start, velocity per frame, wobble */
  p0: V3;
  v: V3;
  wob: { a: V3; w: V3; ph: V3 };
  /** seek: the timeline */
  dep?: number;
  /** contact with the door, the point of contact */
  fc?: number;
  c?: V3;
  /** leave the pile, reach the gap */
  fgo?: number;
  fg?: number;
  g?: V3;
  /** the direction it searches along at the gap (unit, world) and how far */
  sAx?: V3;
  sAmp?: number;
  /** which gap (for its light) */
  gap?: "key" | "slit" | "step" | "hinge" | "latch" | "door" | "near" | "lever";
  /** keyhole ring: the orbit (centre, radius, start angle, direction) */
  orbit?: { cx: number; cy: number; R: number; a0: number; dir: number };
  /** the slit row: index along the row (the wave's phase) */
  row?: number;
  /** always drawn above the lever and the lantern (the lever's tester) */
  top?: boolean;
};

// ---------------------------------------------------------------------------
// THE PLACEMENT (at the cut's f0 camera)
// ---------------------------------------------------------------------------
type Unproj = (sx: number, sy: number, Z: number) => V3;
const unprojOf = (cam: Cam, d: DepthOpts): Unproj => {
  const Dc = d.dRef * Math.pow(d.kRef / cam.k, d.dolly);
  return (sx, sy, Z) => {
    const wx = cam.cx + (sx - 540) / cam.k;
    const wy = cam.cy + (sy - 960) / cam.k;
    const r = Dc / (Dc + Z);
    return [cam.cx + (wx - cam.cx) / r, d.eyeY + (wy - d.eyeY) / r, Z];
  };
};

/** depth bands for the air: [Z near, Z far, size min, size max, grid columns, rows] */
const AIR_BANDS: [number, number, number, number, number, number][] = [
  [-60, -16, 5.5, 8.5, 9, 14],
  [-200, -70, 9, 13, 6, 9],
  [-330, -210, 11, 15, 4, 6],
];

/** keep: (p, f) -> false if an air microbe at p on frame f would cross the payoff's clear zone (the slit, the
 *  keyhole, the orange one's path) */
/** floorAtEnd: the porch point under a screen point at frame F_ANCHOR (the crawlers are spread over the ramp as the
 *  low camera sees it then, and walked back along their path to where they start) */
export const F_ANCHOR = 126;
export const buildSwarm = (
  rest: Cam,
  depth: DepthOpts,
  nKinds: number,
  keep?: (p: V3, f: number, s: number) => boolean,
  floorAtEnd?: (sx: number, sy: number) => V3,
  unprojAt?: (sx: number, sy: number, Z: number, f: number) => V3,
): Mic[] => {
  const un = unprojOf(rest, depth);
  const out: Mic[] = [];
  let id = 0;
  // ---- the air --------------------------------------------------------------------------------------------------
  AIR_BANDS.forEach(([z0, z1, s0, s1, nx, ny], b) => {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const h = 1000 * (b + 1) + j * 37 + i;
        // a jittered cell, the band's cells offset so bands do not line up
        const sx = ((i + 0.5 + (hash(h + 0.1) - 0.5) * 0.8 + (b % 2) * 0.33) / nx) * 1180 - 50;
        const sy = ((j + 0.5 + (hash(h + 0.2) - 0.5) * 0.8) / ny) * 2000 - 40;
        const Z = lerp(z0, z1, hash(h + 0.3));
        const p = un(sx, sy, Z);
        const s = lerp(s0, s1, hash(h + 0.4));
        // not in the floor, the step or the lantern
        if (p[1] > floorAt(p[0], p[2]) - s * 0.7 - 2) continue;
        if (Math.abs(p[0] - LAMP[0]) < 26 && Math.abs(p[1] - LAMP[1]) < 44 && p[2] > LAMP[2] - 22) continue;
        if (p[2] > -6 - s) continue;
        // drift: a gentle flow toward the lit doorway, never reaching the wall
        const tz = Math.min(0.2 + 0.55 * hash(h + 0.5), Math.max(0, (-14 - s - 4 - p[2]) / 175));
        const v: V3 = [((40 - p[0]) / 175) * 0.25 * hash(h + 0.6) + (hash(h + 0.7) - 0.5) * 0.25, (hash(h + 0.8) - 0.55) * 0.18, tz];
        const wob = {
          a: [2 + 4 * hash(h + 0.9), 2 + 3 * hash(h + 1.1), 1.5 * hash(h + 1.2)] as V3,
          w: [0.025 + 0.03 * hash(h + 1.3), 0.02 + 0.03 * hash(h + 1.4), 0.02 + 0.02 * hash(h + 1.5)] as V3,
          ph: [6.28 * hash(h + 1.6), 6.28 * hash(h + 1.7), 6.28 * hash(h + 1.8)] as V3,
        };
        // the near (big) ones are kinds with features (hairs, a flagellum, spikes, a coil): a plain cream rod or bean
        // that big reads as a pill
        // every visible organism is a featured kind (spikes, hairs, a flagellum, a coil): a plain cream ball in the
        // lantern's light reads as dust, snow or a bubble (the finest specks are the stage's motes)
        const kind = FEATURED[Math.floor(hash(h + 2.1) * FEATURED.length)];
        void nKinds;
        const m: Mic = { id: id++, role: "air", s, kind, seed: h, p0: p, v, wob };
        if (keep) {
          let ok = true;
          for (let f = 84; f < 175 && ok; f += 3) ok = keep(micAt(m, f).p, f, s);
          if (!ok) {
            id--;
            continue;
          }
        }
        out.push(m);
      }
    }
  });
  // ---- the seekers ---------------------------------------------------------------------------------------------------
  type G = { g: V3; gap: Mic["gap"]; s: number; ax: V3; amp: number; kind?: number; orbit?: Mic["orbit"]; row?: number };
  /** the row at the slit: mixed featured kinds, all thicker than the slit is tall (spiky and hairy spheres, hairy,
   *  tailed and bulbed rods lying along the threshold), so they visibly cannot follow */
  const ROW = [12, 9, 13, 10, 11, 12, 9];
  const BULKY = [12, 13, 9, 10, 12];
  const goals: G[] = [];
  const doorZ = (s: number) => DZ - s / 2 - 0.6;
  // the keyhole: a ring (the lever above it is avoided)
  const kx = HX + KEY.u;
  const ky = FL - 7 - KEY.v;
  [
    [11.5, -70],
    [11, 25],
    [11.5, 115],
    [12, 200],
    [22, -25],
    [22.5, 62],
    [22, 150],
    [23, 210],
    [32, 100],
  ].forEach(([R, a], i) => {
    const s = 11 + 2 * hash(500 + i);
    const ar = (a * Math.PI) / 180;
    const x = Math.min(84 - s * 0.3, kx + R * Math.cos(ar));
    goals.push({ g: [x, ky + R * Math.sin(ar), doorZ(s)], gap: "key", s, ax: [-Math.sin(ar), Math.cos(ar), 0], amp: 2.5, orbit: { cx: kx, cy: ky, R, a0: ar, dir: R < 16 ? 1 : -1 } });
  });
  // the slit: a row on the threshold, one free place left of centre (the orange one's)
  [-75, -55, -35, 15, 35, 55, 75].forEach((x, i) => {
    const kind = ROW[i % ROW.length];
    const sphere = kind === 12 || kind === 13;
    const s = (sphere ? 15 : 19.5) + 1.5 * hash(600 + i);
    goals.push({ g: [x + (hash(610 + i) - 0.5) * 2, FL - (sphere ? s * 0.45 : s * 0.22), doorZ(sphere ? s : s * 0.45)], gap: "slit", s, ax: [1, 0, 0], amp: 2.2, kind, row: i });
  });
  // a few on the step in front of them
  [-74, -50, 32, 56, 80].forEach((x, i) => {
    const kind = BULKY[(i + 2) % BULKY.length];
    const s = 13 + 3 * hash(700 + i);
    goals.push({ g: [x, 0 - s * 0.45, -24 - 10 * hash(710 + i)], gap: "step", s, ax: [1, 0, 0.3], amp: 4, kind });
  });
  // up the hinge-side seam (in front of the casing) and the latch seam
  [44, 118, 192, 264, 332].forEach((h, i) => {
    const s = 12 + 2.5 * hash(800 + i);
    goals.push({ g: [OPEN.x0 - 1.5, FL - h, -CAS_FRONT - s / 2 - 0.6], gap: "hinge", s, ax: [0, 1, 0], amp: 5 });
  });
  [70, 125, 270].forEach((h, i) => {
    const s = 12 + 2.5 * hash(850 + i);
    goals.push({ g: [OPEN.x1 + 1, FL - h, -CAS_FRONT - s / 2 - 0.6], gap: "latch", s, ax: [0, 1, 0], amp: 5 });
  });
  // wanderers on the door's face, between the gaps
  [
    [-40, 70],
    [10, 120],
    [-55, 210],
    [-10, 300],
    [55, 40],
  ].forEach(([x, h], i) => {
    const s = 12 + 3 * hash(900 + i);
    goals.push({ g: [x, FL - h, doorZ(s)], gap: "door", s, ax: [Math.cos(i * 1.7), Math.sin(i * 1.7), 0], amp: 9 });
  });
  // one tests the lever: it climbs onto the bar by the rose and walks it to the tip and back
  {
    const s = 11;
    goals.push({ g: [LEVER.x0 - 4, LEVER.y - 2.6 - s * 0.42, LEVER.z - 2], gap: "lever", s, ax: [1, 0, 0], amp: 0, kind: 10 });
  }
  // each goal gets a seeker: it starts somewhere in the air (spread over the whole frame, a jittered grid), streams
  // toward the lit crack and hits the door near it (two thirds, f62-72: the door has just shut in their faces) or
  // arrives later straight at its gap (f76-102)
  const order = goals.map((_, i) => i).sort((a, b) => hash(4000 + a) - hash(4000 + b));
  const NX = 6;
  const NY = Math.ceil(goals.length / NX);
  order.forEach((gi, slot) => {
    const gl = goals[gi];
    const h = 3000 + gi * 13;
    // the latch side's gaps go to the ones that hit the door where the crack was; the far gaps to later arrivals
    const early = gl.g[0] > -20 && gl.gap !== "hinge" && gl.gap !== "step" && gl.gap !== "lever";
    const sxC = ((slot % NX) + 0.5 + (hash(h + 0.01) - 0.5) * 0.8) / NX;
    const syC = (Math.floor(slot / NX) + 0.5 + (hash(h + 0.02) - 0.5) * 0.8) / NY;
    const Z0 = -70 - 170 * hash(h + 0.03);
    const p0 = un(40 + sxC * 1000, 120 + syC * 1300, Z0);
    const fl = floorAt(p0[0], p0[2]);
    if (p0[1] > fl - gl.s - 4) p0[1] = fl - gl.s - 6;
    const fc = early ? 62 + Math.floor(11 * hash(h + 0.1)) : 78 + Math.floor(24 * hash(h + 0.1));
    let c: V3;
    if (early) {
      // the crack's line, at a height that follows where it came from
      let cy = Math.max(FL - 330, Math.min(FL - 30, lerp(p0[1], FL - 180, 0.45) + 40 * (hash(h + 0.3) - 0.5)));
      // not on the keyhole or across the sliver at the bolt's height (the lock must be seen)
      // (nor on the lever above it, which lifts at LOCK)
      if (cy > ky - 58 && cy < ky + 34) cy = cy < ky - 12 ? ky - 58 : ky + 34;
      c = [lerp(46, 76, hash(h + 0.2)), cy, DZ - gl.s / 2 - 0.6];
    } else {
      c = [gl.g[0] + 14 * (hash(h + 0.2) - 0.5), gl.g[1] - 10 - 16 * hash(h + 0.3), DZ - gl.s / 2 - 0.6];
      if (gl.gap === "hinge" || gl.gap === "latch") c[0] = gl.g[0] > 0 ? 70 : -70;
    }
    const fgo = early ? Math.max(fc + 6, 76 + Math.floor(14 * hash(h + 0.7))) : fc + 5;
    const travel = Math.hypot(gl.g[0] - c[0], gl.g[1] - c[1]);
    const fg = Math.min(128, fgo + 14 + travel / 7);
    const wob = {
      a: [1.2, 1.2, 0.6] as V3,
      w: [0.05 + 0.03 * hash(h + 1.1), 0.045 + 0.03 * hash(h + 1.2), 0.04] as V3,
      ph: [6.28 * hash(h + 1.3), 6.28 * hash(h + 1.4), 6.28 * hash(h + 1.5)] as V3,
    };
    out.push({
      id: id++,
      role: "seek",
      s: gl.s,
      kind: gl.kind ?? FEATURED[Math.floor(hash(h + 2.2) * FEATURED.length)],
      seed: h,
      p0,
      v: [0, 0, 0],
      wob,
      dep: early ? Math.floor(2 + 16 * hash(h + 0.8)) : Math.floor(20 + 30 * hash(h + 0.8)),
      fc,
      c,
      fgo,
      fg,
      g: gl.g,
      sAx: gl.ax,
      sAmp: gl.amp,
      gap: gl.gap,
      orbit: gl.orbit,
      row: gl.row,
      top: gl.gap === "lever",
    });
  });
  // ---- the ground: microbes crawling over the path and the step toward the door at a steady pace; the path's ones
  // stop at the step's face, the step's ones at the threshold (a small bump), then nose along it
  // ---- the ground: microbes crawling over the porch flags toward the door at a steady pace (near ones big and soft),
  // a few reaching the sill (a small bump, then nosing along it); spread over the ramp the end camera sees
  if (floorAtEnd) {
    // [screen row band in the last frame, count, size range, near (soft)]
    const BANDS: [number, number, number, number, number, boolean][] = [
      [990, 1150, 5, 11, 15, false],
      [1150, 1360, 4, 10, 14, false],
      [1480, 1760, 3, 7, 9, true],
    ];
    BANDS.forEach(([y0, y1, n, s0, s1, near], bi) => {
      for (let i = 0; i < n; i++) {
        const h = 6000 + bi * 101 + i * 13;
        const s = lerp(s0, s1, hash(h + 0.1));
        const sx = ((i + 0.5 + (hash(h + 0.2) - 0.5) * 0.7) / n) * 1000 + 40;
        const sy = lerp(y0, y1, hash(h + 0.3));
        const e = floorAtEnd(sx, sy);
        const stopZ = SILL.z0 - s * 0.5;
        const Z1 = Math.min(stopZ, e[2]);
        // a steady crawl across the flags toward the door, slanting in from the side it is on (the near, soft ones
        // cross the foreground sideways)
        const side = e[0] > 0 ? 1 : -1;
        const speed = near ? 0.22 + 0.1 * hash(h + 0.4) : 0.7 + 0.4 * hash(h + 0.4);
        // (the near ones all cross the same way, left to right, so none passes over another)
        const dir: V3 = near ? [0.95, 0, 0.3] : [-side * (0.45 + 0.3 * hash(h + 0.45)), 0, 1];
        const dl = Math.hypot(dir[0], dir[2]);
        const vv: V3 = [(dir[0] / dl) * speed, 0, (dir[2] / dl) * speed];
        // e is where it is at F_ANCHOR (the middle of the search), so it is on the ramp through the last 3 s
        const X0 = e[0] - vv[0] * F_ANCHOR;
        const Z0 = Z1 - vv[2] * F_ANCHOR;
        const fc = vv[2] > 0 ? Math.min(400, (stopZ - Z0) / vv[2]) : 400;
        const X = X0;
        // the orange one's place at the slit stays clear
        if (Math.abs(e[0] + 9) < 40 && Z1 > -60) continue;
        out.push({
          id: id++,
          role: "ground",
          s,
          kind: FEATURED[Math.floor(hash(h + 0.6) * FEATURED.length)],
          seed: h,
          p0: [X, -s * 0.42, Z0],
          v: vv,
          wob: { a: [1.5, 0.6, 0.8], w: [0.06, 0.09, 0.05], ph: [6.28 * hash(h + 0.7), 6.28 * hash(h + 0.8), 6.28 * hash(h + 0.9)] },
          fc,
          gap: near ? "near" : undefined,
        });
      }
    });
  }
  // ---- the inflow: a steady stream out of the dark at the frame's sides, low over the flags, to the crowd at the
  // threshold (one every ~7 frames from f78); they fly at a steady pace, slow as they land, then keep nosing about
  if (unprojAt) {
    for (let i = 0; i < 19; i++) {
      const h = 7000 + i * 19;
      const fe = 78 + i * 5 + Math.floor(3 * hash(h + 0.1));
      const left = i % 2 === 0;
      // a third fly in high, to the door's face (they join the ones searching it)
      const high = i % 3 === 1;
      const s = 11 + 4 * hash(h + 0.2);
      const Z0 = -150 - 150 * hash(h + 0.3);
      const start = unprojAt(left ? -70 : 1150, high ? 420 + 300 * hash(h + 0.4) : 1040 + 260 * hash(h + 0.4), Z0, fe);
      start[1] = Math.min(start[1], -s - 8);
      // the landing: on the flags in front of the threshold, off the orange one's place; or on the door's face
      let tx = (left ? -1 : 1) * (28 + 70 * hash(h + 0.5));
      if (Math.abs(tx + 9) < 30) tx += left ? -30 : 30;
      const tgt: V3 = high ? [(left ? -1 : 1) * (20 + 50 * hash(h + 0.5)), FL - 60 - 90 * hash(h + 0.55), DZ - s / 2 - 0.6] : [tx, -s * 0.45, -40 - 40 * hash(h + 0.6)];
      const dist = Math.hypot(tgt[0] - start[0], tgt[1] - start[1], tgt[2] - start[2]);
      const speed = 3 + 1.5 * hash(h + 0.7);
      const fl = fe + dist / speed;
      out.push({
        id: id++,
        role: "inflow",
        s,
        kind: FEATURED[Math.floor(hash(h + 0.8) * FEATURED.length)],
        seed: h,
        p0: start,
        v: [0, 0, 0],
        wob: { a: [1.5, 1.2, 0.8], w: [0.06, 0.08, 0.05], ph: [6.28 * hash(h + 0.9), 6.28 * hash(h + 1.0), 6.28 * hash(h + 1.1)] },
        fc: fe,
        fg: fl,
        g: tgt,
      });
    }
  }
  return out;
};
/** the lever's bar in world units (the leaf shut): from the rose (x0) toward the hinge side to its tip (x1) */
export const LEVER = { x0: HX + 149, x1: HX + 149 - 28, y: FL - 7 - 190, z: DZ - 8 };
/** the lever tester's place along the bar (0 rose .. 1 tip) */
export const leverWalk = (f: number, fg: number) => {
  const t = Math.max(0, f - fg);
  return 0.08 + 0.84 * (0.5 - 0.5 * Math.cos(t * 0.075));
};
/** the door casing stands proud of the wall by this much (lockDoorSet CAS_P) */
const CAS_FRONT = 4;

export type MicState = { p: V3; yawAdd: number; squash: number; contact: number };
const wob3 = (m: Mic, f: number, k = 1): V3 => [
  k * m.wob.a[0] * Math.sin(m.wob.w[0] * f + m.wob.ph[0]),
  k * m.wob.a[1] * Math.sin(m.wob.w[1] * f + m.wob.ph[1]),
  k * m.wob.a[2] * Math.sin(m.wob.w[2] * f + m.wob.ph[2]),
];
/** a microbe's position (and its bump) at frame f */
export const micAt = (m: Mic, f: number): MicState => {
  if (m.role === "ground") {
    const fc = m.fc as number;
    const t = Math.min(f, fc);
    const w = wob3(m, f);
    const after = f - fc;
    const reb = after > 0 ? 3 * Math.sin(Math.min(Math.PI, after * 0.55)) * Math.exp(-after / 5) : 0;
    return {
      p: [m.p0[0] + m.v[0] * t + w[0], m.p0[1] - Math.abs(w[1]) * 0.3, m.p0[2] + m.v[2] * t - reb + w[2] * 0.3 - (after > 0 ? 0.6 + 0.6 * Math.sin(after * 0.05) : 0) * Math.min(1, after / 8)],
      yawAdd: 0,
      squash: after > 0 ? 1 - 0.15 * Math.exp(-after / 1.6) : 1,
      contact: after > 0 ? Math.exp(-after / 3) : 0,
    };
  }
  if (m.role === "inflow") {
    // a steady flight (constant speed along the line, continued back off frame before it is seen), slowing over its
    // last 15% to land (C1), then nosing about on the flags
    const fe = m.fc as number;
    const fl = m.fg as number;
    const g = m.g as V3;
    const T = fl - fe;
    const u = (f - fe) / T;
    const u1 = 0.85;
    const v = 1 / (u1 + (1 - u1) / 2);
    const e = u < u1 ? v * u : u < 1 ? v * u1 + v * (u - u1) - (v / (2 * (1 - u1))) * (u - u1) * (u - u1) : 1;
    const arc = Math.sin(Math.PI * c01(e)) * 10;
    const w = wob3(m, f, u < 1 ? 1 : 0.6);
    const settle = c01((f - fl) / 20);
    const nose = 3 * Math.sin(0.06 * f + m.seed) * settle * settle * (3 - 2 * settle);
    return {
      p: [lerp(m.p0[0], g[0], e) + w[0] + nose, lerp(m.p0[1], g[1], e) - arc + w[1] * (1 - 0.7 * c01(e)), lerp(m.p0[2], g[2], e) + w[2]],
      yawAdd: 0,
      squash: 1,
      contact: 0,
    };
  }
  if (m.role === "air") {
    const w = wob3(m, f);
    return { p: [m.p0[0] + m.v[0] * f + w[0], m.p0[1] + m.v[1] * f + w[1], m.p0[2] + m.v[2] * f + w[2]], yawAdd: 0, squash: 1, contact: 0 };
  }
  const dep = m.dep as number;
  const fc = m.fc as number;
  const c = m.c as V3;
  const g = m.g as V3;
  const fgo = m.fgo as number;
  const fg = m.fg as number;
  // before it sets off: drifting where it is
  const pDep: V3 = [m.p0[0], m.p0[1], m.p0[2]];
  let p: V3;
  let squash = 1;
  let contact = 0;
  if (f < fc) {
    // the approach: speeds up from the drift, then travels at a steady pace into the door (no easing at the end: it
    // hits). A sideways bow so the streams curve in toward the crack.
    const u = c01((f - dep) / (fc - dep));
    // C1: a quadratic start up to u0, then a steady pace into the door
    const u0 = 0.3;
    const qa = 1 / (2 * u0 - u0 * u0);
    const e = u < u0 ? qa * u * u : qa * u0 * u0 + 2 * qa * u0 * (u - u0);
    const bow = Math.sin(Math.PI * e) * 14 * (hash(m.seed + 4.4) - 0.5);
    p = [lerp(pDep[0], c[0], e) + bow, lerp(pDep[1], c[1], e) + bow * 0.4, lerp(pDep[2], c[2], e)];
    // the wobble eases to the pile's (0.6) as it arrives, so position is continuous at the hit
    const w = wob3(m, f, 1 - 0.4 * e);
    p = [p[0] + w[0], p[1] + w[1], p[2] + w[2] * (1 - e)];
  } else if (f < fgo) {
    // the bump: a hard stop, a small rebound off the door, settling back against it
    const t = f - fc;
    const reb = 4.5 * Math.sin(Math.min(Math.PI, t * 0.55)) * Math.exp(-t / 5);
    squash = 1 - 0.18 * Math.exp(-t / 1.6);
    contact = Math.exp(-t / 3);
    const w = wob3(m, f, 0.6);
    p = [c[0] + w[0], c[1] + w[1], c[2] - reb];
  } else {
    // over the door to its gap, then searching along it
    const ul = lin(f, fgo, fg);
    const u = ul * ul * ul * (ul * (6 * ul - 15) + 10);
    const w = wob3(m, f, 0.6);
    const ax = m.sAx as V3;
    const ramp0 = c01((f - fg + 10) / 24);
    const ramp = ramp0 * ramp0 * (3 - 2 * ramp0);
    const sr = (m.sAmp as number) * Math.sin(0.05 * f + 6.28 * hash(m.seed + 7.7)) * ramp;
    p = [lerp(c[0], g[0], u) + w[0] + ax[0] * sr, lerp(c[1], g[1], u) + w[1] + ax[1] * sr, lerp(c[2], g[2], u) + ax[2] * sr - Math.abs(w[2]) * 0.4];
    // THE SEARCH (one smooth activity per gap, from its arrival)
    const t = Math.max(0, f - fg + 10);
    if (m.gap === "slit") {
      // a wave runs along the row as they press and shuffle; once the orange one is through (f150-174) the row closes
      // in on the gap it used
      const i = m.row ?? 0;
      const wave = (4.5 * Math.sin(0.07 * f - i * 0.9) + 3 * Math.sin(0.03 * f)) * ramp;
      const close = 6 * sstep(lin(f, 150, 174)) * Math.sign(-9 - g[0]);
      p[0] += wave + close;
    } else if (m.gap === "key" && m.orbit) {
      // round the keyhole, probing in toward it now and then
      const o = m.orbit;
      const a = o.a0 + o.dir * 0.04 * t;
      const probe = Math.pow(Math.max(0, Math.sin(0.1 * f + o.a0 * 3)), 2);
      const R = o.R * (1 - 0.28 * probe);
      const k = ramp;
      p[0] = lerp(p[0], o.cx + R * Math.cos(a) + w[0], k);
      p[1] = lerp(p[1], o.cy + R * Math.sin(a) + w[1], k);
    } else if (m.gap === "hinge" || m.gap === "latch") {
      // climbing the seam
      p[1] -= (0.55 + 0.35 * hash(m.seed + 8.8)) * t * ramp;
    } else if (m.gap === "lever") {
      // walking the lever's bar to its tip and back
      const sL = leverWalk(f, fg);
      p[0] = lerp(p[0], lerp(LEVER.x0, LEVER.x1, sL) + w[0] * 0.3, ramp);
      p[1] = lerp(p[1], LEVER.y - 2.6 - m.s * 0.42 - Math.abs(w[1]) * 0.3, ramp);
    }
  }
  return { p, yawAdd: 0, squash, contact };
};
