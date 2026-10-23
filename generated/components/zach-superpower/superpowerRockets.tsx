import React from "react";
import { interpolate } from "remotion";
import {
  BLACK,
  CHAIN,
  EASE_LAND,
  INK,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  clamp,
} from "../kits/core-memory/deathCountShared";

// ---------------------------------------------------------------------------
// "ZACH - AMERICA'S REAL SUPERPOWER" — the rocket glyph module (owner: builder A,
// cut 11 SixOrSevenCompetitors). Read-only for cut 6 (SatellitesAndRockets) and
// the 74 s cut (one or two companies vs eight copying). Add, never rename; log
// every change in animation_source/notes/SHARED_CHANGES.md.
//
// LEGEND (the clip's, COMMON.md): white ink on squared paper on the hard black
// +4/+4 shadow, no outlines round white shapes. Black on white = print (no
// shadow on print). SOLID = counted, HOLLOW (a white STROKE outline on its
// shadow outline, nothing inside) = the "up to" part of a range. THE CHAIN
// ECHO = COPIES: only on China's would-be copies, never on the Falcon 9.
//
// THE GLYPHS are flat side profiles built from each rocket's real outline in
// metres: heights TRUE to each other (PX_PER_M world px per metre), every
// diameter multiplied by ONE common factor DIAM_X so the thinnest still reads
// as chunky. Each glyph is one closed right-half outline mirrored about the
// rocket's axis (so a HOLLOW glyph is one clean ring), plus black print.
//
// HEIGHTS AND SOURCES. animation_source/refs/ was never delivered while this
// was built, so the figures were checked by web search against launch
// databases (no files downloaded). Outline details (stage joints, nose
// lengths, fin / grid-fin / leg positions) are drawn from the real vehicles'
// look, not measured.
//   Falcon 9 Block 5   70 m; body 3.7 m; fairing 5.2 m x 13.1 m (SpaceX's
//                      published Falcon 9 figures, from the builder's knowledge,
//                      not re-fetched).
//   Tianlong-3         72 m (Next Spaceflight, Space Launch Now; Wikipedia 71 m);
//                      3.8 m; fairing 4.2 m x 12-13 m (Gunter's Space Page).
//   Zhuque-2           49.5 m; 3.35 m body and fairing (Space Launch Now).
//   Ceres-1            ~19 m (Galactic Energy via Spaceflight Now; Wikipedia ~20 m);
//                      1.4 m.
//   Hyperbola-1        20.8 m; 1.4 m (i-Space via Spaceflight Now; first version).
//   Gravity-1          29.4 m (Wikipedia; Marine Insight ~30 m); core 2.65 m
//                      (Wikipedia); fairing 4.2 m x 9.345 m (Marine Insight);
//                      four strap-ons, drawn 2.65 m, their height (16.5 m) is
//                      an estimate.
//   Kinetica-1         29.7 m (Wikipedia; Next Spaceflight 31 m); 2.65 m; fairing
//                      3.35 m (Next Spaceflight, Space Launch Now).
//   Nebula-1           35 m; 3.35 m body and fairing (Next Spaceflight, Space
//                      Launch Now); legs and grid fins from its vertical-landing
//                      test vehicles, positions estimated.
// ---------------------------------------------------------------------------

/** world px per metre of HEIGHT at scale 1 */
export const PX_PER_M = 8;
/** the one common factor every DIAMETER is multiplied by */
export const DIAM_X = 2;

export type RocketKind =
  | "falcon9"
  | "tianlong3"
  | "zhuque2"
  | "ceres1"
  | "hyperbola1"
  | "gravity1"
  | "kinetica1"
  | "nebula1";

// -- the outline language ------------------------------------------------------------
// A right-half outline in METRES: r = distance from the axis (TRUE radius, the
// factor is applied later), h = height above the base. It starts on the base
// (h 0) and ends at the tip (r 0). "L" = straight, "C" = cubic.
type Cmd = ["L", number, number] | ["C", number, number, number, number, number, number];
type Half = { start: [number, number]; cmds: Cmd[] };

/** the outline's segments as explicit point lists, for mirroring */
const segs = (half: Half) => {
  const out: { from: [number, number]; to: [number, number]; c?: [number, number, number, number] }[] = [];
  let p = half.start;
  for (const c of half.cmds) {
    if (c[0] === "L") {
      const to: [number, number] = [c[1], c[2]];
      out.push({ from: p, to });
      p = to;
    } else {
      const to: [number, number] = [c[5], c[6]];
      out.push({ from: p, to, c: [c[1], c[2], c[3], c[4]] });
      p = to;
    }
  }
  return out;
};

/** The closed silhouette path for an outline, centred on x, base on y, at
 *  `ppm` world px per metre of height and `ppm * DIAM_X` per metre of width. */
