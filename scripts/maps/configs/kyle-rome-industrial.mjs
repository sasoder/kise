// The Kyle Harper "Why Rome never had an industrial revolution" clip's map (kyle-rome-industrial): the whole
// Mediterranean laid as a GROUND PLANE under a perspective camera (medMapWorld.tsx draws these tiles in WebGL, the
// RodentFromCentralAsia pattern). Built with cut 45 (WheatForGlass), reused by cut 56 (HubsOfExchange).
//
//   bun scripts/maps/build.mjs scripts/maps/configs/kyle-rome-industrial.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/kyle-rome-industrial.mjs      (alone: nothing else heavy running)
//
// MED  north-up Lambert conformal conic, parallels 33 / 43 N, centre meridian 18 E. 42 deg of longitude at 36 N
//      (6 W..36 E) span 3783 world px: ~1 km per world px. THE ORIGIN, (29.90 E, 31.20 N), the Great Harbour of
//      Alexandria, sits at world (0, 0). No modern borders, no graticule (period-neutral). Period water: the Dead Sea
//      (Natural Earth 10m lakes). The Nile is NOT in Natural Earth's land: its course and the delta's fertile fan are
//      exported as vectors (NILE, DELTA) from hand-placed waypoints at town coordinates (approximate, the modern
//      Rosetta and Damietta branches standing for the ancient delta's seven) and drawn by the world's ground shader.
//
// Exports (medMapData.ts): ORIGIN, PLACES, NILE (polylines), DELTA (the fertile fan, a polygon; the shader clips it
// to land), ROUTES (sea lanes Alexandria -> Sidon, Alexandria -> Tyre, Alexandria -> Ostia, as RouteData),
// ALEX_COAST (the coast's point and direction at the origin, for the quay), EXTENT.
import { loadFeatures, polysOf } from "../lib/geo.mjs";
import { mpD, routeOf, roundPts } from "../lib/data.mjs";

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
/** the box of the fertile-land mask (the Nile from Thebes to the sea, Alexandria, the Sinai coast) */
const MASK_BOX = { x0: -60, y0: -120, x1: 520, y1: 660 };

const lakeRings = [];
for (const f of loadFeatures("scripts/maps/data/sugar-lakes.geojson")) {
  if (f.properties.name !== "Dead Sea") continue;
  for (const rings of polysOf(f.geometry)) lakeRings.push(rings[0]);
}

const ORIGIN_LL = [29.9, 31.2];

const PLACES = {
  alexandria: ORIGIN_LL,
  pharos: [29.885, 31.214],
  sidon: [35.37, 33.56],
  tyre: [35.195, 33.27],
  antioch: [36.16, 36.2],
  seleucia: [35.93, 36.12],
  ostia: [12.29, 41.75],
  rome: [12.48, 41.89],
  carthage: [10.33, 36.85],
  ephesus: [27.34, 37.94],
  athens: [23.73, 37.97],
  piraeus: [23.64, 37.94],
  memphis: [31.25, 29.85],
  thebes: [32.64, 25.7],
  deltaApex: [31.13, 30.18],
};

// the Nile: the main stream from Aswan to the delta's apex, then the Rosetta and Damietta branches to the sea
const NILE_LL = {
  main: [
    [32.9, 24.09],
    [32.87, 24.98],
    [32.55, 25.29],
    [32.64, 25.7],
    [32.72, 26.16],
    [32.24, 26.05],
    [31.7, 26.56],
    [31.18, 27.18],
    [30.75, 28.1],
    [31.1, 29.07],
    [31.25, 29.85],
    [31.23, 30.05],
    [31.13, 30.18],
  ],
  rosetta: [
    [31.13, 30.18],
    [30.95, 30.45],
    [30.8, 30.82],
    [30.65, 31.13],
    [30.42, 31.4],
    [30.36, 31.48],
  ],
  damietta: [
    [31.13, 30.18],
    [31.18, 30.47],
    [31.24, 30.71],
    [31.38, 31.04],
    [31.81, 31.42],
    [31.86, 31.53],
  ],
};
// the delta's fertile fan (generous at the coast: the shader keeps only its land)
const DELTA_LL = [
  [31.13, 30.12],
  [30.85, 30.4],
  [30.55, 30.75],
  [30.3, 31.05],
  [30.12, 31.3],
  [30.2, 31.6],
  [31.0, 31.75],
  [31.95, 31.7],
  [32.2, 31.3],
  [31.95, 30.9],
  [31.55, 30.5],
  [31.3, 30.22],
];
// sea lanes (stations: name, lon, lat), kept on open water
const ROUTES_LL = {
  alexSidon: [
    ["alexandria", 29.9, 31.26],
    ["a1", 31.0, 31.95],
    ["a2", 33.2, 32.95],
    ["a3", 34.6, 33.45],
    ["sidon", 35.33, 33.58],
  ],
  alexTyre: [
    ["alexandria", 29.9, 31.26],
    ["t1", 31.0, 31.9],
    ["t2", 33.2, 32.8],
    ["t3", 34.6, 33.2],
    ["tyre", 35.16, 33.28],
  ],
  alexOstia: [
    ["alexandria", 29.9, 31.26],
    ["o1", 28.5, 32.6],
    ["o2", 25.5, 34.3],
    ["o3", 21.0, 35.6],
    ["o4", 17.5, 36.9],
    ["o5", 15.62, 38.1],
    ["o6", 14.6, 39.4],
    ["o7", 12.9, 40.9],
    ["ostia", 12.24, 41.72],
  ],
};

