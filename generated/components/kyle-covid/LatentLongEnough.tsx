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
// nobody reacts (he reads on, a small amused nod f90 -> f108). On FOR (f102 -> f122) he lowers the phone, turns his head to her and chats, and she leans in; a soft
// cone of tiny orange specks leaves his mouth (born from f108, full by f118; the cast's breathSpecks rule copied here so
// each speck knows when it reaches her) and drifts across, arcing over the deep aisle (in front of the far passengers,
// touching nobody), into her face. Contact: the first specks reach her at f138 (LONG); first reaction: her chest
// kindles from the specks breathed in (visible ~f142, infected 0.36 by f156; derived from the arrivals, not a timer).
// She answers (f140 -> f152), then smiles and nods: perfectly well. f146 -> f160: a settled living hold (him talking,
// her smiling, the train swaying, the tunnel lights).
// Orange = THE VIRUS only (the clip's ORANGE RULE): his lung glow, the breathed specks, her kindling glow; everything
// else in the carriage's and the cast's muted local colours.
//
// DEPTH: the carriage's set, light and camera grammar (CARRIAGE_DEPTH dRef 700 at kRef 2, dolly 0.5, CARRIAGE_SCENE:
// fog by the eye's distance, mood interior), the eye height moving with the dolly (latentCamAt). Exported for cut 12:
// POLE (the centre aisle pole, Z 330), CARRIER_FEET (X -60, facing right, far hand on the pole: GRIP3), WOMAN_SEAT
// (right bench Z 452), HIDE_POLES / HIDE_STRAPS (CarriageStage hidePoles / hideStraps: the near pair, the left row behind
// his head, the nearer right poles between them), latentCamAt(f) and LANDING (the f84 camera). Passengers (all well, no
// masks): an elder near the camera on the left bench (passed by the dolly), three sitters deeper down the left bench
// (seen in the wide, behind him once the camera lands), a girl on her phone further along the right bench (Z 1648) and a
// man standing by the far end door (Z 1975); the breath passes in front of the last two, far nearer than they are.
//
// REVIEW 2: his phone is held low at belly height (the upper arm down his near side, the forearm below the lungs), so
// both lung lobes and the windpipe show whole on every frame; the Carrier wears no backpack in cuts 3 and 21 (the
// director's decision: the straps made the glow read as a bib); he stays recognisable by the red beanie and the cream
// puffer. The exported staging constants are unchanged.
//
// SOURCES: none (no real figures; the latency fact is the speaker's).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirShadow, AirStage, WorldSvg, airWorldOf, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { hash } from "../kits/maps/incaShared";
import { CARRIAGE_DEPTH, CARRIAGE_SCENE, CarriageStage, NEAR_POLES, carriageSway, polePoint, polesOf, seatNear, swayPose, type Pole, type StageItem } from "./covidCarriage";
import { BreathSpecks, CovidFigure, POSES, covidAnchors, lerpPose, type CovidFigureProps, type CovidKind, type CovidPose, type P2, type Speck } from "./covidFolk";

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
  return swayPose(q, frame, 0.5, 2);
};

