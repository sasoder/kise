// ---------------------------------------------------------------------------
// neolithicFront: the FRONT MODEL of the first farmers' spread over Neolithic Europe (world px of
// firstFarmersEuropeMapData.ts), the runtime half of scripts/clips/kyle-first-farmers/bake-neolithic-front.mjs.
// Read-only once animation_source/notes/MAP_READY.md exists; additions only.
//
// THE FIELD: arrivalAt(x, y) = the date farming arrives there, cal BC (bilinear on the baked 4 world-px grid); 0 =
// outside the model (Africa, Iceland); NEVER (3000) = still forager through the window (Finland, northern
// Scandinavia, the forest zone, the steppe, the pockets). The farmed region at date T is { arrivalAt >= T }: it only
// grows as T falls (monotone, and one body: the bake depression-fills from Anatolia, so no orange island ever appears
// ahead of the front). Inputs: the dated anchors in firstFarmersEuropeMapData.ts (Pinhasi, Fort & Ammerman 2005;
// Shennan 2018) and the bake's approximate model constraints.
//
// frontPaths(T, cam) -> { fill, line }: the farmed region at T in view (closed rings, even-odd) and its edge as open
//   polylines (none along the window border or the excluded land). Marching squares on the field sampled at
//   ~4-8 screen px (bicubic below the 4 px grid), every frame: ~2-6 ms. Clip fill and line to the land
//   (firstFarmersMap.tsx FarmedLand does: land mask + hatch + wash + line).
// farmedArea(T, box?) -> world px^2 of LAND farmed at T (for timing a front sweep by visible change).
// makeTimeline(dateAt, f0, f1) -> { dateAt, frameOf }: the cut's date-of-frame curve (monotone, falling BC) and its
//   inverse (extrapolated linearly beyond the ends).
// makePopulation(timeline, opts) -> { at(f, cam) }: the forager (cream) and farmer (orange) dots at frame f:
//   foragers spread thin over all the land; as the front reaches one it is ABSORBED (turns orange, ~8 frames, from
//   the frame the front line touches it) or GIVES WAY (slides ahead into a neighbour the front reaches later, over
//   land, done a few frames before the front gets there: fewer foragers ahead of the front); survivors (NEVER) and the
//   pocket groups stay. Farmers are born after the front passes (pioneers at once, the rest over ~30 frames: the
//   population grows), each sliding out of the nearest earlier dot (its parent). Every dot drifts ~1 screen px.
// ---------------------------------------------------------------------------
import { DOT_SPACING, FARMERS, FIELD, FIELD_B64, FORAGERS, LAND_B64, MERGE_ARRIVE, MERGE_YEARS, POCKETS } from "./neolithicFrontData";
import { FRAME_H, FRAME_W } from "./firstFarmersTokens";

export { POCKETS, DOT_SPACING, MERGE_YEARS, MERGE_ARRIVE };
export const NEVER = FIELD.never;
type Cam = { x: number; y: number; k: number };
type Box = { x0: number; y0: number; x1: number; y1: number };

const bytesOf = (b64: string) => {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
};
const { x0: GX0, y0: GY0, cell: CELL, cols: COLS, rows: ROWS } = FIELD;
const F16 = new Uint16Array(bytesOf(FIELD_B64).buffer);
const LANDB = bytesOf(LAND_B64);
const raw = (i: number, j: number) => (i < 0 || j < 0 || i >= COLS || j >= ROWS ? 0 : F16[j * COLS + i]);
const landCell = (i: number, j: number) => (i < 0 || j < 0 || i >= COLS || j >= ROWS ? false : ((LANDB[(j * COLS + i) >> 3] >> ((j * COLS + i) & 7)) & 1) === 1);
/** is (x, y) on land (at the 4 world-px grid)? */
export const isLandAt = (x: number, y: number) => landCell(Math.floor((x - GX0) / CELL), Math.floor((y - GY0) / CELL));
/** the arrival date of farming at (x, y), cal BC (bilinear); 0 outside the model */
export const arrivalAt = (x: number, y: number) => {
  const fx = (x - GX0) / CELL - 0.5;
  const fy = (y - GY0) / CELL - 0.5;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = fx - i;
  const w = fy - j;
  const a = raw(i, j);
  const b = raw(i + 1, j);
  const c = raw(i, j + 1);
  const d = raw(i + 1, j + 1);
  if (!a || !b || !c || !d) return raw(Math.round(fx), Math.round(fy));
  return (a * (1 - u) + b * u) * (1 - w) + (c * (1 - u) + d * u) * w;
};

