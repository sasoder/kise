// ---------------------------------------------------------------------------
// HugePeriodOfTrialAndError (kyle-vaccine, cut 18). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 249 frames.
// One country lane inside the misty teal air (AirStage, palette A, mood day) seen through one pinhole camera dollying
// down it; the kit's air-lit volumes (AirFloor, AirBox, AirShadow) drawn on this cut's own Persp (hugePeriodPlan.ts:
// the road, the stations, the camera); the people are the clip's cast vaccineFolk (import, never edit).
//
// CHECK LINE: "For a very long time people tried one odd remedy after another and none of them worked; the best they
// found was scratching real smallpox into a child — risky — while the vaccine was still out of reach."
//
// THE LINE: "[And it] took this huge period of like all kinds of weird trial and error, like inoculation with the
// actual smallpox, which is very, very dangerous, not vaccination."
// WORD -> FRAME: took 5 · this 9 · huge 13 · period 27 · of 38 · like 48 · all 53 · kinds 62 · of 68 · weird 72 ·
// trial 78 · and 88 · error 94 · like 105 · inoculation 113 · with 130 · the 144 · actual 147 · smallpox 155 · which 180
// · is 184 · very 187 · very 202 · dangerous 204 · not 219 · vaccination 222 · (Vaccination 235) · end 249.
// DURATION: the slot 18.986 -> 27.294 s = 8.308 s x 29.97 = 249 frames (f0..f248).
//
// THE MOTION: one continuous dolly down a long straight lane of cottages and low stone walls running into the haze
// (the length says "a long time"). Along it, small stations where people try a remedy on a sick child (pox): (a) the
// RED TREATMENT, a girl sitting up in a bed hung and blanketed in red cloth, her mother behind it; (b) a man waving a
// SMOKING bundle of herbs over a boy on a stool; (c) a mother holding the CHARM she has hung round her girl's neck.
// Each try fails as we approach: the child stays sick and the whole tableau drains toward DEAD and dissolves into the air before we
// reach it (one smooth ramp by the camera's distance: a f33-55, b f64-80 on "trial", c f84-100 on "error"). The dolly is already
// moving at f0 (a slow walk on the first station), gathers to a steady glide past the tries, then ONE deceleration
// lobe (f100-172, with the truck and lens shift in one lobe f96-182) into the inoculation station: the Inoculator
// (vaccineFolk v0, the older woman of cut 34) scratches a boy's bared arm with her lancet, its tip carrying a plum POX
// speck (reach f114-152, the scratch f156-174 on "smallpox", withdraw f182-208); on "very, very dangerous" a few plum
// pox dots come out on him (pox 0 -> 0.4, f184-212). On "not vaccination" a DASHED ORANGE vial is drawn by a moving tip
// far down the lane in the haze (f212-236; the tip starts at its foot), never filled, never reached; no halo (AirStage's bloom only). f236-248: the settled living frame (creep,
// breathing, motes, the vial's faint glimmer).
// CAUSE BEFORE EFFECT: the blade tip lands on the child's arm spot (vaccineAnchors armSpotL as lancetTo) at f152 and
// stays on the skin through the scratch (f156-174); the plum mark in the scratch appears from f160 (the tip has passed
// over it); the flinch starts on the scratch (f156); the pox comes after (f184).
// Orange = THE VACCINE only (the clip's ORANGE RULE): the dashed vial. Smallpox = plum POX (the lancet's speck, the mark,
// the dots). The red treatment's cloth is a muted brick red-brown, never orange. People and sets in muted local colours.
//
// DEPTH: a pinhole on the road: eye 230 units up, focal 1350 px; fog by the eye's distance (AIR_SCENE_EYE). The lane
// (half width 330, verges to the walls at 700, two-storey cottages from 730) runs ~13500 units into the haze.
// THE TRIES (revision 2): on or beside the lane, alternating sides, staggered in depth (a: bed X -384..-160 at world
// depth 1330; b: stool X 182, the man X 298 at 1950; c: girl X -176, mother X -288 at 2450), read in colour at ~300-450
// px (adults) as we approach; each FAILS IN PLACE by one smooth ramp of the camera's distance (hugePeriodPlan DRAIN_D
// 1050 -> 650 units: the colour to DEAD, the air takes it, the last of it dissolves; pox fades with it), gone before
// the camera reaches it: a f33-55, b f64-80 ("trial"), c f84-100 ("error"); the lane is then clear for the station.
// THE LANDING: the camera travels 0 -> ~2825; the truck (to X 212), a small horizontal shift and the horizon (screen
// y 960 -> 750) move in the deceleration's one lobe, landing ~560 from the station (the Inoculator ~700 px tall, the
// scratch at y ~950, faces above y 1040). The near hand carries the lancet; the far (leading) hand takes the boy's
// wrist from below (the cast's near arm is the short one); the scratch on the bare upper arm below the sleeve. The
// vial stands on the lane at X 200, world depth 9950, ~130 px tall between the two heads at the landing.
//
// SOURCES: the period's remedies (none on screen as text): the "red treatment" (red cloth, red hangings and red light
// for smallpox, from John of Gaddesden's Rosa Anglica, c.1314, to the 18th c.), fumigation with burning herbs, and
// amulets/charms worn against the pox; variolation (inoculating matter from a smallpox pustule through a scratch in the
// skin; England from 1721) carried a real risk of death (about 1-2 % against ~20-30 % for natural smallpox). No figures
// on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  AIR_SCENE_EYE,
  AirBox,
  AirFloor,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  DEAD,
  FIG_FOG,
  MAT,
  PandemicFolk,
  WorldSvg,
  c01,
  fogHex,
  makeAirView,
  mixHex,
  rgbHex,
  swayCam,
  type AirWorld,
  type Cam,
  type Mat,
  type Persp,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { POSES, POX, POX_DEEP, VaccineFigure, breathe, mirrorPose, vaccineAnchors, type P2, type VPose, type VaccineKind } from "./vaccineFolk";
import * as PL from "./hugePeriodPlan";

export const FPS = PL.FPS;
export const DURATION = PL.DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { F, EYE } = PL;
const smooth = PL.smooth;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ---- materials (local colours before fog) --------------------------------------------------------
const FIELD: Mat = { lit: "#7F775A", mid: "#6A6449", dark: "#3E3A2B" };
const VERGE: Mat = { lit: "#918A69", mid: "#7A7455", dark: "#4A4635" };
const ROAD: Mat = { lit: "#A39274", mid: "#8B7B5E", dark: "#5C503E" };
const MID_STRIP: Mat = { lit: "#9A8E6E", mid: "#847A5C", dark: "#545038" };
const RUT: Mat = { lit: "#9A896C", mid: "#837359", dark: "#5A4D3D" };
const PLASTER: Mat = { lit: "#CDBD9D", mid: "#B3A384", dark: "#716552" };
const PLASTER2: Mat = { lit: "#C4B8A0", mid: "#A89D86", dark: "#6B6352" };
const THATCH = { lit: "#8C7E62", mid: "#73664D", dark: "#4A3F30" };
const SLATE = { lit: "#7A7E7A", mid: "#5E625F", dark: "#3A3D3B" };
const STONE_W: Mat = { lit: "#9A8D7B", mid: "#7B6F60", dark: "#4E463C" };
const TIMBER: Mat = MAT.timber;
const LINEN: Mat = { lit: "#E8DDC8", mid: "#CDBFA5", dark: "#8C806A" };
/** the red treatment's cloth: a muted brick red-brown (never orange; cooler POX plum is the disease) */
const RED: Mat = { lit: "#A65A48", mid: "#8C4636", dark: "#552A21" };
const ROAD_EDGE = PL.ROAD_HW;
const DOOR_C = "#4C3A2B";
const WIN_C = "#3A3029";
const HERB = "#76744F";
const SMOKE = "#E6DECF";
const POUCH = "#5E4834";

