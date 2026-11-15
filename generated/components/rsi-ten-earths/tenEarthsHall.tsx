// ---------------------------------------------------------------------------
// tenEarthsHall — THE DATA-CENTER HALL, the shared world module of rsi-ten-earths (brief W2; COMMON.md). Dwarkesh 3D
// (styles/dwarkesh-3d.md) on the kit kits/dwarkesh-3d/dwarkesh3d: every part is a pure, frame-driven component drawn
// air-lit on the londonDepth one-point perspective and fogged by its own depth through the cut's AirWorld `A`.
// Read-only for cut builders (additions through the director; changes after HALL_READY.md keep the old names and are
// logged in animation_source/notes/SHARED_CHANGES.md). Probe: tenEarthsHallProbe.tsx (src/Root.TenEarthsHallProbe.tsx).
//
// UNITS: the cast's. U = 178 units per metre (a man ~312 = 1.75 m; covidFolk / the Genius). X across, Y height (the
//   floor is Y = 0, up is -Y), Z depth behind the front plane (toward the camera is -Z). Draw inside the cut's
//   <WorldSvg cam> (world px of the front plane); every component takes the cut's AirWorld A (= airWorldOf(...)).
//
// COLOUR RULE (COMMON.md): nothing in this file is orange. Racks are slate iron (MAT.iron) with CREAM status lights;
//   walls oatmeal, floors and roof grey-umber, the chair a dusty teal, the monitor glow cream. The orange is the
//   Genius's alone (tenEarthsGenius.tsx), drawn by the cut among these parts.
//
// ---- THE RACK --------------------------------------------------------------------------------------------------
//   RACK = { w: 0.6 m = 106.8, h: 2.0 m = 356, d: 1.0 m = 178 }  (units). A rack is placed by its FRONT face: X = the
//   centre across, Z = the front face's depth; it stands on the floor and always faces the camera (-Z). Its front: a
//   slate frame (rails, a top cap with a thin CREAM status bar, a plinth), an open 42U bay of stacked servers (1U /
//   2U servers with ears, faint vent slits and drive bays, 4U storage with bay lights, a top-of-rack switch with port
//   lights, blank panels), small CREAM status lights; the body air-lit (top and left side lit, front mid, right side
//   dark, a soft cream rim on the top-front and left edges, thin outlines in a darker slate).
//   RackSpec = { X, Z, seed, power?, relight?, row?, col?, id? }
//     seed      the layout (seed % 16 picks one of 16 server stacks) and the twinkle phase (the whole seed)
//     power     0..1 (default 1). 0 = DARK (freed): its lights off and its front a step darker toward the air (a
//               veil of the air's dark tone, ~45 %, fading with distance). A change is a quick TOP-TO-BOTTOM WAVE:
//               the veil and the lights' cut-off travel down the front together, never a fade of the body.
//     relight   which wave: false (default) = going dark (the dark region grows from the top: lit = the bottom
//               `power` of the front); true = lighting up again (the lit region grows from the top: lit = the top
//               `power`). At power 0 or 1 the two are identical. powerWave(frame, f0, "off" | "on", dur = 8)
//               -> { power, relight } is the house wave (8 frames ~ 1/3 s at 23.976).
//   TWINKLE: each light has its own slow blink (period 50-200 frames, 2-5 frames dim, ~20 % steady at half), seeded
//     from the layout and shifted by the rack's seed: deterministic, seek-safe, never a strobe. The status bar and the
//     tiny-LOD light lines do not twinkle.
//   LOD by the rack's on-screen height hp = RACK.h * P.r(Z) * k (per row, automatic; `lod` forces one):
//     hero  hp >= 150 px   every part above (the front drawn in local units under one translate+scale: a front face
//                          is parallel to the image plane in one-point perspective), light glows
//     mid   60 <= hp < 150 the bay, server faces, the first light column (thinned to >= 2.6 px spacing, >= 1.5 x
//                          1.2 px), the status bar (>= 1.2 px)
//     tiny  hp < 60        a box, the status bar and ONE vertical light line (>= 1.2 px): reads down to ~12 px tall
//   <Rack A X Z frame uid seed? power? relight? />                one rack (a RackField of one)
//   <RackField A racks frame uid extras? lod? shadow? cull? />   many racks: grouped into rows by Z, rows drawn back
//     to front, abutting racks merged into runs (one body per run, seams between racks), runs drawn outside-in toward
//     the vanishing point, racks off screen culled. extras = [{ Z, node }]: anything standing among the rows (a
//     Genius in an aisle) drawn in painter's order: a node at Z goes after every row whose front is behind it (> Z).
//     shadow 0..1: the soft contact band at each run's foot (default 1).
//   COST (measured, probe Hall243Move: 243 racks + HallInterior + floor, a camera creep and a power wave, 1080x1920,
//     --concurrency=4): 72 frames in ~8 s wall incl. encode = ~59 ms/frame wall (~0.24 s per frame per tab; 4 frames
//     took 4 s, mostly startup). No bake needed at 243; at 1,000+ racks the far rows fall to the tiny LOD by size.
//
// ---- LAYOUTS (RackSpec[]; X centre, Z front face; row 0 = the front row, col 0 = the left) -------------------------
//   rackGrid({ cols, rows, x?, z?, aisle?, colGap?, rowGap?, seed0?, pitch? })   n x m racks: racks abut along X
//     inside a row (pitch = RACK.w; a larger pitch spaces them, e.g. 1.0 m = 0.4 m gaps) with extra gaps every
//     colGap.every racks; rows recede in Z at pitch RACK.d + aisle (an extra rowGap.gap every
//     rowGap.every rows); centred on x, front row at z; id = row * cols + col.
//   GRID_243    THE CUT-3 HALL: 27 across x 9 deep = 3 x 3 blocks of 9 x 3 (a 1.2 m cross aisle between blocks, a
//               1.2 m aisle between rows, +0.6 m between block rows). Footprint X -1655..1655, Z 0..3524 (18.6 x
//               19.8 m). GROWTH_243 = the x3 steps as id lists, each a superset of the last, centred on the hero rack
//               HERO_243 (front row, col 13): [1, 3 (3 across), 9 (3 x 3), 27 (9 x 3 = the central block), 81 (9 x 9),
//               243 (27 x 9)].
//   BLOCK_27    THE CUTS 6-7 BLOCK: 9 across at a 1.2 m pitch (0.6 m gaps, so each rack reads as one) x 3 deep
//               (aisles 1.6 m so the fronts behind read from a raised eye), footprint X -908..908 (10.2 m), row fronts
//               at Z 0 / 463 / 926, back face 1104. Spanning x 90-990 puts the front row at k ~0.5 (racks ~178 px). BLOCK_27_LAST = 4: the front-centre rack, the last one lit (the
//               Genius stands in front of it); BLOCK_27_DARK_ORDER = the other 26 in the order they go dark (back
//               rows first, outside in), reverse it to light them again.
//   HALL_CLEAR  THE CUT-8 FLOOR: the hall's interior with two rows of racks along the back wall only
//               (HALL_EDGE_RACKS) and CLEAR_FLOOR = { x0, x1, z0, z1 } free for a formation of 1 -> 1000.
//   GRID_COMPACT  THE CUT-1/2 INTERIOR (for HALL_COMPACT): 2 x 3 across a 2.4 m centre aisle, 3 rows with 2.0 m
//               aisles (room for Geniuses and desks), footprint X -534..534, Z 0..1246 (18 racks); placed at
//               COMPACT_RACKS_Z = 360: the front zone Z 0..360 (2 m) and the side strips x +-534..712 hold desks.
//   shiftRacks(racks, dx, dz) moves a layout (e.g. into the hall: shiftRacks(GRID_243, 0, HALL.z0 + 420)).
//
// ---- THE BUILDING ------------------------------------------------------------------------------------------------
//   HALL = { x0: -2400, x1: 2400, z0: 0, z1: 4300 (interior faces: 27 x 24 m), Hc: 1139 (6.4 m ceiling), wall: 53,
//            roof: 107, parapet: 89 }; the roof top at Y = -(Hc + roof) = -1246 (7 m), the parapet to -1335.
//   HALL_COMPACT = { x0: -712, x1: 712, z0: 0, z1: 1780 (8 x 10 m inside), Hc: 748 (4.2 m), wall 53, roof 89,
//            parapet 80 }: the small cutaway building of cuts 1-2 (outside 8.6 m = 1530 units wide: at k 0.61 it
//            fills x 70-1010 and a standing Genius near the opening is ~180-190 px). Every building part takes
//            hall={HallGeom} (default HALL); its fixtures (doors, louvres, chillers, skylights, light rows) are laid out
//            from the geometry. roofY(g) = the roof top.
//   <HallInterior A frame uid ceiling? lights? hall? />   the inside: a raised-floor tile floor (0.6 m tiles), the back and
//     side walls' inner faces (grey-umber), the ceiling seen from below (when the eye is under it) with rows of linear
//     cream lights over the aisles (LIGHT_ROWS_Z). Draw racks / figures after it (RackField with extras).
//   <DataCenter A frame uid cutaway? racks? extras? interior? hall? skyGlow? />   the building: a long low hall with
//     oatmeal walls, a stone base band, vertical panel seams, a louvre band, a personnel door and a roll-up LOADING
//     DOOR on its front, a flat roof with a parapet, rooftop chiller units (three fans each; 2 rows of 4 on HALL, 1
//     row of 2 on HALL_COMPACT) and a row of low SKYLIGHTS between them, on whatever ground the cut lays (AirFloor).
//     skyGlow = { color, amount 0..1 }: what the skylight glass shows of the inside (cut 2 passes the AI orange as
//     the Geniuses fill the hall; the module itself never uses orange). Default: dark glass.
//     cutaway 0..1 opens its FRONT WALL as a real part: it hinges down about its foot toward the camera like a
//     dollhouse front (0 = shut, 1 = flat on the ground in front, its inner face up), showing the
//     interior (HallInterior + racks + extras) through the opening under the fascia. Ease cutaway yourself (one eased
//     timeline). racks default = shiftRacks(GRID_HALL, 0, HALL_RACKS_Z) on HALL, shiftRacks(GRID_COMPACT, 0,
//     COMPACT_RACKS_Z) on HALL_COMPACT. Below ~0.02 the interior is not drawn (cheap).
//     Painter's order: interior, side walls, roof, parapets, rooftop units, fascia, corner piers, the front wall.
//     A camera ABOVE the roof (eye < -1246) sees the roof and its units (cut 2); an eye UNDER the ceiling (eye >
//     -1139) looks in under the ceiling lights (cut 1).
//
// ---- THE DESK ------------------------------------------------------------------------------------------------------
//   DESK = { w: 1.4 m = 249, d: 0.7 m = 125, h: 0.75 m = 134 (top surface), seat: 82 (covidFolk SEAT.h, 46 cm) }.
//   <Desk A X Z uid seat layer frame? screen? />   a present-day office desk: a pale laminate top on slate panel legs,
//     a modesty panel, a monitor on a stand (its screen a soft cream glow with faint lines), a keyboard and a mouse,
//     an office chair (dusty-teal seat and back, gas column, five-star base). X = the desk's centre, Z = its NEAR edge
//     (the edge toward the camera). seat = where the chair is and how the sitter faces:
//       "front"   chair on the camera side, the sitter's BACK to us, the screen facing us over his shoulder (the
//                 cleanest layering; best for an office floor seen from a raised camera)
//       "behind"  chair on the far side, the sitter FACING us over the monitor's back, the screen's glow on his face
//       "left" / "right"  chair at -X / +X, the sitter in profile facing +X / -X (dir 1 / -1), the desk's long side
//                 along Z, the monitor on the far side facing him (its screen is seen only when it faces the VP)
//     layer "back" = everything behind the sitter, "front" = everything in front of him (draw: back, the figure,
//     front). "front" seat: front = the chair back; "behind": front = desk, monitor, keyboard, the glow; profile: all
//     in back. screen 0..1 (default 1) the monitor's glow (0 = off, a dark slate screen). mug (default true): a cream
//     mug on the side away from the mouse.
//     THE GENIUS AT A DESK: seat "left" / "right" + GENIUS_POSES.typeAtDesk(an.dir) at an.at fits (his GENIUS_DESK
//     seatH 84 / deskH 132 vs this chair 82 / desk top 134: ~2 units, under a pixel). Draw: Desk layer="back", the
//     Genius, Desk layer="front". In profile his shins reach ~40 units under the desk top (as a sitter's do).
//   deskAnchors(X, Z, seat) -> { at: {X, Z} the figure's feet anchor (UNDER ITS HIPS, covidFolk's sit rule),
//     hips: {X, Y, Z} (the seat top + 16), seatTop: {X, Y, Z}, hands: {X, Y, Z} (the keyboard's centre, 4 units
//     above the desk top), screen: {X, Y, Z}, dir: 1 | -1 (profile facing) | 0, view: "back" | "front" | "profile" }.
//     The sitter's scale is A.P.at(at.X, at.Z).scale (units at the anchor's depth).
//
// ---- THE YEAR PLATE ----------------------------------------------------------------------------------------------
//   <YearPlate A X Y Z text t uid size? weight? plate? />   the clip's label ("2026", "×3", "2.5 billion"): cream
//     Libre Caslon Text (the style's figures, TuberculosisToll) cased in the medium's shadow, on a soft plate of the
//     shadow (a radial falloff, no box), in WORLD space at (X, Y, Z) (the text's centre; scales and parallaxes with
//     the camera). size = the font size in world units at that depth (default 120: ~130 px at k 1.1). t 0..1 =
//     the entrance: slides up 0.5 em while fading in (ease out); hold t = 1. Use "×3" (U+00D7) for the factor.
//     yearPlateT(frame, f0, dur = 12) -> t.
// ---------------------------------------------------------------------------
import React from "react";
import { random } from "remotion";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { AIR, AirBox, AirFloor, MAT, c01, lineOf, mixHex, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";

const { fontFamily: CASLON } = loadCaslon("normal", { weights: ["400", "700"], subsets: ["latin"] });
export const PLATE_FONT = CASLON;

const PAL = AIR.A;
export const U = 178;
export const CREAM = PAL.cream;

// ---- materials (local colours before fog; none near the orange hue) -------------------------------------------------
/** the rack body: MAT.iron taken a step darker so the cream lights carry (slate, never black) */
export const MAT_RACK: Mat = { lit: "#7C8588", mid: "#475054", dark: "#283033" };
export const MAT_OATMEAL: Mat = { lit: "#CDBF9F", mid: "#AE9F80", dark: "#6B604D" };
export const MAT_BASE: Mat = { lit: "#8C7E6C", mid: "#6A5F51", dark: "#3A332B" };
export const MAT_ROOF: Mat = { lit: "#8F897B", mid: "#6F6A5D", dark: "#3D3A33" };
export const MAT_UNIT: Mat = { lit: "#A9A9A0", mid: "#80817A", dark: "#45463F" };
export const MAT_HALLWALL: Mat = { lit: "#8B8A82", mid: "#6C6B64", dark: "#3B3A35" };
export const MAT_FLOOR: Mat = { lit: "#86827A", mid: "#6A675F", dark: "#3C3A34" };
export const MAT_LAMINATE: Mat = { lit: "#CCC4B1", mid: "#A39B88", dark: "#5E574B" };
export const MAT_MONITOR: Mat = { lit: "#525A5E", mid: "#3A4044", dark: "#23282B" };
export const MAT_KEYS: Mat = { lit: "#8C9396", mid: "#666D70", dark: "#353A3D" };
export const MAT_FABRIC: Mat = { lit: "#738A86", mid: "#566D6A", dark: "#30403F" };
export const MAT_DOOR: Mat = { lit: "#8E9597", mid: "#6C7376", dark: "#3A4043" };
const RECESS = "#22282B";
const FACE_TONES = ["#475055", "#3F474B", "#505A5F"];
const BLANK = "#353C40";
const SCREEN = "#EFE6D2";

const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const rectD = (x: number, y: number, w: number, h: number) => `M${f2(x)},${f2(y)}h${f2(w)}v${f2(h)}h${f2(-w)}Z`;
const easeOut = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const sstep = (t: number) => {
  const u = c01(t);
  return u * u * (3 - 2 * u);
};

// ===================================================================================================================
// THE RACK
// ===================================================================================================================
export const RACK = { w: 0.6 * U, h: 2.0 * U, d: 1.0 * U } as const;
const RW = RACK.w;
const RH = RACK.h;
/** the front's frame (local units): rails, top cap (with the status bar), plinth; 42 rack units between */
const FR = 7;
const TOP = 14;
const BOT = 12;
const UH = (RH - TOP - BOT) / 42;
export type RackSpec = { X: number; Z: number; seed: number; power?: number; relight?: boolean; row?: number; col?: number; id?: number };

type SUnit = { y: number; n: number; kind: "switch" | "server" | "storage" | "blank"; tone: number };
type Light = { x: number; y: number; col: number; per: number; ph: number; len: number; base: number };
type Layout = { units: SUnit[]; lights: Light[]; col0: Light[] };
const NVAR = 16;
const LAYOUTS = new Map<number, Layout>();
const layoutOf = (seed: number): Layout => {
  const v = ((Math.round(seed) % NVAR) + NVAR) % NVAR;
  const hit = LAYOUTS.get(v);
  if (hit) return hit;
  const rnd = (s: string) => random(`tenEarthsRack-${v}-${s}`);
  const units: SUnit[] = [{ y: TOP, n: 1, kind: "switch", tone: 0 }];
  let u = 1;
  if (rnd("b0") < 0.6) {
    units.push({ y: TOP + UH, n: 1, kind: "blank", tone: 0 });
    u = 2;
  }
  let i = 0;
  while (u < 42) {
    const a = rnd(`u${i}`);
    let n = a < 0.1 ? (rnd(`bn${i}`) < 0.5 ? 1 : 2) : a < 0.46 ? 1 : a < 0.84 ? 2 : 4;
    n = Math.min(n, 42 - u);
    const kind: SUnit["kind"] = a < 0.1 ? "blank" : n === 4 ? "storage" : "server";
    units.push({ y: TOP + u * UH, n, kind, tone: Math.floor(rnd(`t${i}`) * 3) });
    u += n;
    i++;
  }
  const lights: Light[] = [];
  let j = 0;
  const add = (x: number, y: number, col: number) => {
    const per = 50 + Math.floor(rnd(`p${j}`) * 150);
    lights.push({ x, y, col, per, ph: Math.floor(rnd(`h${j}`) * per), len: 2 + Math.floor(rnd(`l${j}`) * 4), base: rnd(`s${j}`) < 0.2 ? 0.55 : 1 });
    j++;
  };
  for (const su of units) {
    const yc = su.y + UH / 2;
    if (su.kind === "switch") {
      add(12.5, yc, 0);
      for (let q = 0; q < 8; q++) add(30 + q * 7.6, yc, 2);
    } else if (su.kind === "server") {
      add(12.5, yc, 0);
      add(16.8, yc, 1);
      if (su.n === 2) add(RW - 12.5, su.y + UH, 3);
    } else if (su.kind === "storage") {
      add(12.5, yc, 0);
      add(12.5, yc + UH, 1);
      for (let q = 0; q < 6; q++) add(27 + q * 11.6, su.y + su.n * UH - 3.2, 2);
    }
  }
  const out = { units, lights, col0: lights.filter((l) => l.col === 0) };
  LAYOUTS.set(v, out);
  return out;
};
const rackPhase = (seed: number) => Math.floor(random(`tenEarthsRackPh-${seed}`) * 997);
/** a light's brightness now: 1 bright, 0.55 steady half, 0.22 a blink */
const lightLevel = (l: Light, frame: number, ph: number) => ((((Math.floor(frame) + l.ph + ph) % l.per) + l.per) % l.per < l.len ? 0.22 : l.base);
/** is local y (0 = the front's top .. RH) lit at this power and wave */
const litAt = (y: number, power: number, relight: boolean) => (relight ? y / RH < power : y / RH >= 1 - power);
/** the dark (veiled) band of the front, local y0..y1 (null = none) */
const veilBand = (power: number, relight: boolean): [number, number] | null => {
  if (power >= 1) return null;
  if (power <= 0) return [0, RH];
  return relight ? [power * RH, RH] : [0, (1 - power) * RH];
};
/** the top face's veil amount (the wave starts at the top) */
const topVeil = (power: number, relight: boolean) => (relight ? c01(1 - power * 6) : c01((1 - power) * 6));

/** the house power wave: an 8-frame top-to-bottom wave going dark ("off") or lighting up ("on") from f0 */
export const powerWave = (frame: number, f0: number, dir: "off" | "on", dur = 8): { power: number; relight: boolean } => {
  const u = c01((frame - f0) / dur);
  return dir === "off" ? { power: 1 - u, relight: false } : { power: u, relight: true };
};

type RowCols = {
  front: string;
  top: string;
  left: string;
  right: string;
  line: string;
  recess: string;
  faces: string[];
  blank: string;
  ear: string;
  hole: string;
  light: string;
  veil: string;
  veilA: number;
  rimA: number;
  fz: number;
};
const rowColours = (A: AirWorld, Z: number): RowCols => {
  const h = RH / 2;
  const t = (hex: string) => A.tone(hex, Z, h);
  const fz = A.fog(Z);
  const air = A.airHex(Z, h);
  const m = MAT_RACK;
  return {
    front: t(m.mid),
    top: t(mixHex(m.lit, m.mid, 0.4)),
    left: t(mixHex(m.lit, m.mid, 0.35)),
    right: t(mixHex(m.dark, PAL.shadow, 0.2)),
    line: t(lineOf(m)),
    recess: t(RECESS),
    faces: FACE_TONES.map(t),
    blank: t(BLANK),
    ear: t(mixHex(m.mid, m.lit, 0.45)),
    hole: t("#24292C"),
    light: mixHex(CREAM, air, 0.55 * fz),
    veil: mixHex(air, PAL.shadow, 0.45),
    veilA: 0.55 * (1 - 0.65 * fz),
    rimA: (1 - fz) * 0.6,
    fz,
  };
};

/** THE HERO FRONT: drawn in local units (0..RW x 0..RH from the front's top-left) under translate + scale */
const RackFrontHero: React.FC<{ rk: RackSpec; c: RowCols; frame: number; ventId: string; tl: P2; r: number }> = ({ rk, c, frame, ventId, tl, r }) => {
  const L = layoutOf(rk.seed);
  const ph = rackPhase(rk.seed);
  const power = rk.power ?? 1;
  const relight = rk.relight ?? false;
  let faces = ["", "", ""];
  let blanks = "";
  let bevel = "";
  let under = "";
  let ears = "";
  let vents = "";
  let bays = "";
  for (const su of L.units) {
    const y0 = su.y + 0.45;
    const hh = su.n * UH - 0.9;
    if (su.kind === "blank") {
      blanks += rectD(FR + 1, y0, RW - 2 * FR - 2, hh);
      continue;
    }
    faces = faces.map((f, i) => (i === su.tone ? f + rectD(FR + 1, y0, RW - 2 * FR - 2, hh) : f));
    bevel += rectD(FR + 1, y0, RW - 2 * FR - 2, 0.55);
    under += rectD(FR + 1, y0 + hh - 0.8, RW - 2 * FR - 2, 0.8);
    ears += rectD(FR + 1, y0, 2.4, hh) + rectD(RW - FR - 3.4, y0, 2.4, hh);
    if (su.kind === "server") {
      vents += rectD(24, y0 + 1.2, RW - (su.n === 2 ? 66 : 50), hh - 2.4);
      if (su.n === 2) for (let q = 0; q < 3; q++) bays += rectD(RW - 40 + q * 7.4, y0 + 1.3, 6.2, hh - 2.6);
    } else if (su.kind === "storage") {
      for (let q = 0; q < 6; q++) bays += rectD(22.5 + q * 11.6, y0 + 1.4, 10.2, hh - 2.8);
    } else if (su.kind === "switch") {
      for (let q = 0; q < 8; q++) bays += rectD(27.6 + q * 7.6, y0 + 0.9, 4.8, hh - 3.2);
    }
  }
  let holes = "";
  for (let u = 0; u < 42; u++) {
    const y = TOP + u * UH + UH / 2 - 0.7;
    holes += rectD(FR / 2 - 0.7, y, 1.4, 1.4) + rectD(RW - FR / 2 - 0.7, y, 1.4, 1.4);
  }
  const cls: string[] = ["", "", ""];
  let glow = "";
  for (const l of L.lights) {
    if (!litAt(l.y, power, relight)) continue;
    const lv = lightLevel(l, frame, ph);
    const ci = lv > 0.9 ? 0 : lv > 0.4 ? 1 : 2;
    cls[ci] += `M${f2(l.x - 1.9)},${f2(l.y)}a1.9,1.9 0 1,0 3.8,0a1.9,1.9 0 1,0 -3.8,0Z`;
    if (ci === 0) glow += `M${f2(l.x - 6)},${f2(l.y)}a6,6 0 1,0 12,0a6,6 0 1,0 -12,0Z`;
  }
  const barLit = litAt(6, power, relight);
  const vb = veilBand(power, relight);
  return (
    <g transform={`translate(${f2(tl[0])} ${f2(tl[1])}) scale(${r.toFixed(5)})`}>
      <path d={rectD(FR, TOP - 1, RW - 2 * FR, RH - TOP - BOT + 2)} fill={c.recess} />
      {faces.map((d, i) => (d ? <path key={i} d={d} fill={c.faces[i]} /> : null))}
      {blanks ? <path d={blanks} fill={c.blank} /> : null}
      <path d={vents} fill={`url(#${ventId})`} />
      <path d={bays} fill={c.recess} fillOpacity={0.55} />
      <path d={ears} fill={c.ear} fillOpacity={0.7} />
      <path d={bevel} fill={CREAM} fillOpacity={0.22 * (1 - c.fz)} />
      <path d={under} fill={PAL.shadow} fillOpacity={0.5} />
      <path d={holes} fill={c.hole} fillOpacity={0.55} />
      {/* the plinth's kick vent */}
      <path d={rectD(14, RH - BOT + 3.5, RW - 28, 4)} fill={c.recess} fillOpacity={0.6} />
      {/* the status bar in the top cap */}
      <path d={rectD(12, 4.8, RW - 24, 3.2)} fill={c.recess} fillOpacity={0.7} />
      {barLit ? (
        <>
          <path d={rectD(10, 2.6, RW - 20, 7.6)} fill={c.light} fillOpacity={0.12} />
          <path d={rectD(13, 5.6, RW - 26, 1.8)} fill={c.light} fillOpacity={0.95} />
        </>
      ) : null}
      {glow ? <path d={glow} fill={c.light} fillOpacity={0.2} /> : null}
      {cls[0] ? <path d={cls[0]} fill={c.light} /> : null}
      {cls[1] ? <path d={cls[1]} fill={c.light} fillOpacity={0.6} /> : null}
      {cls[2] ? <path d={cls[2]} fill={c.light} fillOpacity={0.22} /> : null}
      {vb ? <path d={rectD(0, vb[0], RW, vb[1] - vb[0])} fill={c.veil} fillOpacity={c.veilA} /> : null}
    </g>
  );
};

export type RackLod = "auto" | "hero" | "mid" | "tiny";
export const RACK_LOD = { hero: 150, mid: 60 };

export const RackField: React.FC<{
  A: AirWorld;
  racks: RackSpec[];
  frame: number;
  uid: string;
  extras?: { Z: number; node: React.ReactNode }[];
  lod?: RackLod;
  shadow?: number;
  cull?: boolean;
}> = ({ A, racks, frame, uid, extras = [], lod = "auto", shadow = 1, cull = true }) => {
  const P = A.P;
  const k = A.k;
  const cam = A.cam;
  const vx = P.vp[0];
  const view = { x0: cam.cx - 600 / k, x1: cam.cx + 600 / k, y0: cam.cy - 1020 / k, y1: cam.cy + 1020 / k };
  const lw = A.lw(1.0);
  // rows by Z (back to front), extras interleaved by Z
  const byZ = new Map<number, RackSpec[]>();
  for (const rk of racks) {
    const key = Math.round(rk.Z * 100) / 100;
    const a = byZ.get(key);
    if (a) a.push(rk);
    else byZ.set(key, [rk]);
  }
  type Item = { key: number; row?: RackSpec[]; node?: React.ReactNode; ord: number };
  const items: Item[] = [...byZ.entries()].map(([key, row]) => ({ key, row, ord: 0 }));
  extras.forEach((e, i) => items.push({ key: e.Z, node: e.node, ord: 1 + i }));
  items.sort((a, b) => b.key - a.key || a.ord - b.ord);

  const renderRow = (row: RackSpec[], Z: number, ri: number): React.ReactNode => {
    if (Z < P.zNear) return null;
    const r = P.r(Z);
    const hp = RH * r * k;
    const tier = lod !== "auto" ? lod : hp >= RACK_LOD.hero ? "hero" : hp >= RACK_LOD.mid ? "mid" : "tiny";
    // the row's screen band (front face top .. foot, the top face above it)
    const yTop = Math.min(P.p(0, -RH, Z)[1], P.p(0, -RH, Z + RACK.d)[1]);
    const yFoot = P.p(0, 0, Z)[1];
    if (cull && (yFoot < view.y0 || yTop > view.y1)) return null;
    const sorted = [...row].sort((a, b) => a.X - b.X);
    const vis = cull
      ? sorted.filter((rk) => {
          const xa = P.p(rk.X - RW / 2, 0, Z)[0];
          const xb = P.p(rk.X + RW / 2, 0, Z + RACK.d)[0];
          const xc = P.p(rk.X + RW / 2, 0, Z)[0];
          return Math.max(xb, xc) >= view.x0 && Math.min(xa, xb) <= view.x1;
        })
      : sorted;
    if (!vis.length) return null;
    // runs: abutting racks
    const runs: RackSpec[][] = [];
    for (const rk of vis) {
      const last = runs[runs.length - 1];
      if (last && Math.abs(rk.X - last[last.length - 1].X - RW) < 1) last.push(rk);
      else runs.push([rk]);
    }
    // outside-in toward the VP
    runs.sort((a, b) => {
      const da = Math.min(Math.abs(a[0].X - RW / 2 - vx), Math.abs(a[a.length - 1].X + RW / 2 - vx));
      const db = Math.min(Math.abs(b[0].X - RW / 2 - vx), Math.abs(b[b.length - 1].X + RW / 2 - vx));
      return db - da;
    });
    const c = rowColours(A, Z);
    const Z1 = Z + RACK.d;
    const topSeen = -RH > P.horizonY;
    const els: React.ReactNode[] = [];
    const gid = `${uid}-r${ri}`;
    // the contact band in front of the foot
    if (shadow > 0) {
      const yA = P.p(0, 0, Z - 40)[1];
      const yB = P.p(0, 0, Z)[1];
      els.push(
        <defs key="sd">
          <linearGradient id={`${gid}-sh`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(yA)} x2="0" y2={f2(yB)}>
            <stop offset="0" stopColor={PAL.shadow} stopOpacity={0} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.42 * shadow * (1 - c.fz)} />
          </linearGradient>
          <linearGradient id={`${gid}-fg`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(P.p(0, -RH, Z)[1])} x2="0" y2={f2(yB)}>
            <stop offset="0" stopColor={CREAM} stopOpacity={0.06 * (1 - c.fz)} />
            <stop offset="0.4" stopColor={PAL.shadow} stopOpacity={0} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.22 * (1 - c.fz)} />
          </linearGradient>
        </defs>,
      );
    }
    let shadowD = "";
    let sides = "";
    let sidesR = "";
    let tops = "";
    let fronts = "";
    let rims = "";
    let seams = "";
    let topVeils = "";
    let recess = "";
    const faces = ["", "", ""];
    let blanks = "";
    let veils = "";
    const lightCls = ["", "", ""];
    let lineLights = "";
    let bars = "";
    const heroes: React.ReactNode[] = [];
    const onePx = 1 / (r * k);
    for (const run of runs) {
      const X0 = run[0].X - RW / 2;
      const X1 = run[run.length - 1].X + RW / 2;
      if (shadow > 0) shadowD += poly([P.p(X0 - 8, 0, Z - 40), P.p(X1 + 26, 0, Z - 40), P.p(X1 + 26, 0, Z), P.p(X0 - 8, 0, Z)]);
      if (X0 > vx) sides += poly([P.p(X0, -RH, Z), P.p(X0, -RH, Z1), P.p(X0, 0, Z1), P.p(X0, 0, Z)]);
      if (X1 < vx) sidesR += poly([P.p(X1, -RH, Z), P.p(X1, -RH, Z1), P.p(X1, 0, Z1), P.p(X1, 0, Z)]);
      if (topSeen) tops += poly([P.p(X0, -RH, Z), P.p(X1, -RH, Z), P.p(X1, -RH, Z1), P.p(X0, -RH, Z1)]);
      fronts += poly([P.p(X0, -RH, Z), P.p(X1, -RH, Z), P.p(X1, 0, Z), P.p(X0, 0, Z)]);
      rims += `M${Pt(P.p(X0, -RH, Z))}L${Pt(P.p(X1, -RH, Z))}` + (topSeen ? `M${Pt(P.p(X0, -RH, Z))}L${Pt(P.p(X0, -RH, Z1))}` : `M${Pt(P.p(X0, -RH, Z))}L${Pt(P.p(X0, 0, Z))}`);
      for (let i = 0; i < run.length; i++) {
        const rk = run[i];
        const xa = rk.X - RW / 2;
        if (i > 0) {
          seams += `M${Pt(P.p(xa, -RH, Z))}L${Pt(P.p(xa, 0, Z))}`;
          if (topSeen) seams += `M${Pt(P.p(xa, -RH, Z))}L${Pt(P.p(xa, -RH, Z1))}`;
        }
        const power = rk.power ?? 1;
        const relight = rk.relight ?? false;
        const tv = topVeil(power, relight);
        if (topSeen && tv > 0.01) topVeils += poly([P.p(xa, -RH, Z), P.p(xa + RW, -RH, Z), P.p(xa + RW, -RH, Z1), P.p(xa, -RH, Z1)]);
        const tl = P.p(xa, -RH, Z);
        const loc = (lx: number, ly: number, w: number, h: number) => rectD(tl[0] + lx * r, tl[1] + ly * r, w * r, h * r);
        if (tier === "hero") {
          heroes.push(<RackFrontHero key={`h${rk.id ?? `${rk.X}`}`} rk={rk} c={c} frame={frame} ventId={`${gid}-vent`} tl={tl} r={r} />);
          continue;
        }
        const vb = veilBand(power, relight);
        if (vb) veils += loc(0, vb[0], RW, vb[1] - vb[0]);
        const barH = Math.max(1.8, 1.2 * onePx);
        if (litAt(6, power, relight)) bars += loc(12, 6.6 - barH / 2, RW - 24, barH);
        if (tier === "mid") {
          const L = layoutOf(rk.seed);
          const ph = rackPhase(rk.seed);
          recess += loc(FR, TOP - 1, RW - 2 * FR, RH - TOP - BOT + 2);
          for (const su of L.units) {
            const d = loc(FR + 1, su.y + 0.6, RW - 2 * FR - 2, su.n * UH - 1.2);
            if (su.kind === "blank") blanks += d;
            else faces[su.tone] += d;
          }
          const lwU = Math.max(3.2, 1.5 * onePx);
          const lhU = Math.min(UH * 0.7, Math.max(2.2, 1.2 * onePx));
          const gap = 2.6 * onePx;
          let lastY = -1e9;
          for (const l of L.col0) {
            if (l.y - lastY < gap) continue;
            lastY = l.y;
            if (!litAt(l.y, power, relight)) continue;
            const lv = lightLevel(l, frame, ph);
            const ci = lv > 0.9 ? 0 : lv > 0.4 ? 1 : 2;
            lightCls[ci] += loc(l.x - lwU / 2, l.y - lhU / 2, lwU, lhU);
          }
        } else {
          // tiny: one vertical light line down the light column (its lit part)
          const lineW = Math.max(2.2, 1.2 * onePx);
          const y0 = TOP + 2;
          const y1 = RH - BOT - 2;
          const a = relight ? y0 : Math.max(y0, (1 - power) * RH);
          const b = relight ? Math.min(y1, power * RH) : y1;
          if (b > a + 0.5) lineLights += loc(12.5 - lineW / 2, a, lineW, b - a);
        }
      }
    }
    if (shadowD) els.push(<path key="sh" d={shadowD} fill={`url(#${gid}-sh)`} />);
    if (sides) els.push(<path key="sl" d={sides} fill={c.left} stroke={c.line} strokeWidth={lw} strokeLinejoin="round" />);
    if (sidesR) els.push(<path key="sr" d={sidesR} fill={c.right} stroke={c.line} strokeWidth={lw} strokeLinejoin="round" />);
    if (tops) els.push(<path key="tp" d={tops} fill={c.top} stroke={c.line} strokeWidth={lw} strokeLinejoin="round" />);
    if (topVeils) els.push(<path key="tv" d={topVeils} fill={c.veil} fillOpacity={c.veilA} />);
    els.push(<path key="fr" d={fronts} fill={c.front} stroke={c.line} strokeWidth={lw} strokeLinejoin="round" />);
    if (shadow > 0) els.push(<path key="frg" d={fronts} fill={`url(#${gid}-fg)`} />);
    if (tier === "hero") {
      els.push(
        <defs key="vd">
          <pattern id={`${gid}-vent`} width={3} height={2.6} patternUnits="userSpaceOnUse">
            <rect x={0} y={0.7} width={2} height={1.1} fill={c.recess} fillOpacity={0.55} />
          </pattern>
        </defs>,
      );
      els.push(<g key="hero">{heroes}</g>);
    } else {
      if (recess) els.push(<path key="rc" d={recess} fill={c.recess} />);
      faces.forEach((d, i) => d && els.push(<path key={`fc${i}`} d={d} fill={c.faces[i]} />));
      if (blanks) els.push(<path key="bl" d={blanks} fill={c.blank} />);
      if (bars) els.push(<path key="bar" d={bars} fill={c.light} fillOpacity={0.9} />);
      if (lightCls[0]) els.push(<path key="l0" d={lightCls[0]} fill={c.light} />);
      if (lightCls[1]) els.push(<path key="l1" d={lightCls[1]} fill={c.light} fillOpacity={0.6} />);
      if (lightCls[2]) els.push(<path key="l2" d={lightCls[2]} fill={c.light} fillOpacity={0.25} />);
      if (lineLights) els.push(<path key="ll" d={lineLights} fill={c.light} fillOpacity={0.85} />);
      if (veils) els.push(<path key="vl" d={veils} fill={c.veil} fillOpacity={c.veilA} />);
    }
    if (seams) els.push(<path key="sm" d={seams} fill="none" stroke={c.line} strokeWidth={lw * 0.9} strokeOpacity={0.85} />);
    if (c.rimA > 0.01) els.push(<path key="rim" d={rims} fill="none" stroke={CREAM} strokeWidth={lw * 1.1} strokeOpacity={c.rimA} strokeLinecap="round" />);
    return <g key={`row${ri}`}>{els}</g>;
  };

  return (
    <g>
      {items.map((it, i) => (it.row ? renderRow(it.row, it.key, i) : <React.Fragment key={`x${i}`}>{it.node}</React.Fragment>))}
    </g>
  );
};

