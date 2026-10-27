// ---------------------------------------------------------------------------
// LibraryOfCulturalEvolution (kyle-vaccine, cut 76). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 166 frames. The second cut in the LIBRARY OF CULTURAL EVOLUTION (libraryWorld.tsx, the
// shared world of cuts 68 + 76): it opens on cut 68's (StoreThatInformation) last frame exactly.
//
// CHECK LINE: "Jenner's book is one among countless books that people of every age keep adding to — one vast shared
// library."
//
// THE LINE: "[We can go on to the next problem because] that's now been like collectively stored in the library of
// cultural evolution."
// WORD -> FRAME (f0 = 76.510 s): that's 2 · now 12 · been 16 · like 24 · COLLECTIVELY 31 · STORED 46 · in 71 · the 81 ·
// LIBRARY 82 · of 93 · CULTURAL 109 · EVOLUTION 129 · (We 155) · end 166
// DURATION: the slot 76.510 -> 82.049 s = 5.539 s x 29.97 = 166 frames (f0..f165).
//
// THE MOTION: ONE calm crane pull-back from Jenner's glowing book (cut 68's last frame: k 5.08, the spine centred) up
// and back until the hall reads (CAM76: log zoom 5.08 -> 0.75, the eye 1.69 m -> 5.6 m up, its distance 1130 -> 2200,
// the book's screen row 907 -> 945, all on one progress: a single symmetric velocity lobe f0-f112 peaking at f46, 90 %
// of the travel by LIBRARY f82, settled by CULTURAL ~f110, then a slow creep to the end). Jenner steps back half a
// pace toward the aisle (f3-f27), his left hand staying at his lapel, the other coming to his waistcoat front (no
// hand hangs into the caption band while he is big), his head turning out to the hall. As the neighbouring shelves
// enter the frame, people of other eras each slide one book home on their own beat, nearest first (a ripple outward
// from Jenner's book): a Roman freeman (lands f46, STORED), Pasteur (f62), a present-day commuter on the rolling
// ladder (covidFolk, f80, the top shelf). (See REV1 / REV2 below for how each one moves.)
// f110-f165: the settled, living hall (stack 0's two levels of thousands of spines, the aisle and the rows of stacks
// running into the haze, the galleries, the barrel vault and the end window; the figures ~200 px; the worker on his
// ladder; the orange spine a warm point at x ~560, y ~945), motes, breathing, the glow breathing, a slow creep.
// Orange = the vaccine knowledge only: Jenner's shelved book and its light (its ShelfGlow grows as the camera pulls
// back, so it survives the distance). Everyone else's book is cream / oatmeal; people never orange.
// THE JOIN: f0 draws cut 68's world frame 130 with storeItems(A, STORE_LAST) (Jenner's figure re-drawn here from the
// same pose, grip and inks) on air76(STORE_END_CAM) == libraryAir(STORE_END_CAM, 130) (asserted below). Shelvers wholly
// off the frame are not drawn (the f0 frame is cut 68's last pixel for pixel; proof: still-vs-still difference).
//
// DEPTH: libraryWorld's units. The eye is free here (air76: the eye's X = cam.cx, height eyeY, distance Dc), and things
// fog by world depth with cut 68's last eye distance as the offset (fogBy "depth": the far hall does not bury the
// payoff). Stack 0's face Z 0, the figures' feet Z -40 (the worker on the 4th rung of the left ladder, Z -60), the
// vaccine slot X -416, Y -236. Below the stacks the open floor sinks into the dense low air (lowAir, from y ~1150).
//
// REV1 (Oct 26 evening, the user: "these people also have pretty weird movement"): natural shelving. Each floor shelver
// takes one walk cycle in toward the slot (feet planted, `at` follows the step), the FAR (leading) arm carries the book
// up into the gap with a bent elbow while the body leans in and the head lifts, the hand moves onto the spine and gives
// a small push (contact L-7, home L), lingers on the shelf lip, then both hands come down (elbow first) to rest
// together at the waist; the near hand holds the book's tail at the chest while carrying, then rests at the chest.
// The slots are at shoulder height (shelf 2). The commuter now stands on the rolling ladder (back three-quarter, one
// hand on the rail; the c.1900 Worker's rigid 2.5D arm was dropped). Cut 68 REV1 ends with Jenner out of shot at
// jennerPos(130): here he stands there from jennerPose(130 + f) (his far hand behind his hip as 68 leaves it), his
// left hand coming up to his lapel while still out of shot (f2-f18), revealed by the pull-back from ~f31.
// REV2 (Oct 27, the user: "the other ppls hands and arms glitch here also a bit", f~30; the director: as the Roman
// enters, his forearm and the book pop between frames, hands and book do not move as one, the near hand passes through
// the book). Every shelver now: (1) both hands are FIXED to the book while they hold it (the far hand at its hold by the
// spine edge, then on the spine for the push; the near hand under its bottom edge), so hand and book move as one; the
// grips land exactly (probe: hand-to-grip <= 0.05 px); (2) ONE draw order for the whole action, the book behind the
// figure (carried out in front of the chest, clear of the torso), the hands over it: no swap, no cross-fade; (3) each
// gripping arm's elbow hint is set every frame across its own shoulder->wrist line (bendHint): the rigs' soft elbow
// bends fully on one side, so the forearm and upper arm keep their lengths and the elbow never flips (rev 1: the hint
// lay along the arm as the hand passed the shoulder, the forearm shrank and flipped in 1-2 frames); (4) the hand swings
// about the shoulder (swing) on the lift and on the way down, never folding through it (arm stays at 0.45-0.87 of its
// length); the feet stand 85 from the slot so both hands reach. The Roman stands still (no step) and lifts the book
// from the chest while still at the frame's edge (f10-f32), lines it up (12 -> 7 out), then pushes; the near hands come
// down to the belt only once the belt is above the caption band. Jenner's lapel arm gets bendHint too (from f3).
// SOURCES: none on screen. Casts: vaccineFolk (Jenner, Pasteur), romeFolk (Freeman), covidFolk (Commuter), all
// imported read-only. (The Greek scholar of the first round was dropped: at the less wide end only the
// left face of stack 0 is in frame, room for four shelvers.)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR_SCENE_EYE, AirShadow, AirStage, FIG_FOG, RomeFolk, WorldSvg, c01, fogHex, lerp, makeAirView, mixHex, perspective, rgbHex, swayCam, type AirWorld, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Book, DEPTH, LIB_BLOOM, LIB_REST, LIB_SCENE, LibraryStage, STORE_END_CAM, STORE_LAST, ShelfGlow, VACCINE_SLOT, VB, booksOn, libraryAir, slotAt, storeCamBase, vec3, type BookPose, type LibItem, type RowRef, type V3 } from "./libraryWorld";
import { jennerPose, jennerPos, storeItems } from "./StoreThatInformation";
import { Jenner, Pasteur, breathe as vBreathe, standAt as vStandAt, vaccineAnchors, walkPose, type VPose } from "./vaccineFolk";
import * as Covid from "../kyle-covid/covidFolk";
import { WORKER_INKS } from "../kyle-pandemics/pandemicFolk";

