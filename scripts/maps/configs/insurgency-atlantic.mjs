// The sarah-insurgency clip's ATLANTIC world (Sarah Paine on Dwarkesh, "The insurgency strategy America invented";
// the one-off "Dwarkesh 3D map" look: laid as the FLOOR of a 3D air world by insurgencyGround.tsx). Eastern North
// America (Maine to Georgia, inland past the Appalachians), the North Atlantic, the British Isles and the Channel
// coast, 1775-83.
//
//   bun scripts/maps/build.mjs scripts/maps/configs/insurgency-atlantic.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/insurgency-atlantic.mjs      (alone: nothing else heavy running)
//
// THE PROJECTION: north-up Lambert conformal conic, parallels 33 / 52 N, centre meridian 38 W (mid-ocean, so both
//   coasts lean the same ~25 deg off the frame's vertical in the flat map). Why a wide LCC and not Equal Earth:
//   it is conformal (the seaboard and Britain keep their shapes, scale error < ~5 % from 25 to 60 N), its meridians
//   are straight, so the 3D camera's "look north" / "look east" is one yaw per place (insurgencyCamera.northYaw),
//   and its curved parallels give the ocean the globe's own curve when a camera cranes back and looks east.
//   1 world px ~ 1 km: 5 deg of longitude at 40 N (75..70 W) span 426 world px. New York (74.0 W, 40.7 N) = (0, 0).
// PERIOD BORDERS (dashed cream): the thirteen states of 1783 drawn from their successor states (the sugar clip's
//   method, scripts/maps/sets/sugar/build-sugar-map.mjs: the sugar 1783 subset holds no state lines): NH (+VT, the
//   NH grants), MA (+ME), RI, CT, NY, NJ, PA, DE, MD (+DC), VA (+WV, +KY, Virginia's 1783 Kentucky district),
//   NC (+TN, its 1783 western district), SC, GA (state outlines: us-atlas 10m, US Census); lines only between those
//   groups, Pennsylvania's western line, the line with British Canada (the Natural Earth US-Canada border, which
//   follows the 1783 treaty line east of the lakes closely enough at this scale; the Maine line was disputed until
//   1842) and the line with Spanish Florida (Georgia / Florida, Alabama / Florida). No other modern state lines,
//   none in Europe (the Channel coast only ever sits far in the haze).
// PERIOD WATER: the Great Lakes, Lake Champlain, Lake Nipigon / St Clair and the other natural lakes of the sugar
//   lake file in the box (Natural Earth 10m lakes; no reservoirs). Rivers are not baked; the Hudson is an
//   approximate overlay route in the data module.
import { readFileSync } from "node:fs";
import { feature, mesh } from "topojson-client";
import { countryMP, featureMP, llBox, loadFeatures, polysOf, thinLine, union } from "../lib/geo.mjs";
import { keyUnion, roundPts, coarse, ptsD } from "../lib/data.mjs";

const usTopo = JSON.parse(readFileSync("scripts/maps/data/us-states-10m.json", "utf8"));
const STATE_F = new Map(feature(usTopo, usTopo.objects.states).features.map((f) => [f.properties.name, f]));
// the thirteen, north -> south, from their successor states
const THIRTEEN = [
  ["NH", "New Hampshire", ["New Hampshire", "Vermont"]],
  ["MA", "Massachusetts", ["Massachusetts", "Maine"]],
  ["RI", "Rhode Island", ["Rhode Island"]],
  ["CT", "Connecticut", ["Connecticut"]],
  ["NY", "New York", ["New York"]],
  ["NJ", "New Jersey", ["New Jersey"]],
  ["PA", "Pennsylvania", ["Pennsylvania"]],
  ["DE", "Delaware", ["Delaware"]],
  ["MD", "Maryland", ["Maryland", "District of Columbia"]],
  ["VA", "Virginia", ["Virginia", "West Virginia", "Kentucky"]],
  ["NC", "North Carolina", ["North Carolina", "Tennessee"]],
  ["SC", "South Carolina", ["South Carolina"]],
  ["GA", "Georgia", ["Georgia"]],
];
const GROUP = new Map(THIRTEEN.flatMap(([key, , states]) => states.map((s) => [s, key])));
const stateLines = (W) => {
  const geoms = usTopo.objects.states;
  const keep = (a, b) => {
    const na = a.properties.name;
    const nb = b.properties.name;
    if (a === b) return false;
    const ga = GROUP.get(na);
    const gb = GROUP.get(nb);
    if (ga && gb) return ga !== gb;
    const pair = [na, nb].sort().join("|");
    return pair === "Ohio|Pennsylvania" || pair === "Florida|Georgia" || pair === "Alabama|Florida";
  };
  const ml = mesh(usTopo, geoms, keep);
  return ml.coordinates.map((line) => thinLine(line.map((q) => W.proj(q)), 0.25)).filter((l) => l.length > 1);
};

