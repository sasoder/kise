// ---------------------------------------------------------------------------
// insurgencyAir: the MEDIUM of sarah-insurgency on the clip's camera: one AirView per frame (the kit's air,
// kits/dwarkesh-3d/dwarkesh3d: AirStage + makeAirView, imported, never edited), the shared distance fog of the
// ground and every piece, and THE GRADE (one constant, GRADE, overridable per stage):
//   "A"  the 3D style's air palette A as-is over the vintage map (sage-teal near the light, petrol, espresso low)
//   "B"  "aged": the same air pushed warmer toward the map style (sepia / umber mids, cream shafts, petrol-teal
//        only in the far distance near the horizon)
// BOTH grades carry the map style's paper mottle and screen grain over the whole frame at low strength (A 0.75,
// B 1: InsurgencyStage `paper`). The director's pick: A (the teal air is the 3D style; the map supplies the vintage).
// Re-exported by insurgencyShared.tsx (the API is there).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { AIR, AirStage, airRamp, c01, hexRgb, lerp, makeAirView, mixRgb, rgbHex, type AirPalette, type AirScene, type AirView, type RGB } from "../kits/dwarkesh-3d/dwarkesh3d";
import { airMixOf, eyeDist, fogFor, hazeOf, horizonY, lightOf, type Cam, type Fog, type V3 } from "./insurgencyCamera";
import type { GroundAir } from "./insurgencyGround";

export type Grade = "A" | "B";
/** THE CLIP'S GRADE: the director's pick between the two style frames (one constant; a stage may override it) */
export const GRADE: Grade = "A";

// ---- grade B: the aged air -----------------------------------------------------------------------------------------
const AGED_RAMP: readonly [number, string][] = [
  [0, "#CDB792"],
  [0.1, "#B09A76"],
  [0.22, "#917D60"],
  [0.36, "#75654E"],
  [0.5, "#615340"],
  [0.64, "#514536"],
  [0.8, "#45392C"],
  [1, "#392E23"],
];
const AGED_EYE_T = 0.34;
const agedRamp = (t: number): RGB => {
  const R = AGED_RAMP;
  if (t <= R[0][0]) return hexRgb(R[0][1]);
  for (let i = 1; i < R.length; i++) if (t <= R[i][0]) return mixRgb(hexRgb(R[i - 1][1]), hexRgb(R[i][1]), (t - R[i - 1][0]) / (R[i][0] - R[i - 1][0]));
  return hexRgb(R[R.length - 1][1]);
};
/** the aged palette: AIR.B's cream, shadow, grade and vignette (the umber page made a medium), A's materials */
export const AGED_PAL: AirPalette = { ...AIR.A, ...AIR.B, label: "aged (grade B)", ramp: AGED_RAMP, eyeT: AGED_EYE_T, ground: AIR.A.ground, stone: AIR.A.stone, body: AIR.A.body };
/** how much petrol-teal the aged air keeps: only near the horizon row, only far away (far = screen: the air at
 *  infinity equals the air at the horizon row, so the horizon haze and the sky meet without a seam) */
const TEAL = { screen: 0.3, band: 160, far: 0.3 };
const agedView = (base: AirView, D: number): AirView => {
  const { scene, mood, horizon } = base;
  const gainRow = (sy: number) => (mood.gain * (sy - horizon)) / 1250;
  const airAtScreen = (sy: number): RGB => {
    const warm = agedRamp(AGED_EYE_T + gainRow(sy));
    const teal = airRamp("A", AIR.A.eyeT + gainRow(sy));
    const w = TEAL.screen * Math.exp(-Math.pow((sy - horizon) / TEAL.band, 2));
    return mixRgb(warm, teal, w);
  };
  const airAt = (dist: number, height = 0): RGB => {
    const hn = c01((height - scene.hLow) / Math.max(1e-6, scene.hHigh - scene.hLow));
    const w = 1 - Math.exp(-Math.max(0, dist) / (2.5 * scene.fogVis + scene.fogNear));
    const warm = agedRamp(lerp(lerp(AGED_EYE_T + 0.22, AGED_EYE_T - 0.18, hn), AGED_EYE_T, w));
    const teal = airRamp("A", lerp(lerp(AIR.A.eyeT + 0.22, AIR.A.eyeT - 0.18, hn), AIR.A.eyeT, w));
    const rel = dist / D;
    const wf = TEAL.far * c01((rel - 2.2) / 7);
    return mixRgb(warm, teal, wf * wf * (3 - 2 * wf));
  };
  return { ...base, pal: AGED_PAL, eyeT: AGED_EYE_T, airAtScreen, airAt };
};