// ===================================================================================================================
// THE WORLD OF ONE FRAME: the road camera as a kit Persp + AirWorld (kit Z = world depth - camera depth - F, so the
// kit's Dc + Z is the eye's distance; screen px = world px, k = 1)
// ===================================================================================================================
type World = { A: AirWorld; c: PL.RoadCam; Zk: (zw: number) => number; dist: (zw: number) => number; frame: number };
const SWAY0: Cam = { k: 1, cx: 0, cy: 0 };
const worldAt = (frame: number): World => {
  const c = PL.camAt(frame);
  const sw = swayCam(SWAY0, frame);
  const cam: Cam = { k: 1, cx: c.X - c.shift + sw.cx, cy: -EYE - (c.h0 - 960) + sw.cy };
  const r = (Z: number) => F / (F + Math.max(Z, -0.92 * F));
  const p = (X: number, Y: number, Z: number): P2 => {
    const rr = r(Z);
    return [c.X + (X - c.X) * rr, -EYE + (Y + EYE) * rr];
  };
  const P: Persp = {
    cam,
    opts: { eyeY: -EYE, dRef: F, kRef: 1, dolly: 0 },
    Dc: F,
    r,
    p,
    at: (X: number, Z: number) => ({ at: p(X, 0, Z), scale: r(Z) }),
    vp: [c.X, -EYE],
    horizonY: -EYE,
    zNear: -0.85 * F,
  };
  const toSY = (wy: number) => 960 + (wy - cam.cy);
  const v = makeAirView({ scene: { ...AIR_SCENE_EYE, F }, frame, horizon: toSY(-EYE), cam: { x: c.X, y: EYE, z: c.Z }, rest: { x: 0, y: EYE, z: 0 } });
  const dist = (Z: number) => F + Z;
  const fog = (Z: number) => c01(v.fogAt(dist(Z)));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(dist(Z), h));
  const tone = (hex: string, Z: number, h = 0) => fogHex(v, hex, dist(Z), h);
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.5 * fog(Z));
  const figFog = (Z: number) => FIG_FOG.max * (1 - Math.exp(-Math.max(0, Z - FIG_FOG.near) / FIG_FOG.vis));
  const A: AirWorld = {
    v,
    P,
    cam,
    Dc: F,
    k: 1,
    fog,
    airHex,
    tone,
    toneO,
    screenAir: (wy: number) => rgbHex(v.airAtScreen(toSY(wy))),
    figFog,
    folkFog: (Z: number, feetH = 0) => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) }),
    workerInks: (Z: number, feetH = 0) => {
      const air = airHex(Z, feetH + 160);
      const t = figFog(Z);
      return Object.fromEntries(Object.entries(PandemicFolk.WORKER_INKS).map(([key, col]) => [key, key === "orange" ? col : mixHex(col, air, t)])) as typeof PandemicFolk.WORKER_INKS;
    },
    lw: (b = 1.1) => b,
  };
  return { A, c, Zk: (zw: number) => zw - c.Z - F, dist: (zw: number) => zw - c.Z, frame };
};

/** a try failing (u = its one drain ramp, hugePeriodPlan drainStages): the colour toward DEAD, then the air takes it */
const drainHex = (w: World, hex: string, zw: number, u: number, h = 0) => {
  const st = PL.drainStages(u);
  const Z = w.Zk(zw);
  const local = mixHex(hex, DEAD, 0.8 * st.dead);
  return mixHex(w.A.tone(local, Z, h), w.A.airHex(Z, h), 0.92 * st.sink);
};
/** a set material failing the same way (the AirBox fogs it by distance on top) */
const drainMat = (w: World, m: Mat, zw: number, u: number, h = 120): Mat => {
  if (u <= 0.001) return m;
  const st = PL.drainStages(u);
  const air = w.A.airHex(w.Zk(zw), h);
  const f = (c: string, dead: string) => mixHex(mixHex(c, dead, 0.8 * st.dead), air, 0.92 * st.sink);
  return { lit: f(m.lit, DEAD), mid: f(m.mid, DEAD), dark: f(m.dark, mixHex(DEAD, "#3A3128", 0.5)) };
};
/** a figure's fog: its own by distance, sinking into the air as it fails */
const figFogOf = (w: World, zw: number, u: number, feetH = 0) => {
  const f0 = w.A.folkFog(w.Zk(zw), feetH);
  return { rgb: f0.rgb, amount: 1 - (1 - f0.amount) * (1 - 0.92 * PL.drainStages(u).sink) };
};

type Item = { key: number; el: React.ReactNode };

// ===================================================================================================================
// THE LANE: fields, verges, the lane with its ruts and the grass strip between them, the low walls, the cottages
// ===================================================================================================================
const Ground: React.FC<{ w: World }> = ({ w }) => {
  const { A } = w;
  const z0 = A.P.zNear;
  const z1 = w.Zk(PL.ROAD_END);
  return (
    <g>
      <AirFloor A={A} x0={-4200} x1={4200} z0={z0} z1={z1} mat={FIELD} jointAmt={0} melt={0.4} />
      <AirFloor A={A} x0={-PL.WALL_X} x1={PL.WALL_X} z0={z0} z1={z1} mat={VERGE} jointAmt={0} melt={0.4} />
      <AirFloor A={A} x0={-PL.ROAD_HW} x1={PL.ROAD_HW} z0={z0} z1={z1} mat={ROAD} jointAmt={0} melt={0.4} />
      {[-1, 1].map((s) => (
        <AirFloor key={s} A={A} x0={s < 0 ? -142 : 108} x1={s < 0 ? -108 : 142} z0={z0} z1={z1} mat={RUT} jointAmt={0} melt={0.4} />
      ))}
      <AirFloor A={A} x0={-46} x1={46} z0={z0} z1={z1} mat={MID_STRIP} jointAmt={0} melt={0.4} />
      <AirHorizonHazeW A={A} id="hp-haze" below={170} />
    </g>
  );
};

/** the low dry-stone walls between the cottages, in pieces (each fogs by its own depth), with a few field gates */
type Seg = { side: -1 | 1; z0: number; z1: number };
const WALL_SEGS: Seg[] = (() => {
  const out: Seg[] = [];
  const gates: Record<number, number[]> = { [-1]: [2500, 4300], [1]: [1080, 3100, 5000] };
  for (const side of [-1, 1] as const) {
    const hs = PL.HOUSES.filter((h) => h.side === side).sort((a, b) => a.z0 - b.z0);
    let z = -600;
    const spans: [number, number][] = [];
    for (const h of hs) {
      if (h.z0 > z) spans.push([z, h.z0]);
      z = Math.max(z, h.z1);
    }
    spans.push([z, PL.ROAD_END - 1800]);
    for (const [a, b] of spans) {
      let q = a;
      while (q < b - 10) {
        const e = Math.min(b, q + 300);
        const g = gates[side].find((gz) => gz > q && gz < e);
        if (g !== undefined) {
          if (g - 40 > q + 10) out.push({ side, z0: q, z1: g - 40 });
          q = g + 40;
          continue;
        }
        out.push({ side, z0: q, z1: e });
        q = e;
      }
    }
  }
  return out;
})();

