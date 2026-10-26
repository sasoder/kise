// ---------------------------------------------------------------------------
// takeoffWorld — THE RIDGE OF HISTORY (kyle-rome-industrial; built with cut 4 CatalyzeTheTakeoff, reused by cut 77
// PrecociouslyFar). Dwarkesh 3D style (styles/dwarkesh-3d.md): one landscape inside the misty teal air (palette A).
// Contract for cut 77: <notes>/TAKEOFF_READY.md.
//
// THE PICTURE (restage 2). The road of human living standards laid out as a landscape seen ACROSS: time runs left ->
// right from the far past (deep in the haze, back left) past ROME, a low raised plateau (8 m) crowned by a compact
// Roman town (temple front, red-tile roofs, an aqueduct run, a basalt-paved street with RomeFolk), then a long flat
// plain (a few farmsteads) toward the viewer and right to THE KNEE, where the ground bends sharply and climbs out of
// the top right: an exponential bend A (e^(x/L) - 1) straightening into a ~63-degree ramp. Up it, stepped on stone
// terraces, six big red-brick mills (rows of orange-lit windows) with tall chimneys, the four highest trailing soft
// grey-brown plumes back over the sky with the wind (each its own length, width and drift); a beam-engine house at the foot (its orange beam rocking); a rail line along the ramp's
// near edge with a steam locomotive, tender and three wagons climbing it (orange boiler bands and firebox, white
// steam). The ramp's silhouette against the air draws the hockey stick. Orange = the technology, the only orange in
// the world. "AD 100" (a milestone on Rome's street) and "1800" (a broad carved stone at the knee) are the only text.
//
// REV 1 (the user's notes, Oct 26: "the train is glitching, the buildings seem glitched in, it looks unfinished"):
// every mill and the engine house stand on a TERRACE cut into the hill (TERRACES: a level floor, an earth cut face
// uphill, a stone fill wall downhill); mills grow up out of their terrace one by one (body, then the cornice and the
// roof, then the chimney, then the smoke); windows sit in recessed reveals; real hipped roofs with eaves. The road of
// history bends into the rail without a break (TRACK: one spline from the road to the ramp's near edge, ballast,
// sleepers, two rails); the train runs on it with spoked turning wheels and continuous steam. The ramp's top rounds
// over into its flanks (SHOULDER) under a cream crest rim; contours are faint and keep off the track.
//
// UNITS: metres. X across (right +), Z forward (away from the viewer +), h height (up +); the kit's Y = -h.
// Rome's centre (0, 0). The town's street runs along D1 (streetAt(s)). The road of history: roadAt(s) from ROAD0
// (the town's east side) along DT (toward the viewer and right) to the knee at s = KNEE_S; the climb runs along D2
// (40 degrees off X: right and away) in its own frame climbP(s, n, h) (s from the knee, n across, + toward the
// viewer; the ramp spans n CLIMB.nFar..CLIMB.halfW); climbH(s), climbSlope(s).
//
// THE CAMERA: a pinhole that never rotates (one-point perspective, verticals vertical): eye (X, H, Z), focal F px, the
// vanishing point on screen at (540 + sx, hr): a lens shift frames without a tilt.
//   project(c, X, h, Z) -> [x, y] screen px;  rOf(c, Z) = F / (Z - c.Z) px per metre at depth Z;  perspOf(c) the kit
//   Persp (so the kit's AirCyl / AirShadow draw on it). Draw inside a plain 1080x1920 svg (screen px).
//
// THE AIR: a ground haze. Fog by an optical distance: the visibility grows with the eye's height (VIS_A x eye
// height ^ VIS_K), and once the eye is up out of it (HAZE_EYE) rays to high things cross less of the haze (HAZE_TOP,
// HAZE_FALL); nothing within fogNear (45 m) fogs; far things melt into the backdrop behind their screen row. So a crane-up clears the view of the far ramp (cause: the rise), and the upper ramp stands
// out of the haze above its foot. Orange glows through light haze and drowns in dense haze.
//   airOf(c, frame, rest) -> TAir: the kit's AirWorld (v for <AirStage>, P, tone / toneO / fog / airHex / folkFog ...)
//   plus .fogH / .toneH / .toneOH / .airH / .folkFogH by height (h, metres) and .c (the camera).
//
// DRAWING: <TakeoffWorld A frame font extras? hide? uid? build? /> draws the whole world in two passes (stable under
//   any camera that looks along +Z). GROUND first: the plain and the road of history on it, Rome's plateau (its
//   ground, the street's paving) with the road redrawn over it, the climb's top (terraces cut into it, contours), the
//   track (the road bending into the rail: TRACK), the crest rims. Then OBJECTS sorted far to near by world Z: the
//   climb's flanks, every building, figure, milestone, farm, terrace wall, mill, chimney, smoke plume and the train.
//   So no ground quad ever covers a mill or a wagon. extras: [{ d, key, el, terrain? }] sort in with the objects
//   (d = the item's world Z). hide: { town, figures, industry, milestones, train, smoke }. build (a frame, optional):
//   the mills' rise clock (BUILD, millGrowth, chimGrowth, smokeStart); leave it out and the industry is fully built.
//   font: the milestones' inscription face (cut 4 loads Cinzel 700). Helpers for extras: Solid / boxFaces /
//   gableFaces (convex solids lit and fogged), lwAt, project, rOf, FIG_M (metres per RomeFolk unit: a figure's
//   scale = rOf(c, Z) * FIG_M, unitPx 1, fog A.folkFogH(Z, ground h)), terrainH(X, Z).
// ---------------------------------------------------------------------------
import React from "react";
import { random } from "remotion";
import {
  ACCENT,
  ACCENT_DEEP,
  AIR,
  AirCyl,
  AirShadow,
  MAT,
  ORANGE_LINE,
  RomeFolk,
  PandemicFolk,
  c01,
  formTone,
  lerp,
  lineOf,
  makeAirView,
  mixHex,
  rgbHex,
  smoothstep,
  type AirScene,
  type AirView,
  type AirWorld,
  type Mat,
  type P2,
  type Persp,
} from "../kits/dwarkesh-3d/dwarkesh3d";

const PAL = AIR.A;
export const W = 1080;
export const H = 1920;
const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
const pt = (v: P2) => `${fx(v[0])},${fx(v[1])}`;
const poly = (q: P2[]) => `M${q.map(pt).join("L")}Z`;

// ===================================================================================================================
// GEOMETRY
// ===================================================================================================================
/** metres per RomeFolk unit (a man ~312 units = 1.75 m) */
export const FIG_M = 1.75 / 312;
const norm2 = (x: number, z: number): [number, number] => {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
};
/** Rome's centre */
export const ROME = { X: 0, Z: 0 };
/** the town's paved street (cut 4's opening looks up it to the temple): through Rome's centre along D1 */
export const D1 = norm2(-0.16, 1);
export const ROAD_W = 7;
export const streetAt = (s: number) => ({ X: ROME.X + s * D1[0], Z: ROME.Z + s * D1[1], dx: D1[0], dz: D1[1] });
/** THE ROAD OF HISTORY (time = s, metres): from the far past (behind and left of Rome) past the town's east side
 *  (ROAD0, s = 0) toward the viewer and right along DT across the long flat to THE KNEE (s = KNEE_S); from there the
 *  ground climbs along D2 (right and away). Seen from in front-left of the knee, time runs left -> right. */
export const DT = norm2(0.45, -1);
export const ROAD0 = { X: 24, Z: 0 };
export const KNEE_S = 118;
export const roadAt = (s: number) => ({ X: ROAD0.X + s * DT[0], Z: ROAD0.Z + s * DT[1], dx: DT[0], dz: DT[1] });
export const KNEE = roadAt(KNEE_S);
export const CLIMB_ANG = 40;
export const D2 = norm2(Math.cos((CLIMB_ANG * Math.PI) / 180), Math.sin((CLIMB_ANG * Math.PI) / 180));
/** Rome's plateau: a low raised table (h m) under the town, soft-edged (edge m), its footprint in X and Z */
export const PLATEAU = { h: 8, x0: -44, x1: 40, z0: -34, z1: 58, edge: 24 };
/** the climb: an exponential bend that straightens into a steep ramp (slope capped at `mMax`) */
export const CLIMB = { A: 2.2, L: 20, mMax: 2.0, halfW: 58, nFar: -26, flank: 5 };
const CLIMB_XC = (() => {
  const m = CLIMB.mMax;
  const xc = CLIMB.L * Math.log((m * CLIMB.L) / CLIMB.A);
  return { xc, hc: CLIMB.A * (Math.exp(xc / CLIMB.L) - 1) };
})();
/** the climb's height above the flat at x metres past the knee */
export const climbH = (x: number) => {
  if (x <= 0) return 0;
  if (x <= CLIMB_XC.xc) return CLIMB.A * (Math.exp(x / CLIMB.L) - 1);
  return CLIMB_XC.hc + CLIMB.mMax * (x - CLIMB_XC.xc);
};
export const climbSlope = (x: number) => (x <= 0 ? 0 : x <= CLIMB_XC.xc ? (CLIMB.A / CLIMB.L) * Math.exp(x / CLIMB.L) : CLIMB.mMax);
const edgeRamp = (v: number, a: number, b: number, e: number) => smoothstep(a - e, a, v) * (1 - smoothstep(b, b + e, v));
const plateauAt = (X: number, Z: number) => PLATEAU.h * edgeRamp(X, PLATEAU.x0, PLATEAU.x1, PLATEAU.edge) * edgeRamp(Z, PLATEAU.z0, PLATEAU.z1, PLATEAU.edge);
/** the climb's own frame: along D2 from the knee (s) and across (n, + toward the viewer's side) */
const climbLocal = (X: number, Z: number) => {
  const dx = X - KNEE.X;
  const dz = Z - KNEE.Z;
  return { s: dx * D2[0] + dz * D2[1], n: dx * D2[1] - dz * D2[0] };
};
/** the ramp's rounded shoulders: the top curves down over its last SHOULDER m on each side into the flanks */
export const SHOULDER = { w: 9, drop: 5 };
/** the top's height across (n) at a given crest height: level, then a rounded lip at both edges */
const topAcross = (top: number, n: number) => {
  const inN = CLIMB.halfW - SHOULDER.w;
  const inF = CLIMB.nFar + SHOULDER.w;
  const t = n > inN ? (n - inN) / SHOULDER.w : n < inF ? (inF - n) / SHOULDER.w : 0;
  return top - SHOULDER.drop * Math.min(top / 12, 1) * t * t;
};
/** TERRACES: level platforms cut half into the slope (half cut, half fill) under each mill and the engine house:
 *  s0..s1 along the climb, n0..n1 across; the floor at the slope's height at the middle */
export type Terrace = { s0: number; s1: number; n0: number; n1: number; g: number };
const slopeAt = (s: number, n: number) => {
  const top = climbH(s);
  const out = n >= 0 ? Math.max(0, n - CLIMB.halfW) : Math.max(0, CLIMB.nFar - n);
  return Math.max(0, out > 0 ? topAcross(top, n >= 0 ? CLIMB.halfW : CLIMB.nFar) - out * CLIMB.flank : topAcross(top, n));
};
const climbAt = (X: number, Z: number) => {
  const { s, n } = climbLocal(X, Z);
  for (const t of TERRACES_LIST) if (s >= t.s0 && s <= t.s1 && n >= t.n0 && n <= t.n1) return t.g;
  return slopeAt(s, n);
};
/** the living-standard profile along the road of history: Rome's plateau, the flat, the climb */
export const profileH = (s: number) => (s >= KNEE_S ? climbH(s - KNEE_S) : plateauAt(roadAt(s).X, roadAt(s).Z));
/** the ground height anywhere */
export const terrainH = (X: number, Z: number) => Math.max(plateauAt(X, Z), climbAt(X, Z));

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export type TCam = { X: number; H: number; Z: number; F: number; sx: number; hr: number };
export const CAM_NEAR = 0.6;
export const rOf = (c: TCam, Z: number) => c.F / Math.max(Z - c.Z, CAM_NEAR);
export const project = (c: TCam, X: number, h: number, Z: number): P2 => {
  const r = rOf(c, Z);
  return [540 + c.sx + (X - c.X) * r, c.hr - (h - c.H) * r];
};
/** clip a 3D polygon ([X, h, Z] points) to the part in front of the eye's near plane (Sutherland-Hodgman) */
export const clipNear = (q: [number, number, number][], c: TCam, near = CAM_NEAR * 1.5): [number, number, number][] => {
  const zMin = c.Z + near;
  const out: [number, number, number][] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    const ina = a[2] >= zMin;
    const inb = b[2] >= zMin;
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = (zMin - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, zMin]);
    }
  }
  return out;
};
export const lerpCam = (a: TCam, b: TCam, t: number): TCam => ({
  X: lerp(a.X, b.X, t),
  H: lerp(a.H, b.H, t),
  Z: lerp(a.Z, b.Z, t),
  F: lerp(a.F, b.F, t),
  sx: lerp(a.sx, b.sx, t),
  hr: lerp(a.hr, b.hr, t),
});
/** the kit's Persp for this camera (3D terms: vp[0] = the eye's X, horizonY = -eye height) */
export const perspOf = (c: TCam): Persp => ({
  cam: { k: 1, cx: 540, cy: 960 },
  opts: { eyeY: -c.H, dRef: c.F, kRef: 1, dolly: 0 },
  Dc: c.F,
  r: (Z: number) => rOf(c, Z),
  p: (X: number, Y: number, Z: number) => project(c, X, -Y, Z),
  at: (X: number, Z: number) => ({ at: project(c, X, terrainH(X, Z), Z), scale: rOf(c, Z) }),
  vp: [c.X, -c.H],
  horizonY: -c.H,
  zNear: c.Z + CAM_NEAR,
});

// ===================================================================================================================
// THE AIR
// ===================================================================================================================
/** the ground haze: the visibility (m) grows as the eye rises out of the dense low air: VIS_A * (eye height) ^ VIS_K
 *  (~42 m from 14 m up, ~150 m from 40 m, ~880 m from 170 m) */
