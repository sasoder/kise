// ===================================================================================================================
// streetOrnament — the carving primitives of streetWorld's crown (robert-old-buildings). Pure geometry on a GB-like
// sink, in FACADE-LOCAL metres: x along the facade, y up, z OUT of the wall toward the street (the wall face is
// z = 0). streetWorld mirrors the result onto the building across. Smooth normals (the carving must read as soft
// sculpted volume under the upper-left light).
// ===================================================================================================================
export type V3 = [number, number, number];
export type Aux = [number, number, number, number];
export type Sink = {
  vtx: (p: V3, n: V3, c: V3, uv: [number, number], a: Aux) => number;
  idx: number[];
};
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** a grid of vertices (nu+1) x (nv+1) from a function, triangulated */
export const grid = (S: Sink, nu: number, nv: number, fn: (u: number, v: number) => { p: V3; n: V3 }, col: V3, a: Aux) => {
  const base: number[] = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const { p, n } = fn(i / nu, j / nv);
      base.push(S.vtx(p, n, col, [p[0], p[1]], a));
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const k = j * (nu + 1) + i;
      S.idx.push(base[k], base[k + 1], base[k + nu + 2], base[k], base[k + nu + 2], base[k + nu + 1]);
    }
};

/** an ellipsoid at c with radii r, turned by rot (radians) about the wall normal (only the front half when `half`) */
export const ellipsoid = (S: Sink, c: V3, r: V3, col: V3, a: Aux, seg = 14, half = false, rot = 0) => {
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  grid(
    S,
    seg,
    Math.max(6, Math.round(seg / 2)),
    (u, v) => {
      const ph = half ? -Math.PI / 2 + u * Math.PI : u * Math.PI * 2;
      const th = v * Math.PI;
      // local unit sphere: x = sin th sin ph, y = cos th, z = sin th cos ph (ph = 0 faces +z)
      const s: V3 = [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)];
      const lp: V3 = [r[0] * s[0], r[1] * s[1], r[2] * s[2]];
      const ln = norm([s[0] / r[0], s[1] / r[1], s[2] / r[2]]);
      return {
        p: [c[0] + cr * lp[0] - sr * lp[1], c[1] + sr * lp[0] + cr * lp[1], c[2] + lp[2]],
        n: [cr * ln[0] - sr * ln[1], sr * ln[0] + cr * ln[1], ln[2]],
      };
    },
    col,
    a,
  );
};

/** a tube along a curve (t 0..1), radius r(t), with optional bead bumps (leaves of a garland) */
export const tube = (S: Sink, curve: (t: number) => V3, r: (t: number) => number, col: V3, a: Aux, seg = 24, radial = 10, ref: V3 = [0, 0, 1]) => {
  const P = Array.from({ length: seg + 1 }, (_, i) => curve(i / seg));
  grid(
    S,
    radial,
    seg,
    (u, v) => {
      const i = Math.round(v * seg);
      const p = P[i];
      const tg = norm(sub(P[Math.min(seg, i + 1)], P[Math.max(0, i - 1)]));
      let b = cross(tg, ref);
      if (Math.hypot(...b) < 1e-4) b = cross(tg, [0, 1, 0]);
      b = norm(b);
      const nn = norm(cross(b, tg));
      const ang = u * Math.PI * 2;
      const n = add(mul(nn, Math.cos(ang)), mul(b, Math.sin(ang)));
      return { p: add(p, mul(n, r(v))), n };
    },
    col,
    a,
  );
};

/** a smooth lathe about a vertical axis through (x, z): profile [radius, y] bottom -> top */
export const latheS = (S: Sink, prof: [number, number][], x: number, z: number, col: V3, a: Aux, seg = 20, half = false) => {
  const np = prof.length;
  const nrmAt = (i: number): [number, number] => {
    const p0 = prof[Math.max(0, i - 1)];
    const p1 = prof[Math.min(np - 1, i + 1)];
    const dy = p1[1] - p0[1];
    const dr = p1[0] - p0[0];
    const l = Math.hypot(dy, dr) || 1;
    return [dy / l, -dr / l];
  };
  grid(
    S,
    seg,
    np - 1,
    (u, v) => {
      const i = Math.round(v * (np - 1));
      const [rr, y] = prof[i];
      const [nr, ny] = nrmAt(i);
      const ang = half ? -Math.PI / 2 + u * Math.PI : u * Math.PI * 2;
      // ang 0 faces +z
      const s = Math.sin(ang);
      const c = Math.cos(ang);
      return { p: [x + rr * s, y, z + rr * c], n: norm([nr * s, ny, nr * c]) };
    },
    col,
    a,
  );
};