export const Rack: React.FC<{ A: AirWorld; X: number; Z: number; frame: number; uid: string; seed?: number; power?: number; relight?: boolean; lod?: RackLod; shadow?: number }> = ({ A, X, Z, frame, uid, seed = 1, power = 1, relight = false, lod, shadow }) => (
  <RackField A={A} racks={[{ X, Z, seed, power, relight, id: 0 }]} frame={frame} uid={uid} lod={lod} shadow={shadow} />
);

// ===================================================================================================================
// LAYOUTS
// ===================================================================================================================
export const rackGrid = (o: { cols: number; rows: number; x?: number; z?: number; aisle?: number; colGap?: { every: number; gap: number }; rowGap?: { every: number; gap: number }; seed0?: number; pitch?: number }): RackSpec[] => {
  const { cols, rows, x = 0, z = 0, aisle = 1.2 * U, colGap, rowGap, seed0 = 0, pitch = RW } = o;
  const xs: number[] = [];
  let cx = 0;
  for (let c = 0; c < cols; c++) {
    if (c > 0 && colGap && c % colGap.every === 0) cx += colGap.gap;
    xs.push(cx + RW / 2);
    cx += c < cols - 1 ? pitch : RW;
  }
  const off = x - cx / 2;
  const out: RackSpec[] = [];
  let cz = z;
  for (let rr = 0; rr < rows; rr++) {
    if (rr > 0) cz += RACK.d + aisle + (rowGap && rr % rowGap.every === 0 ? rowGap.gap : 0);
    for (let c = 0; c < cols; c++) {
      const id = rr * cols + c;
      out.push({ X: off + xs[c], Z: cz, row: rr, col: c, id, seed: seed0 + id * 7 + 3 });
    }
  }
  return out;
};
export const shiftRacks = (racks: RackSpec[], dx: number, dz: number): RackSpec[] => racks.map((rk) => ({ ...rk, X: rk.X + dx, Z: rk.Z + dz }));

