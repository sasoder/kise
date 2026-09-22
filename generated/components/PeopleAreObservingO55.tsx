import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  smoothstep,
  worldTransform,
} from "./fieldShared";
import {
  BLOCK_CX,
  CARET_LEAD,
  COL_W,
  COL_X0,
  Caret,
  GRID_W0,
  INK,
  INK_HI,
  PERSON_BOX,
  PERSON_DX,
  READER_X0,
  READER_X1,
  ReaderLine,
  ReaderPerson,
  WORD_H,
  WordBars,
  buildCamera,
  curve,
  flagBox,
  kTrack,
  makeClock,
  makeColumn,
  makeExit,
  roundRect,
  strokeFor,
  type Flag,
} from "./punishShared";

// ---------------------------------------------------------------------------
// Noam_Punishing_AIs, cut 7 of 8, O55 rebuild — in 0:52.920, DURATION 146.
// "because you could have a situation where the model understands what chain
//  of thought is and that people are observing it."
// because 0 · you 5 · could 9 · have-a 11 · situation 17 · where 25 · the 30 ·
// model 33 · understands 38 · what 49 · chain 61 · of 66 · thought 69 ·
// is-and 72 · that 88 · people 98 · are 112 · observing 115 · it 122 · ends 130
//
// THE IDEA. The model draws OUR instruments in ITS colour. It stops, circles
// the three words it just wrote with the same rounded bracket the white reader
// leaves — in orange. Later it underlines its own last line with a copy of the
// white reader line — in orange, end dots and all — and writes on beneath it.
// The rhyme of the white reader + person above and the orange copy below is
// the cut. No skulls, no white brackets.
//
// GESTURES (every one with its word):
//  1. f0–33   writing lines 31–33 at the clock's natural per-word rates; the
//             last word ("thought", 46 px) decelerates so the caret comes to
//             rest at the line's end on "model" 33.
//  2. f33–60  "understands what chain" — the caret TRACES the orange bracket
//             round line 33 words 1..3, clockwise from where it stopped (the
//             right side's midpoint), the stroke drawn behind it; complete
//             f60, before "chain" 61. Clock held [33, 60).
//  3. f60–95  writing lines 34–37; the last word decelerates to rest at the
//             line's right end.
//  4. f95.5–125 "people are observing it" — a carriage return: glide 4.6 f to
//             the right end of the line position under line 37, sweep R→L
//             21.8 f (orange ReaderLine, u = the caret's x), complete f121.9
//             before "it" 122, swing down 3.1 f into line 38 arriving at
//             writing speed heading right. Clock held [96, 125).
//  5. f125–146 tail: the caret writes line 38 UNDER its own orange line; the
//             white reader keeps descending (it crosses the orange box
//             f81–94, on "that").
// CAMERA (kTrack + buildCamera, cx/cy content centres on the same camEase):
//  - f0–32   WIDE k 1.25 at BLOCK_CX, creep 0.6 world px/f.
//  - push    target f32–56 warp 1, 1.25 → 1.75, cx 540 → 532.15 (text axis),
//            content 740 → 866; the damped camera moves f34–62, lands f62
//            (k within 0.4%) — 7 f before "thought" 69; peak k 1.7471, ≥ 1.743
//            on f62–65 with the person fully out.
//  - tilt    target f63–86 warp 0.9, 1.75 → 1.20 WIDE at BLOCK_CX; lands f93,
//            5 f before "people" 98.
//  - f93–146 WIDE k 1.20, creep 0.62 world px/f.
// MEASURED (measure.ts, all PASS):
//  camera max |dv| of any drawn thing 2.157 screen px/f² (whole frame incl.
//  empty corners 2.885), max |v| 21.6; caret away-motion max 44.9 screen px/f
//  (trace), sweep 43.5, glide1 18.0, glide2 24.4; caret max |dv| 49.5 screen
//  px/f² at the bracket's 12-px-radius corners, 21.7 elsewhere; hand-offs C0
//  ≤ 0.02 world px, C1 ≤ 0.20 world px/f (the resume after the box is a line
//  wrap); reader–head distance 2.55–4.46 lines, never capped; writing-line
//  screen y 1061–1229; lowest ink 1258 (f0 caret); min edge air 35.7; energy
//  min 7.3; bars all WORD_H (only top-exit thinning).
// DEVIATIONS from the brief (reasons in the O55 report):
//  - page moved: preLines 31, reader 27.85, box line 33 words 1..3, orange
//    line under line 37 — the only phrase/line pair that fits the reader
//    window [2.5, 4.5] with both holds, a line end within 46 px of the
//    line's right end, and a short first tail word.
//  - the bracket is drawn from where the caret stops (the right side), not
//    from the top-left after a glide back; the line sweeps R→L (ReaderLine
//    mirrored about the text axis); both save ~600 px of glide the 45 px/f
//    cap cannot afford.
//  - push lands f62 (before "thought"), not f46; CLOSE is a 4-frame crest;
//    WIDE after the tilt is k 1.20, not 1.30; the line leave is f95.5.
// Helpers written here (not in punishShared): CaretBracket (flagBox +
// roundRect with a dash offset), headAtT (the clock's head at sub-frame t).
// ---------------------------------------------------------------------------

