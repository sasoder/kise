// ---------------------------------------------------------------------------
// aircraftModels — the parametric airliners of scott-aircraft-order (Cheeky Pint S4E05, Scott Kirby).
// Pure geometry (no three.js, no React): every type is built from its real proportions as lofted surfaces
// (a fuselage of elliptical sections, airfoil wings and tails, nacelles of revolution, gear) and returned as
// plain typed arrays that aircraftShared.tsx turns into three.js meshes. One model per type serves every view:
// side profile, oblique, head-on, plan.
//
// LOCAL FRAME (metres, right-handed): x FORWARD (the nose tip at x = +L/2, the tail end at -L/2), y UP from the
// ground (wheels on y 0 when parked), z to STARBOARD (the right wing). The fuselage is built along s = distance
// from the nose tip (s 0 .. L): x = L/2 - s.
//
// SOURCES (manufacturer airport-planning documents and type data, rounded): overall length / span / height
// 787-9 62.8 / 60.1 / 17.0, 787-10 68.3 / 60.1 / 17.0, 777-200ER 63.7 / 60.9 / 18.5, 747-400 70.7 / 64.4 / 19.4,
// A380-800 72.7 / 79.8 / 24.1, A340-600 75.4 / 63.5 / 17.2, A330-300 63.7 / 60.3 / 16.8, 737 MAX 8 39.5 / 35.9 /
// 12.3, A321neo 44.5 / 35.8 / 11.8; fuselage widths 5.77 (787), 6.19 (777), 6.5 (747), 7.14 x 8.41 (A380), 5.64
// (A330/A340), 3.76 (737), 3.95 (A321). Wing, tail, engine and gear stations are read off three-view drawings.
// ---------------------------------------------------------------------------

export type V3 = [number, number, number];
export type JetType = "B787_9" | "B787_10" | "B777" | "B747" | "A380" | "A340" | "A330" | "B737MAX" | "A321";
export const JET_TYPES: readonly JetType[] = ["B787_9", "B787_10", "B777", "B747", "A380", "A340", "A330", "B737MAX", "A321"];
export type Detail = "hi" | "lo";

