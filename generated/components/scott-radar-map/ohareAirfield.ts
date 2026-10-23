// ---------------------------------------------------------------------------------------------------------------
// ohareAirfield — Chicago O'Hare (ORD) as data, in the Denver world's miles (x east, y north, z up), origin = the
// terminal core (Terminals 1-3). Re-exported by ohareWorld.
//
// SOURCE: traced from the FAA airport diagram (AL-166, effective 01 OCT 2026, public domain;
// assets-src/scott-radar-map/KORD_airport_diagram_FAA_dTPP_2610_3000px.png, true north up). Scale from the six
// parallel runways' drawn lengths against their published lengths (7,500 / 11,245 / 11,260 / 13,000 / 10,800 /
// 7,500 ft): 0.0951 px per ft = 502 px per statute mile; origin = diagram px (1060, 1500). Runway centrelines to
// ~0.01 mi; buildings simplified from the diagram's black blobs to ~0.03 mi. The pavement (taxiways, aprons, ramps)
// is the diagram's grey, baked into public/scott-radar-map/ohare-field.png by scripts/clips/scott-radar-map/bake-ohare.py.
// Expressways (I-190, I-294, I-90, IL-390, I-355) are schematic (approximate alignments, for context only).
// ---------------------------------------------------------------------------------------------------------------

export const FT = 1 / 5280;
export const DIAG_PX_PER_MI = 502;
/** diagram px -> world miles */
export const dX = (px: number) => (px - 1060) / DIAG_PX_PER_MI;
export const dY = (py: number) => (1500 - py) / DIAG_PX_PER_MI;

export type Runway = { id: string; x0: number; y0: number; x1: number; y1: number; w: number };
export type Bar = { name: string; x0: number; y0: number; x1: number; y1: number; w: number; h: number };
export type Road = { pts: [number, number][]; w: number };

export const LAYOUT_SOURCE = "FAA airport diagram KORD (AL-166), effective 01 OCT 2026";

/** The eight runways: six parallel E-W (north airfield 9L/27R, 9C/27C, 9R/27L; south airfield 10L/28R, 10C/28C,
 *  10R/28L) and the two diagonals 4L/22R, 4R/22L. (x0, y0) = the west / south-west end. */
export const RUNWAYS: Runway[] = [
  { id: "9L/27R", x0: -1.241, y0: 1.749, x1: 0.181, y1: 1.749, w: 150 * FT },
  { id: "9C/27C", x0: -1.494, y0: 0.749, x1: 0.637, y1: 0.749, w: 200 * FT },
  { id: "9R/27L", x0: -1.494, y0: 0.446, x1: 0.641, y1: 0.446, w: 150 * FT },
  { id: "10L/28R", x0: -1.494, y0: -0.58, x1: 0.976, y1: -0.58, w: 150 * FT },
  { id: "10C/28C", x0: -1.492, y0: -0.807, x1: 0.554, y1: -0.807, w: 150 * FT },
  { id: "10R/28L", x0: -1.279, y0: -1.394, x1: 0.122, y1: -1.394, w: 150 * FT },
  { id: "4L/22R", x0: -0.589, y0: 0.275, x1: 0.306, y1: 1.378, w: 150 * FT },
  { id: "4R/22L", x0: 0.123, y0: -1.695, x1: 1.142, y1: -0.556, w: 150 * FT },
];
export const runwayById = (id: string) => {
  const r = RUNWAYS.find((q) => q.id === id);
  if (!r) throw new Error(`ohareAirfield: no runway ${id}`);
  return r;
};

/** Terminals 1-3: the crescent round the central garage (an arc, centre, radius and angles in world degrees,
 *  counter-clockwise from east), its depth and eave height (miles, before the stage's height exaggeration). */
export const CRESCENT = { cx: dX(1100), cy: dY(1440), r: 0.28, a0: 153, a1: 298, w: 0.07, h: 0.013 } as const;

