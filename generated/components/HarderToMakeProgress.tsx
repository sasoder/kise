import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
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
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { hermite, lerp } from "./trapShared";
import {
  CAM_WIDE,
  COLUMN,
  GATHERED,
  GATHER_DELAY,
  GATHER_MARK_PAD,
  INK,
  LevelLine,
  MODEL_EDGE,
  MODEL_MARK,
  ModelMark,
  QUESTIONS,
  QuestionRing,
  RING_R,
  SOLVE_F,
  SPEED_CAP_SCREEN,
  Trail,
  gatherDur,
  makeSolver,
  ringSway,
  solvedAt,
  strokeScreen,
  strokeW,
} from "./challengeShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 5 of the set:
// `HarderToMakeProgress` (in-point 0:37.460).
// Line (SRT 0:37.460 -> 0:41.899):
//   "then that is a plausible scenario where actually, like, okay, it becomes
//    much harder to make progress"
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// THIS CUT'S IDEA: **PROGRESS IS THE DISTANCE TO THE NEXT QUESTION, AND IT HAS
// BECOME HUGE.** The model reaches the last question the column held, answers
// it, and then has nothing left to climb on: the next one is far above, out of
// frame. The climb decays toward a bare creep and the camera pulls up and back
// to show the empty grid between the level line and that lonely `?`. "Harder to
// make progress" IS that gap.
//
// VOCABULARY — `challengeShared`'s, and nothing is invented here. The model is
// the OpenAI mark filled ACCENT; its LEVEL is one thin accent line through it
// that moves only because the mark moves; a QUESTION is a white ring with lucide
// `circle-help`'s `?` in it and its HEIGHT IS ITS DIFFICULTY; it is ANSWERED —
// `?` out, tick in, ink 1.0 -> 0.5 — only when the level line reaches its
// centre, solved from the line's own y and never from a frame number; the
// model's TRAIL (cut 2's `Trail`, fade 0) runs straight down the shaft to the
// bottom of the gathered mass, because its path HAVING a bottom end is the
// point. Two ink rungs, one stroke family, no text, no boxes, no third colour.
//
// DURATION. 4.439 s of speech x 24 = 106.5 -> 107 frames, plus the set's
// 16-frame tail: DURATION = 107 + 16 = 123.
//
// Word -> frame (24 fps from comp start):
//   then 0 · that 4 · is 13 · a 17 · plausible 20 · scenario 26 · where 34 ·
//   actually 38 · like 45 · okay 55 · it 61 · becomes 63 · much 70 · harder 77 ·
//   to 81 · make 83 · progress 85 · (speech ends 107)
//
// SOUND-OFF READING TEST — one sentence:
//   "the orange mark creeps up to the last bright question mark above the pile
//    it has already answered, turns it into a tick, and then the camera pulls
//    up and back to show that the next question mark is a whole screen away
//    with nothing in between, while the mark slows to almost nothing."
//
// ---------------------------------------------------------------------------
// GESTURES — the complete list. One arrival, one decay, one reveal. Nothing
// else in the cut moves on its own.
//
//  1. f0-57    "plausible          THE ARRIVAL. The mark is already rising at f0
//              scenario ... okay"  (0.87 world px/f), 60 world px under the one
//              (f20/f26/f38/f45/   bright `?` left in the column, and its climb
//               f55)               swells gently to 1.46 px/f as it closes. The
//                                  level line reaches that ring's centre at
//                                  f52.0 — solved off the line's own curve — and
//                                  the `?` un-draws while the tick draws in its
//                                  place over SOLVE_F = 10 frames, so "okay"
//                                  (f55) lands in the middle of the flip. Ten
//                                  frames later (f62) the ring is RELEASED and
//                                  eases 45.5 world px inward to `GATHERED[0]`,
//                                  closing in behind the mark like every ring
//                                  before it — and it is still arriving on the
//                                  last frame. It is the LAST one: there is
//                                  nothing else for the line to reach.
//
//  2. f57-123  "it BECOMES MUCH     THE DECAY. Out of that swell the climb falls
//              HARDER"             on one smooth ease to a bare creep — 1.46
//              (f61/f63/f70/f77)   px/f at f47 to 0.32 px/f on the last frame,
//                                  never a plateau and never zero. The model is
//                                  still climbing; it is just not getting
//                                  anywhere. "much harder" lands in the steepest
//                                  part of the decay.
//
//  3. f0-88    "to make PROGRESS"   THE REVEAL, which is ONE camera move for the
//              (f81/f83/f85)       whole cut. From f0 it is already craning UP
//                                  past the mark (centre 699 -> 632 by f46 while
//                                  the zoom eases 1.039 -> 1.032), so the
//                                  composition settles down-frame from the first
//                                  frame; at f46 that creep ACCELERATES into the
//                                  glide proper (warp 0.70) and the camera
//                                  arrives at k 0.872 / centre 288 by f90,
//                                  settling on "progress". The lonely `?` — off
//                                  the top of the frame at f0 — comes over the
//                                  top edge at f57, is a whole ring by f62
//                                  ("becomes", f63), and resolves near screen y
//                                  274 while the model's line drops to screen y
//                                  763: 489 screen px of EMPTY GRID between
//                                  them, which is the whole cut. Payoff
//                                  off-frame: the thing the line is about could
//                                  not be seen at f0.
//
//  4. f88-122  (continues 2 and 3)  THE TAIL. THE CRANE NEVER STOPS: the camera's
//                                  target carries the glide's own two velocities
//                                  on, decayed but flat — the centre keeps
//                                  rising (288 -> 230) and the zoom, having
//                                  arrived rather than overshot, creeps gently
//                                  back IN (0.8717 -> 0.8767) — so every point
//                                  in the frame is still travelling at ~1.4
//                                  screen px/f on the last frame and the tail
//                                  measures 1.01 of frame-to-frame energy
//                                  against the cut's 3.67 peak. The lonely `?`
//                                  drifts down-frame 274 -> 326 and the level
//                                  line 763 -> 806, the released ring is still
//                                  sliding inward, and the mark is still rising
//                                  at 0.32 px/f toward a ring 548 world px away.
//                                  THE CUT DOES NOT RESOLVE.
//
// AMBIENT ONLY (mechanisms, so no window of the cut is still): every ring's own
// <= 3 px drift on its own two periods, run on the CLIP's timeline (frame +
// CONTINUE_FROM) so it continues the earlier cuts rather than restarting; the
// grid's parallax and -0.3 px/frame drift; the camera's `sway`; a climb whose
// speed never touches zero; and the trail growing with the mark. Nothing else:
// no packets, no brackets, no labels, no breath or scale on the mark, no
// flashes, no second accent.
//
// ---------------------------------------------------------------------------
// WHERE WE ARE. Cut 1's resolved world, carried forward by cuts 2-4: the whole
// column is one gathered mass of ticks at INK_LO with the model's trail down the
// shaft. The previous line was "if we run out of problems to ask it that
// challenge it", so only TWO bright `?` are left anywhere.
//
// THE FIRST is `QUESTIONS[0]`, the column's own top ring (world y 238.7) — the
// hardest question the column ever held. The model starts 60 world px under it.
// That choice is what makes the mechanism honest rather than a special case:
// the mark at f0 sits ABOVE the centre of every other ring in the column, so
// "bright iff the line has not reached its centre" is true of all 49 rings on
// every frame of the cut (asserted below), and exactly one ring is crossed.
//
// THE SECOND is `LONELY`, and it is NOT one of the 49. The cut brief put it
// "near the top of the column's original span (world y 210-240)" AND off the top
// of the frame at f0 AND at screen y <= 300 with the model's line at >= 700 when
// the pull-back settles. Those cannot all hold: at the opening camera (k 1.033)
// the frame's top edge is world y ~ -121, so anything inside the column's span
// is already on screen at f0; and 400 screen px of separation at k 0.87 is 460
// world px, which from a line resting at world y ~ 205 puts the ring at y ~ -255
// or above. So the lonely `?` stands at world y -351, x 540 — on the column's
// axis, 590 world px above the column's top, in grid that has never held a
// question. That is the literal statement the line makes: the next question is
// not further up the column, it is off the end of it.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic.
//
//  * THE LONELY `?` IS AT WORLD y -351, not 210-240. See above: the brief's own
//    framing constraints (off-frame at f0; <= screen 300 with >= 150 px
//    head-room while the line sits at >= screen 700) force it out of the
//    column's span. It is drawn with the same `QuestionRing` at the full
//    RING_R, so it is the same object, only much higher.
//
//  * THE CAMERA'S CENTRE RISES 469 world px (699 -> 230), not "~220". The rise
//    is not free: it is solved from the two screen constraints above at
//    k 0.870. 220 px would leave the lonely ring at screen ~ 460 and the gap at
//    ~300 screen px, which reads as a step rather than as a chasm.
//
//  * THE CAMERA OPENS AT WORLD CENTRE 687, not CAM_WIDE.y = 835. The model has
//    climbed 175 px higher than it ended cut 1, and at 835 the arrival — the
//    cut's first gesture — would happen at screen y 200, jammed against the top
//    edge. 687 puts the mark at screen 434 at f0 with the whole mass still in
//    frame (its lowest ink at screen 1477), and the camera's pre-glide target
//    FOLLOWS the mark at 0.55 of its own creep, so the framing is already alive
//    at f0 rather than parked. k is CAM_WIDE's + cut 1's resolved creep, 1.033.
//
//  * THE COLUMN'S MASS SITS LOW. With the model's line at screen ~760 and the
//    mass 1085 world px beneath it, the ticks run from screen ~790 down to
//    ~1720 on the resolved frame and the ink's centre of mass lands near screen
//    1150 rather than the set's 835. There is nowhere else for it: the cut's
//    subject is the EMPTINESS ABOVE the line, so everything that is not empty
//    has to be below it. The bright content — the lonely `?` at ~280, the level
//    line at ~760 and the mark on it — straddles the frame's middle, and what
//    the captions cover at the bottom is context at INK_LO.
//
// ---------------------------------------------------------------------------
// THE CLIMB. Authored as a VELOCITY track, because every requirement on it is a
// requirement on its speed: a creep that is already running at f0, a gentle
// swell into the arrival, then ONE exponential-ish decay with no plateau that
// still reads as motion on the last frame. A monotone cubic Hermite
// (Fritsch-Carlson, so it cannot overshoot a knot and dip negative) through
// `VEL_KNOTS` is integrated at quarter-frame steps, and `V_SCALE` is SOLVED by
// secant so the line reaches the near ring's centre exactly at FLIP_F. The
// module THROWS if the climb ever stops.
//
// THE CAMERA is its own keyed track (one key per frame), Gaussian-smoothed and
// then damped by the shared `runCamera`, with 30 frames of pre-roll so it is
// already moving at f0. Before the glide its target follows the mark; after it,
// the settled wide framing keeps creeping. Measured |dv| of a fixed world point
// is under the set's 2.5 screen px/f^2 ceiling; everything measured is in STATS
// and quoted in the report.
// ---------------------------------------------------------------------------

