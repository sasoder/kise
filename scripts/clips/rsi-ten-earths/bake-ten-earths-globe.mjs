// Bakes THE EARTH GLOBE's static data for rsi-ten-earths (generated/components/rsi-ten-earths/tenEarthsGlobe.tsx):
//   bun scripts/clips/rsi-ten-earths/bake-ten-earths-globe.mjs
// Sources (installed, no download): node_modules/world-atlas land-110m.json (the land) and countries-110m.json
// (China = ISO numeric 156), read with topojson-client; d3-geo for point-in-polygon and the centroid.
// Writes generated/components/rsi-ten-earths/tenEarthsGlobeData.ts:
//   LAND, CHINA            GeoJSON MultiPolygons (0.01 deg)
//   CHINA_CENTROID         [lon, lat] (the tide's default seed and the ChinaLabel hook)
//   T_LAND_B64             per lattice point (tenEarthsGlobeMath.latticePoint), uint16 LE: when the LAND tide reaches it
//                          (cover units), T_NONE if the point is not in the land layer (land points + sea points within
//                          1.6 spacings of a coast, which take their nearest land point's T; the layer is clipped to land)
//   T_SEA_B64              per lattice point: when the SEA tide reaches it (sea units): from the coasts outward by
//                          distance to land; land points within 1.6 spacings of a coast get 0 (so the sea closes
//                          under the coast with no petrol slivers), inland points T_NONE
//   IS_CHINA_B64           a bitset (base64) of the lattice points inside China
// THE LAND TIDE (the brief: "~0.12 exactly China covered, the front at China's border then crossing it"): inside China
// s = dSeed / (dSeed + dBorder) (0 at the seed, 1 on the border, so the front is China's own shape shrunk about the
// seed), T = CHINA_T_MAX * s with a little noise; outside, T = WORLD_T0 + span * (geodesic distance to China / max)^0.85
// + noise, so the rest of the land starts only after China is full and the front leaves China's border everywhere.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoCentroid, geoContains } from "d3-geo";
import {
  CHINA_T_MAX,
  LATTICE_N,
  LATTICE_SPACING,
  SEA_T_MAX,
  T_NONE,
  T_SCALE,
  WORLD_T0,
  WORLD_T_MAX,
  angleBetween,
  hash01,
  latticePoint,
  sphereNoise,
  toLonLat,
  toXYZ,
} from "../../../generated/components/rsi-ten-earths/tenEarthsGlobeMath.ts";

const t0 = Date.now();
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-110m.json", "utf8"));
const coTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const landFC = feature(landTopo, landTopo.objects.land);
const landGeom = landFC.features[0].geometry;
const china = feature(coTopo, coTopo.objects.countries).features.find((f) => f.id === "156");
if (!china) throw new Error("China (156) not found");
const round = (c) => c.map((poly) => poly.map((ring) => ring.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100])));
const LAND = { type: "MultiPolygon", coordinates: round(landGeom.coordinates) };
const CHINA = { type: "MultiPolygon", coordinates: round(china.geometry.coordinates) };
const centroid = geoCentroid(china);
const seed = toXYZ(centroid[0], centroid[1]);

// densified ring samples (unit vectors), step <= stepDeg
const samples = (geom, stepDeg) => {
  const out = [];
  for (const poly of geom.coordinates)
    for (const ring of poly)
      for (let i = 0; i < ring.length - 1; i++) {
        const a = toXYZ(ring[i][0], ring[i][1]);
        const b = toXYZ(ring[i + 1][0], ring[i + 1][1]);
        const ang = angleBetween(a, b);
        const n = Math.max(1, Math.ceil(ang / ((stepDeg * Math.PI) / 180)));
        for (let k = 0; k < n; k++) {
          const t = k / n;
          const q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
          const m = Math.hypot(q[0], q[1], q[2]);
          out.push(q[0] / m, q[1] / m, q[2] / m);
        }
      }
  return new Float64Array(out);
};
const coast = samples(LAND, 0.4);
const border = samples(CHINA, 0.25);
const minAngle = (p, S) => {
  let best = -2;
  for (let j = 0; j < S.length; j += 3) {
    const d = p[0] * S[j] + p[1] * S[j + 1] + p[2] * S[j + 2];
    if (d > best) best = d;
  }
  return Math.acos(Math.min(1, best));
};

