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
// SOURCES: none on screen. Casts: vaccineFolk (Jenner, Pasteur), romeFolk (Freeman), pandemicFolk (Worker), covidFolk
// (Commuter), all imported read-only. (The Greek scholar of the first round was dropped: at the less wide end only the
// left face of stack 0 is in frame, room for four shelvers.)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR_SCENE_EYE, AirShadow, AirStage, FIG_FOG, PandemicFolk, RomeFolk, WorldSvg, c01, fogHex, lerp, makeAirView, mixHex, perspective, rgbHex, swayCam, workerScale, type AirWorld, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { Book, DEPTH, LIB_BLOOM, LIB_REST, LIB_SCENE, LibraryStage, STORE_END_CAM, STORE_LAST, ShelfGlow, VACCINE_SLOT, VB, booksOn, libraryAir, slotAt, storeCamBase, vec3, type BookPose, type LibItem, type RowRef, type V3 } from "./libraryWorld";
import { JENNER, STEP, jennerPose, jennerPos, storeItems } from "./StoreThatInformation";
import { Jenner, Pasteur, breathe as vBreathe, standAt as vStandAt, vaccineAnchors, type VPose } from "./vaccineFolk";
import * as Greek from "../kyle-greek-math/greekFolk";
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
type CastKind = "rome" | "greek" | "covid" | "pasteur" | "worker";
export type Shelver = {
  id: string;
  cast: CastKind;
  variant: number;
  /** feet (world X, Z) */
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
  /** the new book's colour (BOOK_COLS-like, never near orange) */
  col: string;
  /** the feet's height (0 the floor; a ladder rung) */
  feetY?: number;
  /** how far to the side of the slot the feet stand (default REACH_DX) */
  reach?: number;
};
const BOOK_D = 30;
/** the left rolling ladder (libraryWorld LADDERS[0]: X -930 on stack 0): the Worker stands on its 4th rung */
const LADDER_RUNG = (() => {
  const t = 4 / 10.6;
  return { X: -930, Y: lerp(0, -444, t), Z: lerp(-92, -6, t) };
})();
const SHELVERS0: Shelver[] = [
  { id: "rom", cast: "rome", variant: 0, X: 0, Z: -40, dir: 1, side: "L", shelf: 2, slotX: -516, land: 46, col: "#D9C9A5", reach: 92 },
  { id: "pas", cast: "pasteur", variant: 0, X: 0, Z: -40, dir: 1, side: "L", shelf: 2, slotX: -718, land: 62, col: "#E6DAC0" },
  { id: "wkr", cast: "worker", variant: 0, X: -930, Z: LADDER_RUNG.Z, feetY: LADDER_RUNG.Y, dir: 1, side: "L", shelf: 0, slotX: -862, land: 74, col: "#CDBB98" },
  { id: "com", cast: "covid", variant: 0, X: 0, Z: -40, dir: 1, side: "L", shelf: 2, slotX: -963, land: 86, col: "#D9C9A5", reach: 62 },
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
/** each figure stands REACH_DX to the side of its slot (a short reach for the near arm) */
const REACH_DX = 72;
export const SHELVERS: Shelver[] = SHELVERS0.map((s) => (s.cast === "worker" ? s : { ...s, X: SLOTS[s.id].X - s.dir * (s.reach ?? REACH_DX) }));

/** the phases of one shelving, from its landing frame */
const phases = (s: Shelver, f: number) => {
  const L = s.land;
  return {
    lift: smooth((f - (L - 36)) / 24), // from the carry up to just before the slot, turning spine-out
    onSpine: smooth((f - (L - 15)) / 6), // the hand moves from under the book onto the spine
    slide: smooth((f - (L - 10)) / 10), // the push home
    release: smooth((f - (L + 2)) / 7),
    ret: smooth((f - (L + 6)) / 22),
    swap: smooth((f - (L - 15)) / 5), // the book's draw order: in front of the figure -> behind his hand
  };
};
const frameOfYaw = (psi: number): Omit<BookPose, "c"> => {
  const ez: V3 = [Math.sin(psi), 0, Math.cos(psi)];
  const ey: V3 = [0, -1, 0];
  return { ex: vec3.cross3(ez, ey), ey, ez };
};
/** the book's 3D pose at frame f */
export const bookPoseOf = (s: Shelver, f: number): BookPose => {
  const sl = SLOTS[s.id];
  const ph = phases(s, f);
  const carry: V3 = s.cast === "worker" ? [s.X + 30, (s.feetY ?? 0) - 120 - sl.h / 2, s.Z - 14] : [s.X + s.dir * 4, (s.feetY ?? 0) - 162 - sl.h / 2, s.Z - 22];
  const pre: V3 = [sl.X, sl.Y - sl.h / 2, sl.Z - BOOK_D];
  const home: V3 = [sl.X, sl.Y - sl.h / 2, sl.Z];
  const arc = 14 * Math.sin(Math.PI * ph.lift);
  let c = vec3.add3(vec3.mul3(carry, 1 - ph.lift), vec3.mul3(pre, ph.lift));
  c = [c[0], c[1] - arc, c[2]];
  c = vec3.add3(vec3.mul3(c, 1 - ph.slide), vec3.mul3(home, ph.slide));
  const psi = lerp(-s.dir * Math.PI * 0.5, 0, smooth((ph.lift - 0.1) / 0.8));
  return { c, ...frameOfYaw(psi) };
};

/** the Worker (pandemicFolk's 2.5D rig has no grips): his near (right) arm solved by a few Gauss-Newton steps on
 *  (flex, abd) so the hand lands on a world point; figure units are worker units, y down */
const WK_YAW = 140;
const wkBase = (f: number, lookUp: number): WorkerPose => {
  const q = PandemicFolk.breathe({ ...PandemicFolk.stand(WK_YAW), headPitch: 6 - 22 * lookUp, headYaw: -8 + 6 * lookUp }, f);
  return q;
};
const wkHand = (q: WorkerPose, flex: number, abd: number): P2 => {
  const a = buildWorker({ ...q, armR: { ...q.armR, flex, abd, abd2: -4, flex2: 30, droop: 10, thumb: 0.5 } }, {}).anchors.handR;
  return [a[0], a[1]];
};
const wkSolve = (q: WorkerPose, target: P2, g0: P2 = [120, 25]): { flex: number; abd: number; err: number } => {
  let [fl, ab] = g0;
  let h = wkHand(q, fl, ab);
  for (let it = 0; it < 6; it++) {
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
    fl = Math.max(-10, Math.min(175, fl + dfl));
    ab = Math.max(-10, Math.min(120, ab + dab));
    h = wkHand(q, fl, ab);
  }
  return { flex: fl, abd: ab, err: Math.hypot(target[0] - h[0], target[1] - h[1]) };
};

const castPose = (s: Shelver, f: number, lookUp: number) => {
  const yaw = s.dir * 0.95;
  const head = yaw + s.dir * 0.15 * lookUp;
  if (s.cast === "pasteur") return vBreathe({ ...vStandAt(yaw), headYaw: head, pitch: 4 - 12 * lookUp }, f + 40, 0.8, 2);
  if (s.cast === "greek") {
    const q = Greek.POSES.standAt(yaw) as Greek.GPose;
    return { ...(Greek.idle(q, f, 2) as Greek.GPose), headYaw: head, pitch: (q.pitch ?? 0) - 10 * lookUp };
  }
  if (s.cast === "covid") {
    const q = Covid.breathe(Covid.POSES.turnTo(yaw), f);
    return { ...q, headYaw: head, pitch: (q.pitch ?? 0) - 10 * lookUp };
  }
  const q = RomeFolk.idle(RomeFolk.POSES.stand(s.dir), f, 1);
  return { ...q, headYaw: q.headYaw + s.dir * 0.15 * lookUp, pitch: q.pitch - 10 * lookUp };
};

/** probe: when given, each figure's hands and head (world px) are pushed here (the caption-band check) */
export const shelverItems = (A: AirWorld, s: Shelver, f: number, probe?: { id: string; pts: P2[] }[]): LibItem[] => {
  const sl = SLOTS[s.id];
  const ph = phases(s, f);
  const B = bookPoseOf(s, f);
  const P = (p: V3): P2 => A.P.p(p[0], p[1], p[2]);
  const at = A.P.p(s.X, s.feetY ?? 0, s.Z);
  const scale = A.P.r(s.Z);
  // cull a figure wholly off the frame (screen x of its body and its book, with a margin)
  {
    const sx = (wx: number) => 540 + (wx - A.cam.cx) * A.k;
    const bx = sx(A.P.p(B.c[0], B.c[1], B.c[2])[0]);
    const x0 = Math.min(sx(at[0] - 130 * scale), bx - 60);
    const x1 = Math.max(sx(at[0] + 130 * scale), bx + 60);
    if (x1 < -20 || x0 > 1100) return [];
  }
  const lookUp = smooth((f - (s.land - 40)) / 20) * (1 - 0.6 * ph.ret);
  const pose = s.cast === "worker" ? wkBase(f, lookUp) : castPose(s, f, lookUp);
  const key: "L" | "R" = s.dir === 1 ? "L" : "R";
  // the hand: under the book's tail (the book rides on the fingers), then on the spine's lower third for the push
  const tail = P(vec3.add3(vec3.add3(B.c, vec3.mul3(B.ey, -sl.h * 0.5)), vec3.mul3(B.ez, BOOK_D * 0.3)));
  const spine = P(vec3.add3(vec3.add3(B.c, vec3.mul3(B.ez, -1.2)), vec3.mul3(B.ey, -sl.h * 0.28)));
  const mix = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  let H = mix(tail, spine, ph.onSpine);
  H = [H[0] + s.dir * 6 * scale * ph.release, H[1] + 8 * scale * ph.release];
  const ws = workerScale(scale);
  const nat: P2 = s.cast === "worker" ? (() => {
    const a = buildWorker(pose as WorkerPose, {}).anchors.handR;
    return [at[0] + a[0] * ws, at[1] + a[1] * ws] as P2;
  })() : ([at[0] - s.dir * 12 * scale, at[1] - 192 * scale] as P2);
  H = mix(H, nat, ph.ret);
  // the far hand: on the book's other side while carrying (both hands on it), to the chest as the near hand lifts it
  // (above the caption band while the figure is big), then down to its rest after the push
  const fkey: "L" | "R" = key === "L" ? "R" : "L";
  const side = P(vec3.add3(vec3.add3(B.c, vec3.mul3(B.ex, s.dir * Math.max(sl.w, 9) * 0.5)), vec3.mul3(B.ez, BOOK_D * 0.62)));
  const toChest = smooth((f - (s.land - 38)) / 12);
  const down = smooth((f - (s.land + 8)) / 20);
  // after the push both hands come to rest folded at the chest (no hand hangs into the caption band while the figure is big)
  const natF: P2 = s.cast === "worker" ? side : [at[0] + s.dir * 16 * scale, at[1] - 184 * scale];
  const chest: P2 = [at[0] + s.dir * 4 * scale, at[1] - 222 * scale];
  const HF = mix(mix(side, chest, toChest), natF, down);
  const grip = s.cast === "worker" ? (ph.ret < 0.999 ? { [key]: H } : undefined) : { [key]: H, [fkey]: HF };
  const fog = A.folkFog(s.Z);
  const uid = `${s.id}`;
  if (probe) {
    const headY = (s.cast === "worker" ? 300 : 280) * scale;
    probe.push({ id: s.id, pts: [H, grip && (grip as Record<string, P2>)[fkey] ? HF : natF, [at[0], at[1] - headY]] });
  }
  const fig = () => {
    if (s.cast === "worker") {
      const q = pose as WorkerPose;
      let arm = q.armR;
      if (grip) {
        const T: P2 = [(H[0] - at[0]) / ws, (H[1] - at[1]) / ws];
        const sol = wkSolve(q, T);
        arm = { ...q.armR, flex: sol.flex, abd: sol.abd, abd2: -4, flex2: 30, droop: 10, thumb: 0.5 };
        // the grip fades out with ret: blend the solved arm back to the rest arm
        arm = { ...arm };
      }
      return <PandemicFolk.FolkWorker key={uid} uid={uid} pose={{ ...q, armR: arm }} x={at[0]} y={at[1]} scale={ws} inks={A.workerInks(s.Z, -(s.feetY ?? 0))} unitPx={A.k} />;
    }
    const common = { at, scale, fog, unitPx: A.k, grip } as const;
    if (s.cast === "pasteur") return <Pasteur key={uid} uid={uid} pose={pose as VPose} {...common} hold={{ L: "none", R: "none" }} frame={f} />;
    if (s.cast === "greek") return <Greek.Scholar key={uid} uid={uid} variant={s.variant} pose={pose as Greek.GPose} {...common} />;
    if (s.cast === "covid") return <Covid.Commuter key={uid} uid={uid} variant={s.variant} pose={pose as Covid.CovidPose} {...common} frame={f} hold={{ L: "none", R: "none" }} />;
    return <RomeFolk.Freeman key={uid} uid={uid} variant={s.variant} pose={pose as RomeFolk.FigPose} {...common} />;
  };
  const book = (k: string, op: number) => (
    <g key={k} opacity={op}>
      <Book A={A} pose={B} w={Math.max(sl.w, 9)} h={sl.h} d={BOOK_D} col={s.col} uid={k} />
    </g>
  );
  const zf = s.cast === "worker" ? -96 : s.Z;
  const items: LibItem[] = [
    { Z: zf, key: `${uid}fig`, node: fig },
  ];
  if (s.cast !== "worker") items.push({ Z: s.Z + 1, key: `${uid}sh`, node: () => <AirShadow key={`${uid}sh`} A={A} X={s.X} Z={s.Z} w={62} d={30} uid={`${uid}sh`} amt={0.8} /> });
  if (ph.swap > 0) items.push({ Z: s.cast === "worker" ? -2 : s.Z + 4, key: `${uid}bkB`, node: () => book(`${uid}bkB`, 1) });
  if (ph.swap < 1) items.push({ Z: zf - 4, key: `${uid}bkF`, node: () => book(`${uid}bkF`, 1 - ph.swap) });
  return items;
};

// ---------------------------------------------------------------------------------------------------------------------
// JENNER: cut 68 leaves him three-quarter back at the case, his left hand at his chest (STORE_LAST). He steps back
// another pace toward the aisle (f3-f27, a small dip), the hand staying at his lapel, his head turning out to the hall.
// ---------------------------------------------------------------------------------------------------------------------
const JENNER_INKS = { ribbon: "#56606C" };
/** cut 68's LAPEL (StoreThatInformation, not exported; asserted below against its grip at STORE_LAST) */
const LAPEL: V3 = [-342, -236, -84];
export const STEP2 = { f: [3, 27] as const, dX: 40, dZ: -22 };
const step2T = (f: number) => smooth((f - STEP2.f[0]) / (STEP2.f[1] - STEP2.f[0]));
const jenPos = (f: number) => {
  const p0 = jennerPos(STORE_LAST);
  const t = step2T(f);
  return { X: p0.X + STEP2.dX * t, Z: p0.Z + STEP2.dZ * t };
};
const jenPose = (f: number): VPose => {
  const q = jennerPose(STORE_LAST + f);
  const t = step2T(f);
  const dip = 3 * Math.sin(Math.PI * t);
  const look = smooth((f - 10) / 40);
  return { ...q, crouch: q.crouch + dip, lean: q.lean - 2 * Math.sin(Math.PI * t), headYaw: q.headYaw + 0.5 * look, pitch: q.pitch - 3 * look };
};
export const jennerItems = (A: AirWorld, f: number, probe?: { id: string; pts: P2[] }[]): LibItem[] => {
  const jp = jenPos(f);
  const { at, scale } = A.P.at(jp.X, jp.Z);
  const t = step2T(f);
  // the hand rises from his lapel to his chin as he looks out (keeps it above the caption band while he is big)
  const lp: V3 = [LAPEL[0] + STEP.dX + STEP2.dX * t, LAPEL[1], LAPEL[2] + STEP.dZ + STEP2.dZ * t];
  // his left hand stays at his lapel (cut 68's end); the other comes to his waistcoat front, so no hand hangs into the
  // caption band while he is big
  const cross = smooth((f - 3) / 17);
  const natL = vaccineAnchors("jenner", jenPose(f), at, scale, { grip: { R: A.P.p(lp[0], lp[1], lp[2]) }, hold: { L: "none", R: "none" } }).handL;
  const chestL = A.P.p(lp[0] + 18, -244, lp[2] - 2);
  const grip = { R: A.P.p(lp[0], lp[1], lp[2]), ...(cross > 0.001 ? { L: [lerp(natL[0], chestL[0], cross), lerp(natL[1], chestL[1], cross)] as P2 } : {}) };
  if (probe) {
    const an = vaccineAnchors("jenner", jenPose(f), at, scale, { grip, hold: { L: "none", R: "none" } });
    probe.push({ id: "jen", pts: [an.handR, an.handL, an.headC] });
  }
  return [
    { Z: jp.Z + 1, key: "jshadow", node: () => <AirShadow key="js" A={A} X={jp.X} Z={jp.Z} w={62} d={30} uid="jsh" amt={0.8} /> },
    { Z: jp.Z, key: "jenner", node: () => <Jenner key="jen" pose={jenPose(f)} at={at} scale={scale} uid="jen" fog={A.folkFog(jp.Z)} unitPx={A.k} grip={grip} hold={{ L: "none", R: "none" }} frame={STORE_LAST + f} inks={JENNER_INKS} /> },
  ];
};
if (Math.abs(jennerPos(STORE_LAST).X - (JENNER.X + STEP.dX)) > 1e-9) throw new Error("cut 68's Jenner moved: re-check the join");

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
