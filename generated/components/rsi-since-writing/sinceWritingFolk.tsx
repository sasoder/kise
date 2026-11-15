// ---------------------------------------------------------------------------
// sinceWritingFolk — THE HUMAN of rsi-since-writing (world builder W1; COMMON.md): present-day people ("you", the
// expert, the mathematician) on covidFolk's rig and paint (kyle-covid covidFolkBody / covidFolk's CovidPaint, imported,
// never edited): the officer build in shirtsleeves (kind "officer" v3: a man ~312 units = 1.75 m, ~4.4 heads, dot
// eyes, blush dot, small nose, mitten hands, small feet, ONE soft crescent shadow per part, pandemicFolkPaint's gouache
// filter, no outline). THE SAME SPECIES AND HAND AS THE GENIUS (rsi-ten-earths/tenEarthsGenius.tsx is this build
// re-inked in orange); the human wears muted earthy colours and is NEVER orange (the clip's colour rule).
// Read-only for cut builders after WORLD_READY.md (changes keep the old names, logged in notes/SHARED_CHANGES.md).
// Probe: sinceWritingProbe.tsx (src/Root.SinceWritingProbe.tsx).
//
// UNITS: rig units, feet at (0, 0), up -y, a man 312 units = 1.75 m (U = 178 per metre). `at` = the feet in world px
//   (seated: the floor under the hips), `scale` = world px per unit; on the depth kit const { at, scale } = A.P.at(X, Z).
//   A figure-local point p (units) is the world point (X + p[0], p[1], Z) at the figure's depth: humanWorld(X, Z, p).
//   Phone sizes as the Genius (GENIUS_READY): hero 350-600 px (scale*k 1.1-1.9), mid 120-200 px, seated ~0.83 of that.
//
// THE FIGURE
//   <Human variant pose at scale uid frame? fog? drain? unitPx? tone? texture? />
//     variant (HUMAN_LOOKS): v0 "you" (white shirt, open collar, dark hair, slate trousers: the hero, use it whenever
//       one person is meant), v1 the expert (oatmeal shirt, round glasses, grey-brown hair, umber trousers, fair skin),
//       v2 sleeves rolled to the elbow (cream shirt, chestnut hair, umber-slate trousers, tan skin). One build.
//     pose: a HumanPose (covidFolk's CovidPose + the hand props: mug, pot, pencil) from HUMAN_POSES (or a plain
//       covidFolk POSES pose). The props ride in the pose, so they are painted with him in the right layer: a held
//       mug / pot sits in front of the body and BEHIND the near arm's mitten; the pencil over the hand.
//     fog: A.folkFog(Z). drain 0..1 toward DEAD (#8A7B62). unitPx: cam.k inside a WorldSvg (the grain in screen px).
//   Contact shadow: the kit's <AirShadow A X Z w={62} d={30} amt={0.8} /> (seated: at the chair, OfficeDesk draws it).
//   Cost: a pose build ~40-50 ms (covidFolk's); 8-12 live figures a frame are fine.
//
// POSES (HUMAN_POSES; pure, frame-driven, seek-safe; dir 1 = facing screen right; frames at 23.976 fps)
//   stand(dir, frame, seed?)        three-quarter, a slow breath
//   look(yaw, frame, seed?)         standing at any yaw (0 front, +-0.62 three-quarter, +-1.3 profile, PI back)
//   walk(dir, frame, amount?)       planted feet, HUMAN_WALK_CYCLE = 24 frames per two steps (the Genius's pace);
//                                   move `at` by humanWalkAdvance(scale) px per frame in dir. Walk across the frame.
//   seatedWrite(dir, frame, seed?)  seated at a desk (HUMAN_DESK = the Genius desk contract: seat 84, desk top 132),
//                                   writing slowly with a pencil on a sheet lying on the desk: a line of small strokes
//                                   (~2 s), a lift and a carriage return; the other hand flat on the sheet; head down.
//                                   The sheet: a WorkSheet flat on the desk top under HUMAN_DESK.sheet (units from at).
//   seatedSip(dir, t, frame?) -> { pose, mug }   t 0..1 (give it ~60-80 frames): 0-0.1 the hand takes the handle,
//                                   0.1-0.36 lifts the mug from the desk (HUMAN_DESK.mug) to the mouth, 0.3-0.42 tips
//                                   it, drinks (eyes closing, head back a little), 0.62-0.74 tips it back, 0.74-0.92
//                                   lowers it onto the desk, 0.92-1 lets go. The mug is in the pose (it rides the hand on
//                                   every frame); `mug` = its MugState (units from at): mugMouth(mug) for the steam.
//   pour(dir, t, frame?) -> { pose, mug, pot, spout, mouth, flow }   standing three-quarter: the far hand holds a mug
//                                   in front of him, the near hand raises the coffee pot and tilts it over the mug: t
//                                   0-0.3 raise and tip (to 75 deg), 0.3-0.8 pour, 0.8-1 tip back. spout / mouth = the
//                                   stream's ends (units), flow 0..1 = how much is running (draw CoffeeStream from spout
//                                   to mouth when flow > 0). Frozen mid-pour (cut 11): pour(dir, 0.55) + freeze 1.
//   handOver(dir, t, frame?, seated?) -> { pose, hand }   a sheet passed across the desk: t 0-0.45 the near hand
//                                   reaches out (he leans in), 0.45-0.6 holds, 0.6-1 draws back; hand = the grip point
//                                   (units): draw a WorkSheet held there (humanWorld(X, Z, hand)). seated default true.
//   + covidFolk's breathe, lerpPose, mirrorPose (re-exported).
//
// ANCHORS: humanAnchors(variant, pose, at, scale) -> world px: headC headR headTop mouth eyes chest shoulderL/R
//   wristL/R handL/R (grips) mittenL/R hip kneeL/R ankleL/R toeL/R heelL/R pencilTip mugMouth (+ covidFolk's others).
// ---------------------------------------------------------------------------
import React from "react";
import { add, mix, mix2, mul, norm, rot, sub, vlen } from "../kits/maps/stringsMotion";
import { mixC } from "../kyle-pandemics/pandemicFolkPaint";
import { CovidPaint, type FolkFog } from "../kyle-covid/covidFolk";
import {
  HEAD_R,
  HEAD_UP,
  HAIR,
  POSES,
  SEAT,
  SKIN,
  breathe,
  buildCovidFolk,
  closedD,
  covidGripTo,
  covidRig,
  ellPts,
  lerpPose,
  mirrorPose,
  tubeD,
  type CShape,
  type CovidAnchors,
  type CovidInks,
  type CovidPose,
  type P2,
} from "../kyle-covid/covidFolkBody";
import { MUG, mugBaseForRim, mugHandle, mugMouth, mugShapes, PENCIL_TIP, pencilShapes, potGripForSpout, potShapes, potSpout, type MugState, type PotState } from "./sinceWritingProps";

