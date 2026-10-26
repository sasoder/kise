// ---------------------------------------------------------------------------
// peopleButIronProps — the cut-local set pieces of PeopleButIron (kyle-rome-industrial, cut 34), drawn air-lit on the
// kit's AirWorld (kits/dwarkesh-3d/dwarkesh3d): a prism at any plan angle (slabs, blocks, rocks: the yard is not laid
// on a grid), a horizontal log at any plan angle (the rollers), rubble chips batched by depth band, the iron toolkit
// (hammer, tongs, chisel, pick, sickle, saw, axe, file) as flat gouache silhouettes in iron slate and timber umber, and
// the strike sparks (cream, never orange: no technology here).
// ---------------------------------------------------------------------------
import React from "react";
import { MAT, lineOf, mixHex, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { h01 } from "./peopleButIronPlan";

const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const CREAM = "#F3EBDD";
const SHADOW = "#22180F";

/** the eye in world coordinates (Y up is -) */
export type EyePos = { x: number; y: number; z: number };

/** dressed stone (light tufa / travertine) and the rough bedrock */
export const TUFA: Mat = { lit: "#C4B59A", mid: "#A09077", dark: "#605444" };
export const ROCK: Mat = { lit: "#9C8B76", mid: "#76695A", dark: "#40372F" };
/** the near rubble: the ground's own stone, muted (light chips near the lens read as tiles) */
export const RUBBLE: Mat = { lit: "#8C7E67", mid: "#6C604E", dark: "#423A30" };
export const PLASTER: Mat = { lit: "#B9A98C", mid: "#968770", dark: "#5C5245" };

const convexHull = (pts: P2[]): P2[] => {
  const p = [...pts].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (p.length < 3) return p;
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};

// ===================================================================================================================
// A PRISM AT ANY PLAN ANGLE (a box turned about the vertical): visible faces only, lit from the upper left
// ===================================================================================================================
/** light from the upper left and a little toward us (plan components of the side faces' lighting) */
const LX = -0.75;
const LZ = -0.45;
export const Prism: React.FC<{ A: AirWorld; eye: EyePos; X: number; Z: number; w: number; d: number; Y0: number; Y1?: number; ang?: number; mat: Mat; uid: string; rim?: number }> = ({
  A,
  eye,
  X,
  Z,
  w,
  d,
  Y0,
  Y1 = 0,
  ang = 0,
  mat,
  rim = 1,
}) => {
  const P = A.P;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  // corners in plan, counter-clockwise seen from above (X right, Z away)
  const loc: P2[] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ];
  const cr = loc.map(([u, v]) => [X + u * c - v * s, Z + u * s + v * c] as P2);
  const h = -(Y0 + Y1) / 2;
  const fz = A.fog(Z);
  const t = (hex: string) => A.tone(hex, Z, h);
  const ln = t(lineOf(mat));
  const lw = A.lw(1.0);
  const els: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const a = cr[i];
    const b = cr[(i + 1) % 4];
    // outward normal in plan (the corners run counter-clockwise from above: X right, Z away)
    const ex = b[0] - a[0];
    const ez = b[1] - a[1];
    const L = Math.hypot(ex, ez) || 1;
    const nx = ez / L;
    const nz = -ex / L;
    const mx = (a[0] + b[0]) / 2;
    const mz = (a[1] + b[1]) / 2;
    if (nx * (eye.x - mx) + nz * (eye.z - mz) <= 0) continue;
    const lit = Math.max(0, Math.min(1, 0.5 + 0.6 * (nx * LX + nz * LZ)));
    const col = lit > 0.5 ? mixHex(mat.mid, mat.lit, (lit - 0.5) * 2 * 0.8) : mixHex(mat.dark, mat.mid, 0.35 + lit * 1.3);
    const q: P2[] = [P.p(a[0], Y0, a[1]), P.p(b[0], Y0, b[1]), P.p(b[0], Y1, b[1]), P.p(a[0], Y1, a[1])];
    els.push(<path key={`s${i}`} d={poly(q)} fill={t(col)} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />);
  }
  const topSeen = eye.y < Y0;
  if (topSeen) {
    const tq = cr.map(([x, z]) => P.p(x, Y0, z));
    els.push(<path key="tp" d={poly(tq)} fill={t(mat.lit)} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />);
    // the rim: the top's edges that face the light (up-left)
    const ra = (1 - fz) * 0.55 * rim;
    if (ra > 0.01) {
      let dd = "";
      for (let i = 0; i < 4; i++) {
        const a = cr[i];
        const b = cr[(i + 1) % 4];
        const ex = b[0] - a[0];
        const ez = b[1] - a[1];
        const L = Math.hypot(ex, ez) || 1;
        const nx = ez / L;
        const nz = -ex / L;
        if (nx * LX + nz * LZ > 0.05) dd += `M${Pt(P.p(a[0], Y0, a[1]))}L${Pt(P.p(b[0], Y0, b[1]))}`;
      }
      if (dd) els.push(<path key="rim" d={dd} fill="none" stroke={CREAM} strokeWidth={lw * 1.2} strokeOpacity={ra} strokeLinecap="round" />);
    }
  }
  return <g>{els}</g>;
};

