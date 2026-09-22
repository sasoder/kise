import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  smoothstep,
  worldTransform,
} from "./fieldShared";
import {
  COL_W,
  COL_X0,
  BLOCK_CX,
  Caret,
  GAP,
  GRID_W0,
  INK,
  INK_HI,
  LABEL_RISE_PX,
  PERSON_DX,
  ReaderLine,
  ReaderPerson,
  WORD_H,
  WordBars,
  buildCamera,
  kTrack,
  labelIn,
  makeClock,
  makeColumn,
  makeExit,
  strokeFor,
} from "./punishShared";

export { FPS } from "./punishShared";

// ---------------------------------------------------------------------------
// Noam_Punishing_AIs, cut 1 of 8 — `LaidOutToReadO55` (the O55 rebuild of
// LaidOutToRead). In 0:03.020, DURATION 136 = round(4.999 * 24) + 16.
//   "where the neural nets are just, like, flat out reasoning, laying out their
//    thought process in natural language for us to read."
// Onsets: where 0 · neural 11 · nets 26 · just 34 · flat 40 · reasoning 48 ·
// laying 62 · thought 73 · process 78 · natural 92 · language 98 · for-us 105 ·
// to 111 · read 114 · speech ends 120 · tail to 136.
//
// THE IDEA. The establishing shot of the clip's two actors, introduced by the
// words: the model WRITING its thought in the open (the orange caret laying
// word-bars down), the pull-back that LAYS OUT the page it has written, and US
// arriving at the top of that page to READ it (the white reader line and the
// person). One block, steady rates, everything caused. Nothing else enters.
//
// GESTURES (gesture -> word -> frames). Nothing else moves.
//   1. caret writes, bars laid down up to it -> "neural nets ... reasoning"
//      (the model thinking) -> f0-50 at 24.5 world px/f = 43 screen px/f close
//   2. column scrolls up under the held writing line (V5's hold) -> same, the
//      mechanism of 1 -> f0-28 full, fading out over f28-56
//   3. ONE pull-back, CLOSE -> WIDE, the page opening out round its own centre
//      (Revision 1: the close holds the whole page, so nothing is out through
//      the top to come back) -> "laying out" 62 -> target f20-50, lands f57
//   4. the caret settles to the page's pace (rate eases to 9.87 world px/f) ->
//      "their thought process in natural language" -> f50-72, writing on to
//      the end, never stopping
//   5. reader line draws on from its left end at line 0.5 -> "for us" 105 ->
//      f97-105 (u = 1 at f105)
//   6. person slides up 24 screen px + fades in beside it -> "for us" 105 ->
//      f98-108
//   7. push-in onto the reader, k 1.16 -> 1.25, re-centring the page so the
//      reader sits in the upper third (Revision 1; the content centre goes
//      +15 world px, i.e. slightly DOWN) -> "read" 114 -> target f90-104,
//      lands f109
//   8. reader descends at READER_LPF (speed ramped in over f102-108) -> "to
//      read" -> crosses line 1's centre at f114 on "read"; 2.36 at f136
//   Holds carry a POSITION creep of 0.45 world px/f, pre-rolled into the damper
//   so it is live from f0: upward f0-20 close and f57-90 wide, turned downward
//   inside the lean lobe so f109-135 continues the lean's direction.
//
// CAMERA. kTrack + buildCamera, content centre = upward creep + two eased lobes
// on the same camEase as k; both lobe sizes solved on the damped camera.
//   f0-20   CLOSE k 1.75, cx 532.15 (text axis). REVISION 1: the page (lines
//           0-5) is centred at screen 805 at f0 (491..1118), the writing line
//           held at 1007-1114 by the scroll; no line in the top exit.
//   f20-57  pull-back 1.75 -> 1.16, cx 532.15 -> 540 in the same ease, warp
//           0.85, content-centre lobe +13 world px (a near-pure zoom-out
//           about the page); page centre lands at 786 (f58), 789 (f62),
//           802 (f78).
//   f57-90  WIDE hold, creep.
//   f90-109 push-in 1.16 -> 1.25 (lands f109, 5 f before "read"); REVISION 1:
//           solved so the page centre is 815 at f122 — 827..804 over
//           f109-135, line 0 at 444..420, writing line <= 1196, reader
//           508..618 (upper third).
//   f109-135 WIDE hold at 1.25, creep. Person ink 38 px from the right edge.
//
// MEASURED (bun $S/LaidOutToReadO55/measure.ts, all PASS):
//   camera max |dv| of an on-screen world point 1.80 px/f^2 (f26), max |v| 17.2
//   caret head max 44.0 screen px/f (4 wraps excluded); reader 4.0; person 13.2;
//   reader draw-on tip 136 px/f over 8 f (a stroke drawing, not a head)
//   min position creep on holds 0.44 px/f (sway excluded); min energy 12.1
//   writing-line centre screen y 981..1198 (max f104); lowest ink 1227 (f104)
//   min edge air 32.0 px (f21, close, text at the measure's left edge)
//   page fit with the reader in: line 0 top 481 / 453 / 433 / 420 and the
//   writing line 1195 / 1198 / 1187 / 1174 at f97 / 105 / 120 / 135 — 10 lines,
//   line 0 never thinned; reader index 0.533 at f105, 2.36 at f136, 7.6 lines
//   behind the head; typed text non-decreasing on all 136 frames.
//   Page centre / largest empty run (250..1400): f0 805 / 261, f20 764 / 246,
//   f58 786 / 281, f105 832 / 203, f120 817 / 184, f135 804 / 197.
//   Bar heights: all WORD_H (22 world) on every frame; no line enters the top
//   exit on any frame.
//
// DEVIATIONS FROM THE CUT BRIEF (each with its reason):
//  * CLOSE is k 1.75 on the text axis (532.15), not 2.0 at BLOCK_CX: at 2.0 the
//    576 px measure is 1152 screen px and clips both edges (director res. 1).
//    The brief's k creep 2.0 -> 1.96 is a position creep (COMMON).
//  * The writing clock is solved in CARET PX, not words: 24.5 world px/f at the
//    close (43 screen px/f at k 1.75 — the fastest the 45 px/f head cap allows;
//    1/1.4 words/f would be ~120 px/f and strobe) and eased to V_WIDE = 9.87,
//    SOLVED so the page grows exactly one wrap after the landing and still
//    fits with the lean (director res. 2). The ease runs f50-72, not f60-90,
//    so the page has stopped outrunning the frame before the reader comes.
//  * Bars are revealed up to the caret (WordBars `wipeAt` = 1 - typedFrac, the
//    untyped remainder), because at this rate the module's 2-frame GROW would
//    run each word out ahead of its own caret.
//  * The scroll is V5's hold through the close, then its velocity fades to 0
//    over f28-56: from the landing the page is still and the caret writes DOWN
//    it, so line 0 stays in frame for the reader (director res. 2).
//  * WIDE is k 1.16 -> lean 1.25, not 1.05 -> 1.10: the page is 9-10 lines, not
//    13+, so it is held bigger; 1.25 keeps the person 38 px off the edge.
//  * Pull-back target f20-50 warp 0.85 (brief f30-58 warp 0.7): the |dv| <= 2.5
//    cap needs the longer lobe; the damped move still lands f57.
//  * Lean target f90-104 (brief f100-118): COMMON's landing rule, 4-10 f
//    before "read" 114; it lands f109.
//  * The caret stays in frame to the end (brief: may leave from f112) — the
//    director's page-fit rule holds the writing line <= 1330 through f135.
//  * REVISION 1: the close is framed on the PAGE (centre 805), not on the
//    writing line, so the brief's "paragraphs arriving back in through the top"
//    no longer happens — every line stays in frame through the close, and
//    the pull-back is a zoom-out about the page. The lean is a push-in that
//    re-centres the page (camera slightly DOWN, not up), which puts the
//    reader in the upper third.
//  * Reader y is line r's CENTRELINE (lineYf(r) + WORD_H/2), so index 0.5 is
//    mid-gap between lines 0 and 1; no flags in this cut, so nothing reads
//    foundByReader's convention. Its speed ramps in over 6 f centred on f105
//    (index 0.533 at f105) so the reader's velocity has no corner.
//  * Brief assertion "min k creep >= 0.15 %/f" is replaced by the position
//    creep >= 0.4 screen px/f (director / COMMON).
// OUTSIDE THIS FILE: nothing. The path clock, the faded scroll, the reader
// ramp, the creep pre-roll and the camera solve are new helpers in this file;
// punishShared and fieldShared are imported unedited.
// ---------------------------------------------------------------------------