export { breathe, lerpPose, mirrorPose };
export type { MugState, PotState, P2 };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => sst(0, 1, v);

// ===================================================================================================================
// THE LOOKS
// ===================================================================================================================
export const HUMAN_FPS = 24000 / 1001;
export const HUMAN_UNITS = 312;
export const U = 178;
export const humanScaleForPx = (px: number) => px / HUMAN_UNITS;
/** a figure-local point (units, facing as drawn) as a world point at the figure's depth */
export const humanWorld = (X: number, Z: number, p: P2) => ({ X: X + p[0], Y: p[1], Z });

const KIND = "officer" as const;
const VAR = 3;
const SHADE_TO = "#2C3433";
const TIE = "#2F5552";

export type HumanLook = { name: string; glasses: boolean; rolled: boolean; inks: Partial<CovidInks> };
export const HUMAN_LOOKS: HumanLook[] = [
  {
    name: "v0 you: white shirt, dark hair, slate trousers",
    glasses: false,
    rolled: false,
    inks: { skin: SKIN.warm, hair: HAIR.blackBrown, top: "#ECE8DE", top2: "#D9D4C8", lower: "#4E5961", belt: "#3B2D25", shoe: "#3B2D25", sole: "#2A211B", tie: TIE },
  },
  {
    name: "v1 the expert: oatmeal shirt, glasses, umber trousers",
    glasses: true,
    rolled: false,
    inks: { skin: SKIN.fair, hair: HAIR.greyBrown, top: "#D3C6A6", top2: "#BFB08D", lower: "#5E5040", belt: "#33281F", shoe: "#3B2D25", sole: "#2A211B", tie: TIE },
  },
  {
    name: "v2 rolled sleeves: cream shirt, chestnut hair",
    glasses: false,
    rolled: true,
    inks: { skin: SKIN.tan, hair: HAIR.chestnut, top: "#E6E0D2", top2: "#CFC7B5", lower: "#5C4A3A", belt: "#33281F", shoe: "#3B2D25", sole: "#2E2620", tie: TIE },
  },
];
export const HUMAN_VARIANTS = HUMAN_LOOKS.length;
const lookOfV = (v: number) => HUMAN_LOOKS[((Math.round(v) % HUMAN_VARIANTS) + HUMAN_VARIANTS) % HUMAN_VARIANTS];
export const humanLookName = (v: number) => lookOfV(v).name;

