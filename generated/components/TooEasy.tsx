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
  CAM_CLOSE,
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
  gatherDur,
  makeSolver,
  ringSway,
  solvedAt,
  strokeScreen,
  strokeW,
} from "./challengeShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 1 of the set: `TooEasy`.
// Line (SRT 0:01.340 -> 0:07.160):
//   "that as the models become smarter and smarter, the kinds of questions we
//    can ask them, a lot of them are too easy"
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// VOCABULARY — `challengeShared`'s, and nothing is invented here. The model is
// the OpenAI mark filled ACCENT; its LEVEL is one thin accent line through it
// that moves only because the mark moves; a QUESTION is a white ring with
// lucide `circle-help`'s `?` in it, and its HEIGHT IS ITS DIFFICULTY; it is
// ANSWERED — `?` out, tick in, ink 1.0 -> 0.5 — only when the level line reaches
// its centre, which is computed from the line's own y and never from a frame
// number. Two ink rungs, one stroke family, no text, no boxes, no third colour.
//
// DURATION. 5.82 s of speech x 24 = 139.7 -> 140 frames, plus the set's
// 16-frame tail: DURATION = 140 + 16 = 156.
//
// Word -> frame (24 fps from comp start):
//   that 0 · as 14 · the 23 · models 27 · become 35 · smarter 43 · and 49 ·
//   smarter 53 · the 64 · kinds 68 · questions 78 · we 86 · ask 92 · them 98 ·
//   a-lot 106 · are 114 · too 118 · easy 131 · (speech ends 140)
//
// SOUND-OFF READING TEST — one sentence:
//   "an orange mark with a level line through it climbs a column of question
//    marks, and every question the line passes turns into a tick and goes dim;
//    the camera pulls back and there is a whole dim mass of them underneath it,
//    with only a few bright ones left above."
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous climb. The words are where it LANDS; nothing else
// in the cut moves on its own.
//
//  1. f0-27    "that as the        THE CREEP. The mark is already rising at f0
//              models"            (0.85 world px/f) with two rings beneath it
//              (f0/f14/f23/f27)   already ticked, dim and drawn in toward the
//                                 axis, everything above it a bright `?`. The
//                                 camera is already moving too (24 frames of
//                                 pre-roll), tracking the mark at k 1.8 with the
//                                 column bleeding off both edges.
//
//  2. f27-48   "become SMARTER"    THE FIRST SWELL. 175 world px, the velocity
//              (f35/f43)          swelling to 11.4 px/f and landing on "smarter"
//                                 (f43-48). The first handful of rings come down
//                                 past the line and flip as it reaches them:
//                                 4 ticked at f27, 11 by f48.
//
//  3. f46-66   "AND SMARTER"       THE SECOND SWELL. 163 world px, flowing
//              (f49/f53)          straight out of the first — the velocity dips
//                                 to 6.3 px/f at f48 and never near zero — and
//                                 peaking at 11.5 px/f on "and smarter". 20 rings
//                                 ticked by f66, and it leaves the mark at y 883
//                                 with the whole fat band of the lens still above
//                                 it.
//
//  4. (mechanism, all cut)         THE FLIP. Wherever the level line reaches a
//                                 ring's centre, that ring's `?` un-draws, the
//                                 tick draws in its place and the ring falls
//                                 INK_HI -> INK_LO over SOLVE_F = 10 frames. It
//                                 is solved from the LINE'S y every frame, so
//                                 the ripple cannot drift from the thing that
//                                 causes it, and no two rings share a height so
//                                 they never flip in unison.
//
//  5. (mechanism, all cut)         THE RELEASE. Ten frames later — its flip
//                                 finished — the ring eases inward to
//                                 `GATHERED[i]` over its own 30-40 frames and
//                                 closes the shaft behind the mark. Above the
//                                 line the channel stays open with the `?` still
//                                 standing in it; below it the ticks become ONE
//                                 centred, feathered mass. Every start is the
//                                 line's arrival, so the mass gathers as a wake,
//                                 never in unison, and 18 rings are still
//                                 travelling on the last frame of the cut. A ring
//                                 does not set off into an occupied corridor: it
//                                 waits for the line to have reached whatever is
//                                 standing in its way (19 of the 49 wait), which
//                                 holds every pair at least 6.01 world px
//                                 rim-to-rim on every frame of the cut.
//
//  6. f52-100  "the kinds of       THE PULL-BACK. One glide out of the tracking
//              questions we can   shot to CAM_WIDE (k 1.8 -> 1.0, warp 0.72),
//              ask them"          settled by f100, ahead of "a lot" (f106). This
//              (f64/f68/f78/      is the payoff-off-frame move: what we discover
//               f86/f92/f98)      is HOW MANY questions now lie beneath the line.
//                                 Under it the climb holds a steady slow 3.9 px/f
//                                 (y 883 -> 749) — the camera is the gesture here,
//                                 not the mark. The camera follows the mark while
//                                 the mark is below the column's centre and stops
//                                 there when it rises past it (a soft max, not a
//                                 key), so the mark drifts up-frame on its own
//                                 rather than being chased.
//
//  7. f100-128 "A LOT OF THEM      THE THIRD SWELL. Out of that steady climb the
//              ARE TOO EASY"      mark accelerates again — 5.0 px/f at f100 to a
//              (f106/f114/f118/   peak of 12.3 at f115 — and carries 249 world px
//               f131)             (y 749 -> 500) straight through the fattest,
//                                 fullest band of the lens. This is the steepest
//                                 stretch of the tick-count in the cut: 15 rings
//                                 turn over across f100-130, 7 of them in the ten
//                                 frames around "are" (f110-120), and the mass
//                                 gathering behind them fills the frame from
//                                 underneath. "easy" (f131) lands on it while a
//                                 ring is still flipping.
//
//  8. f128-155 (continues 7)       THE TAIL. The swell decays into a creep that
//                                 holds >= 0.80 px/f toward the next `?` above
//                                 and does not reach it — the line ends 24.5 world
//                                 px short of that ring's centre. THE CUT DOES NOT
//                                 RESOLVE: the mark is still rising, one more ring
//                                 turned over at f151, eleven are still sliding
//                                 inward and the camera is still creeping in.
//
// AMBIENT ONLY (mechanisms, so no window of the cut is still): each ring's own
// <= 3 px drift on its own two periods; the grid's parallax and -0.3 px/frame
// drift; the camera's `sway`; and a climb whose speed never touches zero.
// Nothing else: no packets, no brackets, no labels, no growth or breath on the
// mark, no tone pulsing, no flashes.
//
// ---------------------------------------------------------------------------
// THE CLIMB. Authored as a VELOCITY track, not a position one, because every
// requirement on it is a requirement on its speed: three swells landing on the
// two "smarter"s and on "a lot of them are too easy", a dip between the first
// two that never reaches zero, a steady slow stretch under the pull-back, and a
// tail that still creeps. A monotone cubic Hermite (Fritsch-Carlson, so it
// cannot overshoot a knot and dip negative) through `VEL_KNOTS` is integrated at
// quarter-frame steps into `MODEL_Y`, and `V_SCALE` is SOLVED by secant so that
// the integral lands the mark on Y_AT_128 = 500 exactly. The module THROWS if
// the climb ever stops or exceeds 25 world px/f.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic.
//
//  * THE COLUMN SPANS y 210..1300, not 170..1340. At CAM_WIDE (k 1.0) world px
//    ARE screen px, so the column's ink runs from yTop - r - stroke/2 to
//    yBottom + r + stroke/2. At 170 / 1340 that is 133..1378 — 1245 px of ink
//    inside the brief's own 1200 px band (top ink >= 150, lowest <= 1350). It
//    does not fit, and lowering k to make it fit costs the wide shot its scale.
//    At 210 / 1300 the ink measures 174..1329 on the resolved frame and clears
//    both edges by ~20 px with the camera's 5 px sway spent, and the content's
//    centre of mass lands at screen y 780 rather than the set's 835 — with 1160
//    px of ink inside a 1200 px band there is nowhere else for it to be, and the
//    error is toward the top of the frame, away from the captions. (In
//    `challengeShared.COLUMN`.)
//
//  * THE LENS AND THE CLIMB WERE RE-SEATED TOGETHER (director's V2 note, which
//    relaxed "decelerating"). The fattest, fullest band of the lens now sits
//    across y 500..790 rather than 660..940 (`challengeShared.hw` and `dens`),
//    and the climb has a THIRD swell across f100-128 that carries the line
//    through exactly that band. That is what puts the steepest stretch of the
//    tick-count on "a lot of them are too easy" — 15 of the 49 rings turn over
//    across f100-130 against 12 across f50-70 — where before it fell on the
//    second surge and the wide shot then held nearly still for 60 frames.
//
//  * Y AT f128 IS 500, not the note's 480. The next `?` above the line sits at
//    y 443, and the tail has to creep for 27 more frames at >= 0.78 px/f (31
//    world px) without reaching it. At 480 the line would finish 14 px under
//    that ring's centre, well inside its circle, which reads as a ring that
//    should have flipped and did not. At 500 it finishes 24.5 px short — the
//    line just touching the ring's lower edge, closing on it.
//
//  * THE COLUMN HOLDS 49 RINGS, not the brief's 32-40, and their radii measure
//    31.5..36.8 rather than 32..36. Both fall out of the two changes the
//    resolved frame asked for (see `challengeShared.COLUMN.shaftHalf` and
//    `hw`): narrowing the shaft to 84 and opening the belly to 372 gives the
//    lens half again as much band to stand rings in, and 40 rings in it read as
//    two thin chains rather than as one mass; the V2 pass then needed 14-18 rings
//    inside y 480..740 for the third swell to cross, ~6 still bright above the
//    line, and 2 below the model's start, and 49 is what satisfies all three. The radius spread is the rim
//    feather (0.89 of RING_R out on the silhouette) times a +/-3% per-ring
//    jitter, which is what keeps the edge from being a drawn line.
//
//  * THE MARK DOES NOT BREATHE. `trapShared.ModelDot` runs `breath` on the mark
//    always; the common brief's motion rules list breathing with the springs and
//    the flashes. `challengeShared.ModelMark` therefore has no breath and no
//    scale gesture at all — the mark's aliveness is its own never-zero climb.
//
// ---------------------------------------------------------------------------
// THE CAMERA — its own keyed track (one key per frame), damped by the shared
// `runCamera`, with 24 frames of pre-roll so it is already moving at f0.
//
//   k:  1.8 held to f52, then ONE glide to CAM_WIDE 1.0 by f100 (`camEase`,
//       warp 0.62 — the speed early, as a pull-back wants it), then a very slow
//       creep-in 1.0 -> 1.03 over f100-200 that is still running on the last
//       frame.
//   y:  softMax(the mark's own curve, CAM_WIDE.y) — the camera follows the mark
//       while the mark is below the column's centre and holds the column centred
//       once it rises past it. A soft max rather than a key, so there is no
//       corner where the two meet; the knee is 110 world px wide. A LEAD of 3.2
//       frames of the mark's own velocity is subtracted from the target, which
//       cancels most (but deliberately not all) of the damper's steady-state lag
//       — the mark still rides up-frame on the surges and settles back, which is
//       the brief's "let the mark lead a little", instead of the 170 screen px
//       the undamped tracker would give it.
//   cy: y + CAM_LIFT / k off the SAME eased k, so the framing and the zoom
//       settle together.
//
// Everything measured is in STATS at the bottom and quoted in the report; the
// module also THROWS if a ring is ever solved when the line has not reached it.
// ---------------------------------------------------------------------------