const wallItems = (w: World): Item[] => {
  const zMin = w.c.Z + 170;
  return WALL_SEGS.filter((s) => s.z1 > zMin)
    .map((s, i) => {
      const z0 = Math.max(s.z0, zMin);
      const X0 = s.side < 0 ? -PL.WALL_X - PL.WALL_T : PL.WALL_X;
      const X1 = X0 + PL.WALL_T;
      return {
        key: s.z1,
        el: <AirBox key={`w${i}`} A={w.A} X0={X0} X1={X1} Y0={-PL.WALL_H} Y1={0} Z0={w.Zk(z0)} Z1={w.Zk(s.z1)} mat={STONE_W} uid={`hw${s.side}_${s.z0}`} rim={0.7} />,
      };
    });
};

/** a cottage: plaster walls (AirBox), the road-side roof slope, a chimney, the gable end with its thatch rake, a door
 *  and two windows on the road side */
const House: React.FC<{ w: World; h: PL.House }> = ({ w, h }) => {
  const { A } = w;
  const P = A.P;
  const zMin = w.c.Z + 170;
  const z0 = Math.max(h.z0, zMin);
  const Z0 = w.Zk(z0);
  const Z1 = w.Zk(h.z1);
  const Zm = (Z0 + Z1) / 2;
  const s = h.side;
  const Xr = s * PL.HOUSE_X; // the road-side wall
  const Xo = s * (PL.HOUSE_X + PL.HOUSE_D);
  const X0 = Math.min(Xr, Xo);
  const X1 = Math.max(Xr, Xo);
  const Xm = (X0 + X1) / 2;
  const mat = h.seed % 3 === 1 ? PLASTER2 : PLASTER;
  const roof = h.seed % 4 === 2 ? SLATE : THATCH;
  const t = (hex: string, Z = Zm, hh = 200) => A.tone(hex, Z, hh);
  const p = P.p;
  const els: React.ReactNode[] = [];
  els.push(<AirBox key="b" A={A} X0={X0} X1={X1} Y0={-PL.EAVE_H} Y1={0} Z0={Z0} Z1={Z1} mat={mat} uid={`hh${h.seed}`} rim={0.6} />);
  // the door and windows on the road side (a plane at X = Xr)
  const zr = (u: number) => w.Zk(h.z0 + u * (h.z1 - h.z0));
  const quad = (za: number, zb: number, ya: number, yb: number): P2[] => [p(Xr, ya, za), p(Xr, ya, zb), p(Xr, yb, zb), p(Xr, yb, za)];
  const doorU = h.door;
  const dw = 46 / (h.z1 - h.z0);
  const openings: [number, number, number, number, string][] = [[doorU - dw, doorU + dw, -196, 0, DOOR_C]];
  for (const u of [doorU - 0.3, doorU + 0.28]) if (u - dw > 0.06 && u + dw < 0.94) openings.push([u - dw * 0.8, u + dw * 0.8, -232, -150, WIN_C]);
  for (const u of [doorU - 0.24, doorU + 0.22]) if (u - dw > 0.06 && u + dw < 0.94) openings.push([u - dw * 0.75, u + dw * 0.75, -380, -306, WIN_C]);
  openings.forEach(([ua, ub, ya, yb, col], i) => {
    const za = zr(ua);
    const zb = zr(ub);
    if (za < P.zNear + 40) return;
    els.push(<path key={`o${i}`} d={poly(quad(za, zb, ya, yb))} fill={t(col, (za + zb) / 2, 150)} stroke={t(mixHex(TIMBER.mid, mat.dark, 0.3), (za + zb) / 2, 150)} strokeWidth={Math.max(0.8, 5 * P.r((za + zb) / 2))} strokeLinejoin="round" />);
  });
  // the road-side roof slope (seen from below the eaves only by its far edge: it faces up and toward the road)
  const eX = Xr - s * 32; // the eave overhangs toward the road
  const slope: P2[] = [p(eX, -PL.EAVE_H + 10, Z0 - 30), p(eX, -PL.EAVE_H + 10, Z1 + 30), p(Xm, -PL.RIDGE_H, Z1 + 30), p(Xm, -PL.RIDGE_H, Z0 - 30)];
  els.push(<path key="rs" d={poly(slope)} fill={t(s < 0 ? roof.mid : roof.lit, Zm, 380)} stroke={t(roof.dark, Zm, 380)} strokeWidth={1} strokeLinejoin="round" />);
  // a chimney at the far end of the ridge
  if (h.seed % 2 === 0) els.push(<AirBox key="ch" A={A} X0={Xm - 26} X1={Xm + 26} Y0={-PL.RIDGE_H - 80} Y1={-PL.RIDGE_H + 40} Z0={Z1 - 110} Z1={Z1 - 60} mat={STONE_W} uid={`hc${h.seed}`} rim={0.5} />);
  // the gable end facing us, and its thatch / slate rake
  if (z0 <= h.z0 + 1) {
    const g: P2[] = [p(X0, -PL.EAVE_H, Z0), p(X1, -PL.EAVE_H, Z0), p(Xm, -PL.RIDGE_H, Z0)];
    els.push(<path key="g" d={poly(g)} fill={t(mat.mid, Z0, 380)} stroke={t(mixHex(mat.dark, "#2B241D", 0.35), Z0, 380)} strokeWidth={1.1} strokeLinejoin="round" />);
    const Zr = Z0 - 26;
    const rk = [p(X0 - 30, -PL.EAVE_H + 14, Zr), p(Xm, -PL.RIDGE_H - 26, Zr), p(X1 + 30, -PL.EAVE_H + 14, Zr)];
    els.push(<path key="rk" d={`M${rk.map(Pt).join("L")}`} fill="none" stroke={t(roof.mid, Zr, 400)} strokeWidth={30 * P.r(Zr)} strokeLinejoin="round" strokeLinecap="round" />);
    els.push(<path key="rk2" d={`M${rk.map(Pt).join("L")}`} fill="none" stroke="#F3EBDD" strokeOpacity={0.35 * (1 - A.fog(Zr))} strokeWidth={Math.max(0.8, 4 * P.r(Zr))} strokeLinejoin="round" strokeLinecap="round" transform={`translate(0 ${(-11 * P.r(Zr)).toFixed(2)})`} />);
  }
  return <g>{els}</g>;
};
const houseItems = (w: World): Item[] => PL.HOUSES.filter((h) => h.z1 > w.c.Z + 170).map((h) => ({ key: h.z1, el: <House key={`h${h.seed}`} w={w} h={h} /> }));