// ---------------------------------------------------------------------------
// frontPaths
// ---------------------------------------------------------------------------
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
/** the field (BC; NEVER where outside) bicubic, and whether the point is excluded */
const sample = (x: number, y: number): [number, boolean] => {
  const fx = (x - GX0) / CELL - 0.5;
  const fy = (y - GY0) / CELL - 0.5;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  // excluded if any of the four nearest cells is (so the boundary with Africa / Iceland is never an interpolated edge)
  if (!raw(i, j) || !raw(i + 1, j) || !raw(i, j + 1) || !raw(i + 1, j + 1)) return [0, true];
  const u = fx - i;
  const w = fy - j;
  const g = (a: number, b: number) => raw(a, b) || NEVER;
  const row = (b: number) => cr(g(i - 1, b), g(i, b), g(i + 1, b), g(i + 2, b), u);
  // clamped to the four nearest cells: no Catmull-Rom overshoot at a pocket's rim (it would leave orange specks)
  const lo = Math.min(g(i, j), g(i + 1, j), g(i, j + 1), g(i + 1, j + 1));
  const hi = Math.max(g(i, j), g(i + 1, j), g(i, j + 1), g(i + 1, j + 1));
  return [Math.min(hi, Math.max(lo, cr(row(j - 1), row(j), row(j + 1), row(j + 2), w))), false];
};
const f2 = (v: number) => v.toFixed(2);
// corners a (top-left) 8, b (top-right) 4, c (bottom-right) 2, d (bottom-left) 1; edges 0 top, 1 right, 2 bottom, 3 left
const CORNER_EDGES = [
  [0, 3],
  [0, 1],
  [1, 2],
  [2, 3],
];
/** the farmed region at T (cal BC) inside the camera's view: { fill, line } path strings (world px) */
export const frontPaths = (T: number, cam: Cam, margin = 40): { fill: string; line: string } => {
  const k = cam.k;
  let step = CELL;
  while (step > 0.5 && step * k > 8.01) step /= 2;
  const ox = GX0 + CELL / 2;
  const oy = GY0 + CELL / 2;
  const vx0 = cam.x - (FRAME_W / 2 + margin) / k;
  const vx1 = cam.x + (FRAME_W / 2 + margin) / k;
  const vy0 = cam.y - (FRAME_H / 2 + margin) / k;
  const vy1 = cam.y + (FRAME_H / 2 + margin) / k;
  const lx0 = Math.max(ox, vx0);
  const lx1 = Math.min(ox + (COLS - 1) * CELL, vx1);
  const ly0 = Math.max(oy, vy0);
  const ly1 = Math.min(oy + (ROWS - 1) * CELL, vy1);
  if (lx1 <= lx0 || ly1 <= ly0) return { fill: "", line: "" };
  const c0 = Math.floor((lx0 - ox) / step);
  const c1 = Math.ceil((lx1 - ox) / step);
  const r0 = Math.floor((ly0 - oy) / step);
  const r1 = Math.ceil((ly1 - oy) / step);
  // lattice with a one-sample outside border (closes every ring)
  const W = c1 - c0 + 3;
  const H = r1 - r0 + 3;
  const s = new Float32Array(W * H).fill(-1);
  const sup = new Uint8Array(W * H).fill(1);
  const X = (c: number) => ox + (c0 - 1 + c) * step;
  const Y = (r: number) => oy + (r0 - 1 + r) * step;
  const direct = step === CELL;
  for (let r = 1; r < H - 1; r++)
    for (let c = 1; c < W - 1; c++) {
      const q = r * W + c;
      let v: number;
      let ex: boolean;
      if (direct) {
        const rv = raw(c0 - 1 + c, r0 - 1 + r);
        ex = rv === 0;
        v = rv;
      } else [v, ex] = sample(X(c), Y(r));
      if (ex) continue;
      sup[q] = 0;
      s[q] = v - T;
    }
  const ins = (q: number) => sup[q] === 0 && s[q] >= 0;
  // crossing point on an edge id (H: 2 q, V: 2 q + 1 where q = r W + c is its first lattice point)
  const pt = (e: number): [number, number, boolean] => {
    const q = e >> 1;
    const r = Math.floor(q / W);
    const c = q - r * W;
    const q2 = e & 1 ? q + W : q + 1;
    const a = ins(q);
    const outQ = a ? q2 : q;
    const suppressed = sup[outQ] === 1;
    let t = 0.5;
    if (!suppressed && sup[q] === 0 && sup[q2] === 0) {
      const d = s[q] - s[q2];
      // kept off the lattice points: a crossing on a corner (a value exactly at T) would make the orientation test
      // degenerate and break the ring
      t = Math.abs(d) > 1e-9 ? Math.min(0.98, Math.max(0.02, s[q] / d)) : 0.5;
    }
    return e & 1 ? [X(c), Y(r) + t * step, suppressed] : [X(c) + t * step, Y(r), suppressed];
  };
  const next = new Map<number, number>();
  for (let r = 0; r < H - 1; r++)
    for (let c = 0; c < W - 1; c++) {
      const qa = r * W + c;
      const qb = qa + 1;
      const qc = qa + W + 1;
      const qd = qa + W;
      const ia = ins(qa);
      const ib = ins(qb);
      const ic = ins(qc);
      const id = ins(qd);
      const code = (ia ? 8 : 0) | (ib ? 4 : 0) | (ic ? 2 : 0) | (id ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const edges = [2 * qa, 2 * qb + 1, 2 * qd, 2 * qa + 1]; // top, right, bottom, left
      const inside = [ia, ib, ic, id];
      const crossing = [ia !== ib, ib !== ic, id !== ic, ia !== id];
      const pairs: [number, number][] = [];
      if (code === 5 || code === 10) {
        const centre = (s[qa] + s[qb] + s[qc] + s[qd]) / 4 >= 0;
        // cut off the corners that are NOT connected through the centre
        for (let k2 = 0; k2 < 4; k2++) if (inside[k2] !== centre) pairs.push(CORNER_EDGES[k2] as [number, number]);
      } else {
        const ce = [0, 1, 2, 3].filter((k2) => crossing[k2]);
        pairs.push([ce[0], ce[1]]);
      }
      for (const [ea, eb] of pairs) {
        // orient: walking from -> to keeps the inside on the right (y down)
        const pa = pt(edges[ea]);
        const pb = pt(edges[eb]);
        // an inside corner next to this segment
        const corners: [number, number, boolean][] = [
          [X(c), Y(r), ia],
          [X(c + 1), Y(r), ib],
          [X(c + 1), Y(r + 1), ic],
          [X(c), Y(r + 1), id],
        ];
        const mx = (pa[0] + pb[0]) / 2;
        const my = (pa[1] + pb[1]) / 2;
        let best = -1;
        let bd = Infinity;
        corners.forEach((q, i) => {
          if (!q[2]) return;
          const dd = Math.hypot(q[0] - mx, q[1] - my);
          if (dd < bd) [bd, best] = [dd, i];
        });
        const [qx, qy] = corners[Math.max(0, best)];
        const cross = (pb[0] - pa[0]) * (qy - pa[1]) - (pb[1] - pa[1]) * (qx - pa[0]);
        if (cross > 0) next.set(edges[ea], edges[eb]);
        else next.set(edges[eb], edges[ea]);
      }
    }
  let fill = "";
  let line = "";
  const seen = new Set<number>();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const ring: [number, number, boolean][] = [];
    let e = start;
    for (let guard = 0; guard < 1e6; guard++) {
      if (seen.has(e)) break;
      seen.add(e);
      ring.push(pt(e));
      const n = next.get(e);
      if (n === undefined) break;
      e = n;
    }
    if (ring.length < 3) continue;
    fill += `M${ring.map((p) => `${f2(p[0])},${f2(p[1])}`).join("L")}Z`;
    // the line: runs of unsuppressed points (start after a suppressed point when there is one)
    const n = ring.length;
    let s0 = ring.findIndex((p) => p[2]);
    const closed = s0 < 0;
    if (closed) s0 = 0;
    let run = "";
    let len = 0;
    for (let i = 0; i <= n; i++) {
      const p = ring[(s0 + i) % n];
      if (p[2] || (i === n && !closed)) {
        if (len > 1) line += run;
        run = "";
        len = 0;
        continue;
      }
      run += `${len ? "L" : "M"}${f2(p[0])},${f2(p[1])}`;
      len++;
    }
    if (len > 1) line += run;
  }
  return { fill, line };
};