export const VIS_A = 0.124;
export const VIS_K = 2.16;
/** above HAZE_TOP (m) the haze thins: the optical distance falls as 1 / (1 + (h - HAZE_TOP) / HAZE_FALL) */
export const HAZE_TOP = 25;
export const HAZE_FALL = 110;
/** the eye heights (m) between which it rises out of the low haze (the high-things-are-clearer term fades in) */
export const HAZE_EYE: [number, number] = [18, 60];
export const AIR_SCENE: AirScene = { look: "A", mood: "day", F: 1100, fogNear: 45, fogVis: 230, fogMax: 0.96, hLow: 0, hHigh: 260, moteUnit: 26 };
export type TAir = AirWorld & {
  c: TCam;
  /** the optical distance to depth Z at height h (m) */
  optD: (Z: number, h: number) => number;
  fogH: (Z: number, h: number) => number;
  toneH: (hex: string, Z: number, h: number) => string;
  toneOH: (hex: string, Z: number, h: number) => string;
  airH: (Z: number, h: number) => string;
  folkFogH: (Z: number, h: number) => RomeFolk.FolkFog;
};
export const airOf = (c: TCam, frame: number, rest: TCam, scene: Partial<AirScene> = {}): TAir => {
  const v: AirView = makeAirView({
    scene: { ...AIR_SCENE, ...scene, F: c.F },
    frame,
    horizon: c.hr,
    cam: { x: c.X, y: c.H, z: c.Z },
    rest: { x: rest.X, y: rest.H, z: rest.Z },
  });
  const P = perspOf(c);
  const vis = VIS_A * Math.pow(Math.max(1, c.H), VIS_K);
  // how far the eye has risen out of the low haze: from street level every ray crosses it, high or low
  const eyeOut = smoothstep(HAZE_EYE[0], HAZE_EYE[1], c.H);
  const sc = { ...AIR_SCENE, ...scene };
  // ... and a ray to something high crosses less of the low haze (the upper ramp stands out of the haze above its foot)
  const optD = (Z: number, h: number) => {
    const d = Math.max(0, Z - c.Z);
    const hb = 1 / (1 + (Math.max(0, h - HAZE_TOP) / HAZE_FALL) * eyeOut);
    return d <= sc.fogNear ? d : sc.fogNear + ((d - sc.fogNear) * sc.fogVis * hb) / vis;
  };
  const fogH = (Z: number, h: number) => c01(v.fogAt(optD(Z, h)));
  // the air in front of a thing: the medium at its distance and height, melting into the backdrop behind its screen row
  // as the distance grows (far things dissolve into the air, they do not stand out of it as a darker shape)
  const airH = (Z: number, h: number) => {
    const d = Math.max(0, Z - c.Z);
    const w = smoothstep(90, 480, d);
    const a = v.airAt(d, h);
    if (w <= 0) return rgbHex(a);
    const sy = c.hr - (h - c.H) * (c.F / Math.max(d, CAM_NEAR));
    const b = v.airAtScreen(Math.max(-200, Math.min(2100, sy)));
    return rgbHex([a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w]);
  };
  const toneH = (hex: string, Z: number, h: number) => mixHex(hex, airH(Z, h), fogH(Z, h));
  const toneOH = (hex: string, Z: number, h: number) => {
    const f = fogH(Z, h);
    return mixHex(hex, airH(Z, h), 0.4 * f + 0.6 * f * f * f);
  };
  const FF = { near: 12, max: 0.85 };
  const figFogH = (Z: number, h: number) => (Z - c.Z < FF.near ? 0 : Math.min(FF.max, fogH(Z, h + 1)));
  const folkFogH = (Z: number, h: number): RomeFolk.FolkFog => ({ rgb: airH(Z, h + 1), amount: figFogH(Z, h) });
  // the kit's AirWorld (ground level h = 0 versions) so AirBox / AirCyl / AirShadow work on this camera
  const fog = (Z: number) => fogH(Z, 0);
  const airHex = (Z: number, h = 0) => airH(Z, h);
  const tone = (hex: string, Z: number, h = 0) => toneH(hex, Z, h);
  const toneO = (hex: string, Z: number, h = 0) => toneOH(hex, Z, h);
  return {
    v,
    P,
    cam: P.cam,
    Dc: c.F,
    k: 1,
    c,
    optD,
    fog,
    airHex,
    tone,
    toneO,
    screenAir: (sy: number) => rgbHex(v.airAtScreen(sy)),
    figFog: (Z: number) => figFogH(Z, 0),
    folkFog: (Z: number, feetH = 0) => folkFogH(Z, feetH),
    workerInks: (Z: number, feetH = 0) => {
      const air = airH(Z, feetH + 1);
      const t = figFogH(Z, feetH);
      return Object.fromEntries(Object.entries(PandemicFolk.WORKER_INKS).map(([key, col]) => [key, key === "orange" ? col : mixHex(col, air, t)])) as typeof PandemicFolk.WORKER_INKS;
    },
    lw: (b = 1.1) => b,
    fogH,
    toneH,
    toneOH,
    airH,
    folkFogH,
  };
};

