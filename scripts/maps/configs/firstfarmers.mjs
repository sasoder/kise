// The Kyle Harper first-farmers clip's map world ("Did disease help the first farmers replace hunter-gatherers?",
// Dwarkesh map style): Neolithic Europe, one world, shared by cuts F (OutcompeteEurope) and I.
//   bun scripts/maps/build.mjs scripts/maps/configs/firstfarmers.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/firstfarmers.mjs      (alone: nothing else heavy running)
// The front model (arrival dates, dots, land mask) is baked from this world by
//   bun scripts/clips/kyle-first-farmers/bake-neolithic-front.mjs
//
// EUROPE  north-up Lambert conformal conic, parallels 38/58, centre meridian 14 E. World px == screen px at the
//         Europe wide: 48 deg of longitude (10 W .. 38 E at 46 N) span 1000 px at k 1, and (14 E, 48 N) sits at world
//         (540, 960). Cabo da Roca (9.5 W) lands at x -17, Catalhoyuk (32.8 E) at x 997: Europe fills the frame width.
//         Coasts are MODERN Natural Earth 10m: the Neolithic Black Sea shoreline and Doggerland are left out. No borders
//         (the Neolithic had none) and no period water. Natural Earth in world-atlas has no rivers: the Danube at the
//         Iron Gates is not drawn.
import { keyUnion } from "../lib/data.mjs";

// Dated anchors of the spread, approximate first farming, cal BC (Pinhasi, Fort & Ammerman 2005, PLoS Biology
// 3(12): e410; Shennan 2018, The First Farmers of Europe, CUP). The front model's inputs (see neolithicFront.ts).
export const ANCHORS = {
  catalhoyuk: { ll: [32.83, 37.67], bc: 7100, name: "Catalhoyuk, central Anatolia" },
  hacilar: { ll: [30.08, 37.57], bc: 6700, name: "Hacilar, SW Anatolia" },
  barcin: { ll: [29.65, 40.25], bc: 6600, name: "Barcin, NW Anatolia" },
  sesklo: { ll: [22.84, 39.35], bc: 6500, name: "Thessaly (Sesklo), Greece" },
  ironGates: { ll: [22.03, 44.56], bc: 6100, name: "Iron Gates (Lepenski Vir)" },
  karanovo: { ll: [25.9, 42.5], bc: 6100, name: "Karanovo, Bulgaria" },
  tavoliere: { ll: [15.5, 41.5], bc: 6100, name: "Apulia (Tavoliere), S Italy" },
  koros: { ll: [20.3, 46.6], bc: 5900, name: "Koros, Hungarian plain" },
  languedoc: { ll: [3.5, 43.4], bc: 5700, name: "Languedoc, S France (Cardial)" },
  transdanubia: { ll: [17.6, 47.3], bc: 5500, name: "Transdanubia (earliest LBK)" },
  valencia: { ll: [-0.5, 39.0], bc: 5500, name: "Valencia, E Iberia" },
  portugal: { ll: [-9.0, 39.0], bc: 5400, name: "Portugal coast" },
  mainz: { ll: [8.3, 50.0], bc: 5300, name: "Mainz, Rhine" },
  kuyavia: { ll: [18.5, 52.7], bc: 5300, name: "Kuyavia, N Poland" },
  limburg: { ll: [5.8, 50.9], bc: 5200, name: "Limburg, Low Countries" },
  parisBasin: { ll: [2.3, 48.85], bc: 5100, name: "Paris Basin" },
  zealand: { ll: [12.0, 55.7], bc: 4000, name: "S Scandinavia (Zealand)" },
  sEngland: { ll: [-1.0, 51.5], bc: 4000, name: "S England" },
  ireland: { ll: [-7.0, 53.4], bc: 3800, name: "Ireland" },
  scotland: { ll: [-4.0, 56.5], bc: 3800, name: "Scotland" },
  eBaltic: { ll: [24.0, 55.0], bc: 3500, name: "E Baltic (Lithuania)" },
};
const LV = [22.026, 44.557]; // Lepenski Vir
const ironGates = (c, k) => {
  const [x, y] = c.P(LV);
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, k };
};
const ll = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.ll]));

