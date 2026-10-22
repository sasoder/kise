// ---------------------------------------------------------------------------
// marketWorkshopAir: the V3 MEDIUM of the shared world of cuts 20 (WeKeepThemApart) and 33 (SlavesInTheWorkshop):
// the pandemics clip's air (kyle-pandemics/pandemicAir.tsx, palette A, read only) wrapped round the London-depth stage
// of ./marketWorkshopWorld. Mood `day`, the light from the upper left; the sale half cooler and sunk, the workshop
// warmer (the kiln's glow, the orange bowls). Every object sits INSIDE the air and fogs by its distance from the eye.
//
// API
//   WORLD_AIR_SCENE         the AirScene (cast units: a man ~312 = 1.75 m)
//   worldAirOf(cam, frame, rest)  -> WorldAir for one frame: the AirView (horizon = the stage's VP row, the eye at
//                           height -DEPTH.eyeY, Dc in front of the front plane), plus the helpers the stage draws with:
//     .tone(hex, Z, h?)     a local colour fogged by the distance of depth Z (Dc + Z) at height h (up +)
//     .fog(Z) / .airHex(Z, h?) / .screenAir(worldY)   the fog amount, the air colour at that distance, the air behind a
//                           world row (the backdrop)
//     .ink(ink, Z)          a romeCast Ink fogged into the air at depth Z
//   AirVolBox / AirVolCyl   londonDepth's Box / Cylinder re-lit for the medium: soft form light, a cream rim on the top
//                           and upper-left edges, thin outlines in a darker local colour, no hatching, fogged by depth
//   AirFloorP               the flags: one continuous tone by distance (a little darker near), joints in a darker local
//                           colour fading with the fog, the far end dissolving into the air behind it
//   AirShadowP              a soft contact shadow in the medium's shadow colour, fading with the fog of its distance
//   MAT_*                   the local materials (before fog)
// Cut D renders the same AirStage with frame = C_END.frame + f and rest = C's rest, so its f0 is C's f210 exactly
// (shafts, motes and grain included).
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, fogHex, makeAirView, mixHex, rgbHex, type AirScene, type AirView, type Mat } from "../kyle-pandemics/pandemicAir";
import { perspective, type DepthOpts, type Persp } from "../kyle-london/londonDepth";
import type { Cam, P2 } from "../kits/maps/incaShared";
import type { Ink } from "./romeCast";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** any CSS colour the kits make (#rrggbb or rgb(r,g,b)) as #rrggbb */
export const asHex = (c: string) => {
  if (c.startsWith("#")) return c.length === 7 ? c : `#${c.slice(1).split("").map((x) => x + x).join("")}`;
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return c;
  return rgbHex(m[1].split(",").slice(0, 3).map((v) => parseFloat(v)) as [number, number, number]);
};
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

export const PAL = AIR.A;
/** the medium of this world (distances are the eye's: Dc + Z) */
export const WORLD_AIR_SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 650, fogVis: 3000, fogMax: 0.9, hLow: 0, hHigh: 1250, moteUnit: 178 };

// ----- local materials (before fog) -----
/** the workshop's flags: warm sand-umber (the medium's ground) */
export const MAT_FLOOR_R: Mat = { lit: "#8C7C5E", mid: "#75674E", dark: "#3A3128" };
/** the sale's flags: the same stone, cooler and sunk */
export const MAT_FLOOR_L: Mat = { lit: "#6D6A5C", mid: "#5A574B", dark: "#2E2C26" };
export const MAT_TIMBER: Mat = { lit: "#9A7A55", mid: "#6E5438", dark: "#3A2B1D" };
export const MAT_TIMBER_COLD: Mat = { lit: "#7A7264", mid: "#59524A", dark: "#302C27" };
export const MAT_STONE: Mat = { lit: "#9C8E7C", mid: "#6E6253", dark: "#3A3129" };
export const MAT_STONE_COLD: Mat = { lit: "#8E8C84", mid: "#66655E", dark: "#36352F" };
export const MAT_MARBLE_COLD: Mat = { lit: "#B9B4A6", mid: "#8E8A7F", dark: "#4E4B44" };
export const MAT_BRICK: Mat = { lit: "#A0684A", mid: "#7A4C36", dark: "#3E261C" };
/** a darker version of a local colour: the outline */
export const lineOf = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);

export type WorldAir = {
  v: AirView;
  cam: Cam;
  Dc: number;
  tone: (hex: string, Z: number, h?: number) => string;
  fog: (Z: number) => number;
  airHex: (Z: number, h?: number) => string;
  screenAir: (worldY: number) => string;
  ink: (ink: Ink, Z: number, extra?: number) => Ink;
  /** the PEOPLE's fog (and their stools and wheels): by depth behind the stage's front line, none in front of
   *  FIG_FOG.near, so local colour survives near (skin warm, blush and eyes crisp) and only the back rows sink */
  figFog: (Z: number) => number;
};
/** the people's fog by stage depth Z (not the eye's distance, which changes with the dolly) */
export const FIG_FOG = { near: 300, vis: 2200, max: 0.75 };

