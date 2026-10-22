// ---------------------------------------------------------------------------
// greekStairWorld — THE STAIR OF GREEK MATHEMATICS (kyle-greek-math; Dwarkesh 3D style, styles/dwarkesh-3d.md). One
// continuous world for three cuts: A DiophantusPopsUp (4.738 s), C ProductOfGenerations (29.696 s, built with this
// file) and D NoSustainedProgress (38.739 s, opens on C's last frame). Contract for the other builders:
// <clip>/animation_source/notes/STAIR_READY.md. Later changes keep the old exports and are logged in SHARED_CHANGES.md.
//
// THE WORLD. A monumental marble stair rises out of the dense low air (the deep past) into the light: five steps, one
// per generation of Greek mathematicians, each standing on his step and holding up his tablet with its real orange
// diagram toward the step above (bottom -> top: Thales, Pythagoras, Hippocrates of Chios, Theaetetus, Eudoxus); on the
// top landing Euclid alone with the open scroll of the Elements (the brightest orange in the world), EUCLID carved in
// the landing's front riser. Beyond the landing no stair: fog over a gap, and far apart in the haze four lone fluted
// columns standing out of the low air, each carrying one later scholar with a small orange work (Archimedes: the sphere
// in the cylinder; Apollonius: the cone and its section; Ptolemy: an astrolabe; Diophantus: writing his scroll,
// DIOPHANTUS carved on his column's band, a Roman aqueduct in the haze behind him with three Romans at its foot, no
// orange). Time runs into depth: earlier = nearer the camera and lower, later = further. The stair that was never
// built (cut D) continues the same rhythm up from the landing's back edge across the gap: exported as geometry and a
// dashed renderer, not drawn unless asked.
//
// UNITS. The cast's: U = 178 per metre (a man ~312 = 1.75 m). X across (+ right), H height (up +, the low air's floor
// H = 0), Z depth (+ away from the camera). The stair's foot (step 1's front) is Z = 0, its centre line X = 0.
//
// THE CAMERA. A level pinhole (one-point perspective, verticals stay vertical; framing by lens shift):
//   StairCam = { X, E, Zc, F, hy }  the eye at (X, height E, depth Zc), focal F (screen px), hy = the screen row of the
//   horizon (lens shift). A point projects to sx = 540 + F (X' - X) / (Z' - Zc), sy = hy - F (H' - E) / (Z' - Zc).
//   The kit's londonDepth camera is built from it each frame (a front plane DFP ahead of the eye, so the eye may fly
//   anywhere, beyond the landing too); stairAirOf() returns the kit's AirWorld (A.P.p takes WORLD Z and the kit's Y = -H)
//   so AirBox / AirCyl / AirShadow / RomeFolk work on it unchanged. Geometry nearer than NEAR to the eye is clipped.
//
// THE AIR (stairAirOf). Palette A, mood day. The backdrop and every object's air by HEIGHT (dense espresso low, sage
// high: the ramp RAMP), fog by the eye's distance beyond FOG.near (the stair itself never takes depth fog; the far
// columns sink into the haze and clear as a camera flies to them), the LOW AIR (heights below ~4 m sink toward the
// dense air; below ~ -0.6 m fully: columns rise out of it), and C's CLOUD (a band under the landing, 0..1).
//
// API (all exported)
//   U, RISE, TREAD, STAIR_W, LANDING_D, N_STEPS, LEVEL_H(i), STEP_Z0(i), LANDING (box), stairTopAt(Z)
//   GENERATIONS[]   { id, name, step, X, Z, H (feet), dir, diagram, variant }   the five, bottom -> top
//   EUCLID          { X, Z, H }                                                  on the landing
//   COLUMNS[]       { id, name, X, Z, top (capital top H), R (shaft radius), work, label?, scholar }  near -> far
//   AQUEDUCT, ROMANS[], TERRACE                                                   Diophantus's background
//   riseOffset(i, rise)   the column's drop (units) at rise 0..1 (0 = sunk wholly into the low air)
//   NEVER_BUILT     { steps, lines: Line3[] (each { pts: V3[], len[] cumulative }), total }  the dashed stair (cut D)
//   <NeverBuiltStair S progress tip? />  draws it dashed (world-anchored dashes), revealed by progress 0..1 along
//                    every line together, a soft glowing tip at each drawing front
//   StairCam, camLerp, DFP, NEAR, stairAirOf(c, t, rest, opts?) -> StairAir (= the kit's AirWorld + .c .t .q ...)
//   <StairStage c t rest opts? bloom?>children</StairStage>  AirStage + WorldSvg on the camera (children in world px)
//   <GreekStairWorld S opts />  the whole world in painter's order (the default figures, tablets, cloud, columns)
//   WorldOpts { cloud 0..1, glow (tablet / scroll glow), rise per column, dashed 0..1, hide ids, poseOf override,
//               renderFigure override, sweepAt (a light travelling up the chain, 0..1 or -1) }
//   C (cut C): C_CAM_KEYS, cameraC(f), C_REST, cloudC(f), glowC(f), sweepC(f), C_END (camera, cloud, glow, t at f228),
//              optsC(f)
//
// THE CAST. The clip's Greek cast (./greekFolk; GREEK_FOLK_READY.md): the five generations are Scholars 0-4 in
// offerUp (body turn OFFER_YAW, each one's offer height OFFER), the tablet put at tabletAt with itemAt so the hands
// land on its edges; Euclid in holdScroll with EUCLID_HELD (the Elements hanging open from his left hand, the dividers
// up in his right), a warm light on his scroll (the brightest orange); the lone scholars Scholar 5 / 6 / 2 with their
// works, Diophantus writing (POSES.write, DIOPHANTUS_HELD). The Romans at the aqueduct are RomeFolk. A cut can pose
// any of them (poseOf) or draw its own (renderFigure). The RomeFolk stand-ins remain behind FIG_STANDIN (false).
//
// SOURCES (the diagrams, illustrative): Thales — the angle in a semicircle is right (Euclid III.31, attributed to
// Thales by Diogenes Laertius); Pythagoras — the right triangle with the squares on its sides (Euclid I.47);
// Hippocrates of Chios — the lune on the side of a right isosceles triangle in a semicircle (Eudemus via Simplicius);
// Theaetetus — the regular solids, the octahedron (Suda; Euclid XIII scholium); Eudoxus — polygons inscribed in a
// circle, the method of exhaustion (Euclid XII.2); Euclid — Elements I.1 (the equilateral triangle on two circles)
// among the gathered diagrams; Archimedes — the sphere inscribed in the cylinder (On the Sphere and Cylinder; the
// figure on his tomb, Cicero Tusc. V.64); Apollonius — the sections of the cone (Conics); Ptolemy — the astrolabe
// (planispheric, Planisphaerium; Synesius); Diophantus — the Arithmetica (c. AD 250, Alexandria).
// ---------------------------------------------------------------------------
import React from "react";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import {
  ACCENT,
  ACCENT_DEEP,
  AIR,
  AirStage,
  RomeFolk,
  WorldSvg,
  airRamp,
  c01,
  hash01,
  lerp,
  lineOf,
  makeAirView,
  mixHex,
  perspective,
  rgbHex,
  smoothstep,
  swayCam,
  type AirScene,
  type AirWorld,
  type Cam,
  type Mat,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import * as GF from "./greekFolk";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export const CARVE_FONT = fellSC;

const PAL = AIR.A;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => (q.length ? `M${q.map(Pt).join("L")}Z` : "");
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===================================================================================================================
// GEOMETRY
// ===================================================================================================================
export const U = 178;
/** a step's riser (1.6 m) and tread (1.2 m): steep (53 deg), a stair of generations, not a ramp */
export const RISE = 1.6 * U;
export const TREAD = 1.2 * U;
export const N_STEPS = 5;
export const STAIR_W = 4.4 * U;
/** the half-width of level i (1..5 the steps, 6 the landing): a slight taper upward (4.6 m at the foot, 3.8 m the
 *  landing), so the tread ends step in like a monument's */
export const HALF_W = (i: number) => 2.3 * U - 0.08 * U * (i - 1);
export const LANDING_D = 3.0 * U;
/** the blocks run down below the low air's floor, so no bottom edge is ever seen */
export const BASE_H = -3 * U;
/** the top of level i (1..5 the steps, 6 the landing) and the front of level i */
export const LEVEL_H = (i: number) => i * RISE;
export const STEP_Z0 = (i: number) => (i - 1) * TREAD;
export const LANDING = { X0: -HALF_W(N_STEPS + 1), X1: HALF_W(N_STEPS + 1), H: LEVEL_H(N_STEPS + 1), Z0: STEP_Z0(N_STEPS + 1), Z1: STEP_Z0(N_STEPS + 1) + LANDING_D };
/** the stair's surface height at depth Z (the top of the block there; -inf in front of the foot, the landing's
 *  height over the landing, -inf beyond it) */
export const stairTopAt = (Z: number) => {
  if (Z < 0 || Z > LANDING.Z1) return -Infinity;
  const i = Math.min(N_STEPS + 1, Math.floor(Z / TREAD) + 1);
  return LEVEL_H(i);
};

export type DiagramKind = "thales" | "pythagoras" | "lune" | "octahedron" | "exhaustion" | "elements" | "sphereCylinder" | "cone" | "astrolabe" | "arithmetica";
export type Generation = { id: string; name: string; step: number; X: number; Z: number; H: number; dir: 1 | -1; diagram: DiagramKind; kind: "dominus" | "freeman"; variant: number };
/** the five generations, bottom -> top: alternate sides of the centre line, each facing in toward it (and up) */
const GEN_X = 1.25 * U;
const GEN_BACK = 0.5 * U;
export const GENERATIONS: Generation[] = (
  [
    ["thales", "Thales", "thales", "dominus", 1],
    ["pythagoras", "Pythagoras", "pythagoras", "freeman", 0],
    ["hippocrates", "Hippocrates of Chios", "lune", "dominus", 2],
    ["theaetetus", "Theaetetus", "octahedron", "freeman", 2],
    ["eudoxus", "Eudoxus", "exhaustion", "dominus", 0],
  ] as const
).map(([id, name, diagram, kind, variant], k) => {
  const step = k + 1;
  const side = step % 2 === 1 ? -1 : 1;
  return { id, name, step, X: side * GEN_X, Z: STEP_Z0(step) + GEN_BACK, H: LEVEL_H(step), dir: (side < 0 ? 1 : -1) as 1 | -1, diagram, kind, variant };
});
export const EUCLID = { id: "euclid", name: "Euclid", X: 0, Z: LANDING.Z0 + 0.5 * U, H: LANDING.H };

/** the tablet a generation holds up: a front-facing board at the inner side of his face, tilted toward the step above */
export const TABLET = { w: 0.56 * U, h: 0.44 * U };
/** how high each holds his tablet up (over his feet) and how far the offer has risen (greekFolk offerUp t): up past
 *  the face toward the step above, clear of his face; Pythagoras's lower, at the chest (his face sits in the narrow
 *  gap between the caption bands in C's end frame, so his tablet stays out of the band above it) */
export const OFFER: Record<string, { h: number; t: number; fwd: number }> = {
  thales: { h: 1.86 * U, t: 0.78, fwd: 0.5 * U },
  pythagoras: { h: 1.42 * U, t: 0.3, fwd: 0.48 * U },
  hippocrates: { h: 1.86 * U, t: 0.78, fwd: 0.5 * U },
  theaetetus: { h: 1.86 * U, t: 0.78, fwd: 0.5 * U },
  eudoxus: { h: 1.86 * U, t: 0.78, fwd: 0.5 * U },
};
export const tabletAt = (g: Generation) => {
  const o = OFFER[g.id];
  const X = g.X + g.dir * o.fwd;
  const H = g.H + o.h;
  const Z = g.Z - 0.18 * U;
  return { X, H, Z, rot: -g.dir * 7 };
};
/** Euclid's scroll: open between his hands at chest height, in front of him */
export const SCROLL = { w: 0.74 * U, h: 0.3 * U };
export const scrollAt = () => ({ X: EUCLID.X + EUCLID_SCROLL_OFF_LAZY()[0], H: EUCLID.H - EUCLID_SCROLL_OFF_LAZY()[1], Z: EUCLID.Z - 0.12 * U });
let scrollOffCache: P2 | null = null;
const EUCLID_SCROLL_OFF_LAZY = (): P2 => (scrollOffCache ??= EUCLID_SCROLL_OFF);

// ---- beyond the landing: the lone columns of the post-Euclid era (near -> far = earlier -> later) ----------------
export type ColumnDef = { id: string; name: string; X: number; Z: number; top: number; R: number; work: DiagramKind; label?: string; kind: "dominus" | "freeman"; variant: number; dir: 1 | -1 };
export const COLUMNS: ColumnDef[] = [
  { id: "archimedes", name: "Archimedes", X: -9 * U, Z: 24 * U, top: 9.2 * U, R: 0.5 * U, work: "sphereCylinder", kind: "freeman", variant: 1, dir: 1 },
  { id: "apollonius", name: "Apollonius", X: 11 * U, Z: 36 * U, top: 7.6 * U, R: 0.48 * U, work: "cone", kind: "dominus", variant: 1, dir: -1 },
  { id: "ptolemy", name: "Ptolemy", X: -14 * U, Z: 52 * U, top: 10.6 * U, R: 0.52 * U, work: "astrolabe", kind: "dominus", variant: 2, dir: 1 },
  { id: "diophantus", name: "Diophantus", X: 20 * U, Z: 68 * U, top: 8.4 * U, R: 0.62 * U, work: "arithmetica", label: "DIOPHANTUS", kind: "freeman", variant: 0, dir: -1 },
];
/** the capital (an abacus slab over an echinus) and the band where a name is carved (below the necking) */
export const CAPITAL = { echinusH: 0.22 * U, abacusH: 0.2 * U, abacusW: 1.35 };
export const BAND = { y0: 1.05 * U, y1: 0.68 * U };
/** a column's drop at rise 0..1: at 0 the scholar's head is ~1 m under the low air's floor (wholly hidden) */
export const riseOffset = (i: number, rise: number) => (1 - c01(rise)) * (COLUMNS[i].top + 3.0 * U);
/** Diophantus's background: a Roman aqueduct (two tiers of arches) on a terrace in the haze, three Romans at its foot */
export const TERRACE = { X0: 15 * U, X1: 56 * U, Z0: 76 * U, Z1: 84 * U, H: 3.2 * U };
export const AQUEDUCT = { X0: 16.5 * U, X1: 54 * U, Z: 82 * U, H0: TERRACE.H, span: 4.6 * U, pier: 1.1 * U, tier1: 9.5 * U, tier2: 5.0 * U, channel: 1.2 * U };
export const ROMANS = [
  { id: "roman0", kind: "overseer" as const, X: 21.5 * U, Z: 78.5 * U, dir: 1 as const, variant: 0 },
  { id: "roman1", kind: "freeman" as const, X: 23.0 * U, Z: 79.5 * U, dir: -1 as const, variant: 2 },
  { id: "roman2", kind: "slave" as const, X: 25.6 * U, Z: 78.8 * U, dir: -1 as const, variant: 1 },
];

// ---- the stair that was never built (cut D): the same rhythm continuing up from the landing's back edge -----------
export type V3 = [number, number, number];
export type Line3 = { pts: V3[]; len: number[] };
const lineOf3 = (pts: V3[]): Line3 => {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  return { pts, len };
};
export const NEVER_BUILT = (() => {
  const steps = 6;
  const z0 = LANDING.Z1;
  const h0 = LANDING.H;
  // the same taper as the built stair: step s (0..) of the never-built stair is level N_STEPS + 2 + s
  const hw = (s: number) => HALF_W(N_STEPS + 2 + s);
  // the two side profiles (a zig-zag: up the riser, back along the tread, in a step at each riser), then the nosings
  // across, bottom -> top
  const profile = (side: -1 | 1) => {
    const pts: V3[] = [[side * hw(0), h0, z0]];
    for (let s = 0; s < steps; s++) {
      if (s > 0) pts.push([side * hw(s), h0 + s * RISE, z0 + s * TREAD]);
      pts.push([side * hw(s), h0 + (s + 1) * RISE, z0 + s * TREAD]);
      pts.push([side * hw(s), h0 + (s + 1) * RISE, z0 + (s + 1) * TREAD]);
    }
    return lineOf3(pts);
  };
  const lines: Line3[] = [profile(-1), profile(1)];
  for (let s = 0; s < steps; s++) lines.push(lineOf3([[-hw(s), h0 + (s + 1) * RISE, z0 + s * TREAD], [hw(s), h0 + (s + 1) * RISE, z0 + s * TREAD]]));
  const total = Math.max(...lines.map((l) => l.len[l.len.length - 1]));
  return { steps, lines, total, z0, h0 };
})();

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export type StairCam = { X: number; E: number; Zc: number; F: number; hy: number };
/** the kit's front plane rides DFP ahead of the eye; geometry nearer than NEAR to the eye is clipped */
export const DFP = 1000;
export const NEAR = 0.6 * U;
export const camLerp = (a: StairCam, b: StairCam, t: number): StairCam => ({ X: lerp(a.X, b.X, t), E: lerp(a.E, b.E, t), Zc: lerp(a.Zc, b.Zc, t), F: Math.exp(lerp(Math.log(a.F), Math.log(b.F), t)), hy: lerp(a.hy, b.hy, t) });
/** the kit camera of a StairCam (after the house sway, in screen px) */
const kitCamOf = (c: StairCam, swayFrame: number | null) => {
  const k = c.F / DFP;
  const eyeY = -c.E;
  const cam0: Cam = { k, cx: c.X, cy: eyeY - (c.hy - 960) / k };
  return swayFrame === null ? cam0 : swayCam(cam0, swayFrame);
};
/** project a world point (X, H, Z) to screen px (no sway) */
export const screenOf = (c: StairCam, X: number, H: number, Z: number): P2 => {
  const D = Z - c.Zc;
  return [540 + (c.F * (X - c.X)) / D, c.hy - (c.F * (H - c.E)) / D];
};

// ===================================================================================================================
// THE AIR
// ===================================================================================================================
/** the height ramp: ramp t from the dense low air (H0) to the light high air (H1) */
export const RAMP = { tLow: 0.5, H0: -1.5 * U, H1: 15 * U, gamma: 1.55, ZB: 50 * U };
export const tOfHeight = (H: number) => RAMP.tLow * Math.pow(1 - c01((H - RAMP.H0) / (RAMP.H1 - RAMP.H0)), RAMP.gamma);
export const airOfHeight = (H: number) => rgbHex(airRamp("A", tOfHeight(H)));
/** fog by the eye's distance: none nearer than near (the stair never takes it), the far columns sink into the haze */
export const FOG = { near: 27 * U, vis: 24 * U, max: 0.96 };
/** the low air: heights below `top` sink toward the dense air, wholly below `full` */
export const LOW_AIR = { full: -0.7 * U, top: 5.6 * U, pow: 1.3, max: 1 };
export const lowAirAt = (H: number) => LOW_AIR.max * Math.pow(1 - smoothstep(LOW_AIR.full, LOW_AIR.top, H), LOW_AIR.pow);
/** C's cloud: a fog sea under the landing (its top at the landing's top) that sinks down the stair (`sink`, units),
 *  density 0..1 */
export const CLOUD = { H0: 3.6 * U, H1: 5.6 * U, front: 0.45 * U, over: 0.3 * U, billows: 0.16 * U };
/** the cloud's top at depth Z: `front` over the landing's top in front of its edge (it swallows the landing's edge
 *  and churns round Euclid's feet), just under the landing's top behind the edge (Euclid stands clear of it) */
export const cloudTopAt = (Z: number, sink = 0) => LANDING.H + lerp(lerp(CLOUD.front, CLOUD.billows, c01(sink / (0.5 * U))), CLOUD.over, smoothstep(LANDING.Z0 + 0.1 * U, LANDING.Z0 + 0.4 * U, Z));
/** how much of the cloud is at (H, Z) with the sea's top sunk by `sink`: 1 under its top, a soft edge (wider as it
 *  sinks and loosens) */
export const cloudBandAt = (H: number, Z: number = LANDING.Z0, sink = 0) => {
  const top = cloudTopAt(Z, sink) - sink;
  const edge = 0.33 * U + 0.45 * U * c01(sink / (4 * U));
  return 1 - smoothstep(top - edge, top + 0.06 * U, H);
};
/** the cloud's own colour: the air at its height, milkier (fog scatters the light), lighter toward its sunlit top */
export const cloudColAt = (H: number) => mixHex(airOfHeight(H), PAL.cream, 0.1 + 0.16 * smoothstep(CLOUD.H1, LANDING.H, H));
export const STAIR_SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: FOG.near, fogVis: FOG.vis, fogMax: FOG.max, hLow: 0, hHigh: 12 * U, moteUnit: U };

