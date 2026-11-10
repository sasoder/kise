// ---------------------------------------------------------------------------
// JudgedByTheCurve (rsi-fall-of-gods, cut 74), rev 2. Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 191 frames.
//
// CHECK LINE: "Labs judge a new recipe only by what it does to the training curve — cheaper to reach the same
// loss, or a smarter model at the end — not by theory."
//
// THE LINE: "AI labs mainly care about how any new algorithmic recipe empirically makes training more efficient or
// elicits smarter models."
// WORD -> FRAME (Whisper 2-7 f early): AI 0 · labs 4 · mainly 13 · care 24 · about 33 · how 39 · any 44 · new 53 ·
// algorithmic 60 · recipe 78 · empirically ~85-98 · makes 112 · training 122 · more 129 · efficient 139 · or 148 ·
// elicits 159 · smarter 169 · models 177 (then "They don't care about theory for its own sake").
// DURATION: the slot 74.157 -> 82.124 s = 7.966 s x 23.976 = 191 frames (f0..f190).
//
// THE MOTION (rev 2, on the user's "a little too static / boring, but I like the idea"): the plot is the hero,
// ~900 screen px wide round the true middle, three lab marks in a row above it. On "AI labs" the marks lift and
// light up one after another (f-2..20: a scale bump, a lift and a step from the context rung to full white; no
// glow, the style is flat fills). The dim white baseline run is a third drawn on f0 and finishes f26 under a push.
// From "care" three white recipe cards fly out of the three labs in turn (launch f20, f40, f60) and dock at the
// plot's top-left; each new card slides in and knocks the last one off the left edge (CONTACT when the edges meet,
// f~51 / f~69; the old card glides off on the push's momentum). Each docked card lets its model dot out from
// under its lower-left corner onto the curves' common start, and the dot runs: the first trial stalls well ABOVE
// the baseline (~100 screen px), the second runs just above it, and each dims to ACCENT_DEEP at half opacity as
// the next run starts (f60, f78) — a dud, kept on the plot as evidence. The third run (f78-150) drops clearly
// below, and its card goes home: back along a low arc and up into the lab that sent it (f83-99), which clears
// the plot's top-left before the camera ride. The camera pans and pushes along its tip through "makes training
// more efficient"; the frame its head passes the baseline's final loss (f~111) a white bracket draws along that
// loss level to the baseline's end — the compute saved — landing f~134, before "efficient" f139.
// The camera pulls back a touch (f150-176) and on "elicits smarter models" the dot steps up 2.5x and tones
// ACCENT_DEEP -> ACCENT -> HIGHLIGHT on a back ease (f152-170, landing on "smarter" f169); an orange thread then
// draws from the run's end up to the lab that sent the winning recipe (f158-170) and packets keep running up it
// to the last frame (first arrival f~178, on "models").
// The camera is ONE damped track (Hermite knots, one key per frame, alignShared's runCam3), never derived from the
// tip. Orange = the AI (the models and their runs), nothing else; white = people and what they build (the labs,
// the code, the axes, the old run, the bracket).
//
// THE WINNING LAB is the right-hand mark (Google DeepMind) for geometry only: its thread climbs the plot's empty
// right side. Swap `MARKS` to change who wins; the cards follow the marks' order.
//
// SOURCES: no figures. The curves are illustrative shapes (loss falling with compute), not data, so nothing on
// screen carries a number. Marks: brandGlyphs OPENAI, ANTHROPIC, DEEPMIND (sources in public/logos/).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_LO, Label, hermite, runCam3, worldPx } from "../kits/dwarkesh/alignShared";
import { ANTHROPIC, DEEPMIND, OPENAI, type BrandGlyph } from "../kits/dwarkesh/brandGlyphs";
import { HIGHLIGHT } from "../kits/dwarkesh/levelUp";

export const FPS = 24000 / 1001;
export const DURATION = 191;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P = { x: number; y: number };