// --- small maths ------------------------------------------------------------------------------------------------
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => {
  const l = len3(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const hexV = (h: string): V3 => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
/** superellipse quarter: 0 at x 0 rising to 1 at x 1 (exp 2 = an ellipse) */
const quarter = (x: number, e: number) => (x >= 1 ? 1 : x <= 0 ? 0 : Math.pow(1 - Math.pow(1 - x, e), 1 / e));
/** smooth start, finite slope at the end (tail cones, belly upsweep) */
const rampIn = (x: number) => {
  const u = c01(x);
  return u * u * (2 - u);
};

// --- the paint on the parts (vertex colours; the fuselage and fin take canvas textures) -------------------------
export const PART = {
  skin: hexV("#EEE6D6"), // wings, stabilisers, nacelles: the airframe's cream, a touch greyer than the fuselage
  skinLo: hexV("#D9D0BF"), // pylons, flap fairings
  lip: hexV("#E4DCCB"), // the inlet's polished lip (warm, matte)
  cowl: hexV("#E8DECB"), // the nacelle cowl: a touch warmer than the wing, so it separates from it in plan
  duct: hexV("#5E5246"), // the inside of the inlet
  fan: hexV("#3A3029"), // the fan face (deep warm brown, never black)
  spinner: hexV("#B9B0A0"),
  nozzle: hexV("#8E8578"), // the core exhaust and plug (warm steel)
  strut: hexV("#C9C0AF"),
  tyre: hexV("#3B2F27"),
  hub: hexV("#A2988A"),
  cover: hexV("#FBF8F0"), // storage covers
  chock: hexV("#8A6E52"),
} as const;

// --- specs --------------------------------------------------------------------------------------------------------
type WingTip =
  | { kind: "plain" }
  | { kind: "raked"; len: number; sweep: number; ct: number }
  | { kind: "winglet"; h: number; cant: number; cr: number; ct: number; sweep: number }
  | { kind: "fence"; up: number; down: number; c: number }
  | { kind: "split"; up: number; down: number; cr: number; ct: number; sweep: number };
type EngineSpec = { z: number; ahead: number; len: number; dia: number; drop: number; chevrons?: boolean };
type GearLeg = { s: number; z: number; axles: number; gap?: number };
export type JetSpec = {
  label: string;
  /** reference overall figures (m) */
  overall: { length: number; span: number; height: number };
  // fuselage
  L: number;
  W: number;
  H: number;
  belly: number;
  nose: { top: number; bot: number; w: number; tip: number; exp: number; topExp?: number };
  tail: { bot0: number; top0: number; w0: number; endY: number; endR: number; endH?: number };
  hump?: { end: number; h: number; fall: number; rise: number };
  fairing: { s0: number; s1: number; d: number };
  // wing (LE at the centreline s = x0 * L)
  wing: { x0: number; span: number; sweep: number; c0: number; zk: number; teIn: number; ct: number; dih: number; y0: number; tc: [number, number]; tip: WingTip };
  engines: EngineSpec[];
  htp: { x0: number; span: number; cr: number; ct: number; sweep: number; dih: number; dy: number };
  fin: { x0: number; cr: number; ct: number; sweep: number; dorsal?: { s: number; h: number } };
  gear: { nose: number; main: GearLeg[]; r: number; wW: number };
  // paint layout
  windows: { s0: number; s1: number; pitch: number; w: number; h: number; y: number; doors: number[]; upper?: { s0: number; s1: number; y: number; doors: number[] } };
  cockpit: { s0: number; s1: number; panes: number; y0: number; y1: number; wrap?: boolean };
};

export const SPECS: Record<JetType, JetSpec> = {
  B787_9: {
    label: "787-9",
    overall: { length: 62.8, span: 60.1, height: 17.0 },
    L: 62.8,
    W: 5.77,
    H: 5.97,
    belly: 1.9,
    nose: { top: 9.4, bot: 4.6, w: 6.0, tip: -0.3, exp: 2.0, topExp: 1.85 },
    tail: { bot0: 0.73, top0: 0.83, w0: 0.78, endY: 0.42, endR: 0.38 },
    fairing: { s0: 0.3, s1: 0.6, d: 0.42 },
    wing: { x0: 0.326, span: 60.1, sweep: 35, c0: 14.2, zk: 9.8, teIn: 4, ct: 2.6, dih: 6, y0: -0.62, tc: [0.135, 0.09], tip: { kind: "raked", len: 5.2, sweep: 58, ct: 0.6 } },
    engines: [{ z: 9.8, ahead: 4.4, len: 5.6, dia: 3.4, drop: 1.75, chevrons: true }],
    htp: { x0: 0.835, span: 19.6, cr: 6.4, ct: 2.0, sweep: 40, dih: 7, dy: 0 },
    fin: { x0: 0.795, cr: 10.2, ct: 3.4, sweep: 44 },
    gear: { nose: 5.6, main: [{ s: 0.478, z: 4.9, axles: 2 }], r: 0.64, wW: 0.46 },
    windows: { s0: 6.6, s1: 52.5, pitch: 0.95, w: 0.29, h: 0.5, y: 0.34, doors: [5.4, 15.6, 34.6, 51.4] },
    cockpit: { s0: 2.3, s1: 4.5, panes: 2, y0: 0.3, y1: 0.86 },
  },
  B787_10: {
    label: "787-10",
    overall: { length: 68.3, span: 60.1, height: 17.0 },
    L: 68.3,
    W: 5.77,
    H: 5.97,
    belly: 1.9,
    nose: { top: 9.4, bot: 4.6, w: 6.0, tip: -0.3, exp: 2.0, topExp: 1.85 },
    tail: { bot0: 0.75, top0: 0.845, w0: 0.8, endY: 0.42, endR: 0.38 },
    fairing: { s0: 0.31, s1: 0.6, d: 0.42 },
    wing: { x0: 0.344, span: 60.1, sweep: 35, c0: 14.2, zk: 9.8, teIn: 4, ct: 2.6, dih: 6, y0: -0.62, tc: [0.135, 0.09], tip: { kind: "raked", len: 5.2, sweep: 58, ct: 0.6 } },
    engines: [{ z: 9.8, ahead: 4.4, len: 5.6, dia: 3.4, drop: 1.75, chevrons: true }],
    htp: { x0: 0.848, span: 19.6, cr: 6.4, ct: 2.0, sweep: 40, dih: 7, dy: 0 },
    fin: { x0: 0.812, cr: 10.2, ct: 3.4, sweep: 44 },
    gear: { nose: 5.6, main: [{ s: 0.49, z: 4.9, axles: 2 }], r: 0.64, wW: 0.46 },
    windows: { s0: 6.6, s1: 58.0, pitch: 0.95, w: 0.29, h: 0.5, y: 0.34, doors: [5.4, 15.6, 37.6, 56.6] },
    cockpit: { s0: 2.3, s1: 4.5, panes: 2, y0: 0.3, y1: 0.86 },
  },
  B777: {
    label: "777-200ER",
    overall: { length: 63.7, span: 60.9, height: 18.5 },
    L: 63.7,
    W: 6.19,
    H: 6.19,
    belly: 2.05,
    nose: { top: 8.6, bot: 4.2, w: 5.8, tip: -0.32, exp: 2.0, topExp: 2.25 },
    tail: { bot0: 0.74, top0: 0.84, w0: 0.78, endY: 0.5, endR: 0.16, endH: 0.75 },
    fairing: { s0: 0.3, s1: 0.6, d: 0.45 },
    wing: { x0: 0.334, span: 60.9, sweep: 35, c0: 15.6, zk: 10.5, teIn: 4, ct: 2.4, dih: 6, y0: -0.6, tc: [0.135, 0.09], tip: { kind: "plain" } },
    engines: [{ z: 9.6, ahead: 4.8, len: 7.2, dia: 3.9, drop: 1.55 }],
    htp: { x0: 0.838, span: 21.5, cr: 7.3, ct: 2.3, sweep: 39, dih: 7, dy: 0 },
    fin: { x0: 0.79, cr: 11.2, ct: 3.8, sweep: 45 },
    gear: { nose: 6.2, main: [{ s: 0.47, z: 5.5, axles: 3 }], r: 0.67, wW: 0.5 },
    windows: { s0: 6.4, s1: 54.0, pitch: 0.53, w: 0.24, h: 0.36, y: 0.33, doors: [5.2, 16.0, 35.6, 50.6] },
    cockpit: { s0: 2.55, s1: 4.75, panes: 3, y0: 0.42, y1: 0.74 },
  },
  B747: {
    label: "747-400",
    overall: { length: 70.7, span: 64.4, height: 19.4 },
    L: 70.6,
    W: 6.5,
    H: 6.9,
    belly: 2.25,
    nose: { top: 8.0, bot: 4.0, w: 6.2, tip: -0.36, exp: 2.0, topExp: 2.2 },
    tail: { bot0: 0.75, top0: 0.85, w0: 0.79, endY: 0.48, endR: 0.4 },
    hump: { end: 26.5, h: 2.45, fall: 7.5, rise: 14.0 },
    fairing: { s0: 0.3, s1: 0.58, d: 0.48 },
    wing: { x0: 0.322, span: 64.4, sweep: 40, c0: 16.4, zk: 12.4, teIn: 6, ct: 4.0, dih: 7, y0: -0.58, tc: [0.13, 0.08], tip: { kind: "winglet", h: 1.9, cant: 29, cr: 2.6, ct: 1.0, sweep: 58 } },
    engines: [
      { z: 11.9, ahead: 3.8, len: 5.4, dia: 2.95, drop: 1.55 },
      { z: 21.0, ahead: 3.2, len: 5.4, dia: 2.95, drop: 1.45 },
    ],
    htp: { x0: 0.83, span: 22.2, cr: 8.6, ct: 2.9, sweep: 40, dih: 7, dy: 0 },
    fin: { x0: 0.775, cr: 12.8, ct: 4.2, sweep: 47 },
    gear: { nose: 5.3, main: [{ s: 0.48, z: 5.6, axles: 2 }, { s: 0.53, z: 1.9, axles: 2 }], r: 0.62, wW: 0.46 },
    windows: { s0: 4.6, s1: 61.0, pitch: 0.51, w: 0.23, h: 0.34, y: 0.3, doors: [4.4, 14.6, 30.6, 44.2, 55.2], upper: { s0: 9.4, s1: 23.8, y: 0.92, doors: [21.4] } },
    cockpit: { s0: 5.2, s1: 7.4, panes: 3, y0: 1.18, y1: 1.42, wrap: false },
  },
  A380: {
    label: "A380-800",
    overall: { length: 72.7, span: 79.8, height: 24.1 },
    L: 72.7,
    W: 7.14,
    H: 8.41,
    belly: 2.0,
    nose: { top: 9.6, bot: 5.0, w: 6.8, tip: -0.3, exp: 2.0, topExp: 1.9 },
    tail: { bot0: 0.73, top0: 0.86, w0: 0.78, endY: 0.42, endR: 0.42 },
    fairing: { s0: 0.29, s1: 0.62, d: 0.62 },
    wing: { x0: 0.322, span: 79.8, sweep: 36, c0: 21.0, zk: 15.5, teIn: 4, ct: 4.2, dih: 5.6, y0: -0.6, tc: [0.135, 0.085], tip: { kind: "fence", up: 1.7, down: 0.9, c: 3.0 } },
    engines: [
      { z: 15.4, ahead: 4.8, len: 6.3, dia: 3.5, drop: 1.85 },
      { z: 25.8, ahead: 4.0, len: 6.3, dia: 3.5, drop: 1.65 },
    ],
    htp: { x0: 0.815, span: 30.4, cr: 10.4, ct: 3.4, sweep: 38, dih: 3, dy: 0.2 },
    fin: { x0: 0.77, cr: 13.6, ct: 4.4, sweep: 40 },
    gear: { nose: 6.6, main: [{ s: 0.455, z: 6.4, axles: 2 }, { s: 0.52, z: 3.0, axles: 3 }], r: 0.71, wW: 0.53 },
    windows: { s0: 7.4, s1: 63.0, pitch: 0.53, w: 0.25, h: 0.36, y: -0.06, doors: [6.6, 17.0, 35.4, 49.0, 59.4], upper: { s0: 9.8, s1: 60.4, y: 0.6, doors: [8.6, 27.6, 54.6] } },
    cockpit: { s0: 3.2, s1: 5.4, panes: 3, y0: 0.12, y1: 0.36, wrap: false },
  },
  A340: {
    label: "A340-600",
    overall: { length: 75.4, span: 63.5, height: 17.2 },
    L: 75.4,
    W: 5.64,
    H: 5.64,
    belly: 1.75,
    nose: { top: 8.4, bot: 4.0, w: 5.4, tip: -0.3, exp: 2.0, topExp: 2.1 },
    tail: { bot0: 0.77, top0: 0.86, w0: 0.81, endY: 0.42, endR: 0.32 },
    fairing: { s0: 0.36, s1: 0.6, d: 0.4 },
    wing: { x0: 0.39, span: 63.5, sweep: 33, c0: 13.8, zk: 9.6, teIn: 3, ct: 2.3, dih: 6, y0: -0.6, tc: [0.13, 0.09], tip: { kind: "winglet", h: 2.7, cant: 14, cr: 2.2, ct: 0.9, sweep: 46 } },
    engines: [
      { z: 10.5, ahead: 3.9, len: 6.6, dia: 2.8, drop: 1.4 },
      { z: 19.3, ahead: 3.4, len: 6.6, dia: 2.8, drop: 1.3 },
    ],
    htp: { x0: 0.86, span: 21.5, cr: 7.0, ct: 2.3, sweep: 37, dih: 6, dy: 0 },
    fin: { x0: 0.81, cr: 9.6, ct: 3.4, sweep: 42 },
    gear: { nose: 6.2, main: [{ s: 0.485, z: 5.4, axles: 2 }, { s: 0.515, z: 0, axles: 2 }], r: 0.62, wW: 0.45 },
    windows: { s0: 6.2, s1: 66.0, pitch: 0.53, w: 0.22, h: 0.33, y: 0.33, doors: [5.2, 16.4, 39.6, 51.0, 63.0] },
    cockpit: { s0: 2.3, s1: 4.3, panes: 3, y0: 0.4, y1: 0.72 },
  },
  A330: {
    label: "A330-300",
    overall: { length: 63.7, span: 60.3, height: 16.8 },
    L: 63.7,
    W: 5.64,
    H: 5.64,
    belly: 1.8,
    nose: { top: 8.4, bot: 4.0, w: 5.4, tip: -0.3, exp: 2.0, topExp: 2.1 },
    tail: { bot0: 0.74, top0: 0.84, w0: 0.78, endY: 0.42, endR: 0.32 },
    fairing: { s0: 0.34, s1: 0.6, d: 0.4 },
    wing: { x0: 0.388, span: 60.3, sweep: 33, c0: 13.8, zk: 9.6, teIn: 3, ct: 2.3, dih: 5.5, y0: -0.6, tc: [0.13, 0.09], tip: { kind: "winglet", h: 2.7, cant: 14, cr: 2.2, ct: 0.9, sweep: 46 } },
    engines: [{ z: 9.4, ahead: 4.2, len: 6.4, dia: 3.2, drop: 1.6 }],
    htp: { x0: 0.84, span: 19.4, cr: 6.6, ct: 2.1, sweep: 37, dih: 6, dy: 0 },
    fin: { x0: 0.787, cr: 9.6, ct: 3.4, sweep: 42 },
    gear: { nose: 5.4, main: [{ s: 0.495, z: 5.4, axles: 2 }], r: 0.62, wW: 0.45 },
    windows: { s0: 6.2, s1: 55.0, pitch: 0.53, w: 0.22, h: 0.33, y: 0.33, doors: [5.2, 15.4, 35.2, 52.6] },
    cockpit: { s0: 2.3, s1: 4.3, panes: 3, y0: 0.4, y1: 0.72 },
  },
  B737MAX: {
    label: "737 MAX 8",
    overall: { length: 39.5, span: 35.9, height: 12.3 },
    L: 39.5,
    W: 3.76,
    H: 4.01,
    belly: 1.05,
    nose: { top: 5.6, bot: 2.6, w: 3.8, tip: -0.32, exp: 2.0, topExp: 2.3 },
    tail: { bot0: 0.72, top0: 0.83, w0: 0.77, endY: 0.44, endR: 0.16, endH: 0.42 },
    fairing: { s0: 0.34, s1: 0.58, d: 0.26 },
    wing: { x0: 0.347, span: 35.9, sweep: 29, c0: 7.9, zk: 5.4, teIn: 5, ct: 1.5, dih: 6, y0: -0.62, tc: [0.13, 0.095], tip: { kind: "split", up: 2.4, down: 0.95, cr: 1.4, ct: 0.5, sweep: 50 } },
    engines: [{ z: 4.95, ahead: 3.0, len: 4.7, dia: 2.05, drop: 0.95 }],
    htp: { x0: 0.835, span: 14.4, cr: 4.5, ct: 1.4, sweep: 35, dih: 7, dy: 0 },
    fin: { x0: 0.775, cr: 6.9, ct: 2.1, sweep: 36, dorsal: { s: 0.66, h: 0.45 } },
    gear: { nose: 3.6, main: [{ s: 0.505, z: 2.85, axles: 1 }], r: 0.56, wW: 0.4 },
    windows: { s0: 4.6, s1: 32.8, pitch: 0.51, w: 0.22, h: 0.31, y: 0.32, doors: [3.4, 14.4, 16.2, 33.8] },
    cockpit: { s0: 1.85, s1: 3.35, panes: 3, y0: 0.4, y1: 0.74 },
  },
  A321: {
    label: "A321neo",
    overall: { length: 44.5, span: 35.8, height: 11.8 },
    L: 44.5,
    W: 3.95,
    H: 4.14,
    belly: 1.2,
    nose: { top: 5.8, bot: 2.8, w: 3.9, tip: -0.3, exp: 2.0, topExp: 2.1 },
    tail: { bot0: 0.74, top0: 0.84, w0: 0.78, endY: 0.42, endR: 0.22 },
    fairing: { s0: 0.36, s1: 0.6, d: 0.28 },
    wing: { x0: 0.402, span: 35.8, sweep: 27, c0: 7.6, zk: 6.0, teIn: 3, ct: 1.6, dih: 5, y0: -0.6, tc: [0.13, 0.1], tip: { kind: "winglet", h: 2.4, cant: 10, cr: 1.6, ct: 0.5, sweep: 52 } },
    engines: [{ z: 5.75, ahead: 2.7, len: 4.7, dia: 2.37, drop: 1.15 }],
    htp: { x0: 0.845, span: 12.5, cr: 4.1, ct: 1.4, sweep: 34, dih: 6, dy: 0 },
    fin: { x0: 0.79, cr: 6.2, ct: 2.2, sweep: 38 },
    gear: { nose: 4.4, main: [{ s: 0.53, z: 3.8, axles: 1 }], r: 0.58, wW: 0.4 },
    windows: { s0: 5.0, s1: 38.6, pitch: 0.53, w: 0.22, h: 0.33, y: 0.33, doors: [3.8, 13.8, 31.0, 40.2] },
    cockpit: { s0: 1.95, s1: 3.45, panes: 3, y0: 0.4, y1: 0.72 },
  },
};

// --- the fuselage -------------------------------------------------------------------------------------------------
export type Section = { yc: number; a: number; t: number; b: number };
/** The fuselage section at s (m from the nose tip): equator height yc, half-width a, upper half-height t, lower b. */
export const sectionAt = (sp: JetSpec, s: number): Section => {
  const { L, W, H, belly, nose, tail } = sp;
  const yc0 = belly + H / 2;
  const yTip = yc0 + nose.tip * (H / 2);
  const sc = Math.max(0, Math.min(L, s));
  // nose
  let yTop = yTip + (yc0 + H / 2 - yTip) * quarter(sc / nose.top, nose.topExp ?? nose.exp);
  let yBot = yTip - (yTip - (yc0 - H / 2)) * quarter(sc / nose.bot, nose.exp);
  let a = (W / 2) * quarter(sc / nose.w, nose.exp);
  let yc = yTip + (yc0 - yTip) * quarter(sc / nose.w, 2);
  // the 747's upper deck: the crown raised from the cockpit back to the hump's fairing
  if (sp.hump) {
    const hp = sp.hump;
    const rise = quarter(sc / hp.rise, 2.1);
    const fall = 1 - sstep(hp.end - hp.fall, hp.end, sc);
    yTop += hp.h * rise * fall;
  }
  // the tail cone: the belly sweeps up, the crown comes down, the width closes to the APU exhaust
  const endH = (tail.endH ?? tail.endR) * 1;
  const yEnd = yc0 + tail.endY * (H / 2);
  const sb0 = tail.bot0 * L;
  const st0 = tail.top0 * L;
  const sw0 = tail.w0 * L;
  if (sc > sb0) yBot = yc0 - H / 2 + (yEnd - endH - (yc0 - H / 2)) * rampIn((sc - sb0) / (L - sb0));
  if (sc > st0) yTop = yc0 + H / 2 + (yEnd + endH - (yc0 + H / 2)) * rampIn((sc - st0) / (L - st0));
  if (sc > sw0) a = W / 2 + (tail.endR - W / 2) * rampIn((sc - sw0) / (L - sw0));
  const inTail = sc > Math.min(sb0, st0);
  if (inTail) {
    const k = sstep(Math.min(sb0, st0), Math.min(sb0, st0) + 0.06 * L, sc);
    yc = lerp(yc0, (yTop + yBot) / 2, k);
  }
  // the belly fairing at the wing box
  const f = sp.fairing;
  const fs0 = f.s0 * L;
  const fs1 = f.s1 * L;
  if (sc > fs0 && sc < fs1) {
    const u = (sc - fs0) / (fs1 - fs0);
    const bump = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.85)), 0.7);
    yBot -= f.d * bump;
  }
  // close the very end (a small blunt APU cone)
  if (sc > L - 0.35) {
    const k = c01((L - sc) / 0.35);
    const m = Math.sqrt(k);
    a *= m;
    const mid = (yTop + yBot) / 2;
    yTop = mid + (yTop - mid) * m;
    yBot = mid + (yBot - mid) * m;
    yc = mid;
  }
  yc = Math.max(yBot + 1e-4, Math.min(yTop - 1e-4, yc));
  return { yc, a: Math.max(0, a), t: Math.max(0, yTop - yc), b: Math.max(0, yc - yBot) };
};
/** a point on the fuselage surface at s, angle phi (0 = the crown, + toward starboard), local frame */
export const fusePoint = (sp: JetSpec, s: number, phi: number): V3 => {
  const q = sectionAt(sp, s);
  const c = Math.cos(phi);
  const y = q.yc + (c >= 0 ? q.t : q.b) * c;
  return [sp.L / 2 - s, y, q.a * Math.sin(phi)];
};
export const crownAt = (sp: JetSpec, s: number) => {
  const q = sectionAt(sp, s);
  return q.yc + q.t;
};

