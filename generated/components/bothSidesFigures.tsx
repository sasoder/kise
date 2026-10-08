// ---------------------------------------------------------------------------
// bothSidesFigures: the two conquistadors of the "Texcoco" clip's BothSides cut
// (a captain with his hand on his sword, and a banner-bearer), drawn in the
// engraving grammar of texcocoFigures (cream form on a dark casing, firm dark
// outline, tapered limbs, bracelet strokes, hatched shade; light from the
// upper left) and to the same scale (figure-local units: feet at (0, 0), up is
// negative y, a bare-headed man ~310 units; world px = units x scale).
//
// Unlike the Aztec rig these bodies are drawn in ONE view: three-quarter,
// facing screen LEFT (his chest toward the left, his left side toward us, the
// sword on the near hip). The head has its own yaw (absolute, negative = left;
// keep it in -1.15 .. -0.45), roll and pitch; both arms are two-bone IK to
// wrist targets. `far` = his right arm (the shoulder on screen left), `near` =
// his left arm. The morion is a dome with a crescent comb running fore and aft
// and a boat brim swept up to a peak at the front and the back.
//
// Draw inside a WorldSvg. EXPORTS: Conquistador, conqRig, conqAnchors,
// CAPTAIN_STAND, BEARER_STAND, type ConqPose.
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, hash, type P2 } from "./incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "./stringsMotion";
import { CREAM, type ArmPose, type Ink } from "./texcocoFigures";

// ---------------------------------------------------------------------------
// the engraver's helpers (as texcocoFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const segD = (segs: Seg[]) => segs.map(([a, b]) => `M${P(a)}L${P(b)}`).join("");
const polyD = (pts: P2[], close = false) => `M${pts.map((p) => P(p)).join("L")}${close ? "Z" : ""}`;
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
export type ConqKind = "captain" | "bearer";
export type ConqPose = {
  /** the head's yaw (absolute), rad: negative = facing screen left; -1.15 .. -0.45 */
  headYaw: number;
  /** head roll, deg (+ = clockwise) and pitch, deg (+ = chin down) */
  roll: number;
  pitch: number;
  /** torso lean about the hips, deg (- = forward, toward screen left) */
  lean: number;
  /** his right arm (the shoulder on screen left) and his left arm (toward us) */
  far: ArmPose;
  near: ArmPose;
  brow: number;
  lids: number;
  mouth: number;
  /** the banner's wave phase, rad (drive it with a slow clock) */
  wave: number;
};
/** the sword's pommel and the banner's staff, figure-local */
const POMMEL: P2 = [13, -183];
const STAFF_X = 41;
export const CAPTAIN_STAND: ConqPose = {
  headYaw: -0.82,
  roll: 0,
  pitch: -3,
  lean: 0,
  far: { w: [-45, -147], elbow: [-0.3, 1], fist: 0.35, hand: 0 },
  near: { w: [24, -180], elbow: [1, 0.3], fist: 0.7, hand: 32 },
  brow: 0.35,
  lids: 0,
  mouth: 0,
  wave: 0,
};
export const BEARER_STAND: ConqPose = {
  headYaw: -0.7,
  roll: 0,
  pitch: -2,
  lean: 0,
  far: { w: [-40, -150], elbow: [-0.3, 1], fist: 0.5, hand: 0 },
  near: { w: [STAFF_X - 1, -141], elbow: [1, 0.3], fist: 1, hand: -8 },
  brow: 0.3,
  lids: 0,
  mouth: 0,
  wave: 0,
};

