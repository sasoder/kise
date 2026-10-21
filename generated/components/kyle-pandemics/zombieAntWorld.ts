// ---------------------------------------------------------------------------
// zombieAntWorld: the world, camera, timeline and the ant's motion for ZombieAnt (kyle-pandemics, cut 58). Pure
// functions of the frame. Drawing lives in ZombieAnt.tsx and zombieAntFigure.tsx; the fungus in cordyceps.tsx.
//
// THE MODEL (the London depth manner, DEPTH.md; the camera helpers copied from kyle-london/disgustingLondonWorldV5).
// 3D world units ~ px at k 1 (the ant ~430 long). X across, Y height (the forest floor is Y = 0, up is - Y), Z depth
// behind the FRONT PLANE Z = 0 (toward the camera is - Z). The stem stands on the front plane; the ant walks and
// climbs on it. A keyed 2D camera (cx, cy, k) through the house damped follow is read as a pinhole on a crane: the
// eye at X = cam.cx (the VP on the frame's centre line), Y = cam.cy - EYE_UP (so the horizon rides ~150 px above
// the frame's centre and comes up with the crane: a pedestal move, lens shift, verticals stay vertical), a distance
// D = FOCAL / k in front of the front plane. A 3D point draws at its front-plane-equivalent point, then through the
// 2D camera: the front plane (the ant, the stem) renders 1:1, the floor drops away below as the eye rises, nearer
// things move faster than farther ones (parallax), every receding edge meets the VP.
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";

export const FPS = 30000 / 1001;
export const DURATION = 145;
export type P2 = [number, number];
export type Cam = { k: number; cx: number; cy: number };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lin = (f: number, a: number, b: number) => c01((f - a) / (b - a));
export const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rot2 = (v: P2, a: number): P2 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
export const add2 = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
export const sub2 = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
export const mul2 = (a: P2, k: number): P2 => [a[0] * k, a[1] * k];

// ---- the timeline (frames; the word table in ZombieAnt.tsx's header) ----------------------------------------------
export const T = {
  slow: 79, // the climb leaves its constant speed (the head nears the leaf)
  stop: 88, // the ant stops under the leaf
  turn: [85, 91] as [number, number], // the head turns under the leaf, the body leans to it
  open: [83, 89] as [number, number], // the mandibles open
  clamp: [89.5, 91] as [number, number], // ...and snap shut on the vein: CONTACT f91 (THERE 92)
  release: 93, // the legs let go of the stem one by one, splay and go still (f93-104)
  stalk: [100, 131] as [number, number], // the stalk pushes out of the neck and grows (the tip draws it)
  ripen: [113, 134] as [number, number], // the fruiting body swells
};

// ---- the camera --------------------------------------------------------------------------------------------------
export type CamTarget = { f: number; cx: number; cy: number; k: number };
// r1: ONE eased push-in rides on the crane through the climb (k 1.13 at f24 -> 1.50 at the grip), the meso held
// ~700 px down the frame while it climbs (cy = Ym + 260 / k from the planned path), then a slow creep in on the hang
export const CAM_KEYS: CamTarget[] = [
  { f: 0, cx: 440, cy: -38, k: 1.12 },
  { f: 24, cx: 482, cy: -128, k: 1.13 },
  { f: 46, cx: 540, cy: -389, k: 1.18 },
  { f: 62, cx: 548, cy: -665, k: 1.3 },
  { f: 78, cx: 535, cy: -940, k: 1.44 },
  { f: 92, cx: 430, cy: -1052, k: 1.5 },
  { f: 118, cx: 410, cy: -1050, k: 1.52 },
  { f: 144, cx: 404, cy: -1046, k: 1.53 },
];
/** monotone cubic through [x, y] keys, one-sided end slopes (a track never starts at rest) */
const pchip = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};
/** the keys -> pchip (k in log space) -> the house damped follow (CAM_STIFF / CAM_DAMP of kits/dwarkesh/fieldShared),
 *  pre-rolled 60 frames so f0 is already in steady motion; the follow is led by 5 f so it lands where the keys say */
