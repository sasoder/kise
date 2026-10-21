// ---------------------------------------------------------------------------
// weirdWaysMan: the 3D engraved-figure toolkit of cut 74 (WeirdWaysToExploit, kyle-pandemics).
// STATUS (revision 1, approved): the full figure `Man` below is RETIRED (the director chose londonCastV2's Worker);
// the cut uses only FreeArm (the two reaching arms), SurfaceThreads (the fungus threads on a 3D surface), Part /
// tubeSurf / patchD / curveD, frameOf / toW and headLocal (the cast-head proxy's shape). The first pass's notes follow.
//
// Why not londonCastV2's Worker: the cast has no back view (its rig is built for yaw -pi/2..pi/2; past that the arms
// cross the body and the apron, waistcoat front and face are drawn on his back: probe still in the cut's scratch
// folder, probe.png). This cut opens on his BACK and turns him all the way round, so the figure is built here as
// volumes in the depth kit's 3D world (londonDepth's perspective) and dressed as the cast's Worker: the knitted cap,
// cropped hair, shirt sleeves rolled to the elbow, a waistcoat, a leather apron, breeches, stockings, buckled shoes.
// Same manner as the cast: the form on a DARK casing, a firm outline, a flat darker tone plus hatching on the side
// turned from the light (upper left, toward the camera), cream skin and linen.
//
// THE MODEL. World units = the cast's (a man ~310 from the soles to the top of the cap), floor Y 0, up -Y, Z depth
// (away from the camera +). Every part is a SURFACE (a function (u, phi) -> 3D point) sampled into rings; a part's
// outline is the union of the hulls of consecutive projected rings (cased: casing strokes first, fills on top), its
// shade the hull of the rings' points that face the camera and are turned from the light. Surface details (eyes,
// seams, buttons, hair, the fungus threads) are curves on the surfaces, drawn only where the surface faces the
// camera, so a turn is continuous at every yaw (no flip, no swap): the head is a real head seen from any side.
// Yaw: the cast's convention, 0 = facing the camera, + = facing screen right, +-pi = his back to us.
// ---------------------------------------------------------------------------
import React from "react";
import { FUNGUS } from "./cordyceps";
import type { Persp } from "../kyle-london/londonDepth";

export type P2 = [number, number];
export type V3 = [number, number, number];
export const DARK = "#17120D";

// ---- vectors ---------------------------------------------------------------------------------
export const v3 = {
  add: (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a: V3) => Math.hypot(a[0], a[1], a[2]),
  norm: (a: V3): V3 => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
  mix: (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sm01 = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const f2 = (v: number) => v.toFixed(2);
const pt = (p: P2) => `${f2(p[0])},${f2(p[1])}`;
const hsh = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---- frames: an origin and three axes (a = his left, y = down, b = his forward) -----------------------------------
export type Frame = { o: V3; ax: V3; ay: V3; az: V3 };
export const toW = (F: Frame, l: V3): V3 => [
  F.o[0] + F.ax[0] * l[0] + F.ay[0] * l[1] + F.az[0] * l[2],
  F.o[1] + F.ax[1] * l[0] + F.ay[1] * l[1] + F.az[1] * l[2],
  F.o[2] + F.ax[2] * l[0] + F.ay[2] * l[1] + F.az[2] * l[2],
];
export const dirW = (F: Frame, l: V3): V3 => [
  F.ax[0] * l[0] + F.ay[0] * l[1] + F.az[0] * l[2],
  F.ax[1] * l[0] + F.ay[1] * l[1] + F.az[1] * l[2],
  F.ax[2] * l[0] + F.ay[2] * l[1] + F.az[2] * l[2],
];
/** a frame at o with yaw (cast convention), then pitched forward by `pitch` deg (top toward his front) and rolled by
 *  `roll` deg (top toward his right) */
export const frameOf = (o: V3, yaw: number, pitch = 0, roll = 0): Frame => {
  let ax: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  let ay: V3 = [0, 1, 0];
  let az: V3 = [Math.sin(yaw), 0, -Math.cos(yaw)];
  const l = (pitch * Math.PI) / 180;
  const ay1 = v3.sub(v3.mul(ay, Math.cos(l)), v3.mul(az, Math.sin(l)));
  const az1 = v3.add(v3.mul(az, Math.cos(l)), v3.mul(ay, Math.sin(l)));
  ay = ay1;
  az = az1;
  const r = (roll * Math.PI) / 180;
  const ay2 = v3.add(v3.mul(ay, Math.cos(r)), v3.mul(ax, Math.sin(r)));
  const ax2 = v3.sub(v3.mul(ax, Math.cos(r)), v3.mul(ay, Math.sin(r)));
  return { o, ax: ax2, ay: ay2, az };
};

// ---- the view: projection, camera position, light -------------------------------------------------------------
export type View = { P: Persp; cam: V3; light: V3 };
export const viewOf = (P: Persp): View => ({
  P,
  cam: [P.vp[0], P.horizonY, -P.Dc],
  // toward the light: the upper left, a little toward the camera (one light for the whole cut)
  light: v3.norm([-0.62, -0.62, -0.48]),
});
const proj = (V: View, p: V3): P2 => V.P.p(p[0], p[1], p[2]);

// ---- surfaces ------------------------------------------------------------------------------------------------------
/** a surface: (u in 0..1 along, phi in 0..2pi around) -> world point */
export type Surf = { at: (u: number, phi: number) => V3; nu: number; nphi: number };
type Sampled = { p: V3[][]; q: P2[][]; n: V3[][]; vis: boolean[][]; lit: number[][] };
const sample = (V: View, S: Surf): Sampled => {
  const p: V3[][] = [];
  const q: P2[][] = [];
  const n: V3[][] = [];
  const vis: boolean[][] = [];
  const lit: number[][] = [];
  for (let i = 0; i <= S.nu; i++) {
    const u = i / S.nu;
    const rp: V3[] = [];
    const rq: P2[] = [];
    const rn: V3[] = [];
    const rv: boolean[] = [];
    const rl: number[] = [];
    const C = ringCentre(S, u);
    for (let j = 0; j < S.nphi; j++) {
      const phi = (j / S.nphi) * Math.PI * 2;
      const P0 = S.at(u, phi);
      const nn = normalAt(S, u, phi, P0, C);
      rp.push(P0);
      rq.push(proj(V, P0));
      rn.push(nn);
      rv.push(v3.dot(nn, v3.sub(V.cam, P0)) > 0);
      rl.push(v3.dot(nn, V.light));
    }
    p.push(rp);
    q.push(rq);
    n.push(rn);
    vis.push(rv);
    lit.push(rl);
  }
  return { p, q, n, vis, lit };
};
/** the outward normal at (u, phi) by finite differences (phi increases toward his left from his front, so
 *  d/dphi x d/du points outward for the surfaces built here) */
export const ringCentre = (S: Surf, u: number): V3 => {
  let c: V3 = [0, 0, 0];
  for (let k = 0; k < 6; k++) c = v3.add(c, S.at(u, (k / 6) * Math.PI * 2));
  return v3.mul(c, 1 / 6);
};
export const normalAt = (S: Surf, u: number, phi: number, P0?: V3, C?: V3): V3 => {
  const e = 1e-3;
  const p0 = P0 ?? S.at(u, phi);
  const du = u < 1 - e ? v3.sub(S.at(u + e, phi), p0) : v3.sub(p0, S.at(u - e, phi));
  const dp = v3.sub(S.at(u, phi + e), p0);
  let n = v3.norm(v3.cross(dp, du));
  const c = C ?? ringCentre(S, u);
  if (v3.dot(n, v3.sub(p0, c)) < 0) n = v3.mul(n, -1);
  return n;
};
const hull = (pts: P2[]): P2[] => {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (s.length < 3) return s;
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const p of s) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
    lo.push(p);
  }
  const up: P2[] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop();
    up.push(p);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
};
const polyD = (pts: P2[]) => (pts.length > 2 ? `M${pts.map(pt).join("L")}Z` : "");

export type Inks = { fill: string; shade: string; hatch: string };
export type PartOpts = {
  uid: string;
  ink: Inks;
  /** casing width, world units (scaled by depth) */
  casing?: number;
  /** hatch density multiplier (1 = the cast's) */
  hatch?: number;
  /** skip the shade (for tiny parts) */
  flat?: boolean;
};
/** a part: the cased union of its ring hulls, its shade (the visible points turned from the light) with hatching,
 *  then `children` (details) on top */
export const Part: React.FC<{ V: View; S: Surf; o: PartOpts; children?: React.ReactNode; light?: number }> = ({ V, S, o, children, light = 0.04 }) => {
  const sm = sample(V, S);
  const segs: string[] = [];
  const darks: string[] = [];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < S.nu; i++) {
    const h = hull([...sm.q[i], ...sm.q[i + 1]]);
    segs.push(polyD(h));
    for (const p of h) {
      x0 = Math.min(x0, p[0]);
      y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
    }
    if (!o.flat) {
      const dk: P2[] = [];
      for (const k of [i, i + 1]) for (let j = 0; j < S.nphi; j++) if (sm.vis[k][j] && sm.lit[k][j] < light) dk.push(sm.q[k][j]);
      if (dk.length > 2) darks.push(polyD(hull(dk)));
    }
  }
  const zc = sm.p[Math.floor(S.nu / 2)][0][2];
  const r = V.P.r(zc);
  const cw = (o.casing ?? 1.35) * r * 0.82;
  const segD = segs.join("");
  const darkD = darks.join("");
  const hg = (2.6 / (o.hatch ?? 1)) * r;
  let hd = "";
  if (darkD && !o.flat) {
    // hatching at ~112 deg (the cast's), across the part's box. (V2) The lines are anchored to the part itself (the
    // projected centre of its first ring), each line keeping its index and jitter from frame to frame, so the hatch
    // travels with the part and never swims or reshuffles as the part's box changes.
    const a = (112 * Math.PI) / 180;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const anc = sm.q[0].reduce((acc, q) => [acc[0] + q[0] / sm.q[0].length, acc[1] + q[1] / sm.q[0].length] as P2, [0, 0] as P2);
    const nx = -dy;
    const ny = dx;
    const proj0 = anc[0] * nx + anc[1] * ny;
    const corners: P2[] = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    const ps = corners.map((c) => c[0] * nx + c[1] * ny);
    const k0 = Math.floor((Math.min(...ps) - proj0) / hg) - 1;
    const k1 = Math.ceil((Math.max(...ps) - proj0) / hg) + 1;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
    const along = cx * dx + cy * dy;
    for (let k = k0; k <= k1; k++) {
      const off = proj0 + (k + (hsh(k + 1000, 7) - 0.5) * 0.4) * hg;
      const px = nx * off + dx * along;
      const py = ny * off + dy * along;
      hd += `M${f2(px - dx * R)},${f2(py - dy * R)}L${f2(px + dx * R)},${f2(py + dy * R)}`;
    }
  }
  return (
    <g>
      <path d={segD} fill="none" stroke={DARK} strokeWidth={cw * 2} strokeLinejoin="round" />
      <path d={segD} fill={o.ink.fill} />
      {darkD ? (
        <>
          <clipPath id={`${o.uid}-dk`}>
            <path d={darkD} />
          </clipPath>
          <path d={darkD} fill={o.ink.shade} />
          <path d={hd} clipPath={`url(#${o.uid}-dk)`} fill="none" stroke={o.ink.hatch} strokeWidth={0.75 * r} strokeOpacity={0.55} />
        </>
      ) : null}
      <clipPath id={`${o.uid}-cl`}>
        <path d={segD} />
      </clipPath>
      <g clipPath={`url(#${o.uid}-cl)`}>{children}</g>
    </g>
  );
};