// ---------------------------------------------------------------------------
// THE CAMERA. One track: zoom and pan knots on a monotone Hermite, a key per frame, through the kit's damper
// (alignShared's runCam3). A slight push toward the plot (f0-40), a drift onto the docking cards (f40-98), the
// ride down and right along the winning run (f98-150), a pull back a touch for the payoff (f150-176) and a slow
// creep to the end.
// The HEIGHT is not keyed: it is solved off the damped zoom every frame so the COMPUTE label (and the x axis
// under it) sits at screen y LABEL_SY, in the gap between the two caption bands, whatever the zoom. Everything
// above the axis then lands at screen y = LABEL_SY - (LABEL_Y - y) * k, so a point that clears the first band
// at the widest zoom clears it at every zoom — the curves, the bracket and the model dot never enter it.
// ---------------------------------------------------------------------------
const KNOTS: { f: number; x: number; k: number }[] = [
  { f: 0, x: 540, k: 0.94 },
  { f: 22, x: 515, k: 1.01 },
  { f: 50, x: 450, k: 1.09 },
  { f: 80, x: 425, k: 1.12 },
  { f: 100, x: 480, k: 1.14 },
  { f: 120, x: 575, k: 1.16 },
  { f: 139, x: 682, k: 1.18 },
  { f: 150, x: 690, k: 1.17 },
  { f: 176, x: 540, k: 0.98 },
  { f: 200, x: 540, k: 0.965 },
];
const CAM_CX: number[] = [];
const CAM_K: number[] = [];
{
  const fs = KNOTS.map((n) => n.f);
  const xOf = hermite(
    fs,
    KNOTS.map((n) => n.x),
  );
  const kOf = hermite(
    fs,
    KNOTS.map((n) => n.k),
  );
  for (let f = 0; f <= DURATION; f++) {
    CAM_CX.push(xOf(f));
    CAM_K.push(kOf(f));
  }
}
const CAM_FLAT = CAM_K.map(() => 0);
const LABEL_SY = 1290; // the COMPUTE label's centre on screen: the gap between the bands is y 1250..1360
const LABEL_Y = 1281; // and in the world (set with the plot below)
const cyFor = (k: number) => LABEL_Y - (LABEL_SY - 960) / k;
export const camAt = (frame: number) => {
  const { cx, k } = runCam3(frame, CAM_CX, CAM_FLAT, CAM_K);
  return { cx, cy: cyFor(k), k };
};
const CY_REST = cyFor(CAM_K[0]);

const K_REST = 1.05; // strokes and labels are sized here: the camera runs 0.94 .. 1.18
const STROKE = worldPx(6.5, K_REST);
const THREAD = STROKE / 2;

// ---------------------------------------------------------------------------
// THE PLOT, in world px. u = compute 0..1 along x, v = loss 0..1 up y.
// ---------------------------------------------------------------------------
const PX0 = 80;
const PX1 = 1000;
const PY_AX = 1310; // the x axis
const PY_TOP = 520; // v = 1
const AX_OVER = 40; // the axes run past the plot's box to their arrowheads
const toX = (u: number) => PX0 + (PX1 - PX0) * u;
const toY = (v: number) => PY_AX - (PY_AX - PY_TOP) * v;

// Every run leaves the same initial loss. Illustrative shapes only.
const V0 = 0.78;
const vBase = (u: number) => 0.4 + (V0 - 0.4) / (1 + u / 0.3);
const vDud1 = (u: number) => 0.69 + (V0 - 0.69) * Math.exp(-u / 0.06); // stalls early, well above the baseline
const vDud2 = (u: number) => vBase(u) + 0.015 * smoothstep(u / 0.15); // no better than what we had
const vWin = (u: number) => 0.28 + (V0 - 0.28) / (1 + u / 0.2); // clearly below
// Run-to-run noise: slow sines, dying at u = 0 so every run leaves the same point.
const noise = (u: number, seed: number) =>
  smoothstep(u / 0.05) *
  (1.1 * Math.sin(u * 47 + hash(seed, 1) * 6.28) + 0.6 * Math.sin(u * 113 + hash(seed, 2) * 6.28));

const N_SAMP = 240;
type Run = { pts: P[]; uEnd: number };
const sampleRun = (v: (u: number) => number, seed: number, uEnd: number): Run => {
  const pts: P[] = [];
  for (let i = 0; i <= N_SAMP; i++) {
    const u = (i / N_SAMP) * uEnd;
    pts.push({ x: toX(u), y: toY(v(u)) + noise(u, seed) });
  }
  return { pts, uEnd };
};
const BASE = sampleRun(vBase, 3, 1);
const DUD1 = sampleRun(vDud1, 11, 0.4);
const DUD2 = sampleRun(vDud2, 5, 0.5);
const WIN = sampleRun(vWin, 7, 1);

