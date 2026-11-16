// ---------------------------------------------------------------------------
// TimelineToTheDataCenter (rsi-ten-earths, cut 17, REV 1). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 173 frames. One stage inside the misty teal air (AirStage, palette A) on a londonDepth
// one-point perspective from the kit kits/dwarkesh-3d/dwarkesh3d; the world is the clip's shared modules, read-only:
// tenEarthsHall (cut 2's HALL_COMPACT building, the hall interior, racks, desks) and tenEarthsBot (the orange robot).
// The cut's own world (camera, road, years, door, hall layout) is the pure module ./timelineDcWorld.ts.
//
// CHECK LINE: "The years fly by under us. That isn't the point: what's at the end of the road is a building full of AI
//   robots at work, a whole country of them."
//
// THE LINE: "the crazier thing to contemplate here is not the timeline, but what happens once we do get to a country
//   of geniuses in a data center. Because"
// WORD -> FRAME: the 9 · crazier 14 · thing 27 · to 32 · contemplate 35 · here 48 · is 51 · not 57 · the 61 ·
//   timeline 64 · but 79 · what 83 · happens 88 · once 98 · we 104 · do 108 · get 111 · to 127 · a 131 ·
//   country 133 · of 139 · geniuses 143 · in 156 · a 158 · data 160 · center 164 · Because 165
//   ("However" f-6 is said on the speaker before the slot.)
// DURATION: the slot 17.5175 -> 24.7330 s (sequence frames 420-593) = 173 frames at 24000/1001 (f0..f172).
//
// THE MOTION: ONE CONTINUOUS FLIGHT. f0: the camera is already gliding low over a road (eye 1.2 m, looking down it, its
// vanishing point at y 780), the data-center building small and hazy at the road's end; it eases out of the glide in
// ~10 frames and accelerates. The years are PAINTED ON THE ASPHALT in the camera's lane, big worn cream road
// stencils stretched along the road like real road markings: 2026 reads on "crazier ... thing" (f14-25), 2027 on
// "not the timeline" (f56-63), then 2028, 2029, 2030, 2031 come faster and smaller as the run peaks (~f74) and slide
// under the camera. On "but what happens" the building fills the view: its roll-up loading door (a real part: the
// slatted slab rises into its drum behind the lintel, f80-101) opens on a lit hall of orange robots while the camera
// decelerates toward it, and the camera flies THROUGH the open door at f110 ("get" 111). Inside, the crane rises
// (1.2 m -> 4.65 m) and swings back (forward speed to zero at f134, then ~0.9 m back) while the lens widens a little:
// the reveal widest on "a country of geniuses" (f133-143): rows of desk pairs between rack columns, robots typing at
// every desk, a few walking the cross aisles, three working at racks, the rows running into the haze. f150-172: a
// slow living drift (they type, walk and blink; rack lights twinkle).
// CAUSE: the door's slab rises first (its gap shows the lit hall from f84), and the camera only reaches the opening
//   after the slab is fully up (f101, eye passes at f110 with the slab's bottom edge 2.6 m over the floor). Nothing
//   appears from nothing: every robot is at work from f0 (the inside is simply not seen until the door opens).
// Orange = THE AIs only (the robots). Road asphalt with cream paint, the building oatmeal / stone (cut 2's), racks
//   slate with cream lights, desks laminate / slate, chairs dusty teal.
//
// DEPTH: see timelineDcWorld.ts (a shift-lens eye mapped per frame onto londonDepth with the front plane DREF ahead).
//   Fog by the eye's distance: outdoors fogNear 1500 / fogVis 7500, indoors (from the door) 600 / 3600 and the darker
//   interior knob eyeT 0.11 -> 0.25; the shafts thin to 0.45 inside.
//
// SOURCES: the years 2026-2031 continue Dario Amodei's "one to three years" (said Nov 2026, earlier in the clip); no
//   other figures on screen.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirBox, AirHorizonHazeW, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, c01, lerp, lineOf, makeAirView, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts, type Mat } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DESK, Desk, HallInterior, MAT_BASE, MAT_DOOR, MAT_FABRIC, MAT_LAMINATE, MAT_MONITOR, MAT_RACK, RACK, RackField, deskAnchors, type HallGeom } from "./tenEarthsHall";
import { BOT_POSES, BOT_SHADOW, Bot, BotLayer, FolkCanvas, blitBot, botCrowdReqs, botGripTo, botWalkAdvance, useBotSprites, type BotPose } from "./tenEarthsBot";
import {
  EDGE_LINE,
  DESKS,
  DOOR,
  DREF,
  DURATION as DUR,
  EZ0,
  FPS as FPS_W,
  HALL_IN,
  RACK_COL_X,
  RACKS_IN,
  RACK_DZ,
  RACK_HANDS,
  RACK_HAND_GAP,
  ROAD_X0,
  ROAD_X1,
  ROWS,
  WALKERS,
  YEARS,
  deskPose,
  yearFade,
  aisleZ,
  doorOpen,
  eyeAt,
  rowZ,
  sm,
  yearPolys,
  type Eye,
} from "./timelineDcWorld";

export const FPS = FPS_W;
export const DURATION = DUR;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const PAL = AIR.A;