const outlinePath = (half: Half, x: number, y: number, ppm: number) => {
  const wx = (r: number) => (x + r * ppm * DIAM_X).toFixed(2);
  const wy = (h: number) => (y - h * ppm).toFixed(2);
  const mx = (r: number) => (x - r * ppm * DIAM_X).toFixed(2);
  const s = segs(half);
  let d = `M${mx(half.start[0])} ${wy(half.start[1])} L${wx(half.start[0])} ${wy(half.start[1])}`;
  for (const g of s) {
    d += g.c
      ? ` C${wx(g.c[0])} ${wy(g.c[1])} ${wx(g.c[2])} ${wy(g.c[3])} ${wx(g.to[0])} ${wy(g.to[1])}`
      : ` L${wx(g.to[0])} ${wy(g.to[1])}`;
  }
  for (let i = s.length - 1; i >= 0; i--) {
    const g = s[i];
    d += g.c
      ? ` C${mx(g.c[2])} ${wy(g.c[3])} ${mx(g.c[0])} ${wy(g.c[1])} ${mx(g.from[0])} ${wy(g.from[1])}`
      : ` L${mx(g.from[0])} ${wy(g.from[1])}`;
  }
  return `${d} Z`;
};

/** A TANGENT OGIVE nose from radius r (true metres) at height h0 to the tip
 *  at h1, computed in the VISIBLE (width-exaggerated) proportions so the nose
 *  stays pointed however wide the factor makes it; sampled as straight runs.
 *  `tip` < 1 sharpens it a little (a secant-ish ogive); `cone` (0..1) blends
 *  it toward a straight cone, so each type gets its own nose. */
const ogive = (r: number, h0: number, h1: number, tip = 1, cone = 0): Cmd[] => {
  const R = r * DIAM_X; // visible radius, metres
  const L = h1 - h0;
  const rho = (R * R + L * L) / (2 * R);
  const out: Cmd[] = [];
  const N = 18;
  for (let i = 1; i <= N; i++) {
    const t = (i / N) * L; // height above the shoulder
    const rv = Math.max(0, Math.sqrt(Math.max(0, rho * rho - t * t)) + R - rho);
    const blended = (1 - cone) * rv + cone * R * (1 - t / L); // cone = 1: a straight cone
    const shaped = blended * (1 - (1 - tip) * (i / N) * (i / N));
    out.push(["L", i === N ? 0 : shaped / DIAM_X, h0 + t]);
  }
  return out;
};

// -- the real outlines ---------------------------------------------------------------
// (true metres; see the header for the sources)

// FALCON 9 Block 5: 70 m, 3.66 m body, 5.2 m fairing (13.1 m long). Engine
// bells under the octaweb, the four landing legs' feet flaring at the foot,
// the first stage to the black interstage, the stowed grid fins as bumps at
// the foot of the black band (as in refs/falcon9_*), // its top, the second stage, the boat-tail up to the fairing, the ogive.
const F9_R = 1.83;
const F9_FAIR_R = 2.6;
export const F9_GEOM = {
  height: 70,
  interstage: [43.0, 50.4] as const, // the black band, h from the base (refs)
  gridFin: [43.2, 44.6] as const, // stowed, at the foot of the black band (refs)
  legs: [1.0, 10.2] as const, // the folded legs, black, along both edges
  print: [16.0, 41.6] as const, // the SPACEX wordmark, read top to bottom
};
const F9_HALF: Half = {
  start: [1.45, 0],
  cmds: [
    ["L", 1.25, 1.0],
    ["L", 2.05, 1.0],
    ["L", 2.05, 1.5],
    ["L", F9_R, 2.6],
    ["L", F9_R, F9_GEOM.gridFin[0] - 0.25],
    ["L", 2.28, F9_GEOM.gridFin[0]],
    ["L", 2.28, F9_GEOM.gridFin[1]],
    ["L", F9_R, F9_GEOM.gridFin[1] + 0.25],
    ["L", F9_R, 55.3],
    ["L", F9_FAIR_R, 57.1],
    ["L", F9_FAIR_R, 62.0],
    ...ogive(F9_FAIR_R, 62.0, 70, 0.8),
  ],
};

// Every Chinese glyph carries the Falcon 9's vocabulary in the same flat print
// language: a visible engine bell / nozzle skirt at the foot, its own nose
// (ogive to straight cone), fins where the real rocket has them, and black
// printed bands (PRINT_BANDS) where it has a dark interstage or fairing joint.

// TIANLONG-3 (Space Pioneer): 72 m, 3.8 m body, a 4.2 m fairing with a long
// ogive; nine-engine bell skirt; dark interstage.
const TL3_R = 1.9;
const TL3_HALF: Half = {
  start: [1.75, 0],
  cmds: [
    ["L", 1.2, 1.8],
    ["L", TL3_R, 1.8],
    ["L", TL3_R, 57.6],
    ["L", 2.1, 58.6],
    ["L", 2.1, 63.0],
    ...ogive(2.1, 63.0, 72, 0.9, 0.35),
  ],
};

