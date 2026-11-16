// ---------------------------------------------------------------------------
// tenThousandAgentsPlan: the pure geometry of TenThousandAgents (rsi-since-writing, revision 3: THE THINKING HANDED
// OUT): the hall, the slab of work and its 10,000 sheets, the robots' switch-on times and the
// camera. No React, so a sheet script can import it. Units: the cast's (U = 178 per metre; the robot 240 = 1.35 m,
// soles to head top); X across, Y height (floor 0, up is -Y), Z depth (toward the camera is -Z).
//
// THE HALL: 100 columns x 100 rows of low desks (DESK 170 x 110, top at Y -80), CX = 220 apart across (1.24 m) and
//   RZ = 300 apart in depth (1.7 m): row r's desk front at Z = r * RZ, its robot standing behind it at Z + ROBOT_BACK
//   (the desk hides it below the waist; its mittens on the keyboard at the desk's back edge). Column c at
//   X = (c - 49.5) * CX (the middle aisle at X 0).
// THE SLAB: one b// THE SLAB: one big piece of thinking hovering between us and the hall, in front of the first row: 10 x 10 tiles of
//   cream sheets (PIECE 58 x 74; STACK_T thick), its face (the top sheets, inked) tilted back SLAB.tilt from the
//   vertical, the face's near (bottom) edge at (Y SLAB.ybot, Z SLAB.z).
// THE HANDING OUT (slabPoseAt, piecePose): the slab lays itself back part of the way to flat (TIP) and sinks to
//   GLIDE_Y while it glides away over the rows on a solved profile (its height on screen falls evenly, <= 11.8 % a
//   frame, until it is behind the plate), thinning as it deals. Each desk's sheet peels off the slab's underside as
//   the slab passes over its row and flies ONE arc to its desk (out sideways at its own cruise height just over the
//   heads, turning flat, a last drop straight down onto its desk), on a smootherstep in time, warped so the time is
//   spent where the sheet is on screen; it lands flat beside the keyboard and the robot there switches on (bootUp over
//   BOOT 16 frames). A sheet whose desk is never in the picture (kind 1/2) mostly starts outside the frame edge; one in
//   five flies out of the frame from the slab.
// THE BANNER (bannerAt): a "10,000" plate on two wires at Z 2900, lowering on an ease-out with a small decaying swing.
// THE CAMERA: one pinhole (focal F, no pitch) at (cx, -h, -d) looking down +Z; the front desks' foot line at screen
//   y = ty (a lens shift). ONE crane up and push in following the slab (log d, h on bell speed profiles: one
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
const CAM_F1 = 92;
/** the opening: tight on the slab's writing (the paper fills the frame), one continuous pull-back and slight
 *  crane up that eases out by ~f36 into the crane (an offset on the crane, decaying from f0) */
const OPEN = { d: 520, h: 470, hy: 1000, T: 35, k: 1.35 };
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
  // a slow creep in (and a touch of drift right) through the hold, so it never freezes
  const creep = (f - 56) / 60;
  const dB = Math.exp(mix(Math.log(CAM_KEYS.d[0]), Math.log(CAM_KEYS.d[1]), pD(f))) * (1 - 0.03 * Math.max(0, creep));
  const hB = Math.exp(mix(Math.log(CAM_KEYS.h[0]), Math.log(CAM_KEYS.h[1]), pH(f)));
  const ty = mix(CAM_KEYS.ty[0], CAM_KEYS.ty[1], pT(f));
  const hyB = ty - (hB * F) / dB;
  // the opening offset: full at f0 (tight on the writing), gone by OPEN.T, fastest at the start (ease out)
  const w = Math.pow(1 - c01(f / OPEN.T), OPEN.k);
  const hy0 = CAM_KEYS.ty[0] - (CAM_KEYS.h[0] * F) / CAM_KEYS.d[0];
  const d = dB * Math.exp(Math.log(OPEN.d / CAM_KEYS.d[0]) * w);
  const h = hB * Math.exp(Math.log(OPEN.h / CAM_KEYS.h[0]) * w);
  return { cx: 70 * Math.max(0, creep) * Math.max(0, creep), h, d, ty, hy: hyB + (OPEN.hy - hy0) * w };
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
/** the cracks: the grid lines draw out from the middle of the face over f24.5..f27.5 (before the slab tips flat) */
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