/** world px^2 of LAND farmed at date T (optionally inside a world box) */
export const farmedArea = (T: number, box?: Box) => {
  let n = 0;
  const i0 = box ? Math.max(0, Math.floor((box.x0 - GX0) / CELL)) : 0;
  const i1 = box ? Math.min(COLS - 1, Math.floor((box.x1 - GX0) / CELL)) : COLS - 1;
  const j0 = box ? Math.max(0, Math.floor((box.y0 - GY0) / CELL)) : 0;
  const j1 = box ? Math.min(ROWS - 1, Math.floor((box.y1 - GY0) / CELL)) : ROWS - 1;
  for (let j = j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      const v = F16[j * COLS + i];
      if (v && v >= T && landCell(i, j)) n++;
    }
  return n * CELL * CELL;
};

// ---------------------------------------------------------------------------
// timeline
// ---------------------------------------------------------------------------
export type Timeline = { dateAt: (f: number) => number; frameOf: (bc: number) => number; f0: number; f1: number };
/** dateAt must fall (BC) monotonically over [f0, f1] */
export const makeTimeline = (dateAt: (f: number) => number, f0: number, f1: number): Timeline => {
  const STEP = 0.25;
  const fs: number[] = [];
  const ds: number[] = [];
  for (let f = f0; f <= f1 + 1e-9; f += STEP) {
    fs.push(f);
    ds.push(dateAt(f));
  }
  const n = fs.length;
  const slope0 = (ds[1] - ds[0]) / STEP;
  const slope1 = (ds[n - 1] - ds[n - 2]) / STEP;
  const frameOf = (bc: number) => {
    if (bc >= ds[0]) return f0 + (bc - ds[0]) / (slope0 || -1e-6);
    if (bc <= ds[n - 1]) return f1 + (bc - ds[n - 1]) / (slope1 || -1e-6);
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (ds[m] >= bc) lo = m;
      else hi = m;
    }
    const d = ds[lo] - ds[hi];
    return fs[lo] + (d > 1e-9 ? (ds[lo] - bc) / d : 0) * STEP;
  };
  return { dateAt, frameOf, f0, f1 };
};