export type WorldOpts = {
  /** C's cloud under the landing, 0..1 (default 0) */
  cloud?: number;
  /** how far the cloud's top has sunk below the landing (units, default 0) */
  cloudSink?: number;
  /** glow of the tablets (by generation id) and of Euclid's scroll ("euclid") and the column works (by column id):
   *  1 = the resting glow; up to ~2.2 at a flare */
  glow?: Partial<Record<string, number>>;
  /** a passing light on a held diagram (0..1, by id): its own lines brighten, a halo hugs it (cut C's sweep) */
  flare?: Partial<Record<string, number>>;
  /** the light travelling up the chain of tablets: 0 (Thales's tablet) .. 1 (Euclid's scroll); < 0 = none */
  sweepAt?: number;
  /** the columns' rise, 0..1 each (default 1: standing) */
  rise?: number[];
  /** the never-built stair, 0..1 drawn (default 0: not drawn) */
  dashed?: number;
  /** ids not to draw: "stair", "cloud", "columns", "aqueduct", a generation / column / roman id, "euclid" */
  hide?: string[];
  /** a pose override per figure (return undefined to keep the default) */
  poseOf?: (id: string, t: number, def: RomeFolk.FigPose) => RomeFolk.FigPose | undefined;
  /** draw a figure yourself (at its anchor) instead of the default; return undefined to keep the default */
  renderFigure?: (id: string, S: StairAir, at: { X: number; H: number; Z: number }) => React.ReactNode | undefined;
};

export type StairAir = AirWorld & {
  c: StairCam;
  t: number;
  opts: WorldOpts;
  /** a world point (X, H up +, Z) as a 2D world point inside the WorldSvg */
  q: (X: number, H: number, Z: number) => P2;
  /** the eye's distance to depth Z */
  dist: (Z: number) => number;
  /** the full fog amount at (Z, H): depth fog, the low air and the cloud combined; and its air colour */
  fogAmt: (Z: number, H: number) => number;
  air: (H: number) => string;
  /** a figure's veil: { fog (RomeFolk fog), tone (opacity: the cloud and the deepest low air take the whole figure) } */
  figVeil: (Z: number, feetH: number) => { fog: RomeFolk.FolkFog; tone: number };
  /** screen px per world unit at depth Z (for widths that must hold on screen) */
  sc: (Z: number) => number;
  cloud: number;
  /** the cloud's sink (units) and its band at (H, Z) */
  sink: number;
  band: (H: number, Z: number) => number;
  /** a 2D world point to screen px */
  toScreen: (p: P2) => P2;
  /** the same frame without the cloud (a group that takes the cloud as a whole, by opacity, draws inside with it) */
  noCloud: StairAir;
};

const cloudBandAtS = (H: number, Z: number, sink: number) => cloudBandAt(H, Z, sink);
export const stairAirOf = (c: StairCam, t: number, rest: StairCam, opts: WorldOpts = {}, sway = true): StairAir => {
  const cam = kitCamOf(c, sway ? t : null);
  const Zfp = c.Zc + DFP;
  const base = perspective(cam, { eyeY: -c.E, dRef: DFP, kRef: 1, dolly: 0 });
  const P = {
    ...base,
    p: (X: number, Y: number, Z: number) => base.p(X, Y, Z - Zfp),
    r: (Z: number) => base.r(Z - Zfp),
    at: (X: number, Z: number) => base.at(X, Z - Zfp),
    zNear: c.Zc + NEAR,
  };
  const hyS = 960 + (-c.E - cam.cy) * cam.k; // the horizon row after the sway
  const v0 = makeAirView({
    scene: { ...STAIR_SCENE, F: c.F },
    frame: t,
    horizon: hyS,
    cam: { x: c.X, y: c.E, z: c.Zc },
    rest: { x: rest.X, y: rest.E, z: rest.Zc },
  });
  /** the height a backdrop row sees at the backdrop depth */
  const hAtScreen = (sy: number) => c.E + ((hyS - sy) / c.F) * (RAMP.ZB - c.Zc);
  const airH = (H: number) => airRamp("A", tOfHeight(H));
  const v = { ...v0, airAtScreen: (sy: number) => airH(hAtScreen(sy)), airAt: (_d: number, h = 0) => airH(h) };
  const dist = (Z: number) => Z - c.Zc;
  const depthFog = (Z: number) => c01(v0.fogAt(dist(Z)));
  const air = (H: number) => airOfHeight(H);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const sink = Math.max(0, opts.cloudSink ?? 0);
  const make = (cloud: number): StairAir => {
    const cloudBandAt = (H: number, Z: number) => cloudBandAtS(H, Z, sink);
    const fogAmt = (Z: number, H: number) => 1 - (1 - depthFog(Z)) * (1 - lowAirAt(H)) * (1 - cloud * cloudBandAt(H, Z));
    // the air (depth fog and the low air), then the cloud over it in its own colour
    const tone = (hex: string, Z: number, h = 0) => mixHex(mixHex(hex, air(h), 1 - (1 - depthFog(Z)) * (1 - lowAirAt(h))), cloudColAt(h), cloud * cloudBandAt(h, Z));
    const toneO = (hex: string, Z: number, h = 0) => mixHex(mixHex(hex, air(h), 1 - (1 - 0.5 * depthFog(Z)) * (1 - 0.92 * lowAirAt(h))), cloudColAt(h), 0.94 * cloud * cloudBandAt(h, Z));
    const figVeil = (Z: number, feetH: number) => {
      const h = feetH + 0.9 * U;
      const fd = 1 - (1 - 0.82 * depthFog(Z)) * (1 - lowAirAt(h));
      const cl = cloud * cloudBandAt(feetH + 0.9 * U, Z);
      return { fog: { rgb: air(h), amount: Math.min(0.86, fd) }, tone: (1 - smoothstep(0.86, 1, fd)) * (1 - cl) };
    };
    return {
      v,
      P,
      cam,
      Dc: DFP,
      k: cam.k,
      fog: (Z: number) => depthFog(Z),
      airHex: (_Z: number, h = 0) => air(h),
      tone,
      toneO,
      screenAir: (wy: number) => rgbHex(v.airAtScreen(toSY(wy))),
      figFog: (Z: number) => 0.82 * depthFog(Z),
      folkFog: (Z: number, feetH = 0) => figVeil(Z, feetH).fog,
      workerInks: () => {
        throw new Error("greekStairWorld: workerInks is not used");
      },
      lw: (b = 1.1) => b / Math.pow(cam.k, 0.6),
      c,
      t,
      opts,
      q: (X: number, H: number, Z: number) => P.p(X, -H, Z),
      dist,
      fogAmt,
      air,
      figVeil,
      sc: (Z: number) => c.F / Math.max(1, dist(Z)),
      cloud,
      sink,
      band: cloudBandAt,
      toScreen: (pp: P2) => [540 + (pp[0] - cam.cx) * cam.k, 960 + (pp[1] - cam.cy) * cam.k],
      noCloud: undefined as unknown as StairAir,
    };
  };
  const cl = c01(opts.cloud ?? 0);
  const S0 = make(0);
  S0.noCloud = S0;
  if (cl <= 0) return S0;
  const S = make(cl);
  S.noCloud = S0;
  return S;
};

// ===================================================================================================================
// DRAWING HELPERS
// ===================================================================================================================
/** clip a 3D polygon to the near plane (Z >= Zc + NEAR) and project it */
const clipProj = (S: StairAir, pts: V3[]): P2[] => {
  const zMin = S.c.Zc + NEAR;
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const ina = a[2] >= zMin;
    const inb = b[2] >= zMin;
    if (ina) out.push(a);
    if (ina !== inb) {
      const u = (zMin - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, zMin]);
    }
  }
  return out.map((p) => S.q(p[0], p[1], p[2]));
};
const visibleZ = (S: StairAir, Z: number, margin = 0) => Z - S.c.Zc > NEAR + margin;
/** a soft vertical gradient (userSpace, 2D world rows y0 -> y1) through colours at fractions */
const VGrad: React.FC<{ id: string; y0: number; y1: number; stops: [number, string][] }> = ({ id, y0, y1, stops }) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={(Math.abs(y1 - y0) < 0.01 ? y0 + 0.01 : y1).toFixed(2)}>
    {stops.map(([o, col], i) => (
      <stop key={i} offset={c01(o).toFixed(3)} stopColor={col} />
    ))}
  </linearGradient>
);

// ===================================================================================================================
// THE STAIR: marble blocks (riser and tread), lit from the upper left, the low air and the cloud by height
// ===================================================================================================================
/** the treads: cream marble in the light; the risers: marble a shade warmer and in half-light (front faces) */
const MARBLE: Mat = { lit: "#F3EAD6", mid: "#D2C2A2", dark: "#8E8470" };
const MARBLE_WARM: Mat = { lit: "#EADCC0", mid: "#C7B492", dark: "#857761" };
const SHADE = PAL.shadow;

/** one block (a step or the landing): front (riser), top (tread), sides, with the medium by height on every face.
 *  `drop` = how far down its vertical faces are drawn below its top (a step's lower front is behind the step in
 *  front of it; default: down to H0) */
