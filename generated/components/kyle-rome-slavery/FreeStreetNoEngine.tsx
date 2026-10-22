// ---------------------------------------------------------------------------
// FreeStreetNoEngine (kyle-rome-slavery, cut 61). Dwarkesh map style (styles/dwarkesh-map.md), in the London clip's 3D
// depth manner (one camera in one-point perspective, a ground plane, volumes lit from the upper left, contact and form
// shadows, atmospheric depth, parallax on the dolly; ../kyle-london/londonDepth.tsx, read only).
// Opaque 1080x1920, 29.97 fps, 288 frames. The street, the shops, the timeline and the camera: ./freeStreetPlan.ts.
//
// CHECK LINE: "Most Roman workshops were run by free people — and they worked by hand just the same; the steam engine
// stayed out of reach either way."
//
// THE LINE: "(…ultimately) I don't think it's the system of labor that keeps the Roman world from industrializing. And
// there are lots of sectors in the Roman world where slavery is not a dominant institution."
// WORD -> FRAME: I 7 · don't 17 · think 24 · it's 28 · the 38 · system 42 · of 61 · labor 72 · that 80 · keeps 90 ·
// the 99 · Roman 107 · world 120 · from 132 · from 143 · industrializing 158 · And 177 · there 182 · are 185 · lots 187
// · of 192 · sectors 197 · in 204 · the 211 · Roman 212 · world 216 · where 225 · slavery 230 · is 238 · not 244 ·
// a 251 · dominant 257 · institution 267 · (cut at 288; he goes on "And it's not like they're more productive…")
// DURATION: the slot 61.061 -> 70.671 s = 9.610 s x 29.97 = 288 frames (f0..f287).
//
// THE MOTION: one continuous dolly forward down a narrow Pompeii street of shops (basalt road, high pavements,
// stepping stones, open shop fronts under timber lintels, an upper storey, tiled eaves). f0-80 ("the system of
// labor"): a slow dolly on the first shop at the left, a mill-bakery worked by slaves (romeCast Slaves in fetters: one
// kneeling at a rotary quern, his fist on its handle, one carrying a sack in off the pavement), the overseer with his
// rod at the door; a lens shift frames it with the vanishing point just off the right edge. f60-156: the dolly
// gathers speed past it while the shift returns to the centre line, so the far end of the street swings in and cut A's
// steam engine — a fine DASHED ORANGE outline, the machine never built — stands small in the haze at the VP, centred on
// "industrializing" (f158). It stands ~70 m off (Z 12500 units; the whole dolly covers ~3600 units, ~20 m), so the
// dolly gains little on it: ~135 px tall while still off frame, 147 px at f158, 172 px at f287. f160-287 ("lots of sectors where slavery is not a dominant institution"): shop after shop, both
// sides, run by FREE people (pilleus caps, aprons, a woman at her counter), every one working by hand: a free man at
// the same rotary quern, a potter at his wheel, a baker sliding a loaf into his oven on a long peel, a smith
// hammering at his anvil, a cobbler stitching a shoe, a man at his counter. Pass 2: one at a time, alternating sides,
// 28 frames apart (FEATURED in the plan), on a narrow street so each grows to ~450-650 px as the straight dolly
// carries us past. Revision 1: the camera runs on ONE straight track down the street's axis (its only lateral move is
// the opening's ease onto the axis, in the same lobe as the lens shift), at a steady walk after an eased start. No text.
// CAUSE BEFORE EFFECT: the grinders' fists are on the quern handles on every frame (romeCast grip); the smith's hammer
// head meets the anvil's top at phase 0 of each blow; the baker's fists stay on his peel.
// Orange = only the dashed engine (the clip rule: dashed orange = the machine that could have been but was never
// built). People, bread, cloth and pots are never orange (V3: muted earthy folk colours, terracotta pots).
// DEPTH: one pinhole camera (eye 200 units up, focal 1000, horizon at screen y 1010; a lens shift, never a rotation, so
// verticals stay vertical and every receding edge meets the one VP); the road, kerbs and pavements as ground planes,
// shop fronts as planes with their openings, jambs, lintels and eaves as volumes, the left row turned away from the
// light (darker), the right row lit; contact shadows, form shadow on the figures (shade 1), one haze function by
// distance from the camera; painter's order by depth.
// FACTS (illustrative; no figures on screen): most Roman labour outside elite households, mines and the big Italian
// estates was free (peasant farmers, tenants, free and freed artisans and shopkeepers); Kyle Harper, Slavery in the
// Late Roman World AD 275-425 (2011), estimates slaves at roughly 10 % of the empire's population. Pompeii's shops and
// workshops (bakeries with rotary mills and domed ovens, fulleries with treading stalls, smithies, counters with dolia
// set in them) were many of them run by free or freed owners. The engine is cut A's (MuscleOrMachine): a Boulton & Watt
// rotative engine (sun-and-planet gear, 1781) heading a line shaft over millstones, as at the Albion Mills (1786).
//
// V3 (Oct 22, the pandemics clip's final look carried onto Rome; notes/V3_COMMON.md): the street now stands INSIDE the
// clip's medium (kyle-pandemics/pandemicAir.tsx, palette A, mood day; read only): a misty teal air graded by height,
// soft diagonal shafts from the upper left, motes at three depths parallaxing on the dolly, the soft-light grade,
// grain, a brown vignette and a faint bloom on orange. The paper page is gone. Every plane fogs by its own distance
// toward the air at that distance (fogHex): the road, pavements and plaza as ONE continuous tone by screen row (a
// ground plane's distance is a function of its row), the shop fronts and kerb faces by screen column (a wall
// plane's distance is a function of its column), so nothing bands; the far end dissolves into the haze with the
// dashed orange engine glowing small in it (its orange takes only a third of the fog, plus a faint halo; bloom 0.22).
// Re-lit materials (local colour near, the air's with distance): plaster oatmeal (the right row lit, the left row in
// shade), red-brown stucco socles and a stucco band at the upper floor, timber umber lintels, joists and boards,
// terracotta eaves, grey-umber basalt slabs with darker joints, sandy pavements; soft form light from above, a cream
// rim on top / upper-left edges, thin outlines in a darker local colour, no hatching, no black casing. Shop rooms are
// dim warm umber, never black. Contact shadows in the medium's shadow colour, fading with the fog. The baker's oven
// mouth holds a dull red ember (not the clip's orange). Concept, timing, the one straight dolly and every Revision-1
// fix are unchanged (the plan is untouched).
// V3 CAST: the people and their props are romeFolk (the pandemics' picture-book gouache; same poses, grips, anchors
// and props as romeCast), each sunk into the air by its own distance and height (figFog -> romeFolk's `fog`; the
// carrier walking into the mill's room sinks toward the room's dim). The seated, kneeling and leaning freemen (the
// free grinder, potter, cobbler, baker) go without the leather apron (in profile it read as a board); the smith and
// the sellers keep it; the pilleus says free. The lean freeman's ochre tunic is muted to khaki (#9A9070) via `inks`. The overseer's rod lift on "labor" is smaller (0.32 -> 0.1 of
// raiseRod), so the bigger folk head never has the rod across his face. The cobbler's shoe, the hanging sandals,
// the smith's bar and the loaf are flat shapes with a darker local edge (no engraved casing).
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg } from "../kits/maps/texcocoShared";
import { sway, swayCam, type P2 } from "../kits/maps/incaShared";
import { CENTRE_D, HUB_RING_R, PITCH_R, RIM_R } from "../kyle-london/orbitWorld";
import { type Persp } from "../kyle-london/londonDepth";
import { AirHorizonHaze, AirStage, fogHex, fogMix, formTone, hexRgb, makeAirView, mixHex as airMix, mixRgb, type AirScene, type AirView, type Mat } from "../kyle-pandemics/pandemicAir";
import { AXLE_Y, ENG_S, FLY_PITCH, HURST, PIN_PITCH, SHAFT_Y, STAND as ASTAND, STONE_R } from "./muscleOrMachinePlan";
import {
  Amphora,
  Basket,
  Freeman,
  Overseer,
  POSES,
  POTTER,
  PUSH,
  PotterWheel,
  RotaryQuern,
  Sack,
  Slave,
  Stool,
  headTurn,
  idle,
  quernHandle,
  romeAnchors,
  type FigPose,
  type FolkFog,
} from "./romeFolk";
import {
  BACK_X,
  CROSSINGS,
  DURATION,
  EAVE_OUT,
  ENGINE_X,
  ENGINE_Z,
  EYE_Y,
  FACADE_X,
  FOCAL,
  HORIZON,
  FPS,
  LINTEL_H,
  LINTEL_Y,
  PAVE_Y,
  ROAD_HW,
  SHOPS,
  STONE,
  STREET_END,
  UPPER_TOP,
  WALL_T,
  camAt,
  project,
  rAt,
  type Shop,
  type StreetCam,
} from "./freeStreetPlan";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// V3 THE MEDIUM (pandemicAir palette A, mood day) and the street's local colours re-lit for it (before fog)
// ---------------------------------------------------------------------------
/** the air of this street, in cast units (~177 a metre): the featured shops (~620 ahead) stay clear, the street's
 *  far end (~2000-5600 ahead) sinks into the air, the engine (~7400-11000 ahead) stands in the haze */
export const AIR_SCENE: AirScene = { look: "A", mood: "day", F: FOCAL, fogNear: 600, fogVis: 2000, fogMax: 0.96, hLow: 0, hHigh: 1100, moteUnit: 177 };
/** materials {lit, mid, dark} (local colours near; the air takes them with distance) */
const PLASTER: Mat = { lit: "#C3B293", mid: "#A39375", dark: "#6E614E" };
const STUCCO: Mat = { lit: "#916452", mid: "#784F41", dark: "#4B322A" };
const TIMBER_M: Mat = { lit: "#7C5D40", mid: "#5E452F", dark: "#36271B" };
const TILE: Mat = { lit: "#9C6A4E", mid: "#77503B", dark: "#432D22" };
const STONE_M: Mat = { lit: "#968B7C", mid: "#72685C", dark: "#4A4239" };
/** the raised platforms the querns and the smith stand on: the pavement's own stone, so they read as soft blocks */
const PLATFORM_M: Mat = { lit: "#A39377", mid: "#8A7B63", dark: "#6A5D4C" };
const MARBLE: Mat = { lit: "#D6CAB2", mid: "#B4A78C", dark: "#7A6F5C" };
const OVEN_M: Mat = { lit: "#A48A6E", mid: "#836C55", dark: "#4D3D30" };
const IRON_M: Mat = { lit: "#6E7270", mid: "#4E5254", dark: "#2A2D2F" };
/** the two rows' fronts: the right row faces the light (upper left), the left row is turned away from it */
const FRONT_R = PLASTER.lit;
const FRONT_L = airMix(PLASTER.mid, PLASTER.dark, 0.45);
const SOCLE_R = STUCCO.lit;
const SOCLE_L = airMix(STUCCO.mid, STUCCO.dark, 0.4);
const ROOM = { back: "#544638", floor: "#4A3E32", far: "#4E4134", ceil: "#41362B", joist: "#4E3D2D" };
const WINDOW_C = "#3B3129";
const BOARD_C = TIMBER_M.mid;
/** the ground: basalt slabs (grey-umber) with darker joints and ruts, sandy pavement tops, the kerbs' faces, the plaza */
const SLAB_C = "#6A6157";
const JOINT_C = "#443C34";
const RUT_C = "#4A4239";
const PAVE_C = "#8F7F65";
const KERB_L_C = "#62564A";
const KERB_R_C = "#8C7C64";
const PLAZA_C = "#7E6F57";

