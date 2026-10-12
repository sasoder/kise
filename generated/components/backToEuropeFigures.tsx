// ---------------------------------------------------------------------------
// backToEuropeFigures: the cast of the BackToEurope cut (Dwarkesh Patel with Si
// Sheppard, "Conquistador advantages"): ONE soldier rig drawn in the engraving
// grammar of texcocoFigures / bothSidesFigures (cream form on a dark casing,
// firm dark outline, tapered limbs, bracelet strokes, hatched shade; light from
// the upper left), to the same scale (figure-local units: feet at (0, 0), up is
// negative y, a bare-headed man ~310 units; world px = units x scale), and the
// European pike.
//
// The soldier is drawn in ONE view, three-quarter, facing `dir` (1 = screen
// right, -1 = screen left). The silhouette is built for the way he faces; the
// shade always falls on screen right, and what is handed is placed by hand (the
// sword hangs on his LEFT hip: the far hip of a man facing right). Poses are
// written in FORWARD units (x + = the way he faces).
//   kit "cotton"  morion (steel), a quilted cotton armour (ichcahuipilli:
//                 sleeveless, to mid-thigh, diamond quilting, tie laces down
//                 the chest, a sword belt) over shirt and hose; sword
//   kit "steel"   morion, peascod cuirass, tassets, gorget, pauldrons
// `ink` is everything cloth and flesh, `steel` the steel.
// Layers: "back" (sword, far arm, legs) and "front" (torso, head, near arm), so
// a pike can pass between them; `dents` push the quilting in (torso-local).
//
// EXPORTS: Soldier, soldierRig, soldierAnchors, quiltWorld, torsoOfWorld, Pike,
// walkLegs, types SoldierPose / SArm / Dent.
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, hash, type P2 } from "./incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "./stringsMotion";
import { CREAM, ORANGE, type Ink } from "./texcocoFigures";

// ---------------------------------------------------------------------------
// the engraver's helpers (as texcocoFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
type Map = (p: P2) => P2;
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const segD = (segs: Seg[]) => segs.map(([a, b]) => `M${P(a)}L${P(b)}`).join("");
const polyD = (pts: P2[], close = false) => (pts.length ? `M${pts.map((p) => P(p)).join("L")}${close ? "Z" : ""}` : "");
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
/** the same closed curve as smoothClosed, as a dense polygon (n points per span) */
const sampleClosed = (pts: P2[], n = 6): P2[] => {
  const N = pts.length;
  const out: P2[] = [];
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % N];
    const p3 = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
};
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
const blendYaw = (front: P2[], prof: P2[], yaw: number): P2[] => {
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  return front.map((f, i) => {
    const p = mix2(f, prof[i], t);
    return s < 0 ? [-p[0], p[1]] : p;
  });
};
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
// THE POSE AND THE RIG
// ---------------------------------------------------------------------------
export type SArm = {
  /** the wrist, as an offset from its own shoulder, forward units */
  w: P2;
  /** or the wrist as a figure-local SCREEN point (wins over w) */
  to?: P2;
  /** the side the elbow goes to (a direction, forward units) */
  elbow: P2;
  /** 1 = closed fist, 0 = open hand */
  fist: number;
  /** the hand's angle off the forearm, deg (+ = turned up-and-back for a hand held forward) */
  hand: number;
};
export type SoldierPose = {
  /** how far the head is turned toward where he faces, rad (0.45 .. 1.15) */
  headYaw: number;
  /** head roll, deg (+ = tipped back) and pitch, deg (+ = chin down) */
  roll: number;
  pitch: number;
  /** torso lean about the hips, deg (+ = leaning BACK) */
  lean: number;
  /** the hips: forward shift and drop, units */
  hipX: number;
  crouch: number;
  /** far = the arm of the forward shoulder (his LEFT when he faces right); near = the arm toward us */
  far: SArm;
  near: SArm;
  /** ankle offsets from the standing place (forward units) and the feet's pitch, deg (+ = heel up) */
  footFar: P2;
  footNear: P2;
  liftFar: number;
  liftNear: number;
  brow: number;
  lids: number;
  mouth: number;
};
const HIP_Y = -152;
const SH_Y = -99;
const HEAD_S = 1.08;
const K = 1.03;
/** the far and the near shoulder and hip, forward units (torso-local for the shoulders) */
const SH_FAR: P2 = [33, SH_Y + 2];
const SH_NEAR: P2 = [-31, SH_Y + 3];
const HIP_FAR = 12;
const HIP_NEAR = -14;
const ANK_FAR = 23;
const ANK_NEAR = -19;

export type SoldierRig = ReturnType<typeof soldierRig>;
export const soldierRig = (dir: 1 | -1, q: SoldierPose) => {
  const fx = (p: P2): P2 => [dir * p[0], p[1]];
  const hip: P2 = [dir * q.hipX, HIP_Y + q.crouch];
  const leanS = -dir * q.lean;
  /** torso-local screen coords (hips (0, 0)) to figure-local */
  const toFig = (p: P2): P2 => add(hip, rot(p, leanS));
  const neck = toFig(fx([4, SH_Y - 3]));
  const yaw = dir * q.headYaw;
  const hc = Math.cos(yaw);
  const hs = Math.sin(yaw);
  const nodF = clamp1(q.pitch / 22) * hc * hc;
  const rollS = -dir * q.roll;
  const headAngle = leanS * 0.45 + rollS + q.pitch * hs;
  const headC = add(add(neck, rot([0, -(31 - 8 * Math.max(0, nodF)) * (HEAD_S / 1.1)], leanS * 0.7 + rollS * 0.45 + q.pitch * hs * 0.4)), [5 * hs * HEAD_S, 0]);
  const arm = (sgn: number, sh: P2, ap: SArm) => {
    const S = toFig(fx(sh));
    const { mid: E, end: W } = ik2(S, ap.to ?? add(S, fx(ap.w)), 60, 56, fx(ap.elbow));
    const f = sub(W, E);
    const d = rot(vlen(f) > 2 ? norm(f) : [0, 1], -dir * ap.hand);
    return { S, E, W, dir: d, fist: ap.fist, sgn, grip: add(W, mul(d, 11 * K)) };
  };
  const leg = (hF: number, aF: number, off: P2, lift: number) => {
    const H: P2 = [dir * (q.hipX + hF), hip[1] + 2];
    const { mid: Kn, end: A } = ik2(H, [dir * (aF + off[0]), -15 + off[1]], 70, 68, [dir * 1.2, 0.02]);
    return { H, K: Kn, A, lift };
  };
  return {
    dir,
    fx,
    hip,
    leanS,
    toFig,
    neck,
    yaw,
    headC,
    headAngle,
    hs,
    nodF,
    far: arm(dir, SH_FAR, q.far),
    near: arm(-dir, SH_NEAR, q.near),
    legFar: leg(HIP_FAR, ANK_FAR, q.footFar, q.liftFar),
    legNear: leg(HIP_NEAR, ANK_NEAR, q.footNear, q.liftNear),
  };
};
/** his anchors in WORLD px */
export const soldierAnchors = (dir: 1 | -1, q: SoldierPose, at: P2, scale: number) => {
  const r = soldierRig(dir, q);
  const w = (v: P2): P2 => add(at, mul(v, scale));
  return {
    rig: r,
    headC: w(r.headC),
    crest: w(add(r.headC, rot([0, -61 * HEAD_S], r.headAngle))),
    shoulderFar: w(r.far.S),
    shoulderNear: w(r.near.S),
    handFar: w(r.far.grip),
    handNear: w(r.near.grip),
    ankleFar: w(r.legFar.A),
    ankleNear: w(r.legNear.A),
    hip: w(r.hip),
  };
};
/** a world point in his torso-local screen frame (hips (0, 0), rotated with the lean), and back */
export const torsoOfWorld = (dir: 1 | -1, q: SoldierPose, at: P2, scale: number) => {
  const r = soldierRig(dir, q);
  return {
    toTorso: (p: P2): P2 => rot(sub(mul(sub(p, at), 1 / scale), r.hip), -r.leanS),
    toWorld: (p: P2): P2 => add(at, mul(r.toFig(p), scale)),
    /** a world direction in the torso frame */
    dirToTorso: (v: P2): P2 => rot(v, -r.leanS),
  };
};