// ===================================================================================================================
// DRAWING HELPERS
// ===================================================================================================================
/** a drawable sorted by its world depth d; terrain quads are clipped at the lens instead of culled */
export type Item = { d: number; key: string; el: React.ReactNode; terrain?: boolean };
/** the light: from the upper left, a little from the front (the style's soft form light) */
const LIGHT = (() => {
  const v = [-0.7, 0.62, -0.32];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((q) => q / l) as [number, number, number];
})();
const ndl = (n: [number, number, number]) => n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
const nrm = (v: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
/** a soil / grass local colour for the land (warm sand-umber, the style's ground) */
export const LAND: Mat = { lit: "#8C7C5D", mid: "#73654B", dark: "#3E3429" };
const ROAD_MAT: Mat = { lit: "#9E8D6E", mid: "#857659", dark: "#4A3F31" };
/** a land colour lit by its normal (the flat reads as one tone: the light's flat value) */
const landTone = (n: [number, number, number], m: Mat = LAND) => formTone(m, ndl(n), PAL.shadow, 0.3);
const FLAT_TONE = landTone([0, 1, 0]);
/** the ground right under the lens sinks toward the medium's shadow (the dense low air): no flat dead face at the bottom */
const NEAR_SINK = 0.26;

/** the plain: one continuous tone by screen row (a ground plane's distance is a function of its row) */
const Plain: React.FC<{ A: TAir; id: string }> = ({ A, id }) => {
  const c = A.c;
  const N = 36;
  const y0 = c.hr + 0.5;
  const y1 = H + 4;
  if (y0 >= y1) return null;
  const stops = Array.from({ length: N + 1 }, (_, i) => {
    const t = i / N;
    const y = y0 + Math.pow(t, 2.2) * (y1 - y0);
    const d = (c.H * c.F) / Math.max(0.5, y - c.hr);
    const near = c01((60 - d) / 50);
    const base = mixHex(FLAT_TONE, PAL.shadow, NEAR_SINK * near * near);
    return <stop key={i} offset={fx((y - y0) / (y1 - y0))} stopColor={A.toneH(base, c.Z + d, 0)} />;
  });
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={fx(y0)} x2={0} y2={fx(y1)}>
          {stops}
        </linearGradient>
      </defs>
      <rect x={-20} y={fx(y0)} width={W + 40} height={fx(y1 - y0)} fill={`url(#${id})`} />
    </g>
  );
};
/** the horizon as a soft zone over the ground only */
const HorizonHaze: React.FC<{ A: TAir; id: string; below?: number }> = ({ A, id, below = 170 }) => {
  const c = A.c;
  const col = A.screenAir(c.hr + 4);
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={fx(c.hr - 2)} x2="0" y2={fx(c.hr + below)}>
          {[0, 0.2, 0.45, 0.7, 1].map((s) => (
            <stop key={s} offset={s} stopColor={col} stopOpacity={Math.pow(1 - s, 1.8).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={-20} y={fx(c.hr - 2)} width={W + 40} height={below} fill={`url(#${id})`} />
    </g>
  );
};

/** a terrain patch as a grid of quads in a local (u, v) frame -> world, each lit by its normal and fogged by its own
 *  distance and height; returned as depth-sorted items (the caller merges them with the objects standing on it) */
type Deco = (A: TAir, u0: number, u1: number, v0: number, v1: number, zm: number, hm: number) => React.ReactNode;
const patchItems = (A: TAir, key: string, map: (u: number, v: number) => [number, number, number], us: number[], vs: number[], matOf: (u: number, v: number) => Mat, bias = 0, deco?: Deco): Item[] => {
  const c = A.c;
  const out: Item[] = [];
  const g: [number, number, number][][] = us.map((u) => vs.map((v) => map(u, v)));
  for (let i = 0; i < us.length - 1; i++) {
    for (let j = 0; j < vs.length - 1; j++) {
      const q = [g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]];
      const zm = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
      if (Math.max(q[0][2], q[1][2], q[2][2], q[3][2]) < c.Z + CAM_NEAR) continue;
      const hm = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
      // the face normal from the diagonals
      const a = [q[2][0] - q[0][0], q[2][1] - q[0][1], q[2][2] - q[0][2]];
      const b = [q[3][0] - q[1][0], q[3][1] - q[1][1], q[3][2] - q[1][2]];
      let n = nrm([a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
      if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
      // a face turned away from the eye is hidden
      const xm = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
      const toEye = [c.X - xm, c.H - hm, c.Z - zm];
      if (n[0] * toEye[0] + n[1] * toEye[1] + n[2] * toEye[2] < 0) continue;
      const near = c01((60 - (zm - c.Z)) / 50);
      const col = A.toneH(mixHex(landTone(n, matOf((us[i] + us[i + 1]) / 2, (vs[j] + vs[j + 1]) / 2)), PAL.shadow, NEAR_SINK * near * near), zm, hm);
      const qc = Math.min(q[0][2], q[1][2], q[2][2], q[3][2]) < c.Z + CAM_NEAR * 1.5 ? clipNear(q, c) : q;
      if (qc.length < 3) continue;
      const pts = qc.map((p) => project(c, p[0], p[1], p[2]));
      const extra = deco ? deco(A, us[i], us[i + 1], vs[j], vs[j + 1], zm, hm) : null;
      out.push({
        d: zm + bias,
        terrain: true,
        key: `${key}${i}_${j}`,
        el: extra ? (
          <g key={`${key}${i}_${j}`}>
            <path d={poly(pts)} fill={col} stroke={col} strokeWidth={0.6} strokeLinejoin="round" />
            {extra}
          </g>
        ) : (
          <path key={`${key}${i}_${j}`} d={poly(pts)} fill={col} stroke={col} strokeWidth={0.6} strokeLinejoin="round" />
        ),
      });
    }
  }
  return out;
};
const range = (a: number, b: number, n: number, pw = 1) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * Math.pow(i / n, pw));

/** the town's paved street: polygonal basalt slabs (a jittered grid fixed in the world), joints in a darker local
 *  tone, fading with the haze and where the slabs get too small on screen to read */
const PAVE = { s0: -58, s1: 30, row: 0.78, col: 0.95 };
const BASALT_J = "#4A4036";
const paveDeco: Deco = (A, u0, u1, v0, v1, zm, hm) => {
  const c = A.c;
  if (u1 < PAVE.s0 || u0 > PAVE.s1 || Math.abs((v0 + v1) / 2) > ROAD_W / 2) return null;
  const rr = rOf(c, zm);
  const vis = (1 - A.fogH(zm, hm)) * smoothstep(5, 14, rr * PAVE.row) * (1 - 0.65 * smoothstep(320, 900, rr * PAVE.row));
  if (vis < 0.03) return null;
  const P = (u: number, v: number) => {
    const X = ROME.X + u * D1[0] + v * D1[1];
    const Z = ROME.Z + u * D1[1] - v * D1[0];
    return project(c, X, terrainH(X, Z) + 0.02, Z);
  };
  const jit = (k: number, m: number, a: number) => (random(`pv${k}_${m}`) - 0.5) * a;
  let d = "";
  const ua = Math.max(u0, PAVE.s0);
  const ub = Math.min(u1, PAVE.s1);
  for (let k = Math.ceil(ua / PAVE.row); k * PAVE.row < ub; k++) {
    const u = k * PAVE.row;
    // a course joint across the street (slightly crooked), then the slabs' side joints along it, staggered
    const pts: string[] = [];
    for (let v = v0; v <= v1 + 1e-6; v += (v1 - v0) / 4) pts.push(pt(P(u + jit(k, Math.round(v * 10), 0.3), v)));
    d += `M${pts.join("L")}`;
    const off = (k % 2) * 0.5 * PAVE.col;
    for (let m = Math.ceil((v0 - off) / PAVE.col); m * PAVE.col + off < v1; m++) {
      const v = m * PAVE.col + off + jit(k, m + 77, 0.4);
      if (v <= v0 || v >= v1) continue;
      d += `M${pt(P(u, v))}L${pt(P(Math.min(ub, u + PAVE.row), v + jit(k, m + 99, 0.3)))}`;
    }
  }
  return d ? <path d={d} fill="none" stroke={A.toneH(BASALT_J, zm, hm)} strokeOpacity={0.55 * vis} strokeWidth={Math.max(0.5, Math.min(2.2, 0.05 * rr))} strokeLinecap="round" /> : null;
};
const BASALT: Mat = { lit: "#8C8274", mid: "#736A5E", dark: "#3E3730" };
/** Rome's plateau: a grid over its footprint (only the raised part; the flat around it is the plain) */
const plateauItems = (A: TAir): Item[] => {
  const map = (s: number, n: number): [number, number, number] => {
    const X = ROME.X + s * D1[0] + n * D1[1];
    const Z = ROME.Z + s * D1[1] - n * D1[0];
    return [X, terrainH(X, Z), Z];
  };
  const us = [...range(PLATEAU.z0 - PLATEAU.edge - 12, PAVE.s0, 8), ...range(PAVE.s0, PAVE.s1, 40).slice(1), ...range(PAVE.s1, PLATEAU.z1 + PLATEAU.edge + 12, 18).slice(1)];
  const side = range(ROAD_W / 2, PLATEAU.x1 + PLATEAU.edge + 14, 14, 1.2);
  const vs = [...side.map((v) => -v).reverse(), ...side];
  return patchItems(A, "pl", map, us, vs, (u, v) => (Math.abs(v) < ROAD_W / 2 ? (u > PAVE.s0 && u < PAVE.s1 ? BASALT : ROAD_MAT) : LAND), 0, paveDeco);
};
/** the climb: the TOP (a grid in the climb's frame, its lines on every terrace's edges so no quad straddles a terrace
 *  wall; a quad inside a terrace lies level at the floor, one outside follows the slope and the rounded shoulders) and
 *  the two FLANKS (vertices from the top's edge down to the flank's foot, t 0..1). Faint terrace lines run across the
 *  slope and strata along the near flank, so the ramp reads as worked ground, not a raw plane. */
export const CLIMB_SMAX = 430;
const P3 = (s: number, n: number, h: number): V3 => [KNEE.X + s * D2[0] + n * D2[1], h, KNEE.Z + s * D2[1] - n * D2[0]];
const uniq = (a: number[]) => Array.from(new Set(a.map((v) => Math.round(v * 1000) / 1000))).sort((x, y) => x - y);
const CONTOUR = "#4F4434";
const climbTopItems = (A: TAir): Item[] => {
  const c = A.c;
  const T = TERRACES_LIST;
  const us = uniq([...range(-6, CLIMB_XC.xc, 30), ...range(CLIMB_XC.xc, CLIMB_SMAX, 26), ...T.flatMap((t) => [t.s0, t.s1])]);
  const inN = CLIMB.halfW - SHOULDER.w;
  const inF = CLIMB.nFar + SHOULDER.w;
  const vs = uniq([...range(CLIMB.nFar, inF, 3), ...range(inF, inN, 8), ...range(inN, CLIMB.halfW, 3), ...T.flatMap((t) => [t.n0, t.n1])]);
  const out: Item[] = [];
  for (let i = 0; i < us.length - 1; i++) {
    for (let j = 0; j < vs.length - 1; j++) {
      const u0 = us[i];
      const u1 = us[i + 1];
      const v0 = vs[j];
      const v1 = vs[j + 1];
      const um = (u0 + u1) / 2;
      const vm = (v0 + v1) / 2;
      const ter = T.find((t) => um > t.s0 && um < t.s1 && vm > t.n0 && vm < t.n1);
      const hh = (u: number, v: number) => (ter ? ter.g : slopeAt(u, v));
      const q: V3[] = [P3(u0, v0, hh(u0, v0)), P3(u1, v0, hh(u1, v0)), P3(u1, v1, hh(u1, v1)), P3(u0, v1, hh(u0, v1))];
      const zm = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
      if (Math.max(q[0][2], q[1][2], q[2][2], q[3][2]) < c.Z + CAM_NEAR) continue;
      const hm = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
      const a1 = [q[2][0] - q[0][0], q[2][1] - q[0][1], q[2][2] - q[0][2]];
      const b1 = [q[3][0] - q[1][0], q[3][1] - q[1][1], q[3][2] - q[1][2]];
      let nn = nrm([a1[1] * b1[2] - a1[2] * b1[1], a1[2] * b1[0] - a1[0] * b1[2], a1[0] * b1[1] - a1[1] * b1[0]]);
      if (nn[1] < 0) nn = [-nn[0], -nn[1], -nn[2]];
      const xm = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4;
      if (nn[0] * (c.X - xm) + nn[1] * (c.H - hm) + nn[2] * (c.Z - zm) < 0) continue;
      const near = c01((60 - (zm - c.Z)) / 50);
      const col = A.toneH(mixHex(landTone(nn, ter ? TERRACE_FLOOR : LAND), PAL.shadow, NEAR_SINK * near * near), zm, hm);
      const qc = Math.min(q[0][2], q[1][2], q[2][2], q[3][2]) < c.Z + CAM_NEAR * 1.5 ? clipNear(q, c) : q;
      if (qc.length < 3) continue;
      const pts = qc.map((p) => project(c, p[0], p[1], p[2]));
      // faint terrace lines across the open slope every CONTOUR_S metres (not on the terraces themselves)
      let deco: React.ReactNode = null;
      if (!ter && um > 8 && vm < CLIMB.halfW - SHOULDER.w - 1 && vm > CLIMB.nFar + SHOULDER.w + 1 && Math.abs(vm - RAIL.n) > 9) {
        let d = "";
        for (let k = Math.ceil(u0 / CONTOUR_S); k * CONTOUR_S < u1; k++) {
          const u = k * CONTOUR_S;
          d += `M${pt(project(c, ...(P3(u, v0, slopeAt(u, v0) + 0.05) as [number, number, number])))}L${pt(project(c, ...(P3(u, v1, slopeAt(u, v1) + 0.05) as [number, number, number])))}`;
        }
        if (d) deco = <path d={d} stroke={A.toneH(CONTOUR, zm, hm)} strokeOpacity={0.16 * (1 - A.fogH(zm, hm))} strokeWidth={Math.max(0.5, Math.min(1.4, 0.06 * rOf(c, zm)))} fill="none" />;
      }
      const key = `clt${i}_${j}`;
      out.push({
        d: zm,
        terrain: true,
        key,
        el: (
          <g key={key}>
            <path d={poly(pts)} fill={col} stroke={col} strokeWidth={0.6} strokeLinejoin="round" />
            {deco}
          </g>
        ),
      });
    }
  }
  return out;
};
export const CONTOUR_S = 14;
const TERRACE_FLOOR: Mat = { lit: "#8A7A60", mid: "#6F624C", dark: "#3C3329" };
/** the near flank's strata: horizontal bands every STRATA m of height */
const STRATA = 9;
/** the ramp's finished edge: a fine cream rim along both crests (the style's rim on a lit top edge), fading with the haze */
const CrestRim: React.FC<{ A: TAir }> = ({ A }) => {
  const c = A.c;
  const els: React.ReactNode[] = [];
  [CLIMB.nFar + 0.6, CLIMB.halfW - 0.6].forEach((n, k) => {
    const us = range(2, CLIMB_SMAX, 90, 1.2);
    for (let i = 0; i < us.length - 1; i++) {
      const a = P3(us[i], n, slopeAt(us[i], n) + 0.1);
      const b = P3(us[i + 1], n, slopeAt(us[i + 1], n) + 0.1);
      if (Math.min(a[2], b[2]) < c.Z + 2) continue;
      const zm = (a[2] + b[2]) / 2;
      const al = 0.5 * (1 - A.fogH(zm, (a[1] + b[1]) / 2)) * smoothstep(2, 14, us[i]);
      if (al < 0.02) continue;
      els.push(<path key={`${k}_${i}`} d={`M${pt(project(c, a[0], a[1], a[2]))}L${pt(project(c, b[0], b[1], b[2]))}`} stroke={CREAM} strokeOpacity={al} strokeWidth={Math.max(0.7, Math.min(2.2, 0.08 * rOf(c, zm)))} strokeLinecap="round" />);
    }
  });
  return <g>{els}</g>;
};
const climbFlankItems = (A: TAir, side: 1 | -1): Item[] => {
  const c = A.c;
  const us = [...range(-6, CLIMB_XC.xc, 30), ...range(CLIMB_XC.xc, CLIMB_SMAX, 26).slice(1)];
  const ts = range(0, 1, 6, 1.4);
  const edgeN = side > 0 ? CLIMB.halfW : CLIMB.nFar;
  const map = (u: number, t: number): [number, number, number] => {
    const hTop = slopeAt(u, edgeN);
    return P3(u, edgeN + side * ((t * hTop) / CLIMB.flank), hTop * (1 - t));
  };
  const deco: Deco | undefined =
    side > 0
      ? (A2, u0, u1, v0, v1, zm, hm) => {
          let d = "";
          const h0 = slopeAt(u0, edgeN);
          const h1 = slopeAt(u1, edgeN);
          for (let k = 1; k * STRATA < Math.max(h0, h1); k++) {
            const lv = k * STRATA;
            const tA = h0 > lv ? 1 - lv / h0 : -1;
            const tB = h1 > lv ? 1 - lv / h1 : -1;
            if (tA < v0 || tA > v1 || tB < v0 || tB > v1) continue;
            const a1 = map(u0, tA);
            const b1 = map(u1, tB);
            d += `M${pt(project(A2.c, a1[0], a1[1], a1[2]))}L${pt(project(A2.c, b1[0], b1[1], b1[2]))}`;
          }
          return d ? <path d={d} stroke={A2.toneH(CONTOUR, zm, hm)} strokeOpacity={0.3 * (1 - A2.fogH(zm, hm))} strokeWidth={Math.max(0.6, Math.min(2, 0.1 * rOf(A2.c, zm)))} fill="none" /> : null;
        }
      : undefined;
  void c;
  return patchItems(A, side > 0 ? "cfn" : "cff", map, us, ts, () => FLANK, 0, deco);
};
const FLANK: Mat = { lit: "#857459", mid: "#6A5C47", dark: "#352C23" };

// ===================================================================================================================
// THE TRACK: the road of history itself, bending up the climb as the railway. TRACK(u): u metres from the knee along
// the climb (u < 0 back along the flat road); for u <= -TRACK_BLEND[0] it IS the road, for u >= TRACK_BLEND[1] it runs
// up the climb's near edge at n = RAIL.n; between, one smooth bend. Ballast, sleepers and two rails on it.
// ===================================================================================================================
export const RAIL = { n: 50, bed: 4.6, gauge: 1.44, sleeper: 0.8 };
export const TRACK_BLEND: [number, number] = [70, 26];
const BALLAST: Mat = { lit: "#6E655A", mid: "#5A5249", dark: "#2E2925" };
const trackXZ = (u: number): [number, number] => {
  const r = roadAt(KNEE_S + u);
  const cl = P3(u, RAIL.n, 0);
  const w = smoothstep(-TRACK_BLEND[0], TRACK_BLEND[1], u);
  const ww = w * w * (3 - 2 * w);
  return [r.X + (cl[0] - r.X) * ww, r.Z + (cl[2] - r.Z) * ww];
};
const trackH = (u: number) => {
  const [X, Z] = trackXZ(u);
  const { s, n } = climbLocal(X, Z);
  return Math.max(terrainH(X, Z), s > 0 && n <= CLIMB.halfW ? slopeAt(s, n) : 0);
};
/** the track's centre at u: [X, h, Z], its unit tangent (with the slope) and its sideways unit (level, toward the viewer) */
export const TRACK = (u: number) => {
  const [X, Z] = trackXZ(u);
  const h = trackH(u);
  const e = 0.6;
  const [Xa, Za] = trackXZ(u - e);
  const [Xb, Zb] = trackXZ(u + e);
  const ha = trackH(u - e);
  const hb = trackH(u + e);
  const T = nrm([Xb - Xa, hb - ha, Zb - Za]);
  const hl = Math.hypot(T[0], T[2]) || 1;
  const C: V3 = [T[2] / hl, 0, -T[0] / hl];
  return { P: [X, h, Z] as V3, T, C };
};
export const TRACK_U0 = -TRACK_BLEND[0];
export const TRACK_U1 = 330;
const trackItems = (A: TAir): Item[] => {
  const c = A.c;
  const out: Item[] = [];
  const us = [...range(TRACK_U0, TRACK_BLEND[1] + 10, 40), ...range(TRACK_BLEND[1] + 10, TRACK_U1, 40, 1.3).slice(1)];
  const at = (u: number, v: number, lift = 0.08): V3 => {
    const t = TRACK(u);
    return [t.P[0] + t.C[0] * v, t.P[1] + lift, t.P[2] + t.C[2] * v];
  };
  for (let i = 0; i < us.length - 1; i++) {
    const u0 = us[i];
    const u1 = us[i + 1];
    const zm = (at(u0, 0)[2] + at(u1, 0)[2]) / 2;
    if (Math.max(at(u0, 0)[2], at(u1, 0)[2]) < c.Z + 2) continue;
    const hm = (at(u0, 0)[1] + at(u1, 0)[1]) / 2;
    const rr = rOf(c, zm);
    const vis = 1 - A.fogH(zm, hm);
    const band = (v0: number, v1: number, mat: Mat, lift: number) => {
      const q = [at(u0, v0, lift), at(u1, v0, lift), at(u1, v1, lift), at(u0, v1, lift)];
      const col = A.toneH(formTone(mat, 0.45, PAL.shadow), zm, hm);
      return <path d={poly(q.map((p) => project(c, p[0], p[1], p[2])))} fill={col} stroke={col} strokeWidth={0.6} />;
    };
    const line = (v: number, lift: number) => `M${pt(project(c, ...(at(u0, v, lift) as [number, number, number])))}L${pt(project(c, ...(at(u1, v, lift) as [number, number, number])))}`;
    let sl = "";
    const slA = smoothstep(3, 6, rr * RAIL.sleeper);
    if (slA > 0.01) for (let u = Math.ceil(u0 / RAIL.sleeper) * RAIL.sleeper; u < u1; u += RAIL.sleeper) sl += `M${pt(project(c, ...(at(u, -1.3, 0.14) as [number, number, number])))}L${pt(project(c, ...(at(u, 1.3, 0.14) as [number, number, number])))}`;
    const w = Math.max(0.5, Math.min(2.4, 0.09 * rr));
    // the road fades into the ballast bed through the bend
    const railA = smoothstep(-TRACK_BLEND[0] + 6, -TRACK_BLEND[0] + 30, (u0 + u1) / 2);
    const key = `trk${i}`;
    out.push({
      d: zm,
      terrain: true,
      key,
      el: (
        <g key={key}>
          {band(-ROAD_W / 2, ROAD_W / 2, ROAD_MAT, 0.05)}
          <g opacity={railA}>
            {band(-RAIL.bed / 2, RAIL.bed / 2, BALLAST, 0.1)}
            {sl ? <path d={sl} stroke={A.toneH("#4A3A2C", zm, hm)} strokeWidth={w * 1.6} strokeOpacity={0.75 * vis * slA} /> : null}
            <path d={line(-RAIL.gauge / 2, 0.2) + line(RAIL.gauge / 2, 0.2)} fill="none" stroke={A.toneH("#3A3D3F", zm, hm)} strokeWidth={w} />
            <path d={line(-RAIL.gauge / 2, 0.24) + line(RAIL.gauge / 2, 0.24)} fill="none" stroke={CREAM} strokeWidth={w * 0.45} strokeOpacity={0.35 * vis} />
          </g>
        </g>
      ),
    });
  }
  return out;
};
/** the road: a worn strip along the centre line, draped on the terrain */
const roadDecal = (A: TAir, s0: number, s1: number): React.ReactNode[] => roadItems(A, s0, s1).sort((a, b) => b.d - a.d).map((it) => it.el);
const roadItems = (A: TAir, s0: number, s1: number): Item[] => {
  const map = (s: number, n: number): [number, number, number] => {
    const r = roadAt(s);
    const X = r.X + n * r.dz;
    const Z = r.Z - n * r.dx;
    return [X, terrainH(X, Z) + 0.05, Z];
  };
  const us = range(s0, s1, Math.max(4, Math.round((s1 - s0) / 5)));
  return patchItems(A, `rd${s0}`, map, us, [-ROAD_W / 2, ROAD_W / 2], () => ROAD_MAT, -0.5);
};

// ===================================================================================================================
// SOLIDS: convex polyhedra by face lists (outward by the centroid, back faces culled), lit by the face normal, fogged
// by their own depth and height, thin outlines in a darker local colour
// ===================================================================================================================
export type V3 = [number, number, number];
type Face = { q: V3[]; mat: Mat; rim?: number; orange?: boolean };
const newell = (q: V3[]): V3 => {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return nrm([x, y, z]);
};
const cen = (q: V3[]): V3 => {
  const n = q.length;
  return [q.reduce((a, p) => a + p[0], 0) / n, q.reduce((a, p) => a + p[1], 0) / n, q.reduce((a, p) => a + p[2], 0) / n];
};
/** an outline width that stays fine with distance */
export const lwAt = (c: TCam, Z: number, base = 0.05) => Math.max(0.35, Math.min(1.5, base * rOf(c, Z)));
const CREAM = PAL.cream;
export const Solid: React.FC<{ A: TAir; faces: Face[]; lw?: number }> = ({ A, faces, lw }) => {
  const c = A.c;
  const all = faces.flatMap((f) => f.q);
  const C = cen(all);
  if (Math.max(...all.map((p) => p[2])) < c.Z + CAM_NEAR) return null;
  const els: React.ReactNode[] = [];
  faces.forEach((f, i) => {
    let n = newell(f.q);
    const fc = cen(f.q);
    if ((fc[0] - C[0]) * n[0] + (fc[1] - C[1]) * n[1] + (fc[2] - C[2]) * n[2] < 0) n = [-n[0], -n[1], -n[2]];
    const toEye = [c.X - fc[0], c.H - fc[1], c.Z - fc[2]];
    if (n[0] * toEye[0] + n[1] * toEye[1] + n[2] * toEye[2] <= 0) return;
    const local = formTone(f.mat, ndl(n), PAL.shadow, 0.28);
    const col = f.orange ? A.toneOH(local, fc[2], fc[1]) : A.toneH(local, fc[2], fc[1]);
    const ln = f.orange ? A.toneOH(ORANGE_LINE, fc[2], fc[1]) : A.toneH(lineOf(f.mat), fc[2], fc[1]);
    const qc = Math.min(...f.q.map((p) => p[2])) < c.Z + CAM_NEAR * 1.5 ? clipNear(f.q, c) : f.q;
    if (qc.length < 3) return;
    const pts = qc.map((p) => project(c, p[0], p[1], p[2]));
    els.push(<path key={i} d={poly(pts)} fill={col} stroke={ln} strokeWidth={lw ?? lwAt(c, fc[2])} strokeLinejoin="round" />);
    if (f.rim && n[1] > 0.3) {
      // the cream rim along the face's lowest-front edge pair (the lit eave / top front edge)
      const a = 0.55 * f.rim * (1 - A.fogH(fc[2], fc[1]));
      if (a > 0.02) els.push(<path key={`r${i}`} d={`M${pts.map(pt).join("L")}Z`} fill="none" stroke={CREAM} strokeOpacity={a * 0.6} strokeWidth={(lw ?? lwAt(c, fc[2])) * 0.9} />);
    }
  });
  return <g>{els}</g>;
};
/** a box's six faces (h0 bottom < h1 top) */
export const boxFaces = (X0: number, X1: number, h0: number, h1: number, Z0: number, Z1: number, mat: Mat, top?: Mat): Face[] => [
  { q: [[X0, h0, Z0], [X1, h0, Z0], [X1, h1, Z0], [X0, h1, Z0]], mat },
  { q: [[X0, h0, Z1], [X1, h0, Z1], [X1, h1, Z1], [X0, h1, Z1]], mat },
  { q: [[X0, h0, Z0], [X0, h0, Z1], [X0, h1, Z1], [X0, h1, Z0]], mat },
  { q: [[X1, h0, Z0], [X1, h0, Z1], [X1, h1, Z1], [X1, h1, Z0]], mat },
  { q: [[X0, h1, Z0], [X1, h1, Z0], [X1, h1, Z1], [X0, h1, Z1]], mat: top ?? mat, rim: 1 },
  { q: [[X0, h0, Z0], [X1, h0, Z0], [X1, h0, Z1], [X0, h0, Z1]], mat },
];
/** a gable roof: ridge along Z (gables front and back) or along X (eaves front and back) */
export const gableFaces = (X0: number, X1: number, hE: number, hR: number, Z0: number, Z1: number, mat: Mat, ridge: "z" | "x", gable: Mat = mat): Face[] => {
  if (ridge === "z") {
    const Xm = (X0 + X1) / 2;
    return [
      { q: [[X0, hE, Z0], [Xm, hR, Z0], [Xm, hR, Z1], [X0, hE, Z1]], mat, rim: 1 },
      { q: [[X1, hE, Z0], [Xm, hR, Z0], [Xm, hR, Z1], [X1, hE, Z1]], mat, rim: 1 },
      { q: [[X0, hE, Z0], [X1, hE, Z0], [Xm, hR, Z0]], mat: gable },
      { q: [[X0, hE, Z1], [X1, hE, Z1], [Xm, hR, Z1]], mat: gable },
    ];
  }
  const Zm = (Z0 + Z1) / 2;
  return [
    { q: [[X0, hE, Z0], [X1, hE, Z0], [X1, hR, Zm], [X0, hR, Zm]], mat, rim: 1 },
    { q: [[X0, hE, Z1], [X1, hE, Z1], [X1, hR, Zm], [X0, hR, Zm]], mat, rim: 1 },
    { q: [[X0, hE, Z0], [X0, hE, Z1], [X0, hR, Zm]], mat: gable },
    { q: [[X1, hE, Z0], [X1, hE, Z1], [X1, hR, Zm]], mat: gable },
  ];
};

// ===================================================================================================================
// ROME: a compact town on the plateau (muted stone, plaster and terracotta; no orange)
// ===================================================================================================================
export const PLASTER: Mat = { lit: "#C9B898", mid: "#A89878", dark: "#6E614E" };
export const MARBLE_T: Mat = { lit: "#E4D9C2", mid: "#C4B699", dark: "#857A63" };
export const TILE: Mat = { lit: "#A2654B", mid: "#8E4F36", dark: "#4E2C20" };
export const STONE_T: Mat = { lit: "#A39582", mid: "#857766", dark: "#4A4137" };
const DOOR = "#3E3226";
/** the plateau's level top */
export const TOP_H = PLATEAU.h;
/** the town's parts (world metres; h from the plateau's top) */
export const TOWN = {
  temple: { X0: 4.6, X1: 15.4, Z0: -3, Z1: 15, podium: 1.8, colTop: 8.2, ent: 1.0, ridge: 2.3, cols: 6, R: 0.42 },
  houses: [
    { X0: -16, X1: -6, Z0: -8, Z1: 1, wall: 4.6, ridge: "x" as const, rise: 2.0 },
    { X0: -14, X1: -5.6, Z0: 5, Z1: 13, wall: 5.8, ridge: "x" as const, rise: 2.0 },
    { X0: 18, X1: 26, Z0: -4, Z1: 5, wall: 4.4, ridge: "z" as const, rise: 2.2 },
    { X0: -27, X1: -18.5, Z0: 2, Z1: 10, wall: 4.0, ridge: "z" as const, rise: 2.0 },
  ],
  aqueduct: { X0: -46, X1: 50, Z0: 25, Z1: 27.4, deck: 11.6, span: 5.4, pier: 1.7, spring: 7.4 },
};
/** the temple: podium, steps, cella, a hexastyle front portico, the entablature and the pediment under a tile roof */
const templeItems = (A: TAir): Item[] => {
  const T = TOWN.temple;
  const b = TOP_H;
  const out: Item[] = [];
  const c = A.c;
  // podium and steps
  const steps: Face[][] = [0, 1, 2].map((i) => boxFaces(T.X0 + 1.4, T.X1 - 1.4, b, b + (T.podium * (i + 1)) / 3, T.Z0 - 2.4 + 0.8 * i, T.Z0 + 0.2, STONE_T));
  out.push({ d: T.Z0 - 1, key: "tpst", el: <g key="tpst">{steps.map((f, i) => <Solid key={i} A={A} faces={f} />)}</g> });
  out.push({ d: (T.Z0 + T.Z1) / 2 + 0.5, key: "tpod", el: <Solid key="tpod" A={A} faces={boxFaces(T.X0, T.X1, b, b + T.podium, T.Z0, T.Z1, STONE_T, MARBLE_T)} /> });
  // the cella (its door dark in the porch's shade)
  const cZ0 = T.Z0 + 3.6;
  const top = b + T.podium;
  out.push({
    d: (cZ0 + T.Z1) / 2,
    key: "tcel",
    el: (
      <g key="tcel">
        <Solid A={A} faces={boxFaces(T.X0 + 1.1, T.X1 - 1.1, top, b + T.colTop, cZ0, T.Z1 - 0.6, MARBLE_T)} />
        <path d={poly([project(c, (T.X0 + T.X1) / 2 - 1.3, top, cZ0 - 0.02), project(c, (T.X0 + T.X1) / 2 + 1.3, top, cZ0 - 0.02), project(c, (T.X0 + T.X1) / 2 + 1.3, top + 3.9, cZ0 - 0.02), project(c, (T.X0 + T.X1) / 2 - 1.3, top + 3.9, cZ0 - 0.02)])} fill={A.toneH(DOOR, cZ0, top + 2)} />
      </g>
    ),
  });
  // the columns: the front row and the second row behind it
  const colX = Array.from({ length: T.cols }, (_, i) => T.X0 + 1.0 + ((T.X1 - T.X0 - 2.0) * i) / (T.cols - 1));
  [T.Z0 + 2.4, T.Z0 + 0.9].forEach((Zc, row) =>
    colX.forEach((X, i) => {
      if (row === 0 && i > 0 && i < T.cols - 1) return;
      out.push({ d: Zc - 0.1, key: `tcol${row}_${i}`, el: <AirCyl key={`tcol${row}_${i}`} A={A} X={X} Z={Zc} R={T.R} Y0={-(b + T.colTop)} Y1={-top} mat={MARBLE_T} uid={`tcol${row}_${i}`} flutes={5} lw={lwAt(c, Zc)} /> });
    }),
  );
  // the entablature and the pedimented roof
  const eTop = b + T.colTop + T.ent;
  out.push({
    d: T.Z0 - 0.2,
    key: "tent",
    el: (
      <g key="tent">
        <Solid A={A} faces={boxFaces(T.X0 + 0.25, T.X1 - 0.25, b + T.colTop, eTop, T.Z0 + 0.35, T.Z1, MARBLE_T)} />
        <Solid A={A} faces={gableFaces(T.X0 + 0.05, T.X1 - 0.05, eTop, eTop + T.ridge, T.Z0 + 0.2, T.Z1 + 0.2, TILE, "z", MARBLE_T)} />
      </g>
    ),
  });
  return out;
};
const houseItems = (A: TAir): Item[] =>
  TOWN.houses.map((h, i) => {
    const b = TOP_H;
    const c = A.c;
    const wins: React.ReactNode[] = [];
    // small dark windows and a door on the front face
    const nW = Math.max(2, Math.round((h.X1 - h.X0) / 3.2));
    for (let k = 0; k < nW; k++) {
      const X = h.X0 + ((k + 0.5) * (h.X1 - h.X0)) / nW;
      const isDoor = k === Math.floor(nW / 2) && i !== 1;
      const y0 = isDoor ? b : b + h.wall * 0.55;
      const y1 = isDoor ? b + 2.3 : b + h.wall * 0.55 + 1.0;
      const w = isDoor ? 0.75 : 0.45;
      wins.push(<path key={k} d={poly([project(c, X - w, y0, h.Z0 - 0.02), project(c, X + w, y0, h.Z0 - 0.02), project(c, X + w, y1, h.Z0 - 0.02), project(c, X - w, y1, h.Z0 - 0.02)])} fill={A.toneH(DOOR, h.Z0, y0)} />);
      if (h.wall > 5 && !isDoor) {
        const yy = b + 1.0;
        wins.push(<path key={`g${k}`} d={poly([project(c, X - 0.45, yy, h.Z0 - 0.02), project(c, X + 0.45, yy, h.Z0 - 0.02), project(c, X + 0.45, yy + 1.1, h.Z0 - 0.02), project(c, X - 0.45, yy + 1.1, h.Z0 - 0.02)])} fill={A.toneH(DOOR, h.Z0, yy)} />);
      }
    }
    // the red-brown socle along the foot (Roman stucco)
    const soc = poly([project(c, h.X0, b, h.Z0 - 0.01), project(c, h.X1, b, h.Z0 - 0.01), project(c, h.X1, b + 0.9, h.Z0 - 0.01), project(c, h.X0, b + 0.9, h.Z0 - 0.01)]);
    return {
      d: (h.Z0 + h.Z1) / 2,
      key: `hs${i}`,
      el: (
        <g key={`hs${i}`}>
          <Solid A={A} faces={boxFaces(h.X0, h.X1, b, b + h.wall, h.Z0, h.Z1, PLASTER)} />
          {A.c.Z < h.Z0 ? <path d={soc} fill={A.toneH("#7E5040", h.Z0, b)} /> : null}
          {A.c.Z < h.Z0 ? wins : null}
          <Solid A={A} faces={gableFaces(h.X0 - 0.4, h.X1 + 0.4, b + h.wall, b + h.wall + h.rise, h.Z0 - 0.4, h.Z1 + 0.4, TILE, h.ridge, PLASTER)} />
        </g>
      ),
    };
  });
/** the aqueduct: a run of arches across the plateau behind the town, the road passing under one */
const aqueductItem = (A: TAir): Item => {
  const Q = TOWN.aqueduct;
  const c = A.c;
  const b = TOP_H;
  const n = Math.round((Q.X1 - Q.X0) / Q.span);
  const archR = (Q.span - Q.pier) / 2;
  // the front face as an even-odd path: the outer slab minus the arch openings
  const face = (Z: number) => {
    let d = `M${pt(project(c, Q.X0, b, Z))}L${pt(project(c, Q.X1, b, Z))}L${pt(project(c, Q.X1, b + Q.deck, Z))}L${pt(project(c, Q.X0, b + Q.deck, Z))}Z`;
    for (let i = 0; i < n; i++) {
      const xc = Q.X0 + Q.span * (i + 0.5);
      const a0 = project(c, xc - archR, b, Z);
      const a1 = project(c, xc - archR, b + Q.spring, Z);
      const a2 = project(c, xc + archR, b + Q.spring, Z);
      const a3 = project(c, xc + archR, b, Z);
      const rr = archR * rOf(c, Z);
      d += `M${pt(a0)}L${pt(a1)}A${fx(rr)},${fx(rr)} 0 0 1 ${pt(a2)}L${pt(a3)}Z`;
    }
    return d;
  };
  const Zm = (Q.Z0 + Q.Z1) / 2;
  const hm = b + Q.deck * 0.6;
  const front = A.toneH(formTone(STONE_T, 0.42, PAL.shadow), Q.Z0, hm);
  const back = A.toneH(mixHex(STONE_T.dark, PAL.shadow, 0.3), Q.Z1, hm);
  const ln = A.toneH(lineOf(STONE_T), Zm, hm);
  const topQ = [project(c, Q.X0, b + Q.deck, Q.Z0), project(c, Q.X1, b + Q.deck, Q.Z0), project(c, Q.X1, b + Q.deck, Q.Z1), project(c, Q.X0, b + Q.deck, Q.Z1)];
  const sideX = c.X < Q.X0 ? Q.X0 : c.X > Q.X1 ? Q.X1 : null;
  const sideQ = sideX === null ? null : [project(c, sideX, b, Q.Z0), project(c, sideX, b, Q.Z1), project(c, sideX, b + Q.deck, Q.Z1), project(c, sideX, b + Q.deck, Q.Z0)];
  // the cornice line and a string course at the springing
  const course = (h: number) => `M${pt(project(c, Q.X0, b + h, Q.Z0 - 0.01))}L${pt(project(c, Q.X1, b + h, Q.Z0 - 0.01))}`;
  const lw = lwAt(c, Q.Z0);
  return {
    d: Zm,
    key: "aq",
    el: (
      <g key="aq">
        <path d={face(Q.Z1)} fill={back} fillRule="evenodd" />
        {c.H < b + Q.deck ? null : <path d={poly(topQ)} fill={A.toneH(STONE_T.lit, Zm, b + Q.deck)} stroke={ln} strokeWidth={lw} />}
        {sideQ ? <path d={poly(sideQ)} fill={A.toneH(sideX === Q.X0 ? formTone(STONE_T, 0.55, PAL.shadow) : formTone(STONE_T, -0.5, PAL.shadow), Zm, hm)} stroke={ln} strokeWidth={lw} /> : null}
        <path d={face(Q.Z0)} fill={front} fillRule="evenodd" stroke={ln} strokeWidth={lw} />
        <path d={course(Q.deck - 0.9)} stroke={ln} strokeWidth={lw} />
        <path d={course(Q.spring + archR + 0.4)} stroke={ln} strokeWidth={lw * 0.8} strokeOpacity={0.6} />
        <path d={`M${pt(project(c, Q.X0, b + Q.deck, Q.Z0))}L${pt(project(c, Q.X1, b + Q.deck, Q.Z0))}`} stroke={CREAM} strokeOpacity={0.5 * (1 - A.fogH(Q.Z0, b + Q.deck))} strokeWidth={lw * 1.1} />
      </g>
    ),
  };
};

// ===================================================================================================================
// THE MILESTONES: Roman milestone columns (a squared base, a round shaft), the year cut into the shaft's face
// ===================================================================================================================
export const M_AD100 = { s: -21.2, n: -3.4, R: 0.62, Hs: 2.8, text: "AD 100" };
const milestonePos = (m: { s: number; n: number }) => {
  const r = streetAt(m.s);
  return { X: r.X + m.n * r.dz, Z: r.Z - m.n * r.dx };
};
/** "1800": a broad carved stone at the foot of the climb, its face toward the viewer (axis-aligned box) */
/** "1800" stands at the roadside where the road of history reaches the climb's foot (left of the road, clear of the
 *  track's bend) */
export const M_1800 = { X: roadAt(KNEE_S - 28).X + 20 * DT[1], Z: roadAt(KNEE_S - 28).Z - 20 * DT[0], W: 20, D: 2.8, Hs: 9.6, text: "1800", cap: 5.4 };
const KneeStone: React.FC<{ A: TAir; font: string }> = ({ A, font }) => {
  const c = A.c;
  const m = M_1800;
  const X0 = m.X - m.W / 2;
  const X1 = m.X + m.W / 2;
  const g = terrainH(m.X, m.Z);
  const Zf = m.Z - m.D / 2;
  const ty = g + 0.8 + (m.Hs - 0.8) * 0.4;
  const p = project(c, m.X, ty, Zf - 0.05);
  const fs = m.cap * 1.38 * rOf(c, Zf);
  const vis = (1 - A.fogH(Zf, ty)) * smoothstep(3, 8, fs);
  const common = { x: p[0], textAnchor: "middle" as const, fontSize: fs, fontFamily: font, fontWeight: 700, style: { letterSpacing: `${0.04 * fs}px` } };
  const base = boxFaces(X0 - 0.6, X1 + 0.6, g - 0.3, g + 0.8, Zf - 0.6, m.Z + m.D / 2 + 0.6, STONE_T);
  const slab = boxFaces(X0, X1, g + 0.8, g + m.Hs, Zf, m.Z + m.D / 2, STONE_T);
  return (
    <g>
      <AirShadow A={A} X={m.X} Z={m.Z} w={m.W * 0.6} d={m.D * 1.4} uid="ks" amt={0.7} Y={-g} />
      <Solid A={A} faces={base} />
      <Solid A={A} faces={slab} />
      {vis > 0.01 ? (
        <g opacity={vis}>
          <text {...common} y={p[1] + fs * 0.36 - fs * 0.05} fill={A.toneH("#3A2F25", Zf, ty)} opacity={0.9}>
            {m.text}
          </text>
          <text {...common} y={p[1] + fs * 0.36 + fs * 0.045} fill={CREAM} opacity={0.45}>
            {m.text}
          </text>
          <text {...common} y={p[1] + fs * 0.36} fill={A.toneH("#5A4E40", Zf, ty)}>
            {m.text}
          </text>
        </g>
      ) : null}
    </g>
  );
};
const Milestone: React.FC<{ A: TAir; m: typeof M_AD100; uid: string; font: string }> = ({ A, m, uid, font }) => {
  const c = A.c;
  const { X, Z } = milestonePos(m);
  const g = terrainH(X, Z);
  const baseH = m.R * 0.9;
  const lw = lwAt(c, Z);
  // the inscription on the shaft's front, cut in: a dark inner line, a cream lower lip, the stone's shade in the cut
  const ty = g + baseH + m.Hs * 0.62;
  const p = [project(c, X, ty, Z)[0], project(c, X, ty, Z - m.R)[1]];
  const fs = m.R * 0.62 * rOf(c, Z - m.R) * (m.text.length > 4 ? 0.66 : 1);
  const vis = (1 - A.fogH(Z, ty)) * smoothstep(2, 6, fs);
  const common = { x: p[0], textAnchor: "middle" as const, fontSize: fs, fontFamily: font, fontWeight: 700, style: { letterSpacing: `${0.03 * fs}px` } };
  return (
    <g>
      <AirShadow A={A} X={X} Z={Z} w={m.R * 1.9} d={m.R * 1.4} uid={`${uid}s`} amt={0.8} Y={-g} />
      <Solid A={A} faces={boxFaces(X - m.R * 1.12, X + m.R * 1.12, g, g + baseH, Z - m.R * 1.12, Z + m.R * 1.12, STONE_T)} />
      <AirCyl A={A} X={X} Z={Z} R={m.R} Y0={-(g + baseH + m.Hs)} Y1={-(g + baseH)} mat={STONE_T} uid={`${uid}c`} lw={lw} />
      <ellipse cx={project(c, X, g + baseH + m.Hs, Z)[0]} cy={project(c, X, g + baseH + m.Hs, Z)[1]} rx={m.R * rOf(c, Z) * 0.98} ry={Math.max(0.5, Math.abs(project(c, X, g + baseH + m.Hs, Z - m.R)[1] - project(c, X, g + baseH + m.Hs, Z + m.R)[1]) / 2)} fill={A.toneH(STONE_T.lit, Z, g + m.Hs)} stroke={A.toneH(lineOf(STONE_T), Z, g + m.Hs)} strokeWidth={lw} />
      {vis > 0.01 ? (
        <g opacity={vis}>
          <text {...common} y={p[1] + fs * 0.36 - fs * 0.05} fill={A.toneH("#3A2F25", Z, ty)} opacity={0.9}>
            {m.text}
          </text>
          <text {...common} y={p[1] + fs * 0.36 + fs * 0.045} fill={CREAM} opacity={0.45}>
            {m.text}
          </text>
          <text {...common} y={p[1] + fs * 0.36} fill={A.toneH("#5A4E40", Z, ty)}>
            {m.text}
          </text>
        </g>
      ) : null}
    </g>
  );
};

// ===================================================================================================================
// THE PEOPLE OF ROME (RomeFolk): a slave carrying an amphora across the road, a freeman, a woman, a dominus
// ===================================================================================================================
export const ROME_FOLK = [
  { kind: "Slave" as const, variant: 1, X: 1.35, Z: -20.6, dir: 1 as const, walk: true, load: "amphora" as const },
  { kind: "Freeman" as const, variant: 0, X: 3.3, Z: -19.9, dir: -1 as const, walk: false },
];
/** a walker's feet advance (m per frame) so the planted foot never slides (romeCast walk: 2 x 44 units per cycle) */
const WALK_M = (2 * 44 * FIG_M) / 24;
const folkItems = (A: TAir, frame: number): Item[] =>
  ROME_FOLK.map((f, i) => {
    const c = A.c;
    const X = f.walk ? f.X + f.dir * WALK_M * frame : f.X;
    const g = terrainH(X, f.Z);
    const at = project(c, X, g, f.Z);
    const scale = rOf(c, f.Z) * FIG_M;
    const phase = frame / 24 + i * 0.37;
    const pose = f.walk ? (f.load ? RomeFolk.POSES.carry(f.dir, phase) : RomeFolk.POSES.walk(f.dir, phase)) : RomeFolk.idle(RomeFolk.POSES.stand(f.dir), frame + i * 31, i);
    const Fig = RomeFolk[f.kind];
    return {
      d: f.Z,
      key: `rf${i}`,
      el: (
        <g key={`rf${i}`}>
          <AirShadow A={A} X={X} Z={f.Z} w={0.36} d={0.2} uid={`rfs${i}`} amt={0.8} Y={-g} />
          <Fig pose={pose} variant={f.variant} at={at} scale={scale} uid={`rf${i}`} fog={A.folkFogH(f.Z, g)} unitPx={1} {...(f.load ? { load: f.load } : {})} />
        </g>
      ),
    };
  });

// ===================================================================================================================
// THE INDUSTRY on the climb (orange = the technology: lit windows, furnace mouths, the engine's beam, the locomotive's
// firebox and boiler bands). Everything on the climb is placed in the climb's frame (s along D2 from the knee, n
// across, + toward the viewer) and aligned with it: a mill is cut into the slope, its floor level, its walls standing
// on the ground at each corner (the downhill wall the tallest, like a hillside mill), its roof level.
// ===================================================================================================================
export const BRICK: Mat = { lit: "#9C6650", mid: "#7C4B3A", dark: "#42271E" };
export const SLATE: Mat = { lit: "#7D8285", mid: "#5D6366", dark: "#33383B" };
const SOOT = "#3A2C25";
export const climbP = (s: number, n: number, h: number): V3 => [KNEE.X + s * D2[0] + n * D2[1], h, KNEE.Z + s * D2[1] - n * D2[0]];
export type Mill = { s0: number; s1: number; n0: number; n1: number; Hb: number; floors: number; lit: number; seed: number };
export type Chim = { s: number; n: number; R: number; Hc: number; seed: number; plume?: Plume };
/** the climb's few big mills, stepped up the slope, each on its own terrace (TERRACES), with a tall chimney on the
 *  terrace beside it; lit windows more and more the higher up */
export const FACTORIES = (() => {
  const spec = [
    { s0: 5, s1: 21, n0: 8, n1: 44, Hb: 24 },
    { s0: 27, s1: 40, n0: 12, n1: 46, Hb: 25 },
    { s0: 47, s1: 58, n0: 7, n1: 42, Hb: 25 },
    { s0: 65, s1: 74, n0: 11, n1: 45, Hb: 26 },
    { s0: 81, s1: 89, n0: 6, n1: 40, Hb: 26 },
    { s0: 96, s1: 103, n0: 10, n1: 42, Hb: 26 },
  ];
  const mills: Mill[] = spec.map((m, i) => ({ ...m, floors: Math.round(m.Hb / 3.6), lit: Math.min(0.95, 0.72 + climbH(m.s0) / 300), seed: i + 1 }));
  // only the four highest chimneys smoke, each plume its own length, width and drift (all leaning with the wind)
  const plumes: (Plume | undefined)[] = [
    undefined,
    undefined,
    { len: 40, rise: 0.9, drift: 1.15, grow: 0.095, op: 0.3, speed: 1.5 },
    { len: 62, rise: 1.15, drift: 0.8, grow: 0.16, op: 0.27, speed: 1.5 },
    { len: 50, rise: 0.85, drift: 1.0, grow: 0.11, op: 0.32, speed: 1.5 },
    { len: 72, rise: 1.0, drift: 1.3, grow: 0.14, op: 0.34, speed: 1.5 },
  ];
  // the chimney stands on the terrace, beside the mill's far uphill corner
  const chims: Chim[] = spec.map((m, i) => ({ s: m.s1 - 2.6, n: m.n0 - 4.2, R: 2.1, Hc: 62 + 8 * random(`cH${i}`), seed: i + 1, plume: plumes[i] }));
  return { mills, chims };
})();
/** the terrace under a mill: cut mostly INTO the hill (the floor at the slope's height a quarter of the way up: a low
 *  stone retaining wall in front, an earth cut face behind) */
export const terraceOf = (m: { s0: number; s1: number; n0: number; n1: number }, pad = { s: 2, nNear: 2, nFar: 8 }): Terrace => {
  const s0 = m.s0 - pad.s;
  const s1 = m.s1 + pad.s;
  return { s0, s1, n0: m.n0 - pad.nFar, n1: m.n1 + pad.nNear, g: climbH(s0 + 0.25 * (s1 - s0)) };
};
/** the engine house at the climb's foot (far side) */
export const ENGINE = { s0: 2, s1: 13, n0: -22, n1: -11, Hh: 15, beamOut: 5.5, beamIn: 3.5, period: 62, amp: 0.2 };
export const TERRACES: Terrace[] = [...FACTORIES.mills.map((m) => terraceOf(m)), terraceOf(ENGINE, { s: 1.5, nNear: 1.5, nFar: 1.5 })];
const TERRACES_LIST = TERRACES;
/** when each mill is built in cut 4 (frames of the `build` clock): walls rise a..b, the chimney after, then smoke */
export const BUILD = FACTORIES.mills.map((_, i) => ({ a: 70 + 4.5 * i, b: 83 + 4.5 * i }));
const ease = (u: number) => u * u * (3 - 2 * u);
export const millGrowth = (i: number, build?: number) => (build === undefined ? 1 : ease(c01((build - BUILD[i].a) / (BUILD[i].b - BUILD[i].a))));
export const chimGrowth = (i: number, build?: number) => (build === undefined ? 1 : ease(c01((build - (BUILD[i].b - 6)) / 12)));
/** the frame (build clock) from which a chimney smokes (-Infinity when fully built from the start) */
export const smokeStart = (i: number, build?: number) => (build === undefined ? -Infinity : BUILD[i].b);

/** a wall polygon with an explicit outward normal: lit by it, culled when it faces away, fogged by its centre */
const WallFace: React.FC<{ A: TAir; q: V3[]; n: V3; mat: Mat; lw?: number }> = ({ A, q, n, mat, lw }) => {
  const c = A.c;
  if (q.length < 3) return null;
  const fc = cen(q);
  if (n[0] * (c.X - fc[0]) + n[1] * (c.H - fc[1]) + n[2] * (c.Z - fc[2]) <= 0) return null;
  const col = A.toneH(formTone(mat, ndl(n), PAL.shadow, 0.28), fc[2], fc[1]);
  const ln = A.toneH(lineOf(mat), fc[2], fc[1]);
  const qc = Math.min(...q.map((p) => p[2])) < c.Z + CAM_NEAR * 1.5 ? clipNear(q, c) : q;
  if (qc.length < 3) return null;
  return <path d={poly(qc.map((p) => project(c, p[0], p[1], p[2])))} fill={col} stroke={ln} strokeWidth={lw ?? lwAt(c, fc[2])} strokeLinejoin="round" />;
};
const N_DOWN: V3 = [-D2[0], 0, -D2[1]];
const N_NEAR: V3 = [D2[1], 0, -D2[0]];
const neg = (v: V3): V3 => [-v[0], -v[1], -v[2]];
/** a terrace's walls: the downhill retaining wall, the two side walls (fill below the crossing, cut above) and the
 *  uphill cut face, all in stone, following the slope's line exactly */
const TerraceWalls: React.FC<{ A: TAir; t: Terrace }> = ({ A, t }) => {
  const els: React.ReactNode[] = [];
  const N = 8;
  const sl = (s1: number, n: number) => slopeAt(s1, n);
  // the downhill retaining wall (fill): from the slope up to the floor
  const nn = range(t.n0, t.n1, 4);
  const down: V3[] = [...nn.map((n) => P3(t.s0, n, sl(t.s0, n) - 0.4)), ...nn.slice().reverse().map((n) => P3(t.s0, n, t.g))];
  els.push(<WallFace key="dn" A={A} q={down} n={N_DOWN} mat={STONE_T} />);
  // the uphill cut face: from the floor up to the slope
  const up: V3[] = [...nn.map((n) => P3(t.s1, n, t.g)), ...nn.slice().reverse().map((n) => P3(t.s1, n, Math.max(t.g, sl(t.s1, n))))];
  els.push(<WallFace key="up" A={A} q={up} n={N_DOWN} mat={FLANK} />);
  // the side walls: below the floor where the slope is lower (fill, facing out), above it where higher (cut, facing in)
  const ss = range(t.s0, t.s1, N);
  ([[t.n1, N_NEAR], [t.n0, neg(N_NEAR)]] as [number, V3][]).forEach(([n, out], k) => {
    const fill: V3[] = [];
    const cut: V3[] = [];
    ss.forEach((s1) => {
      const h = sl(s1, n);
      if (h <= t.g) fill.push(P3(s1, n, h - 0.4));
      if (h >= t.g) cut.push(P3(s1, n, h));
    });
    const sStar = ss.find((s1) => sl(s1, n) >= t.g) ?? t.s1;
    if (fill.length) els.push(<WallFace key={`f${k}`} A={A} q={[...fill, P3(sStar, n, t.g), P3(t.s0, n, t.g)]} n={out} mat={STONE_T} />);
    if (cut.length) els.push(<WallFace key={`c${k}`} A={A} q={[P3(sStar, n, t.g), ...cut, P3(t.s1, n, t.g)]} n={neg(out)} mat={FLANK} />);
  });
  return <g>{els}</g>;
};
/** a window grid on one wall (a to b along the wall, level floors from `foot`): each window a dark reveal with the
 *  lit (or dark) pane set into it, offset away from the light so the wall reads thick; only floors below `top` */
const windowsOn = (A: TAir, a: V3, b: V3, foot: number, roof: number, top: number, floors: number, lit: number, seed: number, glow: number) => {
  const c = A.c;
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const nCol = Math.max(2, Math.floor(len / 2.8));
  let dRev = "";
  let dLit = "";
  let dDark = "";
  const fl = (roof - foot - 2.4) / floors;
  const P = (u: number, y: number) => project(c, a[0] + (b[0] - a[0]) * u, y, a[2] + (b[2] - a[2]) * u);
  const quad = (u0: number, u1: number, y0: number, y1: number) => `M${pt(P(u0, y0))}L${pt(P(u1, y0))}L${pt(P(u1, y1))}L${pt(P(u0, y1))}Z`;
  for (let k = 0; k < floors; k++) {
    const y0 = foot + 1.9 + k * fl;
    const y1 = y0 + fl * 0.58;
    if (y1 > top - 0.4) break;
    for (let j = 0; j < nCol; j++) {
      const u0 = (j + 0.24) / nCol;
      const u1 = (j + 0.76) / nCol;
      dRev += quad(u0, u1, y0, y1);
      const du = (u1 - u0) * 0.16;
      const dy = (y1 - y0) * 0.14;
      const pane = quad(u0 + du, u1, y0, y1 - dy);
      if (random(`w${seed}_${k}_${j}`) < lit) dLit += pane;
      else dDark += pane;
    }
  }
  const zm = (a[2] + b[2]) / 2;
  const hm = (roof + foot) / 2;
  return (
    <g>
      {dRev ? <path d={dRev} fill={A.toneH("#2C211B", zm, hm)} /> : null}
      {dDark ? <path d={dDark} fill={A.toneH(SOOT, zm, hm)} /> : null}
      {dLit ? <path d={dLit} fill={A.toneOH(mixHex(ACCENT_DEEP, ACCENT, glow), zm, hm)} /> : null}
    </g>
  );
};
/** a box in the climb's frame (s0..s1 along, n0..n1 across, h0..h1) as a convex solid */
const climbBox = (s0: number, s1: number, n0: number, n1: number, h0: number, h1: number, mat: Mat, top?: Mat): Face[] => {
  const b = (s: number, n: number, h: number) => P3(s, n, h);
  return [
    { q: [b(s0, n0, h0), b(s0, n1, h0), b(s0, n1, h1), b(s0, n0, h1)], mat },
    { q: [b(s1, n0, h0), b(s1, n1, h0), b(s1, n1, h1), b(s1, n0, h1)], mat },
    { q: [b(s0, n0, h0), b(s1, n0, h0), b(s1, n0, h1), b(s0, n0, h1)], mat },
    { q: [b(s0, n1, h0), b(s1, n1, h0), b(s1, n1, h1), b(s0, n1, h1)], mat },
    { q: [b(s0, n0, h1), b(s1, n0, h1), b(s1, n1, h1), b(s0, n1, h1)], mat: top ?? mat, rim: 1 },
  ];
};
const SOCLE: Mat = { lit: "#8E8270", mid: "#6F6455", dark: "#3E362D" };
const CORNICE: Mat = { lit: "#B9A88C", mid: "#958670", dark: "#4E463B" };
/** a mill: on its terrace floor, a stone socle, brick walls with recessed windows, a stone cornice and a slate gable
 *  roof (the gables to the slope). `grow` 0..1 raises it from its floor (walls, floors of windows, then the roof). */
const MillSolid: React.FC<{ A: TAir; m: Mill; t: Terrace; frame: number; grow: number }> = ({ A, m, t, frame, grow }) => {
  const c = A.c;
  const f = t.g;
  const Hc = Math.max(0.01, m.Hb * grow);
  const top = f + Hc;
  const roofOn = smoothstep(0.86, 1, grow);
  const glow = 0.55 + 0.45 * Math.sin(frame / 9 + m.seed * 1.7) * Math.sin(frame / 23 + m.seed);
  const els: React.ReactNode[] = [];
  if (grow > 0.001) {
    els.push(<Solid key="body" A={A} faces={climbBox(m.s0, m.s1, m.n0, m.n1, f, top, BRICK, SLATE)} />);
    els.push(<Solid key="socle" A={A} faces={climbBox(m.s0 - 0.35, m.s1 + 0.35, m.n0 - 0.35, m.n1 + 0.35, f, f + Math.min(1.7, Hc), SOCLE)} />);
    const toEye = (q: V3[], n: V3) => {
      const fc = cen(q);
      return n[0] * (c.X - fc[0]) + n[1] * (c.H - fc[1]) + n[2] * (c.Z - fc[2]) > 0;
    };
    const roofH = f + m.Hb;
    const b00 = P3(m.s0, m.n0, f);
    const b01 = P3(m.s0, m.n1, f);
    const b10 = P3(m.s1, m.n0, f);
    const b11 = P3(m.s1, m.n1, f);
    const hi = (v: V3): V3 => [v[0], top, v[2]];
    if (toEye([b00, b01, hi(b01), hi(b00)], N_DOWN)) els.push(<g key="wd">{windowsOn(A, b00, b01, f, roofH, top, m.floors, m.lit, m.seed, glow)}</g>);
    if (toEye([b01, b11, hi(b11), hi(b01)], N_NEAR)) els.push(<g key="wn">{windowsOn(A, b01, b11, f, roofH, top, m.floors, m.lit, m.seed + 500, glow)}</g>);
    if (toEye([b00, b10, hi(b10), hi(b00)], neg(N_NEAR))) els.push(<g key="wf">{windowsOn(A, b10, b00, f, roofH, top, m.floors, m.lit, m.seed + 900, glow)}</g>);
    // the cornice rides on the wall's top; the roof settles on once the walls are up
    els.push(<Solid key="cor" A={A} faces={climbBox(m.s0 - 0.5, m.s1 + 0.5, m.n0 - 0.5, m.n1 + 0.5, top - Math.min(0.9, Hc), top + 0.3, CORNICE)} />);
    if (roofOn > 0) {
      const rt = top + 0.3;
      const rh = rt + 3.2 * roofOn;
      const nm = (m.n0 + m.n1) / 2;
      const e = 0.6;
      const t00 = P3(m.s0 - e, m.n0 - e, rt);
      const t01 = P3(m.s0 - e, m.n1 + e, rt);
      const t10 = P3(m.s1 + e, m.n0 - e, rt);
      const t11 = P3(m.s1 + e, m.n1 + e, rt);
      const r0 = P3(m.s0 - e, nm, rh);
      const r1 = P3(m.s1 + e, nm, rh);
      els.push(
        <Solid
          key="roof"
          A={A}
          faces={[
            { q: [t00, t10, r1, r0], mat: SLATE, rim: 1 },
            { q: [t01, t11, r1, r0], mat: SLATE, rim: 1 },
            { q: [t00, t01, r0], mat: BRICK },
            { q: [t10, t11, r1], mat: BRICK },
            { q: [t00, t01, t11, t10], mat: SLATE },
          ]}
        />,
      );
    }
  }
  return <g>{els}</g>;
};
/** smoke: puffs born at a chimney's mouth on a fixed beat, rising and drifting downwind, swelling and thinning */
export const WIND: V3 = [-1.0, 0.0, -0.12];
const SMOKE_C = { lit: "#9C9284", mid: "#7E7468", dark: "#4E463E" };
/** a plume's character: puffs (length), draught (rise), how hard the wind takes it (drift), how fast it swells
 *  (grow) and how dense it starts (op). Every plume leans the same way, with the wind. */
export type Plume = { len: number; rise: number; drift: number; grow: number; op: number; speed?: number };
const PLUME_STEAM: Plume = { len: 30, rise: 1, drift: 0.9, grow: 0.085, op: 0.32 };
const Smoke: React.FC<{ A: TAir; X: number; h: number; Z: number; seed: number; frame: number; uid: string; scale?: number; tint?: string; plume?: Plume; start?: number; srcAt?: (t: number) => V3 }> = ({ A, X, h, Z, seed, frame, uid, scale = 1, tint, plume = PLUME_STEAM, start = -Infinity, srcAt }) => {
  const c = A.c;
  const P = 4;
  const N = plume.len;
  const els: React.ReactNode[] = [];
  const ph = random(`sp${seed}`) * P;
  const base = Math.floor((frame + ph) / P);
  for (let k = 0; k < N; k++) {
    const born = (base - k) * P - ph;
    const age = frame - born;
    if (age < 0 || born < start) continue;
    const t = age / (N * P);
    // a puff leaves the mouth where the mouth was when it was puffed (a moving engine leaves its steam behind)
    const o = srcAt ? srcAt(born) : ([X, h, Z] as V3);
    // rising out of the mouth, then bending downwind
    const ag = age * (plume.speed ?? 1);
    const rise = (0.42 * ag - 0.0009 * ag * ag) * scale * plume.rise;
    const drift = (0.08 * ag + 0.0016 * ag * ag) * scale * plume.drift;
    const px = o[0] + WIND[0] * drift + Math.sin(age / 17 + seed) * 0.6 * scale;
    const pz = o[2] + WIND[2] * drift;
    const ph2 = o[1] + rise;
    const rad = (1.9 + plume.grow * ag) * scale;
    // dense at the mouth, thinning as it rises and spreads
    const a = Math.pow(1 - t, 2.2) * Math.min(1, age / 6) * plume.op;
    if (a < 0.012) continue;
    const p = project(c, px, ph2, pz);
    const r = rad * rOf(c, pz);
    els.push(<circle key={k} cx={fx(p[0])} cy={fx(p[1])} r={fx(r)} fill={`url(#${uid}g)`} opacity={a} />);
  }
  const col = A.toneH(tint ?? mixHex(SMOKE_C.mid, SMOKE_C.lit, 0.5), Z, h + 10);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}g`}>
          <stop offset="0" stopColor={col} stopOpacity={0.75} />
          <stop offset="0.35" stopColor={col} stopOpacity={0.5} />
          <stop offset="0.7" stopColor={col} stopOpacity={0.18} />
          <stop offset="1" stopColor={col} stopOpacity={0} />
        </radialGradient>
      </defs>
      {els.reverse()}
    </g>
  );
};
// ---- the rail frame: a vehicle on the rail at s (along the climb) is built in (a along the rail, b up off it, c across)
const IRON: Mat = { lit: "#5E6467", mid: "#3F4447", dark: "#202426" };
const CARRIAGE: Mat = { lit: "#8A5A48", mid: "#6C4334", dark: "#38221A" };
/** the train is built in its own units and scaled by TRAIN.k to world metres (a big, readable 1830s train) */
const railFrame = (u: number, K = TRAIN.k) => {
  const { P: B, T, C } = TRACK(u);
  // the vehicle's up: perpendicular to the track, toward the sky
  let N: V3 = [T[1] * C[2] - T[2] * C[1], T[2] * C[0] - T[0] * C[2], T[0] * C[1] - T[1] * C[0]];
  if (N[1] < 0) N = neg(N);
  return (a0: number, b0: number, c0: number): V3 => {
    const a = a0 * K;
    const b = b0 * K;
    const cc = c0 * K;
    return [B[0] + a * T[0] + b * N[0] + cc * C[0], B[1] + 0.25 + a * T[1] + b * N[1] + cc * C[1], B[2] + a * T[2] + b * N[2] + cc * C[2]];
  };
};
type RF = ReturnType<typeof railFrame>;
const oboxFaces = (L: RF, a0: number, a1: number, b0: number, b1: number, c0: number, c1: number, mat: Mat, top?: Mat): Face[] => {
  const P = (a: number, b: number, c: number) => L(a, b, c);
  return [
    { q: [P(a0, b0, c0), P(a1, b0, c0), P(a1, b1, c0), P(a0, b1, c0)], mat },
    { q: [P(a0, b0, c1), P(a1, b0, c1), P(a1, b1, c1), P(a0, b1, c1)], mat },
    { q: [P(a0, b0, c0), P(a0, b0, c1), P(a0, b1, c1), P(a0, b1, c0)], mat },
    { q: [P(a1, b0, c0), P(a1, b0, c1), P(a1, b1, c1), P(a1, b1, c0)], mat },
    { q: [P(a0, b1, c0), P(a1, b1, c0), P(a1, b1, c1), P(a0, b1, c1)], mat: top ?? mat, rim: 1 },
    { q: [P(a0, b0, c0), P(a1, b0, c0), P(a1, b0, c1), P(a0, b0, c1)], mat },
  ];
};
/** a convex hull (screen) */
const hull = (pts: P2[]): P2[] => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const hi: P2[] = [];
  for (const q of p.slice().reverse()) {
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
/** the locomotive's s on the rail: it inches up the bend all through the cut */
export const LOCO_S = (frame: number) => 16 + 0.07 * frame;
export const TRAIN = { k: 1.75, loco: 7.6, tender: 4.4, car: 7.4, gap: 0.6, cars: 3 };
const TK = (v: number) => v * TRAIN.k;
const Locomotive: React.FC<{ A: TAir; frame: number; uid: string }> = ({ A, frame, uid }) => {
  const c = A.c;
  const s0 = LOCO_S(frame);
  // the vehicles behind the engine (downhill), each centred on its own stretch of track
  type Veh = { u: number; len: number; kind: "loco" | "car" | "tender" };
  const vehs: Veh[] = [{ u: s0 - TK(TRAIN.loco / 2), len: TRAIN.loco, kind: "loco" }];
  let back = s0 - TK(TRAIN.loco + TRAIN.gap);
  vehs.push({ u: back - TK(TRAIN.tender / 2), len: TRAIN.tender, kind: "tender" });
  back -= TK(TRAIN.tender + TRAIN.gap);
  for (let i = 0; i < TRAIN.cars; i++) {
    vehs.push({ u: back - TK(TRAIN.car / 2), len: TRAIN.car, kind: "car" });
    back -= TK(TRAIN.car + TRAIN.gap);
  }
  const lwv = lwAt(c, TRACK(s0).P[2], 0.04);
  // the wheels turn with the distance run (all wheels the same distance)
  const wheel = (L: RF, a: number, r: number, cc: number, key: string) => {
    const q: P2[] = [];
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      const v = L(a + r * Math.cos(t), r + r * Math.sin(t), cc);
      q.push(project(c, v[0], v[1], v[2]));
    }
    const v0 = L(a, r, cc);
    const th = -s0 / (r * TRAIN.k);
    let sp = "";
    for (let k = 0; k < 3; k++) {
      const an = th + (k * Math.PI) / 3;
      const pa = L(a + 0.8 * r * Math.cos(an), r + 0.8 * r * Math.sin(an), cc + 0.02);
      const pb = L(a - 0.8 * r * Math.cos(an), r - 0.8 * r * Math.sin(an), cc + 0.02);
      sp += `M${pt(project(c, pa[0], pa[1], pa[2]))}L${pt(project(c, pb[0], pb[1], pb[2]))}`;
    }
    const tnw = (hex: string) => A.toneH(hex, v0[2], v0[1]);
    return (
      <g key={key}>
        <path d={poly(q)} fill={tnw(mixHex(IRON.dark, "#5A3A2A", 0.3))} stroke={tnw(IRON.mid)} strokeWidth={lwv * 1.4} />
        <path d={sp} stroke={tnw(IRON.mid)} strokeWidth={lwv * 1.1} strokeLinecap="round" />
      </g>
    );
  };
  const drawn = vehs
    .map((v) => ({ v, z: TRACK(v.u).P[2] }))
    .sort((p, q) => q.z - p.z)
    .map(({ v }, i) => {
      const L = railFrame(v.u);
      const h = v.len / 2;
      const els: React.ReactNode[] = [];
      const zm = TRACK(v.u).P;
      const tn = (hex: string) => A.toneH(hex, zm[2], zm[1]);
      if (v.kind === "tender") {
        els.push(<Solid key="tb" A={A} faces={oboxFaces(L, -h, h, 0.7, 2.6, -1.3, 1.3, IRON)} />);
        els.push(<Solid key="tc" A={A} faces={oboxFaces(L, -h + 0.4, h - 0.4, 2.6, 3.0, -1.1, 1.1, mixMat(IRON, "#2A2420"))} />);
        els.push(wheel(L, -h * 0.55, 0.45, 1.32, "w1"), wheel(L, h * 0.55, 0.45, 1.32, "w2"));
      } else if (v.kind === "car") {
        els.push(<Solid key="cb" A={A} faces={oboxFaces(L, -h, h, 0.75, 3.1, -1.35, 1.35, CARRIAGE, MAT.timber)} />);
        els.push(<Solid key="cr" A={A} faces={oboxFaces(L, -h - 0.15, h + 0.15, 3.1, 3.4, -1.5, 1.5, MAT.timber)} />);
        let d = "";
        for (let k = 0; k < 4; k++) {
          const a0 = -h + 0.8 + k * ((v.len - 1.6) / 4);
          d += poly([L(a0, 1.85, 1.37), L(a0 + 0.95, 1.85, 1.37), L(a0 + 0.95, 2.75, 1.37), L(a0, 2.75, 1.37)].map((q) => project(c, q[0], q[1], q[2])));
        }
        els.push(<path key="cw" d={d} fill={tn("#D8CBAE")} />);
        els.push(wheel(L, -h * 0.65, 0.45, 1.36, "w1"), wheel(L, h * 0.65, 0.45, 1.36, "w2"));
      } else {
        // the locomotive: frame, buffer beam, boiler (a cylinder along the track) with orange bands, smokebox,
        // flared chimney, dome, cab with an overhanging roof, the firebox's orange glow, spoked wheels
        const mid = L(0, 2, 0);
        const tl = (hex: string) => A.toneH(hex, mid[2], mid[1]);
        els.push(<Solid key="lf" A={A} faces={oboxFaces(L, -h, h, 0.6, 1.2, -1.2, 1.2, IRON)} />);
        els.push(<Solid key="bb" A={A} faces={oboxFaces(L, h - 0.25, h + 0.1, 0.55, 1.25, -1.35, 1.35, BRICK)} />);
        const bR = 0.85;
        const bB = 2.05;
        const ring = (a: number, half = false): P2[] => {
          const q: P2[] = [];
          const n = 18;
          for (let k = 0; k <= n; k++) {
            const t = half ? -Math.PI / 2 + (k / n) * Math.PI : (k / n) * Math.PI * 2;
            const p = L(a, bB + bR * Math.sin(t), bR * Math.cos(t));
            q.push(project(c, p[0], p[1], p[2]));
          }
          return q;
        };
        const aF = h - 0.4;
        const aB = -h + 2.4;
        els.push(<path key="bo" d={poly(hull([...ring(aF), ...ring(aB)]))} fill={tl(formTone(IRON, 0.1, PAL.shadow))} stroke={tl(lineOf(IRON))} strokeWidth={lwv} />);
        els.push(<path key="bu" d={poly(hull([...ring(aF).slice(2, 8), ...ring(aB).slice(2, 8)]))} fill={tl(IRON.lit)} opacity={0.7} />);
        const bands = [aB + 0.5, (aB + aF) / 2, aF - 0.5].map((a) => `M${ring(a, true).map(pt).join("L")}`).join("");
        els.push(<path key="bnd" d={bands} fill="none" stroke={A.toneOH(ACCENT, mid[2], mid[1])} strokeWidth={Math.max(0.9, 0.22 * rOf(c, mid[2]))} strokeLinecap="round" />);
        els.push(<path key="sb" d={poly(ring(aF))} fill={tl(IRON.dark)} stroke={tl(lineOf(IRON))} strokeWidth={lwv} />);
        const stack = (a: number, r: number, b0: number, b1: number, key: string, flare = 1) => {
          const q: P2[] = [];
          for (let k = 0; k < 14; k++) {
            const t = (k / 14) * Math.PI * 2;
            const p0 = L(a + r * Math.cos(t), b0, r * Math.sin(t));
            const p1 = L(a + r * flare * Math.cos(t), b1, r * flare * Math.sin(t));
            q.push(project(c, p0[0], p0[1], p0[2]), project(c, p1[0], p1[1], p1[2]));
          }
          return <path key={key} d={poly(hull(q))} fill={tl(formTone(IRON, 0.2, PAL.shadow))} stroke={tl(lineOf(IRON))} strokeWidth={lwv} />;
        };
        els.push(stack(aF - 0.8, 0.32, bB + bR * 0.8, bB + bR + 1.25, "ch", 1.4));
        els.push(stack((aF + aB) / 2 - 0.3, 0.42, bB + bR * 0.8, bB + bR + 0.45, "dm", 0.8));
        els.push(<Solid key="cab" A={A} faces={oboxFaces(L, -h, -h + 2.3, 1.2, 3.8, -1.2, 1.2, IRON, IRON)} />);
        els.push(<Solid key="cabr" A={A} faces={oboxFaces(L, -h - 0.25, -h + 2.55, 3.8, 4.05, -1.45, 1.45, mixMat(IRON, "#2A2420"))} />);
        const flick = 0.75 + 0.25 * Math.sin(frame / 3.1) * Math.sin(frame / 7.3);
        els.push(<path key="fb" d={poly([L(-h + 2.2, 1.0, 1.23), L(-h + 2.95, 1.0, 1.23), L(-h + 2.95, 1.9, 1.23), L(-h + 2.2, 1.9, 1.23)].map((q) => project(c, q[0], q[1], q[2])))} fill={A.toneOH(mixHex(ACCENT_DEEP, ACCENT, flick), mid[2], mid[1])} />);
        els.push(<path key="cw" d={poly([L(-h + 0.5, 2.5, 1.23), L(-h + 1.7, 2.5, 1.23), L(-h + 1.7, 3.4, 1.23), L(-h + 0.5, 3.4, 1.23)].map((q) => project(c, q[0], q[1], q[2])))} fill={A.toneOH(mixHex(ACCENT_DEEP, ACCENT, flick * 0.8), mid[2], mid[1])} opacity={0.8} />);
        [h - 1.0, 0.6, -0.9, -2.4].forEach((a, k) => els.push(wheel(L, a, k === 0 ? 0.5 : 0.78, 1.24, `lw${k}`)));
      }
      return <g key={`v${i}`}>{els}</g>;
    });
  // the steam from the chimney, each puff left where the chimney was when it puffed
  const mouth = (t: number): V3 => {
    const u = LOCO_S(t) - TK(TRAIN.loco / 2);
    const L = railFrame(u);
    return L(TRAIN.loco / 2 - 1.2, 2.05 + 0.85 + 1.3, 0);
  };
  const m0 = mouth(frame);
  return (
    <g>
      {drawn}
      <Smoke key="st" A={A} X={m0[0]} h={m0[1]} Z={m0[2]} seed={77} frame={frame} uid={`${uid}st`} scale={0.45} tint="#D8D0C2" srcAt={mouth} />
    </g>
  );
};
const mixMat = (m: Mat, to: string): Mat => ({ lit: mixHex(m.lit, to, 0.3), mid: mixHex(m.mid, to, 0.3), dark: mixHex(m.dark, to, 0.3) });
/** the beam-engine house at the climb's foot: a tall stone house, the orange beam rocking out of its top */
const BeamEngine: React.FC<{ A: TAir; frame: number }> = ({ A, frame }) => {
  const c = A.c;
  const E = ENGINE;
  const tE = TERRACES[TERRACES.length - 1];
  const g0 = tE.g;
  const g1 = tE.g;
  const roof = g1 + E.Hh;
  const P = climbP;
  const house: Face[] = [
    { q: [P(E.s0, E.n0, g0), P(E.s0, E.n1, g0), P(E.s0, E.n1, roof), P(E.s0, E.n0, roof)], mat: STONE_T },
    { q: [P(E.s1, E.n0, g1), P(E.s1, E.n1, g1), P(E.s1, E.n1, roof), P(E.s1, E.n0, roof)], mat: STONE_T },
    { q: [P(E.s0, E.n0, g0), P(E.s1, E.n0, g1), P(E.s1, E.n0, roof), P(E.s0, E.n0, roof)], mat: STONE_T },
    { q: [P(E.s0, E.n1, g0), P(E.s1, E.n1, g1), P(E.s1, E.n1, roof), P(E.s0, E.n1, roof)], mat: STONE_T },
  ];
  const nm = (E.n0 + E.n1) / 2;
  const ridge = roof + 3;
  const roofF: Face[] = [
    { q: [P(E.s0, E.n0, roof), P(E.s1, E.n0, roof), P(E.s1, nm, ridge), P(E.s0, nm, ridge)], mat: SLATE, rim: 1 },
    { q: [P(E.s0, E.n1, roof), P(E.s1, E.n1, roof), P(E.s1, nm, ridge), P(E.s0, nm, ridge)], mat: SLATE, rim: 1 },
    { q: [P(E.s0, E.n0, roof), P(E.s0, E.n1, roof), P(E.s0, nm, ridge)], mat: STONE_T },
    { q: [P(E.s1, E.n0, roof), P(E.s1, E.n1, roof), P(E.s1, nm, ridge)], mat: STONE_T },
  ];
  // the beam: pivoted on the downhill wall's top, rocking; its outer end drives the pump rod down into the pit
  const ang = E.amp * Math.sin((2 * Math.PI * frame) / E.period);
  const piv = P(E.s0, nm, roof - 1.2);
  const dir: V3 = [-D2[0] * Math.cos(ang), Math.sin(ang), -D2[1] * Math.cos(ang)];
  const C: V3 = [D2[1], 0, -D2[0]];
  const at = (t: number, up: number, cc: number): V3 => [piv[0] + dir[0] * t + cc * C[0], piv[1] + dir[1] * t + up, piv[2] + dir[2] * t + cc * C[2]];
  const beam: Face[] = (() => {
    const t0 = -E.beamIn;
    const t1 = E.beamOut;
    const q = (t: number, u: number, cc: number) => at(t, u, cc);
    return [
      { q: [q(t0, -0.35, 0.4), q(t1, -0.35, 0.4), q(t1, 0.45, 0.4), q(t0, 0.45, 0.4)], mat: MAT.orange, orange: true },
      { q: [q(t0, -0.35, -0.4), q(t1, -0.35, -0.4), q(t1, 0.45, -0.4), q(t0, 0.45, -0.4)], mat: MAT.orange, orange: true },
      { q: [q(t0, 0.45, 0.4), q(t1, 0.45, 0.4), q(t1, 0.45, -0.4), q(t0, 0.45, -0.4)], mat: MAT.orange, orange: true, rim: 1 },
      { q: [q(t0, -0.35, 0.4), q(t1, -0.35, 0.4), q(t1, -0.35, -0.4), q(t0, -0.35, -0.4)], mat: MAT.orange, orange: true },
      { q: [q(t0, -0.35, 0.4), q(t0, 0.45, 0.4), q(t0, 0.45, -0.4), q(t0, -0.35, -0.4)], mat: MAT.orange, orange: true },
      { q: [q(t1, -0.35, 0.4), q(t1, 0.45, 0.4), q(t1, 0.45, -0.4), q(t1, -0.35, -0.4)], mat: MAT.orange, orange: true },
    ];
  })();
  const endP = at(E.beamOut - 0.3, -0.35, 0);
  const foot: V3 = [endP[0], climbH(E.s0 - E.beamOut) - 1, endP[2]];
  const a = project(c, endP[0], endP[1], endP[2]);
  const b = project(c, foot[0], foot[1], foot[2]);
  const lw = lwAt(c, endP[2], 0.08);
  return (
    <g>
      <Solid A={A} faces={house} />
      <Solid A={A} faces={roofF} />
      <path d={`M${pt(a)}L${pt(b)}`} stroke={A.toneH(IRON.mid, endP[2], endP[1])} strokeWidth={lw * 2.2} />
      <Solid A={A} faces={beam} />
    </g>
  );
};
const industryItems = (A: TAir, frame: number, hide: Hide, build?: number): Item[] => {
  const out: Item[] = [];
  FACTORIES.mills.forEach((m, i) => {
    const t = TERRACES[i];
    const C = P3((t.s0 + t.s1) / 2, (t.n0 + t.n1) / 2, 0);
    out.push({
      d: C[2],
      key: `ml${i}`,
      el: (
        <g key={`ml${i}`}>
          <TerraceWalls A={A} t={t} />
          <MillSolid A={A} m={m} t={t} frame={frame} grow={millGrowth(i, build)} />
        </g>
      ),
    });
  });
  {
    const E = ENGINE;
    const tE = TERRACES[TERRACES.length - 1];
    const C0 = P3((tE.s0 + tE.s1) / 2, (tE.n0 + tE.n1) / 2, 0);
    out.push({
      d: C0[2],
      key: "beng",
      el: (
        <g key="beng">
          <TerraceWalls A={A} t={tE} />
          <BeamEngine A={A} frame={frame} />
        </g>
      ),
    });
    const ch = P3(E.s1 - 1.5, E.n0 + 2.2, 0);
    const top = tE.g + 30;
    out.push({ d: ch[2] - 0.4, key: "bech", el: <AirCyl key="bech" A={A} X={ch[0]} Z={ch[2]} R={1.2} Y0={-top} Y1={-tE.g} mat={STONE_T} uid="bech" lw={lwAt(A.c, ch[2])} /> });
  }
  if (!hide.train) {
    const Lp = TRACK(LOCO_S(frame) - TK(TRAIN.loco / 2)).P;
    out.push({ d: Lp[2] - 2, key: "loco", el: <Locomotive key="loco" A={A} frame={frame} uid="loco" /> });
  }
  FACTORIES.chims.forEach((ch, i) => {
    const t = TERRACES[i];
    const P0 = P3(ch.s, ch.n, 0);
    const g = t.g;
    const gc = chimGrowth(i, build);
    if (gc <= 0.001) return;
    const top = g + ch.Hc * gc;
    out.push({
      d: P0[2] - 0.5,
      key: `ch${i}`,
      el: (
        <g key={`ch${i}`}>
          <AirCyl A={A} X={P0[0]} Z={P0[2]} R={ch.R} Y0={-top} Y1={-g} mat={BRICK} uid={`chc${i}`} lw={lwAt(A.c, P0[2])} joints={gc > 0.95 ? [-(g + (top - g) * 0.92)] : []} />
        </g>
      ),
    });
    // smoke pours from the chimney's mouth from half-way up its rise (each puff from where the mouth was)
    const mouth = (t: number): V3 => [P0[0], g + ch.Hc * chimGrowth(i, build === undefined ? undefined : t) + 0.5, P0[2]];
    if (!hide.smoke && ch.plume && gc > 0.5) out.push({ d: P0[2] - 30, key: `sm${i}`, el: <Smoke key={`sm${i}`} A={A} X={P0[0]} h={top + 0.5} Z={P0[2]} seed={ch.seed} frame={frame} uid={`sm${i}`} plume={ch.plume} start={smokeStart(i, build)} srcAt={mouth} /> });
  });
  return out;
};

// ===================================================================================================================
// THE WORLD
// ===================================================================================================================
/** items nearer than this to the eye (m) are culled (a town house or the aqueduct is never drawn through the lens) */
export const CULL_AHEAD = 3;
export type Hide = Partial<Record<"town" | "figures" | "industry" | "milestones" | "train" | "smoke", boolean>>;
// ===================================================================================================================
// THE FLAT: a few far farmsteads along the road of history (the centuries between Rome and the knee)
// ===================================================================================================================
const TIMBER_F: Mat = { lit: "#8C6E4E", mid: "#6E553B", dark: "#3A2B1D" };
export const FARMS = [
  { s: 50, n: -36, rot: 0 },
  { s: 30, n: -40, rot: 1 },
  { s: -150, n: -30, rot: 0 },
];
const farmItems = (A: TAir): Item[] =>
  FARMS.map((f, i) => {
    const r = roadAt(f.s);
    const X = r.X + f.n * r.dz;
    const Z = r.Z - f.n * r.dx;
    const g = terrainH(X, Z);
    return {
      d: Z,
      key: `farm${i}`,
      el: (
        <g key={`farm${i}`}>
          <Solid A={A} faces={boxFaces(X - 5, X + 4, g, g + 4, Z - 3, Z + 3, PLASTER)} />
          <Solid A={A} faces={gableFaces(X - 5.4, X + 4.4, g + 4, g + 6.2, Z - 3.4, Z + 3.4, TILE, "x", PLASTER)} />
          <Solid A={A} faces={boxFaces(X + 6, X + 16, g, g + 5, Z + 1, Z + 8, TIMBER_F)} />
          <Solid A={A} faces={gableFaces(X + 5.6, X + 16.4, g + 5, g + 7.4, Z + 0.6, Z + 8.4, TILE, "x", TIMBER_F)} />
        </g>
      ),
    };
  });

export const TakeoffWorld: React.FC<{ A: TAir; frame: number; font: string; extras?: Item[]; hide?: Hide; uid?: string; build?: number }> = ({ A, frame, font, extras = [], hide = {}, uid = "tw", build }) => {
  // PASS 1, the ground: the plateau, the road over it, the climb's top (terraces' floors included) and the track on
  // it. Nothing in this world is hidden by ground it stands on from any camera that looks up or across the climb, so
  // the ground never paints over a building or the train (no z-fighting, no flicker).
  const plateau = plateauItems(A).filter((it) => it.d > A.c.Z - 200);
  plateau.sort((a, b) => b.d - a.d);
  const ground: Item[] = climbTopItems(A);
  ground.sort((a, b) => b.d - a.d);
  // the track lies ON the ground: drawn after all of it (nothing on the ground can cover it)
  const track = trackItems(A);
  track.sort((a, b) => b.d - a.d);
  // PASS 2, everything standing, sorted with the climb's near flank (which hides what stands beyond its edge)
  const items: Item[] = [...climbFlankItems(A, 1), ...climbFlankItems(A, -1), ...extras];
  if (!hide.town) items.push(...templeItems(A), ...houseItems(A), aqueductItem(A), ...farmItems(A));
  if (!hide.figures) items.push(...folkItems(A, frame));
  if (!hide.industry) items.push(...industryItems(A, frame, hide, build));
  if (!hide.milestones) {
    const p1 = milestonePos(M_AD100);
    items.push({ d: p1.Z, key: "m100", el: <Milestone key="m100" A={A} m={M_AD100} uid="m100" font={font} /> });
    items.push({ d: M_1800.Z, key: "m1800", el: <KneeStone key="m1800" A={A} font={font} /> });
  }
  // anything whose depth is at or behind the eye (bar the clipped terrain) is left out: no geometry behind the lens
  const live = items.filter((it) => it.terrain || it.d > A.c.Z + CULL_AHEAD);
  live.sort((a, b) => b.d - a.d);
  return (
    <g>
      <Plain A={A} id={`${uid}-plain`} />
      {roadDecal(A, ROAD_S0, KNEE_S - TRACK_BLEND[0])}
      <HorizonHaze A={A} id={`${uid}-hz`} />
      {plateau.map((it) => (
        <React.Fragment key={it.key}>{it.el}</React.Fragment>
      ))}
      {roadDecal(A, -100, KNEE_S - TRACK_BLEND[0])}
      {ground.map((it) => (
        <React.Fragment key={it.key}>{it.el}</React.Fragment>
      ))}
      {track.map((it) => (
        <React.Fragment key={it.key}>{it.el}</React.Fragment>
      ))}
      {hide.industry ? null : <CrestRim A={A} />}
      {live.map((it) => (
        <React.Fragment key={it.key}>{it.el}</React.Fragment>
      ))}
    </g>
  );
};
/** where the road of history starts (the far past, deep in the haze) */
export const ROAD_S0 = -420;
