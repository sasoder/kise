// Twosome: the front's roll, the two army crowds and the authored camera.
// Pure maths, no React, so the check script reads the exact same motion the
// component draws. See Twosome.tsx's header for the gestures and words.
//
// THE ARMIES use the Korea clip's one army look (ReuniteTheWholeThing's
// reuniteMotion.ts: unDotsAt / bandAt, copied here, read-only there): an even
// blue-noise band of CONSTANT DEPTH hugging the front on its own side, centre
// spacing SPACING x the dot diameter (dotScreen(k) / k), its depth solved per
// frame from the land it can stand on, carried with the front, relaxed, then
// gaussian-smoothed in time. Differences from cut 4, because this front is not
// single-valued in x (the Pusan Perimeter runs north up the Naktong, then east):
//   - depth is measured to the LAND part of the front (sea stubs never pull a
//     crowd along a coast), on the army's own side (depthInto's region test)
//   - carrying: each dot rides the displacement of its nearest front point
//     (FRONT_N points correspond one to one between frames of the morph),
//     fading with depth, so a deep dot is not dragged by a far-off stretch
//   - the ROK: a band AHEAD of the front at the 38th; as the front closes on
//     the perimeter (s 3.1 -> 3.9) the band's depth opens to the whole pocket
//     and its spacing to the pocket's even-fill spacing, so all 33 dots end
//     packed evenly inside the perimeter
import type { LonLat } from "./korea1950Fronts";
import {
  FRONT_20JUL,
  FRONT_25JUN,
  FRONT_28JUN,
  FRONT_4AUG,
  FRONT_5JUL,
  KPA_JUNE_1950,
  ROK_ARMY_JUNE_1950,
  frontThrough,
} from "./korea1950Fronts";
import {
  type Cam,
  type P2,
  type Side,
  MEN_PER_DOT,
  armySlots,
  depthInto,
  dotScreen,
  hash,
  landAt,
  makeTrack,
  pchip,
  project,
  projectLine,
  smoothstep,
} from "./koreaShared";

export const FPS = 24;
export const DURATION = 105; // round(3.699 * 24) + 16
export const LAST = DURATION - 1;
export const WORDS = { thinks: 14, twosome: 44, that: 60, heCan: 62, win: 69, thing: 79 };

// ---------------------------------------------------------------------------
// The front: frames -> days since 25 Jun 1950 -> key index -> polyline.
// ---------------------------------------------------------------------------
const KEYS: LonLat[][] = [FRONT_25JUN, FRONT_28JUN, FRONT_5JUL, FRONT_20JUL, FRONT_4AUG];
// the roll in frames, on the dated fronts: each key interval gets frames in
// proportion to the farthest its front travels (28 Jun ~40, 5 Jul ~45, 20 Jul
// ~100, the south-west sweep to 4 Aug ~130 world px), so the edge never
// outruns the close-up's speed cap. Leaves f57; 28 Jun (Seoul) f63, across the
// line on "he can"; 5 Jul (Osan) f69.5, "win"; 20 Jul (Taejon) f82, just after
// "thing"; the perimeter's line ~f99, pressing into it to f104.
const S_OF_F = pchip([
  [57, 0],
  [63, 1],
  [69.5, 2],
  [81, 3],
  [100, 3.97],
  [104, 4],
]);
export const frontS = (f: number) => S_OF_F(f);
export const frontAtF = (f: number): LonLat[] => frontThrough(KEYS, frontS(f));

