// The Sarah Paine Gulf War clip's map (sarah-gulf-war): southern Iraq, Kuwait, northern Saudi Arabia and the head of
// the Persian Gulf laid as a GROUND PLANE under a perspective camera (gulfMapWorld.tsx draws these tiles in WebGL, the
// medMapWorld / RodentFromCentralAsia pattern). Built with cut 12 (InvadedKuwaitForOil), reused by cut 26.
//
//   bun scripts/maps/build.mjs scripts/maps/configs/gulf.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/gulf.mjs      (alone: nothing else heavy running)
//
// GULF  north-up Lambert conformal conic, parallels 28.5 / 31 N, centre meridian 47.8 E. 3.6 deg of longitude at
//       29.5 N (46.0..49.6 E) span 349 world px: ~1 km per world px. THE ORIGIN, Kuwait City (47.98 E, 29.37 N),
//       sits at world (0, 0). Natural Earth 10m land; the modern borders (Iraq-Kuwait, Kuwait-Saudi Arabia,
//       Iraq-Saudi Arabia, Iraq-Iran) are exported as vectors (BORDERS) for the world to draw dashed in world space,
//       not baked. The Shatt al-Arab is NOT in Natural Earth's land: its course is exported (SHATT) from hand-placed
//       waypoints at town coordinates (approximate) for the ground shader.
//
// Exports (gulfMapData.ts): ORIGIN, PLACES, ROAD (Basra -> Safwan -> Abdali -> Mutla -> Jahra -> Kuwait City, the
// Highway 80 corridor, approximate), SHATT (polyline), BORDERS (world px polylines by pair), FIELDS (the oil fields as
// honest soft blobs at their approximate centroids and extents), MASK_BOX + MASK_LAND_D (the land as one path for the
// shader's river mask), EXTENT, LAND_AT (on-land checks of every place, printed by the build).
import { mesh } from "topojson-client";
import { naturalEarth, thinLine } from "../lib/geo.mjs";
import { mpD, roundPts, routeOf } from "../lib/data.mjs";

const ORIGIN_LL = [47.98, 29.37];

/** places (lon, lat). Field centroids: approximate (the brief's list, checked against the fields' published maps) */
const PLACES = {
  kuwaitCity: ORIGIN_LL,
  basra: [47.81, 30.51],
  safwan: [47.71, 30.11],
  abdali: [47.72, 30.02],
  mutla: [47.67, 29.5],
  jahra: [47.67, 29.34],
  ahmadi: [48.08, 29.08],
  fao: [48.47, 29.98],
  bubiyan: [48.25, 29.8],
  // fields
  burgan: [47.95, 28.95],
  minagish: [47.55, 29.05],
  ummGudair: [47.65, 28.85],
  raudhatain: [47.68, 29.85],
  sabriya: [47.85, 29.8],
  rumaila: [47.35, 30.3],
  westQurna: [47.3, 31.0],
  zubair: [47.65, 30.35],
  majnoon: [47.6, 31.1],
};

// the road: the Basra - Safwan - Abdali - Mutla ridge - Jahra - Kuwait City corridor (Highway 80; approximate)
const ROAD_LL = [
  ["basra", 47.81, 30.51],
  ["r1", 47.75, 30.4],
  ["r2", 47.72, 30.25],
  ["safwan", 47.71, 30.11],
  ["abdali", 47.715, 30.02],
  ["r3", 47.705, 29.86],
  ["r4", 47.685, 29.66],
  ["mutla", 47.672, 29.5],
  ["jahra", 47.68, 29.355],
  ["r5", 47.78, 29.31],
  ["r6", 47.88, 29.325],
  ["kuwaitCity", 47.975, 29.355],
];
// the Shatt al-Arab: Qurna (the Tigris-Euphrates confluence) -> Basra -> Khorramshahr -> Fao -> the Gulf (approximate)
const SHATT_LL = [
  [47.43, 31.0],
  [47.52, 30.85],
  [47.66, 30.68],
  [47.8, 30.56],
  [47.86, 30.5],
  [47.98, 30.45],
  [48.15, 30.42],
  [48.27, 30.3],
  [48.37, 30.15],
  [48.45, 30.02],
  [48.52, 29.93],
  [48.58, 29.88],
];