// a run's point at fraction s (0..1 of its own length), and its polyline up to there
const headAt = (run: Run, s: number): P => {
  const t = clamp01(s) * N_SAMP;
  const i = Math.min(N_SAMP - 1, Math.floor(t));
  const a = run.pts[i];
  const b = run.pts[i + 1];
  const r = t - i;
  return { x: a.x + (b.x - a.x) * r, y: a.y + (b.y - a.y) * r };
};
const partial = (run: Run, s: number) => {
  if (s <= 0) return "";
  const t = clamp01(s) * N_SAMP;
  const n = Math.floor(t);
  let d = `M${run.pts[0].x.toFixed(2)} ${run.pts[0].y.toFixed(2)}`;
  for (let i = 1; i <= n; i++) d += ` L${run.pts[i].x.toFixed(2)} ${run.pts[i].y.toFixed(2)}`;
  const h = headAt(run, s);
  d += ` L${h.x.toFixed(2)} ${h.y.toFixed(2)}`;
  return d;
};
const START = BASE.pts[0];

// The baseline's final loss, and where the winning run first reaches it (on the drawn polyline).
const BASE_END = BASE.pts[N_SAMP];
const LEVEL_Y = BASE_END.y;
const S_CROSS = (() => {
  for (let i = 1; i <= N_SAMP; i++) {
    if (WIN.pts[i].y >= LEVEL_Y) {
      const a = WIN.pts[i - 1];
      const b = WIN.pts[i];
      return (i - 1 + (LEVEL_Y - a.y) / (b.y - a.y)) / N_SAMP;
    }
  }
  throw new Error("JudgedByTheCurve: the winning run never reaches the baseline's final loss");
})();
const CROSS = headAt(WIN, S_CROSS);

// ---------------------------------------------------------------------------
// THE LABS, a row above the plot. The cards launch from them in this order; the last one wins.
// ---------------------------------------------------------------------------
const MARK = 110;
const MARK_Y = 360;
const MARK_XS = [300, 540, 780];
const MARKS: BrandGlyph[] = [OPENAI, ANTHROPIC, DEEPMIND];
// On "AI labs" each mark wakes in turn: it lifts, bumps in scale and steps from the context rung to full white.
// Mark 0 is already rising on f0, so the cut opens on something moving.
const WAKE_F0 = [-2, 3, 8];
const WAKE_T = 12;
const markWake = (i: number, f: number) => {
  const t = clamp01((f - WAKE_F0[i]) / WAKE_T);
  const bump = Math.sin(Math.PI * t);
  return { sc: 1 + 0.14 * bump, lift: 14 * bump, op: INK_LO + (1 - INK_LO) * smoothstep(t * 1.6) };
};
const MARK_HIDE_R = MARK * 0.55; // a card is hidden inside this disc round its lab: it comes OUT of the mark

// ---------------------------------------------------------------------------
// THE RECIPES: white paper cards of indented code bars (people's code). Three different listings.
// ---------------------------------------------------------------------------
const C_PAD = 15;
const C_IND = 17;
const C_GAP = 7;
const C_PITCH = 17;
const C_BAR = 7.5;
const CARD_W = 180;
const C_LINES = 7;
const CARD_H = 2 * C_PAD + (C_LINES - 1) * C_PITCH + C_BAR;
const CARD_PATH = squirclePath(CARD_W, CARD_H);
const BAR_INK = "#9C9C9C"; // the code on the paper: mid grey, so the white card reads as a sheet with text
const INDENTS = [
  [0, 1, 1, 2, 2, 1, 0],
  [0, 1, 2, 2, 1, 1, 0],
  [0, 0, 1, 2, 3, 2, 1],
];
const makeBars = (card: number) => {
  const out: { x: number; y: number; w: number }[] = [];
  const room = CARD_W - 2 * C_PAD;
  for (let i = 0; i < C_LINES; i++) {
    let x = C_PAD + INDENTS[card][i] * C_IND;
    const n = 1 + Math.floor(hash(card * 17 + i, 4) * 3);
    for (let j = 0; j < n; j++) {
      const w = 22 + 46 * hash(card * 31 + i * 7 + j, 9);
      if (x + w > C_PAD + room) break;
      out.push({ x, y: C_PAD + i * C_PITCH, w });
      x += w + C_GAP;
    }
  }
  return out;
};
const BARS = [makeBars(0), makeBars(1), makeBars(2)];
const BAR_PATHS = BARS.map((bs) => bs.map((b) => squirclePath(b.w, C_BAR, 0.5)));