// ===================================================================================================================
// THE HEAD SPHERE (for the glasses; covidFolkBody's head from its exported rig, as the Genius does)
// ===================================================================================================================
type Head = { C: P2; R: number; roll: number; yaw: number; pitch: number };
const headOfPose = (q0: CovidPose): Head => {
  const { L, q, r } = covidRig(KIND, VAR, q0);
  const hunch = c01(q0.hunch ?? 0);
  const R = HEAD_R * L.head * (L.female ? 0.96 : 1);
  const C = add(r.headC, rot([0, -HEAD_UP + 7 * hunch], r.headAngle));
  return { C, R, roll: r.headAngle, yaw: q.headYaw, pitch: Math.max(-0.25, Math.min(0.55, ((q.pitch * Math.PI) / 180) * 0.8)) * Math.cos(q.headYaw) };
};
const hToFig = (h: Head, u: P2): P2 => add(h.C, rot([u[0] * h.R, u[1] * h.R], h.roll));
const hProj = (h: Head, beta: number, phi: number, rr = 1): { p: P2; d: number } => {
  const x0 = rr * Math.cos(phi) * Math.sin(beta + h.yaw);
  const y0 = -rr * Math.sin(phi);
  const d0 = Math.cos(phi) * Math.cos(beta + h.yaw);
  const cp = Math.cos(h.pitch);
  const spc = Math.sin(h.pitch);
  const y1 = y0 * cp + d0 * rr * spc;
  const d1 = d0 * cp - (y0 / rr) * spc;
  return { p: hToFig(h, [x0, y1]), d: d1 };
};
const ringD = (c: P2, rx: number, ry: number, t: number, rotDeg: number) => {
  const o = ellPts(c, rx + t / 2, ry + t / 2, rotDeg, 18);
  const i = ellPts(c, Math.max(0.2, rx - t / 2), Math.max(0.2, ry - t / 2), rotDeg, 18).reverse();
  return `${closedD(o, 0.9)} ${closedD(i, 0.9)}`;
};
const FRAME_C = "#3A2D25";
const LENS_C = "#F3EBDD";
/** round glasses (the Genius's, in a dark umber frame): a ring and a faint sheen per eye, a bridge, the near arm */
const glassesShapes = (h: Head): CShape[] => {
  const fs = h.R / 31.5;
  const out: CShape[] = [];
  const eyes = [-1, 1].map((s) => hProj(h, s * 0.36, 0.02, 1.07));
  const vis = sst(0.05, 0.3, Math.max(eyes[0].d, eyes[1].d));
  if (vis < 0.01) return out;
  let rings = "";
  let lenses = "";
  let glint = "";
  for (const e of eyes) {
    if (e.d <= 0.06) continue;
    const w = sst(0.06, 0.3, e.d);
    const rx = 7.4 * fs * mix(0.42, 1, e.d);
    const ry = 7.0 * fs;
    rings += ringD(e.p, rx, ry, 1.7 * fs * mix(0.8, 1, w), h.roll) + " ";
    lenses += closedD(ellPts(e.p, rx, ry, h.roll, 16), 0.9) + " ";
    glint += closedD(ellPts(add(e.p, rot([-rx * 0.38, -ry * 0.42], h.roll)), rx * 0.26, ry * 0.15, h.roll - 35, 10), 0.9) + " ";
  }
  if (lenses) out.push({ d: lenses, fill: LENS_C, sh: 0, op: 0.18 * vis });
  if (glint) out.push({ d: glint, fill: "#FFFDF6", sh: 0, op: 0.5 * vis });
  const b0 = hProj(h, -0.2, 0.05, 1.08);
  const b1 = hProj(h, 0, 0.09, 1.1);
  const b2 = hProj(h, 0.2, 0.05, 1.08);
  if (Math.min(b0.d, b2.d) > 0.0) out.push({ d: tubeD([b0.p, b1.p, b2.p], [1.5 * fs, 1.5 * fs, 1.5 * fs]), fill: FRAME_C, sh: 0, op: vis });
  if (rings) out.push({ d: rings, fill: FRAME_C, sh: 0, op: 0.95 * vis });
  const side = Math.sin(h.yaw) >= 0 ? -1 : 1;
  const a0 = hProj(h, side * 0.62, 0.04, 1.06);
  const a1 = hProj(h, side * 1.2, 0.03, 1.04);
  const av = sst(0.3, 0.6, Math.abs(Math.sin(h.yaw))) * sst(-0.1, 0.15, a1.d);
  if (av > 0.01) out.push({ d: tubeD([a0.p, a1.p], [1.2 * fs, 0.95 * fs]), fill: FRAME_C, sh: 0, op: 0.7 * av * vis });
  return out;
};