export const DURATION = 136; // round(4.999 * 24) + 16

/** clip constant: the reader's rate, lines per frame, identical in all eight cuts */
export const READER_LPF = 0.06;
/** the writing line's hold, world y (V5's hold): the column scrolls so the line
 *  being written sits here while the scroll is live. */
export const HOLD_Y = 1050;

export const SEED = 11;
export const N_LINES = 64;
export const PRE_LINES = 5;

/** LINE0 is SOLVED: the top of line PRE_LINES — the line being written at f0 —
 *  sits exactly on HOLD_Y, so the scroll starts from rest at 0. */
const PROTO = makeColumn(SEED, N_LINES, 0);
export const LINE0 = HOLD_Y - PROTO.LINES[PRE_LINES].y0;
export const COLUMN = makeColumn(SEED, N_LINES, LINE0);

/** Frames of table past DURATION, so every lookup near the end is in range. */
const F_TAB = DURATION + 30;

// ---------------------------------------------------------------------------
// THE CLOCK, solved in WORLD PX OF CARET TRAVEL, not in words.
//
// The caret glides at a speed V(f) along the typed path: each word is its width
// plus the GAP after it, so the caret crosses a word AND the space after it at
// one speed, and only the line-wrap is a jump. The bar of the word being typed
// is revealed exactly up to the caret (`typedFrac`), so the text is laid down BY
// the caret instead of each word running out ahead of it on the module's
// two-frame GROW. The module's word clock is then driven from this table
// (`rateAt` = the word count's own frame-to-frame step), so EMIT / grownAt /
// headLine agree with the caret to the frame.
// ---------------------------------------------------------------------------
/** Caret speed at the close open, world px/f: 23.5 x k 1.75 = 41 screen px/f,
 *  under the 45 px/f head cap — the fastest rate that does not strobe. */
