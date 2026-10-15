// FactionsUnite: the crowds, the band and their choreography. Pure maths, no
// React, so check scripts read exactly what the component draws. See the header
// of FactionsUnite.tsx for the cut, the beats and the sources.
//
// WORLD: the kit's ASIA world (pearlAsiaMapData, world px; (112 E, 30 N) =
// (540, 960); k 1 = all of China in 1080 px). Imported read-only.
import { FREE_CHINA_POLY, FRONT_1938_PTS, project } from "./pearlAsiaMapData";

export type P2 = [number, number];

// 167 spoken frames (00:00:58:14 - 00:01:05:13 at 24 fps) + 12 frames of tail.
export const FPS = 24;
export const SPOKEN = 167;
export const DURATION = SPOKEN + 12;
export const LAST = DURATION - 1;

// ---------------------------------------------------------------------------
// THE CAMERA (kit runCamera: keys -> pchip -> damped follow, trails ~5 f)
//   f0     wide on free China: the seven armies left of centre (y ~280-1040),
//          the occupied east orange at the right, the coast, Canton and Hainan
//          below; k 2.75
//   f0-88  a slow push in and drift (k 2.75 -> 2.86) while they bicker and
//          draw apart
//   f88-150 one gentle move with the streams (pan ~56 world px east, k ->
//          2.56), so the streams are the one dominant motion
//   f150-  the whole band framed with margin (y ~270-1060, x ~275-880),
//          CHINA left of it, JAPAN in the orange; creeping on
// ---------------------------------------------------------------------------
export const CAM_KEYS: { f: number; x: number; y: number; k: number }[] = [
  { f: -30, x: 516, y: 1017, k: 2.68 },
  { f: 0, x: 520, y: 1016, k: 2.75 },
  { f: 45, x: 523, y: 1014, k: 2.81 },
  { f: 88, x: 527, y: 1011, k: 2.86 },
  { f: 150, x: 578, y: 977, k: 2.56 },
  { f: 200, x: 581, y: 975, k: 2.52 },
];
/** where the two labels sit (world px) and when they start (8 frames before the word).
 *  CHINA: the open middle of free China, between the armies (the march paths
 *  bend round it); it stays in the final framing, well inside (screen ~(186,
 *  797), ~65 px from the edge). JAPAN: the occupied north. */
export const CHINA_AT: [number, number] = [440, 912];
export const JAPAN_AT: [number, number] = [590, 790];
export const CHINA_IN = 57 - 8;
/** the CHINA label's box (world px, at the march's zoom ~k 2.9: ~250 x 38 screen px) plus a margin: no march path crosses it */
const LABEL_KEEP_OUT: [number, number, number, number] = [CHINA_AT[0] - 48, CHINA_AT[1] - 19, CHINA_AT[0] + 48, CHINA_AT[1] + 6];
const LABEL_MARGIN = 6; // world px the march paths keep from the label's box
/** signed distance to the label's box (world px, + outside) and the outward normal */
const labelSdf = (x: number, y: number): [number, number, number] => {
  const [x0, y0, x1, y1] = LABEL_KEEP_OUT;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const hx = (x1 - x0) / 2;
  const hy = (y1 - y0) / 2;
  const qx = Math.abs(x - cx) - hx;
  const qy = Math.abs(y - cy) - hy;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const out = Math.hypot(ox, oy);
  if (out > 0) return [out, (Math.sign(x - cx) * ox) / out, (Math.sign(y - cy) * oy) / out];
  // inside: leave by the nearer side
  return qx > qy ? [qx, Math.sign(x - cx) || 1, 0] : [qy, 0, Math.sign(y - cy) || 1];
};
export const JAPAN_IN = 118 - 8;

// ---------------------------------------------------------------------------
// small maths
// ---------------------------------------------------------------------------
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const smoother = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export const hash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const polyArea = (p: P2[]) => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i];
    const [x1, y1] = p[(i + 1) % p.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a / 2);
};
const inPoly = (x: number, y: number, p: P2[]) => {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/** keep the part of a convex polygon where n.p <= c */
const clipHalf = (poly: P2[], nx: number, ny: number, c: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = nx * a[0] + ny * a[1] - c;
    const db = nx * b[0] + ny * b[1] - c;
    if (da <= 0) out.push(a);
    if (da < 0 !== db < 0 && da !== db) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
};
/** an even-odd scanline raster of rings at `res` world px per cell: a fast inside test */
const rasterMask = (rings: P2[][], box: [number, number, number, number], res: number) => {
  const [x0, y0, x1, y1] = box;
  const W = Math.ceil((x1 - x0) / res);
  const H = Math.ceil((y1 - y0) / res);
  const bits = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) {
    const y = y0 + (r + 0.5) * res;
    const xs: number[] = [];
    for (const p of rings)
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const [xi, yi] = p[i];
        const [xj, yj] = p[j];
        if (yi > y !== yj > y) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
      }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const c0 = Math.max(0, Math.ceil((xs[k] - x0) / res - 0.5));
      const c1 = Math.min(W - 1, Math.floor((xs[k + 1] - x0) / res - 0.5));
      for (let c = c0; c <= c1; c++) bits[r * W + c] = 1;
    }
  }
  return (x: number, y: number) => {
    const c = Math.floor((x - x0) / res);
    const r = Math.floor((y - y0) / res);
    if (c < 0 || r < 0 || c >= W || r >= H) return false;
    return bits[r * W + c] === 1;
  };
};
/** free China (land), world px */
export const inFree = rasterMask(
  FREE_CHINA_POLY.flatMap((poly) => poly as P2[][]),
  [300, 640, 760, 1200],
  0.25,
);