export const GRID_243 = rackGrid({ cols: 27, rows: 9, aisle: 1.2 * U, colGap: { every: 9, gap: 1.2 * U }, rowGap: { every: 3, gap: 0.6 * U } });
export const HERO_243 = 13;
const gridIds = (cols: number, c0: number, c1: number, r0: number, r1: number) => {
  const out: number[] = [];
  for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) out.push(rr * cols + c);
  return out;
};
export const GROWTH_243: number[][] = [gridIds(27, 13, 13, 0, 0), gridIds(27, 12, 14, 0, 0), gridIds(27, 12, 14, 0, 2), gridIds(27, 9, 17, 0, 2), gridIds(27, 9, 17, 0, 8), gridIds(27, 0, 26, 0, 8)];

/** THE CUT-1 INTERIOR: 2 x 9 across with a 2.4 m central aisle down the middle (X -213..213), 6 rows at 1.8 m aisles,
 *  for the view in through the cutaway: the Geniuses work in the central aisle and the front aisle. Footprint
 *  X -1175..1175, Z 0..2668; DataCenter's default racks = shiftRacks(GRID_HALL, 0, HALL_RACKS_Z). */
export const GRID_HALL = rackGrid({ cols: 18, rows: 6, aisle: 1.8 * U, colGap: { every: 9, gap: 2.4 * U }, seed0: 700 });
export const HALL_RACKS_Z = 700;
/** THE COMPACT INTERIOR (HALL_COMPACT): 2 x 3 across a 2.4 m central aisle, 3 rows at 2.0 m aisles (room for desks and
 *  Geniuses in the aisles); footprint X -534..534, Z 0..1246; DataCenter's default racks in HALL_COMPACT =
 *  shiftRacks(GRID_COMPACT, 0, COMPACT_RACKS_Z). */