const NEAR = 40; // near clip, units in front of the eye
const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
const pt = (v: P2) => `${fx(v[0])},${fx(v[1])}`;
const poly = (q: P2[]) => `M${q.map(pt).join("L")}Z`;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const CREAM_HEX = "#F3EBDD";
const cream = (a: number) => {
  const v = Math.max(0, a);
  return `rgba(243,235,221,${v.toFixed(3)})`;
};
/** the line weight at depth ratio r (thinner with distance) */
const lw = (r: number, w = 1.8) => Math.max(0.5, Math.min(3.2, w * Math.pow(r, 0.7)));

/** the lean freeman's (variant 1) ochre tunic muted to a khaki olive-grey in this cut (director, V3): near the lens
 *  and beside the engine the ochre read as the clip's orange; teal, red-brown and oatmeal tunics stay */
const KHAKI = { tunic: "#9A9070" };
/** where a thing stands in the air: the view, its distance ahead of the eye, and an optional gloom (a shop's room) */
type Hz = { v: AirView; d: number; g?: number };
const hzOf = (v: AirView, C: StreetCam, Z: number, g = 0): Hz => ({ v, d: Math.max(0, Z - C.Z), g });
/** a local colour fogged into the air at that distance (height in units up, default a little over the pavement) */
const hz = (col: string, h: Hz, hgt = 120) => fogHex(h.v, col, h.d, hgt);
/** 1 near .. 0 lost in the air (for cream rims and fine lines that must fade with the fog) */
const vis = (h: Hz) => 1 - c01(h.v.fogAt(h.d));
/** a thin outline in a darker local colour (warm umber), fogged */
const lineOf = (h: Hz, base = "#3A2C20") => hz(base, h);
/** romeFolk's fog for a figure or prop at that distance: toward the air at that distance and height, by the fog
 *  there; a figure walking into a shop's room sinks toward the room's dim instead (h.g) */
const figFog = (h: Hz, hgt = 160): FolkFog => {
  const air = h.v.airAt(h.d, hgt);
  const fog = c01(h.v.fogAt(h.d));
  const g = c01(h.g ?? 0);
  if (g <= 0) return { rgb: air, amount: fog };
  const amount = 1 - (1 - fog) * (1 - g);
  return { rgb: mixRgb(air, hexRgb(ROOM.back), g / Math.max(1e-3, amount)), amount };
};

/** the kit's Persp for our dollying pinhole camera (read p, r, vp[0] and horizonY in 3D terms) */
const makePersp = (C: StreetCam): Persp => ({
  cam: { k: 1, cx: 540, cy: 960 },
  opts: { eyeY: EYE_Y, dRef: FOCAL, kRef: 1, dolly: 0 },
  Dc: FOCAL,
  r: (Z: number) => rAt(C, Z),
  p: (X: number, Y: number, Z: number) => project(C, X, Y, Z),
  at: (X: number, Z: number) => ({ at: project(C, X, 0, Z), scale: rAt(C, Z) }),
  vp: [C.X, EYE_Y],
  horizonY: EYE_Y,
  zNear: C.Z + NEAR,
});

type Item = { Z: number; key: string; el: React.ReactNode; mask?: string };

/** a box from X0..X1, Y0 (top, < Y1)..Y1 (bottom), Z0 (front)..Z1 (back), re-lit for the medium: soft form light
 *  from above (top lit, the left side half lit, the front mid, the right side and the underside in shade sinking
 *  toward the medium's shadow), thin outlines in a darker local colour, a cream rim on the lit top / left edges, the
 *  whole fogged by its distance. No hatching, no casing. */
const AirBox: React.FC<{ P: Persp; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; mat: Mat; h: Hz; uid: string; hatch?: boolean }> = ({ P, X0, X1, Y0, Y1, Z0, Z1, mat, h }) => {
  const p = P.p;
  const r = P.r((Z0 + Z1) / 2);
  const sh = h.v.pal.shadow;
  const hgt = -(Y0 + Y1) / 2;
  const col = (c: string) => hz(c, h, hgt);
  const line = col(airMix(mat.dark, sh, 0.45));
  const sw = lw(r, 0.9);
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  const face = (q: P2[], fill: string, key: string) => els.push(<path key={key} d={poly(q)} fill={col(fill)} stroke={line} strokeWidth={sw} strokeLinejoin="round" />);
  if (Y1 < P.horizonY) face([p(X0, Y1, Z0), p(X1, Y1, Z0), p(X1, Y1, Z1), p(X0, Y1, Z1)], airMix(mat.dark, sh, 0.35), "bt");
  if (X0 > vx) face([p(X0, Y0, Z0), p(X0, Y0, Z1), p(X0, Y1, Z1), p(X0, Y1, Z0)], airMix(mat.lit, mat.mid, 0.4), "lf");
  if (X1 < vx) face([p(X1, Y0, Z0), p(X1, Y0, Z1), p(X1, Y1, Z1), p(X1, Y1, Z0)], airMix(mat.mid, formTone(mat, -0.35, sh), 0.55), "rt");
  const topSeen = Y0 > P.horizonY;
  if (topSeen) face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y0, Z1), p(X0, Y0, Z1)], mat.lit, "tp");
  face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y1, Z0), p(X0, Y1, Z0)], mat.mid, "fr");
  // the cream rim where the light catches: the top's front edge (or the front's top edge) and the upper left arris
  const a = vis(h);
  const rim = `M${pt(p(X0, Y1, Z0))}L${pt(p(X0, Y0, Z0))}L${pt(p(X1, Y0, Z0))}${topSeen ? `M${pt(p(X0, Y0, Z0))}L${pt(p(X0, Y0, Z1))}M${pt(p(X1, Y0, Z0))}L${pt(p(X1, Y0, Z1))}` : ""}`;
  els.push(<path key="rim" d={rim} fill="none" stroke={cream(0.5 * a)} strokeWidth={sw * 0.9} strokeLinecap="round" strokeLinejoin="round" />);
  return <g>{els}</g>;
};

/** a soft contact shadow on a surface at height Y (default the floor), in the medium's shadow colour, offset to the
 *  lower right (away from the light), fading with the fog of its distance */
const AirShadow: React.FC<{ P: Persp; v: AirView; C: StreetCam; X: number; Z: number; w: number; d: number; uid: string; amt?: number; Y?: number }> = ({ P, v, C, X, Z, w, d, uid, amt = 1, Y = 0 }) => {
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.25 * d;
  if (Zc - d < C.Z + NEAR) return null;
  const c = P.p(Xc, Y, Zc);
  const rx = w * P.r(Zc);
  const ry = Math.max(1, (P.p(Xc, Y, Zc - d)[1] - P.p(Xc, Y, Zc + d)[1]) / 2);
  const a = amt * (1 - c01(v.fogAt(Zc - C.Z)));
  const sh = v.pal.shadow;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-cs`}>
          <stop offset="0" stopColor={sh} stopOpacity={0.72 * a} />
          <stop offset="0.6" stopColor={sh} stopOpacity={0.42 * a} />
          <stop offset="1" stopColor={sh} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-cs)`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// FOG GRADIENTS: a horizontal plane's distance is a function of its screen ROW, a wall plane's (X = const) of its
// screen COLUMN; so each plane is painted with ONE gradient of its local colour fogged by distance (no bands)
// ---------------------------------------------------------------------------
/** a ground plane at height Y (Y > EYE_Y): stops by screen row from the horizon down (darker a little near) */
const RowGrad: React.FC<{ id: string; v: AirView; Y: number; local: string; nearDark?: number; hgt?: number }> = ({ id, v, Y, local, nearDark = 0.22, hgt = 0 }) => {
  const N = 40;
  const y1 = 2000;
  const e = Y - EYE_Y;
  const stops = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const y = HORIZON + 0.4 + Math.pow(t, 1.8) * (y1 - HORIZON);
    const d = (e * FOCAL) / (y - HORIZON);
    const near = c01((1500 - d) / 1300);
    const base = airMix(local, v.pal.shadow, nearDark * near);
    return <stop key={i} offset={fx((y - HORIZON) / (y1 - HORIZON))} stopColor={fogHex(v, base, d, hgt)} />;
  });
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={HORIZON} x2={0} y2={y1}>
      {stops}
    </linearGradient>
  );
};
/** a wall plane at X: stops by screen column from the frame's edge (near) to the vanishing point (far) */
const ColGrad: React.FC<{ id: string; v: AirView; C: StreetCam; X: number; local: string; hgt: number }> = ({ id, v, C, X, local, hgt }) => {
  const vpx = 540 + C.shift;
  const k = (X - C.X) * FOCAL;
  const xEdge = X < C.X ? Math.min(-400, vpx - 1) : Math.max(1480, vpx + 1);
  const dEdge = Math.max(NEAR, k / (xEdge - vpx));
  const dMax = 14000;
  const N = 28;
  const stops: React.ReactNode[] = [];
  for (let i = 0; i <= N; i++) {
    const d = dEdge * Math.pow(dMax / dEdge, i / N);
    const sx = vpx + k / d;
    const off = (sx - xEdge) / (vpx - xEdge);
    stops.push(<stop key={i} offset={fx(c01(off))} stopColor={fogHex(v, local, d, hgt)} />);
  }
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={fx(xEdge)} y1={0} x2={fx(vpx)} y2={0}>
      {stops}
    </linearGradient>
  );
};