// --- mesh buffers -------------------------------------------------------------------------------------------------
export type MeshData = { pos: Float32Array; nor: Float32Array; uv: Float32Array; col: Float32Array; aux: Float32Array; idx: Uint32Array };
class Buf {
  p: number[] = [];
  n: number[] = [];
  t: number[] = [];
  c: number[] = [];
  /** aux: x = wipe coordinate (covers), y z w = the slide offset at stored 0 (chocks) */
  a: number[] = [];
  i: number[] = [];
  get count() {
    return this.p.length / 3;
  }
  vert(p: V3, n: V3, uv: [number, number], c: V3, aux: [number, number, number, number] = [0, 0, 0, 0]) {
    this.p.push(p[0], p[1], p[2]);
    this.n.push(n[0], n[1], n[2]);
    this.t.push(uv[0], uv[1]);
    this.c.push(c[0], c[1], c[2]);
    this.a.push(aux[0], aux[1], aux[2], aux[3]);
    return this.count - 1;
  }
  data(): MeshData {
    return {
      pos: new Float32Array(this.p),
      nor: new Float32Array(this.n),
      uv: new Float32Array(this.t),
      col: new Float32Array(this.c),
      aux: new Float32Array(this.a),
      idx: new Uint32Array(this.i),
    };
  }
}
type LoftOpts = {
  nu: number;
  nv: number;
  P: (u: number, v: number) => V3;
  closedV?: boolean;
  /** a point (by u) the normal must face AWAY from; omit to keep du x dv */
  inside?: (u: number) => V3;
  flip?: boolean;
  color: (u: number, v: number) => V3;
  uv?: (u: number, v: number, p: V3) => [number, number];
  aux?: (u: number, v: number, p: V3) => [number, number, number, number];
};
const loft = (b: Buf, o: LoftOpts) => {
  const base = b.count;
  const e = 1e-4;
  for (let i = 0; i <= o.nu; i++) {
    const u = i / o.nu;
    for (let j = 0; j <= o.nv; j++) {
      const v = j / o.nv;
      const p = o.P(u, v);
      const uA = Math.max(0, u - e);
      const uB = Math.min(1, u + e);
      const vA = o.closedV ? v - e : Math.max(0, v - e);
      const vB = o.closedV ? v + e : Math.min(1, v + e);
      const du = sub(o.P(uB, v), o.P(uA, v));
      let dv = sub(o.P(u, vB), o.P(u, vA));
      if (len3(dv) < 1e-9) {
        // a pinched end (nose tip, wing tip): take the ring's tangent a little way in
        const uu = u < 0.5 ? Math.min(1, u + 0.01) : Math.max(0, u - 0.01);
        dv = sub(o.P(uu, vB), o.P(uu, vA));
      }
      let n = norm(cross(du, dv));
      if (len3(cross(du, dv)) < 1e-12) n = [0, 1, 0];
      if (o.flip) n = mul(n, -1);
      if (o.inside) {
        const c = o.inside(u);
        if (dot(n, sub(p, c)) < 0) n = mul(n, -1);
      }
      b.vert(p, n, o.uv ? o.uv(u, v, p) : [u, v], o.color(u, v), o.aux ? o.aux(u, v, p) : [0, 0, 0, 0]);
    }
  }
  const row = o.nv + 1;
  for (let i = 0; i < o.nu; i++) {
    for (let j = 0; j < o.nv; j++) {
      const a = base + i * row + j;
      const c = a + row;
      b.i.push(a, c, a + 1, a + 1, c, c + 1);
    }
  }
};
/** a closed disc (fan) facing `n`, centre c, radius r (in the plane spanned by e1, e2) */
const disc = (b: Buf, c: V3, e1: V3, e2: V3, r: number, n: V3, col: V3, seg = 24, wipe = false) => {
  for (let k = 0; k < seg; k++) {
    const a0 = (k / seg) * Math.PI * 2;
    const a1 = ((k + 1) / seg) * Math.PI * 2;
    const w = wipe ? (k + 0.5) / seg : 0;
    const ia = b.vert(c, n, [0.5, 0.5], col, [w, 0, 0, 0]);
    const ib = b.vert(add(c, add(mul(e1, r * Math.cos(a0)), mul(e2, r * Math.sin(a0)))), n, [0, 0], col, [w, 0, 0, 0]);
    const ic = b.vert(add(c, add(mul(e1, r * Math.cos(a1)), mul(e2, r * Math.sin(a1)))), n, [0, 0], col, [w, 0, 0, 0]);
    b.i.push(ia, ib, ic);
  }
};
/** a capped cylinder from a to b, radius r */
const cylinder = (buf: Buf, a: V3, bb: V3, r: number, col: V3, seg = 12, caps = true, slide: V3 = [0, 0, 0]) => {
  const ax = norm(sub(bb, a));
  const ref: V3 = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const e1 = norm(cross(ax, ref));
  const e2 = cross(ax, e1);
  const aux: [number, number, number, number] = [0, slide[0], slide[1], slide[2]];
  loft(buf, {
    nu: 1,
    nv: seg,
    closedV: true,
    P: (u, v) => {
      const c = add(a, mul(sub(bb, a), u));
      const t = v * Math.PI * 2;
      return add(c, add(mul(e1, r * Math.cos(t)), mul(e2, r * Math.sin(t))));
    },
    inside: (u) => add(a, mul(sub(bb, a), u)),
    color: () => col,
    aux: () => aux,
  });
  if (caps) {
    const before = buf.count;
    disc(buf, a, e1, e2, r, mul(ax, -1), col, seg);
    disc(buf, bb, e1, e2, r, ax, col, seg);
    for (let k = before; k < buf.count; k++) {
      buf.a[k * 4 + 1] = slide[0];
      buf.a[k * 4 + 2] = slide[1];
      buf.a[k * 4 + 3] = slide[2];
    }
  }
};
/** a box from its centre and three half-axes */
const box = (buf: Buf, c: V3, ex: V3, ey: V3, ez: V3, col: V3, slide: V3 = [0, 0, 0]) => {
  const faces: [V3, V3, V3][] = [
    [ex, ey, ez],
    [mul(ex, -1), ez, ey],
    [ey, ez, ex],
    [mul(ey, -1), ex, ez],
    [ez, ex, ey],
    [mul(ez, -1), ey, ex],
  ];
  for (const [n, u, v] of faces) {
    const nn = norm(n);
    const fc = add(c, n);
    const q = [add(add(fc, u), v), add(sub(fc, u), v), sub(sub(fc, u), v), add(sub(fc, v), u)];
    const ids = q.map((p) => buf.vert(p, nn, [0, 0], col, [0, slide[0], slide[1], slide[2]]));
    buf.i.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
  }
};