/** a round picture-book tree: a tapering trunk and a crown of a few overlapping discs (dark under, lit upper left) */
const CROWN = { lit: "#748465", mid: "#5B6A51", dark: "#3A4535" };
const TRUNK = "#5A4634";
const Tree: React.FC<{ w: World; t: PL.Tree }> = ({ w, t }) => {
  const { A } = w;
  const Z = w.Zk(t.z);
  const r = A.P.r(Z);
  const c = A.P.p(t.X, -t.h, Z);
  const base = A.P.p(t.X, 0, Z);
  const R = t.R * r;
  const tn = (hex: string, hh: number) => A.tone(hex, Z, hh);
  const lobes: [number, number, number][] = [
    [-0.42, 0.12, 0.66],
    [0.4, 0.16, 0.64],
    [0.02, -0.3, 0.72],
    [0, 0.08, 0.8],
  ];
  const tw = 0.11 * R;
  return (
    <g>
      <path d={`M${Pt([base[0] - tw, base[1]])}L${Pt([c[0] - tw * 0.55, c[1] + 0.3 * R])}L${Pt([c[0] + tw * 0.55, c[1] + 0.3 * R])}L${Pt([base[0] + tw, base[1]])}Z`} fill={tn(TRUNK, 150)} />
      {lobes.map(([dx, dy, rr], i) => (
        <circle key={`d${i}`} cx={c[0] + dx * R} cy={c[1] + dy * R} r={rr * R} fill={tn(CROWN.dark, t.h)} />
      ))}
      {lobes.map(([dx, dy, rr], i) => (
        <circle key={`m${i}`} cx={c[0] + dx * R - 0.07 * R} cy={c[1] + dy * R - 0.07 * R} r={rr * R * 0.9} fill={tn(CROWN.mid, t.h)} />
      ))}
      {lobes.map(([dx, dy, rr], i) => (
        <circle key={`l${i}`} cx={c[0] + dx * R - 0.18 * R} cy={c[1] + dy * R - 0.2 * R} r={rr * R * 0.52} fill={tn(CROWN.lit, t.h + 100)} opacity={0.75} />
      ))}
    </g>
  );
};
const treeItems = (w: World): Item[] => PL.TREES.filter((t) => w.dist(t.z) > 200).map((t) => ({ key: t.z + 1, el: <Tree key={`t${t.seed}`} w={w} t={t} /> }));

/** grass tufts along the verges and the lane's edges (they stream past the lower corners on the dolly) */
const TUFTS: { X: number; z: number; s: number; seed: number }[] = (() => {
  const out: { X: number; z: number; s: number; seed: number }[] = [];
  let i = 0;
  for (let z = -100; z < 5200; z += 70 + 90 * ((i * 0.618) % 1)) {
    i++;
    const side = i % 2 ? -1 : 1;
    const u = (i * 0.381) % 1;
    out.push({ X: side * (ROAD_EDGE + 10 + u * (PL.WALL_X - ROAD_EDGE - 40)), z, s: 0.8 + 0.6 * ((i * 0.739) % 1), seed: i });
  }
  return out;
})();
const tuftItems = (w: World): Item[] => {
  const out: Item[] = [];
  for (const t of TUFTS) {
    const d = w.dist(t.z);
    if (d < 120 || d > 3200) continue;
    const Z = w.Zk(t.z);
    const { at, scale } = w.A.P.at(t.X, Z);
    const sx = at[0] - w.A.cam.cx + 540;
    if (sx < -200 || sx > 1280) continue;
    const s = scale * t.s;
    const blades = [-3, -1.6, -0.4, 0.8, 2.2, 3.2].map((k, j) => {
      const hgt = (26 + 14 * Math.sin(t.seed * 3.1 + j * 1.9)) * s;
      const lean = (k * 2.4 + 5 * Math.sin(t.seed + j)) * s;
      const b = 3.2 * s;
      return `M${Pt([at[0] + k * 3 * s - b, at[1]])}Q${Pt([at[0] + k * 3 * s + lean * 0.3, at[1] - hgt * 0.6])} ${Pt([at[0] + k * 3 * s + lean, at[1] - hgt])}Q${Pt([at[0] + k * 3 * s + lean * 0.3 + b, at[1] - hgt * 0.5])} ${Pt([at[0] + k * 3 * s + b, at[1]])}Z`;
    });
    out.push({
      key: t.z,
      el: (
        <g key={`tf${t.seed}`}>
          <path d={blades.filter((_, j) => j % 2 === 0).join("")} fill={w.A.tone("#5E6046", Z, 20)} />
          <path d={blades.filter((_, j) => j % 2 === 1).join("")} fill={w.A.tone("#7D7A58", Z, 20)} />
        </g>
      ),
    });
  }
  return out;
};

// ===================================================================================================================
// THE CAST ON THE ROAD
// ===================================================================================================================
type FigSpec = { kind: VaccineKind; variant: number; pose: VPose; X: number; zw: number; uid: string; drain?: number; pox?: number; inks?: Record<string, string>; grip?: { L?: P2; R?: P2 }; lancetTo?: P2; charge?: { kind: "pox" | "vaccine"; amt: number }; hold?: { L?: "lancet" | "none"; R?: "lancet" | "none" }; feetH?: number; shadow?: number };
const placeOf = (w: World, X: number, zw: number, feetH = 0) => {
  const Z = w.Zk(zw);
  const { at, scale } = w.A.P.at(X, Z);
  return { at: [at[0], at[1] - feetH * scale] as P2, scale, Z };
};
const Fig: React.FC<{ w: World; s: FigSpec }> = ({ w, s }) => {
  const { at, scale, Z } = placeOf(w, s.X, s.zw, s.feetH ?? 0);
  const drain = s.drain ?? 0;
  return (
    <g>
      {s.shadow !== 0 ? <AirShadow A={w.A} X={s.X} Z={Z} w={s.kind === "child" ? 46 : 60} d={28} uid={`${s.uid}s`} amt={(s.shadow ?? 0.8) * (1 - PL.drainStages(drain).sink)} Y={-(s.feetH ?? 0)} /> : null}
      <VaccineFigure
        kind={s.kind}
        variant={s.variant}
        pose={s.pose}
        at={at}
        scale={scale}
        uid={s.uid}
        frame={w.frame}
        fog={figFogOf(w, s.zw, drain, s.feetH ?? 0)}
        unitPx={1}
        drain={0.9 * PL.drainStages(drain).dead}
        pox={s.pox === undefined ? undefined : s.pox * (1 - 0.85 * PL.drainStages(drain).dead)}
        inks={s.inks}
        grip={s.grip}
        lancetTo={s.lancetTo}
        charge={s.charge}
        hold={s.hold}
      />
    </g>
  );
};
const anchorsOf = (w: World, s: FigSpec) => {
  const { at, scale } = placeOf(w, s.X, s.zw, s.feetH ?? 0);
  return vaccineAnchors(s.kind, s.pose, at, scale, { variant: s.variant, grip: s.grip, hold: s.hold, reachTo: s.lancetTo });
};
/** on screen and in front of the near clip */
const visible = (w: World, X: number, zw: number, halfW = 260) => {
  const d = w.dist(zw);
  if (d < 175) return false;
  const sx = 540 + w.c.shift + (X - w.c.X) * (F / d);
  return sx > -halfW * (F / d) - 40 && sx < 1080 + halfW * (F / d) + 40;
};

// ---- (a) THE RED TREATMENT ---------------------------------------------------------------------------------------
/** the bed stands across the left lane edge, its open long side to us: the girl sits up at its head, wrapped in red
 *  under red hangings and a red blanket, her mother behind the bed */