export const V_CLOSE = 24.5;
/** The ease from V_CLOSE to V_WIDE (smootherstep), frames: it starts as the
 *  pull-back lands, so the close and the whole move are at the brisk rate. */
export const V_E0 = 50;
export const V_E1 = 72;

const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const vWith = (vWide: number) => (f: number) =>
  V_CLOSE + (vWide - V_CLOSE) * smoother((f - V_E0) / (V_E1 - V_E0));

const FIRST = COLUMN.LINES[PRE_LINES].words[0].gi;
/** Path start of each word from FIRST on (index = gi). */
const PS: number[] = [];
{
  let acc = 0;
  for (let gi = 0; gi < COLUMN.WORDS.length; gi++) {
    if (gi < FIRST) {
      PS.push(-1);
      continue;
    }
    PS.push(acc);
    acc += COLUMN.WORDS[gi].w + GAP;
  }
}
const pathTable = (v: (f: number) => number) => {
  const out = [0];
  for (let f = 1; f <= F_TAB; f++) out.push(out[f - 1] + v(f - 0.5));
  return out;
};
/** The line the caret is still typing on the last frame, and how far short of
 *  its end it must be: the page may grow by exactly ONE wrap after the
 *  landing (line 8 -> 9), which is what the frame has room for. */
export const END_LINE = 9;
export const END_SHORT = 36;
/** Caret speed once the page is laid out, world px/f — SOLVED (bisection) so
 *  the caret is END_SHORT px short of the end of END_LINE on the last frame. */
export const V_WIDE = (() => {
  const l = COLUMN.LINES[END_LINE];
  const lastW = l.words[l.words.length - 1];
  const goal = PS[lastW.gi] + lastW.w + GAP - END_SHORT;
  let lo = 0.5;
  let hi = V_CLOSE;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (pathTable(vWith(mid))[DURATION] > goal) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
})();
export const vAt = vWith(V_WIDE);
/** Caret path position per integer frame. */
export const P: number[] = pathTable(vAt);

const wordAtPath = (p: number) => {
  let gi = FIRST;
  while (gi + 1 < COLUMN.WORDS.length && PS[gi + 1] <= p) gi++;
  return gi;
};
/** Words emitted at path position p (fractional, the gap counted in the word). */
const wordsAtPath = (p: number) => {
  const gi = wordAtPath(p);
  return gi + (p - PS[gi]) / (COLUMN.WORDS[gi].w + GAP);
};
const W_TAB: number[] = P.map(wordsAtPath);