// The dock: the plot's top-left, just right of the y axis and above the runs' common start.
const DOCK: P = { x: PX0 + 18 + CARD_W / 2, y: START.y - 18 - CARD_H / 2 };
const STAGE: P = { x: DOCK.x + CARD_W + 24, y: DOCK.y };

const LAUNCH = [20, 40, 60];
const FLY = [14, 10, 8]; // card 0 flies straight to the dock; 1 and 2 to the stage beside it
const SLIDE = 7; // stage -> dock, pushing the docked card off
const SLIDE_F0 = [Infinity, LAUNCH[1] + FLY[1], LAUNCH[2] + FLY[2]];
const DOCKED = [LAUNCH[0] + FLY[0], SLIDE_F0[1] + SLIDE, SLIDE_F0[2] + SLIDE];
const EMERGE = 3; // a dot comes out from under its card
const RUN_F0 = DOCKED.map((d) => d + EMERGE);
const RUN_LEN = [20, 16, 72];
const RET_T = 16; // the winning card's way home
const RUN_F1 = RUN_F0.map((f, i) => f + RUN_LEN[i]);
const RET_F0 = RUN_F0[2] + 5;
const DIM_T = 10;
const dimAt = (i: number, f: number) => (i < 2 ? smoothstep((f - RUN_F0[i + 1]) / DIM_T) : 0);

const slideEase = Easing.inOut(Easing.cubic);
// the slide's peak speed, which a knocked card keeps once the slider starts to slow
const SLIDE_PEAK = (() => {
  let m = 0;
  for (let f = 0; f < SLIDE; f++) m = Math.max(m, (slideEase((f + 1) / SLIDE) - slideEase(f / SLIDE)) * (STAGE.x - DOCK.x));
  return m;
})();
const slideX = (i: number, f: number) => STAGE.x + (DOCK.x - STAGE.x) * slideEase(clamp01((f - SLIDE_F0[i]) / SLIDE));

type CardState = { x: number; y: number; s: number; rot: number; on: boolean };
const cardAt = (i: number, f: number): CardState => {
  if (f < LAUNCH[i]) return { x: 0, y: 0, s: 0, rot: 0, on: false };
  const from = { x: MARK_XS[i], y: MARK_Y };
  const to = i === 0 ? DOCK : STAGE;
  const t = clamp01((f - LAUNCH[i]) / FLY[i]);
  const g = Easing.out(Easing.cubic)(t);
  // a shallow arc: the control point sits above the straight line's midpoint, toward the source
  const c = { x: (from.x + to.x) / 2 + (from.x - to.x) * 0.15, y: Math.min(from.y, to.y) + 40 };
  const q = (a: number, b: number, cc: number) => (1 - g) * (1 - g) * a + 2 * (1 - g) * g * cc + g * g * b;
  let x = q(from.x, to.x, c.x);
  let y = q(from.y, to.y, c.y);
  const s = 0.35 + 0.65 * Easing.out(Easing.cubic)(clamp01(t / 0.7));
  let rot = (from.x > to.x ? -1 : 1) * 7 * (1 - Easing.out(Easing.back(1.6))(clamp01((t - 0.15) / 0.85)));
  if (i > 0 && f >= SLIDE_F0[i]) {
    x = slideX(i, f);
    y = to.y;
    rot = 0;
  }
  // knocked off by the next card: pushed on contact, then gliding on at the push's peak speed, tipping back
  if (i < 2 && f >= SLIDE_F0[i + 1]) {
    const nextX = slideX(i + 1, f);
    const pushed = Math.min(x, nextX - CARD_W - 2);
    const fMid = SLIDE_F0[i + 1] + SLIDE / 2;
    if (f <= fMid) {
      x = pushed;
    } else {
      const atMid = Math.min(DOCK.x, slideX(i + 1, fMid) - CARD_W - 2);
      x = atMid - SLIDE_PEAK * (f - fMid);
    }
    rot = -8 * smoothstep((DOCK.x - x) / 260);
  }
  // the winning card goes home once its model is running: back up into its lab, the way it came out
  if (i === 2 && f >= RET_F0) {
    const r = Easing.inOut(Easing.cubic)(clamp01((f - RET_F0) / RET_T));
    const home = { x: MARK_XS[2], y: MARK_Y };
    const cc = { x: home.x - 40, y: DOCK.y + 30 }; // low across, then up into the mark: under the other labs
    x = (1 - r) * (1 - r) * DOCK.x + 2 * (1 - r) * r * cc.x + r * r * home.x;
    y = (1 - r) * (1 - r) * DOCK.y + 2 * (1 - r) * r * cc.y + r * r * home.y;
    return { x, y, s: 1 - 0.65 * Easing.in(Easing.cubic)(r), rot: 6 * Math.sin(Math.PI * r), on: r < 1 };
  }
  return { x, y, s, rot, on: x > -400 };
};

