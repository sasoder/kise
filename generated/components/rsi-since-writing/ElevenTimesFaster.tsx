// ---------------------------------------------------------------------------
// ElevenTimesFaster (rsi-since-writing, cut 12). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 183 frames.
//
// CHECK LINE: "On real expert tasks, even an older AI ticked off 11 while the human expert finished 1."
//
// THE LINE: "which is dumber and less efficient than today's models, completed the tasks on OpenAI's GDPval benchmark
//   11 times faster than human experts."
// WORD -> FRAME: which -4 · is 4 · dumber 8 · and 16 · less 23 · efficient 28 · than 34 · today's 45 · models, 55 ·
//   completed 65 · the 72 · tasks 78 · on 87 · OpenAI's 96 · GDPval 111 · benchmark 124 · 11 134 · times 144 ·
//   faster 151 · than 160 · human 170 · experts. 175 · (Add 183)
// DURATION: the slot 12.3874 -> 20.0200 s = 7.633 s x 23.976 = 183 frames (f0..f182).
//
// THE MOTION (revision 1: the AI is the robot, every label lives on the board): one long GDPval task board on a
// plaster wall, two rows of identical cream task cards (each a few faint lines and an empty tick box): the upper row
// (above the heads) the human expert's (oatmeal shirt, glasses), the lower row (at the robot's chest) the AI's (the
// robot, tenEarthsBot v4: no antenna, a dial: an older model), the AI's row starting two cards right. Both raise
// their pencils from f0 (the expert's far hand, up in front of his face, never across it). The expert writes his
// first card's lines slowly in dark ink. The robot scribbles its first card in orange and ticks it (f20), then
// scurries the row (two short steps per card at the old speed, 66 units per ~10.7 frames, planted feet) and ticks every
// card as it passes (the pencil tip up and to the right, so its mitten stays under its wide head; IK on the card's
// world point each frame); the 11th tick lands on "11" (f135). The camera trucks right with it in one lobe (k 1.85 ->
// 1.78, cx 160 -> 652 at f136), the expert falling out of shot left. From f132 one continuous pull-back + pan (viewAt:
// the world turned 54 deg about X=Z=0, settled by ~f170, creep to f182) swings to an oblique view down the board: it
// recedes to the right in one-point perspective into the haze, both full rows in shot (the expert's 11 cards, the AI's
// 11 orange ticks), the robot kept in shot all the way (its planted feet the swing's anchor). It hurries on past the
// board's end, stops on a landing (~f163), steps its back foot up and turns to face the camera, planted, ~245 px tall,
// head turned toward the expert, clear of the AI's 11th card so all 11 ticks show from f170. The expert stands at the
// near end, larger, and ticks his ONE card in dark ink on "human experts" (f163-174), lowers the pencil and turns his
// head toward the orange row.
// THE LABELS are all on the board plane (LABELS / LabelOnBoard: strips of affine maps through the turned world, each
// toned by its own distance), so they foreshorten, take the board's light and air and turn with it: HUMAN EXPERT and
// GPT-5.2 pinned label cards at the starts of their rows (in from f6 / f2), a GDPval header card pinned at the board's
// top on "OpenAI's" (f92), and "11×" painted in cream on the linen just above the AI row's last four cards, wiped on
// from "times" (f140); no dust mote comes within 80 px of it (MOTE_SKIP). Living hold: breath, the head turns, the creep. Orange = the robot and its ticks and scribble only;
// the expert's ink is dark; nothing else is orange.
//
// DEPTH: eye 300 units up (1.69 m), dRef 1700 at kRef 1, dolly 0.5, fog by the eye (officeScene(0.35) air). The figures
// stand at Z 0, the board face (cards) at Z 33.5, the frame 34..46, the plaster wall at Z 46.
// CONTACT: each tick's ink grows only while the pencil tip is on it (tip = the ink head on every drawing frame).
//
// SOURCES: OpenAI, "Introducing GPT-5.2" (Dec 2025): on GDPval, GPT-5.2 Thinking produced outputs at >11x the speed
// (and <1 % the cost) of expert professionals ("11 times faster"). GDPval: OpenAI, "Measuring the performance of our
// models on real-world tasks" (Sep 2025), real work tasks from 44 occupations. On screen only GDPval, GPT-5.2,
// HUMAN EXPERT, 11× (COMMON.md, Facts on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  AirBox,
  AirFloor,
  AirShadow,
  AirStage,
  ORANGE_LINE,
  WorldSvg,
  airWorldOf,
  lineOf,
  c01,
  lerp,
  mixHex,
  pchip,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { POSES as CP, breathe, covidGripTo, lerpPose, walkPose, type CovidPose } from "../kyle-covid/covidFolkBody";
import { Bot, BOT_POSES, BOT_SHADOW, BOT_WALK_CYCLE, PENCIL_TIP, botBlink, botGripTo, botRig, botWalkAdvance, type BotPose } from "../rsi-ten-earths/tenEarthsBot";
import { MOTE_LAYERS, hash01, smoothstep, type AirView } from "../kyle-pandemics/pandemicAir";
import { HUMAN_POSES, Human } from "./sinceWritingFolk";
import { MAT_FLOORWOOD, MAT_FRAME, MAT_PLASTER, PLATE_FONT, officeScene } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 183;
export const schema = z.object({ grid: z.boolean().default(false) });
export const defaultProps = schema.parse({});

// ===================================================================================================================
// small maths
// ===================================================================================================================
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const ease = (v: number) => sst(0, 1, v);
const frac = (v: number) => v - Math.floor(v);
const f2 = (v: number) => v.toFixed(2);
const mix2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
/** covidFolk's breath clock runs on 29.97 fps frames */
const clock = (f: number) => (f * (30000 / 1001)) / FPS;
type PencilPose = CovidPose & { pencil?: { hand: "L" | "R"; ang: number; op?: number } };
const KIND = "officer" as const; // the build both casts draw (covidFolk officer v3)
const VAR = 3;

// ===================================================================================================================
// THE BOARD (units: X across, Y up -, Z depth; the board plane is Z_CARD)
// ===================================================================================================================
export const PITCH = 66; // one card + its gap (the robot takes two steps per card)
export const CARD = { w: 56, h: 52 };
const COL0 = 60;
export const colX = (c: number) => COL0 + c * PITCH;
export const ROW = { up: -387, lo: -175 }; // card tops: the expert's row above the heads, the AI's at the robot's chest
export const UP_COLS = Array.from({ length: 11 }, (_, i) => i); // the expert's 11
export const LO_COLS = Array.from({ length: 11 }, (_, i) => i + 2); // the AI's 11
export const Z_CARD = 33.5;
const Z_FRAME = 34;
const Z_WALL = 46;
const BOARD = { x0: -150, x1: 1400, y0: -548, y1: -45 };
/** card-local (x right, y down from the card's top-left): the tick box, the printed lines, the tick's stroke */
const BOX = { x0: 5, y0: 12, s: 30 };
const LINES = [16, 26, 36].map((y) => ({ y, x0: 39, x1: 51.5 }));
export const TICK: P2[] = [
  [9, 27],
  [16.5, 38],
  [37.5, 7.5],
];
/** a card-local point of a row's card as a 3D point on the board */
const cardPt = (row: "up" | "lo", col: number, p: P2) => ({ X: colX(col) + p[0], Y: ROW[row] + p[1], Z: Z_CARD });