export const CLOCK = makeClock({
  column: COLUMN,
  duration: DURATION,
  preLines: PRE_LINES,
  rateAt: (f) => W_TAB[Math.min(W_TAB.length - 1, f + 1)] - W_TAB[Math.min(W_TAB.length - 1, f)],
});

const pAt = (f: number) => P[Math.max(0, Math.min(P.length - 1, Math.round(f)))];

/** 0..1, how much of word gi the caret has typed at frame f. */
export const typedFrac = (gi: number, f: number) =>
  gi < FIRST ? 1 : clamp01((pAt(f) - PS[gi]) / COLUMN.WORDS[gi].w);

/** The caret in column coordinates: x from the text's left edge, and its line. */
export const caretAt = (f: number) => {
  const p = pAt(f);
  const gi = wordAtPath(p);
  const w = COLUMN.WORDS[gi];
  return { x: w.x + (p - PS[gi]), line: w.line };
};

/** The caret's line as a continuous index, linear in PATH within a line — the
 *  scroll reads this, so the column rises at a constant speed through a line
 *  instead of speeding up on every short word. */
const lineStart: number[] = COLUMN.LINES.map((l) => PS[l.words[0].gi]);
const linePath: number[] = COLUMN.LINES.map((l) => l.words.reduce((s, w) => s + w.w + GAP, 0));
export const pathLine = (f: number) => {
  const c = caretAt(f);
  return c.line + clamp01((pAt(f) - lineStart[c.line]) / linePath[c.line]);
};

// ---------------------------------------------------------------------------
// THE SCROLL. V5's hold while the camera is close — the writing line is held at
// HOLD_Y and the column rises under it — then HANDED TO THE CAMERA during the
// pull-back: the scroll's velocity fades to zero over SCROLL_F0..SCROLL_F1, so
// from the landing on the page is still in the world and the caret writes DOWN
// it. That is what keeps line 0 in frame for the reader: a scroll that kept
// running would carry it out through the top at the writing rate.
// ---------------------------------------------------------------------------
export const SCROLL_F0 = 28;
export const SCROLL_F1 = 56;
const SCROLL_R = 5; // box-smoothing radius, frames
export const SCROLL: number[] = (() => {
  const raw: number[] = [];
  for (let f = 0; f <= F_TAB; f++) raw.push(Math.max(0, COLUMN.lineYf(pathLine(f)) - HOLD_Y));
  const sm: number[] = raw.map((_, i) => {
    let s = 0;
    for (let j = -SCROLL_R; j <= SCROLL_R; j++) s += raw[Math.max(0, Math.min(raw.length - 1, i + j))];
    return s / (2 * SCROLL_R + 1);
  });
  const out = [sm[0]];
  for (let f = 1; f <= F_TAB; f++) {
    const fade = 1 - smoothstep((f - 0.5 - SCROLL_F0) / (SCROLL_F1 - SCROLL_F0));
    out.push(out[f - 1] + (sm[f] - sm[f - 1]) * fade);
  }
  return out;
})();
export const scrollAt = (f: number) => SCROLL[Math.max(0, Math.min(SCROLL.length - 1, Math.round(f)))];

// ---------------------------------------------------------------------------
// THE READER. Drawn on at line 0.5 (mid-gap between lines 0 and 1: the reader
// line sits on line r's CENTRELINE, so a half index is the gap), then down the
// column at READER_LPF. Its speed ramps in over READER_RAMP frames centred on
// READER_GO, so there is no corner in the one velocity that must be steady, and
// the index at any later frame is exactly 0.5 + READER_LPF * (f - READER_GO).
// ---------------------------------------------------------------------------
export const READER_IN = 97; // the line starts drawing on
export const READER_DRAW = 8; // frames to draw across the measure (u = 1 at f105)
export const PERSON_IN = 98; // the person's 10-frame slide-up + fade
export const READER_GO = 105;
export const READER_RAMP = 6;
export const READER_LINE0 = 0.5;
export const READER_R: number[] = (() => {
  const out = [READER_LINE0];
  for (let f = 1; f <= F_TAB; f++) {
    const v = READER_LPF * smoothstep((f - 0.5 - (READER_GO - READER_RAMP / 2)) / READER_RAMP);
    out.push(out[f - 1] + v);
  }
  return out;
})();
export const readerLine = (f: number) => READER_R[Math.max(0, Math.min(READER_R.length - 1, Math.round(f)))];
export const readerU = (f: number) => smoothstep((f - READER_IN) / READER_DRAW);
/** reader line's world y (after the scroll) */
export const readerY = (f: number) => COLUMN.lineYf(readerLine(f)) + WORD_H / 2 - scrollAt(f);

