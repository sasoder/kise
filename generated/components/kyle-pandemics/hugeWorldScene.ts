// ---------------------------------------------------------------------------
// hugeWorldScene: the world of HugeWorldOfBacteria (kyle-pandemics, cut 23): the one pinhole camera, the bacteria
// population on the ground plane, the swimmers, the TB rod and the macrophage's field. Pure maths, no drawing.
//
// UNITS: micrometres-ish (a coccus ~1 unit across, the TB rod 3.2 x 0.42). Ground coords X (right), Z (depth, away
// from the camera), height Y (up, the ground is Y = 0). The TB rod lies centred on the origin.
// THE CAMERA: one pinhole looking along +Z with a horizontal axis (one VP on the frame's centre line, x 540, at the
// horizon). Its lens shift `hs` puts the horizon at screen y hs, so a crane up is a real rise plus a shift of the
// horizon (no keystone): sx = 540 + F (X - cx) / D, sy = hs + F (h - Y) / D, D = Z - cz. Parallax is real.
// ---------------------------------------------------------------------------
import { makeRng, pchip } from "../kits/maps/incaShared";

export const FPS = 30000 / 1001;
export const DURATION = 235;
export const F = 1400; // focal length, px

export type Cam3 = { x: number; h: number; z: number; hs: number };
export type P3 = [number, number, number]; // X, Y (height), Z

// ---------------------------------------------------------------------------
// THE TB ROD (the subject): slender, slightly curved, lying on the ground at the origin
// ---------------------------------------------------------------------------
export const ROD = { L: 3.2, R: 0.21, ang: (17 * Math.PI) / 180, bow: 0.13 };
const rodDir: [number, number] = [Math.cos(ROD.ang), Math.sin(ROD.ang)];
const rodNrm: [number, number] = [-rodDir[1], rodDir[0]];
/** the rod's axis as ground points (u from -L/2 to L/2), resting on the ground (Y = R) */
export const rodAxis = (n = 12): P3[] => {
  const pts: P3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = -ROD.L / 2 + (ROD.L * i) / n;
    const s = (2 * u) / ROD.L;
    const v = ROD.bow * (1 - s * s);
    pts.push([rodDir[0] * u + rodNrm[0] * v, ROD.R, rodDir[1] * u + rodNrm[1] * v]);
  }
  return pts;
};
/** rod-frame coords (u along, v across) of a ground point */
export const rodFrame = (X: number, Z: number) => ({ u: X * rodDir[0] + Z * rodDir[1], v: X * rodNrm[0] + Z * rodNrm[1] });
export const fromRodFrame = (u: number, v: number): [number, number] => [rodDir[0] * u + rodNrm[0] * v, rodDir[1] * u + rodNrm[1] * v];

// ---------------------------------------------------------------------------
// THE CAMERA TRACK. f0-85 a low dolly forward and to the right (h 1), the rod coming into the centre on "BACTERIAL
// PATHOGEN"; f85-205 a crane up and back (h 1 -> 11, back 21 units) so the field runs to the horizon; then a creep.
// The horizon (lens shift) is derived so the rod's screen y follows yRod (CRAFT: framing from the zoom).
// ---------------------------------------------------------------------------
const CX = pchip([
  [0, -3.6],
  [84, 0],
  [150, 0.7],
  [212, 3.75],
  [235, 3.95],
]);
const CZ = pchip([
  [0, -17.5],
  [84, -9],
  [163, -33],
  [212, -31.8],
  [235, -31.4],
]);
const CH = pchip([
  [0, 3.0],
  [78, 3.0],
  [160, 16.4],
  [212, 13.0],
  [235, 12.8],
]);
// the point the framing follows: the rod, then (as the camera eases back in) the macrophage's resting place
const FOCUS_END: [number, number] = [4.0, 0.3];
const focusAt = (f: number): [number, number] => {
  const w = sstep0((f - 150) / 62);
  return [FOCUS_END[0] * w, FOCUS_END[1] * w];
};
const YFOC = pchip([
  [0, 800],
  [84, 880],
  [165, 850],
  [212, 870],
  [235, 868],
]);
function sstep0(v: number) {
  const u = Math.max(0, Math.min(1, v));
  return u * u * (3 - 2 * u);
}
export const camAt = (f: number): Cam3 => {
  const x = CX(f);
  const z = CZ(f);
  const h = CH(f);
  const [, fz] = focusAt(f);
  const D = fz - z;
  const hs = YFOC(f) - (F * (h - ROD.R)) / D;
  return { x, h, z, hs };
};
export const project = (c: Cam3, X: number, Y: number, Z: number): [number, number, number] => {
  const D = Z - c.z;
  return [540 + (F * (X - c.x)) / D, c.hs + (F * (c.h - Y)) / D, D];
};