export const FPS = 24;
/** round(5.420 * 24) + 16 */
export const DURATION = 146;

/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
export const READER_LPF = 0.06;
/** clip constant: the writing line's hold, world y */
export const HOLD_Y = 1050;
/** Line 0's top in world y before the scroll. Any value that keeps the scroll
 *  positive works; 0 keeps the column's own numbers readable in measure.ts. */
export const LINE0 = 0;

export const COLUMN = makeColumn(11, 64, LINE0);
const { LINES, lineY, lineYf } = COLUMN;

// --- the page at f0 and the two drawings ------------------------------------
/** Lines on the page when we arrive; the caret starts line 31. */
export const PRE_LINES = 31;
/** The phrase the model boxes: line 33, words 1..3 — the LAST three words of
 *  the line, so the caret stops at the phrase's right end. */
export const BOX_FLAG: Flag = { line: 33, k0: 1, k1: 3, found: 33 };
/** The orange reader line goes under this line (its last written line). */
export const LINE_N = 37;
/** The white reader's line index at f0 (never capped). */
export const READER_LINE0 = 27.85;

// --- timing (frames) ---------------------------------------------------------
export const F_BOX_LEAVE = 33; // "model" 33
export const F_BOX_BACK = 60; // box complete, clock resumes
export const F_LINE_LEAVE = 95.5; // caret leaves the head
export const T_GLIDE1 = 4.6; // head -> right end of the line position
export const T_SWEEP = 21.8; // R -> L across the column
export const F_LINE_BACK = 125; // clock resumes (integer)

// --- camera ------------------------------------------------------------------
export const K_WIDE0 = 1.25;
export const K_CLOSE = 1.75;
export const K_WIDE1 = 1.2;
export const K_REST = K_WIDE0;
export const STROKE = strokeFor(K_REST);
export const TEXT_AX = COL_X0 + COL_W / 2;
export const PUSH = { f0: 32, f1: 56, warp: 1 };
export const TILT = { f0: 63, f1: 86, warp: 0.9 };
export const C_OPEN = 740;
export const C_CLOSE = 866;
export const C_WIDE = 800;
export const CREEP_OPEN = 0.6; // world px/f (0.75 screen px/f at 1.25)
export const CREEP_CLOSE = -0.43; // 0.75 screen px/f at 1.75
export const CREEP_WIDE = -0.62; // 0.75 screen px/f at 1.20

const EPS = 1e-4;

// ---------------------------------------------------------------------------
// THE CLOCK. W(f) is built word by word. A word's natural duration is the one
// at which its bar's growing end (2 frames, `GROW`) just meets the caret's
// front edge: rate = (1 - 18 / w) / 2, floored at 0.30 words/f. A segment is
// fitted to its window by scaling every natural duration by one factor (only
// ever DOWN — faster is always safe). The last word before a hold DECELERATES
// to rest (W = 1 - (1 - tau)^2), so the caret arrives at the phrase's end, or
// the line's end, at zero speed and the glide that follows starts from rest.
// ---------------------------------------------------------------------------
const wordW = (gi: number) => COLUMN.WORDS[gi].w;
const naturalDur = (gi: number) => 1 / Math.max(0.3, (1 - 18 / wordW(gi)) / 2);
/** The longest a decelerating last word may take and still keep its bar
 *  behind the caret's front edge at t = 2 frames. */
const maxDecel = (gi: number) => 2 / (1 - Math.sqrt(18 / wordW(gi)));

