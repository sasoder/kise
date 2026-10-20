// ---------------------------------------------------------------------------
// farmersFigures: the shared engraved cast of the first-farmers clip (Dwarkesh
// Patel with Kyle Harper, Oct 2026), built ON the articulated rig of
// texcocoFigures exactly the way captureFigures is (same Spec / FigPose / IK /
// yaw, same inks, same manner): the rig's own legs (a Figure clipped below the
// hips), its own arms and hands (body={false}) and its own head (a Figure cut
// out at the head), with the costume drawn here in the same engraver's hand:
// cream form on a dark casing, a firm dark outline, hatching, light from the
// upper left. Nothing in texcocoFigures or captureFigures is edited or forked.
//
//   Farmer    Early Neolithic farmer (c. 6500-5000 BC, LBK / Starcevo): a belted
//             woollen tunic with short sleeves (the man's to the knee, the woman's
//             to the calf), cropped hair and a short beard (man) / hair in a bun
//             under a fillet (woman); solid ORANGE coat. Tools: flint-bladed
//             wooden sickle, a hafted stone hoe, a sheaf of wheat.
//   Forager   Mesolithic hunter-gatherer: a hide cape with a shaggy fur ruff
//             over the shoulders and a ragged fur hem, hide kilt / skirt, fur
//             leg-wraps, long loose hair and a full beard (man) / two long braids
//             (woman); CREAM. Gear: a flint-tipped spear, a bow and a quiver.
//   child     either of them at child proportions (child={true}): a bigger head,
//             short limbs; poses are scaled for you.
//   Commoner, Spaniard   the analogy cut's figures (captureFigures, texcocoFigures),
//             re-exported, each able to sicken and fall through <Sickening>.
//   Goat, Cow            the village's animals (cream; standing / grazing / ambient)
//   Longhouse, HideTent, WheatField, GrainHeap, Sheaf, Sickle, Hoe, Spear, Bow   props
//   FarmersSheet, FarmersProbe   the review compositions (src/Root.FarmersSheet.tsx)
//
// THE FALL: fall={p} on any cast member (p 0..1, LINEAR progress; ~36 frames
// is right: FALL.frames) turns the given pose into the sicken-and-fall track:
// p 0-0.3 he stoops, a hand to his belly; 0.3-0.55 the knees give; 0.5-0.92 he
// topples forward onto the ground (gravity: slow to tip, fast to land); lying
// still from 0.92. The ink drains to DEAD (#8A7B62) over p 0.08-0.85. He falls
// the way he faces (fallDir to force it); a front-facing pose turns to profile
// as he stoops. The ground contact is solved from the rig: nothing goes into the
// ground. fallPose(base, p) / fallAngle(p) / drainOf(p) are exported.
//
// Units: figure-local, feet at (0, 0), up is - y, a man ~310 units from the
// soles to the top of the skull (a woman ~298, a child ~232). scale = px per
// unit: a man `px` tall = scaleForPx(px) (world px = screen px / camera k).
// Draw inside a WorldSvg (firstFarmersShared). The API is described in
// animation_source/notes/WORLD_READY.md (the clip's notes folder).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { hash } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { CREAM, Figure, ORANGE, STAND, Spaniard as TexSpaniard, SPANIARDS, SPANIARD_STAND, figureAnchors, figureRig, lerpFig, type ArmPose, type FigPose, type Ink, type Spec } from "../kits/maps/texcocoFigures";
import { SPECS as TEX_SPECS } from "../kits/maps/texcocoFigures";
import { WALK, idle, poseTrack, walkPose } from "../kits/maps/texcocoShared";
import { CAST_SPECS, Commoner as CapCommoner, POSES as CAP_POSES, mirrorPose } from "../sheppard-capture-not-kill/captureFigures";
import { ACCENT, ACCENT_DEEP, ContactShadow, DARK, DEAD, Germs, GroundLine, INK, LAND, Page, WorldSvg, mixColor, type Cam, type P2 } from "./firstFarmersShared";

export { CREAM, ORANGE, STAND, WALK, idle, lerpFig, mirrorPose, poseTrack, walkPose };
export type { ArmPose, FigPose, Ink };

// ---------------------------------------------------------------------------
// the engraver's helpers (as texcocoFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
const ln = (w = 1.2, a = 0.8) => ({ fill: "none", stroke: DARK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
type Seg = [P2, P2];
type Map = (p: P2) => P2;
const ID: Map = (p) => p;
const clamp1 = (v: number) => Math.max(-1, Math.min(1, v));
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const segD = (segs: Seg[], m: Map = ID) =>
  segs
    .map(([a, b]) => {
      const p = m(a);
      const q = m(b);
      return Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) < 0.8 ? "" : `M${P(p)}L${P(q)}`;
    })
    .join("");
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
const quad = (a: P2, c: P2, b: P2, t: number): P2 => mix2(mix2(a, c, t), mix2(c, b, t), t);
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
  const seen = (x: number) => {
    const ph = Math.asin(clamp1(x / A));
    return ph < term - 0.3 && ph > term - Math.PI + 0.3;
  };
  const side: Map = (p) => [p[0] * wf, p[1]];
  return { c, s, wf, mF, side, seen };
};
// the head's outlines (texcocoFigures'), to cut the rig's head out of a Figure
const FACE_F: P2[] = [[0, -26], [8, -25], [14, -21], [18, -13], [19.5, -5], [19.5, 2], [19, 8], [18, 12], [16.5, 16], [14.5, 19.5], [11, 23], [5, 26.5], [-5, 26.5], [-11, 23], [-16.5, 16], [-19, 8], [-19.5, -2], [-18, -13], [-14, -21], [-8, -25]];
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];
const HAIR_F: P2[] = [[-20, 32], [-25.5, 22], [-27, 5], [-24, -14], [-17, -27], [0, -31], [17, -27], [24, -14], [27, 5], [25.5, 22], [20, 32], [13, 31], [16, 14], [17.5, 0], [16, -9], [8, -13.5], [0, -12.4], [-8, -13.5], [-16, -9], [-17.5, 0], [-16, 14], [-13, 31]];
const HAIR_P: P2[] = [[-24, 29], [-28, 18], [-29, 2], [-27, -14], [-19, -26], [-3, -31], [9, -29.5], [16, -24.5], [18.6, -19], [18.8, -16.5], [18.2, -14.5], [16.5, -13.4], [14, -13], [11, -12.6], [8, -12], [4.5, -10.5], [1, -7], [-2, 0], [-4, 8], [-6, 16], [-9, 24], [-13, 30]];
const hairPts = (kind: Spec["hair"], yaw: number) => {
  const drop = kind === "long" ? 10 : kind === "topknot" ? -5 : kind === "cropped" ? -15 : 0;
  const f = HAIR_F.map((p, i): P2 => ([0, 10, 11, 21].includes(i) ? [p[0], p[1] + drop] : [1, 9].includes(i) ? [p[0], p[1] + drop * 0.6] : p));
  const pr = HAIR_P.map((p, i): P2 => ([0, 21].includes(i) ? [p[0], p[1] + drop] : [1, 20].includes(i) ? [p[0], p[1] + drop * 0.55] : p));
  return blendYaw(f, pr, yaw);
};
// texcocoFigures' beard outline (head-local), cut shorter or fuller per man
const BEARD_F: P2[] = [[-19, 4], [-18, 15], [-13, 26], [-5, 33.5], [0, 35], [5, 33.5], [13, 26], [18, 15], [19, 4], [14, 10], [8, 17.8], [0, 19.6], [-8, 17.8], [-14, 10]];
const BEARD_P: P2[] = [[-8, 3], [-9, 14], [-5, 24], [4, 31], [12, 36], [17, 34.5], [20.5, 29], [21, 23], [20, 19.6], [18, 19.6], [15, 20], [12, 19], [6, 14], [-1, 7]];

// ---------------------------------------------------------------------------
// INKS: the dead tone, and a mix between two inks
// ---------------------------------------------------------------------------
const hexRgb = (h: string) => {
  const m = h.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const r = h.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return r ? [1, 2, 3].map((i) => Number(r[i])) : [0, 0, 0];
};
const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = c01(t);
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};
/** an ink between two inks (cream -> dead as a forager sickens) */
export const mixInk = (a: Ink, b: Ink, t: number): Ink => ({ main: mixHex(a.main, b.main, t), deep: mixHex(a.deep, b.deep, t), hair: mixHex(a.hair, b.hair, t) });
/** the fallen tone: lifeless umber-cream (main = DEAD #8A7B62) */
export const DEAD_INK: Ink = { main: DEAD, deep: "#786A53", hair: "#5C5141" };
/** the cream inks sunk toward the page (a figure further back); outlines stay dark */
export const shadeInk = (ink: Ink, t: number): Ink => ({ main: mixHex(LAND, ink.main, t), deep: mixHex(LAND, ink.deep, t), hair: mixHex(LAND, ink.hair, t) });

// ---------------------------------------------------------------------------
// THE BUILDS (texcocoFigures' Spec; use these with figureRig / figureAnchors)
// ---------------------------------------------------------------------------
export type FarmKind = "farmer" | "forager";
const MAN: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };
const WOMAN: Spec = { ...MAN, a: 50, hw: 39, H: 88, hipY: -148, limb: 0.92, headScale: 1.05, hair: "jaw", arm: [55, 52], leg: [68, 66] };
/** a child: a bigger head on a short body (about 0.75 of a man's height at the same scale) */
const CHILD: Spec = { ...MAN, a: 40, hw: 31, H: 66, hipY: -104, limb: 0.78, headScale: 1.2, arm: [40, 38], leg: [48, 46] };
/** how much a child's poses are shrunk (wrist and foot targets, crouch) */
export const CHILD_F = 0.69;
export const specOf = (kind: FarmKind, woman = false, child = false): Spec => {
  const base = child ? CHILD : woman ? WOMAN : MAN;
  const hair: Spec["hair"] = kind === "farmer" ? (woman ? "jaw" : "cropped") : "long";
  return { ...base, hair: child && kind === "farmer" ? "jaw" : hair, a: base.a + (kind === "forager" ? 3 : 0) };
};
/** a man from the soles to the top of the skull, units */
export const MAN_UNITS = 310;
/** px per unit for a man `px` tall (pass screen px / camera k for world px) */
export const scaleForPx = (px: number) => px / MAN_UNITS;
const scaleArm = (a: ArmPose, f: number): ArmPose => ({ ...a, w: mul(a.w, f) });
/** an adult pose shrunk to a child's reach (the cast does this for you when child={true}) */
export const childPose = (q: FigPose, f = CHILD_F): FigPose => ({ ...q, crouch: q.crouch * f, armL: scaleArm(q.armL, f), armR: scaleArm(q.armR, f), footL: mul(q.footL, f), footR: mul(q.footR, f) });

// ---------------------------------------------------------------------------
// TOOLS AND GEAR, drawn in their own frame: the grip at (0, 0), the tool's axis
// up (- y), its working side forward (+ x). Units = figure units (x scale).
// ---------------------------------------------------------------------------
export type ToolKind = "sickle" | "hoe" | "spear" | "bow" | "sheaf";
/** the butt of each tool below its grip, units (the spear's butt reaches the ground from a hand at ~150) */
export const TOOL_GRIP: Record<ToolKind, number> = { sickle: 16, hoe: 64, spear: 150, bow: 0, sheaf: 0 };

const SickleArt: React.FC<{ ink: Ink }> = ({ ink }) => {
  // a wooden haft: a straight handle, then a curve sweeping forward; flint teeth set along its inner edge
  const A: P2 = [0, -26];
  const C: P2 = [6, -74];
  const B: P2 = [52, -86];
  const haft: St[] = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t, i): St => [quad(A, C, B, t), [8.4, 8.2, 7.8, 7.2, 6.4, 5.2][i]]);
  const teeth = [0.12, 0.27, 0.42, 0.57, 0.72, 0.86].map((t, i) => {
    const p = quad(A, C, B, t);
    const p2 = quad(A, C, B, t + 0.13);
    const u = norm(sub(p2, p));
    const n: P2 = [u[1], -u[0]]; // the inner (concave) side: down and forward
    const nn: P2 = n[0] + n[1] < 0 ? [-n[0], -n[1]] : n;
    const o = 3.4;
    const h = 7 + 1.6 * hash(i, 501);
    const q0 = add(p, mul(nn, o));
    const q1 = add(p2, mul(nn, o));
    return `M${P(q0)}L${P(add(mix2(q0, q1, 0.2), mul(nn, h)))}L${P(add(mix2(q0, q1, 0.75), mul(nn, h * 0.85)))}L${P(q1)}Z`;
  });
  return (
    <g>
      {teeth.map((d, i) => (
        <path key={i} d={d} fill={ink.hair} {...OUT} strokeWidth={1.6} />
      ))}
      <path d={teeth.map((d) => d.replace(/Z$/, "")).join("")} {...ln(0.8, 0.5)} />
      <path d={limbD([[[0, 16], 9.6], [[0, 4], 8.2], [[0, -14], 8.4], [A, 8.4]])} fill={ink.deep} {...OUT} />
      <path d={limbD(haft)} fill={ink.main} {...OUT} />
      <path d={`M${P(quad(A, C, B, 0.08))}Q${P(add(C, [-2.4, 0]))} ${P(quad(A, C, B, 0.9))}`} {...ln(0.9, 0.5)} />
      <path d="M-4,8h8M-4,2h8M-4,-4h8" {...ln(0.9, 0.55)} />
    </g>
  );
};
const HoeArt: React.FC<{ ink: Ink }> = ({ ink }) => {
  // a straight ash haft; a polished stone blade lashed across its head, the edge forward and down
  const top = -150;
  const BLADE = `M-2,${top - 6}L34,${top - 2}Q46,${top + 6} 44,${top + 22}L38,${top + 26}Q20,${top + 12} -2,${top + 9}Z`;
  return (
    <g>
      <path d={limbD([[[0, 64], 7.2], [[0, 0], 7.8], [[0, top + 4], 8.2], [[0, top - 12], 8.4]])} fill={ink.deep} {...OUT} />
      <path d={`M-1.6,52L-1.6,${top + 8}`} {...ln(0.8, 0.45)} />
      <clipPath id="hoe-bl">
        <path d={BLADE} />
      </clipPath>
      <path d={BLADE} fill={ink.main} {...OUT} />
      <path d={hatchD(4, top - 8, 48, top + 30, 112, 2.6, 511, 0.1)} {...ln(0.85, 0.5)} clipPath="url(#hoe-bl)" />
      <path d={`M36,${top + 1}Q43,${top + 9} 41,${top + 22}`} {...ln(1, 0.6)} />
      {/* the lashing */}
      <path d={[-1, 0, 1, 2].map((j) => `M-5,${top - 4 + j * 4.4}L6,${top - 1 + j * 4.4}`).join("")} {...ln(1.5, 0.85)} />
    </g>
  );
};
const SpearArt: React.FC<{ ink: Ink }> = ({ ink }) => {
  const tip = -238;
  const POINT = `M0,${tip - 46}Q9,${tip - 26} 8,${tip - 8}Q5,${tip + 2} 0,${tip + 6}Q-5,${tip + 2} -8,${tip - 8}Q-9,${tip - 26} 0,${tip - 46}Z`;
  return (
    <g>
      <path d={limbD([[[0, 150], 5.2], [[0, 0], 6], [[0, tip], 5.6]])} fill={ink.deep} {...OUT} />
      <path d={`M-1.3,140L-1.3,${tip + 10}`} {...ln(0.75, 0.4)} />
      <clipPath id="spear-pt">
        <path d={POINT} />
      </clipPath>
      <path d={POINT} fill={ink.main} {...OUT} />
      {/* the flint's flaking: short facets along both edges, a midrib */}
      <g clipPath="url(#spear-pt)">
        <path d={Array.from({ length: 6 }, (_, j) => `M${(-9).toFixed(1)},${(tip - 38 + j * 7).toFixed(1)}l6,3.6M9,${(tip - 36 + j * 7).toFixed(1)}l-6,3.6`).join("")} {...ln(0.9, 0.55)} />
      </g>
      <path d={`M0,${tip - 42}L0,${tip + 2}`} {...ln(0.9, 0.55)} />
      <path d={[0, 1, 2, 3].map((j) => `M-5,${tip + 8 + j * 4}L5,${tip + 10 + j * 4}`).join("")} {...ln(1.4, 0.85)} />
    </g>
  );
};
/** a long self bow, the grip at (0, 0), its limbs up and down; the string behind (- x) */
const BowArt: React.FC<{ ink: Ink; draw?: number }> = ({ ink, draw = 0 }) => {
  const H = 150;
  const bend = 22 + 18 * draw;
  const A: P2 = [-bend * 0.15, -H];
  const B: P2 = [-bend * 0.15, H];
  const st: St[] = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1].map((u, i): St => [[bend * (1 - u * u) - bend * 0.15, u * H], [3.4, 5, 6.2, 7.6, 6.2, 5, 3.4][i]]);
  const nock: P2 = [-bend * 0.15 - 30 * draw, 0];
  return (
    <g>
      <path d={`M${P(A)}L${P(nock)}L${P(B)}`} fill="none" stroke={DARK} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${P(A)}L${P(nock)}L${P(B)}`} fill="none" stroke={ink.main} strokeWidth={1.2} strokeLinecap="round" />
      <path d={limbD(st)} fill={ink.deep} {...OUT} strokeWidth={2} />
      <path d={limbD([[[bend - bend * 0.15, -12], 9.6], [[bend - bend * 0.15, 12], 9.6]])} fill={ink.main} {...OUT} strokeWidth={1.8} />
    </g>
  );
};
/** a sheaf of ripe wheat: stalks bound at the middle, the ears fanned at the top (orange: farmers' grain) */
const SheafArt: React.FC<{ ink: Ink; seed?: number }> = ({ ink, seed = 0 }) => {
  const n = 13;
  const stalks = Array.from({ length: n }, (_, i) => {
    const u = (i / (n - 1)) * 2 - 1;
    const top: P2 = [u * 30 + (hash(i, 520 + seed) - 0.5) * 6, -96 - 10 * (1 - u * u) - 6 * hash(i, 521 + seed)];
    const bot: P2 = [u * 14, 40 + 4 * hash(i, 522 + seed)];
    const mid: P2 = [u * 5, 0];
    return { top, mid, bot, u, i };
  });
  const stems = stalks.map((s) => `M${P(s.bot)}Q${P(s.mid)} ${P(mix2(s.mid, s.top, 0.82))}`).join("");
  return (
    <g>
      <path d={stems} fill="none" stroke={DARK} strokeWidth={4.6} strokeLinecap="round" />
      <path d={stems} fill="none" stroke={ink.deep} strokeWidth={2.2} strokeLinecap="round" />
      {stalks.map((s) => {
        const d = norm(sub(s.top, mix2(s.mid, s.top, 0.6)));
        const base = mix2(s.mid, s.top, 0.8);
        const tipP = add(s.top, mul(d, 6));
        const nn: P2 = [-d[1], d[0]];
        const ear = limbD([[base, 5], [mix2(base, tipP, 0.5), 8], [tipP, 4]]);
        const awns = [-1, 0, 1].map((j) => `M${P(add(mix2(base, tipP, 0.75), mul(nn, j * 2.4)))}l${P(add(mul(d, 15), mul(nn, j * 4)))}`).join("");
        return (
          <g key={s.i}>
            <path d={awns} fill="none" stroke={DARK} strokeWidth={1.1} strokeOpacity={0.75} strokeLinecap="round" />
            <path d={ear} fill={ink.main} {...OUT} strokeWidth={1.6} />
            <path d={[0.25, 0.5, 0.75].map((t) => `M${P(add(mix2(base, tipP, t), mul(nn, -3)))}l${P(add(mul(nn, 6), mul(d, 2.4)))}`).join("")} {...ln(0.8, 0.6)} />
          </g>
        );
      })}
      {/* the band */}
      <path d={limbD([[[-13, -2], 6], [[0, 1], 6.4], [[13, -2], 6]])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
      <path d="M-9,-1.4L-6,2.4M-1,-0.6L2,3M6,-1.4L9,2.2" {...ln(0.9, 0.6)} />
    </g>
  );
};
/** the quiver of the forager: hide, the fletchings of three arrows over the shoulder */
const QuiverArt: React.FC<{ ink: Ink; a: P2; b: P2 }> = ({ ink, a, b }) => {
  const u = norm(sub(b, a));
  const nn: P2 = [-u[1], u[0]];
  return (
    <g>
      {[-1, 0, 1].map((j) => {
        const s = add(b, mul(nn, j * 4.6));
        const e = add(s, mul(rot(u, j * 9), 28 + 4 * hash(j + 2, 81)));
        return (
          <g key={j}>
            <path d={`M${P(s)}L${P(e)}`} stroke={DARK} strokeWidth={4.2} strokeLinecap="round" />
            <path d={`M${P(s)}L${P(e)}`} stroke={ink.main} strokeWidth={1.9} strokeLinecap="round" />
            <path d={limbD([[mix2(s, e, 0.5), 2.4], [mix2(s, e, 0.72), 8.4], [e, 5.4]])} fill={ink.main} {...OUT} strokeWidth={1.6} />
          </g>
        );
      })}
      <path d={limbD([[a, 13], [mix2(a, b, 0.5), 15.5], [b, 16.5]])} fill={ink.deep} {...OUT} />
      <path d={`M${P(add(b, mul(nn, -8)))}L${P(add(b, mul(nn, 8)))}M${P(add(mix2(a, b, 0.3), mul(nn, -7)))}L${P(add(mix2(a, b, 0.3), mul(nn, 7)))}`} {...ln(1.3, 0.75)} />
      <path d={segD(subdivide([[mix2(a, b, 0.4), mix2(a, b, 0.9)]], 4).filter((_, i) => i % 2 === 0).map(([p, q]) => [add(p, mul(nn, 3)), add(q, mul(nn, 3))] as Seg))} {...ln(0.9, 0.5)} />
    </g>
  );
};
const ToolArt: React.FC<{ kind: ToolKind; ink: Ink; draw?: number }> = ({ kind, ink, draw }) =>
  kind === "sickle" ? <SickleArt ink={ink} /> : kind === "hoe" ? <HoeArt ink={ink} /> : kind === "spear" ? <SpearArt ink={ink} /> : kind === "bow" ? <BowArt ink={ink} draw={draw} /> : <SheafArt ink={ink} />;

type ToolProps = { at: P2; scale: number; angle?: number; dir?: 1 | -1; tone?: number; ink?: Ink; uid?: string };
const toolDefaultInk: Record<ToolKind, Ink> = { sickle: ORANGE, hoe: ORANGE, spear: CREAM, bow: CREAM, sheaf: ORANGE };
const FreeTool: React.FC<ToolProps & { kind: ToolKind }> = ({ kind, at, scale, angle = 0, dir = 1, tone = 1, ink, uid = kind }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${(scale * dir).toFixed(4)} ${scale.toFixed(4)})`} opacity={tone}>
    <Cased id={`${uid}-case`} r={1.3}>
      <ToolArt kind={kind} ink={ink ?? toolDefaultInk[kind]} />
    </Cased>
  </g>
);
/** the flint sickle as a free object: at = the grip, angle deg (0 = haft up, + clockwise), dir -1 mirrors */
export const Sickle: React.FC<ToolProps> = (p) => <FreeTool kind="sickle" {...p} />;
/** the stone hoe: at = the grip (64 units above the butt) */
export const Hoe: React.FC<ToolProps> = (p) => <FreeTool kind="hoe" {...p} />;
/** the spear: at = the grip (150 units above the butt); lying on the ground: angle 90 */
export const Spear: React.FC<ToolProps> = (p) => <FreeTool kind="spear" {...p} />;
/** the bow: at = its grip (the middle) */
export const Bow: React.FC<ToolProps> = (p) => <FreeTool kind="bow" {...p} />;
/** a sheaf of wheat: at = the band; standing on the ground its foot is 44 units below the band */
export const Sheaf: React.FC<ToolProps> = (p) => <FreeTool kind="sheaf" {...p} />;

