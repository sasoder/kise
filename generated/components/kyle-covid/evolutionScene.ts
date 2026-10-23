// ---------------------------------------------------------------------------
// evolutionScene: the world of EvolutionIsCreative (kyle-covid, cut 48). Pure maths, no drawing: the one pinhole
// camera, the living family tree of microbes (a deterministic simulation run once at module load: every organism's
// position, heading, genome, division, death, bounce, the docking variant), the wall of human cells and its receptor
// sockets, the docking and the copies.
//
// UNITS: genome units u (covidMicrobes: a rod 2.4 u). World X right, Y DOWN (screen-aligned), Z away from the camera.
// THE CAMERA: a pinhole looking along +Z, F 1400 px, no lens shift: sx = 540 + F (X - cx) / D, sy = 960 + F (Y - cy) / D,
// D = Z - cz. Keyed in 2D (k = px per unit on the plane Z = 0, the world point (wx, wy) at screen y sy) and solved to a
// position, so a pull-back is a real dolly (parallax for anything off Z = 0).
// ---------------------------------------------------------------------------
import { pchip } from "../kits/maps/incaShared";
import { GENOMES, divisionShapes, mixGenome, mutate, shapeOf, span, wobble, type Genome, type MutationKind, type Rot, type V3 } from "./covidMicrobes";

export const FPS = 30000 / 1001;
export const DURATION = 174;
export const F = 1400;
/** word onsets (f0 = 48.1815 s) */
export const BEAT = { is: 4, very1: 12, weird: 22, very2: 36, contingent: 41, very3: 59, creative: 66, at: 80, exploiting: 93, whatever: 113, weakness: 125, we: 137, give: 150, it: 156, its: 163 };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const angDiff = (a: number, b: number) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

// ===================================================================================================================
// THE WALL OF HUMAN CELLS (above the tree): a front row of big domed cells whose lower edges make a curved wall,
// lowest in the middle; two rows behind. The docking socket is on the middle cell's lower edge.
// ===================================================================================================================
export type Cell = { id: number; X: number; Y: number; Z: number; a: number; b: number; e: number; seed: number; row: number };
/** the docking cell's membrane taking the virion in: its outline bulges round the socket by w 0..1 (render only) */
export const bulgeR = (c: Cell, t: number, w: number) => {
  if (w <= 0 || c.row !== 0 || c.id !== 3) return 0;
  const d = t - (Math.PI / 2 - 0.06);
  // two lips of membrane growing down the virion's sides, a shallow pocket between them (the cell cups it)
  return w * (0.8 * Math.exp(-(((Math.abs(d) - 0.2) / 0.075) ** 2)) + 0.16 * Math.exp(-((d / 0.2) ** 2)));
};
/** a cell's outline in its own plane: radius at angle t (screen angle, y down), a rounded blob, a little irregular */
export const cellR = (c: Cell, t: number) => cellR0(c, t);
const cellR0 = (c: Cell, t: number) => {
  const ct = Math.abs(Math.cos(t));
  const st = Math.abs(Math.sin(t));
  const base = 1 / Math.pow(Math.pow(ct / c.a, c.e) + Math.pow(st / c.b, c.e), 1 / c.e);
  return base * (1 + 0.035 * Math.sin(3 * t + c.seed) + 0.025 * Math.sin(5 * t + c.seed * 1.7));
};
/** the front row's lower edge: lowest in the middle, curving up to the sides (the wall is curved) */
const BOTTOM = (X: number) => -15.5 - 0.02 * (X - 0.6) * (X - 0.6);
const mkRow = (row: number, n: number, x0: number, dx: number, a: number, b: number, Z: number, lift: number, idBase: number): Cell[] =>
  Array.from({ length: n }, (_, i) => {
    const X = x0 + i * dx + (row > 0 ? 0.25 * Math.sin(i * 2.3 + row) : 0);
    const bj = b * (1 + 0.05 * Math.sin(i * 1.9 + row * 2.1));
    return { id: idBase + i, X, Y: BOTTOM(X) - lift - bj * 0.97, Z: Z + 0.25 * Math.sin(i * 3.7 + row), a: a * (1 + 0.04 * Math.sin(i * 2.9 + row)), b: bj, e: 2.25, seed: idBase + i * 1.37, row };
  });
const CELLS_FRONT: Cell[] = mkRow(0, 7, -20.7, 7.1, 3.9, 3.45, 0.6, 0, 0);
const CELLS_BACK: Cell[] = [...mkRow(2, 8, -27.8, 7.4, 4.15, 3.7, 11, 7.2, 20), ...mkRow(1, 8, -24.3, 7.25, 4.0, 3.6, 5, 3.7, 10)];
export const CELLS: Cell[] = [...CELLS_BACK, ...CELLS_FRONT];
export const DOCK_CELL = CELLS_FRONT[3];
/** the lower edge of the front row at X (the wall the tips bump into): the lowest point of any front cell there */
export const wallY = (X: number) => {
  let best = -1e9;
  for (const c of CELLS_FRONT) {
    const dx = X - c.X;
    if (Math.abs(dx) > c.a * 1.05) continue;
    // the lower edge: solve the outline at this x by marching the angle over the lower half
    for (let i = 0; i <= 40; i++) {
      const t = (i / 40) * Math.PI;
      const r = cellR(c, t);
      if (Math.abs(r * Math.cos(t) - dx) < 0.2) best = Math.max(best, c.Y + r * Math.sin(t));
    }
  }
  return best;
};
/** the wall the tips meet: the cells' lower edges, but never more than a little way up into the crevices between them */
/** the wall the tips meet: the tissue's lower edge (review 2) */
export const wallEff = (X: number) => TB(X) + TISSUE_DY + BOT_BULGE * 0.7;
/** a point on a cell's outline at angle t, and its outward normal (screen axes) */
export const cellPoint = (c: Cell, t: number): { x: number; y: number; nx: number; ny: number } => {
  const r = cellR(c, t);
  const e = 1e-3;
  const r2 = cellR(c, t + e);
  const x = c.X + r * Math.cos(t);
  const y = c.Y + r * Math.sin(t);
  const tx = c.X + r2 * Math.cos(t + e) - x;
  const ty = c.Y + r2 * Math.sin(t + e) - y;
  const l = Math.hypot(tx, ty) || 1;
  // outward: rotate the tangent (the angle grows clockwise on screen) by -90 deg
  return { x, y, nx: ty / l, ny: -tx / l };
};
/** the receptor sockets: small cups on short stalks along the front cells' lower edges (angle on the cell's outline) */
export type Socket = { cell: Cell; t: number; dock: boolean };
export const DOCK_T = Math.PI / 2 - 0.06;
export const SOCKETS: Socket[] = (() => {
  const out: Socket[] = [];
  CELLS_FRONT.forEach((c, ci) => {
    const n = 4;
    for (let i = 0; i < n; i++) {
      const t = Math.PI * (0.22 + (0.56 * (i + 0.5)) / n) + 0.05 * Math.sin(ci * 3.1 + i * 1.7);
      if (c === DOCK_CELL && Math.abs(t - DOCK_T) < 0.3) continue;
      out.push({ cell: c, t, dock: false });
    }
  });
  out.push({ cell: DOCK_CELL, t: DOCK_T, dock: true });
  return out;
})();
export const SOCKET = { stalk: 0.36, cupR: 0.19, cupDepth: 0.15 };
/** the socket's cup centre (where a club head sits) and its outward normal */
export const socketCup = (s: Socket) => {
  const p = cellPoint(s.cell, s.t);
  return { x: p.x + p.nx * (SOCKET.stalk + SOCKET.cupR * 0.35), y: p.y + p.ny * (SOCKET.stalk + SOCKET.cupR * 0.35), nx: p.nx, ny: p.ny, bx: p.x, by: p.y };
};
export const DOCK_SOCKET = SOCKETS[SOCKETS.length - 1];

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
const CUP = socketCup(DOCK_SOCKET);
/** the docked virion's genome and its centre at contact (one club head in the cup) */
export const VIRION: Genome = { ...GENOMES.virion, seed: 4.2 };
export const VSPIKE = { len: VIRION.spikeLen, R: VIRION.girth };
/** the virion's centre when its top club head (spike 0, pointing up at rot 0) sits in the cup */
const tipOf = (g: Genome) => {
  const sp = shapeOf(g, { yaw: 0, pitch: 0, roll: 0 }, 0).spikes[0];
  return { x: sp.b[0] + sp.d[0] * sp.len, y: sp.b[1] + sp.d[1] * sp.len };
};
export const dockCentreFor = (g: Genome) => {
  const t = tipOf(g);
  return { x: CUP.x - t.x, y: CUP.y - t.y };
};
const DOCK_C = dockCentreFor(VIRION);
export const DOCK = { cup: CUP, centre: DOCK_C, contact: BEAT.weakness, settle: 0.5 };

