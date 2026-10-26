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
// DRAWING: <TakeoffWorld A frame font extras? hide? uid? /> draws the whole world in painter's order (world depth Z,
//   stable under any camera that looks along +Z): the plain and the road of history on it, Rome's plateau (its ground,
//   the street's paving) with the road redrawn over it, then the climb's quads and every building, figure, milestone,
//   farm, mill, chimney, smoke plume and the train sorted far to near. extras: [{ d, key, el }] are
//   sorted in with it (d = the item's world Z). hide: { town, figures, industry, milestones, train, smoke }.
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
const climbAt = (X: number, Z: number) => {
  const { s, n } = climbLocal(X, Z);
  const top = climbH(s);
  const out = n >= 0 ? Math.max(0, n - CLIMB.halfW) : Math.max(0, CLIMB.nFar - n);
  return Math.max(0, top - out * CLIMB.flank);
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
/** the rail line up the middle of the climb: a dark ballast bed, sleepers, two iron rails with a cream glint */
export const RAIL = { n: 50, bed: 4.6, gauge: 1.44, sleeper: 0.8 };
const BALLAST: Mat = { lit: "#6E655A", mid: "#5A5249", dark: "#2E2925" };
const railDeco: Deco = (A, u0, u1, v0, v1, zm, hm) => {
  const c = A.c;
  if (Math.abs((v0 + v1) / 2 - RAIL.n) > RAIL.bed / 2) return null;
  const rr = rOf(c, zm);
  const vis = 1 - A.fogH(zm, hm);
  const P = (u: number, v0n: number) => {
    const v = RAIL.n + v0n;
    return project(c, KNEE.X + u * D2[0] + v * D2[1], climbH(u) + 0.12, KNEE.Z + u * D2[1] - v * D2[0]);
  };
  const ua = u0;
  const n = Math.max(2, Math.ceil((u1 - ua) / 2));
  const line = (v: number) => {
    const q: string[] = [];
    for (let i = 0; i <= n; i++) q.push(pt(P(ua + ((u1 - ua) * i) / n, v)));
    return `M${q.join("L")}`;
  };
  let sl = "";
  const slA = smoothstep(3, 6, rr * RAIL.sleeper);
  if (slA > 0.01) for (let u = Math.ceil(ua / RAIL.sleeper) * RAIL.sleeper; u < u1; u += RAIL.sleeper) sl += `M${pt(P(u, -1.25))}L${pt(P(u, 1.25))}`;
  const w = Math.max(0.5, Math.min(2.4, 0.09 * rr));
  return (
    <g>
      {sl ? <path d={sl} stroke={A.toneH("#4A3A2C", zm, hm)} strokeWidth={w * 1.6} strokeOpacity={0.7 * vis * slA} /> : null}
      <path d={line(-RAIL.gauge / 2) + line(RAIL.gauge / 2)} fill="none" stroke={A.toneH("#3A3D3F", zm, hm)} strokeWidth={w} />
      <path d={line(-RAIL.gauge / 2) + line(RAIL.gauge / 2)} fill="none" stroke={CREAM} strokeWidth={w * 0.45} strokeOpacity={0.35 * vis} transform="translate(0,-0.4)" />
    </g>
  );
};
/** the climb: the top (a grid in the climb's frame: s along D2 from the knee, n across) and the two flanks, whose
 *  vertices run exactly from the top's edge down to the flank's foot (t 0..1), so no quad straddles the foot */
export const CLIMB_SMAX = 430;
const climbItems = (A: TAir): Item[] => {
  const P3 = (s: number, n: number, h: number): [number, number, number] => [KNEE.X + s * D2[0] + n * D2[1], h, KNEE.Z + s * D2[1] - n * D2[0]];
  const us = [...range(-6, CLIMB_XC.xc, 30), ...range(CLIMB_XC.xc, CLIMB_SMAX, 26).slice(1)];
  const vs = [...range(CLIMB.nFar, RAIL.n - RAIL.bed / 2, 8), RAIL.n + RAIL.bed / 2, CLIMB.halfW];
  const top = patchItems(A, "clt", (u, v) => P3(u, v, climbH(u)), us, vs, (_u, v) => (Math.abs(v - RAIL.n) < RAIL.bed / 2 ? BALLAST : LAND), 0, railDeco);
  const ts = range(0, 1, 6, 1.4);
  const flank = (side: 1 | -1, key: string) =>
    patchItems(A, key, (u, t) => {
      const hTop = climbH(u);
      return P3(u, side > 0 ? CLIMB.halfW + (t * hTop) / CLIMB.flank : CLIMB.nFar - (t * hTop) / CLIMB.flank, hTop * (1 - t));
    }, us, ts, () => LAND, 0);
  // the rail's approach across the plain from the left, into the knee
  const appr = patchItems(A, "cla", (u, v) => P3(u, v, 0.03), range(-44, -2, 9), [RAIL.n - RAIL.bed / 2, RAIL.n + RAIL.bed / 2], () => BALLAST, -0.4, railDeco);
  return [...top, ...flank(1, "cfn"), ...flank(-1, "cff"), ...appr];
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
export const M_1800 = { X: KNEE.X - 4, Z: KNEE.Z - 22, W: 13, D: 2.6, Hs: 8.4, text: "1800", cap: 4.4 };
const KneeStone: React.FC<{ A: TAir; font: string }> = ({ A, font }) => {
  const c = A.c;
  const m = M_1800;
  const X0 = m.X - m.W / 2;
  const X1 = m.X + m.W / 2;
  const g = terrainH(m.X, m.Z);
  const Zf = m.Z - m.D / 2;
  const ty = g + m.Hs * 0.5;
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
/** the climb's few big mills, stepped up the slope on stone terraces (s along the climb, n across, + toward the
 *  viewer), each with a tall chimney behind it; lit windows more and more the higher up */
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
    { len: 40, rise: 0.9, drift: 1.15, grow: 0.095, op: 0.3 },
    { len: 62, rise: 1.15, drift: 0.8, grow: 0.16, op: 0.27 },
    { len: 50, rise: 0.85, drift: 1.0, grow: 0.11, op: 0.32 },
    { len: 72, rise: 1.0, drift: 1.3, grow: 0.14, op: 0.34 },
  ];
  const chims: Chim[] = spec.map((m, i) => ({ s: m.s1 + 2.5, n: m.n0 + 5, R: 2.1, Hc: 62 + 8 * random(`cH${i}`), seed: i + 1, plume: plumes[i] }));
  return { mills, chims };
})();
/** a window grid on one wall: u along the wall (0..1), floors up from the wall's foot (level floors) */
const windowsOn = (A: TAir, a: V3, b: V3, footA: number, footB: number, roof: number, floors: number, lit: number, seed: number, glow: number) => {
  const c = A.c;
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const nCol = Math.max(2, Math.floor(len / 2.8));
  let dLit = "";
  let dDark = "";
  const fl = (roof - Math.max(footA, footB) - 1.2) / floors;
  for (let k = 0; k < floors; k++) {
    const y0 = Math.max(footA, footB) + 0.9 + k * fl;
    const y1 = y0 + fl * 0.6;
    for (let j = 0; j < nCol; j++) {
      const u0 = (j + 0.24) / nCol;
      const u1 = (j + 0.76) / nCol;
      const P = (u: number, y: number) => project(c, a[0] + (b[0] - a[0]) * u, y, a[2] + (b[2] - a[2]) * u);
      const q = `M${pt(P(u0, y0))}L${pt(P(u1, y0))}L${pt(P(u1, y1))}L${pt(P(u0, y1))}Z`;
      if (random(`w${seed}_${k}_${j}`) < lit) dLit += q;
      else dDark += q;
    }
  }
  // the lower floors of a downhill wall (below the uphill foot) get windows too
  const extra = Math.min(footA, footB);
  const top0 = Math.max(footA, footB);
  if (top0 - extra > 3) {
    const nf = Math.floor((top0 - extra - 1) / fl);
    for (let k = 0; k < nf; k++) {
      const y0 = top0 - (k + 1) * fl + 0.9;
      const y1 = y0 + fl * 0.55;
      for (let j = 0; j < nCol; j++) {
        const u0 = (j + 0.28) / nCol;
        const u1 = (j + 0.72) / nCol;
        // only where the wall stands above the ground (the foot runs from footA at u 0 to footB at u 1)
        const gu = footA + (footB - footA) * ((u0 + u1) / 2);
        if (y0 < gu + 0.6) continue;
        const P = (u: number, y: number) => project(c, a[0] + (b[0] - a[0]) * u, y, a[2] + (b[2] - a[2]) * u);
        const q = `M${pt(P(u0, y0))}L${pt(P(u1, y0))}L${pt(P(u1, y1))}L${pt(P(u0, y1))}Z`;
        if (random(`wl${seed}_${k}_${j}`) < lit) dLit += q;
        else dDark += q;
      }
    }
  }
  const zm = (a[2] + b[2]) / 2;
  const hm = (roof + extra) / 2;
  return (
    <g>
      {dDark ? <path d={dDark} fill={A.toneH(SOOT, zm, hm)} /> : null}
      {dLit ? <path d={dLit} fill={A.toneOH(mixHex(ACCENT_DEEP, ACCENT, glow), zm, hm)} /> : null}
    </g>
  );
};
const MillSolid: React.FC<{ A: TAir; m: Mill; frame: number }> = ({ A, m, frame }) => {
  const c = A.c;
  const g0 = climbH(m.s0);
  const g1 = climbH(m.s1);
  const roof = g1 + m.Hb;
  const P = climbP;
  // the terrace: a stone pad from the slope up to the mill's level floor (g1)
  const pad: Face[] =
    g1 - g0 > 0.4
      ? [
          { q: [P(m.s0, m.n0, g0 - 0.5), P(m.s0, m.n1, g0 - 0.5), P(m.s0, m.n1, g1), P(m.s0, m.n0, g1)], mat: STONE_T },
          { q: [P(m.s0, m.n0, g0 - 0.5), P(m.s1, m.n0, g1 - 0.5), P(m.s1, m.n0, g1), P(m.s0, m.n0, g1)], mat: STONE_T },
          { q: [P(m.s0, m.n1, g0 - 0.5), P(m.s1, m.n1, g1 - 0.5), P(m.s1, m.n1, g1), P(m.s0, m.n1, g1)], mat: STONE_T },
          { q: [P(m.s0, m.n0, g1), P(m.s0, m.n1, g1), P(m.s1, m.n1, g1), P(m.s1, m.n0, g1)], mat: STONE_T },
        ]
      : [];
  const f = g1;
  const b00 = P(m.s0, m.n0, f);
  const b01 = P(m.s0, m.n1, f);
  const b10 = P(m.s1, m.n0, f);
  const b11 = P(m.s1, m.n1, f);
  const t00 = P(m.s0, m.n0, roof);
  const t01 = P(m.s0, m.n1, roof);
  const t10 = P(m.s1, m.n0, roof);
  const t11 = P(m.s1, m.n1, roof);
  const faces: Face[] = [
    { q: [b00, b01, t01, t00], mat: BRICK },
    { q: [b10, b11, t11, t10], mat: BRICK },
    { q: [b00, b10, t10, t00], mat: BRICK },
    { q: [b01, b11, t11, t01], mat: BRICK },
  ];
  // a low slate roof, the ridge along the slope
  const nm = (m.n0 + m.n1) / 2;
  const rh = roof + 2.4;
  const r0 = P(m.s0, nm, rh);
  const r1 = P(m.s1, nm, rh);
  const roofF: Face[] = [
    { q: [t00, t10, r1, r0], mat: SLATE, rim: 1 },
    { q: [t01, t11, r1, r0], mat: SLATE, rim: 1 },
    { q: [t00, t01, r0], mat: BRICK },
    { q: [t10, t11, r1], mat: BRICK },
  ];
  const glow = 0.55 + 0.45 * Math.sin(frame / 9 + m.seed * 1.7) * Math.sin(frame / 23 + m.seed);
  const toEye = (q: V3[], n: V3) => {
    const fc = cen(q);
    return n[0] * (c.X - fc[0]) + n[1] * (c.H - fc[1]) + n[2] * (c.Z - fc[2]) > 0;
  };
  const nDown: V3 = [-D2[0], 0, -D2[1]];
  const nNear: V3 = [D2[1], 0, -D2[0]];
  const wins: React.ReactNode[] = [];
  if (toEye([b00, b01, t01, t00], nDown)) wins.push(<g key="wd">{windowsOn(A, b00, b01, f, f, roof, m.floors, m.lit, m.seed, glow)}</g>);
  if (toEye([b01, b11, t11, t01], nNear)) wins.push(<g key="wn">{windowsOn(A, b01, b11, f, f, roof, m.floors, m.lit, m.seed + 500, glow)}</g>);
  if (toEye([b00, b10, t10, t00], [-nNear[0], 0, -nNear[2]])) wins.push(<g key="wf">{windowsOn(A, b10, b00, f, f, roof, m.floors, m.lit, m.seed + 900, glow)}</g>);
  return (
    <g>
      {pad.length ? <Solid A={A} faces={pad} /> : null}
      <Solid A={A} faces={faces} />
      {wins}
      <Solid A={A} faces={roofF} />
    </g>
  );
};
/** smoke: puffs born at a chimney's mouth on a fixed beat, rising and drifting downwind, swelling and thinning */
export const WIND: V3 = [-1.0, 0.0, -0.12];
const SMOKE_C = { lit: "#9C9284", mid: "#7E7468", dark: "#4E463E" };
/** a plume's character: puffs (length), draught (rise), how hard the wind takes it (drift), how fast it swells
 *  (grow) and how dense it starts (op). Every plume leans the same way, with the wind. */
