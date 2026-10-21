// ---------------------------------------------------------------------------
// extractNotCreatePlan: the world, the camera and every timeline of ExtractNotCreate (kyle-rome-slavery, cut 48),
// kept free of React so a script can plot and check them (the heap's plateau vs the village's compounding).
//
// THE WORLD (londonDepth's model): 3D units = the cast's units (a man ~310). X across, Y height (the floor Y = 0,
// up is - Y), Z depth behind the front plane (Z = 0 is the master's couch). One camera, one-point perspective: the
// eye on the centre line, eyeY above the floor (a raised eye looking down over the estate), a zoom that is half dolly.
// Layout (plan view, X / Z):
//   the master's couch      X -560..-220, Z 0 (head end left, he faces right)
//   the heap                centre (-60, 120); grows to H_END tall, W = 0.95 H + 12 half-width
//   the villa               X -1400..0, front face Z 480 (its door behind the heap, X -265..-145)
//   the terrace (flags)     Z < 480 (X < 0) / Z < 340 (X > 0); a kerb along Z 340
//   the field (furrows)     beyond the terrace; the stream along Z ~900; the meadow of the alternative beyond
//   the carrying line       ONE path: in from the right edge across the field, along the heap's right flank (the
//                           pour), round behind the heap and in at the villa door; every slave on it (a conveyor)
//   the overseer            (760, 600), behind the line, facing it
//   the mill (dashed)       X 700..980, Z 950..1200, its wheel on the front face over the stream
//   the village (dashed)    houses on a grid round the mill, born in order of distance, at an exponential rate
// ---------------------------------------------------------------------------
import type { DepthOpts } from "../kyle-london/londonDepth";

export type P2 = [number, number];
export type P3 = [number, number, number];
export type Cam = { k: number; cx: number; cy: number };

export const FPS = 30000 / 1001;
export const DURATION = 186;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
export const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// THE CAMERA: k (zoom of the front plane), cx (the eye's x = the VP's x), fy (the screen y of the floor at Z = 0)
// ---------------------------------------------------------------------------
export const DEPTH: DepthOpts = { eyeY: -390, dRef: 1500, kRef: 0.7, dolly: 0.5 };
export const K0 = 1.35;
export const K1 = 0.9;
export const CX0 = -290;
export const CX1 = 0;
export const FY0 = 1090;
export const FY1 = 1140;
/** the move's velocity: a slow drift from f0, one lobe that rises f24 -> f60 and then decays slowly to the end (a creep
 *  remains on the last frame). Integrated numerically and normalised so the progress reaches 1 at the last frame. */
const vel = (f: number, lag: number) => {
  const g = f - lag;
  const rise = g < 24 ? 0 : g < 60 ? 0.5 - 0.5 * Math.cos((Math.PI * (g - 24)) / 36) : Math.exp(-(g - 60) / 46);
  return 0.06 + rise;
};
const progressTable = (lag: number) => {
  const N = DURATION * 4;
  const out: number[] = [0];
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    const f = (i - 0.5) / 4;
    acc += vel(f, lag) / 4;
    out.push(acc);
  }
  return out.map((v) => v / acc);
};
const PK = progressTable(0);
const PX = progressTable(5);
const prog = (tab: number[], f: number) => {
  const x = Math.max(0, Math.min(DURATION, f)) * 4;
  const i = Math.min(tab.length - 2, Math.floor(x));
  return mix(tab[i], tab[i + 1], x - i);
};
export const camBaseAt = (f: number): Cam => {
  const uK = prog(PK, f * ((DURATION - 1) / DURATION) + 0);
  const uX = prog(PX, f);
  const k = Math.exp(mix(Math.log(K0), Math.log(K1), uK));
  const cx = mix(CX0, CX1, uX);
  const fy = mix(FY0, FY1, uK);
  return { k, cx, cy: -(fy - 960) / k };
};
/** the house hand on the camera (screen px), as incaShared's sway */
export const camAt = (f: number): Cam => {
  const c = camBaseAt(f);
  const dx = 3 * Math.sin(f / 23);
  const dy = 5 * Math.sin(f / 19);
  return { k: c.k, cx: c.cx + dx / c.k, cy: c.cy + dy / c.k };
};

// ---------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------
export const COUCH_X = -390;
export const COUCH_Z = 0;
export const HEAP_C: P2 = [-250, 170];
export const H_END = 230;
export const heapH = (a: number) => H_END * Math.cbrt(c01(a));
export const heapW = (H: number) => 0.8 * H + 10;
export const VILLA = { x0: -1400, x1: 0, z0: 480, z1: 820, h: 400, ridge: 540, door: { x0: -268, x1: -142, h: 322 } };
export const TERRACE_EDGE = 340;
/** the mill's leat: a channel of water along the hillside at this depth (on the hill's surface) */
export const STREAM_Z = 1830;
/** the master's terrace is a podium: its front wall at PODIUM_Z drops PODIUM_H to the lower ground */
export const PODIUM_Z = -200;
export const PODIUM_H = 300;
export const OVERSEER: P2 = [215, 30];