// ---- curves and patches on a surface ---------------------------------------------------------------------------
const visAt = (V: View, S: Surf, u: number, phi: number) => {
  const p = S.at(u, phi);
  const n = normalAt(S, u, phi, p);
  return { p, q: proj(V, p), vis: v3.dot(n, v3.sub(V.cam, p)) > 0, n };
};
/** a polyline on a surface as SVG path data: only the runs that face the camera (lift > 0 floats it off the surface
 *  along the normal, world units) */
export const curveD = (V: View, S: Surf, uv: [number, number][], lift = 0) => {
  let d = "";
  let open = false;
  for (const [u, phi] of uv) {
    const a = visAt(V, S, u, phi);
    if (!a.vis) {
      open = false;
      continue;
    }
    const q = lift ? proj(V, v3.add(a.p, v3.mul(a.n, lift))) : a.q;
    d += `${open ? "L" : "M"}${pt(q)}`;
    open = true;
  }
  return d;
};
/** a closed region on the surface (u0..u1 x phi0..phi1, or a custom boundary test) as filled visible quads */
export const patchD = (V: View, S: Surf, u0: number, u1: number, p0: number, p1: number, nu = 10, np = 14, inside?: (u: number, phi: number) => boolean) => {
  let d = "";
  const g: { q: P2; vis: boolean; ok: boolean }[][] = [];
  for (let i = 0; i <= nu; i++) {
    const row: { q: P2; vis: boolean; ok: boolean }[] = [];
    for (let j = 0; j <= np; j++) {
      const u = mix(u0, u1, i / nu);
      const ph = mix(p0, p1, j / np);
      const a = visAt(V, S, u, ph);
      row.push({ q: a.q, vis: a.vis, ok: inside ? inside(u, ph) : true });
    }
    g.push(row);
  }
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < np; j++) {
      const c = [g[i][j], g[i][j + 1], g[i + 1][j + 1], g[i + 1][j]];
      if (c.some((x) => !x.vis || !x.ok)) continue;
      d += `M${c.map((x) => pt(x.q)).join("L")}Z`;
    }
  return d;
};

// ---- the fungus threads on a surface (the look of cordyceps.tsx's MyceliumThreads, lifted onto a 3D surface) -------
export type ThreadSpec = { S: Surf; path: [number, number][]; seed: number };
/** threads creeping along a (u, phi) path on S as t goes 0 -> 1: a wandering main thread drawn by its tip, side
 *  branches (each with a fork) sprouting behind the tip and lengthening with age; only where the surface faces us.
 *  Lengths in world units along the surface (approximate). */