/** the coast at the origin: the nearest coast point and the coast's direction there (unit, world px), the sea side */
const alexCoast = (c) => {
  const [ox, oy] = c.W.proj(ORIGIN_LL);
  const land = (x, y) => c.coast.isLand(x, y);
  // march on rays from the origin to find coast crossings in all directions, then fit a line through the nearest ones
  const hits = [];
  for (let a = 0; a < 360; a += 3) {
    const dx = Math.cos((a * Math.PI) / 180);
    const dy = Math.sin((a * Math.PI) / 180);
    const l0 = land(ox, oy);
    for (let r = 0.05; r < 30; r += 0.05) {
      if (land(ox + dx * r, oy + dy * r) !== l0) {
        hits.push([ox + dx * r, oy + dy * r, r]);
        break;
      }
    }
  }
  hits.sort((a, b) => a[2] - b[2]);
  const near = hits.slice(0, 24);
  const mx = near.reduce((s, h) => s + h[0], 0) / near.length;
  const my = near.reduce((s, h) => s + h[1], 0) / near.length;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const [x, y] of near) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    syy += (y - my) ** 2;
  }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  let dir = [Math.cos(ang), Math.sin(ang)];
  // the sea side: the normal pointing off land
  let nrm = [-dir[1], dir[0]];
  if (land(mx + nrm[0] * 3, my + nrm[1] * 3)) nrm = [-nrm[0], -nrm[1]];
  if (dir[0] < 0) dir = [-dir[0], -dir[1]];
  const r3 = (v) => Math.round(v * 1000) / 1000;
  console.log(`  ALEX_COAST: origin on ${land(ox, oy) ? "land" : "sea"}, nearest coast ${hits[0][2].toFixed(2)} px, dir ${dir.map(r3)}, sea ${nrm.map(r3)}`);
  return { at: [r3(hits[0][0]), r3(hits[0][1])], mid: [r3(mx), r3(my)], dir: dir.map(r3), sea: nrm.map(r3), originOnLand: land(ox, oy) };
};