export const DURATION = 156;

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
    that: z.number(),
    as: z.number(),
    models: z.number(),
    become: z.number(),
    smarter: z.number(),
    and: z.number(),
    smarter2: z.number(),
    kinds: z.number(),
    questions: z.number(),
    ask: z.number(),
    them: z.number(),
    aLot: z.number(),
    are: z.number(),
    too: z.number(),
    easy: z.number(),
    end: z.number(), // speech ends; the tail runs to 156
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
    that: 0,
    as: 14,
    models: 27,
    become: 35,
    smarter: 43,
    and: 49,
    smarter2: 53,
    kinds: 68,
    questions: 78,
    ask: 92,
    them: 98,
    aLot: 106,
    are: 114,
    too: 118,
    easy: 131,
    end: 140,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
/** Frames of pre-roll: the camera and the climb are both already running at f0. */
const PRE = 24;
const FIRST = -PRE;

// ---------------------------------------------------------------------------
// THE CLIMB, as a velocity track.
// ---------------------------------------------------------------------------
const Y_START = 1250;
/** Where the long climb has to have arrived by the end of "them" -> "a lot".
 *  480, not the brief's 470: the tail has to keep creeping for 27 more frames
 *  without reaching the next `?` above (whose centre is at y 422), and at 470
 *  there were only ~24 world px of room to do it in, which forced the creep down
 *  to 0.43 px/f and left the last 45 frames of the cut measurably still. At 480
 *  the tail has 33 px to spend, the creep holds ~1.2 px/f, and the line still
 *  ends 25 px short of that ring — just inside its lower edge, closing on it. */
