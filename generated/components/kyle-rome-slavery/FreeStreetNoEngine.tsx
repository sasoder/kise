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
// ~28 frames apart, each ~450-650 px for ~18 frames as the camera trucks toward it (TRUCK, FEATURED in the plan). The
// camera trucks a little toward the shop being passed (near shops slide, the far engine barely moves). No text.
// CAUSE BEFORE EFFECT: the grinders' fists are on the quern handles on every frame (romeCast grip); the smith's hammer
// head meets the anvil's top at phase 0 of each blow; the baker's fists stay on his peel.
// Orange = only the dashed engine (the clip rule: dashed orange = the machine that could have been but was never
// built). People, bread, cloth and pots are cream; the street is umber.
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
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { swayCam, type P2 } from "../kits/maps/incaShared";
import { ACCENT, CENTRE_D, HUB_RING_R, PITCH_R, RIM_R } from "../kyle-london/orbitWorld";
import { Box, ContactShadow, tintInk, type Persp, type VolInk } from "../kyle-london/londonDepth";
import { AXLE_Y, ENG_S, FLY_PITCH, HURST, PIN_PITCH, SHAFT_Y, STAND as ASTAND, STONE_R } from "./muscleOrMachinePlan";
import {
  Amphora,
  Basket,
  CREAM,
  Freeman,
  Overseer,
  POSES,
  POTTER,
  PotterWheel,
  RotaryQuern,
  Sack,
  Slave,
  Stool,
  headTurn,
  idle,
  quernHandle,
  type FigPose,
  type Ink,
} from "./romeCast";
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
  hazeAt,
  project,
  rAt,
  type Shop,
  type StreetCam,
} from "./freeStreetPlan";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// PALETTE (styles/dwarkesh-map.md): the page, cream ink, the dark casing; architecture as dark umber planes in cream line
// ---------------------------------------------------------------------------
const DARK = "#17120D";
const INK_RGB = "233,221,191";
const FAC_L = "#3B3025"; // the left row's fronts: turned away from the light, in shade but readable
const FAC_R = "#6E5C47"; // the right row's fronts: in the daylight
const JAMB = "#2A2119"; // the far wall of an opening, facing us: the dark room behind the workers
const UNDER = "#1E1813"; // lintel and ceiling undersides
const BACK_L = "#1A140E";
const BACK_R = "#211A13";
const FLOOR_IN = "#2A2119";
const TIMBER = "#3A2C1E";
const WINDOW = "#15100B";
const ROAD = "#30271E"; // the joints between the basalt slabs
const SLAB = "#4D4134";
const RUT = "#3A3027";
const PAVE = "#76644E"; // the pavements' tops, in the daylight
const KERB_L = "#3C3126";
const KERB_R = "#7A6750";
const PLAZA = "#5E4F3D";
const BOARD = "#4A3826";
/** the daylight haze the distance sinks into, and the sky between the eaves */
const HAZE = "#5B4C3B";
const SKY_TOP = "#6E5E48";

const NEAR = 40; // near clip, units in front of the eye
const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
const pt = (v: P2) => `${fx(v[0])},${fx(v[1])}`;
const poly = (q: P2[]) => `M${q.map(pt).join("L")}Z`;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const hexRgb = (h: string) => {
  const m = h.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const r = h.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return r ? [1, 2, 3].map((i) => Number(r[i])) : [0, 0, 0];
};
const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};
/** a colour sunk toward the page by the haze (h = 1 near, lower far) */
const hz = (col: string, h: number) => mixHex(HAZE, col, h);
const cream = (a: number) => `rgba(${INK_RGB},${a.toFixed(3)})`;
/** the line weight at depth ratio r (thinner with distance) */
const lw = (r: number, w = 1.8) => Math.max(0.5, Math.min(3.2, w * Math.pow(r, 0.7)));

/** the kit's Persp for our dollying pinhole camera (Box / ContactShadow read p, r, vp[0] and horizonY in 3D terms) */
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
const volOf = (lit: string, mid: string, dark: string, h: number): VolInk => ({ lit: hz(lit, h), mid: hz(mid, h), dark: hz(dark, h) });
const STONE_V = ["#5C4D3C", "#4A3D30", "#2A2119"] as const;
const WOOD_V = ["#5A4632", "#46372A", "#2A2016"] as const;
const IRON_V = ["#4E4740", "#3A3430", "#1E1A17"] as const;

type Item = { Z: number; key: string; el: React.ReactNode };
const inkAt = (h: number): Ink => tintInk(CREAM, h);