const HIP_Y = -152;
const SH_Y = -99;
const HEAD_S = 1.08;
const limbK = (kind: ConqKind) => (kind === "captain" ? 1.02 : 1.07);
export type ConqRig = ReturnType<typeof conqRig>;
export const conqRig = (kind: ConqKind, q: ConqPose) => {
  const k = limbK(kind);
  const hip: P2 = [0, HIP_Y];
  const toFig = (p: P2): P2 => add(hip, rot(p, q.lean));
  const neck = toFig([-4, SH_Y - 3]);
  const hc = Math.cos(q.headYaw);
  const hs = Math.sin(q.headYaw);
  const nodF = clamp1(q.pitch / 22) * hc * hc;
  const headAngle = q.lean * 0.5 + q.roll + q.pitch * hs;
  const headC = add(add(neck, rot([0, -(31 - 8 * Math.max(0, nodF)) * (HEAD_S / 1.1)], q.lean * 0.7 + q.roll * 0.45 + q.pitch * hs * 0.4)), [5 * hs * HEAD_S, 0]);
  const arm = (sgn: number, sh: P2, ap: ArmPose) => {
    const S = toFig(sh);
    const { mid: E, end: W } = ik2(S, ap.w, 60, 56, ap.elbow);
    const f = sub(W, E);
    const dir = rot(vlen(f) > 2 ? norm(f) : [0, 1], ap.hand);
    return { S, E, W, dir, fist: ap.fist, sgn, grip: add(W, mul(dir, 11 * k)) };
  };
  const leg = (hx: number, ax: number) => {
    const H: P2 = [hx, HIP_Y + 2];
    const { mid: K, end: A } = ik2(H, [ax, -15], 70, 68, [-1.2, 0.02]);
    return { H, K, A };
  };
  return {
    k,
    hip,
    toFig,
    neck,
    headC,
    headAngle,
    hs,
    nodF,
    far: arm(-1, [-33, SH_Y + 2], q.far),
    near: arm(1, [31, SH_Y + 3], q.near),
    legFar: leg(-12, -23),
    legNear: leg(14, 19),
  };
};
/** his anchors in WORLD px */
export const conqAnchors = (kind: ConqKind, q: ConqPose, at: P2, scale: number) => {
  const r = conqRig(kind, q);
  const w = (v: P2): P2 => add(at, mul(v, scale));
  return {
    rig: r,
    headC: w(r.headC),
    /** the top of the morion's comb */
    crest: w(add(r.headC, rot([0, -61 * HEAD_S], r.headAngle))),
    shoulderFar: w(r.far.S),
    handFar: w(r.far.grip),
    handNear: w(r.near.grip),
  };
};

