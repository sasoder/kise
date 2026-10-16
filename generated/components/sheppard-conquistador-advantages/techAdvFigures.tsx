// ---------------------------------------------------------------------------
// techAdvFigures: the two men of the TechnologicalAdvantages cut (Dwarkesh
// Patel with Si Sheppard, "Conquistador advantages", Oct 2026): a conquistador
// who draws his sword, and an Aztec warrior in quilted cotton with shield and
// macuahuitl. The engraving grammar of texcocoFigures / bothSidesFigures (cream
// form on a dark casing, firm dark outline, tapered limbs, bracelet strokes,
// hatched shade; light from the upper left), the same scale (figure-local
// units: feet at (0, 0), up is negative y, a bare-headed man ~310 units).
//
// Both bodies are drawn in ONE view each, three-quarter:
//   Conquistador   faces screen LEFT (bothSidesFigures' captain, re-rigged: legs
//                  to ankle targets, a crouch, the sword a free object that
//                  leaves a scabbard which pivots at its mouth). `far` = his
//                  right arm (the sword arm; its upper half passes behind the
//                  chest, its forearm in front), `near` = his left.
//   Warrior        faces screen RIGHT: ichcahuipilli (sleeveless quilted cotton
//                  to mid-thigh, diamond lattice, tie laces), loincloth ends,
//                  sandals, the warrior's topknot; `far` = his left arm (the
//                  chimalli), `near` = his right (the macuahuitl).
// THE STEEL takes its colour as INK: `steel.lead` is the figure-local y of a
// front of pen strokes that travels down him; behind it the morion, gorget,
// pauldrons, cuirass, tassets and the sword are ORANGE (the same drawing in
// orange ink, clipped by the strokes), ahead of it cream. Never an opacity.
//
// Draw inside a WorldSvg. EXPORTS: Conquistador, conqRig, CONQ_IDLE, holdAt,
// swordInScabbard, SWORD, Warrior, warRig, WAR_READY, inkFrontD, INK_FRONT.
// ---------------------------------------------------------------------------
import React from "react";
import { DARK, hash, type P2 } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { CREAM, ORANGE, type ArmPose, type Ink } from "../kits/maps/texcocoFigures";

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
const dirOf = (deg: number): P2 => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
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
// THE INK FRONT: pen strokes laid one under the other, each drawn across the
// form from the lit side; `lead` = the figure-local y the newest stroke starts
// at. A stroke takes `band` units of lead to cross, so the front is a slanting
// comb of stroke ends; behind it the strokes lie edge to edge (solid ink).
// ---------------------------------------------------------------------------
export const INK_FRONT = { x0: -120, w: 240, gap: 3.4, band: 52, top: -378, slant: 0.16 };
export const inkFrontD = (lead: number): string => {
  const F = INK_FRONT;
  const hw = F.gap * 0.57;
  const n = Math.ceil((lead + 8 - F.top) / F.gap) + 1;
  if (n <= 0) return "";
  const prog = (i: number) => (lead - (F.top + i * F.gap) + (hash(i, 5) - 0.5) * 11) / F.band;
  let done = -1;
  while (done + 1 < n && prog(done + 1) >= 1) done++;
  const y = (i: number, x: number) => F.top + i * F.gap + (x - F.x0) * F.slant;
  const x1 = F.x0 + F.w;
  let d = "";
  if (done >= 0) d += polyD([[F.x0, F.top - 30], [x1, F.top - 30], [x1, y(done, x1) + hw], [F.x0, y(done, F.x0) + hw]], true);
  for (let i = done + 1; i < n; i++) {
    const p = Math.min(1, prog(i));
    if (p <= 0.004) continue;
    const xt = F.x0 + F.w * p;
    const xs = Math.max(F.x0, xt - 15);
    d += polyD([[F.x0, y(i, F.x0) - hw], [xs, y(i, xs) - hw], [xt, y(i, xt)], [xs, y(i, xs) + hw], [F.x0, y(i, F.x0) + hw]], true);
  }
  return d;
};
/** how the steel stands: lead = null: all cream; a number: the front at that y; all: every stroke laid */
export type Steel = { lead: number | null; all?: boolean };
type SteelD = { d: string | null; all: boolean };
const steelD = (s: Steel): SteelD => ({ all: !!s.all, d: s.all || s.lead === null ? null : inkFrontD(s.lead) });
/** a piece of steel: the cream drawing, and over it the same drawing in orange ink as far as the front has come.
 *  `inv` takes the front (figure-local) into the piece's own frame. */
const inked = (st: SteelD, uid: string, inv: string, draw: (ink: Ink, id: string) => React.ReactNode) =>
  st.all ? (
    draw(ORANGE, `${uid}o`)
  ) : (
    <>
      {draw(CREAM, `${uid}c`)}
      {st.d ? (
        <>
          <clipPath id={`${uid}-fr`}>
            <path d={st.d} transform={inv || undefined} />
          </clipPath>
          <g clipPath={`url(#${uid}-fr)`}>{draw(ORANGE, `${uid}o`)}</g>
        </>
      ) : null}
    </>
  );

