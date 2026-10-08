// ---------------------------------------------------------------------------
// NotLoyalToBloodlinesFigures: the engraved cast of NotLoyalToBloodlines, in
// the manner of stringsFigures (the cream form, a firm dark outline, tapered
// limbs, hand-cut hatching on the shaded right side; light from the upper
// left). One parametric standing figure, front view, in a 220-unit frame with
// the feet at (0, 0) and up negative:
//   dress "robe"  = the dynasty (a long belted robe, slippers)
//   dress "coat"  = 18th-century British (frock coat, waistcoat, breeches,
//                   stockings, buckled shoes; tricorne or wig)
// plus the one Crown and the props that tell the Company men apart (ledger and
// quill, cane, sword and sash, musket and cross-belts, spyglass, scroll).
// Everything here is cream; the caller owns the orange.
// ---------------------------------------------------------------------------
import React from "react";
import { hash } from "./fieldShared";

export type P2 = [number, number];
export const INK = "#E9DDBF";
export const DARK = "#0B0907";
const C_DEEP = "#D3C5A2";
const C_HAIR = "#8C7F60";

const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P2, k: number): P2 => [a[0] * k, a[1] * k];
const vlen = (a: P2) => Math.hypot(a[0], a[1]);
const norm = (a: P2): P2 => {
  const l = vlen(a) || 1;
  return [a[0] / l, a[1] / l];
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix2 = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;

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
const bones = (S: P2, E: P2, W: P2, w: [number, number, number, number, number]): St[] => [
  [S, w[0]],
  [mix2(S, E, 0.42), w[1]],
  [E, w[2]],
  [mix2(E, W, 0.36), w[3]],
  [W, w[4]],
];
/** bracelet shading round a limb's shaded (right / under) side */
const braceletD = (a: P2, b: P2, wa: number, wb: number, seed: number, gap = 3.4) => {
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
    const p0 = add(c, mul(n, w * (0.06 + 0.2 * hash(i, seed))));
    const p1 = add(c, mul(n, w / 2 - 0.7));
    d += `M${P(p0)}Q${P(add(mix2(p0, p1, 0.5), mul(u, 1.7)))} ${P(p1)}`;
  }
  return d;
};
/** two-bone arm: the elbow for a shoulder S and a wrist target W, bent to `side` */
const ik = (S: P2, W: P2, l1: number, l2: number, side: number) => {
  const dv = sub(W, S);
  const u = vlen(dv) > 0.01 ? norm(dv) : ([0, 1] as P2);
  const d = Math.max(Math.abs(l1 - l2) + 0.5, Math.min(vlen(dv), l1 + l2 - 0.5));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let n: P2 = [-u[1], u[0]];
  if (n[0] * side < 0) n = [-n[0], -n[1]];
  return { E: add(S, add(mul(u, a), mul(n, hh))), W: add(S, mul(u, d)) };
};

// ---------------------------------------------------------------------------
export type PersonSpec = {
  dress: "robe" | "coat";
  build?: number; // shoulder / hem breadth, 1 = an ordinary adult
  belly?: number; // waist breadth multiplier
  stance?: number; // half the distance between the ankles
  hat?: "none" | "tricorne";
  hair?: "dark" | "white" | "wig";
  beard?: "none" | "full" | "long";
  headScale?: number;
  hunch?: number; // 0 upright .. 1 stooped
  wristL: P2; // the arm on screen left
  wristR: P2;
  prop?: "none" | "sabre" | "sword" | "staff" | "ledger" | "cane" | "musket" | "spyglass" | "scroll";
  sash?: boolean; // an officer's sash, shoulder to hip
  belts?: boolean; // a soldier's cross-belts
  jewels?: boolean; // a king's collar of pearls
  hem?: number;
};

const frame = (spec: PersonSpec) => {
  const hs = spec.headScale ?? 1.15;
  const hu = spec.hunch ?? 0;
  const shY = -174 + 22 * hu;
  const headC: P2 = [11 * hu, shY - 6 - 17 * hs + 13 * hu];
  const top = -headC[1] + (spec.hat === "tricorne" ? 30 : 19.5) * hs;
  return { hs, hu, shY, headC, top };
};
/** the figure's height in its own units (head top, or hat top, to the ground) */
export const personUnits = (spec: PersonSpec) => frame(spec).top;