// ===================================================================================================================
// THE TISSUE (review 2): a lining of packed cells pressed against each other (soft rounded polygons: a Voronoi
// tessellation of jittered rows, each cell inset a little so a fine membrane line shows between them, corners
// rounded), a few rows deep fading up into the air; the lowest row faces the microbes with its receptor cups. The
// infected cell sits exactly over the docking socket (whose place is unchanged from revision 1).
// ===================================================================================================================
const BOT_BULGE = 0.35;
const TB_OFF = CUP.by - BOTTOM(CUP.bx) - BOT_BULGE;
/** the tissue's lower edge (the wall the tips meet) */
export const TB = (X: number) => BOTTOM(X) + TB_OFF;
export type TCell = { id: number; row: number; cx: number; cy: number; Z: number; poly: V2[]; pts: V2[]; seed: number; nuc: { x: number; y: number; rx: number; ry: number; a: number }; infected: boolean };
const clipHalf = (poly: V2[], m: V2, n: V2): V2[] => {
  // keep (p - m) . n <= 0
  const out: V2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = (a[0] - m[0]) * n[0] + (a[1] - m[1]) * n[1];
    const db = (b[0] - m[0]) * n[0] + (b[1] - m[1]) * n[1];
    if (da <= 0) out.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
};
let TISSUE_DY = 0;
const TISSUE: TCell[] = (() => {
  const dx = 5.3;
  type Seed = { x: number; y: number; row: number; i: number };
  const seeds: Seed[] = [];
  for (let row = 0; row <= 4; row++) {
    const off = row % 2 ? dx / 2 : 0;
    for (let i = -6; i <= 6; i++) {
      const jx = (hash01(row * 31.7 + i * 3.1) - 0.5) * (row > 0 ? 1.0 : 0.6);
      const x = row === 0 && i === 0 ? CUP.bx : CUP.bx + i * dx + off + jx;
      const jy = row > 0 ? (hash01(row * 17.3 + i * 5.9) - 0.5) * 0.7 : 0;
      seeds.push({ x, y: TB(x) - 2.45 - row * 4.0 + jy, row, i });
    }
  }
  // ghosts mirrored below the lowest row: the lowest cells' bottoms lie on the tissue's edge
  const ghosts: V2[] = seeds.filter((s) => s.row === 0).map((s) => [s.x, 2 * TB(s.x) - s.y]);
  const all: V2[] = [...seeds.map((s) => [s.x, s.y] as V2), ...ghosts];
  const out: TCell[] = [];
  seeds.forEach((s, si) => {
    if (s.row > 3) return;
    let poly: V2[] = [
      [s.x - 6, s.y - 6],
      [s.x + 6, s.y - 6],
      [s.x + 6, s.y + 6],
      [s.x - 6, s.y + 6],
    ];
    all.forEach((q, qi) => {
      if (qi === si) return;
      const d = Math.hypot(q[0] - s.x, q[1] - s.y);
      if (d > 12) return;
      poly = clipHalf(poly, [(q[0] + s.x) / 2, (q[1] + s.y) / 2], [q[0] - s.x, q[1] - s.y]);
    });
    if (poly.length < 3) return;
    let cx = 0;
    let cy = 0;
    poly.forEach((p) => {
      cx += p[0];
      cy += p[1];
    });
    cx /= poly.length;
    cy /= poly.length;
    // inset (the membrane line between neighbours), then round every corner (soft polygons, not circles)
    const ins = poly.map((p): V2 => {
      const d = Math.hypot(p[0] - cx, p[1] - cy) || 1;
      const k = Math.max(0.5, 1 - 0.1 / d);
      return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k];
    });
    const pts: V2[] = [];
    const n = ins.length;
    for (let i = 0; i < n; i++) {
      const p0 = ins[(i - 1 + n) % n];
      const p1 = ins[i];
      const p2 = ins[(i + 1) % n];
      // corner radius: a share of the shorter adjacent edge
      const e1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const e2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const r = Math.min(e1, e2) * 0.42;
      const a: V2 = [p1[0] + ((p0[0] - p1[0]) / (e1 || 1)) * r, p1[1] + ((p0[1] - p1[1]) / (e1 || 1)) * r];
      const b: V2 = [p1[0] + ((p2[0] - p1[0]) / (e2 || 1)) * r, p1[1] + ((p2[1] - p1[1]) / (e2 || 1)) * r];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const m = 1 - t;
        pts.push([m * m * a[0] + 2 * m * t * p1[0] + t * t * b[0], m * m * a[1] + 2 * m * t * p1[1] + t * t * b[1]]);
      }
    }
    // an even outline (straight runs between the rounded corners get their own points)
    {
      const dense: V2[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.15));
        for (let k = 0; k < n; k++) dense.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
      }
      pts.length = 0;
      dense.forEach((p) => pts.push(p));
    }
    // the lowest row's free bottoms bulge gently into the fluid (a cell, not a tile)
    if (s.row === 0) {
      let hw = 0;
      pts.forEach((p) => {
        if (p[1] > cy + 1) hw = Math.max(hw, Math.abs(p[0] - cx));
      });
      pts.forEach((p) => {
        if (p[1] > cy + 0.6 && hw > 0) p[1] += BOT_BULGE * Math.max(0, 1 - ((p[0] - cx) / hw) ** 2) * sstep(cy + 0.6, cy + 1.6, p[1]);
      });
    }
    let mr = 0;
    pts.forEach((p) => (mr += Math.hypot(p[0] - cx, p[1] - cy)));
    mr /= pts.length;
    const h = (k: number) => hash01(si * 7.77 + k);
    out.push({
      id: si,
      row: s.row,
      cx,
      cy,
      Z: 0.6,
      poly,
      pts,
      seed: si * 1.37,
      nuc: { x: cx + (h(1) - 0.6) * mr * 0.35, y: cy - mr * (0.12 + 0.12 * h(2)), rx: mr * (0.3 + 0.05 * h(3)), ry: mr * (0.24 + 0.04 * h(4)), a: (h(5) - 0.5) * 1.2 },
      infected: s.row === 0 && s.i === 0,
    });
  });
  // the whole tissue set so the infected cell's membrane passes exactly through the docking socket's base
  const inf = out.find((c) => c.infected)!;
  let yb = -Infinity;
  inf.pts.forEach((p) => {
    if (Math.abs(p[0] - CUP.bx) < 0.35) yb = Math.max(yb, p[1]);
  });
  TISSUE_DY = CUP.by - yb;
  out.forEach((c) => {
    c.cy += TISSUE_DY;
    c.nuc.y += TISSUE_DY;
    c.pts.forEach((p) => (p[1] += TISSUE_DY));
    c.poly.forEach((p) => (p[1] += TISSUE_DY));
  });
  return out;
})();
export { TISSUE };
export const INFECTED = TISSUE.find((c) => c.infected)!;
// the infected cell's outline as a polar function round its centre (for its membrane taking the virion in, the copies)
const INF_R: number[] = (() => {
  const N = 720;
  const r: number[] = [];
  const P = INFECTED.pts;
  for (let k = 0; k < N; k++) {
    const t = (k / N) * Math.PI * 2;
    const dx = Math.cos(t);
    const dy = Math.sin(t);
    let best = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[i];
      const b = P[(i + 1) % P.length];
      // ray (centre + s d) against segment a-b
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-9) continue;
      const ax = a[0] - INFECTED.cx;
      const ay = a[1] - INFECTED.cy;
      const s = (ax * ey - ay * ex) / den;
      const u = (ax * dy - ay * dx) / den;
      if (s > 0 && u >= 0 && u <= 1) best = Math.max(best, s);
    }
    r.push(best);
  }
  return r;
})();
export const INF_T = Math.atan2(CUP.by - INFECTED.cy, CUP.bx - INFECTED.cx);
export const infR = (t: number) => {
  const N = INF_R.length;
  let x = ((t / (Math.PI * 2)) % 1) * N;
  if (x < 0) x += N;
  const i = Math.floor(x) % N;
  return INF_R[i] + (INF_R[(i + 1) % N] - INF_R[i]) * (x - Math.floor(x));
};
/** the membrane taking the docked virion in: two lips grow down its sides, a shallow pocket between them, by w 0..1 */
export const infBulge = (t: number, w: number) => {
  if (w <= 0) return 0;
  let d = t - INF_T;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return w * (0.55 * Math.exp(-(((Math.abs(d) - 0.27) / 0.09) ** 2)) + 0.1 * Math.exp(-((d / 0.25) ** 2)));
};
/** a point on the infected cell's outline at angle t round its centre, and the outward normal */
export const infPoint = (t: number) => {
  const r = infR(t);
  const e = 1e-3;
  const r2 = infR(t + e);
  const x = INFECTED.cx + r * Math.cos(t);
  const y = INFECTED.cy + r * Math.sin(t);
  const tx = INFECTED.cx + r2 * Math.cos(t + e) - x;
  const ty = INFECTED.cy + r2 * Math.sin(t + e) - y;
  const l = Math.hypot(tx, ty) || 1;
  return { x, y, nx: ty / l, ny: -tx / l };
};
/** the receptor cups along the lowest row's lower edges (the docking socket keeps its revision-1 place) */
export type TSocket = { x: number; y: number; nx: number; ny: number; dock: boolean };
export const TSOCKETS: TSocket[] = (() => {
  const out: TSocket[] = [];
  TISSUE.filter((c) => c.row === 0).forEach((c) => {
    // the lower part of its outline (normals facing down)
    const P = c.pts;
    const low: { x: number; y: number; nx: number; ny: number }[] = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[(i - 1 + P.length) % P.length];
      const b = P[(i + 1) % P.length];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1;
      let nx = ty / l;
      let ny = -tx / l;
      if ((P[i][0] - c.cx) * nx + (P[i][1] - c.cy) * ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      if (ny > 0.8) low.push({ x: P[i][0], y: P[i][1], nx, ny });
    }
    low.sort((a, b) => a.x - b.x);
    if (low.length < 3) return;
    [0.22, 0.62, 0.9].forEach((q, k) => {
      const p = low[Math.min(low.length - 1, Math.floor(q * (low.length - 1)))];
      if (c.infected && Math.abs(p.x - CUP.bx) < 1.1) return;
      if (k === 2 && hash01(c.id * 3.3) < 0.5) return;
      out.push({ ...p, dock: false });
    });
  });
  out.push({ x: CUP.bx, y: CUP.by, nx: CUP.nx, ny: CUP.ny, dock: true });
  return out;
})();
export const tSocketCup = (s: TSocket) => ({ x: s.x + s.nx * (SOCKET.stalk + SOCKET.cupR * 0.35), y: s.y + s.ny * (SOCKET.stalk + SOCKET.cupR * 0.35) });
/** the infected cell swells a little as it fills (about the docking socket, which stays put) */
export const infSwell = (f: number) => 1 + 0.035 * sstep(BEAT.weakness + 10, BEAT.it + 6, f);
/** the virions being made inside the infected cell: each comes out of one already there (the first from the docked
 *  one), growing as it moves to its place; several, increasing from f135 (the three copies push out on GIVE IT) */