// ===================================================================================================================
// THE CAMERA: one truck right + pull-back lobe (f0 -> f150), then a creep; the eyes held at screen y SY_EYE
// ===================================================================================================================
export const DEPTH: DepthOpts = { eyeY: -300, dRef: 1700, kRef: 1, dolly: 0.5 };
const WY_EYE = -284; // the head centre of a standing man at Z 0 (the faces' row)
const SY_EYE = 775;
const LK = pchip(
  [
    [0, Math.log(1.85)],
    [136, Math.log(1.78)],
    [170, Math.log(1.66)],
    [182, Math.log(1.65)],
  ],
  true,
);
const CXT = pchip(
  [
    [0, 160],
    [136, 652],
    [170, 250],
    [182, 245],
  ],
  true,
);
/** the first half's 2D camera (f0-136: the truck right with the robot; its keys past f136 only shape the curve) */
const camTruck = (f: number): Cam => {
  const k = Math.exp(LK(f));
  return { k, cx: CXT(f), cy: WY_EYE - (SY_EYE - 960) / k };
};
// THE SECOND HALF (T_SWING -> T_SET, creep to f182): one continuous pull-back + pan that swings round the robot (which
// plants at the far end of its row) to an oblique view, the board receding to the right toward its vanishing point.
// The camera is a pinhole: the world turned about X = Z = 0 by the yaw th (the board's far end goes deep), focal F
// (px), the horizon's screen y H. The swing interpolates th, F, H, the robot's depth from the camera dQ and its screen
// x xQ, and solves the camera's place from them, so it stays in shot (screen x ~840 -> 870) while the expert swings in
// from the left. At th 0 this is exactly camTruck.
export const T_SWING = 132;
const T_SET = 170;
const QX = 1010; // the anchor: the robot's planted feet at the end (X, Z 0), past the board's last card
type Swing = { th: number; F: number; H: number; dQ: number; xQ: number };
const swingOf = (c: Cam): Swing => {
  const Dc = DEPTH.dRef / Math.sqrt(c.k);
  const F = c.k * Dc;
  return { th: 0, F, H: 960 + (DEPTH.eyeY - c.cy) * c.k, dQ: Dc, xQ: 540 + (F * (QX - c.cx)) / Dc };
};
/** the settled oblique view (as yaw, focal, the camera's distance and X in the turned frame, the horizon) */
const OBL = { th: (54 * Math.PI) / 180, F: 2200, Dc: 1300, cx: 220, H: 760 };
const SW_A = swingOf(camTruck(T_SWING));
const SW_B: Swing = (() => {
  const qx = QX * Math.cos(OBL.th);
  const qz = QX * Math.sin(OBL.th);
  return { th: OBL.th, F: OBL.F, H: OBL.H, dQ: OBL.Dc + qz, xQ: 540 + (OBL.F * (qx - OBL.cx)) / (OBL.Dc + qz) };
})();
const SWING_U = pchip(
  [
    [T_SWING, 0],
    [T_SET, 0.985],
    [DURATION - 1, 1],
  ],
  true,
);
export const swingU = (f: number) => (f <= T_SWING ? 0 : SWING_U(f));
export type View = { cam: Cam; depth: DepthOpts; th: number };
export const viewAt = (f: number): View => {
  if (f <= T_SWING) return { cam: camTruck(f), depth: DEPTH, th: 0 };
  const u = swingU(f);
  const L = (k: keyof Swing) => lerp(SW_A[k], SW_B[k], u);
  const th = L("th");
  const F = L("F");
  const H = L("H");
  const qx = QX * Math.cos(th);
  const qz = QX * Math.sin(th);
  const Dc = L("dQ") - qz;
  const cx = qx - ((L("xQ") - 540) * (Dc + qz)) / F;
  const k = F / Dc;
  return { cam: { k, cx, cy: DEPTH.eyeY - (H - 960) / k }, depth: { ...DEPTH, dRef: Dc * Math.sqrt(k) }, th };
};
export const camAt = (f: number): Cam => viewAt(f).cam;
export const REST = swayCam(camTruck(0), 0);
/** the world turned by the view's yaw: A3 draws world points through the turn (A3.P.p / .at), dz is a point's depth in
 *  the turned frame (fog, scale), loc(X) an AirWorld whose depth-dependent parts (r, fog, tones) are taken at X */
export const turnWorld = (A: AirWorld, th: number) => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const rx = (X: number, Z: number) => X * c - Z * s;
  const dz = (X: number, Z: number) => X * s + Z * c;
  const P = A.P;
  const p = (X: number, Y: number, Z: number): P2 => P.p(rx(X, Z), Y, dz(X, Z));
  const P3 = { ...P, p, at: (X: number, Z: number) => ({ at: p(X, 0, Z), scale: P.r(dz(X, Z)) }) };
  const A3: AirWorld = { ...A, P: P3 };
  const loc = (X: number): AirWorld => ({
    ...A3,
    P: { ...P3, r: (Z: number) => P.r(dz(X, Z)) },
    fog: (Z: number) => A.fog(dz(X, Z)),
    airHex: (Z: number, h?: number) => A.airHex(dz(X, Z), h),
    tone: (hex: string, Z: number, h?: number) => A.tone(hex, dz(X, Z), h),
    toneO: (hex: string, Z: number, h?: number) => A.toneO(hex, dz(X, Z), h),
    folkFog: (Z: number, feetH?: number) => A.folkFog(dz(X, Z), feetH),
  });
  /** the nearest turned depth still drawn (a margin in front of the camera) */
  const zMin = -0.7 * P.Dc;
  return { A: A, A3, loc, dz, rx, th, zMin };
};
export type TW = ReturnType<typeof turnWorld>;
/** the whole world of frame f (sway on for the render, off for the checks) */
export const worldAt = (f: number, sway = true) => {
  const v = viewAt(f);
  const cam = sway ? swayCam(v.cam, f) : v.cam;
  const A = airWorldOf({ cam, rest: REST, depth: v.depth, frame: f, scene: SCENE });
  return { cam, A, W: turnWorld(A, v.th) };
};
export const SCENE = officeScene(0.35);

