// ---------------------------------------------------------------------------
// hundredthCamera (sam-navier-stokes, cut 1, Rev 2b): a real pinhole camera over the newsprint page.
// World: the page is the plane z = 0 (x right, y down the page toward the viewer), z up out of the paper.
// The camera looks at a target T = (tx, ty, tz) from distance D = F / k, at elevation phi above the page (90 = straight
// down) and azimuth psi (0 = from the page's foot, south; + swings it east), with a roll rho. Screen = 540 + F * (rel . r)
// / (rel . f), 960 + F * (rel . dn) / (rel . f). A plane parallel to the page (z = h) maps to the screen by a 3 x 3
// homography, which CSS matrix3d draws exactly (the page, the photo, each bundle's top note); edges are projected
// point by point (the bundles' sides).
// ---------------------------------------------------------------------------
export const F = 2000; // focal length (px): a moderate lens, half-FOV ~25.6 deg vertically

export type Shot = { tx: number; ty: number; tz: number; k: number; phi: number; psi: number; rho: number };
type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const DEG = Math.PI / 180;

export type View = { C: V3; f: V3; r: V3; dn: V3 };
export const viewOf = (s: Shot): View => {
  const ph = s.phi * DEG;
  const ps = s.psi * DEG;
  const back: V3 = [Math.sin(ps) * Math.cos(ph), Math.cos(ps) * Math.cos(ph), Math.sin(ph)]; // from T toward the camera
  const D = F / s.k;
  const C: V3 = [s.tx + back[0] * D, s.ty + back[1] * D, s.tz + back[2] * D];
  const f: V3 = [-back[0], -back[1], -back[2]];
  let r = norm(cross([0, 0, 1], f));
  let u = cross(f, r);
  const ro = s.rho * DEG;
  const r2: V3 = [r[0] * Math.cos(ro) + u[0] * Math.sin(ro), r[1] * Math.cos(ro) + u[1] * Math.sin(ro), r[2] * Math.cos(ro) + u[2] * Math.sin(ro)];
  const u2: V3 = [u[0] * Math.cos(ro) - r[0] * Math.sin(ro), u[1] * Math.cos(ro) - r[1] * Math.sin(ro), u[2] * Math.cos(ro) - r[2] * Math.sin(ro)];
  r = r2;
  u = u2;
  return { C, f, r, dn: [-u[0], -u[1], -u[2]] };
};

export type Pt = { x: number; y: number };
/** screen point of world (x, y, z) */
export const P3 = (v: View, x: number, y: number, z: number): Pt => {
  const rel = sub([x, y, z], v.C);
  const w = dot(rel, v.f);
  return { x: 540 + (F * dot(rel, v.r)) / w, y: 960 + (F * dot(rel, v.dn)) / w };
};
/** the camera's depth of a world point (for painter's order) */
export const depthOf = (v: View, x: number, y: number, z: number) => dot(sub([x, y, z], v.C), v.f);

/** the 3 x 3 homography of the plane z = h: page (x, y) -> screen (homogeneous), as rows */
const planeH = (v: View, h: number) => {
  const c = (a: V3) => a[2] * h - dot(v.C, a);
  return [
    [F * v.r[0] + 540 * v.f[0], F * v.r[1] + 540 * v.f[1], F * c(v.r) + 540 * c(v.f)],
    [F * v.dn[0] + 960 * v.f[0], F * v.dn[1] + 960 * v.f[1], F * c(v.dn) + 960 * c(v.f)],
    [v.f[0], v.f[1], c(v.f)],
  ];
};
const fx = (n: number) => (Math.round(n * 1e9) / 1e9).toString();
/**
 * CSS matrix3d for an element whose local (u, v) px map to the page rect x = x0 + u * sx, y = y0 + v * sy on the plane
 * z = h (transform-origin 0 0, positioned at the screen's 0, 0).
 */