// --- airfoil slabs (wings, tails, fin, winglets, pylons) ---------------------------------------------------------
type Station = { le: V3; chord: number; tc: number; up: V3; cam?: number };
/** NACA 4-digit half-thickness (closed trailing edge) */
const naca = (x: number, tc: number) => 5 * tc * (0.2969 * Math.sqrt(Math.max(0, x)) - 0.126 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1036 * x * x * x * x);
const slab = (buf: Buf, st: Station[], col: V3 | ((u: number, v: number) => V3), nv: number, sub2 = 6, uvf?: (u: number, v: number, p: V3) => [number, number]) => {
  const n = st.length;
  const at = (u: number): Station => {
    const f = u * (n - 1);
    const i = Math.min(n - 2, Math.floor(f));
    const t = f - i;
    const A = st[i];
    const B = st[i + 1];
    return {
      le: add(A.le, mul(sub(B.le, A.le), t)),
      chord: lerp(A.chord, B.chord, t),
      tc: lerp(A.tc, B.tc, t),
      up: norm(add(A.up, mul(sub(B.up, A.up), t))),
      cam: lerp(A.cam ?? 0.02, B.cam ?? 0.02, t),
    };
  };
  const chordDir: V3 = [-1, 0, 0]; // LE -> TE runs aft (local -x)
  const P = (u: number, v: number): V3 => {
    const s = at(u);
    const th = v * Math.PI * 2;
    const xi = (1 + Math.cos(th)) / 2; // 1 at the TE (v 0 / 1), 0 at the LE (v 0.5)
    const upper = v < 0.5;
    const yt = naca(xi, s.tc) * s.chord;
    const camber = (s.cam ?? 0.02) * s.chord * 4 * xi * (1 - xi);
    const off = (upper ? yt : -yt) + camber;
    return add(add(s.le, mul(chordDir, xi * s.chord)), mul(s.up, off));
  };
  loft(buf, {
    nu: (n - 1) * sub2,
    nv,
    closedV: true,
    P,
    inside: (u) => {
      const s = at(u);
      return add(s.le, mul(chordDir, 0.4 * s.chord));
    },
    color: typeof col === "function" ? col : () => col,
    uv: uvf,
  });
};