type LineGeo = { pts: P2[]; cum: number[]; L: number };
const lineGeo = (pts: P2[]): LineGeo => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, L: cum[cum.length - 1] };
};
const resampleLine = (pts: P2[], h: number): P2[] => {
  const g = lineGeo(pts);
  const n = Math.max(2, Math.round(g.L / h) + 1);
  const out: P2[] = [];
  let k = 1;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * g.L;
    while (k < g.cum.length - 1 && g.cum[k] < s) k++;
    const u = (s - g.cum[k - 1]) / (g.cum[k] - g.cum[k - 1] || 1);
    out.push([pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * u, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * u]);
  }
  return out;
};
/** nearest point on the line: arc position, signed depth (+ = on the RIGHT of
 *  travel = the free side, since the front runs N -> S with the occupied EAST
 *  of it) and the unit normal toward the free side */
const nearestOnLine = (g: LineGeo, x: number, y: number) => {
  let best = Infinity;
  let bs = 0;
  let bnx = 0;
  let bny = 0;
  let bqx = 0;
  let bqy = 0;
  for (let i = 1; i < g.pts.length; i++) {
    const [ax, ay] = g.pts[i - 1];
    const [cx, cy] = g.pts[i];
    const dx = cx - ax;
    const dy = cy - ay;
    const l2 = dx * dx + dy * dy || 1e-9;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1);
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    const d = (x - qx) * (x - qx) + (y - qy) * (y - qy);
    if (d < best) {
      best = d;
      const l = Math.sqrt(l2);
      bs = g.cum[i - 1] + t * l;
      bnx = -dy / l;
      bny = dx / l;
      bqx = qx;
      bqy = qy;
    }
  }
  const dist = Math.sqrt(best);
  const side = (x - bqx) * bnx + (y - bqy) * bny;
  return { s: bs, depth: side >= 0 ? dist : -dist, nx: bnx, ny: bny, qx: bqx, qy: bqy };
};
const pointOnLine = (g: LineGeo, s: number) => {
  const c = clamp(s, 0, g.L);
  let lo = 0;
  let hi = g.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (g.cum[m] <= c) lo = m;
    else hi = m;
  }
  const u = (c - g.cum[lo]) / (g.cum[hi] - g.cum[lo] || 1);
  const [ax, ay] = g.pts[lo];
  const [bx, by] = g.pts[hi];
  const l = Math.hypot(bx - ax, by - ay) || 1;
  return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u, tx: (bx - ax) / l, ty: (by - ay) / l, nx: -(by - ay) / l, ny: (bx - ax) / l };
};
/** pairwise spacing: push pairs closer than s apart (uniform grid) */
const separate = (xs: Float64Array, ys: Float64Array, s: number, w: number) => {
  const map = new Map<number, number[]>();
  const key = (cx: number, cy: number) => cx * 73856093 + cy * 19349663;
  for (let i = 0; i < xs.length; i++) {
    const k = key(Math.floor(xs[i] / s), Math.floor(ys[i] / s));
    const a = map.get(k);
    if (a) a.push(i);
    else map.set(k, [i]);
  }
  for (let i = 0; i < xs.length; i++) {
    const cx = Math.floor(xs[i] / s);
    const cy = Math.floor(ys[i] / s);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++) {
        const l = map.get(key(cx + a, cy + b));
        if (!l) continue;
        for (const j of l) {
          if (j <= i) continue;
          const ex = xs[j] - xs[i];
          const ey = ys[j] - ys[i];
          const d = Math.hypot(ex, ey);
          if (d >= s) continue;
          const ux = d > 1e-6 ? ex / d : Math.cos(i * 2.4);
          const uy = d > 1e-6 ? ey / d : Math.sin(i * 2.4);
          const m = (s - d) * w * 0.5;
          xs[i] -= ux * m;
          ys[i] -= uy * m;
          xs[j] += ux * m;
          ys[j] += uy * m;
        }
      }
  }
};
type Path = { xs: Float64Array; ys: Float64Array; cum: Float64Array; L: number };
const pathAt = (p: Path, s: number): P2 => {
  const c = clamp(s, 0, p.L);
  let lo = 0;
  let hi = p.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p.cum[m] <= c) lo = m;
    else hi = m;
  }
  const u = (c - p.cum[lo]) / (p.cum[hi] - p.cum[lo] || 1);
  return [p.xs[lo] + (p.xs[hi] - p.xs[lo]) * u, p.ys[lo] + (p.ys[hi] - p.ys[lo]) * u];
};

// ---------------------------------------------------------------------------
// THE SIZES
//   S      centre spacing of the dots (world px): 12 px on screen at the end
//          framing (k ~2.9), ~18 px at the opening (k ~4.3)
//   DOT_R  dot radius: the spacing is 1.3 dot diameters (the approved band)
//   ROWS   rows of the band; GAP world px between the front line and the band
// ---------------------------------------------------------------------------
export const S = 6;
export const DOT_R = S / 1.3 / 2;
export const ROWS = 5;
export const GAP = 1.5 * S;
const BAND_D = (ROWS - 1) * 0.866 * S + 0.25 * S;

