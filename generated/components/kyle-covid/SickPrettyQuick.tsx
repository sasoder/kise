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
// THE MOTION (user revision 1, notes/rev_12_user1.md: "one continuous motion, not word for word; not rushed at the
// end"): ONE long overlapping arc instead of beats on the words. Every move is one smooth hump of velocity (`hump`: the
// CDF of u^a (1-u)^b, zero speed at both ends, the peak at a / (a + b)), the moves overlap, nothing new starts after
// f55 and f60 -> f81 is a calm living hold.
// f0 is cut 3's LANDING camera trucked 40 world px left (the director, v6 review: the cut opens straight off the speaker,
// so he is whole at f0, his near arm ~64 px inside the left edge; CAM_KEYS.open): at the centre aisle pole (cut 3's POLE, Z 330) stands the Officer (the SARS-1
// man, covidFolk Round 4's variant 3: in shirtsleeves, white shirt, dark-teal tie, belt) where cut 3's Carrier stood
// (CARRIER_FEET, the FAR hand on GRIP3, the body turned toward us, yaw 0.62, so both lungs show), his near hand low at
// his trouser pocket, an orange glow in his lungs. From f0 he is already going: the glow flares (0.62 -> 1, fastest at
// f0, full by ~f36) and the pallor creeps in on one smooth ramp (sick 0 -> 1, f0 -> f52).
// ONE GESTURE: his near hand rises slowly to his forehead (f2 -> f25), slides down to his mouth (f20 -> f31) for ONE soft
// cough (peak f33) while he is already bending, then goes down onto his knee as he sits (f37 -> f60).
// ONE SINK: the hips go back (f4 -> f52, fastest ~f22) a little ahead of the way down (f14 -> f64, slowest at the
// landing): he bends at the knees and lowers himself onto the left bench seat right behind him, steadying on the pole
// with his far hand at first (let go f12 -> f34, the hand then to his lap), the near foot then the far foot stepping
// back inside the sink (their steps ride the hips' path), the body leaning forward a little on the way down. Seated by
// ~f55: slumped at yaw 0.62, head bowed, hands on his knee and lap, breathing heavily (~1.35 s) to the end, both lungs
// and the windpipe glowing whole.
// THE NEIGHBOUR overlaps with him: the woman on his bench (the seat beside his, Z 452) notices early (f10 -> f22),
// rises slowly (f16 -> f50) leaning forward over her feet, her hand over her mouth (f22 -> f40), and steps away into the
// aisle in the same move (the walk f20 -> f64: its speed one hump, its stride with it, its first steps still low with the
// rise), watching him the whole way; she settles standing apart at his right, leaning away (f30 -> f66), and shifts her
// weight a little in the hold. Her seat is behind his on screen, so she crosses behind him (painter's order by Z); timed
// so she passes behind his body while still low (~f28) and comes out at his shoulder (~f32-36). The woman across the
// aisle (cut 3's seat) looks up as his hand rises and leans away; the passengers deeper down the carriage turn and lean
// away, all inside f8 -> f54.
// NO orange leaves his body (no breath specks; nobody kindles): the virus stays in the one man everyone can see is ill.
// Cause -> effect: his hand rising to his forehead (f2 ->) -> the woman across looks up (f8 ->) and the woman beside
// him notices (f10 ->); his sink and the cough (f14 -> f40) -> she is already up and stepping away.
// THE CAMERA: one eased move over the whole slot: the pan follows him (a hump f-4 -> f56, blended 75/25 with a long tail
// to f104; the opening shift is taken out along it by f38, so it starts gently from f0, peaks ~f29 and decelerates into
// the end, still creeping on f81; f38 -> f81 are pixel for pixel v6's), the zoom on the long
// tail only, easing a touch WIDER (k 7.19 -> 6.91), the horizon row rising (766 -> 630) on one hump with his sink
// (f0 -> f56) so his head lands once on screen. The end: him whole and left of centre (head ~x 430), his seat and back
// in shot, her standing at his right, apart. The framing is set by the caption bands: seated, his head-to-knee span is
// ~440 px at this zoom, so with his hands on his knee above y 1080 his seated head sits at ~y 595 (the note's 640-820
// would put his hands in the first band); the glow ~y 760-950.
// Orange = THE VIRUS only (the clip's ORANGE RULE): his lung glow and nothing else; the cast's and carriage's muted
// local colours everywhere else (her puffer is the cast's muted red-brown).
//
// USER REVISION 2 ("to match with the previous graphic ... he can also have a similar more pronounced aura"): cut 3's
// look round HIM only, from f0: the light the virus throws (covidAura: AURA_BACK behind him, AURA_FRONT 0.35 over him,
// fading above the caption bands) and his breath cloud (covidHaze at HAZE_STRENGTH 1.42, anchored on his own feet so
// it rides with him into the seat; the one soft cough adds a puff inside it). It never reaches anyone: its forward
// reach is short (OFFICER_HAZE), her mote clear zone is wide, she has no glow and no aura, and the light behind him sits
// just behind her depth, so she steps out of his air unlit (clear of the cloud by ~f44). Motion, camera, timing and
// length are v7's: `aura: false` renders v7 frame for frame.
//
// DEPTH: the carriage's set and grammar (CARRIAGE_DEPTH dRef 700 at kRef 2, dolly 0.5, CARRIAGE_SCENE: fog by the
// eye's distance, mood interior), cut 3's landing eye (-212) easing to -206; cut 3's HIDE_POLES / HIDE_STRAPS. The
// Officer X -60 -> his seat X -182 at Z 330; the woman across at the right bench Z 452; the woman beside him at the
// left bench Z 452 -> standing X ~-55; the deep passengers at the right bench Z 1648, the left bench Z 1280 and by the
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
import { CovidFigure, POSES, covidAnchors, covidGripTo, lerpPose, rigPose, seatFootX, sitBack, sitDown, type CovidFigureProps, type CovidKind, type CovidPose, type P2 } from "./covidFolk";
import { AURA_BACK, AURA_FRONT, CARRIER_FEET, GRIP3, HAZE_STRENGTH, HIDE_POLES, HIDE_STRAPS, LANDING, POLE, latentCamAt } from "./LatentLongEnough";
import { HazeCloud, breathRhythm, hazeAt, type HazeAvoid, type HazeEmitter } from "./covidHaze";
import { AuraGlow, auraFor } from "./covidAura";

