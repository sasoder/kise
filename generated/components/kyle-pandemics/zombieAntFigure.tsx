// ---------------------------------------------------------------------------
// zombieAntFigure: the engraved carpenter ant of ZombieAnt (kyle-pandemics, cut 58), in profile. Cream volumes (the
// house figure manner: cream form, firm DARK outline, hatching on the side turned from the light, light from the
// upper left), drawn per segment from the world file's BodyPose: head (mandibles, compound eye, elbowed antennae),
// mesosoma (an evenly arched Camponotus dorsum), petiole (an upright scale), gaster (banded tergites, fine setae),
// six jointed legs (coxa, femur, tibia, a segmented tarsus with a claw). Far-side legs and antenna sink a step toward
// the page (they stand ~60 behind the near ones). Shapes after Camponotus workers in profile (AntWiki / antweb
// plates); proportions only.
// ---------------------------------------------------------------------------
import React from "react";
import { MyceliumThreads } from "./cordyceps";
import {
  ANT_S,
  FORESHORTEN,
  LEG_BONES,
  add2,
  mul2,
  proj,
  rOf,
  rot2,
  segDorsal,
  segPoint,
  sub2,
  type BodyPose,
  type Eye,
  type P2,
  type Seg,
} from "./zombieAntWorld";

export const DARK = "#17120D";
export type AntInk = { main: string; deep: string; hair: string; hi: string };
export const ANT_INK: AntInk = { main: "#E9DDBF", deep: "#CBBB95", hair: "#958866", hi: "#F7F1DF" };
const PAGE = "#3F3428";
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = Math.max(0, Math.min(1, t));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};
/** an ant ink sunk toward the page by t (the far side) */
export const sinkInk = (ink: AntInk, t: number): AntInk => ({ main: mixHex(ink.main, PAGE, t), deep: mixHex(ink.deep, PAGE, t), hair: mixHex(ink.hair, PAGE, t), hi: mixHex(ink.hi, PAGE, t) });

const f2 = (v: number) => v.toFixed(2);
const pt = (p: P2) => `${f2(p[0])},${f2(p[1])}`;
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
const LT: P2 = [-0.6, -0.8];
const hatchLines = (c: P2, R: number, gap: number, ang: number) => {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  let d = "";
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const px = c[0] - dy * o;
    const py = c[1] + dx * o;
    d += `M${pt([px - dx * R, py - dy * R])}L${pt([px + dx * R, py + dy * R])}`;
  }
  return d;
};

// ---------------------------------------------------------------------------
// SHAPES (segment-local, unscaled: +x forward, +y ventral)
// ---------------------------------------------------------------------------
const HEAD: P2[] = [
  [-46, 22], [-54, 6], [-55, -12], [-48, -30], [-34, -42], [-14, -48], [8, -48], [28, -42], [44, -30], [54, -14], [58, 2], [56, 14], [48, 24], [34, 32], [14, 36], [-8, 36], [-28, 32],
];
const MESO: P2[] = [
  [66, 22], [74, 6], [71, -12], [58, -30], [36, -44], [8, -50], [-20, -46], [-44, -34], [-60, -18], [-70, -2], [-72, 12], [-64, 24], [-36, 28], [0, 29], [40, 27],
];
const PET: P2[] = [
  [14, 10], [12, -6], [8, -26], [2, -34], [-6, -30], [-12, -10], [-14, 10], [0, 14],
];
const GASTER: P2[] = [
  [86, -2], [78, -30], [56, -50], [24, -60], [-12, -60], [-46, -50], [-72, -32], [-88, -8], [-90, 6], [-82, 22], [-62, 42], [-30, 54], [6, 56], [42, 50], [68, 34], [84, 16],
];
/** r1: the two mandibles as curved, toothed blades (a pincer): centrelines from each hinge, the near one (ventral
 *  hinge) curving dorsally at its tip, the far one (dorsal hinge) curving ventrally, so closed they cross */