export const GRID_COMPACT = rackGrid({ cols: 6, rows: 3, aisle: 2.0 * U, colGap: { every: 3, gap: 2.4 * U }, seed0: 760 });
export const COMPACT_RACKS_Z = 360;
export const BLOCK_27 = rackGrid({ cols: 9, rows: 3, aisle: 1.6 * U, seed0: 500, pitch: 1.2 * U });
export const BLOCK_27_LAST = 4;
export const BLOCK_27_DARK_ORDER: number[] = BLOCK_27.filter((rk) => rk.id !== BLOCK_27_LAST)
  .sort((a, b) => (b.row ?? 0) - (a.row ?? 0) || Math.abs((b.col ?? 0) - 4) - Math.abs((a.col ?? 0) - 4) || (a.col ?? 0) - (b.col ?? 0))
  .map((rk) => rk.id ?? 0);

// ===================================================================================================================
// THE BUILDING
// ===================================================================================================================
/** a hall's geometry: interior faces x0..x1 and z0 (the front opening) .. z1 (the back wall), the ceiling Hc, the wall,
 *  roof slab and parapet thicknesses (units) */
export type HallGeom = { x0: number; x1: number; z0: number; z1: number; Hc: number; wall: number; roof: number; parapet: number };
/** THE BIG HALL (default): 27 x 24 m inside, 6.4 m ceiling, roof top 7 m: holds GRID_243 (cut 3) and the cut-8 floor */
export const HALL: HallGeom = { x0: -2400, x1: 2400, z0: 0, z1: 4300, Hc: 6.4 * U, wall: 0.3 * U, roof: 0.6 * U, parapet: 0.5 * U };
/** THE COMPACT HALL: 8 x 10 m inside, 4.2 m ceiling: the cutaway building of cut 1 / cut 2, where the Geniuses inside
 *  can be ~180-200 px tall while the building fills the width (k ~0.64). Racks: GRID_COMPACT. */
export const HALL_COMPACT: HallGeom = { x0: -712, x1: 712, z0: 0, z1: 1780, Hc: 4.2 * U, wall: 0.3 * U, roof: 0.5 * U, parapet: 0.45 * U };
export const roofY = (g: HallGeom) => -(g.Hc + g.roof);
/** the cut-8 clear floor and the racks that line the back wall around it */
export const HALL_EDGE_RACKS = shiftRacks(rackGrid({ cols: 27, rows: 2, aisle: 1.2 * U, colGap: { every: 9, gap: 1.2 * U }, seed0: 900 }), 0, HALL.z1 - 260 - 2 * RACK.d - 1.2 * U);
export const CLEAR_FLOOR = { x0: -2150, x1: 2150, z0: 160, z1: HALL.z1 - 260 - 2 * RACK.d - 1.2 * U - 220 };
export const HALL_CLEAR = HALL_EDGE_RACKS;
/** the ceiling light rows: a linear light every 3.4 m from 1.7 m behind the opening */
export const lightRowsZ = (g: HallGeom) => {
  const out: number[] = [];
  for (let Z = g.z0 + 300; Z < g.z1 - 150; Z += 600) out.push(Z);
  return out;
};
export const LIGHT_ROWS_Z = lightRowsZ(HALL);

