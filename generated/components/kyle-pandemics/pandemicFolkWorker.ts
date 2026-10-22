// ---------------------------------------------------------------------------
// pandemicFolkWorker — the WORKER of the drawn cast (kyle-pandemics V3, take 2, style A) as a 2.5D picture-book rig.
// The approved style-frame drawings (pandemicFolkSketch workerFront / Profile / Back) re-built as simple volumes so he
// can TURN without flips or swaps: every body part is a LATHE (stacked elliptical sections: half-width a, half-depth b,
// forward offset c per height) whose outline at a yaw is exact; clothes and markings are BANDS on a lathe (a range of
// azimuths per height: the apron, the bib, the waistcoat's opening, the hair, a pocket), CURVES on its surface (the
// apron straps) or FEATURES at a surface point (eyes, ears, nose, blush, mouth, the bow), so they slide round the body
// and slip behind the silhouette as he turns. Limbs are tapered tubes between projected joints. Where one part crosses
// another (an arm passing behind the body, an ear coming round in front of the head, the near leg over the far leg) the
// part is drawn behind AND again in front with an opacity that follows depth over a short range (a crossfade of the
// overlap, never a layer pop).
//
// UNITS: figure units (the Worker ~512 from the soles to the top of his cap), feet at (0, 0), y DOWN (up is -y),
// body-local x = HIS LEFT (screen right when he faces us), z = his forward. yaw (deg): 0 faces us, 90 = profile facing
// screen right, 180 = his back. Screen: X = x cos yaw + z sin yaw, depth D = -x sin yaw + z cos yaw (+ toward us).
//
// buildWorker(pose, opts) -> { shapes (pandemicFolkPaint Shape[], figure units), anchors (figure units) }
// ---------------------------------------------------------------------------
import { mixC, type Shape } from "./pandemicFolkPaint";

type V3 = [number, number, number];
type P = [number, number];
const D2R = Math.PI / 180;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const sstep = (a: number, b: number, v: number) => {
  const u = clamp((v - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const n2 = (v: number) => (Math.round(v * 100) / 100).toString();

// ===================================================================================================================
// POSE
// ===================================================================================================================
export type ArmPose = {
  /** upper arm: abduction (out to the side) and flexion (raised forward), deg */
  abd: number;
  flex: number;
  /** forearm: abduction (- = inward) and flexion, deg */
  abd2: number;
  flex2: number;
  /** the hand drooping from the forearm, deg */
  droop: number;
  /** 0 = thumb forward (hanging), 1 = thumb inward (palm down, the reach) */
  thumb: number;
};
export type WorkerPose = {
  /** body yaw, deg (0 front, 90 profile facing screen right, 180 back) */
  yaw: number;
  /** head yaw relative to the body, deg (the head leads a turn) */
  headYaw: number;
  /** head bow forward (deg, + down) and side tilt (deg, + toward his left shoulder) */
  headPitch: number;
  headRoll: number;
  /** upper body lean forward (deg) and side roll about the hip (deg; + drops his left shoulder) */
  bodyPitch: number;
  bodyRoll: number;
  /** shoulders dropped (units, + down) */
  slump: number;
  /** breath 0..1 (chest a touch fuller, shoulders up) */
  breath: number;
  armR: ArmPose;
  armL: ArmPose;
  /** eyes: 0 = dot eyes, 1 = the glance (white almond, dot pupil); look -1..1 the pupils sideways (screen); orange
   *  0..1 the eyes turn the disease's orange (blank, no pupil) */
  glance: number;
  look: number;
  orange: number;
  /** a small dark oval mouth 0..1 */
  mouth: number;
  /** brows (units up for worry; 0 = none) */
  brows: number;
  /** heavy lids 0..1 (the tired, sick face: the top of each eye dot covered by a skin lid) */
  lids?: number;
  /** fungal threads (cut 74): polylines of [azimuth deg, height y] on the head or neck surface, drawn by their tips
   *  (t 0..1), in the disease's orange, with a couple of short forks; they turn with him and slip behind the outline */
  threads?: Thread[];
};
export type Thread = { on: "head" | "neck"; pts: [number, number][]; t: number; w?: number; seed?: number };
const ARM_STAND = (): ArmPose => ({ abd: 16, flex: 9, abd2: -11, flex2: 13, droop: 4, thumb: 0 });
export const STAND: WorkerPose = {
  yaw: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 4.5,
  bodyPitch: 0,
  bodyRoll: -1.6,
  slump: 0,
  breath: 0,
  armR: ARM_STAND(),
  armL: ARM_STAND(),
  glance: 0,
  look: 0,
  orange: 0,
  mouth: 0,
  brows: 0,
};
const mixArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  abd: lerp(a.abd, b.abd, t),
  flex: lerp(a.flex, b.flex, t),
  abd2: lerp(a.abd2, b.abd2, t),
  flex2: lerp(a.flex2, b.flex2, t),
  droop: lerp(a.droop, b.droop, t),
  thumb: lerp(a.thumb, b.thumb, t),
});
export const mixPose = (a: WorkerPose, b: WorkerPose, t: number): WorkerPose => {
  const o = { ...a } as WorkerPose;
  for (const k of Object.keys(a) as (keyof WorkerPose)[]) {
    if (k === "armR" || k === "armL") continue;
    (o[k] as number) = lerp(a[k] as number, b[k] as number, t);
  }
  o.armR = mixArm(a.armR, b.armR, t);
  o.armL = mixArm(a.armL, b.armL, t);
  return o;
};

// ===================================================================================================================
// GEOMETRY
// ===================================================================================================================
type Row = { y: number; a: number; b: number; c: number };
/** resample key rows (y ascending, i.e. top first) to ~every `step` units with a smooth (Catmull-Rom) blend */
const rows = (keys: [number, number, number, number][], step = 5): Row[] => {
  const K = keys.map(([y, a, b, c]) => ({ y, a, b, c }));
  const out: Row[] = [];
  for (let i = 0; i < K.length - 1; i++) {
    const p0 = K[Math.max(0, i - 1)];
    const p1 = K[i];
    const p2 = K[i + 1];
    const p3 = K[Math.min(K.length - 1, i + 2)];
    const n = Math.max(1, Math.round((p2.y - p1.y) / step));
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const cr = (k: "a" | "b" | "c") => {
        const v = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t);
        return k === "c" ? v : Math.max(0.3, v);
      };
      out.push({ y: lerp(p1.y, p2.y, t), a: cr("a"), b: cr("b"), c: cr("c") });
    }
  }
  const L = K[K.length - 1];
  out.push({ y: L.y, a: Math.max(0.3, L.a), b: Math.max(0.3, L.b), c: L.c });
  return out;
};
const scaleRows = (R: Row[], k: number, fromY = -1e9, toY = 1e9): Row[] => R.map((r) => (r.y >= fromY && r.y <= toY ? { ...r, a: r.a * k, b: r.b * k } : r));
const sampleRow = (R: Row[], y: number): Row => {
  if (y <= R[0].y) return R[0];
  for (let i = 1; i < R.length; i++) {
    if (y <= R[i].y) {
      const t = (y - R[i - 1].y) / (R[i].y - R[i - 1].y);
      return { y, a: lerp(R[i - 1].a, R[i].a, t), b: lerp(R[i - 1].b, R[i].b, t), c: lerp(R[i - 1].c, R[i].c, t) };
    }
  }
  return R[R.length - 1];
};

