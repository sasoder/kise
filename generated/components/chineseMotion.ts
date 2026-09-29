// ChineseAreIn: the moving front, the lit border and every PVA dot's
// trajectory. Pure maths (no React), so the check script reads the exact same
// motion the component draws. See ChineseAreIn.tsx's header for the gestures,
// the frame table and the sources.
import {
  PVA_CROSSINGS,
  UN_GROUND_LATE_NOV_1950,
  YALU_TUMEN,
  type LonLat,
} from "./korea1950Fronts";
import {
  MEN_PER_DOT,
  armySlots,
  dotScreen,
  hash,
  landAt,
  makeTrack,
  project,
  projectLine,
  type Cam,
  type P2,
} from "./koreaShared";
import { BORDERS_D } from "./koreaStatic";
// the previous cut's crowd constants (read-only): this cut opens on its last frame
import {
  ARMY_COUNT,
  ARMY_SEED,
  BAND_GAP,
  END_DUDF,
  END_U,
  LAST as REUNITE_LAST,
  SPACING,
  camAt as reuniteCam,
  frontAtFrame as reuniteFront,
  unDotsAt as reuniteDots,
  unFrontAt,
} from "./reuniteMotion";

export const FPS = 24;
// "Well, when he gets too close to the Chinese border, the Chinese are in,"
// In-point 48.320 s = f0; speech 3.600 s: round(3.6 x 24) = 86, + 16 = 102.
export const DURATION = 102;
export const WORDS = {
  well: 0,
  when: 12,
  he: 18,
  gets: 21,
  too: 25,
  close: 29,
  toThe: 35,
  chinese: 40,
  border: 47,
  the: 59,
  chinese2: 61,
  areIn: 68,
  and: 78,
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const smootherstep = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
/** C1 soft minimum of f and c (softplus width w) */
const softMin = (f: number, c: number, w: number) => {
  const u = (c - f) / w;
  return c - w * (u > 30 ? u : Math.log1p(Math.exp(u)));
};

// ---------------------------------------------------------------------------
// Strengths, 1 dot = 3,000 men.
// ---------------------------------------------------------------------------
/** the UN front's crowd (Reunite's closing state): UN ground forces 23 Nov 1950 */
export const UN_DOTS = Math.round(UN_GROUND_LATE_NOV_1950 / MEN_PER_DOT); // 141 (= reuniteMotion ARMY_COUNT)
/** the PVA in Korea for the Second Phase Offensive (late Nov 1950), by army
 *  group: 13th AG (west, Eighth Army's front) 230,000 (Wikipedia "Battle of the
 *  Ch'ongch'on River" infobox); 9th AG (east, X Corps / Chosin) 150,000
 *  (koreanwar.org "The Chinese Failure at Chosin": "the 150,000 strong Ninth
 *  Army Group"). 380,000 in all, inside Wikipedia "Second Phase Offensive"'s
 *  300,000-390,000. */
export const PVA_13TH = 230_000;
export const PVA_9TH = 150_000;
export const DOTS_13TH = Math.round(PVA_13TH / MEN_PER_DOT); // 77
export const DOTS_9TH = Math.round(PVA_9TH / MEN_PER_DOT); // 50
export const PVA_DOTS = DOTS_13TH + DOTS_9TH; // 127

// ---------------------------------------------------------------------------
// The river: the Yalu-Tumen part of the baked 1950 border path (BORDERS_D), so
// the lit overlay sits exactly on the baked line. Subpath 0 runs from the
// China-USSR border down the Tumen and the Yalu to Sinuiju; subpath 1 is the
// Korea-USSR lower Tumen. Korea's border = subpath 0 from the tripoint to its
// end, reversed (Sinuiju -> tripoint), then subpath 1 (tripoint -> the mouth).
// ---------------------------------------------------------------------------
const SUBS: P2[][] = BORDERS_D.split("M")
  .filter(Boolean)
  .map((s) => s.split("L").map((p) => p.split(",").map(Number) as P2));
export const BORDER: P2[] = (() => {
  const [a, b] = SUBS.length >= 2 ? [SUBS[0], SUBS[1]] : [SUBS[0], []];
  const tri = b.length ? b[0] : project(130.6, 42.42);
  let best = 0;
  let bd = Infinity;
  a.forEach(([x, y], i) => {
    const d = Math.hypot(x - tri[0], y - tri[1]);
    if (d < bd) [bd, best] = [d, i];
  });
  return [...a.slice(best).reverse(), ...b.slice(1)];
})();
export const BORDER_CUM: number[] = (() => {
  const c = [0];
  for (let i = 1; i < BORDER.length; i++) c.push(c[i - 1] + Math.hypot(BORDER[i][0] - BORDER[i - 1][0], BORDER[i][1] - BORDER[i - 1][1]));
  return c;
})();
export const BORDER_LEN = BORDER_CUM[BORDER_CUM.length - 1];

// ---------------------------------------------------------------------------
// THE FRONT continues ReuniteTheWholeThing's: its unFrontAt(u), the front u of
// the way from the 19 Oct line to FARTHEST_ADVANCE (the UN's composite
// high-water line: Chosan and Hyesan ON the Yalu), on its longitude grid,
// every point moving only in latitude. Cut 4 ends at u = END_U (0.92, the
// spikes just short of the river) still inching at END_DUDF per frame.
//   reach  u runs on from END_U with that same velocity (one cubic), so the
//          Chosan and Hyesan spikes TOUCH the Yalu at ~f26-28 (u 0.985),
//          then inches on toward 1.0 (reached ~f90)
//   stop   the inching STOPS where the cream reaches the front: each point's
//          u is read at a soft min of the frame and its contact frame
//   push   from contact the line is pushed back south (smootherstep, 16 f) by
//          0.10 deg plus 35 % of how far it stands past the 24 Nov line, over
//          the fans' longitudes (so the Chosan spike gives up a third)
// ---------------------------------------------------------------------------
const FA_GRID = unFrontAt(1);
const LAT19 = unFrontAt(0).map(([, lat]) => lat);
const LATFA = FA_GRID.map(([, lat]) => lat);
const LONS = FA_GRID.map(([lon]) => lon);
const T_TOUCH = 28;
const U_TOUCH = 0.985;
const T_FULL = 90;
const hermite = (t: number, p0: number, m0: number, p1: number, m1: number, h: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * h * m1;
};
const M_TOUCH = (1 - U_TOUCH) / (T_FULL - T_TOUCH) * 1.5;
/** the reach parameter u at frame f (f >= 0): END_U with cut 4's velocity -> 1 */
export const uAt = (f: number) => {
  if (f <= 0) return END_U + END_DUDF * f;
  if (f < T_TOUCH) return hermite(f / T_TOUCH, END_U, END_DUDF, U_TOUCH, M_TOUCH, T_TOUCH);
  if (f < T_FULL) return hermite((f - T_TOUCH) / (T_FULL - T_TOUCH), U_TOUCH, M_TOUCH, 1, 0, T_FULL - T_TOUCH);
  return 1;
};
// FARTHEST_ADVANCE's Chosan and Hyesan tips sit 2-3 world px short of the
// drawn border (both are hand-traced to ~0.1 deg). So that the spikes truly
// TOUCH the Yalu, a narrow lon-Gaussian (sigma 0.06 deg) round each tip closes
// that gap as u runs from END_U to U_TOUCH (zero at f0, so the join is exact).
const riverLatAt = (lon: number) => {
  let best = Infinity;
  for (let i = 1; i < YALU_TUMEN.length; i++) {
    const [x0, y0] = YALU_TUMEN[i - 1];
    const [x1, y1] = YALU_TUMEN[i];
    if ((lon - x0) * (lon - x1) > 0 || x0 === x1) continue;
    best = Math.min(best, y0 + ((y1 - y0) * (lon - x0)) / (x1 - x0));
  }
  return best;
};
const TIPS = [125.82, 128.18];
const TIP = LONS.map((lon, i) => {
  let d = 0;
  for (const t of TIPS) {
    const r = riverLatAt(lon);
    if (!Number.isFinite(r)) continue;
    d = Math.max(d, Math.exp(-(((lon - t) / 0.06) ** 2)) * Math.max(0, r - LATFA[i] + 0.015));
  }
  return d;
});
const tipAt = (u: number) => smoothstep((u - END_U) / (U_TOUCH - END_U));
/** a front point's latitude at reach u */
const latAtU = (i: number, u: number) => LAT19[i] + u * (LATFA[i] - LAT19[i]) + TIP[i] * tipAt(u);
const prepushFront = (f: number): LonLat[] => {
  const u = uAt(f);
  return LONS.map((lon, i) => [lon, latAtU(i, u)] as LonLat);
};
const PRE_CACHE = new Map<number, P2[]>();
const prepushPts = (f: number): P2[] => {
  const key = Math.round(f * 100);
  let v = PRE_CACHE.get(key);
  if (!v) {
    v = projectLine(prepushFront(f));
    PRE_CACHE.set(key, v);
  }
  return v;
};

// the front's world y at world x (the grid front is single-valued in x), and a
// gaussian-softened copy (the cream presses on the softened line)
const fyAtX = (pts: P2[], x: number) => {
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
const fSoftY = (pts: P2[], x: number) => {
  let sum = 0;
  let w = 0;
  for (let j = -9; j <= 9; j++) {
    const g = Math.exp(-(j * j) / 18);
    sum += fyAtX(pts, x + (j * 7) / 3) * g;
    w += g;
  }
  return sum / w;
};

// ---------------------------------------------------------------------------
// THE PVA: 127 cream dots (1 = 3,000 men), both army groups, as STREAMS.
// Each crossing has one approach road out of deep Manchuria, starting far
// above the frame, so every dot enters from the TOP EDGE in a column and
// converges on its ford. 13th AG (77, west): Andong -> Sinuiju 28, Changdian
// -> Sakju 22, Ji'an -> Manpo 27. 9th AG (50, east): Ji'an -> Manpo 34 (20th
// + 27th Armies, to Yudam-ni / the Chosin reservoir), Linjiang -> Chunggang 16
// (26th Army, toward Huchang). The roads run clear of the CHINA label.
//   road   each stream is one marching column (see ROADS below): 15 world
//          px/f far up, easing to 4.6 as its head nears the ford
//   ford   each dot crosses when its column carries it there; heads ~f57-62,
//          the rear still coming down from the top edge on the last frame
//   fan    from the Korean bank a Hermite (leaving at the road's velocity,
//          landing at rest) to its own slot, which rides the CURRENT front:
//          x fixed, y = the softened front - GAP - depth, depth a share of
//          the room between the front and the river; the slot moves with the
//          front, so the crowd follows the orange as it gives way
// ---------------------------------------------------------------------------
const K_REF = 2.4; // the zoom the crowd is spaced for
const DOT_W = dotScreen(K_REF) / K_REF; // one dot's diameter, world px
export const GAP_C = 4.5; // world px the cream keeps ahead of the orange line
const norm = (x: number, y: number): P2 => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
const chaikin = (pts: P2[], passes: number) => {
  let a = pts;
  for (let n = 0; n < passes; n++) {
    const b: P2[] = [a[0]];
    for (let i = 0; i < a.length - 1; i++) {
      const [x0, y0] = a[i];
      const [x1, y1] = a[i + 1];
      b.push([0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1], [0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1]);
    }
    b.push(a[a.length - 1]);
    a = b;
  }
  return a;
};
const JIAN = PVA_CROSSINGS[2];
type Stream = {
  name: string;
  group: "13th" | "9th";
  n: number;
  cn: LonLat;
  kr: LonLat;
  road: P2[]; // world waypoints, far above the frame -> near the ford
  xs: [number, number]; // the slots' world-x range along the front
  t0: number; // the head's ford frame
  shift?: number; // lateral lane shift, world px (two columns sharing a ford)
};
export const STREAMS: Stream[] = [
  { name: "Andong-Sinuiju", group: "13th", n: 28, cn: PVA_CROSSINGS[0].cn, kr: PVA_CROSSINGS[0].kr, road: [[262, -160], [266, 200], [274, 470]], xs: [284, 336], t0: 60 },
  { name: "Changdian-Sakju", group: "13th", n: 22, cn: PVA_CROSSINGS[1].cn, kr: PVA_CROSSINGS[1].kr, road: [[302, -160], [303, 200], [306, 420], [332, 480]], xs: [334, 398], t0: 58 },
  { name: "Ji'an-Manpo (13th)", group: "13th", n: 27, cn: JIAN.cn, kr: JIAN.kr, road: [[548, -160], [540, 150], [504, 396]], xs: [398, 458], t0: 57, shift: 4.5 },
  { name: "Ji'an-Manpo (9th)", group: "9th", n: 34, cn: JIAN.cn, kr: JIAN.kr, road: [[590, -160], [572, 150], [514, 404]], xs: [456, 528], t0: 59, shift: -4.5 },
  { name: "Linjiang-Chunggang", group: "9th", n: 16, cn: [126.93, 41.81], kr: [126.88, 41.77], road: [[640, -160], [610, 130], [540, 334]], xs: [522, 568], t0: 61 },
];
if (STREAMS.filter((q) => q.group === "13th").reduce((a, q) => a + q.n, 0) !== DOTS_13TH) throw new Error("13th AG dot count");
if (STREAMS.filter((q) => q.group === "9th").reduce((a, q) => a + q.n, 0) !== DOTS_9TH) throw new Error("9th AG dot count");

// Each stream is a COLUMN that marches as one (a train on its road: every dot
// shares the column's distance S(f), so its spacing is fixed): two abreast
// (staggered half a row),
// rows 7.5 world px apart at the head, the rear thinning out (row gap x (1 +
// 40 (row / rows)^5)), so the column reaches back beyond the top edge and is
// still coming on the last frame. The column marches at V_FAR and eases to
// V_NEAR over the ~10 frames before its head reaches the ford at t0 (it
// crowds up at the water), then keeps V_NEAR: each dot crosses when the
// column has carried it to the ford.
const V_FAR = 15;
const V_NEAR = 4.6;
const colV = (q: Stream, f: number) => V_NEAR + (V_FAR - V_NEAR) * (1 - smoothstep((f - (q.t0 - 9)) / 11));
type Road = { pts: P2[]; cum: number[]; len: number; dir: P2; S: Float64Array };
const COL_F0 = -80;
const COL_F1 = DURATION + 60;
const ROADS: Road[] = STREAMS.map((q) => {
  const cn = project(q.cn[0], q.cn[1]);
  const kr = project(q.kr[0], q.kr[1]);
  const pts = [...chaikin([...q.road, cn], 3), kr];
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  // S(f): the column's head distance along the road, S(t0) = len
  const n = COL_F1 - COL_F0 + 1;
  const acc = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    let v = 0;
    for (let k = 0; k < 8; k++) v += colV(q, COL_F0 + i - 1 + (k + 0.5) / 8) / 8;
    acc[i] = acc[i - 1] + v;
  }
  const it0 = q.t0 - COL_F0;
  const i0 = Math.floor(it0);
  const at0 = acc[i0] + (acc[i0 + 1] - acc[i0]) * (it0 - i0);
  const S = acc.map((v) => v - at0 + len);
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  return { pts, cum, len, dir: norm(b[0] - a[0], b[1] - a[1]), S };
});
const colS = (r: Road, f: number) => {
  const p = Math.max(0, Math.min(r.S.length - 1.001, f - COL_F0));
  const i = Math.floor(p);
  return r.S[i] + (r.S[i + 1] - r.S[i]) * (p - i);
};
/** the frame the column has carried a dot `off` behind the head to the ford */
const fordTime = (r: Road, off: number) => {
  const target = r.len + off;
  let lo = 0;
  let hi = r.S.length - 1;
  if (r.S[hi] < target) return COL_F1 + (target - r.S[hi]) / V_NEAR;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (r.S[m] <= target) lo = m;
    else hi = m;
  }
  return COL_F0 + lo + (target - r.S[lo]) / (r.S[hi] - r.S[lo] || 1);
};
const roadAt = (r: Road, s: number) => {
  const t = Math.max(0, Math.min(r.len, s));
  let lo = 0;
  let hi = r.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (r.cum[m] <= t) lo = m;
    else hi = m;
  }
  const u = (t - r.cum[lo]) / (r.cum[hi] - r.cum[lo] || 1);
  const [ax, ay] = r.pts[lo];
  const [bx, by] = r.pts[hi];
  const [tx, ty] = norm(bx - ax, by - ay);
  return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, nx: -ty, ny: tx };
};