export const Block: React.FC<{ S: StairAir; X0: number; X1: number; H0: number; H1: number; Z0: number; Z1: number; mat?: Mat; uid: string; joints?: number[]; nosing?: number; carve?: React.ReactNode; drop?: number }> = ({
  S,
  X0,
  X1,
  H0,
  H1,
  Z0,
  Z1,
  mat = MARBLE,
  uid,
  joints = [],
  nosing = 1,
  carve,
  drop,
}) => {
  const c = S.c;
  if (Z1 - c.Zc < NEAR) return null;
  const lw = S.lw(1.05);
  const ln = (Z: number, H: number) => S.tone(lineOf(mat), Z, H);
  const els: React.ReactNode[] = [];
  const defs: React.ReactNode[] = [];
  // the vertical faces stop where the block in front hides them (only while the eye is in front of the stair)
  const Hb = drop !== undefined && c.Zc < Z0 ? Math.max(H0, H1 - drop) : H0;
  // a vertical face's fill: a gradient by height through many stops (the low air and the cloud's edge change fast)
  const vertFace = (pts: V3[], local: (H: number) => string, Zm: number, key: string, Hlo = H0) => {
    const q = clipProj(S, pts);
    if (q.length < 3) return;
    const ya = S.q(0, H1, Zm)[1];
    const yb = S.q(0, Hlo, Zm)[1];
    const N = Hlo === H0 ? 20 : 14;
    const stops: [number, string][] = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const H = lerp(H1, Hlo, f);
      stops.push([f, S.tone(local(H), Zm, H)]);
    }
    const id = `${uid}${key}`;
    defs.push(<VGrad key={id} id={id} y0={ya} y1={yb} stops={stops} />);
    els.push(<path key={key} d={poly(q)} fill={`url(#${id})`} stroke={ln(Zm, (Hlo + H1) / 2)} strokeWidth={lw} strokeLinejoin="round" />);
  };
  /** the soft occlusion gathering toward a riser's foot (where it meets the tread below, one rise down) */
  const aoAt = (H: number, amt: number) => amt * Math.pow(c01((H1 - H) / RISE), 2.4);
  const Zm = (Z0 + Z1) / 2;
  // underside (only when the eye is below it), back (when beyond it), sides (when outside them)
  if (c.E < H0) els.push(<path key="bt" d={poly(clipProj(S, [[X0, H0, Z0], [X1, H0, Z0], [X1, H0, Z1], [X0, H0, Z1]]))} fill={S.tone(mixHex(mat.dark, SHADE, 0.3), Zm, H0)} />);
  if (c.Zc > Z1) vertFace([[X0, H1, Z1], [X1, H1, Z1], [X1, H0, Z1], [X0, H0, Z1]], () => mixHex(mat.mid, mat.dark, 0.45), Z1, "bk");
  if (c.X < X0) vertFace([[X0, H1, Z0], [X0, H1, Z1], [X0, H0, Z1], [X0, H0, Z0]], (H) => mixHex(mixHex(mat.lit, mat.mid, 0.35), SHADE, aoAt(H, 0.2)), Zm, "lf");
  if (c.X > X1) vertFace([[X1, H1, Z0], [X1, H1, Z1], [X1, H0, Z1], [X1, H0, Z0]], (H) => mixHex(mixHex(mat.dark, SHADE, 0.12), SHADE, aoAt(H, 0.15)), Zm, "rt");
  // the tread (top): lit marble, a touch darker toward its back where the next riser shades it
  if (c.E > H1) {
    const q = clipProj(S, [[X0, H1, Z0], [X1, H1, Z0], [X1, H1, Z1], [X0, H1, Z1]]);
    if (q.length >= 3) {
      const ya = S.q(0, H1, Z0)[1];
      const yb = S.q(0, H1, Z1)[1];
      const id = `${uid}tp`;
      defs.push(<VGrad key={id} id={id} y0={ya} y1={yb} stops={[[0, S.tone(mat.lit, Z0, H1)], [0.7, S.tone(mixHex(mat.lit, mat.mid, 0.35), Zm, H1)], [1, S.tone(mixHex(mat.mid, SHADE, 0.18), Z1, H1)]]} />);
      els.push(<path key="tp" d={poly(q)} fill={`url(#${id})`} stroke={ln(Zm, H1)} strokeWidth={lw} strokeLinejoin="round" />);
    }
  }
  // the riser (front): half-light, a lighter lip under the nosing, the occlusion at its foot, and a soft fall-off
  // from the lit left end to the right (the light from the upper left)
  if (c.Zc < Z0) {
    vertFace([[X0, H1, Z0], [X1, H1, Z0], [X1, Hb, Z0], [X0, Hb, Z0]], (H) => mixHex(H > H1 - 0.05 * U ? mixHex(mat.lit, mat.mid, 0.5) : mat.mid, SHADE, aoAt(H, 0.34)), Z0, "fr", Hb);
    const qa = S.q(X0, H1, Z0);
    const qb = S.q(X1, H1, Z0);
    const qc = S.q(X1, Hb, Z0);
    const fz = S.fogAmt(Z0, (H1 + Hb) / 2);
    const id = `${uid}lr`;
    defs.push(
      <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={qa[0].toFixed(2)} y1="0" x2={qb[0].toFixed(2)} y2="0">
        <stop offset="0" stopColor={PAL.cream} stopOpacity={0.07 * (1 - fz)} />
        <stop offset="0.45" stopColor={PAL.cream} stopOpacity={0} />
        <stop offset="1" stopColor={SHADE} stopOpacity={0.1 * (1 - fz)} />
      </linearGradient>,
    );
    els.push(<path key="lr" d={poly(clipProj(S, [[X0, H1, Z0], [X1, H1, Z0], [X1, Hb, Z0], [X0, Hb, Z0]]))} fill={`url(#${id})`} />);
    void qc;
    // the nosing's thin shade on the riser just under it
    const a = S.q(X0, H1 - 0.035 * U, Z0);
    const b = S.q(X1, H1 - 0.035 * U, Z0);
    els.push(<path key="ns" d={`M${Pt(a)}L${Pt(b)}`} stroke={SHADE} strokeWidth={Math.max(lw, 0.05 * U * S.P.r(Z0))} strokeOpacity={0.16 * (1 - S.fogAmt(Z0, H1))} />);
  }
  // joints: a few thin vertical joints in the riser, fading with the medium
  if (c.Zc < Z0 && joints.length) {
    let d = "";
    for (const X of joints) {
      const a = S.q(X, H1 - 0.03 * U, Z0);
      const b = S.q(X, Math.max(Hb, H1 - RISE), Z0);
      d += `M${Pt(a)}L${Pt(b)}`;
    }
    const jf = S.fogAmt(Z0, H1 - RISE * 0.4);
    els.push(<path key="jt" d={d} stroke={S.tone(lineOf(mat), Z0, H1 - RISE * 0.4)} strokeWidth={lw * 0.8} strokeOpacity={0.4 * (1 - jf)} fill="none" />);
  }
  if (carve && c.Zc < Z0) els.push(<g key="cv">{carve}</g>);
  // the nosing: a cream rim along the tread's front edge (and its left edge when the tread is seen)
  const nf = S.fogAmt(Z0, H1);
  const ra = (1 - nf) * 0.62 * nosing;
  if (ra > 0.01 && visibleZ(S, Z0)) {
    let d = `M${Pt(S.q(X0, H1, Z0))}L${Pt(S.q(X1, H1, Z0))}`;
    if (c.E > H1 && c.X > X0) d += `M${Pt(S.q(X0, H1, Z0))}L${Pt(S.q(X0, H1, Math.max(Z0, Z1 - 0.01)))}`;
    els.push(<path key="rim" d={d} fill="none" stroke={PAL.cream} strokeWidth={lw * 1.25} strokeOpacity={ra} strokeLinecap="round" />);
  }
  return (
    <g>
      <defs>{defs}</defs>
      {els}
    </g>
  );
};

/** EUCLID carved into the landing's front riser: incised serif capitals, the cut's upper-left wall in shade and its
 *  lower-right lip catching the light, lit and fogged like the stone */
export const Carved: React.FC<{ S: StairAir; text: string; X: number; H: number; Z: number; size: number; mat?: Mat; spacing?: number; width?: number }> = ({ S, text, X, H, Z, size, mat = MARBLE, spacing = 0.16, width }) => {
  if (!visibleZ(S, Z)) return null;
  const p = S.q(X, H, Z);
  const r = S.P.r(Z);
  const fs = size * r;
  const deep = S.tone(mixHex(mat.dark, SHADE, 0.25), Z, H);
  const lip = S.tone(mixHex(mat.lit, PAL.cream, 0.6), Z, H);
  const f = S.fogAmt(Z, H);
  const style: React.CSSProperties = { fontFamily: fellSC, fontSize: fs, letterSpacing: spacing * fs };
  const off = 0.045 * fs;
  // a fixed width (world units) when it must fit a face (a column's band)
  const tl = width ? { textLength: width * r, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <g>
      <text x={p[0] + off} y={p[1] + off} textAnchor="middle" fill={lip} fillOpacity={0.85 * (1 - f)} style={style} {...tl}>
        {text}
      </text>
      <text x={p[0]} y={p[1]} textAnchor="middle" fill={deep} style={style} {...tl}>
        {text}
      </text>
      <text x={p[0] - off * 0.6} y={p[1] - off * 0.6} textAnchor="middle" fill={S.tone(mixHex(mat.dark, SHADE, 0.55), Z, H)} fillOpacity={0.55 * (1 - f)} style={style} {...tl}>
        {text}
      </text>
    </g>
  );
};

// ===================================================================================================================
// THE DIAGRAMS (orange: Greek mathematical knowledge). Tablet-local units: x -1..1, y -0.78..0.78 (y down)
// ===================================================================================================================
const arcD = (cx: number, cy: number, r: number, a0: number, a1: number, n = 24) => {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    d += `${i ? "L" : "M"}${n3(cx + r * Math.cos(a))},${n3(cy + r * Math.sin(a))}`;
  }
  return d;
};
const circleD = (cx: number, cy: number, r: number) => `M${n3(cx + r)},${n3(cy)}A${n3(r)},${n3(r)} 0 1 0 ${n3(cx - r)},${n3(cy)}A${n3(r)},${n3(r)} 0 1 0 ${n3(cx + r)},${n3(cy)}`;
const polyD = (pts: P2[], close = true) => `M${pts.map((p) => `${n3(p[0])},${n3(p[1])}`).join("L")}${close ? "Z" : ""}`;
/** a diagram: line paths (stroked) and fill paths (a soft orange wash) */
export const diagramOf = (kind: DiagramKind): { lines: string; fills?: string; dots?: P2[] } => {
  switch (kind) {
    case "thales": {
      // the angle in a semicircle: the diameter, the arc, the triangle to a point on it, the right-angle mark
      const r = 0.82;
      const cy = 0.42;
      const a = (-58 * Math.PI) / 180;
      const P3: P2 = [r * Math.cos(a), cy + r * Math.sin(a)];
      const u1: P2 = [-r - P3[0], cy - P3[1]];
      const u2: P2 = [r - P3[0], cy - P3[1]];
      const n1 = Math.hypot(...u1);
      const n2 = Math.hypot(...u2);
      const m = 0.14;
      const q1: P2 = [P3[0] + (u1[0] / n1) * m, P3[1] + (u1[1] / n1) * m];
      const q2: P2 = [P3[0] + (u2[0] / n2) * m, P3[1] + (u2[1] / n2) * m];
      const q3: P2 = [q1[0] + (u2[0] / n2) * m, q1[1] + (u2[1] / n2) * m];
      return { lines: `${arcD(0, cy, r, Math.PI, 2 * Math.PI, 32)}M${-r},${cy}L${r},${cy}${polyD([[-r, cy], P3, [r, cy]], false)}${polyD([q1, q3, q2], false)}`, dots: [P3, [0, cy]] };
    }
    case "pythagoras": {
      // the right triangle with the squares on its three sides (Euclid I.47), scaled into the tablet
      const s = 0.3;
      const A: P2 = [-0.28, 0.12];
      const B: P2 = [A[0] + 1.2 * s * 1.25, A[1]];
      const C: P2 = [A[0], A[1] - 0.9 * s * 1.25];
      const sq = (p: P2, q: P2, out: 1 | -1): P2[] => {
        const dx = q[0] - p[0];
        const dy = q[1] - p[1];
        const nx = -dy * out;
        const ny = dx * out;
        return [p, q, [q[0] + nx, q[1] + ny], [p[0] + nx, p[1] + ny]];
      };
      const tri = polyD([A, B, C]);
      return { lines: `${tri}${polyD(sq(A, B, -1))}${polyD(sq(C, A, -1))}${polyD(sq(B, C, -1))}`, fills: tri };
    }
    case "lune": {
      // Hippocrates: the right isosceles triangle in the big semicircle; the small semicircle on one leg; the lune
      const R = 0.8;
      const cy = 0.38;
      const top: P2 = [0, cy - R];
      const mid: P2 = [R / 2, cy - R / 2];
      const rs = (R * Math.SQRT2) / 2;
      const ang = Math.atan2(top[1] - cy, top[0] - R);
      const lune = `${arcD(mid[0], mid[1], rs, ang + Math.PI, ang + 2 * Math.PI, 24)}${arcD(0, cy, R, -Math.PI / 2, 0, 16).replace("M", "L")}Z`;
      return { lines: `${arcD(0, cy, R, Math.PI, 2 * Math.PI, 32)}M${-R},${cy}L${R},${cy}${polyD([[-R, cy], top, [R, cy]], false)}${arcD(mid[0], mid[1], rs, ang + Math.PI, ang + 2 * Math.PI, 24)}`, fills: lune };
    }
    case "octahedron": {
      // Theaetetus: the regular octahedron (an apex over and under a square seen at a slant)
      const t: P2 = [0.02, -0.72];
      const b: P2 = [-0.02, 0.72];
      const sqp: P2[] = [
        [-0.62, 0.02],
        [0.18, 0.2],
        [0.64, -0.04],
        [-0.12, -0.2],
      ];
      let d = polyD(sqp);
      for (const p of sqp) d += `M${n3(t[0])},${n3(t[1])}L${n3(p[0])},${n3(p[1])}M${n3(b[0])},${n3(b[1])}L${n3(p[0])},${n3(p[1])}`;
      return { lines: d, fills: polyD([t, sqp[0], sqp[1]]) + polyD([b, sqp[0], sqp[1]]) };
    }
    case "exhaustion": {
      // Eudoxus: polygons inscribed in a circle (4, 8, 16 sides), closing on it
      const r = 0.68;
      const ng = (n: number) => polyD(Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)] as P2));
      return { lines: `${circleD(0, 0, r)}${ng(4)}${ng(8)}${ng(16)}`, fills: ng(8) };
    }
    case "elements": {
      // Euclid I.1: the equilateral triangle on two circles (the scroll's centrepiece)
      const r = 0.42;
      const A: P2 = [-r / 2, 0.16];
      const B: P2 = [r / 2, 0.16];
      const C: P2 = [0, 0.16 - (r * Math.sqrt(3)) / 2];
      return { lines: `${circleD(A[0], A[1], r)}${circleD(B[0], B[1], r)}${polyD([A, B, C])}`, fills: polyD([A, B, C]), dots: [A, B, C] };
    }
    case "sphereCylinder": {
      const r = 0.5;
      const ry = 0.12;
      return { lines: `M${-r},${-r}L${-r},${r}M${r},${-r}L${r},${r}${`M${-r},${-r}A${r},${ry} 0 1 0 ${r},${-r}A${r},${ry} 0 1 0 ${-r},${-r}`}M${-r},${r}A${r},${ry} 0 0 0 ${r},${r}${circleD(0, 0, r)}${`M${-r},0A${r},${ry} 0 0 0 ${r},0`}`, fills: circleD(0, 0, r) };
    }
    case "cone": {
      const apex: P2 = [0, -0.72];
      const r = 0.58;
      const by = 0.6;
      return { lines: `M${apex[0]},${apex[1]}L${-r},${by}M${apex[0]},${apex[1]}L${r},${by}M${-r},${by}A${r},0.13 0 0 0 ${r},${by}${`M-0.36,0.34A0.3,0.12 -18 1 0 0.32,0.08A0.3,0.12 -18 1 0 -0.36,0.34`}`, fills: `M-0.36,0.34A0.3,0.12 -18 1 0 0.32,0.08A0.3,0.12 -18 1 0 -0.36,0.34Z` };
    }
    case "astrolabe": {
      const r = 0.72;
      let d = `${circleD(0, 0, r)}${circleD(0, 0, r * 0.8)}${circleD(0.08, 0.1, r * 0.46)}M0,${-r}L0,${r}M${-r},0L${r},0M${-r * 0.7},${r * 0.62}L${r * 0.7},${-r * 0.62}`;
      d += `M0,${-r}L-0.09,${-r - 0.2}L0.09,${-r - 0.2}Z`;
      return { lines: d, fills: circleD(0.08, 0.1, r * 0.46) };
    }
    case "arithmetica": {
      // a column of written lines (Diophantus writes): short strokes, a few with his sign for the unknown
      let d = "";
      for (let i = 0; i < 6; i++) {
        const y = -0.6 + i * 0.24;
        const w = 0.8 - (i % 3) * 0.18;
        d += `M-0.82,${n3(y)}L${n3(-0.82 + w)},${n3(y)}`;
        d += `M${n3(-0.82 + w + 0.12)},${n3(y - 0.06)}Q${n3(-0.82 + w + 0.2)},${n3(y + 0.08)} ${n3(-0.82 + w + 0.3)},${n3(y - 0.04)}`;
      }
      return { lines: d };
    }
  }
};