// ---------------------------------------------------------------------------
// THE QUILTED COTTON ARMOUR (torso-local, forward units): soft, padded, a
// little wider than the man, cinched by the sword belt, flaring to mid-thigh
// ---------------------------------------------------------------------------
const QUILT_F: P2[] = [
  [13, -107], [28, -106], [40, -97], [46, -82], [48, -64], [49, -44], [47, -26], [44, -10], [47, 4], [52, 20], [53, 35], [49, 45],
  [30, 50], [5, 52], [-21, 50], [-38, 45], [-44, 33], [-42, 14], [-36, -8], [-38, -24], [-41, -44], [-42, -66], [-40, -84], [-34, -98], [-22, -106], [-6, -102], [4, -100],
];
/** the garment's outline, torso-local screen coords: the smooth form, its edge pillowed between the rows of stitching */
const quiltLocal = (fx: (p: P2) => P2): P2[] => {
  const base = sampleClosed(QUILT_F.map(fx), 7);
  const n = base.length;
  const c = fx([3, -28]);
  let arc = 0;
  return base.map((p, i) => {
    const a = base[(i - 1 + n) % n];
    const b = base[(i + 1) % n];
    arc += vlen(sub(p, a));
    const t = norm(sub(b, a));
    let nr: P2 = [-t[1], t[0]];
    if (nr[0] * (p[0] - c[0]) + nr[1] * (p[1] - c[1]) < 0) nr = [-nr[0], -nr[1]];
    return add(p, mul(nr, 1.7 * Math.abs(Math.sin((Math.PI * arc) / 13.5)) - 0.5));
  });
};
/** the garment's outline as a dense WORLD polygon (for finding where a point meets the cloth) */
export const quiltWorld = (dir: 1 | -1, q: SoldierPose, at: P2, scale: number): P2[] => {
  const r = soldierRig(dir, q);
  return quiltLocal(r.fx).map((p) => add(at, mul(r.toFig(p), scale)));
};
/** a push into the cloth: torso-local screen coords, `push` the displacement at its centre, `r` its reach */
export type Dent = { at: P2; push: P2; r: number; slit?: number; /** 0..1 torn threads and tufts of wadding, thrown toward `out` (a unit vector) */ tuft?: number; out?: P2 };
/** the quilting's column: s = the arc from the lace line (+ = toward his front edge), to forward units */
const COL_PHI0 = 0.5;
const colF = (s: number) => 2 + 46 * Math.sin(Math.max(-1.52, Math.min(1.52, COL_PHI0 + s / 42)));
const QW = 8.8;
const QH = 11.6;