const Y_AT_128 = 500;
const CLIMB_END_F = 128;

/** world px per frame. THE THREE SWELLS, the dip that never reaches zero between
 *  the first two, the steady slow stretch under the pull-back, and a tail that
 *  still creeps. */
const VEL_KNOTS: [number, number][] = [
  [-40, 0.95],
  [16, 0.95],
  [26, 2.6],
  [33, 9.0],
  [38, 12.6],
  [43, 11.4],
  [47, 7.0],
  [52, 11.5],
  [57, 12.8],
  [62, 8.6],
  [66, 5.8],
  [74, 4.3],
  [84, 4.0],
  [94, 4.4],
  [100, 5.8],
  [108, 10.6],
  [114, 13.8],
  [120, 11.6],
  [126, 5.6],
  [130, 2.6],
  [136, 1.35],
  [156, 0.9],
  [230, 0.88],
];

const vBase = hermite(
  VEL_KNOTS.map((p) => p[0]),
  VEL_KNOTS.map((p) => p[1]),
);

/** The integral of `scale * vBase` from 0, at quarter-frame steps. `MODEL_Y` is
 *  indexed from FIRST, so index = f - FIRST. */
const SUB = 4;
const buildY = (scale: number) => {
  const n = LAST + 3 - FIRST;
  const out: number[] = new Array(n);
  // forward from f = 0
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

/** Solved so the mark is on Y_AT_128 at CLIMB_END_F, by secant on the scale. */
const V_SCALE = (() => {
  const at = (s: number) => buildY(s)[CLIMB_END_F - FIRST];
  let a = 0.8;
  let b = 1.2;
  let fa = at(a) - Y_AT_128;
  let fb = at(b) - Y_AT_128;
  for (let i = 0; i < 40 && Math.abs(fb) > 1e-7; i++) {
    const c = b - (fb * (b - a)) / (fb - fa);
    a = b;
    fa = fb;
    b = c;
    fb = at(b) - Y_AT_128;
  }
  return b;
})();

const MODEL_Y = buildY(V_SCALE);
const idx = (f: number) => Math.max(0, Math.min(MODEL_Y.length - 1, Math.round(f) - FIRST));
/** The mark's height, and the LEVEL LINE's: one y drives both. */
const modelY = (f: number) => MODEL_Y[idx(f)];
const modelV = (f: number) => modelY(f - 1) - modelY(f); // world px/frame, upward

// The climb must never stop, and must never outrun the close-up's ceiling.
(() => {
  for (let f = FIRST + 1; f <= LAST; f++) {
    const v = modelV(f);
    if (!(v > 0)) {
      throw new Error(`TooEasy: the climb stops at f${f} (v = ${v.toFixed(4)} world px/f).`);
    }
    if (v > 25) {
      throw new Error(`TooEasy: the climb runs at ${v.toFixed(2)} world px/f at f${f} (cap 25).`);
    }
  }
})();

// ---------------------------------------------------------------------------
// THE MECHANISM: every ring's flip, solved off the line's own y.
// ---------------------------------------------------------------------------
const SOLVER = makeSolver(modelY, FIRST, LAST + 2);

// ---------------------------------------------------------------------------
// THE RELEASE. A question the line has reached is not a question any more, and
// it stops standing out of the model's way: once its flip is finished it eases
// inward to `challengeShared.GATHERED[i]` and closes the shaft behind the mark.
// Above the line the channel stays open with the few `?` still in it; below it
// the ticks become ONE centred, feathered mass instead of two chains with a dead
// stripe down the middle.
//
// EVERY START IS THE LINE'S ARRIVAL, never a shared frame, and every ring has
// its own 30-40 frame ease off its own seed, so the mass gathers as a wake
// behind the climb rather than as one move. Rings released by the third swell
// are still travelling on the last frame of the cut.
//
// THE MARK CAN NEVER OVERLAP A RING. A ring released while the mark is still
// only a few px above it would ease straight into it — which is exactly what
// happens in the tail, where the climb is down to 0.8 px/f. So the ring's
// distance from the axis is held OUT of the mark's own disc: `keepOut` is the
// half-chord of a circle of radius (mark's half-box + the ring's radius + pad)
// at the ring's height, and the gathered distance is the smooth max of the two.
// It is a soft max (knee 14 world px), so a ring held out by the mark slides
// inward as the mark rises instead of unlatching on one frame — which is also
// the last of the tail's motion.
// ---------------------------------------------------------------------------
const gatherSoftMax = (a: number, b: number, e: number) => 0.5 * (a + b + Math.hypot(a - b, e));
const GATHER_KNEE = 14;
/** Rim-to-rim air any two rings must keep AT EVERY FRAME, not just at the ends. */
const CLEAR_PAD = 6;

/** Could ring j stand in ring i's way on its journey inward? True when the two
 *  can reach each other vertically at all AND j's standing x lies inside the
 *  span i sweeps, widened by the horizontal clearance the two need at that
 *  height difference. Signed x, so it also catches a pair that would meet ACROSS
 *  the axis once both have come in. */
const gatherBlocks = (i: number, j: number) => {
  const a = QUESTIONS[i];
  const b = QUESTIONS[j];
  const reach = a.r + b.r + CLEAR_PAD;
  const dy = Math.abs(a.y - b.y);
  if (dy >= reach) return false;
  const h = Math.sqrt(reach * reach - dy * dy);
  return (
    b.x >= Math.min(a.x, GATHERED[i]) - h && b.x <= Math.max(a.x, GATHERED[i]) + h
  );
};

/** WHEN EACH RING SETS OFF. The gathered TARGETS are relaxed against each other,
 *  but the journeys were not: a ring released by the line could set off inward
 *  through a neighbour the line had not reached yet, which is still standing
 *  where it always stood. (Measured on the V2 f155 still: a tick in transit
 *  overlapping the ring being flipped on the line by 8.6 world px.)
 *
 *  So a ring waits for the LINE to have reached every ring that stands in its
 *  way — `max` of their crossing frames, plus the same GATHER_DELAY. It is still
 *  the line's arrival that starts everything and every ring still keeps its own
 *  seeded duration, so nothing moves in unison; a ring simply does not set off
 *  into an occupied corridor. A ring whose blocker is never reached at all never
 *  sets off, which is the honest picture: it is still waiting behind a question
 *  the model has not answered. */
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

/** The corridor rule above fixes the journeys it can see; this walks every frame
 *  of the cut against every pair that can reach each other and holds back
 *  whichever ring is actually moving until the last of them clears. It runs at
 *  module scope, so the file cannot be built with two rings touching. */
type GatherHit = { f: number; i: number; j: number; gap: number };
const gatherWorst = (): GatherHit | null => {
  let worst: GatherHit | null = null;
  for (let f = 0; f <= LAST; f++) {
    for (let i = 0; i < QUESTIONS.length; i++) {
      for (let j = i + 1; j < QUESTIONS.length; j++) {
        const dy = QUESTIONS[i].y - QUESTIONS[j].y;
        const reach = QUESTIONS[i].r + QUESTIONS[j].r + CLEAR_PAD;
        if (Math.abs(dy) >= reach) continue;
        const gap =
          Math.hypot(gatherX(f, i) - gatherX(f, j), dy) - QUESTIONS[i].r - QUESTIONS[j].r;
        if (gap < CLEAR_PAD && (worst === null || gap < worst.gap)) {
          worst = { f, i, j, gap };
        }
      }
    }
    if (worst !== null) return worst;
  }
  return worst;
};

(() => {
  for (let pass = 0; pass < 600; pass++) {
    const v = gatherWorst();
    if (v === null) return;
    const mi = gatherProgress(v.f, v.i) > 0 && gatherProgress(v.f, v.i) < 1;
    const mj = gatherProgress(v.f, v.j) > 0 && gatherProgress(v.f, v.j) < 1;
    // hold back whichever of the two is actually travelling; if both are, the
    // one that set off later waits for the other to get out of the way.
    const k =
      mi && mj
        ? GATHER_START[v.i] >= GATHER_START[v.j]
          ? v.i
          : v.j
        : mi
          ? v.i
          : mj
            ? v.j
            : GATHER_START[v.i] >= GATHER_START[v.j]
              ? v.i
              : v.j;
    GATHER_START[k] += 2;
  }
  const left = gatherWorst();
  if (left !== null) {
    throw new Error(
      `TooEasy: rings ${left.i}/${left.j} still come within ${left.gap.toFixed(2)} world px ` +
        `at f${left.f} (floor ${CLEAR_PAD}).`,
    );
  }
})();

// ...and the mark never overlaps a ring, on any frame, sway spent.
(() => {
  for (let f = 0; f <= LAST; f++) {
    const my = modelY(f);
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const d = ringSway(f, q.seed);
      const gap = Math.hypot(gatherX(f, i) + d.dx - COLUMN.x, q.y + d.dy - my) - MODEL_EDGE - q.r;
      if (gap < 0) {
        throw new Error(
          `TooEasy: the mark overlaps ring ${i} at f${f} by ${(-gap).toFixed(2)} world px.`,
        );
      }
    }
  }
})();