// ---------------------------------------------------------------------------
// THE CROWDS, in the order their stretch of the band runs along the front
// (north -> south -> east). share = fraction of all the dots (no claim on
// strengths; only the Nationalists are clearly the biggest). seat = where the
// army stands at the opening (lon, lat), on or near its 1936-37 seat but in
// FREE China as of 1938-39 (the Nationalists' Nanjing-Wuhan seat and Shanxi's
// Taiyuan were occupied by then: the Nationalists stand west of Wuhan, Yan
// Xishan's Shanxi army just west of the Yellow River). pressTo = the crowd it
// is pressed against (a contested pair; it is moved along the line between
// the two seats until the two press on a short contact line). head = a turn
// (rad, + = clockwise) of the march heading off the straight line to its
// stretch, so streams do not cut through each other. t0 = the frame the crowd
// starts to move off; arrive = the frame its last dot is in its slot.
// ---------------------------------------------------------------------------
export type FactionId = "ma" | "communists" | "shanxi" | "sichuan" | "nationalists" | "guangxi" | "yunnan";
export type Mark = "diamond" | "square" | "plus" | "triangle" | "ring" | "times" | "dash";
type CrowdDef = { id: FactionId; mark: Mark; share: number; seat: [number, number]; pressTo?: FactionId; head: number; t0: number; arrive: number; alpha: number; beta: number };
const CROWDS: CrowdDef[] = [
  // the Ma clique, on its own in the north-west (Gansu, toward Lanzhou)
  { id: "ma", mark: "diamond", share: 0.1, seat: [104.0, 35.9], head: -0.35, t0: 88, arrive: 145, alpha: 0.38, beta: 0.28 },
  // Yan Xishan's Shanxi army, pressed against the Communists from the north
  { id: "shanxi", mark: "square", share: 0.11, seat: [108.7, 38.2], pressTo: "communists", head: 0, t0: 92, arrive: 144, alpha: 0.38, beta: 0.28 },
  // the Communists round Yan'an (a touch west, off the river front)
  { id: "communists", mark: "plus", share: 0.09, seat: [108.6, 36.3], head: 0, t0: 94, arrive: 146, alpha: 0.38, beta: 0.28 },
  // the Sichuan warlords (between Chengdu and Chongqing)
  { id: "sichuan", mark: "triangle", share: 0.15, seat: [106.0, 30.0], head: 0.4, t0: 90, arrive: 147, alpha: 0.38, beta: 0.28 },
  // the Nationalists, centre-east (west of Wuhan, round Yichang / Changde)
  { id: "nationalists", mark: "ring", share: 0.3, seat: [110.25, 30.0], head: -0.3, t0: 91, arrive: 148, alpha: 0.38, beta: 0.28 },
  // Long Yun's Yunnan army, pressed against Sichuan from the south-west
  { id: "yunnan", mark: "times", share: 0.11, seat: [102.7, 25.0], pressTo: "sichuan", head: 0, t0: 89, arrive: 148, alpha: 0.38, beta: 0.28 },
  // the Guangxi clique, pressed against the Nationalists from the south
  { id: "guangxi", mark: "dash", share: 0.14, seat: [109.0, 24.5], pressTo: "nationalists", head: 0.12, t0: 88, arrive: 148, alpha: 0.38, beta: 0.28 },
];
export const CROWD_IDS = CROWDS.map((c) => c.id);
/** each faction's own cream mark at the opening (all become the one filled dot in the band) */
export const CROWD_MARKS: Mark[] = CROWDS.map((c) => c.mark);
const NC = CROWDS.length;

// ---------------------------------------------------------------------------
// THE BAND: N slots between GAP and GAP + BAND_D behind the front, along the
// run of the front whose free side is land (the Mongolia border -> Hangzhou bay)
// ---------------------------------------------------------------------------
const FRONT = lineGeo(resampleLine(FRONT_1938_PTS as P2[], S * 0.5));
const bandRun = (() => {
  const ok = (s: number) => {
    const q = pointOnLine(FRONT, s);
    return inFree(q.x + q.nx * (GAP + 0.5 * BAND_D), q.y + q.ny * (GAP + 0.5 * BAND_D));
  };
  let a = 0;
  while (a < FRONT.L && !ok(a)) a += 0.5;
  let b = FRONT.L;
  while (b > a && !ok(b)) b -= 0.5;
  return { a, b };
})();
const BAND_L = bandRun.b - bandRun.a;
export const N = Math.round((BAND_L / S) * ROWS);

const BAND = (() => {
  const R = rng(17);
  const bx = new Float64Array(N);
  const by = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const q = pointOnLine(FRONT, bandRun.a + (0.5 + i + 0.6 * (R() - 0.5)) * (BAND_L / N));
    const dep = GAP + R() * BAND_D;
    bx[i] = q.x + q.nx * dep;
    by[i] = q.y + q.ny * dep;
  }
  const fix = (i: number) => {
    const q = nearestOnLine(FRONT, bx[i], by[i]);
    if (q.depth < GAP) {
      bx[i] += q.nx * (GAP - q.depth);
      by[i] += q.ny * (GAP - q.depth);
    } else if (q.depth > GAP + BAND_D) {
      const m = 0.6 * (q.depth - GAP - BAND_D);
      bx[i] -= q.nx * m;
      by[i] -= q.ny * m;
    }
    const lo = bandRun.a + 0.45 * S;
    const hi = bandRun.b - 0.45 * S;
    if (q.s < lo || q.s > hi) {
      const t = pointOnLine(FRONT, q.s);
      const m = (q.s < lo ? lo - q.s : hi - q.s) * 0.6;
      bx[i] += t.tx * m;
      by[i] += t.ty * m;
    }
    if (!inFree(bx[i], by[i])) {
      bx[i] += (q.qx + q.nx * (GAP + 0.5 * BAND_D) - bx[i]) * 0.3;
      by[i] += (q.qy + q.ny * (GAP + 0.5 * BAND_D) - by[i]) * 0.3;
    }
  };
  for (let it = 0; it < 240; it++) {
    separate(bx, by, S * 1.02, 0.7);
    for (let i = 0; i < N; i++) fix(i);
  }
  for (let it = 0; it < 30; it++) {
    for (let i = 0; i < N; i++) fix(i);
    separate(bx, by, S * 1.0, 0.8);
    separate(bx, by, S * 1.0, 0.8);
  }
  const sArc = new Float64Array(N);
  const depth = new Float64Array(N);
  const nx = new Float64Array(N);
  const ny = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const q = nearestOnLine(FRONT, bx[i], by[i]);
    sArc[i] = q.s;
    depth[i] = q.depth;
    nx[i] = q.nx;
    ny[i] = q.ny;
  }
  return { bx, by, sArc, depth, nx, ny };
})();

// counts per crowd (sum = N) and each crowd's consecutive stretch of slots
const COUNTS = (() => {
  const c = CROWDS.map((d) => Math.floor(d.share * N));
  let left = N - c.reduce((a, b) => a + b, 0);
  for (let i = 0; left > 0; i = (i + 1) % c.length, left--) c[i]++;
  return c;
})();
const SEG: number[][] = (() => {
  const order = Array.from({ length: N }, (_, i) => i).sort((a, b) => BAND.sArc[a] - BAND.sArc[b]);
  const out: number[][] = [];
  let k = 0;
  COUNTS.forEach((c) => {
    out.push(order.slice(k, k + c));
    k += c;
  });
  return out;
})();