export const SurfaceThreads: React.FC<{ V: View; th: ThreadSpec; t: number; width?: number; every?: number; branchLen?: number; spread?: number }> = ({ V, th, t, width = 0.3, every = 2.6, branchLen = 3, spread = 0.6 }) => {
  if (t <= 0) return null;
  const { S, path, seed } = th;
  // resample the (u, phi) path by world arc length
  const pts3 = path.map(([u, ph]) => S.at(u, ph));
  const cum = [0];
  for (let i = 1; i < pts3.length; i++) cum.push(cum[i - 1] + v3.len(v3.sub(pts3[i], pts3[i - 1])));
  const L = cum[cum.length - 1];
  if (L < 1e-3) return null;
  const at = (s: number): [number, number] => {
    const ss = Math.max(0, Math.min(L, s));
    let i = 1;
    while (i < cum.length - 1 && cum[i] < ss) i++;
    const f = (ss - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return [mix(path[i - 1][0], path[i][0], f), mix(path[i - 1][1], path[i][1], f)];
  };
  // a local (du, dphi) per world unit to wander sideways: estimate from the path direction
  const side = (s: number): [number, number] => {
    const a = at(s - 0.3);
    const b = at(s + 0.3);
    const pa = S.at(a[0], a[1]);
    const pb = S.at(b[0], b[1]);
    const dw = Math.max(1e-4, v3.len(v3.sub(pb, pa)));
    // perpendicular in parameter space (scaled to world)
    return [-(b[1] - a[1]) / dw, (b[0] - a[0]) / dw];
  };
  const wob = (s: number) => spread * (0.6 * Math.sin(s * 0.42 + seed * 2.1) + 0.4 * Math.sin(s * 1.15 + seed * 5.3));
  const reach = c01(t) * L;
  const STEP = 0.5;
  const mainUV: [number, number][] = [];
  for (let s = 0; s <= reach; s += STEP) {
    const [u, ph] = at(s);
    const sd = side(s);
    const o = wob(s);
    mainUV.push([u + sd[0] * o * 0.02, ph + sd[1] * o * 0.06]);
  }
  if (reach > 0) mainUV.push(at(reach));
  const bran: [number, number][][] = [];
  const fine: [number, number][][] = [];
  const nb = Math.floor(L / every);
  for (let i = 0; i < nb; i++) {
    const s0 = (i + 0.3 + 0.5 * hsh(i, seed)) * every;
    if (s0 > reach) break;
    const age = reach - s0;
    const [u0, p0] = at(s0);
    const fw = at(s0 + 0.5);
    const sd = (i + Math.floor(seed)) % 2 === 0 ? 1 : -1;
    const ang = (0.5 + 0.5 * hsh(i, seed + 7)) * sd;
    const blen = Math.min(branchLen * (0.6 + 0.7 * hsh(i, seed + 11)), age * 0.75);
    if (blen < 0.4) continue;
    // direction in (u, phi): the path direction turned by ang (phi scaled ~ x3 for a head-sized surface)
    const d0: [number, number] = [fw[0] - u0, fw[1] - p0];
    const dl = Math.hypot(d0[0], d0[1] * 0.33) || 1;
    let d: [number, number] = [d0[0] / dl, d0[1] / dl];
    const pr: [number, number] = [-d[1] * 0.33, d[0] * 3];
    d = [d[0] * Math.cos(ang) + pr[0] * Math.sin(ang), d[1] * Math.cos(ang) + pr[1] * Math.sin(ang)];
    // per world unit in (u, phi): estimate the world length of a unit step
    const pa = S.at(u0, p0);
    const pb = S.at(u0 + d[0] * 0.01, p0 + d[1] * 0.01);
    const wl = Math.max(1e-4, v3.len(v3.sub(pb, pa)) / 0.01);
    const steps = Math.max(2, Math.ceil(blen / 0.6));
    const bp: [number, number][] = [[u0, p0]];
    let cu = u0;
    let cp = p0;
    let dd = d;
    const curl = 0.06 * sd;
    for (let k = 1; k <= steps; k++) {
      dd = [dd[0] * Math.cos(curl) - dd[1] * 0.33 * Math.sin(curl), dd[1] * Math.cos(curl) + (dd[0] / 0.33) * Math.sin(curl) * 0.33];
      cu += (dd[0] * (blen / steps)) / wl;
      cp += (dd[1] * (blen / steps)) / wl;
      bp.push([cu, cp]);
    }
    bran.push(bp);
    if (blen > 2.2) {
      const kk = Math.floor(bp.length * 0.55);
      const fr = bp[kk];
      const fd: [number, number] = [dd[0] * Math.cos(-sd * 0.8) - dd[1] * 0.33 * Math.sin(-sd * 0.8), dd[1] * Math.cos(-sd * 0.8) + (dd[0] / 0.33) * Math.sin(-sd * 0.8) * 0.33];
      const fl = Math.min(blen * 0.5, (blen - 2.2) * 0.8);
      fine.push([fr, [fr[0] + (fd[0] * fl) / wl, fr[1] + (fd[1] * fl) / wl]]);
    }
  }
  const r = V.P.r(pts3[0][2]);
  const md = curveD(V, S, mainUV, 0.25);
  const bd = bran.map((b) => curveD(V, S, b, 0.25)).join("");
  const fd = fine.map((b) => curveD(V, S, [b[0], [mix(b[0][0], b[1][0], 0.5), mix(b[0][1], b[1][1], 0.5)], b[1]], 0.25)).join("");
  // never thinner than ~2 screen px (they must read on a phone in the wide)
  const w = Math.max(width * r, 2.6 / V.P.cam.k);
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d={md + bd + fd} stroke={FUNGUS.line} strokeWidth={w + Math.max(0.35 * r, 1.4 / V.P.cam.k)} strokeOpacity={0.5} />
      <path d={md} stroke={FUNGUS.main} strokeWidth={w} />
      <path d={bd} stroke={FUNGUS.main} strokeWidth={w * 0.72} />
      <path d={fd} stroke={FUNGUS.main} strokeWidth={w * 0.5} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// INKS (the Worker's: cream linen and skin; an umber waistcoat, darker breeches, so he reads as a dressed man on
// the night street and never as a pale ghost)
// ---------------------------------------------------------------------------
export const INK = {
  skin: { fill: "#E9DDBF", shade: "#CDBE97", hatch: "#7A6C50" },
  linen: { fill: "#E4D7B6", shade: "#C6B68E", hatch: "#7A6C50" },
  waistcoat: { fill: "#8E7A5A", shade: "#6C5B41", hatch: "#2E251B" },
  breeches: { fill: "#6B5940", shade: "#4F4130", hatch: "#221B13" },
  stocking: { fill: "#CDBF9C", shade: "#A99B79", hatch: "#4E4433" },
  shoe: { fill: "#3B3025", shade: "#2A221A", hatch: "#0E0B08" },
  apron: { fill: "#7C6548", shade: "#5E4C35", hatch: "#271F16" },
  cap: { fill: "#A08F6E", shade: "#7F7055", hatch: "#3A3123" },
  hair: "#4A3D2D",
  line: DARK,
};

// ---------------------------------------------------------------------------
// THE POSE
// ---------------------------------------------------------------------------
export type Arm = {
  /** elbow and wrist, torso-local offsets from the shoulder (a = his left, y = down, b = his forward) */
  elbow: V3;
  wrist: V3;
  /** the hand: 0 relaxed (fingers hanging), 1 open claw reaching */
  claw: number;
  /** the hand's pitch about the wrist (deg, + = fingers forward / up) */
  bend: number;
};
export type ManPose = {
  /** the body's root on the floor (between the feet), world */
  X: number;
  Z: number;
  /** hip height (units, < 0) */
  hipY: number;
  /** hip yaw, shoulder yaw (cast convention), head yaw (absolute) */
  yaw: number;
  chestYaw: number;
  headYaw: number;
  /** torso pitch forward (deg) and roll (deg, top to his right) */
  lean: number;
  roll: number;
  /** shoulders rolled forward and down (0..1) */
  slump: number;
  /** head pitch (deg, chin down) and roll (deg, top to his right) */
  headPitch: number;
  headRoll: number;
  /** the ankles, world (Y < 0 lifts the foot) and each foot's yaw; heel lift (deg) */
  footL: V3;
  footR: V3;
  footYawL: number;
  footYawR: number;
  heelL: number;
  heelR: number;
  armL: Arm;
  armR: Arm;
  /** the jaw: 0 shut, 1 slack open */
  mouth: number;
  /** the upper lids: 0 open, 1 shut */
  lids: number;
};
export const HANG_L: Arm = { elbow: [5, 64, -1], wrist: [3, 122, 5], claw: 0, bend: 0 };
export const HANG_R: Arm = { elbow: [-5, 64, -1], wrist: [-3, 122, 5], claw: 0, bend: 0 };

export const lerpArm = (a: Arm, b: Arm, t: number): Arm => ({ elbow: v3.mix(a.elbow, b.elbow, t), wrist: v3.mix(a.wrist, b.wrist, t), claw: mix(a.claw, b.claw, t), bend: mix(a.bend, b.bend, t) });

// ---------------------------------------------------------------------------
// THE RIG: frames and joints from a pose
// ---------------------------------------------------------------------------
const SH = { a: 31, y: -97, b: -1 };
export const HIP_A = 10.5;
const THIGH = 72;
const SHIN = 70;
const ANKLE_H = 9;
export type Rig = ReturnType<typeof rigOf>;
export const rigOf = (q: ManPose) => {
  const root: V3 = [q.X, q.hipY, q.Z];
  const hipF = frameOf(root, q.yaw, q.lean * 0.25, q.roll * 0.4);
  // the chest frame: pitched by the lean about the hips, twisted to chestYaw
  const chestF = frameOf(root, q.chestYaw, q.lean, q.roll);
  const torsoAt = (a: number, y: number, b: number, u: number): V3 => {
    // u 0 (hips) .. 1 (shoulders): blend the hip and chest frames
    const ph = toW(hipF, [a, y, b]);
    const pc = toW(chestF, [a, y, b]);
    return v3.mix(ph, pc, c01(u));
  };
  const slumpB = 6 * q.slump;
  const slumpY = 4 * q.slump;
  const shoulder = (sgn: number): V3 => toW(chestF, [sgn * SH.a, SH.y + slumpY, SH.b + slumpB]);
  const neckBase = toW(chestF, [0, -104 + slumpY * 0.6, -2 + slumpB * 0.7]);
  // the neck leans forward with the slump and the head pitch; the head pivot (atlas) on top of it
  const neckDir = v3.norm(dirW(frameOf([0, 0, 0], q.chestYaw, q.lean + 12 + 14 * q.slump + q.headPitch * 0.35, q.roll), [0, -1, 0]));
  const pivot = v3.add(neckBase, v3.mul(neckDir, 25));
  const headF0 = frameOf([0, 0, 0], q.headYaw, q.headPitch + q.lean * 0.5, q.headRoll + q.roll * 0.5);
  const headC = v3.sub(pivot, dirW(headF0, [0, 9, -3.5]));
  const headF: Frame = { ...headF0, o: headC };
  // legs: 2-bone IK, the knee toward the foot's forward
  const leg = (sgn: number, ank: V3, fyaw: number) => {
    const hip = toW(hipF, [sgn * HIP_A, 4, 0]);
    const A: V3 = [ank[0], ank[1] - ANKLE_H, ank[2]];
    const d = v3.sub(A, hip);
    const L = Math.min(v3.len(d), THIGH + SHIN - 0.5);
    const dn = v3.norm(d);
    const fwd: V3 = [Math.sin(fyaw), 0, -Math.cos(fyaw)];
    const side = v3.norm(v3.cross(dn, fwd));
    const kdir = v3.norm(v3.cross(side, dn));
    const a = (THIGH * THIGH - SHIN * SHIN + L * L) / (2 * L);
    const h = Math.sqrt(Math.max(0, THIGH * THIGH - a * a));
    // the knee bows toward the toes (kdir points to the front)
    const K = v3.add(v3.add(hip, v3.mul(dn, a)), v3.mul(kdir, -h));
    const K2 = v3.add(v3.add(hip, v3.mul(dn, a)), v3.mul(kdir, h));
    const knee = v3.dot(v3.sub(K, hip), fwd) > 0 ? K : K2;
    return { hip, knee, ank: v3.add(hip, v3.mul(dn, L)), foot: ank };
  };
  const legL = leg(1, q.footL, q.footYawL);
  const legR = leg(-1, q.footR, q.footYawR);
  const arm = (sgn: number, A: Arm) => {
    const s = shoulder(sgn);
    const e = v3.add(s, dirW(chestF, A.elbow));
    const w = v3.add(s, dirW(chestF, A.wrist));
    return { s, e, w, A };
  };
  return { root, hipF, chestF, torsoAt, neckBase, pivot, headF, legL, legR, armL: arm(1, q.armL), armR: arm(-1, q.armR), q };
};

// ---------------------------------------------------------------------------
// THE SURFACES
// ---------------------------------------------------------------------------
type Sec = { y: number; A: number; Bf: number; Bb: number; bc: number };
const secAt = (secs: Sec[], u: number): Sec => {
  const x = c01(u) * (secs.length - 1);
  const i = Math.min(secs.length - 2, Math.floor(x));
  const f = x - i;
  const s = f * f * (3 - 2 * f) * 0.5 + f * 0.5;
  const a = secs[i];
  const b = secs[i + 1];
  return { y: mix(a.y, b.y, f), A: mix(a.A, b.A, s), Bf: mix(a.Bf, b.Bf, s), Bb: mix(a.Bb, b.Bb, s), bc: mix(a.bc, b.bc, s) };
};
/** a superellipse-ish section point: phi 0 = front (b+), pi/2 = his left (a+) */
const secPt = (s: Sec, phi: number, ex = 2.4): [number, number] => {
  const sn = Math.sin(phi);
  const cs = Math.cos(phi);
  const k = 2 / ex;
  const a = Math.sign(sn) * Math.pow(Math.abs(sn), k) * s.A;
  const b = s.bc + Math.sign(cs) * Math.pow(Math.abs(cs), k) * (cs >= 0 ? s.Bf : s.Bb);
  return [a, b];
};
// the waistcoat body: from the hips to the collar (torso-local y from the hip root)
const CHEST: Sec[] = [
  { y: -16, A: 31.5, Bf: 18.5, Bb: 19, bc: -1 },
  { y: -38, A: 28.5, Bf: 17.5, Bb: 18, bc: -1 },
  { y: -60, A: 31, Bf: 19.5, Bb: 19, bc: 0 },
  { y: -80, A: 34, Bf: 20.5, Bb: 19.5, bc: 0.5 },
  { y: -94, A: 33, Bf: 18.5, Bb: 18.5, bc: 0 },
  { y: -102, A: 27, Bf: 14, Bb: 15, bc: -1 },
  { y: -107, A: 13, Bf: 10.5, Bb: 10.5, bc: -1.5 },
];
const PELVIS: Sec[] = [
  { y: 14, A: 22, Bf: 13, Bb: 15, bc: -1 },
  { y: 5, A: 30, Bf: 18, Bb: 20, bc: -1.5 },
  { y: -10, A: 31, Bf: 18, Bb: 19.5, bc: -1 },
  { y: -24, A: 29.5, Bf: 17.5, Bb: 18.5, bc: -1 },
];
export const chestSurf = (R: Rig): Surf => ({
  nu: 14,
  nphi: 40,
  at: (u, phi) => {
    const s = secAt(CHEST, u);
    const q = R.q;
    const sl = c01((u - 0.55) / 0.45);
    const [a, b] = secPt(s, phi, 2.3);
    return R.torsoAt(a, s.y + 4 * q.slump * sl, b + 6 * q.slump * sl * sl, mix(0.15, 1, u));
  },
});
export const pelvisSurf = (R: Rig): Surf => ({
  nu: 6,
  nphi: 36,
  at: (u, phi) => {
    const s = secAt(PELVIS, u);
    const [a, b] = secPt(s, phi, 2.3);
    return R.torsoAt(a, s.y, b, 0);
  },
});
/** the collar of the shirt round the neck's base */
export const collarSurf = (R: Rig): Surf => ({
  nu: 3,
  nphi: 28,
  at: (u, phi) => {
    const r = mix(11.5, 10.2, u);
    const F = R.chestF;
    const base = toW(F, [0, -104 + 4 * R.q.slump * 0.6 - u * 5.5, -1.5 + 6 * R.q.slump * 0.6]);
    return v3.add(base, dirW(F, [Math.sin(phi) * r, 0, Math.cos(phi) * r * 0.92]));
  },
});
/** the neck: rings from the collar up to the head pivot, each ring's yaw blended from the chest to the head */
export const neckSurf = (R: Rig): Surf => ({
  nu: 6,
  nphi: 28,
  at: (u, phi) => {
    const c = v3.mix(R.neckBase, R.pivot, u);
    const yaw = mix(R.q.chestYaw, R.q.headYaw, u * u);
    const F = frameOf(c, yaw, mix(R.q.lean, R.q.headPitch + R.q.lean * 0.5, u) + 10, mix(R.q.roll, R.q.headRoll, u));
    const r = mix(8.6, 7.6, u);
    return toW(F, [Math.sin(phi) * r, 0, Math.cos(phi) * r * 0.95 - 0.5]);
  },
});

// THE HEAD: head-local (a his left, y down, b his front), origin the head's centre; hy from the crown (-23) to the
// chin (+22). Rings with a front / back depth, plus the brow, nose, lips, chin and cheekbones as bumps on the front.
const HEADSEC: Sec[] = [
  { y: -23, A: 4, Bf: 4, Bb: 5, bc: -2.5 },
  { y: -20.5, A: 10.5, Bf: 10, Bb: 12.5, bc: -2.5 },
  { y: -16, A: 14, Bf: 13, Bb: 16.5, bc: -2.5 },
  { y: -10, A: 15.3, Bf: 14.2, Bb: 18, bc: -2.5 },
  { y: -4, A: 15.4, Bf: 14.6, Bb: 17.5, bc: -2.5 },
  { y: 2, A: 15, Bf: 14.2, Bb: 15.5, bc: -2.5 },
  { y: 7, A: 13.6, Bf: 13.8, Bb: 13.5, bc: -2 },
  { y: 12, A: 11.8, Bf: 13.6, Bb: 10.5, bc: -1.5 },
  { y: 16.5, A: 9.8, Bf: 12.8, Bb: 7.5, bc: -1.2 },
  { y: 19.5, A: 6.3, Bf: 11.8, Bb: 5.5, bc: -0.8 },
  { y: 21.6, A: 3.5, Bf: 9.6, Bb: 3, bc: 0 },
  { y: 22.3, A: 0.6, Bf: 6, Bb: 1, bc: 0.6 },
];
const HY0 = -23;
/** hy placed on the head table's (non-uniform) levels, 0..1 */
const headT = (hy: number) => {
  for (let i = 0; i < HEADSEC.length - 1; i++) if (hy <= HEADSEC[i + 1].y) return (i + c01((hy - HEADSEC[i].y) / (HEADSEC[i + 1].y - HEADSEC[i].y))) / (HEADSEC.length - 1);
  return 1;
};
const HY1 = 22.3;
const g1 = (x: number, s: number) => Math.exp(-(x * x) / (2 * s * s));
/** the outward bump of the face at (phi, hy) (world units) */
const faceBump = (phi: number, hy: number, mouth: number) => {
  const w = Math.atan2(Math.sin(phi), Math.cos(phi)); // -pi..pi, 0 = front
  if (Math.abs(w) > 1.4) return 0;
  let b = 0;
  // the brow ridge
  b += 1.3 * g1(hy + 6, 1.6) * g1(Math.abs(w) - 0.42, 0.32);
  // the eye sockets (a hollow under the brow)
  b -= 1.5 * g1(hy + 1.8, 1.8) * g1(Math.abs(w) - 0.43, 0.17);
  // the nose: a ridge from the bridge to the tip, then under it back to the lip
  const nose = hy < 5.5 ? mix(0.6, 6.6, c01((hy + 4) / 9.5)) * c01((hy + 6) / 2) : mix(6.6, 0, c01((hy - 5.5) / 2.6));
  b += nose * g1(w, 0.085 + 0.05 * c01((hy - 1) / 6));
  // the nostril wings
  b += 1.2 * g1(hy - 6, 1.2) * g1(Math.abs(w) - 0.16, 0.07);
  // the cheekbones and the gaunt hollow below them (he is infected: drawn thin)
  b += 1 * g1(hy - 1.5, 2) * g1(Math.abs(w) - 0.72, 0.2);
  b -= 1.3 * g1(hy - 9, 2.4) * g1(Math.abs(w) - 0.66, 0.18);
  // the lips (the lower lip drops with the jaw) and the chin
  b += 1.1 * g1(hy - 10.6, 1.1) * g1(w, 0.3);
  b += 0.9 * g1(hy - 13 - 2.2 * mouth, 1.1) * g1(w, 0.26);
  b += 1.6 * g1(hy - 19.5, 2) * g1(w, 0.3);
  return b;
};
/** the head's surface: u along the rings (0 crown .. 1 under the chin); the jaw hangs open with `mouth` */
export const headLocal = (u: number, phi: number, mouth: number): V3 => {
  const hy = mix(HY0, HY1, u);
  const s = secAt(HEADSEC, headT(hy));
  const [a, b] = secPt(s, phi, 2.15);
  const n = Math.hypot(a, b - s.bc) || 1;
  const bump = faceBump(phi, hy, mouth);
  // the slack jaw: the chin drops and the jaw swings down below the mouth line
  const jaw = mouth * 2.6 * c01((hy - 10.5) / 6) * c01(Math.cos(phi) + 0.2);
  return [a + (a / n) * bump, hy + jaw, b + ((b - s.bc) / n) * bump];
};
export const headSurf = (R: Rig): Surf => ({
  nu: 34,
  nphi: 56,
  at: (u, phi) => toW(R.headF, headLocal(u, phi, R.q.mouth)),
});
/** a point on the head by its hy (height) rather than u */
export const huOf = (hy: number) => (hy - HY0) / (HY1 - HY0);
/** the knitted cap: a shell over the skull from the crown to the rolled brim (low on the brow, over the ears' tops,
 *  just over the occiput at the back), the soft crown slouching back */
const brimHy = (phi: number) => {
  const w = Math.abs(Math.atan2(Math.sin(phi), Math.cos(phi)));
  return mix(-11.5, -2.5, Math.pow(w / Math.PI, 1.3));
};
export const capSurf = (R: Rig): Surf => ({
  nu: 14,
  nphi: 48,
  at: (u, phi) => {
    const hy = mix(HY0 + 0.3, brimHy(phi), Math.pow(u, 0.8));
    const l = headLocal(huOf(hy), phi, 0);
    const back = Math.max(0, -Math.cos(phi));
    const top = 1 - u;
    const n = Math.hypot(l[0], l[2] + 2.5) || 1;
    // the knit stands off the skull; the soft crown rises a little and slouches toward the back
    const grow = 1.6 + 1.3 * top * top * back;
    return toW(R.headF, [l[0] + (l[0] / n) * grow, l[1] - 2.6 * top * top + 2.2 * top * back, l[2] + ((l[2] + 2.5) / n) * grow - 3 * top * top * back]);
  },
});
/** the rolled brim: a band round the cap's lower edge */
export const brimSurf = (R: Rig): Surf => ({
  nu: 3,
  nphi: 48,
  at: (u, phi) => {
    const hy = brimHy(phi) - 4.6 * (1 - u);
    const l = headLocal(huOf(hy), phi, 0);
    const n = Math.hypot(l[0], l[2] + 2.5) || 1;
    const out = 2.5 + 0.8 * Math.sin(Math.PI * u);
    return toW(R.headF, [l[0] + (l[0] / n) * out, hy, l[2] + ((l[2] + 2.5) / n) * out]);
  },
});
/** an ear (sgn 1 = his left): its rim (head-local, standing out and back from the side of the head) and the inner
 *  curl, as 3D curves */
const earRim = (sgn: number, out: number): V3[] =>
  Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const hy = mix(1.5, 1.5, 0) - 6.2 * Math.cos(a);
    const w = mix(3.4, 2.4, c01((hy + 3) / 9));
    const b = -3 + w * Math.sin(a) - 2.2 * out;
    return [sgn * (14.6 + 2.2 * out * (0.6 + 0.4 * Math.sin(a + 1))), hy, b];
  });
