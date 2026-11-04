// ---------------------------------------------------------------------------
// farOutFaces — small 3D helpers for FarOutOfAustin's own set pieces (farOutCar, farOutCity): air-lit planar faces in
// the clip's light (upper left, a little from the front: ranchWorld's LIGHT), each with an explicit interior point so
// the outward normal and the back-face cull never depend on vertex order. Points are KIT space (X, H up +, Z), drawn
// through the cut's AirWorld (A.P.p(X, -H, Z)). A `Toner` fogs a local colour (default A.tone, by the eye's distance);
// the far city passes its own.
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, formTone, mixHex, type AirWorld, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";

export const PAL = AIR.A;
export type P2 = [number, number];
export type V3 = [number, number, number];
export type Toner = (hex: string, Z: number, h: number) => string;

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
export const Pt = (p: P2) => `${n2(p[0])},${n2(p[1])}`;
export const polyD = (q: P2[]) => (q.length ? `M${q.map(Pt).join("L")}Z` : "");

/** the clip's light: from the upper left, a little from the front (ranchWorld's LIGHT) */
export const LIGHT: V3 = norm([-0.6, 0.75, -0.3]);
export const proj = (A: AirWorld, p: V3): P2 => A.P.p(p[0], -p[1], p[2]);
export const camPos = (A: AirWorld): V3 => [A.cam.cx, -A.P.opts.eyeY, -A.Dc];
export const centroid = (pts: V3[]): V3 => mul(pts.reduce((s, p) => add(s, p), [0, 0, 0] as V3), 1 / pts.length);
/** the outward unit normal of a planar polygon, oriented away from `inside` */
export const outward = (pts: V3[], inside: V3): V3 => {
  let n: V3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) n = add(n, cross(pts[i], pts[(i + 1) % pts.length]));
  n = norm(n);
  return dot(n, sub(centroid(pts), inside)) < 0 ? mul(n, -1) : n;
};
/** is a face (point p, outward normal n) seen from the eye? */
export const facing = (A: AirWorld, p: V3, n: V3) => dot(n, sub(camPos(A), p)) > 0;
export const lineOfMat = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);

export type FaceOpts = {
  tone?: Toner;
  /** stroke width (world px); default A.lw(0.9) */
  lw?: number;
  lineOp?: number;
  /** a fixed local colour instead of the lit material */
  fill?: string;
  noCull?: boolean;
  /** extra darkening toward the shadow colour 0..1 */
  sink?: number;
  /** the soft darkening toward the face's lowest edge (a body side, a wall) */
  foot?: number;
  uid?: string;
};
/** an air-lit planar face; returns null when it faces away */
export const face3 = (A: AirWorld, pts: V3[], inside: V3, mat: Mat, key: string, o: FaceOpts = {}): React.ReactNode => {
  const n = outward(pts, inside);
  const c = centroid(pts);
  if (!o.noCull && !facing(A, c, n)) return null;
  const tone = o.tone ?? ((hex: string, Z: number, h: number) => A.tone(hex, Z, h));
  let local = o.fill ?? formTone(mat, dot(n, LIGHT), PAL.shadow, 0.22);
  if (o.sink) local = mixHex(local, PAL.shadow, o.sink);
  const fill = tone(local, c[2], c[1]);
  const q = pts.map((p) => proj(A, p));
  const d = polyD(q);
  const lw = o.lw ?? A.lw(0.9);
  const stroke = lw > 0 ? tone(lineOfMat(mat), c[2], c[1]) : "none";
  if (o.foot && o.uid) {
    // the soft occlusion toward the face's foot: a vertical gradient from its top row to its bottom row on screen
    const ys = q.map((p) => p[1]);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const gid = `${o.uid}-${key}-ft`;
    return (
      <g key={key}>
        <path d={d} fill={fill} stroke={stroke} strokeWidth={lw} strokeOpacity={o.lineOp ?? 0.75} strokeLinejoin="round" />
        {y1 - y0 > 0.5 ? (
          <>
            <defs>
              <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={n2(y0)} x2="0" y2={n2(y1)}>
                <stop offset="0" stopColor={PAL.cream} stopOpacity={0.06} />
                <stop offset="0.45" stopColor={PAL.shadow} stopOpacity={0} />
                <stop offset="1" stopColor={PAL.shadow} stopOpacity={o.foot} />
              </linearGradient>
            </defs>
            <path d={d} fill={`url(#${gid})`} />
          </>
        ) : null}
      </g>
    );
  }
  return <path key={key} d={d} fill={fill} stroke={stroke} strokeWidth={lw} strokeOpacity={o.lineOp ?? 0.75} strokeLinejoin="round" />;
};

/** a polyline (3D) as one stroked path */
export const line3 = (A: AirWorld, pts: V3[]) => `M${pts.map((p) => Pt(proj(A, p))).join("L")}`;
/** a closed 3D polygon's path */
export const poly3 = (A: AirWorld, pts: V3[]) => polyD(pts.map((p) => proj(A, p)));