export type Inside = { f0: number; src: number; x: number; y: number; seed: number };
const COPY_PATHS: V2[] = [];
export const INSIDE: Inside[] = (() => {
  [DOCK_T + 0.98, DOCK_T - 0.98, DOCK_T + 1.0].forEach((t) => {
    const p = infPoint(INF_T + (t - DOCK_T));
    for (let k = 0; k <= 4; k++) COPY_PATHS.push([p.x - p.nx * 0.35 * k, p.y - p.ny * 0.35 * k]);
  });
  const c = INFECTED;
  const spots: V2[] = [];
  const want = 6;
  let k = 0;
  while (spots.length < want && k < 3000) {
    k++;
    const a = hash01(k * 3.7) * Math.PI * 2;
    const t = a;
    // wholly inside: at least a body's width from the membrane
    const R = Math.max(0, infR(t) - 0.75) * Math.sqrt(hash01(k * 9.1));
    const x = c.cx + Math.cos(t) * R;
    const y = c.cy + Math.sin(t) * R;
    // the lower two thirds, clear of the nucleus's middle, apart from each other
    if (y < c.cy - infR(-Math.PI / 2) * 0.62) continue;
    if (Math.hypot((x - c.nuc.x) / c.nuc.rx, (y - c.nuc.y) / c.nuc.ry) < 0.35) continue;
    if (spots.some((p) => Math.hypot(p[0] - x, p[1] - y) < 1.28)) continue;
    // clear of the copies' way out
    if (COPY_PATHS.some((p) => Math.hypot(p[0] - x, p[1] - y) < 1.25)) continue;
    if (Math.hypot(x - CUP.bx, y - CUP.by) < 1.0) continue;
    spots.push([x, y]);
  }
  // nearest to the docking point first: the making spreads from there
  spots.sort((p, q) => Math.hypot(p[0] - CUP.bx, p[1] - CUP.by) - Math.hypot(q[0] - CUP.bx, q[1] - CUP.by));
  const frames = [135, 139, 143, 147, 151, 156, 161];
  return spots.map((p, i) => ({ f0: frames[i] ?? 161 + i * 4, src: i === 0 ? -1 : Math.floor(hash01(i * 2.3) * i), x: p[0], y: p[1], seed: 30 + i }));
})();
const LK = pchip([
  [0, Math.log(133)],
  [95, Math.log(54)],
  [140, Math.log(63)],
  [173, Math.log(67)],
]);
const WX = pchip([
  [0, 0],
  [95, 0.4],
  [140, DOCK_C.x + 0.15],
  [173, DOCK_C.x + 0.25],
]);
// the camera stays on the young tree, then rises with it fast enough that the wall enters from the top edge (~f50-f65)
const WY = pchip([
  [0, 0],
  [45, -0.6],
  [95, -10.7],
  [140, DOCK_C.y - 0.3],
  [173, DOCK_C.y - 0.45],
]);
const SY = pchip([
  [0, 870],
  [95, 960],
  [140, 820],
  [173, 812],
]);
export type Cam = { x: number; y: number; z: number; k: number };
export const camAt = (f: number): Cam => {
  const k = Math.exp(LK(f));
  const D0 = F / k;
  // the house hand (a few screen px)
  const sx = 3 * Math.sin(f / 23);
  const sy = 4 * Math.sin(f / 19);
  return { k, z: -D0, x: WX(f) - sx / k, y: WY(f) - (SY(f) - 960 + sy) / k };
};
export const project = (c: Cam, X: number, Y: number, Z: number) => {
  const D = Z - c.z;
  const s = F / D;
  return { x: 540 + (X - c.x) * s, y: 960 + (Y - c.y) * s, s, D };
};
/** the depth fog of the world (by Z, not by the eye's distance: the pull-back never buries the tree) */
export const fogZ = (Z: number) => 0.92 * (1 - Math.exp(-Math.max(0, Z + 2) / 26));