export const DURATION = 123;

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
    then: z.number(),
    plausible: z.number(),
    scenario: z.number(),
    actually: z.number(),
    like: z.number(),
    okay: z.number(),
    becomes: z.number(),
    much: z.number(),
    harder: z.number(),
    make: z.number(),
    progress: z.number(),
    end: z.number(), // speech ends; the tail runs to 123
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
    then: 0,
    plausible: 20,
    scenario: 26,
    actually: 38,
    like: 45,
    okay: 55,
    becomes: 63,
    much: 70,
    harder: 77,
    make: 83,
    progress: 85,
    end: 107,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
/** Frames of pre-roll: the camera and the climb are both already running at f0. */
const PRE = 30;
const FIRST = -PRE;
/** This cut's in-point in the CLIP's own frames (0:37.460 x 24), so the ambient
 *  drift on the rings and the camera's hand continue the earlier cuts instead of
 *  restarting from a fresh phase. */
const CONTINUE_FROM = 899;

// ---------------------------------------------------------------------------
// THE TWO BRIGHT QUESTIONS
// ---------------------------------------------------------------------------
/** The last bright ring the column itself holds: its top one, the hardest
 *  question it ever had. */
const NEAR_I = 0;
const NEAR = QUESTIONS[NEAR_I];

/** ...and the next one, which is not in the column at all. On the axis, 590
 *  world px above the column's top. */