// ===================================================================================================================
// A HORIZONTAL LOG (a roller) at any plan angle: the silhouette is the hull of its two end circles; the end toward
// the eye shows its rings and a turning mark
// ===================================================================================================================
export const Log: React.FC<{ A: AirWorld; eye: EyePos; X: number; Z: number; Yc: number; R: number; len: number; ang: number; turn: number; mat?: Mat; uid: string }> = ({
  A,
  eye,
  X,
  Z,
  Yc,
  R,
  len,
  ang,
  turn,
  mat = MAT.timber,
  uid,
}) => {
  const P = A.P;
  // the axis direction in plan
  const ax = Math.cos(ang);
  const az = Math.sin(ang);
  // the circle's in-plane horizontal direction (perpendicular to the axis)
  const px = -az;
  const pz = ax;
  const N = 18;
  const ring = (sgn: number): P2[] => {
    const cx = X + (ax * len * sgn) / 2;
    const cz = Z + (az * len * sgn) / 2;
    const out: P2[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      out.push(P.p(cx + px * R * Math.cos(a), Yc + R * Math.sin(a), cz + pz * R * Math.cos(a)));
    }
    return out;
  };
  const e0 = ring(-1);
  const e1 = ring(1);
  const hull = convexHull([...e0, ...e1]);
  // the end facing the eye
  const toEye = ax * (eye.x - X) + az * (eye.z - Z);
  const endS = toEye > 0 ? 1 : -1;
  const end = endS > 0 ? e1 : e0;
  const t = (hex: string) => A.tone(hex, Z, -Yc);
  const ln = t(lineOf(mat));
  const lw = A.lw(0.9);
  const ecx = X + (ax * len * endS) / 2;
  const ecz = Z + (az * len * endS) / 2;
  const mark = (k: number): P2 => {
    const a = turn + (k * Math.PI * 2) / 3;
    return P.p(ecx + px * R * 0.8 * Math.cos(a), Yc + R * 0.8 * Math.sin(a), ecz + pz * R * 0.8 * Math.cos(a));
  };
  const cc = P.p(ecx, Yc, ecz);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={P.p(X, Yc - R, Z)[1]} x2="0" y2={P.p(X, Yc + R, Z)[1]}>
          <stop offset="0" stopColor={t(mat.lit)} />
          <stop offset="0.45" stopColor={t(mat.mid)} />
          <stop offset="1" stopColor={t(mixHex(mat.dark, SHADOW, 0.2))} />
        </linearGradient>
      </defs>
      <path d={poly(hull)} fill={`url(#${uid}g)`} stroke={ln} strokeWidth={lw} />
      <path d={poly(end)} fill={t("#B08E66")} stroke={ln} strokeWidth={lw} />
      <path d={poly(end.map((q) => [cc[0] + (q[0] - cc[0]) * 0.55, cc[1] + (q[1] - cc[1]) * 0.55] as P2))} fill="none" stroke={t("#7A5E42")} strokeWidth={lw * 0.8} />
      <path d={`M${Pt(cc)}L${Pt(mark(0))}M${Pt(cc)}L${Pt(mark(1))}M${Pt(cc)}L${Pt(mark(2))}`} stroke={t("#6A5038")} strokeWidth={lw * 1.1} strokeLinecap="round" />
    </g>
  );
};

