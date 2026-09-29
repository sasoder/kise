// ReuniteTheWholeThing: the front's roll, the army band and the authored
// camera. Pure maths, no React, so the check scripts read the exact same motion
// the component draws. See ReuniteTheWholeThing.tsx's header.
//
// EXPORTS FOR THE NEXT CUT (ChineseAreIn):
//   FARTHEST_ADVANCE   the UN's composite high-water line, FRONT_N points
//   END_U, unFrontAt(u) the front at u of the way 19 Oct -> FARTHEST_ADVANCE
//                      (this cut ends at END_U = 0.92; u -> 1 is the "touch")
//   END_DUDF           du/df on the last frame (to carry the inching on)
//   END_CAM            this cut's last camera (== NORTH_FRAME)
//   unDotsAt(f, k)     the army's dots (world px) at frame f
import type { LonLat } from "./korea1950Fronts";
import { FRONT_19OCT, FRONT_30SEP, UN_GROUND_LATE_NOV_1950, resample } from "./korea1950Fronts";
import { type Cam, type P2, MEN_PER_DOT, NORTH_FRAME, armySlots, dotScreen, hash, landAt, makeTrack, pchip, projectLine } from "./koreaShared";

export const FPS = 24;
// In 37.420 s; speech 4.379 s -> round(4.379 x 24) = 105, + the 16-frame tail.
export const DURATION = 121;
export const LAST = DURATION - 1;

// ---------------------------------------------------------------------------
// FARTHEST_ADVANCE: the UN's composite high-water line, Oct-Nov 1950 (the
// "farthest advance" line of Appleman, "South to the Naktong, North to the
// Yalu", map at the end of ch. XXXII / the UN advance to the Yalu, and Mossman,
// "Ebb and Flow", map 1; West Point Atlas vol. II, Korea map 9). Each stretch
// is the farthest point reached there on any date, so it is NOT one day's
// front. Approximate to ~0.1 deg, traced by hand. West -> east:
//   sea stub off the Yalu mouth; ~30 km short of Sinuiju (US 24th Div's 21st
//   Inf at Chonggo-dong, 1 Nov) past Chongju / Sonchon; up to the Yalu at
//   Chosan (ROK 6th Div's 7th Regt, 26 Oct); back down past Onjong / Huichon;
//   round the Chosin reservoir (1st Marine Div at Yudam-ni, 27 Nov); up to the
//   Yalu at Hyesan (US 7th Div's 17th Inf, 21 Nov); east past Hapsu and out
//   to the NE coast past Chongjin (ROK Capital Div, 25 Nov); sea stub.
// The Sinuiju corner (the Yalu mouth) stays north of the line.
// ---------------------------------------------------------------------------
export const FARTHEST_ADVANCE_RAW: LonLat[] = [
  [124.15, 39.8],
  [124.45, 39.92],
  [124.75, 40.12],
  [125.05, 40.1],
  [125.3, 40.2],
  [125.55, 40.45],
  [125.75, 40.78],
  [125.82, 40.84], // Chosan, on the Yalu
  [125.9, 40.72],
  [126.05, 40.45],
  [126.3, 40.25],
  [126.7, 40.2],
  [127.0, 40.35],
  [127.1, 40.5], // Yudam-ni, west of the Chosin reservoir
  [127.25, 40.55],
  [127.45, 40.7],
  [127.7, 41.0],
  [127.95, 41.25],
  [128.18, 41.385], // Hyesan, on the Yalu
  [128.35, 41.3],
  [128.7, 41.35],
  [129.1, 41.55],
  [129.5, 41.8], // past Chongjin
  [129.9, 42.0],
  [130.5, 42.0],
];
/** resampled west -> east to FRONT_N points by arclength, like the shared fronts */
export const FARTHEST_ADVANCE: LonLat[] = resample(FARTHEST_ADVANCE_RAW);

