// ---------------------------------------------------------------------------
// THE STAIRS OF POSSIBLE SPECIES (rsi-stupidest-species, shared world for cut B, reusable by cut C). Dwarkesh 3D
// style (styles/dwarkesh-3d.md), the kit's air medium (AirStage + an AirWorld), drawn inside a WorldSvg.
//
// THE WORLD: a long staircase of broad stone steps climbing away from us (+Z), up and to the left, into the bright
// high air. Step i (STAIRS.LOW..STAIRS.TOP) is one stone block: its top at height H0 + i R, its front (the riser) at
// depth i T, its centre at X = -i D (each step a little left of the one below), half-width W, SLAB x R thick (a
// floating flight: the stepped underside shows on both flanks; nothing reaches the ground).
// Step 0 is the human's. In front of its riser floats the CIVILIZATION LINE (LINE, lineGeom()): a cream threshold
// LINE.below m under the nosing that crosses the whole stair and runs on into the air LINE.extend m past both ends.
// Unlit it is a faint dashed cream guide; `lit` lights it solid outward from a point, both ways. Above it, one
// POSSIBLE SPECIES per step: a dashed orange outline figure in the cast's rounded figure language (the IdealOccupant
// outline, re-proportioned per body plan: SPECIES_KINDS base / slender / broad / longArm / crest, in SPECIES_ORDER),
// with a glowing orange brain in its head (BrainGlow: a hot radial glow with brainShared's Brain faint inside). The
// head grows fast and then saturates (1.3 x the human's on step 1, ~2.1 x on 2, ~2.5 x on 3, toward 3 x), and the
// glow and the brain's light climb step by step (speciesOf(i)). Below the line: the chimp's step (-1, LOW_R m lower
// than a regular riser) and two lower steps that sink into the dense low air.
//
// UNITS: world units, U = 178 per metre (a covidFolk man is 312 units / 1.75 m at scale 1); Y up is negative; Z depth.
//
// THE CAMERA: a physical pinhole of its own (not the tower's): StairCam = the 2D crop (k, cx, cy) + the eye (ex, ey)
// + Dc (the eye's distance to the Z = 0 plane). stairCam(spec) builds one from an anchor point, where it lands on
// screen, the px per metre there, the eye's distance to it and the eye's offset from it (so a move can glide the eye
// along the stair at a constant distance). stairsAirOf({ cam, rest, frame }) is the medium (fog by the depth beyond the
// camera's anchor plane, the
// tower's height ramp re-scaled to this stair: dense low air at the foot, bright cream at the top).
//
// API (all pure; frame-driven; seek-safe):
//   STAIRS, stepOf(i), stepAnchor(i, uM, backM) -> {X,Y,Z} (a standing point on step i's tread)
//   speciesOf(i) -> { H, headR, headX, glow, brain, a, kind, shape } (the dashed figure on step i, metres; headX = x the
//     human's head HUMAN_HEAD_M; brain = the BrainGlow light 0..1; a = the haze dissolve; shape = its SpeciesShape)
//   SPECIES_KINDS, SPECIES_ORDER, SpeciesShape { wide, tall, arms, crest, dome }, speciesUV(H, headR, shape?)
//   LINE, lineGeom() -> { y, z, x0, x1 } (the civilization line, world units)
//   StairCam, stairCam(spec), stairPersp(cam), stairsAirOf({ cam, rest, frame }), screenOf(cam, X, Y, Z)
//   inFront(A, Z), nearZ(A): cull anything nearer than NEAR_M to the eye
//   <Stairs A from? to? onStep?(i) lowAir? afterLowAir? uid />  the blocks back to front, onStep(i) drawn after block i
//   <DashedSpecies A at={X,Y,Z} H headR glow a frame uid seed shape? brain? />   one possible species
//   <BrainGlow A c rW light a? uid col? shape? />               a glowing brain in a head of screen radius rW
//   <HeadGlow c rW amt uid />                                   a faint orange mind-light behind a cast member's head
//   <CivLine A lit={ x, reach } uid frame />                    the line; lit.x = the source X, reach = metres lit each way
//   <RiserSpill A x amt uid />                                  the fire's light spilling down the riser onto the line
//   <Campfire A X Y Z t frame uid size? />                      cream fire (never house orange); t 0 = embers .. 1 = full
//   <Spark A p t r uid seed drift? />                           a strike's spark at a 2D world point, t = 0..1 of its life
//   <LightPool A X Y Z rM a uid col? />                         a soft cream pool of light on a tread
//   LAMPS, lampXs(keepClear?, phaseX?, step?) -> X[]            the threshold as a row of stone fire-bowls on a step's edge
//   <Lamp A X Y Z lit frame uid seed? rim? />                   one bowl: cold stone + cream rim .. a flare .. a flame
//   <LampRow A xs litOf(k, x) frame uid step? rim? />           the row (B: kindled outward from the fire, f177-197)
//   (B no longer draws CivLine / RiserSpill; they stay exported for C.)
// Orange is intelligence only (the clip's rule): only the dashed species are orange. The fire and the line are cream.
// ---------------------------------------------------------------------------
import React from "react";
import {
  ACCENT,
  ACCENT_DEEP,
  AIR,
  AirBox,
  FIG_FOG,
  ORANGE_LINE,
  PandemicFolk,
  airRamp,
  c01,
  makeAirView,
  mixHex,
  rgbHex,
  type AirWorld,
  type Cam,
  type Mat,
  type P2,
  type Persp,
  type RGB,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { Brain, brainBox } from "./brainShared";
import { OCCUPANT } from "./speciesTowerGeom";

export const U = 178;
const m = (v: number) => v * U;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const polyD = (q: P2[], close = true) => `M${q.map(Pt).join("L")}${close ? "Z" : ""}`;

// ===================================================================================================================
// THE STAIR
// ===================================================================================================================
/** metres: R rise, T tread depth, D the left drift per step, W the half-width, H0 step 0's top above the ground;
 *  LOW..TOP the steps drawn; STAND how far behind a nosing a figure stands; LOW_R the (lower) rise from step -1 up
 *  to step 0 (the chimp's step sits just under the line, so the pair hold one close frame) */
export const STAIRS = { R: 2.05, T: 1.6, D: 2.4, W: 5.2, H0: 6.15, LOW: -3, TOP: 20, STAND: 0.85, SLAB: 1.55, LOW_R: 1.45 };
/** the stone: the tower's warm grey-umber */
export const STAIR_STONE: Mat = { lit: "#A6957F", mid: "#7A6C5A", dark: "#3B3128" };
export type Step = { i: number; h: number; Y: number; Z0: number; Z1: number; XC: number; X0: number; X1: number };
export const stepOf = (i: number): Step => {
  const S = STAIRS;
  const h = i >= 0 ? S.H0 + i * S.R : S.H0 - S.LOW_R + (i + 1) * S.R;
  const XC = m(-i * S.D);
  return { i, h, Y: -m(h), Z0: m(i * S.T), Z1: m((i + 1) * S.T), XC, X0: XC - m(S.W), X1: XC + m(S.W) };
};
/** a standing point on step i's tread: uM metres right of the step's centre, backM metres behind its nosing */
export const stepAnchor = (i: number, uM = 0, backM = STAIRS.STAND) => {
  const s = stepOf(i);
  return { X: s.XC + m(uM), Y: s.Y, Z: s.Z0 + m(backM) };
};
/** the dashed species on step i (i >= 1): bigger-headed, more brain-lit and a little taller as i climbs, each one of a
 *  few distinct body plans (SPECIES_KINDS) so the queue reads as different possible species, not copies */
export const SPECIES_HAZE = { from: 15.2, to: 19.5 };
/** the human's head radius (m: covidFolk's man, 38 units) and the chimp's: the scale of the heads above */
export const HUMAN_HEAD_M = 38 / 178;
/** a body plan: body width x, height x, arm reach (0 = the occupant's, 1 = the hands down by the knees), a crest on
 *  the head (0..1) and a dome (the head's height over its width, 1 = round) */
export type SpeciesShape = { wide: number; tall: number; arms: number; crest: number; dome: number };
export const SPECIES_KINDS: Record<string, SpeciesShape> = {
  base: { wide: 1, tall: 1, arms: 0, crest: 0, dome: 1.05 },
  slender: { wide: 0.6, tall: 1.2, arms: 0.25, crest: 0, dome: 1.22 },
  broad: { wide: 1.5, tall: 0.8, arms: 0, crest: 0, dome: 0.92 },
  longArm: { wide: 0.88, tall: 1.04, arms: 1.35, crest: 0, dome: 1.1 },
  crest: { wide: 1.02, tall: 1, arms: 0, crest: 1.5, dome: 1.05 },
};
/** the body plan of step i's species (a fixed, non-repeating-looking order) */
export const SPECIES_ORDER = ["base", "slender", "broad", "longArm", "crest", "slender", "broad", "base", "crest", "longArm", "slender", "broad", "crest", "base", "longArm", "slender", "broad", "crest", "base", "slender"];
export const speciesOf = (i: number) => {
  const kind = SPECIES_ORDER[(((Math.round(i) - 1) % SPECIES_ORDER.length) + SPECIES_ORDER.length) % SPECIES_ORDER.length];
  const shape = SPECIES_KINDS[kind];
  // the head: 1.3 x the human's on the first step, ~2.1 x on the second, ~2.5 x on the third, toward 3 x (a fast
  // saturating climb, steep enough to beat the perspective that shrinks the steps further up)
  const headX = 1.3 + 1.7 * (1 - Math.exp(-(i - 1) / 1.8));
  const headR = HUMAN_HEAD_M * headX;
  const H = (2.0 + 0.07 * (i - 1)) * shape.tall;
  // the brain's light and the figure's glow: dim on the first, clearly brighter each step, hot from ~step 5
  const brain = c01(0.45 + 0.55 * (1 - Math.exp(-(i - 1) / 2)));
  const glow = c01(0.3 + 0.7 * (1 - Math.exp(-(i - 1) / 2.5)));
  // the top ones dissolve into the brightest haze (alpha)
  const u = c01((i - SPECIES_HAZE.from) / (SPECIES_HAZE.to - SPECIES_HAZE.from));
  const a = 1 - u * u * (3 - 2 * u) * 0.92;
  return { H, headR, headX, glow, brain, a, kind, shape };
};
/** the civilization line: a floating cream threshold LINE.below m under step 0's nosing, LINE.out m in front of its
 *  riser, crossing the whole stair and running on into the air LINE.extend m past both ends (world units) */
export const LINE = { below: 0.3, out: 0.45, extend: 60 };
export const lineGeom = () => {
  const s = stepOf(0);
  return { y: s.Y + m(LINE.below), z: s.Z0 - m(LINE.out), x0: s.X0 - m(LINE.extend), x1: s.X1 + m(LINE.extend) };
};

// ===================================================================================================================
// THE CAMERA (a pinhole: the eye at (ex, ey, -Dc), the picture plane Z = 0, the 2D crop k, cx, cy)
// ===================================================================================================================
export type StairCam = Cam & { ex: number; ey: number; Dc: number; ref: number };
/** the picture plane's fixed distance from the eye (world units): r(Z) = D0 / (Dc + Z), so k stays positive whatever
 *  the eye's depth (the eye glides deep into the stair at the top) */
export const D0 = m(24);
export type StairCamSpec = {
  /** the anchor (world units) and where it lands on screen */
  X: number;
  Y: number;
  Z: number;
  sx: number;
  sy: number;
  /** screen px per metre at the anchor's depth */
  pxm: number;
  /** the eye's distance to the anchor's depth plane (m) and its offset from the anchor (m, + = right / up) */
  dist: number;
  eyeRight: number;
  eyeUp: number;
};
export const stairCam = (s: StairCamSpec): StairCam => {
  const Dc = m(s.dist) - s.Z;
  const r = D0 / m(s.dist);
  const k = s.pxm / (U * r);
  const ex = s.X + m(s.eyeRight);
  const ey = s.Y - m(s.eyeUp);
  const cx = ex + (s.X - ex) * r - (s.sx - 540) / k;
  const cy = ey + (s.Y - ey) * r - (s.sy - 960) / k;
  return { k, cx, cy, ex, ey, Dc, ref: m(s.dist) };
};
export const stairPersp = (c: StairCam): Persp => {
  const Dc = c.Dc;
  const r = (Z: number) => D0 / Math.max(Dc + Z, 0.06 * D0);
  const p = (X: number, Y: number, Z: number): P2 => {
    const rr = r(Z);
    return [c.ex + (X - c.ex) * rr, c.ey + (Y - c.ey) * rr];
  };
  return { cam: c, opts: { eyeY: c.ey, dRef: D0, kRef: c.k, dolly: 0 }, Dc, r, p, at: (X, Z) => ({ at: p(X, 0, Z), scale: r(Z) }), vp: [c.ex, c.ey], horizonY: c.ey, zNear: -Dc + 0.08 * D0 };
};
/** the screen point of a 3D point */
export const screenOf = (c: StairCam, X: number, Y: number, Z: number): P2 => {
  const q = stairPersp(c).p(X, Y, Z);
  return [540 + (q[0] - c.cx) * c.k, 960 + (q[1] - c.cy) * c.k];
};

// ===================================================================================================================
// THE AIR (the tower's height ramp re-scaled to the stair; fog by the depth beyond the camera's anchor plane)
// ===================================================================================================================
export const STAIR_RAMP = { tLow: 0.42, h0: -1, h1: 36, gamma: 1.5 };
export const tOfHeightS = (hM: number) => STAIR_RAMP.tLow * Math.pow(1 - c01((hM - STAIR_RAMP.h0) / (STAIR_RAMP.h1 - STAIR_RAMP.h0)), STAIR_RAMP.gamma);
export const STAIR_SCENE = { look: "A" as const, mood: "day" as const, F: 1000, fogNear: m(3), fogVis: m(18), fogMax: 0.9, hLow: 0, hHigh: m(30), moteUnit: 178 };
export const stairsAirOf = (o: { cam: StairCam; rest: StairCam; frame: number }): AirWorld => {
  const { cam, rest, frame } = o;
  const P = stairPersp(cam);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const zM = (c: Cam) => -m(2.2) * Math.log(1 / c.k);
  const base = makeAirView({
    scene: { ...STAIR_SCENE, F: D0 * cam.k },
    frame,
    horizon: toSY(cam.ey),
    cam: { x: cam.cx, y: -cam.ey, z: zM(cam) },
    rest: { x: rest.cx, y: -rest.ey, z: zM(rest) },
  });
  // the height seen at a screen row: on a far backdrop plane (ZB), so the sky's ramp follows the stair's heights
  const ZB = m(40);
  const rB = P.r(ZB);
  const hAtScreen = (sy: number) => {
    const wy = cam.cy + (sy - 960) / cam.k;
    return -(cam.ey + (wy - cam.ey) / rB) / U;
  };
  const airH = (hM: number): RGB => airRamp("A", tOfHeightS(hM));
  const v = { ...base, airAtScreen: (sy: number) => airH(hAtScreen(sy)), airAt: (_d: number, h = 0) => airH(h / U) };
  // fog by the eye's distance BEYOND the camera's anchor plane: the subject and everything nearer stay clear, the
  // stair beyond it sinks into the haze (so the open's top figure is as clear as the settled human)
  const fog = (Z: number) => c01(base.fogAt(Math.max(0, P.Dc + Z - cam.ref)));
  const airHex = (_Z: number, h = 0) => rgbHex(airH(h / U));
  const tone = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), fog(Z));
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.45 * fog(Z));
  const figFog = (Z: number) => FIG_FOG.max * (1 - Math.exp(-Math.max(0, Z - FIG_FOG.near) / FIG_FOG.vis));
  const folkFog = (Z: number, feetH = 0) => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) });
  const workerInks = (Z: number, feetH = 0) => {
    const air = airHex(Z, feetH + 160);
    const t = figFog(Z);
    return Object.fromEntries(Object.entries(PandemicFolk.WORKER_INKS).map(([key, c]) => [key, key === "orange" ? c : mixHex(c, air, t)])) as typeof PandemicFolk.WORKER_INKS;
  };
  return { v, P, cam, Dc: P.Dc, k: cam.k, fog, airHex, tone, toneO, screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))), figFog, folkFog, workerInks, lw: (b = 1.1) => b / Math.pow(cam.k, 0.6) };
};

