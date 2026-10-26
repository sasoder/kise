// The Kyle Harper vaccine clip's map (cut 53, SpreadsForACentury): Africa, Europe and western Asia, laid as a GROUND
// PLANE under a perspective camera (the cut's own WebGL ground draws these tiles in perspective, as
// kyle-pandemics/rodentGround.tsx does).
//
//   bun scripts/maps/build.mjs scripts/maps/configs/vaccine.mjs
//   bun scripts/maps/bake.mjs  scripts/maps/configs/vaccine.mjs      (alone: nothing else heavy running)
//
// SPREAD  north-up Lambert conformal conic, parallels 20 / 50 N, centre meridian 10 E. 80 deg of longitude
//         (20 W..60 E at 45 N) span 6300 world px (~1 km per px). BERKELEY, Gloucestershire (2.46 W, 51.69 N), Jenner's
//         village (the first vaccination, 14 May 1796), sits at world (0, 0). No borders (period-neutral), no graticule.
//         The palette is the 3D style's (styles/dwarkesh-3d.md): land the warm sand-umber ground, sea a deeper
//         air-petrol, the coast a soft light line; the cut's shader fogs it into the air by distance.
//
// Exports (spreadMapData.ts): LAND_D (the land as one coarse path: the cut's land mask, so the plum stain stays on
// land), MASK_BOX (the world box the mask covers).
import { thinRing, ringArea } from "../lib/geo.mjs";
import { mpD } from "../lib/data.mjs";

const BERKELEY_LL = [-2.46, 51.69];

/** the world box the stain's land mask covers (the cut's MASKS) */
const MASK_BOX = { x0: -3200, x1: 6000, y0: -2600, y1: 7200 };
/** the land as coarse path strings for the mask */
const landD = (c, step) => {
  const mp = [];
  for (const poly of c.land) {
    // only the land the stain can reach (the Old World in view), not the Americas or the far east
    const xs = poly.rings[0].map((q) => q[0]);
    const ys = poly.rings[0].map((q) => q[1]);
    if (Math.max(...xs) < MASK_BOX.x0 || Math.min(...xs) > MASK_BOX.x1 || Math.max(...ys) < MASK_BOX.y0 || Math.min(...ys) > MASK_BOX.y1) continue;
    const rings = poly.rings.map((ring) => thinRing(ring, step)).filter((ring) => ring.length >= 3 && Math.abs(ringArea(ring)) > step * step * 2);
    if (rings.length) mp.push(rings);
  }
  return mpD(mp);
};

export default {
  name: "spread",
  dataDir: "generated/components/kyle-vaccine",
  tileDir: "public/kyle-vaccine-map",
  textures: "public/manchuria",
  palette: { sea: "#2A4544", land: "#7E6F55", rim: "#9A8A6A", ink: "#BFB290" },
  worlds: {
    spread: {
      projection: { kind: "lcc", parallels: [20, 50], rotate: -10, scale: { span: [[-20, 45], [60, 45]], px: 6300 }, anchor: [BERKELEY_LL, [0, 0]] },
      clip: { lon: [-130, 140], lat: [-35, 84] },
      landStep: 0.4,
      regionStep: 0.6,
      graticule: 0,
      borders: { pairs: [] },
      regions: () => ({}),
      data: {
        file: "spreadMapData.ts",
        comment:
          "Africa, Europe and western Asia for SpreadsForACentury (kyle-vaccine, cut 53): north-up LCC 20/50 N, centre\nmeridian 10 E, 80 deg of longitude at 45 N = 6300 world px; Berkeley (2.46 W, 51.69 N) at (0, 0).\nThe cut lays this world on a ground plane: 3D X = world x, depth north = -world y.",
        types: ["P2"],
        exports: [
          { name: "LAND_D", value: (c) => landD(c, 3), doc: "the land, thinned to 3 world px (the stain's mask; the baked tiles carry the real coast)" },
          { name: "MASK_BOX", value: MASK_BOX, type: ": { x0: number; x1: number; y0: number; y1: number }", doc: "the world box LAND_D covers (the stain's land mask)" },
        ],
      },
      levels: [
        // the base: every ground point any frame shows (f0's wide reaches ~75 N at the top and the Congo at the bottom)
        { name: "s0", s: 0.42, kBake: 0.4, band: null, rects: [{ x0: -4600, x1: 7000, y0: -6600, y1: 9200 }] },
        // where the zoom passes ~0.45 screen px per world px (the Mediterranean to Britain, mid-move on)
        { name: "s1", s: 1.1, kBake: 0.6, band: [0.42, 0.6], rects: [{ x0: -900, x1: 2950, y0: -1100, y1: 5800 }] },
        // the close end over England and the Channel coast (k up to ~2 in the near rows)
        { name: "s2", s: 2.1, kBake: 1.4, band: [0.95, 1.25], rects: [{ x0: -850, x1: 1050, y0: -1150, y1: 1750 }] },
      ],
    },
  },
};
