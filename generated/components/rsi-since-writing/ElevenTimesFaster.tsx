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
// THE MOTION: one long GDPval task board on a plaster wall, two rows of identical cream task cards (each a few faint
// lines and an empty tick box): the upper row (above the heads) the human expert's (oatmeal shirt, glasses; HUMAN
// EXPERT), the lower row (waist height) the AI's (the Genius v3, no glasses: an older model; GPT-5.2), the AI's row
// starting two cards right so the Genius never stands in front of the expert's card. Both raise their pencils from f0
// (the expert's far hand, up in front of his face, never across it). The expert writes his first card's lines slowly
// in dark ink. The Genius scribbles his first card in orange and ticks it (f20), then walks the row at one step per
// card (a 10.6-frame step, stride = the card pitch, planted feet) and ticks every card as he passes (the pencil tip on
// the stroke: IK on the card's world point each frame); the 11th tick lands on "11" (f136). The camera trucks right
// with him in one lobe (k 1.85 -> 1.78, cx 160 -> 652 at f136), the expert falling out of shot left. From f132 one
// continuous pull-back + pan (viewAt: the world turned 54 deg about X=Z=0, settled by ~f170, creep to f182) swings to
// an oblique view down the board: it recedes to the right in one-point perspective into the haze, both full rows in
// shot (the expert's 11 cards, the AI's 11 orange ticks), the Genius kept in shot all the way (his planted feet are the
// swing's anchor). He walks two steps past the board's end, stops (f156), takes one more step on (back foot past, front
// foot up beside it, f156-170) while turning to face the camera, and stands planted, ~320 px tall, head turned toward
// the expert, clear of the AI's 11th card so all 11 ticks show from f170. The expert stands at the near end, larger,
// and ticks his ONE card in dark ink on "human experts" (f163-174), lowers the pencil and turns his head toward the
// orange row. GDPval fades in on the wall above the board on "OpenAI's" (f92), "11×" over the AI's row near its far
// end on "times" (f138); HUMAN EXPERT and GPT-5.2 grow a little and HUMAN EXPERT slides along its row with the swing.
// Living hold: breath, the head turns, the creep. Orange = the Genius and his ticks and scribble
// only; the expert's ink is dark; nothing else is orange.
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
import { Genius, GENIUS_POSES, PENCIL_TIP } from "../rsi-ten-earths/tenEarthsGenius";
import { HUMAN_POSES, Human } from "./sinceWritingFolk";
import { MAT_FLOORWOOD, MAT_FRAME, MAT_PLASTER, Plate, officeScene } from "./sinceWritingWorld";

export const FPS = 24000 / 1001;
export const DURATION = 183;
export const schema = z.object({});
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
export const PITCH = 66; // one card + its gap, = the Genius's step
export const CARD = { w: 56, h: 52 };
const COL0 = 60;
export const colX = (c: number) => COL0 + c * PITCH;
export const ROW = { up: -387, lo: -207 }; // card tops: the expert's row above the heads, the AI's at chest height
export const UP_COLS = Array.from({ length: 11 }, (_, i) => i); // the expert's 11
export const LO_COLS = Array.from({ length: 11 }, (_, i) => i + 2); // the AI's 11
export const Z_CARD = 33.5;
const Z_FRAME = 34;
const Z_WALL = 46;
const BOARD = { x0: -150, x1: 1400, y0: -478, y1: -45 };
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
const SY_EYE = 800;
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
/** the first half's 2D camera (f0-136: the truck right with the Genius; its keys past f136 only shape the curve) */
const camTruck = (f: number): Cam => {
  const k = Math.exp(LK(f));
  return { k, cx: CXT(f), cy: WY_EYE - (SY_EYE - 960) / k };
};
// THE SECOND HALF (T_SWING -> T_SET, creep to f182): one continuous pull-back + pan that swings round the Genius (who
// plants at the far end of his row) to an oblique view, the board receding to the right toward its vanishing point.
// The camera is a pinhole: the world turned about X = Z = 0 by the yaw th (the board's far end goes deep), focal F
// (px), the horizon's screen y H. The swing interpolates th, F, H, the Genius's depth from the camera dQ and his screen
// x xQ, and solves the camera's place from them, so he stays in shot (screen x ~840 -> 870) while the expert swings in
// from the left. At th 0 this is exactly camTruck.
export const T_SWING = 132;
const T_SET = 170;
const QX = 945 + 40; // the anchor: the Genius's planted feet at the end (X, Z 0), past the board's last card
type Swing = { th: number; F: number; H: number; dQ: number; xQ: number };
const swingOf = (c: Cam): Swing => {
  const Dc = DEPTH.dRef / Math.sqrt(c.k);
  const F = c.k * Dc;
  return { th: 0, F, H: 960 + (DEPTH.eyeY - c.cy) * c.k, dQ: Dc, xQ: 540 + (F * (QX - c.cx)) / Dc };
};
/** the settled oblique view (as yaw, focal, the camera's distance and X in the turned frame, the horizon) */
const OBL = { th: (54 * Math.PI) / 180, F: 2100, Dc: 1300, cx: 220, H: 760 };
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
// THE GENIUS: stands at his first card, then walks the row, one step per card, ticking each as he passes
// ===================================================================================================================
export const XG0 = colX(2) + 24 - 86; // his feet at his first card (the stroke's middle 86 units to his right)
export const XE = 0; // the expert's feet
const G_BASE: CovidPose = CP.walk(1, 0, 0); // covidFolk's walk base (yaw 0.9) at amount 0: his standing pose too
const G_HALF = 10.6; // frames per step
const G_WS = 23.7; // the walk starts (amount ramps in over the first step)
const G_PH0 = 0.25; // phase at the start: weight on the near foot, the far foot swings first
const G_STRIDE = PITCH;
const G_WE = 1e9; // (no fade: the walk stops on a landing, F_STOP)
const gAmt = (f: number) => sst(G_WS, G_WS + G_HALF, f) * (1 - sst(G_WE - G_HALF, G_WE, f));
/** after the 11th tick he walks on two steps past the end of the board and stops on that landing (f156.2), clear of
 *  the row so all 11 ticks show beside him */
