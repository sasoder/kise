// ---------------------------------------------------------------------------
// londonDepth: the depth kit of the Kyle Harper London clip (DEPTH.md, the final pass). One-point perspective that
// rides on a cut's existing 2D camera, a ground plane, contact shadows, atmospheric depth, and box / cylinder
// volumes, all lit from the upper left. Draw everything inside the cut's WorldSvg (world px of the front plane).
//
// THE MODEL. 3D world units = the cast's units (a man ~310 tall). X across, Y height (the floor is Y = 0, up is - Y),
// Z depth behind the FRONT PLANE (Z = 0, toward the camera is - Z). The cut's 2D camera (cx, cy, k) keeps showing the
// front plane exactly as it does now (2D world x, y = X, Y at Z = 0), so labels and the front row do not move. The
// camera stands on the centre line (the VP is at x = cam.cx) with its eye at height eyeY (< 0), a distance Dc in
// front of the front plane. A zoom of the 2D camera is part dolly, part lens:
//     Dc = dRef * (kRef / k) ^ dolly          (dolly 0 = pure lens zoom, no parallax; 1 = pure dolly)
// and a point at depth Z draws at the depth ratio r = Dc / (Dc + Z):
//     2D world point  [cam.cx + (X - cam.cx) * r,  eyeY + (Y - eyeY) * r],  scale r.
// So nearer layers move faster than farther ones on every pan and pull-back (parallax), every receding edge meets
// the VP [cam.cx, eyeY] (the horizon is the 2D world line y = eyeY), and floor rows compress toward the horizon.
//
//   perspective(cam, opts)        -> Persp: p(X, Y, Z) 2D point, r(Z), at(X, Z) feet + scale, vp, horizonY, Dc
//   placeAtRef(opts, kRef, cxRef, x2, s)  the 3D X and Z that reproduce a 2D placement (x, scale s) at the ref camera
//   GroundPlane  boards | flags | cobbles: joints to the VP, rows compressing, fading with distance
//   ContactShadow                a soft dark ellipse on the floor under a figure / prop, offset to the lower right
//   depthTint(Z, opts) / tintInk(ink, t)   atmospheric depth: toward the page tone with distance; thinner line
//   Box / Cylinder               volumes in the same perspective, top / side / front faces lit from the upper left
// Probe: LondonDepthProbe (londonDepthProbe.tsx; src/Root.LondonDepth.tsx).
// ---------------------------------------------------------------------------
import React from "react";
import { hash, type Cam, type P2 } from "../kits/maps/incaShared";
import { mixInk, type Ink } from "./londonCastV2";

/** the house page, casing and the context dim */
export const PAGE = "#3F3428";
export const DARK = "#17120D";
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const P = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
export type DepthOpts = {
  /** the eye's height (world units, < 0: above the floor) — the horizon is the 2D world line y = eyeY */
  eyeY: number;
  /** the camera's distance in front of the front plane at the reference zoom kRef (world units) */
  dRef: number;
  kRef: number;
  /** how much of a zoom is a dolly (0..1); the rest is lens */
  dolly: number;
};
export type Persp = {
  cam: Cam;
  opts: DepthOpts;
  /** the camera's distance in front of the front plane now */
  Dc: number;
  /** the depth ratio at Z (1 on the front plane) */
  r: (Z: number) => number;
  /** a 3D point as a 2D world point (for drawing inside the WorldSvg) */
  p: (X: number, Y: number, Z: number) => P2;
  /** the feet of something standing at (X, Z) and its scale (pass to a figure's `at` / `scale`) */
  at: (X: number, Z: number) => { at: P2; scale: number };
  /** the vanishing point (2D world) and the horizon's 2D world y */
  vp: P2;
  horizonY: number;
  /** the nearest Z still in front of the camera with a margin */
  zNear: number;
};
export const perspective = (cam: Cam, opts: DepthOpts): Persp => {
  const Dc = opts.dRef * Math.pow(opts.kRef / cam.k, opts.dolly);
  const r = (Z: number) => Dc / (Dc + Math.max(Z, -0.92 * Dc));
  const p = (X: number, Y: number, Z: number): P2 => {
    const rr = r(Z);
    return [cam.cx + (X - cam.cx) * rr, opts.eyeY + (Y - opts.eyeY) * rr];
  };
  return { cam, opts, Dc, r, p, at: (X, Z) => ({ at: p(X, 0, Z), scale: r(Z) }), vp: [cam.cx, opts.eyeY], horizonY: opts.eyeY, zNear: -0.85 * Dc };
};
/** the 3D (X, Z) that draws a 2D placement (feet x, scale s) exactly as before at the reference camera (cx at kRef) */
export const placeAtRef = (opts: DepthOpts, cxRef: number, x2: number, s: number): { X: number; Z: number } => ({ X: cxRef + (x2 - cxRef) / s, Z: opts.dRef * (1 / s - 1) });

