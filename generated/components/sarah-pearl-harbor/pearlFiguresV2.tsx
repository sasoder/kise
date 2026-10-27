// ---------------------------------------------------------------------------
// pearlFiguresV2: the engraved 1937 Chinese soldiers of FactionsUniteFiguresV2
// (Pearl Harbor clip, Dwarkesh Patel with Sarah Paine, Oct 2026). Dwarkesh map
// style "People and crowds": the cream form on a dark casing, a firm dark
// outline, hatching, light from the upper left.
//
// Built ON the articulated rig of kits/maps/texcocoFigures the way
// sarah-death-ground/dgFigures is: the rig's joints (figureRig: IK, yaw, lean,
// crouch), its own arms and hands (a Figure with body={false}) and its own face
// (a Figure cut out at the face); the costume is drawn here. Nothing in the kit is
// edited or forked.
//
//   Soldier37  a 1937 infantryman: cotton tunic with turn-down collar, breast
//              pockets, belt and cartridge pouches, a rolled blanket across the
//              chest, trousers, puttees, cloth shoes; a bolt-action rifle with
//              its bayonet fixed (Hanyang 88 / Chiang Kai-shek pattern).
//              faction: "nat"  the Nationalist army's M35 steel helmet
//                       "comm" the Communist (Eighth Route Army) soft peaked cap
//                       "warl" a provincial army's stiff peaked cap
//              bearer: the faction's standard on a pole instead of the rifle:
//                       nat  Blue Sky, White Sun and Red Earth (ROC flag)
//                       comm red flag, star and hammer and sickle
//                       warl the five-coloured flag
//              all redrawn two-tone in the map palette (cream, umber, dark).
//
// Units: figure-local, feet at (0, 0), up is - y, a man ~310 units tall.
// Draw inside a WorldSvg (world px); scale = world px per unit.
// A turn is the rig's yaw going through 0 (a drawn front view), never a flip.
// ---------------------------------------------------------------------------
import React from "react";
import { hash, type P2 } from "../kits/maps/incaShared";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { CREAM, Figure, STAND, figureRig, type FigPose, type Ink, type Spec } from "../kits/maps/texcocoFigures";
import { DARK } from "./pearlShared";

export type { FigPose, Ink };
export type Faction = "nat" | "comm" | "warl";
export const MAN_UNITS = 310;

