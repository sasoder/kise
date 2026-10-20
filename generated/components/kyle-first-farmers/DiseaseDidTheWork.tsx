// ---------------------------------------------------------------------------
// DiseaseDidTheWork (kyle-first-farmers, cut 24; file 24_DiseaseDidTheWork.mov). Dwarkesh map style
// (styles/dwarkesh-map.md), the umber page with no map. Opaque 1080x1920, 29.97 fps, 130 frames.
// Kit: firstFarmersShared (page, camera, ground, Germs) and farmersFigures (the cast, the fall), read-only; the
// picture it opens on is cut B's last frame (sameRelationshipState.ts).
//
// CHECK LINE: "in both pairs it was the germs, not a weapon, that brought the other side down: the same thing
// happens to the foragers and to the Aztecs at the same moment, and the orange side never lifts a hand."
//
// THE LINE: "disease is just like a significant player in why you were able to dominate them."
// WORD -> FRAME: disease 4 · is 17 · just 23 · like 28 · a 32 · significant 33 · player 45 · in 65 · why 74 ·
//   you 81 · were 93 · able 95 · to 100 · dominate 104 · them 113 · (host: I 126).
// DURATION: the slot 24.5245 -> 28.8622 s = 4.3377 s x 29.97 = 130 frames (f0..f129).
//
// THE MOTION: one change through both pairs at once, staged close -> wide. C f0 = B f180 pixel for pixel (B's
// wide, both pairs side by side). From f0 a translucent orange haze leaves both orange men together, off their
// whole outline and their breath (no tool, no gesture), visibly leaving by "disease" (f4), while the camera pushes
// in onto the Neolithic pair (B's creep runs on into the push; nearly there by f20, settled ~f30, the farmer and
// the forager ~680 px tall). Close, the haze is seen crossing as one stream and wrapping the forager's belly
// (contact ~f20-f24; first reaction f35: he stoops, a hand to his belly, on the cast's sicken-and-fall track,
// FALL_FROM 34 + 48 frames); his knees go ~f50-f60, he topples LEFT through "significant player" and lies face
// down, drained to DEAD, by f78, at and behind the farmer's feet. The Aztec commoner runs the same track off frame
// (AZTEC_LEAD 10 frames ahead, so he is already lying still when the frame reaches him). From f30 a slow drift
// out accelerates into one pull-back (f72-f104) that brings the Spaniard pair in, the commoner fallen the same
// way and the Spaniard's stream still crossing, thinning; it lands on "dominate them" (f104): the two orange men
// standing over the two fallen. Then a slow creep in and drift right to the last frame. The farmer keeps B's
// carry (sickle blade-up at his chest) and the Spaniard his sword sheathed: idle only.
// Orange = the incoming side (the farmer; his counterpart, the Spaniard) and the germs they carry; cream = the
// forager and the Aztec commoner, who drain to DEAD as they fall. No text, no arrows.
//
// SOURCES: none on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS as CLIP_FPS, Germs, GroundLine, Page, WorldSvg, type Cam, type GermSource, type P2 } from "./firstFarmersShared";
import { Farmer, Forager, HideTent, Spaniard, TILMA_COMMONER_SPEC, TilmaCommoner, WheatField, fallInfo, farmAnchors, specOf, type FigPose } from "./farmersFigures";
import { SPANIARDS, figureAnchors, type Spec } from "../kits/maps/texcocoFigures";
import {
  SR_CAM_END,
  SR_COMMONER,
  SR_END_FRAME,
  SR_FARMER,
  SR_FORAGER,
  SR_GROUND,
  SR_GROUND_Y,
  SR_HUT,
  SR_POSE,
  SR_SCENE_ORDER,
  SR_SPANIARD,
  SR_WHEAT,
  srCam,
  srPose,
} from "./sameRelationshipState";

export const FPS = CLIP_FPS;
export const DURATION = 130;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