// ---------------------------------------------------------------------------
// THE MORPH. Every front is re-read on ONE longitude grid (0.04 deg, plus every
// FARTHEST_ADVANCE vertex so the Chosan and Hyesan tips are exact), and each
// grid point moves only in latitude: every point only ever moves NORTH (the
// keys are checked lat_30Sep <= lat_19Oct <= lat_FA at every point).
//   s 0 -> 1: 30 Sep -> 19 Oct, a per-point cubic (Hermite) leaving 30 Sep at
//             the straight-line rate and arriving at 19 Oct with the rate of
//             the next leg (clamped to keep it monotone), so no point kinks
//   s 1 -> 2: 19 Oct -> FARTHEST_ADVANCE, linear per point: u = s - 1
// ---------------------------------------------------------------------------
const GRID_LON: number[] = (() => {
  const lo = 124.15;
  const hi = 130.5;
  const g: number[] = [];
  for (let x = lo; x <= hi + 1e-9; x += 0.04) g.push(+x.toFixed(4));
  FARTHEST_ADVANCE_RAW.forEach(([lon]) => g.push(lon));
  g.sort((a, b) => a - b);
  return g.filter((v, i) => i === 0 || v - g[i - 1] > 0.004);
})();
const latAtLon = (line: LonLat[], lon: number) => {
  if (lon <= line[0][0]) return line[0][1];
  if (lon >= line[line.length - 1][0]) return line[line.length - 1][1];
  for (let i = 1; i < line.length; i++) {
    const [a0, a1] = line[i - 1];
    const [b0, b1] = line[i];
    if (lon >= a0 && lon <= b0 && b0 > a0) return a1 + ((b1 - a1) * (lon - a0)) / (b0 - a0);
  }
  return line[line.length - 1][1];
};
const LAT0 = GRID_LON.map((lon) => latAtLon(FRONT_30SEP, lon));
const LAT1 = GRID_LON.map((lon) => latAtLon(FRONT_19OCT, lon));
const LAT2 = GRID_LON.map((lon) => latAtLon(FARTHEST_ADVANCE_RAW, lon));
(() => {
  GRID_LON.forEach((lon, i) => {
    if (!(LAT0[i] <= LAT1[i] + 1e-9 && LAT1[i] <= LAT2[i] + 1e-9))
      throw new Error(`reuniteMotion: the fronts are not ordered south -> north at lon ${lon}`);
  });
})();
const D1 = LAT0.map((v, i) => LAT1[i] - v);
const D2 = LAT1.map((v, i) => LAT2[i] - v);
const M1 = D2.map((d, i) => Math.min(d, 3 * D1[i]));

export const FRONT_GRID_N = GRID_LON.length;
/** the front at s in [0, 2] on the longitude grid (lon/lat, west -> east) */
export const unFrontAtS = (s: number): LonLat[] => {
  const c = Math.max(0, Math.min(2, s));
  if (c >= 1) {
    const u = c - 1;
    return GRID_LON.map((lon, i) => [lon, LAT1[i] + u * D2[i]]);
  }
  const t = c;
  const t2 = t * t;
  const t3 = t2 * t;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return GRID_LON.map((lon, i) => [lon, LAT0[i] + h10 * D1[i] + h01 * D1[i] + h11 * M1[i]]);
};
/** the front u of the way from 19 Oct to FARTHEST_ADVANCE (linear per point, only north) */
export const unFrontAt = (u: number): LonLat[] => unFrontAtS(1 + Math.max(0, Math.min(1, u)));
export const END_U = 0.92;

// s(f): a monotone cubic through keys. It leaves 30 Sep just before "we're"
// (f30), crosses the 38th across the width f~26-48, reaches 19 Oct f58
// ("thing"), races north toward the river f58-80 and inches on, landing on
// 1 + END_U on the last frame with a small velocity left (the key past the
// end), so the front is still moving on f120.
const S_KEYS: [number, number][] = [
  [0, 0],
  [20, 0.004],
  [34, 0.085],
  [42, 0.22],
  [50, 0.42],
  [58, 1.0],
  [66, 1.45],
  [74, 1.72],
  [84, 1.84],
  [98, 1.895],
  [LAST, 1 + END_U],
  [150, 1 + END_U + 0.035],
];
const S_OF = pchip(S_KEYS);
export const frontS = (f: number) => S_OF(f);
export const frontAtFrame = (f: number): LonLat[] => unFrontAtS(frontS(f));
/** du/df on the last frame: the next cut carries the inching on from here */
export const END_DUDF = (S_OF(LAST + 0.5) - S_OF(LAST - 0.5)) / 1;