// ===================================================================================================================
// THE POSE AND THE BUILD
// ===================================================================================================================
export type HumanPose = CovidPose & {
  /** a pencil in a fist: which hand (L = the near hand facing right), the tip's direction (deg), its opacity */
  pencil?: { hand: "L" | "R"; ang: number; op?: number };
  /** a mug in the pose (held or set down), units from at */
  mug?: MugState;
  /** the coffee pot in the pose, units from at */
  pot?: PotState;
};
export type HumanAnchors = CovidAnchors & { pencilTip: P2; mugMouth: P2 };
export type HumanBuild = { shapes: CShape[]; anchors: HumanAnchors; heightUnits: number };

// the arm rig of the build (covidFolkBody's drawn-elbow rule, copied: the sleeve follows THAT elbow)
type ArmRig = ReturnType<typeof covidRig>["r"]["armL"];
const ARM: [number, number] = [58, 55];
const drawnElbow = (ar: ArmRig, hint: P2): P2 => {
  const d = sub(ar.W, ar.S);
  const Ld = vlen(d);
  if (Ld < 1) return ar.E;
  const u = mul(d, 1 / Ld);
  const a = (ARM[0] * ARM[0] - ARM[1] * ARM[1] + Ld * Ld) / (2 * Ld);
  const h = Math.sqrt(Math.max(0, ARM[0] * ARM[0] - a * a));
  const n: P2 = [-u[1], u[0]];
  const v = Math.max(-1, Math.min(1, (n[0] * hint[0] + n[1] * hint[1]) / 0.55));
  const b = Math.sign(v) * (1 - (1 - Math.abs(v)) ** 2);
  return add(ar.S, add(mul(u, a), mul(n, h * b)));
};
/** the rolled sleeve: the sleeve to just below the elbow, a rolled band, the bare forearm */
const rolledArm = (ar: ArmRig, hint: P2, top: string, top2: string, skin: string, op: number): { sleeve: CShape; cuff: CShape[] } => {
  const E = drawnElbow(ar, hint);
  const uu = norm(sub(E, ar.S));
  const sh0 = add(ar.S, mul(uu, 8));
  const W = ar.W;
  const P = (t: number) => mix2(E, W, t);
  const sleeve: CShape = { d: tubeD([sh0, mix2(ar.S, E, 0.5), E, P(0.16)], [23, 25, 22.5, 21.5]), fill: top, op };
  const fore: CShape = { d: tubeD([P(0.1), P(0.5), P(0.86), W], [16.5, 15, 13.6, 13]), fill: skin, op };
  const band: CShape = { d: tubeD([P(0.05), P(0.15), P(0.25)], [23, 23.5, 22]), fill: top2, sh: 0.55, op };
  return { sleeve, cuff: [fore, band] };
};

const BUCKLE_FROM = "#9C9488";
const BUCKLE_TO = "#A8A196";