const CAM_PATH: Cam[] = (() => {
  const pk = pchip(CAM_KEYS.map((q) => [q.f, Math.log(q.k)]));
  const px = pchip(CAM_KEYS.map((q) => [q.f, q.cx]));
  const py = pchip(CAM_KEYS.map((q) => [q.f, q.cy]));
  const target = (f: number) => {
    // hold the end keys flat beyond the cut (no run-off), keep the pre-roll on the f0 slope
    const g = Math.min(f, CAM_KEYS[CAM_KEYS.length - 1].f);
    return [px(g), py(g), pk(g)];
  };
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = [0, 0, 0];
  const out: Cam[] = [];
  for (let f = -PRE + 1; f <= DURATION + 2; f++) {
    const t = target(f + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) out.push({ cx: s[0], cy: s[1], k: Math.exp(s[2]) });
  }
  return out;
})();
export const camAt = (frame: number): Cam => CAM_PATH[Math.max(0, Math.min(CAM_PATH.length - 1, Math.round(frame)))];
export const toScreen = (cam: Cam, x: number, y: number): P2 => [540 + (x - cam.cx) * cam.k, 960 + (y - cam.cy) * cam.k];

// ---- the eye (one pinhole per frame) -------------------------------------------------------------------------------
export const FOCAL = 1100;
export const EYE_UP = 150;
/** r1: the eye rises to the leaf's height for the grip (the leaf near edge-on, a hair from below): the horizon's
 *  screen height above the centre goes 150 -> 520 px over f35-92 */
export const eyeUpAt = (f: number) => EYE_UP + (520 - EYE_UP) * sstep(lin(f, 35, 92));
export type Eye = { X: number; Y: number; D: number };
export const eyeOf = (cam: Cam, f = 0): Eye => ({ X: cam.cx, Y: cam.cy - eyeUpAt(f) / cam.k, D: FOCAL / cam.k });
/** the depth ratio at Z (1 on the front plane, > 1 nearer, < 1 farther) */
export const rOf = (e: Eye, Z: number) => e.D / (e.D + Math.max(Z, -0.9 * e.D));
/** a 3D point -> its front-plane-equivalent (2D world) point */
export const proj = (e: Eye, X: number, Y: number, Z: number): P2 => {
  const s = rOf(e, Z);
  return [e.X + (X - e.X) * s, e.Y + (Y - e.Y) * s];
};

// ---- the stem ----------------------------------------------------------------------------------------------------------
export const STEM = { X: 682, R: 42, top: -1790 };
/** the stem's left surface (the ant climbs it) */
export const XS = STEM.X - STEM.R;

// ---- the ant: proportions ---------------------------------------------------------------------------------------------
/** the ant drawing's scale (its local units -> world units): ~430 long from mandible tip to gaster tip */
export const ANT_S = 0.88;
/** segment centres in AXIS coordinates (unscaled): u forward along the body axis, v ventral (down when walking);
 *  r = the segment's own pitch (rad, + = nose / tip toward ventral) */
export const SEG = {
  head: { u: 130, v: -4, r: 0.14 },
  meso: { u: 0, v: 0, r: 0 },
  pet: { u: -84, v: 6, r: 0 },
  gaster: { u: -180, v: 4, r: 0.05 },
};
export type SegKey = keyof typeof SEG;
/** the neck (the head pitches about it) and the mandible tips, in head-local units */
export const NECK_AXIS: P2 = [80, -2];
/** r1: the two blades' tips meet across the vein around here (head-local, closed) */
export const MAND_TIP_HEAD: P2 = [106 * 1.1, 11 * 1.1]; // V2: the head (and its jaws) drawn 1.1x (HEAD_K)
/** the legs splay out toward / away from us, so in profile the femur and tibia show foreshortened by FORESHORTEN */
export const FORESHORTEN = 0.8;
/** the leg sockets on the mesosoma (meso-local, unscaled) and the leg bones (unscaled) */
export const LEG_BONES = [
  { coxa: 22, femur: 96, tibia: 88, tarsus: 78, attach: [52, 20] as P2 },
  { coxa: 20, femur: 108, tibia: 100, tarsus: 88, attach: [4, 24] as P2 },
  { coxa: 24, femur: 124, tibia: 118, tarsus: 102, attach: [-40, 22] as P2 },
];
/** the six legs: pair 0 fore, 1 mid, 2 hind; side -1 near (toward us), 1 far. Tripods: (L1 L3 R2) and (R1 R3 L2).
 *  home = where the toe sits, mid-stance, relative to the meso centre along the path (world units) */
