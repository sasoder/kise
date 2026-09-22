import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { camKnots3, hermite, lerp, runCam3 } from "./trapShared";
import {
  CLIMBERS,
  CLIMBER_R,
  COLUMN,
  Climber,
  GATHERED,
  GATHER_DELAY,
  GATHER_MARK_PAD,
  INK,
  LevelLine,
  MODEL_EDGE,
  MODEL_MARK,
  ModelMark,
  PAIR_HALF,
  QUESTIONS,
  QuestionRing,
  RUNG_FADE_F,
  RungPair,
  SPEED_CAP_SCREEN,
  Trail,
  climberAt,
  climberRungs,
  gatherDur,
  makePairSolver,
  makeSolver,
  pairDots,
  pairDx,
  ringSway,
  solvedAt,
  strokeScreen,
  strokeW,
} from "./challengeShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 3 of the set: `EquallyStrong`.
// Line (SRT 0:19.300 -> 0:21.859):
//   "you're always playing against an AI that's equally strong"
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// THIS CUT'S ONE IDEA, out of that: cut 2 showed a game-playing AI LAYS ITS OWN
// RUNGS. This cut says HOW it can: it plays against a twin exactly as strong,
// and every rung is MADE BETWEEN THE TWO OF THEM. The climber's dot splits, the
// two halves stand at THE SAME HEIGHT either side of their own path, a level
// line is drawn between them, and from then on it is that line — not a dot —
// that reaches each question and turns it over.
//
// VOCABULARY — `challengeShared`'s. Nothing is invented: the ring, the flip, the
// two ink rungs, the stroke family, the climber dot, its rungs and its trail are
// cuts 1 and 2's, and the three things cut 3 adds (the twin, the connector, the
// two rails) are exports of that same file. ORANGE IS THE MODEL AND ITS LEVEL
// AND NOTHING ELSE — every climber is white. The model itself does NOT leave the
// frame in this cut, which the brief expected it to: see THE ORANGE below.
//
// DURATION. 2.559 s of speech x 24 = 61.4 -> 61 frames, plus the set's 16-frame
// tail: DURATION = 61 + 16 = 77.
//
// Word -> frame (24 fps from comp start):
//   you're 0 · always 1 · playing 7 · against 13 · an 21 · AI 34 · that's 37 ·
//   equally 43 · strong 50 · (speech ends 61)
//
// SOUND-OFF READING TEST — one sentence:
//   "the camera leaves the orange mark and its column behind and pushes in on
//    one of the white climbers, which splits into two dots side by side at the
//    same height; a line is drawn between them, and from then on the question
//    marks above are turned into ticks by that line as the pair climbs through
//    them."
//
// ---------------------------------------------------------------------------
// THE JOIN. Cut 2 is in at 0:11.160, this cut at 0:19.300, so f0 here is cut 2's
// world at frame round(8.140 s x 24) = 195 — its own speech-end frame 139 plus
// the 56 frames the edit does not show. That offset is taken off THE SRT rather
// than off cut 2's internal beats, so it cannot drift if cut 2 is re-timed.
// Every climber, rung and trail is `challengeShared`'s own arithmetic evaluated
// at f + 195: nothing is restated and nothing is re-authored, and the module
// THROWS if the subject is not exactly where cut 2's numbers put it.
//
// THE SUBJECT is c2, the MIDDLE path of cut 2's three-climber fan — picked, not
// assumed, by scoring all three on what the glide onto them costs AND on what is
// left cluttering the close-up once it has landed. The second half decided it:
//   c1  off frame at f0 (screen y -725) behind a 1,600 px crane   REJECTED
//       costing 177 screen px/f, four times the set's cap.
//   c3  cheapest glide (|dv| 1.51) but it climbs alongside the column rather
//       than out of it: 10 of the column's rings still in frame at f34, 5 at
//       f50, the model's mark in shot for every frame of the cut and its level
//       line cutting across the pair's own height (screen y 748 at f34).
//   c2  |dv| 1.61, peak 40.1 px/f, fastest in-frame rung 43.7 (cap 45) once the
//       glide is warped early (0.6) and rounded at sigma 13 — and it climbs OUT:
//       the mark's last frame in shot is f15, the column is down to 4 rings at
//       f34 and 1 by f50, and the level line sinks 420 -> 1814 screen y, off the
//       bottom by the end.                                         CHOSEN
// c2 costs a little more camera than c3 and buys a frame that is actually about
// the pair, which is what the cut is for.
//
// ---------------------------------------------------------------------------
// GESTURES — three, and the mechanism that runs under them. Nothing else moves
// on its own.
//
//  1. f0-30   "you're always        THE PUSH-IN. ONE glide out of cut 2's wide
//             playing against"      contrast framing (k 0.847, cx 909) into a
//             (f0/f1/f7/f13)        close tracking shot on c2 (k 1.9), warp 0.60
//                                   so the speed is early, landing f30 — four
//                                   frames ahead of "AI" (f34). The column and
//                                   its gathered mass slide down and out of frame
//                                   LEFT, and what is left is one white dot with
//                                   a ladder of its own ticks under it. The
//                                   camera is already moving at f0 (40 frames of
//                                   pre-roll carrying cut 2's own tail drift) so
//                                   nothing starts from a standing start.
//
//  2. f18-34  "against AN AI"       THE SPLIT. From f18 a second dot slides out
//             (f21/f34)             from behind the first over 16 frames, the two
//                                   opening to +/- 72.1 world px either side of
//                                   the path, symmetric about it, so the path
//                                   stays the midline and the pair is fully apart
//                                   as "AI" lands (f34). They are AT THE SAME
//                                   HEIGHT: see THE SPLIT IS HORIZONTAL below.
//
//  3. f38-46  "EQUALLY STRONG"      THE CONNECTOR. A white line at INK_LO on the
//             (f43/f50)             level line's half stroke draws between the
//                                   two dots over 8 frames, from the original
//                                   toward the twin, finished f46 — four frames
//                                   ahead of "strong" (f50). It is the pair's
//                                   LEVEL LINE: the same kind of line the model
//                                   has, white instead of accent, and the lock
//                                   that says the two are equally strong.
//
//  MECHANISM (whole cut): a rung flips WHEN THE PAIR'S REACH LINE PASSES ITS
//  CENTRE, solved from the dots' own position every frame and never from a frame
//  number — see `challengeShared.pairReachY`. Before the split that line is the
//  single dot's leading edge (cut 2's rule exactly); after it, it is the
//  connector (the column's own `solvedAt` exactly). Rungs turn over at f1.60 and
//  f14.33 under the old rule, then at f33.50 (ON "AI"), f46.06 (as the connector
//  finishes), f59.71 and f71.42 under the new one; a fresh `?` fades in ahead at
//  f8.98, f21.64, f34.15, f47.81, f59.52 and f71.73. The ladder is always one
//  ahead and the last frame of the cut still has one turning over.
//
//  AMBIENT: the two rails growing behind the pair, each ring's own <= 3 px drift
//  on its own two periods, the grid's parallax and -0.3 px/frame drift, the
//  camera's `sway`, and a zoom that is still creeping in on the last frame
//  (k 1.737 at the landing, 1.926 at f76). THE CUT DOES NOT RESOLVE.
//
// ---------------------------------------------------------------------------
// THE ORANGE — the brief's ambient note, mostly met, with the residue measured.
//
// The brief reads "no orange (our model is off-frame after the push-in)". THE
// MARK DOES LEAVE: its last frame in shot is f15, inside the push-in, and it
// never returns. What does not fully leave is the model's LEVEL LINE, because
// LEVEL_HALF_LEN is 470 world px either side of COLUMN.x — it runs out to world
// x 1010, which is exactly where cut 2 put its climbers, so some of it is in
// shot whenever a climber is. Measured on the resolved cut: 564 screen px of it
// at f0, 494 at f34, 533 at f50, 639 at f76 — but its screen y sinks 420 -> 670
// -> 1046 -> 1391 -> 1814 as the pair climbs away from it, so from the split on
// it is below the pair, under the caption band by f50 and effectively off the
// bottom edge by the end. It reads as the level we are leaving behind, which is
// what it is.
//
// The residue cannot be framed out. For none of the line's SOLID span (world x
// 188..892) to be in shot the frame's left edge must clear x 892, i.e.
// cx > 892 + 540/k — at k 1.9 that is cx > 1176, while the pair it is tracking
// sits at x 1055 -> 901 and would leave the frame. Zooming tighter does not do
// it either: putting the line below the bottom edge at f34 needs k > 2.6, at
// which the fastest in-frame rung breaks the 45 px/f cap. Choosing c2 over c3 is
// what took it from cutting across the pair's own height (screen y 748 at f34,
// 904 px of it at f76) to sinking away underneath, and that was the better lever
// than either framing or zoom.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic.
//
//  * THE PUSH-IN STARTS AT k 0.847, NOT THE BRIEF'S 1.0. That is simply where
//    cut 2 resolved (its contrast shot is k 0.850 at cx 913, drifting), and f0
//    here is cut 2's frame 195, so the opening framing is not a choice. The
//    glide is therefore 0.847 -> 1.9, a 2.24x push rather than 1.9x.
//
//  * THE GLIDE RUNS 30 FRAMES AND IS SMOOTHED AT sigma 11, not cut 2's 7.5. At
//    the set's own smoothing the push-in measured |dv| 2.61 screen px/f^2
//    against the 2.5 ceiling, and swung an in-frame rung at 46.3 screen px/f
//    against the 45 cap — both the cost of the bigger zoom above. Rounding the
//    target's curvature (and warping it early, 0.60) fixes both without
//    re-keying: |dv| 1.61, fastest in-frame rung 43.66 at f24, peak screen speed
//    of a fixed point 40.07, and the minimum mean speed RISING to 7.84 px/f, so
//    the frame is never parked.
//    The landing sits at f30, four frames ahead of "AI" (f34) — inside the set's
//    own "settle 4-10 frames before the word".
//
//  * THE SUBJECT IS c2, and the brief's "the camera glide may find the next one
//    entering from below" is not used: c2 is already in frame at f0 (screen 671,
//    516) and needs no finding. See THE JOIN for the scoring.
//
//  * RUNGS FLIP BEFORE THE CONNECTOR EXISTS (f1.60 and f14.33 under cut 2's own
//    rule, and f33.50 as the pair finishes opening). The brief asks for a flip
//    "somewhere in f52-66"; f59.71 is that one. The others are cut 2's ladder
//    still running, which is the honest picture — the climb does not stop while
//    the pair is forming — and the rule that flips them is the same one
//    continuous statement throughout.
// ---------------------------------------------------------------------------

