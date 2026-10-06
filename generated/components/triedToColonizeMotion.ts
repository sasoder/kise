// ---------------------------------------------------------------------------
// triedToColonizeMotion: the pure maths of cut D, TriedToColonize (clip
// "Sheppard_Vikings"; the North Atlantic world, vikAtlanticShared). No React:
// the camera, the line's head, the nine Norse and the crowd, each as a function
// of the local frame, so the scratch checks (speed scans, dead-air scans) read
// the same numbers the component draws.
//
// LAYOUT (REVISED after the director's review: the close-up is at k ~10, where
// the Great Northern Peninsula reads as a peninsula, with the Strait of Belle
// Isle and the Labrador shore top-left). Everything at the foothold is laid out
// in "site px": screen px at K_REF = K_HOLD = 10 from L'Anse aux Meadows
// (LANSE), x east, y south; site(dx, dy) -> world.
//   the hall      a SYMBOL, not to scale: 210 px wide, its foot middle HALL_PX,
//                 standing over the tip
//   the nine      a compact group at the very tip, between the hall and the
//                 shore where the line lands (GROUP_PX)
//   the crowd     N_CROWD cream dots: Poisson-disc points on LAND (landAt)
//                 ranked by their distance over land from the tip. T1 = the 140
//                 nearest outside the hall's ground and the nine's ring: a
//                 packed body up the peninsula, its head funnelled by the land.
//                 T2 = the 140 nearest with nothing kept free (the crowd over
//                 the hall and the landing). Every dot has corridor coordinates
//                 (s along the peninsula's centreline, n across it) and walks
//                 in them: up the centreline from the south-south-west, off
//                 frame, to T1, then on to T2, on its own eased clock.
// ---------------------------------------------------------------------------
import { BRATTAHLID, LANSE, ROUTE_VINLAND, landAt, makeCamera, pchip, type Cam, type CamKey, type P2 } from "./vikAtlanticShared";

export const DURATION = 198;
export const K_REF = 10;
export const K_HOLD = 10;
export const SITE_PX = K_HOLD / K_REF;
export const site = (dx: number, dy: number): P2 => [LANSE[0] + dx / K_REF, LANSE[1] + dy / K_REF];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const smoother = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---------------------------------------------------------------------------
// THE LINE'S HEAD: leaves the settlement on f3, lands on f58
// ---------------------------------------------------------------------------
export const F_SAIL = 3;
export const F_LAND = 58;
const HEAD = pchip(
  [
    [F_SAIL, 0],
    [9, 0.035],
    [20, 0.25],
    [36, 0.63],
    [50, 0.935],
    [F_LAND, 1],
  ],
  true,
);
/** the line's progress 0..1 (NorseRoute progress) */
export const headProgress = (f: number) => clamp01(f <= F_SAIL ? 0 : f >= F_LAND ? 1 : HEAD(f));

// ---------------------------------------------------------------------------
// THE CAMERA: one move from Greenland down the line into the foothold (f0-97,
// zoom rate <= 3 % / frame), creep, ease back for the crowd (f116-148), drift
// north-east with the leaving Norse (f160-194), creep. Keys = a world point at
// a screen point at zoom k. Never held inside a level's crossfade band.
// ---------------------------------------------------------------------------
export const K_CLOSE = 10.9;
const L = LANSE;
const CAM_KEYS: CamKey[] = [
  { f: -10, k: 2.7, wx: BRATTAHLID[0], wy: BRATTAHLID[1], sx: 656, sy: 648 },
  { f: 0, k: 2.62, wx: BRATTAHLID[0], wy: BRATTAHLID[1], sx: 690, sy: 640 },
  { f: 14, k: 2.2, wx: BRATTAHLID[0], wy: BRATTAHLID[1], sx: 870, sy: 606 },
  { f: 26, k: 2.0, wx: L[0], wy: L[1], sx: 650, sy: 1505 },
  { f: 36, k: 2.06, wx: L[0], wy: L[1], sx: 676, sy: 1250 },
  { f: 46, k: 2.62, wx: L[0], wy: L[1], sx: 614, sy: 985 },
  { f: 56, k: 3.55, wx: L[0], wy: L[1], sx: 586, sy: 880 },
  { f: 66, k: 4.75, wx: L[0], wy: L[1], sx: 576, sy: 822 },
  { f: 76, k: 6.35, wx: L[0], wy: L[1], sx: 572, sy: 785 },
  { f: 86, k: 8.4, wx: L[0], wy: L[1], sx: 570, sy: 765 },
  { f: 92, k: 9.7, wx: L[0], wy: L[1], sx: 570, sy: 759 },
  { f: 97, k: 10.4, wx: L[0], wy: L[1], sx: 570, sy: 756 },
  { f: 116, k: K_CLOSE, wx: L[0], wy: L[1], sx: 570, sy: 754 },
  { f: 148, k: K_HOLD, wx: L[0], wy: L[1], sx: 572, sy: 740 },
  { f: 160, k: K_HOLD - 0.05, wx: L[0], wy: L[1], sx: 570, sy: 744 },
  { f: 194, k: 9.5, wx: L[0], wy: L[1], sx: 532, sy: 810 },
  { f: 198, k: 9.48, wx: L[0], wy: L[1], sx: 530, sy: 813 },
];
export const cameraAt: (f: number) => Cam = makeCamera(CAM_KEYS);