// ---------------------------------------------------------------------------
// THE CAMERA: the world point (cx, cy) on screen (540, 835) at zoom k; every
// channel the integral of overlapping cosine-tapered velocity bumps (C1, no
// plateau).
//   OPEN   on the peninsula itself: its axis on x ~540, the 38th on y ~800,
//          k 1.86 creeping in to ~2.02 by f58 (the "twosome" frame: the
//          peninsula fills the width, Kyushu out)
//   GLIDE  south-east with the front f26-78 onto the Pusan pocket, landing at
//          k ~2.5 with the pocket's middle on (540, 835), ~f74
//   CREEP  f58 -> past the end: k +5 %, drifting south-east with the press;
//          still moving on f104
// ---------------------------------------------------------------------------
const P38_MID = project(127.0, 38);
export const P_POCKET = project(128.84, 35.66); // the pocket's middle (Taegu - Kyongju)
const K_OPEN = 2.3;
const K_PAIR = 2.5;
const K_LAND = 2.62;
const CX_OPEN = 525;
const CY_OPEN = P38_MID[1] + (835 - 865) / K_OPEN; // the 38th on y ~865, rising to ~800 by "twosome"
const CX_LAND = P_POCKET[0];
const CY_LAND = P_POCKET[1] - 6;
const LNK = makeTrack(
  [
    [-12, 62, Math.log(K_PAIR / K_OPEN), 1],
    [30, 80, Math.log(K_LAND / K_PAIR), 1],
    [58, 150, Math.log(1.05), 1],
  ],
  Math.log(K_OPEN),
);
const CX = makeTrack(
  [
    [32, 80, CX_LAND - CX_OPEN, 0.8],
    [58, 150, 4, 1],
  ],
  CX_OPEN,
);
const CY = makeTrack(
  [
    [-12, 62, 12, 1],
    [32, 80, CY_LAND - CY_OPEN - 12, 0.8],
    [58, 150, 8, 1],
  ],
  CY_OPEN,
);
export const camAt = (f: number): Cam => ({ cx: CX(f), cy: CY(f), k: Math.exp(LNK(f)) });
export const CAM_END = camAt(LAST);

// ---------------------------------------------------------------------------
// THE ARMIES
// ---------------------------------------------------------------------------
export const KPA_COUNT = Math.round(KPA_JUNE_1950 / MEN_PER_DOT); // 45
export const ROK_COUNT = Math.round(ROK_ARMY_JUNE_1950 / MEN_PER_DOT); // 33
export const SPACING = 1.3; // centre spacing, dot diameters
const SPACING_OVERSHOOT = 1.0;
const LOOSE = 1.3;
const HUG = 0.06; // world px per relax step // area spacing / minimum spacing
const MIN_ROWS = 2.6; // the band is never shallower than this many rows
const SIM_F0 = -40;
const SIM_F1 = LAST + 12;
const RELAX = 20;
const SETTLE = 140;
const D_CAP = 170; // world px: the whole pocket fits
/** the KPA's gap to the line: it masses onto the 38th f4-30 */
export const kpaGap = (f: number) => 5 + 26 * (1 - smoothstep((f - 4) / 26));
const ROK_GAP = 5;
/** the ROK's switch from band to pocket fill, on the front's key index */
export const pocketW = (f: number) => smoothstep((frontS(f) - 1.9) / 1.2);