export type Plume = { len: number; rise: number; drift: number; grow: number; op: number };
const PLUME_STEAM: Plume = { len: 30, rise: 1, drift: 0.9, grow: 0.085, op: 0.32 };
const Smoke: React.FC<{ A: TAir; X: number; h: number; Z: number; seed: number; frame: number; uid: string; scale?: number; tint?: string; plume?: Plume }> = ({ A, X, h, Z, seed, frame, uid, scale = 1, tint, plume = PLUME_STEAM }) => {
  const c = A.c;
  const P = 4;
  const N = plume.len;
  const els: React.ReactNode[] = [];
  const ph = random(`sp${seed}`) * P;
  const base = Math.floor((frame + ph) / P);
  for (let k = 0; k < N; k++) {
    const born = (base - k) * P - ph;
    const age = frame - born;
    if (age < 0) continue;
    const t = age / (N * P);
    // rising out of the mouth, then bending downwind
    const rise = (0.42 * age - 0.0009 * age * age) * scale * plume.rise;
    const drift = (0.08 * age + 0.0016 * age * age) * scale * plume.drift;
    const px = X + WIND[0] * drift + Math.sin(age / 17 + seed) * 0.6 * scale;
    const pz = Z + WIND[2] * drift;
    const ph2 = h + rise;
    const rad = (1.9 + plume.grow * age) * scale;
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
const railFrame = (s: number, K = TRAIN.k) => {
  const m = climbSlope(s);
  const th = Math.atan(m);
  const B = climbP(s, RAIL.n, climbH(s));
  const T: V3 = [D2[0] * Math.cos(th), Math.sin(th), D2[1] * Math.cos(th)];
  const N: V3 = [-D2[0] * Math.sin(th), Math.cos(th), -D2[1] * Math.sin(th)];
  const C: V3 = [D2[1], 0, -D2[0]];
  return (a0: number, b0: number, c0: number): V3 => {
    const a = a0 * K;
    const b = b0 * K;
    const cc = c0 * K;
    return [B[0] + a * T[0] + b * N[0] + cc * C[0], B[1] + a * T[1] + b * N[1] + cc * C[1], B[2] + a * T[2] + b * N[2] + cc * C[2]];
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
  const els: React.ReactNode[] = [];
  const zOf = (v: V3) => v[2];
  // the carriages and the tender behind (downhill), each on its own stretch of rail; drawn from the far end
  const cars: { s: number; len: number; kind: "car" | "tender" }[] = [];
  let back = s0 - TK(TRAIN.loco + TRAIN.gap);
  cars.push({ s: back - TK(TRAIN.tender / 2), len: TRAIN.tender, kind: "tender" });
  back -= TK(TRAIN.tender + TRAIN.gap);
  for (let i = 0; i < TRAIN.cars; i++) {
    cars.push({ s: back - TK(TRAIN.car / 2), len: TRAIN.car, kind: "car" });
    back -= TK(TRAIN.car + TRAIN.gap);
  }
  const lwv = lwAt(c, climbP(s0, 0, 0)[2], 0.04);
  const wheel = (L: RF, a: number, r: number, cc: number, key: string) => {
    const q: P2[] = [];
    for (let i = 0; i < 14; i++) {
      const t = (i / 14) * Math.PI * 2;
      const v = L(a + r * Math.cos(t), r + r * Math.sin(t), cc);
      q.push(project(c, v[0], v[1], v[2]));
    }
    const v0 = L(a, r, cc);
    return <path key={key} d={poly(q)} fill={A.toneH(mixHex(IRON.dark, "#5A3A2A", 0.3), zOf(v0), v0[1])} stroke={A.toneH(IRON.mid, zOf(v0), v0[1])} strokeWidth={lwv} />;
  };
  cars.reverse().forEach((cr, i) => {
    const L = railFrame(cr.s);
    const h = cr.len / 2;
    if (cr.kind === "tender") {
      els.push(<Solid key={`t${i}`} A={A} faces={oboxFaces(L, -h, h, 0.7, 2.7, -1.3, 1.3, IRON)} />);
      els.push(wheel(L, -h * 0.55, 0.45, 1.32, `tw${i}a`), wheel(L, h * 0.55, 0.45, 1.32, `tw${i}b`));
    } else {
      els.push(<Solid key={`c${i}`} A={A} faces={oboxFaces(L, -h, h, 0.75, 3.1, -1.35, 1.35, CARRIAGE, MAT.timber)} />);
      // a row of small cream windows on the near side
      const v0 = L(0, 2.2, 1.37);
      let d = "";
      for (let k = 0; k < 4; k++) {
        const a0 = -h + 0.9 + k * ((cr.len - 1.8) / 4);
        const q = [L(a0, 1.9, 1.37), L(a0 + 0.9, 1.9, 1.37), L(a0 + 0.9, 2.7, 1.37), L(a0, 2.7, 1.37)].map((v) => project(c, v[0], v[1], v[2]));
        d += poly(q);
      }
      els.push(<path key={`cw${i}`} d={d} fill={A.toneH("#D8CBAE", zOf(v0), v0[1])} />);
      els.push(wheel(L, -h * 0.65, 0.45, 1.36, `cw${i}a`), wheel(L, h * 0.65, 0.45, 1.36, `cw${i}b`));
    }
  });
  // the locomotive: frame, boiler (a cylinder along the rail), smokebox, chimney, dome, cab, firebox glow, wheels
  const sl = s0 - TK(TRAIN.loco / 2);
  const L = railFrame(sl);
  const h = TRAIN.loco / 2;
  const mid = L(0, 2, 0);
  els.push(<Solid key="lf" A={A} faces={oboxFaces(L, -h, h, 0.6, 1.2, -1.2, 1.2, IRON)} />);
  // the boiler
  const bR = 0.85;
  const bB = 2.05;
  const ring = (a: number, half = false): P2[] => {
    const q: P2[] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const t = half ? -Math.PI / 2 + (i / n) * Math.PI : (i / n) * Math.PI * 2;
      const v = L(a, bB + bR * Math.sin(t), bR * Math.cos(t));
      q.push(project(c, v[0], v[1], v[2]));
    }
    return q;
  };
  const aF = h - 0.4;
  const aB = -h + 2.4;
  const bodyHull = hull([...ring(aF), ...ring(aB)]);
  const tn = (hex: string) => A.toneH(hex, mid[2], mid[1]);
  els.push(<path key="bo" d={poly(bodyHull)} fill={tn(formTone(IRON, 0.1, PAL.shadow))} stroke={tn(lineOf(IRON))} strokeWidth={lwv} />);
  // the lit upper flank of the boiler
  const upper = hull([...ring(aF).slice(2, 7), ...ring(aB).slice(2, 7)]);
  els.push(<path key="bu" d={poly(upper)} fill={tn(IRON.lit)} opacity={0.75} />);
  // orange boiler bands (the near half rings)
  const bands = [aB + 0.5, (aB + aF) / 2, aF - 0.5].map((a) => `M${ring(a, true).map(pt).join("L")}`).join("");
  const orangeCol = A.toneOH(ACCENT, mid[2], mid[1]);
  els.push(<path key="bb" d={bands} fill="none" stroke={orangeCol} strokeWidth={Math.max(0.8, 0.22 * rOf(c, mid[2]))} strokeLinecap="round" />);
  // the smokebox front
  els.push(<path key="sb" d={poly(ring(aF))} fill={tn(IRON.dark)} stroke={tn(lineOf(IRON))} strokeWidth={lwv} />);
  // chimney and dome (short vertical-ish cylinders off the boiler's top)
  const stack = (a: number, r: number, b0: number, b1: number, key: string, flare = 1) => {
    const q: P2[] = [];
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      const v0 = L(a + r * Math.cos(t), b0, r * Math.sin(t));
      const v1 = L(a + r * flare * Math.cos(t), b1, r * flare * Math.sin(t));
      q.push(project(c, v0[0], v0[1], v0[2]), project(c, v1[0], v1[1], v1[2]));
    }
    return <path key={key} d={poly(hull(q))} fill={tn(formTone(IRON, 0.2, PAL.shadow))} stroke={tn(lineOf(IRON))} strokeWidth={lwv} />;
  };
  els.push(stack(aF - 0.8, 0.32, bB + bR * 0.8, bB + bR + 1.25, "ch", 1.35));
  els.push(stack((aF + aB) / 2 - 0.3, 0.42, bB + bR * 0.8, bB + bR + 0.45, "dm", 0.8));
  // the cab and the firebox's orange mouth under it
  els.push(<Solid key="cab" A={A} faces={oboxFaces(L, -h, -h + 2.3, 1.2, 4.0, -1.25, 1.25, IRON, IRON)} />);
  const fb = [L(-h + 2.2, 1.0, 1.27), L(-h + 2.95, 1.0, 1.27), L(-h + 2.95, 1.9, 1.27), L(-h + 2.2, 1.9, 1.27)].map((v) => project(c, v[0], v[1], v[2]));
  const flick = 0.75 + 0.25 * Math.sin(frame / 3.1) * Math.sin(frame / 7.3);
  els.push(<path key="fb" d={poly(fb)} fill={A.toneOH(mixHex(ACCENT_DEEP, ACCENT, flick), mid[2], mid[1])} />);
  const cw = [L(-h + 0.5, 2.6, 1.27), L(-h + 1.7, 2.6, 1.27), L(-h + 1.7, 3.5, 1.27), L(-h + 0.5, 3.5, 1.27)].map((v) => project(c, v[0], v[1], v[2]));
  els.push(<path key="cw" d={poly(cw)} fill={A.toneOH(mixHex(ACCENT_DEEP, ACCENT, flick * 0.8), mid[2], mid[1])} opacity={0.8} />);
  [h - 1.0, 0.6, -0.9, -2.4].forEach((a, i) => els.push(wheel(L, a, i === 0 ? 0.5 : 0.78, 1.24, `lw${i}`)));
  // the steam from the chimney
  const top = L(aF - 0.8, bB + bR + 1.3, 0);
  els.push(<Smoke key="st" A={A} X={top[0]} h={top[1]} Z={top[2]} seed={77} frame={frame} uid={`${uid}st`} scale={0.45} tint="#D8D0C2" />);
  return <g>{els}</g>;
};
/** the beam-engine house at the climb's foot: a tall stone house, the orange beam rocking out of its top */
export const ENGINE = { s0: 2, s1: 13, n0: -22, n1: -11, Hh: 15, beamOut: 5.5, beamIn: 3.5, period: 62, amp: 0.2 };
const BeamEngine: React.FC<{ A: TAir; frame: number }> = ({ A, frame }) => {
  const c = A.c;
  const E = ENGINE;
  const g0 = climbH(E.s0);
  const g1 = climbH(E.s1);
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
const industryItems = (A: TAir, frame: number, hide: Hide): Item[] => {
  const out: Item[] = [];
  FACTORIES.mills.forEach((m, i) => {
    const C = climbP((m.s0 + m.s1) / 2, (m.n0 + m.n1) / 2, 0);
    out.push({ d: C[2] - 0.3, key: `ml${i}`, el: <MillSolid key={`ml${i}`} A={A} m={m} frame={frame} /> });
  });
  {
    const E = ENGINE;
    const C0 = climbP((E.s0 + E.s1) / 2, (E.n0 + E.n1) / 2, 0);
    out.push({ d: C0[2] - 0.3, key: "beng", el: <BeamEngine key="beng" A={A} frame={frame} /> });
    const ch = climbP(E.s1 - 1.5, E.n0 + 2.2, 0);
    const top = climbH(E.s1) + 30;
    out.push({ d: ch[2] - 0.4, key: "bech", el: <AirCyl key="bech" A={A} X={ch[0]} Z={ch[2]} R={1.2} Y0={-top} Y1={-climbH(E.s1 - 2.6)} mat={STONE_T} uid="bech" lw={lwAt(A.c, ch[2])} /> });
  }
  if (!hide.train) {
    const Lp = climbP(LOCO_S(frame) - 12, RAIL.n, 0);
    out.push({ d: Lp[2] - 1.5, key: "loco", el: <Locomotive key="loco" A={A} frame={frame} uid="loco" /> });
  }
  FACTORIES.chims.forEach((ch, i) => {
    const P0 = climbP(ch.s, ch.n, 0);
    const g = climbH(ch.s - ch.R);
    const top = climbH(ch.s) + ch.Hc;
    out.push({
      d: P0[2] - 0.5,
      key: `ch${i}`,
      el: (
        <g key={`ch${i}`}>
          <AirCyl A={A} X={P0[0]} Z={P0[2]} R={ch.R} Y0={-top} Y1={-g} mat={BRICK} uid={`chc${i}`} lw={lwAt(A.c, P0[2])} joints={[g + (top - g) * 0.92].map((y) => -y)} />
        </g>
      ),
    });
    if (!hide.smoke && ch.plume) out.push({ d: P0[2] - 30, key: `sm${i}`, el: <Smoke key={`sm${i}`} A={A} X={P0[0]} h={top + 0.5} Z={P0[2]} seed={ch.seed} frame={frame} uid={`sm${i}`} plume={ch.plume} /> });
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

export const TakeoffWorld: React.FC<{ A: TAir; frame: number; font: string; extras?: Item[]; hide?: Hide; uid?: string }> = ({ A, frame, font, extras = [], hide = {}, uid = "tw" }) => {
  // the plateau's ground is drawn first (everything in this world stands on or beyond it), then the road over it
  const plateau = plateauItems(A).filter((it) => it.d > A.c.Z - 200);
  plateau.sort((a, b) => b.d - a.d);
  const items: Item[] = [...climbItems(A), ...extras];
  if (!hide.town) items.push(...templeItems(A), ...houseItems(A), aqueductItem(A), ...farmItems(A));
  if (!hide.figures) items.push(...folkItems(A, frame));
  if (!hide.industry) items.push(...industryItems(A, frame, hide));
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
      {roadDecal(A, ROAD_S0, KNEE_S + 2)}
      <HorizonHaze A={A} id={`${uid}-hz`} />
      {plateau.map((it) => (
        <React.Fragment key={it.key}>{it.el}</React.Fragment>
      ))}
      {roadDecal(A, -100, 95)}
      {live.map((it) => (
        <React.Fragment key={it.key}>{it.el}</React.Fragment>
      ))}
    </g>
  );
};
/** where the road of history starts (the far past, deep in the haze) */
export const ROAD_S0 = -420;