// ===================================================================================================================
// THE FAMILY TREE (review 1: a clean branching tree). Laid out first, then lived along:
// - a fixed topology (who divides, who drains when, the docking lineage), generation timing that speeds up;
// - every division leaves a FORK fixed in world space; leaves take non-crossing lanes (a tidy tree: a fork's x is the
//   mean of its children's), so branches fan out to either side of their parent's line and never cross;
// - every branch is ONE cubic from its parent's fork to its own fork (or a tip's place under the wall); the organism
//   swims along it, nose first; its strand is the part of that cubic it has travelled (it grows, it never changes
//   shape); a tip that reaches the wall bumps, recoils and slips slowly sideways, its strand bending smoothly to it;
// - the drained stop on their branch and sink out of the tree, their strands fading.
// ===================================================================================================================
export type V2 = [number, number];
export type Bez = [V2, V2, V2, V2];
export type Org = {
  id: number;
  parent: number;
  gen: number;
  path: string;
  kids: number[];
  /** born (independent) at fb; its strand starts at its parent's split (fs0) */
  fb: number;
  fs0: number;
  g: Genome;
  /** CREATIVE: a living tip bursts into a new form (morph g -> g2 over f0..f1) */
  burst?: { g2: Genome; f0: number; f1: number };
  /** its own division (start, length) and split frame */
  fd?: number;
  dd?: number;
  fs?: number;
  fdie?: number;
  dock?: boolean;
  /** the tip's row under the wall: 0 touches it (a bump), 1 / 2 hang lower; -1 a late, low tip */
  row: number;
  x: number;
  Z: number;
  seed: number;
  /** the branch, where on it the organism starts, and when it reaches the end */
  B: Bez;
  u0: number;
  fArr: number;
  /** per frame from f0 = floor(fs0): world X, Y, Z, heading, the branch parameter reached */
  f0: number;
  X: number[];
  Y: number[];
  ZZ: number[];
  th: number[];
  U: number[];
  /** the swim's direction per frame (no tumble) and the parent's fork (where its strand starts) */
  HX: number[];
  HY: number[];
  P0: V2;
};
export const genomeAt = (o: Org, f: number) => (o.burst ? mixGenome(o.g, o.burst.g2, sstep(o.burst.f0, o.burst.f1, f)) : o.g);
/** the body's rotation at f: heading + a living tumble (a newborn blends from its parent's tumble) */
export const rotOf = (o: Org, f: number, parentOf?: (o: Org) => Org | undefined): Rot & { wave: number } => {
  const i = Math.max(0, Math.min(o.th.length - 1, Math.floor(f) - o.f0));
  const fi = Math.max(o.f0, Math.min(o.f0 + o.th.length - 1, f));
  const th = o.th[i] + angDiff(o.th[i], o.th[Math.min(o.th.length - 1, i + 1)]) * (fi - Math.floor(fi));
  const w = wobble(f, o.seed, 0.55);
  const p = parentOf?.(o);
  const wp = p ? wobble(f, p.seed, 0.55) : w;
  // a newborn takes over its parent's tumble and grows into its own along the shortest way round (no spin)
  const b = sstep(o.fb, o.fb + 14, f);
  const yaw = th + lerp(wp.yaw, w.yaw, b);
  const pitch = lerp(wp.pitch, w.pitch, b);
  const roll = wp.roll + angDiff(wp.roll, w.roll) * b;
  // the hairs' and the flagellum's waves repeat every 2 pi / 0.8 of the phase
  const WP = (2 * Math.PI) / 0.8;
  let dw = (w.wave - wp.wave) % WP;
  if (dw > WP / 2) dw -= WP;
  if (dw < -WP / 2) dw += WP;
  return { yaw, pitch, roll, wave: wp.wave + dw * b };
};

// ---- Bezier helpers ------------------------------------------------------------------------------------------------
export const bez = (B: Bez, u: number): V2 => {
  const a = 1 - u;
  return [
    a * a * a * B[0][0] + 3 * a * a * u * B[1][0] + 3 * a * u * u * B[2][0] + u * u * u * B[3][0],
    a * a * a * B[0][1] + 3 * a * a * u * B[1][1] + 3 * a * u * u * B[2][1] + u * u * u * B[3][1],
  ];
};
const bezD = (B: Bez, u: number): V2 => {
  const a = 1 - u;
  return [
    3 * a * a * (B[1][0] - B[0][0]) + 6 * a * u * (B[2][0] - B[1][0]) + 3 * u * u * (B[3][0] - B[2][0]),
    3 * a * a * (B[1][1] - B[0][1]) + 6 * a * u * (B[2][1] - B[1][1]) + 3 * u * u * (B[3][1] - B[2][1]),
  ];
};
const l2 = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** the part [0, u] of a cubic (de Casteljau): itself a cubic */
export const bezHead = (B: Bez, u: number): Bez => {
  const p01 = l2(B[0], B[1], u);
  const p12 = l2(B[1], B[2], u);
  const p23 = l2(B[2], B[3], u);
  const q0 = l2(p01, p12, u);
  const q1 = l2(p12, p23, u);
  return [B[0], p01, q0, l2(q0, q1, u)];
};
/** arc length table of a cubic: s(u) samples */
const arcTable = (B: Bez, n = 48) => {
  const s = [0];
  let prev = bez(B, 0);
  for (let i = 1; i <= n; i++) {
    const p = bez(B, i / n);
    s.push(s[i - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]));
    prev = p;
  }
  return s;
};
const uOfS = (tab: number[], s: number) => {
  const n = tab.length - 1;
  if (s <= 0) return 0;
  if (s >= tab[n]) return 1;
  let i = 0;
  while (tab[i + 1] < s) i++;
  return (i + (s - tab[i]) / (tab[i + 1] - tab[i])) / n;
};

// ---- the plan --------------------------------------------------------------------------------------------------------
const ORGS: Org[] = [];
const ROOT_G: Genome = { ...GENOMES.rod, len: 1.3, girth: 0.52, pili: 0.85, seed: 1.7 };
/** generation timing: frames from birth to division start, the division's length (each generation a little faster) */
const GEN_T = [
  { life: 0, dd: 17 },
  { life: 3, dd: 12 },
  { life: 2, dd: 10 },
  { life: 4, dd: 11 },
  { life: 5, dd: 10 },
  { life: 16, dd: 10 },
  { life: 26, dd: 10 },
  { life: 30, dd: 10 },
];
/** the fork heights by generation (world Y, up is -) */
export const kAt = (f: number) => Math.exp(LK(f));
/** a tip's cruise: about this many screen px per frame through the pull-back (world speed = c / k) */
const CRUISE = 9;

