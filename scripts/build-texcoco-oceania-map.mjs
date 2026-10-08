// Bakes the Oceania map for MinorityInOwnCountry (Sheppard "Texcoco", cut E):
// Australia and New Zealand on one north-up Lambert conformal conic, plus the
// dot slots (where every unit of people stands in the final state).
//
//   bun scripts/build-texcoco-oceania-map.mjs
//
// Writes
//   generated/components/oceaniaMapData.ts   ports, dot slots, the raster's rect
//   public/oceania/wide.png                  the static map stack (resvg)
//
// PROJECTION: Lambert conformal conic, parallels 18 S / 36 S, centre meridian
// 150 E (Natural Earth 10m land from world-atlas). World px == screen px at
// camera k 1 (the cut itself runs at k 1.47 ... 1.63): Australia's westernmost point at x 26, New
// Zealand's East Cape at x 1056, Tasmania's south at y ~1000. True relative
// positions and sizes; no state borders are drawn at all.
//
// THE DOTS (final state; shares, not one common scale between the countries):
//   Australia    19 orange + 481 cream = 500  -> 3.8 %  (ABS, 30 June 2021:
//                983,700 Aboriginal and Torres Strait Islander people, 3.8 %)
//   New Zealand  18 orange + 83 cream = 101   -> 17.8 % (Stats NZ, 2023 Census:
//                887,493 people of Maori descent/ethnicity, 17.8 %)
// Australia's orange slots are hand-placed (lon, lat); New Zealand's are picked among its
// evenly relaxed slots, spread as far apart as possible (12 North Island, 6 South Island). Cream slots are a density-weighted
// centroidal Voronoi relaxation over the land mask: dense at the colonial ports
// and the south-east, sparse in the arid interior (a softened picture of real
// settlement; it is not a census map). NZ is filled close to evenly, because
// 101 dots only fit its land at ~9 px pitch.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { geoConicConformal, geoGraticule, geoPath } from "d3-geo";
import { feature } from "topojson-client";

const OUT = "generated/components/oceaniaMapData.ts";
const TEX_DIR = "public/oceania";

const N_AUS = 500;
const N_AUS_ORANGE = 19;
const N_NZ = 101;
const N_NZ_ORANGE = 18;
const NZ_NORTH = 48; // dots on the North Island (12 orange), the rest on the South Island (6 orange)

// -- projection ----------------------------------------------------------------
const X_WEST = 26; // Steep Point
const X_EAST = 1056; // East Cape
const Y_TAS_SOUTH = 1000;
const projection = geoConicConformal().parallels([-18, -36]).rotate([-150, 0]).center([0, -28]);
projection.scale(1).translate([0, 0]);
const W_PT = [113.15, -26.15];
const E_PT = [178.55, -37.69];
const S_PT = [146.8, -43.64];
{
  const a = projection(W_PT);
  const b = projection(E_PT);
  projection.scale((X_EAST - X_WEST) / (b[0] - a[0]));
  const a2 = projection(W_PT);
  const s2 = projection(S_PT);
  projection.translate([X_WEST - a2[0], Y_TAS_SOUTH - s2[1]]);
}
const RECT = { x0: -40, x1: 1120, y0: 20, y1: 1640 };
projection.clipExtent([
  [RECT.x0 - 60, RECT.y0 - 60],
  [RECT.x1 + 60, RECT.y1 + 60],
]);
const P = (lon, lat) => projection([lon, lat]);
const r2 = (v) => Math.round(v * 100) / 100;

// -- a rounding path sink --------------------------------------------------------
const MIN_STEP = 0.2;
const sinkOf = () => {
  let out = "";
  let px = 0;
  let py = 0;
  const n = (v) => {
    const r = Math.round(v * 20) / 20;
    return Object.is(r, -0) ? 0 : r;
  };
  return {
    moveTo(x, y) {
      px = x;
      py = y;
      out += `M${n(x)},${n(y)}`;
    },
    lineTo(x, y) {
      if (Math.hypot(x - px, y - py) < MIN_STEP) {
        return;
      }
      px = x;
      py = y;
      out += `L${n(x)},${n(y)}`;
    },
    closePath() {
      out += "Z";
    },
    result: () => out,
  };
};
const bake = (geo) => {
  const s = sinkOf();
  geoPath(projection, s)(geo);
  return s.result();
};
/** projected rings (px) of a geometry */
const ringsOf = (geo) => {
  const rings = [];
  let cur = null;
  geoPath(projection, {
    moveTo(x, y) {
      cur = [[x, y]];
      rings.push(cur);
    },
    lineTo(x, y) {
      cur.push([x, y]);
    },
    closePath() {},
  })(geo);
  return rings;
};

