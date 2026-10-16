// ---------------------------------------------------------------------------
// dgFigures: the shared engraved cast of the "Death ground" clip (Dwarkesh
// Patel with Sarah Paine, Oct 2026): Sun Tzu's world, Warring States China
// (5th - 3rd c. BC), in the manner of the Capture-not-kill cast.
//
// Built ON the articulated rig of texcocoFigures exactly the way captureFigures
// is: the rig's joints (figureRig: IK, yaw, lean, crouch), its own arms and hands
// (a Figure with body={false}) and its own face (a Figure cut out at the face),
// with the costume drawn here in the same engraver's hand: the cream form on a
// dark casing, a firm dark outline, hatching, light from the upper left.
// Nothing in texcocoFigures or captureFigures is edited or forked.
//
//   Soldier    knee-length robe with the crossed (y) collar, a lamellar vest of
//              small plates, shoulder guards, puttees, square-toed shoes, the
//              topknot with its pin, a moustache; a ge (dagger-axe) by default
//   Commoner   the SAME body in the plain belted robe; armed 0..1 wipes the vest
//              and shoulder guards on (shoulders down to the hem)
//   King       ankle robe with broad borders, wide hanging sleeves, apron, long
//              sash ends, the mianguan crown: a flat board with bead strings
//              hanging in front of his brow and behind
//   Minister   ankle robe, wide sleeves, the tall slanted official's cap, a hu
//              tablet held at the chest, a long thin beard
//   General    grand lamellar with a bordered vest, a crested lamellar helmet, a
//              cape, a jian at his hip
//   Props      Ge, Spear, Shield, Banner, Throne, LowTable, Scroll
//
// Units: figure-local, feet at (0, 0), up is - y, a man ~310 units from the
// soles to the top of the skull (the bun +20, the minister's cap +55, the
// king's crown board +40, the general's crest +55). scale = px per unit:
// 700 px tall = 2.26, 300 px = 0.97, 150 px = 0.48 (scaleForPx).
// Draw inside a WorldSvg (texcocoShared). The API is described in
// .../SarahWar_Death_ground.../animation_source/notes/DG_FIGURES_READY.md.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { DARK, hash, type P2 } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { CREAM, Figure, ORANGE, STAND, figureAnchors, figureRig, lerpFig, type ArmPose, type FigPose, type Ink, type Spec } from "../kits/maps/texcocoFigures";
import { TexcocoPage, WALK, WorldSvg, idle, poseTrack, shadeInk, track, walkPose } from "../kits/maps/texcocoShared";

export { CREAM, ORANGE, STAND, WALK, idle, lerpFig, poseTrack, shadeInk, track };
export type { ArmPose, FigPose, Ink };
/** the clip's sequence rate (24.000; NOT texcocoShared's 23.976) */
export const FPS = 24;
const hexRgb = (h: string) => {
  const m = h.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const r = h.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return r ? [1, 2, 3].map((i) => Number(r[i])) : [0, 0, 0];
};
const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = Math.max(0, Math.min(1, t));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};
/** an ink between two inks (cream -> orange as a man turns; works on shadeInk's rgb() inks too) */
export const mixInk = (a: Ink, b: Ink, t: number): Ink => ({ main: mixHex(a.main, b.main, t), deep: mixHex(a.deep, b.deep, t), hair: mixHex(a.hair, b.hair, t) });
/** a man from the soles to the top of the skull, units */
export const MAN_UNITS = 310;
/** px per unit for a man `px` tall on screen (multiply by 1 / camera k for world px) */
export const scaleForPx = (px: number) => px / MAN_UNITS;

// ---------------------------------------------------------------------------
// the engraver's helpers (as texcocoFigures' / captureFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
type Map = (p: P2) => P2;
const ID: Map = (p) => p;
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const segD = (segs: Seg[], m: Map = ID) =>
  segs
    .map(([a, b]) => {
      const p = m(a);
      const q = m(b);
      return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 0.8 ? "" : `M${P(p)}L${P(q)}`;
    })
    .join("");
const polyD = (pts: P2[], close = true) => (pts.length ? `M${pts.map(P).join("L")}${close ? "Z" : ""}` : "");
const subdivide = (segs: Seg[], n: number): Seg[] => segs.flatMap(([a, b]) => Array.from({ length: n }, (_, i): Seg => [mix2(a, b, i / n), mix2(a, b, (i + 1) / n)]));
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
/** even out the stations (long segments split to <= 12 units), so the smooth outline never overshoots between uneven ones */
const tightEnds = (st0: St[]): St[] => {
  if (st0.length < 2) return st0;
  const out: St[] = [st0[0]];
  for (let i = 1; i < st0.length; i++) {
    const a = st0[i - 1];
    const b = st0[i];
    const n = Math.max(1, Math.ceil(vlen(sub(b[0], a[0])) / 12));
    for (let j = 1; j <= n; j++) out.push([mix2(a[0], b[0], j / n), mix(a[1], b[1], j / n)]);
  }
  return out;
};
const limbD = (st0: St[]) => {
  const st = tightEnds(st0);
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
const foldHatchSegs = (a: P2, c: P2, b: P2, seed: number, len = 11, step = 0.045): Seg[] => {
  const out: Seg[] = [];
  let i = 0;
  for (let t = 0.16; t < 0.97; t += step, i++) {
    const p = quad(a, c, b, t);
    const l = (2.5 + len * t) * (0.55 + 0.75 * hash(i, seed));
    out.push([p, [p[0] + l * 0.86, p[1] + l * 0.5]]);
  }
  return out;
};
const blendYaw = (front: P2[], prof: P2[], yaw: number): P2[] => {
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  return front.map((f, i) => {
    const p = mix2(f, prof[i], t);
    return s < 0 ? [-p[0], p[1]] : p;
  });
};
// a dark casing round a form, so it reads on the umber page
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
/** the body as a turned elliptical column (texcocoFigures' surface) */
const surface = (theta: number, A: number, B: number) => {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const wf = Math.hypot(A * c, B * s) / A;
  const term = Math.atan2(A * c, B * s);
  const flat = Math.abs(s) < 1e-6;
  const mF: Map = (p) => {
    if (flat) return p;
    const xc = clamp1(p[0] / A) * A;
    const ph = Math.max(term - Math.PI, Math.min(Math.asin(xc / A), term));
    return [A * Math.sin(ph) * c + B * Math.cos(ph) * s + (p[0] - xc) * wf, p[1]];
  };
  const side: Map = (p) => [p[0] * wf, p[1]];
  return { c, s, wf, mF, side };
};
// ---- geometry ---------------------------------------------------------------
const dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1];
const circ = (c: P2, r: number, n = 10): P2[] => Array.from({ length: n }, (_, i): P2 => [c[0] + r * Math.cos((i * 2 * Math.PI) / n), c[1] + r * Math.sin((i * 2 * Math.PI) / n)]);
const hull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const centroid = (pts: P2[]): P2 => mul(pts.reduce((a, p) => add(a, p), [0, 0] as P2), 1 / Math.max(1, pts.length));
const closestOnSeg = (p: P2, a: P2, b: P2): P2 => {
  const d = sub(b, a);
  const L2 = dot(d, d) || 1e-9;
  return add(a, mul(d, c01(dot(sub(p, a), d) / L2)));
};
type Bone = { a: P2; b: P2; r: number };
/** cloth lies ON what holds it up: the edges of a hull that face upward are pulled down onto the nearest bone's surface */
const drape = (poly: P2[], bns: Bone[], up = -0.25, step = 7): P2[] => {
  const cen = centroid(poly);
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    out.push(a);
    const d = sub(b, a);
    const L = vlen(d);
    if (L < step * 1.5) continue;
    let n: P2 = norm([-d[1], d[0]]);
    if (dot(n, sub(mix2(a, b, 0.5), cen)) < 0) n = [-n[0], -n[1]];
    if (n[1] > up) continue;
    const m = Math.ceil(L / step);
    for (let j = 1; j < m; j++) {
      const p = mix2(a, b, j / m);
      let best: P2 = p;
      let bd = Infinity;
      for (const bn of bns) {
        const q = closestOnSeg(p, bn.a, bn.b);
        const dd = vlen(sub(p, q)) - bn.r;
        if (dd < bd) {
          bd = dd;
          best = add(q, mul(norm(sub(p, q)), bn.r));
        }
      }
      out.push(bd > 0 ? best : p);
    }
  }
  return out;
};
/** the lowest y of a closed polygon over x */
const bottomAt = (poly: P2[], x: number) => {
  let y = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) y = Math.max(y, mix(a[1], b[1], (x - a[0]) / (b[0] - a[0])));
  }
  return y;
};
/** a polygon cut to the half-plane dot(p - o, u) <= 0 */
const clipHalf = (poly: P2[], o: P2, u: P2): P2[] => {
  const f = (p: P2) => dot(sub(p, o), u);
  const out: P2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = f(a);
    const fb = f(b);
    if (fa <= 0) out.push(a);
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) out.push(mix2(a, b, fa / (fa - fb)));
  }
  return out;
};
const signedDeg = (a: P2, b: P2) => (Math.atan2(a[0] * b[1] - a[1] * b[0], dot(a, b)) * 180) / Math.PI;
const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

// the rig's face and hair outlines (texcocoFigures'), to cut its face out and to erase its hair
const FACE_F: P2[] = [[0, -26], [8, -25], [14, -21], [18, -13], [19.5, -5], [19.5, 2], [19, 8], [18, 12], [16.5, 16], [14.5, 19.5], [11, 23], [5, 26.5], [-5, 26.5], [-11, 23], [-16.5, 16], [-19, 8], [-19.5, -2], [-18, -13], [-14, -21], [-8, -25]];
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];
const HAIR_F: P2[] = [[-20, 32], [-25.5, 22], [-27, 5], [-24, -14], [-17, -27], [0, -31], [17, -27], [24, -14], [27, 5], [25.5, 22], [20, 32], [13, 31], [16, 14], [17.5, 0], [16, -9], [8, -13.5], [0, -12.4], [-8, -13.5], [-16, -9], [-17.5, 0], [-16, 14], [-13, 31]];
const HAIR_P: P2[] = [[-24, 29], [-28, 18], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 24], [-13, 30]];
/** the rig's "cropped" hair at a yaw */
const rigHair = (yaw: number) => {
  const drop = -15;
  const f = HAIR_F.map((p, i): P2 => ([0, 10, 11, 21].includes(i) ? [p[0], p[1] + drop] : [1, 9].includes(i) ? [p[0], p[1] + drop * 0.6] : p));
  const pr = HAIR_P.map((p, i): P2 => ([0, 21].includes(i) ? [p[0], p[1] + drop] : [1, 20].includes(i) ? [p[0], p[1] + drop * 0.55] : p));
  return blendYaw(f, pr, yaw);
};
// THE HAIR, combed tight up into the knot (head-local; front / profile with matched points)
const CAPH_F: P2[] = [[-18.6, 8], [-21.6, 2], [-23, -6], [-22, -18], [-15.5, -27.5], [0, -31.6], [15.5, -27.5], [22, -18], [23, -6], [21.6, 2], [18.6, 8], [17.6, 7], [18, 2], [17.8, -3], [16.2, -9.6], [8, -13.2], [0, -12.2], [-8, -13.2], [-16.2, -9.6], [-17.8, -3], [-18, 2], [-17.6, 7]];
const CAPH_P: P2[] = [[-20, 12], [-26, 6], [-28, -5], [-26.5, -17], [-19, -26.5], [-4, -31.6], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13], [14, -12.6], [11, -12.2], [8, -11.6], [4.5, -10.1], [0.8, -6.8], [-1.6, -1], [-3.2, 4], [-5, 7.5], [-9, 9.5], [-14, 10.5]];
// the king's crown cap (under the board) and the general's helmet bowl
const CAPK_F: P2[] = [[-17.5, -13.5], [-19.5, -28], [-17, -44], [0, -46.5], [17, -44], [19.5, -28], [17.5, -13.5], [0, -15.5]];
const CAPC_F: P2[] = [[-15.5, -17], [-16.5, -30], [-14.5, -44], [0, -46], [14.5, -44], [16.5, -30], [15.5, -17], [0, -19]];
const CAPC_P: P2[] = [[-18, -14], [-20, -29], [-15, -43], [-2, -46.5], [10, -45], [14, -31], [15.5, -19], [-2, -15.5]];
const CAPK_P: P2[] = [[-25.5, -6], [-27.5, -24], [-21, -42.5], [-2, -47.5], [13, -45.5], [17.5, -30], [18.8, -15.5], [-3, -10.5]];
const DOME_F: P2[] = [[-24.5, -11], [-25.5, -25], [-18, -36.5], [0, -41], [18, -36.5], [25.5, -25], [24.5, -11], [0, -14.5]];
const DOME_P: P2[] = [[-28, -6], [-29, -24], [-19, -38.5], [0, -42], [14, -37], [20, -26], [21, -14.5], [-3, -10]];

// ---------------------------------------------------------------------------
// THE CAST'S BUILDS (texcocoFigures' Spec; use with figureRig / figureAnchors)
// ---------------------------------------------------------------------------
export type DgKind = "soldier" | "commoner" | "king" | "minister" | "general";
const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };
export const DG_SPECS: Record<DgKind, Spec> = {
  soldier: MAN,
  commoner: MAN,
  king: { ...MAN, a: 58, hw: 47, H: 95, hipY: -153, limb: 1.03, headScale: 1.1, aged: true },
  minister: { ...MAN, a: 52, hw: 43, H: 95, hipY: -155, limb: 0.95, headScale: 1.06, aged: true, arm: [59, 56], leg: [71, 69] },
  general: { ...MAN, a: 60, hw: 49, H: 97, hipY: -154, limb: 1.08, headScale: 1.1, arm: [60, 57], leg: [71, 69] },
};
type Look = {
  robe: "knee" | "ankle";
  sleeve: "narrow" | "wide";
  head: "bun" | "crown" | "cap" | "helmet";
  beard: "none" | "goatee" | "long" | "short";
  /** the deep border at the hem, units */
  band: number;
  /** the sash's hanging ends below the belt, units */
  sash: number;
  waist: number;
  apron: boolean;
  cape: boolean;
  sword: boolean;
  vest: "none" | "plain" | "grand";
};
const LOOK: Record<DgKind, Look> = {
  soldier: { robe: "knee", sleeve: "narrow", head: "bun", beard: "none", band: 7, sash: 36, waist: 30, apron: false, cape: false, sword: false, vest: "plain" },
  commoner: { robe: "knee", sleeve: "narrow", head: "bun", beard: "none", band: 5, sash: 36, waist: 30, apron: false, cape: false, sword: false, vest: "plain" },
  king: { robe: "ankle", sleeve: "wide", head: "crown", beard: "goatee", band: 13, sash: 118, waist: 33, apron: true, cape: false, sword: false, vest: "none" },
  minister: { robe: "ankle", sleeve: "wide", head: "cap", beard: "long", band: 9, sash: 92, waist: 32, apron: false, cape: false, sword: false, vest: "none" },
  general: { robe: "knee", sleeve: "narrow", head: "helmet", beard: "short", band: 8, sash: 40, waist: 31, apron: false, cape: true, sword: true, vest: "grand" },
};