// ---------------------------------------------------------------------------
// THE HAND (as texcocoFigures')
// ---------------------------------------------------------------------------
type ArmRig = ConqRig["far"];
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
      {/* the cuff */}
      <path d={limbD([[at(-3.6, -9), 6 * k], [at(-3.6, 9), 6 * k]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(at(-3.6, -5))}L${P(at(-3.6, 5))}`} {...ln(0.9, 0.55)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE HEAD: bearded, in a morion (head-local units, (0, 0) = the middle of the face)
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
  // the comb: seen from the side a full crescent, narrowing as he turns to face us
  const w = 6 + 14.5 * t;
  const N = 14;
  const arc = (rx: number, ry: number, y0: number) => Array.from({ length: N + 1 }, (_, i): P2 => {
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
  // the brim: its peaks sweep up at the front and the back; the front one reaches further
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
const Head: React.FC<{ kind: ConqKind; yaw: number; nod: number; face: Face; uid: string; ink: Ink }> = ({ kind, yaw, nod, face, uid, ink }) => {
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
  // the near ear, once he is turned
  const e = pr(-sg * 20.6, 4, -5, 0);
  const ew = mix(0.55, 1, t);
  // the beard: the captain's comes to a point, the bearer's is cut square
  const drop = kind === "captain" ? 7 : 0;
  const BEARD = smoothClosed(
    blendYaw(BEARD_F, BEARD_P, yaw).map((p, i): P2 => {
      const low = [3, 4, 5].includes(i) ? drop : [2, 6].includes(i) ? drop * 0.45 : 0;
      return [p[0] + (i === 4 ? sg * drop * 0.5 * t : 0), p[1] + fy * 0.6 + low];
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
      {/* the crease beside the nose */}
      {[-1, 1].map((sd) => (
        <path key={sd} d={`M${P(pr(sd * 6.4, 9.4, 15.5))}Q${P(pr(sd * 9.6, 12.4, 13.5))} ${P(pr(sd * 10, 16.4, 11.5))}`} {...ln(1, 0.5 * vis(sd))} />
      ))}
      {t > 0.2 ? (
        <>
          <ellipse cx={e[0]} cy={e[1]} rx={4.2 * ew} ry={6.4} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={`M${(e[0] + sg * 1.6 * ew).toFixed(1)},${e[1] - 3}q${(-sg * 3.4 * ew).toFixed(1)},2.6 ${(-sg * 0.6 * ew).toFixed(1)},6`} {...ln(1, 0.6)} />
        </>
      ) : null}
      {/* the beard and the moustache */}
      <path d={BEARD} fill={ink.hair} {...OUT} />
      <g clipPath={`url(#${uid}-beard)`}>
        <path d={hatchD(-26, 0, 28, 46, 84, 2.1, 73, 0.12)} {...ln(1.2, 0.8)} />
      </g>
      {[-1, 1].map(half)}
      {[-1, 1].map((sd) => (
        <path key={sd} d={limbD([[pr(0, 13.2, 20.8, 0.7), 4.6], [pr(sd * 5.5, 13.6, 17.5, 0.7), 4.8], [pr(sd * 11, 18, 12.5, 0.7), 2.6]])} fill={ink.hair} {...OUT} strokeWidth={1.6} opacity={vis(sd)} />
      ))}
      <Morion yaw={yaw} ink={ink} uid={uid} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SHOE (toes to screen left)
// ---------------------------------------------------------------------------
const SHOE: P2[] = [[6, 1], [-6, 1], [-13, 7.2], [-23, 10.4], [-27.5, 13.6], [-25.5, 16.8], [-8, 17.6], [8.6, 16.8], [10.8, 11], [8.4, 4]];
const Shoe: React.FC<{ A: P2; k: number; ink: Ink }> = ({ A, k, ink }) => (
  <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) scale(${k.toFixed(3)})`}>
    <path d={smoothClosed(SHOE)} fill={ink.deep} {...OUT} strokeWidth={2.1} />
    <path d="M8.6,16.8Q-8,14.2 -25.5,16.8" {...ln(1.3, 0.75)} />
    <path d="M6.4,4.6Q-4,9.4 -13.4,7.6" {...ln(1.2, 0.7)} />
    <path d="M-16,9.2l-3,6M-20.4,10.6l-2.6,5" {...ln(0.9, 0.5)} />
  </g>
);

// ---------------------------------------------------------------------------
// THE CONQUISTADOR
// ---------------------------------------------------------------------------
export type ConquistadorProps = {
  kind: ConqKind;
  pose: ConqPose;
  /** his feet, world px, and px per unit */
  at: P2;
  scale: number;
  uid: string;
  ink?: Ink;
  /** draw the body (default) and which arms; lay "far" over another figure with body={false} */
  body?: boolean;
  arms?: "both" | "far" | "near" | "none";
};
export const Conquistador: React.FC<ConquistadorProps> = ({ kind, pose: q, at, scale, uid, ink = CREAM, body = true, arms: which = "both" }) => {
  const r = conqRig(kind, q);
  const k = r.k;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`;

  const drawArm = (ar: ArmRig) => {
    const fl = vlen(sub(ar.W, ar.E));
    const dv = sub(ar.E, ar.S);
    const u: P2 = vlen(dv) > 0.5 ? norm(dv) : [0, 1];
    const n: P2 = [-u[1], u[0]];
    return (
      <g key={ar.sgn}>
        {/* the padded sleeve, slashed; the pauldron's lames over the shoulder */}
        <path d={limbD(bones(ar.S, ar.E, ar.W, [26, 27, 20, 20, 12.5].map((w) => w * k)))} fill={ink.deep} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 25 * k, 20 * k, 85 + ar.sgn, 2.9) + (fl > 14 ? braceletD(ar.E, ar.W, 20 * k, 12 * k, 87 + ar.sgn, 2.9) : "")} {...ln(0.95, 0.62)} />
        <path d={[0.34, 0.56, 0.78].map((v) => `M${P(add(mix2(ar.S, ar.E, v), mul(n, -5 * k)))}l${P(mul(u, 9 * k))}`).join("") + [0.2, 0.46].map((v) => `M${P(add(mix2(ar.E, ar.W, v), mul(n, -4 * k)))}L${P(add(mix2(ar.E, ar.W, v + 0.2), mul(n, -3.4 * k)))}`).join("")} {...ln(1.3, 0.7)} />
        <path d={limbD([[add(ar.S, add(mul(n, -14 * k), mul(u, 10 * k))), 12 * k], [add(ar.S, mul(u, -2 * k)), 20 * k], [add(ar.S, add(mul(n, 14 * k), mul(u, 10 * k))), 12 * k]])} fill={ink.main} {...OUT} />
        {[4, 11].map((d) => (
          <path key={d} d={`M${P(add(ar.S, add(mul(n, -13 * k), mul(u, (d + 4) * k))))}Q${P(add(ar.S, mul(u, (d - 5) * k)))} ${P(add(ar.S, add(mul(n, 13 * k), mul(u, (d + 4) * k))))}`} {...ln(1.1, 0.7)} />
        ))}
        <path d={braceletD(add(ar.S, mul(n, -12 * k)), add(ar.S, mul(n, 12 * k)), 16 * k, 16 * k, 93 + ar.sgn, 3, 0.6)} {...ln(0.85, 0.42)} />
        <Hand a={ar} k={k} ink={ink} />
      </g>
    );
  };
  const farOn = which === "both" || which === "far";
  const nearOn = which === "both" || which === "near";
  if (!body)
    return (
      <g transform={tf}>
        <Cased id={`${uid}-acase`}>
          {farOn ? drawArm(r.far) : null}
          {nearOn ? drawArm(r.near) : null}
        </Cased>
      </g>
    );

  const drawLeg = (l: ConqRig["legFar"], seed: number) => {
    const calf = mix2(l.K, l.A, 0.34);
    const st: St[] = [
      [l.H, 21 * k],
      [mix2(l.H, l.K, 0.5), 19 * k],
      [l.K, 15 * k],
      [[calf[0] + 2.4 * k, calf[1]], 17.5 * k],
      [mix2(l.K, l.A, 0.82), 11.5 * k],
      [l.A, 10.5 * k],
    ];
    const g = mix2(l.K, l.A, 0.1);
    return (
      <g key={seed}>
        <path d={limbD(st)} fill={ink.main} {...OUT} />
        <path d={braceletD(l.K, l.A, 17 * k, 11 * k, 81 + seed, 2.9)} {...ln(0.95, 0.62)} />
        <Shoe A={l.A} k={k} ink={ink} />
        {/* the paned trunk hose, a garter under the knee */}
        <path d={limbD([[add(l.H, [0, -8]), 31 * k], [mix2(l.H, l.K, 0.28), 41 * k], [mix2(l.H, l.K, 0.56), 35 * k], [mix2(l.H, l.K, 0.7), 23 * k]])} fill={ink.deep} {...OUT} />
        <path d={[-0.34, -0.12, 0.12, 0.34].map((u) => `M${P(add(mix2(l.H, l.K, 0.02), [u * 26 * k, 0]))}Q${P(add(mix2(l.H, l.K, 0.3), [u * 46 * k - 2, 0]))} ${P(add(mix2(l.H, l.K, 0.66), [u * 22 * k, 0]))}`).join("")} {...ln(1.2, 0.7)} />
        <path d={braceletD(mix2(l.H, l.K, 0.05), mix2(l.H, l.K, 0.62), 36 * k, 32 * k, 95 + seed, 3.2, 0.7)} {...ln(0.9, 0.5)} />
        <path d={limbD([[add(g, [-8.4 * k, 0]), 4.8], [add(g, [8.4 * k, 0]), 4.8]])} fill={ink.main} {...OUT} strokeWidth={1.7} />
      </g>
    );
  };

  // ---- the steel (torso-local: hips (0, 0), shoulders at y = SH_Y); three-quarter, chest to the left
  const CUIR =
    `M-34,${SH_Y + 2}Q-27,${SH_Y - 7} -17,${SH_Y - 5}Q-4,${SH_Y + 8} 9,${SH_Y - 5}Q22,${SH_Y - 8} 34,${SH_Y + 2}` +
    `C38,-70 31,-40 27,-12L33,3Q-6,14 -38,4L-34,-10C-46,-30 -47,-62 -41,-84Q-39,-92 -34,${SH_Y + 2}Z`;
  const RIDGE = `M-9,${SH_Y + 3}C-22,-74 -33,-40 -21,8`;
  const hilt: P2 = [21, -3];
  // the banner: a swallow-tailed pennon with the saltire, streaming to screen left
  const TOP = -444;
  const fl = (u: number, v: number): P2 => [STAFF_X - 3 - u * 98, TOP + 5 + v * 66 * (1 - 0.16 * u) + 7 * u + 6.5 * u * Math.sin(u * 4.6 - q.wave) + 2.2 * u * Math.sin(u * 9 - q.wave * 1.7 + 1)];
  const FLAG = `M${P(fl(0, 0))}Q${P(fl(0.25, -0.03))} ${P(fl(0.5, 0))}T${P(fl(1, 0.02))}L${P(fl(0.76, 0.5))}L${P(fl(1, 0.98))}Q${P(fl(0.75, 1.03))} ${P(fl(0.5, 1))}T${P(fl(0, 1))}Z`;

  return (
    <g transform={tf}>
      <Cased id={`${uid}-case`}>
        {farOn ? drawArm(r.far) : null}
        {drawLeg(r.legFar, 0)}
        {drawLeg(r.legNear, 1)}
        <g transform={torsoTf}>
          <clipPath id={`${uid}-cuir`}>
            <path d={CUIR} />
          </clipPath>
          {/* the tassets: the front one foreshortened, the near one broad */}
          <path d="M-37,1L-20,6L-19,41L-42,35Z" fill={ink.deep} {...OUT} />
          <path d="M-18,6L33,0L39,35L-16,43Z" fill={ink.deep} {...OUT} />
          <path d="M-39,13L-20,18M-40,24L-19,29M-18,18L35,12M-17,30L37,23" {...ln(1.1, 0.65)} />
          <path d={hatchD(14, 2, 40, 42, 104, 2.8, 48, 0.2)} {...ln(0.85, 0.45)} />
          {/* the cuirass: a peascod breast with its ridge, the waist flange */}
          <path d={CUIR} fill={ink.main} {...OUT} />
          <g clipPath={`url(#${uid}-cuir)`}>
            <path d={hatchD(8, SH_Y, 40, 8, 110, 2.8, 44)} {...ln(0.95, 0.6)} />
            <path d={hatchD(18, SH_Y + 30, 40, 8, 62, 3.4, 45)} {...ln(0.9, 0.45)} />
            <path d={hatchD(-46, -40, -24, 6, 72, 3, 46, 0.3)} {...ln(0.85, 0.36)} />
            <path d={RIDGE} {...ln(1.5, 0.82)} />
            <path d="M-35,-9Q-6,1 28,-11" {...ln(1.3, 0.75)} />
            <path d={`M33,${SH_Y + 30}Q21,${SH_Y + 22} 24,${SH_Y + 3}`} {...ln(1.1, 0.6)} />
            {kind === "captain" ? (
              <>
                {/* the baldric, from the far shoulder down to the sword */}
                <path d={`M-31,${SH_Y - 4}L-19,${SH_Y - 6}L34,-6L26,6Z`} fill={ink.deep} stroke={DARK} strokeWidth={1.8} strokeLinejoin="round" />
                <path d={`M-24,${SH_Y}L29,-1`} {...ln(0.9, 0.5)} />
              </>
            ) : null}
          </g>
          {/* the gorget */}
          <path d={`M-21,${SH_Y}Q-5,${SH_Y + 17} 14,${SH_Y}L10,${SH_Y - 10}Q-5,${SH_Y + 1} -17,${SH_Y - 10}Z`} fill={ink.deep} {...OUT} />
          {kind === "captain" ? (
            <>
              {/* the sword on the near hip: scabbard trailing back, cross-guard, grip, pommel, knuckle bow */}
              <path d={limbD([[add(hilt, [-1, 2]), 8], [add(hilt, [17, 60]), 7], [add(hilt, [35, 122]), 4.4]])} fill={ink.deep} {...OUT} />
              <path d={`M${P(add(hilt, [3, 12]))}L${P(add(hilt, [33, 116]))}`} {...ln(0.9, 0.55)} />
              <path d={`M${P(add(hilt, [26, 96]))}l9,-3M${P(add(hilt, [5, 22]))}l9,-3`} {...ln(1.2, 0.7)} />
              <path d={`M${P(add(hilt, [-13, -3]))}Q${P(add(hilt, [-21, -20]))} ${P(add(hilt, [-10, -29]))}`} fill="none" stroke={DARK} strokeWidth={5.4} strokeLinecap="round" />
              <path d={`M${P(add(hilt, [-13, -3]))}Q${P(add(hilt, [-21, -20]))} ${P(add(hilt, [-10, -29]))}`} fill="none" stroke={ink.main} strokeWidth={2.4} strokeLinecap="round" />
              <path d={limbD([[add(hilt, [-15, -4]), 4.6], [add(hilt, [13, 5]), 4.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
              <path d={limbD([[hilt, 6.6], [add(hilt, [-7, -25]), 5.8]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
              <path d={[0.25, 0.5, 0.75].map((v) => `M${P(add(hilt, [-7 * v - 3, -25 * v]))}l6,-1.6`).join("")} {...ln(0.9, 0.6)} />
              <circle cx={hilt[0] - 8} cy={hilt[1] - 29} r={5.4} fill={ink.main} {...OUT} strokeWidth={1.9} />
            </>
          ) : null}
        </g>
        {/* neck and head */}
        <path d={limbD([[add(r.neck, [0, 5]), 20 * k], [mix2(r.neck, add(r.headC, [-7 * r.hs * HEAD_S, 0]), 0.78), 16.5 * k]])} fill={ink.main} {...OUT} />
        <g transform={`translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${HEAD_S})`}>
          <Head kind={kind} yaw={q.headYaw} nod={Math.max(0, r.nodF)} face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }} uid={`${uid}-h`} ink={ink} />
        </g>
        {kind === "bearer" ? (
          <>
            <path d={limbD([[[STAFF_X, 4], 5.8], [[STAFF_X, -200], 5.8], [[STAFF_X, TOP], 4.8]])} fill={ink.deep} {...OUT} />
            <path d={`M${STAFF_X},${TOP}l-5.6,-12q5.6,-18 5.6,-24q0,6 5.6,24Z`} fill={ink.main} {...OUT} strokeWidth={1.9} />
            <path d={FLAG} fill={ink.main} {...OUT} />
            <path d={`M${P(fl(0.1, 0.14))}L${P(fl(0.64, 0.86))}M${P(fl(0.1, 0.86))}L${P(fl(0.64, 0.14))}`} {...ln(3, 0.82)} />
            <path d={[0.3, 0.55, 0.8].map((v) => `M${P(fl(v, 0.06))}Q${P(fl(v - 0.03, 0.5))} ${P(fl(v, 0.94))}`).join("")} {...ln(0.9, 0.4)} />
          </>
        ) : null}
        {nearOn ? drawArm(r.near) : null}
      </Cased>
    </g>
  );
};
/** the pommel (captain) and the staff (bearer), figure-local, for wrist targets */
export const CONQ = { POMMEL, STAFF_X };
