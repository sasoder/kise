// ---------------------------------------------------------------------------
// valuePerWattPlan — the pure plan of cut 3, MoreValuePerWatt (sam-gigawatt-cost): the world geometry (metres, the
// aircraftShared frame: X right, Y up, Z away), the pulse metronome, the ingot schedule (every ingot's path, launch
// and landing, checked for collisions at module load), and the camera keys. No React, so a check script can import it.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 78;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- the chip on its plinth (all centred on X 0, Z 0) ----------------------------------------------------------
export const PLINTH = { w: 1.8, d: 3.3, h: 0.22 } as const;
export const PIN = { h: 0.18, n: 8, w: 0.085, out: 0.2, t: 0.045 } as const;
/** the package: a cream ceramic card standing on its pins */
export const PKG = { w: 1.3, d: 2.9, y0: PLINTH.h + PIN.h, t: 0.8 } as const;
export const PKG_TOP = PKG.y0 + PKG.t;
/** the die: a board-toned square set into the package top */
export const DIE = { w: 0.72, d: 2.0, h: 0.07 } as const;
/** the outlets: two slots side by side through the package's RIGHT face (x = +PKG.w/2), `depth` deep, one per lane;
 *  lane 0 (front, nearer the camera) at Z = -ROW_Z, lane 1 (back) at Z = +ROW_Z, a thin wall between them */
export const ROW_Z = 0.64;
export const SLOT = { zw: 1.16, y0: PKG.y0 + 0.05, h: 0.5, depth: 0.8 } as const;
export const laneZ = (lane: number) => (lane === 0 ? -ROW_Z : ROW_Z);
/** the plug where the cable enters: an upright boot standing on the package top, in the strip behind the die at
 *  its left end (the side the camera sees; the cable drops into it from the pole behind) */
export const PLUG = { x: -PKG.w / 2 + 0.27, y: PKG_TOP, z: PKG.d / 2 - 0.185, len: 0.3, r: 0.13 } as const;

// --- the ingots ----------------------------------------------------------------------------------------------
/** W across (X), L long axis (Z, into the picture), H tall; the top face is inset (a cast bar's draft). The draft and
 *  the gap between bars are what let a falling bar drop past its left neighbour's shoulder into its place. */
export const INGOT = { W: 0.72, L: 1.08, H: 0.4, insetX: 0.13, insetZ: 0.13 } as const;
const GAP = 0.1;
export const PITCH = INGOT.W + GAP;
/** the pile's final base-left corner: on the apron, a little right of the plinth */
export const PILE_X0 = PKG.w / 2 + 1.9;
/** the base the pile would reach with NB shells; its right foot is the anchor where the first bar lands */
const NB = 6;
export const PILE_XR = PILE_X0 + (NB - 1) * PITCH + INGOT.W / 2;

/** Slots of a stepped stack two rows deep (one row per lane; bars end-on, half-offset per layer), anchored at its far
 *  (right) foot: each row's base is laid first, from the far end back toward the chip, then each layer above it,
 *  always right to left, so every bar lands on the open side of its layer (nothing to its left, its right neighbour
 *  already down) and the approach from the chip is clear. j counts from the right. */
export type Slot = { lane: number; layer: number; j: number; x: number; y: number };
const SLOTS: Slot[] = [];
for (const lane of [0, 1]) {
  for (let y = 0; y < NB; y++) {
    for (let j = 0; j < NB - y; j++) SLOTS.push({ lane, layer: y, j, x: PILE_XR - (y / 2 + j) * PITCH, y: y * INGOT.H });
  }
}

// --- the cable and the pulse metronome -----------------------------------------------------------------------
/** The power's source: a small cream pole on the apron behind-left of the chip, a crossarm with two insulators on
 *  top; the cable hangs from the right-hand insulator in one sag and comes in level to the plug. */
