// ---------------------------------------------------------------------------
// LatentLongEnough (kyle-covid, cut 3; the clip's first graphic). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 161 frames.
// The metro carriage (covidCarriage, the interior medium) with the modern gouache cast (covidFolk), both imported
// read-only; the kit kits/dwarkesh-3d/dwarkesh3d underneath.
//
// CHECK LINE: "This man is carrying the virus and has no idea — he looks and feels completely fine — and he's already
// breathing it onto the woman next to him."
//
// THE LINE: "[when you look at even COVID-19, part of what made it insidious is] it just has just the right parameters
// to be latent for just long enough." (the bracket is on the speaker before the cut)
// WORD -> FRAME (f0 = 3.1698 s): it 2 · just 6 · has 13 · just 20 · the 31 · RIGHT 39 · PARAMETERS 45 · to 61 · be 78 ·
// LATENT 84 · for 107 · just 127 · LONG 138 · ENOUGH 146 · (Like 160, then the speaker returns)
// DURATION: the slot 3.1698 -> 8.5419 s = 5.372 s x 29.97 = 161 frames (f0..f160).
//
// THE MOTION (review 1 applied): one continuous dolly down the aisle from the carriage end (zoom 2.55 -> 7.2 by LATENT
// f84 with one deceleration lobe, the eye lowering from 1.35 m to about his chest, 1.19 m, and a sideways ease, then a
// slow zoom creep to the end; no stop, no pull-back). A cheerful passenger at the centre aisle pole scrolls his phone; a
// faint orange glow already sits in his lungs (infected 0.3, the only orange in frame), and on RIGHT PARAMETERS it
// grows (f34 -> f84, to 1) while he laughs at his phone (the cast's laugh face, f40 -> f64, ramped over 10 frames each
// way). On LATENT the camera lands on a medium-close two-shot: him ~61 % of the frame height (head ~290 px wide, ~y 514;
// the two lung lobes ~y 785; feet ~y 1550), the woman seated on the right: glowing at full, the picture of health;
// nobody reacts (he reads on, a small amused nod f90 -> f108). On FOR (f102 -> f122) he lowers the phone, turns his head to her and chats, and she leans in; the
// warm cloud of his breath hangs round his head and shoulders (covidHaze, user revision 1: see below) and, as he
// talks, its front lobe fills the air between them; she sits inside its thin edge. Contact: on the chat she breathes in (f126 ->
// f136, her shoulders lift a touch), drawing in the few motes near her mouth; first reaction: from LONG (f138) her
// chest kindles (infected 0.36 by f156, driven by the frame).
// She answers (f140 -> f152), then smiles and nods: perfectly well. f146 -> f160: a settled living hold (him talking,
// her smiling, the train swaying, the tunnel lights).
// Orange = THE VIRUS only (the clip's ORANGE RULE): his lung glow, the haze of his breath, her kindling glow; everything
// else in the carriage's and the cast's muted local colours.
//
// DEPTH: the carriage's set, light and camera grammar (CARRIAGE_DEPTH dRef 700 at kRef 2, dolly 0.5, CARRIAGE_SCENE:
// fog by the eye's distance, mood interior), the eye height moving with the dolly (latentCamAt). Exported for cut 12:
// POLE (the centre aisle pole, Z 330), CARRIER_FEET (X -60, facing right, far hand on the pole: GRIP3), WOMAN_SEAT
// (right bench Z 452), HIDE_POLES / HIDE_STRAPS (CarriageStage hidePoles / hideStraps: the near pair, the left row behind
// his head, the nearer right poles between them), latentCamAt(f) and LANDING (the f84 camera). Passengers (all well, no
// masks): an elder near the camera on the left bench (passed by the dolly), three sitters deeper down the left bench
// (seen in the wide, behind him once the camera lands), a girl on her phone further along the right bench (Z 1648) and a
// man standing by the far end door (Z 1975); the haze sits in front of the last two, far nearer than they are (no mote
// ever rides a face).
//
// REVIEW 2: his phone is held low at belly height (the upper arm down his near side, the forearm below the lungs), so
// both lung lobes and the windpipe show whole on every frame; the Carrier wears no backpack in cuts 3 and 21 (the
// director's decision: the straps made the glow read as a bib); he stays recognisable by the red beanie and the cream
// puffer. The exported staging constants are unchanged.
//
// USER REVISION 1 (00;00;06;28, "when the virus gets transferred from the guy to the girl it's super weird ... much more
// in the atmosphere almost, a subtle cloud around him"): the steered breath cone is gone. Every exhale (his breathing,
// the laugh f40 -> f64, the chat from ~f110) feeds a warm cloud of air round him (covidHaze, depth mode, anchored at his
// feet, centred on his head): a feathered orange veil round his head and shoulders on every side (thickest round his
// face, ~0.24 from ~f100), a lobe in front of his face that fills while he talks, a wide faint halo, so her face sits in
// its thin edge (~0.07 at f120), and sparse tiny motes wandering inside it (none up at the ceiling or down the aisle).
// It builds with his glow (barely at f0, ~0.12 at f60) and swells a touch on each exhale. Her kindle is a function of the
// frame. Nothing else changed (camera, timing, poles, passengers, glow v3, 161 frames).
//
// USER REVISION 2 (00;00;03;05, "the aura around him needs to be slightly more pronounced ... you should still
// understand that that man is sick and now he's making others sick"): the virus throws a soft warm light (covidAura,
// COMMON.md "THE AURA"): his, on his chest, from f0 at his infected level 0.3 growing with the glow to full by LATENT,
// drawn behind him at full and over him at AURA_FRONT 0.35 (the lungs keep their contrast); hers kindling with her glow
// from LONG; both fading out above the caption bands (rows 960 -> 1070). The cloud a step stronger (HAZE_STRENGTH
// 1.42: veil cap 0.34, motes 1.3x larger). Nothing else changed.
//
// SOURCES: none (no real figures; the latency fact is the speaker's).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirShadow, AirStage, WorldSvg, airWorldOf, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CARRIAGE_DEPTH, CARRIAGE_SCENE, CarriageStage, NEAR_POLES, carriageSway, polePoint, polesOf, seatNear, swayPose, type Pole, type StageItem } from "./covidCarriage";
import { CovidFigure, POSES, covidAnchors, lerpPose, type CovidFigureProps, type CovidKind, type CovidPose, type P2 } from "./covidFolk";
import { HazeCloud, breathRhythm, hazeAt, type HazeAvoid, type HazeEmitter } from "./covidHaze";
import { AuraGlow, auraFor } from "./covidAura";