/** a smooth closed path through points (Catmull-Rom -> cubic Bezier); the handles are clamped to a share of their own
 *  segment so a short edge next to a long one never overshoots into a spike */
export const smoothClosed = (pts: P[], tension = 1): string => {
  const n = pts.length;
  if (n < 3) return "";
  const lim = (vx: number, vy: number, max: number): P => {
    const l = Math.hypot(vx, vy);
    return l > max && l > 0 ? [(vx / l) * max, (vy / l) * max] : [vx, vy];
  };
  let d = `M ${n2(pts[0][0])} ${n2(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const t = tension / 6;
    const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const h1 = lim((p2[0] - p0[0]) * t, (p2[1] - p0[1]) * t, 0.42 * seg);
    const h2 = lim((p3[0] - p1[0]) * t, (p3[1] - p1[1]) * t, 0.42 * seg);
    d += ` C ${n2(p1[0] + h1[0])} ${n2(p1[1] + h1[1])} ${n2(p2[0] - h2[0])} ${n2(p2[1] - h2[1])} ${n2(p2[0])} ${n2(p2[1])}`;
  }
  return `${d} Z`;
};
const polyPath = (pts: P[]) => `M ${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join(" L ")} Z`;
const ellPath = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
  const pts: P[] = [];
  const cr = Math.cos(rot * D2R);
  const sr = Math.sin(rot * D2R);
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return smoothClosed(pts);
};
/** a tapered tube along points with per-point widths, round ends */
export const tube = (pts: P[], ws: number[]): string => {
  const n = pts.length;
  if (n < 2) return "";
  const L: P[] = [];
  const R: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1e-6;
    tx /= l;
    ty /= l;
    const w = ws[i] / 2;
    L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]);
    R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
  }
  // round caps as arcs of points
  const cap = (c: P, from: P, to: P, w: number, dir: P): P[] => {
    const out: P[] = [];
    const a0 = Math.atan2(from[1] - c[1], from[0] - c[0]);
    let a1 = Math.atan2(to[1] - c[1], to[0] - c[0]);
    // sweep through `dir`
    const ad = Math.atan2(dir[1], dir[0]);
    let da = a1 - a0;
    while (da <= -Math.PI) da += 2 * Math.PI;
    while (da > Math.PI) da -= 2 * Math.PI;
    const mid = a0 + da / 2;
    if (Math.cos(mid - ad) < 0) da = da > 0 ? da - 2 * Math.PI : da + 2 * Math.PI;
    a1 = a0 + da;
    for (let k = 1; k < 6; k++) {
      const aa = a0 + (da * k) / 6;
      out.push([c[0] + Math.cos(aa) * w, c[1] + Math.sin(aa) * w]);
    }
    return out;
  };
  const dEnd: P = [pts[n - 1][0] - pts[n - 2][0], pts[n - 1][1] - pts[n - 2][1]];
  const dSt: P = [pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]];
  const ring: P[] = [...L, ...cap(pts[n - 1], L[n - 1], R[n - 1], ws[n - 1] / 2, dEnd), ...R.slice().reverse(), ...cap(pts[0], R[0], L[0], ws[0] / 2, dSt)];
  return smoothClosed(ring, 0.6);
};

// ===================================================================================================================
// THE VIEW (projection) and the lathe helpers
// ===================================================================================================================
type View = { yaw: number; cs: number; sn: number };
const view = (yaw: number): View => ({ yaw, cs: Math.cos(yaw * D2R), sn: Math.sin(yaw * D2R) });
const proj = (v: View, p: V3) => ({ x: p[0] * v.cs + p[2] * v.sn, y: p[1], d: -p[0] * v.sn + p[2] * v.cs });
/** surface point and normal depth on a row at azimuth beta (deg: 0 forward, +90 his left) */
const surf = (r: Row, beta: number, out = 0): { p: V3; nx: number; nz: number } => {
  const s = Math.sin(beta * D2R);
  const c = Math.cos(beta * D2R);
  let nx = s / r.a;
  let nz = c / r.b;
  const nl = Math.hypot(nx, nz) || 1;
  nx /= nl;
  nz /= nl;
  return { p: [r.a * s + nx * out, r.y, r.c + r.b * c + nz * out], nx, nz };
};
const ndepth = (v: View, nx: number, nz: number) => -nx * v.sn + nz * v.cs;

/** the outline of a lathe at a view (x offset added) */
const latheOutline = (v: View, R: Row[]): string => {
  const right: P[] = [];
  const left: P[] = [];
  for (const r of R) {
    const cx = r.c * v.sn;
    const hw = Math.sqrt(r.a * r.a * v.cs * v.cs + r.b * r.b * v.sn * v.sn);
    right.push([cx + hw, r.y]);
    left.push([cx - hw, r.y]);
  }
  return smoothClosed([...right, ...left.reverse()], 0.55);
};
/** a band on a lathe: for each row the azimuth range [lo(y), hi(y)] (deg); returns one path per visible run */
const band = (v: View, R: Row[], y0: number, y1: number, range: (y: number) => [number, number], out = 0.6): string[] => {
  const runsPerRow: { y: number; runs: [number, number][] }[] = [];
  for (const r of R) {
    if (r.y < y0 - 1e-6 || r.y > y1 + 1e-6) continue;
    const [lo, hi] = range(r.y);
    if (hi - lo < 0.2) {
      runsPerRow.push({ y: r.y, runs: [] });
      continue;
    }
    const n = Math.max(4, Math.ceil((hi - lo) / 2.5));
    const runs: [number, number][] = [];
    let cur: number[] | null = null;
    for (let i = 0; i <= n; i++) {
      const be = lo + ((hi - lo) * i) / n;
      const s = surf(r, be, out);
      const vis = ndepth(v, s.nx, s.nz) > 0;
      const X = proj(v, s.p).x;
      if (vis) {
        if (!cur) cur = [X, X];
        cur[0] = Math.min(cur[0], X);
        cur[1] = Math.max(cur[1], X);
      } else if (cur) {
        runs.push([cur[0], cur[1]]);
        cur = null;
      }
    }
    if (cur) runs.push([cur[0], cur[1]]);
    // merge runs that touch across the silhouette
    runs.sort((a, b) => a[0] - b[0]);
    runsPerRow.push({ y: r.y, runs });
  }
  const paths: string[] = [];
  for (let k = 0; k < 2; k++) {
    let seg: { y: number; l: number; r: number }[] = [];
    const flush = () => {
      if (seg.length >= 2) {
        const right: P[] = seg.map((s) => [s.r, s.y]);
        const left: P[] = seg.map((s) => [s.l, s.y] as P).reverse();
        paths.push(smoothClosed([...right, ...left], 0.55));
      }
      seg = [];
    };
    for (const row of runsPerRow) {
      // run k counted from the left when there are 2, else the single run is k = 0
      const r = row.runs.length > k ? row.runs[k] : null;
      if (r && r[1] - r[0] > 0.15) seg.push({ y: row.y, l: r[0], r: r[1] });
      else flush();
    }
    flush();
  }
  return paths;
};

// ===================================================================================================================
// THE WORKER'S VOLUMES (from the approved style frames)
// ===================================================================================================================
const headRows = (): Row[] => {
  const out: Row[] = [];
  for (let y = -494; y <= -388; y += 3) {
    const t = (y + 441) / 53;
    const e = Math.sqrt(Math.max(0.0025, 1 - t * t));
    const jaw = y > -425 ? 1 - 0.1 * ((y + 425) / 37) : 1;
    out.push({ y, a: 51 * e * jaw, b: 51 * e, c: -3 + (y > -425 ? 5 * ((y + 425) / 37) : 0) });
  }
  return out;
};
const HEAD = headRows();
const CAP_DOME: Row[] = (() => {
  const out: Row[] = [];
  for (let y = -514; y <= -450; y += 3) {
    const t = (-450 - y) / 64;
    const e = Math.sqrt(Math.max(0.003, 1 - t * t));
    out.push({ y, a: 56 * e, b: 57 * e, c: -4 - 7 * t * t });
  }
  return out;
})();
const CAP_BRIM: Row[] = [-477, -475, -472, -466, -458, -450, -446, -443].map((y, i, A) => {
  const e = i === 0 || i === A.length - 1 ? 1.8 : i === 1 || i === A.length - 2 ? 0.5 : 0;
  return { y, a: 58.6 - e, b: 59.6 - e, c: -3.5 };
});
const NECK = rows([
  [-408, 15.5, 15, 0],
  [-380, 17, 16, 1],
]);
const COLLAR = rows([
  [-396, 21.5, 20.5, 1],
  [-381, 23, 22, 1.5],
]);
const TORSO_KEYS: [number, number, number, number][] = [
  [-393, 15, 13, 0],
  [-387, 33, 27, 0],
  [-379, 44, 37, -1],
  [-366, 50, 43, -3],
  [-342, 58, 46, -2],
  [-312, 69, 47, 0],
  [-290, 76, 48, 2],
  [-262, 81, 49, 3],
  [-240, 80, 49, 3],
  [-226, 74, 47, 2],
  [-217, 64, 44, 1],
  [-213, 52, 38, 0],
];
const TORSO = rows(TORSO_KEYS, 4);
const VEST = rows(
  [
    [-393.5, 16.5, 14.5, 0],
    [-387, 34.5, 28.5, 0],
    [-379, 45.5, 38.5, -1],
    [-366, 51.5, 44.5, -3],
    [-342, 59.5, 47.5, -2],
    [-312, 70.5, 48.5, 0],
    [-290, 77.5, 49.5, 2],
    [-262, 82.5, 50.5, 3],
    [-240, 81.5, 50.5, 3],
    [-226, 76, 48.5, 2],
    [-217, 67, 45.5, 1],
    [-214, 58, 41, 0.5],
  ],
  4,
);
const TIE: Row[] = [-273.5, -272.6, -271, -264, -262.4, -261.5].map((y, i, A) => {
  const e = i === 0 || i === A.length - 1 ? 1.6 : i === 1 || i === A.length - 2 ? 0.4 : 0;
  return { y, a: 82.6 - e, b: 51.2 - e, c: 3.5 };
});
const APRON = rows(
  [
    [-274, 83, 52, 3.5],
    [-250, 84, 54, 4.5],
    [-200, 86, 56.5, 6],
    [-160, 88, 58, 7],
    [-120, 90, 59.5, 8],
    [-106, 90, 59.5, 8],
  ],
  4,
);
const apronRange = (y: number): [number, number] => {
  // the skirt: narrow at the waist where it meets the bib, flaring to wrap round the hips, a rounded hem
  const keys: [number, number][] = [
    [-274, 22],
    [-264, 32],
    [-252, 50],
    [-240, 68],
    [-222, 96],
    [-200, 112],
    [-128, 112],
    [-118, 90],
    [-111, 60],
    [-106, 26],
  ];
  let h = 100;
  for (let i = 1; i < keys.length; i++) {
    if (y <= keys[i][0]) {
      const t = (y - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      h = lerp(keys[i - 1][1], keys[i][1], sstep(0, 1, t));
      break;
    }
  }
  return [-h, h];
};

// ===================================================================================================================
// THE WORKER
// ===================================================================================================================
export type WorkerInks = Record<"skin" | "skinSh" | "blush" | "eye" | "eyeW" | "hair" | "cap" | "capRib" | "shirt" | "vest" | "apron" | "apronTie" | "trousers" | "boots" | "mouth" | "orange", string>;
export const WORKER_INKS: WorkerInks = {
  skin: "#E9C6A4",
  skinSh: "#C89A7C",
  blush: "#D98A80",
  eye: "#2A201A",
  eyeW: "#F7F1E3",
  hair: "#8A6A4E",
  cap: "#8E4D3E",
  capRib: "#7B4034",
  shirt: "#ECE2CC",
  vest: "#5A4434",
  apron: "#BFA67E",
  apronTie: "#A08865",
  trousers: "#4E4640",
  boots: "#33261E",
  mouth: "#3A2620",
  orange: "#FFB000",
};
export type WorkerAnchors = Record<
  | "eyeL"
  | "eyeR"
  | "mouth"
  | "nose"
  | "chin"
  | "headCenter"
  | "crown"
  | "backOfHead"
  | "nape"
  | "trachea"
  | "sternumTop"
  | "sternum"
  | "sternumBottom"
  | "shoulderL"
  | "shoulderR"
  | "chest"
  | "lungsTL"
  | "lungsBR"
  | "lungL"
  | "lungR"
  | "handL"
  | "handR"
  | "feet",
  P
>;
export type BuiltWorker = {
  shapes: Shape[];
  anchors: WorkerAnchors;
  yaw: number;
  /** any point on his head's surface (azimuth deg, height y, out units), figure-local after every rotation, with the
   *  surface normal's depth there (+ = facing us): e.g. the root of a fungus behind his ear */
  headAt: (beta: number, y: number, out?: number) => { pt: P; dn: number };
  /** the head's screen rotation (deg: roll + bow) and the body's (stance), as drawn */
  headRot: number;
  bodyRot: number;
};

/** rotate a screen point about a pivot by deg */
const rotAbout = (p: P, piv: P, deg: number): P => {
  if (!deg) return p;
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const x = p[0] - piv[0];
  const y = p[1] - piv[1];
  return [piv[0] + x * c - y * s, piv[1] + x * s + y * c];
};
/** apply a rotation about a pivot to every coordinate pair of a path (absolute M L C Z) */
const rotPath = (d: string, piv: P, deg: number) => {
  if (!deg) return d;
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const out: string[] = [];
  let pend: number | null = null;
  for (const t of tok) {
    if (/^[MLCZ]$/i.test(t)) {
      out.push(t);
      continue;
    }
    const v = parseFloat(t);
    if (pend === null) pend = v;
    else {
      const q = rotAbout([pend, v], piv, deg);
      out.push(n2(q[0]), n2(q[1]));
      pend = null;
    }
  }
  return out.join(" ");
};
const mirrorPath = (d: string) => {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  let k = 0;
  return tok
    .map((t) => {
      if (/^[MLCZ]$/i.test(t)) {
        k = 0;
        return t;
      }
      const v = parseFloat(t);
      const o = k % 2 === 0 ? -v : v;
      k++;
      return n2(o);
    })
    .join(" ");
};

const armDir = (side: number, abd: number, flex: number): V3 => {
  const sa = Math.sin(abd * D2R);
  const ca = Math.cos(abd * D2R);
  return [side * sa, ca * Math.cos(flex * D2R), ca * Math.sin(flex * D2R)];
};
const add3 = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export type BuildOpts = {
  inks?: Partial<WorkerInks>;
  /** mirror the drawing (a profile facing screen left); the light stays upper left */
  mirror?: boolean;
  /** the see-through block: torso, clothes and arms are tagged `see` */
  seeTag?: boolean;
  /** perspective: camera distance in units (Infinity = orthographic) and the eye height (units, y) */
  dist?: number;
  eyeY?: number;
};

/** a projector for things INSIDE his torso (the cut-32 lungs): body-local [x his left, y down, z forward] (figure units)
 *  -> figure-local screen [x, y] (after the yaw, the breath / slump lift of the chest and the stance's roll about the
 *  hip, exactly as the torso is drawn); `depth` + toward the viewer. Orthographic (the cuts that see inside use no
 *  perspective). */
export const workerBodyProjector = (pose: WorkerPose) => {
  const v = view(pose.yaw);
  const HIPP: P = [0, -232];
  const bodyRot = pose.bodyRoll * v.cs + pose.bodyPitch * v.sn;
  const lift = -pose.breath * 1.5 + pose.slump;
  const liftAt = (y: number) => (y < -300 ? lift * ((-300 - y) / 93) : 0);
  const w = (p: V3): P => {
    const q = proj(v, [p[0], p[1] + liftAt(p[1]), p[2]]);
    return rotAbout([q.x, q.y], HIPP, bodyRot);
  };
  const depth = (p: V3) => proj(v, p).d;
  return { w, depth, cs: v.cs, sn: v.sn };
};

/** a thread's visible runs on a lathe: the polyline densified, cut at the tip (t), split where it goes round the back */
const threadRuns = (th: Thread, R: Row[], vv: View, toScr: (p: V3, vw: View) => P, lift: number, extraDown?: (s: { p: V3; r: Row }) => number): P[][] => {
  const dense: [number, number][] = [];
  for (let i = 0; i < th.pts.length - 1; i++) {
    const [b0, y0] = th.pts[i];
    const [b1, y1] = th.pts[i + 1];
    for (let j = 0; j < 8; j++) dense.push([lerp(b0, b1, j / 8), lerp(y0, y1, j / 8)]);
  }
  dense.push(th.pts[th.pts.length - 1]);
  const nEnd = Math.max(0, Math.min(dense.length - 1, th.t * (dense.length - 1)));
  const runs: P[][] = [];
  let run: P[] = [];
  for (let i = 0; i <= Math.ceil(nEnd); i++) {
    const k = Math.min(i, nEnd);
    const a = dense[Math.floor(k)];
    const b = dense[Math.min(dense.length - 1, Math.floor(k) + 1)];
    const f = k - Math.floor(k);
    const be = lerp(a[0], b[0], f);
    const y = lerp(a[1], b[1], f);
    const r = sampleRow(R, y + lift);
    const sp = surf(r, be, 0.6);
    // a small irregular wander so the thread is hand-drawn, not geometric
    sp.p[1] += 1.2 * Math.sin(i * 1.7 + (th.seed ?? 0));
    if (extraDown) sp.p[1] += extraDown({ p: sp.p, r });
    if (ndepth(vv, sp.nx, sp.nz) > 0.03) run.push(toScr(sp.p, vv));
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
};
const threadShapes = (runs: P[][], col: string, w: number, seed: number, clip?: string): Shape[] => {
  const out: Shape[] = [];
  runs.forEach((r, ri) => {
    if (r.length < 2) return;
    out.push({ d: `M ${r.map((q) => `${n2(q[0])} ${n2(q[1])}`).join(" L ")}`, fill: col, det: w, keep: true, op: 0.95, clip });
    // two short forks off the run (fixed fractions, alternating sides)
    [0.35, 0.68].forEach((fr, k) => {
      const i = Math.floor(fr * (r.length - 1));
      if (i < 1 || i >= r.length - 1) return;
      const a = r[i - 1];
      const b = r[i + 1];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const sd = (k + ri + seed) % 2 ? 1 : -1;
      const ang = 0.7 * sd;
      const ux = (dx / l) * Math.cos(ang) - (dy / l) * Math.sin(ang);
      const uy = (dx / l) * Math.sin(ang) + (dy / l) * Math.cos(ang);
      const L = 7 + 3 * ((seed + k) % 3);
      const p = r[i];
      out.push({ d: `M ${n2(p[0])} ${n2(p[1])} Q ${n2(p[0] + ux * L * 0.6 - uy * 2 * sd)} ${n2(p[1] + uy * L * 0.6 + ux * 2 * sd)} ${n2(p[0] + ux * L)} ${n2(p[1] + uy * L)}`, fill: col, det: w * 0.7, keep: true, op: 0.9, clip });
    });
  });
  return out;
};

export const buildWorker = (pose: WorkerPose, o: BuildOpts = {}): BuiltWorker => {
  const ink: WorkerInks = { ...WORKER_INKS, ...(o.inks ?? {}) };
  const S: Shape[] = [];
  const see = !!o.seeTag;
  const yaw = pose.yaw;
  const v = view(yaw);
  const hv = view(yaw + pose.headYaw);
  const dist = o.dist ?? Infinity;
  const eyeY = o.eyeY ?? -330;
  // perspective about the eye height: a point at depth d is scaled by k about (0, eyeY)
  const persp = (x: number, y: number, d: number): [number, number, number] => {
    if (!isFinite(dist)) return [x, y, 1];
    const k = dist / Math.max(dist * 0.25, dist - d);
    return [x * k, eyeY + (y - eyeY) * k, k];
  };
  const P2 = (p: V3, vv: View = v): P => {
    const q = proj(vv, p);
    const r = persp(q.x, q.y, q.d);
    return [r[0], r[1]];
  };
  const kAt = (p: V3, vv: View = v) => persp(0, 0, proj(vv, p).d)[2];

  // the stance: the body's screen roll / pitch about the hip, the head's about the neck
  const HIP: P = [0, -232];
  const bodyRot = pose.bodyRoll * v.cs + pose.bodyPitch * v.sn;
  const lift = -pose.breath * 1.5 + pose.slump;
  const NECK_P: V3 = [0, -392 + lift, 0];
  // ---- legs (planted; not rotated) -------------------------------------------------------------------------------
  const legPts = (side: number) => {
    const weight = side > 0; // his left leg carries the weight
    const hip: V3 = [side * 30, -232, 2];
    const knee: V3 = weight ? [side * 32, -128, 2] : [side * 40, -128, 7];
    const ankle: V3 = weight ? [side * 31, -26, 0] : [side * 37, -26, 3];
    const toeOut = (weight ? 7 : 15) * side;
    const fwd: V3 = [Math.sin(toeOut * D2R), 0, Math.cos(toeOut * D2R)];
    const heel = add3([ankle[0], -12, ankle[2]], fwd, -7);
    const toe = add3([ankle[0], -11, ankle[2]], fwd, 24);
    return { hip, knee, ankle, heel, toe };
  };
  const legShapes = (side: number): Shape[] => {
    const L = legPts(side);
    const pts = [L.hip, L.knee, L.ankle].map((p) => P2(p));
    const kk = [L.hip, L.knee, L.ankle].map((p) => kAt(p));
    const leg: Shape = { d: tube(pts, [58 * kk[0], 41 * kk[1], 23 * kk[2]]), fill: ink.trousers, see };
    const cuff: Shape = { see, d: `M ${n2(pts[2][0] - 11)} ${n2(pts[2][1] - 14)} C ${n2(pts[2][0] - 4)} ${n2(pts[2][1] - 10)} ${n2(pts[2][0] + 4)} ${n2(pts[2][1] - 10)} ${n2(pts[2][0] + 11)} ${n2(pts[2][1] - 14)}`, fill: ink.trousers, det: 1.3 };
    const h = P2(L.heel);
    const t = P2(L.toe);
    const shoe: Shape = { d: tube([h, [(h[0] + t[0]) / 2, (h[1] + t[1]) / 2 - 1], t], [23, 25, 22]), fill: ink.boots, see };
    const top = P2([L.ankle[0], -22, L.ankle[2]]);
    const shoeTop: Shape = { d: ellPath(top[0], top[1], 12.5, 9), fill: ink.boots, sh: 0.5, see };
    return [leg, cuff, shoeTop, shoe];
  };
  const dR = proj(v, legPts(-1).knee).d;
  const dL = proj(v, legPts(1).knee).d;
  const nearSide = dL >= dR ? 1 : -1;
  const farSide = -nearSide;
  S.push(...legShapes(farSide));
  S.push(...legShapes(nearSide));

  // ---- upper body: everything below is rotated by the stance about the hip --------------------------------------
  const U: Shape[] = [];
  const tag = (s: Shape): Shape => (see ? { ...s, see: true } : s);
  const torsoRows = scaleRows(TORSO, 1 + 0.012 * pose.breath, -380, -280).map((r) => ({ ...r, y: r.y < -300 ? r.y + lift * ((-300 - r.y) / 93) : r.y }));
  const vestRows = scaleRows(VEST, 1 + 0.012 * pose.breath, -380, -280).map((r) => ({ ...r, y: r.y < -300 ? r.y + lift * ((-300 - r.y) / 93) : r.y }));

  // arms (behind copies first: drawn before the torso)
  type ArmBuilt = { shapes: Shape[]; depth: number; hand: P; sx: number };
  const buildArm = (side: number, ap: ArmPose): ArmBuilt => {
    const Sh: V3 = [side * 47, -368 + lift + pose.slump * 0.5, 4];
    const u = armDir(side, ap.abd, ap.flex);
    const E = add3(Sh, u, 69);
    const f = armDir(side, ap.abd2, ap.flex2);
    const Wr = add3(E, f, 56);
    const h = norm3(armDir(side, ap.abd2 * 0.5, ap.flex2 - ap.droop));
    const tFwd: V3 = [-side * 0.35, 0, 1];
    const tIn: V3 = [-side, 0.25, 0.1];
    const th = norm3([lerp(tFwd[0], tIn[0], ap.thumb), lerp(tFwd[1], tIn[1], ap.thumb), lerp(tFwd[2], tIn[2], ap.thumb)]);
    const shTop = add3(Sh, [-side * 6, -10, 0]);
    const p = (q: V3) => P2(q);
    const k = (q: V3) => kAt(q);
    const sleeveMid = add3(Sh, u, 38);
    const sleeve: Shape = { d: tube([p(shTop), p(Sh), p(sleeveMid), p(E)], [24 * k(shTop), 29 * k(Sh), 28.5 * k(sleeveMid), 26 * k(E)]), fill: ink.shirt };
    const fold: Shape = { d: (() => { const a = p(add3(Sh, u, 22)); const b = p(add3(Sh, u, 56)); return `M ${n2(a[0] + side * 7)} ${n2(a[1])} L ${n2(b[0] + side * 6)} ${n2(b[1])}`; })(), fill: ink.shirt, det: 1.3 };
    const c0 = add3(E, u, -7);
    const c1 = add3(E, f, 9);
    const cuff: Shape = { d: tube([p(c0), p(c1)], [32 * k(c0), 32 * k(c1)]), fill: ink.shirt };
    const fa0 = add3(E, f, 8);
    const forearm: Shape = { d: tube([p(fa0), p(Wr)], [24 * k(fa0), 18.5 * k(Wr)]), fill: ink.skin };
    const hEnd = add3(Wr, h, 27);
    const hMid = add3(Wr, h, 13);
    const hand: Shape = { d: tube([p(add3(Wr, h, -3)), p(hMid), p(hEnd)], [22 * k(Wr), 26 * k(hMid), 23 * k(hEnd)]), fill: ink.skin };
    const tb0 = add3(Wr, h, 4);
    const tb1 = add3(add3(Wr, h, 12), th, 9);
    const thumb: Shape = { d: tube([p(tb0), p(tb1)], [10 * k(tb0), 9 * k(tb1)]), fill: ink.skin, sh: 0.6 };
    // the thumb: behind the mitten, and again in front with an opacity that follows its depth (no swap)
    const thumbFront = sstep(-6, 6, proj(v, tb1).d - proj(v, hMid).d);
    const fingers: Shape = { d: (() => { const a = p(add3(add3(Wr, h, 14), th, -6)); const b = p(add3(add3(Wr, h, 24), th, -5)); return `M ${n2(a[0])} ${n2(a[1])} L ${n2(b[0])} ${n2(b[1])}`; })(), fill: ink.skinSh, det: 1.3, op: 0.45 };
    const depth = proj(v, add3(add3(Sh, E, 1), Wr, 1).map((q) => q / 3) as V3).d;
    const shapes = [sleeve, fold, cuff, forearm, thumb, hand, { ...thumb, op: thumbFront }, fingers];
    const sx = proj(v, add3(add3(Sh, E, 1), Wr, 1).map((q) => q / 3) as V3).x;
    return { shapes: shapes.map(tag), depth, hand: p(hMid), sx };
  };
  const armR = buildArm(-1, pose.armR);
  const armL = buildArm(1, pose.armL);
  // the torso's own depth at the arms is ~ its centre: arm in front when its mean depth is ahead of the body's side
  // three copies of each arm: deep behind (before the legs: a hand far behind him), behind the torso, in front of it;
  // each later copy fades in over a short range of depth (a crossfade of the overlap, never a layer pop)
  const midA = (a: ArmBuilt) => sstep(-26, -14, a.depth);
  const deep: Shape[] = [...armR.shapes, ...armL.shapes];
  for (const a of [armR, armL]) {
    const m = midA(a);
    if (m > 0.002) U.push(...a.shapes.map((s) => ({ ...s, op: (s.op ?? 1) * m })));
  }

  // torso, waistcoat, the waistcoat's opening, collar, neck
  U.push(tag({ d: latheOutline(v, torsoRows), fill: ink.shirt }));
  U.push(tag({ d: latheOutline(v, vestRows), fill: ink.vest }));
  for (const d of band(v, vestRows, -393, -328, (y) => {
    const w = 24 * sstep(-328, -393, y);
    return [-w, w];
  }))
    U.push(tag({ d, fill: ink.shirt, sh: 0.4 }));
  // the waistcoat's back strap
  for (const d of band(v, vestRows, -300, -292, () => [150, 210])) U.push(tag({ d, fill: "#4A372A", sh: 0 }));
  // waist tie (all round), apron skirt (a band round the hips), its pocket and one soft fold, the bib
  U.push(tag({ d: latheOutline(v, TIE), fill: ink.apronTie, sh: 0.5 }));
  for (const d of band(v, APRON, -274, -106, apronRange, 1.5)) U.push(tag({ d, fill: ink.apron }));
  for (const d of band(v, APRON, -209, -173, (y) => {
    const w = 23 - 2 * sstep(-190, -173, y);
    return [-w, w];
  }, 2.2))
    U.push(tag({ d, fill: ink.apron, sh: 0.5 }));
  {
    // the pocket's top seam
    const r = sampleRow(APRON, -209);
    const pts: P[] = [];
    for (let b = -23; b <= 23; b += 4) {
      const s = surf(r, b, 2.4);
      if (ndepth(v, s.nx, s.nz) > 0.05) pts.push(P2(s.p));
    }
    if (pts.length > 1) U.push(tag({ d: `M ${pts.map((q) => `${n2(q[0])} ${n2(q[1])}`).join(" L ")}`, fill: ink.apronTie, det: 1.3, op: 0.45 }));
  }
  for (const d of band(v, APRON, -252, -110, (y) => {
    const t = (y + 252) / 142;
    return [5 + 3 * t, 8 + 7 * t];
  }, 2))
    U.push(tag({ d, fill: ink.apron, cast: true, op: 0.42 }));
  for (const d of band(v, torsoRows, -337, -268, (y) => {
    const r = sampleRow(torsoRows, y);
    const hw = 27 + (y + 337) * (4 / 69);
    const be = Math.asin(clamp(hw / r.a, 0, 0.98)) / D2R;
    return [-be, be];
  }, 3))
    U.push(tag({ d, fill: ink.apron }));
  // apron straps: front (bib corners up to the neck) and back (crossing to the opposite waist side)
  const strap = (pts: [number, number][], rowsOf: Row[], w: number, out: number) => {
    let run: P[] = [];
    const res: Shape[] = [];
    const flush = () => {
      if (run.length >= 2) res.push(tag({ d: tube(run, run.map(() => w)), fill: ink.apronTie, sh: 0.3 }));
      run = [];
    };
    for (const [be, y] of pts) {
      const s = surf(sampleRow(rowsOf, y), be, out);
      if (ndepth(v, s.nx, s.nz) > 0.02) run.push(P2(s.p));
      else flush();
    }
    flush();
    return res;
  };
  const line = (b0: number, y0: number, b1: number, y1: number, n = 10): [number, number][] => Array.from({ length: n + 1 }, (_, i) => [lerp(b0, b1, i / n), lerp(y0, y1, i / n)]);
  for (const side of [-1, 1]) {
    U.push(...strap(line(side * 19, -334, side * 13, -390, 8), vestRows, 6.5, 2.5));
    U.push(...strap(line(side * 165, -388, side * 165 + side * 70, -270, 14), vestRows, 7.5, 3));
  }
  // the bow at the back of the waist: two loops, two tails, a knot (a flat shape facing back, squashed with the turn)
  {
    const s = surf(sampleRow(TIE, -267), 180, 5);
    const dn = ndepth(v, s.nx, s.nz);
    const op = sstep(-0.3, 0.05, dn);
    if (op > 0.01) {
      const c = P2(s.p);
      const sx = 0.42 + 0.58 * Math.abs(dn);
      const B = (pts: [number, number][]) => smoothClosed(pts.map(([x, y]) => [c[0] + x * sx, c[1] + y] as P), 1);
      U.push(tag({ d: B([[-3, -2], [-14, -16], [-34, -18], [-36, -4], [-26, 6], [-6, 3]]), fill: ink.apron, sh: 0.7, op }));
      U.push(tag({ d: B([[3, -2], [14, -16], [34, -18], [36, -4], [26, 6], [6, 3]]), fill: ink.apron, sh: 0.7, op }));
      U.push(tag({ d: B([[-3, 3], [-10, 18], [-22, 44], [-15, 46], [-3, 20], [1, 4]]), fill: ink.apron, sh: 0.5, op }));
      U.push(tag({ d: B([[3, 3], [10, 16], [18, 38], [26, 35], [12, 14], [5, 2]]), fill: ink.apron, sh: 0.5, op }));
      U.push(tag({ d: ellPath(c[0], c[1] + 1, 7 * sx, 7), fill: ink.apron, sh: 0.6, op }));
    }
  }
  // arms: front copies, fading in with depth
  // the arm in FRONT of the body, clipped by the body's occluding edge: on each row, the torso (the apron below the
  // waist) covers the arm where its visible surface is nearer than the arm (+ OCC_BIAS: the arms hang a little in
  // front of the belly in the drawings). Where nothing is near enough the edge is extrapolated inward from the
  // nearest point, so the edge moves continuously with the yaw: the body covers the arm progressively, never a pop.
  const OCC_BIAS = 40;
  const occlusionClip = (a: ArmBuilt): string | undefined => {
    const thr = a.depth + OCC_BIAS;
    const xc = sampleRow(torsoRows, -320).c * v.sn;
    const sg = a.sx >= xc ? 1 : -1;
    const edge: P[] = [];
    let anyCover = false;
    for (let y = -400; y <= -100; y += 6) {
      const R = y < -268 ? torsoRows : APRON;
      const r = sampleRow(R, Math.max(R[0].y, Math.min(R[R.length - 1].y, y)));
      let best: { X: number; D: number } | null = null;
      let cover: number | null = null;
      for (let be = -180; be <= 180; be += 2) {
        const sp = surf(r, be, 0);
        if (ndepth(v, sp.nx, sp.nz) <= 0) continue;
        const q = proj(v, sp.p);
        if (sg * (q.x - xc) < -2) continue;
        if (!best || q.d > best.D) best = { X: q.x, D: q.d };
        if (q.d >= thr && (cover === null || sg * q.x > sg * cover)) cover = q.x;
      }
      if (cover !== null) anyCover = true;
      const X = cover !== null ? cover : best ? best.X - sg * 3 * (thr - best.D) : xc - sg * 3000;
      edge.push([X, y]);
    }
    if (!anyCover) return undefined;
    const far = sg * 4000;
    const pts: P[] = [[edge[0][0], -4000], ...edge, [edge[edge.length - 1][0], 4000], [far, 4000], [far, -4000]];
    return polyPath(pts.map(([x, y]) => [Math.max(-4000, Math.min(4000, x)), y] as P));
  };
  const pushFront = (a: ArmBuilt) => {
    const clip = occlusionClip(a);
    U.push(...a.shapes.map((s) => ({ ...s, clip })));
  };
  pushFront(armR);
  pushFront(armL);
  // neck and collar (above the see block: drawn after the arms, still `see`)
  U.push(tag({ d: latheOutline(v, NECK.map((r) => ({ ...r, y: r.y + lift }))), fill: ink.skin, sh: 0.5 }));
  U.push(tag({ d: latheOutline(v, COLLAR.map((r) => ({ ...r, y: r.y + lift }))), fill: ink.shirt, sh: 0.6 }));
  for (const side of [-1, 1]) {
    const s = surf(sampleRow(COLLAR, -383), side * 14, 0.5);
    const dn = ndepth(v, s.nx, s.nz);
    if (dn > 0.05) {
      const a = P2([s.p[0], s.p[1] + lift, s.p[2]]);
      const w = 9 * Math.min(1, dn * 1.4);
      U.push(tag({ d: polyPath([[a[0] - w, a[1] - 3], [a[0] + w, a[1] - 3], [a[0] - side * w * 0.2, a[1] + 9]]), fill: ink.shirt, sh: 0.5 }));
    }
  }

  // fungal threads on the neck (turn with the body's yaw)
  for (const th of (pose.threads ?? []).filter((q) => q.on === "neck")) {
    U.push(...threadShapes(threadRuns(th, NECK, v, (p, vw) => P2(p, vw), lift), ink.orange, th.w ?? 1.6, th.seed ?? 1));
  }
  // ---- head (its own yaw, pitch and roll about the neck) ----------------------------------------------------------
  const Hh: Shape[] = [];
  const hp = pose.headPitch;
  const lifted = (R: Row[]) => R.map((r) => ({ ...r, y: r.y + lift }));
  const HEADR = lifted(HEAD);
  // features: a surface point on the head; as he bows, what is on the face drops (seen from the front; in profile the
  // bow is the head group's screen rotation below)
  const featAt = (beta: number, y: number, out = 0.5) => {
    const r = sampleRow(HEADR, y + lift);
    const s = surf(r, beta, out);
    const down = Math.sin(hp * D2R) * Math.max(0, s.p[2] - r.c) * 0.9 * Math.abs(hv.cs);
    const pp: V3 = [s.p[0], s.p[1] + down, s.p[2]];
    return { pt: P2(pp, hv), dn: ndepth(hv, s.nx, s.nz) };
  };
  // head outline pieces (screen rotation for the bow happens below for the whole head group)
  const headD = latheOutline(hv, HEADR);
  // ears: behind copies, then the head, then front copies by depth
  const ears = [-1, 1].map((side) => {
    const f = featAt(side * 90, -434, 2);
    return { d: ellPath(f.pt[0], f.pt[1], 8, 11.5), dn: f.dn };
  });
  for (const e of ears) Hh.push({ d: e.d, fill: ink.skin, sh: 0.5 });
  Hh.push({ d: headD, fill: ink.skin });
  // hair: a band round the back of the head under the cap
  for (const d of band(hv, HEADR, -452 + lift, -403 + lift, (y) => {
    const t = sstep(-452 + lift, -403 + lift, y);
    const h = 74 - 46 * t * t * t;
    return [180 - h, 180 + h];
  }, 0.8))
    Hh.push({ d, fill: ink.hair, sh: 0.6 });
  // the shadow the cap's brim casts on the forehead
  for (const d of band(hv, HEADR, -447 + lift, -431 + lift, () => [-85, 85], 0.3)) Hh.push({ d, fill: ink.skin, cast: true, op: 0.45, clip: headD });
  // nose: a skin blob on the face that becomes the profile's bump
  {
    const f = featAt(0, -419, 1);
    const op = sstep(-0.35, 0.1, f.dn);
    if (op > 0.01) Hh.push({ d: ellPath(f.pt[0] + 2 * hv.sn, f.pt[1], 6.5, 8.5), fill: ink.skin, sh: 0.9, op });
  }
  // blush
  for (const side of [-1, 1]) {
    const f = featAt(side * 44, -409, 0.6);
    if (f.dn > 0) Hh.push({ d: ellPath(f.pt[0], f.pt[1], 8 * Math.max(0.2, f.dn), 5), fill: ink.blush, sh: 0, op: 0.55 * sstep(0, 0.3, f.dn), clip: headD });
  }
  // eyes: dot eyes, or the glance (a small white almond, the dot shifted), or blank orange
  const eyeCol = mixC(ink.eye, ink.orange, pose.orange);
  for (const side of [-1, 1]) {
    const f = featAt(side * 25, -424, 0.6);
    if (f.dn <= 0) continue;
    const sq = Math.pow(Math.max(0.12, f.dn), 0.7);
    const op = sstep(0, 0.18, f.dn);
    const [ex, ey] = f.pt;
    if (pose.glance > 0.01) {
      const w = 8 * sq;
      Hh.push({ d: `M ${n2(ex - w)} ${n2(ey)} C ${n2(ex - w * 0.6)} ${n2(ey - 5.5)} ${n2(ex + w * 0.6)} ${n2(ey - 5.5)} ${n2(ex + w)} ${n2(ey)} C ${n2(ex + w * 0.6)} ${n2(ey + 4.5)} ${n2(ex - w * 0.6)} ${n2(ey + 4.5)} ${n2(ex - w)} ${n2(ey)} Z`, fill: mixC(ink.eyeW, ink.orange, pose.orange), sh: 0, op: op * pose.glance, clip: headD });
    }
    const pupX = ex + pose.look * 4.2 * sq * pose.glance * (1 - pose.orange);
    const rx = lerp(4.3, 3.3, pose.glance) * sq + pose.orange * 1.2;
    const ry = lerp(5.2, 3.8, pose.glance) + pose.orange * 1.2;
    const eyeD = ellPath(pupX, ey - 0.2 * pose.glance, rx, ry);
    Hh.push({ d: eyeD, fill: eyeCol, sh: 0, op, clip: headD });
    const lids = pose.lids ?? 0;
    if (lids > 0.01) {
      // a heavy lid: skin over the top of the dot, its lower edge a gentle curve (drawn clipped to the eye)
      const yl = ey - ry + 2 * ry * lids * 0.62;
      Hh.push({ d: `M ${n2(pupX - rx * 1.4)} ${n2(ey - ry * 1.6)} L ${n2(pupX + rx * 1.4)} ${n2(ey - ry * 1.6)} L ${n2(pupX + rx * 1.4)} ${n2(yl - 0.6)} Q ${n2(pupX)} ${n2(yl + 1.4)} ${n2(pupX - rx * 1.4)} ${n2(yl - 0.6)} Z`, fill: ink.skin, sh: 0, op, clip: eyeD });
      Hh.push({ d: `M ${n2(pupX - rx * 1.25)} ${n2(yl - 0.3)} Q ${n2(pupX)} ${n2(yl + 1.6)} ${n2(pupX + rx * 1.25)} ${n2(yl - 0.3)}`, fill: ink.skinSh, det: 1.4, op: op * 0.8 * Math.min(1, lids * 3) });
    }
  }
  // brows (worry: inner ends up)
  if (pose.brows > 0.05) {
    for (const side of [-1, 1]) {
      const a = featAt(side * 14, -438 - pose.brows, 0.6);
      const b = featAt(side * 32, -436, 0.6);
      if (a.dn > 0 && b.dn > 0) Hh.push({ d: `M ${n2(a.pt[0])} ${n2(a.pt[1])} L ${n2(b.pt[0])} ${n2(b.pt[1])}`, fill: "#8C8070", det: 2.4, keep: true, op: 0.85 * sstep(0, 0.2, Math.min(a.dn, b.dn)) });
    }
  }
  // mouth: a small dark oval
  if (pose.mouth > 0.02) {
    const f = featAt(0, -401, 0.6);
    if (f.dn > 0) Hh.push({ d: ellPath(f.pt[0], f.pt[1] + 2 * pose.mouth, 5.5 * Math.max(0.3, f.dn) * (0.6 + 0.4 * pose.mouth), 2 + 6 * pose.mouth), fill: ink.mouth, sh: 0, op: sstep(0, 0.2, f.dn), clip: headD });
  }
  // fungal threads on the head (clipped to it; they ride the head's yaw and its bow like the face)
  for (const th of (pose.threads ?? []).filter((q) => q.on === "head")) {
    const down = (q: { p: V3; r: Row }) => Math.sin(hp * D2R) * Math.max(0, q.p[2] - q.r.c) * 0.9 * Math.abs(hv.cs);
    Hh.push(...threadShapes(threadRuns(th, HEADR, hv, (p, vw) => P2(p, vw), 0, down), ink.orange, th.w ?? 1.6, th.seed ?? 1, headD));
  }
  // ears in front (fading in as they come round toward us)
  for (const e of ears) {
    const op = sstep(0.12, 0.5, e.dn);
    if (op > 0.01) Hh.push({ d: e.d, fill: ink.skin, sh: 0.5, op });
  }
  // the knitted cap: dome, the rolled brim, its ribs
  const DOME = lifted(CAP_DOME);
  const BRIM = lifted(CAP_BRIM);
  Hh.push({ d: latheOutline(hv, DOME), fill: ink.cap });
  Hh.push({ d: latheOutline(hv, BRIM), fill: ink.cap });
  for (let b = -180; b < 180; b += 9) {
    const r0 = sampleRow(BRIM, -472 + lift);
    const r1 = sampleRow(BRIM, -448 + lift);
    const s0 = surf(r0, b, 0.3);
    const s1 = surf(r1, b, 0.3);
    const dn = ndepth(hv, s0.nx, s0.nz);
    if (dn < 0.05) continue;
    const a = P2(s0.p, hv);
    const c = P2(s1.p, hv);
    Hh.push({ d: `M ${n2(a[0])} ${n2(a[1])} L ${n2(c[0])} ${n2(c[1])}`, fill: ink.capRib, det: 1.1, op: 0.45 * sstep(0.05, 0.35, dn) });
  }
  // the dome's little fold near the top
  {
    const r = sampleRow(DOME, -500 + lift);
    const s = surf(r, 40, 0.2);
    const s2 = surf(sampleRow(DOME, -486 + lift), 62, 0.2);
    const dn = ndepth(hv, s.nx, s.nz);
    if (dn > 0.05) {
      const a = P2(s.p, hv);
      const c = P2(s2.p, hv);
      Hh.push({ d: `M ${n2(a[0])} ${n2(a[1])} Q ${n2((a[0] + c[0]) / 2 + 4)} ${n2((a[1] + c[1]) / 2 - 2)} ${n2(c[0])} ${n2(c[1])}`, fill: ink.capRib, det: 1.3, op: 0.55 * sstep(0.05, 0.3, dn) });
    }
  }

  // ---- assemble: head rotated about the neck (bow in profile, roll facing us), then everything above the hips
  // rotated by the stance about the hip -------------------------------------------------------------------------------
  const neckScr = P2(NECK_P, hv);
  const headRot = pose.headRoll * hv.cs + hp * hv.sn;
  const rotShape = (s: Shape, piv: P, deg: number): Shape => ({ ...s, d: rotPath(s.d, piv, deg), clip: s.clip ? rotPath(s.clip, piv, deg) : undefined });
  const headShapes = Hh.map((s) => rotShape(s, neckScr, headRot));
  const upper = [...U, ...headShapes].map((s) => rotShape(s, HIP, bodyRot));
  let shapes = [...deep.map((s) => rotShape(s, HIP, bodyRot)), ...S, ...upper];

  // ---- anchors (figure units, after the same rotations) -------------------------------------------------------------
  const H = (p: P) => rotAbout(rotAbout(p, neckScr, headRot), HIP, bodyRot);
  const B = (p: P) => rotAbout(p, HIP, bodyRot);
  const fe = (beta: number, y: number, out = 0.5) => H(featAt(beta, y, out).pt);
  const bodyPt = (R: Row[], beta: number, y: number, out = 0) => B(P2(surf(sampleRow(R, y), beta, out).p));
  const lungTop = -372 + lift;
  const lungBot = -262;
  const lw = 0.7 * sampleRow(torsoRows, -320).a;
  const lungC = (y: number, x: number) => B(P2([x * v.cs, y, sampleRow(torsoRows, y).c]));
  const anchors: WorkerAnchors = {
    eyeL: fe(25, -424),
    eyeR: fe(-25, -424),
    mouth: fe(0, -401),
    nose: fe(0, -419, 6),
    chin: fe(0, -392),
    headCenter: H(P2([0, -441 + lift, -3], hv)),
    crown: H(P2([0, -514 + lift, -6], hv)),
    backOfHead: fe(180, -445, 0),
    nape: B(P2(surf(sampleRow(NECK, -398), 180, 0).p)),
    trachea: B(P2([0, -404 + lift, 12])),
    sternumTop: bodyPt(torsoRows, 0, -378),
    sternum: bodyPt(torsoRows, 0, -330),
    sternumBottom: bodyPt(torsoRows, 0, -282),
    shoulderL: B(P2([50, -368 + lift, 4])),
    shoulderR: B(P2([-50, -368 + lift, 4])),
    chest: bodyPt(torsoRows, 0, -320),
    lungsTL: lungC(lungTop, -lw),
    lungsBR: lungC(lungBot, lw),
    lungL: lungC(-318, lw * 0.5),
    lungR: lungC(-318, -lw * 0.5),
    handL: B(armL.hand),
    handR: B(armR.hand),
    feet: [0, 0],
  };
  if (o.mirror) {
    shapes = shapes.map((s) => ({ ...s, d: mirrorPath(s.d), clip: s.clip ? mirrorPath(s.clip) : undefined }));
    for (const k of Object.keys(anchors) as (keyof WorkerAnchors)[]) anchors[k] = [-anchors[k][0], anchors[k][1]];
  }
  // tidy: drop invisible shapes
  shapes = shapes.filter((s) => (s.op ?? 1) > 0.002 && s.d.length > 4);
  const headAt = (beta: number, y: number, out = 0.5) => {
    const f = featAt(beta, y, out);
    const pt = H(f.pt);
    return { pt: (o.mirror ? [-pt[0], pt[1]] : pt) as P, dn: f.dn };
  };
  return { shapes, anchors, yaw, headAt, headRot: o.mirror ? -headRot : headRot, bodyRot: o.mirror ? -bodyRot : bodyRot };
};
