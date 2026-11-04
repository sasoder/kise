// ---------------------------------------------------------------------------
// ranchFolkRig: the 2.5D machinery under the robert-johnson-ranch cast (ranchFolk.tsx). Pure geometry, no React.
// Every part of a figure is defined in 3D FIGURE SPACE and projected through a VIEW, so a figure turns, walks and
// rocks without mirror flips or pops (the pandemics Worker's principle, pandemicFolkWorker, built again for skirts).
//
// FIGURE SPACE (the Worker's units: the Worker is 513 tall): x = the figure's own LEFT, y = DOWN (the feet / floor
// at y = 0, up is - y), z = the figure's FORWARD.
// VIEW: yaw (deg) = the figure's facing relative to the camera: 0 faces the camera, 90 faces screen right, 180 shows
//   her back, -90 faces screen left. elev (deg) = how far the camera looks down on her (orthographic pitch: verticals
//   stay vertical, horizontal rings project as flat ellipses, the near half lower). Screen: x right, y down, d toward
//   the camera.
// PARTS
//   drape(fn, nPhi, nT)    a cloth surface S(phi, t) (phi round the body: 0 front, 90 her left, 180 back; t 0 top ..
//                          1 bottom edge). outline() = its silhouette as one region (the left / right extremes of every
//                          row, the near arc of the bottom edge, the far arc of the top), lineOn() = a visible line on
//                          it, patchOn() = a region on its surface clipped at the limb.
//   sphere caps / features the head: a cap (hair) clipped at the limb, a point feature (an eye) with its facing.
//   ellipsoidD             an exactly projected ellipsoid (feet, hands, bun, nose).
//   tube3                  a tapered tube along a 3D polyline (arms, legs, chair sticks).
//   hullD                  a smooth convex hull (the seated lap).
// ---------------------------------------------------------------------------
import { smoothClosed, tube } from "../kyle-pandemics/pandemicFolkWorker";