// ===================================================================================================================
// THE ROBOT (the AI: tenEarthsBot v4, no antenna: an older model): it stands at its first card, then scurries the
// row (two short steps per card: the same speed as the old one-step-per-card walk), ticking each card as it passes
// ===================================================================================================================
/** the robot's leg scale: its retargeted feet move LEGK as far as the rig's (from its own walk advance) */
const LEGK = (botWalkAdvance(1) * BOT_WALK_CYCLE) / 88;
/** the tick stroke's middle, units to the right of its feet: a low reach, the mitten under its wide head */
export const D_TICK = 56;
export const XG0 = colX(2) + 23 - D_TICK; // its feet at its first card
export const XE = 0; // the expert's feet
const G_BASE: CovidPose = CP.walk(1, 0, 0); // covidFolk's walk base (yaw 0.9) at amount 0: its standing pose too
const G_HALF = 5.3; // frames per step (two steps per card)
const G_WS = 23.7; // the walk starts (amount ramps in over the first step)
const G_PH0 = 0.25; // phase at the start: weight on the near foot, the far foot swings first
const G_STRIDE = PITCH / 2 / LEGK; // the rig's stride whose retargeted step is half a card
const gAmt = (f: number) => sst(G_WS, G_WS + G_HALF, f);
/** the phase rate: one step per G_HALF, a fifth quicker after the last tick (it hurries on past the board's end) */
const gRate = (f: number) => (1 + 0.2 * sst(140, 150, f)) / (2 * G_HALF);
const SUB = 8;
const N_SUB = (DURATION + 4) * SUB;
const tab = (T: number[], f: number) => {
  const i = Math.max(0, Math.min(T.length - 2, f * SUB));
  const i0 = Math.floor(i);
  return lerp(T[i0], T[i0 + 1], i - i0);
};
/** the phase as it would run on (the rate integrated from the walk's start) */
const PH_RAW: number[] = (() => {
  const out = [G_PH0];
  let p = G_PH0;
  for (let i = 1; i <= N_SUB; i++) {
    const a = Math.max(G_WS, (i - 1) / SUB);
    const b = i / SUB;
    if (b > a) p += gRate((a + b) / 2) * (b - a);
    out.push(p);
  }
  return out;
})();
/** the stance foot's local x (world units, the robot's own; the base feet left out: constant within a stance) */
const stanceOf = (p: number, amt: number) => {
  const uL = frac(p);
  const u = uL < 0.5 ? uL : frac(p + 0.5);
  return { side: uL < 0.5 ? 0 : 1, x: amt * G_STRIDE * LEGK * (0.5 - 2 * u) };
};
/** the body's X, integrated from the planted foot (it never slides): a table at SUB per frame */
const xTable = (ph: (f: number) => number) => {
  const out = [XG0];
  let X = XG0;
  let prev = stanceOf(ph(0), gAmt(0));
  for (let i = 1; i <= N_SUB; i++) {
    const cur = stanceOf(ph(i / SUB), gAmt(i / SUB));
    if (cur.side === prev.side) X -= cur.x - prev.x;
    prev = cur;
    out.push(X);
  }
  return out;
};
/** where it stops: on the first landing past X_GOAL (clear of the AI's last card in the settled view) */
const X_GOAL = 990;
export const F_STOP = (() => {
  const XR = xTable((f) => tab(PH_RAW, f));
  let i = 0;
  while (i < N_SUB && XR[i] < X_GOAL) i++;
  const pStop = Math.ceil(PH_RAW[i] * 2) / 2;
  let j = i;
  while (j < N_SUB && PH_RAW[j + 1] < pStop) j++;
  return (j + (pStop - PH_RAW[j]) / (PH_RAW[j + 1] - PH_RAW[j])) / SUB;
})();
const gPhase = (f: number) => tab(PH_RAW, Math.min(f, F_STOP));
const G_X = xTable(gPhase);
const gXwalk = (f: number) => tab(G_X, f);
// ---- planted at the far end: its front foot stays, the body comes up over it, the back foot steps up beside it, and
// it turns to face us
const G_TURN = [F_STOP + 0.5, F_STOP + 8.5];
const G_STEP = [F_STOP + 0.3, F_STOP + 6.3];
const G_SHIFT = [F_STOP + 0.3, F_STOP + 7.5];
const G_STOP_POSE = walkPose(G_BASE, gPhase(F_STOP), 1, G_STRIDE);
const G_END_POSE = BOT_POSES.turnTo(0.34, 0) as CovidPose;
const G_FRONT_L = G_STOP_POSE.footL[0] > G_STOP_POSE.footR[0];
type Leg = ReturnType<typeof botRig>["legL"];
const legs = (q: CovidPose): { front: Leg; back: Leg } => {
  const r = botRig(q as BotPose);
  return G_FRONT_L ? { front: r.legL, back: r.legR } : { front: r.legR, back: r.legL };
};
const G_STOP_X = gXwalk(F_STOP);
const G_FRONT_W = G_STOP_X + legs(G_STOP_POSE).front.A[0];
const G_BACK0_W = G_STOP_X + legs(G_STOP_POSE).back.A[0];
const G_END_X = G_FRONT_W - legs(G_END_POSE).front.A[0];
const G_BACK1_W = G_END_X + legs(G_END_POSE).back.A[0];
const gShift = (f: number) => sst(G_SHIFT[0], G_SHIFT[1], f);
export const gX = (f: number) => (f <= F_STOP ? gXwalk(f) : lerp(G_STOP_X, G_END_X, gShift(f)));
/** the tick frames: card n (0..10) is ticked when its body is n pitches along (the first at its standstill) */
export const TICK_T: number[] = (() => {
  const T = [20];
  for (let n = 1; n < 11; n++) {
    const target = XG0 + n * PITCH;
    let f = T[n - 1];
    while (gX(f) < target && f < DURATION + 3) f += 0.05;
    T.push(f);
  }
  return T;
})();
// the stroke of a tick: tip at TICK[0] at t0, the corner at t1, the end at t2
export const strokeTimes = (n: number) => (n === 0 ? [TICK_T[0] - 3.5, TICK_T[0] - 1.6, TICK_T[0] + 1.6] : [TICK_T[n] - 2.2, TICK_T[n] - 0.8, TICK_T[n] + 1.8]);
/** the drawn part of a tick at progress s in 0..1 over its two strokes (card-local polyline) */
const tickPart = (s: number): P2[] => {
  if (s <= 0) return [];
  const a = 10.6 / 38.5; // the short stroke's share of the length (~ by length)
  if (s < a) return [TICK[0], mix2(TICK[0], TICK[1], s / a)];
  return [TICK[0], TICK[1], mix2(TICK[1], TICK[2], (s - a) / (1 - a))];
};
export const tickProg = (f: number, t: number[]) => {
  if (f <= t[0]) return 0;
  const a = 10.6 / 38.5;
  if (f <= t[1]) return a * ease((f - t[0]) / (t[1] - t[0]));
  return a + (1 - a) * ease(c01((f - t[1]) / (t[2] - t[1])));
};
const tickTip = (s: number): P2 => {
  const a = 10.6 / 38.5;
  return s < a ? mix2(TICK[0], TICK[1], s / a) : mix2(TICK[1], TICK[2], (s - a) / (1 - a));
};

// ---- writing: a line of small strokes across a card's printed line (card-local), pen down while writing ----------
type Writing = { lines: [number, number][]; seed: number };
/** the tip (card-local) and whether it is down, at frame f, for a writer whose line i runs over lines[i] */
const writeTip = (w: Writing, f: number): { p: P2; down: boolean; line: number; u: number } => {
  const L = w.lines;
  for (let i = 0; i < L.length; i++) {
    const [a, b] = L[i];
    const ln = LINES[i];
    if (f <= b || i === L.length - 1) {
      if (f < a && i > 0) {
        // the carriage return (lifted) from the end of the last line
        const [, pb] = L[i - 1];
        const u = c01((f - pb) / (a - pb));
        const from: P2 = [LINES[i - 1].x1, LINES[i - 1].y - 1];
        const to: P2 = [ln.x0, ln.y - 1];
        const q = mix2(from, to, ease(u));
        return { p: [q[0], q[1] - 3 * Math.sin(Math.PI * u)], down: false, line: i, u: 0 };
      }
      const u = c01((f - a) / (b - a));
      return { p: writeAt(w, i, u), down: f >= a && f <= b, line: i, u };
    }
  }
  return { p: [LINES[0].x0, LINES[0].y], down: false, line: 0, u: 0 };
};
/** the handwriting along line i at u 0..1: small letter bobs and word gaps */
const writeAt = (w: Writing, i: number, u: number): P2 => {
  const ln = LINES[i];
  const x = lerp(ln.x0, ln.x1, u);
  const ph = u * 26 + w.seed * 3 + i * 1.7;
  const y = ln.y - 1.6 - 2.2 * Math.abs(Math.sin(ph)) * (Math.sin(u * 9 + i + w.seed) > -0.55 ? 1 : 0.2);
  return [x, y];
};
/** the ink so far: one polyline per line written (card-local) */
const writeInk = (w: Writing, f: number): P2[][] => {
  const out: P2[][] = [];
  w.lines.forEach(([a, b], i) => {
    if (f <= a) return;
    const u1 = c01((f - a) / (b - a));
    const n = Math.max(2, Math.ceil(70 * u1));
    out.push(Array.from({ length: n + 1 }, (_, j) => writeAt(w, i, (u1 * j) / n)));
  });
  return out;
};
const G_WRITE: Writing = { lines: [[7.5, 9.8], [10.5, 12.6], [13.2, 14.0]], seed: 2 }; // a quick scribble, then ~2.5 frames across to the tick box
const E_WRITE: Writing = { lines: [[9, 50], [55, 96], [101, 140]], seed: 0 };
export const E_TICK = [163, 167.5, 174];