type Geo = {
  pts: P2[]; // the whole projected front
  prev: P2[]; // last frame's, for carrying
  segs: number[]; // indices i of land segments (pts[i-1] -> pts[i])
  k: number;
  /** per army side: the land segments that also have ground on that side
   *  22 and 40 world px out (the Han estuary never strands a crowd), cached */
  sideSegs: Partial<Record<Side, number[]>>;
};
const segsFor = (g: Geo, side: Side) => {
  const hit = g.sideSegs[side];
  if (hit) return hit;
  const sg = side === "north" ? 1 : -1;
  const out = g.segs.filter((i) => {
    const [ax, ay] = g.pts[i - 1];
    const [cx, cy] = g.pts[i];
    const L = Math.hypot(cx - ax, cy - ay) || 1;
    const nx = ((cy - ay) / L) * sg;
    const ny = (-(cx - ax) / L) * sg;
    const mx = (ax + cx) / 2;
    const my = (ay + cy) / 2;
    return landAt(mx + nx * 22, my + ny * 22) >= 0.5 && landAt(mx + nx * 40, my + ny * 40) >= 0.5;
  });
  g.sideSegs[side] = out.length ? out : g.segs;
  return g.sideSegs[side]!;
};
const GEO: Geo[] = (() => {
  const out: Geo[] = [];
  let prev = projectLine(frontAtF(SIM_F0));
  for (let f = SIM_F0; f <= SIM_F1; f++) {
    const pts = projectLine(frontAtF(f));
    // the land front: runs of segments over land, each >= 40 world px long
    // (a stub brushing the south-west islands never counts)
    const segs: number[] = [];
    let run: number[] = [];
    let runLen = 0;
    const flush = () => {
      if (runLen >= 40) segs.push(...run);
      run = [];
      runLen = 0;
    };
    for (let i = 1; i < pts.length; i++) {
      const mx = (pts[i][0] + pts[i - 1][0]) / 2;
      const my = (pts[i][1] + pts[i - 1][1]) / 2;
      // the front runs through land, not along a coast: land on both sides
      const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 1;
      const nx = (pts[i][1] - pts[i - 1][1]) / L;
      const ny = -(pts[i][0] - pts[i - 1][0]) / L;
      const inland = landAt(mx + nx * 9, my + ny * 9) >= 0.5 && landAt(mx - nx * 9, my - ny * 9) >= 0.5;
      if (landAt(mx, my) >= 0.5 && inland) {
        run.push(i);
        runLen += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      } else flush();
    }
    flush();
    out.push({ pts, prev, segs, k: camAt(f).k, sideSegs: {} });
    prev = pts;
  }
  return out;
})();
const geo = (f: number) => GEO[Math.max(0, Math.min(GEO.length - 1, Math.round(f) - SIM_F0))];

/** nearest point on the land part of the front: distance, the unit normal
 *  toward `side`, and the fractional front index there */
const nearestLand = (g: Geo, x: number, y: number, side: Side) => {
  const segs = segsFor(g, side);
  let best = Infinity;
  let bx = x;
  let by = y;
  let bi = 1;
  let bt = 0;
  let bj = 0;
  for (let j = 0; j < segs.length; j++) {
    const i = segs[j];
    const [ax, ay] = g.pts[i - 1];
    const [cx, cy] = g.pts[i];
    const dx = cx - ax;
    const dy = cy - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    const d = Math.hypot(x - qx, y - qy);
    if (d < best) [best, bx, by, bi, bt, bj] = [d, qx, qy, i, t, j];
  }
  // past a run's end? (the band must not spill round the end of its line)
  const [ax, ay] = g.pts[bi - 1];
  const [cx, cy] = g.pts[bi];
  const L = Math.hypot(cx - ax, cy - ay) || 1;
  const tx = (cx - ax) / L;
  const ty = (cy - ay) / L;
  let beyond = 0;
  let bux = 0;
  let buy = 0;
  const runStart = bj === 0 || segs[bj - 1] !== bi - 1;
  const runEnd = bj === segs.length - 1 || segs[bj + 1] !== bi + 1;
  if (bt <= 0 && runStart) {
    beyond = -((x - ax) * tx + (y - ay) * ty);
    [bux, buy] = [tx, ty]; // back along the line
  } else if (bt >= 1 && runEnd) {
    beyond = (x - cx) * tx + (y - cy) * ty;
    [bux, buy] = [-tx, -ty];
  }
  const s2 = side === "north" ? 1 : -1;
  // the segment normal toward `side` (north = (ty, -tx) W -> E): used for
  // the band's edges, so a dot past a run's end is not pushed radially
  const snx = ty * s2;
  const sny = -tx * s2;
  const own = depthInto(x, y, g.pts, side) >= 0;
  const sg = own ? 1 : -1;
  let nx = best > 1e-6 ? ((x - bx) / best) * sg : snx;
  let ny = best > 1e-6 ? ((y - by) / best) * sg : sny;
  if (beyond > 0) [nx, ny] = [snx, sny];
  return { depth: own ? best : -best, nx, ny, idx: bi - 1 + bt, beyond, bux, buy };
};