// ...and the assertion the brief asks for: across every frame of the cut and
// every ring of the column, a ring is in flip iff the level line has reached it.
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
          `TooEasy: ring ${i} (y ${q.y.toFixed(1)}) is ${got ? "" : "not "}solved at f${f} ` +
            `but the line is at y ${ly.toFixed(1)}.`,
        );
      }
    }
  }
})();

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
const PULL_F0 = 52;
const PULL_F1 = 100;
const PULL_WARP = 0.72;
/** The very slow creep-in that keeps the last frame moving. Its warp is under 1
 *  so it has some speed EARLY, right where the pull-back has just settled —
 *  otherwise the frames either side of f100 are the one window of the cut where
 *  the camera is effectively parked. */
const CREEP_K = 0.05;
const CREEP_F1 = 210;
const CREEP_WARP = 0.8;
/** Frames of the mark's own velocity subtracted from the camera's target, so the
 *  damper's steady-state lag (5.2 frames' worth of it) is partly — and
 *  deliberately not wholly — cancelled: the mark still rides up-frame on the
 *  surges and settles back, which is the lead the brief asks for. Every frame of
 *  lead also multiplies the mark's own ACCELERATION into the camera's target, so
 *  it is paid for in |dv|, which is why the target is smoothed below. */
const CAM_LEAD = 2.2;
/** The knee of the soft max between "follow the mark" and "hold the column
 *  centred", in world px. It is the plain smooth max: -> a where a is well above
 *  b, -> b where it is well below, and a + e/2 where they meet. */
