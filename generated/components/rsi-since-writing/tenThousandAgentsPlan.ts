// ---------------------------------------------------------------------------
// tenThousandAgentsPlan: the pure geometry of TenThousandAgents (rsi-since-writing, revision 2: THE THINKING HANDED
// OUT): the hall, the slab of work, its 100 stacks and their 10,000 sheets, the robots' switch-on times and the
// camera. No React, so a sheet script can import it. Units: the cast's (U = 178 per metre; the robot 240 = 1.35 m,
// soles to head top); X across, Y height (floor 0, up is -Y), Z depth (toward the camera is -Z).
//
// THE HALL: 100 columns x 100 rows of low desks (DESK 170 x 110, top at Y -80), CX = 220 apart across (1.24 m) and
//   RZ = 300 apart in depth (1.7 m): row r's desk front at Z = r * RZ, its robot standing behind it at Z + ROBOT_BACK
//   (the desk hides it below the waist; its mittens on the keyboard at the desk's back edge). Column c at
//   X = (c - 49.5) * CX (the middle aisle at X 0).
// THE SLAB: one big piece of thinking hovering between us and the hall, in front of the first row: 10 x 10 STACKS
//   (each 100 cream sheets, PIECE 58 x 74, LT 0.26 thick: a pad 26 thick), its face (the top sheets, inked) tilted back SLAB.tilt from
//   the vertical, the face's near (bottom) edge at (Y SLAB.ybot, Z SLAB.z).
// THE HANDING OUT, in two steps (so it reads as one thing dealt out, not copies):
//   1. the slab cracks along its grid and its 100 stacks fly off one after another, the far (top) row first, AWAY from
//      us over the hall, fanning out: stack (i, j) (i across, j up the face) goes to BLOCK (i, 9 - j) of the hall
//      (columns 10i..10i+9, rows 10(9-j)..+9: the top stacks feed the near blocks, the bottom ones the far blocks;
//      left feeds left); it turns flat on the way and stops in the air over its block (the near blocks' stacks close in front of us);
//   2. there it deals its 100 sheets, top sheet first, one onto each desk of its block (the near rows first); each
//      sheet lands flat beside the keyboard and the robot at that desk switches on (bootUp over BOOT 16 frames).
// THE CAMERA: one pinhole (focal F, no pitch) at (cx, -h, -d) looking down +Z; the front desks' foot line at screen
//   y = ty (a lens shift). ONE crane up and push in following the stacks (log d, h on bell speed profiles: one
//   acceleration lobe, one long settle lobe still creeping at the cut); the horizon falls from y ~680 to ~330.
// ---------------------------------------------------------------------------