// ===================================================================================================================
// THE BLOCKS (back to front; onStep(i) is drawn right after block i, so whatever stands on step i is occluded by the
// steps in front of it and covers the ones behind)
// ===================================================================================================================
/** the dense low air the lowest steps sink into: from LOW_AIR.from m above the ground (clear) to the ground (amt) */
export const LOW_AIR = { from: 4.6, to: 0.4, amt: 0.8, t: 0.4 };
const LowAir: React.FC<{ A: AirWorld; uid: string }> = ({ A, uid }) => {
  const { cam, P } = A;
  const Zr = stepOf(-1).Z0;
  if (!inFront(A, Zr)) return null;
  const yTop = P.p(0, -m(LOW_AIR.from), Zr)[1];
  const yBot = P.p(0, -m(LOW_AIR.to), Zr)[1];
  const col = rgbHex(airRamp("A", LOW_AIR.t));
  const x0 = cam.cx - 800 / cam.k;
  const yEnd = cam.cy + 1100 / cam.k;
  if (yTop > yEnd) return null;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}la`} gradientUnits="userSpaceOnUse" x1="0" y1={yTop.toFixed(2)} x2="0" y2={yBot.toFixed(2)}>
          {[0, 0.25, 0.5, 0.75, 1].map((s) => (
            <stop key={s} offset={s} stopColor={col} stopOpacity={(LOW_AIR.amt * s * s * (3 - 2 * s)).toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x0.toFixed(2)} y={yTop.toFixed(2)} width={(1600 / cam.k).toFixed(2)} height={(Math.max(yBot, yEnd) - yTop + 4).toFixed(2)} fill={`url(#${uid}la)`} />
    </g>
  );
};
/** one block: the kit's AirBox (riser = front, tread = top, the flank toward the eye) plus a soft lit nosing */
const StepBlock: React.FC<{ A: AirWorld; i: number; uid: string }> = ({ A, i, uid }) => {
  const s = stepOf(i);
  const z0 = Math.max(s.Z0, nearZ(A));
  const y1 = Math.min(0, s.Y + m(STAIRS.SLAB * STAIRS.R));
  return <AirBox A={A} X0={s.X0} X1={s.X1} Y0={s.Y} Y1={y1} Z0={z0} Z1={s.Z1} mat={STAIR_STONE} uid={`${uid}b${i}`} rim={1.2} lw={A.lw(1.2)} />;
};
/** the nearest depth drawn (the eye at Z = -Dc, plus a near plane): anything nearer is under / behind the camera */
export const NEAR_M = 2;
export const nearZ = (A: AirWorld) => -A.P.Dc + m(NEAR_M);
/** is a point at depth Z in front of the camera's near plane */
export const inFront = (A: AirWorld, Z: number) => Z > nearZ(A);
export const Stairs: React.FC<{ A: AirWorld; from?: number; to?: number; onStep?: (i: number) => React.ReactNode; lowAir?: boolean; uid: string; afterLowAir?: React.ReactNode }> = ({
  A,
  from = STAIRS.LOW,
  to = STAIRS.TOP,
  onStep,
  lowAir = true,
  uid,
  afterLowAir,
}) => {
  const els: React.ReactNode[] = [];
  for (let i = to; i >= from; i--) {
    if (stepOf(i).Z1 <= nearZ(A)) continue;
    els.push(<StepBlock key={`b${i}`} A={A} i={i} uid={uid} />);
    const on = onStep?.(i);
    if (on) els.push(<g key={`o${i}`}>{on}</g>);
  }
  return (
    <g>
      {els}
      {lowAir ? <LowAir A={A} uid={uid} /> : null}
      {afterLowAir}
    </g>
  );
};