/** a step toward the nearest land (reuniteMotion's seekLand) */
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

/** own-side land within [gap, gap + D] of the land front, sampled on a 3 px grid:
 *  the sorted depths of its cells (each cell 9 world px^2) */
const bandCells = (g: Geo, side: Side, gap: number) => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const i of g.segs)
    for (const p of [g.pts[i - 1], g.pts[i]]) {
      x0 = Math.min(x0, p[0]);
      x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]);
      y1 = Math.max(y1, p[1]);
    }
  const pad = gap + D_CAP;
  const ds: number[] = [];
  for (let y = y0 - pad; y <= y1 + pad; y += 3)
    for (let x = x0 - pad; x <= x1 + pad; x += 3) {
      if (landAt(x, y) < 0.5) continue;
      const q = nearestLand(g, x, y, side);
      if (q.depth >= gap && q.depth <= gap + D_CAP) ds.push(q.depth - gap);
    }
  ds.sort((a, b) => a - b);
  return ds;
};

type ArmyDef = {
  count: number;
  seed: number;
  side: Side;
  gap: (f: number) => number;
  /** 0..1: how far the crowd has been driven into the Pusan pocket (ROK only) */
  fill: (f: number) => number;
};
/** the pocket: the land ahead of (south of) the 4 Aug perimeter */
const G_END = GEO[GEO.length - 1];
type Sim = { xs: Float64Array; ys: Float64Array }[];
type Band = { D: number; s: number };