// ---------------------------------------------------------------------------
// THE JOIN (C f0 = B f180): B's constants, asserted at module load
// ---------------------------------------------------------------------------
{
  if (SR_END_FRAME !== 180) throw new Error(`DiseaseDidTheWork: B's last frame is ${SR_END_FRAME}, not 180`);
  const order = ["wheat", "hut", "ground", "farmer", "forager", "spaniard", "commoner"];
  if (SR_SCENE_ORDER.join() !== order.join()) throw new Error(`DiseaseDidTheWork: B's scene order changed: ${SR_SCENE_ORDER.join()}`);
  const c0 = srCam(SR_END_FRAME);
  if (Math.abs(c0.x - SR_CAM_END.x) > 1e-9 || Math.abs(c0.y - SR_CAM_END.y) > 1e-9 || Math.abs(c0.k - SR_CAM_END.k) > 1e-12) throw new Error("DiseaseDidTheWork: srCam(180) != SR_CAM_END");
}

// ---------------------------------------------------------------------------
// THE CAMERA: close -> wide in one breath. Two moves summed in (x, log k, feet screen y):
//  1. THE PUSH onto the Neolithic pair from f0: a gamma-shaped speed (t^2 e^-t/4: zero speed and zero
//     acceleration at f0, quickest ~f8, a long soft landing: 91 % there by f22, 98 % by f30), plus B's creep
//     speed fading out, so C f0 is B's last camera in value and speed. Close: the farmer and the forager ~680 px
//     tall, the forager's upright spear tip ~70 px under the top edge.
//  2. THE WAY OUT from f30 (a C1 cubic Hermite in offsets from the close, zero speed at f30): a slow drift back
//     out while the forager goes down, accelerating into the pull-back (f72-f104, one move, no dwell) that lands
//     on both pairs on "dominate them", then a slow creep in and drift right to the last frame.
// The feet sit higher in the close (y ~1015) so the fallen man's hanging hand stays above the caption band
// (y 1080) at that scale. The resolved wide is as tight as the lying bodies allow: the forager's hand (~x 140) to
// the commoner's soles (~x 1715), ~1575 world px -> k 0.635-0.648 leaves ~25-40 px each side.
// ---------------------------------------------------------------------------
type CK = { f: number; x: number; lk: number; fy: number; dx: number; dlk: number; dfy: number };
const sr0 = srCam(SR_END_FRAME);
const srRate = Math.log(srCam(SR_END_FRAME).k / srCam(SR_END_FRAME - 1).k);
/** B's feet screen height on its last frame (~1050) */
const FY0 = 960 + (SR_GROUND_Y - sr0.y) * sr0.k;
export const C_K_CLOSE = 1.1;
export const C_K_WIDE = 0.635;
/** the close: framed a little left of the pair's centre (~603) so the right edge (~x 1050) stays short of where
 *  the Aztec's head comes down (~1060-1094) while he falls off frame */
