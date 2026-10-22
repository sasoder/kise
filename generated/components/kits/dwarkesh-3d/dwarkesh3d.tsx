// ---------------------------------------------------------------------------
// dwarkesh3d: THE KIT of the Dwarkesh 3D style (styles/dwarkesh-3d.md). One import for a cut, from the clip folder
// as ../kits/dwarkesh-3d/dwarkesh3d: { AirStage, airWorldOf, AirFloor, AirBox, RomeFolk, ... }.
// Read-only: additions go through the director. The shared pieces are RE-EXPORTED from where they live (their files
// are unchanged; delivered cuts import them directly). The air-lit volumes below are COPIES, consolidated from the
// Rome clip's three cut-local medium files (marketWorkshopAir, slavesTurnTheCraneAir, muscleOrMachineAir), which stay.
//
// API (units: the cast's, a man ~312 tall = 1.75 m, U = 178 per metre; X across, Y height with the floor Y = 0 and
// up - Y, Z depth behind the front plane; draw the world inside <WorldSvg cam>, whose world px are the front plane's)
//
// RE-EXPORTED
//   the medium (kyle-pandemics/pandemicAir, flat):  AIR (palette A = the style's), MOODS, makeAirView, AirStage,
//     AirHorizonHaze, AirGradient, InAir, AirContactShadow, AirRim, fogHex / fogMix / fogRgb / airAt / fogAt,
//     formTone, airThree / fogExp2 (three.js), mixHex / hexRgb / rgbHex / mixRgb / rgba / c01 / lerp / smoothstep,
//     types AirScene, AirView, AirMood, Mat, RGB. Its header is the medium's contract.
//   the depth kit (kyle-london/londonDepth):  perspective, placeAtRef, depthTint, types DepthOpts, Persp; the whole
//     module as `Depth` (Depth.Box / Depth.Cylinder / Depth.GroundPlane are the paper-page versions: use the Air* below)
//   the camera (kits/maps/incaShared):  WorldSvg, makeCamera, swayCam, pchip, types Cam, CamKey, P2
//   the casts, as namespaces (each header is its API):
//     RomeFolk      kyle-rome-slavery/romeFolk: Slave / Freeman / Dominus / Overseer, POSES, idle, walkPose, gripTo,
//                   romeAnchors, props (Amphora, Sack, Basket, Chain, CoinHeap, Couch, Stool, PotterWheel, RotaryQuern,
//                   Hammer, Pick, Rod), FolkFog, RomeContactShadow, DEAD
//     PandemicFolk  kyle-pandemics/pandemicFolk: FolkWorker, stand / slack / turn / reach / breathe, workerAnchors,
//                   WORKER_INKS, WORKER_UNITS, crowds (crowdSpriteReq, useFolkSprites, blitFolk, FolkCanvas), sway, fall
//     Paint         kyle-pandemics/pandemicFolkPaint: FolkPaint, folkTexDefs, PAINT, mixC, sprites (the paint every
//                   new cast imports, so every clip is painted by the same hand)
//
// NEW HERE
//   ACCENT / ACCENT_DEEP / DEAD / ORANGE_LINE   #FFB000 / #D98A0C / #8A7B62 / #8A4A0E (an orange object's outline)
//   MAT.{ground, stone, timber, marble, brick, iron, hemp, orange}   local materials {lit, mid, dark} before fog
//   lineOf(mat)            the outline: a darker version of the material's own colour
//   AIR_SCENE_EYE / AIR_SCENE_DEPTH   the AirScenes (palette A, mood day) for the two fog modes below
//   airWorldOf({ cam, rest, depth, frame, scene?, fogBy?, figFog? }) -> AirWorld: the medium of one frame on a
//       londonDepth camera. cam = the 2D camera now (after swayCam), rest = the cut's f0 camera (motes and shafts
//       parallax against it), depth = { eyeY, dRef, kRef, dolly }. fogBy "eye" (default): things fog by the eye's
//       distance Dc + Z (streets, rooms, dollies); "depth": by world depth Z only (crane-ups and pull-backs, so a high
//       wide does not bury the payoff). scene: a Partial<AirScene> over the mode's default (mood, eyeT, fog...).
//     AirWorld: .v (the AirView for <AirStage v>), .P (the Persp), .cam, .Dc, .k
//       .fog(Z) / .airHex(Z, h?) / .tone(hex, Z, h?)   the fog amount, the air colour, a local colour fogged (h = height
//                             up +, world units); .toneO(hex, Z, h?) orange takes half the fog (the one glowing material)
//       .screenAir(worldY)    the air behind a 2D world row (the backdrop)
//       .figFog(Z)            the PEOPLE's fog by stage depth: none in front of figFog.near (local colour survives near)
//       .folkFog(Z, feetH?)   a RomeFolk `fog` prop: the air at mid-body height, by figFog
//       .workerInks(Z, feetH?)  PandemicFolk.FolkWorker `inks`, fogged the same way (orange kept)
//       .lw(base?)            a line width (world units) that stays even on screen under the zoom (base / k^0.6)
//   workerScale(castScale) the FolkWorker scale that stands him as tall as a RomeFolk man at castScale (cap included)
//   <AirFloor A x0 x1 z0 z1 mat? course? plank? lw? jointAmt? melt? />   the ground: one continuous tone by distance
//       (a little darker near), joints in a darker local colour fading with the fog, the far end (melt, a fraction of
//       z1 - z0) melting into the air behind its row
//   <AirHorizonHazeW A below? strength? id />   the horizon as a soft zone, in world units: paint over the GROUND only
//   <AirBox A X0 X1 Y0 Y1 Z0 Z1 mat uid rim? lw? orange? />   a box (Y0 top < Y1 bottom, Z0 front): top and left side
//       lit, front mid with a soft darkening to its foot, right side and underside dark, a cream rim on the top's front
//       and left edges, thin outlines in a darker local colour, fogged by its depth
//   <AirCyl A X Z R Y0 Y1 mat uid lw? joints? flutes? orange? />   a vertical cylinder: soft horizontal form light,
//       a core shadow at the right, reflected air at the far edge, drum seams (joints: heights), flutes, a cream rim
//   <AirShadow A X Z w? d? Y? amt? uid />   a soft contact shadow (the floor, or a surface at height Y) in the air's
//       shadow colour, offset to the lower right, fading with the fog of its depth
//
// A FIGURE ON THE FLOOR: const { at, scale } = A.P.at(X, Z);
//   <AirShadow A={A} X={X} Z={Z} w={62} d={30} uid="s1" amt={0.8} />
//   <RomeFolk.Freeman pose={...} at={at} scale={scale} uid="f1" fog={A.folkFog(Z)} unitPx={A.k} />
// Template: scripts/templates/3d.tsx (bun run cut <Name> --clip <slug> --style 3d).
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, c01, fogHex, lerp, makeAirView, mixHex, rgbHex, type AirScene, type AirView, type Mat } from "../../kyle-pandemics/pandemicAir";
import { WORKER_INKS } from "../../kyle-pandemics/pandemicFolk";
import { perspective, type DepthOpts, type Persp } from "../../kyle-london/londonDepth";
import type { FolkFog } from "../../kyle-rome-slavery/romeFolk";
import type { Cam, P2 } from "../maps/incaShared";