// ---------------------------------------------------------------------------
// the engraver's helpers (as dgFigures' / texcocoFigures')
// ---------------------------------------------------------------------------
const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const OUT = { stroke: DARK, strokeWidth: 2.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
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
const blendYaw = (front: P2[], prof: P2[], yaw: number): P2[] => {
  const s = Math.sin(yaw);
  const t = Math.abs(s);
  return front.map((f, i) => {
    const p = mix2(f, prof[i], t);
    return s < 0 ? [-p[0], p[1]] : p;
  });
};
/** a dark casing round a form, so it reads on the umber map (thicker than the kit's: these men stand ~150 px tall) */
const Cased: React.FC<{ id: string; r?: number; children?: React.ReactNode }> = ({ id, r = 2.6, children }) => (
  <>
    <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius={r} result="fat" />
      <feGaussianBlur in="fat" stdDeviation={r * 0.4} result="soft" />
      <feFlood floodColor={DARK} floodOpacity={0.72} />
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
const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const dot = (a: P2, b: P2) => a[0] * b[0] + a[1] * b[1];
const signedDeg = (a: P2, b: P2) => (Math.atan2(a[0] * b[1] - a[1] * b[0], dot(a, b)) * 180) / Math.PI;

// the rig's face outline (texcocoFigures'), to cut its face out
const FACE_F: P2[] = [[0, -26], [8, -25], [14, -21], [18, -13], [19.5, -5], [19.5, 2], [19, 8], [18, 12], [16.5, 16], [14.5, 19.5], [11, 23], [5, 26.5], [-5, 26.5], [-11, 23], [-16.5, 16], [-19, 8], [-19.5, -2], [-18, -13], [-14, -21], [-8, -25]];
const FACE_P: P2[] = [[-2, -27], [8, -26.5], [15, -22], [18.5, -14], [19.5, -7], [18.5, -2], [19, 5], [19.5, 10], [20.5, 14.5], [19, 19], [18.5, 23.5], [13, 27.5], [4, 25.5], [-5, 20], [-9, 13], [-19, 12], [-25, 2], [-26, -10], [-21, -20], [-11, -26]];

// ---------------------------------------------------------------------------
// THE BUILD (texcocoFigures' Spec, as dgFigures' soldier)
// ---------------------------------------------------------------------------
export const SPEC: Spec = { a: 54, hw: 45, H: 94, hipY: -152, hem: 50, limb: 1, headScale: 1.08, hair: "cropped", ownDiadem: false, plug: 0, labret: false, aged: false, cloak: "fret", arm: [58, 55], leg: [70, 68] };

// ---------------------------------------------------------------------------
// WHAT HE HOLDS: the rifle (bayonet fixed) or the standard's pole, in the NEAR
// fist (the rear hand); `along` puts the far fist on it. Lengths in units.
// ---------------------------------------------------------------------------
export type Held = "rifle" | "pole";
export const HELD: Record<Held, { L: number; gripAt: number }> = { rifle: { L: 292, gripAt: 70 }, pole: { L: 470, gripAt: 200 } };
const gear = (q: FigPose, kind: Held) => {
  const r = figureRig(SPEC, q);
  const G = r.s >= 0 ? 1 : -1;
  const ma = G > 0 ? r.armL : r.armR;
  const oa = G > 0 ? r.armR : r.armL;
  const grip = add(ma.W, mul(ma.dir, 10 * SPEC.limb));
  const v = rot(ma.dir, -90 * G);
  const { L, gripAt } = HELD[kind];
  return { r, G, ma, oa, grip, v, angle: (Math.atan2(v[0], -v[1]) * 180) / Math.PI, tip: add(grip, mul(v, L - gripAt)), butt: add(grip, mul(v, -gripAt)) };
};
/** the pose with the near fist turned so the held thing stands at `deg` (0 = tip up, + = clockwise on screen) */
export const aim = (q: FigPose, deg: number, kind: Held = "rifle"): FigPose => {
  const g = gear(q, kind);
  const d = wrapDeg(deg - g.angle);
  return g.G > 0 ? { ...q, armL: { ...q.armL, hand: q.armL.hand + d } } : { ...q, armR: { ...q.armR, hand: q.armR.hand + d } };
};
/** the pose with the far fist closed on the shaft `along` units ahead of the near fist */
export const onShaft = (q: FigPose, along: number, kind: Held = "rifle"): FigPose => {
  let p = q;
  for (let it = 0; it < 5; it++) {
    const g = gear(p, kind);
    const target = add(g.grip, mul(g.v, along));
    const fore = norm(sub(g.oa.W, g.oa.E));
    const a1 = rot(g.v, 90);
    const a2 = rot(g.v, -90);
    const want = dot(a1, fore) > dot(a2, fore) ? a1 : a2;
    const w = add(target, mul(want, -10 * SPEC.limb));
    const arm = { ...(g.G > 0 ? p.armR : p.armL), w, fist: 1, hand: signedDeg(fore, want) };
    p = g.G > 0 ? { ...p, armR: arm } : { ...p, armL: arm };
  }
  return p;
};
export const hold = (q: FigPose, deg: number, along: number, kind: Held = "rifle") => onShaft(aim(q, deg, kind), along, kind);
/** world anchors of the held thing (grip, tip, butt) for checks */
export const heldAnchors = (q: FigPose, at: P2, scale: number, kind: Held = "rifle") => {
  const g = gear(q, kind);
  const w = (v: P2): P2 => add(at, mul(v, scale));
  return { grip: w(g.grip), tip: w(g.tip), butt: w(g.butt), angle: g.angle };
};

// ---------------------------------------------------------------------------
// THE RIFLE: grip (small of the stock) at (0, 0), the bore along - y, the
// underside (trigger guard, magazine, bayonet, sling) toward + x
// ---------------------------------------------------------------------------
const RifleArt: React.FC<{ ink: Ink; uid: string }> = ({ ink, uid }) => {
  const yB = HELD.rifle.gripAt;
  const yMz = -152; // the muzzle
  const yTip = -(HELD.rifle.L - HELD.rifle.gripAt);
  const STOCK = `M-4.6,4L-6.4,${yB - 2}Q-6,${yB + 1} -3,${yB + 1}L13.5,${yB - 1}Q16,${yB - 3} 14.5,${yB - 8}L5.6,16L5,4Z`;
  const FORE = `M-5.6,-4L-5,-112L-2.6,-118L4.2,-118L6.4,-112L7,-4Z`;
  const BLADE = `M3,${yMz + 6}L7.6,${yMz + 2}L6.6,${yTip + 14}L3.4,${yTip}L1.8,${yTip + 14}L1.6,${yMz + 2}Z`;
  return (
    <g>
      {/* the sling, under the stock to the front band */}
      <path d={`M10,${yB - 18}Q17,-30 7,-100`} {...ln(2.4, 0.85)} />
      <path d={`M10,${yB - 18}Q17,-30 7,-100`} fill="none" stroke={ink.deep} strokeWidth={1.2} />
      {/* the barrel beyond the wood, the bayonet under it */}
      <path d={limbD([[[1, -110], 5.4], [[1, yMz], 4.6]])} fill={ink.deep} {...OUT} strokeWidth={2.2} />
      <path d={BLADE} fill={ink.main} {...OUT} strokeWidth={2.2} />
      <path d={`M4.4,${yMz - 2}L4.8,${yTip + 16}`} {...ln(1, 0.6)} />
      <path d={limbD([[[-2, yMz + 5], 4.2], [[9, yMz + 5], 4.2]])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
      {/* the wood: forestock and butt */}
      <clipPath id={`${uid}-st`}>
        <path d={STOCK} />
      </clipPath>
      <path d={FORE} fill={ink.main} {...OUT} />
      <path d={`M2,-10L2.4,-108`} {...ln(1, 0.55)} />
      {[-58, -100].map((y) => (
        <path key={y} d={`M-5.4,${y}L6.8,${y + 0.6}`} {...ln(1.6, 0.8)} />
      ))}
      <path d={STOCK} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-st)`}>
        <path d={hatchD(-8, 10, 17, yB + 2, 115, 3, 701, 0.1)} {...ln(1, 0.6)} />
      </g>
      <path d={`M-6.6,${yB - 3}L14,${yB - 5}`} {...ln(2.6, 0.85)} />
      {/* the receiver and the bolt handle (up side), the magazine and trigger guard (under) */}
      <path d={`M-5.4,-16L6.6,-16L7,4L-5,4Z`} fill={ink.deep} {...OUT} strokeWidth={2.1} />
      <path d={limbD([[[-4, -4], 3.4], [[-12, 0], 3.4]])} fill={ink.deep} {...OUT} strokeWidth={1.7} />
      <circle cx={-13} cy={0.6} r={3.4} fill={ink.main} {...OUT} strokeWidth={1.7} />
      <path d={`M6.4,-14L13,-12L12.6,-2L6.8,-2Z`} fill={ink.deep} {...OUT} strokeWidth={1.8} />
      <path d={`M7,2Q14,6 7,12`} {...ln(1.8, 0.85)} />
    </g>
  );
};
/** the standard's pole: grip at (0, 0), the top along - y, a spear finial */
const PoleArt: React.FC<{ ink: Ink }> = ({ ink }) => {
  const yB = HELD.pole.gripAt;
  const yT = -(HELD.pole.L - HELD.pole.gripAt);
  return (
    <g>
      <path d={limbD([[[0, yB], 7.4], [[0, mix(yB, yT, 0.5)], 7], [[0, yT + 8], 6.4]])} fill={ink.deep} {...OUT} strokeWidth={2.2} />
      <path d={`M1.8,${(yB - 8).toFixed(1)}L1.6,${(yT + 12).toFixed(1)}`} {...ln(0.9, 0.5)} />
      <path d={`M0,${yT - 22}C5,${yT - 12} 6,${yT - 3} 3.4,${yT + 8}L-3.4,${yT + 8}C-6,${yT - 3} -5,${yT - 12} 0,${yT - 22}Z`} fill={ink.main} {...OUT} strokeWidth={2} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE STANDARDS, figure-local and NEVER mirrored (the canton stays next to the
// pole whichever way the bearer faces). The cloth flies to screen LEFT (west) from
// the pole top; u along the fly (0 at the pole), w down the hoist.
// ---------------------------------------------------------------------------
const FLAG_U = 150;
const FLAG_W = 104;
const Standard: React.FC<{ faction: Faction; top: P2; down: P2; wave: number; ink: Ink; uid: string }> = ({ faction, top, down, wave, ink, uid }) => {
  const ph = wave * 2 * Math.PI;
  const across: P2 = [-down[1], down[0]]; // perpendicular to the pole
  const ax: P2 = across[0] <= 0 ? across : mul(across, -1); // the fly runs toward - x
  const h0 = add(top, mul(down, 22));
  const fl = (u: number, w: number): P2 => {
    const sway = Math.sin(u * 4.2 - ph + w * 0.8);
    const p = add(add(h0, mul(down, w * FLAG_W)), mul(ax, u * FLAG_U * (1 - 0.04 * (1 + Math.cos(u * 4.2 - ph)))));
    return [p[0], p[1] + u * (6 + 7 * sway) + 5 * u * u];
  };
  const quadPts = (u0: number, w0: number, u1: number, w1: number, n = 8): P2[] => [
    ...Array.from({ length: n + 1 }, (_, j) => fl(mix(u0, u1, j / n), w0)),
    ...Array.from({ length: 3 }, (_, j) => fl(u1, mix(w0, w1, (j + 1) / 3))),
    ...Array.from({ length: n + 1 }, (_, j) => fl(mix(u1, u0, j / n), w1)),
    ...Array.from({ length: 2 }, (_, j) => fl(u0, mix(w1, w0, (j + 1) / 3))),
  ];
  const FLAG = polyD(quadPts(0, 0, 1, 1, 12));
  /** a point at (u, w) plus a local offset in units (dx along the fly, dy down the hoist) */
  const at = (u: number, w: number, dx: number, dy: number): P2 => fl(u + dx / FLAG_U, w + dy / FLAG_W);
  const starPts = (u: number, w: number, R: number, r: number, n: number, a0 = -90): P2[] =>
    Array.from({ length: 2 * n }, (_, i) => {
      const a = ((a0 + (i * 180) / n) * Math.PI) / 180;
      const rr = i % 2 ? r : R;
      return at(u, w, rr * Math.cos(a), rr * Math.sin(a));
    });
  const circlePts = (u: number, w: number, R: number, n = 18): P2[] => Array.from({ length: n }, (_, i) => at(u, w, R * Math.cos((i / n) * 2 * Math.PI), R * Math.sin((i / n) * 2 * Math.PI)));
  const red = (
    <>
      <path d={FLAG} fill={ink.deep} />
      <path d={hatchD(-600, -900, 600, 400, 64, 2.6, 401, 0.05)} {...ln(1.1, 0.7)} />
    </>
  );
  let art: React.ReactNode = null;
  if (faction === "nat") {
    // red field; the dark canton by the pole with the twelve-rayed white sun
    art = (
      <>
        {red}
        <path d={polyD(quadPts(0, 0, 0.5, 0.52, 6))} fill={DARK} fillOpacity={0.9} />
        <path d={polyD(starPts(0.25, 0.26, 25, 13.5, 12))} fill={ink.main} />
        <path d={polyD(circlePts(0.25, 0.26, 10.5))} fill={DARK} />
        <path d={polyD(circlePts(0.25, 0.26, 8.2))} fill={ink.main} />
      </>
    );
  } else if (faction === "comm") {
    // red field; a white star at the hoist, the hammer and sickle on the fly
    const hs = (dx: number, dy: number) => at(0.6, 0.52, dx, dy);
    const sickle = Array.from({ length: 13 }, (_, i) => {
      const a = ((-150 + i * 18) * Math.PI) / 180;
      return hs(17 * Math.cos(a), 17 * Math.sin(a) - 2);
    });
    art = (
      <>
        {red}
        <path d={polyD(starPts(0.17, 0.25, 15, 6, 5))} fill={ink.main} />
        <path d={`M${sickle.map(P).join("L")}`} fill="none" stroke={ink.main} strokeWidth={6} strokeLinecap="round" />
        <path d={`M${P(hs(-12, 13))}L${P(hs(-18, 19))}`} fill="none" stroke={ink.main} strokeWidth={7} strokeLinecap="round" />
        <path d={`M${P(hs(-10, -12))}L${P(hs(12, 14))}`} fill="none" stroke={ink.main} strokeWidth={6} strokeLinecap="round" />
        <path d={`M${P(hs(-17, -5))}L${P(hs(-3, -19))}`} fill="none" stroke={ink.main} strokeWidth={9} strokeLinecap="butt" />
      </>
    );
  } else {
    // five stripes: red, yellow, blue, white, black (dense hatch, cream, crosshatch, pale, dark)
    const band = (i: number) => polyD(quadPts(0, i / 5, 1, (i + 1) / 5, 12));
    art = (
      <>
        <path d={band(0)} fill={ink.deep} />
        <clipPath id={`${uid}-b0`}>
          <path d={band(0)} />
        </clipPath>
        <g clipPath={`url(#${uid}-b0)`}>
          <path d={hatchD(-600, -900, 600, 400, 64, 2.6, 411, 0.05)} {...ln(1.1, 0.7)} />
        </g>
        <path d={band(1)} fill={ink.main} />
        <path d={band(2)} fill={ink.deep} />
        <clipPath id={`${uid}-b2`}>
          <path d={band(2)} />
        </clipPath>
        <g clipPath={`url(#${uid}-b2)`}>
          <path d={hatchD(-600, -900, 600, 400, 64, 2.4, 412, 0.05) + hatchD(-600, -900, 600, 400, -30, 2.4, 413, 0.05)} {...ln(1.1, 0.7)} />
        </g>
        <path d={band(3)} fill="#F6EFDC" />
        <path d={band(4)} fill={DARK} fillOpacity={0.88} />
      </>
    );
  }
  // the folds: shade where the cloth turns away
  const folds = Array.from({ length: 16 }, (_, i) => {
    const u = (i + 0.5) / 16;
    const sh = -Math.cos(u * 4.2 - ph);
    if (sh < 0.2) return null;
    return <path key={i} d={`M${P(fl(u, 0.03))}L${P(fl(u, 0.97))}`} {...ln(1.2, 0.5 * sh)} />;
  });
  return (
    <>
      <clipPath id={`${uid}-fl`}>
        <path d={FLAG} />
      </clipPath>
      <path d={FLAG} fill={ink.main} {...OUT} strokeWidth={2.8} />
      <g clipPath={`url(#${uid}-fl)`}>
        {art}
        {folds}
      </g>
      <path d={FLAG} fill="none" {...OUT} strokeWidth={2.8} />
      {[0.1, 0.5, 0.9].map((w) => (
        <path key={w} d={limbD([[add(fl(0, w), mul(ax, -5)), 4], [add(fl(0, w), mul(ax, 5)), 4]])} fill={ink.deep} {...OUT} strokeWidth={1.6} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// THE SHOE (cloth, as dgFigures' square-toed shoe)
// ---------------------------------------------------------------------------
const SHOE_F: P2[] = [[-7.4, -2], [7.4, -2], [10.6, 5.5], [12.4, 9.5], [12.8, 13], [12, 19], [0, 19.8], [-12, 19], [-12.6, 13.5], [-10.6, 5.5]];
const SHOE_P: P2[] = [[-7.6, -2], [7.6, -2], [15.5, 6.2], [26.5, 9], [31, 9.5], [31, 18.8], [8, 19.8], [-10, 19.2], [-12.6, 11], [-10, 2.5]];
const Shoe: React.FC<{ A: P2; sgn: number; yaw: number; lift: number; k: number; ink: Ink }> = ({ A, sgn, yaw, lift, k, ink }) => {
  const c = Math.cos(yaw);
  const out = sgn * 4.5 * c;
  const pts = blendYaw(SHOE_F, SHOE_P, yaw).map((p, i): P2 => (i < 2 ? p : [p[0] + out, p[1]]));
  return (
    <g transform={`translate(${A[0].toFixed(2)} ${A[1].toFixed(2)}) rotate(${lift.toFixed(2)}) scale(${k.toFixed(3)})`}>
      <path d={smoothClosed(pts)} fill={ink.deep} {...OUT} strokeWidth={2.2} />
      <path d={`M${P(pts[7])}Q${P([pts[6][0], pts[6][1] - 3.6])} ${P(pts[5])}`} {...ln(1.6, 0.85)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// HEADGEAR (head-local units: (0, 0) = the middle of the face; front / profile
// outlines with matched points, blended by the head's yaw)
// ---------------------------------------------------------------------------
// the M35 steel helmet: a deep dome, a short visor, the flared skirt at the back and sides
const HELM_F: P2[] = [[-28, -1], [-27, -17], [-20, -31], [0, -37], [20, -31], [27, -17], [28, -1], [22, -7], [11, -12], [0, -13.5], [-11, -12], [-22, -7]];
const HELM_P: P2[] = [[-32, 6], [-30, -15], [-22, -32], [-4, -38], [12, -34], [22, -23], [27, -12], [18, -12.5], [8, -11], [-2, -9], [-13, -5], [-23, 1]];
// the soft cloth peaked cap (crown) and its short brim
const SOFT_F: P2[] = [[-22, -11], [-23.5, -24], [-20, -35], [0, -38.5], [20, -35], [23.5, -24], [22, -11], [12, -14.5], [0, -15.5], [-12, -14.5]];
const SOFT_P: P2[] = [[-24, -10], [-25, -25], [-19, -36], [0, -39], [16, -36], [21, -26], [22, -14], [13, -14.5], [1, -15], [-12, -13]];
const BRIM_F: P2[] = [[-15, -13], [0, -9.5], [15, -13], [12, -15.5], [0, -14], [-12, -15.5]];
const BRIM_P: P2[] = [[12, -15], [25, -10.5], [34, -9.5], [31, -13.5], [23, -15.5], [15, -16.5]];
// the stiff peaked cap: a tall crown flaring to a flat top, a band, a lacquered visor
const PEAK_F: P2[] = [[-21, -12], [-22, -23], [-27, -38], [-25, -43], [0, -45], [25, -43], [27, -38], [22, -23], [21, -12], [0, -15]];
const PEAK_P: P2[] = [[-22, -11], [-23, -23], [-29, -37], [-27, -42], [-2, -45], [22, -43], [26, -38], [20, -24], [20, -14], [-2, -15]];
const VISOR_F: P2[] = [[-16, -13], [0, -8.5], [16, -13], [13, -15.5], [0, -14], [-13, -15.5]];
const VISOR_P: P2[] = [[12, -14], [26, -8.5], [35, -8], [32, -12.5], [23, -14.5], [15, -15.5]];

const Headgear: React.FC<{ faction: Faction; yaw: number; ink: Ink; uid: string }> = ({ faction, yaw, ink, uid }) => {
  const hc = Math.cos(yaw);
  const hs = Math.sin(yaw);
  const t = Math.abs(hs);
  const sg = hs < 0 ? -1 : 1;
  /** a point on the front of the head (drawn from the front at x, y, standing D in front of the axis) */
  const pr = (x: number, y: number, D: number): P2 => [x * hc + D * hs, y];
  if (faction === "nat") {
    const H = blendYaw(HELM_F, HELM_P, yaw);
    const D = smoothClosed(H);
    return (
      <g>
        <clipPath id={`${uid}-hm`}>
          <path d={D} />
        </clipPath>
        <path d={D} fill={ink.deep} {...OUT} strokeWidth={2.8} />
        <g clipPath={`url(#${uid}-hm)`}>
          <path d={hatchD(-6 + 12 * hs, -40, 36, 8, 112, 2.5, 951, 0.12)} {...ln(1.05, 0.62)} />
          <path d={hatchD(10 + 8 * hs, -36, 36, 8, 62, 3, 952, 0.15)} {...ln(0.95, 0.45)} />
          {/* the light on the dome, upper left */}
          <path d={`M${P(pr(-14, -29, 6))}Q${P(pr(-4, -35, 14))} ${P(pr(8, -33, 14))}`} fill="none" stroke={ink.main} strokeWidth={3.4} strokeLinecap="round" opacity={0.8} />
          {/* the ridge where the skirt flares */}
          <path d={`M${P(H[0])}Q${P(mix2(H[1], H[2], 0.3))} ${P(mix2(H[5], H[6], 0.5))}`} {...ln(1.3, 0.7)} transform="translate(0 4)" />
          <circle cx={pr(-17 * sg, -20, 0)[0]} cy={-20} r={1.8} fill={DARK} opacity={0.75 * c01((hc - 0.1) * 2)} />
        </g>
      </g>
    );
  }
  if (faction === "comm") {
    const C = blendYaw(SOFT_F, SOFT_P, yaw);
    const Dc = smoothClosed(C);
    const B = smoothClosed(blendYaw(BRIM_F, BRIM_P, yaw));
    const sc = pr(0, -26, 22);
    const star = Array.from({ length: 10 }, (_, i) => {
      const a = ((-90 + i * 36) * Math.PI) / 180;
      const rr = i % 2 ? 2.6 : 6;
      return [sc[0] + rr * Math.cos(a) * Math.max(0.25, hc), sc[1] + rr * Math.sin(a)] as P2;
    });
    return (
      <g>
        <clipPath id={`${uid}-sc`}>
          <path d={Dc} />
        </clipPath>
        <path d={Dc} fill={ink.main} {...OUT} strokeWidth={2.8} />
        <g clipPath={`url(#${uid}-sc)`}>
          <path d={hatchD(-2 + 12 * hs, -42, 34, -8, 112, 2.6, 961, 0.15)} {...ln(1, 0.58)} />
          {/* the soft crown's seam and its creases */}
          <path d={`M${P(pr(-21, -20, 4))}Q${P(pr(0, -23, 22))} ${P(pr(21, -20, 4))}`} {...ln(1.3, 0.7)} />
          <path d={`M${P(pr(-8, -36, 14))}L${P(pr(-5, -27, 18))}M${P(pr(9, -35, 14))}L${P(pr(7, -27, 18))}`} {...ln(1, 0.45)} />
        </g>
        {hc > 0.15 ? <path d={polyD(star)} fill={DARK} opacity={0.85} /> : null}
        <path d={B} fill={ink.hair} {...OUT} strokeWidth={2.2} />
      </g>
    );
  }
  const C = blendYaw(PEAK_F, PEAK_P, yaw);
  const Dp = smoothClosed(C);
  const V = smoothClosed(blendYaw(VISOR_F, VISOR_P, yaw));
  return (
    <g>
      <clipPath id={`${uid}-pc`}>
        <path d={Dp} />
      </clipPath>
      <path d={Dp} fill={ink.main} {...OUT} strokeWidth={2.8} />
      <g clipPath={`url(#${uid}-pc)`}>
        <path d={hatchD(0 + 12 * hs, -48, 36, -8, 112, 2.6, 971, 0.15)} {...ln(1, 0.58)} />
        {/* the band round the crown */}
        <path d={`M-40,-17L40,-17L40,-23Q0,${(-26 - 3 * t).toFixed(1)} -40,-23Z`} fill={ink.deep} stroke={DARK} strokeWidth={1.3} strokeOpacity={0.8} />
        <path d={`M-40,-38Q0,-41 40,-38`} {...ln(1.2, 0.6)} />
      </g>
      {hc > 0.2 ? <circle cx={pr(0, -21, 21)[0]} cy={-21} r={3.2} fill={ink.main} {...OUT} strokeWidth={1.4} /> : null}
      <path d={V} fill={DARK} fillOpacity={0.85} {...OUT} strokeWidth={2.2} />
      <path d={`M${P(blendYaw(VISOR_F, VISOR_P, yaw)[1])}L${P(blendYaw(VISOR_F, VISOR_P, yaw)[2])}`} fill="none" stroke={ink.deep} strokeWidth={1.2} opacity={0.6} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SOLDIER
// ---------------------------------------------------------------------------
export type Soldier37Props = {
  faction: Faction;
  pose: FigPose;
  /** his feet (world px) and world px per unit (150 px tall at camera k: 150 / k / 310) */
  at: P2;
  scale: number;
  uid: string;
  ink?: Ink;
  tone?: number;
  /** the faction's standard instead of the rifle */
  bearer?: boolean;
  /** the standard's wave phase, cycles */
  wave?: number;
  seed?: number;
};
export const Soldier37: React.FC<Soldier37Props> = (props) => {
  const { faction, pose: q, at, scale, uid, tone = 1, bearer = false, wave = 0, seed = 0 } = props;
  const ink = props.ink ?? CREAM;
  const sp = SPEC;
  const kind: Held = bearer ? "pole" : "rifle";
  const g = gear(q, kind);
  const r = g.r;
  const s = r.s;
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
  const wst = 30;
  const profile = Math.abs(s) > 0.5;
  const G = g.G;

  // ---- legs: trousers bloused at the knee, puttees to the ankle, cloth shoes -------------
  const legs = [r.legL, r.legR].sort((p, q2) => p.z - q2.z);
  const legEl = (l: typeof r.legL) => {
    const u = norm(sub(l.A, l.K));
    const n: P2 = [-u[1], u[0]];
    const ws = [18.5, 18.6, 15, 12.6].map((w) => w * k);
    const ts = [0.1, 0.36, 0.74, 0.97];
    const wAt = (t: number) => (t < ts[1] ? mix(ws[0], ws[1], (t - ts[0]) / (ts[1] - ts[0])) : t < ts[2] ? mix(ws[1], ws[2], (t - ts[1]) / (ts[2] - ts[1])) : mix(ws[2], ws[3], (t - ts[2]) / (ts[3] - ts[2])));
    let wraps = "";
    for (let t = 0.16; t < 0.92; t += 0.085) {
      const p = mix2(l.K, l.A, t);
      const w = wAt(t) / 2 - 0.6;
      wraps += `M${P(add(p, mul(n, -w)))}L${P(add(add(p, mul(n, w)), mul(u, 5)))}`;
    }
    return (
      <g key={l.sgn}>
        <path d={limbD(ts.map((t, i): St => [mix2(l.K, l.A, t), ws[i]]))} fill={ink.main} {...OUT} />
        <path d={wraps} {...ln(1.3, 0.78)} />
        <path d={braceletD(l.K, l.A, 18 * k, 12.5 * k, 83 + l.sgn, 3.4, 0.6)} {...ln(0.9, 0.42)} />
        <path d={limbD([[l.H, 29 * k], [mix2(l.H, l.K, 0.5), 28 * k], [l.K, 25 * k], [mix2(l.K, l.A, 0.13), 22 * k]])} fill={ink.main} {...OUT} />
        <path d={braceletD(l.H, l.K, 28 * k, 24 * k, 81 + l.sgn, 3)} {...ln(1, 0.62)} />
        <path d={`M${P(add(mix2(l.K, l.A, 0.08), mul(n, -10 * k)))}Q${P(add(mix2(l.K, l.A, 0.14), mul(u, 3)))} ${P(add(mix2(l.K, l.A, 0.08), mul(n, 10 * k)))}`} {...ln(1.3, 0.7)} />
        <Shoe A={l.A} sgn={l.sgn} yaw={q.yaw} lift={l.lift} k={k} ink={ink} />
      </g>
    );
  };

  // ---- the tunic: to below the hips, turn-down collar, buttons, breast pockets, belt, pouches ----
  const TORSO =
    `M${P(side(add(shL, [1, -4])))}Q${P(side(add(neck, [-14, -1])))} ${P(side(add(neck, [-8, -5])))}L${P(side(add(neck, [8, -5])))}Q${P(side(add(neck, [14, -1])))} ${P(side(add(shR, [-1, -4])))}` +
    `C${P(side([hw + 3, shY + 26]))} ${P(side([wst + 4, -52]))} ${P(side([wst + 2, -26]))}C${P(side([wst + 1, -10]))} ${P(side([wst + 6, 8]))} ${P(side([wst + 8, 26]))}` +
    `Q${P(mT([0, 31]))} ${P(side([-wst - 8, 26]))}C${P(side([-wst - 6, 8]))} ${P(side([-wst - 1, -10]))} ${P(side([-wst - 2, -26]))}C${P(side([-wst - 4, -52]))} ${P(side([-hw - 3, shY + 26]))} ${P(side(add(shL, [1, -4])))}Z`;
  const fx = mT([0, -10])[0];
  const BELT = `M${P(side([-wst - 3, -27]))}Q${P([fx * 0.5, -23])} ${P(side([wst + 3, -27]))}L${P(side([wst + 3.5, -14]))}Q${P([fx * 0.5, -10])} ${P(side([-wst - 3.5, -14]))}Z`;
  const box = (x0: number, y0: number, x1: number, y1: number) => polyD([mT([x0, y0]), mT([x1, y0]), mT([x1, y1]), mT([x0, y1])]);
  const buttons = [shY + 14, shY + 38, shY + 62, 6].map((y) => mT([4, y]));
  const roll: P2[] = [
    [hw - 10, shY + 2],
    [hw - 26, shY + 22],
    [8, shY + 52],
    [-12, -42],
    [-wst - 1, -30],
  ];
  const torsoEl = (
    <g transform={torsoTf}>
      <clipPath id={`${uid}-tor`}>
        <path d={TORSO} />
      </clipPath>
      <path d={TORSO} fill={ink.main} {...OUT} />
      <g clipPath={`url(#${uid}-tor)`}>
        <path d={segD(hatchSegs(hw * 0.34, shY + 4, hw + 10, 30, 113, 2.8, 831 + seed), side)} {...ln(1, 0.62)} />
        <path d={segD(hatchSegs(hw * 0.55, shY + 34, hw + 10, 30, 60, 3.4, 832 + seed), side)} {...ln(0.9, 0.45)} />
        <path d={segD(hatchSegs(-hw, -12, hw, 30, 96, 3.2, 833 + seed), side)} {...ln(0.85, 0.32)} />
        {/* the front opening, the pockets and their flaps */}
        <path d={segD(subdivide([[[2, shY + 4], [2, 28]]], 10), mT)} {...ln(1.3, 0.75)} />
        {[-1, 1].map((sd) => (
          <g key={sd}>
            <path d={box(sd * 9, shY + 20, sd * 29, shY + 44)} {...ln(1.2, 0.7)} />
            <path d={box(sd * 8, shY + 18, sd * 30, shY + 28)} fill={ink.deep} stroke={DARK} strokeWidth={1.2} strokeOpacity={0.8} />
          </g>
        ))}
        {buttons.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={2} fill={DARK} opacity={0.75} />
        ))}
        {/* the rolled blanket over the left shoulder to the right hip */}
        {!props.bearer ? (
          <>
            <path d={limbD(roll.map((p): St => [mT(p), 17]))} fill={ink.deep} {...OUT} strokeWidth={2.2} />
            <path d={[0.18, 0.42, 0.66, 0.86].map((t) => { const i = Math.min(roll.length - 2, Math.floor(t * (roll.length - 1))); const f = t * (roll.length - 1) - i; const p = mT(mix2(roll[i], roll[i + 1], f)); return `M${P(add(p, [-6, -5]))}L${P(add(p, [6, 5]))}`; }).join("")} {...ln(1.4, 0.75)} />
          </>
        ) : null}
        <path d={BELT} fill={ink.deep} {...OUT} strokeWidth={2.2} />
        {[-1, 1].map((sd) => (
          <g key={`p${sd}`}>
            <path d={box(sd * 10, -30, sd * 25, -12)} fill={ink.main} {...OUT} strokeWidth={1.9} />
            <path d={box(sd * 10, -30, sd * 25, -24)} fill={ink.deep} stroke={DARK} strokeWidth={1.1} strokeOpacity={0.8} />
          </g>
        ))}
      </g>
      {/* the turn-down collar */}
      <path d={limbD([[side([-16, shY - 1]), 8], [side([0, shY - 7]), 8], [side([16, shY - 1]), 8]])} fill={ink.deep} {...OUT} strokeWidth={2} />
      <path d={limbD([[mT([-15, shY - 2]), 7], [mT([-4, shY + 9]), 9]])} fill={ink.main} {...OUT} strokeWidth={1.8} />
      <path d={limbD([[mT([15, shY - 2]), 7], [mT([5, shY + 9]), 9]])} fill={ink.main} {...OUT} strokeWidth={1.8} />
    </g>
  );

  // ---- the arms: the rig's own arm and hand, the sleeve over it ---------------------------
  const sleeve = (ar: typeof r.armL) => {
    const fu = norm(sub(ar.W, ar.E));
    const fn: P2 = [-fu[1], fu[0]];
    const cuff = add(ar.W, mul(fu, -7 * k));
    const st = bones(ar.S, ar.E, cuff, [27, 25.5, 22, 22, 20.5].map((w) => w * k));
    return (
      <>
        <path d={limbD(st)} fill={ink.main} {...OUT} />
        <path d={braceletD(ar.S, ar.E, 27 * k, 23 * k, 851 + ar.sgn, 3) + braceletD(ar.E, cuff, 23 * k, 21 * k, 853 + ar.sgn, 3)} {...ln(1, 0.62)} />
        <path d={`M${P(add(ar.E, mul(fn, -7 * k)))}Q${P(add(ar.E, add(mul(fn, 1), mul(fu, -5))))} ${P(add(ar.E, mul(fn, 8 * k)))}`} {...ln(1.2, 0.6)} />
        <path d={limbD([[add(cuff, mul(fn, -10.5 * k)), 6], [add(cuff, mul(fn, 10.5 * k)), 6]])} fill={ink.deep} {...OUT} strokeWidth={1.8} />
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

  // ---- what he holds ---------------------------------------------------------------
  const heldEl = (
    <g transform={`${tf} translate(${P(g.grip)}) rotate(${g.angle.toFixed(2)}) scale(${G} 1)`}>
      <Cased id={`${uid}-hc`} r={2.2}>
        {bearer ? <PoleArt ink={ink} /> : <RifleArt ink={ink} uid={`${uid}-rf`} />}
      </Cased>
    </g>
  );
  const flagEl = bearer ? (
    <g transform={tf}>
      <Cased id={`${uid}-fc`} r={2.4}>
        <Standard faction={faction} top={g.tip} down={mul(g.v, -1)} wave={wave} ink={ink} uid={`${uid}-sd`} />
      </Cased>
    </g>
  ) : null;

  // ---- the head: the rig's face, the headgear over it ----------------------------------
  // The rig is drawn at its NORMAL build and cut out at the face (its head is drawn last, over
  // its own cloak). Never inflate the build to push the cloak out of view (dgFigures' hw 900):
  // the rig's casing filter then spans a cloak thousands of px wide on every man, and at full
  // resolution Chrome runs out of raster memory and composites stale tiles (labels and body
  // fragments from earlier frames blinking on scattered frames).
  const headSpec: Spec = { ...sp, hem: 0 };
  const nod = Math.max(0, r.nodF);
  const faceClip = smoothClosed(blendYaw(FACE_F, FACE_P, q.headYaw).map((p): P2 => [p[0] * 1.08, p[1] * 1.07 + 5 * nod]));
  const headEl = (
    <>
      <clipPath id={`${uid}-hcl`}>
        <path transform={`${tf} ${headTf}`} d={faceClip} />
      </clipPath>
      <g clipPath={`url(#${uid}-hcl)`}>
        <Figure spec={headSpec} pose={q} at={at} scale={scale} uid={`${uid}-hd`} arms="none" ink={ink} />
      </g>
      <g transform={`${tf} ${headTf}`}>
        <Cased id={`${uid}-hg`} r={2.2}>
          <Headgear faction={faction} yaw={q.headYaw} ink={ink} uid={`${uid}-hgr`} />
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
      {flagEl}
      {profile ? armEl(farKey) : null}
      <g transform={tf}>
        <Cased id={`${uid}-bd`}>{legs.map(legEl)}</Cased>
      </g>
      <g transform={tf}>
        <Cased id={`${uid}-tc`}>
          <path d={NECK} fill={ink.main} {...OUT} />
          <path d={braceletD(add(r.neck, [0, 4]), mix2(r.neck, r.headC, 0.5), 20 * k, 17 * k, 89, 2.4)} {...ln(0.9, 0.6)} />
          {torsoEl}
        </Cased>
      </g>
      {heldEl}
      {headEl}
      {profile ? armEl(nearKey) : [r.armL, r.armR].sort((p, q2) => p.z - q2.z).map((ar) => armEl(ar.sgn < 0 ? "L" : "R"))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// POSES. R_* face screen right; mirrorPose turns any of them to face left.
// The two-handed rifle poses hold the rifle in the NEAR fist (the rear hand on
// the small of the stock) with the far fist on the forestock.
// ---------------------------------------------------------------------------
const mArm = (a: FigPose["armL"]): FigPose["armL"] => ({ w: [-a.w[0], a.w[1]], elbow: [-a.elbow[0], a.elbow[1]], fist: a.fist, hand: -a.hand });
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
const SIDE: FigPose = { ...STAND, yaw: YAW, headYaw: YAW + 0.07, armL: { w: [-10, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 }, armR: { w: [16, -150], elbow: [-0.6, 1], fist: 0.3, hand: 0 } };
const R_GUARD = hold({ ...SIDE, lean: 6, crouch: 14, pitch: -2, brow: 0.75, mouth: -0.2, footL: [-24, 0], footR: [24, 0], armL: { w: [2, -172], elbow: [-1, 0.3], fist: 1, hand: 0 }, armR: { w: [58, -198], elbow: [0.3, 1], fist: 1, hand: 0 } }, 80, 76);
const R_THRUST = hold({ ...SIDE, lean: 16, crouch: 13, pitch: -5, brow: 1, mouth: -0.55, footL: [-44, 0], footR: [32, 0], liftL: 12, armL: { w: [34, -184], elbow: [-1, 0.3], fist: 1, hand: 0 }, armR: { w: [86, -204], elbow: [0.3, 1], fist: 1, hand: 0 } }, 86, 76);
const R_RECOIL = hold({ ...SIDE, lean: -11, crouch: 10, pitch: -8, roll: -3, headYaw: YAW + 0.12, brow: -0.55, mouth: -0.65, footL: [-44, 0], footR: [8, 0], liftR: -8, armL: { w: [-14, -198], elbow: [-1, 0.5], fist: 1, hand: 0 }, armR: { w: [34, -232], elbow: [0.4, 1], fist: 1, hand: 0 } }, 60, 72);
const R_READY = hold({ ...SIDE, lean: 3, crouch: 5, brow: 0.55, footL: [-12, 0], footR: [14, 0], armL: { w: [8, -178], elbow: [-1, 0.4], fist: 1, hand: 0 }, armR: { w: [44, -222], elbow: [0.3, 1], fist: 1, hand: 0 } }, 50, 76);
const R_PORT = hold({ ...SIDE, lean: 5, brow: 0.45, armL: { w: [12, -186], elbow: [-1, 0.5], fist: 1, hand: 0 }, armR: { w: [30, -238], elbow: [0.3, 1], fist: 1, hand: 0 } }, 32, 80);
/** the halt: the rifle snapped upright in front of him, still facing his rival */
const R_STOP = hold({ ...SIDE, brow: 0.45, mouth: 0, footL: [-8, 0], footR: [10, 0], armL: { w: [18, -184], elbow: [-1, 0.6], fist: 1, hand: 0 }, armR: { w: [24, -226], elbow: [0.4, 1], fist: 1, hand: 0 } }, 0, 44);
const R_BRACE = hold({ ...SIDE, lean: 11, crouch: 30, pitch: -4, brow: 0.95, mouth: -0.35, footL: [-46, 0], footR: [34, 0], liftL: 10, armL: { w: [2, -152], elbow: [-1, 0.3], fist: 1, hand: 0 }, armR: { w: [58, -176], elbow: [0.3, 1], fist: 1, hand: 0 } }, 86, 76);
/** facing us, the rifle upright in front of him, both fists together (symmetric: its own mirror) */
const orderOf = (kind: Held, y: number): FigPose => {
  const base: FigPose = { ...STAND, brow: 0.4, armL: { w: [-4, y], elbow: [-1, 0.7], fist: 1, hand: 0 }, armR: { w: [4, y], elbow: [1, 0.7], fist: 1, hand: 0 } };
  const a = aim(base, 0, kind);
  return { ...a, armR: { ...a.armR, hand: -a.armL.hand } };
};
const ORDER = orderOf("rifle", -206);
// the standard-bearer: the pole upright in the near fist, the far fist above it
const R_CARRY = hold({ ...SIDE, brow: 0.35, armL: { w: [30, -190], elbow: [-0.7, 1], fist: 1, hand: 0 }, armR: { w: [34, -236], elbow: [0.4, 1], fist: 1, hand: 0 } }, 0, 52, "pole");
const R_CARRY_BRACE = hold({ ...SIDE, brow: 0.8, lean: 6, crouch: 16, footL: [-30, 0], footR: [24, 0], armL: { w: [32, -176], elbow: [-0.7, 1], fist: 1, hand: 0 }, armR: { w: [36, -222], elbow: [0.4, 1], fist: 1, hand: 0 } }, 0, 52, "pole");
const F_ORDER = orderOf("pole", -210);

const face = (q: FigPose, dir: 1 | -1) => (dir === 1 ? q : mirrorPose(q));
export const POSES = {
  /** knees bent, the bayonet levelled forward at chest height */
  guard: (dir: 1 | -1 = 1) => face(R_GUARD, dir),
  /** lunging in, the bayonet thrust forward */
  thrust: (dir: 1 | -1 = 1) => face(R_THRUST, dir),
  /** leaning back, a step back, the rifle raised across him */
  recoil: (dir: 1 | -1 = 1) => face(R_RECOIL, dir),
  /** standing at the ready, the rifle slanted forward */
  ready: (dir: 1 | -1 = 1) => face(R_READY, dir),
  /** the rifle across the chest, muzzle up (the march) */
  port: (dir: 1 | -1 = 1) => face(R_PORT, dir),
  /** halted: the rifle snapped upright in front of him */
  stop: (dir: 1 | -1 = 1) => face(R_STOP, dir),
  /** crouched, front foot forward, the bayonet levelled low: holding the line */
  brace: (dir: 1 | -1 = 1) => face(R_BRACE, dir),
  /** facing us, the rifle upright in front: the middle of a turn */
  order: () => ORDER,
  /** the bearer: the standard upright */
  carry: (dir: 1 | -1 = 1) => face(R_CARRY, dir),
  carryBrace: (dir: 1 | -1 = 1) => face(R_CARRY_BRACE, dir),
  /** the bearer facing us mid-turn */
  flagOrder: () => F_ORDER,
};

// ---- the double-time run: one cycle laid over a pose (arms stay where the pose has them) ----
const RUN_STANCE = 0.42;
export const RUN = {
  /** how far a planted foot travels under him, units */
  stride: 80,
  /** world px he advances per full cycle at this scale (planted feet do not slide) */
  cycleDist: (scale: number, stride = 80) => (2 * stride * scale) / (2 * RUN_STANCE),
};
const frac = (v: number) => v - Math.floor(v);
const ease = (v: number) => v * v * (3 - 2 * v);
/** phase in cycles (distance / RUN.cycleDist); amount 0..1 blends from the base stance into the run */
export const runLegs = (base: FigPose, phase: number, amount = 1, stride = RUN.stride): FigPose => {
  const dir = Math.sin(base.yaw) >= 0 ? 1 : -1;
  const leg = (u0: number) => {
    const u = frac(u0);
    if (u < RUN_STANCE) {
      const v = u / RUN_STANCE;
      return { x: stride * (0.5 - v), y: 0, lift: 30 * ease(c01((v - 0.6) / 0.4)) - 10 * c01(1 - v / 0.2) };
    }
    const v = (u - RUN_STANCE) / (1 - RUN_STANCE);
    return { x: stride * (-0.5 + ease(v)), y: -26 * Math.sin(Math.PI * Math.min(1, v * 1.15)) - 12 * (1 - v) * (1 - v), lift: 34 * (1 - ease(Math.min(1, v * 1.5))) - 12 * ease(c01((v - 0.5) / 0.5)) };
  };
  const L = leg(phase);
  const R = leg(phase + 0.5);
  const a = amount;
  return {
    ...base,
    crouch: base.crouch + a * (6 + 4 * Math.cos(4 * Math.PI * phase)),
    lean: base.lean + a * 4 * dir,
    footL: [mix(base.footL[0], dir * L.x, a), base.footL[1] + a * L.y],
    footR: [mix(base.footR[0], dir * R.x, a), base.footR[1] + a * R.y],
    liftL: base.liftL + a * dir * L.lift,
    liftR: base.liftR + a * dir * R.lift,
  };
};