// where the Korean land ends north of the front (the river or the coast), per
// world x: scanned north from FARTHEST_ADVANCE
const FA_PTS = projectLine(FA_GRID);
const NORTH_X0 = 250;
const NORTH_Y = Array.from({ length: 460 }, (_, j) => {
  const x = NORTH_X0 + j;
  let y = fyAtX(FA_PTS, x);
  for (let n = 0; n < 400 && landAt(x, y - 1) >= 0.5; n++) y -= 1;
  return y;
});
const northYAt = (x: number) => NORTH_Y[Math.max(0, Math.min(NORTH_Y.length - 1, Math.round(x - NORTH_X0)))];
const DEPTH_MAX = 46;
/** a slot's world position on the current front: x fixed, v in [0, 1] */
const slotPos = (x: number, v: number, fr: P2[]): P2 => {
  const fy = fSoftY(fr, x) - GAP_C - DOT_W * 0.5;
  const room = Math.max(6, fy - northYAt(x) - 3);
  return [x, fy - v * Math.min(DEPTH_MAX, room)];
};

export type Dot = {
  id: number;
  si: number;
  off: number; // world px behind the column's head
  tB: number; // at the Korean bank
  D: number; // frames of the fan leg
  tL: number; // lands in its slot
  sx: number; // slot x
  sv: number; // slot depth share
  lane: number;
  wob: number;
};
export const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  let id = 0;
  STREAMS.forEach((q, si) => {
    const r = ROADS[si];
    // blue-noise slots in (x, v), metric (x, 26 v) world px
    const slots: P2[] = [];
    let c = 0;
    for (let n = 0; n < q.n; n++) {
      let best: P2 = [0, 0];
      let bd = -1;
      for (let t = 0; t < 30; t++) {
        const x = q.xs[0] + (q.xs[1] - q.xs[0]) * hash(si * 977 + c, 31);
        const v = Math.pow(hash(si * 977 + c, 32), 1.25);
        c++;
        let dm = Infinity;
        for (const [px, pv] of slots) dm = Math.min(dm, Math.hypot(px - x, 26 * (pv - v)));
        if (dm > bd) [bd, best] = [dm, [x, v]];
      }
      slots.push(best);
    }
    // the head of the stream takes the slots nearest the orange
    const order = slots.map((sl, j) => ({ j, key: sl[1] + 0.18 * hash(j + 31 * si, 33) })).sort((a, b) => a.key - b.key);
    const B = r.pts[r.pts.length - 1];
    const rows = Math.ceil(q.n / 2);
    let off = 0;
    let lastRow = 0;
    order.forEach(({ j }, rank) => {
      const row = Math.floor(rank / 2);
      if (row !== lastRow) {
        off += 7.5 * (1 + 40 * Math.pow(row / rows, 5)) + 1.2 * (hash(si * 131 + row, 37) - 0.5);
        lastRow = row;
      }
      const side = rank % 2 === 0 ? -1 : 1;
      const lane = side * (3.2 + 1.6 * (hash(id, 35) - 0.5)) * (q.n % 2 === 1 && rank === q.n - 1 ? 0 : 1);
      const dOff = off + (side > 0 ? 3.6 : 0) + 2.4 * (hash(id, 38) - 0.5);
      const tB = fordTime(r, dOff);
      const [sx, sv] = slots[j];
      const T0 = slotPos(sx, sv, prepushPts(tB));
      const D = Math.max(12, Math.min(30, Math.hypot(T0[0] - B[0], T0[1] - B[1]) / 6));
      out.push({ id: id++, si, off: dOff, tB, D, tL: tB + D, sx, sv, lane, wob: hash(id, 36) });
    });
  });
  return out;
})();