const JAW_NEAR: P2[] = [[0, 0], [19, -1], [36, -5], [49, -11], [58, -19]];
const JAW_FAR: P2[] = [[0, 0], [19, 1], [36, 5], [49, 11], [58, 19]];
const HINGE_NEAR: P2 = [50, 18];
const HINGE_FAR: P2 = [48, 4];
/** one mandible blade in the world: a tapered curved blade with teeth on its concave (inner) edge */
const jawPath = (head: Seg, which: "near" | "far", open: number) => {
  const cl = which === "near" ? JAW_NEAR : JAW_FAR;
  const hinge = which === "near" ? HINGE_NEAR : HINGE_FAR;
  const rotA = which === "near" ? 0.62 * open : -0.62 * open;
  const pts = cl.map((q) => add2(hinge, rot2(q, rotA)));
  const inner = which === "near" ? -1 : 1; // the concave side's y-sign (toward the other jaw)
  const W = [10, 9.5, 7.5, 5, 1.3];
  const outer: P2[] = [];
  const innerE: P2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const d = sub2(b, a);
    const l = Math.hypot(d[0], d[1]) || 1;
    const n: P2 = [-d[1] / l, d[0] / l]; // + y-ish normal
    const sgn = n[1] * inner > 0 ? 1 : -1;
    innerE.push(add2(p, mul2(n, sgn * W[i] * 0.5)));
    outer.push(add2(p, mul2(n, -sgn * W[i] * 0.5)));
  });
  // teeth: small points along the inner edge between the 2nd and 4th samples
  const teeth: P2[] = [];
  for (let i = 1; i < 4; i++) {
    const a = innerE[i];
    const b = innerE[i + 1];
    const m = mul2(add2(a, b), 0.5);
    const d = sub2(b, a);
    const l = Math.hypot(d[0], d[1]) || 1;
    let n: P2 = [-d[1] / l, d[0] / l];
    if (n[1] * inner < 0) n = mul2(n, -1);
    teeth.push(a, add2(m, mul2(n, 3.8)));
  }
  teeth.push(innerE[4]);
  const local = [...outer, ...teeth.reverse(), innerE[1], innerE[0]];
  return local.map((q) => segPoint(head, q));
};
export const Jaw: React.FC<{ head: Seg; which: "near" | "far"; open: number; ink: AntInk }> = ({ head, which, open, ink }) => {
  const pts = jawPath(head, which, open);
  const s = ANT_S;
  return <path d={`M${pts.map(pt).join("L")}Z`} fill={which === "near" ? ink.main : ink.deep} stroke={DARK} strokeWidth={2 * s} strokeLinejoin="round" />;
};

/** one shaded engraved volume: the shape, a form shadow on the side turned from the light, hatching across it,
 *  a highlight on the upper left and the casing */
const Volume: React.FC<{ uid: string; pts: P2[]; size: number; ink: AntInk; hatch?: number; children?: React.ReactNode; over?: React.ReactNode }> = ({ uid, pts, size, ink, hatch = 0.38, children, over }) => {
  const d = smoothClosed(pts);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const c: P2 = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 4;
  const s1 = mul2(LT, size * 0.07);
  const s2 = mul2(LT, size * 0.24);
  const hi = add2(c, mul2(LT, R * 0.38));
  return (
    <g>
      <clipPath id={`${uid}-c`}>
        <path d={d} />
      </clipPath>
      <g clipPath={`url(#${uid}-c)`}>
        <path d={d} fill={ink.hair} />
        <path d={d} fill={ink.deep} transform={`translate(${f2(s1[0])} ${f2(s1[1])})`} />
        <path d={hatchLines(c, R, Math.max(2.4, size * 0.045), -0.95)} stroke={DARK} strokeWidth={Math.max(0.7, size * 0.011)} strokeOpacity={hatch} fill="none" />
        <path d={d} fill={ink.main} transform={`translate(${f2(s2[0])} ${f2(s2[1])})`} />
        <ellipse cx={hi[0]} cy={hi[1]} rx={R * 0.32} ry={R * 0.16} transform={`rotate(-38 ${f2(hi[0])} ${f2(hi[1])})`} fill={ink.hi} opacity={0.55} />
        {children}
      </g>
      <path d={d} fill="none" stroke={DARK} strokeWidth={Math.max(1.6, size * 0.03)} strokeLinejoin="round" />
      {over}
    </g>
  );
};