// ---------------------------------------------------------------------------
// THE GROUND: the plaza beyond the street's end, the basalt road (slab joints, cart ruts), the kerbs, the pavements
// ---------------------------------------------------------------------------
/** the road's slab mesh (a jittered grid of irregular basalt slabs, fixed in the world) */
const SLAB_COLS = 5;
const SLAB_DZ = 104;
const ROW0 = -1200;
const NROWS = Math.ceil((STREET_END - ROW0) / SLAB_DZ);
const SLAB_V: P2[][] = Array.from({ length: SLAB_COLS + 1 }, (_, i) =>
  Array.from({ length: NROWS + 1 }, (_, j): P2 => {
    const X = -ROAD_HW + (i * 2 * ROAD_HW) / SLAB_COLS + (i > 0 && i < SLAB_COLS ? (random(`sx${i}-${j}`) - 0.5) * 44 : 0);
    const Z = ROW0 + j * SLAB_DZ + (j > 0 && j < NROWS ? (random(`sz${i}-${j}`) - 0.5) * 56 : 0);
    return [X, Z];
  }),
);
const Ground: React.FC<{ C: StreetCam }> = ({ C }) => {
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const zA = C.Z + NEAR;
  const els: React.ReactNode[] = [];
  // the plaza beyond the street: bands sinking into the page toward the horizon
  for (let i = 0; i < 10; i++) {
    const za = STREET_END + 600 * Math.pow(i, 1.7);
    const zb = STREET_END + 600 * Math.pow(i + 1, 1.7);
    els.push(<path key={`pl${i}`} d={poly([p(-9000, 0, za), p(9000, 0, za), p(9000, 0, zb), p(-9000, 0, zb)])} fill={hz(PLAZA, hazeAt(C, (za + zb) / 2) * (1 - i / 11))} />);
  }
  // the road and the pavements, in depth segments (each its own haze)
  const SEG = 350;
  for (let z0 = Math.floor(zA / SEG) * SEG; z0 < STREET_END; z0 += SEG) {
    const za = Math.max(z0, zA);
    const zb = Math.min(z0 + SEG, STREET_END);
    if (zb <= za) continue;
    const h = hazeAt(C, (za + zb) / 2);
    const k = `g${z0}`;
    els.push(<path key={`${k}r`} d={poly([p(-ROAD_HW, 0, za), p(ROAD_HW, 0, za), p(ROAD_HW, 0, zb), p(-ROAD_HW, 0, zb)])} fill={hz(ROAD, h)} />);
    for (const s of [-1, 1]) {
      const kx = s * ROAD_HW;
      const fxX = s * FACADE_X;
      // the pavement's top and the kerb's face (the left kerb faces +X: away from the light; the right one lit)
      els.push(<path key={`${k}p${s}`} d={poly([p(kx, PAVE_Y, za), p(fxX, PAVE_Y, za), p(fxX, PAVE_Y, zb), p(kx, PAVE_Y, zb)])} fill={hz(PAVE, h)} />);
      els.push(<path key={`${k}k${s}`} d={poly([p(kx, 0, za), p(kx, PAVE_Y, za), p(kx, PAVE_Y, zb), p(kx, 0, zb)])} fill={hz(s < 0 ? KERB_L : KERB_R, h)} />);
    }
  }
  // the slabs (filled in haze bins; the joints are the dark road showing between them)
  const bins: { d: string; h: number }[] = [];
  const jA = Math.max(0, Math.floor((zA - ROW0) / SLAB_DZ) - 1);
  for (let j = jA; j < NROWS; j++) {
    const zm = ROW0 + (j + 0.5) * SLAB_DZ;
    if (zm > STREET_END) break;
    const h = hazeAt(C, zm);
    const bi = Math.min(9, Math.floor((1 - h) * 24));
    if (!bins[bi]) bins[bi] = { d: "", h };
    for (let i = 0; i < SLAB_COLS; i++) {
      const q = [SLAB_V[i][j], SLAB_V[i + 1][j], SLAB_V[i + 1][j + 1], SLAB_V[i][j + 1]];
      if (Math.min(...q.map((v) => v[1])) < zA) continue;
      const cx = q.reduce((a, v) => a + v[0], 0) / 4;
      const cz = q.reduce((a, v) => a + v[1], 0) / 4;
      const ins = q.map((v): P2 => {
        const dx = cx - v[0];
        const dz = cz - v[1];
        const L = Math.hypot(dx, dz) || 1;
        return [v[0] + (dx / L) * 2.4, Math.min(STREET_END, v[1] + (dz / L) * 2.4)];
      });
      bins[bi].d += poly(ins.map((v) => p(v[0], 0, v[1])));
    }
  }
  bins.forEach((b, i) => b && els.push(<path key={`sl${i}`} d={b.d} fill={hz(SLAB, b.h)} />));
  // the cart ruts worn into the slabs, and the joints of the kerbstones and the pavement
  let ruts = "";
  let joints = "";
  for (let Z = Math.ceil(zA / 140) * 140; Z < STREET_END; Z += 140) {
    const za = Z;
    const zb = Math.min(Z + 140, STREET_END);
    for (const x of [-62, 62]) ruts += poly([p(x - 7, 0, za), p(x + 7, 0, za), p(x + 7, 0, zb), p(x - 7, 0, zb)]);
    for (const s of [-1, 1]) {
      joints += `M${pt(p(s * ROAD_HW, 0, Z))}L${pt(p(s * ROAD_HW, PAVE_Y, Z))}`;
      if (Math.round(Z / 140) % 2 === 0) joints += `M${pt(p(s * ROAD_HW, PAVE_Y, Z))}L${pt(p(s * (ROAD_HW + 60), PAVE_Y, Z))}`;
    }
  }
  els.push(<path key="ruts" d={ruts} fill={RUT} opacity={0.55} />);
  els.push(<path key="kj" d={joints} stroke={DARK} strokeWidth={1.1} strokeOpacity={0.5} fill="none" />);
  // the kerb's lit edge (cream line) receding to the VP
  for (const s of [-1, 1]) {
    const a = p(s * ROAD_HW, PAVE_Y, zA);
    const b = p(s * ROAD_HW, PAVE_Y, STREET_END);
    els.push(<path key={`ke${s}`} d={`M${pt(a)}L${pt(b)}`} stroke={cream(s < 0 ? 0.4 : 0.6)} strokeWidth={2} fill="none" />);
  }
  return <g>{els}</g>;
};