const N = LATTICE_N;
const P = Array.from({ length: N }, (_, i) => latticePoint(i, N));
const LL = P.map(toLonLat);
// point in polygon: world-atlas 2 stitches its rings across the antimeridian (Russia, Fiji) and around the pole
// (Antarctica), so those polygons go through d3 geoContains (spherical); every other polygon through a planar even-odd
// ray cast in lon/lat with each ring's bbox first (~40x faster than geoContains on the whole land, same answer:
// checked against the all-spherical bake, 0 points differ; rerun with --check-spherical).
const crosses = (poly) => poly.some((ring) => ring.some((q, i) => i > 0 && Math.abs(q[0] - ring[i - 1][0]) > 180) || ring.some((q) => q[1] < -85));
const ringsOf = (polys) =>
  polys.flatMap((poly) =>
    poly.map((ring) => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const [x, y] of ring) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y));
      return { ring, x0, x1, y0, y1 };
    }),
  );
const inside = (rings, [x, y]) => {
  let c = false;
  for (const R of rings) {
    if (x < R.x0 || x > R.x1 || y < R.y0 || y > R.y1) continue;
    const q = R.ring;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      const [xi, yi] = q[i];
      const [xj, yj] = q[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
};
const LAND_SPH = { type: "MultiPolygon", coordinates: LAND.coordinates.filter(crosses) };
const LAND_R = ringsOf(LAND.coordinates.filter((q) => !crosses(q)));
const CHINA_R = ringsOf(CHINA.coordinates);
const isLand = new Uint8Array(N);
const isChina = new Uint8Array(N);
for (let i = 0; i < N; i++) {
  isLand[i] = inside(LAND_R, LL[i]) || geoContains(LAND_SPH, LL[i]) ? 1 : 0;
  if (isLand[i]) isChina[i] = inside(CHINA_R, LL[i]) ? 1 : 0;
}
if (process.argv.includes("--check-spherical")) {
  let diff = 0;
  for (let i = 0; i < N; i++) if ((geoContains(LAND, LL[i]) ? 1 : 0) !== isLand[i]) diff++;
  console.log(`planar vs spherical land test: ${diff} of ${N} differ`);
}
console.log(`classified ${N} points in ${Date.now() - t0} ms: land ${isLand.reduce((a, b) => a + b, 0)}, China ${isChina.reduce((a, b) => a + b, 0)}`);

const dCoast = new Float64Array(N);
for (let i = 0; i < N; i++) dCoast[i] = minAngle(P[i], coast);
const COASTAL = 1.6 * LATTICE_SPACING;

// the land tide
const T = new Float64Array(N).fill(-1);
const dChina = new Float64Array(N);
let dChinaMax = 0;
for (let i = 0; i < N; i++) {
  if (!isLand[i]) continue;
  if (isChina[i]) continue;
  dChina[i] = minAngle(P[i], border);
  dChinaMax = Math.max(dChinaMax, dChina[i]);
}
for (let i = 0; i < N; i++) {
  if (!isLand[i]) continue;
  const n = sphereNoise(P[i]);
  const jit = hash01(i * 0.37 + 9.1);
  if (isChina[i]) {
    const ds = angleBetween(P[i], seed);
    const db = minAngle(P[i], border);
    const s = ds / (ds + db + 1e-9);
    const sN = Math.max(0, Math.min(1, s + 0.16 * n * 4 * s * (1 - s) + 0.04 * (jit - 0.5) * s * (1 - s) * 4));
    T[i] = CHINA_T_MAX * sN;
  } else {
    const q = dChina[i] / dChinaMax;
    const span = WORLD_T_MAX - WORLD_T0 - 0.04;
    T[i] = WORLD_T0 + span * Math.pow(q, 0.85) + 0.03 * (n + 1) * 0.5 * Math.min(1, q * 12) + 0.008 * jit;
  }
}
// coastal sea points take their nearest land point's T (the land layer is clipped to the land path)
const landIdx = [];
for (let i = 0; i < N; i++) if (isLand[i]) landIdx.push(i);
const TL = new Uint16Array(N).fill(T_NONE);
const TS = new Uint16Array(N).fill(T_NONE);
let dSeaMax = 0;
for (let i = 0; i < N; i++) if (!isLand[i]) dSeaMax = Math.max(dSeaMax, dCoast[i]);
for (let i = 0; i < N; i++) {
  if (isLand[i]) {
    TL[i] = Math.round(T[i] * T_SCALE);
    if (dCoast[i] < COASTAL) TS[i] = 0;
    continue;
  }
  // sea
  const n = sphereNoise([P[i][2], P[i][0], P[i][1]]);
  const q = dCoast[i] / dSeaMax;
  const ts = Math.max(0, Math.min(SEA_T_MAX, SEA_T_MAX * 0.86 * Math.pow(q, 0.7) + 0.13 * (n + 1) * 0.5 * Math.min(1, q * 6) + 0.02 * hash01(i * 0.53 + 2.2)));
  TS[i] = Math.round(ts * T_SCALE);
  if (dCoast[i] < COASTAL) {
    let best = -2;
    let bi = -1;
    for (const j of landIdx) {
      const d = P[i][0] * P[j][0] + P[i][1] * P[j][1] + P[i][2] * P[j][2];
      if (d > best) {
        best = d;
        bi = j;
      }
    }
    TL[i] = Math.round(T[bi] * T_SCALE);
  }
}
let chinaMax = 0;
let worldMin = 1;
let worldMax = 0;
for (let i = 0; i < N; i++) {
  if (!isLand[i]) continue;
  if (isChina[i]) chinaMax = Math.max(chinaMax, T[i]);
  else {
    worldMin = Math.min(worldMin, T[i]);
    worldMax = Math.max(worldMax, T[i]);
  }
}
const b64 = (u16) => Buffer.from(u16.buffer, u16.byteOffset, u16.byteLength).toString("base64");
const bits = new Uint8Array(Math.ceil(N / 8));
for (let i = 0; i < N; i++) if (isChina[i]) bits[i >> 3] |= 1 << (i & 7);
const out = `// GENERATED by scripts/clips/rsi-ten-earths/bake-ten-earths-globe.mjs (do not edit by hand; rerun the bake).
// Sources: node_modules/world-atlas land-110m.json + countries-110m.json (China = 156), Natural Earth 1:110m.
// Lattice: tenEarthsGlobeMath.latticePoint(i, ${N}). Land tide T: China ${0}..${chinaMax.toFixed(4)}, rest of the land
// ${worldMin.toFixed(4)}..${worldMax.toFixed(4)}; sea tide 0..${SEA_T_MAX}. Max distance land -> China ${((dChinaMax * 180) / Math.PI).toFixed(1)} deg,
// max sea -> coast ${((dSeaMax * 180) / Math.PI).toFixed(1)} deg.
export const CHINA_CENTROID: [number, number] = [${centroid[0].toFixed(3)}, ${centroid[1].toFixed(3)}];
export const LAND_T_RANGE = { china: [0, ${chinaMax.toFixed(5)}], world: [${worldMin.toFixed(5)}, ${worldMax.toFixed(5)}] } as const;
export const LAND: { type: "MultiPolygon"; coordinates: number[][][][] } = ${JSON.stringify(LAND)};
export const CHINA: { type: "MultiPolygon"; coordinates: number[][][][] } = ${JSON.stringify(CHINA)};
export const T_LAND_B64 = "${b64(TL)}";
export const T_SEA_B64 = "${b64(TS)}";
export const IS_CHINA_B64 = "${Buffer.from(bits).toString("base64")}";
`;
writeFileSync("generated/components/rsi-ten-earths/tenEarthsGlobeData.ts", out);
console.log(`China T max ${chinaMax.toFixed(4)}, world ${worldMin.toFixed(4)}..${worldMax.toFixed(4)}; wrote ${(out.length / 1024).toFixed(0)} KB in ${Date.now() - t0} ms`);