/** the oil fields: centre (lon, lat), semi-axes along / across (km), the long axis' bearing (deg), a shape seed.
 *  Extents are approximate (honest soft blobs, not survey outlines). Kuwait: Greater Burgan (the world's second
 *  largest field), Minagish, Umm Gudair, Raudhatain, Sabriya. Iraq: Rumaila (straddles the border; its southern tip
 *  reaches into Kuwait), West Qurna, Zubair, Majnoon. */
const FIELDS_DEF = {
  burgan: { country: "kuwait", c: PLACES.burgan, a: 16, b: 8.5, brg: -12, seed: 1 },
  minagish: { country: "kuwait", c: PLACES.minagish, a: 7.5, b: 4.2, brg: 8, seed: 2 },
  ummGudair: { country: "kuwait", c: PLACES.ummGudair, a: 8, b: 3.8, brg: -4, seed: 3 },
  raudhatain: { country: "kuwait", c: PLACES.raudhatain, a: 7.5, b: 3.8, brg: 10, seed: 4 },
  sabriya: { country: "kuwait", c: PLACES.sabriya, a: 7, b: 3.6, brg: 22, seed: 5 },
  rumaila: { country: "iraq", c: [47.36, 30.27], a: 36, b: 8.5, brg: -8, seed: 6 },
  westQurna: { country: "iraq", c: PLACES.westQurna, a: 18, b: 6.5, brg: -6, seed: 7 },
  zubair: { country: "iraq", c: PLACES.zubair, a: 15, b: 5.5, brg: -35, seed: 8 },
  majnoon: { country: "iraq", c: PLACES.majnoon, a: 20, b: 7.5, brg: 4, seed: 9 },
};

const BORDER_PAIRS = {
  iraqKuwait: ["Iraq", "Kuwait"],
  kuwaitSaudi: ["Kuwait", "Saudi Arabia"],
  iraqSaudi: ["Iraq", "Saudi Arabia"],
  iraqIran: ["Iraq", "Iran"],
};

const MASK_BOX = { x0: -150, y0: -220, x1: 110, y1: 30 };