// -- geometry ------------------------------------------------------------------
const VIEW = { lon: [90, 200], lat: [-62, 12] };
const ringBox = (ring) => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const [lon, lat] of ring) {
    x0 = Math.min(x0, lon);
    x1 = Math.max(x1, lon);
    y0 = Math.min(y0, lat);
    y1 = Math.max(y1, lat);
  }
  return [x0, x1, y0, y1];
};
const keep = (geometry, view) => {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  const kept = polys.filter((rings) => {
    const [x0, x1, y0, y1] = ringBox(rings[0]);
    // specks (under ~9 px) would only print as bullseyes of water-lines
    if (Math.hypot(x1 - x0, y1 - y0) < 0.5) return false;
    return x1 >= view.lon[0] && x0 <= view.lon[1] && y1 >= view.lat[0] && y0 <= view.lat[1] && x1 - x0 < 180;
  });
  return kept.length ? { type: "MultiPolygon", coordinates: kept } : null;
};
const landTopo = JSON.parse(readFileSync("node_modules/world-atlas/land-10m.json", "utf8"));
const land = feature(landTopo, landTopo.objects.land);
const landGeometry = { type: "GeometryCollection", geometries: land.features.map((f) => keep(f.geometry, VIEW)).filter(Boolean) };
const LAND_D = bake(landGeometry);

const cTopo = JSON.parse(readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const countries = feature(cTopo, cTopo.objects.countries).features;
const within = (geometry, box) => {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return {
    type: "MultiPolygon",
    coordinates: polys.filter((rings) => {
      const [x0, x1, y0, y1] = ringBox(rings[0]);
      return x0 >= box[0] && x1 <= box[1] && y0 >= box[2] && y1 <= box[3];
    }),
  };
};
const AUS = within(countries.find((f) => f.properties.name === "Australia").geometry, [112, 154.5, -44.2, -10]);
const NZ = within(countries.find((f) => f.properties.name === "New Zealand").geometry, [166, 179, -47.6, -34]);

const graticule = geoGraticule()
  .extent([
    [80, -75],
    [215, 20],
  ])
  .step([10, 10])
  .precision(0.5)();
const GRAT_D = bake(graticule);

// -- masks: even-odd scanline fill of the projected rings, 1 px cells -------------
const GW = 1100;
const GH = 1200;
const maskOf = (geo) => {
  const m = new Uint8Array(GW * GH);
  const rings = ringsOf(geo);
  for (let y = 0; y < GH; y++) {
    const yc = y + 0.5;
    const xs = [];
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i];
        const b = ring[(i + 1) % ring.length];
        if (a[1] <= yc === b[1] <= yc) continue;
        xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.max(0, Math.ceil(xs[i] - 0.5));
      const xb = Math.min(GW - 1, Math.floor(xs[i + 1] - 0.5));
      for (let x = xa; x <= xb; x++) m[y * GW + x] = 1;
    }
  }
  return m;
};
/** distance to the coast inside the mask (chamfer, px) */
const inlandOf = (m) => {
  const d = new Float32Array(GW * GH);
  const BIG = 1e6;
  for (let i = 0; i < d.length; i++) d[i] = m[i] ? BIG : 0;
  const pass = (x, y, dx, dy, c) => {
    const xx = x + dx;
    const yy = y + dy;
    if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) return;
    const v = d[yy * GW + xx] + c;
    if (v < d[y * GW + x]) d[y * GW + x] = v;
  };
  for (let y = 0; y < GH; y++)
    for (let x = 0; x < GW; x++) {
      pass(x, y, -1, 0, 1);
      pass(x, y, 0, -1, 1);
      pass(x, y, -1, -1, 1.414);
      pass(x, y, 1, -1, 1.414);
    }
  for (let y = GH - 1; y >= 0; y--)
    for (let x = GW - 1; x >= 0; x--) {
      pass(x, y, 1, 0, 1);
      pass(x, y, 0, 1, 1);
      pass(x, y, 1, 1, 1.414);
      pass(x, y, -1, 1, 1.414);
    }
  return d;
};
const ausMask = maskOf(AUS);
const nzMask = maskOf(NZ);
const ausInland = inlandOf(ausMask);
const count = (m) => m.reduce((s, v) => s + v, 0);