// ---------------------------------------------------------------------------
// THE ENGINE THAT WAS NEVER BUILT: cut A's engine (orbitWorld's sun-and-planet flywheel on A's iron A-frame, heading a
// line shaft over millstones), far off at the end of the street, as a fine dashed orange outline only (no fill, no
// shadow: it is not there). Geometry read from muscleOrMachinePlan / orbitWorld (read only), static (it never runs).
// ---------------------------------------------------------------------------
const Engine: React.FC<{ C: StreetCam }> = ({ C }) => {
  const s = ENG_S;
  const Z0 = ENGINE_Z;
  const X0 = ENGINE_X;
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const r = rAt(C, Z0);
  const h = hazeAt(C, Z0);
  const col = mixHex(HAZE, ACCENT, 0.8 + 0.2 * h);
  const sw = 1.5;
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
  void r;
  return (
    <g>
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
 *  the ceiling (seen from below) */
const Interior: React.FC<{ C: StreetCam; s: Shop }> = ({ C, s }) => {
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const sg = s.side;
  const za = Math.max(s.z0, C.Z + NEAR);
  const zb = s.z1;
  if (zb <= za + 4) return null;
  const h = hazeAt(C, (za + zb) / 2) * 0.95;
  const F = sg * FACADE_X;
  const B = sg * BACK_X;
  const farWall = poly([p(F, PAVE_Y, zb), p(B, PAVE_Y, zb), p(B, LINTEL_Y, zb), p(F, LINTEL_Y, zb)]);
  const back = poly([p(B, PAVE_Y, za), p(B, PAVE_Y, zb), p(B, LINTEL_Y, zb), p(B, LINTEL_Y, za)]);
  const floor = poly([p(F, PAVE_Y, za), p(B, PAVE_Y, za), p(B, PAVE_Y, zb), p(F, PAVE_Y, zb)]);
  const ceil = poly([p(F, LINTEL_Y, za), p(B, LINTEL_Y, za), p(B, LINTEL_Y, zb), p(F, LINTEL_Y, zb)]);
  // the far jamb's edge (the wall's thickness) and a dark band where the room goes back into the gloom
  const jambE = p(sg * (FACADE_X + WALL_T), PAVE_Y, zb);
  const jambT = p(sg * (FACADE_X + WALL_T), LINTEL_Y, zb);
  const rr = rAt(C, zb);
  return (
    <g>
      <path d={back} fill={hz(sg < 0 ? BACK_L : BACK_R, h)} />
      <path d={floor} fill={hz(FLOOR_IN, h)} />
      <path d={farWall} fill={hz(JAMB, h)} />
      <path d={ceil} fill={hz(UNDER, h)} />
      <path d={`M${pt(jambE)}L${pt(jambT)}`} stroke={DARK} strokeWidth={lw(rr, 1.4)} strokeOpacity={0.7} />
      {/* the ceiling's joists (timber, across the room) */}
      {Array.from({ length: 6 }, (_, i) => za + ((i + 0.5) * (zb - za)) / 6).map((Zj, i) => (
        <path key={i} d={poly([p(F, LINTEL_Y, Zj - 10), p(B, LINTEL_Y, Zj - 10), p(B, LINTEL_Y + 22, Zj - 10), p(F, LINTEL_Y + 22, Zj - 10)])} fill={hz(TIMBER, h)} stroke={DARK} strokeWidth={lw(rAt(C, Zj), 1)} />
      ))}
      {/* the gloom of the room behind the jamb */}
      <path d={poly([jambE, p(B, PAVE_Y, zb), p(B, LINTEL_Y, zb), jambT])} fill={DARK} opacity={0.35} />
    </g>
  );
};

/** one bay of the front (a pier + the wall over the opening), with its opening as a hole; the upper storey's windows;
 *  the timber lintel; the far jamb's cream arris */
const Bay: React.FC<{ C: StreetCam; side: -1 | 1; b0: number; b1: number; o0?: number; o1?: number; idx: number; closed?: boolean }> = ({ C, side, b0, b1, o0, o1, idx, closed }) => {
  const p = (X: number, Y: number, Z: number) => project(C, X, Y, Z);
  const za = Math.max(b0, C.Z + NEAR);
  const zb = Math.min(b1, STREET_END);
  if (zb <= za) return null;
  const F = side * FACADE_X;
  const h = hazeAt(C, (za + zb) / 2);
  const rr = rAt(C, (za + zb) / 2);
  const outer = poly([p(F, PAVE_Y, za), p(F, PAVE_Y, zb), p(F, UPPER_TOP, zb), p(F, UPPER_TOP, za)]);
  let hole = "";
  let lintel = "";
  let arris = "";
  let boards = "";
  const hasOpen = o0 !== undefined && o1 !== undefined && o1 > za;
  if (hasOpen) {
    const ha = Math.max(o0!, za);
    hole = poly([p(F, PAVE_Y, ha), p(F, PAVE_Y, o1!), p(F, LINTEL_Y, o1!), p(F, LINTEL_Y, ha)]);
    lintel = poly([p(F, LINTEL_Y, Math.max(o0! - 40, za)), p(F, LINTEL_Y, o1! + 40), p(F, LINTEL_Y - LINTEL_H, o1! + 40), p(F, LINTEL_Y - LINTEL_H, Math.max(o0! - 40, za))]);
    arris = `M${pt(p(F, PAVE_Y, o1!))}L${pt(p(F, LINTEL_Y, o1!))}L${pt(p(F, LINTEL_Y, ha))}`;
    if (closed) {
      for (let Z = o0!; Z < o1!; Z += 45) {
        if (Z < za) continue;
        boards += `M${pt(p(F, PAVE_Y, Z))}L${pt(p(F, LINTEL_Y, Z))}`;
      }
    }
  }
  // the upper storey's small windows (two per bay), recessed: dark, with a cream sill
  let win = "";
  let sill = "";
  const wins = hasOpen ? [o0! + 90, o0! + 330] : [b0 + 120];
  for (const wz of wins) {
    if (wz < za || wz + 100 > zb) continue;
    win += poly([p(F, -880, wz), p(F, -880, wz + 100), p(F, -1020, wz + 100), p(F, -1020, wz)]);
    sill += `M${pt(p(F, -872, wz - 8))}L${pt(p(F, -872, wz + 108))}`;
  }
  const lineW = lw(rr, 1.6);
  return (
    <g key={`bay${idx}`}>
      <path d={outer + hole} fillRule="evenodd" fill={hz(side < 0 ? FAC_L : FAC_R, h)} />
      {/* plaster scored into a band at the floor line of the upper storey */}
      <path d={`M${pt(p(F, -760, za))}L${pt(p(F, -760, zb))}`} stroke={DARK} strokeWidth={lineW} strokeOpacity={0.5} />
      {closed && hasOpen ? (
        <g>
          <path d={hole} fill={hz(BOARD, h)} />
          <path d={boards} stroke={DARK} strokeWidth={lineW} strokeOpacity={0.7} fill="none" />
          <path d={hole} fill="none" stroke={cream(0.25 * h)} strokeWidth={lineW * 0.7} />
        </g>
      ) : null}
      {win ? <path d={win} fill={hz(WINDOW, h)} stroke={DARK} strokeWidth={lineW * 0.8} /> : null}
      {sill ? <path d={sill} stroke={cream(0.4 * h)} strokeWidth={lineW} /> : null}
      {lintel ? <path d={lintel} fill={hz(TIMBER, h)} stroke={DARK} strokeWidth={lineW} /> : null}
      {lintel ? <path d={`M${pt(p(F, LINTEL_Y - LINTEL_H, Math.max(o0! - 40, za)))}L${pt(p(F, LINTEL_Y - LINTEL_H, o1! + 40))}`} stroke={cream(0.42 * h)} strokeWidth={lineW * 0.8} /> : null}
      {arris ? <path d={arris} fill="none" stroke={cream((side < 0 ? 0.42 : 0.5) * h)} strokeWidth={lineW} /> : null}
      {/* the foot of the wall on the pavement */}
      <path d={`M${pt(p(F, PAVE_Y, za))}L${pt(p(F, PAVE_Y, zb))}`} stroke={DARK} strokeWidth={lineW * 1.6} strokeOpacity={0.6} />
    </g>
  );
};

/** the tiled eaves along a row (projecting over the pavement), in haze segments */
const Eaves: React.FC<{ C: StreetCam; P: Persp; side: -1 | 1 }> = ({ C, P, side }) => {
  const out: React.ReactNode[] = [];
  const zA = C.Z + NEAR;
  for (let z0 = Math.floor(zA / 700) * 700; z0 < STREET_END; z0 += 700) {
    const za = Math.max(z0, zA);
    const zb = Math.min(z0 + 700, STREET_END);
    if (zb <= za) continue;
    const h = hazeAt(C, (za + zb) / 2);
    const X0 = side < 0 ? -FACADE_X : FACADE_X - EAVE_OUT;
    const X1 = side < 0 ? -FACADE_X + EAVE_OUT : FACADE_X;
    out.push(<Box key={z0} P={P} X0={X0} X1={X1} Y0={UPPER_TOP - 40} Y1={UPPER_TOP} Z0={za} Z1={zb} ink={side > 0 ? volOf("#7A6750", "#5E4E3C", "#2E251C", h) : volOf("#4A3C2E", "#3A2E22", "#1E1812", h)} uid={`eav${side}-${z0}`} hatch={false} />);
    // the rafter ends under the eaves
    let d = "";
    for (let Z = Math.ceil(za / 90) * 90; Z < zb; Z += 90) {
      const a = P.p(side * FACADE_X, UPPER_TOP, Z);
      const b = P.p(side * (FACADE_X - EAVE_OUT), UPPER_TOP, Z);
      d += `M${pt(a)}L${pt(b)}`;
    }
    out.push(<path key={`r${z0}`} d={d} stroke={DARK} strokeWidth={lw(rAt(C, (za + zb) / 2), 1.6)} strokeOpacity={0.7} />);
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// THE PEOPLE AT WORK (each shop's front items; X is mirrored by side, `dir` faces the street)
// ---------------------------------------------------------------------------
type Ctx = { C: StreetCam; P: Persp; f: number };
const at3 = (c: Ctx, X: number, Y: number, Z: number) => ({ at: c.C ? project(c.C, X, Y, Z) : ([0, 0] as P2), scale: rAt(c.C, Z) });
const shadow = (c: Ctx, X: number, Z: number, w: number, d: number, uid: string, amt = 0.75, Y = PAVE_Y) => <ContactShadow P={c.P} X={X} Z={Z} w={w} d={d} uid={uid} amt={amt} Y={Y} />;

/** a kneeling grinder at a rotary quern on the threshold (slave or free) */
const QuernGroup = (c: Ctx, sh: Shop, Zq: number, who: "slave" | "free", key: string): Item => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const Xq = sg * 250;
  const Xg = sg * (250 + 62);
  const h = hazeAt(c.C, Zq);
  // the mill stands on a low stone platform at the threshold (keeps the grinding hands up out of the caption band)
  const LIFT = 80;
  const top = PAVE_Y - LIFT;
  const q = at3(c, Xq, top, Zq);
  const g = at3(c, Xg, top, Zq);
  const phase = c.f / 44 + (who === "slave" ? 0.15 : 0.6);
  const pose = POSES.grind(dir, phase);
  const hand = quernHandle(q.at, q.scale, phase, dir);
  const grip = dir === 1 ? { L: hand } : { R: hand };
  const ink = inkAt(h);
  return {
    Z: Zq,
    key,
    el: (
      <g key={key}>
        {shadow(c, (Xg + Xq) / 2, Zq, 130, 80, `${key}-ps`, 0.6)}
        <Box P={c.P} X0={Math.min(sg * 200, sg * 395)} X1={Math.max(sg * 200, sg * 395)} Y0={top} Y1={PAVE_Y} Z0={Zq - 75} Z1={Zq + 75} ink={volOf(...STONE_V, h)} uid={`${key}-pl`} />
        {shadow(c, Xg, Zq, 90, 40, `${key}-gs`, 0.75, top)}
        {shadow(c, Xq, Zq, 46, 34, `${key}-qs`, 0.6, top)}
        <RotaryQuern at={q.at} scale={q.scale} turn={phase} dir={dir} uid={`${key}-q`} ink={ink} />
        {who === "slave" ? (
          <Slave pose={pose} at={g.at} scale={g.scale} uid={`${key}-g`} variant={1} garb="exomis" fetters shade={1} grip={grip} ink={ink} cloth={ink} />
        ) : (
          <Freeman pose={pose} at={g.at} scale={g.scale} uid={`${key}-g`} variant={2} shade={1} grip={grip} ink={ink} cloth={ink} />
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
    [0, 352, 830],
    [1, 344, 858],
  ] as const) {
    const a = at3(c, sg * X, PAVE_Y, Z);
    items.push({ Z, key: `sk${i}`, el: <g key={`sk${i}`}>{shadow(c, sg * X, Z, 40, 30, `sk${i}s`, 0.6)}<Sack at={a.at} scale={a.scale} uid={`sk${i}`} ink={inkAt(hazeAt(c.C, Z))} /></g> });
  }
  // the carrier: in fetters, a sack on his shoulder, walking in off the pavement into the shop (into its gloom)
  {
    const Z = 790;
    const Xa = 200 + 2.93 * f;
    const X = sg * Xa;
    const ph = f / 30 + 0.3;
    const a = at3(c, X, PAVE_Y, Z);
    const h = hazeAt(c.C, Z) * (1 - 0.4 * smooth((Xa - 340) / 220));
    const el = (
      <g key="car">
        {shadow(c, X, Z, 70, 36, "cars")}
        <Slave pose={POSES.carry(sg as 1 | -1, ph)} at={a.at} scale={a.scale} uid="car" variant={0} fetters load="sack" shade={1} ink={inkAt(h)} cloth={inkAt(h)} />
      </g>
    );
    items.push({ Z, key: Xa > 360 ? "car-in" : "car", el });
  }
  // the overseer at the door with his rod, on the pavement by the far pier, watching them (lifts it a little on "labor")
  {
    const Z = 500;
    const X = sg * 345;
    const a = at3(c, X, PAVE_Y, Z);
    const h = hazeAt(c.C, Z);
    const lift = 0.32 * Math.sin(Math.PI * smooth((f - 46) / 56));
    const pose: FigPose = headTurn(idle(POSES.raiseRod(dir, lift), f, 1), dir * 0.35, 0.1);
    items.push({
      Z,
      key: "ovs",
      el: (
        <g key="ovs">
          {shadow(c, X, Z, 70, 36, "ovss")}
          <Overseer pose={pose} at={a.at} scale={a.scale} uid="ovs" variant={0} shade={1} ink={inkAt(h)} cloth={inkAt(h)} />
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
  const h = hazeAt(c.C, (za + zb) / 2);
  const zA = Math.max(za, c.C.Z + NEAR);
  if (zb <= zA) return null;
  const mouths = [0.22, 0.52, 0.8].map((u) => {
    const Z = za + (zb - za) * u;
    const ctr = project(c.C, (X0 + X1) / 2, top, Z);
    const rx = 30 * rAt(c.C, Z);
    const ry = Math.max(0.6, (project(c.C, 0, top, Z - 30)[1] - project(c.C, 0, top, Z + 30)[1]) / 2);
    return <ellipse key={u} cx={ctr[0]} cy={ctr[1]} rx={rx} ry={ry} fill={DARK} stroke={cream(0.4 * h)} strokeWidth={lw(rAt(c.C, Z), 1)} />;
  });
  return (
    <g>
      <Box P={c.P} X0={X0} X1={X1} Y0={top} Y1={PAVE_Y} Z0={zA} Z1={zb} ink={volOf(...STONE_V, h)} uid={uid} />
      {mouths}
    </g>
  );
};

const SellerShop = (c: Ctx, sh: Shop, woman: boolean): { front: Item[]; inner: React.ReactNode } => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const Z = sh.z0 + 170;
  const X = sg * 350;
  const a = at3(c, X, PAVE_Y, Z);
  const h = hazeAt(c.C, Z);
  const t = 0.55 + 0.45 * Math.sin(c.f / 21 + sh.z0 * 0.01);
  const pose = idle(POSES.gesture(dir, t), c.f, sh.z0 % 7);
  const key = `sel${sh.id}`;
  const Fig = Freeman;
  // amphorae on the pavement by the far jamb, a basket of loaves on the counter's end
  const am = [0, 1].map((i) => {
    const Za = sh.z1 - 50 - i * 46;
    const Xa = sg * (FACADE_X - 30 - i * 10);
    const aa = at3(c, Xa, PAVE_Y, Za);
    return { Z: Za, key: `${key}a${i}`, el: <g key={`${key}a${i}`}>{shadow(c, Xa, Za, 30, 22, `${key}a${i}s`, 0.6)}<Amphora at={aa.at} scale={aa.scale} uid={`${key}a${i}`} angle={-sg * 6} ink={inkAt(hazeAt(c.C, Za))} /></g> };
  });
  return {
    inner: <Counter key={`${key}c`} c={c} sh={sh} za={sh.z0 + 250} zb={sh.z0 + 425} uid={`${key}c`} />,
    front: [
      ...am,
      {
        Z,
        key,
        el: (
          <g key={key}>
            {shadow(c, X, Z, 64, 34, `${key}s`)}
            <Fig pose={pose} at={a.at} scale={a.scale} uid={key} variant={woman ? 3 : 1} shade={1} held="cup" ink={inkAt(h)} cloth={inkAt(h)} />
          </g>
        ),
      },
    ],
  };
};

const PotterShop = (c: Ctx, sh: Shop): Item[] => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const Z = sh.z0 + 260;
  const Xp = sg * 355;
  const ph = c.f / 48 + sh.z0 * 0.001;
  const pp = at3(c, Xp, PAVE_Y, Z);
  const wheel = at3(c, Xp + dir * POTTER.wheelDX, PAVE_Y, Z);
  const stool = at3(c, Xp - dir * POTTER.stoolDX * -1, PAVE_Y, Z);
  const h = hazeAt(c.C, Z);
  const key = `pot${sh.id}`;
  // finished jars drying on the pavement against the wall
  const jars = [0, 1, 2].map((i) => {
    const Zj = sh.z0 + 340 + i * 34;
    const Xj = sg * (FACADE_X - 26);
    const aj = at3(c, Xj, PAVE_Y, Zj);
    return { Z: Zj, key: `${key}j${i}`, el: <g key={`${key}j${i}`}>{shadow(c, Xj, Zj, 22, 18, `${key}j${i}s`, 0.5)}<Amphora at={aj.at} scale={aj.scale * 0.55} uid={`${key}j${i}`} ink={inkAt(hazeAt(c.C, Zj))} /></g> };
  });
  return [
    ...jars,
    {
      Z,
      key,
      el: (
        <g key={key}>
          {shadow(c, Xp, Z, 80, 38, `${key}s`)}
          <Stool at={stool.at} scale={stool.scale} uid={`${key}st`} ink={inkAt(h)} />
          <PotterWheel at={wheel.at} scale={wheel.scale} turn={ph * 3} dir={dir} uid={`${key}w`} ink={inkAt(h)} />
          <Freeman pose={POSES.potter(dir, ph)} at={pp.at} scale={pp.scale} uid={key} variant={1} shade={1} ink={inkAt(h)} cloth={inkAt(h)} />
        </g>
      ),
    },
  ];
};

const CobblerShop = (c: Ctx, sh: Shop): Item[] => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const Z = sh.z0 + 250;
  const Xp = sg * 355;
  const ph = c.f / 26 + 0.3;
  const pp = at3(c, Xp, PAVE_Y, Z);
  const stool = at3(c, Xp + dir * POTTER.stoolDX, PAVE_Y, Z);
  const h = hazeAt(c.C, Z);
  const key = `cob${sh.id}`;
  // the low bench in front of him, the shoe on its last in his hands
  const bx = Xp + dir * POTTER.wheelDX;
  const hand = project(c.C, bx - dir * 8, PAVE_Y - 96 - 6 * Math.sin(2 * Math.PI * ph), Z);
  const sc = rAt(c.C, Z);
  const shoe = (
    <g transform={`translate(${pt(hand)}) scale(${(sc * dir).toFixed(4)} ${sc.toFixed(4)})`}>
      <path d="M-34,6C-30,-4 -6,-8 10,-10C22,-12 30,-6 34,0C34,6 24,10 -30,10Z" fill={inkAt(h).deep} stroke={DARK} strokeWidth={2.2} />
      <path d="M-28,4C-14,-2 8,-4 26,-2" fill="none" stroke={DARK} strokeWidth={1.2} strokeDasharray="3 3" />
    </g>
  );
  // sandals hanging from pegs on the pier beyond the opening
  const hang = [0, 1, 2, 3].map((i) => {
    const Zh = sh.z1 + 14 + i * 20;
    const top = project(c.C, sg * (FACADE_X - 4), -360 - (i % 2) * 40, Zh);
    const s2 = rAt(c.C, Zh);
    return <path key={i} transform={`translate(${pt(top)}) scale(${(s2 * 0.6).toFixed(4)} ${s2.toFixed(4)})`} d="M-8,0L8,0L10,60C10,70 -10,70 -10,60Z" fill={inkAt(hazeAt(c.C, Zh)).hair} stroke={DARK} strokeWidth={2} />;
  });
  return [
    { Z: sh.z1 + 40, key: `${key}h`, el: <g key={`${key}h`}>{hang}</g> },
    {
      Z,
      key,
      el: (
        <g key={key}>
          {shadow(c, Xp, Z, 80, 38, `${key}s`)}
          <Box P={c.P} X0={Math.min(bx - sg * 26, bx + sg * 26)} X1={Math.max(bx - sg * 26, bx + sg * 26)} Y0={PAVE_Y - 74} Y1={PAVE_Y} Z0={Z - 46} Z1={Z + 46} ink={volOf(...WOOD_V, h)} uid={`${key}b`} />
          <Stool at={stool.at} scale={stool.scale} uid={`${key}st`} ink={inkAt(h)} />
          <Freeman pose={POSES.potter(dir, ph)} at={pp.at} scale={pp.scale} uid={key} variant={2} shade={1} ink={inkAt(h)} cloth={inkAt(h)} />
          {shoe}
        </g>
      ),
    },
  ];
};

const SmithShop = (c: Ctx, sh: Shop): Item[] => {
  const sg = sh.side;
  const dir = (-sg) as 1 | -1;
  const Z = sh.z0 + 270;
  const Xs = sg * 355;
  const Xa = Xs + dir * 141;
  const ph = c.f / 30 + sh.z0 * 0.0007;
  // the smithy's raised stone floor runs out over the pavement (keeps the blow up out of the caption band)
  const LIFT = 62;
  const fl = PAVE_Y - LIFT;
  const pp = at3(c, Xs, fl, Z);
  const h = hazeAt(c.C, Z);
  const key = `smi${sh.id}`;
  const aTop = fl - 43;
  const r = rAt(c.C, Z);
  const bar = poly([project(c.C, Xa - 30, aTop - 2, Z - 6), project(c.C, Xa + 30, aTop - 2, Z - 6), project(c.C, Xa + 30, aTop - 9, Z - 6), project(c.C, Xa - 30, aTop - 9, Z - 6)]);
  return [
    {
      Z,
      key,
      el: (
        <g key={key}>
          {shadow(c, (Xs + Xa) / 2, Z, 150, 90, `${key}ps`, 0.6)}
          <Box P={c.P} X0={Math.min(Xa - sg * 50, sg * (FACADE_X + 40))} X1={Math.max(Xa - sg * 50, sg * (FACADE_X + 40))} Y0={fl} Y1={PAVE_Y} Z0={Z - 90} Z1={Z + 90} ink={volOf(...STONE_V, h)} uid={`${key}pl`} />
          {shadow(c, Xs, Z, 80, 38, `${key}s`, 0.75, fl)}
          {shadow(c, Xa, Z, 40, 30, `${key}as`, 0.6, fl)}
          <Box P={c.P} X0={Xa - 30} X1={Xa + 30} Y0={fl - 30} Y1={fl} Z0={Z - 34} Z1={Z + 34} ink={volOf(...WOOD_V, h)} uid={`${key}blk`} />
          <Box P={c.P} X0={Xa - 26} X1={Xa + 26} Y0={aTop} Y1={fl - 30} Z0={Z - 16} Z1={Z + 16} ink={volOf(...IRON_V, h)} uid={`${key}anv`} hatch={false} />
          <path d={bar} fill={inkAt(h).main} stroke={DARK} strokeWidth={lw(r, 1.2)} />
          <Freeman pose={POSES.strike(dir, ph)} at={pp.at} scale={pp.scale} uid={key} variant={0} tool="hammer" shade={1} ink={inkAt(h)} cloth={inkAt(h)} />
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
  const Zo = sh.z0 + 340;
  const h = hazeAt(c.C, Zo);
  const p = (X: number, Y: number, Z: number) => project(c.C, X, Y, Z);
  const key = `bak${sh.id}`;
  const oz0 = sh.z0 + 210;
  const oz1 = sh.z0 + 430;
  const ox0 = sg * (FACADE_X + 20);
  const oxF = sg * (FACADE_X + 40);
  const mouthY0 = PAVE_Y - 150;
  const mouthY1 = PAVE_Y - 250;
  // the dome: the silhouette of a hemisphere (sampled, convex hull)
  const dc: [number, number, number] = [sg * 510, PAVE_Y - 240, Zo];
  const pts: P2[] = [];
  for (let i = 0; i <= 12; i++)
    for (let j = 0; j < 24; j++) {
      const th = (i / 12) * (Math.PI / 2);
      const ph = (j / 24) * Math.PI * 2;
      pts.push(p(dc[0] + 150 * Math.cos(th) * Math.cos(ph), dc[1] - 200 * Math.sin(th), dc[2] + 140 * Math.cos(th) * Math.sin(ph)));
    }
  const hull = convexHull(pts);
  const za = Math.max(oz0, c.C.Z + NEAR);
  const stroke = DARK;
  const r = rAt(c.C, Zo);
  // the peel: butt near the baker's hands, blade inside the oven; it slides in and out
  const slide = 22 * Math.sin((2 * Math.PI * c.f) / 46);
  const Xb = sg * 205;
  const yP = PAVE_Y - 208;
  const butt = Xb + u * (20 + slide);
  const bladeC = Xb + u * (300 + slide);
  const peelIn = (X0: number, X1: number) => `M${pt(p(X0, yP, Zo))}L${pt(p(X1, yP, Zo))}`;
  const blade = poly([p(bladeC - 34, yP + 2, Zo - 30), p(bladeC + 34, yP + 2, Zo - 30), p(bladeC + 34, yP + 2, Zo + 30), p(bladeC - 34, yP + 2, Zo + 30)]);
  const loafC = p(bladeC, yP - 6, Zo);
  const loaf = <ellipse cx={loafC[0]} cy={loafC[1]} rx={26 * r} ry={8 * r} fill={inkAt(h).deep} stroke={DARK} strokeWidth={lw(r, 1.1)} />;
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
      <path d={poly(hull)} fill={hz("#62523F", h)} stroke={stroke} strokeWidth={lw(r, 1.6)} />
      {/* the dome's shaded right half (light from the upper left) */}
      <clipPath id={`${key}dc`}>
        <path d={poly(hull)} />
      </clipPath>
      <rect x={p(dc[0], 0, dc[2])[0]} y={0} width={2000} height={2000} fill={hz("#2A2119", h)} opacity={0.75} clipPath={`url(#${key}dc)`} />
      <Box P={c.P} X0={Math.min(ox0, oxF)} X1={Math.max(ox0, oxF)} Y0={PAVE_Y - 270} Y1={PAVE_Y} Z0={za} Z1={oz1} ink={volOf("#6A5A46", "#55473A", "#3A2F25", h)} uid={`${key}fw`} />
      <path d={poly([p(ox0, PAVE_Y, za), p(ox0, PAVE_Y, oz1), p(ox0, PAVE_Y - 270, oz1), p(ox0, PAVE_Y - 270, za)])} fill={hz("#5E4F3E", h)} stroke={DARK} strokeWidth={lw(r, 1.6)} />
      <path d={[1, 2, 3, 4, 5, 6, 7, 8].map((k) => `M${pt(p(ox0, PAVE_Y - k * 31, za))}L${pt(p(ox0, PAVE_Y - k * 31, oz1))}`).join("")} stroke={DARK} strokeOpacity={0.45} strokeWidth={lw(r, 0.9)} />
      <path d={mouth} fill="#0E0B08" />
      {/* the peel's blade and loaf inside the mouth */}
      <g clipPath={`url(#${key}mc)`}>
        <clipPath id={`${key}mc`}>
          <path d={mouth} />
        </clipPath>
        <path d={peelIn(sg * (FACADE_X + 20), bladeC)} stroke={hz("#8C7F60", h)} strokeWidth={6 * r} strokeLinecap="round" />
        <path d={blade} fill={hz("#8C7F60", h)} stroke={DARK} strokeWidth={lw(r, 1)} />
        {loaf}
      </g>
      <path d={mouth} fill="none" stroke={hz("#8C7F60", h)} strokeWidth={lw(r, 5)} />
      <path d={mouth} fill="none" stroke={cream(0.55 * h)} strokeWidth={lw(r, 1.2)} />
    </g>
  );
  // the baker: both fists on the shaft
  const nearHand = project(c.C, Xb + u * (100 + slide), yP, Zo);
  const farHand = project(c.C, Xb + u * (48 + slide), yP - 6, Zo);
  const dir = (sg as 1 | -1);
  const grip = dir === 1 ? { L: nearHand, R: farHand } : { R: nearHand, L: farHand };
  const bp = at3(c, Xb, PAVE_Y, Zo);
  const lean = 6 * Math.sin((2 * Math.PI * c.f) / 46);
  const pose: FigPose = { ...POSES.stand(dir), lean: 10 + lean, crouch: 8, pitch: 4 };
  // loaves in a basket on the pavement behind him
  const bkZ = Zo - 150;
  const bkX = sg * 250;
  const bk = at3(c, bkX, PAVE_Y, bkZ);
  return {
    inner,
    front: [
      { Z: bkZ, key: `${key}bk`, el: <g key={`${key}bk`}>{shadow(c, bkX, bkZ, 36, 26, `${key}bks`, 0.6)}<Basket at={bk.at} scale={bk.scale} uid={`${key}bk`} full={1} ink={inkAt(hazeAt(c.C, bkZ))} /></g> },
      {
        Z: Zo,
        key,
        el: (
          <g key={key}>
            {shadow(c, Xb, Zo, 70, 36, `${key}s`)}
            {/* the shaft outside the oven */}
            <path d={peelIn(butt, sg * (FACADE_X + 20))} stroke={hz("#8C7F60", h)} strokeWidth={6 * r} strokeLinecap="round" />
            <Freeman pose={pose} at={bp.at} scale={bp.scale} uid={key} variant={0} shade={1} grip={grip} ink={inkAt(h)} cloth={inkAt(h)} />
          </g>
        ),
      },
    ],
  };
};

/** a Pompeii stepping stone: an oval block (its top an ellipse in the road's plane), lit from the upper left */
const OvalStone: React.FC<{ C: StreetCam; X: number; Z: number; hx: number; hz: number; top: number; h: number; uid: string }> = ({ C, X, Z, hx, hz: hzz, top, h, uid }) => {
  if (Z - hzz < C.Z + NEAR) return null;
  const ring = (Y: number) => Array.from({ length: 36 }, (_, i) => project(C, X + hx * Math.cos((i / 36) * Math.PI * 2), Y, Z + hzz * Math.sin((i / 36) * Math.PI * 2)));
  const topR = ring(top);
  const body = convexHull([...topR, ...ring(0)]);
  const c = project(C, X, top, Z);
  const r = rAt(C, Z);
  return (
    <g>
      <clipPath id={`${uid}-b`}>
        <path d={poly(body)} />
      </clipPath>
      <path d={poly(body)} fill={hz(STONE_V[1], h)} stroke={DARK} strokeWidth={lw(r, 1.8)} />
      <rect x={c[0] + hx * r * 0.2} y={-4000} width={8000} height={12000} fill={hz(STONE_V[2], h)} opacity={0.7} clipPath={`url(#${uid}-b)`} />
      <path d={poly(topR)} fill={hz(STONE_V[0], h)} stroke={DARK} strokeWidth={lw(r, 1.8)} />
      <path d={poly(topR.slice(14, 27))} fill="none" stroke={cream(0.3 * h)} strokeWidth={lw(r, 1.2)} />
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
const FreeStreetNoEngine: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const C = camAt(f);
  const P = makePersp(C);
  const ctx: Ctx = { C, P, f };
  const cam = swayCam({ k: 1, cx: 540, cy: 960 }, f);

  const inner: { Z: number; el: React.ReactNode }[] = [];
  const front: Item[] = [];
  const bays: React.ReactNode[] = [];
  for (const side of [-1, 1] as const) {
    const row = SHOPS.filter((s) => s.side === side).sort((a, b) => a.z0 - b.z0);
    // the wall before the first opening, each bay (pier + opening), and the wall to the street's end
    let prev = -2000;
    row.forEach((s, i) => {
      bays.push(<Bay key={`b${side}${i}`} C={C} side={side} b0={prev} b1={s.z1} o0={s.z0} o1={s.z1} idx={i} closed={s.kind === "closed"} />);
      prev = s.z1;
    });
    bays.push(<Bay key={`b${side}end`} C={C} side={side} b0={prev} b1={STREET_END} idx={99} />);
    for (const s of row) {
      if (s.z1 < C.Z + NEAR) continue;
      if (s.kind !== "closed") inner.push({ Z: s.z1, el: <Interior key={`in${s.id}`} C={C} s={s} /> });
      if (s.kind === "slave") {
        for (const it of SlaveShop(ctx, s)) {
          if (it.key.endsWith("-in")) inner.push({ Z: it.Z, el: it.el });
          else front.push(it);
        }
      }
      else if (s.kind === "quern") {
        front.push(QuernGroup(ctx, s, s.z0 + 270, "free", `fq${s.id}`));
        for (const [i, X, Z] of [
          [0, 370, s.z0 + 110],
          [1, 390, s.z0 + 160],
        ] as const) {
          const a = at3(ctx, side * X, PAVE_Y, Z);
          front.push({ Z, key: `fqs${s.id}${i}`, el: <g key={`fqs${s.id}${i}`}>{shadow(ctx, side * X, Z, 40, 30, `fqs${s.id}${i}s`, 0.6)}<Sack at={a.at} scale={a.scale} uid={`fqs${s.id}${i}`} ink={inkAt(hazeAt(C, Z))} /></g> });
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
    }
  }
  // the stepping stones across the road (low: drawn with the ground)
  const stones: React.ReactNode[] = [];
  for (const Zc of CROSSINGS) {
    if (Zc - STONE.hz < C.Z + NEAR) continue;
    const h = hazeAt(C, Zc);
    STONE.xs.forEach((X, i) =>
      stones.push(
        <g key={`ss${Zc}${i}`}>
          <ContactShadow P={P} X={X} Z={Zc} w={STONE.hx + 8} d={STONE.hz} uid={`ss${Zc}${i}s`} amt={0.5} Y={0} />
          <OvalStone C={C} X={X} Z={Zc} hx={STONE.hx} hz={STONE.hz} top={STONE.top} h={h} uid={`ss${Zc}${i}`} />
        </g>,
      ),
    );
  }
  inner.sort((a, b) => b.Z - a.Z);
  front.sort((a, b) => b.Z - a.Z);
  // cull what is far off frame (a margin for the bodies)
  const frontEls = front.map((it) => it.el);

  return (
    <TexcocoPage cam={cam} vignette={0.3}>
      <WorldSvg cam={cam}>
        <defs>
          <linearGradient id="fs-sky" x1={0} y1={0} x2={0} y2={HORIZON} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={SKY_TOP} />
            <stop offset="1" stopColor={HAZE} />
          </linearGradient>
        </defs>
        <rect x={-200} y={-200} width={1480} height={HORIZON + 200} fill="url(#fs-sky)" />
        <Ground C={C} />
        {stones}
        {/* the near street sinks into shadow toward the frame's bottom (the shops stay the subject) */}
        <defs>
          <linearGradient id="fs-near" x1={0} y1={1180} x2={0} y2={1960} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0E0B08" stopOpacity={0} />
            <stop offset="0.6" stopColor="#0E0B08" stopOpacity={0.16} />
            <stop offset="1" stopColor="#0E0B08" stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <rect x={-100} y={1180} width={1280} height={800} fill="url(#fs-near)" />
        <Engine C={C} />
        {inner.map((it) => it.el)}
        {bays}
        <Eaves C={C} P={P} side={-1} />
        <Eaves C={C} P={P} side={1} />
        {frontEls}
      </WorldSvg>
    </TexcocoPage>
  );
};

export default FreeStreetNoEngine;