export const FPS = 30000 / 1001;
export const DURATION = 82;
/** aura: false renders v7 exactly (the motion-unchanged proof of user revision 2) */
export const schema = z.object({ aura: z.boolean().default(true) });
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** ONE SMOOTH HUMP OF VELOCITY: the normalised CDF of u^a (1-u)^b on 0..1 (zero speed at both ends unless a or b is 0,
 *  the speed peaking at u = a / (a + b): b > a = a long deceleration, slowest at the landing). Tabulated once. */
const HUMP_N = 4096;
const humpTables = new Map<string, Float64Array>();
const humpCdf = (a: number, b: number) => {
  const key = `${a}|${b}`;
  let T = humpTables.get(key);
  if (!T) {
    T = new Float64Array(HUMP_N + 1);
    let acc = 0;
    for (let i = 1; i <= HUMP_N; i++) {
      const u = (i - 0.5) / HUMP_N;
      acc += Math.pow(u, a) * Math.pow(1 - u, b);
      T[i] = acc;
    }
    for (let i = 1; i <= HUMP_N; i++) T[i] /= acc;
    humpTables.set(key, T);
  }
  return T;
};
/** a move from frame f0 to f1 (0 -> 1), its speed one hump skewed by (a, b) */
export const hump = (f0: number, f1: number, a = 2, b = 2) => {
  const T = humpCdf(a, b);
  return (f: number) => {
    const x = c01((f - f0) / (f1 - f0)) * HUMP_N;
    const i = Math.min(HUMP_N - 1, Math.floor(x));
    return T[i] + (T[i + 1] - T[i]) * (x - i);
  };
};

// ===================================================================================================================
// CUT 3'S STAGING (imported, asserted): the same centre aisle pole, the same stance, the same camera grammar
// ===================================================================================================================
const L84 = latentCamAt(84);
if (Math.abs(L84.cam.k - LANDING.cam.k) > 1e-9 || Math.abs(L84.cam.cx - LANDING.cam.cx) > 1e-9 || Math.abs(L84.cam.cy - LANDING.cam.cy) > 1e-9) throw new Error("SickPrettyQuick: cut 3's LANDING camera changed");
if (CARRIER_FEET.Z !== POLE.Z || GRIP3[0] !== POLE.X || GRIP3[2] !== POLE.Z) throw new Error("SickPrettyQuick: cut 3's pole staging changed");