// ---------------------------------------------------------------------------
// THE GROUND: the plaza beyond the street's end, the basalt road (slab joints, cart ruts), the kerbs, the pavements
// ---------------------------------------------------------------------------
/** the road's slab mesh (a jittered grid of irregular basalt slabs, fixed in the world) */
const SLAB_COLS = 3;
const SLAB_DZ = 150;
const ROW0 = -1200;
const NROWS = Math.ceil((STREET_END - ROW0) / SLAB_DZ);
const SLAB_V: P2[][] = Array.from({ length: SLAB_COLS + 1 }, (_, i) =>
  Array.from({ length: NROWS + 1 }, (_, j): P2 => {
    const X = -ROAD_HW + (i * 2 * ROAD_HW) / SLAB_COLS + (i > 0 && i < SLAB_COLS ? (random(`sx${i}-${j}`) - 0.5) * 34 : 0);
    const Z = ROW0 + j * SLAB_DZ + (j > 0 && j < NROWS ? (random(`sz${i}-${j}`) - 0.5) * 60 : 0);
    return [X, Z];
  }),
);
/** a straight world line drawn in pieces, each fading with the fog of its distance (a lit edge, a joint run) */
const fadeLine = (C: StreetCam, v: AirView, a: [number, number, number], b: [number, number, number], col: (fog: number) => string, w: number, key: string, pieces = 24) => {
  const out: React.ReactNode[] = [];
  const zA = Math.max(a[2], C.Z + NEAR);
  if (b[2] <= zA) return out;
  for (let i = 0; i < pieces; i++) {
    const u0 = Math.pow(i / pieces, 1.6);
    const u1 = Math.pow((i + 1) / pieces, 1.6);
    const za = zA + (b[2] - zA) * u0;
    const zb = zA + (b[2] - zA) * u1;
    const lerpP = (z: number): [number, number, number] => {
      const t = (z - a[2]) / (b[2] - a[2]);
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z];
    };
    const p0 = project(C, ...lerpP(za));
    const p1 = project(C, ...lerpP(zb));
    const fog = c01(v.fogAt((za + zb) / 2 - C.Z));
    if (fog > 0.95) break;
    out.push(<path key={`${key}${i}`} d={`M${pt(p0)}L${pt(p1)}`} stroke={col(fog)} strokeWidth={lw(rAt(C, (za + zb) / 2), w)} strokeLinecap="round" fill="none" />);
  }
  return out;
};
const Ground: React.FC<{ C: StreetCam; v: AirView }> = ({ C, v }) => {
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const zA = C.Z + NEAR;
  const els: React.ReactNode[] = [];
  els.push(
    <defs key="gd">
      <RowGrad id="fs-plaza" v={v} Y={0} local={PLAZA_C} />
      <RowGrad id="fs-slab" v={v} Y={0} local={SLAB_C} nearDark={0.12} />
      <RowGrad id="fs-rut" v={v} Y={0} local={RUT_C} nearDark={0.1} />
      <RowGrad id="fs-pave" v={v} Y={PAVE_Y} local={PAVE_C} hgt={80} />
      <ColGrad id="fs-kerbL" v={v} C={C} X={-ROAD_HW} local={KERB_L_C} hgt={40} />
      <ColGrad id="fs-kerbR" v={v} C={C} X={ROAD_HW} local={KERB_R_C} hgt={40} />
    </defs>,
  );
  // the plaza beyond the street (and under everything): one tone by distance, dissolving at the horizon
  els.push(<rect key="plaza" x={-400} y={HORIZON} width={1880} height={1100} fill="url(#fs-plaza)" />);
  // the road (its joint colour) and the pavements' tops and kerb faces, each one continuous plane
  els.push(<path key="road" d={poly([p(-ROAD_HW, 0, zA), p(ROAD_HW, 0, zA), p(ROAD_HW, 0, STREET_END), p(-ROAD_HW, 0, STREET_END)])} fill="url(#fs-slab)" />);
  for (const s of [-1, 1]) {
    const kx = s * ROAD_HW;
    const fxX = s * FACADE_X;
    els.push(<path key={`pv${s}`} d={poly([p(kx, PAVE_Y, zA), p(fxX, PAVE_Y, zA), p(fxX, PAVE_Y, STREET_END), p(kx, PAVE_Y, STREET_END)])} fill="url(#fs-pave)" />);
    els.push(<path key={`kb${s}`} d={poly([p(kx, 0, zA), p(kx, PAVE_Y, zA), p(kx, PAVE_Y, STREET_END), p(kx, 0, STREET_END)])} fill={s < 0 ? "url(#fs-kerbL)" : "url(#fs-kerbR)"} />);
  }
  // the slabs' joints (the pandemics road's manner): few, thin lines in a darker local tone, fading out with the fog
  // well before the far end (the road there is one continuous tone)
  const sjb: Record<number, string> = {};
  const jA = Math.max(0, Math.floor((zA - ROW0) / SLAB_DZ) - 1);
  const addSeg = (a: P2, b: P2) => {
    const za = Math.max(a[1], zA);
    const zb = Math.max(b[1], zA);
    if (Math.max(a[1], b[1]) < zA) return;
    const zm = (a[1] + b[1]) / 2;
    const fb = Math.round(c01(1.7 * v.fogAt(zm - C.Z)) * 12);
    if (fb >= 12) return;
    // clip a segment that starts behind the near plane
    const t = (z: number, q: P2, w: P2) => (q[1] === w[1] ? 0 : (z - q[1]) / (w[1] - q[1]));
    const A: P2 = a[1] < zA ? [a[0] + (b[0] - a[0]) * t(zA, a, b), za] : a;
    const B: P2 = b[1] < zA ? [b[0] + (a[0] - b[0]) * t(zA, b, a), zb] : b;
    sjb[fb] = (sjb[fb] ?? "") + `M${pt(p(A[0], 0, A[1]))}L${pt(p(B[0], 0, B[1]))}`;
  };
  for (let j = jA; j < NROWS; j++) {
    if (ROW0 + j * SLAB_DZ > STREET_END) break;
    for (let i = 0; i < SLAB_COLS; i++) addSeg(SLAB_V[i][j], SLAB_V[i + 1][j]);
    for (let i = 1; i < SLAB_COLS; i++) addSeg(SLAB_V[i][j], SLAB_V[i][j + 1]);
  }
  Object.entries(sjb).forEach(([k, d]) => {
    const fog = Number(k) / 12;
    els.push(<path key={`sj${k}`} d={d} stroke={fogHex(v, JOINT_C, 2400 * fog + 300, 0)} strokeWidth={Math.max(0.6, 1.8 * (1 - fog))} strokeOpacity={0.8 * (1 - fog)} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
  });
  // the cart ruts worn into the slabs (faint)
  let ruts = "";
  for (let Z = Math.ceil(zA / 140) * 140; Z < STREET_END; Z += 140) {
    const zb = Math.min(Z + 140, STREET_END);
    for (const x of [-43, 43]) ruts += poly([p(x - 7, 0, Z), p(x + 7, 0, Z), p(x + 7, 0, zb), p(x - 7, 0, zb)]);
  }
  els.push(<path key="ruts" d={ruts} fill="url(#fs-rut)" opacity={0.32} />);
  // the kerbstones' joints (short verticals on the kerb faces) and the pavement's cross joints, by fog bins
  const jb: Record<number, string> = {};
  for (let Z = Math.ceil(zA / 140) * 140; Z < STREET_END; Z += 140) {
    const fb = Math.round(c01(v.fogAt(Z - C.Z)) * 12);
    if (fb >= 12) break;
    let d = "";
    for (const s of [-1, 1]) {
      d += `M${pt(p(s * ROAD_HW, 0, Z))}L${pt(p(s * ROAD_HW, PAVE_Y, Z))}`;
      if (Math.round(Z / 140) % 2 === 0) d += `M${pt(p(s * ROAD_HW, PAVE_Y, Z))}L${pt(p(s * (ROAD_HW + 60), PAVE_Y, Z))}`;
    }
    jb[fb] = (jb[fb] ?? "") + d;
  }
  Object.entries(jb).forEach(([k, d]) => {
    const fog = Number(k) / 12;
    els.push(<path key={`kj${k}`} d={d} stroke={fogHex(v, "#3E3428", 3000 * fog, 40)} strokeWidth={1} strokeOpacity={0.55 * (1 - fog)} fill="none" />);
  });
  // the kerb's lit arris (a cream rim) receding to the VP, fading with the fog
  for (const s of [-1, 1]) {
    els.push(...fadeLine(C, v, [s * ROAD_HW, PAVE_Y, zA], [s * ROAD_HW, PAVE_Y, STREET_END], (fog) => cream((s < 0 ? 0.32 : 0.5) * (1 - fog)), 1.6, `ke${s}`));
  }
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------
// THE ENGINE THAT WAS NEVER BUILT: cut A's engine (orbitWorld's sun-and-planet flywheel on A's iron A-frame, heading a
// line shaft over millstones), far off at the end of the street, as a fine dashed orange outline only (no fill, no
// shadow: it is not there). Geometry read from muscleOrMachinePlan / orbitWorld (read only), static (it never runs).
// V3: the one warm glowing material in the air: its orange takes only a third of the fog of its distance, a faint
// warm halo sits round the wheel, and AirStage's bloom picks it out.
// ---------------------------------------------------------------------------
const Engine: React.FC<{ C: StreetCam; v: AirView }> = ({ C, v }) => {
  const s = ENG_S;
  const Z0 = ENGINE_Z;
  const X0 = ENGINE_X;
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const fog = c01(v.fogAt(Z0 - C.Z));
  const air = v.airAt(Z0 - C.Z, 300);
  const col = fogMix(v.pal.orange, air, fog * 0.34);
  const sw = 1.6;
  const circ = (cx: number, cy: number, rad: number, Z: number, dash: number) => {
    const c = p(cx, cy, Z);
    const R = rad * rAt(C, Z);
    const L = 2 * Math.PI * R;
    const n = Math.max(6, Math.round(L / dash));
    const per = L / n;
    return <circle cx={c[0]} cy={c[1]} r={R} fill="none" stroke={col} strokeWidth={sw} strokeDasharray={`${fx(per * 0.58)} ${fx(per * 0.42)}`} />;
  };
  const line = (a: P2, b: P2, key: string) => <path key={key} d={`M${pt(a)}L${pt(b)}`} stroke={col} strokeWidth={sw} strokeDasharray="4.2 3.2" fill="none" />;
  const axle: [number, number] = [X0, AXLE_Y];
  const rimO = (FLY_PITCH + 8) * s; // the geared rim's teeth
  const rimI = (RIM_R - 31) * s;
  const hub = HUB_RING_R * s;
  const sun = PITCH_R * s;
  const planetY = AXLE_Y - CENTRE_D * s;
  // the A-frame (A's ASTAND: feet +-290, top +-96 at the bearing, a tie at -330) behind the wheel
  const zF = Z0 + (ASTAND.z0 - 1400);
  const yTop = AXLE_Y + 50;
  const legs: React.ReactNode[] = [];
  for (const sg of [-1, 1]) {
    legs.push(line(p(X0 + sg * ASTAND.footHW, 0, zF), p(X0 + sg * ASTAND.topHW, yTop, zF), `lo${sg}`));
    legs.push(line(p(X0 + sg * (ASTAND.footHW - 56), 0, zF), p(X0 + sg * (ASTAND.topHW - 34), yTop, zF), `li${sg}`));
  }
  legs.push(line(p(X0 - ASTAND.footHW - 18, 0, zF), p(X0 + ASTAND.footHW + 18, 0, zF), "foot"));
  legs.push(line(p(X0 - 210, -330, zF), p(X0 + 210, -330, zF), "tie"));
  // the pinion (on the line shaft, left of the wheel at the shaft's height) and the shaft running back toward us over
  // two stone pairs (hurst frame, the runner stone, the crown wheel over it)
  const pinD = (FLY_PITCH + PIN_PITCH) * s;
  const pinX = X0 - Math.sqrt(pinD * pinD - (SHAFT_Y - AXLE_Y) ** 2);
  const shaftZ1 = Z0 - 900;
  const stones = [Z0 - 340, Z0 - 760];
  const stoneEls = stones.map((Zs, i) => {
    const hw = HURST.hw;
    const top = -HURST.h;
    const R = STONE_R;
    const c = p(pinX, top - 30, Zs);
    const rx = R * rAt(C, Zs);
    const ry = Math.max(1, (p(pinX, top - 30, Zs - R)[1] - p(pinX, top - 30, Zs + R)[1]) / 2);
    return (
      <g key={`st${i}`}>
        {line(p(pinX - hw, 0, Zs), p(pinX - hw, top, Zs), `a${i}`)}
        {line(p(pinX + hw, 0, Zs), p(pinX + hw, top, Zs), `b${i}`)}
        {line(p(pinX - hw - 10, top, Zs), p(pinX + hw + 10, top, Zs), `c${i}`)}
        <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill="none" stroke={col} strokeWidth={sw} strokeDasharray="3.6 2.8" />
        {line(p(pinX - R, top - 30, Zs), p(pinX - R, top, Zs), `d${i}`)}
        {line(p(pinX + R, top - 30, Zs), p(pinX + R, top, Zs), `e${i}`)}
        {line(p(pinX, top - 30, Zs), p(pinX, SHAFT_Y, Zs), `sp${i}`)}
        {circ(pinX, SHAFT_Y, 62, Zs - 34, 5)}
      </g>
    );
  });
  // the faint warm halo in the air round the wheel (never a hot glow)
  const hc = p(axle[0], axle[1], Z0);
  const hr = rimO * rAt(C, Z0) * 1.6;
  return (
    <g>
      <defs>
        <radialGradient id="fs-eng-halo">
          <stop offset="0" stopColor={v.pal.orange} stopOpacity={0.055} />
          <stop offset="0.5" stopColor={v.pal.orange} stopOpacity={0.03} />
          <stop offset="1" stopColor={v.pal.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={hc[0]} cy={hc[1] + hr * 0.15} rx={hr * 1.15} ry={hr} fill="url(#fs-eng-halo)" />
      {legs}
      {stoneEls}
      {line(p(pinX, SHAFT_Y, Z0 - 2), p(pinX, SHAFT_Y, shaftZ1), "shaft")}
      {circ(pinX, SHAFT_Y, PIN_PITCH * s, Z0 - 2, 4.5)}
      {circ(axle[0], axle[1], rimO, Z0, 5.2)}
      {circ(axle[0], axle[1], rimI, Z0, 5.2)}
      {circ(axle[0], axle[1], hub, Z0, 4)}
      {circ(axle[0], axle[1], sun, Z0 - 1, 3.5)}
      {circ(axle[0], planetY, sun, Z0 - 1, 3.5)}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.26;
        return line(p(axle[0] + hub * Math.cos(a), axle[1] + hub * Math.sin(a), Z0), p(axle[0] + rimI * Math.cos(a), axle[1] + rimI * Math.sin(a), Z0), `sk${i}`);
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SHOPS: interiors (behind the front plane), the fronts (one plane per bay with its opening), and what stands on
// the threshold and the pavement (the people and their work, in front of the plane: painter's order by depth)
// ---------------------------------------------------------------------------
/** the interior of a shop seen through its opening: the far jamb + far wall (facing us), the back wall, the floor,
 *  the ceiling (seen from below). V3: a dim warm room (never black), the daylight falling in through the opening on
 *  its floor, the far corner sinking into a soft gloom in the medium's shadow colour */
const Interior: React.FC<{ C: StreetCam; v: AirView; s: Shop }> = ({ C, v, s }) => {
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const sg = s.side;
  const za = Math.max(s.z0, C.Z + NEAR);
  const zb = s.z1;
  if (zb <= za + 4) return null;
  const h = hzOf(v, C, (za + zb) / 2);
  const F = sg * FACADE_X;
  const B = sg * BACK_X;
  const sh = v.pal.shadow;
  // the left row's rooms open away from the light: a little dimmer
  const dimL = sg < 0 ? 0.12 : 0;
  const col = (c: string, hgt = 300) => hz(airMix(c, sh, dimL), h, hgt);
  const farWall = poly([p(F, PAVE_Y, zb), p(B, PAVE_Y, zb), p(B, LINTEL_Y, zb), p(F, LINTEL_Y, zb)]);
  const back = poly([p(B, PAVE_Y, za), p(B, PAVE_Y, zb), p(B, LINTEL_Y, zb), p(B, LINTEL_Y, za)]);
  const floor = poly([p(F, PAVE_Y, za), p(B, PAVE_Y, za), p(B, PAVE_Y, zb), p(F, PAVE_Y, zb)]);
  const ceil = poly([p(F, LINTEL_Y, za), p(B, LINTEL_Y, za), p(B, LINTEL_Y, zb), p(F, LINTEL_Y, zb)]);
  const jambE = p(sg * (FACADE_X + WALL_T), PAVE_Y, zb);
  const jambT = p(sg * (FACADE_X + WALL_T), LINTEL_Y, zb);
  const rr = rAt(C, zb);
  const uid = `in${s.id}`;
  // the daylight's patch on the floor just inside the opening
  const lp0 = p(F, PAVE_Y, za);
  const lp1 = p(F + sg * 260, PAVE_Y, (za + zb) / 2);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-fl`} gradientUnits="userSpaceOnUse" x1={fx(lp0[0])} y1={fx(lp0[1])} x2={fx(lp1[0])} y2={fx(lp1[1])}>
          <stop offset="0" stopColor={CREAM_HEX} stopOpacity={0.16 * vis(h)} />
          <stop offset="1" stopColor={CREAM_HEX} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${uid}-gl`} gradientUnits="userSpaceOnUse" x1={fx(p(F, 0, zb)[0])} y1={0} x2={fx(p(B, 0, zb)[0])} y2={0}>
          <stop offset="0" stopColor={sh} stopOpacity={0} />
          <stop offset="1" stopColor={sh} stopOpacity={0.32 * vis(h)} />
        </linearGradient>
      </defs>
      <path d={back} fill={col(ROOM.back)} />
      <path d={floor} fill={col(ROOM.floor, 60)} />
      <path d={floor} fill={`url(#${uid}-fl)`} />
      <path d={farWall} fill={col(ROOM.far)} />
      <path d={ceil} fill={col(ROOM.ceil, 600)} />
      <path d={`M${pt(jambE)}L${pt(jambT)}`} stroke={lineOf(h)} strokeWidth={lw(rr, 1.1)} strokeOpacity={0.6} />
      {/* the ceiling's joists (timber, across the room) */}
      {Array.from({ length: 6 }, (_, i) => za + ((i + 0.5) * (zb - za)) / 6).map((Zj, i) => (
        <path key={i} d={poly([p(F, LINTEL_Y, Zj - 10), p(B, LINTEL_Y, Zj - 10), p(B, LINTEL_Y + 22, Zj - 10), p(F, LINTEL_Y + 22, Zj - 10)])} fill={col(ROOM.joist, 600)} stroke={col("#3A2B1F", 600)} strokeWidth={lw(rAt(C, Zj), 0.5)} />
      ))}
      {/* the soft gloom toward the back of the room */}
      <path d={poly([p(F, PAVE_Y, zb), p(B, PAVE_Y, zb), p(B, LINTEL_Y, zb), p(F, LINTEL_Y, zb)])} fill={`url(#${uid}-gl)`} />
      <path d={back} fill={sh} opacity={0.16 * vis(h)} />
    </g>
  );
};

/** the wall heights: the ground storey's plaster up to the upper floor's stucco band, the upper storey above it */
const SOCLE_TOP = -300;
const BAND_Y0 = -712;
const BAND_Y1 = -764;
/** one bay of the front (a pier + the wall over the opening), with its opening as a hole; the upper storey's windows;
 *  the timber lintel; the far jamb's cream arris. V3: painted with the row's column gradients (wallGrads), so the
 *  whole row is one continuous tone by distance */
const Bay: React.FC<{ C: StreetCam; v: AirView; side: -1 | 1; b0: number; b1: number; o0?: number; o1?: number; idx: number; closed?: boolean }> = ({ C, v, side, b0, b1, o0, o1, idx, closed }) => {
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const za = Math.max(b0, C.Z + NEAR);
  const zb = Math.min(b1, STREET_END);
  if (zb <= za) return null;
  const F = side * FACADE_X;
  const h = hzOf(v, C, (za + zb) / 2);
  const a = vis(h);
  const rr = rAt(C, (za + zb) / 2);
  const S = side < 0 ? "L" : "R";
  const rect = (y0: number, y1: number, z0: number, z1: number) => poly([p(F, y0, z0), p(F, y0, z1), p(F, y1, z1), p(F, y1, z0)]);
  const lower = rect(PAVE_Y, BAND_Y0, za, zb);
  const socle = rect(PAVE_Y, SOCLE_TOP, za, zb);
  const band = rect(BAND_Y0, BAND_Y1, za, zb);
  const upper = rect(BAND_Y1, UPPER_TOP, za, zb);
  let hole = "";
  let socleHole = "";
  let lintel = "";
  let lintelTop = "";
  let arris = "";
  let boards = "";
  const hasOpen = o0 !== undefined && o1 !== undefined && o1 > za;
  const hLin = hzOf(v, C, hasOpen ? (Math.max(o0!, za) + o1!) / 2 : (za + zb) / 2);
  if (hasOpen) {
    const ha = Math.max(o0!, za);
    hole = rect(PAVE_Y, LINTEL_Y, ha, o1!);
    socleHole = rect(PAVE_Y, SOCLE_TOP, ha, o1!);
    const l0 = Math.max(o0! - 40, za);
    lintel = poly([p(F, LINTEL_Y, l0), p(F, LINTEL_Y, o1! + 40), p(F, LINTEL_Y - LINTEL_H, o1! + 40), p(F, LINTEL_Y - LINTEL_H, l0)]);
    lintelTop = `M${pt(p(F, LINTEL_Y - LINTEL_H, l0))}L${pt(p(F, LINTEL_Y - LINTEL_H, o1! + 40))}`;
    arris = `M${pt(p(F, PAVE_Y, o1!))}L${pt(p(F, LINTEL_Y, o1!))}L${pt(p(F, LINTEL_Y, ha))}`;
    if (closed) {
      for (let Z = o0!; Z < o1!; Z += 45) {
        if (Z < za) continue;
        boards += `M${pt(p(F, PAVE_Y, Z))}L${pt(p(F, LINTEL_Y, Z))}`;
      }
    }
  }
  // the upper storey's small windows (two per bay), recessed: dim, with a cream sill
  let win = "";
  let sill = "";
  const wins = hasOpen ? [o0! + 90, o0! + 330] : [b0 + 120];
  for (const wz of wins) {
    if (wz < za || wz + 100 > zb) continue;
    win += poly([p(F, -880, wz), p(F, -880, wz + 100), p(F, -1020, wz + 100), p(F, -1020, wz)]);
    sill += `M${pt(p(F, -872, wz - 8))}L${pt(p(F, -872, wz + 108))}`;
  }
  const lineW = lw(rr, 1.2);
  const dark = lineOf(h, side < 0 ? "#3F3226" : "#5A4836");
  return (
    <g key={`bay${idx}`}>
      <path d={lower + hole} fillRule="evenodd" fill={`url(#fs-w${S}lo)`} />
      <path d={socle + socleHole} fillRule="evenodd" fill={`url(#fs-w${S}so)`} />
      <path d={upper} fill={`url(#fs-w${S}up)`} />
      <path d={band} fill={`url(#fs-w${S}bd)`} />
      {/* the band's lit upper edge */}
      <path d={`M${pt(p(F, BAND_Y1, za))}L${pt(p(F, BAND_Y1, zb))}`} stroke={cream((side < 0 ? 0.18 : 0.3) * a)} strokeWidth={lineW * 0.8} />
      {closed && hasOpen ? (
        <g>
          <path d={hole} fill={hz(BOARD_C, h, 300)} />
          <path d={boards} stroke={hz("#3A2A1D", h, 300)} strokeWidth={lineW * 0.8} strokeOpacity={0.7} fill="none" />
          <path d={hole} fill="none" stroke={cream(0.22 * a)} strokeWidth={lineW * 0.7} />
        </g>
      ) : null}
      {win ? <path d={win} fill={hz(WINDOW_C, h, 950)} stroke={dark} strokeWidth={lineW * 0.7} /> : null}
      {sill ? <path d={sill} stroke={cream(0.36 * a)} strokeWidth={lineW} /> : null}
      {lintel ? <path d={lintel} fill={hz(side < 0 ? TIMBER_M.mid : TIMBER_M.lit, hLin, 680)} stroke={hz("#2E2219", hLin, 680)} strokeWidth={lineW * 0.8} /> : null}
      {lintelTop ? <path d={lintelTop} stroke={cream(0.4 * vis(hLin))} strokeWidth={lineW * 0.8} /> : null}
      {arris ? <path d={arris} fill="none" stroke={cream((side < 0 ? 0.32 : 0.46) * vis(hLin))} strokeWidth={lineW} /> : null}
      {/* the foot of the wall on the pavement (a soft occlusion line) */}
      <path d={`M${pt(p(F, PAVE_Y, za))}L${pt(p(F, PAVE_Y, zb))}`} stroke={hz(v.pal.shadow, h, 40)} strokeWidth={lineW * 1.8} strokeOpacity={0.35} />
    </g>
  );
};
/** the row's column gradients (one per wall band and side): Bay paints with them */
const WallGrads: React.FC<{ C: StreetCam; v: AirView }> = ({ C, v }) => (
  <defs>
    {([-1, 1] as const).map((s) => {
      const S = s < 0 ? "L" : "R";
      const X = s * FACADE_X;
      return (
        <React.Fragment key={S}>
          <ColGrad id={`fs-w${S}lo`} v={v} C={C} X={X} local={s < 0 ? FRONT_L : FRONT_R} hgt={420} />
          <ColGrad id={`fs-w${S}so`} v={v} C={C} X={X} local={s < 0 ? SOCLE_L : SOCLE_R} hgt={180} />
          <ColGrad id={`fs-w${S}bd`} v={v} C={C} X={X} local={s < 0 ? SOCLE_L : SOCLE_R} hgt={740} />
          <ColGrad id={`fs-w${S}up`} v={v} C={C} X={X} local={s < 0 ? airMix(FRONT_L, PLASTER.lit, 0.12) : FRONT_R} hgt={1000} />
        </React.Fragment>
      );
    })}
  </defs>
);

/** a shop's front wall as a mask (white = visible): the wall from the bay's start to the opening's end, less the
 *  opening, is black, so what the shop puts out shows only through its opening or in front of the wall's plane */
const BayMask: React.FC<{ id: string; C: StreetCam; side: -1 | 1; b0: number; o0: number; o1: number }> = ({ id, C, side, b0, o0, o1 }) => {
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const za = Math.max(b0, C.Z + NEAR);
  const F = side * FACADE_X;
  if (o1 <= za) return null;
  const outer = poly([p(F, PAVE_Y, za), p(F, PAVE_Y, o1), p(F, UPPER_TOP, o1), p(F, UPPER_TOP, za)]);
  const ha = Math.max(o0, za);
  const hole = o1 > ha ? poly([p(F, PAVE_Y + 400, ha), p(F, PAVE_Y + 400, o1), p(F, LINTEL_Y, o1), p(F, LINTEL_Y, ha)]) : "";
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x={-4000} y={-4000} width={9000} height={10000}>
      <rect x={-4000} y={-4000} width={9000} height={10000} fill="#fff" />
      <path d={outer + hole} fillRule="evenodd" fill="#000" />
    </mask>
  );
};

/** the tiled eaves along a row (projecting over the pavement): terracotta, re-lit, in short segments each fogged by
 *  its distance (the segments are short enough that neighbours differ by less than a step) */
const Eaves: React.FC<{ C: StreetCam; P: Persp; v: AirView; side: -1 | 1 }> = ({ C, P, v, side }) => {
  const out: React.ReactNode[] = [];
  const zA = C.Z + NEAR;
  const SEG = 180;
  const mat: Mat = side > 0 ? TILE : { lit: airMix(TILE.lit, TILE.dark, 0.3), mid: airMix(TILE.mid, TILE.dark, 0.3), dark: TILE.dark };
  const raft: Record<number, string> = {};
  for (let z0 = Math.floor(zA / SEG) * SEG; z0 < STREET_END; z0 += SEG) {
    const za = Math.max(z0, zA);
    const zb = Math.min(z0 + SEG, STREET_END);
    if (zb <= za) continue;
    const h = hzOf(v, C, (za + zb) / 2);
    const X0 = side < 0 ? -FACADE_X : FACADE_X - EAVE_OUT;
    const X1 = side < 0 ? -FACADE_X + EAVE_OUT : FACADE_X;
    // the underside (seen from below) and the fascia, without per-segment outlines (they would draw seams)
    const p = P.p;
    const under = poly([p(X0, UPPER_TOP, za), p(X1, UPPER_TOP, za), p(X1, UPPER_TOP, zb + 1), p(X0, UPPER_TOP, zb + 1)]);
    const XO = side < 0 ? X1 : X0;
    const fascia = poly([p(XO, UPPER_TOP - 40, za), p(XO, UPPER_TOP, za), p(XO, UPPER_TOP, zb + 1), p(XO, UPPER_TOP - 40, zb + 1)]);
    out.push(<path key={`u${z0}`} d={under} fill={hz(airMix(mat.dark, v.pal.shadow, 0.2), h, 1240)} />);
    out.push(<path key={`f${z0}`} d={fascia} fill={hz(side > 0 ? mat.mid : mat.lit, h, 1260)} />);
    const fb = Math.round(c01(v.fogAt((za + zb) / 2 - C.Z)) * 12);
    for (let Z = Math.ceil(za / 90) * 90; Z < zb; Z += 90) raft[fb] = (raft[fb] ?? "") + `M${pt(p(side * FACADE_X, UPPER_TOP, Z))}L${pt(p(side * (FACADE_X - EAVE_OUT), UPPER_TOP, Z))}`;
  }
  // the rafter ends under the eaves and the fascia's lit lower edge, fading with the fog
  Object.entries(raft).forEach(([k, d]) => {
    const fog = Number(k) / 12;
    if (fog < 0.95) out.push(<path key={`raft${k}`} d={d} stroke={fogMix("#2C1E16", v.airAt(3000 * fog + 400, 1240), fog)} strokeWidth={lw(1 - fog, 1)} strokeOpacity={0.45 * (1 - fog)} />);
  });
  const XO = side < 0 ? -FACADE_X + EAVE_OUT : FACADE_X - EAVE_OUT;
  out.push(...fadeLine(C, v, [XO, UPPER_TOP, zA], [XO, UPPER_TOP, STREET_END], (fog) => cream(0.28 * (1 - fog)), 1.1, `ev${side}`));
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// THE PEOPLE AT WORK (each shop's front items; X is mirrored by side, `dir` faces the street)
// ---------------------------------------------------------------------------
type Ctx = { C: StreetCam; P: Persp; f: number; v: AirView };
const at3 = (c: Ctx, X: number, Y: number, Z: number) => ({ at: c.C ? project(c.C, X, Y, Z) : ([0, 0] as P2), scale: rAt(c.C, Z) });
const shadow = (c: Ctx, X: number, Z: number, w: number, d: number, uid: string, amt = 0.75, Y = PAVE_Y) => <AirShadow P={c.P} v={c.v} C={c.C} X={X} Z={Z} w={w} d={d} uid={uid} amt={amt} Y={Y} />;
const hzAt = (c: Ctx, Z: number, g = 0) => hzOf(c.v, c.C, Z, g);

/** a kneeling grinder at a rotary quern on the threshold (slave or free) */
const QuernGroup = (c: Ctx, sh: Shop, Zq: number, who: "slave" | "free", key: string): Item => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  // the slave mill stands back in its doorway; a free grinder kneels at the front edge of his platform
  const Xq = sg * (who === "slave" ? 250 : 188);
  const Xg = Xq + sg * 50;
  const h = hzAt(c, Zq);
  // the mill stands on a low stone platform at the threshold (keeps the grinding hands up out of the caption band)
  const LIFT = 80;
  const top = PAVE_Y - LIFT;
  const q = at3(c, Xq, top, Zq);
  const g = at3(c, Xg, top, Zq);
  const phase = c.f / 44 + (who === "slave" ? 0.15 : 0.6);
  const pose = POSES.grind(dir, phase);
  const hand = quernHandle(q.at, q.scale, phase, dir);
  const grip = dir === 1 ? { L: hand } : { R: hand };
  const fg = figFog(h);
  return {
    Z: Zq,
    key,
    el: (
      <g key={key}>
        {shadow(c, (Xg + Xq) / 2, Zq, 130, 80, `${key}-ps`, 0.6)}
        <AirBox P={c.P} X0={Math.min(Xq - sg * 50, Xg + sg * 84)} X1={Math.max(Xq - sg * 50, Xg + sg * 84)} Y0={top} Y1={PAVE_Y} Z0={Zq - 75} Z1={Zq + 75} mat={PLATFORM_M} h={h} uid={`${key}-pl`} />
        {shadow(c, Xg, Zq, 90, 40, `${key}-gs`, 0.75, top)}
        {shadow(c, Xq, Zq, 46, 34, `${key}-qs`, 0.6, top)}
        <RotaryQuern at={q.at} scale={q.scale} turn={phase} dir={dir} uid={`${key}-q`} fog={fg} />
        {who === "slave" ? (
          <Slave pose={pose} at={g.at} scale={g.scale} uid={`${key}-g`} variant={1} garb="exomis" fetters grip={grip} fog={fg} />
        ) : (
          <Freeman pose={pose} at={g.at} scale={g.scale} uid={`${key}-g`} variant={2} apron={false} grip={grip} fog={fg} />
        )}
      </g>
    ),
  };
};

const SlaveShop = (c: Ctx, sh: Shop): Item[] => {
  const items: Item[] = [];
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const f = c.f;
  items.push(QuernGroup(c, sh, 620, "slave", "sq"));
  // grain sacks stacked against the far jamb
  for (const [i, X, Z] of [
    [0, 352, 796],
    [1, 344, 822],
  ] as const) {
    const a = at3(c, sg * X, PAVE_Y, Z);
    items.push({ Z, key: `sk${i}`, el: <g key={`sk${i}`}>{shadow(c, sg * X, Z, 40, 30, `sk${i}s`, 0.6)}<Sack at={a.at} scale={a.scale} uid={`sk${i}`} fog={figFog(hzAt(c, Z))} /></g> });
  }
  // the carrier: in fetters, a sack on his shoulder, walking in off the pavement into the shop (into its gloom)
  {
    const Z = 790;
    const Xa = 200 + 2.93 * f;
    const X = sg * Xa;
    const ph = f / 30 + 0.3;
    const a = at3(c, X, PAVE_Y, Z);
    const h = hzAt(c, Z, 0.55 * smooth((Xa - 340) / 220));
    const el = (
      <g key="car">
        {shadow(c, X, Z, 70, 36, "cars")}
        <Slave pose={POSES.carry(sg as 1 | -1, ph)} at={a.at} scale={a.scale} uid="car" variant={0} fetters load="sack" fog={figFog(h)} />
      </g>
    );
    items.push({ Z, key: "car", el });
  }
  // the overseer at the door with his rod, on the pavement by the far pier, watching them (lifts it a little on "labor")
  {
    const Z = 500;
    const X = sg * 345;
    const a = at3(c, X, PAVE_Y, Z);
    const h = hzAt(c, Z);
    const lift = 0.1 * Math.sin(Math.PI * smooth((f - 46) / 56));
    const pose: FigPose = headTurn(idle(POSES.raiseRod(dir, lift), f, 1), dir * 0.35, 0.1);
    items.push({
      Z,
      key: "ovs",
      el: (
        <g key="ovs">
          {shadow(c, X, Z, 70, 36, "ovss")}
          <Overseer pose={pose} at={a.at} scale={a.scale} uid="ovs" variant={0} fog={figFog(h)} />
        </g>
      ),
    });
  }
  return items;
};

/** a counter of masonry in the opening with dolia set in its top (behind the front plane: drawn in the interior) */
const Counter: React.FC<{ c: Ctx; sh: Shop; za: number; zb: number; uid: string }> = ({ c, sh, za, zb, uid }) => {
  const sg = sh.side;
  const X0 = sg < 0 ? -FACADE_X - 90 : FACADE_X + 6;
  const X1 = sg < 0 ? -FACADE_X - 6 : FACADE_X + 90;
  const top = PAVE_Y - 170;
  const h = hzAt(c, (za + zb) / 2);
  const zA = Math.max(za, c.C.Z + NEAR);
  if (zb <= zA) return null;
  const mouths = [0.22, 0.52, 0.8].map((u) => {
    const Z = za + (zb - za) * u;
    const ctr = project(c.C, (X0 + X1) / 2, top, Z);
    const rx = 30 * rAt(c.C, Z);
    const ry = Math.max(0.6, (project(c.C, 0, top, Z - 30)[1] - project(c.C, 0, top, Z + 30)[1]) / 2);
    return <ellipse key={u} cx={ctr[0]} cy={ctr[1]} rx={rx} ry={ry} fill={hz("#2E241C", h)} stroke={cream(0.4 * vis(h))} strokeWidth={lw(rAt(c.C, Z), 1)} />;
  });
  return (
    <g>
      <AirBox P={c.P} X0={X0} X1={X1} Y0={top} Y1={PAVE_Y} Z0={zA} Z1={zb} mat={MARBLE} h={h} uid={uid} />
      {mouths}
    </g>
  );
};

const SellerShop = (c: Ctx, sh: Shop, woman: boolean): { front: Item[]; inner: React.ReactNode } => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const Z = sh.z0 + 170;
  const X = sg * 245;
  const a = at3(c, X, PAVE_Y, Z);
  const h = hzAt(c, Z);
  const t = 0.55 + 0.45 * Math.sin(c.f / 21 + sh.z0 * 0.01);
  const pose = idle(POSES.gesture(dir, t), c.f, sh.z0 % 7);
  const key = `sel${sh.id}`;
  const Fig = Freeman;
  // amphorae on the pavement by the far jamb, a basket of loaves on the counter's end
  const am = [0, 1].map((i) => {
    const Za = sh.z1 - 50 - i * 46;
    const Xa = sg * (FACADE_X - 30 - i * 10);
    const aa = at3(c, Xa, PAVE_Y, Za);
    return { Z: Za, key: `${key}a${i}`, el: <g key={`${key}a${i}`}>{shadow(c, Xa, Za, 30, 22, `${key}a${i}s`, 0.6)}<Amphora at={aa.at} scale={aa.scale} uid={`${key}a${i}`} angle={-sg * 6} fog={figFog(hzAt(c, Za))} /></g> };
  });
  return {
    inner: <Counter key={`${key}c`} c={c} sh={sh} za={sh.z0 + 230} zb={sh.z0 + 385} uid={`${key}c`} />,
    front: [
      ...am,
      {
        Z,
        key,
        el: (
          <g key={key}>
            {shadow(c, X, Z, 64, 34, `${key}s`)}
            <Fig pose={pose} at={a.at} scale={a.scale} uid={key} variant={woman ? 3 : 1} inks={woman ? undefined : KHAKI} held="cup" fog={figFog(h)} />
          </g>
        ),
      },
    ],
  };
};

const PotterShop = (c: Ctx, sh: Shop): Item[] => {
  const sg = sh.side;
  // he sits at the pavement's edge facing into his shop, the wheel on its threshold
  const dir = sg as 1 | -1;
  const Z = sh.z0 + 260;
  const Xp = sg * 190;
  const ph = c.f / 48 + sh.z0 * 0.001;
  const pp = at3(c, Xp, PAVE_Y, Z);
  const wheel = at3(c, Xp + dir * POTTER.wheelDX, PAVE_Y, Z);
  const stool = at3(c, Xp - dir * POTTER.stoolDX * -1, PAVE_Y, Z);
  const h = hzAt(c, Z);
  const key = `pot${sh.id}`;
  // finished jars drying on the pavement against the wall
  const jars = [0, 1, 2].map((i) => {
    const Zj = sh.z0 + 305 + i * 30;
    const Xj = sg * (FACADE_X - 26);
    const aj = at3(c, Xj, PAVE_Y, Zj);
    return { Z: Zj, key: `${key}j${i}`, el: <g key={`${key}j${i}`}>{shadow(c, Xj, Zj, 22, 18, `${key}j${i}s`, 0.5)}<Amphora at={aj.at} scale={aj.scale * 0.55} uid={`${key}j${i}`} fog={figFog(hzAt(c, Zj))} /></g> };
  });
  return [
    ...jars,
    {
      Z,
      key,
      el: (
        <g key={key}>
          {shadow(c, Xp, Z, 80, 38, `${key}s`)}
          <Stool at={stool.at} scale={stool.scale} uid={`${key}st`} fog={figFog(h)} />
          <PotterWheel at={wheel.at} scale={wheel.scale} turn={ph * 3} dir={dir} uid={`${key}w`} fog={figFog(h)} />
          <Freeman pose={POSES.potter(dir, ph)} at={pp.at} scale={pp.scale} uid={key} variant={1} apron={false} inks={KHAKI} fog={figFog(h)} />
        </g>
      ),
    },
  ];
};

const CobblerShop = (c: Ctx, sh: Shop): Item[] => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const Z = sh.z0 + 250;
  const Xp = sg * 262;
  const ph = c.f / 26 + 0.3;
  // V3: he works on a low stone step (the folk hands with the shoe stay up out of the caption band)
  const LIFT = 26;
  const fl = PAVE_Y - LIFT;
  const pp = at3(c, Xp, fl, Z);
  const stool = at3(c, Xp + dir * POTTER.stoolDX, fl, Z);
  const h = hzAt(c, Z);
  const key = `cob${sh.id}`;
  // the low bench in front of him, the shoe on its last in his hands
  const bx = Xp + dir * POTTER.wheelDX;
  const hand = project(c.C, bx - dir * 8, fl - 96 - 6 * Math.sin(2 * Math.PI * ph), Z);
  const sc = rAt(c.C, Z);
  const shoe = (
    <g transform={`translate(${pt(hand)}) scale(${(sc * dir * 0.72).toFixed(4)} ${(sc * 0.72).toFixed(4)})`}>
      <path d="M-34,8L32,8C36,8 36,2 32,0L-30,0C-36,0 -38,8 -34,8Z" fill={hz("#4E3A2A", h)} />
      <path d="M-30,0C-30,-14 -18,-22 -4,-22C6,-22 10,-14 20,-8C28,-4 32,-2 32,0Z" fill={hz("#7A5A40", h)} />
      <path d="M-2,-22C6,-22 10,-14 20,-8C28,-4 32,-2 32,0L10,0C12,-8 6,-16 -2,-22Z" fill={hz("#5E4430", h)} opacity={0.6} />
      <path d="M-24,-2C-14,-10 4,-12 26,-3" fill="none" stroke={hz("#D9CDB4", h)} strokeOpacity={0.55} strokeWidth={1.2} strokeDasharray="3 3" />
    </g>
  );
  // sandals hanging from pegs on the pier beyond the opening
  const hang = [0, 1, 2, 3].map((i) => {
    const Zh = sh.z1 + 14 + i * 20;
    const top = project(c.C, sg * (FACADE_X - 4), -360 - (i % 2) * 40, Zh);
    const s2 = rAt(c.C, Zh);
    return <path key={i} transform={`translate(${pt(top)}) scale(${(s2 * 0.6).toFixed(4)} ${s2.toFixed(4)})`} d="M-8,0L8,0L10,60C10,70 -10,70 -10,60Z" fill={hz(i % 2 ? "#6A4C37" : "#7A5A40", hzAt(c, Zh))} />;
  });
  return [
    { Z: sh.z1 + 40, key: `${key}h`, el: <g key={`${key}h`}>{hang}</g> },
    {
      Z,
      key,
      el: (
        <g key={key}>
          {shadow(c, sg * 220, Z, 100, 90, `${key}ps`, 0.6)}
          <AirBox P={c.P} X0={Math.min(sg * 140, sg * 300)} X1={Math.max(sg * 140, sg * 300)} Y0={fl} Y1={PAVE_Y} Z0={Z - 80} Z1={Z + 80} mat={PLATFORM_M} h={h} uid={`${key}pl`} />
          {shadow(c, Xp, Z, 80, 38, `${key}s`, 0.75, fl)}
          <AirBox P={c.P} X0={Math.min(bx - sg * 18, bx + sg * 18)} X1={Math.max(bx - sg * 18, bx + sg * 18)} Y0={fl - 74} Y1={fl} Z0={Z - 46} Z1={Z + 46} mat={TIMBER_M} h={h} uid={`${key}b`} />
          <Stool at={stool.at} scale={stool.scale} uid={`${key}st`} fog={figFog(h)} />
          <Freeman pose={POSES.potter(dir, ph)} at={pp.at} scale={pp.scale} uid={key} variant={2} apron={false} fog={figFog(h)} />
          {shoe}
        </g>
      ),
    },
  ];
};

