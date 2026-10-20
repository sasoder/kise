// ---------------------------------------------------------------------------
// DiseaseDidTheWorkV2 (kyle-first-farmers, cut 24, cold-review V2). Dwarkesh map style (styles/dwarkesh-map.md),
// the umber page with no map. Opaque 1080x1920, 29.97 fps, 130 frames. Opens on cut 17 V2's last frame
// (SameRelationshipV2, sameRelationshipStateV2.ts): the two pairs stacked in two rows. The delivered V1
// (DiseaseDidTheWork.tsx) is untouched.
// Kit: firstFarmersShared (page, camera, ground, Germs, Microbe) and farmersFigures (the turn-safe cast, the fall),
// read-only; 17 V2's own props (OrangeGround, RisingWheat, AztecHouse, Maize, Sunk) imported from it.
//
// CHECK LINE: "in both pairs it was the germs, not a weapon, that brought the other side down: the same thing
// happens to the foragers and to the Aztecs, and the orange side never lifts a hand."
//
// THE LINE: "disease is just like a significant player in why you were able to dominate them."
// WORD -> FRAME: disease 4 · is 17 · just 23 · like 28 · a 32 · significant 33 · player 45 · in 65 · why 74 ·
//   you 81 · were 93 · able 95 · to 100 · dominate 104 · them 113 · (host: I 126).
// DURATION: the slot 24.5245 -> 28.8622 s = 4.3377 s x 29.97 = 130 frames (f0..f129).
//
// THE MOTION: the parallel rhyme, both rows in shot, then the win. From f0 a faint haze leaves each orange man's back
// and shoulders and his breath (they stand turned away to their own fields, unaware: no tool, no gesture), the first
// legible rods forming inside it by "disease" (f4); it crosses the gap to the cream man in his row (contact ~f24).
// The two cream men sicken on one track, the lower row ROW2_LAG (15) frames behind: a hunch with a hand to the belly
// in two coughing jolts (f35, f45), the forager lets go of his spear on the second (f52: it topples on its own to his
// right, obliquely, and lies beside him by ~f63), the knees buckle (f60-f66), he kneels folding at the hips, then
// drops away from the orange man toward his sunk home, draining to DEAD, and settles on impact (lands f89; the
// Aztec the same, landing on "dominate", f104, drained before "them", f113). On "dominate" both orange fields roll on
// over the ground where the cream men fell (17 V2's stalk-by-stalk front, f104-f121, to the row's end): the land is
// taken without a hand lifted; the last germs thin into a haze. Camera: from 17 V2's creep, eased a little down and
// in through "significant player", one ease back to both rows whole for the lower death, then a slow drift and
// creep to the end; the orange men keep tending their fields (a slow bend to the stalks, a look along the field).
// Orange = the incoming side and the germs they carry; cream = the forager and the Aztec, who drain to DEAD.
// No text, no arrows.
//
// SOURCES: none on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { add, mul, rot } from "../kits/maps/stringsMotion";
import { SPANIARDS, figureAnchors, figureRig, type Spec } from "../kits/maps/texcocoFigures";
import { FPS as CLIP_FPS, Germs, GroundLine, Page, WorldSvg, type Cam, type GermSource, type P2 } from "./firstFarmersShared";
import { CREAM, DEAD_INK, HideTent, Sickening, Spear, TILMA_COMMONER_SPEC, TurnFarmer, TurnForager, TurnSpaniard, TurnTilmaCommoner, aimToolWorld, drainOf, fallInfo, farmAnchors, mixInk, specOf, type FigPose, type Ink } from "./farmersFigures";
import { AztecHouse, Maize, OrangeGround, RisingWheat, Sunk } from "./SameRelationshipV2";
import {
  SRV2_BAND1,
  SRV2_BAND2,
  SRV2_CAM_END,
  SRV2_COMMONER,
  SRV2_END_FRAME,
  SRV2_FARMER,
  SRV2_FORAGER,
  SRV2_FRONT_END,
  SRV2_GROUND1,
  SRV2_GROUND2,
  SRV2_GROUND_Y2,
  SRV2_HOUSE,
  SRV2_HUT,
  SRV2_MAIZE,
  SRV2_SPANIARD,
  SRV2_WHEAT1,
  SRV2_WHEAT2,
  srCamV2,
  srPoseV2,
  srSinkV2,
} from "./sameRelationshipStateV2";