export const FPS = 30000 / 1001;
export const DURATION = 161;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ===================================================================================================================
// THE CAMERA: one dolly down the aisle (log-zoom), the horizon row rising so his head sits high, a small ease right
// ===================================================================================================================
/** an ease-out with a moving start (the track never starts at rest), flat at u = 1 */
const easeOut = (u: number, n: number) => 1 - Math.pow(1 - c01(u), n);
/** the camera keys: f0 the carriage end (the carriage's own wide grammar, eye 1.35 m), the landing at LATENT f84 (eye
 *  lowered to about his chest, a medium-close two-shot), then a slow creep on zoom and sideways to the end */
export const CAM_KEYS = {
  k0: 2.55,
  kLand: 7.1,
  /** the creep after the landing (log-zoom per cut, spread over the whole cut so k' never changes sign) */
  kCreep: 0.045,
  eye0: CARRIAGE_DEPTH.eyeY,
  eyeLand: -212,
  hr0: 812,
  hrLand: 765,
  cx0: -14,
  cxLand: 44,
  cxCreep: 0,
  fLand: 108,
};
/** the camera at frame f: the 2D camera and the depth options (the eye height moves with the dolly) */
export const latentCamAt = (f: number): { cam: Cam; depth: DepthOpts } => {
  const K = CAM_KEYS;
  const e = easeOut(f / K.fLand, 3);
  const k = Math.exp(Math.log(K.k0) + (Math.log(K.kLand) - Math.log(K.k0)) * e + K.kCreep * (f / (DURATION - 1)));
  const eyeY = mix(K.eye0, K.eyeLand, e);
  const hr = mix(K.hr0, K.hrLand, e);
  const cx = mix(K.cx0, K.cxLand, e) + K.cxCreep * (f / (DURATION - 1));
  return { cam: { k, cx, cy: eyeY + (960 - hr) / k }, depth: { ...CARRIAGE_DEPTH, eyeY } };
};
export const camAt = (f: number): Cam => latentCamAt(f).cam;
const REST = camAt(0);