// ---------------------------------------------------------------------------
// CONTACT (analytic, from the landing schedule): each front point is reached
// when the first cream dot lands at its x, or the pressure spreads to it along
// the line at SPREAD_V world px/f from a landing, whichever comes first.
// ---------------------------------------------------------------------------
const SPREAD_V = 5;
export const CONTACT: number[] = (() => {
  const xs = FA_PTS.map(([x]) => x);
  return xs.map((x) => {
    let m = Infinity;
    for (const d of DOTS) m = Math.min(m, d.tL + Math.abs(x - d.sx) / SPREAD_V);
    return m;
  });
})();

// ---------------------------------------------------------------------------
// THE PUSH-BACK. From its contact frame each front point gives way south over
// PUSH_DUR frames (smootherstep, so it eases in and is still easing out on the
// last frame): 0.30 deg along the west (13th AG's front), 0.18 deg across
// the Chosin sector (9th AG), tapering to nothing before Hyesan; and the
// Chosan spike collapses fully back to the line between its shoulders.
// ---------------------------------------------------------------------------
const recede = (lon: number) =>
  smoothstep((lon - 124.0) / 0.2) *
  (0.3 - 0.12 * smoothstep((lon - 126.2) / 0.4)) *
  (1 - smoothstep((lon - 127.55) / 0.3));