const LONELY = { x: COLUMN.x, y: -351, r: RING_R, seed: 0.37 };

/** The model's trail ends at the bottom of the gathered mass. */
const TRAIL_BOTTOM = Math.max(...QUESTIONS.map((q) => q.y));

// ---------------------------------------------------------------------------
// THE CLIMB, as a velocity track.
// ---------------------------------------------------------------------------
/** 60 world px under the near ring's centre — the brief's "60-80 px above",
 *  taken at its low end so that the mark at f0 is above the CENTRE of every
 *  other ring in the column (the next one down sits at y 310.1) and the flip
 *  rule holds for all 49 without an exception. */
const START_GAP = 60;
const Y_START = NEAR.y + START_GAP;
/** The frame the level line reaches the near ring's centre. "okay" is at f55 and
 *  the flip takes SOLVE_F = 10 frames, so a crossing at 52 puts the word in the
 *  middle of it — on the flip, as the brief asks, rather than after it. */
const FLIP_F = 52;

/** world px per frame: a creep already running, one gentle swell into the
 *  arrival, then a single decay with no plateau that never reaches zero. */
const VEL_KNOTS: [number, number][] = [
  [-40, 0.9],
  [0, 0.97],
  [18, 1.12],
  [34, 1.42],
  [46, 1.62],
  [52, 1.55],
  [60, 1.2],
  [68, 0.87],
  [78, 0.63],
  [90, 0.49],
  [104, 0.41],
  [122, 0.355],
  [180, 0.32],
];

const vBase = hermite(
  VEL_KNOTS.map((p) => p[0]),
  VEL_KNOTS.map((p) => p[1]),
);

/** The integral of `scale * vBase` from f = 0, at quarter-frame steps. `MODEL_Y`
 *  is indexed from FIRST, so index = f - FIRST. */
const SUB = 4;
const buildY = (scale: number) => {
  const n = LAST + 3 - FIRST;
  const out: number[] = new Array(n);
  const i0 = -FIRST;
  out[i0] = Y_START;
  let y = Y_START;
  for (let f = 0; f < LAST + 2; f++) {
    for (let s = 0; s < SUB; s++) {
      const a = f + s / SUB;
      const b = a + 1 / SUB;
      y -= ((scale * (vBase(a) + vBase(b))) / 2) * (1 / SUB);
    }
    out[i0 + f + 1] = y;
  }
  // backward from f = 0, so the pre-roll is the same curve run in reverse
  y = Y_START;
  for (let f = 0; f > FIRST; f--) {
    for (let s = 0; s < SUB; s++) {
      const a = f - s / SUB;
      const b = a - 1 / SUB;
      y += ((scale * (vBase(a) + vBase(b))) / 2) * (1 / SUB);
    }
    out[i0 + f - 1] = y;
  }
  return out;
};