export const PERSON_X = COL_X0 + COL_W + PERSON_DX;

// ---------------------------------------------------------------------------
// THE CAMERA. One continuous target: the close hold (creep), the pull-back to
// WIDE, the wide hold (creep), the lean up onto the reader, a tail creep. k is a
// `kTrack`; the content centre is a constant upward creep plus two eased lobes
// on the SAME camEase as k, so zoom and framing land together. The two lobe
// sizes are SOLVED on the damped camera (fixed-point, sway included), not typed:
//   PB_DC puts the drawn page's centre (line 0 top .. writing line bottom) on
//         PAGE_CENTRE_SY at F_LAND;
//   LN_DC puts the drawn page's centre on LEAN_CENTRE_SY at F_LEAN — the push-in
//         re-centres the page, which puts the reader (top of the page) in the
//         upper third (Revision 1).
// ---------------------------------------------------------------------------
export const TEXT_CX = COL_X0 + COL_W / 2; // 532.15
export const K_CLOSE = 1.75;
export const K_WIDE = 1.16;
export const K_LEAN = 1.25;
export const PB0 = 20;
export const PB1 = 50;
export const PB_WARP = 0.85;
export const LN0 = 90;
export const LN1 = 104;
export const LN_WARP = 0.8;
/** The hold creep, world px/f of content centre (a position creep, not k):
 *  UP through the close and the wide hold (toward the page the pull-back will
 *  reveal, then toward where the reader will arrive), and turned DOWN inside
 *  the lean lobe, on the lean's own ease, so after the lean it continues the
 *  lean's direction. The one zero-crossing of the camera's vertical velocity
 *  is inside the lean move, never at a hold. */
export const CREEP = 0.45;
/** the frame the page-centre solve reads — "laying" (62), after the caret's
 *  wrap onto line 8 at f59, so the landed page is the page that stays */
export const F_LAND = 58;
/** screen y the drawn page's centre lands on at F_LAND */
export const PAGE_CENTRE_SY = 786;
/** the frame the lean solve reads (mid-tail) and the screen y the drawn
 *  page's centre sits on there (Revision 1: 800-830 from the lean's landing) */
export const F_LEAN = 122;
export const LEAN_CENTRE_SY = 815;
/** screen y the drawn page's centre sits on at f0 (Revision 1: 790-820) */
export const CLOSE_CENTRE_SY = 805;

export const headLineAt = (f: number) => caretAt(f).line;
export const writingTopW = (f: number) => COLUMN.lineY(headLineAt(f)) - scrollAt(f);
export const pageTopW = (f: number) => COLUMN.lineY(0) - scrollAt(f);
/** the drawn page's centre, world y: line 0 top .. writing line bottom */
export const pageMidW = (f: number) => (pageTopW(f) + writingTopW(f) + WORD_H) / 2;

/** CC0: the content centre at f0, SOLVED so the page (lines 0-5) is centred on
 *  CLOSE_CENTRE_SY — which puts the writing line at ~1100 at k 1.75. Sway is 0
 *  at f0, so this is exact. */
export const CC0 = pageMidW(0) + (FRAME_H / 2 - CAM_LIFT - CLOSE_CENTRE_SY) / K_CLOSE;

const pbE = (f: number) => camEase((f - PB0) / (PB1 - PB0), PB_WARP);
const lnE = (f: number) => camEase((f - LN0) / (LN1 - LN0), LN_WARP);
export const creepV = (f: number) => CREEP * (-1 + 2 * lnE(f));
/** The creep's PRE-ROLL: the damper's own steady-state lag behind a ramp
 *  (v * CAM_DAMP / CAM_STIFF), stepped into the target on f1 so the camera is
 *  already creeping at ~0.44 screen px/f between f0 and f1 instead of spending
 *  its first ten frames accelerating from rest. */