export const F_STOP = G_WS + (13 - 2 * G_PH0) * G_HALF;
const gPhase = (f: number) => G_PH0 + Math.max(0, Math.min(f, F_STOP) - G_WS) / (2 * G_HALF);
/** the stance foot's local x (units; the base feet left out: constant within a stance) */
export const stanceX = (f: number) => {
  const p = gPhase(f);
  const uL = frac(p);
  const u = uL < 0.5 ? uL : frac(p + 0.5);
  return { side: uL < 0.5 ? 0 : 1, x: gAmt(f) * G_STRIDE * (0.5 - 2 * u) };
};
/** the body's X, integrated from the planted foot (it never slides): a table at quarter frames */
const SUB = 8;
const G_X: number[] = (() => {
  const out = [XG0];
  let X = XG0;
  let prev = stanceX(0);
  for (let i = 1; i <= (DURATION + 4) * SUB; i++) {
    const cur = stanceX(i / SUB);
    if (cur.side === prev.side) X -= cur.x - prev.x;
    prev = cur;
    out.push(X);
  }
  return out;
})();
const gXwalk = (f: number) => {
  const i = Math.max(0, Math.min(G_X.length - 2, f * SUB));
  const i0 = Math.floor(i);
  return lerp(G_X[i0], G_X[i0 + 1], i - i0);
};
// ---- planted at the far end: his front foot stays, the body comes up over it and the back foot steps up beside it
/** his turn toward us (the pose), the body over the front foot, the back foot's step */
const G_TURN = [157, 170];
const G_STEP = [156.5, 164.5]; // the back foot steps past the front one
const G_STEP2 = [162.5, 169.5]; // then the front foot steps up beside it
const G_SHIFT = [156.5, 169.5];
/** how much further than the stop his last step takes him: his body clear of the AI's 11th card in the settled frame */
const G_EXTRA = 72;
const G_STOP_POSE = walkPose(G_BASE, gPhase(F_STOP), 1, G_STRIDE);
const G_FRONT_L = G_STOP_POSE.footL[0] > G_STOP_POSE.footR[0];
const g2 = (q: CovidPose) => (G_FRONT_L ? { front: q.footL, back: q.footR } : { front: q.footR, back: q.footL });
const G_STOP_X = gXwalk(F_STOP);
const G_FRONT_W = G_STOP_X + g2(G_STOP_POSE).front[0];
const G_END_X = G_FRONT_W - g2(G_BASE).front[0] + 16 + G_EXTRA; // one more step on: the back foot lands ahead, the front foot steps up beside it
const G_FRONT1_W = G_FRONT_W + G_EXTRA;
const G_BACK0_W = G_STOP_X + g2(G_STOP_POSE).back[0];
const G_BACK1_W = G_END_X + g2(G_BASE).back[0];
const gShift = (f: number) => sst(G_SHIFT[0], G_SHIFT[1], f);
export const gX = (f: number) => (f <= F_STOP ? gXwalk(f) : lerp(G_STOP_X, G_END_X, gShift(f)));
/** the tick frames: card n (0..10) is ticked when his body is n pitches along (the first at his standstill) */
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
const G_WRITE: Writing = { lines: [[6.5, 9.6], [10.6, 13.7], [14.7, 15.9]], seed: 2 };
const E_WRITE: Writing = { lines: [[9, 50], [55, 96], [101, 140]], seed: 0 };
export const E_TICK = [163, 167.5, 174];

