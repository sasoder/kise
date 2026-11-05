// ---------------------------------------------------------------------------
// EqualDronesAndArmor (kofman-vivaldi, cut 50), revision 1105: on the shared Lyman map. ChinaTalk style (newsprint)
// (styles/chinatalk.md; kit API in generated/components/kits/chinatalk/chinatalkVintage.md; map: lymanShared.tsx).
// Opaque 1080x1920, 24 fps, 289 frames.
//
// CHECK LINE: "behind the Ukrainian line near Lyman these assault units mass as many drone units as armoured units,
// one drone group for every armoured group, and the whole combined force rolls across the front."
//
// THE LINE (Michael Kofman, ChinaTalk, autumn 2026): "[…keep experimenting with ways to] combine mechanized maneuver
// and drones. And if you look at their force structure, they have like equal amounts of basically drones, supporting
// drone units alongside mechanized assault formations to try to get, bring that back to the battlefield."
// WORD -> FRAME (notes/words.json): combine 1 · mechanized 9 · maneuver 21 · and 28 · drones 43 · And 57 · look 67 ·
// their 70 · force 73 · structure 80 · they 97 · have 106 · like 109 · equal 112 · amounts 121 · of 131 ·
// basically 138 · drones 150 · supporting 153 · drone 163 · units 170 · mechanized 200 · assault 212 ·
// formations 217 · to 229 · try 244 · to 249 · get 254 · bring 258 · that 264 · back 268 · to 273 · the 276 ·
// battlefield 279 · (speaker at 289).
// DURATION: the slot 50.458 -> 62.500 s = 12.042 s x 24 = 289 frames (f0..f288).
//
// THE MOTION: the Lyman sector map (3 Nov 2026 front, DeepStateMap) with the Ukrainian side on the left. From f0
// six mechanized assault companies roll in from the west edge, one ink IFV after another at a steady rhythm (about
// one every 2 frames), each braking into its place in an organic company cluster behind the line, the rows stacked
// north and south of the salient across the whole Ukrainian side (eastmost places first, so nothing passes over a
// parked vehicle; the last parks at f74, "force structure"). From "equal" the drone units fly in company by company,
// north first: each twin is one rigid red formation the same shape as its company (one drone per vehicle), flying in
// high over that company and settling just east of it; twins land f141 -> f175 ("drone units"), each complete before
// the next lands. A hold (drone hover) to "assault", then the whole combined force rolls east, company by company
// from the front, across the front line into the Russian-held side (f206 -> f279), the camera panning with it; the
// southern companies roll a little deeper so the force ends in one frame; a settled, living frame (hover, slow creep)
// to f288. Side labels sit below the caption bands: UKRAINE at the start, RUSSIAN-HELD at the end.
// RED = the drones (drone units). Nothing else is red.
//
// SOURCES: the map (front line and held ground, 3 Nov 2026) is DeepStateMap via lymanFrontData.ts. No counts on
// screen: "equal amounts" is Kofman's characterisation of drone-assault units such as CODE 9.2 (now the 475th Assault
// Regiment); the number of pictos is schematic, not data. Drone: Phosphor "drone" fill (MIT), vivaldiPictos.ts.
// Vehicle: IFV_D, drawn for this clip (ifvPicto.ts).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK_HI, Pictogram, RED, RedGroup, VStage, clamp01, hash01, runVCamera } from "../kits/chinatalk/chinatalkVintage";
import type { Pt, VCamKey } from "../kits/chinatalk/chinatalkVintage";
import { IFV_D, IFV_X0, IFV_X1 } from "./ifvPicto";
import { HELD_20261103, MAINFRONT_20261103 } from "./lymanFrontData";
import { LymanMap, RetakenPatch, SideLabel } from "./lymanShared";
import { DRONE_D } from "./vivaldiPictos";

export const FPS = 24;
export const DURATION = 289;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the pictos (world px) -----------------------------------------------------------------------
/** an IFV's 256 box: the silhouette is (IFV_X1 - IFV_X0) / 256 of it long (~99 world px, ~97 on screen at rest) */
const IFV_SIZE = 108;
const IFV_HALF_L = (((IFV_X1 - IFV_X0) / 256) * IFV_SIZE) / 2;
/** a drone's 256 box (the Phosphor drone fills ~224 of it: ~74 world px) */
const DRONE_SIZE = 84;

// --- the force: six rows, each an armoured company with its drone twin just ahead (east) of it ------------
/** unit places inside a company (relative to its centre): two staggered lines, then a little per-unit jitter.
 *  The drone twin uses the SAME places (jitter included), so each pair is two identical shapes. */