type Piece = { t0: number; t1: number; g: number; kind: "lin" | "dec" | "acc"; r0?: number };
const pieces: Piece[] = [];

const firstGi = (line: number) => LINES[line].words[0].gi;
const lastGi = (line: number) => LINES[line].words[LINES[line].words.length - 1].gi;

/** Lay words [g0, g1] (inclusive) into [t0, t1], the last one decelerating. */
const laySegment = (g0: number, g1: number, t0: number, t1: number) => {
  let nat = 0;
  for (let g = g0; g < g1; g++) nat += naturalDur(g);
  // the decelerating last word takes the longest it may; the rest are fitted
  let dec = maxDecel(g1);
  let s = (t1 - t0 - dec) / nat;
  if (s > 1) {
    s = 1;
    dec = t1 - t0 - nat;
  }
  if (s > 1.0001) throw new Error(`clock: words ${g0}-${g1} cannot fill ${t0}-${t1} without bars leading the caret`);
  let t = t0;
  for (let g = g0; g < g1; g++) {
    const d = naturalDur(g) * s;
    pieces.push({ t0: t, t1: t + d, g, kind: "lin" });
    t += d;
  }
  pieces.push({ t0: t, t1: t1, g: g1, kind: "dec" });
  return s;
};

export const GI_BOX_END = lastGi(BOX_FLAG.line) + 1; // 138
export const GI_LINE_END = lastGi(LINE_N) + 1; // 154
export const SCALE0 = laySegment(firstGi(PRE_LINES), GI_BOX_END - 1, 0, F_BOX_LEAVE);
export const SCALE1 = laySegment(GI_BOX_END, GI_LINE_END - 1, F_BOX_BACK, F_LINE_LEAVE);

// --- the carriage return's arrival speed decides the tail's first word rate --
/** The first word of the tail, written at the speed the caret arrives with. */
const GI_TAIL0 = GI_LINE_END;

// the away paths are built further down; the tail needs the arrival speed, so
// the tail pieces are laid after the carriage return is solved.

// ---------------------------------------------------------------------------
// THE CAMERA — built before the caret, because the box trace reads its k.
// ---------------------------------------------------------------------------
const gMove = (f: number, m: { f0: number; f1: number; warp: number }) =>
  camEase(clamp01((f - m.f0) / (m.f1 - m.f0)), m.warp);

export const K_TRACK = kTrack(
  [
    { f0: 0, f1: PUSH.f0, k0: K_WIDE0, k1: K_WIDE0, warp: 1 },
    { f0: PUSH.f0, f1: PUSH.f1, k0: K_WIDE0, k1: K_CLOSE, warp: PUSH.warp },
    { f0: PUSH.f1, f1: TILT.f0, k0: K_CLOSE, k1: K_CLOSE, warp: 1 },
    { f0: TILT.f0, f1: TILT.f1, k0: K_CLOSE, k1: K_WIDE1, warp: TILT.warp },
    { f0: TILT.f1, f1: DURATION + 2, k0: K_WIDE1, k1: K_WIDE1, warp: 1 },
  ],
  DURATION + 2,
);

const cOpen = (f: number) => C_OPEN + CREEP_OPEN * f;
const cClose = (f: number) => C_CLOSE + CREEP_CLOSE * (f - PUSH.f1);
const cWide = (f: number) => C_WIDE + CREEP_WIDE * (f - TILT.f1);

export const camCx = (f: number) =>
  BLOCK_CX + (TEXT_AX - BLOCK_CX) * (gMove(f, PUSH) - gMove(f, TILT));
export const camCy = (f: number) => {
  const a = cOpen(f) + (cClose(f) - cOpen(f)) * gMove(f, PUSH);
  return a + (cWide(f) - a) * gMove(f, TILT);
};

export const CAM = buildCamera({ duration: DURATION, K: K_TRACK, cx: camCx, cy: camCy });
const kAt = (t: number) => {
  const f = Math.max(0, Math.min(DURATION + 1, Math.floor(t)));
  const a = CAM.CAM_AT(f).k;
  const b = CAM.CAM_AT(f + 1).k;
  return a + (b - a) * (t - f);
};