export const POLE = { x: -4.4, z: 3.6, h: 5.0, post: 0.24, arm: 1.9, armY: 4.55, armT: 0.16, ins: 0.2, insR: 0.09 } as const;
const INS_X = POLE.x + POLE.arm / 2 - 0.22;
/** The cable: a cubic Bezier in world metres from the insulator to the plug; `s` = arc length from the pole end. */
export const CABLE = {
  p0: [INS_X, POLE.armY + POLE.armT / 2 + POLE.ins, POLE.z] as const,
  c1: [INS_X + 0.9, 1.3, POLE.z - 0.9] as const,
  c2: [PLUG.x - 0.1, PLUG.y + PLUG.len + 1.5, PLUG.z + 0.25] as const,
  p1: [PLUG.x, PLUG.y + PLUG.len, PLUG.z] as const,
  r: 0.085,
};
export const INSULATORS: [number, number, number][] = [
  [INS_X, POLE.armY + POLE.armT / 2, POLE.z],
  [POLE.x - POLE.arm / 2 + 0.22, POLE.armY + POLE.armT / 2, POLE.z],
];
type V3 = [number, number, number];
const bez3 = (a: readonly number[], b: readonly number[], c: readonly number[], d: readonly number[], t: number): V3 => {
  const u = 1 - t;
  return [0, 1, 2].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]) as V3;
};
const CABLE_N = 400;
const CABLE_PTS: V3[] = [];
const CABLE_S: number[] = [];
for (let i = 0; i <= CABLE_N; i++) {
  const p = bez3(CABLE.p0, CABLE.c1, CABLE.c2, CABLE.p1, i / CABLE_N);
  CABLE_PTS.push(p);
  CABLE_S.push(i === 0 ? 0 : CABLE_S[i - 1] + Math.hypot(p[0] - CABLE_PTS[i - 1][0], p[1] - CABLE_PTS[i - 1][1], p[2] - CABLE_PTS[i - 1][2]));
}
/** the cable's length to the plug face, plus the plug */
export const CABLE_LEN = CABLE_S[CABLE_N];
export const cablePoints = () => CABLE_PTS.map((p) => [...p] as V3);
export const cableS = () => [...CABLE_S];
/** a point on the cable at arc length s (beyond the end: on down into the plug and the package) */
export const cableAt = (s: number): V3 => {
  if (s >= CABLE_LEN) return [CABLE.p1[0], CABLE.p1[1] - (s - CABLE_LEN), CABLE.p1[2]];
  if (s <= 0) return [...CABLE_PTS[0]] as V3;
  let lo = 0;
  let hi = CABLE_N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (CABLE_S[m] <= s) lo = m;
    else hi = m;
  }
  const t = (s - CABLE_S[lo]) / (CABLE_S[hi] - CABLE_S[lo]);
  return [0, 1, 2].map((k) => lerp(CABLE_PTS[lo][k], CABLE_PTS[hi][k], t)) as V3;
};

/** The watt: identical light pulses, one every PULSE.every frames, at one speed along the cable. Pulse k (1-based)
 *  reaches the plug face (the CONTACT: it enters the chip) on frame PULSE.first + (k-1) * every. */
export const PULSE = { first: 2, every: 13, speed: 0.36, len: 0.9 } as const;
export const contactFrame = (k: number) => PULSE.first + (k - 1) * PULSE.every;
/** pulses alive in the cut (k = 1 already on the cable at f0; the last ones are still on their way at f77) */
export const PULSE_KS = Array.from({ length: 12 }, (_, i) => i - 3).filter((k) => contactFrame(k) - CABLE_LEN / PULSE.speed < DURATION + 2);
/** arc length of pulse k's head at frame f (CABLE_LEN at contact; it travels on through the plug and the package) */
export const pulseS = (k: number, f: number) => CABLE_LEN + (f - contactFrame(k)) * PULSE.speed;
/** the light crossing the package after a contact: from the plug face to the slot (frames after contact) */
export const CROSS = { frames: 3 } as const;
/** how far across the package (0 at the left face .. 1 at the outlet) pulse k's light is at frame f, or null */
export const crossAt = (k: number, f: number) => {
  const u = (f - contactFrame(k)) / CROSS.frames;
  return u < -0.02 || u > 1.6 ? null : u;
};

// --- the ingots' schedule ------------------------------------------------------------------------------------
/** The toss. A bar slides out of the slot level at its launch speed v (it starts fully inside, hidden), and once it is
 *  clear of the slot face its path bends up over a short radius into a free ballistic arc under one gravity G for
 *  every bar; the arc comes down on the bar's place in the pile and the bar stops there dead (no bounce). The flight
 *  time per bar is the shortest that clears everything (chip, pile, every other bar): the bars that drop past a left
 *  neighbour fly higher lobs and come down steeper. */