const CAM_KNEE = 110;
const softMax = (a: number, b: number, e: number) => 0.5 * (a + b + Math.hypot(a - b, e));

const kTarget = (f: number) =>
  lerp(CAM_CLOSE.k, CAM_WIDE.k, camEase(clamp01((f - PULL_F0) / (PULL_F1 - PULL_F0)), PULL_WARP)) +
  CREEP_K * camEase(clamp01((f - PULL_F1) / (CREEP_F1 - PULL_F1)), CREEP_WARP);

const yTargetRaw = (f: number) => softMax(modelY(f) - CAM_LEAD * modelV(f), CAM_WIDE.y, CAM_KNEE);

/** The target the damper is handed is only ever as smooth as it is written: the
 *  lead term carries the climb's own jerk, and the knee of the soft max lands in
 *  the middle of the pull-back. A symmetric Gaussian (sigma CAM_SMOOTH, so it
 *  adds no lag of its own, only rounds curvature) is run over it before the
 *  damper sees it, which is what takes the worst |dv| from 3.8 to under the
 *  set's 2.5 screen px/f^2 ceiling. */
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
const yTarget = (f: number) => gauss(yTargetRaw, f);

const CAM = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    const k = gauss(kTarget, f);
    F.push(f - FIRST);
    K.push(k);
    CY.push(yTarget(f) + CAM_LIFT / k);
  }
  return { F, K, CY };
})();