// period water: the natural lakes of the sugar lake file inside the box
const LAKES = [];
for (const f of loadFeatures("scripts/maps/data/sugar-lakes.geojson")) {
  for (const rings of polysOf(f.geometry)) {
    const b = llBox(rings[0]);
    if (b.x1 < -96 || b.x0 > 20 || b.y1 < 24 || b.y0 > 62) continue;
    LAKES.push(rings[0]);
  }
}

const PLACES = {
  boston: [-71.06, 42.36],
  newYork: [-74.01, 40.71],
  philadelphia: [-75.16, 39.95],
  morristown: [-74.48, 40.8],
  valleyForge: [-75.45, 40.1],
  saratoga: [-73.64, 42.99], // the battlefield at Stillwater / Schuylerville
  bennington: [-73.2, 42.88],
  lexington: [-71.23, 42.45],
  concord: [-71.35, 42.46],
  kingsMountain: [-81.39, 35.14],
  cowpens: [-81.82, 35.13],
  guilfordCourthouse: [-79.84, 36.13],
  charleston: [-79.93, 32.78],
  london: [-0.13, 51.51],
  newWindsor: [-74.03, 41.48],
  albany: [-73.75, 42.65],
  yorktown: [-76.51, 37.24],
  // the farmhouse of cut 91: a farm in the Massachusetts countryside west of Concord (symbolic, not a real house)
  farm: [-71.47, 42.47],
};
const LABEL_AT = {
  britain: [-2.2, 53.4],
  america: [-77.5, 39.0],
  atlantic: [-42, 41], // mid-ocean (italic sea label, if a cut ever names it)
};
// the thirteen states' label anchors (lon, lat): inside each state's 1783 core (not the western districts)
const STATE_AT = {
  NH: [-71.6, 43.8],
  MA: [-71.9, 42.35],
  RI: [-71.5, 41.7],
  CT: [-72.7, 41.6],
  NY: [-74.9, 42.6],
  NJ: [-74.5, 40.2],
  PA: [-77.6, 40.9],
  DE: [-75.5, 39.1],
  MD: [-76.7, 39.35],
  VA: [-78.4, 37.6],
  NC: [-79.2, 35.6],
  SC: [-80.8, 33.8],
  GA: [-83.3, 32.7],
};
const HUDSON = [
  ["newYork", -74.02, 40.69],
  ["yonkers", -73.92, 40.95],
  ["westPoint", -73.96, 41.39],
  ["newburgh", -73.99, 41.5],
  ["poughkeepsie", -73.95, 41.7],
  ["kingston", -73.95, 41.93],
  ["hudson", -73.8, 42.25],
  ["albany", -73.74, 42.65],
  ["stillwater", -73.65, 42.94],
  ["fortEdward", -73.58, 43.27],
];

const regionsOf = (W) => {
  const s = W.regionStep;
  const groups = Object.fromEntries(THIRTEEN.map(([key, , states]) => [key, union(...states.map((n) => featureMP(W, STATE_F.get(n), s)))]));
  const thirteen = union(...Object.values(groups));
  const britain = union(countryMP(W, "United Kingdom", s), countryMP(W, "Ireland", s));
  return { ...groups, thirteen, britain };
};