// ---------------------------------------------------------------------------
// THE MACROPHAGE: a metaball field over the ground. Its centre crawls in from the right (off frame), the leading
// pseudopods reach the rod (CONTACT), two arms run round the rod's near and far sides and curl in past its left end,
// then the body flows over it. Levels of the field are slices of the cell at rising heights.
// ---------------------------------------------------------------------------
const MX = pchip([
  [130, 27.5],
  [173, 9.7],
  [197, 9.1],
  [214, 4.3],
  [235, 4.0],
]);
const MZ = pchip([
  [130, 0.9],
  [212, 0.35],
  [235, 0.3],
]);
export const CONTACT_F = 177; // the first frame the leading edge touches the rod (field >= skirt iso on the rod's axis)
export const cellCentre = (f: number): [number, number] => [MX(f), MZ(f)];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (v: number) => {
  const u = clamp01(v);
  return u * u * (3 - 2 * u);
};
/** the arms' extension 0..1 (round the rod) and the closing 0..1 (arms in, body over) */
export const armExt = (f: number) => sstep((f - CONTACT_F) / 22);
/** the arms as pseudopod tubes round the rod: radius, distance from the rod's axis, how solid (they melt into the
 *  membrane as it closes over) */
export const ARM = { R: 0.4, off: 0.88 };
export const armSolid = (f: number) => 1 - sstep((f - 201) / 12);

export const closing = (f: number) => sstep((f - 197) / 14);