// ---------------------------------------------------------------------------
// THE CROWDS AT THE OPENING: a wobbly disk per crowd (area for its dots with
// some slack) on its seat; each contested pair pressed on a short contact
// line (the disks overlap by OVER of the smaller radius; the power line
// between them, less a SEAM, clips both)
// ---------------------------------------------------------------------------
const SEAM = 0.9 * S;
const OVER = 0.45;
const CLUSTER = (() => {
  const rad = COUNTS.map((c) => Math.sqrt((c * 0.866 * S * S * 1.14) / Math.PI));
  const cx = new Float64Array(NC);
  const cy = new Float64Array(NC);
  const idx = (id: FactionId) => CROWDS.findIndex((c) => c.id === id);
  CROWDS.forEach((c, i) => {
    const [x, y] = project(c.seat[0], c.seat[1]);
    cx[i] = x;
    cy[i] = y;
  });
  CROWDS.forEach((c, i) => {
    if (!c.pressTo) return;
    const j = idx(c.pressTo);
    const ex = cx[i] - cx[j];
    const ey = cy[i] - cy[j];
    const d = Math.hypot(ex, ey);
    const want = rad[i] + rad[j] - OVER * Math.min(rad[i], rad[j]);
    cx[i] = cx[j] + (ex / d) * want;
    cy[i] = cy[j] + (ey / d) * want;
  });
  const pairs = CROWDS.flatMap((c, i) => (c.pressTo ? [[idx(c.pressTo), i] as [number, number]] : []));
  const cellOf = (i: number): P2[] => {
    const ph = 6.283 * hash(i, 3);
    let poly: P2[] = [];
    for (let a = 0; a < 72; a++) {
      const t = (a / 72) * Math.PI * 2;
      const r = rad[i] * (1 + 0.05 * Math.sin(2 * t + ph) + 0.035 * Math.sin(3 * t + 2.1 * ph));
      poly.push([cx[i] + r * Math.cos(t), cy[i] + r * Math.sin(t)]);
    }
    for (const [a, b] of pairs) {
      if (a !== i && b !== i) continue;
      const j = a === i ? b : a;
      const ex = cx[j] - cx[i];
      const ey = cy[j] - cy[i];
      const d = Math.hypot(ex, ey);
      const c0 = (cx[j] ** 2 + cy[j] ** 2 - cx[i] ** 2 - cy[i] ** 2 - rad[j] ** 2 + rad[i] ** 2) / (2 * d);
      poly = clipHalf(poly, ex / d, ey / d, c0 - SEAM / 2);
    }
    return poly;
  };
  const cells = Array.from({ length: NC }, (_, i) => cellOf(i));
  return { cx: [...cx], cy: [...cy], rad, cells, pairs };
})();
export const CROWD_CENTRES: P2[] = CLUSTER.cx.map((x, i) => [x, CLUSTER.cy[i]]);
export const CROWD_RADII = CLUSTER.rad;

// home dots: blue noise inside each cell (relaxed together, each kept in its own cell)
const CROWD_OF = new Int32Array(N);
const HOME = (() => {
  const hx = new Float64Array(N);
  const hy = new Float64Array(N);
  let k = 0;
  COUNTS.forEach((c, i) => {
    const cell = CLUSTER.cells[i];
    const R = rng(101 + i * 7);
    let minx = Infinity;
    let maxx = -Infinity;
    let miny = Infinity;
    let maxy = -Infinity;
    cell.forEach(([x, y]) => {
      minx = Math.min(minx, x);
      maxx = Math.max(maxx, x);
      miny = Math.min(miny, y);
      maxy = Math.max(maxy, y);
    });
    for (let n = 0; n < c; n++) {
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 400; tries++) {
        x = minx + R() * (maxx - minx);
        y = miny + R() * (maxy - miny);
        if (inPoly(x, y, cell)) break;
      }
      CROWD_OF[k] = i;
      hx[k] = x;
      hy[k] = y;
      k++;
    }
  });
  const si = COUNTS.map((c, i) => Math.sqrt(polyArea(CLUSTER.cells[i]) / (c * 0.866)));
  const sMin = Math.max(S, Math.min(...si) * 0.95);
  for (let it = 0; it < 200; it++) {
    separate(hx, hy, sMin, 0.7);
    for (let q = 0; q < N; q++) {
      const i = CROWD_OF[q];
      if (!inPoly(hx[q], hy[q], CLUSTER.cells[i])) {
        hx[q] += (CLUSTER.cx[i] - hx[q]) * 0.06;
        hy[q] += (CLUSTER.cy[i] - hy[q]) * 0.06;
      }
    }
  }
  return { hx, hy };
})();
export const crowdOf = (k: number) => CROWD_OF[k];

