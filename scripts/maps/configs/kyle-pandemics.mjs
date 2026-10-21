// The Kyle Harper pandemics clip's map (cut 1, RodentFromCentralAsia): Eurasia from Western Europe to the Tian Shan,
// laid as a GROUND PLANE under a perspective camera (the cut's own WebGL ground draws these tiles in perspective).
//
//   bun scripts/maps/build.mjs scripts/maps/configs/kyle-pandemics.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/kyle-pandemics.mjs      (alone: nothing else heavy running)
//
// EURASIA  north-up Lambert conformal conic, parallels 38 / 56 N, centre meridian 40 E. 95 deg of longitude
//          (10 W..85 E at 46 N) span 4400 world px (~1.66 km per px). THE ORIGIN, (75.5 E, 42.7 N), sits at world
//          (0, 0): the Chuy valley at the western end of Lake Issyk-Kul, Kyrgyzstan, where the Black Death's
//          ancestral strain was found in the Kara-Djigach and Burana cemeteries, 1338-39 (Spyrou et al., Nature 606,
//          718-724, 2022). No modern borders (period-neutral). Period water: Issyk-Kul, Balkhash, Zaysan, the Aral
//          at its pre-1960 extent, Ladoga, Onega, Vanern, Malaren, Saimaa, Paijanne (Natural Earth 10m lakes).
//
// Exports (rodentMapData.ts): ORIGIN, LAND_D (the land as one coarse path, for the cut's land mask),
// LAKES_D (the period water, cut out of the mask), FIGS (a blue-noise field of candidate figure sites on the
// European land; the cut drops the ones the caption bands would cut through), EXTENT (the mask's world box).
import { readJson, loadFeatures, polysOf, thinRing, ringArea } from "../lib/geo.mjs";
import { mpD, roundPts } from "../lib/data.mjs";

// ---------------------------------------------------------------------------
// period water (lon/lat outer rings)
// ---------------------------------------------------------------------------
const LAKE_NAMES = ["Issyk-Kul", "Lake Balkhash", "Lake Zaysan", "Lake Ladoga", "Lake Onega", "Vänern", "Mälaren", "Lake Saimaa", "Päijänne"];
const lakeRings = [];
for (const f of loadFeatures("scripts/maps/data/sugar-lakes.geojson")) {
  if (!LAKE_NAMES.includes(f.properties.name)) continue;
  for (const rings of polysOf(f.geometry)) lakeRings.push(rings[0]);
}
const TRANSSIB = readJson("scripts/maps/data/transsib-lakes.json");
for (const r of TRANSSIB.aral) lakeRings.push(Array.isArray(r[0][0]) ? r[0] : r);

const ORIGIN_LL = [75.5, 42.7];

// ---------------------------------------------------------------------------
// the figure field: European land (west of 42 E, 36..61 N, no Africa, Anatolia or Caucasus), best-candidate blue noise
// ---------------------------------------------------------------------------
const inEurope = ([lon, lat]) => {
  if (lon < -10.5 || lon > 42 || lat < 36 || lat > 58.5) return false;
  if (lat < 37.6 && lon > -1 && lon < 11.5) return false; // the African shore (Algeria, Tunisia)
  if (lon > 26 && lat < 42.3 && !(lon < 29.1 && lat > 40.4)) return false; // Anatolia (keep Thrace)
  if (lon > 37 && lat < 47) return false; // the Caucasus, the Kuban
  if (lon > 30 && lat < 45.2 && lon < 37 && lat < 44.3) return false; // the open Black Sea south of Crimea
  return true;
};
/** a deterministic LCG */
const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
const lakePx = [];
const inPoly = (ring, x, y) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) c = !c;
  }
  return c;
};
const figureField = (c) => {
  const W = c.W;
  if (!lakePx.length) for (const r of lakeRings) lakePx.push(r.map((q) => W.proj(q)));
  const corners = [];
  for (let lon = -11; lon <= 43; lon += 2) for (const lat of [35, 62]) corners.push(W.proj([lon, lat]));
  for (let lat = 35; lat <= 62; lat += 1) for (const lon of [-11, 43]) corners.push(W.proj([lon, lat]));
  const box = { x0: Math.min(...corners.map((q) => q[0])), x1: Math.max(...corners.map((q) => q[0])), y0: Math.min(...corners.map((q) => q[1])), y1: Math.max(...corners.map((q) => q[1])) };
  const r = rng(1348);
  const ok = (x, y) => c.coast.isLand(x, y) && c.coast.coastDist(x, y, 30) > 14 && !lakePx.some((q) => inPoly(q, x, y)) && inEurope(W.proj.invert([x, y]));
  const pts = [];
  const N = 64;
  for (let n = 0; n < N; n++) {
    let best = null;
    let bd = -1;
    for (let k = 0; k < 40; k++) {
      let x = 0;
      let y = 0;
      let tries = 0;
      do {
        x = box.x0 + r() * (box.x1 - box.x0);
        y = box.y0 + r() * (box.y1 - box.y0);
      } while (!ok(x, y) && ++tries < 400);
      if (tries >= 400) continue;
      let d = Infinity;
      // spread wider north-south than east-west: under an oblique camera the rows then stand apart
      for (const p of pts) d = Math.min(d, Math.hypot(p[0] - x, (p[1] - y) * 0.62));
      if (d > bd) [bd, best] = [d, [x, y]];
    }
    if (best) pts.push(best);
  }
  // sort east -> west (the front's direction) so the figure index reads along the sweep
  pts.sort((a, b) => b[0] - a[0]);
  let minD = Infinity;
  pts.forEach((p, i) => pts.forEach((q, j) => {
    if (j > i) minD = Math.min(minD, Math.hypot(p[0] - q[0], p[1] - q[1]));
  }));
  console.log(`  FIGS: ${pts.length} sites, min spacing ${Math.round(minD)} px`);
  return roundPts(pts);
};

