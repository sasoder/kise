// ---------------------------------------------------------------------------
// slavesTurnTheCraneAir: the V3 MEDIUM of SlavesTurnTheCrane (kyle-rome-slavery, cut 14): the pandemics clip's air
// (kyle-pandemics/pandemicAir.tsx, palette A, mood day; read only) wrapped round the crane's London-depth world. The
// light from the upper left; the orange treadwheel the one warm, faintly glowing material; marble cream, timber umber.
//
// A CRANE CUT (AIR_READY: "fog by depth behind the subject's front line, not the eye's distance, or a high wide buries
// the payoff"): the fog is a function of the world depth Z (0 = the front plane), so the pull-back to the wide does
// not sink the crane; things fog toward the air AT THEIR HEIGHT.
// THE HEIGHT RAMP: the air is dense (petrol) low and light (sage-teal) high, by WORLD height: the backdrop row shows
// the air at the height that row sees at the backdrop depth ZB, so the close-up on the walkers (1-3 m up) sits in
// the denser low air, and the crane-up climbs into the light, the wide showing the whole ramp.
//
// API
//   CRANE_AIR_SCENE                   the AirScene (cast units: U = 177 per metre)
//   craneAirOf(cam, P, frame, rest)   -> CraneAir: the AirView (its airAtScreen / airAt replaced by the height ramp) and
//     .fog(Z) / .airHex(h) / .tone(hex, Z, h) / .toneO(hex, Z, h) (orange: half the fog) / .screenAir(worldY)
//     .figFog(Z) the people's fog (none in front of FIG_FOG.near: local colour survives near)
//   MAT_*  local materials (before fog); lineOf(mat) the outline (a darker local colour)
//   AirBox / AirCyl / AirFloor / AirShadow   londonDepth's Box / Cylinder / GroundPlane / ContactShadow re-lit for the
//                                     medium (as ./marketWorkshopAir, copied: soft form light, a cream rim on the top and
//                                     upper-left edges, thin outlines in a darker local colour, no hatching, fogged)
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, airRamp, hexRgb, makeAirView, mixHex, rgbHex, smoothstep, type AirScene, type AirView, type Mat, type RGB } from "../kyle-pandemics/pandemicAir";
import type { Persp } from "../kyle-london/londonDepth";
import type { Cam, P2 } from "../kits/maps/incaShared";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

export const PAL = AIR.A;
/** the medium (distances = world depth Z; heights up +) */
export const CRANE_AIR_SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 0, fogVis: 2200, fogMax: 0.9, hLow: 0, hHigh: 2300, moteUnit: 177 };
/** the height ramp: ramp t from the dense low air (ground) to the light high air (the jib's head and above) */
export const RAMP = { tLow: 0.36, h0: -150, h1: 4300, gamma: 1.7, ZB: 2600 };
/** the ramp's colours change fastest at small t (the light end), so t falls with a power curve: the light air opens
 *  gradually over the height, no band */
export const tOfHeight = (h: number) => RAMP.tLow * Math.pow(1 - c01((h - RAMP.h0) / (RAMP.h1 - RAMP.h0)), RAMP.gamma);
/** the people's fog by depth Z */
export const FIG_FOG = { near: 120, vis: 3000, max: 0.75 };

// ----- local materials (before fog) -----
export const MAT_TIMBER: Mat = { lit: "#A38059", mid: "#73583B", dark: "#3A2B1D" };
export const MAT_STONE: Mat = { lit: "#A99B85", mid: "#7C6F5D", dark: "#3E352C" };
export const MAT_MARBLE: Mat = { lit: "#EFE5D0", mid: "#D3C5A6", dark: "#8E8470" };
export const MAT_ORANGE: Mat = { lit: "#FFB000", mid: "#D98A0C", dark: "#9A5C07" };
export const MAT_IRON: Mat = { lit: "#8A9396", mid: "#5A6266", dark: "#30363A" };
export const MAT_HEMP: Mat = { lit: "#DCCDA4", mid: "#BCA97E", dark: "#7E6E52" };
export const MAT_GROUND: Mat = PAL.ground;
export const ORANGE_LINE = "#8A4A0E";
/** a darker version of a local colour: the outline */
export const lineOf = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);

export type CraneAir = {
  v: AirView;
  cam: Cam;
  P: Persp;
  fog: (Z: number) => number;
  airHex: (h: number) => string;
  tone: (hex: string, Z: number, h: number) => string;
  /** orange: the one warm glowing material takes only part of the fog */
  toneO: (hex: string, Z: number, h: number) => string;
  screenAir: (worldY: number) => string;
  figFog: (Z: number) => number;
};

