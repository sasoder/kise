// ---------------------------------------------------------------------------------------------------------------
// denverAirfield — Denver International (DEN) as data, in the world's miles (x east, y north, origin = the Jeppesen
// Terminal). Re-exported by denverWorld.
//
// SOURCE: traced from the KDEN layout (12/2024, Wikimedia Commons "KDEN_Layout.svg", CC BY 4.0, User:DerLudonaut;
// assets-src/scott-weather-fired/KDEN_Layout_3840.png, north up), cross-checked against the FAA airport diagram
// (public domain). Scale from the six runways' drawn lengths (4,877 m and 3,658 m: 2.595 m per px of the 3840 render),
// origin = the centre of the T1 (Jeppesen Terminal) block. Runway centrelines to ~0.01 mi, taxiways traced to ~0.03 mi.
// The airfield's ground under it is the USGS 2002 orthophoto (public domain) registered to these runways
// (denverWorld TEX.aerial); in 2002 16R/34L was still under construction, so it is painted over the aerial.
// ---------------------------------------------------------------------------------------------------------------

export const FT = 1 / 5280;
export type Runway = { id: string; x0: number; y0: number; x1: number; y1: number; w: number };
export type Taxi = { pts: [number, number][]; w: number };
export type Box = { name: string; x0: number; y0: number; x1: number; y1: number; h: number };

export const LAYOUT_SOURCE = "KDEN layout 12/2024 (Wikimedia Commons, CC BY 4.0, DerLudonaut) + FAA airport diagram";

/** The six runways (centreline ends, width): 16R/34L (16,000 ft) and 16L/34R north-west of the terminal, 8/26
 *  north-east, 17R/35L and 17L/35R east and south-east, 7/25 south-west: the pinwheel. */
export const RUNWAYS: Runway[] = [
  { id: "16R/34L", x0: -1.203, y0: 3.186, x1: -1.203, y1: 0.164, w: 200 * FT },
  { id: "16L/34R", x0: -0.709, y0: 3.277, x1: -0.709, y1: 1.003, w: 150 * FT },
  { id: "8/26", x0: 0.598, y0: 1.937, x1: 2.878, y1: 1.937, w: 150 * FT },
  { id: "17R/35L", x0: 0.714, y0: 0.814, x1: 0.714, y1: -1.466, w: 150 * FT },
  { id: "17L/35R", x0: 1.712, y0: 1.082, x1: 1.712, y1: -1.196, w: 150 * FT },
  { id: "7/25", x0: -2.801, y0: -0.605, x1: -0.534, y1: -0.605, w: 150 * FT },
];
/** the runway the 2002 aerial does not show yet (painted over it) */
export const RUNWAY_NOT_IN_AERIAL = "16R/34L";

/** The central complex: the terminal (N-S tent roof) and the three E-W concourses (A nearest the terminal). */
export const TERMINAL = { x: 0, y: 0, len: 0.174, wid: 0.06, eave: 0.008, peak: 0.024 } as const;
export const CONCOURSES: Box[] = [
  { name: "A", x0: -0.39, y0: 0.29, x1: 0.264, y1: 0.315, h: 0.009 },
  { name: "B", x0: -0.374, y0: 0.627, x1: 0.329, y1: 0.653, h: 0.009 },
  { name: "C", x0: -0.211, y0: 0.925, x1: 0.381, y1: 0.951, h: 0.009 },
];
/** Concourse B's centre (United's hub) */
export const CONCOURSE_B = { x: -0.02, y: 0.64 } as const;
/** Parking garages east and west of the terminal (low boxes). */
export const GARAGES: Box[] = [
  { name: "W", x0: -0.17, y0: -0.11, x1: -0.07, y1: 0.09, h: 0.006 },
  { name: "E", x0: 0.07, y0: -0.11, x1: 0.17, y1: 0.09, h: 0.006 },
];

