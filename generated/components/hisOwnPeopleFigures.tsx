// ---------------------------------------------------------------------------
// hisOwnPeopleFigures: the noble of the strings set (stringsFigures' Noble,
// copied line for line because that module is frozen and keeps its drawing
// helpers private) with the two things HisOwnPeople needs and the shared one
// cannot do: `look` (the face lifts: he looks UP) and `reach` (one arm is
// raised to a hand target, to take hold of his own string). With look 0 and no
// reach it draws EXACTLY the shared Noble (the join with NotRockTheBoat).
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, INK, clamp01, hash, type P2 } from "./incaShared";
import { NOBLES, N_NOBLES, add, mix, mix2, mul, nobleRig, norm, relaxedJoint, rot, sub, vlen } from "./stringsMotion";

const C_MAIN = INK;
const C_DEEP = "#D3C5A2";
const C_HAIR = "#8C7F60";

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

/** hand-cut hatching: parallel strokes at `ang` deg filling the rect, each a
 *  hair off its place and ragged at both ends (clip it to the form it shades) */
const hatchD = (x0: number, y0: number, x1: number, y1: number, ang: number, gap: number, seed: number, rag = 0.28) => {
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
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
    d += `M${(px + dx * t0).toFixed(1)},${(py + dy * t0).toFixed(1)}L${(px + dx * t1).toFixed(1)},${(py + dy * t1).toFixed(1)}`;
  }
  return d;
};
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
  let last: P2 = [1, 0];
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
  const u0 = norm(sub(st[1][0], st[0][0]));
  const u1 = norm(sub(st[n - 1][0], st[n - 2][0]));
  return smoothClosed([...L, add(st[n - 1][0], mul(u1, st[n - 1][1] * 0.42)), ...R.reverse(), add(st[0][0], mul(u0, -st[0][1] * 0.42))]);
};
/** a two-bone limb's stations: root, belly, joint, belly, end */
const bones = (S: P2, E: P2, W: P2, w: [number, number, number, number, number]): St[] => [
  [S, w[0]],
  [mix2(S, E, 0.42), w[1]],
  [E, w[2]],
  [mix2(E, W, 0.36), w[3]],
  [W, w[4]],
];
/** the engraver's bracelet shading: short curved strokes round the limb's
 *  shaded side (screen right / under), from near its axis to its edge */
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
/** a fold of cloth: the fold line a -> b (bent through c) and the hatched
 *  wedge of shadow on its right, widening toward the hem */
const quad = (a: P2, c: P2, b: P2, t: number): P2 => mix2(mix2(a, c, t), mix2(c, b, t), t);
const foldD = (a: P2, c: P2, b: P2) => `M${P(a)}Q${P(c)} ${P(b)}`;
const foldHatchD = (a: P2, c: P2, b: P2, seed: number, len = 11, step = 0.04) => {
  let d = "";
  let i = 0;
  for (let t = 0.16; t < 0.97; t += step, i++) {
    const p = quad(a, c, b, t);
    const l = (2.5 + len * t) * (0.55 + 0.75 * hash(i, seed));
    d += `M${P(p)}l${(l * 0.86).toFixed(1)},${(l * 0.5).toFixed(1)}`;
  }
  return d;
};
/** a feather: a leaf from p along `deg` (0 = straight up), its rib and barbs */
const featherD = (p: P2, deg: number, L: number, w: number) => {
  const d = rot([0, -1], deg);
  const n: P2 = [-d[1], d[0]];
  const tip = add(p, mul(d, L));
  const m = add(p, mul(d, L * 0.5));
  let barbs = "";
  for (let t = 0.22; t < 0.9; t += 0.11) {
    const q = add(p, mul(d, L * t));
    const e = w * 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.15));
    barbs += `M${P(q)}L${P(add(q, add(mul(n, e), mul(d, e * 0.8))))}M${P(q)}L${P(add(q, add(mul(n, -e), mul(d, e * 0.8))))}`;
  }
  return {
    leaf: `M${P(p)}Q${P(add(m, mul(n, w * 0.62)))} ${P(tip)}Q${P(add(m, mul(n, -w * 0.62)))} ${P(p)}Z`,
    rib: `M${P(p)}L${P(add(p, mul(d, L * 0.9)))}`,
    barbs,
  };
};

