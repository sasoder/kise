// ---------------------------------------------------------------------------
// InoculateWithActualSmallpox (kyle-vaccine, cut 34). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 125 frames.
// One cottage room inside the teal air (AirStage, palette A, mood interior) on a londonDepth one-point perspective,
// from the kit kits/dwarkesh-3d/dwarkesh3d; the people are the clip's cast vaccineFolk (import only).
//
// CHECK LINE: "They took matter from a smallpox sore on a sick man and scratched it into a healthy child's arm."
//
// THE LINE: "Before that, people would inoculate a person with actual smallpox, which [is just giving somebody
// smallpox]"
// WORD -> FRAME (f0 = 34.034 s): that 6 · PEOPLE 15 · would 20 · INOCULATE 25 · a 45 · PERSON 59 · with 70 ·
// ACTUAL 82 · SMALLPOX 91 · which 118 · end 125.
// DURATION: the slot 34.034 -> 38.205 s = 4.171 s x 29.97 = 125 frames (f0..f124).
//
// REV 1 (the user's notes, Oct 26; REV1_notes_20261026.md): re-timed to the re-cut word table (same 125 f: f0 =
// 33.133 s; that 6 · people 15 · would 21 · inoculate 25 · a 44 · PERSON 60 · with 70 · ACTUAL 82 · SMALLPOX 91 ·
// which 118; the beats already sat on these frames). (1) The see-through rim at the dab is gone: it was a second,
// clipped copy of the Inoculator drawn over the arms (its edges and its fade showed as a transparent border on his
// coat); there is no copy now: the blade comes down from above his arm so her hand never needs to be in front of
// him, and the girl is drawn before the Inoculator. (2) The girl's arm gets plum pox DOTS (the same pustule drawing,
// colour and size range as the sick man's), one per dab where the tip touches (three dabs, contact f72 / f81 / f89,
// each dot swelling in from the next frame), not lines. (3) Her arm moves more naturally: the blade's angle is the
// cut's own (one slow eased turn in her fingers through the carry, then turned down as she draws back), the tip
// travels in arcs set by the cut (down from above onto his arm; low in and out at the girl, below her face), the
// elbow leads the carry, the wrist follows and the hand's angle comes last, each with a little anticipation and
// settle; the shoulders lean and roll toward the working side a beat late, a slight shoulder lift with the reach.
//
// ROUND 2 (director): one table, frontal, a medium shot pushed in; the cut's own larger lancet.
// THE SET: a plain cottage table across the frame (its top at ~y 960-990; its front, the legs and the floor sink into
// a band of dense low air). LEFT: the sick man on a stool, a man in a coat, waistcoat and breeches (the cast's
// Inoculator v1 build re-inked olive-slate; no props), pox 1, his bared forearm laid on the table with three large plum
// pustules drawn on it (radius 5.6 / 4.2 / 3.6 units), his other hand on the table by it. MIDDLE, behind the table: the
// Inoculator (v0) facing us, the lancet in her LEFT hand (screen right); her free hand hangs hidden behind the table's
// apron. RIGHT: the girl (Child v1) on a tall stool, turned toward the table, her bared near arm (R) laid over the
// table's corner; her mother (Parent v0) stands behind her, one hand on her shoulder.
// THE LANCET: the cut's own (BigLancet: a bright steel leaf blade 16 units ~ 47-50 px on screen, on a cream handle),
// drawn every frame from her hand (the cast's mitten anchor) along the cut's blade angle; the cast's small lancet is
// not drawn (hold "none"). The hand is solved one blade-length back from the tip's path; corrections make the tip
// exact on each contact point (error 0.0 world px).
// THE MOTION: f0 close on the dip: the blade tip lands on the big pustule on his forearm (DIP_CONTACT f10), presses and
// comes away (f18) carrying a plum speck (drawn by the cut, ~21 px across). The carry (f26-60): her hand lifts the
// blade in an arc over the table while she sidesteps behind it toward the girl (her feet are hidden by the table) and
// turns a little (yaw -0.12 -> 0.12). The reach (f52-72): the tip lands on the girl's bared upper arm (SCR_CONTACT f72)
// as she screws her eyes shut (f64-68, flinch f60-116); three dabs (tip on the skin f72-74, f81-83, f89-91, lifted
// between), a plum pox dot left at each, the speck shrinking as it is left. The blade draws back and turns down
// (f93-114); the girl opens her eyes (f92-96) and looks at the dots; the Inoculator lifts her head and turns it
// three-quarter toward the girl (f96-112) so her eyes read; a creep to the end.
// Draw order: the girl, then the Inoculator (behind the table, but her hand reaches in front of the girl's arm), the
// table's front, then the sick man (in front of her); the dots, the big lancet and its speck on top.
// THE CAMERA: k 3.15 -> 3.3 (push lobe f10-92, then a creep) with one lateral move wx -86 -> 108 (a cosine lobe
// f10-64, then a creep): f0 frames the sick man, the dip and the Inoculator (the girl is fully off the right edge, her
// offered forearm already on the table); the landing frames the Inoculator, the girl and her mother, the scratch at
// x ~610-650, the sick man gone off the left edge once the matter is on the blade. Heads ~y 550-700, arms ~y 860-900.
// Orange = THE VACCINE only: there is none in this cut (this is the older way; bloom off). SMALLPOX = POX plum
// (#8E4552 / deep #6A2E3A): the sick man's pustules, the speck on the blade, the mark in the scratch. Never orange,
// never glowing.
//
// DEPTH: eye Y -235 (a standing chest's height, looking a little down on the table), dRef 800 at kRef 2.85, dolly 0.5;
// fog by the eye's distance (interior, fogNear 250 / fogVis 1000; the back wall also mixed 40 % toward the air). The
// table X -108..74, Z -30..46, top Y -137; the sick man X -148 (Z 8, his hands on the table at X -64 and -120); the Inoculator X -44 -> 21 (Z 80); the girl
// X 128 (Z 4, stool 112); the mother X 166 (Z 96); the back wall (posts, a six-paned window whose shafts fall right)
// at Z 520.
//
// SOURCES: none on screen. Variolation (inoculation with smallpox matter scratched or cut into the skin of a healthy
// person, taken from a pustule of a sick one) is the practice the speaker describes; the picture is a generic
// 18th-century cottage scene, no real person.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirFloor, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, c01, mixHex, swayCam, type AirWorld, type Cam, type DepthOpts, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { POSES, POX, POX_DEEP, VaccineFigure, breathe, standAt, vaccineAnchors, type VaccineInks, type VPose } from "./vaccineFolk";