const R_DOC = ". { d: fill, edge: inland boundary runs, box: [x0, y0, x1, y1] }";
export default {
  name: "insAtlantic",
  dataDir: "generated/components/sarah-insurgency",
  tileDir: "public/sarah-insurgency",
  textures: "public/manchuria",
  worlds: {
    atlantic: {
      projection: { kind: "lcc", parallels: [33, 52], rotate: 38, scale: { span: [[-75, 40], [-70, 40]], px: 426 }, anchor: [[-74.0, 40.7], [0, 0]] },
      clip: { lon: [-150, 75], lat: [-25, 83] },
      landStep: 0.25,
      regionStep: 1.0,
      graticule: 5,
      lakes: LAKES,
      borders: {
        pairs: [["United States of America", "Canada"]],
        extra: (W) => stateLines(W),
      },
      regions: regionsOf,
      data: {
        file: "insAtlanticMapData.ts",
        comment: `THE ATLANTIC WORLD of sarah-insurgency (1775-83). Natural Earth 10m on a north-up Lambert conformal conic,
parallels 33/52 N, centre meridian 38 W; 1 world px ~ 1 km (75..70 W at 40 N = 426 px); New York = (0, 0).
The static map is the raster LOD pyramid (insAtlanticLevels.ts), laid as the 3D floor by insurgencyGround.tsx;
everything here is overlay data. 3D: X = world x, Z = world y (south +), Y up.
The thirteen states are drawn from their successor states (VT in NH, ME in MA, WV + KY in VA, TN in NC).`,
        types: ["P2", "LL", "Box", "Region", "RouteData", keyUnion("AtlanticPlace", PLACES), keyUnion("StateKey", STATE_AT)],
        exports: [
          { name: "THIRTEEN", region: "thirteen", doc: `the thirteen states of 1783, as one region${R_DOC}` },
          {
            name: "STATES",
            type: ": Record<StateKey, { name: string; d: string; box: Box; at: P2 }>",
            doc: "each of the thirteen (successor-state groups), fill d + box + label anchor (world px)",
            value: (c) =>
              Object.fromEntries(
                THIRTEEN.map(([key, name]) => {
                  const r = c.region(c.R[key]);
                  const at = c.P(STATE_AT[key]).map((v) => Math.round(v * 100) / 100);
                  return [key, { name, d: r.d, box: r.box, at }];
                }),
              ),
          },
          { name: "STATES_POLY", doc: "the thirteen as coarse rings (world px) for in-polygon tests", type: ": Record<StateKey, P2[][][]>", value: (c) => Object.fromEntries(THIRTEEN.map(([key]) => [key, coarse(c.R[key], 2, 20)])) },
          { name: "BRITAIN", region: "britain", doc: `Great Britain and Ireland${R_DOC}` },
          { name: "PLACES", places: PLACES, type: ": Record<AtlanticPlace, P2>", doc: "places (world px)" },
          { name: "PLACES_LL", value: PLACES, type: ": Record<AtlanticPlace, LL>", doc: "the same, lon/lat" },
          { name: "LABEL_AT", places: LABEL_AT, type: ": Record<string, P2>", doc: "where a GroundLabel for a country / sea sits (world px)" },
          { name: "RIVER_HUDSON", route: HUDSON, per: 16, thin: 0.4, doc: "the Hudson, New York -> Fort Edward (APPROXIMATE course)" },
          { name: "LAKES_D", doc: "the period lakes, world px (they are baked; this is for masks)", value: (c) => LAKES.map((r) => ptsD(r.map((q) => c.P(q)), true)).join("") },
          { name: "BOSTON_LONDON_KM", value: 5300, doc: "Boston to London, great circle, ~5,300 km (6-8 weeks under sail): header facts, nothing on screen" },
        ],
      },
      levels: [
        { name: "a0", s: 0.28, kBake: 0.22, band: null, rects: [{ lon: [-100, 40], lat: [12, 76] }] },
        { name: "a1", s: 1.2, kBake: 0.7, band: [0.28, 0.36], rects: [{ lon: [-86.5, -63], lat: [29, 48] }] },
        { name: "a2", s: 4, kBake: 2.2, band: [1.05, 1.35], rects: [{ lon: [-76.6, -69.4], lat: [40.2, 44.6] }] },
        { name: "a3", s: 14, kBake: 8, band: [3.6, 4.6], rects: [{ lon: [-72.3, -70.6], lat: [42.0, 42.95] }] },
      ],
    },
  },
};
