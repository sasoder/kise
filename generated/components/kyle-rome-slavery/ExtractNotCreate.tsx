// ---------------------------------------------------------------------------
// ExtractNotCreate (kyle-rome-slavery, cut 48). Dwarkesh map style (styles/dwarkesh-map.md), in the clip's 3D depth
// manner (London's DEPTH.md, the depth kit ../kyle-london/londonDepth, read only). Opaque 1080x1920, 29.97 fps, 186
// frames. People and props from ./romeCast (read only). World, camera and timelines: ./extractNotCreatePlan.ts.
//
// CHECK LINE: "The Roman master got rich fast by squeezing more out of his slaves — but the bigger, shared wealth a
// productive estate could have made for everyone was never built."
//
// THE LINE: "(The way the argument is usually made is just that, you know,) the Romans got rich without really
// thinking about productivity. They just wanted to extract labor, extract wealth (rather than create wealth)"
// WORD -> FRAME: know 1 · the 3 · Romans 5 · got 12 · rich 26 · without 36 · really 45 · thinking 53 · about 63 ·
// productivity 74 · They 100 · just 111 · wanted 116 · to 120 · extract 125 · labor 137 · extract 180 · (cut at 186)
// DURATION: the slot 48.982 -> 55.188 s = 6.206 s x 29.97 = 186 frames (f0..f185).
//
// THE MOTION: one camera in one-point perspective (a raised eye over a villa estate, one light from the upper left).
// f0-30 close on a rich Roman reclining with his wine cup beside his heap of coins as a line of slaves files past it,
// each tipping a sack: the first sacks pour torrents and the heap swells (f26 visibly bigger). From f24 one slow
// pull-back drifts right over the terrace and the field: the line comes in across the field, pours, and goes round
// behind the heap into the villa; an overseer with a vine rod keeps it moving. From f44 ("without really thinking
// about productivity") a fine dashed orange tip draws what the estate could have built: a water mill on the stream,
// its wheel whole and turning by "productivity" (f74); from f80 a village of houses and stalls with their goods is
// drawn round it, nearest first, at an exponential rate. From f100 the line is driven harder: the rod comes down
// on "extract" (contact f124, the line speeds up from f124, first reaction f125) and again on the second "extract"
// (f178); the slaves sink toward DEAD; every sack pours less (late pours are a trickle of coins), so the heap rises
// fast and then levels off, while the dashed estate keeps compounding past it. The last frame holds both: the solid
// cream heap and its master at the left, the larger dashed shared wealth at the right, the line between.
// CAUSE BEFORE EFFECT: every coin leaves a sack's mouth and lands on the heap 6 frames later; the heap's size is the
// coins that have landed. The village's houses are drawn by their own moving tips (nothing fades in).
// Orange = wealth. SOLID orange = the master's money (the coins in his heap, in flight, in the pour: real, short
// term); DASHED orange = the productive estate and the wealth it would have created (never built). Revision 1: the
// money turned orange on the user's note ("the money can be orange here"). The people, their sacks and the villa are
// cream / umber; the driven slaves sink toward DEAD #8A7B62. The pen tips of the sketch are drawn in the sketch's own
// layer, so the villa hides a tip behind it exactly as it hides the lines.
//
// V3 (the pandemics clip's final look, <notes>/V3_COMMON.md): the estate inside the clip's medium
// (../kyle-pandemics/pandemicAir, palette A, mood day, read only): one misty teal air with shafts from the upper left,
// motes, the grade, grain and a faint bloom on orange, everything fogged by its distance from the eye (P.Dc + Z). The
// paper page is gone. The ground is opaque, one continuous tone by distance per surface (the lower ground, the
// terrace flags, the field, the hill climbing into the haze, its ridge melting into the air: no ridge line); the
// podium, villa and kerb re-lit (soft light from above, cream rims on top edges, thin outlines in a darker local
// colour: ashlar stone, oatmeal plaster over a red-brown dado, terracotta roof). The people are the drawn picture-book
// cast (./romeFolk, gouache): every figure fogged by its own distance (near ones keep their full colour), the driven
// slaves sinking toward DEAD through `drain`, the carriers going into the door sinking into its dark; contact shadows
// in the air's shadow colour. The sacks are painted in the same gouache (one crescent shadow, the texture). The coins
// and the heap stay solid orange (no casing); the dashed estate stays orange, its faces soaking in the hill's own
// fogged tone, its tips in its own layer (Revision 1). Concept, timing, camera and every Revision-1 fix unchanged.
//
// SOURCES: the argument as Harper paraphrases it (Roman elites extracted wealth through slave labour rather than
// investing in productivity), e.g. the "slavery blocked technology" thesis (M. I. Finley, The Ancient Economy,
// 1973); Harper himself does not buy it (the next cuts). The water mill after the Roman vertical undershot wheel
// (Vitruvius, De architectura X.5). Illustrative; no figures or text on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { WorldSvg } from "../kits/maps/texcocoShared";
import { perspective, type Persp } from "../kyle-london/londonDepth";
import { AirStage, airRamp, fogHex, makeAirView, mixHex, mixRgb, rgbHex, type AirScene, type AirView, type RGB } from "../kyle-pandemics/pandemicAir";
import { folkTexDefs } from "../kyle-pandemics/pandemicFolkPaint";
import { Couch, Dominus, FOLK_SHADE, Overseer, POSES, Slave, gripTo, headTurn, idle, lerpFig, reclineAt, romeAnchors, walkPose, type FigPose, type FolkFog } from "./romeFolk";
import {
  COIN_FLIGHT,
  COIN_LEAVE,
  COIN_N,
  COIN_POUR,
  COUCH_X,
  COUCH_Z,
  DEPTH,
  DURATION as PLAN_DURATION,
  HEAP_C,
  HEAVE,
  HILL_Z0,
  HILL_Z1,
  hillH,
  HOUSES,
  MILL,
  MILL_DUR,
  MILL_T0,
  OVERSEER,
  PATH_LEN,
  PODIUM_H,
  PODIUM_Z,
  POUR,
  SLAVE_J0,
  SLAVE_J1,
  STREAM_Z,
  S_DOOR,
  S_POUR,
  TERRACE_EDGE,
  VILLA,
  camAt,
  hash,
  heapAmount,
  heapH,
  heapW,
  pathAt,
  rodAt,
  sinkAt,
  slaveS,
  wheelAngle,
  type Cam,
  type House,
  type P2,
  type P3,
} from "./extractNotCreatePlan";

export const FPS = 30000 / 1001;
export const DURATION = 186;
if (PLAN_DURATION !== DURATION) throw new Error("plan / component DURATION mismatch");
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ORANGE_HEX = "#FFB000";
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};
const fx = (v: number) => v.toFixed(2);
const pt = (v: P2) => `${fx(v[0])},${fx(v[1])}`;
const lerp2 = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

