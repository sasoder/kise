// ---------------------------------------------------------------------------
// SickPrettyQuick (kyle-covid, cut 12). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 82 frames.
// The metro carriage (covidCarriage, the interior medium) with the modern gouache cast (covidFolk), both imported
// read-only; cut 3's staging constants imported from LatentLongEnough (read-only); the kit kits/dwarkesh-3d/dwarkesh3d.
//
// CHECK LINE: "This man caught it and got obviously sick almost at once — so everyone around him could see exactly who
// was ill and keep away."
//
// THE LINE: "[Like the first COVID, SARS-CoV-1, 2003, slightly more virulent. And] in fact, it was just more virulent
// enough that it made you sick pretty quick." (then, on the speaker: "And just that little difference was enough to
// contain it because you could figure out who was sick.")
// WORD -> FRAME (f0 = 12.6793 s): in 2 · fact 4 · it 7 · was 10 · just 11 · more 16 · VIRULENT 23 · enough 30 · that 38 ·
// it 43 · made 46 · you 49 · SICK 52 · pretty 58 · QUICK 65 · (And 79)
// DURATION: the slot 12.679 -> 15.415 s = 2.736 s x 29.97 = 82 frames (f0..f81).
//
// THE MOTION (review 1 applied): cut 3's place and camera grammar, the opposite outcome. f0 is cut 3's LANDING camera
// exactly: at the centre aisle pole (cut 3's POLE, Z 330) stands the Officer (the SARS-1 man, covidFolk Round 4's
// variant 3: in shirtsleeves, white shirt, dark-teal tie, belt) where cut 3's Carrier stood (CARRIER_FEET, the FAR hand
// on GRIP3, the body turned toward us, yaw 0.62, so both lungs show), pleasant, his near hand low at his trouser pocket,
// an orange glow already in his lungs (infected 0.6). On VIRULENT the glow flares to full (f15 -> f28), his face pales
// (sick 0 -> 1 by f58) and his near hand goes to his forehead (f17 -> f27); he coughs twice into his fist (f36, f43;
// the cast's elbow cough flips the forearm as it passes horizontal) and lets go of the pole (f38 -> f47). THE SINK
// (f35 -> f61): one soft continuous fold back onto the left bench seat right behind him (the nearest seat: the right
// bench is ~1.4 m away past the pole, four steps; the director allowed the nearest seat): the hips travel back and down
// together, the knees bend because the feet stay planted (each foot one step back, the near foot f40 -> f51, the far
// foot f44 -> f56, solved through rigPose's seated-foot rule), the body leans forward a little on the way down, his
// near hand on his thigh; no crouch. Seated by ~f58 (SICK 52 mid-sink), slumped at yaw 0.62 and breathing heavily from
// QUICK on, both hands low in his lap, both lungs and the windpipe glowing whole. The neighbours: the woman across the
// aisle (cut 3's seat) looks up as his hand goes to his forehead, then leaves the frame as the camera moves to him; the
// woman on his bench (the seat beside his, Z 452) is in view from ~f21, looks at him, gets up on the first cough
// (f36 -> f47) at his left, a hand to her mouth (f39 -> f48), and steps off into the aisle (f42 -> f64), passing behind
// him while he sinks (f47 -> f53: her seat is behind his on screen, so her way into the aisle must cross behind him),
// and stands leaning away, watching him; the passengers deeper down the carriage turn and lean away. NO orange leaves
// his body (no breath specks; nobody kindles): the virus stays in the one man everyone can see is ill. f62 -> f81: a
// settled living hold (his heavy breath, her watching, the sway, the tunnel lights, a slow camera creep).
// Cause -> effect: his hand to his forehead (f17 -> f27) -> the woman across looks up (f24); his first cough (f36) ->
// the woman beside him gets up (f36).
// THE CAMERA: one eased move from LANDING (smootherstep on a clock started 14 frames before f0, so it is under way on
// the first frame; peak speed ~f32): a truck left that brings him to the middle of the frame for the coughs and follows
// him into the seat (cx 43 -> -104), a gentle push-in (k 7.19 -> 7.91) and the horizon row rising (766 -> 572) so his
// slumped head stays high (head ~y 530, the lungs ~y 800, the hands ~y 1030 at the end); a slow creep to the last frame.
// Orange = THE VIRUS only (the clip's ORANGE RULE): his lung glow and nothing else; the cast's and carriage's muted
// local colours everywhere else (her puffer is the cast's muted red-brown).
//
// DEPTH: the carriage's set and grammar (CARRIAGE_DEPTH dRef 700 at kRef 2, dolly 0.5, CARRIAGE_SCENE: fog by the
// eye's distance, mood interior), cut 3's landing eye (-212) easing to -206; cut 3's HIDE_POLES / HIDE_STRAPS. The
// Officer X -60 -> his seat X -182 at Z 330; the woman across at the right bench Z 452; the woman beside him at the
// left bench Z 452 -> standing X -60; the deep passengers at the right bench Z 1648, the left bench Z 1280 and by the
// far door (Z 1975).
//
// SOURCES: none on screen. The fact behind the picture (SARS-1 spread mostly after symptoms showed, so the sick could
// be found and isolated): Peiris et al., Lancet 2003; WHO, 2003 (from the brief).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirShadow, AirStage, WorldSvg, airWorldOf, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CARRIAGE_SCENE, CarriageStage, carriageSway, seatNear, swayPose, type StageItem } from "./covidCarriage";
import { CovidFigure, POSES, WALK_CYCLE, covidAnchors, covidGripTo, lerpPose, rigPose, seatFootX, sitBack, sitDown, type CovidFigureProps, type CovidKind, type CovidPose, type P2 } from "./covidFolk";
import { CARRIER_FEET, GRIP3, HIDE_POLES, HIDE_STRAPS, LANDING, POLE, latentCamAt } from "./LatentLongEnough";