// ---------------------------------------------------------------------------
// THE SPEED PROFILE every away-motion uses: a trapezoid with sine ramps, so
// the speed is continuous (C1 position) and zero at a ramp's rest end.
// ---------------------------------------------------------------------------
const ramp = (t: number, ta: number, tb: number, rin: number, rout: number) => {
  if (t <= ta || t >= tb) return 0;
  if (t < ta + rin) return (1 - Math.cos((Math.PI * (t - ta)) / rin)) / 2;
  if (t > tb - rout) return (1 - Math.cos((Math.PI * (tb - t)) / rout)) / 2;
  return 1;
};
const SUB = 32;

// ---------------------------------------------------------------------------
// THE ORANGE BRACKET. The same `flagBox` + `roundRect` geometry and stroke as
// a white bracket. The caret traces it CLOCKWISE starting where it stopped —
// the middle of the box's right side, which is the phrase's end — so the
// dash is `pathLength` 1 offset by the start's arc length. v = A g(t) / k(t):
// a constant SCREEN speed on the plateau however the push changes k.
// ---------------------------------------------------------------------------
const BOX = flagBox(COLUMN, BOX_FLAG);
const BX0 = BOX.x0 + COL_X0;
const BX1 = BOX.x1 + COL_X0;
const BY0 = BOX.y0;
const BY1 = BOX.y1;
const BR = Math.min(12, (BY1 - BY0) / 2);
const BW = BX1 - BX0;
const BH = BY1 - BY0;
export const BOX_X0 = BX0;
export const BOX_X1 = BX1;
export const BOX_Y0 = BY0;
export const BOX_Y1 = BY1;
const seg = {
  top: BW - 2 * BR,
  arc: (Math.PI * BR) / 2,
  side: BH - 2 * BR,
};
export const BOX_LEN = 2 * seg.top + 2 * seg.side + 4 * seg.arc;
export const BOX_S0 = seg.top + seg.arc + seg.side / 2;
/** A point on the round rect, arc length s from its top-left start, clockwise. */
const boxPoint = (sIn: number) => {
  let s = ((sIn % BOX_LEN) + BOX_LEN) % BOX_LEN;
  const arc = (cx: number, cy: number, a0: number) => {
    const a = a0 + s / BR;
    return { x: cx + BR * Math.cos(a), y: cy + BR * Math.sin(a) };
  };
  if (s < seg.top) return { x: BX0 + BR + s, y: BY0 };
  s -= seg.top;
  if (s < seg.arc) return arc(BX1 - BR, BY0 + BR, -Math.PI / 2);
  s -= seg.arc;
  if (s < seg.side) return { x: BX1, y: BY0 + BR + s };
  s -= seg.side;
  if (s < seg.arc) return arc(BX1 - BR, BY1 - BR, 0);
  s -= seg.arc;
  if (s < seg.top) return { x: BX1 - BR - s, y: BY1 };
  s -= seg.top;
  if (s < seg.arc) return arc(BX0 + BR, BY1 - BR, Math.PI / 2);
  s -= seg.arc;
  if (s < seg.side) return { x: BX0, y: BY1 - BR - s };
  s -= seg.side;
  return arc(BX0 + BR, BY0 + BR, Math.PI);
};

export const BOX_RIN = 4;
export const BOX_ROUT = 4;
const traceTable = (() => {
  const n = Math.round((F_BOX_BACK - F_BOX_LEAVE) * SUB);
  const I: number[] = [0];
  for (let i = 1; i <= n; i++) {
    const t = F_BOX_LEAVE + (i - 0.5) / SUB;
    I.push(I[i - 1] + ramp(t, F_BOX_LEAVE, F_BOX_BACK, BOX_RIN, BOX_ROUT) / kAt(t) / SUB);
  }
  const A = BOX_LEN / I[n];
  return { I, A, n };
})();
/** screen-speed plateau of the trace, px/f (before camera motion) */
export const BOX_SCREEN_PLATEAU = traceTable.A;
/** arc length traced by time t */
export const boxS = (t: number) => {
  if (t <= F_BOX_LEAVE) return 0;
  if (t >= F_BOX_BACK) return BOX_LEN;
  const x = (t - F_BOX_LEAVE) * SUB;
  const i = Math.floor(x);
  const a = traceTable.I[i];
  const b = traceTable.I[Math.min(traceTable.n, i + 1)];
  return traceTable.A * (a + (b - a) * (x - i));
};
export const boxU = (t: number) => boxS(t) / BOX_LEN;