// ---- the handing out: the slab glides out over the hall, dealing its sheets ---------------------------------------
/** the height the slab glides at (its centre), clear above the robots' heads (-266) and below the eye (h >= 520) */
export const GLIDE_Y = -440;
/** the sheets' cruise height on their way out sideways (just over the heads) */
const CRUISE_Y = -320;
/** where a sheet rests on its desk (its centre; flat, the long side along Z), left of the keyboard */
export const restOn = (X: number, Z: number): V3 => [X - 34, -DESK.h - 1.2, Z + 46];
export type Desk = {
  c: number;
  r: number;
  X: number;
  Z: number;
  /** the ink pattern its sheet carries (one of the slab's tiles) */
  k: number;
  depart: number;
  land: number;
  dur: number;
  /** 0..4 (the one in the middle front is v0, THE bot) */
  variant: number;
  path: Float32Array;
  warp: Float32Array;
  /** how its flight is seen: 0 its desk is in the picture (it flies from the slab, all of it on screen); 1 its desk is
   *  never in the picture, one in five of those: it flies from the slab and leaves the frame low and quickly; 2 the
   *  other four in five: it starts already outside the frame edge (never on screen) */
  kind: 0 | 1 | 2;
  /** the slab's turn (tipAt) when it leaves: it starts tilted like the slab and turns flat on the way */
  u0: number;
  ph: number;
};
/** the face's tilt turned toward lying flat: the along axis b from the face's V to +Z, by the turn u (0 = the slab's
 *  hover tilt, 1 = flat) */