// ===================================================================================================================
// THE CAMERA AND THE AIR
// ===================================================================================================================
type View = { e: Eye; cam: Cam; depth: DepthOpts; A: AirWorld; zk: (Z: number) => number; inside: number; crane: number };
const E0 = eyeAt(0);
const camOfEye = (e: Eye, f: number): { cam: Cam; depth: DepthOpts } => {
  const k = e.F / DREF;
  const cam = swayCam({ k, cx: e.X, cy: -e.He - (e.Hy - 960) / k }, f);
  return { cam, depth: { eyeY: -e.He, dRef: DREF, kRef: k, dolly: 1 } };
};
const REST = camOfEye(E0, 0).cam;
export const viewAt = (f: number): View => {
  const e = eyeAt(f);
  const { cam, depth } = camOfEye(e, f);
  /** 0 on the road, 1 in the hall (the air thickens through the door) */
  const inside = sm(92, 122, f);
  /** 0 until the crane starts, 1 at its top: the air clears with the height so the rows run on into the far haze */
  const crane = sm(132, 162, f);
  const scene = { fogNear: lerp(lerp(1500, 600, inside), 2300, crane), fogVis: lerp(lerp(7500, 3600, inside), 14000, crane), eyeT: lerp(0.11, 0.25, inside) - 0.04 * crane };
  // the people's fog by the eye's distance (the kit's figFog is by kit Z = distance - DREF)
  const A0 = airWorldOf({ cam, rest: REST, depth, frame: f, scene, fogBy: "eye", figFog: { near: lerp(900, 2400, crane) - DREF, vis: lerp(3200, 12000, crane), max: 0.72 } });
  // the motes fly past with the REAL eye (the kit's front plane rides along with it)
  const v = makeAirView({ scene: A0.v.scene, frame: f, horizon: A0.v.horizon, cam: { x: cam.cx, y: e.He, z: e.Ze }, rest: { x: REST.cx, y: E0.He, z: E0.Ze } });
  const A = { ...A0, v };
  return { e, cam, depth, A, zk: (Z: number) => Z - e.Ze - DREF, inside, crane };
};

/** the unclamped projection of a world point (world Z) into WorldSvg's world px */
const projOf = (V: View) => {
  const { cam, e } = V;
  const eyeY = -e.He;
  return (X: number, Y: number, Z: number): [number, number] => {
    const r = DREF / Math.max(4, Z - e.Ze);
    return [cam.cx + (X - cam.cx) * r, eyeY + (Y - eyeY) * r];
  };
};
const f2 = (v: number) => v.toFixed(2);
const ptsOf = (q: [number, number][]) => `M${q.map((v) => `${f2(v[0])},${f2(v[1])}`).join("L")}Z`;

// ===================================================================================================================
// THE GROUND, THE ROAD AND THE PAINTED YEARS (outdoors; world Z, clamp-free)
// ===================================================================================================================
const NEAR_D = 140;
const FAR_D = 30000;
const MAT_ROAD: Mat = { lit: "#8A8274", mid: "#6B6458", dark: "#3C3832" };
const ROAD_HEX = mixHex(MAT_ROAD.mid, MAT_ROAD.dark, 0.1);
const PAINT_HEX = mixHex(PAL.cream, ROAD_HEX, 0.1);

/** the open ground beside the road: bands of one tone by distance, big flag joints fading with the fog */
const OutdoorGround: React.FC<{ V: View; mat: Mat; course: number }> = ({ V, mat, course }) => {
  const { A, e, zk } = V;
  const p = projOf(V);
  const za = e.Ze + NEAR_D;
  const z1 = e.Ze + FAR_D;
  const x0 = -18000;
  const x1 = 18000;
  const melt = 0.5;
  const mf = melt * (z1 - za);
  const meltAt = (Z: number) => Math.pow(c01((Z - (z1 - mf)) / mf), 1.3);
  const colAt = (Z: number) => {
    const near = c01(1 - (Z - e.Ze - 1100) / 900);
    const local = mixHex(mixHex(mat.lit, mat.mid, 0.3), mat.dark, 0.2 * near);
    return mixHex(A.tone(local, zk(Z), 0), A.screenAir(p(0, 0, Z)[1]), meltAt(Z));
  };
  const N = 34;
  const zAt = (i: number) => lerp(za, z1, Math.pow(i / N, 1.9));
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const a = zAt(i);
    const b = zAt(i + 1);
    const b2 = i < N - 1 ? b + (b - a) * 0.15 : b;
    bands.push(<path key={i} d={ptsOf([p(x0, 0, a), p(x1, 0, a), p(x1, 0, b2), p(x0, 0, b2)])} fill={colAt((a + b) / 2)} />);
  }
  const lines: React.ReactNode[] = [];
  const pieces = 22;
  const zJ = (i: number) => lerp(za, z1, Math.pow(i / pieces, 1.7));
  const step = course * 0.7;
  for (let i = 0; i < pieces; i++) {
    const a = zJ(i);
    const b = zJ(i + 1);
    const zm = (a + b) / 2;
    const amt = (1 - A.fog(zk(zm))) * (1 - meltAt(zm));
    if (amt < 0.03) continue;
    let d = "";
    for (let X = Math.ceil(-6000 / step) * step; X <= 6000; X += step) if (X < ROAD_X0 - 60 || X > ROAD_X1 + 60) d += `M${p(X, 0, a).map(f2).join(",")}L${p(X, 0, b).map(f2).join(",")}`;
    for (let X = Math.floor(-6000 / step) * step; X < 6000; X += step) {
      const off = (((Math.round(X / step) % 2) + 2) % 2) * course * 0.5;
      for (let Z = Math.floor((a - off) / course) * course + off; Z < b; Z += course) {
        if (Z < a) continue;
        const xa = X;
        const xb = X + step;
        const segs: [number, number][] = xb <= ROAD_X0 - 40 || xa >= ROAD_X1 + 40 ? [[xa, xb]] : [[xa, Math.min(xb, ROAD_X0 - 40)], [Math.max(xa, ROAD_X1 + 40), xb]];
        for (const [u, w] of segs) if (w > u) d += `M${p(u, 0, Z).map(f2).join(",")}L${p(w, 0, Z).map(f2).join(",")}`;
      }
    }
    const r = DREF / (zm - e.Ze);
    lines.push(<path key={`j${i}`} d={d} fill="none" stroke={A.tone(lineOf(mat), zk(zm), 0)} strokeWidth={1.3 * r} strokeOpacity={0.42 * amt} />);
  }
  return (
    <g>
      {bands}
      {lines}
    </g>
  );
};