const TEMPLATES: Record<number, Pt[]> = {
  5: [
    { x: -120, y: -40 },
    { x: 0, y: -40 },
    { x: 120, y: -40 },
    { x: -60, y: 40 },
    { x: 60, y: 40 },
  ],
  6: [
    { x: -150, y: -40 },
    { x: -30, y: -40 },
    { x: 90, y: -40 },
    { x: -90, y: 40 },
    { x: 30, y: 40 },
    { x: 150, y: 40 },
  ],
};
const JIT_X = 9;
const JIT_Y = 6;
/** company half-length (its outermost place + half a vehicle) and the gap to its twin */
const halfLen = (n: number) => Math.max(...TEMPLATES[n].map((p) => Math.abs(p.x))) + IFV_HALF_L;
const TWIN_GAP = 40;
const FRONT: Pt[] = MAINFRONT_20261103.map(([x, y]) => ({ x, y }));
/** the front's eastmost / westmost crossing over a band of world y (sampled every 4 px; a horizontal line can cross
 *  a ragged front several times) */
const frontX = (y0: number, y1: number, pick: "max" | "min") => {
  let m = pick === "max" ? -Infinity : Infinity;
  for (let y = y0; y <= y1 + 0.01; y += 4) {
    for (let i = 1; i < FRONT.length; i++) {
      const a = FRONT[i - 1];
      const b = FRONT[i];
      if ((a.y - y) * (b.y - y) > 0 || a.y === b.y) continue;
      const x = a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
      m = pick === "max" ? Math.max(m, x) : Math.min(m, x);
    }
  }
  return m;
};
/** the rows: world y of each, and how many vehicles its company has; each row hugs the front, its twin's east
 *  end HUG world px short of the front's westmost point over the row */
const ROWS: { y: number; n: 5 | 6; hug: number }[] = [
  { y: -20, n: 6, hug: 60 },
  { y: 165, n: 5, hug: 60 },
  { y: 360, n: 6, hug: 60 },
  { y: 545, n: 6, hug: 60 },
  { y: 725, n: 6, hug: 40 },
  { y: 905, n: 6, hug: 40 },
];
const ROW_HALF_H = 40 + 40;
const COMPANIES = ROWS.map((r) => {
  const h = halfLen(r.n);
  const east = frontX(r.y - ROW_HALF_H, r.y + ROW_HALF_H, "min") - r.hug;
  const twinX = east - h;
  return { x: twinX - 2 * h - TWIN_GAP, y: r.y, n: r.n, twinX };
});

type Unit = { c: number; i: number; x: number; y: number };
const UNITS: Unit[] = COMPANIES.flatMap((co, c) =>
  TEMPLATES[co.n].map((p, i) => ({
    c,
    i,
    x: p.x + (hash01(c * 31 + i * 7 + 1) - 0.5) * 2 * JIT_X,
    y: co.y + p.y + (hash01(c * 17 + i * 13 + 5) - 0.5) * 2 * JIT_Y,
  })),
);
/** a unit's parked x: its company's place (armour) or its twin's (drone) */
const armX = (u: Unit) => COMPANIES[u.c].x + u.x;
const drnX = (u: Unit) => COMPANIES[u.c].twinX + u.x;

// --- the arrivals: eastmost places first, at an even rhythm ---------------------------------------
/** the order the places fill (east first, so a unit rolling in never passes over a parked one) */
const ARM_ORDER = [...UNITS.keys()].sort((a, b) => armX(UNITS[b]) - armX(UNITS[a]));
const NU = UNITS.length;
/** the armour: rolls in from the west edge at a steady speed and brakes into its place */
const ARM_V = 15;
const ARM_BRAKE = 14;
const ARM_FIRST = 6;
const ARM_LAST = 74;
/** the drones: fly in faster from the west edge into the twin's place */
const DRN_V = 42;
const DRN_BRAKE = 12;
/** company by company (north first): each twin flies in as one formation, the same shape as the company it passes
 *  over, and lands at DRN_FIRST + g * DRN_STEP, so each twin completes before the next one lands */
const DRN_FIRST = 141;
const DRN_STEP = 6.8;
/** in the advance the drones leave this many frames before their company */
const DRN_LEAD = 3;
/** a drone flies in high over its company (LIFT world px up) and settles into its line over the last SETTLE px */
const LIFT = 30;
const SETTLE = 140;
const smooth01 = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
const drnArrive = (idx: number) => DRN_FIRST + UNITS[idx].c * DRN_STEP;
const arriveAt = (order: number[], u: number, first: number, last: number) => first + ((last - first) * order.indexOf(u)) / (NU - 1);
/** distance still to go at frame S for a mover that arrives at `t` (constant speed v, then a steady braking over b frames) */
const toGo = (S: number, t: number, v: number, b: number) => {
  const tb = t - b;
  if (S >= t) return 0;
  if (S <= tb) return (v * b) / 2 + v * (tb - S);
  const r = t - S;
  return (v * r * r) / (2 * b);
};