// ---------------------------------------------------------------------------
// THE HAND (as texcocoFigures')
// ---------------------------------------------------------------------------
type ArmRig = SoldierRig["far"];
const Hand: React.FC<{ a: ArmRig; k: number; ink: Ink }> = ({ a, k, ink }) => {
  const { W, dir: d, fist: f, sgn } = a;
  const n: P2 = [-d[1], d[0]];
  const open = 1 - f;
  const at = (along: number, across: number): P2 => add(W, add(mul(d, along * k), mul(n, across * k)));
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
      {open > 0.5 ? <path d={[-1, 0, 1].map((j) => `M${P(at(13.2, j * 5))}L${P(at(17.5, j * 5))}`).join("")} {...ln(1, 0.45 * (open - 0.5) * 2)} /> : null}
      <path d={thumb} fill={ink.main} {...OUT} strokeWidth={1.9} />
      {f > 0.5 ? <path d={[-1, 0, 1].map((j) => `M${P(at(9.5, j * 5))}L${P(at(16.5, j * 5))}`).join("")} {...ln(1.2, 0.75 * (f - 0.5) * 2)} /> : null}
      {/* the shirt cuff */}
      <path d={limbD([[at(-3.6, -9), 6 * k], [at(-3.6, 9), 6 * k]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(at(-3.6, -5))}L${P(at(-3.6, 5))}`} {...ln(0.9, 0.55)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE HEAD: bearded, in a morion (head-local units, (0, 0) = the middle of the
// face); bothSidesFigures' head, the steel in its own ink
// ---------------------------------------------------------------------------
const FACE_F: P2[] = [[0, -26], [8, -25], [14, -21], [18, -13], [19.5, -5], [19.5, 2], [19, 8], [18, 12], [16.5, 16], [14.5, 19.5], [11, 23], [5, 26.5], [-5, 26.5], [-11, 23], [-16.5, 16], [-19, 8], [-19.5, -2], [-18, -13], [-14, -21], [-8, -25]];
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];
const HAIR_F: P2[] = [[-20, 17], [-25.5, 13], [-27, 5], [-24, -14], [-17, -27], [0, -31], [17, -27], [24, -14], [27, 5], [25.5, 13], [20, 17], [13, 16], [16, 14], [17.5, 0], [16, -9], [8, -13.5], [0, -12.4], [-8, -13.5], [-16, -9], [-17.5, 0], [-16, 14], [-13, 16]];
const HAIR_P: P2[] = [[-24, 14], [-28, 10], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 16], [-13, 15]];
const BEARD_F: P2[] = [[-19, 4], [-18, 15], [-13, 26], [-5, 33.5], [0, 35], [5, 33.5], [13, 26], [18, 15], [19, 4], [14, 10], [8, 17.8], [0, 19.6], [-8, 17.8], [-14, 10]];
const BEARD_P: P2[] = [[-8, 3], [-9, 14], [-5, 24], [4, 31], [12, 36], [17, 34.5], [20.5, 29], [21, 23], [20, 19.6], [18, 19.6], [15, 20], [12, 19], [6, 14], [-1, 7]];

/** the morion: a dome, a crescent comb running fore and aft, a boat brim peaked front and back */
const Morion: React.FC<{ yaw: number; ink: Ink; uid: string }> = ({ yaw, ink, uid }) => {
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const w = 6 + 14.5 * t;
  const N = 14;
  const arc = (rx: number, ry: number, y0: number) =>
    Array.from({ length: N + 1 }, (_, i): P2 => {
      const a = (-0.5 + i / N) * Math.PI;
      return [rx * Math.sin(a), y0 - ry * Math.cos(a)];
    });
  const outer = arc(w, 41, -22);
  const inner = arc(w * 0.9, 19.5, -22).reverse();
  const COMB = `${polyD([...outer, ...inner])}Z`;
  const rim = arc(w * 0.9, 36.4, -22).slice(2, -2);
  const flutes = [-0.34, -0.2, -0.07, 0.07, 0.2, 0.34].map((u): Seg => {
    const a = u * Math.PI;
    return [
      [w * 0.9 * Math.sin(a), -22 - 23 * Math.cos(a)],
      [w * 0.9 * Math.sin(a), -22 - 34.2 * Math.cos(a)],
    ];
  });
  const DOME = "M-24,-15C-26,-53 26,-53 24,-15Z";
  const tf = 37 + 5 * t;
  const tb = 36 + 2 * t;
  const xf = sg * tf;
  const xb = -sg * tb;
  const BRIM = `M${xb},-31Q${xb * 0.62},-9.6 0,-8.6Q${xf * 0.62},-9.6 ${xf},-32Q${xf * 0.6},-19.4 0,-18.6Q${xb * 0.6},-19.4 ${xb},-31Z`;
  return (
    <g transform={`translate(${(-2.5 * s).toFixed(2)} 0)`}>
      <clipPath id={`${uid}-dome`}>
        <path d={DOME} />
      </clipPath>
      <clipPath id={`${uid}-comb`}>
        <path d={COMB} />
      </clipPath>
      <path d={COMB} fill={ink.deep} {...OUT} strokeWidth={2.1} />
      <g clipPath={`url(#${uid}-comb)`}>
        <path d={segD(flutes)} {...ln(1.05, 0.62)} />
        <path d={polyD(rim)} {...ln(1, 0.6)} />
        <path d={hatchD(w * 0.2, -62, w + 2, -22, 112, 2.4, 77, 0.2)} {...ln(0.85, 0.5)} />
      </g>
      <path d={DOME} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-dome)`}>
        <path d={hatchD(6, -46, 26, -15, 108, 2.5, 74)} {...ln(0.95, 0.6)} />
        <path d={hatchD(14, -40, 26, -15, 60, 3, 75)} {...ln(0.85, 0.45)} />
        <path d="M-24,-23.5Q0,-28.5 24,-23.5" {...ln(1.2, 0.7)} />
        {[-13, 0, 13].map((x) => (
          <circle key={x} cx={x} cy={-22.4 - (1 - (x * x) / 400) * 2.4} r={1.3} fill={DARK} opacity={0.75} />
        ))}
      </g>
      <path d={BRIM} fill={ink.main} {...OUT} />
      <path d={`M${xb * 0.78},-20.6Q${xb * 0.4},-12.6 0,-12Q${xf * 0.4},-12.6 ${xf * 0.78},-21`} {...ln(0.9, 0.5)} />
      <path d={hatchD(10, -20, 40, -8, 100, 2.4, 76, 0.15)} {...ln(0.85, 0.5)} />
    </g>
  );
};

type Face = { brow: number; lids: number; mouth: number };
const Head: React.FC<{ beard: number; yaw: number; nod: number; face: Face; uid: string; ink: Ink; steel: Ink }> = ({ beard, yaw, nod, face, uid, ink, steel }) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const fy = 5 * nod;
  const pr = (fx: number, y: number, D: number, k = 1): P2 => [fx * c + D * s, y + fy * k];
  const vis = (side: number) => (side * sg > 0 && t > 0.02 ? c01((c - 0.2) / 0.32) : 1);
  const FACE = smoothClosed(blendYaw(FACE_F, FACE_P, yaw));
  const HAIR = smoothClosed(blendYaw(HAIR_F, HAIR_P, yaw));
  const open = 1 - face.lids;
  const b = face.brow;
  const m = face.mouth;
  const eye = (sd: number) => {
    const v = vis(sd);
    if (v < 0.04) return null;
    const o = pr(sd * 13.8, -0.4, 8.5);
    const mid = pr(sd * 8.2, -0.6 - 4.6 * open + 2.4 * face.lids - 1.2 * Math.max(0, -b), 13);
    const inn = pr(sd * 3.2, 0.2, 14.5);
    const w = Math.abs(inn[0] - o[0]) / 10.6;
    const pu = pr(sd * 8.2, -0.4, 12.6 + 1.4 * t);
    const bo = pr(sd * 14.4, -6.8 + 2.4 * nod - 1.6 * b, 8.5);
    const bm = pr(sd * 8.6, -10 + nod - 0.6 * Math.abs(b) - 1.8 * Math.max(0, -b), 13.4);
    const bi = pr(sd * 2.6, -5.4 - 3 * nod + 3 * b, 16.5);
    const u0 = pr(sd * 12.4, 0.8, 9.5);
    const u1 = pr(sd * 8, 3, 13);
    const u2 = pr(sd * 4.2, 1, 14.2);
    return (
      <g key={sd} opacity={v}>
        <path d={`M${P(bo)}Q${P(bm)} ${P(bi)}`} {...ln(2.5, 0.92)} />
        <path d={`M${P(o)}Q${P(mid)} ${P(inn)}`} {...ln(1.9, 0.92)} />
        <path d={`M${P(u0)}Q${P(u1)} ${P(u2)}`} {...ln(0.9, 0.55 * open)} />
        <ellipse cx={pu[0]} cy={pu[1] + 0.1 + 0.8 * face.lids} rx={2.15 * Math.max(0.45, Math.min(1, w))} ry={2.15 * (0.55 + 0.45 * open)} fill={DARK} opacity={0.92} />
      </g>
    );
  };
  const RF = 18.2;
  const o = -2.2 * clamp1(1 - yaw * 8);
  const nRoot: P2 = [RF * s * 0.94 + o * c, -4.6 + fy];
  const nTip: P2 = [(RF + 9.4) * s + o * 1.55 * c, 8.6 + fy];
  const nUnder: P2 = [(RF + 4.6) * s - o * 0.1 * c, 11.1 + fy];
  const nWing: P2 = [(RF - 3) * s - o * 2.1 * c, 8.2 + 1.6 * t + fy];
  const nWingIn: P2 = [(RF - 1.6) * s - o * 1.3 * c, 5.6 + t + fy];
  const nBack: P2 = [(RF - 3) * s + o * 0.2 * c, -2 + fy];
  const nC1: P2 = [nTip[0] + 0.2 + 0.3 * s, 10.9 + 0.3 * t + fy];
  const nC2: P2 = [mix(nUnder[0], nWing[0], 0.75 - 0.25 * t), 11.1 + 0.4 * t + fy];
  const nC3: P2 = [nWing[0] - 0.2 * (1 - t) - 1.4 * s, 6.2 + 1.3 * t + fy];
  const mc = pr(0, 16 - 0.5 * nod, 20.4, 0.7);
  const half = (sd: number) => {
    const v = vis(sd);
    const q1 = pr(sd * 3.6, 14.7, 18.8, 0.7);
    const q2 = pr(sd * 8, 15.7 - 1.8 * m, 13.5, 0.7);
    return <path key={sd} d={`M${P(mc)}Q${P(q1)} ${P(q2)}`} {...ln(2, 0.92)} opacity={v} />;
  };
  const e = pr(-sg * 20.6, 4, -5, 0);
  const ew = mix(0.55, 1, t);
  const BEARD = smoothClosed(
    blendYaw(BEARD_F, BEARD_P, yaw).map((p, i): P2 => {
      const low = [3, 4, 5].includes(i) ? beard : [2, 6].includes(i) ? beard * 0.45 : 0;
      return [p[0] + (i === 4 ? sg * beard * 0.5 * t : 0), p[1] + fy * 0.6 + low];
    }),
  );
  return (
    <g>
      <clipPath id={`${uid}-face`}>
        <path d={FACE} />
      </clipPath>
      <clipPath id={`${uid}-hair`}>
        <path d={HAIR} />
      </clipPath>
      <clipPath id={`${uid}-beard`}>
        <path d={BEARD} />
      </clipPath>
      <path d={FACE} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-face)`}>
        <path d={hatchD(9 + 6 * s, -9 + fy, 27, 24, 114, 2.3, 24)} {...ln(0.95, 0.62 * (sg > 0 ? c : 1))} />
        <path d={hatchD(13 + 6 * s, -4, 27, 18, 58, 2.9, 25)} {...ln(0.85, 0.46 * (sg > 0 ? c : 1))} />
        <path d={hatchD(-24, -20, 24, -10, 84, 2.2, 28, 0.2)} {...ln(0.9, 0.55)} />
        {t > 0.3 ? <path d={hatchD(sg * -27, -2, sg * -27 + sg * 19, 26, sg > 0 ? 62 : 118, 2.5, 39, 0.3)} {...ln(0.85, 0.4 * c01((t - 0.3) * 3))} /> : null}
      </g>
      <path d={HAIR} fill={ink.hair} {...OUT} />
      <g clipPath={`url(#${uid}-hair)`}>
        <path d={hatchD(-31, -32, 30, 20, 88, 2.15, 21, 0.1)} {...ln(1.25, 0.82)} />
      </g>
      {[-1, 1].map(eye)}
      {t > 0.12 ? <path d={`M${P(nRoot)}L${P(nTip)}L${P(nUnder)}L${P(nWing)}L${P(nBack)}Z`} fill={ink.main} /> : null}
      <path d={`M${P(nRoot)}L${P(nTip)}Q${P(nC1)} ${P(nUnder)}Q${P(nC2)} ${P(nWing)}Q${P(nC3)} ${P(nWingIn)}`} {...ln(1.7, 0.9)} />
      <path d={[0.22, 0.45, 0.68].map((u) => `M${P(add(mix2(nRoot, nTip, u), [-o * 1.5 * c - 3 * s, 0.6]))}l${(-o * 1.1 * c - 1.6 * s).toFixed(1)},1.4`).join("")} {...ln(0.85, 0.5)} />
      {[-1, 1].map((sd) => (
        <path key={sd} d={`M${P(pr(sd * 6.4, 9.4, 15.5))}Q${P(pr(sd * 9.6, 12.4, 13.5))} ${P(pr(sd * 10, 16.4, 11.5))}`} {...ln(1, 0.5 * vis(sd))} />
      ))}
      {t > 0.2 ? (
        <>
          <ellipse cx={e[0]} cy={e[1]} rx={4.2 * ew} ry={6.4} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={`M${(e[0] + sg * 1.6 * ew).toFixed(1)},${e[1] - 3}q${(-sg * 3.4 * ew).toFixed(1)},2.6 ${(-sg * 0.6 * ew).toFixed(1)},6`} {...ln(1, 0.6)} />
        </>
      ) : null}
      {beard >= 0 ? (
        <>
          <path d={BEARD} fill={ink.hair} {...OUT} />
          <g clipPath={`url(#${uid}-beard)`}>
            <path d={hatchD(-26, 0, 28, 46, 84, 2.1, 73, 0.12)} {...ln(1.2, 0.8)} />
          </g>
        </>
      ) : (
        <path d={hatchD(-22, 14, 24, 28, 100, 2.6, 79, 0.3)} {...ln(0.8, 0.4)} clipPath={`url(#${uid}-face)`} />
      )}
      {[-1, 1].map(half)}
      {[-1, 1].map((sd) => (
        <path key={sd} d={limbD([[pr(0, 13.2, 20.8, 0.7), 4.6], [pr(sd * 5.5, 13.6, 17.5, 0.7), 4.8], [pr(sd * 11, 18, 12.5, 0.7), 2.6]])} fill={ink.hair} {...OUT} strokeWidth={1.6} opacity={vis(sd)} />
      ))}
      <Morion yaw={yaw} ink={steel} uid={uid} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SHOE (toes where he faces)
// ---------------------------------------------------------------------------
const SHOE: P2[] = [[6, 1], [-6, 1], [-13, 7.2], [-23, 10.4], [-27.5, 13.6], [-25.5, 16.8], [-8, 17.6], [8.6, 16.8], [10.8, 11], [8.4, 4]];
const Shoe: React.FC<{ A: P2; dir: number; lift: number; k: number; ink: Ink }> = ({ A, dir, lift, k, ink }) => {
  const m = (x: number, y: number) => `${(-dir * x).toFixed(1)},${y}`;
  return (
    <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) rotate(${(dir * lift).toFixed(2)}) scale(${k.toFixed(3)})`}>
      <path d={smoothClosed(SHOE.map((p): P2 => [-dir * p[0], p[1]]))} fill={ink.deep} {...OUT} strokeWidth={2.1} />
      <path d={`M${m(8.6, 16.8)}Q${m(-8, 14.2)} ${m(-25.5, 16.8)}`} {...ln(1.3, 0.75)} />
      <path d={`M${m(6.4, 4.6)}Q${m(-4, 9.4)} ${m(-13.4, 7.6)}`} {...ln(1.2, 0.7)} />
      <path d={`M${m(-16, 9.2)}L${m(-19, 15.2)}M${m(-20.4, 10.6)}L${m(-23, 15.6)}`} {...ln(0.9, 0.5)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SOLDIER
// ---------------------------------------------------------------------------
export type SoldierProps = {
  kit: "cotton" | "steel";
  dir: 1 | -1;
  pose: SoldierPose;
  /** his feet, world px, and px per unit */
  at: P2;
  scale: number;
  uid: string;
  ink?: Ink;
  steel?: Ink;
  layer?: "all" | "back" | "front";
  /** pushes into the quilting (kit "cotton") */
  dents?: Dent[];
  beard?: number;
  sword?: boolean;
};
export const Soldier: React.FC<SoldierProps> = ({ kit, dir, pose: q, at, scale, uid, ink = CREAM, steel = ORANGE, layer = "all", dents = [], beard = 5, sword = kit === "cotton" }) => {
  const r = soldierRig(dir, q);
  const { fx } = r;
  const k = K;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${r.leanS.toFixed(2)})`;
  /** bothSidesFigures' literal coords (drawn facing left) in this figure's frame */
  const b = (x: number, y: number) => `${(-dir * x).toFixed(1)},${y.toFixed(1)}`;
  const bp = (x: number, y: number): P2 => [-dir * x, y];

  const drawArm = (ar: ArmRig) => {
    const fl = vlen(sub(ar.W, ar.E));
    const dv = sub(ar.E, ar.S);
    const u: P2 = vlen(dv) > 0.5 ? norm(dv) : [0, 1];
    const n: P2 = [-u[1], u[0]];
    const f2 = sub(ar.W, ar.E);
    const uf: P2 = vlen(f2) > 0.5 ? norm(f2) : [0, 1];
    const nf: P2 = [-uf[1], uf[0]];
    return (
      <g key={ar.sgn}>
        {/* the full shirt sleeve, gathered at the cuff */}
        <path d={limbD(bones(ar.S, ar.E, ar.W, [25, 27, 22, 21, 13].map((w) => w * k)))} fill={ink.deep} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 25 * k, 21 * k, 85 + ar.sgn, 2.9) + (fl > 14 ? braceletD(ar.E, ar.W, 21 * k, 13 * k, 87 + ar.sgn, 2.9) : "")} {...ln(0.95, 0.6)} />
        {/* folds: two down the upper arm, the gather at the elbow, one along the forearm */}
        <path
          d={
            [-4, 4].map((o) => `M${P(add(mix2(ar.S, ar.E, 0.3), mul(n, o * k)))}Q${P(add(mix2(ar.S, ar.E, 0.55), mul(n, (o - 2) * k)))} ${P(add(mix2(ar.S, ar.E, 0.82), mul(n, o * 0.4 * k)))}`).join("") +
            (fl > 20 ? `M${P(add(mix2(ar.E, ar.W, 0.12), mul(nf, -5 * k)))}Q${P(add(mix2(ar.E, ar.W, 0.4), mul(nf, -1 * k)))} ${P(add(mix2(ar.E, ar.W, 0.78), mul(nf, -3 * k)))}` : "")
          }
          {...ln(1.25, 0.66)}
        />
        {kit === "steel" ? (
          <>
            {/* the pauldron's lames */}
            <path d={limbD([[add(ar.S, add(mul(n, -14 * k), mul(u, 10 * k))), 12 * k], [add(ar.S, mul(u, -2 * k)), 20 * k], [add(ar.S, add(mul(n, 14 * k), mul(u, 10 * k))), 12 * k]])} fill={steel.main} {...OUT} />
            {[4, 11].map((d) => (
              <path key={d} d={`M${P(add(ar.S, add(mul(n, -13 * k), mul(u, (d + 4) * k))))}Q${P(add(ar.S, mul(u, (d - 5) * k)))} ${P(add(ar.S, add(mul(n, 13 * k), mul(u, (d + 4) * k))))}`} {...ln(1.1, 0.7)} />
            ))}
            <path d={braceletD(add(ar.S, mul(n, -12 * k)), add(ar.S, mul(n, 12 * k)), 16 * k, 16 * k, 93 + ar.sgn, 3, 0.6)} {...ln(0.85, 0.42)} />
          </>
        ) : (
          <>
            {/* the quilted shoulder of the sleeveless armour, lapping the sleeve */}
            <path d={limbD([[add(ar.S, add(mul(n, -13 * k), mul(u, 5 * k))), 9 * k], [add(ar.S, mul(u, -4 * k)), 16 * k], [add(ar.S, add(mul(n, 13 * k), mul(u, 5 * k))), 9 * k]])} fill={ink.main} {...OUT} />
            <path d={[-9, -3, 3, 9].map((o) => `M${P(add(ar.S, add(mul(n, o * k), mul(u, (7.5 - Math.abs(o) * 0.25) * k))))}L${P(add(ar.S, add(mul(n, (o + 5) * 0.85 * k), mul(u, -8 * k))))}M${P(add(ar.S, add(mul(n, o * k), mul(u, (7.5 - Math.abs(o) * 0.25) * k))))}L${P(add(ar.S, add(mul(n, (o - 5) * 0.85 * k), mul(u, -8 * k))))}`).join("")} {...ln(1.2, 0.6)} />
            <path d={braceletD(add(ar.S, mul(n, -12 * k)), add(ar.S, mul(n, 12 * k)), 16 * k, 16 * k, 93 + ar.sgn, 3, 0.5)} {...ln(0.85, 0.36)} />
          </>
        )}
        <Hand a={ar} k={k} ink={ink} />
      </g>
    );
  };

  const drawLeg = (l: SoldierRig["legFar"], seed: number) => {
    const calf = mix2(l.K, l.A, 0.34);
    const st: St[] = [
      [l.H, 21 * k],
      [mix2(l.H, l.K, 0.5), 19 * k],
      [l.K, 15 * k],
      [[calf[0] - dir * 2.4 * k, calf[1]], 17.5 * k],
      [mix2(l.K, l.A, 0.82), 11.5 * k],
      [l.A, 10.5 * k],
    ];
    const g = mix2(l.K, l.A, 0.1);
    const tu = norm(sub(l.K, l.H));
    const tn: P2 = [-tu[1], tu[0]];
    return (
      <g key={seed}>
        <path d={limbD(st)} fill={ink.main} {...OUT} />
        <path d={braceletD(l.K, l.A, 17 * k, 11 * k, 81 + seed, 2.9)} {...ln(0.95, 0.62)} />
        <Shoe A={l.A} dir={dir} lift={l.lift} k={k} ink={ink} />
        {/* the paned trunk hose, a garter under the knee */}
        <path d={limbD([[add(l.H, mul(tu, -8)), 31 * k], [mix2(l.H, l.K, 0.28), 41 * k], [mix2(l.H, l.K, 0.56), 35 * k], [mix2(l.H, l.K, 0.7), 23 * k]])} fill={ink.deep} {...OUT} />
        <path d={[-0.34, -0.12, 0.12, 0.34].map((v) => `M${P(add(mix2(l.H, l.K, 0.02), mul(tn, v * 26 * k)))}Q${P(add(mix2(l.H, l.K, 0.3), mul(tn, v * 46 * k)))} ${P(add(mix2(l.H, l.K, 0.66), mul(tn, v * 22 * k)))}`).join("")} {...ln(1.2, 0.7)} />
        <path d={braceletD(mix2(l.H, l.K, 0.05), mix2(l.H, l.K, 0.62), 36 * k, 32 * k, 95 + seed, 3.2, 0.7)} {...ln(0.9, 0.5)} />
        <path d={limbD([[add(g, mul(tn, -8.4 * k)), 4.8], [add(g, mul(tn, 8.4 * k)), 4.8]])} fill={ink.main} {...OUT} strokeWidth={1.7} />
      </g>
    );
  };

  // ---- the sword on his LEFT hip (the far hip when he faces right): the scabbard trails back behind his legs,
  //      the hilt stands out in front of the belt: cross-guard, side ring, wire grip, pommel
  const hiltAt: P2 = fx([51, 14]);
  const sAx = norm(sub(fx([-44, 109]), hiltAt));
  const sN: P2 = [-sAx[1], sAx[0]];
  const sw = (along: number, across = 0): P2 => add(hiltAt, add(mul(sAx, along), mul(sN, across)));
  const swordEl = sword ? (
    <g transform={torsoTf}>
      <path d={limbD([[sw(2), 8.4], [sw(66), 7.2], [sw(132), 4.4]])} fill={ink.deep} {...OUT} />
      <path d={`M${P(sw(10, 1.5))}L${P(sw(126, 0.6))}`} {...ln(0.9, 0.5)} />
      <path d={`M${P(sw(112, -4))}L${P(sw(112, 4))}M${P(sw(16, -4.4))}L${P(sw(16, 4.4))}`} {...ln(1.3, 0.75)} />
      {/* the side ring, the cross-guard, the grip, the pommel */}
      <path d={`M${P(sw(-2, -9))}Q${P(sw(-12, -13))} ${P(sw(-13, -3))}`} fill="none" stroke={DARK} strokeWidth={5.6} strokeLinecap="round" />
      <path d={`M${P(sw(-2, -9))}Q${P(sw(-12, -13))} ${P(sw(-13, -3))}`} fill="none" stroke={steel.main} strokeWidth={2.6} strokeLinecap="round" />
      <path d={limbD([[sw(-1, -17), 4.8], [sw(-1, 17), 4.8]])} fill={steel.main} {...OUT} strokeWidth={1.9} />
      <path d={limbD([[sw(-2), 6.8], [sw(-25), 5.8]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      <path d={[0.2, 0.4, 0.6, 0.8].map((v) => `M${P(sw(-2 - 23 * v, -3))}L${P(sw(-3.4 - 23 * v, 3))}`).join("")} {...ln(0.9, 0.62)} />
      <circle cx={sw(-29)[0]} cy={sw(-29)[1]} r={5.8} fill={steel.main} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(sw(-27, 2))}Q${P(sw(-30, 5))} ${P(sw(-33, 1.5))}`} {...ln(0.9, 0.55)} />
    </g>
  ) : null;

  const back = (
    <>
      {swordEl}
      {drawArm(r.far)}
      {drawLeg(r.legFar, 0)}
      {drawLeg(r.legNear, 1)}
    </>
  );

  // ---- the torso ----------------------------------------------------------------
  let torso: React.ReactNode;
  if (kit === "steel") {
    const CUIR =
      `M${b(-34, SH_Y + 2)}Q${b(-27, SH_Y - 7)} ${b(-17, SH_Y - 5)}Q${b(-4, SH_Y + 8)} ${b(9, SH_Y - 5)}Q${b(22, SH_Y - 8)} ${b(34, SH_Y + 2)}` +
      `C${b(38, -70)} ${b(31, -40)} ${b(27, -12)}L${b(33, 3)}Q${b(-6, 14)} ${b(-38, 4)}L${b(-34, -10)}C${b(-46, -30)} ${b(-47, -62)} ${b(-41, -84)}Q${b(-39, -92)} ${b(-34, SH_Y + 2)}Z`;
    // the shade falls on screen right whichever way he faces
    const a0 = 8;
    const a1 = 44;
    torso = (
      <g transform={torsoTf}>
        <clipPath id={`${uid}-cuir`}>
          <path d={CUIR} />
        </clipPath>
        {/* the tassets: the front one foreshortened, the near one broad */}
        <path d={`M${b(-37, 1)}L${b(-20, 6)}L${b(-19, 41)}L${b(-42, 35)}Z`} fill={steel.deep} {...OUT} />
        <path d={`M${b(-18, 6)}L${b(33, 0)}L${b(39, 35)}L${b(-16, 43)}Z`} fill={steel.deep} {...OUT} />
        <path d={`M${b(-39, 13)}L${b(-20, 18)}M${b(-40, 24)}L${b(-19, 29)}M${b(-18, 18)}L${b(35, 12)}M${b(-17, 30)}L${b(37, 23)}`} {...ln(1.1, 0.65)} />
        <path d={hatchD(14, 2, 44, 44, 104, 2.8, 48, 0.2)} {...ln(0.85, 0.45)} />
        {/* the cuirass: a peascod breast with its ridge, the waist flange */}
        <path d={CUIR} fill={steel.main} {...OUT} />
        <g clipPath={`url(#${uid}-cuir)`}>
          <path d={hatchD(a0, SH_Y, a1, 8, 110, 2.8, 44)} {...ln(0.95, 0.6)} />
          <path d={hatchD(a0 + 10, SH_Y + 30, a1, 8, 62, 3.4, 45)} {...ln(0.9, 0.45)} />
          <path d={`M${b(-9, SH_Y + 3)}C${b(-22, -74)} ${b(-33, -40)} ${b(-21, 8)}`} {...ln(1.5, 0.82)} />
          <path d={`M${b(-35, -9)}Q${b(-6, 1)} ${b(28, -11)}`} {...ln(1.3, 0.75)} />
          <path d={`M${b(33, SH_Y + 30)}Q${b(21, SH_Y + 22)} ${b(24, SH_Y + 3)}`} {...ln(1.1, 0.6)} />
        </g>
        {/* the gorget */}
        <path d={`M${b(-21, SH_Y)}Q${b(-5, SH_Y + 17)} ${b(14, SH_Y)}L${b(10, SH_Y - 10)}Q${b(-5, SH_Y + 1)} ${b(-17, SH_Y - 10)}Z`} fill={steel.deep} {...OUT} />
      </g>
    );
  } else {
    // the pushes into the cloth
    const warp: Map = (p) => {
      let x = p[0];
      let y = p[1];
      for (const d of dents) {
        const dx = p[0] - d.at[0];
        const dy = p[1] - d.at[1];
        const w = Math.exp(-(dx * dx + dy * dy) / (d.r * d.r));
        x += d.push[0] * w;
        y += d.push[1] * w;
      }
      return [x, y];
    };
    const outline = quiltLocal(fx).map(warp);
    const QD = polyD(outline, true);
    /** the cloth's surface: arc s from the lace line, y down the body */
    const cl = (s: number, y: number): P2 => warp(fx([colF(s), y]));
    const S0 = -122;
    const S1 = 52;
    const Y0 = -114;
    const Y1 = 58;
    const lines: string[] = [];
    for (let c = -16; c <= 16; c++) {
      for (const sg of [1, -1]) {
        const pts: P2[] = [];
        for (let y = Y0; y <= Y1; y += 3.6) {
          const s = QW * (2 * c - (sg * y) / QH);
          if (s < S0 || s > S1) continue;
          pts.push(cl(s, y));
        }
        if (pts.length > 1) lines.push(polyD(pts));
      }
    }
    // each diamond puffs: a few strokes tucked under its lower stitching, away from the light
    let puffs = "";
    for (let a = -16; a <= 16; a++)
      for (let c = -16; c <= 16; c++) {
        const cs = QW * (a + c + 1);
        const cy = QH * (a - c);
        if (cs < S0 || cs > S1 || cy < Y0 || cy > Y1) continue;
        const right: P2 = [cs + QW, cy];
        const bot: P2 = [cs, cy + QH];
        [0.14, 0.32, 0.5, 0.68, 0.86].forEach((t, i) => {
          const e = mix2(right, bot, t);
          const len = 0.5 - 0.5 * Math.abs(t - 0.5) + 0.08 * hash(a * 31 + c, i);
          const e2 = mix2(e, [cs, cy], len);
          puffs += `M${P(cl(e[0], e[1]))}L${P(cl(e2[0], e2[1]))}`;
        });
      }
    const tieYs = [-90, -72, -54];
    const beltPts: St[] = [
      [fx([54, -4]), 8],
      [fx([8, -9.5]), 8],
      [fx([-42, -12]), 8],
    ];
    torso = (
      <g transform={torsoTf}>
        <clipPath id={`${uid}-quilt`}>
          <path d={QD} />
        </clipPath>
        <path d={QD} fill={ink.main} {...OUT} strokeWidth={2.5} />
        <g clipPath={`url(#${uid}-quilt)`}>
          {/* shade on the side away from the light, kept light so the quilting stays the subject */}
          <path d={hatchD(30, -110, 58, 56, 108, 3.3, 44, 0.2)} {...ln(0.9, 0.34)} />
          <path d={puffs} {...ln(1, 0.62)} />
          <path d={lines.join("")} {...ln(2, 0.86)} />
          {/* the bound edge all round */}
          <path d={QD} fill="none" stroke={DARK} strokeOpacity={0.7} strokeWidth={10.4} strokeLinejoin="round" />
          <path d={QD} fill="none" stroke={ink.main} strokeWidth={8} strokeLinejoin="round" />
          {/* the opening down the chest and its tie laces */}
          <path d={polyD(Array.from({ length: 30 }, (_, i) => cl(0, -106 + i * 5.5)))} {...ln(1.7, 0.85)} />
          {tieYs.map((y) => (
            <g key={y}>
              <path d={limbD([[cl(-8, y - 1.6), 3.4], [cl(0, y), 3.8], [cl(8, y - 1.2), 3.4]])} fill={ink.deep} {...OUT} strokeWidth={1.5} />
              <path d={limbD([[cl(0, y), 3], [cl(-4, y + 6), 2.8], [cl(-5.5, y + 11.5), 2.2]])} fill={ink.deep} {...OUT} strokeWidth={1.4} />
              <path d={limbD([[cl(0, y), 3], [cl(3.6, y + 6), 2.8], [cl(6.4, y + 10.5), 2.2]])} fill={ink.deep} {...OUT} strokeWidth={1.4} />
              <circle cx={cl(0, y)[0]} cy={cl(0, y)[1]} r={2.7} fill={ink.main} {...OUT} strokeWidth={1.4} />
            </g>
          ))}
          {/* the sword belt, cinching the padding */}
          <path d={limbD(beltPts.map(([p, w]): St => [warp(p), w]))} fill={ink.hair} {...OUT} strokeWidth={2} />
          <path d={`M${P(fx([48, -6]))}Q${P(fx([8, -11.5]))} ${P(fx([-40, -14]))}`} {...ln(0.9, 0.5)} />
          <rect x={fx([30, 0])[0] - 5.5} y={-13.4} width={11} height={11.6} rx={1.4} fill={steel.main} {...OUT} strokeWidth={1.7} />
          <path d={`M${fx([30, 0])[0].toFixed(1)},-13L${fx([30, 0])[0].toFixed(1)},-2.4`} {...ln(1.1, 0.7)} />
        </g>
        {/* where a point has gone through: the slit and the cloth dragged in round it */}
        {dents.map((d, i) => {
          if (!d.slit || d.slit <= 0.01) return null;
          const c = add(d.at, d.push);
          const u = vlen(d.push) > 0.01 ? norm(d.push) : ([-dir, 0] as P2);
          const n: P2 = [-u[1], u[0]];
          const o = d.slit;
          const tf2 = d.tuft ?? 0;
          const ou = d.out ?? ([-u[0], -u[1]] as P2);
          const pt = (along: number, across: number): P2 => add(c, add(mul(u, along), mul(n, across)));
          // a ragged tear, not a neat hole: its lips jag in and out
          const SLIT = polyD([pt(-2.6, -10 * o), pt(1.5, -6.5 * o), pt(-0.6, -3.5 * o), pt(4.2 * o, -0.5), pt(0.4, 3 * o), pt(3 * o, 6 * o), pt(-2.2, 10.5 * o), pt(-4.4, 5.5 * o), pt(-2.4, 2 * o), pt(-5, -2.5 * o), pt(-3, -6 * o)], true);
          // loose threads: thin, they fall away from the lips
          const th = (across: number, len: number, sway: number) => {
            const a0 = pt(-2.5, across * o);
            const dn: P2 = norm(add(mul(ou, 0.75), [0, 0.8]));
            const w: P2 = [-dn[1], dn[0]];
            return `M${P(a0)}Q${P(add(a0, add(mul(dn, len * 0.5 * tf2), mul(w, sway * tf2))))} ${P(add(a0, add(mul(dn, len * tf2), mul(w, -sway * 0.5 * tf2))))}`;
          };
          const threads = [th(-8, 9, 2.4), th(-2.5, 13, -2), th(4, 8, 1.6), th(9, 11, -2.4)].join("");
          const puff = add(pt(-4.5, 8.5 * o), [0, 1.5]);
          return (
            <g key={i}>
              <path d={[-1.3, -0.8, -0.3, 0.3, 0.8, 1.3].map((v) => `M${P(pt(3, v * 6))}Q${P(pt(11 * o, v * 9.5))} ${P(pt((26 - 8 * Math.abs(v)) * o, v * 20))}`).join("")} {...ln(2, 0.85 * o)} />
              <path d={SLIT} fill={DARK} opacity={0.96} stroke={DARK} strokeWidth={1.2} strokeLinejoin="miter" />
              {tf2 > 0.02 ? (
                <>
                  <path d={threads} fill="none" stroke={DARK} strokeWidth={2.9} strokeLinecap="round" />
                  <path d={threads} fill="none" stroke={ink.main} strokeWidth={1.25} strokeLinecap="round" />
                  <path d={smoothClosed([add(puff, [-3.2 * tf2, 0.4]), add(puff, [-1.4, -2.4 * tf2]), add(puff, [1.6, -1.5 * tf2]), add(puff, [3.4 * tf2, 0.8]), add(puff, [1.2, 2.7 * tf2]), add(puff, [-1.6, 1.9 * tf2])])} fill={ink.deep} {...OUT} strokeWidth={1.4} />
                </>
              ) : null}
            </g>
          );
        })}
      </g>
    );
  }

  const front = (
    <>
      {torso}
      {/* neck and head */}
      <path d={limbD([[add(r.neck, [0, 5]), 20 * k], [mix2(r.neck, add(r.headC, [-7 * r.hs * HEAD_S, 0]), 0.78), 16.5 * k]])} fill={ink.main} {...OUT} />
      {kit === "steel" ? null : <path d={limbD([[add(r.neck, bp(-13, 2)), 7], [add(r.neck, bp(2, 6)), 8], [add(r.neck, bp(15, 1)), 7]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />}
      <g transform={`translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${HEAD_S})`}>
        <Head beard={beard} yaw={r.yaw} nod={Math.max(0, r.nodF)} face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }} uid={`${uid}-h`} ink={ink} steel={steel} />
      </g>
      {drawArm(r.near)}
    </>
  );
  return (
    <g transform={tf}>
      {layer !== "front" ? <Cased id={`${uid}-caseb`}>{back}</Cased> : null}
      {layer !== "back" ? <Cased id={`${uid}-casef`}>{front}</Cased> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WALK: one cycle as ankle targets, forward units (texcocoShared's walkPose)
// ---------------------------------------------------------------------------
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
export const walkLegs = (phase: number, stride: number) => {
  const leg = (u0: number) => {
    const u = frac(u0);
    if (u < 0.5) {
      const v = u / 0.5;
      const peel = Math.max(0, (v - 0.62) / 0.38);
      const land = Math.max(0, 1 - v / 0.14);
      const lift = 30 * ease(peel) - 14 * land;
      return { off: [stride * (0.5 - v), -Math.max(0, Math.sin((lift * Math.PI) / 180)) * 24] as P2, lift };
    }
    const v = (u - 0.5) / 0.5;
    return { off: [stride * (-0.5 + ease(v)), -15 * Math.sin(Math.PI * v) - 12 * (1 - v) * (1 - v)] as P2, lift: 30 * (1 - ease(Math.min(1, v * 1.6))) - 14 * ease(Math.max(0, (v - 0.45) / 0.55)) };
  };
  return { far: leg(phase), near: leg(phase + 0.5), bob: 2.5 + 2.2 * Math.cos(4 * Math.PI * phase) };
};

// ---------------------------------------------------------------------------
// THE PIKE: a long slim ash shaft; a narrow steel leaf blade with a mid-rib on
// a long tapering socket, two langets riveted far down the shaft. `tip` = the
// point (world px); the shaft runs from it along `ang` (deg, 0 = to screen
// right, - = rising away from the point); `len` in units. The head is `head`
// times life size so it reads on a phone.
// ---------------------------------------------------------------------------
export const Pike: React.FC<{ tip: P2; ang: number; len: number; scale: number; uid: string; ink?: Ink; steel?: Ink; head?: number }> = ({ tip, ang, len, scale, uid, ink = CREAM, steel = ORANGE, head: h = 1.2 }) => {
  const f = (x: number, y: number) => `${(x * h).toFixed(1)},${(y * h).toFixed(1)}`;
  const BLADE = `M0,0C${f(9, -1.1)} ${f(15, -4.7)} ${f(22, -4.7)}C${f(30, -4.7)} ${f(39, -2.7)} ${f(46, -1.9)}L${f(46, 1.9)}C${f(39, 2.7)} ${f(30, 4.7)} ${f(22, 4.7)}C${f(15, 4.7)} ${f(9, 1.1)} 0,0Z`;
  const x0 = 46 * h;
  const x1 = 70 * h;
  const lg = x1 + 66;
  return (
    <g transform={`translate(${tip[0].toFixed(2)} ${tip[1].toFixed(2)}) rotate(${ang.toFixed(3)}) scale(${scale.toFixed(4)})`}>
      <Cased id={`${uid}-case`} r={1.3}>
        {/* the shaft */}
        <path d={`M${x1 - 2},-2.6L${len},-2.9L${len},2.9L${x1 - 2},2.6Z`} fill={ink.main} {...OUT} strokeWidth={1.9} />
        <path d={`M${lg + 4},1.2L${len},1.4`} {...ln(1.1, 0.5)} />
        {/* the langets and their rivets */}
        <path d={`M${x1 - 1},-3.3L${lg},-3.1L${lg + 7},-2.1L${lg},-1L${x1 - 1},-1Z`} fill={steel.main} {...OUT} strokeWidth={1.2} />
        <path d={`M${x1 - 1},3.3L${lg},3.1L${lg + 7},2.1L${lg},1L${x1 - 1},1Z`} fill={steel.deep} {...OUT} strokeWidth={1.2} />
        {[0.15, 0.4, 0.65, 0.9].map((v) => (
          <circle key={v} cx={x1 + 66 * v} cy={-2.1} r={0.8} fill={DARK} opacity={0.85} />
        ))}
        {/* the long socket, a turned ring where it meets the shaft, the leaf blade with its rib */}
        <path d={`M${x0},${(-1.9 * h).toFixed(1)}L${x1},-3.5L${x1},3.5L${x0},${(1.9 * h).toFixed(1)}Z`} fill={steel.deep} {...OUT} strokeWidth={1.7} />
        <path d={`M${x0 + 4},0.6L${x1 - 3},1.6`} {...ln(0.8, 0.5)} />
        <path d={`M${x1},-3.9L${x1},3.9M${x0 + 1.5},${(-2.2 * h).toFixed(1)}L${x0 + 1.5},${(2.2 * h).toFixed(1)}`} {...ln(1.6, 0.85)} />
        <clipPath id={`${uid}-bl`}>
          <path d={BLADE} />
        </clipPath>
        <path d={BLADE} fill={steel.main} {...OUT} strokeWidth={2} />
        <g clipPath={`url(#${uid}-bl)`}>
          <path d={`M${f(3, 0)}L${f(46, 0)}L${f(46, 5)}L${f(22, 5)}Z`} fill={steel.deep} opacity={0.75} />
          <path d={hatchD(8 * h, 0.5, 46 * h, 5 * h, 68, 2.4, 52, 0.25)} {...ln(0.8, 0.5)} />
          <path d={`M${f(2, 0)}L${f(46, 0)}`} {...ln(1.5, 0.9)} />
        </g>
      </Cased>
    </g>
  );
};