const SH = [125.45, 126.2];
const shoulder = (lon: number) => {
  const iA = LONS.findIndex((l) => l >= SH[0]);
  const iB = LONS.findIndex((l) => l >= SH[1]);
  const a = latAtU(iA, 1);
  const b = latAtU(iB, 1);
  return a + ((b - a) * (lon - LONS[iA])) / (LONS[iB] - LONS[iA]);
};
const PUSH = LONS.map((lon, i) => recede(lon) + (lon > SH[0] && lon < SH[1] ? Math.max(0, latAtU(i, 1) - shoulder(lon)) : 0));
const PUSH_DUR = 36;

/** the UN front at frame f (lon/lat, W -> E; for f <= 0 exactly cut 4's front) */
export const frontAt = (f: number): LonLat[] => {
  if (f <= 0) return reuniteFront(REUNITE_LAST + f);
  return LONS.map((lon, i) => {
    const c = CONTACT[i];
    const u = uAt(c < Infinity ? softMin(f, c, 3) : f);
    let lat = latAtU(i, u);
    if (c < Infinity) lat -= PUSH[i] * smootherstep((f - c) / PUSH_DUR);
    return [lon, lat] as LonLat;
  });
};
const FRONT_CACHE = new Map<number, P2[]>();
export const frontPts = (f: number): P2[] => {
  const key = Math.round(f * 100);
  let v = FRONT_CACHE.get(key);
  if (!v) {
    v = projectLine(frontAt(f));
    FRONT_CACHE.set(key, v);
  }
  return v;
};