// ===================================================================================================================
// THE PEOPLE
// ===================================================================================================================
/** the cast's glow pinned to the one this cut was delivered on (covidFolk round 3; later rounds changed the default) */
const GLOW_STYLE = "v3" as const;
export type FigSpec = { kind: CovidKind; v: number; pose: CovidPose; X: number; Z: number; props?: Partial<CovidFigureProps>; uid: string; shadow?: [number, number] };

/** THE STAGING (cut 12 imports these: the same pole, the same camera grammar) */
/** the centre aisle pole at Z 330 (Pole.i 14) */
export const POLE = polesOf("C")[0];
/** his feet: facing right, the pole 60 units ahead (his far hand on it: standHold "far" + grip GRIP3); at this
 *  distance his face stays clear of the pole when he turns to her (nearer than ~55 the fist also slips off it) */
export const CARRIER_FEET = { X: POLE.X - 60, Z: POLE.Z };
export const GRIP3 = polePoint(POLE, "carrier", 0);
/** the woman's seat: the right bench, the last seat before the door bay (Z 452) */
export const WOMAN_SEAT = seatNear("R", 452);
/** the poles left out (CarriageStage hidePoles): the near pair, the whole left row that lines up behind his head (but
 *  the farthest), and the nearer right poles that cut between him and her; kept for the place: the centre poles, the
 *  far right row (Z 1040, 1630, 1880) and the far left pole */
export const HIDE_POLES = [NEAR_POLES.L, NEAR_POLES.R, 2, 3, 4, 5, 6, 8, 9, 10];
export const HIDE_STRAPS = (st: { Z: number }) => st.Z < 150;
/** the landing camera (LATENT f84) */
export const LANDING = latentCamAt(84);
export const isHiddenPole = (p: Pole) => HIDE_POLES.includes(p.i);

/** the beats (frames) */
export const BEAT = {
  glowFrom: 34,
  glowFull: 84,
  laugh0: 40,
  laugh1: 64,
  turn0: 102,
  turn1: 122,
  breath0: 108,
  breathFull: 118,
  herLook0: 108,
  herLook1: 124,
  herChat: 140,
  /** revision 3 (user 1): her breath in before she answers, and her kindle from LONG */
  inhale0: 126,
  inhale1: 136,
  kindle0: 138,
  kindle1: 156,
};

/** the phone hand's wrist (rig units from his feet, facing right): belly height just in front of him, the upper arm
 *  hanging down his near side and the forearm angled forward below the lungs (review 2: both lobes show whole) */
const PHONE_W: [number, number] = [10, -152];
/** the Carrier: scrolling his phone (head down, a smile), a laugh, then the turn to her and the chat */
export const carrierPose = (frame: number): CovidPose => {
  const base = POSES.standHold(1, "pole", "far");
  // reading the phone: the near hand low and a little out at belly height, the forearm below the lungs, the phone tipped
  // up toward his eyes (review 2: both lobes show whole)
  const scroll = Math.sin(frame * 0.21) * 0.5 + Math.sin(frame * 0.083 + 1) * 0.5 + 1.6 * Math.sin(Math.PI * c01((frame - 94) / 8)) ** 2;
  const read: CovidPose = {
    ...base,
    yaw: 0.5,
    headYaw: 0.6,
    pitch: 18,
    look: [0.3, 1],
    mouth: 0.55,
    lean: 1,
    armL: { w: [PHONE_W[0], PHONE_W[1]], elbow: [-0.35, 1], fist: 0.85, hand: -88 + 4 * scroll },
  };
  // the laugh at the phone (f40 -> f64): the cast's laugh face (a wide open smile, happy-arc eyes, lifted cheeks), ramped
  // in over 10 frames and out over 10, the head tipping back with its soft bounce, the chin up from the phone and the
  // shoulders easing back a little
  const lamt = sst(BEAT.laugh0, BEAT.laugh0 + 10, frame) * (1 - sst(BEAT.laugh1 - 10, BEAT.laugh1, frame));
  const laughing: CovidPose = POSES.laugh({ ...read, pitch: read.pitch - 9 * lamt, lean: read.lean - 2 * lamt, look: [0.35, mix(0.75, 0.5, lamt)] }, frame, lamt);
  // the turn to her: body and head round to screen right, the eyes onto her face, the phone lowered a little
  const t = sst(BEAT.turn0, BEAT.turn1, frame);
  const talk: CovidPose = {
    ...base,
    yaw: 0.62,
    headYaw: 0.9,
    pitch: 7,
    look: [0.75, 0.3],
    mouth: 0.6,
    lean: 0,
    armL: { w: [PHONE_W[0] + 4, PHONE_W[1] + 4], elbow: [-0.35, 1], fist: 0.85, hand: -70 },
  };
  // on the landing he keeps reading, amused: a small nod at what he reads and a thumb flick (f90 -> f108, life in the hold)
  let q = lerpPose(POSES.nod(laughing, c01((frame - 90) / 18), 6), talk, t);
  // chatting once turned: the mouth in syllables (a pause, smiling, while she answers), the phone hand gesturing a little
  const chatA = sst(BEAT.turn0 + 8, BEAT.turn1 + 4, frame);
  if (chatA > 0.001) {
    const ch = POSES.chat(q, frame, 1, 0.22, 2);
    const talk = sst(BEAT.turn0 + 8, BEAT.turn0 + 14, frame) * (1 - sst(BEAT.herChat - 2, BEAT.herChat + 3, frame)) + sst(BEAT.herChat + 12, BEAT.herChat + 18, frame);
    q = lerpPose(q, { ...ch, headYaw: q.headYaw, open: (ch.open ?? 0) * c01(talk) }, chatA);
  }
  return swayPose(q, frame, 1, 0);
};