// ---------------------------------------------------------------------------
// THE MODELS. Each run's head is its model dot; a dud's dot stays where it stalled, in the deep tone.
// ---------------------------------------------------------------------------
const RUNS = [DUD1, DUD2, WIN];
const runS = (i: number, f: number) => {
  const t = clamp01((f - RUN_F0[i]) / (RUN_F1[i] - RUN_F0[i]));
  // the winner: a sine in-out on a warped clock, so it leaves slowly, passes the baseline's final loss on
  // "makes" (f~111) and still stops dead on the budget's end
  return i === 2 ? (1 - Math.cos(Math.PI * Math.pow(t, 1.3))) / 2 : Easing.out(Easing.quad)(t);
};
// the dot's way out from under its card's lower-left corner onto the start
const HIDDEN: P = { x: DOCK.x - CARD_W / 2 + 22, y: DOCK.y + CARD_H / 2 - 20 };
const dotPos = (i: number, f: number): P | null => {
  if (f < DOCKED[i]) return null;
  if (f < RUN_F0[i]) {
    const g = Easing.out(Easing.quad)(clamp01((f - DOCKED[i]) / EMERGE));
    return { x: HIDDEN.x + (START.x - HIDDEN.x) * g, y: HIDDEN.y + (START.y - HIDDEN.y) * g };
  }
  return headAt(RUNS[i], runS(i, f));
};

const CROSS_F = (() => {
  for (let f = RUN_F0[2]; f <= RUN_F1[2]; f++) if (runS(2, f) >= S_CROSS) return f;
  throw new Error("JudgedByTheCurve: the winning head never crosses");
})();
const BRACKET_F0 = CROSS_F + 1;
const BRACKET_T = 22;

const DOT_R0 = DOT_RADIUS * 1.9;
const DOT_R1 = DOT_R0 * 2.5; // ~58 screen px across at rest: the smarter model
const STEP_F0 = 152;
const STEP_F1 = 170;
const TONE_A = makeTone(ACCENT_DEEP, ACCENT);
const TONE_B = makeTone(ACCENT, HIGHLIGHT);
const stepTone = (t: number) => (t < 0.5 ? TONE_A(t * 2) : TONE_B((t - 0.5) * 2));
const LINE_TONE = makeTone(ACCENT_DEEP, ACCENT);

// ---------------------------------------------------------------------------
// THE VERDICT GOES HOME: a thread from the winning run's end up the plot's empty right side to its lab.
// ---------------------------------------------------------------------------
const WIN_END = WIN.pts[N_SAMP];
const HOME: P = { x: MARK_XS[2] + 18, y: MARK_Y + MARK * 0.52 };
const TH_C: P = { x: PX1 + 70, y: 640 };
const bez = (t: number): P => ({
  x: (1 - t) * (1 - t) * WIN_END.x + 2 * (1 - t) * t * TH_C.x + t * t * HOME.x,
  y: (1 - t) * (1 - t) * WIN_END.y + 2 * (1 - t) * t * TH_C.y + t * t * HOME.y,
});
const TH_N = 80;
const TH_PTS: P[] = [];
const TH_LEN: number[] = [0];
for (let i = 0; i <= TH_N; i++) {
  TH_PTS.push(bez(i / TH_N));
  if (i > 0) TH_LEN.push(TH_LEN[i - 1] + Math.hypot(TH_PTS[i].x - TH_PTS[i - 1].x, TH_PTS[i].y - TH_PTS[i - 1].y));
}
const TH_TOTAL = TH_LEN[TH_N];
const thAtLen = (l: number): P => {
  const L = Math.max(0, Math.min(TH_TOTAL, l));
  let i = 1;
  while (i < TH_N && TH_LEN[i] < L) i++;
  const r = (L - TH_LEN[i - 1]) / (TH_LEN[i] - TH_LEN[i - 1] || 1);
  return { x: TH_PTS[i - 1].x + (TH_PTS[i].x - TH_PTS[i - 1].x) * r, y: TH_PTS[i - 1].y + (TH_PTS[i].y - TH_PTS[i - 1].y) * r };
};
const thPartial = (l0: number, l1: number) => {
  const pts: P[] = [thAtLen(l0)];
  for (let i = 1; i < TH_N; i++) if (TH_LEN[i] > l0 && TH_LEN[i] < l1) pts.push(TH_PTS[i]);
  pts.push(thAtLen(l1));
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
};
const TH_F0 = 158;
const TH_F1 = 170;
const PK_F0 = 166;
const PK_PERIOD = 9;
const PK_TRAVEL = 12;
const PK_R = worldPx(4.2, K_REST);