/** a smooth closed path through points (Catmull-Rom as cubic Beziers) */
const smoothClosed = (q: P2[]) => {
  const n = q.length;
  let d = `M${pt(q[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n];
    const p1 = q[i];
    const p2 = q[(i + 1) % n];
    const p3 = q[(i + 2) % n];
    const c1: P2 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return `${d}Z`;
};
const poly = (P: Persp, q: P3[]) => `M${q.map((v) => pt(P.p(v[0], v[1], v[2]))).join("L")}Z`;

// ---------------------------------------------------------------------------
// V3: THE MEDIUM (pandemicAir palette A, mood day). Distances from the eye: P.Dc + Z (cast units, a man ~310 =
// 1.75 m). The fog starts behind the line's near end, so the master, his heap and the near line keep their colour and
// only the far field, the hill and the village sink into the air.
// ---------------------------------------------------------------------------
const AIR_SCENE: AirScene = { look: "A", mood: "day", F: 1000, fogNear: 1500, fogVis: 3000, fogMax: 0.88, hLow: 0, hHigh: 1700, moteUnit: 177 };
type AirCtx = {
  v: AirView;
  P: Persp;
  cam: Cam;
  /** the eye's distance to depth Z */
  d: (Z: number) => number;
  /** a local colour fogged by its distance (depth Z) at a height (up +) */
  tone: (hex: string, Z: number, h?: number) => string;
  fogZ: (Z: number) => number;
  /** a world y (front-plane px) as a screen row */
  sy: (wy: number) => number;
};
const SHADOW = "#22180F";
const CREAM_AIR = "#F3EBDD";
/** the local colours (before fog), lit from the upper left */
const LOC = {
  low: { near: "#5E5341", far: "#6E6049", joint: "#463D31" },
  terrace: { near: "#8E7F64", far: "#7F7259", joint: "#5A4F3F" },
  field: { near: "#76694F", far: "#6D6049", strip: "#857659", furrow: "#4F4535" },
  hill: { foot: "#7A6D54", top: "#86795F", line: "#5C5242" },
  stone: { lit: "#A6957A", mid: "#8C7C64", dark: "#5C5144", line: "#4A4137" },
  plaster: { lit: "#AE9C7B", mid: "#9C8A6B", line: "#6E604B" },
  dado: { lit: "#8C5A49", mid: "#7A4C3E", line: "#57362C" },
  roof: { lit: "#9C6650", mid: "#8A5845", line: "#5E3A2D" },
  door: "#2E241C",
  pane: "#3A2E24",
};
/** the hill's tone at depth Z seen at screen row sy: its local colour fogged, and toward the ridge melting into the air
 *  behind it (the horizon a soft zone, never a line) */
const MELT = 0.62;
const hillTone = (A: AirCtx, Z: number, sy: number, X = 0) => {
  const u = c01((Z - HILL_Z0) / (HILL_Z1 - HILL_Z0));
  const base = A.tone(mixHex(LOC.hill.foot, LOC.hill.top, u), Z, hillH(X, Z));
  return mixHex(base, rgbHex(A.v.airAtScreen(sy)), MELT * smooth((Z - (HILL_Z1 - 650)) / 650));
};
/** what the hill (or the air above its ridge) shows at screen row sy over X: the tone of the hill point seen there */
const hillScreenTone = (A: AirCtx, X: number, sy: number) => {
  const yAt = (Z: number) => A.sy(A.P.p(X, -hillH(X, Z), Z)[1]);
  const yr = yAt(HILL_Z1);
  if (sy <= yr) return mixHex(hillTone(A, HILL_Z1, yr, X), rgbHex(A.v.airAtScreen(sy)), smooth((yr - sy) / 60));
  let lo = HILL_Z0;
  let hi = HILL_Z1;
  for (let i = 0; i < 22; i++) {
    const m = (lo + hi) / 2;
    if (yAt(m) > sy) lo = m;
    else hi = m;
  }
  return hillTone(A, (lo + hi) / 2, sy, X);
};
/** a userSpace gradient along world y over a floor at height Y from depth z0 to z1, coloured by col(Z) */
const FloorGrad: React.FC<{ id: string; P: Persp; Y: number; z0: number; z1: number; col: (Z: number) => string; n?: number }> = ({ id, P, Y, z0, z1, col, n = 16 }) => {
  const y0 = P.p(0, Y, z0)[1];
  const y1 = P.p(0, Y, z1)[1];
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={fx(y0)} x2={0} y2={fx(y1)}>
      {Array.from({ length: n + 1 }, (_, i) => {
        const Z = mix(z0, z1, Math.pow(i / n, 1.7));
        const o = (P.p(0, Y, Z)[1] - y0) / (y1 - y0 || 1);
        return <stop key={i} offset={c01(o).toFixed(4)} stopColor={col(Z)} />;
      })}
    </linearGradient>
  );
};
/** flag joints on a floor at height Y: lines to the VP and staggered cross joints, in a darker local colour fading
 *  with the fog (no casing) */
const Joints: React.FC<{ A: AirCtx; Y: number; x0: number; x1: number; z0: number; z1: number; step: number; course: number; hex: string; a: number }> = ({ A, Y, x0, x1, z0, z1, step, course, hex, a }) => {
  const { P } = A;
  const zA = Math.max(z0, P.zNear);
  const pieces = 12;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < pieces; i++) {
    const za = mix(zA, z1, Math.pow(i / pieces, 1.4));
    const zb = mix(zA, z1, Math.pow((i + 1) / pieces, 1.4));
    const zm = (za + zb) / 2;
    let d = "";
    for (let X = Math.ceil(x0 / step) * step; X <= x1; X += step) d += `M${pt(P.p(X, Y, za))}L${pt(P.p(X, Y, zb))}`;
    let n = 0;
    for (let X = Math.ceil(x0 / step) * step; X < x1; X += step, n++) {
      const off = (n % 2) * course * 0.5;
      for (let Z = za - (((za - off) % course) + course) % course; Z < zb; Z += course) if (Z >= za) d += `M${pt(P.p(X, Y, Z))}L${pt(P.p(X + step, Y, Z))}`;
    }
    out.push(<path key={i} d={d} fill="none" stroke={A.tone(hex, zm)} strokeWidth={1.5 * P.r(zm)} strokeOpacity={a * (1 - A.fogZ(zm))} />);
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// THE GROUND: the lower ground before the podium, the terrace (flags), the field (furrows to the VP), the hill
// climbing into the haze with the mill's leat along it. Opaque, one continuous tone by distance per surface.
// ---------------------------------------------------------------------------
const Hill: React.FC<{ A: AirCtx; f: number }> = ({ A, f }) => {
  const { P } = A;
  const X0 = -4200;
  const X1 = 4600;
  const NX = 64;
  const hp = (X: number, Z: number) => P.p(X, -hillH(X, Z), Z);
  const xs = Array.from({ length: NX + 1 }, (_, i) => mix(X0, X1, i / NX));
  // the slope in thin bands from the foot to the ridge, each its own fogged tone (they overlap a hair: no seams)
  const NB = 40;
  const zAt = (i: number) => mix(HILL_Z0, HILL_Z1, i / NB);
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < NB; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const lo = xs.map((X) => hp(X, za));
    const hi = xs.map((X) => hp(X, Math.min(HILL_Z1, zb + 4)));
    const zm = (za + zb) / 2;
    const c = hillTone(A, zm, A.sy(hp(A.cam.cx, zm)[1]), A.cam.cx);
    bands.push(<path key={i} d={`M${lo.map(pt).join("L")}L${[...hi].reverse().map(pt).join("L")}Z`} fill={c} stroke={c} strokeWidth={0.8 / A.cam.k} />);
  }
  // vineyard terraces along the slope: a faint darker line, sinking with the fog and the melt
  const ter: React.ReactNode[] = [];
  const NT = 11;
  for (let i = 1; i < NT; i++) {
    const Z = mix(HILL_Z0, HILL_Z1, Math.pow(i / (NT + 1), 0.9));
    const melt = 1 - smooth((Z - (HILL_Z1 - 650)) / 650);
    ter.push(<path key={i} d={`M${xs.map((X) => pt(hp(X, Z))).join("L")}`} fill="none" stroke={A.tone(LOC.hill.line, Z, 600)} strokeWidth={1.4 * P.r(Z)} strokeOpacity={0.55 * melt * (1 - A.fogZ(Z))} />);
  }
  // the leat along the hill: a ribbon of water mirroring the air above it, faint cream ripples
  const z0 = STREAM_Z - 22;
  const z1 = STREAM_Z + 22;
  const bankA = xs.map((X) => hp(X, z0));
  const bankB = xs.map((X) => hp(X, z1));
  const water = `M${bankA.map(pt).join("L")}L${[...bankB].reverse().map(pt).join("L")}Z`;
  let rip = "";
  for (let i = 0; i < 60; i++) {
    const X = X0 + (((i * 151 + hash(i, 61) * 80 - f * 2.2) % (X1 - X0)) + (X1 - X0)) % (X1 - X0);
    const Z = mix(z0 + 8, z1 - 8, hash(i, 63));
    rip += `M${pt(hp(X, Z))}L${pt(hp(X + 46 + 30 * hash(i, 65), Z))}`;
  }
  const rs = P.r(STREAM_Z);
  const fs = A.fogZ(STREAM_Z);
  const waterC = mixHex(hillTone(A, STREAM_Z, A.sy(hp(A.cam.cx, STREAM_Z)[1]), A.cam.cx), mixHex(rgbHex(A.v.airAt(A.d(STREAM_Z), 1700)), CREAM_AIR, 0.08), 0.45);
  return (
    <g>
      {bands}
      {ter}
      <path d={water} fill={waterC} opacity={0.9} />
      <path d={rip} fill="none" stroke={CREAM_AIR} strokeWidth={1.4 * rs} strokeOpacity={0.22 * (1 - fs)} strokeLinecap="round" />
      <path d={`M${bankA.map(pt).join("L")}M${bankB.map(pt).join("L")}`} fill="none" stroke={A.tone(LOC.hill.line, STREAM_Z, 700)} strokeWidth={1.6 * rs} strokeOpacity={0.8} />
    </g>
  );
};
const Ground: React.FC<{ A: AirCtx; f: number }> = ({ A, f }) => {
  const { P } = A;
  const terrace = poly(P, [
    [-3000, 0, PODIUM_Z],
    [3600, 0, PODIUM_Z],
    [3600, 0, TERRACE_EDGE],
    [0, 0, TERRACE_EDGE],
    [0, 0, VILLA.z0],
    [-3000, 0, VILLA.z0],
  ]);
  // the field: beyond the terrace, up to the hill's foot (it runs a little under the hill's first band)
  const fieldD = poly(P, [
    [-3000, 0, VILLA.z0],
    [0, 0, VILLA.z0],
    [0, 0, TERRACE_EDGE],
    [4200, 0, TERRACE_EDGE],
    [4200, 0, HILL_Z0 + 30],
    [-3000, 0, HILL_Z0 + 30],
  ]);
  const zLow = Math.max(-1400, P.zNear);
  const lowD = poly(P, [
    [-3000, PODIUM_H, zLow],
    [3600, PODIUM_H, zLow],
    [3600, PODIUM_H, PODIUM_Z + 2],
    [-3000, PODIUM_H, PODIUM_Z + 2],
  ]);
  // furrows: lines along Z (to the VP) in depth pieces; every other strip a lighter soil; both in darker / lighter
  // local colours fogged by their distance
  const pieces = 16;
  const zAt = (i: number) => mix(TERRACE_EDGE, HILL_Z0 + 30, Math.pow(i / pieces, 1.3));
  const furrows: React.ReactNode[] = [];
  const strips: React.ReactNode[] = [];
  const STEP = 46;
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    const a = 1 - A.fogZ(zm);
    let d = "";
    let ds = "";
    let n = 0;
    for (let X = -3000; X <= 4200; X += STEP, n++) {
      d += `M${pt(P.p(X, 0, za))}L${pt(P.p(X, 0, zb))}`;
      if (n % 2 === 0) ds += `M${[P.p(X, 0, za), P.p(X + STEP, 0, za), P.p(X + STEP, 0, zb), P.p(X, 0, zb)].map(pt).join("L")}Z`;
    }
    strips.push(<path key={`s${i}`} d={ds} fill={A.tone(LOC.field.strip, zm)} opacity={0.32 * a} />);
    furrows.push(<path key={`f${i}`} d={d} fill="none" stroke={A.tone(LOC.field.furrow, zm)} strokeWidth={2 * P.r(zm)} strokeOpacity={0.55 * a} />);
  }
  const span = (z0: number, z1: number) => (Z: number) => c01((Z - z0) / (z1 - z0));
  const tz = span(PODIUM_Z, VILLA.z0);
  const fz = span(TERRACE_EDGE, HILL_Z0);
  const lz = span(zLow, PODIUM_Z);
  return (
    <g>
      <defs>
        <FloorGrad id="eg-lowg" P={P} Y={PODIUM_H} z0={zLow} z1={PODIUM_Z} col={(Z) => A.tone(mixHex(LOC.low.near, LOC.low.far, lz(Z)), Z)} />
        <FloorGrad id="eg-terg" P={P} Y={0} z0={PODIUM_Z} z1={VILLA.z0} col={(Z) => A.tone(mixHex(LOC.terrace.near, LOC.terrace.far, tz(Z)), Z)} />
        <FloorGrad id="eg-fldg" P={P} Y={0} z0={TERRACE_EDGE} z1={HILL_Z0 + 30} col={(Z) => A.tone(mixHex(LOC.field.near, LOC.field.far, fz(Z)), Z)} />
        <clipPath id="eg-ter">
          <path d={terrace} />
        </clipPath>
      </defs>
      <path d={fieldD} fill="url(#eg-fldg)" />
      {strips}
      {furrows}
      <Hill A={A} f={f} />
      <path d={terrace} fill="url(#eg-terg)" />
      <g clipPath="url(#eg-ter)">
        <Joints A={A} Y={0} x0={-3000} x1={3600} z0={PODIUM_Z} z1={VILLA.z0} step={105} course={150} hex={LOC.terrace.joint} a={0.6} />
      </g>
      <path d={lowD} fill="url(#eg-lowg)" />
      <Joints A={A} Y={PODIUM_H} x0={-3000} x1={3600} z0={zLow} z1={PODIUM_Z} step={133} course={190} hex={LOC.low.joint} a={0.5} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// ARCHITECTURE IN THE AIR: soft light from above, a cream rim on the top edges, thin outlines in a darker local
// colour, fogged by distance (no casing, no hatching)
// ---------------------------------------------------------------------------
type Mat3 = { lit: string; mid: string; dark: string; line: string };
/** a box's seen faces (as londonDepth's Box: the top when below the eye, the side toward the VP, the front), its front
 *  face lit softly from above (a vertical gradient), a cream rim along the front's top edge */
const AirBox: React.FC<{ A: AirCtx; X0: number; X1: number; Y0: number; Y1: number; Z0: number; Z1: number; mat: Mat3; uid: string; rim?: number }> = ({ A, X0, X1, Y0, Y1, Z0, Z1, mat, uid, rim = 0.4 }) => {
  const { P } = A;
  const p = P.p;
  const zm = (Z0 + Z1) / 2;
  const h = -(Y0 + Y1) / 2;
  const sw = 1.3 * P.r(zm);
  const line = A.tone(mat.line, zm, h);
  const q = (pts: P2[]) => `M${pts.map(pt).join("L")}Z`;
  const vx = P.vp[0];
  const els: React.ReactNode[] = [];
  if (X0 > vx) els.push(<path key="lf" d={q([p(X0, Y0, Z0), p(X0, Y0, Z1), p(X0, Y1, Z1), p(X0, Y1, Z0)])} fill={A.tone(mat.lit, zm, h)} stroke={line} strokeWidth={sw} strokeLinejoin="round" />);
  if (X1 < vx) els.push(<path key="rt" d={q([p(X1, Y0, Z0), p(X1, Y0, Z1), p(X1, Y1, Z1), p(X1, Y1, Z0)])} fill={A.tone(mat.dark, zm, h)} stroke={line} strokeWidth={sw} strokeLinejoin="round" />);
  if (Y0 > P.horizonY) els.push(<path key="tp" d={q([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y0, Z1), p(X0, Y0, Z1)])} fill={A.tone(mixHex(mat.lit, CREAM_AIR, 0.12), zm, h)} stroke={line} strokeWidth={sw} strokeLinejoin="round" />);
  const fy0 = p(X0, Y0, Z0)[1];
  const fy1 = p(X0, Y1, Z0)[1];
  els.push(
    <g key="fr">
      <defs>
        <linearGradient id={`${uid}-fg`} gradientUnits="userSpaceOnUse" x1={0} y1={fx(fy0)} x2={0} y2={fx(fy1)}>
          <stop offset="0" stopColor={A.tone(mat.lit, Z0, -Y0)} />
          <stop offset="0.35" stopColor={A.tone(mat.mid, Z0, h)} />
          <stop offset="1" stopColor={A.tone(mixHex(mat.mid, mat.dark, 0.45), Z0, -Y1)} />
        </linearGradient>
      </defs>
      <path d={q([p(X0, Y0, Z0), p(X1, Y0, Z0), p(X1, Y1, Z0), p(X0, Y1, Z0)])} fill={`url(#${uid}-fg)`} stroke={line} strokeWidth={sw} strokeLinejoin="round" />
    </g>,
  );
  if (rim > 0) els.push(<path key="rim" d={`M${pt(p(X0, Y0, Z0 - 0.5))}L${pt(p(X1, Y0, Z0 - 0.5))}`} stroke={CREAM_AIR} strokeWidth={1.8 * P.r(Z0)} strokeOpacity={rim * (1 - A.fogZ(Z0))} />);
  return <g>{els}</g>;
};
const STONE3: Mat3 = { ...LOC.stone };
/** the dense low air (the medium's height ramp): from under the cornice the podium wall and the ground before it sink
 *  darker and a touch teal-espresso toward the bottom of the frame (drawn over the wall's face and courses, under its
 *  grilles and cornice, so the cell grilles stay crisp) */