/** build a human (figure-local units; FOLK units in the paths, as covidFolk) */
export const buildHuman = (variant: number, pose: HumanPose, o: { frame?: number; drain?: number } = {}): HumanBuild => {
  const lk = lookOfV(variant);
  const inks = lk.inks;
  const hold = { L: "none" as const, R: "none" as const };
  const opts = { inks, hold, carry: "none" as const, frame: o.frame ?? 0 };
  const real = buildCovidFolk(KIND, VAR, pose, { ...opts, drain: o.drain });
  // the parts are located on an undrained build of the same pose (the same shape order)
  const plain = (o.drain ?? 0) > 0 ? buildCovidFolk(KIND, VAR, pose, opts) : real;
  const S0 = plain.shapes;
  const n = Math.min(real.shapes.length, S0.length);
  const lc = (c: string | undefined) => (c ?? "").toLowerCase();
  const F = S0.map((s) => lc(s.fill));
  const skin = lc(inks.skin);
  const top = lc(inks.top);
  const top2 = lc(inks.top2);
  const tieSet = new Set([lc(TIE), lc(mixC(TIE, SHADE_TO, 0.1))]);
  const hairSet = new Set([lc(inks.hair), lc(mixC(inks.hair as string, "#F3EBDD", 0.22)), lc(mixC(inks.hair as string, SHADE_TO, 0.35))]);
  const isSleeve = (i: number) => i + 3 < n && F[i] === top && S0[i].det === undefined && F[i + 1] === top2 && F[i + 2] === skin && F[i + 3] === skin;
  // the sleeves in order, and which arm each is (covidFolkBody's assembly: back arms in [L, R], then front by z)
  const sleeves: number[] = [];
  for (let i = 0; i < n; i++) if (isSleeve(i)) sleeves.push(i);
  let lastHair = -1;
  for (let i = 0; i < n; i++) if (hairSet.has(F[i])) lastHair = i;
  const frontStart = sleeves.find((i) => i > lastHair) ?? n;
  const rolled = new Map<number, { sleeve: CShape; cuff: CShape[] }>();
  if (lk.rolled) {
    const { q, r } = covidRig(KIND, VAR, pose);
    const arms = [r.armL, r.armR];
    const fw = (ar: ArmRig) => sst(-0.35, -0.22, ar.z);
    const order: ArmRig[] = [...arms.filter((a) => fw(a) < 0.999), ...[...arms].sort((a, b) => a.z - b.z).filter((a) => fw(a) > 0.001)];
    if (order.length === sleeves.length) {
      const topR = real.shapes[sleeves[0]].fill;
      const top2R = real.shapes[sleeves[0] + 1].fill;
      const skinR = real.shapes[sleeves[0] + 2].fill;
      order.forEach((ar, j) => {
        const i = sleeves[j];
        const hint = (ar.sgn < 0 ? q.armL.elbow : q.armR.elbow) as P2;
        rolled.set(i, rolledArm(ar, hint, topR, top2R, skinR, real.shapes[i].op ?? 1));
      });
    }
  }
  // the props in front of the body, behind the near arm
  const extras: CShape[] = [];
  if (lk.glasses) extras.push(...glassesShapes(headOfPose(pose)));
  const propsMid: CShape[] = [];
  if (pose.mug) propsMid.push(...mugShapes(pose.mug));
  if (pose.pot) propsMid.push(...potShapes(pose.pot));
  const shapes: CShape[] = [];
  for (let i = 0; i < n; i++) {
    if (i === frontStart) shapes.push(...extras, ...propsMid);
    if (tieSet.has(F[i])) continue;
    const rr = rolled.get(i);
    if (rr) {
      shapes.push(rr.sleeve);
      continue;
    }
    if (i > 0 && rolled.has(i - 1)) {
      shapes.push(...(rolled.get(i - 1) as { cuff: CShape[] }).cuff);
      continue;
    }
    const s = real.shapes[i];
    shapes.push(s.fill === BUCKLE_FROM ? { ...s, fill: BUCKLE_TO } : s);
  }
  if (frontStart >= n) shapes.push(...extras, ...propsMid);
  const a = real.anchors;
  let pencilTip: P2 = a.handL;
  if (pose.pencil) {
    const grip = pose.pencil.hand === "L" ? a.handL : a.handR;
    const ang = pose.pencil.ang;
    pencilTip = add(grip, mul([Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)], PENCIL_TIP));
    shapes.push(...pencilShapes(grip, ang, pose.pencil.op ?? 1));
  }
  const mm = pose.mug ? mugMouth(pose.mug).c : a.mouth;
  return { shapes, anchors: { ...a, pencilTip, mugMouth: mm }, heightUnits: real.heightUnits };
};