// hand-picked fates by lineage path ("0" the root, "01" its right daughter, ...): who drains when, who divides late
const DEATHS: Record<string, number> = {
  "000": 30,
  "0111": 47,
  "01000": 60,
  "00111": 70,
  "011000": 104,
  "001011": 112,
  "010101": 119,
  "001100": 134,
  "010010": 146,
  "0010100": 150,
  "00100": 78,
  "01101": 88,
};
/** generation 4 tips (run to the wall instead of dividing) */
const G4_TIPS = new Set(["00100", "01011", "01101"]);
/** later dividers (lower in the tree) */
const LATE = new Set(["001010", "011001"]);
const DOCK_PATH = "010011";
const MUT_KINDS: MutationKind[] = ["tail", "bend", "spikes", "coil", "bulb", "len", "pili", "twist", "girth", "taper"];
const genomeFor = (parent: Genome, path: string, gen: number, side: number): Genome => {
  const h = hash01(parseInt(path, 2) * 7.31 + gen * 1.9 + side * 0.77);
  // along the docking lineage the form drifts toward a round, club-spiked one (it happens to fit later)
  if (DOCK_PATH.startsWith(path)) {
    const k: MutationKind[] = ["spikes", "spikes", "len", "spikes", "girth", "spikes", "spikes"];
    let g = mutate(parent, h * 100, 0.5, k[gen % k.length]);
    const target: Genome = { ...GENOMES.spikySphere, spikes: 18, spikeLen: 0.26, club: 0.85, girth: 0.56, tone: 0.2, seed: g.seed };
    g = mixGenome(g, target, Math.min(1, gen / 5));
    return g;
  }
  const amount = gen <= 1 ? 0.65 : gen === 2 ? 0.55 : gen === 3 ? 0.7 : 0.6;
  let kind = MUT_KINDS[Math.floor(h * MUT_KINDS.length) % MUT_KINDS.length];
  if (path === "01") kind = "spikes";
  if (kind === "coil" && parent.coil > 0.05) kind = h < 0.5 ? "spikes" : "tail";
  let g = mutate(parent, h * 100 + 3, amount, kind);
  // the first daughters are visibly odd by WEIRD: one bends into a comma with a long flagellum, one sprouts thorns
  if (path === "00") g = { ...g, bend: 1.35, tail: 1.7, girth: 0.42, len: 1.5, pili: 0.3 };
  if (path === "01") g = { ...g, spikes: 3, spikeLen: 0.3 };
  // no orange-adjacent mistakes: the clubbed crown is the docking line's own
  g = { ...g, club: Math.min(g.club, 0.35) };
  return g;
};
const burstFor = (o: Org): Org["burst"] => {
  // the first odd one: thorns sprouting on WEIRD
  if (o.path === "01") return { g2: { ...o.g, spikes: 16, spikeLen: 0.32 }, f0: 12, f1: 23 };
  if (o.dock || o.gen < 2 || o.gen > 4) return undefined;
  // CREATIVE: the tips alive then burst into new forms (a big drift) on the word
  const h = hash01(o.id * 3.3 + 0.4);
  let kind = MUT_KINDS[Math.floor(h * MUT_KINDS.length) % MUT_KINDS.length];
  if (kind === "coil" && o.g.coil > 0.05) kind = "bulb";
  let g2 = mutate(o.g, o.id * 11.7 + 5, 0.95, kind);
  g2 = mutate(g2, o.id * 5.1 + 2, 0.7);
  g2 = { ...g2, club: Math.min(g2.club, 0.35) };
  return { g2, f0: BEAT.creative - 6 + Math.round(h * 4), f1: BEAT.creative + 10 + Math.round(h * 4) };
};
const blankOrg = (id: number, parent: number, gen: number, path: string): Org => ({
  id,
  parent,
  gen,
  path,
  kids: [],
  fb: 0,
  fs0: 0,
  g: ROOT_G,
  row: 0,
  x: 0,
  Z: 0,
  seed: 1 + id * 1.618,
  B: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ],
  u0: 0,
  fArr: 0,
  f0: 0,
  X: [],
  Y: [],
  ZZ: [],
  th: [],
  U: [],
  HX: [],
  HY: [],
  P0: [0, 0],
});
const divides = (o: Org) => {
  if (DEATHS[o.path] !== undefined || o.path === DOCK_PATH) return false;
  if (o.gen <= 3) return true;
  if (o.gen === 4) return !G4_TIPS.has(o.path);
  return LATE.has(o.path);
};
// 1. topology and timing
const topology = () => {
  const root = blankOrg(0, -1, 0, "0");
  root.fd = -6;
  root.dd = GEN_T[0].dd;
  root.fb = -40;
  root.fs0 = -40;
  ORGS.push(root);
  const queue = [0];
  while (queue.length) {
    const o = ORGS[queue.shift()!];
    o.fdie = DEATHS[o.path];
    o.dock = o.path === DOCK_PATH;
    if (o.id !== 0) {
      if (divides(o)) {
        const T = GEN_T[Math.min(GEN_T.length - 1, o.gen)];
        o.fd = o.fb + T.life + (o.gen >= 2 ? Math.round((hash01(o.id * 5.3) - 0.5) * 3) : 0);
        o.dd = T.dd;
      } else {
        o.fd = undefined;
        o.dd = undefined;
      }
    }
    if (o.fd === undefined || o.dd === undefined) continue;
    o.fs = o.fd + o.dd * 0.45;
    if (o.fd + o.dd > DURATION) {
      o.fd = undefined;
      o.dd = undefined;
      o.fs = undefined;
      continue;
    }
    for (let side = 0; side < 2; side++) {
      const k = blankOrg(ORGS.length, o.id, o.gen + 1, o.path + String(side));
      k.fb = o.fd + o.dd;
      k.fs0 = o.fs;
      k.f0 = k.fb;
      ORGS.push(k);
      o.kids.push(k.id);
      queue.push(k.id);
    }
  }
};
topology();
// 2. the layout: leaf lanes (weighted: the living and the docking variant wide, the drained narrow), a fork's x the
//    mean of its children's
const leafW = (o: Org): number => (o.kids.length ? o.kids.reduce((a, k) => a + leafW(ORGS[k]), 0) : o.dock ? DOCK_W : o.fdie !== undefined ? 0.55 : 1);
const DOCK_W = 2.6;
const lay = (o: Org, x0: number, x1: number) => {
  if (!o.kids.length) {
    o.x = (x0 + x1) / 2;
    return;
  }
  const w = o.kids.map((k) => leafW(ORGS[k]));
  const tot = w[0] + w[1];
  const xm = x0 + ((x1 - x0) * w[0]) / tot;
  lay(ORGS[o.kids[0]], x0, xm);
  lay(ORGS[o.kids[1]], xm, x1);
  o.x = (ORGS[o.kids[0]].x * w[0] + ORGS[o.kids[1]].x * w[1]) / tot;
};
lay(ORGS[0], -7.2, 8.4);
// the whole tree shifted so the root sits at x 0
{
  const dx = ORGS[0].x;
  ORGS.forEach((o) => (o.x -= dx));
}
// the docking variant's lane is eased under its socket: lanes near it slide over (a tent-shaped shift keeps the order)
{
  const dock = ORGS.find((o) => o.dock);
  if (dock) {
    const xd = dock.x;
    const delta = DOCK_C.x - xd;
    const W = 4.5;
    ORGS.forEach((o) => {
      if (o.id !== 0) o.x += delta * Math.max(0, 1 - Math.abs(o.x - xd) / W);
    });
  }
}
// 3. genomes (in birth order: a daughter starts from her parent's form at her birth) and the CREATIVE bursts
ORGS.forEach((o) => {
  if (o.id === 0) return;
  const P = ORGS[o.parent];
  o.g = genomeFor(genomeAt(P, o.fb), o.path, o.gen, P.kids[0] === o.id ? 0 : 1);
  o.Z = Math.max(-1.6, Math.min(2.2, P.Z + (hash01(o.id * 4.7) - 0.5) * 1.4));
  const alive66 = o.fb <= BEAT.creative + 4 && (o.fd === undefined || o.fd >= BEAT.creative - 4) && (o.fdie === undefined || o.fdie > BEAT.creative);
  if (o.path === "01" || alive66) o.burst = burstFor(o);
});