/** the woman: seated facing the aisle, calm; she looks up at him when he turns to her, smiles and chats back */
export const womanPose = (frame: number): CovidPose => {
  const base = POSES.sit(-1);
  const idle: CovidPose = { ...base, headYaw: -0.86, pitch: 17, look: [-0.35, 0.8], mouth: 0.22 };
  const look: CovidPose = { ...base, headYaw: -0.92, pitch: -5, look: [-0.55, -0.45], mouth: 0.7, lean: base.lean - 10 };
  let q = lerpPose(idle, look, sst(BEAT.herLook0, BEAT.herLook1, frame));
  // her short answer (f140 -> f152), then a smile and a small nod: perfectly well
  const chatA = sst(BEAT.herChat - 6, BEAT.herChat + 6, frame);
  if (chatA > 0.001) {
    const ch = POSES.chat(q, frame, -1, 0.4, 5);
    const talk = sst(BEAT.herChat, BEAT.herChat + 4, frame) * (1 - sst(BEAT.herChat + 10, BEAT.herChat + 14, frame));
    q = lerpPose(q, { ...ch, headYaw: q.headYaw - 0.08, open: (ch.open ?? 0) * talk }, chatA * 0.8);
  }
  q = POSES.nod(q, c01((frame - (BEAT.herChat + 12)) / 16), 7);
  // her breath in, the chat going on (f126 -> f136, out again as she answers): the shoulders lift a touch, the chin up
  const inh = herInhale(frame);
  q = { ...q, crouch: q.crouch - 2.4 * inh, pitch: q.pitch - 2.5 * inh, open: Math.max(q.open ?? 0, 0.12 * inh) };
  return swayPose(q, frame, 0.5, 2);
};

/** user revision 2 (the note at this cut's f0): he is the lit one from the first frame: infected 0.6 at f0, full by f66
 *  (BEAT.glowFrom / glowFull keep the R1 values 34 / 84 for reference) */
export const GLOW_R2 = { start: 0.6, from: 0, full: 66 };
export const carrierInfected = (frame: number) => mix(GLOW_R2.start, 1, sst(GLOW_R2.from, GLOW_R2.full, frame));

/** the other passengers (all well, ordinary, no masks). The near elder is passed by the dolly; the left bench's sitters
 *  are seen in the wide and hide behind him once the camera lands; a girl on her phone further along the right bench
 *  and a man standing by the far end door stay in the landing two-shot, deep beyond the breath (it passes in front of
 *  them, clearly nearer: nobody but the woman is reached). */