// ---------------------------------------------------------------------------
// THE FOOTHOLD
// ---------------------------------------------------------------------------
export const HALL_SIZE = 210; // screen px wide at rest (a symbol)
const HALL_H = HALL_SIZE * 0.31;
export const HALL_PX: P2 = [-45, 100]; // the hall's foot middle, site px
export const HALL_AT = site(HALL_PX[0], HALL_PX[1]);
const NINE_LAND = (p: P2) => {
  const q = 10 / K_REF;
  const w = site(p[0], p[1]);
  return [[0, 0], [q, 0], [-q, 0], [0, q], [0, -q]].every(([dx, dy]) => landAt(w[0] + dx, w[1] + dy));
};
/** the nine's slots round the group's centre (site px): compact, not a grid */
const NINE_PX: P2[] = [
  [-11, -27],
  [11, -26],
  [-22, -9],
  [0, -7],
  [21, -6],
  [-12, 11],
  [10, 12],
  [-34, 9],
  [32, 13],
];
/** the nine: ON LAND at the tip, immediately west / south-west of the hall's left end, between the hall
 *  and where the crowd arrives: the spot nearest GROUP_WANT where all nine slots are on land */
const GROUP_WANT: P2 = [HALL_PX[0] - HALL_SIZE / 2 - 48, HALL_PX[1] - 14];
export const GROUP_PX: P2 = (() => {
  let best: P2 | null = null;
  let bd = Infinity;
  for (let dx = -70; dx <= 30; dx += 3)
    for (let dy = -60; dy <= 70; dy += 3) {
      const c: P2 = [GROUP_WANT[0] + dx, GROUP_WANT[1] + dy];
      if (c[0] + 34 > HALL_PX[0] - HALL_SIZE / 2 - 12) continue; // clear of the hall's end
      const d = Math.hypot(dx, dy);
      if (d < bd && NINE_PX.every(([x, y]) => NINE_LAND([c[0] + x, c[1] + y]))) [bd, best] = [d, c];
    }
  if (!best) throw new Error("triedToColonizeMotion: no land for the nine by the hall");
  return best;
})();
export const GROUP_AT = site(GROUP_PX[0], GROUP_PX[1]);
export const N_NORSE = NINE_PX.length;
export const NORSE_SLOTS: P2[] = NINE_PX.map(([x, y]) => site(GROUP_PX[0] + x, GROUP_PX[1] + y));