/** the docking variant's genome before contact */
export const dockGenomeBase = () => ORGS.find((q) => q.dock)?.g;

// ===================================================================================================================
// THE COPIES: orange virions made inside the cell push out of its surface beside the docked one
// ===================================================================================================================
export type Copy = { t: number; f0: number; dur: number; drift: number; seed: number; slide: V2; s0: number; s1: number };
export const COPIES: Copy[] = [
  { t: DOCK_T + 0.98, f0: BEAT.give - 5, dur: 18, drift: 0.35, seed: 21, slide: [-1.2, 1.15], s0: BEAT.give + 5, s1: BEAT.give + 28 },
  { t: DOCK_T - 0.98, f0: BEAT.give + 2, dur: 18, drift: 0.35, seed: 22, slide: [1.2, 0.9], s0: BEAT.give + 13, s1: BEAT.give + 36 },
  { t: DOCK_T + 1.0, f0: BEAT.it + 2, dur: 18, drift: 0.3, seed: 23, slide: [0, 0], s0: 999, s1: 1000 },
];
/** a copy's state: e 0..1 how far out (0 inside the cell, 0.5 half through the membrane, 1 out), its centre */
export const copyAt = (c: Copy, f: number) => {
  const e = sstep(c.f0, c.f0 + c.dur, f);
  const p = infPoint(INF_T + (c.t - DOCK_T));
  const R = VIRION.girth + VIRION.spikeLen * 0.6;
  const out = lerp(-1.25 * R, 1.05 * R, e) + c.drift * sstep(c.f0 + c.dur * 0.8, c.f0 + c.dur + 14, f);
  const sl = sstep(c.s0, c.s1, f);
  return { e, x: p.x + p.nx * out + c.slide[0] * sl, y: p.y + p.ny * out + c.slide[1] * sl, px: p.x, py: p.y, nx: p.nx, ny: p.ny, born: f >= c.f0 - 8 };
};

/** a parent's division at frame f: t, the halves' centre offsets (u, screen axes) */
export const divT = (o: Org, f: number) => (o.fd === undefined || o.dd === undefined ? -1 : (f - o.fd) / o.dd);
export const divisionAt = (o: Org, f: number) => {
  const t = c01(divT(o, f));
  const r = rotOf(o, f, (q) => ORGS[q.parent]);
  const gA = ORGS[o.kids[0]].g;
  const gB = ORGS[o.kids[1]].g;
  return divisionShapes(genomeAt(o, f), gA, gB, r, r, r, r.wave, t, 0.9);
};

// 4. the branches and the life along them
const F_END = DURATION + 2;
/** the axis a parent divides along: its own path, leaning a little to the right, so its front half (upper right)
 *  takes the right branch and its rear half (lower left) the left one */