// ---------------------------------------------------------------------------
// WHAT HE CARRIES, from the rig (figure-local units)
// ---------------------------------------------------------------------------
type ArmSide = "L" | "R";
/** the near arm (toward us) for a pose: facing right it is L */
const nearOf = (q: FigPose): ArmSide => (Math.sin(q.yaw) >= 0 ? "L" : "R");
const toolFrame = (sp: Spec, q: FigPose, arm: ArmSide) => {
  const r = figureRig(sp, q);
  const ar = arm === "L" ? r.armL : r.armR;
  const G = r.s >= 0 ? 1 : -1;
  const v = rot(ar.dir, -90 * G);
  const grip = add(ar.W, mul(ar.dir, 9 * sp.limb));
  return { r, G, grip, axis: v, angle: (Math.atan2(v[0], -v[1]) * 180) / Math.PI };
};
/** set an arm's hand angle so the tool in that fist points at `deg` (0 = straight up, + clockwise, mirrored when facing left) */
export const aimTool = (q: FigPose, deg: number, arm: "near" | "far" = "near", kind: FarmKind = "farmer", woman = false, child = false): FigPose => {
  const sp = specOf(kind, woman, child);
  const side: ArmSide = arm === "near" ? nearOf(q) : nearOf(q) === "L" ? "R" : "L";
  const zero = side === "L" ? { ...q, armL: { ...q.armL, hand: 0 } } : { ...q, armR: { ...q.armR, hand: 0 } };
  const f = toolFrame(sp, child ? childPose(zero) : zero, side);
  const want = f.G * deg;
  let dh = want - f.angle;
  dh = ((((dh + 180) % 360) + 360) % 360) - 180;
  return side === "L" ? { ...q, armL: { ...q.armL, hand: dh } } : { ...q, armR: { ...q.armR, hand: dh } };
};

// ---------------------------------------------------------------------------
// THE FALL: the sicken-and-fall track (see the header)
// ---------------------------------------------------------------------------
export const FALL = {
  /** frames for p 0 -> 1 at 29.97 fps */
  frames: 36,
  /** p at which he first touches the ground with his hands / lies flat */
  kneel: 0.55,
  lands: 0.92,
};
const YAW = 0.95;
const F_STOOP: FigPose = {
  ...STAND,
  yaw: YAW,
  headYaw: YAW + 0.12,
  lean: 22,
  pitch: 22,
  roll: 5,
  crouch: 16,
  armL: { w: [30, -184], elbow: [-0.7, 1], fist: 0.6, hand: 20 },
  armR: { w: [40, -150], elbow: [-0.4, 1], fist: 0.3, hand: 0 },
  footL: [-10, 0],
  footR: [18, 0],
  brow: -0.7,
  lids: 0.45,
  mouth: -0.8,
};
const F_KNEES: FigPose = {
  ...F_STOOP,
  lean: 40,
  pitch: 26,
  roll: 7,
  crouch: 70,
  armL: { w: [60, -96], elbow: [-0.5, 1], fist: 0.2, hand: 10 },
  armR: { w: [74, -78], elbow: [-0.4, 1], fist: 0.1, hand: 10 },
  footL: [-30, -4],
  footR: [26, 0],
  liftL: 48,
  lids: 0.75,
  mouth: -0.6,
};
const F_LIE: FigPose = {
  ...STAND,
  yaw: YAW,
  headYaw: YAW + 0.05,
  lean: -4,
  pitch: 4,
  roll: -6,
  crouch: 0,
  armL: { w: [30, -306], elbow: [-0.9, -0.2], fist: 0, hand: 24 },
  armR: { w: [-4, -166], elbow: [-0.6, 1], fist: 0.1, hand: 0 },
  footL: [-5, 0],
  footR: [7, 0],
  liftL: 0,
  liftR: 0,
  brow: 0,
  lids: 1,
  mouth: -0.3,
};
const fallKeys = (base: FigPose, dir: 1 | -1): [number, FigPose][] => {
  const m = (q: FigPose) => (dir === 1 ? q : mirrorPose(q));
  return [
    [0, base],
    [30, m(F_STOOP)],
    [55, m(F_KNEES)],
    [93, m(F_LIE)],
    [100, m(F_LIE)],
  ];
};
/** the pose at fall progress p (0..1) from `base`; dir: the way he falls (default: the way base faces, right if frontal) */
export const fallPose = (base: FigPose, p: number, dir?: 1 | -1): FigPose => {
  const d = dir ?? (base.yaw < -0.05 ? -1 : 1);
  if (p <= 0) return base;
  return poseTrack(fallKeys(base, d))(c01(p) * 100);
};
/** the topple angle (deg, about the feet; + = falling to screen right) at progress p */
export const fallAngle = (p: number, dir: 1 | -1 = 1) => {
  const u = c01((p - 0.5) / (FALL.lands - 0.5));
  return dir * 90 * Math.pow(u, 2.1);
};
/** how far the ink has drained to DEAD at progress p */
export const drainOf = (p: number) => sstep((p - 0.08) / 0.77);
/** where a lying body's joints are, so a toppled figure rests ON the ground: the lift (world px) that keeps them out of it */
const groundLift = (sp: Spec, q: FigPose, angle: number) => {
  const r = figureRig(sp, q);
  const pts: [P2, number][] = [
    [r.legL.A, 4],
    [r.legR.A, 4],
    [r.legL.K, 10 * sp.limb],
    [r.legR.K, 10 * sp.limb],
    [r.hip, 22],
    [r.toFig([0, r.shY * 0.55]), 26],
    [r.armL.S, 14],
    [r.armR.S, 14],
    [r.headC, 27 * sp.headScale],
    [r.armL.W, 8],
    [r.armR.W, 8],
    [r.armL.grip, 7],
    [r.armR.grip, 7],
  ];
  let low = 0;
  for (const [p, rad] of pts) {
    const rp = rot(p, angle);
    low = Math.max(low, rp[1] + rad);
  }
  // standing, the ankles sit 15 above the soles (radius 4 + ... ) so subtract the standing baseline
  return Math.max(0, low - 11);
};
export type FallInfo = { pose: FigPose; angle: number; lift: number; drain: number; dir: 1 | -1 };
/** everything the fall does at progress p, for a body of spec sp (lift in figure units) */
export const fallInfo = (sp: Spec, base: FigPose, p: number, dir?: 1 | -1, map: (q: FigPose) => FigPose = (q) => q): FallInfo => {
  const d: 1 | -1 = dir ?? (base.yaw < -0.05 ? -1 : 1);
  const pose = map(fallPose(base, p, d));
  const angle = fallAngle(p, d);
  return { pose, angle, lift: p > 0 ? groundLift(sp, pose, angle) : 0, drain: drainOf(p), dir: d };
};
/** the transform that topples a figure standing at `at` (scale px per unit) */
const fallTf = (at: P2, scale: number, f: FallInfo) => `translate(${at[0].toFixed(2)} ${(at[1] - f.lift * scale).toFixed(2)}) rotate(${f.angle.toFixed(3)}) translate(${(-at[0]).toFixed(2)} ${(-at[1]).toFixed(2)})`;

/** any rig-built figure made to sicken and fall: give its spec, the pose it falls from, p, and render it from the
 *  pose and ink handed to you. The contact shadow thins as he goes down. */