// -- rng ---------------------------------------------------------------------------
const rngOf = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// -- places --------------------------------------------------------------------------
const PORTS_LL = {
  sydney: [151.3, -33.86],
  hobart: [147.42, -43.02],
  melbourne: [144.9, -38.1],
  brisbane: [153.3, -27.35],
  adelaide: [138.35, -34.95],
  perth: [115.68, -32.05],
  auckland: [174.95, -36.75],
  wellington: [174.85, -41.38],
  christchurch: [172.85, -43.6],
  dunedin: [170.75, -45.88],
};
const PORTS = Object.fromEntries(Object.entries(PORTS_LL).map(([k, ll]) => [k, P(...ll).map(r2)]));

// the original peoples: more in the north, the centre and along the east
const AUS_ORANGE_LL = [
  [125.8, -17.3], // Kimberley
  [119.2, -22.6], // Pilbara
  [133.6, -13.4], // Arnhem Land
  [130.9, -16.4], // Victoria River
  [134.2, -19.8], // Tennant Creek
  [133.4, -24.2], // Alice Springs
  [126.6, -26.0], // Western Desert
  [142.6, -13.6], // Cape York
  [139.6, -18.9], // the Gulf
  [145.2, -17.6], // Cairns hinterland
  [141.6, -23.3], // western Queensland
  [147.6, -22.6], // central Queensland
  [150.9, -27.3], // south-east Queensland
  [146.0, -30.6], // western New South Wales
  [149.8, -33.2], // behind Sydney
  [143.4, -36.6], // Victoria
  [136.2, -30.6], // South Australia
  [118.0, -31.4], // the south-west
  [146.6, -42.0], // Tasmania
];
if (AUS_ORANGE_LL.length !== N_AUS_ORANGE) throw new Error("orange counts");

/** nudge a point to the nearest mask cell at least `inset` px inside the coast */
const snapInside = (p, inland, inset) => {
  const [x, y] = p;
  {
    const xi = Math.round(x - 0.5);
    const yi = Math.round(y - 0.5);
    if (xi >= 0 && yi >= 0 && xi < GW && yi < GH && inland[yi * GW + xi] >= inset) return [x, y];
  }
  let best = null;
  let bd = Infinity;
  for (let dy = -30; dy <= 30; dy++)
    for (let dx = -30; dx <= 30; dx++) {
      const xx = Math.round(x - 0.5) + dx;
      const yy = Math.round(y - 0.5) + dy;
      if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue;
      if (inland[yy * GW + xx] < inset) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = [xx + 0.5, yy + 0.5];
      }
    }
  if (!best) throw new Error(`no land near ${p}`);
  return best;
};

// -- Australia: settlement density (relative) ---------------------------------------
const G = (lon, lat, amp, sig) => {
  const [x, y] = P(lon, lat);
  return { x, y, amp, s2: 2 * Math.pow(sig * 17.2, 2) }; // ~17.2 px per degree
};
const AUS_HILLS = [
  G(151.0, -33.8, 3.0, 2.1), // Sydney
  G(145.0, -37.7, 2.8, 2.1), // Melbourne
  G(152.8, -27.4, 2.3, 1.9), // Brisbane
  G(116.0, -32.2, 2.0, 1.9), // Perth
  G(138.7, -34.8, 1.7, 1.7), // Adelaide
  G(147.0, -42.2, 2.6, 1.3), // Hobart
  G(148.5, -35.0, 1.1, 3.0), // inland New South Wales
  G(146.5, -32.5, 0.75, 5.5), // the Murray-Darling
  G(150.3, -23.5, 0.8, 2.2), // Rockhampton
  G(146.7, -19.4, 0.8, 1.8), // Townsville
  G(145.6, -17.0, 0.6, 1.5), // Cairns
  G(131.0, -12.8, 0.7, 1.5), // Darwin
  G(117.5, -32.5, 0.6, 3.5), // the south-west
];
const ausDensity = (x, y, inland) => {
  let v = 0.105 + 0.1 * Math.exp(-inland / 22);
  for (const h of AUS_HILLS) v += h.amp * Math.exp(-((x - h.x) ** 2 + (y - h.y) ** 2) / h.s2);
  return v;
};

