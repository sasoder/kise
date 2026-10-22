// ---------------------------------------------------------------------------
// zombieAntFigure (V3): the carpenter ant of ZombieAnt (kyle-pandemics, cut 58), Camponotus leonardi, the host of
// Ophiocordyceps unilateralis, drawn as a real insect in the clip's V3 manner: soft painted form light from the upper
// left on a glossy dark chestnut-to-near-black cuticle (a lit core, a warm sheen on the upper edges, a cream rim), a thin
// outline in a darker version of its own colour (no casing), its shadow side sinking into the air and the whole of it
// fogged by `fog` (creatureAir.ts: A sage-teal or B umber). The disease (orange) shows as the stretched intersegmental
// membranes of the gaster, the neck and the waist stained orange from inside, and the mycelium threads at the joints
// (MyceliumThreads, cordyceps.tsx); after death the tufts (JointTufts).
//
// ANATOMY (Camponotus worker in profile; AntWiki / antweb plates of C. leonardi and C. gigas, proportions only):
//   head about as long as the mesosoma, its dorsum evenly convex, the clypeus sloping to the mandibles; a SMALL dark
//   compound eye on the side behind the middle (faceted, a dull sheen, no glint); the antenna inserted on the frons
//   behind the clypeus, a long clavate scape and an 11-segment funiculus (elbowed); toothed triangular mandibles;
//   the mesosoma one even hump-backed arch (pronotum, mesonotum, propodeum, no deep groove) with a narrow collar in
//   front; a single upright petiole scale; a large oval gaster with 4 visible plate edges and sparse pale erect setae;
//   legs coxa / femur / tibia / 5-segment tarsus with claws, the knees bending as the world file solves them.
//
// API (the world file's BodyPose; world px of the cut's WorldSvg):
//   antLook(air, fog)                  -> the colours of the ant in an air (AntLook); ANT_LOOK = A (the chosen air) at fog 0.06
//   <AntBody uid b look mandOpen myc mycOpacity mycWidth stain nearJaw view />   head, mesosoma, petiole, gaster
//   <AntLeg g look />   <Antenna head scapeA funA look />   <Jaw head which open look />   <JointTufts b t legs />
//   legGeometry(...) / solveKnee / KNEE_BEND (the motion, unchanged from V2), jointThreads(b), headOutline(b),
//   jawOutline(head, open).
//   `view` (optional, probes only): {yaw, cx} turns the ant about the vertical through x = cx (yaw > 0 brings the head
//   toward the viewer): the segments are lofts (elliptical sections), so the silhouette and the near-side details
//   follow; the cut itself is drawn in profile (no view).
// ---------------------------------------------------------------------------
import React from "react";
import { FUNGUS, MyceliumThreads } from "./cordyceps";
import { AIR_A, inAir, mixHex, shadeInAir, type Air } from "./creatureAir";
import { ANT_S, FORESHORTEN, LEG_BONES, add2, mul2, proj, rOf, rot2, segPoint, sub2, type BodyPose, type Eye, type P2, type Seg } from "./zombieAntWorld";

export { mixHex };
export const DARK = "#17120D";

// ---------------------------------------------------------------------------
// COLOUR
// ---------------------------------------------------------------------------
/** the ant's own colours (glossy dark chestnut to near-black), before the air */
const LOCAL = {
  shade: "#0F0805",
  mid: "#23150C",
  lit: "#432A18",
  sheen: "#8E6644",
  spec: "#EFDDBA",
  limbMid: "#331E12",
  limbLit: "#6A4024",
  line: "#0F0906",
  eye: "#120C08",
  eyeSheen: "#8C7E6A",
  jaw: "#4E2A15",
  jawLit: "#93582F",
  hair: "#DCCBA6",
  rim: "#E9DDBF",
};
export type AntLook = typeof LOCAL & { rimOp: number; stain: string; stainLine: string; bounce: string; fog: number };
/** the ant's colours in an air: the shadow side sinks toward the air's shade, everything fogs toward its body */
export const antLook = (air: Air = AIR_A, fog = 0.06): AntLook => ({
  shade: shadeInAir(air, LOCAL.shade, 0.55, fog),
  mid: shadeInAir(air, LOCAL.mid, 0.1, fog),
  lit: inAir(air, LOCAL.lit, fog),
  sheen: inAir(air, LOCAL.sheen, fog),
  // the gloss reflects the air's own light
  spec: inAir(air, mixHex(LOCAL.spec, air.light, 0.25), fog),
  limbMid: shadeInAir(air, LOCAL.limbMid, 0.08, fog),
  limbLit: inAir(air, LOCAL.limbLit, fog),
  line: shadeInAir(air, LOCAL.line, 0.35, fog),
  eye: shadeInAir(air, LOCAL.eye, 0.1, fog),
  eyeSheen: inAir(air, LOCAL.eyeSheen, fog),
  jaw: shadeInAir(air, LOCAL.jaw, 0.1, fog),
  jawLit: inAir(air, LOCAL.jawLit, fog),
  hair: inAir(air, LOCAL.hair, fog),
  rim: inAir(air, mixHex(LOCAL.rim, air.light, 0.12), fog),
  rimOp: 0.8 * (1 - 0.5 * fog),
  // orange = the disease: it glows, so the air takes less of it
  stain: inAir(air, FUNGUS.main, fog * 0.5),
  stainLine: inAir(air, FUNGUS.hatch, fog * 0.5),
  // the air's own light bounced up into the underside
  bounce: inAir(air, mixHex(air.light, air.body, 0.45), fog),
  fog,
});
export const ANT_LOOK = antLook(AIR_A, 0.06);