// ---------------------------------------------------------------------------
// THE ORANGE READER LINE — a carriage return. The caret finishes line 37 at
// rest, glides (4.6 f, rest to rest) to the line position's RIGHT end, sweeps
// RIGHT -> LEFT across the column at a constant plateau speed (sine ramps),
// the line drawing behind it (`ReaderLine` in ACCENT, mirrored about the text
// axis so its u runs from the right; u follows the caret's x), and swings down
// into line 38's first word ARRIVING AT WRITING SPEED heading right, so the
// hand-off back to writing has no velocity step.
// ---------------------------------------------------------------------------
const lnTop = lineY(LINE_N);
const ln1Top = lineY(LINE_N + 1);
/** the line position: the middle of the gap under line N (world y, pre-scroll) */
export const Y_LINE = lnTop + WORD_H + (ln1Top - lnTop - WORD_H) / 2;
const lastN = LINES[LINE_N].words[LINES[LINE_N].words.length - 1];
const P_HEAD = { x: COL_X0 + lastN.x + lastN.w + CARET_LEAD, y: lnTop + WORD_H / 2 };
const P_R = { x: READER_X1, y: Y_LINE };
const P_L = { x: READER_X0, y: Y_LINE };
const w0 = COLUMN.WORDS[GI_TAIL0];
const P_TAIL = { x: COL_X0 + w0.x + CARET_LEAD, y: ln1Top + WORD_H / 2 };
export const SPAN = READER_X1 - READER_X0;

export const SWEEP_RIN = 5;
export const SWEEP_ROUT = 5;
export const F_SWEEP0 = F_LINE_LEAVE + T_GLIDE1;
export const F_SWEEP1 = F_SWEEP0 + T_SWEEP;
export const T_GLIDE2 = F_LINE_BACK - F_SWEEP1;
const sweepTable = (() => {
  const n = Math.round(T_SWEEP * SUB);
  const I: number[] = [0];
  for (let i = 1; i <= n; i++) {
    const t = F_SWEEP0 + (i - 0.5) / SUB;
    I.push(I[i - 1] + ramp(t, F_SWEEP0, F_SWEEP1, SWEEP_RIN, SWEEP_ROUT) / SUB);
  }
  return { I, A: SPAN / I[n], n };
})();
/** world px/f on the sweep's plateau */
export const SWEEP_PLATEAU = sweepTable.A;
const sweepS = (t: number) => {
  if (t <= F_SWEEP0) return 0;
  if (t >= F_SWEEP1) return SPAN;
  const x = (t - F_SWEEP0) * SUB;
  const i = Math.floor(x);
  const a = sweepTable.I[i];
  const b = sweepTable.I[Math.min(sweepTable.n, i + 1)];
  return sweepTable.A * (a + (b - a) * (x - i));
};
/** 0..1, how much of the orange line is drawn — it follows the caret's x */
export const lineU = (t: number) => clamp01(sweepS(t) / SPAN);

// glide 2: a cubic from the line's left end (at rest) to line 38's first word,
// arriving heading RIGHT. Sampled by arc length; speed v = V_ARR (3 tau^2 -
// 2 tau^3), so it starts at rest and arrives at V_ARR with zero acceleration.
const G2 = {
  p0: P_L,
  p1: { x: P_L.x + 6, y: P_L.y + 18 },
  p2: { x: P_TAIL.x - 24, y: P_TAIL.y },
  p3: P_TAIL,
};
const bez = (t: number) => {
  const m = 1 - t;
  return {
    x: m * m * m * G2.p0.x + 3 * m * m * t * G2.p1.x + 3 * m * t * t * G2.p2.x + t * t * t * G2.p3.x,
    y: m * m * m * G2.p0.y + 3 * m * m * t * G2.p1.y + 3 * m * t * t * G2.p2.y + t * t * t * G2.p3.y,
  };
};
const g2Table = (() => {
  const N = 400;
  const pts = [bez(0)];
  const cum = [0];
  for (let i = 1; i <= N; i++) {
    const q = bez(i / N);
    cum.push(cum[i - 1] + Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y));
    pts.push(q);
  }
  return { pts, cum, L: cum[N], N };
})();
export const G2_LEN = g2Table.L;
/** the speed the caret arrives at line 38 with, world px/f */
export const V_ARRIVE = (2 * G2_LEN) / T_GLIDE2;
const g2Point = (s: number) => {
  const { pts, cum, N } = g2Table;
  const t = Math.max(0, Math.min(cum[N], s));
  let i = 1;
  while (i < N && cum[i] < t) i++;
  const g = (t - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
  return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * g, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * g };
};