export const FPS = 30000 / 1001;
export const DURATION = 82;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** smootherstep (zero velocity and acceleration at both ends) */
const sst5 = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// ===================================================================================================================
// CUT 3'S STAGING (imported, asserted): the same centre aisle pole, the same stance, the same camera grammar
// ===================================================================================================================
const L84 = latentCamAt(84);
if (Math.abs(L84.cam.k - LANDING.cam.k) > 1e-9 || Math.abs(L84.cam.cx - LANDING.cam.cx) > 1e-9 || Math.abs(L84.cam.cy - LANDING.cam.cy) > 1e-9) throw new Error("SickPrettyQuick: cut 3's LANDING camera changed");
if (CARRIER_FEET.Z !== POLE.Z || GRIP3[0] !== POLE.X || GRIP3[2] !== POLE.Z) throw new Error("SickPrettyQuick: cut 3's pole staging changed");

// ===================================================================================================================
// THE CAMERA: f0 = cut 3's landing camera exactly; one eased move (truck left with him, a gentle push-in, the eye's
// horizon row rising so his head stays high as he sits)
// ===================================================================================================================
/** the horizon (vanishing point) row of cut 3's landing */
const HR0 = 960 - (LANDING.cam.cy - LANDING.depth.eyeY) * LANDING.cam.k;
export const CAM_KEYS = {
  k0: LANDING.cam.k,
  cx0: LANDING.cam.cx,
  eye0: LANDING.depth.eyeY,
  hr0: HR0,
  k1: 7.75,
  cx1: -100,
  eye1: -206,
  hr1: 572,
  kCreep: 0.02,
  cxCreep: -4,
  /** the move runs f0 -> fEnd (smootherstep on a biased clock: the velocity peaks as he sinks, ~f46) */
  fEnd: 80,
  pre: 14,
  bias: 1.0,
};
const camE = (f: number) => {
  const K = CAM_KEYS;
  // the clock starts K.pre frames before f0, so the move is already under way (gently) on the first frame
  const at = (g: number) => sst5(0, 1, c01((g + K.pre) / (K.fEnd + K.pre)) ** K.bias);
  return (at(f) - at(0)) / (1 - at(0));
};
export const camAt = (f: number): { cam: Cam; depth: DepthOpts } => {
  const K = CAM_KEYS;
  const e = camE(f);
  // plus a slow creep over the whole cut (log-zoom and a little sideways), so the last frames never stand still
  const u = f / (DURATION - 1);
  const k = Math.exp(mix(Math.log(K.k0), Math.log(K.k1), e) + K.kCreep * u);
  const eyeY = mix(K.eye0, K.eye1, e);
  const hr = mix(K.hr0, K.hr1, e);
  const cx = mix(K.cx0, K.cx1, e) + K.cxCreep * u;
  return { cam: { k, cx, cy: eyeY + (960 - hr) / k }, depth: { ...LANDING.depth, eyeY } };
};
const REST = camAt(0).cam;