// ZHUQUE-2 (LandSpace): 49.5 m, 3.35 m body and fairing: one straight tube,
// engine bells, four small fins at the foot, a short bluntish ogive nose
// (refs/rocket_zhuque2_*), dark interstage.
const ZQ2_HALF: Half = {
  start: [1.55, 0],
  cmds: [
    ["L", 1.1, 1.5],
    ["L", 2.55, 1.5],
    ["L", 2.55, 2.3],
    ["L", 1.675, 4.8],
    ["L", 1.675, 43.6],
    ...ogive(1.675, 43.6, 49.5, 0.85, 0.15),
  ],
};

// CERES-1 (Galactic Energy): ~19 m, 1.4 m: small fins at the foot, a nozzle,
// a sharp near-conical nose, a dark band at the fairing joint.
const CERES_HALF: Half = {
  start: [0.55, 0],
  cmds: [
    ["L", 0.4, 0.6],
    ["L", 1.3, 0.6],
    ["L", 1.3, 1.2],
    ["L", 0.7, 3.0],
    ["L", 0.7, 15.0],
    ...ogive(0.7, 15.0, 19.0, 0.9, 0.75),
  ],
};

// HYPERBOLA-1 (iSpace): 20.8 m, 1.4 m: four big trapezoid fins at the foot, a
// nozzle, an ogive nose, dark bands at the interstage and the fairing joint.
const HYP_HALF: Half = {
  start: [0.6, 0],
  cmds: [
    ["L", 0.45, 0.5],
    ["L", 1.6, 0.5],
    ["L", 1.6, 1.6],
    ["L", 0.7, 4.2],
    ["L", 0.7, 16.6],
    ...ogive(0.7, 16.6, 20.8, 0.85, 0.35),
  ],
};

// KINETICA-1 (CAS Space, Lijian-1): 29.7 m, 2.65 m body, a 3.35 m hammerhead
// fairing with a long, nearly straight cone (refs/rocket_kinetica1_*), a solid
// motor's nozzle, dark bands at a stage joint and the fairing's foot.
const KIN_HALF: Half = {
  start: [1.05, 0],
  cmds: [
    ["L", 0.8, 0.9],
    ["L", 1.325, 0.9],
    ["L", 1.325, 21.2],
    ["L", 1.675, 21.9],
    ["L", 1.675, 24.0],
    ...ogive(1.675, 24.0, 29.7, 1, 0.85),
  ],
};

// NEBULA-1 (Deep Blue Aerospace): 35 m, 3.35 m body and fairing, engine bells,
// landing legs at the foot, grid fins at the top of the first stage (it flies
// vertical-landing tests). It is this cut's HOLLOW one, so it has no print.
const NEB_H = 35;
const NEB_HALF: Half = {
  start: [1.45, 0],
  cmds: [
    ["L", 1.05, 1.3],
    ["L", 1.95, 1.3],
    ["L", 1.95, 1.8],
    ["L", 1.675, 2.8],
    ["L", 1.675, 22.4],
    ["L", 2.05, 22.6],
    ["L", 2.05, 23.8],
    ["L", 1.675, 24.0],
    ["L", 1.675, 29.4],
    ...ogive(1.675, 29.4, NEB_H, 0.9, 0.45),
  ],
};

// GRAVITY-1 (Orienspace): 29.4 m, 2.65 m core under a 4.2 m x 9.35 m
// hammerhead fairing, four 2.65 m solid strap-ons with pointed nose cones (two
// seen in profile), each its own glyph with a slit of paper between it and
// the core; nozzles under all three.
const GRAV_H = 29.4;
const GRAV_CORE_R = 1.325;
const GRAV_FAIR_R = 2.1;
const GRAV_BOOST_R = 1.325;
const GRAV_GAP = 0.12; // true metres of paper between core and booster
const GRAV_BOOST_H = 16.5;
const GRAV_CORE_HALF: Half = {
  start: [1.0, 0],
  cmds: [
    ["L", 0.75, 1.2],
    ["L", GRAV_CORE_R, 1.2],
    ["L", GRAV_CORE_R, 19.2],
    ["L", GRAV_FAIR_R, 20.05],
    ["L", GRAV_FAIR_R, 22.4],
    ...ogive(GRAV_FAIR_R, 22.4, GRAV_H, 0.9, 0.55),
  ],
};
const GRAV_BOOST_HALF: Half = {
  start: [0.95, 0],
  cmds: [["L", 0.7, 1.0], ["L", GRAV_BOOST_R, 1.0], ["L", GRAV_BOOST_R, 12.6], ...ogive(GRAV_BOOST_R, 12.6, GRAV_BOOST_H, 1, 0.7)],
};
/** booster axis offset from the core axis, in TRUE metres of width */
const GRAV_BOOST_DX = GRAV_CORE_R + GRAV_GAP + GRAV_BOOST_R;

/** Black printed bands on the Chinese glyphs: h0..h1 (metres above the base)
 *  across the body's full width there (r = TRUE radius at that height). */