type Ball = { x: number; z: number; R: number; w: number };
type Cap = { pts: [number, number][]; R: number; w: number };
export type CellField = { balls: Ball[]; caps: Cap[]; f: number; cx: number; cz: number };
/** the arm path round the rod, in rod-frame (u, v): from the right end, along one side, curling in past the left end */
export const armPath = (side: 1 | -1, off: number, ext: number): [number, number][] => {
  const L2 = ROD.L / 2;
  const pts: [number, number][] = [];
  const N = 22;
  // the path: start at (L2 + 1.6, side*0.4) -> (L2 + 0.4, side*off) -> along to (-L2 - 0.3, side*off) -> curl to (-L2 - 1.2, side*0.2)
  const key: [number, number][] = [
    [L2 + 1.9, side * 0.5],
    [L2 + 0.6, side * off],
    [0, side * (off + 0.12)],
    [-L2 - 0.2, side * off],
    [-L2 - 1.05, side * off * 0.45],
    [-L2 - 1.3, side * 0.05],
  ];
  // cumulative length
  const segL = key.slice(1).map((p, i) => Math.hypot(p[0] - key[i][0], p[1] - key[i][1]));
  const tot = segL.reduce((a, b) => a + b, 0);
  const upto = tot * ext;
  for (let i = 0; i <= N; i++) {
    let s = (upto * i) / N;
    let k = 0;
    while (k < segL.length - 1 && s > segL[k]) {
      s -= segL[k];
      k++;
    }
    const t = Math.min(1, s / segL[k]);
    pts.push([key[k][0] + (key[k + 1][0] - key[k][0]) * t, key[k][1] + (key[k + 1][1] - key[k][1]) * t]);
  }
  return pts.map(([u, v]) => fromRodFrame(u, v));
};
export const cellField = (f: number): CellField => {
  const [cx, cz] = cellCentre(f);
  const g = f / FPS;
  const balls: Ball[] = [
    { x: cx, z: cz, R: 9.2, w: 3.6 },
    // the broad flat lamellipodium at the leading edge (thin: it only lifts the field into the skirt)
    { x: cx - 3.8, z: cz - 0.2, R: 6.0, w: 0.62 },
  ];
  // lobes, drifting slowly round the body
  const lobes = [
    { a: 1.0, d: 2.9, w: 1.6, R: 6.2 },
    { a: 3.3, d: 3.1, w: 1.5, R: 6.0 },
    { a: 5.0, d: 2.6, w: 1.3, R: 5.6 },
    { a: 2.2, d: 3.4, w: 0.9, R: 4.8 },
  ];
  lobes.forEach((l, i) => {
    const a = l.a + 0.18 * Math.sin(g * 0.9 + i * 1.7);
    balls.push({ x: cx + Math.cos(a) * l.d, z: cz + Math.sin(a) * l.d * 0.85, R: l.R, w: l.w });
  });
  const caps: Cap[] = [];
  // leading pseudopods while crawling (flat, w ~1): two broad fingers reaching ahead (to the left), the body's
  // trailing edge retracting; they shrink into the arms as the arms take over
  const lead = 1 - clamp01((f - 192) / 14);
  if (lead > 0) {
    const reach = 2.2 + 0.9 * Math.sin(g * 1.4) * 0.5 + 0.6 * clamp01((f - 160) / 30);
    [
      { dz: -1.6, ph: 0 },
      { dz: 1.9, ph: 2.1 },
    ].forEach((q) => {
      const x0 = cx - 5.0;
      // the fingertips reach for the rod but stop at its end (the arms take over from there)
      const r = Math.min(reach + 0.45 * Math.sin(g * 1.9 + q.ph), x0 - 2.1);
      const z0 = cz + q.dz;
      caps.push({
        pts: [
          [x0 + 1.5, cz + q.dz * 0.9],
          [x0 - r * 0.55, z0 + q.dz * 0.18],
          [x0 - r, z0 + q.dz * 0.32],
        ],
        R: 2.5,
        w: 1.05 * lead,
      });
    });
  }
  // the arms round the rod
  const e = armExt(f);
  const c = closing(f);
  // (the arms themselves are drawn as tubes, ARM below; in the field they only arrive with the closing, when the
  // membrane flows over the rod between them)
  if (e > 0.001 && c > 0.001) {
    const off = 1.4 - 0.5 * c;
    const w = 1.95 * c;
    caps.push({ pts: armPath(1, off, e), R: 2.4, w });
    caps.push({ pts: armPath(-1, off, e), R: 2.4, w });
  }
  return { balls, caps, f, cx, cz };
};
const g3 = (t2: number) => {
  if (t2 >= 1) return 0;
  const a = 1 - t2;
  return a * a * a;
};
const segD2 = (px: number, pz: number, a: [number, number], b: [number, number]) => {
  const vx = b[0] - a[0];
  const vz = b[1] - a[1];
  const L2 = vx * vx + vz * vz;
  const t = L2 > 1e-9 ? Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / L2)) : 0;
  const dx = px - (a[0] + vx * t);
  const dz = pz - (a[1] + vz * t);
  return dx * dx + dz * dz;
};
/** the field value at a ground point (with the ruffle: a small displacement that slowly churns) */
const rawField = (cf: CellField, px: number, pz: number) => {
  let v = 0;
  // the body is a little longer along its crawl (X) than across it
  for (const b of cf.balls) v += b.w * g3(((px - b.x) ** 2 + 1.35 * (pz - b.z) ** 2) / (b.R * b.R));
  for (const c of cf.caps) {
    let d2 = Infinity;
    for (let i = 0; i < c.pts.length - 1; i++) d2 = Math.min(d2, segD2(px, pz, c.pts[i], c.pts[i + 1]));
    v += c.w * g3(d2 / (c.R * c.R));
  }
  return v;
};
/** the field value at a ground point; near the edge, the ruffle (a small displacement that slowly churns) */
export const fieldAt = (cf: CellField, X: number, Z: number) => {
  const v0 = rawField(cf, X, Z);
  if (v0 > 1.6 || v0 < 0.05) return v0;
  const g = cf.f / FPS;
  const ang = Math.atan2(Z - cf.cz, X - cf.cx);
  // frillier along the leading (left) edge
  const lead = 1 + 1.1 * Math.max(0, -Math.cos(ang));
  const ruf = lead * (0.2 * Math.sin(ang * 9 + g * 1.3) + 0.15 * Math.sin(ang * 17 - g * 2.1 + 1.3) + 0.1 * Math.sin(ang * 29 + g * 3.0));
  const v1 = rawField(cf, X + Math.cos(ang) * ruf, Z + Math.sin(ang) * ruf);
  const w = 1 - sstep((v0 - 0.4) / 1.2);
  return v0 + (v1 - v0) * w;
};
/** the slices: field iso level -> height of the slice */
export const LEVELS: { iso: number; y: number }[] = [
  { iso: 0.45, y: 0.02 },
  { iso: 0.8, y: 0.25 },
  // the frills of the lamellipodium: fold lines inside the skirt
  { iso: 0.54, y: 0.06 },
  { iso: 0.65, y: 0.13 },
];