// ===================================================================================================================
// RUBBLE: stone chips on the ground, batched into a few paths by depth band (fogged per band)
// ===================================================================================================================
export type Chip = { X: number; Z: number; r: number; h: number; ang: number; n: number; tone: number };
export const makeChips = (seed: number, count: number, x0: number, x1: number, z0: number, z1: number, rMin: number, rMax: number, bias = 1.6): Chip[] =>
  Array.from({ length: count }, (_, i) => {
    const u = h01(seed + i, 21);
    return {
      X: x0 + (x1 - x0) * h01(seed + i, 22),
      Z: z0 + (z1 - z0) * Math.pow(u, bias),
      r: rMin + (rMax - rMin) * Math.pow(h01(seed + i, 23), 2),
      h: 0.45 + 0.4 * h01(seed + i, 24),
      ang: h01(seed + i, 25) * Math.PI * 2,
      n: 5 + Math.floor(h01(seed + i, 26) * 3),
      tone: h01(seed + i, 27),
    };
  });
export const Chips: React.FC<{ A: AirWorld; eye: EyePos; chips: Chip[]; mat: Mat; bands?: number[]; uid: string; cull?: (c: Chip) => boolean }> = ({ A, eye, chips, mat, bands = [-2000, -600, -200, 200, 700, 1300, 2200, 3600], cull }) => {
  const P = A.P;
  const nb = bands.length - 1;
  const sides: string[][] = Array.from({ length: nb * 2 }, () => []);
  const tops: string[][] = Array.from({ length: nb * 2 }, () => []);
  for (const c of chips) {
    if (c.Z < P.zNear + 60) continue;
    if (cull && cull(c)) continue;
    // screen size check: skip chips smaller than ~1 px
    const sz = c.r * P.r(c.Z) * A.k;
    if (sz < 0.9) continue;
    let b = 0;
    while (b < nb - 1 && c.Z > bands[b + 1]) b++;
    const top: P2[] = [];
    const bot: P2[] = [];
    for (let i = 0; i < c.n; i++) {
      // angular and irregular: jittered corner angles and radii per chip (never a regular tile)
      const sd = Math.floor(c.X * 13 + c.Z * 7);
      const a = c.ang + ((i + 0.7 * (h01(sd + i, 32) - 0.5)) / c.n) * Math.PI * 2;
      const rr = c.r * (0.5 + 0.75 * h01(sd + i * 7, 31)) * (0.75 + 0.5 * h01(sd, 33));
      const x = c.X + rr * Math.cos(a);
      const z = c.Z + rr * Math.sin(a) * 0.9;
      top.push(P.p(x, -c.h * c.r, z));
      bot.push(P.p(x, 0, z));
    }
    const k = b * 2 + (c.tone > 0.5 ? 1 : 0);
    sides[k].push(poly(convexHull([...top, ...bot])));
    if (eye.y < -c.h * c.r) tops[k].push(poly(top));
  }
  const out: React.ReactNode[] = [];
  for (let b = 0; b < nb; b++) {
    const zm = (bands[b] + bands[b + 1]) / 2;
    for (let j = 0; j < 2; j++) {
      const k = b * 2 + j;
      if (!sides[k].length) continue;
      const lit = j ? mat.lit : mixHex(mat.lit, mat.mid, 0.45);
      out.push(<path key={`s${k}`} d={sides[k].join("")} fill={A.tone(mixHex(mat.mid, mat.dark, 0.35), zm, 8)} />);
      out.push(<path key={`t${k}`} d={tops[k].join("")} fill={A.tone(lit, zm, 10)} />);
    }
  }
  return <g>{out}</g>;
};