/** a cream dot's world position at frame f (null: not yet on its road) */
export const dotAt = (d: Dot, f: number): { x: number; y: number; crossed: boolean } | null => {
  const r = ROADS[d.si];
  if (f <= d.tB) {
    const s = colS(r, f) - d.off;
    if (s < 0) return null;
    const p = roadAt(r, s);
    // two abreast, the column narrowing to the ford, with a slow wander
    const w = (0.45 + 0.55 * smoothstep((r.len - s) / 50)) * (d.lane + 0.6 * Math.sin(s / 23 + 6.283 * d.wob)) + (STREAMS[d.si].shift ?? 0);
    return { x: p.x + p.nx * w, y: p.y + p.ny * w, crossed: false };
  }
  const B = r.pts[r.pts.length - 1];
  const bw = 0.45 * (d.lane + 0.6 * Math.sin(r.len / 23 + 6.283 * d.wob)) + (STREAMS[d.si].shift ?? 0);
  const Bn = roadAt(r, r.len);
  const bx = B[0] + Bn.nx * bw;
  const by = B[1] + Bn.ny * bw;
  const T = slotPos(d.sx, d.sv, frontPts(f));
  const u = Math.min(1, (f - d.tB) / d.D);
  if (u >= 1) return { x: T[0], y: T[1], crossed: true };
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  const m = d.D * colV(STREAMS[d.si], d.tB);
  return { x: h00 * bx + h10 * m * r.dir[0] + h01 * T[0], y: h00 * by + h10 * m * r.dir[1] + h01 * T[1], crossed: true };
};

// ---------------------------------------------------------------------------
// The cream dots at frame f, clamped behind the orange line: a dot never gets
// closer than GAP_C to the front (soft: it is pushed back along the line's
// normal), so the crowd presses on the orange and the orange gives way.
// ---------------------------------------------------------------------------
const nearestOnFront = (x: number, y: number, pts: P2[]) => {
  let best = Infinity;
  let q: P2 = [x, y];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const ddx = bx - ax;
    const ddy = by - ay;
    const l2 = ddx * ddx + ddy * ddy || 1e-9;
    const t = clamp01(((x - ax) * ddx + (y - ay) * ddy) / l2);
    const cx = ax + t * ddx;
    const cy = ay + t * ddy;
    const d = Math.hypot(x - cx, y - cy);
    if (d < best) [best, q] = [d, [cx, cy]];
  }
  return { d: best, q };
};
export type CreamDot = { id: number; x: number; y: number; op: number };
/** the cream never gets closer than GAP_C (vertically) to a softened copy of
 *  the orange line: a soft max(0, overlap) shift straight north, continuous in
 *  the dot's position and the line, so a dot pressing on the line slides along
 *  it instead of snapping to a nearest point */
