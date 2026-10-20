// ---------------------------------------------------------------------------
// londonCast: the shared engraved cast of the Kyle Harper London clip ("How geniuses
// came out of disgusting 18th-century London", Dwarkesh Patel, Oct 2026): late-
// 17th-century London, c. 1680s, one costume language. Dwarkesh map style "People and
// crowds": the cream form on a dark casing, a firm dark outline, hatching, light from
// the upper left; an orange figure wears a solid orange coat (orange = the new science).
//
// Built ON the articulated rig of kits/maps/texcocoFigures the way
// sarah-death-ground/dgFigures and sarah-pearl-harbor/pearlFiguresV2 are: the rig's
// joints (figureRig: IK, yaw, lean, crouch), its own arms and hands (a Figure with
// body={false}) and its own face (a Figure cut out at the face); the costume is drawn
// here. Nothing in the kit is edited or forked.
//
//   Fellow     a Royal Society gentleman: full-bottomed periwig, knee-length coat with
//              deep turned-back cuffs and a row of buttons, a falling lace cravat,
//              knee breeches, stockings, buckled shoes. variant 0..4 so a group does
//              not look cloned: 0 mid-brown wig, plain coat; 1 fair wig, braided coat;
//              2 dark wig, a hat under his arm; 3 grey wig, older, stooped (use
//              POSES.stoop); 4 mid-dark wig, braided coat, broader.
//   Newton     his own long grey-brown hair (no periwig), a plain coat, the white band
//              at the neck, lean (Kneller 1689). Pass coat={ORANGE} when he is "the science".
//   Pepys      a dark full-bottomed periwig, a fuller face, a rich braided coat (Hayls
//              1666 / Kneller 1689); cream.
//   Worker     shirt sleeves rolled, a waistcoat, a leather apron, breeches; a knitted
//              cap (cap={true}, default) or bare-headed; tool="shovel" puts a coal
//              shovel in his two fists (cut 42).
//   Astronomer a Fellow bending to the eyepiece (POSES.eyepiece; Telescope prop).
//   Props      Table (the long table with its cloth), Globe, Reflector (Newton's
//              reflecting telescope, 1668), Telescope (a long refractor on a stand,
//              telescopeEyepiece() gives where the eye goes), Shovel (free).
//
// Units: figure-local, feet at (0, 0), up is - y, a man ~310 units from the soles to the
// top of the skull (a periwig adds ~20). scale = world px per unit: scaleForPx(px).
// Draw inside a WorldSvg (world px). A turn is the rig's yaw going through 0 (a drawn
// front view), never a flip. Inks: `coat` = the coat, skirt, sleeves, breeches (CREAM,
// ORANGE or shadeInk(t)); `ink` = face, hands, linen, stockings and the wig (CREAM by
// default; shadeInk(t) for a man further back).
//
// POSES (figure-local, dir 1 = facing screen right, -1 = left; all pure functions):
//   POSES.front()              standing, facing us
//   POSES.stand(dir)           three-quarter view, standing
//   POSES.walk(dir, phase)     the walk cycle (phase = frames / WALK_CYCLE); advance the
//                              feet `at` by walkAdvance(scale) px per frame
//   POSES.bow(dir, t)          t 0..1: the bow / greeting, his near hand to his chest
//   POSES.greet(dir, t)        t 0..1: the near hand opens forward, a small nod
//   POSES.stoop(q, dir)        the older Fellow's stoop laid over any pose
//   POSES.eyepiece(dir)        bent to a telescope's eyepiece (see telescopeEyepiece)
//   POSES.shovel(dir, phase)   one shovel cycle per phase 0..1: scoop, lift, throw, back
//   POSES.lever(dir, t)        t 0..1: both fists on a lever handle, pulled from high to low
//   POSES.haul(dir, phase)     leaning back, hauling hand over hand on a rope
//   headTurn(q, yaw, nod?)     the same pose with the head turned (absolute yaw) and nodded
//   mirrorPose(q)              any pose facing the other way
// with texcocoShared's idle (breathing, a pure function of the frame) and poseTrack.
// castAnchors(kind, pose, at, scale) gives world anchors (headC, hands, chest, feet...).
// The probe sheets are LondonCastSheet / LondonCastWorkSheet / LondonCastHeads (Root.LondonCast).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { hash, type P2 } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { CREAM, Figure, ORANGE, STAND, figureAnchors, figureRig, lerpFig, type ArmPose, type FigPose, type Ink, type Spec } from "../kits/maps/texcocoFigures";
import { WALK, idle, poseTrack, shadeInk, track, walkPose } from "../kits/maps/texcocoShared";

export { CREAM, ORANGE, STAND, WALK, idle, lerpFig, poseTrack, shadeInk, track, walkPose };
export type { ArmPose, FigPose, Ink };

/** the clip's sequence rate */
export const FPS = 30000 / 1001;
/** the house casing / outline (pearlShared's deep brown, not incaShared's near-black) */
export const DARK = "#17120D";
/** a man from the soles to the top of the skull, units */
export const MAN_UNITS = 310;
/** px per unit for a man `px` tall (soles to skull) */
export const scaleForPx = (px: number) => px / MAN_UNITS;
/** frames per walk cycle at 29.97 (texcocoShared's 24 frames at 23.976, the same pace) */
export const WALK_CYCLE = 30;
/** px per frame the feet `at` must advance in the facing direction so a planted foot does not slide */
export const walkAdvance = (scale: number) => WALK.advance(scale, WALK_CYCLE);

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
/** an ink between two inks (cream -> orange as a coat turns; works on shadeInk's rgb() inks) */
export const mixInk = (a: Ink, b: Ink, t: number): Ink => ({ main: mixHex(a.main, b.main, t), deep: mixHex(a.deep, b.deep, t), hair: mixHex(a.hair, b.hair, t) });

// ---------------------------------------------------------------------------
// the engraver's helpers (as pearlFiguresV2's / dgFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
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
/** a dark casing round a form, so it reads on the umber page */
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 1.6, children }) => (
  <>
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="fat" />
      <feGaussianBlur in="fat" stdDeviation={r * 0.42} result="soft" />
      <feFlood floodColor={DARK} floodOpacity={0.68} />
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
/** cloth lies ON what holds it up (dgFigures' drape) */
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
const bottomAt = (poly: P2[], x: number) => {
  let y = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) y = Math.max(y, mix(a[1], b[1], (x - a[0]) / (b[0] - a[0])));
  }
  return y;
};

// the rig's face and hair outlines (texcocoFigures'), to cut its face out and to erase its hair
const FACE_F: P2[] = [[0, -26], [8, -25], [14, -21], [18, -13], [19.5, -5], [19.5, 2], [19, 8], [18, 12], [16.5, 16], [14.5, 19.5], [11, 23], [5, 26.5], [-5, 26.5], [-11, 23], [-16.5, 16], [-19, 8], [-19.5, -2], [-18, -13], [-14, -21], [-8, -25]];
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];
const HAIR_F: P2[] = [[-20, 32], [-25.5, 22], [-27, 5], [-24, -14], [-17, -27], [0, -31], [17, -27], [24, -14], [27, 5], [25.5, 22], [20, 32], [13, 31], [16, 14], [17.5, 0], [16, -9], [8, -13.5], [0, -12.4], [-8, -13.5], [-16, -9], [-17.5, 0], [-16, 14], [-13, 31]];
const HAIR_P: P2[] = [[-24, 29], [-28, 18], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 24], [-13, 30]];
const rigHair = (yaw: number) => {
  const drop = -15;
  const f = HAIR_F.map((p, i): P2 => ([0, 10, 11, 21].includes(i) ? [p[0], p[1] + drop] : [1, 9].includes(i) ? [p[0], p[1] + drop * 0.6] : p));
  const pr = HAIR_P.map((p, i): P2 => ([0, 21].includes(i) ? [p[0], p[1] + drop] : [1, 20].includes(i) ? [p[0], p[1] + drop * 0.55] : p));
  return blendYaw(f, pr, yaw);
};
// the knitted cap (dgFigures' dome outline) and its rolled brim
const DOME_F: P2[] = [[-24.5, -11], [-25.5, -25], [-18, -36.5], [0, -41], [18, -36.5], [25.5, -25], [24.5, -11], [0, -14.5]];
const DOME_P: P2[] = [[-28, -6], [-29, -24], [-19, -38.5], [0, -42], [14, -37], [20, -26], [21, -14.5], [-3, -10]];

// ---------------------------------------------------------------------------
// THE BUILDS AND LOOKS
// ---------------------------------------------------------------------------
export type LondonKind = "fellow" | "newton" | "pepys" | "worker";
const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };
type Hair = "periwig" | "own" | "cropped";
type Look = {
  spec: Spec;
  hair: Hair;
  /** wig / hair tone: 0 fair .. 1 dark; "grey" handled by greyHair */
  hairTone: number;
  greyHair: boolean;
  /** how far the wig's side locks fall below the face's middle, head units */
  lockLen: number;
  /** wig volume (sphere radius, head units) */
  wigR: number;
  coatBraid: boolean;
  neck: "cravat" | "band" | "shirt";
  hat: boolean;
  /** horizontal widening of the face (Pepys's fuller face) */
  faceW: number;
  worker: boolean;
};
const FELLOWS: Look[] = [
  { spec: MAN, hair: "periwig", hairTone: 0.55, greyHair: false, lockLen: 84, wigR: 30, coatBraid: false, neck: "cravat", hat: false, faceW: 1, worker: false },
  { spec: { ...MAN, a: 52, hw: 44, headScale: 1.07 }, hair: "periwig", hairTone: 0.1, greyHair: false, lockLen: 80, wigR: 29, coatBraid: true, neck: "cravat", hat: false, faceW: 1, worker: false },
  { spec: { ...MAN, a: 55, hw: 46, H: 95, hipY: -154, headScale: 1.09, arm: [59, 56], leg: [71, 69] }, hair: "periwig", hairTone: 0.9, greyHair: false, lockLen: 88, wigR: 31, coatBraid: false, neck: "cravat", hat: true, faceW: 1, worker: false },
  { spec: { ...MAN, a: 53, hw: 44, H: 92, hipY: -149, headScale: 1.07, aged: true }, hair: "periwig", hairTone: 0, greyHair: true, lockLen: 78, wigR: 29, coatBraid: false, neck: "cravat", hat: false, faceW: 1, worker: false },
  { spec: { ...MAN, a: 58, hw: 47, limb: 1.04, headScale: 1.09 }, hair: "periwig", hairTone: 0.72, greyHair: false, lockLen: 84, wigR: 31, coatBraid: true, neck: "cravat", hat: false, faceW: 1.03, worker: false },
];
const LOOKS: Record<Exclude<LondonKind, "fellow">, Look> = {
  newton: { spec: { ...MAN, a: 50, hw: 42, H: 95, hipY: -155, limb: 0.95, headScale: 1.07, arm: [59, 56], leg: [71, 69] }, hair: "own", hairTone: 0, greyHair: true, lockLen: 58, wigR: 26, coatBraid: false, neck: "band", hat: false, faceW: 0.97, worker: false },
  pepys: { spec: { ...MAN, a: 57, hw: 46, H: 93, hipY: -151, limb: 1.04, headScale: 1.1 }, hair: "periwig", hairTone: 1, greyHair: false, lockLen: 86, wigR: 31, coatBraid: true, neck: "cravat", hat: false, faceW: 1.08, worker: false },
  worker: { spec: { ...MAN, a: 55, hw: 46, limb: 1.06, headScale: 1.07 }, hair: "cropped", hairTone: 0.6, greyHair: false, lockLen: 0, wigR: 28, coatBraid: false, neck: "shirt", hat: false, faceW: 1, worker: true },
};
const lookOf = (kind: LondonKind, variant = 0): Look => (kind === "fellow" ? FELLOWS[((variant % FELLOWS.length) + FELLOWS.length) % FELLOWS.length] : LOOKS[kind]);
export const FELLOW_VARIANTS = FELLOWS.length;
/** the rig build of a cast member (use with figureRig / figureAnchors) */
export const specOf = (kind: LondonKind, variant = 0) => lookOf(kind, variant).spec;
/** world anchors of a cast member: headC, headTop, shoulders, wrists, handL / handR (the grips), chest, hip, feet */
export const castAnchors = (kind: LondonKind, pose: FigPose, at: P2, scale: number, variant = 0) => figureAnchors(specOf(kind, variant), pose, at, scale);