const SG_LO = -4;
const SG_UP = 18;
/** the smith's two fists on the hammer's shaft, 26 units apart along it (Revision 1 audit: with the cast's own fist
 *  targets the two grips can meet on the lift, and a shaft between coincident fists turns over in one frame) */
const smithGrips = (q: FigPose, at: P2, scale: number, dir: 1 | -1): { L: P2; R: P2 } => {
  const up = dir === 1 ? q.armL.w : q.armR.w;
  const g = dir === 1 ? q.armR.w : q.armL.w;
  const L0 = Math.hypot(up[0] - g[0], up[1] - g[1]) || 1;
  const sd: P2 = [(up[0] - g[0]) / L0, (up[1] - g[1]) / L0];
  const w = (k: number): P2 => [at[0] + (g[0] + sd[0] * k) * scale, at[1] + (g[1] + sd[1] * k) * scale];
  return dir === 1 ? { L: w(SG_UP), R: w(SG_LO) } : { R: w(SG_UP), L: w(SG_LO) };
};
/** the hammer head at the blow (phase 0), in the smith's own units: where the anvil's face must be */
const SMITH_HEAD: Record<string, P2> = {};
const smithHead = (dir: 1 | -1): P2 => {
  const k = `${dir}`;
  if (!SMITH_HEAD[k]) {
    const q0 = POSES.strike(dir, 0);
    const a = romeAnchors("freeman", q0, [0, 0], 1, { variant: 0, grip: smithGrips(q0, [0, 0], 1, dir), tool: "hammer" });
    SMITH_HEAD[k] = a.toolHead ?? [dir * 141, -43];
  }
  return SMITH_HEAD[k];
};
const SmithShop = (c: Ctx, sh: Shop): Item[] => {
  const sg = sh.side;
  // he stands at the front edge of his raised floor facing in, the anvil on the threshold
  const dir = sg as 1 | -1;
  const Z = sh.z0 + 270;
  const Xs = sg * 205;
  const head0 = smithHead(dir);
  const Xa = Xs + head0[0];
  const ph = c.f / 30 + sh.z0 * 0.0007;
  // the smithy's raised stone floor runs out over the pavement (keeps the blow up out of the caption band)
  const LIFT = 62;
  const fl = PAVE_Y - LIFT;
  const pp = at3(c, Xs, fl, Z);
  const h = hzAt(c, Z);
  const key = `smi${sh.id}`;
  const aTop = fl + head0[1] + 4;
  const r = rAt(c.C, Z);
  const bar = poly([project(c.C, Xa - 30, aTop - 2, Z - 6), project(c.C, Xa + 30, aTop - 2, Z - 6), project(c.C, Xa + 30, aTop - 9, Z - 6), project(c.C, Xa - 30, aTop - 9, Z - 6)]);
  return [
    {
      Z,
      key,
      el: (
        <g key={key}>
          {shadow(c, (Xs + Xa) / 2, Z, 150, 90, `${key}ps`, 0.6)}
          <AirBox P={c.P} X0={Math.min(Xs - sg * 40, Xa + sg * 50)} X1={Math.max(Xs - sg * 40, Xa + sg * 50)} Y0={fl} Y1={PAVE_Y} Z0={Z - 90} Z1={Z + 90} mat={PLATFORM_M} h={h} uid={`${key}pl`} />
          {shadow(c, Xs, Z, 80, 38, `${key}s`, 0.75, fl)}
          {shadow(c, Xa, Z, 40, 30, `${key}as`, 0.6, fl)}
          <AirBox P={c.P} X0={Xa - 30} X1={Xa + 30} Y0={fl - 30} Y1={fl} Z0={Z - 34} Z1={Z + 34} mat={TIMBER_M} h={h} uid={`${key}blk`} />
          <AirBox P={c.P} X0={Xa - 26} X1={Xa + 26} Y0={aTop} Y1={fl - 30} Z0={Z - 16} Z1={Z + 16} mat={IRON_M} h={h} uid={`${key}anv`} />
          <path d={bar} fill={hz("#8A8E8C", h)} stroke={hz("#4A4E50", h)} strokeWidth={lw(r, 0.6)} />
          <Freeman pose={POSES.strike(dir, ph)} at={pp.at} scale={pp.scale} uid={key} variant={0} tool="hammer" grip={smithGrips(POSES.strike(dir, ph), pp.at, pp.scale, dir)} fog={figFog(h)} />
        </g>
      ),
    },
  ];
};

