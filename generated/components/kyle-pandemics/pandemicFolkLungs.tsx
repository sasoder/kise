// ---------------------------------------------------------------------------
// pandemicFolkLungs — the lungs inside the see-through Worker of LurksInYourChest (kyle-pandemics, cut 32), in the
// drawn cast's gouache hand (V3 take 2, style A). A folk copy of lurksAnatomy.tsx (whose exports and look are
// untouched): the SAME geometry, timing and state (ChestState: breath, waste, nodules, specks, spread; the same lungs,
// fissures, bronchial tree, nodules, patches and cavities, in that file's torso-local units), placed on the folk
// Worker's torso through pandemicFolkWorker.workerBodyProjector, and restyled:
//   - the lungs are GLASS: a faint cream fill, one soft shade crescent, a light contour (a soft cream band and a fine
//     line), fine light fissures and bronchi, the windpipe a pale band — the room and his back show through them;
//   - the disease is the ONLY opaque thing inside him, in orange gouache: flat #FFB000 shapes with one soft deeper
//     #D98A0C shade each (no dark casings), the cavities warm dark hollows with a deep-orange rim.
// Draw it as the Worker's `inside` (FolkWorker see > 0): it is then in the Worker's figure units and under the same
// gouache texture filter as the man.
//   <FolkChestAnatomy pose st uid />   pose = the Worker's pose (so the lungs turn, breathe, slump and roll with him)
//   LUNG_MAP {SX, SY, YA}               lurksAnatomy torso-local -> the folk Worker's body-local units
// ---------------------------------------------------------------------------
import React from "react";
import { hash } from "../kits/maps/incaShared";
import type { ChestState } from "./lurksAnatomy";
import { workerBodyProjector, type WorkerPose } from "./pandemicFolkWorker";

export type { ChestState };
type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const PP = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;

const ORANGE = "#FFB000";
const ORANGE_DEEP = "#D98A0C";
const ORANGE_LIT = "#FFC94D";
const HOLLOW = "#4A2E1C";
const GLASS = { fill: "#EFE6D3", fillA: 0.13, shade: "#22302E", shadeA: 0.14, line: "#F3EBDD" };

/** lurksAnatomy's torso-local units (a 310-unit man, hips at 0; apex Y -101.5, base -36.5) -> the folk Worker's
 *  body-local units: the lungs fill his chest from just above the shoulder line (y -376) to the waist tie (-262) */
export const LUNG_MAP = { SX: 1.55, SY: 1.72, YA: -376 };
const mkProj = (pose: WorkerPose) => {
  const B = workerBodyProjector(pose);
  const { SX, SY, YA } = LUNG_MAP;
  const w = (X: number, Y: number, Z: number): P2 => B.w([X * SX, YA + (Y + 101.5) * SY, Z * SX]);
  const dep = (X: number, Z: number) => Z * B.cs - X * B.sn;
  return { w, dep, c: B.cs, s: B.sn, k: SX };
};
type Proj = ReturnType<typeof mkProj>;