export const LEGS = [
  { id: "L1", pair: 0, side: -1, home: 160, ph: 0.0 },
  { id: "L2", pair: 1, side: -1, home: 44, ph: 0.5 },
  { id: "L3", pair: 2, side: -1, home: -196, ph: 0.0 },
  { id: "R1", pair: 0, side: 1, home: 150, ph: 0.5 },
  { id: "R2", pair: 1, side: 1, home: 34, ph: 0.0 },
  { id: "R3", pair: 2, side: 1, home: -208, ph: 0.5 },
] as const;
export type LegId = (typeof LEGS)[number]["id"];

// ---- the ant: the path it walks and climbs (the body axis) --------------------------------------------------------
/** the body axis rides HB above the substrate; it turns from the floor onto the stem on a fillet of radius RF */
export const HB = 86;
export const RF = 95;
/** the meso centre's X at f0 */
export const M0 = 300;
const L1 = XS - HB - RF - M0;
const FC: P2 = [XS - HB - RF, -HB - RF];
const L2 = L1 + (Math.PI / 2) * RF;
export const pathAt = (s: number): { p: P2; t: P2 } => {
  if (s < L1) return { p: [M0 + s, -HB], t: [1, 0] };
  if (s < L2) {
    const th = (s - L1) / RF;
    return { p: [FC[0] + RF * Math.sin(th), FC[1] + RF * Math.cos(th)], t: [Math.cos(th), -Math.sin(th)] };
  }
  return { p: [XS - HB, FC[1] - (s - L2)], t: [0, -1] };
};
/** the dorsal direction for a path tangent (walking right: up; climbing up: left) */
export const dorsalOf = (t: P2): P2 => [t[1], -t[0]];

/** the walking speed (world units per frame): constant, then it slows to a stop under the leaf */
export const V = 16;
export const sAt = (f: number) => {
  if (f <= T.slow) return V * f;
  const Ts = T.stop - T.slow;
  const tau = Math.min(f - T.slow, Ts);
  return V * T.slow + V * (tau - (tau * tau) / (2 * Ts));
};
export const S_END = sAt(T.stop);

/** the substrate under the path at arc s: cast from the body along the ventral direction to the floor or the stem */
export const substrateAt = (s: number): { p: P2; tan: P2; nrm: P2; stem: boolean } => {
  const { p, t } = pathAt(s);
  const v: P2 = [-t[1], t[0]]; // ventral = - dorsal
  let best = Infinity;
  let stem = false;
  if (v[1] > 1e-6) best = (0 - p[1]) / v[1];
  if (v[0] > 1e-6) {
    const ts = (XS - p[0]) / v[0];
    if (ts < best) {
      best = ts;
      stem = true;
    }
  }
  const q: P2 = [p[0] + v[0] * best, p[1] + v[1] * best];
  return stem ? { p: [XS, q[1]], tan: [0, -1], nrm: [-1, 0], stem } : { p: [q[0], 0], tan: [1, 0], nrm: [0, -1], stem };
};

// ---- the leaf the ant bites (a 3D surface: midrib in the front plane near the stem, yawing toward us outward) --------
export const LEAF = {
  len: 560, // midrib length from the node (r1: a lanceolate leaf whose tip stays in frame)
  pet: 105, // the petiole (no blade)
  W: 112, // the blade's half-width at its widest
  rise: (22 * Math.PI) / 180, // the petiole's rise leftward at the node
  droop: (46 * Math.PI) / 180, // total droop toward the tip
  yaw: (24 * Math.PI) / 180, // the midrib turns toward the camera along its length
  roll: (13 * Math.PI) / 180, // the near half a little raised: seen near edge-on, a hair from below
  fold: (8 * Math.PI) / 180, // the two halves fold up a little along the midrib
  rib: 9, // the petiole / midrib half-thickness
};
/** the node: where the petiole leaves the stem's left side. Placed so the climbing ant's mandibles stop ~16 under
 *  the petiole's underside (the head arrives under the leaf, then turns to it). */
const headTipAtStop = (() => {
  const sp = pathAt(S_END);
  const d = dorsalOf(sp.t);
  const hc = add2(sp.p, add2(mul2(sp.t, SEG.head.u * ANT_S), mul2(d, -SEG.head.v * ANT_S)));
  return hc[1] - 96 * ANT_S; // ~ the mandibles' top while climbing (pointing up)
})();
export const NODE_Y = headTipAtStop - 16 - LEAF.rib + (HB + 4) * Math.tan(LEAF.rise);
export const NODE: P2 = [XS + 4, NODE_Y];
export type LeafSpec = typeof LEAF & { node: P2; side: -1 | 1 };
export type Leaf3 = { spec: LeafSpec; halfWidth: (u: number) => number; point: (u: number, v: number) => [number, number, number] };
/** a leaf as a 3D surface: the midrib leaves the node sideways (side -1 left, 1 right), rising, then droops toward
 *  the tip and yaws (+ toward the camera); the blade's near half is raised by roll, both halves folded up a little */