// ===================================================================================================================
// THE IRON TOOLKIT: flat gouache silhouettes in a vertical plane (units: the cast's), the hanging point at (0, 0),
// hanging down (+y). Iron slate heads, umber handles, one soft crescent of shade, a cream glint on the iron's top edge.
// ===================================================================================================================
export type ToolKind = "hammer" | "tongs" | "chisel" | "pick" | "sickle" | "saw" | "axe" | "file";
const IRON = MAT.iron;
const WOOD = { lit: "#9A7754", mid: "#76583C", dark: "#4A3624" };
type TShape = { d: string; fill: string; glint?: string };
const toolShapes = (k: ToolKind): TShape[] => {
  const handle = (x: number, y0: number, y1: number, w = 7): string => `M${x - w},${y0} L${x + w},${y0} L${x + w * 0.85},${y1} Q${x},${y1 + w} ${x - w * 0.85},${y1} Z`;
  switch (k) {
    case "hammer":
      return [
        { d: handle(0, 4, 118, 7), fill: WOOD.mid },
        { d: "M-26,-8 L26,-10 L28,20 L-24,22 Z", fill: IRON.mid, glint: "M-24,-7 L24,-9" },
      ];
    case "tongs":
      return [
        { d: "M-5,0 L-12,70 L-20,150 L-13,151 L-4,72 L2,0 Z", fill: IRON.mid },
        { d: "M5,0 L12,70 L20,150 L13,151 L4,72 L-2,0 Z", fill: mixHex(IRON.mid, IRON.dark, 0.3) },
        { d: "M-10,-6 Q0,-22 10,-6 L6,4 Q0,-6 -6,4 Z", fill: IRON.mid, glint: "M-8,-6 Q0,-18 8,-6" },
      ];
    case "chisel":
      return [
        { d: "M-7,0 L7,0 L6,52 L-6,52 Z", fill: IRON.mid, glint: "M-6,1 L-5,50" },
        { d: "M-6,52 L6,52 L2,80 L-2,80 Z", fill: IRON.lit },
        { d: "M-9,-10 L9,-10 L8,0 L-8,0 Z", fill: mixHex(IRON.mid, IRON.dark, 0.4) },
      ];
    case "pick":
      return [
        { d: handle(0, 6, 130, 7), fill: WOOD.mid },
        { d: "M-62,8 Q-30,-14 0,-12 Q30,-14 62,8 L56,12 Q28,0 0,4 Q-28,0 -56,12 Z", fill: IRON.mid, glint: "M-58,6 Q-30,-11 0,-9 Q30,-11 58,6" },
      ];
    case "sickle":
      return [
        { d: handle(0, 0, 48, 7), fill: WOOD.mid },
        { d: "M-4,0 Q-12,-60 30,-84 Q78,-104 104,-66 Q76,-88 40,-70 Q4,-50 8,0 Z", fill: IRON.mid, glint: "M-2,-6 Q-8,-58 30,-80 Q70,-98 98,-70" },
      ];
    case "saw":
      return [
        { d: "M-10,0 L120,0 L118,26 L-8,34 Z", fill: IRON.mid, glint: "M-8,1 L118,1" },
        { d: Array.from({ length: 13 }, (_, i) => `M${-6 + i * 9.6},${33 - i * 0.6} L${-1 + i * 9.6},${40 - i * 0.6} L${3.6 + i * 9.6},${32.4 - i * 0.6}`).join(" ") + " Z", fill: IRON.dark },
        { d: "M-34,-6 L-8,-4 L-8,36 L-34,38 Q-42,16 -34,-6 Z", fill: WOOD.mid },
      ];
    case "axe":
      return [
        { d: handle(0, 6, 132, 7), fill: WOOD.mid },
        { d: "M-14,-8 L14,-8 L16,10 L40,-16 Q52,14 40,44 L16,24 L14,30 L-14,30 Z", fill: IRON.mid, glint: "M-12,-7 L13,-7" },
      ];
    case "file":
      return [
        { d: handle(0, 0, 40, 6), fill: WOOD.mid },
        { d: "M-6,40 L6,40 L5,118 L0,126 L-5,118 Z", fill: IRON.mid, glint: "M-5,42 L-4,116" },
      ];
  }
};
/** a tool hanging in a vertical plane at depth Z: `at` = its hanging point (X, Y), `rot` deg (a swing) */
export const HangingTool: React.FC<{ A: AirWorld; kind: ToolKind; X: number; Y: number; Z: number; rot?: number; size?: number; uid: string }> = ({ A, kind, X, Y, Z, rot = 0, size = 1 }) => {
  const P = A.P;
  const o = P.p(X, Y, Z);
  const s = P.r(Z) * size;
  const h = -Y;
  const t = (hex: string) => A.tone(hex, Z, h);
  const S = toolShapes(kind);
  const lw = A.lw(0.9) / s;
  return (
    <g transform={`translate(${o[0].toFixed(2)} ${o[1].toFixed(2)}) scale(${s.toFixed(4)}) rotate(${rot.toFixed(2)})`}>
      {/* the cast shadow on the rack's back board: soft, down and right */}
      <g transform="translate(5 6)" opacity={0.35 * (1 - A.fog(Z))}>
        {S.map((q, i) => (
          <path key={i} d={q.d} fill={SHADOW} />
        ))}
      </g>
      {S.map((q, i) => (
        <g key={i}>
          <path d={q.d} fill={t(q.fill)} stroke={t(mixHex(q.fill, SHADOW, 0.45))} strokeWidth={lw} strokeLinejoin="round" />
          {q.glint ? <path d={q.glint} fill="none" stroke={CREAM} strokeOpacity={0.45 * (1 - A.fog(Z))} strokeWidth={lw * 1.6} strokeLinecap="round" /> : null}
        </g>
      ))}
      {/* the peg */}
      <circle cx={0} cy={-2} r={4} fill={t(WOOD.dark)} />
    </g>
  );
};