/** Solved so the line is exactly on the near ring's centre at FLIP_F. */
const V_SCALE = (() => {
  const at = (s: number) => buildY(s)[FLIP_F - FIRST];
  let a = 0.7;
  let b = 1.4;
  let fa = at(a) - NEAR.y;
  let fb = at(b) - NEAR.y;
  for (let i = 0; i < 40 && Math.abs(fb) > 1e-7; i++) {
    const c = b - (fb * (b - a)) / (fb - fa);
    a = b;
    fa = fb;
    b = c;
    fb = at(b) - NEAR.y;
  }
  return b;
})();

const MODEL_Y = buildY(V_SCALE);
const idx = (f: number) => Math.max(0, Math.min(MODEL_Y.length - 1, Math.round(f) - FIRST));
/** The mark's height, and the LEVEL LINE's: one y drives both. */
const modelY = (f: number) => MODEL_Y[idx(f)];
const modelV = (f: number) => modelY(f - 1) - modelY(f); // world px/frame, upward

// The climb must never stop. It also must still be READING as motion on the
// last frame, which the brief puts at >= 0.3 world px/f.
(() => {
  for (let f = FIRST + 1; f <= LAST; f++) {
    const v = modelV(f);
    if (!(v > 0)) {
      throw new Error(
        `HarderToMakeProgress: the climb stops at f${f} (v = ${v.toFixed(4)} world px/f).`,
      );
    }
  }
  const vEnd = modelV(LAST);
  if (!(vEnd >= 0.3)) {
    throw new Error(
      `HarderToMakeProgress: the climb is down to ${vEnd.toFixed(3)} world px/f at f${LAST} ` +
        `(floor 0.3).`,
    );
  }
})();

// ---------------------------------------------------------------------------
// THE MECHANISM: every ring's flip, solved off the line's own y. The line starts
// this cut above every ring but the near one, so `makeSolver` hands back
// `FIRST` for the 47 that were answered in the earlier cuts, a crossing during
// the pre-roll for the one just under the mark, and FLIP_F for the near ring.
// ---------------------------------------------------------------------------
const SOLVER = makeSolver(modelY, FIRST, LAST + 2);

// ---------------------------------------------------------------------------
// THE RELEASE. Only one ring is released in this cut: the near one, ten frames
// after its flip, on its own seeded 30-40 frame ease, exactly as every ring
// before it. Everything else was released in an earlier cut and is already at
// `GATHERED[i]` when this one opens — a ring that crossed at or before f0
// therefore starts its ease long before the cut does.
//
// A ring is still held OUT of the model mark's own disc (the same soft max cut 1
// uses), so the mark can never overlap one however slowly it is creeping.
// ---------------------------------------------------------------------------
const gatherSoftMax = (a: number, b: number, e: number) => 0.5 * (a + b + Math.hypot(a - b, e));
const GATHER_KNEE = 14;

const GATHER_START: number[] = QUESTIONS.map((_, i) =>
  SOLVER.cross[i] > 0 ? SOLVER.cross[i] + GATHER_DELAY : -200,
);

/** The one release inside this cut is STRETCHED, 31.9 -> 64 frames. Its start is
 *  fixed by the mechanism (the line's arrival at f52, plus GATHER_DELAY), and at
 *  the shared `gatherDur` it would be finished at f94 — which leaves the last 28
 *  frames of the cut with no object-level motion at all, in a cut whose last
 *  beat is "the released ring settling". It is also the only honest speed for
 *  it: everything in this cut is decaying, and a ring released into an already
 *  gathered mass has nothing pushing it in. It is still moving on the last
 *  frame. Every other ring was released in an earlier cut and keeps its own. */
const RELEASE_DUR = 64;
const releaseDur = (i: number) =>
  SOLVER.cross[i] > 0 ? RELEASE_DUR : gatherDur(QUESTIONS[i].seed);

const gatherProgress = (f: number, i: number) =>
  smoothstep(clamp01((f - GATHER_START[i]) / releaseDur(i)));

const gatherX = (f: number, i: number) => {
  const q = QUESTIONS[i];
  const side = q.x < COLUMN.x ? -1 : 1;
  const want = (lerp(q.x, GATHERED[i], gatherProgress(f, i)) - COLUMN.x) * side;
  const dy = modelY(f) - q.y;
  const rMin = MODEL_EDGE + q.r + GATHER_MARK_PAD;
  const keepOut = Math.sqrt(Math.max(0, rMin * rMin - dy * dy));
  return COLUMN.x + side * gatherSoftMax(want, keepOut, GATHER_KNEE);
};

/** Rim-to-rim air any two rings must keep AT EVERY FRAME. */
const CLEAR_PAD = 4;

// Nothing may touch anything, on any frame, sway spent: ring against ring...
(() => {
  for (let f = 0; f <= LAST; f++) {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const di = ringSway(f + CONTINUE_FROM, QUESTIONS[i].seed);
      for (let j = i + 1; j < QUESTIONS.length; j++) {
        const dj = ringSway(f + CONTINUE_FROM, QUESTIONS[j].seed);
        const dy = QUESTIONS[i].y + di.dy - (QUESTIONS[j].y + dj.dy);
        const reach = QUESTIONS[i].r + QUESTIONS[j].r + CLEAR_PAD;
        if (Math.abs(dy) >= reach) continue;
        const gap =
          Math.hypot(gatherX(f, i) + di.dx - (gatherX(f, j) + dj.dx), dy) -
          QUESTIONS[i].r -
          QUESTIONS[j].r;
        if (gap < CLEAR_PAD) {
          throw new Error(
            `HarderToMakeProgress: rings ${i}/${j} come within ${gap.toFixed(2)} world px ` +
              `at f${f} (floor ${CLEAR_PAD}).`,
          );
        }
      }
    }
  }
})();