// ---------------------------------------------------------------------------
// BICKERING: along each contested pair's contact line the two crowds shove:
// the contact line swings one way and back (one side's edge pushes in a few
// rows deep while the other gives way, then the other side pushes back, every
// PERIOD frames, strongest in the middle of the line), with smaller local
// shoves on top. Smooth (no flashes). The envelope dies between
// JOSTLE_END[0] and [1] ("stopped fighting").
// ---------------------------------------------------------------------------
export const JOSTLE_END: [number, number] = [60, 74];
const SWING = 3.1 * S;
type Shove = { tau: number; w: number; amp: number; f: number; rise: number; fall: number };
type Contact = { i: number; j: number; nx: number; ny: number; c0: number; tx: number; ty: number; t0: number; t1: number; shoves: Shove[]; ph: number; period: number };
const CONTACTS: Contact[] = (() => {
  const out: Contact[] = [];
  const { cx, cy, rad } = CLUSTER;
  CLUSTER.pairs.forEach(([i, j], n) => {
    const ex = cx[j] - cx[i];
    const ey = cy[j] - cy[i];
    const d = Math.hypot(ex, ey);
    const nx = ex / d;
    const ny = ey / d;
    const c0 = (cx[j] ** 2 + cy[j] ** 2 - cx[i] ** 2 - cy[i] ** 2 - rad[j] ** 2 + rad[i] ** 2) / (2 * d);
    const tx = -ny;
    const ty = nx;
    const hi = c0 - (cx[i] * nx + cy[i] * ny);
    const hj = c0 - (cx[j] * nx + cy[j] * ny);
    const qi = cx[i] * tx + cy[i] * ty;
    const qj = cx[j] * tx + cy[j] * ty;
    const ci = Math.sqrt(Math.max(0, rad[i] ** 2 - hi ** 2));
    const cj = Math.sqrt(Math.max(0, rad[j] ** 2 - hj ** 2));
    const t0 = Math.max(qi - ci, qj - cj);
    const t1 = Math.min(qi + ci, qj + cj);
    const R = rng(500 + i * 31 + j * 7);
    const shoves: Shove[] = [];
    let f = -40 + R() * 8;
    let sign = R() < 0.5 ? 1 : -1;
    while (f < JOSTLE_END[1]) {
      shoves.push({ tau: t0 + (0.15 + 0.7 * R()) * (t1 - t0), w: (1.3 + 1.0 * R()) * S, amp: sign * (0.5 + 0.3 * R()) * S, f, rise: 4 + 2 * R(), fall: 7 + 4 * R() });
      if (R() < 0.75) sign = -sign;
      f += 7 + 6 * R();
    }
    out.push({ i, j, nx, ny, c0, tx, ty, t0, t1, shoves, ph: 6.283 * R(), period: [46, 50, 42][n % 3] });
  });
  return out;
})();
export const CONTACT_COUNT = CONTACTS.length;
const pulse = (sh: Shove, f: number) => {
  const x = f - sh.f;
  if (x <= 0) return 0;
  if (x < sh.rise) return smoother(x / sh.rise);
  if (x < sh.rise + 2) return 1;
  return 1 - smoother((x - sh.rise - 2) / sh.fall);
};
const jostleEnv = (f: number) => 1 - smoother((f - JOSTLE_END[0]) / (JOSTLE_END[1] - JOSTLE_END[0]));
const jostle = (k: number, x: number, y: number, f: number): P2 => {
  const e = jostleEnv(f);
  if (e <= 0) return [0, 0];
  const ci = CROWD_OF[k];
  let dx = 0;
  let dy = 0;
  for (const c of CONTACTS) {
    if (c.i !== ci && c.j !== ci) continue;
    const dn = x * c.nx + y * c.ny - c.c0; // + = on j's side of the contact
    const own = c.i === ci ? -dn : dn; // depth into its own crowd
    if (own > 7 * S) continue;
    const tau = x * c.tx + y * c.ty;
    const inside = Math.min(tau - c.t0, c.t1 - tau);
    if (inside < -1.5 * S) continue;
    const edgeW = clamp((inside + 1.5 * S) / (2.5 * S), 0, 1);
    const mid = 0.5 * (c.t0 + c.t1);
    const half = 0.5 * (c.t1 - c.t0);
    let P = SWING * Math.sin((6.283 * f) / c.period + c.ph) * Math.exp(-(((tau - mid) / (0.75 * half)) ** 2));
    for (const sh of c.shoves) {
      const p = pulse(sh, f);
      if (p <= 0) continue;
      P += sh.amp * p * Math.exp(-(((tau - sh.tau) / sh.w) ** 2));
    }
    const pushing = (c.i === ci) === P > 0;
    const reach = pushing ? 3.0 * S : 2.2 * S;
    // the pusher surges in further than the other side gives way: its front rows go in among the other's
    const w = Math.exp(-((Math.max(0, own) / reach) ** 2)) * edgeW * (pushing ? 1 : 0.3);
    dx += c.nx * P * w * e;
    dy += c.ny * P * w * e;
  }
  return [dx, dy];
};

// ---------------------------------------------------------------------------
// DRAWING APART ("stopped fighting each other"): between APART[0] and [1]
// the two crowds of each contested pair let go and step back from each other
// (APART_GAP opens on the contact line) and every crowd gathers in a little,
// all before any crowd turns toward the front
// ---------------------------------------------------------------------------
export const APART: [number, number] = [60, 86];
const KAPPA = 0.03;
const APART_GAP = 3.6 * S;

// THE MARCH HEADING of each crowd: to the middle of its stretch, turned by head
const HEAD = (() => {
  const ux = new Float64Array(NC);
  const uy = new Float64Array(NC);
  for (let i = 0; i < NC; i++) {
    let mx = 0;
    let my = 0;
    SEG[i].forEach((q) => {
      mx += BAND.bx[q];
      my += BAND.by[q];
    });
    mx /= SEG[i].length;
    my /= SEG[i].length;
    const hx = mx - CLUSTER.cx[i];
    const hy = my - CLUSTER.cy[i];
    const ca = Math.cos(CROWDS[i].head);
    const sa = Math.sin(CROWDS[i].head);
    const rx = hx * ca - hy * sa;
    const ry = hx * sa + hy * ca;
    const l = Math.hypot(rx, ry);
    ux[i] = rx / l;
    uy[i] = ry / l;
  }
  return { ux, uy };
})();
const STEP = (() => {
  const sx = new Float64Array(NC);
  const sy = new Float64Array(NC);
  for (const c of CONTACTS) {
    const wi = CLUSTER.rad[c.j] / (CLUSTER.rad[c.i] + CLUSTER.rad[c.j]);
    sx[c.i] -= c.nx * APART_GAP * wi;
    sy[c.i] -= c.ny * APART_GAP * wi;
    sx[c.j] += c.nx * APART_GAP * (1 - wi);
    sy[c.j] += c.ny * APART_GAP * (1 - wi);
  }
  return { sx, sy };
})();
const apartAt = (f: number) => smoother((f - APART[0]) / (APART[1] - APART[0]));
const homeAt = (k: number, f: number): P2 => {
  const i = CROWD_OF[k];
  const a = apartAt(f);
  const kap = 1 - KAPPA * a;
  return [CLUSTER.cx[i] + STEP.sx[i] * a + kap * (HOME.hx[k] - CLUSTER.cx[i]), CLUSTER.cy[i] + STEP.sy[i] * a + kap * (HOME.hy[k] - CLUSTER.cy[i])];
};