export const othersAt = (frame: number): FigSpec[] => {
  const s = (side: "L" | "R", z: number) => seatNear(side, z);
  const L2 = s("L", -8);
  const L5 = s("L", 820);
  const L6 = s("L", 1280);
  const L4 = s("L", 1924);
  const R8 = s("R", 1648);
  const lookAround = (seed: number, amp: number) => amp * Math.sin(frame * 0.021 + seed);
  return [
    { kind: "elder", v: 1, uid: "l2", pose: swayPose({ ...POSES.sit(1), headYaw: 0.8 + lookAround(2, 0.1), pitch: 4 }, frame, 0.5, 13), X: L2.X, Z: L2.Z },
    { kind: "youth", v: 0, uid: "l5", pose: swayPose({ ...POSES.sit(1), pitch: 18, headYaw: 0.6, look: [0.2, 0.8] }, frame, 0.5, 7), X: L5.X, Z: L5.Z },
    { kind: "commuter", v: 3, uid: "l6", pose: swayPose({ ...POSES.sit(1), headYaw: 0.7 + lookAround(4, 0.1) }, frame, 0.5, 21), X: L6.X, Z: L6.Z },
    { kind: "elder", v: 2, uid: "l4", pose: swayPose(POSES.sit(1), frame, 0.5, 4), X: L4.X, Z: L4.Z },
    { kind: "youth", v: 2, uid: "r8", pose: swayPose({ ...POSES.sit(-1), pitch: 16, headYaw: -0.7, look: [0, 0.8], armR: { w: [38, -150], elbow: [0.3, 1], fist: 0.8, hand: -60 } }, frame, 0.5, 15), X: R8.X, Z: R8.Z, props: { hold: { R: "phone" } } },
    { kind: "commuter", v: 1, uid: "st", pose: swayPose({ ...POSES.turnTo(0.35), headYaw: 0.25 + lookAround(8, 0.12), pitch: 3 }, frame, 1, 19), X: 70, Z: 1975 },
  ];
};

// ===================================================================================================================
// THE SHARED AIR (user revision 1): no stream. Every exhale (his breathing, the laugh, the chat) adds to a faint warm
// haze round his head and shoulders that diffuses into the carriage's air with the sway (covidHaze); she sits inside its
// thin edge, breathes in (f126 -> f138) and her chest kindles from LONG (f138), driven by the frame.
// ===================================================================================================================
/** his mouth and breath direction at a frame, rig units from his feet (memoised: the haze asks for every puff) */
const MOUTH_MEMO = new Map<number, { m: P2; d: P2; c: P2 }>();
const carrierMouth = (f: number) => {
  let v = MOUTH_MEMO.get(f);
  if (!v) {
    const a = covidAnchors("carrier", carrierPose(f), [0, 0], 1, { variant: 0 });
    v = { m: a.mouth, d: a.mouthDir, c: a.headC };
    MOUTH_MEMO.set(f, v);
  }
  return v;
};
/** how much he breathes out at a frame: grows with the glow (barely at f0, full at LATENT), on the exhale of each
 *  breath, in bursts on the laugh (f40 -> f64), steadily while he talks (pausing while she answers) */
export const carrierShedAt = (f: number) => {
  const s = c01((carrierInfected(f) - 0.3) / 0.7);
  const shed = 0.08 + 0.92 * s ** 0.5;
  const lamt = sst(BEAT.laugh0, BEAT.laugh0 + 10, f) * (1 - sst(BEAT.laugh1 - 10, BEAT.laugh1, f));
  const talk = c01(sst(BEAT.turn0 + 8, BEAT.turn0 + 14, f) * (1 - sst(BEAT.herChat - 2, BEAT.herChat + 3, f)) + sst(BEAT.herChat + 12, BEAT.herChat + 18, f));
  let e = breathRhythm(f, 96, 0.4);
  e = mix(e, 0.7 + 0.3 * Math.abs(Math.sin((f * Math.PI) / 5)), lamt);
  e = mix(e, 0.62 + 0.38 * Math.sin(f * 0.45) ** 2, talk);
  // the laugh pushes more air out (ha-ha bursts)
  return Math.min(1, shed * e * (1 + 0.6 * lamt));
};
/** how hard his breath pushes out: quiet breathing, the laugh, talking to her (the talk carries his air across) */
export const carrierPushAt = (f: number) => {
  const lamt = sst(BEAT.laugh0, BEAT.laugh0 + 10, f) * (1 - sst(BEAT.laugh1 - 10, BEAT.laugh1, f));
  const talk = c01(sst(BEAT.turn0 + 8, BEAT.turn0 + 14, f) * (1 - sst(BEAT.herChat - 2, BEAT.herChat + 3, f)) + sst(BEAT.herChat + 12, BEAT.herChat + 18, f));
  return Math.max(0.3, 0.8 * lamt, 1.0 * talk);
};
/** user revision 2: the cloud a step stronger (covidHaze strength: veil cap 0.24 -> 0.34, motes 1.3x larger) */
export const HAZE_STRENGTH = 1.42;
/** the share of a figure's aura drawn over the figure (the rest of the light sits behind it, on the air) */
export const AURA_FRONT = 0.35;
/** the light behind each figure: 0.55 x height (AURA personR 0.40 x 1.375), centre alpha 0.75 (0.65 x 1.154) at full */
export const AURA_BACK = { rK: 0.55 / 0.4, aK: 0.75 / 0.65 };
/** her breath in (shoulders lift a touch while the chat goes on, just before she answers) */
export const herInhale = (f: number) => sst(BEAT.inhale0, BEAT.inhale1, f) * (1 - sst(BEAT.herChat, BEAT.herChat + 12, f));
/** her glow, from the frame: kindling from LONG (f138) after the breath in, ~0.36 by f156 */
export const womanInfected = (frame: number) => 0.36 * sst(BEAT.kindle0, BEAT.kindle1, frame);