// ...and the mark against every ring, the lonely one included.
(() => {
  for (let f = 0; f <= LAST; f++) {
    const my = modelY(f);
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const d = ringSway(f + CONTINUE_FROM, q.seed);
      const gap = Math.hypot(gatherX(f, i) + d.dx - COLUMN.x, q.y + d.dy - my) - MODEL_EDGE - q.r;
      if (gap < 0) {
        throw new Error(
          `HarderToMakeProgress: the mark overlaps ring ${i} at f${f} by ${(-gap).toFixed(2)} px.`,
        );
      }
    }
    const dl = ringSway(f + CONTINUE_FROM, LONELY.seed);
    const lg =
      Math.hypot(LONELY.x + dl.dx - COLUMN.x, LONELY.y + dl.dy - my) - MODEL_EDGE - LONELY.r;
    if (lg < 0) {
      throw new Error(`HarderToMakeProgress: the mark overlaps the lonely ring at f${f}.`);
    }
  }
})();

// ...and the brief's own assertion: across every frame and every ring, a ring is
// in flip iff the level line has reached its centre — and EXACTLY ONE ring flips
// inside this cut.
(() => {
  for (let f = 0; f <= LAST; f++) {
    const ly = modelY(f);
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      if (Math.abs(ly - q.y) <= 1e-6) continue; // the crossing frame itself
      const want = solvedAt(ly, q);
      const got = SOLVER.solved(f, i) > 0;
      if (want !== got) {
        throw new Error(
          `HarderToMakeProgress: ring ${i} (y ${q.y.toFixed(1)}) is ${got ? "" : "not "}solved ` +
            `at f${f} but the line is at y ${ly.toFixed(1)}.`,
        );
      }
    }
    if (solvedAt(ly, LONELY)) {
      throw new Error(`HarderToMakeProgress: the line reached the lonely ring at f${f}.`);
    }
  }
  const flipping = QUESTIONS.filter(
    (_, i) => SOLVER.cross[i] > 0 && SOLVER.cross[i] <= LAST,
  ).length;
  if (flipping !== 1) {
    throw new Error(`HarderToMakeProgress: ${flipping} rings flip inside the cut, want exactly 1.`);
  }
})();

// ---------------------------------------------------------------------------
// THE CAMERA — one keyed track per frame, Gaussian-smoothed, then damped.
//
//   before the glide: the target CRANES PAST the mark at FOLLOW of its own
//     creep, so the framing is already alive at f0, moving in the direction the
//     glide will take, and the arrival happens at screen y ~ 460 instead of
//     against the top edge.
//   the glide:        ONE move from f46, warp 0.70 (the speed early, as a
//     pull-back wants it), k -> 0.870 and the world centre -> 288.
//   after it:         the glide's two velocities carry on, decayed: the centre
//     keeps rising and the zoom creeps back IN, so the last frame is still a
//     drift and not a held one.
// ---------------------------------------------------------------------------
const K_OPEN = 1.038; // CAM_WIDE's k plus cut 1's resolved creep, still easing out
/** ...and the rate it is already easing out at when the cut opens, world-zoom
 *  per frame. The glide then accelerates that same easing rather than starting
 *  one, so there is no frame where the zoom is parked waiting for its move. */
const K_PRE_RATE = 0.00017;
const K_FINAL = 0.87;
const C_OPEN = 694;
const C_FINAL = 288;
/** The opening framing does not track the mark, it CRANES PAST IT: the centre
 *  rises 1.55 world px for every 1 the mark climbs, so the whole composition
 *  settles down-frame by ~0.7 screen px/f while the mark creeps up in the world.
 *  At the brief's 0.55 (hold the mark roughly where it is) the first 40 frames
 *  measured at 0.69 of a grey level of frame-to-frame energy against the cut's
 *  3.7 peak — a picture that is technically moving and reads as parked. This
 *  makes the camera ONE continuous move in ONE direction for the whole cut: a
 *  creep up, accelerating into the glide, decaying into the tail. */