const BED = { X0: -384, X1: -160, z0: PL.ZA - 72, z1: PL.ZA + 72, top: 74, post: 330 };
const GIRL_A_X = BED.X0 + 62;
const RED_INKS = { top: "#94503F", top2: "#7E4134", sleeve: "#94503F", hat: "#A35E4B", hat2: "#8A4A3B", apron: "#A35E4B", shawl: "#94503F" };
const stationA = (w: World): Item[] => {
  const dr = PL.drainAt(w.c, PL.ZA);
  if (dr >= 0.999 || !visible(w, -270, PL.ZA, 260)) return [];
  const { A } = w;
  const P = A.P;
  const zk = w.Zk;
  const B = BED;
  const Zc = (B.z0 + B.z1) / 2;
  const red = drainMat(w, RED, PL.ZA, dr);
  const tim = drainMat(w, TIMBER, PL.ZA, dr);
  const lin = drainMat(w, LINEN, PL.ZA, dr);
  const els: React.ReactNode[] = [];
  const box = (key: string, X0: number, X1: number, Y0: number, Y1: number, z0: number, z1: number, m: Mat, rim = 0.8) =>
    els.push(<AirBox key={key} A={A} X0={X0} X1={X1} Y0={Y0} Y1={Y1} Z0={zk(z0)} Z1={zk(z1)} mat={m} uid={`ha${key}`} rim={rim * (1 - dr)} />);
  const plane = (key: string, q: P2[], hex: string, zw: number, h: number) =>
    els.push(<path key={key} d={poly(q)} fill={drainHex(w, hex, zw, dr, h)} stroke={drainHex(w, mixHex(hex, "#2B241D", 0.35), zw, dr, h)} strokeWidth={1} strokeLinejoin="round" />);
  // the mother behind the bed (far side), turned to her girl
  const mother: FigSpec = { kind: "parent", variant: 0, pose: breathe({ ...POSES.turnTo(-0.5), headYaw: -0.62, worry: 0.6, look: [-0.5, 0.25] }, w.frame, 1, 0.4), X: -250, zw: B.z1 + 48, uid: "aMo", drain: dr };
  els.push(<AirShadow key="sh" A={A} X={(B.X0 + B.X1) / 2} Z={zk(Zc)} w={150} d={90} uid="haS" amt={0.75 * (1 - PL.drainStages(dr).sink)} />);
  box("pf0", B.X0, B.X0 + 12, -B.post, 0, B.z1 - 12, B.z1, tim);
  box("pf1", B.X1 - 12, B.X1, -B.post, 0, B.z1 - 12, B.z1, tim);
  els.push(<Fig key="mo" w={w} s={mother} />);
  // the red curtain at the bed's head
  plane("cb", [P.p(B.X0, -B.post + 14, zk(B.z0)), P.p(B.X0, -B.post + 14, zk(B.z1)), P.p(B.X0, -B.top + 4, zk(B.z1)), P.p(B.X0, -B.top + 4, zk(B.z0))], RED.mid, Zc, 180);
  // the girl sitting up in bed, wrapped in red
  const girl: FigSpec = { kind: "child", variant: 1, pose: POSES.slump(1, w.frame + 20, B.top), X: GIRL_A_X, zw: Zc + 4, uid: "aGi", drain: dr, pox: 0.72, inks: RED_INKS };
  els.push(<Fig key="gi" w={w} s={{ ...girl, shadow: 0 }} />);
  // the bed: base and valance to the floor (red), the mattress, the red blanket over her legs
  box("bs", B.X0, B.X1, -B.top + 22, 0, B.z0, B.z1, red, 0.4);
  box("mt", B.X0 + 6, B.X1 - 4, -B.top, -B.top + 22, B.z0 + 4, B.z1 - 4, lin, 0.7);
  box("bl", B.X0 + 74, B.X1 - 2, -B.top - 30, -B.top + 2, B.z0 + 6, B.z1 - 6, red, 0.9);
  // the near posts with the curtains gathered to them, the canopy and its red valance
  box("pn0", B.X0, B.X0 + 12, -B.post, 0, B.z0, B.z0 + 12, tim);
  box("pn1", B.X1 - 12, B.X1, -B.post, 0, B.z0, B.z0 + 12, tim);
  box("cg0", B.X0 + 10, B.X0 + 34, -B.post + 20, -B.top - 10, B.z0 - 6, B.z0 + 18, red, 0.6);
  box("cg1", B.X1 - 34, B.X1 - 10, -B.post + 20, -B.top - 10, B.z0 - 6, B.z0 + 18, red, 0.6);
  box("cn", B.X0, B.X1, -B.post - 14, -B.post, B.z0, B.z1, tim, 0.6);
  plane("vn", [P.p(B.X0, -B.post, zk(B.z0 - 2)), P.p(B.X1, -B.post, zk(B.z0 - 2)), P.p(B.X1, -B.post + 40, zk(B.z0 - 2)), P.p(B.X0, -B.post + 40, zk(B.z0 - 2))], RED.lit, B.z0, 270);
  plane("vr", [P.p(B.X1 + 2, -B.post, zk(B.z0)), P.p(B.X1 + 2, -B.post, zk(B.z1)), P.p(B.X1 + 2, -B.post + 40, zk(B.z1)), P.p(B.X1 + 2, -B.post + 40, zk(B.z0))], RED.mid, Zc, 270);
  return [{ key: B.z1 + 60, el: <g key="stA" opacity={1 - PL.drainStages(dr).gone}>{els}</g> }];
};