// ===================================================================================================================
// THE BEATS (frames; f0 = 12.679 s)
// ===================================================================================================================
export const BEAT = {
  /** VIRULENT 23: the glow flares, the face pales, the near hand to the forehead */
  flare0: 15,
  flare1: 28,
  pale0: 16,
  brow0: 17,
  brow1: 27,
  /** the cough (two coughs): the hand from the forehead to the mouth (the cast's fist cough: its elbow cough flips the
   *  forearm as it passes horizontal) */
  elbow0: 30,
  elbow1: 35,
  cough1At: 36,
  cough2At: 43,
  /** the far hand lets go of the pole; one soft sink back onto the seat, the near foot then the far foot stepping
   *  back (SICK 52 mid-sink, seated by ~f58) */
  let0: 38,
  let1: 47,
  body0: 35,
  body1: 61,
  step0: 40,
  step1: 56,
  /** sick 1 by f58; the near hand from the mouth to his thigh (braced, doubled over), then into his lap */
  sick1: 58,
  thigh0: 41,
  thigh1: 54,
  knee0: 57,
  knee1: 69,
  /** the neighbours notice (the first cough) and lean away */
  notice: 34,
  away0: 38,
  away1: 58,
  /** the woman on his bench: gets up on his first cough, a hand to her mouth, steps off into the aisle (one move with
   *  the rise) and stands watching him */
  rise0: 36,
  rise1: 47,
  mouth0: 39,
  mouth1: 48,
  walk0: 42,
  walk1: 64,
};

// ===================================================================================================================
// THE OFFICER: at cut 3's pole (CARRIER_FEET, the far hand on GRIP3), sickens and sinks back onto the left bench
// ===================================================================================================================
type Arm = CovidPose["armL"];
const lerpArm = (a: Arm, b: Arm, t: number): Arm => ({ w: [mix(a.w[0], b.w[0], t), mix(a.w[1], b.w[1], t)], elbow: [mix(a.elbow[0], b.elbow[0], t), mix(a.elbow[1], b.elbow[1], t)], fist: mix(a.fist, b.fist, t), hand: mix(a.hand, b.hand, t) });
type HT = "mouth" | "chest" | "lap" | "knee" | "elbowMouth" | "forehead";
/** the arm the cast would solve for a hand target on this body pose (rigPose's handTo at amt 1) */
const armTo = (q: CovidPose, side: "L" | "R", to: HT): Arm => {
  const r = rigPose("officer", OFFICER_V, { ...q, handTo: side === "L" ? { L: { to, amt: 1 } } : { R: { to, amt: 1 } } });
  return side === "L" ? r.armL : r.armR;
};
/** his seat: the left bench right behind him (the nearest seat), the hips a little in from the front edge */
export const OFFICER_SEAT = { X: -182, Z: POLE.Z };
/** THE Officer in shirtsleeves (covidFolk Round 4, variant 3: v0's face, white shirt, dark-teal tie, belt, no jacket):
 *  the director's choice for cut 12, so both lungs read whole at phone size */
export const OFFICER_V = 3;
const HOLD = POSES.standHold(1, "pole", "far");
const SEATED_YAW = 0.62;
const STAND_YAW = 0.62;
/** the officer's thigh (rig units: covidFolkBody MAN.leg[0]) for rigPose's seated-foot rule */
const SEAT_LEG0 = 69;
/** the seated feet's offsets from the hips (rigPose's seated rule on the slump at SEATED_YAW), set a little further
 *  forward (+16..20 units: a sick man's legs slide out a little; the feet step back less) */