const LowAir: React.FC<{ A: AirCtx }> = ({ A }) => {
  const { P, cam } = A;
  const y0 = P.p(0, 18, PODIUM_Z)[1];
  const yFoot = P.p(0, PODIUM_H, PODIUM_Z)[1];
  const y1 = cam.cy + 980 / cam.k;
  const o = (y: number) => c01((y - y0) / (y1 - y0)).toFixed(4);
  const x0 = cam.cx - 600 / cam.k;
  const x1 = cam.cx + 600 / cam.k;
  return (
    <g>
      <defs>
        <linearGradient id="ela-g" gradientUnits="userSpaceOnUse" x1={0} y1={fx(y0)} x2={0} y2={fx(y1)}>
          <stop offset="0" stopColor={rgbHex(airRamp("A", 0.4))} stopOpacity={0} />
          <stop offset={o(mix(y0, yFoot, 0.5))} stopColor={rgbHex(airRamp("A", 0.42))} stopOpacity={0.1} />
          <stop offset={o(yFoot)} stopColor={rgbHex(airRamp("A", 0.46))} stopOpacity={0.3} />
          <stop offset="1" stopColor={rgbHex(airRamp("A", 0.6))} stopOpacity={0.55} />
        </linearGradient>
      </defs>
      <rect x={fx(x0)} y={fx(y0)} width={fx(x1 - x0)} height={fx(y1 - y0)} fill="url(#ela-g)" />
    </g>
  );
};
/** the podium's front wall (ashlar, lit softly from above), its cornice with a cream rim, a few barred vents of the
 *  cells under it */