export type V3 = [number, number, number];
export type P2 = [number, number];
export const D2R = Math.PI / 180;
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
export const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm3 = (a: V3): V3 => {
  const l = len3(a) || 1e-9;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ===================================================================================================================
// THE VIEW
// ===================================================================================================================
export type View = { yaw: number; elev: number; c: number; s: number; ce: number; se: number; T: V3 };
export const makeView = (yaw: number, elev = 10): View => {
  const c = Math.cos(yaw * D2R);
  const s = Math.sin(yaw * D2R);
  const ce = Math.cos(elev * D2R);
  const se = Math.sin(elev * D2R);
  // the unit vector toward the camera, in figure space
  return { yaw, elev, c, s, ce, se, T: [-s * ce, -se, c * ce] };
};
export type Pr = { x: number; y: number; d: number };
export const proj = (v: View, p: V3): Pr => {
  const vx = p[0] * v.c + p[2] * v.s;
  const vd = p[2] * v.c - p[0] * v.s;
  return { x: vx, y: p[1] * v.ce + vd * v.se, d: vd * v.ce - p[1] * v.se };
};
export const pr2 = (v: View, p: V3): P2 => {
  const q = proj(v, p);
  return [q.x, q.y];
};
/** facing of a normal (figure space) toward the camera: -1 .. 1 */
export const facing = (v: View, n: V3) => dot3(norm3(n), v.T);

// ---- rotations about a pivot (figure space) ------------------------------------------------------------------------
/** pitch: + tips the parts above the pivot FORWARD (+z) */
export const rotPitch = (p: V3, piv: V3, deg: number): V3 => {
  if (!deg) return p;
  const a = deg * D2R;
  const w = p[2] - piv[2];
  const u = piv[1] - p[1];
  const w2 = w * Math.cos(a) + u * Math.sin(a);
  const u2 = u * Math.cos(a) - w * Math.sin(a);
  return [p[0], piv[1] - u2, piv[2] + w2];
};
/** roll: + tips the parts above the pivot toward her LEFT (+x) */
export const rotRoll = (p: V3, piv: V3, deg: number): V3 => {
  if (!deg) return p;
  const a = deg * D2R;
  const w = p[0] - piv[0];
  const u = piv[1] - p[1];
  const w2 = w * Math.cos(a) + u * Math.sin(a);
  const u2 = u * Math.cos(a) - w * Math.sin(a);
  return [piv[0] + w2, piv[1] - u2, p[2]];
};
/** yaw about a vertical axis through the pivot: + turns toward her LEFT (the same sense as the view yaw) */
export const rotYaw = (p: V3, piv: V3, deg: number): V3 => {
  if (!deg) return p;
  const a = deg * D2R;
  const x = p[0] - piv[0];
  const z = p[2] - piv[2];
  return [piv[0] + x * Math.cos(a) + z * Math.sin(a), p[1], piv[2] + z * Math.cos(a) - x * Math.sin(a)];
};
/** a rotation as a composed function (yaw, then pitch, then roll, all about one pivot) */
export type Xf = (p: V3) => V3;
export const xfOf = (piv: V3, o: { yaw?: number; pitch?: number; roll?: number }): Xf => (p) => rotRoll(rotPitch(rotYaw(p, piv, o.yaw ?? 0), piv, o.pitch ?? 0), piv, o.roll ?? 0);
/** the same rotation applied to a direction (no pivot) */
export const xfDir = (xf: Xf, d: V3): V3 => sub3(xf(d), xf([0, 0, 0]));

// ===================================================================================================================
// PATHS
// ===================================================================================================================
export { smoothClosed, tube };
export const polyD = (pts: P2[]) => (pts.length ? `M ${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join(" L ")} Z` : "");
export const lineD = (pts: P2[]) => (pts.length > 1 ? `M ${pts.map((p) => `${n2(p[0])} ${n2(p[1])}`).join(" L ")}` : "");
/** an open smooth line (Catmull-Rom) */
export const smoothOpen = (pts: P2[], tension = 1) => {
  const n = pts.length;
  if (n < 2) return "";
  let d = `M ${n2(pts[0][0])} ${n2(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];
    const t = tension / 6;
    d += ` C ${n2(p1[0] + (p2[0] - p0[0]) * t)} ${n2(p1[1] + (p2[1] - p0[1]) * t)} ${n2(p2[0] - (p3[0] - p1[0]) * t)} ${n2(p2[1] - (p3[1] - p1[1]) * t)} ${n2(p2[0])} ${n2(p2[1])}`;
  }
  return d;
};
export const ellD = (cx: number, cy: number, rx: number, ry: number, rotDeg = 0) => {
  const pts: P2[] = [];
  const cr = Math.cos(rotDeg * D2R);
  const sr = Math.sin(rotDeg * D2R);
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return smoothClosed(pts);
};
/** the convex hull of points (monotone chain) */
export const hull = (pts: P2[]): P2[] => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
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
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** resample a closed polygon to points no farther apart than `step` (so the smooth path has no long flat chords) */
export const densify = (pts: P2[], step: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
  }
  return out;
};
export const hullD = (pts: P2[], tension = 0.8) => {
  const h = hull(pts);
  return h.length >= 3 ? smoothClosed(densify(h, 14), tension) : "";
};

// ===================================================================================================================
// TUBES AND ELLIPSOIDS
// ===================================================================================================================
/** a tapered tube along a 3D polyline (projected), widths per point; returns the path and its mean depth */
export const tube3 = (v: View, pts: V3[], ws: number[]) => {
  const q = pts.map((p) => proj(v, p));
  // a tube seen end-on still keeps a little length (never a dot that pops)
  return { d: tube(q.map((r) => [r.x, r.y] as P2), ws), depth: q.reduce((s, r) => s + r.d, 0) / q.length, pts: q };
};
/** an ellipsoid with centre c and three semi-axis vectors (figure space), projected exactly: returns its path */
export const ellipsoidD = (v: View, c: V3, ax: [V3, V3, V3]) => {
  // the projected ellipse = image of the unit ball under A = P M (2 x 3); its matrix is A A^T
  const P = (u: V3): P2 => {
    const q = proj(v, u);
    return [q.x, q.y];
  };
  const a = ax.map(P);
  const m11 = a[0][0] ** 2 + a[1][0] ** 2 + a[2][0] ** 2;
  const m22 = a[0][1] ** 2 + a[1][1] ** 2 + a[2][1] ** 2;
  const m12 = a[0][0] * a[0][1] + a[1][0] * a[1][1] + a[2][0] * a[2][1];
  const tr = (m11 + m22) / 2;
  const det = Math.sqrt(Math.max(0, ((m11 - m22) / 2) ** 2 + m12 * m12));
  const l1 = tr + det;
  const l2 = Math.max(1e-6, tr - det);
  const ang = 0.5 * Math.atan2(2 * m12, m11 - m22);
  const cc = proj(v, c);
  return { d: ellD(cc.x, cc.y, Math.sqrt(l1), Math.sqrt(l2), ang / D2R), x: cc.x, y: cc.y, depth: cc.d };
};

// ===================================================================================================================
// DRAPES (cloth surfaces)
// ===================================================================================================================
export type DrapeFn = (phiDeg: number, t: number) => V3;
export type Drape = { fn: DrapeFn; nPhi: number; ts: number[]; grid: V3[][] };
/** sample a drape: rows at t (0 top .. 1 bottom), nPhi columns round (phi 0 = front, increasing toward her left) */
export const drape = (fn: DrapeFn, nPhi = 48, nT = 10, tPow = 1): Drape => {
  const ts = Array.from({ length: nT + 1 }, (_, j) => Math.pow(j / nT, tPow));
  const grid = ts.map((t) => Array.from({ length: nPhi }, (_, i) => fn((i / nPhi) * 360, t)));
  return { fn, nPhi, ts, grid };
};
/** the extreme columns of one projected row, refined between samples (parabola through the neighbours) */
const extremes = (row: Pr[]) => {
  let iL = 0;
  let iR = 0;
  for (let i = 1; i < row.length; i++) {
    if (row[i].x < row[iL].x) iL = i;
    if (row[i].x > row[iR].x) iR = i;
  }
  return { iL, iR };
};
const refine = (row: Pr[], i: number): P2 => {
  const n = row.length;
  const a = row[(i - 1 + n) % n];
  const b = row[i];
  const c = row[(i + 1) % n];
  const den = a.x - 2 * b.x + c.x;
  if (Math.abs(den) < 1e-6) return [b.x, b.y];
  let u = (0.5 * (a.x - c.x)) / den;
  u = Math.max(-0.5, Math.min(0.5, u));
  // a parabola through the three x values; y follows linearly toward the side we move to
  const x = b.x - 0.25 * (a.x - c.x) * u;
  const y = u < 0 ? lerp(b.y, a.y, -u) : lerp(b.y, c.y, u);
  return [x, y];
};
/** the arc of a closed row from column i0 to i1 going in direction dir (+1 / -1), inclusive */
const arc = (row: Pr[], i0: number, i1: number, dir: 1 | -1): Pr[] => {
  const n = row.length;
  const out: Pr[] = [];
  let i = i0;
  for (let k = 0; k <= n; k++) {
    out.push(row[i]);
    if (i === i1) break;
    i = (i + dir + n) % n;
  }
  return out;
};
const meanD = (a: Pr[]) => a.reduce((s, r) => s + r.d, 0) / Math.max(1, a.length);
/** the drape's silhouette as one region (screen points, closed) */
export const outlinePts = (v: View, D: Drape): P2[] => {
  const rows = D.grid.map((row) => row.map((p) => proj(v, p)));
  const ex = rows.map(extremes);
  const L: P2[] = rows.map((r, j) => refine(r, ex[j].iL));
  const R: P2[] = rows.map((r, j) => refine(r, ex[j].iR));
  const last = rows.length - 1;
  const b1 = arc(rows[last], ex[last].iL, ex[last].iR, 1);
  const b2 = arc(rows[last], ex[last].iL, ex[last].iR, -1);
  const bottom = meanD(b1) >= meanD(b2) ? b1 : b2;
  const t1 = arc(rows[0], ex[0].iR, ex[0].iL, 1);
  const t2 = arc(rows[0], ex[0].iR, ex[0].iL, -1);
  const top = meanD(t1) <= meanD(t2) ? t1 : t2;
  const pts: P2[] = [];
  for (let j = 0; j < rows.length; j++) pts.push(L[j]);
  for (const r of bottom.slice(1, -1)) pts.push([r.x, r.y]);
  for (let j = rows.length - 1; j >= 0; j--) pts.push(R[j]);
  for (const r of top.slice(1, -1)) pts.push([r.x, r.y]);
  return pts;
};
export const outlineD = (v: View, D: Drape, tension = 0.9) => smoothClosed(dedupe(outlinePts(v, D)), tension);
const dedupe = (pts: P2[]) => pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.35);

/** the outward facing of the drape at (phi, t): + toward the camera */
export const facingOn = (v: View, D: Drape, phi: number, t: number) => {
  const e = 2;
  const a = D.fn(phi - e, t);
  const b = D.fn(phi + e, t);
  const c = D.fn(phi, Math.max(0, t - 0.02));
  const d = D.fn(phi, Math.min(1, t + 0.02));
  // phi increases toward her LEFT seen from the front, t increases downward: n = dS/dphi x dS/dt points outward
  const n = cross3(sub3(b, a), sub3(d, c));
  return facing(v, n);
};
/** a line on the drape along (phi(u), t(u)), u 0..1: the visible runs as screen points with their facing */
export const lineOn = (v: View, D: Drape, at: (u: number) => [number, number], n = 12) => {
  const out: { p: P2; f: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const [phi, t] = at(k / n);
    const q = proj(v, D.fn(phi, t));
    out.push({ p: [q.x, q.y], f: facingOn(v, D, phi, t) });
  }
  return out;
};
/** a region on the drape surface given by (phi, t) points: hidden points slide to the silhouette of their row */
export const patchOn = (v: View, D: Drape, pts: [number, number][]) => {
  let fsum = 0;
  const out: P2[] = pts.map(([phi, t]) => {
    const f = facingOn(v, D, phi, t);
    fsum += f;
    if (f >= 0) return pr2(v, D.fn(phi, t));
    // walk phi toward the visible side until the facing turns, in 3 deg steps (the limb), and use that point
    const stepDir = facingOn(v, D, phi + 3, t) > f ? 1 : -1;
    let ph = phi;
    for (let k = 0; k < 60; k++) {
      ph += 3 * stepDir;
      if (facingOn(v, D, ph, t) >= 0) break;
    }
    return pr2(v, D.fn(ph, t));
  });
  return { pts: out, facing: fsum / pts.length };
};

// ===================================================================================================================
// SPHERES (the head)
// ===================================================================================================================
export type Sph = { c: V3; R: number; ys: number };
/** a point on the sphere in direction dir (figure space), projected, with its facing */
export const onSphere = (v: View, S: Sph, dir: V3, lift = 0) => {
  const u = norm3(dir);
  const p = add3(S.c, mul3(u, S.R + lift));
  const q = proj(v, p);
  const cc = proj(v, S.c);
  return { x: q.x, y: cc.y + (q.y - cc.y) * S.ys, f: dot3(u, v.T) };
};
/** an orthonormal pair perpendicular to an axis */
const perp = (a: V3): [V3, V3] => {
  const h: V3 = Math.abs(a[1]) < 0.9 ? [0, -1, 0] : [1, 0, 0];
  const e1 = norm3(cross3(a, h));
  const e2 = norm3(cross3(a, e1));
  return [e1, e2];
};
/** a cap of the sphere (all points within rho deg of axis), clipped at the limb; null when nothing shows */
export const sphereCapPts = (v: View, S: Sph, axis: V3, rhoDeg: number, n = 48): P2[] | null => {
  const ax = norm3(axis);
  const [e1, e2] = perp(ax);
  const cr = Math.cos(rhoDeg * D2R);
  const sr = Math.sin(rhoDeg * D2R);
  const cc = proj(v, S.c);
  const scr = (dir: V3): P2 => {
    const q = proj(v, add3(S.c, mul3(dir, S.R)));
    return [q.x, cc.y + (q.y - cc.y) * S.ys];
  };
  const B: { dir: V3; f: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dir = norm3(add3(mul3(ax, cr), add3(mul3(e1, sr * Math.cos(a)), mul3(e2, sr * Math.sin(a)))));
    B.push({ dir, f: dot3(dir, v.T) });
  }
  const vis = B.filter((b) => b.f >= 0).length;
  // the limb in figure space: unit vectors perpendicular to T
  const [l1, l2] = perp(v.T);
  const limbDir = (beta: number): V3 => norm3(add3(mul3(l1, Math.cos(beta)), mul3(l2, Math.sin(beta))));
  const inCap = (d: V3) => dot3(d, ax) >= cr;
  if (vis === n) return B.map((b) => scr(b.dir));
  if (vis === 0) {
    // the boundary is all hidden: the cap covers the whole visible disc, or none of it
    if (dot3(v.T, ax) >= cr) return Array.from({ length: n }, (_, i) => scr(limbDir((i / n) * Math.PI * 2)));
    return null;
  }
  // find the crossings (hidden -> visible at i0, visible -> hidden at i1)
  let i0 = -1;
  let i1 = -1;
  for (let i = 0; i < n; i++) {
    const a = B[i];
    const b = B[(i + 1) % n];
    if (a.f < 0 && b.f >= 0) i0 = (i + 1) % n;
    if (a.f >= 0 && b.f < 0) i1 = i;
  }
  if (i0 < 0 || i1 < 0) return B.filter((b) => b.f >= 0).map((b) => scr(b.dir));
  const pts: P2[] = [];
  // the visible run of the boundary
  const crossDir = (a: { dir: V3; f: number }, b: { dir: V3; f: number }): V3 => {
    const t = a.f / (a.f - b.f);
    return norm3(lerp3(a.dir, b.dir, t));
  };
  const startDir = crossDir(B[(i0 - 1 + n) % n], B[i0]);
  const endDir = crossDir(B[i1], B[(i1 + 1) % n]);
  pts.push(scr(startDir));
  for (let i = i0; ; i = (i + 1) % n) {
    pts.push(scr(B[i].dir));
    if (i === i1) break;
  }
  pts.push(scr(endDir));
  // the limb arc from endDir back to startDir, the way that stays inside the cap
  const angOf = (d: V3) => Math.atan2(dot3(d, l2), dot3(d, l1));
  const bE = angOf(endDir);
  let bS = angOf(startDir);
  let span = bS - bE;
  while (span <= 0) span += Math.PI * 2;
  // try the positive way first: its midpoint must be in the cap
  let dirSign = 1;
  if (!inCap(limbDir(bE + span / 2))) {
    dirSign = -1;
    span = Math.PI * 2 - span;
  }
  bS = bE + dirSign * span;
  const m = Math.max(2, Math.ceil((span / (Math.PI * 2)) * n));
  for (let k = 1; k < m; k++) pts.push(scr(limbDir(bE + (dirSign * span * k) / m)));
  return pts;
};