// ---------------------------------------------------------------------------
// ASSIGNMENT, in the stretch's own axes: T (along the front, from its first
// slot to its last) and its free-side normal. The crowd's dots, sorted along
// T, are cut into columns of ROWS; the stretch's slots, sorted by arc
// position, likewise; column c of the crowd takes column c of the band, its
// dot nearest the line (least along the normal) the front row. Order is kept
// on both axes whatever the march heading, so the stream never twists and
// nobody crosses anybody.
// ---------------------------------------------------------------------------
const SLOT_OF = (() => {
  const slotOf = new Int32Array(N);
  let start = 0;
  for (let i = 0; i < NC; i++) {
    const dots: number[] = [];
    for (let k = start; k < start + COUNTS[i]; k++) dots.push(k);
    start += COUNTS[i];
    const seg = [...SEG[i]].sort((p, q) => BAND.sArc[p] - BAND.sArc[q]);
    const first = seg[0];
    const last = seg[seg.length - 1];
    let tx = BAND.bx[last] - BAND.bx[first];
    let ty = BAND.by[last] - BAND.by[first];
    const tl = Math.hypot(tx, ty);
    tx /= tl;
    ty /= tl;
    const nx = -ty;
    const ny = tx;
    const alongT = (k: number) => HOME.hx[k] * tx + HOME.hy[k] * ty;
    const alongN = (k: number) => HOME.hx[k] * nx + HOME.hy[k] * ny;
    const byT = [...dots].sort((p, q) => alongT(p) - alongT(q));
    const cols = Math.ceil(seg.length / ROWS);
    for (let c = 0; c < cols; c++) {
      const a0 = Math.round((c * seg.length) / cols);
      const a1 = Math.round(((c + 1) * seg.length) / cols);
      const sl = seg.slice(a0, a1).sort((p, q) => BAND.depth[p] - BAND.depth[q]);
      const dl = byT.slice(a0, a1).sort((p, q) => alongN(p) - alongN(q));
      dl.forEach((d, n) => (slotOf[d] = sl[n]));
    }
  }
  return slotOf;
})();