// --- wings ---------------------------------------------------------------------------------------------------------
const rad = (d: number) => (d * Math.PI) / 180;
export type WingGeo = { leAt: (z: number) => number; chordAt: (z: number) => number; yAt: (z: number) => number; semi: number };
/** the main wing's planform and height (starboard z >= 0; s of the LE, chord, chord-line y) */
export const wingGeo = (sp: JetSpec): WingGeo => {
  const w = sp.wing;
  const semi = w.span / 2;
  const sLE0 = w.x0 * sp.L;
  const yc0 = sp.belly + sp.H / 2;
  const yRoot = yc0 + w.y0 * (sp.H / 2);
  const teK = sLE0 + w.c0 + w.zk * Math.tan(rad(w.teIn));
  const tip = w.tip;
  const rakeLen = tip.kind === "raked" ? tip.len : 0;
  const zr = semi - rakeLen;
  const leMain = (z: number) => sLE0 + z * Math.tan(rad(w.sweep));
  const teMain = (z: number) => {
    if (z <= w.zk) return sLE0 + w.c0 + z * Math.tan(rad(w.teIn));
    const t = (z - w.zk) / (semi - w.zk);
    return lerp(teK, leMain(semi) + w.ct, t);
  };
  const leAt = (z: number) => {
    if (tip.kind === "raked" && z > zr) return leMain(zr) + (z - zr) * Math.tan(rad(tip.sweep));
    return leMain(z);
  };
  const chordAt = (z: number) => {
    if (tip.kind === "raked" && z > zr) {
      const t = (z - zr) / rakeLen;
      const teR = teMain(zr);
      const teTip = leAt(semi) + tip.ct;
      return lerp(teR, teTip, Math.pow(t, 0.8)) - leAt(z);
    }
    return teMain(z) - leMain(z);
  };
  const yAt = (z: number) => yRoot + z * Math.tan(rad(w.dih));
  return { leAt, chordAt, yAt, semi };
};
const tcAt = (sp: JetSpec, z: number) => lerp(sp.wing.tc[0], sp.wing.tc[1], c01(z / (sp.wing.span / 2)));
const buildWing = (buf: Buf, sp: JetSpec, det: Detail) => {
  const g = wingGeo(sp);
  const w = sp.wing;
  const up0 = norm([0, Math.cos(rad(w.dih)), -Math.sin(rad(w.dih))]);
  const zs: number[] = [0.2, sp.W * 0.5, w.zk, (w.zk + g.semi) / 2];
  if (w.tip.kind === "raked") zs.push(g.semi - w.tip.len, g.semi - w.tip.len * 0.45);
  zs.push(g.semi - 0.04, g.semi);
  zs.sort((a, b) => a - b);
  for (const side of [1, -1]) {
    const st: Station[] = zs.map((z, i) => {
      const last = i === zs.length - 1;
      return {
        le: [sp.L / 2 - g.leAt(z), g.yAt(z), side * z],
        chord: Math.max(0.05, g.chordAt(z)),
        tc: last ? 0.004 : tcAt(sp, z),
        up: [0, up0[1], side * up0[2]],
        cam: last ? 0 : 0.02,
      };
    });
    slab(buf, st, PART.skin, det === "hi" ? 28 : 14, det === "hi" ? 4 : 2);
    // the tip devices
    const tip = w.tip;
    const tz = g.semi;
    const tipLE = g.leAt(tz - 0.04);
    const tipC = g.chordAt(tz - 0.04);
    const ty = g.yAt(tz);
    if (tip.kind === "winglet" || tip.kind === "split") {
      const parts = tip.kind === "winglet" ? [{ h: tip.h, cant: tip.cant, dir: 1 }] : [{ h: tip.up, cant: 18, dir: 1 }, { h: tip.down, cant: 40, dir: -1 }];
      for (const p of parts) {
        const sts: Station[] = [];
        const steps = 5;
        for (let k = 0; k <= steps; k++) {
          const t = k / steps;
          // a blended curve from the tip into the winglet (quarter turn), then straight
          const ang = p.dir * Math.min(1, t * 2.2) * (Math.PI / 2 - rad(p.cant));
          const r = Math.min(t, 0.45) * 0.7;
          const hh = Math.max(0, t - 0.2) * p.h / 0.8;
          const zz = tz - 0.1 + r * Math.cos(ang) * 0.4 + hh * Math.sin(rad(p.cant)) * 1;
          const yy = ty + p.dir * (hh * Math.cos(rad(p.cant)) + r * 0.25);
          const sweepOff = hh * Math.tan(rad(tip.sweep));
          const chord = lerp(Math.min(tipC, tip.cr), tip.ct, Math.pow(t, 0.9));
          const leS = tipLE + (tipC - chord) * 0.35 + sweepOff;
          const upv = norm([0, -Math.sin(ang) * p.dir * 0 + Math.cos(ang), -Math.sin(ang)]);
          sts.push({ le: [sp.L / 2 - leS, yy, side * zz], chord, tc: k === steps ? 0.004 : 0.09, up: [0, upv[1] * p.dir, side * upv[2] * p.dir], cam: 0 });
        }
        slab(buf, sts, PART.skin, det === "hi" ? 16 : 8, 2);
      }
    } else if (tip.kind === "fence") {
      const fenceSt: Station[] = [
        { le: [sp.L / 2 - (tipLE + 0.2), ty - tip.down, side * (tz + 0.05)], chord: tip.c * 0.8, tc: 0.004, up: [0, 0, side], cam: 0 },
        { le: [sp.L / 2 - (tipLE - 0.6), ty, side * (tz + 0.05)], chord: tip.c, tc: 0.08, up: [0, 0, side], cam: 0 },
        { le: [sp.L / 2 - (tipLE + 0.5), ty + tip.up, side * (tz + 0.05)], chord: tip.c * 0.55, tc: 0.004, up: [0, 0, side], cam: 0 },
      ];
      slab(buf, fenceSt.map((s) => ({ ...s })), PART.skin, 10, 2);
    }
  }
};