// --- the advance: every row rolls east across the front -------------------------------------------
/** each vehicle ends with its tail this far past the front over its own height; a company moves as one, so it
 *  travels as far as its furthest-behind vehicle needs */
const PAST = 24;
const IFV_HALF_H = 30;
/** ... and no company stops with its tail west of MIN_END, so the whole force ends in one frame (the southern
 *  companies, whose front lies furthest west, roll a little deeper) */
const MIN_END = 760;
const ADV_D = COMPANIES.map((_co, c) => {
  const us = UNITS.filter((u) => u.c === c);
  const cross = Math.max(...us.map((u) => frontX(u.y - IFV_HALF_H, u.y + IFV_HALF_H, "max") + PAST - (armX(u) - IFV_HALF_L)));
  return Math.max(cross, MIN_END - Math.min(...us.map((u) => armX(u) - IFV_HALF_L)));
});
const ADV0 = 206;
const ADV1 = 279;
/** pairs nearest the front leave first, a frame apart */
const ADV_STAGGER = 1.5;
const advOrder = [...COMPANIES.keys()].sort((a, b) => COMPANIES[b].twinX - COMPANIES[a].twinX);
const CREEP = 0.8;
const advance = (c: number, S: number, lead = 0) => {
  const t0 = ADV0 + advOrder.indexOf(c) * ADV_STAGGER - lead;
  const T = ADV1 - ADV0 - (COMPANIES.length - 1) * ADV_STAGGER;
  const D = ADV_D[c];
  const t = S - t0;
  if (t <= 0) return 0;
  if (t >= T) return D + CREEP * (t - T);
  const u = t / T;
  const h01 = -2 * u * u * u + 3 * u * u;
  const h11 = u * u * u - u * u;
  return D * h01 + CREEP * T * h11;
};

// --- the drones hover ------------------------------------------------------------------------------
const BOB_A = 2.5;
const BOB_P = 44;

// --- the side labels: clear of the force and of the caption bands on every camera state ---------------
const UKRAINE_AT: Pt = { x: -100, y: 1640 };
const RUSSIAN_AT: Pt = { x: 1444, y: 1555 };

// --- the camera: the force at rest fills the frame above the caption bands (Lyman's label below them) ----------
const CAM_Y = 888;
const CAM_KEYS: VCamKey[] = [
  { f: -24, x: 185, y: CAM_Y + 6, k: 0.88 },
  { f: 94, x: 200, y: CAM_Y, k: 0.915 },
  { f: 198, x: 206, y: CAM_Y, k: 0.92, ease: "linear" },
  { f: 278, x: 1262, y: CAM_Y, k: 0.9 },
  { f: DURATION, x: 1270, y: CAM_Y, k: 0.901, ease: "linear" },
];
export const camAt = runVCamera(CAM_KEYS, DURATION);

const EqualDronesAndArmor: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const west = cam.x - 540 / k - 140;
  const armour: React.ReactNode[] = [];
  const drones: React.ReactNode[] = [];
  UNITS.forEach((u, idx) => {
    const adv = advance(u.c, S);
    // armour
    const ta = arriveAt(ARM_ORDER, idx, ARM_FIRST, ARM_LAST);
    const axw = armX(u) - toGo(S, ta, ARM_V, ARM_BRAKE);
    if (axw + adv > west) armour.push(<Pictogram key={idx} d={IFV_D} x={axw + adv} y={u.y} size={IFV_SIZE} rung={INK_HI} />);
    // its drone, in the twin cluster
    const td = drnArrive(idx);
    const dGo = toGo(S, td, DRN_V, DRN_BRAKE);
    const dxw = drnX(u) - dGo;
    const dy = -LIFT * smooth01(dGo / SETTLE);
    const dadv = advance(u.c, S, DRN_LEAD);
    if (dxw + dadv > west) {
      const hov = S > td ? BOB_A * clamp01((S - td) / 12) * Math.sin((2 * Math.PI * (S - td)) / BOB_P + idx * 1.7) : 0;
      drones.push(<Pictogram key={idx} d={DRONE_D} x={dxw + dadv} y={u.y + dy + hov} size={DRONE_SIZE} color={RED} rung={1} />);
    }
  });
  return (
    <VStage S={S} cam={cam}>
      <LymanMap id="eda-map" k={k} held={HELD_20261103} fronts={[MAINFRONT_20261103]} places={["Lyman"]}>
        <RetakenPatch id="eda-patch" k={k} />
      </LymanMap>
      <SideLabel which="ukraine" k={k} at={UKRAINE_AT} />
      <SideLabel which="russian" k={k} at={RUSSIAN_AT} />
      {armour}
      <RedGroup k={k}>{drones}</RedGroup>
    </VStage>
  );
};

export default EqualDronesAndArmor;