export const PRINT_BANDS: Partial<Record<RocketKind, { h0: number; h1: number; r: number }[]>> = {
  tianlong3: [{ h0: 44.0, h1: 48.6, r: TL3_R }],
  zhuque2: [{ h0: 33.0, h1: 35.8, r: 1.675 }],
  ceres1: [{ h0: 14.2, h1: 15.0, r: 0.7 }],
  hyperbola1: [
    { h0: 9.4, h1: 10.2, r: 0.7 },
    { h0: 15.8, h1: 16.6, r: 0.7 },
  ],
  kinetica1: [
    { h0: 13.4, h1: 14.2, r: 1.325 },
    { h0: 21.9, h1: 22.6, r: 1.675 },
  ],
  gravity1: [{ h0: 20.05, h1: 20.75, r: GRAV_FAIR_R }],
};

// -- the specs everyone imports -------------------------------------------------------
export type RocketSpec = {
  kind: RocketKind;
  name: string;
  company: string;
  /** true height, metres */
  heightM: number;
  /** widest true diameter (or span), metres */
  spanM: number;
  /** where the height and diameter were checked */
  source: string;
};

export const ROCKET_SPECS: Record<RocketKind, RocketSpec> = {
  falcon9: { kind: "falcon9", name: "Falcon 9", company: "SpaceX", heightM: 70, spanM: 2 * 2.6, source: "SpaceX Falcon 9 figures (70 m, 3.7 m, fairing 5.2 x 13.1 m)" },
  tianlong3: { kind: "tianlong3", name: "Tianlong-3", company: "Space Pioneer", heightM: 72, spanM: 4.2, source: "Next Spaceflight / Space Launch Now 72 m; fairing 4.2 m (Gunter)" },
  zhuque2: { kind: "zhuque2", name: "Zhuque-2", company: "LandSpace", heightM: 49.5, spanM: 5.1, source: "Space Launch Now 49.5 m, 3.35 m" },
  ceres1: { kind: "ceres1", name: "Ceres-1", company: "Galactic Energy", heightM: 19, spanM: 2.6, source: "Spaceflight Now (Galactic Energy) ~19 m, 1.4 m" },
  hyperbola1: { kind: "hyperbola1", name: "Hyperbola-1", company: "iSpace", heightM: 20.8, spanM: 3.2, source: "Spaceflight Now (i-Space) 20.8 m, 1.4 m" },
  gravity1: {
    kind: "gravity1",
    name: "Gravity-1",
    company: "Orienspace",
    heightM: GRAV_H,
    spanM: 2 * (GRAV_BOOST_DX + GRAV_BOOST_R),
    source: "Wikipedia 29.4 m, 2.65 m core; Marine Insight fairing 4.2 x 9.345 m",
  },
  kinetica1: { kind: "kinetica1", name: "Kinetica-1", company: "CAS Space", heightM: 29.7, spanM: 3.35, source: "Wikipedia 29.7 m, 2.65 m; fairing 3.35 m Next Spaceflight" },
  nebula1: { kind: "nebula1", name: "Nebula-1", company: "Deep Blue Aerospace", heightM: NEB_H, spanM: 4.1, source: "Next Spaceflight / Space Launch Now 35 m, 3.35 m" },
};

/** world px at scale 1 */
export const rocketHeightPx = (kind: RocketKind, scale = 1) => ROCKET_SPECS[kind].heightM * PX_PER_M * scale;
export const rocketWidthPx = (kind: RocketKind, scale = 1) =>
  ROCKET_SPECS[kind].spanM * PX_PER_M * DIAM_X * scale;
export const ROCKET_H_PX: Record<RocketKind, number> = Object.fromEntries(
  (Object.keys(ROCKET_SPECS) as RocketKind[]).map((k) => [k, rocketHeightPx(k)]),
) as Record<RocketKind, number>;
export const ROCKET_W_PX: Record<RocketKind, number> = Object.fromEntries(
  (Object.keys(ROCKET_SPECS) as RocketKind[]).map((k) => [k, rocketWidthPx(k)]),
) as Record<RocketKind, number>;

/** The silhouette (one or more closed subpaths) of a rocket whose axis is at
 *  x and whose base sits on y, world px. */
export const rocketPath = (kind: RocketKind, x: number, y: number, scale = 1) => {
  const ppm = PX_PER_M * scale;
  switch (kind) {
    case "falcon9":
      return outlinePath(F9_HALF, x, y, ppm);
    case "tianlong3":
      return outlinePath(TL3_HALF, x, y, ppm);
    case "zhuque2":
      return outlinePath(ZQ2_HALF, x, y, ppm);
    case "ceres1":
      return outlinePath(CERES_HALF, x, y, ppm);
    case "hyperbola1":
      return outlinePath(HYP_HALF, x, y, ppm);
    case "kinetica1":
      return outlinePath(KIN_HALF, x, y, ppm);
    case "nebula1":
      return outlinePath(NEB_HALF, x, y, ppm);
    case "gravity1": {
      const dx = GRAV_BOOST_DX * ppm * DIAM_X;
      return [
        outlinePath(GRAV_BOOST_HALF, x - dx, y, ppm),
        outlinePath(GRAV_BOOST_HALF, x + dx, y, ppm),
        outlinePath(GRAV_CORE_HALF, x, y, ppm),
      ].join(" ");
    }
  }
};