// ---------------------------------------------------------------------------
// LEGS
// ---------------------------------------------------------------------------
export type LegGeo = { id: string; side: number; pair: number; root: P2; hip: P2; knee: P2; ankle: P2; toe: P2; r: number };
/** two-bone IK in 2D: the knee on the side of `pref` */
export const solveKnee = (hip: P2, ankle: P2, a: number, b: number, pref: P2): { knee: P2; ankle: P2 } => {
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
  const u = mul2(d, 1 / L);
  const ca = Math.max(-1, Math.min(1, (a * a + L * L - b * b) / (2 * a * L)));
  const A = Math.acos(ca);
  const k1 = add2(hip, mul2(rot2(u, A), a));
  const k2 = add2(hip, mul2(rot2(u, -A), a));
  const mid = add2(hip, mul2(d, 0.5));
  const s1 = (k1[0] - mid[0]) * pref[0] + (k1[1] - mid[1]) * pref[1];
  const s2 = (k2[0] - mid[0]) * pref[0] + (k2[1] - mid[1]) * pref[1];
  return { knee: s1 >= s2 ? k1 : k2, ankle: an };
};
/** the leg's root, hip (coxa end), knee, ankle for a toe and a tarsus direction (unit, ankle -> toe), projected */
export const legGeometry = (e: Eye, meso: Seg, pair: number, side: number, toe3: [number, number, number], tarsDir: P2, id: string): LegGeo => {
  const B = LEG_BONES[pair];
  const zr = side * 16;
  const r = rOf(e, side * 34);
  const root2 = segPoint(meso, B.attach);
  const root = proj(e, root2[0], root2[1], zr);
  // the coxa hangs down and a little back from its socket
  const cdir = rot2([-0.38, 0.92], meso.a);
  const hip = add2(root, mul2(cdir, B.coxa * ANT_S * r));
  const toe = proj(e, toe3[0], toe3[1], toe3[2]);
  const ankleT = sub2(toe, mul2(tarsDir, B.tarsus * ANT_S * r * 0.92));
  const { knee, ankle } = solveKnee(hip, ankleT, B.femur * ANT_S * r * FORESHORTEN, B.tibia * ANT_S * r * FORESHORTEN, segDorsal(meso));
  return { id, side, pair, root, hip, knee, ankle, toe: ankle === ankleT ? toe : add2(ankle, mul2(tarsDir, B.tarsus * ANT_S * r * 0.92)), r };
};