export const worldAirOf = (cam: Cam, frame: number, rest: Cam, depth: DepthOpts): WorldAir => {
  const P = perspective(cam, depth);
  const P0 = perspective(rest, depth);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const v = makeAirView({
    scene: { ...WORLD_AIR_SCENE, F: P.Dc * cam.k },
    frame,
    horizon: toSY(depth.eyeY),
    cam: { x: cam.cx, y: -depth.eyeY, z: -P.Dc },
    rest: { x: rest.cx, y: -depth.eyeY, z: -P0.Dc },
  });
  const Dc = P.Dc;
  const fog = (Z: number) => c01(v.fogAt(Dc + Z));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(Dc + Z, h));
  const tone = (hex: string, Z: number, h = 0) => fogHex(v, hex, Dc + Z, h);
  const ink = (k: Ink, Z: number, extra = 0) => {
    const a = airHex(Z, 150);
    const t = c01(fog(Z) + extra);
    return { main: mixHex(asHex(k.main), a, t), deep: mixHex(asHex(k.deep), a, t), hair: mixHex(asHex(k.hair), a, t) };
  };
  const figFog = (Z: number) => FIG_FOG.max * (1 - Math.exp(-Math.max(0, Z - FIG_FOG.near) / FIG_FOG.vis));
  return { v, cam, Dc, tone, fog, airHex, screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))), ink, figFog };
};

// ---------------------------------------------------------------------------
// VOLUMES
// ---------------------------------------------------------------------------
/** a box re-lit for the medium (londonDepth Box's geometry and face rules): the top lit, the left side lit, the front
 *  mid with a soft darkening to its foot, the right side and the underside dark; a cream rim on the top's front and left
 *  edges; thin outlines in a darker local colour; fogged by its depth. */
export const AirVolBox: React.FC<{ P: Persp; A: WorldAir; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; mat: Mat; uid: string; rim?: number; line?: number }> = ({ P, A, X0, X1, Y0, Y1, Z0, Z1, mat, uid, rim = 1, line = 1 }) => {
  const p = P.p;
  const Zm = (Z0 + Z1) / 2;
  const h = -(Y0 + Y1) / 2;
  const t = (hex: string, Z = Zm) => A.tone(hex, Z, h);
  const ln = t(lineOf(mat));
  const sw = 1.25 * P.r(Zm) * line;
  const fz = A.fog(Zm);
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  const face = (q: P2[], fill: string, key: string) => els.push(<path key={key} d={poly(q)} fill={fill} stroke={ln} strokeWidth={sw} strokeLinejoin="round" />);
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
            <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.28 * (1 - fz)} />
          </linearGradient>
        </defs>
        <path d={poly(fr)} fill={`url(#${uid}-fg)`} />
      </g>,
    );
  }
  // the rim: the lit top's front edge and its left edge (or the front's top edge when the top is unseen)
  const ra = (1 - fz) * 0.6 * rim;
  if (ra > 0.01) {
    let d = `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X1, Y0, Z0))}`;
    if (topSeen && X0 > vx - 1e9) d += `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X0, Y0, Z1))}`;
    els.push(<path key="rim" d={d} fill="none" stroke={PAL.cream} strokeWidth={1.3 * P.r(Z0)} strokeOpacity={ra} strokeLinecap="round" />);
  }
  return <g>{els}</g>;
};

/** a vertical cylinder re-lit for the medium: a soft horizontal form light (lit at the left, a core shadow at the
 *  right, a little reflected light from the medium at the far edge), the top lit when seen, a cream rim at the left */