// ---- (b) THE SMOKE CURE ------------------------------------------------------------------------------------------
const STOOL = { X: 182, z: PL.ZB + 10, h: 92, hw: 34 };
/** a bundle of herbs held upright in a fist, its top smouldering, the smoke curling up from it */
const Smoke: React.FC<{ w: World; hand: P2; scale: number; zw: number; drain: number; uid: string }> = ({ w, hand, scale, zw, drain, uid }) => {
  const Z = w.Zk(zw);
  const s = scale;
  const herb = drainHex(w, HERB, zw, drain, 240);
  const herbD = drainHex(w, mixHex(HERB, "#2B241D", 0.4), zw, drain, 240);
  const top: P2 = [hand[0] - 4 * s, hand[1] - 46 * s];
  // the sheaf: a tight bunch widening up from the fist, ragged leaf tips at the top, bound with a cord
  const sheaf: P2[] = [
    [hand[0] - 4 * s, hand[1] + 9 * s],
    [hand[0] - 7 * s, hand[1] - 18 * s],
    [top[0] - 12 * s, top[1] + 6 * s],
    [top[0] - 8 * s, top[1] - 2 * s],
    [top[0] - 4 * s, top[1] + 3 * s],
    [top[0] + 1 * s, top[1] - 4 * s],
    [top[0] + 5 * s, top[1] + 3 * s],
    [top[0] + 10 * s, top[1] - 1 * s],
    [top[0] + 11 * s, top[1] + 7 * s],
    [hand[0] + 6 * s, hand[1] - 18 * s],
    [hand[0] + 4 * s, hand[1] + 9 * s],
  ];
  const veins = [-5, 0, 5].map((dx) => `M${Pt([hand[0] + dx * 0.3 * s, hand[1] - 2 * s])}L${Pt([top[0] + dx * 1.2 * s, top[1] + 5 * s])}`).join("");
  const air = w.A.airHex(Z, 300);
  const puffs: React.ReactNode[] = [];
  const N = 9;
  const PER = 54;
  for (let i = 0; i < N; i++) {
    const a = (((w.frame + (i * PER) / N) % PER) + PER) % PER / PER;
    const rise = 190 * a * s;
    const dx = (16 * Math.sin(a * 5.2 + i * 1.7) * Math.min(1, a * 2.5) + 26 * a) * s;
    const rr = (7 + 30 * a) * s;
    const op = 0.75 * Math.sin(Math.PI * Math.min(1, a * 1.15)) * (1 - 0.75 * drain);
    if (op < 0.01) continue;
    puffs.push(<circle key={i} cx={top[0] + dx} cy={top[1] - rise} r={rr} fill={mixHex(SMOKE, air, 0.12 + 0.4 * drain)} opacity={op} filter={`url(#${uid}b)`} />);
  }
  return (
    <g>
      <defs>
        <filter id={`${uid}b`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={(3.2 * s).toFixed(2)} />
        </filter>
      </defs>
      {puffs}
      <path d={poly(sheaf)} fill={herb} />
      <path d={veins} fill="none" stroke={herbD} strokeWidth={1.4 * s} strokeLinecap="round" opacity={0.7} />
      <path d={`M${Pt([hand[0] - 7 * s, hand[1] - 9 * s])}L${Pt([hand[0] + 7 * s, hand[1] - 9 * s])}`} stroke={drainHex(w, "#C9B89A", zw, drain, 240)} strokeWidth={2.6 * s} strokeLinecap="round" />
      <ellipse cx={top[0] - 0.5 * s} cy={top[1] + 2 * s} rx={9 * s} ry={3.5 * s} fill={drainHex(w, "#4A3F33", zw, drain, 260)} opacity={0.85} />
    </g>
  );
};
const stationB = (w: World): Item[] => {
  const dr = PL.drainAt(w.c, PL.ZB);
  if (dr >= 0.999 || !visible(w, 240, PL.ZB, 260)) return [];
  const { A } = w;
  const zk = w.Zk;
  const els: React.ReactNode[] = [];
  const st = STOOL;
  const tim = drainMat(w, TIMBER, PL.ZB, dr);
  // the man (outer, nearer the cottages) turned to the boy, his near hand waving the smoking bundle over the boy's head
  const healPose = (() => {
    // built facing right with the FAR (leading) arm raised toward the boy, then mirrored to face left: the arm never
    // crosses his face; the bundle sways in small circles over the boy's head
    const ph = w.frame * 0.19;
    const q1: VPose = { ...POSES.stand(1), headYaw: 0.5, pitch: -6, armR: { w: [74 + 10 * Math.sin(ph), -296 + 7 * Math.cos(ph)], elbow: [0.6, 0.8], fist: 0.6, hand: 10 * Math.sin(ph) } };
    return { ...mirrorPose(breathe(q1, w.frame, 1, 0.9)), worry: 0.2, look: [-0.4, -0.5] as P2, open: 0.12 + 0.1 * Math.max(0, Math.sin(w.frame * 0.35)) };
  })();
  const healer: FigSpec = { kind: "parent", variant: 3, pose: healPose, X: 298, zw: PL.ZB, uid: "bHe", drain: dr };
  const boy: FigSpec = { kind: "child", variant: 4, pose: { ...POSES.slump(1, w.frame, st.h), headYaw: 0.5, pitch: 6, look: [0.3, -0.5] }, X: st.X, zw: st.z, uid: "bBo", drain: dr, pox: 0.7 };
  els.push(<AirShadow key="ss" A={A} X={st.X} Z={zk(st.z)} w={52} d={40} uid="hbS" amt={0.7 * (1 - PL.drainStages(dr).sink)} />);
  // stool legs and seat
  for (const [dx, dz] of [[-24, 22], [24, 22]] as const) els.push(<AirBox key={`l${dx}${dz}`} A={A} X0={st.X + dx - 5} X1={st.X + dx + 5} Y0={-st.h + 10} Y1={0} Z0={zk(st.z + dz - 5)} Z1={zk(st.z + dz + 5)} mat={tim} uid={`hbl${dx}${dz}`} rim={0.3} />);
  els.push(<AirBox key="seat" A={A} X0={st.X - st.hw} X1={st.X + st.hw} Y0={-st.h} Y1={-st.h + 10} Z0={zk(st.z - 30)} Z1={zk(st.z + 30)} mat={tim} uid="hbseat" rim={0.7 * (1 - dr)} />);
  els.push(<Fig key="bo" w={w} s={{ ...boy, shadow: 0 }} />);
  for (const [dx, dz] of [[-24, -22], [24, -22]] as const) els.push(<AirBox key={`l${dx}${dz}`} A={A} X0={st.X + dx - 5} X1={st.X + dx + 5} Y0={-st.h + 10} Y1={0} Z0={zk(st.z + dz - 5)} Z1={zk(st.z + dz + 5)} mat={tim} uid={`hbl${dx}${dz}`} rim={0.3} />);
  els.push(<Fig key="he" w={w} s={healer} />);
  const an = anchorsOf(w, healer);
  const { scale } = placeOf(w, healer.X, healer.zw);
  els.push(<Smoke key="sm" w={w} hand={an.mittenL} scale={scale} zw={PL.ZB} drain={dr} uid="hbsm" />);
  return [{ key: PL.ZB + 40, el: <g key="stB" opacity={1 - PL.drainStages(dr).gone}>{els}</g> }];
};

// ---- (c) THE CHARM -----------------------------------------------------------------------------------------------
const GIRL_C_X = -176;
const stationC = (w: World): Item[] => {
  const dr = PL.drainAt(w.c, PL.ZC);
  if (dr >= 0.999 || !visible(w, -230, PL.ZC, 260)) return [];
  const els: React.ReactNode[] = [];
  const girl: FigSpec = { kind: "child", variant: 3, pose: breathe({ ...POSES.turnTo(0.12), worry: 0.8, pitch: 4, look: [0.1, 0.35] }, w.frame, 1, 1.3), X: GIRL_C_X, zw: PL.ZC + 24, uid: "cGi", drain: dr, pox: 0.7 };
  const ga = anchorsOf(w, girl);
  const { scale: gs } = placeOf(w, girl.X, girl.zw);
  const pend: P2 = [ga.chest[0] - 2 * gs, ga.chest[1] + 10 * gs];
  // the mother holds the charm out a little on its cord: her near hand eases onto it as we come
  const hold = smooth((PL.ZC - w.c.Z - 1750) / -450);
  const mPose = breathe({ ...POSES.stand(1), worry: 0.5, pitch: 8, look: [0.4, 0.4] }, w.frame, 1, 2.1);
  const mother: FigSpec = { kind: "parent", variant: 0, pose: mPose, X: GIRL_C_X - 112, zw: PL.ZC, uid: "cMo", drain: dr };
  const mA = anchorsOf(w, mother);
  const grip = hold > 0.001 ? { L: [mA.handL[0] + (pend[0] - 6 * gs - mA.handL[0]) * hold, mA.handL[1] + (pend[1] + 4 * gs - mA.handL[1]) * hold] as P2 } : undefined;
  els.push(<Fig key="gi" w={w} s={girl} />);
  // the cord round her neck and the charm (a little tied pouch)
  const nk = ga.headC[1] + ga.headR * 1.05;
  const cordC = drainHex(w, "#3E3226", PL.ZC, dr, 180);
  els.push(<path key="cord" d={`M${Pt([ga.chest[0] - ga.headR * 0.42, nk])}Q${Pt([ga.chest[0] - ga.headR * 0.3, pend[1] - 4 * gs])} ${Pt(pend)}M${Pt([ga.chest[0] + ga.headR * 0.42, nk])}Q${Pt([ga.chest[0] + ga.headR * 0.3, pend[1] - 4 * gs])} ${Pt(pend)}`} fill="none" stroke={cordC} strokeWidth={1.6 * gs} strokeLinecap="round" />);
  const pc = drainHex(w, POUCH, PL.ZC, dr, 180);
  const pl = drainHex(w, mixHex(POUCH, "#E9DFC8", 0.3), PL.ZC, dr, 180);
  els.push(<path key="pouch" d={`M${Pt([pend[0] - 3 * gs, pend[1]])}C${Pt([pend[0] - 11 * gs, pend[1] + 6 * gs])} ${Pt([pend[0] - 10 * gs, pend[1] + 19 * gs])} ${Pt([pend[0], pend[1] + 20 * gs])}C${Pt([pend[0] + 10 * gs, pend[1] + 19 * gs])} ${Pt([pend[0] + 11 * gs, pend[1] + 6 * gs])} ${Pt([pend[0] + 3 * gs, pend[1]])}Z`} fill={pc} />);
  els.push(<path key="pl" d={`M${Pt([pend[0] - 6 * gs, pend[1] + 8 * gs])}Q${Pt([pend[0] - 5 * gs, pend[1] + 15 * gs])} ${Pt([pend[0] - 1 * gs, pend[1] + 17 * gs])}`} fill="none" stroke={pl} strokeWidth={1.6 * gs} strokeLinecap="round" opacity={0.7} />);
  els.push(<circle key="knot" cx={pend[0]} cy={pend[1] + 1 * gs} r={2.6 * gs} fill={drainHex(w, "#7A6448", PL.ZC, dr, 180)} />);
  els.push(<Fig key="mo" w={w} s={{ ...mother, grip }} />);
  return [{ key: PL.ZC + 30, el: <g key="stC" opacity={1 - PL.drainStages(dr).gone}>{els}</g> }];
};

// ---- THE INOCULATION STATION ---------------------------------------------------------------------------------------
/** the station: the Inoculator (v0) stands at inoX facing right; the boy (Child v6) at kidX, a little behind her. He
 *  holds his bared left arm out to her; her NEAR hand takes his wrist from below, her FAR hand brings the lancet to his
 *  upper arm (the scratch spot stays clear of her hands) */
export const ST = { inoX: 150, kidX: 282, kidDz: 26 };
const mix2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** the two figures' poses and props at frame f for given placements (pure: the cut and the pop check share it) */
export const stationRig = (f: number, kidAt: P2, kidScale: number, inoAt: P2, inoScale: number) => {
  const sleeve = smooth((f - PL.T.sleeve[0]) / (PL.T.sleeve[1] - PL.T.sleeve[0]));
  const phase = c01((f - PL.T.inoc0) / PL.T.inocLen);
  const fl = f >= PL.T.flinch ? c01((f - PL.T.flinch) / 44) : 0;
  const pox = 0.4 * smooth((f - PL.T.pox[0]) / (PL.T.pox[1] - PL.T.pox[0]));
  let kq: VPose = POSES.sleeveUp(-1, sleeve, -0.12);
  kq = { ...kq, worry: 0.35 + 0.4 * smooth((f - 120) / 30) + 0.3 * smooth((f - PL.T.pox[0]) / 30), look: [-0.45 * sleeve, 0.35 * sleeve] };
  if (fl > 0) kq = POSES.flinch(kq, fl, 0.9);
  kq = breathe(kq, f, 1, 0.7);
  // his left hand held out and down toward her (eased from the hip as the sleeve goes up)
  const k0 = vaccineAnchors("child", kq, kidAt, kidScale, { variant: 6 });
  // held out from f100; once she lets go of his wrist (f214) it relaxes a little, not back to his side
  const offer = smooth((f - 100) / 32) * (1 - 0.4 * smooth((f - 216) / 22));
  const handTo: P2 = [k0.shoulderL[0] - 54 * kidScale, k0.shoulderL[1] + 36 * kidScale];
  const kidGrip = offer > 0.001 ? { L: mix2(k0.handL, handTo, offer) } : undefined;
  const ka = vaccineAnchors("child", kq, kidAt, kidScale, { variant: 6, grip: kidGrip });
  // the scratch goes on the bare upper arm, below the pushed-up sleeve (between the arm spot and the elbow)
  const spot = mix2(ka.armSpotL, ka.elbowL, 0.5);
  // her NEAR hand carries the lancet to his upper arm (inoculate's reach); her FAR hand, the leading one, takes his
  // wrist from below and steadies the offered arm (the cast's near arm is the short one in a three-quarter view, so
  // the wrist, low and forward, goes to the far hand); neither hand sits on the scratch spot
  const b = POSES.inoculate(1, phase);
  const down = smooth((f - 204) / 32);
  const rest = { w: [-30, -138] as P2, elbow: [-0.3, 1] as P2, fist: 0.3, hand: 0 };
  const al = b.armL;
  const armL = down > 0 ? { w: mix2(al.w, rest.w, down), elbow: mix2(al.elbow, rest.elbow, down), fist: al.fist + (rest.fist - al.fist) * down, hand: al.hand + (rest.hand - al.hand) * down } : al;
  const iq: VPose = breathe({ ...b, armL, worry: 0.15 }, f, 0.6, 0.2);
  const hold = { L: "lancet" as const, R: "none" as const };
  const i0 = vaccineAnchors("inoculator", iq, inoAt, inoScale, { variant: 0, hold, reachTo: spot });
  const take = smooth((f - 104) / 30) * (1 - smooth((f - 214) / 30));
  const wrist: P2 = [ka.wristL[0] - 1 * kidScale, ka.wristL[1] + 6 * kidScale];
  const inoGrip = take > 0.001 ? { R: mix2(i0.handR, wrist, take) } : undefined;
  const charge = { kind: "pox" as const, amt: 1 - 0.6 * smooth((f - 160) / 16) };
  // the 2.5D solve can land the tip a little off its target: correct the target until the tip is on the spot
  let aim: P2 = spot;
  const amtR = iq.reach?.amt ?? 0;
  const wC = smooth((amtR - 0.4) / 0.4);
  if (wC > 0.001) {
    const want: P2 = [spot[0] + (iq.reach?.off?.[0] ?? 0) * inoScale * amtR, spot[1] + (iq.reach?.off?.[1] ?? 0) * inoScale * amtR];
    let c: P2 = spot;
    for (let it = 0; it < 6; it++) {
      const k = vaccineAnchors("inoculator", iq, inoAt, inoScale, { variant: 0, grip: inoGrip, hold, reachTo: c }).keyL;
      c = [c[0] + (want[0] - k[0]) / amtR, c[1] + (want[1] - k[1]) / amtR];
    }
    aim = mix2(spot, c, wC);
  }
  return { kid: { pose: kq, grip: kidGrip, pox }, ino: { pose: iq, grip: inoGrip, hold, lancetTo: aim, charge }, spot };
};
const stationS = (w: World): Item[] => {
  const f = w.frame;
  const els: React.ReactNode[] = [];
  const kidZ = PL.ZS + ST.kidDz;
  const kp = placeOf(w, ST.kidX, kidZ);
  const ip = placeOf(w, ST.inoX, PL.ZS);
  const rig = stationRig(f, kp.at, kp.scale, ip.at, ip.scale);
  const kid: FigSpec = { kind: "child", variant: 6, pose: rig.kid.pose, grip: rig.kid.grip, X: ST.kidX, zw: kidZ, uid: "sKi", pox: rig.kid.pox };
  const ino: FigSpec = { kind: "inoculator", variant: 0, pose: rig.ino.pose, grip: rig.ino.grip, X: ST.inoX, zw: PL.ZS, uid: "sIn", lancetTo: rig.ino.lancetTo, charge: rig.ino.charge, hold: rig.ino.hold };
  const spot = rig.spot;
  const sc = kp.scale;
  els.push(<Fig key="ki" w={w} s={kid} />);
  // the plum mark the scratch leaves on the arm (once the tip has passed over it): ~12 px and up at the landing
  const mark = smooth((f - 160) / 12);
  if (mark > 0.01) {
    els.push(<path key="mk" d={`M${Pt([spot[0] - 0.5 * sc, spot[1] - 2.5 * sc])}L${Pt([spot[0] + 0.4 * sc, spot[1] + (-2.5 + 7 * mark) * sc])}`} stroke={POX_DEEP} strokeWidth={2.6 * sc} strokeLinecap="round" opacity={0.95} />);
    els.push(<circle key="mk2" cx={spot[0]} cy={spot[1] + 0.5 * sc} r={2.8 * sc * mark} fill={POX} />);
  }
  els.push(<Fig key="in" w={w} s={ino} />);
  // the matter on the blade's tip, legible (the cast's own speck is drawn too)
  const ia = anchorsOf(w, ino);
  const amt = rig.ino.charge.amt;
  els.push(<circle key="tip" cx={ia.keyL[0]} cy={ia.keyL[1]} r={2.9 * ip.scale * Math.sqrt(amt)} fill={POX} opacity={0.95} />);
  els.push(<circle key="tip2" cx={ia.keyL[0] - 0.8 * ip.scale} cy={ia.keyL[1] - 0.8 * ip.scale} r={1.1 * ip.scale * Math.sqrt(amt)} fill={mixHex(POX, "#E9C9CC", 0.4)} opacity={0.8} />);
  return [{ key: PL.ZS, el: <g key="stS">{els}</g> }];
};

// ===================================================================================================================
// THE VACCINE THAT DOES NOT EXIST YET: a dashed orange vial far down the lane, drawn by a moving tip, never filled
// ===================================================================================================================
/** the vial's outline in its own plane (units, x across from its axis, y up from its foot), in drawing order */
const VIAL_PATHS: P2[][] = (() => {
  const { H, R } = PL.VIAL;
  const neckR = R * 0.46;
  const shoulder = H * 0.66;
  const neckTop = H * 0.84;
  const lipR = R * 0.6;
  const out: P2[] = [];
  out.push([0, 0]);
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    out.push([-R * Math.sin(a), R * 0.4 * (1 - Math.cos(a))]);
  }
  out.push([-R, shoulder - R * 0.35]);
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    out.push([-R + (R - neckR) * Math.sin(a), shoulder - R * 0.35 + R * 0.35 * Math.sin(a) + R * 0.12 * (1 - Math.cos(a))]);
  }
  out.push([-neckR, neckTop]);
  out.push([-lipR, neckTop + 10]);
  out.push([-lipR, neckTop + 34]);
  out.push([lipR, neckTop + 34]);
  out.push([lipR, neckTop + 10]);
  out.push([neckR, neckTop]);
  for (let i = 8; i >= 1; i--) {
    const a = (i / 8) * (Math.PI / 2);
    out.push([R - (R - neckR) * Math.sin(a), shoulder - R * 0.35 + R * 0.35 * Math.sin(a) + R * 0.12 * (1 - Math.cos(a))]);
  }
  out.push([R, shoulder - R * 0.35]);
  for (let i = 10; i >= 0; i--) {
    const a = (i / 10) * (Math.PI / 2);
    out.push([R * Math.sin(a), R * 0.4 * (1 - Math.cos(a))]);
  }
  // the stopper (a cork in the mouth) and the fill line it would hold
  const cork: P2[] = [[-neckR * 0.85, neckTop + 34], [-neckR * 0.78, H], [neckR * 0.78, H], [neckR * 0.85, neckTop + 34]];
  const fillY = shoulder * 0.62;
  const fill: P2[] = [[-R * 0.9, fillY], [R * 0.9, fillY]];
  return [out, cork, fill];
})();
const Vial: React.FC<{ w: World }> = ({ w }) => {
  const f = w.frame;
  const t = c01((f - PL.T.vial[0]) / (PL.T.vial[1] - PL.T.vial[0]));
  if (t <= 0) return null;
  const { A } = w;
  const Z = w.Zk(PL.ZV);
  // the one glowing material keeps most of its colour through the haze (a third of the fog), faint but legible
  const col = mixHex(ACCENT, A.airHex(Z, 300), 0.33 * A.fog(Z));
  const pts = VIAL_PATHS.map((path) => path.map(([x, y]) => A.P.p(PL.VIAL.X + x, -y, Z)));
  // cumulative lengths over all three strokes, drawn by one tip in order
  const lens = pts.map((q) => q.slice(1).reduce((s, b, i) => s + Math.hypot(b[0] - q[i][0], b[1] - q[i][1]), 0));
  const total = lens.reduce((a, b) => a + b, 0);
  const e = t < 1 ? t * t * (3 - 2 * t) * 0.15 + t * 0.85 : 1;
  let L = total * e;
  let tip: P2 | null = null;
  const ds: string[] = [];
  pts.forEach((q, k) => {
    if (L <= 0) return;
    let d = `M${Pt(q[0])}`;
    let acc = 0;
    for (let i = 1; i < q.length; i++) {
      const seg = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
      if (acc + seg >= L) {
        const u = (L - acc) / seg;
        const pnt: P2 = [q[i - 1][0] + (q[i][0] - q[i - 1][0]) * u, q[i - 1][1] + (q[i][1] - q[i - 1][1]) * u];
        d += `L${Pt(pnt)}`;
        tip = pnt;
        acc = L;
        break;
      }
      d += `L${Pt(q[i])}`;
      acc += seg;
    }
    ds.push(d);
    L -= lens[k];
  });
  const drawing = t < 1;
  const glim = 0.85 + 0.15 * Math.sin(f * 0.21) * Math.sin(f * 0.077 + 1.2);
  const sw = 3.4;
  return (
    <g>
      <defs>
        <filter id="hp-vtip" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {ds.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={col} strokeWidth={i === 2 ? sw * 0.8 : sw} strokeDasharray={i === 2 ? "7 7" : "12 7"} strokeLinecap="round" strokeLinejoin="round" opacity={(i === 2 ? 0.7 : 0.95) * (drawing ? 1 : glim)} />
      ))}
      {drawing && tip ? (
        <g>
          <circle cx={(tip as P2)[0]} cy={(tip as P2)[1]} r={7} fill={ACCENT} opacity={0.45} filter="url(#hp-vtip)" />
          <circle cx={(tip as P2)[0]} cy={(tip as P2)[1]} r={2.4} fill={mixHex(ACCENT, "#FFF4D8", 0.35)} />
        </g>
      ) : null}
    </g>
  );
};