export const FPS = 30000 / 1001;
export const DURATION = 166;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** the world frame of cut 76's frame f (cut 68's frame 130 = our f0) */
const W0 = STORE_LAST;
const REST_DC = perspective(LIB_REST, DEPTH).Dc;
const D0 = perspective(STORE_END_CAM, DEPTH).Dc;

/** the medium on our camera: libraryAir's AirWorld, but the eye's height and distance are free (a crane), and things
 *  fog by world depth with cut 68's last eye distance as the offset (so f0 is exactly libraryAir, and the pull-back
 *  does not bury the payoff) */
export const air76 = (cam: Cam, eyeY: number, Dc: number, frame: number, fogD = D0): AirWorld => {
  const depth = { eyeY, dRef: Dc, kRef: cam.k, dolly: 0 };
  const P = perspective(cam, depth);
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const v = makeAirView({
    scene: { ...AIR_SCENE_EYE, ...LIB_SCENE, F: Dc * cam.k },
    frame,
    horizon: toSY(eyeY),
    cam: { x: cam.cx, y: -eyeY, z: -Dc },
    rest: { x: LIB_REST.cx, y: -DEPTH.eyeY, z: -REST_DC },
  });
  const dist = (Z: number) => fogD + Z;
  const fog = (Z: number) => c01(v.fogAt(dist(Z)));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(dist(Z), h));
  const tone = (hex: string, Z: number, h = 0) => fogHex(v, hex, dist(Z), h);
  const toneO = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.5 * fog(Z));
  const ff = FIG_FOG;
  const figFog = (Z: number) => ff.max * (1 - Math.exp(-Math.max(0, Z - ff.near) / ff.vis));
  const folkFog = (Z: number, feetH = 0) => ({ rgb: airHex(Z, feetH + 150), amount: figFog(Z) });
  const workerInks = (Z: number, feetH = 0) => {
    const air = airHex(Z, feetH + 160);
    const t = figFog(Z);
    return Object.fromEntries(Object.entries(WORKER_INKS).map(([key, c]) => [key, key === "orange" ? c : mixHex(c, air, t)])) as typeof WORKER_INKS;
  };
  return { v, P, cam, Dc, k: cam.k, fog, airHex, tone, toneO, screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))), figFog, folkFog, workerInks, lw: (b = 1.1) => b / Math.pow(cam.k, 0.6) };
};