// ---------------------------------------------------------------------------
// THE MARCH. Each dot's path: a straight lead along the crowd's heading to the
// crowd's front edge (the crowd shuffles forward as a body), then a cubic to
// its slot, arriving square to the front from behind; any part of it that
// would come nearer the line than the band's gap is pushed back behind it.
// Speed: from t0 the whole crowd moves off together at RHO x the march speed
// v (eased in over RAMP frames); each dot speeds up to v as it clears the
// crowd's front edge (so the crowd draws out into a stream that keeps its
// spacing), then marches at constant v and decelerates evenly into its slot.
// v is solved per crowd so its last dot is home on `arrive`.
// ---------------------------------------------------------------------------
const RHO = 0.5;
const RAMP = 9;
const STOP = 2.2 * S;
const COLUMN = 0; // the stream narrows by this much of each dot's lateral offset (none: spacing is kept)
const HOOK = 4 * S; // the longest straight-in approach to a slot
const MARCH = (() => {
  const homeEnd = (k: number) => homeAt(k, 1e6);
  const lead = new Float64Array(N);
  const paths: Path[] = new Array(N);
  const aMax = new Float64Array(NC).fill(-Infinity);
  const along = (k: number) => {
    const i = CROWD_OF[k];
    const [x, y] = homeEnd(k);
    return (x - CLUSTER.cx[i] - STEP.sx[i]) * HEAD.ux[i] + (y - CLUSTER.cy[i] - STEP.sy[i]) * HEAD.uy[i];
  };
  for (let k = 0; k < N; k++) aMax[CROWD_OF[k]] = Math.max(aMax[CROWD_OF[k]], along(k));
  for (let k = 0; k < N; k++) {
    const i = CROWD_OF[k];
    const ux = HEAD.ux[i];
    const uy = HEAD.uy[i];
    const [hx, hy] = homeEnd(k);
    const lat = (hx - CLUSTER.cx[i] - STEP.sx[i]) * -uy + (hy - CLUSTER.cy[i] - STEP.sy[i]) * ux;
    lead[k] = aMax[i] - along(k);
    let g: P2 = [hx + ux * lead[k], hy + uy * lead[k]];
    {
      // the crowd's front edge may run past the line for a crowd standing near it: pull the gate back behind it
      const nr = nearestOnLine(FRONT, g[0], g[1]);
      const wantG = GAP * 0.9;
      if (nr.depth < wantG) {
        // shorten the lead along its own ray to the last point still behind the line
        let lo = 0;
        let hi = lead[k];
        for (let it = 0; it < 18; it++) {
          const mid = (lo + hi) / 2;
          if (nearestOnLine(FRONT, hx + ux * mid, hy + uy * mid).depth >= wantG) lo = mid;
          else hi = mid;
        }
        lead[k] = lo;
        g = [hx + ux * lo, hy + uy * lo];
      }
    }
    const q = SLOT_OF[k];
    const q3: P2 = [BAND.bx[q], BAND.by[q]];
    const L = Math.hypot(q3[0] - g[0], q3[1] - g[1]);
    const n = 44;
    const want = GAP * 0.9;
    // the first (alpha, beta) whose curve never comes nearer the line than the band's gap
    const curve = (al: number, be: number) => {
      const p1: P2 = [g[0] + ux * al * L + uy * lat * COLUMN, g[1] + uy * al * L - ux * lat * COLUMN];
      const p2: P2 = [q3[0] + BAND.nx[q] * Math.min(be * L, HOOK), q3[1] + BAND.ny[q] * Math.min(be * L, HOOK)];
      const pts: P2[] = [];
      let worst = Infinity;
      for (let m = 0; m <= n; m++) {
        const t = m / n;
        const a = (1 - t) ** 3;
        const b = 3 * (1 - t) ** 2 * t;
        const c = 3 * (1 - t) * t * t;
        const d = t ** 3;
        const x = a * g[0] + b * p1[0] + c * p2[0] + d * q3[0];
        const y = a * g[1] + b * p1[1] + c * p2[1] + d * q3[1];
        pts.push([x, y]);
        if (m > 0 && m < n) worst = Math.min(worst, nearestOnLine(FRONT, x, y).depth - want);
      }
      return { pts, worst };
    };
    const al0 = CROWDS[i].alpha;
    const be0 = CROWDS[i].beta;
    let best = curve(al0, be0);
    for (const f of [0.75, 0.5, 0.3, 0.15, 0]) {
      if (best.worst >= 0) break;
      const c2 = curve(al0 * f, Math.max(be0, 0.4 * (1 - f) + be0 * f));
      if (c2.worst > best.worst) best = c2;
    }
    // the lead (crowd shuffling forward to its front edge) as LEAD_N samples, then the curve
    const LEAD_N = 8;
    const pts: P2[] = [];
    for (let m = 0; m < LEAD_N; m++) pts.push([hx + ((g[0] - hx) * m) / LEAD_N, hy + ((g[1] - hy) * m) / LEAD_N]);
    best.pts.forEach(([x0, y0], m) => {
      let x = x0;
      let y = y0;
      if (best.worst < 0 && m > 0 && m < n) {
        const nr = nearestOnLine(FRONT, x, y);
        if (nr.depth < want) {
          x += nr.nx * (want - nr.depth);
          y += nr.ny * (want - nr.depth);
        }
      }
      pts.push([x, y]);
    });
    // bend round the CHINA label: a path that would cross its box goes round
    // the end its straight route is nearer to (one side for the whole path),
    // then the kinks are relaxed out (endpoints fixed)
    const [lx0, ly0, lx1, ly1] = LABEL_KEEP_OUT;
    const M = LABEL_MARGIN;
    let side = 0;
    for (let m = 1; m < pts.length; m++) {
      const [ax, ay] = pts[m - 1];
      const [bx, by] = pts[m];
      const ymid = (ly0 + ly1) / 2;
      if ((ay - ymid) * (by - ymid) <= 0 && ay !== by) {
        const xc = ax + ((bx - ax) * (ymid - ay)) / (by - ay);
        if (xc > lx0 - M && xc < lx1 + M) side = xc > (lx0 + lx1) / 2 ? 1 : -1;
        break;
      }
    }
    const deflect = () => {
      if (!side) return;
      for (let m = 1; m < pts.length - 1; m++) {
        const [x, y] = pts[m];
        if (y < ly0 - M || y > ly1 + M || x < lx0 - M || x > lx1 + M) continue;
        pts[m][0] = side > 0 ? lx1 + M : lx0 - M;
      }
    };
    for (let it = 0; it < 8; it++) {
      deflect();
      for (let m = 1; m < pts.length - 1; m++) {
        pts[m][0] += 0.25 * (pts[m - 1][0] + pts[m + 1][0] - 2 * pts[m][0]);
        pts[m][1] += 0.25 * (pts[m - 1][1] + pts[m + 1][1] - 2 * pts[m][1]);
      }
    }
    deflect();
    const xs = new Float64Array(pts.length);
    const ys = new Float64Array(pts.length);
    const cum = new Float64Array(pts.length);
    pts.forEach(([x, y], m) => {
      xs[m] = x;
      ys[m] = y;
    });
    for (let m = 1; m < pts.length; m++) cum[m] = cum[m - 1] + Math.hypot(xs[m] - xs[m - 1], ys[m] - ys[m - 1]);
    lead[k] = cum[LEAD_N];
    paths[k] = { xs, ys, cum, L: cum[pts.length - 1] };
  }
  const SUB = 4;
  const run = (k: number, v: number, T0: number, F1: number) => {
    const out = new Float64Array(F1 - T0 + 1);
    const L = paths[k].L;
    const gate = lead[k];
    let sig = 0;
    for (let f = T0; f <= F1; f++) {
      out[f - T0] = sig;
      for (let u = 0; u < SUB; u++) {
        const t = f - T0 + u / SUB;
        const st = smoother(t / RAMP);
        const mix = smoother((sig - gate + 1.5 * S) / (3 * S));
        const vq = RHO * v + (1 - RHO) * v * mix;
        const rem = L - sig;
        const dec = Math.min(1, Math.sqrt(Math.max(0, rem) / STOP));
        sig = Math.min(L, sig + (st * vq * dec + (rem > 0 ? 0.002 * S : 0)) / SUB);
      }
    }
    return out;
  };
  const vOf = new Float64Array(NC);
  const sig: Float64Array[] = new Array(N);
  let start = 0;
  for (let i = 0; i < NC; i++) {
    const ks: number[] = [];
    for (let k = start; k < start + COUNTS[i]; k++) ks.push(k);
    start += COUNTS[i];
    const { t0, arrive } = CROWDS[i];
    let lo = 0.1;
    let hi = 40;
    for (let it = 0; it < 22; it++) {
      const v = (lo + hi) / 2;
      const ok = ks.every((k) => {
        const m = run(k, v, t0, arrive);
        return paths[k].L - m[m.length - 1] < 0.02 * S;
      });
      if (ok) hi = v;
      else lo = v;
    }
    vOf[i] = hi;
    ks.forEach((k) => (sig[k] = run(k, hi, t0, LAST + 8)));
  }
  return { paths, sig, vOf };
})();
export const MARCH_SPEED = MARCH.vOf;

// ---------------------------------------------------------------------------
// GOAL of dot k on frame f (before the spacing pass)
// ---------------------------------------------------------------------------
const goalAt = (k: number, f: number): P2 => {
  const i = CROWD_OF[k];
  const t0 = CROWDS[i].t0;
  const [hx, hy] = homeAt(k, f);
  if (f >= t0) {
    const sg = MARCH.sig[k][Math.min(MARCH.sig[k].length - 1, f - t0)];
    const [px, py] = pathAt(MARCH.paths[k], sg);
    // the drawing-apart may still be settling as the crowd moves off: carry its residue, faded out over the first steps
    const [ex, ey] = homeAt(k, 1e6);
    const w = 1 - smoother(sg / (2 * S));
    return [px + (hx - ex) * w, py + (hy - ey) * w];
  }
  const [jx, jy] = jostle(k, hx, hy, f);
  return [hx + jx, hy + jy];
};