// --- tails ---------------------------------------------------------------------------------------------------------
const buildHtp = (buf: Buf, sp: JetSpec, det: Detail) => {
  const h = sp.htp;
  const s0 = h.x0 * sp.L;
  const q = sectionAt(sp, s0 + h.cr * 0.4);
  const y0 = q.yc + h.dy;
  const semi = h.span / 2;
  for (const side of [1, -1]) {
    const up = norm([0, Math.cos(rad(h.dih)), -side * Math.sin(rad(h.dih))]);
    const zs = [0, semi * 0.5, semi - 0.03, semi];
    const st: Station[] = zs.map((z, i) => ({
      le: [sp.L / 2 - (s0 + z * Math.tan(rad(h.sweep))), y0 + z * Math.tan(rad(h.dih)), side * z],
      chord: lerp(h.cr, h.ct, z / semi),
      tc: i === zs.length - 1 ? 0.004 : 0.1,
      up,
      cam: 0,
    }));
    slab(buf, st, PART.skin, det === "hi" ? 18 : 10, 2);
  }
};
/** The fin's geometry: root LE s, the root's y (on the crown), the tip y, and the planform box for the texture. */
export const finGeo = (sp: JetSpec) => {
  const f = sp.fin;
  const s0 = f.x0 * sp.L;
  const yRoot = crownAt(sp, s0 + 0.5);
  const yTip = sp.overall.height;
  const hgt = yTip - yRoot;
  const leAt = (y: number) => s0 + (y - yRoot) * Math.tan(rad(f.sweep));
  const chordAt = (y: number) => lerp(f.cr, f.ct, c01((y - yRoot) / hgt));
  // the texture box (s across, y down)
  const box = { s0: s0 - 0.5, s1: Math.max(s0 + f.cr, leAt(yTip) + f.ct) + 0.5, y0: yRoot - 1.2, y1: yTip + 0.3 };
  return { s0, yRoot, yTip, hgt, leAt, chordAt, box };
};
const buildFin = (buf: Buf, sp: JetSpec, det: Detail) => {
  const fg = finGeo(sp);
  const f = sp.fin;
  const ys: number[] = [fg.yRoot - 1.1, fg.yRoot, fg.yRoot + fg.hgt * 0.5, fg.yTip - 0.05, fg.yTip];
  const st: Station[] = ys.map((y, i) => {
    const yy = Math.max(fg.yRoot, y);
    return { le: [sp.L / 2 - fg.leAt(yy), y, 0], chord: fg.chordAt(yy), tc: i === ys.length - 1 ? 0.004 : 0.1, up: [0, 0, 1], cam: 0 };
  });
  if (f.dorsal) {
    // the 737's long dorsal fillet: a low, long station ahead of the fin root
    const sd = f.dorsal.s * sp.L;
    const yd = crownAt(sp, sd + 1) + f.dorsal.h;
    st.splice(1, 0, { le: [sp.L / 2 - sd, yd - 0.9, 0], chord: fg.s0 + f.cr - sd, tc: 0.05, up: [0, 0, 1], cam: 0 });
    st[0] = { le: [sp.L / 2 - sd, yd - 1.6, 0], chord: fg.s0 + f.cr - sd, tc: 0.05, up: [0, 0, 1], cam: 0 };
  }
  const bx = fg.box;
  slab(buf, st, [1, 1, 1], det === "hi" ? 22 : 12, det === "hi" ? 3 : 2, (_u, _v, p) => [(sp.L / 2 - p[0] - bx.s0) / (bx.s1 - bx.s0), (bx.y1 - p[1]) / (bx.y1 - bx.y0)]);
};