// ---- the robot's pose -----------------------------------------------------------------------------------------------
const G_SMILE = BOT_POSES.stand(1, 0).mouth;
const G_LAST = TICK_T[10];
/** the pencil arm's weight (0 = swinging free, 1 = on the IK target) */
const gReach = (f: number) => sst(0, 7.5, f) * (1 - sst(G_LAST + 2.5, G_LAST + 12, f));
/** the pencil's angle on the card (deg): tip up and to the right, so the mitten stays low, under its head */
const G_ANG = -36;
/** the tip's target as a 3D board point at frame f (writing, ticking, or travelling lifted between cards) */
export const gTip = (f: number): { X: number; Y: number; Z: number; ang: number } => {
  const lo = (n: number, p: P2) => cardPt("lo", LO_COLS[n], p);
  const A0 = G_ANG;
  const t0 = strokeTimes(0);
  if (f < t0[0]) {
    // raise to the first card, then scribble its three lines
    const w = writeTip(G_WRITE, f);
    const rest = lo(0, [LINES[0].x0 - 6, LINES[0].y + 6]);
    const p = lo(0, w.p);
    const lift = f < G_WRITE.lines[0][0] ? 1 - ease(f / G_WRITE.lines[0][0]) : 0;
    const tail = sst(G_WRITE.lines[2][1], t0[0], f);
    const q = { X: lerp(p.X, rest.X, lift), Y: lerp(p.Y, rest.Y + 14, lift), Z: Z_CARD };
    const tk = lo(0, TICK[0]);
    return { X: lerp(q.X, tk.X, tail), Y: lerp(q.Y, tk.Y, tail) - 4 * Math.sin(Math.PI * tail), Z: Z_CARD, ang: A0 + 6 * lift };
  }
  for (let n = 0; n < 11; n++) {
    const t = strokeTimes(n);
    if (f <= t[2]) {
      if (f >= t[0]) {
        const s = tickProg(f, t);
        const p = lo(n, tickTip(s));
        return { X: p.X, Y: p.Y, Z: Z_CARD, ang: A0 - 6 * s };
      }
      // lifted, travelling from the last tick's end to this tick's start (an arc)
      const tp = strokeTimes(n - 1);
      const u = c01((f - tp[2]) / (t[0] - tp[2]));
      const a = lo(n - 1, TICK[2]);
      const b = lo(n, TICK[0]);
      const e = ease(u);
      return { X: lerp(a.X, b.X, e), Y: lerp(a.Y, b.Y, e) - 6 * Math.sin(Math.PI * u), Z: Z_CARD, ang: A0 - 6 + 6 * e };
    }
  }
  // after the last tick: the hand comes off to the right and down
  const a = lo(10, TICK[2]);
  const u = c01((f - strokeTimes(10)[2]) / 10);
  return { X: a.X + 8 * ease(u), Y: a.Y + 22 * ease(u), Z: Z_CARD, ang: A0 - 6 + 40 * ease(u) };
};
/** put the robot's feet on world X points (its ankles, retargeted): nudge the rig's foot x until the ankle lands */
const plantFeet = (q: CovidPose, X: number, frontW: number, backW: number): CovidPose => {
  let out = q;
  for (let it = 0; it < 3; it++) {
    const l = legs(out);
    const fx = (frontW - X - l.front.A[0]) / LEGK;
    const bx = (backW - X - l.back.A[0]) / LEGK;
    out = G_FRONT_L
      ? { ...out, footL: [out.footL[0] + fx, out.footL[1]] as P2, footR: [out.footR[0] + bx, out.footR[1]] as P2 }
      : { ...out, footR: [out.footR[0] + fx, out.footR[1]] as P2, footL: [out.footL[0] + bx, out.footL[1]] as P2 };
  }
  return out;
};
const gBody = (f: number) => {
  const amt = gAmt(f);
  let w = amt > 1e-4 ? walkPose(G_BASE, gPhase(f), amt, G_STRIDE) : G_BASE;
  // the first step: the far foot is mid-swing when the walk starts, so it lifts to its full swing height over three
  // frames instead of growing with the amount (no shuffle along the floor)
  if (f > G_WS && f < G_WS + G_HALF) {
    const full = walkPose(G_BASE, gPhase(f), 1, G_STRIDE);
    const u = sst(G_WS, G_WS + 2, f);
    const up = (wa: number, w1: number) => (u > amt ? wa + ((w1 - wa) * (u - amt)) / Math.max(1e-6, 1 - amt) : wa);
    w = { ...w, footR: [w.footR[0], up(w.footR[1], full.footR[1])] as P2, liftR: up(w.liftR, full.liftR) };
  }
  let q = breathe({ ...w, mouth: G_SMILE } as CovidPose, clock(f), 0.6) as PencilPose;
  // planted at the far end: it turns toward us, its front foot fixed in the world, the back foot stepping up beside it
  // (a small lifted step), the body coming up over them
  if (f > F_STOP) {
    const tu = sst(G_TURN[0], G_TURN[1], f);
    const ts = sst(G_STEP[0], G_STEP[1], f);
    const X = gX(f);
    const end = { ...BOT_POSES.turnTo(lerp(0.9, 0.34, sst(G_TURN[0], G_TURN[1] + 6, f)), f, 2), mouth: G_SMILE } as CovidPose;
    const m = lerpPose(q, end, tu) as PencilPose;
    // the back foot's lift (rig units: the robot's legs are LEGK as long)
    const lift = (18 * Math.sin(Math.PI * ts)) / 1;
    const backL = G_FRONT_L ? m.footR : m.footL;
    const lifted = (G_FRONT_L ? { ...m, footR: [backL[0], backL[1] - lift] } : { ...m, footL: [backL[0], backL[1] - lift] }) as PencilPose;
    q = plantFeet(lifted, X, G_FRONT_W, lerp(G_BACK0_W, G_BACK1_W, ts)) as PencilPose;
  }
  return { ...q, lids: Math.max(q.lids ?? 0, botBlink(f, 2)) } as PencilPose;
};
/** the pose of the robot at frame f, standing at at/scale (world px), with the pencil tip on gTip */
export const aiPose = (f: number, at: P2, scale: number, A: AirWorld): PencilPose => {
  const body = gBody(f);
  const reach = gReach(f);
  // its look: at the card it ticks; turned toward us, its head looks back down the row (toward the expert)
  const tu = sst(G_TURN[0] + 4, G_TURN[1] + 8, f);
  const hy = lerp(lerp(0.78, body.headYaw, 0.3), body.headYaw - 0.45, tu);
  const work: PencilPose = { ...body, headYaw: hy, pitch: body.pitch + 3 * reach, look: mix2([0.6, 0.05 * reach], [-0.5, 0.06], tu) };
  const tgt = gTip(f);
  const tip2 = A.P.p(tgt.X, tgt.Y, tgt.Z);
  const tipL: P2 = [(tip2[0] - at[0]) / scale, (tip2[1] - at[1]) / scale];
  const ang = tgt.ang;
  const dd: P2 = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  const grip: P2 = [tipL[0] - dd[0] * PENCIL_TIP, tipL[1] - dd[1] * PENCIL_TIP];
  const solved = botGripTo({ ...work, pencil: { hand: "L", ang } } as BotPose, { L: grip }) as PencilPose;
  const restAng = 82;
  let q: PencilPose = reach >= 0.999 ? solved : (lerpPose(work, solved, reach) as PencilPose);
  q = { ...q, pencil: { hand: "L", ang: lerp(restAng, ang, reach) }, mouth: G_SMILE };
  if (reach >= 0.999) q = { ...q, armL: { ...q.armL, fist: 0.7 } };
  return q;
};