// ---------------------------------------------------------------------------
// WEAPONS: lengths and where the main fist holds them (units from the butt)
// ---------------------------------------------------------------------------
export type PoleKind = "ge" | "spear" | "banner";
export type WeaponKind = PoleKind | "none";
/** the ge is ~1.6 x a man */
export const POLE_LEN: Record<PoleKind, number> = { ge: 500, spear: 480, banner: 540 };
/** the main fist sits this far up the shaft from the butt (default; override with gripAt) */
export const GRIP_AT: Record<PoleKind, number> = { ge: 175, spear: 170, banner: 190 };
/** the shield's size, units (centre = shieldAt) */
export const SHIELD_W = 76;
export const SHIELD_H = 152;

export type GearOpts = {
  weapon?: WeaponKind;
  /** which fist holds the weapon: "near" (default; the rear hand of the two-handed poses) or "far" (default when a shield is on the near arm) */
  weaponArm?: "near" | "far";
  gripAt?: number;
  shield?: boolean;
};
const gear = (sp: Spec, q: FigPose, o: GearOpts = {}) => {
  const r = figureRig(sp, q);
  const G = r.s >= 0 ? 1 : -1;
  const nearKey: "L" | "R" = r.s >= 0 ? "L" : "R";
  const farKey: "L" | "R" = nearKey === "L" ? "R" : "L";
  const wArm: "L" | "R" = (o.weaponArm ?? (o.shield ? "far" : "near")) === "near" ? nearKey : farKey;
  const sArm: "L" | "R" = wArm === "L" ? "R" : "L";
  const ma = wArm === "L" ? r.armL : r.armR;
  const oa = wArm === "L" ? r.armR : r.armL;
  const grip = add(ma.W, mul(ma.dir, 10 * sp.limb));
  const v = rot(ma.dir, -90 * G);
  const kind = o.weapon ?? "none";
  const L = kind === "none" ? 0 : POLE_LEN[kind];
  const g0 = kind === "none" ? 0 : o.gripAt ?? GRIP_AT[kind];
  return {
    r,
    G,
    nearKey,
    farKey,
    wArm,
    sArm,
    ma,
    oa,
    grip,
    v,
    angle: (Math.atan2(v[0], -v[1]) * 180) / Math.PI,
    tip: add(grip, mul(v, L - g0)),
    butt: add(grip, mul(v, -g0)),
    head: add(grip, mul(v, L - g0 - 30)),
    shieldAt: add(mix2(oa.E, oa.W, 0.62), [0, 6]),
  };
};
/** the pose with the weapon fist turned so the weapon stands at `deg` (0 = tip straight up, + = clockwise on screen) */
export const aimWeapon = (q: FigPose, deg: number, kind: DgKind = "soldier", o: GearOpts = { weapon: "ge" }): FigPose => {
  const g = gear(DG_SPECS[kind], q, { weapon: "ge", ...o });
  const d = wrapDeg(deg - g.angle);
  return g.wArm === "L" ? { ...q, armL: { ...q.armL, hand: q.armL.hand + d } } : { ...q, armR: { ...q.armR, hand: q.armR.hand + d } };
};
/** the pose with the OTHER fist closed on the shaft `along` units ahead of the weapon fist (two-handed grip) */
export const onShaft = (q: FigPose, along: number, kind: DgKind = "soldier", o: GearOpts = { weapon: "ge" }): FigPose => {
  const sp = DG_SPECS[kind];
  let p = q;
  for (let it = 0; it < 5; it++) {
    const g = gear(sp, p, { weapon: "ge", ...o });
    const target = add(g.grip, mul(g.v, along));
    const fore = norm(sub(g.oa.W, g.oa.E));
    const a1 = rot(g.v, 90);
    const a2 = rot(g.v, -90);
    const want = dot(a1, fore) > dot(a2, fore) ? a1 : a2;
    const w = add(target, mul(want, -10 * sp.limb));
    const arm: ArmPose = { ...(g.wArm === "L" ? p.armR : p.armL), w, fist: 1, hand: signedDeg(fore, want) };
    p = g.wArm === "L" ? { ...p, armR: arm } : { ...p, armL: arm };
  }
  return p;
};

/** his anchors in WORLD px: figureAnchors' (headC, crown, headTop, shoulderL/R, wristL/R,
 *  handL/R, chest, hip, feet, rig) plus
 *    nearHand, farHand        the fists of the near / far arm
 *    grip, weaponAngle        the weapon fist and the weapon's angle (deg, 0 = tip up, + clockwise)
 *    tip, butt, weaponHead    the weapon's tip, its butt, the middle of its blade / flag
 *    shieldAt                 the shield's centre on the other forearm
 *    huAt                     the middle of the two fists (the minister's tablet)
 *    crownTop                 the middle of the king's crown board */
export const dgAnchors = (kind: DgKind, pose: FigPose, at: P2, scale: number, o: GearOpts = {}) => {
  const sp = DG_SPECS[kind];
  const A = figureAnchors(sp, pose, at, scale);
  const weapon = o.weapon ?? (kind === "soldier" ? "ge" : "none");
  const g = gear(sp, pose, { ...o, weapon });
  const w = (v: P2): P2 => add(at, mul(v, scale));
  const near = g.nearKey === "L" ? A.handL : A.handR;
  const far = g.nearKey === "L" ? A.handR : A.handL;
  const crown = add(g.r.headC, rot([-4 * Math.sin(pose.headYaw) * sp.headScale, -50 * sp.headScale], g.r.headAngle));
  return { ...A, nearHand: near, farHand: far, grip: w(g.grip), weaponAngle: g.angle, tip: w(g.tip), butt: w(g.butt), weaponHead: w(g.head), shieldAt: w(g.shieldAt), huAt: mix2(A.handL, A.handR, 0.5), crownTop: w(crown) };
};

