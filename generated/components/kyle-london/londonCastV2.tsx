// ---------------------------------------------------------------------------
// londonCastV2: the REDESIGNED engraved cast of the Kyle Harper London clip ("How geniuses
// came out of disgusting 18th-century London", Dwarkesh Patel, Oct 2026). Same API as
// londonCast.tsx (every export, prop, pose and anchor), so a cut switches by its import.
// Dwarkesh map style "People and crowds": the cream form on a dark casing, a firm dark
// outline, hatching, light from the upper left; an orange figure wears a solid orange coat.
//
// V2 (after the user's note on cut 22: the hair looked weird, the characters could be designed
// much better): the head is drawn here, not cut from the rig's face: a larger head (headScale x1.06,
// the rig raises headC to match), a three-quarter face with brow, lidded eye, nose, mouth, jaw and a
// light shadow side, per build (Pepys full with a second chin and a smile line, Newton and the old man
// lean). The hair is volumes round the skull projected with the head's yaw (continuous turns): the
// periwig a crown with a centre parting and two raised peaks sitting back off the forehead, falling in
// long scalloped locks (the near ones in front of the shoulders, the far ones behind) with grouped
// ringlets, a lit band on the upper left, darker toward the neck, in natural 1680s colours; Newton his
// own grey-brown hair in waves to the shoulders; the worker a knitted cap or cropped hair. The arms are
// drawn here too on the rig's joints: one sleeve to a flared cuff on the wrist, a ruffle, and a hand
// with a thumb and a finger mass (HandV2). The rig is neither edited nor forked: figureRig and
// figureAnchors only.
//
// Built ON the articulated rig of kits/maps/texcocoFigures (figureRig: IK, yaw, lean, crouch); the
// costume, face, hair, arms and hands are drawn here.
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
import { CREAM, ORANGE, STAND, figureAnchors, figureRig, lerpFig, type ArmPose, type FigPose, type Ink, type Spec } from "../kits/maps/texcocoFigures";
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

// ---------------------------------------------------------------------------
// THE BUILDS AND LOOKS
// ---------------------------------------------------------------------------
export type LondonKind = "fellow" | "newton" | "pepys" | "worker";
/** V2: the head is drawn larger (headScale 1.08 -> ~1.22); the rig raises headC to match (castAnchors stays true) */
const HEAD_V2 = 1.06;
const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08 * HEAD_V2, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };
type HairKind = "periwig" | "own" | "short";
/** a hair colour: the lit band, the body of the mass, the shadow toward the neck (full-strength hex; dimmed with the ink) */
type HairTone = { light: string; base: string; deep: string };
const HAIR_TONES = {
  darkBrown: { light: "#977B5C", base: "#6F5640", deep: "#4A3828" },
  blackBrown: { light: "#7E6650", base: "#58463A", deep: "#3A2E24" },
  chestnut: { light: "#B78E62", base: "#8C6745", deep: "#5F4430" },
  midBrown: { light: "#B59C77", base: "#8E7555", deep: "#64513A" },
  fair: { light: "#E2D0A6", base: "#C6AF82", deep: "#98835C" },
  grey: { light: "#DAD4C3", base: "#B3AC9B", deep: "#857F70" },
  greyBrown: { light: "#D2C9B0", base: "#A99E86", deep: "#7A715E" },
} satisfies Record<string, HairTone>;
type FaceBuild = "plain" | "full" | "lean";
/** small per-man differences so a circle is not five copies: nose length, a hooked bridge, the brow's arch and weight */
type FaceCut = { nose: number; hook: number; arch: number; browW: number };
type Look = {
  spec: Spec;
  hair: HairKind;
  tone: HairTone;
  /** wig volume (1 = the standard full-bottomed periwig) and lock length (1 = to mid-chest) */
  vol: number;
  len: number;
  coatBraid: boolean;
  neck: "cravat" | "band" | "shirt";
  hat: boolean;
  /** horizontal widening of the face (Pepys's fuller face) */
  faceW: number;
  build: FaceBuild;
  cut: FaceCut;
  worker: boolean;
};
const FELLOWS: Look[] = [
  { spec: MAN, hair: "periwig", tone: HAIR_TONES.midBrown, vol: 1, len: 1, coatBraid: false, neck: "cravat", hat: false, faceW: 1, build: "plain", cut: { nose: 1, hook: 0, arch: 1, browW: 1 }, worker: false },
  { spec: { ...MAN, a: 52, hw: 44, headScale: 1.07 * HEAD_V2 }, hair: "periwig", tone: HAIR_TONES.fair, vol: 0.97, len: 0.95, coatBraid: true, neck: "cravat", hat: false, faceW: 0.98, build: "lean", cut: { nose: 1.12, hook: 0, arch: 1.5, browW: 0.85 }, worker: false },
  { spec: { ...MAN, a: 55, hw: 46, H: 95, hipY: -154, headScale: 1.09 * HEAD_V2, arm: [59, 56], leg: [71, 69] }, hair: "periwig", tone: HAIR_TONES.blackBrown, vol: 1.03, len: 1.05, coatBraid: false, neck: "cravat", hat: true, faceW: 1.06, build: "plain", cut: { nose: 0.9, hook: 0, arch: 0.5, browW: 1.15 }, worker: false },
  { spec: { ...MAN, a: 53, hw: 44, H: 92, hipY: -149, headScale: 1.07 * HEAD_V2, aged: true }, hair: "periwig", tone: HAIR_TONES.grey, vol: 0.95, len: 0.92, coatBraid: false, neck: "cravat", hat: false, faceW: 1, build: "lean", cut: { nose: 1.06, hook: 1, arch: 1.1, browW: 0.9 }, worker: false },
  { spec: { ...MAN, a: 58, hw: 47, limb: 1.04, headScale: 1.09 * HEAD_V2 }, hair: "periwig", tone: HAIR_TONES.chestnut, vol: 1.04, len: 1, coatBraid: true, neck: "cravat", hat: false, faceW: 1.04, build: "full", cut: { nose: 0.96, hook: 0.4, arch: 0.9, browW: 1 }, worker: false },
];
const LOOKS: Record<Exclude<LondonKind, "fellow">, Look> = {
  newton: { spec: { ...MAN, a: 50, hw: 42, H: 95, hipY: -155, limb: 0.95, headScale: 1.07 * HEAD_V2, arm: [59, 56], leg: [71, 69] }, hair: "own", tone: HAIR_TONES.greyBrown, vol: 1, len: 1, coatBraid: false, neck: "band", hat: false, faceW: 0.95, build: "lean", cut: { nose: 1.1, hook: 0.5, arch: 0.9, browW: 1 }, worker: false },
  pepys: { spec: { ...MAN, a: 57, hw: 46, H: 93, hipY: -151, limb: 1.04, headScale: 1.1 * HEAD_V2 }, hair: "periwig", tone: HAIR_TONES.darkBrown, vol: 1.05, len: 1.04, coatBraid: true, neck: "cravat", hat: false, faceW: 1.07, build: "full", cut: { nose: 1.02, hook: 0.3, arch: 1.1, browW: 1 }, worker: false },
  worker: { spec: { ...MAN, a: 55, hw: 46, limb: 1.06, headScale: 1.07 * HEAD_V2 }, hair: "short", tone: HAIR_TONES.midBrown, vol: 1, len: 1, coatBraid: false, neck: "shirt", hat: false, faceW: 1.02, build: "plain", cut: { nose: 0.95, hook: 0, arch: 0.8, browW: 1.1 }, worker: true },
};
const lookOf = (kind: LondonKind, variant = 0): Look => (kind === "fellow" ? FELLOWS[((variant % FELLOWS.length) + FELLOWS.length) % FELLOWS.length] : LOOKS[kind]);
export const FELLOW_VARIANTS = FELLOWS.length;
/** the rig build of a cast member (use with figureRig / figureAnchors) */
export const specOf = (kind: LondonKind, variant = 0) => lookOf(kind, variant).spec;
/** world anchors of a cast member: headC, headTop, shoulders, wrists, handL / handR (the grips), chest, hip, feet */
export const castAnchors = (kind: LondonKind, pose: FigPose, at: P2, scale: number, variant = 0) => figureAnchors(specOf(kind, variant), pose, at, scale);

// ---------------------------------------------------------------------------
// THE HEAD (V2), head-local units: (0, 0) = the middle of the face, + y down, before the spec's headScale.
// One head model at any yaw: the head outline is a front and a profile outline blended by the yaw; every
// feature and every hair mass is a 3D point projected with the yaw (x' = X cos + Z sin), so a turn is continuous
// and the hair masses swing round the skull with it. Light from the upper left: the shadow side is screen right.
// ---------------------------------------------------------------------------
const HEAD_F: P2[] = [[0, -33], [11, -31], [18, -24.5], [20.5, -15], [21, -5], [20.6, 3], [19.4, 11], [16.4, 18.5], [11.5, 24.5], [5.5, 27.6], [0, 28.2], [-5.5, 27.6], [-11.5, 24.5], [-16.4, 18.5], [-19.4, 11], [-20.6, 3], [-21, -5], [-20.5, -15], [-18, -24.5], [-11, -31]];
const HEAD_P: P2[] = [[-2, -34], [9, -32.5], [16, -27], [19, -18], [20.2, -9], [18.6, -1.5], [19, 8], [19.6, 14.2], [18.6, 19.6], [18.4, 24.4], [14.5, 28.6], [6.5, 28.4], [-1, 24.5], [-6.5, 18.5], [-9.5, 11], [-13.5, 4], [-20.5, -4], [-23.5, -15], [-21, -26], [-12, -32.5]];
/** the face outline of a build: Pepys's fuller jaw and soft second chin, the lean man's long jaw */
const headPts = (build: FaceBuild, yaw: number): P2[] => {
  // the jaw and chin (front points 5..15) drawn toward a rounded curve: a soft jaw, never a box; the full face
  // wider and rounder through the cheeks, the lean face narrower toward a longer chin
  const [rx, ry, taper, k] = build === "full" ? [22.4, 27.6, 0, 0.75] : build === "lean" ? [20, 28.6, 0.16, 0.55] : [20.8, 27, 0.06, 0.6];
  const f = HEAD_F.map((p, i): P2 => {
    if (i < 5 || i > 15) return build === "full" ? [p[0] * (i === 4 || i === 16 ? 1.04 : 1), p[1]] : build === "lean" ? [p[0] * 0.97, p[1]] : p;
    const th = ((i - 5) / 10) * Math.PI;
    const e: P2 = [rx * Math.cos(th) * (1 - taper * Math.sin(th)), 2 + ry * Math.sin(th)];
    return mix2(p, e, k);
  });
  const pr = HEAD_P.map((p, i): P2 => {
    // the full face: a rounder chin and a soft second chin under the jaw
    if (build === "full") return [p[0] + ([9, 10].includes(i) ? 0.6 : i === 11 ? -1 : i === 12 ? -1.5 : 0), p[1] + ([9, 10].includes(i) ? 1.2 : i === 11 ? 2.6 : i === 12 ? 2.8 : 0)];
    if (build === "lean") return [p[0] + ([11, 12].includes(i) ? 1 : 0), p[1] + ([8, 9, 10, 11].includes(i) ? 2.4 : 0)];
    return [p[0] + (i === 10 ? -0.8 : 0), p[1] + (i === 10 ? 0.6 : 0)];
  });
  return blendYaw(f, pr, yaw);
};