export const CREEP_PRE = (CREEP * CAM_DAMP) / CAM_STIFF;
const CC_BASE: number[] = [CC0, CC0 - CREEP_PRE + creepV(0.5)];
for (let f = 2; f <= F_TAB; f++) CC_BASE.push(CC_BASE[f - 1] + creepV(f - 0.5));
const ccBase = (f: number) => CC_BASE[Math.max(0, Math.min(F_TAB, Math.round(f)))];

export const K_TRACK = kTrack(
  [
    { f0: 0, f1: PB0, k0: K_CLOSE, k1: K_CLOSE, warp: 1 },
    { f0: PB0, f1: PB1, k0: K_CLOSE, k1: K_WIDE, warp: PB_WARP },
    { f0: PB1, f1: LN0, k0: K_WIDE, k1: K_WIDE, warp: 1 },
    { f0: LN0, f1: LN1, k0: K_WIDE, k1: K_LEAN, warp: LN_WARP },
    { f0: LN1, f1: F_TAB, k0: K_LEAN, k1: K_LEAN, warp: 1 },
  ],
  F_TAB,
);

const camWith = (pbDc: number, lnDc: number) =>
  buildCamera({
    duration: DURATION,
    K: K_TRACK,
    cx: (f) => TEXT_CX + (BLOCK_CX - TEXT_CX) * pbE(f),
    cy: (f) => ccBase(f) + pbDc * pbE(f) + lnDc * lnE(f),
  });

const SOLVED = (() => {
  let pb = -200;
  let ln = 0;
  let cam = camWith(pb, ln);
  for (let i = 0; i < 12; i++) {
    const midS = cam.SCREEN_AT(F_LAND, 540, pageMidW(F_LAND))[1];
    pb += (midS - PAGE_CENTRE_SY) / cam.CAM_AT(F_LAND).k;
    cam = camWith(pb, ln);
    const leanS = cam.SCREEN_AT(F_LEAN, 540, pageMidW(F_LEAN))[1];
    ln += (leanS - LEAN_CENTRE_SY) / cam.CAM_AT(F_LEAN).k;
    cam = camWith(pb, ln);
  }
  return { pb, ln, cam };
})();
/** the pull-back's content-centre travel, world px (negative = up) */
export const PB_DC = SOLVED.pb;
/** the lean's content-centre travel, world px (negative = up) */
export const LN_DC = SOLVED.ln;
export const CAMERA = SOLVED.cam;
export const CAM_AT = CAMERA.CAM_AT;
export const SCREEN_AT = CAMERA.SCREEN_AT;
export const STROKE = strokeFor(K_LEAN);

// ---------------------------------------------------------------------------
export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
});

const LaidOutToReadO55: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
}) => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = CAM_AT(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const scroll = scrollAt(frame);
  const exitAt = makeExit(cy, k);
  const caret = caretAt(frame);

  const u = readerU(frame);
  const ry = readerY(frame);
  const pin = labelIn(frame, PERSON_IN);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={GRID_W0 + frame}
        cy={cy}
        cyRest={CAMERA.CY_REST}
        cx={cx}
        cxRest={CAMERA.CX_REST}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
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
            {/* the model's thought, laid down by the caret */}
            <WordBars
              column={COLUMN}
              clock={CLOCK}
              frame={frame}
              scroll={scroll}
              accent={accent}
              exitAt={exitAt}
              wipeAt={(gi, f) => 1 - typedFrac(gi, f)}
            />
            {/* us, reading */}
            {u > 0 ? <ReaderLine yWorld={ry} u={u} stroke={STROKE} ink={ink} k={k} /> : null}
            {/* the model, writing */}
            <Caret
              x={COL_X0 + caret.x}
              y={COLUMN.lineY(caret.line) - scroll}
              accent={accent}
            />
          </svg>
          {pin > 0 ? (
            <ReaderPerson
              x={PERSON_X}
              y={ry + (LABEL_RISE_PX / k) * (1 - pin)}
              k={k}
              opacity={INK_HI * pin}
            />
          ) : null}
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default LaidOutToReadO55;
