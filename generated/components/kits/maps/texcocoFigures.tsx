// ---------------------------------------------------------------------------
// texcocoFigures: the engraved cast of the "Texcoco" clip (Dwarkesh Patel with
// Si Sheppard, Oct 2026): Moctezuma, the two brothers of Texcoco, the royal
// diadem of Texcoco (the ONLY orange thing) and a conquistador captain.
// The Emperor's manner (stringsFigures / breakTurnFigure): the cream form on a
// dark casing, a firm dark outline, tapered limbs, bracelet strokes round the
// shaded side of every limb, hatched wedges under the folds; light from the
// upper left. Drawn to stand 700-800 px tall on screen.
//
// ONE RIG for the three Aztec figures (figure-local units: feet at (0, 0), up
// is negative y, a bare-headed man is ~310 units tall; world px = units x scale):
//   - the body is a volume with a YAW (0 = facing us, + pi / 2 = facing screen
//     right, - pi / 2 = facing screen left): its silhouette narrows to its
//     depth, the art on it (neckline, folds, the cloak's pattern) is carried
//     round the form, the shoulders and hips swing round the axis, the feet
//     point where he faces, the knees bend that way. Nothing is mirrored: a man
//     facing left shows his OTHER side (the knot on the far shoulder);
//   - the head has its own yaw (absolute), a roll and a pitch; the face is
//     projected (near eye wide, far eye closing, the nose leaving the contour);
//   - arms are two-bone IK to wrist targets, legs IK to ankle targets (a walk
//     is just ankle targets: texcocoShared's walkPose).
// Draw inside a WorldSvg (world px). EXPORTS: Moctezuma, Brother, Diadem,
// Spaniard, Figure, figureRig, figureAnchors, SPECS, STAND, lerpFig.
// ---------------------------------------------------------------------------
import React from "react";
import { ACCENT, ACCENT_DEEP, DARK, INK, hash, type P2 } from "./incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "./stringsMotion";

// ---------------------------------------------------------------------------
// INK
// ---------------------------------------------------------------------------
export type Ink = { main: string; deep: string; hair: string };
export const CREAM: Ink = { main: INK, deep: "#D3C5A2", hair: "#8C7F60" };
export const ORANGE: Ink = { main: ACCENT, deep: ACCENT_DEEP, hair: "#B87108" };

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
type Map = (p: P2) => P2;
const ID: Map = (p) => p;
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const segD = (segs: Seg[], m: Map = ID) =>
  segs
    .map(([a, b]) => {
      const p = m(a);
      const q = m(b);
      return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 0.8 ? "" : `M${P(p)}L${P(q)}`;
    })
    .join("");
const polyD = (pts: P2[], m: Map = ID, close = false) => `M${pts.map((p) => P(m(p))).join("L")}${close ? "Z" : ""}`;
/** split segments so a mapping can bend them */
const subdivide = (segs: Seg[], n: number): Seg[] => segs.flatMap(([a, b]) => Array.from({ length: n }, (_, i): Seg => [mix2(a, b, i / n), mix2(a, b, (i + 1) / n)]));

/** hand-cut hatching: parallel strokes at `ang` deg filling the rect, each a
 *  hair off its place and ragged at both ends (clip it to the form it shades) */