export const Person: React.FC<{ x: number; y: number; h: number; spec: PersonSpec; uid: string; ground?: boolean }> = ({
  x,
  y,
  h,
  spec,
  uid,
  ground = false,
}) => {
  const { hs, hu, shY, headC, top } = frame(spec);
  const s = h / top;
  const px = 1 / s; // one screen px (at camera k 1) in figure units
  const OUT = { stroke: DARK, strokeWidth: 2.8 * px, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const ln = (w = 1.3, a = 0.75) => ({
    fill: "none",
    stroke: DARK,
    strokeWidth: w * px,
    strokeOpacity: a,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  });
  const robe = spec.dress === "robe";
  const b = spec.build ?? 1;
  const belly = spec.belly ?? 1;
  const st = spec.stance ?? 13;
  const sw = 31 * b;
  const ww = 21 * b * belly;
  const hemY = spec.hem ?? (robe ? -26 : -64);
  const hw = (robe ? 43 : 37) * b * (belly > 1 ? 1.06 : 1);
  const sx = 6 * hu;
  const midY = mix(-121, hemY, 0.55);
  const BODY =
    `M${(-sw + sx).toFixed(1)},${shY + 3}Q${sx},${shY - 9} ${(sw + sx).toFixed(1)},${shY + 3}` +
    `C${(sw + sx + 3).toFixed(1)},${shY + 32} ${(ww + 2).toFixed(1)},-138 ${ww.toFixed(1)},-121` +
    `C${(ww + 5).toFixed(1)},-100 ${hw.toFixed(1)},${midY.toFixed(1)} ${hw.toFixed(1)},${hemY}` +
    `Q0,${hemY + (robe ? 9 : 6)} ${(-hw).toFixed(1)},${hemY}` +
    `C${(-hw).toFixed(1)},${midY.toFixed(1)} ${(-ww - 5).toFixed(1)},-100 ${(-ww).toFixed(1)},-121` +
    `C${(-ww - 2).toFixed(1)},-138 ${(-sw + sx - 3).toFixed(1)},${shY + 32} ${(-sw + sx).toFixed(1)},${shY + 3}Z`;

  // ---- legs and feet -------------------------------------------------------
  const legs = [-1, 1].map((sg) => {
    const A: P2 = [sg * st, robe ? -7 : -8];
    if (robe) {
      const H: P2 = [sg * 11, -40];
      return {
        sg,
        limb: limbD([[H, 13], [mix2(H, A, 0.6), 12], [A, 10]]),
        shade: braceletD(H, A, 12, 10, 11 + sg),
        band: "",
        foot: smoothClosed([[A[0] - 5.5, -8], [A[0] + 5.5, -8], [A[0] + sg * 14, -4.5], [A[0] + sg * 18, -8], [A[0] + sg * 16, 1.5], [A[0] - sg * 5, 1.5]]),
        buckle: "",
      };
    }
    const H: P2 = [sg * 10 * b, -84];
    const K: P2 = [sg * st * 0.86, -50];
    const calf: P2 = [sg * st * 0.97, -31];
    return {
      sg,
      limb: limbD([[H, 18], [K, 13.5], [calf, 14.5], [mix2(calf, A, 0.75), 9.5], [A, 8.5]]),
      shade: braceletD(K, A, 14, 8.5, 13 + sg),
      band: `M${(K[0] - 7).toFixed(1)},-49Q${K[0].toFixed(1)},-46 ${(K[0] + 7).toFixed(1)},-49`,
      foot: smoothClosed([[A[0] - 5, -10], [A[0] + 5, -10], [A[0] + sg * 15, -3.5], [A[0] + sg * 14, 1.5], [A[0] - sg * 5, 1.5], [A[0] - sg * 6.5, -4]]),
      buckle: `M${(A[0] + sg * 3 - 2.4).toFixed(1)},-8.6h4.8v4.4h-4.8Z`,
    };
  });

  // ---- arms ------------------------------------------------------------------
  const arms = [-1, 1].map((sg) => {
    const S: P2 = [sg * (sw - 3) + sx, shY + 8];
    const r = ik(S, sg < 0 ? spec.wristL : spec.wristR, 40, 38, sg);
    const dir = norm(sub(r.W, r.E));
    return { sg, S, E: r.E, W: r.W, hand: add(r.W, mul(dir, 5.5)) };
  });
  const armR = arms[1];
  const armL = arms[0];

  // ---- props -----------------------------------------------------------------
  const prop = spec.prop ?? "none";
  const behind: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];
  if (prop === "musket") {
    const mx = armR.W[0] + 2;
    behind.push(
      <g key="musket">
        <path d={limbD([[[mx - 2, -20], 11], [[mx - 1, -62], 7.5], [[mx + 1, -150], 5.5], [[mx + 3, -236], 4.5]])} fill={C_DEEP} {...OUT} />
        <path d={`M${mx + 3},-236L${mx + 4.5},-274`} stroke={DARK} strokeWidth={5.4 * px} strokeLinecap="round" />
        <path d={`M${mx + 3},-236L${mx + 4.5},-274`} stroke={INK} strokeWidth={2.6 * px} strokeLinecap="round" />
        <path d={`M${mx - 4},-96h9M${mx - 3.4},-168h8`} {...ln(1.5, 0.8)} />
      </g>,
    );
  }
  if (prop === "sabre" || prop === "sword") {
    const curved = prop === "sabre";
    const a: P2 = [-ww - 1, -114];
    const m: P2 = curved ? [-ww - 22, -78] : [-ww - 14, -76];
    const e: P2 = curved ? [-ww - 30, -34] : [-ww - 27, -36];
    behind.push(
      <g key="sword">
        <path d={limbD([[a, 6], [m, 5.6], [e, 3.4]])} fill={C_DEEP} {...OUT} strokeWidth={2.4 * px} />
        <path d={`M${P(add(a, [-7, -5]))}L${P(add(a, [7, 3]))}`} stroke={DARK} strokeWidth={6 * px} strokeLinecap="round" />
        <path d={`M${P(add(a, [-7, -5]))}L${P(add(a, [7, 3]))}`} stroke={INK} strokeWidth={2.8 * px} strokeLinecap="round" />
        <path d={`M${P(a)}L${P(add(a, [5, -11]))}`} stroke={DARK} strokeWidth={6.4 * px} strokeLinecap="round" />
        <path d={`M${P(a)}L${P(add(a, [5, -11]))}`} stroke={INK} strokeWidth={3.2 * px} strokeLinecap="round" />
      </g>,
    );
  }
  if (prop === "staff") {
    const tx = armR.W[0] + 1;
    behind.push(<path key="staff" d={limbD([[[tx - 1, armR.W[1] - 24], 6], [[tx, -70], 5.4], [[tx + 2, 1], 4.6]])} fill={C_DEEP} {...OUT} />);
  }
  if (prop === "cane") {
    const c0 = add(armR.hand, [0, -3]);
    front.push(
      <g key="cane">
        <path d={limbD([[c0, 4.4], [[c0[0] + 7, 1], 3.6]])} fill={C_DEEP} {...OUT} strokeWidth={2.2 * px} />
        <circle cx={c0[0]} cy={c0[1] - 3} r={4.6} fill={INK} {...OUT} strokeWidth={2.2 * px} />
      </g>,
    );
  }
  if (prop === "ledger") {
    front.push(
      <g key="ledger" transform="rotate(-6 0 -128)">
        <path d="M-21,-146h42v32h-42Z" fill={C_DEEP} {...OUT} />
        <path d="M-17,-142h34v24h-34Z" fill={INK} stroke={DARK} strokeWidth={1.4 * px} />
        <path d="M0,-142v24M-13,-136h9M-13,-131h9M-13,-126h9M4,-136h9M4,-131h9" {...ln(1.3, 0.75)} />
        <path d="M14,-132Q24,-150 33,-172Q20,-160 12,-140Z" fill={INK} {...OUT} strokeWidth={2 * px} />
        <path d="M14,-132L31,-168" {...ln(1.1, 0.7)} />
      </g>,
    );
  }
  if (prop === "spyglass") {
    const g0 = add(armR.hand, [-9, 8]);
    const g1 = add(armR.hand, [26, -24]);
    front.push(
      <g key="spy">
        <path d={limbD([[g0, 6.4], [mix2(g0, g1, 0.5), 8], [g1, 10]])} fill={C_DEEP} {...OUT} strokeWidth={2.4 * px} />
        <path d={`M${P(add(mix2(g0, g1, 0.45), [-3, -3]))}l6,6M${P(add(mix2(g0, g1, 0.8), [-3.6, -3.6]))}l7.2,7.2`} {...ln(1.5, 0.85)} />
      </g>,
    );
  }
  if (prop === "scroll") {
    const c = armL.hand;
    front.push(
      <g key="scroll">
        <path d={limbD([[add(c, [-4, -20]), 9], [add(c, [1, 18]), 9]])} fill={INK} {...OUT} strokeWidth={2.4 * px} />
        <path d={`M${P(add(c, [-6.6, -15]))}h8.6M${P(add(c, [-2.6, 14]))}h8.4`} {...ln(1.3, 0.8)} />
      </g>,
    );
  }

  const hairCol = spec.hair === "dark" || spec.hair === undefined ? C_HAIR : C_DEEP;
  const wig = spec.hair === "wig";
  const beard = spec.beard ?? "none";
  const hl = (w: number, a: number) => ({ ...ln(w, a), strokeWidth: (w * px) / hs });
  const HO = { ...OUT, strokeWidth: (2.6 * px) / hs };

  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})`}>
      <clipPath id={`${uid}-b`}>
        <path d={BODY} />
      </clipPath>
      {ground ? <path d={`M${-st - 22},3h${2 * st + 50}M${-st - 12},8.5h${2 * st + 34}M${-st - 2},14h${2 * st + 12}`} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={2.4 * px} strokeLinecap="round" /> : null}
      {behind}
      {legs.map((l) => (
        <g key={l.sg}>
          <path d={l.limb} fill={INK} {...OUT} />
          <path d={l.shade} {...ln(1.2, 0.6)} />
          {l.band ? <path d={l.band} {...ln(1.6, 0.8)} /> : null}
          <path d={l.foot} fill={robe ? C_DEEP : C_HAIR} {...OUT} strokeWidth={2.4 * px} />
          {l.buckle ? <path d={l.buckle} fill={INK} stroke={DARK} strokeWidth={1.2 * px} /> : null}
        </g>
      ))}
      {/* the garment */}
      <path d={BODY} fill={INK} {...OUT} />
      <g clipPath={`url(#${uid}-b)`}>
        <path d={hatchD(ww * 0.42, shY, hw + 3, hemY + 9, 108, 3.5, 21)} {...ln(1.25, 0.6)} />
        <path d={hatchD(ww * 0.82, shY + 24, hw + 3, hemY + 9, 60, 4.4, 22)} {...ln(1.1, 0.45)} />
        <path d={hatchD(-hw - 3, -110, -hw + 9, hemY + 9, 84, 4.6, 23, 0.4)} {...ln(1.1, 0.4)} />
        {robe ? (
          <>
            {/* the wrap across the breast, the hem's border, the folds of the skirt */}
            <path d={`M${sx - 8},${shY}Q5,${shY + 34} ${(ww - 2).toFixed(1)},-127`} {...ln(1.8, 0.85)} />
            <path d={`M${(-hw).toFixed(1)},${hemY - 8}Q0,${hemY + 1} ${hw.toFixed(1)},${hemY - 8}`} {...ln(1.6, 0.8)} />
            {[-0.62, -0.2, 0.3, 0.7].map((t, i) => (
              <path key={i} d={`M${(t * ww * 0.9).toFixed(1)},-112Q${(t * hw * 0.74).toFixed(1)},${mix(-112, hemY, 0.5).toFixed(1)} ${(t * hw * 0.92).toFixed(1)},${hemY + 2}`} {...ln(1.5, 0.7)} />
            ))}
            {/* the sash, its knot and its two ends */}
            <rect x={-hw} y={-129} width={2 * hw} height={15} fill={C_DEEP} stroke={DARK} strokeWidth={1.8 * px} />
            <path d={hatchD(4, -129, hw, -114, 100, 3, 24, 0.1)} {...ln(1.1, 0.5)} />
            <path d={limbD([[[-8, -116], 8.5], [[-11, -86], 9], [[-10, -60], 10]])} fill={C_DEEP} {...OUT} strokeWidth={2 * px} />
            <path d={limbD([[[0, -116], 8.5], [[4, -90], 9], [[5, -70], 10]])} fill={C_DEEP} {...OUT} strokeWidth={2 * px} />
            <path d="M-14,-62l0,5M-10,-61l0,5M-6,-62l0,5M1,-72l0,5M5,-71l0,5M9,-72l0,5" {...ln(1.3, 0.75)} />
            <circle cx={-4} cy={-121.5} r={5.6} fill={INK} {...OUT} strokeWidth={2 * px} />
            {spec.jewels ? (
              <>
                <path d={`M${-sw * 0.56},${shY + 6}Q0,${shY + 40} ${sw * 0.56},${shY + 6}`} {...ln(1.3, 0.6)} />
                {[0.12, 0.26, 0.38, 0.5, 0.62, 0.74, 0.88].map((t) => {
                  const q = mix2(mix2([-sw * 0.56, shY + 6], [0, shY + 40], t), mix2([0, shY + 40], [sw * 0.56, shY + 6], t), t);
                  return <circle key={t} cx={q[0]} cy={q[1]} r={2.5} fill={INK} stroke={DARK} strokeWidth={1.2 * px} />;
                })}
              </>
            ) : null}
          </>
        ) : (
          <>
            {/* the open coat: waistcoat and its buttons, the skirts, pocket flaps */}
            <path d={`M${sx - 7},${shY + 1}L-4,-112L-9,${hemY + 4}M${sx + 7},${shY + 1}L4,-112L9,${hemY + 4}`} {...ln(1.8, 0.85)} />
            {[0, 1, 2, 3, 4].map((i) => (
              <circle key={i} cx={sx * (1 - i / 4)} cy={shY + 22 + i * 11.5} r={1.9} fill={DARK} opacity={0.85} />
            ))}
            <path d={`M${(-ww * 0.8).toFixed(1)},-110Q${(-hw * 0.66).toFixed(1)},-90 ${(-hw * 0.68).toFixed(1)},${hemY + 3}M${(ww * 0.8).toFixed(1)},-110Q${(hw * 0.66).toFixed(1)},-90 ${(hw * 0.68).toFixed(1)},${hemY + 3}`} {...ln(1.4, 0.65)} />
            <path d={`M${(-ww - 6).toFixed(1)},-99h13M${(ww - 7).toFixed(1)},-99h13`} {...ln(1.7, 0.8)} />
            {spec.sash ? <path d={limbD([[[sw - 9 + sx, shY + 4], 10], [[0, -140], 10], [[-ww - 2, -114], 10]])} fill={C_DEEP} {...OUT} strokeWidth={2 * px} /> : null}
            {spec.belts ? (
              <>
                <path d={limbD([[[sw - 10, shY + 4], 7], [[-ww, -116], 7]])} fill={C_DEEP} {...OUT} strokeWidth={1.8 * px} />
                <path d={limbD([[[-sw + 10, shY + 4], 7], [[ww, -116], 7]])} fill={C_DEEP} {...OUT} strokeWidth={1.8 * px} />
                <rect x={-hw} y={-121} width={2 * hw} height={8} fill={C_DEEP} stroke={DARK} strokeWidth={1.6 * px} />
              </>
            ) : null}
          </>
        )}
      </g>
      {/* the cravat */}
      {!robe ? <path d={`M${sx - 7},${shY - 3}L${sx},${shY + 13}L${sx + 7},${shY - 3}Z`} fill={INK} {...OUT} strokeWidth={2 * px} /> : null}
      {/* arms, cuffs, hands */}
      {arms.map((a) => (
        <g key={a.sg}>
          <path d={limbD(bones(a.S, a.E, a.W, [17 * b, 16 * b, 13.5, 13.5, 11]))} fill={INK} {...OUT} />
          <path d={braceletD(a.S, a.E, 16 * b, 13.5, 31 + a.sg) + braceletD(a.E, a.W, 13.5, 11, 33 + a.sg)} {...ln(1.2, 0.58)} />
          {!robe ? <path d={limbD([[mix2(a.E, a.W, 0.6), 16.5], [mix2(a.E, a.W, 0.9), 17]])} fill={C_DEEP} {...OUT} strokeWidth={2 * px} /> : null}
          <circle cx={a.hand[0]} cy={a.hand[1]} r={6.4} fill={INK} {...OUT} strokeWidth={2.4 * px} />
        </g>
      ))}
      {front}
      {/* neck and head */}
      <path d={limbD([[[sx, shY + 2], 13], [mix2([sx, shY], headC, 0.7), 11.5]])} fill={INK} {...OUT} />
      <g transform={`translate(${headC[0].toFixed(2)} ${headC[1].toFixed(2)}) rotate(${(13 * hu).toFixed(1)}) scale(${hs})`}>
        {wig ? (
          <>
            <path d="M-17,-2C-20,-26 20,-26 17,-2L17,10L-17,10Z" fill={C_DEEP} {...HO} />
            {[-1, 1].map((sg) => (
              <g key={sg}>
                <circle cx={sg * 17} cy={4} r={6.6} fill={sg < 0 ? INK : C_DEEP} {...HO} />
                <circle cx={sg * 16.4} cy={-7} r={5.8} fill={sg < 0 ? INK : C_DEEP} {...HO} />
                <path d={`M${sg * 17 - 2.6},4a2.6,2.6 0 1 0 5.2,0M${sg * 16.4 - 2.2},-7a2.2,2.2 0 1 0 4.4,0`} {...hl(1.1, 0.7)} />
              </g>
            ))}
          </>
        ) : (
          <>
            <path d="M-15.5,-3C-18,-25 18,-25 15.5,-3L14.5,9L-14.5,9Z" fill={hairCol} {...HO} />
            <path d={hatchD(-16.5, -8, -12.5, 9, 86, 2.2, 41, 0.1) + hatchD(12.5, -8, 16.5, 9, 94, 2.2, 42, 0.1)} {...hl(1.1, 0.75)} />
          </>
        )}
        <path d="M0,-17C-11,-17 -13.5,-8 -13.5,0C-13.5,8 -8,16 0,17.5C8,16 13.5,8 13.5,0C13.5,-8 11,-17 0,-17Z" fill={INK} {...HO} />
        <path d="M-13.6,-6Q-6,-10.4 0,-9.6Q6,-10.4 13.6,-6C14.6,-20.6 -14.6,-20.6 -13.6,-6Z" fill={hairCol} {...HO} strokeWidth={(1.8 * px) / hs} />
        {!wig ? <path d={hatchD(-13, -19, 13, -8.6, 84, 2.3, 43, 0.12)} {...hl(1.05, 0.7)} /> : <path d="M0,-19.4V-10M-6.5,-18.6Q-7.5,-14 -7,-10.4M6.5,-18.6Q7.5,-14 7,-10.4" {...hl(1.05, 0.6)} />}
        <path d={hatchD(5.8, -3.4, 12.2, 11, 112, 2.3, 44)} {...hl(1, 0.55)} />
        <path d="M-9.6,-4.6q3.4,-2 6.4,-0.4M3.2,-5q3,-1.6 6.4,0.4" {...hl(1.9, 0.92)} />
        <circle cx={-5.7} cy={-1.1} r={1.55} fill={DARK} opacity={0.92} />
        <circle cx={5.7} cy={-1.1} r={1.55} fill={DARK} opacity={0.92} />
        <path d="M-0.6,-1L-1.9,5.4l3.1,0.6" {...hl(1.4, 0.85)} />
        {beard === "none" ? <path d="M-4,10.2q4,1.6 8,0" {...hl(1.6, 0.9)} /> : null}
        {beard === "full" ? (
          <>
            <path d="M-13.5,1C-14.4,14 -7,24.5 0,25.6C7,24.5 14.4,14 13.5,1C9,8.4 5,9.8 0,9.8C-5,9.8 -9,8.4 -13.5,1Z" fill={hairCol} {...HO} strokeWidth={(2 * px) / hs} />
            <path d={hatchD(-11, 10.5, 11, 24, 88, 2.4, 45, 0.2)} {...hl(1.05, 0.7)} />
          </>
        ) : null}
        {beard === "long" ? (
          <>
            <path d="M-13.4,2C-14.6,16 -9,31 1,46C9,31 14.6,16 13.4,2C9,8.6 5,10 0,10C-5,10 -9,8.6 -13.4,2Z" fill={INK} {...HO} strokeWidth={(2 * px) / hs} />
            <path d="M-8,11Q-7,24 -1,38M-3,11Q-2,26 1,41M3,11Q4,24 3,36M8,10Q8,20 5,30" {...hl(1.05, 0.6)} />
          </>
        ) : null}
        {beard !== "none" ? <path d="M-6.6,8.8q3.2,-2.6 6.6,-0.5q3.4,-2.1 6.6,0.5" {...hl(1.7, 0.9)} /> : null}
        {spec.hat === "tricorne" ? (
          <>
            <path d="M-13,-15Q0,-33 13,-15Z" fill={C_HAIR} {...HO} />
            <path d="M-30,-9Q-17,-24 0,-17Q17,-24 30,-9Q14,-4.4 0,-7Q-14,-4.4 -30,-9Z" fill={C_HAIR} {...HO} />
            <path d={hatchD(2, -22, 28, -6, 100, 2.4, 46, 0.15)} {...hl(1.05, 0.7)} />
            <path d="M-26,-9.8Q-14,-19 0,-13.6Q14,-19 26,-9.8" fill="none" stroke={INK} strokeWidth={(1.7 * px) / hs} strokeLinecap="round" />
          </>
        ) : null}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CROWN: (0, 0) = the middle of its base, up negative; 60 x 52 units.
// ---------------------------------------------------------------------------
export const CROWN_H = 52;
const CROWN_D = "M-28,0L-31,-34L-16,-16L0,-45L16,-16L31,-34L28,0Q0,7 -28,0Z";
export const Crown: React.FC<{ x: number; y: number; tilt?: number; scale?: number; uid?: string }> = ({ x, y, tilt = 0, scale = 1, uid = "crown" }) => (
  <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${tilt.toFixed(2)}) scale(${scale})`} strokeLinejoin="round" strokeLinecap="round">
    <clipPath id={`${uid}-c`}>
      <path d={CROWN_D} />
    </clipPath>
    <path d={CROWN_D} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={8} />
    <path d={CROWN_D} fill={INK} stroke={DARK} strokeWidth={3} />
    <g clipPath={`url(#${uid}-c)`}>
      <path d={hatchD(6, -46, 32, 6, 104, 3.2, 51, 0.2)} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={1.3} />
      <path d="M-29,-11Q0,-4 29,-11" fill="none" stroke={DARK} strokeOpacity={0.9} strokeWidth={2} />
    </g>
    {[-15, 0, 15].map((cx) => (
      <circle key={cx} cx={cx} cy={-3.4 + (1 - (cx * cx) / 225) * 2.6} r={2.6} fill={DARK} opacity={0.85} />
    ))}
    {(
      [
        [-31, -37],
        [0, -48],
        [31, -37],
      ] as P2[]
    ).map(([cx, cy]) => (
      <circle key={cx} cx={cx} cy={cy} r={5} fill={INK} stroke={DARK} strokeWidth={2.6} />
    ))}
  </g>
);