/** Sutherland-Hodgman: a ring clipped to a world px box */
const clipRingBox = (ring, r) => {
  const edges = [
    [(q) => q[0] >= r.x0, (a, b) => [r.x0, a[1] + ((b[1] - a[1]) * (r.x0 - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= r.x1, (a, b) => [r.x1, a[1] + ((b[1] - a[1]) * (r.x1 - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= r.y0, (a, b) => [a[0] + ((b[0] - a[0]) * (r.y0 - a[1])) / (b[1] - a[1]), r.y0]],
    [(q) => q[1] <= r.y1, (a, b) => [a[0] + ((b[0] - a[0]) * (r.y1 - a[1])) / (b[1] - a[1]), r.y1]],
  ];
  let pts = ring;
  for (const [inside, cut] of edges) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b)) out.push(cut(a, b));
    }
    pts = out;
    if (pts.length < 3) return null;
  }
  return pts;
};

/** world px per km at a lon/lat (east, north) */
const pxPerKm = (W, [lon, lat]) => {
  const d = 0.05;
  const a = W.proj([lon - d, lat]);
  const b = W.proj([lon + d, lat]);
  const km = 111.32 * Math.cos((lat * Math.PI) / 180) * 2 * d;
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / km;
};
/** a field blob: a noisy ellipse in world px (deterministic), long axis on bearing brg (0 = north) */
const blobOf = (W, f) => {
  const [cx, cy] = W.proj(f.c);
  const s = pxPerKm(W, f.c);
  const br = (f.brg * Math.PI) / 180;
  const ax = [Math.sin(br), -Math.cos(br)];
  const ac = [Math.cos(br), Math.sin(br)];
  const ph = [1.7, 2.9, 4.1, 0.6].map((p) => p * f.seed);
  // the rim: r(t) = 1 + 0.1 sin(2t + w0) + 0.07 sin(3t + w1) + 0.045 sin(5t + w2) + 0.025 sin(7t + w3) (the shader's twin)
  const N = 48;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const wob = 1 + 0.1 * Math.sin(2 * t + ph[0]) + 0.07 * Math.sin(3 * t + ph[1]) + 0.045 * Math.sin(5 * t + ph[2]) + 0.025 * Math.sin(7 * t + ph[3]);
    const u = Math.cos(t) * f.a * s * wob;
    const v = Math.sin(t) * f.b * s * wob;
    pts.push([cx + ax[0] * u + ac[0] * v, cy + ax[1] * u + ac[1] * v]);
  }
  return { centre: [cx, cy], pts, axis: ax, a: f.a * s, b: f.b * s, wob: ph.map((p) => Math.round((p % (Math.PI * 2)) * 1e4) / 1e4) };
};

export default {
  name: "gulfmap",
  dataDir: "generated/components/sarah-gulf-war",
  tileDir: "public/sarah-gulf-war/gulfmap",
  textures: "public/manchuria",
  worlds: {
    gulf: {
      projection: { kind: "lcc", parallels: [28.5, 31], rotate: -47.8, scale: { span: [[46, 29.5], [49.6, 29.5]], px: 349 }, anchor: [ORIGIN_LL, [0, 0]] },
      clip: { lon: [38, 58], lat: [20, 38] },
      landStep: 0.08,
      regionStep: 0.5,
      graticule: 0,
      lakes: [],
      borders: { pairs: [] },
      regions: () => ({}),
      data: {
        file: "gulfMapData.ts",
        comment:
          "Southern Iraq, Kuwait and the head of the Persian Gulf for sarah-gulf-war (cuts 12 InvadedKuwaitForOil, 26):\nnorth-up LCC 28.5/31 N, centre meridian 47.8 E, ~1 km per world px; the origin (47.98 E, 29.37 N, Kuwait City)\nat (0, 0). gulfMapWorld lays this world on a ground plane: 3D X = world x, height Y up, Zm = world y (north recedes).",
        types: ["P2", "LL", "RouteData", "export type Field = { country: \"kuwait\" | \"iraq\"; centre: P2; pts: P2[]; axis: P2; a: number; b: number; wob: number[] };"],
        exports: [
          { name: "ORIGIN", value: (c) => c.W.proj(ORIGIN_LL).map((v) => Math.round(v * 1000) / 1000), type: ": P2", doc: "Kuwait City (47.98 E, 29.37 N)" },
          { name: "PLACES", places: PLACES, type: ": Record<string, P2>" },
          { name: "ROAD", route: ROAD_LL, per: 24, thin: 0.25, doc: "Basra -> Safwan -> Abdali -> Mutla ridge -> Jahra -> Kuwait City (Highway 80 corridor; approximate)" },
          { name: "SHATT", value: (c) => roundPts(routeOf(c.W, SHATT_LL.map((q, i) => [`s${i}`, q[0], q[1]]), { per: 10, thin: 0.3 }).pts), type: ": P2[]", doc: "the Shatt al-Arab, Qurna -> the Gulf (approximate)" },
          {
            name: "BORDERS",
            value: (c) => {
              const { cTopo } = naturalEarth("10m");
              const out = {};
              for (const [k, [p, q]] of Object.entries(BORDER_PAIRS)) {
                const ml = mesh(cTopo, cTopo.objects.countries, (a, b) => a !== b && ((a.properties.name === p && b.properties.name === q) || (a.properties.name === q && b.properties.name === p)));
                out[k] = ml.coordinates.map((line) => roundPts(thinLine(line.map((ll) => c.W.proj(ll)), 0.3))).filter((l) => l.length > 1);
                console.log(`  border ${k}: ${out[k].length} lines, ${out[k].reduce((s, l) => s + l.length, 0)} pts`);
              }
              return out;
            },
            type: ": Record<\"iraqKuwait\" | \"kuwaitSaudi\" | \"iraqSaudi\" | \"iraqIran\", P2[][]>",
            doc: "Natural Earth 10m shared borders (world px polylines)",
          },
          {
            name: "FIELDS",
            value: (c) =>
              Object.fromEntries(
                Object.entries(FIELDS_DEF).map(([k, f]) => {
                  const b = blobOf(c.W, f);
                  const off = b.pts.filter((q) => !c.coast.isLand(q[0], q[1])).length;
                  console.log(`  field ${k}: centre ${b.centre.map((v) => v.toFixed(1))} ${c.coast.isLand(...b.centre) ? "land" : "SEA"}, ${off} of ${b.pts.length} rim pts off land`);
                  return [k, { country: f.country, centre: roundPts([b.centre])[0], pts: roundPts(b.pts), axis: b.axis.map((v) => Math.round(v * 1e4) / 1e4), a: Math.round(b.a * 100) / 100, b: Math.round(b.b * 100) / 100, wob: b.wob }];
                }),
              ),
            type: ": Record<\"burgan\" | \"minagish\" | \"ummGudair\" | \"raudhatain\" | \"sabriya\" | \"rumaila\" | \"westQurna\" | \"zubair\" | \"majnoon\", Field>",
            doc: "the oil fields as soft blobs (world px; approximate centroids and extents): Kuwait's five and Iraq's southern four",
          },
          { name: "MASK_BOX", value: MASK_BOX, type: ": { x0: number; y0: number; x1: number; y1: number }", doc: "the world box of MASK_LAND_D (the ground shader's river mask)" },
          {
            name: "MASK_LAND_D",
            value: (c) => {
              const mp = [];
              for (const poly of c.land) {
                const b = poly.box;
                if (b[2] < MASK_BOX.x0 || b[0] > MASK_BOX.x1 || b[3] < MASK_BOX.y0 || b[1] > MASK_BOX.y1) continue;
                const rings = poly.rings.map((r) => clipRingBox(r, { x0: MASK_BOX.x0 - 2, y0: MASK_BOX.y0 - 2, x1: MASK_BOX.x1 + 2, y1: MASK_BOX.y1 + 2 })).filter(Boolean);
                if (rings.length) mp.push(rings.map((r) => r.filter((_, i) => i % 2 === 0 || r.length < 60)));
              }
              return mpD(mp);
            },
            type: ": string",
            doc: "the land inside MASK_BOX as one path (evenodd): the river mask's clip",
          },
          {
            name: "LAND_AT",
            value: (c) => {
              const o = {};
              for (const [k, ll] of Object.entries(PLACES)) {
                const [x, y] = c.W.proj(ll);
                o[k] = c.coast.isLand(x, y);
              }
              for (const [n, lon, lat] of ROAD_LL) {
                const [x, y] = c.W.proj([lon, lat]);
                o[`road:${n}`] = c.coast.isLand(x, y);
              }
              console.log("  LAND_AT", JSON.stringify(o));
              return o;
            },
            type: ": Record<string, boolean>",
            doc: "on-land checks of every place and road station (the build prints them)",
          },
          {
            name: "EXTENT",
            value: (c) => {
              const pts = [];
              for (let lon = 40.5; lon <= 55; lon += 0.5) for (const lat of [23, 35.5]) pts.push(c.W.proj([lon, lat]));
              for (let lat = 23; lat <= 35.5; lat += 0.5) for (const lon of [40.5, 55]) pts.push(c.W.proj([lon, lat]));
              return { x0: Math.round(Math.min(...pts.map((q) => q[0]))), x1: Math.round(Math.max(...pts.map((q) => q[0]))), y0: Math.round(Math.min(...pts.map((q) => q[1]))), y1: Math.round(Math.max(...pts.map((q) => q[1]))) };
            },
            type: ": { x0: number; x1: number; y0: number; y1: number }",
            doc: "the world box the base level covers (40.5..55 E, 23..35.5 N)",
          },
        ],
      },
      levels: [
        { name: "g0", s: 1.2, kBake: 0.8, band: null, rects: [{ lon: [40.5, 55], lat: [23, 35.5] }] },
        { name: "g1", s: 4, kBake: 2.8, band: [1.7, 2.6], rects: [{ lon: [44.8, 50.6], lat: [27, 32.2] }] },
        { name: "g2", s: 13, kBake: 9, band: [5.2, 7.6], rects: [{ lon: [46.3, 49.0], lat: [28.25, 31.4] }] },
        { name: "g3", s: 40, kBake: 27, band: [16, 24], rects: [{ lon: [47.3, 48.3], lat: [29.1, 30.4] }] },
      ],
    },
  },
};