// ---- the Genius's pose ----------------------------------------------------------------------------------------------
const G_SMILE = GENIUS_POSES.stand(1, 0).mouth;
const G_LAST = TICK_T[10];
/** the pencil arm's weight (0 = swinging free, 1 = on the IK target) */
const gReach = (f: number) => sst(0, 6, f) * (1 - sst(G_LAST + 2.5, G_LAST + 12, f));
/** the tip's target as a 3D board point at frame f (writing, ticking, or travelling lifted between cards) */
export const gTip = (f: number): { X: number; Y: number; Z: number; ang: number } => {
  const lo = (n: number, p: P2) => cardPt("lo", LO_COLS[n], p);
  const A0 = 52;
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
      return { X: lerp(a.X, b.X, e), Y: lerp(a.Y, b.Y, e) - 9 * Math.sin(Math.PI * u), Z: Z_CARD, ang: A0 - 6 + 6 * e };
    }
  }
  // after the last tick: the hand lifts off to the right and down
  const a = lo(10, TICK[2]);
  const u = c01((f - strokeTimes(10)[2]) / 10);
  return { X: a.X + 10 * ease(u), Y: a.Y + 24 * ease(u), Z: Z_CARD, ang: A0 - 6 + 30 * ease(u) };
};
const gBody = (f: number) => {
  const amt = gAmt(f);
  let w = amt > 1e-4 ? walkPose(G_BASE, gPhase(f), amt, G_STRIDE) : G_BASE;
  // the first step: the far foot is mid-swing when the walk starts, so it lifts to its full swing height over three
  // frames instead of growing with the amount (no shuffle along the floor)
  if (f > G_WS && f < G_WS + G_HALF) {
    const full = walkPose(G_BASE, gPhase(f), 1, G_STRIDE);
    const u = sst(G_WS, G_WS + 3, f);
    // the swing foot's height and toe angle at max(amount, u) of the full walk's
    const up = (wa: number, w1: number) => (u > amt ? wa + ((w1 - wa) * (u - amt)) / Math.max(1e-6, 1 - amt) : wa);
    w = { ...w, footR: [w.footR[0], up(w.footR[1], full.footR[1])] as P2, liftR: up(w.liftR, full.liftR) };
  }
  let q = breathe({ ...w, mouth: G_SMILE } as CovidPose, clock(f), 0.6) as PencilPose;
  // planted at the far end: he turns three-quarter toward us, his front foot fixed in the world, the back foot
  // stepping up beside it (a small lifted step), the body coming up over them
  if (f > F_STOP) {
    const tu = sst(G_TURN[0], G_TURN[1], f);
    const ts = sst(G_STEP[0], G_STEP[1], f);
    const X = gX(f);
    const end = { ...GENIUS_POSES.turnTo(lerp(0.9, 0.34, sst(G_TURN[0], G_TURN[1] + 6, f)), f), mouth: G_SMILE } as CovidPose;
    const m = lerpPose(q, end, tu) as PencilPose;
    const fr = g2(G_STOP_POSE).front;
    const bk = g2(G_STOP_POSE).back;
    const t2 = sst(G_STEP2[0], G_STEP2[1], f);
    const frontL: P2 = [lerp(G_FRONT_W, G_FRONT1_W, t2) - X, lerp(fr[1], g2(G_BASE).front[1], tu) - 7 * Math.sin(Math.PI * t2)];
    const backL: P2 = [lerp(G_BACK0_W, G_BACK1_W, ts) - X, lerp(bk[1], g2(G_BASE).back[1], ts) - 8 * Math.sin(Math.PI * ts)];
    q = (G_FRONT_L ? { ...m, footL: frontL, footR: backL } : { ...m, footR: frontL, footL: backL }) as PencilPose;
  }
  return q;
};
/** the pose of the Genius at frame f, standing at at/scale (world px), with the pencil tip on gTip */
export const geniusPose = (f: number, at: P2, scale: number, A: AirWorld): PencilPose => {
  const body = gBody(f);
  const reach = gReach(f);
  // his look: at the card he ticks, then ahead along the board
  // turned toward us, his head looks back down the row (toward the expert)
  const tu = sst(G_TURN[0] + 4, G_TURN[1] + 8, f);
  const hy = lerp(lerp(0.78, body.headYaw, 0.3), body.headYaw - 0.45, tu);
  const work: PencilPose = { ...body, headYaw: hy, pitch: body.pitch + 4 * reach, look: mix2([0.6, 0.05 * reach], [-0.5, 0.06], tu) };
  const tgt = gTip(f);
  const tip2 = A.P.p(tgt.X, tgt.Y, tgt.Z);
  const tipL: P2 = [(tip2[0] - at[0]) / scale, (tip2[1] - at[1]) / scale];
  const ang = tgt.ang;
  const dd: P2 = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)];
  const grip: P2 = [tipL[0] - dd[0] * PENCIL_TIP, tipL[1] - dd[1] * PENCIL_TIP];
  const solved = covidGripTo(KIND, VAR, { ...work, pencil: { hand: "L", ang } } as CovidPose, { L: grip }, [0, 0], 1) as PencilPose;
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