export const Sickening: React.FC<{
  spec: Spec;
  pose: FigPose;
  p: number;
  at: P2;
  scale: number;
  ink: Ink;
  dir?: 1 | -1;
  shadow?: boolean;
  /** applied to every pose of the track before the rig sees it (a child's childPose) */
  mapPose?: (q: FigPose) => FigPose;
  children: (pose: FigPose, ink: Ink) => React.ReactNode;
}> = ({ spec, pose, p, at, scale, ink, dir, shadow = true, mapPose, children }) => {
  const f = fallInfo(spec, pose, p, dir, mapPose);
  const inkNow = f.drain > 0 ? mixInk(ink, DEAD_INK, f.drain) : ink;
  const sh = 1 - sstep((p - 0.45) / 0.4);
  return (
    <g>
      {shadow ? <ContactShadow x={at[0] + 4 * f.dir * scale * c01(p * 3)} y={at[1]} halfW={58 * scale} amount={sh * 0.9} /> : null}
      {p > 0.6 ? (
        // the lying body's own shadow along the ground
        <ellipse cx={at[0] + f.dir * 150 * scale} cy={at[1] + 1} rx={175 * scale} ry={12 * scale} fill={DARK} fillOpacity={0.3 * sstep((p - 0.6) / 0.32)} />
      ) : null}
      <g transform={p > 0 ? fallTf(at, scale, f) : undefined}>{children(f.pose, inkNow)}</g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FIGURE
// ---------------------------------------------------------------------------
export type FarmFigureProps = {
  kind: FarmKind;
  pose: FigPose;
  /** feet, world px, and px per unit (a man is ~310 units: 400 px tall = scale 1.29) */
  at: P2;
  scale: number;
  uid: string;
  woman?: boolean;
  child?: boolean;
  /** default: farmer ORANGE, forager CREAM */
  ink?: Ink;
  tone?: number;
  /** what the near fist holds (default: farmer man "sickle", farmer woman "none", forager man "spear", forager woman "none") */
  hold?: ToolKind | "none";
  /** what the far fist holds (default none; e.g. "sheaf" while the near holds a sickle) */
  holdFar?: ToolKind | "none";
  /** the bow and quiver on his back (default: forager man) */
  quiver?: boolean;
  /** 0..1 the sicken-and-fall track from `pose` (see the header) */
  fall?: number;
  fallDir?: 1 | -1;
  /** the soft contact shadow at his feet (default true) */
  shadow?: boolean;
  /** small differences between people in a crowd (beard, the hair's fall) */
  seed?: number;
};

const defaultHold = (kind: FarmKind, woman = false, child = false): ToolKind | "none" => (child || woman ? "none" : kind === "farmer" ? "sickle" : "spear");
/** a tool let go of at fall progress REL: it falls on its own, butt to the ground, and lies there */
const RELEASE = 0.42;
const DroppedTool: React.FC<{ kind: ToolKind; arm: ArmSide; sp: Spec; base: FigPose; p: number; at: P2; scale: number; ink: Ink; dir?: 1 | -1; map?: (q: FigPose) => FigPose; uid: string }> = ({ kind, arm, sp, base, p, at, scale, ink, dir, map, uid }) => {
  const fr = fallInfo(sp, base, RELEASE, dir, map);
  const tfr = toolFrame(sp, fr.pose, arm);
  const g0 = rot(mul(tfr.grip, scale), fr.angle);
  const grip0: P2 = [at[0] + g0[0], at[1] + g0[1] - fr.lift * scale];
  const a0 = tfr.angle + fr.angle;
  const rad0 = (a0 * Math.PI) / 180;
  const TG = TOOL_GRIP[kind] * scale;
  const butt0: P2 = [grip0[0] - Math.sin(rad0) * TG, grip0[1] + Math.cos(rad0) * TG];
  const t = c01((p - RELEASE) / 0.3);
  const e = t * t;
  const target = 90 * tfr.G;
  const a = mix(a0, target, e);
  const rad = (a * Math.PI) / 180;
  const butt: P2 = [butt0[0], mix(butt0[1], at[1] - 5 * scale, e)];
  const grip: P2 = [butt[0] + Math.sin(rad) * TG, butt[1] - Math.cos(rad) * TG];
  const inkNow = mixInk(ink, DEAD_INK, drainOf(p) * 0.5);
  return (
    <g transform={`translate(${P(grip)}) rotate(${a.toFixed(2)}) scale(${(scale * tfr.G).toFixed(4)} ${scale.toFixed(4)})`}>
      <Cased id={`${uid}-drop`} r={1.3}>
        <ToolArt kind={kind} ink={inkNow} />
      </Cased>
    </g>
  );
};
const FarmBody: React.FC<Omit<FarmFigureProps, "fall" | "fallDir" | "shadow"> & { ink: Ink; prescaled?: boolean } & TurnSafeOpts> = ({ kind, pose: q0, at, scale, uid, woman = false, child = false, ink, tone = 1, hold: holdIn, holdFar = "none", quiver: quiverIn, seed = 0, prescaled = false, turnSafe = false, frontArms, holdSide, holdFarSide }) => {
  const sp = specOf(kind, woman, child);
  const q = child && !prescaled ? childPose(q0) : q0;
  const farmer = kind === "farmer";
  const hold = holdIn ?? defaultHold(kind, woman, child);
  const quiver = quiverIn ?? (!farmer && !woman && !child);
  const r = figureRig(sp, q);
  const { c, s } = r;
  const k = sp.limb;
  const hw = sp.hw;
  const shY = r.shY;
  const sfT = surface(q.yaw, hw * 0.94, hw * 0.94 * 0.58);
  const sfH = surface(q.yaw, 31 * (hw / 45), 31 * (hw / 45) * 0.6);
  const { side } = sfT;
  const mT = sfT.mF;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const hipTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)})`;
  const torsoTf = `${hipTf} rotate(${q.lean.toFixed(2)})`;
  const headTf = `translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${sp.headScale})`;
  const shL: P2 = [-hw, shY];
  const shR: P2 = [hw, shY];
  const neck: P2 = [0, shY];
  const G = s >= 0 ? 1 : -1;
  const profile = Math.abs(s) > 0.5;
  // turn-safe (TURN addition): the far arm stays behind the body for ANY turned yaw, so its draw order only changes
  // at yaw 0, where both arms hang beside the torso (the legacy cast switches at |sin yaw| = 0.5: the arm pops)
  const farBack = turnSafe ? Math.abs(s) > 1e-3 : profile;
  const farArm: ArmSide = s >= 0 ? "R" : "L";
  const nearArm: ArmSide = farArm === "L" ? "R" : "L";
  const sway = q.hem * 0.6;
  const leg0 = sp.leg[0];

  // ---- the rig's own legs, arms and head, cut out of texcocoFigures' Figure --------
  const legSpec: Spec = { ...sp, hem: shY + 42, cloak: "fret" };
  const headSpec: Spec = { ...sp, hw: 900, a: 900, hem: 0, cloak: "fret" };
  const nod = Math.max(0, r.nodF);
  const faceClip = smoothClosed(blendYaw(FACE_F, FACE_P, q.headYaw).map((p): P2 => [p[0] * 1.08, p[1] * 1.07 + 5 * nod]));
  const hairClip = smoothClosed(hairPts(sp.hair, q.headYaw).map((p): P2 => [p[0] * 1.07, p[1] * 1.06]));
  const NECK = limbD([[add(r.neck, [0, 5]), 21 * k * (0.8 + 0.2 * sfT.wf)], [mix2(r.neck, add(r.headC, [-7 * r.hs * sp.headScale, 0]), 0.78), 16.5 * k]]);

  // ---- tools in the fists ---------------------------------------------------------
  const toolEl = (arm: ArmSide, kind2: ToolKind | "none") => {
    if (kind2 === "none") return null;
    const f = toolFrame(sp, q, arm);
    const grip = kind2 === "sheaf" ? add(f.grip, mul(f.axis, 6)) : f.grip;
    return (
      <g transform={`${tf} translate(${P(grip)}) rotate(${f.angle.toFixed(2)}) scale(${G} 1)`}>
        <Cased id={`${uid}-t${arm}`} r={1.3}>
          <ToolArt kind={kind2} ink={ink} />
        </Cased>
      </g>
    );
  };
  const nearTool = hold;
  const farTool = holdFar;
  const armEl = (w: ArmSide) => <Figure spec={sp} pose={q} at={at} scale={scale} uid={`${uid}-a${w}`} body={false} arms={w} ink={ink} />;
  // the farmers' short sleeves, over the rig's upper arm
  const sleeveEl = (w: ArmSide) => {
    if (!farmer) return null;
    const ar = w === "L" ? r.armL : r.armR;
    const u = norm(sub(ar.E, ar.S));
    const n: P2 = [-u[1], u[0]];
    const e = mix2(ar.S, ar.E, woman ? 0.62 : 0.5);
    return (
      <g transform={tf}>
        <Cased id={`${uid}-sl${w}`} r={1.2}>
          <path d={limbD([[mix2(ar.S, ar.E, 0.14), 23 * k], [mix2(ar.S, e, 0.6), 22.5 * k], [e, 22 * k]])} fill={ink.main} {...OUT} />
          <path d={`M${P(add(e, mul(n, -10.5 * k)))}L${P(add(e, mul(n, 10.5 * k)))}`} {...ln(1.3, 0.75)} />
          <path d={segD(subdivide([[add(ar.S, mul(n, 6 * k * ar.sgn)), add(e, mul(n, 9 * k * ar.sgn))]], 1))} {...ln(1, 0.55)} />
        </Cased>
      </g>
    );
  };
  // turn-safe with a fixed tool hand (holdSide / holdFarSide): each tool rides in its own arm's layer, just under its hand
  const nearToolArm: ArmSide = holdSide ?? nearArm;
  const farToolArm: ArmSide = holdFarSide ?? (holdSide ? (holdSide === "L" ? "R" : "L") : farArm);
  const withGearFixed = (w: ArmSide) => (
    <React.Fragment key={w}>
      {w === nearToolArm ? toolEl(w, nearTool) : null}
      {w === farToolArm ? toolEl(w, farTool) : null}
      {armEl(w)}
      {sleeveEl(w)}
    </React.Fragment>
  );
  const withGearLegacy = (w: ArmSide, far: boolean) => (
    <React.Fragment key={w}>
      {w === nearArm ? toolEl(w, nearTool) : null}
      {w === farArm && far ? toolEl(w, farTool) : null}
      {armEl(w)}
      {sleeveEl(w)}
      {w === farArm && !far ? toolEl(w, farTool) : null}
    </React.Fragment>
  );
  const withGear = (w: ArmSide, far: boolean) => (turnSafe && (holdSide || holdFarSide) ? withGearFixed(w) : withGearLegacy(w, far));

  // ---- the bare torso (forager) / the tunic's bodice (farmer); torso frame ------------
  const wst = woman ? 25 : 27;
  const TORSO =
    `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}` +
    `C${P(side([hw + 1, shY + 24]))} ${P(side([wst + 5, -54]))} ${P(side([wst, -30]))}C${P(side([wst, -16]))} ${P(side([29, -8]))} ${P(side([29, 4]))}L${P(side([27, 12]))}L${P(side([-27, 12]))}L${P(side([-29, 4]))}` +
    `C${P(side([-29, -8]))} ${P(side([-wst, -16]))} ${P(side([-wst, -30]))}C${P(side([-wst - 5, -54]))} ${P(side([-hw - 1, shY + 24]))} ${P(side(add(shL, [1, -4])))}Z`;
  const pec = (sd: number) => `M${P(mT([sd * 3, shY + 35]))}Q${P(mT([sd * 20, shY + 43]))} ${P(mT([sd * (hw - 9), shY + 27]))}`;
  const collar = (sd: number) => `M${P(mT([sd * 6, shY + 7]))}Q${P(mT([sd * 18, shY + 4]))} ${P(mT([sd * (hw - 10), shY + 5]))}`;
  const bareTorso = (
    <>
      <clipPath id={`${uid}-torso`}>
        <path d={TORSO} />
      </clipPath>
      <path d={TORSO} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-torso)`}>
        <path d={segD(hatchSegs(hw * 0.34, shY + 4, hw + 2, 12, 115, 2.7, 43), side)} {...ln(0.95, 0.6)} />
        <path d={segD(hatchSegs(hw * 0.52, shY + 30, hw + 2, 12, 60, 3.3, 44), side)} {...ln(0.9, 0.42)} />
        {woman ? null : <path d={pec(1) + pec(-1)} {...ln(1.3, 0.75)} />}
        <path d={collar(1) + collar(-1)} {...ln(1.1, 0.6)} />
        <path d={`M${P(mT([0, shY + 14]))}L${P(mT([0, shY + 36]))}M${P(mT([0, shY + 46]))}L${P(mT([0, -24]))}`} {...ln(1, 0.45)} />
      </g>
    </>
  );
  // the tunic: a bodice (torso frame) wider than the body, a neck slit, folds, hatched on the shaded side
  const tw = hw + 3;
  const BODICE =
    `M${P(side([-tw, shY + 1]))}Q${P(side([-22, shY - 7]))} ${P(side([-11, shY - 5]))}Q${P(mT([0, shY + 4]))} ${P(side([11, shY - 5]))}Q${P(side([22, shY - 7]))} ${P(side([tw, shY + 1]))}` +
    `C${P(side([tw + 2, shY + 22]))} ${P(side([wst + 8, -50]))} ${P(side([wst + 4, -24]))}L${P(side([wst + 6, 4]))}L${P(side([-wst - 6, 4]))}L${P(side([-wst - 4, -24]))}C${P(side([-wst - 8, -50]))} ${P(side([-tw - 2, shY + 22]))} ${P(side([-tw, shY + 1]))}Z`;
  const bodice = (
    <>
      <clipPath id={`${uid}-bod`}>
        <path d={BODICE} />
      </clipPath>
      <path d={BODICE} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-bod)`}>
        <path d={segD(hatchSegs(hw * 0.3, shY, hw + 8, 6, 112, 2.8, 61), side)} {...ln(0.95, 0.58)} />
        <path d={segD(hatchSegs(hw * 0.55, shY + 34, hw + 8, 6, 58, 3.4, 62), side)} {...ln(0.9, 0.42)} />
        {/* the neck slit and its tie; the folds gathered under the belt */}
        <path d={`M${P(mT([-10, shY - 3]))}Q${P(mT([0, shY + 8]))} ${P(mT([10, shY - 3]))}`} {...ln(1.3, 0.75)} />
        <path d={`M${P(mT([0, shY + 4]))}L${P(mT([0, shY + 24]))}`} {...ln(1.2, 0.7)} />
        <path d={[-16, -5, 6, 17].map((x, i) => `M${P(mT([x * 0.7, shY + 34 + 6 * hash(i, 63)]))}Q${P(mT([x * 0.9, -30]))} ${P(mT([x, -2]))}`).join("")} {...ln(1, 0.5)} />
        {woman ? <path d={`M${P(mT([-20, shY + 38]))}Q${P(mT([-10, shY + 46]))} ${P(mT([-2, shY + 40]))}M${P(mT([2, shY + 40]))}Q${P(mT([12, shY + 46]))} ${P(mT([21, shY + 38]))}`} {...ln(1.1, 0.55)} /> : null}
      </g>
    </>
  );

  // ---- below the belt (hip frame): the tunic's skirt (farmer) / the hide kilt or skirt (forager)
  const fx = sfH.mF([0, 0])[0];
  const stride = Math.abs(q.footL[0] - q.footR[0]);
  const skirtLen = farmer ? (woman ? leg0 * 1.62 : leg0 * 0.86) : woman ? leg0 * 0.95 : leg0 * 0.42;
  const hemW = (farmer ? (woman ? 44 : 41) : woman ? 40 : 35) + stride * 0.18;
  const skirtPts = (n: number, ragged: boolean): P2[] => {
    const out: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = mix(hemW, -hemW, u);
      let y = skirtLen + 4 * (1 - (2 * u - 1) ** 2);
      if (ragged) y += i % 2 === 0 ? 6 + 4 * hash(i, 71 + seed) : -3 * hash(i, 72 + seed);
      out.push(side([x + sway * 0.6, y]));
    }
    return out;
  };
  const SKIRT = `M${P(side([-32, -10]))}Q${P([fx * 0.4, -6])} ${P(side([32, -10]))}C${P(side([36, 10]))} ${P(side([hemW - 4 + sway * 0.3, skirtLen * 0.5]))} ${P(skirtPts(1, false)[0])}L${skirtPts(farmer ? 12 : 16, !farmer)
    .map(P)
    .join("L")}C${P(side([-hemW + 4 + sway * 0.3, skirtLen * 0.5]))} ${P(side([-36, 10]))} ${P(side([-32, -10]))}Z`;
  const skirtFolds = [-0.62, -0.25, 0.12, 0.48].map((u, i) => `M${P(side([u * 30, 2]))}Q${P(side([u * 36 + sway * 0.2, skirtLen * 0.55]))} ${P(side([u * hemW * 0.95 + sway * 0.55, skirtLen - 3 - 4 * hash(i, 74)]))}`).join("");
  const skirt = (
    <>
      <clipPath id={`${uid}-sk`}>
        <path d={SKIRT} />
      </clipPath>
      <path d={SKIRT} fill={farmer ? ink.main : ink.deep} {...OUT} />
      <g clipPath={`url(#${uid}-sk)`}>
        {farmer ? (
          <>
            <path d={segD(hatchSegs(8, -10, hemW + 6, skirtLen + 12, 108, 2.9, 75), side)} {...ln(0.95, 0.55)} />
            <path d={segD(hatchSegs(18, skirtLen * 0.4, hemW + 6, skirtLen + 12, 60, 3.5, 76), side)} {...ln(0.9, 0.4)} />
            <path d={skirtFolds} {...ln(1.25, 0.65)} />
            {/* a woven border at the hem */}
            <path d={`M${P(side([-hemW, skirtLen - 7]))}Q${P(side([0, skirtLen - 3]))} ${P(side([hemW, skirtLen - 7]))}`} {...ln(1.1, 0.6)} />
          </>
        ) : (
          <>
            {/* fur: short ragged strokes, denser on the shaded side */}
            <path d={segD(subdivide(hatchSegs(-hemW - 4, -6, hemW + 4, skirtLen + 12, 80, 3.6, 77, 0.1), 5).filter((_, i) => i % 2 === 0), side)} {...ln(1.05, 0.7)} />
            <path d={segD(hatchSegs(6, -10, hemW + 4, skirtLen + 12, 112, 2.8, 78), side)} {...ln(0.9, 0.5)} />
          </>
        )}
      </g>
      {/* the belt and its knot */}
      <path d={`M${P(side([-31.5, -12]))}Q${P([fx * 0.4, -7])} ${P(side([31.5, -12]))}L${P(side([32, -2]))}Q${P([fx * 0.4, 3])} ${P(side([-32, -2]))}Z`} fill={ink.deep} {...OUT} strokeWidth={2} />
      <path d={`M${P(side([-31, -7]))}Q${P([fx * 0.4, -2])} ${P(side([31, -7]))}`} {...ln(0.9, 0.55)} />
      {turnSafe || sfH.seen(10) || !profile ? (
        <>
          <path d={limbD([[[fx + 4 * c, -6], 4.2], [[fx + 6 * c + sway * 0.2, 8], 3.8], [[fx + 5 * c + sway * 0.4, 20], 2.6]])} fill={ink.deep} {...OUT} strokeWidth={1.6} />
          <circle cx={fx + 3 * c} cy={-7} r={3.6} fill={ink.main} {...OUT} strokeWidth={1.6} />
        </>
      ) : null}
    </>
  );

  // ---- the forager's hide cape: two panels from the shoulders, a fur ruff, a ragged hem ----
  const capeLen = woman ? leg0 * 0.62 : leg0 * 0.32; // below the hips (torso frame y)
  const capeW = hw + 12;
  const sfC = surface(q.yaw, capeW, capeW * 0.62);
  const cS = sfC.side;
  const cF = sfC.mF;
  const hdx = q.hem * 0.8;
  const swing = (p: P2): P2 => [p[0] + hdx * sstep((p[1] - shY - 20) / (capeLen - shY - 20)), p[1]];
  const panel = (sd: number) => {
    // sd -1 = screen-left panel (his right), 1 = screen-right panel
    const inner0: P2 = [sd * 9, shY + 6];
    const inner1: P2 = [sd * 15, capeLen - 4];
    const outer0: P2 = [sd * (hw + 4), shY + 4];
    const outer1: P2 = [sd * capeW, capeLen];
    const hem: P2[] = [];
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = mix(outer1[0], inner1[0], u);
      const y = mix(outer1[1], inner1[1], u) + (i % 2 === 0 ? 7 + 4 * hash(i, 90 + sd + seed) : -2);
      hem.push(swing(cF([x, y])));
    }
    const d =
      `M${P(cF(inner0))}Q${P(cS([sd * (hw - 4), shY - 10]))} ${P(cS(outer0))}` +
      `C${P(swing(cS([sd * (capeW + 2), shY + 40])))} ${P(swing(cS([sd * (capeW + 1), capeLen - 40])))} ${P(swing(cS(outer1)))}` +
      `L${hem.map(P).join("L")}` +
      `C${P(swing(cF([sd * 14, capeLen - 40])))} ${P(cF([sd * 11, shY + 40]))} ${P(cF(inner0))}Z`;
    return { d, sd, hem };
  };
  const panels = [panel(-1), panel(1)];
  const capeArt = (
    <>
      {panels.map((pn) => (
        <g key={pn.sd}>
          <clipPath id={`${uid}-cp${pn.sd}`}>
            <path d={pn.d} />
          </clipPath>
          <path d={pn.d} fill={ink.main} {...OUT} strokeWidth={2.4} />
          <g clipPath={`url(#${uid}-cp${pn.sd})`}>
            {/* the hide: a few seams, hatching on the shaded side, fur strokes at the hem */}
            <path d={segD(hatchSegs(capeW * 0.2, shY, capeW + 10, capeLen + 14, 110, 2.9, 91 + pn.sd), (p) => swing(cS(p)))} {...ln(0.95, 0.58)} />
            <path d={segD(hatchSegs(capeW * 0.5, shY + 50, capeW + 10, capeLen + 14, 62, 3.4, 93 + pn.sd), (p) => swing(cS(p)))} {...ln(0.9, 0.42)} />
            <path d={`M${P(cF([pn.sd * (hw * 0.55), shY + 14]))}Q${P(swing(cF([pn.sd * (hw * 0.62), (shY + capeLen) / 2])))} ${P(swing(cF([pn.sd * (hw * 0.7), capeLen - 6])))}`} {...ln(1.2, 0.65)} />
            <path d={segD(subdivide(hatchSegs(-capeW - 6, capeLen - 22, capeW + 6, capeLen + 14, 84, 3.2, 95 + pn.sd, 0.1), 3).filter((_, i) => i % 2 === 0), (p) => swing(cF(p)))} {...ln(1.05, 0.7)} />
          </g>
        </g>
      ))}
    </>
  );
  // the ruff: a shaggy roll of fur round the shoulders and the back of the neck
  const ruffPts = (() => {
    const out: P2[] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * 2 - 1;
      const x = u * (hw + 9);
      const y = shY - 6 + 8 * u * u;
      out.push(cS([x, y - 7 - (i % 2 === 0 ? 4 : 0)]));
    }
    for (let i = n; i >= 0; i--) {
      const u = (i / n) * 2 - 1;
      const x = u * (hw + 6);
      const y = shY + 16 + 6 * u * u - 6 * (1 - u * u);
      out.push(cF([x * 0.96, y + (i % 2 === 0 ? 7 : 1)]));
    }
    return out;
  })();
  const RUFF = `M${ruffPts.map(P).join("L")}Z`;
  const ruffArt = (
    <>
      <clipPath id={`${uid}-ruff`}>
        <path d={RUFF} />
      </clipPath>
      <path d={RUFF} fill={ink.deep} {...OUT} strokeWidth={2.2} />
      <g clipPath={`url(#${uid}-ruff)`}>
        <path d={segD(subdivide(hatchSegs(-hw - 14, shY - 20, hw + 14, shY + 30, 78, 2.6, 97, 0.1), 3).filter((_, i) => i % 3 !== 1), cS)} {...ln(1.15, 0.78)} />
      </g>
      {/* the bone toggle that pins it */}
      <path d={limbD([[mT([-7, shY + 18]), 3.6], [mT([7, shY + 20]), 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.5} />
    </>
  );
  // the bow across the back and the quiver (torso frame)
  const pB = (p: P2): P2 => [p[0] * c - 22 * s, p[1]];
  const bowA: P2 = [44, shY - 60];
  const bowB: P2 = [-44, 40];
  const bowC: P2 = [34, -36];
  const bowSt: St[] = [0, 0.16, 0.33, 0.5, 0.67, 0.84, 1].map((t, i): St => [pB(quad(bowA, bowC, bowB, t)), [3.4, 5, 6, 6.8, 6, 5, 3.4][i]]);
  const backGear = quiver ? (
    <g transform={torsoTf}>
      <path d={`M${P(pB(bowA))}L${P(pB(bowB))}`} {...ln(1.2, 0.9)} stroke={ink.deep} strokeOpacity={1} />
      <path d={limbD(bowSt)} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      <QuiverArt ink={ink} a={pB([-15, shY + 40])} b={pB([-36, shY - 14])} />
    </g>
  ) : null;

  // ---- the forager's fur leg-wraps, over the rig's shins ------------------------------
  const wraps = !farmer
    ? [r.legL, r.legR]
        .sort((p1, p2) => p1.z - p2.z)
        .map((l) => {
          const a = mix2(l.K, l.A, 0.18);
          const b = mix2(l.K, l.A, 0.98);
          const u = norm(sub(b, a));
          const n: P2 = [-u[1], u[0]];
          const shin = limbD([[a, 17.5 * k], [mix2(a, b, 0.5), 15.5 * k], [b, 13 * k]]);
          const bands = [0.3, 0.62].map((t) => `M${P(add(mix2(a, b, t), mul(n, -8 * k)))}L${P(add(mix2(a, b, t + 0.07), mul(n, 8 * k)))}`).join("");
          // the fur turned down at the top: a ragged cuff
          const cuff = Array.from({ length: 6 }, (_, i) => {
            const v = (i / 5) * 2 - 1;
            return `M${P(add(add(a, mul(n, v * 8.5 * k)), mul(u, -3)))}l${P(add(mul(u, 9 + 4 * hash(i, 99 + l.sgn)), mul(n, 1.5 * v)))}`;
          }).join("");
          return (
            <g key={l.sgn}>
              <path d={shin} fill={ink.hair} {...OUT} />
              <path d={bands} {...ln(1.3, 0.8)} stroke={ink.deep} strokeOpacity={0.9} />
              <path d={cuff} {...ln(2.2, 0.9)} />
              <path d={cuff} {...ln(1, 1)} stroke={ink.deep} />
            </g>
          );
        })
    : null;

  // ---- hair and beard over the rig's head (head frame) --------------------------------
  const hs = sp.headScale;
  const hy = q.headYaw;
  const hsn = Math.sin(hy);
  const hcs = Math.cos(hy);
  const lock = (phi: number, w: number, len: number, sd: number, braided = false) => {
    const ang = hy + phi;
    const x = r.headC[0] + 22 * hs * Math.sin(ang);
    const y0 = r.headC[1] + 14 * hs;
    const y1 = r.neck[1] + len;
    const sw = q.hem * 0.35;
    const st: St[] = [
      [[x, y0], w * 0.9],
      [[x + 1.5 * hash(1, sd) + sw * 0.3, mix(y0, y1, 0.4)], w],
      [[x - 2 + 3 * hash(2, sd) + sw * 0.7, mix(y0, y1, 0.78)], w * (braided ? 0.9 : 0.8)],
      [[x - 1 + 3 * hash(3, sd) + sw, y1], w * (braided ? 0.55 : 0.3)],
    ];
    const strands = braided
      ? Array.from({ length: 9 }, (_, i) => {
          const t = (i + 0.5) / 9;
          const pIdx = Math.min(2, Math.floor(t * 3));
          const p = mix2(st[pIdx][0], st[pIdx + 1][0], t * 3 - pIdx);
          const wd = mix(st[pIdx][1], st[pIdx + 1][1], t * 3 - pIdx) * 0.5;
          return `M${P(add(p, [-wd, -2]))}L${P(add(p, [wd, 2.6]))}`;
        }).join("")
      : [-0.28, 0, 0.28].map((u) => `M${P(add(st[0][0], [u * w, 2]))}Q${P(add(st[1][0], [u * w, 0]))} ${P(add(st[2][0], [u * w * 0.8, 0]))}`).join("");
    return (
      <g key={sd}>
        <path d={limbD(st)} fill={ink.hair} {...OUT} strokeWidth={1.9} />
        <path d={strands} {...ln(1.2, 0.8)} />
        {braided ? <path d={limbD([[add(st[3][0], [-w * 0.5, -6]), 4], [add(st[3][0], [w * 0.5, -6]), 4]])} fill={ink.main} {...OUT} strokeWidth={1.4} /> : null}
      </g>
    );
  };
  const hairBehind = Math.abs(hsn) > 0.5;
  const beardKind = woman || child ? null : farmer ? "short" : "full";
  const beardEl = beardKind
    ? (() => {
        const fy = 5 * nod;
        const len = beardKind === "short" ? 0.62 : 1.12;
        const pts = blendYaw(BEARD_F, BEARD_P, hy).map((p): P2 => [p[0] * (beardKind === "full" ? 1.06 : 1), 4 + (p[1] - 4) * len + fy * 0.6]);
        const B = smoothClosed(pts);
        const sdx = (sd: number) => (Math.abs(hsn) > 0.02 && sd * (hsn < 0 ? -1 : 1) > 0 ? c01((hcs - 0.2) / 0.32) : 1);
        return (
          <g transform={`${tf} ${headTf}`}>
            <Cased id={`${uid}-bd`} r={1.1}>
              <clipPath id={`${uid}-bdc`}>
                <path d={B} />
              </clipPath>
              <path d={B} fill={ink.hair} {...OUT} />
              <g clipPath={`url(#${uid}-bdc)`}>
                <path d={hatchD(-24, 0, 26, 42, 84, 2.1, 173 + seed, 0.12)} {...ln(1.2, 0.8)} />
              </g>
              {[-1, 1].map((sd) => (
                <path key={sd} d={limbD([[[hcs * 0 + 20.8 * hsn, 13.2], 4.4], [[sd * 5.5 * hcs + 17.5 * hsn, 13.8], 4.6], [[sd * 10.5 * hcs + 12.5 * hsn, 17.6], 2.6]])} fill={ink.hair} {...OUT} strokeWidth={1.5} opacity={sdx(sd)} />
              ))}
            </Cased>
          </g>
        );
      })()
    : null;
  // the farmer woman's hair: gathered into a bun at the nape, a fillet across the brow
  const bunEl =
    farmer && (woman || child) ? (
      <g transform={`${tf} ${headTf}`}>
        <Cased id={`${uid}-bun`} r={1.1}>
          {woman ? (
            <>
              <ellipse cx={-25 * hsn} cy={20} rx={10 - 2 * hcs} ry={8.5} fill={ink.hair} {...OUT} opacity={c01((Math.abs(hsn) - 0.15) * 4)} />
              <path d={`M${(-25 * hsn - 5).toFixed(1)},${17}q5,-4 10,0M${(-25 * hsn - 6).toFixed(1)},${22}q6,-4 12,0`} {...ln(1.1, 0.7 * c01((Math.abs(hsn) - 0.15) * 4))} />
              <path d={`M${(-23 * hcs + 6 * hsn).toFixed(1)},-15Q${(4 * hsn).toFixed(1)},-23 ${(23 * hcs + 6 * hsn).toFixed(1)},-15`} fill="none" stroke={DARK} strokeWidth={5.2} strokeLinecap="round" />
              <path d={`M${(-23 * hcs + 6 * hsn).toFixed(1)},-15Q${(4 * hsn).toFixed(1)},-23 ${(23 * hcs + 6 * hsn).toFixed(1)},-15`} fill="none" stroke={ink.deep} strokeWidth={2.8} strokeLinecap="round" />
            </>
          ) : null}
        </Cased>
      </g>
    ) : null;

  // ---- assemble -------------------------------------------------------------------------
  return (
    <g opacity={tone}>
      {farBack ? withGear(farArm, true) : null}
      <g transform={tf}>
        <Cased id={`${uid}-bk`}>
          {backGear}
          {!farmer && turnSafe ? lock(Math.PI, woman ? 28 : 26, woman ? 46 : 50, 193 + seed) : null}
          {!farmer && !turnSafe && !hairBehind ? lock(Math.PI, woman ? 26 : 30, woman ? 70 : 50, 193 + seed) : null}
        </Cased>
      </g>
      {/* the legs: the rig's, cut below the hips */}
      <clipPath id={`${uid}-lc`}>
        <rect x={at[0] - 600 * scale} y={at[1] + (r.hip[1] + 8.5) * scale} width={1200 * scale} height={(60 - r.hip[1]) * scale} />
      </clipPath>
      <g clipPath={`url(#${uid}-lc)`}>
        <Figure spec={legSpec} pose={{ ...q, lean: 0, hem: 0 }} at={at} scale={scale} uid={`${uid}-lg`} arms="none" ink={ink} />
      </g>
      <g transform={tf}>
        <Cased id={`${uid}-case`}>
          {wraps}
          <g transform={torsoTf}>{farmer ? bodice : bareTorso}</g>
          <g transform={hipTf}>{skirt}</g>
          {!farmer ? (
            <g transform={torsoTf}>
              {capeArt}
              {ruffArt}
            </g>
          ) : null}
          {quiver ? (
            <g transform={torsoTf}>
              <path d={limbD([[side([-hw + 12, shY - 2]), 5], [mT([-4, shY + 36]), 5.4], [side([wst + 2, -34]), 5]])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
            </g>
          ) : null}
          <path d={NECK} fill={ink.main} {...OUT} />
          {!farmer ? (
            <>
              {turnSafe ? <g opacity={sstep((Math.abs(hsn) - 0.35) / 0.3)}>{lock(Math.PI, woman ? 28 : 26, woman ? 46 : 50, 193 + seed)}</g> : hairBehind ? lock(Math.PI, woman ? 28 : 26, woman ? 46 : 50, 193 + seed) : null}
              {woman ? (
                <>
                  {lock(-1.6, 11, 88, 191 + seed, true)}
                  {lock(1.6, 11, 84, 192 + seed, true)}
                </>
              ) : (
                <>
                  {lock(-1.75, 13, 44, 191 + seed)}
                  {lock(1.75, 13, 40, 192 + seed)}
                </>
              )}
            </>
          ) : null}
        </Cased>
      </g>
      {farBack ? withGear(nearArm, false) : [r.armL, r.armR].sort((p1, p2) => p1.z - p2.z).map((ar) => withGear(ar.sgn < 0 ? "L" : "R", false))}
      {turnSafe && farBack && frontArms?.includes(farArm) ? (
        <>
          <clipPath id={`${uid}-fa`}>
            <path d={forearmClip(farArm === "L" ? r.armL : r.armR, at, scale)} />
          </clipPath>
          <g clipPath={`url(#${uid}-fa)`}>{withGear(farArm, true)}</g>
        </>
      ) : null}
      {turnSafe ? <RigEarFade spec={sp} pose={q} at={at} scale={scale} ink={ink} uid={`${uid}-ef`} /> : null}
      {/* the head: the rig's, cut out at the shoulders */}
      <clipPath id={`${uid}-hc`}>
        {/* turn-safe: the rect stops above the shoulders (near profile the cut-out's giant cloak edge showed in it as a sliver) */}
        <rect transform={`${tf} ${torsoTf}`} x={-62} y={shY - 119} width={124} height={turnSafe ? 92 : 112} />
        <path transform={`${tf} ${headTf}`} d={faceClip} />
        <path transform={`${tf} ${headTf}`} d={hairClip} />
      </clipPath>
      <g clipPath={`url(#${uid}-hc)`}>
        <Figure spec={headSpec} pose={q} at={at} scale={scale} uid={`${uid}-hd`} arms="none" ink={ink} />
      </g>
      {beardEl}
      {bunEl}
    </g>
  );
};

export const FarmFigure: React.FC<FarmFigureProps> = (props) => <FarmFigureCore {...props} />;
const FarmFigureCore: React.FC<FarmFigureProps & TurnSafeOpts> = ({ fall = 0, fallDir, shadow = true, ink: inkIn, ...p }) => {
  const ink = inkIn ?? (p.kind === "farmer" ? ORANGE : CREAM);
  const sp = specOf(p.kind, p.woman, p.child);
  if (fall <= 0)
    return (
      <g>
        {shadow ? <ContactShadow x={p.at[0]} y={p.at[1]} halfW={(p.child ? 44 : 58) * p.scale} /> : null}
        <FarmBody {...p} ink={ink} />
      </g>
    );
  // the track runs on adult poses; a child's are shrunk before the rig (and the ground solve) sees them
  const map = p.child ? (q: FigPose) => childPose(q) : undefined;
  const hold = p.hold ?? defaultHold(p.kind, p.woman, p.child);
  const holdFar = p.holdFar ?? "none";
  const released = fall >= RELEASE;
  const dropArm = (far: boolean): ArmSide => {
    const fixed = p.turnSafe ? (far ? (p.holdFarSide ?? (p.holdSide ? (p.holdSide === "L" ? "R" : "L") : undefined)) : p.holdSide) : undefined;
    if (fixed) return fixed;
    const n = nearOf(fallPose(p.pose, RELEASE, fallDir));
    return far ? (n === "L" ? "R" : "L") : n;
  };
  return (
    <g>
      {released && hold !== "none" ? <DroppedTool kind={hold} arm={dropArm(false)} sp={sp} base={p.pose} p={fall} at={p.at} scale={p.scale} ink={ink} dir={fallDir} map={map} uid={`${p.uid}-dn`} /> : null}
      {released && holdFar !== "none" ? <DroppedTool kind={holdFar} arm={dropArm(true)} sp={sp} base={p.pose} p={fall} at={p.at} scale={p.scale} ink={ink} dir={fallDir} map={map} uid={`${p.uid}-df`} /> : null}
      <Sickening spec={sp} pose={p.pose} p={fall} at={p.at} scale={p.scale} ink={ink} dir={fallDir} shadow={shadow} mapPose={map}>
        {(pose, inkNow) => <FarmBody {...p} child={p.child} pose={pose} prescaled ink={inkNow} hold={released ? "none" : hold} holdFar={released ? "none" : holdFar} />}
      </Sickening>
    </g>
  );
};
type CastProps = Omit<FarmFigureProps, "kind" | "uid"> & { uid?: string };
/** an Early Neolithic farmer: ORANGE by default; woman / child variants; near fist: a sickle (man) */
export const Farmer: React.FC<CastProps> = ({ uid = "frm", ...p }) => <FarmFigure kind="farmer" uid={uid} {...p} />;
/** a Mesolithic forager: CREAM by default; woman / child variants; a spear and a bow with quiver (man) */
export const Forager: React.FC<CastProps> = ({ uid = "frg", ...p }) => <FarmFigure kind="forager" uid={uid} {...p} />;

// ---------------------------------------------------------------------------
// THE ANALOGY'S FIGURES, with the same fall
// ---------------------------------------------------------------------------
/** the Aztec commoner of captureFigures (cream), able to sicken and fall (fall 0..1) */
export const Commoner: React.FC<{ pose: FigPose; at: P2; scale: number; uid?: string; ink?: Ink; tone?: number; fall?: number; fallDir?: 1 | -1; shadow?: boolean }> = ({ pose, at, scale, uid = "acom", ink = CREAM, tone = 1, fall = 0, fallDir, shadow = true }) => (
  <g opacity={tone}>
    <Sickening spec={CAST_SPECS.commoner} pose={pose} p={fall} at={at} scale={scale} ink={ink} dir={fallDir} shadow={shadow}>
      {(q, inkNow) => <CapCommoner pose={q} at={at} scale={scale} uid={uid} ink={inkNow} />}
    </Sickening>
  </g>
);
/** the conquistador of texcocoFigures (ORANGE here: the Europeans are the farmers' counterpart); variant 0 sword, 1 banner */
export const Spaniard: React.FC<{ variant?: 0 | 1; pose?: FigPose; at: P2; scale: number; uid?: string; ink?: Ink; tone?: number; fall?: number; fallDir?: 1 | -1; shadow?: boolean }> = ({ variant = 0, pose, at, scale, uid = "aspa", ink = ORANGE, tone = 1, fall = 0, fallDir, shadow = true }) => (
  <g opacity={tone}>
    <Sickening spec={SPANIARDS[variant]} pose={pose ?? SPANIARD_STAND[variant]} p={fall} at={at} scale={scale} ink={ink} dir={fallDir} shadow={shadow}>
      {(q, inkNow) => <TexSpaniard variant={variant} pose={q} at={at} scale={scale} uid={uid} ink={inkNow} />}
    </Sickening>
  </g>
);
export const COMMONER_POSES = CAP_POSES;
/** ADDITION (cut B SameRelationship, 2026-10-20; logged in SHARED_CHANGES.md): an Aztec commoner drawn with
 *  texcocoFigures' own Figure so his garment reads as a garment: a knee-length tilmatli knotted on the shoulder with
 *  a broad stepped-fret border at the hem, the hair tied up (texcoco's topknot), no ear plug. Cream by default,
 *  with the same sicken-and-fall track (fall 0..1). Poses: COMMONER_POSES / POSES (the same rig). */
export const TILMA_COMMONER_SPEC: Spec = { ...TEX_SPECS.brother0, a: 54, hw: 45, H: 94, hipY: -152, hem: 50, plug: 0, hair: "topknot", headScale: 1.08 };
export const TilmaCommoner: React.FC<{ pose: FigPose; at: P2; scale: number; uid?: string; ink?: Ink; tone?: number; fall?: number; fallDir?: 1 | -1; shadow?: boolean }> = ({ pose, at, scale, uid = "tcom", ink = CREAM, tone = 1, fall = 0, fallDir, shadow = true }) => (
  <g opacity={tone}>
    <Sickening spec={TILMA_COMMONER_SPEC} pose={pose} p={fall} at={at} scale={scale} ink={ink} dir={fallDir} shadow={shadow}>
      {(q, inkNow) => <Figure spec={TILMA_COMMONER_SPEC} pose={q} at={at} scale={scale} uid={uid} ink={inkNow} />}
    </Sickening>
  </g>
);

// ---------------------------------------------------------------------------
// POSES. Each takes dir: 1 = facing screen right, -1 = facing screen left (a true
// mirror). "near" = the arm toward us (the tool hand), "far" = the other. All
// are plain FigPose: blend with lerpFig, key with poseTrack, lay walk / idle over.
// ---------------------------------------------------------------------------
const SIDE: FigPose = { ...STAND, yaw: YAW, headYaw: YAW + 0.07, armL: { w: [-8, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 }, armR: { w: [14, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 } };
const FRONT: FigPose = { ...STAND, armL: { w: [-56, -142], elbow: [-0.3, 1], fist: 0.3, hand: 0 }, armR: { w: [56, -142], elbow: [0.3, 1], fist: 0.3, hand: 0 } };
// the farmer: sickle carried low at his side, the blade forward
const R_SICKLE_CARRY: FigPose = aimTool({ ...SIDE, armL: { w: [8, -146], elbow: [-0.6, 1], fist: 1, hand: 0 } }, 70);
// the sheaf in the crook of the far arm, the sickle in the near hand
const R_SHEAF: FigPose = aimTool({ ...R_SICKLE_CARRY, armR: { w: [36, -196], elbow: [-0.5, 1], fist: 0.8, hand: -30 } }, 70);
// the hoe on the near shoulder
const R_HOE_SHOULDER: FigPose = aimTool({ ...SIDE, armL: { w: [26, -214], elbow: [-0.2, 1], fist: 1, hand: 0 } }, -128);
// the forager: the spear upright in the near fist, its butt on the ground ahead of his feet
const R_SPEAR: FigPose = aimTool({ ...SIDE, brow: 0.2, armL: { w: [34, -168], elbow: [-0.6, 1], fist: 1, hand: 0 } }, 2);
// on the move: the spear held level at his side
const R_SPEAR_TRAIL: FigPose = aimTool({ ...SIDE, armL: { w: [14, -150], elbow: [-0.6, 1], fist: 1, hand: 0 } }, 84);
// the harvest loop: stooped, the far hand gathers the stalks, the near hand draws the sickle through them
const harvest = (phase: number): FigPose => {
  const ph = phase - Math.floor(phase);
  // the stroke: 0 - 0.55 the cut (forward -> back toward the body, low); 0.55 - 1 the return over the top
  const cut = ph < 0.55;
  const u = cut ? sstep(ph / 0.55) : sstep((ph - 0.55) / 0.45);
  const from: P2 = [122, -112];
  const to: P2 = [70, -128];
  const nearW: P2 = cut ? [mix(from[0], to[0], u), mix(from[1], to[1], u) + 10 * Math.sin(Math.PI * u)] : [mix(to[0], from[0], u), mix(to[1], from[1], u) - 26 * Math.sin(Math.PI * u)];
  const ang = cut ? mix(102, 140, u) : mix(140, 102, u);
  const grab = cut ? 1 : 1 - 0.7 * Math.sin(Math.PI * u);
  const base: FigPose = {
    ...SIDE,
    lean: 34 + 3 * Math.sin(2 * Math.PI * ph),
    crouch: 30,
    pitch: 18,
    headYaw: YAW + 0.12,
    footL: [-24, 0],
    footR: [26, 0],
    liftL: 6,
    armL: { w: nearW, elbow: [-0.5, 1], fist: 1, hand: 0 },
    armR: { w: [106 - 6 * Math.sin(2 * Math.PI * ph), -128 + 4 * Math.cos(2 * Math.PI * ph)], elbow: [-0.4, 1], fist: grab, hand: 10 },
    brow: 0.3,
    hem: -2 * Math.sin(2 * Math.PI * ph),
  };
  return aimTool(base, ang);
};
// the hoe loop: raise, strike the ground ahead, pull back
const hoeing = (phase: number): FigPose => {
  const ph = phase - Math.floor(phase);
  const k1 = ph < 0.42 ? sstep(ph / 0.42) : ph < 0.56 ? 1 - Math.pow((ph - 0.42) / 0.14, 2) : 0;
  const pull = ph >= 0.56 ? sstep((ph - 0.56) / 0.44) : 0;
  const up: P2 = [30, -270];
  const down: P2 = [96, -108];
  const back: P2 = [64, -138];
  const w: P2 = ph < 0.56 ? mix2(down, up, k1) : mix2(down, back, Math.sin(Math.PI * pull * 0.5));
  const ang = ph < 0.56 ? mix(178, -40, k1) : mix(178, 160, pull);
  const base: FigPose = {
    ...SIDE,
    lean: 14 + 12 * (1 - k1),
    crouch: 18 + 10 * (1 - k1),
    pitch: 10,
    footL: [-26, 0],
    footR: [30, 0],
    armL: { w, elbow: [-0.6, 0.8], fist: 1, hand: 0 },
    armR: { w: mix2(w, [w[0] - 26, w[1] + 34], 1), elbow: [-0.5, 1], fist: 1, hand: 0 },
    brow: 0.5,
  };
  return aimTool(base, ang);
};
const face = (q: FigPose, dir: 1 | -1) => (dir === 1 ? q : mirrorPose(q));
export const POSES = {
  /** facing us, arms at the sides */
  front: () => FRONT,
  /** standing in three-quarter profile, arms at the sides */
  stand: (dir: 1 | -1 = 1) => face(SIDE, dir),
  /** farmer: the sickle carried low at his side (hold "sickle") */
  sickle: (dir: 1 | -1 = 1) => face(R_SICKLE_CARRY, dir),
  /** farmer: sickle in the near hand, a sheaf in the crook of the far arm (hold "sickle", holdFar "sheaf") */
  sheaf: (dir: 1 | -1 = 1) => face(R_SHEAF, dir),
  /** farmer: the hoe on the near shoulder (hold "hoe") */
  hoeShoulder: (dir: 1 | -1 = 1) => face(R_HOE_SHOULDER, dir),
  /** forager: the spear upright in the near fist (hold "spear") */
  spear: (dir: 1 | -1 = 1) => face(R_SPEAR, dir),
  /** forager: the spear carried level at his side, for walking (hold "spear") */
  spearTrail: (dir: 1 | -1 = 1) => face(R_SPEAR_TRAIL, dir),
  /** farmer: the harvest loop, phase 0..1 (one stroke; ~30 frames per stroke reads well) (hold "sickle") */
  harvest: (dir: 1 | -1 = 1, phase = 0) => face(harvest(phase), dir),
  /** farmer: the hoeing loop, phase 0..1 (~40 frames per stroke) (hold "hoe") */
  hoe: (dir: 1 | -1 = 1, phase = 0) => face(hoeing(phase), dir),
};
/** texcocoShared's walk laid over a pose (phase = frames / WALK_CYCLE; advance `at` by walkAdvance(scale) px per frame) */
export const walk = (base: FigPose, phase: number, amount = 1): FigPose => walkPose(base, phase, amount);
/** the walk's legs and bob only: the arms stay where the pose has them (a carried tool) */
export const walkLegs = (base: FigPose, phase: number, amount = 1): FigPose => ({ ...walkPose(base, phase, amount), armL: base.armL, armR: base.armR });
/** the walk cycle at 29.97 fps (texcoco's is 24 frames at 23.976: the same pace) */
export const WALK_CYCLE = 30;
/** world px per frame the walker advances so the planted foot does not slide (child: pass child) */
export const walkAdvance = (scale: number, child = false) => WALK.advance(scale * (child ? CHILD_F : 1), WALK_CYCLE);

/** a figure's anchors in WORLD px (texcocoFigures' figureAnchors: headC, headTop, chest, hip, handL/R, feet ...)
 *  plus nearHand / farHand and `germ`: a good emission ellipse for <Germs> (his chest and face) */
export const farmAnchors = (kind: FarmKind, pose: FigPose, at: P2, scale: number, woman = false, child = false) => {
  const sp = specOf(kind, woman, child);
  const q = child ? childPose(pose) : pose;
  const A = figureAnchors(sp, q, at, scale);
  const farIsR = A.rig.s >= 0;
  return {
    ...A,
    nearHand: farIsR ? A.handL : A.handR,
    farHand: farIsR ? A.handR : A.handL,
    germ: { at: mix2(A.chest, A.headC, 0.35), rx: 46 * scale, ry: 90 * scale },
  };
};

// ---------------------------------------------------------------------------
// ANIMALS: a goat and a small Neolithic cow, side elevation, facing right
// (dir -1 mirrors). Units as the figures' (feet on y = 0; the same scale as the
// people beside them). graze 0..1 lowers the head to the ground; g = the global
// frame for the ambient life (breathing, a tail flick, the jaw, an ear).
// ---------------------------------------------------------------------------
type AnimalProps = {
  at: P2;
  scale: number;
  dir?: 1 | -1;
  graze?: number;
  g?: number;
  /** walk phase in cycles (frames / ANIMAL_WALK.cycle); advance `at` by animalAdvance(kind, scale) px per frame */
  walk?: number;
  /** 0..1 blends the stance into the walk */
  walkAmount?: number;
  seed?: number;
  tone?: number;
  ink?: Ink;
  uid?: string;
  shadow?: boolean;
};
/** the animals' walk: stride (units a planted hoof travels) and frames per cycle at 29.97 */
export const ANIMAL_WALK = { cycle: 30, stride: { goat: 30, cow: 52 } };
export const animalAdvance = (kind: "goat" | "cow", scale: number) => (2 * ANIMAL_WALK.stride[kind] * scale) / ANIMAL_WALK.cycle;
type AnimalBuild = {
  body: P2[];
  /** legs as limb stations [point, width], hip to hoof; far legs first */
  legs: { st: St[]; far: boolean }[];
  pivot: P2;
  poll: P2;
  /** the neck's widths at the body and at the head */
  neckW: [number, number];
  /** graze: the neck swings down this many degrees, the head turns this many more */
  grazeNeck: number;
  grazeHead: number;
  head: P2[];
  eye: P2;
  nostril: P2;
  mouth: [P2, P2];
  horns: { st: St[]; far: boolean }[];
  ear: St[];
  tail: (sw: number) => St[];
  tuft?: (sw: number) => St[];
  /** the beard (goat) or the dewlap (cow), in world orientation from the head / the neck */
  beard?: St[];
  dewlap?: boolean;
  /** contour lines inside the body: shoulder, thigh, ribs */
  contours: string;
  /** the belly's fur fringe (goat) */
  fringe?: [number, number, number];
  hatchBox: [number, number, number, number];
};
const COW: AnimalBuild = {
  body: [[104, -210], [70, -225], [30, -215], [-30, -213], [-96, -224], [-128, -217], [-141, -206], [-148, -182], [-147, -152], [-139, -128], [-112, -112], [-60, -98], [0, -91], [54, -99], [90, -112], [118, -128], [132, -160], [128, -192], [116, -208]],
  legs: [
    { st: [[[80, -140], 34], [[78, -104], 23], [[76, -56], 16], [[78, -18], 13], [[80, -6], 14.5]], far: true },
    { st: [[[-96, -150], 44], [[-84, -104], 28], [[-100, -56], 17], [[-94, -18], 13], [[-92, -6], 14.5]], far: true },
    { st: [[[98, -138], 36], [[96, -104], 24], [[94, -56], 17], [[96, -18], 14], [[98, -6], 15]], far: false },
    { st: [[[-112, -152], 48], [[-100, -104], 30], [[-118, -56], 18], [[-112, -18], 14], [[-110, -6], 15]], far: false },
  ],
  pivot: [96, -172],
  poll: [172, -206],
  neckW: [78, 50],
  grazeNeck: 85,
  grazeHead: 40,
  head: [[-14, -4], [8, -11], [27, 6], [40, 32], [52, 56], [55, 72], [45, 83], [28, 79], [13, 62], [-3, 40], [-17, 19]],
  eye: [13, 14],
  nostril: [49, 70],
  mouth: [[36, 80], [50, 79]],
  horns: [
    { st: [[[6, -8], 9], [[10, -24], 7], [[22, -36], 5], [[36, -38], 2.4]], far: true },
    { st: [[[-6, -6], 10], [[-14, -24], 8], [[-6, -42], 5.6], [[8, -50], 2.6]], far: false },
  ],
  ear: [[[-10, 8], 6], [[-26, 8], 14], [[-40, 4], 5]],
  tail: (sw) => [[[-136, -206], 8], [[-146 - sw * 0.3, -150], 6], [[-150 - sw, -90], 4.6]],
  tuft: (sw) => [[[-150 - sw, -94], 9], [[-151 - sw * 1.2, -76], 10], [[-152 - sw * 1.3, -62], 3]],
  dewlap: true,
  contours: "M104,-196Q78,-170 86,-128M-90,-206Q-124,-178 -108,-120M-20,-104Q-26,-136 -14,-160M0,-102Q-4,-128 6,-150M20,-102Q18,-124 26,-142",
  hatchBox: [-150, -170, 140, -96],
};
const GOAT: AnimalBuild = {
  body: [[44, -126], [30, -129], [0, -121], [-34, -120], [-56, -127], [-70, -114], [-74, -96], [-63, -80], [-36, -72], [0, -67], [28, -71], [44, -78], [58, -90], [64, -108], [58, -124]],
  legs: [
    { st: [[[40, -90], 17], [[40, -62], 11.5], [[40, -32], 8], [[41, -10], 6.5], [[42, -4], 7.5]], far: true },
    { st: [[[-50, -96], 24], [[-44, -64], 15], [[-56, -34], 8.5], [[-52, -10], 6.5], [[-51, -4], 7.5]], far: true },
    { st: [[[50, -90], 18], [[50, -62], 12], [[50, -32], 8.5], [[51, -10], 7], [[52, -4], 8]], far: false },
    { st: [[[-58, -98], 26], [[-52, -64], 16], [[-64, -34], 9], [[-60, -10], 7], [[-59, -4], 8]], far: false },
  ],
  pivot: [44, -100],
  poll: [76, -152],
  neckW: [32, 20],
  grazeNeck: 105,
  grazeHead: 25,
  head: [[-9, -4], [6, -9], [18, 4], [28, 22], [36, 40], [36, 49], [28, 53], [18, 46], [8, 32], [-4, 16], [-12, 6]],
  eye: [9, 7],
  nostril: [32, 45],
  mouth: [[26, 50], [34, 50]],
  horns: [
    { st: [[[2, -6], 6.4], [[0, -22], 5.4], [[-12, -36], 4], [[-30, -40], 1.8]], far: true },
    { st: [[[-4, -5], 7.4], [[-8, -22], 6.2], [[-22, -36], 4.4], [[-40, -38], 2]], far: false },
  ],
  ear: [[[-8, 8], 5], [[-18, 12], 9], [[-28, 18], 3]],
  tail: (sw) => [[[-58, -124], 7], [[-62 - sw * 0.2, -134], 6], [[-64 - sw * 0.4, -142], 2.4]],
  beard: [[[25, 50], 7], [[23, 62], 6], [[19, 72], 2.2]],
  contours: "M52,-116Q38,-104 42,-86M-44,-118Q-66,-102 -56,-80",
  fringe: [-52, 42, -70],
  hatchBox: [-74, -100, 66, -64],
};
const Animal: React.FC<AnimalProps & { b: AnimalBuild; cow: boolean }> = ({ at, scale, dir = 1, graze = 0, g = 0, walk, walkAmount = 1, seed = 0, tone = 1, ink = CREAM, uid = "ani", shadow = true, b, cow }) => {
  const gz = sstep(graze);
  // the walk: a lateral-sequence gait (hind, fore of the same side, then the other side), each hoof planted half the cycle
  const stride = ANIMAL_WALK.stride[cow ? "cow" : "goat"];
  const legOffs = [0.5, 0.25, 0, 0.75]; // far fore, far hind, near fore, near hind
  const walkLeg = (st: St[], i: number): St[] => {
    if (walk === undefined || walkAmount <= 0) return st;
    const u0 = walk + legOffs[i];
    const u = u0 - Math.floor(u0);
    let x: number;
    let y: number;
    if (u < 0.5) {
      x = stride * (0.5 - u / 0.5);
      y = 0;
    } else {
      const v = (u - 0.5) / 0.5;
      x = stride * (-0.5 + sstep(v));
      y = -(cow ? 16 : 11) * Math.sin(Math.PI * v);
    }
    const w = [0, 0.28, 0.62, 1, 1];
    const fore = i === 0 || i === 2;
    return st.map(([p, wd], j): St => [[p[0] + walkAmount * x * w[j], p[1] + walkAmount * y * w[j] + (j === 2 && y < 0 ? walkAmount * y * (fore ? 0.4 : -0.2) : 0)], wd]);
  };
  const legsNow = b.legs.map((l, i) => ({ ...l, st: walkLeg(l.st, i) }));
  const walkBob = walk !== undefined ? walkAmount * 1.6 * Math.cos(4 * Math.PI * walk) : 0;
  const br = 1 + 0.012 * Math.sin(g / 14 + seed);
  const body = b.body.map((p): P2 => [p[0], p[1] * br + walkBob]);
  const BODY = smoothClosed(body);
  // the neck swings about its pivot; the head turns about the poll
  const bob = (1 - gz) * 2.5 * Math.sin(g / 23 + seed) + gz * 2.2 * Math.sin(g / 7 + seed);
  const na = gz * b.grazeNeck + bob;
  const poll = add(b.pivot, rot(sub(b.poll, b.pivot), na));
  const ha = na + gz * b.grazeHead + (gz > 0.5 ? 1.2 * Math.sin(g / 3.4 + seed) : 0);
  const hp = (p: P2): P2 => add(poll, rot(p, ha));
  const HEAD = smoothClosed(b.head.map(hp));
  const sw = (cow ? 7 : 9) * Math.sin(g / 11 + seed * 3) * (0.5 + 0.5 * Math.sin(g / 47 + seed));
  const earSw = 6 * Math.max(0, Math.sin(g / 31 + seed * 1.7)) ** 6;
  const neck = limbD([
    [add(b.pivot, [-b.neckW[0] * 0.2, 4]), b.neckW[0]],
    [mix2(b.pivot, poll, 0.5), mix(b.neckW[0], b.neckW[1], 0.6)],
    [add(poll, rot([0, b.neckW[1] * 0.25], ha)), b.neckW[1]],
  ]);
  const leg = (st: St[], far: boolean, i: number) => {
    const foot = st[st.length - 1][0];
    const fw = st[st.length - 1][1];
    const hoof = `M${P(add(foot, [-fw * 0.62, -3]))}L${P(add(foot, [fw * 0.5, -3]))}L${P(add(foot, [fw * 0.95, 6]))}L${P(add(foot, [-fw * 0.62, 6]))}Z`;
    const joint = st[2][0];
    return (
      <g key={i}>
        <path d={limbD(st)} fill={far ? ink.deep : ink.main} {...OUT} />
        <path d={`M${P(add(st[1][0], [st[1][1] * 0.28, 0]))}Q${P(add(joint, [st[2][1] * 0.42, 0]))} ${P(add(st[3][0], [st[3][1] * 0.32, 0]))}`} {...ln(1, 0.55)} />
        <path d={`M${P(add(joint, [-st[2][1] * 0.45, -2]))}Q${P(add(joint, [0, 2]))} ${P(add(joint, [st[2][1] * 0.45, -2]))}`} {...ln(1, 0.5)} />
        <path d={hoof} fill={ink.hair} {...OUT} strokeWidth={1.8} />
        <path d={`M${P(add(foot, [fw * 0.15, -2.5]))}L${P(add(foot, [fw * 0.25, 6]))}`} {...ln(1, 0.7)} />
      </g>
    );
  };
  const [hx0, hy0, hx1, hy1] = b.hatchBox;
  const fringe = b.fringe
    ? (() => {
        const [x0, x1, yb] = b.fringe;
        const n = 13;
        return Array.from({ length: n }, (_, i) => {
          const x = mix(x0, x1, (i + 0.5) / n) + 2 * (hash(i, 733 + seed) - 0.5);
          const len = 12 + 7 * hash(i, 731 + seed);
          const sw2 = 1.5 * Math.sin(g / 13 + i);
          return limbD([[[x, yb - 6], 7], [[x - 1 + sw2 * 0.5, yb + len * 0.5], 5.4], [[x - 3 + sw2, yb + len], 1.6]]);
        }).join("");
      })()
    : "";
  return (
    <g opacity={tone}>
      {shadow ? <ContactShadow x={at[0] + dir * (cow ? -6 : -4) * scale} y={at[1]} halfW={(cow ? 150 : 74) * scale} /> : null}
      <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${(scale * dir).toFixed(4)} ${scale.toFixed(4)})`}>
        <Cased id={`${uid}-case`} r={1.4}>
          <clipPath id={`${uid}-bc`}>
            <path d={BODY} />
          </clipPath>
          <clipPath id={`${uid}-hc`}>
            <path d={HEAD} />
          </clipPath>
          {legsNow.filter((l) => l.far).map((l, i) => leg(l.st, true, i))}
          <path d={limbD(b.tail(sw))} fill={ink.deep} {...OUT} strokeWidth={1.9} />
          {b.tuft ? <path d={limbD(b.tuft(sw))} fill={ink.hair} {...OUT} strokeWidth={1.7} /> : null}
          {b.horns.filter((h) => h.far).map((h, i) => <path key={i} d={limbD(h.st.map(([p, w]): St => [hp(p), w]))} fill={ink.deep} {...OUT} />)}
          {fringe ? <path d={fringe} fill={ink.deep} {...OUT} strokeWidth={1.6} /> : null}
          <path d={neck} fill={ink.main} {...OUT} />
          {legsNow.filter((l) => !l.far).map((l, i) => leg(l.st, false, i + 2))}
          <path d={BODY} fill={ink.main} {...OUT} strokeWidth={2.5} />
          <g clipPath={`url(#${uid}-bc)`}>
            <path d={hatchD(hx0, hy0, hx1, hy1 + 6, 112, cow ? 3 : 2.6, 701 + seed)} {...ln(0.95, 0.58)} />
            <path d={hatchD(hx0, (hy0 + hy1) / 2, hx1, hy1 + 6, 58, cow ? 3.6 : 3.1, 702 + seed)} {...ln(0.9, 0.45)} />
            <path d={hatchD(hx0, -260, hx0 + (hx1 - hx0) * 0.18, hy1, 104, 3, 703 + seed)} {...ln(0.9, 0.45)} />
            {cow ? null : <path d={segD(subdivide(hatchSegs(hx0, -130, hx1, hy1 + 4, 82, 4.2, 704 + seed, 0.1), 4).filter((_, i) => i % 2 === 0))} {...ln(1, 0.5)} />}
            <path d={b.contours} {...ln(1.2, 0.6)} />
          </g>
          {/* where the neck leaves the body: its lower contour, over the chest */}
          <path d={`M${P(add(b.pivot, rot([b.neckW[0] * 0.15, b.neckW[0] * 0.5], na * 0.6)))}Q${P(add(mix2(b.pivot, poll, 0.5), rot([0, b.neckW[1] * 0.55], na)))} ${P(add(poll, rot([0, b.neckW[1] * 0.45], ha)))}`} {...ln(1.3, 0.7)} />
          {b.dewlap ? <path d={limbD([[add(b.pivot, [10, 44]), 22], [add(mix2(b.pivot, poll, 0.55), rot([0, 34], na)), 18], [add(poll, rot([0, 26], ha)), 6]])} fill={ink.main} {...OUT} /> : null}
          <path d={limbD(b.ear.map(([p, w]): St => [hp(add(p, [0, -earSw * (p[0] < -20 ? 1 : 0)])), w]))} fill={ink.deep} {...OUT} strokeWidth={1.9} />
          <path d={HEAD} fill={ink.main} {...OUT} />
          <g clipPath={`url(#${uid}-hc)`}>
            <path d={segD(hatchSegs(-40, -40, 80, 100, 112, 2.5, 711 + seed).map(([p, q]) => [hp(p), hp(q)] as Seg).filter(([p]) => {
              const l = rot(sub(p, poll), -ha);
              return l[0] + l[1] * 0.2 > (cow ? 18 : 10);
            }))} {...ln(0.9, 0.55)} />
          </g>
          <path d={`M${P(hp(add(b.eye, [-5, -3])))}Q${P(hp(add(b.eye, [0, -6])))} ${P(hp(add(b.eye, [5, -2])))}`} {...ln(1.1, 0.7)} />
          <ellipse cx={hp(b.eye)[0]} cy={hp(b.eye)[1]} rx={cow ? 3 : 2.4} ry={cow ? 2.4 : 2} fill={DARK} />
          <circle cx={hp(b.nostril)[0]} cy={hp(b.nostril)[1]} r={cow ? 2.4 : 1.6} fill={DARK} opacity={0.8} />
          <path d={`M${P(hp(b.mouth[0]))}L${P(hp(b.mouth[1]))}`} {...ln(1.2, 0.7)} />
          {b.horns.filter((h) => !h.far).map((h, i) => (
            <g key={i}>
              <path d={limbD(h.st.map(([p, w]): St => [hp(p), w]))} fill={cow ? ink.main : ink.deep} {...OUT} />
              <path d={[0.2, 0.4, 0.6].map((t) => {
                const a = hp(mix2(h.st[1][0], h.st[2][0], t));
                return `M${P(add(a, [-3, -1]))}l5,3`;
              }).join("")} {...ln(0.9, 0.6)} />
            </g>
          ))}
          {b.beard ? (() => {
            const chin = hp(b.beard[0][0]);
            const st = b.beard.map(([p, w], i): St => [add(chin, [(p[0] - b.beard![0][0][0]) * 0.5 + i * 0.6 * Math.sin(g / 17 + seed), p[1] - b.beard![0][0][1]]), w]);
            return <path d={limbD(st)} fill={ink.hair} {...OUT} strokeWidth={1.6} />;
          })() : null}
        </Cased>
      </g>
    </g>
  );
};
/** a goat (cream; scimitar horns, a beard, a fur fringe): withers ~125 units, ~0.4 of a man */
export const Goat: React.FC<AnimalProps> = ({ uid = "goat", ...p }) => <Animal b={GOAT} cow={false} uid={uid} {...p} />;
/** a small Neolithic cow (cream; short forward horns, a dewlap): withers ~220 units, ~0.7 of a man */
export const Cow: React.FC<AnimalProps> = ({ uid = "cow", ...p }) => <Animal b={COW} cow uid={uid} {...p} />;

// (added for cut E HugeLandscapes, logged in SHARED_CHANGES.md) a red deer on the same Animal builder: a slim
// deep-chested body, long thin legs, an upright neck, big ears; a stag carries branched antlers (beam, brow,
// trez and crown tines), a hind none. Withers ~200 units (~0.65 of a man). Walks on the goat's stride.
const deerAntlers = (): AnimalBuild["horns"] => [
  { st: [[[8, -6], 6.4], [[8, -42], 5.4], [[2, -82], 4.4], [[-4, -116], 3.4], [[2, -138], 1.8]], far: true },
  { st: [[[4, -34], 3.6], [[20, -44], 2.8], [[30, -46], 1.4]], far: true },
  { st: [[[2, -6], 7], [[-6, -40], 6], [[-20, -80], 5], [[-30, -115], 4], [[-26, -142], 2]], far: false },
  { st: [[[-4, -30], 4.2], [[14, -40], 3.2], [[27, -42], 1.6]], far: false },
  { st: [[[-17, -74], 3.8], [[0, -88], 2.8], [[12, -92], 1.4]], far: false },
  { st: [[[-29, -112], 3.4], [[-44, -128], 2.4], [[-52, -138], 1.2]], far: false },
];
const deerBuild = (stag: boolean): AnimalBuild => ({
  body: [[88, -196], [55, -206], [10, -200], [-40, -198], [-82, -206], [-104, -198], [-112, -182], [-110, -160], [-100, -140], [-76, -128], [-30, -124], [20, -124], [58, -130], [86, -144], [100, -162], [98, -182]],
  legs: [
    { st: [[[70, -150], 22], [[70, -112], 12], [[68, -60], 8], [[70, -18], 6.5], [[71, -5], 7.5]], far: true },
    { st: [[[-80, -160], 30], [[-70, -112], 16], [[-86, -60], 8.5], [[-82, -18], 6.5], [[-81, -5], 7.5]], far: true },
    { st: [[[82, -150], 23], [[82, -112], 12.5], [[80, -60], 8.5], [[82, -18], 7], [[83, -5], 8]], far: false },
    { st: [[[-92, -162], 32], [[-82, -112], 17], [[-98, -60], 9], [[-94, -18], 7], [[-93, -5], 8]], far: false },
  ],
  pivot: [84, -176],
  poll: [136, -292],
  neckW: [56, 30],
  grazeNeck: 100,
  grazeHead: 25,
  head: [[-10, -4], [6, -8], [24, 2], [44, 14], [62, 28], [68, 38], [60, 46], [44, 44], [26, 36], [8, 24], [-8, 12]],
  eye: [14, 10],
  nostril: [62, 36],
  mouth: [[50, 44], [62, 42]],
  horns: stag ? deerAntlers() : [],
  ear: [[[-6, 6], 6], [[-22, -6], 15], [[-36, -16], 5]],
  tail: (sw) => [[[-108, -196], 7], [[-114 - sw * 0.2, -182], 6], [[-116 - sw * 0.3, -170], 2.6]],
  contours: "M80,-186Q62,-168 70,-140M-80,-196Q-108,-172 -92,-140",
  hatchBox: [-112, -170, 100, -124],
});
const DEER_STAG = deerBuild(true);
const DEER_HIND = deerBuild(false);
/** a red deer (cream), facing right (dir -1 mirrors): stag (antlers, default) or hind (stag={false}); withers ~200
 *  units. Same props as Goat / Cow (graze lowers the head to the grass or the water; walk on ANIMAL_WALK's goat
 *  stride: advance 2 x 30 x scale / 30 px per frame). Its own contact shadow is the goat's: pass shadow={false} and
 *  draw a ContactShadow with halfW ~120 x scale for a deer. */
export const Deer: React.FC<AnimalProps & { stag?: boolean }> = ({ uid = "deer", stag = true, ...p }) => <Animal b={stag ? DEER_STAG : DEER_HIND} cow={false} uid={uid} {...p} />;

// ---------------------------------------------------------------------------
// ARCHITECTURE (style: dark umber planes in cream line, never pale masses)
// ---------------------------------------------------------------------------
const PLANE = "#2A2119";
const PLANE_LIT = "#352A1F";
/** an LBK timber longhouse, side elevation: post walls with wattle-and-daub panels, a door, a long steep thatched
 *  roof. at = the middle of its base (world px), scale = px per figure unit (a man is 310 units; the house is
 *  `len` units long: default 1900, ~10 m; the ridge stands ~930). tint 0..1 the orange of a farmer building (default 1). */
export const Longhouse: React.FC<{ at: P2; scale: number; len?: number; tint?: number; tone?: number; uid?: string; seed?: number }> = ({ at, scale, len = 1900, tint = 1, tone = 1, uid = "lh", seed = 0 }) => {
  const L = len / 2;
  const wallH = 360;
  const eave = -wallH + 30;
  const ridge = -930;
  const over = 70; // the eaves overhang
  const lineC = mixColor(INK, ACCENT, 0.72 * tint);
  const lineD = mixColor("#B9AD8D", ACCENT_DEEP, 0.72 * tint);
  const st = (w = 2.2, a = 1) => ({ fill: "none", stroke: lineC, strokeWidth: w * 1.7, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
  const ROOF = `M${-L - over},${eave + 26}L${-L + 150},${ridge}L${L - 150},${ridge}L${L + over},${eave + 26}Z`;
  const posts = Array.from({ length: Math.floor(len / 150) + 1 }, (_, i) => -L + 30 + i * ((len - 60) / Math.floor(len / 150)));
  const door = { x: -L * 0.12, w: 110, h: 250 };
  // thatch: rows of short strokes following the slope, darker toward the eave
  let thatch = "";
  for (let row = 0; row < 14; row++) {
    const t = row / 13;
    const y = mix(ridge + 14, eave + 16, t);
    const xHalf = mix(L - 150, L + over, t);
    for (let x = -xHalf + 8; x < xHalf - 8; x += 13 + 6 * hash(row * 97 + x, 801 + seed)) {
      const l = 30 + 16 * hash(x + row, 802 + seed);
      thatch += `M${x.toFixed(1)},${(y - l * 0.6).toFixed(1)}L${(x + 2.5 * (hash(x, row) - 0.5)).toFixed(1)},${(y + l * 0.4).toFixed(1)}`;
    }
  }
  // wattle: horizontal weave strokes on each panel, the daub patched over it
  let wattle = "";
  posts.slice(0, -1).forEach((x, i) => {
    const x1 = posts[i + 1];
    for (let y = -wallH + 50; y < -16; y += 22) {
      if (x < door.x + door.w / 2 && x1 > door.x - door.w / 2 && y > -door.h) continue;
      const wob = 5 * Math.sin(i + y * 0.1);
      wattle += `M${(x + 12).toFixed(1)},${(y + wob * 0.2).toFixed(1)}Q${((x + x1) / 2).toFixed(1)},${(y + 6 + wob).toFixed(1)} ${(x1 - 12).toFixed(1)},${y.toFixed(1)}`;
    }
  });
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
      <clipPath id={`${uid}-roof`}>
        <path d={ROOF} />
      </clipPath>
      {/* walls: a dark plane, posts, wattle, the door */}
      <rect x={-L} y={-wallH} width={len} height={wallH} fill={PLANE} stroke={DARK} strokeWidth={6} />
      <path d={wattle} {...st(1.6, 0.5)} stroke={lineD} />
      <rect x={door.x - door.w / 2} y={-door.h} width={door.w} height={door.h} fill="#140F0A" stroke={lineC} strokeWidth={2.6} />
      <path d={`M${door.x - door.w / 2 - 14},${-door.h - 10}L${door.x + door.w / 2 + 14},${-door.h - 10}`} {...st(4.2)} />
      {posts.map((x, i) => (
        <g key={i}>
          <path d={`M${x.toFixed(1)},0L${x.toFixed(1)},${-wallH + 6}`} stroke={DARK} strokeWidth={17} />
          <path d={`M${x.toFixed(1)},0L${x.toFixed(1)},${-wallH + 6}`} stroke={PLANE_LIT} strokeWidth={11} />
          <path d={`M${(x - 5.5).toFixed(1)},-2L${(x - 5.5).toFixed(1)},${-wallH + 8}M${(x + 5.5).toFixed(1)},-2L${(x + 5.5).toFixed(1)},${-wallH + 8}`} {...st(2)} />
        </g>
      ))}
      <path d={`M${-L},0L${L},0`} {...st(3)} />
      {/* the roof: a dark plane of thatch, its ridge, the eave line */}
      <path d={ROOF} fill={PLANE_LIT} stroke={DARK} strokeWidth={7} strokeLinejoin="round" />
      <g clipPath={`url(#${uid}-roof)`}>
        <path d={thatch} {...st(1.7, 0.62)} />
      </g>
      <path d={ROOF} {...st(2.8)} />
      <path d={`M${-L - over + 10},${eave + 18}L${L + over - 10},${eave + 18}`} {...st(2, 0.7)} />
      <path d={`M${-L + 160},${ridge - 6}L${L - 160},${ridge - 6}`} {...st(4.2)} />
      {/* the gable-end smoke hole's crossed ridge poles */}
      <path d={`M${-L + 150},${ridge}l-34,-46M${-L + 150},${ridge}l30,-44M${L - 150},${ridge}l34,-46M${L - 150},${ridge}l-30,-44`} {...st(3.2)} />
    </g>
  );
};
/** a forager's hut (Mesolithic, as at Star Carr / Mount Sandel): hides lashed over a dome of bent saplings, a low
 *  door, the pole ends poking out round the smoke hole. Cream line on a dark plane. at = the middle of its base;
 *  ~320 units tall, 480 wide (a man stoops to go in). open 0..1 the door flap. */
export const HideTent: React.FC<{ at: P2; scale: number; open?: number; tone?: number; uid?: string; seed?: number }> = ({ at, scale, open = 0.5, tone = 1, uid = "tent", seed = 0 }) => {
  const W = 240;
  const H = 330;
  // a lumpy beehive: the hides sag between the saplings
  const dome = (u: number): P2 => {
    const r = 1 - 0.035 * Math.abs(Math.sin(u * Math.PI * 5));
    return [W * r * Math.cos(Math.PI * (1 - u)), -H * r * Math.sin(Math.PI * u) ** 0.72];
  };
  const pts = Array.from({ length: 41 }, (_, i) => dome(i / 40));
  const HUT = `M${pts.map(P).join("L")}Z`;
  const st = (w = 2.6, a = 1) => ({ fill: "none", stroke: INK, strokeWidth: w, strokeOpacity: a, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
  // hide patches: columns between wavy vertical seams; each column split at a sagging hide edge; hatch density varies per patch
  const cols = [-1, -0.62, -0.22, 0.2, 0.6, 1];
  const seam = (u: number, k: number): P2[] =>
    Array.from({ length: 9 }, (_, j) => {
      const t = j / 8;
      const x = u * W * (1 - 0.82 * t ** 1.6) + 7 * Math.sin(j * 1.9 + k);
      return [x, -H * t * 0.97];
    });
  let seams = "";
  let ticks = "";
  let edges = "";
  let fur = "";
  const patches: React.ReactNode[] = [];
  cols.slice(1, -1).forEach((u, k) => {
    const sm = seam(u, k + seed);
    seams += `M${sm.map(P).join("L")}`;
    sm.slice(1, -1).forEach((p0, j) => {
      ticks += `M${(p0[0] - 6).toFixed(1)},${(p0[1] + 2).toFixed(1)}l12,-4`;
      if (j % 2 === 0) ticks += `M${(p0[0] - 6).toFixed(1)},${(p0[1] + 14).toFixed(1)}l12,-4`;
    });
  });
  cols.slice(0, -1).forEach((u0, k) => {
    const u1 = cols[k + 1];
    const y = -H * (0.34 + 0.26 * hash(k, 830 + seed));
    const xa = u0 * W * (1 - 0.82 * (-y / H) ** 1.6) * 0.98;
    const xb = u1 * W * (1 - 0.82 * (-y / H) ** 1.6) * 0.98;
    edges += `M${xa.toFixed(1)},${y.toFixed(1)}Q${((xa + xb) / 2).toFixed(1)},${(y + 22).toFixed(1)} ${xb.toFixed(1)},${y.toFixed(1)}`;
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      const x = mix(xa, xb, t);
      const yy = y + 22 * 4 * t * (1 - t);
      fur += `M${x.toFixed(1)},${yy.toFixed(1)}l${(-2 + 4 * hash(i + k * 9, 831)).toFixed(1)},${(10 + 6 * hash(i, 832 + k)).toFixed(1)}`;
    }
    const gap = [7, 11, 16][Math.floor(hash(k, 833 + seed) * 3)];
    patches.push(<path key={k} d={hatchD(Math.min(xa, u0 * W) - 10, -H, Math.max(xb, u1 * W) + 10, y + 20, k % 2 ? 62 : 118, gap, 834 + k + seed)} {...st(1.4, 0.3)} />);
  });
  // the tie-down cord across the hides, pegged at both ends
  const cord = `M${-W * 0.92},${-40}Q0,${-H * 0.62} ${W * 0.92},${-40}`;
  const doorW = 100 + 30 * c01(open);
  const doorH = 160;
  const dx = 46;
  const DOOR = `M${dx - doorW / 2},0Q${dx - doorW / 2 - 4},${-doorH} ${dx},${-doorH}Q${dx + doorW / 2 + 4},${-doorH} ${dx + doorW / 2},0Z`;
  const stones = [-0.95, -0.7, -0.42, 0.62, 0.88].map((u, i) => <ellipse key={i} cx={u * W} cy={-7} rx={15 + 5 * hash(i, 835 + seed)} ry={9} fill={PLANE} stroke={INK} strokeWidth={2.2} />);
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
      <clipPath id={`${uid}-t`}>
        <path d={HUT} />
      </clipPath>
      {/* the sapling ends splayed out of the smoke hole */}
      {[-52, -26, -4, 20, 44].map((x, i) => {
        const d = `M${(x * 0.5).toFixed(1)},${-H + 18}Q${(x * 0.8).toFixed(1)},${-H - 20} ${(x * 1.6 + 8 * (hash(i, 822 + seed) - 0.5)).toFixed(1)},${(-H - 46 - 16 * hash(i, 823 + seed)).toFixed(1)}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={DARK} strokeWidth={12} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#B9AD8D" strokeWidth={5.4} strokeLinecap="round" />
          </g>
        );
      })}
      <path d={HUT} fill={PLANE_LIT} stroke={DARK} strokeWidth={8} strokeLinejoin="round" />
      <g clipPath={`url(#${uid}-t)`}>
        {patches}
        <path d={seams} {...st(2.4, 0.85)} />
        <path d={ticks} {...st(1.4, 0.6)} />
        <path d={edges} {...st(2.4, 0.9)} />
        <path d={fur} {...st(1.5, 0.7)} />
        <path d={cord} fill="none" stroke={DARK} strokeWidth={7} />
        <path d={cord} {...st(2.6)} strokeDasharray="7 5" />
        <path d={DOOR} fill="#140F0A" stroke={INK} strokeWidth={2.6} />
        {/* the flap, a hide rolled back to one side */}
        <path d={`M${dx},${-doorH}Q${dx - doorW / 2 - 18},${-doorH * 0.6} ${dx - doorW / 2 - 14},0L${dx - doorW / 2 + 12},0Q${dx - doorW / 2 + 6},${-doorH * 0.6} ${dx},${-doorH}Z`} fill={PLANE} stroke={INK} strokeWidth={2.2} />
      </g>
      <path d={HUT} {...st(3)} />
      {stones}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FIELD AND THE GRAIN (orange: the farmers' food)
// ---------------------------------------------------------------------------
/** rows of ripe wheat in depth. x0..x1 the field's width at its FRONT row, y = the front row's ground (world px);
 *  scale = px per figure unit (a stalk stands ~150 units: waist-high on a man). Rows go back (up) and recede.
 *  g = the frame for the wind (a gust travels across); cutX: stalks with x < cutX (cutFrom "left") are cut to
 *  stubble; the cut fronts sweep monotonically if you drive cutX monotonically. */
export const WheatField: React.FC<{ x0: number; x1: number; y: number; scale: number; rows?: number; depth?: number; spacing?: number; g?: number; wind?: number; cutX?: number; cutFrom?: "left" | "right"; tone?: number; seed?: number; ink?: Ink }> = ({
  x0,
  x1,
  y,
  scale,
  rows = 5,
  depth = 70,
  spacing = 13,
  g = 0,
  wind = 1,
  cutX,
  cutFrom = "left",
  tone = 1,
  seed = 0,
  ink = ORANGE,
}) => {
  const stems: string[] = Array.from({ length: rows }, () => "");
  const ears: string[] = Array.from({ length: rows }, () => "");
  const awns: string[] = Array.from({ length: rows }, () => "");
  const stub: string[] = Array.from({ length: rows }, () => "");
  for (let r = rows - 1; r >= 0; r--) {
    const rs = 1 - 0.1 * r; // receding
    const ry = y - r * depth * scale;
    const sp = spacing * scale * rs;
    let i = 0;
    for (let x = x0 + sp * hash(r, 841 + seed); x < x1; x += sp * (0.75 + 0.5 * hash(i + r * 1000, 842 + seed)), i++) {
      const h = (140 + 26 * hash(i + r * 1000, 843 + seed)) * scale * rs;
      const isCut = cutX !== undefined && (cutFrom === "left" ? x < cutX : x > cutX);
      if (isCut) {
        const sh = 18 * scale * rs;
        stub[r] += `M${x.toFixed(1)},${ry.toFixed(1)}L${(x + 1.5 * scale).toFixed(1)},${(ry - sh).toFixed(1)}`;
        continue;
      }
      // the wind: a gust that travels across, plus a slow sway; the bend grows toward the top
      const gust = wind * (8 + 14 * Math.max(0, Math.sin(x * 0.006 - g * 0.07))) * scale * rs;
      const lean = (hash(i + r * 1000, 844 + seed) - 0.5) * 10 * scale + gust + 3 * scale * Math.sin(g * 0.05 + x * 0.02);
      const top: P2 = [x + lean, ry - h + Math.abs(lean) * 0.25];
      const mid: P2 = [x + lean * 0.25, ry - h * 0.55];
      stems[r] += `M${x.toFixed(1)},${ry.toFixed(1)}Q${mid[0].toFixed(1)},${mid[1].toFixed(1)} ${top[0].toFixed(1)},${top[1].toFixed(1)}`;
      // the ear: a spindle along the stem's top direction, ripe ears nod
      const d = norm([lean * 0.7 + 4 * scale, -h * 0.35]);
      const el = 30 * scale * rs;
      const ew = 5.2 * scale * rs;
      const e0 = top;
      const e1: P2 = [top[0] + d[0] * el + 3 * scale, top[1] + d[1] * el + 6 * scale * rs];
      const nn: P2 = [-d[1], d[0]];
      const m1 = mix2(e0, e1, 0.45);
      ears[r] += `M${P(e0)}Q${P(add(m1, mul(nn, ew)))} ${P(e1)}Q${P(add(m1, mul(nn, -ew)))} ${P(e0)}Z`;
      awns[r] += `M${P(mix2(e0, e1, 0.7))}l${P(add(mul(d, 14 * scale * rs), mul(nn, 5 * scale)))}M${P(mix2(e0, e1, 0.85))}l${P(add(mul(d, 15 * scale * rs), mul(nn, -4 * scale)))}`;
    }
  }
  const w = (v: number) => Math.max(0.6, v * scale);
  return (
    <g opacity={tone} strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: rows }, (_, i) => rows - 1 - i).map((r) => {
        const rt = 1 - 0.16 * r; // back rows sink toward the page
        const main = mixColor(LAND, ink.main, rt);
        const deep = mixColor(LAND, ink.deep, rt);
        return (
          <g key={r}>
            <path d={stub[r]} fill="none" stroke={DARK} strokeWidth={w(4.4)} />
            <path d={stub[r]} fill="none" stroke={deep} strokeWidth={w(2)} />
            <path d={stems[r]} fill="none" stroke={DARK} strokeWidth={w(4.2)} strokeOpacity={0.9} />
            <path d={stems[r]} fill="none" stroke={deep} strokeWidth={w(1.8)} />
            <path d={awns[r]} fill="none" stroke={DARK} strokeWidth={w(1.2)} strokeOpacity={0.6} />
            <path d={ears[r]} fill={main} stroke={DARK} strokeWidth={w(1.7)} />
          </g>
        );
      })}
    </g>
  );
};

/** where each kernel of a heap rests and when it arrives (amount at which it lands), sorted by arrival */
const heapCache = new globalThis.Map<string, { x: number; y: number; a: number; ang: number; s: number }[]>();
const heapKernels = (n: number, W: number, H: number, seed: number) => {
  const key = `${n}-${W}-${H}-${seed}`;
  const hit = heapCache.get(key);
  if (hit) return hit;
  const out: { x: number; y: number; a: number; ang: number; s: number }[] = [];
  // fill the dome y <= H (1 - (x / W)^2) with jittered rows of kernels
  const kh = 7.2;
  let i = 0;
  for (let row = 0; out.length < n * 1.6 && row < 200; row++) {
    const yy = row * kh * 0.8;
    if (yy > H) break;
    const half = W * Math.sqrt(Math.max(0, 1 - yy / H));
    for (let x = -half + (row % 2) * 5; x <= half; x += 10.5) {
      const jx = x + (hash(i, 861 + seed) - 0.5) * 4;
      const jy = yy + (hash(i, 862 + seed) - 0.5) * 3;
      // the smallest heap (as a fraction of the full one) that contains this point: heaps grow self-similar
      const u = jy / H;
      const v2 = (jx * jx) / (W * W);
      const sF = (u + Math.sqrt(u * u + 4 * v2)) / 2;
      out.push({ x: jx, y: -jy - 3.5, a: sF * sF, ang: hash(i, 863 + seed) * 180 - 90, s: 0.85 + 0.3 * hash(i, 864 + seed) });
      i++;
    }
  }
  out.sort((p, q) => p.a - q.a);
  heapCache.set(key, out);
  return out;
};
/** a heap of orange grain built of kernels. at = the middle of its base; scale = px per figure unit; the full heap
 *  is `width` units across (default 260) and ~0.36 x that high; amount 0..1 how much has arrived: kernels land
 *  one by one (the heap grows self-similar, the newest kernels drop in from `pourFrom` (world px; default from
 *  straight above), each a short flight). */
export const GrainHeap: React.FC<{ at: P2; scale: number; amount: number; width?: number; pourFrom?: P2; tone?: number; seed?: number; ink?: Ink; uid?: string }> = ({ at, scale, amount, width = 260, pourFrom, tone = 1, seed = 0, ink = ORANGE }) => {
  const W = width / 2;
  const H = width * 0.36;
  const ks = heapKernels(900, W, H, seed);
  const am = c01(amount);
  const flight = 0.035; // fraction of the amount a kernel takes to land
  const src: P2 = pourFrom ? [(pourFrom[0] - at[0]) / scale, (pourFrom[1] - at[1]) / scale] : [0, -H * 1.9 - 60];
  let rest = "";
  let lines = "";
  const flying: React.ReactNode[] = [];
  const kd = (x: number, y: number, ang: number, s: number) => {
    const a = (ang * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const L = 5.6 * s;
    const R = 3.1 * s;
    const p = (u: number, v: number): P2 => [x + u * ca - v * sa, y + u * sa + v * ca];
    return { body: `M${P(p(-L, 0))}Q${P(p(-L * 0.7, -R * 1.4))} ${P(p(0, -R))}Q${P(p(L * 0.7, -R * 1.4))} ${P(p(L, 0))}Q${P(p(L * 0.7, R * 1.4))} ${P(p(0, R))}Q${P(p(-L * 0.7, R * 1.4))} ${P(p(-L, 0))}Z`, crease: `M${P(p(-L * 0.6, 0.2))}L${P(p(L * 0.6, 0.2))}` };
  };
  for (let i = 0; i < ks.length; i++) {
    const k0 = ks[i];
    if (k0.a > am + flight) break;
    const t = c01((am - k0.a) / flight + 1); // 0 = just leaving, 1 = landed
    if (t >= 1) {
      const d = kd(k0.x, k0.y, k0.ang, k0.s);
      rest += d.body;
      lines += d.crease;
    } else if (t > 0) {
      // in flight: an arc from the pour point down onto its place (gravity)
      const e = t * t;
      const x = mix(src[0] + (hash(i, 871) - 0.5) * 10, k0.x, t);
      const y = mix(src[1], k0.y, e) - 20 * Math.sin(Math.PI * t) * (pourFrom ? 1 : 0);
      const d = kd(x, y, k0.ang + 140 * (1 - t), k0.s);
      flying.push(<path key={i} d={d.body} fill={ink.main} stroke={DARK} strokeWidth={1.3} />);
    }
  }
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
      {am > 0.01 ? <ellipse cx={0} cy={1} rx={W * Math.sqrt(am) * 1.08} ry={8 * Math.sqrt(am) + 2} fill={DARK} fillOpacity={0.35} /> : null}
      <path d={rest} fill={ink.main} stroke={DARK} strokeWidth={1.35} />
      <path d={lines} fill="none" stroke={ink.hair} strokeWidth={0.9} strokeOpacity={0.8} />
      {flying}
    </g>
  );
};

/** GrainHeapFed (added for cut D AllAboutEnergy, logged in SHARED_CHANGES.md): GrainHeap's kernels and its
 *  self-similar growth, driven by FRAMES instead of one amount. amountAt(f) (nondecreasing, 0..1) is how much of
 *  the full heap has landed by frame f; each kernel flies `flight` frames on a ballistic arc from where
 *  `source(fLeave, kx)` was when it left (world px; kx = the kernel's x in heap units, - left of the middle), so a
 *  moving or changing source (one shaker after another) never bends a kernel already in the air, and while
 *  amountAt is flat nothing hangs in the air. width / height = the FULL heap in heap units (GrainHeap's height is
 *  0.36 x width); there is no kernel cap (the whole dome is filled). The resting kernels are cached strings, so a
 *  heap of several thousand kernels costs one path. */
const fedCache = new globalThis.Map<string, { body: string[]; crease: string[] }>();
export const GrainHeapFed: React.FC<{
  at: P2;
  scale: number;
  frame: number;
  amountAt: (f: number) => number;
  width?: number;
  height?: number;
  source?: (fLeave: number, kx: number) => P2 | null;
  flight?: number;
  arc?: number;
  tone?: number;
  seed?: number;
  ink?: Ink;
}> = ({ at, scale, frame, amountAt, width = 260, height, source, flight = 12, arc = 40, tone = 1, seed = 0, ink = ORANGE }) => {
  const W = width / 2;
  const H = height ?? width * 0.36;
  const ks = heapKernels(1e6, W, H, seed);
  const key = `${W}-${H}-${seed}`;
  const kd = (x: number, y: number, ang: number, s: number) => {
    const a = (ang * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const L = 5.6 * s;
    const R = 3.1 * s;
    const p = (u: number, v: number): P2 => [x + u * ca - v * sa, y + u * sa + v * ca];
    return { body: `M${P(p(-L, 0))}Q${P(p(-L * 0.7, -R * 1.4))} ${P(p(0, -R))}Q${P(p(L * 0.7, -R * 1.4))} ${P(p(L, 0))}Q${P(p(L * 0.7, R * 1.4))} ${P(p(0, R))}Q${P(p(-L * 0.7, R * 1.4))} ${P(p(-L, 0))}Z`, crease: `M${P(p(-L * 0.6, 0.2))}L${P(p(L * 0.6, 0.2))}` };
  };
  let cache = fedCache.get(key);
  if (!cache) {
    const c = { body: [] as string[], crease: [] as string[] };
    ks.forEach((k0) => {
      const d = kd(k0.x, k0.y, k0.ang, k0.s);
      c.body.push(d.body);
      c.crease.push(d.crease);
    });
    fedCache.set(key, c);
    cache = c;
  }
  const am = c01(amountAt(frame));
  const amF = c01(amountAt(frame + flight));
  // resting = the prefix with a <= am (sorted by arrival)
  let lo = 0;
  let hi = ks.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (ks[m].a <= am) lo = m + 1;
    else hi = m;
  }
  const nRest = lo;
  const flying: React.ReactNode[] = [];
  for (let i = nRest; i < ks.length && ks[i].a <= amF; i++) {
    const k0 = ks[i];
    // the frame it lands: amountAt(fl) = a, by bisection on [frame, frame + flight]
    let f0 = frame;
    let f1 = frame + flight;
    for (let it = 0; it < 14; it++) {
      const fm = (f0 + f1) / 2;
      if (amountAt(fm) >= k0.a) f1 = fm;
      else f0 = fm;
    }
    const fl = f1;
    const t = c01(1 - (fl - frame) / flight);
    const sw = source ? source(fl - flight, k0.x) : null;
    const s: P2 = sw ? [(sw[0] - at[0]) / scale, (sw[1] - at[1]) / scale] : [k0.x * 0.2, -H * 1.6 - 60];
    const lift = arc + 0.22 * Math.abs(k0.x - s[0]);
    const x = mix(s[0], k0.x, t) + (hash(i, 871 + seed) - 0.5) * 8 * (1 - t);
    const y = mix(s[1], k0.y, t) - lift * 4 * t * (1 - t);
    const d = kd(x, y, k0.ang + 260 * (1 - t) * (hash(i, 872 + seed) > 0.5 ? 1 : -1), k0.s);
    flying.push(<path key={i} d={d.body} fill={ink.main} stroke={DARK} strokeWidth={1.3} />);
  }
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
      {am > 0.002 ? <ellipse cx={0} cy={1} rx={W * Math.sqrt(am) * 1.08} ry={(8 * Math.sqrt(am) + 2) * Math.max(1, W / 130)} fill={DARK} fillOpacity={0.35} /> : null}
      <path d={cache.body.slice(0, nRest).join("")} fill={ink.main} stroke={DARK} strokeWidth={1.35} />
      <path d={cache.crease.slice(0, nRest).join("")} fill="none" stroke={ink.hair} strokeWidth={0.9} strokeOpacity={0.8} />
      {flying}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE REVIEW SHEET (world 2160 x 3840 seen at k = 0.5) and the probes
// ---------------------------------------------------------------------------
const SHEET_CAM: Cam = { x: 1080, y: 1920, k: 0.5 };
export const SHEET_FRAMES = 150;
const loopFall = (f: number, start = 20) => c01((f - start) / FALL.frames);
export const FarmersSheet: React.FC = () => {
  const f = useCurrentFrame();
  const S = 1.32; // 410 px tall in the world (205 px at k 0.5)
  const ph = f / WALK_CYCLE;
  const row1 = 900;
  const row2 = 1760;
  const row3 = 2460;
  const row4 = 3120;
  const row5 = 3700;
  const s45 = scaleForPx(90); // 45 px on screen at k 0.5
  // the walkers walk in place (the sheet is a reference; cuts advance `at` by walkAdvance)
  const fp = loopFall(f, 24);
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={SHEET_CAM}>
          {/* row 1: the cast, standing (idle) */}
          <GroundLine x0={60} x1={2100} y={row1} />
          <Farmer pose={idle(POSES.sheaf(1), f, 1)} at={[190, row1]} scale={S} uid="s1a" hold="sickle" holdFar="sheaf" />
          <Farmer pose={idle(POSES.hoeShoulder(1), f, 2)} at={[520, row1]} scale={S} uid="s1b" woman hold="hoe" />
          <Farmer pose={idle(POSES.stand(1), f, 3)} at={[790, row1]} scale={S} uid="s1c" child />
          <Forager pose={idle(POSES.spear(-1), f, 4)} at={[1230, row1]} scale={S} uid="s1d" />
          <Forager pose={idle(POSES.stand(-1), f, 5)} at={[1560, row1]} scale={S} uid="s1e" woman />
          <Forager pose={idle(POSES.stand(-1), f, 6)} at={[1840, row1]} scale={S} uid="s1f" child />
          <Farmer pose={idle(POSES.front(), f, 7)} at={[2040, row1]} scale={S * 0.72} uid="s1g" hold="none" />
          {/* row 2: the poses: walk, harvest, hoe; the forager walks; the fall */}
          <GroundLine x0={60} x1={2100} y={row2} />
          <WheatField x0={560} x1={820} y={row2 + 6} scale={S} rows={3} depth={22} g={f} cutX={560 + ((f * 2) % 260)} />
          <Farmer pose={walkLegs(POSES.sickle(1), ph)} at={[190, row2]} scale={S} uid="s2a" />
          <Farmer pose={POSES.harvest(1, f / 30)} at={[470, row2]} scale={S} uid="s2b" />
          <Farmer pose={POSES.hoe(1, f / 40)} at={[930, row2]} scale={S} uid="s2c" hold="hoe" />
          <Forager pose={walkLegs(POSES.spearTrail(-1), ph)} at={[1330, row2]} scale={S} uid="s2d" />
          <Forager pose={POSES.stand(1)} at={[1560, row2]} scale={S} uid="s2e" fall={fp} quiver={false} hold="none" />
          <Forager pose={POSES.stand(-1)} at={[2020, row2]} scale={S} uid="s2f" woman fall={loopFall(f, 44)} />
          {/* row 3: the analogy's figures (and their fall), the animals */}
          <GroundLine x0={60} x1={2100} y={row3} />
          <Spaniard at={[180, row3]} scale={S * 0.95} uid="s3a" />
          <Commoner pose={CAP_POSES.stand(1)} at={[400, row3]} scale={S * 0.95} uid="s3b" fall={loopFall(f, 34)} />
          <Goat at={[930, row3]} scale={S} g={f} walk={f / ANIMAL_WALK.cycle} uid="s3c" />
          <Goat at={[1150, row3]} scale={S} g={f} graze={1} dir={-1} uid="s3d" seed={2} />
          <Cow at={[1480, row3]} scale={S * 0.88} g={f} uid="s3e" />
          <Cow at={[1900, row3]} scale={S * 0.88} g={f} graze={0.5 + 0.5 * Math.sin(f / 20)} uid="s3f" seed={1} />
          {/* row 4: the props */}
          <GroundLine x0={60} x1={2100} y={row4} />
          <Longhouse at={[480, row4]} scale={0.42} uid="s4a" />
          <HideTent at={[1080, row4]} scale={0.62} uid="s4b" />
          <GrainHeap at={[1440, row4]} scale={S} amount={c01(f / 130)} width={240} pourFrom={[1440, row4 - 420]} />
          <Sheaf at={[1640, row4 - 58]} scale={S} uid="s4c" />
          <Sickle at={[1740, row4 - 60]} scale={S} angle={0} uid="s4d" />
          <Hoe at={[1930, row4 - 84]} scale={S} angle={0} uid="s4e" />
          <Spear at={[1840, row4 - 260]} scale={S * 0.62} angle={0} uid="s4f" />
          <Bow at={[2060, row4 - 150]} scale={S * 0.8} uid="s4g" />
          {/* row 5: germs from a farmer at close range, and the 45 px silhouettes */}
          <Farmer pose={idle(POSES.stand(1), f, 9)} at={[260, row5 + 120]} scale={S * 0.8} uid="s5a" hold="none" />
          <Germs frame={f} k={SHEET_CAM.k} sources={[{ ...farmAnchors("farmer", POSES.stand(1), [260, row5 + 120], S * 0.8).germ }]} rate={7} spread={1.4} drift={[0.9, 0]} life={130} microbe={20} />
          <Forager pose={idle(POSES.stand(-1), f, 10)} at={[800, row5 + 120]} scale={S * 0.8} uid="s5b" hold="none" quiver={false} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const kind: FarmKind = i < 3 ? "farmer" : "forager";
            const x = 1080 + i * 170;
            const pose = i === 1 ? POSES.harvest(1, f / 30) : i === 4 ? walkLegs(POSES.spearTrail(-1), ph) : i < 3 ? POSES.sickle(1) : POSES.spear(-1);
            return <FarmFigure key={i} kind={kind} pose={pose} at={[x, row5 + 60]} scale={s45} uid={`t${i}`} woman={i === 2 || i === 5} hold={i === 2 || i === 5 ? "none" : undefined} />;
          })}
          <Goat at={[1100, row5 + 140]} scale={s45} g={f} uid="t6" />
          <Cow at={[1280, row5 + 140]} scale={s45} g={f} uid="t7" />
          <Forager pose={POSES.stand(1)} at={[1500, row5 + 140]} scale={s45} uid="t8" fall={fp} />
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

/** probes for review, each a 1080 x 1920 frame at k 1:
 *    "fall"   a forager (front) and a farmer (back) sicken and fall, close (480 px tall)
 *    "walk"   a farmer and a forager walking across, 420 px
 *    "germs"  germs from a farmer drifting to a forager (travel), close range
 *    "wide"   the germ haze at a wide (k 0.12) from a column of sources on a bare page */
export const FarmersProbe: React.FC<{ which: "fall" | "walk" | "germs" | "wide" }> = ({ which }) => {
  const f = useCurrentFrame();
  if (which === "fall") {
    const cam: Cam = { x: 540, y: 900, k: 1 };
    const S = scaleForPx(480);
    const p = c01((f - 20) / FALL.frames);
    return (
      <AbsoluteFill>
        <Page>
          <WorldSvg cam={cam}>
            <GroundLine x0={40} x1={1040} y={1020} />
            <Farmer pose={idle(POSES.stand(1), f, 2)} at={[230, 1020]} scale={S * 0.8} uid="pf0" />
            <Forager pose={idle(POSES.spear(1), Math.min(f, 20), 1)} at={[420, 1020]} scale={S} uid="pf1" fall={p} />
          </WorldSvg>
        </Page>
      </AbsoluteFill>
    );
  }
  if (which === "walk") {
    const cam: Cam = { x: 540, y: 900, k: 1 };
    const S = scaleForPx(420);
    const ph = f / WALK_CYCLE;
    const adv = walkAdvance(S);
    return (
      <AbsoluteFill>
        <Page>
          <WorldSvg cam={cam}>
            <GroundLine x0={0} x1={1080} y={1000} />
            <Forager pose={walkLegs(POSES.spearTrail(1), ph)} at={[120 + adv * f, 1000]} scale={S} uid="pw0" />
            <Farmer pose={walkLegs(POSES.sickle(-1), ph + 0.3)} at={[980 - adv * f, 1000]} scale={S * 0.95} uid="pw1" />
            <Goat at={[1000 - adv * f + 170, 1000]} scale={S} g={f} dir={-1} walk={(f * adv) / (2 * ANIMAL_WALK.stride.goat * S)} uid="pw2" />
          </WorldSvg>
        </Page>
      </AbsoluteFill>
    );
  }
  if (which === "germs") {
    const cam: Cam = { x: 540, y: 860, k: 1 };
    const S = scaleForPx(460);
    const fa = farmAnchors("farmer", POSES.stand(1), [250, 1040], S);
    const ta = farmAnchors("forager", POSES.stand(-1), [820, 1040], S);
    return (
      <AbsoluteFill>
        <Page>
          <WorldSvg cam={cam}>
            <GroundLine x0={0} x1={1080} y={1040} />
            <Farmer pose={idle(POSES.stand(1), f, 1)} at={[250, 1040]} scale={S} uid="pg0" hold="none" />
            <Forager pose={idle(POSES.stand(-1), f, 2)} at={[820, 1040]} scale={S} uid="pg1" hold="none" quiver={false} />
            <Germs frame={f} k={cam.k} sources={[fa.germ]} targets={[ta.chest, ta.headC]} travel={0.75} travelTime={70} rate={10} life={120} spread={1.3} microbe={32} settle={60} />
          </WorldSvg>
        </Page>
      </AbsoluteFill>
    );
  }
  // the wide: k 0.12, sources along a column moving right
  const cam: Cam = { x: 4500, y: 8000, k: 0.12 };
  const src = Array.from({ length: 9 }, (_, i) => ({ at: (fr: number): P2 => [2600 + i * 260 + fr * 8, 5200 + i * 650 + 200 * Math.sin(i * 1.7)], rx: 420, ry: 320, rate: 6 }));
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam}>
          <Germs frame={f} k={cam.k} sources={src} life={160} spread={9} wander={220} drift={[4, 0]} mote={2.2} microbe={0} />
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// TURNS (addition, brief T, 2026-10-20; logged in SHARED_CHANGES.md; API in
// animation_source/notes/TURN_READY.md). Every export above draws exactly as
// before; these are new names.
//
// Why the legacy cast pops when it turns: texcocoFigures' Figure, and this
// file's FarmBody, decide the far arm's layer with a threshold on the body's
// yaw (|sin yaw| > 0.5: far arm BEHIND the body, else every arm in FRONT of it,
// sorted). Crossing it (yaw ~0.52 rad, ~30 deg off frontal) the far arm jumps
// from behind the torso to on top of it in one frame. The forager's back hair
// switches layer the same way on the head's yaw, and the rig's near ear appears
// at once at |sin headYaw| = 0.2. Cuts also turned the head and body with one
// linear lerp, in 2D, so the hands slid on straight lines.
//
// The turn-safe cast fixes the layers: the far arm stays behind the body for any
// turned yaw (its order can change only at yaw 0, where both arms hang beside
// the torso), an arm listed in frontArms keeps its forearm in front of the body
// (a cut along the elbow that moves with the arm), the back hair cross-fades
// between its two layers over a band of head yaw, and the near ear fades in
// before the rig's own ear takes over at exactly the same place. turnPose()
// turns a pose in the body's own 3D frame: one eased yaw drives everything, the
// hands and feet travel round the body axis, the head leads by a few frames,
// the knees give a little and the cloth lags.
// ---------------------------------------------------------------------------
export type TurnSafeOpts = {
  /** the turn-safe layering (the Turn* components set it) */
  turnSafe?: boolean;
  /** arms held IN FRONT of the body (a spear before him, a sickle at the chest): when such an arm is the far one, its
   *  forearm and tool are drawn over the body (rig names: armL = screen left when he faces us; facing right it is the near arm) */
  frontArms?: ("L" | "R")[];
  /** the rig arm that holds `hold` whatever the yaw (default: the near arm, which changes hands at yaw 0: a full turn
   *  through the front then swaps the tool to the other fist). Set it for any turn that passes through the front. */
  holdSide?: "L" | "R";
  /** the rig arm that holds `holdFar` (default: the other one) */
  holdFarSide?: "L" | "R";
};
/** aimTool for a fixed rig arm (L / R), so a tool keeps its angle in the same fist through a full turn */
export const aimToolSide = (q: FigPose, deg: number, side: "L" | "R", kind: FarmKind = "farmer", woman = false, child = false): FigPose => {
  const near = Math.sin(q.yaw) >= 0 ? "L" : "R";
  return aimTool(q, deg, side === near ? "near" : "far", kind, woman, child);
};
/** aimToolSide in WORLD degrees (0 = up, + clockwise on screen, never mirrored): through a full turn, interpolate the
 *  world angle (e.g. -2 facing left -> +84 facing right) and the tool never flips at yaw 0 */
export const aimToolWorld = (q: FigPose, worldDeg: number, side: "L" | "R", kind: FarmKind = "farmer", woman = false, child = false): FigPose =>
  aimToolSide(q, worldDeg * (Math.sin(q.yaw) >= 0 ? 1 : -1), side, kind, woman, child);
type RigArm = ReturnType<typeof figureRig>["armL"];
/** world-px half-plane beyond (a little before) the elbow, along the forearm: the part of a far arm drawn in front */
const forearmClip = (ar: RigArm, at: P2, scale: number) => {
  const u = norm(sub(ar.W, ar.E));
  const n: P2 = [-u[1], u[0]];
  const p0 = add(ar.E, mul(u, -7));
  const pts: P2[] = [add(p0, mul(n, 700)), add(add(p0, mul(n, 700)), mul(u, 900)), add(add(p0, mul(n, -700)), mul(u, 900)), add(p0, mul(n, -700))].map((v) => add(at, mul(v, scale)));
  return `M${pts.map(P).join("L")}Z`;
};
/** the rig's near ear (no ear plug) appears at once at |sin headYaw| = 0.2: this draws the same ear fading in over
 *  0.06 - 0.2, under the head, so the rig's own takes over without a jump */
const RigEarFade: React.FC<{ spec: Spec; pose: FigPose; at: P2; scale: number; ink: Ink; uid: string }> = ({ spec, pose, at, scale, ink, uid }) => {
  const hy = pose.headYaw;
  const sn = Math.sin(hy);
  const t = Math.abs(sn);
  if (spec.plug > 0 || t <= 0.06 || t >= 0.2) return null;
  const r = figureRig(spec, pose);
  const c = Math.cos(hy);
  const sg = sn < 0 ? -1 : 1;
  const w = mix(0.55, 1, t);
  const e: P2 = [sg * 20.6 * c - 5 * sn, 4];
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)}) translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${spec.headScale})`} opacity={sstep((t - 0.06) / 0.14)}>
      <Cased id={`${uid}-c`} r={1.4}>
        <ellipse cx={e[0]} cy={e[1]} rx={4.2 * w} ry={6.4} fill={ink.main} {...OUT} strokeWidth={1.9} />
        <path d={`M${(e[0] + sg * 1.6 * w).toFixed(1)},${e[1] - 3}q${(-sg * 3.4 * w).toFixed(1)},2.6 ${(-sg * 0.6 * w).toFixed(1)},6`} {...ln(1, 0.6)} />
      </Cased>
    </g>
  );
};

/** the rig's cloak knot (on the shoulder) appears at once when its surface angle clears the silhouette by 0.3 rad:
 *  this draws the same knot fading in over the last 0.25 rad before that, so the rig's own takes over without a jump */
const RigKnotFade: React.FC<{ spec: Spec; pose: FigPose; at: P2; scale: number; ink: Ink; uid: string }> = ({ spec, pose: q, at, scale, ink, uid }) => {
  if (spec.spaniard) return null;
  const A = spec.a;
  const c = Math.cos(q.yaw);
  const sn = Math.sin(q.yaw);
  if (Math.abs(sn) < 1e-6) return null;
  const term = Math.atan2(A * c, A * 0.58 * sn);
  const r = figureRig(spec, q);
  const knot: P2 = [-spec.hw + 9, r.shY - 6];
  const ph = Math.asin(clamp1(knot[0] / A));
  const margin = Math.min(term - 0.3 - ph, ph - (term - Math.PI + 0.3));
  if (margin >= 0 || margin <= -0.25) return null;
  const sf = surface(q.yaw, A, A * 0.58);
  const knotAt = sf.mF(knot);
  const kd = Math.max(0.25, Math.abs(sf.mF([knot[0] + 2, knot[1]])[0] - sf.mF([knot[0] - 2, knot[1]])[0]) / 4);
  return (
    <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)}) translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`} opacity={sstep((margin + 0.25) / 0.25)}>
      <Cased id={`${uid}-c`}>
        <g transform={`translate(${knotAt[0].toFixed(2)} ${knotAt[1].toFixed(2)}) scale(${kd.toFixed(3)} 1)`}>
          <path d={limbD([[[0, 0], 5.6], [[-4, 12], 5.2], [[-2.4, 23], 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={limbD([[[0, 0], 5.6], [[6, 10], 5.2], [[10.6, 19], 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d="M0,0l-12.6,-9q-5.8,3.6 -1.6,9.8ZM0,0l12.2,-8.4q5.6,4.6 1,10Z" fill={ink.main} {...OUT} strokeWidth={1.9} />
          <circle cx={0} cy={0} r={4.9} fill={ink.deep} {...OUT} strokeWidth={1.9} />
        </g>
      </Cased>
    </g>
  );
};
/** texcocoFigures' Figure drawn turn-safe: the body with no arms, the far arm behind it for any turned yaw, the near
 *  arm over it, the head drawn again on top (as the rig does: arms under the head), the near ear faded in */
export const TurnRigFigure: React.FC<{ spec: Spec; pose: FigPose; at: P2; scale: number; uid: string; ink?: Ink; tone?: number; frontArms?: ("L" | "R")[] }> = ({ spec, pose: q, at, scale, uid, ink = CREAM, tone = 1, frontArms }) => {
  const r = figureRig(spec, q);
  const farBack = Math.abs(r.s) > 1e-3;
  const far: ArmSide = r.s >= 0 ? "R" : "L";
  const near: ArmSide = far === "L" ? "R" : "L";
  const arm = (w: ArmSide, id: string) => <Figure spec={spec} pose={q} at={at} scale={scale} uid={`${uid}-${id}${w}`} body={false} arms={w} ink={ink} />;
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const torsoTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)}) rotate(${q.lean.toFixed(2)})`;
  const headTf = `translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${spec.headScale})`;
  const nod = Math.max(0, r.nodF);
  const faceClip = smoothClosed(blendYaw(FACE_F, FACE_P, q.headYaw).map((p): P2 => [p[0] * 1.08, p[1] * 1.07 + 5 * nod]));
  const headSpec: Spec = { ...spec, hw: 900, a: 900, hem: 0, cloak: "fret" };
  // figure-local: a hand above the shoulder, or an elbow up at it
  const raised = [r.armL, r.armR].some((ar) => ar.W[1] < ar.S[1] + 10 || ar.E[1] < ar.S[1] - 4);
  return (
    <g opacity={tone}>
      {farBack ? arm(far, "b") : null}
      <RigEarFade spec={spec} pose={q} at={at} scale={scale} ink={ink} uid={`${uid}-ef`} />
      <Figure spec={spec} pose={q} at={at} scale={scale} uid={uid} arms="none" ink={ink} />
      <RigKnotFade spec={spec} pose={q} at={at} scale={scale} ink={ink} uid={`${uid}-kf`} />
      {farBack
        ? arm(near, "n")
        : [r.armL, r.armR]
            .sort((p1, p2) => p1.z - p2.z)
            .map((ar) => <React.Fragment key={ar.sgn}>{arm(ar.sgn < 0 ? "L" : "R", "s")}</React.Fragment>)}
      {farBack && frontArms?.includes(far) ? (
        <>
          <clipPath id={`${uid}-fa`}>
            <path d={forearmClip(far === "L" ? r.armL : r.armR, at, scale)} />
          </clipPath>
          <g clipPath={`url(#${uid}-fa)`}>{arm(far, "f")}</g>
        </>
      ) : null}
      {raised ? (
        // an arm raised to the head: the head goes back on top, as in the rig
        <>
          <clipPath id={`${uid}-hc`}>
            <rect transform={`${tf} ${torsoTf}`} x={-70} y={r.shY - 130} width={140} height={100} />
            <path transform={`${tf} ${headTf}`} d={faceClip} />
          </clipPath>
          <g clipPath={`url(#${uid}-hc)`}>
            <Figure spec={headSpec} pose={q} at={at} scale={scale} uid={`${uid}-hd`} arms="none" ink={ink} />
          </g>
        </>
      ) : null}
    </g>
  );
};

type TurnCastProps = Omit<FarmFigureProps, "kind" | "uid"> & { uid?: string; frontArms?: ("L" | "R")[]; holdSide?: "L" | "R"; holdFarSide?: "L" | "R" };
/** the Farmer, turn-safe (same props as Farmer, plus frontArms) */
export const TurnFarmer: React.FC<TurnCastProps> = ({ uid = "tfrm", ...p }) => <FarmFigureCore kind="farmer" uid={uid} turnSafe {...p} />;
/** the Forager, turn-safe (same props as Forager, plus frontArms) */
export const TurnForager: React.FC<TurnCastProps> = ({ uid = "tfrg", ...p }) => <FarmFigureCore kind="forager" uid={uid} turnSafe {...p} />;
/** the TilmaCommoner, turn-safe (same props, plus frontArms) */
export const TurnTilmaCommoner: React.FC<{ pose: FigPose; at: P2; scale: number; uid?: string; ink?: Ink; tone?: number; fall?: number; fallDir?: 1 | -1; shadow?: boolean; frontArms?: ("L" | "R")[] }> = ({ pose, at, scale, uid = "ttcom", ink = CREAM, tone = 1, fall = 0, fallDir, shadow = true, frontArms }) => (
  <g opacity={tone}>
    <Sickening spec={TILMA_COMMONER_SPEC} pose={pose} p={fall} at={at} scale={scale} ink={ink} dir={fallDir} shadow={shadow}>
      {(q, inkNow) => <TurnRigFigure spec={TILMA_COMMONER_SPEC} pose={q} at={at} scale={scale} uid={uid} ink={inkNow} frontArms={frontArms} />}
    </Sickening>
  </g>
);
/** the Spaniard, turn-safe (same props, plus frontArms; variant 0 keeps his hand on the hilt: pass frontArms for it) */
export const TurnSpaniard: React.FC<{ variant?: 0 | 1; pose?: FigPose; at: P2; scale: number; uid?: string; ink?: Ink; tone?: number; fall?: number; fallDir?: 1 | -1; shadow?: boolean; frontArms?: ("L" | "R")[] }> = ({ variant = 0, pose, at, scale, uid = "tspa", ink = ORANGE, tone = 1, fall = 0, fallDir, shadow = true, frontArms }) => (
  <g opacity={tone}>
    <Sickening spec={SPANIARDS[variant]} pose={pose ?? SPANIARD_STAND[variant]} p={fall} at={at} scale={scale} ink={ink} dir={fallDir} shadow={shadow}>
      {(q, inkNow) => <TurnRigFigure spec={SPANIARDS[variant]} pose={q} at={at} scale={scale} uid={uid} ink={inkNow} frontArms={frontArms} />}
    </Sickening>
  </g>
);

// ---- the pose in the body's own frame ------------------------------------------------
/** an arm in the body's frame: w = the wrist [lat, y, fwd] (lat + = the body's screen-right side when he faces us,
 *  y = figure-local up (- y), fwd + = where he faces); elbow = the elbow's hint direction, the same axes */
export type Arm3 = { w: [number, number, number]; elbow: [number, number, number]; fist: number; hand: number };
/** a FigPose held in the body's frame: one yaw drives it; head = the head's yaw relative to the body (rad);
 *  feet = [lat, y, fwd] offsets from the rig's own leg roots */
export type Pose3 = Omit<FigPose, "yaw" | "headYaw" | "armL" | "armR" | "footL" | "footR"> & { yaw: number; head: number; armL: Arm3; armR: Arm3; footL: [number, number, number]; footR: [number, number, number] };
/** a screen x seen at yaw back into the body's frame [lat, fwd]: frontal views keep it lateral, profiles forward,
 *  blended by sin^2 (exact: projecting it again gives x back) */
const unproject = (x: number, c: number, s: number, lat0: number): [number, number] => {
  const w = s * s;
  const lat = Math.abs(c) > 1e-3 ? (1 - w) * (x / c) + w * lat0 : lat0;
  const fwd = Math.abs(s) > 1e-3 ? (x - lat * c) / s : 0;
  return [lat, fwd];
};
const proj = (lat: number, fwd: number, c: number, s: number) => lat * c + fwd * s;
/** read a 2D pose into the body's frame at its own yaw (hands assumed near the shoulders' width; exact when projected back) */
export const lift3 = (q: FigPose): Pose3 => {
  const c = Math.cos(q.yaw);
  const s = Math.sin(q.yaw);
  const arm = (a: ArmPose, sgn: number): Arm3 => {
    const [lat, fwd] = unproject(a.w[0], c, s, sgn * 38);
    const [el, ef] = unproject(a.elbow[0], c, s, sgn * 0.4);
    return { w: [lat, a.w[1], fwd], elbow: [el, a.elbow[1], ef], fist: a.fist, hand: a.hand };
  };
  const foot = (o: P2): [number, number, number] => {
    const [lat, fwd] = unproject(o[0], c, s, 0);
    return [lat, o[1], fwd];
  };
  return { ...q, yaw: q.yaw, head: q.headYaw - q.yaw, armL: arm(q.armL, -1), armR: arm(q.armR, 1), footL: foot(q.footL), footR: foot(q.footR) };
};
/** the 2D pose of a Pose3 seen at `yaw` (default its own), the head at `headYaw` (default yaw + head) */
export const flat3 = (p: Pose3, yaw = p.yaw, headYaw = yaw + p.head): FigPose => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const arm = (a: Arm3): ArmPose => ({ w: [proj(a.w[0], a.w[2], c, s), a.w[1]], elbow: [proj(a.elbow[0], a.elbow[2], c, s), a.elbow[1]], fist: a.fist, hand: a.hand });
  const { head: _h, armL, armR, footL, footR, ...rest } = p;
  return { ...rest, yaw, headYaw, armL: arm(armL), armR: arm(armR), footL: [proj(footL[0], footL[2], c, s), footL[1]], footR: [proj(footR[0], footR[2], c, s), footR[1]] };
};
const mixA3 = (a: Arm3, b: Arm3, t: number): Arm3 => ({
  w: [mix(a.w[0], b.w[0], t), mix(a.w[1], b.w[1], t), mix(a.w[2], b.w[2], t)],
  elbow: [mix(a.elbow[0], b.elbow[0], t), mix(a.elbow[1], b.elbow[1], t), mix(a.elbow[2], b.elbow[2], t)],
  fist: mix(a.fist, b.fist, t),
  hand: mix(a.hand, b.hand, t),
});
const mixV3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
/** two body-frame poses blended (every channel linear) */
export const mix3 = (a: Pose3, b: Pose3, t: number): Pose3 => ({
  yaw: mix(a.yaw, b.yaw, t),
  head: mix(a.head, b.head, t),
  roll: mix(a.roll, b.roll, t),
  pitch: mix(a.pitch, b.pitch, t),
  lean: mix(a.lean, b.lean, t),
  crouch: mix(a.crouch, b.crouch, t),
  armL: mixA3(a.armL, b.armL, t),
  armR: mixA3(a.armR, b.armR, t),
  footL: mixV3(a.footL, b.footL, t),
  footR: mixV3(a.footR, b.footR, t),
  liftL: mix(a.liftL, b.liftL, t),
  liftR: mix(a.liftR, b.liftR, t),
  brow: mix(a.brow, b.brow, t),
  lids: mix(a.lids, b.lids, t),
  mouth: mix(a.mouth, b.mouth, t),
  hem: mix(a.hem, b.hem, t),
});
const smoother = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export type TurnOpts = {
  /** frames the head leads the body (default 5) */
  headLead?: number;
  /** units the knees give at mid-turn (default 6) */
  dip?: number;
  /** units the stepping foot lifts (default 9; 0 = no step) */
  step?: number;
  /** units the hem lags the turn (default 5) */
  sway?: number;
};
/** a person turning from `from` to `to` (any two FigPoses, any yaws) over frames f0..f1: the pose at frame f.
 *  One eased yaw (smootherstep) drives the body; hands, elbows and feet move in the body's frame and are projected
 *  at that yaw (so they travel round the body axis, no straight 2D slides); the head leads by headLead frames; the
 *  knees give a little mid-turn, the hem lags, and the foot that ends up behind lifts once and replants. Before f0
 *  and after f1 it returns from / to exactly. Re-aim a held tool after it (aimTool) as before. */
export const turnPose = (from: FigPose, to: FigPose, f: number, f0: number, f1: number, o: TurnOpts = {}): FigPose => {
  const { headLead = 5, dip = 6, step = 9, sway = 5 } = o;
  if (f <= f0 - headLead) return from;
  if (f >= f1) return to;
  const span = Math.max(1, f1 - f0);
  const e = smoother((f - f0) / span);
  const eh = smoother((f - f0 + headLead) / span);
  const m = mix3(lift3(from), lift3(to), e);
  const yaw = mix(from.yaw, to.yaw, e);
  const headYaw = mix(from.headYaw, to.headYaw, eh);
  const q = flat3(m, yaw, headYaw);
  const bump = Math.sin(Math.PI * e);
  const turnDir = Math.sign(to.yaw - from.yaw) || 1;
  // the foot on the far side at the end lifts and replants (sgn: L = -1)
  const endFarIsR = Math.sin(to.yaw) >= 0;
  const u = c01((e - 0.15) / 0.6);
  const lift = step * Math.sin(Math.PI * u) ** 1.5;
  return {
    ...q,
    crouch: q.crouch + dip * bump,
    hem: q.hem - sway * turnDir * bump,
    footL: endFarIsR ? q.footL : [q.footL[0], q.footL[1] - lift],
    footR: endFarIsR ? [q.footR[0], q.footR[1] - lift] : q.footR,
    liftL: endFarIsR ? q.liftL : q.liftL + Math.sign(Math.sin(yaw) || 1) * 18 * Math.sin(Math.PI * u),
    liftR: endFarIsR ? q.liftR + Math.sign(Math.sin(yaw) || 1) * 18 * Math.sin(Math.PI * u) : q.liftR,
  };
};

/** ADDITION (brief T): POSES.hoe jumps once per stroke (at the cycle's wrap the hands snap from the pulled-back
 *  position to the strike, the blade 18 deg): this loop is continuous all the way round. phase 0 = the blade in the
 *  ground; 0-0.3 pull back, 0.3-0.75 raise over the shoulder, 0.75-0.87 strike, 0.87-1 dig in (back to phase 0).
 *  ~40 frames per stroke; hold "hoe". */
export const hoeLoop = (dir: 1 | -1 = 1, phase = 0): FigPose => {
  const ph = phase - Math.floor(phase);
  const down: P2 = [96, -108];
  const back: P2 = [64, -138];
  const up: P2 = [30, -270];
  let w: P2;
  let ang: number;
  let lift: number; // 0 = stooped over the blade, 1 = upright with it raised
  if (ph < 0.3) {
    const u = sstep(ph / 0.3);
    w = mix2(down, back, u);
    ang = mix(178, 160, u);
    lift = 0.15 * u;
  } else if (ph < 0.75) {
    const u = sstep((ph - 0.3) / 0.45);
    w = [mix(back[0], up[0], u), mix(back[1], up[1], u) - 30 * Math.sin(Math.PI * u)];
    ang = mix(160, -40, u);
    lift = mix(0.15, 1, u);
  } else if (ph < 0.87) {
    const u = ((ph - 0.75) / 0.12) ** 2; // the strike accelerates into the ground
    w = mix2(up, down, u);
    ang = mix(-40, 178, u);
    lift = 1 - u;
  } else {
    const u = sstep((ph - 0.87) / 0.13);
    w = [down[0] + 3 * Math.sin(Math.PI * u), down[1] + 4 * Math.sin(Math.PI * u)];
    ang = 178;
    lift = 0;
  }
  const base: FigPose = {
    ...SIDE,
    lean: 14 + 12 * (1 - lift),
    crouch: 18 + 10 * (1 - lift),
    pitch: 10,
    footL: [-26, 0],
    footR: [30, 0],
    armL: { w, elbow: [-0.6, 0.8], fist: 1, hand: 0 },
    armR: { w: [w[0] - 26, w[1] + 34], elbow: [-0.5, 1], fist: 1, hand: 0 },
    brow: 0.5,
  };
  const q = aimTool(base, ang);
  return dir === 1 ? q : mirrorPose(q);
};