// ---- re-exports ---------------------------------------------------------------------------------------------------
export * from "../../kyle-pandemics/pandemicAir";
export { perspective, placeAtRef, depthTint, type DepthOpts, type Persp } from "../../kyle-london/londonDepth";
export * as Depth from "../../kyle-london/londonDepth";
export { WorldSvg, makeCamera, swayCam, pchip, type Cam, type CamKey, type P2 } from "../maps/incaShared";
export * as RomeFolk from "../../kyle-rome-slavery/romeFolk";
export * as PandemicFolk from "../../kyle-pandemics/pandemicFolk";
export * as Paint from "../../kyle-pandemics/pandemicFolkPaint";

// ---- constants and materials --------------------------------------------------------------------------------------
const PAL = AIR.A;
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DEAD = "#8A7B62";
export const ORANGE_LINE = "#8A4A0E";
/** local materials (before fog): the medium's ground and stone, and the Rome clip's re-lit set */
export const MAT = {
  ground: PAL.ground,
  stone: PAL.stone,
  timber: { lit: "#A38059", mid: "#73583B", dark: "#3A2B1D" },
  marble: { lit: "#EFE5D0", mid: "#D3C5A6", dark: "#8E8470" },
  brick: { lit: "#A0684A", mid: "#7A4C36", dark: "#3E261C" },
  iron: { lit: "#8A9396", mid: "#5A6266", dark: "#30363A" },
  hemp: { lit: "#DCCDA4", mid: "#BCA97E", dark: "#7E6E52" },
  orange: { lit: "#FFB000", mid: "#D98A0C", dark: "#9A5C07" },
} satisfies Record<string, Mat>;
/** a darker version of a local colour: the outline */
export const lineOf = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);