// ---------------------------------------------------------------------------
// population
// ---------------------------------------------------------------------------
export type DotOut = { id: number; x: number; y: number; tone: number; farmer: boolean };
export type Population = { at: (f: number, cam: Cam) => { under: DotOut[]; over: DotOut[] }; counts: { foragers: number; farmers: number; orphans: number } };
export type PopulationOpts = {
  /** frames a forager turns orange over, from the frame the front touches it */
  absorb?: number;
  /** a giving-way forager starts sliding this many frames before the front reaches it ... */
  slideLead?: number;
  /** ... and is inside its neighbour this many frames before (min slide 10 frames) */
  slideEnd?: number;
  /** pioneers (30%) are born within this many frames of the front */
  pioneerLag?: number;
  /** the rest by this many frames after it */
  fillLag?: number;
  /** frames a newborn farmer slides out of its parent */
  emerge?: number;
  /** screen px of the ambient drift */
  drift?: number;
};
const h1 = (i: number, s: number) => {
  let x = (i * 374761393 + s * 668265263) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};
const smoother = (v: number) => {
  const x = Math.max(0, Math.min(1, v));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const makePopulation = (tl: Timeline, opts: PopulationOpts = {}): Population => {
  const absorb = opts.absorb ?? 8;
  const slideLead = opts.slideLead ?? 16;
  const slideEnd = opts.slideEnd ?? 3;
  const pioneerLag = opts.pioneerLag ?? 3;
  const fillLag = opts.fillLag ?? 32;
  const emerge = opts.emerge ?? 9;
  const drift = opts.drift ?? 1.1;
  // foragers
  const NF = FORAGERS.length / 5;
  const fx = new Float64Array(NF);
  const fy = new Float64Array(NF);
  const fA = new Float64Array(NF);
  const fate = new Uint8Array(NF);
  const to = new Int32Array(NF);
  const fs = new Float64Array(NF);
  const fe = new Float64Array(NF);
  for (let i = 0; i < NF; i++) {
    fx[i] = FORAGERS[5 * i];
    fy[i] = FORAGERS[5 * i + 1];
    const A = FORAGERS[5 * i + 2];
    fate[i] = FORAGERS[5 * i + 3];
    to[i] = FORAGERS[5 * i + 4];
    fA[i] = fate[i] === 0 ? Infinity : tl.frameOf(A);
    fe[i] = fA[i] - slideEnd;
    fs[i] = Math.min(fA[i] - slideLead, fe[i] - 10);
  }
  // giving-way dots are positioned after their (later) targets: latest arrival first
  const fOrder = Array.from({ length: NF }, (_, i) => i).sort((a, b) => fA[b] - fA[a]);
  // farmers
  const NO = FARMERS.length / 4;
  const ox = new Float64Array(NO);
  const oy = new Float64Array(NO);
  const ob = new Float64Array(NO);
  for (let j = 0; j < NO; j++) {
    ox[j] = FARMERS[4 * j];
    oy[j] = FARMERS[4 * j + 1];
    const u = FARMERS[4 * j + 3] / 1000;
    const lag = u < 0.3 ? pioneerLag * (u / 0.3) : pioneerLag + (fillLag - pioneerLag) * Math.pow((u - 0.3) / 0.7, 1.3);
    ob[j] = tl.frameOf(FARMERS[4 * j + 2]) + lag;
  }
  // parents: the nearest dot born >= 3 frames earlier (a farmer, or an absorbed forager once it is orange)
  type Cand = { x: number; y: number; b: number; ref: number };
  const cands: Cand[] = [];
  for (let j = 0; j < NO; j++) cands.push({ x: ox[j], y: oy[j], b: ob[j], ref: j });
  for (let i = 0; i < NF; i++) if (fate[i] === 1 && Number.isFinite(fA[i])) cands.push({ x: fx[i], y: fy[i], b: fA[i] + absorb, ref: -1 - i });
  const PB = 32;
  const grid = new Map<string, Cand[]>();
  for (const q of cands) {
    const key = `${Math.floor(q.x / PB)},${Math.floor(q.y / PB)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(q);
  }
  const parent = new Int32Array(NO).fill(-1e9);
  let orphans = 0;
  const firstF = tl.f0 - emerge - 2;
  for (let j = 0; j < NO; j++) {
    if (ob[j] < firstF) continue; // already there at the cut's first frame
    let best: Cand | null = null;
    let bd = Infinity;
    const gx = Math.floor(ox[j] / PB);
    const gy = Math.floor(oy[j] / PB);
    for (let R = 1; R <= 4 && !best; R++)
      for (let a = gx - R; a <= gx + R; a++)
        for (let b = gy - R; b <= gy + R; b++)
          for (const q of grid.get(`${a},${b}`) ?? []) {
            if (q.b > ob[j] - 3) continue;
            const dd = Math.hypot(q.x - ox[j], q.y - oy[j]);
            if (dd < bd) [bd, best] = [dd, q];
          }
    if (!best && ob[j] >= 0)
      // nobody near was there first (an island): the nearest earlier dot anywhere (it crosses the water)
      for (const q of cands) {
        if (q.b > ob[j] - 3) continue;
        const dd = Math.hypot(q.x - ox[j], q.y - oy[j]);
        if (dd < bd) [bd, best] = [dd, q];
      }
    if (best) parent[j] = best.ref;
    else if (ob[j] >= 0) orphans++; // (born before frame 0 without a parent: simply there when the cut opens)
  }
  const oOrder = Array.from({ length: NO }, (_, j) => j).sort((a, b) => ob[a] - ob[b]);
  const px = new Float64Array(NO);
  const py = new Float64Array(NO);
  const qx = new Float64Array(NF);
  const qy = new Float64Array(NF);
  const at = (f: number, cam: Cam) => {
    const k = cam.k;
    const dr = drift / k;
    const mx = (FRAME_W / 2 + 40) / k;
    const my = (FRAME_H / 2 + 40) / k;
    const vis = (x: number, y: number) => Math.abs(x - cam.x) < mx && Math.abs(y - cam.y) < my;
    const under: DotOut[] = [];
    const over: DotOut[] = [];
    const wob = (i: number, s: number): [number, number] => {
      const w = (2 * Math.PI) / (70 + 50 * h1(i, s));
      return [dr * Math.cos(w * f + 6.283 * h1(i, s + 1)), dr * Math.sin(w * 1.3 * f + 6.283 * h1(i, s + 2))];
    };
    // foragers (base positions with drift; giving-way slides toward the target's current position)
    for (const i of fOrder) {
      const [dx, dy] = wob(i, 11);
      let x = fx[i] + dx;
      let y = fy[i] + dy;
      if (fate[i] === 2 && f >= fs[i]) {
        if (f >= fe[i]) {
          qx[i] = NaN;
          continue;
        }
        const t = to[i];
        const tx = Number.isNaN(qx[t]) ? fx[t] : qx[t];
        const ty = Number.isNaN(qy[t]) ? fy[t] : qy[t];
        const e = smoother((f - fs[i]) / (fe[i] - fs[i]));
        x += (tx - x) * e;
        y += (ty - y) * e;
        qx[i] = x;
        qy[i] = y;
        if (vis(x, y)) under.push({ id: i, x, y, tone: 0, farmer: false });
        continue;
      }
      qx[i] = x;
      qy[i] = y;
      const tone = fate[i] === 1 ? smoother((f - fA[i]) / absorb) : 0;
      if (vis(x, y)) over.push({ id: i, x, y, tone, farmer: false });
    }
    // farmers in birth order (a parent is placed before its children)
    for (const j of oOrder) {
      if (f < ob[j]) break;
      const [dx, dy] = wob(j, 29);
      let x = ox[j] + dx;
      let y = oy[j] + dy;
      const p = parent[j];
      const e = smoother((f - ob[j]) / emerge);
      if (p !== -1e9 && e < 1) {
        const sx = p >= 0 ? px[p] : qx[-1 - p];
        const sy = p >= 0 ? py[p] : qy[-1 - p];
        x = sx + (x - sx) * e;
        y = sy + (y - sy) * e;
        px[j] = x;
        py[j] = y;
        if (vis(x, y)) under.push({ id: 100000 + j, x, y, tone: 1, farmer: true });
        continue;
      }
      px[j] = x;
      py[j] = y;
      if (vis(x, y)) over.push({ id: 100000 + j, x, y, tone: 1, farmer: true });
    }
    return { under, over };
  };
  return { at, counts: { foragers: NF, farmers: NO, orphans } };
};