/** a profile in the (z, y) plane extruded along x from x0 to x1, with flat end caps; smooth normals along the profile
 *  where the turn between edges is under `crease` radians */
export const extrudeZY = (S: Sink, poly: [number, number][], x0: number, x1: number, col: V3, a: Aux, crease = 0.6, triangulate?: (pts: [number, number][]) => number[][]) => {
  const n = poly.length;
  // signed area to orient outward normals
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [z0, y0] = poly[i];
    const [z1, y1] = poly[(i + 1) % n];
    area += z0 * y1 - z1 * y0;
  }
  const sgn = area > 0 ? 1 : -1;
  const en = (i: number): [number, number] => {
    const [z0, y0] = poly[i];
    const [z1, y1] = poly[(i + 1) % n];
    const dz = z1 - z0;
    const dy = y1 - y0;
    const l = Math.hypot(dz, dy) || 1;
    // outward normal in (z, y)
    return [(sgn * dy) / l, (-sgn * dz) / l];
  };
  for (let i = 0; i < n; i++) {
    const nA = en(i);
    const nPrev = en((i - 1 + n) % n);
    const nNext = en((i + 1) % n);
    const angP = Math.acos(Math.max(-1, Math.min(1, nA[0] * nPrev[0] + nA[1] * nPrev[1])));
    const angN = Math.acos(Math.max(-1, Math.min(1, nA[0] * nNext[0] + nA[1] * nNext[1])));
    const n0 = angP < crease ? norm([0, nA[1] + nPrev[1], nA[0] + nPrev[0]]) : ([0, nA[1], nA[0]] as V3);
    const n1 = angN < crease ? norm([0, nA[1] + nNext[1], nA[0] + nNext[0]]) : ([0, nA[1], nA[0]] as V3);
    const [za, ya] = poly[i];
    const [zb, yb] = poly[(i + 1) % n];
    const i0 = S.vtx([x0, ya, za], n0, col, [x0, ya], a);
    const i1 = S.vtx([x1, ya, za], n0, col, [x1, ya], a);
    const i2 = S.vtx([x1, yb, zb], n1, col, [x1, yb], a);
    const i3 = S.vtx([x0, yb, zb], n1, col, [x0, yb], a);
    S.idx.push(i0, i1, i2, i0, i2, i3);
  }
  if (triangulate) {
    const tri = triangulate(poly);
    for (const side of [x0, x1]) {
      const nn: V3 = [side === x0 ? -1 : 1, 0, 0];
      const ids = poly.map(([z, y]) => S.vtx([side, y, z], nn, col, [z, y], a));
      for (const t of tri) S.idx.push(ids[t[0]], ids[t[1]], ids[t[2]]);
    }
  }
};

/** a relief slab: a 2D outline (x, y) lifted off the wall into a soft cushion of height h (a cartouche's field, a
 *  shield): z = h * cushion(distance to the edge) */
export const cushion = (S: Sink, cx: number, cy: number, rx: number, ry: number, h: number, col: V3, a: Aux, shape: (u: number, v: number) => number = (u, v) => 1 - Math.hypot(u, v), seg = 18) => {
  // u, v in -1..1; shape(u,v) > 0 inside (approx distance to the edge, 0..1)
  grid(
    S,
    seg,
    seg,
    (uu, vv) => {
      const u = uu * 2 - 1;
      const v = vv * 2 - 1;
      const e = 0.02;
      const zf = (U: number, V: number) => h * Math.sqrt(Math.max(0, Math.min(1, shape(U, V) * 2.2)));
      const z = zf(u, v);
      const dzu = (zf(u + e, v) - zf(u - e, v)) / (2 * e * rx);
      const dzv = (zf(u, v + e) - zf(u, v - e)) / (2 * e * ry);
      const inside = shape(u, v) > 0;
      return { p: [cx + u * rx, cy + v * ry, inside ? z : -0.02], n: norm([-dzu, -dzv, 1]) };
    },
    col,
    a,
  );
};