const pocketCache = new Map<number, number>();
/** the even-fill spacing of A's crowd over the whole pocket (world px) */
const S_POCKET = (A: ArmyDef) => {
  const hit = pocketCache.get(A.count);
  if (hit) return hit;
  const cells = bandCells(G_END, "south", A.gap(LAST)).length;
  const v = Math.sqrt((cells * 9) / (A.count * 0.866)) * 0.94;
  pocketCache.set(A.count, v);
  return v;
};
const simulate = (A: ArmyDef): { sim: Sim; band: Band[] } => {
  // the band per frame: depth D and spacing s (solved every 3rd frame, then
  // interpolated and smoothed: a coast crossing never lurches)
  const nF = SIM_F1 - SIM_F0 + 1;
  const Draw: number[] = new Array(nF).fill(0);
  const Sraw: number[] = new Array(nF).fill(0);
  const solveAt = (fi: number) => {
    const f = SIM_F0 + fi;
    const g = GEO[fi];
    const s0 = (SPACING * dotScreen(g.k)) / g.k;
    const ds = bandCells(g, A.side, A.gap(f));
    // THE BAND. Cut 4's rule (spacing 1.3 dot diameters, depth solved from
    // the land length) puts 45 dots on the 280 world px 38th in ~1.1 rows: a
    // string. So the band is never shallower than MIN_ROWS rows: its depth D
    // and its spacing sA are solved together over the land behind the line
    // (N hex cells 0.866 sA^2 fill the band's land area, D = MIN_ROWS x
    // 0.866 sA). The relax holds sA as a soft radius and sA / LOOSE (>= 1.3
    // diameters) as the hard minimum, so the crowd is blue noise, not a lattice.
    const cellsWithin = (D: number) => {
      let c = 0;
      while (c < ds.length && ds[c] <= D) c++;
      return c;
    };
    const sOf = (D: number) => Math.sqrt((Math.max(1, cellsWithin(D)) * 9) / (A.count * 0.866));
    let lo = 1;
    let hi = D_CAP;
    for (let it = 0; it < 18; it++) {
      const m = (lo + hi) / 2;
      if (m >= MIN_ROWS * 0.866 * sOf(m)) hi = m;
      else lo = m;
    }
    const Dband = Math.max(hi, ds.length ? ds[Math.min(ds.length - 1, Math.ceil((A.count * 0.866 * s0 * s0) / 9))] : 20);
    const sA = Math.max(s0, sOf(Dband));
    // fill: the pocket's even-fill spacing, from its land area
    const w = A.fill(f);
    const sAf = sA + (Math.max(sA, S_POCKET(A)) - sA) * w;
    Draw[fi] = Dband;
    Sraw[fi] = sAf;
  };
  const STEP = 3;
  for (let fi = 0; fi < nF; fi += STEP) solveAt(fi);
  solveAt(nF - 1);
  for (let fi = 0; fi < nF; fi++) {
    if (fi % STEP === 0 || fi === nF - 1) continue;
    const a = fi - (fi % STEP);
    const b = Math.min(nF - 1, a + STEP);
    const u = (fi - a) / (b - a);
    Draw[fi] = Draw[a] + (Draw[b] - Draw[a]) * u;
    Sraw[fi] = Sraw[a] + (Sraw[b] - Sraw[a]) * u;
  }
  const sm = (arr: number[], sig: number) =>
    arr.map((_, i) => {
      let sum = 0;
      let w = 0;
      for (let j = -3 * sig; j <= 3 * sig; j++) {
        const g = Math.exp(-(j * j) / (2 * sig * sig));
        sum += arr[Math.max(0, Math.min(arr.length - 1, i + j))] * g;
        w += g;
      }
      return sum / w;
    });
  const D = sm(Draw, 3);
  const S = sm(Sraw, 3);
  const band: Band[] = D.map((d, i) => ({ D: d, s: S[i] }));

  const n = A.count;
  const D_END = band[band.length - 1].D;
  const relax = (xs: Float64Array, ys: Float64Array, fi: number) => {
    const g = GEO[fi];
    const f = SIM_F0 + fi;
    const gap = A.gap(f);
    const { D: Dd, s: s1 } = band[fi];
    const wFill = A.fill(f);
    const wAtt = smoothstep((frontS(f) - 2.0) / 1.2)
    // gentle while stranded dots walk in from a vanished stretch of front;
    // firm once the line has settled, so the band spreads along it evenly
    const pullCap = 0.45 + 0.35 * smoothstep((frontS(f) - 3.3) / 0.4);
    const sSoft = s1;
    const s = Math.max((SPACING * dotScreen(g.k)) / g.k, s1 / LOOSE) * SPACING_OVERSHOOT;
    // 1. the band's edges, measured to the land front; then land
    for (let i = 0; i < n; i++) {
      const q = nearestLand(g, xs[i], ys[i], A.side);
      // capped per step, so a dot stranded when its stretch of front leaves
      // land marches to the band instead of jumping (<= 20 x 0.7 world px / f)
      if (q.depth < gap) {
        const m = Math.min(gap - q.depth, 1.6);
        xs[i] += q.nx * m;
        ys[i] += q.ny * m;
      } else if (q.depth > gap + Dd && wFill < 1) {
        const m = Math.min(0.5 * (q.depth - gap - Dd), pullCap) * (1 - wFill);
        xs[i] -= q.nx * m;
        ys[i] -= q.ny * m;
      }
      // hug: a light drift toward the front (the soft repulsion spreads the
      // crowd back out through its band), so the band fills from the line out
      if (q.depth > gap + 0.5 && wFill < 1) {
        const m = Math.min(q.depth - gap, HUG) * (1 - wFill);
        xs[i] -= q.nx * m;
        ys[i] -= q.ny * m;
      }
      // the band's ends: a dot past the end of its line steps back along it
      if (q.beyond > 0) {
        const m = Math.min(0.5 * q.beyond, 1.2);
        xs[i] += q.bux * m;
        ys[i] += q.buy * m;
      }
      // the perimeter draws the KPA's far stretches in early, behind the
      // front, so nobody is left to sprint along the south coast at the end
      if (A.side === "north" && wAtt > 0) {
        const q4 = nearestLand(G_END, xs[i], ys[i], "north");
        const over = q4.depth - (gap + D_END);
        if (over > 0) {
          const m = Math.min(0.5 * over, 0.3 * wAtt);
          xs[i] -= q4.nx * m;
          ys[i] -= q4.ny * m;
        }
      }
      // the pocket draws the ROK in ahead of the front (it is always ahead)
      if (wFill > 0) {
        const q4 = nearestLand(G_END, xs[i], ys[i], A.side);
        if (q4.depth < gap) {
          const m = Math.min(gap - q4.depth, 0.6 * wFill);
          xs[i] += q4.nx * m;
          ys[i] += q4.ny * m;
        }
      }
      // (a straggler walking in from a vanished stretch may cut across a bay)
      if (q.depth <= gap + Dd + 8 && landAt(xs[i], ys[i]) < 0.62) [xs[i], ys[i]] = seekLand(xs[i], ys[i], 2.5);
    }
    // 2. pairwise spacing: hard at the minimum s, and a soft repulsion out to
    //    LOOSE x s that spreads the crowd through its band without locking it
    //    into a lattice
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const ex = xs[j] - xs[i];
        const ey = ys[j] - ys[i];
        if (Math.abs(ex) >= sSoft || Math.abs(ey) >= sSoft) continue;
        const d = Math.hypot(ex, ey);
        if (d >= sSoft) continue;
        const c = d < s ? (0.5 * (s - d)) / (d || 1e-6) : (0.5 * 0.1 * (sSoft - d)) / d;
        const ux = d > 1e-6 ? ex : Math.cos(i * 2.4) * 1e-3;
        const uy = d > 1e-6 ? ey : Math.sin(i * 2.4) * 1e-3;
        const g = d < s ? 0.7 : 1;
        xs[i] -= ux * c * g;
        ys[i] -= uy * c * g;
        xs[j] += ux * c * g;
        ys[j] += uy * c * g;
      }
    }
    // 3. a light land step, so spacing pressure never parks a dot at sea
    for (let i = 0; i < n; i++) if (landAt(xs[i], ys[i]) < 0.55) [xs[i], ys[i]] = seekLand(xs[i], ys[i], 1);
  };

  // opening crowd: blue-noise slots laid along the land front, settled
  const g0 = GEO[0];
  const slots = armySlots(n, A.seed, 6);
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const segs = g0.segs;
  slots.forEach(([u, v], i) => {
    const si = segs[Math.min(segs.length - 1, Math.floor(u * segs.length))];
    const [ax, ay] = g0.pts[si - 1];
    const [cx, cy] = g0.pts[si];
    const L = Math.hypot(cx - ax, cy - ay) || 1;
    const sg = A.side === "north" ? 1 : -1;
    const nx = ((cy - ay) / L) * sg;
    const ny = (-(cx - ax) / L) * sg;
    const d = A.gap(SIM_F0) + band[0].D * v;
    xs[i] = (ax + cx) / 2 + nx * d;
    ys[i] = (ay + cy) / 2 + ny * d;
  });
  for (let it = 0; it < SETTLE; it++) relax(xs, ys, 0);
  const sim: Sim = [{ xs: Float64Array.from(xs), ys: Float64Array.from(ys) }];
  for (let fi = 1; fi < nF; fi++) {
    const g = GEO[fi];
    // carry: each dot rides its nearest front point's displacement, fading with depth
    for (let i = 0; i < n; i++) {
      const q = nearestLand(GEO[fi - 1], xs[i], ys[i], A.side);
      const i0 = Math.max(0, Math.min(g.pts.length - 2, Math.floor(q.idx)));
      const t = q.idx - i0;
      const dx = (1 - t) * (g.pts[i0][0] - g.prev[i0][0]) + t * (g.pts[i0 + 1][0] - g.prev[i0 + 1][0]);
      const dy = (1 - t) * (g.pts[i0][1] - g.prev[i0][1]) + t * (g.pts[i0 + 1][1] - g.prev[i0 + 1][1]);
      // (fading with depth: a deep dot is not dragged by a far-off stretch)
      const w = Math.exp(-Math.max(0, q.depth) / 70);
      xs[i] += dx * w;
      ys[i] += dy * w;
    }
    for (let it = 0; it < RELAX; it++) relax(xs, ys, fi);
    // the recorded position is always ashore (the relax state may sit a hair
    // off a coast); the time smoothing then irons the step out
    const rx = Float64Array.from(xs);
    const ry = Float64Array.from(ys);
    for (let i = 0; i < n; i++) for (let it = 0; it < 8 && landAt(rx[i], ry[i]) < 0.62; it++) [rx[i], ry[i]] = seekLand(rx[i], ry[i], 2);
    sim.push({ xs: rx, ys: ry });
  }
  return { sim, band };
};