export default {
  name: "firstfarmers",
  dataDir: "generated/components/kyle-first-farmers",
  tileDir: "public/firstfarmers",
  textures: "public/manchuria",
  worlds: {
    europe: {
      projection: { kind: "lcc", parallels: [38, 58], rotate: -14, scale: { span: [[-10, 46], [38, 46]], px: 1000 }, anchor: [[14, 48], [540, 960]] },
      // wider than every level: e0's world box reaches ~45 W / 72 N (Greenland) and ~5 N (Sahel) at its corners
      clip: { lon: [-80, 110], lat: [0, 86] },
      landStep: 0.07,
      regionStep: 0.2,
      graticule: 5,
      borders: { pairs: [] },
      data: {
        file: "firstFarmersEuropeMapData.ts",
        comment:
          "Neolithic Europe (the first farmers' spread, c. 7100-3500 BC): north-up LCC, parallels 38/58, centre 14 E.\n" +
          "World px == screen px at the Europe wide (k 1). Modern Natural Earth coasts (the Neolithic Black Sea and\n" +
          "Doggerland are left out); no borders, no rivers. The front model is neolithicFront.ts.",
        types: ["P2", "LL", "Box", keyUnion("Anchor", ANCHORS)],
        exports: [
          { name: "ANCHORS", places: ll(ANCHORS), type: ": Record<Anchor, P2>", doc: "the dated anchors of the spread, world px (dates in ANCHOR_BC)" },
          { name: "ANCHOR_BC", value: Object.fromEntries(Object.entries(ANCHORS).map(([k, v]) => [k, v.bc])), type: ": Record<Anchor, number>", doc: "approximate first farming, cal BC (Pinhasi et al. 2005; Shennan 2018)" },
          { name: "LEPENSKI_VIR", value: (c) => c.places({ p: LV }).p, type: ": P2", doc: "Lepenski Vir at the Iron Gates of the Danube (44.557 N, 22.026 E)" },
          {
            name: "FRAMINGS",
            value: (c) => ({
              // the whole of Europe, Ireland and Portugal to central Anatolia filling the width; the land centre at y ~740
              EUROPE: { x: 491, y: 1000, k: 1.0 },
              // cut F's opening (= firstFarmersOpening SPREAD_CAM at f0): the front's leading edge near y 800-850
              AEGEAN: { x: 815, y: 1232, k: 3.0 },
              // the Iron Gates gorge (Lepenski Vir) at the frame centre, at three depths for cut I's dive (each at
              // rest outside the levels' crossfade bands)
              IRON_GATES_WIDE: ironGates(c, 2),
              IRON_GATES_MID: ironGates(c, 4.6),
              IRON_GATES_CLOSE: ironGates(c, 8),
            }),
            type: ": Record<string, { x: number; y: number; k: number }>",
            doc: "suggested cameras { x, y, k }: world (x, y) at the frame centre (540, 960) at zoom k",
          },
        ],
      },
      // generous boxes: a camera inside a level's band must find the level all round its view (no seam).
      // Texel rule (scripts/maps/README.md): s >= the largest k a level serves, ~1-1.25 texels per screen px.
      levels: [
        // e0 / e1 in world px: every view at k >= 0.95 round the Europe wide (the full 1920 px height reaches 75 N and 20 N)
        { name: "e0", s: 1.3, kBake: 1.0, band: null, rects: [{ x0: -160, y0: -90, x1: 1160, y1: 2080 }] },
        { name: "e1", s: 2.4, kBake: 1.8, band: [1.25, 1.5], rects: [{ x0: -200, y0: 60, x1: 1300, y1: 1950 }] },
        {
          name: "e2",
          s: 4.2,
          kBake: 3.1,
          band: [2.2, 2.6],
          rects: [
            { around: [25.5, 39.0], k: 2.2, views: [1.0, 1.0, 0.85, 0.85] }, // the Aegean (cut F opens at k 3)
            { around: LV, k: 2.2, views: [0.9, 0.9, 0.9, 0.9] }, // the Iron Gates (cut I)
          ],
        },
        { name: "e3", s: 6.6, kBake: 5.0, band: [3.6, 4.3], rects: [{ around: LV, k: 3.6, views: [0.85, 0.85, 0.85, 0.85] }] },
        { name: "e4", s: 10.5, kBake: 7.8, band: [5.6, 6.6], rects: [{ around: LV, k: 5.6, views: [0.8, 0.8, 0.8, 0.8] }] },
      ],
    },
  },
};