/** a camera holding the 3D point Q at screen y sy, the eye at (cx, eyeY, -Dc) */
const camHold = (k: number, cx: number, eyeY: number, Dc: number, Q: [number, number, number], sy: number): Cam => {
  const r = Dc / (Dc + Q[2]);
  const y2 = eyeY + (Q[1] - eyeY) * r;
  return { k, cx, cy: y2 - (sy - 960) / k };
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERA: one crane pull-back. Channels (log zoom, eye distance, eye height, eye X, the book's screen row) all ride
// ONE progress U(f): a single velocity lobe (up f0-f20, down to ~0 by f118; 93 % of the travel by LIBRARY f82) plus a
// slow even creep over the whole cut (the living end).
// ---------------------------------------------------------------------------------------------------------------------
const BASE0 = storeCamBase(W0);
const BOOKQ: [number, number, number] = [VACCINE_SLOT.X, VACCINE_SLOT.Y - VB.h * 0.5, VACCINE_SLOT.Z];
export const CAM76 = {
  k: [BASE0.k, 0.75] as const,
  Dc: [D0, 2200] as const,
  eyeY: [DEPTH.eyeY, -1000] as const,
  cx: [BASE0.cx, -447] as const,
  sy: [960 + (BOOKQ[1] - BASE0.cy) * BASE0.k, 945] as const,
  lobe: [0, 46, 112] as const,
  creep: 0.03,
};
const LOBE = (() => {
  const [a, pk, b] = CAM76.lobe;
  const v = (f: number) => {
    if (f <= a || f >= b) return 0;
    if (f < pk) return 0.5 * (1 - Math.cos((Math.PI * (f - a)) / (pk - a)));
    const x = (f - pk) / (b - pk);
    return 0.5 * (1 + Math.cos(Math.PI * x));
  };
  const n = (b - a) * 8;
  const cum: number[] = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + v(a + ((i - 0.5) / n) * (b - a)));
  return (f: number) => {
    const t = ((f - a) / (b - a)) * n;
    if (t <= 0) return 0;
    if (t >= n) return 1;
    const i = Math.floor(t);
    return lerp(cum[i], cum[i + 1], t - i) / cum[n];
  };
})();
/** the move's progress: the lobe, plus the creep (an even slope over the cut, taken out of the lobe's share) */
export const camU = (f: number) => LOBE(f) * (1 - CAM76.creep) + CAM76.creep * (f / (DURATION - 1));
export const camState = (f: number) => {
  const u = camU(f);
  const L = (c: readonly [number, number]) => lerp(c[0], c[1], u);
  const k = Math.exp(lerp(Math.log(CAM76.k[0]), Math.log(CAM76.k[1]), u));
  const Dc = Math.exp(lerp(Math.log(CAM76.Dc[0]), Math.log(CAM76.Dc[1]), u));
  return { u, k, Dc, eyeY: L(CAM76.eyeY), cx: L(CAM76.cx), sy: L(CAM76.sy) };
};
export const cam76 = (f: number) => {
  const s = camState(f);
  return { ...s, cam: swayCam(camHold(s.k, s.cx, s.eyeY, s.Dc, BOOKQ, s.sy), W0 + f) };
};

// ---------------------------------------------------------------------------------------------------------------------
// THE SHELVERS: people of every era, each sliding one book into a shelf of the library on its own beat
// ---------------------------------------------------------------------------------------------------------------------
const smooth = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (6 * x - 15) + 10);
};
type P2 = [number, number];
type CastKind = "rome" | "covid" | "pasteur";
export type Shelver = {
  id: string;
  cast: CastKind;
  variant: number;
  /** feet (world X, Z) at rest beside the slot (X derived from the slot and `reach`) */
  X: number;
  Z: number;
  /** facing: 1 = screen right (the slot to his right) */
  dir: 1 | -1;
  /** the face and the shelf, and the X the slot is picked near */
  side: "L" | "R";
  shelf: number;
  slotX: number;
  /** the frame the book is home */
  land: number;
  /** the new book's colour (cream / oatmeal, never near orange) */
  col: string;
  /** the feet's height (0 the floor; a ladder rung) */
  feetY?: number;
  /** how far to the side of the slot the feet stand after the step in (a short reach: the elbow bends) */
  reach?: number;
  /** the step in: units walked toward the slot before the reach (one walk cycle = two small steps) */
  stepIn?: number;
  /** the frame the hands start down into the rest pose (late enough that the hands stay above the caption band) */
  restAt?: number;
  /** the lift starts this many frames before the landing (default 24) and takes reachLen frames (default 16) */
  reachFrom?: number;
  reachLen?: number;
  /** on the rolling ladder: back three-quarter to us, the near hand holding the rail */
  ladder?: boolean;
};
const BOOK_D = 30;
/** the person on the ladder faces it: back three-quarter, turned to the right */
const LADDER_YAW = 2.3;
const LADDER_FAR: "L" | "R" = "L";
/** the left rolling ladder (libraryWorld LADDERS[0]: X -930 on stack 0): the Worker stands on its 4th rung */
const LADDER_RUNG = (() => {
  const t = 4 / 10.6;
  return { X: -930, Y: lerp(0, -444, t), Z: lerp(-92, -6, t) };
})();
const SHELVERS0: Shelver[] = [
  { id: "rom", cast: "rome", variant: 0, X: 0, Z: -40, dir: 1, side: "L", shelf: 2, slotX: -516, land: 46, col: "#D9C9A5", reach: 85, stepIn: 0, restAt: 50, reachFrom: 36, reachLen: 22 },
  { id: "pas", cast: "pasteur", variant: 0, X: 0, Z: -40, dir: 1, side: "L", shelf: 2, slotX: -718, land: 62, col: "#E6DAC0", reach: 85, stepIn: 40, restAt: 66 },
  { id: "com", cast: "covid", variant: 0, X: -930, Z: LADDER_RUNG.Z, feetY: LADDER_RUNG.Y, dir: 1, side: "L", shelf: 0, slotX: -825, land: 80, col: "#D9C9A5", stepIn: 0, restAt: 90, ladder: true },
];
/** the existing spine nearest X on that shelf (the new book covers it exactly: it reads as pushed home) */
const slotNear = (side: "L" | "R", shelf: number, X: number) => {
  const row: RowRef = { side, stack: 0, level: 0 };
  const n = booksOn(row, shelf);
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < n; i++) {
    const sl = slotAt(row, shelf, i);
    const d = Math.abs(sl.X - X) + (Math.abs(sl.tilt) > 1.5 ? 1000 : 0);
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return slotAt(row, shelf, best);
};
export const SLOTS = Object.fromEntries(SHELVERS0.map((s) => [s.id, slotNear(s.side, s.shelf, s.slotX)]));
export const SHELVERS: Shelver[] = SHELVERS0.map((s) => (s.ladder ? s : { ...s, X: SLOTS[s.id].X - s.dir * (s.reach ?? 60) }));