// ---------------------------------------------------------------------------
// THE SHOE: a square-toed leather shoe, a low heel, the buckle on the instep
// ---------------------------------------------------------------------------
const SHOE_F: P2[] = [[-7.4, -2], [7.4, -2], [10.6, 5.5], [12.4, 9.5], [12.8, 13], [12, 19], [0, 19.8], [-12, 19], [-12.6, 13.5], [-10.6, 5.5]];
const SHOE_P: P2[] = [[-7.6, -2], [7.6, -2], [15.5, 6.2], [26.5, 9.5], [31.5, 10.5], [31, 18.8], [8, 19.8], [-10, 19.4], [-12.6, 11], [-10, 2.5]];
const Shoe: React.FC<{ A: P2; sgn: number; yaw: number; lift: number; k: number; fill: string; ink: Ink }> = ({ A, sgn, yaw, lift, k, fill, ink }) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const out = sgn * 4.5 * c;
  const pts = blendYaw(SHOE_F, SHOE_P, yaw).map((p, i): P2 => (i < 2 ? p : [p[0] + out, p[1]]));
  const bk: P2 = [mix(out, sg * 12, t), 6.8];
  const bw = mix(5.2, 3, t);
  return (
    <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) rotate(${lift.toFixed(2)}) scale(${k.toFixed(3)})`}>
      {/* the heel */}
      {t > 0.3 ? <path d={`M${-sg * 10.6},14L${-sg * 3},14L${-sg * 3.6},21.6L${-sg * 10.4},21.6Z`} fill={fill} {...OUT} strokeWidth={1.9} opacity={c01((t - 0.3) * 4)} /> : null}
      <path d={smoothClosed(pts)} fill={fill} {...OUT} strokeWidth={2.2} />
      <path d={`M${P(pts[7])}Q${P([pts[6][0], pts[6][1] - 3.6])} ${P(pts[5])}`} fill="none" stroke={ink.main} strokeWidth={1.1} strokeOpacity={0.55} strokeLinecap="round" />
      {/* the buckle */}
      <rect x={bk[0] - bw} y={bk[1] - 3.4} width={bw * 2} height={6.8} rx={1.2} fill="none" stroke={ink.main} strokeWidth={1.7} />
      <rect x={bk[0] - bw} y={bk[1] - 3.4} width={bw * 2} height={6.8} rx={1.2} fill="none" stroke={DARK} strokeWidth={0.6} strokeOpacity={0.7} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// HAIR TEXTURE (head-local): curls on a periwig, waves on his own hair
// ---------------------------------------------------------------------------
const curlRows = (x0: number, y0: number, x1: number, y1: number, size: number, seed: number) => {
  let d = "";
  let row = 0;
  for (let y = y0; y <= y1; y += size * 0.78, row++) {
    for (let x = x0 + ((row % 2) * size) / 2; x <= x1; x += size) {
      const jx = (hash(row * 31 + Math.round(x), seed) - 0.5) * size * 0.3;
      const s = size * (0.8 + 0.3 * hash(row * 17 + Math.round(x), seed + 3));
      const px = x + jx;
      d += `M${(px - s / 2).toFixed(1)},${y.toFixed(1)}C${(px - s / 2).toFixed(1)},${(y - s * 0.75).toFixed(1)} ${(px + s / 2).toFixed(1)},${(y - s * 0.75).toFixed(1)} ${(px + s / 2).toFixed(1)},${(y - s * 0.05).toFixed(1)}`;
    }
  }
  return d;
};
const waveStrands = (x0: number, y0: number, x1: number, y1: number, gap: number, amp: number, seed: number) => {
  let d = "";
  let i = 0;
  for (let x = x0; x <= x1; x += gap, i++) {
    const ph = hash(i, seed) * 6.28;
    const xs = x + (hash(i, seed + 1) - 0.5) * gap * 0.5;
    const ya = y0 + hash(i, seed + 2) * (y1 - y0) * 0.15;
    const yb = y1 - hash(i, seed + 3) * (y1 - y0) * 0.12;
    const pts: P2[] = [];
    for (let y = ya; y <= yb; y += 4) pts.push([xs + amp * Math.sin(y / 7 + ph), y]);
    if (pts.length > 1) d += `M${pts.map(P).join("L")}`;
  }
  return d;
};

// ---------------------------------------------------------------------------
// THE CAST MEMBER
// ---------------------------------------------------------------------------
export type Tool = "none" | "shovel";
export type LondonFigureProps = {
  kind: LondonKind;
  pose: FigPose;
  /** his feet (world px) and world px per unit (scaleForPx(px)) */
  at: P2;
  scale: number;
  uid: string;
  /** the coat, skirt, sleeves and breeches (default CREAM; ORANGE for the scientists) */
  coat?: Ink;
  /** face, hands, linen, stockings, the wig (default CREAM) */
  ink?: Ink;
  tone?: number;
  /** Fellow 0..4 */
  variant?: number;
  /** the hat under the near arm (default: the Fellow variant's) */
  hat?: boolean;
  /** the worker's knitted cap (default true) */
  cap?: boolean;
  tool?: Tool;
  /** the shovel's ink (default the figure's ink) */
  toolInk?: Ink;
};
export const LondonFigure: React.FC<LondonFigureProps> = (props) => {
  const { kind, pose: q, at, scale, uid, tone = 1 } = props;
  const look = lookOf(kind, props.variant ?? 0);
  const sp = look.spec;
  const ink = props.ink ?? CREAM;
  const coat = props.coat ?? CREAM;
  const tool: Tool = props.tool ?? "none";
  const hat = props.hat ?? look.hat;
  const cap = props.cap ?? true;
  const r = figureRig(sp, q);
  const { c, s } = r;
  const k = sp.limb;
  const hw = sp.hw;
  const shY = r.shY;
  const sfT = surface(q.yaw, hw * 0.94, hw * 0.94 * 0.58);
  const { side } = sfT;
  const mT = sfT.mF;
  const tf = `translate(${at[0].toFixed(3)} ${at[1].toFixed(3)}) scale(${scale.toFixed(5)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`;
  const headTf = `translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${sp.headScale})`;
  const shL: P2 = [-hw, shY];
  const shR: P2 = [hw, shY];
  const neck: P2 = [0, shY];
  const wst = 31;
  const profile = Math.abs(s) > 0.5;
  const G = s >= 0 ? 1 : -1;
  const worker = look.worker;
  const shoeFill = mixHex(ink.hair, DARK, 0.5);
  const linenDeep = ink.deep;

  // ---- legs: knee breeches (the coat's deep tone), stockings, buckled shoes ---------------
  const legs = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);
  const breeches = worker ? coat.deep : coat.deep;
  const legEl = (l: typeof r.legL) => {
    const u = norm(sub(l.A, l.K));
    const n: P2 = [-u[1], u[0]];
    const gt = mix2(l.K, l.A, 0.13);
    let knit = "";
    for (let j = -2; j <= 2; j++) knit += `M${P(add(mix2(l.K, l.A, 0.2), mul(n, j * 3 * k)))}L${P(add(mix2(l.K, l.A, 0.9), mul(n, j * 2.1 * k)))}`;
    return (
      <g key={l.sgn}>
        {/* the stocking */}
        <path d={limbD([[mix2(l.K, l.A, 0.02), 16 * k], [mix2(l.K, l.A, 0.34), 17.6 * k], [mix2(l.K, l.A, 0.8), 11.6 * k], [l.A, 10.6 * k]])} fill={ink.main} {...OUT} />
        <path d={knit} {...ln(0.7, 0.32)} />
        <path d={braceletD(l.K, l.A, 17 * k, 11.5 * k, 83 + l.sgn, 3.2, 0.65)} {...ln(0.9, 0.5)} />
        {/* the breeches, full to the knee, buckled under it */}
        <path d={limbD([[add(l.H, [0, -4]), 30 * k], [mix2(l.H, l.K, 0.5), 28.5 * k], [l.K, 23 * k], [gt, 19.5 * k]])} fill={breeches} {...OUT} />
        <path d={braceletD(l.H, l.K, 29 * k, 23 * k, 81 + l.sgn, 3)} {...ln(1, 0.6)} />
        <path d={`M${P(add(mix2(l.H, l.K, 0.25), mul(n, 4)))}Q${P(add(mix2(l.H, l.K, 0.6), mul(n, -2)))} ${P(add(l.K, mul(n, 3)))}`} {...ln(1, 0.45)} />
        <path d={limbD([[add(gt, mul(n, -10.5 * k)), 5.4], [add(gt, mul(n, 10.5 * k)), 5.4]])} fill={coat.hair} {...OUT} strokeWidth={1.7} />
        <Shoe A={l.A} sgn={l.sgn} yaw={q.yaw} lift={l.lift} k={k} fill={shoeFill} ink={ink} />
      </g>
    );
  };

  // ---- the coat's skirts: from the waist over the hips to just below the knee ---------------
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * 20;
  const fl = 3 * mix(1, 0.72, Math.abs(s));
  const waistPts = [-wst - 2, wst + 2].map((x) => r.toFig(side([x, -14])));
  const skPts: P2[] = [...waistPts];
  for (const l of [r.legL, r.legR]) {
    skPts.push(...circ(l.H, 27 * k, 12), ...circ(mix2(l.H, l.K, 0.5), 26 * k, 10), ...circ(add(l.K, [hdx * 0.3, 0]), 22 * k, 10));
    skPts.push(add(l.K, [-(24 + fl) * k + hdx, 12]), add(l.K, [(24 + fl) * k + hdx, 12]), add(l.K, [hdx, 14]));
  }
  const skBones: Bone[] = [r.legL, r.legR].flatMap((l): Bone[] => [
    { a: l.H, b: l.K, r: 24 * k },
    { a: l.K, b: l.A, r: 17 * k },
  ]);
  const skHull = drape(hull(skPts.map((p): P2 => [p[0], Math.min(p[1], -1.5)])), skBones);
  const SK = smoothClosed(skHull);
  const skX0 = Math.min(...skHull.map((p) => p[0]));
  const skX1 = Math.max(...skHull.map((p) => p[0]));
  const skY0 = Math.min(...waistPts.map((p) => p[1]));
  const skY1 = Math.max(...skHull.map((p) => p[1]));
  // the front opening of the coat, down the middle of the turned body
  const opTop = r.toFig(mT([2, -12]));
  const opX = opTop[0] + hdx * 0.35;
  const opBot: P2 = [opX, bottomAt(skHull, opX) - 1];
  // THE JUSTAUCORPS HANGS OPEN below the chest: an inverted V (torso frame: apex on the chest, the corners at the
  // waist; then down the skirts to the hem) shows the waistcoat and, below it, the breeches
  const vApex: P2 = [2, shY + 50];
  const vL: P2 = [-15, 8];
  const vR: P2 = [19, 8];
  const vLf = r.toFig(mT(vL));
  const vRf = r.toFig(mT(vR));
  const hemY = skY1 + 24;
  const vHemL: P2 = [opX - 30 + hdx * 0.2, hemY];
  const vHemR: P2 = [opX + 30 + hdx * 0.2, hemY];
  const ventXs = [mix(skX0, skX1, 0.14), mix(skX0, skX1, 0.86)];
  const BIG = "M-900,-900H900V900H-900Z";
  const SK_CUT = `${BIG}${polyD([r.toFig(mT(vApex)), vRf, vHemR, vHemL, vLf])}${ventXs.map((x) => polyD([[x - 4, hemY], [x + 4, hemY], [x, hemY - 34]])).join("")}`;
  const TOR_CUT = `${BIG}${polyD([mT(vApex), mT([vR[0], vR[1] + 6]), mT([vL[0], vL[1] + 6])])}`;
  const folds = [0.12, 0.3, 0.7, 0.88].map((t, i) => {
    const hx = mix(skX0 + 8, skX1 - 8, t) + 4 * (hash(i, 801) - 0.5);
    const hy = bottomAt(skHull, hx) - 3;
    const wx = mix(waistPts[0][0], waistPts[1][0], mix(0.15, 0.85, t));
    const wy = skY0 + 22 + 8 * hash(i, 802);
    const a: P2 = [wx, wy];
    const b: P2 = [hx, hy];
    const cc: P2 = [mix(wx, hx, 0.35) + (t - 0.5) * 10 + hdx * 0.3, mix(wy, hy, 0.55)];
    return { a, b, c: cc, i };
  });
  const pocket = (sd: number) => {
    const p0 = r.toFig(mT([sd * 12, 16]));
    const p1 = r.toFig(mT([sd * 34, 18]));
    const ok = Math.abs(p1[0] - p0[0]) > 6;
    if (!ok) return null;
    const lo0: P2 = [p0[0], p0[1] + 12];
    const lo1: P2 = [p1[0], p1[1] + 12];
    return (
      <g key={sd}>
        <path d={`M${P(p0)}L${P(p1)}L${P(lo1)}Q${P(mix2(lo0, lo1, 0.5))} ${P(lo0)}Z`} fill={coat.deep} {...OUT} strokeWidth={1.8} />
        {[0.25, 0.5, 0.75].map((t) => {
          const b = add(mix2(lo0, lo1, t), [0, -1.5]);
          return <circle key={t} cx={b[0]} cy={b[1]} r={2} fill={coat.main} stroke={DARK} strokeWidth={1} />;
        })}
      </g>
    );
  };
  // the waistcoat (cream, long, buttoned) — seen only in the coat's opening
  const waistcoatEl = worker ? null : (
    <g transform={torsoTf}>
      <clipPath id={`${uid}-wc`}>
        <path d={polyD([mT([-30, shY + 26]), mT([30, shY + 26]), mT([31, 30]), mT([4, 44]), mT([-29, 30])])} />
      </clipPath>
      <path d={polyD([mT([-30, shY + 26]), mT([30, shY + 26]), mT([31, 30]), mT([4, 44]), mT([-29, 30])])} fill={ink.deep} {...OUT} />
      <g clipPath={`url(#${uid}-wc)`}>
        <path d={segD(hatchSegs(4, shY + 20, 40, 50, 106, 2.6, 871), mT)} {...ln(0.9, 0.5)} />
        <path d={segD(subdivide([[[4, shY + 26], [4, 44]]], 10), mT)} {...ln(1.3, 0.75)} />
        <path d={`M${P(mT([-24, 14]))}L${P(mT([-8, 15]))}M${P(mT([12, 15]))}L${P(mT([27, 14]))}`} {...ln(1.3, 0.7)} />
      </g>
      {Array.from({ length: 7 }, (_, i) => mT([7.5, mix(shY + 52, 36, i / 6)])).map((b, i) => (
        <circle key={i} cx={b[0]} cy={b[1]} r={1.8} fill={ink.main} stroke={DARK} strokeWidth={0.9} />
      ))}
    </g>
  );
  const skirtEl = worker ? null : (
    <>
      <clipPath id={`${uid}-sk`}>
        <path d={SK} />
      </clipPath>
      <clipPath id={`${uid}-skc`}>
        <path d={SK_CUT} clipRule="evenodd" />
      </clipPath>
      <g clipPath={`url(#${uid}-skc)`}>
        <path d={SK} fill={coat.main} {...OUT} />
      </g>
      <g clipPath={`url(#${uid}-sk)`}>
       <g clipPath={`url(#${uid}-skc)`}>
        {look.coatBraid ? <path d={SK} fill="none" stroke={coat.deep} strokeWidth={9} /> : null}
        <path d={hatchD(mix(skX0, skX1, 0.6), skY0, skX1 + 4, skY1, 111, 3, 811)} {...ln(0.95, 0.58)} />
        <path d={hatchD(mix(skX0, skX1, 0.78), skY0 + 28, skX1 + 4, skY1, 62, 3.6, 812)} {...ln(0.9, 0.45)} />
        {folds.map((f) => (
          <path key={f.i} d={segD(foldHatchSegs(f.a, f.c, f.b, 820 + f.i, 8 + 4 * hash(f.i, 821)))} {...ln(0.9, 0.55)} />
        ))}
        <path d={folds.map((f) => `M${P(f.a)}Q${P(f.c)} ${P(f.b)}`).join("")} {...ln(1.4, 0.75)} />
        {/* the side vents */}
        <path d={ventXs.map((x) => `M${x.toFixed(1)},${(skY0 + 40).toFixed(1)}L${x.toFixed(1)},${hemY.toFixed(1)}`).join("")} {...ln(1.5, 0.85)} />
        {[-1, 1].map(pocket)}
       </g>
        {/* the open fronts: the edges (a facing strip) and the buttons down the left front */}
        <path d={`M${P(vLf)}L${P(vHemL)}M${P(vRf)}L${P(vHemR)}`} fill="none" stroke={coat.deep} strokeWidth={7} />
        <path d={`M${P(vLf)}L${P(vHemL)}M${P(vRf)}L${P(vHemR)}`} {...ln(2, 0.9)} />
        {Array.from({ length: 5 }, (_, i) => add(mix2(vLf, vHemL, 0.1 + i * 0.2), [-6, 0])).map((b, i) => (
          <circle key={i} cx={b[0]} cy={b[1]} r={2.4} fill={coat.deep} stroke={DARK} strokeWidth={1.1} />
        ))}
      </g>
    </>
  );
  void opBot;

  // ---- the coat's body (or the worker's waistcoat): fitted to the waist, buttoned ------------
  const TORSO =
    `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}` +
    `C${P(side([hw + 3, shY + 26]))} ${P(side([wst + 4, -52]))} ${P(side([wst + 1, -26]))}C${P(side([wst, -14]))} ${P(side([wst + 2, -4]))} ${P(side([wst + 3, 8]))}L${P(side([-wst - 3, 8]))}` +
    `C${P(side([-wst - 2, -4]))} ${P(side([-wst, -14]))} ${P(side([-wst - 1, -26]))}C${P(side([-wst - 4, -52]))} ${P(side([-hw - 3, shY + 26]))} ${P(side(add(shL, [1, -4])))}Z`;
  const body = worker ? coat.deep : coat.main;
  const buttons = Array.from({ length: worker ? 6 : 4 }, (_, i) => mT([4, worker ? mix(shY + 22, -6, i / 5) : mix(shY + 12, shY + 44, i / 3)]));
  const torsoEl = (
    <g transform={torsoTf}>
      <clipPath id={`${uid}-tor`}>
        <path d={TORSO} />
      </clipPath>
      {worker ? (
        // the shirt under the waistcoat, open at the throat
        <path d={TORSO} fill={ink.main} {...OUT} />
      ) : null}
      {!worker ? (
        <clipPath id={`${uid}-torc`}>
          <path d={TOR_CUT} clipRule="evenodd" />
        </clipPath>
      ) : null}
      <g clipPath={worker ? undefined : `url(#${uid}-torc)`}>
      <path d={worker ? `M${P(side([-hw + 6, shY + 4]))}Q${P(mT([0, shY + 30]))} ${P(side([hw - 6, shY + 4]))}L${P(side([wst + 3, 8]))}L${P(side([-wst - 3, 8]))}Z` : TORSO} fill={body} {...OUT} />
      <g clipPath={`url(#${uid}-tor)`}>
        <path d={segD(hatchSegs(hw * 0.34, shY + 4, hw + 8, 10, 113, 2.8, 831), side)} {...ln(1, 0.62)} />
        <path d={segD(hatchSegs(hw * 0.55, shY + 34, hw + 8, 10, 60, 3.4, 832), side)} {...ln(0.9, 0.45)} />
        {/* the drape from the shoulders to the waist */}
        <path d={[-1, 1].map((sd) => `M${P(mT([sd * (hw - 12), shY + 12]))}Q${P(mT([sd * 22, shY + 50]))} ${P(mT([sd * 14, -20]))}`).join("")} {...ln(1.15, 0.5)} />
        {/* the front edge and its buttons */}
        <path d={segD(subdivide([[[1, shY + (worker ? 22 : 6)], worker ? [2, 8] : [2, shY + 50]]], 10), mT)} {...ln(1.5, 0.82)} />
        {look.coatBraid && !worker ? <path d={segD(subdivide([[[-4, shY + 4], [-3, 8]]], 10), mT)} fill="none" stroke={coat.deep} strokeWidth={5} /> : null}
        {buttons.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r={2.5} fill={worker ? ink.main : coat.deep} stroke={DARK} strokeWidth={1.1} />
          </g>
        ))}
        {worker ? <path d={hatchD(-hw, shY - 6, hw, shY + 30, 96, 3, 835)} {...ln(0.8, 0.25)} /> : null}
      </g>
      </g>
      {!worker ? (
        <>
          <path d={`M${P(mT(vL))}L${P(mT(vApex))}L${P(mT(vR))}`} fill="none" stroke={coat.deep} strokeWidth={6} strokeLinejoin="round" />
          <path d={`M${P(mT([vL[0], vL[1] + 6]))}L${P(mT(vApex))}L${P(mT([vR[0], vR[1] + 6]))}`} {...ln(2, 0.9)} />
          {Array.from({ length: 4 }, (_, i) => add(mix2(mT(vApex), mT(vL), 0.15 + i * 0.25), [-5, 0])).map((b, i) => (
            <circle key={`e${i}`} cx={b[0]} cy={b[1]} r={2.4} fill={coat.deep} stroke={DARK} strokeWidth={1.1} />
          ))}
        </>
      ) : null}
      {/* the collar's back, round the neck */}
      <path d={limbD([[side([-15, shY - 1]), 7], [side([0, shY - 7]), 7], [side([15, shY - 1]), 7]])} fill={worker ? linenDeep : coat.deep} {...OUT} strokeWidth={2} />
    </g>
  );
  // the falling lace cravat / Newton's band / the worker's open shirt
  const neckwear = (() => {
    if (look.neck === "shirt") {
      return (
        <g transform={torsoTf}>
          <path d={`M${P(mT([-12, shY - 2]))}L${P(mT([0, shY + 20]))}L${P(mT([12, shY - 2]))}`} fill="none" {...OUT} strokeWidth={1.8} />
          <path d={`M${P(mT([-3, shY + 6]))}L${P(mT([0, shY + 14]))}`} {...ln(1, 0.5)} />
        </g>
      );
    }
    if (look.neck === "band") {
      return (
        <g transform={torsoTf}>
          {[-1, 1].map((sd) => (
            <path key={sd} d={polyD([mT([sd * 1, shY - 3]), mT([sd * 9, shY - 3]), mT([sd * 10.5, shY + 22]), mT([sd * 1.5, shY + 22])])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          ))}
          <path d={`M${P(mT([-6, shY + 4]))}L${P(mT([-6.5, shY + 18]))}M${P(mT([6, shY + 4]))}L${P(mT([6.5, shY + 18]))}`} {...ln(0.8, 0.4)} />
        </g>
      );
    }
    const top = mT([0, shY - 4]);
    const mid = mT([0, shY + 16]);
    const lace0 = mT([0, shY + 24]);
    const end = mT([1, shY + 44]);
    const ldir = norm(sub(end, lace0));
    const ln2: P2 = [-ldir[1], ldir[0]];
    const scal = Array.from({ length: 5 }, (_, i) => add(end, mul(ln2, (i - 2) * 4.4)));
    return (
      <g transform={torsoTf}>
        <path d={limbD([[top, 15], [mid, 11], [lace0, 13]])} fill={ink.main} {...OUT} strokeWidth={2} />
        <path d={limbD([[lace0, 16], [mix2(lace0, end, 0.5), 20], [end, 21]])} fill={ink.main} {...OUT} strokeWidth={2} />
        <path d={[0.25, 0.5, 0.75].map((t) => { const p = mix2(lace0, end, t); return `M${P(add(p, mul(ln2, -9)))}L${P(add(p, mul(ln2, 9)))}`; }).join("")} {...ln(0.9, 0.55)} />
        <path d={[-1, 0, 1].map((j) => `M${P(add(lace0, mul(ln2, j * 5)))}L${P(add(end, mul(ln2, j * 6)))}`).join("")} {...ln(0.7, 0.35)} />
        <path d={scal.map((p) => `M${P(add(p, mul(ln2, -2.2)))}q${P(add(mul(ldir, 4), mul(ln2, 2.2)))} ${P(mul(ln2, 4.4))}`).join("")} {...ln(1, 0.7)} />
        <path d={`M${P(add(top, [-5, 2]))}Q${P(add(mid, [2, 0]))} ${P(add(lace0, [-3, -1]))}`} {...ln(0.9, 0.45)} />
      </g>
    );
  })();
  // the worker's leather apron, from the chest to below the knee, a strap round the neck
  const apronEl = (() => {
    if (!worker) return null;
    const top = r.toFig(mT([0, shY + 34]));
    const kn = add(mix2(r.legL.K, r.legR.K, 0.5), [hdx * 0.3, 18]);
    const ax = norm(sub(kn, top));
    const len = Math.max(60, vlen(sub(kn, top)));
    const n: P2 = [-ax[1], ax[0]];
    const wf = sfT.wf;
    const bot = add(top, mul(ax, len));
    const pts: P2[] = [add(top, mul(n, 17 * wf)), add(mix2(top, bot, 0.35), mul(n, 25 * wf)), add(bot, mul(n, 27 * wf)), add(bot, mul(n, -27 * wf)), add(mix2(top, bot, 0.35), mul(n, -25 * wf)), add(top, mul(n, -17 * wf))];
    const AP = polyD(pts);
    const strapA = r.toFig(side([-14, shY - 3]));
    const strapB = r.toFig(side([14, shY - 3]));
    const leather = mixHex(ink.hair, ink.deep, 0.25);
    return (
      <g transform={tf}>
        <Cased id={`${uid}-apc`}>
          <path d={`M${P(pts[0])}L${P(strapB)}M${P(pts[5])}L${P(strapA)}`} fill="none" stroke={DARK} strokeWidth={4.6} strokeLinecap="round" />
          <path d={`M${P(pts[0])}L${P(strapB)}M${P(pts[5])}L${P(strapA)}`} fill="none" stroke={leather} strokeWidth={2.4} strokeLinecap="round" />
          <clipPath id={`${uid}-ap`}>
            <path d={AP} />
          </clipPath>
          <path d={AP} fill={leather} {...OUT} />
          <g clipPath={`url(#${uid}-ap)`}>
            <path d={hatchD(Math.min(...pts.map((p) => p[0])) - 4, Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])) + 4, Math.max(...pts.map((p) => p[1])), 104, 2.8, 891)} {...ln(0.9, 0.55)} />
            <path d={[0.3, 0.55, 0.8].map((t) => `M${P(add(mix2(top, bot, t * 0.4), mul(n, (t - 0.55) * 30 * wf)))}Q${P(add(mix2(top, bot, t * 0.7), mul(n, (t - 0.55) * 34 * wf)))} ${P(add(bot, mul(n, (t - 0.55) * 46 * wf)))}`).join("")} {...ln(1.2, 0.6)} />
            <path d={`M${P(add(top, mul(ax, 3)))}L${P(add(add(top, mul(ax, 3)), mul(n, 1)))}`} {...ln(1, 0.5)} />
          </g>
          <path d={`M${P(add(top, mul(n, -15 * wf)))}L${P(add(top, mul(n, 15 * wf)))}`} {...ln(1.4, 0.75)} />
        </Cased>
      </g>
    );
  })();

  // ---- the arms: the rig's own arm and hand (the shirt sleeve), the coat sleeve and cuff over it ---
  const sleeve = (ar: typeof r.armL) => {
    const fu = norm(sub(ar.W, ar.E));
    const fn: P2 = [-fu[1], fu[0]];
    const fl2 = vlen(sub(ar.W, ar.E));
    if (worker) {
      // the shirt sleeve over the upper arm, rolled above the elbow
      const roll = add(ar.E, mul(fu, -3 * k));
      return (
        <>
          <path d={limbD(bones(ar.S, mix2(ar.S, ar.E, 0.6), roll, [27, 27, 26, 25, 24].map((w) => w * k)))} fill={ink.main} {...OUT} />
          <path d={braceletD(ar.S, roll, 26 * k, 24 * k, 851 + ar.sgn, 3)} {...ln(0.95, 0.55)} />
          <path d={[0.3, 0.6].map((t) => `M${P(add(mix2(ar.S, roll, t), mul(norm(sub(roll, ar.S)), -6)))}q4,5 9,2`).join("")} {...ln(1, 0.5)} />
          <path d={limbD([[add(roll, mul([-norm(sub(roll, ar.S))[1], norm(sub(roll, ar.S))[0]] as P2, -13 * k)), 9], [add(roll, mul([-norm(sub(roll, ar.S))[1], norm(sub(roll, ar.S))[0]] as P2, 13 * k)), 9]])} fill={linenDeep} {...OUT} strokeWidth={1.9} />
        </>
      );
    }
    const cuffA = add(ar.E, mul(fu, Math.min(fl2 * 0.1, 6)));
    const cuffB = add(ar.E, mul(fu, Math.min(fl2 * 0.5, 26)));
    const st = bones(ar.S, ar.E, cuffA, [28, 26.5, 23, 23, 23].map((w) => w * k));
    // the wrist ruffle of the shirt
    const rf = add(ar.W, mul(fu, -9 * k));
    return (
      <>
        <path d={limbD([[add(rf, mul(fu, -3)), 17 * k], [rf, 23 * k], [add(rf, mul(fu, 5)), 22 * k]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
        <path d={[-2, -1, 0, 1, 2].map((j) => `M${P(add(add(rf, mul(fu, 4.5)), mul(fn, j * 4.4 * k - 2)))}q${P(add(mul(fu, 2.6), mul(fn, 2.2)))} ${P(mul(fn, 4.4))}`).join("")} {...ln(0.9, 0.6)} />
        <path d={limbD(st)} fill={coat.main} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 28 * k, 23 * k, 851 + ar.sgn, 3)} {...ln(1, 0.62)} />
        <path d={`M${P(add(ar.E, mul(fn, -8 * k)))}Q${P(add(ar.E, add(mul(fn, 1), mul(fu, -6))))} ${P(add(ar.E, mul(fn, 9 * k)))}`} {...ln(1.15, 0.55)} />
        {/* the deep turned-back cuff */}
        <path d={limbD([[cuffA, 27 * k], [mix2(cuffA, cuffB, 0.5), 29 * k], [cuffB, 31 * k]])} fill={coat.deep} {...OUT} />
        <path d={braceletD(cuffA, cuffB, 27 * k, 31 * k, 857 + ar.sgn, 3.2, 0.7)} {...ln(0.95, 0.55)} />
        {look.coatBraid ? <path d={`M${P(add(cuffB, mul(fn, -15 * k)))}L${P(add(cuffB, mul(fn, 15 * k)))}`} fill="none" stroke={coat.main} strokeWidth={3} /> : null}
        {[0.3, 0.7].map((t) => {
          const b = add(mix2(cuffA, cuffB, t), mul(fn, ar.sgn * 9 * k));
          return <circle key={t} cx={b[0]} cy={b[1]} r={2.2} fill={coat.main} stroke={DARK} strokeWidth={1} />;
        })}
      </>
    );
  };
  const armEl = (w: "L" | "R") => {
    const ar = w === "L" ? r.armL : r.armR;
    return (
      <React.Fragment key={w}>
        <Figure spec={sp} pose={q} at={at} scale={scale} uid={`${uid}-a${w}`} body={false} arms={w} ink={ink} />
        <g transform={tf}>
          <Cased id={`${uid}-sl${w}`}>{sleeve(ar)}</Cased>
        </g>
      </React.Fragment>
    );
  };

  // ---- the hat under his arm (a broad brim, the crown pressed flat against his side) --------
  const hatEl = (() => {
    if (!hat || worker) return null;
    const near = G > 0 ? r.armL : r.armR;
    const cen = add(near.grip, [G * 3, 30]);
    const ang = -G * 6 + q.lean * 0.3;
    const brim = mixHex(ink.hair, DARK, 0.55);
    return (
      <g transform={`${tf} translate(${P(cen)}) rotate(${ang.toFixed(2)})`}>
        <Cased id={`${uid}-hat`}>
          <ellipse cx={0} cy={0} rx={12 + 7 * Math.abs(c)} ry={36} fill={brim} {...OUT} />
          <ellipse cx={G * 3} cy={2} rx={7 + 4 * Math.abs(c)} ry={22} fill={mixHex(ink.hair, DARK, 0.35)} {...OUT} strokeWidth={1.8} />
          <path d={`M${G * -6},-30Q${G * 10},0 ${G * -6},30`} {...ln(1, 0.5)} />
          <path d={hatchD(-20, -46, 22, 46, 100, 3, 977)} {...ln(0.8, 0.35)} />
        </Cased>
      </g>
    );
  })();

  // ---- the shovel in his two fists ------------------------------------------------------------
  const shovelEl = (() => {
    if (tool !== "shovel") return null;
    const tInk = props.toolInk ?? ink;
    const near = G > 0 ? r.armL : r.armR;
    const far = G > 0 ? r.armR : r.armL;
    const gN = add(near.W, mul(near.dir, 10 * k));
    const gF = add(far.W, mul(far.dir, 10 * k));
    let u = sub(gF, gN);
    if (vlen(u) < 8) u = [G * 1, 0.6];
    u = norm(u);
    return <ShovelArt top={add(gN, mul(u, -14))} dir={u} ink={tInk} tf={tf} uid={`${uid}-shv`} />;
  })();

  // ---- the head: the rig's face, its hair erased; the periwig, his own hair or the cap over it --
  const headSpec: Spec = { ...sp, hem: 0 };
  const nod = Math.max(0, r.nodF);
  const hy = q.headYaw;
  const hc = Math.cos(hy);
  const hs = Math.sin(hy);
  const FACE = smoothClosed(blendYaw(FACE_F, FACE_P, hy));
  const faceClip = smoothClosed(blendYaw(FACE_F, FACE_P, hy).map((p): P2 => [p[0] * 1.08, p[1] * 1.07 + 5 * nod]));
  const RIGHAIR = smoothClosed(rigHair(hy));
  const hairCol = look.greyHair ? mixHex(ink.main, ink.hair, look.hair === "own" ? 0.42 : 0.3) : look.hairTone < 0.3 ? mixHex(ink.deep, ink.hair, look.hairTone * 1.6) : mixHex(ink.hair, DARK, (look.hairTone - 0.3) * 0.62);
  const hairBack = mixHex(hairCol, DARK, 0.22);
  const hairLine = look.hairTone > 0.75 ? 0.55 : 0.75;
  const wigEls = (() => {
    if (look.hair === "cropped") return { back: null as React.ReactNode, front: null as React.ReactNode };
    const own = look.hair === "own";
    const R = look.wigR;
    const cy = own ? -9 : -11;
    const proj = (X: number, Y: number, Z: number): P2 => [X * hc + Z * hs, Y];
    const depthOf = (X: number, Z: number) => Z * hc - X * hs;
    const rho = (y: number) => Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
    const hyDeg = (hy * 180) / Math.PI;
    const yh = (phiDeg: number) => {
      const a = Math.abs(phiDeg);
      if (own) return a < 70 ? mix(-19, -13, a / 70) : a < 100 ? mix(-13, -4, (a - 70) / 30) : 10;
      return a < 6 ? -18 + 3 * (a / 6) : a < 60 ? mix(-15, -11, (a - 6) / 54) : a < 92 ? mix(-11, -4, (a - 60) / 32) : a < 125 ? mix(-4, 14, (a - 92) / 33) : 24;
    };
    // the crown: the visible hairline from one silhouette crossing to the other, then over the top
    const crown: P2[] = [];
    for (let ph = -90 - hyDeg; ph <= 90 - hyDeg + 0.01; ph += 4) {
      const y = yh(ph);
      const rr = rho(y) + (own ? 0.5 : 1.2);
      crown.push([rr * Math.sin(((ph + hyDeg) * Math.PI) / 180), y]);
    }
    const yr = crown[crown.length - 1][1];
    const yl = crown[0][1];
    const a0 = Math.atan2(yr - cy, rho(yr));
    let a1 = Math.atan2(yl - cy, -rho(yl));
    if (a1 > a0) a1 -= 2 * Math.PI;
    const bumps = own ? 0.6 : 1.8;
    for (let i = 1; i < 40; i++) {
      const a = mix(a0, a1, i / 40);
      const rr = R + 1.2 + bumps * Math.abs(Math.sin(a * (own ? 6 : 9)));
      crown.push([rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    const CROWN = smoothClosed(crown);
    // the long locks at each side, falling over the shoulders onto the chest
    const L = look.lockLen;
    const lockY = own ? [-10, 10, 30, 48, L] : [-12, 10, L * 0.42, L * 0.66, L * 0.88, L];
    const lockR = own ? [R - 3, R - 1, R, R + 1, R - 1] : [R - 2, R, R + 1.5, R + 2.5, R + 2, R];
    const lockW = own ? [13, 15, 16, 15, 10] : [16, 20, 23, 24, 22, 15];
    const phc = own ? 98 : 102;
    const locks = [-1, 1].map((sd) => {
      const pts = lockY.map((y, i): St => {
        const X = sd * lockR[i] * Math.sin((phc * Math.PI) / 180);
        const Z = lockR[i] * Math.cos((phc * Math.PI) / 180) + (y > 30 ? (own ? 3 : 6) * c01((y - 30) / 40) : 0);
        return [proj(X, y, Z), lockW[i] * mix(1, own ? 1.25 : 1.4, Math.abs(hs))];
      });
      const X = sd * R;
      const dep = depthOf(X, 3);
      return { sd, d: limbD(pts), dep, x0: Math.min(...pts.map((p) => p[0][0])) - 20, x1: Math.max(...pts.map((p) => p[0][0])) + 20 };
    });
    // the mass behind: the head's silhouette and the hair down the back
    const backPts: P2[] = [...circ([0, cy], R + 2, 24)];
    for (let ph = 90; ph <= 270; ph += 15) {
      const rr = R + 3;
      const X = rr * Math.sin((ph * Math.PI) / 180);
      const Z = rr * Math.cos((ph * Math.PI) / 180);
      backPts.push(proj(X, own ? 52 : look.lockLen - 6, Z), proj(X, own ? 30 : 50, Z));
    }
    const BACK = smoothClosed(hull(backPts));
    const yTop = cy - R - 4;
    const texCrown = own ? (
      <>
        {/* the parting, the hair swept down from it */}
        <path d={[-3, -2, -1, 1, 2, 3].map((j) => { const x0 = proj(j * 1.2, yTop + 4, R * 0.7)[0]; const x1 = proj(j * 11, -6, R * 0.5)[0]; return `M${x0.toFixed(1)},${(yTop + 5).toFixed(1)}Q${(x0 + (x1 - x0) * 0.2).toFixed(1)},${(cy - 14).toFixed(1)} ${x1.toFixed(1)},${(-4 + Math.abs(j) * 2).toFixed(1)}`; }).join("")} {...ln(1, hairLine * 0.8)} />
        <path d={waveStrands(-R - 4, yTop, R + 4, 10, 4.2, 1.6, 641)} {...ln(0.85, hairLine * 0.55)} />
      </>
    ) : (
      <path d={curlRows(-R - 6, yTop + 4, R + 6, 12, 7.5, 651)} {...ln(1.05, hairLine)} />
    );
    const shade = (x0: number, y0: number, x1: number, y1: number, seed: number) => <path d={hatchD(x0, y0, x1, y1, 112, 2.6, seed, 0.15)} {...ln(0.9, 0.5)} />;
    const lockEl = (lk: (typeof locks)[number], masked: boolean, outlined = true) => (
      <g key={lk.sd} mask={masked ? `url(#${uid}-fm)` : undefined}>
        <clipPath id={`${uid}-lk${lk.sd}`}>
          <path d={lk.d} />
        </clipPath>
        <path d={lk.d} fill={hairCol} {...(outlined ? OUT : {})} strokeWidth={outlined ? 2.2 : 0} />
        <g clipPath={`url(#${uid}-lk${lk.sd})`}>
          {own ? <path d={waveStrands(lk.x0, -10, lk.x1, 70, 3.6, 2.2, 661 + lk.sd)} {...ln(0.95, hairLine * 0.8)} /> : <path d={waveStrands(lk.x0, -8, lk.x1, look.lockLen + 6, 5.2, 2.8, 661 + lk.sd) + curlRows(lk.x0, 0, lk.x1, look.lockLen + 4, 8, 671 + lk.sd)} {...ln(1, hairLine * 0.85)} />}
          {shade(lk.x0 + (lk.x1 - lk.x0) * 0.45, -8, lk.x1, look.lockLen + 8, 681 + lk.sd)}
        </g>
      </g>
    );
    const back = (
      <g>
        <clipPath id={`${uid}-wb`}>
          <path d={BACK} />
        </clipPath>
        <path d={BACK} fill={hairBack} {...OUT} />
        <g clipPath={`url(#${uid}-wb)`}>
          <path d={waveStrands(-R - 20, cy - R, R + 20, look.lockLen + 10, 5, 2.6, 691)} {...ln(1, 0.6)} />
          {shade(-R - 20, cy, R + 20, look.lockLen + 10, 692)}
        </g>
      </g>
    );
    const front = (
      <>
        <mask id={`${uid}-fm`} maskUnits="userSpaceOnUse" x={-300} y={-300} width={600} height={600}>
          <rect x={-300} y={-300} width={600} height={600} fill="white" />
          <path d={FACE} fill="black" />
        </mask>
        {locks.filter((lk) => lk.dep < 0).map((lk) => lockEl(lk, true))}
        {/* the crown and the near locks are ONE mass of hair: the outlines first, then the fills over them */}
        <path d={CROWN} fill="none" {...OUT} strokeWidth={4.8} />
        {locks.filter((lk) => lk.dep >= 0).map((lk) => <path key={`o${lk.sd}`} d={lk.d} fill="none" {...OUT} strokeWidth={4.4} />)}
        <clipPath id={`${uid}-cr`}>
          <path d={CROWN} />
        </clipPath>
        <path d={CROWN} fill={hairCol} />
        <g clipPath={`url(#${uid}-cr)`}>
          {texCrown}
          {shade(R * 0.15 + 6 * hs, yTop, R + 8, 14, 701)}
        </g>
        {locks.filter((lk) => lk.dep >= 0).map((lk) => lockEl(lk, false, false))}
      </>
    );
    return { back, front };
  })();
  // the worker's knitted cap
  const capEl = (() => {
    if (!worker || !cap) return null;
    const D = blendYaw(DOME_F, DOME_P, hy).map((p): P2 => [p[0] * 1.07, p[1] * 0.8 - 6]);
    const DD = smoothClosed(D);
    // the knitted crown slouches over to the back of his head
    const tipX = (hs >= 0 ? -1 : 1) * (8 + 12 * Math.abs(hs)) - 6 * hc;
    const TIP = limbD([[[tipX * 0.3, -38], 22], [[tipX * 0.8, -40], 18], [[tipX * 1.3, -34], 12]]);
    return (
      <>
        <path d={TIP} fill={mixHex(ink.deep, ink.hair, 0.55)} {...OUT} />
        <path d={hatchD(tipX - 20, -52, tipX + 20, -24, 112, 2.6, 713)} {...ln(0.8, 0.4)} clipPath={`url(#${uid}-cpt)`} />
        <clipPath id={`${uid}-cpt`}>
          <path d={TIP} />
        </clipPath>
        <clipPath id={`${uid}-cp`}>
          <path d={DD} />
        </clipPath>
        <path d={DD} fill={mixHex(ink.deep, ink.hair, 0.45)} {...OUT} />
        <g clipPath={`url(#${uid}-cp)`}>
          <path d={waveStrands(-34, -50, 34, -8, 3.4, 0.6, 711)} {...ln(0.85, 0.5)} />
          <path d={hatchD(4 + 8 * hs, -50, 34, -8, 112, 2.6, 712)} {...ln(0.9, 0.5)} />
        </g>
        <path d={limbD([[D[0], 8.5], [mix2(D[0], D[6], 0.5), 9], [D[6], 8.5]].map(([p, w]) => [add(p as P2, [0, -1]), w as number]))} fill={mixHex(ink.deep, ink.hair, 0.3)} {...OUT} strokeWidth={2} />
      </>
    );
  })();
  const faceTf = look.faceW !== 1 ? (() => {
    const hcW: P2 = add(at, mul(r.headC, scale));
    return `translate(${P(hcW)}) scale(${look.faceW} 1) translate(${(-hcW[0]).toFixed(2)} ${(-hcW[1]).toFixed(2)})`;
  })() : undefined;
  const wigBackEl = wigEls.back ? (
    <g transform={`${tf} ${headTf}`}>
      <Cased id={`${uid}-wbc`} r={1.4}>
        {wigEls.back}
      </Cased>
    </g>
  ) : null;
  const headEl = (
    <>
      <clipPath id={`${uid}-hc`}>
        <path transform={`${tf} ${headTf}`} d={faceClip} />
      </clipPath>
      <g transform={faceTf}>
        <g clipPath={`url(#${uid}-hc)`}>
          <Figure spec={headSpec} pose={q} at={at} scale={scale} uid={`${uid}-hd`} arms="none" ink={ink} />
        </g>
      </g>
      <g transform={`${tf} ${headTf}`}>
        {look.hair !== "cropped" || (worker && cap) ? (
          <g transform={look.faceW !== 1 ? `scale(${look.faceW} 1)` : undefined}>
            {/* the rig's own cropped hair erased inside the face (the wig replaces it) */}
            <clipPath id={`${uid}-pf`}>
              <path d={FACE} />
            </clipPath>
            <g clipPath={`url(#${uid}-pf)`}>
              <path d={RIGHAIR} fill={ink.main} />
              <path d={FACE} fill="none" {...OUT} />
            </g>
          </g>
        ) : null}
        <Cased id={`${uid}-hdc`} r={1.3}>
          {wigEls.front}
          {capEl}
        </Cased>
      </g>
    </>
  );

  // ---- assembly --------------------------------------------------------------------------
  const NECK = limbD([[add(r.neck, [0, 5]), 21 * k * (0.8 + 0.2 * sfT.wf)], [mix2(r.neck, add(r.headC, [-7 * r.hs * sp.headScale, 0]), 0.78), 16.5 * k]]);
  const nearKey: "L" | "R" = G > 0 ? "L" : "R";
  const farKey: "L" | "R" = G > 0 ? "R" : "L";
  return (
    <g opacity={tone}>
      {wigBackEl}
      {profile ? armEl(farKey) : null}
      <g transform={tf}>
        <Cased id={`${uid}-bd`}>
          {legs.map(legEl)}
          {waistcoatEl}
          {skirtEl}
        </Cased>
      </g>
      <g transform={tf}>
        <Cased id={`${uid}-tc`}>
          <path d={NECK} fill={ink.main} {...OUT} />
          <path d={braceletD(add(r.neck, [0, 4]), mix2(r.neck, r.headC, 0.5), 20 * k, 17 * k, 89, 2.4)} {...ln(0.9, 0.6)} />
          {torsoEl}
          {neckwear}
        </Cased>
      </g>
      {apronEl}
      {headEl}
      {hatEl}
      {profile ? armEl(nearKey) : [r.armL, r.armR].sort((p, q2) => p.z - q2.z).map((ar) => armEl(ar.sgn < 0 ? "L" : "R"))}
      {shovelEl}
    </g>
  );
};

type CastProps = Omit<LondonFigureProps, "kind" | "uid"> & { uid?: string };
/** a Royal Society gentleman (variant 0..4) */
export const Fellow: React.FC<CastProps> = ({ uid = "fel", ...p }) => <LondonFigure kind="fellow" uid={uid} {...p} />;
/** Isaac Newton: his own long hair, the white band; coat={ORANGE} for "the science" */
export const Newton: React.FC<CastProps> = ({ uid = "nwt", ...p }) => <LondonFigure kind="newton" uid={uid} {...p} />;
/** Samuel Pepys: the dark periwig, the fuller face, the rich coat */
export const Pepys: React.FC<CastProps> = ({ uid = "pep", ...p }) => <LondonFigure kind="pepys" uid={uid} {...p} />;
/** a working man: waistcoat, rolled shirt sleeves, leather apron; cap={false} bare-headed; tool="shovel" */
export const Worker: React.FC<CastProps> = ({ uid = "wrk", ...p }) => <LondonFigure kind="worker" uid={uid} {...p} />;
/** a Fellow at the telescope (defaults: variant 1, POSES.eyepiece(1)) */
export const Astronomer: React.FC<Omit<CastProps, "pose"> & { pose?: FigPose; dir?: 1 | -1 }> = ({ uid = "ast", pose, dir = 1, variant = 1, ...p }) => (
  <LondonFigure kind="fellow" uid={uid} variant={variant} pose={pose ?? POSES.eyepiece(dir)} {...p} />
);

// ---------------------------------------------------------------------------
// PROPS (world px; `at` = where it stands on the floor, scale = px per unit like a man's)
// ---------------------------------------------------------------------------
/** the coal shovel: `top` = the end of the handle, `dir` = down the shaft to the blade (figure-local) */
const SHOVEL_LEN = 196;
const ShovelArt: React.FC<{ top: P2; dir: P2; ink: Ink; tf: string; uid: string }> = ({ top, dir, ink, tf, uid }) => {
  const n: P2 = [-dir[1], dir[0]];
  const neckP = add(top, mul(dir, SHOVEL_LEN - 46));
  const bl0 = add(top, mul(dir, SHOVEL_LEN - 40));
  const bl1 = add(top, mul(dir, SHOVEL_LEN + 4));
  const BLADE = polyD([add(bl0, mul(n, -14)), add(bl0, mul(n, 14)), add(bl1, mul(n, 17)), add(add(bl1, mul(dir, 3)), mul(n, 0)), add(bl1, mul(n, -17))]);
  return (
    <g transform={tf}>
      <Cased id={`${uid}-c`}>
        <path d={limbD([[add(top, mul(n, -9)), 5], [add(top, mul(n, 9)), 5]])} fill={ink.deep} {...OUT} strokeWidth={1.9} />
        <path d={limbD([[top, 7], [mix2(top, neckP, 0.5), 7.4], [neckP, 6.6]])} fill={ink.deep} {...OUT} strokeWidth={2} />
        <path d={`M${P(add(top, mul(n, 1.6)))}L${P(add(neckP, mul(n, 1.4)))}`} {...ln(0.8, 0.45)} />
        <path d={BLADE} fill={mixHex(ink.hair, DARK, 0.25)} {...OUT} />
        <path d={`M${P(add(bl0, mul(n, -10)))}L${P(add(bl1, mul(n, -12)))}M${P(add(bl0, mul(n, 10)))}L${P(add(bl1, mul(n, 12)))}`} {...ln(1, 0.5)} />
      </Cased>
    </g>
  );
};
/** a free shovel (lying or leaning): `at` = the handle's end (world), angle deg (0 = blade straight down) */
export const Shovel: React.FC<{ at: P2; scale: number; angle?: number; ink?: Ink; uid?: string; tone?: number }> = ({ at, scale, angle = 0, ink = CREAM, uid = "shv", tone = 1 }) => {
  const d = rot([0, 1], angle);
  return (
    <g opacity={tone}>
      <ShovelArt top={[0, 0]} dir={d} ink={ink} tf={`translate(${P(at)}) scale(${scale.toFixed(5)})`} uid={uid} />
    </g>
  );
};

/** the long table (a cloth over it, turned legs below); top surface height and size in units */
export const TABLE = { w: 460, h: 140, depth: 70 };
/** the world point at the middle of the table's top front edge */
export const tableTop = (at: P2, scale: number): P2 => [at[0], at[1] - TABLE.h * scale];
export const Table: React.FC<{ at: P2; scale: number; tone?: number; ink?: Ink; uid?: string; w?: number }> = ({ at, scale, tone = 1, ink = CREAM, uid = "tbl", w = TABLE.w }) => {
  const hw = w / 2;
  const h = TABLE.h;
  const d = TABLE.depth;
  const skew = 26; // the top's back edge, shifted up-right (a view from slightly above)
  const top = [[-hw, -h], [hw, -h], [hw + skew, -h - d * 0.42], [-hw + skew, -h - d * 0.42]] as P2[];
  const clothBot = -h + 62;
  const CLOTH = `M${-hw - 6},${-h}L${hw + 6},${-h}L${hw + 9},${clothBot}Q${hw * 0.5},${clothBot + 5} 0,${clothBot + 1}Q${-hw * 0.5},${clothBot + 5} ${-hw - 9},${clothBot}Z`;
  const leg = (x: number, back: boolean) => {
    const y0 = clothBot - 4 - (back ? 10 : 0);
    const y1 = back ? -14 : 0;
    const xx = x + (back ? skew * 0.8 : 0);
    return (
      <g key={`${x}${back}`}>
        <path d={limbD([[[xx, y0], 15], [[xx, mix(y0, y1, 0.3)], 22], [[xx, mix(y0, y1, 0.5)], 12], [[xx, mix(y0, y1, 0.72)], 18], [[xx, y1 - 4], 11], [[xx, y1], 15]])} fill={back ? ink.deep : ink.main} {...OUT} />
        <path d={hatchD(xx, y0, xx + 12, y1, 100, 2.6, 931 + x)} {...ln(0.85, 0.5)} />
      </g>
    );
  };
  return (
    <g transform={`translate(${P(at)}) scale(${scale.toFixed(5)})`} opacity={tone}>
      <Cased id={`${uid}-c`} r={1.6}>
        {[-hw + 30, hw - 30].map((x) => leg(x, true))}
        {/* the stretcher between the legs */}
        <path d={limbD([[[-hw + 30, -30], 7], [[hw - 30, -30], 7]])} fill={ink.deep} {...OUT} strokeWidth={2} />
        {[-hw + 30, hw - 30].map((x) => leg(x, false))}
        <path d={polyD(top)} fill={ink.main} {...OUT} />
        <path d={hatchD(-hw, -h - d * 0.42, hw + skew, -h, 8, 3.4, 941, 0.2)} {...ln(0.8, 0.35)} />
        <clipPath id={`${uid}-cl`}>
          <path d={CLOTH} />
        </clipPath>
        <path d={CLOTH} fill={ink.main} {...OUT} />
        <g clipPath={`url(#${uid}-cl)`}>
          <path d={hatchD(-hw - 10, -h, hw + 10, clothBot + 6, 100, 3.2, 951)} {...ln(0.85, 0.42)} />
          <path d={Array.from({ length: 9 }, (_, i) => { const x = -hw + 20 + i * ((2 * hw - 40) / 8); return `M${x.toFixed(1)},${-h + 6}Q${(x + 4).toFixed(1)},${-h + 34} ${(x + 2).toFixed(1)},${clothBot - 1}`; }).join("")} {...ln(1.2, 0.6)} />
          <path d={`M${-hw - 8},${clothBot - 8}Q0,${clothBot - 3} ${hw + 8},${clothBot - 8}`} {...ln(1.1, 0.55)} />
        </g>
      </Cased>
    </g>
  );
};
/** a terrestrial globe on its turned stand (stands ON a surface at `at`); ~95 units tall */
export const Globe: React.FC<{ at: P2; scale: number; tone?: number; ink?: Ink; uid?: string; turn?: number }> = ({ at, scale, tone = 1, ink = CREAM, uid = "glb", turn = 0 }) => {
  const R = 34;
  const cy = -62;
  const meridians = [-60, -30, 0, 30, 60].map((a) => {
    const rx = Math.abs(R * Math.sin(((a + turn) * Math.PI) / 180));
    return `M0,${cy - R}A${rx.toFixed(1)},${R} 0 0 ${Math.sin(((a + turn) * Math.PI) / 180) > 0 ? 1 : 0} 0,${cy + R}`;
  });
  return (
    <g transform={`translate(${P(at)}) scale(${scale.toFixed(5)})`} opacity={tone}>
      <Cased id={`${uid}-c`} r={1.4}>
        <path d={limbD([[[0, 0], 30], [[0, -6], 22], [[0, -14], 9], [[0, -20], 15], [[0, -26], 8]])} fill={ink.deep} {...OUT} />
        <path d={`M${-R - 6},${cy + 10}Q0,${cy + 26} ${R + 6},${cy + 10}`} fill="none" stroke={DARK} strokeWidth={6} strokeLinecap="round" />
        <path d={`M${-R - 6},${cy + 10}Q0,${cy + 26} ${R + 6},${cy + 10}`} fill="none" stroke={ink.deep} strokeWidth={3.2} strokeLinecap="round" />
        <clipPath id={`${uid}-g`}>
          <circle cx={0} cy={cy} r={R} />
        </clipPath>
        <circle cx={0} cy={cy} r={R} fill={ink.main} {...OUT} />
        <g clipPath={`url(#${uid}-g)`}>
          <path d={meridians.join("")} {...ln(0.9, 0.55)} />
          <path d={[-20, 0, 20].map((y) => `M${-R},${cy + y}Q0,${cy + y + 5} ${R},${cy + y}`).join("")} {...ln(0.9, 0.55)} />
          {/* a continent or two, dark */}
          <path d={`M${-14 + turn * 0.2},${cy - 18}q10,-6 16,2q2,10 -6,14q-4,10 -10,4q-6,-8 0,-20Z`} fill={ink.hair} opacity={0.75} />
          <path d={`M${8 + turn * 0.2},${cy + 4}q8,-2 10,6q-2,10 -8,12q-6,-6 -2,-18Z`} fill={ink.hair} opacity={0.75} />
          <path d={hatchD(4, cy - R, R, cy + R, 112, 2.6, 961)} {...ln(0.9, 0.55)} />
        </g>
        {/* the meridian ring */}
        <path d={`M${-6},${cy - R - 5}A${R + 5},${R + 5} 0 0 1 ${6},${cy + R + 5}`} fill="none" stroke={DARK} strokeWidth={5.4} />
        <path d={`M${-6},${cy - R - 5}A${R + 5},${R + 5} 0 0 1 ${6},${cy + R + 5}`} fill="none" stroke={ink.deep} strokeWidth={2.6} />
        <path d={`M${-R - 6},${cy + 10}Q0,${cy - 4} ${R + 6},${cy + 10}`} fill="none" stroke={DARK} strokeWidth={6} strokeLinecap="round" />
        <path d={`M${-R - 6},${cy + 10}Q0,${cy - 4} ${R + 6},${cy + 10}`} fill="none" stroke={ink.main} strokeWidth={3.2} strokeLinecap="round" />
      </Cased>
    </g>
  );
};
/** Newton's reflecting telescope (1668): a short tube tilted on a ball mount; ~80 units tall, faces screen right (dir -1 left) */
export const Reflector: React.FC<{ at: P2; scale: number; tone?: number; ink?: Ink; uid?: string; dir?: 1 | -1 }> = ({ at, scale, tone = 1, ink = CREAM, uid = "rfl", dir = 1 }) => {
  const tube = { x0: -44, x1: 52, y: -70, r: 12, tilt: -14 };
  return (
    <g transform={`translate(${P(at)}) scale(${(scale * dir).toFixed(5)} ${scale.toFixed(5)})`} opacity={tone}>
      <Cased id={`${uid}-c`} r={1.4}>
        <ellipse cx={0} cy={-3} rx={30} ry={6} fill={ink.deep} {...OUT} />
        <path d={limbD([[[0, -6], 12], [[0, -14], 7], [[0, -20], 11], [[0, -26], 6]])} fill={ink.deep} {...OUT} />
        <path d={`M-22,-4Q-26,-30 -14,-46M22,-4Q26,-30 14,-46`} fill="none" stroke={DARK} strokeWidth={5.6} strokeLinecap="round" />
        <path d={`M-22,-4Q-26,-30 -14,-46M22,-4Q26,-30 14,-46`} fill="none" stroke={ink.deep} strokeWidth={2.8} strokeLinecap="round" />
        <circle cx={0} cy={-44} r={15} fill={ink.main} {...OUT} />
        <path d={hatchD(2, -59, 15, -29, 112, 2.4, 971)} {...ln(0.85, 0.5)} />
        <g transform={`translate(0 ${tube.y}) rotate(${tube.tilt})`}>
          <rect x={tube.x0} y={-tube.r} width={tube.x1 - tube.x0} height={tube.r * 2} rx={3} fill={ink.deep} {...OUT} />
          <path d={hatchD(tube.x0, 0, tube.x1, tube.r, 8, 2.4, 972, 0.1)} {...ln(0.85, 0.55)} />
          <path d={`M${tube.x0 + 30},${-tube.r}L${tube.x0 + 30},${tube.r}M${tube.x0 + 62},${-tube.r}L${tube.x0 + 62},${tube.r}`} {...ln(1.1, 0.7)} />
          <ellipse cx={tube.x0} cy={0} rx={4} ry={tube.r} fill={ink.main} {...OUT} strokeWidth={2} />
          {/* the eyepiece near the open end */}
          <path d={limbD([[[tube.x1 - 12, -tube.r], 7], [[tube.x1 - 12, -tube.r - 8], 6]])} fill={ink.main} {...OUT} strokeWidth={1.8} />
          <rect x={tube.x0 - 8} y={tube.r - 2} width={tube.x1 - tube.x0 + 4} height={5} fill={ink.main} {...OUT} strokeWidth={1.6} />
        </g>
      </Cased>
    </g>
  );
};
/** a long refractor on a wooden stand (cut 42's astronomer); the eyepiece end is low on the `dir` side */
const T_PIV: P2 = [-10, -336];
const T_U = rot([1, 0], -26);
export const TELESCOPE = { len: 300, angle: -26, eyeAt: add(T_PIV, mul(T_U, -126)) };
/** the world point of the eyepiece for a Telescope standing at `at` (dir 1: the tube points to screen right, the eye at its left) */
export const telescopeEyepiece = (at: P2, scale: number, dir: 1 | -1 = 1): P2 => [at[0] + dir * TELESCOPE.eyeAt[0] * scale, at[1] + TELESCOPE.eyeAt[1] * scale];
export const Telescope: React.FC<{ at: P2; scale: number; tone?: number; ink?: Ink; uid?: string; dir?: 1 | -1 }> = ({ at, scale, tone = 1, ink = CREAM, uid = "tsc", dir = 1 }) => {
  const piv: P2 = T_PIV;
  const u = T_U;
  const n: P2 = [-u[1], u[0]];
  const e = add(piv, mul(u, -112));
  const f = add(piv, mul(u, TELESCOPE.len - 112));
  return (
    <g transform={`translate(${P(at)}) scale(${(scale * dir).toFixed(5)} ${scale.toFixed(5)})`} opacity={tone}>
      <Cased id={`${uid}-c`} r={1.5}>
        {/* the stand: three legs to a head */}
        {[[-70, 0], [64, 0], [-8, 14]].map(([x, y], i) => (
          <path key={i} d={limbD([[[x, y], 9], [mix2([x, y], piv, 0.5), 8], [add(piv, [0, 18]), 7]])} fill={i === 2 ? ink.main : ink.deep} {...OUT} />
        ))}
        <path d={limbD([[add(piv, [0, 22]), 14], [add(piv, [0, 4]), 12]])} fill={ink.deep} {...OUT} />
        {/* the tube, wider at the object glass */}
        <path d={limbD([[e, 14], [mix2(e, f, 0.5), 18], [f, 22]])} fill={ink.main} {...OUT} />
        <clipPath id={`${uid}-t`}>
          <path d={limbD([[e, 14], [mix2(e, f, 0.5), 18], [f, 22]])} />
        </clipPath>
        <g clipPath={`url(#${uid}-t)`}>
          <path d={hatchD(Math.min(e[0], f[0]) - 20, Math.min(e[1], f[1]) - 20, Math.max(e[0], f[0]) + 20, Math.max(e[1], f[1]) + 20, TELESCOPE.angle + 4, 2.6, 981, 0.1)} {...ln(0.8, 0.35)} />
          <path d={[0.25, 0.5, 0.75].map((t) => { const p = mix2(e, f, t); return `M${P(add(p, mul(n, -14)))}L${P(add(p, mul(n, 14)))}`; }).join("")} {...ln(1.3, 0.75)} />
        </g>
        <path d={limbD([[add(f, mul(u, -2)), 26], [add(f, mul(u, 6)), 26]])} fill={ink.deep} {...OUT} />
        <path d={limbD([[e, 9], [add(e, mul(u, -14)), 8]])} fill={ink.deep} {...OUT} strokeWidth={2} />
        <circle cx={piv[0]} cy={piv[1]} r={5} fill={ink.deep} {...OUT} strokeWidth={1.8} />
      </Cased>
    </g>
  );
};

// ---------------------------------------------------------------------------
// POSES. R_* face screen right; mirrorPose turns any of them to face left.
// When he faces right his armL is the NEAR arm (his own right).
// ---------------------------------------------------------------------------
const mArm = (a: ArmPose): ArmPose => ({ w: [-a.w[0], a.w[1]], elbow: [-a.elbow[0], a.elbow[1]], fist: a.fist, hand: -a.hand });
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
const face = (q: FigPose, dir: 1 | -1) => (dir === 1 ? q : mirrorPose(q));
const F_STAND: FigPose = { ...STAND, armL: { w: [-55, -137], elbow: [-0.2, 1], fist: 0.3, hand: 0 }, armR: { w: [55, -137], elbow: [0.2, 1], fist: 0.3, hand: 0 } };
const R_STAND: FigPose = { ...STAND, yaw: 0.62, headYaw: 0.66, armL: { w: [-30, -138], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, armR: { w: [42, -140], elbow: [0.1, 1], fist: 0.3, hand: 0 }, footL: [-6, 0], footR: [8, -2] };
const R_WALK: FigPose = { ...STAND, yaw: 0.9, headYaw: 0.86, armL: { w: [-8, -139], elbow: [-0.6, 1], fist: 0.35, hand: 0 }, armR: { w: [16, -141], elbow: [-0.6, 1], fist: 0.35, hand: 0 } };
const R_GENT: FigPose = { ...STAND, yaw: 0.86, headYaw: 0.84, lean: -1.5, pitch: -3, armL: { w: [-24, -140], elbow: [-0.9, 0.5], fist: 0.3, hand: 12 }, armR: { w: [6, -141], elbow: [-0.9, 0.5], fist: 0.3, hand: 6 } };
const R_BOW: FigPose = { ...R_STAND, lean: 17, pitch: 14, crouch: 4, headYaw: 0.7, armL: { w: [24, -196], elbow: [-0.2, 1], fist: 0.1, hand: -30 }, armR: { w: [-10, -140], elbow: [-0.5, 1], fist: 0.3, hand: 0 }, footL: [-14, 0], footR: [10, 0], brow: -0.2, mouth: 0.3 };
const R_GREET: FigPose = { ...R_STAND, pitch: 6, armL: { w: [62, -206], elbow: [-0.3, 1], fist: 0, hand: -10 }, brow: -0.4, mouth: 0.4 };
const R_EYEPIECE: FigPose = { ...STAND, yaw: 0.95, headYaw: 1.08, lean: 10, crouch: 8, pitch: -8, footL: [-26, 0], footR: [20, 0], armL: { w: [84, -280], elbow: [0.2, 1], fist: 0.7, hand: -40 }, armR: { w: [124, -298], elbow: [-0.1, 1], fist: 0.7, hand: -30 }, lids: 0.55, brow: 0.5 };
/** where to stand a Fellow (variant) in POSES.eyepiece(dir) so his eye is at a Telescope's eyepiece (the Telescope at `telAt`) */
export const astronomerAt = (telAt: P2, scale: number, dir: 1 | -1 = 1, variant = 1): P2 => {
  const a = castAnchors("fellow", POSES.eyepiece(dir), [0, 0], 1, variant);
  const eye = add(a.headC, [dir * 15, -1]);
  const ep = telescopeEyepiece(telAt, scale, dir);
  return [ep[0] - eye[0] * scale - dir * 4 * scale, ep[1] - eye[1] * scale];
};
export const POSES = {
  /** standing, facing us */
  front: (): FigPose => F_STAND,
  /** three-quarter view, standing */
  stand: (dir: 1 | -1 = 1) => face(R_STAND, dir),
  /** the walk: phase = frames / WALK_CYCLE (advance at walkAdvance(scale) px per frame) */
  walk: (dir: 1 | -1 = 1, phase = 0, amount = 1) => face(walkPose(R_WALK, phase, amount), dir),
  /** t 0..1: the bow, the near hand to the chest */
  bow: (dir: 1 | -1 = 1, t = 1) => face(lerpFig(R_STAND, R_BOW, t), dir),
  /** t 0..1: the near hand opens forward, a small nod */
  greet: (dir: 1 | -1 = 1, t = 1) => face(lerpFig(R_STAND, R_GREET, t), dir),
  /** the older Fellow's stoop laid over any pose */
  stoop: (q: FigPose, dir: 1 | -1 = 1): FigPose => ({ ...q, lean: q.lean + dir * 9, pitch: q.pitch + 7, crouch: q.crouch + 6 }),
  /** bent to a telescope's eyepiece (stand him so castAnchors' headC sits just behind telescopeEyepiece) */
  eyepiece: (dir: 1 | -1 = 1) => face(R_EYEPIECE, dir),
  /** one shovel cycle per phase: scoop (low, forward), lift, throw (forward and up), back */
  shovel: (dir: 1 | -1 = 1, phase = 0) => face(shovelPose(phase), dir),
  /** t 0..1: both fists on a lever handle, pulled from high (0) to low (1) */
  lever: (dir: 1 | -1 = 1, t = 0) => face(leverPose(t), dir),
  /** leaning back, hauling on a rope (phase: hand over hand) */
  haul: (dir: 1 | -1 = 1, phase = 0) => face(haulPose(phase), dir),
  /** (addition) the gentleman's stroll: upright, straighter legs, a shorter stride (GENT_STRIDE), the arms swinging at
   *  his sides; phase = distance / (2 * GENT_STRIDE * scale) */
  strollGent: (dir: 1 | -1 = 1, phase = 0, amount = 1) => {
    const w = walkPose(R_GENT, phase, amount, GENT_STRIDE);
    return face({ ...w, crouch: w.crouch - 2.6 * amount }, dir);
  },
};
/** (addition) the stroll's stride, units: he advances 2 * GENT_STRIDE * scale per cycle of WALK_CYCLE frames */
export const GENT_STRIDE = 36;
/** the same pose with the head turned to an absolute yaw (and nodded, deg chin down) */
export const headTurn = (q: FigPose, yaw: number, nod = 0): FigPose => ({ ...q, headYaw: yaw, pitch: q.pitch + nod });

const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
const SHOVEL_KEYS: [number, FigPose][] = [
  // scoop: knees bent, the blade low and forward; the near (rear) fist at the hip, the far fist low on the shaft
  [0, { ...STAND, yaw: 0.92, headYaw: 0.96, lean: 20, crouch: 30, pitch: 10, footL: [-30, 0], footR: [30, 0], armL: { w: [8, -150], elbow: [-0.4, 1], fist: 1, hand: 30 }, armR: { w: [62, -112], elbow: [-0.5, 1], fist: 1, hand: 20 }, brow: 0.6 }],
  // lift: straightening, the load at the hip
  [0.35, { ...STAND, yaw: 0.92, headYaw: 0.92, lean: 8, crouch: 14, pitch: 2, footL: [-30, 0], footR: [30, 0], armL: { w: [-6, -168], elbow: [-0.6, 1], fist: 1, hand: 20 }, armR: { w: [40, -150], elbow: [-0.5, 1], fist: 1, hand: 10 }, brow: 0.7, mouth: -0.3 }],
  // throw: the blade swung forward and up
  [0.55, { ...STAND, yaw: 0.92, headYaw: 0.94, lean: 14, crouch: 12, pitch: -4, footL: [-30, 0], footR: [34, 0], liftL: 8, armL: { w: [26, -186], elbow: [-0.6, 1], fist: 1, hand: 10 }, armR: { w: [84, -196], elbow: [-0.4, 1], fist: 1, hand: -10 }, brow: 0.8, mouth: -0.4 }],
  // back to the scoop
  [1, { ...STAND, yaw: 0.92, headYaw: 0.96, lean: 20, crouch: 30, pitch: 10, footL: [-30, 0], footR: [30, 0], armL: { w: [8, -150], elbow: [-0.4, 1], fist: 1, hand: 30 }, armR: { w: [62, -112], elbow: [-0.5, 1], fist: 1, hand: 20 }, brow: 0.6 }],
];
const shovelTrack = poseTrack(SHOVEL_KEYS);
const shovelPose = (phase: number) => shovelTrack(frac(phase));
const LEVER_HI: FigPose = { ...STAND, yaw: 0.85, headYaw: 0.8, lean: 4, crouch: 4, pitch: -10, footL: [-26, 0], footR: [26, 0], armL: { w: [40, -296], elbow: [-0.5, 1], fist: 1, hand: 0 }, armR: { w: [52, -300], elbow: [-0.4, 1], fist: 1, hand: 0 }, brow: 0.6 };
const LEVER_LO: FigPose = { ...STAND, yaw: 0.85, headYaw: 0.88, lean: 16, crouch: 26, pitch: 6, footL: [-30, 0], footR: [28, 0], armL: { w: [44, -188], elbow: [-0.6, 1], fist: 1, hand: 0 }, armR: { w: [56, -192], elbow: [-0.5, 1], fist: 1, hand: 0 }, brow: 0.9, mouth: -0.45 };
const leverPose = (t: number) => lerpFig(LEVER_HI, LEVER_LO, ease(c01(t)));
const HAUL_A: FigPose = { ...STAND, yaw: 0.9, headYaw: 0.86, lean: -14, crouch: 18, pitch: -4, footL: [-38, 0], footR: [26, 0], armL: { w: [54, -206], elbow: [-0.5, 1], fist: 1, hand: -40 }, armR: { w: [86, -216], elbow: [-0.3, 1], fist: 1, hand: -40 }, brow: 0.8, mouth: -0.4 };
const HAUL_B: FigPose = { ...HAUL_A, lean: -18, crouch: 20, armL: { w: [80, -214], elbow: [-0.3, 1], fist: 1, hand: -40 }, armR: { w: [40, -200], elbow: [-0.5, 1], fist: 1, hand: -40 } };
const haulPose = (phase: number) => lerpFig(HAUL_A, HAUL_B, 0.5 - 0.5 * Math.cos(2 * Math.PI * phase));

// ---------------------------------------------------------------------------
// PROBE SHEETS (Root.LondonCast, 2160 x 1920): every character in every pose, the work poses and
// props, the heads at five yaws
// ---------------------------------------------------------------------------
const SheetSvg: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: "#3F3428" }}>
    <svg width={2160} height={1920} viewBox="0 0 2160 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      {children}
    </svg>
  </AbsoluteFill>
);
type Row = { label: string; el: (q: FigPose, at: P2, s: number, uid: string) => React.ReactNode };
const ROWS: Row[] = [
  { label: "pepys", el: (q, at, s, u) => <Pepys pose={q} at={at} scale={s} uid={u} /> },
  { label: "newton", el: (q, at, s, u) => <Newton pose={q} at={at} scale={s} uid={u} coat={ORANGE} /> },
  ...Array.from({ length: FELLOW_VARIANTS }, (_, v): Row => ({ label: `fellow${v}`, el: (q, at, s, u) => <Fellow variant={v} pose={v === 3 ? POSES.stoop(q, Math.sin(q.yaw) >= 0 ? 1 : -1) : q} at={at} scale={s} uid={u} coat={v % 2 ? CREAM : ORANGE} /> })),
  { label: "worker", el: (q, at, s, u) => <Worker pose={q} at={at} scale={s} uid={u} /> },
  { label: "worker bare", el: (q, at, s, u) => <Worker pose={q} at={at} scale={s} uid={u} cap={false} coat={ORANGE} /> },
];
const COLS: { label: string; q: FigPose }[] = [
  { label: "front", q: POSES.front() },
  { label: "stand", q: POSES.stand(1) },
  { label: "stand L", q: POSES.stand(-1) },
  { label: "walk 0", q: POSES.walk(1, 0) },
  { label: "walk .5", q: POSES.walk(-1, 0.5) },
  { label: "head turn", q: headTurn(POSES.stand(1), -0.5, 6) },
  { label: "bow", q: POSES.bow(1, 1) },
  { label: "greet", q: POSES.greet(-1, 1) },
];
/** rows: Pepys, Newton (orange), Fellow 0..4 (orange / cream alternating), Worker (cap), Worker (bare, orange); columns: COLS */
export const LondonCastSheet: React.FC = () => (
  <SheetSvg>
    {ROWS.map((row, i) =>
      COLS.map((col, j) => <g key={`${i}-${j}`}>{row.el(col.q, [140 + j * 268, 200 + i * 191], 0.6, `p${i}x${j}`)}</g>),
    )}
  </SheetSvg>
);
/** the shovel cycle, the lever, the haul, the astronomer at his telescope, the table, globe, reflector, a free shovel */
export const LondonCastWorkSheet: React.FC = () => {
  const s = 1.15;
  const y1 = 620;
  const y2 = 1250;
  const y3 = 1860;
  return (
    <SheetSvg>
      {[0, 0.2, 0.35, 0.55, 0.75].map((ph, i) => (
        <Worker key={`s${i}`} pose={POSES.shovel(1, ph)} at={[170 + i * 400, y1]} scale={s} uid={`ws${i}`} tool="shovel" />
      ))}
      {[0, 0.5, 1].map((t, i) => (
        <Worker key={`l${i}`} pose={POSES.lever(i === 1 ? -1 : 1, t)} at={[170 + i * 330, y2]} scale={s} uid={`wl${i}`} cap={i !== 2} />
      ))}
      {[0, 0.5].map((ph, i) => (
        <Worker key={`h${i}`} pose={POSES.haul(1, ph)} at={[1200 + i * 330, y2]} scale={s} uid={`wh${i}`} coat={i ? ORANGE : CREAM} />
      ))}
      <Telescope at={[420, y3]} scale={s} uid="tsc" />
      <Astronomer at={astronomerAt([420, y3], s)} scale={s} uid="ast" coat={ORANGE} />
      <Table at={[1300, y3]} scale={s} uid="tbl" />
      <Globe at={[tableTop([1300, y3], s)[0] - 140 * s, tableTop([1300, y3], s)[1] - 12 * s]} scale={s} uid="glb" turn={20} />
      <Reflector at={[tableTop([1300, y3], s)[0] + 120 * s, tableTop([1300, y3], s)[1] - 12 * s]} scale={s} uid="rfl" />
      <Shovel at={[1960, y3 - 330]} scale={s} angle={8} uid="fshv" />
    </SheetSvg>
  );
};
/** head and shoulders of Pepys, Newton and four Fellows at head yaws 0, .45, .9, 1.4, -.7 */
export const LondonCastHeads: React.FC = () => {
  const yaws = [0, 0.45, 0.9, 1.4, -0.7];
  const who: Row[] = [ROWS[0], ROWS[1], ROWS[2], ROWS[3], ROWS[5], ROWS[6]];
  const s = 2.3;
  const cw = 420;
  const ch = 316;
  return (
    <SheetSvg>
      {who.map((row, i) =>
        yaws.map((y, j) => {
          const q: FigPose = { ...POSES.stand(y >= 0 ? 1 : -1), yaw: y * 0.75, headYaw: y };
          const x0 = 15 + j * (cw + 10);
          const y0 = 10 + i * ch;
          return (
            <g key={`${i}-${j}`}>
              <clipPath id={`hcell${i}x${j}`}>
                <rect x={x0} y={y0} width={cw} height={ch - 8} />
              </clipPath>
              <g clipPath={`url(#hcell${i}x${j})`}>{row.el(q, [x0 + cw / 2, y0 + 20 + 330 * s], s, `h${i}x${j}`)}</g>
            </g>
          );
        }),
      )}
    </SheetSvg>
  );
};