// ===================================================================================================================
// THE FIGURE
// ===================================================================================================================
export type HumanProps = { variant?: number; pose: HumanPose; at: P2; scale: number; uid: string; frame?: number; fog?: FolkFog; drain?: number; tone?: number; unitPx?: number; texture?: boolean };
export const Human: React.FC<HumanProps> = ({ variant = 0, pose, at, scale, uid, frame, fog, drain, tone, unitPx, texture }) => {
  const b = buildHuman(variant, pose, { frame, drain });
  return <CovidPaint shapes={b.shapes} at={at} scale={scale} uid={uid} tone={tone} fog={fog} unitPx={unitPx} texture={texture} />;
};
/** the anchors in WORLD px of a human in a pose */
export const humanAnchors = (variant: number, pose: HumanPose, at: P2, scale: number): HumanAnchors => {
  const a = buildHuman(variant, pose).anchors;
  const out = {} as Record<string, unknown>;
  for (const [key, v] of Object.entries(a)) {
    if (key === "mouthDir") out[key] = v;
    else if (key === "headR") out[key] = (v as number) * scale;
    else if (key === "eyes") out[key] = (v as P2[]).map((e) => [at[0] + e[0] * scale, at[1] + e[1] * scale]);
    else out[key] = [at[0] + (v as P2)[0] * scale, at[1] + (v as P2)[1] * scale];
  }
  return out as HumanAnchors;
};
/** units -> world px for a figure at (at, scale) */
export const toWorldPx = (at: P2, scale: number, p: P2): P2 => [at[0] + p[0] * scale, at[1] + p[1] * scale];

// ===================================================================================================================
// THE POSES
// ===================================================================================================================
/** covidFolk's breathe runs on 29.97 fps frames */
const covidClock = (frame: number) => (frame * (30000 / 1001)) / HUMAN_FPS;
const SMILE = 0.18;
export const HUMAN_WALK_CYCLE = 24;
const STRIDE = 44;
export const humanWalkAdvance = (scale: number) => (2 * STRIDE * scale) / HUMAN_WALK_CYCLE;

/** the desk contract (= the Genius's GENIUS_DESK: seat 84, desk top 132), units from `at` (under the hips), facing
 *  right; mirror x when facing left. mug = where the mug rests (its base), sheet = the centre of the sheet he writes on
 *  (lying on the desk top), rest = where the near hand rests on the desk. */
export const HUMAN_DESK = {
  seatH: 84,
  deskH: 132,
  mug: [80, -132] as P2,
  sheet: [88, -132] as P2,
  rest: [60, -137] as P2,
  restFar: [70, -138] as P2,
  front: 48,
};
const mirrorMug = (m: MugState): MugState => ({ base: [-m.base[0], m.base[1]], tilt: -m.tilt, level: m.level, handle: (-m.handle) as -1 | 1 });
const mirrorPot = (p: PotState): PotState => ({ grip: [-p.grip[0], p.grip[1]], tilt: -p.tilt, level: p.level, sx: (-p.sx) as -1 | 1 });
const face = (q: HumanPose, dir: 1 | -1): HumanPose =>
  dir === 1
    ? q
    : {
        ...mirrorPose(q),
        pencil: q.pencil ? { ...q.pencil, hand: q.pencil.hand === "L" ? "R" : "L", ang: 180 - q.pencil.ang } : undefined,
        mug: q.mug ? mirrorMug(q.mug) : undefined,
        pot: q.pot ? mirrorPot(q.pot) : undefined,
      };
const flipP = (p: P2, dir: 1 | -1): P2 => [p[0] * dir, p[1]];
const solve = (q: HumanPose, grip: { L?: P2; R?: P2 }): HumanPose => ({ ...covidGripTo(KIND, VAR, q, grip, [0, 0], 1), pencil: q.pencil, mug: q.mug, pot: q.pot });
const SEATED: HumanPose = { ...POSES.sit(1, HUMAN_DESK.seatH), lean: 7, pitch: 3, headYaw: 0.9, mouth: SMILE };
const STAND: HumanPose = { ...POSES.stand(1), mouth: SMILE };

// the mouth of the drinking head (the arms do not move the head: built once)
let SIP_MOUTH: P2 | null = null;
const sipHead = (drink: number): HumanPose => ({ ...SEATED, pitch: SEATED.pitch - 9 * drink, lean: SEATED.lean - 2 * drink });
const sipMouth = (): P2 => {
  if (!SIP_MOUTH) SIP_MOUTH = buildCovidFolk(KIND, VAR, sipHead(1), { inks: HUMAN_LOOKS[0].inks }).anchors.mouth;
  return SIP_MOUTH;
};
let STAND_CHEST: P2 | null = null;
const standChest = (): P2 => {
  if (!STAND_CHEST) STAND_CHEST = buildCovidFolk(KIND, VAR, STAND, { inks: HUMAN_LOOKS[0].inks }).anchors.chest;
  return STAND_CHEST;
};