// ===================================================================================================================
// THE POSSIBLE SPECIES (a dashed orange outline; the IdealOccupant's figure re-proportioned for any height and head)
// ===================================================================================================================
const catmull = (pts: P2[], per = 6): P2[] => {
  const out: P2[] = [];
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
};
/** the outline in local metres (u right, v up from the feet): the body (feet, legs, mitten hands, sleeves, shoulders)
 *  from the occupant's control points scaled to fit under a head of radius headR on top; `shape` (optional) widens or
 *  narrows the body, lowers the hands (long arms), raises a crest along the head's top and domes the head */
export const speciesUV = (H: number, headR: number, shape?: SpeciesShape): P2[] => {
  const base = OCCUPANT;
  const sh = shape ?? SPECIES_KINDS.base;
  const dome = shape ? sh.dome : 1;
  const su = (H / base.H) * 1.06 * sh.wide;
  const headH = headR * dome;
  const shoulder = H - 2 * headH + 0.18 * headH;
  const sv = shoulder / 2.98;
  const neck = Math.min(0.27 * su, 0.62 * headR);
  const hc = H - headH;
  const neckV = hc - headH * Math.sqrt(1 - (neck / headR) ** 2);
  const S = (u: number, v: number): P2 => [u * su, v * sv];
  // the hand: at the hip (the occupant's) or, with long arms, down by the knee and a little out
  const hv = 1.2 - 0.62 * sh.arms;
  const hu = 1.2 + 0.1 * sh.arms;
  const leftUp: P2[] = [S(-0.93, 0.02), S(-0.8, 0.22), S(-0.86, 0.75), S(-0.98, Math.max(1.0, hv + 0.05)), S(-hu, hv), S(-1.26 - 0.06 * sh.arms, hv + 0.3), S(-1.18, 2.15), S(-0.98, 2.68), S(-0.55, 2.98), [-neck, neckV]];
  const rightDown = leftUp
    .slice()
    .reverse()
    .map(([u, v]) => [-u, v] as P2);
  const legs: P2[] = [S(0.93, 0.02), S(0.26, 0), S(0.16, 0.95), S(0, 1.06), S(-0.16, 0.95), S(-0.26, 0)];
  const ctrl = [...leftUp, ...rightDown, ...legs.slice(1)];
  const body = catmull(ctrl, 7);
  const near = (q: P2, r: P2) => Math.abs(q[0] - r[0]) < 1e-6 && Math.abs(q[1] - r[1]) < 1e-6;
  const iL = body.findIndex((q) => near(q, leftUp[leftUp.length - 1]));
  const iR = body.findIndex((q) => near(q, rightDown[0]));
  const xa = Math.acos(neck / headR);
  const a0 = Math.PI + xa;
  const a1 = -xa;
  const head: P2[] = [];
  const N = 32;
  for (let k = 0; k <= N; k++) {
    const a = a0 + ((a1 - a0) * k) / N;
    // the crest: a soft ridge over the top of the head (a < pi/2 + ...): radial bump
    const top = Math.exp(-(((a - Math.PI / 2) / 0.42) ** 2));
    const rr = 1 + 0.32 * sh.crest * top * (shape ? 1 : 0);
    head.push([headR * rr * Math.cos(a), hc + headH * rr * Math.sin(a)]);
  }
  if (iL < 0 || iR < 0) return body;
  return [...body.slice(0, iL), ...head, ...body.slice(iR + 1)];
};
/** a dashed orange stroke (the shared DashStroke's look: glow underlay, deep-orange edge, dash), width in screen px */
export const DashLine: React.FC<{ A: AirWorld; d: string; Z: number; h: number; px?: number; a?: number; dash: [number, number]; glow?: number; wash?: number }> = ({ A, d, Z, h, px = 2.4, a = 1, dash, glow = 1, wash }) => {
  const w = px / A.k;
  const tn = (hex: string) => (wash === undefined ? A.toneO(hex, Z, h) : mixHex(hex, A.airHex(Z, h), wash * A.fog(Z)));
  const col = tn(ACCENT);
  const edge = tn(ACCENT_DEEP);
  const dash2 = `${dash[0].toFixed(1)} ${dash[1].toFixed(1)}`;
  return (
    <g>
      <path d={d} fill="none" stroke={col} strokeWidth={w * 3.4} strokeOpacity={0.14 * a * glow} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={mixHex(edge, ORANGE_LINE, 0.4)} strokeWidth={w * 1.55} strokeOpacity={0.55 * a} strokeDasharray={dash2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeOpacity={a} strokeDasharray={dash2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
export const SPECIES_WASH = 0.18;
/** one possible species standing at a 3D point (its feet), facing us; glow 0..1 = the soft inner light and halo;
 *  frame drives a faint breath of the glow (and a tiny sway, so it is alive) */
export const DashedSpecies: React.FC<{ A: AirWorld; at: { X: number; Y: number; Z: number }; H: number; headR: number; glow?: number; frame?: number; uid: string; a?: number; seed?: number; shape?: SpeciesShape; brain?: number }> = ({
  A,
  at,
  H,
  headR,
  glow = 0.5,
  frame = 0,
  uid,
  a = 1,
  seed = 0,
  shape,
  brain,
}) => {
  const P = A.P;
  const br = 0.9 + 0.1 * Math.sin((2 * Math.PI * (frame + seed * 17)) / 70);
  const sway = 0.012 * Math.sin((2 * Math.PI * (frame + seed * 23)) / 96);
  const uv = speciesUV(H, headR, shape);
  const dome = shape ? shape.dome : 1;
  const pts = uv.map(([u, v]) => P.p(at.X + m(u + sway * v), at.Y - m(v), at.Z));
  pts.push(pts[0]);
  const r = P.r(at.Z);
  const h = -at.Y + m(H / 2);
  const pxPerM = A.k * r * U;
  // the dash: ~0.3 m dash, 0.2 m gap at a 2 m figure, a little longer for the big ones (screen-stable-ish)
  const dl = m(0.22 + 0.035 * H) * r;
  const dg = m(0.14 + 0.02 * H) * r;
  const px = Math.max(1.6, Math.min(3.2, 0.032 * pxPerM + 0.5));
  const hc = P.p(at.X, at.Y - m(H - headR * dome), at.Z);
  const bc = P.p(at.X, at.Y - m(H * 0.42), at.Z);
  // a glowing thing cuts through the haze: washed by only SPECIES_WASH of the fog (the alpha `a` dissolves the top)
  const fillCol = mixHex(ACCENT, A.airHex(at.Z, h), SPECIES_WASH * A.fog(at.Z));
  const g = glow * br * a;
  // the head's halo: wider and hotter step by step (the brighter minds up the stair)
  const haloR = 1.9 + 1.0 * glow;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}hg`} gradientUnits="userSpaceOnUse" cx={hc[0].toFixed(2)} cy={hc[1].toFixed(2)} r={(m(headR) * r * haloR).toFixed(2)}>
          <stop offset="0" stopColor={mixHex(fillCol, AIR.A.orangeHot, 0.35 * g * g)} stopOpacity={0.1 + 0.48 * Math.pow(g, 1.5)} />
          <stop offset="0.42" stopColor={fillCol} stopOpacity={0.05 + 0.26 * Math.pow(g, 1.5)} />
          <stop offset="1" stopColor={fillCol} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}bg`} gradientUnits="userSpaceOnUse" cx={bc[0].toFixed(2)} cy={bc[1].toFixed(2)} r={(m(H * 0.62) * r).toFixed(2)}>
          <stop offset="0" stopColor={fillCol} stopOpacity={0.13 * g} />
          <stop offset="1" stopColor={fillCol} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}cl`}>
          <path d={polyD(pts)} />
        </clipPath>
      </defs>
      <ellipse cx={bc[0]} cy={bc[1]} rx={m(H * 0.55) * r} ry={m(H * 0.62) * r} fill={`url(#${uid}bg)`} />
      <g clipPath={`url(#${uid}cl)`}>
        <rect x={bc[0] - m(H) * r} y={hc[1] - m(H) * r} width={m(2 * H) * r} height={m(2.2 * H) * r} fill={fillCol} fillOpacity={0.07 + 0.1 * g} />
      </g>
      <circle cx={hc[0]} cy={hc[1]} r={m(headR) * r * haloR} fill={`url(#${uid}hg)`} />
      {brain !== undefined ? <BrainGlow A={A} c={hc} rW={m(headR) * r} light={brain * br} a={a} uid={`${uid}br`} col={fillCol} /> : null}
      <DashLine A={A} d={polyD(pts, false)} Z={at.Z} h={h} px={px} a={a * (0.88 + 0.12 * br)} dash={[dl, dg]} glow={1 + 1.6 * glow} wash={SPECIES_WASH} />
    </g>
  );
};
/** the light of a mind in a head: a soft filled orange glow (hot core at high light) with the clip's brain shape
 *  faint inside it. c = the head's centre (projected), rW = the head's radius (projected world units), light 0..1 */
export const BrainGlow: React.FC<{ A: AirWorld; c: P2; rW: number; light: number; a?: number; uid: string; col?: string; shape?: boolean }> = ({ A, c, rW, light, a = 1, uid, col = ACCENT, shape = true }) => {
  const L = c01(light);
  const hot = mixHex(col, AIR.A.orangeHot, 0.15 + 0.75 * L);
  const size = rW * 1.25;
  const box = brainBox(size);
  return (
    <g opacity={a}>
      <defs>
        <radialGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" cx={c[0].toFixed(2)} cy={c[1].toFixed(2)} r={(rW * (1.05 + 0.9 * L)).toFixed(2)}>
          <stop offset="0" stopColor={hot} stopOpacity={0.35 + 0.6 * L} />
          <stop offset="0.45" stopColor={col} stopOpacity={0.22 + 0.4 * L} />
          <stop offset="1" stopColor={col} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={c[0]} cy={c[1]} r={rW * (1.05 + 0.9 * L)} fill={`url(#${uid}g)`} />
      {shape ? <Brain x={c[0]} y={c[1] - box.cy} size={size} uid={`${uid}b`} unitPx={A.k} glow={1} stem={false} opacity={0.32 + 0.4 * L} halo={0.4 + 0.8 * L} /> : null}
    </g>
  );
};
/** a faint orange light in a cast member's head (the human's is the faintest of the minds; the chimp's fainter still) */
export const HeadGlow: React.FC<{ c: P2; rW: number; amt: number; uid: string }> = ({ c, rW, amt, uid }) =>
  amt <= 0 ? null : (
    <g>
      <defs>
        <radialGradient id={`${uid}hg`} gradientUnits="userSpaceOnUse" cx={c[0].toFixed(2)} cy={c[1].toFixed(2)} r={(rW * 1.7).toFixed(2)}>
          <stop offset="0" stopColor={ACCENT} stopOpacity={amt} />
          <stop offset="0.5" stopColor={ACCENT} stopOpacity={0.45 * amt} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={c[0]} cy={c[1]} r={rW * 1.7} fill={`url(#${uid}hg)`} />
    </g>
  );

// ===================================================================================================================
// THE CIVILIZATION LINE (cream; a dim groove until lit, then lit outward from a source both ways)
// ===================================================================================================================
export const LINE_COL = { groove: "#5C5043", dim: "#EFE4CC", lit: "#FBF3E2", glow: "#F6E8CC" };
/** the line: before it is lit, a faint dashed cream guide (dim = its opacity); `lit` lights it SOLID outward from
 *  world X lit.x, lit.reach metres each way, with bright travelling heads (it runs on past the stair into the air) */
export const CivLine: React.FC<{ A: AirWorld; lit?: { x: number; reach: number }; dim?: number; uid: string; frame?: number }> = ({ A, lit, dim = 0.55, uid, frame = 0 }) => {
  const g = lineGeom();
  const P = A.P;
  const r = P.r(g.z);
  // only the part on screen (a long line in the air): clip X to the frame's world span at this depth, with a margin
  const half = (700 / A.k) / r;
  const xs = Math.max(g.x0, A.P.vp[0] + (A.cam.cx - A.P.vp[0]) / r - half);
  const xe = Math.min(g.x1, A.P.vp[0] + (A.cam.cx - A.P.vp[0]) / r + half);
  const a = P.p(xs, g.y, g.z);
  const b = P.p(xe, g.y, g.z);
  const px = (v: number) => v / A.k;
  const wLine = Math.max(px(2.4), m(0.06) * r);
  const els: React.ReactNode[] = [];
  const dash = `${(m(0.42) * r).toFixed(1)} ${(m(0.3) * r).toFixed(1)}`;
  els.push(<path key="dg" d={`M${Pt(a)}L${Pt(b)}`} stroke={LINE_COL.glow} strokeWidth={wLine * 3.4} strokeOpacity={0.12 * dim} strokeLinecap="butt" />);
  els.push(<path key="dm" d={`M${Pt(a)}L${Pt(b)}`} stroke={LINE_COL.dim} strokeWidth={wLine} strokeOpacity={dim} strokeDasharray={dash} strokeLinecap="round" />);
  if (lit && lit.reach > 0) {
    const xa = Math.max(xs, lit.x - m(lit.reach));
    const xb = Math.min(xe, lit.x + m(lit.reach));
    const pa = P.p(xa, g.y, g.z);
    const pb = P.p(xb, g.y, g.z);
    const flick = 0.94 + 0.06 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37 + 1);
    const d = `M${Pt(pa)}L${Pt(pb)}`;
    els.push(
      <defs key="df">
        <filter id={`${uid}lb`} x="-10%" y="-400%" width="120%" height="900%">
          <feGaussianBlur stdDeviation={(wLine * 2.2).toFixed(2)} />
        </filter>
        <radialGradient id={`${uid}hd`}>
          <stop offset="0" stopColor={LINE_COL.lit} stopOpacity={0.95} />
          <stop offset="0.35" stopColor={LINE_COL.glow} stopOpacity={0.5} />
          <stop offset="1" stopColor={LINE_COL.glow} stopOpacity={0} />
        </radialGradient>
      </defs>,
    );
    els.push(<path key="lg" d={d} stroke={LINE_COL.glow} strokeWidth={wLine * 6} strokeOpacity={0.6 * flick} strokeLinecap="round" filter={`url(#${uid}lb)`} />);
    els.push(<path key="lc" d={d} stroke={LINE_COL.lit} strokeWidth={wLine * 1.5} strokeOpacity={flick} strokeLinecap="round" />);
    // the travelling heads (bright while they run on screen)
    [xa > xs + 1 ? xa : null, xb < xe - 1 ? xb : null].forEach((x, k) => {
      if (x === null) return;
      const q = P.p(x, g.y, g.z);
      const rr = Math.max(px(12), m(0.3) * r);
      els.push(<circle key={`h${k}`} cx={q[0]} cy={q[1]} r={rr} fill={`url(#${uid}hd)`} />);
    });
  }
  return <g>{els}</g>;
};
/** the fire's light pouring over step 0's nosing and down its riser to the line (cause before effect): a soft cream
 *  wash centred under the fire at world X x; amt 0..1 */