export const craneAirOf = (cam: Cam, P: Persp, frame: number, rest: { cam: Cam; P: Persp }): CraneAir => {
  const eyeY = P.opts.eyeY;
  const horizon = 960 + (eyeY - cam.cy) * cam.k;
  const base = makeAirView({
    scene: { ...CRANE_AIR_SCENE, F: P.Dc * cam.k },
    frame,
    horizon,
    cam: { x: cam.cx, y: -cam.cy, z: -P.Dc },
    rest: { x: rest.cam.cx, y: -rest.cam.cy, z: -rest.P.Dc },
  });
  const rB = P.r(RAMP.ZB);
  /** the world height the backdrop shows at a screen row (at depth ZB) */
  const hAtScreen = (sy: number) => {
    const wy = cam.cy + (sy - 960) / cam.k;
    return -(eyeY + (wy - eyeY) / rB);
  };
  const airH = (h: number): RGB => airRamp("A", tOfHeight(h));
  const v: AirView = { ...base, airAtScreen: (sy: number) => airH(hAtScreen(sy)), airAt: (_d: number, h = 0) => airH(h) };
  const fog = (Z: number) => c01(base.fogAt(Z));
  const airHex = (h: number) => rgbHex(airH(h));
  const tone = (hex: string, Z: number, h: number) => mixHex(hex, airHex(h), fog(Z));
  const toneO = (hex: string, Z: number, h: number) => mixHex(hex, airHex(h), 0.45 * fog(Z));
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const figFog = (Z: number) => FIG_FOG.max * (1 - Math.exp(-Math.max(0, Z - FIG_FOG.near) / FIG_FOG.vis));
  return { v, cam, P, fog, airHex, tone, toneO, screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))), figFog };
};

/** soft form light on a material: ndl (-1..1) -> a colour (pandemicAir.formTone's curve) */
export const formMat = (m: Mat, ndl: number, sink = 0.22) => {
  const t = smoothstep(-0.45, 0.85, ndl);
  const shade = mixHex(m.dark, PAL.shadow, sink);
  return t < 0.5 ? mixHex(shade, m.mid, t * 2) : mixHex(m.mid, m.lit, (t - 0.5) * 2);
};
export const rgbOf = (hex: string) => hexRgb(hex);

// ---------------------------------------------------------------------------
// VOLUMES
// ---------------------------------------------------------------------------
/** a box re-lit for the medium (londonDepth Box's geometry and face rules) */
export const AirBox: React.FC<{ A: CraneAir; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; mat: Mat; uid: string; rim?: number; lw: number; orange?: boolean }> = ({ A, X0, X1, Y0, Y1, Z0, Z1, mat, uid, rim = 1, lw, orange }) => {
  const P = A.P;
  const p = P.p;
  const Zm = (Z0 + Z1) / 2;
  const h = -(Y0 + Y1) / 2;
  const t = (hex: string, Z = Zm) => (orange ? A.toneO(hex, Z, h) : A.tone(hex, Z, h));
  const ln = t(orange ? ORANGE_LINE : lineOf(mat));
  const fz = A.fog(Zm);
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  const face = (q: P2[], fill: string, key: string) => els.push(<path key={key} d={poly(q)} fill={fill} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />);
  const shadeDark = mixHex(mat.dark, PAL.shadow, 0.2);
  if (Y1 < P.horizonY) face([p(X0, Y1, Z0), p(X1, Y1, Z0), p(X1, Y1, Z1), p(X0, Y1, Z1)], t(shadeDark), "bt");
  if (X0 > vx) face([p(X0, Y0, Z0), p(X0, Y0, Z1), p(X0, Y1, Z1), p(X0, Y1, Z0)], t(mixHex(mat.lit, mat.mid, 0.35)), "lf");
  if (X1 < vx) face([p(X1, Y0, Z0), p(X1, Y0, Z1), p(X1, Y1, Z1), p(X1, Y1, Z0)], t(shadeDark), "rt");
  const topSeen = Y0 > P.horizonY;
  if (topSeen) face([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y0, Z1), p(X0, Y0, Z1)], t(mat.lit), "tp");
  const fr: P2[] = [p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y1, Z0), p(X0, Y1, Z0)];
  face(fr, t(mat.mid, Z0), "fr");
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
  const ra = (1 - fz) * 0.6 * rim;
  if (ra > 0.01) {
    let d = `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X1, Y0, Z0))}`;
    if (topSeen) d += `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X0, Y0, Z1))}`;
    else d += `M${Pt(p(X0, Y0, Z0))}L${Pt(p(X0, Y1, Z0))}`;
    els.push(<path key="rim" d={d} fill="none" stroke={PAL.cream} strokeWidth={lw * 1.1} strokeOpacity={ra} strokeLinecap="round" />);
  }
  return <g>{els}</g>;
};

/** a vertical cylinder re-lit for the medium: a soft horizontal form light, a core shadow at the right, a little
 *  reflected air at the far edge; joints (drum seams) as thin darker lines; a cream rim at the left */