// --- the tail's clock: its first word is written at the arrival speed -------
export const RATE_TAIL0 = V_ARRIVE / w0.w;
{
  const d0 = 1 / RATE_TAIL0;
  pieces.push({ t0: F_LINE_BACK, t1: F_LINE_BACK + d0, g: GI_TAIL0, kind: "lin" });
  let t = F_LINE_BACK + d0;
  for (let g = GI_TAIL0 + 1; g < COLUMN.WORDS.length; g++) {
    const d = naturalDur(g);
    pieces.push({ t0: t, t1: t + d, g, kind: "lin" });
    t += d;
  }
}

/** W(f): the clock as a continuous function. Flat through both holds. */
export const W_OF = (f: number) => {
  const W0 = firstGi(PRE_LINES);
  if (f <= 0) return W0;
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    if (f < p.t0) {
      // between pieces = a hold: the value the previous piece ended on
      return i === 0 ? W0 : pieces[i - 1].g + 1 - EPS;
    }
    if (f <= p.t1) {
      const tau = (f - p.t0) / (p.t1 - p.t0);
      if (p.kind === "dec") return p.g + (1 - EPS) * (1 - (1 - tau) * (1 - tau));
      // a word that starts after a hold starts from the held value
      const start = i > 0 && pieces[i - 1].t1 < p.t0 - 1e-9 ? p.g - EPS : p.g;
      return start + (p.g + 1 - start) * tau;
    }
  }
  return pieces[pieces.length - 1].g + 1;
};

export const HOLDS: [number, number][] = [
  [F_BOX_LEAVE, F_BOX_BACK],
  [Math.ceil(F_LINE_LEAVE), F_LINE_BACK],
];

export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: (f) => W_OF(f + 1) - W_OF(f),
  holds: HOLDS,
});

export const scrollAt = (f: number) => CLOCK.scrollAt(f, HOLD_Y);

// ---------------------------------------------------------------------------
// THE CARET, in world x / pre-scroll world y (its CENTRE). One function, four
// kinds of segment: writing (the clock's head + CARET_LEAD), the box trace,
// the carriage return (glide 1, sweep, glide 2).
// ---------------------------------------------------------------------------
/** The clock's head at CONTINUOUS time: `CLOCK.headAt` on integer frames (all
 *  that is ever rendered); between frames the same head formula on W_OF, which
 *  measure.ts needs for sub-frame speeds. */
const headAtT = (t: number) => {
  if (Number.isInteger(t)) return CLOCK.headAt(t);
  const w = W_OF(t);
  const i = Math.max(0, Math.min(COLUMN.WORDS.length - 1, Math.floor(w)));
  const word = COLUMN.WORDS[i];
  return { x: word.x + word.w * clamp01(w - i), line: word.line, y: lineY(word.line) };
};
export const writingPos = (f: number) => {
  const h = headAtT(f);
  return { x: COL_X0 + h.x + CARET_LEAD, y: h.y + WORD_H / 2 };
};
const W_BOX_OFF = (() => {
  const a = writingPos(F_BOX_LEAVE);
  const b = boxPoint(BOX_S0);
  return { x: a.x - b.x, y: a.y - b.y };
})();

export type CaretSeg = "write" | "trace" | "glide1" | "sweep" | "glide2";
export const caretSegAt = (t: number): CaretSeg => {
  if (t >= F_BOX_LEAVE && t <= F_BOX_BACK) return "trace";
  if (t >= F_LINE_LEAVE && t < F_SWEEP0) return "glide1";
  if (t >= F_SWEEP0 && t < F_SWEEP1) return "sweep";
  if (t >= F_SWEEP1 && t <= F_LINE_BACK) return "glide2";
  return "write";
};

export const caretAt = (t: number) => caretOnSeg(caretSegAt(t), t);
/** the caret by an explicit segment formula — measure.ts compares both sides
 *  of every hand-off with it */