export const HUMAN_POSES = {
  /** standing three-quarter facing dir, a slow breath */
  stand: (dir: 1 | -1 = 1, frame = 0, seed = 0): HumanPose => face(breathe(STAND, covidClock(frame), 1, seed) as HumanPose, dir),
  /** standing at any yaw, breathing */
  look: (yaw: number, frame = 0, seed = 0): HumanPose => breathe({ ...POSES.turnTo(yaw), mouth: SMILE }, covidClock(frame), 1, seed) as HumanPose,
  /** the walk with planted feet (HUMAN_WALK_CYCLE frames per two steps); move at by humanWalkAdvance(scale) px/frame */
  walk: (dir: 1 | -1 = 1, frame = 0, amount = 1): HumanPose => ({ ...POSES.walk(dir, frame / HUMAN_WALK_CYCLE, amount), mouth: SMILE }),

  /** seated, writing slowly on a sheet on the desk (HUMAN_DESK.sheet): a line of small strokes, a lift, a return */
  seatedWrite: (dir: 1 | -1 = 1, frame = 0, seed = 0): HumanPose => {
    const LINE = 52;
    const ph = (frame + seed * 17) / LINE;
    const u = ph - Math.floor(ph);
    // across the line (u 0..0.82: writing, letters as small bobs and word gaps), then the carriage return (lifted)
    const wr = c01(u / 0.82);
    const back = sst(0.82, 1, u);
    const x0 = 72;
    const x1 = 100;
    const x = u < 0.82 ? mix(x0, x1, wr) + 0.9 * Math.sin(frame * 1.7 + seed) : mix(x1, x0, back);
    const word = Math.sin(wr * Math.PI * 7 + seed) > 0.82 ? 1 : 0;
    const lift = u < 0.82 ? 0.9 * Math.abs(Math.sin(frame * 1.31 + seed * 2)) + 2.2 * word : 5 * Math.sin(Math.PI * back);
    const ang = 66 + 4 * Math.sin(frame * 0.5 + seed);
    const tip: P2 = [x, -HUMAN_DESK.deskH - 1 - lift];
    const grip = sub(tip, mul([Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)], PENCIL_TIP));
    const base = breathe({ ...SEATED, lean: 10, pitch: 13, look: [0.35, 0.55] as P2, headYaw: 0.92 + 0.04 * Math.sin(frame * 0.05) }, covidClock(frame), 0.7, seed) as HumanPose;
    const q = solve({ ...base, pencil: { hand: "L", ang } }, { L: grip, R: [96 + 2 * Math.sin(frame * 0.03), -HUMAN_DESK.deskH - 4] });
    const lids: HumanPose = { ...q, armL: { ...q.armL, fist: 0.75, hand: 6 }, armR: { ...q.armR, fist: 0.05, hand: 30 } };
    return face(lids, dir);
  },

  /** seated, a sip of coffee: t 0..1 (see the header); returns the pose (the mug inside it) and the mug's state */
  seatedSip: (dir: 1 | -1 = 1, t = 0, frame = 0, level = 0.8): { pose: HumanPose; mug: MugState } => {
    const u = c01(t);
    const grasp = sst(0, 0.1, u);
    const lift = sst(0.1, 0.36, u) - sst(0.74, 0.92, u);
    const tipA = sst(0.3, 0.42, u) - sst(0.62, 0.74, u);
    const drink = sst(0.33, 0.44, u) - sst(0.6, 0.7, u);
    const release = sst(0.92, 1, u);
    const tilt = -62 * tipA;
    // the mug at rest on the desk, and at the mouth (its face-side rim on the lips) at the current tilt
    const rest = HUMAN_DESK.mug;
    const mouth = add(sipMouth(), [2, 1]);
    const atMouth = mugBaseForRim(mouth, tilt, -1);
    const e = ease(lift);
    const arc: P2 = [10 * Math.sin(Math.PI * e), -4 * Math.sin(Math.PI * e)];
    const baseP = add(mix2(rest, atMouth, e), arc);
    const mug: MugState = { base: baseP, tilt, level: level * (1 - 0.06 * sst(0.4, 0.62, u)), handle: -1 };
    const handle = mugHandle(mug);
    const restHand = HUMAN_DESK.rest;
    const gripPt = mix2(mix2(restHand, handle, grasp), add(restHand, [-4, 0]), release);
    const head = sipHead(drink);
    const base = breathe({ ...head, lids: 0.65 * drink, mouth: SMILE * (1 - drink), look: [0.4, 0.15] as P2 }, covidClock(frame), 0.7) as HumanPose;
    const q = solve({ ...base, mug }, { L: gripPt, R: HUMAN_DESK.restFar });
    const held = grasp * (1 - release);
    const qq: HumanPose = { ...q, armL: { ...q.armL, fist: mix(0.2, 0.85, held), hand: mix(10, -8, held) }, armR: { ...q.armR, fist: 0.15, hand: 26 } };
    return { pose: face(qq, dir), mug: dir === 1 ? mug : mirrorMug(mug) };
  },

  /** standing, pouring coffee from the pot (near hand) into a mug (far hand): t 0..1 (see the header) */
  pour: (dir: 1 | -1 = 1, t = 0, frame = 0, potLevel = 0.6): { pose: HumanPose; mug: MugState; pot: PotState; spout: P2; mouth: P2; flow: number } => {
    const u = c01(t);
    const raise = sst(0, 0.22, u);
    const tipA = sst(0.08, 0.32, u) - sst(0.8, 0.97, u);
    const flow = sst(0.28, 0.36, u) * (1 - sst(0.78, 0.86, u));
    const ch = standChest();
    // the mug in the far hand, in front of his belly
    const mugGrip: P2 = add(ch, [58, 54]);
    const mug0: MugState = { base: [0, 0], tilt: 0, level: 0.15 + 0.6 * sst(0.32, 0.82, u), handle: -1 };
    const mug: MugState = { ...mug0, base: sub(mugGrip, mugHandle(mug0)) };
    const mo = mugMouth(mug).c;
    // the pot in the near hand: lifted from his side, the spout brought over the mug, tipped
    const tilt = 75 * tipA;
    const spoutAim = add(mo, [-2, -34 - 16 * (1 - tipA)]);
    const potGripAim = potGripForSpout(spoutAim, tilt, 1);
    const potRest: P2 = [22, -150];
    const potGrip = mix2(potRest, potGripAim, ease(raise));
    const pot: PotState = { grip: potGrip, tilt: tilt * ease(raise), level: potLevel * (1 - 0.5 * sst(0.32, 0.82, u)), sx: 1 };
    const base = breathe({ ...STAND, yaw: 0.66, headYaw: 0.78, pitch: 9, look: [0.35, 0.6] as P2 }, covidClock(frame), 0.6) as HumanPose;
    const q = solve({ ...base, mug, pot }, { L: potGrip, R: mugGrip });
    const qq: HumanPose = { ...q, armL: { ...q.armL, fist: 0.9, hand: -6 }, armR: { ...q.armR, fist: 0.85, hand: -10 } };
    const fl = (p: P2) => flipP(p, dir);
    return { pose: face(qq, dir), mug: dir === 1 ? mug : mirrorMug(mug), pot: dir === 1 ? pot : mirrorPot(pot), spout: fl(potSpout(pot)), mouth: fl(mo), flow };
  },

  /** a sheet passed across the desk (seated by default): t 0..1 (see the header); hand = the grip point (units) */
  handOver: (dir: 1 | -1 = 1, t = 0, frame = 0, seated = true): { pose: HumanPose; hand: P2 } => {
    const u = c01(t);
    const out = ease(sst(0, 0.45, u)) * (1 - ease(sst(0.6, 1, u)));
    const rest: P2 = seated ? [62, -142] : [36, -150];
    const reach: P2 = seated ? [122, -150] : [118, -168];
    const hand = mix2(rest, reach, out);
    const b0: HumanPose = seated ? SEATED : { ...STAND, yaw: 1.0, headYaw: 0.95, footL: [-8, 0], footR: [10, -1] };
    const base = breathe({ ...b0, lean: b0.lean + 8 * out, pitch: b0.pitch + 4 * out, look: [0.5, 0.2] as P2 }, covidClock(frame), 0.6) as HumanPose;
    const q = solve(base, seated ? { L: hand, R: HUMAN_DESK.restFar } : { L: hand });
    const qq: HumanPose = { ...q, armL: { ...q.armL, fist: 0.7, hand: mix(14, 0, out) } };
    return { pose: face(qq, dir), hand: flipP(hand, dir) };
  },
};
export const HUMAN_HIP_SEATED = HUMAN_DESK.seatH + SEAT.hipAbove;
export { MUG };