export const makeLeaf = (spec: LeafSpec): Leaf3 => {
  const NL = 64;
  const mid: { X: number; Y: number; Z: number; dir: [number, number, number] }[] = [];
  let X = spec.node[0];
  let Y = spec.node[1];
  let Z = 0;
  const du = spec.len / NL;
  for (let i = 0; i <= NL; i++) {
    const x = i / NL;
    const al = spec.rise - spec.droop * Math.pow(x, 1.25);
    const be = spec.yaw * Math.pow(x, 1.1);
    const dir: [number, number, number] = [spec.side * Math.cos(al) * Math.cos(be), -Math.sin(al), -Math.cos(al) * Math.sin(be)];
    mid.push({ X, Y, Z, dir });
    X += dir[0] * du;
    Y += dir[1] * du;
    Z += dir[2] * du;
  }
  const halfWidth = (u: number) => {
    if (u <= spec.pet) return 0;
    const x = (u - spec.pet) / (spec.len - spec.pet);
    return (spec.W * Math.pow(x, 0.5) * Math.pow(1 - x, 0.9)) / 0.4019;
  };
  const point = (u: number, v: number): [number, number, number] => {
    const x = Math.max(0, Math.min(NL, (u / spec.len) * NL));
    const i = Math.min(NL - 1, Math.floor(x));
    const f = x - i;
    const a = mid[i];
    const b = mid[i + 1];
    const Xm = a.X + (b.X - a.X) * f;
    const Ym = a.Y + (b.Y - a.Y) * f;
    const Zm = a.Z + (b.Z - a.Z) * f;
    const d = a.dir;
    // the horizontal across direction, pointing to the far side (+ Z)
    const hl = Math.hypot(d[0], d[2]) || 1;
    let pX = -d[2] / hl;
    let pZ = d[0] / hl;
    if (pZ < 0) {
      pX = -pX;
      pZ = -pZ;
    }
    const w = halfWidth(u) * Math.abs(v);
    const side = v < 0 ? -1 : 1;
    const up = side < 0 ? spec.roll + spec.fold : spec.fold - spec.roll;
    const across = Math.cos(up) * w * side;
    return [Xm + pX * across, Ym - Math.sin(up) * w, Zm + pZ * across];
  };
  return { spec, halfWidth, point };
};
export const BITE_LEAF = makeLeaf({ ...LEAF, node: NODE, side: -1 });
export const leafPoint = BITE_LEAF.point;
export const leafHalfWidth = BITE_LEAF.halfWidth;
/** the midrib's underside in the front plane at a given X (the bite is here) */
export const midribAt = (u: number): [number, number, number] => leafPoint(u, 0);
/** the bite: on the midrib's underside, BITE_U along from the node */
export const BITE_U = 150;
export const BITE: P2 = (() => {
  const m = midribAt(BITE_U);
  return [m[0], m[1] - LEAF.rib * 0.3]; // r1: the blade tips close through the vein (near one over it, far one behind)
})();