export const HallInterior: React.FC<{ A: AirWorld; frame?: number; uid: string; ceiling?: boolean; lights?: boolean; hall?: HallGeom }> = ({ A, uid, ceiling = true, lights = true, hall = HALL }) => {
  const P = A.P;
  const { x0, x1, z0, z1, Hc } = hall;
  const lx = Math.min(180, (x1 - x0) * 0.08);
  const vx = P.vp[0];
  const lw = A.lw(1.0);
  const t = (m: string, Z: number, h: number) => A.tone(m, Z, h);
  const zm = (z0 + z1) / 2;
  const els: React.ReactNode[] = [];
  // the back wall
  els.push(<path key="bw" d={poly([P.p(x0, -Hc, z1), P.p(x1, -Hc, z1), P.p(x1, 0, z1), P.p(x0, 0, z1)])} fill={t(mixHex(MAT_HALLWALL.mid, MAT_HALLWALL.dark, 0.25), z1, Hc / 2)} />);
  // the side walls' inner faces (shaded; the left one catches a little light)
  if (x0 < vx) els.push(<path key="lw" d={poly([P.p(x0, -Hc, z0), P.p(x0, -Hc, z1), P.p(x0, 0, z1), P.p(x0, 0, z0)])} fill={t(MAT_HALLWALL.mid, zm, Hc / 2)} stroke={t(lineOf(MAT_HALLWALL), zm, Hc / 2)} strokeWidth={lw} />);
  if (x1 > vx) els.push(<path key="rw" d={poly([P.p(x1, -Hc, z0), P.p(x1, -Hc, z1), P.p(x1, 0, z1), P.p(x1, 0, z0)])} fill={t(mixHex(MAT_HALLWALL.dark, PAL.shadow, 0.15), zm, Hc / 2)} stroke={t(lineOf(MAT_HALLWALL), zm, Hc / 2)} strokeWidth={lw} />);
  // the ceiling from below, with its light rows
  const ceilSeen = ceiling && -Hc < P.horizonY;
  if (ceilSeen) {
    els.push(<path key="cl" d={poly([P.p(x0, -Hc, z0), P.p(x1, -Hc, z0), P.p(x1, -Hc, z1), P.p(x0, -Hc, z1)])} fill={t(mixHex(MAT_HALLWALL.dark, MAT_HALLWALL.mid, 0.35), zm, Hc)} />);
    // beams across, every 3 m
    let beams = "";
    for (let Z = z0 + 534; Z < z1; Z += 534) beams += poly([P.p(x0, -Hc, Z - 14), P.p(x1, -Hc, Z - 14), P.p(x1, -Hc + 40, Z), P.p(x0, -Hc + 40, Z)]);
    els.push(<path key="bm" d={beams} fill={t(MAT_HALLWALL.dark, zm, Hc)} fillOpacity={0.6} />);
    if (lights) {
      let glow = "";
      let core = "";
      for (const Z of lightRowsZ(hall)) {
        core += poly([P.p(x0 + lx, -Hc + 6, Z - 13), P.p(x1 - lx, -Hc + 6, Z - 13), P.p(x1 - lx, -Hc + 6, Z + 13), P.p(x0 + lx, -Hc + 6, Z + 13)]);
        glow += poly([P.p(x0 + lx - 40, -Hc + 2, Z - 60), P.p(x1 - lx + 40, -Hc + 2, Z - 60), P.p(x1 - lx + 40, -Hc + 2, Z + 60), P.p(x0 + lx - 40, -Hc + 2, Z + 60)]);
      }
      const fz = A.fog(zm);
      els.push(<path key="lg" d={glow} fill={CREAM} fillOpacity={0.1 * (1 - 0.6 * fz)} />);
      els.push(<path key="lc" d={core} fill={mixHex(CREAM, A.airHex(zm, Hc), 0.4 * fz)} fillOpacity={0.92} />);
    }
  }
  return (
    <g>
      {els}
      <AirFloor A={A} x0={x0} x1={x1} z0={Math.max(z0, P.zNear)} z1={z1} mat={MAT_FLOOR} course={0.6 * U} plank={0.6 * U} melt={0} jointAmt={0.7} />
      <path key="ft" d={poly([P.p(x0, 0, z1 - 1), P.p(x1, 0, z1 - 1), P.p(x1, 0, z1), P.p(x0, 0, z1)])} fill="none" stroke={t(lineOf(MAT_HALLWALL), z1, 0)} strokeWidth={lw} strokeOpacity={0.5} data-uid={uid} />
    </g>
  );
};

/** the rooftop plant of a hall: chillers (X centre, Z front, w, d) in one or two rows, a row of skylights between */
const roofPlant = (g: HallGeom) => {
  const ex0 = g.x0 - g.wall;
  const ex1 = g.x1 + g.wall;
  const W = ex1 - ex0;
  const D = g.z1 - g.z0 + 2 * g.wall;
  const ez0 = g.z0 - g.wall;
  const w = Math.min(4.2 * U, W / 5.2);
  const d = Math.min(2.2 * U, D / 5);
  const n = Math.max(1, Math.floor((W - 0.5 * w) / (1.6 * w)));
  const xs = Array.from({ length: n }, (_, i) => ex0 + (W * (i + 0.5)) / n);
  const rowsZ = D > 3000 ? [ez0 + 0.16 * D, ez0 + 0.72 * D] : [ez0 + 0.62 * D];
  const chillers = rowsZ.flatMap((Z) => xs.map((X) => ({ X, Z, w, d })));
  const skyZ = D > 3000 ? ez0 + 0.45 * D : ez0 + 0.28 * D;
  const sw = Math.min(2.4 * U, (W / n) * 0.55);
  const skylights = xs.map((X) => ({ X, Z: skyZ, w: sw, d: Math.min(1.4 * U, D * 0.12) }));
  return { chillers, skylights };
};
const Chiller: React.FC<{ A: AirWorld; X: number; Z: number; w: number; d: number; roof: number; uid: string }> = ({ A, X, Z, w, d, roof, uid }) => {
  const P = A.P;
  const h = Math.min(1.4 * U, w / 3);
  const Y1 = roof;
  const Y0 = roof - h;
  const fz = A.fog(Z + d / 2);
  const els: React.ReactNode[] = [];
  els.push(<AirBox key="b" A={A} X0={X - w / 2} X1={X + w / 2} Y0={Y0} Y1={Y1} Z0={Z} Z1={Z + d} mat={MAT_UNIT} uid={uid} />);
  // louvres on its front
  let lv = "";
  for (let i = 1; i < 7; i++) {
    const y = Y0 + (h * i) / 7;
    lv += `M${Pt(P.p(X - w / 2 + 20, y, Z))}L${Pt(P.p(X + w / 2 - 20, y, Z))}`;
  }
  els.push(<path key="lv" d={lv} stroke={A.tone(MAT_UNIT.dark, Z, -Y0)} strokeWidth={A.lw(1.2)} strokeOpacity={0.5} fill="none" />);
  // two fans on its top
  if (Y0 > P.horizonY) {
    [-1 / 3, 0, 1 / 3].forEach((fx, i) => {
      const cx = X + fx * w;
      const cz = Z + d / 2;
      const R = Math.min(w / 7.2, d / 3.8);
      const c = P.p(cx, Y0, cz);
      const rx = R * P.r(cz);
      const ry = Math.abs(P.p(cx, Y0, cz - R)[1] - P.p(cx, Y0, cz + R)[1]) / 2;
      els.push(<ellipse key={`fo${i}`} cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={A.tone(MAT_UNIT.dark, cz, -Y0)} />);
      els.push(<ellipse key={`fi${i}`} cx={c[0]} cy={c[1]} rx={rx * 0.8} ry={ry * 0.8} fill={A.tone(mixHex(MAT_UNIT.dark, PAL.shadow, 0.35), cz, -Y0)} />);
      els.push(<path key={`fg${i}`} d={`M${f2(c[0] - rx * 0.8)},${f2(c[1])}L${f2(c[0] + rx * 0.8)},${f2(c[1])}M${f2(c[0])},${f2(c[1] - ry * 0.8)}L${f2(c[0])},${f2(c[1] + ry * 0.8)}`} stroke={A.tone(MAT_UNIT.mid, cz, -Y0)} strokeWidth={A.lw(1.4)} />);
      els.push(<ellipse key={`fr${i}`} cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill="none" stroke={CREAM} strokeOpacity={0.35 * (1 - fz)} strokeWidth={A.lw(1.1)} />);
    });
  }
  return <g>{els}</g>;
};