export const caretOnSeg = (s: CaretSeg, t: number) => {
  if (s === "trace") {
    const p = boxPoint(BOX_S0 + boxS(t));
    // the 1 px between the writing caret and the path's start is blended out
    // over the ramp-in and back in over the ramp-out
    const tau = (t - F_BOX_LEAVE) / (F_BOX_BACK - F_BOX_LEAVE);
    const w = 1 - smoothstep(tau * 6) + smoothstep((tau - 1) * 6 + 1);
    return { x: p.x + W_BOX_OFF.x * w, y: p.y + W_BOX_OFF.y * w };
  }
  if (s === "glide1") {
    const u = smoothstep((t - F_LINE_LEAVE) / T_GLIDE1);
    return curve(P_HEAD, P_R, u, 0.12);
  }
  if (s === "sweep") return { x: READER_X1 - sweepS(t), y: Y_LINE };
  if (s === "glide2") {
    const tau = clamp01((t - F_SWEEP1) / T_GLIDE2);
    const sArc = V_ARRIVE * T_GLIDE2 * (tau * tau * tau - (tau * tau * tau * tau) / 2);
    return g2Point(sArc);
  }
  return writingPos(t);
};

// ---------------------------------------------------------------------------
// THE WHITE READER — constant rate, never capped.
// ---------------------------------------------------------------------------
export const readerLineAt = (f: number) => READER_LINE0 + READER_LPF * f;
/** the reader's world y (pre-scroll): on the line's word band centre at an
 *  integer index */
export const readerY = (f: number) => lineYf(readerLineAt(f)) + WORD_H / 2;
export const PERSON_X = COL_X0 + COL_W + PERSON_DX;

// ---------------------------------------------------------------------------
export const schema = z.object({
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
});

/** The orange bracket: `Bracket`'s geometry (flagBox + roundRect, r = min(12,
 *  hh), the line's exit thinning) with the draw-on starting at arc length
 *  `s0` instead of the top-left. A new helper: the exported `Bracket` has no
 *  dash offset. */
const CaretBracket: React.FC<{ u: number; scroll: number; exit: number; k: number }> = ({
  u,
  scroll,
  exit,
  k,
}) => {
  if (u <= 0 || exit <= 0.004) return null;
  const my = (BY0 + BY1) / 2 - scroll;
  const hh = (BH / 2) * exit;
  const r = Math.min(12, hh);
  // the start's arc length on THIS (possibly thinned) rect, as a fraction
  const top = BW - 2 * r;
  const side = 2 * hh - 2 * r;
  const len = 2 * top + 2 * side + 2 * Math.PI * r;
  const s0 = (top + (Math.PI * r) / 2 + side / 2) / len;
  return (
    <path
      d={roundRect(BX0, my - hh, BX1, my + hh, r)}
      fill="none"
      stroke={ACCENT}
      strokeWidth={STROKE * exit}
      strokeLinejoin="round"
      opacity={OP_UNREAD_DOT}
      pathLength={1}
      strokeDasharray={u < 1 ? `${u} ${Math.max(1e-4, 1 - u)}` : undefined}
      strokeDashoffset={u < 1 ? -s0 : undefined}
      style={{ filter: iconShadow(k) }}
    />
  );
};

const PeopleAreObservingO55: React.FC<Props> = ({
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
}) => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAM.CAM_AT(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const scroll = scrollAt(frame);
  const exitAt = makeExit(cy, k);
  const caret = caretAt(frame);
  const rY = readerY(frame) - scroll;
  const boxEx = exitAt((BY0 + BY1) / 2 - scroll);
  const uLine = lineU(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_W0 + frame}
        cy={cy}
        cyRest={CAM.CY_REST}
        cx={cx}
        cxRest={CAM.CX_REST}
        k={k}
        parallax={parallax}
      />
      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <WordBars column={COLUMN} clock={CLOCK} frame={frame} scroll={scroll} exitAt={exitAt} />
            <CaretBracket u={boxU(frame)} scroll={scroll} exit={boxEx} k={k} />
            {uLine > 0 ? (
              <g transform={`translate(${READER_X0 + READER_X1} 0) scale(-1 1)`}>
                <ReaderLine
                  column={COLUMN}
                  yWorld={Y_LINE - scroll}
                  u={uLine}
                  stroke={STROKE}
                  ink={ACCENT}
                  opacity={OP_UNREAD_DOT}
                  k={k}
                />
              </g>
            ) : null}
            <ReaderLine column={COLUMN} yWorld={rY} stroke={STROKE} ink={INK} opacity={INK_HI} k={k} />
            <Caret x={caret.x} y={caret.y - scroll - WORD_H / 2} lead={0} />
          </svg>
          <ReaderPerson x={PERSON_X} y={rY} k={k} box={PERSON_BOX} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default PeopleAreObservingO55;