const Ear: React.FC<{ V: View; R: Rig; sgn: number }> = ({ V, R, sgn }) => {
  const rim = earRim(sgn, 1).map((p) => proj(V, toW(R.headF, p)));
  const root = earRim(sgn, 0).map((p) => proj(V, toW(R.headF, p)));
  const hr = V.P.r(R.headF.o[2]);
  const shape = hull([...rim, ...root]);
  // the curl inside: visible when the ear's outer face turns to us
  const outN = dirW(R.headF, [sgn, 0, -0.3]);
  const facing = v3.dot(outN, v3.sub(V.cam, R.headF.o)) > 0;
  const inner = earRim(sgn, 0.75)
    .slice(1, 11)
    .map((p) => proj(V, toW(R.headF, [p[0], mix(p[1], 1.5, 0.35), mix(p[2], -4, 0.3)])));
  return (
    <g>
      <path d={polyD(shape)} fill={INK.skin.fill} stroke={DARK} strokeWidth={1.1 * hr} strokeLinejoin="round" />
      <path d={polyD(hull(rim.slice(3, 8).concat(root.slice(3, 8))))} fill={INK.skin.shade} opacity={0.55} />
      {facing ? <path d={`M${inner.map(pt).join("L")}`} fill="none" stroke={DARK} strokeWidth={0.8 * hr} strokeOpacity={0.6} /> : null}
    </g>
  );
};