// ===================================================================================================================
// THE TIMELINE OF MOVES (frames; f0 = 12.679 s): each one hump, overlapping
// ===================================================================================================================
export const MOVES = {
  /** the glow flares from f0 (fastest at f0) and the pallor creeps in on one ramp */
  glow: [0, 36, 0.35, 2.2],
  pale: [0, 52, 1.5, 1.5],
  /** ONE GESTURE: the near hand pocket -> forehead -> mouth (one soft cough) -> his knee */
  toFore: [2, 25, 1.6, 2.2],
  toMouth: [20, 31, 2, 2],
  coughAt: 33,
  toKnee: [37, 60, 1.6, 2.6],
  /** ONE SINK: the hips back and down onto the seat (fastest ~f28, slowest at the landing) */
  sink: [14, 64, 2, 2.6],
  /** the hips' way back to the seat (a little ahead of the sit, broader, so the camera can stay with him) */
  hips: [4, 52, 1.4, 2.4],
  /** the far hand lets go of the pole inside the sink */
  letGo: [12, 34, 2, 2],
  /** THE NEIGHBOUR: notices, rises, a hand over her mouth, steps away in one move, settles */
  notice: [10, 22, 2, 2],
  rise: [16, 50, 1.6, 2.4],
  cover: [22, 40, 2, 2],
  walk: [20, 64, 1.1, 2.6],
  settle: [30, 66, 1.4, 2.4],
  /** the woman across the aisle and the deep passengers */
  lookUp: [8, 22, 2, 2],
  across: [16, 46, 2, 2],
  away: [20, 52, 2, 2],
} as const;
type Mv = readonly [number, number, number, number];
const mv = (m: Mv) => hump(m[0], m[1], m[2], m[3]);

// ===================================================================================================================
// THE CAMERA: f0 = cut 3's landing camera exactly; ONE eased move over the whole slot (truck left with him, the horizon
// row rising a little, the zoom easing a touch wider so the seated man is whole above the caption bands)
// ===================================================================================================================
/** the horizon (vanishing point) row of cut 3's landing */
const HR0 = 960 - (LANDING.cam.cy - LANDING.depth.eyeY) * LANDING.cam.k;
export const CAM_KEYS = {
  k0: LANDING.cam.k,
  cx0: LANDING.cam.cx,
  eye0: LANDING.depth.eyeY,
  hr0: HR0,
  k1: 6.9,
  cx1: -121,
  eye1: -206,
  hr1: 630,
  /** the move: the pan follows him (one hump with his sink, the camera a little ahead) blended with a long tail that
   *  carries it, decelerating, to the end (w = the tail's share; the sum is still one hump of speed); the zoom rides the
   *  long hump alone; the tilt (the horizon row and the eye) one hump with his sink, so his head lands once on screen */
  pan: { pre: -4, post: 56, a: 1.8, b: 2.2 },
  tail: { pre: -10, post: 104, a: 1.6, b: 2.2, w: 0.25 },
  tilt: { pre: 0, post: 56, a: 2.4, b: 2 },
  /** THE OPENING (director, v6 review): the cut opens straight off the speaker, so f0 starts `shift` world px further
   *  left than cut 3's landing (he is whole, his near arm inside the left edge). The shift is taken out ALONG the pan's
   *  own progress ((1 - e / e(until))^3), so the pan stays one lobe, only its early part shorter, and every frame
   *  from f(until) on is exactly the v6 camera. */
  open: { shift: 40, until: 38 },
};
const camEase = (o: { pre: number; post: number; a: number; b: number }, f: number) => {
  const H = hump(o.pre, o.post, o.a, o.b);
  return (H(f) - H(0)) / (1 - H(0));
};
export const camAt = (f: number, opening = true): { cam: Cam; depth: DepthOpts } => {
  const K = CAM_KEYS;
  const eTail = camEase(K.tail, f);
  const e = mix(camEase(K.pan, f), eTail, K.tail.w);
  const et = camEase(K.tilt, f);
  const k = Math.exp(mix(Math.log(K.k0), Math.log(K.k1), eTail));
  const eyeY = mix(K.eye0, K.eye1, et);
  const hr = mix(K.hr0, K.hr1, et);
  const eUntil = mix(camEase(K.pan, K.open.until), camEase(K.tail, K.open.until), K.tail.w);
  const u = c01(e / eUntil);
  // taken out fastest where the pan is slowest (its start), gone with zero speed at f(until): (1 - u)^3
  const cx = mix(K.cx0, K.cx1, e) - (opening ? K.open.shift : 0) * (1 - u) ** 3;
  return { cam: { k, cx, cy: eyeY + (960 - hr) / k }, depth: { ...LANDING.depth, eyeY } };
};
/** the medium's parallax reference (motes, shafts): the f0 camera WITHOUT the opening shift, so the air of every frame
 *  from f(until) on is exactly v6's */