const Podium: React.FC<{ A: AirCtx }> = ({ A }) => {
  const { P } = A;
  const z = PODIUM_Z;
  const r = P.r(z);
  const X0 = -3000;
  const X1 = 3600;
  let courses = "";
  const CH = 58;
  for (let Y = 14 + CH, row = 0; Y < PODIUM_H; Y += CH, row++) {
    courses += `M${pt(P.p(X0, Y, z - 1))}L${pt(P.p(X1, Y, z - 1))}`;
    for (let X = X0 + (row % 2) * 70; X < X1; X += 140) courses += `M${pt(P.p(X, Y - CH, z - 1))}L${pt(P.p(X, Y, z - 1))}`;
  }
  const vents: React.ReactNode[] = [];
  for (let X = -1500; X < 3000; X += 760) {
    const q: P3[] = [[X, 250, z - 1], [X + 90, 250, z - 1], [X + 90, 320, z - 1], [X, 320, z - 1]];
    let bars = "";
    for (let b = 1; b < 4; b++) bars += `M${pt(P.p(X + b * 22.5, 250, z - 1.5))}L${pt(P.p(X + b * 22.5, 320, z - 1.5))}`;
    vents.push(
      <g key={X}>
        <path d={poly(P, q)} fill={A.tone("#2E2620", z)} stroke={A.tone(LOC.stone.line, z)} strokeWidth={1.4 * r} />
        <path d={bars} stroke={A.tone(LOC.stone.mid, z)} strokeWidth={3 * r} />
      </g>,
    );
  }
  return (
    <g>
      <AirBox A={A} X0={X0} X1={X1} Y0={0} Y1={PODIUM_H} Z0={z} Z1={z + 60} mat={{ ...STONE3, lit: LOC.stone.mid, mid: mixHex(LOC.stone.mid, LOC.stone.dark, 0.3) }} uid="epo-w" rim={0} />
      <path d={courses} fill="none" stroke={A.tone(LOC.stone.line, z)} strokeOpacity={0.45} strokeWidth={1.4 * r} />
      <LowAir A={A} />
      {vents}
      {/* the cornice: a lit moulding along the terrace's edge */}
      <AirBox A={A} X0={X0} X1={X1} Y0={-10} Y1={16} Z0={z - 16} Z1={z + 4} mat={STONE3} uid="epo-c" rim={0.55} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE VILLA (oatmeal plaster over a red-brown dado, a terracotta roof), its dark door; the terrace kerb
// ---------------------------------------------------------------------------
const doorQuad = (): P3[] => [
  [VILLA.door.x0, 0, VILLA.z0],
  [VILLA.door.x1, 0, VILLA.z0],
  [VILLA.door.x1, -VILLA.door.h, VILLA.z0],
  [VILLA.door.x0, -VILLA.door.h, VILLA.z0],
];
const DADO_H = 175;
const Villa: React.FC<{ A: AirCtx }> = ({ A }) => {
  const { P } = A;
  const V = VILLA;
  const zm = (V.z0 + V.z1) / 2;
  const eaveF = V.z0 - 34;
  const eaveB = V.z1 + 34;
  const ov = 30;
  const roofF: P3[] = [
    [V.x0 - ov, -V.h, eaveF],
    [V.x1 + ov, -V.h, eaveF],
    [V.x1 + ov, -V.ridge, zm],
    [V.x0 - ov, -V.ridge, zm],
  ];
  const roofB: P3[] = [
    [V.x0 - ov, -V.ridge, zm],
    [V.x1 + ov, -V.ridge, zm],
    [V.x1 + ov, -V.h, eaveB],
    [V.x0 - ov, -V.h, eaveB],
  ];
  const gable: P3[] = [
    [V.x1 + ov, -V.h, eaveF],
    [V.x1 + ov, -V.ridge, zm],
    [V.x1 + ov, -V.h, eaveB],
  ];
  // tile courses (along the slope) and the rows (across)
  let tiles = "";
  for (let X = V.x0; X <= V.x1 + ov; X += 34) tiles += `M${pt(P.p(X, -V.h, eaveF))}L${pt(P.p(X, -V.ridge, zm))}`;
  for (let i = 1; i < 6; i++) {
    const u = i / 6;
    tiles += `M${pt(P.p(V.x0 - ov, mix(-V.h, -V.ridge, u), mix(eaveF, zm, u)))}L${pt(P.p(V.x1 + ov, mix(-V.h, -V.ridge, u), mix(eaveF, zm, u)))}`;
  }
  const r = P.r(V.z0);
  const fz = 1 - A.fogZ(V.z0);
  const d = V.door;
  const line = (a: P3, b: P3) => `M${pt(P.p(a[0], a[1], a[2]))}L${pt(P.p(b[0], b[1], b[2]))}`;
  const wins: React.ReactNode[] = [];
  for (let X = V.x0 + 120; X < V.x1 - 60; X += 190) {
    if (X > d.x0 - 120 && X < d.x1 + 40) continue;
    wins.push(
      <g key={X}>
        <path d={poly(P, [[X, -300, V.z0], [X + 46, -300, V.z0], [X + 46, -232, V.z0], [X, -232, V.z0]])} fill={A.tone(LOC.pane, V.z0, 270)} stroke={A.tone(LOC.plaster.line, V.z0, 270)} strokeWidth={1.2 * r} />
        <path d={line([X - 4, -230, V.z0 - 1], [X + 50, -230, V.z0 - 1])} stroke={CREAM_AIR} strokeWidth={1.6 * r} strokeOpacity={0.35 * fz} />
      </g>,
    );
  }
  const wallLine = A.tone(LOC.plaster.line, V.z0, 200);
  const roofLine = A.tone(LOC.roof.line, zm, 470);
  const yTop = P.p(0, -V.h, V.z0)[1];
  const yDado = P.p(0, -DADO_H, V.z0)[1];
  const yBase = P.p(0, 0, V.z0)[1];
  const face = (Y0: number, Y1: number) => poly(P, [[V.x0, Y0, V.z0], [V.x1, Y0, V.z0], [V.x1, Y1, V.z0], [V.x0, Y1, V.z0]]);
  return (
    <g>
      <defs>
        <linearGradient id="ev-pl" gradientUnits="userSpaceOnUse" x1={0} y1={fx(yTop)} x2={0} y2={fx(yDado)}>
          <stop offset="0" stopColor={A.tone(LOC.plaster.lit, V.z0, V.h)} />
          <stop offset="0.5" stopColor={A.tone(LOC.plaster.mid, V.z0, 280)} />
          <stop offset="1" stopColor={A.tone(mixHex(LOC.plaster.mid, LOC.stone.dark, 0.15), V.z0, DADO_H)} />
        </linearGradient>
        <linearGradient id="ev-dd" gradientUnits="userSpaceOnUse" x1={0} y1={fx(yDado)} x2={0} y2={fx(yBase)}>
          <stop offset="0" stopColor={A.tone(LOC.dado.lit, V.z0, DADO_H)} />
          <stop offset="1" stopColor={A.tone(mixHex(LOC.dado.mid, SHADOW, 0.2), V.z0, 0)} />
        </linearGradient>
      </defs>
      <path d={poly(P, roofB)} fill={A.tone(LOC.roof.mid, zm, 470)} stroke={roofLine} strokeWidth={1.3 * r} />
      {P.vp[0] > V.x1 + ov ? <path d={poly(P, gable)} fill={A.tone(LOC.plaster.mid, zm, 470)} stroke={wallLine} strokeWidth={1.3 * r} /> : null}
      <path d={face(-V.h, -DADO_H)} fill="url(#ev-pl)" />
      <path d={face(-DADO_H, 0)} fill="url(#ev-dd)" />
      <path d={face(-V.h, 0)} fill="none" stroke={wallLine} strokeWidth={1.3 * r} />
      {/* the dado's top, the cornice */}
      <path d={line([V.x0, -DADO_H, V.z0], [V.x1, -DADO_H, V.z0])} stroke={A.tone(LOC.dado.line, V.z0, DADO_H)} strokeWidth={1.6 * r} strokeOpacity={0.8} />
      <path d={line([V.x0, -V.h + 18, V.z0], [V.x1, -V.h + 18, V.z0])} stroke={wallLine} strokeWidth={1.3 * r} strokeOpacity={0.7} />
      <path d={poly(P, roofF)} fill={A.tone(LOC.roof.lit, zm, 470)} stroke={roofLine} strokeWidth={1.3 * r} />
      <path d={tiles} fill="none" stroke={roofLine} strokeOpacity={0.4} strokeWidth={1.1 * r} />
      {/* the light on the ridge and along the eave */}
      <path d={line(roofF[3], roofF[2])} fill="none" stroke={CREAM_AIR} strokeOpacity={0.45 * fz} strokeWidth={2 * r} />
      <path d={line(roofF[0], roofF[1])} fill="none" stroke={CREAM_AIR} strokeOpacity={0.25 * fz} strokeWidth={1.6 * r} />
      {wins}
      {/* the door: its frame, the dark interior */}
      <path d={poly(P, [[d.x0 - 14, 0, V.z0], [d.x1 + 14, 0, V.z0], [d.x1 + 14, -d.h - 14, V.z0], [d.x0 - 14, -d.h - 14, V.z0]])} fill={A.tone(LOC.stone.mid, V.z0, 160)} stroke={wallLine} strokeWidth={1.2 * r} />
      <path d={line([d.x0 - 14, -d.h - 14, V.z0], [d.x1 + 14, -d.h - 14, V.z0])} stroke={CREAM_AIR} strokeWidth={1.6 * r} strokeOpacity={0.4 * fz} />
      <path d={poly(P, doorQuad())} fill={A.tone(LOC.door, V.z0, 160)} />
    </g>
  );
};
const Kerb: React.FC<{ A: AirCtx }> = ({ A }) => (
  <g>
    <AirBox A={A} X0={0} X1={170} Y0={-24} Y1={0} Z0={TERRACE_EDGE - 16} Z1={TERRACE_EDGE + 6} mat={STONE3} uid="ek-a" />
    <AirBox A={A} X0={440} X1={4200} Y0={-24} Y1={0} Z0={TERRACE_EDGE - 16} Z1={TERRACE_EDGE + 6} mat={STONE3} uid="ek-b" />
  </g>
);
/** a soft contact shadow on the floor at (X, Z) in the air's shadow colour, offset to the lower right (londonDepth's
 *  ContactShadow geometry), fading with the fog of its distance */
const AirShadow: React.FC<{ A: AirCtx; X: number; Z: number; w?: number; d?: number; uid: string; amt?: number }> = ({ A, X, Z, w = 74, d = 40, uid, amt = 1 }) => {
  const { P } = A;
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.25 * d;
  const c = P.p(Xc, 0, Zc);
  const rx = w * P.r(Zc);
  const ry = Math.max(1, (P.p(Xc, 0, Zc - d)[1] - P.p(Xc, 0, Zc + d)[1]) / 2);
  const a = amt * (1 - A.fogZ(Z));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-cs`}>
          <stop offset="0" stopColor={SHADOW} stopOpacity={0.72 * a} />
          <stop offset="0.6" stopColor={SHADOW} stopOpacity={0.45 * a} />
          <stop offset="1" stopColor={SHADOW} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-cs)`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE HEAP: a dome of coins (solid orange: the master's money) that grows only by the coins that land on it
// ---------------------------------------------------------------------------
type CoinSpot = { u: number; t: number; H: number; W: number; tilt: number };
/** the heap's silhouette top at u (-1..1 across): a rounded cone */
const heapTopY = (H: number, u: number) => -H * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 1.6)), 1.25) - 2;
/** coin i's place on the heap's face, fixed as the heap was when it landed: u across (-1..1), t down the face from
 *  the silhouette top (0) to the front of the base (1). It lands near the top (T_LAND) and slides down to t. */
const COIN_SPOT: CoinSpot[] = Array.from({ length: COIN_N }, (_, i) => {
  const v = (i + 0.5) / COIN_N;
  const H = heapH(v);
  const W = heapW(H);
  const u = (2 * hash(i, 701) - 1) * 0.94;
  const t = Math.sqrt(hash(i, 705)) * 0.96;
  return { u, t, H, W, tilt: (hash(i, 707) - 0.5) * 34 + u * 12 };
});
const T_LAND = 0.12;
const COIN_SLIDE = 6;
/** a face point (heap-local) at (u, t) of a heap H, W seen with base openness o */
const facePt = (H: number, W: number, o: number, u: number, t: number): P2 => {
  const top = heapTopY(H, u);
  const front = W * o * Math.sqrt(Math.max(0, 1 - u * u)) - 5;
  return [u * W, mix(top + 4, front, t)];
};
const heapXform = (P: Persp) => {
  const at = P.p(HEAP_C[0], 0, HEAP_C[1]);
  const r = P.r(HEAP_C[1]);
  return { at, r };
};
/** the base ellipse's openness (ry / rx) of a disc on the floor at the heap */
const heapOpen = (P: Persp, W: number) => {
  const a = P.p(HEAP_C[0], 0, HEAP_C[1] - W)[1];
  const b = P.p(HEAP_C[0], 0, HEAP_C[1] + W)[1];
  return (a - b) / 2 / (W * P.r(HEAP_C[1]));
};
/** coin i's heap-local place g frames after it landed (sliding from near the top to its rest) */
const coinLocal = (i: number, o: number, g = 99): P2 => {
  const c = COIN_SPOT[i];
  const e = c01(g / COIN_SLIDE);
  return facePt(c.H, c.W, o, c.u, mix(Math.min(c.t, T_LAND), c.t, e * e));
};
/** the money: solid house orange (ACCENT lit face, ACCENT_DEEP shaded face, a burnt edge), no casing: a thin darker
 *  orange edge (the faint bloom of the air picks it out) */
const GOLD = { main: "#FFB000", deep: "#D98A0C", edge: "#A5640A", line: "#8A5208" };
const Coin: React.FC<{ x: number; y: number; tilt: number; lit: boolean; k?: number }> = ({ x, y, tilt, lit, k = 1 }) => (
  <g transform={`translate(${fx(x)} ${fx(y)}) rotate(${tilt.toFixed(1)}) scale(${k.toFixed(3)})`}>
    <ellipse cx={0} cy={2.2} rx={9.5} ry={3.6} fill={GOLD.edge} />
    <ellipse cx={0} cy={0} rx={9.5} ry={3.6} fill={lit ? GOLD.main : GOLD.deep} stroke={GOLD.line} strokeWidth={0.9} strokeOpacity={0.75} />
  </g>
);
const Heap: React.FC<{ A: AirCtx; f: number }> = ({ A, f }) => {
  const { P } = A;
  const amt = heapAmount(f);
  const H = heapH(amt);
  const W = heapW(H);
  const o = heapOpen(P, W);
  const { at, r } = heapXform(P);
  const dome: P2[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = -1 + (2 * i) / 24;
    dome.push([u * W, heapTopY(H, u)]);
  }
  for (let i = 1; i < 12; i++) {
    const u = 1 - (2 * i) / 12;
    dome.push([u * W, W * o * Math.sqrt(Math.max(0, 1 - u * u)) - 2]);
  }
  const domeD = smoothClosed(dome);
  const landed: { i: number; x: number; y: number }[] = [];
  for (let i = 0; i < COIN_N; i++) {
    const land = COIN_LEAVE[i] + COIN_FLIGHT;
    if (land > f) break;
    const [x, y] = coinLocal(i, o, f - land);
    landed.push({ i, x, y });
  }
  // nearer (lower on the face) coins over farther ones
  landed.sort((a, b) => a.y - b.y);
  // the form shadow: the right of the heap, away from the light (a soft gradient, no hatching)
  const shadeD = `M${fx(W * 0.18)},${fx(-H - 10)}C${fx(W * 0.5)},${fx(-H * 0.4)} ${fx(W * 0.42)},${fx(W * o * 0.4)} ${fx(W * 0.3)},${fx(W * o + 10)}L${fx(W + 12)},${fx(W * o + 10)}L${fx(W + 12)},${fx(-H - 10)}Z`;
  const unitPx = A.cam.k * r;
  const px = Math.max(0.2, (H * r * A.cam.k) / 600);
  return (
    <g transform={`translate(${pt(at)}) scale(${r.toFixed(5)})`}>
      <defs>
        {folkTexDefs("eh-", px, unitPx)}
        <clipPath id="eh-dome">
          <path d={domeD} />
        </clipPath>
        <linearGradient id="eh-sh" gradientUnits="userSpaceOnUse" x1={fx(W * 0.15)} y1={0} x2={fx(W)} y2={0}>
          <stop offset="0" stopColor={SHADOW} stopOpacity={0} />
          <stop offset="0.45" stopColor={SHADOW} stopOpacity={0.22} />
          <stop offset="1" stopColor={SHADOW} stopOpacity={0.34} />
        </linearGradient>
      </defs>
      <g filter="url(#eh-tx)">
        <path d={domeD} fill="#B8700C" stroke={GOLD.line} strokeWidth={1.4} strokeOpacity={0.7} />
        {landed.map((c) => (
          <Coin key={c.i} x={c.x} y={c.y} tilt={COIN_SPOT[c.i].tilt} lit={hash(c.i, 709) > 0.35} />
        ))}
        <g clipPath="url(#eh-dome)">
          <path d={shadeD} fill="url(#eh-sh)" />
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BAG (drawn here so it can come off the shoulder and pour): a coarse sack with a gathered, tied neck and a
// sagging bottom, carried over the shoulder by its neck. Local units: the neck (the tie) at (0, 0), the bag hanging
// along + y to its bottom at y = BAG_L. `ang` = the direction (deg, screen) from the neck to the bottom.
// ---------------------------------------------------------------------------
const BAG_L = 84;
/** the bag's half-width down its length (t = 0 the tie .. 1 the bottom), full and emptied */
const BAG_W: [number, number][] = [[0, 5], [0.1, 6], [0.22, 15], [0.4, 26], [0.62, 31], [0.8, 30], [0.92, 23], [1, 10]];
type BagX = { A: P2; ang: number; sc: number; empty: number; open: number };
const bagRot = (x: BagX) => ((x.ang - 90) * Math.PI) / 180;
/** a bag-local point in the world */
const bagPt = (x: BagX, p: P2): P2 => {
  const a = bagRot(x);
  const lx = p[0] * x.sc;
  const ly = p[1] * x.sc;
  return [x.A[0] + lx * Math.cos(a) - ly * Math.sin(a), x.A[1] + lx * Math.sin(a) + ly * Math.cos(a)];
};
const bagOutline = (empty: number): P2[] => {
  const L = BAG_L * (1 + 0.1 * empty);
  const right: P2[] = [];
  const left: P2[] = [];
  BAG_W.forEach(([t, w], i) => {
    const ww = w * (1 - 0.55 * empty) + (empty > 0 ? empty * 3 * Math.sin(i * 2.1) : 0);
    // the full bag sags: its lower half bulges a little to the side it hangs from
    right.push([ww + 3 * t * (1 - empty), t * L]);
    left.push([-ww + 3 * t * (1 - empty), t * L]);
  });
  // the sagging bottom
  const bottom: P2 = [2, L + 6 * (1 - empty)];
  return [...right, bottom, ...left.reverse()];
};
/** the sack's paint (romeFolk's SACK colour), in the cast's gouache: one soft crescent shadow from the upper-left
 *  light, the folds as faint darker strokes, the texture filter; fogged like its carrier */
const SACK_C = "#C3B08C";
const SACK_DARK = "#3A2C20";
const CORD = "#6E5A44";
const fogC = (hex: string, fog: FolkFog | null) => (fog && fog.amount > 0.001 ? mixHex(hex, typeof fog.rgb === "string" ? fog.rgb : rgbHex(fog.rgb), fog.amount) : hex);
const BagArt: React.FC<{ x: BagX; fog: FolkFog | null; uid: string; unitPx: number }> = ({ x, fog, uid, unitPx }) => {
  const D = smoothClosed(bagOutline(x.empty));
  const L = BAG_L * (1 + 0.1 * x.empty);
  const base = fogC(SACK_C, fog);
  const shade = mixHex(base, FOLK_SHADE.to, FOLK_SHADE.amt);
  const fold = mixHex(base, "#1E1611", 0.32);
  // the crescent: the shape minus itself shifted toward the light (screen up-left), in bag-local units
  const a = -bagRot(x);
  const sx = -4.3;
  const sy = -4.5;
  const ox = sx * Math.cos(a) - sy * Math.sin(a);
  const oy = sx * Math.sin(a) + sy * Math.cos(a);
  const blur = 3.2 / (x.sc * unitPx);
  const pxf = (x.sc * unitPx * 312) / 860;
  return (
    <g>
      <defs>
        {folkTexDefs(uid, pxf, unitPx)}
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blur).toFixed(3)} />
        </filter>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={-60} y={-40} width={120} height={L + 70}>
          <path d={D} fill="#fff" />
          <path d={D} fill="#000" transform={`translate(${fx(ox)} ${fx(oy)})`} filter={`url(#${uid}su)`} />
        </mask>
      </defs>
      <g filter={`url(#${uid}tx)`}>
        <g transform={`translate(${pt(x.A)}) rotate(${(x.ang - 90).toFixed(2)}) scale(${x.sc.toFixed(4)})`}>
          <path d={D} fill={base} />
          <rect x={-60} y={-40} width={120} height={L + 70} fill={shade} mask={`url(#${uid}m)`} />
          <path d={`M-3,${fx(L * 0.12)}Q-12,${fx(L * 0.4)} -14,${fx(L * 0.7)}M2,${fx(L * 0.12)}Q6,${fx(L * 0.45)} 12,${fx(L * 0.75)}`} fill="none" stroke={fold} strokeWidth={1.4} strokeOpacity={0.5} strokeLinecap="round" />
          {x.open > 0.02 ? (
            // untied: the neck flares open (its mouth is the lowest point when it pours)
            <g>
              <path d={`M-6,4L${fx(-6 - 5 * x.open)},-7L${fx(6 + 5 * x.open)},-7L6,4Z`} fill={base} />
              <ellipse cx={0} cy={-7} rx={6 + 5 * x.open} ry={3 * x.open} fill={fogC(SACK_DARK, fog)} />
            </g>
          ) : (
            <g>
              {/* the gathered tuft above the tie, and the cord */}
              <path d="M-7,-12L-3,-5L0,-13L3,-5L8,-11L5,2L-5,2Z" fill={base} />
              <path d="M-7,2L7,2L6,7L-6,7Z" fill={fogC(CORD, fog)} />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CARRYING LINE: slave j walks the path at slaveS(j, f); loaded (the bag over the near shoulder, held by its neck),
// the heave (swung forward, the neck down), the pour, then empty (hanging limp from the far hand)
// ---------------------------------------------------------------------------
const STRIDE = 62;
const LOADED_BASE = POSES.carry(-1, 0, 0);
const EMPTY_BASE = POSES.walk(-1, 0, 0);
/** where the bag's neck is while pouring (figure-local units; he faces left, so his front is - x) */
const POUR_A: P2 = [-90, -168];
const POUR_ANG = -62;
/** over the shoulder: the bag hangs down his back, its tied neck over the near shoulder in the near fist; CARRY_A is
 *  the neck relative to the near shoulder (units, facing left: + x is behind him) */
const CARRY_ANG = 74;
const CARRY_A: P2 = [24, -30];
/** the grips while pouring (bag-local): the near hand at the neck, the far hand under the bottom */
const GRIP_NECK: P2 = [0, 9];
const GRIP_BOTTOM: P2 = [6, BAG_L * 0.86];
const MOUTH: P2 = [0, -9];
/** men only on this line (romeCast slave variants 0, 1, 2, 4) */
const slaveLook = (j: number) => {
  const m = ((j % 8) + 8) % 8;
  const variant = [0, 1, 2, 4, 1, 0, 4, 2][m];
  return { variant, garb: (m % 3 === 1 ? "exomis" : "tunic") as "exomis" | "tunic", fetters: m % 2 === 0, collar: m % 4 === 3 };
};
type SlaveState = {
  j: number;
  s: number;
  X: number;
  Z: number;
  at: P2;
  scale: number;
  pose: FigPose;
  bag: BagX;
  bagFront: boolean;
  /** (V3 audit) the bag's crossing from behind his back to in front of him over the heave: the front copy's opacity
   *  (a 3-frame crossfade; it used to switch layers in one frame while overlapping the bigger folk head) */
  frontA: number;
  look: ReturnType<typeof slaveLook>;
};
const walkFrom = (base: FigPose, s: number, yaw: number, keepNear: boolean): FigPose => {
  const w = walkPose(base, s / (2 * STRIDE), 1, STRIDE);
  const q: FigPose = keepNear ? { ...w, armR: base.armR } : w;
  return { ...q, yaw: -yaw, headYaw: -yaw * 0.94 };
};
/** the bag's transform while pouring (feet at `at`, scale sc, w = 0..1 through the pour) */
const pourBag = (at: P2, sc: number, w: number): BagX => ({
  // (V3 audit) one shake per pour: two shook the neck on alternate frames once the line was driven (f157-161)
  A: [at[0] + POUR_A[0] * sc, at[1] + (POUR_A[1] + 4 * Math.sin(w * Math.PI * 2)) * sc],
  ang: POUR_ANG - 8 * Math.sin(Math.PI * c01(w)),
  sc,
  empty: smooth(w * 1.15),
  open: 1,
});
const slaveState = (j: number, f: number, P: Persp): SlaveState | null => {
  const s = slaveS(j, f);
  if (s < 0 || s > PATH_LEN - 2) return null;
  const p = pathAt(s);
  const { at, scale } = P.at(p.X, p.Z);
  const look = slaveLook(j);
  const yaw = mix(0.86, 1.28, smooth((s - (S_POUR + POUR)) / 230));
  const sink = sinkAt(f);
  const h0 = S_POUR - HEAVE;
  const p1 = S_POUR + POUR;
  const anchorsOf = (q: FigPose, grip?: { L?: P2; R?: P2 }) => romeAnchors("slave", q, at, scale, { variant: look.variant, grip });
  // bent under the load: always a little bowed, more as they are driven
  const bow = (q: FigPose) => lerpFig(q, POSES.bowed(q), 0.45 + 0.55 * c01(sink / 0.5));
  const base = { j, s, X: p.X, Z: p.Z, at, scale, look };
  /** the bag on his back: the neck just over the near shoulder, the near fist on it */
  const carryBag = (q: FigPose): BagX => {
    const a = anchorsOf(q);
    const sh = a.shoulderR;
    return { A: [sh[0] + CARRY_A[0] * scale, sh[1] + CARRY_A[1] * scale + 3 * scale * Math.sin((s / (2 * STRIDE)) * 4 * Math.PI)], ang: CARRY_ANG, sc: scale, empty: 0, open: 0 };
  };
  if (s < h0) {
    const q0 = bow(walkFrom(LOADED_BASE, s, yaw, true));
    const bag = carryBag(q0);
    const q = gripTo("slave", look.variant, q0, { R: bagPt(bag, GRIP_NECK) }, at, scale);
    return { ...base, pose: q, bag, bagFront: false, frontA: 0 };
  }
  if (s < p1) {
    const qLegs = bow(walkFrom(LOADED_BASE, s, yaw, true));
    if (s < S_POUR) {
      // the heave: the near fist brings the neck forward and down, the bottom swings up behind, the far hand takes the neck
      // the near fist brings the neck forward and down over the shoulder, the bottom swings up behind and the far
      // hand comes up under it
      const u = (s - h0) / HEAVE;
      const e = smooth(u);
      const c = carryBag(qLegs);
      const Ap: P2 = [at[0] + POUR_A[0] * scale, at[1] + POUR_A[1] * scale];
      const A = lerp2(c.A, Ap, e);
      A[1] -= 26 * scale * Math.sin(Math.PI * e);
      const bag: BagX = { A, ang: mix(CARRY_ANG, POUR_ANG, e), sc: scale, empty: 0, open: smooth((u - 0.6) / 0.4) };
      const neck = bagPt(bag, GRIP_NECK);
      const bottom = bagPt(bag, GRIP_BOTTOM);
      const qg = gripTo("slave", look.variant, qLegs, { R: neck, L: bottom }, at, scale);
      const free = gripTo("slave", look.variant, qLegs, { R: neck }, at, scale);
      const frontA = smooth((e - 0.24) / 0.22);
      return { ...base, pose: lerpFig(free, qg, smooth((u - 0.2) / 0.5)), bag, bagFront: frontA > 0, frontA };
    }
    const bag = pourBag(at, scale, (s - S_POUR) / POUR);
    const pose = gripTo("slave", look.variant, qLegs, { R: bagPt(bag, GRIP_NECK), L: bagPt(bag, GRIP_BOTTOM) }, at, scale);
    return { ...base, pose, bag, bagFront: true, frontA: 1 };
  }
  // empty: the near fist keeps the neck and lets the limp bag swing down at his side; the far hand lets go
  const e = smooth((s - p1) / 34);
  // (V3 audit) the body eases from the loaded stoop to the empty walk over the same stretch as the hands (it used to
  // switch on the pour's last frame: the head jumped ~17 units)
  const qWalk = bow(walkFrom(EMPTY_BASE, s, yaw, false));
  const qFree = e < 1 ? lerpFig(bow(walkFrom(LOADED_BASE, s, yaw, true)), qWalk, e) : qWalk;
  const aFree = anchorsOf(qWalk);
  const bp = pourBag(at, scale, 1);
  const nearT = lerp2(bagPt(bp, GRIP_NECK), aFree.handR, e);
  const farT = lerp2(bagPt(bp, GRIP_BOTTOM), aFree.handL, e);
  const pose = e < 1 ? gripTo("slave", look.variant, qFree, { L: farT, R: nearT }, at, scale) : qFree;
  const hand = e < 1 ? nearT : aFree.handR;
  const swing = 8 * Math.sin((s / (2 * STRIDE)) * 2 * Math.PI);
  const bag: BagX = { A: hand, ang: mix(POUR_ANG, 90 + swing, e), sc: scale, empty: 1, open: 0.5 };
  return { ...base, pose, bag, bagFront: false, frontA: 0 };
};
/** for the audit scripts (pop detector, contact, depth order): every carrier's state, its bag's grips, on frame f */
export const auditLine = (f: number) => {
  const P = perspective(camAt(f), DEPTH);
  const out: { j: number; s: number; Z: number; at: P2; scale: number; pose: FigPose; variant: number; garb: "exomis" | "tunic"; neck: P2; bottom: P2; bagFront: boolean }[] = [];
  for (let j = SLAVE_J0; j <= SLAVE_J1; j++) {
    const st = slaveState(j, f, P);
    if (!st) continue;
    out.push({ j, s: st.s, Z: st.Z, at: st.at, scale: st.scale, pose: st.pose, variant: st.look.variant, garb: st.look.garb, neck: bagPt(st.bag, GRIP_NECK), bottom: bagPt(st.bag, GRIP_BOTTOM), bagFront: st.bagFront });
  }
  const oAt = P.at(OVERSEER[0], OVERSEER[1]);
  return { P, line: out, overseer: { at: oAt.at, scale: oAt.scale, pose: overseerPose(f) } };
};
/** how far a carrier has gone into the dark doorway (0 at the wall's plane, 1 = lost in the dark) */
const inDark = (Z: number) => smooth((Z - VILLA.z0) / 85);
/** a figure's fog: the air of its own distance (near ones keep their colour); through the door, the door's dark */
const DOOR_RGB: RGB = [46, 36, 28];
/** (V3 audit) only a carrier at the door goes into its dark: the incoming line also crosses the villa's depth out on
 *  the field (X ~ 450-550), and there it used to turn into a dark silhouette (Z 480-565) or not be drawn at all (Z >
 *  565, so carriers popped in as silhouettes at f126-135 and f158-170 in the delivered cut) */
const darkOf = (st: { s: number; Z: number }) => (st.s > S_DOOR - 30 ? inDark(st.Z) : 0);
const figFog = (A: AirCtx, Z: number, dark = 0, h = 150): FolkFog => {
  const dz = A.d(Z);
  const air = A.v.airAt(dz, h);
  return { rgb: mixRgb(air, DOOR_RGB, smooth(dark / 0.2)), amount: Math.max(A.v.fogAt(dz), 0.97 * dark) };
};
/** (V3 audit) the fetter chain a little longer than romeFolk's 74: at 74 the walking stride pulled it taut and it
 *  dropped up to ~12 units in one frame as the feet closed; at 92 it always hangs and rests on the floor */
const CHAIN_LEN = 92;
/** the driven line sinks toward DEAD (romeFolk's drain: the cloth and hair to DEAD, the skin greying) */
const drainAt = (f: number) => sinkAt(f) * DRAIN_GAIN;
const DRAIN_GAIN = 1.5;
const SlaveFig: React.FC<{ A: AirCtx; st: SlaveState; f: number; withBag: boolean }> = ({ A, st, f, withBag }) => {
  const fog = figFog(A, st.Z, darkOf(st));
  // on his back the bag is behind his body (the near fist over its neck); emptied, it hangs from the near fist in front
  const after = st.s > S_POUR + POUR;
  const bag = withBag ? <BagArt x={st.bag} fog={fog} uid={`esk${st.j}`} unitPx={A.cam.k} /> : null;
  return (
    <g>
      {after ? null : bag}
      <Slave pose={st.pose} at={st.at} scale={st.scale} uid={`esl${st.j}`} variant={st.look.variant} garb={st.look.garb} fetters={st.look.fetters} chainLen={CHAIN_LEN} collar={st.look.collar} fog={fog} drain={drainAt(f)} unitPx={A.cam.k} />
      {after ? bag : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE COINS IN FLIGHT: from the bag's mouth (where it was when the coin left) to its place on the heap
// ---------------------------------------------------------------------------
const mouthAt = (j: number, t: number, P: Persp): P2 => {
  const s = slaveS(j, t);
  const p = pathAt(s);
  const { at, scale } = P.at(p.X, p.Z);
  return bagPt(pourBag(at, scale, (s - S_POUR) / POUR), MOUTH);
};
const FlyingCoins: React.FC<{ P: Persp; f: number }> = ({ P, f }) => {
  const amt = heapAmount(f);
  const W = heapW(heapH(amt));
  const o = heapOpen(P, W);
  const { at, r } = heapXform(P);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < COIN_N; i++) {
    const t = COIN_LEAVE[i];
    if (!(t <= f && f < t + COIN_FLIGHT)) continue;
    const j = COIN_POUR[i];
    if (j === null) continue;
    const u = (f - t) / COIN_FLIGHT;
    const a = mouthAt(j, t, P);
    const [lx, ly] = coinLocal(i, o, 0);
    const b: P2 = [at[0] + lx * r, at[1] + ly * r];
    const x = mix(a[0], b[0], u) + (hash(i, 811) - 0.5) * 10 * r * Math.sin(Math.PI * u);
    const y = mix(a[1], b[1], u * u);
    out.push(<Coin key={i} x={x} y={y} tilt={(hash(i, 813) - 0.5) * 140 + 200 * u} lit={hash(i, 815) > 0.4} k={r} />);
  }
  return <g>{out}</g>;
};

// ---------------------------------------------------------------------------
// THE ALTERNATIVE: fine dashed orange outlines drawn by moving tips (perspective-correct dashes in 3D)
// ---------------------------------------------------------------------------
type Line3 = P3[];
/** the faces' fills, in the order houseLines gives them (side wall, far roof slope, near roof slope, front): the
 *  hill's own fogged tone where the face stands (so a nearer outline hides a farther one and the sketch never reads as
 *  a built house), a touch lighter or darker by the light from the upper left */
const FACE_LIGHT = [0.06, -0.07, 0.05, 0];
const faceFill = (A: AirCtx, q: P3[], i: number, side: number) => {
  const n = q.length;
  const c: P3 = [q.reduce((s, v) => s + v[0], 0) / n, q.reduce((s, v) => s + v[1], 0) / n, q.reduce((s, v) => s + v[2], 0) / n];
  const base = hillScreenTone(A, c[0], A.sy(A.P.p(c[0], c[1], c[2])[1]));
  // the side wall is lit when it faces left (the house stands right of the VP), shaded when it faces right
  const l = i === 0 ? FACE_LIGHT[0] * side : FACE_LIGHT[i % FACE_LIGHT.length];
  return l >= 0 ? mixHex(base, CREAM_AIR, l) : mixHex(base, SHADOW, -l);
};
const DASH = 24;
const GAP = 15;
const lenOf = (l: Line3) => {
  let s = 0;
  for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1], l[i][2] - l[i - 1][2]);
  return s;
};
const at3 = (l: Line3, s: number): P3 => {
  let acc = 0;
  for (let i = 1; i < l.length; i++) {
    const L = Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1], l[i][2] - l[i - 1][2]);
    if (acc + L >= s || i === l.length - 1) {
      const u = L > 0 ? c01((s - acc) / L) : 0;
      return [mix(l[i - 1][0], l[i][0], u), mix(l[i - 1][1], l[i][1], u), mix(l[i - 1][2], l[i][2], u)];
    }
    acc += L;
  }
  return l[l.length - 1];
};
/** the dashes of a 3D polyline drawn up to length upTo, projected */
const dashes = (P: Persp, l: Line3, upTo: number, dash = DASH, gap = GAP) => {
  const L = Math.min(upTo, lenOf(l));
  let d = "";
  // the vertices' arc lengths, so a dash keeps its corners
  const cum: number[] = [0];
  for (let i = 1; i < l.length; i++) cum.push(cum[i - 1] + Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1], l[i][2] - l[i - 1][2]));
  for (let a = 0; a < L; a += dash + gap) {
    const b = Math.min(L, a + dash);
    const q: P3[] = [at3(l, a)];
    for (let i = 1; i < l.length - 1; i++) if (cum[i] > a && cum[i] < b) q.push(l[i]);
    q.push(at3(l, b));
    d += `M${q.map((v) => pt(P.p(v[0], v[1], v[2]))).join("L")}`;
  }
  return d;
};
/** a structure: its lines in drawing order, drawn by one tip over [t0, t0 + dur]; washes once whole */
type Structure = { key: string; Z: number; t0: number; dur: number; lines: Line3[]; washes: P3[][]; dash?: [number, number] };
const drawStructure = (A: AirCtx, st: Structure, f: number): React.ReactNode => {
  const { P, cam } = A;
  const prog = c01((f - st.t0) / st.dur);
  if (prog <= 0) return null;
  const lens = st.lines.map(lenOf);
  const total = lens.reduce((a, b) => a + b, 0);
  let left = total * prog;
  let d = "";
  let tipP: P3 | null = null;
  for (let i = 0; i < st.lines.length; i++) {
    if (left <= 0) break;
    const take = Math.min(left, lens[i]);
    d += dashes(P, st.lines[i], take, st.dash?.[0], st.dash?.[1]);
    if (take < lens[i]) tipP = at3(st.lines[i], take);
    left -= take;
  }
  const r = P.r(st.Z);
  const sw = (3.2 * (0.55 + 0.45 * Math.min(1, r))) / cam.k;
  const wash = smooth((f - st.t0 - st.dur) / 14);
  // the faces soak in as the outline is drawn (the ground's own tone: a nearer outline hides a farther one), then a
  // faint orange wash once it is whole
  const solid = smooth(prog * 1.3);
  // the pen's tip is part of the sketch: drawn in its layer, at its depth (a nearer sketch or the villa hides it
  // exactly as it hides the lines), sized like the line it draws
  // the orange glows through the air: only a little of its distance's fog takes it
  const dz = A.d(st.Z);
  const orange = mixHex(ORANGE_HEX, rgbHex(A.v.airAt(dz, 800)), 0.05 * A.v.fogAt(dz));
  const side = st.washes.length ? Math.sign(st.washes[3].reduce((s, v) => s + v[0], 0) / st.washes[3].length - st.washes[0][0][0]) : 1;
  let tip: React.ReactNode = null;
  if (tipP && prog < 1) {
    const q = P.p(tipP[0], tipP[1], tipP[2]);
    const tr = (4.2 * (0.55 + 0.45 * Math.min(1, r))) / cam.k;
    tip = <circle cx={q[0]} cy={q[1]} r={tr} fill={orange} stroke={SHADOW} strokeOpacity={0.5} strokeWidth={1.2 / cam.k} />;
  }
  return (
    <g key={st.key}>
      {solid > 0 ? st.washes.map((q, i) => <path key={`s${i}`} d={poly(P, q)} fill={faceFill(A, q, i, side)} opacity={solid} />) : null}
      {wash > 0 ? st.washes.map((q, i) => <path key={i} d={poly(P, q)} fill={orange} opacity={0.13 * wash} />) : null}
      <path d={d} fill="none" stroke={SHADOW} strokeOpacity={0.4} strokeWidth={sw + 1.8 / cam.k} strokeLinecap="butt" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={orange} strokeWidth={sw} strokeLinecap="butt" strokeLinejoin="round" />
      {tip}
    </g>
  );
};
const circle3 = (c: P3, R: number, a0: number, n = 56, plane: "xy" = "xy"): Line3 => {
  const out: Line3 = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (2 * Math.PI * i) / n;
    out.push(plane === "xy" ? [c[0] + R * Math.cos(a), c[1] + R * Math.sin(a), c[2]] : c);
  }
  return out;
};
/** a gabled house (ridge along Z, the gable to the front) on a floor at height y0 (< 0 up a slope); the side
 *  toward the VP is seen (`left`: it stands right of the VP, so its left wall shows) */