// polyline helpers
type Poly = { pts: P2[]; cum: number[]; len: number };
const polyOf = (pts: P2[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
const polyAt = (P: Poly, s: number): P2 => {
  const t = Math.max(0, Math.min(P.len, s));
  let lo = 0;
  let hi = P.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (P.cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const u = (t - P.cum[lo]) / (P.cum[hi] - P.cum[lo] || 1);
  return [P.pts[lo][0] + (P.pts[hi][0] - P.pts[lo][0]) * u, P.pts[lo][1] + (P.pts[hi][1] - P.pts[lo][1]) * u];
};
/** a clamped uniform cubic B-spline through control points (smooth, no wiggle) */
const bspline = (cp: P2[], per = 14): P2[] => {
  const c = [cp[0], cp[0], ...cp, cp[cp.length - 1], cp[cp.length - 1]];
  const out: P2[] = [];
  for (let i = 0; i + 3 < c.length; i++)
    for (let q = 0; q < per; q++) {
      const t = q / per;
      const b0 = ((1 - t) * (1 - t) * (1 - t)) / 6;
      const b1 = (3 * t * t * t - 6 * t * t + 4) / 6;
      const b2 = (-3 * t * t * t + 3 * t * t + 3 * t + 1) / 6;
      const b3 = (t * t * t) / 6;
      out.push([b0 * c[i][0] + b1 * c[i + 1][0] + b2 * c[i + 2][0] + b3 * c[i + 3][0], b0 * c[i][1] + b1 * c[i + 1][1] + b2 * c[i + 2][1] + b3 * c[i + 3][1]]);
    }
  out.push(cp[cp.length - 1]);
  return out;
};

// THE NINE. One road each, parametrised from the sea: SEA_RUN world px of the
// route (offset sideways by the dot's own file), the landing, its slot. They
// come down it (f78-110) and leave by it (f156-).
const SEA_RUN = 70; // world px of the route in a dot's road
const norseRoad = (i: number): { road: Poly; shoreS: number } => {
  const lat = ((i % 3) - 1) * 0.95 + (hash(i, 3) - 0.5) * 0.3; // world px off the line (its file in the body)
  const sea: P2[] = [];
  for (let q = ROUTE_VINLAND.len - SEA_RUN; q < ROUTE_VINLAND.len - 3; q += 0.5) {
    const [x, y] = ROUTE_VINLAND.pointAt(q);
    const [tx, ty] = ROUTE_VINLAND.tangentAt(q);
    const w = smooth((ROUTE_VINLAND.len - 3 - q) / 8); // the files close up at the landing
    sea.push([x - ty * lat * w, y + tx * lat * w]);
  }
  const seaPoly = polyOf(sea);
  const ashore = bspline([sea[sea.length - 1], NORSE_SLOTS[i], NORSE_SLOTS[i]], 12);
  const road = polyOf([...sea, ...ashore.slice(1)]);
  return { road, shoreS: seaPoly.len };
};
const NORSE = NINE_PX.map((_, i) => norseRoad(i));
const ARRIVE_RUN = 26; // world px of sea line it rides in view
const ARRIVE_T = 20;
/** the order they land in: the far slots first, so nobody walks through a settled dot */
const ARRIVE_ORDER = NINE_PX.map((_, i) => i).sort((a, b) => NORSE[b].road.len - NORSE[a].road.len);
const arriveT0 = (i: number) => 78 + 1.5 * ARRIVE_ORDER.indexOf(i) + (hash(i, 11) - 0.5) * 0.6;
// leaving: nearest the shore lead the way out; one compact body
const LEAVE_F0 = 154;
const LEAVE_ORDER = NINE_PX.map((_, i) => i).sort((a, b) => NORSE[a].road.len - NORSE[b].road.len);
const leaveT0 = (i: number) => LEAVE_F0 + 0.9 * LEAVE_ORDER.indexOf(i) + (hash(i, 13) - 0.5) * 0.5;
const LEAVE_V = 1.5; // world px / frame at full pace (~14 screen px at k 9.6)
/** distance run by a leaving dot tau frames after it starts: a soft start, then a steady pace */
const leaveRun = (tau: number) => {
  if (tau <= 0) return 0;
  const R = 9; // frames to full pace
  return tau < R ? (LEAVE_V * tau * tau * tau * (R - tau / 2)) / (R * R * R) : LEAVE_V * (R / 2 + (tau - R));
};
export type Person = { x: number; y: number; op: number };
/** Norse dot i at frame f (world px) */
export const norseAt = (i: number, f: number): Person => {
  const { road } = NORSE[i];
  const tl = leaveT0(i);
  if (f >= tl) {
    const [x, y] = polyAt(road, road.len - leaveRun(f - tl));
    return { x, y, op: 1 };
  }
  const t0 = arriveT0(i);
  const u = (f - t0) / ARRIVE_T;
  if (u <= 0) return { x: road.pts[0][0], y: road.pts[0][1], op: 0 };
  const sStart = NORSE[i].shoreS - ARRIVE_RUN;
  const e = 1 - Math.pow(1 - clamp01(u), 1.7);
  const [x, y] = polyAt(road, sStart + (road.len - sStart) * e);
  return { x, y, op: smooth((f - t0) / 4) };
};
/** the frame every Norse dot is in its slot */
export const NORSE_SETTLED_F = Math.max(...NINE_PX.map((_, i) => arriveT0(i) + ARRIVE_T));
/** the line's retract (NorseRoute retract): its Newfoundland end follows the rearmost leaving dot out to sea */
export const retractAt = (f: number) => {
  let rear = Infinity;
  for (let i = 0; i < N_NORSE; i++) {
    const { road, shoreS } = NORSE[i];
    const tl = leaveT0(i);
    const q = f >= tl ? road.len - leaveRun(f - tl) : road.len;
    rear = Math.min(rear, shoreS - q); // > 0 once it is on the sea
  }
  const d = rear <= 0 ? 0 : rear < 2.4 ? (rear * rear) / 4.8 : rear - 1.2; // a soft take-up
  return clamp01((d + (d > 0 ? 3 * smooth(d / 2) : 0)) / ROUTE_VINLAND.len);
};

// ---------------------------------------------------------------------------
// THE CROWD
// ---------------------------------------------------------------------------
export const N_CROWD = 140;
export const DOT_R = 8.8; // screen px (dots 17.6 px wide)
const SPACING = 21.5; // site px between centres (Poisson-disc radius)
const onLand = (p: P2, m: number) => {
  const q = m / K_REF;
  return landAt(p[0], p[1]) && landAt(p[0] + q, p[1]) && landAt(p[0] - q, p[1]) && landAt(p[0], p[1] + q) && landAt(p[0], p[1] - q);
};
/** Poisson-disc points over the land of the peninsula (site px), seeded */
const FIELD: P2[] = (() => {
  const box = { x0: -720, x1: 170, y0: -30, y1: 1160 };
  let seed = 20261006;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const cell = SPACING / Math.SQRT2;
  const gw = Math.ceil((box.x1 - box.x0) / cell);
  const gh = Math.ceil((box.y1 - box.y0) / cell);
  const grid = new Int32Array(gw * gh).fill(-1);
  const pts: P2[] = [];
  const fits = (x: number, y: number) => {
    const gi = Math.floor((x - box.x0) / cell);
    const gj = Math.floor((y - box.y0) / cell);
    for (let j = Math.max(0, gj - 2); j <= Math.min(gh - 1, gj + 2); j++)
      for (let i = Math.max(0, gi - 2); i <= Math.min(gw - 1, gi + 2); i++) {
        const q = grid[j * gw + i];
        if (q >= 0 && Math.hypot(pts[q][0] - x, pts[q][1] - y) < SPACING) return false;
      }
    return true;
  };
  const add = (x: number, y: number) => {
    grid[Math.floor((y - box.y0) / cell) * gw + Math.floor((x - box.x0) / cell)] = pts.length;
    pts.push([x, y]);
  };
  add(-10, 60);
  const active = [0];
  while (active.length) {
    const ai = Math.floor(rnd() * active.length);
    const [ax, ay] = pts[active[ai]];
    let grown = false;
    for (let t = 0; t < 40; t++) {
      const a = rnd() * Math.PI * 2;
      const r = SPACING * (1 + 0.3 * rnd());
      const x = ax + Math.cos(a) * r;
      const y = ay + Math.sin(a) * r;
      if (x < box.x0 || x >= box.x1 || y < box.y0 || y >= box.y1) continue;
      if (!fits(x, y)) continue;
      add(x, y); // water points stay as stepping stones for the walk; filtered below
      active.push(pts.length - 1);
      grown = true;
      break;
    }
    if (!grown) active.splice(ai, 1);
  }
  return pts.filter(([x, y]) => onLand(site(x, y), DOT_R + 1));
})();
const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// distance OVER LAND from the tip (Dijkstra on the field's neighbour graph)
const NEIGH = FIELD.map((p, i) => FIELD.map((q, j) => (j !== i && dist(p, q) < SPACING * 1.75 ? j : -1)).filter((j) => j >= 0));
const ROOT = FIELD.reduce((b, p, i) => (dist(p, [0, 50]) < dist(FIELD[b], [0, 50]) ? i : b), 0);
const { G, PARENT } = (() => {
  const g = FIELD.map(() => Infinity);
  const par = FIELD.map(() => -1);
  const done = FIELD.map(() => false);
  g[ROOT] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < g.length; i++) if (!done[i] && g[i] < Infinity && (u < 0 || g[i] < g[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    for (const v of NEIGH[u]) {
      const d = g[u] + dist(FIELD[u], FIELD[v]);
      if (d < g[v]) {
        g[v] = d;
        par[v] = u;
      }
    }
  }
  return { G: g, PARENT: par };
})();
// THE CORRIDOR'S CENTRELINE: the land walk from the peninsula's middle in the south up to the tip,
// smoothed hard; s runs north (s = 0 at its south end), extended straight beyond both ends
const CENTRE: Poly = (() => {
  // the far point: the reachable field point of the southern rows nearest their middle
  const south = FIELD.map((p, i) => ({ p, i })).filter(({ p, i }) => p[1] > 1100 && G[i] < Infinity);
  const mx = south.reduce((a, q) => a + q.p[0], 0) / Math.max(1, south.length);
  let far = south.length ? south.reduce((b, q) => (Math.abs(q.p[0] - mx) < Math.abs(b.p[0] - mx) ? q : b)).i : ROOT;
  const path: P2[] = [];
  while (far >= 0) {
    path.push(FIELD[far]);
    far = PARENT[far];
  }
  const ctrl = path.filter((_, i) => i % 5 === 0 || i === path.length - 1);
  return polyOf(bspline(ctrl, 24));
})();
const centreAt = (s: number): { p: P2; n: P2 } => {
  const q = Math.max(0, Math.min(CENTRE.len, s));
  const a = polyAt(CENTRE, Math.max(0, q - 12));
  const b = polyAt(CENTRE, Math.min(CENTRE.len, q + 12));
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const t: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  const c = polyAt(CENTRE, q);
  const over = s - q; // beyond an end: straight on
  return { p: [c[0] + t[0] * over, c[1] + t[1] * over], n: [-t[1], t[0]] };
};
// THE CORRIDOR'S HALF-WIDTHS: how far the land reaches either side of the centreline at each s
// (marched out to the first water, then eroded and smoothed along s). A dot keeps its SHARE of the
// width, u = n / halfWidth, so the body narrows and widens with the land: the land does the funnelling.
const HW_STEP = 6;
const HW = (() => {
  const n = Math.floor(CENTRE.len / HW_STEP) + 1;
  const raw: [number[], number[]] = [[], []];
  for (let i = 0; i < n; i++) {
    const c = centreAt(i * HW_STEP);
    [1, -1].forEach((side, q) => {
      let d = 0;
      while (d < 420) {
        const w = site(c.p[0] + c.n[0] * side * (d + 4), c.p[1] + c.n[1] * side * (d + 4));
        if (!landAt(w[0], w[1])) break;
        d += 4;
      }
      raw[q].push(Math.max(14, d - DOT_R - 5));
    });
  }
  const filt = (a: number[]) => {
    const er = a.map((_, i) => Math.min(...a.slice(Math.max(0, i - 9), i + 10)));
    return er.map((_, i) => {
      const w = er.slice(Math.max(0, i - 16), i + 17);
      return w.reduce((x, y) => x + y, 0) / w.length;
    });
  };
  return [filt(raw[0]), filt(raw[1])];
})();
const halfWidth = (s: number, side: number) => {
  const a = HW[side > 0 ? 0 : 1];
  const q = Math.max(0, Math.min(a.length - 1.001, s / HW_STEP));
  const i = Math.floor(q);
  return a[i] + (a[i + 1] - a[i]) * (q - i);
};
/** corridor coordinates of a site point: s along the centreline, u = its share of the half-width
 *  across it (signed), and the residual that puts it back exactly */
const toCorridor = (p: P2) => {
  let bs = 0;
  let bd = Infinity;
  for (let q = 0; q <= CENTRE.len; q += 3) {
    const d = dist(polyAt(CENTRE, q), p);
    if (d < bd) [bd, bs] = [d, q];
  }
  const { p: c, n } = centreAt(bs);
  const nn = (p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1];
  const u = Math.max(-1.6, Math.min(1.6, nn / halfWidth(bs, nn))); // its share (a little over 1 = out by the coast)
  const back = u * halfWidth(bs, u);
  return { s: bs, u, rx: p[0] - c[0] - n[0] * back, ry: p[1] - c[1] - n[1] * back };
};
type Corr = ReturnType<typeof toCorridor>;
/** res 0..1 = how much of the residual is applied */
const fromCorridor = (s: number, u: number, rx: number, ry: number, res = 1): P2 => {
  const c = centreAt(s);
  const n = u * halfWidth(s, u);
  return [c.p[0] + c.n[0] * n + rx * res, c.p[1] + c.n[1] * n + ry * res];
};
/** distance (site px) from p to the hall's body */
const hallDist = ([x, y]: P2) => Math.hypot(Math.max(0, Math.abs(x - HALL_PX[0]) - HALL_SIZE / 2), Math.max(0, HALL_PX[1] - HALL_H - y, y - HALL_PX[1]));
const IDX = FIELD.map((_, i) => i)
  .filter((i) => G[i] < Infinity)
  .sort((a, b) => G[a] - G[b]);
/** T1: the body up the peninsula, its head at the hall's foot */
const T1_I = IDX.filter((i) => hallDist(FIELD[i]) > 9 && dist(FIELD[i], GROUP_PX) > 54 && !(FIELD[i][0] > GROUP_PX[0] + 10 && FIELD[i][1] < HALL_PX[1] + 45) && !(FIELD[i][1] < GROUP_PX[1] - 30 && FIELD[i][0] > GROUP_PX[0] - 60)).slice(0, N_CROWD);
/** T2: the crowd over the hall and the landing */
const T2_I = IDX.slice(0, N_CROWD);
if (T1_I.length < N_CROWD) throw new Error(`triedToColonizeMotion: only ${T1_I.length} land slots for the crowd`);
const T1_PX: P2[] = T1_I.map((i) => FIELD[i]);
// match T1 -> T2: least total move (Hungarian, n = 140)
const hungarian = (cost: number[][]) => {
  const n = cost.length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(n + 1).fill(0);
  const p = new Array(n + 1).fill(0);
  const way = new Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(n + 1).fill(Infinity);
    const used = new Array(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++)
        if (!used[j]) {
          const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      for (let j = 0; j <= n; j++)
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }
  const out = new Array(n).fill(0);
  for (let j = 1; j <= n; j++) out[p[j] - 1] = j - 1;
  return out;
};
const MATCH = hungarian(T1_I.map((a) => T2_I.map((b) => Math.pow(Math.abs(G[a] - G[b]) + 0.5 * dist(FIELD[a], FIELD[b]), 1.5))));
const T2_PX: P2[] = T1_I.map((_, i) => FIELD[T2_I[MATCH[i]]]);

const RUN_IN = 1080; // site px each dot walks up the corridor to its place (it starts off frame)
const SQ_N = 61;
type CrowdDot = { c1: Corr; c2: Corr; hug: boolean; sq: number[]; wq: number[]; a0: number; aT: number; b0: number; bT: number };
const CROWD: CrowdDot[] = T1_PX.map((t1px, i) => {
  const rank = i / (N_CROWD - 1); // 0 = the front (nearest the tip over land)
  const aT = 44 + 8 * hash(i, 25);
  // the front lands on "fierce" (f144-150); the rear closes up behind it
  const a1 = 145 + 5 * Math.pow(rank, 0.8) + (hash(i, 26) - 0.5) * 3;
  const c1 = toCorridor(t1px);
  const c2 = toCorridor(T2_PX[i]);
  const move = dist(t1px, T2_PX[i]);
  const bT = Math.min(34, 17 + 5 * hash(i, 27) + move / 8); // the long walks take longer, not faster
  const b0 = Math.min(159 + 15 * rank + (hash(i, 28) - 0.5) * 3, 195 - bT);
  let hug = false;
  for (let q = 1; q < 16 && !hug; q++) {
    const e = q / 16;
    const m = (a: number, b: number) => a + (b - a) * e;
    const w = site(...fromCorridor(m(c1.s, c2.s), m(c1.u, c2.u), m(c1.rx, c2.rx), m(c1.ry, c2.ry)));
    if (!landAt(w[0], w[1])) hug = true;
  }
  // the squeeze toward the centreline that keeps its walk in on land (1 = none)
  const rawSq: number[] = [];
  for (let q = 0; q < SQ_N; q++) {
    const e = q / (SQ_N - 1);
    let k = 1;
    for (let t = 0; t < 14; t++) {
      const w = site(...fromCorridor(c1.s - RUN_IN * (1 - e), c1.u * k, c1.rx, c1.ry, smooth((e - 0.8) / 0.2)));
      if (q === SQ_N - 1 || landAt(w[0], w[1])) break;
      k *= 0.8;
    }
    rawSq.push(k);
  }
  const er = rawSq.map((_, q) => Math.min(...rawSq.slice(Math.max(0, q - 2), q + 3)));
  const sq = er.map((_, q) => {
    const w = er.slice(Math.max(0, q - 3), q + 4);
    return w.reduce((x, y) => x + y, 0) / w.length;
  });
  sq[SQ_N - 1] = 1;
  sq[SQ_N - 2] = (sq[SQ_N - 3] + 1) / 2;
  // the same for its walk over the hall (it goes round the inlet by the neck, on land)
  const rawW: number[] = [];
  for (let q = 0; q < SQ_N; q++) {
    const e = q / (SQ_N - 1);
    const m = (a: number, b: number) => a + (b - a) * e;
    let k = 1;
    for (let t = 0; t < 16; t++) {
      const w = site(...fromCorridor(m(c1.s, c2.s), m(c1.u, c2.u) * k, m(c1.rx, c2.rx) * k, m(c1.ry, c2.ry) * k));
      if (q === 0 || q === SQ_N - 1 || landAt(w[0], w[1])) break;
      k *= 0.75;
    }
    rawW.push(k);
  }
  const erW = rawW.map((_, q) => Math.min(...rawW.slice(Math.max(0, q - 3), q + 4)));
  const wq = erW.map((_, q) => {
    const w = erW.slice(Math.max(0, q - 4), q + 5);
    return w.reduce((x, y) => x + y, 0) / w.length;
  });
  for (let q = 0; q < 5; q++) {
    wq[q] = 1 + (wq[q] - 1) * (q / 5);
    wq[SQ_N - 1 - q] = 1 + (wq[SQ_N - 1 - q] - 1) * (q / 5);
  }
  return { c1, c2, hug, sq, wq, a0: a1 - aT, aT, b0, bT };
});
/** crowd dot i at frame f (world px) */
export const crowdAt = (i: number, f: number): Person => {
  const c = CROWD[i];
  if (f <= c.b0) {
    // it comes into frame already walking and slows into its place (no slow start: nobody sees it)
    const e = 1 - Math.pow(1 - clamp01((f - c.a0) / c.aT), 1.9);
    // every dot on land: where its share of the width would put it on water it closes on the
    // centreline, by a factor found once along its walk and smoothed (c.sq), so it never jumps
    const qi = e * (SQ_N - 1);
    const q0 = Math.floor(Math.min(SQ_N - 2, qi));
    const sq = c.sq[q0] + (c.sq[q0 + 1] - c.sq[q0]) * (qi - q0);
    const [x, y] = fromCorridor(c.c1.s - RUN_IN * (1 - e), c.c1.u * sq, c.c1.rx, c.c1.ry, smooth((e - 0.8) / 0.2));
    const [wx, wy] = site(x, y);
    return { x: wx, y: wy, op: smooth((f - c.a0) / 4) };
  }
  const e = smoother((f - c.b0) / c.bT);
  const m = (a: number, b: number) => a + (b - a) * e;
  // a walk that would cross water straight closes on the centreline there (c.wq, found once, smoothed)
  const wi = e * (SQ_N - 1);
  const w0 = Math.floor(Math.min(SQ_N - 2, wi));
  const hug = c.wq[w0] + (c.wq[w0 + 1] - c.wq[w0]) * (wi - w0);
  const [x, y] = fromCorridor(m(c.c1.s, c.c2.s), m(c.c1.u, c.c2.u) * hug, m(c.c1.rx, c.c2.rx) * hug, m(c.c1.ry, c.c2.ry) * hug);
  const [wx, wy] = site(x, y);
  return { x: wx, y: wy, op: 1 };
};
/** how far the crowd has washed over the hall, 0..1: the share of the dots that end on the hall's ground
 *  and have reached it (the hall drains from orange to a cream ghost on this) */
const HALL_DOTS = T2_PX.map((p, i) => ({ i, d: hallDist(p) < 4 })).filter((q) => q.d);
export const hallWash = (f: number) => {
  if (!HALL_DOTS.length) return smooth((f - 166) / 18);
  let acc = 0;
  for (const { i } of HALL_DOTS) acc += smoother((f - CROWD[i].b0) / CROWD[i].bT);
  return acc / HALL_DOTS.length;
};

/** for the scratch checks */
export const DEBUG = { FIELD, T1_PX, T2_PX, CROWD, NORSE, CAM_KEYS, arriveT0, leaveT0, HALL_DOTS, CENTRE };