/** The concourses (bars: centreline ends, width, height) and Terminal 5 (east), traced from the diagram. */
export const CONCOURSES: Bar[] = [
  { name: "T1-C", x0: dX(870), y0: dY(1385), x1: dX(895), y1: dY(1505), w: 0.034, h: 0.011 },
  { name: "T2-E/F", x0: dX(1035), y0: dY(1560), x1: dX(905), y1: dY(1600), w: 0.032, h: 0.011 },
  { name: "T2-E2", x0: dX(1040), y0: dY(1562), x1: dX(1035), y1: dY(1640), w: 0.03, h: 0.011 },
  { name: "T3-H/K", x0: dX(1095), y0: dY(1530), x1: dX(1225), y1: dY(1515), w: 0.032, h: 0.011 },
  { name: "T3-L", x0: dX(1120), y0: dY(1560), x1: dX(1120), y1: dY(1655), w: 0.03, h: 0.011 },
  { name: "T5", x0: dX(1365), y0: dY(1480), x1: dX(1365), y1: dY(1625), w: 0.12, h: 0.014 },
  { name: "T5-M", x0: dX(1340), y0: dY(1605), x1: dX(1585), y1: dY(1605), w: 0.03, h: 0.01 },
];
/** the central garage / hotel block inside the crescent, and the tower */
export const GARAGE: Bar = { name: "garage", x0: dX(1060), y0: dY(1470), x1: dX(1140), y1: dY(1470), w: 0.12, h: 0.012 };
export const TOWER = { x: dX(1112), y: dY(1452), shaft: 0.012, cab: 0.026, h: 0.05 } as const;

/** Gate stands (nose positions and the heading a parked jet faces) along both long sides of every concourse. */
export const gatesOf = (b: Bar, every = 0.05) => {
  const L = Math.hypot(b.x1 - b.x0, b.y1 - b.y0);
  const ux = (b.x1 - b.x0) / L;
  const uy = (b.y1 - b.y0) / L;
  const out: { x: number; y: number; h: number }[] = [];
  const n = Math.max(1, Math.floor((L - 0.04) / every));
  for (let i = 0; i <= n; i++) {
    const s = 0.02 + (i * (L - 0.04)) / Math.max(1, n);
    for (const side of [-1, 1]) {
      const nx = -uy * side;
      const ny = ux * side;
      const x = b.x0 + ux * s + nx * (b.w / 2 + 0.004);
      const y = b.y0 + uy * s + ny * (b.w / 2 + 0.004);
      // the jet faces the concourse: heading = from the stand toward the building
      out.push({ x, y, h: Math.atan2(-nx, -ny) });
    }
  }
  return out;
};

/** Expressways (schematic): I-190 into the terminal core from the east, I-294 (Tri-State) north-south east of the
 *  field, I-90 (Kennedy) south-east toward downtown, I-90 (Jane Addams) west-north-west, IL-390 west, I-355. */
export const ROADS: Road[] = [
  { pts: [[4.2, -0.2], [2.6, -0.16], [1.6, -0.08], [1.0, -0.02], [0.42, 0.04]], w: 160 * FT },
  { pts: [[2.6, -24], [2.15, -8], [1.9, -2.5], [1.95, 0], [2.25, 2.6], [2.7, 6.5], [3.4, 24]], w: 150 * FT },
  { pts: [[2.0, -0.18], [4.5, -2.0], [9, -5.5], [16, -9.5]], w: 150 * FT },
  { pts: [[2.3, 2.5], [0.6, 3.05], [-3.8, 4.2], [-9.5, 6.0], [-18, 8.6], [-40, 14]], w: 140 * FT },
  { pts: [[-1.9, -2.55], [-5.8, -3.35], [-11.5, -4.0], [-22, -4.3], [-40, -4.6]], w: 140 * FT },
  { pts: [[-10.6, -24], [-10.2, -6], [-10.1, 2], [-10.5, 12], [-11.2, 24]], w: 130 * FT },
];