const f2 = (v: number) => v.toFixed(2);
const pt = (p: P2) => `${f2(p[0])},${f2(p[1])}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const norm = (v: P2): P2 => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
const poly = (pts: P2[]) => `M${pts.map(pt).join("L")}Z`;
/** a closed smooth path (Catmull-Rom as cubic Beziers) through world points */
const smoothClosed = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return `${d}Z`;
};
const smoothOpen = (pts: P2[]) => {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
};
/** toward the light (screen): the upper left */
const LT: P2 = norm([-0.55, -0.83]);
/** V2: Camponotus' large head: every head-local point is scaled by HEAD_K about the head's centre */
export const HEAD_K = 1.1;

// ---------------------------------------------------------------------------
// THE VIEW: segment-local (x forward, y ventral, z toward the far side) -> world
// ---------------------------------------------------------------------------
export type AntView = { yaw: number; cx: number; pitch?: number; cy?: number };
/** a world point (X, Y, Z far +) seen from a view turned by yaw about the vertical through cx, then looking down by pitch */
export const viewPoint = (v: AntView, X: number, Y: number, Z: number): P2 => {
  const dep = Z * Math.cos(v.yaw) - (X - v.cx) * Math.sin(v.yaw);
  const p = v.pitch ?? 0;
  const cy = v.cy ?? 0;
  return [v.cx + (X - v.cx) * Math.cos(v.yaw) + Z * Math.sin(v.yaw), cy + (Y - cy) * Math.cos(p) - dep * Math.sin(p)];
};
type Proj = (s: Seg, q: [number, number, number], head?: boolean) => P2;
const makeProj =
  (view?: AntView): Proj =>
  (s, q, head = false) => {
    const k = head ? HEAD_K : 1;
    const w = segPoint(s, [q[0] * k, q[1] * k]);
    if (!view || view.yaw === 0) return w;
    return viewPoint(view, w[0], w[1], q[2] * k * ANT_S);
  };
const headPt = (head: Seg, q: P2): P2 => segPoint(head, [q[0] * HEAD_K, q[1] * HEAD_K]);

// ---------------------------------------------------------------------------
// THE LOFTS (segment-local, unscaled): x along the axis, top / bottom of the profile (y, + ventral), half-width
// ---------------------------------------------------------------------------
type Loft = { x: number[]; top: number[]; bot: number[]; hw: number[] };
const HEAD_L: Loft = {
  x: [-56, -54, -50, -42, -30, -15, 0, 15, 30, 42, 50, 56, 59],
  top: [0, -10, -21, -33, -42, -46, -47, -45, -39, -31, -21, -9, 0],
  bot: [0, 9, 17, 25, 30, 32, 33, 31, 27, 22, 17, 9, 3],
  hw: [4, 18, 30, 40, 46, 48, 48, 47, 44, 38, 30, 18, 6],
};
const MESO_L: Loft = {
  x: [-74, -72, -66, -56, -40, -20, 0, 20, 40, 56, 66, 72, 77],
  top: [12, 0, -12, -24, -36, -45, -49, -49, -43, -33, -20, -6, 6],
  bot: [12, 18, 23, 25, 27, 28, 29, 29, 28, 26, 22, 17, 11],
  hw: [6, 13, 18, 22, 24, 25, 26, 27, 28, 27, 22, 15, 7],
};
const PET_L: Loft = {
  x: [-13, -11, -7, -2, 3, 8, 12, 14],
  top: [12, -6, -26, -34, -35, -27, -4, 10],
  bot: [14, 15, 15, 15, 15, 15, 14, 12],
  hw: [5, 9, 13, 15, 15, 13, 9, 5],
};
const GASTER_L: Loft = {
  x: [-92, -89, -82, -70, -54, -34, -10, 14, 38, 58, 74, 83, 88],
  top: [4, -10, -26, -40, -51, -58, -61, -61, -57, -48, -34, -18, -2],
  bot: [6, 18, 32, 43, 51, 55, 57, 55, 49, 38, 25, 13, 4],
  hw: [5, 20, 34, 46, 54, 59, 61, 61, 57, 49, 38, 24, 8],
};
/** Catmull-Rom through a table (x ascending) */
const cr = (xs: number[], ys: number[], x: number) => {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  let i = 0;
  while (x > xs[i + 1]) i++;
  const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
  const p0 = ys[Math.max(0, i - 1)];
  const p1 = ys[i];
  const p2 = ys[i + 1];
  const p3 = ys[Math.min(n - 1, i + 2)];
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
const loftAt = (L: Loft, x: number) => {
  const top = cr(L.x, L.top, x);
  const bot = cr(L.x, L.bot, x);
  return { top, bot, ctr: (top + bot) / 2, hh: Math.max(0, (bot - top) / 2), hw: Math.max(0, cr(L.x, L.hw, x)) };
};
/** a point on the loft's near surface: s -1 the top, 0 the side (widest), +1 the bottom */
const surf = (L: Loft, x: number, s: number): [number, number, number] => {
  const q = loftAt(L, x);
  return [x, q.ctr + q.hh * s, -q.hw * Math.sqrt(Math.max(0, 1 - s * s))];
};
/** the segment's silhouette in the world (profile: the top and bottom curves; turned: the union of its sections) */
const silhouette = (L: Loft, s: Seg, P: Proj, head: boolean, view?: AntView) => {
  const x0 = L.x[0];
  const x1 = L.x[L.x.length - 1];
  if (!view || Math.abs(view.yaw) < 1e-3) {
    const n = 64;
    const top: P2[] = [];
    const bot: P2[] = [];
    for (let i = 0; i <= n; i++) {
      // cosine spacing: dense at the round ends
      const x = x0 + ((x1 - x0) * (1 - Math.cos((Math.PI * i) / n))) / 2;
      const q = loftAt(L, x);
      top.push(P(s, [x, q.top, 0], head));
      bot.push(P(s, [x, q.bot, 0], head));
    }
    return poly([...top, ...bot.slice(1, -1).reverse()]);
  }
  return unionOf(L, s, P, head, 0);
};
/** a turned segment's silhouette: the union of its elliptical sections, each grown by `grow` (local units) */
const unionOf = (L: Loft, s: Seg, P: Proj, head: boolean, grow: number) => {
  const x0 = L.x[0];
  const x1 = L.x[L.x.length - 1];
  let d = "";
  const n = 90;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * (1 - Math.cos((Math.PI * i) / n))) / 2;
    const q = loftAt(L, x);
    if (q.hh < 0.3) continue;
    const pts: P2[] = [];
    for (let j = 0; j < 24; j++) {
      const th = (j / 24) * Math.PI * 2;
      pts.push(P(s, [x, q.ctr + (q.hh + grow) * Math.sin(th), (Math.max(q.hw, 1) + grow) * Math.cos(th)], head));
    }
    let a = 0;
    for (let j = 0; j < pts.length; j++) {
      const p = pts[j];
      const r = pts[(j + 1) % pts.length];
      a += p[0] * r[1] - r[0] * p[1];
    }
    d += poly(a < 0 ? pts.reverse() : pts);
  }
  return d;
};
/** the outline under a turned segment (null in profile: the silhouette is stroked) */
const outlineOf = (L: Loft, s: Seg, P: Proj, head: boolean, view?: AntView) => (!view || Math.abs(view.yaw) < 1e-3 ? undefined : unionOf(L, s, P, head, 1.3));

// ---------------------------------------------------------------------------
// ONE SHADED VOLUME: the shadow colour, the mid tone and the lit core offset toward the light and softened (the form
// light follows the silhouette), a warm sheen along the upper surface, a cream rim on the top edges, a thin outline
// ---------------------------------------------------------------------------
const Shaded: React.FC<{ uid: string; d: string; c: P2; size: number; look: AntLook; sheen?: string; spec?: string; outline?: string; children?: React.ReactNode; over?: React.ReactNode }> = ({ uid, d, c, size, look, sheen, spec, outline, children, over }) => {
  const o1 = mul2(LT, size * 0.06);
  const o2 = add2(c, mul2(LT, size * 0.16));
  // the lit core: the silhouette shrunk about its centre and moved toward the light (the form's lit side)
  const core = `translate(${f2(o2[0])} ${f2(o2[1])}) scale(0.72) translate(${f2(-c[0])} ${f2(-c[1])})`;
  const rimOff = mul2(LT, -Math.max(1.8, size * 0.045));
  const big = 6000;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-c`}>
          <path d={d} />
        </clipPath>
        <filter id={`${uid}-b1`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(size * 0.075)} />
        </filter>
        <filter id={`${uid}-b2`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(size * 0.03)} />
        </filter>
        <filter id={`${uid}-b3`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(Math.max(0.5, size * 0.008))} />
        </filter>
        <mask id={`${uid}-rim`} maskUnits="userSpaceOnUse" x={-big} y={-big} width={2 * big} height={2 * big}>
          <rect x={-big} y={-big} width={2 * big} height={2 * big} fill="black" />
          <path d={d} fill="white" />
          <path d={d} fill="black" transform={`translate(${f2(rimOff[0])} ${f2(rimOff[1])})`} filter={`url(#${uid}-b3)`} />
        </mask>
        <mask id={`${uid}-bo`} maskUnits="userSpaceOnUse" x={-big} y={-big} width={2 * big} height={2 * big}>
          <rect x={-big} y={-big} width={2 * big} height={2 * big} fill="black" />
          <path d={d} fill="white" />
          <path d={d} fill="black" transform={`translate(${f2(-rimOff[0] * 1.6)} ${f2(-rimOff[1] * 1.6)})`} filter={`url(#${uid}-b2)`} />
        </mask>
      </defs>
      {outline ? <path d={outline} fill={look.line} /> : null}
      <path d={d} fill={look.shade} />
      <g clipPath={`url(#${uid}-c)`}>
        <path d={d} fill={look.mid} transform={`translate(${f2(o1[0])} ${f2(o1[1])})`} filter={`url(#${uid}-b1)`} />
        <path d={d} fill={look.lit} opacity={0.95} transform={core} filter={`url(#${uid}-b1)`} />
        {sheen ? <path d={sheen} fill="none" stroke={look.sheen} strokeWidth={size * 0.1} strokeLinecap="round" opacity={0.8} filter={`url(#${uid}-b2)`} /> : null}
        {spec ? <path d={spec} fill="none" stroke={look.spec} strokeWidth={size * 0.03} strokeLinecap="round" opacity={0.9} filter={`url(#${uid}-b3)`} /> : null}
        {children}
        <path d={d} fill={look.bounce} opacity={0.3} mask={`url(#${uid}-bo)`} />
        <path d={d} fill={look.rim} opacity={look.rimOp} mask={`url(#${uid}-rim)`} />
      </g>
      {outline ? null : <path d={d} fill="none" stroke={look.line} strokeWidth={Math.max(0.9, size * 0.011)} strokeLinejoin="round" />}
      {over}
    </g>
  );
};
/** the sheen and specular lines along a loft's upper near surface (between x fractions a..b) */
const upperLine = (L: Loft, s: Seg, P: Proj, head: boolean, a: number, b: number, depth: number) => {
  const x0 = L.x[0];
  const x1 = L.x[L.x.length - 1];
  const pts: P2[] = [];
  for (let i = 0; i <= 14; i++) {
    const x = lerp(x0, x1, lerp(a, b, i / 14));
    pts.push(P(s, surf(L, x, -1 + depth), head));
  }
  return smoothOpen(pts);
};
/** fine pale setae standing out of the outline (top: out of the dorsum; bottom: out of the venter), leaning back */
const setae = (L: Loft, s: Seg, P: Proj, head: boolean, xs: number[], len: number, bottom = false) => {
  let d = "";
  xs.forEach((x, i) => {
    const q = loftAt(L, x);
    const y = bottom ? q.bot : q.top;
    const base = P(s, [x, y, 0], head);
    const out = norm(sub2(P(s, [x, y + (bottom ? 1 : -1), 0], head), base));
    const back = norm(sub2(P(s, [x - 1, y, 0], head), base));
    const l = len * (0.75 + 0.5 * ((i * 0.618) % 1)) * ANT_S;
    const mid = add2(base, add2(mul2(out, l * 0.55), mul2(back, l * 0.12)));
    const tip = add2(base, add2(mul2(out, l * 0.9), mul2(back, l * 0.45)));
    d += `M${pt(base)}Q${pt(mid)} ${pt(tip)}`;
  });
  return d;
};