export const AirCyl: React.FC<{ A: CraneAir; X: number; Z: number; R: number; Y0: number; Y1: number; mat: Mat; uid: string; lw: number; joints?: number[]; flutes?: number }> = ({ A, X, Z, R, Y0, Y1, mat, uid, lw, joints = [], flutes = 0 }) => {
  const P = A.P;
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
  const body = `M${Pt([tp.c[0] - tp.rx, tp.c[1]])}L${Pt([bt.c[0] - bt.rx, bt.c[1]])}A${bt.rx.toFixed(2)},${bt.ry.toFixed(2)} 0 0 0 ${Pt([bt.c[0] + bt.rx, bt.c[1]])}L${Pt([tp.c[0] + tp.rx, tp.c[1]])}Z`;
  const x0 = tp.c[0] - tp.rx;
  const x1 = tp.c[0] + tp.rx;
  const shade = mixHex(mat.dark, PAL.shadow, 0.15);
  const refl = mixHex(mat.mid, A.airHex(h), 0.4);
  const topSeen = Y0 > P.horizonY;
  // the drum seams: the front half of the ellipse at each joint height
  const seam = joints
    .map((Y) => {
      const e = ell(Y);
      const below = Y > P.horizonY; // seen from above: the front arc bulges down
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
      <path d={body} fill={`url(#${uid}-g)`} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />
      {fl ? <path d={fl} stroke={t(mat.dark)} strokeWidth={lw * 0.7} strokeOpacity={0.22} /> : null}
      {seam ? <path d={seam} fill="none" stroke={ln} strokeWidth={lw * 0.75} strokeOpacity={0.55} /> : null}
      {topSeen ? <ellipse cx={tp.c[0]} cy={tp.c[1]} rx={tp.rx} ry={tp.ry} fill={t(mat.lit)} stroke={ln} strokeWidth={lw} /> : null}
      <path d={`M${Pt([tp.c[0] - tp.rx * 0.93, tp.c[1]])}L${Pt([bt.c[0] - bt.rx * 0.93, bt.c[1]])}`} stroke={PAL.cream} strokeWidth={lw * 1.2} strokeOpacity={0.45 * (1 - fz)} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE GROUND
// ---------------------------------------------------------------------------
/** the flags: one continuous tone by depth (a little darker near), joints in a darker local colour fading with the
 *  fog, the far end melting into the air behind its row */
export const AirFloor: React.FC<{ A: CraneAir; x0: number; x1: number; z0: number; z1: number; mat: Mat; course: number; lw: number }> = ({ A, x0, x1, z0, z1, mat, course, lw }) => {
  const P = A.P;
  const zA = Math.max(z0, P.zNear);
  const melt = (Z: number) => Math.pow(c01((Z - (z1 - 0.45 * (z1 - z0))) / (0.45 * (z1 - z0))), 1.3);
  const colAt = (Z: number) => {
    const near = c01(1 - (Z + 400) / 900);
    const local = mixHex(mixHex(mat.lit, mat.mid, 0.3), mat.dark, 0.2 * near);
    const fogged = A.tone(local, Z, 0);
    const wy = P.p(0, 0, Z)[1];
    return mixHex(fogged, A.screenAir(wy), melt(Z));
  };
  const N = 28;
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const za = mix(zA, z1, Math.pow(i / N, 1.6));
    const zb = mix(zA, z1, Math.pow((i + 1) / N, 1.6));
    const zb2 = i < N - 1 ? zb + (zb - za) * 0.15 : zb;
    bands.push(<path key={i} d={poly([P.p(x0, 0, za), P.p(x1, 0, za), P.p(x1, 0, zb2), P.p(x0, 0, zb2)])} fill={colAt((za + zb) / 2)} />);
  }
  const step = course * 0.7;
  const pieces = 16;
  const zAt = (i: number) => mix(zA, z1, Math.pow(i / pieces, 1.5));
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    const a = (1 - A.fog(zm)) * (1 - melt(zm));
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

/** the horizon as a soft zone over the ground only (pandemicAir's AirHorizonHaze in world units): the ground's far
 *  band melts into the air of the horizon row; `below` screen px under the horizon it is gone */
export const AirHorizonHazeW: React.FC<{ A: CraneAir; below?: number; strength?: number; id: string }> = ({ A, below = 190, strength = 1, id }) => {
  const { cam, P } = A;
  const y0 = P.opts.eyeY - 2 / cam.k;
  const hgt = below / cam.k;
  const c = A.screenAir(P.opts.eyeY + 6 / cam.k);
  const x0 = cam.cx - 700 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={(y0 + hgt).toFixed(2)}>
          {[0, 0.2, 0.45, 0.7, 1].map((o) => (
            <stop key={o} offset={o} stopColor={c} stopOpacity={(strength * Math.pow(1 - o, 1.8)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={y0.toFixed(2)} width={(1400 / cam.k).toFixed(2)} height={hgt.toFixed(2)} fill={`url(#${id})`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// SHADOWS
// ---------------------------------------------------------------------------
/** a soft contact shadow (on the ground, or a surface at height Y) in the medium's shadow colour, offset to the lower
 *  right, fading with the fog of its depth */
export const AirShadow: React.FC<{ A: CraneAir; X: number; Z: number; w?: number; d?: number; uid: string; amt?: number; Y?: number }> = ({ A, X, Z, w = 74, d = 40, uid, amt = 1, Y = 0 }) => {
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
