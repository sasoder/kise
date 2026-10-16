// ---------------------------------------------------------------------------
// stringsFigures: the engraved cast of the "strings" set (see stringsShared):
// the articulated Emperor (Moctezuma / Atahualpa), the Noble, the captor's
// gauntleted hand with its marionette bar. One manner for all of them: the
// cream form, a firm dark outline, tapered limbs, and the engraver's shading:
// bracelet strokes round every limb's shaded side, hatched wedges under every
// fold of cloth, cross-hatching in the deepest shadow; light from the upper
// left; every stroke a hair off its place (hashed), nothing ruled.
// Rigs and anchors: stringsMotion.ts. Draw inside a WorldSvg (world px).
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, INK, hash, type P2 } from "./incaShared";
import {
  BAR_W,
  EMPEROR_AT,
  HAND_AT,
  HAND_S,
  HEAD_SCALE,
  NOBLES,
  N_NOBLES,
  add,
  emperorRig,
  mix,
  mix2,
  mul,
  nobleRig,
  norm,
  relaxedJoint,
  rot,
  sub,
  vlen,
  type EmperorPose,
  type Variant,
} from "./stringsMotion";

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
// THE EMPEROR
// ---------------------------------------------------------------------------
type ArmRig = ReturnType<typeof emperorRig>["armL"];
const EmperorHand: React.FC<{ a: ArmRig }> = ({ a }) => {
  const { W, dir: d, fist: f, sgn } = a;
  const n: P2 = [-d[1], d[0]];
  const open = 1 - f;
  const at = (along: number, across: number): P2 => add(W, add(mul(d, along), mul(n, across)));
  // the thumb sits on the body's side of the hand
  const ts = n[0] * -sgn >= 0 ? 1 : -1;
  const fingers = [0, 1, 2, 3].map((j) => {
    const b = at(13.5, (j - 1.5) * 4.9);
    const fd = rot(d, (j - 1.5) * 5 * open * ts);
    const L = 3 + [12.5, 15.5, 14.5, 11][ts > 0 ? j : 3 - j] * open;
    return limbD([
      [add(b, mul(fd, -3)), 5.3],
      [add(b, mul(fd, L * 0.55)), 5],
      [add(b, mul(fd, L)), 4],
    ]);
  });
  const tb = at(6, ts * 8);
  const td = rot(d, ts * (12 + 30 * open));
  const thumb = limbD([
    [add(tb, mul(td, -4)), 6.4],
    [add(tb, mul(td, 3 + 4 * open)), 5.6],
    [add(tb, mul(td, 6 + 8 * open)), 4.4],
  ]);
  const palm = smoothClosed([at(0, -8), at(7, -10.4), at(14.5, -9.8), at(16.5, 0), at(14.5, 9.8), at(7, 10.4), at(0, 8)]);
  return (
    <g>
      {fingers.map((fd, j) => (
        <path key={j} d={fd} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
      ))}
      <path d={palm} fill={C_MAIN} {...OUT} strokeWidth={2} />
      <path d={braceletD(at(1, 0), at(15, 0), 19, 19, 91, 2.8)} {...ln(0.9, 0.5)} />
      <path d={thumb} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
      {f > 0.5 ? <path d={[-1, 0, 1].map((j) => `M${P(at(9.5, j * 4.9))}L${P(at(16, j * 4.9))}`).join("")} {...ln(1.2, 0.75 * (f - 0.5) * 2)} /> : null}
      {/* the wrist band */}
      <path d={limbD([[at(-3.4, -8.2), 5], [at(-3.4, 8.2), 5]])} fill={C_DEEP} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(at(-3.4, -4))}L${P(at(-3.4, 4))}`} {...ln(0.9, 0.55)} />
    </g>
  );
};

/** the head (head-local units: (0, 0) = the middle of the face) */
const EmperorHead: React.FC<{ variant: Variant; nod: number; uid: string }> = ({ variant, nod, uid }) => {
  const fy = 5 * nod;
  const open = 1 - nod;
  const y = (v: number, k = 1) => (v + fy * k).toFixed(1);
  const FACE = "M0,-24C-15,-24 -19.5,-12 -19.5,0C-19.5,11 -12,24 0,26.4C12,24 19.5,11 19.5,0C19.5,-12 15,-24 0,-24Z";
  const brow = (s: number) => `M${s * 14},${y(-6.6 + 2.8 * nod)}Q${s * 8.5},${y(-9.6 + nod)} ${s * 2.8},${y(-5 - 3.2 * nod)}`;
  const lid = (s: number) => `M${s * 13},${y(-0.4)}Q${s * 8},${y(-0.4 - 4.2 * open + 2.8 * nod)} ${s * 3.6},${y(0)}`;
  const under = (s: number) => `M${s * 12},${y(0.6)}Q${s * 8},${y(2.6)} ${s * 4.4},${y(0.8)}`;
  return (
    <g>
      <clipPath id={`${uid}-face`}>
        <path d={FACE} />
      </clipPath>
      {variant === "aztec" ? (
        <>
          {/* the hair, cut at the jaw: black in the print, so dense with strokes */}
          <path d="M-23,-14C-28.5,6 -28,24 -21,32L-10,31L-10,0L10,0L10,31L21,32C28,24 28.5,6 23,-14C19,-30 -19,-30 -23,-14Z" fill={C_HAIR} {...OUT} />
          <path d={hatchD(-28, -24, -13, 32, 86, 2.1, 21, 0.1) + hatchD(13, -24, 28, 32, 94, 2.1, 22, 0.1)} {...ln(1.25, 0.85)} />
        </>
      ) : (
        <>
          {/* cropped hair over the band and beside the face */}
          <path d="M-21.5,-8C-25,-34 25,-34 21.5,-8L22,10L-22,10Z" fill={C_HAIR} {...OUT} />
          <path d={hatchD(-21, -31, 21, -18, 80, 2.1, 23, 0.12) + hatchD(-23, -8, -16, 10, 88, 2.1, 28, 0.1) + hatchD(16, -8, 23, 10, 92, 2.1, 29, 0.1)} {...ln(1.2, 0.85)} />
        </>
      )}
      <path d={FACE} fill={C_MAIN} {...OUT} />
      <g clipPath={`url(#${uid}-face)`}>
        {/* the shaded cheek, the jaw, under the brow band */}
        <path d={hatchD(8.5, -9 + fy, 21, 23, 114, 2.3, 24)} {...ln(0.95, 0.66)} />
        <path d={hatchD(13, -4, 21, 18, 58, 2.9, 25)} {...ln(0.85, 0.5)} />
        <path d={hatchD(-13, 21.5, 13, 28, 4, 2, 26, 0.2)} {...ln(0.85, 0.5)} />
        <path d={hatchD(-19, -24, 19, -9.5 + fy * 1.6, 90, 2.6, 27, 0.25)} {...ln(0.85, (variant === "aztec" ? 0.22 : 0.06) + 0.4 * nod)} />
        <path d={hatchD(-19, -3, -14, 14, 70, 2.8, 30, 0.3)} {...ln(0.8, 0.35)} />
      </g>
      {/* brows, lids, eyes */}
      <path d={brow(-1) + brow(1)} {...ln(2.4, 0.92)} />
      <path d={lid(-1) + lid(1)} {...ln(1.8, 0.92)} />
      {open > 0.25 ? (
        <>
          <path d={under(-1) + under(1)} {...ln(0.9, 0.55 * open)} />
          <circle cx={-8.2} cy={-0.5 + fy} r={2.05} fill={DARK} opacity={0.92 * open} />
          <circle cx={7.8} cy={-0.5 + fy} r={2.05} fill={DARK} opacity={0.92 * open} />
        </>
      ) : (
        <path d={`M-11,${y(1.6)}l-1.6,1.8M-8,${y(2.2)}l-0.4,2.2M5,${y(2.2)}l0.4,2.2M8.4,${y(1.9)}l1.4,2`} {...ln(0.9, 0.6)} />
      )}
      {/* nose (its shaded side hatched), mouth, chin */}
      <path d={`M-2,${y(-3.6)}L-3.6,${y(8)}Q-3.4,${y(10.6)} 0.2,${y(10.9)}Q3.6,${y(10.8)} 4.6,${y(8.2)}Q4.4,${y(6.2)} 2.8,${y(5.6)}`} {...ln(1.6, 0.88)} />
      <path d={`M1.4,${y(-2)}l2.4,1.4M1.2,${y(0.8)}l2.6,1.5M1,${y(3.6)}l2.4,1.4`} {...ln(0.85, 0.55)} />
      <path d={`M-7.8,${y(16.4, 0.7)}Q-3.6,${y(14.2, 0.7)} 0,${y(15.5 - nod, 0.7)}Q3.6,${y(14.2, 0.7)} 7.8,${y(16.4, 0.7)}`} {...ln(1.9, 0.92)} />
      <path d={`M-4.4,${y(19, 0.6)}Q0,${y(20.8, 0.6)} 4.4,${y(19, 0.6)}`} {...ln(1.1, 0.65)} />
      <path d={`M-3,${y(23.2, 0.4)}Q0,${y(22.2, 0.4)} 3,${y(23.2, 0.4)}`} {...ln(0.9, 0.45)} />
      {variant === "aztec" ? (
        <>
          {/* ear-plugs */}
          <circle cx={-21.5} cy={8} r={4.8} fill={C_MAIN} {...OUT} strokeWidth={2} />
          <circle cx={21.5} cy={8} r={4.8} fill={C_DEEP} {...OUT} strokeWidth={2} />
          <circle cx={-21.5} cy={8} r={1.5} fill={DARK} opacity={0.7} />
          <circle cx={21.5} cy={8} r={1.5} fill={DARK} opacity={0.7} />
          {/* the xiuhuitzolli: the band, and the pointed mosaic diadem rising at the front of the brow */}
          <clipPath id={`${uid}-dia`}>
            <path d="M-15.5,-21L-1,-52Q0,-53.5 1,-52L15.5,-21Q0,-25.5 -15.5,-21Z" />
          </clipPath>
          <path d="M-22.5,-11.6Q0,-17.5 22.5,-11.6L23,-21Q0,-27.5 -23,-21Z" fill={C_DEEP} {...OUT} />
          <path d="M-15.5,-21L-1,-52Q0,-53.5 1,-52L15.5,-21Q0,-25.5 -15.5,-21Z" fill={C_MAIN} {...OUT} />
          <g clipPath={`url(#${uid}-dia)`}>
            <path d={hatchD(-16, -53, 16, -20, 64, 4.8, 31, 0) + hatchD(-16, -53, 16, -20, -64, 4.8, 32, 0)} {...ln(1, 0.8)} />
            <path d={hatchD(2, -53, 16, -20, 64, 2.4, 33, 0.1)} {...ln(0.85, 0.55)} />
          </g>
          <path d="M-12.4,-22.6L0,-48.4L12.4,-22.6" {...ln(0.9, 0.5)} />
          <path d="M-22.6,-16.4Q0,-22.4 22.6,-16.4" {...ln(1, 0.65)} />
          <path d={[-18.5, -13, -7, 7, 13, 18.5].map((x) => `M${x},${(-13.4 - (1 - (x * x) / 506) * 5.4).toFixed(1)}l0,-3.6`).join("")} {...ln(1, 0.6)} />
          <path d={hatchD(9, -27, 23, -11, 100, 2.2, 34, 0.15)} {...ln(0.8, 0.5)} />
        </>
      ) : (
        <>
          {/* the two upright feathers */}
          {[-1, 1].map((s) => {
            const f = featherD([s * 5.5, -20], s * 10, 36, 13);
            return (
              <g key={s}>
                <path d={f.leaf} fill={s < 0 ? C_MAIN : C_DEEP} {...OUT} strokeWidth={2} />
                <path d={f.rib} {...ln(1.1, 0.8)} />
                <path d={f.barbs} {...ln(0.8, 0.6)} />
              </g>
            );
          })}
          {/* the llauto wound round the brow */}
          <path d="M-22.5,-8.6Q0,-13.5 22.5,-8.6L23,-20.4Q0,-26 -23,-20.4Z" fill={C_DEEP} {...OUT} />
          <path d="M-22.6,-12.4Q0,-17.4 22.6,-12.4M-22.8,-16.4Q0,-21.6 22.8,-16.4" {...ln(1, 0.7)} />
          <path d={[-19, -14, -9, -4, 1, 6, 11, 16, 21].map((x) => `M${x - 2.4},${(-9.4 - (1 - (x * x) / 506) * 4.6).toFixed(1)}l3,-10.4`).join("")} {...ln(0.8, 0.5)} />
          {/* the mascapaicha: the fringe over the brow, cream, each tassel knotted */}
          <path d="M-12.6,-10.6Q0,-13 12.6,-10.6L12.2,-1.6L9.8,-3.4L7.4,-1.2L4.9,-3.4L2.5,-1L0,-3.4L-2.5,-1L-4.9,-3.4L-7.4,-1.2L-9.8,-3.4L-12.2,-1.6Z" fill={C_MAIN} {...OUT} strokeWidth={1.7} />
          <path d={[-7.4, -2.5, 2.5, 7.4].map((x) => `M${x},-10.2L${x},-4.6`).join("")} {...ln(0.8, 0.5)} />
          {/* the great ear-spools */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <circle cx={s * 24.5} cy={7} r={9} fill={s < 0 ? C_MAIN : C_DEEP} {...OUT} />
              <circle cx={s * 24.5} cy={7} r={5} {...ln(1.1, 0.8)} />
              <circle cx={s * 24.5} cy={7} r={1.6} fill={DARK} opacity={0.85} />
              <path d={hatchD(s * 24.5 + 1, 0, s * 24.5 + 9, 15, 110, 2, 35 + s, 0.1)} {...ln(0.75, 0.45)} />
            </g>
          ))}
        </>
      )}
    </g>
  );
};