// ---------------------------------------------------------------------------
// THE REACHING ARM (noble-local units: feet (0, 0), up negative, upright)
// ---------------------------------------------------------------------------
/** sgn: which arm (-1 = screen left); e: 0 hanging .. 1 raised; W: the hand's target (noble-local) */
export type Reach = { sgn: number; e: number; W: P2 };
const reachArm = (q: Reach) => {
  const r = nobleRig(0);
  const e = clamp01(q.e);
  const S: P2 = [q.sgn * r.hw, r.shY + 5];
  const hint = mix2([q.sgn * (r.hw + 5), r.shY + 27], [q.sgn * (r.hw + 13), r.shY - 4], e);
  const { mid: E, end } = relaxedJoint(S, q.W, hint, mix(25, 29, e), mix(23, 33, e));
  const f = sub(end, E);
  const fd: P2 = vlen(f) > 2 ? norm(f) : [0, 1];
  return { S, E, W: end, sgn: q.sgn, e, dir: norm(mix2([0, 1], fd, clamp01(e * 3))) };
};
type ArmGeo = { S: P2; E: P2; W: P2; sgn: number; e: number; dir: P2 };
const O_ = { ...OUT, strokeWidth: 1.9 };
/** the hand at the end of an arm: the shared Noble's (e 0), growing into a closed fist round the string (e 1) */
const HandShape: React.FC<{ a: ArmGeo }> = ({ a }) => {
  const d = a.dir;
  const n: P2 = [d[1], -d[0]];
  const g = 1 + 0.5 * a.e;
  const at = (al: number, ac: number): P2 => add(a.W, add(mul(d, (al - 4.2 * a.e) * g), mul(n, ac * g)));
  return (
    <>
      <path d={smoothClosed([at(-1, -4.2), at(-1, 4.2), at(5, 4.6), at(8.4, 0), at(5, -4.6)])} fill={C_MAIN} {...O_} strokeWidth={1.7} />
      <path d={`M${P(at(3.6, -1.6))}L${P(at(7.6, -1.6))}M${P(at(3.6, 1.6))}L${P(at(7.6, 1.6))}`} {...ln(0.8, 0.6)} />
    </>
  );
};
/** the raised hand alone, in noble i's frame: draw it OVER the string it holds */
export const NobleFist: React.FC<{ i: number; scale: number; tone?: number; reach: Reach }> = ({ i, scale, tone = 1, reach }) => {
  const lay = NOBLES[i % N_NOBLES];
  return (
    <g transform={`translate(${lay.x.toFixed(2)} ${lay.y.toFixed(2)}) scale(${scale.toFixed(3)})`} opacity={tone}>
      <HandShape a={reachArm(reach)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE NOBLE (stringsFigures' Noble + look + reach)
// ---------------------------------------------------------------------------
export const GripNoble: React.FC<{ i?: number; at?: P2; bow: number; tone?: number; variant?: number; scale?: number; uid?: string; look?: number; reach?: Reach | null }> = ({
  i = 0,
  at,
  bow,
  tone = 1,
  variant,
  scale,
  uid,
  look = 0,
  reach = null,
}) => {
  const lay = NOBLES[i % N_NOBLES];
  const [x, y] = at ?? [lay.x, lay.y];
  const v = (variant ?? lay.v) & 3;
  const sc = scale ?? lay.s;
  const id = uid ?? `nob${i}`;
  const r = nobleRig(bow);
  const { b, hipY, shY, hw, headC, hemY } = r;
  const side = v & 1 ? 1 : -1; // the knot's shoulder
  const O = { ...OUT, strokeWidth: 1.9 };
  const CLOAK =
    `M${-hw - 3},${(shY + 2).toFixed(1)}Q0,${(shY - 6).toFixed(1)} ${hw + 3},${(shY + 2).toFixed(1)}` +
    `C${hw + 8},${(shY + 30).toFixed(1)} 29,${(hemY - 24).toFixed(1)} 27,${(hemY + 1).toFixed(1)}` +
    `Q1,${(hemY + 7).toFixed(1)} -28,${hemY.toFixed(1)}C-30,${(hemY - 24).toFixed(1)} ${-hw - 8},${(shY + 30).toFixed(1)} ${-hw - 3},${(shY + 2).toFixed(1)}Z`;
  const arm = (sgn: number): ArmGeo => {
    if (reach && reach.sgn === sgn && reach.e > 0.0005) return reachArm(reach);
    const S: P2 = [sgn * hw, shY + 5];
    const W: P2 = [sgn * mix(hw + 4, 6, b), mix(hipY + 4, hipY + 9, b)];
    const { mid: E, end } = relaxedJoint(S, W, [sgn * (hw + 5), shY + 27], 25, 23);
    return { S, E, W: end, sgn, e: 0, dir: [0, 1] };
  };
  const arms = [arm(-1), arm(1)];
  const kn: P2 = [side * (hw - 5), shY];
  const fy = 4.5 * b - 2.8 * look;
  const capY = mix(-4.8, 2.4, b) - 1.8 * look;
  const crown: P2 = [0, headC[1] - 12.5];
  const ky = 1 - 0.42 * b;
  const feathers: { p: P2; deg: number; L: number; w: number }[] =
    v === 0
      ? [-54, -27, 0, 27, 54].map((deg, j) => ({ p: [deg / 9, 2] as P2, deg, L: [17, 21, 23, 21, 17][j], w: 7.5 }))
      : v === 1
        ? [-15, 15].map((deg) => ({ p: [deg / 5, 2] as P2, deg, L: 25, w: 8.5 }))
        : v === 2
          ? [-34, 0, 34].map((deg) => ({ p: [deg / 12, -11] as P2, deg, L: 12, w: 6 }))
          : [-30, 0, 30].map((deg) => ({ p: [deg / 5, 2] as P2, deg, L: deg ? 15 : 20, w: 7 }));
  const folds = [0.2, 0.5, 0.8].map((t, j) => {
    const a: P2 = [kn[0] + (t - 0.5) * 12 - side * 2, shY + 9 + 8 * hash(j, 65 + i)];
    const e: P2 = [mix(-24, 23, side > 0 ? 1 - t : t), hemY - 3 - 6 * hash(j, 66 + i)];
    return { a, c: [mix(a[0], e[0], 0.3), mix(a[1], e[1], 0.6)] as P2, b: e };
  });
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${sc.toFixed(3)})`} opacity={tone}>
      <clipPath id={`${id}-c`}>
        <path d={CLOAK} />
      </clipPath>
      {[-1, 1].map((sg) => {
        const H: P2 = [sg * 8.5, hemY - 6];
        const A: P2 = [sg * 9.6, -6.5];
        return (
          <g key={sg}>
            <path d={limbD([[H, 10], [mix2(H, A, 0.45), 9.4], [mix2(H, A, 0.8), 6.4], [A, 6]])} fill={C_MAIN} {...O} />
            <path d={braceletD(H, A, 9.4, 6.2, 67 + sg, 2.3)} {...ln(0.8, 0.6)} />
            <path d={smoothClosed([[A[0] - 3.4, A[1]], [A[0] + 3.4, A[1]], [A[0] + sg * 2.6 + 6.6, -3], [A[0] + sg * 2.6 + 5.6, 0.8], [A[0] + sg * 2.6 - 5.6, 0.8], [A[0] + sg * 2.6 - 6.6, -3]])} fill={C_MAIN} {...O} strokeWidth={1.7} />
            <path d={`M${A[0] - 3.4},${A[1] + 1.4}h6.8`} {...ln(1.1, 0.8)} />
          </g>
        );
      })}
      <path d={CLOAK} fill={C_MAIN} {...O} strokeWidth={2.1} />
      <g clipPath={`url(#${id}-c)`}>
        <path d={hatchD(8, shY + 6, 31, hemY + 8, 110, 2.5, 61 + i)} {...ln(0.8, 0.62)} />
        <path d={hatchD(17, shY + 26, 31, hemY + 8, 60, 3, 68 + i)} {...ln(0.75, 0.5)} />
        {folds.map((f, j) => (
          <path key={j} d={foldHatchD(f.a, f.c, f.b, 69 + j + i, 5, 0.075)} {...ln(0.75, 0.6)} />
        ))}
        {v === 0 ? <path d={`M-31,${(hemY - 7).toFixed(1)}Q0,${(hemY - 1).toFixed(1)} 31,${(hemY - 7).toFixed(1)}`} {...ln(1.2, 0.8)} /> : null}
        {v === 1 ? <path d={hatchD(-32, shY + 30, 32, hemY - 4, 0, 7, 62, 0.02)} {...ln(1.3, 0.55)} /> : null}
        {v === 2
          ? [0, 1, 2, 3].flatMap((row) => [-18, -6, 6].map((cx) => <circle key={`${row}${cx}`} cx={cx + (row & 1) * 6} cy={shY + 22 + row * 10} r={1.5} fill={DARK} opacity={0.62} />))
          : null}
        {v === 3 ? <path d={`M-32,${(hemY - 13).toFixed(1)}Q0,${(hemY - 7).toFixed(1)} 32,${(hemY - 13).toFixed(1)}M-32,${(hemY - 7).toFixed(1)}Q0,${(hemY - 1).toFixed(1)} 32,${(hemY - 7).toFixed(1)}`} {...ln(1.2, 0.7)} /> : null}
      </g>
      <path d={folds.map((f) => foldD(f.a, f.c, f.b)).join("")} {...ln(1.15, 0.72)} />
      <path d={`M${P(kn)}l${-side * 7},-5q${-side * 3},3 ${-side},6ZM${P(kn)}l${side * 6},-5.6q${side * 3.4},3 ${side * 0.6},6.4Z`} fill={C_MAIN} {...O} strokeWidth={1.5} />
      <circle cx={kn[0]} cy={kn[1]} r={3.1} fill={C_DEEP} {...O} strokeWidth={1.6} />
      {arms.map((a) => (
        <g key={a.sgn}>
          <path d={limbD(bones(a.S, a.E, a.W, [10.4, 9.8, 7.6, 8, 6]))} fill={C_MAIN} {...O} />
          <path d={braceletD(a.S, a.E, 9.8, 7.6, 71 + a.sgn, 2.3) + braceletD(a.E, a.W, 8, 6, 73 + a.sgn, 2.3)} {...ln(0.8, 0.6)} />
          <HandShape a={a} />
        </g>
      ))}
      {/* the neck; the head: the hair comes lower over the face as he bows */}
      <path d={limbD([[[0, shY], 9.6], [[0, headC[1] + 8], 8.4]])} fill={C_MAIN} {...O} />
      <g transform={`translate(0 ${headC[1].toFixed(2)})`}>
        <path d="M-11.6,3C-14,-17.5 14,-17.5 11.6,3L10.6,12L-10.6,12Z" fill={C_HAIR} {...O} />
        <path d={hatchD(-13, -6, -8.6, 12, 86, 1.7, 75 + i, 0.1) + hatchD(8.6, -6, 13, 12, 94, 1.7, 76 + i, 0.1)} {...ln(0.9, 0.8)} />
        <path d="M0,-12C-7.6,-12 -9.6,-6 -9.6,0C-9.6,6 -5.4,12.8 0,13.4C5.4,12.8 9.6,6 9.6,0C9.6,-6 7.6,-12 0,-12Z" fill={C_MAIN} {...O} />
        <path d={`M-10.4,${capY.toFixed(1)}Q0,${(capY - 4.4).toFixed(1)} 10.4,${capY.toFixed(1)}C12.4,-17.5 -12.4,-17.5 -10.4,${capY.toFixed(1)}Z`} fill={C_HAIR} stroke={DARK} strokeWidth={1.3} />
        <path d={hatchD(-10.4, -14, 10.4, capY - 0.6, 84, 1.7, 63 + i, 0.12)} {...ln(0.9, 0.8)} />
        <path d={`M-7,${(-0.6 + fy).toFixed(1)}q2.2,-1.5 4.6,0M2.4,${(-0.6 + fy).toFixed(1)}q2.4,-1.5 4.6,0`} {...ln(1.4, 0.92)} />
        <path d={`M-6.2,${(1.6 + fy).toFixed(1)}h3.4M2.8,${(1.6 + fy).toFixed(1)}h3.4`} {...ln(1.3, 0.85 * (1 - 0.6 * b))} />
        <path d={`M-0.6,${(1.6 + fy).toFixed(1)}L-1.5,${(6 + fy * 0.8).toFixed(1)}l2.6,0.5`} {...ln(1, 0.8)} />
        <path d={`M-3.2,${(9 + fy * 0.5).toFixed(1)}q3.2,-0.9 6.4,0`} {...ln(1.25, 0.88)} />
        <path d={hatchD(4.4, -3 + fy, 10, 12, 112, 1.9, 64)} {...ln(0.7, 0.6)} />
      </g>
      {/* the headdress, foreshortened as the head goes down */}
      <g transform={`translate(0 ${crown[1].toFixed(2)}) scale(1 ${ky.toFixed(3)})`}>
        {v === 2 ? (
          <>
            <path d="M-4.8,3L-5.2,-10Q0,-13.4 5.2,-10L4.8,3Z" fill={C_HAIR} {...O} />
            <path d={hatchD(-5, -12, 5, 3, 88, 1.8, 77, 0.1)} {...ln(0.8, 0.75)} />
            <path d="M-5.6,-3.6h11.2M-5.6,-6.4h11.2" stroke={DARK} strokeWidth={3.6} />
            <path d="M-5,-5h10" stroke={C_MAIN} strokeWidth={1.7} />
          </>
        ) : null}
        {feathers.map((f, j) => {
          const fd = featherD(f.p, f.deg, f.L, f.w);
          return (
            <g key={j}>
              <path d={fd.leaf} fill={j & 1 ? C_DEEP : C_MAIN} {...O} strokeWidth={1.6} />
              <path d={fd.rib} {...ln(0.85, 0.8)} />
              <path d={fd.barbs} {...ln(0.6, 0.55)} />
            </g>
          );
        })}
        {v !== 2 ? <path d={limbD([[[-10.6, 5.6], 3.6], [[0, 2.6], 4], [[10.6, 5.6], 3.6]])} fill={C_DEEP} {...O} strokeWidth={1.5} /> : null}
      </g>
      {v === 3 ? <path d={`M-12,${(headC[1] + 3).toFixed(1)}l-1.2,10M12,${(headC[1] + 3).toFixed(1)}l1.2,10`} {...ln(1.9, 0.9)} /> : null}
    </g>
  );
};
