// ---------------------------------------------------------------------------
// seizedFigures: the two cream figures of SeizedNotKilled (Si Sheppard,
// "Capture, not kill"): CORTES DOWN ON THE GROUND and HIS RIDERLESS HORSE.
// Dwarkesh map style, engraved manner of texcocoFigures / bothSidesFigures
// (cream form on a dark casing, firm dark outline, tapered limbs, bracelet
// strokes, hatched shade; light from the upper left).
//
// CortesDown is the conquistador CAPTAIN of bothSidesFigures (the same head,
// morion, beard, hand, cuirass, tassets, sleeves, hose and shoes: the engraver's
// helpers, the Hand and the Head are copied from that file verbatim, as the
// common brief asks) on a rig of its own, because that figure only stands:
//   - units as the conquistador's (a standing man ~310 units); figure-local
//     (0, 0) is a point on the GROUND under his hips, up is negative y;
//   - the torso is turned about the hips by `torso` deg from upright
//     (clockwise): 90 = flat on his back, his head toward +x; ~55 = propped;
//   - `far` (his right arm, the upper one when he lies) and `near` (his left,
//     the one toward us and the ground) are two-bone IK to wrist targets in
//     figure-local units; the legs are IK to ankle targets, knees to `knee`;
//   - the head has its own angle (deg, clockwise from upright) and yaw.
// EXPORTS: CortesDown, cortesRig, cortesAnchors, type CortesPose, FallenSword,
// LooseHorse, GroundHatch.
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, hash, type P2 } from "./incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "./stringsMotion";
import { GALLOP } from "./incaGlyphs";
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
// THE HAND (bothSidesFigures')
// ---------------------------------------------------------------------------
type ConqKind = "captain" | "bearer";
type ArmRig = { S: P2; E: P2; W: P2; dir: P2; fist: number; sgn: number; grip: P2 };
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
// THE SHOE (bothSidesFigures', turned with the shin: `turn` deg clockwise from a standing foot)
// ---------------------------------------------------------------------------
const SHOE: P2[] = [[6, 1], [-6, 1], [-13, 7.2], [-23, 10.4], [-27.5, 13.6], [-25.5, 16.8], [-8, 17.6], [8.6, 16.8], [10.8, 11], [8.4, 4]];
const Shoe: React.FC<{ A: P2; k: number; turn: number; ink: Ink }> = ({ A, k, turn, ink }) => (
  <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) rotate(${turn.toFixed(2)}) scale(${k.toFixed(3)})`}>
    <path d={smoothClosed(SHOE)} fill={ink.deep} {...OUT} strokeWidth={2.1} />
    <path d="M8.6,16.8Q-8,14.2 -25.5,16.8" {...ln(1.3, 0.75)} />
    <path d="M6.4,4.6Q-4,9.4 -13.4,7.6" {...ln(1.2, 0.7)} />
    <path d="M-16,9.2l-3,6M-20.4,10.6l-2.6,5" {...ln(0.9, 0.5)} />
  </g>
);

// ---------------------------------------------------------------------------
// CORTES DOWN: the pose and the rig
// ---------------------------------------------------------------------------
export type LegPose = {
  /** the ankle's target, figure-local units */
  a: P2;
  /** the side the knee goes to (a direction) */
  knee: P2;
  /** the foot's extra turn, deg (0 = square to the shin) */
  flex: number;
};
export type CortesPose = {
  /** the hips' centre, figure-local units ((0, 0) = the ground under him; sitting on the ground ~ -22) */
  hip: P2;
  /** the torso's turn about the hips, deg clockwise from upright (90 = flat on his back, head toward +x) */
  torso: number;
  /** the head's angle, deg clockwise from upright, and its yaw (negative = the face toward the left of the head's own frame; -1.15 .. -0.45) */
  head: number;
  headYaw: number;
  /** his right arm (the upper one when he lies) and his left arm (toward us and the ground) */
  far: ArmPose;
  near: ArmPose;
  legFar: LegPose;
  legNear: LegPose;
  brow: number;
  lids: number;
  mouth: number;
};
const SH_Y = -99;
const HEAD_S = 1.08;
const K = 1.02;
export type CortesRig = ReturnType<typeof cortesRig>;
export const cortesRig = (q: CortesPose) => {
  const toFig = (p: P2): P2 => add(q.hip, rot(p, q.torso));
  const neck = toFig([-4, SH_Y - 3]);
  const hs = Math.sin(q.headYaw);
  const neckAngle = mix(q.torso, q.head, 0.55);
  const headC = add(neck, rot([5 * hs * HEAD_S, -30.4], neckAngle));
  const arm = (sgn: number, sh: P2, ap: ArmPose): ArmRig => {
    const S = toFig(sh);
    const { mid: E, end: W } = ik2(S, ap.w, 60, 56, ap.elbow);
    const f = sub(W, E);
    const dir = rot(vlen(f) > 2 ? norm(f) : [0, 1], ap.hand);
    return { S, E, W, dir, fist: ap.fist, sgn, grip: add(W, mul(dir, 11 * K)) };
  };
  const leg = (hx: number, lp: LegPose) => {
    const H = toFig([hx, 2]);
    const { mid: Kn, end: A } = ik2(H, lp.a, 70, 68, lp.knee);
    return { H, K: Kn, A, flex: lp.flex };
  };
  return {
    toFig,
    neck,
    headC,
    hs,
    far: arm(-1, [-33, SH_Y + 2], q.far),
    near: arm(1, [31, SH_Y + 3], q.near),
    legFar: leg(-10, q.legFar),
    legNear: leg(10, q.legNear),
  };
};
/** his anchors in WORLD px (at = the ground point under his hips, scale = px per unit) */
export const cortesAnchors = (q: CortesPose, at: P2, scale: number) => {
  const r = cortesRig(q);
  const w = (v: P2): P2 => add(at, mul(v, scale));
  return {
    rig: r,
    headC: w(r.headC),
    crest: w(add(r.headC, rot([0, -61 * HEAD_S], q.head))),
    shoulderFar: w(r.far.S),
    shoulderNear: w(r.near.S),
    elbowFar: w(r.far.E),
    elbowNear: w(r.near.E),
    wristFar: w(r.far.W),
    wristNear: w(r.near.W),
    handFar: w(r.far.grip),
    handNear: w(r.near.grip),
    ankleFar: w(r.legFar.A),
    ankleNear: w(r.legNear.A),
    hip: w(q.hip),
  };
};
/** a world point as a target for him */
export const toCortes = (world: P2, at: P2, scale: number): P2 => [(world[0] - at[0]) / scale, (world[1] - at[1]) / scale];

export type CortesProps = {
  pose: CortesPose;
  at: P2;
  scale: number;
  uid: string;
  ink?: Ink;
  /** draw the body (default) and which arms; lay an arm over another figure with body={false} */
  body?: boolean;
  arms?: "both" | "far" | "near" | "none";
};
export const CortesDown: React.FC<CortesProps> = ({ pose: q, at, scale, uid, ink = CREAM, body = true, arms: which = "both" }) => {
  const r = cortesRig(q);
  const k = K;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const torsoTf = `translate(${q.hip[0].toFixed(2)} ${q.hip[1].toFixed(2)}) rotate(${q.torso.toFixed(2)})`;

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

  const drawLeg = (l: CortesRig["legFar"], seed: number) => {
    const th = sub(l.K, l.H);
    const tu: P2 = vlen(th) > 0.5 ? norm(th) : [0, 1];
    const tn: P2 = [-tu[1], tu[0]];
    const sh = sub(l.A, l.K);
    const su: P2 = vlen(sh) > 0.5 ? norm(sh) : [0, 1];
    const sn: P2 = [-su[1], su[0]];
    const calf = add(mix2(l.K, l.A, 0.34), mul(sn, -2.4 * k));
    const st: St[] = [
      [l.H, 21 * k],
      [mix2(l.H, l.K, 0.5), 19 * k],
      [l.K, 15 * k],
      [calf, 17.5 * k],
      [mix2(l.K, l.A, 0.82), 11.5 * k],
      [l.A, 10.5 * k],
    ];
    const g = mix2(l.K, l.A, 0.1);
    // the foot follows the shin (a standing shin points down)
    const turn = (Math.atan2(-su[0], su[1]) * 180) / Math.PI + l.flex;
    const across = (v: number, off: number): P2 => add(mix2(l.H, l.K, v), mul(tn, off));
    return (
      <g key={seed}>
        <path d={limbD(st)} fill={ink.main} {...OUT} />
        <path d={braceletD(l.K, l.A, 17 * k, 11 * k, 81 + seed, 2.9)} {...ln(0.95, 0.62)} />
        <Shoe A={l.A} k={k} turn={turn} ink={ink} />
        {/* the paned trunk hose, a garter under the knee */}
        <path d={limbD([[add(l.H, mul(tu, -8)), 31 * k], [mix2(l.H, l.K, 0.28), 41 * k], [mix2(l.H, l.K, 0.56), 35 * k], [mix2(l.H, l.K, 0.7), 23 * k]])} fill={ink.deep} {...OUT} />
        <path d={[-0.34, -0.12, 0.12, 0.34].map((u) => `M${P(across(0.02, u * 26 * k))}Q${P(across(0.3, u * 46 * k))} ${P(across(0.66, u * 22 * k))}`).join("")} {...ln(1.2, 0.7)} />
        <path d={braceletD(mix2(l.H, l.K, 0.05), mix2(l.H, l.K, 0.62), 36 * k, 32 * k, 95 + seed, 3.2, 0.7)} {...ln(0.9, 0.5)} />
        <path d={limbD([[add(g, mul(sn, -8.4 * k)), 4.8], [add(g, mul(sn, 8.4 * k)), 4.8]])} fill={ink.main} {...OUT} strokeWidth={1.7} />
      </g>
    );
  };

  // ---- the steel (torso-local: hips (0, 0), shoulders at y = SH_Y); three-quarter, chest to -x
  const CUIR =
    `M-34,${SH_Y + 2}Q-27,${SH_Y - 7} -17,${SH_Y - 5}Q-4,${SH_Y + 8} 9,${SH_Y - 5}Q22,${SH_Y - 8} 34,${SH_Y + 2}` +
    `C38,-70 31,-40 27,-12L33,3Q-6,14 -38,4L-34,-10C-46,-30 -47,-62 -41,-84Q-39,-92 -34,${SH_Y + 2}Z`;
  const RIDGE = `M-9,${SH_Y + 3}C-22,-74 -33,-40 -21,8`;
  const neckTop = mix2(r.neck, add(r.headC, rot([-7 * r.hs * HEAD_S, 0], q.head)), 0.78);
  const neckBase = add(r.neck, rot([0, 5], q.torso));

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
          {/* the tassets */}
          <path d="M-37,1L-20,6L-19,41L-42,35Z" fill={ink.deep} {...OUT} />
          <path d="M-18,6L33,0L39,35L-16,43Z" fill={ink.deep} {...OUT} />
          <path d="M-39,13L-20,18M-40,24L-19,29M-18,18L35,12M-17,30L37,23" {...ln(1.1, 0.65)} />
          <path d={hatchD(14, 2, 40, 42, 104, 2.8, 48, 0.2)} {...ln(0.85, 0.45)} />
          {/* the cuirass: a peascod breast with its ridge, the waist flange, the baldric */}
          <path d={CUIR} fill={ink.main} {...OUT} />
          <g clipPath={`url(#${uid}-cuir)`}>
            <path d={hatchD(8, SH_Y, 40, 8, 110, 2.8, 44)} {...ln(0.95, 0.6)} />
            <path d={hatchD(18, SH_Y + 30, 40, 8, 62, 3.4, 45)} {...ln(0.9, 0.45)} />
            <path d={hatchD(-46, -40, -24, 6, 72, 3, 46, 0.3)} {...ln(0.85, 0.36)} />
            <path d={RIDGE} {...ln(1.5, 0.82)} />
            <path d="M-35,-9Q-6,1 28,-11" {...ln(1.3, 0.75)} />
            <path d={`M33,${SH_Y + 30}Q21,${SH_Y + 22} 24,${SH_Y + 3}`} {...ln(1.1, 0.6)} />
            <path d={`M-31,${SH_Y - 4}L-19,${SH_Y - 6}L34,-6L26,6Z`} fill={ink.deep} stroke={DARK} strokeWidth={1.8} strokeLinejoin="round" />
            <path d={`M-24,${SH_Y}L29,-1`} {...ln(0.9, 0.5)} />
          </g>
          {/* the gorget */}
          <path d={`M-21,${SH_Y}Q-5,${SH_Y + 17} 14,${SH_Y}L10,${SH_Y - 10}Q-5,${SH_Y + 1} -17,${SH_Y - 10}Z`} fill={ink.deep} {...OUT} />
        </g>
        {/* neck and head */}
        <path d={limbD([[neckBase, 20 * k], [neckTop, 16.5 * k]])} fill={ink.main} {...OUT} />
        <g transform={`translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${q.head.toFixed(2)}) scale(${HEAD_S})`}>
          <Head kind="captain" yaw={q.headYaw} nod={0} face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }} uid={`${uid}-h`} ink={ink} />
        </g>
        {nearOn ? drawArm(r.near) : null}
      </Cased>
    </g>
  );
};