const clampAhead = (x: number, y: number, fr: P2[]): P2 => {
  const excess = y - (fSoftY(fr, x) - GAP_C);
  if (excess <= -8) return [x, y];
  const w = 1.2;
  return [x, y - w * Math.log1p(Math.exp(excess / w + 1))];
};
/** the cream crowd's own spacing: 5 soft passes easing apart any two dots
 *  closer than CREAM_SEP diameters (a smooth kernel, weighted by opacity),
 *  and the resulting nudges averaged over +-3 frames (gaussian), so a stream
 *  passing through the queue jostles it instead of shaking it; then the
 *  orange clamp again */
const CREAM_SEP = 1.25;
const creamPlaced = (f: number, k: number) => {
  const fr = frontPts(f);
  const live: Dot[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  for (const d of DOTS) {
    const p = dotAt(d, f);
    if (!p) continue;
    let { x, y } = p;
    const a = 1.0 / k;
    x += a * Math.sin(f * (0.05 + 0.04 * hash(d.id, 21)) + 6.283 * hash(d.id, 22));
    y += a * Math.sin(f * (0.045 + 0.04 * hash(d.id, 23)) + 6.283 * hash(d.id, 24));
    if (p.crossed) [x, y] = clampAhead(x, y, fr);
    live.push(d);
    xs.push(x);
    ys.push(y);
  }
  const ops = live.map(() => 1);
  return { live, xs: Float64Array.from(xs), ys: Float64Array.from(ys), ops, fr };
};
const nudges = (f: number, k: number) => {
  const { live, xs, ys, ops } = creamPlaced(f, k);
  const x0 = Float64Array.from(xs);
  const y0 = Float64Array.from(ys);
  const dmin = (CREAM_SEP * dotScreen(k)) / k;
  for (let pass = 0; pass < 5; pass++) {
    const dx = new Float64Array(live.length);
    const dy = new Float64Array(live.length);
    for (let i = 0; i < live.length; i++)
      for (let j = i + 1; j < live.length; j++) {
        const ex = xs[j] - xs[i];
        const ey = ys[j] - ys[i];
        if (Math.abs(ex) >= dmin || Math.abs(ey) >= dmin) continue;
        const dd = Math.hypot(ex, ey);
        if (dd >= dmin) continue;
        const u = 1 - dd / dmin;
        const push = 0.6 * dmin * u * u * (3 - 2 * u) * Math.min(ops[i], ops[j]);
        const ux = dd > 1e-6 ? ex / dd : Math.cos(i * 2.4);
        const uy = dd > 1e-6 ? ey / dd : Math.sin(i * 2.4);
        dx[i] -= ux * push;
        dy[i] -= uy * push;
        dx[j] += ux * push;
        dy[j] += uy * push;
      }
    for (let i = 0; i < live.length; i++) {
      xs[i] += dx[i];
      ys[i] += dy[i];
    }
  }
  const m = new Map<number, P2>();
  live.forEach((d, i) => m.set(d.id, [xs[i] - x0[i], ys[i] - y0[i]]));
  return m;
};
const NUDGE_TAPS = [-3, -2, -1, 0, 1, 2, 3].map((j) => ({ j, g: Math.exp(-(j * j) / (2 * 1.5 * 1.5)) }));
export const creamAt = (f: number, k: number): CreamDot[] => {
  const { live, xs, ys, ops, fr } = creamPlaced(f, k);
  const sets = NUDGE_TAPS.map(({ j, g }) => ({ g, m: nudges(f + j, k) }));
  return live.map((d, i) => {
    let nx = 0;
    let ny = 0;
    let w = 0;
    for (const { g, m } of sets) {
      const v = m.get(d.id);
      w += g; // a dot not yet out counts as no nudge
      if (!v) continue;
      nx += v[0] * g;
      ny += v[1] * g;
    }
    const x = xs[i] + nx / w;
    const y = ys[i] + ny / w;
    const [cx, cy] = f > d.tB ? clampAhead(x, y, fr) : [x, y];
    return { id: d.id, x: cx, y: cy, op: ops[i] };
  });
};

// ---------------------------------------------------------------------------
// THE LIT BORDER: each border sample's touch frame (the first frame the front
// comes within TOUCH of it), and from every touch a brightening that travels
// out along the line both ways at LIT_V world px / f.
// ---------------------------------------------------------------------------
const TOUCH = 0.8;
export const LIT_V = 9;
const LIT_FEATHER = 28;
export const TOUCHES: { s: number; f: number }[] = (() => {
  const out: { s: number; f: number }[] = [];
  const fr34 = projectLine(prepushFront(34));
  const near = BORDER.map(([x, y]) => nearestOnFront(x, y, fr34).d < 12);
  const first = new Array<number>(BORDER.length).fill(Infinity);
  for (let f = 0; f <= 60; f += 0.25) {
    const fr = frontPts(f);
    BORDER.forEach(([x, y], j) => {
      if (!near[j] || first[j] < Infinity) return;
      if (nearestOnFront(x, y, fr).d < TOUCH) first[j] = f;
    });
  }
  // a stretch already on the river when the cut opens (the 24 Nov line at
  // Hyesan) is not a touch: only the front's own arrival lights the border
  first.forEach((f, j) => {
    if (f < Infinity && f > 2) out.push({ s: BORDER_CUM[j], f });
  });
  return out;
})();
export const litAt = (s: number, f: number) => {
  let m = 0;
  for (const t of TOUCHES) {
    if (f <= t.f) continue;
    const r = LIT_V * (f - t.f) * smoothstep((f - t.f) / 6);
    m = Math.max(m, smoothstep((r - Math.abs(s - t.s)) / LIT_FEATHER + 0.5));
    if (m >= 1) break;
  }
  return m;
};

// ---------------------------------------------------------------------------
// THE CAMERA carries the previous cut's own track straight through the join:
// the base is ReuniteTheWholeThing's camAt(LAST + f) (its closing creep keeps
// running), and this cut's two moves are added as offsets that start at f0
// with zero value and zero velocity, so position AND velocity are continuous
// across the cut. Every offset is the integral of cosine-tapered velocity
// bumps (koreaShared makeTrack), C1, never at rest:
//   push  f0 -> 58    to (448, 512) k 2.75: slowly toward the border; lands
//                     ~f52, ahead of "the Chinese" (59)
//   ease  f42 -> 118  back to k 2.12 at (432, 522): the whole front, the west
//                     fords to Chosin, with the columns coming down from the
//                     top edge; still moving on the last frame
// ---------------------------------------------------------------------------
const PUSH_T = [0, 58] as const;
const EASE_T = [42, 118] as const;
export const CAM_KEYS = { push: { cx: 448, cy: 512, k: 2.75 }, ease: { cx: 432, cy: 522, k: 2.12 } };
const baseCam = (f: number) => reuniteCam(REUNITE_LAST + f);
const B_PUSH = baseCam(PUSH_T[1]);
const B_EASE = baseCam(EASE_T[1]);
const CXT = makeTrack(
  [
    [PUSH_T[0], PUSH_T[1], CAM_KEYS.push.cx - B_PUSH.cx, 1],
    [EASE_T[0], EASE_T[1], CAM_KEYS.ease.cx - CAM_KEYS.push.cx - (B_EASE.cx - B_PUSH.cx), 1],
  ],
  0,
);
const CYT = makeTrack(
  [
    [PUSH_T[0], PUSH_T[1], CAM_KEYS.push.cy - B_PUSH.cy, 1],
    [EASE_T[0], EASE_T[1], CAM_KEYS.ease.cy - CAM_KEYS.push.cy - (B_EASE.cy - B_PUSH.cy), 1],
  ],
  0,
);
const LKT = makeTrack(
  [
    [PUSH_T[0], PUSH_T[1], Math.log(CAM_KEYS.push.k / B_PUSH.k), 1],
    [EASE_T[0], EASE_T[1], Math.log(CAM_KEYS.ease.k / CAM_KEYS.push.k) - Math.log(B_EASE.k / B_PUSH.k), 1],
  ],
  0,
);
export const camAt = (f: number): Cam => {
  const b = baseCam(f);
  return { cx: b.cx + CXT(f), cy: b.cy + CYT(f), k: b.k * Math.exp(LKT(f)) };
};


// ---------------------------------------------------------------------------
// THE UN CROWD continues cut 4's. ReuniteTheWholeThing simulates its 141 dots
// as one even band of constant spacing behind the front (reuniteMotion.ts:
// carried with the front each frame, then relaxed: band edges, pairwise
// spacing, land; gaussian-smoothed in time). That simulation is bound to its
// own front, so it is re-run here LINE FOR LINE: first exactly as cut 4 runs it
// (its front, its camera, frames -40 .. LAST), which reproduces its raw state
// on its last frame, then continued from that state on THIS cut's front and
// camera. The shown crowd is cut 4's own unDotsAt(LAST + f) blended into the
// continuation over f0-10 (smoothstep), so f0 is cut 4's last frame exactly.
// ---------------------------------------------------------------------------
const SPACING_OVERSHOOT = 1.08;
const SETTLE = 120;
const RELAX = 20;
const BAND_SLACK = 1.0;
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
const nearestBand = (pts: P2[], x: number, y: number) => {
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
  const sg = behind ? 1 : -1;
  return { depth: behind ? best : -best, nx: nx * sg, ny: ny * sg };
};
type FrameGeo = { pts: P2[]; xA: number; xB: number; L: number; s: number; D: number };
/** cut 4's per-frame band geometry over frames f0..f1 of a given front + zoom */
const makeGeo = (frontOf: (f: number) => LonLat[], kOf: (f: number) => number, f0: number, f1: number) => {
  const raw: { pts: P2[]; xA: number; xB: number; L: number; s: number }[] = [];
  for (let f = f0; f <= f1; f++) {
    const pts = projectLine(frontOf(f));
    const k = kOf(f);
    const s = (SPACING * dotScreen(k)) / k;
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
    let L = 0;
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i][0] + pts[i - 1][0]) / 2;
      if (mx < a || mx > b) continue;
      L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    raw.push({ pts, xA: a, xB: b, L, s });
  }
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
  const geo: FrameGeo[] = raw.map((r, i) => ({ pts: r.pts, xA: xA[i], xB: xB[i], L: L[i], s: r.s, D: D[i] }));
  return (f: number) => geo[Math.max(0, Math.min(geo.length - 1, f - f0))];
};
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
  for (let i = 0; i < n; i++) {
    const q = nearestBand(g.pts, xs[i], ys[i]);
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
  for (let i = 0; i < n; i++) {
    const lo = g.xA + 0.4 * g.s;
    const hi = g.xB - 1.4 * g.s;
    if (xs[i] < lo) xs[i] += 0.5 * (lo - xs[i]);
    if (xs[i] > hi) xs[i] += 0.5 * (hi - xs[i]);
    if (landAt(xs[i], ys[i]) < 0.55) [xs[i], ys[i]] = seekLand(xs[i], ys[i], 1);
  }
};
const carry = (xs: Float64Array, ys: Float64Array, a: FrameGeo, b: FrameGeo) => {
  const stretch = (b.xB - b.xA) / Math.max(1e-6, a.xB - a.xA);
  for (let i = 0; i < xs.length; i++) {
    const x0 = xs[i];
    const x1 = b.xA + (x0 - a.xA) * stretch;
    xs[i] = x1;
    ys[i] += softYAt(b.pts, x1) - softYAt(a.pts, x0);
  }
};
type SimState = { xs: Float64Array; ys: Float64Array };
// 1. cut 4's own run, frames -40 .. LAST (in its numbering), to its raw last state
const R_F0 = -40;
const R_F1 = REUNITE_LAST + 12;
const R_GEO = makeGeo(reuniteFront, (f) => reuniteCam(f).k, R_F0, R_F1);
const R_SIM: SimState[] = (() => {
  const g0 = R_GEO(R_F0);
  const aspect = Math.max(1, (g0.xB - g0.xA) / Math.max(1, g0.D + BAND_GAP));
  const slots = armySlots(ARMY_COUNT, ARMY_SEED, aspect);
  const xs = new Float64Array(ARMY_COUNT);
  const ys = new Float64Array(ARMY_COUNT);
  slots.forEach(([u, v], i) => {
    xs[i] = g0.xA + (g0.xB - g0.xA) * (0.03 + 0.94 * u);
    ys[i] = softYAt(g0.pts, xs[i]) + BAND_GAP + g0.D * v;
  });
  for (let it = 0; it < SETTLE; it++) relaxStep(xs, ys, g0);
  const out: SimState[] = [{ xs: Float64Array.from(xs), ys: Float64Array.from(ys) }];
  for (let f = R_F0 + 1; f <= REUNITE_LAST; f++) {
    carry(xs, ys, R_GEO(f - 1), R_GEO(f));
    for (let it = 0; it < RELAX; it++) relaxStep(xs, ys, R_GEO(f));
    out.push({ xs: Float64Array.from(xs), ys: Float64Array.from(ys) });
  }
  return out;
})();
// 2. the continuation on this cut's front and camera (this cut's numbering)
const M_F1 = DURATION + 12;
const M_GEO = makeGeo(frontAt, (f) => camAt(f).k, -12, M_F1);
const M_SIM: SimState[] = (() => {
  const last = R_SIM[R_SIM.length - 1];
  const xs = Float64Array.from(last.xs);
  const ys = Float64Array.from(last.ys);
  const out: SimState[] = [];
  for (let f = 1; f <= M_F1; f++) {
    carry(xs, ys, M_GEO(f - 1), M_GEO(f));
    for (let it = 0; it < RELAX; it++) relaxStep(xs, ys, M_GEO(f));
    out.push({ xs: Float64Array.from(xs), ys: Float64Array.from(ys) });
  }
  return out;
})();
/** the raw band at this cut's frame f: cut 4's run for f <= 0, the continuation after */
export const simAt = (f: number): SimState => {
  if (f <= 0) return R_SIM[Math.max(0, Math.min(R_SIM.length - 1, REUNITE_LAST + f - R_F0))];
  return M_SIM[Math.min(M_SIM.length - 1, f - 1)];
};
const TAPS = [-4, -3, -2, -1, 0, 1, 2, 3, 4].map((j) => ({ j, g: Math.exp(-(j * j) / (2 * 1.5 * 1.5)) }));
const BLEND = 10;
export const unDotsAt = (f: number, k: number) => {
  const fi = Math.round(f);
  const b = smoothstep(fi / BLEND);
  const theirs = b < 1 ? reuniteDots(REUNITE_LAST + fi, k) : null;
  const out: { id: number; x: number; y: number }[] = [];
  for (let i = 0; i < ARMY_COUNT; i++) {
    let x = 0;
    let y = 0;
    let w = 0;
    for (const { j, g } of TAPS) {
      const r = simAt(fi + j);
      x += r.xs[i] * g;
      y += r.ys[i] * g;
      w += g;
    }
    // the house breath, on cut 4's frame count so its phase runs on
    const id = ARMY_SEED * 1000 + i;
    const F = REUNITE_LAST + fi;
    const a = 1.1 / k;
    x = x / w + a * Math.sin(F * (0.045 + 0.04 * hash(id, 11)) + 6.283 * hash(id, 13));
    y = y / w + a * Math.sin(F * (0.04 + 0.045 * hash(id, 12)) + 6.283 * hash(id, 14));
    if (theirs) {
      x = theirs[i].x + (x - theirs[i].x) * b;
      y = theirs[i].y + (y - theirs[i].y) * b;
    }
    out.push({ id, x, y });
  }
  return out;
};