/** a diagram drawn in a tablet's frame: a soft glow under, the line over (glow 1 = resting) */
const DiagramArt: React.FC<{ kind: DiagramKind; col: string; hot: string; glow: number; sw: number; wash?: string }> = ({ kind, col, hot, glow, sw, wash }) => {
  const g = diagramOf(kind);
  const flare = c01(glow - 1);
  return (
    <g>
      {g.fills ? <path d={g.fills} fill={wash ?? col} fillOpacity={0.16 + 0.12 * flare} /> : null}
      <path d={g.lines} fill="none" stroke={col} strokeWidth={sw * (2.6 + 2.4 * flare)} strokeOpacity={0.16 + 0.36 * flare} strokeLinecap="round" strokeLinejoin="round" />
      <path d={g.lines} fill="none" stroke={mixHex(col, hot, 0.65 * flare)} strokeWidth={sw * (1 + 0.4 * flare)} strokeLinecap="round" strokeLinejoin="round" />
      {(g.dots ?? []).map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={sw * 1.3} fill={mixHex(col, hot, 0.5 * flare)} />
      ))}
    </g>
  );
};

/** the board a generation holds up: an umber wooden frame round a dark brown wax panel, the diagram glowing on it */
export const Tablet: React.FC<{ S: StairAir; X: number; H: number; Z: number; rot: number; kind: DiagramKind; glow?: number; uid: string; w?: number; h?: number }> = ({ S, X, H, Z, rot, kind, glow = 1, uid, w = TABLET.w, h = TABLET.h }) => {
  if (!visibleZ(S, Z)) return null;
  const p = S.q(X, H, Z);
  const r = S.P.r(Z);
  const sx = (w / 2) * r;
  const sy = (h / 2) * r;
  const wood = S.tone("#7A5A3A", Z, H);
  const woodLit = S.tone("#A88259", Z, H);
  const wax = mixHex(S.tone("#4A3828", Z, H), S.toneO("#7A4A12", Z, H), 0.55 * c01(glow - 1));
  const o = S.toneO(ACCENT, Z, H);
  const hot = S.toneO(PAL.orangeHot, Z, H);
  const fz = S.fogAmt(Z, H);
  const flare = c01(glow - 1);
  // the diagram's line in screen px (~1.5 px on a 100 px tablet, ~3 px on a 400 px one), in diagram units
  const unitPx = Math.max(0.5, sx * 0.8 * S.k);
  const sw = Math.max(1.3, Math.min(3.4, 1.0 + 0.012 * unitPx)) / unitPx;
  return (
    <g transform={`translate(${n3(p[0])} ${n3(p[1])}) rotate(${n3(rot)})`}>
      <defs>
        <radialGradient id={`${uid}-hl`}>
          <stop offset="0" stopColor={PAL.orange} stopOpacity={(0.05 + 0.2 * flare) * (1 - fz)} />
          <stop offset="0.6" stopColor={PAL.orange} stopOpacity={(0.02 + 0.08 * flare) * (1 - fz)} />
          <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={sx * (1.45 + 0.5 * flare)} ry={sy * (1.6 + 0.5 * flare)} fill={`url(#${uid}-hl)`} />
      <rect x={-sx} y={-sy} width={2 * sx} height={2 * sy} rx={sx * 0.06} fill={wood} stroke={S.tone("#3A2A1C", Z, H)} strokeWidth={Math.max(0.6, 0.012 * U * r)} />
      <path d={`M${n3(-sx)},${n3(sy - 0.04 * sx)}L${n3(-sx)},${n3(-sy)}L${n3(sx)},${n3(-sy)}`} fill="none" stroke={woodLit} strokeWidth={Math.max(0.7, 0.016 * U * r)} strokeOpacity={0.8 * (1 - fz)} />
      <rect x={-sx * 0.86} y={-sy * 0.8} width={1.72 * sx} height={1.6 * sy} rx={sx * 0.03} fill={wax} />
      <g transform={`scale(${n3(sx * 0.8)} ${n3(sx * 0.8)})`}>
        <DiagramArt kind={kind} col={o} hot={hot} glow={glow} sw={sw} />
      </g>
    </g>
  );
};

/** Euclid's open scroll of the Elements: a glowing orange papyrus between two rollers, the gathered diagrams on it
 *  (I.1 in the middle, the five generations' diagrams round it) */
export const ElementsScroll: React.FC<{ S: StairAir; glow?: number; uid: string; X?: number; H?: number; Z?: number; w?: number; h?: number; content?: "elements" | "arithmetica" }> = ({ S, glow = 1, uid, ...o }) => {
  const at = scrollAt();
  const X = o.X ?? at.X;
  const H = o.H ?? at.H;
  const Z = o.Z ?? at.Z;
  const w = o.w ?? SCROLL.w;
  const h = o.h ?? SCROLL.h;
  if (!visibleZ(S, Z)) return null;
  const p = S.q(X, H, Z);
  const r = S.P.r(Z);
  const sx = (w / 2) * r;
  const sy = (h / 2) * r;
  const flare = c01(glow - 1);
  const paper = S.toneO(mixHex(ACCENT, PAL.orangeHot, 0.18 + 0.3 * flare), Z, H);
  const paperLo = S.toneO(ACCENT_DEEP, Z, H);
  const ink = S.toneO("#9A4E06", Z, H);
  const roll = S.toneO(ACCENT_DEEP, Z, H);
  const rollD = S.toneO("#9A5C07", Z, H);
  const fz = S.fogAmt(Z, H);
  const rr = sy * 0.2;
  // the gathered diagrams: Euclid I.1 large in the middle, the five generations' small round it; columns of
  // written lines between (hairlines in a deeper orange). Diophantus's scroll: written lines only
  const small: [DiagramKind, number, number][] = [
    ["thales", -0.72, -0.42],
    ["pythagoras", -0.72, 0.42],
    ["lune", 0.72, -0.42],
    ["octahedron", 0.5, 0.44],
    ["exhaustion", 0.86, 0.44],
  ];
  const art = (k: DiagramKind, x: number, y: number, size: number, i: number, wash = true) => {
    const sc = size * sy;
    const unitPx = Math.max(0.5, sc * S.k);
    const sw = Math.max(1.0, Math.min(2.6, 0.8 + 0.01 * unitPx)) / unitPx;
    return (
      <g key={i} transform={`translate(${n3(x * sx)} ${n3(y * sy)}) scale(${n3(sc)})`}>
        <DiagramArt kind={k} col={ink} hot={ink} glow={1} sw={sw} wash={wash ? ink : undefined} />
      </g>
    );
  };
  const arith = o.content === "arithmetica";
  let writ = "";
  const cols: [number, number][] = arith
    ? [
        [-0.8, -0.08],
        [0.06, 0.78],
      ]
    : [
        [-0.5, -0.24],
        [0.22, 0.48],
      ];
  for (const [x0, x1] of cols) {
    for (let k = 0; k < 7; k++) {
      const y = -0.62 + k * 0.2;
      const wl = (x1 - x0) * (k % 3 === 2 ? 0.65 : k % 2 ? 0.9 : 1);
      writ += `M${n3(x0 * sx)},${n3(y * sy)}L${n3((x0 + wl) * sx)},${n3(y * sy)}`;
    }
  }
  const hair = Math.max(0.9 / S.k, 0.008 * U * r);
  return (
    <g transform={`translate(${n3(p[0])} ${n3(p[1])})`}>
      <defs>
        <radialGradient id={`${uid}-hl`}>
          <stop offset="0" stopColor={PAL.orange} stopOpacity={(0.13 + 0.24 * flare) * (1 - fz)} />
          <stop offset="0.5" stopColor={PAL.orange} stopOpacity={(0.05 + 0.1 * flare) * (1 - fz)} />
          <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}-pp`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={paper} />
          <stop offset="1" stopColor={mixHex(paper, paperLo, 0.45)} />
        </linearGradient>
      </defs>
      <ellipse cx={0} cy={0} rx={sx * (1.3 + 0.35 * flare)} ry={sy * (2.3 + 0.6 * flare)} fill={`url(#${uid}-hl)`} />
      <path d={`M${n3(-sx)},${n3(-sy)}Q0,${n3(-sy * 0.82)} ${n3(sx)},${n3(-sy)}L${n3(sx)},${n3(sy)}Q0,${n3(sy * 1.12)} ${n3(-sx)},${n3(sy)}Z`} fill={`url(#${uid}-pp)`} />
      <path d={writ} stroke={ink} strokeWidth={hair} strokeOpacity={arith ? 0.75 : 0.42} strokeLinecap="round" />
      {arith ? null : art("elements", 0, 0.04, 0.6, 99)}
      {arith ? null : small.map(([k, x, y], i) => art(k, x, y, 0.3, i, false))}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * sx - rr * 1.1} y={-sy * 1.12} width={rr * 2.2} height={sy * 2.24} rx={rr} fill={roll} />
          <rect x={s * sx - rr * 1.1} y={-sy * 1.12} width={rr * 0.8} height={sy * 2.24} rx={rr * 0.4} fill={rollD} fillOpacity={s > 0 ? 0.5 : 0} />
          <rect x={s * sx - rr * 0.6} y={-sy * 1.3} width={rr * 1.2} height={sy * 0.2} rx={rr * 0.4} fill={rollD} />
          <rect x={s * sx - rr * 0.6} y={sy * 1.1} width={rr * 1.2} height={sy * 0.2} rx={rr * 0.4} fill={rollD} />
        </g>
      ))}
    </g>
  );
};

/** a column scholar's small work, held at chest height (a tablet, a cone, an astrolabe, a scroll) */
const SmallWork: React.FC<{ S: StairAir; kind: DiagramKind; X: number; H: number; Z: number; glow: number; uid: string }> = ({ S, kind, X, H, Z, glow, uid }) => {
  if (kind === "arithmetica") return <ElementsScroll S={S} glow={glow} uid={uid} X={X} H={H} Z={Z} w={0.62 * U} h={0.28 * U} content="arithmetica" />;
  if (kind === "astrolabe") {
    if (!visibleZ(S, Z)) return null;
    const p = S.q(X, H, Z);
    const r = S.P.r(Z);
    const s = 0.24 * U * r;
    const o = S.toneO(ACCENT, Z, H);
    const d = S.toneO(ACCENT_DEEP, Z, H);
    const fz = S.fogAmt(Z, H);
    return (
      <g transform={`translate(${n3(p[0])} ${n3(p[1])})`}>
        <defs>
          <radialGradient id={`${uid}-hl`}>
            <stop offset="0" stopColor={PAL.orange} stopOpacity={0.16 * (1 - fz)} />
            <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle r={s * 2.2} fill={`url(#${uid}-hl)`} />
        <circle r={s} fill={d} />
        <g transform={`scale(${n3(s * 0.95)})`}>
          <DiagramArt kind="astrolabe" col={o} hot={S.toneO(PAL.orangeHot, Z, H)} glow={glow} sw={2 / Math.max(1, s)} />
        </g>
      </g>
    );
  }
  return <Tablet S={S} X={X} H={H} Z={Z} rot={0} kind={kind} glow={glow} uid={uid} w={0.5 * U} h={0.42 * U} />;
};

// ===================================================================================================================
// THE FIGURES: the clip's Greek cast (./greekFolk, GREEK_FOLK_READY.md); the Romans at the aqueduct are RomeFolk
// ===================================================================================================================
export const FIG_STANDIN = false;
/** the generations' looks (greekFolk Scholar variants) and their tablets' diagrams (greekFolk's names) */
export const GEN_LOOK: Record<string, { variant: number; diagram: GF.DiagramSpec }> = {
  thales: { variant: 0, diagram: "thales" },
  pythagoras: { variant: 1, diagram: "pythagoras" },
  hippocrates: { variant: 2, diagram: "lunes" },
  theaetetus: { variant: 3, diagram: "solids" },
  eudoxus: { variant: 4, diagram: "exhaustion" },
};
/** how far each generation's offer has risen (greekFolk offerUp t): the tablet held up beside the face toward the step
 *  above (the hands land on the tablet's edges at tabletAt, itemAt) */
export const OFFER_T = 0.5;
/** the generations' body turn (greekFolk yaw: 0 front .. PI/2 profile) */
export const OFFER_YAW = 0.85;
export const genPose = (g: Generation, t: number, i: number): GF.GPose => {
  const q = GF.POSES.offerUp(g.dir, OFFER[g.id]?.t ?? OFFER_T, t / 95 + i * 0.21, OFFER_YAW);
  return GF.idle({ ...q, pitch: q.pitch - 6 }, t, 3 + i * 1.7);
};
/** Euclid: the Elements hanging open from his left hand, the dividers up in his right (his three-quarter); a breath;
 *  his small head turn at the end of C (f212-226), easing back in D */
export const EUCLID_YAW = 0.35;
export const euclidPose = (t: number): GF.GPose => {
  const q = GF.POSES.holdScroll(1, EUCLID_YAW);
  const turn = -0.16 * smoothstep(212, 226, t) + 0.06 * smoothstep(244, 266, t);
  const b = GF.idle({ ...q, pitch: q.pitch - 2 + 1.2 * Math.sin(t / 26), crouch: q.crouch + 0.8 * Math.sin(t / 26) }, t, 11, 1.2);
  return { ...GF.POSES.turnHead(b, q.headYaw + turn), dz: q.dz };
};
/** where Euclid's hanging scroll is (rig offset from his feet, at rest) -> its world point (the light's last stop) */
const EUCLID_SCROLL_OFF: P2 = (() => {
  const an = GF.greekAnchors("euclid", euclidPose(0), [0, 0], 1, { held: GF.EUCLID_HELD });
  return an.scroll ? an.scroll.c : [12, -190];
})();
/** a Greek figure in the medium (fog by depth and the low air; the cloud by opacity) */
type GFigCtx = { S: StairAir; X: number; H: number; Z: number; pose: GF.GPose; kind: GF.GreekKind; variant: number; held?: GF.Held; itemAt?: { c: P2; ang?: number }; grip?: { L?: P2; R?: P2 }; uid: string };
const GFig: React.FC<GFigCtx> = ({ S, X, H, Z, pose, kind, variant, held, itemAt, grip, uid }) => {
  if (!visibleZ(S, Z, 0.3 * U)) return null;
  const at = S.q(X, H, Z);
  const scale = S.P.r(Z);
  const veil = S.figVeil(Z, H);
  if (veil.tone < 0.01) return null;
  return <GF.GreekFigure kind={kind} variant={variant} pose={pose} at={at} scale={scale} uid={uid} fog={veil.fog} tone={veil.tone} unitPx={S.k} held={held} itemAt={itemAt} grip={grip} />;
};
/** the passing light on a held diagram: the diagram's own lines (greekFolk's, mapped onto the held face from its
 *  corners) brighten toward hot orange, and a tight halo hugs the face (<= 1.3x it). `face`: a tablet (corners
 *  -1..1 x -1..1) or Euclid's hanging sheet (corners -1..1 x 0..1) */