// ---------------------------------------------------------------------------
// THE SIM: each frame every dot is carried with its goal, the leftover error
// decays (x 0.72 per frame) and a spacing pass keeps every pair >= 0.9 S
// apart (two passes); then a light gaussian in time (sigma 1 f). Deterministic.
// ---------------------------------------------------------------------------
const SIM_F0 = -6;
const DECAY = 0.85;
const SIM_SPACING = 0.95;
const KEEP_BACK = 0.75 * GAP;
const SIM_F1 = LAST + 6;
const SIM = (() => {
  const xs = new Float64Array(N);
  const ys = new Float64Array(N);
  const gx = new Float64Array(N);
  const gy = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const g = goalAt(k, SIM_F0 - 30);
    xs[k] = gx[k] = g[0];
    ys[k] = gy[k] = g[1];
  }
  const out: { xs: Float64Array; ys: Float64Array; ex: Float64Array; ey: Float64Array }[] = [];
  for (let f = SIM_F0 - 30; f <= SIM_F1; f++) {
    for (let k = 0; k < N; k++) {
      const g = goalAt(k, f);
      xs[k] = g[0] + DECAY * (xs[k] - gx[k]);
      ys[k] = g[1] + DECAY * (ys[k] - gy[k]);
      gx[k] = g[0];
      gy[k] = g[1];
    }
    // spacing, and nobody ever steps onto the orange side (anything nearer the
    // line than KEEP_BACK is put back behind it), alternated so neither undoes
    // the other; spacing has the last word (KEEP_BACK is far more than a dot)
    for (let p = 0; p < 5; p++) {
      for (let k = 0; k < N; k++) {
        const nr = nearestOnLine(FRONT, xs[k], ys[k]);
        if (nr.depth < KEEP_BACK) {
          xs[k] += nr.nx * (KEEP_BACK - nr.depth);
          ys[k] += nr.ny * (KEEP_BACK - nr.depth);
        }
        // the streams flow round the CHINA label, never under it (a soft safety: the paths already bend round it)
        const [sd, lnx, lny] = labelSdf(xs[k], ys[k]);
        if (sd < 1) {
          xs[k] += lnx * 0.3 * (1 - sd);
          ys[k] += lny * 0.3 * (1 - sd);
        }
      }
      separate(xs, ys, SIM_SPACING * S, 0.8);
    }
    if (f >= SIM_F0) {
      const ex = new Float64Array(N);
      const ey = new Float64Array(N);
      for (let k = 0; k < N; k++) {
        ex[k] = xs[k] - gx[k];
        ey[k] = ys[k] - gy[k];
      }
      out.push({ xs: Float64Array.from(xs), ys: Float64Array.from(ys), ex, ey });
    }
  }
  return out;
})();
const TAPS = [0].map((j) => ({ j, g: Math.exp(-(j * j) / 2) }));

/** every dot at frame f (world px): the raw sim position with its spacing
 *  correction smoothed in time (the trajectories themselves stay sharp), plus
 *  a faint per-dot shuffle */
export const dotsAt = (f: number) => {
  const fi = Math.round(f);
  const xs = new Float64Array(N);
  const ys = new Float64Array(N);
  const r0 = SIM[clamp(fi - SIM_F0, 0, SIM.length - 1)];
  for (let k = 0; k < N; k++) {
    let ex = 0;
    let ey = 0;
    let w = 0;
    for (const { j, g } of TAPS) {
      const r = SIM[clamp(fi + j - SIM_F0, 0, SIM.length - 1)];
      ex += r.ex[k] * g;
      ey += r.ey[k] * g;
      w += g;
    }
    const a = 0.06 * S;
    xs[k] = r0.xs[k] - r0.ex[k] + ex / w + a * Math.sin(fi * (0.05 + 0.04 * hash(k, 11)) + 6.283 * hash(k, 13));
    ys[k] = r0.ys[k] - r0.ey[k] + ey / w + a * Math.sin(fi * (0.045 + 0.045 * hash(k, 12)) + 6.283 * hash(k, 14));
  }
  return { xs, ys };
};

/** MORPH: each dot's mark turns into the shared filled dot over the last
 *  MORPH_D world px of its march (0 = its faction's mark, 1 = the band's dot) */
const MORPH_D = 3.5 * S;
export const morphAt = (f: number) => {
  const fi = Math.round(f);
  const out = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const t0 = CROWDS[CROWD_OF[k]].t0;
    if (fi < t0) continue;
    const sg = MARCH.sig[k][Math.min(MARCH.sig[k].length - 1, fi - t0)];
    const L = MARCH.paths[k].L;
    out[k] = smoother((sg - (L - MORPH_D)) / MORPH_D);
  }
  return out;
};
/** the frame each crowd's last dot is home (for checks) */
export const ARRIVALS = CROWDS.map((c, i) => {
  let last = c.t0;
  for (let k = 0; k < N; k++) {
    if (CROWD_OF[k] !== i) continue;
    const sg = MARCH.sig[k];
    const L = MARCH.paths[k].L;
    let f = 0;
    while (f < sg.length - 1 && L - sg[f] > 0.05 * S) f++;
    last = Math.max(last, c.t0 + f);
  }
  return last;
});

/** the band's world box (for framing checks) */
export const BAND_BOX = (() => {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < N; i++) {
    x0 = Math.min(x0, BAND.bx[i]);
    y0 = Math.min(y0, BAND.by[i]);
    x1 = Math.max(x1, BAND.bx[i]);
    y1 = Math.max(y1, BAND.by[i]);
  }
  return [x0, y0, x1, y1] as [number, number, number, number];
})();
/** debug: the raw sim frame (before the time smoothing) */
export const simRawAt = (f: number) => SIM[clamp(Math.round(f) - SIM_F0, 0, SIM.length - 1)];
