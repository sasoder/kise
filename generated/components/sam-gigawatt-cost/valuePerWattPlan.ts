// ---------------------------------------------------------------------------
// valuePerWattPlan — the pure plan of cut 3, MoreValuePerWatt (sam-gigawatt-cost), rev 3 ("stacks of cash"): the
// world geometry (metres, the aircraftShared frame: X right, Y up, Z away from the camera), the "1 W" power tile and
// its cable, the cash pedestal, the bundle schedule (every bundle's drop, landing, squash and puff), the ghost tick and
// the camera. No React, so a check script can import it.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 78;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
type V3 = [number, number, number];

// --- the cash --------------------------------------------------------------------------------------------------
/** one bundle: cashBundle's BUNDLE_REAL (0.156 x 0.066 x 0.011 m) x 10, long side (L) across the screen. */
export const BUNDLE = { L: 1.56, W: 0.66, H: 0.11 } as const;

// --- the pedestal (centred on X 0, Z 0) ---------------------------------------------------------------------------
/** a cream plinth with a shallow tray on top (a lip round an inset floor); the cable plugs into its left face */
export const PED = { w: 2.0, d: 1.2, h: 0.74, lip: 0.045, rim: 0.09 } as const;
/** the tray floor (where the first bundle stands) */
export const PED_TOP = PED.h;

// --- the "1 W" power tile -------------------------------------------------------------------------------------------
/** a cream block on the apron in front of the pedestal, to the left; "1 W" in ink on its face (toward the camera);
 *  the cable leaves its right face low down. */
export const TILE = { x: -0.62, z: -1.75, w: 0.6, h: 0.54, d: 0.36 } as const;
/** the face text: centre (local to the face, metres up from the ground) and the cap height */
export const TILE_TEXT = { y: 0.3, cap: 0.18 } as const;
export const TILE_FACE_Z = TILE.z - TILE.d / 2;

// --- the cable ------------------------------------------------------------------------------------------------------
export const CABLE_R = 0.05;
/** the plug boots: where the cable leaves the tile (its right face, pointing +X) and where it enters the pedestal (a
 *  socket low on its front face, the boot pointing at the camera, -Z) */
export const PLUG_OUT = { x: TILE.x + TILE.w / 2, y: 0.17, z: TILE.z - 0.02 } as const;
export const PLUG_IN = { x: 0.08, y: 0.2, z: -PED.d / 2 } as const;
export const BOOT = { len: 0.13, r: 0.075 } as const;
/** Control points (world): out of the tile's boot, down onto the apron, one rounded corner, then straight back along
 *  the apron and up into the pedestal's socket. */