/** REV2: the beats of one shelving, from its landing frame L (the book home). The book is carried in the FAR hand at the
 *  far hip (the near hand rests on the belt the whole time); step in L-38..L-18 (feet planted), reach L-24..L-8 (the
 *  far hand lifts the book up into the gap, turning it spine-out, the elbow bent, the body leaning in), the hand slides
 *  onto the spine L-11..L-7, a small push L-7..L (hand and book as one), release L+1..L+6 onto the shelf lip, then the
 *  far arm comes down to the belt from restAt */
const phases = (s: Shelver, f: number) => {
  const L = s.land;
  const rest = s.restAt ?? L + 10;
  return {
    step: smooth((f - (L - 38)) / 20),
    reach: smooth((f - (L - (s.reachFrom ?? 24))) / (s.reachLen ?? 16)),
    onSpine: smooth((f - (L - 11)) / 4),
    push: smooth((f - (L - 7)) / 7),
    release: smooth((f - (L + 1)) / 5),
    down: smooth((f - rest) / 15),
    nearLip: smooth((f - (L - 3)) / 5),
    nearDown: smooth((f - (rest - 2)) / 15),
  };
};
/** the feet's X: one walk cycle toward the slot (the step) with short soft ends; `at` follows it exactly */
const feetX = (s: Shelver, f: number) => {
  const st = s.stepIn ?? 0;
  const ph = phases(s, f);
  return s.X - s.dir * st * (1 - ph.step);
};
const frameOfYaw = (psi: number): Omit<BookPose, "c"> => {
  const ez: V3 = [Math.sin(psi), 0, Math.cos(psi)];
  const ey: V3 = [0, -1, 0];
  return { ex: vec3.cross3(ez, ey), ey, ez };
};
/** the far hand's hold on the book, in the book's frame: on the cover by the spine edge, a little below the middle (the
 *  hand is fixed to the book there while it carries it: hand and book move as one) */
const HOLD_IN = 3;
const HOLD_DOWN = 0.12;
const holdOn = (B: BookPose, h: number): V3 => vec3.add3(vec3.add3(B.c, vec3.mul3(B.ez, HOLD_IN)), vec3.mul3(B.ey, -h * HOLD_DOWN));
/** where the far hand carries the book (world): in both hands at the chest, out in front of it (clear of the torso:
 *  the book is drawn behind the figure all through); on the ladder at the chest, between him and the shelf */
const carryHold = (s: Shelver, X: number): V3 => (s.ladder ? [s.X + 26, (s.feetY ?? 0) - 170, s.Z + 14] : [X + s.dir * 56, -246, s.Z - 10]);
/** the near hand's hold, in the book's frame: under its bottom edge, a third of the way back from the spine */
const underOf = (B: BookPose, h: number): V3 => vec3.add3(vec3.add3(B.c, vec3.mul3(B.ez, BOOK_D * 0.36)), vec3.mul3(B.ey, -h * 0.5));
/** a point swung about a centre: the polar interpolation (radius and angle, mirrored by dir) from a to b. A hand that
 *  swings about the shoulder keeps its distance from it (the arm never folds through the shoulder: the elbow moves
 *  only as the hand does) */
const swing = (S: P2, a: P2, b: P2, t: number, dir: number): P2 => {
  const pol = (p: P2) => {
    const dx = (p[0] - S[0]) * dir;
    const dy = p[1] - S[1];
    return [Math.hypot(dx, dy), Math.atan2(dy, dx)];
  };
  const [ra, aa] = pol(a);
  const [rb, ab] = pol(b);
  const rr = lerp(ra, rb, t);
  const an = lerp(aa, ab, t);
  return [S[0] + dir * rr * Math.cos(an), S[1] + rr * Math.sin(an)];
};
/** the far shoulder's nominal place (world, the figure's plane) when the rig's is not at hand (the cull) */
const SHOULDER_NOM: P2 = [27, -249];
/** the book's 3D pose at frame f: carried at the far hip (cover to us, spine toward the slot), lifted up into the gap
 *  (sticking out 12) turning spine-out, a small push home. REV2: the hand's hold point swings about the far shoulder
 *  `Sh` (world X, Y; the rig's, from shelverRig) from the hip up to the gap: the arm swings forward and up like a
 *  pendulum (rev 1 lifted it straight up past the shoulder, folding the arm through it) */