/** The silhouette the CHAIN ECHO copies use (now the full silhouette: the
 *  copies close up under the core at rest, so nothing of them shows there). */
export const rocketEchoPath = (kind: RocketKind, x: number, y: number, scale = 1) => rocketPath(kind, x, y, scale);

// -- print (black on white, no shadow) ------------------------------------------------
/** one folded landing leg (black), hugging the silhouette's edge from the
 *  foot up, tapering to its hinge; side 1 = right, -1 = left */
const F9_LEG: [number, number][] = [
  [2.05, 1.0],
  [2.05, 1.5],
  [F9_R, 2.6],
  [F9_R, 10.2],
  [1.52, 9.2],
  [1.52, 2.5],
  [1.66, 1.0],
];
const legPoly = (x: number, y: number, ppm: number, side: number) =>
  `M${F9_LEG.map(([r, h]) => `${(x + side * r * ppm * DIAM_X).toFixed(2)} ${(y - h * ppm).toFixed(2)}`).join(" L")} Z`;

// The SPACEX wordmark with its swoosh, from refs/spacex_logo.svg (Wikimedia
// Commons File:SpaceX-Logo.svg), every part printed black. viewBox 331.644 x
// 40.825; the letters run y 14.8-40.8, centred on y 27.8.
const SPACEX_D = "M77.292,15.094H49.249l-1.039,0.777v24.947h7.763v-9.355l0.741-0.664h20.579 c5.196,0,7.632-1.398,7.632-4.985v-5.728C84.924,16.493,82.489,15.094,77.292,15.094 M77.292,24.317 c0,1.69-1.118,2.041-3.554,2.041H56.799l-0.827-0.804V20.21l0.741-0.678h17.025c2.436,0,3.554,0.347,3.554,2.045V24.317z M99.081 19.813 L105.761 29.6 L105.391 30.548 L90.618 30.548 L86.847 35.187 L108.837 35.187 L110.361 36.115 L113.775 40.824 L122.659 40.824 L103.186 14.775 Z M187.418 35.757 L187.418 28.833 L188.217 28.143 L203.079 28.143 L203.079 23.734 L179.524 23.734 L179.524 40.823 L214.27 40.823 L214.27 36.435 L188.252 36.435 Z M179.524 15.094 h35.113 v4.848 h-35.113 Z M140.361,19.685h28.288c-0.436-3.597-2.668-4.595-8.33-4.595H140.06c-6.389,0-8.427,1.247-8.427,6.082 v13.565c0,4.84,2.038,6.087,8.427,6.087h20.259c5.745,0,7.945-1.079,8.095-4.81h-28.053l-0.832-0.783V20.209 M29.333,25.118H8.754l-0.606-0.667v-4.402l0.603-0.466h27.742l0.379-0.927 c-0.945-2.431-3.392-3.565-7.936-3.565H9.665c-6.385,0-8.426,1.247-8.426,6.082v2.844c0,4.841,2.041,6.086,8.426,6.086h20.533 l0.645,0.566v4.602l-0.526,0.718H6.83v-0.022H0.678c0,0-0.704,0.353-0.677,0.518c0.525,3.382,2.829,4.34,8.345,4.34h20.987 c6.384,0,8.486-1.247,8.486-6.087v-3.543C37.819,26.363,35.717,25.118,29.333,25.118 M236.725,14.988h-11.551l-0.627,1.193l12.828,9.351c2.43-1.407,5.074-2.833,7.95-4.24 M247.075,32.603l11.275,8.222h11.692l0.484-1.089L253.69,27.413 C251.454,29.054,249.245,30.787,247.075,32.603 M235.006,40.806h-10.451l-0.883-1.383C230.778,32.562,262.56,3.151,331.644,0 C331.644,0,273.658,1.956,235.006,40.806";
const SPACEX_W = 331.644;
const SPACEX_LETTER_MID = 27.8;

/** The Falcon 9's black print: the interstage, the folded legs, the vertical
 *  SPACEX wordmark (letters read top to bottom, their tops to the right). */
export const Falcon9Print: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => {
  const ppm = PX_PER_M * scale;
  const r = F9_R * ppm * DIAM_X;
  const g = F9_GEOM;
  const [i0, i1] = g.interstage;
  const [p0, p1] = g.print;
  const ws = ((p1 - p0) * ppm) / SPACEX_W; // wordmark units -> world px
  return (
    <g>
      <rect x={x - r} y={y - i1 * ppm} width={2 * r} height={(i1 - i0) * ppm} fill={BLACK} />
      {[1, -1].map((side) => (
        <path key={side} d={legPoly(x, y, ppm, side)} fill={BLACK} />
      ))}
      {/* turned 90 deg clockwise: reads top to bottom, letter tops to the right */}
      <path
        d={SPACEX_D}
        fill={BLACK}
        transform={`translate(${x + SPACEX_LETTER_MID * ws} ${y - p1 * ppm}) rotate(90) scale(${ws})`}
      />
    </g>
  );
};