const bone = (a: P2, b: P2, wa: number, wb: number) => {
  const d = sub2(b, a);
  const L = Math.hypot(d[0], d[1]) || 1;
  const n: P2 = [-d[1] / L, d[0] / L];
  return `M${pt(add2(a, mul2(n, wa)))}L${pt(add2(b, mul2(n, wb)))}L${pt(sub2(b, mul2(n, wb)))}L${pt(sub2(a, mul2(n, wa)))}Z`;
};
/** the shade line along a bone: offset away from the light */
const shadeLine = (a: P2, b: P2, w: number) => {
  const d = sub2(b, a);
  const L = Math.hypot(d[0], d[1]) || 1;
  let n: P2 = [-d[1] / L, d[0] / L];
  if (n[0] * LT[0] + n[1] * LT[1] > 0) n = mul2(n, -1);
  const o = mul2(n, w * 0.42);
  return `M${pt(add2(a, o))}L${pt(add2(b, o))}`;
};
export const AntLeg: React.FC<{ g: LegGeo; ink: AntInk }> = ({ g, ink }) => {
  const s = ANT_S * g.r;
  const ow = Math.max(1.2, 2.1 * s);
  const parts: { a: P2; b: P2; wa: number; wb: number }[] = [
    { a: g.root, b: g.hip, wa: 9 * s, wb: 8 * s },
    { a: g.hip, b: g.knee, wa: 7.4 * s, wb: 5.6 * s },
    { a: g.knee, b: g.ankle, wa: 4.8 * s, wb: 3.9 * s },
  ];
  // the tarsus: five tapering segments and a claw
  const tars: P2[] = [];
  for (let i = 0; i <= 5; i++) tars.push([g.ankle[0] + (g.toe[0] - g.ankle[0]) * (i / 5), g.ankle[1] + (g.toe[1] - g.ankle[1]) * (i / 5)]);
  const td = sub2(g.toe, g.ankle);
  const tl = Math.hypot(td[0], td[1]) || 1;
  const tu = mul2(td, 1 / tl);
  const claw = add2(g.toe, add2(mul2(tu, 6 * s), mul2(rot2(tu, Math.PI / 2), 3 * s)));
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {parts.map((q, i) => (
        <g key={i}>
          <path d={bone(q.a, q.b, q.wa, q.wb)} fill={ink.main} stroke={DARK} strokeWidth={ow} />
          <path d={shadeLine(q.a, q.b, (q.wa + q.wb) / 2)} stroke={ink.hair} strokeWidth={((q.wa + q.wb) / 2) * 0.55} />
        </g>
      ))}
      <circle cx={g.knee[0]} cy={g.knee[1]} r={5.2 * s} fill={ink.deep} stroke={DARK} strokeWidth={ow * 0.8} />
      <circle cx={g.ankle[0]} cy={g.ankle[1]} r={3.6 * s} fill={ink.deep} stroke={DARK} strokeWidth={ow * 0.7} />
      {tars.slice(0, 5).map((a, i) => (
        <path key={`t${i}`} d={bone(a, tars[i + 1], (3.0 - 0.3 * i) * s, (2.4 - 0.25 * i) * s)} fill={ink.main} stroke={DARK} strokeWidth={ow * 0.75} />
      ))}
      <path d={`M${pt(g.toe)}Q${pt(add2(g.toe, mul2(tu, 5 * s)))} ${pt(claw)}`} fill="none" stroke={DARK} strokeWidth={ow * 0.8} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// ANTENNAE
// ---------------------------------------------------------------------------
/** an elbowed antenna from the socket on the head: scape angle and funiculus angle (head-local rad, 0 = forward) */
export const Antenna: React.FC<{ head: Seg; scapeA: number; funA: number; ink: AntInk; scale?: number }> = ({ head, scapeA, funA, ink, scale = 1 }) => {
  const s = ANT_S * scale;
  const sock = segPoint(head, [38, -26]);
  const sDir = rot2([1, 0], head.a + scapeA);
  const elbow = add2(sock, mul2(sDir, 104 * s));
  const fDir = rot2([1, 0], head.a + funA);
  const beads: React.ReactNode[] = [];
  const n = 11;
  const seg = (128 * s) / n;
  let p = elbow;
  let dir = fDir;
  for (let i = 0; i < n; i++) {
    // the funiculus curls a little toward its tip
    dir = rot2(dir, 0.045);
    const q = add2(p, mul2(dir, seg));
    const c = mul2(add2(p, q), 0.5);
    const ang = (Math.atan2(dir[1], dir[0]) * 180) / Math.PI;
    beads.push(
      <ellipse key={i} cx={c[0]} cy={c[1]} rx={seg * 0.58} ry={(2.7 + 0.12 * i) * s} transform={`rotate(${f2(ang)} ${f2(c[0])} ${f2(c[1])})`} fill={ink.main} stroke={DARK} strokeWidth={Math.max(1, 1.5 * s)} />,
    );
    p = q;
  }
  return (
    <g strokeLinejoin="round">
      <path d={bone(sock, elbow, 3.2 * s, 4.6 * s)} fill={ink.main} stroke={DARK} strokeWidth={Math.max(1.1, 1.9 * s)} />
      <path d={shadeLine(sock, elbow, 3.9 * s)} stroke={ink.hair} strokeWidth={2 * s} />
      <circle cx={elbow[0]} cy={elbow[1]} r={4.4 * s} fill={ink.deep} stroke={DARK} strokeWidth={Math.max(1, 1.6 * s)} />
      {beads}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BODY
// ---------------------------------------------------------------------------
const toWorld = (s: Seg, pts: P2[]) => pts.map((q) => segPoint(s, q));
/** the mycelium threads seen through the joints (world paths for a pose) */
export const jointThreads = (b: BodyPose): P2[][] => [
  // across the neck: head back -> pronotum
  [segPoint(b.head, [-40, -34]), segPoint(b.head, [-52, -14]), segPoint(b.meso, [70, -16]), segPoint(b.meso, [62, -30]), segPoint(b.meso, [44, -42])],
  [segPoint(b.head, [-48, 16]), segPoint(b.meso, [72, 6]), segPoint(b.meso, [64, 20])],
  // the waist: propodeum -> petiole -> gaster
  [segPoint(b.meso, [-56, -20]), segPoint(b.meso, [-70, 2]), segPoint(b.pet, [4, 8]), segPoint(b.gaster, [84, -10]), segPoint(b.gaster, [74, -34])],
  [segPoint(b.pet, [-10, 12]), segPoint(b.gaster, [82, 14]), segPoint(b.gaster, [62, 38])],
  // the coxal joints
  [segPoint(b.meso, [60, 18]), segPoint(b.meso, [44, 26]), segPoint(b.meso, [22, 28])],
  [segPoint(b.meso, [-10, 28]), segPoint(b.meso, [-34, 27]), segPoint(b.meso, [-56, 22])],
  // the gaster's intersegmental membranes
  [segPoint(b.gaster, [50, -54]), segPoint(b.gaster, [44, -18]), segPoint(b.gaster, [42, 22]), segPoint(b.gaster, [46, 50])],
  [segPoint(b.gaster, [14, -60]), segPoint(b.gaster, [8, -20]), segPoint(b.gaster, [6, 26])],
  [segPoint(b.gaster, [-24, -58]), segPoint(b.gaster, [-30, -14]), segPoint(b.gaster, [-30, 30])],
];

/** r2: the head's silhouette (world path), for masking what stands behind the head */
export const headOutline = (b: BodyPose) => smoothClosed(HEAD.map((q) => segPoint(b.head, q)));
/** r2: the near jaw's outline (world path) */
export const jawOutline = (head: Seg, open: number) => `M${jawPath(head, "near", open).map(pt).join("L")}Z`;

export const AntBody: React.FC<{ uid: string; b: BodyPose; ink: AntInk; mandOpen: number; myc: number; mycOpacity: number; mycWidth: number; nearJaw?: boolean }> = ({ uid, b, ink, mandOpen, myc, mycOpacity, mycWidth, nearJaw = true }) => {
  const s = ANT_S;
  const head = toWorld(b.head, HEAD);
  const meso = toWorld(b.meso, MESO);
  const pet = toWorld(b.pet, PET);
  const gaster = toWorld(b.gaster, GASTER);
  // tergite edges across the gaster (convex toward the back)
  const terg = [54, 18, -20, -54].map((x0, i) => {
    const pts: P2[] = [];
    for (let j = 0; j <= 8; j++) {
      const y = -60 + (j / 8) * 114;
      const yy = y / 58;
      pts.push(segPoint(b.gaster, [x0 - (9 - i) * (1 - yy * yy) + 2, y]));
    }
    return pts;
  });
  const setae: string[] = [];
  [54, 18, -20, -54, -86].forEach((x0, i) => {
    for (let j = 0; j < 7; j++) {
      const y = -54 + j * 15 + (i % 2) * 6;
      const a = segPoint(b.gaster, [x0 - 6, y]);
      const c = segPoint(b.gaster, [x0 - 18, y + 4]);
      setae.push(`M${pt(a)}L${pt(c)}`);
    }
  });
  // the compound eye
  const eyeC = segPoint(b.head, [10, -18]);
  const eyeA = ((b.head.a * 180) / Math.PI - 12).toFixed(2);
  const sizeH = 96 * s;
  return (
    <g>
      {/* the far mandible behind the head */}
      <Jaw head={b.head} which="far" open={mandOpen} ink={ink} />
      <Volume uid={`${uid}-g`} pts={gaster} size={118 * s} ink={ink}>
        {terg.map((q, i) => (
          <path key={i} d={smoothOpen(q)} fill="none" stroke={DARK} strokeWidth={1.9 * s} strokeOpacity={0.75} />
        ))}
        <path d={setae.join("")} stroke={DARK} strokeWidth={0.9 * s} strokeOpacity={0.45} />
      </Volume>
      <Volume uid={`${uid}-p`} pts={pet} size={44 * s} ink={ink} />
      <Volume uid={`${uid}-m`} pts={meso} size={80 * s} ink={ink}>
        <path d={smoothOpen([segPoint(b.meso, [28, -47]), segPoint(b.meso, [34, -10]), segPoint(b.meso, [38, 26])])} fill="none" stroke={DARK} strokeWidth={1.4 * s} strokeOpacity={0.55} />
        <path d={smoothOpen([segPoint(b.meso, [-34, -40]), segPoint(b.meso, [-26, -6]), segPoint(b.meso, [-22, 27])])} fill="none" stroke={DARK} strokeWidth={1.2 * s} strokeOpacity={0.4} />
        <ellipse cx={segPoint(b.meso, [-56, -8])[0]} cy={segPoint(b.meso, [-56, -8])[1]} rx={3.2 * s} ry={2.4 * s} fill={DARK} opacity={0.6} />
      </Volume>
      <Volume uid={`${uid}-h`} pts={head} size={sizeH} ink={ink}>
        <path d={smoothOpen([segPoint(b.head, [44, -30]), segPoint(b.head, [52, -10]), segPoint(b.head, [54, 10])])} fill="none" stroke={DARK} strokeWidth={1.4 * s} strokeOpacity={0.5} />
      </Volume>
      {/* the eye: dark, faceted, a glint toward the light */}
      <ellipse cx={eyeC[0]} cy={eyeC[1]} rx={16 * s} ry={11 * s} transform={`rotate(${eyeA} ${f2(eyeC[0])} ${f2(eyeC[1])})`} fill="#2A2018" stroke={DARK} strokeWidth={2 * s} />
      <ellipse cx={eyeC[0] - 5 * s} cy={eyeC[1] - 4 * s} rx={5 * s} ry={3 * s} transform={`rotate(${eyeA} ${f2(eyeC[0] - 5 * s)} ${f2(eyeC[1] - 4 * s)})`} fill={ink.hi} opacity={0.55} />
      {nearJaw ? <Jaw head={b.head} which="near" open={mandOpen} ink={ink} /> : null}
      {/* the fungus already in it: threads through the joints */}
      {jointThreads(b).map((q, i) => (
        <MyceliumThreads key={i} path={q} t={myc} seed={i + 3} width={mycWidth} spread={2.4} every={14} branchLen={11} opacity={mycOpacity} />
      ))}
    </g>
  );
};