/** the baker: an oven in the opening (the front wall with its arched mouth to the street, the dome behind), the baker
 *  on the pavement sliding a loaf in on a long peel */
const BakerShop = (c: Ctx, sh: Shop): { front: Item[]; inner: React.ReactNode } => {
  const sg = sh.side;
  const u = sg; // toward the shop
  const Zo = sh.z0 + 300;
  const h = hzAt(c, Zo);
  const p = (X: number, Y: number, Z: number) => project(c.C, X, Y, Z);
  const key = `bak${sh.id}`;
  const oz0 = sh.z0 + 180;
  const oz1 = sh.z0 + 390;
  const ox0 = sg * (FACADE_X + 100);
  const oxF = sg * (FACADE_X + 120);
  const mouthY0 = PAVE_Y - 150;
  const mouthY1 = PAVE_Y - 250;
  // the dome: the silhouette of a hemisphere (sampled, convex hull)
  const dc: [number, number, number] = [sg * 490, PAVE_Y - 240, Zo];
  const pts: P2[] = [];
  for (let i = 0; i <= 12; i++)
    for (let j = 0; j < 24; j++) {
      const th = (i / 12) * (Math.PI / 2);
      const ph = (j / 24) * Math.PI * 2;
      pts.push(p(dc[0] + 150 * Math.cos(th) * Math.cos(ph), dc[1] - 200 * Math.sin(th), dc[2] + 140 * Math.cos(th) * Math.sin(ph)));
    }
  const hull = convexHull(pts);
  const za = Math.max(oz0, c.C.Z + NEAR);
  const stroke = lineOf(h);
  const r = rAt(c.C, Zo);
  // the peel: butt near the baker's hands, blade inside the oven; it slides in and out
  const slide = 8 * Math.sin((2 * Math.PI * c.f) / 46);
  const Xb = sg * 175;
  const yP = PAVE_Y - 216;
  const butt = Xb + u * (40 + slide);
  const bladeC = Xb + u * (290 + slide);
  const peelIn = (X0: number, X1: number) => `M${pt(p(X0, yP, Zo))}L${pt(p(X1, yP, Zo))}`;
  const blade = poly([p(bladeC - 34, yP + 2, Zo - 30), p(bladeC + 34, yP + 2, Zo - 30), p(bladeC + 34, yP + 2, Zo + 30), p(bladeC - 34, yP + 2, Zo + 30)]);
  const loafC = p(bladeC, yP - 6, Zo);
  const loaf = <ellipse cx={loafC[0]} cy={loafC[1]} rx={26 * r} ry={8 * r} fill={hz("#BFA27C", h)} stroke={hz("#8A6E4E", h)} strokeWidth={lw(r, 0.6)} />;
  const mouth = (() => {
    const q: P2[] = [];
    q.push(p(ox0, mouthY0, Zo - 55));
    q.push(p(ox0, mouthY1 + 40, Zo - 55));
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (i / 10) * Math.PI;
      q.push(p(ox0, mouthY1 + 40 - 40 * Math.sin(a), Zo + 55 * Math.cos(a)));
    }
    q.push(p(ox0, mouthY0, Zo + 55));
    return poly(q);
  })();
  const inner = (
    <g key={`${key}o`}>
      <path d={poly(hull)} fill={hz(OVEN_M.lit, h, 300)} stroke={stroke} strokeWidth={lw(r, 0.9)} />
      {/* the dome's shaded right half (light from the upper left) */}
      <clipPath id={`${key}dc`}>
        <path d={poly(hull)} />
      </clipPath>
      <rect x={p(dc[0], 0, dc[2])[0]} y={0} width={2000} height={2000} fill={hz(formTone(OVEN_M, -0.4, c.v.pal.shadow), h, 300)} opacity={0.7} clipPath={`url(#${key}dc)`} />
      <AirBox P={c.P} X0={Math.min(ox0, oxF)} X1={Math.max(ox0, oxF)} Y0={PAVE_Y - 270} Y1={PAVE_Y} Z0={za} Z1={oz1} mat={OVEN_M} h={h} uid={`${key}fw`} />
      <path d={poly([p(ox0, PAVE_Y, za), p(ox0, PAVE_Y, oz1), p(ox0, PAVE_Y - 270, oz1), p(ox0, PAVE_Y - 270, za)])} fill={hz(OVEN_M.mid, h)} stroke={lineOf(h)} strokeWidth={lw(r, 0.9)} />
      <path d={[1, 2, 3, 4, 5, 6, 7, 8].map((k) => `M${pt(p(ox0, PAVE_Y - k * 31, za))}L${pt(p(ox0, PAVE_Y - k * 31, oz1))}`).join("")} stroke={lineOf(h)} strokeOpacity={0.3} strokeWidth={lw(r, 0.7)} />
      {/* the mouth: a dull red ember low inside (a fire, not the clip's orange) and its warmth on the dark */}
      <defs>
        <radialGradient id={`${key}emb`} gradientUnits="userSpaceOnUse" cx={fx(p(ox0, mouthY0, Zo)[0])} cy={fx(p(ox0, mouthY0, Zo)[1])} r={fx(70 * r)}>
          <stop offset="0" stopColor={hz("#A0503A", h)} stopOpacity={0.85} />
          <stop offset="0.55" stopColor={hz("#6A3226", h)} stopOpacity={0.55} />
          <stop offset="1" stopColor={hz("#2A1A14", h)} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={mouth} fill={hz("#2A1E17", h)} />
      <path d={mouth} fill={`url(#${key}emb)`} />
      {/* the peel's blade and loaf inside the mouth */}
      <g clipPath={`url(#${key}mc)`}>
        <clipPath id={`${key}mc`}>
          <path d={mouth} />
        </clipPath>
        <path d={peelIn(ox0, bladeC)} stroke={hz("#9C8566", h)} strokeWidth={8 * r} strokeLinecap="round" />
        <path d={blade} fill={hz("#8A7658", h)} stroke={lineOf(h)} strokeWidth={lw(r, 1)} />
        {loaf}
      </g>
      <path d={mouth} fill="none" stroke={hz(OVEN_M.lit, h)} strokeWidth={lw(r, 5)} />
      <path d={mouth} fill="none" stroke={cream(0.55 * vis(h))} strokeWidth={lw(r, 1.2)} />
    </g>
  );
  // the baker: both fists on the shaft
  const nearHand = project(c.C, Xb + u * (PUSH.grip[0] - 4 + slide), PAVE_Y + PUSH.grip[1], Zo);
  const farHand = project(c.C, Xb + u * (PUSH.gripFar[0] - 4 + slide), PAVE_Y + PUSH.gripFar[1], Zo);
  const dir = (sg as 1 | -1);
  const grip = dir === 1 ? { L: nearHand, R: farHand } : { R: nearHand, L: farHand };
  const bp = at3(c, Xb, PAVE_Y, Zo);
  const lean = 0; // (audit: an animated lean popped the mirrored hem by 2.5 units twice a stroke; the arms carry the stroke)
  // both fists on the shaft at chest height, leaning into the stroke (the cast's push stance, feet planted)
  const pose: FigPose = { ...POSES.push(dir, 0, 0), lean: dir * (20 + lean) };
  // loaves in a basket on the pavement behind him
  const bkZ = Zo - 150;
  const bkX = sg * 195;
  const bk = at3(c, bkX, PAVE_Y, bkZ);
  return {
    inner,
    front: [
      { Z: bkZ, key: `${key}bk`, el: <g key={`${key}bk`}>{shadow(c, bkX, bkZ, 36, 26, `${key}bks`, 0.6)}<Basket at={bk.at} scale={bk.scale} uid={`${key}bk`} full={1} fog={figFog(hzAt(c, bkZ))} /></g> },
      {
        Z: Zo,
        key,
        el: (
          <g key={key}>
            {shadow(c, Xb, Zo, 70, 36, `${key}s`)}
            {/* the shaft outside the oven */}
            <path d={peelIn(butt - u * 60, ox0)} stroke={lineOf(h)} strokeWidth={8 * r + 2.4} strokeLinecap="round" />
            <path d={peelIn(butt - u * 60, ox0)} stroke={hz("#9C8566", h)} strokeWidth={8 * r} strokeLinecap="round" />
            <Freeman pose={pose} at={bp.at} scale={bp.scale} uid={key} variant={0} apron={false} grip={grip} fog={figFog(h)} />
          </g>
        ),
      },
    ],
  };
};