export const G = 0.013;
const BAR_Y0 = SLOT.y0 + 0.01;
const X_IN = PKG.w / 2 - SLOT.depth - INGOT.W / 2;
/** where the bend starts: the bar's left face 4 cm clear of the slot face */
const X_B = PKG.w / 2 + INGOT.W / 2 + 0.04;
const BEND_R = 0.6;
/** no bar moves faster than this (m per frame) anywhere on its path */
const VMAX = 0.30;
/** and every bar leaves the slot at least this fast (a toss, not a dribble) */
const VMIN = 0.15;
/** nor lands faster than this */
const VLAND = 0.29;

export type Bar = {
  idx: number;
  lane: number;
  burst: number;
  slot: Slot;
  /** frame the bar starts moving inside the package */
  t0: number;
  /** frame its right face crosses the slot face (first visible outside the slot) */
  emerge: number;
  /** frame it leaves the bend (the free arc starts) */
  tl: number;
  /** frame it touches down (exact, fractional) */
  t1: number;
  /** launch speed (the slide and the bend run at it) */
  v: number;
  phi: number;
  P: [number, number];
  vx: number;
  vy0: number;
  tau: number;
  L1: number;
  Lb: number;
};

/** the launch for flight time tau onto target T: the bend's end P depends on the launch angle, so iterate */
const tossOf = (T: [number, number], tau: number) => {
  let phi = 1.1;
  let P: [number, number] = [0, 0];
  let vx = 0;
  let vy0 = 0;
  for (let it = 0; it < 6; it++) {
    P = [X_B + BEND_R * Math.sin(phi), BAR_Y0 + BEND_R * (1 - Math.cos(phi))];
    vx = (T[0] - P[0]) / tau;
    vy0 = (T[1] - P[1]) / tau + (G * tau) / 2;
    phi = Math.atan2(vy0, vx);
  }
  if (vx < 0.004 || phi > 1.45) return null;
  return { phi, P, vx, vy0, v: Math.hypot(vx, vy0) };
};

/** a bar's bottom-centre (x, y) at frame f, and its state */
export const barAt = (b: Bar, f: number): { x: number; y: number; state: "wait" | "move" | "rest" } => {
  if (f < b.t0) return { x: X_IN, y: BAR_Y0, state: "wait" };
  if (f >= b.t1) return { x: b.slot.x, y: b.slot.y, state: "rest" };
  const s = (f - b.t0) * b.v;
  if (s < b.L1) return { x: X_IN + s, y: BAR_Y0, state: "move" };
  if (s < b.L1 + b.Lb) {
    const a = (s - b.L1) / BEND_R;
    return { x: X_B + BEND_R * Math.sin(a), y: BAR_Y0 + BEND_R * (1 - Math.cos(a)), state: "move" };
  }
  const t = f - b.tl;
  return { x: b.P[0] + b.vx * t, y: b.P[1] + b.vy0 * t - 0.5 * G * t * t, state: "move" };
};
/** a bar's velocity (m per frame) at frame f */
export const barVel = (b: Bar, f: number): [number, number] => {
  if (f < b.t0 || f >= b.t1) return [0, 0];
  const s = (f - b.t0) * b.v;
  if (s < b.L1) return [b.v, 0];
  if (s < b.L1 + b.Lb) {
    const a = (s - b.L1) / BEND_R;
    return [b.v * Math.cos(a), b.v * Math.sin(a)];
  }
  return [b.vx, b.vy0 - G * (f - b.tl)];
};