// ---------------------------------------------------------------------------
// THE CAMERA: one authored track, every channel the integral of overlapping
// cosine-tapered velocity bumps (C1 end to end, no plateau), normalised so the
// LAST frame is exactly NORTH_FRAME (the state ChineseAreIn opens on).
//   OPEN   k ~2.09 on the middle of the peninsula, the 38th on y ~845,
//          creeping in (k +4 %) f-16..40
//   TRAVEL north with the front f34-86 (cy -270 world px, cx +37), pulling back
//          a little (k -> ~1.81 by f62) so the whole north is in shot, then
//          easing back in (f58-86): landed ~f86, 6 f before "possible" (f92)
//   CREEP  f80 -> past the end: k +3 %, a few world px north; still moving on
//          the last frame, which is NORTH_FRAME
// ---------------------------------------------------------------------------
const K_END = NORTH_FRAME.k;
const LNK_RAW = makeTrack(
  [
    [-16, 40, Math.log(1.04), 1],
    [32, 66, Math.log(1.79 / 2.15), 1],
    [58, 88, Math.log(1.89 / 1.79), 1],
    [80, 160, Math.log(1.03), 1],
  ],
  0,
);
const CY_RAW = makeTrack(
  [
    [34, 86, -266, 1],
    [80, 160, -8, 1],
  ],
  0,
);
const CX_RAW = makeTrack(
  [
    [34, 86, 34, 1],
    [80, 160, 3, 1],
  ],
  0,
);
export const camAt = (f: number): Cam => ({
  k: Math.exp(Math.log(K_END) + LNK_RAW(f) - LNK_RAW(LAST)),
  cx: NORTH_FRAME.cx + CX_RAW(f) - CX_RAW(LAST),
  cy: NORTH_FRAME.cy + CY_RAW(f) - CY_RAW(LAST),
});
export const END_CAM: Cam = camAt(LAST);

// ---------------------------------------------------------------------------
// THE ARMY: UN Command ground forces, 423,313 (Mossman, 23 Nov 1950) / 3,000
// = 141 dots, as ONE even band of constant depth hugging the front.
//   spacing  SPACING x the dot diameter (dotScreen(k) / k world px)
//   gap      BAND_GAP world px between the front and the band
//   depth    solved per frame from the land length L of the front, so the 141
//            dots fit at that spacing: D = 0.866 s (N s / L - 1) (hex rows),
//            so the band is deep on the short 30 Sep line and thins to ~2 rows
//            along the long northern line
// It is simulated once (deterministic): each frame the dots are carried with
// the front (x stretched with the front's land extent, y moved with the
// softened front at that x), then relaxed: pairwise spacing, the band's two
// edges (measured to the real front line), and land. The trajectories are then
// gaussian-smoothed in time (sigma 1.5 f). A static pre-roll (f-40..0) settles
// the opening crowd, so f0 is already even.
// ---------------------------------------------------------------------------
export const ARMY_COUNT = Math.round(UN_GROUND_LATE_NOV_1950 / MEN_PER_DOT); // 141
export const ARMY_SEED = 4;
export const SPACING = 1.3; // centre spacing, dot diameters
export const BAND_GAP = 5; // world px
const SIM_F0 = -40;
const SIM_F1 = LAST + 12;
const RELAX = 20;
const BAND_SLACK = 1.0;
const SPACING_OVERSHOOT = 1.08; // the solver lands a touch short of its target
const SETTLE = 120;