export const DURATION = 88;
export const COLS = 100;
export const ROWS = 100;
export const N = COLS * ROWS;
export const CX = 220;
export const RZ = 300;
export const DESK = { w: 170, d: 110, h: 80 } as const;
export const ROBOT_BACK = 132;
export const colX = (c: number) => (c - 49.5) * CX;
export const rowZ = (r: number) => r * RZ;
export const BOOT = 16;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const sst = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeIO = (u: number) => {
  const t = c01(u);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const hash = (n: number) => {
  let h = (n | 0) * 374761393 + 668265263;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// ---- the camera -----------------------------------------------------------------------------------------------------
export const F = 1000;
const CAM_D0 = 1300;
const CAM_D1 = 960;
const CAM_H0 = 510;
const CAM_H1 = 712;
const CAM_TY = 1072;
const CAM_F0 = 12;
const CAM_F1 = 80;
const bell = (f0: number, f1: number, a: number, b: number) => {
  const M = 400;
  const cum = new Float64Array(M + 1);
  for (let i = 1; i <= M; i++) {
    const t = (i - 0.5) / M;
    cum[i] = cum[i - 1] + Math.pow(t, a) * Math.pow(1 - t, b);
  }
  const tot = cum[M];
  return (f: number) => {
    const t = c01((f - f0) / (f1 - f0)) * M;
    const i = Math.min(M - 1, Math.floor(t));
    return (cum[i] + (cum[i + 1] - cum[i]) * (t - i)) / tot;
  };
};
/** f0: the eye 2.9 m up, 7.3 m in front of the first desks, the slab big between us and the hall, the horizon at
 *  y ~680; the end: 4 m up, 5.4 m in front, looking down the rows to a haze horizon at y ~330, the front robots ~220
 *  px tall at the bottom of the keep-in. The front desks' foot line stays at y ty (just above the caption band). */
export const CAM_KEYS = { d: [CAM_D0, CAM_D1], h: [CAM_H0, CAM_H1], ty: [CAM_TY, CAM_TY] };
const pD = bell(CAM_F0, CAM_F1, 2.2, 3.2);
const pH = bell(CAM_F0 + 2, CAM_F1 - 6, 2.2, 3.2);
const pT = bell(CAM_F0, CAM_F1, 2, 2);
export type Cam3 = { cx: number; h: number; d: number; hy: number; ty: number };
export const cam3At = (f: number): Cam3 => {
  const d = Math.exp(mix(Math.log(CAM_KEYS.d[0]), Math.log(CAM_KEYS.d[1]), pD(f)));
  const h = Math.exp(mix(Math.log(CAM_KEYS.h[0]), Math.log(CAM_KEYS.h[1]), pH(f)));
  const ty = mix(CAM_KEYS.ty[0], CAM_KEYS.ty[1], pT(f));
  return { cx: 0, h, d, ty, hy: ty - (h * F) / d };
};
export const project = (c: Cam3, X: number, Y: number, Z: number) => {
  const dd = Z + c.d;
  const s = F / Math.max(1, dd);
  return { x: 540 + (X - c.cx) * s, y: c.hy + (Y + c.h) * s, s };
};


// ---- the slab -------------------------------------------------------------------------------------------------------
export const PIECE = { w: 58, l: 74 } as const;
export const TILES = 10;
export const LAYERS = 100;
export const SLAB = { z: -445, ybot: -365, tilt: 35, lt: 0.26 } as const;
export const STACK_T = LAYERS * SLAB.lt;
const TAU = (SLAB.tilt * Math.PI) / 180;
export type V3 = [number, number, number];
/** the face's axes: U across, V up the face (tilted back), W into the slab (away from us), SN out of the face */
export const SU: V3 = [1, 0, 0];
export const SV: V3 = [0, -Math.cos(TAU), Math.sin(TAU)];
export const SW: V3 = [0, Math.sin(TAU), Math.cos(TAU)];
export const SN: V3 = [0, -Math.sin(TAU), -Math.cos(TAU)];
/** the slab's gentle hover (units, Y) */
export const slabBob = (f: number) => 7 * Math.sin((2 * Math.PI * f) / 52);
/** a point on the slab: u across (0 = the middle), v up the face from its near edge, w into it */
export const slabPt = (u: number, v: number, w: number, f: number): V3 => [u * SU[0] + v * SV[0] + w * SW[0], SLAB.ybot + slabBob(f) + v * SV[1] + w * SW[1], SLAB.z + v * SV[2] + w * SW[2]];
export const FACE_W = TILES * PIECE.w;
export const FACE_H = TILES * PIECE.l;
/** tile (i, j): its u range and v range */
export const tileU0 = (i: number) => (i - TILES / 2) * PIECE.w;
export const tileV0 = (j: number) => j * PIECE.l;
/** the cracks: the grid lines draw out from the middle of the face over f24.5..f27.5 (before the first stack leaves) */
export const CRACK = { f0: 24.5, f1: 27.5 };
export const crackAt = (u: number, v: number, f: number) => {
  const dist = Math.hypot(u / (FACE_W / 2), (v - FACE_H / 2) / (FACE_H / 2)) / Math.SQRT2;
  return sst(CRACK.f0 + dist * 2, CRACK.f0 + dist * 2 + 1, f);
};

// ---- splines --------------------------------------------------------------------------------------------------------
const PATH_N = 48;
/** a path given as a smooth function of v (0..1), sampled densely and respaced evenly along its length */
const sampledPath = (fn: (v: number) => V3, M: number): Float32Array => {
  const K = 240;
  const raw: V3[] = [];
  for (let i = 0; i <= K; i++) raw.push(fn(i / K));
  const cum = [0];
  for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1], raw[i][2] - raw[i - 1][2]));
  const L = cum[cum.length - 1];
  const out = new Float32Array(M * 3);
  let j = 0;
  for (let m = 0; m < M; m++) {
    const s = (L * m) / (M - 1);
    while (j < raw.length - 2 && cum[j + 1] < s) j++;
    const t = c01((s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]));
    for (let a = 0; a < 3; a++) out[m * 3 + a] = raw[j][a] + (raw[j + 1][a] - raw[j][a]) * t;
  }
  return out;
};
const along = (p: Float32Array, s: number): V3 => {
  const x = c01(s) * (PATH_N - 1);
  const i = Math.min(PATH_N - 2, Math.floor(x));
  const k = x - i;
  return [p[i * 3] + (p[i * 3 + 3] - p[i * 3]) * k, p[i * 3 + 1] + (p[i * 3 + 4] - p[i * 3 + 1]) * k, p[i * 3 + 2] + (p[i * 3 + 5] - p[i * 3 + 2]) * k];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const D2R = Math.PI / 180;

// ---- step 1: the stacks ---------------------------------------------------------------------------------------------
/** the height a stack waits at over its block (its bottom sheet), clear above the robots' heads (-266) */
export const HOVER_Y = -500;
export const NEAR_HOVER_Y = -440;
export const DEAL = 5;
/** the near block deals slower (it is the one we see close up) */
export const DEAL_NEAR = 9;
export type Stack = {
  ti: number;
  tj: number;
  /** its block in the hall */
  bi: number;
  bj: number;
  depart: number;
  arrive: number;
  dur: number;
  path: Float32Array;
  ph: number;
  /** the frame each of its sheets leaves (sorted: the top sheet first) */
  deals: Float32Array;
};
/** the frame stack (i, j) leaves: the top (far) row first (f29), the bottom row last (~f33.5), the middle a little
 *  before the outer ones */
const departOfStack = (ti: number, tj: number) => 28 + (3.5 * (TILES - 1 - tj)) / (TILES - 1) + 0.5 * (Math.abs(ti - 4.5) / 4.5) + hash(ti * 31 + tj * 7 + 5) * 0.5;
/** where a sheet rests on its desk (its centre; flat, the long side along Z), left of the keyboard */
export const restOn = (X: number, Z: number): V3 => [X - 34, -DESK.h - 1.2, Z + 46];
export type Desk = {
  c: number;
  r: number;
  X: number;
  Z: number;
  /** its stack (= tile index ti * TILES + tj) and its order in that stack's deal (0 = the top sheet) */
  k: number;
  order: number;
  depart: number;
  land: number;
  dur: number;
  /** 0..4 (the one in the middle front is v0, THE bot) */
  variant: number;
  path: Float32Array;
  ph: number;
};
export const STACKS: Stack[] = [];
export const DESKS: Desk[] = [];
(() => {
  for (let ti = 0; ti < TILES; ti++)
    for (let tj = 0; tj < TILES; tj++) {
      const bi = ti;
      const bj = TILES - 1 - tj;
      const P0 = slabPt(tileU0(ti) + PIECE.w / 2, tileV0(tj) + PIECE.l / 2, STACK_T / 2, 0);
      // the near blocks' stacks come down close in front of us, over the second row near the middle aisle (where we
      // watch them deal, below the banner); the others wait over their block's third row
      const H: V3 = bj === 0 ? [colX(bi * 10 + 4.5) * 0.35, NEAR_HOVER_Y - STACK_T / 2, rowZ(1) + 40] : [colX(bi * 10 + 4.5), HOVER_Y - STACK_T / 2, rowZ(bj * 10 + 3) + 40];
      const dist = Math.hypot(H[0] - P0[0], H[2] - P0[2]);
      const q = Math.sqrt(dist / 28000);
      const dur = 7 + 13 * q;
      const depart = departOfStack(ti, tj);
      // a hop off the face along its normal, then up and away over the hall in one arc (higher the farther it goes),
      // fanning out sideways late, and down onto its spot
      const cruise = mix(-640, -940, q) - 50 * hash(ti * 13 + tj * 101);
      const lift = 110;
      const path = sampledPath((v) => {
        const hop = lift * Math.sin(Math.PI * 0.5 * Math.min(1, v / 0.12)) * (1 - sst(0.12, 0.45, v));
        const ez = Math.pow(v, 1.12);
        const ex = Math.pow(v, 1.5);
        const base = mix(P0[1], H[1], Math.pow(v, 2.2));
        const peak = Math.min(P0[1], H[1]) - cruise;
        const arc = -peak * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.75)), 1.1) * (v < 0.5 ? 1 : 1);
        return [mix(P0[0], H[0], ex) + SN[0] * hop, base + arc * 0.9 + SN[1] * hop, mix(P0[2], H[2], ez) + SN[2] * hop];
      }, PATH_N);
      STACKS.push({ ti, tj, bi, bj, depart, arrive: depart + dur, dur, path, ph: hash(ti * 7 + tj * 59) * 6.283, deals: new Float32Array(LAYERS) });
    }
  // the desks, and each one's sheet: dealt off the top of its block's stack, the near rows first
  const byStack: Desk[][] = STACKS.map(() => []);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const k = Math.floor(c / 10) * TILES + (TILES - 1 - Math.floor(r / 10));
      const d: Desk = { c, r, X: colX(c), Z: rowZ(r), k, order: 0, depart: 0, land: 0, dur: 0, variant: c === 49 && r === 0 ? 0 : 1 + Math.floor(hash(c * 977 + r * 31) * 4), path: new Float32Array(0), ph: hash(c * 17 + r * 1013) * 6.283 };
      DESKS.push(d);
      byStack[k].push(d);
    }
  byStack.forEach((a, k) => {
    const S = STACKS[k];
    a.sort((p, q) => p.r + hash(p.c * 3 + p.r * 11) * 1.6 - (q.r + hash(q.c * 3 + q.r * 11) * 1.6));
    a.forEach((d, m) => {
      d.order = m;
      d.depart = S.arrive + 0.6 + ((S.bj === 0 ? DEAL_NEAR : DEAL) * m) / LAYERS;
      S.deals[m] = d.depart;
      const top = stackCentre(S, d.depart);
      const P0: V3 = [top[0], top[1] - STACK_T / 2 + (m + 0.5) * SLAB.lt, top[2]];
      const T = restOn(d.X, d.Z);
      const dist = Math.hypot(T[0] - P0[0], T[2] - P0[2]);
      d.dur = 3.4 + 2.8 * Math.min(1, dist / 1900);
      d.land = d.depart + d.dur;
      // up off the stack, an arc out to above its desk, a last flat drop onto it
      const up = 24 + 18 * hash(d.c + d.r * 7);
      d.path = sampledPath((v) => {
        const e = easeIO(Math.min(1, v / 0.88));
        const y = mix(P0[1], T[1], Math.pow(v, 1.8)) - (up + 0.03 * dist) * Math.sin(Math.PI * Math.min(1, v / 0.9));
        return [mix(P0[0], T[0], e), y, mix(P0[2], T[2], e)];
      }, PATH_N);
    });
  });
})();
/** a stack's centre at frame f (its whole 100 sheets; it waits at its spot while it deals) */
function stackCentre(S: Stack, f: number): V3 {
  const t = (f - S.depart) / S.dur;
  if (t <= 0) {
    const p = slabPt(tileU0(S.ti) + PIECE.w / 2, tileV0(S.tj) + PIECE.l / 2, STACK_T / 2, f);
    return p;
  }
  const s = t >= 1 ? 1 : t < 0.5 ? 0.5 * Math.pow(2 * t, 1.6) : 1 - 0.5 * Math.pow(2 * (1 - t), 2.2);
  const C = along(S.path, s);
  C[1] += slabBob(f) * (1 - sst(0, 0.3, s));
  if (t >= 1) C[1] += 4 * Math.sin((2 * Math.PI * (f - S.arrive)) / 30 + S.ph) * sst(0, 3, f - S.arrive);
  return C;
}
export const LAST_LAND = DESKS.reduce((m, d) => Math.max(m, d.land), 0);
export const FIRST_LAND = DESKS.reduce((m, d) => Math.min(m, d.land), 1e9);
export const FIRST_DEPART = STACKS.reduce((m, d) => Math.min(m, d.depart), 1e9);
/** how many sheets stack k has dealt by frame f */
export const dealtAt = (k: number, f: number) => {
  const a = STACKS[k].deals;
  let n = 0;
  while (n < LAYERS && a[n] <= f) n++;
  return n;
};
/** a box pose: centre, the across axis a, the along axis b (both in the sheet's plane), the normal n (out of the
 *  inked top sheet), the thickness; inSlab while it is still part of the slab */