export const bookPoseOf = (s: Shelver, f: number, Sh?: P2): BookPose => {
  const sl = SLOTS[s.id];
  const ph = phases(s, f);
  const X = feetX(s, f);
  const S: P2 = Sh ?? [(s.ladder ? s.X : X) + s.dir * SHOULDER_NOM[0], (s.feetY ?? 0) + SHOULDER_NOM[1]];
  const psi0 = -s.dir * Math.PI * 0.5;
  const r = ph.reach;
  const psi = lerp(psi0, 0, smooth((r - 0.05) / 0.85));
  const fr = frameOfYaw(psi);
  const holdOff = (q: Omit<BookPose, "c">): V3 => vec3.add3(vec3.mul3(q.ez, HOLD_IN), vec3.mul3(q.ey, -sl.h * HOLD_DOWN));
  const h0 = carryHold(s, X);
  // the hold point with the book in the gap (spine-out, sticking out 12)
  const h1 = vec3.add3([sl.X, sl.Y - sl.h / 2, sl.Z - 12], holdOff(frameOfYaw(0)));
  // a lift that ends well before the push (the Roman's, done before he is in view): the book creeps on into the gap
  // (12 -> 7 out) while he lines it up, so nothing freezes
  const rEnd = s.land - (s.reachFrom ?? 24) + (s.reachLen ?? 16);
  const win = s.land - 7 - rEnd;
  if (win > 3) h1[2] += 5 * smooth((f - rEnd) / win);
  const hp = swing(S, [h0[0], h0[1]], [h1[0], h1[1]], r, s.dir);
  const hand: V3 = [hp[0], hp[1], lerp(h0[2], h1[2], r)];
  let c = vec3.sub3(hand, holdOff(fr));
  const home: V3 = [sl.X, sl.Y - sl.h / 2, sl.Z];
  c = vec3.add3(vec3.mul3(c, 1 - ph.push), vec3.mul3(home, ph.push));
  return { c, ...fr };
};

/** the body: three-quarter toward the slot; the step (walk cycle with planted feet); a lean into the reach and a little
 *  stretch up; the head lifts to the gap and settles; breathing */
const castPose = (s: Shelver, f: number) => {
  const ph = phases(s, f);
  const yaw = s.dir * 1.05;
  const lookUp = smooth((f - (s.land - 30)) / 16) * (1 - 0.7 * ph.down);
  const leanIn = Math.sin((Math.PI / 2) * ph.reach) * (1 - ph.release * 0.7) * (1 - ph.down);
  const base0 =
    s.cast === "pasteur" ? vBreathe(vStandAt(yaw), f + 40, 0.8, 2) : s.cast === "covid" ? Covid.breathe(s.ladder ? Covid.POSES.turnTo(LADDER_YAW) : Covid.POSES.stand(s.dir), f) : RomeFolk.idle({ ...RomeFolk.POSES.stand(s.dir), yaw }, f, 1);
  const base = { ...base0, headYaw: (s.cast === "covid" ? base0.headYaw : yaw) + s.dir * 0.12 * lookUp * (s.ladder ? -1 : 1), pitch: (base0.pitch ?? 0) - 12 * lookUp, lean: (base0.lean ?? 0) + s.dir * 5 * leanIn, crouch: (base0.crouch ?? 0) - 2.5 * leanIn };
  // the step: one cycle of the cast's walk (two small planted steps), its amount eased in and out
  const st = s.stepIn ?? 0;
  if (st > 0 && ph.step > 0 && ph.step < 1) {
    const amt = smooth(ph.step / 0.22) * smooth((1 - ph.step) / 0.22);
    return walkPose(base as VPose, ph.step, amt, st / 2) as typeof base;
  }
  return base;
};

type Grip = { L?: P2; R?: P2 };
type ArmAnchors = { shoulderL: P2; shoulderR: P2; wristL: P2; wristR: P2; handL: P2; handR: P2; hip: P2 };
type Posed = { armL: { elbow: P2 }; armR: { elbow: P2 } };
/** a cast member's anchors (world px) for a pose and grips */
const anchorsOf = (s: Shelver, pose: unknown, at: P2, scale: number, grip?: Grip): ArmAnchors => {
  if (s.cast === "pasteur") return vaccineAnchors("pasteur", pose as VPose, at, scale, { grip, hold: { L: "none", R: "none" } });
  if (s.cast === "covid") return Covid.covidAnchors("commuter", pose as Covid.CovidPose, at, scale, { variant: s.variant, grip }) as unknown as ArmAnchors;
  return RomeFolk.romeAnchors("freeman", pose as RomeFolk.FigPose, at, scale, { variant: s.variant, grip }) as unknown as ArmAnchors;
};
/** REV2: each gripping arm's elbow hint set from its own shoulder->wrist line (the unit normal, on side `side`). The
 *  rigs' soft elbow bends fully only when the hint lies across the arm; near the arm's line it shortens both bones and,
 *  as the hand passes the shoulder, flips the elbow to the other side in a frame or two (the rev-1 forearm pops). With
 *  the hint across the arm every frame, the elbow always bends fully on the same side: the bones keep their lengths and
 *  the elbow moves only as the hand does. side +1 = the elbow below / behind for a figure facing screen right. */
