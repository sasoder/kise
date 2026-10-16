// ---------------------------------------------------------------------------
// captureFigures: the shared cast of the "Capture, not kill" clip (Dwarkesh
// Patel with Si Sheppard, Oct 2026), built ON the articulated engraved rig of
// texcocoFigures (same Spec / FigPose / IK / yaw, same inks, same manner):
//   Commoner   an Aztec man: plain tilmatli knotted on one shoulder, maxtlatl, cropped hair
//   Warrior    the SAME body: quilted ichcahuipilli, topknot, chimalli + macuahuitl
//              (armed 0..1 blends the commoner into the warrior)
//   Totonac    captive: bare chest, maxtlatl, bobbed hair, ear spools, wrists bound
//   Chichimec  captive: long loose hair, lean bare torso, hide loincloth, bow and
//              quiver on the back, wrists bound
//   Shield, Macuahuitl, Rope   free props (world px)
//
// HOW: texcocoFigures' <Figure> always wears a cloak, so each man is LAYERED:
// the rig's own legs (a Figure clipped below the hips), its own arms
// (body={false}) and its own head (a Figure clipped to the head), and between
// them a torso + costume drawn here in the same engraver's hand. Nothing in
// texcocoFigures is edited or forked; poses, poseTrack, walkPose, idle,
// figureAnchors all work unchanged with CAST_SPECS[kind].
//
// Draw inside a WorldSvg. Figure-local units: feet at (0, 0), a man ~310 tall.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { DARK, hash, type P2 } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { CREAM, Figure, ORANGE, STAND, figureAnchors, figureRig, type ArmPose, type FigPose, type Ink, type Spec } from "../kits/maps/texcocoFigures";
import { TexcocoPage, WALK, WorldSvg, walkPose } from "../kits/maps/texcocoShared";

export { CREAM, ORANGE, STAND };
export type { FigPose, Ink };

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
const foldHatchSegs = (a: P2, c: P2, b: P2, seed: number, len = 11, step = 0.04): Seg[] => {
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

// ---------------------------------------------------------------------------
// THE CAST'S BUILDS (texcocoFigures' Spec; use these with figureRig / figureAnchors)
// ---------------------------------------------------------------------------
export type CastKind = "commoner" | "warrior" | "totonac" | "chichimec";
const AZTEC: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };
export const CAST_SPECS: Record<CastKind, Spec> = {
  commoner: AZTEC,
  warrior: AZTEC,
  totonac: { ...AZTEC, a: 52, hw: 43, H: 92, hipY: -150, limb: 0.98, hair: "jaw", plug: 6.6, leg: [69, 67] },
  chichimec: { ...AZTEC, a: 50, hw: 42, H: 95, hipY: -156, limb: 0.9, headScale: 1.05, hair: "long", arm: [60, 56], leg: [72, 70] },
};
const DEFAULT_INK: Record<CastKind, Ink> = { commoner: CREAM, warrior: ORANGE, totonac: CREAM, chichimec: CREAM };

// ---------------------------------------------------------------------------
// PROPS: the chimalli, the macuahuitl, the rope
// ---------------------------------------------------------------------------
/** shield radius and club length, figure units (multiply by the figure's scale) */
export const SHIELD_R = 38;
export const CLUB_LEN = 132;

const ShieldArt: React.FC<{ ink: Ink; uid: string }> = ({ ink, uid }) => {
  const R = SHIELD_R;
  const feathers = Array.from({ length: 11 }, (_, i) => {
    const th = ((18 + (i * 144) / 10) * Math.PI) / 180;
    const p: P2 = [R * 0.93 * Math.cos(th), R * 0.93 * Math.sin(th)];
    const d = norm([Math.cos(th) * 0.3, 1]);
    const L = 20 + 5 * hash(i, 611) + 5 * Math.sin(th);
    return { p, mid: add(p, mul(d, L * 0.55)), tip: add(p, mul(d, L)), i };
  });
  const balls: P2[] = [[-11, -17], [11, -17], [-21, 0], [0, 0], [21, 0], [-11, 17], [11, 17]];
  return (
    <g>
      {/* the hanging feather fringe along the lower edge */}
      {feathers.map((f) => (
        <g key={f.i}>
          <path d={limbD([[f.p, 9], [f.mid, 9.6], [f.tip, 4.6]])} fill={f.i % 2 ? ink.deep : ink.main} {...OUT} strokeWidth={1.8} />
          <path d={`M${P(mix2(f.p, f.tip, 0.25))}L${P(mix2(f.p, f.tip, 0.92))}`} {...ln(0.9, 0.6)} />
        </g>
      ))}
      <clipPath id={`${uid}-d`}>
        <circle r={R} />
      </clipPath>
      <circle r={R} fill={ink.main} {...OUT} strokeWidth={2.6} />
      <g clipPath={`url(#${uid}-d)`}>
        <path d={hatchD(4, -R, R, R, 114, 2.8, 601)} {...ln(0.95, 0.55)} />
        <path d={hatchD(18, -10, R, R, 58, 3.4, 602)} {...ln(0.9, 0.45)} />
      </g>
      <circle r={R - 7.5} {...ln(1.5, 0.85)} />
      <circle r={R - 5} {...ln(0.9, 0.5)} />
      <path d={Array.from({ length: 16 }, (_, i) => `M${P(rot([0, -(R - 7)], i * 22.5))}L${P(rot([0, -(R - 1.4)], i * 22.5))}`).join("")} {...ln(1.1, 0.6)} />
      {/* the field: seven balls of feather down (ihuiteteyo) */}
      {balls.map((b, i) => (
        <g key={i}>
          <circle cx={b[0]} cy={b[1]} r={5.6} fill={ink.deep} {...OUT} strokeWidth={1.7} />
          <path d={`M${b[0] + 0.6},${b[1] - 3.6}l3,3.4M${b[0] - 0.8},${b[1] - 1}l3.4,3.8M${b[0] - 2.6},${b[1] + 1}l2.4,2.6`} {...ln(0.85, 0.6)} />
        </g>
      ))}
    </g>
  );
};
/** the chimalli as a free object. at = its centre (world px), scale = px per figure
 *  unit (radius = SHIELD_R * scale); lying 0..1 lays it flat on the ground. */