const CLOSE = { x: 550, lk: Math.log(C_K_CLOSE), fy: 1015 };
const PUSH_TAU = 4;
/** the push's progress 0..1: the integral of t^2 e^(-t/tau), normalised */
const pushU = (f: number) => {
  const u = Math.max(0, f) / PUSH_TAU;
  return 1 - Math.exp(-u) * (1 + u + (u * u) / 2);
};
/** the way out, as offsets from CLOSE */
const OUT_FROM = 30;
export const C_OUT_KEYS: CK[] = [
  { f: OUT_FROM, x: 0, lk: 0, fy: 0, dx: 0, dlk: 0, dfy: 0 },
  { f: 72, x: 0, lk: Math.log(1.08 / C_K_CLOSE), fy: -3, dx: 2.0, dlk: -0.0012, dfy: 0 },
  { f: 104, x: 925 - CLOSE.x, lk: Math.log(C_K_WIDE / C_K_CLOSE), fy: 23, dx: 0.4, dlk: 0, dfy: 0 },
  { f: 129, x: 935 - CLOSE.x, lk: Math.log(0.648 / C_K_CLOSE), fy: 23, dx: 0.4, dlk: 0.0008, dfy: 0 },
];
const herm = (a: number, b: number, ma: number, mb: number, h: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * h * ma + (-2 * t3 + 3 * t2) * b + (t3 - t2) * h * mb;
};
const outAt = (f: number) => {
  if (f <= OUT_FROM) return { x: 0, lk: 0, fy: 0 };
  const K = C_OUT_KEYS;
  let i = 0;
  while (i < K.length - 2 && f > K[i + 1].f) i++;
  const A = K[i];
  const B = K[i + 1];
  const h = B.f - A.f;
  const t = Math.max(0, Math.min(1, (f - A.f) / h));
  return { x: herm(A.x, B.x, A.dx, B.dx, h, t), lk: herm(A.lk, B.lk, A.dlk, B.dlk, h, t), fy: herm(A.fy, B.fy, A.dfy, B.dfy, h, t) };
};
const camAt = (f: number): Cam => {
  const u = pushU(f);
  const o = outAt(f);
  // B's creep speed, fading out over ~5 frames (the push takes over from it)
  const creep = srRate * PUSH_TAU * (1 - Math.exp(-f / PUSH_TAU));
  const x = sr0.x + (CLOSE.x - sr0.x) * u + o.x;
  const k = Math.exp(Math.log(sr0.k) + (CLOSE.lk - Math.log(sr0.k)) * u + creep * (1 - u) + o.lk);
  const fy = FY0 + (CLOSE.fy - FY0) * u + o.fy;
  return { x, y: SR_GROUND_Y - (fy - 960) / k, k };
};
{
  const c = camAt(0);
  if (Math.abs(c.x - SR_CAM_END.x) > 1e-9 || Math.abs(c.y - SR_CAM_END.y) > 1e-9 || Math.abs(c.k - SR_CAM_END.k) > 1e-12) throw new Error("DiseaseDidTheWork: camera f0 != B's last frame");
  // one zoom direction per move: in to f30, out f48-f104, in again from f108 (the turns sit in the landings)
  for (let f = 1; f < DURATION; f++) {
    const d = Math.log(camAt(f).k / camAt(f - 1).k);
    if ((f <= 30 && d <= 0) || (f >= 48 && f <= 104 && d >= 0) || (f >= 108 && d <= 0)) throw new Error(`DiseaseDidTheWork: zoom turns at f${f} (${d})`);
  }
}

// ---------------------------------------------------------------------------
// THE FALL: both cream figures on one track, to the left (toward the orange figure)
// ---------------------------------------------------------------------------
const FALL_FROM = 34;
const FALL_LEN = 48;
const fallP = (f: number) => clamp01((f - FALL_FROM) / FALL_LEN);
const FALL_DIR = -1 as const;
export const AZTEC_LEAD = 10;