/** the articulated emperor: "aztec" = Moctezuma (the xiuhuitzolli diadem, the
 *  tilmatli knotted on one shoulder, sandals), "inca" = Atahualpa (the llauto
 *  with the mascapaicha fringe and two feathers, great ear-spools, the uncu with
 *  its tocapu band, a mantle). Feet at `at` (world px). */
export const Emperor: React.FC<{ pose: EmperorPose; variant?: Variant; at?: P2; tone?: number; uid?: string }> = ({
  pose,
  variant = "aztec",
  at = EMPEROR_AT,
  tone = 1,
  uid = "emp",
}) => {
  const r = emperorRig(pose, variant);
  const s = pose.slump;
  const pt = r.point;
  const { hip, shL, shR, neck, top } = r;
  // ---- the garments --------------------------------------------------------
  const hem = -60 - pose.hang + 3 * s; // the tilmatli's / the mantle's hem (the calf)
  const hemL: P2 = [hip[0] - 56 - 3 * s, hem + 1];
  const hemR: P2 = [hip[0] + 53 + 3 * s, hem + 5];
  const hemC: P2 = [(hemL[0] + hemR[0]) / 2 + 3, hem + 13];
  const hemPt = (t: number, lift = 0): P2 => {
    const q = quad(hemL, hemC, hemR, t);
    return [q[0], q[1] - lift];
  };
  const knot = add(shL, [9, -7]);
  const cloakA = add(shL, [-9, 5]);
  const cloakB = add(shR, [-3, 34]);
  const neckCtl: [P2, P2] = [add(neck, [-8, 17]), add(cloakB, [-34, -3])];
  const CLOAK =
    `M${P(cloakA)}Q${P(add(shL, [-4, -11]))} ${P(knot)}` +
    `C${P(neckCtl[0])} ${P(neckCtl[1])} ${P(cloakB)}` +
    `C${P(add(cloakB, [9, 42]))} ${P(add(hemR, [5, -78]))} ${P(hemR)}` +
    `Q${P(hemC)} ${P(hemL)}` +
    `C${P(add(hemL, [-7, -76]))} ${P(add(cloakA, [-10, 54]))} ${P(cloakA)}Z`;
  const folds = [0.07, 0.22, 0.38, 0.54, 0.7, 0.86].map((t, i) => {
    const a = add(knot, [1 + t * 46, 13 + t * 30 + 9 * hash(i, 41)]);
    const b = hemPt(t, 10 + 26 * hash(i, 42));
    const c: P2 = [mix(a[0], b[0], 0.28) + (t - 0.45) * 20, mix(a[1], b[1], 0.55)];
    return { a, c, b };
  });
  const tunicHem = -98 - pose.hang + 3 * s; // the uncu's hem (the knee)
  const TUNIC =
    `M${P(add(shL, [-6, 0]))}L${P(add(neck, [-11, 0]))}L${P(add(neck, [0, 18]))}L${P(add(neck, [11, 0]))}L${P(add(shR, [6, 0]))}` +
    `C${P(add(shR, [2, 60]))} ${P([hip[0] + 44, hip[1] - 10])} ${P([hip[0] + 46, tunicHem])}` +
    `Q${P([hip[0], tunicHem + 7])} ${P([hip[0] - 46, tunicHem])}` +
    `C${P([hip[0] - 44, hip[1] - 10])} ${P(add(shL, [-2, 60]))} ${P(add(shL, [-6, 0]))}Z`;
  const MANTLE =
    `M${P(add(shL, [-11, 3]))}Q${P(add(top, [0, -13]))} ${P(add(shR, [11, 3]))}` +
    `C${P(add(shR, [20, 70]))} ${P([hemR[0] + 9, hem - 64])} ${P([hemR[0] + 7, hem])}` +
    `Q${P([hip[0], hem + 14])} ${P([hemL[0] - 5, hem])}` +
    `C${P([hemL[0] - 7, hem - 64])} ${P(add(shL, [-20, 70]))} ${P(add(shL, [-11, 3]))}Z`;
  const bandY = hip[1] - 34; // the tocapu band at the waist
  const tocapu: string[] = [];
  const tocapuIn: string[] = [];
  for (let c = -5; c < 5; c++)
    for (let row = 0; row < 2; row++) {
      const x = hip[0] + c * 9.4;
      const yy = bandY + row * 9.4;
      if ((c + row) & 1) tocapu.push(`M${x.toFixed(1)},${yy.toFixed(1)}h9.4v9.4h-9.4Z`);
      else tocapuIn.push(`M${(x + 2.9).toFixed(1)},${(yy + 2.9).toFixed(1)}h3.6v3.6h-3.6Z`);
    }
  const legs = [r.legL, r.legR].map((l) => {
    const calf = mix2(l.K, l.A, 0.34);
    const st: St[] = [
      [l.H, 21],
      [mix2(l.H, l.K, 0.5), 19],
      [l.K, 15],
      [[calf[0] + l.sgn * 1.2, calf[1]], 17.5],
      [mix2(l.K, l.A, 0.82), 11.5],
      [l.A, 10.5],
    ];
    // the foot: flat on the ground, turned a little out; or hanging, toes down
    const fx = l.A[0] + l.sgn * mix(4.5, 0.5, pt);
    const F = (flat: P2, hang: P2): P2 => [mix(flat[0], hang[0], pt), mix(flat[1], hang[1], pt)];
    const foot = smoothClosed([
      F([l.A[0] - 6, l.A[1] + 1], [l.A[0] - 5.4, l.A[1] + 1]),
      F([l.A[0] + 6, l.A[1] + 1], [l.A[0] + 5.4, l.A[1] + 1]),
      F([fx + 12.5, -5], [l.A[0] + 6.6, l.A[1] + 12]),
      F([fx + 11, 1.6], [l.A[0] + 4, l.A[1] + 23]),
      F([fx, 2.6], [l.A[0], l.A[1] + 25.5]),
      F([fx - 11, 1.6], [l.A[0] - 4, l.A[1] + 23]),
      F([fx - 12.5, -5], [l.A[0] - 6.6, l.A[1] + 12]),
    ]);
    const toeY = mix(1.4, l.A[1] + 24, pt);
    const toeX = mix(fx, l.A[0], pt);
    const toeW = mix(4.6, 2, pt);
    const toes = [-1.5, -0.5, 0.5, 1.5].map((j) => `M${(toeX + j * toeW).toFixed(1)},${toeY.toFixed(1)}l0,${mix(-4.6, -5.4, pt).toFixed(1)}`).join("");
    const strap = `M${P([l.A[0] - 6.4, l.A[1] + 3.4])}L${P([toeX, mix(-4.4, l.A[1] + 17, pt)])}L${P([l.A[0] + 6.4, l.A[1] + 3.4])}`;
    return { l, d: limbD(st), calf, foot, toes, strap };
  });
  const arms = [r.armL, r.armR];
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)})`} opacity={tone}>
      <clipPath id={`${uid}-cloak`}>
        <path d={variant === "aztec" ? CLOAK : TUNIC} />
      </clipPath>
      <clipPath id={`${uid}-mantle`}>
        <path d={MANTLE} />
      </clipPath>
      {variant === "inca" ? (
        <>
          {/* the mantle (yacolla) behind him, to the calf */}
          <path d={MANTLE} fill={C_DEEP} {...OUT} />
          <g clipPath={`url(#${uid}-mantle)`}>
            <path d={hatchD(hip[0] + 38, top[1], hip[0] + 80, hem + 14, 99, 3, 51)} {...ln(1, 0.65)} />
            <path d={hatchD(hip[0] + 52, top[1] + 40, hip[0] + 80, hem + 14, 58, 3.8, 53)} {...ln(0.9, 0.5)} />
            <path d={hatchD(hip[0] - 80, top[1] + 20, hip[0] - 44, hem + 14, 84, 4.4, 52, 0.4)} {...ln(0.95, 0.5)} />
            <path d={`M${P([hemL[0] - 8, hem - 9])}Q${P([hip[0], hem + 5])} ${P([hemR[0] + 12, hem - 9])}`} {...ln(1.2, 0.65)} />
          </g>
        </>
      ) : null}
      {/* legs and sandalled feet */}
      {legs.map((g) => (
        <g key={g.l.sgn}>
          <path d={g.d} fill={C_MAIN} {...OUT} />
          <path d={braceletD(g.l.K, g.l.A, 17, 11, 81 + g.l.sgn, 2.9)} {...ln(0.95, 0.62)} />
          <path d={`M${P([g.l.K[0] - 5, g.l.K[1] + 1])}Q${P([g.l.K[0], g.l.K[1] + 5])} ${P([g.l.K[0] + 5, g.l.K[1] + 1])}`} {...ln(1, 0.5)} />
          <path d={g.foot} fill={C_MAIN} {...OUT} strokeWidth={2.1} />
          <path d={g.toes} {...ln(1, 0.7)} />
          <path d={g.strap} {...ln(1.7, 0.85)} />
          <path d={`M${P([g.l.A[0] - 6.6, g.l.A[1] - 1.5])}h13.2M${P([g.l.A[0] - 6.4, g.l.A[1] + 2.4])}h12.8`} {...ln(1.5, 0.85)} />
        </g>
      ))}
      {/* the bare torso */}
      <path
        d={`M${P(add(shL, [1, -4]))}Q${P(add(neck, [-14, -1]))} ${P(add(neck, [-8, -5]))}L${P(add(neck, [8, -5]))}Q${P(add(neck, [14, -1]))} ${P(add(shR, [-1, -4]))}L${P(add(hip, [26, 6]))}L${P(add(hip, [-26, 6]))}Z`}
        fill={C_MAIN}
        {...OUT}
      />
      <path d={`M${P(add(neck, [3, 27]))}Q${P(add(neck, [19, 38]))} ${P(add(shR, [-9, 25]))}`} {...ln(1.3, 0.75)} />
      <path d={`M${P(add(neck, [6, 7]))}Q${P(add(neck, [18, 5]))} ${P(add(shR, [-10, 5]))}`} {...ln(1.1, 0.6)} />
      <path d={hatchD(shR[0] - 26, shR[1] + 6, shR[0] - 3, shR[1] + 34, 116, 2.6, 43)} {...ln(0.9, 0.6)} />
      {variant === "aztec" ? (
        <>
          {/* the tilmatli: knotted on one shoulder, falling to the calf */}
          <path d={CLOAK} fill={C_MAIN} {...OUT} />
          <g clipPath={`url(#${uid}-cloak)`}>
            <path d={hatchD(hip[0] + 24, top[1] + 24, hip[0] + 70, hem + 16, 111, 3, 44)} {...ln(0.95, 0.62)} />
            <path d={hatchD(hip[0] + 40, top[1] + 60, hip[0] + 70, hem + 16, 60, 3.6, 45)} {...ln(0.9, 0.52)} />
            {folds.map((f, i) => (
              <path key={i} d={foldHatchD(f.a, f.c, f.b, 46 + i, 9 + 5 * hash(i, 47))} {...ln(0.95, 0.62)} />
            ))}
            {/* the rolled upper edge */}
            <path d={`M${P(add(knot, [3, 9]))}C${P(add(neckCtl[0], [1, 8]))} ${P(add(neckCtl[1], [0, 8]))} ${P(add(cloakB, [-1, 9]))}`} {...ln(1.2, 0.7)} />
            {/* the border: a band of little eyes along the hem */}
            <path d={`M${P(hemPt(0, 12))}Q${P([hemC[0], hemC[1] - 12])} ${P(hemPt(1, 12))}`} {...ln(1.3, 0.8)} />
            {Array.from({ length: 12 }, (_, i) => {
              const q = hemPt((i + 0.5) / 12, 6);
              return (
                <g key={i}>
                  <circle cx={q[0]} cy={q[1]} r={2.3} {...ln(0.9, 0.7)} />
                  <circle cx={q[0]} cy={q[1]} r={0.8} fill={DARK} opacity={0.8} />
                </g>
              );
            })}
          </g>
          <path d={folds.map((f) => foldD(f.a, f.c, f.b)).join("")} {...ln(1.5, 0.78)} />
          {/* the knot on the shoulder: two ends, two loops */}
          <path d={limbD([[knot, 5.4], [add(knot, [-4, 11]), 5], [add(knot, [-2.4, 21]), 3.4]])} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
          <path d={limbD([[knot, 5.4], [add(knot, [6, 9]), 5], [add(knot, [10.6, 17]), 3.4]])} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
          <path d={`M${P(knot)}l-12,-8.6q-5.6,3.4 -1.6,9.4ZM${P(knot)}l11.6,-8q5.4,4.4 1,9.6Z`} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
          <circle cx={knot[0]} cy={knot[1]} r={4.6} fill={C_DEEP} {...OUT} strokeWidth={1.9} />
        </>
      ) : (
        <>
          {/* the uncu: knee-length, the tocapu band at the waist */}
          <path d={TUNIC} fill={C_MAIN} {...OUT} />
          <g clipPath={`url(#${uid}-cloak)`}>
            <path d={hatchD(hip[0] + 16, top[1] + 12, hip[0] + 50, bandY - 2, 108, 2.9, 47)} {...ln(0.95, 0.62)} />
            <path d={hatchD(hip[0] + 18, bandY + 20, hip[0] + 50, tunicHem + 8, 104, 2.9, 48)} {...ln(0.95, 0.62)} />
            <path d={hatchD(hip[0] + 32, top[1] + 40, hip[0] + 50, tunicHem + 8, 60, 3.6, 49)} {...ln(0.85, 0.48)} />
            <rect x={hip[0] - 50} y={bandY} width={100} height={18.8} fill={C_MAIN} />
            <path d={tocapu.join("")} fill={DARK} opacity={0.78} />
            <path d={tocapuIn.join("")} fill={DARK} opacity={0.6} />
            <path d={`M${hip[0] - 50},${bandY.toFixed(1)}h100M${hip[0] - 50},${(bandY + 18.8).toFixed(1)}h100`} {...ln(1.4, 0.85)} />
            <path d={`M${hip[0] - 50},${(tunicHem - 8).toFixed(1)}Q${hip[0]},${(tunicHem - 1).toFixed(1)} ${hip[0] + 50},${(tunicHem - 8).toFixed(1)}`} {...ln(1.2, 0.7)} />
            {[-22, -4, 14].map((dx, i) => {
              const a: P2 = [hip[0] + dx, bandY + 22];
              const b: P2 = [hip[0] + dx - 2, tunicHem + 2];
              const c: P2 = [a[0] + 3, (a[1] + b[1]) / 2];
              return (
                <g key={i}>
                  <path d={foldD(a, c, b)} {...ln(1.2, 0.6)} />
                  <path d={foldHatchD(a, c, b, 54 + i, 5, 0.09)} {...ln(0.9, 0.55)} />
                </g>
              );
            })}
          </g>
          {/* the mantle over both shoulders, knotted on the breast */}
          <path
            d={limbD([
              [add(shL, [-8, 4]), 7],
              [add(neck, [-15, 10]), 7],
              [add(neck, [0, 22]), 6.4],
              [add(neck, [15, 10]), 7],
              [add(shR, [8, 4]), 7],
            ])}
            fill={C_DEEP}
            {...OUT}
            strokeWidth={2}
          />
          <circle cx={neck[0]} cy={neck[1] + 22} r={5} fill={C_MAIN} {...OUT} strokeWidth={2} />
        </>
      )}
      {/* the arms, bare, an armband on each */}
      {arms.map((a) => {
        const fl = vlen(sub(a.W, a.E));
        const ul = vlen(sub(a.E, a.S));
        const u = norm(sub(a.E, a.S));
        const n: P2 = [-u[1], u[0]];
        const c = mix2(a.S, a.E, 0.56);
        return (
          <g key={a.sgn}>
            <path d={limbD(bones(a.S, a.E, a.W, [20, 19.5, 15, 16, 11]))} fill={C_MAIN} {...OUT} />
            <path d={braceletD(a.S, a.E, 19.5, 15, 85 + a.sgn, 2.9) + (fl > 14 ? braceletD(a.E, a.W, 16, 11, 87 + a.sgn, 2.9) : "")} {...ln(0.95, 0.62)} />
            {ul > 30 ? <path d={limbD([[add(c, mul(n, -8.4)), 5.6], [add(c, mul(n, 8.4)), 5.6]])} fill={C_DEEP} {...OUT} strokeWidth={1.9} /> : null}
            <EmperorHand a={a} />
          </g>
        );
      })}
      {/* neck and head */}
      <path d={limbD([[add(neck, [0, 5]), 20], [mix2(neck, r.headC, 0.75), 16]])} fill={C_MAIN} {...OUT} />
      <path d={braceletD(add(neck, [0, 4]), mix2(neck, r.headC, 0.55), 20, 17, 89, 2.4)} {...ln(0.9, 0.6)} />
      <g transform={`translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${HEAD_SCALE})`}>
        <EmperorHead variant={variant} nod={pose.nod} uid={uid} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE NOBLE (an Aztec lord, ~150 px; 4 variants: headdress, cloak, which shoulder)