/** a limb: a tube through joints with radii (circular sections, a cap at each end) */
export const tubeSurf = (pts: V3[], rad: number[], ref: V3, flat = 1, nphi = 18, capK = 1): Surf => {
  const segs: number[] = [0];
  for (let i = 1; i < pts.length; i++) segs.push(segs[i - 1] + v3.len(v3.sub(pts[i], pts[i - 1])));
  const L = segs[segs.length - 1] || 1;
  const capA = rad[0] * capK;
  const capB = rad[rad.length - 1] * capK;
  const total = capA + L + capB;
  const nu = Math.max(6, Math.ceil(total / 5)) + 6;
  return {
    nu,
    nphi,
    at: (u, phi) => {
      const s = u * total - capA;
      let c: V3;
      let t: V3;
      let r: number;
      if (s <= 0) {
        t = v3.norm(v3.sub(pts[1], pts[0]));
        const k = Math.sqrt(Math.max(0, 1 - (s / capA) ** 2));
        c = v3.add(pts[0], v3.mul(t, s));
        r = rad[0] * k;
      } else if (s >= L) {
        const n = pts.length;
        t = v3.norm(v3.sub(pts[n - 1], pts[n - 2]));
        const k = Math.sqrt(Math.max(0, 1 - ((s - L) / capB) ** 2));
        c = v3.add(pts[n - 1], v3.mul(t, s - L));
        r = rad[n - 1] * k;
      } else {
        let i = 1;
        while (i < segs.length - 1 && segs[i] < s) i++;
        const f = (s - segs[i - 1]) / Math.max(1e-6, segs[i] - segs[i - 1]);
        c = v3.mix(pts[i - 1], pts[i], f);
        t = v3.norm(v3.sub(pts[i], pts[i - 1]));
        // smooth the radius through the joints
        r = mix(rad[i - 1], rad[i], f * f * (3 - 2 * f));
        if (i < pts.length - 1 && f > 0.7) {
          const t2 = v3.norm(v3.sub(pts[i + 1], pts[i]));
          t = v3.norm(v3.mix(t, t2, (f - 0.7) / 0.6));
        }
        if (i > 1 && f < 0.3) {
          const t0 = v3.norm(v3.sub(pts[i - 1], pts[i - 2]));
          t = v3.norm(v3.mix(t, t0, (0.3 - f) / 0.6));
        }
      }
      let e1 = v3.cross(t, ref);
      if (v3.len(e1) < 1e-3) e1 = v3.cross(t, [1, 0, 0]);
      e1 = v3.norm(e1);
      const e2 = v3.norm(v3.cross(e1, t));
      return v3.add(c, v3.add(v3.mul(e1, Math.sin(phi) * r), v3.mul(e2, Math.cos(phi) * r * flat)));
    },
  };
};

// ---------------------------------------------------------------------------
// THE MAN
// ---------------------------------------------------------------------------
export type ManProps = {
  V: View;
  R: Rig;
  uid: string;
  /** fungus threads on the head and neck (t per thread) */
  threads?: { th: ThreadSpec; t: number }[];
  /** the threads on the neck / collar (before the head is drawn) */
  neckThreads?: { th: ThreadSpec; t: number }[];
  /** drawn behind the neck and body when its base is turned away, over the head when its base faces us */
  stalk?: React.ReactNode;
  stalkInFront?: boolean;
  /** the infected eye's glint 0..1 */
  eyeGlow?: number;
};
/** the hand: a palm and four fingers + a thumb, relaxed (hanging, curled) .. claw (spread, reaching, tips curled) */
const handParts = (R: Rig, side: "L" | "R") => {
  const ar = side === "L" ? R.armL : R.armR;
  const sgn = side === "L" ? 1 : -1;
  const A = ar.A;
  const C = R.chestF;
  const fore = v3.norm(v3.sub(ar.w, ar.e));
  const orth = (v: V3) => v3.norm(v3.sub(v, v3.mul(fore, v3.dot(v, fore))));
  // relaxed: the palm toward his thigh, the thumb forward; claw: the palm down, the thumb inward
  const pN0 = orth(v3.add(v3.mul(C.ax, -sgn * (1 - A.claw)), v3.mul(C.ay, A.claw)));
  const across = orth(v3.add(v3.mul(C.az, 1 - A.claw), v3.mul(C.ax, -sgn * A.claw)));
  // the wrist bends (+ = toward the back of the hand: the hand lifts; - = it droops toward the palm); (V2) the palm's
  // normal turns with it, so the fingers curl toward the palm at every bend
  const bd = (A.bend * Math.PI) / 180;
  const hdir = v3.norm(v3.add(v3.mul(fore, Math.cos(bd)), v3.mul(pN0, -Math.sin(bd))));
  const pN = v3.norm(v3.add(v3.mul(pN0, Math.cos(bd)), v3.mul(fore, Math.sin(bd))));
  const W = v3.add(ar.w, v3.mul(fore, 1.5));
  const knuck = v3.add(W, v3.mul(hdir, 15));
  const fingers: { pts: V3[]; rad: number[] }[] = [];
  for (let i = 0; i < 4; i++) {
    // index (i 0, next to the thumb) .. little finger (i 3)
    const off = (1.5 - i) * 3.6;
    const spread = (1.5 - i) * 0.28 * A.claw;
    const base = v3.add(knuck, v3.mul(across, off));
    const d0 = v3.norm(v3.add(hdir, v3.mul(across, spread)));
    const len = [10.5, 11.5, 11, 9][i];
    // the fingers curl toward the palm; the claw bends them harder at the tips
    const curl = mix(0.42, 0.3, A.claw) + 0.08 * hsh(i, 3) + 0.18 * A.claw * (i === 3 ? 1 : 0);
    const p1 = v3.add(base, v3.mul(d0, len * 0.5));
    const d1 = v3.norm(v3.add(v3.mul(d0, Math.cos(curl)), v3.mul(pN, Math.sin(curl))));
    const p2 = v3.add(p1, v3.mul(d1, len * 0.45));
    const d2 = v3.norm(v3.add(v3.mul(d1, Math.cos(curl * (1 + 0.8 * A.claw))), v3.mul(pN, Math.sin(curl * (1 + 0.8 * A.claw)))));
    const p3 = v3.add(p2, v3.mul(d2, len * 0.35));
    fingers.push({ pts: [v3.add(base, v3.mul(d0, -3)), p1, p2, p3], rad: [2.05, 1.8, 1.55, 1.25] });
  }
  const tb = v3.add(W, v3.add(v3.mul(hdir, 4.5), v3.mul(across, 5.5)));
  const td = v3.norm(v3.add(v3.add(hdir, v3.mul(across, 0.7)), v3.mul(pN, 0.45)));
  const t1 = v3.add(tb, v3.mul(td, 6.5));
  const t2 = v3.add(t1, v3.mul(v3.norm(v3.add(hdir, v3.mul(pN, 0.7))), 5.5));
  return { palm: { pts: [W, v3.add(W, v3.mul(hdir, 8)), knuck], rad: [4.4, 6.0, 5.7] }, fingers, thumb: { pts: [tb, t1, t2], rad: [3, 2.4, 2] }, ref: pN, across, hdir, knuck };
};
const handEls = (V: View, R: Rig, side: "L" | "R", uid: string) => {
  const h = handParts(R, side);
  const ink = INK.skin;
  // the palm's across axis is the flat one: flatten it so the hand is a hand, not a club
  const palm = tubeSurf(h.palm.pts, h.palm.rad, h.ref, 0.48, 16);
  const camD = (p: V3) => v3.len(v3.sub(V.cam, p));
  const items = [
    ...h.fingers.map((f, i) => ({ key: `f${i}`, d: camD(f.pts[2]), el: <Part key={`f${i}`} V={V} S={tubeSurf(f.pts, f.rad, h.ref, 1, 10)} o={{ uid: `${uid}-f${i}`, ink, casing: 1.1, flat: true }} /> })),
    { key: "th", d: camD(h.thumb.pts[1]), el: <Part key="th" V={V} S={tubeSurf(h.thumb.pts, h.thumb.rad, h.ref, 1, 12)} o={{ uid: `${uid}-th`, ink, casing: 1.15 }} /> },
  ].sort((a, b) => b.d - a.d);
  return (
    <g>
      <Part V={V} S={palm} o={{ uid: `${uid}-pm`, ink, casing: 1.25 }} />
      {items.map((it) => it.el)}
    </g>
  );
};
const shoeSurf = (R: Rig, side: "L" | "R"): Surf => {
  const q = R.q;
  const ank = side === "L" ? q.footL : q.footR;
  const yaw = side === "L" ? q.footYawL : q.footYawR;
  const heel = ((side === "L" ? q.heelL : q.heelR) * Math.PI) / 180;
  const fwd: V3 = [Math.sin(yaw), 0, -Math.cos(yaw)];
  const lat: V3 = [Math.cos(yaw), 0, Math.sin(yaw)];
  // the sole pivots on the toe when the heel lifts
  const toe = v3.add([ank[0], ank[1], ank[2]], v3.mul(fwd, 24));
  const along = (s: number): V3 => {
    // s from -9 (heel) to 24 (toe), at sole level
    const d = 24 - s;
    return [toe[0] - fwd[0] * d * Math.cos(heel), toe[1] - d * Math.sin(heel), toe[2] - fwd[2] * d * Math.cos(heel)];
  };
  return {
    nu: 12,
    nphi: 20,
    at: (u, phi) => {
      const s = mix(-9.5, 25, u);
      const c = along(s);
      const w = 5.6 * Math.sqrt(Math.max(0.05, 1 - Math.pow((s - 6) / 20, 4)));
      const h = mix(9.5, 4, c01((s - 2) / 20)) * Math.sqrt(Math.max(0.04, 1 - Math.pow((s - 7) / 19, 6)));
      const sn = Math.sin(phi);
      const cs = Math.cos(phi);
      const yy = -h * 0.5 * (1 + cs) * (cs > 0 ? 1 : 0.15) + (cs < 0 ? 0 : 0);
      return v3.add(c, v3.add(v3.mul(lat, sn * w), [0, yy - 0.2, 0]));
    },
  };
};

