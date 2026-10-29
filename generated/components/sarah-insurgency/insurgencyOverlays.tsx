// ---------------------------------------------------------------------------
// insurgencyOverlays: what is DRAWN ON the map floor in SVG through the clip's one projection (so it lies on the
// WebGL ground and stays locked to it): GroundLabel (IM Fell English SC lying on the ground in perspective, the
// RodentFromCentralAsia "CENTRAL ASIA" treatment; Libre Caslon for figures), GroundLine (railways, routes, dashed
// lines, as world-space ribbons that thin with distance and fog by their own distance), CityDot (a town's dot on the
// ground) and SoftPatch (a soft-edged region lying on the ground: the guerrilla base areas). Draw them inside
// WorldLayer, BEFORE the standing pieces. The API is in insurgencyShared.tsx's header.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, interpolate } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { AIR } from "../kits/dwarkesh-3d/dwarkesh3d";
import { toScreen, type P2, type V3 } from "./insurgencyCamera";
import type { InsWorld } from "./insurgencyAir";
import { dirOfYaw } from "./insurgencyPieces";

const { fontFamily: FELL_SC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: CASLON } = loadCaslon("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const FONTS = { fell: FELL_SC, caslon: CASLON };
/** the map style's inks */
export const INK = { cream: "#EFE4C8", creamDim: "#D9C9A3", orange: "#FFB000", dark: "#2A2119", halo: AIR.A.line };

const f2 = (v: number) => v.toFixed(2);
const sstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** the eye-depth below which a ground point is not drawn (behind / at the lens) */
const NEAR = 1;

// ===================================================================================================================
// GROUND LABEL
// ===================================================================================================================
export type GroundLabelProps = {
  A: InsWorld;
  text: string;
  /** the label's centre on the map (world) */
  at: P2;
  /** the cap height, world units (it lies on the ground: it shrinks with distance like the map) */
  size: number;
  /** the map direction the label's top points to (yaw, deg; 0 = map north). Use northYaw at a map place, or the
   *  cut's camera yaw, so it reads upright to the lens. */
  yaw?: number;
  /** frames since it starts to land (< 0: not yet); it slides 26 screen px up the ground (north) and fades in */
  t?: number;
  font?: "fell" | "caslon";
  color?: string;
  /** letter spacing, em (default 0.16) */
  spacing?: number;
  opacity?: number;
};
/** a name lying ON the ground in perspective; lands per CRAFT (slide up 26 px + fade, bezier(0.16,1,0.3,1), ~14 f) */
export const GroundLabel: React.FC<GroundLabelProps> = ({ A, text, at, size, yaw = 0, t = 1e3, font = "fell", color = INK.cream, spacing = 0.16, opacity = 1 }) => {
  if (t < 0) return null;
  const u = interpolate(t, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const op = interpolate(t, [0, 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * opacity;
  const n = dirOfYaw(yaw); // the label's up on the map
  const e: V3 = [-n[2], 0, n[0]]; // its right (n rotated clockwise seen from above)
  const J = (x: number, z: number) => {
    const p = toScreen(A.cam, x, 0, z);
    const ex = toScreen(A.cam, x + e[0], 0, z + e[2]);
    const nx = toScreen(A.cam, x + n[0], 0, z + n[2]);
    return { p, de: [ex.x - p.x, ex.y - p.y], dn: [nx.x - p.x, nx.y - p.y] };
  };
  const J0 = J(at[0], at[1]);
  if (J0.p.z < NEAR) return null;
  const back = (26 / Math.max(1e-3, Math.hypot(J0.dn[0], J0.dn[1]))) * (1 - u);
  const c: P2 = [at[0] - n[0] * back, at[1] - n[2] * back];
  const Jc = J(c[0], c[1]);
  // text units: 1 user unit = 1 world unit; +x along e, +y toward -n (south: down the label)
  const m = [Jc.de[0], Jc.de[1], -Jc.dn[0], -Jc.dn[1], Jc.p.x, Jc.p.y];
  if (m.some((v) => !Number.isFinite(v))) return null;
  const dist = A.dist(at[0], 0, at[1]);
  const fs = font === "fell" ? size / 0.66 : size / 0.7; // font size from cap height
  return (
    <g transform={`matrix(${m.map((v) => v.toFixed(5)).join(",")})`} opacity={op}>
      <text
        x={0}
        y={fs * 0.33}
        textAnchor="middle"
        fill={A.tone(color, dist)}
        stroke={A.tone(INK.halo, dist)}
        strokeOpacity={0.8 * (1 - A.hazeAt(dist))}
        strokeWidth={fs * 0.15}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: font === "fell" ? FELL_SC : CASLON, fontSize: fs, letterSpacing: `${spacing * fs}px` }}
      >
        {text}
      </text>
    </g>
  );
};

// ===================================================================================================================
// GROUND LINE: a polyline on the map as a world-space ribbon
// ===================================================================================================================
const resample = (pts: P2[], step: number) => {
  const out: { p: P2; s: number }[] = [{ p: pts[0], s: 0 }];
  let s = 0;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L <= 0) continue;
    let t = step - acc;
    while (t <= L) {
      out.push({ p: [a[0] + ((b[0] - a[0]) * t) / L, a[1] + ((b[1] - a[1]) * t) / L], s: s + t });
      t += step;
    }
    acc = L - (t - step);
    s += L;
  }
  const last = pts[pts.length - 1];
  if (out[out.length - 1].s < s - 1e-6) out.push({ p: last, s });
  return { pts: out, len: s };
};
export const polyLength = (pts: P2[]) => pts.reduce((L, p, i) => (i ? L + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
/** the point at arclength fraction t of a polyline (for a piece riding a railway) */
export const pointAlong = (pts: P2[], t: number): P2 => {
  const L = polyLength(pts) * Math.max(0, Math.min(1, t));
  let s = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (s + l >= L) {
      const q = l > 0 ? (L - s) / l : 0;
      return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q];
    }
    s += l;
  }
  return pts[pts.length - 1];
};
export type GroundLineProps = {
  A: InsWorld;
  pts: P2[];
  /** solid | dash (dashed cream period line) | rail (the map railway: a dark core with cream ties, the old symbol) */
  kind?: "solid" | "dash" | "rail";
  color?: string;
  /** width, world units (it lies on the ground and thins with distance) */
  w: number;
  /** the drawn part, arclength fractions (a route that draws itself: to 0 -> 1, monotone) */
  from?: number;
  to?: number;
  /** dash (and rail tie) length, world units: constant, so dashes never crawl under a zoom */
  dash?: number;
  opacity?: number;
  uid?: string;
};
export const GroundLine: React.FC<GroundLineProps> = ({ A, pts, kind = "solid", color = INK.cream, w, from = 0, to = 1, dash, opacity = 1 }) => {
  if (pts.length < 2 || to <= from) return null;
  const total = polyLength(pts);
  const dashW = dash ?? w * 3.2;
  const step = Math.max(total / 900, Math.min(dashW / 3, total / 60));
  const R = resample(pts, step);
  const s0 = from * R.len;
  const s1 = to * R.len;
  // per sample: left / right on the ground, projected
  const P = R.pts.map((q, i) => {
    const a = R.pts[Math.max(0, i - 1)].p;
    const b = R.pts[Math.min(R.pts.length - 1, i + 1)].p;
    const tx = b[0] - a[0];
    const tz = b[1] - a[1];
    const tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl;
    const nz = tx / tl;
    return { s: q.s, p: q.p, n: [nx, nz] as P2 };
  });
  const ribbon = (sa: number, sb: number, ww: number) => {
    // samples in [sa, sb], with interpolated ends
    const L: string[] = [];
    const Rr: string[] = [];
    let ok = true;
    const push = (p: P2, n: P2) => {
      const l = toScreen(A.cam, p[0] + (n[0] * ww) / 2, 0, p[1] + (n[1] * ww) / 2);
      const r = toScreen(A.cam, p[0] - (n[0] * ww) / 2, 0, p[1] - (n[1] * ww) / 2);
      if (l.z < NEAR || r.z < NEAR) ok = false;
      L.push(`${f2(l.x)},${f2(l.y)}`);
      Rr.push(`${f2(r.x)},${f2(r.y)}`);
    };
    const at = (s: number) => {
      let i = Math.max(0, Math.min(P.length - 2, Math.floor(s / step)));
      while (i > 0 && P[i].s > s) i--;
      while (i < P.length - 2 && P[i + 1].s < s) i++;
      const a = P[i];
      const b = P[i + 1];
      const q = b.s > a.s ? Math.max(0, Math.min(1, (s - a.s) / (b.s - a.s))) : 0;
      return { p: [a.p[0] + (b.p[0] - a.p[0]) * q, a.p[1] + (b.p[1] - a.p[1]) * q] as P2, n: [a.n[0] + (b.n[0] - a.n[0]) * q, a.n[1] + (b.n[1] - a.n[1]) * q] as P2 };
    };
    const A0 = at(sa);
    push(A0.p, A0.n);
    for (const q of P) if (q.s > sa && q.s < sb) push(q.p, q.n);
    const B0 = at(sb);
    push(B0.p, B0.n);
    if (!ok) return null;
    return `M${L.join("L")}L${Rr.reverse().join("L")}Z`;
  };
  // chunks for the fog (each chunk one colour)
  const chunk = Math.max(step * 4, R.len / 40);
  const els: React.ReactNode[] = [];
  const midOf = (s: number) => {
    const i = Math.max(0, Math.min(P.length - 1, Math.round(s / step)));
    return P[i].p;
  };
  const piece = (key: string, sa: number, sb: number, ww: number, col: string, op = 1) => {
    const m = midOf((sa + sb) / 2);
    const dist = A.dist(m[0], 0, m[1]);
    const d = ribbon(sa, sb, ww);
    if (!d) return;
    els.push(<path key={key} d={d} fill={A.tone(col, dist)} fillOpacity={op * opacity} />);
  };
  if (kind === "solid") {
    for (let s = s0, k = 0; s < s1; s += chunk, k++) piece(`c${k}`, s, Math.min(s1, s + chunk + step * 0.25), w, color);
  } else if (kind === "dash") {
    const period = dashW * 1.7;
    for (let s = Math.floor(s0 / period) * period, k = 0; s < s1; s += period, k++) {
      const a = Math.max(s0, s);
      const b = Math.min(s1, s + dashW);
      if (b > a) piece(`d${k}`, a, b, w, color);
    }
  } else {
    // the railway: a dark casing, a cream core broken by dark ties (the old map railway)
    for (let s = s0, k = 0; s < s1; s += chunk, k++) piece(`r${k}`, s, Math.min(s1, s + chunk + step * 0.25), w, INK.dark, 0.9);
    const period = dashW * 2;
    for (let s = Math.floor(s0 / period) * period, k = 0; s < s1; s += period, k++) {
      const a = Math.max(s0, s);
      const b = Math.min(s1, s + dashW);
      if (b > a) piece(`t${k}`, a, b, w * 0.56, color);
    }
  }
  return <g>{els}</g>;
};