export type BoxPose = { C: V3; a: V3; b: V3; n: V3; thick: number; inSlab: boolean };
/** the face's tilt turned to lying flat: the along axis b from the face's V to +Z, by the turn u (0..1) */
const turnAxes = (u: number, flutter: number, roll: number, yaw: number) => {
  const th = ((90 - SLAB.tilt) * (1 - easeIO(u)) + flutter) * D2R;
  const b0: V3 = [0, -Math.sin(th), Math.cos(th)];
  const a0: V3 = [1, 0, 0];
  const n0 = cross(a0, b0);
  const ro = roll * D2R;
  const a1: V3 = [a0[0] * Math.cos(ro) + n0[0] * Math.sin(ro), a0[1] * Math.cos(ro) + n0[1] * Math.sin(ro), a0[2] * Math.cos(ro) + n0[2] * Math.sin(ro)];
  const cy = Math.cos(yaw * D2R);
  const sy = Math.sin(yaw * D2R);
  const yw = (v: V3): V3 => [v[0] * cy + v[2] * sy, v[1], -v[0] * sy + v[2] * cy];
  const a = yw(a1);
  const b = yw(b0);
  // the normal out of the inked face: toward us on the slab (SN), up when it lies flat
  const n = cross(a, b);
  return { a, b, n };
};
/** stack k at frame f: null once it has dealt its last sheet */
export const stackPose = (k: number, f: number): BoxPose | null => {
  const S = STACKS[k];
  const left = LAYERS - dealtAt(k, f);
  if (left <= 0) return null;
  const C = stackCentre(S, f);
  const t = c01((f - S.depart) / S.dur);
  const settle = Math.sin(Math.PI * t);
  const ax = turnAxes(t / 0.85, 10 * Math.sin(2 * Math.PI * 1.1 * t + S.ph) * settle, 9 * Math.sin(2 * Math.PI * 0.9 * t + S.ph + 1) * settle, 14 * settle * Math.sin(S.ph));
  const thick = left * SLAB.lt;
  // it deals off the top: its bottom stays put
  const off = (STACK_T - thick) / 2;
  const Cn: V3 = [C[0] - ax.n[0] * off, C[1] - ax.n[1] * off, C[2] - ax.n[2] * off];
  return { C: Cn, ...ax, thick, inSlab: f <= S.depart };
};
/** a sheet's pose at frame f: null before it leaves its stack and after it lands (it rests on the desk) */
export type PiecePose = { C: V3; a: V3; b: V3 };
export const piecePose = (d: Desk, f: number): PiecePose | null => {
  const t = (f - d.depart) / d.dur;
  if (t <= 0 || t >= 1) return null;
  const s = t < 0.5 ? 0.5 * Math.pow(2 * t, 1.3) : 1 - 0.5 * Math.pow(2 * (1 - t), 2.2);
  const C = along(d.path, s);
  const settle = Math.pow(1 - s, 1.4) * sst(0, 0.15, s);
  const ax = turnAxes(1, 18 * Math.sin(2 * Math.PI * 1.2 * s + d.ph) * settle, 22 * Math.sin(2 * Math.PI * 1.0 * s + d.ph + 0.8) * settle, 24 * Math.sin(Math.PI * s) * Math.sin(d.ph));
  return { C, a: ax.a, b: ax.b };
};
/** the robot's switch-on (0 = off, its head bowed and its screen dark; 1 = on) */
export const bootAt = (d: Desk, f: number) => c01((f - d.land) / BOOT);

/** the plate "10,000": a banner hung low over the hall between rows 9 and 10 (its face square to us), its hem
 *  clear above the robots' heads, unrolling down after the near sheets have passed below it */
export const BANNER = { X: 0, Z: 2900, top: -800, w: 2200, h: 430, f0: 45, dur: 8 } as const;
