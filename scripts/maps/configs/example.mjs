// Example map config: copy to configs/<set>.mjs, set name / dataDir / tileDir, then replace the world.
// One LCC world (the Gulf of Mexico, 1519): Lake Texcoco as period water, the 1519 empire from a json input clipped
// to land, places, a route, one framing, two LOD levels. Every key is documented in ../lib/config.mjs.
//   bun scripts/maps/build.mjs scripts/maps/configs/<set>.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/<set>.mjs      (alone: nothing else heavy running)
import { featureMP, readJson, toLand, union } from "../lib/geo.mjs";
import { keyUnion } from "../lib/data.mjs";

const GEO = readJson("scripts/maps/data/cortes-geo.json");
const SITES = Object.fromEntries(Object.entries(GEO.sites).map(([k, v]) => [k, v.lonlat]));
const LAKE = GEO.lake_texcoco_1519.rings[0];
const [outer, h1, h2, exclave] = GEO.aztec_empire_1519.rings;

export default {
  name: "gulf", // tile and module prefix
  dataDir: "generated/components/<clip>", // the clip folder the cuts import from
  tileDir: "public/<set>",
  textures: "public/manchuria",
  worlds: {
    gulf: {
      projection: { kind: "lcc", parallels: [17, 23], rotate: 87, scale: { span: [[-100.5, 20], [-73.5, 20]], px: 1080 }, anchor: [[-87, 20], [540, 960]] },
      clip: { lon: [-125, -55], lat: [0, 40] },
      landStep: 0.08,
      regionStep: 0.15,
      lakes: [LAKE],
      borders: { pairs: [] },
      regions: (W) => ({ empire: union(featureMP(W, { geometry: { type: "MultiPolygon", coordinates: [[outer, h1, h2], [exclave]] } }, W.regionStep)) }),
      data: {
        file: "gulfMapData.ts",
        comment: "The Gulf of Mexico, 1519.",
        types: ["P2", "LL", "Box", "Region", "RouteData", keyUnion("Site", SITES)],
        exports: [
          { name: "EMPIRE", region: (c) => toLand(c.R.empire, c.land), doc: "the 1519 empire, clipped to land" },
          { name: "SITES", places: SITES, type: ": Record<Site, P2>" },
          { name: "ROAD", route: GEO.routes.cortes_road_1519.waypoints.map(([lon, lat], i) => [`w${i}`, lon, lat]) },
          { name: "FRAMINGS", value: (c) => ({ GULF: c.fitLL({ lon: [-98, -75], lat: [17, 24] }, 0.95) }), type: ": Record<string, { x: number; y: number; k: number }>" },
        ],
      },
      levels: [
        { name: "g0", s: 0.5, kBake: 0.6, band: null, rects: [{ lon: [-100, -74], lat: [15, 26] }] },
        { name: "g1", s: 6, kBake: 4.5, band: [3.5, 4.2], rects: [{ around: [-99.1, 19.45], k: 4, views: [0.6, 0.6, 0.3, 0.3] }] },
      ],
    },
  },
};