/** a vertical-axis cylinder / box helpers go through the world's GB.box; this is a small torus ring in the facade
 *  plane (a rosette, a scroll's eye) */
export const ring = (S: Sink, c: V3, R: number, r: number, col: V3, a: Aux, seg = 16) =>
  tube(S, (t) => [c[0] + R * Math.cos(t * Math.PI * 2), c[1] + R * Math.sin(t * Math.PI * 2), c[2]], () => r, col, a, seg, 8, [0, 0, 1]);

/** a volute: a flat spiral tube (the scroll of a console or a cartouche), turning `turns` from radius R0 inward */
export const volute = (S: Sink, c: V3, R0: number, turns: number, r: number, dir: 1 | -1, col: V3, a: Aux, plane: "xy" | "zy" = "zy", start = 0) =>
  tube(
    S,
    (t) => {
      const ang = start + dir * t * turns * Math.PI * 2;
      const R = R0 * (1 - 0.72 * t);
      return plane === "zy" ? [c[0], c[1] + R * Math.sin(ang), c[2] + R * Math.cos(ang)] : [c[0] + R * Math.cos(ang), c[1] + R * Math.sin(ang), c[2]];
    },
    (t) => r * (1 - 0.5 * t),
    col,
    a,
    40,
    8,
    plane === "zy" ? [1, 0, 0] : [0, 0, 1],
  );

/** a garland: a sagging rope of leaves between two points on the wall (a swag), plus hanging ribbon ends */
export const swag = (S: Sink, p0: V3, p1: V3, sag: number, r: number, col: V3, a: Aux, leaves = 9) => {
  const curve = (t: number): V3 => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t - sag * 4 * t * (1 - t), p0[2] + r * 0.6 + r * 0.9 * Math.sin(Math.PI * t)];
  // the body thickest in the middle
  tube(S, curve, (t) => r * (0.45 + 0.75 * Math.sin(Math.PI * t)), col, a, 36, 10);
  // leaf clusters along it
  for (let i = 1; i < leaves; i++) {
    const t = i / leaves;
    const c = curve(t);
    const rr = r * (0.55 + 0.6 * Math.sin(Math.PI * t));
    ellipsoid(S, [c[0], c[1] - rr * 0.2, c[2] + rr * 0.55], [rr * 0.95, rr * 0.75, rr * 0.7], col, a, 10, true);
  }
  // ribbon tails at both ends
  for (const p of [p0, p1]) {
    tube(S, (t) => [p[0] + (p === p0 ? -1 : 1) * 0.04 * Math.sin(t * 3), p[1] - t * sag * 1.6, p[2] + r * 0.4], (t) => r * 0.42 * (1 - 0.5 * t), col, a, 10, 8);
    ellipsoid(S, [p[0], p[1] + r * 0.2, p[2] + r * 0.5], [r * 0.7, r * 0.7, r * 0.6], col, a, 10, true);
  }
};

/** a lion's mask: a maned head in relief (tufts radiating, a broad brow over deep eyes, cheeks, a heavy muzzle, a
 *  ring in its mouth) */