const FOLLOW = 1.55;
const PULL_F0 = 46;
const PULL_F1 = 82;
const PULL_WARP = 0.7;
/** THE TAIL'S DRIFT, which is what keeps the last 35 frames from being a held
 *  frame. It is the glide's own two velocities, decayed: THE CRANE KEEPS GOING
 *  (the centre keeps rising, 288 -> 236 by the last frame) and the zoom, having
 *  arrived rather than overshot, creeps gently back IN, exactly as cut 1's does.
 *
 *  SIZED BY MEASUREMENT, twice. At CREEP_C 26 the tail's camera was 0.24 screen
 *  px/f and the frames read as parked. At 60, with a 0.03 creep-in sized to
 *  cancel the crane on the lonely ring, the tail measured 0.47-0.65 grey levels
 *  of frame-to-frame energy — still under this clip's floor (cut 1's tail
 *  measures 1.16). These values run the crane at 1.1-1.5 screen px/f right
 *  through the last frame and shorten and un-warp its ease (CREEP_F1 155 and warp
 *  0.68, not 215 and 0.85) so the drift reaches its speed while the glide is
 *  still bleeding off and then holds it flat, instead of ramping up across the
 *  whole tail and leaving a 0.69 trough at f91. The
 *  creep-in is cut to 0.010 so it no longer cancels: the lonely `?` is allowed
 *  to drift down-frame from 272 to 330 (floor 230) and the level line from 761
 *  to 811 (floor 720). */
const CREEP_C = 85;
const CREEP_K_IN = 0.01;
const CREEP_F1 = 155;
const CREEP_WARP = 0.68;

const pullU = (f: number) => camEase(clamp01((f - PULL_F0) / (PULL_F1 - PULL_F0)), PULL_WARP);
const creepU = (f: number) => camEase(clamp01((f - PULL_F1) / (CREEP_F1 - PULL_F1)), CREEP_WARP);

/** The framing the cut opens in, already craning up past the mark. */
const camFollow = (f: number) => C_OPEN - FOLLOW * (Y_START - modelY(f));
const kFollow = (f: number) => K_OPEN - K_PRE_RATE * f;
/** ...and the wide one it settles into, which never quite stops settling. */
const camSettle = (f: number) => C_FINAL - CREEP_C * creepU(f);

const yTargetRaw = (f: number) => lerp(camFollow(f), camSettle(f), pullU(f));
const kTargetRaw = (f: number) => lerp(kFollow(f), K_FINAL + CREEP_K_IN * creepU(f), pullU(f));

/** The damper is only ever as smooth as the target it is handed. A symmetric
 *  Gaussian (so it adds no lag of its own, only rounds curvature) runs over both
 *  channels before the damper sees them. */
const CAM_SMOOTH = 5;
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
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    const k = gauss(kTargetRaw, f);
    F.push(f - FIRST);
    K.push(k);
    CY.push(gauss(yTargetRaw, f) + CAM_LIFT / k);
  }
  return { F, K, CY };
})();

const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f - FIRST, CAM.F, CAM.CY, CAM.K);
    const d = sway(f + CONTINUE_FROM);
    out.push({ cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 2, Math.round(f)));
const camAt = (f: number) => CAM_AT_F[clampF(f)];
const kAt = (f: number) => camAt(f).k;
/** Where a world point sits on screen at frame `f`. */
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  const d = sway(f + CONTINUE_FROM);
  return { x: WORLD_W / 2 + (wx - (COLUMN.x + d.dx)) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};

// ---------------------------------------------------------------------------