// --- engines -------------------------------------------------------------------------------------------------------
export type EngineGeo = { sIn: number; y: number; z: number; R: number; len: number };
export const engineGeos = (sp: JetSpec): EngineGeo[] => {
  const g = wingGeo(sp);
  const out: EngineGeo[] = [];
  for (const e of sp.engines) {
    const sIn = g.leAt(e.z) - e.ahead;
    const y = g.yAt(e.z) - e.drop;
    out.push({ sIn, y, z: e.z, R: e.dia / 2, len: e.len });
    out.push({ sIn, y, z: -e.z, R: e.dia / 2, len: e.len });
  }
  return out;
};
const buildEngine = (buf: Buf, covers: Buf, sp: JetSpec, eg: EngineGeo, chevrons: boolean, det: Detail) => {
  const { sIn, y, z, R, len } = eg;
  // the nacelle's meridian (ds from the lip forward plane, r / R): inside the duct -> lip -> outer cowl -> nozzle
  const mer: [number, number][] = [
    [0.55, 0.82],
    [0.14, 0.84],
    [0.03, 0.86],
    [0.0, 0.885],
    [0.06, 0.915],
    [0.2, 0.952],
    [0.45, 0.982],
    [0.85, 1.0],
    [len * 0.5, 1.0],
    [len * 0.72, 0.95],
    [len * 0.88, 0.86],
    [len, 0.74],
  ];
  // arc-length parametrisation of the meridian
  const cum: number[] = [0];
  for (let k = 1; k < mer.length; k++) cum.push(cum[k - 1] + Math.hypot(mer[k][0] - mer[k - 1][0], (mer[k][1] - mer[k - 1][1]) * R));
  const total = cum[cum.length - 1];
  const merAt = (u: number): [number, number] => {
    const d = u * total;
    let k = 1;
    while (k < cum.length - 1 && cum[k] < d) k++;
    const t = (d - cum[k - 1]) / Math.max(1e-6, cum[k] - cum[k - 1]);
    return [lerp(mer[k - 1][0], mer[k][0], t), lerp(mer[k - 1][1], mer[k][1], t)];
  };
  const nCh = 14;
  const nv = det === "hi" ? 56 : 24;
  const lipU = cum[3] / total;
  loft(buf, {
    nu: det === "hi" ? 40 : 18,
    nv,
    closedV: true,
    P: (u, v) => {
      const [ds, r] = merAt(u);
      const ph = v * Math.PI * 2;
      let sx = sIn + ds;
      if (chevrons && u > 0.985) {
        const tri = Math.abs(((v * nCh) % 1) - 0.5) * 2; // 0 at a chevron tip .. 1 between
        sx += (1 - tri) * 0.22 * R * ((u - 0.985) / 0.015);
      }
      return [sp.L / 2 - sx, y + r * R * Math.cos(ph), z + r * R * Math.sin(ph)];
    },
    color: (u) => (u < lipU * 0.92 ? PART.duct : u < lipU * 1.6 ? PART.lip : PART.cowl),
  });
  // the fan face and spinner
  const fanS = sIn + 0.55;
  const ex: V3 = [0, 0, 1];
  const ey: V3 = [0, 1, 0];
  disc(buf, [sp.L / 2 - fanS, y, z], ex, ey, 0.85 * R, [1, 0, 0], PART.fan, det === "hi" ? 40 : 18);
  loft(buf, {
    nu: 6,
    nv: det === "hi" ? 20 : 10,
    closedV: true,
    P: (u, v) => {
      const r = 0.24 * R * Math.sqrt(u);
      const ph = v * Math.PI * 2;
      return [sp.L / 2 - (fanS - 0.42 * R + u * 0.42 * R - 0.01), y + r * Math.cos(ph), z + r * Math.sin(ph)];
    },
    inside: () => [sp.L / 2 - fanS, y, z],
    color: () => PART.spinner,
  });
  // the core cowl and exhaust plug behind the fan nozzle
  loft(buf, {
    nu: 10,
    nv: det === "hi" ? 28 : 12,
    closedV: true,
    P: (u, v) => {
      const sx = sIn + len - 0.5 + u * (0.5 + 0.9 * R);
      const r = u < 0.55 ? lerp(0.62, 0.44, u / 0.55) * R : lerp(0.44, 0.0, Math.pow((u - 0.55) / 0.45, 1.3)) * R;
      const ph = v * Math.PI * 2;
      return [sp.L / 2 - sx, y + r * Math.cos(ph), z + r * Math.sin(ph)];
    },
    inside: () => [sp.L / 2 - (sIn + len), y, z],
    color: (u) => (u < 0.55 ? PART.nozzle : PART.spinner),
  });
  // the pylon: a slim slab from the nacelle's top up into the wing
  const g = wingGeo(sp);
  const az = Math.abs(z);
  const sideSign = Math.sign(z) || 1;
  const wingY = g.yAt(az);
  const pyl: Station[] = [
    { le: [sp.L / 2 - (sIn + len * 0.28), y + R * 0.8, z], chord: len * 0.8, tc: 0.14, up: [0, 0, sideSign], cam: 0 },
    { le: [sp.L / 2 - (g.leAt(az) - 0.2), wingY + 0.15, z], chord: g.chordAt(az) * 0.72, tc: 0.12, up: [0, 0, sideSign], cam: 0 },
  ];
  slab(buf, pyl, PART.skinLo, det === "hi" ? 12 : 8, 2);
  // the storage cover over the inlet (wiped on by `stored`): a cap over the intake and a sleeve over the lip,
  // so it reads from the side too
  disc(covers, [sp.L / 2 - (sIn - 0.07), y, z], ex, ey, 0.97 * R, [1, 0, 0], PART.cover, 32, true);
  loft(covers, {
    nu: 3,
    nv: 32,
    closedV: true,
    P: (u, v) => {
      const sx = sIn - 0.07 + u * (0.32 + 0.45 * R);
      const r = R * (1.03 + 0.02 * Math.sin(u * Math.PI)) * (u < 0.15 ? 0.94 + 0.4 * u : 1);
      const ph = v * Math.PI * 2;
      return [sp.L / 2 - sx, y + r * Math.cos(ph), z + r * Math.sin(ph)];
    },
    inside: () => [sp.L / 2 - (sIn + 0.3), y, z],
    color: () => PART.cover,
    aux: (_u, v) => [Math.max(0.001, ((v + 0.25) % 1)), 0, 0, 0],
  });
};