// ===================================================================================================================
// THE SCENE (pure: the checks import it)
// ===================================================================================================================
export const sceneAt = (frame: number) => {
  const s = carriageSway(frame);
  const lc = latentCamAt(frame);
  const c0 = lc.cam;
  const cam: Cam = { ...c0, cy: c0.cy + s.bob / c0.k };
  const A = airWorldOf({ cam, rest: REST, depth: lc.depth, frame, scene: CARRIAGE_SCENE });
  // the woman
  const wq = womanPose(frame);
  const wAt = A.P.at(WOMAN_SEAT.X, WOMAN_SEAT.Z);
  const wA = covidAnchors("commuter", wq, wAt.at, wAt.scale, { variant: 2 });
  // the Carrier
  const cq = carrierPose(frame);
  const cAt = A.P.at(CARRIER_FEET.X, CARRIER_FEET.Z);
  const grip = A.P.p(GRIP3[0], GRIP3[1], GRIP3[2]);
  const cA = covidAnchors("carrier", cq, cAt.at, cAt.scale, { variant: 0, grip: { R: grip } });
  // the shared air: his haze in the carriage's 3D air (no target: it hangs round him, his feet the anchor); motes never ride his face or a far passenger's face, and
  // her breath in draws the motes near her mouth in
  const FX = CARRIER_FEET.X;
  const FZ = CARRIER_FEET.Z;
  const em: HazeEmitter = { opts: { strength: HAZE_STRENGTH }, project: (u) => ({ p: A.P.p(FX + u[0], u[1], FZ + u[2]), s: A.P.r(FZ + u[2]) }), mouthAt: (f) => carrierMouth(f).m, centreAt: (f) => carrierMouth(f).c, dirAt: (f) => carrierMouth(f).d, amountAt: carrierShedAt, pushAt: carrierPushAt, seed: 3.1 };
  const avoid: HazeAvoid[] = [
    { c: cA.headC, r: 30 * cAt.scale, layer: "front" },
    { c: wA.headC, r: 30 * wAt.scale, layer: "all" },
  ];
  for (const o of othersAt(frame)) {
    const pa = A.P.at(o.X, o.Z);
    // the far passengers: no mote on a face or a body (a glint on a coat would read as a glow)
    const oa = covidAnchors(o.kind, o.pose, pa.at, pa.scale, { variant: o.v });
    avoid.push({ c: oa.headC, r: 46 * pa.scale, layer: "all" }, { c: oa.chest, r: 60 * pa.scale, layer: "all" }, { c: oa.hip, r: 55 * pa.scale, layer: "all" });
  }
  const haze = hazeAt([em], frame, { avoid, below: cam.cy + (1050 - 960) / cam.k, sinks: [{ c: wA.mouth, r: 60 * cAt.scale, pull: (f) => sst(BEAT.inhale0, BEAT.inhale1 + 4, f), from: BEAT.inhale0 }] });
  // the light the virus throws (user revision 2, covidAura): round his chest from f0 (infected 0.3) growing with the
  // glow; round hers as she kindles from LONG
  const hisInf = carrierInfected(frame);
  const herInf = womanInfected(frame);
  // the hero's split (director, U2 review): the light BEHIND each of them larger and a touch stronger (0.55 x height,
  // centre alpha 0.75 at full: a soft rim round head, shoulders and arms against the air), the share over them
  // AURA_FRONT of the standard aura
  const hisAura = auraFor("carrier", cq, cAt.at, cAt.scale, hisInf, { variant: 0, grip: { R: grip } });
  const herAura = auraFor("commuter", wq, wAt.at, wAt.scale, herInf, { variant: 2 });
  const hisBack = auraFor("carrier", cq, cAt.at, cAt.scale, hisInf, { variant: 0, grip: { R: grip }, ...AURA_BACK });
  const herBack = auraFor("commuter", wq, wAt.at, wAt.scale, herInf, { variant: 2, ...AURA_BACK });
  return { cam, A, cq, cAt, cA, grip, wq, wAt, wA, haze, herInf, hisInf, hisAura, herAura, hisBack, herBack };
};