export const FPS = CLIP_FPS;
export const DURATION = 130;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const smoother = (u: number) => {
  const v = clamp01(u);
  return v * v * v * (v * (6 * v - 15) + 10);
};

// ---------------------------------------------------------------------------
// THE JOIN (V2 f0 = 17 V2 f180)
// ---------------------------------------------------------------------------
{
  if (SRV2_END_FRAME !== 180) throw new Error(`DiseaseDidTheWorkV2: 17 V2's last frame is ${SRV2_END_FRAME}, not 180`);
  const c = srCamV2(SRV2_END_FRAME);
  if (Math.abs(c.x - SRV2_CAM_END.x) > 1e-9 || Math.abs(c.k - SRV2_CAM_END.k) > 1e-12) throw new Error("DiseaseDidTheWorkV2: srCamV2(180) != SRV2_CAM_END");
}

// ---------------------------------------------------------------------------
// THE CAMERA: a C1 cubic Hermite in (x, log k, row 2's feet on screen) from 17 V2's last camera (value and speed).
// ---------------------------------------------------------------------------
const GY2 = SRV2_GROUND_Y2;
type CK = { f: number; x: number; lk: number; fy: number; dx: number; dlk: number; dfy: number };
const c0 = srCamV2(SRV2_END_FRAME);
const c1 = srCamV2(SRV2_END_FRAME - 1);
const fyOf = (c: Cam) => 960 + (GY2 - c.y) * c.k;
/** the wide on "dominate them": the lying men (to ~x 1300) and the forager's dropped spear on the right, the orange
 *  men's sickle and back (~x -220) on the left; row 2's feet at screen y C_FY2 so the fallen Aztec's hanging hand
 *  stays above y 1075 */
export const C_K_WIDE = 0.59;
export const C_X_WIDE = 660;
export const C_FY2 = 1050;
export const CAM_KEYS: CK[] = [
  { f: 0, x: c0.x, lk: Math.log(c0.k), fy: fyOf(c0), dx: c0.x - c1.x, dlk: Math.log(c0.k / c1.k), dfy: fyOf(c0) - fyOf(c1) },
  // eased a little down (the spear tip off the top edge) ...
  { f: 30, x: 300, lk: Math.log(0.615), fy: 1068, dx: 1.5, dlk: 0.0009, dfy: 0.1 },
  // ... and in, through "significant player" (the forager hunched, his spear lowered with him)
  { f: 58, x: 380, lk: Math.log(0.635), fy: 1070, dx: 5.5, dlk: -0.0012, dfy: -0.3 },
  // one ease back: both rows whole for the lower death on "dominate" and the fields rolling on
  { f: 102, x: C_X_WIDE, lk: Math.log(C_K_WIDE), fy: C_FY2, dx: 0.35, dlk: 0.0003, dfy: 0 },
  { f: 129, x: C_X_WIDE + 0.35 * 27, lk: Math.log(C_K_WIDE) + 0.0003 * 27, fy: C_FY2, dx: 0.35, dlk: 0.0003, dfy: 0 },
];
const herm = (a: number, b: number, ma: number, mb: number, h: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * h * ma + (-2 * t3 + 3 * t2) * b + (t3 - t2) * h * mb;
};
export const camAtV2 = (f: number): Cam => {
  const K = CAM_KEYS;
  let i = 0;
  while (i < K.length - 2 && f > K[i + 1].f) i++;
  const A = K[i];
  const B = K[i + 1];
  const h = B.f - A.f;
  const t = clamp01((f - A.f) / h);
  const x = herm(A.x, B.x, A.dx, B.dx, h, t);
  const k = Math.exp(herm(A.lk, B.lk, A.dlk, B.dlk, h, t));
  const fy = herm(A.fy, B.fy, A.dfy, B.dfy, h, t);
  return { x, y: GY2 - (fy - 960) / k, k };
};
{
  const c = camAtV2(0);
  if (Math.abs(c.x - SRV2_CAM_END.x) > 1e-9 || Math.abs(c.y - SRV2_CAM_END.y) > 1e-6 || Math.abs(c.k - SRV2_CAM_END.k) > 1e-12) throw new Error("DiseaseDidTheWorkV2: camera f0 != 17 V2's last frame");
}