// ---------------------------------------------------------------------------
// HIS SWORD ON THE GROUND (units as the figure's; `at` = the cross-guard, the
// blade runs toward `turn` deg (0 = to screen right))
// ---------------------------------------------------------------------------
export const FallenSword: React.FC<{ at: P2; scale: number; turn?: number; uid: string; ink?: Ink }> = ({ at, scale, turn = 0, uid, ink = CREAM }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${turn.toFixed(2)}) scale(${scale.toFixed(4)})`}>
    <Cased id={`${uid}-case`}>
      {/* the blade with its fuller, the cross-guard, the grip, the pommel, the knuckle bow */}
      <path d="M2,-4.6L118,-3.2L142,0L118,3.2L2,4.6Z" fill={ink.main} {...OUT} strokeWidth={2} />
      <path d="M8,0L112,0" {...ln(1.1, 0.65)} />
      <path d={hatchD(6, 0.4, 126, 4.2, 20, 3.2, 58, 0.2)} {...ln(0.8, 0.42)} />
      <path d="M-4,-18Q-24,-22 -29,-3" fill="none" stroke={DARK} strokeWidth={5.4} strokeLinecap="round" />
      <path d="M-4,-18Q-24,-22 -29,-3" fill="none" stroke={ink.main} strokeWidth={2.4} strokeLinecap="round" />
      <path d={limbD([[[0, -19], 4.8], [[0, 19], 4.8]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
      <path d={limbD([[[-2, 0], 6.8], [[-27, 0], 6]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      <path d="M-8,-3l0,6M-14,-3l0,6M-20,-3l0,6" {...ln(0.9, 0.6)} />
      <circle cx={-31.5} cy={0} r={5.6} fill={ink.main} {...OUT} strokeWidth={1.9} />
    </Cased>
  </g>
);

// ---------------------------------------------------------------------------
// HIS HORSE, RIDERLESS, AT THE GALLOP (incaGlyphs' horse: the same body and the
// same three gallop poses, here run through continuously; saddle, girth, a
// flying stirrup, the reins trailing). Glyph units: 57 from ear to hoof.
// `at` = the ground under its middle; `size` = world px for those 57 units;
// `phase` = strides (one stride per unit); it faces and runs to screen LEFT.
// ---------------------------------------------------------------------------
const H_BODY =
  "M-20,-1.5 C-21,-6.6 -18.6,-10.6 -13.6,-11.2 C-9.6,-11.6 -5,-9.8 -0.6,-9.8 C3.6,-9.8 7.6,-11.4 11,-12.4 " +
  "C15.6,-15.4 20.4,-21.4 24.6,-25.8 L24.4,-29.8 L27,-26.6 C30.4,-24.2 34.6,-19.2 37.6,-15.4 C38.8,-13.8 38,-11.6 36,-11.6 " +
  "C33.6,-11.8 31.2,-13 29.2,-14.6 C28.4,-15.2 27.8,-15.6 27.4,-15.4 " +
  "C25.2,-11.6 22.8,-6.6 20.6,-2.2 C19.6,1.8 17.2,4.6 13.8,6 C7.6,7.8 -2.4,8 -9.2,7 " +
  "C-14,6.2 -17.6,4.6 -19.2,2.2 C-19.8,0.9 -20,-0.2 -20,-1.5 Z";
const H_HATCH = "M-13.4,4.4 C-6,6.2 4,6.4 11.6,4.6 M-16.4,-4.4 C-14.6,-1.4 -12.4,1 -9.4,2.6 M16.4,-8.4 C15.4,-4.4 14.4,-1.4 12.6,1.8";
const POSE_PITCH = [0, -2.6, 2.2];
const POSE_LIFT = [-0.8, -1.6, 0.9];
/** a periodic Catmull-Rom through three keys (no stops at the keys) */
const cycle3 = (v: number[], ph: number) => {
  const x = (ph - Math.floor(ph)) * 3;
  const i = Math.floor(x) % 3;
  const t = x - Math.floor(x);
  const p0 = v[(i + 2) % 3];
  const p1 = v[i];
  const p2 = v[(i + 1) % 3];
  const p3 = v[(i + 2) % 3];
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
};
type HLeg = [P2, P2, P2];
const hLegD = (l: HLeg, wu: number, wl: number): St[] => [
  [l[0], wu],
  [mix2(l[0], l[1], 0.55), wu * 0.8],
  [l[1], wu * 0.5 + wl * 0.5],
  [mix2(l[1], l[2], 0.6), wl],
  [l[2], wl * 1.05],
];
export const LooseHorse: React.FC<{ at: P2; size: number; phase: number; uid: string; ink?: Ink }> = ({ at, size, phase, uid, ink = CREAM }) => {
  const u = size / 57;
  const legs = [0, 1, 2, 3].map((li): HLeg => [0, 1, 2].map((j): P2 => [cycle3(GALLOP.map((g) => g[li][j][0]), phase), cycle3(GALLOP.map((g) => g[li][j][1]), phase)]) as HLeg);
  const pitch = cycle3(POSE_PITCH, phase);
  const lift = cycle3(POSE_LIFT, phase);
  const sw = 1 / u;
  const o = { stroke: DARK, strokeWidth: 1.9 * sw, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const l2 = (w: number, a: number) => ({ fill: "none", stroke: DARK, strokeWidth: w * sw, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
  const fl = Math.sin(2 * Math.PI * phase);
  const fl2 = Math.sin(2 * Math.PI * phase + 1.3);
  const hoof = (l: HLeg) => {
    const d = norm(sub(l[2], l[1]));
    return `M${P(add(l[2], mul(d, -1.5)))}L${P(add(l[2], mul(d, 0.7)))}`;
  };
  // the tail and the mane stream behind it
  const TAIL = `M-18.2,-8.6C-25,-11.5 -31,-11 ${(-37 + 0.6 * fl).toFixed(2)},${(-7.6 + 1.6 * fl).toFixed(2)}C-33,-7 -31,-5.6 ${(-34 + 0.8 * fl2).toFixed(2)},${(-2.6 + 1.5 * fl2).toFixed(2)}C-28,-4.6 -24,-4.4 -19.6,-2.6Z`;
  const MANE = `M12,-13.2C13.4,-17.4 ${(11.6 + 0.6 * fl).toFixed(2)},-19.4 ${(9 + 0.8 * fl).toFixed(2)},${(-20 + 0.5 * fl2).toFixed(2)}C13.6,-19.6 14.6,-21.6 ${(12.8 + 0.7 * fl2).toFixed(2)},${(-24 + 0.5 * fl).toFixed(2)}C17,-22.4 18.4,-24.4 ${(17 + 0.6 * fl).toFixed(2)},${(-27 + 0.5 * fl2).toFixed(2)}C20.6,-25.6 22.6,-26.6 24.6,-26Z`;
  // the reins: off the bit, flung back and trailing
  const REINS = `M34.6,-13.4C28,-9.4 21,-12.6 ${(13 + fl).toFixed(2)},${(-7 + 1.4 * fl2).toFixed(2)}S${(5 + 1.2 * fl2).toFixed(2)},${(2 + 2 * fl).toFixed(2)} ${(-1 + 1.5 * fl).toFixed(2)},${(7 + 2.4 * fl2).toFixed(2)}`;
  // the stirrup flies back on its leather
  const sa = 38 + 16 * fl2;
  const st0: P2 = [1.6, -4.6];
  const st1 = add(st0, rot([0, 10.5], sa));
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${(-u).toFixed(4)} ${u.toFixed(4)}) translate(0 ${(lift - 19.6).toFixed(3)}) rotate(${pitch.toFixed(3)})`}>
      <Cased id={`${uid}-case`} r={1.4 * sw}>
        <clipPath id={`${uid}-body`}>
          <path d={H_BODY} />
        </clipPath>
        {[1, 3].map((i) => (
          <g key={i}>
            <path d={limbD(hLegD(legs[i], i < 2 ? 5.4 : 6.6, 2.7))} fill={ink.deep} {...o} />
            <path d={hoof(legs[i])} fill="none" stroke={DARK} strokeOpacity={0.85} strokeWidth={3.3} />
          </g>
        ))}
        <path d={TAIL} fill={ink.hair} {...o} />
        <path d={H_BODY} fill={ink.main} {...o} />
        <g clipPath={`url(#${uid}-body)`}>
          <path d={hatchD(-20, 0, 16, 9, 12, 1.15, 61, 0.2)} {...l2(0.9, 0.5)} />
          <path d={hatchD(-21, -8, -11, 6, 70, 1.2, 62, 0.25)} {...l2(0.85, 0.42)} />
          <path d={hatchD(15, -20, 27, -2, 64, 1.25, 63, 0.3)} {...l2(0.85, 0.4)} />
        </g>
        <path d={MANE} fill={ink.hair} {...o} strokeWidth={1.5 * sw} />
        {[0, 2].map((i) => (
          <g key={i}>
            <path d={limbD(hLegD(legs[i], i < 2 ? 5.6 : 6.8, 2.9))} fill={ink.main} {...o} />
            <path d={hoof(legs[i])} fill="none" stroke={DARK} strokeOpacity={0.85} strokeWidth={3.3} />
          </g>
        ))}
        <path d={H_HATCH} {...l2(1, 0.55)} />
        {/* the eye, the nostril, the bridle */}
        <circle cx={29.6} cy={-21.2} r={0.75} fill={DARK} opacity={0.9} />
        <path d="M36.6,-13.6l0.9,0.5" {...l2(1.2, 0.8)} />
        <path d="M27.2,-26.2C29.4,-22 32.6,-17 34.8,-13M31,-23.4C29.4,-20.8 28.6,-18.2 28.4,-15.6M33.2,-19.6C32,-17.4 31,-15.4 30.6,-13.4" {...l2(1.1, 0.7)} />
        <path d={REINS} fill="none" stroke={DARK} strokeWidth={2.5 * sw} strokeLinecap="round" />
        <path d={REINS} fill="none" stroke={ink.deep} strokeWidth={1.1 * sw} strokeLinecap="round" />
        {/* the girth, the saddle cloth, the saddle with its pommel and cantle, the empty stirrup */}
        <path d="M0.4,-9.6C1.6,-3 1.4,2.6 0,7.4" {...l2(1.5, 0.75)} />
        <path d="M-9.6,-10.8L7.6,-11.4L8.4,-3.6L-8.6,-2.6Z" fill={ink.deep} {...o} strokeWidth={1.6 * sw} />
        <path d="M-7.4,-4.6L7,-5.4" {...l2(0.9, 0.55)} />
        <path d="M-8.8,-10.6C-9.8,-13.6 -8.6,-15.4 -6.6,-15C-5,-12.6 2.6,-12.4 4.6,-15.6C6.8,-16 8,-14 7.2,-10.8C2,-9.4 -4,-9.4 -8.8,-10.6Z" fill={ink.main} {...o} strokeWidth={1.6 * sw} />
        <path d={`M${P(st0)}L${P(st1)}`} {...l2(1.2, 0.8)} />
        <path d={`M${P(add(st1, rot([-1.9, 0], sa)))}L${P(add(st1, rot([-1.9, 3.6], sa)))}L${P(add(st1, rot([1.9, 3.6], sa)))}L${P(add(st1, rot([1.9, 0], sa)))}Z`} fill={ink.deep} {...o} strokeWidth={1.3 * sw} />
      </Cased>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GROUND: a little engraved hatching under the figures (world px; static)