// --- collision: every bar is the same upright trapezoid (its cast profile); separating-axis test --------------------
const { W, H, insetX: IX } = INGOT;
const nl = Math.hypot(H, IX);
const AX_TRAP: [number, number][] = [
  [0, 1],
  [H / nl, IX / nl],
  [-H / nl, IX / nl],
];
const AX_BOX: [number, number][] = [...AX_TRAP, [1, 0]];
const trapPts = (x: number, y: number): [number, number][] => [
  [x - W / 2, y],
  [x + W / 2, y],
  [x + W / 2 - IX, y + H],
  [x - W / 2 + IX, y + H],
];
type Box = { x0: number; x1: number; y0: number; y1: number };
const boxPts = (b: Box): [number, number][] => [
  [b.x0, b.y0],
  [b.x1, b.y0],
  [b.x1, b.y1],
  [b.x0, b.y1],
];
/** the largest gap between two convex shapes along the given axes (> 0: apart) */
const sepOf = (A: [number, number][], B: [number, number][], axes: [number, number][]) => {
  let best = -1e9;
  for (const [ax, ay] of axes) {
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
    for (const [x, y] of A) {
      const d = x * ax + y * ay;
      if (d < a0) a0 = d;
      if (d > a1) a1 = d;
    }
    for (const [x, y] of B) {
      const d = x * ax + y * ay;
      if (d < b0) b0 = d;
      if (d > b1) b1 = d;
    }
    best = Math.max(best, b0 - a1, a0 - b1);
  }
  return best;
};
/** the gap between two bars at bottom-centres (ax, ay) and (bx, by) */
export const barGap = (ax: number, ay: number, bx: number, by: number) => {
  if (Math.abs(ax - bx) > W + 0.2 || Math.abs(ay - by) > H + 0.2) return 1;
  return sepOf(trapPts(ax, ay), trapPts(bx, by), AX_TRAP);
};
/** the chip and plinth as obstacles once a bar is out of the slot */
const OBST: Box[] = [
  { x0: -PLINTH.w / 2, x1: PLINTH.w / 2, y0: 0, y1: PLINTH.h },
  { x0: -PKG.w / 2, x1: PKG.w / 2, y0: PKG.y0, y1: PKG_TOP },
];
export const obstGap = (x: number, y: number) => Math.min(...OBST.map((o) => sepOf(trapPts(x, y), boxPts(o), AX_BOX)));

// --- the scheduler -------------------------------------------------------------------------------------------------
const SAMPLES = 8;
/** clearances: a moving bar keeps this far from every other bar and from the chip; resting bars touch at 0 */
const MOVE_MARGIN = 0.03;
const REST_MARGIN = 0.004;
const MAX_BARS = 70;
/** a bar may land this many frames after the bars it rests on */
const SUPPORT_GAP = 0.3;
/** how many slots ahead of the fill order the scheduler may take */
const LOOKAHEAD = 3;
const supportsOf = (s: Slot) => SLOTS.filter((o) => o.lane === s.lane && o.layer === s.layer - 1 && Math.abs(o.x - s.x) < PITCH);
const makeBar = (idx: number, k: number, slot: Slot, emerge: number, tau: number): Bar | null => {
  const t = tossOf([slot.x, slot.y], tau);
  if (!t) return null;
  const L1 = X_B - X_IN;
  const Lb = BEND_R * t.phi;
  const t0 = emerge - (PKG.w / 2 - (X_IN + INGOT.W / 2)) / t.v;
  const tl = t0 + (L1 + Lb) / t.v;
  return { idx, lane: slot.lane, burst: k, slot, t0, emerge, tl, t1: tl + tau, v: t.v, phi: t.phi, P: t.P, vx: t.vx, vy0: t.vy0, tau, L1, Lb };
};
const clearOf = (cand: Bar, bars: Bar[]) => {
  for (let tt = Math.floor(cand.t0 * SAMPLES) / SAMPLES; tt < cand.t1; tt += 1 / SAMPLES) {
    const p = barAt(cand, tt);
    if (p.state !== "move") continue;
    if (p.x >= X_B - 1e-6 && obstGap(p.x, p.y) < 0.02) return false;
    for (const o of bars) {
      if (tt < o.t0 || o.lane !== cand.lane) continue;
      const q = barAt(o, tt);
      if (barGap(p.x, p.y, q.x, q.y) < (q.state === "rest" ? REST_MARGIN : MOVE_MARGIN)) return false;
    }
  }
  // its resting place is clear of bars still in the air when it lands (and after)
  for (const o of bars) {
    if (o.t1 <= cand.t1 || o.lane !== cand.lane) continue;
    for (let tt = cand.t1; tt < o.t1; tt += 1 / SAMPLES) {
      const q = barAt(o, tt);
      if (barGap(cand.slot.x, cand.slot.y, q.x, q.y) < MOVE_MARGIN) return false;
    }
  }
  return true;
};
/** every arc reads as an arc: it tops out at least RISE and at most LOB above the higher of its launch point and the
 *  top of its place (RISE per metre of throw, so the long throws arc the most) */