// ---------------------------------------------------------------------------
// PROPS (local art; the free components are below)
// ---------------------------------------------------------------------------
/** a pole's shaft from its butt (y = yB) to its top (y = yT) */
const Shaft: React.FC<{ yB: number; yT: number; ink: Ink; w?: number }> = ({ yB, yT, ink, w = 7 }) => (
  <>
    <path d={limbD([[[0, yB], w], [[0, mix(yB, yT, 0.5)], w * 0.95], [[0, yT], w * 0.86]])} fill={ink.deep} {...OUT} strokeWidth={2.1} />
    <path d={`M1.7,${(yB - 6).toFixed(1)}L1.5,${(yT + 6).toFixed(1)}`} {...ln(0.9, 0.5)} />
    {/* the bronze ferrule at the butt */}
    <path d={limbD([[[0, yB - 20], 9.2], [[0, yB - 4], 8.6], [[0, yB + 2], 6.4]])} fill={ink.main} {...OUT} strokeWidth={2} />
    <path d={`M-4,${(yB - 15).toFixed(1)}h8M-4,${(yB - 10).toFixed(1)}h8`} {...ln(1, 0.7)} />
  </>
);
/** the ge: grip at (0, 0), the shaft along - y, the blade toward + x */
const GeArt: React.FC<{ ink: Ink; gripAt: number; uid: string }> = ({ ink, gripAt, uid }) => {
  const yB = gripAt;
  const yT = -(POLE_LEN.ge - gripAt);
  const yr = yT + 30;
  const f = (v: number) => v.toFixed(1);
  // the yuan (the blade) forward and slightly drooping, the hu running down the shaft, the nei (tang) behind
  const BLADE = `M2.5,${f(yr - 9)}C26,${f(yr - 15)} 54,${f(yr - 11)} 78,${f(yr + 4)}C56,${f(yr + 4)} 33,${f(yr + 7)} 15,${f(yr + 11)}C12,${f(yr + 24)} 11,${f(yr + 36)} 10,${f(yr + 48)}Q5.5,${f(yr + 54)} 2.5,${f(yr + 48)}Z`;
  const NEI = `M-2.5,${f(yr - 7)}L-24,${f(yr - 10)}Q-27,${f(yr - 4)} -24,${f(yr + 2)}L-2.5,${f(yr + 3)}Z`;
  return (
    <g>
      <Shaft yB={yB} yT={yT} ink={ink} />
      <circle cx={0} cy={yT + 1} r={4.6} fill={ink.main} {...OUT} strokeWidth={1.9} />
      <path d={NEI} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={`M-21,${f(yr - 6)}L-21,${f(yr)}`} {...ln(1, 0.6)} />
      <clipPath id={`${uid}-bl`}>
        <path d={BLADE} />
      </clipPath>
      <path d={BLADE} fill={ink.main} {...OUT} strokeWidth={2.3} />
      <g clipPath={`url(#${uid}-bl)`}>
        <path d={hatchD(0, yr - 1, 80, yr + 13, 118, 2.3, 701, 0.15)} {...ln(0.9, 0.6)} />
        <path d={hatchD(4, yr + 8, 16, yr + 50, 100, 2.4, 702, 0.1)} {...ln(0.85, 0.55)} />
      </g>
      <path d={`M8,${f(yr - 2)}C32,${f(yr - 6)} 55,${f(yr - 4)} 73,${f(yr + 3)}`} {...ln(1.2, 0.75)} />
      {/* the lashing over the hu */}
      {[10, 22, 34].map((o) => (
        <path key={o} d={limbD([[[-5.5, yr + o], 4], [[12.5, yr + o + 1.6], 4]])} fill={ink.main} {...OUT} strokeWidth={1.6} />
      ))}
    </g>
  );
};
/** the spear (mao): a leaf-shaped bronze point on a socket */
const SpearArt: React.FC<{ ink: Ink; gripAt: number; uid: string }> = ({ ink, gripAt, uid }) => {
  const yB = gripAt;
  const yT = -(POLE_LEN.spear - gripAt);
  const f = (v: number) => v.toFixed(1);
  const LEAF = `M0,${f(yT - 40)}C8,${f(yT - 24)} 10.5,${f(yT - 6)} 5,${f(yT + 10)}L-5,${f(yT + 10)}C-10.5,${f(yT - 6)} -8,${f(yT - 24)} 0,${f(yT - 40)}Z`;
  return (
    <g>
      <Shaft yB={yB} yT={yT + 12} ink={ink} />
      <path d={limbD([[[0, yT + 30], 9.4], [[0, yT + 8], 7.6]])} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={`M-4.4,${f(yT + 24)}h8.8M-4.2,${f(yT + 18)}h8.4`} {...ln(1, 0.7)} />
      <clipPath id={`${uid}-lf`}>
        <path d={LEAF} />
      </clipPath>
      <path d={LEAF} fill={ink.main} {...OUT} strokeWidth={2.2} />
      <g clipPath={`url(#${uid}-lf)`}>
        <path d={hatchD(0, yT - 40, 11, yT + 10, 100, 2.2, 711, 0.1)} {...ln(0.9, 0.6)} />
      </g>
      <path d={`M0,${f(yT - 36)}L0,${f(yT + 8)}`} {...ln(1.2, 0.8)} />
    </g>
  );
};
/** the banner: a tall pole, a spear finial, an upright flag on the pole with a toothed (flame) fringe; wave = phase (cycles) */
const BannerArt: React.FC<{ ink: Ink; gripAt: number; wave: number; uid: string }> = ({ ink, gripAt, wave, uid }) => {
  const yB = gripAt;
  const yT = -(POLE_LEN.banner - gripAt);
  const W = 124;
  const H = 176;
  const top = yT + 26;
  const ph = wave * 2 * Math.PI;
  const fl = (u: number, v: number): P2 => {
    const wv = Math.sin(u * 4.4 - ph + v * 0.9);
    return [4 + u * W * (1 - 0.035 * (1 + Math.cos(u * 4.4 - ph))), top + v * H + u * (9 + 8 * wv) + 4 * u * u];
  };
  const n = 14;
  const fly = Array.from({ length: 2 * n + 1 }, (_, j): P2 => fl(j % 2 ? 1.075 : 1, j / (2 * n)));
  const bot = Array.from({ length: 13 }, (_, j): P2 => fl(1 - j / 12, j % 2 ? 1.06 : 1));
  const topE = Array.from({ length: 9 }, (_, j): P2 => fl(j / 8, 0));
  const FLAG = polyD([...topE, ...fly, ...bot, fl(0, 1)]);
  const inner = (e: number) => polyD([...Array.from({ length: 9 }, (_, j): P2 => fl(e + (j / 8) * (1 - 2 * e), e * 0.8)), ...Array.from({ length: 9 }, (_, j): P2 => fl(1 - e, e * 0.8 + (j / 8) * (1 - 1.6 * e))), ...Array.from({ length: 9 }, (_, j): P2 => fl(1 - e - (j / 8) * (1 - 2 * e), 1 - e * 0.8)), ...Array.from({ length: 9 }, (_, j): P2 => fl(e, 1 - e * 0.8 - (j / 8) * (1 - 1.6 * e)))]);
  return (
    <g>
      <Shaft yB={yB} yT={yT + 10} ink={ink} w={7.4} />
      <path d={`M0,${(yT - 26).toFixed(1)}C5,${(yT - 14).toFixed(1)} 6,${(yT - 2).toFixed(1)} 3.6,${(yT + 10).toFixed(1)}L-3.6,${(yT + 10).toFixed(1)}C-6,${(yT - 2).toFixed(1)} -5,${(yT - 14).toFixed(1)} 0,${(yT - 26).toFixed(1)}Z`} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={limbD([[[-8, yT + 14], 5], [[8, yT + 14], 5]])} fill={ink.deep} {...OUT} strokeWidth={1.7} />
      <clipPath id={`${uid}-fl`}>
        <path d={FLAG} />
      </clipPath>
      <path d={FLAG} fill={ink.main} {...OUT} strokeWidth={2.3} />
      <g clipPath={`url(#${uid}-fl)`}>
        <path d={inner(0.07)} fill="none" stroke={ink.deep} strokeWidth={9} />
        <path d={inner(0.07)} {...ln(1.1, 0.7)} />
        <path d={inner(0.12)} {...ln(1, 0.6)} />
        {/* the folds: shade where the cloth turns away */}
        {Array.from({ length: 22 }, (_, i) => {
          const u = (i + 0.5) / 22;
          const sh = -Math.cos(u * 4.4 - ph);
          if (sh < 0.15) return null;
          return <path key={i} d={`M${P(fl(u, 0.02))}L${P(fl(u, 0.98))}`} {...ln(1, 0.55 * sh)} />;
        })}
      </g>
      {/* the ties to the pole */}
      {[0.12, 0.42, 0.72].map((v) => (
        <path key={v} d={limbD([[[-5.5, top + v * H], 4.2], [[6.5, top + v * H + 1], 4.2]])} fill={ink.deep} {...OUT} strokeWidth={1.6} />
      ))}
    </g>
  );
};
/** the dun: a tall lacquered shield with a rounded top, a raised spine and a band of lozenges */
const ShieldArt: React.FC<{ ink: Ink; uid: string }> = ({ ink, uid }) => {
  const w = SHIELD_W / 2;
  const h = SHIELD_H / 2;
  const S = `M${-w},${h - 12}L${-w},${-h + 30}C${-w},${-h + 8} ${-w + 12},${-h - 2} 0,${-h - 4}C${w - 12},${-h - 2} ${w},${-h + 8} ${w},${-h + 30}L${w},${h - 12}Q${w},${h} ${w - 12},${h}L${-w + 12},${h}Q${-w},${h} ${-w},${h - 12}Z`;
  const zig = Array.from({ length: 9 }, (_, i): P2 => [-w + 6 + (i * (2 * w - 12)) / 8, i % 2 ? -6 : 6]);
  return (
    <g>
      <clipPath id={`${uid}-s`}>
        <path d={S} />
      </clipPath>
      <path d={S} fill={ink.main} {...OUT} strokeWidth={2.6} />
      <g clipPath={`url(#${uid}-s)`}>
        <path d={S} fill="none" stroke={ink.deep} strokeWidth={13} />
        <path d={hatchD(w * 0.25, -h - 6, w + 2, h + 2, 112, 2.8, 721)} {...ln(0.95, 0.55)} />
        <path d={hatchD(w * 0.55, -h, w + 2, h + 2, 60, 3.4, 722)} {...ln(0.9, 0.4)} />
        {/* the band across the middle: lozenges */}
        <rect x={-w - 2} y={-12} width={2 * w + 4} height={24} fill={ink.deep} stroke={DARK} strokeWidth={1.3} strokeOpacity={0.85} />
        <path d={`M${zig.map(P).join("L")}`} fill="none" stroke={ink.main} strokeWidth={2.6} strokeLinejoin="round" />
        <path d={`M${zig.map((p) => P([p[0], -p[1]])).join("L")}`} fill="none" stroke={ink.main} strokeWidth={2.6} strokeLinejoin="round" />
        <path d={`M${-w + 3},${-h + 34}Q0,${-h + 26} ${w - 3},${-h + 34}M${-w + 3},${h - 26}Q0,${h - 30} ${w - 3},${h - 26}`} {...ln(1.3, 0.75)} />
      </g>
      <path d={S} {...ln(1, 0.55)} transform="scale(0.84 0.9)" />
      {/* the spine */}
      <path d={limbD([[[0, -h + 2], 6], [[0, 0], 7], [[0, h - 3], 6]])} fill={ink.main} {...OUT} strokeWidth={1.8} />
      <path d={`M1.6,${-h + 8}L1.6,${h - 8}`} {...ln(0.9, 0.5)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FREE PROPS (world px)
// ---------------------------------------------------------------------------
type PoleProps = {
  /** the grip (world px): the point `gripAt` units up the shaft from the butt */
  at: P2;
  scale: number;
  /** deg: 0 = tip straight up, + = clockwise (90 = pointing right) */
  angle?: number;
  /** 1 = the blade / flag on the side the tip turns toward when angle > 0 (right), -1 = the other */
  dir?: 1 | -1;
  gripAt?: number;
  tone?: number;
  ink?: Ink;
  uid?: string;
};
const PoleG: React.FC<PoleProps & { children: React.ReactNode; uid: string }> = ({ at, scale, angle = 0, dir = 1, tone = 1, uid, children }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${(scale * dir).toFixed(4)} ${scale.toFixed(4)})`} opacity={tone}>
    <Cased id={`${uid}-case`} r={1.4}>
      {children}
    </Cased>
  </g>
);
/** the ge (dagger-axe) as a free object; at = the grip; lying on the ground: angle 90 (dir -1 lays the blade down) */
export const Ge: React.FC<PoleProps> = ({ ink = CREAM, uid = "ge", gripAt = GRIP_AT.ge, ...p }) => (
  <PoleG {...p} uid={uid}>
    <GeArt ink={ink} gripAt={gripAt} uid={uid} />
  </PoleG>
);
export const Spear: React.FC<PoleProps> = ({ ink = CREAM, uid = "spr", gripAt = GRIP_AT.spear, ...p }) => (
  <PoleG {...p} uid={uid}>
    <SpearArt ink={ink} gripAt={gripAt} uid={uid} />
  </PoleG>
);
/** the banner; wave = phase in cycles (advance ~0.03-0.05 per frame for a live flag) */
export const Banner: React.FC<PoleProps & { wave?: number }> = ({ ink = CREAM, uid = "ban", gripAt = GRIP_AT.banner, wave = 0, ...p }) => (
  <PoleG {...p} uid={uid}>
    <BannerArt ink={ink} gripAt={gripAt} wave={wave} uid={uid} />
  </PoleG>
);
/** the shield as a free object: at = its centre, lying 0..1 lays it flat on its back */
export const Shield: React.FC<{ at: P2; scale: number; rot?: number; lying?: number; tone?: number; ink?: Ink; uid?: string }> = ({ at, scale, rot: r = 0, lying = 0, tone = 1, ink = CREAM, uid = "dun" }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${r.toFixed(2)}) scale(${scale.toFixed(4)} ${(scale * (1 - 0.7 * c01(lying))).toFixed(4)})`} opacity={tone}>
    <Cased id={`${uid}-case`} r={1.4}>
      <ShieldArt ink={ink} uid={uid} />
    </Cased>
  </g>
);

/** the throne: a low dais (300 x 46 units, its top seen a little from above) and a three-leaf screen behind it.
 *  at = the middle of the dais' front edge on the ground. Seat a figure at throneSeat(at, scale). */
export const THRONE = { w: 300, h: 46, depth: 30, screenH: 300 };
export const throneSeat = (at: P2, scale: number): P2 => [at[0], at[1] - (THRONE.h + THRONE.depth * 0.42) * scale];
export const Throne: React.FC<{ at: P2; scale: number; tone?: number; ink?: Ink; uid?: string; screen?: boolean }> = ({ at, scale, tone = 1, ink = CREAM, uid = "thr", screen = true }) => {
  const W = THRONE.w / 2;
  const h = THRONE.h;
  const D = THRONE.depth;
  const yb = -h - D;
  const SH = THRONE.screenH;
  const leaf = (x0: number, x1: number, y0: number, y1: number, key: string, skew: number) => {
    const pts: P2[] = [[x0, y1], [x0, y0 + skew], [x1, y0], [x1, y1 - skew * 0]];
    const inn: P2[] = [[x0 + 11, y1 - 12], [x0 + 11, y0 + skew + 13], [x1 - 11, y0 + 13], [x1 - 11, y1 - 12]];
    return (
      <g key={key}>
        <path d={polyD(pts)} fill={ink.deep} {...OUT} strokeWidth={2.4} />
        <clipPath id={`${uid}-${key}`}>
          <path d={polyD(inn)} />
        </clipPath>
        <path d={polyD(inn)} fill={ink.main} {...OUT} strokeWidth={1.8} />
        <g clipPath={`url(#${uid}-${key})`}>
          {/* a lattice of lozenges, the shaded half hatched */}
          <path d={hatchD(x0, y0, x1, y1, 55, 17, 731, 0) + hatchD(x0, y0, x1, y1, 125, 17, 732, 0)} {...ln(1.2, 0.62)} />
          <path d={hatchD(mix(x0, x1, 0.55), y0, x1, y1, 100, 3, 733)} {...ln(0.85, 0.42)} />
        </g>
        <path d={`M${x0 + 11},${y0 + skew + 34}L${x1 - 11},${y0 + 34}`} {...ln(1.3, 0.75)} />
      </g>
    );
  };
  const panels = [-1, 0, 1].map((i) => {
    const x0 = i * 96 - 40;
    return (
      <g key={i}>
        <rect x={x0} y={-h + 10} width={80} height={h - 22} rx={9} fill="none" stroke={DARK} strokeWidth={1.4} strokeOpacity={0.75} />
        <path d={`M${x0 + 14},${-h / 2 - 2}q12,-10 26,0t26,0`} {...ln(1.2, 0.65)} />
      </g>
    );
  });
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
      <Cased id={`${uid}-case`} r={1.5}>
        {screen ? (
          <>
            {leaf(-W - 18, -W + 70, yb - SH + 26, yb + 2, "l", 14)}
            {leaf(W - 70, W + 18, yb - SH + 26, yb + 2, "r", -14)}
            {leaf(-W + 62, W - 62, yb - SH, yb + 2, "c", 0)}
            {/* the crest rail over the middle leaf */}
            <path d={limbD([[[-W + 52, yb - SH - 4], 12], [[W - 52, yb - SH - 4], 12]])} fill={ink.main} {...OUT} strokeWidth={2} />
            <path d={Array.from({ length: 12 }, (_, i) => `M${(-W + 62 + i * 15).toFixed(1)},${yb - SH - 8}v6h7v-6`).join("")} {...ln(1.1, 0.7)} />
          </>
        ) : null}
        {/* the dais: its top, its front with sunk panels, its feet */}
        <path d={polyD([[-W + 8, -h - D], [W - 8, -h - D], [W, -h], [-W, -h]])} fill={ink.main} {...OUT} strokeWidth={2.4} />
        <path d={hatchD(-W + 10, -h - D + 3, W - 10, -h - 3, 4, 3.6, 741, 0.3)} {...ln(0.8, 0.35)} />
        <path d={polyD([[-W, -h], [W, -h], [W, -8], [-W, -8]])} fill={ink.main} {...OUT} strokeWidth={2.4} />
        <path d={`M${-W + 4},${-h + 6}H${W - 4}`} {...ln(1.2, 0.7)} />
        {panels}
        <path d={hatchD(W * 0.35, -h + 2, W, -8, 112, 3, 742)} {...ln(0.85, 0.45)} />
        {[-1, 1].map((sd) => (
          <path key={sd} d={polyD([[sd * W, -10], [sd * (W - 30), -10], [sd * (W - 24), 0], [sd * (W - 4), 0]])} fill={ink.deep} {...OUT} strokeWidth={2} />
        ))}
        <path d={polyD([[-22, -10], [22, -10], [16, 0], [-16, 0]])} fill={ink.deep} {...OUT} strokeWidth={2} />
      </Cased>
    </g>
  );
};
/** the low table (an): 170 x 48 units, curved legs. at = the middle of its front edge on the ground; tableTop(at, scale) = its front top edge */
export const TABLE = { w: 170, h: 48, depth: 22 };
export const tableTop = (at: P2, scale: number): P2 => [at[0], at[1] - (TABLE.h + TABLE.depth * 0.5) * scale];
export const LowTable: React.FC<{ at: P2; scale: number; tone?: number; ink?: Ink; uid?: string }> = ({ at, scale, tone = 1, ink = CREAM, uid = "tab" }) => {
  const W = TABLE.w / 2;
  const h = TABLE.h;
  const D = TABLE.depth;
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
      <Cased id={`${uid}-case`} r={1.4}>
        {[-1, 1].map((sd) => (
          <g key={sd}>
            {/* the back leg, then the front leg: an outward curve ending in a scrolled foot */}
            <path d={limbD([[[sd * (W - 30), -h - D + 6], 9], [[sd * (W - 22), -h * 0.5 - D * 0.6], 8], [[sd * (W - 12), -D * 0.55], 7]])} fill={ink.deep} {...OUT} strokeWidth={2} />
            <path d={limbD([[[sd * (W - 16), -h + 4], 11], [[sd * (W - 8), -h * 0.45], 9.6], [[sd * (W + 2), -3], 8.4]])} fill={ink.main} {...OUT} strokeWidth={2.1} />
            <path d={`M${sd * (W + 2) - 6},0q${sd * 8},2 ${sd * 13},-5`} {...ln(1.3, 0.8)} />
            <path d={braceletD([sd * (W - 16), -h + 6], [sd * (W + 1), -6], 11, 8.4, 751 + sd, 3.2)} {...ln(0.85, 0.5)} />
          </g>
        ))}
        <path d={polyD([[-W + 6, -h - D], [W - 6, -h - D], [W, -h], [-W, -h]])} fill={ink.main} {...OUT} strokeWidth={2.3} />
        <path d={hatchD(-W + 8, -h - D + 2, W - 8, -h - 2, 2, 3.4, 752, 0.3)} {...ln(0.8, 0.35)} />
        <path d={polyD([[-W, -h], [W, -h], [W, -h + 9], [-W, -h + 9]])} fill={ink.deep} {...OUT} strokeWidth={2.2} />
        <path d={`M${-W + 3},${-h + 4.5}H${W - 3}`} {...ln(0.9, 0.55)} />
      </Cased>
    </g>
  );
};
/** a bamboo-slip scroll: open 0..1 unrolls it to the right of `at` (the middle of its first slip);
 *  len = slips' length (units); slips = how many when fully open. No writing: faint marks only (marks={false} removes them). */