// --- gear ----------------------------------------------------------------------------------------------------------
const buildGear = (buf: Buf, chocks: Buf, sp: JetSpec) => {
  const r = sp.gear.r;
  const wW = sp.gear.wW;
  const legs: { s: number; z: number; axles: number; nose: boolean }[] = [{ s: sp.gear.nose, z: 0, axles: 1, nose: true }];
  for (const m of sp.gear.main) {
    legs.push({ s: m.s * sp.L, z: m.z, axles: m.axles, nose: false });
    if (m.z > 0.01) legs.push({ s: m.s * sp.L, z: -m.z, axles: m.axles, nose: false });
  }
  for (const lg of legs) {
    const rr = lg.nose ? r * 0.72 : r;
    const pitch = rr * 2.25;
    const axS = Array.from({ length: lg.axles }, (_, k) => lg.s + (k - (lg.axles - 1) / 2) * pitch);
    // the leg: from inside the belly / wing down to the bogie
    const topY = lg.nose ? crownAt(sp, lg.s) - sp.H * 0.6 : sectionAt(sp, lg.s).yc - 0.4;
    const x = sp.L / 2 - lg.s;
    cylinder(buf, [x, topY, lg.z], [x, rr * 1.15, lg.z], lg.nose ? 0.11 : 0.19, PART.strut, 10);
    if (lg.axles > 1) {
      // the bogie beam
      cylinder(buf, [sp.L / 2 - axS[0], rr, lg.z], [sp.L / 2 - axS[axS.length - 1], rr, lg.z], 0.12, PART.strut, 8);
    }
    for (const as of axS) {
      const ax = sp.L / 2 - as;
      const half = wW * 0.5 + 0.06;
      for (const zz of [lg.z - half - (lg.nose ? 0 : 0.02), lg.z + half]) {
        cylinder(buf, [ax, rr, zz - wW / 2], [ax, rr, zz + wW / 2], rr, PART.tyre, 18);
        cylinder(buf, [ax, rr, zz - wW / 2 - 0.01], [ax, rr, zz + wW / 2 + 0.01], rr * 0.5, PART.hub, 12);
      }
      cylinder(buf, [ax, rr, lg.z - half - wW / 2], [ax, rr, lg.z + half + wW / 2], 0.08, PART.strut, 8, false);
    }
    // chocks fore and aft of the outer wheels (slide out from under the tyre)
    if (!lg.nose) {
      for (const s of [axS[0] - rr - 0.18, axS[axS.length - 1] + rr + 0.18]) {
        const dir = s < lg.s ? 1 : -1;
        box(chocks, [sp.L / 2 - s, 0.17, lg.z], [0.18, 0, 0], [0, 0.17, 0], [0, 0, wW * 1.3], PART.chock, [-dir * 0.4, 0, 0]);
      }
    }
  }
};

// --- the whole jet -------------------------------------------------------------------------------------------------
export type JetBuild = {
  spec: JetSpec;
  /** the fuselage: uv = (s / L, phi / 2pi) for the paint texture */
  skin: MeshData;
  /** the fin: uv = planar (s, y) over finGeo().box */
  fin: MeshData;
  /** wings, tails, nacelles, pylons (vertex colours) */
  parts: MeshData;
  gear: MeshData;
  /** inlet covers (aux.x = wipe) and chocks (aux.yzw = slide) */
  covers: MeshData;
  /** the planform (top view) as triangles [x, z, x, z, x, z ...] for the shadow */
  plan: Float32Array;
};
const cache = new Map<string, JetBuild>();
/** s along the fuselage for u: denser at the nose and the tail */
const sOfU = (L: number, u: number) => L * (u - (0.62 * Math.sin(2 * Math.PI * u)) / (2 * Math.PI));
export const buildJet = (type: JetType, det: Detail = "hi"): JetBuild => {
  const key = `${type}:${det}`;
  const have = cache.get(key);
  if (have) return have;
  const sp = SPECS[type];
  const skin = new Buf();
  loft(skin, {
    nu: det === "hi" ? 160 : 60,
    nv: det === "hi" ? 72 : 28,
    closedV: true,
    P: (u, v) => fusePoint(sp, sOfU(sp.L, u), v * Math.PI * 2),
    color: () => [1, 1, 1],
    uv: (u, v) => [sOfU(sp.L, u) / sp.L, v],
  });
  const fin = new Buf();
  buildFin(fin, sp, det);
  const parts = new Buf();
  const covers = new Buf();
  buildWing(parts, sp, det);
  buildHtp(parts, sp, det);
  const egs = engineGeos(sp);
  for (const eg of egs) {
    const spec = sp.engines.find((e) => Math.abs(e.z - Math.abs(eg.z)) < 0.01);
    buildEngine(parts, covers, sp, eg, det === "hi" && !!spec?.chevrons, det);
  }
  const gear = new Buf();
  buildGear(gear, covers, sp);
  // the planform: every triangle of the airframe projected straight down (x, z)
  const planTris: number[] = [];
  for (const b of [skin, fin, parts]) {
    for (let k = 0; k < b.i.length; k++) {
      const vi = b.i[k];
      planTris.push(b.p[vi * 3], b.p[vi * 3 + 2]);
    }
  }
  const out: JetBuild = { spec: sp, skin: skin.data(), fin: fin.data(), parts: parts.data(), gear: gear.data(), covers: covers.data(), plan: new Float32Array(planTris) };
  cache.set(key, out);
  return out;
};

/** Named points on a jet (LOCAL frame), for cut builders who aim cameras or pin overlays. */
export const jetPoints = (type: JetType) => {
  const sp = SPECS[type];
  const fg = finGeo(sp);
  const g = wingGeo(sp);
  const yc0 = sp.belly + sp.H / 2;
  const x = (s: number) => sp.L / 2 - s;
  const finMidY = fg.yRoot + fg.hgt * 0.45;
  return {
    nose: [x(0), yc0 + sp.nose.tip * (sp.H / 2), 0] as V3,
    tail: [x(sp.L), crownAt(sp, sp.L - 0.4), 0] as V3,
    cockpit: [x((sp.cockpit.s0 + sp.cockpit.s1) / 2), yc0 + sp.H * 0.4, 0] as V3,
    crownMid: [x(sp.L * 0.5), crownAt(sp, sp.L * 0.5), 0] as V3,
    finTop: [x(fg.leAt(fg.yTip) + sp.fin.ct / 2), fg.yTip, 0] as V3,
    /** the centre of the tail mark on the fin */
    finMark: [x(fg.leAt(finMidY) + fg.chordAt(finMidY) * 0.5), finMidY, 0] as V3,
    wingTipR: [x(g.leAt(g.semi) + 0.5), g.yAt(g.semi), g.semi] as V3,
    wingTipL: [x(g.leAt(g.semi) + 0.5), g.yAt(g.semi), -g.semi] as V3,
    mainGear: [x(sp.gear.main[0].s * sp.L), 0, 0] as V3,
  };
};