// ---------------------------------------------------------------------------
// THE HAND (as texcocoFigures'); the Spaniard's has a cuff, the warrior's a band
// ---------------------------------------------------------------------------
type HandRig = { W: P2; dir: P2; fist: number; sgn: number };
const Hand: React.FC<{ a: HandRig; k: number; ink: Ink; cuff: boolean }> = ({ a, k, ink, cuff }) => {
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
      {cuff ? (
        <>
          <path d={limbD([[at(-3.6, -9), 6 * k], [at(-3.6, 9), 6 * k]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={`M${P(at(-3.6, -5))}L${P(at(-3.6, 5))}`} {...ln(0.9, 0.55)} />
        </>
      ) : (
        <>
          <path d={limbD([[at(-3.4, -8.4), 5 * k], [at(-3.4, 8.4), 5 * k]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
          <path d={`M${P(at(-3.4, -4))}L${P(at(-3.4, 4))}`} {...ln(0.9, 0.55)} />
        </>
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE HEADS (head-local units, (0, 0) = the middle of the face)
// ---------------------------------------------------------------------------
const FACE_F: P2[] = [[0, -26], [8, -25], [14, -21], [18, -13], [19.5, -5], [19.5, 2], [19, 8], [18, 12], [16.5, 16], [14.5, 19.5], [11, 23], [5, 26.5], [-5, 26.5], [-11, 23], [-16.5, 16], [-19, 8], [-19.5, -2], [-18, -13], [-14, -21], [-8, -25]];
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];
// the Spaniard's cropped hair, the warrior's cut at the jaw
const HAIR_CF: P2[] = [[-20, 17], [-25.5, 13], [-27, 5], [-24, -14], [-17, -27], [0, -31], [17, -27], [24, -14], [27, 5], [25.5, 13], [20, 17], [13, 16], [16, 14], [17.5, 0], [16, -9], [8, -13.5], [0, -12.4], [-8, -13.5], [-16, -9], [-17.5, 0], [-16, 14], [-13, 16]];
const HAIR_CP: P2[] = [[-24, 14], [-28, 10], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 16], [-13, 15]];
const HAIR_WF: P2[] = [[-20, 27], [-25.5, 19], [-27, 5], [-24, -14], [-17, -27], [0, -31], [17, -27], [24, -14], [27, 5], [25.5, 19], [20, 27], [13, 26], [16, 14], [17.5, 0], [16, -9], [8, -13.5], [0, -12.4], [-8, -13.5], [-16, -9], [-17.5, 0], [-16, 14], [-13, 26]];
const HAIR_WP: P2[] = [[-24, 24], [-28, 15.3], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 21.3], [-13, 25]];
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
      <clipPath id={`${uid}-brim`}>
        <path d={BRIM} />
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
        {/* the light on the crown of the dome */}
        <path d="M-15,-27Q-14,-39 -5,-44" {...ln(1, 0.35)} />
        <path d="M-24,-23.5Q0,-28.5 24,-23.5" {...ln(1.2, 0.7)} />
        {[-13, 0, 13].map((x) => (
          <circle key={x} cx={x} cy={-22.4 - (1 - (x * x) / 400) * 2.4} r={1.3} fill={DARK} opacity={0.75} />
        ))}
      </g>
      <path d={BRIM} fill={ink.main} {...OUT} />
      <path d={`M${xb * 0.78},-20.6Q${xb * 0.4},-12.6 0,-12Q${xf * 0.4},-12.6 ${xf * 0.78},-21`} {...ln(0.9, 0.5)} />
      <g clipPath={`url(#${uid}-brim)`}>
        <path d={hatchD(10, -34, 44, -8, 100, 2.4, 76, 0.15)} {...ln(0.85, 0.5)} />
      </g>
    </g>
  );
};

type Face = { brow: number; lids: number; mouth: number };
const Head: React.FC<{ kind: "conq" | "warrior"; yaw: number; nod: number; face: Face; uid: string; ink: Ink; helmet?: React.ReactNode }> = ({ kind, yaw, nod, face, uid, ink, helmet }) => {
  const conq = kind === "conq";
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const fy = 5 * nod;
  const pr = (fx: number, y: number, D: number, k = 1): P2 => [fx * c + D * s, y + fy * k];
  const vis = (side: number) => (side * sg > 0 && t > 0.02 ? c01((c - 0.2) / 0.32) : 1);
  const FACE = smoothClosed(blendYaw(FACE_F, FACE_P, yaw));
  const hair = conq ? blendYaw(HAIR_CF, HAIR_CP, yaw) : blendYaw(HAIR_WF, HAIR_WP, yaw);
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
        <path d={`M${P(u0)}Q${P(u1)} ${P(u2)}`} {...ln(0.9, 0.55 * open)} />
        <ellipse cx={pu[0]} cy={pu[1] + 0.1 + 0.8 * face.lids} rx={2.15 * Math.max(0.45, Math.min(1, w))} ry={2.15 * (0.55 + 0.45 * open)} fill={DARK} opacity={0.92} />
      </g>
    );
  };
  const RF = 18.2;
  const o = -2.2 * clamp1(1 - yaw * 8);
  const tipOut = conq ? 9.4 : 8.6;
  const nRoot: P2 = [RF * s * 0.94 + o * c, -4.6 + fy];
  const nTip: P2 = [(RF + tipOut) * s + o * 1.55 * c, 8.5 + fy];
  const nUnder: P2 = [(RF + 4.6) * s - o * 0.1 * c, 11 + fy];
  const nWing: P2 = [(RF - 3) * s - o * 2.1 * c, 8.2 + 1.6 * t + fy];
  const nWingIn: P2 = [(RF - 1.6) * s - o * 1.3 * c, 5.6 + t + fy];
  const nBack: P2 = [(RF - 3) * s + o * 0.2 * c, -2 + fy];
  const nC1: P2 = [nTip[0] + 0.2 + 0.3 * s, 10.8 + 0.3 * t + fy];
  const nC2: P2 = [mix(nUnder[0], nWing[0], 0.75 - 0.25 * t), 11 + 0.4 * t + fy];
  const nC3: P2 = [nWing[0] - 0.2 * (1 - t) - 1.4 * s, 6.2 + 1.3 * t + fy];
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
        {conq ? null : <path d={`M${P(l0)}Q${P(mix2(l0, l1, 0.6))} ${P(l1)}`} {...ln(1.1, 0.62)} />}
      </g>
    );
  };
  // the near ear, once he is turned; the warrior's carries a plug
  const e = pr(-sg * 20.6, 4, -5, 0);
  const ew = mix(0.55, 1, t);
  const drop = 7;
  const BEARD = conq
    ? smoothClosed(
        blendYaw(BEARD_F, BEARD_P, yaw).map((p, i): P2 => {
          const low = [3, 4, 5].includes(i) ? drop : [2, 6].includes(i) ? drop * 0.45 : 0;
          return [p[0] + (i === 4 ? sg * drop * 0.5 * t : 0), p[1] + fy * 0.6 + low];
        }),
      )
    : "";
  // the warrior's topknot: a bound column of hair on the crown
  const tk = -5 * s;
  const TOPKNOT = `M${tk - 7.5},-27C${tk - 8},-36 ${tk - 9},-41 ${tk - 13},-52Q${tk - 7},-58 ${tk},-55.5Q${tk + 7},-58.5 ${tk + 13},-52C${tk + 9},-41 ${tk + 8},-36 ${tk + 7.5},-27Z`;
  return (
    <g>
      <clipPath id={`${uid}-face`}>
        <path d={FACE} />
      </clipPath>
      <clipPath id={`${uid}-hair`}>
        <path d={HAIR} />
      </clipPath>
      {conq ? (
        <clipPath id={`${uid}-beard`}>
          <path d={BEARD} />
        </clipPath>
      ) : (
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
      )}
      <path d={FACE} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-face)`}>
        <path d={hatchD(9 + 6 * s, -9 + fy, 27, 24, 114, 2.3, 24)} {...ln(0.95, 0.62 * (sg > 0 ? c : 1))} />
        <path d={hatchD(13 + 6 * s, -4, 27, 18, 58, 2.9, 25)} {...ln(0.85, 0.46 * (sg > 0 ? c : 1))} />
        {conq ? (
          <path d={hatchD(-24, -20, 24, -10, 84, 2.2, 28, 0.2)} {...ln(0.9, 0.55)} />
        ) : (
          <>
            <path d={hatchD(-16 + 10 * s, 22, 16 + 10 * s, 29, 4, 2, 26, 0.2)} {...ln(0.85, 0.5)} />
            <path d={hatchD(-22, -6, -14 + 4 * t, 16, 70, 2.8, 30, 0.3)} {...ln(0.8, 0.32 * (sg < 0 ? c : 1))} />
          </>
        )}
        {t > 0.3 ? <path d={hatchD(sg * -27, -2, sg * -27 + sg * 19, 26, sg > 0 ? 62 : 118, 2.5, 39, 0.3)} {...ln(0.85, 0.4 * c01((t - 0.3) * 3))} /> : null}
      </g>
      <path d={HAIR} fill={ink.hair} {...OUT} />
      <g clipPath={`url(#${uid}-hair)`}>
        <path d={hatchD(-31, -32, 30, hb + 4, 88, 2.15, 21, 0.1)} {...ln(1.25, 0.82)} />
        {conq ? null : <path d={hatchD(-31, 2, 30, hb + 4, 82, 3.4, 37, 0.3)} {...ln(1.1, 0.45)} />}
      </g>
      {[-1, 1].map(eye)}
      {t > 0.12 ? <path d={`M${P(nRoot)}L${P(nTip)}L${P(nUnder)}L${P(nWing)}L${P(nBack)}Z`} fill={ink.main} /> : null}
      <path d={`M${P(nRoot)}L${P(nTip)}Q${P(nC1)} ${P(nUnder)}Q${P(nC2)} ${P(nWing)}Q${P(nC3)} ${P(nWingIn)}`} {...ln(1.7, 0.9)} />
      <path d={[0.22, 0.45, 0.68].map((u) => `M${P(add(mix2(nRoot, nTip, u), [-o * 1.5 * c - 3 * s, 0.6]))}l${(-o * 1.1 * c - 1.6 * s).toFixed(1)},1.4`).join("")} {...ln(0.85, 0.5)} />
      {conq
        ? [-1, 1].map((sd) => <path key={sd} d={`M${P(pr(sd * 6.4, 9.4, 15.5))}Q${P(pr(sd * 9.6, 12.4, 13.5))} ${P(pr(sd * 10, 16.4, 11.5))}`} {...ln(1, 0.5 * vis(sd))} />)
        : null}
      {conq ? null : (
        <>
          {[-1, 1].map(half)}
          <path d={`M${P(pr(-3, 23.4, 17, 0.4))}Q${P(pr(0, 22.3, 18.6, 0.4))} ${P(pr(3, 23.4, 17, 0.4))}`} {...ln(0.9, 0.42)} />
        </>
      )}
      {t > 0.2 ? (
        <>
          <ellipse cx={e[0]} cy={e[1]} rx={4.2 * ew} ry={6.4} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={`M${(e[0] + sg * 1.6 * ew).toFixed(1)},${e[1] - 3}q${(-sg * 3.4 * ew).toFixed(1)},2.6 ${(-sg * 0.6 * ew).toFixed(1)},6`} {...ln(1, 0.6)} />
          {conq ? null : (
            <>
              <circle cx={e[0]} cy={e[1] + 6.6} r={4.4 * Math.max(0.6, ew)} fill={ink.main} {...OUT} strokeWidth={2} />
              <circle cx={e[0]} cy={e[1] + 6.6} r={1.4} fill={DARK} opacity={0.72} />
            </>
          )}
        </>
      ) : null}
      {conq ? (
        <>
          <path d={BEARD} fill={ink.hair} {...OUT} />
          <g clipPath={`url(#${uid}-beard)`}>
            <path d={hatchD(-26, 0, 28, 46, 84, 2.1, 73, 0.12)} {...ln(1.2, 0.8)} />
          </g>
          {[-1, 1].map(half)}
          {[-1, 1].map((sd) => (
            <path key={sd} d={limbD([[pr(0, 13.2, 20.8, 0.7), 4.6], [pr(sd * 5.5, 13.6, 17.5, 0.7), 4.8], [pr(sd * 11, 18, 12.5, 0.7), 2.6]])} fill={ink.hair} {...OUT} strokeWidth={1.6} opacity={vis(sd)} />
          ))}
        </>
      ) : null}
      {helmet}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SWORD: a straight double-edged blade, a simple cross-guard with a side
// ring, a bound grip, a wheel pommel. Sword-local: the guard at (0, 0), the
// blade along + x. The fist holds it SWORD.grip behind the guard.
// ---------------------------------------------------------------------------
export const SWORD = { L: 128, grip: 13 };
const SwordArt: React.FC<{ ink: Ink }> = ({ ink }) => {
  const L = SWORD.L;
  return (
    <g>
      {/* a dark casing line, so the blade parts from the steel it crosses */}
      <path d={`M0,-8.8L${L - 24},-6.5L${L},0L${L - 24},6.5L0,8.8Z`} fill={DARK} stroke={DARK} strokeWidth={7} strokeLinejoin="round" />
      <path d={`M0,-8.8L${L - 24},-6.5L${L},0L${L - 24},6.5L0,8.8Z`} fill={ink.main} {...OUT} strokeWidth={2.1} />
      <path d={`M0,0.6L${L - 1},0.2L${L - 24},6.5L0,8.8Z`} fill={ink.deep} />
      <path d={`M0,-8.8L${L - 24},-6.5L${L},0L${L - 24},6.5L0,8.8Z`} fill="none" {...OUT} strokeWidth={2.1} />
      <path d={`M4,0L${L - 6},0`} {...ln(1.2, 0.78)} />
      <path d={`M7,-3.8L${L * 0.6},-3`} {...ln(0.85, 0.42)} />
      <path d={[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map((x) => `M${x},${(7 - x * 0.016).toFixed(1)}l-3.4,-4.4`).join("")} {...ln(0.8, 0.45)} />
      {/* the side ring, the cross, the grip, the pommel */}
      <ellipse cx={4.6} cy={0} rx={3.8} ry={10.4} fill="none" stroke={DARK} strokeWidth={5} />
      <ellipse cx={4.6} cy={0} rx={3.8} ry={10.4} fill="none" stroke={ink.main} strokeWidth={2.2} />
      <path d={limbD([[[0.4, -23], 5], [[-0.4, 0], 6.6], [[0.4, 23], 5]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
      <path d={limbD([[[-2.5, 0], 6.8], [[-25, 0], 5.8]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      <path d={[-7, -12, -17, -22].map((x) => `M${x},-3l1.8,6`).join("")} {...ln(0.9, 0.6)} />
      <circle cx={-30.5} cy={0} r={6} fill={ink.main} {...OUT} strokeWidth={1.9} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CONQUISTADOR
// ---------------------------------------------------------------------------
export type ConqPose = {
  /** the head's yaw (absolute), rad: negative = facing screen left; -1.15 .. -0.45 */
  headYaw: number;
  roll: number;
  pitch: number;
  /** torso lean about the hips, deg (- = forward, toward screen left) */
  lean: number;
  /** the hips drop this many units (the knees give) */
  crouch: number;
  /** his right arm (the sword arm, the shoulder on screen left) and his left arm (toward us) */
  far: ArmPose;
  near: ArmPose;
  /** ankle offsets from the standing place, units */
  footFar: P2;
  footNear: P2;
  /** the heels' lift, deg */
  liftFar: number;
  liftNear: number;
  brow: number;
  lids: number;
  mouth: number;
  /** the sword arm's elbow, from its shoulder (units): given, the arm is not solved (its bones may foreshorten) */
  farElbow?: P2;
};
const C_HIP_Y = -152;
const C_SH_Y = -99;
const C_HEAD_S = 1.08;
const C_K = 1.02;
/** the scabbard's mouth on the near hip, torso-local */
const MOUTH: P2 = [21, -3];
/** the scabbard hanging at rest: the blade's direction, deg (0 = to screen right, 90 = straight down) */
export const SCAB_REST = 74;
export const CONQ_IDLE: ConqPose = {
  headYaw: -0.8,
  roll: 0,
  pitch: -2,
  lean: 0,
  crouch: 0,
  far: { w: [-45, -146], elbow: [-0.3, 1], fist: 0.35, hand: 0 },
  farElbow: [-4, 58],
  near: { w: [30, -150], elbow: [1, 0.3], fist: 0.9, hand: 20 },
  footFar: [0, 0],
  footNear: [0, 0],
  liftFar: 0,
  liftNear: 0,
  brow: 0.3,
  lids: 0,
  mouth: 0,
};
export type ConqRig = ReturnType<typeof conqRig>;
export const conqRig = (q: ConqPose) => {
  const k = C_K;
  const hip: P2 = [0, C_HIP_Y + q.crouch];
  const toFig = (p: P2): P2 => add(hip, rot(p, q.lean));
  const neck = toFig([-4, C_SH_Y - 3]);
  const hc = Math.cos(q.headYaw);
  const hs = Math.sin(q.headYaw);
  const nodF = clamp1(q.pitch / 22) * hc * hc;
  const headAngle = q.lean * 0.5 + q.roll + q.pitch * hs;
  const headC = add(add(neck, rot([0, -(31 - 8 * Math.max(0, nodF)) * (C_HEAD_S / 1.1)], q.lean * 0.7 + q.roll * 0.45 + q.pitch * hs * 0.4)), [5 * hs * C_HEAD_S, 0]);
  const arm = (sgn: number, sh: P2, ap: ArmPose, e?: P2) => {
    const S = toFig(sh);
    const { mid: E, end: W } = e ? { mid: add(S, e), end: ap.w } : ik2(S, ap.w, 60, 56, ap.elbow);
    const f = sub(W, E);
    const dir = rot(vlen(f) > 2 ? norm(f) : [0, 1], ap.hand);
    return { S, E, W, dir, fist: ap.fist, sgn, grip: add(W, mul(dir, 11 * k)) };
  };
  const leg = (hx: number, ax: number, off: P2, lift: number) => {
    const H: P2 = [hx, hip[1] + 2];
    const { mid: K, end: A } = ik2(H, [ax + off[0], -15 + off[1]], 70, 68, [-1.2, 0.02]);
    return { H, K, A, lift };
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
    far: arm(-1, [-33, C_SH_Y + 2], q.far, q.farElbow),
    near: arm(1, [31, C_SH_Y + 3], q.near),
    legFar: leg(-12, -23, q.footFar, q.liftFar),
    legNear: leg(14, 19, q.footNear, q.liftNear),
    /** the scabbard's mouth, figure-local */
    mouth: toFig(MOUTH),
    /** the top of the morion's comb */
    crest: add(headC, rot([0, -63 * C_HEAD_S], headAngle)),
  };
};
/** the arm pose whose fist closes on the point G (figure-local): S = the shoulder, k = the limb scale */
export const holdAt = (S: P2, G: P2, k: number, elbow: P2, hand: number, fist: number, L1 = 60, L2 = 56): ArmPose => {
  let f = norm(sub(G, S));
  let W = G;
  for (let i = 0; i < 6; i++) {
    W = sub(G, mul(rot(f, hand), 11 * k));
    const { mid: E, end } = ik2(S, W, L1, L2, elbow);
    const d = sub(end, E);
    if (vlen(d) > 2) f = norm(d);
  }
  return { w: W, elbow, fist, hand };
};
/** the wrist whose fist closes on G when the elbow is at E (both figure-local) */
export const wristFrom = (E: P2, G: P2, k: number, hand: number): P2 => {
  let f = norm(sub(G, E));
  let W = G;
  for (let i = 0; i < 6; i++) {
    W = sub(G, mul(rot(f, hand), 11 * k));
    const d = sub(W, E);
    if (vlen(d) > 2) f = norm(d);
  }
  return W;
};
/** the sword while it is in (or leaving) the scabbard: `out` units drawn along the scabbard's line */
export const swordInScabbard = (mouth: P2, scab: number, out: number) => ({ g: sub(mouth, mul(dirOf(scab), SWORD.grip + out)), dir: scab });
export const CONQ_K = C_K;

export type ConquistadorProps = {
  pose: ConqPose;
  /** his feet, world px, and px per unit */
  at: P2;
  scale: number;
  uid: string;
  /** the sword: where the fist holds it (figure-local) and the blade's direction, deg */
  sword: { g: P2; dir: number };
  /** the scabbard's direction, deg (it pivots at its mouth) */
  scab: number;
  steel: Steel;
  /** the blade is still in the scabbard: whatever of it is past the mouth is hidden */
  sheathed: boolean;
};
const LEATHER = "#5A503C";
export const Conquistador: React.FC<ConquistadorProps> = ({ pose: q, at, scale, uid, sword, scab, steel, sheathed }) => {
  const r = conqRig(q);
  const k = r.k;
  const st = steelD(steel);
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`;
  const torsoInv = `rotate(${(-q.lean).toFixed(2)}) translate(${(-r.hip[0]).toFixed(2)} ${(-r.hip[1]).toFixed(2)})`;
  const headTf = `translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${C_HEAD_S})`;
  const headInv = `scale(${(1 / C_HEAD_S).toFixed(5)}) rotate(${(-r.headAngle).toFixed(2)}) translate(${(-r.headC[0]).toFixed(2)} ${(-r.headC[1]).toFixed(2)})`;

  type Arm = ConqRig["far"];
  const frame = (ar: Arm) => {
    const dv = sub(ar.E, ar.S);
    const u: P2 = vlen(dv) > 0.5 ? norm(dv) : [0, 1];
    const n: P2 = [-u[1], u[0]];
    return { u, n };
  };
  /** the pauldron's lames over the shoulder: steel */
  const pauldron = (ar: Arm, id: string) => {
    const { u, n } = frame(ar);
    return inked(st, id, "", (ink) => (
      <>
        <path d={limbD([[add(ar.S, add(mul(n, -14 * k), mul(u, 10 * k))), 12 * k], [add(ar.S, mul(u, -2 * k)), 20 * k], [add(ar.S, add(mul(n, 14 * k), mul(u, 10 * k))), 12 * k]])} fill={ink.main} {...OUT} />
        {[4, 11].map((d) => (
          <path key={d} d={`M${P(add(ar.S, add(mul(n, -13 * k), mul(u, (d + 4) * k))))}Q${P(add(ar.S, mul(u, (d - 5) * k)))} ${P(add(ar.S, add(mul(n, 13 * k), mul(u, (d + 4) * k))))}`} {...ln(1.1, 0.7)} />
        ))}
        <path d={braceletD(add(ar.S, mul(n, -12 * k)), add(ar.S, mul(n, 12 * k)), 16 * k, 16 * k, 93 + ar.sgn, 3, 0.6)} {...ln(0.85, 0.42)} />
      </>
    ));
  };
  /** the padded sleeve above the elbow, slashed */
  const upperArm = (ar: Arm) => {
    const { u, n } = frame(ar);
    return (
      <>
        <path d={limbD([[ar.S, 26 * k], [mix2(ar.S, ar.E, 0.45), 27 * k], [ar.E, 21 * k]])} fill={CREAM.deep} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 25 * k, 20 * k, 85 + ar.sgn, 2.9)} {...ln(0.95, 0.62)} />
        <path d={[0.34, 0.56, 0.78].map((v) => `M${P(add(mix2(ar.S, ar.E, v), mul(n, -5 * k)))}l${P(mul(u, 9 * k))}`).join("")} {...ln(1.3, 0.7)} />
      </>
    );
  };
  const foreArm = (ar: Arm) => {
    const fl = vlen(sub(ar.W, ar.E));
    const fu: P2 = fl > 0.5 ? norm(sub(ar.W, ar.E)) : [0, 1];
    const fn: P2 = [-fu[1], fu[0]];
    return (
      <>
        <path d={limbD([[ar.E, 20.5 * k], [mix2(ar.E, ar.W, 0.36), 20 * k], [ar.W, 12.5 * k]])} fill={CREAM.deep} {...OUT} />
        {fl > 14 ? <path d={braceletD(ar.E, ar.W, 20 * k, 12 * k, 87 + ar.sgn, 2.9)} {...ln(0.95, 0.62)} /> : null}
        <path d={[0.2, 0.46].map((v) => `M${P(add(mix2(ar.E, ar.W, v), mul(fn, -4 * k)))}L${P(add(mix2(ar.E, ar.W, v + 0.2), mul(fn, -3.4 * k)))}`).join("")} {...ln(1.3, 0.7)} />
      </>
    );
  };
  const wholeArm = (ar: Arm) => {
    const { u, n } = frame(ar);
    const fl = vlen(sub(ar.W, ar.E));
    return (
      <>
        <path d={limbD(bones(ar.S, ar.E, ar.W, [26, 27, 20, 20, 12.5].map((w) => w * k)))} fill={CREAM.deep} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 25 * k, 20 * k, 85 + ar.sgn, 2.9) + (fl > 14 ? braceletD(ar.E, ar.W, 20 * k, 12 * k, 87 + ar.sgn, 2.9) : "")} {...ln(0.95, 0.62)} />
        <path d={[0.34, 0.56, 0.78].map((v) => `M${P(add(mix2(ar.S, ar.E, v), mul(n, -5 * k)))}l${P(mul(u, 9 * k))}`).join("") + [0.2, 0.46].map((v) => `M${P(add(mix2(ar.E, ar.W, v), mul(n, -4 * k)))}L${P(add(mix2(ar.E, ar.W, v + 0.2), mul(n, -3.4 * k)))}`).join("")} {...ln(1.3, 0.7)} />
      </>
    );
  };

  const drawLeg = (l: ConqRig["legFar"], seed: number) => {
    const calf = mix2(l.K, l.A, 0.34);
    const stn: St[] = [
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
        <path d={limbD(stn)} fill={CREAM.main} {...OUT} />
        <path d={braceletD(l.K, l.A, 17 * k, 11 * k, 81 + seed, 2.9)} {...ln(0.95, 0.62)} />
        <g transform={`translate(${l.A[0].toFixed(2)} ${l.A[1].toFixed(2)}) rotate(${l.lift.toFixed(2)}) scale(${k.toFixed(3)})`}>
          <path d={smoothClosed(SHOE)} fill={CREAM.deep} {...OUT} strokeWidth={2.1} />
          <path d="M8.6,16.8Q-8,14.2 -25.5,16.8" {...ln(1.3, 0.75)} />
          <path d="M6.4,4.6Q-4,9.4 -13.4,7.6" {...ln(1.2, 0.7)} />
          <path d="M-16,9.2l-3,6M-20.4,10.6l-2.6,5" {...ln(0.9, 0.5)} />
        </g>
        {/* the paned trunk hose, a garter under the knee */}
        <path d={limbD([[add(l.H, [0, -8]), 31 * k], [mix2(l.H, l.K, 0.28), 41 * k], [mix2(l.H, l.K, 0.56), 35 * k], [mix2(l.H, l.K, 0.7), 23 * k]])} fill={CREAM.deep} {...OUT} />
        <path d={[-0.34, -0.12, 0.12, 0.34].map((u) => `M${P(add(mix2(l.H, l.K, 0.02), [u * 26 * k, 0]))}Q${P(add(mix2(l.H, l.K, 0.3), [u * 46 * k - 2, 0]))} ${P(add(mix2(l.H, l.K, 0.66), [u * 22 * k, 0]))}`).join("")} {...ln(1.2, 0.7)} />
        <path d={braceletD(mix2(l.H, l.K, 0.05), mix2(l.H, l.K, 0.62), 36 * k, 32 * k, 95 + seed, 3.2, 0.7)} {...ln(0.9, 0.5)} />
        <path d={limbD([[add(g, [-8.4 * k, 0]), 4.8], [add(g, [8.4 * k, 0]), 4.8]])} fill={CREAM.main} {...OUT} strokeWidth={1.7} />
      </g>
    );
  };

  // ---- the steel (torso-local: hips (0, 0), shoulders at y = C_SH_Y); three-quarter, chest to the left
  const CUIR =
    `M-34,${C_SH_Y + 2}Q-27,${C_SH_Y - 7} -17,${C_SH_Y - 5}Q-4,${C_SH_Y + 8} 9,${C_SH_Y - 5}Q22,${C_SH_Y - 8} 34,${C_SH_Y + 2}` +
    `C38,-70 31,-40 27,-12L33,3Q-6,14 -38,4L-34,-10C-46,-30 -47,-62 -41,-84Q-39,-92 -34,${C_SH_Y + 2}Z`;
  const RIDGE = `M-9,${C_SH_Y + 3}C-22,-74 -33,-40 -21,8`;
  const swordAxis = dirOf(sword.dir);
  const guard = add(sword.g, mul(swordAxis, SWORD.grip));
  const scabTf = `translate(${r.mouth[0].toFixed(2)} ${r.mouth[1].toFixed(2)}) rotate(${scab.toFixed(2)})`;
  const SL = SWORD.L + 4;
  const scabU = dirOf(scab);
  const scabN: P2 = [-scabU[1], scabU[0]];

  return (
    <g transform={tf}>
      <Cased id={`${uid}-case`}>
        {/* his sword arm above the elbow passes behind the chest */}
        {upperArm(r.far)}
        {pauldron(r.far, `${uid}-pf`)}
        {/* the scabbard hangs behind his leg and tassets: dark leather, a chape at its tip */}
        <g transform={scabTf}>
          <path d={limbD([[[-1, 0], 14], [[SL * 0.5, 0], 11.4], [[SL, 0], 5.4]])} fill={LEATHER} {...OUT} />
          <path d={`M${SL - 22},-4.2l1.2,8.4M${SL - 11},-3.2l1,6.4`} {...ln(1.2, 0.7)} />
        </g>
        {drawLeg(r.legFar, 0)}
        {drawLeg(r.legNear, 1)}
        <g transform={torsoTf}>
          {/* the tassets: the front one foreshortened, the near one broad */}
          {inked(st, `${uid}-ta`, torsoInv, (ink) => (
            <>
              <path d="M-37,1L-20,6L-19,41L-42,35Z" fill={ink.deep} {...OUT} />
              <path d="M-18,6L33,0L39,35L-16,43Z" fill={ink.deep} {...OUT} />
              <path d="M-39,13L-20,18M-40,24L-19,29M-18,18L35,12M-17,30L37,23" {...ln(1.1, 0.65)} />
              <path d={hatchD(14, 2, 40, 42, 104, 2.8, 48, 0.2)} {...ln(0.85, 0.45)} />
            </>
          ))}
          {/* the cuirass: a peascod breast with its ridge, the waist flange */}
          {inked(st, `${uid}-cu`, torsoInv, (ink, id) => (
            <>
              <clipPath id={`${id}-cuir`}>
                <path d={CUIR} />
              </clipPath>
              <path d={CUIR} fill={ink.main} {...OUT} />
              <g clipPath={`url(#${id}-cuir)`}>
                <path d={hatchD(8, C_SH_Y, 40, 8, 110, 2.8, 44)} {...ln(0.95, 0.6)} />
                <path d={hatchD(18, C_SH_Y + 30, 40, 8, 62, 3.4, 45)} {...ln(0.9, 0.45)} />
                <path d={hatchD(-46, -40, -24, 6, 72, 3, 46, 0.3)} {...ln(0.85, 0.36)} />
                <path d={RIDGE} {...ln(1.5, 0.82)} />
                <path d="M-35,-9Q-6,1 28,-11" {...ln(1.3, 0.75)} />
                <path d={`M33,${C_SH_Y + 30}Q21,${C_SH_Y + 22} 24,${C_SH_Y + 3}`} {...ln(1.1, 0.6)} />
                {/* the rivets of the waist flange */}
                {[-26, -12, 2, 16].map((x) => (
                  <circle key={x} cx={x} cy={-1.5 + (x + 6) * (x + 6) * -0.006} r={1.2} fill={DARK} opacity={0.7} />
                ))}
              </g>
            </>
          ))}
          {/* the baldric (leather): from the far shoulder down to the sword */}
          <clipPath id={`${uid}-bcl`}>
            <path d={CUIR} />
          </clipPath>
          <g clipPath={`url(#${uid}-bcl)`}>
            <path d={`M-27,${C_SH_Y - 4}L-21,${C_SH_Y - 6}L31,-7L27,-1Z`} fill={LEATHER} stroke={DARK} strokeWidth={1.6} strokeLinejoin="round" />
          </g>
          {inked(st, `${uid}-go`, torsoInv, (ink) => (
            <path d={`M-21,${C_SH_Y}Q-5,${C_SH_Y + 17} 14,${C_SH_Y}L10,${C_SH_Y - 10}Q-5,${C_SH_Y + 1} -17,${C_SH_Y - 10}Z`} fill={ink.deep} {...OUT} />
          ))}
        </g>
        {/* the open mouth of the scabbard at his hip; the sword (hidden past the mouth while it is in); the locket */}
        <g transform={scabTf}>
          <ellipse cx={1} cy={0} rx={4.6} ry={9.6} fill={DARK} {...OUT} strokeWidth={1.8} />
        </g>
        <clipPath id={`${uid}-sheath`}>
          <path d={polyD([add(r.mouth, mul(scabN, 300)), add(r.mouth, mul(scabN, -300)), add(add(r.mouth, mul(scabN, -300)), mul(scabU, -500)), add(add(r.mouth, mul(scabN, 300)), mul(scabU, -500))], true)} />
        </clipPath>
        <g clipPath={sheathed ? `url(#${uid}-sheath)` : undefined}>
          <g transform={`translate(${guard[0].toFixed(2)} ${guard[1].toFixed(2)}) rotate(${sword.dir.toFixed(2)})`}>
            {inked(st, `${uid}-sw`, `rotate(${(-sword.dir).toFixed(2)}) translate(${(-guard[0]).toFixed(2)} ${(-guard[1]).toFixed(2)})`, (ink) => (
              <SwordArt ink={ink} />
            ))}
          </g>
        </g>
        <g transform={scabTf}>
          <path d="M1,-10.4L9,-9.6L9,9.6L1,10.4Q4.6,0 1,-10.4Z" fill={LEATHER} {...OUT} strokeWidth={1.9} />
          <path d="M6.4,-9.2l0,18.4" {...ln(1, 0.6)} />
        </g>
        {/* neck and head */}
        <path d={limbD([[add(r.neck, [0, 5]), 20 * k], [mix2(r.neck, add(r.headC, [-7 * r.hs * C_HEAD_S, 0]), 0.78), 16.5 * k]])} fill={CREAM.main} {...OUT} />
        <g transform={headTf}>
          <Head
            kind="conq"
            yaw={q.headYaw}
            nod={Math.max(0, r.nodF)}
            face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }}
            uid={`${uid}-h`}
            ink={CREAM}
            helmet={inked(st, `${uid}-mo`, headInv, (ink, id) => (
              <Morion yaw={q.headYaw} ink={ink} uid={id} />
            ))}
          />
        </g>
        {/* the sword arm below the elbow comes round in front; the fist closes over the grip */}
        {foreArm(r.far)}
        <Hand a={r.far} k={k} ink={CREAM} cuff />
        {wholeArm(r.near)}
        {pauldron(r.near, `${uid}-pn`)}
        <Hand a={r.near} k={k} ink={CREAM} cuff />
      </Cased>
    </g>
  );
};
const SHOE: P2[] = [[6, 1], [-6, 1], [-13, 7.2], [-23, 10.4], [-27.5, 13.6], [-25.5, 16.8], [-8, 17.6], [8.6, 16.8], [10.8, 11], [8.4, 4]];

// ---------------------------------------------------------------------------
// THE WARRIOR'S ARMS
// ---------------------------------------------------------------------------
/** the macuahuitl: a flat oak paddle, a row of obsidian blades set edge-on along BOTH edges, a knob and a
 *  wrist loop. Local: the fist at (0, 0), the paddle along + x. */
export const CLUB = { L: 124 };
const OBSIDIAN = "#070605";
const ClubArt: React.FC<{ ink: Ink; loop: P2 }> = ({ ink, loop }) => {
  const x0 = 40;
  const pitch = 13.2;
  const bl = 10.8;
  const half = (x: number) => mix(7.2, 8.8, c01((x - 30) / 90));
  const blades: string[] = [];
  const facets: string[] = [];
  for (const sd of [-1, 1])
    for (let i = 0; i < 6; i++) {
      const xa = x0 + i * pitch;
      const xb = xa + bl;
      const out = 9.2 + (hash(i, sd + 3) - 0.5) * 1.6;
      const ya = sd * (half(xa) - 1.6);
      const yb = sd * (half(xb) - 1.6);
      blades.push(polyD([[xa, ya], [xb, yb], [xb - 0.5, sd * (half(xb) + out)], [xa + 0.5, sd * (half(xa) + out)]], true));
      facets.push(`M${(xa + 2.2).toFixed(1)},${(sd * (half(xa) + out * 0.62)).toFixed(1)}L${(xa + 5.4).toFixed(1)},${(sd * (half(xa) + out * 0.3)).toFixed(1)}`);
    }
  const BOARD = `M-13,-3.6L18,-4.6L${x0 - 6},-7L${CLUB.L - 4},-8.8Q${CLUB.L + 1},-8.6 ${CLUB.L + 1},-4L${CLUB.L + 1},4Q${CLUB.L + 1},8.6 ${CLUB.L - 4},8.8L${x0 - 6},7L18,4.6L-13,3.6Z`;
  return (
    <g>
      {/* the wrist loop */}
      <path d={`M-15,0Q${P([loop[0] * 0.5 - 8, loop[1] * 0.5 + 9])} ${P(loop)}`} fill="none" stroke={DARK} strokeWidth={4} strokeLinecap="round" />
      <path d={`M-15,0Q${P([loop[0] * 0.5 - 8, loop[1] * 0.5 + 9])} ${P(loop)}`} fill="none" stroke={ink.main} strokeWidth={1.7} strokeLinecap="round" />
      {/* obsidian: black glass, a cream rim where it is knapped, one glint along each blade */}
      <path d={blades.join("")} fill={OBSIDIAN} stroke={ink.main} strokeWidth={2.6} strokeLinejoin="round" />
      <path d={blades.join("")} fill={OBSIDIAN} />
      <path d={facets.join("")} fill="none" stroke={ink.main} strokeWidth={1.5} strokeLinecap="round" />
      <path d={BOARD} fill={ink.deep} {...OUT} strokeWidth={2.1} />
      {/* the grain of the oak, the groove the blades sit in */}
      <path d={`M${x0 - 4},-3.4L${CLUB.L - 5},-4.2M${x0 - 8},0.4L${CLUB.L - 3},0.6M${x0 - 4},3.6L${CLUB.L - 5},4.5M22,-1.4L${x0 - 12},-1.8M22,1.8L${x0 - 12},2.2`} {...ln(0.85, 0.5)} />
      <path d={`M${x0 - 2},-6.2L${CLUB.L - 5},-7.6M${x0 - 2},6.2L${CLUB.L - 5},7.6`} {...ln(1, 0.6)} />
      <circle cx={-15.5} cy={0} r={5.2} fill={ink.main} {...OUT} strokeWidth={1.9} />
    </g>
  );
};
/** the chimalli: a round shield turned a little away, a bound rim, down balls on its field, a fringe of
 *  feathers hanging from its lower rim. Local: its middle at (0, 0). */
export const SHIELD = { R: 39, fs: 0.8 };
const ShieldArt: React.FC<{ ink: Ink; uid: string; sway: number }> = ({ ink, uid, sway }) => {
  const R = SHIELD.R;
  const rx = R * SHIELD.fs;
  const N = 11;
  const feathers = Array.from({ length: N }, (_, i) => {
    const a = ((22 + (136 * i) / (N - 1)) * Math.PI) / 180;
    const base: P2 = [rx * 0.96 * Math.cos(a), R * 0.96 * Math.sin(a)];
    const L = 19 + 9 * Math.sin(a) + 3 * hash(i, 17);
    const d = norm([Math.cos(a) * 0.42 + sway * 0.035 * (0.6 + 0.4 * Math.sin(a)), 1]);
    const tip = add(base, mul(d, L));
    return { base, tip, d, i };
  });
  return (
    <g>
      {feathers.map(({ base, tip, d, i }) => (
        <g key={i}>
          <path d={limbD([[add(base, mul(d, -5)), 5.4], [mix2(base, tip, 0.55), 7], [tip, 2.6]])} fill={i % 2 ? ink.deep : ink.main} {...OUT} strokeWidth={1.7} />
          <path d={`M${P(base)}L${P(mix2(base, tip, 0.86))}`} {...ln(0.85, 0.55)} />
        </g>
      ))}
      <clipPath id={`${uid}-disc`}>
        <ellipse cx={0} cy={0} rx={rx} ry={R} />
      </clipPath>
      <ellipse cx={0} cy={0} rx={rx} ry={R} fill={ink.main} {...OUT} strokeWidth={2.4} />
      <g clipPath={`url(#${uid}-disc)`}>
        <path d={hatchD(rx * 0.15, -R, rx, R, 112, 2.7, 61)} {...ln(0.95, 0.55)} />
        <path d={hatchD(rx * 0.5, -R * 0.2, rx, R, 62, 3.3, 62)} {...ln(0.85, 0.42)} />
        <ellipse cx={0} cy={0} rx={rx * 0.84} ry={R * 0.84} {...ln(1.5, 0.82)} />
        <ellipse cx={0} cy={0} rx={rx * 0.76} ry={R * 0.76} {...ln(0.9, 0.5)} />
        {/* the binding of the rim */}
        <path
          d={Array.from({ length: 26 }, (_, i) => {
            const a = (i / 26) * 2 * Math.PI;
            return `M${P([rx * 0.86 * Math.cos(a), R * 0.86 * Math.sin(a)])}L${P([rx * 0.98 * Math.cos(a + 0.05), R * 0.98 * Math.sin(a + 0.05)])}`;
          }).join("")}
          {...ln(0.9, 0.55)}
        />
      </g>
      {/* the down balls: four round the field and one in the middle */}
      {([[0, 0], [-0.44, -0.4], [0.44, -0.4], [-0.44, 0.4], [0.44, 0.4]] as P2[]).map(([u, v], i) => (
        <g key={i}>
          <ellipse cx={u * rx} cy={v * R} rx={6.2 * SHIELD.fs} ry={6.2} fill={ink.deep} {...OUT} strokeWidth={1.7} />
          <ellipse cx={u * rx} cy={v * R} rx={2 * SHIELD.fs} ry={2} fill={DARK} opacity={0.7} />
        </g>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE WARRIOR
// ---------------------------------------------------------------------------
export type WarPose = {
  /** the head's yaw (absolute), rad: positive = facing screen right; 0.45 .. 1.15 */
  headYaw: number;
  roll: number;
  pitch: number;
  /** torso lean about the hips, deg (+ = forward, toward screen right) */
  lean: number;
  crouch: number;
  /** his left arm (the shield arm, the shoulder on screen right) and his right arm (toward us; the macuahuitl) */
  far: ArmPose;
  near: ArmPose;
  footFar: P2;
  footNear: P2;
  liftFar: number;
  liftNear: number;
  brow: number;
  lids: number;
  mouth: number;
  /** the loincloth ends and the shield's fringe swung this many units to screen right */
  hem: number;
  /** the macuahuitl's direction, deg (0 = to screen right, -90 = straight up) and the shield's tilt, deg */
  club: number;
  shield: number;
};
const W_HIP_Y = -150;
const W_SH_Y = -95;
const W_HEAD_S = 1.07;
const W_K = 0.98;
export const WAR_K = W_K;
/** standing ready: the shield low before him, the macuahuitl upright before him */
export const WAR_READY: WarPose = {
  headYaw: 0.84,
  roll: 0,
  pitch: -1,
  lean: 1,
  crouch: 2,
  far: { w: [25, -150], elbow: [-0.5, 1], fist: 1, hand: 0 },
  near: { w: [38, -204], elbow: [0, 1], fist: 1, hand: 0 },
  footFar: [6, 0],
  footNear: [-12, 0],
  liftFar: 0,
  liftNear: 0,
  brow: 0.45,
  lids: 0,
  mouth: -0.2,
  hem: 0,
  club: -82,
  shield: -6,
};
export type WarRig = ReturnType<typeof warRig>;
export const warRig = (q: WarPose) => {
  const k = W_K;
  const hip: P2 = [0, W_HIP_Y + q.crouch];
  const toFig = (p: P2): P2 => add(hip, rot(p, q.lean));
  const neck = toFig([4, W_SH_Y - 3]);
  const hc = Math.cos(q.headYaw);
  const hs = Math.sin(q.headYaw);
  const nodF = clamp1(q.pitch / 22) * hc * hc;
  const headAngle = q.lean * 0.5 + q.roll + q.pitch * hs;
  const headC = add(add(neck, rot([0, -(31 - 8 * Math.max(0, nodF)) * (W_HEAD_S / 1.1)], q.lean * 0.7 + q.roll * 0.45 + q.pitch * hs * 0.4)), [5 * hs * W_HEAD_S, 0]);
  const arm = (sgn: number, sh: P2, ap: ArmPose) => {
    const S = toFig(sh);
    const { mid: E, end: W } = ik2(S, ap.w, 59, 56, ap.elbow);
    const f = sub(W, E);
    const dir = rot(vlen(f) > 2 ? norm(f) : [0, 1], ap.hand);
    return { S, E, W, dir, fist: ap.fist, sgn, grip: add(W, mul(dir, 11 * k)) };
  };
  const leg = (hx: number, ax: number, off: P2, lift: number) => {
    const H: P2 = [hx, hip[1] + 2];
    const { mid: K, end: A } = ik2(H, [ax + off[0], -15 + off[1]], 70, 68, [1.2, 0.02]);
    return { H, K, A, lift };
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
    far: arm(1, [31, W_SH_Y + 2], q.far),
    near: arm(-1, [-30, W_SH_Y + 3], q.near),
    legFar: leg(11, 25, q.footFar, q.liftFar),
    legNear: leg(-13, -19, q.footNear, q.liftNear),
    topknot: add(headC, rot([-5 * hs * W_HEAD_S, -57 * W_HEAD_S], headAngle)),
  };
};
const SANDAL: P2[] = [[-6, 1], [6, 1], [14, 7.4], [24.5, 10.6], [28.5, 13.6], [26.5, 16.8], [8, 17.6], [-8.5, 16.8], [-10.6, 11], [-8.4, 4]];

export type WarriorProps = { pose: WarPose; at: P2; scale: number; uid: string };
export const Warrior: React.FC<WarriorProps> = ({ pose: q, at, scale, uid }) => {
  const r = warRig(q);
  const k = r.k;
  const ink = CREAM;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`;
  type Arm = WarRig["far"];
  const drawArm = (ar: Arm) => {
    const fl = vlen(sub(ar.W, ar.E));
    const ul = vlen(sub(ar.E, ar.S));
    const dv = sub(ar.E, ar.S);
    const u: P2 = vlen(dv) > 0.5 ? norm(dv) : [0, 1];
    const n: P2 = [-u[1], u[0]];
    const cb = mix2(ar.S, ar.E, 0.56);
    return (
      <>
        <path d={limbD(bones(ar.S, ar.E, ar.W, [21, 20.5, 15.5, 16.5, 11].map((w) => w * k)))} fill={ink.main} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 20 * k, 15 * k, 85 + ar.sgn, 2.9) + (fl > 14 ? braceletD(ar.E, ar.W, 16 * k, 11 * k, 87 + ar.sgn, 2.9) : "")} {...ln(0.95, 0.62)} />
        {ul > 30 ? <path d={limbD([[add(cb, mul(n, -8.8 * k)), 5.8], [add(cb, mul(n, 8.8 * k)), 5.8]])} fill={ink.deep} {...OUT} strokeWidth={1.9} /> : null}
      </>
    );
  };
  const drawLeg = (l: WarRig["legFar"], seed: number) => {
    const calf = mix2(l.K, l.A, 0.34);
    const stn: St[] = [
      [l.H, 23 * k],
      [mix2(l.H, l.K, 0.5), 20.5 * k],
      [l.K, 15.5 * k],
      [[calf[0] - 2.4 * k, calf[1]], 18 * k],
      [mix2(l.K, l.A, 0.82), 11.5 * k],
      [l.A, 10.5 * k],
    ];
    return (
      <g key={seed}>
        <path d={limbD(stn)} fill={ink.main} {...OUT} />
        <path d={braceletD(l.H, l.K, 21 * k, 15 * k, 79 + seed, 3.1, 0.8)} {...ln(0.9, 0.5)} />
        <path d={braceletD(l.K, l.A, 17 * k, 11 * k, 81 + seed, 2.9)} {...ln(0.95, 0.62)} />
        <path d={`M${P([l.K[0] - 5, l.K[1] + 1])}Q${P([l.K[0] + 2, l.K[1] + 5])} ${P([l.K[0] + 5, l.K[1] + 1])}`} {...ln(1, 0.5)} />
        {/* the sandal: sole, straps, heel-piece, ankle tie */}
        <g transform={`translate(${l.A[0].toFixed(2)} ${l.A[1].toFixed(2)}) rotate(${l.lift.toFixed(2)}) scale(${k.toFixed(3)})`}>
          <path d={smoothClosed(SANDAL)} fill={ink.main} {...OUT} strokeWidth={2.1} />
          <path d={`M${P(SANDAL[7])}Q${P([SANDAL[6][0], SANDAL[6][1] - 3.4])} ${P(SANDAL[5])}`} {...ln(1.3, 0.75)} />
          <path d="M-6.4,3.4L21.3,11.6L6.4,3.4" {...ln(1.7, 0.85)} />
          <path d="M-10.8,9.6L-3.4,3L-2.2,14.4L-9.4,14.6Z" fill={ink.deep} {...OUT} strokeWidth={1.7} />
          <path d="M-6.6,-1.5h13.2M-6.4,2.4h12.8" {...ln(1.5, 0.85)} />
        </g>
      </g>
    );
  };
  // ---- the ichcahuipilli (torso-local: hips (0, 0), shoulders at y = W_SH_Y); three-quarter, chest to the right
  const S = W_SH_Y;
  const HEM = 47;
  const VEST =
    `M-34,${S + 1}Q-26,${S - 8} -14,${S - 6}Q-3,${S + 16} 9,${S + 19}Q15,${S + 6} 20,${S - 6}Q28,${S - 8} 35,${S + 2}` +
    `C43,${S + 22} 42,-40 40,-8L46,${HEM - 3}Q4,${HEM + 10} -41,${HEM - 2}L-34,-6C-32,-36 -38,${S + 26} -34,${S + 1}Z`;
  // the quilting: a lattice of diamonds; each line bows a little with the padding
  const lattice = [...hatchSegs(-48, S - 10, 50, HEM + 12, 60, 13.2, 501, 0), ...hatchSegs(-48, S - 10, 50, HEM + 12, -60, 13.2, 502, 0)];
  const sw = q.hem;
  const flap = (x: number, top: number, len: number, w: number, s: number): string => {
    const a: P2 = [x - w / 2, top];
    const b: P2 = [x + w / 2, top];
    const c: P2 = [x + w / 2 + 2 + sw * s, top + len];
    const d: P2 = [x - w / 2 - 1 + sw * s, top + len + 2];
    return `M${P(a)}L${P(b)}Q${P([b[0] + 2 + sw * s * 0.4, top + len * 0.5])} ${P(c)}L${P(d)}Q${P([a[0] - 1 + sw * s * 0.4, top + len * 0.5])} ${P(a)}Z`;
  };
  const tie = (x: number, y: number, i: number) => (
    <g key={i} transform={`translate(${x} ${y})`}>
      <path d="M0,0l-9.5,-4.4q-4,3 -0.8,7ZM0,0l9,-3.6q3.8,3.6 0.2,7.2Z" fill={ink.main} {...OUT} strokeWidth={1.6} />
      <path d={limbD([[[0, 0], 3.4], [[-2.6, 7], 3], [[-1.8, 13], 2]])} fill={ink.main} {...OUT} strokeWidth={1.5} />
      <path d={limbD([[[0, 0], 3.4], [[3.4, 6.4], 3], [[5.6, 11.6], 2]])} fill={ink.main} {...OUT} strokeWidth={1.5} />
      <circle cx={0} cy={0} r={2.7} fill={ink.deep} {...OUT} strokeWidth={1.5} />
    </g>
  );
  const clubAxis = dirOf(q.club);
  // the loop runs from the knob to his wrist, in the club's own frame
  const loopFig = sub(r.near.W, r.near.grip);
  const loop: P2 = [loopFig[0] * clubAxis[0] + loopFig[1] * clubAxis[1], -loopFig[0] * clubAxis[1] + loopFig[1] * clubAxis[0]];
  return (
    <g transform={tf}>
      <Cased id={`${uid}-case`}>
        {drawArm(r.far)}
        {drawLeg(r.legNear, 1)}
        {drawLeg(r.legFar, 0)}
        <g transform={torsoTf}>
          {/* the loincloth's ends: one behind, one before */}
          <path d={flap(-9, HEM - 12, 36, 13, 0.7)} fill={ink.deep} {...OUT} strokeWidth={2} />
          <path d={flap(10, HEM - 10, 46, 17, 1)} fill={ink.main} {...OUT} strokeWidth={2} />
          <path d={`M${P([4 + sw * 0.75, HEM + 27])}L${P([20 + sw * 0.75, HEM + 26])}M${P([3.6 + sw * 0.85, HEM + 31])}L${P([20.6 + sw * 0.85, HEM + 30])}`} {...ln(1.2, 0.75)} />
          <path d={[0, 1, 2, 3, 4].map((i) => `M${P([3.6 + i * 4.2 + sw, HEM + 34])}l0,3.6`).join("")} {...ln(1, 0.6)} />
          <path d={`M${P([9, HEM])}Q${P([11 + sw * 0.4, HEM + 14])} ${P([10 + sw * 0.7, HEM + 26])}`} {...ln(0.9, 0.5)} />
          <clipPath id={`${uid}-vest`}>
            <path d={VEST} />
          </clipPath>
          <path d={VEST} fill={ink.main} {...OUT} />
          <g clipPath={`url(#${uid}-vest)`}>
            <path d={segD(lattice)} {...ln(1.25, 0.62)} />
            {/* the shade of the padded form: under the chest, down the side away from the light */}
            <path d={hatchD(14, S + 4, 48, HEM + 8, 108, 2.9, 51)} {...ln(0.9, 0.5)} />
            <path d={hatchD(26, S + 30, 48, HEM + 8, 62, 3.5, 52)} {...ln(0.85, 0.4)} />
            <path d={hatchD(-42, HEM - 16, 48, HEM + 8, 96, 2.6, 53, 0.35)} {...ln(0.85, 0.36)} />
            {/* the bound edges: neck, hem, the opening down the chest */}
            <path d={`M-18,${S - 3}Q-4,${S + 20} 9,${S + 24}Q18,${S + 9} 23,${S - 3}`} {...ln(1.3, 0.78)} />
            <path d={`M-40,${HEM - 8}Q4,${HEM + 4} 46,${HEM - 9}`} {...ln(1.5, 0.82)} />
            <path d={`M-40,${HEM - 12.4}Q4,${HEM - 0.4} 46,${HEM - 13.4}`} {...ln(0.9, 0.5)} />
            <path d={`M9,${S + 20}Q13,-30 12,${HEM + 4}`} {...ln(1.6, 0.85)} />
            <path d={`M12.6,${S + 24}Q16.6,-30 15.6,${HEM + 4}`} {...ln(0.9, 0.45)} />
            {/* the near armhole */}
            <path d={`M-30,${S + 2}Q-17,${S + 10} -20,${S + 30}Q-26,${S + 38} -35,${S + 34}`} {...ln(1.3, 0.75)} />
          </g>
          {[S + 32, S + 54, S + 76].map((y, i) => tie(10.5 + i * 0.9, y, i))}
        </g>
        {/* neck and head */}
        <path d={limbD([[add(r.neck, [0, 5]), 20 * k], [mix2(r.neck, add(r.headC, [-7 * r.hs * W_HEAD_S, 0]), 0.78), 16.5 * k]])} fill={ink.main} {...OUT} />
        <path d={braceletD(add(r.neck, [0, 4]), mix2(r.neck, r.headC, 0.5), 20 * k, 17 * k, 89, 2.4)} {...ln(0.9, 0.6)} />
        <g transform={`translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${W_HEAD_S})`}>
          <Head kind="warrior" yaw={q.headYaw} nod={Math.max(0, r.nodF)} face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }} uid={`${uid}-h`} ink={ink} />
        </g>
        {/* the shield on his far arm, held before him */}
        <g transform={`translate(${r.far.grip[0].toFixed(2)} ${r.far.grip[1].toFixed(2)}) rotate(${q.shield.toFixed(2)})`}>
          <ShieldArt ink={ink} uid={`${uid}-sh`} sway={sw} />
        </g>
        {/* the near arm, the macuahuitl through its fist */}
        {drawArm(r.near)}
        <g transform={`translate(${r.near.grip[0].toFixed(2)} ${r.near.grip[1].toFixed(2)}) rotate(${q.club.toFixed(2)})`}>
          <ClubArt ink={ink} loop={loop} />
        </g>
        <Hand a={r.near} k={k} ink={ink} cuff={false} />
      </Cased>
    </g>
  );
};