export const DataCenter: React.FC<{
  A: AirWorld;
  frame: number;
  uid: string;
  cutaway?: number;
  racks?: RackSpec[];
  extras?: { Z: number; node: React.ReactNode }[];
  interior?: boolean;
  hall?: HallGeom;
  skyGlow?: { color: string; amount: number };
}> = ({ A, frame, uid, cutaway = 0, racks, extras, interior = true, hall = HALL, skyGlow }) => {
  const P = A.P;
  const { x0, x1, z0, z1, Hc, wall } = hall;
  const ROOF_Y = roofY(hall);
  const PARA_Y = ROOF_Y - hall.parapet;
  const W = x1 - x0;
  const plant = roofPlant(hall);
  const ex0 = x0 - wall;
  const ex1 = x1 + wall;
  const ez0 = z0 - wall;
  const ez1 = z1 + wall;
  const vx = P.vp[0];
  const lw = A.lw(1.1);
  const els: React.ReactNode[] = [];
  const phi = (Math.PI / 2) * sstep(cutaway);
  const open = cutaway > 0.02;
  const tO = (hex: string, Z: number, h: number) => A.tone(hex, Z, h);
  // ---- the interior through the opening
  if (open && interior) {
    els.push(<HallInterior key="in" A={A} uid={`${uid}-in`} hall={hall} />);
    els.push(<RackField key="rk" A={A} racks={racks ?? (hall === HALL_COMPACT ? shiftRacks(GRID_COMPACT, 0, COMPACT_RACKS_Z) : shiftRacks(GRID_HALL, 0, HALL_RACKS_Z))} frame={frame} uid={`${uid}-rk`} extras={extras} />);
  }
  // ---- the side walls' outer faces
  const zm = (ez0 + ez1) / 2;
  if (ex0 > vx) els.push(<path key="sl" d={poly([P.p(ex0, ROOF_Y, ez0), P.p(ex0, ROOF_Y, ez1), P.p(ex0, 0, ez1), P.p(ex0, 0, ez0)])} fill={tO(mixHex(MAT_OATMEAL.lit, MAT_OATMEAL.mid, 0.4), zm, Hc / 2)} stroke={tO(lineOf(MAT_OATMEAL), zm, Hc / 2)} strokeWidth={lw} />);
  if (ex1 < vx) els.push(<path key="sr" d={poly([P.p(ex1, ROOF_Y, ez0), P.p(ex1, ROOF_Y, ez1), P.p(ex1, 0, ez1), P.p(ex1, 0, ez0)])} fill={tO(mixHex(MAT_OATMEAL.dark, PAL.shadow, 0.2), zm, Hc / 2)} stroke={tO(lineOf(MAT_OATMEAL), zm, Hc / 2)} strokeWidth={lw} />);
  // ---- the roof (seen from above), parapets, chillers
  if (ROOF_Y > P.horizonY) {
    els.push(<path key="rf" d={poly([P.p(ex0, ROOF_Y, ez0), P.p(ex1, ROOF_Y, ez0), P.p(ex1, ROOF_Y, ez1), P.p(ex0, ROOF_Y, ez1)])} fill={tO(MAT_ROOF.lit, zm, -ROOF_Y)} />);
    // membrane seams along Z
    let sm = "";
    for (let X = ex0 + 300 + (((ex1 - ex0 - 600) % 600) + 600) / 2; X < ex1 - 100; X += 600) sm += `M${Pt(P.p(X, ROOF_Y, ez0))}L${Pt(P.p(X, ROOF_Y, ez1))}`;
    els.push(<path key="rs" d={sm} stroke={tO(MAT_ROOF.mid, zm, -ROOF_Y)} strokeWidth={lw} strokeOpacity={0.5} fill="none" />);
  }
  const pt = 0.25 * U;
  // skylights: low glazed curbs on the roof (their glass takes skyGlow: what is lit inside)
  if (ROOF_Y > P.horizonY) {
    plant.skylights.forEach((sk, i) => {
      const cy = ROOF_Y - 0.25 * U;
      els.push(<AirBox key={`skb${i}`} A={A} X0={sk.X - sk.w / 2} X1={sk.X + sk.w / 2} Y0={cy} Y1={ROOF_Y} Z0={sk.Z} Z1={sk.Z + sk.d} mat={MAT_UNIT} uid={`${uid}-skb${i}`} rim={0.6} />);
      const gi = 22;
      const q = poly([P.p(sk.X - sk.w / 2 + gi, cy, sk.Z + gi), P.p(sk.X + sk.w / 2 - gi, cy, sk.Z + gi), P.p(sk.X + sk.w / 2 - gi, cy, sk.Z + sk.d - gi), P.p(sk.X - sk.w / 2 + gi, cy, sk.Z + sk.d - gi)]);
      const glass = A.tone(mixHex(MAT_MONITOR.mid, "#5E7A78", 0.4), sk.Z, -cy);
      const amt = c01(skyGlow?.amount ?? 0);
      const lit = skyGlow ? A.toneO(skyGlow.color, sk.Z, -cy) : glass;
      els.push(<path key={`skg${i}`} d={q} fill={mixHex(glass, lit, amt)} />);
      if (skyGlow && amt > 0.02) {
        // the light standing over the glass: a soft halo in the air (screen blend), no hard edge
        const c = P.p(sk.X, cy - 0.5 * U, sk.Z + sk.d / 2);
        const rx = sk.w * 0.75 * P.r(sk.Z);
        els.push(
          <g key={`skh${i}`}>
            <defs>
              <radialGradient id={`${uid}-skh${i}`}>
                <stop offset="0" stopColor={lit} stopOpacity={0.32 * amt} />
                <stop offset="1" stopColor={lit} stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={rx * 0.6} fill={`url(#${uid}-skh${i})`} style={{ mixBlendMode: "screen" }} />
          </g>,
        );
      }
      els.push(<path key={`skr${i}`} d={`M${Pt(P.p(sk.X - sk.w / 2 + gi, cy, sk.Z + gi))}L${Pt(P.p(sk.X - sk.w / 2 + gi, cy, sk.Z + sk.d - gi))}`} stroke={CREAM} strokeOpacity={0.35 * (1 - A.fog(sk.Z))} strokeWidth={lw} />);
    });
  }
  els.push(<AirBox key="pb" A={A} X0={ex0} X1={ex1} Y0={PARA_Y} Y1={ROOF_Y} Z0={ez1 - pt} Z1={ez1} mat={MAT_OATMEAL} uid={`${uid}-pb`} />);
  els.push(<AirBox key="pl" A={A} X0={ex0} X1={ex0 + pt} Y0={PARA_Y} Y1={ROOF_Y} Z0={ez0} Z1={ez1} mat={MAT_OATMEAL} uid={`${uid}-pl`} />);
  els.push(<AirBox key="pr" A={A} X0={ex1 - pt} X1={ex1} Y0={PARA_Y} Y1={ROOF_Y} Z0={ez0} Z1={ez1} mat={MAT_OATMEAL} uid={`${uid}-pr`} />);
  // the rooftop plant only when the roof top is seen (from under the roof it would show through the opening)
  const roofSeen = ROOF_Y > P.horizonY;
  // the roof shadow band under the chillers
  if (roofSeen) plant.chillers.forEach((ch, i) => {
    els.push(<path key={`cs${i}`} d={poly([P.p(ch.X - ch.w / 2 - 14, ROOF_Y, ch.Z - 30), P.p(ch.X + ch.w / 2 + 70, ROOF_Y, ch.Z - 30), P.p(ch.X + ch.w / 2 + 70, ROOF_Y, ch.Z + ch.d + 40), P.p(ch.X - ch.w / 2 - 14, ROOF_Y, ch.Z + ch.d + 40)])} fill={PAL.shadow} fillOpacity={0.18 * (1 - A.fog(ch.Z))} />);
  });
  if (roofSeen) [...plant.chillers].sort((a, b) => b.Z - a.Z || Math.abs(b.X - vx) - Math.abs(a.X - vx)).forEach((ch, i) => els.push(<Chiller key={`ch${i}`} A={A} X={ch.X} Z={ch.Z} w={ch.w} d={ch.d} roof={ROOF_Y} uid={`${uid}-ch${i}`} />));
  // ---- the front: the fascia (roof edge + front parapet), the corner piers
  els.push(<AirBox key="pf" A={A} X0={ex0} X1={ex1} Y0={PARA_Y} Y1={-Hc} Z0={ez0} Z1={ez0 + pt} mat={MAT_OATMEAL} uid={`${uid}-pf`} />);
  // the fascia's coping line and the soffit step
  els.push(<path key="fsc" d={`M${Pt(P.p(ex0, ROOF_Y + 10, ez0))}L${Pt(P.p(ex1, ROOF_Y + 10, ez0))}`} stroke={tO(lineOf(MAT_OATMEAL), ez0, -ROOF_Y)} strokeWidth={lw} strokeOpacity={0.6} />);
  const pierFill = tO(MAT_OATMEAL.mid, ez0, Hc / 2);
  els.push(<path key="pfl" d={poly([P.p(ex0, -Hc, ez0), P.p(x0, -Hc, ez0), P.p(x0, 0, ez0), P.p(ex0, 0, ez0)])} fill={pierFill} stroke={tO(lineOf(MAT_OATMEAL), ez0, Hc / 2)} strokeWidth={lw} />);
  els.push(<path key="pfr" d={poly([P.p(x1, -Hc, ez0), P.p(ex1, -Hc, ez0), P.p(ex1, 0, ez0), P.p(x1, 0, ez0)])} fill={pierFill} stroke={tO(lineOf(MAT_OATMEAL), ez0, Hc / 2)} strokeWidth={lw} />);
  // the opening's reveals (the side walls' thickness and the ceiling edge) once the wall has left
  if (open) {
    const rv = tO(mixHex(MAT_OATMEAL.dark, MAT_OATMEAL.mid, 0.4), z0, Hc / 2);
    if (x0 < vx) els.push(<path key="rvl" d={poly([P.p(x0, -Hc, ez0), P.p(x0, -Hc, z0), P.p(x0, 0, z0), P.p(x0, 0, ez0)])} fill={rv} />);
    if (x1 > vx) els.push(<path key="rvr" d={poly([P.p(x1, -Hc, ez0), P.p(x1, -Hc, z0), P.p(x1, 0, z0), P.p(x1, 0, ez0)])} fill={rv} />);
    if (-Hc < P.horizonY) els.push(<path key="rvt" d={poly([P.p(x0, -Hc, ez0), P.p(x1, -Hc, ez0), P.p(x1, -Hc, z0), P.p(x0, -Hc, z0)])} fill={tO(MAT_OATMEAL.dark, z0, Hc)} />);
  }
  // the building's contact shadow on the ground in front
  els.push(<path key="gs" d={poly([P.p(ex0 - 20, 0, ez0 - 70), P.p(ex1 + 60, 0, ez0 - 70), P.p(ex1 + 60, 0, ez0), P.p(ex0 - 20, 0, ez0)])} fill={PAL.shadow} fillOpacity={0.2 * (1 - A.fog(ez0))} />);
  // ---- THE FRONT WALL, hinged at its outer foot (Y 0, Z ez0), falling toward the camera
  const cphi = Math.cos(phi);
  const sphi = Math.sin(phi);
  const wp = (x: number, s: number, q: number): P2 => P.p(x, -s * cphi - q * sphi, ez0 - s * sphi + q * cphi);
  const WH = Hc;
  const mid = { Y: -(WH / 2) * cphi, Z: ez0 - (WH / 2) * sphi };
  const outerSeen = (P.opts.eyeY - mid.Y) * sphi + (P.Dc + mid.Z) * cphi > 0;
  const topY = -WH * cphi;
  const topZ = ez0 - WH * sphi;
  const topSeen = -(P.opts.eyeY - topY) * cphi + (P.Dc + topZ) * sphi > 0;
  const hW = (WH / 2) * cphi;
  const fW = (hex: string) => tO(hex, mid.Z, hW);
  const wl: React.ReactNode[] = [];
  const wln = fW(lineOf(MAT_OATMEAL));
  const quad = (xa: number, xb: number, sa: number, sb: number, q = 0) => poly([wp(xa, sb, q), wp(xb, sb, q), wp(xb, sa, q), wp(xa, sa, q)]);
  // the falling wall lit by its angle to the light (upper left, from the front): a little brighter as it tips up
  const lightAmt = c01(0.5 + 0.5 * sphi);
  if (outerSeen) {
    wl.push(<path key="wo" d={quad(x0, x1, 0, WH)} fill={fW(mixHex(MAT_OATMEAL.mid, MAT_OATMEAL.lit, 0.3 * lightAmt))} stroke={wln} strokeWidth={lw} strokeLinejoin="round" />);
    // the soft darkening toward its foot (light from above) and the stone base band
    const gA = wp(0, WH, 0)[1];
    const gB = wp(0, 0, 0)[1];
    if (Math.abs(gB - gA) > 2) {
      wl.push(
        <defs key="wgd">
          <linearGradient id={`${uid}-wg`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(gA)} x2="0" y2={f2(gB)}>
            <stop offset="0" stopColor={CREAM} stopOpacity={0.1} />
            <stop offset="0.45" stopColor={PAL.shadow} stopOpacity={0} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.22} />
          </linearGradient>
        </defs>,
      );
      wl.push(<path key="wgr" d={quad(x0, x1, 0, WH)} fill={`url(#${uid}-wg)`} />);
    }
    wl.push(<path key="wb" d={quad(x0, x1, 0, 0.55 * U)} fill={fW(MAT_BASE.mid)} />);
    // vertical panel seams every 1.2 m
    let seams = "";
    for (let X = x0 + 214; X < x1 - 20; X += 214) seams += `M${Pt(wp(X, 0.55 * U, 0))}L${Pt(wp(X, WH, 0))}`;
    wl.push(<path key="ws" d={seams} stroke={wln} strokeWidth={lw * 0.8} strokeOpacity={0.3} fill="none" />);
    // the louvre band (six vents, high)
    const louv: React.ReactNode[] = [];
    // the loading door's place (right), the personnel door (left), the louvre band between them
    const lx1 = x1 - 0.08 * W;
    const lx0 = lx1 - Math.min(750, 0.28 * W);
    const lh = Math.min(4.4 * U, 0.62 * WH);
    const pdx = x0 + 0.08 * W;
    const pdh = Math.min(2.2 * U, 0.5 * WH);
    const ls0 = 0.5 * WH;
    const ls1 = 0.78 * WH;
    const lvW = Math.min(340, W / 8);
    const lvGap = lvW * 0.18;
    for (let i = 0, xa = pdx + 0.06 * W; xa + lvW < lx0 - 0.04 * W; i++, xa += lvW + lvGap) {
      louv.push(<path key={`lv${i}`} d={quad(xa, xa + lvW, ls0, ls1)} fill={fW(MAT_DOOR.dark)} />);
      let sl = "";
      const nS = Math.max(3, Math.round((ls1 - ls0) / 32));
      for (let j = 1; j < nS; j++) sl += `M${Pt(wp(xa + 8, ls0 + (j * (ls1 - ls0)) / nS, 0))}L${Pt(wp(xa + lvW - 8, ls0 + (j * (ls1 - ls0)) / nS, 0))}`;
      louv.push(<path key={`ls${i}`} d={sl} stroke={fW(MAT_DOOR.mid)} strokeWidth={lw * 1.4} fill="none" />);
    }
    wl.push(<g key="lv">{louv}</g>);
    // the personnel door
    wl.push(<path key="pd" d={quad(pdx, pdx + 170, 0, pdh)} fill={fW(MAT_DOOR.mid)} stroke={fW(lineOf(MAT_DOOR))} strokeWidth={lw} />);
    wl.push(<path key="pdh" d={quad(pdx + 144, pdx + 154, 0.45 * pdh, 0.51 * pdh)} fill={fW(MAT_DOOR.lit)} />);
    // the loading door: a roll-up door with its slats, frame and a lintel
    wl.push(<path key="lf" d={quad(lx0 - 22, lx1 + 22, 0, lh + 26)} fill={fW(MAT_DOOR.dark)} />);
    wl.push(<path key="ld" d={quad(lx0, lx1, 0, lh)} fill={fW(MAT_DOOR.lit)} />);
    let slats = "";
    for (let s = 24; s < lh; s += 24) slats += `M${Pt(wp(lx0, s, 0))}L${Pt(wp(lx1, s, 0))}`;
    wl.push(<path key="ls" d={slats} stroke={fW(MAT_DOOR.mid)} strokeWidth={lw * 1.1} fill="none" />);
    wl.push(<path key="lb" d={quad(lx0 - 40, lx1 + 40, lh + 26, lh + 70)} fill={fW(MAT_DOOR.mid)} />);
    // the rim on the wall's top edge (light from the upper left)
    wl.push(<path key="wr" d={`M${Pt(wp(x0, WH, 0))}L${Pt(wp(x1, WH, 0))}`} stroke={CREAM} strokeOpacity={0.45 * (1 - A.fog(mid.Z))} strokeWidth={lw * 1.2} />);
  } else {
    // its inner face (up, once it lies down)
    wl.push(<path key="wi" d={quad(x0, x1, 0, WH, wall)} fill={fW(mixHex(MAT_HALLWALL.lit, MAT_HALLWALL.mid, 0.3))} stroke={wln} strokeWidth={lw} />);
    let seams = "";
    for (let X = x0 + 214; X < x1 - 20; X += 214) seams += `M${Pt(wp(X, 0, wall))}L${Pt(wp(X, WH, wall))}`;
    wl.push(<path key="wis" d={seams} stroke={fW(lineOf(MAT_HALLWALL))} strokeWidth={lw * 0.8} strokeOpacity={0.3} fill="none" />);
  }
  if (topSeen && phi > 0.001) wl.push(<path key="wt" d={poly([wp(x0, WH, 0), wp(x1, WH, 0), wp(x1, WH, wall), wp(x0, WH, wall)])} fill={fW(MAT_OATMEAL.lit)} stroke={wln} strokeWidth={lw} />);
  // the wall's shadow on the ground under it as it comes down
  if (phi > 0.02) {
    const reach = WH * sphi;
    els.push(<path key="wsh" d={poly([P.p(x0, 0, ez0 - reach * 1.02), P.p(x1 + 80, 0, ez0 - reach * 1.02), P.p(x1 + 80, 0, ez0), P.p(x0, 0, ez0)])} fill={PAL.shadow} fillOpacity={0.14 * sphi * (1 - A.fog(ez0))} />);
  }
  els.push(<g key="wall">{wl}</g>);
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE DESK
// ===================================================================================================================
export const DESK = { w: 1.4 * U, d: 0.7 * U, h: 0.75 * U, seat: 82 } as const;
export type DeskSeat = "front" | "behind" | "left" | "right";
type V3 = { X: number; Y: number; Z: number };
export type DeskAnchors = { at: { X: number; Z: number }; hips: V3; seatTop: V3; hands: V3; screen: V3; dir: 1 | -1 | 0; view: "back" | "front" | "profile" };
const DH = Math.round(DESK.h);
const DW2 = DESK.w / 2;
const DD = DESK.d;
export const deskAnchors = (X: number, Z: number, seat: DeskSeat): DeskAnchors => {
  const seatY = -DESK.seat;
  if (seat === "front") {
    const sz = Z - 52;
    return { at: { X, Z: sz }, hips: { X, Y: seatY - 16, Z: sz }, seatTop: { X, Y: seatY, Z: sz }, hands: { X: X - 9, Y: -DH - 4, Z: Z + 30 }, screen: { X, Y: -192, Z: Z + DD - 30 }, dir: 0, view: "back" };
  }
  if (seat === "behind") {
    const sz = Z + DD + 52;
    return { at: { X, Z: sz }, hips: { X, Y: seatY - 16, Z: sz }, seatTop: { X, Y: seatY, Z: sz }, hands: { X: X + 9, Y: -DH - 4, Z: Z + DD - 30 }, screen: { X, Y: -192, Z: Z + 26 }, dir: 0, view: "front" };
  }
  const s = seat === "left" ? -1 : 1;
  const sx = X + s * (DD / 2 + 52);
  const zc = Z + DW2;
  return { at: { X: sx, Z: zc }, hips: { X: sx, Y: seatY - 16, Z: zc }, seatTop: { X: sx, Y: seatY, Z: zc }, hands: { X: X + s * (DD / 2 - 30), Y: -DH - 4, Z: zc }, screen: { X: X - s * 32, Y: -192, Z: zc }, dir: seat === "left" ? 1 : -1, view: "profile" };
};