const LineFlare: React.FC<{ S: StairAir; corners: P2[]; face: "tablet" | "hang"; diagram: GF.DiagramSpec; amt: number; Z: number; H: number; uid: string }> = ({ S, corners, face, diagram, amt, Z, H, uid }) => {
  const a0 = amt * (1 - S.fogAmt(Z, H));
  if (a0 < 0.01 || corners.length < 4) return null;
  const [c0, c1, , c3] = corners;
  const ex: P2 = [(c1[0] - c0[0]) / 2, (c1[1] - c0[1]) / 2];
  const O: P2 = face === "tablet" ? [(corners[0][0] + corners[1][0] + corners[2][0] + corners[3][0]) / 4, (corners[0][1] + corners[1][1] + corners[2][1] + corners[3][1]) / 4] : [(c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2];
  const ey: P2 = face === "tablet" ? [(c3[0] - c0[0]) / 2, (c3[1] - c0[1]) / 2] : [c3[0] - c0[0], c3[1] - c0[1]];
  const M = (p: P2): P2 => [O[0] + ex[0] * p[0] + ey[0] * p[1], O[1] + ex[1] * p[0] + ey[1] * p[1]];
  const T = face === "tablet" ? (p: P2): P2 => M([p[0] * 0.847 * 0.86, p[1] * 0.796 * 0.84]) : (p: P2): P2 => M([p[0] * 0.78, 0.5 + p[1] * 0.36]);
  const art = GF.diagramArt(diagram);
  const d = (ls: P2[][]) => ls.map((l) => `M${l.map((q) => Pt(T(q))).join("L")}`).join("");
  const wPx = Math.hypot(ex[0], ex[1]) * 2 * S.k;
  const w = Math.max(1.1, Math.min(3.2, 0.022 * wPx)) / S.k;
  const c = face === "tablet" ? O : M([0, 0.5]);
  const rx = Math.hypot(ex[0], ex[1]) * 1.3;
  const ry = Math.hypot(ey[0], ey[1]) * (face === "tablet" ? 1.4 : 0.7);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-lh`}>
          <stop offset="0" stopColor={PAL.orange} stopOpacity={0.3 * a0} />
          <stop offset="0.7" stopColor={PAL.orange} stopOpacity={0.12 * a0} />
          <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-lh)`} />
      <path d={d(art.lines) + d(art.thin)} fill="none" stroke={PAL.orange} strokeWidth={w * 3} strokeOpacity={0.4 * a0} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d(art.lines)} fill="none" stroke={PAL.orangeHot} strokeWidth={w * 1.15} strokeOpacity={0.95 * a0} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d(art.thin)} fill="none" stroke={PAL.orangeHot} strokeWidth={w * 0.6} strokeOpacity={0.8 * a0} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
/** a warm flare over a held diagram (the light of the questions passing): glow 1 = none */
const Flare: React.FC<{ S: StairAir; c: P2; Z: number; H: number; R: number; glow: number; uid: string }> = ({ S, c, Z, H, R, glow, uid }) => {
  const fl = c01(glow - 1);
  if (fl < 0.01) return null;
  const r = R * S.P.r(Z) * (1 + 0.5 * fl);
  const a = fl * (1 - S.fogAmt(Z, H));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-fl`}>
          <stop offset="0" stopColor={PAL.orangeHot} stopOpacity={0.5 * a} />
          <stop offset="0.3" stopColor={PAL.orange} stopOpacity={0.28 * a} />
          <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={r} ry={r * 0.85} fill={`url(#${uid}-fl)`} />
    </g>
  );
};
const genPoseRome = (g: Generation, t: number, i: number): RomeFolk.FigPose => {
  const q = RomeFolk.POSES.stand(g.dir);
  return RomeFolk.idle({ ...q, headYaw: q.headYaw * 0.55, pitch: q.pitch - 7, brow: -0.2, lean: q.lean - g.dir * 2 }, t, 3 + i * 1.7);
};
type FigCtx = { S: StairAir; id: string; X: number; H: number; Z: number; pose: RomeFolk.FigPose; kind: "dominus" | "freeman" | "slave" | "overseer"; variant: number; grip?: { L?: P2; R?: P2 }; only?: "L" | "R"; hide?: "L" | "R"; uid: string };
const Fig: React.FC<FigCtx> = ({ S, X, H, Z, pose, kind, variant, grip, only, hide, uid }) => {
  if (!visibleZ(S, Z, 0.3 * U)) return null;
  const at = S.q(X, H, Z);
  const scale = S.P.r(Z);
  const veil = S.figVeil(Z, H);
  if (veil.tone < 0.01) return null;
  const common = { pose, at, scale, uid, fog: veil.fog, tone: veil.tone, unitPx: S.k, grip, variant, onlyArm: only, hideArm: hide };
  if (kind === "dominus") return <RomeFolk.Dominus {...common} />;
  if (kind === "freeman") return <RomeFolk.Freeman {...common} inks={{ tunic: "#9A9070" }} pilleus={false} apron={false} />;
  if (kind === "overseer") return <RomeFolk.Overseer {...common} />;
  return <RomeFolk.Slave {...common} />;
};
/** a soft contact shadow on the surface at height H */
const Contact: React.FC<{ S: StairAir; X: number; H: number; Z: number; w?: number; d?: number; uid: string; amt?: number }> = ({ S, X, H, Z, w = 70, d = 34, uid, amt = 0.8 }) => {
  if (!visibleZ(S, Z - d)) return null;
  if (S.c.E < H) return null; // the surface is seen from below: the shadow is hidden under its edge
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.2 * d;
  const c = S.q(Xc, H, Zc);
  const rx = w * S.P.r(Zc);
  const ry = Math.max(0.5, Math.abs(S.q(Xc, H, Zc - d)[1] - S.q(Xc, H, Zc + d)[1]) / 2);
  const a = amt * (1 - S.fogAmt(Z, H));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-cs`}>
          <stop offset="0" stopColor={SHADE} stopOpacity={0.62 * a} />
          <stop offset="0.6" stopColor={SHADE} stopOpacity={0.3 * a} />
          <stop offset="1" stopColor={SHADE} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-cs)`} />
    </g>
  );
};

/** the soft shadow a generation throws on the riser behind him (the light from the upper left: down and to the right) */
const WallShadow: React.FC<{ S: StairAir; X: number; H: number; Zw: number; uid: string }> = ({ S, X, H, Zw, uid }) => {
  if (!visibleZ(S, Zw) || S.c.Zc > Zw) return null;
  const c = S.q(X + 0.32 * U, H + 0.75 * U, Zw);
  const r = S.P.r(Zw);
  const a = 0.2 * (1 - S.fogAmt(Zw, H + 0.75 * U));
  if (a < 0.01) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-g`}>
          <stop offset="0" stopColor={SHADE} stopOpacity={a} />
          <stop offset="0.55" stopColor={SHADE} stopOpacity={a * 0.6} />
          <stop offset="1" stopColor={SHADE} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={0.42 * U * r} ry={0.85 * U * r} fill={`url(#${uid}-g)`} />
    </g>
  );
};

/** a generation's tablet catching the passing light (its own lines, from the cast's anchors) */
const TabletLineFlare: React.FC<{ S: StairAir; g: Generation; pose: GF.GPose; c: P2; ang: number; amt: number }> = ({ S, g, pose, c, ang, amt }) => {
  const look = GEN_LOOK[g.id];
  const an = GF.greekAnchors("scholar", pose, S.q(g.X, g.H, g.Z), S.P.r(g.Z), { variant: look.variant, held: { two: "tablet", diagram: look.diagram }, itemAt: { c, ang } });
  if (!an.tablet) return null;
  const tb = tabletAt(g);
  return <LineFlare S={S} corners={an.tablet.corners} face="tablet" diagram={look.diagram} amt={amt} Z={tb.Z} H={tb.H} uid={`lf-${g.id}`} />;
};
/** a generation on his step with his tablet held up: the far arm behind the tablet, the near arm in front */
const GenerationFig: React.FC<{ S: StairAir; g: Generation; i: number }> = ({ S: S1, g, i }) => {
  // the cloud takes the man and his tablet together (group opacity); inside, the world without the cloud
  const cl = S1.cloud * S1.band(g.H + 0.8 * U, g.Z);
  if (cl > 0.995) return null;
  const S = S1.noCloud;
  const { opts, t } = S;
  if (opts.hide?.includes(g.id)) return null;
  const own = opts.renderFigure?.(g.id, S, { X: g.X, H: g.H, Z: g.Z });
  const tb = tabletAt(g);
  const glow = opts.glow?.[g.id] ?? 1;
  const flare = opts.flare?.[g.id] ?? 0;
  const tabEl = <Tablet S={S} X={tb.X} H={tb.H} Z={tb.Z} rot={tb.rot} kind={g.diagram} glow={glow} uid={`tb-${g.id}`} />;
  const shadow = (
    <>
      <WallShadow S={S} X={g.X} H={g.H} Zw={STEP_Z0(g.step + 1)} uid={`ws-${g.id}`} />
      <Contact S={S} X={g.X} H={g.H} Z={g.Z} uid={`cs-${g.id}`} amt={0.75} />
    </>
  );
  if (own !== undefined)
    return (
      <g opacity={1 - cl}>
        {shadow}
        {own}
      </g>
    );
  if (!FIG_STANDIN) {
    const def = genPose(g, t, i);
    const pose = (opts.poseOf?.(g.id, t, def) as GF.GPose | undefined) ?? def;
    const c = S.q(tb.X, tb.H, tb.Z);
    const look = GEN_LOOK[g.id];
    return (
      <g opacity={1 - cl}>
        {shadow}
        <GFig S={S} X={g.X} H={g.H} Z={g.Z} pose={pose} kind="scholar" variant={look.variant} held={{ two: "tablet", diagram: look.diagram }} itemAt={{ c, ang: tb.rot }} uid={`fg-${g.id}`} />
        <Flare S={S} c={c} Z={tb.Z} H={tb.H} R={0.55 * U} glow={glow} uid={`fl-${g.id}`} />
        {flare > 0.01 ? <TabletLineFlare S={S} g={g} pose={pose} c={c} ang={tb.rot} amt={flare} /> : null}
      </g>
    );
  }
  void tabEl;
  const def = genPoseRome(g, t, i);
  const pose = opts.poseOf?.(g.id, t, def) ?? def;
  // the grips: the tablet's two side edges, a little below its middle (2D world points)
  const rad = (tb.rot * Math.PI) / 180;
  const edge = (s: number): P2 => {
    const p = S.q(tb.X, tb.H, tb.Z);
    const r = S.P.r(tb.Z);
    const ex = s * (TABLET.w / 2) * 0.96 * r;
    const ey = 0.18 * TABLET.h * r;
    return [p[0] + ex * Math.cos(rad) - ey * Math.sin(rad), p[1] + ex * Math.sin(rad) + ey * Math.cos(rad)];
  };
  // facing right (dir 1): the near arm is L (screen left when facing us), it grips the tablet's near (left) edge
  const near: "L" | "R" = g.dir > 0 ? "L" : "R";
  const far: "L" | "R" = near === "L" ? "R" : "L";
  const grip = { [near]: edge(-g.dir), [far]: edge(g.dir) } as { L?: P2; R?: P2 };
  const base = { S, id: g.id, X: g.X, H: g.H, Z: g.Z, pose, kind: g.kind, variant: g.variant, grip };
  return (
    <g opacity={1 - cl}>
      {shadow}
      <Fig {...base} hide={near} uid={`fg-${g.id}`} />
      {tabEl}
      <Fig {...base} only={near} uid={`fa-${g.id}`} />
    </g>
  );
};