export const bendHint = <Q extends Posed>(pose: Q, grip: Grip, side: number, anchors: (q: Q) => ArmAnchors): Q => {
  let q = pose;
  const across = (S: P2, W: P2): P2 => {
    const d: P2 = [W[0] - S[0], W[1] - S[1]];
    const l = Math.hypot(d[0], d[1]) || 1;
    return [(-side * d[1]) / l, (side * d[0]) / l];
  };
  for (let it = 0; it < 3; it++) {
    const a = anchors(q);
    q = { ...q, armL: grip.L ? { ...q.armL, elbow: across(a.shoulderL, a.wristL) } : q.armL, armR: grip.R ? { ...q.armR, elbow: across(a.shoulderR, a.wristR) } : q.armR };
  }
  return q;
};
const bez = (a: P2, c: P2, b: P2, u: number): P2 => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];

/** one shelver's rig at frame f: the pose (elbows set by bendHint), the grips (world px), where he stands, the book;
 *  the far and near hands' keys. Exported for the probes (hand-to-grip distances, elbows) */
export const shelverRig = (A: AirWorld, s: Shelver, f: number) => {
  const sl = SLOTS[s.id];
  const ph = phases(s, f);
  const P = (p: V3): P2 => A.P.p(p[0], p[1], p[2]);
  const X = feetX(s, f);
  const at = A.P.p(X, s.feetY ?? 0, s.Z);
  const scale = A.P.r(s.Z);
  const mix = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const fkey: "L" | "R" = s.ladder ? LADDER_FAR : s.dir === 1 ? "R" : "L";
  const nkey: "L" | "R" = fkey === "R" ? "L" : "R";
  const pose0 = castPose(s, f);
  const a0 = anchorsOf(s, pose0, at, scale);
  const S0 = fkey === "R" ? a0.shoulderR : a0.shoulderL;
  const B = bookPoseOf(s, f, [X + (S0[0] - at[0]) / scale, (s.feetY ?? 0) + (S0[1] - at[1]) / scale]);
  // the rest: the hands on the belt in front (following the hips: the lean, the crouch, the step); on the ladder the
  // far hand hangs, the near hand holds the rail (the rail nearer the slot, at chest height)
  const rest: { L: P2; R: P2 } = s.ladder
    ? { L: a0.handL, R: a0.handR }
    : (() => {
        const far: P2 = [a0.hip[0] + s.dir * 12 * scale, a0.hip[1] - 24 * scale];
        const near: P2 = [a0.hip[0] + s.dir * 2 * scale, a0.hip[1] - 28 * scale];
        return s.dir === 1 ? { R: far, L: near } : { L: far, R: near };
      })();
  const rail: P2 = A.P.p(-930 + s.dir * 26, (s.feetY ?? 0) - 200, lerp(-92, -6, ((s.feetY ?? 0) - 200) / -444));
  // the FAR hand: fixed to the book at its hold while carrying and lifting it, slides onto the spine's lower third for
  // the push (fixed to the book again: hand and book move as one), lifts off onto the shelf lip below it, then swings
  // down about the shoulder to its rest
  const hold = P(holdOn(B, sl.h));
  const spine = P(vec3.add3(vec3.add3(B.c, vec3.mul3(B.ez, -1.5)), vec3.mul3(B.ey, -sl.h * 0.3)));
  const lip = A.P.p(sl.X + s.dir * 2, sl.Y + 6, sl.Z - 4);
  const H = mix(mix(hold, spine, ph.onSpine), lip, ph.release);
  const Hd = ph.down > 0 ? swing(S0, H, rest[fkey], ph.down, s.dir) : H;
  // the NEAR hand: on the belt (on the ladder: the rail) the whole time
  // REV2: the near hand under the book's bottom edge (fixed to the book: they move as one) from the carry through
  // the push; it slides off onto the shelf lip with the push's end, and from restAt - 2 swings down about its
  // shoulder to the belt (late enough that it stays above the caption band while the figure is big)
  const Sn = nkey === "R" ? a0.shoulderR : a0.shoulderL;
  const lipN = A.P.p(sl.X - s.dir * 3, sl.Y + 4, sl.Z - 6);
  const Nb = mix(P(underOf(B, sl.h)), lipN, ph.nearLip);
  const N = s.ladder ? rail : ph.nearDown > 0 ? swing(Sn, Nb, rest[nkey], ph.nearDown, s.dir) : Nb;
  const grip = { [fkey]: Hd, [nkey]: N } as Grip;
  const pose = bendHint(pose0 as Posed, grip, s.dir, (q) => anchorsOf(s, q, at, scale, grip)) as typeof pose0;
  return { sl, ph, B, X, at, scale, pose, grip, fkey, nkey, anchors: () => anchorsOf(s, pose, at, scale, grip) };
};