/** a Pompeii stepping stone: an oval block (its top an ellipse in the road's plane), re-lit for the medium: the top
 *  lit with a cream rim on its far (upper-left-lit) edge, the body's right side in soft shade, fogged by distance */
const OvalStone: React.FC<{ C: StreetCam; v: AirView; X: number; Z: number; hx: number; hz: number; top: number; uid: string }> = ({ C, v, X, Z, hx, hz: hzz, top, uid }) => {
  if (Z - hzz < C.Z + NEAR) return null;
  const h = hzOf(v, C, Z);
  const ring = (Y: number) => Array.from({ length: 36 }, (_, i) => project(C, X + hx * Math.cos((i / 36) * Math.PI * 2), Y, Z + hzz * Math.sin((i / 36) * Math.PI * 2)));
  const topR = ring(top);
  const body = convexHull([...topR, ...ring(0)]);
  const c = project(C, X, top, Z);
  const r = rAt(C, Z);
  const sh = v.pal.shadow;
  const line = hz(airMix(STONE_M.dark, sh, 0.4), h, 30);
  return (
    <g>
      <clipPath id={`${uid}-b`}>
        <path d={poly(body)} />
      </clipPath>
      <path d={poly(body)} fill={hz(STONE_M.mid, h, 30)} stroke={line} strokeWidth={lw(r, 0.9)} />
      <rect x={c[0] + hx * r * 0.2} y={-4000} width={8000} height={12000} fill={hz(formTone(STONE_M, -0.4, sh), h, 30)} opacity={0.75} clipPath={`url(#${uid}-b)`} />
      <path d={poly(topR)} fill={hz(STONE_M.lit, h, 50)} stroke={line} strokeWidth={lw(r, 0.9)} />
      <path d={poly(topR.slice(14, 27))} fill="none" stroke={cream(0.4 * vis(h))} strokeWidth={lw(r, 1.1)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// convex hull (monotone chain) for the oven's dome silhouette
// ---------------------------------------------------------------------------
function convexHull(points: P2[]): P2[] {
  const pts = points.slice().sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  const cross = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}


// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
/** the medium at frame f (the eye's position for the motes' parallax: cut units, up +) */
export const airViewAt = (f: number): AirView => {
  const C = camAt(f);
  const C0 = camAt(0);
  return makeAirView({ scene: AIR_SCENE, frame: f, horizon: HORIZON - sway(f).dy, cam: { x: C.X, y: -EYE_Y, z: C.Z }, rest: { x: C0.X, y: -EYE_Y, z: C0.Z } });
};
/** the whole scene at frame f (pure; the audit script walks it to read every figure's props) */
export const sceneAt = (f: number) => {
  const C = camAt(f);
  const P = makePersp(C);
  const v = airViewAt(f);
  const ctx: Ctx = { C, P, f, v };

  const inner: { Z: number; el: React.ReactNode }[] = [];
  const masks: React.ReactNode[] = [];
  const front: Item[] = [];
  const bays: React.ReactNode[] = [];
  for (const side of [-1, 1] as const) {
    const row = SHOPS.filter((s) => s.side === side).sort((a, b) => a.z0 - b.z0);
    // the wall before the first opening, each bay (pier + opening), and the wall to the street's end
    let prev = -2000;
    const bayStart = new Map<string, number>();
    row.forEach((s, i) => {
      bays.push(<Bay key={`b${side}${i}`} C={C} v={v} side={side} b0={prev} b1={s.z1} o0={s.z0} o1={s.z1} idx={i} closed={s.kind === "closed"} />);
      bayStart.set(s.id, prev);
      prev = s.z1;
    });
    bays.push(<Bay key={`b${side}end`} C={C} v={v} side={side} b0={prev} b1={STREET_END} idx={99} />);
    for (const s of row) {
      if (s.z1 < C.Z + NEAR) continue;
      if (s.kind !== "closed") inner.push({ Z: s.z1, el: <Interior key={`in${s.id}`} C={C} v={v} s={s} /> });
      // DEPTH ORDER: everything a shop puts out is masked by its own front wall (the near pier and the wall over the
      // opening), so whatever stands or reaches behind the front plane is hidden by the jamb exactly where it should be
      const mId = `fm-${s.id}`;
      masks.push(<BayMask key={mId} id={mId} C={C} side={side} b0={bayStart.get(s.id) ?? -2000} o0={s.z0} o1={s.z1} />);
      const n0 = front.length;
      if (s.kind === "slave") front.push(...SlaveShop(ctx, s));
      else if (s.kind === "quern") {
        front.push(QuernGroup(ctx, s, s.z0 + 270, "free", `fq${s.id}`));
        for (const [i, X, Z] of [
          [0, 370, s.z0 + 110],
          [1, 390, s.z0 + 160],
        ] as const) {
          const a = at3(ctx, side * X, PAVE_Y, Z);
          front.push({ Z, key: `fqs${s.id}${i}`, el: <g key={`fqs${s.id}${i}`}>{shadow(ctx, side * X, Z, 40, 30, `fqs${s.id}${i}s`, 0.6)}<Sack at={a.at} scale={a.scale} uid={`fqs${s.id}${i}`} fog={figFog(hzOf(v, C, Z))} /></g> });
        }
      } else if (s.kind === "seller" || s.kind === "sellerM") {
        const r = SellerShop(ctx, s, s.kind === "seller");
        inner.push({ Z: s.z0 + 400, el: r.inner });
        front.push(...r.front);
      } else if (s.kind === "potter") front.push(...PotterShop(ctx, s));
      else if (s.kind === "cobbler") front.push(...CobblerShop(ctx, s));
      else if (s.kind === "smith") front.push(...SmithShop(ctx, s));
      else if (s.kind === "baker") {
        const r = BakerShop(ctx, s);
        inner.push({ Z: s.z0 + 300, el: r.inner });
        front.push(...r.front);
      }
      for (let k = n0; k < front.length; k++) front[k].mask = mId;
    }
  }
  // the stepping stones across the road (low: drawn with the ground)
  const stones: React.ReactNode[] = [];
  for (const Zc of CROSSINGS) {
    if (Zc - STONE.hz < C.Z + NEAR) continue;
    STONE.xs.forEach((X, i) =>
      stones.push(
        <g key={`ss${Zc}${i}`}>
          <AirShadow P={P} v={v} C={C} X={X} Z={Zc} w={STONE.hx + 8} d={STONE.hz} uid={`ss${Zc}${i}s`} amt={0.5} Y={0} />
          <OvalStone C={C} v={v} X={X} Z={Zc} hx={STONE.hx} hz={STONE.hz} top={STONE.top} uid={`ss${Zc}${i}`} />
        </g>,
      ),
    );
  }
  inner.sort((a, b) => b.Z - a.Z);
  front.sort((a, b) => b.Z - a.Z);
  return { C, P, v, inner, front, masks, bays, stones };
};

const FreeStreetNoEngine: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const { C, P, v, inner, front, masks, bays, stones } = sceneAt(f);
  const cam = swayCam({ k: 1, cx: 540, cy: 960 }, f);
  const frontEls = front.map((it) => (it.mask ? <g key={`m${it.key}`} mask={`url(#${it.mask})`}>{it.el}</g> : it.el));

  return (
    <AirStage v={v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <WallGrads C={C} v={v} />
        <Ground C={C} v={v} />
        {/* the horizon as a soft zone over the ground only (the plaza and the road's far end melt into the air) */}
        <AirHorizonHaze v={{ ...v, horizon: HORIZON }} below={170} id="fs-hz" />
        <Engine C={C} v={v} />
        {stones}
        {/* the near street sinks a little toward the frame's bottom (the shops stay the subject) */}
        <defs>
          <linearGradient id="fs-near" x1={0} y1={1240} x2={0} y2={1960} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={v.pal.shadow} stopOpacity={0} />
            <stop offset="1" stopColor={v.pal.shadow} stopOpacity={0.16} />
          </linearGradient>
        </defs>
        <rect x={-100} y={1240} width={1280} height={760} fill="url(#fs-near)" />
        {inner.map((it) => it.el)}
        {bays}
        <Eaves C={C} P={P} v={v} side={-1} />
        <Eaves C={C} P={P} v={v} side={1} />
        <defs>{masks}</defs>
        {frontEls}
      </WorldSvg>
    </AirStage>
  );
};

export default FreeStreetNoEngine;