export const planeCss = (v: View, h: number, x0: number, y0: number, sx: number, sy: number) => {
  const H = planeH(v, h);
  // H * A, A = [[sx, 0, x0], [0, sy, y0], [0, 0, 1]]
  const M = H.map((row) => [row[0] * sx, row[1] * sy, row[0] * x0 + row[1] * y0 + row[2]]);
  const n = M[2][2]; // normalise (w > 0 in front of the camera)
  const m = M.map((row) => row.map((e) => e / n));
  return `matrix3d(${[m[0][0], m[1][0], 0, m[2][0], m[0][1], m[1][1], 0, m[2][1], 0, 0, 1, 0, m[0][2], m[1][2], 0, m[2][2]].map(fx).join(",")})`;
};
/** the page point under a screen point (inverse of the z = 0 homography) */
export const unproject = (v: View, X: number, Y: number): Pt => {
  const H = planeH(v, 0);
  const [a, b, c] = H[0];
  const [d, e, g] = H[1];
  const [p, q, r] = H[2];
  // solve [a b c; d e g; p q r] [x y 1]^T ~ [X Y 1]^T
  const A11 = a - X * p;
  const A12 = b - X * q;
  const B1 = X * r - c;
  const A21 = d - Y * p;
  const A22 = e - Y * q;
  const B2 = Y * r - g;
  const det = A11 * A22 - A12 * A21;
  return { x: (B1 * A22 - A12 * B2) / det, y: (A11 * B2 - B1 * A21) / det };
};

// --- the track: raised-cosine moves summed per parameter (each one's velocity a cos^2 bump) ------------------------------
export type Move = { c: number; w: number } & Partial<{ tx: number; ty: number; tz: number; k: number; phi: number; psi: number; rho: number }>;
const S01 = (u: number) => (u <= -1 ? 0 : u >= 1 ? 1 : (u + 1) / 2 + Math.sin(Math.PI * u) / (2 * Math.PI));
/** f0's shot is `start`; each move adds its deltas (k as a factor) eased over c - w .. c + w, measured from f0 */
export const makeTrack = (start: Shot, moves: Move[]) => {
  const raw = (f: number) => {
    const o = { tx: 0, ty: 0, tz: 0, lk: 0, phi: 0, psi: 0, rho: 0 };
    for (const m of moves) {
      const s = S01((f - m.c) / m.w);
      o.tx += (m.tx ?? 0) * s;
      o.ty += (m.ty ?? 0) * s;
      o.tz += (m.tz ?? 0) * s;
      o.lk += Math.log(m.k ?? 1) * s;
      o.phi += (m.phi ?? 0) * s;
      o.psi += (m.psi ?? 0) * s;
      o.rho += (m.rho ?? 0) * s;
    }
    return o;
  };
  const r0 = raw(0);
  return (f: number): Shot => {
    const r = raw(f);
    return {
      tx: start.tx + r.tx - r0.tx,
      ty: start.ty + r.ty - r0.ty,
      tz: start.tz + r.tz - r0.tz,
      k: start.k * Math.exp(r.lk - r0.lk),
      phi: start.phi + r.phi - r0.phi,
      psi: start.psi + r.psi - r0.psi,
      rho: start.rho + r.rho - r0.rho,
    };
  };
};

/**
 * The house camera numbers on a 3D track (museShared camCheck's definition, in screen space): the page points under the
 * frame centre and at (+-200, +-300) from it at frame f, followed through f-1, f, f+1: the largest screen speed (px/f),
 * the largest |dv| (px/f^2), and the slowest frame's fastest point (minV).
 */
export const camCheck3 = (at: (f: number) => Shot, f0: number, f1: number) => {
  let maxA = 0;
  let atA = f0;
  let maxV = 0;
  let atV = f0;
  let minV = Infinity;
  const offs: [number, number][] = [
    [0, 0],
    [-200, -300],
    [200, 300],
    [-200, 300],
    [200, -300],
  ];
  for (let f = f0 + 1; f < f1; f++) {
    const v0 = viewOf(at(f - 1));
    const v1 = viewOf(at(f));
    const v2 = viewOf(at(f + 1));
    let vHere = 0;
    for (const [ox, oy] of offs) {
      const w = unproject(v1, 540 + ox, 960 + oy);
      const s0 = P3(v0, w.x, w.y, 0);
      const s1 = P3(v1, w.x, w.y, 0);
      const s2 = P3(v2, w.x, w.y, 0);
      const vv = Math.hypot(s1.x - s0.x, s1.y - s0.y);
      const aa = Math.hypot(s2.x - 2 * s1.x + s0.x, s2.y - 2 * s1.y + s0.y);
      vHere = Math.max(vHere, vv);
      if (aa > maxA) {
        maxA = aa;
        atA = f;
      }
      if (vv > maxV) {
        maxV = vv;
        atV = f;
      }
    }
    minV = Math.min(minV, vHere);
  }
  return { maxA, atA, maxV, atV, minV };
};