const RISE = 0; // per metre of throw
const LOB = 3.5;
/** every (later start, flight time) pair, in the order of the landing it would give: the first clear one wins */
const TRIES: [number, number][] = [];
for (let de = 0; de < 64; de++) for (let tau = 6; tau <= 44; tau += 0.5) TRIES.push([de * 0.25, tau]);
TRIES.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[1] - b[1]);
const tryBar = (bars: Bar[], slot: Slot, k: number, emerge0: number): Bar | null => {
  const sup = supportsOf(slot).map((s) => bars.find((b) => b.slot === s));
  if (sup.some((b) => !b)) return null;
  const need = Math.max(-1e9, ...sup.map((o) => (o as Bar).t1 + SUPPORT_GAP));
  for (const [de, tau] of TRIES) {
    const cand = makeBar(bars.length, k, slot, emerge0 + de, tau);
    if (!cand) continue;
    if (cand.t1 < need || cand.v > VMAX || cand.v < VMIN || cand.vy0 < 0.025) continue;
    // and it comes down no faster than it went out (so no bar outruns the eye on its way in)
    if (Math.hypot(cand.vx, cand.vy0 - G * cand.tau) > VLAND) continue;
    const apex = cand.P[1] + cand.vy0 ** 2 / (2 * G);
    const top = Math.max(cand.P[1], slot.y + INGOT.H);
    if (apex > top + LOB || (RISE > 0 && apex < top + RISE * (slot.x - cand.P[0]))) continue;
    if (clearOf(cand, bars)) return cand;
  }
  return null;
};
/** the slots a bar may take next: per layer the next one leftward, once the one to its right and its supports are down
 *  (or on their way) */
const frontier = (placed: Set<Slot>, lane: number) => {
  const out: Slot[] = [];
  for (let y = 0; y < NB; y++) {
    const s = SLOTS.filter((o) => o.lane === lane && o.layer === y && !placed.has(o)).sort((a, b) => a.j - b.j)[0];
    if (!s) continue;
    const right = SLOTS.find((o) => o.lane === lane && o.layer === y && o.j === s.j - 1);
    if (right && !placed.has(right)) continue;
    if (supportsOf(s).some((o) => !placed.has(o))) continue;
    out.push(s);
  }
  return out.sort((a, b) => SLOTS.indexOf(a) - SLOTS.indexOf(b));
};
/** The output per pulse: pulse k sends COUNT[k] bars, GAPF[k] frames apart, the first once the light has crossed the
 *  die; a pulse's bars queue behind the last one's, so from pulse 4 the outlet pours without a break. */
const COUNT = [0, 1, 3, 6, 10, 14, 16, 16, 16];
const GAPF = [0, 0, 4.0, 2.4, 1.8, 1.4, 1.3, 1.3, 1.3];
/** how soon a bar goes, plus a share of the time it holds its outlet (a slow bar blocks its lane), so the two slow
 *  near-chip foot bars never clog both outlets at once */
const OCC_W = 0.5;
const score = (b: Bar) => b.emerge + OCC_W * (b.tl - b.emerge);
const buildSchedule = (): Bar[] => {
  const bars: Bar[] = [];
  const placed = new Set<Slot>();
  let lastEmerge = -1e9;
  let lastLane = 1;
  for (let k = 1; k < COUNT.length && bars.length < MAX_BARS; k++) {
    for (let j = 0; j < COUNT[k] && bars.length < MAX_BARS; j++) {
      const emerge0 = Math.max(contactFrame(k) + CROSS.frames + 0.5, lastEmerge + GAPF[k]);
      if (emerge0 > DURATION + 2) return bars;
      let best: Bar | null = null;
      // the lanes take turns unless the other one can go clearly sooner
      for (const lane of [1 - lastLane, lastLane]) {
        for (const c of frontier(placed, lane).slice(0, LOOKAHEAD)) {
          const b = tryBar(bars, c, k, emerge0);
          if (b && (!best || score(b) < score(best) - 0.6)) best = b;
        }
      }
      if (!best) return bars;
      bars.push(best);
      placed.add(best.slot);
      lastEmerge = best.emerge;
      lastLane = best.lane;
    }
  }
  return bars;
};
export const BARS: Bar[] = buildSchedule();
/** the bars that start moving inside the cut */
export const BARS_IN_CUT = BARS.filter((b) => b.t0 < DURATION + 1);
export const landedBy = (f: number) => BARS.filter((b) => b.t1 <= f).length;

