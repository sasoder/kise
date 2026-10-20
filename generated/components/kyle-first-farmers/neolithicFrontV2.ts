// ---------------------------------------------------------------------------
// neolithicFrontV2: the V2 variant of neolithicFront.ts for OutcompeteEuropeV2 (cold-review pass; the original
// stays as cut 92 and cut F import it). Differences: neolithicFrontDataV2.ts (one core at Catalhoyuk; pocket
// clearings that hug their crowds, valued POCKET, ringed by the front line), the PLOUGH (foragers ahead of the front
// are pushed downhill, away from the farmers, into a band ~2x denser that moves with it, and each is caught where the
// front closes on it: opts.retreat = d world px), no farmer born on a caught forager, and fate 3: a forager near a
// pocket flees into it (a refugee slot) as the front comes.
//
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
import { DOT_SPACING, FARMERS, FIELD, FIELD_B64, FORAGERS, LAND_B64, MERGE_ARRIVE, MERGE_YEARS, POCKET, POCKETS, POCKET_MEMBERS, POCKET_R, POCKET_SM, SLOTS } from "./neolithicFrontDataV2";
import { FRAME_H, FRAME_W } from "./firstFarmersTokens";

export { POCKETS, DOT_SPACING, MERGE_YEARS, MERGE_ARRIVE, POCKET };
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
// the pocket clearings: a smooth blob round each crowd (soft-min of the distances to its members, minus POCKET_R),
// blended into the field over POCKET_W world px, so the farmed land's edge round a pocket is organic (no grid steps)
// ---------------------------------------------------------------------------
const POCKET_W = 5;
const NM = POCKET_MEMBERS.length / 2;
let PBX0 = Infinity;
let PBY0 = Infinity;
let PBX1 = -Infinity;
let PBY1 = -Infinity;
for (let m = 0; m < NM; m++) {
  PBX0 = Math.min(PBX0, POCKET_MEMBERS[2 * m] - 60);
  PBX1 = Math.max(PBX1, POCKET_MEMBERS[2 * m] + 60);
  PBY0 = Math.min(PBY0, POCKET_MEMBERS[2 * m + 1] - 60);
  PBY1 = Math.max(PBY1, POCKET_MEMBERS[2 * m + 1] + 60);
}
// members bucketed on a coarse grid (numeric keys) for a quick lookup
const PG = 30;
const PCOLS = Math.ceil((PBX1 - PBX0) / PG) + 1;
const PROWS = Math.ceil((PBY1 - PBY0) / PG) + 1;
const PCELLS: number[][] = Array.from({ length: PCOLS * PROWS }, () => []);
for (let m = 0; m < NM; m++) PCELLS[Math.floor((POCKET_MEMBERS[2 * m + 1] - PBY0) / PG) * PCOLS + Math.floor((POCKET_MEMBERS[2 * m] - PBX0) / PG)].push(m);
/** signed distance to the pocket clearings (negative inside), world px; 1e9 far from any */
export const pocketSD = (x: number, y: number) => {
  if (x < PBX0 || x > PBX1 || y < PBY0 || y > PBY1) return 1e9;
  const gx = Math.floor((x - PBX0) / PG);
  const gy = Math.floor((y - PBY0) / PG);
  let acc = 0;
  for (let b = Math.max(0, gy - 1); b <= Math.min(PROWS - 1, gy + 1); b++)
    for (let a = Math.max(0, gx - 1); a <= Math.min(PCOLS - 1, gx + 1); a++)
      for (const m of PCELLS[b * PCOLS + a]) {
        const d = Math.hypot(POCKET_MEMBERS[2 * m] - x, POCKET_MEMBERS[2 * m + 1] - y);
        acc += Math.exp(-d / POCKET_SM);
      }
  return acc > 1e-12 ? -POCKET_SM * Math.log(acc) - POCKET_R : 1e9;
};
const pocketBlend = (x: number, y: number, v: number) => {
  const sd = pocketSD(x, y);
  if (sd > POCKET_W) return v;
  const p = Math.max(0, Math.min(1, sd / POCKET_W + 0.5));
  return NEVER + (v - NEVER) * p;
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
  const pk = new Uint8Array(W * H); // a pocket clearing: outside, and no line drawn along it
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
        if (rv === POCKET) pk[q] = 1;
      } else {
        [v, ex] = sample(X(c), Y(r));
        if (raw(Math.round((X(c) - GX0) / CELL - 0.5), Math.round((Y(r) - GY0) / CELL - 0.5)) === POCKET) pk[q] = 1;
      }
      if (ex) continue;
      sup[q] = 0;
      s[q] = pocketBlend(X(c), Y(r), v) - T;
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
    const suppressed = sup[outQ] === 1; // (pocket clearings keep the line: a crisp orange ring)
    let t = 0.5;
    if (sup[outQ] === 0 && sup[q] === 0 && sup[q2] === 0) {
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
export type DotOut = { id: number; x: number; y: number; tone: number; farmer: boolean; s?: number };
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
  /** frames added to a pioneer's birth (negative: it sets out from its parent before the front reaches its place) */
  pioneerShift?: number;
  /** the fraction of farmers born with the front (pioneers; default 0.3) */
  pioneers?: number;
  /** from this arrival frame on (the fast wide end), births are quicker: lateFill frames, latePioneers fraction */
  lateFrom?: number;
  lateFill?: number;
  latePioneers?: number;
  /** a farmer dot's size relative to a forager's (a caught forager shrinks to it as it turns) */
  farmerSize?: number;
  /** frames a newborn farmer slides out of its parent */
  emerge?: number;
  /** screen px of the ambient drift */
  drift?: number;
  /** the plough's d, world px: foragers ahead squeeze into a band ~2x denser that moves with the front, and each is
   *  caught 2d past its own place (0 = none) */
  retreat?: number;
  /** (unused since the plough; kept for the r1 call sites) */
  retreatLead?: number;
  /** frames before the front reaches it that a refugee starts for its pocket */
  fleeLead?: number;
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
  const retreat = opts.retreat ?? 11;
  const fleeLead = opts.fleeLead ?? 26;
  const fSize = opts.farmerSize ?? 1;
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
    fs[i] = Math.min(fA[i] - (fate[i] === 3 ? fleeLead : slideLead), fe[i] - (fate[i] === 3 ? 14 : 10));
  }
  // THE PLOUGH: every forager the front will reach is pushed ahead of it. With s = its distance ahead of the front
  // (world px, from its own arrival date and the local slope of the field) and L = d, its shift downhill (away from
  //   the farmers) is (L - s) / 2 for -L < s < L (corner softened): everything from 2L ahead of the edge to the edge
  //   sits in a band L wide just ahead of it, twice as dense, moving with it; at s = -L the front closes on the dot:
  //   it is caught there (shift L) and turns orange. Nothing beyond L ahead moves.
  const plough = retreat; // d, world px
  const nx = new Float64Array(NF);
  const ny = new Float64Array(NF);
  const gA = new Float64Array(NF); // years per world px
  const dI = new Float64Array(NF); // this dot's d (smaller near a coast)
  const rA = new Float64Array(NF); // frame the front catches it
  for (let i = 0; i < NF; i++) {
    rA[i] = fA[i];
    if (fate[i] === 0 || !Number.isFinite(fA[i]) || plough <= 0) continue;
    const e = 5;
    const gx = arrivalAt(fx[i] + e, fy[i]) - arrivalAt(fx[i] - e, fy[i]);
    const gy = arrivalAt(fx[i], fy[i] + e) - arrivalAt(fx[i], fy[i] - e);
    const gl = Math.hypot(gx, gy);
    if (gl < 1e-6) continue;
    nx[i] = -gx / gl;
    ny[i] = -gy / gl;
    let d = plough;
    for (let t = 0; t < 4 && d > 0.5; t++) {
      if (isLandAt(fx[i] + nx[i] * d, fy[i] + ny[i] * d)) break;
      d /= 2;
    }
    // the secant slope between its place and where it is caught: the linear plough then meets the real front at both
    // ends (the dot is caught exactly when the front's edge reaches it)
    const aEnd = arrivalAt(fx[i] + nx[i] * d, fy[i] + ny[i] * d);
    const A0 = FORAGERS[5 * i + 2];
    gA[i] = aEnd > NEVER + 1 && A0 - aEnd > 1 ? (A0 - aEnd) / d : gl / (2 * e);
    dI[i] = d;
    rA[i] = tl.frameOf(A0 - d * gA[i]);
    // pushed into a pocket's clearing: it stays a forager there (joins the group), it is never caught
    if (fate[i] === 1 && pocketSD(fx[i] + nx[i] * d, fy[i] + ny[i] * d) < 2) rA[i] = Infinity;
  }
  const shiftAt = (i: number, T: number) => {
    const L = dI[i];
    if (L <= 0) return 0;
    const sAhead = (T - FORAGERS[5 * i + 2]) / gA[i];
    const x = (L - sAhead) / L; // 0 at the band's back, 2 where the front catches it
    const e = 0.18;
    return Math.min(L, 0.25 * L * (x + Math.sqrt(x * x + e * e)));
  };
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
    const fAj = tl.frameOf(FARMERS[4 * j + 2]);
    const late = opts.lateFrom !== undefined && fAj >= opts.lateFrom;
    const pf = late ? (opts.latePioneers ?? 0.7) : (opts.pioneers ?? 0.3);
    const fl = late ? (opts.lateFill ?? 8) : fillLag;
    // pioneers leave their parent a little BEFORE the front reaches their place (pioneerShift < 0), so they arrive with
    // the edge: the farmers keep up with a fast front instead of trailing an empty strip of hatch
    const lag = u < pf ? (opts.pioneerShift ?? 0) + pioneerLag * (u / pf) : pioneerLag + (fl - pioneerLag) * Math.pow((u - pf) / (1 - pf), 1.3);
    ob[j] = tl.frameOf(FARMERS[4 * j + 2]) + lag;
  }
  // parents: the nearest dot born >= 3 frames earlier (a farmer, or an absorbed forager once it is orange)
  type Cand = { x: number; y: number; b: number; ref: number };
  const cands: Cand[] = [];
  for (let j = 0; j < NO; j++) cands.push({ x: ox[j], y: oy[j], b: ob[j], ref: j });
  const cx = (i: number) => fx[i] + nx[i] * dI[i];
  const cy = (i: number) => fy[i] + ny[i] * dI[i];
  for (let i = 0; i < NF; i++) if (fate[i] === 1 && Number.isFinite(rA[i])) cands.push({ x: cx(i), y: cy(i), b: rA[i] + 1, ref: -1 - i }); // a caught forager seeds farmers as it turns
  // no farmer is born on top of a caught forager (it is that farmer)
  {
    const sep = 0.7 * DOT_SPACING.farmer;
    const hb = new Map<string, number[]>();
    for (let i = 0; i < NF; i++) {
      if (fate[i] !== 1 || !Number.isFinite(rA[i])) continue;
      const key = `${Math.floor(cx(i) / sep)},${Math.floor(cy(i) / sep)}`;
      if (!hb.has(key)) hb.set(key, []);
      hb.get(key)!.push(i);
    }
    for (let j = 0; j < NO; j++) {
      const gx = Math.floor(ox[j] / sep);
      const gy = Math.floor(oy[j] / sep);
      for (let a2 = gx - 1; a2 <= gx + 1; a2++)
        for (let b2 = gy - 1; b2 <= gy + 1; b2++)
          for (const i of hb.get(`${a2},${b2}`) ?? []) if (Math.hypot(cx(i) - ox[j], cy(i) - oy[j]) < sep) ob[j] = Infinity;
    }
    // and none inside a pocket's clearing
    for (let j = 0; j < NO; j++) if (pocketSD(ox[j], oy[j]) < 1.5) ob[j] = Infinity;
    for (const q of cands) if (q.ref >= 0) q.b = ob[q.ref];
  }
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
            if (q.b > ob[j] - 1) continue;
            const dd = Math.hypot(q.x - ox[j], q.y - oy[j]);
            if (dd < bd) [bd, best] = [dd, q];
          }
    if (!best && ob[j] >= 0)
      // nobody near was there first (an island): the nearest earlier dot anywhere (it crosses the water)
      for (const q of cands) {
        if (q.b > ob[j] - 1) continue;
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
    const Tf = tl.dateAt(f);
    const wob = (i: number, s: number): [number, number] => {
      const w = (2 * Math.PI) / (70 + 50 * h1(i, s));
      return [dr * Math.cos(w * f + 6.283 * h1(i, s + 1)), dr * Math.sin(w * 1.3 * f + 6.283 * h1(i, s + 2))];
    };
    // foragers (base positions with drift; giving-way slides toward the target's current position)
    for (const i of fOrder) {
      const [dx, dy] = wob(i, 11);
      let x = fx[i] + dx;
      let y = fy[i] + dy;
      if (fate[i] !== 0) {
        // the plough (continuous in f; a slide below starts from wherever it has pushed the dot)
        const sh = shiftAt(i, Tf);
        x += nx[i] * sh;
        y += ny[i] * sh;
      }
      if (fate[i] === 3 && f >= fs[i]) {
        // a refugee: into its pocket slot, and it stays there
        const sx = SLOTS[2 * to[i]] + dx;
        const sy = SLOTS[2 * to[i] + 1] + dy;
        const e = smoother((f - fs[i]) / (fe[i] - fs[i]));
        x += (sx - x) * e;
        y += (sy - y) * e;
        qx[i] = x;
        qy[i] = y;
        if (vis(x, y)) (e < 1 ? under : over).push({ id: i, x, y, tone: 0, farmer: false });
        continue;
      }
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
      const tone = fate[i] === 1 ? smoother((f - rA[i]) / absorb) : 0;
      if (vis(x, y)) over.push({ id: i, x, y, tone, farmer: false, s: 1 + (fSize - 1) * tone });
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
        // a newborn never runs ahead of the farmed land: if its point is not farmed yet, it waits further back on its
        // way out of the parent (bisection along the segment)
        let ee = e;
        const ok = (u: number) => pocketBlend(sx + (x - sx) * u, sy + (y - sy) * u, arrivalAt(sx + (x - sx) * u, sy + (y - sy) * u)) >= Tf;
        if (!ok(ee)) {
          let lo = 0;
          let hi = ee;
          for (let it = 0; it < 6; it++) {
            const mid = (lo + hi) / 2;
            if (ok(mid)) lo = mid;
            else hi = mid;
          }
          ee = lo;
        }
        x = sx + (x - sx) * ee;
        y = sy + (y - sy) * ee;
        px[j] = x;
        py[j] = y;
        if (vis(x, y)) under.push({ id: 100000 + j, x, y, tone: 1, farmer: true, s: fSize });
        continue;
      }
      px[j] = x;
      py[j] = y;
      if (vis(x, y)) over.push({ id: 100000 + j, x, y, tone: 1, farmer: true, s: fSize });
    }
    return { under, over };
  };
  return { at, counts: { foragers: NF, farmers: NO, orphans } };
};