const houseLines = (x0: number, x1: number, z0: number, z1: number, y0: number, h: number, ridge: number, door: [number, number, number] | null, left: boolean): { lines: Line3[]; washes: P3[][] } => {
  const xm = (x0 + x1) / 2;
  const xs = left ? x0 : x1;
  const xo = left ? x1 : x0;
  const t = y0 - h;
  const rg = y0 - ridge;
  const front: Line3 = [[xs, y0, z0], [xo, y0, z0], [xo, t, z0], [xm, rg, z0], [xs, t, z0], [xs, y0, z0]];
  const lines: Line3[] = [front];
  lines.push([[xs, y0, z0], [xs, y0, z1], [xs, t, z1], [xs, t, z0]]);
  lines.push([[xm, rg, z0], [xm, rg, z1], [xs, t, z1]]);
  lines.push([[xo, t, z0], [xo, t, z1], [xm, rg, z1]]);
  if (door) lines.push([[door[0], y0, z0], [door[0], y0 - door[2], z0], [door[1], y0 - door[2], z0], [door[1], y0, z0]]);
  // the faces we see (painted in the ground's tone so a nearer outline hides a farther one): the side wall, the two
  // roof slopes, the front
  const washes: P3[][] = [
    [[xs, y0, z0], [xs, y0, z1], [xs, t, z1], [xs, t, z0]],
    [[xo, t, z0], [xm, rg, z0], [xm, rg, z1], [xo, t, z1]],
    [[xs, t, z0], [xm, rg, z0], [xm, rg, z1], [xs, t, z1]],
    [[x0, y0, z0], [x1, y0, z0], [x1, t, z0], [xm, rg, z0], [x0, t, z0]],
  ];
  return { lines, washes };
};
const AMPHORA: P2[] = [[0, 0], [-10, -18], [-20, -52], [-17, -82], [-8, -92], [-7, -104], [7, -104], [8, -92], [17, -82], [20, -52], [10, -18], [0, 0]];
const MILL_STRUCT = (f: number): Structure[] => {
  const M = MILL;
  const wh = M.wheel;
  const rot = wheelAngle(f);
  const zf = wh.Z - wh.w / 2;
  const zb = wh.Z + wh.w / 2;
  const c: P3 = [wh.X, wh.Y, zf];
  const rimF = circle3(c, wh.R, -Math.PI / 2 + rot);
  const rimB = circle3([wh.X, wh.Y, zb], wh.R, -Math.PI / 2 + rot);
  const hub = circle3(c, 26, rot, 20);
  const spokes: Line3[] = [];
  const paddles: Line3[] = [];
  for (let i = 0; i < 8; i++) {
    const a = rot + (i * Math.PI) / 4;
    spokes.push([[wh.X + 26 * Math.cos(a), wh.Y + 26 * Math.sin(a), zf], [wh.X + wh.R * Math.cos(a), wh.Y + wh.R * Math.sin(a), zf]]);
  }
  for (let i = 0; i < 16; i++) {
    const a = rot + (i * Math.PI) / 8;
    const r0 = wh.R;
    const r1 = wh.R + 26;
    paddles.push([[wh.X + r0 * Math.cos(a), wh.Y + r0 * Math.sin(a), zf], [wh.X + r1 * Math.cos(a), wh.Y + r1 * Math.sin(a), zf], [wh.X + r1 * Math.cos(a), wh.Y + r1 * Math.sin(a), zb]]);
  }
  const axle: Line3 = [[wh.X, wh.Y, zb], [wh.X, wh.Y, M.z0]];
  const house = houseLines(M.x0, M.x1, M.z0, M.z1, M.y0, M.h, M.ridge, [M.door.x0, M.door.x1, M.door.h], true);
  // the wheel first (the machine), then the mill house round it
  const wheel: Structure = { key: "mill-w", Z: wh.Z, t0: MILL_T0, dur: MILL_DUR * 0.45, lines: [rimF, ...spokes, hub, rimB, ...paddles], washes: [] };
  const mh: Structure = { key: "mill-h", Z: M.z0, t0: MILL_T0 + MILL_DUR * 0.4, dur: MILL_DUR * 0.6, lines: [axle, ...house.lines], washes: house.washes };
  return [mh, wheel];
};
const houseStruct = (h: House): Structure[] => {
  const x0 = h.X - h.w / 2;
  const x1 = h.X + h.w / 2;
  const z0 = h.Z - h.d / 2;
  const z1 = h.Z + h.d / 2;
  const dw = 54;
  const dx = h.X + (hash(h.seed, 21) - 0.5) * (h.w - dw - 30);
  const hl = houseLines(x0, x1, z0, z1, h.Y0, h.h, h.ridge, [dx - dw / 2, dx + dw / 2, Math.min(h.h - 30, 140)], h.X > 0);
  const out: Structure[] = [{ key: `h${h.seed}`, Z: z0, t0: h.t0, dur: h.dur, lines: hl.lines, washes: hl.washes }];
  if (h.goods) {
    // the stall's goods in front of the house: amphorae and a sack, drawn once the house is up
    const n = 2 + Math.floor(hash(h.seed, 23) * 2);
    const gl: Line3[] = [];
    for (let i = 0; i < n; i++) {
      const gx = x0 + 34 + i * 52;
      const gz = z0 - 46 - (i % 2) * 14;
      gl.push(AMPHORA.map(([ax, ay]) => [gx + ax * 1.25, h.Y0 + ay * 1.25, gz] as P3));
    }
    // a plank counter
    gl.push([[x1 - 90, h.Y0 - 64, z0 - 52], [x1 - 6, h.Y0 - 64, z0 - 52], [x1 - 6, h.Y0, z0 - 52]]);
    gl.push([[x1 - 90, h.Y0, z0 - 52], [x1 - 90, h.Y0 - 64, z0 - 52]]);
    out.push({ key: `g${h.seed}`, Z: z0 - 50, t0: h.t0 + h.dur * 0.85, dur: 10, lines: gl, washes: [], dash: [13, 7] });
  }
  return out;
};
const VILLAGE: Structure[] = HOUSES.flatMap(houseStruct);