/** the front's world y at world x (the grid front is single-valued in x) */
const yAtX = (pts: P2[], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  const n = pts.length;
  if (x >= pts[n - 1][0]) return pts[n - 1][1];
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (pts[m][0] <= x) lo = m;
    else hi = m;
  }
  const u = (x - pts[lo][0]) / (pts[hi][0] - pts[lo][0] || 1);
  return pts[lo][1] + (pts[hi][1] - pts[lo][1]) * u;
};
const softYAt = (pts: P2[], x: number, sig = 7) => {
  let sum = 0;
  let w = 0;
  for (let j = -9; j <= 9; j++) {
    const g = Math.exp(-(j * j) / 18);
    sum += yAtX(pts, x + (j * sig) / 3) * g;
    w += g;
  }
  return sum / w;
};
/** nearest point on the front to (x, y), searched round x; signed depth behind it (south) */
const nearest = (pts: P2[], x: number, y: number) => {
  let lo = 0;
  let hi = pts.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (pts[m][0] <= x) lo = m;
    else hi = m;
  }
  let best = Infinity;
  let bx = x;
  let by = y;
  for (let i = Math.max(1, lo - 14); i <= Math.min(pts.length - 1, lo + 15); i++) {
    const [ax, ay] = pts[i - 1];
    const [cx, cy] = pts[i];
    const dx = cx - ax;
    const dy = cy - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    const d = Math.hypot(x - qx, y - qy);
    if (d < best) [best, bx, by] = [d, qx, qy];
  }
  const behind = y >= yAtX(pts, x);
  const nx = best > 1e-6 ? (x - bx) / best : 0;
  const ny = best > 1e-6 ? (y - by) / best : 1;
  // unit normal pointing BEHIND the line
  const s = behind ? 1 : -1;
  return { depth: behind ? best : -best, nx: nx * s, ny: ny * s };
};

type FrameGeo = { pts: P2[]; xA: number; xB: number; L: number; s: number; D: number };
const GEO: FrameGeo[] = (() => {
  const raw: { pts: P2[]; xA: number; xB: number; L: number; s: number }[] = [];
  for (let f = SIM_F0; f <= SIM_F1; f++) {
    const pts = projectLine(frontAtFrame(f));
    const k = camAt(f).k;
    const s = (SPACING * dotScreen(k)) / k;
    // land extent just behind the line: the run that holds the middle
    const behindLand = (x: number) => {
      const y0 = softYAt(pts, x) + BAND_GAP;
      return landAt(x, y0 + 4) >= 0.5 && landAt(x, y0 + 16) >= 0.5;
    };
    const x0 = pts[0][0];
    const x1 = pts[pts.length - 1][0];
    const mid = (x0 + x1) / 2;
    let start = mid;
    for (let d = 0; d < 400; d++) {
      if (behindLand(mid + d)) {
        start = mid + d;
        break;
      }
      if (behindLand(mid - d)) {
        start = mid - d;
        break;
      }
    }
    let a = start;
    while (a - 1 > x0 && behindLand(a - 1)) a -= 1;
    let b = start;
    while (b + 1 < x1 && behindLand(b + 1)) b += 1;
    // land length of the line between the ends
    let L = 0;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i][0] + pts[i - 1][0]) / 2;
      if (mx < a || mx > b) continue;
      L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    raw.push({ pts, xA: a, xB: b, L, s });
  }
  // smooth the extent and the length in time (a coast crossing never lurches)
  const sm = (get: (r: (typeof raw)[number], i: number) => number, sig: number) =>
    raw.map((_, i) => {
      let sum = 0;
      let w = 0;
      for (let j = -3 * sig; j <= 3 * sig; j++) {
        const g = Math.exp(-(j * j) / (2 * sig * sig));
        const q = Math.max(0, Math.min(raw.length - 1, i + j));
        sum += get(raw[q], q) * g;
        w += g;
      }
      return sum / w;
    });
  const xA = sm((r) => r.xA, 4);
  const xB = sm((r) => r.xB, 4);
  const L = sm((r) => r.L, 4);
  // the band depth: the smallest D whose band (gap .. gap + D behind the
  // softened line, between the ends) holds N dots of hex cell 0.866 s^2 on
  // LAND; bays and coasts behind the line are not counted, so the crowd never
  // overflows into the sea
  const landArea = (pts: P2[], a: number, b: number, D: number) => {
    let area = 0;
    for (let x = a; x <= b; x += 2) {
      const y0 = softYAt(pts, x) + BAND_GAP;
      for (let d = 1; d < D; d += 2) if (landAt(x, y0 + d) >= 0.5) area += 4;
    }
    return area;
  };
  const Draw = raw.map((r, i) => {
    const need = ARMY_COUNT * 0.866 * r.s * r.s * BAND_SLACK;
    let lo = 0;
    let hi = 160;
    for (let it = 0; it < 14; it++) {
      const m = (lo + hi) / 2;
      if (landArea(r.pts, xA[i], xB[i], m) >= need) hi = m;
      else lo = m;
    }
    return hi;
  });
  const D = sm((_, i) => Draw[i], 3) as number[];
  return raw.map((r, i) => ({ pts: r.pts, xA: xA[i], xB: xB[i], L: L[i], s: r.s, D: D[i] }));
})();
const geo = (f: number) => GEO[Math.max(0, Math.min(GEO.length - 1, f - SIM_F0))];