export const DURATION = 77;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  beats: z.object({
    youre: z.number(),
    always: z.number(),
    playing: z.number(),
    against: z.number(),
    an: z.number(),
    ai: z.number(),
    thats: z.number(),
    equally: z.number(),
    strong: z.number(),
    end: z.number(), // speech ends; the tail runs to 77
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  beats: {
    youre: 0,
    always: 1,
    playing: 7,
    against: 13,
    an: 21,
    ai: 34,
    thats: 37,
    equally: 43,
    strong: 50,
    end: 61,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
/** Frames of pre-roll: the camera is already moving at f0. */
const PRE = 40;
const FIRST = -PRE;

// ---------------------------------------------------------------------------
// THE JOIN. f0 here is cut 2's frame `OFF`, taken off the two SRT in-points.
// ---------------------------------------------------------------------------
/** round((19.300 - 11.160) * 24) = 195 — cut 2's speech-end 139 plus the 56
 *  unshown frames. Derived from the SRT, so cut 2 re-timing cannot move it. */
const OFF = Math.round((19.3 - 11.16) * FPS);
/** A cut-3 frame in the CLIMBERS' own clock. */
const cf = (f: number) => f + OFF;

/** THE SUBJECT: c2, the middle path of cut 2's fan. */
const SUBJECT_I = 1;
const SUB = CLIMBERS[SUBJECT_I];
/** Where cut 2's arithmetic puts it on this cut's first frame:
 *  `climberAt(CLIMBERS[1], 195)`, to the digit. */
const SUBJECT_AT_F0 = { x: 1055.4320245428696, y: 467.29626482026083 };

(() => {
  if (SUB.id !== "c2") {
    throw new Error(`EquallyStrong: the subject moved — CLIMBERS[${SUBJECT_I}] is ${SUB.id}.`);
  }
  const p = climberAt(SUB, cf(0));
  if (Math.abs(p.x - SUBJECT_AT_F0.x) > 1e-6 || Math.abs(p.y - SUBJECT_AT_F0.y) > 1e-6) {
    throw new Error(
      `EquallyStrong: the join drifted — ${SUB.id} is at (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) ` +
        `on cut 2's frame ${OFF}, not (${SUBJECT_AT_F0.x}, ${SUBJECT_AT_F0.y}).`,
    );
  }
  if (!(cf(0) > SUB.born)) {
    throw new Error(`EquallyStrong: ${SUB.id} is not born yet at f0 (born ${SUB.born}).`);
  }
})();

// ---------------------------------------------------------------------------
// THE MODEL'S CLIMB — cut 2's own velocity track, continued. Its constants are
// repeated here rather than imported because `SamePath`'s module-scope collision
// proofs cost seconds of build time and this file needs nothing else from it;
// the numbers are asserted against cut 2's published values below.
// ---------------------------------------------------------------------------
const HISTORY = -400; // in CUT 2's clock
const C2_LAST = OFF + LAST + 2;
const GAP = 80;
const Y_CUT1_END = 467.536905;
const FLIP_RING = 3;
const FLIP_F = 35;

const VEL_KNOTS: [number, number][] = [
  [-400, 1.824],
  [-200, 1.363],
  [-120, 1.133],
  [-GAP, 0.96],
  [-66, 0.63],
  [-50, 0.5],
  [-28, 0.4],
  [0, 0.372],
  [40, 0.37],
  [90, 0.37],
  [155, 0.368],
  [300, 0.366],
];

const vBase = hermite(
  VEL_KNOTS.map((p) => p[0]),
  VEL_KNOTS.map((p) => p[1]),
);

const SUBSTEP = 4;
const RAW_I: number[] = (() => {
  const n = C2_LAST + 2 - HISTORY;
  const out: number[] = new Array(n);
  let acc = 0;
  out[0] = 0;
  for (let f = HISTORY; f < C2_LAST + 1; f++) {
    for (let s = 0; s < SUBSTEP; s++) {
      const a = f + s / SUBSTEP;
      acc += ((vBase(a) + vBase(a + 1 / SUBSTEP)) / 2) * (1 / SUBSTEP);
    }
    out[f + 1 - HISTORY] = acc;
  }
  return out;
})();
const rawAt = (f: number) =>
  RAW_I[Math.max(0, Math.min(RAW_I.length - 1, Math.round(f) - HISTORY))];
const rawSpan = (a: number, b: number) => rawAt(b) - rawAt(a);

const V_SCALE = (Y_CUT1_END - QUESTIONS[FLIP_RING].y) / rawSpan(-GAP, FLIP_F);
const Y_START_C2 = QUESTIONS[FLIP_RING].y + V_SCALE * rawSpan(0, FLIP_F);

/** The mark's height, and the LEVEL LINE's: one y drives both. Cut-3 clock. */
const modelY = (f: number) => Y_START_C2 - V_SCALE * rawSpan(0, cf(f));
const modelV = (f: number) => modelY(f - 1) - modelY(f);

// The climb continues cut 2's exactly: its own published end state.
(() => {
  const y0 = Y_START_C2 - V_SCALE * rawSpan(0, -GAP);
  if (Math.abs(y0 - Y_CUT1_END) > 1e-3) {
    throw new Error(`EquallyStrong: the climb does not leave cut 1 at ${Y_CUT1_END} (got ${y0}).`);
  }
  // cut 2's own last frame (its f154) as published in its commit: y 386.0
  const c2End = Y_START_C2 - V_SCALE * rawSpan(0, 154);
  if (Math.abs(c2End - 386.0) > 0.6) {
    throw new Error(`EquallyStrong: cut 2's last frame reads y ${c2End.toFixed(2)}, not 386.0.`);
  }
  for (let f = FIRST; f <= LAST; f++) {
    if (!(modelV(f) > 0.25)) {
      throw new Error(`EquallyStrong: the creep falls to ${modelV(f).toFixed(4)} at f${f}.`);
    }
  }
})();

// ---------------------------------------------------------------------------
// THE COLUMN — cut 1's mechanism, run over a history long enough that every ring
// the model has already answered is answered here by the same rule.
// ---------------------------------------------------------------------------
const SOLVER = makeSolver(modelY, HISTORY - OFF, LAST + 2);

const gatherSoftMax = (a: number, b: number, e: number) => 0.5 * (a + b + Math.hypot(a - b, e));
const GATHER_KNEE = 14;
const CLEAR_PAD = 6;

const gatherBlocks = (i: number, j: number) => {
  const a = QUESTIONS[i];
  const b = QUESTIONS[j];
  const reach = a.r + b.r + CLEAR_PAD;
  const dy = Math.abs(a.y - b.y);
  if (dy >= reach) return false;
  const h = Math.sqrt(reach * reach - dy * dy);
  return b.x >= Math.min(a.x, GATHERED[i]) - h && b.x <= Math.max(a.x, GATHERED[i]) + h;
};

const GATHER_START: number[] = QUESTIONS.map((_, i) => {
  let latest = SOLVER.cross[i];
  for (let j = 0; j < QUESTIONS.length; j++) {
    if (j !== i && gatherBlocks(i, j)) latest = Math.max(latest, SOLVER.cross[j]);
  }
  return latest + GATHER_DELAY;
});

const gatherProgress = (f: number, i: number) =>
  smoothstep(clamp01((f - GATHER_START[i]) / gatherDur(QUESTIONS[i].seed)));

const gatherX = (f: number, i: number) => {
  const q = QUESTIONS[i];
  const side = q.x < COLUMN.x ? -1 : 1;
  const want = (lerp(q.x, GATHERED[i], gatherProgress(f, i)) - COLUMN.x) * side;
  const dy = modelY(f) - q.y;
  const rMin = MODEL_EDGE + q.r + GATHER_MARK_PAD;
  const keepOut = Math.sqrt(Math.max(0, rMin * rMin - dy * dy));
  return COLUMN.x + side * gatherSoftMax(want, keepOut, GATHER_KNEE);
};

/** The model's own trail, drawn by cut 2 over its f40-58 and kept: our path has
 *  a bottom end. It is fully drawn for every frame of this cut. */
const MASS_BOTTOM = Math.max(...QUESTIONS.map((q) => q.y + q.r));

/** THE LEVEL LINE SHORTENS AS WE LEAVE IT (director's note on the v3 preview).
 *  At cut 2's full LEVEL_HALF_LEN the line reached out under the OTHER climbers'
 *  rungs — at f50 it ran to screen x 533 across c3's `?` at the lower left, which
 *  reads as if those rungs were being measured against OUR model's level. They
 *  are not: every climber lays its own.
 *
 *  So the line eases from cut 2's own 470 at f0 to LEVEL_HALF_END over the push-in
 *  and then holds. It rides the SAME `glide` curve the camera does, so it is not a
 *  gesture of its own — it is the model's level receding with the mark rather than
 *  something retracting on screen. `glide` has zero slope at f0, so the join with
 *  cut 2's picture is untouched on the first frames, and the line's outer quarter
 *  is a fade to nothing (`LevelLine`'s own LEVEL_FADE), so the end that moves is
 *  the end that is already invisible — the length change cannot be seen happening.
 *
 *  THE END VALUE IS 78, NOT THE NOTE'S 330, AND IT IS SOLVED RATHER THAN CHOSEN.
 *  The note gave both a length (~330) and the test it was meant to pass ("no
 *  bright orange pixel inside the frame after ~f34"), and 330 passes neither:
 *  measured over f30-76 it still leaves 403 screen px of solid line in frame at
 *  f76 and still OVERLAPS c3's ring by 17 screen px there — the very fault the
 *  note is about. The frame's left edge is at world x 619.6 at its tightest
 *  (f76), so the line's solid end (540 + half * 0.875) clears it for half < 90.9
 *  and even its faded tip (540 + half) clears for half < 79.6. 78 therefore puts
 *  NOTHING of the line inside the frame from the push-in on, which is what the
 *  test asks for and what the original brief's "no orange" asked for.
 *    half 470 -> line overlaps c3's ring by 17 px, 639 px visible
 *    half 330 -> overlaps by 17 px, 403 px visible   (the note's value)
 *    half 260 -> clears rings by 62 px, 285 px visible
 *    half  78 -> clears by 326 px, 0 px visible      (CHOSEN)
 *  Nobody ever sees the short line: the mark is off frame from f15 and the line
 *  is out of frame with it. */
const LEVEL_HALF_START = 470; // = challengeShared.LEVEL_HALF_LEN, cut 2's value
const LEVEL_HALF_END = 78;
const levelHalf = (f: number) => lerp(LEVEL_HALF_START, LEVEL_HALF_END, glide(f));

// ---------------------------------------------------------------------------
// THE PAIR
// ---------------------------------------------------------------------------
/** The twin slides out from behind the dot over these frames, so the pair is
 *  fully apart as "AI" lands (f34). */
const SPLIT_F0 = 18;
const SPLIT_F1 = 34;
/** ...and the connector draws over these, finishing four frames ahead of
 *  "strong" (f50). */
const CONN_F0 = 38;
const CONN_F1 = 46;

const split = (f: number) => smoothstep(clamp01((f - SPLIT_F0) / (SPLIT_F1 - SPLIT_F0)));
const connector = (f: number) => smoothstep(clamp01((f - CONN_F0) / (CONN_F1 - CONN_F0)));
/** the same split, in the CLIMBERS' clock, which is what the shared helpers take */
const splitC = (fc2: number) => split(fc2 - OFF);

/** Every climber's ladder over the frames this cut needs. */
const RUNGS = CLIMBERS.map((c) => climberRungs(c, cf(FIRST) - 20, cf(LAST + 2)));

/** THE SUBJECT'S rungs, keyed on the PAIR's reach line rather than on a lone
 *  dot's leading edge. Solved in the climbers' clock and read back in this
 *  cut's. */
/** The walk starts well before this cut so a rung the climber passed back in
 *  cut 2 gets its real crossing rather than being clamped to the first frame.
 *  Anything still clamped there is history the cut never shows mid-flip. */
const PAIR_WALK_F0 = cf(FIRST) - 240;
const PAIR_SOLVER = makePairSolver(SUB, RUNGS[SUBJECT_I], splitC, PAIR_WALK_F0, cf(LAST + 2));
const pairSolved = (f: number, j: number) => PAIR_SOLVER.solved(cf(f), j);
/** ...each crossing as a frame of THIS cut. */
const PAIR_CROSS = PAIR_SOLVER.cross.map((c) => c - OFF);

// The bridge must be exactly cut 2's rule before the split and exactly the
// column's rule after it, and a rung may never flip backwards.
(() => {
  RUNGS[SUBJECT_I].forEach((g, j) => {
    const x = PAIR_CROSS[j];
    if (!Number.isFinite(x)) return;
    // clamped at the walk's own start: flipped so long ago the walk never saw it
    if (x <= PAIR_WALK_F0 - OFF + 1e-6) return;
    if (x <= SPLIT_F0) {
      // before the twin moves, the pair IS cut 2's single dot
      if (Math.abs(x - (g.cross - OFF)) > 1e-6) {
        throw new Error(
          `EquallyStrong: rung ${j} flips at f${x.toFixed(3)} but cut 2's own rule says ` +
            `f${(g.cross - OFF).toFixed(3)}, and the split has not started.`,
        );
      }
    }
    if (x >= SPLIT_F1) {
      // once fully apart, the connector reaches the ring's CENTRE: `solvedAt`
      const ly = climberAt(SUB, cf(x)).y;
      if (Math.abs(ly - g.y) > 0.5 || !solvedAt(ly, g)) {
        throw new Error(
          `EquallyStrong: rung ${j} flips at f${x.toFixed(3)} with the connector at y ` +
            `${ly.toFixed(2)} and the ring at ${g.y.toFixed(2)} — not the column's rule.`,
        );
      }
    }
  });
})();

// ONCE THE PAIR IS APART the two dots must pass EITHER SIDE of every rung, with
// only the connector going through it. (Before the split a single dot passes
// straight through the ring — that is cut 2's own picture, and the reason its
// flip is keyed on the rim rather than the centre.)
(() => {
  for (let f = SPLIT_F1; f <= LAST; f++) {
    const d = pairDots(SUB, cf(f), split(f));
    for (const g of RUNGS[SUBJECT_I]) {
      for (const p of [d.a, d.b]) {
        const gap = Math.hypot(p.x - g.x, p.y - g.y) - CLIMBER_R - g.r;
        if (gap < 0) {
          throw new Error(
            `EquallyStrong: a dot overlaps a rung at f${f} by ${(-gap).toFixed(2)} world px.`,
          );
        }
      }
    }
  }
})();

// ---------------------------------------------------------------------------
// THE CAMERA — one glide out of cut 2's resolved framing into a close tracking
// shot on the pair, then a creep that is still running on the last frame.
//
// `J` is cut 2's own damped camera at its frame 195, measured by replaying its
// published CAM_KNOTS through the shared Hermite/Gaussian/damper chain past its
// own last frame. It is a constant here for the same reason cut 2 kept cut 1's
// end state as one: importing `SamePath` would run its module-scope proofs.
// ---------------------------------------------------------------------------
const J = { k: 0.846866, cx: 909.366, y: 870.378 };
const GLIDE_F1 = 30;
const GLIDE_WARP = 0.6;
const K_CLOSE = 1.9;
/** The creep that keeps the last frame moving. */
const CREEP_K = 0.06;
const CREEP_F1 = GLIDE_F1 + 110;
const CREEP_WARP = 0.8;
/** Frames of the pair's own velocity the camera aims ahead by, so the damper's
 *  steady-state lag is mostly — deliberately not wholly — cancelled and the pair
 *  rides up into its mark rather than being chased. */
const CAM_LEAD = 4.5;
/** sigma of the symmetric Gaussian over the target. 11, not cut 2's 7.5: this
 *  cut's push is 2.24x against cut 2's widest move, and at 7.5 it measured
 *  |dv| 2.61 against the set's 2.5 and swung an in-frame rung at 46.3 screen
 *  px/f against the 45 cap. See DEVIATIONS. */
const CAM_SMOOTH = 13;

const glide = (f: number) => camEase(clamp01(f / GLIDE_F1), GLIDE_WARP);
const trackAt = (f: number) => climberAt(SUB, cf(f) + CAM_LEAD);

const kTargetRaw = (f: number) =>
  lerp(J.k, K_CLOSE, glide(f)) +
  CREEP_K * camEase(clamp01((f - GLIDE_F1) / (CREEP_F1 - GLIDE_F1)), CREEP_WARP);
const xTargetRaw = (f: number) => lerp(J.cx, trackAt(f).x, glide(f));
const yTargetRaw = (f: number) => lerp(J.y, trackAt(f).y, glide(f));

const gauss = (src: (f: number) => number, f: number) => {
  const w = Math.ceil(3 * CAM_SMOOTH);
  let num = 0;
  let den = 0;
  for (let d = -w; d <= w; d++) {
    const g = Math.exp(-(d * d) / (2 * CAM_SMOOTH * CAM_SMOOTH));
    num += g * src(f + d);
    den += g;
  }
  return num / den;
};

const CAM = (() => {
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({
      f: f - FIRST,
      k: gauss(kTargetRaw, f),
      x: gauss(xTargetRaw, f),
      y: gauss(yTargetRaw, f),
    });
  }
  return camKnots3(knots, LAST + 2 - FIRST);
})();

const CAM_AT_F: { cx: number; cy: number; k: number }[] = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCam3(f - FIRST, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: WORLD_W / 2 + (wx - c.cx) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};

// The set's own ceilings, checked at module scope.
(() => {
  const pts: [number, number][] = [
    [900, 300],
    [1100, 600],
    [800, 900],
    [1200, 100],
    [1000, 0],
    [700, 500],
    [1300, 800],
  ];
  for (let f = 2; f <= LAST; f++) {
    for (const [px, py] of pts) {
      const a = screenAt(f - 2, px, py);
      const b = screenAt(f - 1, px, py);
      const c = screenAt(f, px, py);
      const v1 = Math.hypot(b.x - a.x, b.y - a.y);
      const v2 = Math.hypot(c.x - b.x, c.y - b.y);
      if (v2 > SPEED_CAP_SCREEN) {
        throw new Error(`EquallyStrong: the frame moves ${v2.toFixed(1)} px/f at f${f}.`);
      }
      if (Math.abs(v2 - v1) > 2.5) {
        throw new Error(
          `EquallyStrong: camera |dv| ${Math.abs(v2 - v1).toFixed(2)} px/f^2 at f${f}.`,
        );
      }
    }
  }
})();

// ---------------------------------------------------------------------------

const EquallyStrong: React.FC<Props> = ({
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
  const cam = runCam3(frame - FIRST, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const ly = modelY(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
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
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* our own path, with its bottom end — cut 2 drew it, we inherit it */}
            <Trail
              id="chLlmTrail"
              ax={COLUMN.x}
              ay={ly}
              bx={COLUMN.x}
              by={MASS_BOTTOM}
              k={k}
            />
            <LevelLine k={k} y={ly} half={levelHalf(frame)} />
            {QUESTIONS.map((q, i) => {
              const d = ringSway(frame, q.seed);
              return (
                <QuestionRing
                  key={`q${i}`}
                  x={gatherX(frame, i) + d.dx}
                  y={q.y + d.dy}
                  r={q.r}
                  solved={SOLVER.solved(frame, i)}
                  k={k}
                />
              );
            })}
            <ModelMark k={k} y={ly} />
            {CLIMBERS.map((c, ci) =>
              ci === SUBJECT_I ? null : (
                <Climber
                  key={c.id}
                  c={c}
                  rungs={RUNGS[ci]}
                  frame={cf(frame)}
                  k={k}
                  opacity={cf(frame) >= c.born ? 1 : 0}
                />
              ),
            )}
            <RungPair
              c={SUB}
              rungs={RUNGS[SUBJECT_I]}
              frame={cf(frame)}
              split={split(frame)}
              splitFrom={cf(SPLIT_F0)}
              splitOf={splitC}
              connector={connector(frame)}
              solved={(j) => pairSolved(frame, j)}
              k={k}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default EquallyStrong;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  an: defaultProps.beats.an,
  ai: defaultProps.beats.ai,
  equally: defaultProps.beats.equally,
  strong: defaultProps.beats.strong,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the report is read off this.
// ---------------------------------------------------------------------------
export const STATS = {
  duration: DURATION,

  join: {
    cut3F0IsCut2Frame: OFF,
    subject: SUB.id,
    subjectAngle: SUB.angle,
    subjectSpeed: SUB.speed,
    subjectWorldAtF0: [
      Number(climberAt(SUB, cf(0)).x.toFixed(3)),
      Number(climberAt(SUB, cf(0)).y.toFixed(3)),
    ],
    subjectScreenAtF0: [
      Number(screenAt(0, climberAt(SUB, cf(0)).x, climberAt(SUB, cf(0)).y).x.toFixed(1)),
      Number(screenAt(0, climberAt(SUB, cf(0)).x, climberAt(SUB, cf(0)).y).y.toFixed(1)),
    ],
    openingCamera: [J.k, J.cx, J.y],
    modelYAtF0: Number(modelY(0).toFixed(2)),
    modelYAtEnd: Number(modelY(LAST).toFixed(2)),
  },

  split: {
    frames: [SPLIT_F0, SPLIT_F1],
    pairDxWorld: Number(pairDx(SUB).toFixed(2)),
    perpendicularClearance: PAIR_HALF,
    heightDifferenceWorld: 0,
    separationScreenAtF34: Number(
      (
        screenAt(34, pairDots(SUB, cf(34), split(34)).b.x, pairDots(SUB, cf(34), split(34)).b.y).x -
        screenAt(34, pairDots(SUB, cf(34), split(34)).a.x, pairDots(SUB, cf(34), split(34)).a.y).x
      ).toFixed(1),
    ),
    connectorFrames: [CONN_F0, CONN_F1],
  },

  /** Every rung of the subject's ladder: when it lights, when the pair's reach
   *  line passes its centre, and the y of that line at the instant it does. */
  rungs: RUNGS[SUBJECT_I].map((g, j) => ({
    s: Number(g.s.toFixed(1)),
    world: [Number(g.x.toFixed(0)), Number(g.y.toFixed(0))],
    litF: Number((g.lit - OFF).toFixed(2)),
    flipF: Number.isFinite(PAIR_CROSS[j]) ? Number(PAIR_CROSS[j].toFixed(2)) : null,
    reachYAtFlip: Number.isFinite(PAIR_CROSS[j])
      ? Number(climberAt(SUB, cf(PAIR_CROSS[j])).y.toFixed(2))
      : null,
    cut2RimRuleWouldBe: Number((g.cross - OFF).toFixed(2)),
  })).filter((r) => (r.flipF ?? -99) > -20 || r.litF > -20),

  /** The camera: k every 10 frames, and the ceilings. */
  kPer10: (() => {
    const rows: [number, number, number, number][] = [];
    for (let f = 0; f <= LAST; f += 10) {
      const c = camAt(f);
      rows.push([f, Number(c.k.toFixed(4)), Number(c.cx.toFixed(0)), Number(c.cy.toFixed(0))]);
    }
    const c = camAt(LAST);
    rows.push([LAST, Number(c.k.toFixed(4)), Number(c.cx.toFixed(0)), Number(c.cy.toFixed(0))]);
    return rows;
  })(),
  camAudit: (() => {
    const pts: [number, number][] = [
      [900, 300],
      [1100, 600],
      [800, 900],
      [1200, 100],
      [1000, 0],
      [700, 500],
      [1300, 800],
    ];
    let maxV = { f: -1, v: 0 };
    let maxDV = { f: -1, v: 0 };
    let minMean = { f: -1, v: Infinity };
    for (let f = 2; f <= LAST; f++) {
      let sum = 0;
      for (const [px, py] of pts) {
        const a = screenAt(f - 2, px, py);
        const b = screenAt(f - 1, px, py);
        const c = screenAt(f, px, py);
        const v1 = Math.hypot(b.x - a.x, b.y - a.y);
        const v2 = Math.hypot(c.x - b.x, c.y - b.y);
        sum += v2;
        if (v2 > maxV.v) maxV = { f, v: v2 };
        if (Math.abs(v2 - v1) > maxDV.v) maxDV = { f, v: Math.abs(v2 - v1) };
      }
      const mean = sum / pts.length;
      if (mean < minMean.v) minMean = { f, v: mean };
    }
    return {
      maxScreenSpeed: [maxV.f, Number(maxV.v.toFixed(2))],
      maxDV: [maxDV.f, Number(maxDV.v.toFixed(3))],
      minMeanSpeed: [minMean.f, Number(minMean.v.toFixed(3))],
    };
  })(),

  /** The brief's own cap, on the thing it names: the streaming rungs, measured
   *  wherever the camera is tight. */
  fastestRungWhileClose: (() => {
    let worst = { f: -1, v: 0, k: 0 };
    for (let f = 1; f <= LAST; f++) {
      if (kAt(f) < 1.6) continue;
      for (let ci = 0; ci < CLIMBERS.length; ci++) {
        for (const g of RUNGS[ci]) {
          // only ink that is actually LIT and IN FRAME: a rung a thousand px off
          // the edge swings fast under a zoom and is seen by nobody.
          if (cf(f) < g.lit - RUNG_FADE_F) continue;
          const b = screenAt(f, g.x, g.y);
          const rr = (g.r + strokeW(kAt(f)) / 2) * kAt(f);
          if (!(b.x + rr > 0 && b.x - rr < WORLD_W && b.y + rr > 0 && b.y - rr < WORLD_H)) continue;
          const a = screenAt(f - 1, g.x, g.y);
          const v = Math.hypot(b.x - a.x, b.y - a.y);
          if (v > worst.v) worst = { f, v, k: kAt(f) };
        }
      }
    }
    return [worst.f, Number(worst.v.toFixed(2)), `k ${worst.k.toFixed(3)}`, `cap ${SPEED_CAP_SCREEN}`];
  })(),

  /** ORANGE ON SCREEN. The brief asks for none once the push-in has landed: the
   *  model is meant to be behind us. The mark is easy to lose, but the LEVEL
   *  LINE is 940 world px wide and reaches out to x 1010, which is where the
   *  climbers live — so this measures how much of it is actually in frame. */
  orangeOnScreen: [0, 14, 20, 28, 34, 50, LAST].map((f) => {
    const k = kAt(f);
    const m = screenAt(f, COLUMN.x, modelY(f));
    const mr = (MODEL_MARK / 2) * k;
    const markIn = m.x + mr > 0 && m.x - mr < WORLD_W && m.y + mr > 0 && m.y - mr < WORLD_H;
    // the line's SOLID span is +/- half * (1 - LEVEL_FADE/2), and `half` now
    // shortens across the push-in
    const solid = levelHalf(f) * (1 - 0.25 / 2);
    const l0 = screenAt(f, COLUMN.x - solid, modelY(f));
    const l1 = screenAt(f, COLUMN.x + solid, modelY(f));
    const visX = Math.max(0, Math.min(WORLD_W, l1.x) - Math.max(0, l0.x));
    const lineIn = l0.y > 0 && l0.y < WORLD_H && visX > 0;
    return {
      f,
      markOnScreen: markIn ? [Number(m.x.toFixed(0)), Number(m.y.toFixed(0))] : null,
      levelLineVisiblePx: lineIn ? Number(visX.toFixed(0)) : 0,
      levelLineScreenY: Number(l0.y.toFixed(0)),
    };
  }),

  /** Where the pair sits on screen — it should ride into (540, 835) and stay. */
  pairOnScreen: [0, 18, 28, 34, 46, 50, 60, LAST].map((f) => {
    const d = pairDots(SUB, cf(f), split(f));
    const a = screenAt(f, d.a.x, d.a.y);
    const b = screenAt(f, d.b.x, d.b.y);
    return [f, Number(((a.x + b.x) / 2).toFixed(0)), Number(((a.y + b.y) / 2).toFixed(0))];
  }),

  /** ORANGE LEAVES: the last frame the model's mark has any ink on screen. */
  markLastOnScreen: (() => {
    let last = -1;
    for (let f = 0; f <= LAST; f++) {
      const s = screenAt(f, COLUMN.x, modelY(f));
      const r = (MODEL_MARK / 2) * kAt(f);
      if (s.x + r > 0 && s.x - r < WORLD_W && s.y + r > 0 && s.y - r < WORLD_H) last = f;
    }
    return last;
  })(),

  stroke: [0, 28, 50, LAST].map((f) => [
    f,
    Number(strokeScreen(kAt(f)).toFixed(2)),
    Number(((strokeW(kAt(f)) / 2) * kAt(f)).toFixed(2)),
  ]),
  ringPxOnScreen: [0, 34, 50, LAST].map((f) => [f, Number((36 * 2 * kAt(f)).toFixed(1))]),

  /** The close-up's ink, and what else is in it. */
  closeUp: [34, 50, LAST].map((f) => {
    let top = Infinity;
    let bottom = -Infinity;
    let left = Infinity;
    let right = -Infinity;
    const kk = kAt(f);
    const sw = strokeW(kk) / 2;
    const note = (wx: number, wy: number, r: number) => {
      const c = screenAt(f, wx, wy);
      if (c.x < -400 || c.x > WORLD_W + 400) return;
      const rr = (r + sw) * kk;
      top = Math.min(top, c.y - rr);
      bottom = Math.max(bottom, c.y + rr);
      left = Math.min(left, c.x - rr);
      right = Math.max(right, c.x + rr);
    };
    const d = pairDots(SUB, cf(f), split(f));
    note(d.a.x, d.a.y, CLIMBER_R);
    note(d.b.x, d.b.y, CLIMBER_R);
    for (const g of RUNGS[SUBJECT_I]) {
      if (cf(f) < g.lit - RUNG_FADE_F) continue;
      note(g.x, g.y, g.r);
    }
    let others = 0;
    for (let ci = 0; ci < CLIMBERS.length; ci++) {
      if (ci === SUBJECT_I) continue;
      const p = climberAt(CLIMBERS[ci], cf(f));
      const s = screenAt(f, p.x, p.y);
      if (s.x > 0 && s.x < WORLD_W && s.y > 0 && s.y < WORLD_H) others += 1;
      for (const g of RUNGS[ci]) {
        if (cf(f) < g.lit - RUNG_FADE_F) continue;
        const q = screenAt(f, g.x, g.y);
        if (q.x > 0 && q.x < WORLD_W && q.y > 0 && q.y < 1350) others += 1;
      }
    }
    return {
      f,
      k: Number(kk.toFixed(4)),
      inkY: [Number(top.toFixed(0)), Number(bottom.toFixed(0))],
      inkX: [Number(left.toFixed(0)), Number(right.toFixed(0))],
      otherClimberInkInFrame: others,
    };
  }),
};