const SEATED_FEET = (() => {
  const r = rigPose("officer", OFFICER_V, { ...POSES.slump(1, 0), yaw: SEATED_YAW });
  return { L: r.footL[0] + 20, R: r.footR[0] + 16 };
})();
/** the cough jolts (two coughs): 0..1 */
const jolt = (f: number) => {
  const one = (c: number) => (f < c ? sst(c - 3, c, f) : 1 - sst(c, c + 6, f));
  return Math.max(one(BEAT.cough1At), one(BEAT.cough2At));
};
/** the body's path hold -> doubled over -> seated: s 0..1 */
const bodyS = (f: number) => sst5(BEAT.body0, BEAT.body1, f);
export const officerAt = (frame: number) => {
  const f = frame;
  const s = bodyS(f);
  const sit = sst(0.08, 1, s);
  const pale = sst(BEAT.pale0, BEAT.sick1, f);
  const flareT = sst(BEAT.flare0, BEAT.flare1, f);
  const brow = sst(BEAT.brow0, BEAT.brow1, f);
  const j = jolt(f);
  // the slumped seat (heavy breathing)
  const t = f / 29.97;
  const br = Math.sin((t / 1.35) * 2 * Math.PI);
  const seated: CovidPose = { ...POSES.slump(1, f), yaw: SEATED_YAW, headYaw: 0.66, lean: 13 + 1.6 * br, pitch: 20 - 2 * br, hunch: 0.78 - 0.1 * br, crouch: -1.1 * br };
  // standing: the hold, a pleasant face, the near hand resting at the jacket's pocket (clear of the chest)
  const glance = sst(0, 14, f);
  // the body turned a little more toward us than the cast's hold (yaw 0.62, not 0.78): both lungs show at f0
  const stand: CovidPose = { ...HOLD, yaw: STAND_YAW, headYaw: mix(0.62, 0.72, glance), pitch: mix(1, 3, glance), look: [mix(0.15, 0.35, glance), 0.15], mouth: 0.22, armL: { w: [-8, -158], elbow: [-0.45, 1], fist: 0.45, hand: 8 } };
  // VIRULENT: the head bows into the hand, the shoulders rise
  const ill: CovidPose = { ...stand, pitch: 3 + 9 * brow, look: [0.2, 0.55 * brow], mouth: mix(0.22, 0.1, brow), hunch: 0.35 * brow, worry: brow };
  // THE SINK: one soft continuous fold from the standing hold into the seat (no deep crouch): the hips travel back and
  // down together (the knees bend because the feet stay planted), the body leans forward a little on the way down
  // (the counterweight of a real sit-down) and settles into the slump
  let q = lerpPose(ill, seated, sit);
  q = { ...q, lean: q.lean + 9 * Math.sin(Math.PI * s), pitch: q.pitch + 4 * Math.sin(Math.PI * s) };
  // the cough jolts
  q = { ...q, lean: q.lean + 4 * j, pitch: q.pitch + 7 * j, crouch: q.crouch + 2.5 * j, open: Math.max(q.open ?? 0, 0.85 * j), lids: Math.max(q.lids, 0.4 * j) };
  // the hips' path to the seat (X -60 -> OFFICER_SEAT.X), a little ahead of the sit so they are over the seat when low
  const X = mix(CARRIER_FEET.X, OFFICER_SEAT.X, sst(0, 0.96, s));
  // THE FEET: each foot's standing place is planted in the world except during its one step back (near foot first);
  // the pose's foot offsets are solved through rigPose's seated-foot rule (mapped = o + sit (fx + c - 0.7 o)) so the
  // drawn feet land exactly there
  const stepL = sst(BEAT.step0, BEAT.step0 + 11, f);
  const stepR = sst(BEAT.step0 + 4, BEAT.step1, f);
  const asn = Math.abs(Math.sin(q.yaw));
  const fxS = SEAT_LEG0 * mix(0.32, 1, asn) * 0.93;
  const cL = -4 * (1 - asn);
  const cR = 4 * (1 - asn);
  const PL = mix(CARRIER_FEET.X + HOLD.footL[0], OFFICER_SEAT.X + SEATED_FEET.L, stepL);
  const PR = mix(CARRIER_FEET.X + HOLD.footR[0], OFFICER_SEAT.X + SEATED_FEET.R, stepR);
  const solve = (P: number, c: number) => (P - X - sit * (fxS + c)) / (1 - 0.7 * sit);
  const liftL = Math.sin(Math.PI * stepL) * 10;
  const liftR = Math.sin(Math.PI * stepR) * 10;
  q = { ...q, footL: [solve(PL, cL), (HOLD.footL[1] - liftL) / (1 - 0.7 * sit)], footR: [solve(PR, cR), (HOLD.footR[1] - liftR) / (1 - 0.7 * sit)] };
  // THE ARMS. Near (L): pocket -> forehead -> the fist at the mouth (the coughs) -> braced on his thigh -> his lap once seated. Far (R): the pole -> his lap.
  const kneeL = armTo(q, "L", "knee");
  const thighL: Arm = { ...kneeL, w: [kneeL.w[0] - 10, kneeL.w[1] - 36] };
  // to the forehead the wrist rises along the near side of the chest (a quadratic arc) and quickly (10 frames), so it
  // crosses the glow only for a moment
  const fore = armTo(q, "L", "forehead");
  const toFore = lerpArm(q.armL, fore, brow);
  const side: P2 = [Math.min(q.armL.w[0], fore.w[0]) - 20, (q.armL.w[1] + fore.w[1]) / 2];
  const bz = (a: number, c: number, b: number, t: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  toFore.w = [bz(q.armL.w[0], side[0], fore.w[0], brow), bz(q.armL.w[1], side[1], fore.w[1], brow)];
  const nearA = lerpArm(lerpArm(lerpArm(toFore, armTo(q, "L", "mouth"), sst(BEAT.elbow0, BEAT.elbow1, f)), thighL, sst(BEAT.thigh0, BEAT.thigh1, f)), armTo(q, "L", "lap"), sst(BEAT.knee0, BEAT.knee1, f));
  // the far hand, let go: forward on his thigh (in front of the body, below the lungs) as he sinks, into
  // his lap as he sits
  const lapR = armTo(q, "R", "lap");
  const farFree = lerpArm({ ...lapR, w: [lapR.w[0] + 42, lapR.w[1] - 30] }, lapR, sst(0.5, 1, sit));
  // while he holds the pole the far hand keeps the cast's gripping fist (the wrist itself is solved onto GRIP3 in sceneAt)
  const rel = sst(BEAT.let0, BEAT.let1, f);
  const gripArm = HOLD.armR;
  const farA: Arm = { ...farFree, elbow: [mix(gripArm.elbow[0], farFree.elbow[0], rel), mix(gripArm.elbow[1], farFree.elbow[1], rel)], fist: mix(gripArm.fist, farFree.fist, rel), hand: mix(gripArm.hand, farFree.hand, rel) };
  q = { ...q, armL: nearA, armR: farA, handTo: undefined };
  const sw = mix(1, 0.45, sit);
  q = swayPose(q, f, sw, 0);
  return { pose: q, X, Z: CARRIER_FEET.Z, release: rel, infected: mix(0.6, 1, flareT), sick: pale };
};

// ===================================================================================================================
// THE NEIGHBOURS (all well; they notice on the first cough and lean away)
// ===================================================================================================================
export type FigSpec = { kind: CovidKind; v: number; pose: CovidPose; X: number; Z: number; props?: Partial<CovidFigureProps>; uid: string; shadow?: [number, number] };
const NB_INKS = { top: "#7E4E44", top2: "#6C433A" };
export const othersAt = (frame: number): FigSpec[] => {
  const f = frame;
  const s = (side: "L" | "R", z: number) => seatNear(side, z);
  const R452 = s("R", 452);
  const R1648 = s("R", 1648);
  const L1280 = s("L", 1280);
  const look = sst(BEAT.notice, BEAT.notice + 6, f);
  const away = (d: number) => sst(BEAT.away0 + d, BEAT.away1 + d, f);
  const drift = (seed: number, amp: number) => amp * Math.sin(f * 0.021 + seed);
  // across the aisle: the woman with the coffee cup (cut 3's seat): looks up at the cough, leans away to the window
  const look1 = sst(BEAT.brow0 + 7, BEAT.brow0 + 14, f);
  const r1base: CovidPose = { ...POSES.sit(-1), headYaw: mix(-0.6, -0.95, look1), pitch: mix(14, 2, look1), look: [mix(-0.1, -0.6, look1), mix(0.7, 0, look1)], worry: look1, armR: { w: [40, -150], elbow: [0.3, 1], fist: 0.8, hand: -60 }, armL: { w: [30, -146], elbow: [-0.2, 1], fist: 0.6, hand: -40 } };
  const r1 = POSES.leanAway(r1base, sst(BEAT.cough1At - 4, BEAT.cough1At + 12, f), 1, "none");
  // his bench, the next seat along: the woman rises as he backs onto the seat beside her (feet planted: sitDown
  // reversed), her far hand over her mouth, steps off into the aisle (a short walk, at advancing with the phase) and
  // stands leaning away, looking back at him
  const nbSeat = seatNear("L", 452);
  const NB: [CovidKind, number] = ["parent", 0];
  const rise = sst(BEAT.rise0, BEAT.rise1, f);
  // she sits turned a little toward the carriage's end (yaw 0.55: her knees stay hidden behind him at f0, no sliver at
  // the frame's edge); her feet go forward fxN units on that yaw, the standing place is that far in front of the seat
  const NB_YAW = 0.5;
  // her puffer in a muted red-brown (the cast's elder v1 coat colour): she separates from his grey suit
  const fxN = seatFootX(NB[0], NB[1], NB_YAW);
  const backN = (t: number) => (sitBack(t, NB[0], NB[1]) / seatFootX(NB[0], NB[1])) * fxN;
  const Xs = nbSeat.X + fxN;
  const WALK_SPEED = 1.9;
  const wAmt = (g: number) => sst(BEAT.walk0, BEAT.walk0 + 6, g) * (1 - sst(BEAT.walk1 - 7, BEAT.walk1, g));
  // the walk starts at phase 0.25 (both feet under her: the left planted, the right mid-swing), so it blends in from
  // the risen stance without a skate
  let phase = 0.25;
  for (let g = BEAT.walk0; g < f; g++) phase += (WALK_SPEED * wAmt(g + 0.5)) / WALK_CYCLE;
  const wa = wAmt(f);
  const cover = sst(BEAT.mouth0, BEAT.mouth1, f);
  const watch = { headYaw: -0.12, pitch: 1, look: [-0.85, 0.05] as P2, worry: 1 };
  const seatedN: CovidPose = { ...POSES.sit(1), yaw: NB_YAW, armL: { w: [40, -132], elbow: [-0.2, 1], fist: 0.2, hand: 26 }, armR: { w: [48, -134], elbow: [0.2, 1], fist: 0.3, hand: 26 }, headYaw: mix(0.7, 0.05, look), pitch: mix(16, 3, look), look: [mix(0.1, -0.6, look), mix(0.7, 0, look)], worry: 0.7 * look };
  let nq = seatedN;
  if (rise > 0.001) nq = lerpPose(seatedN, { ...sitDown(1, 1 - rise), yaw: mix(NB_YAW, 0.62, rise), ...watch, lean: -4 }, sst(0, 0.4, rise));
  // while she slips past behind him she looks where she is going (her face turned to the aisle), then turns back to
  // watch him once she is clear of him (f51 -> f57)
  const back = sst(BEAT.walk0 + 9, BEAT.walk0 + 15, f);
  const going = { headYaw: mix(0.8, watch.headYaw, back), look: [mix(0.6, watch.look[0], back), 0.05] as P2 };
  if (wa > 0.001) nq = lerpPose(nq, { ...POSES.walk(1, phase, wa), ...watch, ...going }, wa);
  const done = sst(BEAT.walk1 - 7, BEAT.walk1, f);
  if (done > 0.001) nq = lerpPose(nq, { ...POSES.leanAway({ ...POSES.turnTo(1.05), pitch: 2 }, 0.8, 1, "none"), ...watch, headYaw: -0.05 }, done);
  nq = { ...nq, handTo: { L: { to: "mouth", amt: cover } } };
  const nbX = Xs - backN(1 - rise) + 88 * (phase - 0.25);
  return [
    { kind: "commuter", v: 3, uid: "r1", pose: swayPose(r1, f, 0.45, 7), X: R452.X, Z: R452.Z },
    { kind: NB[0], v: NB[1], uid: "nb", pose: swayPose(nq, f, mix(0.45, 1, rise), 3), X: nbX, Z: nbSeat.Z, props: { hold: { L: "none", R: "handbag" }, inks: NB_INKS } },
    { kind: "youth", v: 1, uid: "r2", pose: swayPose(POSES.leanAway({ ...POSES.sit(-1), headYaw: mix(-0.5, -0.8, look), pitch: mix(10, 4, look) }, away(5) * 0.8, 1), f, 0.45, 11), X: R1648.X, Z: R1648.Z },
    { kind: "parent", v: 1, uid: "l2", pose: swayPose({ ...POSES.sit(1), headYaw: mix(0.8, 0.4, look) }, f, 0.45, 9), X: L1280.X, Z: L1280.Z },
    { kind: "elder", v: 2, uid: "far", pose: swayPose(POSES.leanAway({ ...POSES.turnTo(-0.3), headYaw: mix(-0.1, -0.6, look) + drift(8, 0.05), pitch: 3 }, away(9) * 0.7, 1), f, 1, 13), X: 95, Z: 1975 },
  ];
};

// ===================================================================================================================
// THE SCENE (pure: the checks import it)
// ===================================================================================================================
export const sceneAt = (frame: number) => {
  const sw = carriageSway(frame);
  const lc = camAt(frame);
  const c0 = lc.cam;
  const cam: Cam = { ...c0, cy: c0.cy + sw.bob / c0.k };
  const A = airWorldOf({ cam, rest: REST, depth: lc.depth, frame, scene: CARRIAGE_SCENE });
  const o = officerAt(frame);
  const oAt = A.P.at(o.X, o.Z);
  const grip = A.P.p(GRIP3[0], GRIP3[1], GRIP3[2]);
  const held = covidGripTo("officer", OFFICER_V, o.pose, { R: grip }, oAt.at, oAt.scale);
  const pose = lerpPose(held, o.pose, o.release);
  const oA = covidAnchors("officer", pose, oAt.at, oAt.scale, { variant: OFFICER_V });
  return { cam, A, o, oAt, pose, oA };
};

const figItem = (A: AirWorld, f: FigSpec, frame: number, camK: number): StageItem => {
  const { at, scale } = A.P.at(f.X, f.Z);
  const [sw, sd] = f.shadow ?? [58, 34];
  return {
    Z: f.Z,
    key: f.uid,
    node: (
      <g>
        <AirShadow A={A} X={f.X} Z={f.Z} w={sw} d={sd} uid={`${f.uid}sh`} amt={0.75} />
        <CovidFigure kind={f.kind} variant={f.v} pose={f.pose} at={at} scale={scale} uid={f.uid} fog={A.folkFog(f.Z)} unitPx={camK} frame={frame} {...f.props} />
      </g>
    ),
  };
};

const SickPrettyQuick: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const S = sceneAt(frame);
  const { A, cam, o } = S;
  const figs: FigSpec[] = [...othersAt(frame), { kind: "officer", v: OFFICER_V, uid: "off", pose: S.pose, X: o.X, Z: o.Z, props: { infected: o.infected, sick: o.sick } }];
  const items = figs.map((f) => figItem(A, f, frame, cam.k));
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

export default SickPrettyQuick;
export type { P2 };