/** a step toward the nearest land: probe 16 bearings at growing radii and
 *  move up to `max` world px toward the first land found (no gradient needed,
 *  so a dot deep in a bay still finds its way ashore) */
const seekLand = (x: number, y: number, max: number): [number, number] => {
  for (const r of [3, 6, 12, 24, 48]) {
    let best = -1;
    let bx = 0;
    let by = 0;
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2;
      const l = landAt(x + r * Math.cos(t), y + r * Math.sin(t));
      if (l > best) [best, bx, by] = [l, Math.cos(t), Math.sin(t)];
    }
    if (best >= 0.6) {
      const m = Math.min(max, r);
      return [x + bx * m, y + by * m];
    }
  }
  return [x, y];
};

const relaxStep = (xs: Float64Array, ys: Float64Array, g: FrameGeo) => {
  const n = xs.length;
  const s = g.s * SPACING_OVERSHOOT;
  // 1. the band's edges, measured to the real front, then land (deep water
  //    has no land gradient: there the dot steps toward the front, whose far
  //    side is land)
  for (let i = 0; i < n; i++) {
    const q = nearest(g.pts, xs[i], ys[i]);
    if (q.depth < BAND_GAP) {
      const m = BAND_GAP - q.depth;
      xs[i] += q.nx * m;
      ys[i] += q.ny * m;
    } else if (q.depth > BAND_GAP + g.D) {
      const m = 0.5 * (q.depth - BAND_GAP - g.D);
      xs[i] -= q.nx * m;
      ys[i] -= q.ny * m;
    }
    if (landAt(xs[i], ys[i]) < 0.62) [xs[i], ys[i]] = seekLand(xs[i], ys[i], 2.5);
  }
  // 2. pairwise spacing (last, so no pair is ever left stacked)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ex = xs[j] - xs[i];
      const ey = ys[j] - ys[i];
      if (Math.abs(ex) >= s || Math.abs(ey) >= s) continue;
      const d = Math.hypot(ex, ey);
      if (d >= s) continue;
      const c = (0.5 * (s - d)) / (d || 1e-6);
      const ux = d > 1e-6 ? ex : Math.cos(i * 2.4) * 1e-3;
      const uy = d > 1e-6 ? ey : Math.sin(i * 2.4) * 1e-3;
      xs[i] -= ux * c * 0.7;
      ys[i] -= uy * c * 0.7;
      xs[j] += ux * c * 0.7;
      ys[j] += uy * c * 0.7;
    }
  }
  // 3. a light land step (one px at most) and the band's ends, so spacing
  //    pressure never parks a dot at sea
  for (let i = 0; i < n; i++) {
    const lo = g.xA + 0.4 * g.s;
    const hi = g.xB - 1.4 * g.s;
    if (xs[i] < lo) xs[i] += 0.5 * (lo - xs[i]);
    if (xs[i] > hi) xs[i] += 0.5 * (hi - xs[i]);
    if (landAt(xs[i], ys[i]) < 0.55) [xs[i], ys[i]] = seekLand(xs[i], ys[i], 1);
  }
};