export const lionMask = (S: Sink, c: V3, s: number, col: V3, colDk: V3, a: Aux) => {
  const h = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  // the mane: a thick ring of overlapping, curling tufts (longer below: the beard), an inner ruff
  const outer = 20;
  for (let i = 0; i < outer; i++) {
    const ang = (i / outer) * Math.PI * 2 + 0.1;
    const below = Math.max(0, -Math.sin(ang));
    const L = s * (0.2 + 0.06 * h(i) + 0.1 * below);
    const R = s * (0.6 + 0.08 * below);
    ellipsoid(S, [c[0] + R * Math.cos(ang), c[1] + R * Math.sin(ang) - 0.06 * s * below, c[2] + s * 0.1], [L, s * 0.15, s * 0.16], col, a, 10, true, ang + 0.35);
  }
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2 + 0.3;
    const R = s * 0.47;
    ellipsoid(S, [c[0] + R * Math.cos(ang), c[1] + R * Math.sin(ang), c[2] + s * 0.18], [s * 0.17, s * 0.14, s * 0.16], col, a, 10, true, ang + 0.4);
  }
  // the face: skull, brow ridge, eyes in shadow, cheeks, muzzle pads, a broad nose, an open mouth holding a ring
  ellipsoid(S, [c[0], c[1] + s * 0.02, c[2] + s * 0.16], [s * 0.42, s * 0.48, s * 0.3], col, a, 18, true);
  for (const k of [-1, 1]) {
    ellipsoid(S, [c[0] + k * s * 0.15, c[1] + s * 0.19, c[2] + s * 0.42], [s * 0.15, s * 0.06, s * 0.06], col, a, 10, true, -k * 0.25);
    ellipsoid(S, [c[0] + k * s * 0.15, c[1] + s * 0.09, c[2] + s * 0.425], [s * 0.075, s * 0.045, s * 0.025], colDk, a, 8, true, k * 0.2);
    ellipsoid(S, [c[0] + k * s * 0.23, c[1] - s * 0.1, c[2] + s * 0.36], [s * 0.13, s * 0.15, s * 0.12], col, a, 12, true);
    ellipsoid(S, [c[0] + k * s * 0.09, c[1] - s * 0.2, c[2] + s * 0.45], [s * 0.11, s * 0.09, s * 0.08], col, a, 12, true);
  }
  ellipsoid(S, [c[0], c[1] - s * 0.01, c[2] + s * 0.47], [s * 0.075, s * 0.17, s * 0.06], col, a, 10, true);
  ellipsoid(S, [c[0], c[1] - s * 0.11, c[2] + s * 0.52], [s * 0.11, s * 0.065, s * 0.05], col, a, 10, true);
  ellipsoid(S, [c[0], c[1] - s * 0.33, c[2] + s * 0.4], [s * 0.15, s * 0.07, s * 0.04], colDk, a, 10, true);
  tube(S, (t) => [c[0] + s * 0.19 * Math.sin(t * Math.PI * 2), c[1] - s * 0.56 + s * 0.22 * Math.cos(t * Math.PI * 2), c[2] + s * 0.42], () => s * 0.045, col, a, 22, 6);
};

/** a cartouche: an oval shield on a cushion, a rolled border, scrolls left and right, a shell above, a drop below */
export const cartouche = (S: Sink, c: V3, w: number, h: number, col: V3, a: Aux) => {
  const rx = w * 0.3;
  const ry = h * 0.36;
  // the field: a domed shield, solid (it may stand free against the sky on a roof)
  ellipsoid(S, [c[0], c[1], c[2]], [rx, ry, w * 0.1], col, a, 22, false);
  ellipsoid(S, [c[0], c[1], c[2] - w * 0.05], [rx * 1.12, ry * 1.1, w * 0.06], col, a, 18, false);
  tube(S, (t) => [c[0] + rx * 1.02 * Math.cos(t * Math.PI * 2), c[1] + ry * 1.02 * Math.sin(t * Math.PI * 2), c[2] + w * 0.03], () => w * 0.035, col, a, 40, 8);
  for (const k of [-1, 1] as const) {
    volute(S, [c[0] + k * rx * 1.25, c[1] + ry * 0.45, c[2] + w * 0.05], w * 0.13, 1.4, w * 0.04, k === 1 ? -1 : 1, col, a, "xy", k === 1 ? Math.PI : 0);
    volute(S, [c[0] + k * rx * 1.18, c[1] - ry * 0.5, c[2] + w * 0.05], w * 0.11, 1.3, w * 0.035, k === 1 ? 1 : -1, col, a, "xy", k === 1 ? Math.PI : 0);
    tube(S, (t) => [c[0] + k * (rx * 1.02 + w * 0.05 + w * 0.08 * Math.sin(t * Math.PI)), c[1] - ry * 0.5 + t * ry, c[2] + w * 0.04], () => w * 0.03, col, a, 12, 6);
  }
  // the shell: a fan of ribs above
  for (let i = 0; i < 7; i++) {
    const ang = Math.PI * (0.15 + (0.7 * i) / 6);
    const L = h * 0.2;
    tube(S, (t) => [c[0] + Math.cos(ang) * L * t, c[1] + ry * 0.95 + Math.sin(ang) * L * t, c[2] + w * 0.06 * (1 - t * 0.5)], (t) => w * (0.03 + 0.02 * Math.sin(Math.PI * t)), col, a, 8, 6);
  }
  // the drop below: three leaves
  ellipsoid(S, [c[0], c[1] - ry * 1.15, c[2] + w * 0.04], [w * 0.07, h * 0.08, w * 0.05], col, a, 10, true);
  for (const k of [-1, 1]) ellipsoid(S, [c[0] + k * w * 0.08, c[1] - ry * 1.1, c[2] + w * 0.03], [w * 0.06, h * 0.05, w * 0.04], col, a, 10, true);
};