const divAxis = (o: Org) => -Math.PI / 2 + 0.3 + (hash01(o.id * 2.71) - 0.5) * 0.16;
const DOCK_TIPS = 2.3;
const FORKS = new Map<number, V2>();
/** the tree widens as it grows: a place's x is its tidy x scaled by its generation's spread (order kept) */
const SPREAD = [0.28, 0.34, 0.5, 0.68, 0.85, 0.95, 1, 1, 1];
/** a tip's place under the wall (rows staggered so neighbours never meet; none crowd the docking site) */
const tipTarget = (o: Org, rank: number): V2 => {
  const span0 = span(genomeAt(o, 140)) * 0.5;
  // the leaves keep their lanes exactly (so no two tips' branches cross)
  const x = o.x;
  if (o.gen >= 6) {
    o.row = -1;
    const pf = FORKS.get(o.parent) ?? [x, -11];
    return [x, pf[1] - 1.6];
  }
  let row = [0, 1, 0, 2][rank % 4];
  if (Math.abs(x - DOCK_C.x) < DOCK_TIPS) row = 2;
  o.row = row;
  const top = wallEff(x) + span0 * 0.8 + 0.2;
  return [x, top + row * 1.25];
};
/** a generation's rise: its forks stand this far above its parent's (as far as its time lets it swim) */
const RISE = [0, 2.3, 2.3, 2.3, 2.3, 1.8, 1.4, 1.2];
/** the fastest an organism swims (screen px per frame) */
const VMAX = 15;
const simulate = () => {
  const root = ORGS[0];
  root.f0 = -40;
  root.fArr = -40;
  FORKS.set(0, [0, 0]);
  const tips = ORGS.filter((o) => o.id !== 0 && !o.kids.length && !o.dock && (o.fdie === undefined || o.gen >= 5)).sort((a, b) => a.x - b.x);
  const rank = new Map<number, number>();
  tips.forEach((o, i) => rank.set(o.id, i));
  type St = { th0: number; tab: number[]; S: number; s: number; arrived: number; off: V2; vel: V2; dx: number; dy: number };
  const st = new Map<number, St>();
  const live = (o: Org, f: number) => f >= (o.id === 0 ? -40 : o.fb) && !(o.fd !== undefined && o.dd !== undefined && f >= o.fd + o.dd);
  const capsule = (o: Org, i: number, X: number, Y: number) => {
    const g = genomeAt(o, o.f0 + i);
    let half = (g.len + 2 * g.coil) / 2 + 0.1;
    if (o.fd !== undefined && o.f0 + i >= o.fd) half += 1.15 * sstep(o.fd, o.fd + (o.dd ?? 10) * 0.6, o.f0 + i);
    const r = g.girth * (1 + 0.5 * g.bulb) + (g.spikes > 1 ? g.spikeLen * 0.8 : 0) + (g.pili > 0.3 ? 0.12 : 0);
    const th = o.th[i] ?? 0;
    return { ax: X - Math.cos(th) * half, ay: Y - Math.sin(th) * half, bx: X + Math.cos(th) * half, by: Y + Math.sin(th) * half, r };
  };
  // closest points of two segments (the bodies' axes)
  const segSeg = (p: ReturnType<typeof capsule>, q: ReturnType<typeof capsule>) => {
    let best = { d: Infinity, nx: 0, ny: 0 };
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      const px = p.ax + (p.bx - p.ax) * t;
      const py = p.ay + (p.by - p.ay) * t;
      const vx = q.bx - q.ax;
      const vy = q.by - q.ay;
      const L = vx * vx + vy * vy;
      const u = L > 1e-9 ? Math.max(0, Math.min(1, ((px - q.ax) * vx + (py - q.ay) * vy) / L)) : 0;
      const dx = px - (q.ax + vx * u);
      const dy = py - (q.ay + vy * u);
      const d = Math.hypot(dx, dy);
      if (d < best.d) best = { d, nx: d > 1e-6 ? dx / d : 1, ny: d > 1e-6 ? dy / d : 0 };
    }
    return best;
  };
  for (let f = -40; f <= F_END; f++) {
    // births: plan the newborn's swim from where its half really is
    for (const o of ORGS) {
      if (o.id === 0 && f === -40) {
        st.set(0, { th0: divAxis(o), tab: [0], S: 0, s: 0, arrived: -40, off: [0, 0], vel: [0, 0], dx: 0, dy: 0 });
        continue;
      }
      if (o.id === 0 || f !== o.f0) continue;
      const P = ORGS[o.parent];
      const side = P.kids[0] === o.id ? -1 : 1;
      const pf = FORKS.get(P.id)!;
      o.P0 = pf;
      const dB = divisionAt(P, o.fb - 1e-3);
      // the parent's place at the birth (it is at its fork by then)
      const pX = P.X[P.X.length - 1];
      const pY = P.Y[P.Y.length - 1];
      const off = side < 0 ? dB.oa : dB.ob;
      const b0: V2 = [pX + off[0], pY + off[1]];
      const th0 = P.th[P.th.length - 1];
      const xDes = o.x * SPREAD[Math.min(SPREAD.length - 1, o.gen)];
      let p3: V2;
      if (o.dock) {
        o.row = -3;
        p3 = [DOCK_C.x, DOCK_C.y];
      } else if (o.fs !== undefined) {
        o.row = -2;
        let R = 0;
        for (let ff = o.fb; ff <= o.fs; ff++) R += (VMAX / kAt(ff)) * 0.62;
        const want: V2 = [xDes, Math.min(pf[1] - RISE[Math.min(RISE.length - 1, o.gen)], b0[1] - 0.6)];
        const d = Math.hypot(want[0] - b0[0], want[1] - b0[1]) || 1;
        const k = Math.min(1, R / d);
        p3 = [b0[0] + (want[0] - b0[0]) * k, Math.min(b0[1] - 0.5, b0[1] + (want[1] - b0[1]) * k)];
      } else if (o.fdie !== undefined && o.gen < 5) {
        o.row = 1;
        p3 = [xDes, b0[1] - 2.4];
      } else p3 = tipTarget(o, rank.get(o.id) ?? 0);
      const L = Math.hypot(p3[0] - b0[0], p3[1] - b0[1]) || 1;
      const hv = th0 + (side < 0 ? -0.6 : 0.12);
      const ch: V2 = [(p3[0] - b0[0]) / L, (p3[1] - b0[1]) / L];
      const a0: V2 = [0.5 * ch[0], 0.5 * ch[1] - 0.5];
      const al = Math.hypot(a0[0], a0[1]) || 1;
      const k1 = 0.36 * Math.min(L, 4);
      const k2 = 0.4 * L;
      o.B = [b0, [b0[0] + Math.cos(hv) * k1, b0[1] + Math.sin(hv) * k1], [p3[0] - (a0[0] / al) * k2, p3[1] - (a0[1] / al) * k2], p3];
      const tab = arcTable(o.B);
      // it inherits its parent's push (no jump at birth)
      const ps = st.get(P.id)!;
      st.set(o.id, { th0, tab, S: tab[tab.length - 1], s: 0, arrived: Infinity, off: [0, 0], vel: [ps.vel[0] * 0.5, ps.vel[1] * 0.5], dx: 0, dy: 0 });
    }
    // the planned place of everyone alive now
    const alive: Org[] = [];
    for (const o of ORGS) {
      if (!st.has(o.id) || f < o.f0) continue;
      const S = st.get(o.id)!;
      if (o.id === 0) {
        o.X.push(0);
        o.Y.push(0);
        o.ZZ.push(0);
        o.th.push(divAxis(o));
        o.U.push(1);
        o.HX.push(Math.cos(divAxis(o)));
        o.HY.push(Math.sin(divAxis(o)));
        if (live(o, f)) alive.push(o);
        continue;
      }
      let u: number;
      if (f < o.fb) u = 0;
      else if (o.fs !== undefined) u = sstep(o.fb, o.fs, f);
      else if (o.dock) {
        const w = c01((f - o.fb) / (DOCK.contact - o.fb));
        u = 1 - Math.pow(1 - w, 2.2);
      } else {
        const v = (CRUISE / kAt(f)) * (o.gen >= 6 ? 0.42 : 1.45) * sstep(o.fb, o.fb + 7, f) * (0.35 + 0.65 * c01((S.S - S.s) / 1.2));
        if (o.fdie === undefined || f < o.fdie) S.s = Math.min(S.S, S.s + v);
        if (S.s >= S.S - 1e-3 && S.arrived === Infinity) S.arrived = f;
        u = uOfS(S.tab, S.s);
      }
      if (o.fdie !== undefined && f >= o.fdie) u = o.U.length ? o.U[Math.min(o.U.length - 1, o.fdie - o.f0)] : u;
      o.fArr = o.fs ?? (o.dock ? DOCK.contact : S.arrived);
      const q = f < o.fb ? o.B[0] : bez(o.B, u);
      let X = q[0];
      let Y = q[1];
      if (o.row === 0 && o.fArr < Infinity && f > o.fArr) {
        const tau = f - o.fArr;
        const rec = 0.55 * Math.sin(Math.min(1, tau / 10) * Math.PI * 0.5) * (1 - 0.45 * sstep(10, 30, tau));
        const slipDir = hash01(o.id * 1.3) < 0.5 ? -1 : 1;
        X += slipDir * 0.3 * sstep(6, 60, tau);
        Y += rec;
      }
      if (o.row > 0 && o.fArr < Infinity && f > o.fArr) {
        const tau = f - o.fArr;
        X += 0.2 * Math.sin(tau * 0.05 + o.seed) * sstep(0, 20, tau);
        Y += 0.12 * Math.sin(tau * 0.04 + o.seed * 1.7) * sstep(0, 20, tau);
      }
      if (o.fdie !== undefined && f > o.fdie) {
        const tau = f - o.fdie;
        Y += (0.0022 * Math.min(tau, 24) * Math.min(tau, 24) + 0.1 * Math.max(0, tau - 24)) * (60 / kAt(f)) * 0.9;
        X += Math.sign(X - 0.5 || 1) * 0.012 * tau * (60 / kAt(f));
      }
      const d = bezD(o.B, Math.min(0.999, Math.max(0.001, u)));
      let th = Math.atan2(d[1], d[0]);
      th = S.th0 + angDiff(S.th0, th) * sstep(o.fb, o.fb + 8, f);
      if (o.fd !== undefined) th = th + angDiff(th, divAxis(o)) * sstep(o.fd - 8, o.fd, f);
      if (o.fdie !== undefined && f > o.fdie && o.th.length) th = o.th[o.th.length - 1];
      const hl = Math.hypot(d[0], d[1]) || 1;
      S.dx = X;
      S.dy = Y;
      o.th.push(th);
      o.U.push(u);
      o.HX.push(d[0] / hl);
      o.HY.push(d[1] / hl);
      if (live(o, f)) alive.push(o);
      else {
        o.X.push(X + S.off[0]);
        o.Y.push(Y + S.off[1]);
        o.ZZ.push(o.Z);
      }
    }
    // keep a clear gap between bodies: a soft, damped push (the docking variant is left on its path at the end)
    const caps = alive.map((o) => {
      const S = st.get(o.id)!;
      if (o.id === 0) return capsule(o, o.th.length - 1, 0, 0);
      return capsule(o, o.th.length - 1, S.dx + S.off[0], S.dy + S.off[1]);
    });
    const force = alive.map(() => [0, 0] as V2);
    for (let i = 0; i < alive.length; i++)
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i];
        const b = alive[j];
        const dyingA = a.fdie !== undefined && f > a.fdie + 4;
        const dyingB = b.fdie !== undefined && f > b.fdie + 4;
        if (dyingA && dyingB) continue;
        if ((a.parent === b.parent && a.parent >= 0 && f < Math.max(a.fb, b.fb) + 5) || a.id === b.parent || b.id === a.parent) continue;
        // the family's order across the frame is kept (left lineages stay left: their branches never cross)
        if (!dyingA && !dyingB && a.id !== 0 && b.id !== 0) {
          const ia = a.X.length;
          void ia;
          const xa = (st.get(a.id)!.dx + st.get(a.id)!.off[0]);
          const xb = (st.get(b.id)!.dx + st.get(b.id)!.off[0]);
          const ya = st.get(a.id)!.dy;
          const yb = st.get(b.id)!.dy;
          if (Math.abs(ya - yb) < 4) {
            const [L, Rr, xl, xr, il, ir] = a.x <= b.x ? [a, b, xa, xb, i, j] : [b, a, xb, xa, j, i];
            void L;
            void Rr;
            const need = 0.9 - (xr - xl);
            if (need > 0) {
              const p = Math.min(0.12, need * 0.12);
              force[il][0] -= p;
              force[ir][0] += p;
            }
          }
        }
        const ss = segSeg(caps[i], caps[j]);
        const gap = ss.d - caps[i].r - caps[j].r;
        const want = 0.6;
        if (gap < want) {
          const p = Math.min(0.14, (want - gap) * 0.11);
          // the drained give way; the living are not pushed by them
          if (!dyingA) {
            force[i][0] += ss.nx * p * (dyingB ? 0.15 : 1);
            force[i][1] += ss.ny * p * (dyingB ? 0.15 : 1);
          }
          if (!dyingB) {
            force[j][0] -= ss.nx * p * (dyingA ? 0.15 : 1);
            force[j][1] -= ss.ny * p * (dyingA ? 0.15 : 1);
          }
          if (dyingA) {
            force[i][0] += ss.nx * p;
            force[i][1] += ss.ny * p;
          }
          if (dyingB) {
            force[j][0] -= ss.nx * p;
            force[j][1] -= ss.ny * p;
          }
        }
      }
    // the payoff keeps its room: nobody crowds the docking site or the copies coming out of the cell
    alive.forEach((o, i) => {
      if (o.id === 0 || o.dock) return;
      const S = st.get(o.id)!;
      const X = S.dx + S.off[0];
      const Y = S.dy + S.off[1];
      const room = (cx: number, cy: number, R: number, k: number) => {
        const dx = X - cx;
        const dy = Y - cy;
        const d = Math.hypot(dx, dy);
        if (d < R && d > 1e-3) {
          force[i][0] += (dx / d) * k * (R - d);
          force[i][1] += (dy / d) * k * (R - d);
        }
      };
      if (f > 96) room(DOCK_C.x, DOCK_C.y - 0.5, lerp(3.6, 5.2, sstep(BEAT.whatever, BEAT.give, f)), 0.03);
      for (const cp of COPIES) {
        if (f < cp.f0 - 16) continue;
        const ca = copyAt(cp, Math.max(f, cp.f0 + cp.dur * 0.8));
        room(ca.x, ca.y, 3.9 * sstep(cp.f0 - 16, cp.f0, f), 0.1);
      }
    });
    alive.forEach((o, i) => {
      if (o.id === 0) return;
      const S = st.get(o.id)!;
      const pin = o.dock ? 1 - sstep(100, 116, f) : 1;
      S.vel[0] = (S.vel[0] * 0.72 + force[i][0] - 0.03 * S.off[0]) * pin;
      S.vel[1] = (S.vel[1] * 0.72 + force[i][1] - 0.03 * S.off[1]) * pin;
      S.off[0] = (S.off[0] + S.vel[0]) * (o.dock ? pin : 1);
      S.off[1] = (S.off[1] + S.vel[1]) * (o.dock ? pin : 1);
      o.X.push(S.dx + S.off[0]);
      o.Y.push(S.dy + S.off[1]);
      o.ZZ.push(o.Z + (o.fdie !== undefined && f > o.fdie ? 0.02 * (f - o.fdie) : 0));
    });
    // a parent's fork: where it really is at its split
    for (const o of alive) {
      if (o.fs !== undefined && f === Math.round(o.fs) && !FORKS.has(o.id)) FORKS.set(o.id, [o.X[o.X.length - 1], o.Y[o.Y.length - 1]]);
    }
  }
  // the root's fork
  FORKS.set(0, [0, 0]);
};
simulate();