const SIM: { xs: Float64Array; ys: Float64Array }[] = (() => {
  const g0 = geo(SIM_F0);
  const aspect = Math.max(1, (g0.xB - g0.xA) / Math.max(1, g0.D + BAND_GAP));
  const slots = armySlots(ARMY_COUNT, ARMY_SEED, aspect);
  const xs = new Float64Array(ARMY_COUNT);
  const ys = new Float64Array(ARMY_COUNT);
  slots.forEach(([u, v], i) => {
    xs[i] = g0.xA + (g0.xB - g0.xA) * (0.03 + 0.94 * u);
    ys[i] = softYAt(g0.pts, xs[i]) + BAND_GAP + g0.D * v;
  });
  for (let it = 0; it < SETTLE; it++) relaxStep(xs, ys, g0);
  const out: { xs: Float64Array; ys: Float64Array }[] = [];
  out.push({ xs: Float64Array.from(xs), ys: Float64Array.from(ys) });
  for (let f = SIM_F0 + 1; f <= SIM_F1; f++) {
    const a = geo(f - 1);
    const b = geo(f);
    const stretch = (b.xB - b.xA) / Math.max(1e-6, a.xB - a.xA);
    for (let i = 0; i < ARMY_COUNT; i++) {
      const x0 = xs[i];
      const x1 = b.xA + (x0 - a.xA) * stretch;
      xs[i] = x1;
      ys[i] += softYAt(b.pts, x1) - softYAt(a.pts, x0);
    }
    for (let it = 0; it < RELAX; it++) relaxStep(xs, ys, b);
    out.push({ xs: Float64Array.from(xs), ys: Float64Array.from(ys) });
  }
  return out;
})();

const SMOOTH_SIG = 1.5;
const TAPS = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((j) => ({ j, g: Math.exp(-(j * j) / (2 * SMOOTH_SIG * SMOOTH_SIG)) }));
/** the army's dots at frame f (world px), with the house breath at zoom k */
export const unDotsAt = (f: number, k: number) => {
  const fi = Math.round(f);
  const out: { id: number; x: number; y: number }[] = [];
  for (let i = 0; i < ARMY_COUNT; i++) {
    let x = 0;
    let y = 0;
    let w = 0;
    for (const { j, g } of TAPS) {
      const r = SIM[Math.max(0, Math.min(SIM.length - 1, fi + j - SIM_F0))];
      x += r.xs[i] * g;
      y += r.ys[i] * g;
      w += g;
    }
    const id = ARMY_SEED * 1000 + i;
    const w1 = 0.045 + 0.04 * hash(id, 11);
    const w2 = 0.04 + 0.045 * hash(id, 12);
    const a = 1.1 / k;
    out.push({
      id,
      x: x / w + a * Math.sin(fi * w1 + 6.283 * hash(id, 13)),
      y: y / w + a * Math.sin(fi * w2 + 6.283 * hash(id, 14)),
    });
  }
  return out;
};
/** the band's geometry at frame f (for checks): land length, spacing, depth */
export const bandAt = (f: number) => {
  const g = geo(Math.round(f));
  return { L: g.L, s: g.s, D: g.D, xA: g.xA, xB: g.xB };
};

// ---------------------------------------------------------------------------
// LEGACY (V1 preview) constants, kept ONLY so chineseMotion.ts, which imported
// them before this revision, still compiles. They no longer describe this
// cut's crowd or end state: import END_U / unFrontAt / END_CAM / unDotsAt.
// ---------------------------------------------------------------------------
/** @deprecated V1 crowd constant; see unDotsAt */
export const ARMY_ASPECT = 2.6;
/** @deprecated V1 crowd constant; see BAND_GAP */
export const ARMY_GAP = 6;
/** @deprecated V1 crowd constant; see SPACING */
export const MIN_SPACING = 1.3;
/** @deprecated V1 crowd depth; see bandAt(f).D */
export const armyDepth = (f: number) => 88 + (44 - 88) * Math.min(1, frontS(f) / 2);