// ---------------------------------------------------------------------------
export const GroundHatch: React.FC<{ x0: number; x1: number; y: number; depth: number; seed: number; ink?: string; opacity?: number; rows?: number; dark?: boolean }> = ({ x0, x1, y, depth, seed, ink = CREAM.main, opacity = 0.3, rows = 5, dark = false }) => {
  let d = "";
  const cx = (x0 + x1) / 2;
  const hw = (x1 - x0) / 2;
  for (let r = 0; r < rows; r++) {
    const v = rows === 1 ? 0.5 : r / (rows - 1);
    const yy = y + (v - 0.5) * depth;
    const span = hw * Math.sqrt(Math.max(0.05, 1 - (2 * v - 1) ** 2 * 0.72));
    let x = cx - span + hash(r, seed) * 30;
    let i = 0;
    while (x < cx + span) {
      const L = 16 + 46 * hash(i + r * 31, seed + 1);
      const gap = 9 + 30 * hash(i + r * 31, seed + 2);
      const dy = (hash(i + r * 31, seed + 3) - 0.5) * 3;
      const x1e = Math.min(cx + span, x + L);
      d += `M${x.toFixed(1)},${(yy + dy).toFixed(1)}L${x1e.toFixed(1)},${(yy + dy + (hash(i, seed + 4) - 0.5) * 1.6).toFixed(1)}`;
      x += L + gap;
      i++;
    }
  }
  return <path d={d} fill="none" stroke={dark ? DARK : ink} strokeOpacity={opacity} strokeWidth={dark ? 2 : 1.7} strokeLinecap="round" />;
};