const turnAxes = (u: number, flutter: number, roll: number, yaw: number) => {
  const th = ((90 - SLAB.tilt) * (1 - u) + flutter) * D2R;
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
/** the slab's tip (TIP) and glide (GLIDE). On "split" it lays itself back from SLAB.tilt toward flat, TIP.end of the
 *  way (it stays a little raised toward us, so it reads as a sheet laying itself down, never an edge-on bar), sinking to
 *  GLIDE_Y, over TIP.f0..f1, and glides away over the rows. The glide is SOLVED so that the slab's height on screen
 *  shrinks evenly: its log height falls at GLIDE.rate a frame (eased in over 3 frames from GLIDE.f0; 1 - e^-0.125 =
 *  11.8 % a frame at most, the tip and the camera included), until it is behind the plate (GLIDE.h0..h1), where it
 *  speeds up (rate2 more) to finish the far rows out of sight. */
const SLAB_C0 = slabPt(0, FACE_H / 2, STACK_T / 2, 0);
export const TIP = { f0: 26.5, f1: 38.5, end: 0.55 };
export const tipAt = (f: number) => TIP.end * sst(TIP.f0, TIP.f1, f);
export const GLIDE = { f0: 26.5, rate: 0.125, h0: 49, h1: 52, rate2: 0.25, z1: rowZ(ROWS - 1) + 46 };
const slabYAt = (f: number) => {
  const g = sst(TIP.f0, TIP.f1, f);
  return mix(SLAB_C0[1] + slabBob(f), GLIDE_Y, g) + 6 * Math.sin((2 * Math.PI * f) / 26) * g;
};
/** the slab's height on screen (its 8 corners, at full thickness) at frame f if its centre were at depth Z */
const slabHeightPx = (f: number, Z: number) => {
  const c = cam3At(f);
  const ax = turnAxes(tipAt(f), 0, 0, 0);
  const Y = slabYAt(f);
  let y0 = 1e9;
  let y1 = -1e9;
  for (const sg of [-1, 1])
    for (const u of [-1, 1])
      for (const v of [-1, 1]) {
        const q = (i: number) => (i === 1 ? Y : i === 2 ? Z : 0) + ax.n[i] * sg * STACK_T * 0.5 + ax.a[i] * u * FACE_W * 0.5 + ax.b[i] * v * FACE_H * 0.5;
        const y = c.hy + (q(1) + c.h) * (F / Math.max(1, q(2) + c.d));
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  return y1 - y0;
};
const GSTEP = 0.05;
const GLIDE_TAB = (() => {
  const n = Math.ceil(100 / GSTEP) + 1;
  const tab = new Float64Array(n);
  let Z = SLAB_C0[2];
  let lg = Math.log(slabHeightPx(GLIDE.f0, Z));
  for (let i = 0; i < n; i++) {
    const f = i * GSTEP;
    if (f > GLIDE.f0 && Z < GLIDE.z1 + 600) {
      lg -= (GLIDE.rate * sst(GLIDE.f0, GLIDE.f0 + 3, f) + GLIDE.rate2 * sst(GLIDE.h0, GLIDE.h1, f)) * GSTEP;
      // the depth that gives the target height (never back toward us: if the tip alone shrinks it enough, it waits)
      if (slabHeightPx(f, Z) > Math.exp(lg)) {
        let lo = Z;
        let hi = GLIDE.z1 + 600;
        for (let k = 0; k < 40; k++) {
          const mid = (lo + hi) / 2;
          if (slabHeightPx(f, mid) > Math.exp(lg)) lo = mid;
          else hi = mid;
        }
        Z = hi;
      }
    }
    tab[i] = Math.min(GLIDE.z1 + 600, Z);
  }
  return tab;
})();
export const slabZAt = (f: number) => {
  const x = Math.max(0, f) / GSTEP;
  const i = Math.min(GLIDE_TAB.length - 2, Math.floor(x));
  return GLIDE_TAB[i] + (GLIDE_TAB[i + 1] - GLIDE_TAB[i]) * (x - i);
};
/** the frame the slab's middle passes over Z (the inverse of slabZAt) */
const slabOverZ = (Z: number) => {
  let i = 0;
  while (i < GLIDE_TAB.length - 2 && GLIDE_TAB[i + 1] < Z) i++;
  return (i + c01((Z - GLIDE_TAB[i]) / Math.max(1e-9, GLIDE_TAB[i + 1] - GLIDE_TAB[i]))) * GSTEP;
};
/** how many rows the slab has dealt by frame f (continuous, 0..100) */
const rowsDealt = (f: number) => {
  if (f <= TIP.f0) return 0;
  const Z = slabZAt(f);
  return c01((Z - 46) / (GLIDE.z1 - 46) + 0.01) * ROWS;
};
/** a box pose: centre, the across axis a, the along axis b (both in the sheet's plane), the normal n (out of the
 *  inked top sheet), the thickness */
export type BoxPose = { C: V3; a: V3; b: V3; n: V3; thick: number };
/** the whole slab at frame f: hovering tilted (its writing toward us) until "split", then it turns flat and sinks to
 *  GLIDE_Y while it glides away over the rows, thinning as it deals (null once it has dealt its last sheet) */
export function slabPoseAt(f: number): BoxPose & { left: number } {
  const ax = turnAxes(tipAt(f), 0, 0, 0);
  const Y = slabYAt(f);
  const left = 1 - rowsDealt(f) / ROWS;
  const thick = STACK_T * left;
  // it thins from the top: its underside stays where it was
  const off = (STACK_T - thick) / 2;
  const C: V3 = [-ax.n[0] * off, Y - ax.n[1] * off, slabZAt(f) - ax.n[2] * off];
  return { C, ...ax, thick, left };
}
/** a sheet's pose at frame f: null before it leaves the slab and after it lands (it rests on the desk) */
export type PiecePose = { C: V3; a: V3; b: V3; t: number; alpha: number };
export const piecePose = (d: Desk, f: number): PiecePose | null => {
  const t = (f - d.depart) / d.dur;
  if (t <= 0 || t >= 1) return null;
  // it peels off from rest under the slab, flies its arc and comes to rest on the desk with no speed left (s'(0) = 0,
  // s' and s'' -> 0 at landing, so the last frame in the air is within a pixel or two of the landed sheet)
  const u = t * t * t * (10 - 15 * t + 6 * t * t);
  // time is spent where the sheet is on screen: it drifts across the picture and hurries only once it is out of it
  // (a near sheet bound for a far column), so nothing on screen moves more than a sheet or two a frame
  let i = 0;
  while (i < PATH_N - 2 && d.warp[i + 1] < u) i++;
  const s = (i + c01((u - d.warp[i]) / Math.max(1e-9, d.warp[i + 1] - d.warp[i]))) / (PATH_N - 1);
  const C = along(d.path, s);
  const settle = Math.pow(1 - s, 1.2);
  const ax = turnAxes(mix(d.u0, 1, easeIO(c01(s / 0.5))), 20 * Math.sin(2 * Math.PI * 1.3 * s + d.ph) * settle, 24 * Math.sin(2 * Math.PI * 1.0 * s + d.ph + 0.8) * settle, 30 * Math.sin(Math.PI * s) * Math.sin(d.ph));
  // it fades in over its first three and a half frames, while it is still under (or just behind) the moving slab
  return { C, a: ax.a, b: ax.b, t, alpha: sst(0, 3.5, f - d.depart) };
};
export const DESKS: Desk[] = [];
/** is the point P (a resting sheet) in the picture on any frame from f on (with a margin for the sheet's size)? */
const seenFrom = (P: V3, f: number) => {
  for (let ff = Math.max(0, Math.floor(f)); ff < DURATION; ff++) {
    const c = cam3At(ff);
    const k = F / Math.max(1, P[2] + c.d);
    const x = 540 + (P[0] - c.cx) * k;
    const y = c.hy + (P[1] + c.h) * k;
    if (x > -90 && x < 1170 && y > -90 && y < 2010) return true;
  }
  return false;
};
(() => {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const X = colX(c);
      const Z = rowZ(r);
      const T = restOn(X, Z);
      const depart = Math.max(TIP.f0 + 4 + 0.6 * hash(c * 17 + r * 5), slabOverZ(T[2]) - 0.4 + 0.8 * hash(c * 131 + r * 7 + 3));
      const kind: 0 | 1 | 2 = seenFrom(T, depart + 8) ? 0 : hash(c * 53 + r * 19 + 7) < 0.2 ? 1 : 2;
      const d: Desk = { c, r, X, Z, k: Math.floor(hash(c * 29 + r * 61) * TILES * TILES), depart, land: 0, dur: 0, variant: c === 49 && r === 0 ? 0 : 1 + Math.floor(hash(c * 977 + r * 31) * 4), path: new Float32Array(0), warp: new Float32Array(0), ph: hash(c * 17 + r * 1013) * 6.283, kind, u0: kind === 2 ? 1 : tipAt(depart) };
      // it slips off the slab's underside (its lower part, near the side of its column) and flutters outward and down in
      // one arc to its desk: out sideways just over the heads, a last drop straight down onto its desk. A sheet whose
      // desk is never in the picture starts outside the frame edge, level with its desk, already flat (kind 2)
      const sp = slabPoseAt(depart);
      // (across its own side of the slab, scattered, so the sheets leave one by one rather than in a clump at a corner)
      const u = Math.max(-FACE_W / 2 + 34, Math.min(FACE_W / 2 - 34, X * 0.12 + (X < 0 ? -1 : 1) * hash(c * 11 + r * 23) * (FACE_W / 2 - 34) * 0.85));
      const v = (hash(c * 7 + r * 3) * 0.45 - 0.92) * FACE_H * 0.5;
      const side = X < 0 ? -1 : 1;
      const P0: V3 = kind === 2 ? [T[0] + side * 300, CRUISE_Y + 20, T[2]] : ([0, 1, 2].map((q) => sp.C[q] + sp.a[q] * u + sp.b[q] * v - sp.n[q] * (sp.thick / 2 + 1)) as V3);
      const dx = Math.abs(T[0] - P0[0]);
      // far sheets fly shorter (their way on screen is short), so the far rows' robots are on well before the cut
      d.dur = mix(13, 8, sst(12, 45, r)) + 6 * Math.sqrt(Math.min(1, dx / 11000)) * (1 - 0.5 * sst(12, 45, r)) + 1.5 * hash(c + r * 5);
      const flut = 10 + 8 * hash(c * 3 + r);
      // each at its own height over the heads, so the sheets read one by one; the ones leaving the frame go low
      const cruise = kind === 1 ? CRUISE_Y + 35 : CRUISE_Y + 25 + (hash(c * 41 + r * 13) - 0.5) * 60;
      // it drops from the slab to its cruise height within its first ~300 units across (whatever the distance), so a
      // long flight does not cross the picture at the slab's height
      const Lxz = Math.max(1, Math.hypot(T[0] - P0[0], T[2] - P0[2]));
      const dropBy = Math.min(0.45, 300 / Lxz);
      // and comes down only over its last ~350 units (about its own desk), never down through other robots' heads; the
      // last quarter of the drop is straight down onto its desk
      const landFrom = Math.max(0.7, 1 - 350 / Lxz);
      d.path = sampledPath((w) => {
        const e = 1 - Math.pow(1 - Math.min(1, w / 0.86), 2);
        const yC = mix(P0[1], Math.max(P0[1], cruise), sst(0, dropBy, e));
        const y = mix(yC, T[1], 0.75 * sst(landFrom, 1, e) + 0.25 * sst(0.86, 1, w)) + flut * Math.sin(Math.PI * 3 * w + d.ph) * (1 - w) * sst(0, 0.15, w);
        return [mix(P0[0], T[0], e), y, mix(P0[2], T[2], e)];
      }, PATH_N);
      const cm = cam3At(depart + 8);
      const scr = (m: number) => {
        const k = F / Math.max(1, d.path[m * 3 + 2] + cm.d);
        return [540 + (d.path[m * 3] - cm.cx) * k, cm.hy + (d.path[m * 3 + 1] + cm.h) * k];
      };
      d.warp = new Float32Array(PATH_N);
      for (let m = 1; m < PATH_N; m++) {
        const a = scr(m - 1);
        const b = scr(m);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        const on = mx > -80 && mx < 1160 && my > -80 && my < 2000;
        d.warp[m] = d.warp[m - 1] + (on ? len : 0.03 * len) + 0.05;
      }
      // a long way across the picture gets a longer flight (peak screen speed about 1.9 x the mean: <= ~45 px a frame
      // for a sheet that lands in the picture; one that leaves it goes quicker, <= ~100 px a frame)
      const onPx = d.warp[PATH_N - 1] - 0.05 * (PATH_N - 1);
      // (every sheet is down by f69, so every robot is fully on, BOOT frames later, before the cut)
      if (kind === 0) d.dur = Math.min(Math.max(d.dur, Math.min(24, (onPx * 1.9) / 45)), Math.max(8, 69 - depart));
      else if (kind === 1) d.dur = Math.max(9 + 2 * hash(c * 5 + r), Math.min(16, (onPx * 1.9) / 100));
      d.land = depart + d.dur;
      for (let m = 1; m < PATH_N; m++) d.warp[m] /= d.warp[PATH_N - 1];
      DESKS.push(d);
    }
})();
export const LAST_LAND = DESKS.reduce((m, d) => Math.max(m, d.land), 0);
export const FIRST_LAND = DESKS.reduce((m, d) => Math.min(m, d.land), 1e9);
export const FIRST_DEPART = DESKS.reduce((m, d) => Math.min(m, d.depart), 1e9);
/** the robot's switch-on (0 = off, its head bowed and its screen dark; 1 = on) */
export const bootAt = (d: Desk, f: number) => c01((f - d.land) / BOOT);

/** the plate "10,000": a cloth banner hung low over the hall between rows 9 and 10 (its face square to us), its hem
 *  clear above the robots' heads. It lowers whole on its two wires from DROP higher (fading in over its first frames,
 *  an ease out over dur), then swings a little to rest about the middle of its rod */
export const BANNER = { X: 0, Z: 2900, top: -800, w: 2200, h: 430, f0: 43, dur: 10, drop: 520, swing: 2.6 } as const;
export const bannerAt = (f: number) => {
  const t = c01((f - BANNER.f0) / BANNER.dur);
  const e = 1 - Math.pow(1 - t, 3);
  const top = BANNER.top - BANNER.drop * (1 - e);
  const since = f - (BANNER.f0 + BANNER.dur * 0.7);
  const ang = since > 0 ? BANNER.swing * Math.exp(-since / 9) * Math.sin((2 * Math.PI * since) / 16) : 0;
  return { on: f > BANNER.f0, alpha: sst(BANNER.f0, BANNER.f0 + 3.5, f), top, ang };
};

/** the writing on the slab: how much of tile k's lines are written by frame f (0..1). Every tile is being written at
 *  once (many hands): part-written at f0, its lines drawing on until it is full between f20 and f26 */
export const inkProgress = (k: number, f: number) => {
  const p0 = 0.22 + 0.3 * hash(k * 53 + 11);
  const fe = 20 + 6 * hash(k * 71 + 5);
  return Math.min(1, p0 + ((1 - p0) * Math.max(0, f)) / fe);
};