// ---------------------------------------------------------------------------
// ATMOSPHERIC DEPTH
// ---------------------------------------------------------------------------
/** 1 at the front plane, falling toward `min` at depth `far`: multiply a figure's ink level by it */
export const depthTint = (Z: number, o: { far?: number; min?: number } = {}) => mix(1, o.min ?? 0.72, c01(Z / (o.far ?? 900)));
/** an ink sunk toward the page by (1 - t) */
export const tintInk = (ink: Ink, t: number): Ink => mixInk({ main: PAGE, deep: PAGE, hair: PAGE }, ink, t);

// ---------------------------------------------------------------------------
// THE GROUND PLANE
// ---------------------------------------------------------------------------
export type Floor = "boards" | "flags" | "cobbles";
/** the floor: a lighter umber near, the page far; joints (dark) converge to the VP; cross-joints compress toward the
 *  horizon; everything fades out by zFar. The strokes thin with depth (the line weight is the house engraved one). */
export const GroundPlane: React.FC<{ P: Persp; kind?: Floor; x0?: number; x1?: number; z0?: number; zFar?: number; plank?: number; course?: number; uid: string; tone?: number }> = ({
  P: pp,
  kind = "boards",
  x0 = -1800,
  x1 = 1800,
  z0 = -900,
  zFar = 2600,
  plank = 46,
  course = 420,
  uid,
  tone = 1,
}) => {
  const zA = Math.max(z0, pp.zNear);
  const fade = (Z: number) => 1 - c01((Z - 200) / (zFar - 200));
  // the floor's own tone: bands from near to far (flat steps, so it reads as engraved, not airbrushed)
  const bands: React.ReactNode[] = [];
  const NB = 14;
  for (let i = 0; i < NB; i++) {
    const za = mix(zA, zFar, Math.pow(i / NB, 1.6));
    const zb = mix(zA, zFar, Math.pow((i + 1) / NB, 1.6));
    const q = [pp.p(x0, 0, za), pp.p(x1, 0, za), pp.p(x1, 0, zb), pp.p(x0, 0, zb)];
    bands.push(<path key={i} d={`M${q.map(P).join("L")}Z`} fill="#6A5838" opacity={0.3 * tone * fade((za + zb) / 2)} />);
  }
  // the joints: along Z (to the VP) and across (rows), each cut into depth pieces that fade and thin
  const lines: React.ReactNode[] = [];
  const pieces = 18;
  const zAt = (i: number) => mix(zA, zFar, Math.pow(i / pieces, 1.5));
  if (kind === "boards" || kind === "flags") {
    const step = kind === "boards" ? plank : course * 0.7;
    for (let i = 0; i < pieces; i++) {
      const za = zAt(i);
      const zb = zAt(i + 1);
      const zm = (za + zb) / 2;
      const a = fade(zm);
      if (a < 0.02) continue;
      let d = "";
      for (let X = Math.ceil(x0 / step) * step; X <= x1; X += step) d += `M${P(pp.p(X, 0, za))}L${P(pp.p(X, 0, zb))}`;
      lines.push(<path key={`l${i}`} d={d} fill="none" stroke={DARK} strokeWidth={1.7 * pp.r(zm)} strokeOpacity={0.62 * a * tone} />);
    }
    // the cross joints: boards butt-jointed at staggered places along each plank; flags in courses
    let dx = "";
    const crossA: string[] = [];
    let n = 0;
    for (let X = Math.ceil(x0 / step) * step; X < x1; X += step, n++) {
      const off = kind === "boards" ? hash(n, 41) * course : (n % 2) * course * 0.5;
      for (let Z = zA - ((zA - off) % course) - course; Z < zFar; Z += course) {
        if (Z < zA) continue;
        const a = fade(Z);
        if (a < 0.04) continue;
        const seg = `M${P(pp.p(X, 0, Z))}L${P(pp.p(X + step, 0, Z))}`;
        if (a > 0.5) dx += seg;
        else crossA.push(seg);
      }
    }
    lines.push(<path key="x" d={dx} fill="none" stroke={DARK} strokeWidth={1.4 * pp.r(0)} strokeOpacity={0.5 * tone} />);
    lines.push(<path key="xa" d={crossA.join("")} fill="none" stroke={DARK} strokeWidth={1.1 * pp.r(900)} strokeOpacity={0.25 * tone} />);
    // a little grain on the near boards, cream, very faint
    if (kind === "boards") {
      let g = "";
      let m = 0;
      for (let X = Math.ceil(x0 / step) * step; X < x1; X += step, m++) {
        for (let j = 0; j < 2; j++) {
          const xx = X + step * (0.3 + 0.4 * j + 0.1 * (hash(m, 51 + j) - 0.5));
          const za = zA + hash(m, 53 + j) * 300;
          g += `M${P(pp.p(xx, 0, za))}L${P(pp.p(xx, 0, za + 260 + 200 * hash(m, 57)))}`;
        }
      }
      lines.push(<path key="g" d={g} fill="none" stroke="#E9DDBF" strokeWidth={0.9 * pp.r(0)} strokeOpacity={0.07 * tone} />);
    }
  } else {
    // cobbles: rows of rounded stones, each smaller toward the horizon
    let d = "";
    let row = 0;
    for (let Z = zA; Z < zFar; Z += course * 0.12 * (1 + row * 0.02), row++) {
      if (fade(Z) < 0.1) break;
      for (let X = x0 + (row % 2) * 22; X < x1; X += 44) {
        const c = pp.p(X, 0, Z);
        const rx = 19 * pp.r(Z);
        const ry = Math.max(0.6, (pp.p(X, 0, Z - 18)[1] - pp.p(X, 0, Z + 18)[1]) / 2);
        d += `M${(c[0] - rx).toFixed(1)},${c[1].toFixed(1)}a${rx.toFixed(1)},${ry.toFixed(1)} 0 1 0 ${(2 * rx).toFixed(1)},0a${rx.toFixed(1)},${ry.toFixed(1)} 0 1 0 ${(-2 * rx).toFixed(1)},0`;
      }
    }
    lines.push(<path key="c" d={d} fill="none" stroke={DARK} strokeWidth={1.2} strokeOpacity={0.45 * tone} />);
  }
  return (
    <g>
      {bands}
      {lines}
    </g>
  );
};