const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ===================================================================================================================
// THE AIR ON A DEPTH CAMERA
// ===================================================================================================================
/** fog by the eye's distance (Dc + Z): streets, rooms, dollies (marketWorkshopAir) */
export const AIR_SCENE_EYE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 650, fogVis: 3000, fogMax: 0.9, hLow: 0, hHigh: 1250, moteUnit: 178 };
/** fog by world depth Z: crane-ups and pull-backs (slavesTurnTheCraneAir) */
export const AIR_SCENE_DEPTH: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 0, fogVis: 2200, fogMax: 0.9, hLow: 0, hHigh: 2300, moteUnit: 178 };
/** the people's fog by stage depth: none nearer than `near`, so near faces keep their local colour */
export const FIG_FOG = { near: 300, vis: 2200, max: 0.75 };

export type AirWorld = {
  v: AirView;
  P: Persp;
  cam: Cam;
  Dc: number;
  k: number;
  fog: (Z: number) => number;
  airHex: (Z: number, h?: number) => string;
  tone: (hex: string, Z: number, h?: number) => string;
  toneO: (hex: string, Z: number, h?: number) => string;
  screenAir: (worldY: number) => string;
  figFog: (Z: number) => number;
  folkFog: (Z: number, feetH?: number) => FolkFog;
  workerInks: (Z: number, feetH?: number) => typeof WORKER_INKS;
  lw: (base?: number) => number;
};

export const airWorldOf = (o: {
  cam: Cam;
  rest: Cam;
  depth: DepthOpts;
  frame: number;
  scene?: Partial<AirScene>;
  fogBy?: "eye" | "depth";
  figFog?: { near: number; vis: number; max: number };
}): AirWorld => {
  const { cam, rest, depth, frame } = o;
  const byDepth = o.fogBy === "depth";
  const P = perspective(cam, depth);
  const P0 = perspective(rest, depth);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const base = byDepth ? AIR_SCENE_DEPTH : AIR_SCENE_EYE;
  const v = makeAirView({
    scene: { ...base, ...o.scene, F: P.Dc * cam.k },
    frame,
    horizon: toSY(depth.eyeY),
    cam: { x: cam.cx, y: -depth.eyeY, z: -P.Dc },
    rest: { x: rest.cx, y: -depth.eyeY, z: -P0.Dc },
  });
  const Dc = P.Dc;
  const dist = (Z: number) => (byDepth ? Z : Dc + Z);
  const fog = (Z: number) => c01(v.fogAt(dist(Z)));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(dist(Z), h));
  const tone = (hex: string, Z: number, h = 0) => fogHex(v, hex, dist(Z), h);
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.5 * fog(Z));
  const ff = o.figFog ?? FIG_FOG;
  const figFog = (Z: number) => ff.max * (1 - Math.exp(-Math.max(0, Z - ff.near) / ff.vis));
  const folkFog = (Z: number, feetH = 0): FolkFog => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) });
  const workerInks = (Z: number, feetH = 0) => {
    const air = airHex(Z, feetH + 160);
    const t = figFog(Z);
    return Object.fromEntries(Object.entries(WORKER_INKS).map(([key, c]) => [key, key === "orange" ? c : mixHex(c, air, t)])) as typeof WORKER_INKS;
  };
  return { v, P, cam, Dc, k: cam.k, fog, airHex, tone, toneO, screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))), figFog, folkFog, workerInks, lw: (b = 1.1) => b / Math.pow(cam.k, 0.6) };
};
/** the pandemics Worker is 513 units to his cap, a RomeFolk man 312 to his skull (~325 with a cap) */
export const workerScale = (castScale: number) => (castScale * 325) / 513;