/** probe: when given, each figure's hands and head (world px) are pushed here (the caption-band check) */
export const shelverItems = (A: AirWorld, s: Shelver, f: number, probe?: { id: string; pts: P2[] }[]): LibItem[] => {
  const B0 = bookPoseOf(s, f);
  // cull a figure wholly off the frame (screen x of its body and its book, with a margin)
  {
    const X = feetX(s, f);
    const at = A.P.p(X, s.feetY ?? 0, s.Z);
    const scale = A.P.r(s.Z);
    const sx = (wx: number) => 540 + (wx - A.cam.cx) * A.k;
    const bx = sx(A.P.p(B0.c[0], B0.c[1], B0.c[2])[0]);
    const x0 = Math.min(sx(at[0] - 130 * scale), bx - 60);
    const x1 = Math.max(sx(at[0] + 130 * scale), bx + 60);
    if (x1 < -20 || x0 > 1100) return [];
  }
  const R = shelverRig(A, s, f);
  const { sl, B, X, at, scale, pose, grip } = R;
  const bw = Math.max(sl.w, 9);
  const fog = A.folkFog(s.Z);
  const uid = `${s.id}`;
  if (probe) probe.push({ id: s.id, pts: [grip[R.fkey] as P2, grip[R.nkey] as P2, [at[0], at[1] - 280 * scale]] });
  const fig = () => {
    const common = { at, scale, fog, unitPx: A.k, grip } as const;
    if (s.cast === "pasteur") return <Pasteur key={uid} uid={uid} pose={pose as VPose} {...common} hold={{ L: "none", R: "none" }} frame={f} />;
    if (s.cast === "covid") return <Covid.Commuter key={uid} uid={uid} variant={s.variant} pose={pose as Covid.CovidPose} {...common} frame={f} hold={{ L: "none", R: "none" }} />;
    return <RomeFolk.Freeman key={uid} uid={uid} variant={s.variant} pose={pose as RomeFolk.FigPose} {...common} />;
  };
  // ONE draw order for the whole action: the book behind the figure (at his far hip, then beside him in the gap), the
  // hand on its near face drawn over it; no swap
  const items: LibItem[] = [
    { Z: s.ladder ? -96 : s.Z, key: `${uid}fig`, node: fig },
    { Z: s.ladder ? -2 : s.Z + 4, key: `${uid}bk`, node: () => <Book key={`${uid}bk`} A={A} pose={B} w={bw} h={sl.h} d={BOOK_D} col={s.col} uid={`${uid}bk`} /> },
  ];
  if (!s.ladder) items.push({ Z: s.Z + 1, key: `${uid}sh`, node: () => <AirShadow key={`${uid}sh`} A={A} X={X} Z={s.Z} w={62} d={30} uid={`${uid}sh`} amt={0.8} /> });
  return items;
};

// ---------------------------------------------------------------------------------------------------------------------
// JENNER: cut 68 (REV1) leaves him out of shot to the right at jennerPos(130), three-quarter toward the case, his near
// (left) arm hanging free, the far hand behind his body. While still out of shot (f2-f18) his left hand comes up to
// his lapel (so no hand hangs into the caption band once the pull-back reveals him, ~f31); then he simply stands,
// breathing, his head lifting slowly to the shelves.
// ---------------------------------------------------------------------------------------------------------------------
const JENNER_INKS = { ribbon: "#56606C" };
const jenPose = (f: number): VPose => {
  const q = jennerPose(STORE_LAST + f);
  const look = smooth((f - 30) / 60);
  return { ...q, headYaw: q.headYaw + 0.1 * look, pitch: q.pitch - 7 * look };
};
/** Jenner's rig at frame f (exported for the probes): his pose, grips and anchors. REV2: the lapel arm's elbow is set by
 *  bendHint (full bend, one side) once it moves (f > 2; f0-f2 are cut 68's pose untouched) */