// ---------------------------------------------------------------------------
// CONTACT SHADOW
// ---------------------------------------------------------------------------
/** a soft dark ellipse on the floor at (X, Z), half-width w and half-depth d (world units), offset to the lower right */
export const ContactShadow: React.FC<{ P: Persp; X: number; Z: number; w?: number; d?: number; uid: string; amt?: number }> = ({ P: pp, X, Z, w = 74, d = 40, uid, amt = 1 }) => {
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.25 * d;
  const c = pp.p(Xc, 0, Zc);
  const rx = w * pp.r(Zc);
  const ry = Math.max(1, (pp.p(Xc, 0, Zc - d)[1] - pp.p(Xc, 0, Zc + d)[1]) / 2);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-cs`}>
          <stop offset="0" stopColor={DARK} stopOpacity={0.85 * amt} />
          <stop offset="0.6" stopColor={DARK} stopOpacity={0.6 * amt} />
          <stop offset="1" stopColor={DARK} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-cs)`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// VOLUMES (lit from the upper left: the top and the left side lit, the front mid, the right side and undersides dark)
// ---------------------------------------------------------------------------
const OUTW = 2.3;
const hatchPoly = (q: P2[], ang: number, gap: number, seed: number) => {
  const xs = q.map((v) => v[0]);
  const ys = q.map((v) => v[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const r = (ang * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2;
  let d = "";
  let i = 0;
  for (let o = -R; o <= R; o += gap, i++) {
    const oo = o + (hash(i, seed) - 0.5) * gap * 0.4;
    const px = cx - dy * oo;
    const py = cy + dx * oo;
    d += `M${P([px - dx * R, py - dy * R])}L${P([px + dx * R, py + dy * R])}`;
  }
  return d;
};
export type VolInk = { lit: string; mid: string; dark: string };
export const volInk = (ink: Ink): VolInk => ({ lit: ink.main, mid: ink.deep, dark: ink.hair });
/** a box from X0..X1, Y0 (top, < Y1)..Y1 (bottom), Z0 (front)..Z1 (back); shows the faces the camera sees */
export const Box: React.FC<{ P: Persp; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; ink: VolInk; uid: string; hatch?: boolean; children?: React.ReactNode }> = ({
  P: pp,
  X0,
  X1,
  Y0,
  Y1,
  Z0,
  Z1,
  ink,
  uid,
  hatch = true,
  children,
}) => {
  const p = pp.p;
  const sw = OUTW * pp.r((Z0 + Z1) / 2);
  const face = (q: P2[], fill: string, key: string, shade: number, ang = 112) => (
    <g key={key}>
      <clipPath id={`${uid}-${key}`}>
        <path d={`M${q.map(P).join("L")}Z`} />
      </clipPath>
      <path d={`M${q.map(P).join("L")}Z`} fill={fill} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
      {hatch && shade > 0 ? <path d={hatchPoly(q, ang, 2.8 * pp.r(Z0) + 0.6, 7 + key.length)} clipPath={`url(#${uid}-${key})`} fill="none" stroke={DARK} strokeWidth={0.85 * pp.r(Z0)} strokeOpacity={shade} /> : null}
    </g>
  );
  const vx = pp.vp[0];
  const els: React.ReactNode[] = [];
  // far faces first: the bottom (when above the eye), the sides, then the top, then the front
  if (Y1 < pp.horizonY) els.push(face([p(X0, Y1, Z0), p(X1, Y1, Z0), p(X1, Y1, Z1), p(X0, Y1, Z1)], ink.dark, "bt", 0.5));
  if (X0 > vx) els.push(face([p(X0, Y0, Z0), p(X0, Y0, Z1), p(X0, Y1, Z1), p(X0, Y1, Z0)], ink.lit, "lf", 0.15, 100));
  if (X1 < vx) els.push(face([p(X1, Y0, Z0), p(X1, Y0, Z1), p(X1, Y1, Z1), p(X1, Y1, Z0)], ink.dark, "rt", 0.5, 100));
  if (Y0 > pp.horizonY) els.push(face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y0, Z1), p(X0, Y0, Z1)], ink.lit, "tp", 0.0));
  els.push(face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y1, Z0), p(X0, Y1, Z0)], ink.mid, "fr", 0.3));
  return (
    <g>
      {els}
      {children}
    </g>
  );
};
/** a vertical cylinder (axis at X, Z; radius R) from Y0 (top) to Y1 (bottom): elliptical ends opening with their
 *  height below the eye, the right side shaded */