/** the ink's level between the page (0) and full cream (1): hair colours dim with the figure */
const lum = (h: string) => {
  const [r, g, b] = hexRgb(h);
  return 0.3 * r + 0.59 * g + 0.11 * b;
};
const LAND_HEX = "#3F3428";
const inkLevel = (ink: Ink) => c01((lum(ink.main) - lum(LAND_HEX)) / (lum(CREAM.main) - lum(LAND_HEX)));
const dimTone = (t: HairTone, lv: number): HairTone => ({ light: mixHex(LAND_HEX, t.light, lv), base: mixHex(LAND_HEX, t.base, lv), deep: mixHex(LAND_HEX, t.deep, lv) });

/** (addition, DEPTH) the form shadow of one part, light from the upper left: the part minus a copy of itself shifted
 *  toward the light leaves the crescent on its right / lower side; it gets a flat darker tone and hatching. Works at
 *  every yaw because it follows the drawn outline. */
const RimShade: React.FC<{ id: string; d: string; off: [number, number]; box: [number, number, number, number]; col: string; amt: number; seed: number }> = ({ id, d, off, box, col, amt, seed }) =>
  amt <= 0 ? null : (
    <>
      <mask id={id} maskUnits="userSpaceOnUse" x={box[0] - 60} y={box[1] - 60} width={box[2] - box[0] + 120} height={box[3] - box[1] + 120}>
        <path d={d} fill="white" />
        <path d={d} fill="black" transform={`translate(${(-off[0]).toFixed(2)} ${(-off[1]).toFixed(2)})`} />
      </mask>
      <g mask={`url(#${id})`}>
        <path d={d} fill={col} opacity={Math.min(1, 0.92 * amt)} />
        <path d={hatchD(box[0], box[1], box[2], box[3], 112, 2.7, seed, 0.12)} {...ln(0.85, 0.42 * amt)} />
      </g>
    </>
  );
const bboxOf = (pts: P2[], pad: number): [number, number, number, number] => [Math.min(...pts.map((p) => p[0])) - pad, Math.min(...pts.map((p) => p[1])) - pad, Math.max(...pts.map((p) => p[0])) + pad, Math.max(...pts.map((p) => p[1])) + pad];

type FaceState = { brow: number; lids: number; mouth: number };
/** the face: outline, shading, brows, eyes, nose, mouth, the build's lines; the near ear when no hair covers it */
const FaceArt: React.FC<{ yaw: number; nod: number; face: FaceState; build: FaceBuild; cut: FaceCut; aged: boolean; ears: boolean; ink: Ink; uid: string; shade?: number }> = ({ yaw, nod, face, build, cut, aged, ears, ink, uid, shade = 0 }) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  const sg = s < 0 ? -1 : 1;
  const fy = 5 * nod;
  const pr = (fx: number, y: number, D: number, k = 1): P2 => [fx * c + D * s, y + fy * k];
  /** how much of a far-side feature is still seen */
  const vis = (side: number) => (side * sg > 0 && t > 0.02 ? c01((c - 0.18) / 0.3) : 1);
  const pts = headPts(build, yaw);
  const HEAD = smoothClosed(pts);
  const xR = Math.max(...pts.map((p) => p[0]));
  const open = 1 - face.lids;
  const b = face.brow;
  const m = face.mouth;
  const full = build === "full";
  const lean = build === "lean";
  const eye = (sd: number) => {
    const v = vis(sd);
    if (v < 0.04) return null;
    const o = pr(sd * 14.2, -0.6, 8.2);
    const mid = pr(sd * 8.4, -1 - 4.4 * open + 2.4 * face.lids, 13.2);
    const inn = pr(sd * 3.3, 0, 14.6);
    const w = Math.abs(inn[0] - o[0]) / 10.9;
    const pu = pr(sd * 8.2, -0.3 + 0.9 * face.lids, 12.8 + 1.4 * t);
    // a calm arch at rest (the inner end level with the outer, never lower); `brow` > 0 knits it
    const bo = pr(sd * 14.8, -8.2 - 0.5 * cut.arch + 2.4 * nod - 1.4 * b, 8.4);
    const bm = pr(sd * 9, -11.4 - 1.3 * cut.arch + nod - 0.5 * Math.abs(b), 13.6);
    const bi = pr(sd * 3, -8.6 - 3 * nod + 2.8 * b, 16.6);
    const lo0 = pr(sd * 12.6, 1.6, 9.4);
    const lo1 = pr(sd * 8, 3.6, 13);
    const lo2 = pr(sd * 4.6, 1.8, 14.2);
    // the upper lid's crease (a little hooded; heavier on the older man)
    const cr0 = pr(sd * 12.8, -3.6, 9.4);
    const cr1 = pr(sd * 8.2, -6.4, 13.4);
    const cr2 = pr(sd * 4.4, -4.2, 14.6);
    return (
      <g key={sd} opacity={v}>
        {/* the far brow, foreshortened, keeps only its inner half (a whole arch folds into a caret) */}
        <path
          d={sd * sg > 0 && t > 0.02 ? `M${P(mix2(bo, bm, 0.55))}Q${P(mix2(bm, bi, 0.35))} ${P(bi)}` : `M${P(bo)}Q${P(bm)} ${P(bi)}`}
          {...ln(2.25 * cut.browW, 0.9 * (sd * sg > 0 && t > 0.02 ? c01((c - 0.68) / 0.15) : 1))}
        />
        <path d={`M${P(cr0)}Q${P(cr1)} ${P(cr2)}`} {...ln(0.85, 0.32)} />
        <path d={`M${P(o)}Q${P(mid)} ${P(inn)}`} {...ln(2, 0.95)} />
        {open > 0.3 ? (
          <>
            <path d={`M${P(lo0)}Q${P(lo1)} ${P(lo2)}`} {...ln(0.95, 0.5 * open)} />
            <ellipse cx={pu[0]} cy={pu[1]} rx={2.5 * Math.max(0.45, Math.min(1, w))} ry={2.5 * (0.55 + 0.45 * open)} fill={DARK} opacity={0.94} />
          </>
        ) : (
          <path d={`M${P(pr(sd * 11, 1.6, 10))}l${-sd * 1.4},1.9M${P(pr(sd * 7.4, 2.3, 13))}l0,2.2`} {...ln(0.9, 0.6)} />
        )}
      </g>
    );
  };
  // the nose: the ridge leaves the face's line as he turns; a nostril wing and its shadow
  const RF = 19;
  const o = -2.4 * clamp1(1 - yaw * 8);
  const nl = cut.nose * (lean ? 1.06 : 1);
  const nRoot: P2 = [RF * s * 0.94 + o * c, -4.2 + fy];
  const nTip: P2 = [(RF + 8.8 * nl) * s + o * 1.55 * c, 9 * nl + fy];
  const nUnder: P2 = [(RF + 4.8) * s - o * 0.1 * c, 11.8 * nl + fy];
  const nWing: P2 = [(RF - 3.2) * s - o * 2.3 * c, 9 * nl + 1.6 * t + fy];
  const nWingIn: P2 = [(RF - 1.8) * s - o * 1.4 * c, 6.2 * nl + t + fy];
  const nBack: P2 = [(RF - 3.2) * s + o * 0.2 * c, -2 + fy];
  const nC1: P2 = [nTip[0] + 0.2 + 0.4 * s, 11.6 * nl + 0.3 * t + fy];
  const nC2: P2 = [mix(nUnder[0], nWing[0], 0.75 - 0.25 * t), 11.8 * nl + 0.4 * t + fy];
  const nC3: P2 = [nWing[0] - 0.2 * (1 - t) - 1.4 * s, 6.8 * nl + 1.3 * t + fy];
  // the bridge: straight, or a little hooked (it shows as he turns)
  const nHook: P2 = add(mix2(nRoot, nTip, 0.45), [cut.hook * 2.2 * s, -cut.hook * 0.6 * t]);
  // the mouth: two halves from the middle, the far one closing; the corners lift with `mouth`
  const my = 17.4 + (lean ? 1 : 0);
  const mc = pr(0, my - 0.5 * nod, 20.2, 0.7);
  const mm = m + 0.12;
  const half = (sd: number) => {
    const far = sd * sg > 0 && t > 0.02;
    const v = far ? c01((c - 0.42) / 0.4) : 1;
    if (v < 0.04) return null;
    const q1 = pr(sd * 3.8, my - 1.1, 18.8, 0.7);
    const q2 = pr(sd * (far ? 7.4 : 8.4), my - 0.4 - 2.4 * mm, 15.2, 0.7);
    const l1 = pr(sd * 4.4, my + 3.6, 16.2, 0.6);
    const l0 = pr(0, my + 5.2, 19.2, 0.6);
    // the smile line from the nose wing round the mouth corner: with the smile; a trace on the fuller face; on the
    // older man these are his two age lines
    const sm = c01(m * 2.2) * 0.75 + (full ? 0.14 : 0) + (aged ? 0.55 : 0);
    const s0 = pr(sd * 6.8, 8.6, 15.8);
    const s1 = pr(sd * 11.6, my - 1.6, 12);
    const s2 = pr(sd * 11, my + 4.4, 11.6);
    return (
      <g key={sd} opacity={v}>
        <path d={`M${P(mc)}Q${P(q1)} ${P(q2)}`} {...ln(2, 0.92)} />
        <path d={`M${P(l0)}Q${P(mix2(l0, l1, 0.6))} ${P(l1)}`} {...ln(1.2, 0.6)} />
        {sm > 0.05 ? <path d={`M${P(s0)}Q${P(s1)} ${P(s2)}`} {...ln(1.15, Math.min(0.75, sm * 0.7))} /> : null}
      </g>
    );
  };
  const ear = () => {
    // the near ear comes round onto the side of the head as he turns (the far one goes behind)
    const sd = -sg;
    if (!ears || t < 0.12) return null;
    const e = pr(sd * 21, 2.5, -4, 0);
    const w = mix(0.4, 1, t);
    return (
      <g opacity={c01((t - 0.12) * 5)}>
        <ellipse cx={e[0]} cy={e[1]} rx={4.6 * w} ry={7.4} fill={ink.main} {...OUT} strokeWidth={2} />
        <path d={`M${(e[0] - sd * 1.8 * w).toFixed(1)},${(e[1] - 3.6).toFixed(1)}q${(sd * 3.6 * w).toFixed(1)},2.8 ${(sd * 0.8 * w).toFixed(1)},6.8`} {...ln(1.1, 0.65)} />
      </g>
    );
  };
  return (
    <g>
      <clipPath id={`${uid}-face`}>
        <path d={HEAD} />
      </clipPath>
      <path d={HEAD} fill={ink.main} {...OUT} strokeWidth={2.5} />
      <RimShade id={`${uid}-rsf`} d={HEAD} off={[11, 4]} box={[-30, -40, 30, 36]} col={ink.deep} amt={shade * 0.9} seed={951} />
      <g clipPath={`url(#${uid}-face)`}>
        {/* the shadow side (screen right, away from the upper-left light): a crescent of hatching, under the jaw */}
        <path d={hatchD(xR - 6.5 + 2 * t, -24, xR + 2, 30, 112, 2.4, 24, 0.18)} {...ln(0.9, 0.5 * (1 - 0.5 * t))} />
        <path d={hatchD(xR - 9, 8, xR + 2, 30, 58, 3, 25, 0.25)} {...ln(0.8, 0.32 * (1 - 0.5 * t))} />
        <path d={hatchD(-16 + 10 * s, 25 + (lean ? 2 : 0), 18 + 10 * s, 32, 4, 2.4, 26, 0.3)} {...ln(0.8, 0.28)} />
        {/* the eye sockets under the brows, the cheekbone's plane */}
        {[-1, 1].map((sd) => {
          const a = pr(sd * 14.6, -4.6, 9);
          const bb = pr(sd * 4.6, -3.4, 15);
          return <path key={`so${sd}`} d={`M${P(a)}Q${P(pr(sd * 9.6, -6.2, 13.4))} ${P(bb)}`} {...ln(5, 0.07 * vis(sd))} />;
        })}
        {t > 0.3 ? <path d={hatchD(sg * -30, -4, sg * -30 + sg * 15, 24, sg > 0 ? 62 : 118, 2.6, 39, 0.3)} {...ln(0.85, 0.3 * c01((t - 0.3) * 3))} /> : null}
      </g>
      <g clipPath={`url(#${uid}-face)`}>{[-1, 1].map(eye)}</g>
      {t > 0.12 ? <path d={`M${P(nRoot)}Q${P(nHook)} ${P(nTip)}L${P(nUnder)}L${P(nWing)}L${P(nBack)}Z`} fill={ink.main} /> : null}
      <path d={`M${P(nRoot)}Q${P(nHook)} ${P(nTip)}Q${P(nC1)} ${P(nUnder)}Q${P(nC2)} ${P(nWing)}Q${P(nC3)} ${P(nWingIn)}`} {...ln(1.9, 0.92)} />
      <path d={[0.25, 0.5, 0.72].map((u) => `M${P(add(mix2(nRoot, nTip, u), [-o * 1.5 * c - 3 * s, 0.6]))}l${(-o * 1.1 * c - 1.6 * s).toFixed(1)},1.4`).join("")} {...ln(0.85, 0.45)} />
      <g clipPath={`url(#${uid}-face)`}>
      {[-1, 1].map(half)}
      {/* the chin: a short arc under the lower lip; the fuller face's second chin; the lean face's hollow cheek */}
      <path d={`M${P(pr(-3.4, my + 9.4, 17.6, 0.4))}Q${P(pr(0, my + 8, 19, 0.4))} ${P(pr(3.4, my + 9.4, 17.6, 0.4))}`} {...ln(1, 0.5)} />
      {full ? <path d={`M${P(pr(-8, 27.2, 13, 0.3))}Q${P(pr(0, 30.4, 16.6, 0.3))} ${P(pr(8, 27.2, 13, 0.3))}`} {...ln(1.1, 0.5)} /> : null}
      {lean && !aged
        ? [-1, 1].map((sd) => <path key={`hc${sd}`} d={`M${P(pr(sd * 15, 5, 9))}Q${P(pr(sd * 16, 12, 8))} ${P(pr(sd * 14, 17, 9.6))}`} {...ln(0.9, 0.3 * vis(sd))} />)
        : null}
      </g>
      {ear()}
    </g>
  );
};