// ---- the ant's pose ----------------------------------------------------------------------------------------------------
export type Seg = { p: P2; a: number };
export type BodyPose = Record<SegKey, Seg>;
const segFromPath = (s: number, key: SegKey): Seg => {
  const g = SEG[key];
  const q = pathAt(s + g.u * ANT_S);
  const d = dorsalOf(q.t);
  return { p: add2(q.p, mul2(d, -g.v * ANT_S)), a: Math.atan2(q.t[1], q.t[0]) + g.r };
};
export const pathPose = (s: number): BodyPose => ({
  head: segFromPath(s, "head"),
  meso: segFromPath(s, "meso"),
  pet: segFromPath(s, "pet"),
  gaster: segFromPath(s, "gaster"),
});
/** a rigid ant: meso centre O, axis angle a, the head pitched by hp about the neck */
export const rigidPose = (O: P2, a: number, hp: number): BodyPose => {
  const seg = (key: SegKey): Seg => {
    const g = SEG[key];
    return { p: add2(O, rot2([g.u * ANT_S, g.v * ANT_S], a)), a: a + g.r };
  };
  const head = seg("head");
  const neck = add2(O, rot2(mul2(NECK_AXIS, ANT_S), a));
  const hpPos = add2(neck, rot2(sub2(head.p, neck), hp));
  return { head: { p: hpPos, a: head.a + hp }, meso: seg("meso"), pet: seg("pet"), gaster: seg("gaster") };
};
/** the mandible tip of a rigid ant, relative to O in axis coordinates (before the axis rotation) */
const mandTipAxis = (hp: number): P2 => {
  const g = SEG.head;
  const headC: P2 = [g.u * ANT_S, g.v * ANT_S];
  const tipLocal = rot2(mul2(MAND_TIP_HEAD, ANT_S), g.r);
  const tip = add2(headC, tipLocal);
  const neck = mul2(NECK_AXIS, ANT_S);
  return add2(neck, rot2(sub2(tip, neck), hp));
};
/** the bite and the hang (rad): the axis leans to the leaf, the head pitches up to the vein */
export const A_BITE = (-108 * Math.PI) / 180;
export const HP_BITE = -0.32;
/** where the hanging body comes to rest: its centre of mass under the bite, held a little off by its stiffness */
export const A_HANG = (-57 * Math.PI) / 180; // V2: from its locked jaws and hooked fore legs the body angles down and away from the stem (~33 deg off plumb), as in the photos
export const rigidAt = (a: number) => {
  const O = sub2(BITE, rot2(mandTipAxis(HP_BITE), a));
  return rigidPose(O, a, HP_BITE);
};
/** the hanging angle after the release: a damped swing from the bite's lean to the hang */
export const hangAngle = (f: number) => {
  if (f <= T.release) return A_BITE;
  // V2: the swing starts from rest (no jolt at the release): (1 + t/tau) e^(-t/tau) cos(w t) has zero slope at t = 0
  const t = f - T.release;
  const tau = 7;
  const sw = (1 + t / tau) * Math.exp(-t / tau) * Math.cos(t * 0.2);
  return A_HANG + (A_BITE - A_HANG) * sw;
};
const blendSeg = (a: Seg, b: Seg, t: number): Seg => ({ p: lerp2(a.p, b.p, t), a: a.a + (b.a - a.a) * t });
export const bodyPoseAt = (f: number): BodyPose => {
  if (f < T.turn[0]) return pathPose(sAt(f));
  if (f < T.release) {
    const e = sstep(lin(f, T.turn[0], T.turn[1]));
    const pp = pathPose(sAt(f));
    const rb = rigidAt(A_BITE);
    return { head: blendSeg(pp.head, rb.head, e), meso: blendSeg(pp.meso, rb.meso, e), pet: blendSeg(pp.pet, rb.pet, e), gaster: blendSeg(pp.gaster, rb.gaster, e) };
  }
  return rigidAt(hangAngle(f));
};
/** a point given in a segment's local (unscaled) coordinates, in the world */
export const segPoint = (s: Seg, q: P2): P2 => add2(s.p, rot2(mul2(q, ANT_S), s.a));
/** the body's dorsal direction at a segment */
export const segDorsal = (s: Seg): P2 => rot2([0, -1], s.a);

// ---- the legs ------------------------------------------------------------------------------------------------------------
/** the gait: stride A (relative travel in stance), cycle LAMBDA = 2A of body travel, duty 0.5, alternating tripods */
export const STRIDE = 92;
export const LAMBDA = 2 * STRIDE;
export const LIFT = 34;
export type Toe = { p: [number, number, number]; tan: P2; nrm: P2; lift: number };
const toeOnSub = (sigma: number, side: number): Toe => {
  const sb = substrateAt(sigma);
  const z = side * (sb.stem ? 30 : 50);
  const X = sb.stem ? XS + (STEM.R - Math.sqrt(Math.max(0, STEM.R * STEM.R - z * z))) : sb.p[0];
  return { p: [X, sb.p[1], z], tan: sb.tan, nrm: sb.nrm, lift: 0 };
};
/** V2: a foothold chosen from where the leg's HIP will be at mid-stance: offset along the body to the toe's home,
 *  down onto the substrate, then the nearest point of the floor or the stem (so in the inside corner the feet move
 *  over to the stem in step with the body instead of being left far behind on the floor) */