const smoothD = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${PP(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${PP([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${PP([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${PP(p2)}`;
  }
  return `${d}Z`;
};
const lineD = (pts: P2[]) => (pts.length ? `M${pts.map(PP).join("L")}` : "");

// ---------------------------------------------------------------------------
// THE LUNGS (horizontal slices: each a cross-section ellipse; the outline is the slices' projected envelope)
// ---------------------------------------------------------------------------
type LungDef = { sg: -1 | 1; Y0: number; Yb: number };
// his right lung (X < 0): three lobes; his left (X > 0): two, the cardiac notch
const LUNGS: LungDef[] = [
  { sg: -1, Y0: -101.5, Yb: -38.5 },
  { sg: 1, Y0: -101, Yb: -36.5 },
];
const lungSlice = (L: LungDef, t0: number, st: ChestState) => {
  const t = c01(t0);
  // lateral edge: a dome at the apex, out to the ribs, in again a little at the base
  const lat0 = 6 + 32.5 * Math.pow(Math.sin(Math.min(1, t / 0.62) * (Math.PI / 2)), 0.62) - 4.5 * Math.pow(c01((t - 0.86) / 0.14), 2);
  // medial edge: the apex rounds in from 17, the mediastinum at ~6.5, the base dome rising medially from t 0.62
  let med = mix(16.5, 6.5, Math.pow(c01(t / 0.22), 0.55));
  if (L.sg === 1) {
    // the cardiac notch (t 0.5..0.82), the lingula below it
    const nt = c01((t - 0.5) / 0.3);
    med += 11 * Math.sin(Math.PI * nt) * (nt < 1 ? 1 : 0) + (t > 0.8 ? 4 : 0) * c01((t - 0.8) / 0.05);
  }
  // V2: a broad, rounded base on the diaphragm (not a pointed leaf): the medial edge swings out late and only part way
  const dome = c01((t - 0.72) / 0.28);
  med = mix(med, lat0 * 0.55, Math.pow(dome, 1.6));
  const narrow = 1 - 0.07 * st.waste;
  const lat = lat0 * narrow * (1 + 0.02 * st.breath);
  const md = med * (1 - 0.03 * st.waste);
  const cx = (lat + md) / 2;
  const a = Math.max(0.3, (lat - md) / 2);
  const b = Math.max(0.3, a * 0.95 + 4 * Math.sin(Math.PI * Math.min(1, t * 1.3)));
  return { X: L.sg * cx, a, b, Z: -3 };
};
/** the lung's height at t (the apex comes down as the upper lobe retracts; the base drops with the breath) */
const lungY = (L: LungDef, t: number, st: ChestState) => {
  const y0 = L.Y0 + 3 * st.waste;
  const yb = L.Yb + 1.6 * st.breath;
  return mix(y0, yb, t);
};
const lungOutline = (pr: Proj, L: LungDef, st: ChestState): P2[] => {
  const N = 30;
  const left: P2[] = [];
  const right: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const sl = lungSlice(L, t, st);
    const Y = lungY(L, t, st);
    // the projected x range of the slice ellipse: centre +- sqrt(a^2 c^2 + b^2 s^2)
    const half = Math.sqrt(sl.a * sl.a * pr.c * pr.c + sl.b * sl.b * pr.s * pr.s);
    const xc = sl.X * pr.c + sl.Z * pr.s;
    // back to torso-local X at Z 0 for pr.w: x' = X c  ->  X = x' / c
    left.push(pr.w((xc - half) / pr.c, Y, 0));
    right.push(pr.w((xc + half) / pr.c, Y, 0));
  }
  return [...left, ...right.reverse()];
};
/** a point on the lung's front surface at front-view (X, Y): for the fissures, the airways and the disease */
const onLung = (pr: Proj, X: number, Y: number, zf = 4) => pr.w(X, Y, zf);
/** a front-view point of a lung (its X, its height fraction t) scaled with the state: so the disease rides the breath */
const lungPt = (pr: Proj, L: LungDef, st: ChestState, u: number, t: number, zf = 4) => {
  // u 0 = medial edge, 1 = lateral edge at that height
  const sl = lungSlice(L, t, st);
  const X = L.sg * (Math.abs(sl.X) - sl.a + 2 * sl.a * u);
  return onLung(pr, X, lungY(L, t, st), zf);
};

// fissures as (u, t) polylines on the lung
const FISSURES: Record<string, { L: 0 | 1; pts: [number, number][] }[]> = {
  oblique: [
    { L: 0, pts: [[1, 0.5], [0.8, 0.62], [0.55, 0.75], [0.3, 0.88], [0.12, 0.97]] },
    { L: 1, pts: [[1, 0.36], [0.82, 0.5], [0.6, 0.66], [0.38, 0.82], [0.2, 0.95]] },
  ],
  horizontal: [{ L: 0, pts: [[1, 0.43], [0.7, 0.43], [0.4, 0.44], [0.1, 0.45]] }],
};
/** the oblique fissure's height t at u (its points run lateral -> medial, u descending) */
const fissureT = (li: 0 | 1, u: number) => {
  const f = FISSURES.oblique.find((q) => q.L === li)!.pts;
  if (u >= f[0][0]) return f[0][1];
  for (let j = 1; j < f.length; j++) {
    if (u >= f[j][0]) {
      const k = (u - f[j][0]) / (f[j - 1][0] - f[j][0]);
      return f[j][1] + (f[j - 1][1] - f[j][1]) * k;
    }
  }
  return f[f.length - 1][1];
};
/** (folk V3 take 2, director: "a dead-straight edge reads as a liquid level") the spread's lower limit: an irregular,
 *  lobed front — two fingers reaching down along the lower bronchi, a ragged line between — never above the oblique
 *  fissure and never below t 0.63 (the caption band) */
const FINGERS: Record<0 | 1, [number, number][]> = {
  0: [
    [0.27, 0.12],
    [0.64, 0.09],
  ],
  1: [
    [0.36, 0.1],
    [0.74, 0.07],
  ],
};
export const spreadLimit = (li: 0 | 1, u: number) => {
  let t = 0.5 + 0.034 * Math.sin(u * 23 + li * 3) + 0.02 * Math.sin(u * 57 + li) + 0.012 * Math.sin(u * 131 + li * 5);
  for (const [uc, d] of FINGERS[li]) t += d * Math.exp(-Math.pow((u - uc) / 0.075, 2));
  return Math.min(0.63, fissureT(li, u), t);
};
/** the upper + middle lobes above the spread's lobed lower limit, as a region (extended a little outside the lung:
 *  the lung outline clips it too) */
const upperRegion = (pr: Proj, L: LungDef, li: 0 | 1, st: ChestState): P2[] => {
  const pts: P2[] = [];
  pts.push(lungPt(pr, L, st, 0.5, -0.1));
  pts.push(lungPt(pr, L, st, 1.3, -0.05));
  for (let i = 0; i <= 64; i++) {
    const u = 1.3 - (1.7 * i) / 64;
    pts.push(lungPt(pr, L, st, u, spreadLimit(li, Math.max(0, Math.min(1, u)))));
  }
  pts.push(lungPt(pr, L, st, -0.4, -0.05));
  return pts;
};
/** small separate tubercles seeded below the front along the lower bronchi: they appear late in the spread */
const SATELLITES: { lung: 0 | 1; u: number; t: number; R: number; at: number; seed: number }[] = [
  { lung: 0, u: 0.18, t: 0.57, R: 2.2, at: 0.62, seed: 401 },
  { lung: 0, u: 0.44, t: 0.6, R: 1.8, at: 0.72, seed: 403 },
  { lung: 0, u: 0.82, t: 0.56, R: 2.4, at: 0.66, seed: 405 },
  { lung: 0, u: 0.58, t: 0.62, R: 1.5, at: 0.84, seed: 407 },
  { lung: 1, u: 0.24, t: 0.58, R: 2.0, at: 0.64, seed: 409 },
  { lung: 1, u: 0.55, t: 0.6, R: 2.3, at: 0.7, seed: 411 },
  { lung: 1, u: 0.86, t: 0.55, R: 1.7, at: 0.78, seed: 413 },
];

// ---------------------------------------------------------------------------
// THE AIRWAYS: trachea, bronchi, a bronchial tree (front-view X, Y; drawn on the lung's mid-depth)
// ---------------------------------------------------------------------------
type Br = { a: P2; b: P2; w: number; lung: 0 | 1 };
const CARINA: P2 = [0, -81];
const LOBAR: { from: P2; to: P2; lung: 0 | 1; ang: number }[] = [
  { from: [-11, -75.5], to: [-19, -91], lung: 0, ang: -1 },
  { from: [-11, -75.5], to: [-23.5, -66], lung: 0, ang: 0 },
  { from: [-11, -75.5], to: [-18, -53], lung: 0, ang: 1 },
  { from: [12.5, -77], to: [20.5, -91], lung: 1, ang: -1 },
  { from: [12.5, -77], to: [21, -65], lung: 1, ang: 0 },
  { from: [12.5, -77], to: [23, -52], lung: 1, ang: 1 },
];
const BRANCHES: Br[] = (() => {
  const out: Br[] = [];
  out.push({ a: CARINA, b: [-11, -75.5], w: 4.4, lung: 0 });
  out.push({ a: CARINA, b: [12.5, -77], w: 4.2, lung: 1 });
  const grow = (a: P2, b: P2, w: number, lung: 0 | 1, depth: number, seed: number) => {
    out.push({ a, b, w, lung });
    if (depth >= 3) return;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    for (const side of [-1, 1]) {
      const sp = (0.42 + 0.22 * hash(seed, side + 3)) * side;
      const L2 = len * (0.62 + 0.12 * hash(seed, side + 9));
      const nb: P2 = [b[0] + L2 * Math.cos(ang + sp), b[1] + L2 * Math.sin(ang + sp)];
      grow(b, nb, w * 0.66, lung, depth + 1, seed * 7 + side + 11);
    }
  };
  LOBAR.forEach((lb, i) => grow(lb.from, lb.to, 2.9, lb.lung, 1, 31 + i * 13));
  return out;
})();
/** the speck routes: trachea top -> carina -> main bronchus -> the upper lobe bronchus -> the nodule */
const NODULES: { lung: 0 | 1; u: number; t: number; r: number; via: P2 }[] = [
  // (rev 3) about twice the size: clear nodules at 270 px, still only in the apices
  { lung: 0, u: 0.58, t: 0.21, r: 6.4, via: [-19, -91] },
  { lung: 1, u: 0.5, t: 0.18, r: 6.0, via: [20.5, -91] },
  { lung: 1, u: 0.74, t: 0.31, r: 5.0, via: [20.5, -91] },
];
export const N_NODULES = NODULES.length;

// ---------------------------------------------------------------------------
// THE DISEASE: spread fields (fixed per seed: crisp, organic, monotonic)
// ---------------------------------------------------------------------------
/** the (u, t) distance in "lung units" between two points (u spans ~32 units, t ~64) */
const dUT = (u0: number, t0: number, u1: number, t1: number) => Math.hypot((u0 - u1) * 30, (t0 - t1) * 64);
/** the front reaches distance R(spread) from its nodule */
const frontR = (spread: number, ni: number) => (spread <= 0 ? 0 : 2.5 + 30 * Math.pow(spread, 1.05) * (ni === 2 ? 0.9 : 1));
/** cavities: eroded hollows, one at each nodule and two more the front opens as it passes */
const CAVITIES: { lung: 0 | 1; u: number; t: number; R: number; seed: number; ni: number }[] = [
  // (rev 3) five larger, dark-rimmed hollows: one eaten out of each tubercle, two more where the front passes
  { lung: 0, u: 0.58, t: 0.22, R: 7.4, seed: 3, ni: 0 },
  { lung: 1, u: 0.5, t: 0.19, R: 7.0, seed: 5, ni: 1 },
  { lung: 1, u: 0.74, t: 0.32, R: 5.6, seed: 7, ni: 2 },
  { lung: 0, u: 0.42, t: 0.42, R: 5.2, seed: 9, ni: 0 },
  { lung: 1, u: 0.42, t: 0.46, R: 4.6, seed: 11, ni: 1 },
];
/** (rev 3) irregular patches of different sizes over the upper + middle lobes (jittered grid), crisp ragged edges */
const PATCHES = (() => {
  const out: { lung: 0 | 1; u: number; t: number; R: number; seed: number }[] = [];
  for (const lung of [0, 1] as const) {
    let n = 0;
    for (let gi = 0; gi < 4; gi++) {
      for (let gj = 0; gj < 5; gj++, n++) {
        if (hash(n, 131 + lung) < 0.3) continue;
        const u = (gi + 0.2 + 0.6 * hash(n, 137 + lung)) / 4;
        const t = 0.06 + ((gj + 0.2 + 0.6 * hash(n, 139 + lung)) / 5) * 0.5;
        out.push({ lung, u, t, R: 1.6 + 4.2 * Math.pow(hash(n, 149 + lung), 1.6), seed: 200 + n * 7 + lung * 97 });
      }
    }
  }
  return out;
})();
/** a ragged outline in (u, t): radius R in lung units, alternating teeth and a fixed irregular swell (crisp, never round) */
const ragUT = (u: number, t: number, R: number, seed: number, n = 30, teeth = 0.05): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = R * (0.72 + 0.34 * hash(i, seed) + 0.16 * Math.sin(a * 2 + seed) + 0.1 * Math.sin(a * 5 + seed * 1.7)) * (i % 2 ? 1 - teeth : 1 + teeth * 0.6);
    return [u + (rr * Math.cos(a)) / 30, t + (rr * Math.sin(a)) / 64] as [number, number];
  });


// ---------------------------------------------------------------------------
// THE DRAWING (gouache)
// ---------------------------------------------------------------------------
export const FolkChestAnatomy: React.FC<{ pose: WorkerPose; st: ChestState; uid: string }> = ({ pose, st, uid }) => {
  const pr = mkProj(pose);
  const k = pr.k;
  const lungs = LUNGS.map((L) => lungOutline(pr, L, st));
  const order: (0 | 1)[] = pr.dep(LUNGS[0].sg * 20, 0) < pr.dep(LUNGS[1].sg * 20, 0) ? [0, 1] : [1, 0];
  const lungEls = order.map((li) => {
    const L = LUNGS[li];
    const d = smoothD(lungs[li]);
    const id = `${uid}-lg${li}`;
    const fis = [...FISSURES.oblique, ...FISSURES.horizontal]
      .filter((q) => q.L === li)
      .map((q, j) => <path key={`f${j}`} d={lineD(q.pts.map(([u, t]) => lungPt(pr, L, st, u, t)))} fill="none" stroke={GLASS.line} strokeWidth={0.7 * k} strokeOpacity={0.4} strokeLinecap="round" strokeLinejoin="round" />);
    const tree = BRANCHES.filter((b) => b.lung === li).map((b, j) => {
      const a = onLung(pr, b.a[0], b.a[1] + 1.2 * st.breath * ((b.a[1] + 80) / 40), 2);
      const e = onLung(pr, b.b[0], b.b[1] + 1.2 * st.breath * ((b.b[1] + 80) / 40), 2);
      return <path key={`b${j}`} d={`M${PP(a)}L${PP(e)}`} stroke={GLASS.line} strokeOpacity={0.3} strokeWidth={Math.max(0.5, b.w * 0.3) * k} strokeLinecap="round" />;
    });
    return (
      <g key={li}>
        <defs>
          <clipPath id={id}>
            <path d={d} />
          </clipPath>
          <mask id={`${id}-sh`} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
            <path d={d} fill="#fff" />
            <path d={d} transform={`translate(${(-6 * k).toFixed(2)} ${(-5 * k).toFixed(2)})`} fill="#000" />
          </mask>
        </defs>
        <path d={d} fill={GLASS.fill} opacity={GLASS.fillA} />
        <g clipPath={`url(#${id})`}>
          <path d={d} mask={`url(#${id}-sh)`} fill={GLASS.shade} opacity={GLASS.shadeA} />
          {tree}
          {fis}
          <Disease pr={pr} L={L} li={li} st={st} uid={`${id}-ds`} />
        </g>
        <path d={d} fill="none" stroke={GLASS.line} strokeWidth={3.2 * k} strokeOpacity={0.14} strokeLinejoin="round" />
        <path d={d} fill="none" stroke={GLASS.line} strokeWidth={1.0 * k} strokeOpacity={0.8} strokeLinejoin="round" />
      </g>
    );
  });
  const trTop = pr.w(0, -99, -4);
  const trBot = pr.w(CARINA[0], CARINA[1], -2);
  const airway = (a: P2, b: P2, w: number, key: string) => <path key={key} d={`M${PP(a)}L${PP(b)}`} stroke={GLASS.fill} strokeOpacity={0.16} strokeWidth={w * k} strokeLinecap="round" />;
  return (
    <g>
      {airway(trTop, trBot, 5.2, "tr")}
      {airway(pr.w(CARINA[0], CARINA[1], -1), pr.w(-11, -75.5, 0), 3.6, "bl")}
      {airway(pr.w(CARINA[0], CARINA[1], -1), pr.w(12.5, -77, 0), 3.4, "br")}
      <path d={`M${PP(trTop)}L${PP(trBot)}`} stroke={GLASS.line} strokeOpacity={0.35} strokeWidth={0.6 * k} fill="none" />
      {lungEls}
      <Specks pr={pr} st={st} />
    </g>
  );
};

/** an orange gouache shape: flat orange, one soft deeper shade on the lower right (a shifted copy masked out) */
const Gouache: React.FC<{ d: string; id: string; k: number; fill?: string; shade?: string }> = ({ d, id, k, fill = ORANGE, shade = ORANGE_DEEP }) => (
  <g>
    <defs>
      <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={8000} height={8000}>
        <path d={d} fill="#fff" />
        <path d={d} transform={`translate(${(-1.6 * k).toFixed(2)} ${(-1.7 * k).toFixed(2)})`} fill="#000" />
      </mask>
    </defs>
    <path d={d} fill={fill} />
    <path d={d} fill={shade} mask={`url(#${id})`} opacity={0.85} />
  </g>
);

const Disease: React.FC<{ pr: Proj; L: LungDef; li: 0 | 1; st: ChestState; uid: string }> = ({ pr, L, li, st, uid }) => {
  const k = pr.k;
  const at = (u: number, t: number) => lungPt(pr, L, st, u, t);
  const poly = (pts: [number, number][]) => smoothD(pts.map(([u, t]) => at(u, t)));
  const nods = NODULES.map((n, i) => ({ ...n, i })).filter((n) => n.lung === li);
  const els: React.ReactNode[] = [];
  const sp = st.spread;
  if (sp > 0) {
    const up = upperRegion(pr, L, li, st);
    els.push(
      <defs key="cd">
        <clipPath id={`${uid}-up`}>
          <path d={`M${up.map(PP).join("L")}Z`} />
        </clipPath>
      </defs>,
    );
    const blobs = nods.map((n) => poly(ragUT(n.u, n.t, frontR(sp, n.i), 17 + n.i * 5, 34, 0.04)));
    const R = Math.max(...nods.map((n) => frontR(sp, n.i)));
    els.push(
      <g key="cons" clipPath={`url(#${uid}-up)`}>
        {blobs.map((d, j) => (
          <Gouache key={j} d={d} id={`${uid}-bl${j}`} k={k} fill={ORANGE_DEEP} shade="#B8700A" />
        ))}
        {PATCHES.filter((q) => q.lung === li).map((q) => {
          const dist = Math.min(...nods.map((n) => dUT(q.u, q.t, n.u, n.t)));
          const g = ease((R + q.R - dist) / 7);
          if (g <= 0) return null;
          return <Gouache key={q.seed} d={poly(ragUT(q.u, q.t, q.R * (0.3 + 0.7 * g), q.seed, 13, 0.06))} id={`${uid}-p${q.seed}`} k={k} />;
        })}
      </g>,
    );
    SATELLITES.filter((q) => q.lung === li && q.t < fissureT(li, q.u)).forEach((q) => {
      const g = ease((sp - q.at) / 0.14);
      if (g <= 0) return;
      els.push(<Gouache key={`sat${q.seed}`} d={poly(ragUT(q.u, q.t, q.R * (0.35 + 0.65 * g), q.seed, 12, 0.05))} id={`${uid}-sat${q.seed}`} k={k} />);
    });
    CAVITIES.filter((cv) => cv.lung === li).forEach((cv, j) => {
      const n = NODULES[cv.ni];
      const dist = dUT(cv.u, cv.t, n.u, n.t);
      const g = ease((frontR(sp, cv.ni) - dist + 1) / 14);
      if (g <= 0) return;
      const rr = cv.R * g;
      const d = smoothD(ragUT(cv.u, cv.t, rr, cv.seed, 16, 0).map(([u, t]) => at(u, t)));
      const din = smoothD(ragUT(cv.u - 0.006, cv.t - 0.004, rr * 0.68, cv.seed + 1, 14, 0).map(([u, t]) => at(u, t)));
      els.push(
        <g key={`cv${j}`}>
          <Gouache d={d} id={`${uid}-cv${j}`} k={k} />
          <path d={din} fill={HOLLOW} />
          <path d={din} transform={`translate(${(0.8 * k).toFixed(2)} ${(0.9 * k).toFixed(2)})`} fill="none" stroke={ORANGE_DEEP} strokeWidth={0.9 * k} strokeOpacity={0.8} />
        </g>,
      );
    });
  }
  // the nodules (tubercles): three soft orange lobes, a deeper core, a lit spot (light from the upper left)
  nods.forEach((n) => {
    const g = st.nodules[n.i] ?? 0;
    if (g <= 0) return;
    const c = at(n.u, n.t);
    const Rn = n.r * k * (0.4 + 0.6 * g);
    const lobes: [number, number, number][] = [
      [0, 0, 1],
      [0.62, -0.42, 0.55],
      [-0.55, 0.48, 0.5],
    ];
    els.push(
      <g key={`n${n.i}`}>
        {lobes.map(([dx, dy, s2], j) => (
          <circle key={`o${j}`} cx={c[0] + dx * Rn} cy={c[1] + dy * Rn} r={s2 * Rn} fill={ORANGE_DEEP} />
        ))}
        {lobes.map(([dx, dy, s2], j) => (
          <circle key={`i${j}`} cx={c[0] + dx * Rn - 0.16 * s2 * Rn} cy={c[1] + dy * Rn - 0.18 * s2 * Rn} r={s2 * Rn * 0.86} fill={ORANGE} />
        ))}
        <circle cx={c[0] - 0.3 * Rn} cy={c[1] - 0.34 * Rn} r={0.26 * Rn} fill={ORANGE_LIT} opacity={0.8} />
        <circle cx={c[0] + 0.18 * Rn} cy={c[1] + 0.2 * Rn} r={0.24 * Rn} fill="#B8700A" opacity={0.9} />
      </g>,
    );
  });
  return <g>{els}</g>;
};

const Specks: React.FC<{ pr: Proj; st: ChestState }> = ({ pr, st }) => {
  const k = pr.k;
  const els: React.ReactNode[] = [];
  st.specks.forEach((p, i) => {
    if (p === null) return;
    const n = NODULES[i];
    const L = LUNGS[n.lung];
    const end = lungPt(pr, L, st, n.u, n.t);
    const hil: P2 = n.lung === 0 ? [-11, -75.5] : [12.5, -77];
    const route: P2[] = [pr.w(0, -103, -2), pr.w(CARINA[0], CARINA[1], 0), onLung(pr, hil[0], hil[1], 2), onLung(pr, n.via[0], n.via[1], 2), end];
    const seg = route.slice(1).map((b, j) => Math.hypot(b[0] - route[j][0], b[1] - route[j][1]));
    const tot = seg.reduce((a, b) => a + b, 0);
    let s = tot * p;
    let pos = route[0];
    for (let j = 0; j < seg.length; j++) {
      if (s <= seg[j]) {
        const u = s / seg[j];
        pos = [mix(route[j][0], route[j + 1][0], u), mix(route[j][1], route[j + 1][1], u)];
        break;
      }
      s -= seg[j];
      pos = route[j + 1];
    }
    els.push(
      <g key={i}>
        <circle cx={pos[0]} cy={pos[1]} r={1.5 * k} fill={ORANGE_DEEP} />
        <circle cx={pos[0] - 0.25 * k} cy={pos[1] - 0.25 * k} r={1.15 * k} fill={ORANGE} />
      </g>,
    );
  });
  return <g>{els}</g>;
};