/** marching squares over the field: for each level, its closed loops as ground points */
export type CellGrid = { x0: number; z0: number; nx: number; nz: number; step: number; val: Float32Array };
/** the field sampled on a ground grid round the cell (zero on the border, so every contour closes) */
export const cellGrid = (cf: CellField, step = 0.24): CellGrid => {
  const x0 = cf.cx - 13.5;
  const z0 = cf.cz - 11;
  const nx = Math.ceil(27 / step) + 1;
  const nz = Math.ceil(22 / step) + 1;
  const val = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) val[j * nx + i] = i === 0 || j === 0 || i === nx - 1 || j === nz - 1 ? 0 : fieldAt(cf, x0 + i * step, z0 + j * step);
  return { x0, z0, nx, nz, step, val };
};
/** the cell's height over a field value: a thin skirt (the lamellipodium, <= 0.25) then the domed body to ~5.2 */
// a low soft cushion: wider than tall, the top gently rounded (it saturates), not a cone
export const heightOf = (v: number) => (v < 0.45 ? 0 : v < 0.8 ? 0.22 * sstep((v - 0.45) / 0.35) : 0.22 + 2.35 * (1 - Math.exp(-(v - 0.8) / 1.25)));
export const cellContours = (cf: CellField, grid?: CellGrid): [number, number][][][] => {
  const { x0, z0, nx, nz, step, val } = grid ?? cellGrid(cf);
  return LEVELS.map(({ iso }) => {
    const pt = new Map<number, [number, number]>();
    const adj = new Map<number, number[]>();
    const edgePt = (key: number) => {
      let p = pt.get(key);
      if (p) return p;
      const cell = key >> 1;
      const i = cell % nx;
      const j = Math.floor(cell / nx);
      const a = val[j * nx + i];
      if ((key & 1) === 0) {
        const b = val[j * nx + i + 1];
        const t = (iso - a) / (b - a);
        p = [x0 + (i + t) * step, z0 + j * step];
      } else {
        const b = val[(j + 1) * nx + i];
        const t = (iso - a) / (b - a);
        p = [x0 + i * step, z0 + (j + t) * step];
      }
      pt.set(key, p);
      return p;
    };
    const link = (a: number, b: number) => {
      (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
      (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
    };
    for (let j = 0; j < nz - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        const bl = val[j * nx + i] >= iso ? 1 : 0;
        const br = val[j * nx + i + 1] >= iso ? 1 : 0;
        const tr = val[(j + 1) * nx + i + 1] >= iso ? 1 : 0;
        const tl = val[(j + 1) * nx + i] >= iso ? 1 : 0;
        const c = bl | (br << 1) | (tr << 2) | (tl << 3);
        if (c === 0 || c === 15) continue;
        const B = (j * nx + i) * 2;
        const T = ((j + 1) * nx + i) * 2;
        const Lf = (j * nx + i) * 2 + 1;
        const Rt = (j * nx + i + 1) * 2 + 1;
        const centre = (val[j * nx + i] + val[j * nx + i + 1] + val[(j + 1) * nx + i + 1] + val[(j + 1) * nx + i]) / 4 >= iso;
        switch (c) {
          case 1:
          case 14:
            link(Lf, B);
            break;
          case 2:
          case 13:
            link(B, Rt);
            break;
          case 3:
          case 12:
            link(Lf, Rt);
            break;
          case 4:
          case 11:
            link(Rt, T);
            break;
          case 6:
          case 9:
            link(B, T);
            break;
          case 7:
          case 8:
            link(Lf, T);
            break;
          case 5:
            if (centre) {
              link(Lf, T);
              link(B, Rt);
            } else {
              link(Lf, B);
              link(Rt, T);
            }
            break;
          case 10:
            if (centre) {
              link(Lf, B);
              link(Rt, T);
            } else {
              link(Lf, T);
              link(B, Rt);
            }
            break;
        }
      }
    const seen = new Set<number>();
    const loops: [number, number][][] = [];
    for (const start of adj.keys()) {
      if (seen.has(start)) continue;
      const loop: [number, number][] = [];
      let prev = -1;
      let cur = start;
      for (let guard = 0; guard < 100000; guard++) {
        seen.add(cur);
        loop.push(edgePt(cur));
        const nb = adj.get(cur)!;
        const nxt = nb[0] !== prev ? nb[0] : nb[1];
        if (nxt === undefined || nxt === start) break;
        prev = cur;
        cur = nxt;
        if (seen.has(cur)) break;
      }
      if (loop.length > 3) loops.push(loop);
    }
    return loops;
  });
};

// ---------------------------------------------------------------------------
// THE POPULATION
// ---------------------------------------------------------------------------
export type Kind = "coccus" | "diplo" | "staph" | "strep" | "bacillus" | "chainrod" | "vibrio" | "spiro" | "flagrod";
export type Bug = {
  id: number;
  kind: Kind;
  X: number;
  Z: number;
  ang: number; // heading on the ground
  size: number; // scale ~1
  n: number; // count (spheres in a cluster or chain, rods in a chain, flagella)
  seed: number;
  height: number; // the tallest point (for the camera corridor)
  /** sphere offsets for clusters (local, unrotated): [x, y, z, r] */
  balls?: [number, number, number, number][];
  bend: number;
  divide: boolean;
  pili: boolean;
};
const KINDS: [Kind, number][] = [
  ["coccus", 0.13],
  ["diplo", 0.13],
  ["staph", 0.08],
  ["strep", 0.12],
  ["bacillus", 0.24],
  ["chainrod", 0.06],
  ["vibrio", 0.1],
  ["spiro", 0.06],
  ["flagrod", 0.08],
];
const pickKind = (u: number): Kind => {
  let a = 0;
  for (const [k, w] of KINDS) {
    a += w;
    if (u < a) return k;
  }
  return "bacillus";
};
// spread out on the ground with gaps: sparse under the low camera, the crowd thickening with distance on screen
const spacingAt = (Z: number) => (Z < -3 ? 2.45 : Z < 12 ? 2.35 : Z < 40 ? 2.35 + (Z - 12) * 0.018 : 2.85 + (Z - 40) * 0.011);
const makeBug = (id: number, X: number, Z: number, rng: () => number): Bug => {
  let kind = pickKind(rng());
  // no corkscrews right under the low camera (end-on and huge they read as springs)
  if (kind === "spiro" && Z < 2 && Math.abs(X) < 9) kind = "bacillus";
  // nor flagella round the macrophage's last place (they would lay thin lines across it)
  if ((kind === "flagrod" || kind === "vibrio") && Math.hypot(X - 3.5, Z - 0.3) < 12) kind = "bacillus";
  // the quiet foreground under the dolly: only small, single organisms
  const fore = Z < -3;
  if (fore && (kind === "staph" || kind === "strep" || kind === "chainrod" || kind === "spiro")) kind = rng() < 0.5 ? "coccus" : "diplo";
  const a0 = rng() * Math.PI * 2;
  // corkscrews lie roughly across the view (end-on they read as rings)
  const ang = kind === "spiro" ? ((a0 % Math.PI) / Math.PI - 0.5) * 1.3 + (a0 > Math.PI ? Math.PI : 0) : a0;
  const size = (fore ? 0.72 : 0.85) + (fore ? 0.18 : 0.3) * rng();
  const seed = rng() * 1000;
  let n = 1;
  let height = 1;
  let balls: Bug["balls"];
  if (kind === "staph") {
    n = 5 + Math.floor(rng() * 3);
    balls = [];
    const r = 0.42;
    // a grape cluster lying on the ground: one layer, at most one on top
    for (let i = 0; i < n; i++) {
      const top = i === n - 1 && n > 6;
      const a = i * 2.4 + rng() * 0.5;
      const rad = top ? 0.1 : 0.45 + 0.42 * Math.sqrt(i / n);
      balls.push([Math.cos(a) * rad, top ? r + 0.6 : r, Math.sin(a) * rad, r * (0.92 + 0.16 * rng())]);
    }
    height = n > 6 ? 1.45 : 0.84;
  } else if (kind === "strep") {
    n = 4 + Math.floor(rng() * 6);
    balls = [];
    const r = 0.37;
    const bend = (rng() - 0.5) * 0.5;
    let x = 0;
    let z = 0;
    let a = 0;
    for (let i = 0; i < n; i++) {
      balls.push([x, r, z, r * (0.95 + 0.1 * rng())]);
      a += bend + (rng() - 0.5) * 0.3;
      x += Math.cos(a) * 0.7;
      z += Math.sin(a) * 0.7;
    }
    const mx = x / 2;
    const mz = z / 2;
    balls.forEach((b) => {
      b[0] -= mx;
      b[2] -= mz;
    });
    height = 0.75;
  } else if (kind === "diplo") {
    balls = [
      [-0.4, 0.42, 0, 0.43],
      [0.4, 0.42, 0, 0.43],
    ];
    height = 0.86;
  } else if (kind === "coccus") {
    const r = 0.45 + 0.12 * rng();
    balls = [[0, r, 0, r]];
    height = 2 * r;
  } else if (kind === "chainrod") n = 2 + Math.floor(rng() * 2);
  else if (kind === "flagrod") n = 4 + Math.floor(rng() * 3);
  if (kind === "bacillus" || kind === "chainrod" || kind === "flagrod") height = 0.95;
  if (kind === "vibrio") height = 0.62;
  if (kind === "spiro") height = 0.7;
  // organisms, not pills: some rods bent, a few dividing (a waist), some with pili
  const bend = (rng() - 0.5) * 0.5;
  const divide = rng() < 0.16;
  const pili = rng() < 0.3;
  return { id, kind, X, Z, ang, size, n, seed, height: height * size, balls, bend, divide, pili };
};

/** a bug's footprint radius (for clearing / pushing) */
export const bugRadius = (b: Bug) => {
  switch (b.kind) {
    case "spiro":
      return 3.6 * b.size;
    case "chainrod":
      return 1.25 * b.n * b.size;
    case "strep":
      return 0.35 * b.n * b.size + 0.4;
    case "flagrod":
      return 1.6 * b.size;
    case "bacillus":
      return 1.2 * b.size;
    default:
      return 0.9 * b.size;
  }
};

const rodSegDist = (X: number, Z: number) => {
  const { u, v } = rodFrame(X, Z);
  const uu = Math.max(-ROD.L / 2, Math.min(ROD.L / 2, u));
  return Math.hypot(u - uu, v);
};

const buildPopulation = () => {
  const rng = makeRng(2323);
  const bugs: Bug[] = [];
  const hash = new Map<number, Bug[]>();
  let id = 0;
  let Z = -34;
  while (Z < 430) {
    const s = spacingAt(Z);
    const half = 0.42 * (Z + 36) + 10;
    const row = Math.round(Z / s);
    for (let X = -half + (row % 2) * s * 0.5; X < half; X += s) {
      const jx = (rng() - 0.5) * s * 0.8;
      const jz = (rng() - 0.5) * s * 0.8;
      const b = makeBug(id++, X + jx, Z + jz, rng);
      // never stacked: a bug that would lie across another is left out
      const rb = bugRadius(b) * 0.8;
      const gx = Math.floor(b.X / 4);
      const gz = Math.floor(b.Z / 4);
      let hit = false;
      for (let ix = gx - 2; ix <= gx + 2 && !hit; ix++)
        for (let iz = gz - 2; iz <= gz + 2 && !hit; iz++)
          for (const o of hash.get(ix * 100003 + iz) ?? []) {
            if (Math.hypot(o.X - b.X, o.Z - b.Z) < (rb + bugRadius(o) * 0.8) * 0.92) {
              hit = true;
              break;
            }
          }
      if (hit) continue;
      const key = gx * 100003 + gz;
      (hash.get(key) ?? hash.set(key, []).get(key)!).push(b);
      bugs.push(b);
    }
    Z += s;
  }
  // clearings
  return bugs.filter((b) => {
    const r = bugRadius(b);
    // the rod's own room
    if (rodSegDist(b.X, b.Z) < 0.45 + r) return false;
    // the camera's low path (f0-120): nothing that reaches the lens's height stands in its way
    if (b.height > 1.4)
      for (let f = 0; f <= 120; f += 3) {
        const c = camAt(f);
        const dz = b.Z - c.z;
        const dx = b.X - c.x;
        if (dz > -1 && dz < 2.5 && Math.abs(dx) < 0.9 + r) return false;
      }
    return true;
  });
};
export const BUGS: Bug[] = buildPopulation();

/** the line of sight to the rod stays open from f40 on: nothing nearer than the rod covers its screen box */
const sightClear = () => {
  const keep = new Set(BUGS.map((b) => b.id));
  // flagellated bugs near the rod would lay a flagellum across it
  BUGS.forEach((b) => {
    if ((b.kind === "flagrod" || b.kind === "vibrio" || b.kind === "spiro") && Math.hypot(b.X, b.Z) < 3.8) keep.delete(b.id);
  });
  for (let f = 30; f <= 120; f += 3) {
    const c = camAt(f);
    const ax = rodAxis(6).map((p) => project(c, p[0], p[1], p[2]));
    const w = (F * ROD.R) / (0 - c.z);
    const rx0 = Math.min(...ax.map((p) => p[0])) - w - 6;
    const rx1 = Math.max(...ax.map((p) => p[0])) + w + 6;
    const ry1 = ax.reduce((a, p) => a + p[1], 0) / ax.length; // the rod's centre line: lower bugs may lap its bottom edge
    for (const b of BUGS) {
      if (!keep.has(b.id)) continue;
      const D = b.Z - c.z;
      if (D <= 0.5 || D >= 0 - c.z + 0.3) continue;
      const r = bugRadius(b) * 0.85;
      const p = project(c, b.X, b.height, b.Z);
      const half = (F * r) / D;
      // nearer than the rod, overlapping its columns, and standing up into its band: it would cover the rod
      if (p[0] + half > rx0 && p[0] - half < rx1 && p[1] < ry1) keep.delete(b.id);
    }
  }
  return BUGS.filter((b) => keep.has(b.id));
};
export const FIELD: Bug[] = sightClear();

// ---------------------------------------------------------------------------
// PUSHES: the macrophage shoves the bugs in its path aside (a moving disk along -X), the arms push the ones round
// the rod outward as they pass. Both are pure functions of the frame.
// ---------------------------------------------------------------------------
const PUSH_R = 7.6;
export const pushed = (b: Bug, f: number): [number, number] => {
  let X = b.X;
  let Z = b.Z;
  const r = bugRadius(b) * 0.6;
  const [cx, cz] = cellCentre(Math.max(130, f));
  const R = PUSH_R + r;
  const dz = Z - cz;
  if (Math.abs(b.X - cx) < R && f > 130) {
    // the disk parts the crowd like a hull: |dz| at least the chord where it is; behind it the crowd closes again
    const dx = b.X - cx;
    const behind = Math.max(0, dx);
    const need = Math.abs(dx) < R ? Math.sqrt(Math.max(0, R * R - dx * dx)) * (dx > 0 ? Math.exp(-behind / 9) : 1) : 0;
    const M = 6.5;
    if (Math.abs(dz) < need + M) {
      const s = dz >= 0 ? 1 : -1;
      Z = cz + s * (need + (Math.abs(dz) / (need + M)) * M);
    }
  }
  // the arms round the rod: an ellipse in rod frame
  const e = armExt(f);
  if (e > 0) {
    const { u, v } = rodFrame(X, Z);
    const A = ROD.L / 2 + 3.0 + r;
    const B = 3.4 + r;
    const q = Math.hypot(u / A, v / B);
    if (q < 1) {
      // the arms pass this u at a fraction of their run (right end first)
      const passAt = clamp01((ROD.L / 2 + 1.5 - u) / (ROD.L + 3.5));
      const k = sstep((e - passAt) / 0.25);
      const nq = q + (1 - q) * k;
      const sc = q > 1e-3 ? nq / q : 1;
      const [x2, z2] = fromRodFrame(u * sc, v * sc + (q <= 1e-3 ? B * k : 0));
      X = x2;
      Z = z2;
    }
  }
  return [X, Z];
};

// ---------------------------------------------------------------------------
// SWIMMERS: flagellated rods and commas in the fluid above the ground, each at constant speed along its heading
// ---------------------------------------------------------------------------
export type Swimmer = { id: number; kind: "flagrod" | "vibrio"; x0: number; z0: number; y: number; ang: number; v: number; size: number; seed: number; n: number };
const buildSwimmers = () => {
  const rng = makeRng(777);
  const out: Swimmer[] = [];
  let id = 0;
  for (let i = 0; i < 900 && out.length < 44; i++) {
    const s: Swimmer = {
      id: id++,
      kind: rng() < 0.6 ? "flagrod" : "vibrio",
      x0: -26 + rng() * 52,
      z0: -8 + rng() * 60,
      y: 1.0 + rng() * 3.6,
      ang: rng() * Math.PI * 2,
      v: 0.028 + rng() * 0.03,
      size: 0.9 + 0.25 * rng(),
      seed: rng() * 1000,
      n: 4 + Math.floor(rng() * 3),
    };
    let ok = true;
    for (let f = 0; f <= DURATION && ok; f += 3) {
      const [X, Z] = swimPos(s, f);
      const c = camAt(f);
      if (Math.hypot(X - c.x, Z - c.z, s.y - c.h) < 10 || Z - c.z < 9) ok = false;
      // the cell and rod zone stays clear once the cell is near
      if (f > 120 && Math.abs(X - 3) < 12 && Math.abs(Z) < 9) ok = false;
      // never over the rod in the close-up
      if (f > 30 && f < 120 && Math.abs(X) < 3.5 && Math.abs(Z) < 3) ok = false;
    }
    if (ok) out.push(s);
  }
  return out;
};
export const swimPos = (s: Swimmer, f: number): [number, number] => [s.x0 + Math.cos(s.ang) * s.v * f, s.z0 + Math.sin(s.ang) * s.v * f];
export const SWIMMERS: Swimmer[] = buildSwimmers();

// granules inside the macrophage (local offsets from its centre; heights), nowhere near where the rod comes to lie
const buildGranules = () => {
  const rng = makeRng(4242);
  const out: { dx: number; dz: number; y: number; r: number; vac: boolean }[] = [];
  for (let i = 0; i < 900 && out.length < 64; i++) {
    const a = rng() * Math.PI * 2;
    const d = Math.sqrt(rng()) * 4.6;
    const dx = Math.cos(a) * d;
    const dz = Math.sin(a) * d * 0.85;
    // the rod comes to lie at local (-2.35..., -0.3): keep that room clear; the nucleus sits at (+1.3, +0.9)
    if (Math.hypot((dx + 4.1) / 2.9, (dz + 0.3) / 1.6) < 1) continue;
    if (Math.hypot((dx + 0.6) / 2.6, (dz - 1.3) / 2.6) < 1) continue;
    out.push({ dx, dz, y: 0.6 + rng() * 1.8, r: 0.05 + rng() * 0.07, vac: rng() < 0.15 });
  }
  return out;
};
export const GRANULES = buildGranules();

/** the macrophage's own pseudopods reaching along the ground (besides the two arms round the rod): ground
 *  polylines from inside the body edge out, slowly waving; [X, Z, radius] */
const PODS = [
  { a: 0.95, L: 4.6, ph: 0.0 },
  { a: -0.62, L: 3.4, ph: 1.9 },
  { a: 2.2, L: 3.2, ph: 3.7 },
];
export const pseudopods = (f: number): [number, number, number][][] => {
  const [cx, cz] = cellCentre(f);
  const g = f / FPS;
  return PODS.map((p) => {
    const pts: [number, number, number][] = [];
    const L = p.L + 0.5 * Math.sin(g * 0.9 + p.ph);
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const r = 4.6 + L * t;
      const a = p.a + 0.16 * t * Math.sin(g * 1.3 + p.ph + t * 2.5);
      pts.push([cx + Math.cos(a) * r, cz + (Math.sin(a) * r) / 1.16, 0.42 * (1 - 0.65 * t)]);
    }
    return pts;
  });
};