export const AirVolCyl: React.FC<{ P: Persp; A: WorldAir; X: number; Z: number; R: number; Y0: number; Y1: number; mat: Mat; uid: string }> = ({ P, A, X, Z, R, Y0, Y1, mat, uid }) => {
  const ell = (Y: number) => {
    const c = P.p(X, Y, Z);
    return { c, rx: R * P.r(Z), ry: Math.abs((P.p(X, Y, Z - R)[1] - P.p(X, Y, Z + R)[1]) / 2) };
  };
  const tp = ell(Y0);
  const bt = ell(Y1);
  const h = -(Y0 + Y1) / 2;
  const t = (hex: string) => A.tone(hex, Z, h);
  const fz = A.fog(Z);
  const ln = t(lineOf(mat));
  const sw = 1.25 * P.r(Z);
  const body = `M${Pt([tp.c[0] - tp.rx, tp.c[1]])}L${Pt([bt.c[0] - bt.rx, bt.c[1]])}A${bt.rx.toFixed(2)},${bt.ry.toFixed(2)} 0 0 0 ${Pt([bt.c[0] + bt.rx, bt.c[1]])}L${Pt([tp.c[0] + tp.rx, tp.c[1]])}Z`;
  const x0 = tp.c[0] - tp.rx;
  const x1 = tp.c[0] + tp.rx;
  const shade = mixHex(mat.dark, PAL.shadow, 0.2);
  const refl = mixHex(mat.dark, A.airHex(Z, h), 0.45);
  const topSeen = Y0 > P.horizonY;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse" x1={x0.toFixed(2)} y1="0" x2={x1.toFixed(2)} y2="0">
          <stop offset="0" stopColor={t(mat.mid)} />
          <stop offset="0.22" stopColor={t(mat.lit)} />
          <stop offset="0.5" stopColor={t(mat.mid)} />
          <stop offset="0.82" stopColor={t(shade)} />
          <stop offset="1" stopColor={t(refl)} />
        </linearGradient>
      </defs>
      <path d={body} fill={`url(#${uid}-g)`} stroke={ln} strokeWidth={sw} strokeLinejoin="round" />
      {topSeen ? <ellipse cx={tp.c[0]} cy={tp.c[1]} rx={tp.rx} ry={tp.ry} fill={t(mat.lit)} stroke={ln} strokeWidth={sw} /> : null}
      <path d={`M${Pt([tp.c[0] - tp.rx * 0.93, tp.c[1]])}L${Pt([bt.c[0] - bt.rx * 0.93, bt.c[1]])}`} stroke={PAL.cream} strokeWidth={1.3 * P.r(Z)} strokeOpacity={0.4 * (1 - fz)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FLOOR
// ---------------------------------------------------------------------------
/** the flags: one continuous tone by distance (darker near, the far end dissolving into the air behind its row),
 *  joints in a darker local colour fading with the fog; `sink` darkens the half (the sale) */
export const AirFloorP: React.FC<{ P: Persp; A: WorldAir; x0: number; x1: number; z0: number; z1: number; mat: Mat; course: number; uid: string; jointAmt?: number; meltFar?: boolean }> = ({ P, A, x0, x1, z0, z1, mat, course, jointAmt = 1, meltFar = true }) => {
  const zA = Math.max(z0, P.zNear);
  // the far edge melts into the air behind it (over its last ~35 %)
  const melt = (Z: number) => !meltFar ? 0 : Math.pow(c01((Z - (z1 - 0.38 * (z1 - z0))) / (0.38 * (z1 - z0))), 1.3);
  const colAt = (Z: number) => {
    const near = c01(1 - Z / 500);
    const local = mixHex(mixHex(mat.lit, mat.mid, 0.25), mat.dark, 0.18 * near);
    const fogged = A.tone(local, Z, 0);
    const wy = P.p(0, 0, Z)[1];
    return mixHex(fogged, A.screenAir(wy), melt(Z));
  };
  const N = 26;
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const za = mix(zA, z1, Math.pow(i / N, 1.6));
    const zb = mix(zA, z1, Math.pow((i + 1) / N, 1.6));
    const zb2 = i < N - 1 ? zb + (zb - za) * 0.15 : zb;
    bands.push(<path key={i} d={poly([P.p(x0, 0, za), P.p(x1, 0, za), P.p(x1, 0, zb2), P.p(x0, 0, zb2)])} fill={colAt((za + zb) / 2)} />);
  }
  // the joints along Z (to the VP) and across (courses), by depth pieces
  const step = course * 0.7;
  const pieces = 16;
  const zAt = (i: number) => mix(zA, z1, Math.pow(i / pieces, 1.5));
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    const a = (1 - A.fog(zm)) * (1 - melt(zm)) * jointAmt;
    if (a < 0.03) continue;
    let d = "";
    for (let X = Math.ceil(x0 / step) * step; X <= x1; X += step) if (X > x0 + 1 && X < x1 - 1) d += `M${Pt(P.p(X, 0, za))}L${Pt(P.p(X, 0, zb))}`;
    // the course joints inside this piece
    let n = 0;
    for (let X = Math.floor(x0 / step) * step; X < x1; X += step, n++) {
      const off = (((Math.round(X / step) % 2) + 2) % 2) * course * 0.5;
      for (let Z = Math.floor((za - off) / course) * course + off; Z < zb; Z += course) {
        if (Z < za) continue;
        const xa = Math.max(x0, X);
        const xb = Math.min(x1, X + step);
        if (xb > xa) d += `M${Pt(P.p(xa, 0, Z))}L${Pt(P.p(xb, 0, Z))}`;
      }
    }
    lines.push(<path key={`j${i}`} d={d} fill="none" stroke={A.tone(lineOf(mat), zm)} strokeWidth={1.3 * P.r(zm)} strokeOpacity={0.5 * a} />);
  }
  return (
    <g>
      {bands}
      {lines}
    </g>
  );
};

// ---------------------------------------------------------------------------
// SHADOWS
// ---------------------------------------------------------------------------
/** a soft contact shadow on the floor (or a tread at Y) in the medium's shadow colour, offset to the lower right */
export const AirShadowP: React.FC<{ P: Persp; A: WorldAir; X: number; Z: number; w?: number; d?: number; uid: string; amt?: number; Y?: number }> = ({ P, A, X, Z, w = 74, d = 40, uid, amt = 1, Y = 0 }) => {
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.25 * d;
  const c = P.p(Xc, Y, Zc);
  const rx = w * P.r(Zc);
  const ry = Math.max(1, (P.p(Xc, Y, Zc - d)[1] - P.p(Xc, Y, Zc + d)[1]) / 2);
  const a = amt * (1 - A.fog(Z));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-as`}>
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.62 * a} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.36 * a} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-as)`} />
    </g>
  );
};