/** the strand of an organism at f: ONE cubic (world) from its parent's fork to where it is (to its own fork once it
 *  has divided), leaving the fork to its own side; and how old it is (0 new .. 1 an old internode) */
export const strandOf = (o: Org, f: number): { B: Bez; age: number; fadeIn: number } | null => {
  if (o.id === 0 || f < o.fb) return null;
  const P = ORGS[o.parent];
  const side = P.kids[0] === o.id ? -1 : 1;
  const fe = o.fs !== undefined ? Math.min(f, o.fs) : o.fdie !== undefined ? Math.min(f, o.fdie) : f;
  const i = Math.max(0, Math.min(o.X.length - 1, Math.floor(fe) - o.f0));
  const e: V2 = [o.X[i], o.Y[i]];
  const hm: V2 = [o.HX[i] * 0.5, o.HY[i] * 0.5 - 0.5];
  const hml = Math.hypot(hm[0], hm[1]) || 1;
  const h: V2 = [hm[0] / hml, hm[1] / hml];
  const p0 = o.P0;
  const L = Math.hypot(e[0] - p0[0], e[1] - p0[1]);
  // it leaves its fork to its own side (more across for a long run, so it keeps out of its cousins' way), then bends
  // up into the organism's own heading
  const lo = c01((L - 2.5) / 4);
  const ang = lerp(0.8, 1.15, lo);
  let dep: V2 = [side * Math.sin(ang), -Math.cos(ang)];
  // a rear daughter still below its fork: the strand runs straight down to it (no loop round the fork)
  if (L > 1e-3) {
    const ch: V2 = [(e[0] - p0[0]) / L, (e[1] - p0[1]) / L];
    const w = c01(ch[1] * 2.5 + 0.2);
    const m: V2 = [lerp(dep[0], ch[0], w), lerp(dep[1], ch[1], w)];
    const ml = Math.hypot(m[0], m[1]) || 1;
    dep = [m[0] / ml, m[1] / ml];
  }
  const k1 = lerp(0.38, 0.55, lo) * L;
  const k2 = lerp(0.38, 0.3, lo) * L;
  const B: Bez = [p0, [p0[0] + dep[0] * k1, p0[1] + dep[1] * k1], [e[0] - h[0] * k2, e[1] - h[1] * k2], e];
  return { B, age: o.fs !== undefined ? sstep(o.fs + 22, o.fs + 52, f) : 0, fadeIn: sstep(o.fb, o.fb + 7, f) };
};

// the docking variant arrives under the socket on WEAKNESS (its top club spike then turns up into the cup)
const DOCK_ORG = ORGS.find((o) => o.dock);
export const dockOrg = () => DOCK_ORG;
export const dockState = (f: number) => {
  // contact on WEAKNESS; first reaction the next frame (the cup closes on the club, the orange starts there)
  const contact = DOCK.contact;
  const orangeR = sstep(contact, contact + 13, f);
  const settle = sstep(contact + 2, contact + 20, f);
  const wrap = sstep(contact + 6, contact + 30, f);
  const morph = sstep(contact + 1, contact + 16, f);
  return { contact, orangeR, settle, wrap, morph };
};
/** the docking variant's centre at f (after contact its club stays in the cup: the caller adds the genome's tip) */
export const dockPos = (o: Org, f: number): { X: number; Y: number; Z: number } => {
  const i = Math.max(0, Math.min(o.X.length - 1, Math.round(f) - o.f0));
  return { X: o.X[i], Y: o.Y[i], Z: o.ZZ[i] };
};

export { ORGS };
export type { V3 };