// -- weighted centroidal Voronoi relaxation over a mask ------------------------------
/** fixed sites stay; n free sites are seeded by density and relaxed. weight ~ density^2 gives pitch ~ density^-1/2 */
const relax = ({ mask, inland, fixed, n, density, inset, step, iters, seed, minPitch }) => {
  const rnd = rngOf(seed);
  const cells = [];
  for (let y = 0; y < GH; y += step)
    for (let x = 0; x < GW; x += step) {
      const i = y * GW + x;
      if (!mask[i] || inland[i] < inset) continue;
      const w = density(x + 0.5, y + 0.5, inland[i]);
      cells.push([x + 0.5, y + 0.5, w]);
    }
  // seed: density-proportional draws
  let total = 0;
  for (const c of cells) total += c[2];
  const free = [];
  while (free.length < n) {
    let t = rnd() * total;
    let pick = cells[cells.length - 1];
    for (const c of cells) {
      t -= c[2];
      if (t <= 0) {
        pick = c;
        break;
      }
    }
    free.push([pick[0] + rnd() - 0.5, pick[1] + rnd() - 0.5]);
  }
  const sites = [...fixed.map((p) => [p[0], p[1]]), ...free];
  const nf = fixed.length;
  const N = sites.length;
  for (let it = 0; it < iters; it++) {
    const sx = new Float64Array(N);
    const sy = new Float64Array(N);
    const sw = new Float64Array(N);
    for (const [cx, cy, w] of cells) {
      let b = 0;
      let bd = Infinity;
      for (let i = 0; i < N; i++) {
        const dx = sites[i][0] - cx;
        const dy = sites[i][1] - cy;
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          b = i;
        }
      }
      const ww = w * w;
      sx[b] += cx * ww;
      sy[b] += cy * ww;
      sw[b] += ww;
    }
    for (let i = nf; i < N; i++) {
      if (sw[i] > 0) sites[i] = [sx[i] / sw[i], sy[i] / sw[i]];
      else {
        // an empty cell: re-seed it
        const c = cells[Math.floor(rnd() * cells.length)];
        sites[i] = [c[0], c[1]];
      }
    }
    // keep a minimum pitch: push close pairs apart (fixed sites do not move)
    for (let rep = 0; rep < 4; rep++) {
      for (let i = 0; i < N; i++)
        for (let j = Math.max(i + 1, nf); j < N; j++) {
          const dx = sites[j][0] - sites[i][0];
          const dy = sites[j][1] - sites[i][1];
          const d = Math.hypot(dx, dy) || 1e-6;
          const need = i < nf ? minPitch.fixed : minPitch.free;
          if (d >= need) continue;
          const push = (need - d) / (i < nf ? 1 : 2);
          const ux = dx / d;
          const uy = dy / d;
          sites[j] = [sites[j][0] + ux * push, sites[j][1] + uy * push];
          if (i >= nf) sites[i] = [sites[i][0] - ux * push, sites[i][1] - uy * push];
        }
      for (let i = nf; i < N; i++) {
        const xi = Math.round(sites[i][0] - 0.5);
        const yi = Math.round(sites[i][1] - 0.5);
        if (xi < 0 || yi < 0 || xi >= GW || yi >= GH || inland[yi * GW + xi] < inset) sites[i] = snapInside(sites[i], inland, inset);
      }
    }
  }
  // last: nothing closer than the pitch, everything on land
  for (let rep = 0; rep < 400; rep++) {
    let moved = false;
    for (let i = 0; i < N; i++)
      for (let j = Math.max(i + 1, nf); j < N; j++) {
        const dx = sites[j][0] - sites[i][0];
        const dy = sites[j][1] - sites[i][1];
        const d = Math.hypot(dx, dy) || 1e-6;
        const need = (i < nf ? minPitch.fixed : minPitch.free) * 0.97;
        if (d >= need) continue;
        moved = true;
        const push = (need - d + 0.05) / (i < nf ? 1 : 2);
        sites[j] = snapInside([sites[j][0] + (dx / d) * push, sites[j][1] + (dy / d) * push], inland, inset);
        if (i >= nf) sites[i] = snapInside([sites[i][0] - (dx / d) * push, sites[i][1] - (dy / d) * push], inland, inset);
      }
    if (!moved) break;
  }
  return sites.slice(nf);
};
const nearest = (pts) => {
  let m = Infinity;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) m = Math.min(m, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]));
  return m;
};