// ---------------------------------------------------------------------------
// THE MANDIBLES (unchanged geometry: the jaws close on the vein at MAND_TIP_HEAD): toothed curved blades
// ---------------------------------------------------------------------------
const JAW_NEAR: P2[] = [[0, 0], [19, -1], [36, -5], [49, -11], [58, -19]];
const JAW_FAR: P2[] = [[0, 0], [19, 1], [36, 5], [49, 11], [58, 19]];
const HINGE_NEAR: P2 = [50, 18];
const HINGE_FAR: P2 = [48, 4];
const jawLocal = (which: "near" | "far", open: number) => {
  const cl = which === "near" ? JAW_NEAR : JAW_FAR;
  const hinge = which === "near" ? HINGE_NEAR : HINGE_FAR;
  const rotA = which === "near" ? 0.62 * open : -0.62 * open;
  const pts = cl.map((q) => add2(hinge, rot2(q, rotA)));
  const inner = which === "near" ? -1 : 1;
  const W = [12, 11, 9, 5.8, 1.4];
  const outer: P2[] = [];
  const innerE: P2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const d = sub2(b, a);
    const l = Math.hypot(d[0], d[1]) || 1;
    const n: P2 = [-d[1] / l, d[0] / l];
    const sgn = n[1] * inner > 0 ? 1 : -1;
    innerE.push(add2(p, mul2(n, sgn * W[i] * 0.5)));
    outer.push(add2(p, mul2(n, -sgn * W[i] * 0.5)));
  });
  const teeth: P2[] = [];
  for (let i = 1; i < 4; i++) {
    const a = innerE[i];
    const b = innerE[i + 1];
    for (const f of [0.33, 0.8]) {
      const m = lerp2(a, b, f);
      const d = sub2(b, a);
      const l = Math.hypot(d[0], d[1]) || 1;
      let n: P2 = [-d[1] / l, d[0] / l];
      if (n[1] * inner < 0) n = mul2(n, -1);
      teeth.push(lerp2(a, b, f - 0.18), add2(m, mul2(n, 3.4)));
    }
  }
  teeth.push(innerE[4]);
  return { outer, innerE, teeth, centre: pts };
};
const jawPath = (head: Seg, which: "near" | "far", open: number, view?: AntView) => {
  const j = jawLocal(which, open);
  const P = makeProj(view);
  const z = which === "near" ? -16 : 16;
  return [...j.outer, ...j.teeth.reverse(), j.innerE[1], j.innerE[0]].map((q) => P(head, [q[0], q[1], z], true));
};
/** a mandible blade's outline in the world (V3 take 2: the folk ant draws its pincers from this) */
export const jawPoly = (head: Seg, which: "near" | "far", open: number): P2[] => jawPath(head, which, open);
export const Jaw: React.FC<{ head: Seg; which: "near" | "far"; open: number; look: AntLook; view?: AntView }> = ({ head, which, open, look, view }) => {
  const pts = jawPath(head, which, open, view);
  const j = jawLocal(which, open);
  const s = ANT_S;
  const P = makeProj(view);
  const z = which === "near" ? -16 : 16;
  // the lit outer edge of the blade and a darker toothed inner edge
  const outerLine = j.outer.map((q) => P(head, [q[0], q[1], z], true));
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d={`M${pts.map(pt).join("L")}Z`} fill={which === "near" ? look.jaw : look.shade} stroke={look.line} strokeWidth={1.1 * s} />
      <path d={smoothOpen(outerLine.slice(0, 4))} fill="none" stroke={look.jawLit} strokeWidth={3.2 * s} opacity={which === "near" ? 0.85 : 0.45} />
      <path d={smoothOpen(outerLine.slice(0, 3))} fill="none" stroke={look.rim} strokeWidth={1 * s} opacity={which === "near" ? 0.5 : 0.2} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// LEGS (geometry: the world file's IK, unchanged from V2)
// ---------------------------------------------------------------------------
export type LegGeo = { id: string; side: number; pair: number; root: P2; hip: P2; knee: P2; ankle: P2; toe: P2; r: number };
/** two-bone IK in 2D (V2). The knee sits on a FIXED side of the hip -> ankle line for each leg (bend +1: the line
 *  turned +90 deg, -1: turned -90 deg), so it moves continuously and can never snap across; its sideways offset is
 *  capped at `cap` x the femur (the rest of the bend goes out toward / away from the viewer, foreshortened). */
export const solveKnee = (hip: P2, ankle: P2, a: number, b: number, bend: 1 | -1, cap = 0.42, bias: P2 = [0, 0]): { knee: P2; ankle: P2 } => {
  let d = sub2(ankle, hip);
  let L = Math.hypot(d[0], d[1]);
  const maxL = (a + b) * 0.995;
  const minL = Math.abs(a - b) + 1;
  let an = ankle;
  if (L > maxL) {
    an = add2(hip, mul2(d, maxL / L));
    d = sub2(an, hip);
    L = maxL;
  }
  if (L < minL) {
    an = add2(hip, mul2(d, minL / Math.max(L, 1e-6)));
    d = sub2(an, hip);
    L = minL;
  }
  const db = add2(d, bias);
  const lb = Math.hypot(db[0], db[1]) || 1;
  const u: P2 = [db[0] / lb, db[1] / lb];
  const x = (a * a + L * L - b * b) / (2 * L);
  const h = Math.min(Math.sqrt(Math.max(0, a * a - x * x)), cap * a);
  const n: P2 = bend > 0 ? [-u[1], u[0]] : [u[1], -u[0]];
  return { knee: add2(add2(hip, mul2(u, x)), mul2(n, h)), ankle: an };
};
/** the bend per leg pair: the fore knee ahead (toward the head), the mid and hind knees back (toward the tail) */
export const KNEE_BEND: (1 | -1)[] = [-1, 1, 1];
/** the leg's root, hip (coxa end), knee, ankle for a toe and a tarsus direction (unit, ankle -> toe), projected */
export const legGeometry = (e: Eye, meso: Seg, pair: number, side: number, toe3: [number, number, number], tarsDir: P2, id: string): LegGeo => {
  const B = LEG_BONES[pair];
  const zr = side * 16;
  const r = rOf(e, side * 34);
  const root2 = segPoint(meso, B.attach);
  const root = proj(e, root2[0], root2[1], zr);
  const cdir = rot2([-0.38, 0.92], meso.a);
  const hip = add2(root, mul2(cdir, B.coxa * ANT_S * r));
  const toe = proj(e, toe3[0], toe3[1], toe3[2]);
  const ankleT = sub2(toe, mul2(tarsDir, B.tarsus * ANT_S * r * 0.92));
  const { knee, ankle } = solveKnee(hip, ankleT, B.femur * ANT_S * r * FORESHORTEN, B.tibia * ANT_S * r * FORESHORTEN, KNEE_BEND[pair], 0.42, mul2(rot2([0, 1], meso.a), 90 * ANT_S * r));
  const tl = B.tarsus * ANT_S * r * 0.92;
  const dt = sub2(toe, ankle);
  const dl = Math.hypot(dt[0], dt[1]);
  const toeOut = dl > 1.2 * tl ? add2(ankle, mul2(dt, (1.2 * tl) / dl)) : toe;
  return { id, side, pair, root, hip, knee, ankle, toe: toeOut, r };
};

/** a limb segment: a tapered tube from a to b (full widths ws along it, rounded ends) and its shading lines */
const tube = (a: P2, b: P2, ws: number[], cap = 0.42) => {
  const u = norm(sub2(b, a));
  const n: P2 = [-u[1], u[0]];
  const m = ws.length - 1;
  const L: P2[] = [];
  const R: P2[] = [];
  ws.forEach((w, i) => {
    const c = lerp2(a, b, i / m);
    L.push(add2(c, mul2(n, w / 2)));
    R.push(sub2(c, mul2(n, w / 2)));
  });
  const ca = sub2(a, mul2(u, ws[0] * cap));
  const cb = add2(b, mul2(u, ws[m] * cap));
  return smoothClosed([ca, ...L, cb, ...R.reverse()]);
};
/** a line along a tube, offset toward the light by `f` of the local half-width */
const tubeLine = (a: P2, b: P2, ws: number[], f: number, t0 = 0.08, t1 = 0.92) => {
  const u = norm(sub2(b, a));
  // toward the light across the tube: the light's component perpendicular to it. It shrinks to nothing (the line
  // centred) as the tube turns to point at the light, so the lit side never jumps across between frames.
  const along = LT[0] * u[0] + LT[1] * u[1];
  const n: P2 = [LT[0] - u[0] * along, LT[1] - u[1] * along];
  const m = ws.length - 1;
  const pts: P2[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = lerp(t0, t1, i / 6);
    const k = Math.min(m - 1e-6, t * m);
    const w = lerp(ws[Math.floor(k)], ws[Math.floor(k) + 1], k - Math.floor(k));
    pts.push(add2(lerp2(a, b, t), mul2(n, (w / 2) * f)));
  }
  return smoothOpen(pts);
};
const Limb: React.FC<{ a: P2; b: P2; ws: number[]; look: AntLook; s: number; cap?: number; hairs?: number }> = ({ a, b, ws, look, s, cap, hairs = 0 }) => {
  const wm = ws.reduce((x, y) => x + y, 0) / ws.length;
  let hd = "";
  if (hairs > 0) {
    // fine setae on the limb's fixed (left) side, leaning toward its tip
    const u = norm(sub2(b, a));
    const n: P2 = [-u[1], u[0]];
    for (let i = 0; i < hairs; i++) {
      const t = 0.18 + (0.7 * i) / Math.max(1, hairs - 1);
      const base = add2(lerp2(a, b, t), mul2(n, wm * 0.45));
      const tip = add2(base, add2(mul2(n, wm * 0.55), mul2(u, wm * 0.9)));
      hd += `M${pt(base)}L${pt(tip)}`;
    }
  }
  return (
    <g>
      <path d={tube(a, b, ws, cap)} fill={look.limbMid} stroke={look.line} strokeWidth={Math.max(0.6, 0.9 * s)} />
      <path d={tubeLine(a, b, ws, -0.45)} fill="none" stroke={look.shade} strokeWidth={wm * 0.42} opacity={0.75} strokeLinecap="round" />
      <path d={tubeLine(a, b, ws, 0.3)} fill="none" stroke={look.limbLit} strokeWidth={wm * 0.3} opacity={0.9} strokeLinecap="round" />
      <path d={tubeLine(a, b, ws, 0.42, 0.3, 0.6)} fill="none" stroke={look.spec} strokeWidth={Math.max(0.4, wm * 0.09)} opacity={0.55} strokeLinecap="round" />
      <path d={tubeLine(a, b, ws, 0.62, 0.15, 0.75)} fill="none" stroke={look.rim} strokeWidth={Math.max(0.5, wm * 0.11)} opacity={look.rimOp * 0.7} strokeLinecap="round" />
      {hd ? <path d={hd} stroke={look.hair} strokeWidth={Math.max(0.4, 0.55 * s)} opacity={0.45} /> : null}
    </g>
  );
};
export const AntLeg: React.FC<{ g: LegGeo; look: AntLook }> = ({ g, look }) => {
  const s = ANT_S * g.r;
  // the tarsus: basitarsus (long), three short segments, the claw segment
  const cuts = [0, 0.4, 0.56, 0.69, 0.8, 1];
  const tars = cuts.map((t) => lerp2(g.ankle, g.toe, t));
  const tu = norm(sub2(g.toe, g.ankle));
  const tn: P2 = [-tu[1], tu[0]];
  const claw = (sg: number) => {
    const a = add2(g.toe, mul2(tu, 1.5 * s));
    const c1 = add2(a, add2(mul2(tu, 5 * s), mul2(tn, sg * 1.2 * s)));
    const c2 = add2(a, add2(mul2(tu, 6.5 * s), mul2(tn, sg * 4.2 * s)));
    return `M${pt(a)}Q${pt(c1)} ${pt(c2)}`;
  };
  const tw = [5.4, 4.8, 4.4, 4.0, 3.6, 3.2];
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {/* distal first, proximal on top: the femur's end caps the knee, the coxa sits over the trochanter */}
      <path d={claw(1) + claw(-1)} fill="none" stroke={look.line} strokeWidth={Math.max(0.6, 1.1 * s)} />
      {tars.slice(0, 5).map((a, i) => (
        <Limb key={`t${i}`} a={a} b={tars[i + 1]} ws={[tw[i] * s, tw[i + 1] * s * 1.05, tw[i + 1] * s]} look={look} s={s} cap={0.3} />
      )).reverse()}
      <Limb a={g.knee} b={g.ankle} ws={[6.4 * s, 6.0 * s, 6.1 * s, 6.6 * s, 7.0 * s]} look={look} s={s} cap={0.35} hairs={5} />
      <Limb a={g.hip} b={g.knee} ws={[8.6 * s, 10.8 * s, 11.4 * s, 10.6 * s, 8.6 * s]} look={look} s={s} cap={0.45} />
      <Limb a={g.root} b={g.hip} ws={[14 * s, 13.5 * s, 11 * s]} look={look} s={s} cap={0.4} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// ANTENNAE: an elbowed antenna from the socket on the frons: scape angle and funiculus angle (head-local rad)
// ---------------------------------------------------------------------------
export const ANT_SOCKET: P2 = [38, -26];
export const Antenna: React.FC<{ head: Seg; scapeA: number; funA: number; look: AntLook; scale?: number; sock?: P2 }> = ({ head, scapeA, funA, look, scale = 1, sock: sockW }) => {
  const s = ANT_S * scale;
  const sock = sockW ?? headPt(head, ANT_SOCKET);
  const sDir = rot2([1, 0], head.a + scapeA);
  const elbow = add2(sock, mul2(sDir, 104 * s));
  const fDir = rot2([1, 0], head.a + funA);
  const n = 11;
  const seg = (128 * s) / n;
  const joints: P2[] = [elbow];
  let p = elbow;
  let dir = fDir;
  for (let i = 0; i < n; i++) {
    dir = rot2(dir, 0.045);
    p = add2(p, mul2(dir, seg));
    joints.push(p);
  }
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {joints.slice(0, n).map((a, i) => {
        const w0 = (3.3 + 0.08 * i) * s;
        const w1 = (i === n - 1 ? 1.6 : 3.6 + 0.08 * i) * s;
        return <Limb key={i} a={a} b={joints[i + 1]} ws={[w0 * 0.9, w1, w1 * 0.92]} look={look} s={s * 0.7} cap={0.3} />;
      }).reverse()}
      {/* the scape: long, slender at its base, thickening toward the elbow (clavate) */}
      <Limb a={sock} b={elbow} ws={[3.2 * s, 3.4 * s, 3.9 * s, 4.6 * s, 5.4 * s]} look={look} s={s * 0.8} cap={0.4} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BODY
// ---------------------------------------------------------------------------
/** the mycelium threads seen through the joints (world paths for a pose) */
export const jointThreads = (b: BodyPose): P2[][] => [
  [headPt(b.head, [-40, -34]), headPt(b.head, [-52, -14]), segPoint(b.meso, [70, -16]), segPoint(b.meso, [62, -30]), segPoint(b.meso, [44, -42])],
  [headPt(b.head, [-48, 16]), segPoint(b.meso, [72, 6]), segPoint(b.meso, [64, 20])],
  [segPoint(b.meso, [-56, -20]), segPoint(b.meso, [-70, 2]), segPoint(b.pet, [4, 8]), segPoint(b.gaster, [84, -10]), segPoint(b.gaster, [74, -34])],
  [segPoint(b.pet, [-10, 12]), segPoint(b.gaster, [82, 14]), segPoint(b.gaster, [62, 38])],
  [segPoint(b.meso, [60, 18]), segPoint(b.meso, [44, 26]), segPoint(b.meso, [22, 28])],
  [segPoint(b.meso, [-10, 28]), segPoint(b.meso, [-34, 27]), segPoint(b.meso, [-56, 22])],
  // V3: on the dark cuticle full-height threads across the gaster read as wasp stripes: the fungus shows only where
  // the membranes open at the plate edges' ends (the dorsal and the ventral margin), irregular in length
  [segPoint(b.gaster, [42, -55]), segPoint(b.gaster, [36, -34])],
  [segPoint(b.gaster, [30, 34]), segPoint(b.gaster, [34, 48])],
  [segPoint(b.gaster, [8, -60]), segPoint(b.gaster, [4, -48])],
  [segPoint(b.gaster, [-6, 38]), segPoint(b.gaster, [-2, 52]), segPoint(b.gaster, [4, 56])],
  [segPoint(b.gaster, [-24, -58]), segPoint(b.gaster, [-30, -40])],
];

const PROFILE = makeProj();
/** r2: the head's silhouette (world path), for masking what stands behind the head */
export const headOutline = (b: BodyPose) => silhouette(HEAD_L, b.head, PROFILE, true);
/** r2: the near jaw's outline (world path) */
export const jawOutline = (head: Seg, open: number) => `M${jawPath(head, "near", open).map(pt).join("L")}Z`;

/** the gaster's plate edges (x where each tergite's rear edge crosses the side) */
const TERGITES = [40, 6, -26, -54];
const plateEdge = (L: Loft, x0: number, bulge: number, P: Proj, s: Seg, shift = 0, s0 = -0.97, s1 = 0.97) => {
  const pts: P2[] = [];
  for (let j = 0; j <= 12; j++) {
    const sv = lerp(s0, s1, j / 12);
    const x = x0 + shift - bulge * (1 - sv * sv) - 7 * sv;
    pts.push(P(s, surf(L, x, sv)));
  }
  return smoothOpen(pts);
};
const lineAcross = (L: Loft, x0: number, bulge: number, P: Proj, s: Seg, head: boolean, s0 = -0.97, s1 = 0.97) => {
  const pts: P2[] = [];
  for (let j = 0; j <= 10; j++) {
    const sv = lerp(s0, s1, j / 10);
    pts.push(P(s, surf(L, x0 - bulge * (1 - sv * sv), sv), head));
  }
  return smoothOpen(pts);
};

export const AntBody: React.FC<{
  uid: string;
  b: BodyPose;
  look?: AntLook;
  mandOpen: number;
  myc: number;
  mycOpacity: number;
  mycWidth: number;
  /** 0..1 how strongly the membranes show the orange inside (default: from myc) */
  stain?: number;
  nearJaw?: boolean;
  view?: AntView;
  threads?: boolean;
}> = ({ uid, b, look = ANT_LOOK, mandOpen, myc, mycOpacity, mycWidth, stain, nearJaw = true, view, threads = true }) => {
  const s = ANT_S;
  const P = makeProj(view);
  const st = stain ?? Math.max(0, Math.min(1, 0.55 + 0.6 * (myc - 0.6)));
  const dHead = silhouette(HEAD_L, b.head, P, true, view);
  const dMeso = silhouette(MESO_L, b.meso, P, false, view);
  const dPet = silhouette(PET_L, b.pet, P, false, view);
  const dGas = silhouette(GASTER_L, b.gaster, P, false, view);
  // the gaster: the stained membranes behind each plate edge, then the edge (dark) with its lit lip in front
  const plates = [88, ...TERGITES, -90];
  const plateGloss = plates.slice(0, -1).map((xa, i) => {
    const xp = plates[i + 1];
    const pts: P2[] = [];
    for (let j = 0; j <= 8; j++) {
      const x = lerp(xp + 7, xa - (i === 0 ? 14 : 6), j / 8);
      pts.push(P(b.gaster, surf(GASTER_L, x, -0.66 - 0.06 * Math.sin((Math.PI * j) / 8))));
    }
    return smoothOpen(pts);
  });
  const gasterDetail = (
    <g fill="none" strokeLinecap="round">
      {plateGloss.map((d, i) => (
        <g key={`gl${i}`}>
          <path d={d} stroke={look.sheen} strokeWidth={9 * s} opacity={0.45} filter={`url(#${uid}-glow)`} />
          <path d={d} stroke={look.spec} strokeWidth={2.6 * s} opacity={0.8} />
        </g>
      ))}
      {TERGITES.map((x0, i) => (
        <g key={i}>
          <path d={plateEdge(GASTER_L, x0, 12 - i, P, b.gaster, -1.8, -0.97, -0.55 + 0.1 * (i % 2))} stroke={look.stain} strokeWidth={2 * s} opacity={0.8 * st} />
          <path d={plateEdge(GASTER_L, x0, 12 - i, P, b.gaster, -1.8, 0.5 - 0.12 * (i % 3), 0.97)} stroke={look.stain} strokeWidth={2 * s} opacity={0.8 * st} />
          {/* the plate edge: a fine dark line fading out toward the side's middle (an overlap, not a stripe) */}
          <path d={plateEdge(GASTER_L, x0, 12 - i, P, b.gaster, 0, -0.97, -0.2)} stroke={look.line} strokeWidth={1.4 * s} opacity={0.75} />
          <path d={plateEdge(GASTER_L, x0, 12 - i, P, b.gaster, 0, -0.2, 0.97)} stroke={look.line} strokeWidth={1.1 * s} opacity={0.4} />
        </g>
      ))}
    </g>
  );
  // the mesosoma: the promesonotal suture, the shallow metanotal groove, the pleural line, the propodeal spiracle
  const spir = P(b.meso, surf(MESO_L, -50, -0.2));
  const mesoDetail = (
    <g fill="none" strokeLinecap="round">
      <path d={lineAcross(MESO_L, 40, -3, P, b.meso, false, -0.98, 0.7)} stroke={look.line} strokeWidth={1.4 * s} opacity={0.75} />
      <path d={lineAcross(MESO_L, 42.4, -3, P, b.meso, false, -0.95, 0.6)} stroke={look.sheen} strokeWidth={1 * s} opacity={0.35} />
      <path d={lineAcross(MESO_L, -22, 2, P, b.meso, false, -0.98, 0.75)} stroke={look.line} strokeWidth={1.2 * s} opacity={0.55} />
      <path d={smoothOpen([P(b.meso, surf(MESO_L, 52, 0.25)), P(b.meso, surf(MESO_L, 10, 0.2)), P(b.meso, surf(MESO_L, -40, 0.3))])} stroke={look.line} strokeWidth={1.1 * s} opacity={0.45} />
      <ellipse cx={spir[0]} cy={spir[1]} rx={2.8 * s} ry={2.2 * s} fill={look.shade} stroke={look.sheen} strokeWidth={0.6 * s} strokeOpacity={0.5} />
    </g>
  );
  // the head: the clypeus, the frontal carina, the antennal socket, the eye
  const eyeX = 2;
  const eyeQ = surf(HEAD_L, eyeX, -0.38);
  const eyeC = P(b.head, eyeQ, true);
  const eyeR = P(b.head, [eyeX + 10, eyeQ[1], eyeQ[2]], true);
  const eyeU = P(b.head, [eyeX, eyeQ[1] - 7.5, eyeQ[2]], true);
  const sockQ = surf(HEAD_L, ANT_SOCKET[0], -0.55);
  const sock = P(b.head, [ANT_SOCKET[0], ANT_SOCKET[1], sockQ[2]], true);
  const headDetail = (
    <g fill="none" strokeLinecap="round">
      {/* the clypeus: its posterior suture and the front margin over the mandibles */}
      <path d={smoothOpen([P(b.head, surf(HEAD_L, 34, -0.75), true), P(b.head, surf(HEAD_L, 44, -0.35), true), P(b.head, surf(HEAD_L, 50, 0.15), true)])} stroke={look.line} strokeWidth={1.3 * s} opacity={0.6} />
      <path d={smoothOpen([P(b.head, surf(HEAD_L, 36, -0.72), true), P(b.head, surf(HEAD_L, 46, -0.32), true), P(b.head, surf(HEAD_L, 51.5, 0.12), true)])} stroke={look.sheen} strokeWidth={1 * s} opacity={0.35} />
      {/* the frontal carina running back from the socket */}
      <path d={smoothOpen([P(b.head, surf(HEAD_L, 40, -0.62), true), P(b.head, surf(HEAD_L, 26, -0.78), true), P(b.head, surf(HEAD_L, 12, -0.86), true)])} stroke={look.line} strokeWidth={1 * s} opacity={0.4} />
      {/* the gena under the eye, a fine line of the head capsule */}
      <path d={smoothOpen([P(b.head, surf(HEAD_L, -30, 0.1), true), P(b.head, surf(HEAD_L, -6, 0.22), true), P(b.head, surf(HEAD_L, 24, 0.3), true)])} stroke={look.line} strokeWidth={0.9 * s} opacity={0.3} />
      <circle cx={sock[0]} cy={sock[1]} r={4.2 * s} fill={look.shade} stroke={look.sheen} strokeWidth={0.8 * s} strokeOpacity={0.55} />
    </g>
  );
  const eyeRx = Math.hypot(eyeR[0] - eyeC[0], eyeR[1] - eyeC[1]);
  const eyeRy = Math.hypot(eyeU[0] - eyeC[0], eyeU[1] - eyeC[1]);
  const eyeA = (Math.atan2(eyeR[1] - eyeC[1], eyeR[0] - eyeC[0]) * 180) / Math.PI;
  // the facets: a fine hexagonal stipple fixed to the eye
  let facets = "";
  const fr = eyeRx / 5.2;
  for (let iy = -4; iy <= 4; iy++)
    for (let ix = -6; ix <= 6; ix++) {
      const fx = (ix + (iy % 2 ? 0.5 : 0)) * fr * 1.0;
      const fy = iy * fr * 0.87;
      if ((fx / eyeRx) ** 2 + (fy / eyeRy) ** 2 > 0.8) continue;
      facets += `M${f2(fx - fr * 0.38)},${f2(fy)}a${f2(fr * 0.38)},${f2(fr * 0.38)} 0 1 0 ${f2(fr * 0.76)},0a${f2(fr * 0.38)},${f2(fr * 0.38)} 0 1 0 ${f2(-fr * 0.76)},0`;
    }
  const sizeH = 100 * s * HEAD_K;
  const sheenOf = (L: Loft, sg: Seg, head: boolean, a: number, c: number, dep: number) => upperLine(L, sg, P, head, a, c, dep);
  const stainNeck = st > 0 ? (
    <g fill="none" strokeLinecap="round">
      {/* the neck membrane (between the head and the pronotal collar) and the waist (propodeum - petiole - gaster) */}
      <path d={lineAcross(MESO_L, 72, 0, P, b.meso, false, -0.7, 0.7)} stroke={look.stain} strokeWidth={5 * s} opacity={0.9 * st} />
      <path d={lineAcross(GASTER_L, 86, 0, P, b.gaster, false, -0.6, 0.7)} stroke={look.stain} strokeWidth={4.4 * s} opacity={0.9 * st} />
    </g>
  ) : null;
  return (
    <g>
      <defs>
        <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(2.2 * s)} />
        </filter>
      </defs>
      {/* the far mandible behind the head */}
      <Jaw head={b.head} which="far" open={mandOpen} look={look} view={view} />
      {stainNeck}
      <Shaded
        uid={`${uid}-g`}
        d={dGas}
        c={P(b.gaster, [0, loftAt(GASTER_L, 0).ctr, 0])}
        outline={outlineOf(GASTER_L, b.gaster, P, false, view)}
        size={120 * s}
        look={look}
        sheen={sheenOf(GASTER_L, b.gaster, false, 0.14, 0.84, 0.22)}
        over={<path d={setae(GASTER_L, b.gaster, P, false, [-84, -70, -58, -44, -30, -16, -2, 12, 26, 40, 54, 66, 76], 11) + setae(GASTER_L, b.gaster, P, false, [-78, -60, -40, -20, 0, 20, 40, 60], 9, true)} fill="none" stroke={look.hair} strokeWidth={0.75 * s} opacity={0.6} strokeLinecap="round" />}
      >
        {gasterDetail}
      </Shaded>
      <Shaded uid={`${uid}-p`} d={dPet} c={P(b.pet, [0, loftAt(PET_L, 0).ctr, 0])} outline={outlineOf(PET_L, b.pet, P, false, view)} size={46 * s} look={look} sheen={sheenOf(PET_L, b.pet, false, 0.2, 0.7, 0.2)} over={<path d={setae(PET_L, b.pet, P, false, [-3, 2, 6], 8)} fill="none" stroke={look.hair} strokeWidth={0.7 * s} opacity={0.55} />} />
      <Shaded
        uid={`${uid}-m`}
        d={dMeso}
        c={P(b.meso, [0, loftAt(MESO_L, 0).ctr, 0])}
        outline={outlineOf(MESO_L, b.meso, P, false, view)}
        size={92 * s}
        look={look}
        sheen={sheenOf(MESO_L, b.meso, false, 0.16, 0.86, 0.2)}
        spec={sheenOf(MESO_L, b.meso, false, 0.35, 0.72, 0.13)}
        over={<path d={setae(MESO_L, b.meso, P, false, [-36, -16, 8, 30, 50], 9)} fill="none" stroke={look.hair} strokeWidth={0.7 * s} opacity={0.5} strokeLinecap="round" />}
      >
        {mesoDetail}
      </Shaded>
      <Shaded
        uid={`${uid}-h`}
        d={dHead}
        c={P(b.head, [0, loftAt(HEAD_L, 0).ctr, 0], true)}
        outline={outlineOf(HEAD_L, b.head, P, true, view)}
        size={sizeH}
        look={look}
        sheen={sheenOf(HEAD_L, b.head, true, 0.12, 0.8, 0.2)}
        spec={sheenOf(HEAD_L, b.head, true, 0.25, 0.6, 0.14)}
        over={<path d={setae(HEAD_L, b.head, P, true, [-36, -18, 4, 22, 40], 8)} fill="none" stroke={look.hair} strokeWidth={0.65 * s} opacity={0.45} strokeLinecap="round" />}
      >
        {headDetail}
        {/* the compound eye: small, dark, faceted, a dull sheen toward the light (no glint) */}
        <g transform={`translate(${f2(eyeC[0])} ${f2(eyeC[1])}) rotate(${f2(eyeA)})`}>
          <defs>
            <radialGradient id={`${uid}-eg`} cx="0.32" cy="0.3" r="0.75">
              <stop offset="0" stopColor={look.eyeSheen} stopOpacity={0.55} />
              <stop offset="0.6" stopColor={look.eyeSheen} stopOpacity={0.1} />
              <stop offset="1" stopColor={look.eyeSheen} stopOpacity={0} />
            </radialGradient>
            <clipPath id={`${uid}-ec`}>
              <ellipse cx={0} cy={0} rx={eyeRx} ry={eyeRy} />
            </clipPath>
          </defs>
          <ellipse cx={0} cy={0} rx={eyeRx + 1.4 * s} ry={eyeRy + 1.4 * s} fill={look.mid} opacity={0.8} />
          <ellipse cx={0} cy={0} rx={eyeRx} ry={eyeRy} fill={look.eye} />
          <g clipPath={`url(#${uid}-ec)`}>
            <path d={facets} fill="none" stroke={look.eyeSheen} strokeWidth={0.45 * s} opacity={0.3} />
          </g>
          <ellipse cx={0} cy={0} rx={eyeRx} ry={eyeRy} fill={`url(#${uid}-eg)`} />
          <ellipse cx={0} cy={0} rx={eyeRx} ry={eyeRy} fill="none" stroke={look.line} strokeWidth={0.9 * s} />
        </g>
      </Shaded>
      {nearJaw ? <Jaw head={b.head} which="near" open={mandOpen} look={look} view={view} /> : null}
      {threads
        ? jointThreads(b).map((q, i) => <MyceliumThreads key={i} path={q} t={myc} seed={i + 3} width={mycWidth} spread={2.4} every={14} branchLen={11} opacity={mycOpacity} />)
        : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// V3: THE MYCELIUM THREADS of the dead ant (in life pale filaments growing out of the joints and gluing it to the leaf;
// here orange, the disease). Few and fine, so the dark body carries the read and the stalk stays the orange hero: a
// wavy, tapering filament out of the neck, the waist, the petiole, two plate edges and the near knees, each drawn by
// its moving tip, some forking once.
// ---------------------------------------------------------------------------
type TuftSpec = { seg: "head" | "meso" | "pet" | "gaster"; at: P2; dir: P2; len: number; fork?: boolean };
const TUFTS: TuftSpec[] = [
  { seg: "meso", at: [64, -36], dir: [0.3, -1], len: 30, fork: true },
  { seg: "meso", at: [70, 16], dir: [0.5, 1], len: 24 },
  { seg: "pet", at: [2, -32], dir: [-0.1, -1], len: 30, fork: true },
  { seg: "pet", at: [0, 14], dir: [0.2, 1], len: 22 },
  { seg: "gaster", at: [40, -56], dir: [-0.2, -1], len: 26 },
  { seg: "gaster", at: [6, 55], dir: [-0.1, 1], len: 24, fork: true },
  { seg: "meso", at: [-58, -22], dir: [-0.7, -1], len: 22 },
];
/** a filament: a wavy tapered centreline from root along dir (len), as a closed thin polygon */
const filament = (root: P2, dir: P2, len: number, w: number, wave: number, seed: number) => {
  const d0 = norm(dir);
  const n0: P2 = [-d0[1], d0[0]];
  const N = 10;
  const c: P2[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const off = wave * Math.sin(t * Math.PI * 1.6 + seed) * t;
    c.push(add2(add2(root, mul2(d0, len * t)), mul2(n0, off)));
  }
  const L: P2[] = [];
  const R: P2[] = [];
  c.forEach((q, i) => {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(N, i + 1)];
    const dd = norm(sub2(b, a));
    const n: P2 = [-dd[1], dd[0]];
    const ww = w * (1 - 0.8 * (i / N));
    L.push(add2(q, mul2(n, ww)));
    R.push(sub2(q, mul2(n, ww)));
  });
  return { d: `M${[...L, ...R.reverse()].map(pt).join("L")}Z`, mid: c[Math.round(N * 0.55)], dir: d0 };
};
/** the threads for a pose; t 0..1 (each starts a little after the last); the knees of the given legs get one too */
export const JointTufts: React.FC<{ b: BodyPose; t: number; legs?: LegGeo[] }> = ({ b, t, legs = [] }) => {
  if (t <= 0) return null;
  const s = ANT_S;
  const items: { root: P2; dir: P2; len: number; k: number; fork: boolean }[] = TUFTS.map((q, i) => {
    const sg = b[q.seg];
    const root = q.seg === "head" ? headPt(sg, q.at) : segPoint(sg, q.at);
    return { root, dir: rot2(q.dir, sg.a), len: q.len * s, k: i, fork: !!q.fork };
  });
  legs.forEach((g, i) => {
    const d = sub2(g.ankle, g.hip);
    const n: P2 = [-d[1], d[0]];
    const out = sub2(g.knee, mul2(add2(g.hip, g.ankle), 0.5));
    const dir = n[0] * out[0] + n[1] * out[1] >= 0 ? n : mul2(n, -1);
    items.push({ root: g.knee, dir, len: 20 * s * g.r, k: TUFTS.length + i, fork: false });
  });
  let d = "";
  items.forEach((q) => {
    const start = (q.k % 7) * 0.05;
    const u = Math.max(0, Math.min(1, (t - start) / (1 - 0.3)));
    if (u <= 0) return;
    const e = 1 - Math.pow(1 - u, 2);
    const f = filament(q.root, q.dir, q.len * e, 1.25 * s, 3.2 * s, q.k * 1.7);
    d += f.d;
    if (q.fork && e > 0.5) {
      const fd = rot2(f.dir, (q.k % 2 ? 1 : -1) * 0.6);
      d += filament(f.mid, fd, q.len * 0.45 * (e - 0.5) * 2, 0.8 * s, 2 * s, q.k).d;
    }
  });
  return (
    <g>
      <path d={d} fill="none" stroke={FUNGUS.hatch} strokeWidth={0.9 * s} strokeOpacity={0.55} strokeLinejoin="round" />
      <path d={d} fill={FUNGUS.main} />
    </g>
  );
};