// ===================================================================================================================
// THE GROUND
// ===================================================================================================================
export const AirFloor: React.FC<{ A: AirWorld; x0: number; x1: number; z0: number; z1: number; mat?: Mat; course?: number; plank?: number; lw?: number; jointAmt?: number; melt?: number }> = ({
  A,
  x0,
  x1,
  z0,
  z1,
  mat = MAT.ground,
  course = 300,
  plank,
  lw = 1.2,
  jointAmt = 1,
  melt = 0.42,
}) => {
  const P = A.P;
  const zA = Math.max(z0, P.zNear);
  const mf = melt * (z1 - z0);
  const meltAt = (Z: number) => (melt <= 0 ? 0 : Math.pow(c01((Z - (z1 - mf)) / mf), 1.3));
  const colAt = (Z: number) => {
    const near = c01(1 - (Z + 400) / 900);
    const local = mixHex(mixHex(mat.lit, mat.mid, 0.3), mat.dark, 0.2 * near);
    return mixHex(A.tone(local, Z, 0), A.screenAir(P.p(0, 0, Z)[1]), meltAt(Z));
  };
  const N = 28;
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const za = lerp(zA, z1, Math.pow(i / N, 1.6));
    const zb = lerp(zA, z1, Math.pow((i + 1) / N, 1.6));
    const zb2 = i < N - 1 ? zb + (zb - za) * 0.15 : zb;
    bands.push(<path key={i} d={poly([P.p(x0, 0, za), P.p(x1, 0, za), P.p(x1, 0, zb2), P.p(x0, 0, zb2)])} fill={colAt((za + zb) / 2)} />);
  }
  // the joints along Z (to the VP) and across (courses, staggered), by depth pieces that fade with the fog
  const step = plank ?? course * 0.7;
  const pieces = 16;
  const zAt = (i: number) => lerp(zA, z1, Math.pow(i / pieces, 1.5));
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    const a = (1 - A.fog(zm)) * (1 - meltAt(zm)) * jointAmt;
    if (a < 0.03) continue;
    let d = "";
    for (let X = Math.ceil(x0 / step) * step; X <= x1; X += step) if (X > x0 + 1 && X < x1 - 1) d += `M${Pt(P.p(X, 0, za))}L${Pt(P.p(X, 0, zb))}`;
    for (let X = Math.floor(x0 / step) * step; X < x1; X += step) {
      const off = (((Math.round(X / step) % 2) + 2) % 2) * course * 0.5;
      for (let Z = Math.floor((za - off) / course) * course + off; Z < zb; Z += course) {
        if (Z < za) continue;
        const xa = Math.max(x0, X);
        const xb = Math.min(x1, X + step);
        if (xb > xa) d += `M${Pt(P.p(xa, 0, Z))}L${Pt(P.p(xb, 0, Z))}`;
      }
    }
    lines.push(<path key={`j${i}`} d={d} fill="none" stroke={A.tone(lineOf(mat), zm, 0)} strokeWidth={lw * P.r(zm)} strokeOpacity={0.45 * a} />);
  }
  return (
    <g>
      {bands}
      {lines}
    </g>
  );
};