/** the mask that keeps hair in front of the head off the face: the face's front (in front of the ears, below the
 *  hairline) as a loop on the head, projected with the yaw and cut to the head's outline */
const faceMaskGeo = (build: FaceBuild, yaw: number, faceW: number, curl = 1.2) => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const loop: [number, number][] = [[0, -23], [30, -22], [55, -19], [74, -12], [84, -3], [87, 7], [80, 18], [58, 27], [28, 31], [0, 32]];
  const pts: P2[] = [];
  for (const sd of [1, -1]) {
    const L = sd > 0 ? loop : [...loop].reverse();
    for (const [ph, y] of L) {
      if (sd < 0 && ph === 0) continue;
      const a = (sd * ph * Math.PI) / 180;
      const X = 18.6 * Math.sin(a) * faceW;
      const Z = 21 * Math.cos(a);
      pts.push([X * c + Z * s, y]);
    }
  }
  // the hull (the far side of the loop folds back as he turns; there its edge is the face's silhouette), resampled
  // and given small inward bumps: where hair lies over the cheek its edge is curls, not a cut
  // (rounded first: a sharp corner of the hull made its curl bumps loop into a dark wedge on the jaw)
  let h = hull(pts);
  for (let r = 0; r < 3; r++) h = h.flatMap((a, i): P2[] => [mix2(a, h[(i + 1) % h.length], 0.25), mix2(a, h[(i + 1) % h.length], 0.75)]);
  const dense: P2[] = [];
  for (let i = 0; i < h.length; i++) {
    const a = h[i];
    const b = h[(i + 1) % h.length];
    const m = Math.max(1, Math.round(vlen(sub(b, a)) / 6));
    for (let k = 0; k < m; k++) dense.push(mix2(a, b, k / m));
  }
  // kept inside the head's outline (a point outside is moved onto it, a hair inside), so the curled edge never
  // crosses the face's own contour (the crossings drew dark blobs on the cheek)
  const headPoly = headPts(build, yaw).map((p): P2 => [p[0] * faceW, p[1]]);
  const inside = (q: P2) => {
    let inn = false;
    for (let i = 0, j = headPoly.length - 1; i < headPoly.length; j = i++) {
      const [xi, yi] = headPoly[i];
      const [xj, yj] = headPoly[j];
      if (yi > q[1] !== yj > q[1] && q[0] < ((xj - xi) * (q[1] - yi)) / (yj - yi) + xi) inn = !inn;
    }
    return inn;
  };
  const hc0 = centroid(headPoly);
  const clamped = dense.map((q) => !inside(q));
  const kept = dense.map((q): P2 => {
    if (inside(q)) return q;
    let best = q;
    let bd = Infinity;
    for (let i = 0; i < headPoly.length; i++) {
      const cpt = closestOnSeg(q, headPoly[i], headPoly[(i + 1) % headPoly.length]);
      const dd = vlen(sub(q, cpt));
      if (dd < bd) {
        bd = dd;
        best = cpt;
      }
    }
    return add(best, mul(norm(sub(hc0, best)), 0.2));
  });
  // curls only where the hair really lies over the cheek (not along the face's own edge)
  const maskD = scallopD(kept, (i) => (clamped[i] || clamped[(i + 1) % kept.length] ? 0 : -curl * (0.85 + 0.3 * hash(i, 77))));
  const HEAD = smoothClosed(headPoly);
  return { maskD, HEAD };
};
const FaceMask: React.FC<{ id: string; build: FaceBuild; yaw: number; faceW: number; curl: number }> = ({ id, build, yaw, faceW, curl }) => {
  const { maskD, HEAD } = faceMaskGeo(build, yaw, faceW, curl);
  // two masks: the fills stop at the curled edge; the locks' own heavy outlines stop a little further out, so where a
  // lock's edge meets the face it leaves no dark wedge (the curled edge carries its own outline)
  return (
    <>
      <clipPath id={`${id}-h`}>
        <path d={HEAD} />
      </clipPath>
      <mask id={id} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
        <rect x={-400} y={-400} width={800} height={800} fill="white" />
        <path d={maskD} fill="black" clipPath={`url(#${id}-h)`} />
      </mask>
      {/* the crown's mask: only below the brows (its hairline over the forehead keeps its own outline) */}
      <clipPath id={`${id}-lo`}>
        <rect x={-400} y={-8} width={800} height={400} />
      </clipPath>
      <mask id={`${id}-c`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
        <rect x={-400} y={-400} width={800} height={800} fill="white" />
        <g clipPath={`url(#${id}-lo)`}>
          <path d={maskD} fill="black" stroke="black" strokeWidth={7} clipPath={`url(#${id}-h)`} />
        </g>
      </mask>
      <mask id={`${id}-o`} maskUnits="userSpaceOnUse" x={-400} y={-400} width={800} height={800}>
        <rect x={-400} y={-400} width={800} height={800} fill="white" />
        <path d={maskD} fill="black" stroke="black" strokeWidth={7} clipPath={`url(#${id}-h)`} />
      </mask>
    </>
  );
};


// ---- the hair as volumes round the skull -------------------------------------------------------
/** a station of a lock: height y, distance r from the head's axis, azimuth phi (deg, 0 = the face's front,
 *  + toward the man's left), the lock's width w */
type LockSt = { y: number; r: number; phi: number; w: number };
type LockDef = { sd: number; st: LockSt[]; role: "A" | "B" | "C" | "D"; seed: number; tips: number };
const lockDefs = (kind: HairKind, vol: number, len: number): LockDef[] => {
  const out: LockDef[] = [];
  const L = (y: number) => (y > 10 ? 10 + (y - 10) * len : y);
  const S = (list: [number, number, number, number][]): LockSt[] => list.map(([y, r, phi, w]) => ({ y: L(y), r: r * vol, phi, w: w * vol }));
  if (kind === "periwig") {
    for (const sd of [-1, 1]) {
      // A: the front lock, from the temple, bulging past the cheek, falling in front of the shoulder to the chest
      out.push({ sd, role: "A", seed: 10 + sd, tips: 2, st: S([[-18, 27, 68, 14], [-3, 31, 78, 20], [16, 33.5, 82, 24], [38, 34, 77, 24], [60, 32, 69, 19], [80, 29, 62, 11]]) });
      // B: the side lock, outside and behind A, the fullest
      out.push({ sd, role: "B", seed: 20 + sd, tips: 3, st: S([[-26, 28, 100, 18], [-6, 35, 104, 26], [18, 39, 106, 30], [44, 39, 102, 28], [68, 36, 96, 20], [88, 32, 92, 11]]) });
      // C: the back lock, behind the shoulder
      out.push({ sd, role: "C", seed: 30 + sd, tips: 2, st: S([[-26, 24, 140, 22], [6, 29, 142, 26], [38, 31, 146, 26], [68, 28, 150, 20], [90, 24, 154, 11]]) });
    }
    out.push({ sd: 1, role: "D", seed: 40, tips: 3, st: S([[-30, 20, 180, 30], [8, 26, 180, 36], [44, 26, 180, 34], [78, 22, 180, 26], [94, 18, 180, 14]]) });
  } else if (kind === "own") {
    for (const sd of [-1, 1]) {
      out.push({ sd, role: "A", seed: 10 + sd, tips: 2, st: S([[-14, 26, 74, 10], [-2, 31, 82, 15], [10, 34, 86, 17], [22, 32.5, 88, 15], [34, 34, 88, 14], [46, 38, 92, 9]]) });
      out.push({ sd, role: "B", seed: 20 + sd, tips: 3, st: S([[-22, 27, 102, 16], [-4, 36, 106, 23], [12, 40, 110, 25], [28, 37, 112, 21], [42, 40, 114, 17], [54, 44, 116, 8]]) });
      out.push({ sd, role: "C", seed: 30 + sd, tips: 2, st: S([[-24, 23, 142, 18], [6, 27, 146, 21], [30, 28, 150, 18], [48, 25, 154, 9]]) });
    }
    out.push({ sd: 1, role: "D", seed: 40, tips: 3, st: S([[-28, 19, 180, 26], [8, 24, 180, 30], [34, 23, 180, 26], [52, 19, 180, 12]]) });
  }
  return out;
};
const chaikin = (pts: [P2, number][], n = 2): [P2, number][] => {
  let p = pts;
  for (let k = 0; k < n; k++) {
    const q: [P2, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      q.push([mix2(p[i][0], p[i + 1][0], 0.25), mix(p[i][1], p[i + 1][1], 0.25)], [mix2(p[i][0], p[i + 1][0], 0.75), mix(p[i][1], p[i + 1][1], 0.75)]);
    }
    q.push(p[p.length - 1]);
    p = q;
  }
  return p;
};
const resample = (pts: [P2, number][], step: number): [P2, number][] => {
  const out: [P2, number][] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const L = vlen(sub(b[0], a[0]));
    let tt = step - acc;
    while (tt <= L) {
      const u = tt / L;
      out.push([mix2(a[0], b[0], u), mix(a[1], b[1], u)]);
      tt += step;
    }
    acc = L - (tt - step);
  }
  const last = pts[pts.length - 1];
  if (vlen(sub(last[0], out[out.length - 1][0])) > step * 0.35) out.push(last);
  return out;
};
/** a closed polygon's outline drawn as a scalloped edge: every edge between samples bulges outward (the curls) */
const scallopD = (poly: P2[], bump: (i: number) => number) => {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1];
  const sgn = area > 0 ? -1 : 1;
  let d = `M${P(poly[0])}`;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const e = sub(b, a);
    const L = vlen(e);
    if (L < 0.3) continue;
    const nr: P2 = [(sgn * e[1]) / L, (-sgn * e[0]) / L];
    const h = bump(i) * Math.min(1, L / 6) * 1.33;
    d += `C${P(add(add(a, mul(e, 0.05)), mul(nr, h)))} ${P(add(add(b, mul(e, -0.05)), mul(nr, h)))} ${P(b)}`;
  }
  return `${d}Z`;
};
type LockGeo = { def: LockDef; spine: [P2, number][]; outline: string; depth: number; depth0: number; poly: P2[] };
const lockGeo = (def: LockDef, hc: number, hs: number, kind: HairKind): LockGeo => {
  const proj = (st: LockSt): [P2, number] => {
    const ph = (def.sd * st.phi * Math.PI) / 180;
    const X = st.r * Math.sin(ph);
    const Z = st.r * Math.cos(ph);
    // a lock seen edge-on (at the back, in profile) narrows a little but keeps its body
    const side = Math.abs(Math.cos(ph) * hs + Math.sin(ph) * hc);
    return [[X * hc + Z * hs, st.y], st.w * mix(1, 0.78, side * (def.role === "D" ? 0 : 0.6))];
  };
  const raw = def.st.map(proj);
  const spine = resample(chaikin(raw, 2), kind === "own" ? 9 : 8);
  const mid = def.st[Math.floor(def.st.length / 2)];
  const ph = (def.sd * mid.phi * Math.PI) / 180;
  const depth = mid.r * Math.cos(ph) * hc - mid.r * Math.sin(ph) * hs;
  const depth0 = mid.r * Math.cos(ph);
  // the outline: down the left edge, round the tips, up the right edge
  const n = spine.length;
  const Ls: P2[] = [];
  const Rs: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)][0];
    const b = spine[Math.min(n - 1, i + 1)][0];
    const u = norm(sub(b, a));
    const nr: P2 = [-u[1], u[0]];
    Ls.push(add(spine[i][0], mul(nr, spine[i][1] / 2)));
    Rs.push(add(spine[i][0], mul(nr, -spine[i][1] / 2)));
  }
  const end = spine[n - 1];
  const ue = norm(sub(end[0], spine[n - 2][0]));
  const ne: P2 = [-ue[1], ue[0]];
  // the tips: separate curls (periwig) or locks (own hair) at the end
  const tips: P2[] = [];
  const k = def.tips;
  for (let j = 0; j < k; j++) {
    const v = (j + 0.5) / k - 0.5;
    const tipLen = (kind === "own" ? 9 : 6) * (0.75 + 0.5 * hash(j, def.seed));
    tips.push(add(add(end[0], mul(ne, v * end[1] * 1.1)), mul(ue, tipLen)));
    if (j < k - 1) tips.push(add(add(end[0], mul(ne, ((j + 1) / k - 0.5) * end[1] * 1.05)), mul(ue, kind === "own" ? -2 : 0.5)));
  }
  const poly = [...Ls, ...tips.reverse(), ...Rs.reverse()];
  const top = spine[0];
  const ut = norm(sub(spine[1][0], top[0]));
  poly.push(add(top[0], mul(ut, -top[1] * 0.4)));
  const bumpSz = kind === "own" ? 1.3 : 3.4;
  const outline = scallopD(poly, (i) => bumpSz * (0.55 + 0.9 * hash(i, def.seed + 5)));
  return { def, spine, outline, depth, depth0, poly };
};