// ===================================================================================================================
// SPARKS: a burst of cream sparks from the strike point (world 3D), each a short streak along its path, falling
// ===================================================================================================================
export const Sparks: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; age: number; seed: number; n?: number }> = ({ A, X, Y, Z, age, seed, n = 14 }) => {
  if (age < 1 || age > 16) return null;
  const P = A.P;
  const G = 0.55;
  const segs: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const life = 6 + 9 * h01(seed * 31 + i, 41);
    if (age > life) continue;
    const a = (-165 + 150 * h01(seed * 31 + i, 42)) * (Math.PI / 180);
    const sp = 3.5 + 6 * h01(seed * 31 + i, 43);
    const vx = Math.cos(a) * sp;
    const vy = Math.sin(a) * sp;
    const vz = (h01(seed * 31 + i, 44) - 0.5) * 5;
    const pos = (t: number): [number, number, number] => [X + vx * t, Y + vy * t + 0.5 * G * t * t, Z + vz * t];
    const p1 = pos(age);
    const p0 = pos(Math.max(0, age - 0.8));
    if (p1[1] > -2) continue;
    const q1 = P.p(p1[0], p1[1], p1[2]);
    const q0 = P.p(p0[0], p0[1], p0[2]);
    const fade = 1 - Math.pow(age / life, 1.6);
    const w = (2.6 + 1.4 * h01(seed * 31 + i, 45)) * P.r(Z);
    segs.push(<path key={i} d={`M${Pt(q0)}L${Pt(q1)}`} stroke={i % 3 === 0 ? "#FFF6E4" : CREAM} strokeWidth={w} strokeOpacity={0.95 * fade} strokeLinecap="round" />);
  }
  return <g>{segs}</g>;
};