const figItem = (A: AirWorld, f: FigSpec, frame: number, camK: number, extra?: React.ReactNode): StageItem => {
  const { at, scale } = A.P.at(f.X, f.Z);
  const [sw, sd] = f.shadow ?? [58, 34];
  return {
    Z: f.Z,
    key: f.uid,
    node: (
      <g>
        <AirShadow A={A} X={f.X} Z={f.Z} w={sw} d={sd} uid={`${f.uid}sh`} amt={0.75} />
        <CovidFigure kind={f.kind} variant={f.v} pose={f.pose} at={at} scale={scale} uid={f.uid} fog={A.folkFog(f.Z)} unitPx={camK} frame={frame} glowStyle={GLOW_STYLE} {...f.props} />
        {extra}
      </g>
    ),
  };
};

const LatentLongEnough: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const S = sceneAt(frame);
  const { A, cam } = S;
  const figs: FigSpec[] = [
    ...othersAt(frame),
    { kind: "commuter", v: 2, uid: "wom", pose: S.wq, X: WOMAN_SEAT.X, Z: WOMAN_SEAT.Z, props: { infected: S.herInf } },
    { kind: "carrier", v: 0, uid: "car", pose: S.cq, X: CARRIER_FEET.X, Z: CARRIER_FEET.Z, props: { infected: S.hisInf, grip: { R: S.grip }, hold: { L: "phone" }, carry: "none" } },
  ];
  // the haze round him: the part behind him just behind his depth (over the woman, deeper), the part in front after him
  const items = figs.map((f) => figItem(A, f, frame, cam.k));
  const hz = CARRIER_FEET.Z;
  items.push({ Z: hz + 1, key: "hazeB", node: <HazeCloud haze={S.haze} layer="back" uid="hzb" fog={A.folkFog(hz)} /> });
  items.push({ Z: hz - 1, key: "hazeF", node: <HazeCloud haze={S.haze} layer="front" uid="hzf" fog={A.folkFog(hz)} /> });
  // the auras (AURA_READY's close-up split): the light behind each figure at full (it lights the air round them), and a
  // share of it over the figure (AURA_FRONT: it spills onto them, while the lungs keep their contrast)
  const front = (q: typeof S.hisAura) => ({ ...q, a: q.a * AURA_FRONT });
  // the light fades out between screen rows 960 and 1070 (the caption bands start at 1080)
  const fb: [number, number] = [cam.cy + (960 - 960) / cam.k, cam.cy + (1070 - 960) / cam.k];
  items.push({ Z: hz + 0.5, key: "auraCb", node: <AuraGlow aura={S.hisBack} uid="aurcb" fog={A.folkFog(hz)} fadeBelow={fb} /> });
  items.push({ Z: hz - 0.5, key: "auraCf", node: <AuraGlow aura={front(S.hisAura)} uid="aurcf" fog={A.folkFog(hz)} fadeBelow={fb} /> });
  items.push({ Z: WOMAN_SEAT.Z + 0.5, key: "auraWb", node: <AuraGlow aura={S.herBack} uid="aurwb" fog={A.folkFog(WOMAN_SEAT.Z)} fadeBelow={fb} /> });
  items.push({ Z: WOMAN_SEAT.Z - 0.5, key: "auraWf", node: <AuraGlow aura={front(S.herAura)} uid="aurwf" fog={A.folkFog(WOMAN_SEAT.Z)} fadeBelow={fb} /> });
  return (
    <AbsoluteFill>
      <AirStage v={A.v} bloom={0.22} shafts={0}>
        <WorldSvg cam={cam}>
          <CarriageStage A={A} frame={frame} items={items} hidePoles={HIDE_POLES} hideStraps={HIDE_STRAPS} />
        </WorldSvg>
      </AirStage>
    </AbsoluteFill>
  );
};

export default LatentLongEnough;