const EuclidFig: React.FC<{ S: StairAir }> = ({ S }) => {
  const { opts, t } = S;
  if (opts.hide?.includes("euclid")) return null;
  const glow = opts.glow?.euclid ?? 1;
  const sc = scrollAt();
  const own = opts.renderFigure?.("euclid", S, { X: EUCLID.X, H: EUCLID.H, Z: EUCLID.Z });
  const shadow = <Contact S={S} X={EUCLID.X} H={EUCLID.H} Z={EUCLID.Z} w={80} uid="cs-euclid" amt={0.8} />;
  if (own !== undefined)
    return (
      <g>
        {shadow}
        {own}
      </g>
    );
  const def = euclidPose(t);
  const pose = (opts.poseOf?.("euclid", t, def) as GF.GPose | undefined) ?? def;
  void sc;
  const at = S.q(EUCLID.X, EUCLID.H, EUCLID.Z);
  const scale = S.P.r(EUCLID.Z);
  const an = GF.greekAnchors("euclid", pose, at, scale, { held: GF.EUCLID_HELD });
  const sp = an.scroll ? an.scroll.c : S.q(scrollAt().X, scrollAt().H, scrollAt().Z);
  // his steady glow (the Elements gather all the diagrams: the brightest orange in the world): a warm light on and
  // round the scroll (in front: it lights the sheet), stronger once the questions arrive; and the arrival flare
  const rest = 0.42 + 0.4 * c01((glow - 1.05) / 0.5);
  return (
    <g>
      {shadow}
      <Flare S={S} c={sp} Z={EUCLID.Z} H={EUCLID.H + 1.1 * U} R={1.0 * U} glow={1 + 0.6 * rest} uid="fl-euclid-back" />
      <GFig S={S} X={EUCLID.X} H={EUCLID.H} Z={EUCLID.Z} pose={pose} kind="euclid" variant={0} held={GF.EUCLID_HELD} uid="fg-euclid" />
      <Flare S={S} c={sp} Z={EUCLID.Z} H={EUCLID.H + 1.1 * U} R={0.5 * U} glow={1 + 0.5 * rest} uid="fl-euclid-rest" />
      {an.scroll && (opts.flare?.euclid ?? 0) > 0.01 ? <LineFlare S={S} corners={an.scroll.corners} face="hang" diagram="elements" amt={opts.flare?.euclid ?? 0} Z={EUCLID.Z} H={EUCLID.H + 1.1 * U} uid="lf-euclid" /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE CLOUD (cut C): soft billows under the landing, churning; density opts.cloud
// ===================================================================================================================
type Puff = { X: number; Z: number; R: number; dz: number; vx: number; ph: number; a: number };
const PUFF_X = 7 * U;
/** the billows' tops stay CLOUD.billows over the landing's top (the veil's top is higher in front of the edge, so the
 *  riser's lip is swallowed, but the billows reach only Euclid's ankles) */
const billowDrop = (Z: number, sink: number) => Math.max(0, cloudTopAt(Z, sink) - LANDING.H - CLOUD.billows);
/** the billows of the fog sea, each at a depth dz under the sea's top at its Z (it sinks with the top) */
export const PUFFS: Puff[] = (() => {
  const out: Puff[] = [];
  // the top layer under Euclid's feet: a bank of small billows (0.22-0.6 m) along the landing's edge, close together
  // round the centre line (the opening's narrow view), their tops at his ankles
  for (let i = 0; i < 110; i++) {
    const Z = lerp(LANDING.Z0 - 1.0 * U, LANDING.Z0 + 0.12 * U, hash01(i * 3.7 + 11));
    const R = (0.22 + 0.38 * Math.pow(hash01(i * 5.3 + 12), 1.3)) * U;
    const xs = hash01(i * 7.9 + 13) * 2 - 1;
    out.push({
      X: Math.sign(xs) * Math.pow(Math.abs(xs), 1.6) * 6 * U,
      Z,
      R,
      dz: 0.05 * U + 0.86 * R + 0.8 * U * Math.pow(hash01(i * 2.3 + 14), 2),
      vx: (0.5 + 0.9 * hash01(i * 4.7 + 15)) * (hash01(i * 8.9 + 16) > 0.45 ? 1 : -1),
      ph: hash01(i * 6.1 + 17) * 6.283,
      a: 0.6 + 0.4 * hash01(i * 9.7 + 18),
    });
  }
  // the sea's surface over the whole stair and in front of it (0.35-1.0 m billows), so wherever the top has sunk
  // to, the fog shows a billowing top (over a tread that rises above the top the billows sink into the stone: hidden)
  for (let i = 0; i < 230; i++) {
    const Z = lerp(-9 * U, LANDING.Z0, Math.pow(hash01(i * 3.1 + 2), 0.9));
    const R = (0.35 + 0.65 * Math.pow(hash01(i * 5.7 + 1), 1.2)) * U;
    const xs = hash01(i * 7.3 + 5) * 2 - 1;
    out.push({
      X: Math.sign(xs) * Math.pow(Math.abs(xs), 1.3) * PUFF_X,
      Z,
      R,
      dz: 0.05 * U + 0.86 * R + 1.0 * U * Math.pow(hash01(i * 2.9 + 9), 1.6),
      vx: (0.35 + 0.9 * hash01(i * 4.1 + 3)) * (hash01(i * 8.3) > 0.5 ? 1 : -1),
      ph: hash01(i * 6.7 + 4) * 6.283,
      a: 0.5 + 0.5 * hash01(i * 9.1 + 7),
    });
  }
  // (V2) the fog sea round and behind Euclid's feet over the landing (the opening's eye looks down onto it); deep
  // under the landing's top once the sea sinks (hidden in the stone)
  for (let i = 0; i < 70; i++) {
    const Z = lerp(LANDING.Z0 + 0.15 * U, LANDING.Z0 + 2.4 * U, hash01(i * 3.3 + 31));
    const R = (0.24 + 0.4 * Math.pow(hash01(i * 5.9 + 32), 1.3)) * U;
    const xs = hash01(i * 7.7 + 33) * 2 - 1;
    out.push({
      X: Math.sign(xs) * Math.pow(Math.abs(xs), 1.2) * 4.5 * U,
      Z,
      R,
      dz: 0.05 * U + 0.86 * R + 0.4 * U * Math.pow(hash01(i * 2.7 + 34), 2),
      vx: (0.5 + 0.9 * hash01(i * 4.3 + 35)) * (hash01(i * 8.7 + 36) > 0.5 ? 1 : -1),
      ph: hash01(i * 6.3 + 37) * 6.283,
      a: 0.55 + 0.45 * hash01(i * 9.3 + 38),
    });
  }
  return out;
})();
/** (V2) THE FOG SEA: while the cloud is dense and has not sunk, its surface runs out to the horizon in every
 *  direction (seen from an eye just over it, it fills the frame below the horizon row: a soft, milky band, lighter far
 *  off); it thins away into the air as the sea drains (sink 0.15 -> 2.2 m), leaving the local billows and the veil */
export const FOG_SEA = { s0: 0.15 * U, s1: 2.2 * U, soft: 46, deep: 260 };
const FogSea: React.FC<{ S: StairAir }> = ({ S }) => {
  const k = 1 - smoothstep(FOG_SEA.s0, FOG_SEA.s1, S.sink);
  const a = S.cloud * k;
  const top = LANDING.H + CLOUD.billows - S.sink;
  if (a < 0.005 || S.c.E <= top) return null;
  const hy = S.v.horizon;
  if (hy > 1960) return null;
  // the frame in 2D world units
  const cam = S.cam;
  const wx0 = cam.cx - 600 / cam.k;
  const ww = 1200 / cam.k;
  const wy = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const far = mixHex(rgbHex(S.v.airAtScreen(hy)), cloudColAt(top + 0.2 * U), 0.55);
  const mid = cloudColAt(top);
  const near = mixHex(cloudColAt(top - 0.4 * U), SHADE, 0.05);
  const y0 = hy - 4;
  const y1 = Math.max(hy + FOG_SEA.soft, 1980);
  const st = (sy: number) => c01((sy - y0) / (y1 - y0));
  return (
    <g>
      <defs>
        <linearGradient id="fog-sea" gradientUnits="userSpaceOnUse" x1="0" y1={wy(y0).toFixed(2)} x2="0" y2={wy(y1).toFixed(2)}>
          <stop offset="0" stopColor={far} stopOpacity={0} />
          <stop offset={st(hy + FOG_SEA.soft * 0.5).toFixed(3)} stopColor={far} stopOpacity={0.6 * a} />
          <stop offset={st(hy + FOG_SEA.soft).toFixed(3)} stopColor={far} stopOpacity={0.92 * a} />
          <stop offset={st(hy + FOG_SEA.deep).toFixed(3)} stopColor={mid} stopOpacity={a} />
          <stop offset="1" stopColor={near} stopOpacity={a} />
        </linearGradient>
      </defs>
      <rect x={wx0.toFixed(2)} y={wy(y0).toFixed(2)} width={ww.toFixed(2)} height={(wy(y1) - wy(y0)).toFixed(2)} fill="url(#fog-sea)" />
    </g>
  );
};
/** (V2) the opening's churn: the billows roll and swell (gone by f135, so C's end and D are unchanged) */
export const CHURN = { x: 0.22 * U, h: 0.1 * U, r: 0.14, f0: 100, f1: 135 };
const puffAt = (p: Puff, t: number, sink: number) => {
  const ch = 1 - smoothstep(CHURN.f0, CHURN.f1, t);
  let X = p.X + p.vx * t + ch * CHURN.x * Math.sin(t / 21 + p.ph * 2.3);
  const span = 2 * PUFF_X;
  X = ((((X + PUFF_X) % span) + span) % span) - PUFF_X;
  const edge = 1 - smoothstep(0.75, 1, Math.abs(X) / PUFF_X);
  const H = cloudTopAt(p.Z, sink) - sink - p.dz - billowDrop(p.Z, sink) + 0.1 * U * Math.sin(t / 37 + p.ph) + ch * CHURN.h * Math.sin(t / 15 + p.ph * 3.1);
  // a billow under the tread at its depth would be inside the stone: it fades as it goes in
  const st = stairTopAt(p.Z);
  const inStone = st === -Infinity ? 1 : smoothstep(st + 0.05 * p.R, st + 0.5 * p.R, H);
  return { X, H, R: p.R * (1 + 0.08 * Math.sin(t / 29 + p.ph * 1.7) + ch * CHURN.r * Math.sin(t / 13 + p.ph * 1.3)), edge: edge * inStone };
};
const PuffEl: React.FC<{ S: StairAir; p: Puff; i: number }> = ({ S, p, i }) => {
  const st = puffAt(p, S.t, S.sink);
  if (st.edge < 0.01 || !visibleZ(S, p.Z, st.R * 0.8)) return null;
  const c = S.q(st.X, st.H, p.Z);
  const rr = st.R * S.P.r(p.Z);
  // off frame: skip
  const sc = S.toScreen(c);
  const rs = rr * S.k * 1.4;
  if (sc[0] < -rs || sc[0] > 1080 + rs || sc[1] < -rs || sc[1] > 1920 + rs) return null;
  const lit = smoothstep(CLOUD.H1, LANDING.H, st.H);
  // a billow: a body (the cloud's colour a little under it) and a lit cap up and to the left
  const body = mixHex(cloudColAt(st.H - 0.5 * st.R), SHADE, 0.06);
  const cap = mixHex(cloudColAt(st.H + 0.5 * st.R), PAL.cream, 0.32 + 0.26 * lit);
  // a billow that would fill the frame reads as a flat veil: it thins out as it grows past ~520 px
  const big = 1 - smoothstep(520, 1100, rr * S.k);
  const a = S.cloud * p.a * st.edge * (1 - S.fog(p.Z)) * big;
  if (a < 0.01) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`pf${i}b`}>
          <stop offset="0" stopColor={body} stopOpacity={0.8 * a} />
          <stop offset="0.55" stopColor={body} stopOpacity={0.6 * a} />
          <stop offset="1" stopColor={body} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`pf${i}c`}>
          <stop offset="0" stopColor={cap} stopOpacity={0.7 * a} />
          <stop offset="0.5" stopColor={cap} stopOpacity={0.42 * a} />
          <stop offset="1" stopColor={cap} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rr * 1.35} ry={rr * 0.85} fill={`url(#pf${i}b)`} />
      <ellipse cx={c[0] - rr * 0.22} cy={c[1] - rr * 0.28} rx={rr * 0.95} ry={rr * 0.58} fill={`url(#pf${i}c)`} />
    </g>
  );
};

// ===================================================================================================================
// BEYOND THE LANDING: the lone columns, their scholars, the aqueduct and the Romans
// ===================================================================================================================
/** a fluted column standing out of the low air: the shaft (lit from the left), the capital, the scholar's band;
 *  `drop` lowers the whole column (the rise) */
const ColumnEl: React.FC<{ S: StairAir; col: ColumnDef; i: number; drop: number }> = ({ S, col, i, drop }) => {
  const { X, Z, R } = col;
  if (!visibleZ(S, Z, R * 2)) return null;
  const top = col.top - drop;
  const capTop = top;
  const abH = CAPITAL.abacusH;
  const echH = CAPITAL.echinusH;
  const shaftTop = capTop - abH - echH;
  const bottom = Math.min(-2 * U, shaftTop - 1);
  const r = S.P.r(Z);
  const xL = S.q(X - R, 0, Z)[0];
  const xR = S.q(X + R, 0, Z)[0];
  const yT = S.q(X, shaftTop, Z)[1];
  const yB = S.q(X, bottom, Z)[1];
  const mat = MARBLE;
  // the shaft's horizontal form light, then the medium by height as a vertical veil
  const tH = (hex: string, H: number) => S.tone(hex, Z, H);
  const midH = (shaftTop + Math.max(0, bottom)) / 2;
  const N = 7;
  const veil: [number, string][] = [];
  const veilA: number[] = [];
  for (let k = 0; k <= N; k++) {
    const H = lerp(shaftTop, bottom, k / N);
    veil.push([k / N, S.air(H)]);
    veilA.push(S.fogAmt(Z, H));
  }
  const uid = `col${i}`;
  const fl: string[] = [];
  for (let k = 0; k < 9; k++) {
    const a = ((-72 + (144 * k) / 8) * Math.PI) / 180;
    const x = (X + R * 0.97 * Math.sin(a) - S.c.X) * 0 + S.q(X + R * 0.97 * Math.sin(a), 0, Z)[0];
    fl.push(`M${n3(x)},${n3(yT + 2 * r)}L${n3(x)},${n3(yB)}`);
  }
  const lw = S.lw(1.0);
  const capW = R * CAPITAL.abacusW;
  // the capital: echinus (a flared drum) and the abacus slab
  const echD = (() => {
    const y0 = S.q(X, shaftTop, Z)[1];
    const y1 = S.q(X, shaftTop + echH, Z)[1];
    const a0 = S.q(X - R * 1.02, 0, Z)[0];
    const a1 = S.q(X + R * 1.02, 0, Z)[0];
    const b0 = S.q(X - capW * 0.92, 0, Z)[0];
    const b1 = S.q(X + capW * 0.92, 0, Z)[0];
    return `M${n3(a0)},${n3(y0)}Q${n3(b0)},${n3((y0 + y1) / 2 + (y0 - y1) * 0.1)} ${n3(b0)},${n3(y1)}L${n3(b1)},${n3(y1)}Q${n3(b1)},${n3((y0 + y1) / 2 + (y0 - y1) * 0.1)} ${n3(a1)},${n3(y0)}Z`;
  })();
  const abY0 = S.q(X, capTop, Z)[1];
  const abY1 = S.q(X, capTop - abH, Z)[1];
  const abX0 = S.q(X - capW, 0, Z)[0];
  const abX1 = S.q(X + capW, 0, Z)[0];
  const capHm = capTop - abH / 2;
  const bandOn = col.label && drop < col.top;
  const bandY0 = shaftTop - BAND.y0;
  const bandY1 = shaftTop - BAND.y1;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse" x1={n3(xL)} y1="0" x2={n3(xR)} y2="0">
          <stop offset="0" stopColor={tH(mat.mid, midH)} />
          <stop offset="0.24" stopColor={tH(mat.lit, midH)} />
          <stop offset="0.55" stopColor={tH(mixHex(mat.lit, mat.mid, 0.6), midH)} />
          <stop offset="0.86" stopColor={tH(mixHex(mat.dark, SHADE, 0.15), midH)} />
          <stop offset="1" stopColor={tH(mixHex(mat.mid, S.air(midH), 0.4), midH)} />
        </linearGradient>
        <linearGradient id={`${uid}-v`} gradientUnits="userSpaceOnUse" x1="0" y1={n3(yT)} x2="0" y2={n3(yB)}>
          {veil.map(([o, cc], k) => (
            <stop key={k} offset={o.toFixed(3)} stopColor={cc} stopOpacity={veilA[k].toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={n3(xL)} y={n3(yT)} width={n3(xR - xL)} height={n3(Math.max(0, yB - yT))} fill={`url(#${uid}-g)`} />
      <path d={fl.join("")} stroke={tH(mat.dark, midH)} strokeWidth={lw * 0.8} strokeOpacity={0.24} />
      {bandOn ? <path d={`M${n3(xL)},${n3(S.q(X, bandY0, Z)[1])}L${n3(xR)},${n3(S.q(X, bandY0, Z)[1])}M${n3(xL)},${n3(S.q(X, bandY1, Z)[1])}L${n3(xR)},${n3(S.q(X, bandY1, Z)[1])}`} stroke={tH(lineOf(mat), bandY0)} strokeWidth={lw * 0.8} strokeOpacity={0.5} /> : null}
      {bandOn ? <Carved S={S} text={col.label!} X={X} H={(bandY0 + bandY1) / 2 - 0.07 * U} Z={Z - R} size={0.17 * U} spacing={0.04} width={1.5 * R} /> : null}
      <path d={echD} fill={tH(mixHex(mat.lit, mat.mid, 0.4), shaftTop + echH / 2)} stroke={tH(lineOf(mat), capHm)} strokeWidth={lw} />
      <rect x={n3(abX0)} y={n3(abY0)} width={n3(abX1 - abX0)} height={n3(abY1 - abY0)} fill={tH(mat.mid, capHm)} stroke={tH(lineOf(mat), capHm)} strokeWidth={lw} />
      <path d={`M${n3(abX0)},${n3(abY0)}L${n3(abX1)},${n3(abY0)}`} stroke={PAL.cream} strokeWidth={lw * 1.2} strokeOpacity={0.5 * (1 - S.fogAmt(Z, capTop))} />
      <rect x={n3(xL)} y={n3(yT)} width={n3(xR - xL)} height={n3(Math.max(0, yB - yT))} fill={`url(#${uid}-v)`} />
    </g>
  );
};

/** the lone scholars' works as greekFolk tablet diagrams (unit square, y down): the sphere in the cylinder, the cone
 *  and its section */
const ell = (cx: number, cy: number, rx: number, ry: number, n = 28, rot = 0): P2[] =>
  Array.from({ length: n + 1 }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)] as P2;
  });