/** Apron polygons: the concourse apron, the terminal's forecourt, the cargo apron, the maintenance aprons. */
export const APRONS: [number, number][][] = [
  [
    [-0.598, 0.184],
    [0.543, 0.184],
    [0.543, 1.163],
    [-0.598, 1.163],
  ],
  [
    [-0.2, -0.3],
    [0.2, -0.3],
    [0.2, 0.184],
    [-0.2, 0.184],
  ],
  [
    [-0.443, -1.403],
    [0.079, -1.403],
    [0.079, -1.248],
    [-0.443, -1.248],
  ],
  [
    [0.292, 1.5],
    [0.466, 1.5],
    [0.466, 1.712],
    [0.292, 1.712],
  ],
];

/** Taxiways as drawn on the layout (centrelines): the parallels, the cross links, the diagonals into the complex. */
export const TAXIWAYS: Taxi[] = (() => {
  const w = 75 * FT;
  return [
    { pts: [[-1.07, 3.183], [-1.07, 0.172]], w },
    { pts: [[-1.287, 3.175], [-1.287, 2.428]], w },
    { pts: [[-1.287, 3.175], [-0.56, 3.175]], w },
    { pts: [[-1.256, 2.428], [-0.56, 2.428]], w },
    { pts: [[-1.217, 1.759], [-0.56, 1.759]], w },
    { pts: [[-1.256, 0.764], [-0.521, 0.764]], w },
    { pts: [[-1.217, 0.184], [0.563, 0.184]], w },
    { pts: [[-0.579, 3.26], [-0.579, 0.184]], w },
    { pts: [[-0.56, 1.5], [0.563, 1.5]], w },
    { pts: [[0.563, 1.945], [0.563, -1.461]], w },
    { pts: [[0.621, 1.829], [2.885, 1.829]], w },
    { pts: [[0.563, 1.093], [1.724, 1.093]], w },
    { pts: [[1.608, 1.093], [1.608, -1.19]], w },
    { pts: [[0.737, 0.513], [1.608, 0.513]], w },
    { pts: [[0.737, -1.19], [1.685, -1.19]], w },
    { pts: [[1.124, 1.364], [1.298, 1.093], [1.588, 0.59]], w },
    { pts: [[-1.063, -0.462], [-0.54, 0.184]], w },
    { pts: [[-2.785, -0.493], [-0.54, -0.493]], w },
    { pts: [[-0.54, 0.184], [-0.54, -0.571]], w },
    { pts: [[-0.192, -1.403], [0.563, -1.403]], w },
  ] as Taxi[];
})();

/** The airport's own ground (mowed grass round the pinwheel), used when the aerial is off. */
export const PROPERTY: [number, number][] = [
  [-3.0, -0.95],
  [-0.4, -1.0],
  [-0.2, -1.75],
  [2.0, -1.75],
  [2.2, 1.4],
  [3.2, 1.6],
  [3.2, 2.25],
  [0.2, 2.25],
  [-0.3, 3.6],
  [-1.6, 3.6],
  [-1.6, -0.25],
  [-3.0, -0.25],
];

/** Pena Boulevard: from I-70 (south-west) to the terminal; I-70. */
export const ROADS: Taxi[] = [
  { pts: [[-4.5, -6.6], [-3.2, -5.0], [-1.6, -3.2], [-0.4, -1.7], [0, -0.3]], w: 140 * FT },
  { pts: [[-30, -6.6], [30, -6.6]], w: 120 * FT },
];

/** Gate stands (nose positions) along a concourse's two long sides, for parked jets. */
export const gatesOf = (c: Box, every = 0.07) => {
  const out: { x: number; y: number; dir: 1 | -1 }[] = [];
  for (let x = c.x0 + 0.05; x <= c.x1 - 0.05; x += every) {
    out.push({ x, y: c.y1, dir: 1 });
    out.push({ x: x + every / 2, y: c.y0, dir: -1 });
  }
  return out;
};

/** Apron service lanes for the ramp vehicles (loops in world miles, between the concourses). */
export const RAMP_LANES: [number, number][][] = [
  [
    [-0.45, 0.45],
    [0.4, 0.45],
    [0.4, 0.49],
    [-0.45, 0.49],
  ],
  [
    [-0.4, 0.77],
    [0.45, 0.77],
    [0.45, 0.81],
    [-0.4, 0.81],
  ],
  [
    [-0.5, 0.21],
    [0.4, 0.21],
    [0.4, 0.25],
    [-0.5, 0.25],
  ],
];