// ---- the world of one frame ----------------------------------------------------------------------------------------
export type InsWorld = {
  cam: Cam;
  v: AirView;
  grade: Grade;
  fog: Fog;
  D: number;
  /** the light (unit, world): from the upper left of the frame, a little from the lens */
  L: V3;
  /** the fog amount at an eye distance (the ground's own) */
  hazeAt: (dist: number) => number;
  /** the air at an eye distance (the colour things sink into) */
  airAt: (dist: number) => RGB;
  /** a local colour fogged at an eye distance; toneO: orange takes half the fog (the one glowing material) */
  tone: (hex: string, dist: number) => string;
  toneO: (hex: string, dist: number) => string;
  /** the eye distance of a 3D point */
  dist: (X: number, Y: number, Z: number) => number;
  /** the ground shader's air */
  ground: GroundAir;
};
export const insWorld = (o: { cam: Cam; rest: Cam; frame: number; grade?: Grade; fog?: Fog; scene?: Partial<AirScene> }): InsWorld => {
  const { cam, rest, frame } = o;
  const grade = o.grade ?? GRADE;
  const fog = o.fog ?? fogFor(cam);
  const D = cam.D;
  const scene: AirScene = { look: "A", mood: "day", F: cam.F, fogNear: 0.5 * D, fogVis: 2.2 * D, fogMax: 0.9, hLow: 0, hHigh: 1.5 * D, moteUnit: 0.5 * rest.D, ...o.scene };
  const camOf = (c: Cam) => ({ x: c.C[0], y: c.C[1], z: -c.C[2] });
  const base = makeAirView({ scene, frame, horizon: horizonY(cam), cam: camOf(cam), rest: camOf(rest) });
  const v = grade === "B" ? agedView(base, D) : base;
  const near = v.airAt(D * 1.5, 0);
  const far = v.airAtScreen(horizonY(cam) + 6);
  const airAt = (dist: number) => mixRgb(near, far, airMixOf(dist / D, fog));
  const hazeAt = (dist: number) => hazeOf(dist / D, fog);
  const tone = (hex: string, dist: number) => rgbHex(mixRgb(hexRgb(hex), airAt(dist), hazeAt(dist)));
  const toneO = (hex: string, dist: number) => rgbHex(mixRgb(hexRgb(hex), airAt(dist), 0.5 * hazeAt(dist)));
  const to01 = (c: RGB) => c.map((q) => q / 255) as [number, number, number];
  return {
    cam,
    v,
    grade,
    fog,
    D,
    L: lightOf(cam),
    hazeAt,
    airAt,
    tone,
    toneO,
    dist: (X, Y, Z) => eyeDist(cam, X, Y, Z),
    ground: { near: to01(near), far: to01(far) },
  };
};

// ---- the stage -----------------------------------------------------------------------------------------------------
/** the mottle tiled over the frame (Img tiles: the render waits for them) */
const MottleTiles: React.FC<{ size: number; ox: number; oy: number; opacity: number }> = ({ size, ox, oy, opacity }) => {
  const tiles: React.ReactNode[] = [];
  for (let y = oy; y < 1920; y += size) for (let x = ox; x < 1080; x += size) tiles.push(<Img key={`${x},${y}`} src={staticFile("sarah-insurgency/mottle.png")} style={{ position: "absolute", left: x, top: y, width: size, height: size }} />);
  return <AbsoluteFill style={{ mixBlendMode: "multiply", opacity }}>{tiles}</AbsoluteFill>;
};
/** the paper: the map style's mottle (screen space, two scales) and grain over the whole frame, low strength */
const AgedPaper: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <>
    <MottleTiles size={900} ox={-130} oy={-210} opacity={0.32 * strength} />
    <MottleTiles size={2300} ox={-700} oy={-400} opacity={0.18 * strength} />
    <Img src={staticFile("sarah-insurgency/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 0.55 * strength }} />
  </>
);
export type StageProps = {
  A: InsWorld;
  children?: React.ReactNode;
  /** the faint bloom on orange (default 0.22) */
  bloom?: number;
  shafts?: number;
  motes?: number;
  /** the paper mottle + screen grain over the frame (default: 0.75 in grade A, 1 in grade B; 0 = off) */
  paper?: number;
  front?: React.ReactNode;
  overlay?: React.ReactNode;
};
/** the clip's stage: the kit's AirStage on this frame's AirView (grade A or B), grade B adding the aged paper */
export const InsurgencyStage: React.FC<StageProps> = ({ A, children, bloom = 0.22, shafts = 1, motes = 1, paper, front, overlay }) => (
  <StageInner A={A} bloom={bloom} shafts={shafts} motes={motes} paper={paper ?? (A.grade === "B" ? 1 : 0.75)} front={front} overlay={overlay}>
    {children}
  </StageInner>
);
const StageInner: React.FC<StageProps & { paper: number }> = ({ A, children, bloom, shafts, motes, paper, front, overlay }) => (
  <AbsoluteFill style={{ backgroundColor: rgbHex(A.v.airAtScreen(960)) }}>
    <AirStage
      v={A.v}
      bloom={bloom}
      shafts={shafts}
      motes={motes}
      front={front}
      overlay={
        <>
          {overlay}
          {paper > 0 ? <AgedPaper strength={paper} /> : null}
        </>
      }
    >
      {children}
    </AirStage>
  </AbsoluteFill>
);
/** the horizon as a soft zone over the GROUND only (after the ground, before standing pieces): the air AT the horizon
 *  row (the sky's own colour there, so ground and sky meet without a seam), fading out `below` px under it */
export const HorizonHaze: React.FC<{ A: InsWorld; below?: number; strength?: number; id: string }> = ({ A, below = 420, strength = 1, id }) => {
  const y0 = A.v.horizon - 2;
  if (y0 > 1920 + 10) return null;
  const c = rgbHex(A.v.airAtScreen(A.v.horizon));
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={y0.toFixed(2)} x2="0" y2={(y0 + below).toFixed(2)}>
          {[0, 0.2, 0.45, 0.7, 1].map((o) => (
            <stop key={o} offset={o} stopColor={c} stopOpacity={(strength * Math.pow(1 - o, 1.3)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={-20} y={y0.toFixed(2)} width={1120} height={below} fill={`url(#${id})`} />
    </svg>
  );
};