// -- the glyph -------------------------------------------------------------------------
/**
 * A ROCKET, axis at x, base on y (world px), on its hard shadow.
 *   hollow  — a white STROKE outline (inside the silhouette) on its shadow
 *             outline, nothing inside (the "up to" part of a range); needs `id`.
 *   ink     — the fill (white, a chain colour, or black); print only on white.
 *   shadow  — false drops the black copy (for a chain layer, say).
 *   print   — the black print (default on): the Falcon 9's interstage, legs and
 *             wordmark; the other types' PRINT_BANDS. false = bare silhouette.
 */
export const Rocket: React.FC<{
  kind: RocketKind;
  x: number;
  y: number;
  scale?: number;
  hollow?: boolean;
  id?: string;
  ink?: string;
  shadow?: boolean;
  print?: boolean;
}> = ({ kind, x, y, scale = 1, hollow = false, id, ink = INK, shadow = true, print }) => {
  const d = rocketPath(kind, x, y, scale);
  const printOn = (print ?? true) && !hollow && ink === INK;
  const showPrint = printOn && kind === "falcon9";
  const bands = printOn ? (PRINT_BANDS[kind] ?? []) : [];
  const ppm = PX_PER_M * scale;
  if (hollow) {
    const cid = `${id ?? `rk-${kind}`}-in`;
    return (
      <g>
        <defs>
          <clipPath id={cid}>
            <path d={d} />
          </clipPath>
        </defs>
        {shadow ? (
          <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
            <path d={d} fill="none" stroke={SHADOW} strokeWidth={2 * STROKE} clipPath={`url(#${cid})`} />
          </g>
        ) : null}
        <path d={d} fill="none" stroke={ink} strokeWidth={2 * STROKE} clipPath={`url(#${cid})`} />
      </g>
    );
  }
  return (
    <g>
      {shadow ? <path d={d} fill={SHADOW} transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`} /> : null}
      <path d={d} fill={ink} />
      {showPrint ? <Falcon9Print x={x} y={y} scale={scale} /> : null}
      {bands.map((b, i) => (
        <rect
          key={i}
          x={x - b.r * ppm * DIAM_X}
          y={y - b.h1 * ppm}
          width={2 * b.r * ppm * DIAM_X}
          height={(b.h1 - b.h0) * ppm}
          fill={BLACK}
        />
      ))}
    </g>
  );
};

/** THE ORIGINAL: the Falcon 9 with its print (axis x, base y). */
export const Falcon9: React.FC<{ x: number; y: number; scale?: number; hollow?: boolean; id?: string; shadow?: boolean }> = (
  props,
) => <Rocket kind="falcon9" {...props} />;

// -- the row rule and the rise -------------------------------------------------------
/** The ground rule things rise from behind: a white bar STROKE high on its
 *  hard shadow. `y` = the rule's TOP edge (things stand on it). `draw` 0..1
 *  rules it on from the left. */
export const RowRule: React.FC<{ x0: number; x1: number; y: number; draw?: number }> = ({ x0, x1, y, draw = 1 }) => {
  const w = (x1 - x0) * Math.max(0, Math.min(1, draw));
  if (w <= 0) return null;
  return (
    <g>
      <rect x={x0 + SHADOW_OFF} y={y + SHADOW_OFF} width={w} height={STROKE} fill={SHADOW} />
      <rect x={x0} y={y} width={w} height={STROKE} fill={INK} />
    </g>
  );
};

/** Clip for everything that rises from behind a rule whose top edge is y:
 *  only what is above the rule shows. Put it in <defs> once per rule. */
export const RuleClip: React.FC<{ id: string; x0: number; x1: number; y: number; top?: number }> = ({
  id,
  x0,
  x1,
  y,
  top = -4000,
}) => (
  <clipPath id={id}>
    <rect x={x0} y={top} width={x1 - x0} height={y - top} />
  </clipPath>
);

export const RISE_TRAVEL = 14; // frames, for a plain (no-echo) rise
/** A plain rise from behind a rule: the world-px offset to ADD to the rest y
 *  (depth = how far below its rest it starts, i.e. at least its own height
 *  plus its shadow, so it starts wholly hidden) and progress p. */
export const riseFromRule = (frame: number, start: number, depth: number, travel = RISE_TRAVEL) => {
  const p = interpolate(frame, [start, start + travel], [0, 1], { easing: EASE_LAND, ...clamp });
  return { dy: (1 - p) * depth, p, visible: frame >= start };
};

// THE COPY RIPPLE (director's v2 note): the chain is the gesture of copying,
// so it shows only DURING a rise. The white core rises on RISE_EASE over
// ECHO_TRAVEL frames; the three colour copies ride with it, blue / purple /
// orange 1 / 2 / 3 x `lead` ahead, where lead starts at ECHO_LEAD world px and
// closes to 0 as the core lands ((1 - u)^1.5), so the colours read as a ripple
// a few crown steps ahead of the nose, never a block, and at rest they are
// shut under the core: white + shadow only. They are masked to outside the
// core's current silhouette (no antialiased fringe) and not drawn once landed.
/** frames a chain rise takes (core and copies) */
export const ECHO_TRAVEL = 17;
/** world px each colour copy leads the next at the start of a rise */
export const ECHO_LEAD = 16;
/** kept for compatibility: the copies no longer start on their own frames */
export const ECHO_STAGGER = 0;
const RISE_EASE = (u: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, u)), 4);
/** the frame a chain rise has fully landed (visually home ~half-way) */
// (the third argument is ignored; kept so earlier calls still compile)
export const echoLandFrame = (start: number, travel = ECHO_TRAVEL, _stagger = ECHO_STAGGER) => start + travel;

/**
 * A rocket RISING from behind a rule (clipped by `clipId`, see RuleClip).
 *   echo true  — a CHAIN ECHO rise (the copy ripple above; COPIES only).
 *   echo false — a plain rise on riseFromRule (the Falcon 9 always rises plain).
 */
export const RisingRocket: React.FC<{
  frame: number;
  start: number;
  kind: RocketKind;
  x: number;
  y: number;
  clipId: string;
  id: string;
  scale?: number;
  hollow?: boolean;
  echo?: boolean;
  travel?: number;
}> = ({ frame, start, kind, x, y, clipId, id, scale = 1, hollow = false, echo = true, travel = ECHO_TRAVEL }) => {
  if (frame < start) return null;
  const depth = rocketHeightPx(kind, scale) + 3 * ECHO_LEAD + SHADOW_OFF + STROKE + 4;
  if (!echo || kind === "falcon9") {
    const r = riseFromRule(frame, start, depth, travel);
    return (
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(0 ${r.dy})`}>
          <Rocket kind={kind} x={x} y={y} scale={scale} hollow={hollow} id={id} />
        </g>
      </g>
    );
  }
  const u = Math.max(0, Math.min(1, (frame - start) / travel));
  const coreDy = (1 - RISE_EASE(u)) * depth;
  const lead = ECHO_LEAD * Math.pow(1 - u, 1.5);
  const rising = u < 1;
  const dEcho = rocketEchoPath(kind, x, y, scale);
  const outId = `${id}-out`;
  return (
    <g clipPath={`url(#${clipId})`}>
      {rising ? (
        <>
          <defs>
            <mask id={outId} maskUnits="userSpaceOnUse" x={x - 2000} y={y - 4000} width={4000} height={4200}>
              <rect x={x - 2000} y={y - 4000} width={4000} height={4200} fill="#FFFFFF" />
              <path d={rocketPath(kind, x, y + coreDy, scale)} fill="#000000" stroke="#000000" strokeWidth={2} />
            </mask>
          </defs>
          {hollow ? null : (
            <path d={rocketPath(kind, x, y, scale)} fill={SHADOW} transform={`translate(${SHADOW_OFF} ${coreDy + SHADOW_OFF})`} />
          )}
          <g mask={`url(#${outId})`}>
            {CHAIN.map((c, i) => {
              const n = 3 - i; // orange 3 ahead, purple 2, blue 1
              return <path key={c} d={dEcho} fill={c} transform={`translate(0 ${coreDy - n * lead})`} />;
            })}
          </g>
        </>
      ) : null}
      <g transform={`translate(0 ${coreDy})`}>
        {hollow ? (
          <Rocket kind={kind} x={x} y={y} scale={scale} hollow id={id} />
        ) : (
          <>
            {rising ? null : <path d={rocketPath(kind, x, y, scale)} fill={SHADOW} transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`} />}
            <Rocket kind={kind} x={x} y={y} scale={scale} shadow={false} />
          </>
        )}
      </g>
    </g>
  );
};

// -- Starlink --------------------------------------------------------------------------
// A Starlink v1.x satellite: the flat-panel bus with its ONE long solar array
// (side view, array edge-on would vanish, so the array is seen face-on: a long
// white panel with black cell lines, on a short mast from one end of the bus).
// Box: origin at the bus centre, the array extending toward +x. World px at
// scale 1: bus 46 x 20, mast 14, array 150 x 34.
export const STARLINK = {
  busW: 40,
  busH: 30,
  mast: 12,
  arrayW: 150,
  arrayH: 34,
  cells: 6,
} as const;
export const STARLINK_LEN = STARLINK.busW / 2 + STARLINK.mast + STARLINK.arrayW + STARLINK.busW / 2;

const starlinkShape = (fill: string) => {
  const S = STARLINK;
  const ax = S.busW / 2 + S.mast;
  return (
    <g fill={fill}>
      <rect x={-S.busW / 2} y={-S.busH / 2} width={S.busW} height={S.busH} />
      <rect x={S.busW / 2 - 1} y={-4} width={S.mast + 2} height={8} />
      <rect x={ax} y={-S.arrayH / 2} width={S.arrayW} height={S.arrayH} />
    </g>
  );
};

/** One Starlink satellite at (x, y) (bus centre), turned `angle` degrees,
 *  `scale` x. Solid white on its hard shadow, the array's cell lines in black. */
export const StarlinkSat: React.FC<{
  x: number;
  y: number;
  angle?: number;
  scale?: number;
  ink?: string;
  shadow?: boolean;
  print?: boolean;
}> = ({ x, y, angle = 0, scale = 1, ink = INK, shadow = true, print = true }) => {
  const S = STARLINK;
  const ax = S.busW / 2 + S.mast;
  const t = `translate(${x} ${y}) rotate(${angle}) scale(${scale})`;
  // the shadow offset stays +4/+4 in WORLD px whatever the rotation
  return (
    <g>
      {shadow ? (
        <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
          <g transform={t}>{starlinkShape(SHADOW)}</g>
        </g>
      ) : null}
      <g transform={t}>
        {starlinkShape(ink)}
        {print && ink === INK ? (
          <g fill={BLACK}>
            {Array.from({ length: S.cells - 1 }, (_, i) => (
              <rect key={i} x={ax + ((i + 1) * S.arrayW) / S.cells - 2} y={-S.arrayH / 2} width={4} height={S.arrayH} />
            ))}
          </g>
        ) : null}
      </g>
    </g>
  );
};

/** Where satellite i of a train sits: N satellites strung along a gentle arc
 *  from (x0, y0) heading `heading` degrees (0 = +x), `spacing` world px apart
 *  along the arc, bending `bend` degrees per satellite. Returns {x, y, angle}. */
export const starlinkTrainPos = (
  i: number,
  { x0, y0, spacing, heading = 0, bend = 2 }: { x0: number; y0: number; spacing: number; heading?: number; bend?: number },
) => {
  let x = x0;
  let y = y0;
  let a = heading;
  for (let j = 0; j < i; j++) {
    const mid = (a + bend / 2) * (Math.PI / 180);
    x += spacing * Math.cos(mid);
    y += spacing * Math.sin(mid);
    a += bend;
  }
  return { x, y, angle: a };
};

/** A STARLINK TRAIN: `count` satellites along a gentle arc (starlinkTrainPos).
 *  `alongAngle` turns each satellite relative to the arc's tangent (0 = the
 *  array points along the train, the classic string-of-pearls look). */
export const StarlinkTrain: React.FC<{
  x0: number;
  y0: number;
  count: number;
  spacing: number;
  heading?: number;
  bend?: number;
  scale?: number;
  alongAngle?: number;
}> = ({ x0, y0, count, spacing, heading = 0, bend = 2, scale = 1, alongAngle = 0 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const p = starlinkTrainPos(i, { x0, y0, spacing, heading, bend });
      return <StarlinkSat key={i} x={p.x} y={p.y} angle={p.angle + alongAngle} scale={scale} />;
    })}
  </g>
);

// -- cut 11's row (the resolved frame) -----------------------------------------------
// World px, scale 1; at the resolved frame the camera is ~k 1 with world =
// screen, so these are also (about) screen px at f30-f85 of cut 11.
export const ROW_ORDER: RocketKind[] = [
  "falcon9",
  "tianlong3",
  "ceres1",
  "zhuque2",
  "hyperbola1",
  "gravity1",
  "kinetica1",
  "nebula1",
];
/** the seventh competitor, the hollow "or seven" */
export const ROW_HOLLOW: RocketKind = "nebula1";
/** the rule's TOP edge (rockets stand on it) */
export const ROW_RULE_Y = 985;
export const ROW_X0 = 70; // the row's left ink edge
export const ROW_X1 = 1010; // the row's right ink edge
/** the rule runs a little past the row at both ends */
export const ROW_RULE_X0 = ROW_X0 - 40;
export const ROW_RULE_X1 = ROW_X1 + 40;
const rowGap = (ROW_X1 - ROW_X0 - ROW_ORDER.reduce((s, k) => s + ROCKET_W_PX[k], 0)) / (ROW_ORDER.length - 1);
/** the axis x of each rocket in the row */
export const ROW_X: Record<RocketKind, number> = (() => {
  const out = {} as Record<RocketKind, number>;
  let x = ROW_X0;
  for (const k of ROW_ORDER) {
    out[k] = x + ROCKET_W_PX[k] / 2;
    x += ROCKET_W_PX[k] + rowGap;
  }
  return out;
})();
export const ROW_GAP = rowGap;