export const Cylinder: React.FC<{ P: Persp; X: number; Z: number; R: number; Y0: number; Y1: number; ink: VolInk; uid: string }> = ({ P: pp, X, Z, R, Y0, Y1, ink, uid }) => {
  const ell = (Y: number) => {
    const c = pp.p(X, Y, Z);
    const rx = R * pp.r(Z);
    const ry = (pp.p(X, Y, Z - R)[1] - pp.p(X, Y, Z + R)[1]) / 2;
    return { c, rx, ry };
  };
  const t = ell(Y0);
  const b = ell(Y1);
  const sw = OUTW * pp.r(Z);
  const body = `M${P([t.c[0] - t.rx, t.c[1]])}L${P([b.c[0] - b.rx, b.c[1]])}A${b.rx.toFixed(2)},${Math.abs(b.ry).toFixed(2)} 0 0 0 ${P([b.c[0] + b.rx, b.c[1]])}L${P([t.c[0] + t.rx, t.c[1]])}Z`;
  const shadeRect: P2[] = [
    [t.c[0] + t.rx * 0.35, t.c[1]],
    [t.c[0] + t.rx, t.c[1]],
    [b.c[0] + b.rx, b.c[1] + Math.abs(b.ry)],
    [b.c[0] + b.rx * 0.35, b.c[1] + Math.abs(b.ry)],
  ];
  const topSeen = Y0 > pp.horizonY;
  return (
    <g>
      <clipPath id={`${uid}-cb`}>
        <path d={body} />
      </clipPath>
      <path d={body} fill={ink.mid} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
      <g clipPath={`url(#${uid}-cb)`}>
        <path d={`M${shadeRect.map(P).join("L")}Z`} fill={ink.dark} opacity={0.75} />
        <path d={hatchPoly(shadeRect, 96, 2.6 * pp.r(Z) + 0.5, 21)} fill="none" stroke={DARK} strokeWidth={0.85 * pp.r(Z)} strokeOpacity={0.45} />
        {/* the lit stripe at the upper left */}
        <path d={`M${P([t.c[0] - t.rx * 0.55, t.c[1]])}L${P([b.c[0] - b.rx * 0.55, b.c[1]])}`} stroke={ink.lit} strokeWidth={t.rx * 0.28} strokeOpacity={0.8} />
      </g>
      {topSeen ? <ellipse cx={t.c[0]} cy={t.c[1]} rx={t.rx} ry={Math.abs(t.ry)} fill={ink.lit} stroke={DARK} strokeWidth={sw} /> : null}
    </g>
  );
};