/** a flat strip on the ground X0..X1 from the near ground to z1, in depth pieces fogged by their own distance */
const GroundStrip: React.FC<{ V: View; X0: number; X1: number; z1: number; hex: string; n?: number; opacity?: number }> = ({ V, X0, X1, z1, hex, n = 30, opacity = 1 }) => {
  const { A, e, zk } = V;
  const p = projOf(V);
  const za = e.Ze + NEAR_D;
  if (z1 <= za) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = lerp(za, z1, Math.pow(i / n, 1.9));
    const b = lerp(za, z1, Math.pow((i + 1) / n, 1.9));
    const b2 = i < n - 1 ? b + (b - a) * 0.12 : b;
    out.push(<path key={i} d={ptsOf([p(X0, 0, a), p(X1, 0, a), p(X1, 0, b2), p(X0, 0, b2)])} fill={A.tone(hex, zk((a + b) / 2), 0)} />);
  }
  return <g opacity={opacity}>{out}</g>;
};

/** the asphalt's own marks, fixed in the world so the run shows its speed: faint transverse joints every 7.5 m and a
 *  few darker repair patches */
const PATCHES = Array.from({ length: 40 }, (_, i) => {
  const h = (s: number) => {
    const v = Math.sin((i + 1) * 12.9898 + s * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return { X: lerp(ROAD_X0 + 80, ROAD_X1 - 120, h(1)), Z: -9000 + i * 230 + h(2) * 160, w: 40 + 90 * h(3), l: 80 + 220 * h(4), a: 0.1 + 0.12 * h(5) };
});
const RoadMarks: React.FC<{ V: View }> = ({ V }) => {
  const { A, e, zk } = V;
  const p = projOf(V);
  const els: React.ReactNode[] = [];
  const course = 7.5 * 178;
  for (let Z = Math.ceil((e.Ze + NEAR_D) / course) * course; Z < EZ0 - 200; Z += course) {
    const amt = 1 - A.fog(zk(Z));
    if (amt < 0.05) continue;
    const a = p(ROAD_X0, 0, Z);
    const b = p(ROAD_X1, 0, Z);
    const r = DREF / (Z - e.Ze);
    els.push(<path key={`j${Z}`} d={`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`} stroke={A.tone(MAT_ROAD.dark, zk(Z), 0)} strokeWidth={2.2 * r} strokeOpacity={0.3 * amt} />);
  }
  PATCHES.forEach((q, i) => {
    if (q.Z + q.l < e.Ze + NEAR_D || q.Z > EZ0 - 300) return;
    const amt = 1 - A.fog(zk(q.Z));
    if (amt < 0.05) return;
    const z0 = Math.max(q.Z, e.Ze + NEAR_D);
    els.push(<path key={`p${i}`} d={ptsOf([p(q.X, 0, z0), p(q.X + q.w, 0, z0), p(q.X + q.w, 0, q.Z + q.l), p(q.X, 0, q.Z + q.l)])} fill={A.tone(mixHex(MAT_ROAD.dark, ROAD_HEX, 0.5), zk(q.Z), 0)} fillOpacity={q.a * amt} />);
  });
  return <g>{els}</g>;
};

/** the road's two solid cream edge lines (worn paint, lit and fogged with the road), its whole length */
const EdgeLines: React.FC<{ V: View }> = ({ V }) => (
  <g>
    {[-1, 1].map((sd) => (
      <GroundStrip key={sd} V={V} X0={sd * EDGE_LINE.X - EDGE_LINE.w} X1={sd * EDGE_LINE.X + EDGE_LINE.w} z1={EZ0 - 60} hex={PAINT_HEX} opacity={0.6} n={24} />
    ))}
  </g>
);

/** worn paint: deterministic chips where the paint has gone (road tone over the figures) and the two tyre tracks
 *  (X +-160) where it is thinner */
const chipsOf = (seed: number, n: number, x0: number, x1: number, z0: number, z1: number) =>
  Array.from({ length: n }, (_, i) => {
    const h = (s: number) => {
      const v = Math.sin((i + 1) * 91.17 + seed * 7.31 + s * 13.7) * 43758.5453;
      return v - Math.floor(v);
    };
    const cx = lerp(x0, x1, h(1));
    const cz = lerp(z0, z1, h(2));
    const rx = 4 + 9 * h(3);
    const rz = rx * (2.5 + 2.5 * h(4));
    const rot = (h(5) - 0.5) * 0.6;
    return Array.from({ length: 7 }, (_, j) => {
      const a = (j / 7) * Math.PI * 2;
      const wob = 0.75 + 0.5 * h(10 + j);
      const u = Math.cos(a) * rx * wob;
      const w = Math.sin(a) * rz * wob;
      return [cx + u * Math.cos(rot) - (w * Math.sin(rot)) / 6, cz + w + u * Math.sin(rot) * 3] as [number, number];
    });
  });
const YEAR_POLYS = YEARS.map((y) => yearPolys(y));
const YEAR_CHIPS = YEARS.map((y, i) => {
  const w = (4 * y.W + 3 * y.gap) / 2;
  return chipsOf(i + 3, 22, -w, w, y.Z, y.Z + y.L);
});
const RoadYears: React.FC<{ V: View }> = ({ V }) => {
  const { A, e, zk } = V;
  const p = projOf(V);
  const out: React.ReactNode[] = [];
  YEARS.forEach((y, yi) => {
    if (y.Z + y.L - e.Ze < 280 || y.Z - e.Ze > 16000) return;
    const zm = Math.max(y.Z, e.Ze + 300);
    const fogAmt = A.fog(zk(zm));
    const paint = A.tone(PAINT_HEX, zk(zm), 0);
    const road = A.tone(ROAD_HEX, zk(zm), 0);
    const P = (X: number, Z: number) => p(X, 0, Math.max(Z, e.Ze + 18));
    const w = (4 * y.W + 3 * y.gap) / 2;
    // the paint's contrast eases off as soon as the figure starts down into the caption bands (its near edge past
    // y 1070): by the time its middle reaches y 1080 it is at ~35 %, then fainter still as it slides out
    const exitFade = yearFade(e, y);
    out.push(
      <g key={y.text} opacity={0.9 * (1 - 0.35 * fogAmt) * exitFade}>
        {YEAR_POLYS[yi].map((g, gi) => (
          <path key={gi} d={g.rings.map((r) => ptsOf(r.map(([X, Z]) => P(X, Z)))).join("")} fill={paint} fillRule={g.evenodd ? "evenodd" : "nonzero"} />
        ))}
        {YEAR_CHIPS[yi].map((c, ci) => (
          <path key={`c${ci}`} d={ptsOf(c.map(([X, Z]) => P(X, Z)))} fill={road} fillOpacity={0.85} />
        ))}
        {[-160, 160].map((tx) => (
          <path key={`t${tx}`} d={ptsOf([P(tx - 55, y.Z - 10), P(tx + 55, y.Z - 10), P(tx + 55, y.Z + y.L + 10), P(tx - 55, y.Z + y.L + 10)])} fill={road} fillOpacity={0.22} />
        ))}
        {/* a fine edge darkening where the paint meets the road (a hint of the stencil's lip) */}
        <path d={ptsOf([P(-w - 30, y.Z - 30), P(w + 30, y.Z - 30), P(w + 30, y.Z + y.L + 30), P(-w - 30, y.Z + y.L + 30)])} fill="none" />
      </g>,
    );
  });
  return <g>{out}</g>;
};

// ===================================================================================================================
// THE BUILDING: a long, low, windowless data hall (47 m wide, 7 m to the parapet) in pale grey cladding: vertical
// panel seams, a dark plinth, banks of cream louvred vents with a faint warm-cream glow behind them, a row of rooftop
// condenser units with their fans facing us. Only its front is ever seen (the camera stays on its centre line).
// ===================================================================================================================
const MAT_DC: Mat = { lit: "#BDBAB0", mid: "#9C998F", dark: "#5E5C56" };
const MAT_UNITS: Mat = { lit: "#A7A9A3", mid: "#828580", dark: "#474A47" };
const BLD = { w2: 4200, h: 1250, par: 90, plinth: 46 };
const VENT_X = [-3500, -2650, -1800, -950, 950, 1800, 2650, 3500];
const VENT = { w2: 250, y0: -760, y1: -985 };
const UNIT_X = Array.from({ length: 9 }, (_, i) => -3600 + i * 900);
const UNIT = { w2: 300, h: 300, z0: 420, d: 420 };
const VENT_GLOW = "#F4E2BC";
const Building: React.FC<{ V: View; uid: string }> = ({ V, uid }) => {
  const { A, zk } = V;
  const p = projOf(V);
  const Zf = EZ0;
  const kz = zk(Zf);
  const r = DREF / (Zf - V.e.Ze);
  const lw = A.lw(1.0);
  const { w2, h, par, plinth } = BLD;
  const top = -(h + par);
  // the front face with the door's opening cut out
  const face = `${ptsOf([p(-w2, top, Zf), p(w2, top, Zf), p(w2, 0, Zf), p(-w2, 0, Zf)])}${ptsOf(doorQuad(V, Zf))}`;
  let seams = "";
  for (let X = -w2 + 356; X < w2 - 10; X += 356) {
    if (Math.abs(X) < DOOR.w2 + 60) continue;
    seams += `M${p(X, -plinth, Zf).map(f2).join(",")}L${p(X, -h, Zf).map(f2).join(",")}`;
  }
  const vents: React.ReactNode[] = [];
  VENT_X.forEach((vx, i) => {
    const q = (x: number, y: number) => p(vx + x, y, Zf);
    const { w2: vw, y0, y1 } = VENT;
    let slats = "";
    for (let y = y0 - 26; y > y1 + 10; y -= 28) slats += `M${q(-vw + 14, y).map(f2).join(",")}L${q(vw - 14, y).map(f2).join(",")}`;
    vents.push(
      <g key={`v${i}`}>
        <path d={ptsOf([q(-vw - 50, y1 - 50), q(vw + 50, y1 - 50), q(vw + 50, y0 + 50), q(-vw - 50, y0 + 50)])} fill={VENT_GLOW} fillOpacity={0.16 * (1 - A.fog(kz))} filter={`url(#${uid}-vg)`} />
        <path d={ptsOf([q(-vw, y1), q(vw, y1), q(vw, y0), q(-vw, y0)])} fill={A.tone(mixHex(MAT_DC.dark, PAL.shadow, 0.35), kz, -y0)} />
        <path d={ptsOf([q(-vw + 10, y1 + 10), q(vw - 10, y1 + 10), q(vw - 10, y0 - 10), q(-vw + 10, y0 - 10)])} fill={A.tone(VENT_GLOW, kz, -y0)} fillOpacity={0.3} />
        <path d={slats} stroke={A.tone(mixHex(PAL.cream, VENT_GLOW, 0.5), kz, -y0)} strokeWidth={9 * r} strokeOpacity={0.85} fill="none" />
      </g>,
    );
  });
  // the rooftop condensers (set back from the parapet), two fans each on their front
  const units: React.ReactNode[] = [];
  UNIT_X.forEach((ux, i) => {
    const Z0 = Zf + UNIT.z0;
    const Y1 = -h;
    const Y0 = -h - UNIT.h;
    units.push(<AirBox key={`u${i}`} A={A} X0={ux - UNIT.w2} X1={ux + UNIT.w2} Y0={Y0} Y1={Y1} Z0={zk(Z0)} Z1={zk(Z0 + UNIT.d)} mat={MAT_UNITS} uid={`${uid}-u${i}`} rim={0.4} />);
    const fr = DREF / (Z0 - V.e.Ze);
    [-0.5, 0.5].forEach((fx, j) => {
      const c = p(ux + fx * UNIT.w2, (Y0 + Y1) / 2, Z0);
      const R = 0.36 * UNIT.h * fr;
      units.push(<circle key={`u${i}f${j}`} cx={c[0]} cy={c[1]} r={R} fill={A.tone(MAT_UNITS.dark, zk(Z0), h + 150)} />);
      units.push(<path key={`u${i}g${j}`} d={`M${f2(c[0] - R)},${f2(c[1])}H${f2(c[0] + R)}M${f2(c[0])},${f2(c[1] - R)}V${f2(c[1] + R)}`} stroke={A.tone(MAT_UNITS.mid, zk(Z0), h + 150)} strokeWidth={A.lw(1.2)} />);
    });
  });
  return (
    <g>
      <defs>
        <filter id={`${uid}-vg`} x="-50%" y="-80%" width="200%" height="260%">
          <feGaussianBlur stdDeviation={Math.max(0.5, 60 * r)} />
        </filter>
      </defs>
      {units}
      <path d={face} fillRule="evenodd" fill={A.tone(MAT_DC.lit, kz, h / 2)} />
      <path d={seams} stroke={A.tone(lineOf(MAT_DC), kz, h / 2)} strokeWidth={lw} strokeOpacity={0.45} fill="none" />
      {/* the plinth and the parapet's coping */}
      <path d={`${ptsOf([p(-w2, -plinth, Zf), p(-DOOR.w2 - 40, -plinth, Zf), p(-DOOR.w2 - 40, 0, Zf), p(-w2, 0, Zf)])}${ptsOf([p(DOOR.w2 + 40, -plinth, Zf), p(w2, -plinth, Zf), p(w2, 0, Zf), p(DOOR.w2 + 40, 0, Zf)])}`} fill={A.tone(MAT_DC.dark, kz, 20)} />
      <path d={ptsOf([p(-w2, -h, Zf), p(w2, -h, Zf), p(w2, -h + 16, Zf), p(-w2, -h + 16, Zf)])} fill={A.tone(MAT_DC.mid, kz, h)} fillOpacity={0.7} />
      <path d={ptsOf([p(-w2 - 10, top - 10, Zf), p(w2 + 10, top - 10, Zf), p(w2 + 10, top + 8, Zf), p(-w2 - 10, top + 8, Zf)])} fill={A.tone(mixHex(MAT_DC.lit, PAL.cream, 0.3), kz, h + par)} />
      {vents}
      {/* the door's frame and the drum's housing over it */}
      <path d={`${ptsOf([p(-DOOR.w2 - 26, -DOOR.h - 70, Zf), p(DOOR.w2 + 26, -DOOR.h - 70, Zf), p(DOOR.w2 + 26, 0, Zf), p(-DOOR.w2 - 26, 0, Zf)])}${ptsOf(doorQuad(V, Zf))}`} fillRule="evenodd" fill={A.tone(MAT_DOOR.dark, kz, DOOR.h / 2)} />
    </g>
  );
};

// ===================================================================================================================
// THE BUILDING'S OPENING: the tunnel through the front wall, the roll-up slab, the hole in the shell
// ===================================================================================================================
const SLAB_Z = -16;
const doorQuad = (V: View, Z: number, y0 = 0, y1 = DOOR.h): [number, number][] => {
  const p = projOf(V);
  return [p(-DOOR.w2, -y1, Z), p(DOOR.w2, -y1, Z), p(DOOR.w2, -y0, Z), p(-DOOR.w2, -y0, Z)];
};
/** the tunnel's faces between Z a and b (a < b): its two sides, the soffit and the sill */
const Reveals: React.FC<{ V: View; a: number; b: number }> = ({ V, a, b }) => {
  const { A, zk, e } = V;
  const p = projOf(V);
  if (b - e.Ze < 6) return null;
  const a2 = Math.max(a, e.Ze + 6);
  const { w2, h } = DOOR;
  const zm = zk((a2 + b) / 2);
  const side = A.tone(mixHex(MAT_DC.dark, MAT_DC.mid, 0.45), zm, h / 2);
  const sideR = A.tone(mixHex(MAT_DC.dark, PAL.shadow, 0.25), zm, h / 2);
  const soffit = A.tone(mixHex(MAT_DC.dark, PAL.shadow, 0.4), zm, h);
  const sill = A.tone(MAT_BASE.mid, zm, 0);
  return (
    <g>
      <path d={ptsOf([p(-w2, -h, a2), p(-w2, -h, b), p(-w2, 0, b), p(-w2, 0, a2)])} fill={side} />
      <path d={ptsOf([p(w2, -h, a2), p(w2, -h, b), p(w2, 0, b), p(w2, 0, a2)])} fill={sideR} />
      <path d={ptsOf([p(-w2, -h, a2), p(w2, -h, a2), p(w2, -h, b), p(-w2, -h, b)])} fill={soffit} />
      <path d={ptsOf([p(-w2, 0, a2), p(w2, 0, a2), p(w2, 0, b), p(-w2, 0, b)])} fill={sill} />
    </g>
  );
};
/** the roll-up door's slab: what is still down (its bottom edge at height yb), slats moving up with it, a bottom bar */
const Slab: React.FC<{ V: View; open: number }> = ({ V, open }) => {
  const { A, zk } = V;
  const p = projOf(V);
  const { w2, h } = DOOR;
  const yb = open * h;
  if (yb >= h - 1) return null;
  const Zs = zk(SLAB_Z);
  const hm = (h + yb) / 2;
  const lw = A.lw(1.1);
  let slats = "";
  for (let s = yb + 24; s < h - 2; s += 24) slats += `M${p(-w2, -s, SLAB_Z).map(f2).join(",")}L${p(w2, -s, SLAB_Z).map(f2).join(",")}`;
  return (
    <g>
      <path d={ptsOf(doorQuad(V, SLAB_Z, yb, h))} fill={A.tone(MAT_DOOR.lit, Zs, hm)} />
      <path d={slats} stroke={A.tone(MAT_DOOR.mid, Zs, hm)} strokeWidth={lw * 1.1} fill="none" />
      <path d={ptsOf(doorQuad(V, SLAB_Z, yb, Math.min(h, yb + 20)))} fill={A.tone(MAT_DOOR.dark, Zs, yb)} />
      {/* the light from inside under the rising edge */}
      {open > 0.004 ? <path d={`M${p(-w2, -yb, SLAB_Z).map(f2).join(",")}L${p(w2, -yb, SLAB_Z).map(f2).join(",")}`} stroke={PAL.cream} strokeOpacity={0.35 * (1 - A.fog(Zs))} strokeWidth={lw * 1.4} /> : null}
    </g>
  );
};

// ===================================================================================================================
// THE HALL: the interior, rack columns, desk pairs with robots typing, walkers, robots at racks
// ===================================================================================================================
const WALK_U = botWalkAdvance(1);
const shiftHall = (g: HallGeom, zk: (Z: number) => number): HallGeom => ({ ...g, z0: zk(g.z0), z1: zk(g.z1) });
type Cull = { x0: number; x1: number };
const onScreen = (V: View, X: number, Z: number, halfW: number, c: Cull) => {
  const d = Z - V.e.Ze;
  if (d < 160) return false;
  const s = V.e.F / d;
  const x = 540 + (X - V.cam.cx) * s;
  return x + halfW * s > c.x0 && x - halfW * s < c.x1;
};
/** a robot at a rack: three-quarter back to us, one mitten on a server at chest height */
const rackHandPose = (frame: number, seed: number, side: 1 | -1): BotPose => {
  const base = BOT_POSES.turnTo(Math.PI - side * 0.55, frame, seed);
  const tap = 0.5 + 0.5 * Math.sin(frame * 0.19 + seed);
  return botGripTo(base, side > 0 ? { R: [18, -150 - 6 * tap] } : { L: [-18, -150 - 6 * tap] });
};
/** the monitors' glow thins with distance (far back to back screens summed into one hot spot at the vanishing point) */
const glowOf = (d: number) => lerp(1, 0.12, sm(900, 3600, d));
/** rows whose robots stand >= NEAR_PX tall on screen are drawn live (SVG); the rest go on one canvas (the crowd) */
const NEAR_PX = 52;
const rowDist = (V: View, k: number) => rowZ(k) + 124 - V.e.Ze;
const isNearRow = (V: View, k: number) => {
  const d = rowDist(V, k);
  return d > 160 && (240 * V.e.F) / d >= NEAR_PX;
};
/** the far rows melt into the air (no far edge to the hall: the rows run on into the haze) */
const rowMelt = (d: number) => 1 - sm(14000, 28500, d);
/** the desk monitor turned 38 degrees from its robot toward the camera, so its face shows: a dark screen, a faint
 *  cream glow. Returns the panel's four corners (world X, Y, Z) and the glow inset. */
const MON_TURN = (38 * Math.PI) / 180;
const monitorQuad = (deskX: number, Z: number, side: -1 | 1, inset = 0): [number, number, number][] => {
  const sc = deskAnchors(deskX, Z, side < 0 ? "left" : "right").screen;
  // the face's normal points back at its robot (-X for the left robot's screen), turned toward the camera (-Z)
  const nx = -side * Math.cos(MON_TURN);
  const nz = -Math.sin(MON_TURN);
  const tx = -nz;
  const tz = nx;
  const hw = 49 - inset;
  const y0 = -222 + inset;
  const y1 = -163 - inset;
  return [
    [sc.X - hw * tx, y0, sc.Z - hw * tz],
    [sc.X + hw * tx, y0, sc.Z + hw * tz],
    [sc.X + hw * tx, y1, sc.Z + hw * tz],
    [sc.X - hw * tx, y1, sc.Z - hw * tz],
  ];
};
const MonitorFace: React.FC<{ V: View; deskX: number; Z: number; side: -1 | 1; glow: number }> = ({ V, deskX, Z, side, glow }) => {
  const { A, zk } = V;
  const p = projOf(V);
  const kz = zk(Z + 124);
  const q = monitorQuad(deskX, Z, side).map(([x, y, zz]) => p(x, y, zz));
  const g = monitorQuad(deskX, Z, side, 7).map(([x, y, zz]) => p(x, y, zz));
  return (
    <g>
      <path d={ptsOf(q)} fill={A.tone(MAT_MONITOR.dark, kz, 192)} />
      <path d={ptsOf(g)} fill={A.tone(mixHex(PAL.shadow, "#2E4446", 0.5), kz, 192)} />
      <path d={ptsOf(g)} fill={PAL.cream} fillOpacity={0.22 * glow * (1 - A.fog(kz))} />
    </g>
  );
};
const hallExtras = (V: View, frame: number, cull: Cull) => {
  const { A, zk } = V;
  const P = A.P;
  const items: { Z: number; node: React.ReactNode }[] = [];
  for (let k = 0; k < ROWS; k++) {
    if (!isNearRow(V, k)) continue;
    const row = DESKS.filter((d) => d.k === k && onScreen(V, d.botX, d.botZ, 260, cull));
    if (!row.length) continue;
    const desks = row.map((d, i) => <Desk key={`d${i}`} A={A} X={d.deskX} Z={zk(d.Z)} seat={d.side < 0 ? "left" : "right"} uid={`tdk${k}-${d.pair}${d.side}`} layer="back" frame={frame} screen={glowOf(d.botZ - V.e.Ze)} />);
    const mons = row.map((d, i) => <MonitorFace key={`m${i}`} V={V} deskX={d.deskX} Z={d.Z} side={d.side} glow={glowOf(d.botZ - V.e.Ze)} />);
    const bots = row.map((d, i) => {
      const { at, scale } = P.at(d.botX, zk(d.botZ));
      return <Bot key={`b${i}`} variant={d.variant} pose={deskPose(d, frame)} at={at} scale={scale} uid={`tbt${k}-${d.pair}${d.side}`} frame={frame} fog={A.folkFog(zk(d.botZ))} unitPx={A.k} />;
    });
    items.push({
      Z: zk(rowZ(k) + 124),
      node: (
        <g key={`row${k}`}>
          {desks}
          {mons}
          <BotLayer uid={`tbl${k}`} unitPx={A.k}>
            {bots}
          </BotLayer>
        </g>
      ),
    });
  }
  WALKERS.forEach((w, i) => {
    const X = w.X0 + w.dir * WALK_U * frame;
    const Zw = aisleZ(w.k);
    if (!isNearRow(V, w.k) || !onScreen(V, X, Zw, 80, cull)) return;
    const { at, scale } = P.at(X, zk(Zw));
    items.push({
      Z: zk(Zw),
      node: (
        <g key={`wk${i}`}>
          <AirShadow A={A} X={X} Z={zk(Zw)} w={BOT_SHADOW.w} d={BOT_SHADOW.d} amt={BOT_SHADOW.amt} uid={`twks${i}`} />
          <Bot variant={w.variant} pose={BOT_POSES.walk(w.dir, frame + w.phase)} at={at} scale={scale} uid={`twk${i}`} frame={frame} fog={A.folkFog(zk(Zw))} unitPx={A.k} />
        </g>
      ),
    });
  });
  RACK_HANDS.forEach((h, i) => {
    const X = h.colX + h.dX;
    const Zw = rowZ(h.k + 1) + RACK_DZ - RACK_HAND_GAP;
    if (!isNearRow(V, h.k + 1) || !onScreen(V, X, Zw, 80, cull)) return;
    const { at, scale } = P.at(X, zk(Zw));
    items.push({
      Z: zk(Zw),
      node: (
        <g key={`rh${i}`}>
          <AirShadow A={A} X={X} Z={zk(Zw)} w={BOT_SHADOW.w} d={BOT_SHADOW.d} amt={BOT_SHADOW.amt} uid={`trhs${i}`} />
          <Bot variant={h.variant} pose={rackHandPose(frame, h.seed, h.dX < 0 ? 1 : -1)} at={at} scale={scale} uid={`trh${i}`} frame={frame} fog={A.folkFog(zk(Zw))} unitPx={A.k} />
        </g>
      ),
    });
  });
  return items.sort((a, b) => b.Z - a.Z);
};
/** the hall's floor and (far, fogged) walls; no ceiling: the hall's top is lost in the air. The floor runs on under
 *  the front wall's line (the crane backs out over it at the end, where only the floor is seen) */
const HALL_DRAW: HallGeom = { ...HALL_IN, z0: -700 };
const HallBase: React.FC<{ V: View }> = ({ V }) => <HallInterior A={V.A} uid="tdc-in" hall={shiftHall(HALL_DRAW, V.zk)} lights={false} ceiling={false} />;
/** the near rows: their racks, desks, monitors, robots, the walkers and the robots at racks */
const NearHall: React.FC<{ V: View; frame: number; cull: Cull }> = ({ V, frame, cull }) => {
  const { A, zk } = V;
  const racks = RACKS_IN.filter((r) => isNearRow(V, r.row ?? 0)).map((r) => ({ ...r, Z: zk(r.Z) }));
  return <RackField A={A} racks={racks} frame={frame} uid="tdc-rk" extras={hallExtras(V, frame, cull)} />;
};

/** THE CROWD: the far rows on one canvas, far to near, each row outside-in: rack runs as boxes with a few cream
 *  lights, desks as boxes with their turned monitors, the robots as the crowd sprites (profile views, at their
 *  chairs) and the dot LOD in the distance */
type Get = Parameters<typeof blitBot>[1];
const drawFar = (ctx: CanvasRenderingContext2D, V: View, get: Get, clip: [number, number][] | null) => {
  const { A, e, cam, zk } = V;
  const p = projOf(V);
  const k = cam.k;
  const sp = (X: number, Y: number, Z: number): [number, number] => {
    const w = p(X, Y, Z);
    return [540 + (w[0] - cam.cx) * k, 960 + (w[1] - cam.cy) * k];
  };
  if (clip) {
    ctx.save();
    ctx.beginPath();
    clip.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
    ctx.closePath();
    ctx.clip();
  }
  const poly = (q: [number, number][], fill: string) => {
    ctx.beginPath();
    ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const box = (X0: number, X1: number, Y0: number, Y1: number, Z0: number, Z1: number, c: { top: string; front: string; side: string; dark: string }) => {
    if (X0 > e.X) poly([sp(X0, Y0, Z0), sp(X0, Y0, Z1), sp(X0, Y1, Z1), sp(X0, Y1, Z0)], c.side);
    if (X1 < e.X) poly([sp(X1, Y0, Z0), sp(X1, Y0, Z1), sp(X1, Y1, Z1), sp(X1, Y1, Z0)], c.dark);
    if (-e.He < Y0) poly([sp(X0, Y0, Z0), sp(X1, Y0, Z0), sp(X1, Y0, Z1), sp(X0, Y0, Z1)], c.top);
    poly([sp(X0, Y0, Z0), sp(X1, Y0, Z0), sp(X1, Y1, Z0), sp(X0, Y1, Z0)], c.front);
  };
  const RW3 = (3 * RACK.w) / 2;
  const DD2 = DESK.d / 2;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (isNearRow(V, r)) continue;
    const dRow = rowDist(V, r);
    if (dRow < 160) continue;
    const melt = rowMelt(dRow);
    if (melt <= 0.01) continue;
    const s = (k * DREF) / dRow;
    const half = 600 / s + 400;
    const Zr = rowZ(r);
    const kz = zk(Zr + 124);
    const t = (hex: string, h: number) => A.tone(hex, kz, h);
    const rackC = { top: t(MAT_RACK.lit, 356), front: t(MAT_RACK.mid, 178), side: t(mixHex(MAT_RACK.lit, MAT_RACK.mid, 0.5), 178), dark: t(MAT_RACK.dark, 178) };
    const deskC = { top: t(MAT_LAMINATE.lit, 133), front: t(MAT_LAMINATE.mid, 100), side: t(mixHex(MAT_LAMINATE.lit, MAT_LAMINATE.mid, 0.4), 100), dark: t(MAT_LAMINATE.dark, 100) };
    const chairC = t(MAT_FABRIC.mid, 80);
    const monC = t(MAT_MONITOR.dark, 192);
    const light = t(PAL.cream, 200);
    const fig = A.folkFog(kz);
    type It = { X: number; draw: () => void };
    const its: It[] = [];
    for (const cx of RACK_COL_X) {
      if (Math.abs(cx - e.X) > half) continue;
      its.push({
        X: cx,
        draw: () => {
          box(cx - RW3, cx + RW3, -RACK.h, 0, Zr + RACK_DZ, Zr + RACK_DZ + RACK.d, rackC);
          if (s * RACK.h > 18) {
            ctx.fillStyle = light;
            ctx.globalAlpha = 0.55 * melt * (1 - A.fog(kz));
            for (let j = 0; j < 3; j++)
              for (let lv = 0; lv < 4; lv++) {
                const q = sp(cx - RW3 + RACK.w * (j + 0.3), -RACK.h * (0.2 + 0.2 * lv), Zr + RACK_DZ);
                ctx.fillRect(q[0], q[1], Math.max(1, 0.12 * RACK.w * s), Math.max(0.8, 0.012 * RACK.h * s));
              }
            ctx.globalAlpha = melt;
          }
        },
      });
    }
    for (const d of DESKS) {
      if (d.k !== r || Math.abs(d.deskX - e.X) > half) continue;
      its.push({
        X: d.deskX,
        draw: () => {
          box(d.deskX - DD2, d.deskX + DD2, -DESK.h, -DESK.h + 8, d.Z, d.Z + DESK.w, deskC);
          poly(monitorQuad(d.deskX, d.Z, d.side).map(([x, y, zz]) => sp(x, y, zz)), monC);
          const g = monitorQuad(d.deskX, d.Z, d.side, 9).map(([x, y, zz]) => sp(x, y, zz));
          ctx.globalAlpha = 0.25 * melt * glowOf(d.botZ - e.Ze) * (1 - A.fog(kz));
          poly(g, PAL.cream);
          ctx.globalAlpha = melt;
        },
      });
      its.push({
        X: d.botX,
        draw: () => {
          const c = sp(d.botX, -82, d.botZ);
          const w = 40 * s;
          ctx.fillStyle = chairC;
          ctx.fillRect(c[0] - w / 2, c[1] - w * 0.15, w, w * 0.3);
          const f = sp(d.botX, 0, d.botZ);
          blitBot(ctx, get, f[0], f[1], 240 * s, { variant: d.variant, view: d.side < 0 ? "right" : "left", fog: fig, alpha: melt });
          ctx.globalAlpha = melt;
        },
      });
    }
    its.sort((a, b) => Math.abs(b.X - e.X) - Math.abs(a.X - e.X));
    ctx.globalAlpha = melt;
    for (const it of its) it.draw();
    ctx.globalAlpha = 1;
  }
  if (clip) ctx.restore();
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
export const TimelineScene: React.FC<{ frame: number }> = ({ frame }) => {
  const reqs = useMemo(() => botCrowdReqs(["left", "right"]), []);
  const get = useBotSprites(reqs);
  const V = viewAt(frame);
  const { A, e, cam, inside, crane } = V;
  const open = doorOpen(frame);
  /** the eye is well inside by f118; from then on the front wall is never drawn (the crane backs out over its line) */
  const passed = frame >= 118;
  const outside = !passed && e.Ze < EZ0;
  /** while the eye is outside or in the doorway the hall is seen only through the opening */
  const doorway = !passed && e.Ze < 0;
  /** the shell is drawn until the eye is close enough that the opening covers the whole frame */
  const shell = outside && EZ0 - e.Ze > 150;
  const inner = doorQuad(V, 0);
  const xs = inner.map((q) => 540 + (q[0] - cam.cx) * cam.k);
  const cull: Cull = doorway ? { x0: Math.max(-40, Math.min(...xs)), x1: Math.min(1120, Math.max(...xs)) } : { x0: -40, x1: 1120 };
  const showHall = !outside || open > 0.002;
  const clipScreen = doorway ? inner.map((q) => [540 + (q[0] - cam.cx) * cam.k, 960 + (q[1] - cam.cy) * cam.k] as [number, number]) : null;
  const clipDef = (id: string) => (
    <defs>
      <clipPath id={id}>
        <path d={ptsOf(inner)} />
      </clipPath>
    </defs>
  );
  return (
    <AirStage v={A.v} bloom={0.22} shafts={lerp(1, 0.45, inside)}>
      <WorldSvg cam={cam}>
        {clipDef("tdc-inner-a")}
        {outside ? (
          <g>
            <OutdoorGround V={V} mat={MAT.ground} course={420} />
            <AirHorizonHazeW A={A} id="tdc-haze" />
            <GroundStrip V={V} X0={ROAD_X0} X1={ROAD_X1} z1={EZ0} hex={ROAD_HEX} />
            <GroundStrip V={V} X0={ROAD_X0 - 16} X1={ROAD_X0} z1={EZ0} hex={mixHex(MAT.stone.lit, ROAD_HEX, 0.2)} />
            <GroundStrip V={V} X0={ROAD_X1} X1={ROAD_X1 + 16} z1={EZ0} hex={mixHex(MAT.stone.mid, ROAD_HEX, 0.3)} />
            <RoadMarks V={V} />
            <EdgeLines V={V} />
            <RoadYears V={V} />
          </g>
        ) : null}
        {showHall ? (
          <g clipPath={doorway ? "url(#tdc-inner-a)" : undefined}>
            <HallBase V={V} />
          </g>
        ) : null}
      </WorldSvg>
      {showHall ? <FolkCanvas draw={(ctx) => drawFar(ctx, V, get, clipScreen)} /> : null}
      {crane > 0.01 ? (
        <WorldSvg cam={cam}>
          <AirHorizonHazeW A={A} id="tdc-haze-in" strength={0.8 * crane} below={260} />
        </WorldSvg>
      ) : null}
      <WorldSvg cam={cam}>
        {clipDef("tdc-inner-b")}
        {showHall ? (
          <g clipPath={doorway ? "url(#tdc-inner-b)" : undefined}>
            <NearHall V={V} frame={frame} cull={cull} />
          </g>
        ) : null}
        {doorway ? <Reveals V={V} a={SLAB_Z} b={0} /> : null}
        {outside ? <Slab V={V} open={open} /> : null}
        {!passed && e.Ze < SLAB_Z ? <Reveals V={V} a={EZ0} b={SLAB_Z} /> : null}
        {shell ? <Building V={V} uid="tdc-bld" /> : null}
      </WorldSvg>
    </AirStage>
  );
};

const TimelineToTheDataCenter: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <TimelineScene frame={frame} />;
};

export default TimelineToTheDataCenter;