export const RiserSpill: React.FC<{ A: AirWorld; x: number; amt: number; uid: string }> = ({ A, x, amt, uid }) => {
  if (amt <= 0.002) return null;
  const s = stepOf(0);
  const g = lineGeom();
  const P = A.P;
  const top = P.p(x, s.Y, s.Z0);
  const bot = P.p(x, g.y + m(0.1), g.z);
  const wpx = m(0.9) * P.r(s.Z0);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}sp`} gradientUnits="userSpaceOnUse" x1="0" y1={top[1].toFixed(2)} x2="0" y2={bot[1].toFixed(2)}>
          <stop offset="0" stopColor={LINE_COL.glow} stopOpacity={0.55 * amt} />
          <stop offset="1" stopColor={LINE_COL.glow} stopOpacity={0.12 * amt} />
        </linearGradient>
        <filter id={`${uid}sb`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={(wpx * 0.25).toFixed(2)} />
        </filter>
      </defs>
      <ellipse cx={top[0]} cy={(top[1] + bot[1]) / 2} rx={wpx * 0.5} ry={Math.abs(bot[1] - top[1]) * 0.62} fill={`url(#${uid}sp)`} filter={`url(#${uid}sb)`} />
    </g>
  );
};

// ===================================================================================================================
// FIRE, SPARK, LIGHT POOL (cream and warm white only)
// ===================================================================================================================
export const FIRE_COL = { core: "#FFFBF0", mid: "#FBEFD6", edge: "#F2DFB9", deep: "#E3C99A", wood: "#4A3A2C", woodLit: "#7A6248", ember: "#F6E3C0" };
/** a soft cream pool of light on a tread (an ellipse in the tread's plane) */
export const LightPool: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; rM: number; a: number; uid: string; col?: string }> = ({ A, X, Y, Z, rM, a, uid, col = FIRE_COL.mid }) => {
  if (a <= 0.002) return null;
  const P = A.P;
  const c = P.p(X, Y, Z);
  const l = P.p(X - m(rM), Y, Z);
  const f = P.p(X, Y, Z - m(rM));
  const bk = P.p(X, Y, Z + m(rM));
  const rx = Math.abs(c[0] - l[0]);
  const ry = Math.max(rx * 0.06, Math.abs(f[1] - bk[1]) / 2);
  const cy = (f[1] + bk[1]) / 2;
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}lp`}>
          <stop offset="0" stopColor={col} stopOpacity={a} />
          <stop offset="0.5" stopColor={col} stopOpacity={0.45 * a} />
          <stop offset="1" stopColor={col} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}lp)`} />
    </g>
  );
};
/** the kindling (always there: a few sticks and a tuft) and the fire growing from it: t 0 = cold, 0..0.15 an ember
 *  glows, then the flames rise to full at 1; frame drives the flicker (pure sines, seek-safe) */