// ---- the expert's pose ----------------------------------------------------------------------------------------------
export const eTip = (f: number): { X: number; Y: number; Z: number; ang: number } => {
  const up = (p: P2) => cardPt("up", UP_COLS[0], p);
  const A0 = -32;
  const w0 = E_WRITE.lines[0][0];
  const wEnd = E_WRITE.lines[2][1];
  if (f < wEnd + 1) {
    const w = writeTip(E_WRITE, f);
    const p = up(w.p);
    const lift = 1 - ease(c01(f / w0));
    const rest = up([LINES[0].x0 - 8, LINES[0].y + 14]);
    return { X: lerp(p.X, rest.X, lift), Y: lerp(p.Y, rest.Y, lift), Z: Z_CARD, ang: A0 + 10 * lift };
  }
  // a pause over the card (he reads it back), then the tick (after it, expertPose takes the pencil off to his waist)
  if (f < E_TICK[0]) {
    const a = up([LINES[2].x1, LINES[2].y - 1]);
    const b = up(TICK[0]);
    const u = sst(146, E_TICK[0], f);
    return { X: lerp(a.X, b.X, u), Y: lerp(a.Y, b.Y, u) - 5 * Math.sin(Math.PI * u) + 1.2 * Math.sin(f * 0.21), Z: Z_CARD, ang: A0 };
  }
  const s = tickProg(f, E_TICK);
  const p = up(tickTip(s));
  return { X: p.X, Y: p.Y, Z: Z_CARD, ang: A0 - 4 * s };
};
export const expertPose = (f: number, at: P2, scale: number, A: AirWorld): PencilPose => {
  const base = HUMAN_POSES.stand(1, f) as PencilPose;
  const reach = sst(0, 8, f);
  const nod = Math.sin(Math.PI * sst(E_TICK[2] + 1, E_TICK[2] + 10, f)) ** 2;
  // the hold: his head turns a little toward the long orange row (down and along the board)
  const turn = sst(E_TICK[2] + 2, E_TICK[2] + 9, f);
  const work: PencilPose = { ...base, headYaw: 0.78 + 0.12 * turn, pitch: base.pitch - 2 + 5 * nod + 3 * turn, look: mix2([0.62, -0.25], [0.8, 0.14], turn) };
  const tgt = eTip(f);
  const tip2 = A.P.p(tgt.X, tgt.Y, tgt.Z);
  const tipCard: P2 = [(tip2[0] - at[0]) / scale, (tip2[1] - at[1]) / scale];
  // the raise (f0-8): the tip travels a curve out in front of his chest and up past the FRONT of his face (never across
  // it) to the card; the arm blends from its free swing onto that curve over the first third
  // after the tick (f174): the pencil comes off the card out in front of him and down to his waist (a curve in his own
  // frame, never across his face), held there through the hold
  const low = sst(E_TICK[2] + 0.5, E_TICK[2] + 7.5, f);
  const tipOff: P2 = (() => {
    if (low <= 0) return tipCard;
    const c: P2 = [tipCard[0] + 110, tipCard[1] - 10];
    const r: P2 = [96, -168];
    return [(1 - low) ** 2 * tipCard[0] + 2 * low * (1 - low) * c[0] + low * low * r[0], (1 - low) ** 2 * tipCard[1] + 2 * low * (1 - low) * c[1] + low * low * r[1]];
  })();
  const tipL: P2 =
    reach >= 0.999
      ? tipOff
      : (() => {
          const u = reach;
          const p0: P2 = [62, -150];
          const pc: P2 = [150, -250];
          return [(1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * pc[0] + u * u * tipCard[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * pc[1] + u * u * tipCard[1]];
        })();
  const ang = lerp(40, tgt.ang, reach) - 18 * low;
  const dd: P2 = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  const grip: P2 = [tipL[0] - dd[0] * PENCIL_TIP, tipL[1] - dd[1] * PENCIL_TIP];
  // the FAR hand holds his pencil: the card is above his head, and the near arm would cross his face
  const solved = covidGripTo(KIND, VAR, { ...work, pencil: { hand: "R", ang } } as CovidPose, { R: grip }, [0, 0], 1) as PencilPose;
  const w = sst(0, 0.35, reach);
  let q: PencilPose = w >= 0.999 ? solved : (lerpPose(work, solved, w) as PencilPose);
  q = { ...q, pencil: { hand: "R", ang: w >= 0.999 ? ang : lerp(80, ang, w) }, mouth: base.mouth };
  if (reach >= 0.999) q = { ...q, armR: { ...q.armR, fist: 0.7 } };
  return q;
};

// ===================================================================================================================
// DRAWING (everything in world units through the turned world W: at yaw 0 exactly the frontal drawing)
// ===================================================================================================================
const LINEN = { lit: "#7C725F", mid: "#625949", dark: "#39332A" }; // the pinboard: a muted grey-umber linen
const CARD_C = "#F3EBDD";
const INK = "#2E2721";
const PRINT = "#B9AE99";
const BOXC = "#9A8F7C";
const PIN = "#7E5A4B";
const SKIRT = { lit: "#B9AB8C", mid: "#93856A", dark: "#544A3B" };
const WALL_X = { x0: -2600, x1: 3600 };

const pathOf = (pts: P2[]) => (pts.length ? `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join("L")}` : "");
const polyOf = (pts: P2[]) => `${pathOf(pts)}Z`;
/** the smallest world X of a plane at depth Z still in front of the camera (the turned world's near clip) */
const xClip = (W: TW, Z: number, x0: number) => {
  const s = Math.sin(W.th);
  if (s < 1e-6) return x0;
  return Math.max(x0, (W.zMin - Z * Math.cos(W.th)) / s);
};
/** a plane at depth Z as an affine group for a small rect (x, y, w, h): children in its local units 0..w, 0..h */
const rectMatrix = (W: TW, x: number, y: number, w: number, h: number, Z: number) => {
  const P = W.A3.P;
  const o = P.p(x, y, Z);
  const ax = P.p(x + w, y, Z);
  const ay = P.p(x, y + h, Z);
  return `matrix(${[(ax[0] - o[0]) / w, (ax[1] - o[1]) / w, (ay[0] - o[0]) / h, (ay[1] - o[1]) / h, o[0], o[1]].map((v) => v.toFixed(5)).join(" ")})`;
};
/** the air a plane at depth Z takes on toward its far end (base drawn toned at Z): a gradient along the plane in X */
const FogAlong: React.FC<{ W: TW; x0: number; x1: number; y0: number; y1: number; Z: number; h: number; uid: string }> = ({ W, x0, x1, y0, y1, Z, h, uid }) => {
  if (W.th < 1e-4) return null;
  const P = W.A3.P;
  const ym = (y0 + y1) / 2;
  const a = P.p(x0, ym, Z);
  const b = P.p(x1, ym, Z);
  const L2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  const f0 = W.A.fog(Z);
  const n = 10;
  const stops = Array.from({ length: n + 1 }, (_, i) => {
    const X = lerp(x0, x1, Math.pow(i / n, 1.4));
    const q = P.p(X, ym, Z);
    const off = c01(((q[0] - a[0]) * (b[0] - a[0]) + (q[1] - a[1]) * (b[1] - a[1])) / L2);
    const fz = W.A.fog(W.dz(X, Z));
    return { off, col: W.A.airHex(W.dz(X, Z), h), op: c01((fz - f0) / Math.max(1e-3, 1 - f0)) };
  });
  const q = [P.p(x0, y0, Z), P.p(x1, y0, Z), P.p(x1, y1, Z), P.p(x0, y1, Z)];
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-fa`} gradientUnits="userSpaceOnUse" x1={f2(a[0])} y1={f2(a[1])} x2={f2(b[0])} y2={f2(b[1])}>
          {stops.map((t, i) => (
            <stop key={i} offset={t.off.toFixed(4)} stopColor={t.col} stopOpacity={t.op.toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <path d={polyOf(q)} fill={`url(#${uid}-fa)`} />
    </g>
  );
};

/** the floor: its tone by the camera's distance (the kit's AirFloor in the camera's frame, any yaw), the foot of the
 *  wall melting into the air, and the plank joints in the world (they turn with the board) */
const Floor: React.FC<{ W: TW; uid: string }> = ({ W, uid }) => {
  const A = W.A;
  const P = W.A3.P;
  const cam = A.cam;
  // the joints (the kit's AirFloor joints, in world X/Z, each piece fogged by its own distance)
  const x0 = WALL_X.x0;
  const x1 = WALL_X.x1;
  const z0 = -4000;
  const z1 = Z_WALL;
  const step = 44;
  const course = 260;
  const jointAmt = 0.6;
  const mf = 0.02 * (z1 - z0);
  const meltAt = (Z: number) => Math.pow(c01((Z - (z1 - mf)) / mf), 1.3);
  const zA = Math.max(z0, A.P.zNear);
  const pieces = 16;
  const zAt = (i: number) => lerp(zA, z1, Math.pow(i / pieces, 1.5));
  const buckets = new Map<string, string>();
  const ok = (X: number, Z: number) => W.dz(X, Z) > A.P.zNear;
  const add = (X: number, zm: number, a: P2, b: P2) => {
    const d = W.dz(X, zm);
    const al = (1 - A.fog(d)) * (1 - meltAt(zm)) * jointAmt * 0.45;
    if (al < 0.03 * 0.45) return;
    const key = `${al.toFixed(3)}|${(1.2 * A.P.r(d)).toFixed(3)}|${Math.round(d)}`;
    buckets.set(key, (buckets.get(key) ?? "") + `M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`);
  };
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    for (let X = Math.ceil(x0 / step) * step; X <= x1; X += step) if (X > x0 + 1 && X < x1 - 1 && ok(X, za) && ok(X, zb)) add(X, zm, P.p(X, 0, za), P.p(X, 0, zb));
    for (let X = Math.floor(x0 / step) * step; X < x1; X += step) {
      const off = (((Math.round(X / step) % 2) + 2) % 2) * course * 0.5;
      for (let Z = Math.floor((za - off) / course) * course + off; Z < zb; Z += course) {
        if (Z < za) continue;
        const xa = Math.max(x0, X);
        const xb = Math.min(x1, X + step);
        if (xb > xa && ok(xa, Z) && ok(xb, Z)) add((xa + xb) / 2, zm, P.p(xa, 0, Z), P.p(xb, 0, Z));
      }
    }
  }
  // the wall's foot melting into the air (the AirFloor melt, in the world)
  const xm = xClip(W, -40, x0);
  const melt: React.ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const za = lerp(z1 - mf, z1, i / 8);
    const zb = lerp(z1 - mf, z1, (i + 1) / 8);
    const zmid = (za + zb) / 2;
    const row = P.p(Math.max(xm, cam.cx), 0, zmid)[1];
    melt.push(<path key={i} d={polyOf([P.p(xm, 0, za), P.p(x1, 0, za), P.p(x1, 0, zb + 0.5), P.p(xm, 0, zb + 0.5)])} fill={A.screenAir(row)} opacity={meltAt(zmid)} />);
  }
  return (
    <g>
      <AirFloor A={A} x0={Math.min(x0, cam.cx - 5000)} x1={Math.max(x1, cam.cx + 7000)} z0={z0} z1={W.th > 1e-4 ? 6000 : z1} mat={MAT_FLOORWOOD} course={course} plank={step} jointAmt={0} melt={W.th > 1e-4 ? 0.3 : 0} />
      {melt}
      {[...buckets.entries()].map(([k, d], i) => {
        const [al, w, dd] = k.split("|");
        return <path key={`${uid}${i}`} d={d} fill="none" stroke={A.tone(lineOf(MAT_FLOORWOOD), Number(dd), 0)} strokeWidth={w} strokeOpacity={al} />;
      })}
    </g>
  );
};