/** the lower frame sinks into the dense low air (the style's height ramp), so the near lane is not a flat dead face */
const LowAir: React.FC<{ w: World }> = ({ w }) => {
  const c = rgbHex(w.A.v.airAtScreen(2150));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="hp-low" x1="0" y1="1180" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c} stopOpacity={0} />
          <stop offset="0.35" stopColor={c} stopOpacity={0.38} />
          <stop offset="0.7" stopColor={c} stopOpacity={0.7} />
          <stop offset="1" stopColor={c} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <rect x={0} y={1180} width={1080} height={740} fill="url(#hp-low)" />
    </svg>
  );
};

// ===================================================================================================================
const HugePeriodOfTrialAndError: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const w = worldAt(frame);
  const items: Item[] = [...tuftItems(w), ...treeItems(w), ...wallItems(w), ...houseItems(w), ...stationA(w), ...stationB(w), ...stationC(w), ...stationS(w), { key: PL.ZV, el: <Vial key="vial" w={w} /> }];
  items.sort((a, b) => b.key - a.key);
  return (
    <AirStage v={w.A.v} bloom={0.22}>
      <WorldSvg cam={w.A.cam}>
        <Ground w={w} />
        {items.map((it) => it.el)}
      </WorldSvg>
      <LowAir w={w} />
    </AirStage>
  );
};

export default HugePeriodOfTrialAndError;
