// ---------------------------------------------------------------------------
// TooDumbToUseIt (rsi-since-writing, cut 29). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 83 frames.
// One office inside the misty teal air (AirStage, palette A, the shared world sinceWritingWorld, read-only) on a
// londonDepth one-point perspective, from the kit kits/dwarkesh-3d/dwarkesh3d; the Genius from rsi-ten-earths.
//
// CHECK LINE: "In most fields, all that speed just turns out work nobody can use."
//
// THE LINE: "AIs are still way too stupid to make much use of this advantage."
// WORD -> FRAME (f0 = sequence frame 716, 29.8632 s): domains, -14 · AIs -2 · are 8 · still 11 · way 18 · too 26 ·
//   stupid 31 · to 39 · make 48 · much 53 · use 58 · of 64 · this 67 · advantage. 70 · (slot ends 83) But 82 · in 87
// DURATION: the slot 29.8632 -> 33.3250 s (sequence frames 716-799) = 83 frames at 24000/1001 (f0..f82).
//
// THE MOTION: the Genius (v0) types at full speed at his desk on the left, facing right, from before f0 to the last
// frame. Finished WorkSheets (one sheet = one workday, cream) shoot off the pad by his keyboard in a steady stream, one
// every 3.2 frames (constant cadence, launches from f-16): each is shot off fast, banking and swinging past the monitor
// (a turning, curling sliver, never a sheet face-on), tips its inked face part way up, crumples into a ball in ~2.5
// frames and drops toward the wire bin in front-right of the desk (a 19-frame flight). The bin is full and domed over
// at f0; every ball lands on the dome and tumbles off it onto the floor (7-14 frames, by how far it rolls), so a heap
// grows round the bin's foot: 0 balls at f0, 5 at f31, 12 at f50, 21 at f82, the stream still feeding it. About one
// sheet in six only half crumples and settles flat-ish, a loose crinkled sheet among the balls. On "stupid" he glances
// down at the heap, puzzled (f24-31 in, held to f50, back by f57: chin down, eyes down-right, brows up, a small head
// tilt), his hands typing throughout: speed without use. The camera makes one slow push in from a medium shot of desk
// and bin (k 1.65) to the bin and heap with the Genius in shot (k 2.3, f0 -> f70, one lobe), then a creep. Resolved:
// his head y 550-850 (face ~y 650), the stream y 790-1000, the bin and heap y 985-1330 (the heap's front rows run
// through the first caption band as context), the heap x 570-935.
// CAUSE -> EFFECT: a sheet leaves the pad on its launch frame (its flight is a pure function of frame - launch); a ball
// touches the dome on its contact frame (launch + 19) and tumbles from there, settling in its heap slot tumbleOf(i)
// frames later; the heap's count is the number of settled balls.
// Orange = the AI only (the Genius); the paper cream, the wasted paper greying toward DEAD; nothing else is orange.
// THE TONE: cream while it crumples, only ~30% toward DEAD by the time it lands, greying on to its own light DEAD
// (52-82%) over ~45 frames in the heap, so the newest balls are the brightest; the bin's old balls 74-84%.
// THE BALL (cut-local `Wad`, not the world's CrumpledSheet): round with a few soft lumps (low harmonics, no spikes), a
// smooth outline, soft facets and crossing crease lines (a dark fold with a lit ridge). At crumple 0 it is the flying
// WorkSheet's own outline, ink and tone in its hand-over pose (check: 0.000 px), and it blends that outline (on
// screen, never through an edge-on pose) to a resting pose as it falls; loose sheets keep crumple 0.62, squashed flat.
//
// DEPTH: eye Y -290, dRef 1700 at kRef 1.32, dolly 0.5, fog by the eye (officeScene(0.35)). The Genius at X -330,
// Z 0 (dir 1); his desk x 48..173 along +X, Z -30..220, the monitor at x 160 (OfficeDesk); the pad at x 108, Z -4; the
// wire bin (R 36, H 72) at X G + 262, Z -130; the heap's slots in rings round its foot (52, 80, 108 units from its
// axis, two layers up against it). The window moved to X -200..420, sill -330 (OfficeRoom's room prop).
// CHECKS: scripts/clips/rsi-since-writing/check-too-dumb.ts (camera lobe, head vs keep-in box and bands, paper vs the
// face, paper screen speeds, heap extent and count, the sheet -> ball hand-over).
//
// SOURCES: none on screen (no figures, no text).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AIR, AirStage, WorldSvg, airWorldOf, c01, makeCamera, mixHex, swayCam, type AirWorld, type DepthOpts, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { GENIUS_POSES, Genius, type GeniusPose } from "../rsi-ten-earths/tenEarthsGenius";
import { CREAM, DEAD, OFFICE, OfficeDesk, OfficeRoom, OfficeShafts, OfficeTint, SHEET, SheetStack, WireBin, WorkSheet, officeScene, stackTop, type SheetPose } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 83;
export const schema = z.object({ guides: z.boolean().default(false) });
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sst = (a: number, b: number, x: number) => {
  const u = c01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
/** the world module's own hash (sinceWritingWorld h01), so the ink lines match the WorkSheet's */
const h01 = (s: string) => random(`sw-${s}`);
const hash = (i: number, k: number) => random(`tdu-${i}-${k}`);

// ---------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------
export const SUN_T = 0.35;
export const DEPTH: DepthOpts = { eyeY: -290, dRef: 1700, kRef: 1.32, dolly: 0.5 };
/** the Genius's seat (the floor under his hips), facing right */
export const G = { X: -330, Z: 0 };
/** the pad on his desk between the keyboard and the monitor (the source of the sheets) */
export const PAD = { X: G.X + 108, Y: -132, Z: -4, n: 7, yaw: 3, seed: 7 };
/** the wire bin in front of the desk's right end */
export const BIN = { X: G.X + 262, Z: -130, R: 36, H: 72 };
/** the room: the window to the left, behind the Genius (the heap against the plain plaster) */
const ROOM = { ...OFFICE, win: { ...OFFICE.win, x0: -200, x1: 420, sill: -330, head: -680 } };

// ---------------------------------------------------------------------------
// THE SLOTS: where each ball comes to rest (world units; Y = the ball's centre). The bin's inside fills layer by layer,
// a dome rises over the rim, then the heap grows round the bin's foot (front and sides), each ball resting on the ones
// below it. The first PREFILL slots are full at f0.
// ---------------------------------------------------------------------------
export const RB = 15; // a ball's radius (CrumpledSheet's ball at size 15 / 13)
export type Slot = { X: number; Y: number; Z: number; inBin: boolean; rot: number; seed: number };
const ring = (d: number, Y: number, deg: number, i: number, inBin: boolean): Slot => {
  const a = (deg * Math.PI) / 180;
  const j = inBin ? 1.5 : 3;
  return {
    X: BIN.X + d * Math.cos(a) + (hash(i, 1) - 0.5) * j,
    Y: Y + (hash(i, 2) - 0.5) * (inBin ? 2 : 1.5),
    Z: BIN.Z + d * Math.sin(a) + (hash(i, 3) - 0.5) * j,
    inBin,
    rot: hash(i, 4) * 360,
    seed: 11 + i,
  };
};
// rings round the bin's axis: A touches the bin (d = R + RB + 2), B and C further out on the floor; layers 2 and 3 rest
// in the hollows of the ring below, against the bin
const dA = BIN.R + RB + 2;
const dB = dA + 2 * RB - 2;
const dC = dB + 2 * RB - 2;
const y1 = -RB;
const y2 = -RB - 25;
const y3 = -RB - 49;
// angles: 270 = straight toward the camera (-Z), 180 = left (toward the desk), 0 = right
const SLOT_DEFS: [number, number, number, boolean][] = [
  // inside the bin: four layers of three (full at f0)
  [15, -16, 30, true], [15, -16, 150, true], [15, -16, 270, true],
  [15, -40, 90, true], [15, -40, 210, true], [15, -40, 330, true],
  [16, -63, 30, true], [16, -63, 150, true], [16, -63, 270, true],
  // the rim layer and the low dome over it
  [18, -76, 90, true], [18, -76, 210, true], [18, -76, 330, true],
  [12, -88, 30, true], [12, -88, 150, true], [12, -88, 270, true],
  // the heap round the foot, in fill order: a ring on the floor first (the bin's rim stays in sight), then out and up
  [dA, y1, 270, false], [dA, y1, 237, false], [dA, y1, 303, false], [dA, y1, 204, false],
  [dA, y1, 336, false], [dB, y1, 262, false], [dB, y1, 238, false], [dB, y1, 286, false],
  [dA, y1, 171, false], [dA, y1, 9, false], [dA - 3, y2, 221, false], [dA - 3, y2, 320, false],
  [dB, y1, 214, false], [dB, y1, 310, false], [dC, y1, 256, false], [dC, y1, 276, false],
  [dA - 3, y2, 254, false], [dA - 3, y2, 287, false], [dB, y1, 190, false], [dC, y1, 236, false],
  [dC, y1, 296, false], [dB - 2, y2, 226, false], [dB - 2, y2, 298, false], [dB - 2, y2, 250, false],
  [dB - 2, y2, 274, false], [dA - 5, y3, 228, false], [dA - 5, y3, 312, false], [dB, y1, 334, false],
  [dC, y1, 216, false], [dC, y1, 316, false],
];
export const SLOTS: Slot[] = SLOT_DEFS.map(([d, Y, deg, inBin], i) => ring(d, Y, deg, i, inBin));
export const PREFILL = 15;
/** the dome's top (where the overflow balls land before tumbling off) */
export const DOME_TOP = { X: BIN.X + 1, Y: -100, Z: BIN.Z - 2 };

// ---------------------------------------------------------------------------
// THE STREAM: launches at a constant cadence; ball i (0-based) fills slot PREFILL + i
// ---------------------------------------------------------------------------
export const CADENCE = 3.2;
export const L0 = -16;
export const D_AIR = 19;
/** the tumble off the dome to its heap slot: longer the further it rolls (even screen speeds) */
export const tumbleOf = (i: number) => {
  const s = slotOf(i);
  return 7 + Math.hypot(s.X - BIN.X, s.Z - BIN.Z) / 16;
};
/** tau at which the flying sheet (tipped toward us, still turning) hands over to the ball (WorkSheet -> Wad) */
export const UPRIGHT = 0.62;
/** each sheet hands over at its own moment and place along its flight (so no sheet hangs on one spot) */
export const uprightOf = (i: number) => UPRIGHT - 0.1 + 0.2 * hash(i, 11);
/** about one sheet in six only half crumples: it lands as a loose crinkled sheet lying flat-ish in the heap */
export const looseOf = (i: number) => hash(i, 14) < 0.18;
const crumpleMax = (i: number) => (looseOf(i) ? 0.62 : 1);
export const launchOf = (i: number) => L0 + CADENCE * i;
export const N_FLY = Math.floor((DURATION - 1 - L0) / CADENCE) + 1;
export const slotOf = (i: number) => SLOTS[Math.min(SLOTS.length - 1, PREFILL + i)];
/** the frame ball i first touches the dome or its bin slot, and the frame it is at rest */
export const contactOf = (i: number) => launchOf(i) + D_AIR;
export const restOf = (i: number) => contactOf(i) + (slotOf(i).inBin ? 0 : tumbleOf(i));
/** balls at rest at frame f (the prefill included) */
export const restingAt = (f: number) => {
  let n = PREFILL;
  for (let i = 0; i < N_FLY; i++) if (restOf(i) <= f + 1e-9) n++;
  return n;
};

/** the pad's next sheet (where every flight starts) */
export const PAD_TOP: SheetPose = stackTop(PAD.X, PAD.Z, PAD.n + 1, PAD.Y, PAD.yaw, PAD.seed);
/** the air segment's contact point of ball i */
export const airEnd = (i: number) => {
  const s = slotOf(i);
  if (s.inBin) return { X: s.X, Y: s.Y, Z: s.Z };
  // each overflow ball lands on the dome's top a little toward the side it will roll off to
  const dx = s.X - BIN.X;
  const dz = s.Z - BIN.Z;
  const dl = Math.hypot(dx, dz) || 1;
  return { X: DOME_TOP.X + (15 * dx) / dl, Y: DOME_TOP.Y + 5, Z: DOME_TOP.Z + (15 * dz) / dl };
};
/** the centre of ball i in the air (tau 0..1): even across (the sheet shoots off the pad at a constant speed), low
 *  under the monitor's screen while it is flat, then falling (gravity: Y eases in) into the bin or onto the dome */
export const LIFT = 24;
const ARC_Q = 2.5;
const ARC_N = Math.pow(ARC_Q / (ARC_Q + 1), ARC_Q) * (1 / (ARC_Q + 1));
export const airPos = (i: number, tau: number) => {
  const a = { X: PAD_TOP.X, Y: PAD_TOP.Y, Z: PAD_TOP.Z };
  const b = airEnd(i);
  const s = c01(tau);
  const lift = LIFT + 10 * (hash(i, 5) - 0.5);
  // a skewed arc: it skims off the pad nearly flat under the screen and rises late (apex at s ~0.71), then drops in
  const arc = (Math.pow(s, ARC_Q) * (1 - s)) / ARC_N;
  // across: shot off the pad fast, slowing as it drops (no sheet lingers by the monitor)
  const hs = 1 - Math.pow(1 - s, 1.45);
  return {
    X: lerp(a.X, b.X, hs) + 6 * Math.sin(Math.PI * s) * (hash(i, 6) - 0.5),
    Y: a.Y + (b.Y - a.Y) * Math.pow(s, 1.8) - lift * arc - 10 * 4 * s * (1 - s),
    Z: lerp(a.Z, b.Z, hs),
  };
};
/** the tumble off the dome to the heap slot (u 0..1): out fast, down accelerating */
export const tumblePos = (i: number, u: number) => {
  const s = slotOf(i);
  const c = airEnd(i);
  const t = c01(u);
  // off the dome sideways first (clear of the rim), then down (gravity)
  const h = 1 - Math.pow(1 - t, 2.8);
  const v = Math.pow(t, 2.2);
  return { X: lerp(c.X, s.X, h), Y: lerp(c.Y, s.Y, v), Z: lerp(c.Z, s.Z, h) };
};
/** the crumple and the drain along the air segment */
export const crumpleAt = (i: number, tau: number) => crumpleMax(i) * sst(uprightOf(i), uprightOf(i) + 0.13, tau);
/** the drain is gradual: cream while it crumples, only a little grey by the time it lands, greying on to its own
 *  light DEAD in the heap over ~45 frames (so the newest balls are the brightest) */
export const D_FLY = 0.3;
export const drainAt = (i: number, tau: number) => D_FLY * sst(uprightOf(i) + 0.08, 1, tau);
export const drainMaxOf = (i: number) => 0.52 + 0.3 * hash(i, 15);
export const drainAfter = (i: number, f: number) => lerp(D_FLY, drainMaxOf(i), sst(0, 45, f - contactOf(i)));
/** a loose sheet settles flat-ish: squashed about its lowest point as it comes to rest */
export const LOOSE_SQUASH = 0.58;

const D2R = Math.PI / 180;
type V3 = [number, number, number];
/** a sheet-local point (u, v in -1..1) in world units: the world module's own sheetPt math (copied, read-only module) */
export const sheetPt = (q: SheetPose, u: number, v: number): V3 => {
  let x = (u * SHEET.w) / 2;
  let y = -c01(q.curl) * 9 * u * u + c01(q.curl) * 3 * v * v;
  let z = (v * SHEET.l) / 2;
  const cr = Math.cos(q.roll * D2R);
  const sr = Math.sin(q.roll * D2R);
  [x, y] = [x * cr - y * sr, x * sr + y * cr];
  const cp = Math.cos(q.pitch * D2R);
  const sp = Math.sin(q.pitch * D2R);
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  const cy = Math.cos(q.yaw * D2R);
  const sy = Math.sin(q.yaw * D2R);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  return [q.X + x, q.Y + y, q.Z + z];
};
/** WorkSheet's outline in sheet-local (u, v) (curl 0: 6 points a side, from the (-1,-1) corner) */
const sheetLocal = (): P2[] => {
  const N = 6;
  const e: P2[] = [];
  for (let i = 0; i < N; i++) e.push([-1 + (2 * i) / N, -1]);
  for (let i = 0; i < N; i++) e.push([1, -1 + (2 * i) / N]);
  for (let i = 0; i < N; i++) e.push([1 - (2 * i) / N, 1]);
  for (let i = 0; i < N; i++) e.push([-1, 1 - (2 * i) / N]);
  return e;
};
export const sheetEdge = (q: SheetPose): V3[] => sheetLocal().map(([u, v]) => sheetPt(q, u, v));
/** the flying sheet's pose (tau < its hand-over): off the pad flat, fluttering, tipping its inked face a little up
 *  toward us (pitch 25-45, rolled 28-45 deg either way, yawed): a sheet flying, never one standing face-on */
export const sheetPoseAt = (i: number, tau: number): SheetPose => {
  const UP = uprightOf(i);
  const p = airPos(i, tau);
  const u = c01(tau / UP);
  const ease = sst(0.45, 1, u);
  const fl = Math.sin(Math.PI * u);
  return {
    X: p.X,
    Y: p.Y,
    Z: p.Z,
    // it banks and swings as soon as it leaves the pad (a diagonal, turning sliver past the monitor), tips up late
    yaw: lerp(PAD_TOP.yaw, (hash(i, 9) < 0.5 ? -1 : 1) * (25 + 20 * hash(i, 21)), sst(0.05, 0.8, u)),
    pitch: (25 + 20 * hash(i, 12)) * ease + 10 * Math.sin(2 * Math.PI * 1.3 * u + 6 * hash(i, 10)) * fl,
    roll: (hash(i, 13) < 0.5 ? -1 : 1) * (30 + 15 * hash(i, 17)) * sst(0.05, 0.6, u) + 14 * Math.sin(2 * Math.PI * 0.9 * u + 6 * hash(i, 8)) * fl,
    curl: u >= 1 ? 0 : 0.6 * fl,
  };
};

export type Ball = {
  key: string;
  X: number;
  Y: number;
  Z: number;
  crumple: number;
  drain: number;
  rot: number;
  seed: number;
  inside: boolean;
  phase: "air" | "tumble" | "rest";
  /** the hand-over pose (the ball's flat shape at crumple 0), moved with the ball */
  hp?: SheetPose;
  /** the resting pose it turns to (blended on screen by hpT) */
  hp2?: SheetPose;
  hpT?: number;
  squash?: number;
  sheet?: SheetPose;
};
/** every ball and flying sheet at frame f (static ones included) */
export const ballsAt = (f: number): Ball[] => {
  const out: Ball[] = [];
  for (let k = 0; k < PREFILL; k++) {
    const s = SLOTS[k];
    out.push({ key: `p${k}`, X: s.X, Y: s.Y, Z: s.Z, crumple: 1, drain: 0.74 + 0.1 * hash(k, 16), rot: s.rot, seed: s.seed, inside: true, phase: "rest" });
  }
  for (let i = 0; i < N_FLY; i++) {
    const L = launchOf(i);
    if (f < L) continue;
    const s = slotOf(i);
    const C = contactOf(i);
    const spin = (hash(i, 7) - 0.5) * 240;
    const hp0 = sheetPoseAt(i, uprightOf(i));
    const hr: SheetPose = { ...hp0, yaw: (hash(i, 18) - 0.5) * 40, pitch: 38 + 14 * hash(i, 19), roll: (hash(i, 20) - 0.5) * 40, curl: 0 };
    // the ball's flat shape: the hand-over pose's outline blended on screen into a resting pose's (a loose sheet lands
    // facing up toward us); blended as outlines, not as angles, so it never passes edge-on
    const hpAt = (t: number, p: { X: number; Y: number; Z: number }) => ({ hp: { ...hp0, ...p }, hp2: { ...hr, ...p }, hpT: t });
    const cm = crumpleMax(i);
    if (f < C) {
      const tau = (f - L) / D_AIR;
      const p = airPos(i, tau);
      const UP = uprightOf(i);
      const rot = s.rot - spin * (1 - tau);
      const b: Ball = { key: `f${i}`, ...p, crumple: crumpleAt(i, tau), drain: drainAt(i, tau), rot, seed: s.seed, inside: s.inBin && tau > 0.75, phase: "air", ...hpAt(sst(UP, 1, tau), p) };
      // the sheet phase: off the pad, turning its inked face part way up to us; at UP the ball takes over on the
      // same picture (Wad at crumple 0 = this sheet in its hand-over pose, its tone included)
      if (tau < UP) b.sheet = sheetPoseAt(i, tau);
      out.push(b);
    } else if (!s.inBin && f < C + tumbleOf(i)) {
      const u = (f - C) / tumbleOf(i);
      const p = tumblePos(i, u);
      const sq = looseOf(i) ? lerp(1, LOOSE_SQUASH, sst(0.4, 1, u)) : 1;
      out.push({ key: `f${i}`, ...p, crumple: cm, drain: drainAfter(i, f), rot: s.rot + spin * 0.6 * (1 - u) * (1 - u), seed: s.seed, inside: false, phase: "tumble", ...hpAt(1, p), squash: sq });
    } else {
      out.push({ key: `f${i}`, X: s.X, Y: s.Y, Z: s.Z, crumple: cm, drain: drainAfter(i, f), rot: s.rot, seed: s.seed, inside: s.inBin, phase: "rest", ...hpAt(1, s), squash: looseOf(i) ? LOOSE_SQUASH : 1 });
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE CAMERA: one slow push in (f0 -> f70, one lobe), then a creep
// ---------------------------------------------------------------------------
/** the 2D camera that puts the world point (X, Y, Z) at the screen point (sx, sy) at zoom k */
const camFor = (f: number, k: number, X: number, Y: number, Z: number, sx: number, sy: number) => {
  const Dc = DEPTH.dRef * Math.pow(DEPTH.kRef / k, DEPTH.dolly);
  const r = Dc / (Dc + Z);
  const py = DEPTH.eyeY + (Y - DEPTH.eyeY) * r;
  // screen x = 540 + (X - cx) * r * k (the perspective scales about cx)
  return { f, k, wx: X - (sx - 540) / (r * k), wy: py - (sy - 960) / k, sx: 540, sy: 960 };
};
export const CAM_KEYS = [
  camFor(0, 1.65, BIN.X, 0, BIN.Z, 685, 1215),
  camFor(70, 2.3, BIN.X, 0, BIN.Z, 772, 1250),
  camFor(82, 2.315, BIN.X, 0, BIN.Z, 773, 1251),
];
const camKeys = makeCamera(CAM_KEYS);
export const camOf = (f: number) => swayCam(camKeys(f), f);
const REST = camOf(0);

// ---------------------------------------------------------------------------
// THE GENIUS: typing the whole cut; the puzzled glance at the heap on "stupid"
// ---------------------------------------------------------------------------
export const glanceAt = (f: number) => sst(24, 31, f) * (1 - sst(50, 57, f));
export const geniusAt = (f: number): GeniusPose => {
  const q = GENIUS_POSES.typeAtDesk(1, f);
  const g = glanceAt(f);
  if (g <= 0) return q;
  return {
    ...q,
    headYaw: q.headYaw + 0.1 * g,
    pitch: q.pitch + 18 * g,
    roll: q.roll + 8 * g,
    look: [lerp(q.look?.[0] ?? 0, 0.55, g), lerp(q.look?.[1] ?? 0, 0.85, g)],
    worry: 0.8 * g,
    mouth: lerp(q.mouth, 0, g),
  };
};

// ---------------------------------------------------------------------------
// THE BALL (cut-local): CrumpledSheet's geometry with the ink as an upright WorkSheet shows it
// ---------------------------------------------------------------------------
const SHEET_INK = "#6E6254";
/** the ball's paper: a light cream (it greys toward DEAD only by `drain`) */
const BALL_BASE = mixHex(CREAM, "#E4DAC6", 0.3);
/** an open path through the points as a smooth closed curve; tension 0 = the plain polygon (the same picture) */
const smoothPath = (pts: P2[], t: number) => {
  const n = pts.length;
  let d = `M${Pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: P2 = [p1[0] + ((p2[0] - p0[0]) * t) / 6, p1[1] + ((p2[1] - p0[1]) * t) / 6];
    const c2: P2 = [p2[0] - ((p3[0] - p1[0]) * t) / 6, p2[1] - ((p3[1] - p1[1]) * t) / 6];
    d += `C${Pt(c1)} ${Pt(c2)} ${Pt(p2)}`;
  }
  return `${d}Z`;
};
const UPRIGHT_POSE = { yaw: 0, pitch: 90, roll: 0, curl: 0 };
/** the ball's outline: from the hand-over sheet's outline (crumple 0) to a round ball with a few soft lumps */
type OutlineIn = { X: number; Y: number; Z: number; seed: number; rot: number; crumple: number; hp?: SheetPose; hp2?: SheetPose; hpT?: number };
/** one pose's flat outline on screen, with each point's place round the ball: its angle on the sheet itself, turned
 *  as the sheet's axes show on screen (so the points stay evenly spread even when the sheet is seen edge-on) */
const flatOutline = (P: AirWorld["P"], q: SheetPose, c: P2) => {
  const pu = P.p(...sheetPt(q, 1, 0));
  const pv = P.p(...sheetPt(q, 0, 1));
  const al = Math.atan2(pu[1] - c[1], pu[0] - c[0]);
  const sg = (pu[0] - c[0]) * (pv[1] - c[1]) - (pu[1] - c[1]) * (pv[0] - c[0]) >= 0 ? 1 : -1;
  const loc = sheetLocal();
  return sheetEdge(q).map((w, k) => ({ s: P.p(w[0], w[1], w[2]), a: al + sg * Math.atan2(loc[k][1] * SHEET.l, loc[k][0] * SHEET.w) }));
};
const wrapPi = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
/** the ball's outline: from the flat sheet's outline (crumple 0) to a round ball with a few soft lumps */
export const wadOutline = (P: AirWorld["P"], b: OutlineIn): { pts: P2[]; c: P2; e: number; rotA: number; q: SheetPose; q2: SheetPose | null; t: number } => {
  const c = P.p(b.X, b.Y, b.Z);
  const r = P.r(b.Z);
  const e = sst(0, 1, c01(b.crumple));
  const pos = { X: b.X, Y: b.Y, Z: b.Z };
  const q: SheetPose = { ...UPRIGHT_POSE, ...b.hp, ...pos };
  const t = c01(b.hpT ?? 0);
  const A0 = flatOutline(P, q, c);
  const A1 = b.hp2 && t > 0 ? flatOutline(P, { ...b.hp2, ...pos }, c) : null;
  const rr = (k: string) => h01(`${k}${b.seed}`);
  const rotA = ((b.rot + 40 * rr("ro")) * Math.PI) / 180;
  const ph = [rr("h1"), rr("h2"), rr("h3")].map((v) => v * Math.PI * 2);
  const pts = A0.map((o0, k): P2 => {
    let s = o0.s;
    let a = o0.a;
    if (A1) {
      const o1 = A1[k];
      s = [lerp(o0.s[0], o1.s[0], t), lerp(o0.s[1], o1.s[1], t)];
      a = o0.a + wrapPi(o1.a - o0.a) * t;
    }
    // round, with a few soft lumps (low harmonics only: no spikes)
    const R0 = RB * (1 + 0.075 * Math.sin(2 * a + ph[0]) + 0.06 * Math.sin(3 * a + ph[1]) + 0.03 * Math.sin(5 * a + ph[2]));
    // the outline's own turn comes in late (e^3): half-crumpled, the round target stays near the flat outline's
    // angles, so the blend never pinches into a bow-tie
    const ta = a + rotA * e * e * e;
    return [lerp(s[0], c[0] + R0 * r * Math.cos(ta), e), lerp(s[1], c[1] + R0 * r * Math.sin(ta), e)];
  });
  return { pts, c, e, rotA, q, q2: A1 ? { ...b.hp2!, ...pos } : null, t };
};
const Wad: React.FC<{ A: AirWorld; b: Ball; uid: string }> = ({ A, b, uid }) => {
  const P = A.P;
  const { Y, Z, seed, drain } = b;
  const { pts, c, e, rotA, q, q2, t } = wadOutline(P, b);
  // a sheet-local point on screen (blended with the resting pose like the outline)
  const sp = (u: number, v: number): P2 => {
    const a = P.p(...sheetPt(q, u, v));
    if (!q2) return a;
    const z = P.p(...sheetPt(q2, u, v));
    return [lerp(a[0], z[0], t), lerp(a[1], z[1], t)];
  };
  const r = P.r(Z);
  const rr = (k: string) => h01(`${k}${seed}`);
  const d = smoothPath(pts, e);
  const dr = c01(drain);
  const col = (hex: string) => A.tone(mixHex(hex, DEAD, dr), Z, -Y);
  // the hand-over sheet's own face tone (WorkSheet's: a little darker as it tips), then the ball's light paper
  const nUpOf = (o: SheetPose) => Math.abs(Math.cos(o.pitch * D2R) * Math.cos(o.roll * D2R));
  const nUp = q2 ? lerp(nUpOf(q), nUpOf(q2), t) : nUpOf(q);
  const base = mixHex(mixHex(CREAM, "#D9CDB4", 0.35 * (1 - Math.abs(nUp))), BALL_BASE, e);
  const inner: React.ReactNode[] = [];
  const ink = 1 - sst(0.35, 1, e);
  if (ink > 0.01) {
    // the ink lines and the corner tick, as WorkSheet draws them on this pose (they fade as it crumples)
    let ld = "";
    for (let j = 0; j < 6; j++) {
      const v = -0.62 + j * 0.21;
      const len = 0.9 + 0.55 * h01(`sl${j}`);
      const lp: P2[] = [];
      for (let k = 0; k <= 4; k++) lp.push(sp(-0.72 + (len * k) / 4, v));
      ld += `M${lp.map(Pt).join("L")}`;
    }
    inner.push(<path key="ln" d={ld} stroke={col(SHEET_INK)} strokeOpacity={0.42 * ink} strokeWidth={f2(1.25 * r)} fill="none" strokeLinecap="round" />);
    const m = [sp(0.5, 0.74), sp(0.6, 0.84), sp(0.8, 0.62)];
    inner.push(<path key="mk" d={`M${m.map(Pt).join("L")}`} stroke={col("#4E5A57")} strokeOpacity={0.7 * ink} strokeWidth={f2(1.5 * r)} fill="none" strokeLinecap="round" strokeLinejoin="round" />);
  }
  if (e > 0.02) {
    const R = RB * r;
    const at = (a: number, rad: number): P2 => [c[0] + Math.cos(a + rotA) * rad * R, c[1] + Math.sin(a + rotA) * rad * R];
    // soft facets: a few broad planes, lit and shaded
    for (let k = 0; k < 4; k++) {
      const a0 = rr(`f${k}`) * Math.PI * 2;
      const w = 0.7 + 0.5 * rr(`g${k}`);
      const q3 = [at(a0, 1.2), at(a0 + w, 1.2), at((a0 + a0 + w) / 2 + 0.3 * (rr(`m${k}`) - 0.5), 0.15 + 0.3 * rr(`n${k}`))];
      inner.push(<path key={`fc${k}`} d={poly(q3)} fill={col(k % 2 ? "#BDAF95" : "#FFFAF0")} opacity={(k % 2 ? 0.26 : 0.3) * e} />);
    }
    // crease lines: folds crossing the ball in random directions (rim to rim with one or two kinks), each with a lit
    // ridge beside it (not radial: no segments like an onion)
    let dk = "";
    let lt = "";
    for (let k = 0; k < 6; k++) {
      const a0 = rr(`c${k}`) * Math.PI * 2;
      const a1 = a0 + Math.PI * (0.45 + 0.7 * rr(`d${k}`));
      const pA = at(a0, 1.08);
      const pB = at(a1, 1.08);
      const m1 = at(a0 + (a1 - a0) * 0.35 + 0.5 * (rr(`e${k}`) - 0.5), 0.2 + 0.45 * rr(`k${k}`));
      const m2 = at(a0 + (a1 - a0) * 0.7 + 0.5 * (rr(`j${k}`) - 0.5), 0.25 + 0.5 * rr(`o${k}`));
      const line = (o: number) => [pA, m1, m2, pB].map((q, z) => `${z ? "L" : "M"}${f2(q[0] - o)},${f2(q[1] - o)}`).join("");
      dk += line(0);
      lt += line(0.9 * r);
    }
    inner.push(<path key="crl" d={lt} stroke={col("#FFF8EA")} strokeOpacity={0.5 * e} strokeWidth={f2(0.9 * r)} fill="none" strokeLinejoin="round" strokeLinecap="round" />);
    inner.push(<path key="crd" d={dk} stroke={col("#8F8068")} strokeOpacity={0.5 * e} strokeWidth={f2(0.85 * r)} fill="none" strokeLinejoin="round" strokeLinecap="round" />);
    inner.push(<rect key="lt" x={f2(c[0] - RB * 1.5 * r)} y={f2(c[1] - RB * 1.5 * r)} width={f2(RB * 3 * r)} height={f2(RB * 3 * r)} fill={`url(#${uid}-lt)`} />);
  }
  const sq = b.squash ?? 1;
  const by = c[1] + RB * r;
  const tf = sq < 0.999 ? `translate(${f2(c[0])},${f2(by)}) scale(${f2(1 + (1 - sq) * 0.25)},${sq.toFixed(3)}) translate(${f2(-c[0])},${f2(-by)})` : undefined;
  return (
    <g transform={tf}>
      <defs>
        <clipPath id={`${uid}-cl`}>
          <path d={d} />
        </clipPath>
        <radialGradient id={`${uid}-lt`} cx="0.34" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28 * e} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.78" stopColor={PAL.shadow} stopOpacity={0.08 * e} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.3 * e} />
        </radialGradient>
      </defs>
      <path d={d} fill={col(base)} stroke={col("#B5A68A")} strokeWidth={f2(0.6 * r)} strokeOpacity={lerp(0.7, 0.55, e)} strokeLinejoin="round" />
      <g clipPath={`url(#${uid}-cl)`}>{inner}</g>
    </g>
  );
};

/** a soft contact shadow under a resting heap ball (on the floor) */
const BallShadow: React.FC<{ A: AirWorld; X: number; Z: number; uid: string; amt: number }> = ({ A, X, Z, uid, amt }) => {
  const P = A.P;
  const c = P.p(X + 4, 0, Z + 3);
  const r = P.r(Z);
  const a = 0.42 * amt * (1 - A.fog(Z));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}`}>
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={a} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={RB * 1.5 * r} ry={RB * 0.55 * r} fill={`url(#${uid})`} />
    </g>
  );
};

const Guides: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={65} y={290} width={950} height={780} fill="none" stroke="#2B6F8F" strokeWidth={2} strokeDasharray="10 8" opacity={0.8} />
    <rect x={0} y={1080} width={1080} height={170} fill="#2B6F8F" opacity={0.15} />
    <rect x={0} y={1360} width={1080} height={100} fill="#2B6F8F" opacity={0.15} />
    <line x1={0} x2={1080} y1={650} y2={650} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
    <line x1={0} x2={1080} y1={880} y2={880} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
    <line x1={955} x2={955} y1={900} y2={1920} stroke="#2B6F8F" strokeWidth={1} opacity={0.6} />
  </svg>
);

const TooDumbToUseIt: React.FC<z.infer<typeof schema>> = ({ guides }) => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, scene: officeScene(SUN_T) });
  const ga = A.P.at(G.X, G.Z);
  const gPose = geniusAt(frame);

  // the paper: sort by distance from the eye, far first
  const eye = { X: A.P.vp[0], Y: DEPTH.eyeY, Z: -A.P.Dc };
  const dist = (b: Ball) => Math.hypot(b.X - eye.X, b.Y - eye.Y, b.Z - eye.Z);
  const balls = ballsAt(frame).sort((a, b) => dist(b) - dist(a));
  const draw = (b: Ball) => (
    <g key={b.key}>
      {/* the ball takes over from the sheet at its hand-over pose (the same picture) */}
      {b.sheet ? null : <Wad A={A} b={b} uid={`w${b.key}`} />}
      {b.sheet ? <WorkSheet A={A} pose={b.sheet} uid={`s${b.key}`} /> : null}
    </g>
  );
  const inside = balls.filter((b) => b.inside);
  const outside = balls.filter((b) => !b.inside);
  // heap shadows: under every ball resting on (or about to reach) the floor
  const shadows = outside.filter((b) => b.Y > -RB - 30 && b.phase !== "air").map((b) => <BallShadow key={`sh${b.key}`} A={A} X={b.X} Z={b.Z} uid={`bs${b.key}`} amt={c01(1 - (-b.Y - RB) / 30)} />);

  return (
    <AbsoluteFill>
      <AirStage v={A.v} shafts={0} bloom={0.22} overlay={<OfficeTint sunT={SUN_T} />}>
        <WorldSvg cam={cam}>
          <OfficeRoom A={A} sunT={SUN_T} uid="room" room={ROOM} />
          <OfficeDesk A={A} X={G.X} Z={G.Z} dir={1} uid="gd" layer="back" />
          <SheetStack A={A} X={PAD.X} Z={PAD.Z} Y={PAD.Y} n={PAD.n} yaw={PAD.yaw} seed={PAD.seed} uid="pad" />
          <Genius variant={0} pose={gPose} at={ga.at} scale={ga.scale} uid="ai" frame={frame} fog={A.folkFog(G.Z)} unitPx={A.k} />
          <OfficeDesk A={A} X={G.X} Z={G.Z} dir={1} uid="gdf" layer="front" />
          <WireBin A={A} X={BIN.X} Z={BIN.Z} R={BIN.R} H={BIN.H} uid="bin" layer="back" />
          {inside.map(draw)}
          <WireBin A={A} X={BIN.X} Z={BIN.Z} R={BIN.R} H={BIN.H} uid="binf" layer="front" />
          {shadows}
          {outside.map(draw)}
          <OfficeShafts A={A} sunT={SUN_T} uid="sh" room={ROOM} />
        </WorldSvg>
      </AirStage>
      {guides ? <Guides /> : null}
    </AbsoluteFill>
  );
};

export default TooDumbToUseIt;