const HarderToMakeProgress: React.FC<Props> = ({
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
  const cam = runCamera(frame - FIRST, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame + CONTINUE_FROM);
  const cx = COLUMN.x + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const ly = modelY(frame);
  const ld = ringSway(frame + CONTINUE_FROM, LONELY.seed);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_AT_F[0].cy}
        cx={cx}
        cxRest={COLUMN.x}
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
            {/* the model's own trail: straight down the shaft to the bottom of
                the mass, fade 0, because its path HAVING a bottom end is the
                point. It grows as the mark rises. */}
            <Trail
              id="hpModelTrail"
              ax={COLUMN.x}
              ay={TRAIL_BOTTOM}
              bx={COLUMN.x}
              by={ly}
              k={k}
              fade={0}
            />
            {/* the level line goes UNDER the column: a ring's own stroke and its
                glyph occlude it, the ring's open interior does not */}
            <LevelLine k={k} y={ly} />
            {QUESTIONS.map((q, i) => {
              const d = ringSway(frame + CONTINUE_FROM, q.seed);
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
            {/* THE NEXT QUESTION. Not in the column: 590 world px above its top,
                on the axis, and the line never reaches it. */}
            <QuestionRing
              x={LONELY.x + ld.dx}
              y={LONELY.y + ld.dy}
              r={LONELY.r}
              solved={0}
              k={k}
            />
            <ModelMark k={k} y={ly} />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HarderToMakeProgress;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  okay: defaultProps.beats.okay,
  harder: defaultProps.beats.harder,
  progress: defaultProps.beats.progress,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const MODEL_Y_AT = (f: number) => modelY(f);

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the report is read off this.
// ---------------------------------------------------------------------------
export const STATS = {
  duration: DURATION,
  vScale: Number(V_SCALE.toFixed(5)),
  rings: QUESTIONS.length,
  yStart: Number(Y_START.toFixed(1)),
  nearRing: {
    i: NEAR_I,
    y: Number(NEAR.y.toFixed(1)),
    x: Number(NEAR.x.toFixed(1)),
    r: Number(NEAR.r.toFixed(2)),
  },
  lonely: { x: LONELY.x, y: LONELY.y, r: LONELY.r },

  /** The climb: where the mark is and how fast, every 10 frames. */
  climb: (() => {
    const rows: [number, number, number][] = [];
    for (let f = 0; f <= LAST; f += 10)
      rows.push([f, Number(modelY(f).toFixed(1)), Number(modelV(f).toFixed(3))]);
    rows.push([LAST, Number(modelY(LAST).toFixed(1)), Number(modelV(LAST).toFixed(3))]);
    return rows;
  })(),
  minV: (() => {
    let worst = { f: -1, v: Infinity };
    for (let f = 1; f <= LAST; f++) {
      const v = modelV(f);
      if (v < worst.v) worst = { f, v };
    }
    return [worst.f, Number(worst.v.toFixed(4))];
  })(),
  maxV: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = 1; f <= LAST; f++) {
      const v = modelV(f);
      if (v > worst.v) worst = { f, v };
    }
    return [worst.f, Number(worst.v.toFixed(3))];
  })(),
  climbTotals: {
    toFlip: Number((Y_START - modelY(FLIP_F)).toFixed(1)),
    afterFlip: Number((modelY(FLIP_F) - modelY(LAST)).toFixed(1)),
    whole: Number((Y_START - modelY(LAST)).toFixed(1)),
  },

  /** THE FLIP, from geometry: the sub-frame crossing `makeSolver` found for the
   *  near ring, and the proof there is only one. */
  flip: {
    ringsCrossingInsideCut: QUESTIONS.map((_, i) => i).filter(
      (i) => SOLVER.cross[i] > 0 && SOLVER.cross[i] <= LAST,
    ),
    crossFrame: Number(SOLVER.cross[NEAR_I].toFixed(2)),
    lineYAtCross: Number(modelY(Math.round(SOLVER.cross[NEAR_I])).toFixed(1)),
    ringY: Number(NEAR.y.toFixed(1)),
    tickFullAt: Number((SOLVER.cross[NEAR_I] + SOLVE_F).toFixed(1)),
    /** the one ring released inside the cut: where it goes and how far */
    release: {
      startsAt: Number(GATHER_START[NEAR_I].toFixed(1)),
      durF: Number(releaseDur(NEAR_I).toFixed(1)),
      sharedDurWouldBe: Number(gatherDur(NEAR.seed).toFixed(1)),
      fromDx: Number((NEAR.x - COLUMN.x).toFixed(1)),
      toDx: Number((GATHERED[NEAR_I] - COLUMN.x).toFixed(1)),
      travel: Number(Math.abs(GATHERED[NEAR_I] - NEAR.x).toFixed(1)),
      dxAt: [60, 80, 100, LAST].map((f) => [f, Number((gatherX(f, NEAR_I) - COLUMN.x).toFixed(1))]),
      movingAtLast: Math.abs(gatherX(LAST, NEAR_I) - gatherX(LAST - 1, NEAR_I)) > 0.01,
    },
  },

  /** The camera: zoom, world centre, and the screen speed / acceleration of
   *  fixed world points. The set's ceiling on |dv| is 2.5 screen px/f^2. */
  cam: (() => {
    const rows: [number, number, number, number][] = [];
    for (let f = 0; f <= LAST; f += 10) {
      const c = camAt(f);
      rows.push([f, Number(c.k.toFixed(4)), Number(c.cy.toFixed(1)), Number((c.cy - CAM_LIFT / c.k).toFixed(1))]);
    }
    const c = camAt(LAST);
    rows.push([LAST, Number(c.k.toFixed(4)), Number(c.cy.toFixed(1)), Number((c.cy - CAM_LIFT / c.k).toFixed(1))]);
    return rows;
  })(),
  camAudit: (() => {
    const pts: [number, number][] = [
      [COLUMN.x, COLUMN.yTop],
      [COLUMN.x, COLUMN.yBottom],
      [COLUMN.x, LONELY.y],
      [COLUMN.x, 760],
      [COLUMN.x - 330, 760],
      [COLUMN.x + 330, 760],
      [COLUMN.x - 180, 1100],
      [COLUMN.x + 180, 430],
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
      maxScreenSpeed: [maxV.f, Number(maxV.v.toFixed(2)), `cap ${SPEED_CAP_SCREEN}`],
      maxDV: [maxDV.f, Number(maxDV.v.toFixed(3)), "cap 2.5"],
      minMeanSpeed: [minMean.f, Number(minMean.v.toFixed(3))],
    };
  })(),

  /** THE GAP, which is the cut: where the line and the lonely `?` sit on screen. */
  gap: [0, 26, 55, 63, 77, 88, 100, LAST].map((f) => {
    const m = screenAt(f, COLUMN.x, modelY(f));
    const l = screenAt(f, LONELY.x, LONELY.y);
    return {
      f,
      lineScreenY: Number(m.y.toFixed(0)),
      lonelyScreenY: Number(l.y.toFixed(0)),
      lonelyTopY: Number((l.y - (LONELY.r + strokeW(kAt(f)) / 2) * kAt(f)).toFixed(0)),
      gapScreen: Number((m.y - l.y).toFixed(0)),
      gapWorld: Number((modelY(f) - LONELY.y).toFixed(0)),
    };
  }),
  /** The frame the lonely ring's whole circle is inside the frame. */
  lonelyEnters: (() => {
    let bottomIn = -1;
    let whole = -1;
    for (let f = 0; f <= LAST; f++) {
      const l = screenAt(f, LONELY.x, LONELY.y);
      const rr = (LONELY.r + strokeW(kAt(f)) / 2) * kAt(f);
      if (bottomIn < 0 && l.y + rr > 0) bottomIn = f;
      if (whole < 0 && l.y - rr > 0) whole = f;
    }
    return { bottomEdgeOnScreen: bottomIn, wholeRingOnScreen: whole };
  })(),

  /** Stroke weights on screen, so the one family is one family. */
  stroke: [0, 46, 82, 100, LAST].map((f) => [
    f,
    Number(strokeScreen(kAt(f)).toFixed(2)),
    Number(((strokeW(kAt(f)) / 2) * kAt(f)).toFixed(2)),
  ]),
  markPxOnScreen: [0, 55, 88, LAST].map((f) => [f, Number((MODEL_MARK * kAt(f)).toFixed(1))]),
  ringPxOnScreen: [0, 88, LAST].map((f) => [f, Number((2 * RING_R * kAt(f)).toFixed(1))]),

  /** Where the ink is on the beat frames. */
  frameInk: (() => {
    const at = (f: number) => {
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      let sy = 0;
      let n = 0;
      const sw = strokeW(kAt(f)) / 2;
      const add = (x: number, y: number, r: number) => {
        const rr = (r + sw) * kAt(f);
        top = Math.min(top, y - rr);
        bottom = Math.max(bottom, y + rr);
        left = Math.min(left, x - rr);
        right = Math.max(right, x + rr);
        sy += y;
        n += 1;
      };
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const d = ringSway(f + CONTINUE_FROM, q.seed);
        const c = screenAt(f, gatherX(f, i) + d.dx, q.y + d.dy);
        add(c.x, c.y, q.r);
      }
      const dl = ringSway(f + CONTINUE_FROM, LONELY.seed);
      const lc = screenAt(f, LONELY.x + dl.dx, LONELY.y + dl.dy);
      add(lc.x, lc.y, LONELY.r);
      const m = screenAt(f, COLUMN.x, modelY(f));
      add(m.x, m.y, MODEL_MARK / 2);
      return {
        f,
        inkY: [Number(top.toFixed(0)), Number(bottom.toFixed(0))],
        inkX: [Number(left.toFixed(0)), Number(right.toFixed(0))],
        centreOfMassY: Number((sy / n).toFixed(0)),
      };
    };
    return [at(0), at(55), at(88), at(LAST)];
  })(),

  /** The rim-to-rim air between rings, over every frame of the cut. */
  minRimGapAnyFrame: (() => {
    let live = { f: -1, i: -1, j: -1, gap: Infinity };
    for (let f = 0; f <= LAST; f++) {
      for (let i = 0; i < QUESTIONS.length; i++) {
        const di = ringSway(f + CONTINUE_FROM, QUESTIONS[i].seed);
        for (let j = i + 1; j < QUESTIONS.length; j++) {
          const dj = ringSway(f + CONTINUE_FROM, QUESTIONS[j].seed);
          const dy = QUESTIONS[i].y + di.dy - (QUESTIONS[j].y + dj.dy);
          if (Math.abs(dy) >= QUESTIONS[i].r + QUESTIONS[j].r + 60) continue;
          const gap =
            Math.hypot(gatherX(f, i) + di.dx - (gatherX(f, j) + dj.dx), dy) -
            QUESTIONS[i].r -
            QUESTIONS[j].r;
          if (gap < live.gap) live = { f, i, j, gap };
        }
      }
    }
    return [live.f, `rings ${live.i}/${live.j}`, Number(live.gap.toFixed(2))];
  })(),
  /** ...and the closest the mark ever comes to a ring's rim. */
  markClearance: (() => {
    let w = { f: -1, i: -1, gap: Infinity };
    for (let f = 0; f <= LAST; f++) {
      const my = modelY(f);
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const d = ringSway(f + CONTINUE_FROM, q.seed);
        const gap =
          Math.hypot(gatherX(f, i) + d.dx - COLUMN.x, q.y + d.dy - my) - MODEL_EDGE - q.r;
        if (gap < w.gap) w = { f, i, gap };
      }
    }
    return [w.f, `ring ${w.i}`, Number(w.gap.toFixed(2))];
  })(),
  /** The fastest anything on the column moves relative to the frame. */
  ringMaxScreenSpeed: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = 1; f <= LAST; f++) {
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const da = ringSway(f - 1 + CONTINUE_FROM, q.seed);
        const db = ringSway(f + CONTINUE_FROM, q.seed);
        const a = screenAt(f - 1, gatherX(f - 1, i) + da.dx, q.y + da.dy);
        const b = screenAt(f, gatherX(f, i) + db.dx, q.y + db.dy);
        const v = Math.hypot(b.x - a.x, b.y - a.y);
        if (v > worst.v) worst = { f, v };
      }
    }
    return [worst.f, Number(worst.v.toFixed(2)), `cap ${SPEED_CAP_SCREEN}`];
  })(),
  trailBottom: Number(TRAIL_BOTTOM.toFixed(1)),
  camWideRef: { k: CAM_WIDE.k, y: CAM_WIDE.y },
};