const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f - FIRST, CAM.F, CAM.CY, CAM.K);
    const d = sway(f);
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
  const d = sway(f);
  return { x: WORLD_W / 2 + (wx - (COLUMN.x + d.dx)) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};

// ---------------------------------------------------------------------------

const TooEasy: React.FC<Props> = ({
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
  const drift = sway(frame);
  const cx = COLUMN.x + drift.dx;
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
            {/* the level line goes UNDER the column: a ring's own stroke and its
                glyph occlude it, the ring's open interior does not, so the line
                is seen to pass THROUGH the question it is answering */}
            <LevelLine k={k} y={ly} />
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
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default TooEasy;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  smarter: defaultProps.beats.smarter,
  smarter2: defaultProps.beats.smarter2,
  aLot: defaultProps.beats.aLot,
  easy: defaultProps.beats.easy,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const MODEL_Y_AT = (f: number) => modelY(f);
export const SOLVED_AT = (f: number, i: number) => SOLVER.solved(f, i);

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the report is read off this.
// ---------------------------------------------------------------------------
const solvedCount = (f: number) => QUESTIONS.filter((_, i) => SOLVER.solved(f, i) > 0).length;

export const STATS = {
  duration: DURATION,
  vScale: Number(V_SCALE.toFixed(5)),
  rings: QUESTIONS.length,

  /** The climb: where the mark is and how fast, every 10 frames. */
  climb: (() => {
    const rows: [number, number, number][] = [];
    for (let f = 0; f <= LAST; f += 10)
      rows.push([f, Number(modelY(f).toFixed(1)), Number(modelV(f).toFixed(3))]);
    rows.push([LAST, Number(modelY(LAST).toFixed(1)), Number(modelV(LAST).toFixed(3))]);
    return rows;
  })(),
  climbAtBeats: [0, 27, 43, 48, 53, 66, 100, 118, 128, 131, LAST].map((f) => [
    f,
    Number(modelY(f).toFixed(1)),
    Number(modelV(f).toFixed(3)),
  ]),
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
  /** The surges, measured: the climb between the frames that bound each. */
  surges: {
    creepTo27: Number((Y_START - modelY(27)).toFixed(1)),
    first27to48: Number((modelY(27) - modelY(48)).toFixed(1)),
    second48to66: Number((modelY(48) - modelY(66)).toFixed(1)),
    long66to128: Number((modelY(66) - modelY(128)).toFixed(1)),
    tail128toEnd: Number((modelY(128) - modelY(LAST)).toFixed(1)),
  },

  /** The cascade: ticks standing, and how many arrived in each 10 frames. */
  solvedPer10: (() => {
    const rows: [string, number, number][] = [];
    let prev = solvedCount(0);
    rows.push(["f0", prev, prev]);
    for (let f = 10; f <= LAST; f += 10) {
      const c = solvedCount(f);
      rows.push([`f${f - 10}-${f}`, c, c - prev]);
      prev = c;
    }
    const cLast = solvedCount(LAST);
    rows.push([`f150-${LAST}`, cLast, cLast - prev]);
    return rows;
  })(),
  /** The longest run of frames in which no ring starts to flip — over the whole
   *  cut, and over the stretch the cascade has to carry (f27 "models" to f140,
   *  the end of speech). */
  longestStillRun: (() => {
    const gapIn = (lo: number, hi: number) => {
      const starts = SOLVER.cross
        .filter((c) => c > lo && c <= hi)
        .sort((a, b) => a - b);
      let worst = { at: lo, len: (starts[0] ?? hi) - lo };
      for (let i = 1; i < starts.length; i++) {
        const gap = starts[i] - starts[i - 1];
        if (gap > worst.len) worst = { at: Number(starts[i - 1].toFixed(1)), len: gap };
      }
      return { afterF: worst.at, frames: Number(worst.len.toFixed(1)) };
    };
    return { whole: gapIn(0, LAST), fromModels: gapIn(27, 140) };
  })(),
  solvedAtBeats: [0, 27, 48, 66, 84, 100, 106, 118, 131, LAST].map((f) => [f, solvedCount(f)]),

  /** The camera: zoom, and the screen speed / acceleration of fixed world
   *  points. The set's ceiling on |dv| is 2.5 screen px/f^2. */
  kAt: [0, 27, 48, 52, 66, 84, 100, 118, 131, LAST].map((f) => [f, Number(kAt(f).toFixed(4))]),
  camAudit: (() => {
    const pts: [number, number][] = [
      [COLUMN.x, COLUMN.yTop],
      [COLUMN.x, COLUMN.yBottom],
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
      maxScreenSpeed: [maxV.f, Number(maxV.v.toFixed(2))],
      maxDV: [maxDV.f, Number(maxDV.v.toFixed(3))],
      minMeanSpeed: [minMean.f, Number(minMean.v.toFixed(3))],
    };
  })(),
  /** The brief's own cap: the fastest any RING moves relative to the frame while
   *  the camera is still tight (k >= 1.6), sway included. */
  ringMaxScreenSpeedWhileClose: (() => {
    let worst = { f: -1, v: 0 };
    for (let f = 1; f <= LAST; f++) {
      if (kAt(f) < 1.6) continue;
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const da = ringSway(f - 1, q.seed);
        const db = ringSway(f, q.seed);
        const a = screenAt(f - 1, gatherX(f - 1, i) + da.dx, q.y + da.dy);
        const b = screenAt(f, gatherX(f, i) + db.dx, q.y + db.dy);
        const v = Math.hypot(b.x - a.x, b.y - a.y);
        if (v > worst.v) worst = { f, v };
      }
    }
    return [worst.f, Number(worst.v.toFixed(2)), `cap ${SPEED_CAP_SCREEN}`];
  })(),
  /** Where the mark actually sits on screen: the tracking shot is supposed to
   *  hold it near 835 and let it lead a little on the surges. */
  markOnScreen: [0, 27, 38, 43, 57, 66, 84, 100, 118, 131, LAST].map((f) => {
    const p = screenAt(f, COLUMN.x, modelY(f));
    return [f, Number(p.x.toFixed(0)), Number(p.y.toFixed(0))];
  }),

  /** Stroke weights on screen, so the one family is one family. */
  stroke: [0, 52, 76, 100, LAST].map((f) => [
    f,
    Number(strokeScreen(kAt(f)).toFixed(2)),
    Number((strokeW(kAt(f)) / 2) * kAt(f)).toFixed(2),
  ]),
  markPxOnScreen: [0, 66, 100, LAST].map((f) => [f, Number((MODEL_MARK * kAt(f)).toFixed(1))]),

  /** THE WIDE SHOT, on the resolved frame: where the ink is, where its centre of
   *  mass sits, and the count above / below the line on "easy". */
  wide: (() => {
    const at = (f: number) => {
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      let sy = 0;
      let n = 0;
      const sw = strokeW(kAt(f)) / 2;
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const d = ringSway(f, q.seed);
        const c = screenAt(f, gatherX(f, i) + d.dx, q.y + d.dy);
        const rr = (q.r + sw) * kAt(f);
        top = Math.min(top, c.y - rr);
        bottom = Math.max(bottom, c.y + rr);
        left = Math.min(left, c.x - rr);
        right = Math.max(right, c.x + rr);
        sy += c.y;
        n += 1;
      }
      const m = screenAt(f, COLUMN.x, modelY(f));
      sy += m.y;
      n += 1;
      top = Math.min(top, m.y - (MODEL_MARK / 2) * kAt(f));
      bottom = Math.max(bottom, m.y + (MODEL_MARK / 2) * kAt(f));
      return {
        f,
        inkY: [Number(top.toFixed(0)), Number(bottom.toFixed(0))],
        inkX: [Number(left.toFixed(0)), Number(right.toFixed(0))],
        centreOfMassY: Number((sy / n).toFixed(0)),
        markScreenY: Number(m.y.toFixed(0)),
      };
    };
    return [at(100), at(131), at(LAST)];
  })(),
  countsAt131: (() => {
    const ly = modelY(131);
    return {
      lineWorldY: Number(ly.toFixed(1)),
      unsolvedAbove: QUESTIONS.filter((q) => q.y < ly).length,
      solvedBelow: QUESTIONS.filter((q) => q.y >= ly).length,
      nearestUnsolvedAboveGapWorld: Number(
        Math.min(...QUESTIONS.filter((q) => q.y < ly).map((q) => ly - q.y)).toFixed(1),
      ),
    };
  })(),
  /** The tail must creep TOWARD the next `?` and not reach it. */
  tailGapWorld: (() => {
    const ly = modelY(LAST);
    const above = QUESTIONS.filter((q) => q.y < ly).map((q) => ly - q.y);
    return Number(Math.min(...above).toFixed(1));
  })(),
  /** THE GATHERED LAYOUT: the rim-to-rim air the relaxation leaves, the widest
   *  travel any ring makes, and where the mass's inner and outer edges end up. */
  gathered: (() => {
    let worst = { i: -1, j: -1, gap: Infinity };
    for (let i = 0; i < QUESTIONS.length; i++) {
      for (let j = i + 1; j < QUESTIONS.length; j++) {
        const gap =
          Math.hypot(GATHERED[i] - GATHERED[j], QUESTIONS[i].y - QUESTIONS[j].y) -
          QUESTIONS[i].r -
          QUESTIONS[j].r;
        if (gap < worst.gap) worst = { i, j, gap };
      }
    }
    const travel = QUESTIONS.map((q, i) => Math.abs(GATHERED[i] - q.x));
    const dxs = QUESTIONS.map((_, i) => Math.abs(GATHERED[i] - COLUMN.x));
    // the same measure taken over EVERY frame of the cut, on the animated x, so
    // the journeys are covered and not only the destinations
    let live = { f: -1, i: -1, j: -1, gap: Infinity };
    for (let f = 0; f <= LAST; f++) {
      for (let i = 0; i < QUESTIONS.length; i++) {
        for (let j = i + 1; j < QUESTIONS.length; j++) {
          const dy = QUESTIONS[i].y - QUESTIONS[j].y;
          if (Math.abs(dy) >= QUESTIONS[i].r + QUESTIONS[j].r + 40) continue;
          const gap =
            Math.hypot(gatherX(f, i) - gatherX(f, j), dy) - QUESTIONS[i].r - QUESTIONS[j].r;
          if (gap < live.gap) live = { f, i, j, gap };
        }
      }
    }
    return {
      minRimGap: Number(worst.gap.toFixed(2)),
      minRimGapAnyFrame: [live.f, `rings ${live.i}/${live.j}`, Number(live.gap.toFixed(2))],
      delayedByCorridor: QUESTIONS.filter(
        (q, i) => GATHER_START[i] > SOLVER.cross[i] + GATHER_DELAY + 1e-6,
      ).length,
      minCentreSep: Number(
        (worst.gap + QUESTIONS[worst.i].r + QUESTIONS[worst.j].r).toFixed(2),
      ),
      travelMin: Number(Math.min(...travel).toFixed(1)),
      travelMax: Number(Math.max(...travel).toFixed(1)),
      innerDx: Number(Math.min(...dxs).toFixed(1)),
      outerDx: Number(Math.max(...dxs).toFixed(1)),
      /** how many are still travelling on the last frame */
      movingAtLast: QUESTIONS.filter(
        (q, i) => Math.abs(gatherX(LAST, i) - gatherX(LAST - 1, i)) > 0.05,
      ).length,
      /** the closest the mark ever comes to a ring's rim, world px */
      markClearance: (() => {
        let w = Infinity;
        for (let f = 0; f <= LAST; f++) {
          const my = modelY(f);
          for (let i = 0; i < QUESTIONS.length; i++) {
            const q = QUESTIONS[i];
            const d = ringSway(f, q.seed);
            w = Math.min(
              w,
              Math.hypot(gatherX(f, i) + d.dx - COLUMN.x, q.y + d.dy - my) - MODEL_EDGE - q.r,
            );
          }
        }
        return Number(w.toFixed(2));
      })(),
    };
  })(),
  ringRadii: [
    Number(Math.min(...QUESTIONS.map((q) => q.r)).toFixed(1)),
    Number(Math.max(...QUESTIONS.map((q) => q.r)).toFixed(1)),
    RING_R,
  ],
  solveFrames: SOLVE_F,
};