/** a falling figure's body points (chest, hip, head) in world px, through the fall's own transform */
const fallingPoints = (sp: Spec, base: FigPose, p: number, at: P2, scale: number): P2[] => {
  const fi = fallInfo(sp, base, p, FALL_DIR);
  const A = figureAnchors(sp, fi.pose, at, scale);
  const a = (fi.angle * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const tf = (q: P2): P2 => {
    const dx = q[0] - at[0];
    const dy = q[1] - at[1];
    return [at[0] + c * dx - s * dy, at[1] + s * dx + c * dy - fi.lift * scale];
  };
  // the belly and the hip, off the face
  const at2 = (t: number): P2 => [A.chest[0] + (A.hip[0] - A.chest[0]) * t, A.chest[1] + (A.hip[1] - A.chest[1]) * t];
  return [tf(at2(0.3)), tf(at2(0.65)), tf(A.hip)];
};

// ---------------------------------------------------------------------------
// THE GERMS: out of the orange figures' bodies and breath, from f0 (none on f0 itself: a mote is born at alpha 0)
// ---------------------------------------------------------------------------
const mix2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const sourcesOf = (chest: P2, head: P2, face: 1 | -1, scale: number): GermSource[] => {
  // the body: an ellipse round torso and head, so the motes come off his whole outline (shoulders, back, crown),
  // not out of the tool in his hand; the breath: a small puff just in front of his lips (the germs pass under the orange men, so his own head hides any over his face)
  const body = mix2(chest, head, 0.2);
  const breath: P2 = [head[0] + face * 30 * scale, head[1] + 12 * scale];
  return [
    { at: body, rx: 62 * scale, ry: 125 * scale, from: 0, until: 64, rate: 5 },
    // a second, thinner stream on to ~f100, so the Aztec pair's cause is still seen crossing after the pull-back
    { at: body, rx: 62 * scale, ry: 125 * scale, from: 40, until: 100, rate: 3.5 },
    { at: breath, rx: 14 * scale, ry: 10 * scale, from: 0, until: 72, rate: 3.5 },
    // the first breaths: a short burst so the motes are already visibly leaving him by "disease" (f4)
    { at: breath, rx: 20 * scale, ry: 14 * scale, from: 0, until: 10, rate: 9 },
    { at: body, rx: 62 * scale, ry: 125 * scale, from: 0, until: 10, rate: 8 },
    // and a low steady haze off him to the last frame (it thins as the strong emission ends)
    { at: body, rx: 62 * scale, ry: 125 * scale, from: 0, rate: 2 },
  ];
};
const farmerA = farmAnchors("farmer", SR_POSE.farmer, SR_FARMER.at, SR_FARMER.scale);
const spaniardA = figureAnchors(SPANIARDS[0], SR_POSE.spaniard, SR_SPANIARD.at, SR_SPANIARD.scale);
const GERMS_A = sourcesOf(farmerA.chest, farmerA.headC, 1, SR_FARMER.scale);
const GERMS_B = sourcesOf(spaniardA.chest, spaniardA.headC, 1, SR_SPANIARD.scale);
const FORAGER_SPEC = specOf("forager");

const DiseaseDidTheWork: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const f = Math.max(0, Math.min(DURATION - 1, frame));
  const g = SR_END_FRAME + f;
  const cam = camAt(f);
  const p = fallP(f);
  // the Aztec runs the same track AZTEC_LEAD frames ahead: he is off frame while we are close, and this way he
  // is already lying still when the pull-back brings him into the frame (no fall seen at the frame edge)
  const pB = fallP(f + AZTEC_LEAD);
  const foragerBase = srPose("forager", g);
  const commonerBase = srPose("commoner", g);
  const tA = fallingPoints(FORAGER_SPEC, foragerBase, p, SR_FORAGER.at, SR_FORAGER.scale);
  const tB = fallingPoints(TILMA_COMMONER_SPEC, commonerBase, pB, SR_COMMONER.at, SR_COMMONER.scale);
  // sizes are screen px: a touch larger in the close so the microbes read there at 270 px
  const kc = clamp01((cam.k - C_K_WIDE) / (C_K_CLOSE - C_K_WIDE));
  const germ = { frame: f, k: cam.k, travel: 0.82, travelAt: 5, travelTime: 26, life: 120, spread: 1.4, settle: 105, opacity: 0.85, mote: 3.0 + 0.8 * kc, microbe: 30 + 12 * kc, microbeShare: 0.015 + 0.006 * kc };
  return (
    <AbsoluteFill>
      <Page>
        <WorldSvg cam={cam}>
          <WheatField {...SR_WHEAT} g={g} />
          <HideTent {...SR_HUT} />
          <GroundLine {...SR_GROUND} />
          {/* the cream figures go down BEHIND the orange ones (no overlap on f0, so B's order is kept pixel for
              pixel there): the fallen lie at and behind the standing men's feet, whose legs stay whole. Each
              pair's germs lie between them: a veil over the cream man, under the orange one (so never over an
              orange face or coat: orange on orange is mush) */}
          <Forager {...SR_FORAGER} pose={foragerBase} fall={p} fallDir={FALL_DIR} />
          <Germs {...germ} sources={GERMS_A} targets={tA} seed={1} density={1.6} />
          <Farmer {...SR_FARMER} pose={srPose("farmer", g)} />
          <TilmaCommoner {...SR_COMMONER} pose={commonerBase} fall={pB} fallDir={FALL_DIR} />
          <Germs {...germ} sources={GERMS_B} targets={tB} seed={2} density={1.3} />
          <Spaniard {...SR_SPANIARD} pose={srPose("spaniard", g)} />
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default DiseaseDidTheWork;