const Card: React.FC<{ W: TW; row: "up" | "lo"; col: number; ink?: { tick?: number; tickCol?: "ai" | "human"; write?: P2[][]; writeCol?: "ai" | "human" } }> = ({ W, row, col, ink }) => {
  const x = colX(col);
  const y = ROW[row];
  const L = W.loc(x + CARD.w / 2);
  const tone = (h: string) => L.tone(h, Z_CARD, 250);
  const tickPts = ink?.tick ? tickPart(ink.tick) : [];
  const ai = ink?.tickCol === "ai";
  return (
    <g transform={rectMatrix(W, x, y, CARD.w, CARD.h, Z_CARD)}>
      {/* the soft drop shadow, the card, a pin */}
      <rect x={2.5} y={3} width={CARD.w} height={CARD.h} rx={1.5} fill={tone("#22180F")} opacity={0.28} />
      <rect x={0} y={0} width={CARD.w} height={CARD.h} rx={1.2} fill={tone(CARD_C)} />
      <rect x={0} y={0} width={CARD.w} height={2.2} fill={tone("#FFF8EC")} opacity={0.7} />
      <rect x={0} y={CARD.h - 5} width={CARD.w} height={5} fill={tone("#D9CDB4")} opacity={0.45} />
      <rect x={BOX.x0} y={BOX.y0} width={BOX.s} height={BOX.s} rx={1.5} fill="none" stroke={tone(BOXC)} strokeWidth={1.7} />
      {LINES.map((l, i) => (
        <path key={i} d={`M${l.x0},${l.y}L${l.x1},${l.y}`} stroke={tone(PRINT)} strokeWidth={1.7} strokeLinecap="round" />
      ))}
      <circle cx={CARD.w / 2} cy={3.6} r={2.4} fill={tone(PIN)} />
      <circle cx={CARD.w / 2 - 0.7} cy={2.9} r={0.8} fill={tone("#C9A898")} />
      {ink?.write?.map((pl, i) => (
        <path key={`w${i}`} d={pathOf(pl)} fill="none" stroke={ink.writeCol === "ai" ? tone(ACCENT) : tone(INK)} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {tickPts.length ? (
        <g>
          {ai ? <path d={pathOf(tickPts)} fill="none" stroke={tone(ORANGE_LINE)} strokeWidth={7.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} /> : null}
          <path d={pathOf(tickPts)} fill="none" stroke={ai ? L.toneO(ACCENT, Z_CARD, 250) : tone(INK)} strokeWidth={ai ? 5.4 : 5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
    </g>
  );
};

/** the plaster wall: vertical strips, each with its own height gradient and the fog of its own distance */
const Wall: React.FC<{ W: TW; uid: string }> = ({ W, uid }) => {
  const P = W.A3.P;
  const X0 = xClip(W, Z_WALL, WALL_X.x0);
  const X1 = WALL_X.x1;
  const H = 1700;
  const veil = 0.3;
  const N = W.th > 1e-4 ? 48 : 1;
  const strips: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const xa = lerp(X0, X1, Math.pow(i / N, 1.5));
    const xb = lerp(X0, X1, Math.pow((i + 1) / N, 1.5));
    const xm = (xa + xb) / 2;
    const L = W.loc(xm);
    const wallAt = (h: number) => {
      const base = mixHex(L.tone(mixHex(MAT_PLASTER.mid, MAT_PLASTER.lit, 0.25), Z_WALL, h), L.airHex(Z_WALL, Math.max(h, 520)), veil);
      return mixHex(base, L.airHex(Z_WALL, h), 0.9 * sst(0.32, 0.8, h / H));
    };
    const y0 = P.p(N === 1 ? 0 : xm, 0, Z_WALL)[1];
    const y1 = P.p(N === 1 ? 0 : xm, -H, Z_WALL)[1];
    const xe = i < N - 1 ? xb + (xb - xa) * 0.25 : xb; // overlap the next strip (no seams)
    strips.push(
      <g key={i}>
        <defs>
          <linearGradient id={`${uid}-w${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y1)}>
            {[0, 0.08, 0.18, 0.3, 0.42, 0.55, 0.7, 0.85, 1].map((s) => (
              <stop key={s} offset={s} stopColor={wallAt(s * H)} />
            ))}
          </linearGradient>
        </defs>
        <path d={polyOf([P.p(xa, 0, Z_WALL), P.p(xe, 0, Z_WALL), P.p(xe, -H, Z_WALL), P.p(xa, -H, Z_WALL)])} fill={`url(#${uid}-w${i})`} />
      </g>,
    );
  }
  const sx0 = xClip(W, Z_WALL - 3, WALL_X.x0);
  return (
    <g>
      {strips}
      {/* a skirting board along the wall's foot */}
      <AirBox A={W.A3} X0={sx0} X1={X1} Y0={-16} Y1={0} Z0={Z_WALL - 3} Z1={Z_WALL} mat={SKIRT} uid={`${uid}-sk`} rim={0.4} />
      <FogAlong W={W} x0={Math.max(sx0, 0)} x1={X1} y0={-16} y1={0} Z={Z_WALL - 3} h={8} uid={`${uid}-skf`} />
    </g>
  );
};

const Board: React.FC<{ W: TW; f: number; uid: string }> = ({ W, f, uid }) => {
  const P = W.A3.P;
  const b = BOARD;
  const m = 9;
  const ix0 = b.x0 + m;
  const ix1 = b.x1 - m;
  const iy0 = b.y0 + m;
  const iy1 = b.y1 - m;
  const Zl = Z_FRAME - 0.2;
  // the inks
  const gw = writeInk(G_WRITE, f);
  const ew = writeInk(E_WRITE, Math.min(f, E_WRITE.lines[2][1]));
  // the linen in strips (each its own fog), then the light across it and the lips' shadows
  const N = W.th > 1e-4 ? 24 : 1;
  const strips: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const xa = lerp(ix0, ix1, Math.pow(i / N, 1.4));
    const xb = lerp(ix0, ix1, Math.pow((i + 1) / N, 1.4));
    const xe = i < N - 1 ? xb + (xb - xa) * 0.25 : xb;
    const L = W.loc((xa + xb) / 2);
    const xm = N === 1 ? 0 : (xa + xb) / 2;
    const ya = P.p(xm, iy0, Zl)[1];
    const yb = P.p(xm, iy1, Zl)[1];
    strips.push(
      <g key={i}>
        <defs>
          <linearGradient id={`${uid}-ln${i}`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(ya)} x2="0" y2={f2(yb)}>
            <stop offset="0" stopColor={L.tone(mixHex(LINEN.lit, LINEN.mid, 0.2), Z_FRAME, 380)} />
            <stop offset="0.55" stopColor={L.tone(LINEN.mid, Z_FRAME, 250)} />
            <stop offset="1" stopColor={L.tone(mixHex(LINEN.mid, LINEN.dark, 0.35), Z_FRAME, 120)} />
          </linearGradient>
        </defs>
        <path d={polyOf([P.p(xa, iy0, Zl), P.p(xe, iy0, Zl), P.p(xe, iy1, Zl), P.p(xa, iy1, Zl)])} fill={`url(#${uid}-ln${i})`} />
      </g>,
    );
  }
  const inset = [P.p(ix0, iy0, Zl), P.p(ix1, iy0, Zl), P.p(ix1, iy1, Zl), P.p(ix0, iy1, Zl)];
  return (
    <g>
      <AirBox A={W.A3} X0={b.x0} X1={b.x1} Y0={b.y0} Y1={b.y1} Z0={Z_FRAME} Z1={Z_WALL - 1} mat={MAT_FRAME} uid={`${uid}-fr`} rim={0.7} />
      <FogAlong W={W} x0={b.x0} x1={b.x1} y0={b.y0} y1={b.y1} Z={Z_FRAME} h={260} uid={`${uid}-frf`} />
      {strips}
      <defs>
        <linearGradient id={`${uid}-lnx`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F3EBDD" stopOpacity={0.1} />
          <stop offset="0.35" stopColor="#F3EBDD" stopOpacity={0} />
          <stop offset="1" stopColor="#22180F" stopOpacity={0.08} />
        </linearGradient>
      </defs>
      <path d={polyOf(inset)} fill={`url(#${uid}-lnx)`} />
      {/* the inner shadow under the frame's top and left lips */}
      <path d={polyOf([P.p(ix0, iy0, Zl), P.p(ix1, iy0, Zl), P.p(ix1, iy0 + 5, Zl), P.p(ix0, iy0 + 5, Zl)])} fill="#22180F" opacity={0.16} />
      <path d={polyOf([P.p(ix0, iy0, Zl), P.p(ix0 + 4, iy0, Zl), P.p(ix0 + 4, iy1, Zl), P.p(ix0, iy1, Zl)])} fill="#22180F" opacity={0.12} />
      {UP_COLS.map((c, i) => (
        <Card key={`u${c}`} W={W} row="up" col={c} ink={i === 0 ? { tick: tickProg(f, E_TICK), tickCol: "human", write: ew, writeCol: "human" } : undefined} />
      ))}
      {LO_COLS.map((c, i) => (
        <Card key={`l${c}`} W={W} row="lo" col={c} ink={{ tick: tickProg(f, strokeTimes(i)), tickCol: "ai", write: i === 0 ? gw : undefined, writeCol: "ai" }} />
      ))}
    </g>
  );
};

// ===================================================================================================================
// THE MOTES: the stage's dust (pandemicAir Motes, same layers, hashes and drift), drawn here so that the five motes
// whose paths would pass within 80 px of "11×" from f140 are left out for the whole cut (no pop): at this camera
// speed a mote sweeps ~30 px a frame across the label's row, so no placement clears them all. The AirStage gets
// motes={0}; the far layers go under the world, the mid layer's odd half and the near layer in its front slot.
// ===================================================================================================================
export const MOTE_SKIP = new Set(["1:1", "1:11", "1:95", "2:4", "2:11"]);
export type ClipMote = { id: string; layer: number; x: number; y: number; r: number; a: number };
export const clipMotes = (v: AirView, layer: 0 | 1 | 2, half?: 0 | 1): ClipMote[] => {
  const L = MOTE_LAYERS[layer];
  const F = v.scene.F;
  const t = v.frame;
  const md = v.mood;
  const span = L.d1 - L.d0;
  const Wb = (1.3 * 1080 * L.d1) / F;
  const Hb = (2.3 * Math.max(v.horizon, 1920 - v.horizon) * L.d1) / F;
  const n = Math.round(L.n * md.moteCount);
  const mod = (a: number, m: number) => ((a % m) + m) % m;
  const out: ClipMote[] = [];
  for (let i = 0; i < n; i++) {
    if (half !== undefined && i % 2 !== half) continue;
    const id = `${layer}:${i}`;
    if (MOTE_SKIP.has(id)) continue;
    const h = L.seed + i * 7.13;
    const sp = 0.7 + 0.6 * hash01(h + 3.1);
    const wob = 0.06 * Math.sin(t * (0.03 + 0.03 * hash01(h + 4.4)) + hash01(h + 5.5) * 6.28);
    const X = mod(hash01(h) * Wb + md.drift[0] * sp * t + wob - v.travel.x, Wb) - Wb / 2;
    const Y = mod(hash01(h + 1.7) * Hb + md.drift[1] * sp * t - v.travel.y, Hb) - Hb / 2;
    const Z = L.d0 + mod(hash01(h + 2.9) * span - md.drift[2] * t - v.travel.z, span);
    const x = 540 + (F * X) / Z;
    const y = v.horizon - (F * Y) / Z;
    const r = (lerp(L.r[0], L.r[1], hash01(h + 6.6)) * md.moteSize * F) / Z;
    if (x < -r * 2 || x > 1080 + r * 2 || y < -r * 2 || y > 1920 + r * 2) continue;
    const ends = smoothstep(0, 0.14, (Z - L.d0) / span) * smoothstep(0, 0.2, (L.d1 - Z) / span);
    const a = lerp(L.a[0], L.a[1], hash01(h + 8.8)) * (0.6 + 0.4 * (1 - c01(y / 1920))) * ends;
    if (a < 0.01) continue;
    out.push({ id, layer, x, y, r: Math.max(0.5, Math.min(layer === 2 ? 70 : 9, r)), a });
  }
  return out;
};
const MoteLayerSvg: React.FC<{ v: AirView; layer: 0 | 1 | 2; half?: 0 | 1 }> = ({ v, layer, half }) => {
  const gid = `etfm${layer}${half ?? ""}`;
  const L = MOTE_LAYERS[layer];
  const f3 = (n: number) => (Math.round(n * 1000) / 1000).toString();
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0" stopColor={v.pal.cream} stopOpacity="1" />
          <stop offset={f3(1 - L.soft)} stopColor={v.pal.cream} stopOpacity={layer === 2 ? "0.8" : "0.9"} />
          <stop offset="1" stopColor={v.pal.cream} stopOpacity="0" />
        </radialGradient>
      </defs>
      {clipMotes(v, layer, half).map((m) => (
        <circle key={m.id} cx={f3(m.x)} cy={f3(m.y)} r={f3(m.r)} fill={`url(#${gid})`} opacity={f3(m.a)} />
      ))}
    </svg>
  );
};

// ===================================================================================================================
// THE LABELS: all on the board, in its plane (Z), drawn through the turned world like the cards: they foreshorten,
// take the board's light and air, and turn with it. GDPval a header card pinned at the board's top, HUMAN EXPERT and
// GPT-5.2 label cards pinned at the starts of their rows, 11× painted in cream on the linen just above the AI row's
// last four cards (baseline 28 units above their tops, its cap top 76 below the expert's row: it belongs to the AI's
// row; it clears the robot's head on every frame, the robot past it before the wipe reaches it). Long labels are cut into strips along X, each strip its own affine map and tone (true perspective
// across the label). X, Y = the label's centre; size = the font size (units); wEm = the measured text width in ems.
// ===================================================================================================================
export type BoardLabel = { id: string; text: string; kind: "card" | "paint"; X: number; Y: number; size: number; wEm: number; f0: number };
export const LABELS: BoardLabel[] = [
  { id: "plHE", text: "HUMAN EXPERT", kind: "card", X: 205, Y: -430, size: 41, wEm: 9.9, f0: 6 },
  { id: "plG", text: "GPT-5.2", kind: "card", X: 330, Y: -268, size: 42, wEm: 4.4, f0: 2 },
  { id: "plGD", text: "GDPval", kind: "card", X: 470, Y: -500, size: 46, wEm: 3.95, f0: 92 },
  { id: "pl11", text: "11×", kind: "paint", X: 775, Y: -232, size: 84, wEm: 1.75, f0: 140 },
];
/** a label's box in the board plane (units): the card (or the paint's extent) and the text's cap band */
export const labelBox = (lb: BoardLabel) => {
  const tw = lb.wEm * lb.size;
  const padX = lb.kind === "card" ? 0.5 * lb.size : 0.08 * lb.size;
  const w = tw + 2 * padX;
  const h = lb.kind === "card" ? 1.3 * lb.size : 0.9 * lb.size;
  const cap = 0.66 * lb.size;
  return { x0: lb.X - w / 2, w, y0: lb.Y - h / 2, h, tx0: lb.X - tw / 2, tx1: lb.X + tw / 2, cy0: lb.Y - cap / 2, cy1: lb.Y + cap / 2, Z: lb.kind === "card" ? Z_CARD - 0.4 : Z_FRAME - 0.3 };
};
/** the entrance (0..1 over 12 frames): a card fades in as it drops onto its pins, the paint wipes on left to right */
export const labelT = (lb: BoardLabel, f: number) => c01((f - lb.f0) / 12);
const LabelOnBoard: React.FC<{ W: TW; lb: BoardLabel; f: number }> = ({ W, lb, f }) => {
  const t = labelT(lb, f);
  if (t <= 0) return null;
  const b = labelBox(lb);
  const card = lb.kind === "card";
  const drop = card ? -9 * (1 - ease(t)) : 0;
  const y0 = b.y0 + drop;
  const N = W.th > 1e-4 ? Math.max(4, Math.ceil(b.w / 20)) : 1;
  const reveal = card ? b.w : ease(t) * b.w;
  const s = lb.size;
  const strips: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const ua = (b.w * i) / N;
    const ub = (b.w * (i + 1)) / N;
    if (ua >= reveal) break;
    const L = W.loc(b.x0 + (ua + ub) / 2);
    const tone = (hex: string) => L.tone(hex, b.Z, 250);
    const ca = i === 0 ? -8 : ua - 0.12;
    const cb = Math.min(reveal, i === N - 1 ? b.w + 8 : ub + 0.12);
    const cid = `${lb.id}-c${i}`;
    strips.push(
      <g key={i} transform={rectMatrix(W, b.x0 + ua, y0, ub - ua, b.h, b.Z)}>
        <defs>
          <clipPath id={cid} clipPathUnits="userSpaceOnUse">
            <rect x={f2(ca)} y={f2(-b.h)} width={f2(Math.max(0, cb - ca))} height={f2(3 * b.h)} />
          </clipPath>
        </defs>
        <g transform={`translate(${f2(-ua)} 0)`} clipPath={`url(#${cid})`}>
          {card ? (
            <g>
              <rect x={2.5} y={3} width={b.w} height={b.h} rx={1.6} fill={tone("#22180F")} opacity={0.28} />
              <rect x={0} y={0} width={b.w} height={b.h} rx={1.3} fill={tone(CARD_C)} />
              <rect x={0} y={0} width={b.w} height={2.4} fill={tone("#FFF8EC")} opacity={0.7} />
              <rect x={0} y={b.h - 5} width={b.w} height={5} fill={tone("#D9CDB4")} opacity={0.45} />
              {[11, b.w - 11].map((px) => (
                <g key={px}>
                  <circle cx={px} cy={6} r={2.6} fill={tone(PIN)} />
                  <circle cx={px - 0.8} cy={5.2} r={0.9} fill={tone("#C9A898")} />
                </g>
              ))}
              <text x={b.w / 2} y={b.h / 2 + 0.34 * s + 1.5} textAnchor="middle" fill={tone(INK)} style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: s, letterSpacing: "0.02em", fontVariantNumeric: "lining-nums" }}>
                {lb.text}
              </text>
            </g>
          ) : (
            <text
              x={b.w / 2}
              y={b.h / 2 + 0.34 * s}
              textAnchor="middle"
              fill={tone(CARD_C)}
              stroke={tone("#241C14")}
              strokeOpacity={0.7}
              strokeWidth={0.08 * s}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: s, letterSpacing: "0.02em", fontVariantNumeric: "lining-nums" }}
            >
              {lb.text}
            </text>
          )}
        </g>
      </g>,
    );
  }
  return <g opacity={card ? sst(0, 0.7, t) : 1}>{strips}</g>;
};
/** the board plane's grid (a check overlay: the labels sit on it) */
const PlaneGrid: React.FC<{ W: TW }> = ({ W }) => {
  const P = W.A3.P;
  const Z = Z_CARD - 0.4;
  const d: string[] = [];
  for (let X = -100; X <= 1300; X += 50) d.push(pathOf([P.p(X, BOARD.y0, Z), P.p(X, BOARD.y1, Z)]));
  for (let Y = -540; Y <= -50; Y += 25) d.push(pathOf([P.p(BOARD.x0, Y, Z), P.p(BOARD.x1, Y, Z)]));
  return <path d={d.join("")} fill="none" stroke="#00E5FF" strokeWidth={1.2} opacity={0.7} />;
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const ElevenTimesFaster: React.FC<z.infer<typeof schema>> = ({ grid }) => {
  const frame = useCurrentFrame();
  const { cam, W } = worldAt(frame, true);
  const A3 = W.A3;
  const GX = gX(frame);
  const e = A3.P.at(XE, 0);
  const g = A3.P.at(GX, 0);
  const eq = expertPose(frame, e.at, e.scale, A3);
  const gq = aiPose(frame, g.at, g.scale, A3);
  const expert = <Human key="ex" variant={1} pose={eq as never} at={e.at} scale={e.scale} uid="ex" frame={frame} fog={W.loc(XE).folkFog(0)} unitPx={cam.k} />;
  const bot = <Bot key="bt" variant={4} pose={gq as BotPose} at={g.at} scale={g.scale} uid="bt" frame={frame} fog={W.loc(GX).folkFog(0)} unitPx={cam.k} />;
  // the nearer figure is drawn last (side by side at the start: the robot over the expert)
  const botFar = W.dz(GX, 0) > W.dz(XE, 0) + 1;
  return (
    <AirStage
      v={W.A.v}
      bloom={0.22}
      shafts={0.6}
      motes={0}
      front={
        <>
          <MoteLayerSvg v={W.A.v} layer={1} half={1} />
          <MoteLayerSvg v={W.A.v} layer={2} />
        </>
      }
    >
      <MoteLayerSvg v={W.A.v} layer={0} />
      <MoteLayerSvg v={W.A.v} layer={1} half={0} />
      <WorldSvg cam={cam}>
        <Floor W={W} uid="fl" />
        <Wall W={W} uid="wall" />
        <Board W={W} f={frame} uid="bd" />
        {LABELS.map((lb) => (
          <LabelOnBoard key={lb.id} W={W} lb={lb} f={frame} />
        ))}
        {grid ? <PlaneGrid W={W} /> : null}
        <AirShadow A={W.loc(XE)} X={XE} Z={0} w={62} d={30} uid="se" amt={0.8} />
        <AirShadow A={W.loc(GX)} X={GX} Z={0} w={BOT_SHADOW.w} d={BOT_SHADOW.d} uid="sg" amt={BOT_SHADOW.amt} />
        {botFar ? [bot, expert] : [expert, bot]}
      </WorldSvg>
    </AirStage>
  );
};

export default ElevenTimesFaster;