// Australia
const ausOrange = AUS_ORANGE_LL.map((ll) => snapInside(P(...ll), ausInland, 7));
const ausCream = relax({
  mask: ausMask,
  inland: ausInland,
  fixed: ausOrange,
  n: N_AUS - N_AUS_ORANGE,
  density: ausDensity,
  inset: 4.5,
  step: 2,
  iters: 70,
  seed: 4311,
  minPitch: { fixed: 15.5, free: 11.6 },
});

// New Zealand: the two main islands as the two largest connected pieces of the mask
const label = new Int32Array(GW * GH);
const sizes = [0];
for (let i = 0; i < nzMask.length; i++) {
  if (!nzMask[i] || label[i]) continue;
  const id = sizes.length;
  let n = 0;
  const stack = [i];
  label[i] = id;
  while (stack.length) {
    const c = stack.pop();
    n++;
    const x = c % GW;
    for (const nb of [c - 1, c + 1, c - GW, c + GW]) {
      if (nb < 0 || nb >= label.length || !nzMask[nb] || label[nb]) continue;
      if (Math.abs((nb % GW) - x) > 1) continue;
      label[nb] = id;
      stack.push(nb);
    }
  }
  sizes.push(n);
}
const big = sizes
  .map((n, id) => [n, id])
  .sort((a, b) => b[0] - a[0])
  .slice(0, 2);
const islandMask = (id) => {
  const m = new Uint8Array(GW * GH);
  for (let i = 0; i < m.length; i++) m[i] = label[i] === id ? 1 : 0;
  return m;
};
const nzSeed = P(175.0, -37.3); // a point on the North Island
const northId = label[Math.round(nzSeed[1]) * GW + Math.round(nzSeed[0])];
const southId = big.map((b) => b[1]).find((id) => id !== northId);
if (!northId || !big.some((b) => b[1] === northId)) throw new Error("North Island not found");
/** one island: every dot relaxed to an even pitch, then the orange ones picked among them, spread as far apart as possible */
const nzIsland = (id, total, nOrange, firstLL, seed) => {
  const m = islandMask(id);
  const inl = inlandOf(m);
  const sites = relax({
    mask: m,
    inland: inl,
    fixed: [],
    n: total,
    density: () => 1,
    inset: 2.6,
    step: 1,
    iters: 90,
    seed,
    minPitch: { fixed: 8.2, free: 8.2 },
  });
  const f = P(...firstLL);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const picked = [sites.map((p, i) => [d2(p, f), i]).sort((a, b) => a[0] - b[0])[0][1]];
  while (picked.length < nOrange) {
    let best = -1;
    let bd = -1;
    sites.forEach((p, i) => {
      if (picked.includes(i)) return;
      const d = Math.min(...picked.map((j) => d2(p, sites[j])));
      if (d > bd) {
        bd = d;
        best = i;
      }
    });
    picked.push(best);
  }
  return { fixed: picked.map((i) => sites[i]), cream: sites.filter((_, i) => !picked.includes(i)), area: count(m) };
};
// more of the orange on the North Island: 12 of its 48 dots, 6 of the South Island's 53
const nzN = nzIsland(northId, NZ_NORTH, 12, [173.9, -35.6], 77);
const nzS = nzIsland(southId, N_NZ - NZ_NORTH, 6, [173.0, -41.6], 91);
const nzOrange = [...nzN.fixed, ...nzS.fixed];
const nzCream = [...nzN.cream, ...nzS.cream];
if (nzOrange.length !== N_NZ_ORANGE) throw new Error(`NZ orange on the two islands: ${nzOrange.length}`);

const report = {
  pxPerKm: r2(Math.hypot(P(150, -30)[0] - P(151, -30)[0], P(150, -30)[1] - P(151, -30)[1]) / 96.5),
  ausWidthPx: r2(P(153.64, -28.64)[0] - X_WEST),
  ausLandPx: count(ausMask),
  nzLandPx: count(nzMask),
  nzNorthPx: nzN.area,
  nzSouthPx: nzS.area,
  aus: { orange: ausOrange.length, cream: ausCream.length, minPitch: r2(nearest([...ausOrange, ...ausCream])) },
  nz: { orange: nzOrange.length, cream: nzCream.length, minPitch: r2(nearest([...nzOrange, ...nzCream])) },
  ports: PORTS,
};
console.log(JSON.stringify(report, null, 1));