// ===================================================================================================================
// CITY DOT and SOFT PATCH
// ===================================================================================================================
const groundPoly = (A: InsWorld, c: P2, rx: number, rz: number, rot = 0, n = 40) => {
  const out: string[] = [];
  const cr = Math.cos((rot * Math.PI) / 180);
  const sr = Math.sin((rot * Math.PI) / 180);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const lx = Math.cos(a) * rx;
    const lz = Math.sin(a) * rz;
    const s = toScreen(A.cam, c[0] + lx * cr - lz * sr, 0, c[1] + lx * sr + lz * cr);
    if (s.z < NEAR) return null;
    out.push(`${f2(s.x)},${f2(s.y)}`);
  }
  return `M${out.join("L")}Z`;
};
/** a town on the ground: a cream dot in a dark ring (r world units), fogged */
export const CityDot: React.FC<{ A: InsWorld; at: P2; r: number; color?: string; opacity?: number }> = ({ A, at, r, color = INK.cream, opacity = 1 }) => {
  const dist = A.dist(at[0], 0, at[1]);
  const o = groundPoly(A, at, r * 1.45, r * 1.45, 0, 28);
  const i = groundPoly(A, at, r, r, 0, 28);
  if (!o || !i) return null;
  return (
    <g opacity={opacity}>
      <path d={o} fill={A.tone(INK.dark, dist)} fillOpacity={0.85} />
      <path d={i} fill={A.tone(color, dist)} />
    </g>
  );
};
/** OPTIONAL and subtle: a soft-edged glow lying on the ground (an ellipse: centre, radii, rotation deg on the map),
 *  e.g. BASE_AREAS round the rising pawns. Default amount 0.6; keep it at or under that. */
export const SoftPatch: React.FC<{ A: InsWorld; c: P2; r: P2; rot?: number; color?: string; amount?: number; rings?: number }> = ({ A, c, r, rot = 0, color = INK.orange, amount = 0.6, rings = 6 }) => {
  if (amount <= 0) return null;
  const dist = A.dist(c[0], 0, c[1]);
  const col = A.toneO(color, dist);
  const els: React.ReactNode[] = [];
  for (let k = 0; k < rings; k++) {
    const f = 1.12 - (0.5 * k) / Math.max(1, rings - 1);
    const d = groundPoly(A, c, r[0] * f, r[1] * f, rot, 48);
    if (d) els.push(<path key={k} d={d} fill={col} fillOpacity={(0.34 / rings) * amount * (0.6 + sstep(0, rings, k + 1))} />);
  }
  return <g>{els}</g>;
};