export const carrierInfected = (frame: number) => mix(0.3, 1, sst(BEAT.glowFrom, BEAT.glowFull, frame));

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
// THE BREATH: the cast's breathSpecks rule (copied, so each speck knows when it reaches her: it is breathed IN there,
// fading into her mouth, and the arrivals kindle her chest)
// ===================================================================================================================
/** the breath (finalise: the specks 1.4x larger and 1.5x as many as review 2 for phone size: rate 1.9 -> 2.85, size 1.4) */
const BR = { rate: 2.85, life: 62, reach: 250, spread: 0.42, seed: 0.15, arc: 0.3, size: 1.4 };
type BreathFrame = { specks: Speck[]; arrived: number };
const breathAmount = (birth: number) => sst(BEAT.breath0, BEAT.breathFull, birth);
/** the specks at a frame from his mouth to her mouth (world px), and the weighted count of specks that have reached her */
export const breathAt = (frame: number, mouth: P2, dir: P2, scale: number, target: P2): BreathFrame => {
  const { rate, life, spread, seed } = BR;
  const reach = BR.reach * scale;
  const nrm: P2 = [-dir[1], dir[0]];
  const out: Speck[] = [];
  const tLen = Math.hypot(target[0] - mouth[0], target[1] - mouth[1]);
  const i0 = Math.floor((BEAT.breath0 - 2) * rate);
  const i1 = Math.floor(frame * rate);
  let arrived = 0;
  for (let i = i0; i <= i1; i++) {
    const birth = i / rate;
    const age = frame - birth;
    if (age < 0) continue;
    const h1 = hash(i + 7.3, 31 + seed);
    const h2 = hash(i + 1.9, 47 + seed);
    const h3 = hash(i + 4.1, 59 + seed);
    const amt = c01(breathAmount(birth));
    if (amt <= 0.003) continue;
    const puff = 0.3 + 0.7 * Math.max(0, Math.sin((birth / (3.4 * 29.97)) * 2 * Math.PI + seed)) ** 0.6;
    if (h3 > 0.25 + 0.75 * puff) continue;
    const u = Math.min(1, age / life);
    const s = reach * (0.82 + 0.36 * h2) * (1 - (1 - u) ** 1.7);
    const v = Math.min(1, (s / Math.max(1, tLen)) * 1.05);
    // breathed in: once it reaches her (v 1) it fades out over a few frames; it counts toward her glow
    const inhaled = sst(0.9, 1, v);
    arrived += amt * inhaled;
    if (age > life) continue;
    const th = spread * (2 * h1 - 1) * (0.55 + 0.45 * u);
    const sway = 6 * scale * Math.sin(age * 0.05 + h1 * 6.28) * u;
    const free: P2 = [mouth[0] + dir[0] * s * Math.cos(th) + nrm[0] * s * Math.sin(th) + sway * nrm[0], mouth[1] + dir[1] * s * Math.cos(th) + nrm[1] * s * Math.sin(th) - 8 * scale * u * u + sway * nrm[1]];
    const C: P2 = [mix(mouth[0], target[0], 0.7), Math.min(mouth[1], target[1]) - BR.arc * tLen];
    const bz: P2 = [(1 - v) * (1 - v) * mouth[0] + 2 * (1 - v) * v * C[0] + v * v * target[0], (1 - v) * (1 - v) * mouth[1] + 2 * (1 - v) * v * C[1] + v * v * target[1]];
    const lat = s * Math.sin(th) * (1 - v) * 0.9;
    const path: P2 = [bz[0] + nrm[0] * lat + sway * nrm[0] * (1 - v), bz[1] + nrm[1] * lat + sway * nrm[1] * (1 - v)];
    const w = sst(0, 0.3, u);
    const p: P2 = [free[0] + (path[0] - free[0]) * w, free[1] + (path[1] - free[1]) * w];
    const r = BR.size * Math.max(0.9, (1.0 + 1.1 * h2) * scale * (1 - 0.3 * u)) * (1 - 0.5 * inhaled);
    const a = amt * sst(0, 0.06, u) * (1 - u) ** 0.6 * (0.65 + 0.35 * h1) * (1 - inhaled);
    if (a > 0.01) out.push({ p, r, a });
  }
  return { specks: out, arrived };
};
/** her glow from the specks she has breathed in (cause before effect): ~0.35 by f158 */
/** the arrivals that bring her to full kindle (scaled with the speck rate so her kindle keeps its timing) */
const HER_FULL = 24 * (BR.rate / 1.9);
export const womanInfected = (arrived: number) => 0.36 * sst(0, 1, arrived / HER_FULL);

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
  const target: P2 = [mix(wA.mouth[0], wA.headC[0], 0.12), mix(wA.mouth[1], wA.headC[1], 0.05)];
  const br = breathAt(frame, cA.mouth, cA.mouthDir, cAt.scale, target);
  return { cam, A, cq, cAt, cA, grip, wq, wAt, wA, br, herInf: womanInfected(br.arrived), hisInf: carrierInfected(frame) };
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
        <CovidFigure kind={f.kind} variant={f.v} pose={f.pose} at={at} scale={scale} uid={f.uid} fog={A.folkFog(f.Z)} unitPx={camK} frame={frame} {...f.props} />
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
  // the breath is drawn with the woman's item when she is in front (she sits deeper, Z 360: it goes with the Carrier)
  const items = figs.map((f) => figItem(A, f, frame, cam.k, f.uid === "car" && S.br.specks.length ? <BreathSpecks specks={S.br.specks} uid="carbr" fog={A.folkFog(f.Z)} /> : undefined));
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