const Chair: React.FC<{ A: AirWorld; X: number; Z: number; back: "-z" | "+z" | "-x" | "+x"; uid: string; part: "base" | "back" | "all" }> = ({ A, X, Z, back, uid, part }) => {
  const P = A.P;
  const els: React.ReactNode[] = [];
  const fab = MAT_FABRIC;
  const iron = MAT.iron;
  if (part !== "back") {
    // five-star base and casters, the gas column, the seat
    els.push(<AirBox key="bx" A={A} X0={X - 52} X1={X + 52} Y0={-16} Y1={-10} Z0={Z - 4} Z1={Z + 4} mat={iron} uid={`${uid}-bx`} rim={0.5} />);
    els.push(<AirBox key="bz" A={A} X0={X - 4} X1={X + 4} Y0={-16} Y1={-10} Z0={Z - 52} Z1={Z + 52} mat={iron} uid={`${uid}-bz`} rim={0.5} />);
    const cast: P2[] = [
      [X - 50, Z],
      [X + 50, Z],
      [X, Z - 50],
      [X, Z + 50],
    ];
    cast.forEach(([cx, cz], i) => {
      const c = P.p(cx, -5, cz);
      els.push(<ellipse key={`c${i}`} cx={c[0]} cy={c[1]} rx={6 * P.r(cz)} ry={5 * P.r(cz)} fill={A.tone(iron.dark, cz, 5)} />);
    });
    els.push(<AirBox key="col" A={A} X0={X - 4} X1={X + 4} Y0={-DESK.seat + 12} Y1={-16} Z0={Z - 4} Z1={Z + 4} mat={iron} uid={`${uid}-col`} rim={0.4} />);
    els.push(<AirBox key="seat" A={A} X0={X - 44} X1={X + 44} Y0={-DESK.seat} Y1={-DESK.seat + 12} Z0={Z - 44} Z1={Z + 44} mat={fab} uid={`${uid}-st`} />);
  }
  if (part !== "base") {
    const bk =
      back === "-z"
        ? { X0: X - 40, X1: X + 40, Z0: Z - 52, Z1: Z - 44 }
        : back === "+z"
          ? { X0: X - 40, X1: X + 40, Z0: Z + 44, Z1: Z + 52 }
          : back === "-x"
            ? { X0: X - 52, X1: X - 44, Z0: Z - 40, Z1: Z + 40 }
            : { X0: X + 44, X1: X + 52, Z0: Z - 40, Z1: Z + 40 };
    const sx = (bk.X0 + bk.X1) / 2;
    const sz = (bk.Z0 + bk.Z1) / 2;
    els.push(<AirBox key="post" A={A} X0={sx - 4} X1={sx + 4} Y0={-120} Y1={-DESK.seat} Z0={sz - 3} Z1={sz + 3} mat={iron} uid={`${uid}-po`} rim={0.4} />);
    els.push(<AirBox key="bk" A={A} X0={bk.X0} X1={bk.X1} Y0={-232} Y1={-112} Z0={bk.Z0} Z1={bk.Z1} mat={fab} uid={`${uid}-bk`} />);
  }
  return <g>{els}</g>;
};