const LABEL = worldPx(32, K_REST);

const Arrowhead: React.FC<{ x: number; y: number; dir: "up" | "right" }> = ({ x, y, dir }) => {
  const a = worldPx(15, K_REST);
  const d =
    dir === "up"
      ? `M${x - a} ${y + a} L${x} ${y} L${x + a} ${y + a}`
      : `M${x - a} ${y - a} L${x} ${y} L${x - a} ${y + a}`;
  return <path d={d} fill="none" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />;
};

const JudgedByTheCurve: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = camAt(frame);
  const s = sway(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k);

  const baseS = 0.33 + 0.67 * Easing.out(Easing.quad)(clamp01(frame / 26));

  // bracket
  const brU = Easing.out(Easing.cubic)(clamp01((frame - BRACKET_F0) / BRACKET_T));
  const brX = CROSS.x + (BASE_END.x - CROSS.x) * brU;
  const tickH = worldPx(16, K_REST);
  const tickR = smoothstep((frame - BRACKET_F0 - BRACKET_T + 6) / 6);

  // the winner's step-up
  const stepT = clamp01((frame - STEP_F0) / (STEP_F1 - STEP_F0));
  const stepG = Easing.out(Easing.back(1.6))(stepT);

  // thread home
  const thL = TH_TOTAL * Easing.inOut(Easing.quad)(clamp01((frame - TH_F0) / (TH_F1 - TH_F0)));
  const packets: P[] = [];
  for (let f0 = PK_F0; f0 <= frame; f0 += PK_PERIOD) {
    const t = (frame - f0) / PK_TRAVEL;
    if (t < 0 || t > 1) continue;
    const l = TH_TOTAL * t;
    if (l <= thL) packets.push(thAtLen(l));
  }

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={frame}
        cy={cy}
        cyRest={CY_REST}
        cx={cx}
        cxRest={CAM_CX[0]}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx + s.dx}px, ${ty + s.dy}px) scale(${k})`,
          }}
        >
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <defs>
              {MARK_XS.map((mx, i) => (
                <mask key={i} id={`jbc-out-of-${i}`} maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={5000} height={6000}>
                  <rect x={-2000} y={-2000} width={5000} height={6000} fill="#fff" />
                  <circle cx={mx} cy={MARK_Y} r={MARK_HIDE_R} fill="#000" />
                </mask>
              ))}
            </defs>

            {/* the axes */}
            <g style={{ filter: icon }}>
              <path
                d={`M${PX0} ${PY_TOP - AX_OVER} L${PX0} ${PY_AX} L${PX1 + AX_OVER} ${PY_AX}`}
                fill="none"
                stroke={INK}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Arrowhead x={PX0} y={PY_TOP - AX_OVER} dir="up" />
              <Arrowhead x={PX1 + AX_OVER} y={PY_AX} dir="right" />
            </g>

            {/* the baseline run, dim white, thinner */}
            {baseS > 0 ? (
              <path
                d={partial(BASE, baseS)}
                fill="none"
                stroke={INK}
                strokeOpacity={INK_LO}
                strokeWidth={STROKE * 0.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* the bracket: the compute saved */}
            {brU > 0 ? (
              <g style={{ filter: icon }}>
                <line x1={CROSS.x} y1={LEVEL_Y} x2={brX} y2={LEVEL_Y} stroke={INK} strokeWidth={STROKE} strokeLinecap="round" />
                <line
                  x1={CROSS.x}
                  y1={LEVEL_Y - tickH * smoothstep(brU * 6)}
                  x2={CROSS.x}
                  y2={LEVEL_Y + tickH * smoothstep(brU * 6)}
                  stroke={INK}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                />
                {tickR > 0 ? (
                  <line
                    x1={BASE_END.x}
                    y1={LEVEL_Y - tickH * tickR}
                    x2={BASE_END.x}
                    y2={LEVEL_Y + tickH * tickR}
                    stroke={INK}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            ) : null}

            {/* the runs: duds first (under), the winner on top */}
            {RUNS.map((run, i) => {
              const sNow = frame >= RUN_F0[i] ? runS(i, frame) : 0;
              if (sNow <= 0) return null;
              const dim = dimAt(i, frame);
              return (
                <path
                  key={i}
                  d={partial(run, sNow)}
                  fill="none"
                  stroke={LINE_TONE(1 - dim)}
                  strokeOpacity={1 - 0.5 * dim}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* the thread home, and its packets */}
            {thL > 0 ? (
              <g>
                <path d={thPartial(0, thL)} fill="none" stroke={ACCENT} strokeWidth={THREAD} strokeLinecap="round" />
                {thL < TH_TOTAL ? (
                  <circle cx={thAtLen(thL).x} cy={thAtLen(thL).y} r={THREAD * 1.4} fill={INK} />
                ) : null}
                {packets.map((p, j) => (
                  <circle key={j} cx={p.x} cy={p.y} r={PK_R} fill={ACCENT} />
                ))}
              </g>
            ) : null}

            {/* the model dots: drawn under the cards, so each comes out from under its own */}
            {RUNS.map((_, i) => {
              const p = dotPos(i, frame);
              if (!p) return null;
              const isWin = i === 2;
              const r = (isWin ? DOT_R0 + (DOT_R1 - DOT_R0) * stepG : DOT_R0) * breath(frame, 0.37 + i * 0.2);
              const fill = isWin ? stepTone(smoothstep(stepT)) : ACCENT_DEEP;
              return <circle key={i} cx={p.x} cy={p.y} r={r} fill={fill} />;
            })}

            {/* the recipe cards */}
            {[0, 1, 2].map((i) => {
              const c = cardAt(i, frame);
              if (!c.on) return null;
              return (
                <g key={i} mask={`url(#jbc-out-of-${i})`}>
                  <g style={{ filter: icon }}>
                    <g
                      transform={`translate(${c.x.toFixed(3)} ${c.y.toFixed(3)}) rotate(${c.rot.toFixed(3)}) scale(${c.s.toFixed(4)}) translate(${(-CARD_W / 2).toFixed(3)} ${(-CARD_H / 2).toFixed(3)})`}
                    >
                      <path d={CARD_PATH} fill={INK} />
                      {BARS[i].map((b, j) => (
                        <path key={j} d={BAR_PATHS[i][j]} transform={`translate(${b.x.toFixed(2)} ${b.y.toFixed(2)})`} fill={BAR_INK} />
                      ))}
                    </g>
                  </g>
                </g>
              );
            })}

            {/* the labs, over the cards they launch */}
            <g style={{ filter: iconShadow(k, 2, 3, 0.27) }}>
              {MARKS.map((m, i) => {
                const w = markWake(i, frame);
                return (
                  <g
                    key={i}
                    opacity={w.op}
                    transform={`translate(${MARK_XS[i]} ${(MARK_Y - w.lift).toFixed(3)}) scale(${w.sc.toFixed(4)}) translate(${-MARK / 2} ${-MARK / 2}) scale(${MARK / 24})`}
                  >
                    {m.paths.map((d, j) => (
                      <path key={j} d={d} fill={INK} fillRule="evenodd" />
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>
          <Label k={k} x={PX0 + worldPx(24, K_REST)} y={PY_TOP - AX_OVER + 2} text="Loss" frame={frame} f0={6} size={LABEL} align="left" />
          <Label
            k={k}
            x={(PX0 + PX1) / 2}
            y={LABEL_Y - LABEL / 2}
            text="Compute"
            frame={frame}
            f0={10}
            size={LABEL}
          />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default JudgedByTheCurve;