// ---------------------------------------------------------------------------
// THE SICKENING: one progress track p(f) for the cast's fall (0..1), keyed by a monotone cubic, drawn through the
// cast's own Sickening with a per-frame pose map (a fold at the hips while he kneels). A hunch in two coughing
// jolts (p 0-0.31: the stoop, a hand to the belly), the knees buckle (to 0.53, fast), he kneels folding forward at
// the hips (0.53-0.57), then drops (0.57-0.92 in 9 frames: slow to tip, fast to land) and settles on impact (a small
// rebound). Row 2 runs it ROW2_LAG frames later, landing on "dominate" (f104). Both fall to the RIGHT, away from
// the orange men, toward their own sunk homes.
// ---------------------------------------------------------------------------
export const ROW2_LAG = 15;
const FALL_DIR = 1 as const;
const P_KEYS: [number, number][] = [
  [30, 0],
  [35, 0.09], // first cough
  [41, 0.11],
  [45, 0.2], // second cough
  [52, 0.24],
  [60, 0.31],
  [66, 0.5], // the knees buckle
  [68, 0.53],
  [80, 0.57], // kneeling, folding at the hips
  [89, 0.92], // the drop: lands f89 (row 1) / f104 (row 2, "dominate")
  [91, 1],
];
export const LAND_1 = 89;
/** the fold at the hips while he kneels (0..1 by his own frame) */
const foldAt = (lf: number) => smoother((lf - 63) / 12) * (1 - smoother((lf - 81) / 6));
/** the settle on impact: a small rebound (world px up) */
const settleAt = (lf: number) => {
  const t = lf - LAND_1;
  return t <= 0 || t >= 7 ? 0 : 7 * Math.sin((Math.PI * t) / 7) * Math.exp(-t / 4);
};
const pchip = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return 0;
    if (i === n - 1) return 0;
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    return herm(ys[i], ys[i + 1], m[i], m[i + 1], h, (x - xs[i]) / h);
  };
};
const pTrack = pchip(
  P_KEYS.map((q) => q[0]),
  P_KEYS.map((q) => q[1]),
);
export const fallRow = (row: 1 | 2, f: number) => pTrack(row === 1 ? f : f - ROW2_LAG);
const localF = (row: 1 | 2, f: number) => (row === 1 ? f : f - ROW2_LAG);