const hatchSegs = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28): Seg[] => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  const out: Seg[] = [];
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.5;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    let t0 = -R;
    let t1 = R;
    if (Math.abs(dx) > 1e-6) {
      const a = (x0 - px) / dx;
      const b = (x1 - px) / dx;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (px < x0 || px > x1) continue;
    if (Math.abs(dy) > 1e-6) {
      const a = (y0 - py) / dy;
      const b = (y1 - py) / dy;
      t0 = Math.max(t0, Math.min(a, b));
      t1 = Math.min(t1, Math.max(a, b));
    } else if (py < y0 || py > y1) continue;
    const span = t1 - t0;
    if (span < 3) continue;
    t0 += hash(i, seed + 7) * rag * span;
    t1 -= hash(i, seed + 13) * rag * span;
    out.push([
      [px + dx * t0, py + dy * t0],
      [px + dx * t1, py + dy * t1],
    ]);
  }
  return out;
};
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => segD(hatchSegs(x0, y0, x1, y1, ang, gap, seed, rag));
/** a smooth closed outline through the points (Catmull-Rom) */
const smoothClosed = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${P([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${P([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${P(p2)}`;
  }
  return `${d}Z`;
};
/** a tapered limb through stations [point, width]: one smooth outlined form */
type St = [P2, number];
const limbD = (st: St[]) => {
  const n = st.length;
  const L: P2[] = [];
  const R: P2[] = [];
  let last: P2 = [0, 1];
  for (let i = 0; i < n; i++) {
    const a = st[Math.max(0, i - 1)][0];
    const b = st[Math.min(n - 1, i + 1)][0];
    const dv = sub(b, a);
    const u = vlen(dv) > 0.5 ? norm(dv) : last;
    last = u;
    const nr: P2 = [-u[1], u[0]];
    const h = st[i][1] / 2;
    L.push(add(st[i][0], mul(nr, h)));
    R.push(add(st[i][0], mul(nr, -h)));
  }
  const d0 = sub(st[1][0], st[0][0]);
  const d1 = sub(st[n - 1][0], st[n - 2][0]);
  const u0: P2 = vlen(d0) > 0.5 ? norm(d0) : [0, 1];
  const u1: P2 = vlen(d1) > 0.5 ? norm(d1) : [0, 1];
  return smoothClosed([...L, add(st[n - 1][0], mul(u1, st[n - 1][1] * 0.42)), ...R.reverse(), add(st[0][0], mul(u0, -st[0][1] * 0.42))]);
};
const bones = (S: P2, E: P2, W: P2, w: number[]): St[] => [
  [S, w[0]],
  [mix2(S, E, 0.42), w[1]],
  [E, w[2]],
  [mix2(E, W, 0.36), w[3]],
  [W, w[4]],
];
/** the engraver's bracelet shading: short curved strokes round the limb's shaded side */
const braceletD = (a: P2, b: P2, wa: number, wb: number, seed: number, gap = 3.1, reach = 1) => {
  const L = vlen(sub(b, a));
  if (L < 9) return "";
  const u = norm(sub(b, a));
  let n: P2 = [-u[1], u[0]];
  if (n[0] + n[1] * 0.6 < 0) n = [-n[0], -n[1]];
  let d = "";
  let i = 0;
  for (let t = 4; t < L - 3; t += gap, i++) {
    const tt = t / L;
    const c = mix2(a, b, tt);
    const w = mix(wa, wb, tt);
    const p0 = add(c, mul(n, w * (0.5 - reach * (0.44 - 0.2 * hash(i, seed)))));
    const p1 = add(c, mul(n, w / 2 - 0.7));
    d += `M${P(p0)}Q${P(add(mix2(p0, p1, 0.5), mul(u, 1.7)))} ${P(p1)}`;
  }
  return d;
};
const quad = (a: P2, c: P2, b: P2, t: number): P2 => mix2(mix2(a, c, t), mix2(c, b, t), t);
const foldHatchSegs = (a: P2, c: P2, b: P2, seed: number, len = 11, step = 0.04): Seg[] => {
  const out: Seg[] = [];
  let i = 0;
  for (let t = 0.16; t < 0.97; t += step, i++) {
    const p = quad(a, c, b, t);
    const l = (2.5 + len * t) * (0.55 + 0.75 * hash(i, seed));
    out.push([p, [p[0] + l * 0.86, p[1] + l * 0.5]]);
  }
  return out;
};
/** two-bone IK; the middle joint goes to the side `hint` points at; the target is clamped to the reach */
const ik2 = (S: P2, W: P2, L1: number, L2: number, hint: P2) => {
  let d = sub(W, S);
  let L = vlen(d);
  const maxL = L1 + L2 - 0.5;
  let w = W;
  if (L > maxL) {
    w = add(S, mul(d, maxL / L));
    d = sub(w, S);
    L = maxL;
  }
  if (L < 1) return { mid: add(S, [0, L1]), end: w };
  const u = mul(d, 1 / L);
  const a = (L1 * L1 - L2 * L2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const n: P2 = [-u[1], u[0]];
  const b = clamp1((n[0] * hint[0] + n[1] * hint[1]) * 3);
  return { mid: add(S, add(mul(u, a), mul(n, h * b))), end: w };
};
/** two outlines with matching points, blended by how far the thing is turned; mirrored when it faces left */
const blendYaw = (front: P2[], prof: P2[], yaw: number): P2[] => {
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  return front.map((f, i) => {
    const p = mix2(f, prof[i], t);
    return s < 0 ? [-p[0], p[1]] : p;
  });
};
// a dark casing round the whole figure, so it reads on the umber page
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1.5, children }) => (
  <>
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="fat" />
      <feGaussianBlur in="fat" stdDeviation={r * 0.45} result="soft" />
      <feFlood floodColor={DARK} floodOpacity={0.62} />
      <feComposite in2="soft" operator="in" result="case" />
      <feMerge>
        <feMergeNode in="case" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <g filter={`url(#${id})`}>{children}</g>
  </>
);

// ---------------------------------------------------------------------------
// THE BODY AS A VOLUME: an elliptical column (half-width A, half-depth B)
// turned by theta in (- pi / 2, pi / 2); the art drawn on its front goes round
// ---------------------------------------------------------------------------
const surface = (theta: number, A: number, B: number) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const wf = Math.hypot(A * c, B * s) / A;
  const term = Math.atan2(A * c, B * s); // the edge the surface goes over on screen right (the left one is term - pi)
  const flat = Math.abs(s) < 1e-6;
  /** a point of the front surface, given as drawn from the front */
  const mF: Map = (p) => {
    if (flat) return p;
    const xc = clamp1(p[0] / A) * A;
    const ph = Math.max(term - Math.PI, Math.min(Math.asin(xc / A), term));
    return [A * Math.sin(ph) * c + B * Math.cos(ph) * s + (p[0] - xc) * wf, p[1]];
  };
  /** is this front point still on the side we see */
  const seen = (x: number) => {
    const ph = Math.asin(clamp1(x / A));
    return ph < term - 0.3 && ph > term - Math.PI + 0.3;
  };
  /** a point of the silhouette: it keeps its side of the figure */
  const side: Map = (p) => [p[0] * wf, p[1]];
  /** a joint on the body's axis plane: it goes round with the body */
  const joint: Map = (p) => [p[0] * c, p[1]];
  return { c, s, wf, mF, side, joint, seen };
};

// ---------------------------------------------------------------------------
// THE CAST'S BUILDS
// ---------------------------------------------------------------------------
export type Spec = {
  /** the cloak's half-width and the shoulders' half-width (units) */
  a: number;
  hw: number;
  /** hip to shoulder line */
  H: number;
  /** the hips above the ground (< 0) */
  hipY: number;
  /** the cloak's hem below the hips */
  hem: number;
  /** limb thickness */
  limb: number;
  headScale: number;
  hair: "jaw" | "long" | "topknot" | "cropped";
  /** his own cream diadem (Moctezuma) */
  ownDiadem: boolean;
  plug: number;
  labret: boolean;
  aged: boolean;
  cloak: "net" | "fret" | "bands";
  arm: [number, number];
  leg: [number, number];
  /** a conquistador: cuirass, breeches, morion, beard; and what he carries */
  spaniard?: "sword" | "banner";
};
export const SPECS = {
  /** Moctezuma: taller and broader, the xiuhuitzolli, the netted royal cloak to the calf */
  moctezuma: { a: 64, hw: 50, H: 100, hipY: -156, hem: 96, limb: 1.08, headScale: 1.12, hair: "jaw", ownDiadem: true, plug: 5.6, labret: true, aged: true, cloak: "net", arm: [62, 58], leg: [72, 70] } as Spec,
  /** brother 0 (the one who is crowned): long hair, a broad fret-bordered cloak */
  brother0: { a: 57, hw: 45, H: 93, hipY: -150, hem: 74, limb: 1, headScale: 1.09, hair: "long", ownDiadem: false, plug: 4.2, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [69, 67] } as Spec,
  /** brother 1 (the one passed over): leaner and a little taller, the warrior's topknot, a banded cloak */
  brother1: { a: 51, hw: 43, H: 96, hipY: -156, hem: 76, limb: 0.94, headScale: 1.07, hair: "topknot", ownDiadem: false, plug: 4.2, labret: false, aged: false, cloak: "bands", arm: [60, 56], leg: [72, 70] } as Spec,
};
/** a conquistador captain (variant 0: hand on his sword; 1: the banner-bearer) */
const SPANIARD: Spec = { a: 56, hw: 46, H: 96, hipY: -152, hem: 0, limb: 1.02, headScale: 1.08, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: true, cloak: "net", arm: [60, 56], leg: [70, 68], spaniard: "sword" };
export const SPANIARDS: [Spec, Spec] = [SPANIARD, { ...SPANIARD, a: 60, hw: 48, limb: 1.08, spaniard: "banner" }];
export type SpecName = keyof typeof SPECS;

// ---------------------------------------------------------------------------
// THE POSE
// ---------------------------------------------------------------------------
export type ArmPose = {
  /** the wrist's target, figure-local units */
  w: P2;
  /** the side the elbow goes to (a direction) */
  elbow: P2;
  /** 1 = closed fist, 0 = open hand */
  fist: number;
  /** the hand's angle off the forearm, deg */
  hand: number;
};
export type FigPose = {
  /** the body's yaw, rad: 0 front, + = facing screen right */
  yaw: number;
  /** the head's yaw (absolute), rad */
  headYaw: number;
  /** head roll, deg (+ = clockwise) and pitch, deg (+ = chin down) */
  roll: number;
  pitch: number;
  /** torso lean about the hips, deg (+ = toward screen right) */
  lean: number;
  /** the hips drop this many units (the knees give) */
  crouch: number;
  /** L = the arm on screen LEFT when he faces us (his own right) */
  armL: ArmPose;
  armR: ArmPose;
  /** ankle offsets from the standing place (units) and the feet's pitch, deg (+ = heel up when facing right) */
  footL: P2;
  footR: P2;
  liftL: number;
  liftR: number;
  /** face: brow -1 (lifted, open) .. 1 (knit), lids 0 (open) .. 1 (shut), mouth -1 (turned down) .. 1 */
  brow: number;
  lids: number;
  mouth: number;
  /** the cloak's hem swung this many units to screen right */
  hem: number;
};
const lerpArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({ w: mix2(a.w, b.w, t), elbow: mix2(a.elbow, b.elbow, t), fist: mix(a.fist, b.fist, t), hand: mix(a.hand, b.hand, t) });
export const lerpFig = (a: FigPose, b: FigPose, t: number): FigPose => ({
  yaw: mix(a.yaw, b.yaw, t),
  headYaw: mix(a.headYaw, b.headYaw, t),
  roll: mix(a.roll, b.roll, t),
  pitch: mix(a.pitch, b.pitch, t),
  lean: mix(a.lean, b.lean, t),
  crouch: mix(a.crouch, b.crouch, t),
  armL: lerpArm(a.armL, b.armL, t),
  armR: lerpArm(a.armR, b.armR, t),
  footL: mix2(a.footL, b.footL, t),
  footR: mix2(a.footR, b.footR, t),
  liftL: mix(a.liftL, b.liftL, t),
  liftR: mix(a.liftR, b.liftR, t),
  brow: mix(a.brow, b.brow, t),
  lids: mix(a.lids, b.lids, t),
  mouth: mix(a.mouth, b.mouth, t),
  hem: mix(a.hem, b.hem, t),
});
/** standing, facing us, arms at his sides */
export const STAND: FigPose = {
  yaw: 0,
  headYaw: 0,
  roll: 0,
  pitch: 0,
  lean: 0,
  crouch: 0,
  armL: { w: [-58, -150], elbow: [-0.5, 1], fist: 0.25, hand: 0 },
  armR: { w: [58, -150], elbow: [0.5, 1], fist: 0.25, hand: 0 },
  footL: [0, 0],
  footR: [0, 0],
  liftL: 0,
  liftR: 0,
  brow: 0,
  lids: 0,
  mouth: 0,
  hem: 0,
};

/** the captains' standing poses: 0 = left hand on the pommel, 1 = right hand on the staff (it stands 76 units to his screen right) */
export const SPANIARD_STAND: [FigPose, FigPose] = [
  { ...STAND, armL: { w: [-36, -176], elbow: [-1, 0.2], fist: 0.75, hand: 30 }, armR: { w: [60, -148], elbow: [0.6, 1], fist: 0.4, hand: 0 }, brow: 0.3 },
  { ...STAND, armL: { w: [-60, -148], elbow: [-0.6, 1], fist: 0.4, hand: 0 }, armR: { w: [73, -168], elbow: [0.5, 1], fist: 1, hand: -30 }, brow: 0.3 },
];

// ---------------------------------------------------------------------------
// THE RIG (figure-local units)
// ---------------------------------------------------------------------------
const HEAD_UP = 31;
export type FigRig = ReturnType<typeof figureRig>;
export const figureRig = (sp: Spec, q: FigPose) => {
  const c = Math.cos(q.yaw);
  const s = Math.sin(q.yaw);
  const hip: P2 = [0, sp.hipY + q.crouch];
  /** torso-local (the hips at (0, 0), the spine up - y) to figure-local */
  const toFig = (p: P2): P2 => add(hip, rot(p, q.lean));
  const shY = -sp.H - 3;
  const neck = toFig([0, shY]);
  const hc = Math.cos(q.headYaw);
  const hs = Math.sin(q.headYaw);
  const nodF = clamp1(q.pitch / 22) * hc * hc;
  const headAngle = q.lean * 0.5 + q.roll + q.pitch * hs;
  const headC = add(add(neck, rot([0, -(HEAD_UP - 8 * Math.max(0, nodF)) * (sp.headScale / 1.1)], q.lean * 0.7 + q.roll * 0.45 + q.pitch * hs * 0.4)), [5 * hs * sp.headScale, 0]);
  const arm = (sgn: number, ap: ArmPose) => {
    const S = toFig([sgn * sp.hw * c, shY + 2]);
    const { mid: E, end: W } = ik2(S, ap.w, sp.arm[0], sp.arm[1], ap.elbow);
    const f = sub(W, E);
    const dir = rot(vlen(f) > 2 ? norm(f) : [0, 1], ap.hand);
    return { S, E, W, dir, fist: ap.fist, sgn, z: -sgn * s, grip: add(W, mul(dir, 11 * sp.limb)) };
  };
  const leg = (sgn: number, off: P2, lift: number) => {
    const H: P2 = [sgn * 17 * c * (sp.a / 60), hip[1] + 2];
    const A: P2 = [sgn * 21 * c * (sp.a / 60) + off[0], -15 + off[1]];
    const { mid: K, end } = ik2(H, A, sp.leg[0], sp.leg[1], [s * 1.2 + sgn * 0.2 * c, 0.02]);
    return { H, K, A: end, sgn, lift, z: -sgn * s };
  };
  return {
    c,
    s,
    hip,
    toFig,
    shY,
    neck,
    headC,
    headAngle,
    hc,
    hs,
    nodF,
    armL: arm(-1, q.armL),
    armR: arm(1, q.armR),
    legL: leg(-1, q.footL, q.liftL),
    legR: leg(1, q.footR, q.liftR),
  };
};
/** his anchors in WORLD px (at = his feet, scale = px per unit) */
export const figureAnchors = (sp: Spec, q: FigPose, at: P2, scale: number) => {
  const r = figureRig(sp, q);
  const w = (v: P2): P2 => add(at, mul(v, scale));
  return {
    rig: r,
    headC: w(r.headC),
    /** the head's frame: draw a <Diadem {...crown} /> and it sits on his brow */
    crown: { at: w(r.headC), rot: r.headAngle, yaw: q.headYaw, scale: scale * sp.headScale },
    headTop: w(add(r.headC, rot([0, -27 * sp.headScale], r.headAngle))),
    shoulderL: w(r.armL.S),
    shoulderR: w(r.armR.S),
    wristL: w(r.armL.W),
    wristR: w(r.armR.W),
    handL: w(r.armL.grip),
    handR: w(r.armR.grip),
    chest: w(r.toFig([0, -sp.H * 0.7])),
    hip: w(r.hip),
    feet: at,
  };
};
/** a world point as a wrist target for a figure standing at `at` */
export const toLocal = (world: P2, at: P2, scale: number): P2 => [(world[0] - at[0]) / scale, (world[1] - at[1]) / scale];

// ---------------------------------------------------------------------------
// THE HAND
// ---------------------------------------------------------------------------
type ArmRig = FigRig["armL"];
const Hand: React.FC<{ a: ArmRig; k: number; ink: Ink }> = ({ a, k, ink }) => {
  const { W, dir: d, fist: f, sgn } = a;
  const n: P2 = [-d[1], d[0]];
  const open = 1 - f;
  const at = (along: number, across: number): P2 => add(W, add(mul(d, along * k), mul(n, across * k)));
  // the thumb sits on the body's side of the hand (up, when the hand lies level)
  const ts = Math.abs(n[0]) > 0.25 ? (n[0] * -sgn >= 0 ? 1 : -1) : n[1] < 0 ? 1 : -1;
  const fingers = [0, 1, 2, 3].map((j) => {
    const b = at(14, (j - 1.5) * 5);
    const fd = rot(d, (j - 1.5) * 6 * open * ts);
    const L = (3.4 + [13, 16.5, 15.5, 11.5][ts > 0 ? j : 3 - j] * open) * k;
    return limbD([
      [add(b, mul(fd, -3 * k)), 5.5 * k],
      [add(b, mul(fd, L * 0.55)), 5.2 * k],
      [add(b, mul(fd, L)), 4.1 * k],
    ]);
  });
  const tb = at(6, ts * 8.4);
  const td = rot(d, ts * (12 + 32 * open));
  const thumb = limbD([
    [add(tb, mul(td, -4 * k)), 6.6 * k],
    [add(tb, mul(td, (3 + 4 * open) * k)), 5.8 * k],
    [add(tb, mul(td, (6 + 8.5 * open) * k)), 4.5 * k],
  ]);
  const palm = smoothClosed([at(0, -8.2), at(7, -10.8), at(15, -10.2), at(17, 0), at(15, 10.2), at(7, 10.8), at(0, 8.2)]);
  return (
    <g>
      {fingers.map((fd, j) => (
        <path key={j} d={fd} fill={ink.main} {...OUT} strokeWidth={1.9} />
      ))}
      <path d={palm} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={braceletD(at(1, 0), at(15, 0), 19 * k, 19 * k, 91, 2.8)} {...ln(0.9, 0.5)} />
      {/* the finger joints of an open hand, the knuckles of a fist */}
      {open > 0.5 ? <path d={[-1, 0, 1].map((j) => `M${P(at(13.2, j * 5))}L${P(at(17.5, j * 5))}`).join("")} {...ln(1, 0.45 * (open - 0.5) * 2)} /> : null}
      <path d={thumb} fill={ink.main} {...OUT} strokeWidth={1.9} />
      {f > 0.5 ? <path d={[-1, 0, 1].map((j) => `M${P(at(9.5, j * 5))}L${P(at(16.5, j * 5))}`).join("")} {...ln(1.2, 0.75 * (f - 0.5) * 2)} /> : null}
      {/* the wrist band */}
      <path d={limbD([[at(-3.4, -8.4), 5 * k], [at(-3.4, 8.4), 5 * k]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(at(-3.4, -4))}L${P(at(-3.4, 4))}`} {...ln(0.9, 0.55)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE DIADEM (xiuhuitzolli): the band round the brow and the pointed mosaic
// plate rising at the front; from the side the plate stands over the forehead
// and the band ties behind in a knot with two hanging ends. Head-local units.
// ---------------------------------------------------------------------------
const DIA_F: P2[] = [[-24, -9.5], [0, -16.5], [24, -9.5], [24.6, -22], [0, -29], [-24.6, -22], [-19.5, -22.6], [0, -61], [19.5, -22.6], [0, -28.4]];
const DIA_P: P2[] = [[-25.5, -9], [0, -7.5], [22.6, -9.4], [22.8, -21.5], [0, -20.4], [-25.6, -21], [-10, -20.6], [17.5, -63], [23.4, -21.4], [7, -20.2]];
const DiademArt: React.FC<{ yaw: number; ink: Ink; uid: string }> = ({ yaw, ink, uid }) => {
  const q = blendYaw(DIA_F, DIA_P, yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const BAND = `M${P(q[0])}Q${P(q[1])} ${P(q[2])}L${P(q[3])}Q${P(q[4])} ${P(q[5])}Z`;
  // the plate's sides swell a little; from the side its front edge stands nearly upright
  const bulge = (a: P2, b: P2, k: number): P2 => {
    const m = mix2(a, b, 0.5);
    const d = sub(b, a);
    return [m[0] - d[1] * k, m[1] + d[0] * k];
  };
  const PLATE = `M${P(q[6])}Q${P(bulge(q[6], q[7], -0.05 * sg))} ${P(q[7])}Q${P(bulge(q[7], q[8], -0.05 * sg - 0.07 * s))} ${P(q[8])}Q${P(q[9])} ${P(q[6])}Z`;
  const inner = [mix2(q[6], q[9], 0.35), q[7], mix2(q[8], q[9], 0.35)].map((p, i) => mix2(p, mix2(mix2(q[6], q[8], 0.5), q[7], 0.33), i === 1 ? 0.2 : 0.3));
  const x0 = Math.min(q[6][0], q[8][0], q[7][0]) - 2;
  const x1 = Math.max(q[6][0], q[8][0], q[7][0]) + 2;
  // the knot behind the head (seen once he turns)
  const kx = sg * -25.5;
  const dk = sg * -1;
  return (
    <g>
      <clipPath id={`${uid}-pl`}>
        <path d={PLATE} />
      </clipPath>
      {t > 0.3 ? (
        <g opacity={c01((t - 0.3) * 4)}>
          <path d={limbD([[[kx, -15], 6], [[kx + dk * 3.5, -1], 6.4], [[kx + dk * 6, 13], 5.6], [[kx + dk * 5, 22], 3.2]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={limbD([[[kx, -15], 6], [[kx - dk * 2, 0], 6.4], [[kx - dk * 2.6, 11], 5.6], [[kx - dk * 1.6, 19], 3.2]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
          <path d={`M${kx + dk * 3},-4l${dk * 2},12M${kx - dk * 2},-2l${-dk * 0.6},10`} {...ln(0.9, 0.5)} />
        </g>
      ) : null}
      <path d={BAND} fill={ink.deep} {...OUT} />
      <path d={`M${P(mix2(q[0], q[5], 0.5))}Q${P(mix2(q[1], q[4], 0.5))} ${P(mix2(q[2], q[3], 0.5))}`} {...ln(1, 0.6)} />
      <path d={[0.1, 0.24, 0.38, 0.62, 0.76, 0.9].map((u) => `M${P(mix2(quad(q[0], q[1], q[2], u), quad(q[5], q[4], q[3], u), 0.12))}L${P(mix2(quad(q[0], q[1], q[2], u), quad(q[5], q[4], q[3], u), 0.42))}`).join("")} {...ln(1, 0.55)} />
      <path d={PLATE} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-pl)`}>
        <path d={hatchD(x0, -63, x1, -18, 62, 5.6, 31, 0) + hatchD(x0, -63, x1, -18, -62, 5.6, 32, 0)} {...ln(1.05, 0.72)} />
        <path d={hatchD(mix(x0, x1, 0.56), -63, x1, -18, 62, 2.8, 33, 0.1)} {...ln(0.85, 0.5)} />
      </g>
      <path d={`M${P(inner[0])}L${P(inner[1])}L${P(inner[2])}`} {...ln(1, 0.5)} />
      {t > 0.3 ? <circle cx={kx} cy={-15} r={4.8} fill={ink.deep} {...OUT} strokeWidth={1.9} opacity={c01((t - 0.3) * 4)} /> : null}
    </g>
  );
};
/** the royal diadem of Texcoco as a free object: ORANGE. `at` is where the middle
 *  of a face would be (pass a figure's `crown` anchor and it sits on his brow);
 *  scale = px per head unit; rot deg; yaw as a head's. */
export const Diadem: React.FC<{ at: P2; scale: number; rot?: number; yaw?: number; tone?: number; ink?: Ink; uid?: string }> = ({
  at,
  scale,
  rot: r = 0,
  yaw = 0,
  tone = 1,
  ink = ORANGE,
  uid = "dia",
}) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${r.toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
    <Cased id={`${uid}-case`} r={1.3}>
      <DiademArt yaw={yaw} ink={ink} uid={uid} />
    </Cased>
  </g>
);

// ---------------------------------------------------------------------------
// THE HEAD, at any yaw (head-local units: (0, 0) = the middle of the face)
// ---------------------------------------------------------------------------
const FACE_F: P2[] = [[0, -26], [8, -25], [14, -21], [18, -13], [19.5, -5], [19.5, 2], [19, 8], [18, 12], [16.5, 16], [14.5, 19.5], [11, 23], [5, 26.5], [-5, 26.5], [-11, 23], [-16.5, 16], [-19, 8], [-19.5, -2], [-18, -13], [-14, -21], [-8, -25]];
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];
const HAIR_F: P2[] = [[-20, 32], [-25.5, 22], [-27, 5], [-24, -14], [-17, -27], [0, -31], [17, -27], [24, -14], [27, 5], [25.5, 22], [20, 32], [13, 31], [16, 14], [17.5, 0], [16, -9], [8, -13.5], [0, -12.4], [-8, -13.5], [-16, -9], [-17.5, 0], [-16, 14], [-13, 31]];
const HAIR_P: P2[] = [[-24, 29], [-28, 18], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 24], [-13, 30]];
const BEARD_F: P2[] = [[-19, 4], [-18, 15], [-13, 26], [-5, 33.5], [0, 35], [5, 33.5], [13, 26], [18, 15], [19, 4], [14, 10], [8, 17.8], [0, 19.6], [-8, 17.8], [-14, 10]];
const BEARD_P: P2[] = [[-8, 3], [-9, 14], [-5, 24], [4, 31], [12, 36], [17, 34.5], [20.5, 29], [21, 23], [20, 19.6], [18, 19.6], [15, 20], [12, 19], [6, 14], [-1, 7]];
/** how far the hair falls below the jaw cut */
const hairPts = (kind: Spec["hair"], yaw: number) => {
  const drop = kind === "long" ? 10 : kind === "topknot" ? -5 : kind === "cropped" ? -15 : 0;
  const f = HAIR_F.map((p, i): P2 => ([0, 10, 11, 21].includes(i) ? [p[0], p[1] + drop] : [1, 9].includes(i) ? [p[0], p[1] + drop * 0.6] : p));
  const pr = HAIR_P.map((p, i): P2 => ([0, 21].includes(i) ? [p[0], p[1] + drop] : [1, 20].includes(i) ? [p[0], p[1] + drop * 0.55] : p));
  return blendYaw(f, pr, yaw);
};
type Face = { brow: number; lids: number; mouth: number };
const Head: React.FC<{ sp: Spec; yaw: number; nod: number; face: Face; crowned: number; uid: string; ink: Ink }> = ({ sp, yaw, nod, face, crowned, uid, ink }) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const fy = 5 * nod;
  /** a point of the face, drawn from the front at (fx, fy), standing D in front of the head's axis */
  const pr = (fx: number, y: number, D: number, k = 1): P2 => [fx * c + D * s, y + fy * k];
  /** how much of the far side of the face is left (side: -1 screen left, 1 right) */
  const vis = (side: number) => (side * sg > 0 && t > 0.02 ? c01((c - 0.2) / 0.32) : 1);
  const FACE = smoothClosed(blendYaw(FACE_F, FACE_P, yaw));
  const hair = hairPts(sp.hair, yaw);
  const HAIR = smoothClosed(hair);
  const hb = Math.max(...hair.map((p) => p[1]));
  const open = 1 - face.lids;
  const b = face.brow;
  const m = face.mouth;
  const eye = (sd: number) => {
    const v = vis(sd);
    if (v < 0.04) return null;
    const o = pr(sd * 13.8, -0.4, 8.5);
    const mid = pr(sd * 8.2, -0.6 - 4.6 * open + 2.4 * face.lids, 13);
    const inn = pr(sd * 3.2, 0.2, 14.5);
    const w = Math.abs(inn[0] - o[0]) / 10.6;
    const pu = pr(sd * 8.2, -0.4, 12.6 + 1.4 * t);
    const bo = pr(sd * 14.4, -6.8 + 2.4 * nod - 1.6 * b, 8.5);
    const bm = pr(sd * 8.6, -10 + nod - 0.6 * Math.abs(b), 13.4);
    const bi = pr(sd * 2.6, -5.4 - 3 * nod + 3 * b, 16.5);
    const u0 = pr(sd * 12.4, 0.8, 9.5);
    const u1 = pr(sd * 8, 3, 13);
    const u2 = pr(sd * 4.2, 1, 14.2);
    return (
      <g key={sd} opacity={v}>
        <path d={`M${P(bo)}Q${P(bm)} ${P(bi)}`} {...ln(2.5, 0.92)} />
        <path d={`M${P(o)}Q${P(mid)} ${P(inn)}`} {...ln(1.9, 0.92)} />
        {open > 0.3 ? (
          <>
            <path d={`M${P(u0)}Q${P(u1)} ${P(u2)}`} {...ln(0.9, 0.55 * open)} />
            <ellipse cx={pu[0]} cy={pu[1] + 0.1 + 0.8 * face.lids} rx={2.15 * Math.max(0.45, Math.min(1, w))} ry={2.15 * (0.55 + 0.45 * open)} fill={DARK} opacity={0.92} />
          </>
        ) : (
          <path d={`M${P(pr(sd * 11, 1.6, 10))}l${-sd * 1.4},1.9M${P(pr(sd * 7.4, 2.3, 13))}l0,2.2`} {...ln(0.9, 0.6)} />
        )}
      </g>
    );
  };
  // the nose: its ridge leaves the face as he turns
  const RF = 18.2;
  const o = -2.2 * clamp1(1 - yaw * 8);
  const nRoot: P2 = [RF * s * 0.94 + o * c, -4.6 + fy];
  const nTip: P2 = [(RF + 8.6) * s + o * 1.55 * c, 8.2 + fy];
  const nUnder: P2 = [(RF + 4.6) * s - o * 0.1 * c, 10.9 + fy];
  const nWing: P2 = [(RF - 3) * s - o * 2.1 * c, 8.2 + 1.6 * t + fy];
  const nWingIn: P2 = [(RF - 1.6) * s - o * 1.3 * c, 5.6 + t + fy];
  const nBack: P2 = [(RF - 3) * s + o * 0.2 * c, -2 + fy];
  const nC1: P2 = [nTip[0] + 0.2 + 0.3 * s, 10.7 + 0.3 * t + fy];
  const nC2: P2 = [mix(nUnder[0], nWing[0], 0.75 - 0.25 * t), 10.9 + 0.4 * t + fy];
  const nC3: P2 = [nWing[0] - 0.2 * (1 - t) - 1.4 * s, 6.2 + 1.3 * t + fy];
  // the mouth: two halves from the middle, the far one closing
  const mc = pr(0, 16 - 0.5 * nod, 20.4, 0.7);
  const half = (sd: number) => {
    const v = vis(sd);
    const q1 = pr(sd * 3.6, 14.7, 18.8, 0.7);
    const q2 = pr(sd * 8, 15.7 - 1.8 * m, 13.5, 0.7);
    const l1 = pr(sd * 4.4, 19.2, 15.5, 0.6);
    const l0 = pr(0, 20.9, 19.4, 0.6);
    return (
      <g key={sd} opacity={v}>
        <path d={`M${P(mc)}Q${P(q1)} ${P(q2)}`} {...ln(2, 0.92)} />
        <path d={`M${P(l0)}Q${P(mix2(l0, l1, 0.6))} ${P(l1)}`} {...ln(1.1, 0.62)} />
      </g>
    );
  };
  const ear = (sd: number) => {
    // the near ear comes round onto the side of the head; the far one goes
    const far = sd * sg > 0 && t > 0.02;
    const v = far ? c01((c - 0.8) / 0.15) : 1;
    if (v < 0.04 || (sp.plug <= 0 && (far || t < 0.2))) return null;
    const e = pr(sd * 20.6, 4, -5, 0);
    const w = far ? c : mix(0.55, 1, t);
    return (
      <g key={sd} opacity={v}>
        {t > 0.2 && !far ? (
          <>
            <ellipse cx={e[0]} cy={e[1]} rx={4.2 * w} ry={6.4} fill={ink.main} {...OUT} strokeWidth={1.9} />
            <path d={`M${(e[0] + sg * 1.6 * w).toFixed(1)},${e[1] - 3}q${(-sg * 3.4 * w).toFixed(1)},2.6 ${(-sg * 0.6 * w).toFixed(1)},6`} {...ln(1, 0.6)} />
          </>
        ) : null}
        {sp.plug > 0 ? (
          <>
            <circle cx={e[0]} cy={e[1] + 6.4} r={sp.plug * Math.max(0.55, w)} fill={far ? ink.deep : ink.main} {...OUT} strokeWidth={2} />
            <circle cx={e[0]} cy={e[1] + 6.4} r={sp.plug * 0.3} fill={DARK} opacity={0.72} />
          </>
        ) : null}
      </g>
    );
  };
  // the warrior's topknot: a bound column of hair on the crown
  const tk = -5 * s;
  const TOPKNOT = `M${tk - 7.5},-27C${tk - 8},-36 ${tk - 9},-41 ${tk - 13},-52Q${tk - 7},-58 ${tk},-55.5Q${tk + 7},-58.5 ${tk + 13},-52C${tk + 9},-41 ${tk + 8},-36 ${tk + 7.5},-27Z`;
  const labret = pr(0, 23.6, 19.6 + 1.6, 0.5);
  const cw = 5.2 + 14 * t;
  const BEARD = sp.spaniard ? smoothClosed(blendYaw(BEARD_F, BEARD_P, yaw).map((p): P2 => [p[0], p[1] + fy * 0.6])) : "";
  return (
    <g>
      <clipPath id={`${uid}-face`}>
        <path d={FACE} />
      </clipPath>
      <clipPath id={`${uid}-hair`}>
        <path d={HAIR} />
      </clipPath>
      {sp.hair === "topknot" ? (
        <>
          <clipPath id={`${uid}-tk`}>
            <path d={TOPKNOT} />
          </clipPath>
          <path d={TOPKNOT} fill={ink.hair} {...OUT} />
          <g clipPath={`url(#${uid}-tk)`}>
            <path d={hatchD(tk - 14, -60, tk + 14, -26, 90, 2.2, 71, 0.08)} {...ln(1.25, 0.85)} />
          </g>
          <path d={limbD([[[tk - 9.6, -38], 6.6], [[tk, -39], 6.8], [[tk + 9.6, -38], 6.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={`M${tk - 8},-38.6Q${tk},-39.8 ${tk + 8},-38.6`} {...ln(0.9, 0.55)} />
        </>
      ) : null}
      {t > 0.02 ? ear(sg) : null}
      <path d={FACE} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-face)`}>
        {/* the cheek away from the light, under the jaw, under the hairline */}
        <path d={hatchD(9 + 6 * s, -9 + fy, 27, 24, 114, 2.3, 24)} {...ln(0.95, 0.62 * (sg > 0 ? c : 1))} />
        <path d={hatchD(13 + 6 * s, -4, 27, 18, 58, 2.9, 25)} {...ln(0.85, 0.46 * (sg > 0 ? c : 1))} />
        <path d={hatchD(-16 + 10 * s, 22, 16 + 10 * s, 29, 4, 2, 26, 0.2)} {...ln(0.85, 0.5)} />
        <path d={hatchD(-22, -6, -14 + 4 * t, 16, 70, 2.8, 30, 0.3)} {...ln(0.8, 0.32 * (sg < 0 ? c : 1))} />
        {t > 0.3 ? <path d={hatchD(sg * -27, -2, sg * -27 + sg * 19, 26, sg > 0 ? 62 : 118, 2.5, 39, 0.3)} {...ln(0.85, 0.4 * c01((t - 0.3) * 3))} /> : null}
      </g>
      {/* the hair: black in the print, so dense with strokes */}
      <path d={HAIR} fill={ink.hair} {...OUT} />
      <g clipPath={`url(#${uid}-hair)`}>
        <path d={hatchD(-31, -32, 30, hb + 4, 88, 2.15, 21, 0.1)} {...ln(1.25, 0.82)} />
        <path d={hatchD(-31, 2, 30, hb + 4, 82, 3.4, 37, 0.3)} {...ln(1.1, 0.45)} />
      </g>
      {[-1, 1].map(eye)}
      {/* the nose */}
      {t > 0.12 ? <path d={`M${P(nRoot)}L${P(nTip)}L${P(nUnder)}L${P(nWing)}L${P(nBack)}Z`} fill={ink.main} /> : null}
      <path d={`M${P(nRoot)}L${P(nTip)}Q${P(nC1)} ${P(nUnder)}Q${P(nC2)} ${P(nWing)}Q${P(nC3)} ${P(nWingIn)}`} {...ln(1.7, 0.9)} />
      <path d={[0.22, 0.45, 0.68].map((u) => `M${P(add(mix2(nRoot, nTip, u), [-o * 1.5 * c - 3 * s, 0.6]))}l${(-o * 1.1 * c - 1.6 * s).toFixed(1)},1.4`).join("")} {...ln(0.85, 0.5)} />
      {[-1, 1].map(half)}
      <path d={`M${P(pr(-3, 23.4, 17, 0.4))}Q${P(pr(0, 22.3, 18.6, 0.4))} ${P(pr(3, 23.4, 17, 0.4))}`} {...ln(0.9, 0.42)} />
      {sp.aged
        ? [-1, 1].map((sd) => (
            <path key={sd} d={`M${P(pr(sd * 6.4, 9.4, 15.5))}Q${P(pr(sd * 9.6, 12.4, 13.5))} ${P(pr(sd * 10, 16.4, 11.5))}`} {...ln(1, 0.5 * vis(sd))} />
          ))
        : null}
      {sp.labret ? (
        <>
          <ellipse cx={labret[0]} cy={labret[1]} rx={3.1} ry={2.5} fill={ink.deep} {...OUT} strokeWidth={1.7} />
          <circle cx={labret[0]} cy={labret[1]} r={0.9} fill={DARK} opacity={0.7} />
        </>
      ) : null}
      {t > 0.02 ? ear(-sg) : [-1, 1].map(ear)}
      {sp.spaniard ? (
        <>
          {/* the beard and moustache; the morion: a combed dome on a boat of a brim */}
          <clipPath id={`${uid}-beard`}>
            <path d={BEARD} />
          </clipPath>
          <path d={BEARD} fill={ink.hair} {...OUT} />
          <g clipPath={`url(#${uid}-beard)`}>
            <path d={hatchD(-22, 0, 24, 38, 84, 2.1, 73, 0.12)} {...ln(1.2, 0.8)} />
          </g>
          {[-1, 1].map((sd) => (
            <path key={sd} d={limbD([[pr(0, 13.2, 20.8, 0.7), 4.6], [pr(sd * 5.5, 13.6, 17.5, 0.7), 4.8], [pr(sd * 10.5, 17.4, 12.5, 0.7), 2.6]])} fill={ink.hair} {...OUT} strokeWidth={1.6} opacity={vis(sd)} />
          ))}
          <g transform={`translate(${(-2.5 * s).toFixed(2)} 0)`}>
            <clipPath id={`${uid}-dome`}>
              <path d="M-23,-16C-24,-49 24,-49 23,-16Z" />
            </clipPath>
            <path d="M-23,-16C-24,-49 24,-49 23,-16Z" fill={ink.main} {...OUT} />
            <path d={`M${-cw},-25Q${-cw * 0.9},-58 0,-62Q${cw * 0.9},-58 ${cw},-25Q0,-${(33 + 8 * t).toFixed(1)} ${-cw},-25Z`} fill={ink.deep} {...OUT} strokeWidth={2} />
            <g clipPath={`url(#${uid}-dome)`}>
              <path d={hatchD(7, -46, 24, -16, 108, 2.5, 74)} {...ln(0.95, 0.6)} />
              <path d={hatchD(14, -40, 24, -16, 60, 3, 75)} {...ln(0.85, 0.45)} />
              <path d="M-23,-22.5Q0,-27 23,-22.5" {...ln(1.2, 0.7)} />
            </g>
            <path d="M-35,-29Q-24,-10.5 0,-9.4Q24,-10.5 35,-29Q23,-19.6 0,-19Q-23,-19.6 -35,-29Z" fill={ink.main} {...OUT} />
            <path d="M-27,-19.4Q-15,-13 0,-12.6Q15,-13 27,-19.4" {...ln(0.9, 0.5)} />
            <path d={hatchD(12, -19, 36, -9, 100, 2.4, 76, 0.15)} {...ln(0.85, 0.5)} />
            {[-12, 0, 12].map((x) => (
              <circle key={x} cx={x} cy={-21.6 - (1 - (x * x) / 400) * 2.2} r={1.25} fill={DARK} opacity={0.75} />
            ))}
          </g>
        </>
      ) : null}
      {sp.ownDiadem ? <DiademArt yaw={yaw} ink={ink} uid={`${uid}-od`} /> : null}
      {crowned > 0.003 ? (
        <g opacity={crowned}>
          <DiademArt yaw={yaw} ink={ORANGE} uid={`${uid}-cd`} />
        </g>
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FOOT: sandalled (the lord's cactli with its heel-piece), toes where he faces
// ---------------------------------------------------------------------------
const FOOT_F: P2[] = [[-6, 1], [6, 1], [10, 6.5], [12.5, 10.5], [12.6, 14], [11, 16.8], [0, 17.8], [-11, 16.8], [-12.6, 13], [-10, 6.5]];
const FOOT_P: P2[] = [[-6, 1], [6, 1], [14, 7.4], [24.5, 10.6], [28.5, 13.6], [26.5, 16.8], [8, 17.6], [-8.5, 16.8], [-10.6, 11], [-8.4, 4]];
const Foot: React.FC<{ A: P2; sgn: number; yaw: number; lift: number; k: number; ink: Ink; shoe?: boolean }> = ({ A, sgn, yaw, lift, k, ink, shoe = false }) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const out = sgn * 4.5 * c;
  const pts = blendYaw(FOOT_F, FOOT_P, yaw).map((p, i): P2 => (i < 2 ? p : [p[0] + out, p[1]]));
  const toe: P2 = [mix(out, sg * 26, t), 15.6];
  const tw = mix(4.6, 1.6, t);
  return (
    <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) rotate(${lift.toFixed(2)}) scale(${k.toFixed(3)})`}>
      <path d={smoothClosed(pts)} fill={shoe ? ink.deep : ink.main} {...OUT} strokeWidth={2.1} />
      {shoe ? (
        <>
          <path d={`M${P(pts[7])}Q${P([pts[6][0], pts[6][1] - 3.4])} ${P(pts[5])}`} {...ln(1.3, 0.75)} />
          <path d={`M-6.2,4.6Q${(toe[0] * 0.3).toFixed(1)},9 ${(toe[0] * 0.5 + 6.2 * (1 - t)).toFixed(1)},${(4.6 + 4 * t).toFixed(1)}`} {...ln(1.2, 0.7)} />
        </>
      ) : (
        <>
      {/* the sole, the toes, the straps, the heel-piece, the ankle tie */}
      <path d={`M${P(pts[7])}Q${P([pts[6][0], pts[6][1] - 3.4])} ${P(pts[5])}`} {...ln(1.3, 0.75)} />
      {c > 0.3 ? <path d={[-1.5, -0.5, 0.5, 1.5].map((j) => `M${(out + j * tw).toFixed(1)},16.2l0,-4.6`).join("")} {...ln(1, 0.7 * c01((c - 0.3) * 3))} /> : null}
      <path d={`M-6.4,3.4L${P([toe[0] * 0.82, mix(10.8, 11.6, t)])}L6.4,3.4`} {...ln(1.7, 0.85)} />
      {t > 0.35 ? <path d={`M${-sg * 10.8},9.6L${-sg * 3.4},3L${-sg * 2.2},14.4L${-sg * 9.4},14.6Z`} fill={ink.deep} {...OUT} strokeWidth={1.7} opacity={c01((t - 0.35) * 4)} /> : null}
      <path d="M-6.6,-1.5h13.2M-6.4,2.4h12.8" {...ln(1.5, 0.85)} />
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FIGURE
// ---------------------------------------------------------------------------
export type FigureProps = {
  spec: Spec;
  pose: FigPose;
  /** his feet, world px, and px per unit */
  at: P2;
  scale: number;
  tone?: number;
  uid: string;
  /** draw the body (default) and which arms: lay "L" / "R" over another figure with body={false} */
  body?: boolean;
  arms?: "both" | "L" | "R" | "none";
  /** 0..1 the orange diadem of Texcoco on his head */
  crowned?: number;
  ink?: Ink;
};
export const Figure: React.FC<FigureProps> = ({ spec: sp, pose: q, at, scale, tone = 1, uid, body = true, arms: which = "both", crowned = 0, ink = CREAM }) => {
  const r = figureRig(sp, q);
  const sf = surface(q.yaw, sp.a, sp.a * 0.58);
  const { mF, side, seen } = sf;
  const k = sp.limb;
  const a = sp.a;
  const shY = r.shY;
  // ---- torso-local frame: hips (0, 0), shoulders at y = shY -------------------
  const shL: P2 = [-sp.hw, shY];
  const shR: P2 = [sp.hw, shY];
  const neck: P2 = [0, shY];
  const hem = sp.hem;
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * hem * 0.3;
  const hemL: P2 = [-0.94 * a, hem + 1];
  const hemR: P2 = [0.9 * a, hem + 5];
  const hemC: P2 = [(hemL[0] + hemR[0]) / 2 + 3, hem + 13];
  const hemPt = (t: number, up = 0): P2 => {
    const p = quad(hemL, hemC, hemR, t);
    return [p[0], p[1] - up];
  };
  /** the cloth hangs: the lower it is, the more it swings with the hem */
  const swing = (p: P2): P2 => [p[0] + hdx * sstep((p[1] - shY - 30) / (hem - shY - 30)), p[1]];
  const cS: Map = (p) => swing(side(p));
  const cF: Map = (p) => swing(mF(p));
  const knot = add(shL, [9, -6]);
  const cloakA = add(shL, [-9, 5]);
  const cloakB = add(shR, [-3, 36]);
  const n0 = add(neck, [-8, 17]);
  const n1 = add(cloakB, [-34, -3]);
  const CLOAK =
    `M${P(side(cloakA))}L${P(mF(cloakA))}Q${P(mF(add(shL, [-4, -11])))} ${P(mF(knot))}` +
    `C${P(mF(n0))} ${P(mF(n1))} ${P(mF(cloakB))}L${P(side(cloakB))}` +
    `C${P(cS(add(cloakB, [9, 42])))} ${P(cS([hemR[0] + 5, hemR[1] - 70]))} ${P(cS(hemR))}` +
    `Q${P(cS(hemC))} ${P(cS(hemL))}` +
    `C${P(cS([hemL[0] - 7, hemL[1] - 68]))} ${P(cS(add(cloakA, [-10, 54])))} ${P(side(cloakA))}Z`;
  const folds = [0.07, 0.22, 0.38, 0.54, 0.7, 0.86].map((t, i) => {
    const fa = add(knot, [1 + t * 0.78 * a, 13 + t * 30 + 9 * hash(i, 41)]);
    const fb = hemPt(t, 12 + 24 * hash(i, 42));
    const fc: P2 = [mix(fa[0], fb[0], 0.28) + (t - 0.45) * 20, mix(fa[1], fb[1], 0.55)];
    return { a: fa, c: fc, b: fb };
  });
  const knotAt = mF(knot);
  const kd = Math.max(0.25, Math.abs(mF([knot[0] + 2, knot[1]])[0] - mF([knot[0] - 2, knot[1]])[0]) / 4);
  const TORSO = `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}L${P(side([28, 6]))}L${P(side([-28, 6]))}Z`;

  // ---- the conquistador's steel and what he carries ------------------------------
  const CUIR =
    `M${P(side([-sp.hw - 2, shY + 3]))}Q${P(side([-20, shY - 6]))} ${P(side([-10, shY - 3]))}Q${P(mF([0, shY + 9]))} ${P(side([10, shY - 3]))}Q${P(side([20, shY - 6]))} ${P(side([sp.hw + 2, shY + 3]))}` +
    `C${P(side([sp.hw - 4, shY + 40]))} ${P(side([32, -30]))} ${P(side([31, -10]))}L${P(side([39, 4]))}Q${P(mF([0, 10]))} ${P(side([-39, 4]))}L${P(side([-31, -10]))}C${P(side([-32, -30]))} ${P(side([-sp.hw + 4, shY + 40]))} ${P(side([-sp.hw - 2, shY + 3]))}Z`;
  const hilt = mF([-34, -4]);
  const POLE_X = 76;
  /** a point of the pennon: u along its fly (0 at the staff), v down its hoist; it waves with pose.hem */
  const fl2 = (u: number, v: number): P2 => [POLE_X + 2 + u * 118, -394 + v * 74 * (1 - 0.18 * u) + 9 * u + (5 + 0.9 * q.hem) * Math.sin(u * 5.2 + q.hem * 0.5) * u];
  const FLAG = `M${P(fl2(0, 0))}Q${P(fl2(0.25, -0.04))} ${P(fl2(0.5, 0))}T${P(fl2(1, 0.02))}L${P(fl2(0.74, 0.5))}L${P(fl2(1, 0.98))}Q${P(fl2(0.75, 1.04))} ${P(fl2(0.5, 1))}T${P(fl2(0, 1))}Z`;

  // ---- the cloak's own pattern -------------------------------------------------
  let pattern: React.ReactNode = null;
  if (sp.cloak === "net") {
    // the royal netted cloak: a lattice of diamonds, an eye in each; a band of eyes at the hem
    const lat = subdivide([...hatchSegs(-a - 8, shY, a + 8, hem + 16, 58, 21, 301, 0), ...hatchSegs(-a - 8, shY, a + 8, hem + 16, -58, 21, 302, 0)], 7);
    pattern = (
      <>
        <path d={segD(lat, cF)} {...ln(1.05, 0.4)} />
        <path d={`M${P(cF(hemPt(0, 14)))}Q${P(cF([hemC[0], hemC[1] - 14]))} ${P(cF(hemPt(1, 14)))}`} {...ln(1.4, 0.82)} />
        {Array.from({ length: 10 }, (_, i) => {
          const p = cF(hemPt((i + 0.5) / 10, 6.6));
          const w = Math.abs(cF(hemPt((i + 0.9) / 10, 6.6))[0] - cF(hemPt((i + 0.1) / 10, 6.6))[0]) / (0.8 * 0.184 * a);
          if (w < 0.14) return null;
          return (
            <g key={i}>
              <ellipse cx={p[0]} cy={p[1]} rx={3.3 * Math.min(1, w)} ry={3.3} {...ln(1.1, 0.75)} />
              <ellipse cx={p[0]} cy={p[1]} rx={1.1 * Math.min(1, w)} ry={1.1} fill={DARK} opacity={0.8} />
            </g>
          );
        })}
      </>
    );
  } else if (sp.cloak === "fret") {
    // a broad border of stepped frets at the hem
    const n = 8;
    const fret = Array.from({ length: n }, (_, i) => {
      const u = (v: number, up: number) => cF(hemPt((i + v) / n, up));
      return `M${P(u(0.12, 7.5))}L${P(u(0.12, 19.5))}L${P(u(0.8, 19.5))}L${P(u(0.8, 11.5))}L${P(u(0.46, 11.5))}L${P(u(0.46, 15.5))}`;
    }).join("");
    pattern = (
      <>
        <path d={`M${P(cF(hemPt(0, 24)))}Q${P(cF([hemC[0], hemC[1] - 24]))} ${P(cF(hemPt(1, 24)))}`} {...ln(1.4, 0.82)} />
        <path d={`M${P(cF(hemPt(0, 3.6)))}Q${P(cF([hemC[0], hemC[1] - 3.6]))} ${P(cF(hemPt(1, 3.6)))}`} {...ln(1.1, 0.7)} />
        <path d={fret} {...ln(1.9, 0.86)} />
      </>
    );
  } else {
    // three dark bands across the cloth
    const band = (y0: number, y1: number, seed: number) => {
      const sag = (x: number, y: number): P2 => [x, y + 7 * (1 - (x / (a + 10)) ** 2)];
      const xs = [-1, -0.6, -0.2, 0.2, 0.6, 1].map((u) => u * (a + 10));
      const top = xs.map((x) => cF(sag(x, y0)));
      const bot = xs.map((x) => cF(sag(x, y1))).reverse();
      const hs = subdivide(hatchSegs(-a - 10, y0 + 1, a + 10, y1 + 8, 76, 3.1, seed, 0.12), 2).filter(([p, q2]) => p[1] > sag(p[0], y0)[1] - 1 && q2[1] < sag(q2[0], y1)[1] + 1);
      return (
        <g key={seed}>
          <path d={polyD([...top, ...bot], ID, true)} fill={ink.deep} stroke={DARK} strokeWidth={1.3} strokeOpacity={0.8} strokeLinejoin="round" />
          <path d={segD(hs, cF)} {...ln(1.05, 0.6)} />
        </g>
      );
    };
    pattern = (
      <>
        {band(shY + 44, shY + 57, 311)}
        {band(shY + 92, shY + 105, 312)}
        {band(hem - 12, hem + 1, 313)}
      </>
    );
  }

  // ---- limbs -------------------------------------------------------------------
  const legs = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);
  const drawLeg = (l: FigRig["legL"]) => {
    const calf = mix2(l.K, l.A, 0.34);
    const st: St[] = [
      [l.H, 21 * k],
      [mix2(l.H, l.K, 0.5), 19 * k],
      [l.K, 15 * k],
      [[calf[0] - r.s * 2 * k + l.sgn * 1.2 * r.c, calf[1]], 17.5 * k],
      [mix2(l.K, l.A, 0.82), 11.5 * k],
      [l.A, 10.5 * k],
    ];
    return (
      <g key={l.sgn}>
        <path d={limbD(st)} fill={ink.main} {...OUT} />
        <path d={braceletD(l.K, l.A, 17 * k, 11 * k, 81 + l.sgn, 2.9)} {...ln(0.95, 0.62)} />
        <path d={`M${P([l.K[0] - 5, l.K[1] + 1])}Q${P([l.K[0] + 2 * r.s, l.K[1] + 5])} ${P([l.K[0] + 5, l.K[1] + 1])}`} {...ln(1, 0.5)} />
        <Foot A={l.A} sgn={l.sgn} yaw={q.yaw} lift={l.lift} k={k} ink={ink} shoe={!!sp.spaniard} />
        {sp.spaniard ? (
          <>
            {/* the paned trunk hose, a garter under the knee */}
            <path d={limbD([[add(l.H, [0, -8]), 30 * k], [mix2(l.H, l.K, 0.28), 39 * k], [mix2(l.H, l.K, 0.56), 33 * k], [mix2(l.H, l.K, 0.68), 23 * k]])} fill={ink.deep} {...OUT} />
            <path d={[-0.3, 0, 0.3].map((u) => `M${P(add(mix2(l.H, l.K, 0.02), [u * 26 * k, 0]))}Q${P(add(mix2(l.H, l.K, 0.3), [u * 44 * k, 0]))} ${P(add(mix2(l.H, l.K, 0.64), [u * 22 * k, 0]))}`).join("")} {...ln(1.2, 0.7)} />
            <path d={braceletD(mix2(l.H, l.K, 0.05), mix2(l.H, l.K, 0.62), 34 * k, 30 * k, 95 + l.sgn, 3.2, 0.7)} {...ln(0.9, 0.5)} />
            <path d={limbD([[add(mix2(l.K, l.A, 0.1), [-8 * k, 0]), 4.6], [add(mix2(l.K, l.A, 0.1), [8 * k, 0]), 4.6]])} fill={ink.main} {...OUT} strokeWidth={1.7} />
          </>
        ) : null}
      </g>
    );
  };
  const drawArm = (ar: ArmRig) => {
    const fl = vlen(sub(ar.W, ar.E));
    const ul = vlen(sub(ar.E, ar.S));
    const dv = sub(ar.E, ar.S);
    const u: P2 = vlen(dv) > 0.5 ? norm(dv) : [0, 1];
    const n: P2 = [-u[1], u[0]];
    const cb = mix2(ar.S, ar.E, 0.56);
    const sl = sp.spaniard ? 1.3 : 1;
    return (
      <g key={ar.sgn}>
        <path d={limbD(bones(ar.S, ar.E, ar.W, (sp.spaniard ? [25, 26, 20, 20, 12.5] : [20, 19.5, 15, 16, 11]).map((w) => w * k)))} fill={sp.spaniard ? ink.deep : ink.main} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 19.5 * k * sl, 15 * k * sl, 85 + ar.sgn, 2.9) + (fl > 14 ? braceletD(ar.E, ar.W, 16 * k * sl, 11 * k, 87 + ar.sgn, 2.9) : "")} {...ln(0.95, 0.62)} />
        {sp.spaniard ? (
          <>
            {/* the slashed sleeve; the pauldron's lames over the shoulder */}
            <path d={[0.24, 0.5, 0.74].map((v) => `M${P(add(mix2(ar.S, ar.E, v), mul(n, -5 * k)))}l${P(mul(u, 9 * k))}`).join("") + [0.2, 0.46].map((v) => `M${P(add(mix2(ar.E, ar.W, v), mul(n, -4 * k)))}L${P(add(mix2(ar.E, ar.W, v + 0.2), mul(n, -3.4 * k)))}`).join("")} {...ln(1.3, 0.7)} />
            <path d={limbD([[add(ar.S, add(mul(n, -13 * k), mul(u, 6 * k))), 14 * k], [add(ar.S, mul(u, -3 * k)), 19 * k], [add(ar.S, add(mul(n, 13 * k), mul(u, 6 * k))), 14 * k]])} fill={ink.main} {...OUT} />
            <path d={`M${P(add(ar.S, add(mul(n, -13 * k), mul(u, 8 * k))))}Q${P(add(ar.S, mul(u, 1 * k)))} ${P(add(ar.S, add(mul(n, 13 * k), mul(u, 8 * k))))}`} {...ln(1, 0.6)} />
          </>
        ) : null}
        {ul > 30 && !sp.spaniard ? <path d={limbD([[add(cb, mul(n, -8.6 * k)), 5.8], [add(cb, mul(n, 8.6 * k)), 5.8]])} fill={ink.deep} {...OUT} strokeWidth={1.9} /> : null}
        <Hand a={ar} k={k} ink={ink} />
      </g>
    );
  };
  const arms = [r.armL, r.armR].sort((p, q2) => p.z - q2.z).filter((ar) => which === "both" || (which === "L" && ar.sgn < 0) || (which === "R" && ar.sgn > 0));
  const farBehind = Math.abs(r.s) > 0.5 && body && arms.length > 0 && arms[0].z < 0;
  const lean = q.lean;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const armsEl = <>{(farBehind ? arms.slice(1) : arms).map(drawArm)}</>;
  if (!body)
    return (
      <g transform={tf} opacity={tone}>
        <Cased id={`${uid}-acase`}>{armsEl}</Cased>
      </g>
    );
  return (
    <g transform={tf} opacity={tone}>
      <Cased id={`${uid}-case`}>
        {farBehind ? drawArm(arms[0]) : null}
        {sp.spaniard === "sword" ? (
          <g transform={`translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${lean.toFixed(2)})`}>
            <path d={limbD([[add(hilt, [1, 2]), 8], [add(hilt, [-16, 62]), 7], [add(hilt, [-33, 124]), 4.4]])} fill={ink.deep} {...OUT} />
            <path d={`M${P(add(hilt, [-1, 12]))}L${P(add(hilt, [-31, 120]))}`} {...ln(0.9, 0.55)} />
          </g>
        ) : null}
        {sp.spaniard === "banner" ? (
          <>
            {/* the banner: a swallow-tailed pennon with the saltire, on a tall staff */}
            <path d={limbD([[[POLE_X, 4], 5.6], [[POLE_X, -200], 5.6], [[POLE_X, -398], 4.6]])} fill={ink.deep} {...OUT} />
            <path d={`M${POLE_X},-398l-5.4,-12q5.4,-17 5.4,-22q0,5 5.4,22Z`} fill={ink.main} {...OUT} strokeWidth={1.9} />
            <path d={FLAG} fill={ink.main} {...OUT} />
            <path d={`M${P(fl2(0.1, 0.14))}L${P(fl2(0.62, 0.86))}M${P(fl2(0.1, 0.86))}L${P(fl2(0.62, 0.14))}`} {...ln(2.6, 0.8)} />
            <path d={[0.3, 0.55, 0.8].map((v) => `M${P(fl2(v, 0.06))}Q${P(fl2(v + 0.03, 0.5))} ${P(fl2(v, 0.94))}`).join("")} {...ln(0.9, 0.4)} />
          </>
        ) : null}
        {legs.map(drawLeg)}
        <g transform={`translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${lean.toFixed(2)})`}>
          <clipPath id={`${uid}-cloak`}>
            <path d={CLOAK} />
          </clipPath>
          <clipPath id={`${uid}-torso`}>
            <path d={TORSO} />
          </clipPath>
          {sp.spaniard ? (
            <>
              {/* the cuirass with its ridge, the tassets, the gorget */}
              <clipPath id={`${uid}-cuir`}>
                <path d={CUIR} />
              </clipPath>
              {[-1, 1].map((sd) => (
                <g key={sd}>
                  <path d={polyD([[sd * 3, 2], [sd * 37, 0], [sd * 40, 33], [sd * 6, 40]], mF, true)} fill={ink.deep} {...OUT} />
                  <path d={[0.36, 0.68].map((v) => `M${P(mF([sd * (3 + 3 * v), 2 + 38 * v]))}L${P(mF([sd * (37 + 3 * v), 33 * v]))}`).join("")} {...ln(1.1, 0.65)} />
                </g>
              ))}
              <path d={CUIR} fill={ink.main} {...OUT} />
              <g clipPath={`url(#${uid}-cuir)`}>
                <path d={segD(hatchSegs(a * 0.3, shY, a, 8, 110, 2.8, 44), side)} {...ln(0.95, 0.6)} />
                <path d={segD(hatchSegs(a * 0.52, shY + 30, a, 8, 62, 3.4, 45), side)} {...ln(0.9, 0.45)} />
                <path d={`M${P(mF([0, shY + 12]))}Q${P(mF([4, -52]))} ${P(mF([0, 8]))}`} {...ln(1.4, 0.8)} />
                <path d={`M${P(side([-31, -11]))}Q${P(mF([0, -5]))} ${P(side([31, -11]))}`} {...ln(1.3, 0.75)} />
                <path d={`M${P(side([-sp.hw + 2, shY + 30]))}Q${P(side([-sp.hw + 13, shY + 20]))} ${P(side([-sp.hw + 9, shY + 4]))}M${P(side([sp.hw - 2, shY + 30]))}Q${P(side([sp.hw - 13, shY + 20]))} ${P(side([sp.hw - 9, shY + 4]))}`} {...ln(1.1, 0.6)} />
              </g>
              <path d={`M${P(side([-18, shY + 1]))}Q${P(mF([0, shY + 17]))} ${P(side([18, shY + 1]))}L${P(side([12.5, shY - 8]))}Q${P(mF([0, shY + 2]))} ${P(side([-12.5, shY - 8]))}Z`} fill={ink.deep} {...OUT} />
              {sp.spaniard === "sword" ? (
                <>
                  <path d={limbD([[add(hilt, [-10, -5]), 4.4], [add(hilt, [11, 3]), 4.4]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
                  <path d={limbD([[hilt, 6.4], [add(hilt, [5, -24]), 5.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
                  <path d={[0.25, 0.5, 0.75].map((v) => `M${P(add(hilt, [5 * v - 3, -24 * v]))}l6,1.2`).join("")} {...ln(0.9, 0.6)} />
                  <circle cx={hilt[0] + 5.6} cy={hilt[1] - 27.5} r={5} fill={ink.deep} {...OUT} strokeWidth={1.9} />
                </>
              ) : null}
            </>
          ) : (
            <>
          {/* the bare torso */}
          <path d={TORSO} fill={ink.main} {...OUT} />
          <g clipPath={`url(#${uid}-torso)`}>
            <path d={`M${P(mF(add(neck, [3, 27])))}Q${P(mF(add(neck, [19, 38])))} ${P(mF(add(shR, [-9, 25])))}`} {...ln(1.3, 0.75)} />
            <path d={`M${P(mF(add(neck, [6, 7])))}Q${P(mF(add(neck, [18, 5])))} ${P(mF(add(shR, [-10, 5])))}`} {...ln(1.1, 0.6)} />
            <path d={segD(hatchSegs(shR[0] - 26, shR[1] + 6, shR[0] - 3, shR[1] + 34, 116, 2.6, 43), side)} {...ln(0.9, 0.6)} />
          </g>
          {/* the tilmatli: knotted on one shoulder */}
          <path d={CLOAK} fill={ink.main} {...OUT} />
          <g clipPath={`url(#${uid}-cloak)`}>
            {pattern}
            <path d={segD(hatchSegs(a * 0.42, shY + 22, a * 1.2, hem + 16, 111, 3, 44), cS)} {...ln(0.95, 0.6)} />
            <path d={segD(hatchSegs(a * 0.7, shY + 60, a * 1.2, hem + 16, 60, 3.6, 45), cS)} {...ln(0.9, 0.5)} />
            {folds.map((f, i) => (
              <path key={i} d={segD(foldHatchSegs(f.a, f.c, f.b, 46 + i, 9 + 5 * hash(i, 47)), cF)} {...ln(0.95, 0.6)} />
            ))}
            <path d={`M${P(mF(add(knot, [3, 9])))}C${P(mF(add(n0, [1, 8])))} ${P(mF(add(n1, [0, 8])))} ${P(mF(add(cloakB, [-1, 9])))}`} {...ln(1.2, 0.7)} />
            <path d={folds.map((f) => `M${P(cF(f.a))}Q${P(cF(f.c))} ${P(cF(f.b))}`).join("")} {...ln(1.5, 0.78)} />
          </g>
          {/* the knot on the shoulder: two ends, two loops */}
          {seen(knot[0]) ? (
            <g transform={`translate(${knotAt[0].toFixed(2)} ${knotAt[1].toFixed(2)}) scale(${kd.toFixed(3)} 1)`}>
              <path d={limbD([[[0, 0], 5.6], [[-4, 12], 5.2], [[-2.4, 23], 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
              <path d={limbD([[[0, 0], 5.6], [[6, 10], 5.2], [[10.6, 19], 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
              <path d="M0,0l-12.6,-9q-5.8,3.6 -1.6,9.8ZM0,0l12.2,-8.4q5.6,4.6 1,10Z" fill={ink.main} {...OUT} strokeWidth={1.9} />
              <circle cx={0} cy={0} r={4.9} fill={ink.deep} {...OUT} strokeWidth={1.9} />
            </g>
          ) : null}
            </>
          )}
        </g>
        {armsEl}
        {/* neck and head */}
        <path d={limbD([[add(r.neck, [0, 5]), 21 * k * (0.8 + 0.2 * sf.wf)], [mix2(r.neck, add(r.headC, [-7 * r.hs * sp.headScale, 0]), 0.78), 16.5 * k]])} fill={ink.main} {...OUT} />
        <path d={braceletD(add(r.neck, [0, 4]), mix2(r.neck, r.headC, 0.5), 20 * k, 17 * k, 89, 2.4)} {...ln(0.9, 0.6)} />
        <g transform={`translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${sp.headScale})`}>
          <Head sp={sp} yaw={q.headYaw} nod={Math.max(0, r.nodF)} face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }} crowned={crowned} uid={`${uid}-h`} ink={ink} />
        </g>
      </Cased>
    </g>
  );
};

/** a conquistador captain: morion, cuirass, paned hose. variant 0 rests his hand on his sword, 1 carries the banner */
export const Spaniard: React.FC<Omit<FigureProps, "spec" | "uid" | "pose" | "crowned"> & { variant: 0 | 1; pose?: FigPose; uid?: string }> = ({ variant, pose, uid, ...p }) => (
  <Figure spec={SPANIARDS[variant]} pose={pose ?? SPANIARD_STAND[variant]} uid={uid ?? `spa${variant}`} {...p} />
);
export const Moctezuma: React.FC<Omit<FigureProps, "spec" | "uid"> & { uid?: string }> = ({ uid = "moc", ...p }) => <Figure spec={SPECS.moctezuma} uid={uid} {...p} />;
/** a prince of Texcoco. variant 0 = the brother who is crowned, 1 = the brother passed over */
export const Brother: React.FC<Omit<FigureProps, "spec" | "uid"> & { variant: 0 | 1; uid?: string }> = ({ variant, uid, ...p }) => (
  <Figure spec={variant === 0 ? SPECS.brother0 : SPECS.brother1} uid={uid ?? `bro${variant}`} {...p} />
);
