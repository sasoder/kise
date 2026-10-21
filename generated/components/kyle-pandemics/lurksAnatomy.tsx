// ---------------------------------------------------------------------------
// lurksAnatomy: the engraved chest anatomy inside the translucent worker of LurksInYourChest (kyle-pandemics, cut 32).
// Built on the cast's rig (kits/maps/texcocoFigures figureRig, through londonCastV2's Worker spec): every point is a 3D
// point in TORSO-LOCAL units (the hips at the origin, up is - Y, a man ~310 units tall; X across = screen right when
// he faces us = his left; Z forward = toward us when he faces us), turned with the body's yaw like the cast's own
// heads (x' = X cos + Z sin), then through the rig's torso transform (lean, crouch) to figure-local and the figure's
// `at` / `scale` to world px. So the ribcage curves round in perspective, leans and coughs with him.
//
// Anatomy (real proportions on the cast's torso: shoulders at Y -97, hips at 0): the ribcage (ten ribs from the
// spine round to the sternum, costal cartilages, the costal margin), the sternum (manubrium, body, xiphoid), the
// clavicles, the spine behind; the two lungs from just above the clavicles (apex Y -102) to the lower ribs (base
// Y -37), the right with three lobes (horizontal + oblique fissure), the left with two and the cardiac notch; the
// trachea and the bronchial tree (no heart drawn: the notch shows where it sits). Light from the upper left: lit upper edges, a dark
// crescent on the lower right of every volume, hatching on the shadow side.
//
// The disease (orange, the clip's rule: orange = the TB bacillus and what it touches): `nodules` (three tubercles in
// the upper lobes, at the apices), `specks` (the inhaled bacilli coming down the airways to them), `spread` 0..1 (the
// consolidation, cavities and spotting travelling out from the nodules through the upper and middle lobes, never
// into the lower lobes).
// ---------------------------------------------------------------------------
import React from "react";
import { hash } from "../kits/maps/incaShared";
import type { FigRig } from "../kits/maps/texcocoFigures";