/** a falling figure's body points (belly, hip) in world px, through the fall's own transform */
const fallingPoints = (sp: Spec, base: FigPose, p: number, at: P2, scale: number, map: (q: FigPose) => FigPose): P2[] => {
  const fi = fallInfo(sp, base, p, FALL_DIR, map);
  const A = figureAnchors(sp, fi.pose, at, scale);
  const a = (fi.angle * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const tf = (q: P2): P2 => {
    const dx = q[0] - at[0];
    const dy = q[1] - at[1];
    return [at[0] + c * dx - s * dy, at[1] + s * dx + c * dy - fi.lift * scale];
  };
  const at2 = (t: number): P2 => [A.chest[0] + (A.hip[0] - A.chest[0]) * t, A.chest[1] + (A.hip[1] - A.chest[1]) * t];
  return [tf(at2(0.2)), tf(at2(0.55)), tf(A.hip)];
};

// ---------------------------------------------------------------------------
// THE FORAGER'S SPEAR: held upright like a staff while he hunches (world angle fixed, in his right fist, so it
// never swings round with his body as he turns to stoop); let go on the second cough (f52), it topples to his
// right on its own (gravity: slow, then fast; the butt stays on the ground), lands ~f63 with a small bounce, well
// before he goes down. Drawn in front of him, the layer he held it on.
// ---------------------------------------------------------------------------
const FORAGER_SPEC = specOf("forager");
const SPEAR_WORLD = 3;
const F_RELEASE = 52;
const TOPPLE = 11;
const SPEAR_GRIP = 150;
type Drop = { grip: P2; butt: P2; angle: number; dir: 1 | -1; fore: number };
/** the toppling spear's fall plane is turned ~57 deg off the picture plane: horizontal reach x cos */
const SPEAR_FORESHORTEN = 0.55;
const foragerMap = (lf: number) => {
  const fold = foldAt(lf);
  return (q: FigPose): FigPose => {
    const r = fold > 0 ? { ...q, lean: q.lean + 30 * fold, pitch: q.pitch + 8 * fold, crouch: q.crouch + 6 * fold } : q;
    return lf < F_RELEASE ? aimToolWorld(r, SPEAR_WORLD, "R", "forager") : r;
  };
};
const commonerMap = (lf: number) => {
  const fold = foldAt(lf);
  return (q: FigPose): FigPose => (fold > 0 ? { ...q, lean: q.lean + 30 * fold, pitch: q.pitch + 8 * fold, crouch: q.crouch + 6 * fold } : q);
};
const spearDrop = (base: FigPose, f: number): Drop => {
  const sp = FORAGER_SPEC;
  const scale = SRV2_FORAGER.scale;
  const at = SRV2_FORAGER.at;
  const pRel = fallRow(1, F_RELEASE - 0.001);
  const fr = fallInfo(sp, base, pRel, FALL_DIR, foragerMap(F_RELEASE - 0.001));
  const r = figureRig(sp, fr.pose);
  const ar = r.armR;
  const G: 1 | -1 = r.s >= 0 ? 1 : -1;
  const v = rot(ar.dir, -90 * G);
  const gripL = add(ar.W, mul(ar.dir, 9 * sp.limb));
  const angL = (Math.atan2(v[0], -v[1]) * 180) / Math.PI;
  const g0 = rot(mul(gripL, scale), fr.angle);
  const grip0: P2 = [at[0] + g0[0], at[1] + g0[1] - fr.lift * scale];
  const a0 = angL + fr.angle;
  const rad0 = (a0 * Math.PI) / 180;
  const TG = SPEAR_GRIP * scale;
  const butt0: P2 = [grip0[0] - Math.sin(rad0) * TG, grip0[1] + Math.cos(rad0) * TG];
  const t = Math.max(0, f - F_RELEASE);
  // the topple: angle from a0 to 90 (to his right) as (t/T)^2, then a small bounce on the ground
  const u = Math.min(1, t / TOPPLE);
  let a = a0 + (90 - a0) * u * u;
  if (t > TOPPLE) a = 90 - 4 * Math.sin((Math.PI * Math.min(1, (t - TOPPLE) / 6))) * Math.exp(-(t - TOPPLE) / 5);
  const rad = (a * Math.PI) / 180;
  const groundY = at[1] - 5 * scale;
  const butt: P2 = [butt0[0], butt0[1] + (groundY - butt0[1]) * smoother(t / 5)];
  return { grip: [butt[0] + Math.sin(rad) * TG, butt[1] - Math.cos(rad) * TG], butt, angle: a, dir: G, fore: 1 - (1 - SPEAR_FORESHORTEN) * Math.sin((Math.min(90, Math.max(0, a)) * Math.PI) / 180) };
};

// ---------------------------------------------------------------------------
// THE GERMS: out of each orange man's BACK (he faces away, to his field; below the sheaf on the farmer's shoulder)
// and a little of his breath, from f0 (none on f0 itself: a mote is born at alpha 0), pulled across the gap to the
// cream man's belly. Few stipple motes, many legible engraved microbes, so it reads as disease, not chaff.
// ---------------------------------------------------------------------------
const backSources = (chest: P2, head: P2, scale: number, lag: number): { haze: GermSource[]; rods: GermSource[] } => {
  // his back and shoulders, up to the nape (he faces left: his back is to screen right), and his breath
  const back: P2 = [chest[0] + 0.55 * (head[0] - chest[0]) + 24 * scale, chest[1] + 0.55 * (head[1] - chest[1])];
  const breath: P2 = [head[0] - 30 * scale, head[1] + 12 * scale];
  return {
    // the faint haze first, from f0
    haze: [
      { at: back, rx: 30 * scale, ry: 48 * scale, from: 0, until: 74 + lag, rate: 5 },
      { at: breath, rx: 12 * scale, ry: 9 * scale, from: 0, until: 64 + lag, rate: 2.5 },
      { at: back, rx: 34 * scale, ry: 52 * scale, from: 0, rate: 1.6 },
    ],
    // the rods forming inside it, a few frames later (visible by "disease")
    rods: [
      { at: back, rx: 26 * scale, ry: 42 * scale, from: 1, until: 72 + lag, rate: 1.6 },
      { at: breath, rx: 10 * scale, ry: 8 * scale, from: 1, until: 60 + lag, rate: 0.7 },
      { at: back, rx: 30 * scale, ry: 46 * scale, from: 1, rate: 0.35 },
    ],
  };
};
const farmerA = farmAnchors("farmer", srPoseV2("farmer", SRV2_END_FRAME), SRV2_FARMER.at, SRV2_FARMER.scale);
const spaniardA = figureAnchors(SPANIARDS[0], srPoseV2("spaniard", SRV2_END_FRAME), SRV2_SPANIARD.at, SRV2_SPANIARD.scale);
const GERMS_1 = backSources(farmerA.chest, farmerA.headC, SRV2_FARMER.scale, 0);
const GERMS_2 = backSources(spaniardA.chest, spaniardA.headC, SRV2_SPANIARD.scale, ROW2_LAG);

// ---------------------------------------------------------------------------
// THE WIN: on "dominate" (f104) each orange field rolls on over the ground where its cream man fell, the same
// stalk-by-stalk rising front as cut 17 V2, past the body to the row's end by ~f121 (both rows together).
// ---------------------------------------------------------------------------
export const ROLL_FROM = 104;
export const ROLL_TO = 121;
export const ROLL_END = 1800;
const ROLL_V0 = 14;
export const frontAt = (f: number) => {
  if (f <= ROLL_FROM) return SRV2_FRONT_END;
  const u = Math.min(1, (f - ROLL_FROM) / (ROLL_TO - ROLL_FROM));
  const h = ROLL_TO - ROLL_FROM;
  return herm(SRV2_FRONT_END, ROLL_END, ROLL_V0, 0, h, u);
};

// ---------------------------------------------------------------------------
// THE ORANGE MEN TEND THEIR FIELDS: from f40 a slow bend toward the stalks (the farmer) and a look along the field
// (the Spaniard) laid over 17 V2's resolved pose and idle; zero on f0.
// ---------------------------------------------------------------------------
const tend = (q: FigPose, f: number, who: "farmer" | "spaniard"): FigPose => {
  const amt = smoother((f - 40) / 40);
  if (amt <= 0) return q;
  const ph = 0.5 - 0.5 * Math.cos((2 * Math.PI * (f - 40)) / (who === "farmer" ? 56 : 64));
  return who === "farmer"
    ? { ...q, lean: q.lean + 6 * amt * ph, pitch: q.pitch + 7 * amt * ph }
    : { ...q, lean: q.lean + 2.5 * amt * ph, headYaw: q.headYaw + 0.08 * amt * (ph - 0.5), pitch: q.pitch + 4 * amt * ph };
};

/** the world x that splits each row's germs: the empty gap just behind the orange men's backs (~x 110) */
const GERM_SPLIT_X = 135;
const GermHalf: React.FC<{ side: "orange" | "cream"; uid: string; children: React.ReactNode }> = ({ side, uid, children }) => (
  <g>
    <clipPath id={`${uid}-clip`}>
      {side === "orange" ? <rect x={-6000} y={-6000} width={6000 + GERM_SPLIT_X} height={12000} /> : <rect x={GERM_SPLIT_X} y={-6000} width={6000} height={12000} />}
    </clipPath>
    <g clipPath={`url(#${uid}-clip)`}>{children}</g>
  </g>
);

/** the picture at frame f under any camera (the cut passes its own; a review probe may pass another) */
/** a cream man sickening: at p 0 the plain cast component (17 V2's exact drawing); from p > 0 the cast's own
 *  Sickening with this cut's pose map (the fold, the staff) and its settle on impact */
const Falling: React.FC<{ spec: Spec; base: FigPose; p: number; at: P2; scale: number; map: (q: FigPose) => FigPose; settle: number; plain: React.ReactNode; body: (q: FigPose, ink: Ink) => React.ReactNode }> = ({ spec, base, p, at, scale, map, settle, plain, body }) => {
  if (p <= 0) return <>{plain}</>;
  return (
    <g transform={settle > 0.001 ? `translate(0 ${(-settle).toFixed(3)})` : undefined}>
      <Sickening spec={spec} pose={base} p={p} at={at} scale={scale} ink={CREAM} dir={FALL_DIR} mapPose={map}>
        {(q, ink) => body(q, ink)}
      </Sickening>
    </g>
  );
};

/** the picture at frame f under any camera (the cut passes its own; a review probe may pass another) */
export const DiseaseSceneV2: React.FC<{ f: number; cam?: Cam }> = ({ f, cam: camIn }) => {
  const g = SRV2_END_FRAME + f;
  const cam = camIn ?? camAtV2(f);
  const p1 = fallRow(1, f);
  const p2 = fallRow(2, f);
  const l1 = localF(1, f);
  const l2 = localF(2, f);
  const map1 = foragerMap(l1);
  const map2 = commonerMap(l2);
  const foragerBase = srPoseV2("forager", g);
  const commonerBase = srPoseV2("commoner", g);
  const released = f >= F_RELEASE;
  const spear = spearDrop(foragerBase, f);
  const t1 = fallingPoints(FORAGER_SPEC, foragerBase, p1, SRV2_FORAGER.at, SRV2_FORAGER.scale, map1);
  const t2 = fallingPoints(TILMA_COMMONER_SPEC, commonerBase, p2, SRV2_COMMONER.at, SRV2_COMMONER.scale, map2);
  const haze = { frame: f, k: cam.k, travel: 0.82, travelAt: 6, travelTime: 30, life: 120, spread: 1.0, wander: 14, settle: 95, opacity: 0.8, mote: 2.4, microbe: 0, microbeShare: 0, rodShare: 0.12 };
  const rods = { ...haze, travel: 0.9, opacity: 0.95, mote: 2.2, microbe: 50, microbeShare: 0.09, rodShare: 0.3 };
  const front = frontAt(f);
  const sink = srSinkV2(SRV2_FRONT_END);
  const germs1 = (
    <>
      <Germs {...haze} sources={GERMS_1.haze} targets={t1} seed={11} />
      <Germs {...rods} sources={GERMS_1.rods} targets={t1} seed={21} />
    </>
  );
  const germs2 = (
    <>
      <Germs {...haze} sources={GERMS_2.haze} targets={t2} seed={12} travelTime={34} />
      <Germs {...rods} sources={GERMS_2.rods} targets={t2} seed={22} travelTime={34} />
    </>
  );
  return (
    <WorldSvg cam={cam}>
      {/* row 1, in 17 V2's order (that order is what makes f0 identical). Each row's germs are drawn in two
          halves split at GERM_SPLIT_X, a line in the empty gap behind the orange man's back: the half over him is
          drawn UNDER him (never over an orange coat), the half over the cream man is drawn OVER him (the veil). */}
      <GroundLine {...SRV2_GROUND1} />
      <OrangeGround {...SRV2_BAND1} front={front} />
      <RisingWheat {...SRV2_WHEAT1} front={front} g={g} which="back" />
      <Sunk base={SRV2_HUT.at[1]} sink={sink} uid="dd2-hut">
        <HideTent {...SRV2_HUT} />
      </Sunk>
      <RisingWheat {...SRV2_WHEAT1} front={front} g={g} which="front" />
      <GermHalf side="orange" uid="dd2-g1o">
        {germs1}
      </GermHalf>
      <TurnFarmer {...SRV2_FARMER} pose={tend(srPoseV2("farmer", g), f, "farmer")} />
      <Falling
        spec={FORAGER_SPEC}
        base={foragerBase}
        p={p1}
        at={SRV2_FORAGER.at}
        scale={SRV2_FORAGER.scale}
        map={map1}
        settle={settleAt(l1)}
        plain={<TurnForager {...SRV2_FORAGER} pose={foragerBase} />}
        body={(q, ink) => <TurnForager {...SRV2_FORAGER} uid="dd2-forager" pose={q} ink={ink} shadow={false} hold={released ? "none" : "spear"} holdSide="R" />}
      />
      {released ? (
        // it topples obliquely, away into the depth to his right: its fall plane is turned SPEAR_OBLIQUE off the
        // picture plane, so its horizontal reach is foreshortened about the butt (growing with its tilt: none upright) (it lies on the ground beside him,
        // not reaching off the frame)
        <g transform={`translate(${spear.butt[0].toFixed(2)} 0) scale(${spear.fore.toFixed(4)} 1) translate(${(-spear.butt[0]).toFixed(2)} 0)`}>
          <Spear at={spear.grip} angle={spear.angle} dir={spear.dir} scale={SRV2_FORAGER.scale} ink={mixInk(CREAM, DEAD_INK, drainOf(p1) * 0.4)} uid="dd2-spear" />
        </g>
      ) : null}
      <GermHalf side="cream" uid="dd2-g1c">
        {germs1}
      </GermHalf>
      {/* row 2, the same */}
      <GroundLine {...SRV2_GROUND2} />
      <OrangeGround {...SRV2_BAND2} front={front} />
      <RisingWheat {...SRV2_WHEAT2} front={front} g={g} which="back" />
      <Sunk base={SRV2_HOUSE.at[1]} sink={sink} uid="dd2-house">
        <AztecHouse {...SRV2_HOUSE} />
      </Sunk>
      <Maize {...SRV2_MAIZE} g={g} />
      <RisingWheat {...SRV2_WHEAT2} front={front} g={g} which="front" />
      <GermHalf side="orange" uid="dd2-g2o">
        {germs2}
      </GermHalf>
      <TurnSpaniard {...SRV2_SPANIARD} pose={tend(srPoseV2("spaniard", g), f, "spaniard")} />
      <Falling
        spec={TILMA_COMMONER_SPEC}
        base={commonerBase}
        p={p2}
        at={SRV2_COMMONER.at}
        scale={SRV2_COMMONER.scale}
        map={map2}
        settle={settleAt(l2)}
        plain={<TurnTilmaCommoner {...SRV2_COMMONER} pose={commonerBase} />}
        body={(q, ink) => <TurnTilmaCommoner {...SRV2_COMMONER} uid="dd2-commoner" pose={q} ink={ink} shadow={false} />}
      />
      <GermHalf side="cream" uid="dd2-g2c">
        {germs2}
      </GermHalf>
    </WorldSvg>
  );
};

const DiseaseDidTheWorkV2: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Page>
        <DiseaseSceneV2 f={Math.max(0, Math.min(DURATION - 1, frame))} />
      </Page>
    </AbsoluteFill>
  );
};

export default DiseaseDidTheWorkV2;