/** the horizon as a soft zone over the ground only (pandemicAir's AirHorizonHaze in world units) */
export const AirHorizonHazeW: React.FC<{ A: AirWorld; below?: number; strength?: number; id: string }> = ({ A, below = 190, strength = 1, id }) => {
  const { cam, P } = A;
  const y0 = P.opts.eyeY - 2 / cam.k;
  const hgt = below / cam.k;
  const c = A.screenAir(P.opts.eyeY + 6 / cam.k);
  const x0 = cam.cx - 700 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={(y0 + hgt).toFixed(2)}>
          {[0, 0.2, 0.45, 0.7, 1].map((s) => (
            <stop key={s} offset={s} stopColor={c} stopOpacity={(strength * Math.pow(1 - s, 1.8)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={y0.toFixed(2)} width={(1400 / cam.k).toFixed(2)} height={hgt.toFixed(2)} fill={`url(#${id})`} />
    </g>
  );
};

// ===================================================================================================================
// VOLUMES (londonDepth Box / Cylinder geometry and face rules, re-lit for the medium)
// ===================================================================================================================
export const AirBox: React.FC<{ A: AirWorld; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; mat: Mat; uid: string; rim?: number; lw?: number; orange?: boolean }> = ({
  A,
  X0,
  X1,
  Y0,
  Y1,
  Z0,
  Z1,
  mat,
  uid,
  rim = 1,
  lw,
  orange,
}) => {
  const P = A.P;
  const p = P.p;
  const w = lw ?? A.lw();
  const Zm = (Z0 + Z1) / 2;
  const h = -(Y0 + Y1) / 2;
  const t = (hex: string, Z = Zm) => (orange ? A.toneO(hex, Z, h) : A.tone(hex, Z, h));
  const ln = t(orange ? ORANGE_LINE : lineOf(mat));
  const fz = A.fog(Zm);
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  const face = (q: P2[], fill: string, key: string) => els.push(<path key={key} d={poly(q)} fill={fill} stroke={ln} strokeWidth={w} strokeLinejoin="round" />);
  const shadeDark = mixHex(mat.dark, PAL.shadow, 0.2);
  if (Y1 < P.horizonY) face([p(X0, Y1, Z0), p(X1, Y1, Z0), p(X1, Y1, Z1), p(X0, Y1, Z1)], t(shadeDark), "bt");
  if (X0 > vx) face([p(X0, Y0, Z0), p(X0, Y0, Z1), p(X0, Y1, Z1), p(X0, Y1, Z0)], t(mixHex(mat.lit, mat.mid, 0.35)), "lf");
  if (X1 < vx) face([p(X1, Y0, Z0), p(X1, Y0, Z1), p(X1, Y1, Z1), p(X1, Y1, Z0)], t(shadeDark), "rt");
  const topSeen = Y0 > P.horizonY;
  if (topSeen) face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y0, Z1), p(X0, Y0, Z1)], t(mat.lit), "tp");
  const fr: P2[] = [p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y1, Z0), p(X0, Y1, Z0)];
  face(fr, t(mat.mid, Z0), "fr");
  // the front's soft occlusion toward its foot (light from above)
  const ya = fr[0][1];
  const yb = fr[2][1];
  if (yb - ya > 2) {
    els.push(
      <g key="frg">
        <defs>
          <linearGradient id={`${uid}-fg`} gradientUnits="userSpaceOnUse" x1="0" y1={ya.toFixed(2)} x2="0" y2={yb.toFixed(2)}>
            <stop offset="0" stopColor={PAL.cream} stopOpacity={0.1 * (1 - fz)} />
            <stop offset="0.35" stopColor={PAL.shadow} stopOpacity={0} />
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.26 * (1 - fz)} />
          </linearGradient>
        </defs>
        <path d={poly(fr)} fill={`url(#${uid}-fg)`} />
      </g>,
    );
  }
  // the rim: the top's front and left edges (the front's top and left edges when the top is unseen)
  const ra = (1 - fz) * 0.6 * rim;
  if (ra > 0.01) {
    let d = `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X1, Y0, Z0))}`;
    if (topSeen) d += `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X0, Y0, Z1))}`;
    else d += `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X0, Y1, Z0))}`;
    els.push(<path key="rim" d={d} fill="none" stroke={PAL.cream} strokeWidth={w * 1.1} strokeOpacity={ra} strokeLinecap="round" />);
  }
  return <g>{els}</g>;
};