/** a console bracket (the big scrolled modillion under a cornice): an S-profile body extruded across its width, a
 *  volute at each end of the profile on both faces, an acanthus leaf down its front. Top at y, projecting `proj`. */
export const consoleBracket = (S: Sink, x: number, y: number, wd: number, ht: number, proj: number, col: V3, a: Aux, tri: (pts: [number, number][]) => number[][]) => {
  // S-profile in (z, y): back at z = 0, top at y, foot at y - ht
  const pts: [number, number][] = [];
  const N = 14;
  // front edge: from the top front (proj) curving back to the foot (proj * 0.35)
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const zf = proj * (0.35 + 0.65 * (1 - t) + 0.12 * Math.sin(Math.PI * 2 * t));
    pts.push([zf, y - t * ht]);
  }
  pts.push([0, y - ht]);
  pts.push([0, y]);
  extrudeZY(S, pts.reverse(), x - wd / 2, x + wd / 2, col, a, 0.7, tri);
  // the scrolls: a big one at the top front, a small one at the foot, on both faces
  for (const sx of [x - wd / 2 - 0.005, x + wd / 2 + 0.005]) {
    volute(S, [sx, y - ht * 0.2, proj * 0.82], ht * 0.17, 1.6, ht * 0.03, 1, col, a, "zy", Math.PI * 0.5);
    volute(S, [sx, y - ht * 0.84, proj * 0.42], ht * 0.11, 1.5, ht * 0.025, -1, col, a, "zy", -Math.PI * 0.5);
  }
  // the acanthus leaf down the front
  for (let i = 0; i < 4; i++) {
    const t = 0.2 + i * 0.18;
    const zf = proj * (0.35 + 0.65 * (1 - t) + 0.12 * Math.sin(Math.PI * 2 * t));
    ellipsoid(S, [x, y - t * ht, zf + 0.01], [wd * 0.3, ht * 0.1, wd * 0.12], col, a, 10, true);
  }
};

/** egg-and-dart along x at height y on a moulding whose face is at z */
export const eggAndDart = (S: Sink, x0: number, x1: number, y: number, z: number, h: number, col: V3, a: Aux) => {
  const step = h * 1.25;
  for (let x = x0 + step / 2; x < x1; x += step) {
    ellipsoid(S, [x, y, z], [h * 0.42, h * 0.5, h * 0.3], col, a, 10, true);
    tube(S, (t) => [x + step / 2, y + h * 0.4 - t * h * 0.85, z + h * 0.08], (t) => h * 0.07 * (1 - t), col, a, 4, 5);
  }
};
export { dot };

/** a GIANT console (the Dorilton's storey-tall carved brackets under the main cornice): a tall body tapering from a
 *  deep scrolled head under the cornice to a narrow foot, a shield-and-scroll head on its front, a garland draped
 *  across its middle with hanging ends, a leaf drop and a moulded foot. Top at y, height ht, projecting proj. */