export const Desk: React.FC<{ A: AirWorld; X: number; Z: number; uid: string; seat?: DeskSeat; layer?: "back" | "front" | "all"; screen?: number; frame?: number; mug?: boolean }> = ({ A, X, Z, uid, seat = "front", layer = "all", screen = 1, mug = true }) => {
  const P = A.P;
  const an = deskAnchors(X, Z, seat);
  const lam = MAT_LAMINATE;
  const iron = MAT.iron;
  const along = seat === "front" || seat === "behind";
  // desk extents
  const dx0 = along ? X - DW2 : X - DD / 2;
  const dx1 = along ? X + DW2 : X + DD / 2;
  const dz0 = Z;
  const dz1 = along ? Z + DD : Z + DESK.w;
  const zc = (dz0 + dz1) / 2;
  const scr = c01(screen);
  const screenCol = mixHex(mixHex(MAT_MONITOR.mid, PAL.shadow, 0.2), SCREEN, scr);
  const glowA = 0.28 * scr * (1 - A.fog(zc));
  const deskParts: React.ReactNode[] = [];
  // legs (side panels) and a modesty panel
  if (along) {
    deskParts.push(<AirBox key="lgL" A={A} X0={dx0 + 2} X1={dx0 + 8} Y0={-DH + 6} Y1={0} Z0={dz0 + 8} Z1={dz1 - 8} mat={iron} uid={`${uid}-lgL`} rim={0.5} />);
    deskParts.push(<AirBox key="lgR" A={A} X0={dx1 - 8} X1={dx1 - 2} Y0={-DH + 6} Y1={0} Z0={dz0 + 8} Z1={dz1 - 8} mat={iron} uid={`${uid}-lgR`} rim={0.5} />);
    const mz = seat === "front" ? dz1 - 12 : dz0 + 8;
    deskParts.push(<AirBox key="mod" A={A} X0={dx0 + 8} X1={dx1 - 8} Y0={-DH + 6} Y1={-DH + 70} Z0={mz} Z1={mz + 4} mat={iron} uid={`${uid}-mod`} rim={0.3} />);
  } else {
    deskParts.push(<AirBox key="lgN" A={A} X0={dx0 + 8} X1={dx1 - 8} Y0={-DH + 6} Y1={0} Z0={dz0 + 2} Z1={dz0 + 8} mat={iron} uid={`${uid}-lgN`} rim={0.5} />);
    deskParts.push(<AirBox key="lgF" A={A} X0={dx0 + 8} X1={dx1 - 8} Y0={-DH + 6} Y1={0} Z0={dz1 - 8} Z1={dz1 - 2} mat={iron} uid={`${uid}-lgF`} rim={0.5} />);
  }
  // the top
  deskParts.push(<AirBox key="top" A={A} X0={dx0} X1={dx1} Y0={-DH} Y1={-DH + 6} Z0={dz0} Z1={dz1} mat={lam} uid={`${uid}-top`} />);
  // keyboard and mouse
  const kb = an.hands;
  if (along) {
    deskParts.push(<AirBox key="kb" A={A} X0={kb.X - 39} X1={kb.X + 39} Y0={-DH - 4} Y1={-DH} Z0={kb.Z - 12} Z1={kb.Z + 12} mat={MAT_KEYS} uid={`${uid}-kb`} rim={0.4} />);
    const mx = seat === "front" ? kb.X + 62 : kb.X - 62;
    deskParts.push(<AirBox key="ms" A={A} X0={mx - 5} X1={mx + 5} Y0={-DH - 4} Y1={-DH} Z0={kb.Z - 8} Z1={kb.Z + 8} mat={MAT_KEYS} uid={`${uid}-ms`} rim={0.4} />);
  } else {
    deskParts.push(<AirBox key="kb" A={A} X0={kb.X - 12} X1={kb.X + 12} Y0={-DH - 4} Y1={-DH} Z0={kb.Z - 39} Z1={kb.Z + 39} mat={MAT_KEYS} uid={`${uid}-kb`} rim={0.4} />);
  }
  // a mug (8 cm across, 10 cm tall, cream glaze, dark coffee) on the side away from the mouse
  if (mug) {
    const mgX = along ? (seat === "front" ? kb.X - 74 : kb.X + 74) : kb.X + (seat === "left" ? 10 : -10);
    const mgZ = along ? kb.Z + (seat === "front" ? 26 : -26) : kb.Z + 66;
    const R0 = 7.2;
    const yT = -DH - 18;
    const ell = (Y: number) => {
      const c = P.p(mgX, Y, mgZ);
      const n = P.p(mgX, Y, mgZ - R0);
      const f = P.p(mgX, Y, mgZ + R0);
      return { cx: c[0], cy: (n[1] + f[1]) / 2, rx: R0 * P.r(mgZ), ry: Math.max(0.6, Math.abs(n[1] - f[1]) / 2) };
    };
    const eb = ell(-DH);
    const et = ell(yT);
    const mugLit = A.tone("#EDE3CF", mgZ, DH + 9);
    const mugSh = A.tone("#C4B59B", mgZ, DH + 9);
    const hs = seat === "left" || (along && seat === "behind") ? -1 : 1;
    deskParts.push(
      <g key="mug">
        <path d={`M${hs > 0 ? et.cx + et.rx * 0.9 : et.cx - et.rx * 0.9},${et.cy + (eb.cy - et.cy) * 0.22}q${hs * et.rx * 0.85},${(eb.cy - et.cy) * 0.1} 0,${(eb.cy - et.cy) * 0.55}`} stroke={mugSh} strokeWidth={Math.max(1.2, 2.4 * P.r(mgZ))} fill="none" />
        <path d={`M${eb.cx - eb.rx},${et.cy}L${eb.cx - eb.rx},${eb.cy}A${eb.rx},${eb.ry} 0 0 0 ${eb.cx + eb.rx},${eb.cy}L${eb.cx + eb.rx},${et.cy}Z`} fill={mugLit} />
        <path d={`M${eb.cx + eb.rx * 0.35},${et.cy}L${eb.cx + eb.rx * 0.35},${eb.cy + eb.ry * 0.9}A${eb.rx},${eb.ry} 0 0 0 ${eb.cx + eb.rx},${eb.cy}L${eb.cx + eb.rx},${et.cy}Z`} fill={mugSh} fillOpacity={0.6} />
        <ellipse cx={et.cx} cy={et.cy} rx={et.rx} ry={et.ry} fill={mugLit} />
        <ellipse cx={et.cx} cy={et.cy + et.ry * 0.08} rx={et.rx * 0.8} ry={et.ry * 0.78} fill={A.tone(mixHex(PAL.shadow, "#4A3426", 0.5), mgZ, DH + 18)} />
      </g>,
    );
  }
  // the monitor: foot, neck, panel, screen
  const sc = an.screen;
  const SW2 = 49;
  const sy0 = -222;
  const sy1 = -163;
  const monitor: React.ReactNode[] = [];
  if (along) {
    const pz0 = seat === "front" ? sc.Z : sc.Z - 4;
    const neckZ = seat === "front" ? sc.Z + 6 : sc.Z - 10;
    monitor.push(<AirBox key="ft" A={A} X0={sc.X - 22} X1={sc.X + 22} Y0={-DH - 2} Y1={-DH} Z0={neckZ - 12} Z1={neckZ + 16} mat={MAT_MONITOR} uid={`${uid}-ft`} rim={0.3} />);
    monitor.push(<AirBox key="nk" A={A} X0={sc.X - 5} X1={sc.X + 5} Y0={sy1} Y1={-DH - 2} Z0={neckZ} Z1={neckZ + 5} mat={MAT_MONITOR} uid={`${uid}-nk`} rim={0.3} />);
    monitor.push(<AirBox key="pn" A={A} X0={sc.X - SW2} X1={sc.X + SW2} Y0={sy0} Y1={sy1} Z0={pz0} Z1={pz0 + 4} mat={MAT_MONITOR} uid={`${uid}-pn`} />);
    if (seat === "front") {
      // the screen on its front, with faint lines of text
      const q = [P.p(sc.X - SW2 + 3, sy0 + 3, pz0), P.p(sc.X + SW2 - 3, sy0 + 3, pz0), P.p(sc.X + SW2 - 3, sy1 - 3, pz0), P.p(sc.X - SW2 + 3, sy1 - 3, pz0)];
      monitor.push(<path key="sg" d={poly([P.p(sc.X - SW2 - 24, sy0 - 22, pz0), P.p(sc.X + SW2 + 24, sy0 - 22, pz0), P.p(sc.X + SW2 + 24, sy1 + 22, pz0), P.p(sc.X - SW2 - 24, sy1 + 22, pz0)])} fill={CREAM} fillOpacity={glowA * 0.35} />);
      monitor.push(<path key="sc" d={poly(q)} fill={A.tone(screenCol, pz0, 190)} />);
      if (scr > 0.05) {
        let ln = "";
        for (let i = 0; i < 6; i++) {
          const y = sy0 + 11 + i * 7.4;
          const w = 40 + 34 * random(`tenEarthsDesk-${uid}-${i}`);
          ln += `M${Pt(P.p(sc.X - SW2 + 10 + (i % 3 === 2 ? 8 : 0), y, pz0))}L${Pt(P.p(sc.X - SW2 + 10 + w, y, pz0))}`;
        }
        monitor.push(<path key="tx" d={ln} stroke={A.tone(MAT_MONITOR.lit, pz0, 190)} strokeOpacity={0.35 * scr} strokeWidth={2.2 * P.r(pz0)} strokeLinecap="round" />);
      }
    } else {
      // seen from behind: the panel's back with a vent; the glow spills over its edges onto the sitter
      monitor.push(<path key="vt" d={poly([P.p(sc.X - 20, sy0 + 12, pz0), P.p(sc.X + 20, sy0 + 12, pz0), P.p(sc.X + 20, sy0 + 18, pz0), P.p(sc.X - 20, sy0 + 18, pz0)])} fill={A.tone(MAT_MONITOR.dark, pz0, 190)} />);
    }
  } else {
    const s = seat === "left" ? -1 : 1;
    const px0 = seat === "left" ? sc.X : sc.X - 4;
    monitor.push(<AirBox key="ft" A={A} X0={sc.X - 14} X1={sc.X + 14} Y0={-DH - 2} Y1={-DH} Z0={sc.Z - 22} Z1={sc.Z + 22} mat={MAT_MONITOR} uid={`${uid}-ft`} rim={0.3} />);
    monitor.push(<AirBox key="nk" A={A} X0={sc.X - s * 8 - 3} X1={sc.X - s * 8 + 3} Y0={sy1} Y1={-DH - 2} Z0={sc.Z - 5} Z1={sc.Z + 5} mat={MAT_MONITOR} uid={`${uid}-nk`} rim={0.3} />);
    monitor.push(<AirBox key="pn" A={A} X0={px0} X1={px0 + 4} Y0={sy0} Y1={sy1} Z0={sc.Z - SW2} Z1={sc.Z + SW2} mat={MAT_MONITOR} uid={`${uid}-pn`} />);
    // the screen face (toward the sitter): seen only when it faces the vanishing point
    const fx = seat === "left" ? px0 : px0 + 4;
    const faceSeen = seat === "left" ? fx > P.vp[0] : fx < P.vp[0];
    if (faceSeen) monitor.push(<path key="sc" d={poly([P.p(fx, sy0 + 3, sc.Z - SW2 + 3), P.p(fx, sy0 + 3, sc.Z + SW2 - 3), P.p(fx, sy1 - 3, sc.Z + SW2 - 3), P.p(fx, sy1 - 3, sc.Z - SW2 + 3)])} fill={A.tone(screenCol, sc.Z, 190)} />);
  }
  // the screen's glow in the air (front of the sitter for "behind", around the screen otherwise)
  const glowC = P.p(seat === "behind" ? an.hips.X : sc.X, seat === "behind" ? -228 : -192, seat === "behind" ? an.hips.Z - 30 : sc.Z);
  const glowR = 150 * P.r(sc.Z);
  const glow = scr > 0.01 ? (
    <g key="gl">
      <defs>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0" stopColor={CREAM} stopOpacity={glowA} />
          <stop offset="0.5" stopColor={CREAM} stopOpacity={glowA * 0.35} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={glowC[0]} cy={glowC[1]} rx={glowR} ry={glowR * 0.85} fill={`url(#${uid}-glow)`} style={{ mixBlendMode: "screen" }} />
    </g>
  ) : null;
  // the chair
  const chairBack = seat === "front" ? "-z" : seat === "behind" ? "+z" : seat === "left" ? "-x" : "+x";
  const chairAt = an.seatTop;
  const shadowD = poly([P.p(dx0 - 6, 0, dz0 - 10), P.p(dx1 + 30, 0, dz0 - 10), P.p(dx1 + 30, 0, dz1 + 10), P.p(dx0 - 6, 0, dz1 + 10)]);
  const deskShadow = <path key="dsh" d={shadowD} fill={PAL.shadow} fillOpacity={0.16 * (1 - A.fog(zc))} />;
  const chairShadowC = P.p(chairAt.X + 10, 0, chairAt.Z);
  const chairShadow = <ellipse key="csh" cx={chairShadowC[0]} cy={chairShadowC[1]} rx={60 * P.r(chairAt.Z)} ry={22 * P.r(chairAt.Z)} fill={PAL.shadow} fillOpacity={0.2 * (1 - A.fog(chairAt.Z))} />;
  const chairAll = (part: "base" | "back" | "all") => <Chair key={`ch-${part}`} A={A} X={chairAt.X} Z={chairAt.Z} back={chairBack} uid={`${uid}-ch-${part}`} part={part} />;
  const deskG = <g key="desk">{deskParts}</g>;
  const monG = <g key="mon">{monitor}</g>;
  let back: React.ReactNode[] = [];
  let front: React.ReactNode[] = [];
  if (seat === "front") {
    back = [deskShadow, chairShadow, deskG, monG, glow, chairAll("base")];
    front = [chairAll("back")];
  } else if (seat === "behind") {
    back = [deskShadow, chairShadow, chairAll("all")];
    front = [deskG, monG, glow];
  } else {
    back = [deskShadow, chairShadow, chairAll("all"), deskG, monG, glow];
  }
  return <g>{layer === "back" ? back : layer === "front" ? front : [...back, ...front]}</g>;
};

// ===================================================================================================================
// THE YEAR PLATE
// ===================================================================================================================
export const yearPlateT = (frame: number, f0: number, dur = 12) => c01((frame - f0) / dur);
export const YearPlate: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; text: string; t: number; uid: string; size?: number; weight?: 400 | 700; plate?: number; letterSpacing?: number }> = ({
  A,
  X,
  Y,
  Z,
  text,
  t,
  uid,
  size = 120,
  weight = 700,
  plate = 1,
  letterSpacing = 0.02,
}) => {
  if (t <= 0) return null;
  const P = A.P;
  const r = P.r(Z);
  const c = P.p(X, Y, Z);
  const s = size * r;
  const e = easeOut(t);
  const lift = 0.5 * s * (1 - e);
  // a rough text width (Caslon figures ~0.6 em, lower case ~0.5 em)
  const wEm = [...text].reduce((a, ch) => a + (ch === " " ? 0.27 : /[0-9×x]/.test(ch) ? 0.62 : /[.,]/.test(ch) ? 0.28 : 0.52), 0);
  const tw = wEm * s;
  return (
    <g opacity={sstep(t)} transform={`translate(0 ${f2(lift)})`}>
      <defs>
        <radialGradient id={`${uid}-pl`}>
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.6 * plate} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.42 * plate} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {plate > 0 ? <ellipse cx={c[0]} cy={c[1]} rx={tw * 0.72 + s * 0.75} ry={s * 0.92} fill={`url(#${uid}-pl)`} /> : null}
      <text
        x={c[0]}
        y={c[1] + s * 0.34}
        textAnchor="middle"
        fill={CREAM}
        stroke={PAL.shadow}
        strokeOpacity={0.85}
        strokeWidth={s * 0.14}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: CASLON, fontWeight: weight, fontSize: s, letterSpacing: letterSpacing * s, fontVariantNumeric: "lining-nums" }}
      >
        {text}
      </text>
    </g>
  );
};