// ---------------------------------------------------------------------------
export const Noble: React.FC<{ i?: number; at?: P2; bow: number; tone?: number; variant?: number; scale?: number; uid?: string }> = ({
  i = 0,
  at,
  bow,
  tone = 1,
  variant,
  scale,
  uid,
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
  const arm = (sgn: number) => {
    const S: P2 = [sgn * hw, shY + 5];
    const W: P2 = [sgn * mix(hw + 4, 6, b), mix(hipY + 4, hipY + 9, b)];
    const { mid: E, end } = relaxedJoint(S, W, [sgn * (hw + 5), shY + 27], 25, 23);
    return { S, E, W: end, sgn };
  };
  const arms = [arm(-1), arm(1)];
  const kn: P2 = [side * (hw - 5), shY];
  const fy = 4.5 * b;
  const capY = mix(-4.8, 2.4, b);
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
          <path d={smoothClosed([[a.W[0] - 4.2, a.W[1] - 1], [a.W[0] + 4.2, a.W[1] - 1], [a.W[0] + 4.6, a.W[1] + 5], [a.W[0], a.W[1] + 8.4], [a.W[0] - 4.6, a.W[1] + 5]])} fill={C_MAIN} {...O} strokeWidth={1.7} />
          <path d={`M${(a.W[0] - 1.6).toFixed(1)},${(a.W[1] + 3.6).toFixed(1)}l0,4M${(a.W[0] + 1.6).toFixed(1)},${(a.W[1] + 3.6).toFixed(1)}l0,4`} {...ln(0.8, 0.6)} />
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

// ---------------------------------------------------------------------------
// THE CAPTOR'S HAND: a steel gauntlet coming down from the top edge, the back
// of the hand to us, its fingers closed over the marionette's cross-bar
// ---------------------------------------------------------------------------
export const CaptorHand: React.FC<{ bar?: number; tilt?: number; at?: P2; tone?: number; uid?: string }> = ({ bar = 0, tilt = 0, at = HAND_AT, tone = 1, uid = "hand" }) => {
  const S = HAND_S;
  const turn = `rotate(${tilt.toFixed(2)} 0 ${(-66 * S).toFixed(1)})`;
  const sc = `scale(${S})`;
  const FORE = "M-43,-150L-50,-660L50,-660L43,-150Z";
  const CUFF = "M-77,-176Q-40,-186 0,-192Q40,-186 77,-176L54,-82Q0,-70 -54,-82Z";
  const BACK = "M-53,-58Q0,-67 53,-58L59,-13Q0,-4 -59,-13Z";
  const THUMB = "M52,-46C80,-42 92,-2 76,26C68,38 50,35 50,22C56,10 58,-6 48,-24Z";
  const half = (BAR_W / 2) * bar;
  const fingers = [0, 1, 2, 3].map((j) => {
    const x0 = -59.5 + j * 29.8;
    const w = 28.8;
    return { x0, w, d: `M${x0},-11L${x0 + w},-11L${x0 + w},18Q${x0 + w},31 ${x0 + w / 2},31Q${x0},31 ${x0},18Z` };
  });
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)})`} opacity={tone}>
      <clipPath id={`${uid}-fore`}>
        <path d={FORE} />
      </clipPath>
      <clipPath id={`${uid}-cuff`}>
        <path d={CUFF} />
      </clipPath>
      <clipPath id={`${uid}-back`}>
        <path d={BACK} />
      </clipPath>
      <clipPath id={`${uid}-thumb`}>
        <path d={THUMB} />
      </clipPath>
      {/* the vambrace */}
      <g transform={sc}>
        <path d={FORE} fill={C_MAIN} {...OUT} />
        <g clipPath={`url(#${uid}-fore)`}>
          <path d={hatchD(6, -660, 50, -150, 96, 2.8, 71, 0.2)} {...ln(0.9, 0.62)} />
          <path d={hatchD(26, -660, 50, -150, 58, 3.4, 72, 0.2)} {...ln(0.85, 0.5)} />
          <path d={hatchD(-50, -660, -38, -150, 84, 3.2, 70, 0.3)} {...ln(0.85, 0.4)} />
          <path d="M-14,-660L-12,-150" {...ln(1.3, 0.7)} />
          {[-250, -330, -410, -490, -570].map((yy) => (
            <path key={yy} d={`M-52,${yy}Q0,${yy + 11} 52,${yy}`} {...ln(1.3, 0.75)} />
          ))}
        </g>
      </g>
      {/* the wrist lames and the back of the hand (they turn with the wrist) */}
      <g transform={turn}>
        <g transform={sc}>
          {[0, 1, 2].map((j) => {
            const y0 = -90 + j * 11.5;
            return (
              <g key={j}>
                <path d={`M-52,${y0}Q0,${y0 - 9} 52,${y0}L53,${y0 + 14}Q0,${y0 + 5} -53,${y0 + 14}Z`} fill={j === 1 ? C_DEEP : C_MAIN} {...OUT} strokeWidth={1.9} />
                <path d={hatchD(14, y0 - 6, 52, y0 + 12, 98, 2.8, 79 + j, 0.15)} {...ln(0.8, 0.55)} />
              </g>
            );
          })}
          <path d={BACK} fill={C_MAIN} {...OUT} />
          <g clipPath={`url(#${uid}-back)`}>
            <path d={hatchD(10, -66, 60, -4, 103, 2.8, 73)} {...ln(0.9, 0.62)} />
            <path d={hatchD(34, -66, 60, -4, 56, 3.4, 74)} {...ln(0.85, 0.5)} />
            <path d="M-30,-60L-38,-10M0,-63L0,-8M30,-60L38,-10" {...ln(1.2, 0.6)} />
            <path d="M-57,-22Q0,-13 57,-22" {...ln(1.2, 0.6)} />
          </g>
        </g>
      </g>
      {/* the cuff, flaring toward the elbow */}
      <g transform={sc}>
        <path d={CUFF} fill={C_MAIN} {...OUT} />
        <g clipPath={`url(#${uid}-cuff)`}>
          <path d={hatchD(12, -192, 78, -70, 102, 2.8, 75)} {...ln(0.9, 0.62)} />
          <path d={hatchD(40, -192, 78, -70, 55, 3.4, 76)} {...ln(0.85, 0.5)} />
          <path d={hatchD(-78, -170, -58, -80, 78, 3.2, 69, 0.3)} {...ln(0.85, 0.4)} />
          <path d="M-74,-163Q-38,-172 0,-178Q38,-172 74,-163M-57,-93Q0,-81 57,-93" {...ln(1.3, 0.8)} />
          <path d="M0,-192L0,-80" {...ln(1.2, 0.6)} />
        </g>
        {[-60, -32, 32, 60].map((cx) => (
          <circle key={cx} cx={cx} cy={-169.5 - (1 - Math.abs(cx) / 77) * 11} r={2.5} fill={DARK} opacity={0.8} />
        ))}
      </g>
      {/* the cross-bar, the knuckles and the fingers closed over it */}
      <g transform={turn}>
        {bar > 0.02 ? (
          <g opacity={Math.min(1, bar * 6)}>
            <path d={`M${-half},2L${half},2L${half + 3},14L${half},26L${-half},26L${-half - 3},14Z`} fill={C_DEEP} {...OUT} />
            <path
              d={`M${-half + 8},8Q${-half * 0.4},5.5 0,8T${half - 8},7.5M${-half + 14},13.5Q${-half * 0.5},16 ${-half * 0.1},13T${half - 10},14M${-half + 6},19Q0,21 ${half - 6},19`}
              {...ln(0.95, 0.6)}
            />
            <path d={hatchD(-half, 18, half, 26, 100, 4, 77, 0.2)} {...ln(0.85, 0.5)} />
            {half > 40
              ? [-1, 1].map((sg) => (
                  <path key={sg} d={[-3.4, 0, 3.4].map((o) => `M${sg * (half - 12) + o},1L${sg * (half - 12) + o},27`).join("")} {...ln(1.5, 0.9)} />
                ))
              : null}
          </g>
        ) : null}
        <g transform={sc}>
          <path d={THUMB} fill={C_DEEP} {...OUT} strokeWidth={2} />
          <g clipPath={`url(#${uid}-thumb)`}>
            <path d={hatchD(64, -46, 92, 36, 100, 2.6, 84, 0.15)} {...ln(0.8, 0.6)} />
            <path d="M52,-22Q68,-26 84,-16M54,2Q70,0 86,8" {...ln(1.1, 0.75)} />
          </g>
          {fingers.map((f, j) => (
            <g key={j}>
              <path d={f.d} fill={C_MAIN} {...OUT} strokeWidth={2} />
              <path d={`M${f.x0},0Q${f.x0 + f.w / 2},4.4 ${f.x0 + f.w},0M${f.x0},10Q${f.x0 + f.w / 2},14.4 ${f.x0 + f.w},10M${f.x0 + 1},20Q${f.x0 + f.w / 2},24 ${f.x0 + f.w - 1},20`} {...ln(1.05, 0.75)} />
              <path d={hatchD(f.x0 + f.w - 10, -9, f.x0 + f.w - 1.4, 27, 95, 2.2, 78 + j, 0.2)} {...ln(0.8, 0.6)} />
            </g>
          ))}
          {fingers.map((f, j) => (
            <g key={j}>
              <path d={`M${f.x0 + 1},-9Q${f.x0 + f.w / 2},-27 ${f.x0 + f.w - 1},-9Z`} fill={C_MAIN} {...OUT} strokeWidth={1.9} />
              <path d={`M${f.x0 + f.w * 0.55},-17.4q5,2 6.6,7.6M${f.x0 + f.w * 0.7},-13.6q2.6,1.6 3.2,4`} {...ln(0.8, 0.55)} />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
};

/** the number of nobles (re-exported for sheets) */
export const NOBLE_COUNT = N_NOBLES;