export const FPS = 30000 / 1001;
export const DURATION = 125;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const lin = (f: number, a: number, b: number) => c01((f - a) / (b - a));
const sst = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const eio = (u: number, p = 2) => {
  const v = c01(u);
  return v < 0.5 ? Math.pow(2 * v, p) / 2 : 1 - Math.pow(2 * (1 - v), p) / 2;
};
/** a cosine ease: a sine-shaped velocity lobe, no corner at its peak */
const cosE = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * c01(u));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix2 = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
const norm = (a: P2): P2 => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const Pt = (p: P2) => `${p[0].toFixed(3)},${p[1].toFixed(3)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

// ---------------------------------------------------------------------------
// THE ROOM (cast units, a man ~312 = 1.75 m; X across, Y up -, Z depth; the floor Y 0)
// ---------------------------------------------------------------------------
export const DEPTH: DepthOpts = { eyeY: -235, dRef: 800, kRef: 2.85, dolly: 0.5 };
const SCENE = { mood: "interior" as const, fogNear: 250, fogVis: 1000, fogMax: 0.92, hHigh: 900, eyeT: 0.08 };
const WALL_Z = 520;
const ROOM_H = 600;
const PLASTER: Mat = { lit: "#D2C4A4", mid: "#B3A485", dark: "#6E6250" };
const BEAM: Mat = MAT.timber;
const WIN = { X0: -360, X1: -190, Y0: -400, Y1: -255 };
/** the one table, frontal, across the middle of the frame */
export const TABLE = { X0: -108, X1: 74, Z0: -30, Z1: 46, top: -137, thick: 8, apron: 20, leg: 9 };

// the people
/** the sick man (the cast's Georgian-gentleman build, Inoculator v1, re-inked as a plain man in a coat): seated at the
 *  table's left end, facing right, his bared forearm laid on the table */
export const SICK = { X: -148, Z: 8, seat: 82 };
const SICK_INKS: Partial<VaccineInks> = { top: "#5C6656", top2: "#4E5749", waist: "#A39577", lower: "#5E5244", hair: "#4A392C", stocking: "#9C968A" };
/** where his forearm lies: the hand's grip and the far hand on the table top (world X, Z) */
const SICK_HAND = { X: -64, Z: 2 };
const SICK_FAR = { X: -120, Z: 10 };
/** the Inoculator behind the table, facing us; her feet are hidden by the table, so she glides a little to the right */
export const INO = { X0: -44, X1: 21, Z: 80 };
/** the girl on a stool at the table's right corner, turned a little toward the Inoculator, her bared left arm offered
 *  with the hand resting on the table's corner */
export const CHILD = { X: 128, Z: 4, v: 1, seat: 112 };
/** where her hand rests on the table (world X, Z) */
const CHILD_HAND = { X: 66, Z: 0 };
/** her mother standing behind her, one hand on her shoulder */
export const MOTHER = { X: 166, Z: 96 };

// ---------------------------------------------------------------------------
// TIMING
// ---------------------------------------------------------------------------
export const DIP_CONTACT = 10;
const DIP_PRESS_END = 17;
export const DIP_LEAVE = 18;
const DIP_OFF = 32;
const CARRY = [26, 60] as const;
const REACH_A = 52;
export const SCR_CONTACT = 72;
/** the three dabs on the girl's arm: the tip lands on each at its frame and stays ~2 f, then lifts and moves on */
const DABS = [72, 81, 89] as const;
const DAB_HOLD = 2;
const WD_A = 93;
const WD_B = 114;

// ---------------------------------------------------------------------------
// THE CAMERA: a medium shot; one gentle lateral move + slight push (one cosine lobe f10..64, the push f10..92) and a creep
// ---------------------------------------------------------------------------
const CAM_A = { k: 3.15, wx: -86, wy: -137, sy: 978 };
const CAM_B = { k: 3.3, wx: 108, wy: -137, sy: 975 };
const panU = (f: number) => 0.07 * (f / (DURATION - 1)) + 0.93 * cosE(lin(f, 10, 64));
const pushU = (f: number) => 0.3 * (f / (DURATION - 1)) + 0.7 * cosE(lin(f, 10, 92));
const camAt = (f: number): Cam => {
  const u = panU(f);
  const k = Math.exp(mix(Math.log(CAM_A.k), Math.log(CAM_B.k), pushU(f)));
  const wx = mix(CAM_A.wx, CAM_B.wx, u);
  const wy = mix(CAM_A.wy, CAM_B.wy, u);
  const sy = mix(CAM_A.sy, CAM_B.sy, u);
  return { k, cx: wx, cy: wy - (sy - 960) / k };
};
export const camOf = (f: number) => swayCam(camAt(f), f);
const REST = camOf(0);

// ---------------------------------------------------------------------------
// THE PERFORMANCES
// ---------------------------------------------------------------------------
type Fig = { at: P2; scale: number };
const figAt = (A: AirWorld, X: number, Z: number, feetY = 0): Fig => ({ at: A.P.p(X, feetY, Z), scale: A.P.r(Z) });

/** the sick man: seated, facing right, both forearms on the table (the near one bared); pale, droopy, worried */
const sickPose = (f: number): VPose => {
  const base = POSES.sit(1, SICK.seat);
  const q: VPose = { ...base, yaw: 0.62, headYaw: 0.42, pitch: 10, lean: 5, worry: 0.9, lids: 0.45, hunch: 0.3, bare: { L: 1, R: 0 }, look: [0.5, 0.5] };
  return breathe(q, f, 0.7, 1.3);
};

/** the girl: seated, the sleeve pushed up, her left (screen-left) arm offered; the flinch; then looking at the mark */
const childPose = (f: number): VPose => {
  // turned toward the table (facing left), the NEAR arm (R, her left: in front of her body) laid forward over the
  // table's corner, so the bared upper arm is in full view
  let q: VPose = { ...POSES.sit(-1, CHILD.seat), yaw: -0.5, headYaw: -0.35, bare: { R: 1, L: 0 } };
  q = { ...q, look: [-0.5, 0.2], worry: 0.45 };
  const lookDown = sst(lin(f, 94, 110));
  q = { ...q, headYaw: mix(-0.3, -0.55, lookDown), pitch: q.pitch + 16 * lookDown, look: [mix(-0.5, -0.8, lookDown), mix(0.2, 0.95, lookDown)], worry: mix(0.45, 0.6, lookDown) };
  q = POSES.flinch(q, lin(f, 60, 116), 0.8);
  // the eyes: squeezed shut through the scratches, then opened quickly (no long half-shut crossfade)
  q = { ...q, squeeze: sst(lin(f, 64, 68)) * (1 - sst(lin(f, 92, 96))) };
  return breathe(q, f, 0.7, 2.1);
};

/** the mother: standing behind the girl, turned toward her */
const motherPose = (f: number): VPose => {
  const q: VPose = { ...standAt(-0.45), headYaw: -0.5, pitch: 8, worry: 0.3, look: [-0.5, 0.4] };
  return breathe(q, f, 0.7, 0.4);
};

// the Inoculator's lancet arm (armL: her right, screen-left facing us) and her free arm
type Arm = VPose["armL"];
const lerpArm = (a: Arm, b: Arm, t: number): Arm => ({ w: mix2(a.w, b.w, t), elbow: mix2(a.elbow, b.elbow, t), fist: mix(a.fist, b.fist, t), hand: mix(a.hand, b.hand, t) });
const bezArm = (a: Arm, c: Arm, b: Arm, u: number): Arm => {
  const q = (x: number, y: number, z: number) => (1 - u) * (1 - u) * x + 2 * u * (1 - u) * y + u * u * z;
  return { w: [q(a.w[0], c.w[0], b.w[0]), q(a.w[1], c.w[1], b.w[1])], elbow: [q(a.elbow[0], c.elbow[0], b.elbow[0]), q(a.elbow[1], c.elbow[1], b.elbow[1])], fist: q(a.fist, c.fist, b.fist), hand: q(a.hand, c.hand, b.hand) };
};
// her LEFT hand (armR, screen-right facing us) holds the lancet; she sidesteps behind the table from the dip to the girl
const DIP_READY: Arm = { w: [-12, -178], elbow: [0.6, 1], fist: 1, hand: 10 };
const CARRY_MID: Arm = { w: [30, -214], elbow: [0.6, 1], fist: 1, hand: -50 };
const SCR_READY: Arm = { w: [70, -160], elbow: [0.2, 1], fist: 1, hand: -100 };
/** after the scratch: drawn back a little, the blade still pointing down toward the table (no swing past the girl) */
const REST_R: Arm = { w: [40, -158], elbow: [-0.2, 1], fist: 1, hand: -90 };

/** the reach envelope (0 = the pose's own arm, 1 = the blade tip on the target) */
const reachAmt = (f: number) => {
  if (f <= DIP_OFF) return f <= DIP_CONTACT ? mix(0.55, 1, eio(lin(f, -4, DIP_CONTACT), 1.6)) : 1 - sst(lin(f, DIP_LEAVE, DIP_OFF));
  if (f < REACH_A) return 0;
  if (f <= SCR_CONTACT) return eio(lin(f, REACH_A, SCR_CONTACT), 1.8);
  return 1 - sst(lin(f, WD_A, WD_B));
};
/** the blade's direction on screen (rad, SVG y down): pointing down-left at the dip (the hand above and to the right
 *  of the pustule), turned slowly in her fingers through the carry to nearly level, pointing right, for the girl (the
 *  hand to the left of her arm, below her face); a little anticipation and settle */
const DIP_ANGLE = (128 * Math.PI) / 180;
const GIRL_ANGLE = (-25 * Math.PI) / 180;
/** after the dabs the blade is turned down as she draws it back (away from the girl's face) */
const REST_ANGLE = (62 * Math.PI) / 180;
const bladeAngle = (f: number) => mix(mix(DIP_ANGLE, GIRL_ANGLE, backOut(lin(f, CARRY[0] + 2, CARRY[1] + 2), 0.08)), REST_ANGLE, backOut(lin(f, WD_A + 2, WD_B + 2), 0.08));
const bladeDir = (f: number): P2 => [Math.cos(bladeAngle(f)), Math.sin(bladeAngle(f))];
const inoX = (f: number) => mix(INO.X0, INO.X1, cosE(lin(f, CARRY[0], CARRY[1] + 4)));

/** an eased move with a little anticipation and a little overshoot that settles (zero speed at both ends):
 *  cosE(u) + a sin^2(pi u)(2u - 1); a 0.12 = about 3 % each way */
const backOut = (u: number, a = 0.12) => {
  const v = c01(u);
  const sn = Math.sin(Math.PI * v);
  return cosE(v) + a * sn * sn * (2 * v - 1);
};
const inoPose = (f: number): VPose => {
  const amt = reachAmt(f);
  const side = cosE(lin(f, CARRY[0], CARRY[1]));
  // the body turns first, the shoulder and elbow lead the carry, the wrist follows and the hand's angle comes last,
  // each landing with a small settle (overlap; no rigid rod from one pivot)
  const yaw = mix(-0.12, 0.12, cosE(lin(f, CARRY[0] - 2, CARRY[1] - 4)));
  const base = standAt(yaw);
  const uE = backOut(lin(f, CARRY[0] - 2, CARRY[1] - 6), 0.1);
  const uW = backOut(lin(f, CARRY[0] + 1, CARRY[1]), 0.14);
  const uH = cosE(lin(f, CARRY[0] + 4, CARRY[1] + 3));
  const cW = bezArm(DIP_READY, CARRY_MID, SCR_READY, uW);
  const cE = bezArm(DIP_READY, CARRY_MID, SCR_READY, uE);
  const cH = bezArm(DIP_READY, CARRY_MID, SCR_READY, uH);
  const carry: Arm = { w: cW.w, elbow: cE.elbow, fist: cW.fist, hand: cH.hand };
  // the draw-back after the dabs eases out with a small settle
  const wd = backOut(lin(f, WD_A, WD_B), 0.12);
  const arm = f >= WD_A ? lerpArm(SCR_READY, REST_R, wd) : carry;
  // the shoulders follow the hand a beat late: a lean and a little roll toward the side she works on, a slight
  // shoulder lift as she reaches
  const sideLag = cosE(lin(f, CARRY[0] + 4, CARRY[1] + 6));
  const q: VPose = {
    ...base,
    lean: mix(-3, 3.5, sideLag) * (0.5 + 0.5 * amt),
    hunch: 0.18 * amt,
    // at the landing her head lifts and turns three-quarter toward the girl, so her eyes read
    headYaw: mix(mix(-0.3, 0.3, side), 0.62, sst(lin(f, 96, 112))),
    pitch: mix(12 + 10 * amt, 3, sst(lin(f, 96, 112))),
    crouch: 4 + 10 * amt,
    roll: mix(3, -3, sideLag) * (0.4 + 0.6 * amt),
    look: [mix(mix(-0.6, 0.6, side), 0.7, sst(lin(f, 96, 112))), mix(0.6, 0.35, sst(lin(f, 96, 112)))],
    brow: 0.1,
    armR: arm,
    // the free hand hangs low behind the table (hidden by its apron), so only the lancet hand is over the table
    armL: { w: [-40, -112], elbow: [-0.3, 1], fist: 0.4, hand: 0 },
    reach: { arm: "R", amt },
  };
  return breathe(q, f, 0.5, 0.9);
};

// ---------------------------------------------------------------------------
// THE TARGETS: the pustule on his forearm, the scratch on the girl's upper arm (in each arm's own frame, so they
// ride the arm through the flinch)
// ---------------------------------------------------------------------------
type ArmFrame = { o: P2; d: P2; n: P2; s: number };
/** a point on an arm in its local frame: u along it (cast units), v across (+ = the arm's right of its direction) */
const onArm = (F: ArmFrame, u: number, v: number): P2 => add(F.o, add(mul(F.d, u * F.s), mul(F.n, v * F.s)));

// the three dab points in the girl's upper-arm frame (origin armSpot, d = shoulder -> elbow), on the bare lower part
// of the upper arm (the pushed-up sleeve covers the spot's upper side); radius = the dot left there (the same pox
// drawing as the sick man's pustules)
const DOTS: { p: P2; r: number }[] = [
  { p: [7.5, -1], r: 3.4 },
  { p: [12.5, 1.3], r: 3.0 },
  { p: [17, -0.6], r: 2.7 },
];
/** where the blade's tip is on the girl's arm (local), between dabs lifted off the skin in a small arc */
const dabLocal = (f: number): P2 => {
  const lift = (u: number) => -6 * Math.sin(Math.PI * c01(u));
  if (f <= DABS[0] + DAB_HOLD) return DOTS[0].p;
  for (let i = 0; i < DABS.length - 1; i++) {
    const a = DABS[i] + DAB_HOLD;
    const b = DABS[i + 1];
    if (f <= b) {
      const u = cosE(lin(f, a, b));
      const p = mix2(DOTS[i].p, DOTS[i + 1].p, u);
      return [p[0], p[1] + lift(u)];
    }
    if (f <= b + DAB_HOLD) return DOTS[i + 1].p;
  }
  return DOTS[DOTS.length - 1].p;
};
/** the pustules drawn large on his forearm (fractions along elbow -> wrist, radius in units); [0] is the one dipped */
const PUSTULES: [number, number, number][] = [
  [0.56, -4.6, 5.6],
  [0.3, -3.6, 4.2],
  [0.8, -2.8, 3.6],
];

// ---------------------------------------------------------------------------
// ONE FRAME OF THE WORLD (pure; also used by the checks)
// ---------------------------------------------------------------------------
export const frameState = (f: number) => {
  const cam = camOf(f);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame: f, scene: SCENE });
  const top = (X: number, Z: number): P2 => A.P.p(X, TABLE.top - 2, Z);
  // the sick man
  const sF = figAt(A, SICK.X, SICK.Z);
  const sQ = sickPose(f);
  const sGrip = { L: top(SICK_HAND.X, SICK_HAND.Z), R: top(SICK_FAR.X, SICK_FAR.Z) };
  const sOpt = { variant: 1, grip: sGrip, hold: { L: "none" as const, R: "none" as const } };
  const sAn = vaccineAnchors("inoculator", sQ, sF.at, sF.scale, sOpt);
  const sArm: ArmFrame = (() => {
    const d = norm(sub(sAn.wristL, sAn.elbowL));
    return { o: sAn.elbowL, d, n: [-d[1], d[0]], s: sF.scale };
  })();
  const fore = Math.hypot(sAn.wristL[0] - sAn.elbowL[0], sAn.wristL[1] - sAn.elbowL[1]) / sF.scale;
  const pustules = PUSTULES.map(([t, v, r]) => ({ c: onArm(sArm, fore * t, v), r }));
  // the girl and her mother
  const cF = figAt(A, CHILD.X, CHILD.Z);
  const cQ = childPose(f);
  const cGrip = { R: top(CHILD_HAND.X, CHILD_HAND.Z) };
  const cAn = vaccineAnchors("child", cQ, cF.at, cF.scale, { variant: CHILD.v, grip: cGrip });
  const cArm: ArmFrame = (() => {
    const d = norm(sub(cAn.elbowR, cAn.shoulderR));
    return { o: cAn.armSpotR, d, n: [-d[1], d[0]], s: cF.scale };
  })();
  const mF = figAt(A, MOTHER.X, MOTHER.Z);
  const mQ = motherPose(f);
  // her hand on the girl's shoulder: the one toward the mother (screen right), resting on its top
  const backSh = cAn.shoulderR[0] > cAn.shoulderL[0] ? cAn.shoulderR : cAn.shoulderL;
  const mGrip: P2 = add(backSh, mul([4, -9], cF.scale));
  const mAn = vaccineAnchors("parent", mQ, mF.at, mF.scale, { variant: 0, grip: { R: mGrip } });
  // the Inoculator
  const iF = figAt(A, inoX(f), INO.Z);
  const iQ = inoPose(f);
  const dab = dabLocal(f);
  const P0 = PUSTULES[0];
  const target0: P2 =
    f <= DIP_OFF
      ? (() => {
          // the dip: land on the pustule's top, press in a little, come away
          const press = sst(lin(f, DIP_CONTACT, DIP_CONTACT + 3)) * (1 - sst(lin(f, DIP_PRESS_END - 3, DIP_PRESS_END)));
          return onArm(sArm, fore * P0[0] + 0.6 * press, P0[1] - P0[2] + 1.8 * press);
        })()
      : onArm(cArm, dab[0], dab[1]);
  const hold = { L: "none" as const, R: "none" as const };
  const target: P2 = target0;
  // the solver leaves a small residual at full reach: aim past it once so the tip sits on the point
  // THE BIG LANCET: the cut draws its own (the cast's prop does not scale), at its own angle (bladeDir: one slow
  // eased turn in her fingers through the carry, never a whip around the wrist). The TIP's path is set here: from
  // where her hand would carry it (the pose with no reach) to the point, by the reach envelope, lifted in an arc while
  // partial; the hand (solved with no prop: its key = the hand's centre) is put one blade-length back along the blade
  // and corrected until the tip is exact.
  const dir = bladeDir(f);
  const len = BIG_LANCET.len * iF.scale;
  const qFree: VPose = { ...iQ, reach: undefined };
  const qReach: VPose = { ...iQ, reach: { arm: "R", amt: 1 } };
  const free = vaccineAnchors("inoculator", qFree, iF.at, iF.scale, { variant: 0, hold });
  const naturalTip = add(free.mittenR, mul(dir, len));
  const amt = reachAmt(f);
  // the arc: over his arm the blade comes down from above; at the girl it swings in and away low, below her face
  const lift = (f <= DIP_OFF ? 16 : -9) * iF.scale * Math.sin(Math.PI * amt);
  const desired: P2 = add(mix2(naturalTip, target, amt), [0, -lift]);
  const solve = (reachTo: P2) => vaccineAnchors("inoculator", qReach, iF.at, iF.scale, { variant: 0, hold, reachTo });
  const bigTip = (an: ReturnType<typeof solve>): P2 => add(an.mittenR, mul(dir, len));
  let aim: P2 = sub(desired, mul(dir, len));
  let iAn = solve(aim);
  for (let it = 0; it < 3; it++) {
    aim = add(aim, sub(desired, bigTip(iAn)));
    iAn = solve(aim);
  }
  const tip = bigTip(iAn);
  return { cam, A, aim, sF, sQ, sGrip, sOpt, sAn, sArm, pustules, cF, cQ, cGrip, cAn, cArm, mF, mQ, mGrip, mAn, iF, iQ, iAn, tip, target, hold, dab };
};

// ---------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------
const Room: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const p = P.p;
  const wallTone = (h: number) => mixHex(A.tone(mixHex(PLASTER.mid, PLASTER.lit, 0.35), WALL_Z, h), A.airHex(WALL_Z, h), 0.4);
  const W = WIN;
  const panes: React.ReactNode[] = [];
  const cols = 3;
  const rows = 2;
  const gx = 7;
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x0 = mix(W.X0, W.X1, i / cols) + gx / 2;
      const x1 = mix(W.X0, W.X1, (i + 1) / cols) - gx / 2;
      const y0 = mix(W.Y0, W.Y1, j / rows) + gx / 2;
      const y1 = mix(W.Y0, W.Y1, (j + 1) / rows) - gx / 2;
      panes.push(<path key={`p${i}${j}`} d={poly([p(x0, y0, WALL_Z), p(x1, y0, WALL_Z), p(x1, y1, WALL_Z), p(x0, y1, WALL_Z)])} fill={A.tone(mixHex("#F3EBDD", "#E4E9D6", 0.3 + 0.15 * j), WALL_Z * 0.6, 300)} />);
    }
  const posts = [-560, -60, 470];
  return (
    <g>
      <path d={poly([p(-1400, -ROOM_H, WALL_Z), p(1400, -ROOM_H, WALL_Z), p(1400, -ROOM_H, -900), p(-1400, -ROOM_H, -900)])} fill={A.tone(mixHex(BEAM.mid, BEAM.dark, 0.5), 200, ROOM_H)} />
      {[-200, 0, 200, 400].map((z) => (
        <AirBox key={`j${z}`} A={A} X0={-1400} X1={1400} Y0={-ROOM_H} Y1={-ROOM_H + 22} Z0={z} Z1={z + 26} mat={BEAM} uid={`joist${z}`} rim={0.2} />
      ))}
      <path d={poly([p(-1400, -ROOM_H, WALL_Z), p(1400, -ROOM_H, WALL_Z), p(1400, 0, WALL_Z), p(-1400, 0, WALL_Z)])} fill={wallTone(200)} />
      <defs>
        <linearGradient id="wallG" gradientUnits="userSpaceOnUse" x1="0" y1={p(0, -ROOM_H, WALL_Z)[1].toFixed(2)} x2="0" y2={p(0, 0, WALL_Z)[1].toFixed(2)}>
          <stop offset="0" stopColor={A.tone(PLASTER.dark, WALL_Z, 400)} stopOpacity={0.55} />
          <stop offset="0.3" stopColor={A.tone(PLASTER.dark, WALL_Z, 300)} stopOpacity={0} />
          <stop offset="0.75" stopColor={A.tone(PLASTER.dark, WALL_Z, 50)} stopOpacity={0} />
          <stop offset="1" stopColor={A.tone(PLASTER.dark, WALL_Z, 0)} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <path d={poly([p(-1400, -ROOM_H, WALL_Z), p(1400, -ROOM_H, WALL_Z), p(1400, 0, WALL_Z), p(-1400, 0, WALL_Z)])} fill="url(#wallG)" />
      <path d={poly([p(W.X0 - 12, W.Y0 - 12, WALL_Z), p(W.X1 + 12, W.Y0 - 12, WALL_Z), p(W.X1 + 12, W.Y1 + 12, WALL_Z), p(W.X0 - 12, W.Y1 + 12, WALL_Z)])} fill={A.tone(BEAM.mid, WALL_Z, 330)} />
      {panes}
      <AirBox A={A} X0={W.X0 - 22} X1={W.X1 + 22} Y0={W.Y1 + 10} Y1={W.Y1 + 20} Z0={WALL_Z - 16} Z1={WALL_Z} mat={BEAM} uid="sill" />
      {posts.map((x) => (
        <AirBox key={x} A={A} X0={x - 16} X1={x + 16} Y0={-ROOM_H} Y1={0} Z0={WALL_Z - 18} Z1={WALL_Z} mat={BEAM} uid={`post${x}`} />
      ))}
      <AirBox A={A} X0={-1400} X1={1400} Y0={-ROOM_H} Y1={-ROOM_H + 30} Z0={WALL_Z - 22} Z1={WALL_Z} mat={BEAM} uid="beam" />
      <AirFloor A={A} x0={-1400} x1={1400} z0={-700} z1={WALL_Z} mat={BEAM} course={260} plank={46} melt={0} jointAmt={0.8} />
      <AirShadow A={A} X={-200} Z={WALL_Z - 10} w={1300} d={22} uid="skirt" amt={0.5} />
    </g>
  );
};

const TABLE_MAT: Mat = { lit: "#A8875F", mid: "#7A5E42", dark: "#3E2E20" };
/** the table's top surface only (drawn before the Inoculator: her hands reach over it) */
const TableTop: React.FC<{ A: AirWorld }> = ({ A }) => {
  const T = TABLE;
  const p = A.P.p;
  return <path d={poly([p(T.X0, T.top, T.Z0), p(T.X1, T.top, T.Z0), p(T.X1, T.top, T.Z1), p(T.X0, T.top, T.Z1)])} fill={A.tone(mixHex(TABLE_MAT.lit, TABLE_MAT.mid, 0.25), (T.Z0 + T.Z1) / 2, 140)} />;
};
/** the table's front: the top's edge, the apron and the legs (drawn after the Inoculator: they stand in front of her) */
const TableFront: React.FC<{ A: AirWorld }> = ({ A }) => {
  const T = TABLE;
  const legs: [number, number][] = [
    [T.X0 + 8, T.Z1 - 8],
    [T.X1 - 8, T.Z1 - 8],
    [T.X0 + 8, T.Z0 + 8],
    [T.X1 - 8, T.Z0 + 8],
  ];
  return (
    <g>
      <AirShadow A={A} X={(T.X0 + T.X1) / 2} Z={(T.Z0 + T.Z1) / 2} w={150} d={60} uid="tblS" amt={0.6} />
      {legs.map(([x, z], i) => (
        <AirBox key={i} A={A} X0={x - T.leg / 2} X1={x + T.leg / 2} Y0={T.top + T.thick} Y1={0} Z0={z - T.leg / 2} Z1={z + T.leg / 2} mat={TABLE_MAT} uid={`leg${i}`} rim={0.3} />
      ))}
      <AirBox A={A} X0={T.X0 + 4} X1={T.X1 - 4} Y0={T.top + T.thick} Y1={T.top + T.thick + T.apron} Z0={T.Z0 + 4} Z1={T.Z1 - 4} mat={TABLE_MAT} uid="apron" rim={0.2} />
      <AirBox A={A} X0={T.X0} X1={T.X1} Y0={T.top} Y1={T.top + T.thick} Z0={T.Z0} Z1={T.Z1} mat={TABLE_MAT} uid="tblTop" />
    </g>
  );
};
/** a plain stool (seat height h units) */
const Stool: React.FC<{ A: AirWorld; X: number; Z: number; h: number; w: number; uid: string }> = ({ A, X, Z, h, w, uid }) => (
  <g>
    <AirShadow A={A} X={X} Z={Z} w={w * 0.8} d={w * 0.5} uid={`${uid}S`} amt={0.6} />
    {[
      [X - w / 2 + 5, Z + w / 2 - 5],
      [X + w / 2 - 5, Z + w / 2 - 5],
      [X - w / 2 + 5, Z - w / 2 + 5],
      [X + w / 2 - 5, Z - w / 2 + 5],
    ].map(([x, z], i) => (
      <AirBox key={i} A={A} X0={x - 3.5} X1={x + 3.5} Y0={-h + 6} Y1={0} Z0={z - 3.5} Z1={z + 3.5} mat={TABLE_MAT} uid={`${uid}l${i}`} rim={0.2} />
    ))}
    <AirBox A={A} X0={X - w / 2} X1={X + w / 2} Y0={-h} Y1={-h + 6} Z0={Z - w / 2} Z1={Z + w / 2} mat={TABLE_MAT} uid={`${uid}t`} />
  </g>
);

// ---------------------------------------------------------------------------
// THE SMALLPOX MATTER: the pustules, the speck on the blade, the mark in the scratch
// ---------------------------------------------------------------------------
const Pustule: React.FC<{ c: P2; s: number; r: number; opened: number; op?: number }> = ({ c, s, r, opened, op = 1 }) => (
  <g opacity={op}>
    <circle cx={c[0] + 0.3 * r * s} cy={c[1] + 0.35 * r * s} r={r * 1.12 * s} fill={POX_DEEP} opacity={0.55} />
    <circle cx={c[0]} cy={c[1]} r={r * s} fill={POX} />
    <circle cx={c[0] - 0.3 * r * s} cy={c[1] - 0.33 * r * s} r={r * (0.4 - 0.15 * opened) * s} fill={mixHex(POX, "#E9C9C4", 0.55)} opacity={0.9} />
    {opened > 0 ? <circle cx={c[0] + 0.1 * r * s} cy={c[1] - 0.62 * r * s} r={0.3 * r * s} fill={POX_DEEP} opacity={0.85 * opened} /> : null}
  </g>
);
const Speck: React.FC<{ c: P2; s: number; amt: number }> = ({ c, s, amt }) =>
  amt <= 0.01 ? null : (
    <g>
      <circle cx={c[0]} cy={c[1]} r={3.4 * s * Math.sqrt(amt)} fill={POX_DEEP} />
      <circle cx={c[0] - 0.8 * s} cy={c[1] - 0.9 * s} r={1.4 * s * Math.sqrt(amt)} fill={POX} />
    </g>
  );
/** the dots left on the girl's arm: each appears under the tip on its dab (the frame after the touch), swelling in
 *  over 4 frames; the same pustule drawing, colour and size range as the sick man's */
const Dots: React.FC<{ F: ArmFrame; f: number }> = ({ F, f }) => (
  <g>
    {DOTS.map((d, i) => {
      const g = sst(lin(f, DABS[i] + 0.5, DABS[i] + 4.5));
      if (g <= 0.001) return null;
      return <Pustule key={i} c={onArm(F, d.p[0], d.p[1])} s={F.s} r={d.r * (0.55 + 0.45 * g)} opened={0} op={g} />;
    })}
  </g>
);

/** the speck's amount on the blade: picked up as the tip leaves the pustule, left a third at each dab */
const speckAmt = (f: number) => sst(lin(f, DIP_LEAVE - 2, DIP_LEAVE + 3)) * (1 - 0.34 * sst(lin(f, DABS[0], DABS[0] + 3)) - 0.33 * sst(lin(f, DABS[1], DABS[1] + 3)) - 0.33 * sst(lin(f, DABS[2], DABS[2] + 3)));

/** the cut's own lancet, larger than the cast's: a bright steel leaf blade on a cream handle, drawn from the hand
 *  (the mitten centre) to the tip along the hand's line every frame, so it never slips */
const BIG_LANCET = { len: 33, blade: 16, handle0: 7, w: 3.6, bladeW: 4.4 };
const BigLancet: React.FC<{ mitten: P2; tip: P2; s: number }> = ({ mitten, tip, s }) => {
  const d = norm(sub(tip, mitten));
  const n: P2 = [-d[1], d[0]];
  const L = BIG_LANCET;
  const base = add(tip, mul(d, -L.blade * s));
  const h0 = add(mitten, mul(d, L.handle0 * s));
  const at = (u: number, v: number): P2 => add(add(base, mul(d, u * L.blade * s)), mul(n, v * s));
  const leaf = [at(0, L.bladeW / 2), at(0.35, L.bladeW * 0.58), at(0.8, L.bladeW * 0.22), at(1, 0), at(0.8, -L.bladeW * 0.22), at(0.35, -L.bladeW * 0.58), at(0, -L.bladeW / 2)];
  const half = [at(0, 0), at(0.35, -L.bladeW * 0.58), at(0.8, -L.bladeW * 0.22), at(1, 0)];
  const hw = (L.w / 2) * s;
  const handle = [add(h0, mul(n, hw)), add(base, mul(n, hw * 0.9)), add(base, mul(n, -hw * 0.9)), add(h0, mul(n, -hw))];
  return (
    <g>
      <path d={poly(handle)} fill="#EADFC6" stroke="#8C7B60" strokeWidth={0.5 * s} strokeLinejoin="round" />
      <path d={poly(leaf)} fill="#DDE3E3" stroke="#59625F" strokeWidth={0.55 * s} strokeLinejoin="round" />
      <path d={poly(half)} fill="#A9B2B3" opacity={0.75} />
      <path d={`M${Pt(at(0.05, 0.4))}L${Pt(at(0.86, 0.15))}`} stroke="#F7FAFA" strokeWidth={0.7 * s} strokeLinecap="round" />
      <path d={`M${Pt(add(base, mul(n, hw * 1.15)))}L${Pt(add(base, mul(n, -hw * 1.15)))}`} stroke="#7A6A50" strokeWidth={1.1 * s} strokeLinecap="round" />
    </g>
  );
};

/** the dense low air over the near floor and the table's front (screen space: the medium itself) */
const LowAir: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="lowAir" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3D342B" stopOpacity={0} />
        <stop offset="0.35" stopColor="#3D342B" stopOpacity={0.45} />
        <stop offset="1" stopColor="#363731" stopOpacity={0.82} />
      </linearGradient>
    </defs>
    <rect x={0} y={1000} width={1080} height={920} fill="url(#lowAir)" />
  </svg>
);

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const InoculateWithActualSmallpox: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const S = frameState(frame);
  const { A, cam } = S;
  const k = cam.k;
  const bladeDir = norm(sub(S.iAn.keyR, S.iAn.mittenR));
  const speckC = add(S.tip, mul(bladeDir, -3.2 * S.iF.scale));
  const wTop = A.P.p(WIN.X1, WIN.Y0, WALL_Z);
  const wBot = A.P.p(WIN.X1, WIN.Y1, WALL_Z);
  const toS = (p: P2): P2 => [540 + (p[0] - cam.cx) * k, 960 + (p[1] - cam.cy) * k];
  const win = { x: toS(wTop)[0], y0: toS(wTop)[1], y1: toS(wBot)[1], beams: 3 };
  // the figure is drawn in its SOLVED pose with the small cast lancet hidden (hold none); the big lancet goes on top
  const solvedPose: VPose = { ...S.iAn.pose, reach: undefined };
  const ino = (uid: string) => <VaccineFigure kind="inoculator" variant={0} pose={solvedPose} at={S.iF.at} scale={S.iF.scale} uid={uid} hold={{ L: "none", R: "none" }} frame={frame} fog={A.folkFog(INO.Z)} unitPx={k} />;
  return (
    <AirStage v={A.v} window={win} shaftsBehind={false} shafts={0.45} bloom={0} front={<LowAir />}>
      <WorldSvg cam={cam}>
        <Room A={A} />
        {/* the mother behind the girl */}
        <AirShadow A={A} X={MOTHER.X} Z={MOTHER.Z} w={56} d={26} uid="mS" amt={0.8} />
        <VaccineFigure kind="parent" variant={0} pose={S.mQ} at={S.mF.at} scale={S.mF.scale} uid="mother" grip={{ R: S.mGrip }} frame={frame} fog={A.folkFog(MOTHER.Z)} unitPx={k} />
        {/* the table's top; the girl at its right end; the Inoculator behind it; the table's front */}
        <TableTop A={A} />
        <Stool A={A} X={CHILD.X} Z={CHILD.Z} h={CHILD.seat} w={34} uid="stC" />
        <VaccineFigure kind="child" variant={CHILD.v} pose={S.cQ} at={S.cF.at} scale={S.cF.scale} uid="child" grip={S.cGrip} frame={frame} fog={A.folkFog(CHILD.Z)} unitPx={k} />
        <AirShadow A={A} X={inoX(frame)} Z={INO.Z} w={58} d={26} uid="iS" amt={0.8} />
        {ino("ino")}
        <TableFront A={A} />
        {/* the sick man on his stool at the left end */}
        <Stool A={A} X={SICK.X} Z={SICK.Z} h={SICK.seat} w={44} uid="stS" />
        <VaccineFigure kind="inoculator" variant={1} pose={S.sQ} at={S.sF.at} scale={S.sF.scale} uid="sick" grip={S.sOpt.grip} hold={S.sOpt.hold} inks={SICK_INKS} pox={1} frame={frame} fog={A.folkFog(SICK.Z)} unitPx={k} />
        {S.pustules.map((pu, i) => (
          <Pustule key={i} c={pu.c} s={S.sF.scale} r={pu.r} opened={i === 0 ? sst(lin(frame, DIP_CONTACT, DIP_LEAVE)) : 0} />
        ))}
        {/* the dots on the girl's arm, the big lancet and its speck on top */}
        <Dots F={S.cArm} f={frame} />
        <BigLancet mitten={S.iAn.mittenR} tip={S.tip} s={S.iF.scale} />
        <Speck c={speckC} s={S.iF.scale} amt={speckAmt(frame)} />
      </WorldSvg>
    </AirStage>
  );
};

export default InoculateWithActualSmallpox;