const CABLE_CTRL: V3[] = [
  [PLUG_OUT.x + BOOT.len, PLUG_OUT.y, PLUG_OUT.z],
  [PLUG_OUT.x + BOOT.len + 0.1, PLUG_OUT.y - 0.07, PLUG_OUT.z],
  [PLUG_OUT.x + BOOT.len + 0.24, CABLE_R + 0.004, PLUG_OUT.z + 0.01],
  [PLUG_IN.x - 0.02, CABLE_R, PLUG_OUT.z + 0.16],
  [PLUG_IN.x, CABLE_R, -1.25],
  [PLUG_IN.x, CABLE_R, PLUG_IN.z - BOOT.len - 0.24],
  [PLUG_IN.x, PLUG_IN.y - 0.09, PLUG_IN.z - BOOT.len - 0.07],
  [PLUG_IN.x, PLUG_IN.y, PLUG_IN.z - BOOT.len],
];
/** centripetal Catmull-Rom through the control points, sampled densely; s = arc length from the tile end */
const CABLE_PTS: V3[] = (() => {
  const P = CABLE_CTRL;
  const out: V3[] = [];
  const ext = [
    [2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1], 2 * P[0][2] - P[1][2]] as V3,
    ...P,
    [2 * P[P.length - 1][0] - P[P.length - 2][0], 2 * P[P.length - 1][1] - P[P.length - 2][1], 2 * P[P.length - 1][2] - P[P.length - 2][2]] as V3,
  ];
  const SEG = 24;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    for (let j = 0; j < SEG; j++) {
      const t = j / SEG;
      const t2 = t * t;
      const t3 = t2 * t;
      const q = [0, 1, 2].map((a) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)) as V3;
      q[1] = Math.max(CABLE_R, q[1]);
      out.push(q);
    }
  }
  out.push([...P[P.length - 1]] as V3);
  return out;
})();
const CABLE_S: number[] = (() => {
  const s = [0];
  for (let i = 1; i < CABLE_PTS.length; i++) {
    const a = CABLE_PTS[i - 1];
    const b = CABLE_PTS[i];
    s.push(s[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return s;
})();
export const CABLE_LEN = CABLE_S[CABLE_S.length - 1];
export const cablePoints = () => CABLE_PTS.map((p) => [...p] as V3);
export const cableS = () => [...CABLE_S];
/** the current in the cable: soft light beads at ONE constant speed and spacing the whole cut (the watt never
 *  changes). s of each bead's centre at frame f. */
export const CURRENT = { speed: 0.06, every: 0.55, len: 0.22, glow: 0.9 } as const;
export const beadsAt = (f: number) => {
  const out: number[] = [];
  const off = (f * CURRENT.speed) % CURRENT.every;
  for (let s = off - CURRENT.every; s < CABLE_LEN + CURRENT.every; s += CURRENT.every) out.push(s);
  return out;
};

// --- the bundle schedule ------------------------------------------------------------------------------------------
/** bundles already on the tray at f0 */
export const N0 = 4;
/** drops: the first lands on f FIRST, then each gap is RHO x the last, down to GMIN; once the gaps are short the
 *  drops grow from one bundle to a strapped pair (PAIR_FROM), so the stack keeps climbing faster through "so quickly"
 *  (f53-58) and to the end while no two drops come closer than GMIN frames (identical bundles arriving faster than
 *  one every 2 f alias on 23.976 fps: the stream reads as hanging still or drifting up). */
const FIRST = 4.5;
const G0 = 11;
const RHO = 0.83;
const GMIN = 2.6;
const PAIR_FROM = 58;
/** gravity (m / f^2; stylised: the bundles are 10x real size, so a little under real g at that scale reads weighty
 *  without floating) */
export const GRAV = 0.018;
/** each drop starts this far (m) above the frame's top edge at the stack (so a bundle enters already falling) */
const ENTRY_MARGIN = 2.6;
/** squash on landing: the bundle's height dips by SQ_AMP (its length grows by half that), peak SQ_IN f after contact,
 *  then recovers critically damped (no overshoot) with time constant SQ_TAU */
export const SQ = { amp: 0.16, inF: 1.0, tau: 1.7 } as const;
/** the paper puff at each landing: air pushed out of the seam at both ends of the bundle */
export const PUFF = { life: 9, reach: 0.5, rise: 0.06, size: 0.12 } as const;

export type Bundle = {
  i: number; // index in the stack (0 = on the tray)
  drop: number; // which drop it came in (-1 for the initial ones)
  lead: boolean; // the lowest bundle of its drop (the one that makes the contact)
  tL: number; // landing (contact) frame; -inf for the initial ones
  D: number; // drop height (m) above the landing top
  T: number; // fall time (f)
  vL: number; // speed at contact (m / f)
  dx: number;
  dz: number;
  heading: number; // final heading (deg)
  spin: number; // extra heading at release (deg), unwinding to 0 at contact
  seed: number;
};

/** the drops: landing frame and how many bundles (1, then 2 from PAIR_FROM) */
const DROPS: { t: number; n: number }[] = (() => {
  const out: { t: number; n: number }[] = [];
  let t = FIRST;
  let g = G0;
  while (t < DURATION + 14) {
    out.push({ t, n: t >= PAIR_FROM ? 2 : 1 });
    t += g;
    g = Math.max(GMIN, g * RHO);
  }
  return out;
})();
export const dropList = () => DROPS.map((d) => ({ ...d }));
export const landingFrames = () => DROPS.map((d) => d.t);

/** squash of a bundle u frames after its contact (0..1 of SQ.amp) */
export const squashAt = (u: number) => {
  if (u <= 0) return 0;
  if (u < SQ.inF) {
    const x = u / SQ.inF;
    return x * x * (3 - 2 * x);
  }
  const w = (u - SQ.inF) / SQ.tau;
  return (1 + w) * Math.exp(-w); // critically damped return: monotone, no overshoot
};

// --- the camera ---------------------------------------------------------------------------------------------------
/** A look: the world point at screen (540, row), the distance to it, yaw / pitch (deg, + looks down), focal (px). */
export type Look = { tx: number; ty: number; tz: number; d: number; yaw: number; pitch: number; f: number; row: number };
const D2R = Math.PI / 180;
export const camOfLook = (l: Look) => {
  const fx = Math.sin(l.yaw * D2R) * Math.cos(l.pitch * D2R);
  const fy = -Math.sin(l.pitch * D2R);
  const fz = Math.cos(l.yaw * D2R) * Math.cos(l.pitch * D2R);
  return { mode: "side" as const, x: l.tx - fx * l.d, y: l.ty - fy * l.d, z: l.tz - fz * l.d, f: l.f, horizon: l.row, yaw: l.yaw, pitch: l.pitch, near: 0.5 };
};
/** nearly front-on, a little above: close on the tray and the first bundles, the tile in the lower foreground */
export const LOOK_START: Look = { tx: -0.05, ty: 0.98, tz: 0, d: 4.8, yaw: -2, pitch: 10.7, f: 1700, row: 960 };
/** ONE move: a slow crane up that follows the stack (and eases back a touch so the tile stays in shot). It starts
 *  before f0 (already moving, gently), runs fastest where the stack climbs fastest and lands by the end. */
export const LOOK_END: Partial<Look> = { ty: 1.8, d: 6.1, pitch: 4.3 };
const MOVE = { f0: -8, f1: 80, bias: 1.35 } as const;
const moveEase = (f: number) => {
  const u = clamp01((f - MOVE.f0) / (MOVE.f1 - MOVE.f0));
  const w = Math.pow(u, MOVE.bias);
  return w * w * (3 - 2 * w);
};
const FIELDS = ["tx", "ty", "tz", "d", "yaw", "pitch", "f", "row"] as const;
const isLog = (k: string) => k === "d" || k === "f";
export const lookTarget = (f: number): Look => {
  const e = moveEase(f);
  const o: Record<string, number> = {};
  const A = LOOK_START as unknown as Record<string, number>;
  const B = { ...LOOK_START, ...LOOK_END } as unknown as Record<string, number>;
  for (const k of FIELDS) o[k] = isLog(k) ? Math.exp(lerp(Math.log(A[k]), Math.log(B[k]), e)) : lerp(A[k], B[k], e);
  return o as unknown as Look;
};
/** the house damped follower over the look fields, pre-rolled so f0 is already moving */
const STIFF = 0.16;
const DAMP = 0.6;
const PRE = 30;
const LOOKS: Look[] = (() => {
  const out: Look[] = [];
  const c: Record<string, number> = { ...(lookTarget(-PRE) as unknown as Record<string, number>) };
  const vel: Record<string, number> = {};
  for (const k of FIELDS) vel[k] = 0;
  for (let f = -PRE; f <= DURATION + 16; f++) {
    const T = lookTarget(f) as unknown as Record<string, number>;
    for (const k of FIELDS) {
      const tv = isLog(k) ? Math.log(T[k]) : T[k];
      const cv = isLog(k) ? Math.log(c[k]) : c[k];
      vel[k] = vel[k] + (tv - cv) * STIFF - vel[k] * DAMP;
      const nv = cv + vel[k];
      c[k] = isLog(k) ? Math.exp(nv) : nv;
    }
    if (f >= 0) out.push({ ...(c as unknown as Look) });
  }
  return out;
})();
export const lookAt = (f: number): Look => {
  const a = Math.max(0, Math.min(LOOKS.length - 2, Math.floor(f)));
  const t = clamp01(f - a);
  const A = LOOKS[a] as unknown as Record<string, number>;
  const B = LOOKS[a + 1] as unknown as Record<string, number>;
  const o: Record<string, number> = {};
  for (const k of FIELDS) o[k] = lerp(A[k], B[k], t);
  return o as unknown as Look;
};
export const camAt = (f: number) => camOfLook(lookAt(f));
export const CAM_REST = camOfLook(lookAt(0));

/** pinhole projection (aircraftShared airProject's maths, so the plan needs no React import) */
export const project = (f: number, p: V3) => {
  const q = camAt(f);
  const rx = p[0] - q.x;
  const ry = p[1] - q.y;
  const rz = p[2] - q.z;
  const sy = Math.sin(q.yaw * D2R);
  const cy = Math.cos(q.yaw * D2R);
  const sp = Math.sin(q.pitch * D2R);
  const cp = Math.cos(q.pitch * D2R);
  const d = rx * sy * cp - ry * sp + rz * cy * cp;
  const right = rx * cy - rz * sy;
  const up = rx * sy * sp + ry * cp + rz * cy * sp;
  const dd = Math.max(1e-6, d);
  return { x: 540 + (q.f * right) / dd, y: q.horizon - (q.f * up) / dd, s: q.f / dd, d };
};
/** the world height on the stack's axis (X 0, Z 0) that sits on screen row `row` at frame f */
export const worldYAtRow = (f: number, row: number) => {
  let lo = -20;
  let hi = 60;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (project(f, [0, m, 0]).y > row) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

// --- the bundles ----------------------------------------------------------------------------------------------------
const nominalFoot = (i: number) => PED_TOP + i * BUNDLE.H;
export const BUNDLES: Bundle[] = (() => {
  const out: Bundle[] = [];
  const slots: { drop: number; lead: boolean }[] = [];
  for (let i = 0; i < N0; i++) slots.push({ drop: -1, lead: true });
  DROPS.forEach((d, k) => {
    for (let j = 0; j < d.n; j++) slots.push({ drop: k, lead: j === 0 });
  });
  let prevD = 0;
  let D = 2;
  slots.forEach(({ drop, lead }, i) => {
    const tL = drop < 0 ? -1e9 : DROPS[drop].t;
    const seed = hash01(i * 7.31 + 2.2);
    const dx = (hash01(i * 3.7 + 0.4) - 0.5) * 0.04;
    const dz = (hash01(i * 5.3 + 1.9) - 0.5) * 0.03;
    const heading = (hash01(i * 9.1 + 3.3) - 0.5) * 2.4;
    // one spin per drop (a pair falls as one packet)
    const ds = drop < 0 ? i : drop;
    const spin = (hash01(ds * 4.4 + 8.8) < 0.5 ? -1 : 1) * (3 + 4 * hash01(ds * 2.9 + 0.7));
    if (drop >= 0 && lead) {
      // drop from ENTRY_MARGIN above the frame's top at the moment of release (iterate: T depends on D)
      D = 2;
      for (let it = 0; it < 6; it++) {
        const T = Math.sqrt((2 * D) / GRAV);
        const topY = worldYAtRow(tL - T, 0);
        D = Math.max(1.0, topY - nominalFoot(i) + ENTRY_MARGIN);
      }
      // never lower than the drop before it: equal or longer drops keep every pair apart in the air
      D = Math.max(D, prevD);
      prevD = D;
    }
    const Dd = drop < 0 ? 2 : D;
    const T = Math.sqrt((2 * Dd) / GRAV);
    out.push({ i, drop, lead, tL, D: Dd, T, vL: GRAV * T, dx, dz, heading, spin, seed });
  });
  return out;
})();
export const BUNDLE_COUNT = BUNDLES.length;

/** the squashed height of bundle i at frame f */
export const heightOf = (b: Bundle, f: number) => BUNDLE.H * (1 - SQ.amp * squashAt(f - b.tL));
/** how many bundles have landed by frame f (including the initial ones) */
export const landedBy = (f: number) => BUNDLES.filter((b) => b.tL <= f).length;
/** the top the bundles under bundle i make at frame f: the current (squashed) height of each landed one, the full
 *  height of any still falling (it will be there when bundle i lands, and its height is H at its own contact, so the
 *  sum never steps) */
const topUnder = (i: number, f: number) => {
  let y = PED_TOP;
  for (let j = 0; j < i; j++) y += heightOf(BUNDLES[j], f);
  return y;
};
export type BundleState = { x: number; y: number; z: number; heading: number; L: number; H: number; W: number; state: "air" | "rest"; above: number };
/** bundle i at frame f: its foot centre, heading and squashed size. A falling bundle follows its parabola relative to
 *  the live top under it (so it meets the top exactly at tL, whatever squash is going on below). */
export const bundleAt = (b: Bundle, f: number): BundleState => {
  const base = topUnder(b.i, f);
  const s = squashAt(f - b.tL);
  const H = BUNDLE.H * (1 - SQ.amp * s);
  const L = BUNDLE.L * (1 + SQ.amp * 0.32 * s);
  const W = BUNDLE.W * (1 + SQ.amp * 0.32 * s);
  if (f >= b.tL) return { x: b.dx, y: base, z: b.dz, heading: b.heading, L, H, W, state: "rest", above: 0 };
  const tau = Math.min(b.tL - f, b.T); // before its release a bundle waits at its drop height (above the frame)
  const h = b.vL * tau - 0.5 * GRAV * tau * tau; // height above the top, from the contact backwards
  const u = clamp01(tau / b.T);
  return { x: b.dx, y: base + Math.max(0, h), z: b.dz, heading: b.heading + b.spin * u * u, L: BUNDLE.L, H: BUNDLE.H, W: BUNDLE.W, state: "air", above: Math.max(0, h) };
};
// --- checks at module load (cheap) ----------------------------------------------------------------------------------
/** no falling bundle ever overlaps the one below it in its column, and none lands before the one under it */
export const COLLISIONS: string[] = (() => {
  const bad: string[] = [];
  for (let k = 1; k < BUNDLES.length; k++) {
    const a = BUNDLES[k - 1];
    const b = BUNDLES[k];
    if (b.tL >= 0 && (b.drop === a.drop ? b.tL !== a.tL : b.tL <= a.tL)) bad.push(`bundle ${k} lands before ${k - 1}`);
    for (let f = Math.max(-40, b.tL - b.T); f < DURATION + 14; f += 0.125) {
      const pa = bundleAt(a, f);
      const pb = bundleAt(b, f);
      if (pb.y < pa.y + pa.H - 1e-6 && pb.state === "air") {
        bad.push(`bundle ${k} overlaps ${k - 1} at f${f.toFixed(3)}`);
        break;
      }
    }
  }
  return bad;
})();