export default {
  name: "medmap",
  dataDir: "generated/components/kyle-rome-industrial",
  tileDir: "public/kyle-rome-industrial/medmap",
  textures: "public/manchuria",
  worlds: {
    med: {
      projection: { kind: "lcc", parallels: [33, 43], rotate: -18, scale: { span: [[-6, 36], [36, 36]], px: 3783 }, anchor: [ORIGIN_LL, [0, 0]] },
      clip: { lon: [-40, 75], lat: [0, 70] },
      landStep: 0.1,
      regionStep: 0.5,
      graticule: 0,
      lakes: lakeRings,
      borders: { pairs: [] },
      regions: () => ({}),
      data: {
        file: "medMapData.ts",
        comment:
          "The Mediterranean for kyle-rome-industrial (cuts 45 WheatForGlass, 56 HubsOfExchange): north-up LCC 33/43 N,\ncentre meridian 18 E, 42 deg of longitude at 36 N = 3783 world px (~1 km per world px); the origin (29.90 E,\n31.20 N, Alexandria's Great Harbour) at (0, 0). medMapWorld lays this world on a ground plane: 3D X = world x,\nheight Y up, Zm = world y (north recedes).",
        types: ["P2", "LL", "RouteData"],
        exports: [
          { name: "ORIGIN", value: (c) => c.W.proj(ORIGIN_LL).map((v) => Math.round(v * 1000) / 1000), type: ": P2", doc: "Alexandria's Great Harbour (29.90 E, 31.20 N)" },
          { name: "PLACES", places: PLACES, type: ": Record<string, P2>" },
          {
            name: "NILE",
            value: (c) => Object.fromEntries(Object.entries(NILE_LL).map(([k, pts]) => [k, roundPts(routeOf(c.W, pts.map((q, i) => [`n${i}`, q[0], q[1]]), { per: 10, thin: 0.6 }).pts)])),
            type: ": Record<\"main\" | \"rosetta\" | \"damietta\", P2[]>",
            doc: "the Nile's course (approximate: hand-placed waypoints at town coordinates, smoothed): main Aswan -> the delta's apex, then the Rosetta and Damietta branches",
          },
          { name: "DELTA", value: (c) => roundPts(DELTA_LL.map((q) => c.W.proj(q))), type: ": P2[]", doc: "the delta's fertile fan (a polygon, generous at the coast; clip it to land)" },
          {
            name: "ROUTES",
            value: (c) => Object.fromEntries(Object.entries(ROUTES_LL).map(([k, st]) => [k, routeOf(c.W, st, { per: 24, thin: 0.5 })])),
            type: ": Record<\"alexSidon\" | \"alexTyre\" | \"alexOstia\", RouteData>",
            doc: "sea lanes on open water (centripetal Catmull-Rom through the stations, with arclengths)",
          },
          {
            name: "MASK_BOX",
            value: MASK_BOX,
            type: ": { x0: number; y0: number; x1: number; y1: number }",
            doc: "the world box of MASK_LAND_D (the ground shader's fertile-land mask)",
          },
          {
            name: "MASK_LAND_D",
            value: (c) => {
              const mp = [];
              for (const poly of c.land) {
                const b = poly.box;
                if (b[2] < MASK_BOX.x0 || b[0] > MASK_BOX.x1 || b[3] < MASK_BOX.y0 || b[1] > MASK_BOX.y1) continue;
                const rings = poly.rings.map((r) => clipRingBox(r, { x0: MASK_BOX.x0 - 2, y0: MASK_BOX.y0 - 2, x1: MASK_BOX.x1 + 2, y1: MASK_BOX.y1 + 2 })).filter(Boolean);
                if (rings.length) mp.push(rings.map((r) => r.filter((_, i) => i % 3 === 0 || r.length < 60)));
              }
              return mpD(mp);
            },
            type: ": string",
            doc: "the land inside MASK_BOX as one path (evenodd), every third vertex (~0.3 world px): the fertile mask's clip",
          },
          { name: "ALEX_COAST", value: (c) => alexCoast(c), type: ": { at: P2; mid: P2; dir: P2; sea: P2; originOnLand: boolean }", doc: "the coast at the origin: nearest point, the mean of the nearest crossings, its direction (east-ish) and the sea side" },
          {
            name: "EXTENT",
            value: (c) => {
              const pts = [];
              for (let lon = -12; lon <= 42; lon += 1) for (const lat of [22, 48]) pts.push(c.W.proj([lon, lat]));
              for (let lat = 22; lat <= 48; lat += 1) for (const lon of [-12, 42]) pts.push(c.W.proj([lon, lat]));
              return { x0: Math.round(Math.min(...pts.map((q) => q[0]))), x1: Math.round(Math.max(...pts.map((q) => q[0]))), y0: Math.round(Math.min(...pts.map((q) => q[1]))), y1: Math.round(Math.max(...pts.map((q) => q[1]))) };
            },
            type: ": { x0: number; x1: number; y0: number; y1: number }",
            doc: "the world box the base level covers (12 W..42 E, 22..48 N)",
          },
        ],
      },
      levels: [
        { name: "m0", s: 0.7, kBake: 0.5, band: null, rects: [{ lon: [-12, 42], lat: [22, 48] }] },
        { name: "m1", s: 2.2, kBake: 1.5, band: [0.95, 1.35], rects: [{ lon: [23, 40], lat: [23, 38.5] }] },
        { name: "m2", s: 6, kBake: 4, band: [3.0, 4.0], rects: [{ lon: [27.3, 33.6], lat: [28.6, 33.2] }] },
        { name: "m3", s: 16, kBake: 11, band: [8.5, 11.5], rects: [{ x0: -110, x1: 110, y0: -110, y1: 110 }] },
      ],
    },
  },
};