export const Campfire: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; t: number; frame: number; uid: string; size?: number }> = ({ A, X, Y, Z, t, frame, uid, size = 1 }) => {
  const P = A.P;
  const r = P.r(Z) * size;
  const q = (u: number, v: number, w = 0): P2 => P.p(X + m(u * size), Y - m(v * size), Z + m(w * size));
  const lw = Math.max(1.2 / A.k, m(0.035) * r);
  const els: React.ReactNode[] = [];
  const fire = c01((t - 0.12) / 0.88);
  const ember = c01(t / 0.12);
  // the glow on the tread (under everything)
  const pool = 0.55 * ember * 0.4 + 0.6 * fire;
  if (pool > 0) {
    const c = q(0, 0.02);
    const rx = m(0.95 + 0.45 * fire) * r;
    els.push(
      <g key="pool">
        <defs>
          <radialGradient id={`${uid}pg`}>
            <stop offset="0" stopColor={FIRE_COL.mid} stopOpacity={0.6 * pool} />
            <stop offset="0.5" stopColor={FIRE_COL.edge} stopOpacity={0.22 * pool} />
            <stop offset="1" stopColor={FIRE_COL.edge} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={rx * 0.32} fill={`url(#${uid}pg)`} />
      </g>,
    );
  }
  // the sticks (a small teepee lying in, tips crossing), lit by the fire
  const wood = mixHex(FIRE_COL.wood, FIRE_COL.woodLit, 0.6 * fire);
  const sticks: [number, number, number, number][] = [
    [-0.24, 0.02, 0.06, 0.2],
    [0.22, 0.02, -0.05, 0.21],
    [-0.12, 0.02, 0.15, 0.13],
    [0.16, 0.01, -0.18, 0.09],
  ];
  sticks.forEach(([u0, v0, u1, v1], k) => {
    const a = q(u0, v0, k % 2 ? 0.06 : -0.06);
    const b = q(u1, v1);
    els.push(<path key={`s${k}`} d={`M${Pt(a)}L${Pt(b)}`} stroke={A.tone(wood, Z, -Y)} strokeWidth={lw} strokeLinecap="round" />);
  });
  // the ember (a glow at the heart of the kindling)
  if (ember > 0) {
    const c = q(0, 0.06);
    els.push(
      <g key="em">
        <defs>
          <radialGradient id={`${uid}em`}>
            <stop offset="0" stopColor={FIRE_COL.core} stopOpacity={0.95 * ember} />
            <stop offset="0.4" stopColor={FIRE_COL.ember} stopOpacity={0.6 * ember} />
            <stop offset="1" stopColor={FIRE_COL.ember} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={c[0]} cy={c[1]} r={m(0.13 + 0.12 * fire) * r} fill={`url(#${uid}em)`} />
      </g>,
    );
  }
  // the flames: three teardrops, flickering
  if (fire > 0) {
    const flames: [number, number, number, number][] = [
      [0, 0.46, 0.13, 0],
      [-0.09, 0.3, 0.09, 1.7],
      [0.1, 0.33, 0.085, 3.1],
    ];
    const tear = (cu: number, hgt: number, w: number, ph: number) => {
      const fl = 0.82 + 0.18 * Math.sin(frame * 0.83 + ph) * Math.sin(frame * 0.31 + ph * 2);
      const H = hgt * fl * Math.pow(fire, 0.7);
      const W = w * Math.pow(fire, 0.5);
      const lean = 0.05 * Math.sin(frame * 0.47 + ph);
      const pts: P2[] = [];
      for (let s = 0; s <= 16; s++) {
        const a = (s / 16) * Math.PI * 2;
        const vv = (1 - Math.cos(a)) / 2;
        const uu = Math.sin(a) * W * Math.pow(1 - vv, 0.9) * Math.pow(vv, 0.35) * 1.6;
        pts.push(q(cu + uu + lean * vv * vv, 0.04 + vv * H));
      }
      return polyD(pts);
    };
    flames.forEach(([cu, hgt, w, ph], k) => {
      els.push(<path key={`fo${k}`} d={tear(cu, hgt, w, ph)} fill={FIRE_COL.edge} fillOpacity={0.9} />);
      els.push(<path key={`fi${k}`} d={tear(cu, hgt * 0.62, w * 0.55, ph + 0.4)} fill={FIRE_COL.core} />);
    });
    // the halo
    const hcn = q(0, 0.22);
    els.push(
      <g key="halo">
        <defs>
          <radialGradient id={`${uid}ha`}>
            <stop offset="0" stopColor={FIRE_COL.mid} stopOpacity={0.5 * fire} />
            <stop offset="1" stopColor={FIRE_COL.mid} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={hcn[0]} cy={hcn[1]} r={m(0.75) * r} fill={`url(#${uid}ha)`} />
      </g>,
    );
  }
  return <g>{els}</g>;
};
/** a strike's spark at a world point p (2D, already projected): a white flash with a few short rays and a couple of
 *  sparks falling (drifting `drift` m sideways, toward the tinder); t = 0..1 of its life; r = the depth scale there */