export const Shield: React.FC<{ at: P2; scale: number; rot?: number; lying?: number; tone?: number; ink?: Ink; uid?: string }> = ({ at, scale, rot: r = 0, lying = 0, tone = 1, ink = ORANGE, uid = "chim" }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${r.toFixed(2)}) scale(${scale.toFixed(4)} ${(scale * (1 - 0.62 * c01(lying))).toFixed(4)})`} opacity={tone}>
    <Cased id={`${uid}-case`} r={1.4}>
      <ShieldArt ink={ink} uid={uid} />
    </Cased>
  </g>
);

const ClubArt: React.FC<{ ink: Ink; uid: string }> = ({ ink, uid }) => {
  // grip at (0, 0), the blade toward - y
  const L = CLUB_LEN;
  const y0 = -24;
  const y1 = -(L - 14);
  const PADDLE = `M-4.6,${y0}L-9.4,${y0 - 12}L-10,${y1 + 3}Q-10,${y1 - 2} -6,${y1 - 3}L6,${y1 - 3}Q10,${y1 - 2} 10,${y1 + 3}L9.4,${y0 - 12}L4.6,${y0}Z`;
  const n = 7;
  const teeth = [-1, 1].flatMap((sd) =>
    Array.from({ length: n }, (_, i) => {
      const ya = mix(y0 - 13, y1 + 4, i / n);
      const yb = mix(y0 - 13, y1 + 4, (i + 1) / n) - 1.2;
      const xe = sd * 9.2;
      return `M${xe},${ya.toFixed(1)}L${xe + sd * 6.6},${(ya - 1).toFixed(1)}L${xe + sd * 6.6},${(yb + 1).toFixed(1)}L${xe},${yb.toFixed(1)}Z`;
    }),
  );
  return (
    <g>
      <clipPath id={`${uid}-p`}>
        <path d={PADDLE} />
      </clipPath>
      {/* the obsidian blades: dark, set in a row down each edge */}
      {teeth.map((d, i) => (
        <path key={i} d={d} fill={ink.hair} {...OUT} strokeWidth={1.7} />
      ))}
      <path d={teeth.map((_, i) => `M${(i < n ? -1 : 1) * 11.5},${(mix(y0 - 13, y1 + 4, ((i % n) + 0.25) / n)).toFixed(1)}l${(i < n ? -1 : 1) * 3.4},${-2.6}`).join("")} {...ln(0.9, 0.7)} />
      {/* the handle with its knob, the flat wooden blade */}
      <path d={limbD([[[0, 16], 8.6], [[0, 12], 6.4], [[0, -8], 6.6], [[0, y0 - 6], 9]])} fill={ink.deep} {...OUT} strokeWidth={2} />
      <path d={PADDLE} fill={ink.main} {...OUT} strokeWidth={2.2} />
      <g clipPath={`url(#${uid}-p)`}>
        <path d={hatchD(1.5, y1 - 4, 11, y0, 96, 2.4, 621, 0.2)} {...ln(0.9, 0.55)} />
        <path d={`M0,${y0 - 8}L0,${y1 + 8}`} {...ln(1.1, 0.6)} />
        <path d={`M-4.6,${y0 - 20}L-4.6,${y1 + 16}`} {...ln(0.8, 0.35)} />
      </g>
      <path d="M-3.4,9h6.8M-3.4,5h6.8M-3.4,1h6.8" {...ln(0.9, 0.55)} />
    </g>
  );
};
/** the macuahuitl as a free object. at = the grip (world px), angle deg (0 = blade
 *  straight up, + = clockwise; 90 lies it on the ground pointing right), scale = px per figure unit. */
export const Macuahuitl: React.FC<{ at: P2; scale: number; angle?: number; tone?: number; ink?: Ink; uid?: string }> = ({ at, scale, angle = 0, tone = 1, ink = ORANGE, uid = "macu" }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${angle.toFixed(2)}) scale(${scale.toFixed(4)})`} opacity={tone}>
    <Cased id={`${uid}-case`} r={1.4}>
      <ClubArt ink={ink} uid={uid} />
    </Cased>
  </g>
);

/** a point of the rope at t 0..1 (slack 0 = taut and straight, 1 = a deep sag) */
export const ropePoint = (from: P2, to: P2, slack: number, t: number): P2 => {
  const d = vlen(sub(to, from));
  const sag = c01(slack) * (0.34 * d + 24);
  const p = mix2(from, to, t);
  return [p[0], p[1] + sag * 4 * t * (1 - t)];
};
/** an engraved rope between two world points: cream with a dark casing, twisted.
 *  slack 0..1; width in world px; drawn 0..1 pays it out from `from`. */
export const Rope: React.FC<{ from: P2; to: P2; slack?: number; width?: number; drawn?: number; tone?: number; ink?: Ink }> = ({ from, to, slack = 0.3, width = 7, drawn = 1, tone = 1, ink = CREAM }) => {
  const dr = c01(drawn);
  if (dr <= 0.002) return null;
  const d = vlen(sub(to, from));
  const n = Math.max(8, Math.ceil((d * dr) / (width * 0.95)));
  const pts = Array.from({ length: n + 1 }, (_, i) => ropePoint(from, to, slack, (i / n) * dr));
  const path = `M${pts.map(P).join("L")}`;
  let ticks = "";
  for (let i = 1; i < n; i++) {
    const u = norm(sub(pts[i + 1], pts[i - 1]));
    const nr: P2 = [-u[1], u[0]];
    const a = add(pts[i], add(mul(nr, width * 0.42), mul(u, width * 0.34)));
    const b = add(pts[i], add(mul(nr, -width * 0.42), mul(u, -width * 0.34)));
    ticks += `M${P(a)}L${P(b)}`;
  }
  return (
    <g opacity={tone}>
      <path d={path} fill="none" stroke={DARK} strokeOpacity={0.9} strokeWidth={width + 3.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={ink.main} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={ink.deep} strokeWidth={width * 0.34} strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${(width * 0.24).toFixed(2)})`} />
      <path d={ticks} fill="none" stroke={DARK} strokeOpacity={0.72} strokeWidth={Math.max(0.9, width * 0.17)} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// WHAT HE CARRIES, from the rig (figure-local units)
// ---------------------------------------------------------------------------
export type GearOpts = {
  /** which arm holds the club ("L" = the arm on screen left when he faces us). Default: the FAR arm; the shield is on the other */
  clubArm?: "L" | "R";
};
const gear = (sp: Spec, q: FigPose, o: GearOpts = {}) => {
  const r = figureRig(sp, q);
  const farIsR = r.s >= 0;
  const clubArm = o.clubArm ?? (farIsR ? "R" : "L");
  const ca = clubArm === "L" ? r.armL : r.armR;
  const sa = clubArm === "L" ? r.armR : r.armL;
  const G = r.s >= 0 ? 1 : -1;
  const v = rot(ca.dir, -90 * G);
  const grip = add(ca.W, mul(ca.dir, 9 * sp.limb));
  const bindAt = mix2(r.armL.W, r.armR.W, 0.5);
  return {
    r,
    clubArm,
    shieldArm: (clubArm === "L" ? "R" : "L") as "L" | "R",
    ca,
    sa,
    grip,
    clubDir: v,
    clubAngle: (Math.atan2(v[0], -v[1]) * 180) / Math.PI,
    shieldAt: add(mix2(sa.E, sa.W, 0.78), [0, 4]),
    bindAt,
  };
};
/** his anchors in WORLD px: everything figureAnchors gives (headC, crown, headTop,
 *  shoulderL/R, wristL/R, handL/R, chest, hip, feet, rig) plus
 *    bind       the middle of the bound wrists (tie the Rope here)
 *    shieldAt   the centre of the shield on his forearm
 *    clubGrip, clubAngle, clubTip   the macuahuitl in his fist
 *    farHand, nearHand   the fists of the far / near arm (the rope hand of the lead pose is farHand) */