type P2 = [number, number];
type V3 = [number, number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const PP = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;

export const DARK = "#17120D";
const INK = "#E9DDBF";
const INK_DEEP = "#D3C5A2";
const ACCENT = "#FFB000";
const ACCENT_DEEP = "#D98A0C";
// the lung volume: dark umber planes in cream line (the style's architecture manner), lit upper left
// the lungs are lit organs (rev 1): a mid cream-umber, ink deep at ~0.5 over the page, lighter than the room
// (rev 2) a touch lighter than the see-through body round them, with a firm dark contour: two clear lungs
const LUNG = { lit: "#C2B597", mid: "#A89A7D", dark: "#857761", line: "#4A3E31" };
const BONE = { main: "#E6D9B8", deep: "#B9A985", back: "#8D7C5E" };

/** the view of the torso: the rig, the figure's at / scale, the body yaw, and a world mapper */
export type ChestView = { rig: FigRig; at: P2; scale: number; yaw: number };
const AX = 1.12;
const mkProj = (v: ChestView) => {
  const c = Math.cos(v.yaw);
  const s = Math.sin(v.yaw);
  const w = (X: number, Y: number, Z: number): P2 => {
    // the cast's torso is broad for its height: the cage is widened to fill it (X and Z alike)
    const f = v.rig.toFig([AX * (X * c + Z * s), Y]);
    return [v.at[0] + f[0] * v.scale, v.at[1] + f[1] * v.scale];
  };
  /** depth toward the viewer (+ = nearer) */
  const dep = (X: number, Z: number) => Z * c - X * s;
  return { w, dep, c, s, k: v.scale, ax: AX };
};
type Proj = ReturnType<typeof mkProj>;

/** a smooth closed path through world points (Catmull-Rom) */
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
// THE STATE
// ---------------------------------------------------------------------------
export type ChestState = {
  /** breath -1 (out) .. 1 (in) */
  breath: number;
  /** the wasting 0..1: the cage narrows, the ribs stand out, the upper lobes retract */
  waste: number;
  /** each nodule's formation 0..1 */
  nodules: number[];
  /** each speck's progress along its airway 0..1 (null = not yet / done) */
  specks: (number | null)[];
  /** the spread 0..1 */
  spread: number;
};

// ---------------------------------------------------------------------------
// THE RIBCAGE
// ---------------------------------------------------------------------------
type Rib = { W: number; yb: number; ye: number; ys: number; xs: number };
// W half-width; yb back attachment; ye the bone's front end; ys / xs where its cartilage ends (the sternum's edge for
// 1-7, the costal margin for 8-10)
const RIB_YS = [-95, -90, -84.5, -78.5, -72.5, -67, -61.5, -56, -50.5, -45];
const RIB_DROP = [0, 0.5, 1.5, 2.5, 3.5, 5, 6.5, 7.5, 8, 8];
const RIB_W = [17, 25, 30, 34, 36.5, 38, 38.5, 38, 37, 35];
const RIB_YB = [-103, -99.5, -95, -90.5, -86, -81.5, -77, -72.5, -68, -63.5];
const RIB_XS = [6, 6, 5.5, 5, 5, 4.5, 4, 9.5, 15.5, 21.5];
const RIBS: Rib[] = RIB_YS.map((ys, i) => ({ W: RIB_W[i], yb: RIB_YB[i], ye: ys + RIB_DROP[i], ys, xs: RIB_XS[i] }));
/** the sternum's front surface Z at height Y (the upper chest slopes back) */
const stZ = (Y: number) => mix(18, 28, c01((Y + 97) / 40));
/** where each bone ends (the lower ribs end further round the side, on the costal margin) */
const RIB_THE = [0.78, 0.78, 0.78, 0.78, 0.78, 0.78, 0.78, 0.735, 0.68, 0.62].map((v) => v * Math.PI);

type Piece = { pts: P2[]; front: boolean; wBone: number; kind: "bone" | "cart" };
/** the ribs as projected pieces, split where they pass behind the torso's mid-plane */
const ribPieces = (pr: Proj, st: ChestState): Piece[] => {
  const out: Piece[] = [];
  const nar = 1 - 0.07 * st.waste;
  const lift = -1.1 * st.breath;
  const wide = 1 + 0.018 * st.breath;
  const margin: Record<string, { p: V3 }[]> = { "-1": [], "1": [] };
  RIBS.forEach((rb, i) => {
    const TE = RIB_THE[i];
    for (const sg of [-1, 1]) {
      const W = rb.W * nar * wide;
      const D = stZ(rb.ys) + 1.5;
      const ptsB: { p: P2; d: number }[] = [];
      const N = 26;
      for (let j = 0; j <= N; j++) {
        const th = mix(0.16, TE, j / N);
        const u = (th - 0.16) / (TE - 0.16);
        const X = sg * W * Math.sin(th);
        const Z = -D * Math.cos(th) - 2;
        const Y = rb.yb + (rb.ye - rb.yb) * Math.sin((u * Math.PI) / 2) + lift * (0.4 + 0.6 * u);
        ptsB.push({ p: pr.w(X, Y, Z), d: pr.dep(X, Z) });
      }
      // split the bone at the mid-plane (depth 0)
      let cur: P2[] = [ptsB[0].p];
      let fr = ptsB[0].d > 0;
      for (let j = 1; j < ptsB.length; j++) {
        const f2 = ptsB[j].d > 0;
        cur.push(ptsB[j].p);
        if (f2 !== fr) {
          out.push({ pts: cur, front: fr, wBone: 2.1 - i * 0.03, kind: "bone" });
          cur = [ptsB[j].p];
          fr = f2;
        }
      }
      out.push({ pts: cur, front: fr, wBone: 2.1 - i * 0.03, kind: "bone" });
      // the costal cartilage: from the bone's end, medially and up to the sternum (1-6); ribs 7-10 end on the costal
      // margin, drawn below as one continuous arch from the xiphoid out and down
      const thE = TE;
      const Xe = sg * W * Math.sin(thE);
      const Ze = -D * Math.cos(thE) - 2;
      const Ye = rb.ye + lift;
      const Xs = sg * rb.xs * nar;
      const Ys = rb.ys + lift * 0.6;
      if (i >= 6) {
        if (i === 6) margin[String(sg)].push({ p: [Xs, Ys, stZ(rb.ys)] });
        margin[String(sg)].push({ p: [Xe, Ye, Ze] });
        continue;
      }
      const Zs = stZ(rb.ys);
      const cart: P2[] = [];
      for (let j = 0; j <= 12; j++) {
        const u = j / 12;
        // a gentle curve: first along the rib's own heading, then turning up toward the sternum
        const X = mix(Xe, Xs, 1 - (1 - u) * (1 - u));
        const Y = mix(Ye, Ys, u * u * (i > 3 ? 1 : 0.6) + (i > 3 ? 0 : 0.4 * u));
        const Z = mix(Ze, Zs, Math.sqrt(u));
        cart.push(pr.w(X, Y, Z));
      }
      out.push({ pts: cart, front: pr.dep(Xe, Ze) > -4, wBone: 1.5 - i * 0.03, kind: "cart" });
    }
  });
  // the costal margin: a smooth arch through the xiphoid side and the ends of ribs 7-10
  for (const sg of ["-1", "1"]) {
    const m = margin[sg].map((q) => q.p);
    const pts: P2[] = [];
    for (let j = 0; j < m.length - 1; j++) {
      const a = m[Math.max(0, j - 1)];
      const b = m[j];
      const c = m[j + 1];
      const d = m[Math.min(m.length - 1, j + 2)];
      for (let n = 0; n < 8; n++) {
        const t = n / 8;
        const cr = (k2: 0 | 1 | 2) => {
          const p0 = a[k2];
          const p1 = b[k2];
          const p2 = c[k2];
          const p3 = d[k2];
          return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
        };
        pts.push(pr.w(cr(0), cr(1), cr(2)));
      }
    }
    const last = m[m.length - 1];
    pts.push(pr.w(last[0], last[1], last[2]));
    out.push({ pts, front: true, wBone: 1.6, kind: "cart" });
  }
  return out;
};

const RibStroke: React.FC<{ pc: Piece; k: number; waste: number; back?: boolean }> = ({ pc, k, waste, back }) => {
  const d = lineD(pc.pts);
  const w = pc.wBone * k;
  const ribProm = 1 + 0.35 * waste;
  if (back) {
    return <path d={d} fill="none" stroke={BONE.back} strokeOpacity={0.55} strokeWidth={w * 0.75} strokeLinecap="round" strokeLinejoin="round" />;
  }
  const isB = pc.kind === "bone";
  return (
    <g>
      <path d={d} fill="none" stroke={DARK} strokeWidth={w + 0.9 * k * ribProm} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={isB ? BONE.main : BONE.deep} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {/* the form shadow along the lower edge (light from the upper left) */}
      <path d={d} transform={`translate(${(0.35 * k).toFixed(2)} ${(0.75 * k).toFixed(2)})`} fill="none" stroke={isB ? BONE.deep : "#9F8F6E"} strokeWidth={w * 0.38} strokeLinecap="round" strokeOpacity={0.9} />
    </g>
  );
};

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
  const lat0 = 6 + 32.5 * Math.pow(Math.sin(Math.min(1, t / 0.62) * (Math.PI / 2)), 0.62) - 1.6 * c01((t - 0.85) / 0.15);
  // medial edge: the apex rounds in from 17, the mediastinum at ~6.5, the base dome rising medially from t 0.62
  let med = mix(16.5, 6.5, Math.pow(c01(t / 0.22), 0.55));
  if (L.sg === 1) {
    // the cardiac notch (t 0.5..0.82), the lingula below it
    const nt = c01((t - 0.5) / 0.3);
    med += 11 * Math.sin(Math.PI * nt) * (nt < 1 ? 1 : 0) + (t > 0.8 ? 4 : 0) * c01((t - 0.8) / 0.05);
  }
  const dome = c01((t - 0.64) / 0.36);
  med = mix(med, lat0 - 1.5, Math.pow(dome, 1.7));
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
/** the upper + middle lobes (above the oblique fissure) as a region in (u, t): the polygon that clips the spread */
const upperRegion = (pr: Proj, L: LungDef, li: 0 | 1, st: ChestState): P2[] => {
  const f = FISSURES.oblique.find((q) => q.L === li)!.pts;
  // above the fissure: from the apex, down the lateral edge to the fissure's lateral end, along the fissure medially,
  // up the medial edge back to the apex (extended a little outside the lung: the lung outline clips it too)
  const pts: P2[] = [];
  pts.push(lungPt(pr, L, st, 0.5, -0.1));
  pts.push(lungPt(pr, L, st, 1.3, -0.05));
  pts.push(lungPt(pr, L, st, 1.3, f[0][1]));
  // (capped at t 0.58: the disease stays in the upper chest, out of the caption band)
  f.forEach(([u, t]) => pts.push(lungPt(pr, L, st, u, Math.min(t, 0.58))));
  pts.push(lungPt(pr, L, st, -0.4, Math.min(0.58, f[f.length - 1][1])));
  pts.push(lungPt(pr, L, st, -0.4, -0.05));
  return pts;
};

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
// THE DRAWING
// ---------------------------------------------------------------------------
export const ChestAnatomy: React.FC<{ view: ChestView; st: ChestState; uid: string }> = ({ view, st, uid }) => {
  const pr = mkProj(view);
  const k = pr.k;
  const pieces = ribPieces(pr, st);
  const back = pieces.filter((p) => !p.front);
  const front = pieces.filter((p) => p.front);
  const lungs = LUNGS.map((L) => lungOutline(pr, L, st));
  // the far lung first (the one with the smaller depth)
  const order: (0 | 1)[] = pr.dep(LUNGS[0].sg * 20, 0) < pr.dep(LUNGS[1].sg * 20, 0) ? [0, 1] : [1, 0];

  // the spine: vertebral bodies behind everything, between the lungs
  const spine = Array.from({ length: 13 }, (_, i) => {
    const Y = -110 + i * 6.1;
    const c = pr.w(0, Y, -22);
    const c2 = pr.w(0, Y + 4.4, -22);
    const hw = 4.6 * k * pr.c;
    return <path key={i} d={`M${PP([c[0] - hw, c[1]])}L${PP([c[0] + hw, c[1]])}L${PP([c2[0] + hw, c2[1]])}L${PP([c2[0] - hw, c2[1]])}Z`} fill={BONE.back} fillOpacity={0.4} stroke={DARK} strokeWidth={0.6 * k} strokeOpacity={0.5} />;
  });

  // the lungs' fill, shading and contour engraving
  const lungEls = order.map((li) => {
    const L = LUNGS[li];
    const ol = lungs[li];
    const d = smoothD(ol);
    const id = `${uid}-lg${li}`;
    // the inner contours (engraved cream lines following the form), about the lung's centre
    const cen = lungPt(pr, L, st, 0.5, 0.5, 0);
    const contours = [0.82, 0.64, 0.46].map((f, j) => (
      <path key={j} d={smoothD(ol.map((p) => [cen[0] + (p[0] - cen[0]) * f + 1.2 * k * (1 - f), cen[1] + (p[1] - cen[1]) * f + 1.6 * k * (1 - f)] as P2))} fill="none" stroke={LUNG.line} strokeWidth={0.5 * k} strokeOpacity={0.16 + 0.05 * j} />
    ));
    // the fissures
    const fis = [...FISSURES.oblique, ...FISSURES.horizontal].filter((q) => q.L === li).map((q, j) => {
      const pts = q.pts.map(([u, t]) => lungPt(pr, L, st, u, t));
      return (
        <g key={`f${j}`}>
          <path d={lineD(pts)} fill="none" stroke={DARK} strokeWidth={1.2 * k} strokeLinecap="round" />
          <path d={lineD(pts)} transform={`translate(${(-0.45 * k).toFixed(2)} ${(-0.55 * k).toFixed(2)})`} fill="none" stroke={INK} strokeWidth={0.5 * k} strokeOpacity={0.35} strokeLinecap="round" />
        </g>
      );
    });
    // the bronchial tree in this lung
    const tree = BRANCHES.filter((b) => b.lung === li).map((b, j) => {
      const a = onLung(pr, b.a[0], b.a[1] + 1.2 * st.breath * ((b.a[1] + 80) / 40), 2);
      const e = onLung(pr, b.b[0], b.b[1] + 1.2 * st.breath * ((b.b[1] + 80) / 40), 2);
      return <path key={`b${j}`} d={`M${PP(a)}L${PP(e)}`} stroke={LUNG.line} strokeOpacity={0.75} strokeWidth={b.w * 0.42 * k} strokeLinecap="round" />;
    });
    return (
      <g key={li}>
        <defs>
          <clipPath id={id}>
            <path d={d} />
          </clipPath>
          <mask id={`${id}-sh`} maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={40000} height={40000}>
            <path d={d} fill="#fff" />
            <path d={d} transform={`translate(${(-5.5 * k).toFixed(2)} ${(-4.5 * k).toFixed(2)})`} fill="#000" />
          </mask>
        </defs>
        <path d={d} fill={LUNG.mid} />
        <g clipPath={`url(#${id})`}>
          {/* the lit upper-left of the volume, the dark crescent at the lower right, hatched */}
          <path d={d} transform={`translate(${(-3 * k).toFixed(2)} ${(-3.5 * k).toFixed(2)}) `} fill={LUNG.lit} opacity={0.85} />
          <g mask={`url(#${id}-sh)`}>
            <path d={d} fill={LUNG.dark} />
            <path d={hatch(ol, 118, 1.25 * k, li * 5 + 3)} fill="none" stroke={DARK} strokeWidth={0.42 * k} strokeOpacity={0.42} />
          </g>
          {contours}
          {tree}
          {fis}
          <Disease pr={pr} L={L} li={li} st={st} uid={`${id}-ds`} />
        </g>
        <path d={d} fill="none" stroke={DARK} strokeWidth={2.4 * k} strokeLinejoin="round" />
        <path d={d} transform={`translate(${(-0.5 * k).toFixed(2)} ${(-0.5 * k).toFixed(2)})`} fill="none" stroke={INK} strokeWidth={0.55 * k} strokeOpacity={0.3} clipPath={`url(#${id})`} />
      </g>
    );
  });

  // the trachea (a ringed tube from the neck to the carina) and the main bronchi drawn over the mediastinum
  const trTop = pr.w(0, -99, -4);
  const trBot = pr.w(CARINA[0], CARINA[1], -2);
  const trW = 6.4 * k;
  const rings = Array.from({ length: 6 }, (_, i) => {
    const Y = -101 + i * 3.4;
    const a = pr.w(-3.1, Y, 0);
    const b = pr.w(3.1, Y, 0);
    return `M${PP(a)}Q${PP(pr.w(0, Y + 1.1, 3))} ${PP(b)}`;
  }).join("");
  const bronchi = [
    [CARINA, [-11, -75.5] as P2],
    [CARINA, [12.5, -77] as P2],
  ].map(([a, b], i) => <path key={i} d={`M${PP(pr.w(a[0], a[1], -1))}L${PP(pr.w(b[0], b[1], 0))}`} stroke={INK_DEEP} strokeWidth={4.4 * k} strokeLinecap="round" strokeOpacity={0.85} />);

  // the sternum: manubrium, body, xiphoid
  // (rev 1: narrow, bone-toned, shaded like the ribs: never a white necktie) manubrium, the sternal angle, the body, a
  // small xiphoid
  const stPts: [number, number][] = [[-4.6, -97.5], [-2, -96.4], [0, -96.8], [2, -96.4], [4.6, -97.5], [4.3, -92], [3.1, -89.2], [3.4, -84], [3.5, -66], [2.6, -61.5], [1.2, -59.5], [0.9, -56.5], [0, -55.5], [-0.9, -56.5], [-1.2, -59.5], [-2.6, -61.5], [-3.5, -66], [-3.4, -84], [-3.1, -89.2], [-4.3, -92]];
  const lift = -1.1 * st.breath;
  const sternum = smoothD(stPts.map(([X, Y]) => pr.w(X * (1 - 0.05 * st.waste), Y + lift * 0.8, stZ(Y) + 1.5)));
  // the clavicles: S-curves from the sternal notch out and back to the shoulder
  const clav = (sg: number) => {
    const pts: P2[] = [];
    for (let j = 0; j <= 14; j++) {
      const u = j / 14;
      const X = sg * mix(5, 35, u) * (1 - 0.04 * st.waste);
      const Y = -98 - 2.2 * Math.sin(Math.PI * u) + 1.5 * u + lift * 0.6 + 2.5 * st.waste * u;
      const Z = mix(stZ(-97), -2, u * u) + 3 * Math.sin(Math.PI * u * 1.5);
      pts.push(pr.w(X, Y, Z));
    }
    return pts;
  };

  return (
    <g>
      {spine}
      {back.map((pc, i) => (
        <RibStroke key={`bk${i}`} pc={pc} k={k} waste={st.waste} back />
      ))}
      {lungEls}
      <path d={`M${PP(trTop)}L${PP(trBot)}`} stroke={DARK} strokeWidth={trW + 1.4 * k} strokeLinecap="butt" />
      <path d={`M${PP(trTop)}L${PP(trBot)}`} stroke={INK_DEEP} strokeWidth={trW} strokeLinecap="butt" strokeOpacity={0.9} />
      <path d={rings} fill="none" stroke={DARK} strokeWidth={0.7 * k} strokeOpacity={0.6} />
      {bronchi}
      <Specks pr={pr} st={st} />
      {front.map((pc, i) => (
        <RibStroke key={`fr${i}`} pc={pc} k={k} waste={st.waste} />
      ))}
      <defs>
        <clipPath id={`${uid}-stc`}>
          <path d={sternum} />
        </clipPath>
      </defs>
      <path d={sternum} fill={BONE.deep} stroke={DARK} strokeWidth={1.1 * k} />
      <g clipPath={`url(#${uid}-stc)`}>
        {/* lit on the left edge, shaded and hatched on the right (light from the upper left), like the ribs */}
        <path d={sternum} transform={`translate(${(-1.4 * k).toFixed(2)} 0)`} fill={INK_DEEP} />
        <path d={sternum} transform={`translate(${(2.2 * k).toFixed(2)} ${(0.6 * k).toFixed(2)})`} fill="#A0906F" />
        <path d={hatch(stPts.map(([X, Y]) => pr.w(X, Y + lift * 0.8, stZ(Y) + 1.5)), 100, 1.1 * k, 77)} transform={`translate(${(2.4 * k).toFixed(2)} 0)`} fill="none" stroke={DARK} strokeWidth={0.35 * k} strokeOpacity={0.35} />
      </g>
      <path d={lineD([pr.w(-3.1, -89.2 + lift * 0.8, stZ(-89) + 1.6), pr.w(3.1, -89.2 + lift * 0.8, stZ(-89) + 1.6)])} stroke={DARK} strokeWidth={0.55 * k} strokeOpacity={0.8} />
      {[-1, 1].map((sg) => {
        const d = lineD(clav(sg));
        return (
          <g key={sg}>
            <path d={d} fill="none" stroke={DARK} strokeWidth={3.4 * k} strokeLinecap="round" />
            <path d={d} fill="none" stroke={BONE.main} strokeWidth={2.4 * k} strokeLinecap="round" />
            <path d={d} transform={`translate(${(0.3 * k).toFixed(2)} ${(0.8 * k).toFixed(2)})`} fill="none" stroke={BONE.deep} strokeWidth={1.1 * k} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

/** parallel hatch lines over a polygon's bounding box (clip it) */
const hatch = (pts: P2[], ang: number, gap: number, seed: number) => {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.4;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    d += `M${PP([px - dx * R, py - dy * R])}L${PP([px + dx * R, py + dy * R])}`;
  }
  return d;
};

// ---------------------------------------------------------------------------
// THE DISEASE (drawn inside each lung's clip)
// ---------------------------------------------------------------------------
const Disease: React.FC<{ pr: Proj; L: LungDef; li: 0 | 1; st: ChestState; uid: string }> = ({ pr, L, li, st, uid }) => {
  const k = pr.k;
  const at = (u: number, t: number) => lungPt(pr, L, st, u, t);
  const poly = (pts: [number, number][]) => `M${pts.map(([u, t]) => PP(at(u, t))).join("L")}Z`;
  const nods = NODULES.map((n, i) => ({ ...n, i })).filter((n) => n.lung === li);
  const els: React.ReactNode[] = [];
  const sp = st.spread;
  // the nodules (tubercles): a clear orange nodule, a darker caseous core, a soft lit side (light from the upper left)
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
          <circle key={`o${j}`} cx={c[0] + dx * Rn} cy={c[1] + dy * Rn} r={s2 * Rn + 0.9 * k} fill={DARK} />
        ))}
        {lobes.map(([dx, dy, s2], j) => (
          <circle key={`i${j}`} cx={c[0] + dx * Rn} cy={c[1] + dy * Rn} r={s2 * Rn} fill={ACCENT} />
        ))}
        <circle cx={c[0] - 0.3 * Rn} cy={c[1] - 0.32 * Rn} r={0.5 * Rn} fill="#FFD27A" opacity={0.5} />
        <circle cx={c[0] + 0.14 * Rn} cy={c[1] + 0.16 * Rn} r={0.46 * Rn} fill={ACCENT_DEEP} />
        <circle cx={c[0] + 0.2 * Rn} cy={c[1] + 0.22 * Rn} r={0.22 * Rn} fill="#A8640A" />
      </g>,
    );
  });
  if (sp > 0) {
    // the consolidation: a ragged orange front round each nodule, washed and hatched along the lung's own form
    // (nested contours of the lung), clipped to the upper + middle lobes
    const up = upperRegion(pr, L, li, st);
    const ol = lungOutlineCache(pr, L, st);
    const cen = lungPt(pr, L, st, 0.5, 0.45, 0);
    let contourD = "";
    for (let f = 0.97; f > 0.05; f -= 0.072) contourD += smoothD(ol.map((p) => [cen[0] + (p[0] - cen[0]) * f, cen[1] + (p[1] - cen[1]) * f] as P2));
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
          <g key={j}>
            <path d={d} fill={ACCENT_DEEP} opacity={0.42} />
            <clipPath id={`${uid}-b${j}`}>
              <path d={d} />
            </clipPath>
            <path d={contourD} clipPath={`url(#${uid}-b${j})`} fill="none" stroke={ACCENT} strokeWidth={0.6 * k} strokeOpacity={0.9} />
            <path d={d} fill="none" stroke={ACCENT} strokeWidth={0.8 * k} strokeOpacity={0.95} strokeLinejoin="miter" />
          </g>
        ))}
        {/* the patches: solid, ragged, of different sizes, each taken by the front as it passes */}
        {PATCHES.filter((q) => q.lung === li).map((q) => {
          const dist = Math.min(...nods.map((n) => dUT(q.u, q.t, n.u, n.t)));
          const g = ease((R + q.R - dist) / 7);
          if (g <= 0) return null;
          return <path key={q.seed} d={poly(ragUT(q.u, q.t, q.R * (0.3 + 0.7 * g), q.seed, 13, 0.06))} fill={ACCENT} stroke={ACCENT_DEEP} strokeWidth={0.5 * k} strokeLinejoin="miter" />;
        })}
      </g>,
    );
    // the cavities: eroded hollows, dark inside, rimmed, the far (lower-right) inner wall catching the light
    CAVITIES.filter((cv) => cv.lung === li).forEach((cv, j) => {
      const n = NODULES[cv.ni];
      const dist = dUT(cv.u, cv.t, n.u, n.t);
      const g = ease((frontR(sp, cv.ni) - dist + 1) / 14);
      if (g <= 0) return;
      const rr = cv.R * g;
      const d = poly(ragUT(cv.u, cv.t, rr, cv.seed, 18, 0.03));
      const din = poly(ragUT(cv.u - 0.006, cv.t - 0.004, rr * 0.72, cv.seed + 1, 16, 0.03));
      els.push(
        <g key={`cv${j}`}>
          <path d={d} fill={ACCENT} stroke={DARK} strokeWidth={1.1 * k} strokeLinejoin="miter" />
          <path d={din} fill="#1E1711" stroke={DARK} strokeWidth={0.6 * k} />
          <path d={din} transform={`translate(${(0.7 * k).toFixed(2)} ${(0.8 * k).toFixed(2)})`} fill="none" stroke={ACCENT_DEEP} strokeWidth={0.7 * k} strokeOpacity={0.8} />
        </g>,
      );
    });
  }
  return <g>{els}</g>;
};
// (the hatch only needs the lung's bounding box: reuse the outline)
const lungOutlineCache = (pr: Proj, L: LungDef, st: ChestState) => lungOutline(pr, L, st);

/** the inhaled specks coming down the airways: trachea top -> carina -> main bronchus -> the upper lobe -> the nodule */
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
    // arc-length position along the route
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
        <circle cx={pos[0]} cy={pos[1]} r={1.35 * k} fill={DARK} />
        <circle cx={pos[0]} cy={pos[1]} r={0.95 * k} fill={ACCENT} />
      </g>,
    );
  });
  return <g>{els}</g>;
};