export const WORK_DIAGRAMS: Record<string, GF.DiagramSpec> = {
  sphereCylinder: {
    lines: [ell(0, 0, 0.62, 0.62), ell(0, -0.62, 0.62, 0.14), ell(0, 0.62, 0.62, 0.14).slice(0, 15), [[-0.62, -0.62], [-0.62, 0.62]], [[0.62, -0.62], [0.62, 0.62]], ell(0, 0, 0.62, 0.12).slice(0, 15)],
    fills: [ell(0, 0, 0.62, 0.62)],
  },
  cone: {
    lines: [[[-0.66, 0.6], [0, -0.78], [0.66, 0.6]], ell(0, 0.6, 0.66, 0.15).slice(0, 15), ell(0.02, 0.22, 0.4, 0.13, 28, -0.32)],
    fills: [ell(0.02, 0.22, 0.4, 0.13, 28, -0.32)],
  },
};
const COL_LOOK: Record<string, { kind: GF.GreekKind; variant: number }> = {
  archimedes: { kind: "scholar", variant: 5 },
  apollonius: { kind: "scholar", variant: 6 },
  ptolemy: { kind: "scholar", variant: 2 },
  diophantus: { kind: "diophantus", variant: 0 },
};
const ColumnScholar: React.FC<{ S: StairAir; col: ColumnDef; i: number; drop: number }> = ({ S, col, i, drop }) => {
  const { opts, t } = S;
  if (opts.hide?.includes(col.id)) return null;
  const H = col.top - drop;
  const X = col.X;
  const Z = col.Z;
  const own = opts.renderFigure?.(col.id, S, { X, H, Z });
  if (own !== undefined) return <g>{own}</g>;
  const glow = opts.glow?.[col.id] ?? 1;
  const look = COL_LOOK[col.id];
  const shadow = <Contact S={S} X={X} H={H} Z={Z} w={60} uid={`cs-${col.id}`} />;
  if (col.work === "arithmetica") {
    // Diophantus writes his Arithmetica (the reed along its lines)
    const def = GF.POSES.write(col.dir, t / 150 + 0.1);
    const pose = (opts.poseOf?.(col.id, t, def) as GF.GPose | undefined) ?? def;
    return (
      <g>
        {shadow}
        <GFig S={S} X={X} H={H} Z={Z} pose={pose} kind="diophantus" variant={0} held={GF.DIOPHANTUS_HELD} uid={`fg-${col.id}`} />
      </g>
    );
  }
  if (col.work === "astrolabe") {
    // Ptolemy holds his astrolabe up by its ring (it hangs plumb from his raised near hand)
    const q0 = GF.POSES.gesture(col.dir, 1);
    const def = GF.idle({ ...q0, pitch: q0.pitch - 8 }, t, 21 + i * 2.3);
    const pose = (opts.poseOf?.(col.id, t, def) as GF.GPose | undefined) ?? def;
    const wk = { X: X + col.dir * 0.42 * U, H: H + 1.15 * U, Z: Z - 0.3 * U };
    const p = S.q(wk.X, wk.H, wk.Z);
    const r = S.P.r(wk.Z);
    const ring: P2 = [p[0], p[1] - 0.29 * U * r];
    const near: "L" | "R" = col.dir > 0 ? "L" : "R";
    return (
      <g>
        {shadow}
        <GFig S={S} X={X} H={H} Z={Z} pose={pose} kind={look.kind} variant={look.variant} grip={{ [near]: ring }} uid={`fg-${col.id}`} />
        <SmallWork S={S} kind="astrolabe" X={wk.X} H={wk.H} Z={wk.Z} glow={glow} uid={`wk-${col.id}`} />
      </g>
    );
  }
  const def = GF.idle(GF.POSES.holdTablet(col.dir), t, 21 + i * 2.3);
  const pose = (opts.poseOf?.(col.id, t, def) as GF.GPose | undefined) ?? def;
  return (
    <g>
      {shadow}
      <GFig S={S} X={X} H={H} Z={Z} pose={pose} kind={look.kind} variant={look.variant} held={{ two: "tablet", diagram: WORK_DIAGRAMS[col.work] }} uid={`fg-${col.id}`} />
    </g>
  );
};

/** the aqueduct: two tiers of arches in warm Roman stone, front-facing, on its terrace in the haze */
const AqueductEl: React.FC<{ S: StairAir }> = ({ S }) => {
  const a = AQUEDUCT;
  if (!visibleZ(S, a.Z)) return null;
  const stone: Mat = { lit: "#A89A82", mid: "#857A66", dark: "#4A4236" };
  const Hm = a.H0 + a.tier1 / 2;
  const Z = a.Z;
  const q = (X: number, H: number) => S.q(X, H, Z);
  // the wall with arched openings (evenodd), tier by tier
  const tier = (h0: number, h1: number, span: number, pier: number) => {
    let d = polyD([q(a.X0, h1), q(a.X1, h1), q(a.X1, h0), q(a.X0, h0)]);
    const rr = (span - pier) / 2;
    for (let x = a.X0 + pier; x + span - pier <= a.X1 - pier * 0.5; x += span) {
      const cx = x + rr;
      const spring = h1 - rr - 0.5 * U;
      const pts: P2[] = [q(x, h0 - 0.01)];
      pts.push(q(x, spring));
      for (let k = 0; k <= 12; k++) {
        const ang = Math.PI - (Math.PI * k) / 12;
        pts.push(q(cx + rr * Math.cos(ang), spring + rr * Math.sin(ang)));
      }
      pts.push(q(x + 2 * rr, h0 - 0.01));
      d += polyD(pts);
    }
    return d;
  };
  const t1 = tier(a.H0, a.H0 + a.tier1, a.span, a.pier);
  const t2 = tier(a.H0 + a.tier1, a.H0 + a.tier1 + a.tier2, a.span / 2, a.pier * 0.6);
  const chH0 = a.H0 + a.tier1 + a.tier2;
  const ch = polyD([q(a.X0, chH0 + a.channel), q(a.X1, chH0 + a.channel), q(a.X1, chH0), q(a.X0, chH0)]);
  return (
    <g>
      <path d={t1} fill={S.tone(stone.mid, Z, Hm)} fillRule="evenodd" />
      <path d={t2} fill={S.tone(mixHex(stone.mid, stone.lit, 0.3), Z, chH0 - a.tier2 / 2)} fillRule="evenodd" />
      <path d={ch} fill={S.tone(stone.lit, Z, chH0 + a.channel / 2)} />
      <path d={`M${Pt(q(a.X0, chH0 + a.channel))}L${Pt(q(a.X1, chH0 + a.channel))}`} stroke={PAL.cream} strokeWidth={S.lw(1)} strokeOpacity={0.35 * (1 - S.fogAmt(Z, chH0))} />
    </g>
  );
};
const TerraceEl: React.FC<{ S: StairAir }> = ({ S }) => {
  const T = TERRACE;
  return <Block S={S} X0={T.X0} X1={T.X1} H0={BASE_H} H1={T.H} Z0={T.Z0} Z1={T.Z1} mat={{ lit: "#A08C69", mid: "#7A6A50", dark: "#3A3128" }} uid="terrace" nosing={0.4} />;
};
const RomanFig: React.FC<{ S: StairAir; r: (typeof ROMANS)[number]; i: number }> = ({ S, r, i }) => {
  if (S.opts.hide?.includes(r.id)) return null;
  const own = S.opts.renderFigure?.(r.id, S, { X: r.X, H: TERRACE.H, Z: r.Z });
  if (own !== undefined) return <g>{own}</g>;
  const def = RomeFolk.idle(RomeFolk.POSES.stand(r.dir), S.t, 31 + i);
  const pose = S.opts.poseOf?.(r.id, S.t, def) ?? def;
  return (
    <g>
      <Contact S={S} X={r.X} H={TERRACE.H} Z={r.Z} uid={`cs-${r.id}`} />
      <Fig S={S} id={r.id} X={r.X} H={TERRACE.H} Z={r.Z} pose={pose} kind={r.kind} variant={r.variant} uid={`fg-${r.id}`} />
    </g>
  );
};

// ===================================================================================================================
// THE NEVER-BUILT STAIR (cut D): dashed orange, world-anchored dashes, drawn by a moving tip
// ===================================================================================================================
export const DASH = { on: 0.2 * U, off: 0.13 * U };
export const NeverBuiltStair: React.FC<{ S: StairAir; progress: number; tip?: boolean; uid?: string }> = ({ S, progress, tip = true, uid = "nb" }) => {
  const pr = c01(progress);
  if (pr <= 0) return null;
  const segs: React.ReactNode[] = [];
  const tips: P2[] = [];
  const period = DASH.on + DASH.off;
  NEVER_BUILT.lines.forEach((ln, li) => {
    const L = ln.len[ln.len.length - 1];
    const upto = pr * NEVER_BUILT.total;
    const end = Math.min(L, upto);
    let d = "";
    let cnt = 0;
    for (let s0 = 0; s0 < end; s0 += period) {
      const s1 = Math.min(end, s0 + DASH.on);
      const at = (s: number): V3 => {
        let k = 1;
        while (k < ln.len.length - 1 && ln.len[k] < s) k++;
        const a = ln.pts[k - 1];
        const b = ln.pts[k];
        const u = (s - ln.len[k - 1]) / Math.max(1e-6, ln.len[k] - ln.len[k - 1]);
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
      };
      // a dash may round a corner: sample its corners too
      const pts: V3[] = [at(s0)];
      for (let k = 1; k < ln.len.length - 1; k++) if (ln.len[k] > s0 && ln.len[k] < s1) pts.push(ln.pts[k]);
      pts.push(at(s1));
      if (pts.some((p) => !visibleZ(S, p[2]))) continue;
      d += `M${pts.map((p) => Pt(S.q(p[0], p[1], p[2]))).join("L")}`;
      cnt++;
    }
    if (cnt) {
      const zm = ln.pts[Math.floor(ln.pts.length / 2)][2];
      const hm = ln.pts[Math.floor(ln.pts.length / 2)][1];
      segs.push(<path key={li} d={d} fill="none" stroke={S.toneO(ACCENT, zm, hm)} strokeWidth={Math.max(1.3 / S.k, 0.03 * U * S.P.r(zm))} strokeLinecap="round" strokeLinejoin="round" />);
    }
    if (upto < L && tip) {
      let k = 1;
      while (k < ln.len.length - 1 && ln.len[k] < upto) k++;
      const a = ln.pts[k - 1];
      const b = ln.pts[k];
      const u = (upto - ln.len[k - 1]) / Math.max(1e-6, ln.len[k] - ln.len[k - 1]);
      const p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
      if (visibleZ(S, p[2])) tips.push(S.q(p[0], p[1], p[2]));
    }
  });
  const tr = 0.16 * U * S.P.r(NEVER_BUILT.z0);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-tip`}>
          <stop offset="0" stopColor={PAL.orangeHot} stopOpacity={0.95} />
          <stop offset="0.35" stopColor={PAL.orange} stopOpacity={0.55} />
          <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      {segs}
      {tips.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={tr} fill={`url(#${uid}-tip)`} />
      ))}
    </g>
  );
};

// ===================================================================================================================
// THE WORLD in painter's order (far -> near by depth; the stair's blocks keyed by their back face so a figure on a
// tread draws after its block and before the block in front)
// ===================================================================================================================
const JOINTS = [-1.1 * U, 0.7 * U, 1.6 * U, -0.3 * U, 1.2 * U, -1.6 * U];
/** the light the landing stands up in: a soft cream glow in the air behind and above Euclid (world space) */
export const LANDING_LIGHT = { X: -1.5 * U, H: 13 * U, Z: 16 * U, R: 7 * U, a: 0.16 };
const LandingLight: React.FC<{ S: StairAir }> = ({ S }) => {
  const L = LANDING_LIGHT;
  if (!visibleZ(S, L.Z)) return null;
  const c = S.q(L.X, L.H, L.Z);
  const r = L.R * S.P.r(L.Z);
  return (
    <g>
      <defs>
        <radialGradient id="landing-light">
          <stop offset="0" stopColor={PAL.cream} stopOpacity={L.a} />
          <stop offset="0.45" stopColor={PAL.cream} stopOpacity={L.a * 0.45} />
          <stop offset="1" stopColor={PAL.cream} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={r} ry={r * 1.15} fill="url(#landing-light)" />
    </g>
  );
};
export const GreekStairWorld: React.FC<{ S: StairAir }> = ({ S }) => {
  const { opts } = S;
  const hide = new Set(opts.hide ?? []);
  const items: { z: number; el: React.ReactNode }[] = [];
  const add = (z: number, el: React.ReactNode) => items.push({ z, el });
  if (!hide.has("light")) add(1e9, <LandingLight key="ll" S={S} />);
  // beyond the landing
  if (!hide.has("aqueduct")) {
    add(AQUEDUCT.Z + 1, <AqueductEl key="aq" S={S} />);
    add(TERRACE.Z1, <TerraceEl key="ter" S={S} />);
    ROMANS.forEach((r, i) => add(r.Z, <RomanFig key={r.id} S={S} r={r} i={i} />));
  }
  if (!hide.has("columns"))
    COLUMNS.forEach((col, i) => {
      const drop = riseOffset(i, opts.rise?.[i] ?? 1);
      add(col.Z + col.R, <ColumnEl key={col.id} S={S} col={col} i={i} drop={drop} />);
      add(col.Z - col.R * 0.2, <ColumnScholar key={`s-${col.id}`} S={S} col={col} i={i} drop={drop} />);
    });
  if ((opts.dashed ?? 0) > 0) add(LANDING.Z1 + 1, <NeverBuiltStair key="nb" S={S} progress={opts.dashed ?? 0} />);
  // the stair
  if (!hide.has("stair")) {
    const eu = <Carved S={S} text="EUCLID" X={0} H={LANDING.H - 0.6 * RISE} Z={LANDING.Z0 - 0.5} size={0.3 * U} />;
    add(LANDING.Z1, <Block key="landing" S={S} X0={LANDING.X0} X1={LANDING.X1} H0={BASE_H} H1={LANDING.H} Z0={LANDING.Z0} Z1={LANDING.Z1} uid="bl6" joints={[-1.75 * U, 1.75 * U]} carve={eu} drop={RISE + 0.15 * U} />);
    for (let i = N_STEPS; i >= 1; i--) {
      add(STEP_Z0(i) + TREAD, <Block key={`b${i}`} S={S} X0={-HALF_W(i)} X1={HALF_W(i)} H0={BASE_H} H1={LEVEL_H(i)} Z0={STEP_Z0(i)} Z1={STEP_Z0(i) + TREAD} uid={`bl${i}`} mat={i % 2 ? MARBLE : MARBLE_WARM} joints={[JOINTS[i % 6], JOINTS[(i + 3) % 6]]} drop={i > 1 ? RISE + 0.15 * U : undefined} />);
    }
  }
  GENERATIONS.forEach((g, i) => add(g.Z, <GenerationFig key={g.id} S={S} g={g} i={i} />));
  add(EUCLID.Z, <EuclidFig key="euclid" S={S} />);
  // the travelling light of the questions (cut C): a soft warm glow riding up the chain of tablets
  if ((opts.sweepAt ?? -1) >= 0) {
    const sp = sweepPoint(opts.sweepAt ?? 0);
    add(sp[2] - 1, <SweepGlow key="sw" S={S} at={sp} />);
  }
  if (!hide.has("cloud") && S.cloud > 0.002) PUFFS.forEach((p, i) => add(p.Z, <PuffEl key={`pf${i}`} S={S} p={p} i={i} />));
  // the fog sea's far surface: behind the stair and everything on it, in front of the far world
  if (!hide.has("cloud") && S.cloud > 0.002) add(LANDING.Z1 + 0.5, <FogSea key="sea" S={S} />);
  items.sort((a, b) => b.z - a.z);
  return <g>{items.map((it) => it.el)}</g>;
};