export const captureAnchors = (kind: CastKind, pose: FigPose, at: P2, scale: number, o: GearOpts = {}) => {
  const sp = CAST_SPECS[kind];
  const A = figureAnchors(sp, pose, at, scale);
  const g = gear(sp, pose, o);
  const w = (v: P2): P2 => add(at, mul(v, scale));
  const farIsR = g.r.s >= 0;
  return {
    ...A,
    bind: w(g.bindAt),
    shieldAt: w(g.shieldAt),
    clubGrip: w(g.grip),
    clubAngle: g.clubAngle,
    clubTip: w(add(g.grip, mul(g.clubDir, CLUB_LEN - 14))),
    farHand: farIsR ? A.handR : A.handL,
    nearHand: farIsR ? A.handL : A.handR,
  };
};

// ---------------------------------------------------------------------------
// THE FIGURE
// ---------------------------------------------------------------------------
export type CaptureFigureProps = {
  kind: CastKind;
  pose: FigPose;
  /** his feet, world px, and px per unit (a man is ~310 units: 700 px tall = scale 2.26) */
  at: P2;
  scale: number;
  uid: string;
  /** default: commoner CREAM, warrior ORANGE, captives CREAM */
  ink?: Ink;
  tone?: number;
  /** commoner / warrior only: 0 = cloak and cropped hair, 1 = quilted armour and topknot (default: 1 for the warrior, 0 for the commoner) */
  armed?: number;
  /** draw the shield on his forearm / the club in his fist (default: both for the warrior, neither otherwise) */
  shield?: boolean;
  club?: boolean;
  clubArm?: "L" | "R";
  /** the cord round his wrists (default: true for the two captives) */
  bound?: boolean;
};
export const CaptureFigure: React.FC<CaptureFigureProps> = ({ kind, pose: q, at, scale, uid, ink: inkIn, tone = 1, armed: armedIn, shield: shieldIn, club: clubIn, clubArm, bound: boundIn }) => {
  const sp = CAST_SPECS[kind];
  const ink = inkIn ?? DEFAULT_INK[kind];
  const aztec = kind === "commoner" || kind === "warrior";
  const armed = aztec ? c01(armedIn ?? (kind === "warrior" ? 1 : 0)) : 0;
  const hasShield = shieldIn ?? kind === "warrior";
  const hasClub = clubIn ?? kind === "warrior";
  const bound = boundIn ?? !aztec;
  const g = gear(sp, q, { clubArm });
  const r = g.r;
  const { c, s } = r;
  const k = sp.limb;
  const hw = sp.hw;
  const shY = r.shY;
  const sfT = surface(q.yaw, hw * 0.94, hw * 0.94 * 0.58);
  const sfC = surface(q.yaw, sp.a, sp.a * 0.58);
  const sfH = surface(q.yaw, 31, 31 * 0.6);
  const { side } = sfT;
  const mT = sfT.mF;
  const wPt = (v: P2): P2 => add(at, mul(v, scale));
  const tf = `translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) scale(${scale.toFixed(4)})`;
  const hipTf = `translate(${r.hip[0].toFixed(2)} ${r.hip[1].toFixed(2)})`;
  const torsoTf = `${hipTf} rotate(${q.lean.toFixed(2)})`;
  const headTf = `translate(${r.headC[0].toFixed(2)} ${r.headC[1].toFixed(2)}) rotate(${r.headAngle.toFixed(2)}) scale(${sp.headScale})`;
  const shL: P2 = [-hw, shY];
  const shR: P2 = [hw, shY];
  const neck: P2 = [0, shY];
  const lean = kind === "chichimec";

  // ---- the rig's own legs, arms and head, cut out of texcocoFigures' Figure -----
  const legSpec: Spec = { ...sp, hem: shY + 42, cloak: "fret" };
  const headSpec: Spec = { ...sp, hw: 900, a: 900, hem: 0, cloak: "fret" };
  const nod = Math.max(0, r.nodF);
  const faceClip = smoothClosed(blendYaw(FACE_F, FACE_P, q.headYaw).map((p): P2 => [p[0] * 1.08, p[1] * 1.07 + 5 * nod]));
  const hairClip = smoothClosed(hairPts(sp.hair, q.headYaw).map((p): P2 => [p[0] * 1.07, p[1] * 1.06]));
  const NECK = limbD([[add(r.neck, [0, 5]), 21 * k * (0.8 + 0.2 * sfT.wf)], [mix2(r.neck, add(r.headC, [-7 * r.hs * sp.headScale, 0]), 0.78), 16.5 * k]]);
  const profile = Math.abs(s) > 0.5;
  const farArm: "L" | "R" = s >= 0 ? "R" : "L";
  const nearArm: "L" | "R" = farArm === "L" ? "R" : "L";
  const armEl = (w: "L" | "R") => <Figure spec={sp} pose={q} at={at} scale={scale} uid={`${uid}-a${w}`} body={false} arms={w} ink={ink} />;
  const clubEl = hasClub ? <Macuahuitl at={wPt(g.grip)} angle={g.clubAngle} scale={scale} ink={ink} uid={`${uid}-club`} /> : null;
  const shieldEl = hasShield ? <Shield at={wPt(g.shieldAt)} scale={scale} ink={ink} uid={`${uid}-sh`} /> : null;
  const withGear = (w: "L" | "R", far: boolean) => (
    <React.Fragment key={w}>
      {g.clubArm === w ? clubEl : null}
      {g.shieldArm === w && far ? shieldEl : null}
      {armEl(w)}
      {g.shieldArm === w && !far ? shieldEl : null}
    </React.Fragment>
  );

  // ---- the bare torso (torso frame: hips (0, 0), shoulders at y = shY) ------------
  const wst = lean ? 24 : 27;
  const TORSO =
    `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}` +
    `C${P(side([hw + 1, shY + 24]))} ${P(side([wst + 5, -54]))} ${P(side([wst, -30]))}C${P(side([wst, -16]))} ${P(side([29, -8]))} ${P(side([29, 4]))}L${P(side([27, 12]))}L${P(side([-27, 12]))}L${P(side([-29, 4]))}` +
    `C${P(side([-29, -8]))} ${P(side([-wst, -16]))} ${P(side([-wst, -30]))}C${P(side([-wst - 5, -54]))} ${P(side([-hw - 1, shY + 24]))} ${P(side(add(shL, [1, -4])))}Z`;
  const pec = (sd: number) => `M${P(mT([sd * 3, shY + 35]))}Q${P(mT([sd * 20, shY + 43]))} ${P(mT([sd * (hw - 9), shY + 27]))}`;
  const collar = (sd: number) => `M${P(mT([sd * 6, shY + 7]))}Q${P(mT([sd * 18, shY + 4]))} ${P(mT([sd * (hw - 10), shY + 5]))}`;
  const ribs = [-1, 1].flatMap((sd) => [0, 1, 2].map((i) => `M${P(mT([sd * (9 + i * 2), shY + 50 + i * 8]))}Q${P(mT([sd * 19, shY + 56 + i * 8]))} ${P(mT([sd * (wst + 1), shY + 49 + i * 8]))}`)).join("");
  const torsoArt = (
    <>
      <clipPath id={`${uid}-torso`}>
        <path d={TORSO} />
      </clipPath>
      <path d={TORSO} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-torso)`}>
        <path d={segD(hatchSegs(hw * 0.34, shY + 4, hw + 2, 12, 115, 2.7, 43), side)} {...ln(0.95, 0.6)} />
        <path d={segD(hatchSegs(hw * 0.52, shY + 30, hw + 2, 12, 60, 3.3, 44), side)} {...ln(0.9, 0.42)} />
        <path d={pec(1) + pec(-1)} {...ln(1.3, 0.75)} />
        <path d={collar(1) + collar(-1)} {...ln(1.1, 0.6)} />
        <path d={`M${P(mT([0, shY + 14]))}L${P(mT([0, shY + 36]))}M${P(mT([0, shY + 46]))}L${P(mT([0, -24]))}`} {...ln(1, 0.45)} />
        <path d={`M${P(mT([-3, -17]))}Q${P(mT([0, -13]))} ${P(mT([3, -17]))}`} {...ln(1.2, 0.7)} />
        {lean ? <path d={ribs} {...ln(1, 0.55)} /> : <path d={`M${P(mT([-12, shY + 58]))}Q${P(mT([0, shY + 62]))} ${P(mT([12, shY + 58]))}`} {...ln(0.9, 0.35)} />}
      </g>
    </>
  );

  // ---- the hips and the loincloth (hip frame: it stays with the legs) -------------
  const fx = sfH.mF([0, 0])[0];
  const fw = Math.max(3.4, 8.2 * c + 2.2);
  const sway = q.hem * 0.6;
  const PELVIS = smoothClosed([side([-29, -8]), side([0, -11]), side([29, -8]), side([30, 6]), side([22, 15]), side([0, 16]), side([-22, 15]), side([-30, 6])]);
  const BELT = `M${P(side([-30.5, -9]))}Q${P([fx * 0.4, -5])} ${P(side([30.5, -9]))}L${P(side([31, 4]))}Q${P([fx * 0.4, 9])} ${P(side([-31, 4]))}Z`;
  const FLAP = `M${fx - fw},1L${fx + fw},1L${(fx + fw + 1.8 + sway).toFixed(1)},52L${(fx - fw - 1.8 + sway).toFixed(1)},52Z`;
  const flapX = (y: number, u: number) => fx + u * (fw + (1.8 * (y - 1)) / 51) + (sway * (y - 1)) / 51;
  const maxtlatl = (
    <>
      <path d={PELVIS} fill={ink.main} {...OUT} />
      <path d={BELT} fill={ink.main} {...OUT} />
      <path d={`M${P(side([-30, -3]))}Q${P([fx * 0.4, 1.6])} ${P(side([30, -3]))}`} {...ln(1, 0.6)} />
      <path d={segD(hatchSegs(10, -9, 31, 6, 110, 2.6, 51), side)} {...ln(0.9, 0.5)} />
      {/* the end hanging in front, with its border */}
      <path d={FLAP} fill={ink.main} {...OUT} />
      <path d={`M${flapX(42, -1).toFixed(1)},42H${flapX(42, 1).toFixed(1)}M${flapX(46, -1).toFixed(1)},46H${flapX(46, 1).toFixed(1)}`} {...ln(1.2, 0.75)} />
      <path d={[-0.6, -0.2, 0.2, 0.6].map((u) => `M${flapX(47, u).toFixed(1)},47.4V51`).join("")} {...ln(0.9, 0.6)} />
      <path d={`M${flapX(8, 0.2).toFixed(1)},8L${flapX(38, 0.3).toFixed(1)},38`} {...ln(1, 0.55)} />
      <path d={[12, 17, 22, 27, 32, 37].map((y) => `M${flapX(y, 0.42).toFixed(1)},${y}L${flapX(y + 3, 0.96).toFixed(1)},${y + 3}`).join("")} {...ln(0.9, 0.5)} />
      {/* the knot */}
      <path d={`M${fx},0l${-9.5 * Math.max(0.4, c)},-6.4q-4.6,3 -1,7.6ZM${fx},0l${9.5 * Math.max(0.4, c)},-6q4.4,3.6 0.8,7.6Z`} fill={ink.main} {...OUT} strokeWidth={1.8} />
      <circle cx={fx} cy={0} r={4.4} fill={ink.deep} {...OUT} strokeWidth={1.8} />
    </>
  );
  const hideZ: P2[] = [[31, 13], [25, 27], [18, 19], [10, 33], [2, 23], [-7, 35], [-15, 22], [-23, 31], [-31, 15]];
  const HIDE = `M${P(side([-30.5, -10]))}Q${P([fx * 0.4, -6])} ${P(side([30.5, -10]))}L${hideZ.map((p) => P(side(p))).join("L")}Z`;
  const hideKilt = (
    <>
      <path d={PELVIS} fill={ink.main} {...OUT} />
      <clipPath id={`${uid}-hide`}>
        <path d={HIDE} />
      </clipPath>
      <path d={HIDE} fill={ink.deep} {...OUT} />
      <g clipPath={`url(#${uid}-hide)`}>
        {/* fur: short ragged strokes */}
        <path d={segD(subdivide(hatchSegs(-32, -4, 32, 36, 78, 3.6, 71, 0.1), 5).filter((_, i) => i % 2 === 0), side)} {...ln(1.05, 0.7)} />
        <path d={segD(hatchSegs(8, -10, 32, 36, 112, 2.8, 72), side)} {...ln(0.9, 0.5)} />
      </g>
      <path d={`M${P(side([-30, -4.5]))}Q${P([fx * 0.4, -0.5])} ${P(side([30, -4.5]))}`} {...ln(1.6, 0.85)} />
      <path d={limbD([[[fx - 5 * c, -3], 4.4], [[fx - 7 * c + sway * 0.2, 9], 4], [[fx - 6 * c + sway * 0.4, 19], 2.6]])} fill={ink.main} {...OUT} strokeWidth={1.6} />
    </>
  );

  // ---- the tilmatli (texcocoFigures' cloak, plain, to the knee) -------------------
  const a = sp.a;
  const hem = sp.hem;
  const cM = sfC.mF;
  const hdx = q.hem - Math.tan((q.lean * Math.PI) / 180) * hem * 0.3;
  const hemL: P2 = [-0.94 * a, hem + 1];
  const hemR: P2 = [0.9 * a, hem + 5];
  const hemC: P2 = [(hemL[0] + hemR[0]) / 2 + 3, hem + 13];
  const hemPt = (t: number, up = 0): P2 => {
    const p = quad(hemL, hemC, hemR, t);
    return [p[0], p[1] - up];
  };
  const swing = (p: P2): P2 => [p[0] + hdx * sstep((p[1] - shY - 30) / (hem - shY - 30)), p[1]];
  const cS: Map = (p) => swing(side(p));
  const cF: Map = (p) => swing(cM(p));
  const knot = add(shL, [9, -6]);
  const cloakA = add(shL, [-9, 5]);
  const cloakB = add(shR, [-3, 36]);
  const n0 = add(neck, [-8, 17]);
  const n1 = add(cloakB, [-34, -3]);
  const CLOAK =
    `M${P(side(cloakA))}L${P(cM(cloakA))}Q${P(cM(add(shL, [-4, -11])))} ${P(cM(knot))}` +
    `C${P(cM(n0))} ${P(cM(n1))} ${P(cM(cloakB))}L${P(side(cloakB))}` +
    `C${P(cS(add(cloakB, [9, 42])))} ${P(cS([hemR[0] + 5, hemR[1] - 70]))} ${P(cS(hemR))}` +
    `Q${P(cS(hemC))} ${P(cS(hemL))}` +
    `C${P(cS([hemL[0] - 7, hemL[1] - 68]))} ${P(cS(add(cloakA, [-10, 54])))} ${P(side(cloakA))}Z`;
  const folds = [0.07, 0.22, 0.38, 0.54, 0.7, 0.86].map((t, i) => {
    const fa = add(knot, [1 + t * 0.78 * a, 13 + t * 30 + 9 * hash(i, 41)]);
    const fb = hemPt(t, 8 + 20 * hash(i, 42));
    const fc: P2 = [mix(fa[0], fb[0], 0.28) + (t - 0.45) * 20, mix(fa[1], fb[1], 0.55)];
    return { a: fa, c: fc, b: fb };
  });
  const knotAt = cM(knot);
  const kd = Math.max(0.25, Math.abs(cM([knot[0] + 2, knot[1]])[0] - cM([knot[0] - 2, knot[1]])[0]) / 4);
  const cloakArt = (
    <>
      <clipPath id={`${uid}-cloak`}>
        <path d={CLOAK} />
      </clipPath>
      <path d={CLOAK} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-cloak)`}>
        <path d={`M${P(cF(hemPt(0, 7)))}Q${P(cF([hemC[0], hemC[1] - 7]))} ${P(cF(hemPt(1, 7)))}`} {...ln(1.2, 0.7)} />
        <path d={segD(hatchSegs(a * 0.42, shY + 22, a * 1.2, hem + 16, 111, 3, 44), cS)} {...ln(0.95, 0.6)} />
        <path d={segD(hatchSegs(a * 0.7, shY + 60, a * 1.2, hem + 16, 60, 3.6, 45), cS)} {...ln(0.9, 0.5)} />
        {folds.map((f, i) => (
          <path key={i} d={segD(foldHatchSegs(f.a, f.c, f.b, 46 + i, 9 + 5 * hash(i, 47)), cF)} {...ln(0.95, 0.6)} />
        ))}
        <path d={`M${P(cM(add(knot, [3, 9])))}C${P(cM(add(n0, [1, 8])))} ${P(cM(add(n1, [0, 8])))} ${P(cM(add(cloakB, [-1, 9])))}`} {...ln(1.2, 0.7)} />
        <path d={folds.map((f) => `M${P(cF(f.a))}Q${P(cF(f.c))} ${P(cF(f.b))}`).join("")} {...ln(1.5, 0.78)} />
      </g>
      {sfC.seen(knot[0]) ? (
        <g transform={`translate(${knotAt[0].toFixed(2)} ${knotAt[1].toFixed(2)}) scale(${kd.toFixed(3)} 1)`}>
          <path d={limbD([[[0, 0], 5.6], [[-4, 12], 5.2], [[-2.4, 23], 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d={limbD([[[0, 0], 5.6], [[6, 10], 5.2], [[10.6, 19], 3.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
          <path d="M0,0l-12.6,-9q-5.8,3.6 -1.6,9.8ZM0,0l12.2,-8.4q5.6,4.6 1,10Z" fill={ink.main} {...OUT} strokeWidth={1.9} />
          <circle cx={0} cy={0} r={4.9} fill={ink.deep} {...OUT} strokeWidth={1.9} />
        </g>
      ) : null}
    </>
  );

  // ---- the ichcahuipilli: sleeveless quilted cotton to the thigh ------------------
  const AW = 37;
  const aM = surface(q.yaw, AW + 2, (AW + 2) * 0.58).mF;
  const ARMOUR =
    `M${P(side([-hw + 3, shY - 3]))}Q${P(side([-24, shY - 8]))} ${P(side([-13, shY - 6]))}Q${P(aM([0, shY + 13]))} ${P(side([13, shY - 6]))}Q${P(side([24, shY - 8]))} ${P(side([hw - 3, shY - 3]))}` +
    `C${P(side([hw, shY + 14]))} ${P(side([hw - 12, shY + 22]))} ${P(side([hw - 9, shY + 38]))}L${P(side([AW - 2, -12]))}L${P(side([AW + 2, 40]))}Q${P(aM([0, 48]))} ${P(side([-AW - 2, 40]))}L${P(side([-AW + 2, -12]))}L${P(side([-hw + 9, shY + 38]))}` +
    `C${P(side([-hw + 12, shY + 22]))} ${P(side([-hw, shY + 14]))} ${P(side([-hw + 3, shY - 3]))}Z`;
  const quilt = subdivide([...hatchSegs(-AW - 4, shY - 8, AW + 4, 50, 58, 13, 501, 0), ...hatchSegs(-AW - 4, shY - 8, AW + 4, 50, -58, 13, 502, 0)], 6);
  const armourArt = (
    <>
      <clipPath id={`${uid}-arm`}>
        <path d={ARMOUR} />
      </clipPath>
      <path d={ARMOUR} fill={ink.main} {...OUT} strokeWidth={2.5} />
      <g clipPath={`url(#${uid}-arm)`}>
        <path d={segD(hatchSegs(AW * 0.42, shY, AW + 4, 48, 113, 2.8, 503), side)} {...ln(0.9, 0.5)} />
        <path d={segD(quilt, aM)} {...ln(1.35, 0.72)} />
        {/* the bound edges: neck, armholes, hem */}
        <path d={`M${P(side([-13, shY - 1]))}Q${P(aM([0, shY + 18]))} ${P(side([13, shY - 1]))}`} {...ln(1.2, 0.7)} />
        <path d={`M${P(side([-AW - 2, 33]))}Q${P(aM([0, 41]))} ${P(side([AW + 2, 33]))}`} {...ln(1.5, 0.8)} />
        <path d={Array.from({ length: 9 }, (_, i) => `M${P(aM([-AW + 4 + i * ((2 * AW - 8) / 8), 36.5 + 5 * (1 - ((i - 4) / 4) ** 2)]))}l0,5`).join("")} {...ln(1, 0.6)} />
      </g>
    </>
  );
  // the wipe that pulls the armour on over the cloak (torso frame y)
  const yW = mix(shY - 18, hem + 24, armed);

  // ---- the Chichimec's bow, quiver and long hair ---------------------------------
  const pB = (p: P2): P2 => [p[0] * c - 24 * s, p[1]];
  const bowA: P2 = [46, shY - 46];
  const bowB: P2 = [-46, 34];
  const bowC: P2 = [34, -36];
  const bowSt: St[] = [0, 0.16, 0.33, 0.5, 0.67, 0.84, 1].map((t, i): St => [pB(quad(bowA, bowC, bowB, t)), [3.4, 5, 6, 6.8, 6, 5, 3.4][i]]);
  const qv0: P2 = [-17, shY + 34];
  const qv1: P2 = [-37, shY - 16];
  const qu = norm(sub(qv1, qv0));
  const backGear = (
    <g transform={torsoTf}>
      <path d={`M${P(pB(bowA))}L${P(pB(bowB))}`} {...ln(1.2, 0.9)} stroke={ink.deep} strokeOpacity={1} />
      <path d={limbD(bowSt)} fill={ink.deep} {...OUT} strokeWidth={1.9} />
      {/* the arrows' fletched ends over his shoulder, the quiver */}
      {[-1, 0, 1].map((j) => {
        const b = add(qv1, mul([-qu[1], qu[0]], j * 4.6));
        const e = add(b, mul(rot(qu, j * 9), 26 + 4 * hash(j + 2, 81)));
        return (
          <g key={j}>
            <path d={`M${P(pB(b))}L${P(pB(e))}`} stroke={DARK} strokeWidth={4.2} strokeLinecap="round" />
            <path d={`M${P(pB(b))}L${P(pB(e))}`} stroke={ink.main} strokeWidth={1.9} strokeLinecap="round" />
            <path d={limbD([[pB(mix2(b, e, 0.5)), 2.4], [pB(mix2(b, e, 0.72)), 8.4], [pB(e), 5.4]])} fill={ink.main} {...OUT} strokeWidth={1.6} />
          </g>
        );
      })}
      <path d={limbD([[pB(qv0), 13], [pB(mix2(qv0, qv1, 0.5)), 15], [pB(qv1), 16]])} fill={ink.deep} {...OUT} />
      <path d={`M${P(pB(add(qv1, mul([-qu[1], qu[0]], -7))))}L${P(pB(add(qv1, mul([-qu[1], qu[0]], 7))))}`} {...ln(1.4, 0.8)} />
    </g>
  );
  const hs = sp.headScale;
  const lock = (phi: number, w: number, len: number, seed: number) => {
    const ang = q.headYaw + phi;
    const x = r.headC[0] + 22 * hs * Math.sin(ang);
    const y0 = r.headC[1] + 16 * hs;
    const y1 = r.neck[1] + len;
    const sw = q.hem * 0.35;
    const st: St[] = [
      [[x, y0], w * 0.9],
      [[x + 1.5 * hash(1, seed) + sw * 0.3, mix(y0, y1, 0.4)], w],
      [[x - 2 + 3 * hash(2, seed) + sw * 0.7, mix(y0, y1, 0.78)], w * 0.8],
      [[x - 1 + 3 * hash(3, seed) + sw, y1], w * 0.3],
    ];
    return (
      <g key={seed}>
        <path d={limbD(st)} fill={ink.hair} {...OUT} strokeWidth={1.9} />
        <path d={[-0.28, 0, 0.28].map((u) => `M${P(add(st[0][0], [u * w, 2]))}Q${P(add(st[1][0], [u * w, 0]))} ${P(add(st[2][0], [u * w * 0.8, 0]))}`).join("")} {...ln(1.2, 0.8)} />
      </g>
    );
  };
  const hairBackFront = Math.abs(Math.sin(q.headYaw)) > 0.5;

  // ---- the topknot (texcocoFigures'), grown by `armed` ----------------------------
  const tk = -5 * Math.sin(q.headYaw);
  const TOPKNOT = `M${tk - 7.5},-27C${tk - 8},-36 ${tk - 9},-41 ${tk - 13},-52Q${tk - 7},-58 ${tk},-55.5Q${tk + 7},-58.5 ${tk + 13},-52C${tk + 9},-41 ${tk + 8},-36 ${tk + 7.5},-27`;

  // ---- the cord round the wrists -------------------------------------------------
  const bu = norm(add(norm(sub(r.armL.W, r.armL.E)), norm(sub(r.armR.W, r.armR.E))));
  const bn: P2 = [-bu[1], bu[0]];
  const bh = vlen(sub(r.armL.W, r.armR.W)) / 2 + 9.5 * k;
  const bindArt = (
    <g transform={tf}>
      <Cased id={`${uid}-bcase`} r={1.2}>
        {[-4.6, 0, 4.6].map((o, i) => (
          <path key={i} d={limbD([[add(g.bindAt, add(mul(bu, o - 1), mul(bn, -bh))), 4.6], [add(g.bindAt, mul(bu, o + 0.8)), 5], [add(g.bindAt, add(mul(bu, o - 1), mul(bn, bh))), 4.6]])} fill={i === 1 ? CREAM.main : CREAM.deep} {...OUT} strokeWidth={1.6} />
        ))}
        <circle cx={g.bindAt[0]} cy={g.bindAt[1]} r={4.4} fill={CREAM.main} {...OUT} strokeWidth={1.6} />
      </Cased>
    </g>
  );

  return (
    <g opacity={tone}>
      {profile ? withGear(farArm, true) : null}
      {/* the legs: the rig's, cut below the hips */}
      <clipPath id={`${uid}-lc`}>
        <rect x={at[0] - 600 * scale} y={at[1] + (r.hip[1] + 8.5) * scale} width={1200 * scale} height={(60 - r.hip[1]) * scale} />
      </clipPath>
      <g transform={tf}>
        <Cased id={`${uid}-bk`}>
          {kind === "chichimec" ? backGear : null}
          {kind === "chichimec" && !hairBackFront ? lock(Math.PI, 30, 46, 93) : null}
          {Math.abs(s) > 0.25 && kind !== "chichimec" ? (
            <g transform={hipTf}>
              <path d={`M${-fx - fw * 0.7},2L${-fx + fw * 0.7},2L${(-fx + fw * 0.7 + 1 + sway).toFixed(1)},34L${(-fx - fw * 0.7 - 1 + sway).toFixed(1)},34Z`} fill={ink.deep} {...OUT} />
              <path d={`M${(-fx - fw * 0.7 + sway).toFixed(1)},29H${(-fx + fw * 0.7 + sway).toFixed(1)}`} {...ln(1, 0.6)} />
            </g>
          ) : null}
        </Cased>
      </g>
      <g clipPath={`url(#${uid}-lc)`}>
        <Figure spec={legSpec} pose={{ ...q, lean: 0, hem: 0 }} at={at} scale={scale} uid={`${uid}-lg`} arms="none" ink={ink} />
      </g>
      {/* the torso and what he wears */}
      <g transform={tf}>
        <Cased id={`${uid}-case`}>
          <g transform={torsoTf}>{torsoArt}</g>
          <g transform={hipTf}>{kind === "chichimec" ? hideKilt : maxtlatl}</g>
          <g transform={torsoTf}>
            {aztec && armed < 0.999 ? (
              <>
                <clipPath id={`${uid}-wc`}>
                  <rect x={-400} y={armed <= 0.001 ? -600 : yW} width={800} height={1200} />
                </clipPath>
                <g clipPath={`url(#${uid}-wc)`}>
                  <g transform={`translate(0 ${shY}) rotate(${(-q.lean * 0.5 * sstep((Math.abs(q.lean) - 8) / 30)).toFixed(2)}) translate(0 ${-shY})`}>{cloakArt}</g>
                </g>
              </>
            ) : null}
            {aztec && armed > 0.001 ? (
              <>
                <clipPath id={`${uid}-wa`}>
                  <rect x={-400} y={-600} width={800} height={armed >= 0.999 ? 1200 : yW + 600} />
                </clipPath>
                <g clipPath={`url(#${uid}-wa)`}>{armourArt}</g>
              </>
            ) : null}
            {kind === "chichimec" ? (
              <>
                {/* the quiver's strap across the chest */}
                <path d={limbD([[side([-hw + 12, shY - 2]), 5], [mT([-6, shY + 34]), 5.4], [side([wst, -34]), 5]])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
              </>
            ) : null}
          </g>
          <path d={NECK} fill={ink.main} {...OUT} />
          {kind === "chichimec" ? (
            <>
              {hairBackFront ? lock(Math.PI, 24, 52, 93) : null}
              {lock(-1.75, 13, 40, 91)}
              {lock(1.75, 13, 36, 92)}
            </>
          ) : null}
        </Cased>
      </g>
      {profile ? withGear(nearArm, false) : [r.armL, r.armR].sort((p, q2) => p.z - q2.z).map((ar) => withGear(ar.sgn < 0 ? "L" : "R", false))}
      {bound ? bindArt : null}
      {/* the head: the rig's, cut out at the shoulders */}
      <clipPath id={`${uid}-hc`}>
        <rect transform={`${tf} ${torsoTf}`} x={-62} y={shY - 119} width={124} height={112} />
        <path transform={`${tf} ${headTf}`} d={faceClip} />
        <path transform={`${tf} ${headTf}`} d={hairClip} />
      </clipPath>
      <g clipPath={`url(#${uid}-hc)`}>
        <Figure spec={headSpec} pose={q} at={at} scale={scale} uid={`${uid}-hd`} arms="none" ink={ink} />
      </g>
      {armed > 0.02 ? (
        <g transform={`${tf} ${headTf}`}>
          <Cased id={`${uid}-tkc`} r={1.3}>
            <g transform={`translate(0 -27) scale(1 ${armed.toFixed(3)}) translate(0 27)`}>
              <clipPath id={`${uid}-tk`}>
                <path d={`${TOPKNOT}Z`} />
              </clipPath>
              <path d={TOPKNOT} fill={ink.hair} {...OUT} />
              <g clipPath={`url(#${uid}-tk)`}>
                <path d={hatchD(tk - 14, -60, tk + 14, -26, 90, 2.2, 71, 0.08)} {...ln(1.25, 0.85)} />
              </g>
              <path d={limbD([[[tk - 9.6, -38], 6.6], [[tk, -39], 6.8], [[tk + 9.6, -38], 6.6]])} fill={ink.main} {...OUT} strokeWidth={1.9} />
              <path d={`M${tk - 8},-38.6Q${tk},-39.8 ${tk + 8},-38.6`} {...ln(0.9, 0.55)} />
            </g>
          </Cased>
        </g>
      ) : null}
    </g>
  );
};

type CastProps = Omit<CaptureFigureProps, "kind" | "uid"> & { uid?: string };
/** an Aztec commoner (cream by default). armed 0..1 turns him into the warrior */
export const Commoner: React.FC<CastProps> = ({ uid = "com", ...p }) => <CaptureFigure kind="commoner" uid={uid} {...p} />;
/** an Aztec warrior (orange by default): armour, topknot, shield and macuahuitl */
export const Warrior: React.FC<CastProps> = ({ uid = "war", ...p }) => <CaptureFigure kind="warrior" uid={uid} {...p} />;
/** a Totonac captive (cream), wrists bound */
export const Totonac: React.FC<CastProps> = ({ uid = "tot", ...p }) => <CaptureFigure kind="totonac" uid={uid} {...p} />;
/** a Chichimec captive (cream), wrists bound */
export const Chichimec: React.FC<CastProps> = ({ uid = "chi", ...p }) => <CaptureFigure kind="chichimec" uid={uid} {...p} />;

// ---------------------------------------------------------------------------
// POSES. Each takes dir: 1 = facing screen right, -1 = facing screen left (a true
// mirror). "near" = the arm toward us, "far" = the other: by default the shield
// is on the NEAR forearm and the club in the FAR fist. All are plain FigPose:
// blend with lerpFig, key with poseTrack, lay walkPose / idle over them.
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
const SIDE: FigPose = { ...STAND, yaw: YAW, headYaw: YAW + 0.07, armL: { w: [-8, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 }, armR: { w: [14, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 } };
const NEAR_CARRY: ArmPose = { w: [34, -186], elbow: [-0.7, 1], fist: 0.85, hand: 0 };
const R_CARRY: FigPose = { ...SIDE, armL: NEAR_CARRY };
const R_CLUB_LOW: FigPose = { ...R_CARRY, brow: 0.4, armR: { w: [34, -156], elbow: [-0.6, 1], fist: 1, hand: 42 } };
const R_CLUB_RAISED: FigPose = { ...R_CARRY, lean: -5, pitch: -3, brow: 0.9, mouth: -0.5, armL: { w: [40, -200], elbow: [-0.7, 1], fist: 0.85, hand: 0 }, armR: { w: [-10, -338], elbow: [-1, -0.2], fist: 1, hand: 44 }, footL: [-12, 0], footR: [14, 0] };
const R_REACH: FigPose = { ...SIDE, lean: 50, crouch: 52, pitch: 8, headYaw: YAW + 0.1, armL: { w: [74, -42], elbow: [-0.4, 1], fist: 0, hand: 0 }, armR: { w: [92, -48], elbow: [-0.4, 1], fist: 0, hand: 0 }, footL: [-10, 0], footR: [16, 0] };
const R_LEAD: FigPose = { ...R_CARRY, armR: { w: [-58, -168], elbow: [0.2, 1], fist: 1, hand: 0 } };
const R_BOUND: FigPose = { ...SIDE, pitch: 12, lean: 2.5, brow: 0.35, lids: 0.3, mouth: -0.5, armL: { w: [22, -161], elbow: [-0.7, 1], fist: 0.7, hand: 0 }, armR: { w: [31, -156], elbow: [-0.7, 1], fist: 0.7, hand: 0 } };
const R_STRAIN = (phase: number): FigPose => {
  const a = Math.sin(2 * Math.PI * phase);
  const b = Math.cos(2 * Math.PI * phase);
  return {
    ...SIDE,
    yaw: YAW - 0.22 * a,
    headYaw: YAW + 0.1 + 0.34 * a,
    roll: -7 * b,
    pitch: -4 + 5 * a,
    lean: -7 + 5 * a,
    crouch: 13 + 4 * b,
    brow: 1,
    lids: 0.1,
    mouth: -1,
    armL: { w: [30 + 9 * a, -172 - 9 * b], elbow: [-0.7, 1], fist: 1, hand: 12 * a },
    armR: { w: [39 + 9 * a, -166 - 9 * b], elbow: [-0.7, 1], fist: 1, hand: 12 * a },
    footL: [-17, 0],
    footR: [19, 0],
  };
};
const face = (q: FigPose, dir: 1 | -1) => (dir === 1 ? q : mirrorPose(q));
export const POSES = {
  /** standing in three-quarter profile, arms at his sides */
  stand: (dir: 1 | -1 = 1) => face(SIDE, dir),
  /** standing, the near forearm across his front (where the shield sits) */
  carry: (dir: 1 | -1 = 1) => face(R_CARRY, dir),
  /** shield up, the club lowered at his side, its blade pointing ahead */
  clubLow: (dir: 1 | -1 = 1) => face(R_CLUB_LOW, dir),
  /** the club raised overhead to strike */
  clubRaised: (dir: 1 | -1 = 1) => face(R_CLUB_RAISED, dir),
  /** stooped, both open hands reaching forward and down to the ground */
  reach: (dir: 1 | -1 = 1) => face(R_REACH, dir),
  /** the far fist trailing behind him holding a rope (anchor: farHand), the near forearm carrying the shield */
  lead: (dir: 1 | -1 = 1) => face(R_LEAD, dir),
  /** wrists together in front of him, head lowered (anchor: bind) */
  bound: (dir: 1 | -1 = 1) => face(R_BOUND, dir),
  /** straining against the bonds: a twist, phase 0..1 loops */
  strain: (dir: 1 | -1 = 1, phase = 0) => face(R_STRAIN(phase), dir),
};
/** texcocoShared's walk laid over a pose (phase = frames / WALK.cycle; advance `at` by WALK.advance(scale) px per frame, in the facing direction) */
export const walk = (base: FigPose, phase: number, amount = 1): FigPose => walkPose(base, phase, amount);
/** the walk's legs and bob only: the arms stay where the pose has them (bound wrists, a raised club, a held rope) */
export const walkLegs = (base: FigPose, phase: number, amount = 1): FigPose => ({ ...walkPose(base, phase, amount), armL: base.armL, armR: base.armR });

// ---------------------------------------------------------------------------
// THE REVIEW SHEET (world 2160 x 3840 seen at k = 0.5: render with --scale 2)
// ---------------------------------------------------------------------------
export const CaptureFiguresSheet: React.FC = () => {
  const cam = { k: 0.5, cx: 1080, cy: 1920 };
  const S = 2.26;
  const s1 = 0.355;
  const leadPair = (x: number, y: number, sc: number, uid: string) => {
    const wp = walkLegs(POSES.lead(1), 0.3);
    const cp = walkLegs(POSES.bound(1), 0.8);
    const wAt: P2 = [x, y];
    const cAt: P2 = [x - 190 * sc, y];
    const wa = captureAnchors("warrior", wp, wAt, sc);
    const ca = captureAnchors("totonac", cp, cAt, sc);
    return (
      <>
        <Totonac pose={cp} at={cAt} scale={sc} uid={`${uid}-c`} />
        <Rope from={ca.bind} to={wa.farHand} slack={0.22} width={3.2 * sc} />
        <Warrior pose={wp} at={wAt} scale={sc} uid={`${uid}-w`} club={false} />
      </>
    );
  };
  return (
    <AbsoluteFill>
      <TexcocoPage cam={cam}>
        <WorldSvg cam={cam}>
          {/* row 1: the cast at 700 px */}
          <Commoner pose={STAND} at={[290, 830]} scale={S} uid="s-com" />
          <Warrior pose={POSES.clubLow(1)} at={[800, 830]} scale={S} uid="s-war" />
          <Totonac pose={POSES.bound(1)} at={[1370, 830]} scale={S} uid="s-tot" />
          <Chichimec pose={POSES.strain(-1, 0.1)} at={[1870, 830]} scale={S} uid="s-chi" />
          {/* row 2: the poses */}
          <Warrior pose={POSES.clubRaised(-1)} at={[330, 1770]} scale={S} uid="s-war2" />
          <Commoner pose={POSES.reach(1)} at={[760, 1770]} scale={S} uid="s-com2" ink={ORANGE} />
          <Shield at={[1010, 1738]} scale={S} lying={1} uid="s-shg" />
          {leadPair(1880, 1770, S, "s-lead")}
          {/* row 3: front views, the armed blend */}
          <Commoner pose={STAND} at={[220, 2640]} scale={2} uid="s-b0" ink={ORANGE} armed={0.4} />
          <Warrior pose={STAND} at={[640, 2640]} scale={2} uid="s-b1" shield={false} club={false} />
          <Warrior pose={{ ...STAND, armR: { w: [44, -190], elbow: [1, 0.6], fist: 0.85, hand: 0 }, armL: { w: [-66, -160], elbow: [-0.6, 1], fist: 1, hand: -60 } }} at={[1060, 2640]} scale={2} uid="s-b2" clubArm="L" />
          <Totonac pose={{ ...STAND, pitch: 10 }} at={[1500, 2640]} scale={2} uid="s-b3" bound={false} />
          <Chichimec pose={STAND} at={[1900, 2640]} scale={2} uid="s-b4" bound={false} />
          {/* row 4: the props alone */}
          <Shield at={[260, 3010]} scale={S} uid="s-p1" />
          <Shield at={[600, 3090]} scale={S} lying={1} uid="s-p2" />
          <Macuahuitl at={[820, 3110]} scale={S} angle={90} uid="s-p3" />
          <Macuahuitl at={[1330, 3130]} scale={S} angle={20} uid="s-p4" ink={CREAM} />
          <Rope from={[1500, 2950]} to={[2060, 2990]} slack={0.6} width={7} />
          <Rope from={[1500, 3130]} to={[2060, 3090]} slack={0} width={7} />
          {/* row 5: the silhouettes at 110 px */}
          <Commoner pose={POSES.stand(1)} at={[200, 3720]} scale={s1} uid="t-com" />
          <Warrior pose={POSES.clubLow(1)} at={[420, 3720]} scale={s1} uid="t-war" />
          <Warrior pose={POSES.clubRaised(-1)} at={[660, 3720]} scale={s1} uid="t-war2" />
          <Totonac pose={POSES.bound(1)} at={[880, 3720]} scale={s1} uid="t-tot" />
          <Chichimec pose={POSES.strain(1, 0.1)} at={[1080, 3720]} scale={s1} uid="t-chi" />
          <Commoner pose={POSES.reach(1)} at={[1280, 3720]} scale={s1} uid="t-com2" ink={ORANGE} />
          {leadPair(1640, 3720, s1, "t-lead")}
          <Shield at={[1840, 3690]} scale={s1} uid="t-p1" />
          <Macuahuitl at={[1900, 3712]} scale={s1} angle={90} uid="t-p2" />
        </WorldSvg>
      </TexcocoPage>
    </AbsoluteFill>
  );
};
export const WALK_INFO = WALK;