export const KPA_DEF: ArmyDef = { count: KPA_COUNT, seed: 1, side: "north", gap: kpaGap, fill: () => 0 };
export const ROK_DEF: ArmyDef = { count: ROK_COUNT, seed: 2, side: "south", gap: () => ROK_GAP, fill: pocketW };
const KPA_SIM = simulate(KPA_DEF);
const ROK_SIM = simulate(ROK_DEF);

// ROK arrival: each dot fades in over 12 f from its own start (f26-40) while
// closing 16 world px up from the south onto its slot
export const ROK_ENTER = { f0: 26, dur: 12, spread: 14, dist: 16 };

const SMOOTH_SIG = 2.2;
const TAPS = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map((j) => ({ j, g: Math.exp(-(j * j) / (2 * SMOOTH_SIG * SMOOTH_SIG)) }));
export type Dot = { id: number; x: number; y: number; op: number };
const dotsOf = (S: { sim: Sim; band: Band[] }, A: ArmyDef, f: number, k: number, enter?: typeof ROK_ENTER): Dot[] => {
  const fi = Math.round(f);
  const out: Dot[] = [];
  for (let i = 0; i < A.count; i++) {
    let x = 0;
    let y = 0;
    let w = 0;
    for (const { j, g } of TAPS) {
      const r = S.sim[Math.max(0, Math.min(S.sim.length - 1, fi + j - SIM_F0))];
      x += r.xs[i] * g;
      y += r.ys[i] * g;
      w += g;
    }
    x /= w;
    y /= w;
    // a fixed per-dot offset (0.26 x the band's spacing, hashed): a relaxed
    // crowd settles toward a lattice, and a lattice reads as rows; this keeps
    // it blue noise without moving any dot from frame to frame
    {
      const sp = S.band[Math.max(0, Math.min(S.band.length - 1, fi - SIM_F0))].s;
      const a = 6.283 * hash(A.seed * 71 + i, 21);
      const r = 0.26 * sp * Math.sqrt(hash(A.seed * 71 + i, 22));
      x += r * Math.cos(a);
      y += r * Math.sin(a);
    }
    // the time smoothing is two-sided, so at a launch it would lead the front:
    // a soft hold (C1 in depth) keeps every dot on its own side of this
    // frame's whole line, measured to the full front, not its land runs
    {
      const pts = geo(fi).pts;
      const d = depthInto(x, y, pts, A.side);
      const minD = 0.5 * A.gap(fi);
      const soft = 2.5;
      if (d < minD + 4 * soft) {
        const u = (d - minD) / soft;
        const target = minD + soft * (u > 30 ? u : Math.log1p(Math.exp(u)));
        let best = Infinity;
        let nx = 0;
        let ny = 0;
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1];
          const [bx, by] = pts[i];
          const dx = bx - ax;
          const dy = by - ay;
          const l2 = dx * dx + dy * dy || 1e-9;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
          const dd = Math.hypot(x - ax - t * dx, y - ay - t * dy);
          if (dd < best) {
            best = dd;
            const L = Math.sqrt(l2);
            const sg = A.side === "north" ? 1 : -1;
            nx = (dy / L) * sg;
            ny = (-dx / L) * sg;
          }
        }
        x += nx * (target - d);
        y += ny * (target - d);
      }
    }
    // never drawn at sea (a smoothed path can cut a bay the simulation walked round)
    for (let it = 0; it < 8 && landAt(x, y) < 0.4; it++) [x, y] = seekLand(x, y, 2);
    let op = 1;
    if (enter) {
      const t0 = enter.f0 + enter.spread * hash(A.seed * 53 + i, 6);
      const e = smoothstep((fi - t0) / enter.dur);
      op = e;
      // approaching from the south, over land only (no dot rises out of the sea)
      const lw = smoothstep((landAt(x, y + enter.dist) - 0.4) / 0.3);
      y += enter.dist * lw * (1 - Math.sin((Math.PI / 2) * e));
    }
    const id = A.seed * 1000 + i;
    const w1 = 0.045 + 0.04 * hash(id, 11);
    const w2 = 0.04 + 0.045 * hash(id, 12);
    const a = 1.1 / k;
    out.push({ id, op, x: x + a * Math.sin(fi * w1 + 6.283 * hash(id, 13)), y: y + a * Math.sin(fi * w2 + 6.283 * hash(id, 14)) });
  }
  return out;
};
/** a light final spacing pass on the drawn crowd (smooth kernel, Jacobi, a
 *  soft land brake): the draw-time holds (own side, off the sea) can bring two
 *  dots together; this parts them without a per-frame kick */