export const Scroll: React.FC<{ at: P2; scale: number; open?: number; rot?: number; len?: number; slips?: number; marks?: boolean; tone?: number; ink?: Ink; uid?: string }> = ({
  at,
  scale,
  open = 1,
  rot: r = 0,
  len = 66,
  slips = 20,
  marks = true,
  tone = 1,
  ink = CREAM,
  uid = "scr",
}) => {
  const o = c01(open);
  const sw = 6.4;
  const Wfull = slips * sw;
  const x1 = Wfull * o;
  const R = 4.5 + 9 * (1 - o);
  const h = len / 2;
  const n = Math.floor(x1 / sw);
  const cords = [-h * 0.42, h * 0.42];
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${r.toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
      <Cased id={`${uid}-case`} r={1.3}>
        {x1 > 1 ? (
          <>
            <rect x={-2} y={-h} width={x1 + 2} height={len} fill={ink.main} stroke={DARK} strokeWidth={2.2} strokeLinejoin="round" />
            <path d={Array.from({ length: n }, (_, i) => `M${(i * sw + sw).toFixed(1)},${-h + 1}V${h - 1}`).join("")} {...ln(1.1, 0.72)} />
            <path d={hatchD(0, -h, x1, h, 96, 2.6, 761, 0.4)} {...ln(0.7, 0.22)} />
            {marks
              ? Array.from({ length: n }, (_, i) =>
                  Array.from({ length: 6 }, (_, j) => {
                    const y = -h + 8 + j * (len - 16) / 6 + 2 * hash(i * 7 + j, 762);
                    if (Math.abs(y - cords[0]) < 3 || Math.abs(y - cords[1]) < 3 || hash(i * 7 + j, 763) < 0.25) return null;
                    return <path key={`${i}-${j}`} d={`M${(i * sw + sw / 2).toFixed(1)},${y.toFixed(1)}v${(2.4 + 2.4 * hash(i, j)).toFixed(1)}`} {...ln(1.2, 0.4)} />;
                  }),
                )
              : null}
            {cords.map((y, i) => (
              <path key={i} d={`M-3,${y}Q${(x1 / 2).toFixed(1)},${y + 1.5} ${x1.toFixed(1)},${y}`} fill="none" stroke={DARK} strokeWidth={1.8} strokeOpacity={0.85} />
            ))}
          </>
        ) : null}
        {/* the roll */}
        <rect x={x1 - R * 0.4} y={-h - 2} width={R * 2} height={len + 4} rx={R} fill={ink.deep} stroke={DARK} strokeWidth={2.2} />
        <path d={[0.35, 0.7].map((u) => `M${(x1 - R * 0.4 + u * R * 2).toFixed(1)},${-h}V${h}`).join("")} {...ln(1, 0.55)} />
        {cords.map((y, i) => (
          <path key={i} d={`M${(x1 - R * 0.4).toFixed(1)},${y}h${(R * 2).toFixed(1)}`} {...ln(1.6, 0.8)} />
        ))}
      </Cased>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SHOE: square-toed cloth shoes with a turned-up toe (over the rig's foot frame)
// ---------------------------------------------------------------------------
const SHOE_F: P2[] = [[-7.4, -2], [7.4, -2], [10.6, 5.5], [12.4, 9.5], [12.8, 13], [12, 19], [0, 19.8], [-12, 19], [-12.6, 13.5], [-10.6, 5.5]];
const SHOE_P: P2[] = [[-7.6, -2], [7.6, -2], [15.5, 6.2], [26.5, 9], [32.5, 5.5], [32, 18.8], [8, 19.8], [-10, 19.2], [-12.6, 11], [-10, 2.5]];
const Shoe: React.FC<{ A: P2; sgn: number; yaw: number; lift: number; k: number; ink: Ink }> = ({ A, sgn, yaw, lift, k, ink }) => {
  const c = Math.cos(yaw);
  const t = Math.abs(Math.sin(yaw));
  const out = sgn * 4.5 * c;
  const pts = blendYaw(SHOE_F, SHOE_P, yaw).map((p, i): P2 => (i < 2 ? p : [p[0] + out, p[1]]));
  return (
    <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) rotate(${lift.toFixed(2)}) scale(${k.toFixed(3)})`}>
      <path d={smoothClosed(pts)} fill={ink.deep} {...OUT} strokeWidth={2.1} />
      <path d={`M${P(pts[7])}Q${P([pts[6][0], pts[6][1] - 3.6])} ${P(pts[5])}`} {...ln(1.4, 0.8)} />
      <path d={`M${P(mix2(pts[1], pts[2], 0.5))}Q${P(mix2(pts[2], pts[3], 0.8))} ${P(mix2(pts[4], pts[5], 0.3))}`} {...ln(1.1, 0.6 * t + 0.2)} />
      <path d={`M-7,1.5h14`} {...ln(1.3, 0.75)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FIGURE
// ---------------------------------------------------------------------------
export type DgFigureProps = {
  kind: DgKind;
  pose: FigPose;
  /** his feet, world px, and px per unit (a man is ~310 units: 300 px tall = 0.97) */
  at: P2;
  scale: number;
  uid: string;
  /** CREAM (default) / ORANGE / shadeInk(t) */
  ink?: Ink;
  tone?: number;
  /** soldier / commoner: 0 = the plain robe, 1 = the lamellar vest and shoulder guards, wiped on from the shoulders down (default 1 soldier, 0 commoner) */
  armed?: number;
  /** what he holds in his fist (default: "ge" for the soldier, nothing for the rest) */
  weapon?: WeaponKind;
  weaponArm?: "near" | "far";
  /** units from the butt to the weapon fist (default GRIP_AT[weapon]) */
  gripAt?: number;
  /** the shield on the near forearm (the weapon then goes to the far fist) */
  shield?: boolean;
  /** the weapon's and shield's ink (default: the figure's) */
  gearInk?: Ink;
  /** the banner's phase, cycles */
  wave?: number;
  /** the minister's tablet (default true for the minister) */
  hu?: boolean;
  /** small differences between men in a crowd: moustache or not, the knot's place */
  seed?: number;
};
export const DgFigure: React.FC<DgFigureProps> = (props) => {
  const { kind, pose: q, at, scale, uid, tone = 1, seed = 0 } = props;
  const sp = DG_SPECS[kind];
  const look = LOOK[kind];
  const ink = props.ink ?? CREAM;
  const gInk = props.gearInk ?? ink;
  const plain = kind === "soldier" || kind === "commoner";
  const armed = plain ? c01(props.armed ?? (kind === "soldier" ? 1 : 0)) : look.vest === "none" ? 0 : 1;
  const weapon: WeaponKind = props.weapon ?? (kind === "soldier" ? "ge" : "none");
  const shield = props.shield ?? false;
  const hasHu = props.hu ?? kind === "minister";
  const g = gear(sp, q, { weapon, weaponArm: props.weaponArm, gripAt: props.gripAt, shield });
  const r = g.r;
  const { c, s } = r;
  const k = sp.limb;
  const hw = sp.hw;
  const shY = r.shY;
  const sfT = surface(q.yaw, hw * 0.94, hw * 0.94 * 0.58);
  const { side } = sfT;
  const mT = sfT.mF;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`;
  const headTf = `translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${sp.headScale})`;
  const wPt = (v: P2): P2 => add(at, mul(v, scale));
  const shL: P2 = [-hw, shY];
  const shR: P2 = [hw, shY];
  const neck: P2 = [0, shY];
  const wst = look.waist;
  const profile = Math.abs(s) > 0.5;
  const G = g.G;
  /** the wipe that puts the vest on (torso frame y) */
  const yW = mix(shY - 22, 44, armed);
  const yWfig = r.hip[1] + yW;

  // ---- legs: trousers to the knee, puttees to the ankle, square-toed shoes -------------
  const legs = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);
  const legEl = (l: typeof r.legL) => {
    const u = norm(sub(l.A, l.K));
    const n: P2 = [-u[1], u[0]];
    const ws = [17.5, 18.8, 14.2, 12.6].map((w) => w * k);
    const ts = [0.02, 0.36, 0.74, 0.97];
    const wAt = (t: number) => (t < ts[1] ? mix(ws[0], ws[1], (t - ts[0]) / (ts[1] - ts[0])) : t < ts[2] ? mix(ws[1], ws[2], (t - ts[1]) / (ts[2] - ts[1])) : mix(ws[2], ws[3], (t - ts[2]) / (ts[3] - ts[2])));
    let wraps = "";
    for (let t = 0.15; t < 0.9; t += 0.082) {
      const p = mix2(l.K, l.A, t);
      const w = wAt(t) / 2 - 0.6;
      wraps += `M${P(add(p, mul(n, -w)))}L${P(add(add(p, mul(n, w)), mul(u, 4.6)))}`;
    }
    const gt = mix2(l.K, l.A, 0.1);
    return (
      <g key={l.sgn}>
        <path d={limbD([[l.H, 25 * k], [mix2(l.H, l.K, 0.5), 23 * k], [l.K, 18.5 * k]])} fill={ink.main} {...OUT} />
        <path d={braceletD(l.H, l.K, 24 * k, 18 * k, 81 + l.sgn, 3)} {...ln(0.95, 0.6)} />
        <path d={limbD(ts.map((t, i): St => [mix2(l.K, l.A, t), ws[i]]))} fill={ink.main} {...OUT} />
        <path d={wraps} {...ln(1.15, 0.72)} />
        <path d={braceletD(l.K, l.A, 18 * k, 12.5 * k, 83 + l.sgn, 3.4, 0.6)} {...ln(0.85, 0.42)} />
        <path d={limbD([[add(gt, mul(n, -10.5 * k)), 5], [add(gt, mul(n, 10.5 * k)), 5]])} fill={ink.deep} {...OUT} strokeWidth={1.7} />
        <Shoe A={l.A} sgn={l.sgn} yaw={q.yaw} lift={l.lift} k={k} ink={ink} />
      </g>
    );
  };

  // ---- the robe's skirt: it hangs from the hips over the knees (and to the ankles) --------
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;
  const fl = (look.robe === "ankle" ? 17 : 10) * mix(1, 0.72, Math.abs(s));
  const waistPts = [-wst - 1, wst + 1].map((x) => r.toFig(side([x, -12])));
  const skPts: P2[] = [...waistPts];
  for (const l of [r.legL, r.legR]) {
    skPts.push(...circ(l.H, 25 * k, 12), ...circ(mix2(l.H, l.K, 0.5), 23 * k, 10), ...circ(add(l.K, [hdx * 0.3, 0]), 19.5 * k, 10), ...circ(mix2(l.H, l.A, 0.5), 21 * k, 10));
    if (look.robe === "knee") {
      skPts.push(add(l.K, [-(21 + fl) * k + hdx, 17]), add(l.K, [(21 + fl) * k + hdx, 17]), add(l.K, [hdx, 19.5]));
    } else {
      skPts.push(...circ(add(mix2(l.K, l.A, 0.5), [hdx * 0.6, 0]), 19 * k, 8));
      skPts.push(add(l.A, [-(18 + fl) * k + hdx, -9]), add(l.A, [(18 + fl) * k + hdx, -9]), add(l.A, [hdx, -8]));
    }
  }
  const skClamped = skPts.map((p): P2 => [p[0], Math.min(p[1], -1.5)]);
  const skBones: Bone[] = [r.legL, r.legR].flatMap((l): Bone[] => [
    { a: l.H, b: l.K, r: 22 * k },
    { a: l.K, b: l.A, r: 17 * k },
  ]);
  const skHull = drape(hull(skClamped), skBones);
  const SK = smoothClosed(skHull);
  const skX0 = Math.min(...skHull.map((p) => p[0]));
  const skX1 = Math.max(...skHull.map((p) => p[0]));
  const skY0 = Math.min(...waistPts.map((p) => p[1]));
  const skY1 = Math.max(...skHull.map((p) => p[1]));
  const folds = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9].map((t, i) => {
    const hx = mix(skX0 + 7, skX1 - 7, t) + 4 * (hash(i, 801) - 0.5);
    const hy = bottomAt(skHull, hx) - look.band - 3;
    const wx = mix(waistPts[0][0], waistPts[1][0], mix(0.2, 0.8, t));
    const wy = skY0 + 26 + 8 * hash(i, 802);
    const a: P2 = [wx, wy];
    const b: P2 = [hx, hy];
    const cc: P2 = [mix(wx, hx, 0.35) + (t - 0.5) * 8 + hdx * 0.3, mix(wy, hy, 0.55)];
    return { a, b, c: cc, i };
  });
  const skirtEl = (
    <>
      <clipPath id={`${uid}-sk`}>
        <path d={SK} />
      </clipPath>
      <path d={SK} fill={look.band > 0 ? ink.deep : ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-sk)`}>
        <path d={SK} transform={`translate(0 ${-look.band})`} fill={ink.main} stroke={DARK} strokeWidth={1.4} strokeOpacity={0.8} />
        {look.band > 9 ? <path d={SK} transform={`translate(0 ${-look.band * 0.45})`} {...ln(1.1, 0.55)} /> : null}
        <path d={hatchD(mix(skX0, skX1, 0.62), skY0, skX1 + 4, skY1, 111, 3, 811)} {...ln(0.95, 0.55)} />
        <path d={hatchD(mix(skX0, skX1, 0.8), skY0 + 30, skX1 + 4, skY1, 62, 3.6, 812)} {...ln(0.9, 0.45)} />
        {folds.map((f) => (
          <path key={f.i} d={segD(foldHatchSegs(f.a, f.c, f.b, 820 + f.i, 8 + 4 * hash(f.i, 821)))} {...ln(0.9, 0.55)} />
        ))}
        <path d={folds.map((f) => `M${P(f.a)}Q${P(f.c)} ${P(f.b)}`).join("")} {...ln(1.4, 0.75)} />
      </g>
    </>
  );

  // ---- the robe's top: the crossed (y) collar, right over left; the belt and the sash ----------
  const TORSO =
    `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}` +
    `C${P(side([hw + 3, shY + 26]))} ${P(side([wst + 4, -52]))} ${P(side([wst + 1, -26]))}C${P(side([wst, -14]))} ${P(side([wst + 2, -4]))} ${P(side([wst + 2, 8]))}L${P(side([-wst - 2, 8]))}` +
    `C${P(side([-wst - 2, -4]))} ${P(side([-wst, -14]))} ${P(side([-wst - 1, -26]))}C${P(side([-wst - 4, -52]))} ${P(side([-hw - 3, shY + 26]))} ${P(side(add(shL, [1, -4])))}Z`;
  const band = (pts: P2[], w: number, n = 6) => limbD(pts.slice(1).flatMap((b, j) => Array.from({ length: n + (j === pts.length - 2 ? 1 : 0) }, (_, i): St => [mT(mix2(pts[j], b, i / n)), w])));
  const lapLong: P2[] = [[10, shY - 4], [3, shY + 16], [-3, shY + 31], [-(hw - 7), shY + 68]];
  const lapShort: P2[] = [[-10, shY - 4], [-6, shY + 16], [-1, shY + 30]];
  const cw = look.sleeve === "wide" ? 10 : 8;
  const fx = mT([0, -10])[0];
  const BELT = `M${P(side([-wst - 2.5, -20]))}Q${P([fx * 0.5, -16])} ${P(side([wst + 2.5, -20]))}L${P(side([wst + 3, -6]))}Q${P([fx * 0.5, -2])} ${P(side([-wst - 3, -6]))}Z`;
  const knot = mT([-7, -13]);
  const sw = q.hem * 0.5 + hdx * 0.4;
  const sashLen = Math.max(14, Math.min(look.sash, -6 - r.hip[1] - knot[1]));
  const sashEnd = (o: number, len: number, w: number) =>
    limbD([
      [add(knot, [o, 1]), w],
      [add(knot, [o + sw * 0.3 - 1, len * 0.5]), w + 0.6],
      [add(knot, [o + sw - 2, len]), w * 0.8],
    ]);
  const torsoBack = (
    <g transform={torsoTf}>
      <clipPath id={`${uid}-tor`}>
        <path d={TORSO} />
      </clipPath>
      <path d={TORSO} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-tor)`}>
        <path d={segD(hatchSegs(hw * 0.36, shY + 4, hw + 3, 10, 113, 2.8, 831), side)} {...ln(0.95, 0.6)} />
        <path d={segD(hatchSegs(hw * 0.55, shY + 34, hw + 3, 10, 60, 3.4, 832), side)} {...ln(0.9, 0.42)} />
        {/* the drape of the cloth from the shoulders to the belt */}
        <path d={[-1, 1].map((sd) => `M${P(mT([sd * (hw - 12), shY + 10]))}Q${P(mT([sd * 22, shY + 52]))} ${P(mT([sd * 12, -22]))}`).join("")} {...ln(1.2, 0.55)} />
        <path d={`M${P(mT([14, shY + 40]))}Q${P(mT([20, shY + 70]))} ${P(mT([24, -24]))}`} {...ln(1, 0.45)} />
      </g>
      {/* the collar's back, round the neck */}
      <path d={limbD([[side([-15, shY - 1]), cw], [side([0, shY - 8]), cw], [side([15, shY - 1]), cw]])} fill={ink.deep} {...OUT} strokeWidth={2} />
    </g>
  );
  const torsoFront = (
    <g transform={torsoTf}>
      {/* the lapels: the long one over (from his left neck to his right side), the short one under */}
      <path d={band(lapShort, cw)} fill={ink.deep} {...OUT} strokeWidth={2} />
      <path d={band(lapLong, cw)} fill={ink.deep} {...OUT} strokeWidth={2} />
      <path d={segD(subdivide(lapLong.slice(1).map((b, j): Seg => [add(lapLong[j], [4.5, 1.5]), add(b, [4.5, 1.5])]), 6), mT)} {...ln(0.9, 0.5)} />
      <path d={BELT} fill={ink.deep} {...OUT} />
      <path d={`M${P(side([-wst - 2.5, -13]))}Q${P([fx * 0.5, -9])} ${P(side([wst + 2.5, -13]))}`} {...ln(1, 0.55)} />
      {/* the sash: a knot and its two hanging ends */}
      <path d={sashEnd(-2, sashLen, 6.4)} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      <path d={sashEnd(5, sashLen * 0.86, 6.4)} fill={ink.main} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(knot)}l-9,-5.6q-4,3.6 -0.6,8ZM${P(knot)}l8.6,-5q4,4 0,8Z`} fill={ink.main} {...OUT} strokeWidth={1.8} />
      <circle cx={knot[0]} cy={knot[1]} r={4} fill={ink.deep} {...OUT} strokeWidth={1.8} />
    </g>
  );

  // ---- the lamellar vest (the wipe puts it on from the shoulders down) ---------------
  const grand = look.vest === "grand";
  const AW = grand ? 38 : 36;
  const aM = surface(q.yaw, AW + 2, (AW + 2) * 0.58).mF;
  const VEST =
    `M${P(side([-hw + 4, shY - 2]))}Q${P(side([-24, shY - 7]))} ${P(side([-14, shY - 4]))}Q${P(aM([0, shY + 18]))} ${P(side([14, shY - 4]))}Q${P(side([24, shY - 7]))} ${P(side([hw - 4, shY - 2]))}` +
    `C${P(side([hw + 1, shY + 16]))} ${P(side([hw - 10, shY + 26]))} ${P(side([hw - 8, shY + 40]))}L${P(side([AW, -16]))}L${P(side([AW + 1, 20]))}Q${P(aM([0, 34]))} ${P(side([-AW - 1, 20]))}L${P(side([-AW, -16]))}L${P(side([-hw + 8, shY + 40]))}` +
    `C${P(side([-hw + 10, shY + 26]))} ${P(side([-hw - 1, shY + 16]))} ${P(side([-hw + 4, shY - 2]))}Z`;
  const pw = grand ? 12.5 : 10.5;
  const ph = grand ? 11 : 9.6;
  const rows: number[] = [];
  for (let y = shY + 8; y < 30; y += ph) rows.push(y);
  const sag = (x: number, y: number): P2 => [x, y + 2.2 * (1 - (x / (AW + 6)) ** 2)];
  const rowD = rows.map((y) => segD(subdivide([[sag(-AW - 6, y), sag(0, y)], [sag(0, y), sag(AW + 6, y)]], 6), aM)).join("");
  const joinSegs: Seg[] = [];
  const rivets: P2[] = [];
  rows.forEach((y, i) => {
    for (let x = -AW - 6 + (i % 2) * pw * 0.5; x < AW + 6; x += pw) {
      joinSegs.push([sag(x, y + 1), sag(x, y + ph)]);
      if (x + pw * 0.5 < AW + 2) rivets.push(aM(sag(x + pw * 0.5, y + 3)));
    }
  });
  const vestEl =
    armed > 0.001 ? (
      <g transform={torsoTf}>
        <clipPath id={`${uid}-vw`}>
          <rect x={-400} y={-600} width={800} height={armed >= 0.999 ? 1200 : yW + 600} />
        </clipPath>
        <clipPath id={`${uid}-vest`}>
          <path d={VEST} />
        </clipPath>
        <g clipPath={`url(#${uid}-vw)`}>
          <path d={VEST} fill={ink.main} {...OUT} strokeWidth={2.5} />
          <g clipPath={`url(#${uid}-vest)`}>
            {grand ? <path d={VEST} fill="none" stroke={ink.deep} strokeWidth={13} /> : null}
            <path d={segD(hatchSegs(AW * 0.42, shY, AW + 4, 36, 113, 2.8, 841), side)} {...ln(0.9, 0.5)} />
            <path d={rowD} {...ln(1.35, 0.8)} />
            <path d={segD(joinSegs, aM)} {...ln(1.05, 0.62)} />
            {rivets.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r={1.25} fill={DARK} opacity={0.7} />
            ))}
                      </g>
          {grand ? (
            <>
              {/* the general's belt over the armour, with its hook */}
              <path d={`M${P(side([-AW - 2, -10]))}Q${P([fx * 0.5, -6])} ${P(side([AW + 2, -10]))}L${P(side([AW + 2.5, 2]))}Q${P([fx * 0.5, 6])} ${P(side([-AW - 2.5, 2]))}Z`} fill={ink.deep} {...OUT} />
              <path d={limbD([[mT([-9, -4]), 7.6], [mT([9, -4]), 7.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
            </>
          ) : null}
        </g>
      </g>
    ) : null;

  // ---- the arms: the rig's own arm and hand, the sleeve over it, the shoulder guard ---------
  const armRig = (w: "L" | "R") => (w === "L" ? r.armL : r.armR);
  const narrowSleeve = (ar: typeof r.armL) => {
    const fu = norm(sub(ar.W, ar.E));
    const fn: P2 = [-fu[1], fu[0]];
    const cuff = add(ar.W, mul(fu, -7 * k));
    const st = bones(ar.S, ar.E, cuff, [25.5, 24.5, 21.5, 22, 20].map((w) => w * k));
    return (
      <>
        <path d={limbD(st)} fill={ink.main} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 27 * k, 23 * k, 851 + ar.sgn, 3) + braceletD(ar.E, cuff, 23 * k, 21 * k, 853 + ar.sgn, 3)} {...ln(0.95, 0.6)} />
        <path d={`M${P(add(ar.E, mul(fn, -7 * k)))}Q${P(add(ar.E, add(mul(fn, 1), mul(fu, -5))))} ${P(add(ar.E, mul(fn, 8 * k)))}`} {...ln(1.1, 0.55)} />
        <path d={limbD([[add(cuff, mul(fn, -10.5 * k)), 6], [add(cuff, mul(fn, 10.5 * k)), 6]])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
      </>
    );
  };
  const wideSleeve = (ar: typeof r.armL) => {
    const fu = norm(sub(ar.W, ar.E));
    const fn: P2 = [-fu[1], fu[0]];
    const cuff = add(ar.W, mul(fu, -5 * k));
    const gp = sub([0, 1], mul(fu, fu[1]));
    const gl = vlen(gp);
    const pouch = add(mix2(ar.E, cuff, 0.5), mul(gp, 46 * k));
    const pts = [...circ(ar.S, 17 * k, 10), ...circ(ar.E, 19 * k, 10), ...circ(add(cuff, mul(fu, -4)), 25 * k, 14), ...(gl > 0.05 ? circ(pouch, (9 + 9 * gl) * k, 10) : [])];
    const poly0 = clipHalf(hull(pts), cuff, fu);
    // keep the cuff's edge straight: add points along it
    const onCut = poly0.filter((p) => Math.abs(dot(sub(p, cuff), fu)) < 0.01);
    const cutA = onCut[0] ?? add(cuff, mul(fn, -25 * k));
    const cutB = onCut[1] ?? add(cuff, mul(fn, 25 * k));
    const poly: P2[] = [];
    for (let i = 0; i < poly0.length; i++) {
      poly.push(poly0[i]);
      const a = poly0[i];
      const b = poly0[(i + 1) % poly0.length];
      if (Math.abs(dot(sub(a, cuff), fu)) < 0.01 && Math.abs(dot(sub(b, cuff), fu)) < 0.01) {
        for (const t of [0.2, 0.4, 0.6, 0.8]) poly.push(mix2(a, b, t));
      }
    }
    const SL = smoothClosed(poly);
    const lo = gl > 0.05 ? pouch : mix2(ar.E, cuff, 0.6);
    return (
      <>
        <clipPath id={`${uid}-sl${ar.sgn}`}>
          <path d={SL} />
        </clipPath>
        <path d={SL} fill={ink.main} {...OUT} />
        <g clipPath={`url(#${uid}-sl${ar.sgn})`}>
          <path d={hatchD(Math.min(ar.S[0], lo[0], cuff[0]) - 30, Math.min(ar.S[1], cuff[1]) - 30, Math.max(ar.S[0], lo[0], cuff[0]) + 30, Math.max(lo[1], cuff[1]) + 30, 111, 3, 861 + ar.sgn)} {...ln(0.85, 0.36)} />
          <path d={[0.25, 0.55, 0.85].map((t) => `M${P(mix2(ar.S, ar.E, 0.5))}Q${P(mix2(ar.E, lo, t * 0.6))} ${P(mix2(add(cuff, mul(fn, (t - 0.5) * 40 * k)), lo, 0.35 * gl))}`).join("")} {...ln(1.2, 0.6)} />
        </g>
        <path d={limbD([[add(cutA, mul(fu, -3)), 8 * k], [add(cutB, mul(fu, -3)), 8 * k]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      </>
    );
  };
  const pauldron = (ar: typeof r.armL) => {
    const u = norm(sub(ar.E, ar.S));
    const n: P2 = [-u[1], u[0]];
    const top = add(ar.S, mul(u, -8 * k));
    const bot = mix2(ar.S, ar.E, grand ? 0.56 : 0.48);
    const wd = (grand ? 36 : 32) * k;
    const PAUL = limbD([[top, wd * 0.86], [mix2(top, bot, 0.45), wd], [bot, wd * 0.94]]);
    const rowsT = grand ? [0.22, 0.42, 0.62, 0.82] : [0.28, 0.55, 0.8];
    return (
      <>
        <clipPath id={`${uid}-pa${ar.sgn}`}>
          <path d={PAUL} />
        </clipPath>
        <path d={PAUL} fill={ink.main} {...OUT} strokeWidth={2.3} />
        <g clipPath={`url(#${uid}-pa${ar.sgn})`}>
          <path d={rowsT.map((t) => { const p = mix2(top, bot, t); return `M${P(add(p, mul(n, -wd)))}Q${P(add(p, mul(u, 3.5)))} ${P(add(p, mul(n, wd)))}`; }).join("")} {...ln(1.3, 0.78)} />
          <path d={rowsT.flatMap((t, i) => [-1, 0, 1].map((j) => { const p = add(mix2(top, bot, t), mul(n, (j + (i % 2) * 0.5) * wd * 0.34)); return `M${P(p)}l${P(mul(u, -wd * 0.55))}`; })).join("")} {...ln(1, 0.6)} />
          <path d={braceletD(top, bot, wd, wd, 871 + ar.sgn, 2.8)} {...ln(0.85, 0.45)} />
        </g>
      </>
    );
  };
  const armEl = (w: "L" | "R") => {
    const ar = armRig(w);
    return (
      <React.Fragment key={w}>
        <Figure spec={sp} pose={q} at={at} scale={scale} uid={`${uid}-a${w}`} body={false} arms={w} ink={ink} />
        <g transform={tf}>
          <Cased id={`${uid}-sl${w}`}>
            {look.sleeve === "wide" ? wideSleeve(ar) : narrowSleeve(ar)}
            {armed > 0.001 ? (
              <>
                <clipPath id={`${uid}-pw${w}`}>
                  <rect x={-600} y={-1200} width={1200} height={armed >= 0.999 ? 2400 : yWfig + 1200} />
                </clipPath>
                <g clipPath={`url(#${uid}-pw${w})`}>{pauldron(ar)}</g>
              </>
            ) : null}
          </Cased>
        </g>
      </React.Fragment>
    );
  };

  // ---- what he holds -------------------------------------------------------------
  const weaponEl =
    weapon === "none" ? null : (
      <g transform={`translate(${P(wPt(g.grip))}) rotate(${g.angle.toFixed(2)}) scale(${(scale * G).toFixed(4)} ${scale.toFixed(4)})`}>
        <Cased id={`${uid}-wpc`} r={1.4}>
          {weapon === "ge" ? <GeArt ink={gInk} gripAt={props.gripAt ?? GRIP_AT.ge} uid={`${uid}-wp`} /> : weapon === "spear" ? <SpearArt ink={gInk} gripAt={props.gripAt ?? GRIP_AT.spear} uid={`${uid}-wp`} /> : <BannerArt ink={gInk} gripAt={props.gripAt ?? GRIP_AT.banner} wave={props.wave ?? 0} uid={`${uid}-wp`} />}
        </Cased>
      </g>
    );
  const shieldEl = shield ? <Shield at={wPt(g.shieldAt)} scale={scale} rot={q.lean * 0.4} ink={gInk} uid={`${uid}-sh`} /> : null;
  const huEl = (() => {
    if (!hasHu) return null;
    const gL = add(r.armL.W, mul(r.armL.dir, 11 * k));
    const gR = add(r.armR.W, mul(r.armR.dir, 11 * k));
    const m = mix2(gL, gR, 0.5);
    const up = rot([0, -1], q.lean * 0.4 + 9 * G);
    const b = add(m, mul(up, -12));
    const t = add(m, mul(up, 42));
    return (
      <g transform={tf}>
        <Cased id={`${uid}-huc`} r={1.3}>
          <path d={limbD([[b, 12.5], [mix2(b, t, 0.5), 12], [t, 10]])} fill={ink.main} {...OUT} strokeWidth={2.1} />
          <path d={`M${P(add(mix2(b, t, 0.08), [2.6, 0]))}L${P(add(mix2(b, t, 0.92), [2.2, 0]))}`} {...ln(1, 0.55)} />
          <path d={`M${P(add(mix2(b, t, 0.1), [-2.4, 0]))}L${P(add(mix2(b, t, 0.9), [-2.2, 0]))}`} {...ln(0.8, 0.35)} />
        </Cased>
      </g>
    );
  })();

  // ---- the general's cape and sword -----------------------------------------------------
  const capeEl = look.cape
    ? (() => {
        const tl = r.toFig(side([-hw - 4, shY + 4]));
        const tr2 = r.toFig(side([hw + 4, shY + 4]));
        const trail = -G * Math.abs(s) * 34 + q.hem * 1.6;
        const bl: P2 = [tl[0] - 16 + trail, -46];
        const br: P2 = [tr2[0] + 16 + trail * 0.6, -42];
        const bm: P2 = [mix(bl[0], br[0], 0.5) + trail * 0.2, -34];
        const CAPE = `M${P(tl)}Q${P(mix2(tl, tr2, 0.5))} ${P(tr2)}C${P(add(tr2, [12, 60]))} ${P(add(br, [4, -90]))} ${P(br)}Q${P(mix2(br, bm, 0.5))} ${P(bm)}Q${P(mix2(bm, bl, 0.5))} ${P(bl)}C${P(add(bl, [-4, -90]))} ${P(add(tl, [-12, 60]))} ${P(tl)}Z`;
        return (
          <g transform={tf}>
            <Cased id={`${uid}-cpc`}>
              <clipPath id={`${uid}-cp`}>
                <path d={CAPE} />
              </clipPath>
              <path d={CAPE} fill={ink.deep} {...OUT} />
              <g clipPath={`url(#${uid}-cp)`}>
                <path d={[0.15, 0.35, 0.55, 0.75, 0.9].map((u) => `M${P(mix2(tl, tr2, u))}Q${P(add(mix2(mix2(tl, tr2, u), mix2(bl, br, u), 0.5), [(u - 0.5) * 10 + trail * 0.3, 0]))} ${P(mix2(bl, br, u))}`).join("")} {...ln(1.4, 0.7)} />
                <path d={hatchD(Math.min(tl[0], bl[0]) - 10, shY - 10 + r.hip[1], Math.max(tr2[0], br[0]) + 10, 0, 104, 3, 881)} {...ln(0.9, 0.42)} />
              </g>
            </Cased>
          </g>
        );
      })()
    : null;
  const hilt = mT([wst + 2, -8]);
  // the scabbard hangs down and back; when he kneels it swings back to lie above the ground
  const swd0 = norm([-G * 0.62 * Math.abs(s) + 0.3 * c, 1]);
  const swY = c01((-6 - r.hip[1] - hilt[1]) / 126);
  const swd: P2 = swY >= swd0[1] ? swd0 : [(swd0[0] >= 0 && Math.abs(s) < 0.3 ? 1 : -G) * Math.sqrt(1 - swY * swY), swY];
  const scabbardEl = look.sword ? (
    <g transform={torsoTf}>
      <path d={limbD([[add(hilt, mul(swd, 6)), 9], [add(hilt, mul(swd, 64)), 8.6], [add(hilt, mul(swd, 122)), 7]])} fill={ink.deep} {...OUT} />
      <path d={limbD([[add(hilt, mul(swd, 112)), 10], [add(hilt, mul(swd, 128)), 6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
      <path d={`M${P(add(hilt, mul(swd, 14)))}L${P(add(hilt, mul(swd, 108)))}`} {...ln(0.9, 0.5)} />
    </g>
  ) : null;
  const hiltEl = look.sword ? (
    <g transform={torsoTf}>
      {(() => {
        const n: P2 = [-swd[1], swd[0]];
        const gtop = add(hilt, mul(swd, -24));
        return (
          <>
            <path d={limbD([[add(hilt, mul(swd, 2)), 6], [gtop, 5.4]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
            <path d={[0.25, 0.5, 0.75].map((t) => { const p = mix2(add(hilt, mul(swd, 2)), gtop, t); return `M${P(add(p, mul(n, -3)))}L${P(add(p, mul(n, 3)))}`; }).join("")} {...ln(0.9, 0.6)} />
            <path d={limbD([[add(add(hilt, mul(swd, 4)), mul(n, -9)), 5], [add(add(hilt, mul(swd, 4)), mul(n, 9)), 5]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
            <circle cx={gtop[0] - swd[0] * 3} cy={gtop[1] - swd[1] * 3} r={5} fill={ink.main} {...OUT} strokeWidth={1.9} />
          </>
        );
      })()}
    </g>
  ) : null;
  // ---- the king's apron: from the belt down over the knees -----------------------------------
  const apronEl = look.apron
    ? (() => {
        const top = r.toFig(mT([0, -6]));
        const kn = add(mix2(r.legL.K, r.legR.K, 0.5), [hdx * 0.3, 10]);
        const ax = norm(sub(kn, top));
        const len = Math.max(40, vlen(sub(kn, top)) + 8);
        const n: P2 = [-ax[1], ax[0]];
        const wf = sfT.wf;
        const bot = add(top, mul(ax, len));
        const pts: P2[] = [add(top, mul(n, 15 * wf)), add(bot, mul(n, 19 * wf)), add(bot, mul(n, -19 * wf)), add(top, mul(n, -15 * wf))];
        const AP = polyD(pts);
        return (
          <g transform={tf}>
            <Cased id={`${uid}-apc`}>
              <clipPath id={`${uid}-ap`}>
                <path d={AP} />
              </clipPath>
              <path d={AP} fill={ink.main} {...OUT} />
              <g clipPath={`url(#${uid}-ap)`}>
                <path d={AP} fill="none" stroke={ink.deep} strokeWidth={10} />
                <path d={`M${P(mix2(pts[0], pts[1], 0.34))}L${P(mix2(pts[3], pts[2], 0.34))}M${P(mix2(pts[0], pts[1], 0.6))}L${P(mix2(pts[3], pts[2], 0.6))}`} {...ln(1.4, 0.75)} />
                <path d={hatchD(Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])), 111, 3.2, 891)} {...ln(0.85, 0.4)} />
              </g>
            </Cased>
          </g>
        );
      })()
    : null;

  // ---- the head: the rig's face, its hair erased; the knot, the crown, the cap or the helmet over it --
  const headSpec: Spec = { ...sp, hw: 900, a: 900, hem: 0, cloak: "fret" };
  const nod = Math.max(0, r.nodF);
  const hy = q.headYaw;
  const hc = Math.cos(hy);
  const hs = Math.sin(hy);
  const tH = Math.abs(hs);
  const sgH = hs < 0 ? -1 : 1;
  const fy = 5 * nod;
  const pr = (fxx: number, y: number, D: number, kk = 1): P2 => [fxx * hc + D * hs, y + fy * kk];
  const vis = (sd: number) => (sd * sgH > 0 && tH > 0.02 ? c01((hc - 0.2) / 0.32) : 1);
  const hp = (X: number, Y: number, Z: number): P2 => [X * hc + Z * hs, Y];
  const FACE = smoothClosed(blendYaw(FACE_F, FACE_P, hy));
  const faceClip = smoothClosed(blendYaw(FACE_F, FACE_P, hy).map((p): P2 => [p[0] * 1.08, p[1] * 1.07 + 5 * nod]));
  const capPts = blendYaw(CAPH_F, CAPH_P, hy);
  const CAP = smoothClosed(capPts);
  const knotShift = plain ? 3 * (hash(seed, 901) - 0.5) : 0;
  const bun = hp(knotShift, -33.5, -8);
  const hairLines = (() => {
    // the hair combed up from all round the hairline into the knot
    const n = capPts.length;
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const a = capPts[i];
      const b = capPts[(i + 1) % n];
      for (const t of [0, 0.5]) {
        const p = mix2(a, b, t);
        const m = mix2(p, bun, 0.55);
        out.push(`M${P(p)}Q${P([m[0] + (p[0] - bun[0]) * 0.12, m[1]])} ${P(mix2(p, bun, 0.92))}`);
      }
    }
    return out.join("");
  })();
  const ear = (sd: number) => {
    const far = sd * sgH > 0 && tH > 0.02;
    const v = far ? c01((hc - 0.8) / 0.15) : 1;
    if (v < 0.04) return null;
    const e = pr(sd * 21.5, 3.5, -4, 0);
    const w = far ? hc : mix(0.6, 1, tH);
    return (
      <g key={sd} opacity={v}>
        <ellipse cx={e[0]} cy={e[1]} rx={4.4 * w} ry={7} fill={ink.main} {...OUT} strokeWidth={1.9} />
        <path d={`M${(e[0] + -sd * 1.4 * w).toFixed(1)},${e[1] - 3.6}q${(sd * 3.2 * w).toFixed(1)},2.8 ${(sd * 0.6 * w).toFixed(1)},6.6`} {...ln(1, 0.6)} />
      </g>
    );
  };
  const nearSd = -sgH;
  const earTop = c01((tH - 0.25) / 0.2);
  const hasTache = kind === "soldier" ? hash(seed, 902) > 0.15 : kind === "commoner" ? hash(seed, 903) > 0.5 : true;
  const hairDark = mixHex(ink.hair, DARK, 0.5);
  const tache = (sd: number) => (
    <path key={sd} d={limbD([[pr(sd * 1, 12.9, 20.6, 0.7), 2.2], [pr(sd * 5, 13.4, 19, 0.7), 3.4], [pr(sd * 9.5, 13.4, 15.5, 0.7), 2.6], [pr(sd * 12.6, 10.6, 12.5, 0.7), 1.1]])} fill={hairDark} stroke={DARK} strokeWidth={0.9} strokeLinejoin="round" opacity={vis(sd)} />
  );
  const beardEl = (() => {
    const b = look.beard;
    if (b === "none") return null;
    const st: St[] =
      b === "goatee"
        ? [[pr(0, 23.5, 18.6, 0.6), 9.5], [pr(0, 32, 18, 0.6), 8], [pr(0, 41, 17, 0.6), 4.2], [pr(0, 47, 15.5, 0.6), 1.6]]
        : b === "long"
          ? [[pr(0, 22, 18.6, 0.6), 15], [pr(0, 35, 17.6, 0.6), 13], [pr(0, 50, 15.5, 0.6), 7], [pr(0, 60, 13.5, 0.6), 2]]
          : [[pr(0, 22.5, 18.6, 0.6), 15], [pr(0, 29, 18.4, 0.6), 13], [pr(0, 35, 17.5, 0.6), 5]];
    const top = st[0][0];
    const end = st[st.length - 1][0];
    return (
      <>
        <path d={limbD(st)} fill={hairDark} {...OUT} strokeWidth={1.4} />
        <path d={[-0.3, 0, 0.3].map((o) => `M${P(add(top, [o * st[0][1], 2]))}Q${P(add(st[1][0], [o * st[1][1] * 0.8, 0]))} ${P(mix2(st[st.length - 2][0], end, 0.5))}`).join("")} fill="none" stroke={ink.hair} strokeWidth={0.9} strokeOpacity={0.7} strokeLinecap="round" />
      </>
    );
  })();
  // the king's mianguan: a cap, a flat board tilted forward, strings of beads at its front and back
  const ZF = 44;
  const ZB = -48;
  const yBoard = (Z: number) => -50 + 0.05 * Z + 0.05 * Z * Math.abs(hc);
  const strings = (Z: number) =>
    Array.from({ length: 7 }, (_, j) => {
      const X = -24 + j * 8;
      const a = hp(X, yBoard(Z) + 3.6, Z);
      const beads = Array.from({ length: 4 }, (_, i): P2 => [a[0], a[1] + 4.5 + (j % 2) * 3.4 + i * 7.2]);
      return (
        <g key={j}>
          <path d={`M${P(a)}L${P(beads[beads.length - 1])}`} {...ln(1, 0.85)} />
          {beads.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={2.15} fill={ink.main} stroke={DARK} strokeWidth={1.05} />
          ))}
        </g>
      );
    });
  const crownBack = look.head === "crown" ? <g opacity={c01(tH * 1.6)}>{strings(ZB)}</g> : null;
  const crownFront = (() => {
    if (look.head !== "crown") return null;
    const ck = blendYaw(CAPC_F, CAPC_P, hy);
    const CK = smoothClosed(ck);
    const X0 = -26;
    const X1 = 26;
    const tl = hp(X0, yBoard(ZB), ZB);
    const tr2 = hp(X1, yBoard(ZB), ZB);
    const fr = hp(X1, yBoard(ZF), ZF);
    const fl2 = hp(X0, yBoard(ZF), ZF);
    const th: P2 = [0, 3.6];
    const Xn = -sgH * 26;
    const sn = [hp(Xn, yBoard(ZB), ZB), hp(Xn, yBoard(ZF), ZF)];
    const pin = [hp(-27, -33, 0), hp(27, -33, 0)];
    return (
      <>
        <clipPath id={`${uid}-ck`}>
          <path d={CK} />
        </clipPath>
        <path d={CK} fill={ink.hair} {...OUT} />
        <g clipPath={`url(#${uid}-ck)`}>
          <path d={hatchD(-30, -50, 30, -8, 84, 2.3, 911, 0.12)} {...ln(1.2, 0.8)} />
          <path d={`M${P(ck[0])}Q${P(ck[7])} ${P(ck[6])}`} fill="none" stroke={ink.deep} strokeWidth={12} />
          <path d={`M${P(add(ck[0], [0, -6]))}Q${P(add(ck[7], [0, -6]))} ${P(add(ck[6], [0, -6]))}`} {...ln(1.2, 0.8)} />
        </g>
        {/* the pin through the cap */}
        <path d={limbD([[pin[0], 3.6], [pin[1], 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.6} />
        {hc > 0.3 ? [pin[0], pin[1]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3.6} fill={ink.main} {...OUT} strokeWidth={1.6} />) : null}
        {/* the board */}
        <path d={polyD([tl, tr2, fr, fl2])} fill={ink.main} {...OUT} strokeWidth={2.1} />
        <path d={`M${P(mix2(tl, fl2, 0.5))}L${P(mix2(tr2, fr, 0.5))}`} {...ln(0.9, 0.4)} />
        <path d={polyD([sn[0], sn[1], add(sn[1], th), add(sn[0], th)])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
        <path d={polyD([fl2, fr, add(fr, th), add(fl2, th)])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
        {strings(ZF)}
      </>
    );
  })();
  // the minister's tall slanted cap (front high, sloping down to the back) over a skull-cap
  const capFront = (() => {
    if (look.head !== "cap") return null;
    const ck = blendYaw(CAPK_F, CAPK_P, hy).map((p): P2 => [p[0], mix(p[1], -14, 0.22)]);
    const CK = smoothClosed(ck);
    const prof: [number, number][] = [[13.5, -22], [11.5, -48], [8.5, -74], [3.5, -78], [-5, -68], [-12, -48], [-13, -30]];
    const pts: P2[] = [];
    for (const X of [-12, 12]) for (const [Z, Y] of prof) pts.push(hp(X, Y + (Y < -70 ? 1.5 * (X / 12) ** 2 : 0), Z));
    const PH = hull(pts);
    const PNL = smoothClosed(PH);
    const beams = [-6, 0, 6].map((X) => `M${P(hp(X, -26, 14))}C${P(hp(X, -52, 11))} ${P(hp(X, -68, 8))} ${P(hp(X, -76, 3))}`).join("");
    return (
      <>
        <clipPath id={`${uid}-pn`}>
          <path d={PNL} />
        </clipPath>
        <path d={PNL} fill={ink.hair} {...OUT} />
        <g clipPath={`url(#${uid}-pn)`}>
          <path d={hatchD(-34, -82, 30, -18, 86, 2.4, 921, 0.12)} {...ln(1.15, 0.78)} />
          <path d={beams} fill="none" stroke={ink.main} strokeWidth={2.2} opacity={0.35 + 0.65 * Math.abs(hc)} />
          <path d={`M${P(hp(-12, -58, -6))}Q${P(hp(0, -60, -6))} ${P(hp(12, -58, -6))}`} {...ln(1, 0.5)} />
        </g>
        <clipPath id={`${uid}-mc`}>
          <path d={CK} />
        </clipPath>
        <path d={CK} fill={ink.hair} {...OUT} />
        <g clipPath={`url(#${uid}-mc)`}>
          <path d={hatchD(-30, -50, 30, -8, 84, 2.3, 922, 0.12)} {...ln(1.2, 0.8)} />
          <path d={`M${P(ck[0])}Q${P(ck[7])} ${P(ck[6])}`} fill="none" stroke={ink.deep} strokeWidth={11} />
          <path d={`M${P(add(ck[0], [0, -5.5]))}Q${P(add(ck[7], [0, -5.5]))} ${P(add(ck[6], [0, -5.5]))}`} {...ln(1.2, 0.8)} />
        </g>
      </>
    );
  })();
  // the general's helmet: a bowl, a hood of plates round the sides and the nape, a crest
  const helmet = (() => {
    if (look.head !== "helmet") return null;
    const R = 25.5;
    const vis3 = (phi: number) => Math.cos(phi + hy);
    const phis: number[] = [];
    for (let d = 50; d <= 310; d += 5) {
      const phi = (d * Math.PI) / 180;
      if (vis3(phi) > -0.02) phis.push(phi);
    }
    // split into runs of consecutive visible angles
    const runs: number[][] = [];
    phis.forEach((p, i) => {
      if (i === 0 || p - phis[i - 1] > 0.1) runs.push([]);
      runs[runs.length - 1].push(p);
    });
    const at3 = (phi: number, y: number): P2 => hp(R * Math.sin(phi), y, R * Math.cos(phi));
    const yTop = -15;
    const yBot = (phi: number) => 19 + 2.5 * Math.sin(phi * 9);
    const runEls = runs.map((rn, i) => {
      if (rn.length < 2) return null;
      const top = rn.map((p) => at3(p, yTop));
      const bot = rn.map((p) => at3(p, yBot(p))).reverse();
      const D = polyD([...top, ...bot]);
      const rowsY = [-8, -1, 6, 13];
      const rowsD = rowsY.map((y) => `M${rn.map((p) => P(at3(p, y))).join("L")}`).join("");
      const joins = rowsY
        .flatMap((y, j) =>
          rn.filter((_, m) => (m + j * 1) % 3 === 0).map((p) => {
            const a = at3(p, y - 7);
            const b = at3(p, y);
            return `M${P(a)}L${P(b)}`;
          }),
        )
        .join("");
      return (
        <g key={i}>
          <clipPath id={`${uid}-hg${i}`}>
            <path d={D} />
          </clipPath>
          <path d={D} fill={ink.main} {...OUT} />
          <g clipPath={`url(#${uid}-hg${i})`}>
            <path d={rowsD} {...ln(1.3, 0.8)} />
            <path d={joins} {...ln(1, 0.6)} />
            <path d={hatchD(-34, -16, 34, 24, 108, 2.8, 931 + i)} {...ln(0.85, 0.4)} />
          </g>
        </g>
      );
    });
    const dm = blendYaw(DOME_F, DOME_P, hy);
    const DM = smoothClosed(dm);
    const meridians = Array.from({ length: 12 }, (_, j) => {
      const phi = (j * 30 * Math.PI) / 180;
      if (vis3(phi) < 0.05) return "";
      const pts = [-14, -22, -30, -36].map((y, i) => hp((R - [0, 1.5, 6, 12][i]) * Math.sin(phi), y, (R - [0, 1.5, 6, 12][i]) * Math.cos(phi)));
      return `M${pts.map(P).join("L")}`;
    }).join("");
    const top = hp(0, -41, -2);
    const crest: St[] = [[top, 4.6], [add(top, [0, -9]), 4.2], [add(top, [-4 * hs, -15]), 9], [add(top, [-12 * hs, -26]), 10], [add(top, [-22 * hs, -32]), 4]];
    return (
      <>
        {runEls}
        <path d={limbD([[add(top, [0, 2]), 5], [add(top, [0, -10]), 4.4]])} fill={ink.main} {...OUT} strokeWidth={1.8} />
        <path d={limbD(crest.slice(1))} fill={ink.deep} {...OUT} strokeWidth={1.9} />
        <path d={[-0.3, 0, 0.3].map((o) => `M${P(add(crest[2][0], [o * 8, 2]))}Q${P(add(crest[3][0], [o * 8, 0]))} ${P(crest[4][0])}`).join("")} {...ln(1, 0.7)} />
        <clipPath id={`${uid}-dm`}>
          <path d={DM} />
        </clipPath>
        <path d={DM} fill={ink.main} {...OUT} strokeWidth={2.4} />
        <g clipPath={`url(#${uid}-dm)`}>
          <path d={meridians} {...ln(1.25, 0.75)} />
          <path d={hatchD(-6 + 10 * hs, -44, 34, -8, 112, 2.6, 941)} {...ln(0.9, 0.5)} />
          <path d={`M${P(dm[0])}Q${P(dm[7])} ${P(dm[6])}`} fill="none" stroke={ink.deep} strokeWidth={10} />
          <path d={`M${P(add(dm[0], [0, -5]))}Q${P(add(dm[7], [0, -5]))} ${P(add(dm[6], [0, -5]))}`} {...ln(1.2, 0.8)} />
        </g>
        <path d={limbD([[top, 9], [add(top, [0, -1]), 9]])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
      </>
    );
  })();
  const bunEl =
    look.head === "bun" ? (
      <>
        <clipPath id={`${uid}-bn`}>
          <ellipse cx={bun[0]} cy={bun[1] - 4} rx={11 - 1.5 * tH} ry={8.6} />
        </clipPath>
        <ellipse cx={bun[0]} cy={bun[1] - 4} rx={11 - 1.5 * tH} ry={8.6} fill={ink.hair} {...OUT} />
        <g clipPath={`url(#${uid}-bn)`}>
          <path d={[-6, -3, 0, 3, 6].map((o) => `M${(bun[0] + o * 1.4).toFixed(1)},${(bun[1] + 4).toFixed(1)}Q${(bun[0] + o * 0.6 - 4).toFixed(1)},${(bun[1] - 6).toFixed(1)} ${(bun[0] + o * 0.3).toFixed(1)},${(bun[1] - 13).toFixed(1)}`).join("")} {...ln(1.2, 0.85)} />
        </g>
        <path d={limbD([[add(bun, [-9 + 1.5 * tH, 2.6]), 4], [add(bun, [9 - 1.5 * tH, 2.6]), 4]])} fill={ink.deep} {...OUT} strokeWidth={1.6} />
        <path d={limbD([[hp(-19 + knotShift, -38.5, -8), 3.2], [hp(19 + knotShift, -38.5, -8), 3.2]])} fill={ink.main} {...OUT} strokeWidth={1.5} />
        {hc > 0.4 ? <circle cx={hp(-19 + knotShift, -38.5, -8)[0]} cy={-38.5} r={3.2} fill={ink.main} {...OUT} strokeWidth={1.5} /> : null}
      </>
    ) : null;
  const RIGHAIR = smoothClosed(rigHair(hy));
  const headEl = (
    <>
      <g transform={`${tf} ${headTf}`}>
        <Cased id={`${uid}-hbk`} r={1.3}>
          {crownBack}
        </Cased>
      </g>
      <clipPath id={`${uid}-hc`}>
        <path transform={`${tf} ${headTf}`} d={faceClip} />
      </clipPath>
      <g clipPath={`url(#${uid}-hc)`}>
        <Figure spec={headSpec} pose={q} at={at} scale={scale} uid={`${uid}-hd`} arms="none" ink={ink} />
      </g>
      <g transform={`${tf} ${headTf}`}>
        {/* the rig's own hair erased inside the face (the knot hair replaces it) */}
        <clipPath id={`${uid}-pf`}>
          <path d={FACE} />
        </clipPath>
        <g clipPath={`url(#${uid}-pf)`}>
          <path d={RIGHAIR} fill={ink.main} />
          <path d={FACE} fill="none" {...OUT} />
        </g>
        <Cased id={`${uid}-hdc`} r={1.3}>
          {tH < 0.45 ? [-1, 1].map((sd) => (sd === nearSd ? <g key={sd} opacity={1 - earTop}>{ear(sd)}</g> : ear(sd))) : null}
          <clipPath id={`${uid}-cap`}>
            <path d={CAP} />
          </clipPath>
          <path d={CAP} fill={ink.hair} {...OUT} />
          <g clipPath={`url(#${uid}-cap)`}>
            <path d={hairLines} {...ln(1.15, 0.8)} />
          </g>
          {earTop > 0.01 && look.head !== "helmet" ? <g opacity={earTop}>{ear(nearSd)}</g> : null}
          {hasTache ? [-1, 1].map(tache) : null}
          {beardEl}
          {bunEl}
          {crownFront}
          {capFront}
          {helmet}
        </Cased>
      </g>
    </>
  );

  // ---- assembly --------------------------------------------------------------------------
  const NECK = limbD([[add(r.neck, [0, 5]), 21 * k * (0.8 + 0.2 * sfT.wf)], [mix2(r.neck, add(r.headC, [-7 * r.hs * sp.headScale, 0]), 0.78), 16.5 * k]]);
  const nearKey = g.nearKey;
  const farKey = g.farKey;
  const shieldOnNear = shield && g.sArm === nearKey;
  const bodyEl = (
    <g transform={tf}>
      <Cased id={`${uid}-bd`}>
        {scabbardEl}
        {legs.map(legEl)}
        {skirtEl}
      </Cased>
    </g>
  );
  const apronAndTorso = (
    <>
      {apronEl}
      <g transform={tf}>
        <Cased id={`${uid}-tc`}>
          {torsoBack}
          <path d={NECK} fill={ink.main} {...OUT} />
          <path d={braceletD(add(r.neck, [0, 4]), mix2(r.neck, r.headC, 0.5), 20 * k, 17 * k, 89, 2.4)} {...ln(0.9, 0.6)} />
          {torsoFront}
          {hiltEl}
        </Cased>
      </g>
      {vestEl ? (
        <g transform={tf}>
          <Cased id={`${uid}-vc`}>{vestEl}</Cased>
        </g>
      ) : null}
    </>
  );
  return (
    <g opacity={tone}>
      {capeEl}
      {profile ? armEl(farKey) : null}
      {profile && shield && !shieldOnNear ? shieldEl : null}
      {bodyEl}
      {apronAndTorso}
      {weaponEl}
      {headEl}
      {profile ? armEl(nearKey) : [r.armL, r.armR].sort((p, q2) => p.z - q2.z).map((ar) => armEl(ar.sgn < 0 ? "L" : "R"))}
      {shieldOnNear || (!profile && shield) ? shieldEl : null}
      {huEl}
    </g>
  );
};

type CastProps = Omit<DgFigureProps, "kind" | "uid"> & { uid?: string };
/** a Warring States infantryman: robe, lamellar vest, puttees, topknot; a ge by default */
export const Soldier: React.FC<CastProps> = ({ uid = "sol", ...p }) => <DgFigure kind="soldier" uid={uid} {...p} />;
/** the same man in his plain belted robe; armed 0..1 puts the vest on */
export const Commoner: React.FC<CastProps> = ({ uid = "com", ...p }) => <DgFigure kind="commoner" uid={uid} {...p} />;
/** the ruler: the mianguan crown, wide sleeves, apron, long sash */
export const King: React.FC<CastProps> = ({ uid = "kng", ...p }) => <DgFigure kind="king" uid={uid} {...p} />;
/** the official: the tall cap, a hu tablet at his chest (hu={false} to drop it) */
export const Minister: React.FC<CastProps> = ({ uid = "min", ...p }) => <DgFigure kind="minister" uid={uid} {...p} />;
/** the victor: grand lamellar, crested helmet, cape, a sword at his hip */
export const General: React.FC<CastProps> = ({ uid = "gen", ...p }) => <DgFigure kind="general" uid={uid} {...p} />;

// ---------------------------------------------------------------------------
// POSES. Each takes dir: 1 = facing screen right, -1 = facing screen left (a true
// mirror). All are plain FigPose: blend with lerpFig, key with poseTrack, lay
// walk / walkLegs / runLegs / idle over them. The two-handed weapon poses hold
// the weapon in the NEAR fist (the rear hand) with the far fist on the shaft.
// ---------------------------------------------------------------------------
const mArm = (a: ArmPose): ArmPose => ({ w: [-a.w[0], a.w[1]], elbow: [-a.elbow[0], a.elbow[1]], fist: a.fist, hand: -a.hand });
/** the same pose facing the other way */
export const mirrorPose = (q: FigPose): FigPose => ({
  ...q,
  yaw: -q.yaw,
  headYaw: -q.headYaw,
  roll: -q.roll,
  lean: -q.lean,
  armL: mArm(q.armR),
  armR: mArm(q.armL),
  footL: [-q.footR[0], q.footR[1]],
  footR: [-q.footL[0], q.footL[1]],
  liftL: -q.liftR,
  liftR: -q.liftL,
  hem: -q.hem,
});
const YAW = 0.95;
// facing right: armL is the near arm, armR the far arm
const SIDE: FigPose = { ...STAND, yaw: YAW, headYaw: YAW + 0.07, armL: { w: [-10, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 }, armR: { w: [16, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 } };
const FRONT: FigPose = { ...STAND, armL: { w: [-55, -140], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, armR: { w: [55, -140], elbow: [0.3, 1], fist: 0.3, hand: 0 } };
const FRONT_HU: FigPose = { ...STAND, pitch: 6, lids: 0.15, armL: { w: [-5, -196], elbow: [-1, 0.6], fist: 0.85, hand: 70 }, armR: { w: [7, -198], elbow: [1, 0.6], fist: 0.85, hand: -70 } };
const R_CARRY: FigPose = aimWeapon({ ...SIDE, brow: 0.3, armL: { w: [38, -188], elbow: [-0.7, 1], fist: 1, hand: 0 } }, 0);
const R_GUARD: FigPose = onShaft(
  aimWeapon(
    {
      ...SIDE,
      lean: 7,
      crouch: 16,
      pitch: -2,
      brow: 0.75,
      mouth: -0.25,
      footL: [-26, 0],
      footR: [26, 0],
      armL: { w: [-12, -176], elbow: [-1, 0.4], fist: 1, hand: 0 },
      armR: { w: [52, -198], elbow: [0.2, 1], fist: 1, hand: 0 },
    },
    76,
  ),
  104,
);
const R_CHARGE: FigPose = onShaft(aimWeapon({ ...R_GUARD, lean: 14, crouch: 8, pitch: -6, brow: 1, mouth: -0.6, footL: [0, 0], footR: [0, 0], armL: { w: [-4, -180], elbow: [-1, 0.4], fist: 1, hand: 0 } }, 80), 106);
const R_BRACE: FigPose = onShaft(
  aimWeapon(
    {
      ...SIDE,
      lean: 12,
      crouch: 44,
      pitch: -5,
      brow: 0.95,
      mouth: -0.35,
      footL: [-48, 0],
      footR: [36, 0],
      liftL: 12,
      armL: { w: [-20, -110], elbow: [-1, 0.3], fist: 1, hand: 0 },
      armR: { w: [40, -160], elbow: [0.2, 1], fist: 1, hand: 0 },
    },
    58,
  ),
  88,
);
const R_RECOIL: FigPose = onShaft(
  aimWeapon(
    {
      ...SIDE,
      lean: -13,
      crouch: 12,
      pitch: -9,
      roll: -3,
      headYaw: YAW + 0.12,
      brow: -0.6,
      mouth: -0.75,
      footL: [-44, 0],
      footR: [14, 0],
      liftR: -10,
      armL: { w: [-2, -214], elbow: [-1, 0.6], fist: 1, hand: 0 },
      armR: { w: [44, -246], elbow: [0.4, 1], fist: 1, hand: 0 },
    },
    50,
  ),
  62,
);
const R_SLUMP: FigPose = aimWeapon(
  {
    ...SIDE,
    lean: 8,
    crouch: 9,
    pitch: 17,
    roll: 4,
    headYaw: YAW - 0.12,
    brow: -0.25,
    lids: 0.5,
    mouth: -0.65,
    footL: [-6, 0],
    footR: [20, 0],
    armL: { w: [34, -178], elbow: [-0.6, 1], fist: 0.8, hand: 0 },
    armR: { w: [22, -136], elbow: [-0.5, 1], fist: 0.15, hand: 12 },
  },
  12,
);
const R_REACH: FigPose = { ...SIDE, lean: 58, crouch: 78, pitch: 4, headYaw: YAW + 0.1, footL: [-14, 0], footR: [20, 0], armL: { w: [84, -22], elbow: [-0.4, 1], fist: 0, hand: 0 }, armR: { w: [100, -26], elbow: [-0.4, 1], fist: 0, hand: 0 } };
const R_SEATED: FigPose = {
  ...SIDE,
  crouch: 94,
  lean: 2,
  pitch: 3,
  footL: [-14, 9],
  footR: [-36, 9],
  liftL: 170,
  liftR: 170,
  armL: { w: [22, -66], elbow: [-0.5, 1], fist: 0.2, hand: 10 },
  armR: { w: [40, -70], elbow: [-0.5, 1], fist: 0.2, hand: 10 },
};
const R_KNEEL: FigPose = {
  ...SIDE,
  crouch: 64,
  lean: 7,
  pitch: 1,
  footL: [-36, -14],
  footR: [42, 0],
  liftL: 84,
  armL: { w: [30, -112], elbow: [-0.5, 1], fist: 0.3, hand: 0 },
  armR: { w: [48, -106], elbow: [-0.3, 1], fist: 0.3, hand: 10 },
};
const R_GESTURE: FigPose = { ...SIDE, headYaw: YAW - 0.04, pitch: -3, brow: 0.35, armR: { w: [104, -232], elbow: [0.3, 1], fist: 0, hand: -18 } };
const R_HU: FigPose = { ...SIDE, pitch: 7, brow: 0.2, lids: 0.15, armL: { w: [22, -192], elbow: [-0.8, 1], fist: 0.85, hand: -64 }, armR: { w: [29, -196], elbow: [-0.2, 1], fist: 0.85, hand: -64 } };
const R_SEATED_HU: FigPose = { ...R_SEATED, pitch: 7, lids: 0.15, armL: { ...R_HU.armL, w: [R_HU.armL.w[0], R_HU.armL.w[1] + 94] }, armR: { ...R_HU.armR, w: [R_HU.armR.w[0], R_HU.armR.w[1] + 94] } };
// the shield-bearer: the dun on the near forearm across his front, the spear in the FAR fist (use shield weapon="spear")
const SH_O: GearOpts = { weapon: "spear", shield: true };
const R_SHIELD_CARRY: FigPose = aimWeapon({ ...SIDE, brow: 0.35, armL: { w: [30, -172], elbow: [-0.8, 1], fist: 0.9, hand: 0 }, armR: { w: [58, -190], elbow: [0.2, 1], fist: 1, hand: 0 } }, 0, "soldier", SH_O);
const R_SHIELD_GUARD: FigPose = aimWeapon(
  { ...SIDE, lean: 8, crouch: 18, pitch: -3, brow: 0.8, mouth: -0.25, footL: [-26, 0], footR: [26, 0], armL: { w: [40, -180], elbow: [-0.8, 1], fist: 0.9, hand: 0 }, armR: { w: [40, -214], elbow: [0.6, 1], fist: 1, hand: 0 } },
  82,
  "soldier",
  SH_O,
);
const riseTrack = poseTrack([
  [0, R_SEATED],
  [50, R_KNEEL],
  [100, SIDE],
]);

// ---- the run (the charge's legs): one cycle laid over a pose, a flight phase, high knees ----------
const RUN_STANCE = 0.4;
export const RUN = {
  /** how far a planted foot travels under him, units */
  stride: 64,
  /** frames per full cycle (two steps) at 24 fps */
  cycle: 16,
  /** px per frame the runner must advance (add to `at` x in the facing direction) so the planted foot does not slide */
  advance: (scale: number, cycle = 16, stride = 64) => (stride * scale) / (RUN_STANCE * cycle),
};
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
/** the running legs and bob over a pose (arms stay where the pose has them); phase = frames / RUN.cycle */
export const runLegs = (base: FigPose, phase: number, amount = 1, stride = RUN.stride): FigPose => {
  const dir = Math.sin(base.yaw) >= 0 ? 1 : -1;
  const leg = (u0: number) => {
    const u = frac(u0);
    if (u < RUN_STANCE) {
      const v = u / RUN_STANCE;
      return { x: stride * (0.5 - v), y: 0, lift: 34 * ease(c01((v - 0.6) / 0.4)) - 10 * c01(1 - v / 0.2) };
    }
    const v = (u - RUN_STANCE) / (1 - RUN_STANCE);
    return { x: stride * (-0.5 + ease(v)), y: -30 * Math.sin(Math.PI * Math.min(1, v * 1.15)) - 14 * (1 - v) * (1 - v), lift: 38 * (1 - ease(Math.min(1, v * 1.5))) - 12 * ease(c01((v - 0.5) / 0.5)) };
  };
  const L = leg(phase);
  const R = leg(phase + 0.5);
  const a = amount;
  return {
    ...base,
    crouch: base.crouch + a * (7 + 4 * Math.cos(4 * Math.PI * phase)),
    lean: base.lean + a * 3 * dir,
    footL: [base.footL[0] + a * dir * L.x, base.footL[1] + a * L.y],
    footR: [base.footR[0] + a * dir * R.x, base.footR[1] + a * R.y],
    liftL: base.liftL + a * dir * L.lift,
    liftR: base.liftR + a * dir * R.lift,
    hem: base.hem - a * dir * 4 * Math.cos(4 * Math.PI * phase),
  };
};
/** texcocoShared's walk laid over a pose (phase = frames / WALK.cycle; advance `at` by WALK.advance(scale) px per frame) */
export const walk = (base: FigPose, phase: number, amount = 1): FigPose => walkPose(base, phase, amount);
/** the walk's legs and bob only: the arms stay where the pose has them (a carried ge, a levelled ge, a held tablet) */
export const walkLegs = (base: FigPose, phase: number, amount = 1): FigPose => ({ ...walkPose(base, phase, amount), armL: base.armL, armR: base.armR });

const face = (q: FigPose, dir: 1 | -1) => (dir === 1 ? q : mirrorPose(q));
export const POSES = {
  /** facing us, arms at his sides (STAND with the arms in a little) */
  front: () => FRONT,
  /** facing us, both fists at the chest (the minister's tablet) */
  frontHu: () => FRONT_HU,
  /** standing in three-quarter profile, arms at his sides */
  stand: (dir: 1 | -1 = 1) => face(SIDE, dir),
  /** the weapon held upright in the near fist in front of him, butt near the ground */
  carry: (dir: 1 | -1 = 1) => face(R_CARRY, dir),
  /** the hedge stance: knees bent, the weapon levelled forward at chest height in both fists */
  guard: (dir: 1 | -1 = 1) => face(R_GUARD, dir),
  /** running, leaning in, the weapon levelled; phase 0..1 loops (advance at by RUN.advance(scale) per frame) */
  charge: (dir: 1 | -1 = 1, phase = 0) => face(runLegs(R_CHARGE, phase), dir),
  /** crouched, the butt grounded behind him, the point up and forward (receiving a charge) */
  brace: (dir: 1 | -1 = 1) => face(R_BRACE, dir),
  /** leaning back, a step back, the weapon raised across his body (being pushed back) */
  recoil: (dir: 1 | -1 = 1) => face(R_RECOIL, dir),
  /** tired and disordered: head down, shoulders sunk, the weapon planted and leaned on */
  slump: (dir: 1 | -1 = 1) => face(R_SLUMP, dir),
  /** stooped, both open hands down to the ground in front of him (picking up a weapon) */
  reach: (dir: 1 | -1 = 1) => face(R_REACH, dir),
  /** kneeling-seated (heels under him), hands on his thighs: the court, the table, the throne */
  seated: (dir: 1 | -1 = 1) => face(R_SEATED, dir),
  /** kneeling-seated holding the tablet at the chest (the minister at court) */
  seatedHu: (dir: 1 | -1 = 1) => face(R_SEATED_HU, dir),
  /** one knee up, a hand on it: the middle of rising */
  kneel: (dir: 1 | -1 = 1) => face(R_KNEEL, dir),
  /** seated -> one knee -> standing, t 0..1 (a monotone pose track; drive t with an eased track) */
  rise: (dir: 1 | -1 = 1, t = 0) => face(riseTrack(c01(t) * 100), dir),
  /** the far arm out, open hand (the king or the general speaking) */
  gesture: (dir: 1 | -1 = 1) => face(R_GESTURE, dir),
  /** standing, the tablet held up at the chest */
  hu: (dir: 1 | -1 = 1) => face(R_HU, dir),
  /** with shield (draw with shield weapon="spear"): the dun across his front, the spear upright in the far fist */
  shieldCarry: (dir: 1 | -1 = 1) => face(R_SHIELD_CARRY, dir),
  /** with shield: crouched behind the dun, the spear levelled past it from the far fist (a shield wall) */
  shieldGuard: (dir: 1 | -1 = 1) => face(R_SHIELD_GUARD, dir),
};

// ---------------------------------------------------------------------------
// THE REVIEW SHEETS (world 2160 x 3840 seen at k = 0.5: render with --scale 2)
// ---------------------------------------------------------------------------
export const DgFiguresSheet: React.FC = () => {
  const cam = { k: 0.5, cx: 1080, cy: 1920 };
  const S1 = 1.95;
  const S2 = 1.6;
  const S3 = 1.25;
  const thAt: P2 = [380, 3180];
  const tbAt: P2 = [1130, 3180];
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          {/* row 1: the cast facing us */}
          <Commoner pose={POSES.front()} at={[230, 800]} scale={S1} uid="r1a" />
          <Commoner pose={POSES.front()} at={[620, 800]} scale={S1} uid="r1b" ink={ORANGE} armed={0.55} />
          <King pose={POSES.front()} at={[1060, 800]} scale={S1} uid="r1c" ink={ORANGE} />
          <Minister pose={POSES.frontHu()} at={[1500, 800]} scale={S1} uid="r1d" />
          <General pose={POSES.front()} at={[1920, 800]} scale={S1} uid="r1e" />
          {/* row 2: three-quarter views */}
          <Soldier pose={POSES.carry(1)} at={[170, 1720]} scale={S2} uid="r2a" />
          <King pose={POSES.gesture(-1)} at={[640, 1720]} scale={S2} uid="r2b" />
          <Minister pose={POSES.hu(1)} at={[960, 1720]} scale={S2} uid="r2c" ink={ORANGE} />
          <General pose={POSES.gesture(-1)} at={[1420, 1720]} scale={S2} uid="r2d" ink={ORANGE} />
          <Soldier pose={POSES.slump(1)} at={[1700, 1720]} scale={S2} uid="r2e" ink={ORANGE} seed={3} />
          <Commoner pose={POSES.reach(1)} at={[1950, 1720]} scale={S2} uid="r2f" ink={ORANGE} />
          {/* row 3: the weapon poses */}
          <Soldier pose={POSES.guard(1)} at={[170, 2480]} scale={S3} uid="r3a" ink={ORANGE} />
          <Soldier pose={POSES.charge(1, 0.3)} at={[700, 2480]} scale={S3} uid="r3b" seed={5} />
          <Soldier pose={POSES.brace(-1)} at={[1540, 2480]} scale={S3} uid="r3c" ink={ORANGE} weapon="spear" seed={7} />
          <Soldier pose={POSES.recoil(1)} at={[1720, 2480]} scale={S3} uid="r3d" seed={2} />
          {/* row 4: the court */}
          <Throne at={thAt} scale={S3} uid="thr" ink={ORANGE} />
          <King pose={POSES.seated(1)} at={throneSeat(thAt, S3)} scale={S3} uid="r4a" ink={ORANGE} />
          <LowTable at={tbAt} scale={S3} uid="tab" />
          <Scroll at={add(tableTop(tbAt, S3), [-28 * S3, -16 * S3])} scale={S3} open={0} rot={90} uid="scr1" />
          <Minister pose={POSES.seatedHu(1)} at={[tbAt[0] - 190, 3180]} scale={S3} uid="r4b" />
          <Commoner pose={POSES.rise(1, 0.5)} at={[1560, 3180]} scale={S3} uid="r4c" />
          <General pose={POSES.seated(-1)} at={[1930, 3180]} scale={S3} uid="r4d" />
          {/* row 5: the props */}
          <Ge at={[330, 3420]} angle={90} scale={1.4} uid="p1" />
          <Spear at={[330, 3590]} angle={90} scale={1.4} uid="p2" ink={ORANGE} />
          <Ge at={[330, 3760]} angle={90} dir={-1} scale={1.4} uid="p1b" ink={ORANGE} />
          <Shield at={[970, 3560]} scale={1.5} uid="p3" />
          <Shield at={[1170, 3720]} scale={1.5} lying={1} uid="p4" ink={ORANGE} />
          <Banner at={[1340, 3640]} scale={0.9} wave={0.2} uid="p5" ink={ORANGE} />
          <Scroll at={[1620, 3440]} scale={1.6} open={1} uid="p6" />
          <Scroll at={[1620, 3640]} scale={1.6} open={0.4} uid="p7" ink={ORANGE} />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
/** the crowd check: 40 soldiers in 4 ranks in guard, orange above, cream below (front rank ~170 px tall on the 1080 frame) */
export const DgFiguresCrowdSheet: React.FC = () => {
  const cam = { k: 0.5, cx: 1080, cy: 1920 };
  const block = (y0: number, ink: Ink | ((d: number) => Ink), key: string) => {
    const men: React.ReactNode[] = [];
    for (let rk = 3; rk >= 0; rk--) {
      const sc = 1.1 * Math.pow(0.86, rk);
      const y = y0 - rk * 120;
      for (let f = 0; f < 10; f++) {
        const x = 120 + rk * 40 + f * 168 * Math.pow(0.95, rk);
        const ik = typeof ink === "function" ? ink(rk) : ink;
        men.push(<Soldier key={`${key}${rk}-${f}`} pose={idle(POSES.guard(1), f * 7 + rk * 3, f + rk)} at={[x, y]} scale={sc} uid={`${key}${rk}x${f}`} ink={ik} seed={f * 4 + rk} />);
      }
    }
    return men;
  };
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          {block(1700, ORANGE, "o")}
          {block(3640, (rk) => (rk === 0 ? CREAM : shadeInk(1 - rk * 0.12)), "c")}
          <Soldier pose={POSES.carry(-1)} at={[1990, 1700]} scale={1.1} uid="bn1" ink={ORANGE} weapon="banner" wave={0.3} />
          <Soldier pose={POSES.shieldCarry(1)} at={[300, 2500]} scale={1.3} uid="sc1" ink={ORANGE} shield weapon="spear" />
          <Soldier pose={POSES.shieldGuard(1)} at={[800, 2500]} scale={1.3} uid="sg1" shield weapon="spear" seed={4} />
          <Soldier pose={POSES.shieldGuard(-1)} at={[1800, 2500]} scale={1.3} uid="sg2" ink={ORANGE} shield weapon="spear" seed={9} />
          <Soldier pose={walkLegs(POSES.carry(1), 0.25)} at={[1990, 3640]} scale={1.1} uid="bn2" weapon="banner" wave={0.6} />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