/** the labels (Y = the text's centre): each row's name just above its row, the board's name on the wall above it, the
 *  factor over the AI's row toward its far end; size grows to size2 with the swing (the settled caps stay >= 34 px);
 *  wEm = the measured text width in ems (for the check) */
export const plateSize = (p: { size: number; size2: number }, f: number) => lerp(p.size, p.size2, swingU(f));
/** X slides to X2 with the swing (HUMAN EXPERT keeps its approved first-half place, then moves along its row) */
export const plateX = (p: { X: number; X2: number }, f: number) => lerp(p.X, p.X2, swingU(f));
export const PLATES = [
  { text: "HUMAN EXPERT", X: 200, X2: 250, Y: -430, Z: Z_CARD - 1, size: 36, size2: 40, f0: 6, uid: "plHE", wEm: 9.9 },
  { text: "GPT-5.2", X: 300, X2: 300, Y: -224, Z: Z_CARD - 1, size: 34, size2: 42, f0: 2, uid: "plG", wEm: 4.4 },
  { text: "GDPval", X: 440, X2: 440, Y: -530, Z: Z_WALL - 1, size: 46, size2: 46, f0: 92, uid: "plGD", wEm: 3.95 },
  { text: "11×", X: 625, X2: 625, Y: -258, Z: Z_CARD - 1, size: 80, size2: 80, f0: 138, uid: "pl11", wEm: 1.75 },
];

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const ElevenTimesFaster: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cam, W } = worldAt(frame, true);
  const A3 = W.A3;
  const GX = gX(frame);
  const e = A3.P.at(XE, 0);
  const g = A3.P.at(GX, 0);
  const eq = expertPose(frame, e.at, e.scale, A3);
  const gq = geniusPose(frame, g.at, g.scale, A3);
  const plateT = (f0: number) => c01((frame - f0) / 12);
  const expert = <Human key="ex" variant={1} pose={eq as never} at={e.at} scale={e.scale} uid="ex" frame={frame} fog={W.loc(XE).folkFog(0)} unitPx={cam.k} />;
  const genius = <Genius key="gn" variant={3} pose={gq as never} at={g.at} scale={g.scale} uid="gn" frame={frame} fog={W.loc(GX).folkFog(0)} unitPx={cam.k} />;
  // the nearer figure is drawn last (side by side at the start: the Genius over the expert, as before)
  const geniusFar = W.dz(GX, 0) > W.dz(XE, 0) + 1;
  return (
    <AirStage v={W.A.v} bloom={0.22} shafts={0.6}>
      <WorldSvg cam={cam}>
        <Floor W={W} uid="fl" />
        <Wall W={W} uid="wall" />
        <Board W={W} f={frame} uid="bd" />
        {/* the labels (billboards at their world points): the rows' names, the board's name, the factor */}
        {PLATES.map((p) => (
          <Plate key={p.uid} A={W.loc(plateX(p, frame))} X={plateX(p, frame)} Y={p.Y} Z={p.Z} text={p.text} t={plateT(p.f0)} uid={p.uid} size={plateSize(p, frame)} />
        ))}
        <AirShadow A={W.loc(XE)} X={XE} Z={0} w={62} d={30} uid="se" amt={0.8} />
        <AirShadow A={W.loc(GX)} X={GX} Z={0} w={62} d={30} uid="sg" amt={0.8} />
        {geniusFar ? [genius, expert] : [expert, genius]}
      </WorldSvg>
    </AirStage>
  );
};

export default ElevenTimesFaster;
