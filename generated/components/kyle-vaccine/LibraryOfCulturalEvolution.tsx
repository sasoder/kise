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
// from Jenner's book): a Roman freeman (lands f46, STORED), Pasteur (f62), a c.1900 worker on the rolling ladder
// (pandemics Worker, f74, the top shelf), a present-day commuter (covidFolk, f86). Each: the book carried in both
// hands at the chest, the near hand lifts it beside the slot turning it spine-out (the far hand to the chest), the
// hand moves onto the spine's lower third (contact = landing - 10) and pushes it home (first reaction the same frame:
// the book moves into the face; home at the landing), lets go, and the arms come to rest folded at the chest.
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
// SOURCES: none on screen. Casts: vaccineFolk (Jenner, Pasteur), romeFolk (Freeman), pandemicFolk (Worker), covidFolk
// (Commuter), all imported read-only. (The Greek scholar of the first round was dropped: at the less wide end only the
// left face of stack 0 is in frame, room for four shelvers.)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR_SCENE_EYE, AirShadow, AirStage, FIG_FOG, PandemicFolk, RomeFolk, WorldSvg, c01, fogHex, lerp, makeAirView, mixHex, perspective, rgbHex, swayCam, workerScale, type AirWorld, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Book, DEPTH, LIB_BLOOM, LIB_REST, LIB_SCENE, LibraryStage, STORE_END_CAM, STORE_LAST, ShelfGlow, VACCINE_SLOT, VB, booksOn, libraryAir, slotAt, storeCamBase, vec3, type BookPose, type LibItem, type RowRef, type V3 } from "./libraryWorld";
import { jennerPose, jennerPos, storeItems } from "./StoreThatInformation";
import { Jenner, Pasteur, breathe as vBreathe, standAt as vStandAt, vaccineAnchors, walkPose, type VPose } from "./vaccineFolk";
import * as Covid from "../kyle-covid/covidFolk";
import { buildWorker, type WorkerPose } from "../kyle-pandemics/pandemicFolkWorker";
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
type CastKind = "rome" | "covid" | "pasteur" | "worker";
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
  { id: "rom", cast: "rome", variant: 0, X: 0, Z: -40, dir: 1, side: "L", shelf: 2, slotX: -516, land: 46, col: "#D9C9A5", reach: 75, stepIn: 40, restAt: 56 },
  { id: "pas", cast: "pasteur", variant: 0, X: 0, Z: -40, dir: 1, side: "L", shelf: 2, slotX: -718, land: 62, col: "#E6DAC0", reach: 75, stepIn: 40, restAt: 70 },
  { id: "com", cast: "covid", variant: 0, X: -930, Z: LADDER_RUNG.Z, feetY: LADDER_RUNG.Y, dir: 1, side: "L", shelf: 0, slotX: -862, land: 80, col: "#D9C9A5", stepIn: 0, restAt: 90, ladder: true },
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
export const SHELVERS: Shelver[] = SHELVERS0.map((s) => (s.cast === "worker" || s.ladder ? s : { ...s, X: SLOTS[s.id].X - s.dir * (s.reach ?? 60) }));

/** the beats of one shelving, from its landing frame L (the book home):
 *  step in L-38..L-18 (feet planted), reach L-24..L-8 (the far hand carries the book up into the gap, turning it
 *  spine-out, the elbow bent, the body leaning in), the hand onto the spine L-10..L-7, a small push L-7..L (contact
 *  L-7, the book moves the same frame), release L+1..L+6, the hand lingers on the shelf, then both arms down into the
 *  rest pose from restAt (elbow first) */