/** the chain of tablets and the scroll as one path (for the travelling light): s 0 = Thales's tablet, 1 = the scroll */
export const CHAIN: V3[] = [...GENERATIONS.map((g) => { const t = tabletAt(g); return [t.X, t.H, t.Z] as V3; }), [scrollAt().X, scrollAt().H, scrollAt().Z]];
export const sweepPoint = (s: number): V3 => {
  const n = CHAIN.length - 1;
  const u = c01(s) * n;
  const k = Math.min(n - 1, Math.floor(u));
  const f = u - k;
  const a = CHAIN[k];
  const b = CHAIN[k + 1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
};
const SweepGlow: React.FC<{ S: StairAir; at: V3 }> = ({ S, at }) => {
  if (!visibleZ(S, at[2])) return null;
  const p = S.q(at[0], at[1], at[2]);
  const r = 0.24 * U * S.P.r(at[2]);
  return (
    <g>
      <defs>
        <radialGradient id="sweep-g">
          <stop offset="0" stopColor={PAL.orangeHot} stopOpacity={0.62} />
          <stop offset="0.25" stopColor={PAL.orange} stopOpacity={0.32} />
          <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={p[0]} cy={p[1]} rx={r} ry={r * 0.8} fill="url(#sweep-g)" />
    </g>
  );
};

/** the stage: the medium (AirStage on the camera), the world (or children) inside the camera's WorldSvg */
export const StairStage: React.FC<{ S: StairAir; bloom?: number; children?: React.ReactNode; front?: React.ReactNode }> = ({ S, bloom = 0.22, children, front }) => (
  <AirStage v={S.v} bloom={bloom} front={front}>
    <WorldSvg cam={S.cam}>{children ?? <GreekStairWorld S={S} />}</WorldSvg>
  </AirStage>
);

// ===================================================================================================================
// CUT C (ProductOfGenerations): the camera, the cloud, the glow and the end state (D opens on it)
// ===================================================================================================================
export const C_DURATION = 229;
/** (V1, the reviewed end) C's first camera: keys of the eye (X, height E), its distance Dz in front of Euclid, focal F, and the screen row headY of
 *  Euclid's head top (the horizon row follows from it). Close and low on Euclid in the cloud; a creep in, already
 *  moving at f0 and easing out by f66; the one crane down and pull back (f66 -> f214, one velocity lobe LOBE:
 *  under way by f75, its peak ~f121, decelerating into f205-214; Dz and F in log space, so the perceived pull is even) to the foot;
 *  over its tail a slight push in (C_CREEP) so the picture never stops dead. Through the kit's damped follow. */
export type CKey = { f: number; X: number; E: number; Dz: number; F: number; headY: number };
export const C_KEYS: CKey[] = [
  { f: 0, X: 0, E: LANDING.H - 0.14 * U, Dz: 8.9 * U, F: 6000, headY: 330 },
  { f: 66, X: 0.06 * U, E: LANDING.H - 0.1 * U, Dz: 8.45 * U, F: 6000, headY: 322 },
  { f: 214, X: 0, E: 6.0 * U, Dz: EUCLID.Z + 20 * U, F: 3744, headY: 311 },
];
/** Euclid's head top (for the framing) */
export const EUCLID_HEAD_H = EUCLID.H + 312;
/** the living creep over the end: Dz shrinks this fraction from ~f196 on (and on into D) */
export const C_CREEP = { f0: 196, f1: 262, dz: 0.012 };
/** the big move's progress: one velocity lobe v ~ t^1.2 (1 - t)^2 (under way soon after f66 on "He's very much",
 *  its peak ~f121, a long deceleration into f205-214) */
const LOBE = (() => {
  const N = 400;
  const acc = [0];
  for (let i = 1; i <= N; i++) {
    const t = (i - 0.5) / N;
    acc.push(acc[i - 1] + Math.pow(t, 1.2) * Math.pow(1 - t, 2));
  }
  return acc.map((v) => v / acc[N]);
})();
const smoother = (t: number) => {
  const u = c01(t) * (LOBE.length - 1);
  const i = Math.min(LOBE.length - 2, Math.floor(u));
  return lerp(LOBE[i], LOBE[i + 1], u - i);
};
const C_PATH_V1: StairCam[] = (() => {
  const [K0, K1, K2] = C_KEYS;
  const ch = (g: (k: CKey) => number) => (f: number) => {
    // the creep is already moving at f0 (continued linearly before it)
    if (f < 0) return g(K0) + (g(K1) - g(K0)) * ((2 * f) / K1.f);
    if (f < K1.f) return g(K0) + (g(K1) - g(K0)) * (1 - Math.pow(1 - c01(f / K1.f), 2));
    return g(K1) + (g(K2) - g(K1)) * smoother((f - K1.f) / (K2.f - K1.f));
  };
  const creep = (f: number) => Math.log(1 - C_CREEP.dz * smoothstep(C_CREEP.f0, C_CREEP.f1, f));
  const chans = [ch((k) => k.X), ch((k) => k.E), (f: number) => ch((k) => Math.log(k.Dz))(f) + creep(f), ch((k) => Math.log(k.F)), ch((k) => k.headY)];
  const target = (f: number) => chans.map((c) => c(f));
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = s.map(() => 0);
  const out: StairCam[] = [];
  for (let f = -PRE + 1; f <= C_DURATION + 40; f++) {
    const tg = target(Math.min(f + LEAD, C_DURATION + 40));
    v = v.map((vi, i) => vi + (tg[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) {
      const [X, E, lnD, lnF, headY] = s;
      const Dz = Math.exp(lnD);
      const F = Math.exp(lnF);
      out.push({ X, E, Zc: EUCLID.Z - Dz, F, hy: headY + (F * (EUCLID_HEAD_H - E)) / Dz });
    }
  }
  return out;
})();
const cameraV1 = (f: number): StairCam => {
  const i = Math.max(0, Math.min(C_PATH_V1.length - 2, Math.floor(f)));
  return camLerp(C_PATH_V1[i], C_PATH_V1[i + 1], c01(f - i));
};
/** the motes' and shafts' rest camera (parallax reference): V1's f0 eye, kept so C_END's frame is unchanged */
export const C_REST = cameraV1(0);
const craneV1 = (f: number) => c01((C_REST.E - cameraV1(f).E) / (C_REST.E - cameraV1(C_DURATION - 1).E));
/** (V1) the fog's top rode ~CLOUD_C.above px over the frame's bottom edge at the stair's front; it ends at Thales's
 *  feet (CLOUD_C.endTop). C's tail (from C_JOIN) keeps it */
export const CLOUD_C = { above: 70, endTop: 2.0 * U };
const bottomHeightV1 = (f: number) => {
  const c = cameraV1(f);
  const Zref = lerp(LANDING.Z0, 0, craneV1(f));
  return c.E - ((1920 - CLOUD_C.above - c.hy) * (Zref - c.Zc)) / c.F;
};
const H0_V1 = bottomHeightV1(0);
const GAIN_V1 = (LANDING.H + CLOUD.billows - CLOUD_C.endTop) / (H0_V1 - bottomHeightV1(C_DURATION - 1));
const cloudSinkV1 = (f: number) => Math.max(0, (H0_V1 - bottomHeightV1(f)) * GAIN_V1);

// ---- V2 (director's review): ONE continuous pull-back from f0 --------------------------------------------------
/** the opening, and the frame where the new path joins V1's (C2: value, velocity and acceleration match), so C's
 *  tail and C_END are exactly V1's. Euclid's screen height px (= F * 312 / Dz) falls from 1.5x V1's f0 on one rising
 *  velocity (no dwell) into the main lobe and V1's deceleration; the eye sinks from his waist to just over his feet
 *  by "towering" (f45), holds there over the fog sea while the pull-back goes on, then cranes down with the drain
 *  (from ~f118, when Eudoxus is wholly in frame); headY eases from 420 (his face filling the frame) to ~328 by f40. */
export const C_OPEN = { join: 176, px0: 1773, vz0: 0.0095, az0: 0.00008, F0: 6000, hy0: 470, hyv0: 4, hyF: 40, hy1: 328, E0: 10.5 * U, ev0: 0.012 * U, eHoldF: 45, E1: 10.2 * U, eDropF: 116, sinkF: 117 };
export const C_JOIN = C_OPEN.join;
/** a quintic Hermite on [0, T] from (p0, v0, a0) to (p1, v1, a1), per frame */
const quintic = (T: number, p0: number, v0: number, a0: number, p1: number, v1: number, a1: number) => {
  const [V0, A0, V1, A1] = [v0 * T, a0 * T * T, v1 * T, a1 * T * T];
  return (t: number) => {
    const x = c01(t / T);
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x3 * x;
    const x5 = x4 * x;
    return (1 - 10 * x3 + 15 * x4 - 6 * x5) * p0 + (x - 6 * x3 + 8 * x4 - 3 * x5) * V0 + (0.5 * x2 - 1.5 * x3 + 1.5 * x4 - 0.5 * x5) * A0 + (10 * x3 - 15 * x4 + 6 * x5) * p1 + (-4 * x3 + 7 * x4 - 3 * x5) * V1 + (0.5 * x3 - x4 + 0.5 * x5) * A1;
  };
};
/** the derived channels of a camera: ln Euclid px, ln F, E, headY, X */
const chansOf = (c: StairCam) => {
  const Dz = EUCLID.Z - c.Zc;
  return [Math.log((c.F * 312) / Dz), Math.log(c.F), c.E, c.hy - (c.F * (EUCLID_HEAD_H - c.E)) / Dz, c.X];
};
const C_PATH: StairCam[] = (() => {
  const o = C_OPEN;
  const J = o.join;
  const at = (f: number) => chansOf(C_PATH_V1[f]);
  const [a, b, c] = [at(J - 1), at(J), at(J + 1)];
  const jv = (i: number) => (c[i] - a[i]) / 2;
  const ja = (i: number) => c[i] - 2 * b[i] + a[i];
  const lpx = quintic(J, Math.log(o.px0), -o.vz0, -o.az0, b[0], jv(0), ja(0));
  const lF = quintic(J, Math.log(o.F0), 0, 0, b[1], jv(1), ja(1));
  const E0 = quintic(o.eHoldF, o.E0, -o.ev0, 0, o.E1, 0, 0);
  const E2 = quintic(J - o.eDropF, o.E1, 0, 0, b[2], jv(2), ja(2));
  const H0 = quintic(o.hyF, o.hy0, -o.hyv0, 0, o.hy1, 0, 0);
  const H2 = quintic(J - o.hyF, o.hy1, 0, 0, b[3], jv(3), ja(3));
  const X = quintic(J, 0, 0, 0, b[4], jv(4), ja(4));
  const out: StairCam[] = [];
  for (let f = 0; f <= C_DURATION + 40; f++) {
    if (f >= J) {
      out.push(C_PATH_V1[f]);
      continue;
    }
    const px = Math.exp(lpx(f));
    const F = Math.exp(lF(f));
    const E = f < o.eHoldF ? E0(f) : f < o.eDropF ? o.E1 : E2(f - o.eDropF);
    const headY = f < o.hyF ? H0(f) : H2(f - o.hyF);
    const Dz = (F * 312) / px;
    out.push({ X: X(f), E, Zc: EUCLID.Z - Dz, F, hy: headY + (F * (EUCLID_HEAD_H - E)) / Dz });
  }
  return out;
})();
/** C's camera at frame f (fractional frames interpolate) */
export const cameraC = (f: number): StairCam => {
  const i = Math.max(0, Math.min(C_PATH.length - 2, Math.floor(f)));
  return camLerp(C_PATH[i], C_PATH[i + 1], c01(f - i));
};
/** (STAIR_READY's shape) C's camera as StairCams at its key frames */
export const C_CAM_KEYS: ({ f: number } & StairCam)[] = [0, 45, 66, C_OPEN.eDropF, C_JOIN, 214, C_DURATION - 1].map((f) => ({ f, ...cameraC(f) }));
/** the big move's progress (the eye's height travelled, 0..1) */
export const craneC = (f: number) => c01((cameraC(0).E - cameraC(f).E) / (cameraC(0).E - cameraC(C_DURATION - 1).E));
/** the fog sea holds at Euclid's feet until Eudoxus is wholly in frame (~f117), then drains down the stair (a quintic
 *  into V1's sink at C_JOIN, C2), so every generation comes out of it whole, never as a sliver at a frame edge */
const SINK_V2 = (() => {
  const J = C_JOIN;
  const [a, b, c] = [cloudSinkV1(J - 1), cloudSinkV1(J), cloudSinkV1(J + 1)];
  return quintic(J - C_OPEN.sinkF, 0, 0, 0, b, (c - a) / 2, c - 2 * b + a);
})();
export const cloudSinkC = (f: number) => (f >= C_JOIN ? cloudSinkV1(f) : f < C_OPEN.sinkF ? 0 : SINK_V2(f - C_OPEN.sinkF));
export const cloudC = (f: number) => 1 + 0 * f;
/** the light of the questions runs up the chain: s 0 (Thales's tablet) at f144 -> 1 (Euclid's scroll) at f185 */
export const SWEEP = { f0: 144, f1: 185 };
export const sweepC = (f: number) => (f < SWEEP.f0 - 2 ? -1 : smoothstep(SWEEP.f0, SWEEP.f1, f));
const flareAt = (s: number, si: number) => Math.exp(-Math.pow((s - si) / 0.075, 2));
/** the steady glow (each tablet a touch warmer once the light has passed; Euclid's scroll brighter once it arrives) */
export const glowC = (f: number): Record<string, number> => {
  const s = sweepC(f);
  const out: Record<string, number> = {};
  GENERATIONS.forEach((g, i) => {
    // (the passing light's faint tail below flareC's cut stays here, as in V1, so C_END is unchanged)
    const fl = flareAt(s, i / (CHAIN.length - 1));
    out[g.id] = s < 0 ? 1 : 1 + 0.12 * smoothstep(i / 5, i / 5 + 0.1, s) + (fl < 0.01 ? fl : 0);
  });
  out.euclid = s < 0 ? 1.05 : 1.05 + 0.5 * smoothstep(0.86, 1, s);
  return out;
};
/** the passing light (0..1): each held diagram's own lines brighten as the light reaches it, with a tight halo */
export const flareC = (f: number): Record<string, number> => {
  const s = sweepC(f);
  const out: Record<string, number> = {};
  const cut = (v: number) => (v < 0.01 ? 0 : v);
  GENERATIONS.forEach((g, i) => {
    out[g.id] = s < 0 ? 0 : cut(flareAt(s, i / (CHAIN.length - 1)));
  });
  out.euclid = s < 0 ? 0 : cut(flareAt(s, 1) * (s < 1 ? 1 : 0));
  return out;
};
export const optsC = (f: number): WorldOpts => ({ cloud: cloudC(f), cloudSink: cloudSinkC(f), glow: glowC(f), flare: flareC(f), sweepAt: sweepC(f) > 0 && sweepC(f) < 1 ? sweepC(f) : -1 });
/** the exact state of C's last frame (f228): D opens on it (assert it at module load) */
export const C_END = { f: C_DURATION - 1, t: C_DURATION - 1, cam: cameraC(C_DURATION - 1), cloud: cloudC(C_DURATION - 1), cloudSink: cloudSinkC(C_DURATION - 1), glow: glowC(C_DURATION - 1), rest: C_REST, opts: optsC(C_DURATION - 1) };