export const giantConsole = (S: Sink, x: number, y: number, wd: number, ht: number, proj: number, col: V3, colDk: V3, a: Aux, tri: (pts: [number, number][]) => number[][], body: Aux = a) => {
  const zf = (t: number) => proj * (0.42 + 0.58 * Math.pow(1 - t, 1.6) - 0.06 * Math.sin(Math.PI * t));
  const pts: [number, number][] = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push([zf(t), y - t * ht]);
  }
  pts.push([0, y - ht]);
  pts.push([0, y]);
  extrudeZY(S, pts.reverse(), x - wd / 2, x + wd / 2, col, body, 0.7, tri);
  // the head: big volutes on both sides, a shield cushion with a rolled rim and a shell on the front
  for (const sx of [x - wd / 2 - 0.01, x + wd / 2 + 0.01]) {
    volute(S, [sx, y - ht * 0.13, proj * 0.66], ht * 0.11, 1.5, ht * 0.022, 1, col, a, "zy", Math.PI * 0.5);
    volute(S, [sx, y - ht * 0.86, proj * 0.36], ht * 0.07, 1.4, ht * 0.018, -1, col, a, "zy", -Math.PI * 0.5);
  }
  const zh = zf(0.17) + 0.02;
  ellipsoid(S, [x, y - ht * 0.17, zh], [wd * 0.36, ht * 0.11, wd * 0.14], col, a, 14, true);
  tube(S, (t) => [x + wd * 0.38 * Math.cos(t * Math.PI * 2), y - ht * 0.17 + ht * 0.115 * Math.sin(t * Math.PI * 2), zh + wd * 0.02], () => wd * 0.045, col, a, 30, 6);
  for (let i = 0; i < 5; i++) {
    const ang = Math.PI * (0.2 + (0.6 * i) / 4);
    tube(S, (t) => [x + Math.cos(ang) * wd * 0.3 * t, y - ht * 0.06 + Math.sin(ang) * ht * 0.05 * t, zf(0.05) + 0.02], (t) => wd * (0.035 + 0.02 * Math.sin(Math.PI * t)), col, a, 6, 5);
  }
  // the garland draped across the front (from the side volutes), its ends hanging down the sides
  const tg = 0.42;
  const zg = zf(tg) + 0.04;
  tube(
    S,
    (t) => [x - wd * 0.62 + wd * 1.24 * t, y - ht * (tg - 0.04) - ht * 0.09 * Math.sin(Math.PI * t), zg + wd * 0.12 * Math.sin(Math.PI * t)],
    (t) => wd * (0.07 + 0.09 * Math.sin(Math.PI * t)),
    col,
    a,
    20,
    8,
  );
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    ellipsoid(S, [x - wd * 0.62 + wd * 1.24 * t, y - ht * (tg - 0.04) - ht * 0.09 * Math.sin(Math.PI * t) - wd * 0.02, zg + wd * 0.12 * Math.sin(Math.PI * t) + wd * 0.08], [wd * 0.11, wd * 0.09, wd * 0.07], col, a, 8, true);
  }
  for (const k of [-1, 1]) tube(S, (t) => [x + k * wd * 0.62, y - ht * (tg - 0.04) - t * ht * 0.22, zg - 0.02 - t * 0.05], (t) => wd * 0.07 * (1 - 0.4 * t), col, a, 8, 6);
  // a leaf drop below, a moulded foot
  for (let i = 0; i < 4; i++) {
    const t = 0.58 + i * 0.07;
    ellipsoid(S, [x, y - t * ht, zf(t) + 0.015], [wd * (0.16 - i * 0.02), ht * 0.035, wd * 0.07], col, a, 8, true);
  }
  ellipsoid(S, [x, y - ht * 0.88, zf(0.88) + 0.01], [wd * 0.3, ht * 0.025, wd * 0.08], colDk, a, 8, true);
};

/** acanthus scrolls flanking a cartouche on a roof cresting: a long leaf curling outward and down, ending in a
 *  volute; dir -1 to the left */
export const acanthusScroll = (S: Sink, x: number, y: number, z: number, len: number, dir: 1 | -1, col: V3, a: Aux) => {
  tube(S, (t) => [x + dir * len * t, y + len * 0.28 * Math.sin(Math.PI * t * 0.9) - len * 0.25 * t * t, z + 0.04 * Math.sin(Math.PI * t)], (t) => len * (0.08 - 0.04 * t), col, a, 20, 8);
  volute(S, [x + dir * len, y - len * 0.2, z], len * 0.16, 1.4, len * 0.04, dir === 1 ? -1 : 1, col, a, "xy", dir === 1 ? 0 : Math.PI);
  for (let i = 0; i < 4; i++) {
    const t = 0.15 + i * 0.2;
    ellipsoid(S, [x + dir * len * t, y + len * 0.28 * Math.sin(Math.PI * t * 0.9) - len * 0.25 * t * t + len * 0.07, z + 0.05], [len * 0.09, len * 0.05, len * 0.05], col, a, 8, true, dir * 0.6);
  }
};