const partDrawn = (dots: Dot[], k: number) => {
  const s = (1.3 * dotScreen(k)) / k;
  const R = s * 1.1;
  for (let it = 0; it < 6; it++) {
    const fx = new Float64Array(dots.length);
    const fy = new Float64Array(dots.length);
    for (let a = 0; a < dots.length; a++)
      for (let b = a + 1; b < dots.length; b++) {
        const dx = dots[b].x - dots[a].x;
        const dy = dots[b].y - dots[a].y;
        const d = Math.hypot(dx, dy);
        if (d >= R) continue;
        const t = 6.283 * hash(a * 97 + b, 9);
        const ux = d > 1e-4 ? dx / d : Math.cos(t);
        const uy = d > 1e-4 ? dy / d : Math.sin(t);
        const q = (R - d) / R;
        const m = 0.3 * R * q * q * (1.5 - 0.5 * q);
        fx[a] -= ux * m;
        fy[a] -= uy * m;
        fx[b] += ux * m;
        fy[b] += uy * m;
      }
    dots.forEach((d, i) => {
      const brake = smoothstep((landAt(d.x + fx[i], d.y + fy[i]) - 0.35) / 0.3);
      d.x += fx[i] * brake;
      d.y += fy[i] * brake;
    });
  }
  return dots;
};
/** the KPA's 45 dots at frame f (world px), with the house breath at zoom k */
export const kpaDotsAt = (f: number, k: number) => partDrawn(dotsOf(KPA_SIM, KPA_DEF, f, k), k);
/** the ROK's 33 dots at frame f (world px); op carries the staggered arrival */
export const rokDotsAt = (f: number, k: number) => partDrawn(dotsOf(ROK_SIM, ROK_DEF, f, k, ROK_ENTER), k);
/** the bands at frame f (for checks): depth D and spacing s, world px */
export const bandsAt = (f: number) => {
  const fi = Math.max(0, Math.min(SIM_F1 - SIM_F0, Math.round(f) - SIM_F0));
  return { kpa: KPA_SIM.band[fi], rok: ROK_SIM.band[fi], land: geo(f).segs.length };
};