/** the land (and the lakes) as coarse path strings for the mask */
const landD = (c, step) => {
  const mp = [];
  for (const poly of c.land) {
    const rings = poly.rings.map((ring) => thinRing(ring, step)).filter((ring) => ring.length >= 3 && Math.abs(ringArea(ring)) > step * step * 2);
    if (rings.length) mp.push(rings);
  }
  return mpD(mp);
};

export default {
  name: "rodent",
  dataDir: "generated/components/kyle-pandemics",
  tileDir: "public/kyle-pandemics/rodent",
  textures: "public/manchuria",
  worlds: {
    eurasia: {
      projection: { kind: "lcc", parallels: [38, 56], rotate: -40, scale: { span: [[-10, 46], [85, 46]], px: 4400 }, anchor: [ORIGIN_LL, [0, 0]] },
      clip: { lon: [-100, 179], lat: [-15, 85] },
      landStep: 0.3,
      regionStep: 0.5,
      graticule: 5,
      lakes: lakeRings,
      borders: { pairs: [] },
      regions: () => ({}),
      data: {
        file: "rodentMapData.ts",
        comment:
          "Eurasia for RodentFromCentralAsia (kyle-pandemics, cut 1): north-up LCC 38/56 N, centre meridian 40 E,\n95 deg of longitude at 46 N = 4400 world px; the origin (75.5 E, 42.7 N, the Chuy valley by Issyk-Kul) at (0, 0).\nThe cut lays this world on a ground plane: 3D X = world x, depth north = -world y.",
        types: ["P2", "LL", "Box"],
        exports: [
          { name: "ORIGIN", value: (c) => c.W.proj(ORIGIN_LL).map((v) => Math.round(v * 1000) / 1000), type: ": P2", doc: "the burrow: (75.5 E, 42.7 N), the Chuy valley by Issyk-Kul" },
          { name: "PLACES", places: { issykKul: [77.3, 42.45], kaffa: [35.4, 45.03], constantinople: [28.98, 41.01], messina: [15.55, 38.19], marseille: [5.37, 43.3], paris: [2.35, 48.86], lisbon: [-9.14, 38.72], bergen: [5.32, 60.39] }, type: ": Record<string, P2>" },
          { name: "LAND_D", value: (c) => landD(c, 2), doc: "the land, thinned to 2 world px (the mask; the baked tiles carry the real coast)" },
          { name: "LAKES_D", value: (c) => lakeRings.map((r) => `M${r.map((q) => c.W.proj(q).map((v) => Math.round(v * 10) / 10).join(",")).join("L")}Z`).join(""), doc: "the period water (cut out of the land mask)" },
          { name: "FIGS", value: (c) => figureField(c), type: ": P2[]", doc: "candidate figure sites on the European land, best-candidate blue noise, sorted east -> west" },
          { name: "EXTENT", value: (c) => ({ x0: Math.round(c.W.proj([-30, 40])[0]), x1: Math.round(c.W.proj([125, 40])[0]), y0: Math.round(Math.min(c.W.proj([-30, 80])[1], c.W.proj([40, 80])[1], c.W.proj([125, 80])[1])), y1: Math.round(Math.max(c.W.proj([-30, 12])[1], c.W.proj([40, 12])[1], c.W.proj([125, 12])[1])) }), type: ": { x0: number; x1: number; y0: number; y1: number }", doc: "the world box the base level and the mask cover" },
        ],
      },
      levels: [
        { name: "e0", s: 0.36, kBake: 0.4, band: null, rects: [{ lon: [-30, 125], lat: [12, 88] }] },
        { name: "e1", s: 1.1, kBake: 0.9, band: [0.42, 0.62], rects: [{ lon: [-14, 84], lat: [28, 66] }] },
        { name: "e2", s: 4, kBake: 2.6, band: [1.5, 2.1], rects: [{ x0: -500, x1: 500, y0: -650, y1: 350 }] },
      ],
    },
  },
};