// ---------------------------------------------------------------------------
// THE CARRYING LINE: one path (a centripetal Catmull-Rom through these points, resampled by arc length)
// ---------------------------------------------------------------------------
const CTRL: P2[] = [
  [2000, 1420],
  [1600, 1330],
  [1150, 1060],
  [720, 700],
  [330, 365],
  [110, 215],
  [30, 196],
  [-20, 236],
  [-50, 330],
  [-130, 400],
  [-195, 440],
  [-205, 500],
  [-206, 600],
];
const catmull = (pts: P2[], per = 24): P2[] => {
  const out: P2[] = [];
  const P = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const d = (a: P2, b: P2) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, 0.5);
    const t0 = 0;
    const t1 = t0 + d(p0, p1);
    const t2 = t1 + d(p1, p2);
    const t3 = t2 + d(p2, p3);
    for (let j = 0; j < per; j++) {
      const t = mix(t1, t2, j / per);
      const L = (a: P2, b: P2, ta: number, tb: number): P2 => {
        const u = tb - ta < 1e-9 ? 0 : (t - ta) / (tb - ta);
        return [mix(a[0], b[0], u), mix(a[1], b[1], u)];
      };
      const A1 = L(p0, p1, t0, t1);
      const A2 = L(p1, p2, t1, t2);
      const A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2);
      const B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
const PATH_PTS = catmull(CTRL);
const PATH_S: number[] = (() => {
  const s = [0];
  for (let i = 1; i < PATH_PTS.length; i++) s.push(s[i - 1] + Math.hypot(PATH_PTS[i][0] - PATH_PTS[i - 1][0], PATH_PTS[i][1] - PATH_PTS[i - 1][1]));
  return s;
})();
export const PATH_LEN = PATH_S[PATH_S.length - 1];
/** the point (X, Z) and unit direction at arc length s (clamped) */
export const pathAt = (s0: number): { X: number; Z: number; dx: number; dz: number } => {
  const s = Math.max(0, Math.min(PATH_LEN - 1e-6, s0));
  let lo = 0;
  let hi = PATH_S.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (PATH_S[m] <= s) lo = m;
    else hi = m;
  }
  const u = (s - PATH_S[lo]) / (PATH_S[hi] - PATH_S[lo] || 1);
  const a = PATH_PTS[lo];
  const b = PATH_PTS[hi];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { X: mix(a[0], b[0], u), Z: mix(a[1], b[1], u), dx: (b[0] - a[0]) / L, dz: (b[1] - a[1]) / L };
};
const sNearest = (p: P2) => {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < PATH_PTS.length; i++) {
    const d = Math.hypot(PATH_PTS[i][0] - p[0], PATH_PTS[i][1] - p[1]);
    if (d < bd) {
      bd = d;
      best = PATH_S[i];
    }
  }
  return best;
};
/** the pour: the sack comes off the shoulder over HEAVE units, pours over POUR units (the slave walks on) */
export const S_POUR = sNearest([30, 196]);
export const HEAVE = 38;
export const POUR = 62;
/** where the walker goes in at the villa door (he is behind the door's plane from here) */
export const S_DOOR = sNearest([-205, 500]);
/** the spacing of the line along the path */
export const SPACING = 230;