const HIP_U = [52 * 0.88, 4 * 0.88, -40 * 0.88];
const footholdAt = (pair: number, home: number, sStart: number, side: number): Toe => {
  const sm = sStart + STRIDE / 2;
  const hp = pathAt(sm + HIP_U[pair]);
  const ven: P2 = [-hp.t[1], hp.t[0]];
  const tgt: P2 = add2(add2(hp.p, mul2(hp.t, home - HIP_U[pair])), mul2(ven, HB));
  const dFloor = Math.abs(tgt[1]);
  const dStem = Math.abs(XS - tgt[0]);
  const onStem = tgt[1] < -1 && (tgt[0] > XS - 1 || dStem < dFloor);
  const z = side * (onStem ? 30 : 50);
  if (onStem) {
    const X = XS + (STEM.R - Math.sqrt(Math.max(0, STEM.R * STEM.R - z * z)));
    return { p: [X, Math.min(tgt[1], -6), z], tan: [0, -1], nrm: [-1, 0], lift: 0 };
  }
  return { p: [Math.min(tgt[0], XS - 6), 0, z], tan: [1, 0], nrm: [0, -1], lift: 0 };
};
void toeOnSub;
/** the toe of a leg while walking / climbing at body arc s (stance: planted; swing: lifted along an arc) */
export const gaitToe = (leg: (typeof LEGS)[number], s: number): Toe => {
  const x = s / LAMBDA + leg.ph;
  const c = Math.floor(x);
  const ph = x - c;
  const sc = (c - leg.ph) * LAMBDA; // the s at this cycle's stance start
  const plant = (sStart: number) => footholdAt(leg.pair, leg.home, sStart, leg.side);
  if (ph < 0.5) return plant(sc);
  const u = sstep((ph - 0.5) / 0.5);
  const a = plant(sc);
  const b = plant(sc + LAMBDA);
  // V2: a step from the floor onto the stem goes round the outside of the corner (a curve through the floor-stem
  // joint), not through the air under the body
  const cross = a.nrm[1] < -0.5 && b.nrm[0] < -0.5;
  if (cross) {
    const C: [number, number] = [XS - 8, -8];
    const q0 = (1 - u) * (1 - u);
    const q1 = 2 * u * (1 - u);
    const q2 = u * u;
    const nrm: P2 = [lerp(a.nrm[0], b.nrm[0], u), lerp(a.nrm[1], b.nrm[1], u)];
    const tan: P2 = [lerp(a.tan[0], b.tan[0], u), lerp(a.tan[1], b.tan[1], u)];
    const lift = 14 * Math.pow(Math.sin(Math.PI * u), 2);
    return { p: [q0 * a.p[0] + q1 * C[0] + q2 * b.p[0] + nrm[0] * lift, q0 * a.p[1] + q1 * C[1] + q2 * b.p[1] + nrm[1] * lift, lerp(a.p[2], b.p[2], u)], tan, nrm, lift };
  }
  const p: [number, number, number] = [lerp(a.p[0], b.p[0], u), lerp(a.p[1], b.p[1], u), lerp(a.p[2], b.p[2], u)];
  const nrm: P2 = [lerp(a.nrm[0], b.nrm[0], u), lerp(a.nrm[1], b.nrm[1], u)];
  const tan: P2 = [lerp(a.tan[0], b.tan[0], u), lerp(a.tan[1], b.tan[1], u)];
  const lift = LIFT * Math.pow(Math.sin(Math.PI * u), 2); // V2: sin^2, so the foot leaves and lands with no jerk
  return { p: [p[0] + nrm[0] * lift, p[1] + nrm[1] * lift, p[2]], tan, nrm, lift };
};
/** the splayed, still legs of the dead ant: the toe in meso-local (unscaled) coordinates */
// r1: limp: every leg hangs down (- x along a hanging body) and fans outward, none near the stem
// V2: the dead legs (meso-local toes). The fore legs are hooked onto the leaf (their toes are placed on the leaf in
// ZombieAnt.tsx, these values only seed them); the mid and hind legs splay wide and stiff, as in the photos.
export const SPLAY: Record<LegId, P2> = {
  L1: [150, -40],
  R1: [140, 60],
  L2: [40, 196],
  R2: [96, 168],
  L3: [-150, 200],
  R3: [-236, 120],
};
export const RELEASE: Record<LegId, number> = { L1: 0, R1: 1, L2: 2, R2: 3, L3: 4, R3: 5 };
export const RELEASE_LEN = 7;