// ---------------------------------------------------------------------------
// THE MASTER (reclining, his cup) and THE OVERSEER
// ---------------------------------------------------------------------------
/** the overseer faces the incoming line (dir 1), rod in his near fist. raiseRod blends two elbow hints, and the hand's
 *  thumb side (so the rod's direction) follows the elbow hint: in mid-raise the rod flipped ~160 deg in one frame
 *  (audit, f114/115 and f167/168). Holding the near elbow's hint at the resting value keeps the rod turning
 *  continuously: raised, it cocks back over his head; the stroke swings it forward. */
const overseerPose = (f: number): FigPose => {
  const q = POSES.raiseRod(1, rodAt(f));
  return idle(headTurn({ ...q, armL: { ...q.armL, elbow: [-0.3, 1] } }, 0.75, 6), f, 7, 0.8);
};
export const masterPose = (f: number): FigPose => {
  const q = POSES.recline(1);
  const look = 0.06 * Math.sin(f / 31);
  return idle({ ...q, headYaw: q.headYaw + 0.08 + look, pitch: q.pitch + 4 }, f, 3, 0.6);
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
type Item = { Z: number; key: string; el: React.ReactNode };
/** the stage's motes placed for this cut: AirStage lays its motes (and shafts) out against the camera's travel; a
 *  constant offset reshuffles them so no mote rides a carrier's, the overseer's or the master's head for more than 3
 *  frames (at no offset a mid mote sat on the master's head for 124 frames and on each carrier's in turn: audit
 *  motes48.ts). The air, fog and ground use the true view. */
const MOTE_OFFSET = { x: 0.74, y: 0.89 };
const moteView = (v: AirView): AirView => ({ ...v, travel: { x: v.travel.x + MOTE_OFFSET.x, y: v.travel.y + MOTE_OFFSET.y, z: v.travel.z } });
/** the medium for frame f (also for the audit scripts) */
export const airCtxAt = (f: number): AirCtx => {
  const cam = camAt(f);
  const P = perspective(cam, DEPTH);
  const c0 = camAt(0);
  const P0 = perspective(c0, DEPTH);
  const sy = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const v = makeAirView({
    scene: { ...AIR_SCENE, F: P.Dc * cam.k },
    frame: f,
    horizon: sy(P.horizonY),
    cam: { x: cam.cx, y: -DEPTH.eyeY, z: -P.Dc },
    rest: { x: c0.cx, y: -DEPTH.eyeY, z: -P0.Dc },
  });
  const d = (Z: number) => P.Dc + Z;
  return { v, P, cam, d, tone: (hex, Z, h = 0) => fogHex(v, hex, d(Z), h), fogZ: (Z) => v.fogAt(d(Z)), sy };
};
const ExtractNotCreate: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const A = airCtxAt(f);
  const { P, cam } = A;
  const items: Item[] = [];
  const shadows: React.ReactNode[] = [];

  // the alternative (all of it stands beyond the stream, behind everything solid)
  const alt: { Z: number; body: React.ReactNode }[] = [];
  for (const st of [...MILL_STRUCT(f), ...VILLAGE]) {
    const body = drawStructure(A, st, f);
    if (body) alt.push({ Z: st.Z, body });
  }
  alt.sort((a, b) => b.Z - a.Z);

  // the villa, the kerb
  items.push({ Z: VILLA.z0, key: "villa", el: <Villa key="villa" A={A} /> });
  items.push({ Z: TERRACE_EDGE + 6, key: "kerb", el: <Kerb key="kerb" A={A} /> });
  items.push({ Z: PODIUM_Z, key: "podium", el: <Podium key="podium" A={A} /> });

  // the line
  const doorClip = poly(P, doorQuad());
  for (let j = SLAVE_J0; j <= SLAVE_J1; j++) {
    const st = slaveState(j, f, P);
    if (!st) continue;
    const sx = 540 + (st.at[0] - cam.cx) * cam.k;
    if (sx < -260 || sx > 1340) continue;
    const inside = st.s > S_DOOR - 30 && st.Z > VILLA.z0;
    // through the door he sinks into the dark interior; gone only once he is lost in it
    if (darkOf(st) >= 1) continue;
    if (inside) {
      items.push({
        Z: VILLA.z0 - 0.5,
        key: `in${j}`,
        el: (
          <g key={`in${j}`} clipPath="url(#ec-door)">
            <SlaveFig A={A} st={st} f={f} withBag />
          </g>
        ),
      });
      continue;
    }
    shadows.push(<AirShadow key={`cs${j}`} A={A} X={st.X} Z={st.Z} w={52} d={26} uid={`ecs${j}`} amt={0.85} />);
    items.push({ Z: st.Z, key: `sl${j}`, el: <SlaveFig key={`sl${j}`} A={A} st={st} f={f} withBag={st.frontA < 1} /> });
    if (st.bagFront) {
      // the bag swung out over the heap is drawn in front of the heap
      items.push({ Z: HEAP_C[1] - 2, key: `sk${j}`, el: (
          <g key={`sk${j}`} opacity={st.frontA}>
            <BagArt x={st.bag} fog={figFog(A, st.Z)} uid={`esf${j}`} unitPx={cam.k} />
          </g>
        ),
      });
    }
  }

  // the heap and the coins in flight
  const Wnow = heapW(heapH(heapAmount(f)));
  shadows.push(<AirShadow key="csh" A={A} X={HEAP_C[0]} Z={HEAP_C[1]} w={Wnow * 1.08} d={Wnow * 0.9} uid="ecsh" amt={0.85} />);
  items.push({ Z: HEAP_C[1], key: "heap", el: <Heap key="heap" A={A} f={f} /> });
  items.push({ Z: HEAP_C[1] - 3, key: "fly", el: <FlyingCoins key="fly" P={P} f={f} /> });

  // the master on his couch
  const cAt = P.at(COUCH_X, COUCH_Z);
  const mFog = figFog(A, COUCH_Z);
  shadows.push(<AirShadow key="csc" A={A} X={COUCH_X} Z={COUCH_Z} w={195} d={48} uid="ecsc" amt={0.9} />);
  items.push({
    Z: COUCH_Z,
    key: "master",
    el: (
      <g key="master">
        <Couch at={cAt.at} scale={cAt.scale} uid="ecouch" dir={1} fog={mFog} unitPx={cam.k} />
        <Dominus pose={masterPose(f)} at={reclineAt(cAt.at, cAt.scale, 1)} scale={cAt.scale} uid="edom" variant={1} stripe held="cup" fog={mFog} unitPx={cam.k} />
      </g>
    ),
  });

  // the overseer, behind the line, facing it, his rod
  const oAt = P.at(OVERSEER[0], OVERSEER[1]);
  shadows.push(<AirShadow key="cso" A={A} X={OVERSEER[0]} Z={OVERSEER[1]} w={62} d={30} uid="ecso" />);
  items.push({
    Z: OVERSEER[1],
    key: "ovs",
    el: <Overseer key="ovs" pose={overseerPose(f)} at={oAt.at} scale={oAt.scale} uid="eovs" variant={0} fog={figFog(A, OVERSEER[1])} unitPx={cam.k} />,
  });

  items.sort((a, b) => b.Z - a.Z);
  return (
    <AirStage v={moteView(A.v)} bloom={0.22}>
      <WorldSvg cam={cam}>
        <defs>
          <clipPath id="ec-door">
            <path d={doorClip} />
          </clipPath>
        </defs>
        <Ground A={A} f={f} />
        {alt.map((a) => a.body)}
        {shadows}
        {items.map((it) => it.el)}
      </WorldSvg>
    </AirStage>
  );
};

export default ExtractNotCreate;