const REST = camAt(0, false).cam;

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
/** the forward lean on the way down (deg): the counterweight of a real sit-down, small so the head lands once */
export const LEAN_BUMP = { v: 5 };
const STAND_YAW = 0.62;
/** the officer's thigh (rig units: covidFolkBody MAN.leg[0]) for rigPose's seated-foot rule */
const SEAT_LEG0 = 69;
/** the seated feet's offsets from the hips (rigPose's seated rule on the slump at SEATED_YAW), set a little further
 *  forward (+22..26 units: a sick man's legs slide out a little; the feet step back less) */
const SEATED_FEET = (() => {
  const r = rigPose("officer", OFFICER_V, { ...POSES.slump(1, 0), yaw: SEATED_YAW });
  return { L: r.footL[0] + 26, R: r.footR[0] + 22 };
})();
const M = {
  glow: mv(MOVES.glow),
  pale: mv(MOVES.pale),
  toFore: mv(MOVES.toFore),
  toMouth: mv(MOVES.toMouth),
  toKnee: mv(MOVES.toKnee),
  sink: mv(MOVES.sink),
  hips: mv(MOVES.hips),
  letGo: mv(MOVES.letGo),
};
/** the one soft cough: a quick jolt in (4 frames) and a slow release (10), 0..1 */
const jolt = (f: number) => {
  const c = MOVES.coughAt;
  return f < c ? sst(c - 4, c, f) : 1 - sst(c, c + 10, f);
};
export const officerAt = (frame: number) => {
  const f = frame;
  // the hip height follows the sink directly (the rig's crouch is linear in sit)
  const sit = M.sink(f);
  const s = sit;
  const pale = M.pale(f);
  const flareT = M.glow(f);
  const up = M.toFore(f);
  const mouthT = M.toMouth(f);
  const kneeT = M.toKnee(f);
  // how much the hand is at his face (worried brows, the head bowing into it)
  const atFace = up * (1 - kneeT);
  const j = jolt(f);
  // the slumped seat (heavy breathing)
  const t = f / 29.97;
  const br = Math.sin((t / 1.35) * 2 * Math.PI);
  const seated: CovidPose = { ...POSES.slump(1, f), yaw: SEATED_YAW, headYaw: 0.66, lean: 14 + 1.6 * br, pitch: 22 - 2 * br, hunch: 0.78 - 0.1 * br, crouch: -1.1 * br };
  // standing: the hold, a pleasant face (souring with the pallor), the near hand resting at his trouser pocket
  const glance = sst(0, 16, f);
  const stand: CovidPose = { ...HOLD, yaw: STAND_YAW, headYaw: mix(0.62, 0.72, glance), pitch: mix(1, 3, glance), look: [mix(0.15, 0.35, glance), 0.15], mouth: mix(0.22, 0.12, pale), armL: { w: [-8, -158], elbow: [-0.45, 1], fist: 0.45, hand: 8 } };
  // the head bows into the hand, the shoulders rise, the brows worry
  const ill: CovidPose = { ...stand, pitch: 3 + 9 * atFace, look: [0.2, 0.55 * atFace], mouth: mix(stand.mouth, 0.1, atFace), hunch: 0.35 * atFace, worry: Math.max(atFace, pale) };
  // THE SINK: one soft continuous fold from the standing hold into the seat: the hips travel back and down together
  // (the knees bend), the body leans forward a little on the way down (the counterweight of a real sit-down)
  let q = lerpPose(ill, seated, sit);
  const bend = Math.sin(Math.PI * s) * (1 - 0.5 * s);
  q = { ...q, lean: q.lean + LEAN_BUMP.v * bend, pitch: q.pitch + 3 * bend };
  // the one soft cough
  q = { ...q, lean: q.lean + 3 * j, pitch: q.pitch + 5 * j, crouch: q.crouch + 1.8 * j, open: Math.max(q.open ?? 0, 0.7 * j), lids: Math.max(q.lids, 0.35 * j) };
  // the hips' path to the seat (X -60 -> OFFICER_SEAT.X), a little ahead of the sit so they are over the seat when low
  const p = M.hips(f);
  const X = mix(CARRIER_FEET.X, OFFICER_SEAT.X, p);
  // THE FEET: each foot planted in the world except during its one step back (near foot first), timed on the hips'
  // own path so the steps live inside the sink; the pose's foot offsets are solved through rigPose's seated-foot rule
  // (mapped = o + sit (fx + c - 0.7 o)) so the drawn feet land exactly there
  const stepL = sst(0.05, 0.46, p);
  const stepR = sst(0.16, 0.62, p);
  const asn = Math.abs(Math.sin(q.yaw));
  const fxS = SEAT_LEG0 * mix(0.32, 1, asn) * 0.93;
  const cL = -4 * (1 - asn);
  const cR = 4 * (1 - asn);
  const PL = mix(CARRIER_FEET.X + HOLD.footL[0], OFFICER_SEAT.X + SEATED_FEET.L, stepL);
  const PR = mix(CARRIER_FEET.X + HOLD.footR[0], OFFICER_SEAT.X + SEATED_FEET.R, stepR);
  const solve = (P: number, c: number) => (P - X - sit * (fxS + c)) / (1 - 0.7 * sit);
  const liftL = Math.sin(Math.PI * stepL) * 8;
  const liftR = Math.sin(Math.PI * stepR) * 8;
  q = { ...q, footL: [solve(PL, cL), (HOLD.footL[1] - liftL) / (1 - 0.7 * sit)], footR: [solve(PR, cR), (HOLD.footR[1] - liftR) / (1 - 0.7 * sit)] };
  // THE NEAR ARM (L), one gesture: pocket -> forehead (the wrist rising along the near side of the chest, a quadratic
  // arc) -> the fist at the mouth (the cough) -> down onto his knee
  const fore = armTo(q, "L", "forehead");
  const toFore = lerpArm(q.armL, fore, up);
  const side: P2 = [Math.min(q.armL.w[0], fore.w[0]) - 20, (q.armL.w[1] + fore.w[1]) / 2];
  const bz = (a: number, c: number, b: number, u: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;
  toFore.w = [bz(q.armL.w[0], side[0], fore.w[0], up), bz(q.armL.w[1], side[1], fore.w[1], up)];
  const kneeA = armTo(q, "L", "knee");
  const onKnee: Arm = { ...kneeA, w: [kneeA.w[0] - 6, kneeA.w[1] - 14] };
  const nearA = lerpArm(lerpArm(toFore, armTo(q, "L", "mouth"), mouthT), onKnee, kneeT);
  // THE FAR ARM (R): steadying on the pole, let go inside the sink, forward onto his thigh, into his lap as he sits
  const lapR = armTo(q, "R", "lap");
  const farFree = lerpArm({ ...lapR, w: [lapR.w[0] + 42, lapR.w[1] - 30] }, lapR, sst(0.15, 0.85, sit));
  const rel = M.letGo(f);
  const gripArm = HOLD.armR;
  const farA: Arm = { ...farFree, elbow: [mix(gripArm.elbow[0], farFree.elbow[0], rel), mix(gripArm.elbow[1], farFree.elbow[1], rel)], fist: mix(gripArm.fist, farFree.fist, rel), hand: mix(gripArm.hand, farFree.hand, rel) };
  q = { ...q, armL: nearA, armR: farA, handTo: undefined };
  const sw = mix(1, 0.45, sit);
  q = swayPose(q, f, sw, 0);
  return { pose: q, X, Z: CARRIER_FEET.Z, release: rel, infected: mix(0.62, 1, flareT), sick: pale };
};

// ===================================================================================================================
// THE NEIGHBOURS (all well; they notice early and move away while he sinks)
// ===================================================================================================================
export type FigSpec = { kind: CovidKind; v: number; pose: CovidPose; X: number; Z: number; props?: Partial<CovidFigureProps>; uid: string; shadow?: [number, number] };
const NB_INKS = { top: "#7E4E44", top2: "#6C433A" };
const N = {
  notice: mv(MOVES.notice),
  rise: mv(MOVES.rise),
  cover: mv(MOVES.cover),
  walk: mv(MOVES.walk),
  settle: mv(MOVES.settle),
  lookUp: mv(MOVES.lookUp),
  across: mv(MOVES.across),
  away: mv(MOVES.away),
};
/** her walk: the stride amount follows the walk's speed (one hump), so the step starts and lands softly */
const WALK_SPAN = MOVES.walk[1] - MOVES.walk[0];
const walkSpeedAt = (f: number) => (N.walk(f + 0.5) - N.walk(f - 0.5)) * WALK_SPAN;
const WALK_PEAK = (() => {
  let m = 0;
  for (let g = MOVES.walk[0]; g <= MOVES.walk[1]; g += 0.25) m = Math.max(m, walkSpeedAt(g));
  return m;
})();
/** the walk's whole phase advance (cycles: one cycle = two steps = 88 units): her standing place beside him */
export const NB_END_X = -55;
/** her forward lean (deg) at mid-rise */
export const NB_DUCK = { v: 14 };
export const othersAt = (frame: number): FigSpec[] => {
  const f = frame;
  const s = (side: "L" | "R", z: number) => seatNear(side, z);
  const R452 = s("R", 452);
  const R1648 = s("R", 1648);
  const L1280 = s("L", 1280);
  const look = N.notice(f);
  const away = (d: number) => mv([MOVES.away[0] + d, MOVES.away[1] + d, 2, 2])(f);
  const drift = (seed: number, amp: number) => amp * Math.sin(f * 0.021 + seed);
  // across the aisle: the woman with the coffee cup (cut 3's seat): looks up as his hand rises, leans away to the window
  const look1 = N.lookUp(f);
  const r1base: CovidPose = { ...POSES.sit(-1), headYaw: mix(-0.6, -0.95, look1), pitch: mix(14, 2, look1), look: [mix(-0.1, -0.6, look1), mix(0.7, 0, look1)], worry: look1, armR: { w: [40, -150], elbow: [0.3, 1], fist: 0.8, hand: -60 }, armL: { w: [30, -146], elbow: [-0.2, 1], fist: 0.6, hand: -40 } };
  const r1 = POSES.leanAway(r1base, N.across(f), 1, "none");
  // his bench, the next seat along: she notices, rises (feet planted: sitDown reversed), her near hand over her mouth,
  // and steps off into the aisle in one move (the rise blends into the walk), watching him all the way, then stands
  // leaning away
  const nbSeat = seatNear("L", 452);
  const NB: [CovidKind, number] = ["parent", 0];
  const rise = N.rise(f);
  const NB_YAW = 0.5;
  const fxN = seatFootX(NB[0], NB[1], NB_YAW);
  const backN = (u: number) => (sitBack(u, NB[0], NB[1]) / seatFootX(NB[0], NB[1])) * fxN;
  const Xs = nbSeat.X + fxN;
  // the walk's phase (0.25 at the start: both feet under her) and her travel, tied together (88 units a cycle)
  const PHASES = (NB_END_X - Xs) / 88;
  const wf = N.walk(f);
  const phase = 0.25 + PHASES * wf;
  const wa = c01(walkSpeedAt(f) / WALK_PEAK) ** 0.7;
  const cover = N.cover(f);
  const watch = { headYaw: -0.12, pitch: 1, look: [-0.85, 0.05] as P2, worry: 1 };
  const seatedN: CovidPose = { ...POSES.sit(1), yaw: NB_YAW, armL: { w: [40, -141], elbow: [-0.2, 1], fist: 0.2, hand: 26 }, armR: { w: [48, -143], elbow: [0.2, 1], fist: 0.3, hand: 26 }, headYaw: mix(0.7, 0.05, look), pitch: mix(16, 3, look), look: [mix(0.1, -0.6, look), mix(0.7, 0, look)], worry: 0.7 * look };
  let nq = seatedN;
  if (rise > 0.0001) nq = lerpPose(seatedN, { ...sitDown(1, 1 - rise), yaw: mix(NB_YAW, 0.62, rise), ...watch, lean: -4 }, sst(0, 0.4, rise));
  // the first steps are taken while she is still getting up: the walk carries the rise's seat (sit, the hips still low),
  // so her height follows the rise, not the walk
  if (wa > 0.0001) nq = lerpPose(nq, { ...POSES.walk(1, phase, wa), ...watch, sit: nq.sit ?? 0, seatH: nq.seatH }, Math.min(1, wa * 1.6) * sst(0, 0.25, wf));
  const done = N.settle(f);
  // the living hold: a small, slow shift of her weight (one sway, from the settle on)
  const shift = done * Math.sin(((f - MOVES.settle[0]) / 29.97 / 2.6) * 2 * Math.PI);
  if (done > 0.0001) nq = lerpPose(nq, { ...POSES.leanAway({ ...POSES.turnTo(1.05), pitch: 2 }, 0.8, 1, "none"), ...watch, headYaw: -0.05 }, done);
  // getting up she leans forward over her feet (the counterweight of a real rise), so she ducks behind him as she
  // slips past his head
  const duck = Math.sin(Math.PI * rise) * (1 - 0.25 * rise);
  nq = { ...nq, lean: nq.lean + NB_DUCK.v * duck + 1.6 * shift, roll: nq.roll + 1.2 * shift, handTo: { L: { to: "mouth", amt: cover } } };
  const nbX = Xs - backN(1 - rise) + 88 * (phase - 0.25);
  return [
    { kind: "commuter", v: 3, uid: "r1", pose: swayPose(r1, f, 0.45, 7), X: R452.X, Z: R452.Z },
    { kind: NB[0], v: NB[1], uid: "nb", pose: swayPose(nq, f, mix(0.45, 1, rise), 3), X: nbX, Z: nbSeat.Z, props: { hold: { L: "none", R: "handbag" }, inks: NB_INKS } },
    { kind: "youth", v: 1, uid: "r2", pose: swayPose(POSES.leanAway({ ...POSES.sit(-1), headYaw: mix(-0.5, -0.8, look), pitch: mix(10, 4, look) }, away(2) * 0.8, 1), f, 0.45, 11), X: R1648.X, Z: R1648.Z },
    { kind: "parent", v: 1, uid: "l2", pose: swayPose({ ...POSES.sit(1), headYaw: mix(0.8, 0.4, look) }, f, 0.45, 9), X: L1280.X, Z: L1280.Z },
    { kind: "elder", v: 2, uid: "far", pose: swayPose(POSES.leanAway({ ...POSES.turnTo(-0.3), headYaw: mix(-0.1, -0.6, look) + drift(8, 0.05), pitch: 3 }, away(4) * 0.7, 1), f, 1, 13), X: 95, Z: 1975 },
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

// ===================================================================================================================
// USER REVISION 2: THE AURA AND THE BREATH CLOUD (cut 3's look: covidAura with AURA_BACK behind him and AURA_FRONT over
// him; covidHaze at HAZE_STRENGTH), round HIM only. From f0 (he is infected 0.62 -> 1); the cloud rides with him into
// the seat (its anchor is his own feet, so the air he has breathed stays round him); the one soft cough adds a puff
// inside it. It never reaches anyone: its forward reach (toward the aisle, where she goes) is kept short, so the woman
// rises out of its thin edge and is clear of it by ~f50; no mote rides her (avoid), she never kindles (infected 0, no
// aura), and the light behind him sits behind her in the painter's order (she stands in front of it, unlit).
// ===================================================================================================================
/** his mouth, head and breath direction at a frame, rig units from his own feet (memoised: the haze asks per puff) */
const OFF_MEMO = new Map<number, { m: P2; c: P2; d: P2 }>();
const officerMouth = (f: number) => {
  let v = OFF_MEMO.get(f);
  if (!v) {
    const a = covidAnchors("officer", officerAt(f).pose, [0, 0], 1, { variant: OFFICER_V });
    v = { m: a.mouth, c: a.headC, d: a.mouthDir };
    OFF_MEMO.set(f, v);
  }
  return v;
};
/** how much he breathes out: with his glow (0.62 -> 1, so well under way at f0), his breath rhythm (quiet standing,
 *  heavy and quicker once seated), and the one soft cough */
export const officerShedAt = (f: number) => {
  const inf = mix(0.62, 1, M.glow(f));
  const s = c01((inf - 0.3) / 0.7);
  const shed = 0.08 + 0.92 * s ** 0.5;
  const seat = M.sink(f);
  const e = mix(breathRhythm(f, 96, 0.4), breathRhythm(f, 40, 1.3), seat);
  return Math.min(1, shed * e * (1 + 0.5 * jolt(f)));
};
/** how hard the breath pushes out: quiet, a little more on the cough */
const officerPushAt = (f: number) => 0.3 + 0.3 * jolt(f);
/** the cloud's look for this cut: cut 3's strength; its forward reach (the lobe in front of his face, the wide halo, the
 *  motes' forward bound) kept short, since nobody stays in front of him: the aisle is where she steps away */
export const OFFICER_HAZE = { strength: HAZE_STRENGTH, lobeW: 1.6, lobeD: [62, 104] as P2, lobeR: [56, 64] as P2, lobeY: [22, 34] as P2, lobeZ: [0, 16] as P2, haloD: 20, haloR: 150, haloW: 0.55, boundFwd: 105, moteLobe: 0.08 };
/** the share of the light behind him: placed just behind her depth, so it lights the carriage air round them both but
 *  never falls on her */
const AURA_BACK_Z = 460;
/** the mote clear zones round her and round the far passengers, x cut 3's radii */
const NB_CLEAR = 2.4;
const FAR_CLEAR = 2.4;
export const airAt = (frame: number, S: ReturnType<typeof sceneAt>) => {
  const { A, cam, o, oAt, pose } = S;
  // the haze anchor: his own feet now (rig units = stage units); his mouth history is in his own body frame
  const em: HazeEmitter = {
    opts: OFFICER_HAZE,
    project: (u) => ({ p: A.P.p(o.X + u[0], u[1], o.Z + u[2]), s: A.P.r(o.Z + u[2]) }),
    mouthAt: (f) => officerMouth(f).m,
    centreAt: (f) => officerMouth(f).c,
    dirAt: (f) => officerMouth(f).d,
    amountAt: officerShedAt,
    pushAt: officerPushAt,
    seed: 5.3,
  };
  const avoid: HazeAvoid[] = [{ c: S.oA.headC, r: 30 * oAt.scale, layer: "front" }];
  for (const f of othersAt(frame)) {
    const pa = A.P.at(f.X, f.Z);
    const fa = covidAnchors(f.kind, f.pose, pa.at, pa.scale, { variant: f.v });
    // her (and every passenger's) head, chest and hips: no mote on them. Their clear zones are wider than cut 3's (the
    // zone's soft edge is 0.6 r wide): she moves fast as she gets up and steps away, and the cloud rides with him past
    // the far passengers, so a mote she or they pass fades over several frames instead of blinking off or on; hers also
    // keeps his cloud's motes well off her as she leaves it
    const w = f.Z > 1000 ? FAR_CLEAR : f.uid === "nb" ? NB_CLEAR : 1;
    avoid.push({ c: fa.headC, r: 46 * pa.scale * w, layer: "all" }, { c: fa.chest, r: 60 * pa.scale * w, layer: "all" }, { c: fa.hip, r: 55 * pa.scale * w, layer: "all" });
  }
  const haze = hazeAt([em], frame, { avoid, below: cam.cy + (1050 - 960) / cam.k });
  const aura = auraFor("officer", pose, oAt.at, oAt.scale, o.infected, { variant: OFFICER_V });
  const back = auraFor("officer", pose, oAt.at, oAt.scale, o.infected, { variant: OFFICER_V, ...AURA_BACK });
  return { haze, aura: { ...aura, a: aura.a * AURA_FRONT }, back };
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

const SickPrettyQuick: React.FC<z.infer<typeof schema>> = ({ aura: withAura = true }) => {
  const frame = useCurrentFrame();
  const S = sceneAt(frame);
  const { A, cam, o } = S;
  const figs: FigSpec[] = [...othersAt(frame), { kind: "officer", v: OFFICER_V, uid: "off", pose: S.pose, X: o.X, Z: o.Z, props: { infected: o.infected, sick: o.sick } }];
  const items = figs.map((f) => figItem(A, f, frame, cam.k));
  if (withAura) {
    const L = airAt(frame, S);
    const hz = o.Z;
    const fogZ = A.folkFog(hz);
    // the light fades out between screen rows 960 and 1070 (the caption bands start at 1080), as in cut 3
    const fb: [number, number] = [cam.cy + (960 - 960) / cam.k, cam.cy + (1070 - 960) / cam.k];
    items.push({ Z: hz + 1, key: "hazeB", node: <HazeCloud haze={L.haze} layer="back" uid="hzb" fog={fogZ} /> });
    items.push({ Z: hz - 1, key: "hazeF", node: <HazeCloud haze={L.haze} layer="front" uid="hzf" fog={fogZ} /> });
    items.push({ Z: AURA_BACK_Z, key: "auraB", node: <AuraGlow aura={L.back} uid="aurb" fog={fogZ} fadeBelow={fb} /> });
    items.push({ Z: hz - 0.5, key: "auraF", node: <AuraGlow aura={L.aura} uid="aurf" fog={fogZ} fadeBelow={fb} /> });
  }
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