export const AirCyl: React.FC<{ A: AirWorld; X: number; Z: number; R: number; Y0: number; Y1: number; mat: Mat; uid: string; lw?: number; joints?: number[]; flutes?: number; orange?: boolean }> = ({
  A,
  X,
  Z,
  R,
  Y0,
  Y1,
  mat,
  uid,
  lw,
  joints = [],
  flutes = 0,
  orange,
}) => {
  const P = A.P;
  const w = lw ?? A.lw();
  const ell = (Y: number) => {
    const c = P.p(X, Y, Z);
    return { c, rx: R * P.r(Z), ry: Math.abs((P.p(X, Y, Z - R)[1] - P.p(X, Y, Z + R)[1]) / 2) };
  };
  const tp = ell(Y0);
  const bt = ell(Y1);
  const h = -(Y0 + Y1) / 2;
  const t = (hex: string) => (orange ? A.toneO(hex, Z, h) : A.tone(hex, Z, h));
  const fz = A.fog(Z);
  const ln = t(orange ? ORANGE_LINE : lineOf(mat));
  const body = `M${Pt([tp.c[0] - tp.rx, tp.c[1]])}L${Pt([bt.c[0] - bt.rx, bt.c[1]])}A${bt.rx.toFixed(2)},${bt.ry.toFixed(2)} 0 0 0 ${Pt([bt.c[0] + bt.rx, bt.c[1]])}L${Pt([tp.c[0] + tp.rx, tp.c[1]])}Z`;
  const x0 = tp.c[0] - tp.rx;
  const x1 = tp.c[0] + tp.rx;
  const shade = mixHex(mat.dark, PAL.shadow, 0.15);
  const refl = mixHex(mat.mid, A.airHex(Z, h), 0.4);
  const topSeen = Y0 > P.horizonY;
  // the drum seams: the front half of the ellipse at each joint height
  const seam = joints
    .map((Y) => {
      const e = ell(Y);
      const below = Y > P.horizonY;
      return `M${Pt([e.c[0] - e.rx, e.c[1]])}A${e.rx.toFixed(2)},${e.ry.toFixed(2)} 0 0 ${below ? 0 : 1} ${Pt([e.c[0] + e.rx, e.c[1]])}`;
    })
    .join("");
  let fl = "";
  for (let i = 0; i < flutes; i++) {
    const a = ((-70 + (140 * i) / Math.max(1, flutes - 1)) * Math.PI) / 180;
    const fx = Math.sin(a);
    fl += `M${Pt([tp.c[0] + tp.rx * 0.97 * fx, tp.c[1] + 3 * P.r(Z)])}L${Pt([bt.c[0] + bt.rx * 0.97 * fx, bt.c[1] - 3 * P.r(Z)])}`;
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse" x1={x0.toFixed(2)} y1="0" x2={x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor={t(mat.mid)} />
          <stop offset="0.24" stopColor={t(mat.lit)} />
          <stop offset="0.52" stopColor={t(mixHex(mat.lit, mat.mid, 0.6))} />
          <stop offset="0.84" stopColor={t(shade)} />
          <stop offset="1" stopColor={t(refl)} />
        </linearGradient>
      </defs>
      <path d={body} fill={`url(#${uid}-g)`} stroke={ln} strokeWidth={w} strokeLinejoin="round" />
      {fl ? <path d={fl} stroke={t(mat.dark)} strokeWidth={w * 0.7} strokeOpacity={0.22} /> : null}
      {seam ? <path d={seam} fill="none" stroke={ln} strokeWidth={w * 0.75} strokeOpacity={0.55} /> : null}
      {topSeen ? <ellipse cx={tp.c[0]} cy={tp.c[1]} rx={tp.rx} ry={tp.ry} fill={t(mat.lit)} stroke={ln} strokeWidth={w} /> : null}
      <path d={`M${Pt([tp.c[0] - tp.rx * 0.93, tp.c[1]])}L${Pt([bt.c[0] - bt.rx * 0.93, bt.c[1]])}`} stroke={PAL.cream} strokeWidth={w * 1.2} strokeOpacity={0.45 * (1 - fz)} />
    </g>
  );
};

// ===================================================================================================================
// SHADOWS
// ===================================================================================================================
export const AirShadow: React.FC<{ A: AirWorld; X: number; Z: number; w?: number; d?: number; uid: string; amt?: number; Y?: number }> = ({ A, X, Z, w = 74, d = 40, uid, amt = 1, Y = 0 }) => {
  const P = A.P;
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.25 * d;
  const c = P.p(Xc, Y, Zc);
  const rx = w * P.r(Zc);
  const ry = Math.max(1, Math.abs(P.p(Xc, Y, Zc - d)[1] - P.p(Xc, Y, Zc + d)[1]) / 2);
  const a = amt * (1 - A.fog(Z));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-as`}>
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.62 * a} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.34 * a} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-as)`} />
    </g>
  );
};