export const jennerRig = (A: AirWorld, f: number) => {
  const jp = jennerPos(STORE_LAST);
  const { at, scale } = A.P.at(jp.X, jp.Z);
  const q0 = jenPose(f);
  const rest = vaccineAnchors("jenner", q0, at, scale, { hold: { L: "none", R: "none" } });
  // cut 68's far-hand grip (StoreThatInformation jennerGrips at f >= 61): behind his hip, hidden by his body
  const behind: P2 = [rest.hip[0] + 20 * scale, rest.hip[1] - 14 * scale];
  // his left hand (the rig's armR) up to his lapel while out of shot: elbow first
  const up = smooth((f - 2) / 16);
  const lapel: P2 = [rest.chest[0] - 10 * scale, rest.chest[1] - 24 * scale];
  const R = up > 0 ? bez(rest.handR, [lerp(rest.handR[0], lapel[0], 0.2), lerp(rest.handR[1], lapel[1], 0.7)], lapel, up) : undefined;
  const grip: Grip = { L: behind, ...(R ? { R } : {}) };
  const anchors = (q: VPose) => vaccineAnchors("jenner", q, at, scale, { grip, hold: { L: "none", R: "none" } });
  const pose = R ? bendHint(q0, { R }, Math.sin(q0.yaw) >= 0 ? 1 : -1, anchors) : q0;
  return { jp, at, scale, pose, grip, anchors: () => anchors(pose) };
};
export const jennerItems = (A: AirWorld, f: number, probe?: { id: string; pts: P2[] }[]): LibItem[] => {
  const { jp, at, scale, pose: q, grip, anchors } = jennerRig(A, f);
  if (probe) {
    const an = anchors();
    probe.push({ id: "jen", pts: [an.handR, an.handL, an.headC] });
  }
  return [
    { Z: jp.Z + 1, key: "jshadow", node: () => <AirShadow key="js" A={A} X={jp.X} Z={jp.Z} w={62} d={30} uid="jsh" amt={0.8} /> },
    { Z: jp.Z, key: "jenner", node: () => <Jenner key="jen" pose={q} at={at} scale={scale} uid="jen" fog={A.folkFog(jp.Z)} unitPx={A.k} grip={grip} hold={{ L: "none", R: "none" }} frame={STORE_LAST + f} inks={JENNER_INKS} /> },
  ];
};

// ---------------------------------------------------------------------------------------------------------------------
// THE WARM POINT and THE LOW AIR
// ---------------------------------------------------------------------------------------------------------------------
/** the vaccine book's light grows as the camera pulls back, so it survives the distance (a soft glow on the shelf) */
const wideGlow = (A: AirWorld, f: number): LibItem => {
  const w = c01((2.6 - A.k) / 2.0);
  const breath = 1 + 0.07 * Math.sin(f * 0.09);
  return {
    Z: VACCINE_SLOT.Z - 0.5,
    key: "wideglow",
    node: () => (w > 0.005 ? <ShelfGlow key="wg" A={A} X={VACCINE_SLOT.X} Y={VACCINE_SLOT.Y} Z={VACCINE_SLOT.Z} amt={1.1 * smooth(w) * breath} spread={1 + 1.3 * smooth(w)} uid="wg" /> : null),
  };
};
/** the open floor in front of the stacks sinks into the dense low air toward the bottom of the frame (the medium's
 *  height ramp), drawn right over the floor and under everything that stands on it */
const lowAir = (A: AirWorld, u: number): LibItem => {
  const cam = A.cam;
  const wy = (sy: number) => cam.cy + (sy - 960) / cam.k;
  const amt = smooth((u - 0.15) / 0.5);
  const col = mixHex(rgbHex(A.v.airAtScreen(1920)), "#2E2620", 0.45);
  return {
    Z: 1e6,
    key: "lowair",
    node: () =>
      amt > 0.005 ? (
        <g key="la">
          <defs>
            <linearGradient id="la-g" gradientUnits="userSpaceOnUse" x1="0" y1={wy(1150).toFixed(2)} x2="0" y2={wy(1920).toFixed(2)}>
              <stop offset="0" stopColor={col} stopOpacity={0} />
              <stop offset="0.35" stopColor={col} stopOpacity={0.5 * amt} />
              <stop offset="1" stopColor={col} stopOpacity={0.88 * amt} />
            </linearGradient>
          </defs>
          <rect x={cam.cx - 600 / cam.k} y={wy(1150)} width={1200 / cam.k} height={(1920 - 1150 + 40) / cam.k} fill="url(#la-g)" />
        </g>
      ) : null,
  };
};

// ---- the join, asserted at load: our f0 camera and medium are cut 68's last frame's
{
  const c0 = cam76(0);
  const e = STORE_END_CAM;
  if (Math.abs(c0.cam.k - e.k) > 1e-9 || Math.abs(c0.cam.cx - e.cx) > 1e-9 || Math.abs(c0.cam.cy - e.cy) > 1e-9) throw new Error("cut 76 f0 camera != STORE_END_CAM");
  const a = air76(c0.cam, c0.eyeY, c0.Dc, W0);
  const b = libraryAir(STORE_END_CAM, W0);
  if (Math.abs(a.Dc - b.Dc) > 1e-9 || a.v.horizon !== b.v.horizon || a.tone("#7A5A3E", 400, 200) !== b.tone("#7A5A3E", 400, 200)) throw new Error("cut 76 f0 medium != libraryAir");
}

const LibraryOfCulturalEvolution: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const wf = W0 + f;
  const { cam, eyeY, Dc, u } = cam76(f);
  const A = air76(cam, eyeY, Dc, wf);
  const items = [
    ...storeItems(A, STORE_LAST).filter((it) => it.key !== "jenner" && it.key !== "jshadow"),
    ...jennerItems(A, f),
    wideGlow(A, f),
    lowAir(A, u),
    ...SHELVERS.flatMap((s) => shelverItems(A, s, f)),
  ];
  return (
    <AirStage v={A.v} shafts={0} bloom={LIB_BLOOM}>
      <WorldSvg cam={cam}>
        <LibraryStage A={A} frame={wf} extra={items} />
      </WorldSvg>
    </AirStage>
  );
};

export default LibraryOfCulturalEvolution;