/** the line's speed (units / frame): a steady walk, then driven harder after the rod comes down at f124 */
export const ROD_HIT_1 = 124;
export const ROD_HIT_2 = 178;
export const lineSpeed = (f: number) => 5.6 + 2.0 * smooth((f - ROD_HIT_1) / 16) + 0.5 * smooth((f - ROD_HIT_2) / 8);
/** D(f): how far the line has moved since f0 (integral of lineSpeed; linear before f0) */
const D_TAB: number[] = (() => {
  const out = [0];
  let acc = 0;
  for (let i = 1; i <= (DURATION + 40) * 4; i++) {
    acc += lineSpeed((i - 0.5) / 4) / 4;
    out.push(acc);
  }
  return out;
})();
export const lineD = (f: number) => {
  if (f <= 0) return f * lineSpeed(0);
  const x = f * 4;
  const i = Math.min(D_TAB.length - 2, Math.floor(x));
  return mix(D_TAB[i], D_TAB[i + 1], x - i);
};
/** slave j's path position at frame f (j = 0 is the one pouring at f0; j + 1 is the next one behind him) */
export const S_OFF = S_POUR + 10; // slave 0 is 10 units into his pour on f0
export const slaveS = (j: number, f: number) => S_OFF + lineD(f) - j * SPACING;
/** the frame slave j reaches path position s */
export const frameAtS = (j: number, s: number) => {
  const want = s - S_OFF + j * SPACING; // lineD(f) = want
  if (want <= 0) return want / lineSpeed(0);
  let lo = 0;
  let hi = DURATION + 40;
  for (let it = 0; it < 40; it++) {
    const m = (lo + hi) / 2;
    if (lineD(m) < want) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
/** the slaves that can be on the path in the cut */
export const SLAVE_J0 = -Math.ceil((PATH_LEN - S_OFF) / SPACING) - 1;
export const SLAVE_J1 = Math.ceil((S_OFF + lineD(DURATION)) / SPACING) + 1;
/** the slaves' tone sinks toward DEAD as they are driven harder (0 -> SINK_MAX) */
export const SINK_MAX = 0.5;
export const sinkAt = (f: number) => SINK_MAX * smooth((f - 96) / 84);

// ---------------------------------------------------------------------------
// THE HEAP: a target curve (fast rise, then a plateau), delivered pour by pour as coins
// ---------------------------------------------------------------------------
/** the share of the final heap's volume the target curve reaches at f */
export const heapTarget = (f: number) => (f >= 0 ? c01(1 - 0.742 * Math.exp(-f / 35.4)) : 0.258 * Math.exp(f / 50));
/** each pour runs over the frames its slave walks the POUR stretch; the coins leave the sack in order */
export type Pour = { j: number; t0: number; t1: number; a0: number; a1: number };
export const COIN_FLIGHT = 6;
export const POURS: Pour[] = (() => {
  const out: Pour[] = [];
  for (let j = -3; j <= SLAVE_J1; j++) {
    const t0 = frameAtS(j, S_POUR);
    const t1 = frameAtS(j, S_POUR + POUR * 0.8);
    out.push({ j, t0, t1, a0: 0, a1: 0 });
  }
  // pour j carries the heap from the target at the end of the previous pour to the target at the end of its own
  for (let i = 0; i < out.length; i++) {
    out[i].a0 = i === 0 ? heapTarget(out[0].t0) : out[i - 1].a1;
    out[i].a1 = Math.max(out[i].a0, heapTarget(out[i].t1 + COIN_FLIGHT));
  }
  return out;
})();
/** the coins: N in all; coin i lands when the heap's amount reaches (i + 0.5) / N */
export const COIN_N = 760;
/** the frame coin i leaves the sack (or -inf when it was on the heap before the cut) */
export const coinLeave = (i: number) => {
  const v = (i + 0.5) / COIN_N;
  if (v < POURS[0].a0) return -Infinity;
  for (const p of POURS) {
    if (v >= p.a0 && v < p.a1) return mix(p.t0, p.t1, (v - p.a0) / (p.a1 - p.a0));
  }
  return Infinity;
};
export const COIN_LEAVE: number[] = Array.from({ length: COIN_N }, (_, i) => coinLeave(i));
/** the slave whose sack coin i leaves (null: on the heap before the cut) */
export const COIN_POUR: (number | null)[] = Array.from({ length: COIN_N }, (_, i) => {
  const v = (i + 0.5) / COIN_N;
  const p = POURS.find((q) => v >= q.a0 && v < q.a1);
  return p ? p.j : null;
});
/** the heap's amount (share of the final volume) on frame f: the coins that have landed, plus the one landing */
export const heapAmount = (f: number) => {
  let n = 0;
  for (let i = 0; i < COIN_N; i++) {
    const land = COIN_LEAVE[i] + COIN_FLIGHT;
    if (land <= f) n = i + 1;
    else {
      n = i + c01(1 - (land - f));
      break;
    }
  }
  return n / COIN_N;
};

// ---------------------------------------------------------------------------
// THE OVERSEER'S ROD: t 0..1 (raiseRod); small lifts that keep the line moving, then two hard strokes
// ---------------------------------------------------------------------------
const bump = (f: number, up0: number, up1: number, dn0: number, dn1: number) => smooth((f - up0) / (up1 - up0)) * (1 - smooth((f - dn0) / (dn1 - dn0)));
export const rodAt = (f: number) =>
  Math.max(0.35 * bump(f, 30, 40, 46, 56), 0.4 * bump(f, 78, 88, 94, 104), bump(f, 108, 119, ROD_HIT_1 - 3, ROD_HIT_1 + 3), bump(f, 160, 172, ROD_HIT_2 - 3, ROD_HIT_2 + 3) * 1, 0.15);

// ---------------------------------------------------------------------------
// THE HILL behind the stream (real, dim): the floor rises from HILL_Z0 to its ridge at HILL_Z1
// ---------------------------------------------------------------------------
export const HILL_Z0 = 1420;
export const HILL_Z1 = 2650;
export const hillTop = (X: number) => 1500 + 130 * Math.sin(X / 700 + 0.6) + 60 * Math.sin(X / 310 + 1.3);
/** the hill's height (units, > 0 up) at (X, Z) */
export const hillH = (X: number, Z: number) => hillTop(X) * smooth((Z - HILL_Z0) / (HILL_Z1 - HILL_Z0));

// ---------------------------------------------------------------------------
// THE ALTERNATIVE (dashed orange): the mill on the stream, then a village born at an exponential rate, nearest
// the mill first, climbing the hill
// ---------------------------------------------------------------------------
const MILL_BASE = -hillH(570, 1870);
export const MILL = { x0: 420, x1: 720, z0: 1870, z1: 2100, y0: MILL_BASE, h: 360, ridge: 545, wheel: { X: 545, Y: MILL_BASE - 168, Z: STREAM_Z, R: 178, w: 50 }, door: { x0: 615, x1: 675, h: 190 } };
export const MILL_T0 = 44;
export const MILL_DUR = 30;
/** the wheel turns once it is whole (rad per frame, eased in); the undershot wheel turns with the stream (leftward
 *  at its foot: counter-clockwise on screen, i.e. a negative angle) */
export const wheelAngle = (f: number) => {
  const t0 = MILL_T0 + MILL_DUR * 0.45;
  const g = Math.max(0, f - t0);
  return -0.04 * (g - 12 * (1 - Math.exp(-g / 12)));
};
export type House = { X: number; Z: number; Y0: number; w: number; d: number; h: number; ridge: number; goods: boolean; t0: number; dur: number; seed: number };
/** the village's count grows as N(t) = A (exp((t - T0) / TAU) - 1): births at T0 + TAU ln(1 + n / A) */
export const VILLAGE_T0 = 80;
export const VILLAGE_TAU = 30;
export const VILLAGE_A = 0.75;
export const HOUSE_DUR = 18;
export const HOUSES: House[] = (() => {
  const cells: { X: number; Z: number; d: number; i: number }[] = [];
  let i = 0;
  const mc: P2 = [(MILL.x0 + MILL.x1) / 2, (MILL.z0 + MILL.z1) / 2];
  const endCam = camBaseAt(DURATION - 1);
  const Dc = DEPTH.dRef * Math.pow(DEPTH.kRef / endCam.k, DEPTH.dolly);
  const scr = (X: number, Y: number, Z: number): P2 => {
    const r = Dc / (Dc + Z);
    return [540 + endCam.k * (endCam.cx + (X - endCam.cx) * r - endCam.cx), 960 + endCam.k * (DEPTH.eyeY + (Y - DEPTH.eyeY) * r - endCam.cy)];
  };
  for (let gz = 0; gz < 6; gz++) {
    for (let gx = -5; gx < 7; gx++, i++) {
      const X = 160 + gx * 380 + (gz % 2) * 190 + (hash(i, 3) - 0.5) * 60;
      const Z = 2060 + gz * 245 + (hash(i, 5) - 0.5) * 40;
      // keep clear of the VP band (a house there would change its seen side during the pan) and of the mill's plot
      if (X - 165 < 30 && X + 165 > -330) continue;
      if (X > 250 && X < 900 && Z < 2290) continue;
      // in the end frame: not cut by the frame's top or sides
      const top = scr(X, -hillH(X, Z) - 330, Z);
      if (top[1] < 235 || top[0] < 40 || top[0] > 1040) continue;
      cells.push({ X, Z, d: Math.hypot((X - mc[0]) * 0.8, Z - mc[1]), i });
    }
  }
  cells.sort((a, b) => a.d - b.d);
  return cells.slice(0, 40).map((c, n) => {
    const w = 260 + 60 * hash(c.i, 7);
    const d = 230 + 50 * hash(c.i, 11);
    const h = 200 + 70 * hash(c.i, 9);
    return {
      X: c.X,
      Z: c.Z,
      Y0: -hillH(c.X, c.Z - d / 2),
      w,
      d,
      h,
      ridge: h + 85 + 30 * hash(c.i, 13),
      goods: hash(c.i, 15) > 0.3,
      t0: VILLAGE_T0 + VILLAGE_TAU * Math.log(1 + n / VILLAGE_A),
      dur: HOUSE_DUR,
      seed: c.i,
    };
  });
})();
/** the village's "built" share (0..): the mill counts 3 houses; a house counts while its outline draws */
export const villageBuilt = (f: number) => {
  let b = 3 * c01((f - MILL_T0) / MILL_DUR);
  for (const h of HOUSES) b += c01((f - h.t0) / h.dur) * (h.goods ? 1.15 : 1);
  return b;
};
