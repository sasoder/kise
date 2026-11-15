// tenEarthsGlobeMath: the pure maths shared by the globe's bake (scripts/clips/rsi-ten-earths/bake-ten-earths-globe.mjs)
// and its runtime (tenEarthsGlobe.tsx): the population lattice on the sphere and the tide's smooth noise. No React, so
// bun can import it. Cartesian convention = d3-geo's: X = cos(lat) cos(lon), Y = cos(lat) sin(lon), Z = sin(lat).

export const D2R = Math.PI / 180;
/** the population lattice: N jittered Fibonacci points over the whole sphere (one dot = one patch of AIs) */
export const LATTICE_N = 40000;
/** the mean nearest-neighbour spacing of the lattice on the unit sphere (hexagonal cells) */
export const LATTICE_SPACING = Math.sqrt((8 * Math.PI) / (Math.sqrt(3) * LATTICE_N));

export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export type V3 = [number, number, number];
export const toXYZ = (lon: number, lat: number): V3 => {
  const l = lon * D2R;
  const f = lat * D2R;
  return [Math.cos(f) * Math.cos(l), Math.cos(f) * Math.sin(l), Math.sin(f)];
};
export const toLonLat = (p: V3): [number, number] => [Math.atan2(p[1], p[0]) / D2R, Math.asin(Math.max(-1, Math.min(1, p[2]))) / D2R];
/** the angle (radians) between two unit vectors */
export const angleBetween = (a: V3, b: V3) => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));

/** lattice point i (unit vector): Fibonacci spiral, jittered by up to 0.38 spacing in the tangent plane (breaks the
 *  spiral rows so the dots read as a population, not a pattern) */
export const latticePoint = (i: number, N = LATTICE_N): V3 => {
  const GA = Math.PI * (3 - Math.sqrt(5));
  const z = 1 - (2 * i + 1) / N;
  const rr = Math.sqrt(Math.max(0, 1 - z * z));
  const th = i * GA;
  const p: V3 = [rr * Math.cos(th), rr * Math.sin(th), z];
  // tangent basis
  const ex: V3 = [-Math.sin(th), Math.cos(th), 0];
  const ey: V3 = [-z * Math.cos(th), -z * Math.sin(th), rr];
  const a = hash01(i * 1.7 + 0.3) * 2 * Math.PI;
  const m = 0.38 * LATTICE_SPACING * Math.sqrt(hash01(i * 3.1 + 5.9));
  const dx = Math.cos(a) * m;
  const dy = Math.sin(a) * m;
  const q: V3 = [p[0] + ex[0] * dx + ey[0] * dy, p[1] + ex[1] * dx + ey[1] * dy, p[2] + ex[2] * dx + ey[2] * dy];
  const n = Math.hypot(q[0], q[1], q[2]);
  return [q[0] / n, q[1] / n, q[2] / n];
};

/** a smooth noise on the unit sphere, about -1..1: a sum of sinusoids along fixed directions (seek-safe, cheap) */
const NOISE_WAVES: { d: V3; f: number; ph: number; a: number }[] = (() => {
  const out: { d: V3; f: number; ph: number; a: number }[] = [];
  for (let k = 0; k < 9; k++) {
    const u = hash01(k * 11.3 + 1.1) * 2 - 1;
    const t = hash01(k * 7.7 + 2.9) * 2 * Math.PI;
    const s = Math.sqrt(1 - u * u);
    const f = [3.5, 5, 7, 9.5, 12, 15, 19, 24, 30][k];
    out.push({ d: [s * Math.cos(t), s * Math.sin(t), u], f, ph: hash01(k * 5.3 + 4.4) * 2 * Math.PI, a: 1 / Math.pow(f, 0.55) });
  }
  const sum = out.reduce((acc, w) => acc + w.a, 0);
  return out.map((w) => ({ ...w, a: (w.a / sum) * 1.9 }));
})();
export const sphereNoise = (p: V3) => {
  let v = 0;
  for (const w of NOISE_WAVES) v += w.a * Math.sin(w.f * (w.d[0] * p[0] + w.d[1] * p[1] + w.d[2] * p[2]) + w.ph);
  return Math.max(-1, Math.min(1, v));
};

/** the tide's timing constants (cover units): China fills over [0, CHINA_T_MAX] and each patch grows over LAND_W, so
 *  China is exactly covered at CHINA_COVERED; the rest of the land starts at WORLD_T0 */
export const CHINA_T_MAX = 0.095;
export const LAND_W = 0.025;
export const CHINA_COVERED = CHINA_T_MAX + LAND_W;
export const WORLD_T0 = 0.122;
export const WORLD_T_MAX = 0.972;
/** the sea's timing (sea units): patches grow over SEA_W, the farthest ocean arrives at SEA_T_MAX */
export const SEA_W = 0.07;
export const SEA_T_MAX = 0.93;
/** uint16 coding of a T (0..1); NONE = the point is not in that layer */
export const T_NONE = 65535;
export const T_SCALE = 65000;