export const Man: React.FC<ManProps> = ({ V, R, uid, threads = [], neckThreads = [], stalk, stalkInFront = false, eyeGlow = 1 }) => {
  const q = R.q;
  const camZ = (p: V3) => v3.len(v3.sub(V.cam, p));
  // ---- legs ----
  const legEl = (side: "L" | "R") => {
    const lg = side === "L" ? R.legL : R.legR;
    const sgn = side === "L" ? 1 : -1;
    const ref = R.hipF.ax;
    const thigh = tubeSurf([lg.hip, v3.mix(lg.hip, lg.knee, 0.5), lg.knee, v3.mix(lg.knee, lg.ank, 0.08)], [15.5, 13.5, 10.5, 9.6], ref);
    const shin = tubeSurf([v3.mix(lg.knee, lg.ank, 0.06), v3.mix(lg.knee, lg.ank, 0.32), v3.mix(lg.knee, lg.ank, 0.8), lg.ank], [9.4, 9.8, 6.4, 6], ref);
    const band = tubeSurf([v3.mix(lg.knee, lg.ank, 0.02), v3.mix(lg.knee, lg.ank, 0.15)], [10.4, 10.2], ref, 1, 16, 0.25);
    void sgn;
    return (
      <g key={side}>
        <Part V={V} S={shin} o={{ uid: `${uid}-sh${side}`, ink: INK.stocking }}>
          <path d={[0.3, 0.45, 0.6].map((u) => curveD(V, shin, Array.from({ length: 9 }, (_, i) => [u, 0.4 + (i / 8) * 2.2] as [number, number]), 0.1)).join("")} fill="none" stroke={DARK} strokeWidth={0.6 * V.P.r(lg.knee[2])} strokeOpacity={0.3} />
        </Part>
        <Part V={V} S={shoeSurf(R, side)} o={{ uid: `${uid}-so${side}`, ink: INK.shoe, casing: 1.6 }} />
        <Part V={V} S={thigh} o={{ uid: `${uid}-tg${side}`, ink: INK.breeches }} />
        <Part V={V} S={band} o={{ uid: `${uid}-ga${side}`, ink: INK.breeches, casing: 1.3 }} />
      </g>
    );
  };
  // ---- arms (shirt sleeve rolled to the elbow, bare forearm, hand) ----
  const armEl = (side: "L" | "R") => {
    const ar = side === "L" ? R.armL : R.armR;
    const ref = R.chestF.az;
    const sleeve = tubeSurf([v3.add(ar.s, dirW(R.chestF, [0, -3, 0])), v3.mix(ar.s, ar.e, 0.45), v3.mix(ar.s, ar.e, 0.92)], [9.6, 9, 8.4], ref);
    const roll = tubeSurf([v3.mix(ar.s, ar.e, 0.9), v3.mix(ar.e, ar.w, 0.12)], [8.8, 8.3], ref, 1, 16, 0.3);
    const fore = tubeSurf([v3.mix(ar.e, ar.w, 0.05), v3.mix(ar.e, ar.w, 0.4), ar.w], [6.8, 6.4, 4.6], ref);
    return (
      <g key={side}>
        <Part V={V} S={fore} o={{ uid: `${uid}-fa${side}`, ink: INK.skin }} />
        {handEls(V, R, side, `${uid}-h${side}`)}
        <Part V={V} S={sleeve} o={{ uid: `${uid}-sl${side}`, ink: INK.linen }}>
          {/* two soft folds down the full sleeve */}
          <path d={[0.9, 2.4].map((ph) => curveD(V, sleeve, Array.from({ length: 7 }, (_, j) => [0.3 + (j / 6) * 0.45, ph + 0.25 * Math.sin(j * 0.9)] as [number, number]), 0.1)).join("")} fill="none" stroke={DARK} strokeWidth={0.7 * V.P.r(ar.e[2])} strokeOpacity={0.35} />
        </Part>
        <Part V={V} S={roll} o={{ uid: `${uid}-ro${side}`, ink: INK.linen, casing: 1.5 }} />
      </g>
    );
  };
  // ---- the torso ----
  const pelvis = pelvisSurf(R);
  const chest = chestSurf(R);
  const r0 = V.P.r(R.root[2]);
  const lw = (w: number) => w * r0;
  // the leather apron's bib on the chest (on its surface) and its straps
  const bibIn = (u: number, ph: number) => Math.abs(Math.atan2(Math.sin(ph), Math.cos(ph))) < mix(0.62, 0.4, c01(u / 0.66)) && u < 0.66;
  const bibD = patchD(V, chest, 0, 0.66, -0.66, 0.66, 10, 14, bibIn);
  const bibEdge = [-1, 1].map((sg) => curveD(V, chest, Array.from({ length: 8 }, (_, i) => [(i / 7) * 0.66, sg * mix(0.62, 0.4, i / 7)] as [number, number]), 0.3)).join("") + curveD(V, chest, Array.from({ length: 9 }, (_, i) => [0.66, -0.4 + (i / 8) * 0.8] as [number, number]), 0.3);
  const strapD = [-1, 1].map((sg) => curveD(V, chest, Array.from({ length: 6 }, (_, i) => [0.66 + (i / 5) * 0.33, sg * mix(0.36, 0.55, i / 5)] as [number, number]), 0.3)).join("");
  const chestDetails = (
    <g fill="none" stroke={DARK} strokeLinecap="round">
      {/* the back: the centre seam, the strap and buckle at the waist, the apron's ties in a bow */}
      <path d={curveD(V, chest, Array.from({ length: 12 }, (_, i) => [0.02 + (i / 11) * 0.84, Math.PI] as [number, number]), 0.2)} strokeWidth={lw(1.1)} strokeOpacity={0.6} />
      <path d={curveD(V, chest, Array.from({ length: 14 }, (_, i) => [0.18, Math.PI - 0.62 + (i / 13) * 1.24] as [number, number]), 0.3)} strokeWidth={lw(3.6)} strokeOpacity={0.55} />
      {(() => {
        const bk = visAt(V, chest, 0.18, Math.PI);
        if (!bk.vis) return null;
        return <rect x={bk.q[0] - lw(3)} y={bk.q[1] - lw(2.6)} width={lw(6)} height={lw(5.2)} rx={lw(0.8)} fill="none" stroke="#B9A57D" strokeWidth={lw(1.1)} />;
      })()}
      {/* the apron's bib and its straps (on the chest's surface) */}
      <path d={bibD} fill={INK.apron.fill} stroke={INK.apron.fill} strokeWidth={lw(0.4)} />
      <path d={bibEdge} strokeWidth={lw(1.5)} strokeOpacity={0.85} />
      <path d={strapD} stroke={INK.apron.fill} strokeWidth={lw(2.4)} />
      <path d={strapD} strokeWidth={lw(0.6)} strokeOpacity={0.7} />
      {/* the front: the opening down the middle, its buttons; the shirt in the V at the neck; the armholes */}
      <path d={curveD(V, chest, Array.from({ length: 10 }, (_, i) => [0.02 + (i / 9) * 0.62, 0.02] as [number, number]), 0.2)} strokeWidth={lw(1.4)} strokeOpacity={0.8} />
      <path d={patchD(V, chest, 0.62, 1, -0.55, 0.55, 6, 10, (u, ph) => Math.abs(Math.atan2(Math.sin(ph), Math.cos(ph))) < 0.04 + (u - 0.7) * 0.9)} fill={INK.linen.fill} stroke="none" />
      {[0.12, 0.22, 0.32, 0.42, 0.52, 0.6].map((u) => {
        const a = visAt(V, chest, u, 0.09);
        if (!a.vis) return null;
        return <circle key={u} cx={a.q[0]} cy={a.q[1]} r={lw(1.5)} fill={INK.linen.fill} stroke={DARK} strokeWidth={lw(0.6)} />;
      })}
      <path d={[1, -1].map((sg) => curveD(V, chest, Array.from({ length: 9 }, (_, i) => [0.62 + (i / 8) * 0.3, sg * (Math.PI / 2 + 0.25 * Math.sin((i / 8) * Math.PI))] as [number, number]), 0.2)).join("")} strokeWidth={lw(1)} strokeOpacity={0.55} />
    </g>
  );
  // ---- the head ----
  const head = headSurf(R);
  const cap = capSurf(R);
  const brim = brimSurf(R);
  const neck = neckSurf(R);
  const collar = collarSurf(R);
  const hr = V.P.r(R.headF.o[2]);
  const hw = (w: number) => w * hr;
  const P = Math.PI;
  const H = (hy: number) => huOf(hy);
  // the face's features as (u, phi) curves; phi + = his left
  const eye = (sg: number) => {
    const c = sg * 0.43;
    const lid = c01(q.lids);
    const upper: [number, number][] = Array.from({ length: 9 }, (_, i) => {
      const x = (i / 8) * 2 - 1;
      return [H(-1.9 - 1.8 * Math.sqrt(1 - x * x) * (1 - 0.5 * lid) + 0.4 * x * sg), c + x * 0.21];
    });
    const lower: [number, number][] = Array.from({ length: 9 }, (_, i) => {
      const x = (i / 8) * 2 - 1;
      return [H(-1.7 + 1.3 * Math.sqrt(1 - x * x)), c + x * 0.21];
    });
    const iris: [number, number][] = Array.from({ length: 13 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return [H(-1.6 + 1.45 * Math.sin(a)), c - sg * 0.02 + 0.1 * Math.cos(a)];
    });
    return { upper, lower, iris, c };
  };
  const eyes = [1, -1].map(eye);
  const featureD = (pts: [number, number][], lift = 0.15) => curveD(V, head, pts, lift);
  const near = Math.sin(q.headYaw) <= 0 ? 1 : -1; // his near eye: his left when he faces screen left
  const glow = c01(eyeGlow);
  const faceEl = (
    <g fill="none" stroke={DARK} strokeLinecap="round" strokeLinejoin="round">
      {/* the hollow sockets: a shade from the brow down round each eye */}
      {[1, -1].map((sg) => (
        <path key={`sk${sg}`} d={patchD(V, head, H(-5.6), H(1.6), sg * 0.43 - 0.27, sg * 0.43 + 0.27, 7, 9, (u, ph) => Math.pow((ph - sg * 0.43) / 0.27, 2) + Math.pow((mix(HY0, HY1, u) + 1.9) / 3.7, 2) < 1)} fill={INK.skin.hatch} stroke="none" opacity={0.42} />
      ))}
      {/* the sunken cheeks under the cheekbones */}
      {[1, -1].map((sg) => (
        <path key={`ck${sg}`} d={patchD(V, head, H(5), H(12.5), sg * 0.5, sg * 0.86, 6, 6, (u, ph) => Math.pow((ph - sg * 0.68) / 0.18, 2) + Math.pow((mix(HY0, HY1, u) - 8.6) / 3.6, 2) < 1)} fill={INK.skin.shade} stroke="none" opacity={0.85} />
      ))}
      {/* the eyes: the white (cream), the iris (orange: infected), the pupil, the lids */}
      {eyes.map((e, i) => {
        const sg = i === 0 ? 1 : -1;
        const white = featureD([...e.upper, ...e.lower.slice().reverse()]);
        const irisD = featureD(e.iris, 0.25);
        const orange = sg === near ? 1 : 0.75;
        const ctr = visAt(V, head, H(-1.6), e.c - sg * 0.02);
        return (
          <g key={i}>
            <clipPath id={`${uid}-ey${i}`}>
              <path d={white ? `${white}Z` : ""} />
            </clipPath>
            <path d={white ? `${white}Z` : ""} fill="#DCCFAE" stroke="none" />
            <g clipPath={`url(#${uid}-ey${i})`}>
              <path d={irisD ? `${irisD}Z` : ""} fill={orange > 0.9 ? FUNGUS.main : FUNGUS.deep} stroke={DARK} strokeWidth={hw(0.5)} />
              {ctr.vis ? <circle cx={ctr.q[0]} cy={ctr.q[1]} r={hw(0.55)} fill={DARK} stroke="none" /> : null}
              {ctr.vis && sg === near ? <circle cx={ctr.q[0] - hw(0.55)} cy={ctr.q[1] - hw(0.55)} r={hw(0.42) * (0.6 + 0.4 * glow)} fill={FUNGUS.hi} stroke="none" /> : null}
              {/* the upper lid's shadow on the eye */}
              <path d={featureD(e.upper)} stroke={DARK} strokeWidth={hw(1.6)} strokeOpacity={0.45} />
            </g>
            <path d={featureD(e.upper)} strokeWidth={hw(1.05)} />
            <path d={featureD(e.lower)} strokeWidth={hw(0.55)} strokeOpacity={0.6} />
            {/* the heavy lid crease and the dark under the eye */}
            <path d={featureD(e.upper.map(([u, p]) => [u - 0.04, p * 1.02] as [number, number]))} strokeWidth={hw(0.55)} strokeOpacity={0.5} />
            <path d={featureD(e.lower.map(([u, p]) => [u + 0.045, p] as [number, number]).slice(1, -1))} strokeWidth={hw(0.6)} strokeOpacity={0.35} />
          </g>
        );
      })}
      {/* the brows */}
      {[1, -1].map((sg) => (
        <path key={sg} d={featureD(Array.from({ length: 9 }, (_, i) => [H(-4.4 - 1.9 * (i / 8) + 0.5 * Math.sin((i / 8) * Math.PI) * 0 + 0.9 * Math.pow(i / 8, 3)), sg * (0.14 + (i / 8) * 0.52)] as [number, number]), 0.3)} strokeWidth={hw(2)} strokeOpacity={0.9} />
      ))}
      {/* the nose: its shaded side (a flat tone), the shadow under the tip */}
      <path d={patchD(V, head, H(-3), H(6.4), 0.0, 0.2, 8, 4)} fill={INK.skin.shade} stroke="none" opacity={1} />
      <path d={patchD(V, head, H(6.4), H(8.4), -0.16, 0.12, 3, 6)} fill={INK.skin.hatch} stroke="none" opacity={0.35} />
      {/* the nose: the shaded side of the bridge, the nostrils, the wing */}
      <path d={featureD(Array.from({ length: 8 }, (_, i) => [H(-3 + i * 1.15), -near * (0.1 + 0.02 * i)] as [number, number]), 0.1)} strokeWidth={hw(0.7)} strokeOpacity={0.5} />
      {[1, -1].map((sg) => (
        <path key={sg} d={featureD([[H(5.6), sg * 0.09], [H(6.7), sg * 0.13], [H(6.6), sg * 0.2], [H(5.4), sg * 0.23]], 0.25)} strokeWidth={hw(0.8)} strokeOpacity={0.75} />
      ))}
      {/* the slack mouth: a dark opening between the lips */}
      <path
        d={(() => {
          const up = featureD(Array.from({ length: 11 }, (_, i) => [H(11.2 + 0.45 * Math.pow(Math.abs(i / 10 - 0.5) * 2, 2) - 0.2 * Math.sin((i / 10) * Math.PI)), -0.33 + (i / 10) * 0.66] as [number, number]), 0.2);
          const lo = featureD(Array.from({ length: 11 }, (_, i) => [H(11.9 + (0.3 + q.mouth * 3.2) * Math.pow(Math.sin((i / 10) * Math.PI), 0.7)), 0.33 - (i / 10) * 0.66] as [number, number]), 0.2);
          return up && lo ? `${up}${lo.replace("M", "L")}Z` : "";
        })()}
        fill="#2B2119"
        strokeWidth={hw(0.8)}
      />
      {/* the folds from the nose to the mouth, the hollow cheeks, the jaw */}
      {[1, -1].map((sg) => (
        <path key={sg} d={featureD([[H(5.5), sg * 0.27], [H(8.5), sg * 0.36], [H(12), sg * 0.39]], 0.2)} strokeWidth={hw(0.75)} strokeOpacity={0.5} />
      ))}
      <path d={featureD(Array.from({ length: 10 }, (_, i) => [H(13 + 0.4 * i), near * (0.95 - i * 0.075)] as [number, number]), 0.2)} strokeWidth={hw(0.7)} strokeOpacity={0.4} />
      {/* the chin's underside */}
      <path d={featureD(Array.from({ length: 9 }, (_, i) => [H(19.8), -0.4 + (i / 8) * 0.8] as [number, number]), 0.2)} strokeWidth={hw(0.6)} strokeOpacity={0.35} />
    </g>
  );
  // the cropped hair at the nape and the temples (under the cap)
  const nape = { d: "" };
  const hairD = (() => {
    let d = "";
    const col = (ph: number): [number, number] | null => {
      const w = Math.abs(Math.atan2(Math.sin(ph), Math.cos(ph)));
      const top = brimHy(ph) - 1.4;
      // the hairline: the temples in front of the ears, over the ear at the side, low at the nape
      const bot = w < P / 2 - 0.02 ? -3.8 + 1.5 * c01((w - (P / 2 - 0.36)) / 0.3) : mix(-4.5, 16.5, sm01((w - P / 2 - 0.08) / 0.7)) - 1.2 * Math.cos((w - P) * 3) * c01((w - P / 2 - 0.6) / 0.3);
      if (w < P / 2 - 0.36 || bot <= top + 0.2) return null;
      return [top, bot];
    };
    const N = 44;
    const p0 = P / 2 - 0.36;
    const p1 = P * 1.5 + 0.36;
    for (let j = 0; j < N; j++) {
      const pa = mix(p0, p1, j / N);
      const pb = mix(p0, p1, (j + 1) / N);
      const ca = col(pa);
      const cb = col(pb);
      if (!ca || !cb) continue;
      const K = 9;
      for (let k = 0; k < K; k++) {
        const ya0 = mix(ca[0], ca[1], k / K);
        const ya1 = mix(ca[0], ca[1], (k + 1) / K);
        const yb0 = mix(cb[0], cb[1], k / K);
        const yb1 = mix(cb[0], cb[1], (k + 1) / K);
        const c = [visAt(V, head, H(ya0), pa), visAt(V, head, H(yb0), pb), visAt(V, head, H(yb1), pb), visAt(V, head, H(ya1), pa)];
        if (c.some((x) => !x.vis)) continue;
        d += `M${c.map((x) => pt(x.q)).join("L")}Z`;
      }
      // below the hairline at the back: the nape and the jaw's back, in the head's shadow
      const wa = Math.abs(Math.atan2(Math.sin(pa), Math.cos(pa)));
      if (wa > P / 2 + 0.1) {
        for (let k = 0; k < 4; k++) {
          const y0a = mix(ca[1], HY1, k / 4);
          const y1a = mix(ca[1], HY1, (k + 1) / 4);
          const y0b = mix(cb[1], HY1, k / 4);
          const y1b = mix(cb[1], HY1, (k + 1) / 4);
          const c = [visAt(V, head, H(y0a), pa), visAt(V, head, H(y0b), pb), visAt(V, head, H(y1b), pb), visAt(V, head, H(y1a), pa)];
          if (c.some((x) => !x.vis)) continue;
          nape.d += `M${c.map((x) => pt(x.q)).join("L")}Z`;
        }
      }
    }
    return d;
  })();
  // the threads
  const ribsD = Array.from({ length: 40 }, (_, i) => curveD(V, brim, [[0.05, (i / 40) * P * 2], [0.95, (i / 40) * P * 2]], 0.15)).join("");
  const capRowsD = [0.35, 0.6, 0.82].map((u) => curveD(V, cap, Array.from({ length: 33 }, (_, j) => [u, (j / 32) * P * 2] as [number, number]), 0.1)).join("");
  // an ear is drawn over the head unless it is turned well away from us (at the back view both show at the sides)
  const earFront = (sg: number) => v3.dot(v3.norm(dirW(R.headF, [sg, 0, -0.35])), v3.norm(v3.sub(V.cam, R.headF.o))) > -0.3;
  const headEl = (
    <g>
      {[1, -1].map((sg) => (!earFront(sg) ? <Ear key={sg} V={V} R={R} sgn={sg} /> : null))}
      <Part V={V} S={head} o={{ uid: `${uid}-hd`, ink: INK.skin, casing: 1.3 }}>
        <path d={nape.d} fill="#A08F6C" stroke="#A08F6C" strokeWidth={hw(0.35)} strokeLinejoin="round" />
        <path d={hairD} fill={INK.hair} stroke={INK.hair} strokeWidth={hw(0.35)} strokeLinejoin="round" />
        {faceEl}
      </Part>
      {[1, -1].map((sg) => (earFront(sg) ? <Ear key={sg} V={V} R={R} sgn={sg} /> : null))}
      {threads.map((t, i) => (
        <SurfaceThreads key={i} V={V} th={t.th} t={t.t} />
      ))}
      <Part V={V} S={cap} o={{ uid: `${uid}-cp`, ink: INK.cap, casing: 1.35 }}>
        <path d={capRowsD} fill="none" stroke={DARK} strokeWidth={hw(0.6)} strokeOpacity={0.4} />
      </Part>
      <Part V={V} S={brim} o={{ uid: `${uid}-br`, ink: { ...INK.cap, fill: "#958465" }, casing: 1.5 }}>
        <path d={ribsD} fill="none" stroke={DARK} strokeWidth={hw(0.55)} strokeOpacity={0.5} />
      </Part>
    </g>
  );
  // ---- painter's order ----
  const legs = (["L", "R"] as const).map((s) => ({ s, z: camZ((s === "L" ? R.legL : R.legR).knee) })).sort((a, b) => b.z - a.z);
  const arms = (["L", "R"] as const).map((s) => {
    const ar = s === "L" ? R.armL : R.armR;
    return { s, z: camZ(v3.mix(ar.s, ar.e, 0.5)), zh: camZ(ar.w) };
  });
  const chestC = camZ(R.torsoAt(0, -60, 0, 0.6));
  const headC = camZ(R.headF.o);
  const farArms = arms.filter((a) => a.z > chestC);
  const nearArms = arms.filter((a) => a.z <= chestC);
  const armBeforeHead = nearArms.filter((a) => a.zh > headC - 6);
  const armAfterHead = nearArms.filter((a) => a.zh <= headC - 6);
  return (
    <g>
      {farArms.map((a) => armEl(a.s))}
      {legs.map((l) => legEl(l.s))}
      <Part V={V} S={pelvis} o={{ uid: `${uid}-pv`, ink: INK.breeches }} />
      {!stalkInFront ? stalk : null}
      <Part V={V} S={neck} o={{ uid: `${uid}-nk`, ink: INK.skin }}>
        <path d={patchD(V, neck, 0.45, 1, 0, Math.PI * 2, 6, 28)} fill={INK.skin.shade} opacity={0.75} />
      </Part>
      <Part V={V} S={chest} o={{ uid: `${uid}-ch`, ink: INK.waistcoat }}>
        {chestDetails}
      </Part>
      <Part V={V} S={collar} o={{ uid: `${uid}-co`, ink: INK.linen, casing: 1.5 }} />
      {neckThreads.map((t, i) => (
        <SurfaceThreads key={i} V={V} th={t.th} t={t.t} />
      ))}
      {armBeforeHead.map((a) => armEl(a.s))}
      {headEl}
      {stalkInFront ? stalk : null}
      {armAfterHead.map((a) => armEl(a.s))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// (r1) A FREE ARM for the cast: a shirt sleeve rolled to the elbow, the bare forearm and the hand, between 3D joints
// (shoulder, elbow, wrist, world), oriented by the chest frame C; `dim` sinks the inks toward the night (0 = lit).
// Used for the two-arm reach in front of londonCastV2's Worker (whose own arms are masked out).
// ---------------------------------------------------------------------------
const sinkInk = (i: Inks, d: number): Inks => {
  const m = (a: string, b: string) => {
    const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
    const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
    return `#${pa.map((v, k) => Math.round(v + (pb[k] - v) * c01(d)).toString(16).padStart(2, "0")).join("")}`;
  };
  return { fill: m(i.fill, "#3A3026"), shade: m(i.shade, "#2A231B"), hatch: m(i.hatch, "#120E0A") };
};
export const FreeArm: React.FC<{ V: View; C: Frame; sgn: 1 | -1; s: V3; e: V3; w: V3; claw: number; bend: number; uid: string; dim?: number; linen?: Inks; skin?: Inks }> = ({ V, C, sgn, s, e, w, claw, bend, uid, dim = 0, linen = INK.linen, skin = INK.skin }) => {
  const R = { armL: { s, e, w, A: { elbow: [0, 0, 0] as V3, wrist: [0, 0, 0] as V3, claw, bend } }, armR: { s, e, w, A: { elbow: [0, 0, 0] as V3, wrist: [0, 0, 0] as V3, claw, bend } }, chestF: C } as unknown as Rig;
  const side: "L" | "R" = sgn === 1 ? "L" : "R";
  // (V2) the tubes' section frame is taken from his lateral axis: the arm hangs (down) or reaches (forward), both
  // square to it, so the frame (and every line on the sleeve) never spins or flips as the arm comes up
  const ref = C.ax;
  const li = dim > 0 ? sinkInk(linen, dim) : linen;
  const sk = dim > 0 ? sinkInk(skin, dim) : skin;
  const sleeve = tubeSurf([v3.add(s, dirW(C, [0, 1, 0])), v3.mix(s, e, 0.45), v3.mix(s, e, 0.92)], [9.6, 9.2, 8.7], ref);
  const roll = tubeSurf([v3.mix(s, e, 0.9), v3.mix(e, w, 0.12)], [9.1, 8.6], ref, 1, 16, 0.3);
  const fore = tubeSurf([v3.mix(e, w, 0.05), v3.mix(e, w, 0.4), w], [7, 6.6, 4.8], ref);
  const h = handParts(R, side);
  const palm = tubeSurf(h.palm.pts, h.palm.rad, h.ref, 0.5, 16);
  const camD = (p: V3) => v3.len(v3.sub(V.cam, p));
  const rh = V.P.r(w[2]);
  // the hand's parts in depth order (the palm among them): fingers curled under the palm go behind it
  const palmC = v3.mix(h.palm.pts[0], h.palm.pts[2], 0.55);
  const backSeen = v3.dot(v3.mul(h.ref, -1), v3.sub(V.cam, palmC)) > 0;
  const crease = (pts: V3[], k: number) => {
    // a short line across a finger at a joint (the cast's line manner)
    const c = pts[k];
    const d = v3.norm(v3.sub(pts[k + 1], pts[k - 1]));
    const x = v3.norm(v3.cross(d, h.ref));
    const a2 = V.P.p(...(v3.add(c, v3.mul(x, 1.5)) as [number, number, number]));
    const b2 = V.P.p(...(v3.add(c, v3.mul(x, -1.5)) as [number, number, number]));
    return `M${pt(a2)}L${pt(b2)}`;
  };
  const items = [
    { d: camD(palmC) + 0.01, el: <Part key="pm" V={V} S={palm} o={{ uid: `${uid}-pm`, ink: sk, casing: 1.15 }} /> },
    ...h.fingers.map((f, i) => ({
      d: camD(f.pts[1]),
      el: (
        <g key={`f${i}`}>
          <Part V={V} S={tubeSurf(f.pts, f.rad, h.ref, 1, 10)} o={{ uid: `${uid}-f${i}`, ink: sk, casing: 1.0 }} />
          <path d={crease(f.pts, 1) + crease(f.pts, 2)} fill="none" stroke={DARK} strokeWidth={0.55 * rh} strokeOpacity={0.55} strokeLinecap="round" />
        </g>
      ),
    })),
    { d: camD(h.thumb.pts[1]), el: <Part key="th" V={V} S={tubeSurf(h.thumb.pts, h.thumb.rad, h.ref, 1, 12)} o={{ uid: `${uid}-th`, ink: sk, casing: 1.05 }} /> },
  ].sort((a, b) => b.d - a.d);
  // the knuckles: a row of small arcs over the finger roots on the back of the hand, when it faces us
  const knD = backSeen
    ? h.fingers
        .map((f) => {
          const c = v3.add(f.pts[0], v3.mul(h.ref, -1.6));
          const q0 = V.P.p(...(v3.add(c, v3.mul(h.across, 1.5)) as [number, number, number]));
          const q1 = V.P.p(...(v3.add(c, v3.mul(h.hdir, 1.0)) as [number, number, number]));
          const q2 = V.P.p(...(v3.add(c, v3.mul(h.across, -1.5)) as [number, number, number]));
          return `M${pt(q0)}Q${pt(q1)} ${pt(q2)}`;
        })
        .join("")
    : "";
  const handNear = camD(w) < camD(e);
  const handEl = (
    <g>
      {items.map((it) => it.el)}
      {knD ? <path d={knD} fill="none" stroke={DARK} strokeWidth={0.6 * rh} strokeOpacity={0.6} strokeLinecap="round" /> : null}
    </g>
  );
  const foreEl = <Part V={V} S={fore} o={{ uid: `${uid}-fa`, ink: sk, casing: 1.2 }} />;
  const upperEl = (
    <g>
      <Part V={V} S={sleeve} o={{ uid: `${uid}-sl`, ink: li, casing: 1.25 }}>
        <path d={[0.9, 2.4].map((ph) => curveD(V, sleeve, Array.from({ length: 7 }, (_, j) => [0.3 + (j / 6) * 0.45, ph + 0.18 * Math.sin(j * 0.9)] as [number, number]), 0.1)).join("")} fill="none" stroke={DARK} strokeWidth={0.7 * V.P.r(e[2])} strokeOpacity={0.3} />
      </Part>
      <Part V={V} S={roll} o={{ uid: `${uid}-ro`, ink: li, casing: 1.15 }} />
    </g>
  );
  // reaching at us: the upper arm is farthest, then the forearm, then the hand; hanging: the hand, forearm, sleeve
  return handNear ? (
    <g>
      {upperEl}
      {foreEl}
      {handEl}
    </g>
  ) : (
    <g>
      {handEl}
      {foreEl}
      {upperEl}
    </g>
  );
};