export const Spark: React.FC<{ A: AirWorld; p: P2; t: number; r: number; uid: string; seed?: number; drift?: number }> = ({ A, p, t, r, uid, seed = 0, drift = 0 }) => {
  if (t <= 0 || t >= 1) return null;
  const a = Math.pow(1 - t, 1.5);
  const R = m(0.14) * r * (0.6 + 0.8 * t);
  const rays = Array.from({ length: 6 }, (_, k) => {
    const ang = (k / 6) * Math.PI * 2 + seed * 0.7;
    const l = R * (1.2 + 0.6 * ((k * 7 + seed) % 3) / 2);
    return `M${Pt([p[0] + Math.cos(ang) * R * 0.3, p[1] + Math.sin(ang) * R * 0.3])}L${Pt([p[0] + Math.cos(ang) * l, p[1] + Math.sin(ang) * l])}`;
  }).join("");
  const fall = Array.from({ length: 3 }, (_, k) => {
    const dx = (k - 1) * m(0.05) * r + Math.sin(seed + k) * m(0.02) * r;
    const dy = m(0.18) * r * t * (1 + 0.4 * k);
    return [p[0] + dx * (1 + t) + m(drift) * r * t, p[1] + dy] as P2;
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}sp`}>
          <stop offset="0" stopColor={FIRE_COL.core} stopOpacity={a} />
          <stop offset="0.4" stopColor={FIRE_COL.mid} stopOpacity={0.6 * a} />
          <stop offset="1" stopColor={FIRE_COL.mid} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={p[0]} cy={p[1]} r={R * 1.6} fill={`url(#${uid}sp)`} />
      <path d={rays} stroke={FIRE_COL.core} strokeWidth={Math.max(0.9 / A.k, m(0.012) * r)} strokeOpacity={a} strokeLinecap="round" />
      {fall.map((f, k) => (
        <circle key={k} cx={f[0]} cy={f[1]} r={Math.max(1 / A.k, m(0.012) * r)} fill={FIRE_COL.core} fillOpacity={a} />
      ))}
    </g>
  );
};

// ===================================================================================================================
// THE LAMP ROW (B rev1 r3: the threshold of civilization as a row of small stone fire-bowls along a step's front edge)
// ===================================================================================================================
/** the row: on step LAMPS.step, LAMPS.back m behind the nosing, one every LAMPS.gap m from end to end (LAMPS.end m in
 *  from each end), skipping any within LAMPS.clear m of a world X in `keepClear` (the cast's feet, a campfire).
 *  A lamp: a little cairn of two rounded stones carrying a shallow dish (LAMPS.h m tall, the dish LAMPS.dish m wide) */
export const LAMPS = { step: 0, back: 0.22, gap: 0.67, end: 0.1, h: 0.27, dish: 0.36 };
/** the row's X positions: on a LAMPS.gap grid through `phaseX` (default: centred on the step), from end to end of the
 *  step (LAMPS.end m in), skipping any within `clear` m of each `keepClear` X */
export const lampXs = (keepClear: { x: number; clear: number }[] = [], phaseX?: number, step = LAMPS.step): number[] => {
  const s = stepOf(step);
  const g = m(LAMPS.gap);
  const lo = s.X0 + m(LAMPS.end);
  const hi = s.X1 - m(LAMPS.end);
  const ph = phaseX ?? (s.X0 + s.X1) / 2;
  const out: number[] = [];
  for (let x = ph + Math.ceil((lo - ph) / g) * g; x <= hi + 1e-6; x += g) {
    if (keepClear.some((c) => Math.abs(x - c.x) < m(c.clear))) continue;
    out.push(x);
  }
  return out;
};
/** one lamp at world (X, tread Y, Z): `lit` 0 = cold stone with a faint cream rim (so the row reads as a line), a
 *  kindling flash, then 1 = a small cream flame (FIRE_COL, never house orange) with a soft pool on the stone and a
 *  glow over the nosing; frame + seed drive a living flicker (pure sines) */
export const Lamp: React.FC<{ A: AirWorld; X: number; Y: number; Z: number; lit: number; frame: number; uid: string; seed?: number; rim?: number }> = ({ A, X, Y, Z, lit, frame, uid, seed = 0, rim = 0.5 }) => {
  const P = A.P;
  const r = P.r(Z);
  const q = (u: number, v: number, w = 0): P2 => P.p(X + m(u), Y - m(v), Z + m(w));
  const L = c01(lit);
  const stoneA = A.tone(mixHex(STAIR_STONE.mid, STAIR_STONE.dark, 0.35), Z, -Y);
  const stoneB = A.tone(mixHex(STAIR_STONE.lit, STAIR_STONE.mid, 0.55), Z, -Y);
  const warm = (hex: string) => mixHex(hex, FIRE_COL.edge, 0.45 * L);
  const els: React.ReactNode[] = [];
  const fl = 0.84 + 0.16 * Math.sin(frame * 0.91 + seed * 2.3) * Math.sin(frame * 0.37 + seed * 1.1);
  // the kindling flash: a bright bloom over the first ~40 % of `lit`, settling to the steady flame
  const flash = L > 0 && L < 1 ? Math.sin(Math.PI * c01(L / 0.6)) : 0;
  // the pool on the tread and the glow over the nosing (under the lamp)
  if (L > 0) {
    const c = q(0, 0.005);
    const rx = m(0.7) * r * (0.7 + 0.3 * L);
    els.push(
      <g key="pool">
        <defs>
          <radialGradient id={`${uid}p`}>
            <stop offset="0" stopColor={FIRE_COL.mid} stopOpacity={(0.55 * L + 0.2 * flash) * fl} />
            <stop offset="0.5" stopColor={FIRE_COL.edge} stopOpacity={0.2 * L * fl} />
            <stop offset="1" stopColor={FIRE_COL.edge} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={rx * 0.34} fill={`url(#${uid}p)`} />
      </g>,
    );
  }
  // the cairn: a broad low stone, a smaller one on it, the dish on top (each a rounded ellipse with a lit top cap)
  const stone = (v: number, w: number, hgt: number, col: string, k: string) => {
    const c = q(0, v + hgt / 2);
    return (
      <g key={k}>
        <ellipse cx={c[0]} cy={c[1]} rx={m(w / 2) * r} ry={m(hgt / 2) * r} fill={warm(col)} />
        <ellipse cx={c[0] - m(w * 0.06) * r} cy={c[1] - m(hgt * 0.18) * r} rx={m(w * 0.3) * r} ry={m(hgt * 0.22) * r} fill={warm(stoneB)} fillOpacity={0.55} />
      </g>
    );
  };
  els.push(stone(0, 0.25, 0.1, stoneA, "s0"));
  els.push(stone(0.09, 0.18, 0.09, stoneA, "s1"));
  // the dish: a shallow bowl (a half-ellipse under a rim ellipse)
  const dc = q(0, LAMPS.h);
  const dw = m(LAMPS.dish / 2) * r;
  const dh = m(0.08) * r;
  const rimRy = dw * 0.3;
  els.push(<path key="bowl" d={`M${dc[0] - dw},${dc[1]} A${dw},${dh} 0 0 0 ${dc[0] + dw},${dc[1]} Z`} fill={warm(stoneA)} />);
  els.push(<ellipse key="dishIn" cx={dc[0]} cy={dc[1]} rx={dw} ry={rimRy} fill={L > 0 ? mixHex("#2E2620", FIRE_COL.ember, 0.75 * L) : A.tone(STAIR_STONE.dark, Z, -Y)} />);
  // the faint cream rim (the cold row still reads as a line); brighter when lit
  els.push(<ellipse key="rim" cx={dc[0]} cy={dc[1]} rx={dw} ry={rimRy} fill="none" stroke={FIRE_COL.mid} strokeOpacity={Math.min(1, rim + 0.4 * L)} strokeWidth={Math.max(1 / A.k, m(0.016) * r)} />);
  // the flame: a teardrop out of the dish (outer cream, inner warm white), with a halo
  if (L > 0) {
    const grow = Math.pow(c01(L / 0.5), 0.7);
    const tear = (hgt: number, w: number, ph: number) => {
      const f2 = 0.8 + 0.2 * Math.sin(frame * 0.83 + seed * 3.7 + ph) * Math.sin(frame * 0.29 + seed + ph * 2);
      const H = hgt * f2 * grow * (1 + 0.25 * flash);
      const W = w * Math.pow(grow, 0.5);
      const lean = 0.03 * Math.sin(frame * 0.47 + seed * 1.9 + ph);
      const pts: P2[] = [];
      for (let s = 0; s <= 16; s++) {
        const a = (s / 16) * Math.PI * 2;
        const vv = (1 - Math.cos(a)) / 2;
        const uu = Math.sin(a) * W * Math.pow(1 - vv, 0.9) * Math.pow(vv, 0.35) * 1.6;
        pts.push(q(uu + lean * vv * vv, LAMPS.h + 0.005 + vv * H));
      }
      return polyD(pts);
    };
    const hc = q(0, LAMPS.h + 0.14);
    els.push(
      <g key="fl">
        <defs>
          <radialGradient id={`${uid}h`}>
            <stop offset="0" stopColor={FIRE_COL.core} stopOpacity={(0.55 * L + 0.4 * flash) * fl} />
            <stop offset="0.4" stopColor={FIRE_COL.mid} stopOpacity={(0.25 * L + 0.2 * flash) * fl} />
            <stop offset="1" stopColor={FIRE_COL.mid} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={hc[0]} cy={hc[1]} r={m(0.42 + 0.25 * flash) * r} fill={`url(#${uid}h)`} />
        <path d={tear(0.32, 0.085, 0)} fill={FIRE_COL.edge} fillOpacity={0.92} />
        <path d={tear(0.19, 0.045, 0.5)} fill={FIRE_COL.core} />
      </g>,
    );
  }
  return <g>{els}</g>;
};
/** the whole row on step LAMPS.step: `litOf(k, x)` gives each lamp's lit 0..1; drawn left to right (all at one depth) */
export const LampRow: React.FC<{ A: AirWorld; xs: number[]; litOf: (k: number, x: number) => number; frame: number; uid: string; step?: number; rim?: number }> = ({ A, xs, litOf, frame, uid, step = LAMPS.step, rim }) => {
  const s = stepOf(step);
  const Z = s.Z0 + m(LAMPS.back);
  if (!inFront(A, Z)) return null;
  return (
    <g>
      {xs.map((x, k) => (
        <Lamp key={k} A={A} X={x} Y={s.Y} Z={Z} lit={litOf(k, x)} frame={frame} uid={`${uid}${k}`} seed={k * 1.37 + 0.4} rim={rim} />
      ))}
    </g>
  );
};