/** the hair of a head at a yaw: what goes behind the body, behind the face, and over the face */
const hairArt = (look: Look, yaw: number, ink: Ink, uid: string, cap: boolean, maskId: string) => {
  const maskGeo = faceMaskGeo(look.build, yaw, look.faceW, look.hair === "own" ? 0.5 : 0.75);
  const kind = look.hair;
  const tone = dimTone(look.tone, inkLevel(ink));
  const hc = Math.cos(yaw);
  const hs = Math.sin(yaw);
  const own = kind === "own";
  const short = kind === "short";
  const R = (own ? 27 : short ? 24.6 : 30.5) * (short ? 1 : look.vol);
  const cy = own ? -12 : short ? -10.5 : -14;
  const cz = own ? -3 : short ? -1.5 : -5;
  const ccx = cz * hs;
  const rho = (y: number) => Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
  const hyDeg = (yaw * 180) / Math.PI;
  // the hairline round the head (phi from the front): high and open over the forehead, down at the temples
  const yh = (phiDeg: number) => {
    const a = Math.abs(phiDeg);
    if (short) return a < 50 ? mix(-24, -21, a / 50) : a < 80 ? mix(-21, -9, (a - 50) / 30) : a < 96 ? mix(-9, -2, (a - 80) / 16) : a < 120 ? mix(-2, 4, (a - 96) / 24) : mix(4, 14, c01((a - 120) / 40));
    if (own) return a < 8 ? -23.5 + 1.5 * (a / 8) : a < 60 ? mix(-22, -18, (a - 8) / 52) : a < 90 ? mix(-18, -7, (a - 60) / 30) : a < 120 ? mix(-7, 6, (a - 90) / 30) : 14;
    // the centre parting, the hair lifting off the forehead into the two peaks, then down to the temples
    return a < 6 ? -23.6 : a < 28 ? mix(-23.6, -26.5, (a - 6) / 22) : a < 58 ? mix(-26.5, -20, (a - 28) / 30) : a < 86 ? mix(-20, -9, (a - 58) / 28) : a < 120 ? mix(-9, 6, (a - 86) / 34) : 16;
  };
  const crown: P2[] = [];
  for (let ph = -90 - hyDeg; ph <= 90 - hyDeg + 0.01; ph += 3) {
    const y = yh(ph);
    const rr = rho(y);
    const a = ((ph + hyDeg) * Math.PI) / 180;
    crown.push([ccx + rr * Math.sin(a) * 1.01, y]);
  }
  // over the top, from the right end back to the left: the scalloped outer edge and the two raised peaks
  const yr = crown[crown.length - 1][1];
  const yl = crown[0][1];
  const a0 = Math.atan2(yr - cy, rho(yr));
  let a1 = Math.atan2(yl - cy, -rho(yl));
  if (a1 > a0) a1 -= 2 * Math.PI;
  const peakH = kind === "periwig" ? 9 * look.vol : own ? 1.5 : 0;
  const peaks = [-1, 1].map((sd) => ({ x: ccx + sd * 12.5 * hc, h: peakH * (0.62 + 0.38 * Math.abs(hc)) }));
  const outer: P2[] = [];
  const NO = 44;
  for (let i = 1; i < NO; i++) {
    const a = mix(a0, a1, i / NO);
    const px = ccx + R * Math.cos(a);
    const up = Math.max(0, -Math.sin(a));
    const pk = Math.min(peakH, peaks.reduce((acc, p) => acc + p.h * Math.exp(-((px - p.x) ** 2) / 75), 0)) * up * up;
    const rr = R + 1;
    outer.push([ccx + rr * Math.cos(a) * (1 + 0.06 * up), cy + rr * Math.sin(a) * (1 - 0.1 * up) - pk]);
  }
  const crownPoly = [...crown, ...outer];
  // scallops only on the outer edge (the hairline over the forehead stays a soft clean curve)
  const nCr = crown.length;
  const crBump = (i: number) => (i < nCr - 1 ? (short ? 1.5 : own ? 0.7 : 1.2) : short ? 1.6 : own ? 1.4 : 2.6) * (0.6 + 0.8 * hash(i, 501));
  const CROWN = scallopD(crownPoly, crBump);
  const locks = lockDefs(kind, look.vol, look.len).map((d) => lockGeo(d, hc, hs, kind));
  // ---- texture: grouped ringlet arcs along a periwig lock, long waves along his own hair; the lit band on the
  // upper-left of each mass, darker toward the neck and on the shadow side
  const lockTex = (g: LockGeo) => {
    const sp = g.spine;
    const n = sp.length;
    let curls = "";
    let flow = "";
    let lit = "";
    for (let i = 1; i < n - 1; i++) {
      const u = norm(sub(sp[Math.min(n - 1, i + 1)][0], sp[i - 1][0]));
      const nr: P2 = [-u[1], u[0]];
      const w = sp[i][1];
      if (!own) {
        // ringlets in clusters of three, the cluster's middle arc the longest; a gap between clusters
        if (i % 4 === 3) continue;
        const off = (hash(i, g.def.seed) - 0.5) * 0.14 * w;
        const hw = (i % 4 === 1 ? 0.4 : 0.33) * w;
        const tw = (i % 2 ? 1 : -1) * 1.6;
        const cc = add(sp[i][0], mul(nr, off));
        const p0 = add(add(cc, mul(nr, -hw)), mul(u, -tw));
        const p1 = add(add(cc, mul(nr, hw)), mul(u, tw));
        curls += `M${P(p0)}C${P(add(p0, mul(u, 5.2)))} ${P(add(p1, mul(u, 5.2)))} ${P(p1)}`;
        // the curl's turn: a small hook back up inside it
        curls += `M${P(add(p1, mul(nr, -hw * 0.3)))}q${P(mul(u, -2.6))} ${P(mul(nr, -hw * 0.45))}`;
      }
    }
    // long strands along the lock (own hair: the waves; periwig: two flow lines between the curls)
    const strands = own ? [-0.32, -0.12, 0.1, 0.3] : [-0.22, 0.24];
    for (const v of strands) {
      const pts = sp.map(([p, w], i): P2 => {
        const a = sp[Math.max(0, i - 1)][0];
        const b2 = sp[Math.min(n - 1, i + 1)][0];
        const u = norm(sub(b2, a));
        const nr: P2 = [-u[1], u[0]];
        const wav = own ? 2.4 * Math.sin(i * 0.95 + g.def.seed * 0.7) * (0.6 + 0.4 * Math.abs(v) * 3) : 0;
        return add(p, mul(nr, v * w + wav));
      });
      const a = own ? 0 : 1;
      flow += `M${pts.slice(a, n - (own ? 0 : 1)).map(P).join("L")}`;
    }
    // the lit band: a soft lighter strip down the upper-left side of the lock, fading down its length
    const litSide = 1;
    const litPts = sp.slice(0, Math.max(2, Math.ceil(n * 0.62))).map(([p, w], i): St => {
      const a = sp[Math.max(0, i - 1)][0];
      const b2 = sp[Math.min(n - 1, i + 1)][0];
      const u = norm(sub(b2, a));
      let nr: P2 = [-u[1], u[0]];
      if (nr[0] > 0) nr = [-nr[0], -nr[1]];
      return [add(p, mul(nr, litSide * w * 0.18)), w * 0.5 * (1 - (i / n) * 0.9)];
    });
    lit = litPts.length > 1 ? limbD(litPts) : "";
    // darker toward the end of the lock (the neck, the chest)
    const lo = sp.slice(Math.floor(n * 0.55));
    const deepEnd = lo.length > 1 ? limbD(lo.map(([p, w]): St => [p, w * 1.3])) : "";
    const x0 = Math.min(...g.poly.map((p) => p[0])) - 4;
    const x1 = Math.max(...g.poly.map((p) => p[0])) + 4;
    const y0 = Math.min(...g.poly.map((p) => p[1])) - 4;
    const y1 = Math.max(...g.poly.map((p) => p[1])) + 4;
    return (
      <>
        {deepEnd ? <path d={deepEnd} fill={tone.deep} opacity={0.42} /> : null}
        {lit ? <path d={lit} fill={tone.light} opacity={0.9} /> : null}
        {/* the shadow side and the lower end: hatching */}
        <path d={hatchD(mix(x0, x1, 0.5), y0, x1, y1, 112, 2.5, g.def.seed + 61, 0.2)} {...ln(0.9, 0.42)} />
        <path d={hatchD(x0, mix(y0, y1, 0.62), x1, y1, 70, 3, g.def.seed + 62, 0.3)} {...ln(0.85, 0.36)} />
        <path d={flow} {...ln(own ? 1.15 : 1.05, own ? 0.7 : 0.4)} />
        {curls ? <path d={curls} {...ln(1.25, 0.78)} /> : null}
      </>
    );
  };
  const lockEl = (g: LockGeo, mode: "fill" | "outline" | "both", key: string, tex = true, fillCol = tone.base) => (
    <g key={key}>
      {mode !== "fill" ? <path d={g.outline} fill={mode === "outline" ? "none" : fillCol} {...OUT} strokeWidth={mode === "outline" ? 4.6 : 2.4} /> : null}
      {mode !== "outline" ? (
        <>
          <clipPath id={`${uid}-lk${key}`}>
            <path d={g.outline} />
          </clipPath>
          {mode === "fill" ? <path d={g.outline} fill={fillCol} /> : null}
          {tex ? <g clipPath={`url(#${uid}-lk${key})`}>{lockTex(g)}</g> : null}
        </>
      ) : null}
    </g>
  );
  // ---- the crown's texture: strands sweeping from the parting down to the sides (3D, so they turn with him)
  const crownTex = (() => {
    let d = "";
    let curls = "";
    for (const sd of [-1, 1]) {
      const nS = own ? 7 : 6;
      for (let j = 0; j < nS; j++) {
        // a strand starts on the parting (front .. back) and runs down to the hairline at the side
        const back = j / (nS - 1);
        const th0 = mix(0.25, 1.3, back); // polar angle of the start, from the top toward the front (+) / back
        const startPhi = back < 0.5 ? 0 : 180;
        const pts: P2[] = [];
        let visible = 0;
        for (let k = 0; k <= 14; k++) {
          const u = k / 14;
          const phi = sd * mix(startPhi === 0 ? 4 : 176, startPhi === 0 ? mix(70, 96, back) : mix(150, 120, back * 0), u);
          const pol = mix(startPhi === 0 ? Math.max(0.12, 0.9 - back * 1.4) : 0.3 + (back - 0.5), mix(1.4, 1.75, u), u) * (1 - 0.0 * u);
          const rr = R + 0.5 - (own ? 0.6 : 1.4) * Math.sin(Math.PI * u) * 0;
          const y = cy - rr * Math.cos(pol);
          const rh = rr * Math.sin(pol);
          const X = rh * Math.sin((phi * Math.PI) / 180);
          const Z = rh * Math.cos((phi * Math.PI) / 180) + cz;
          const dep = (Z - cz) * hc - X * hs;
          if (dep < -2) {
            if (pts.length > 1) d += `M${pts.map(P).join("L")}`;
            pts.length = 0;
            continue;
          }
          visible++;
          pts.push([X * hc + Z * hs, y + (own ? 0.8 * Math.sin(u * 7 + j) : 0)]);
        }
        if (pts.length > 1) d += `M${pts.map(P).join("L")}`;
        void th0;
        void visible;
      }
    }
    if (kind === "periwig") {
      // the curls of the crown: two rows of crescents round the peaks, following the dome
      for (const sd of [-1, 1]) {
        for (let r2 = 0; r2 < 2; r2++) {
          for (let j = 0; j < 5; j++) {
            const phi = sd * (24 + j * 22 + r2 * 11);
            const pol = 0.62 + r2 * 0.38 + 0.05 * hash(j, 7 + r2);
            const y = cy - R * Math.cos(pol);
            const rh = R * Math.sin(pol);
            const X = rh * Math.sin((phi * Math.PI) / 180);
            const Z = rh * Math.cos((phi * Math.PI) / 180) + cz;
            const dep = (Z - cz) * hc - X * hs;
            if (dep < 4) continue;
            const p: P2 = [X * hc + Z * hs, y];
            const w = 4.2 * Math.min(1, dep / 14 + 0.3);
            curls += `M${P([p[0] - w, p[1] - 1])}C${P([p[0] - w, p[1] + 3.6])} ${P([p[0] + w, p[1] + 3.6])} ${P([p[0] + w, p[1] - 1.4])}`;
          }
        }
      }
    }
    return { d, curls };
  })();
  const yTop = cy - R - 8;
  const crownEl = (
    <>
      <clipPath id={`${uid}-cr`}>
        <path d={CROWN} />
      </clipPath>
      <path d={CROWN} fill={tone.base} />
      <g clipPath={`url(#${uid}-cr)`}>
        {/* the lit band across the crown and the upper-left; the shadow side hatched */}
        <ellipse cx={ccx - R * 0.28} cy={cy - R * 0.5} rx={R * 0.62} ry={R * 0.42} transform={`rotate(-24 ${(ccx - R * 0.28).toFixed(1)} ${(cy - R * 0.5).toFixed(1)})`} fill={tone.light} opacity={0.92} />
        <path d={hatchD(ccx + R * 0.25, yTop, ccx + R + 8, cy + 30, 112, 2.5, 701, 0.18)} {...ln(0.9, 0.45)} />
        <path d={crownTex.d} {...ln(own ? 1.05 : 1, own ? 0.6 : 0.45)} />
        {crownTex.curls ? <path d={crownTex.curls} {...ln(1.2, 0.72)} /> : null}
        {short ? (
          // cropped hair: short strokes combed down and forward from the crown, in tufts along the edge
          <path
            d={crown
              .filter((_, i) => i % 2 === 0)
              .map((p, i) => {
                const dx = (ccx - p[0]) * 0.18;
                return `M${P([p[0] + dx, p[1] - 7 - 2 * hash(i, 521)])}L${P([p[0] + dx * 0.2, p[1] - 1])}`;
              })
              .join("") + outer.filter((_, i) => i % 3 === 0).map((p) => `M${P(mix2(p, [ccx, cy], 0.28))}L${P(mix2(p, [ccx, cy], 0.06))}`).join("")}
            {...ln(1, 0.6)}
          />
        ) : null}
        {/* the parting */}
        {!short ? (() => {
          const pts: P2[] = [];
          for (let k = 0; k <= 10; k++) {
            const pol = mix(1.25, -0.2, k / 10);
            const y = cy - R * Math.cos(pol);
            const Z = R * Math.sin(pol) + cz;
            if ((Z - cz) * hc < -1) break;
            pts.push([Z * hs, y + 0.6]);
          }
          return pts.length > 1 ? <path d={`M${pts.map(P).join("L")}`} {...ln(1.4, 0.8)} /> : null;
        })() : null}
      </g>
    </>
  );
  // ONE layer per lock, swapped hard (never a fade over the coat). The back locks (C, D) always hang behind the
  // body. A front or side lock (A, B) lies over the body on the near side and behind it on the far side; facing
  // dead front both are over. So the far one swaps as the head leaves the front view, where the swap costs the
  // fewest pixels: the upper arm's sleeve (drawn over the hair) hides most of the lock there (measured on the
  // probe strip LondonCastV2Swap: all-over vs all-behind differ least at yaw 0).
  const FRONT_T = 6;
  const isOver = (g: LockGeo) => (g.def.role === "A" || g.def.role === "B") && g.depth >= g.depth0 - 0.5;
  const behind = locks.filter((g) => !isOver(g) && g.depth < FRONT_T).sort((a, b) => a.depth - b.depth);
  const mid = locks.filter((g) => isOver(g) && g.depth < FRONT_T).sort((a, b) => a.depth - b.depth);
  const front = locks.filter((g) => g.depth >= FRONT_T).sort((a, b) => a.depth - b.depth);
  // the back locks are in shadow (by role, so a swap never changes a lock's colour)
  const fillOf = (g: LockGeo) => (g.def.role === "C" || g.def.role === "D" ? mixHex(tone.base, tone.deep, 0.55) : tone.base);
  const backEl = <>{behind.map((g, i) => lockEl(g, "both", `b${i}`, true, fillOf(g)))}</>;
  const midEl = <>{mid.map((g, i) => lockEl(g, "both", `m${i}`, true, fillOf(g)))}</>;
  const frontEl = short ? (
    <>
      <path d={CROWN} fill="none" {...OUT} strokeWidth={2.4} />
      {crownEl}
    </>
  ) : (
    <>
      {/* the crown and the front locks are ONE mass: all the outlines first, then the fills over them */}
      {/* the crown is masked off the face too (its lowest point on the near side reaches the cheek) */}
      <path d={CROWN} fill="none" {...OUT} strokeWidth={4.8} mask={`url(#${maskId}-c)`} />
      <g mask={`url(#${maskId}-o)`}>{front.map((g, i) => lockEl(g, "outline", `fo${i}`))}</g>
      <g mask={`url(#${maskId})`}>
        {front.map((g, i) => lockEl(g, "fill", `ff${i}`, false))}
      </g>
      <g mask={`url(#${maskId}-c)`}>{crownEl}</g>
      {/* the textured pass stops short of the face's edge (a ringlet cut by the edge read as a mark on the cheek) */}
      <g mask={`url(#${maskId}-o)`}>{front.map((g, i) => lockEl(g, "fill", `ft${i}`))}</g>
      {/* where the hair lies over the cheek, its curled edge gets the outline */}
      <clipPath id={`${uid}-fu`}>
        {front.map((g, i) => (
          <path key={i} d={g.outline} />
        ))}
      </clipPath>
      <clipPath id={`${uid}-fh`}>
        <path d={maskGeo.HEAD} />
      </clipPath>
      <g clipPath={`url(#${uid}-fu)`}>
        <path d={maskGeo.maskD} fill="none" {...OUT} strokeWidth={own ? 1.2 : 1.35} strokeOpacity={0.85} clipPath={`url(#${uid}-fh)`} />
      </g>
    </>
  );
  void cap;
  return { backEl, midEl, frontEl, hasFront: front.length > 0 };
};

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
// THE HAND (V2): a palm and the four fingers as ONE mass (finger lines inside it), a separate thumb on the body's
// side; open (fist 0) the fingers lie long and a little curled, closed (fist 1) they fold to a knuckled block with
// the thumb across them. Figure-local units at the rig's wrist W, along the rig's hand direction.
// ---------------------------------------------------------------------------
type ArmRigV2 = ReturnType<typeof figureRig>["armL"];
const HandV2: React.FC<{ a: ArmRigV2; k: number; ink: Ink }> = ({ a, k: k0, ink }) => {
  // a little larger than V1's hand (x1.1), a slim palm; the relaxed hand curls, its four fingertips separate
  const k = k0 * 1.1;
  const { W, dir: d, fist: f, sgn } = a;
  const n: P2 = [-d[1], d[0]];
  const fc = c01(f);
  const open = 1 - fc;
  const at = (along: number, across: number): P2 => add(W, add(mul(d, along * k), mul(n, across * k)));
  // the thumb's side (the body's side of the hand; up when the hand lies level) - the rig's rule
  const ts = Math.abs(n[0]) > 0.25 ? (n[0] * -sgn >= 0 ? 1 : -1) : n[1] < 0 ? 1 : -1;
  // the fingers curl toward the palm (away from the thumb's back): a relaxed hand already bends at the knuckles
  const curl = mix(30, 82, fc) * -ts;
  const kn = 13; // the knuckles along the hand
  const fd = rot(d, curl * 0.5);
  const fd2 = rot(d, curl);
  const K = (across: number): P2 => at(kn, across);
  // four fingers, the middle ones longest; each tip a small rounded lobe, a notch between them
  const lens = [0.86, 1, 0.97, 0.8];
  const fl = mix(7.5, 14, open);
  const across = [-5.4, -1.8, 1.8, 5.4].map((v) => v * (ts > 0 ? 1 : -1));
  const tipOf = (i: number): P2 => add(add(K(across[i] * 0.95), mul(fd, fl * 0.5 * lens[i] * k)), mul(fd2, fl * 0.5 * lens[i] * k));
  const tn: P2 = [-fd2[1], fd2[0]];
  const order = [0, 1, 2, 3].sort((p, q) => across[p] - across[q]);
  const tipPts: P2[] = [];
  order.forEach((i, idx) => {
    const t = tipOf(i);
    tipPts.push(add(t, mul(tn, -1.5 * k)), add(t, mul(fd2, 1.6 * k)), add(t, mul(tn, 1.5 * k)));
    if (idx < 3) {
      const t2 = tipOf(order[idx + 1]);
      tipPts.push(add(mix2(t, t2, 0.5), mul(fd2, -mix(1.2, 2.4, open) * k)));
    }
  });
  const mass = smoothClosed([at(-1, -6.4), at(6, -7.4), K(-7.6), ...tipPts, K(7.4), at(6, 7.2), at(-1, 6.2)]);
  // the separations: from each notch back toward the knuckles
  const lines = order
    .slice(0, 3)
    .map((i, idx) => {
      const t = tipOf(i);
      const t2 = tipOf(order[idx + 1]);
      const nt = add(mix2(t, t2, 0.5), mul(fd2, -mix(1.2, 2.4, open) * k));
      const back = add(nt, mul(fd, -mix(3, 6.5, open) * k));
      return `M${P(nt)}L${P(back)}`;
    })
    .join("");
  const knuck = fc > 0.5 ? [-0.5, 0, 0.5].map((v) => `M${P(K(v * 7.4 - 2))}q${P(mul(fd, 1.4 * k))} ${P(mul(n, 4 * k))}`).join("") : "";
  // the thumb: from the base of the palm on its own side, out and forward (open), across the fingers (closed)
  const tb = at(4.5, ts * 6.4);
  const tdir = rot(d, ts * mix(-18, 26, open));
  const tl = mix(8, 10, open);
  const tTip = add(add(tb, mul(tdir, tl * k)), mul(n, -ts * mix(3.5, 0, open) * k));
  const thumb = limbD([
    [add(tb, mul(tdir, -2.5 * k)), 5.6 * k],
    [add(tb, mul(tdir, tl * 0.5 * k)), 4.9 * k],
    [tTip, 3.7 * k],
  ]);
  return (
    <g>
      <path d={mass} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={lines} {...ln(1.05, 0.75)} />
      {knuck ? <path d={knuck} {...ln(1.1, 0.6 * (fc - 0.5) * 2)} /> : null}
      {/* the shadow side of the hand */}
      <path d={braceletD(at(1, 0), at(kn, 0), 14 * k, 14 * k, 91, 2.8, 0.5)} {...ln(0.8, 0.4)} />
      <path d={thumb} fill={ink.main} {...OUT} strokeWidth={2} />
      <path d={`M${P(add(tb, mul(tdir, tl * 0.6 * k)))}l${P(mul(rot(tdir, 90 * ts), 2 * k))}`} {...ln(0.9, 0.45)} />
    </g>
  );
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
  /** (addition) a book or a quill in his near hand (a Fellow; pose the near hand at the chest for the book) */
  held?: "none" | "book" | "quill" | "paper";
  /** (addition) draw ONLY this arm (with its sleeve and hand): for an arm that goes behind another figure */
  onlyArm?: "L" | "R";
  /** (addition) leave this arm out (draw it separately with onlyArm) */
  hideArm?: "L" | "R";
  /** (addition, DEPTH) the form shadow, 0 (default, off) .. 1: the right side of the coat, sleeves, legs and face one
   *  step darker (a flat tone plus hatching), light from the upper left, at every yaw */
  shade?: number;
};
export const LondonFigure: React.FC<LondonFigureProps> = (props) => {
  const { kind, pose: q, at, scale, uid, tone = 1 } = props;
  const shadeAmt = props.shade ?? 0;
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
        <RimShade id={`${uid}-rss${l.sgn}`} d={limbD([[mix2(l.K, l.A, 0.02), 16 * k], [mix2(l.K, l.A, 0.34), 17.6 * k], [mix2(l.K, l.A, 0.8), 11.6 * k], [l.A, 10.6 * k]])} off={[7, 2]} box={bboxOf([l.K, l.A], 14)} col={ink.deep} amt={shadeAmt} seed={961 + l.sgn} />
        <path d={knit} {...ln(0.7, 0.32)} />
        <path d={braceletD(l.K, l.A, 17 * k, 11.5 * k, 83 + l.sgn, 3.2, 0.65)} {...ln(0.9, 0.5)} />
        {/* the breeches, full to the knee, buckled under it */}
        <path d={limbD([[add(l.H, [0, -4]), 30 * k], [mix2(l.H, l.K, 0.5), 28.5 * k], [l.K, 23 * k], [gt, 19.5 * k]])} fill={breeches} {...OUT} />
        <RimShade id={`${uid}-rsb${l.sgn}`} d={limbD([[add(l.H, [0, -4]), 30 * k], [mix2(l.H, l.K, 0.5), 28.5 * k], [l.K, 23 * k], [gt, 19.5 * k]])} off={[10, 3]} box={bboxOf([l.H, gt], 20)} col={mixHex(breeches, DARK, 0.28)} amt={shadeAmt} seed={963 + l.sgn} />
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
        <RimShade id={`${uid}-rssk`} d={SK} off={[24, 6]} box={[skX0, skY0, skX1, skY1 + 30]} col={coat.deep} amt={shadeAmt} seed={965} />
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
      <RimShade id={`${uid}-rst`} d={worker ? `M${P(side([-hw + 6, shY + 4]))}Q${P(mT([0, shY + 30]))} ${P(side([hw - 6, shY + 4]))}L${P(side([wst + 3, 8]))}L${P(side([-wst - 3, 8]))}Z` : TORSO} off={[22, 5]} box={[-hw - 12, shY - 12, hw + 12, 14]} col={worker ? mixHex(body, DARK, 0.2) : coat.deep} amt={shadeAmt} seed={967} />
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
    // the falling lace cravat: a soft pale band from the knot at the throat, widening a little to its lace end, with
    // wavy lace lines across the end (no grid)
    const top = mT([0, shY - 4]);
    const mid = mT([0.5, shY + 18]);
    const end = mT([1, shY + 44]);
    const ldir = norm(sub(end, mid));
    const ln2: P2 = [-ldir[1], ldir[0]];
    const wave = (t: number, w: number, seed: number) => {
      const c0 = mix2(mid, end, t);
      const pts: P2[] = [];
      for (let k = 0; k <= 8; k++) {
        const v = k / 8 - 0.5;
        pts.push(add(add(c0, mul(ln2, v * w)), mul(ldir, 1.3 * Math.sin(k * 1.6 + seed))));
      }
      return `M${pts.map(P).join("L")}`;
    };
    return (
      <g transform={torsoTf}>
        <path d={limbD([[top, 12], [mid, 13.5], [mix2(mid, end, 0.6), 16.5], [end, 18]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
        {/* the knot under the chin, a fold down the shaded side */}
        <path d={`M${P(add(top, [-5, 4]))}Q${P(add(top, [0, 7.5]))} ${P(add(top, [5, 4]))}`} {...ln(1, 0.5)} />
        <path d={`M${P(add(mid, mul(ln2, 4)))}Q${P(add(mix2(mid, end, 0.5), mul(ln2, 5.5)))} ${P(add(end, mul(ln2, 6)))}`} {...ln(0.9, 0.35)} />
        <path d={[0.55, 0.75, 0.93].map((t, i) => wave(t, mix(14, 17, t), i * 2.1)).join("")} {...ln(0.95, 0.6)} />
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

  // ---- the arms (V2): one continuous coat sleeve from the shoulder to the deep cuff ON the wrist, the shirt's
  // ruffle under it, the hand; the elbow is a bend with folds in its crook, not a seam. (The worker: the rolled
  // shirt sleeve over the upper arm, the bare forearm.) Drawn here on the rig's joints; the rig's own arm is not drawn.
  const sleeve = (ar: typeof r.armL) => {
    const fu = norm(sub(ar.W, ar.E));
    const fn: P2 = [-fu[1], fu[0]];
    const uu = norm(sub(ar.E, ar.S));
    const bend = Math.abs(fu[0] * uu[1] - fu[1] * uu[0]);
    // the crook of the elbow: the side the forearm turns toward
    const crookSd = fu[0] * uu[1] - fu[1] * uu[0] > 0 ? -1 : 1;
    const un: P2 = [-uu[1], uu[0]];
    const crook = add(ar.E, mul(un, crookSd * 10 * k));
    const folds =
      bend > 0.18
        ? [0, 1, 2].map((j) => `M${P(add(crook, add(mul(uu, (-6 + j * 5) * k), mul(un, crookSd * 1.5))))}q${P(mul(un, -crookSd * 6 * k))} ${P(add(mul(un, -crookSd * 9 * k), mul(uu, 3 * k)))}`).join("")
        : "";
    if (worker) {
      // the shirt sleeve, full and soft, rolled above the elbow; the bare forearm below
      const roll = add(ar.E, mul(uu, -4 * k));
      const rn: P2 = [-norm(sub(roll, ar.S))[1], norm(sub(roll, ar.S))[0]];
      return (
        <>
          <path d={limbD([[add(ar.E, mul(fu, -2)), 19 * k], [mix2(ar.E, ar.W, 0.45), 17.5 * k], [add(ar.W, mul(fu, -1)), 13.5 * k]])} fill={ink.main} {...OUT} />
          <RimShade id={`${uid}-rsfa${ar.sgn}`} d={limbD([[add(ar.E, mul(fu, -2)), 19 * k], [mix2(ar.E, ar.W, 0.45), 17.5 * k], [add(ar.W, mul(fu, -1)), 13.5 * k]])} off={[7, 2]} box={bboxOf([ar.E, ar.W], 16)} col={ink.deep} amt={shadeAmt} seed={969 + ar.sgn} />
          <path d={braceletD(ar.E, ar.W, 18 * k, 13 * k, 853 + ar.sgn, 3.2, 0.6)} {...ln(0.9, 0.5)} />
          <path d={limbD([[ar.S, 29 * k], [mix2(ar.S, roll, 0.5), 29.5 * k], [roll, 27 * k]])} fill={ink.main} {...OUT} />
          <RimShade id={`${uid}-rsua${ar.sgn}`} d={limbD([[ar.S, 29 * k], [mix2(ar.S, roll, 0.5), 29.5 * k], [roll, 27 * k]])} off={[10, 3]} box={bboxOf([ar.S, roll], 20)} col={ink.deep} amt={shadeAmt} seed={971 + ar.sgn} />
          <path d={braceletD(ar.S, roll, 28 * k, 26 * k, 851 + ar.sgn, 3)} {...ln(0.95, 0.55)} />
          <path d={[0.3, 0.62].map((t) => `M${P(add(mix2(ar.S, roll, t), mul(rn, 9 * k)))}q${P(mul(norm(sub(roll, ar.S)), 4))} ${P(mul(rn, -12 * k))}`).join("")} {...ln(1, 0.5)} />
          {/* the roll: a thick band of folded linen */}
          <path d={limbD([[add(roll, mul(rn, -15 * k)), 10], [roll, 11.5], [add(roll, mul(rn, 15 * k)), 10]])} fill={linenDeep} {...OUT} strokeWidth={2} />
          <path d={`M${P(add(roll, mul(rn, -11 * k)))}Q${P(add(roll, mul(norm(sub(roll, ar.S)), 2)))} ${P(add(roll, mul(rn, 11 * k)))}`} {...ln(0.9, 0.55)} />
          <HandV2 a={ar} k={k} ink={ink} />
        </>
      );
    }
    // the cuff sits on the wrist: its lower edge just above the wrist, flaring, ~20 units deep
    const cuffB = add(ar.W, mul(fu, -1.5 * k));
    const cLen = Math.min(22 * k, vlen(sub(cuffB, ar.E)) * 0.62);
    const cuffA = add(cuffB, mul(fu, -cLen));
    const st: St[] = [
      [ar.S, 30 * k],
      [mix2(ar.S, ar.E, 0.5), 27.5 * k],
      [ar.E, 25 * k],
      [mix2(ar.E, cuffA, 0.5), 23 * k],
      [add(cuffA, mul(fu, 2)), 22 * k],
    ];
    const rf = add(ar.W, mul(fu, -2.5 * k));
    return (
      <>
        <path d={limbD(st)} fill={coat.main} {...OUT} />
        <RimShade id={`${uid}-rssl${ar.sgn}`} d={limbD(st)} off={[10, 3]} box={bboxOf([ar.S, ar.E, cuffA], 20)} col={coat.deep} amt={shadeAmt} seed={973 + ar.sgn} />
        <path d={braceletD(ar.S, ar.E, 29 * k, 25 * k, 851 + ar.sgn, 3.1)} {...ln(1, 0.58)} />
        <path d={braceletD(ar.E, cuffA, 25 * k, 22 * k, 855 + ar.sgn, 3.1, 0.8)} {...ln(0.95, 0.5)} />
        {folds ? <path d={folds} {...ln(1.15, 0.6)} /> : null}
        {/* the deep turned-back cuff: a flared band whose open edge sits on the wrist */}
        <path d={`M${P(add(cuffA, mul(fn, -12 * k)))}Q${P(add(cuffA, mul(fu, -1.6)))} ${P(add(cuffA, mul(fn, 12 * k)))}L${P(add(cuffB, mul(fn, 14.5 * k)))}Q${P(add(cuffB, mul(fu, 2.4)))} ${P(add(cuffB, mul(fn, -14.5 * k)))}Z`} fill={coat.deep} {...OUT} />
        <path d={braceletD(cuffA, cuffB, 24 * k, 29 * k, 857 + ar.sgn, 3.2, 0.7)} {...ln(0.95, 0.5)} />
        {/* the shirt's ruffle falling from the cuff over the wrist, then the hand */}
        <path d={limbD([[add(rf, mul(fu, -1)), 19 * k], [add(rf, mul(fu, 3)), 21 * k], [add(rf, mul(fu, 6)), 17 * k]])} fill={ink.main} {...OUT} strokeWidth={1.8} />
        <path d={[-1.5, -0.5, 0.5, 1.5].map((j) => `M${P(add(add(rf, mul(fu, 5.5)), mul(fn, j * 4.4 * k - 2)))}q${P(add(mul(fu, 2.2), mul(fn, 2)))} ${P(mul(fn, 4.2 * k))}`).join("")} {...ln(0.9, 0.6)} />
        <HandV2 a={ar} k={k} ink={ink} />
        {look.coatBraid ? <path d={`M${P(add(mix2(cuffA, cuffB, 0.35), mul(fn, -14 * k)))}L${P(add(mix2(cuffA, cuffB, 0.35), mul(fn, 14 * k)))}`} fill="none" stroke={coat.main} strokeWidth={2.6} /> : null}
        {[0.4, 0.8].map((t) => {
          const b = add(mix2(cuffA, cuffB, t), mul(fn, ar.sgn * 8 * k));
          return <circle key={t} cx={b[0]} cy={b[1]} r={2.2} fill={coat.main} stroke={DARK} strokeWidth={1} />;
        })}
      </>
    );
  };
  const armEl = (w: "L" | "R") => {
    const ar = w === "L" ? r.armL : r.armR;
    return (
      <g key={w} transform={tf}>
        <Cased id={`${uid}-sl${w}`}>{sleeve(ar)}</Cased>
      </g>
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

  // ---- (addition) a book or a quill in the near hand -------------------------------------------
  const heldEl = (() => {
    const held = props.held ?? "none";
    if (held === "none") return null;
    const near = G > 0 ? r.armL : r.armR;
    const gp = near.grip;
    const ang = (Math.atan2(near.dir[1], near.dir[0]) * 180) / Math.PI;
    if (held === "paper") {
      return (
        <g transform={`${tf} translate(${P(gp)}) rotate(${(ang - 90 + 12 * G).toFixed(2)})`}>
          <Cased id={`${uid}-pp`} r={1.2}>
            <path d="M-15,-30L17,-28L15,22Q0,19 -16,23Z" fill={ink.main} {...OUT} strokeWidth={1.6} />
            <path d={[-20, -12, -4, 4, 12].map((y) => `M-10,${y}L11,${y + 1}`).join("")} fill="none" stroke={DARK} strokeWidth={0.9} strokeOpacity={0.5} />
          </Cased>
        </g>
      );
    }
    if (held === "book") {
      return (
        <g transform={`${tf} translate(${P(gp)}) rotate(${(ang - 90).toFixed(2)})`}>
          <Cased id={`${uid}-bk`}>
            <rect x={-17} y={-25} width={34} height={46} rx={2} fill={mixHex(ink.hair, DARK, 0.45)} {...OUT} />
            <rect x={-17} y={-25} width={6} height={46} fill={mixHex(ink.hair, DARK, 0.25)} stroke={DARK} strokeWidth={1.2} />
            <path d="M-9,-21L13,-21M-9,17L13,17" fill="none" stroke={ink.main} strokeWidth={1.3} strokeOpacity={0.55} />
            <path d="M14,-22L14,18" fill="none" stroke={ink.main} strokeWidth={2.4} strokeOpacity={0.8} />
          </Cased>
        </g>
      );
    }
    return (
      <g transform={`${tf} translate(${P(gp)}) rotate(${(ang - 60 * G).toFixed(2)})`}>
        <Cased id={`${uid}-qu`} r={1.2}>
          <path d="M0,6L0,-62" fill="none" stroke={DARK} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M0,-8Q-9,-34 -3,-66Q5,-40 0,-8Z" fill={ink.main} {...OUT} strokeWidth={1.4} />
          <path d={[-16, -26, -36, -46, -56].map((y) => `M0,${y}l-5,4`).join("")} fill="none" stroke={DARK} strokeWidth={0.8} strokeOpacity={0.55} />
        </Cased>
      </g>
    );
  })();

  // ---- the head (V2): the face drawn here (FaceArt), the hair as volumes round the skull (hairArt) ----------
  const nod = Math.max(0, r.nodF);
  const hy = q.headYaw;
  const hairUid = `${uid}-hr`;
  const hair = hairArt(look, hy, ink, hairUid, cap, `${uid}-fm`);
  const headLocal = `${tf} ${headTf}`;
  const faceScale = look.faceW !== 1 ? `scale(${look.faceW} 1)` : undefined;
  // the worker's knitted cap (over the short hair; the near ear shows below it)
  const capEl = (() => {
    if (!worker || !cap) return null;
    const hs = Math.sin(hy);
    // the cap: a dome over the skull from just above the brow, rolled brim; the knitted crown slouches back
    const R = 25.5;
    const cy = -12;
    const cz = -1.5;
    const ccx = cz * hs;
    const brimY = (phi: number) => mix(-17, -8, c01(Math.abs(phi) / 130));
    const rim: P2[] = [];
    for (let ph = -90 - (hy * 180) / Math.PI; ph <= 90 - (hy * 180) / Math.PI + 0.01; ph += 6) {
      const y = brimY(ph);
      const rr = Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
      rim.push([ccx + rr * Math.sin(((ph + (hy * 180) / Math.PI) * Math.PI) / 180), y]);
    }
    const yr = rim[rim.length - 1][1];
    const yl = rim[0][1];
    const a0 = Math.atan2(yr - cy, Math.sqrt(Math.max(0, R * R - (yr - cy) ** 2)));
    let a1 = Math.atan2(yl - cy, -Math.sqrt(Math.max(0, R * R - (yl - cy) ** 2)));
    if (a1 > a0) a1 -= 2 * Math.PI;
    const dome: P2[] = [...rim];
    // the slouch: the crown leans toward the back of his head
    const back = -Math.sign(hs || 1) * Math.abs(hs);
    for (let i = 1; i < 30; i++) {
      const a = mix(a0, a1, i / 30);
      const up = Math.max(0, -Math.sin(a));
      const rr = R + 2 + up * 3;
      // the knitted crown is soft: it sags toward the back of his head and droops there
      const sag = Math.max(0, Math.cos(a) * back);
      dome.push([ccx + rr * Math.cos(a) + back * 13 * up * up + back * 5 * sag, cy + rr * Math.sin(a) - up * 6 + sag * 9]);
    }
    const DOME = smoothClosed(dome);
    // the knitted crown flops over to the back of his head: a soft lobe behind the dome
    const topY = Math.min(...dome.map((p) => p[1]));
    const bx = back >= 0 ? 1 : -1;
    const lobeOn = Math.abs(hs) > 0.15 ? c01((Math.abs(hs) - 0.15) * 3) : 0;
    const TIP = limbD([[[ccx - bx * 2, topY + 9], 22], [[ccx + bx * 13 * lobeOn, topY + 6], 20], [[ccx + bx * 24 * lobeOn, topY + 15 + 6 * lobeOn], 13]]);
    const rows = [0.3, 0.55, 0.78]
      .map((u) => {
        const y = mix(topY + 6, mix(-17, -8, 0.5) - 3, u);
        const half = Math.sqrt(Math.max(0, (R + 2) ** 2 - (y - cy) ** 2)) * 0.95;
        return `M${P([ccx - half, y + 1.5])}Q${P([ccx, y + 5])} ${P([ccx + half, y + 1.5])}`;
      })
      .join("");
    const capInk = mixHex(ink.deep, ink.hair, 0.7);
    // the rolled brim: a band along the rim
    const band = rim.length > 2 ? limbD(rim.map((p): St => [add(p, [0, -2.5]), 7.5])) : "";
    const ribs = rim
      .filter((_, i) => i % 2 === 1 && i < rim.length - 1)
      .map((p) => `M${P(add(p, [0, -5.5]))}L${P(add(p, [0, 0.5]))}`)
      .join("");
    return (
      <>
        <clipPath id={`${uid}-cp`}>
          <path d={DOME} />
        </clipPath>
        <path d={TIP} fill={capInk} {...OUT} />
        <path d={DOME} fill={capInk} {...OUT} />
        <g clipPath={`url(#${uid}-cp)`}>
          <path d={rows} {...ln(1, 0.45)} />
          <path d={hatchD(ccx + 6, -62, ccx + 40, -8, 112, 2.5, 712)} {...ln(0.9, 0.48)} />
        </g>
        {band ? <path d={band} fill={mixHex(ink.deep, ink.hair, 0.55)} {...OUT} strokeWidth={2} /> : null}
        {band ? <path d={ribs} {...ln(0.9, 0.5)} /> : null}
      </>
    );
  })();
  const hairBackEl = (
    <g transform={headLocal}>
      <Cased id={`${uid}-hbc`} r={1.4}>
        {hair.backEl}
      </Cased>
    </g>
  );
  const headEl = (
    <g transform={headLocal}>
      <FaceMask id={`${uid}-fm`} build={look.build} yaw={hy} faceW={look.faceW} curl={look.hair === "own" ? 0.5 : 0.75} />
      <Cased id={`${uid}-hdc`} r={1.3}>
        {hair.midEl}
        <g transform={faceScale}>
          <FaceArt yaw={hy} nod={nod} face={{ brow: q.brow, lids: q.lids, mouth: q.mouth }} build={look.build} cut={look.cut} aged={sp.aged} ears={look.hair === "short"} ink={ink} uid={`${uid}-fc`} shade={shadeAmt} />
        </g>
        {worker && cap ? capEl : hair.frontEl}
      </Cased>
    </g>
  );

  // ---- assembly --------------------------------------------------------------------------
  const NECK = limbD([[add(r.neck, [0, 5]), 21 * k * (0.8 + 0.2 * sfT.wf)], [mix2(r.neck, add(r.headC, [-7 * r.hs * sp.headScale, 0]), 0.78), 17 * k]]);
  if (props.onlyArm) return <g opacity={tone}>{armEl(props.onlyArm)}</g>;
  const armOn = (w: "L" | "R") => (props.hideArm === w ? null : armEl(w));
  const nearKey: "L" | "R" = G > 0 ? "L" : "R";
  const farKey: "L" | "R" = G > 0 ? "R" : "L";
  return (
    <g opacity={tone}>
      {hairBackEl}
      {profile ? armOn(farKey) : null}
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
      {profile ? armOn(nearKey) : [r.armL, r.armR].sort((p, q2) => p.z - q2.z).map((ar) => armOn(ar.sgn < 0 ? "L" : "R"))}
      {shovelEl}
      {heldEl}
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