// --- the camera ------------------------------------------------------------------------------------------------
/** A look: the world point at the screen middle (x 540, row `row`), the distance to it, yaw / pitch, focal. */
export type Look = { tx: number; ty: number; tz: number; d: number; yaw: number; pitch: number; f: number; row: number };
const D2R = Math.PI / 180;
export const camOfLook = (l: Look) => {
  const fx = Math.sin(l.yaw * D2R) * Math.cos(l.pitch * D2R);
  const fy = -Math.sin(l.pitch * D2R);
  const fz = Math.cos(l.yaw * D2R) * Math.cos(l.pitch * D2R);
  return { mode: "side" as const, x: l.tx - fx * l.d, y: l.ty - fy * l.d, z: l.tz - fz * l.d, f: l.f, horizon: l.row, yaw: l.yaw, pitch: l.pitch, near: 0.8 };
};
/** beyond the pile looking down back up the throw: chip and pole small at the upper left, the pile big and close in
 *  the lower middle; one slow eased drift (a slight pull back and orbit) over the whole cut. */
export const LOOK_START: Look = { tx: 4.1, ty: 0.55, tz: 0, d: 8.85, yaw: -52.5, pitch: 37, f: 1450, row: 1080 };
/** ONE slow drift, eased over the whole cut (it starts before f0 and is still easing at the end), no other moves */
export const LOOK_KEYS: { f0: number; f1: number; to: Partial<Look> }[] = [
  { f0: -10, f1: 96, to: { tx: 4.3, ty: 0.5, d: 8.95, yaw: -55, pitch: 38, row: 1105 } },
];
const camEaseLocal = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
/** the look at frame f before the follower (superposed eased glides per field) */
export const lookTarget = (f: number): Look => {
  const o: Record<string, number> = { ...(LOOK_START as unknown as Record<string, number>) };
  const prev: Record<string, number> = { ...o };
  for (const g of LOOK_KEYS) {
    const e = camEaseLocal((f - g.f0) / (g.f1 - g.f0));
    for (const [k, v] of Object.entries(g.to)) {
      const isLog = k === "d" || k === "f";
      const a = isLog ? Math.log(prev[k]) : prev[k];
      const b = isLog ? Math.log(v as number) : (v as number);
      const cur = isLog ? Math.log(o[k]) : o[k];
      const nv = cur + (b - a) * e;
      o[k] = isLog ? Math.exp(nv) : nv;
      prev[k] = v as number;
    }
  }
  return o as unknown as Look;
};
/** the damped follower over the look fields (house stiffness / damping), pre-rolled so f0 is already moving */
const STIFF = 0.145;
const DAMP = 0.59;
const PRE = 24;
const FIELDS = ["tx", "ty", "tz", "d", "yaw", "pitch", "f", "row"] as const;
const LOOKS: Look[] = (() => {
  const out: Look[] = [];
  const c: Record<string, number> = { ...(lookTarget(-PRE) as unknown as Record<string, number>) };
  const vel: Record<string, number> = {};
  for (const k of FIELDS) vel[k] = 0;
  for (let f = -PRE; f <= DURATION + 2; f++) {
    const T = lookTarget(f) as unknown as Record<string, number>;
    for (const k of FIELDS) {
      const isLog = k === "d" || k === "f";
      const tv = isLog ? Math.log(T[k]) : T[k];
      const cv = isLog ? Math.log(c[k]) : c[k];
      vel[k] = vel[k] + (tv - cv) * STIFF - vel[k] * DAMP;
      const nv = cv + vel[k];
      c[k] = isLog ? Math.exp(nv) : nv;
    }
    if (f >= 0) out.push({ ...(c as unknown as Look) });
  }
  return out;
})();
export const lookAt = (f: number): Look => {
  const a = Math.max(0, Math.min(LOOKS.length - 2, Math.floor(f)));
  const t = clamp01(f - a);
  const A = LOOKS[a] as unknown as Record<string, number>;
  const B = LOOKS[a + 1] as unknown as Record<string, number>;
  const o: Record<string, number> = {};
  for (const k of FIELDS) o[k] = lerp(A[k], B[k], t);
  return o as unknown as Look;
};
export const camAt = (f: number) => camOfLook(lookAt(f));
export const CAM_REST = camOfLook(lookAt(0));

// --- the "1 W" cable flag (world space: a card wrapped round the cable 5 m before the plug, standing out to the right;
// enters on "watt", landing f47) ----------------------------------------------------------------------------------
export const TAG = { s: CABLE_LEN - 5, w: 1.7, h: 0.95, cap: 0.5, in: 39, enterF: 8 } as const;