const pts = (a) => JSON.stringify(a.map(([x, y]) => [r2(x), r2(y)]));
const S = 2.1;
const W = Math.ceil((RECT.x1 - RECT.x0) * S);
const H = Math.ceil((RECT.y1 - RECT.y0) * S);
const body = `// GENERATED by scripts/build-texcoco-oceania-map.mjs. Do not edit by hand.
// Lambert conformal conic, parallels 18 S / 36 S, centre meridian 150 E; world px == screen px at camera k 1.
export type Pt = [number, number];

/** the baked static map (public/): world rect and texels per world px */
export const WIDE = { src: "oceania/wide.png", x0: ${RECT.x0}, y0: ${RECT.y0}, W: ${W}, H: ${H}, s: ${S} };

/** the colonial ports, in the order of their founding in each country */
export const PORTS: Record<${Object.keys(PORTS)
  .map((k) => `"${k}"`)
  .join(" | ")}, Pt> = ${JSON.stringify(PORTS)};

/** Australia: 19 orange + 481 cream = 500 (3.8 %) */
export const AUS_ORANGE: Pt[] = ${pts(ausOrange)};
export const AUS_CREAM: Pt[] = ${pts(ausCream)};
/** New Zealand: 18 orange + 83 cream = 101 (17.8 %) */
export const NZ_ORANGE: Pt[] = ${pts(nzOrange)};
export const NZ_CREAM: Pt[] = ${pts(nzCream)};
/** the first NZ_CREAM_NORTH of NZ_CREAM stand on the North Island */
export const NZ_CREAM_NORTH = ${nzN.cream.length};

/** label anchors (sea beside each country) */
export const ANCHORS: Record<string, Pt> = ${JSON.stringify({
  bight: P(129, -37.5).map(r2),
  northCape: P(172.7, -34.4).map(r2),
  eastCape: P(...E_PT).map(r2),
  stewart: P(167.9, -47.2).map(r2),
  tasSouth: P(...S_PT).map(r2),
  capeYork: P(142.5, -10.7).map(r2),
  newCaledonia: P(165.5, -21.3).map(r2),
})};
`;
writeFileSync(OUT, body);
console.log(`Wrote ${OUT}: land path ${LAND_D.length} chars`);

// -- the static map stack, baked once ---------------------------------------------------
const SEA = "#1B2226";
const LAND = "#3F3428";
const LAND_RIM = "#6A5838";
const INK = "#E9DDBF";
const mix = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
// line weights are drawn for the cut's zoom (k 1.47 ... 1.63)
const KB = 1.55;
const wlGap = 6.5 / KB;
const wlOp = [0.3, 0.2, 0.12, 0.065];
let wl = "";
for (let i = 3; i >= 0; i--) {
  const d = wlGap * (i + 1);
  wl += `<path d="${LAND_D}" fill="none" stroke="${mix(SEA, INK, wlOp[i])}" stroke-width="${2 * d + 1.15 / KB}" stroke-linejoin="round"/>`;
  wl += `<path d="${LAND_D}" fill="none" stroke="${SEA}" stroke-width="${2 * d - 1.15 / KB}" stroke-linejoin="round"/>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${RECT.x0} ${RECT.y0} ${W / S} ${H / S}">
<defs><clipPath id="land"><path d="${LAND_D}" clip-rule="evenodd"/></clipPath></defs>
<rect x="-5000" y="-5000" width="12000" height="14000" fill="${SEA}"/>
${wl}
<path d="${GRAT_D}" fill="none" stroke="${INK}" stroke-opacity="0.12" stroke-width="${1.2 / KB}"/>
<path d="${LAND_D}" fill="${LAND}" fill-rule="evenodd"/>
<g clip-path="url(#land)">
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.2" stroke-width="${28 / KB}" stroke-linejoin="round"/>
  <path d="${LAND_D}" fill="none" stroke="${LAND_RIM}" stroke-opacity="0.28" stroke-width="${10 / KB}" stroke-linejoin="round"/>
  <path d="${GRAT_D}" fill="none" stroke="${INK}" stroke-opacity="0.07" stroke-width="${1.2 / KB}"/>
</g>
<path d="${LAND_D}" fill="none" stroke="${INK}" stroke-opacity="0.82" stroke-width="${1.5 / KB}" stroke-linejoin="round"/>
</svg>`;
mkdirSync(TEX_DIR, { recursive: true });
const png = new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
writeFileSync(`${TEX_DIR}/wide.png`, png);
console.log(`Wrote ${TEX_DIR}/wide.png ${W}x${H}`);