const phases = (s: Shelver, f: number) => {
  const L = s.land;
  const rest = s.restAt ?? L + 10;
  return {
    step: smooth((f - (L - 38)) / 20),
    reach: smooth((f - (L - 24)) / 16),
    onSpine: smooth((f - (L - 10)) / 3),
    push: smooth((f - (L - 7)) / 7),
    release: smooth((f - (L + 1)) / 5),
    nearOff: smooth((f - (L - 26)) / 16),
    nearDown: smooth((f - Math.max(L - 11, rest - 2)) / 15), // after the push for a big near figure (its hands stay above the band) // the near hand leaves the book as the far hand takes it up
    down: smooth((f - rest) / 15),
    swap: smooth((f - (L - 15)) / 4), // the book's draw order: in front of the figure -> behind his hand (beside him)
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
/** the book's 3D pose at frame f: held at the chest (cover to us, spine toward the slot), carried up into the gap
 *  (sticking out 12) turning spine-out, a small push home */
export const bookPoseOf = (s: Shelver, f: number): BookPose => {
  const sl = SLOTS[s.id];
  const ph = phases(s, f);
  const X = feetX(s, f);
  const carry: V3 = s.cast === "worker" || s.ladder ? [s.X + 26, (s.feetY ?? 0) - 150 - sl.h / 2, s.Z - 14] : [X + s.dir * 14, -194 - sl.h / 2 + 22, s.Z - 26];
  const inGap: V3 = [sl.X, sl.Y - sl.h / 2, sl.Z - 12];
  const home: V3 = [sl.X, sl.Y - sl.h / 2, sl.Z];
  const r = ph.reach;
  // the path: up and out in an arc (the hand rises first, then carries it across into the gap)
  const up = 18 * Math.sin(Math.PI * r);
  let c: V3 = [lerp(carry[0], inGap[0], smooth((r - 0.1) / 0.9)), lerp(carry[1], inGap[1], smooth(r / 0.8)) - up, lerp(carry[2], inGap[2], r)];
  c = vec3.add3(vec3.mul3(c, 1 - ph.push), vec3.mul3(home, ph.push));
  const psi = lerp(-s.dir * Math.PI * 0.5, 0, smooth((r - 0.05) / 0.85));
  return { c, ...frameOfYaw(psi) };
};

/** the Worker (pandemicFolk's 2.5D rig has no grips): his right arm solved by a few Gauss-Newton steps on
 *  (flex, abd), the elbow bent (flex2), so the hand lands on a world point; figure units are worker units, y down */
const WK_YAW = 140;
const wkBase = (f: number, lookUp: number, lean: number): WorkerPose => PandemicFolk.breathe({ ...PandemicFolk.stand(WK_YAW), headPitch: 6 - 22 * lookUp, headYaw: -8 + 6 * lookUp, bodyPitch: 3 * lean, bodyRoll: -2.5 * lean }, f);
const WK_ARM = { abd2: -6, flex2: 58, droop: 14, thumb: 0.5 };
const wkHand = (q: WorkerPose, flex: number, abd: number): P2 => {
  const a = buildWorker({ ...q, armR: { ...q.armR, flex, abd, ...WK_ARM } }, {}).anchors.handR;
  return [a[0], a[1]];
};
const wkSolve = (q: WorkerPose, target: P2, g0: P2 = [130, 25]): { flex: number; abd: number; err: number } => {
  let [fl, ab] = g0;
  let h = wkHand(q, fl, ab);
  for (let it = 0; it < 7; it++) {
    const e: P2 = [target[0] - h[0], target[1] - h[1]];
    if (Math.hypot(e[0], e[1]) < 0.3) break;
    const d = 0.5;
    const hf = wkHand(q, fl + d, ab);
    const ha = wkHand(q, fl, ab + d);
    const J = [[(hf[0] - h[0]) / d, (ha[0] - h[0]) / d], [(hf[1] - h[1]) / d, (ha[1] - h[1]) / d]];
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    if (Math.abs(det) < 1e-6) break;
    let dfl = (J[1][1] * e[0] - J[0][1] * e[1]) / det;
    let dab = (-J[1][0] * e[0] + J[0][0] * e[1]) / det;
    const m = Math.max(Math.abs(dfl), Math.abs(dab));
    if (m > 25) {
      dfl *= 25 / m;
      dab *= 25 / m;
    }
    fl = Math.max(-10, Math.min(178, fl + dfl));
    ab = Math.max(-10, Math.min(120, ab + dab));
    h = wkHand(q, fl, ab);
  }
  return { flex: fl, abd: ab, err: Math.hypot(target[0] - h[0], target[1] - h[1]) };
};

/** the body: three-quarter toward the slot; the step (walk cycle with planted feet); a lean into the reach and a little
 *  stretch up; the head lifts to the gap and settles; breathing */
const castPose = (s: Shelver, f: number) => {
  const ph = phases(s, f);
  const yaw = s.dir * 0.92;
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
/** the rest pose: the hands loosely together at the waist front (no hand hangs into the caption band while the
 *  figure is still big); the far hand a little nearer the slot side */
/** REV1b: the rest pose: the hands together resting on the belt in front (elbows down at the sides; it keeps the hands
 *  above the caption band while the figure is big); the ladder figure's own hanging hand */
const restHands = (s: Shelver, pose: unknown, at: P2, scale: number): { L: P2; R: P2 } => {
  if (!s.ladder) {
    const far: P2 = [at[0] + s.dir * 12 * scale, at[1] - 156 * scale];
    const near: P2 = [at[0] + s.dir * 2 * scale, at[1] - 160 * scale];
    return s.dir === 1 ? { R: far, L: near } : { L: far, R: near };
  }
  if (s.cast === "pasteur") {
    const a = vaccineAnchors("pasteur", pose as VPose, at, scale, { hold: { L: "none", R: "none" } });
    return { L: a.handL, R: a.handR };
  }
  if (s.cast === "covid") {
    const a = Covid.covidAnchors("commuter", pose as Covid.CovidPose, at, scale, { variant: s.variant });
    return { L: a.handL as P2, R: a.handR as P2 };
  }
  const a = RomeFolk.romeAnchors("freeman", pose as RomeFolk.FigPose, at, scale, { variant: s.variant });
  return { L: a.handL as P2, R: a.handR as P2 };
};
const bez = (a: P2, c: P2, b: P2, u: number): P2 => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];

/** probe: when given, each figure's hands and head (world px) are pushed here (the caption-band check) */
export const shelverItems = (A: AirWorld, s: Shelver, f: number, probe?: { id: string; pts: P2[] }[]): LibItem[] => {
  const sl = SLOTS[s.id];
  const ph = phases(s, f);
  const B = bookPoseOf(s, f);
  const P = (p: V3): P2 => A.P.p(p[0], p[1], p[2]);
  const X = feetX(s, f);
  const at = A.P.p(X, s.feetY ?? 0, s.Z);
  const scale = A.P.r(s.Z);
  // cull a figure wholly off the frame (screen x of its body and its book, with a margin)
  {
    const sx = (wx: number) => 540 + (wx - A.cam.cx) * A.k;
    const bx = sx(A.P.p(B.c[0], B.c[1], B.c[2])[0]);
    const x0 = Math.min(sx(at[0] - 130 * scale), bx - 60);
    const x1 = Math.max(sx(at[0] + 130 * scale), bx + 60);
    if (x1 < -20 || x0 > 1100) return [];
  }
  const mix = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const bw = Math.max(sl.w, 9);
  // the FAR hand (the leading arm: no crossing of the chest) holds the book by its spine edge, then moves onto the
  // spine's lower third for the push
  const hold = P(vec3.add3(vec3.add3(B.c, vec3.mul3(B.ez, 3)), vec3.mul3(B.ey, -sl.h * 0.12)));
  const spine = P(vec3.add3(vec3.add3(B.c, vec3.mul3(B.ez, -1.5)), vec3.mul3(B.ey, -sl.h * 0.3)));
  let H = mix(hold, spine, ph.onSpine);
  // release: a small lift off the spine (toward us and down), the hand lingering on the shelf lip below the book
  const lip = A.P.p(sl.X + s.dir * 2, sl.Y + 6, sl.Z - 4);
  H = mix(H, lip, ph.release);
  if (s.cast === "worker") {
    const ws = workerScale(scale);
    const lookUp = smooth((f - (s.land - 34)) / 16);
    const q = wkBase(f, lookUp, Math.sin((Math.PI / 2) * ph.reach) * (1 - ph.release));
    const natW = (() => {
      const a = buildWorker(q, {}).anchors.handR;
      return [at[0] + a[0] * ws, at[1] + a[1] * ws] as P2;
    })();
    // his hand down to his side after a beat on the shelf (elbow first)
    const dn = smooth((f - (s.land + 12)) / 18);
    const Hw = dn > 0 ? bez(H, [lerp(H[0], natW[0], 0.75), lerp(H[1], natW[1], 0.2)], natW, dn) : H;
    const T: P2 = [(Hw[0] - at[0]) / ws, (Hw[1] - at[1]) / ws];
    const sol = wkSolve(q, T);
    const arm = { ...q.armR, flex: sol.flex, abd: sol.abd, ...WK_ARM, flex2: lerp(WK_ARM.flex2, q.armR.flex2, dn), droop: lerp(WK_ARM.droop, q.armR.droop, dn) };
    if (probe) probe.push({ id: s.id, pts: [Hw, Hw, [at[0], at[1] - 300 * scale]] });
    const fig = () => <PandemicFolk.FolkWorker key={s.id} uid={s.id} pose={{ ...q, armR: dn >= 0.999 ? q.armR : arm }} x={at[0]} y={at[1]} scale={ws} inks={A.workerInks(s.Z, -(s.feetY ?? 0))} unitPx={A.k} />;
    const items: LibItem[] = [{ Z: -96, key: `${s.id}fig`, node: fig }];
    const book = (k: string, op: number) => (
      <g key={k} opacity={op}>
        <Book A={A} pose={B} w={bw} h={sl.h} d={BOOK_D} col={s.col} uid={k} />
      </g>
    );
    if (ph.swap > 0) items.push({ Z: -2, key: `${s.id}bkB`, node: () => book(`${s.id}bkB`, 1) });
    if (ph.swap < 1) items.push({ Z: -100, key: `${s.id}bkF`, node: () => book(`${s.id}bkF`, 1 - ph.swap) });
    return items;
  }
  const pose = castPose(s, f);
  const rest = restHands(s, pose, at, scale);
  const fkey: "L" | "R" = s.ladder ? LADDER_FAR : s.dir === 1 ? "R" : "L";
  const nkey: "L" | "R" = fkey === "R" ? "L" : "R";
  // after the beat on the shelf the far arm comes down to its rest (elbow first: across, then down)
  const Hd = ph.down > 0 ? bez(H, [lerp(H[0], rest[fkey][0], 0.7), lerp(H[1], rest[fkey][1], 0.25)], rest[fkey], ph.down) : H;
  // the NEAR hand: under the book's tail while it is carried at the chest, then it lets go and comes to rest against
  // the chest (above the caption band while the figure is big), and down to its side with the far arm
  const tail = P(vec3.add3(vec3.add3(B.c, vec3.mul3(B.ey, -sl.h * 0.5)), vec3.mul3(B.ez, BOOK_D * 0.62)));
  // on the ladder the near hand holds the rail (the rail nearer the slot, at chest height)
  const rail: P2 = A.P.p(-930 + s.dir * 26, (s.feetY ?? 0) - 200, lerp(-92, -6, ((s.feetY ?? 0) - 200) / -444));
  // REV1b: the near hand supports the book from below (under its tail, touching it) all the way up to the gap; as the
  // far hand moves onto the spine for the push it drops in one eased arc (down first, then in) to rest on the belt:
  // it never holds a pose out at chest height
  const N = s.ladder ? mix(tail, rail, ph.nearOff) : ph.nearDown > 0 ? bez(tail, [lerp(tail[0], rest[nkey][0], 0.3), lerp(tail[1], rest[nkey][1], 0.8)], rest[nkey], ph.nearDown) : tail;
  const grip = { [fkey]: Hd, [nkey]: N } as { L?: P2; R?: P2 };
  const fog = A.folkFog(s.Z);
  const uid = `${s.id}`;
  if (probe) probe.push({ id: s.id, pts: [Hd, N, [at[0], at[1] - 280 * scale]] });
  const fig = () => {
    const common = { at, scale, fog, unitPx: A.k, grip } as const;
    if (s.cast === "pasteur") return <Pasteur key={uid} uid={uid} pose={pose as VPose} {...common} hold={{ L: "none", R: "none" }} frame={f} />;
    if (s.cast === "covid") return <Covid.Commuter key={uid} uid={uid} variant={s.variant} pose={pose as Covid.CovidPose} {...common} frame={f} hold={{ L: "none", R: "none" }} />;
    return <RomeFolk.Freeman key={uid} uid={uid} variant={s.variant} pose={pose as RomeFolk.FigPose} {...common} />;
  };
  const book = (k: string, op: number) => (
    <g key={k} opacity={op}>
      <Book A={A} pose={B} w={bw} h={sl.h} d={BOOK_D} col={s.col} uid={k} />
    </g>
  );
  const zf = s.ladder ? -96 : s.Z;
  const items: LibItem[] = [
    { Z: zf, key: `${uid}fig`, node: fig },
  ];
  if (!s.ladder) items.push({ Z: s.Z + 1, key: `${uid}sh`, node: () => <AirShadow key={`${uid}sh`} A={A} X={X} Z={s.Z} w={62} d={30} uid={`${uid}sh`} amt={0.8} /> });
  if (ph.swap > 0) items.push({ Z: s.ladder ? -2 : s.Z + 4, key: `${uid}bkB`, node: () => book(`${uid}bkB`, 1) });
  if (ph.swap < 1) items.push({ Z: zf - 4, key: `${uid}bkF`, node: () => book(`${uid}bkF`, 1 - ph.swap) });
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
export const jennerItems = (A: AirWorld, f: number, probe?: { id: string; pts: P2[] }[]): LibItem[] => {
  const jp = jennerPos(STORE_LAST);
  const { at, scale } = A.P.at(jp.X, jp.Z);
  const q = jenPose(f);
  const rest = vaccineAnchors("jenner", q, at, scale, { hold: { L: "none", R: "none" } });
  // cut 68's far-hand grip (StoreThatInformation jennerGrips at f >= 61): behind his hip, hidden by his body
  const behind: P2 = [rest.hip[0] + 20 * scale, rest.hip[1] - 14 * scale];
  // his left hand (the rig's armR) up to his lapel while out of shot: elbow first
  const up = smooth((f - 2) / 16);
  const lapel: P2 = [rest.chest[0] - 10 * scale, rest.chest[1] - 24 * scale];
  const R = up > 0 ? bez(rest.handR, [lerp(rest.handR[0], lapel[0], 0.2), lerp(rest.handR[1], lapel[1], 0.7)], lapel, up) : undefined;
  const grip = { L: behind, ...(R ? { R } : {}) };
  if (probe) {
    const an = vaccineAnchors("jenner", q, at, scale, { grip, hold: { L: "none", R: "none" } });
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
