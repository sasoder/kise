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
  QUESTIONS,
  QuestionRing,
  RUNG_FADE_F,
  SPEED_CAP_SCREEN,
  Trail,
  climberAt,
  climberDir,
  climberRungs,
  gatherDur,
  makeSolver,
  ringSway,
  solvedAt,
  strokeScreen,
  strokeW,
} from "./challengeShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 2 of the set: `SamePath`.
// Line (SRT 0:11.160 -> 0:16.960):
//   "why you might not see LLMs go the same path as AlphaGo and AlphaZero and
//    all these kinds of, like, game-playing AIs"
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// THIS CUT'S ONE IDEA, out of that: THE WORD IS "PATH", AND THERE ARE TWO KINDS.
// Ours is the column: a real path, already mostly climbed, with almost nothing
// left above the line — and we draw it, from the mark straight down through the
// mass of ticks to its bottom end, because a path with a bottom end is a path
// that can run out. A game-playing AI's path LAYS ITS OWN RUNGS: a white dot
// rises at 8.4-8.8 world px/f, a `?` fades in a hundred px ahead of it on its
// own line, it reaches it, the `?` flips to a tick on exactly the mechanics the
// column uses, and the next one is already arriving. It never runs out, and the
// first one leaves the top of the frame while the camera is still moving.
// THREE of them, on a fan that never crosses — see DEVIATIONS.
//
// VOCABULARY — `challengeShared`'s. Nothing is invented here: the ring, the
// flip, the ink rungs, the stroke family, the model and its level line are cut
// 1's, and the three things cut 2 adds (the climber dot, its rungs, the trail)
// are exports of that same file so cut 3 stands in the same world. ORANGE IS THE
// MODEL AND ITS LEVEL AND NOTHING ELSE — every climber is white.
//
// DURATION. 5.80 s of speech x 24 = 139.2 -> 139 frames, plus the set's
// 16-frame tail: DURATION = 139 + 16 = 155.
//
// Word -> frame (24 fps from comp start):
//   why 0 · you 12 · might 17 · not 21 · see 25 · LLMs 35 · go 48 · the 53 ·
//   same 57 · path 61 · as 70 · AlphaGo 75 · and 86 · AlphaZero 91 · and 104 ·
//   all 108 · these 110 · kinds 114 · game 120 · playing 126 · AIs 130 ·
//   (speech ends 139)
//
// SOUND-OFF READING TEST — one sentence:
//   "the orange mark has almost no question marks left above it and we draw the
//    line it has already climbed, which has a bottom end; then three white dots
//    come up out to the right of it, each one printing its own question marks
//    ahead of itself and ticking them off as it goes, and the first one climbs
//    straight out of the top of the frame."
//
// ---------------------------------------------------------------------------
// GESTURES — five, and the mechanism that runs under all of them. Nothing else.
//
//  1. f0-40    "why you might        WHAT WE INHERIT, plus a creep-in. f0 is cut
//              not see LLMs"         1's last frame moved on: the same camera to
//              (f0/f12/f25/f35)      2.5 px (k 1.0255 against its 1.0278, the
//                                    mark on screen y 413 against its 444), the
//                                    mass gathered, FOUR `?` still bright above
//                                    the line. One ring (no. 4, flipped 27 frames
//                                    before f0, off screen) is still easing
//                                    inward through f0-20, the camera drifts in
//                                    (k 1.0255 -> 1.069 by f50) without ever
//                                    landing, and at f35 — "LLMs" — the creep
//                                    reaches ring 3 and ONE more `?` turns over.
//                                    That is the last thing our side gains.
//
//  2. f40-58   "go the same PATH"    OUR PATH, DRAWN. A trail at INK_LO and half
//              (f48/f53/f57/f61)     stroke draws DOWN the shaft from the mark
//                                    through the gathered mass to its bottom
//                                    end, arriving at f58 so "path" (f61) lands
//                                    on the finished line. It has a bottom end
//                                    and no fade there: that IS the point.
//
//  3. f50-96   "as ALPHAGO"          THE GLIDE OUT. One long move right and up
//              (f70/f75)             into empty grid, 601 world px of it (cx 540
//                                    -> 928, content y 843 -> 306). The column
//                                    slides down and left but THE MARK NEVER
//                                    LEAVES: it rides the left margin at screen x
//                                    123 at the move's furthest, which is the
//                                    subject staying in shot while we go looking.
//                                    The first climber's ladder breaks the right
//                                    edge at f59 and its dot is in at f66, nine
//                                    frames before "AlphaGo", already rising with
//                                    a `?` ahead and ticks behind.
//
//  4. f96-106  "and ALPHAZERO"       THE SECOND PATH, and the first one getting
//              (f86/f91)             away. The camera's rise decays over the top
//                                    of its arc while the first climber keeps
//                                    going at 8.6 px/f, so it rides up frame on
//                                    its own — it is not chased. The second
//                                    climber's leading rung breaks the lower edge
//                                    at f72 and its dot follows at f77.
//
//  5. f100-140 "and all these kinds  THE PULL-BACK, and the contrast. The camera
//              of game-playing AIs"  comes back down and widens (k 1.090 -> 0.850)
//              (f104/f110/f114/      to the shot that holds both: our mark and its
//               f120/f126/f130)      three remaining bright `?` over the mass on
//                                    the left, and THREE climber paths — a fan
//                                    that never crosses — rising through the right.
//                                    The third rises into the widening frame from
//                                    underneath (ink f92, dot f109) and the FIRST
//                                    ONE LEAVES THE TOP OF THE FRAME at f120,
//                                    while the move is still running. Its path
//                                    has no top.
//
//  6. f140-154 (continues 5)         THE TAIL. A decaying drift continuing the
//                                    pull-back's last velocity — k is still
//                                    falling and cx still sliding on the last
//                                    frame; the two climbers still in frame keep
//                                    rising and keep printing fresh `?` ahead of
//                                    themselves; our mark still creeps at 0.31
//                                    px/f under a `?` it ends 31.9 world px short
//                                    of. THE CUT DOES NOT RESOLVE.
//
//  MECHANISM (whole cut): a climber lays a `?` ahead of itself, reaches it,
//  flips it, and leaves it behind — keyed on the DOT'S DISTANCE ALONG ITS PATH,
//  never on a frame number, exactly as the column is keyed on the level line's
//  y. AMBIENT: each ring's own <= 3 px drift on its own two periods, the grid's
//  parallax and drift, the camera's sway, and a creep that never reaches zero.
//
// ---------------------------------------------------------------------------
// THE GAP ARITHMETIC — how f0 here is cut 1's last frame, four seconds later.
//
// Cut 1 is in at 0:01.340 and 156 frames long, so its last frame is 0:07.798.
// This cut is in at 0:11.160. The gap is 3.362 s = 80.7 -> 80 frames of world
// that the edit does not show, and the climb is authored straight THROUGH it:
// `modelY` is defined from f -400, and
//
//   * modelY(-GAP) = 467.537 = TooEasy's own modelY(155), to 1e-3. Cut 1 ends
//     with the mark there, creeping at 0.804 world px/f, 24.5 px short of the
//     next `?`. (Reproduce with `MODEL_Y_AT(155)` from `./TooEasy`; it is a
//     constant here rather than an import because TooEasy's module-scope
//     collision proofs cost seconds of build time and this file does not need
//     anything else from it.)
//   * over the 80 unshown frames that creep decays 0.804 -> 0.306 px/f and the
//     mark rises 34.1 px, from y 467.5 to Y0 = 433.4. On the way it passes ring
//     4 (y 443.0) — ONE more `?` turned over off screen, which is why this cut
//     opens with four bright ones where cut 1 left five.
//   * inside the cut the creep carries it another 11.6 px to ring 3 (y 422.8)
//     at f35, and 47 px in all: it finishes at y 386.4, 32.3 px short of ring 2
//     (y 354.1) and still moving at 0.303 px/f.
//
// Both ends are SOLVED, not chosen: the velocity track below is scaled by
// V_SCALE so that the two constraints — "starts where cut 1 stopped" and "ring
// 3 flips on LLMs at f35" — hold exactly, which is one linear equation because
// the integral is linear in the scale.
//
// ---------------------------------------------------------------------------
// THE CAMERA — one keyed track (cx, cy and k, one key per frame off a monotone
// Hermite), lightly smoothed and then damped by the shared second-order
// tracker, with 40 frames of pre-roll so it is already moving at f0. Four
// movements, C1-continuous into each other, never a dead stop:
//   f0-50     the creep-in drift, k 1.0255 -> 1.067, inherited from cut 1's own
//             unfinished creep-in (its last frame was still zooming).
//   f50-96    the glide out: cx 540 -> 928, content y 843 -> 306, k -> 1.090.
//             ITS RIGHTWARD REACH IS SET BY THE MARK, not by the climber: the
//             mark sits at screen x 540 - (cx - 540) * k, so keeping it 90 px
//             inside the left edge caps cx at 540 + 450 / k, which at this zoom
//             is 953. The camera stops 25 px short of that.
//   f96-107   the rise decays over the top of its arc. The climber does NOT get
//             chased: it out-runs the camera by 8.6 px/f against 3.4 and rides up
//             frame, which is the whole point of the beat.
//   f100-140  the pull-back: back down and out to k 0.850. It is a LONG
//             deceleration, not a stop — the damper is still 0.047 of k behind
//             its target at f130, so the contrast reads from f126 and the frame
//             is still opening under "AIs" (f130), which is what the set's "the
//             cut does not resolve" asks for.
//   f140-155  a decaying drift continuing it, still moving on the last frame.
// Measured over seven fixed world points: max screen speed 23.6 px/f (f122), max
// |dv| 1.47 px/f^2 (f107, the turn), minimum mean speed 0.278 px/f (f2). The
// fastest anything moves relative to the frame is a climber at 31.9 px/f (f121),
// against the set's 45 ceiling. The frame-to-frame image energy still runs the
// same shape as the first build (0.8 at rest, 5.5 at the peaks): the travel the
// camera gave up is carried by the climbers.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic.
//
//  * THREE CLIMBERS, NOT FOUR — AlphaGo, AlphaZero, and one for "all these
//    kinds". The resolved frame is 1,271 world px wide at k 0.85. The gathered
//    mass is 767 of them (x 157..924, measured off cut 1's own last frame), a
//    path needs 72 px for its rings plus ~90 px of air from the mass, and two
//    neighbouring paths must stay 170 px apart. Four of them need 592 px of band
//    where there are 400: the first build's four tangled — two of their rung
//    chains crossed on screen and the outermost ran half a ring off the right
//    edge. Three read cleanly, so three it is.
//
//  * THE FAN LEANS TOWARD FRAME CENTRE as it rises, and the first climber is
//    DISCOVERED AT THE RIGHT of the frame rather than entering from the lower
//    right. The lean is what lets a climber hide: further back down its own line
//    is further RIGHT, and the opening frame ends at world x 1,067 — a path that
//    leant the other way is inside the opening frame at f0 and cannot be
//    concealed without a pop. The discovery follows from the brief's own "the
//    first climber exits the top around f110-118": the resolved frame's top edge
//    is world y ~ -140, so that climber must be at y < -140 by f118, which at
//    8.6 px/f puts it at y ~ -45 thirty-four frames earlier, high above the
//    column's own top ink at y 205. The camera has to be up there with it, and
//    while a camera is RISING nothing can enter from below it — its bottom edge
//    rises at 6-9 px/f, which is the climbers' own speed. So the first two are
//    revealed by the camera's rightward travel, and the third — which arrives
//    during the pull-back, when the camera is coming back DOWN at 20 px/f — does
//    rise into the frame from underneath as the brief describes.
//
//  * THE FIRST CLIMBER'S RUNGS FLIP ON REACHING but its FIRST TWO are already
//    ticked when it is found (RUNG_BEHIND = 210 px of laid path behind its
//    birth). "Already rising, laying rungs" needs a ladder under it, not a dot
//    with nothing below.
//
//  * FOUR `?` STAND ABOVE THE LINE AT f0, NOT SIX, and three after f35 — see
//    the gap arithmetic above. Six would need the gap creep to stop dead, and
//    "our climb has nearly nothing left above it" is the point of the cut.
//
//  * THE RESOLVED SHOT IS k 0.850 WITH cx 913, wider than cut 1's k 1.03 and
//    panned right of the column's axis. Three things pin it and they are all
//    measured: the column's 1,123 px of ink has to sit inside screen y
//    150..1,350 (k <= 1.069); the mark has to stay 90 screen px inside the left
//    edge (cx <= 540 + 450 / k = 1,069); and every climber's ink has to stay 90
//    px inside the right edge (cx >= its rightmost rim - 450 / k). At 0.850 /
//    913 the mark sits at screen x 201, the mass runs from screen -100 to 530 —
//    its feathered left rim bleeds off frame by about a ring and a half, which is
//    the price of holding the fan beside it — the climbers run 560..971, the
//    column's ink is inside screen y 220..1,250, and a ring is still 61 screen px
//    across, which is 15 px at the 270 px phone check where the `?` and the tick
//    are still different marks (checked on the downscales of f130 and f154).
//
//  * THE THIRD CLIMBER ARRIVES AT f92 (ink) / f109 (dot), not the brief's f100
//    and f112 for a third and a fourth. With three climbers the beats are
//    AlphaGo (ink f59, dot f66), AlphaZero (f72 / f77) and this one, and during
//    the pull-back the frame's bottom edge sweeps up at ~20 world px/f — over
//    twice a climber's own speed — so anything under it arrives at once and a
//    long stagger is not available. They are staggered by path instead: 74, 76
//    and 78 degrees, three different speeds, and their rungs and dots on their
//    own seeds, so nothing about them happens in unison.
//
//  * THE SECOND CLIMBER DOES NOT EXIT THE TOP inside the cut (the brief's
//    "f135-145"): at 8.4 px/f it is still 600 screen px below the top edge on the
//    last frame. Only the first one's path is long enough to leave, and one
//    leaving is what carries "its path has no top" — the other two still climbing
//    on the last frame is the cut refusing to resolve.
// ---------------------------------------------------------------------------

export const DURATION = 155;

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
    why: z.number(),
    see: z.number(),
    llms: z.number(),
    go: z.number(),
    same: z.number(),
    path: z.number(),
    alphaGo: z.number(),
    alphaZero: z.number(),
    all: z.number(),
    kinds: z.number(),
    game: z.number(),
    playing: z.number(),
    ais: z.number(),
    end: z.number(), // speech ends; the tail runs to 155
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
    why: 0,
    see: 25,
    llms: 35,
    go: 48,
    same: 57,
    path: 61,
    alphaGo: 75,
    alphaZero: 91,
    all: 108,
    kinds: 114,
    game: 120,
    playing: 126,
    ais: 130,
    end: 139,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
/** Frames of pre-roll for the camera: it is already moving at f0. */
const PRE = 40;
const FIRST = -PRE;
/** How far back the CLIMB is defined, so every ring cut 1 already answered is
 *  answered here too, with a crossing frame rather than a special case. */
const HISTORY = -400;

// ---------------------------------------------------------------------------
// THE CLIMB
// ---------------------------------------------------------------------------
/** Frames of unshown world between cut 1's last frame and this cut's f0. */
const GAP = 80;
/** Where cut 1 left the mark: `TooEasy.MODEL_Y_AT(155)`. */
const Y_CUT1_END = 467.536905;
/** Cut 1's own velocity there, for the pre-history to leave from. */
const V_CUT1_END = 0.804;
/** The ring the creep reaches inside this cut, and when: "LLMs". */
const FLIP_RING = 3;
const FLIP_F = 35;

/** world px per frame, BEFORE V_SCALE. The shape is one long decay: cut 1's
 *  tail, then a creep that flattens out and never stops. */
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

/** The raw integral of `vBase` from HISTORY, at quarter-frame steps, indexed by
 *  f - HISTORY. Everything below is a difference of two entries, which is why
 *  the scale can be solved in closed form. */
const SUB = 4;
const RAW_I: number[] = (() => {
  const n = LAST + 3 - HISTORY;
  const out: number[] = new Array(n);
  let acc = 0;
  out[0] = 0;
  for (let f = HISTORY; f < LAST + 2; f++) {
    for (let s = 0; s < SUB; s++) {
      const a = f + s / SUB;
      acc += ((vBase(a) + vBase(a + 1 / SUB)) / 2) * (1 / SUB);
    }
    out[f + 1 - HISTORY] = acc;
  }
  return out;
})();
const rawAt = (f: number) => RAW_I[Math.max(0, Math.min(RAW_I.length - 1, Math.round(f) - HISTORY))];
/** raw climb between two frames */
const rawSpan = (a: number, b: number) => rawAt(b) - rawAt(a);

/** SOLVED, not chosen. Two constraints, and the climb is linear in the scale:
 *    Y0 + s * raw(-GAP -> 0)  = Y_CUT1_END      (it starts where cut 1 stopped)
 *    Y0 - s * raw(0 -> FLIP_F) = QUESTIONS[3].y (ring 3 flips on "LLMs")
 *  Subtracting gives the scale outright. */
const V_SCALE = (Y_CUT1_END - QUESTIONS[FLIP_RING].y) / rawSpan(-GAP, FLIP_F);
const Y_START = QUESTIONS[FLIP_RING].y + V_SCALE * rawSpan(0, FLIP_F);

/** The mark's height, and the LEVEL LINE's: one y drives both. */
const modelY = (f: number) => Y_START - V_SCALE * rawSpan(0, f);
const modelV = (f: number) => modelY(f - 1) - modelY(f);

(() => {
  if (Math.abs(modelY(-GAP) - Y_CUT1_END) > 1e-3) {
    throw new Error(
      `SamePath: f0 does not join cut 1 — modelY(-${GAP}) = ${modelY(-GAP).toFixed(3)}, ` +
        `cut 1 ended at ${Y_CUT1_END}.`,
    );
  }
  if (Math.abs(V_SCALE * vBase(-GAP) - V_CUT1_END) > 0.03) {
    throw new Error(
      `SamePath: the pre-history leaves cut 1 at ${(V_SCALE * vBase(-GAP)).toFixed(3)} px/f, ` +
        `not its own ${V_CUT1_END}.`,
    );
  }
  for (let f = FIRST + 1; f <= LAST; f++) {
    const v = modelV(f);
    if (!(v > 0.29)) {
      throw new Error(`SamePath: the creep falls to ${v.toFixed(4)} world px/f at f${f}.`);
    }
  }
})();

// ---------------------------------------------------------------------------
// THE COLUMN'S MECHANISM — unchanged from cut 1, run over a history long enough
// that every ring the model has already answered is answered here by the same
// rule and not by a flag.
// ---------------------------------------------------------------------------
const SOLVER = makeSolver(modelY, HISTORY, LAST + 2);

const gatherSoftMax = (a: number, b: number, e: number) => 0.5 * (a + b + Math.hypot(a - b, e));
const GATHER_KNEE = 14;
const CLEAR_PAD = 6;

/** Could ring j stand in ring i's way on its journey inward? (Cut 1's rule.) */
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

// No two rings touch on any frame of the cut, and the mark never overlaps one.
(() => {
  for (let f = 0; f <= LAST; f++) {
    const my = modelY(f);
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const d = ringSway(f, q.seed);
      const gap = Math.hypot(gatherX(f, i) + d.dx - COLUMN.x, q.y + d.dy - my) - MODEL_EDGE - q.r;
      if (gap < 0) {
        throw new Error(`SamePath: the mark overlaps ring ${i} at f${f} by ${(-gap).toFixed(2)}.`);
      }
      for (let j = i + 1; j < QUESTIONS.length; j++) {
        const dy = QUESTIONS[i].y - QUESTIONS[j].y;
        const reach = QUESTIONS[i].r + QUESTIONS[j].r + CLEAR_PAD;
        if (Math.abs(dy) >= reach) continue;
        const rim =
          Math.hypot(gatherX(f, i) - gatherX(f, j), dy) - QUESTIONS[i].r - QUESTIONS[j].r;
        if (rim < 0) {
          throw new Error(
            `SamePath: rings ${i}/${j} overlap by ${(-rim).toFixed(2)} world px at f${f}.`,
          );
        }
      }
    }
  }
})();

// ...and a ring is in flip iff the level line has reached it, on every frame.
(() => {
  for (let f = 0; f <= LAST; f++) {
    const ly = modelY(f);
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      if (Math.abs(ly - q.y) <= 1e-6) continue;
      if (solvedAt(ly, q) !== SOLVER.solved(f, i) > 0) {
        throw new Error(
          `SamePath: ring ${i} (y ${q.y.toFixed(1)}) disagrees with the line (y ${ly.toFixed(1)}) at f${f}.`,
        );
      }
    }
  }
})();

// ---------------------------------------------------------------------------
// OUR OWN TRAIL. Straight down the shaft from the mark to the bottom of the
// gathered mass, drawn f40-58 so "path" (f61) lands on the finished line. No
// fade at its foot: our path HAS a bottom, and that is what the next forty
// seconds of the cut are compared against.
// ---------------------------------------------------------------------------
const MASS_BOTTOM = Math.max(...QUESTIONS.map((q) => q.y + q.r));
const TRAIL_F0 = 40;
const TRAIL_F1 = 58;
const trailDraw = (f: number) => smoothstep(clamp01((f - TRAIL_F0) / (TRAIL_F1 - TRAIL_F0)));

// ---------------------------------------------------------------------------
// THE CLIMBERS' RUNGS, resolved once. `cross` comes out of `climberRungs` as
// s / speed; the assertion below re-derives it from the DOT'S OWN POSITION so
// the two statements cannot drift apart.
// ---------------------------------------------------------------------------
const RUNGS = CLIMBERS.map((c) => climberRungs(c, FIRST, LAST + 2));

(() => {
  for (let ci = 0; ci < CLIMBERS.length; ci++) {
    const c = CLIMBERS[ci];
    const d = { x: climberAt(c, 1).x - climberAt(c, 0).x, y: climberAt(c, 1).y - climberAt(c, 0).y };
    for (const g of RUNGS[ci]) {
      for (let f = Math.max(FIRST, Math.floor(g.cross) - 30); f <= LAST; f++) {
        const p = climberAt(c, f);
        // signed distance of the dot past the rung, along the path
        const past = (p.x - g.x) * (d.x / c.speed) + (p.y - g.y) * (d.y / c.speed);
        // REACHED = the dot's leading edge has touched the ring's rim.
        const reached = past >= -(g.r + CLIMBER_R) - 1e-9;
        const flipping = f >= g.cross;
        if (reached !== flipping) {
          throw new Error(
            `SamePath: ${c.id} rung at s ${g.s.toFixed(1)} is ${flipping ? "" : "not "}flipping ` +
              `at f${f} but the dot's edge is ${(past + g.r + CLIMBER_R).toFixed(2)} px past its rim.`,
          );
        }
      }
    }
  }
})();

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
/** [frame, cx, content y, k]. The content y is the world point that lands on
 *  screen y 835; `camKnots3` turns it into cy off the eased k. */
const CAM_KNOTS: [number, number, number, number][] = [
  [FIRST, 540, 856.0, 1.0075],
  [-20, 540, 850.0, 1.017],
  [0, 540, 843.24, 1.0278],
  [20, 543, 833.0, 1.041],
  [38, 552, 818.0, 1.057],
  [50, 576, 790.0, 1.072],
  [58, 632, 728.0, 1.082],
  [66, 716, 640.0, 1.089],
  [74, 810, 530.0, 1.092],
  [82, 886, 424.0, 1.09],
  [90, 926, 344.0, 1.086],
  [96, 938, 306.0, 1.084],
  [101, 940, 312.0, 1.078],
  [107, 934, 358.0, 1.058],
  [113, 930, 448.0, 1.018],
  [119, 924, 578.0, 0.965],
  [125, 918, 710.0, 0.91],
  [131, 914, 820.0, 0.868],
  [137, 912, 856.0, 0.853],
  [146, 912, 864.0, 0.8495],
  [155, 911, 867.0, 0.8485],
  [200, 909, 871.0, 0.8465],
];

/** The Hermite through those knots is C1 but not C2, so a light symmetric
 *  Gaussian (no lag of its own, it only rounds curvature) runs over it before
 *  the damper sees it. Measured: it takes the worst |dv| of a fixed world point
 *  from 3.1 to under the set's 2.5 screen px/f^2 ceiling. */
const CAM_SMOOTH = 7.5;
const CAM = (() => {
  const kf = CAM_KNOTS.map((n) => n[0]);
  const xOf = hermite(kf, CAM_KNOTS.map((n) => n[1]));
  const yOf = hermite(kf, CAM_KNOTS.map((n) => n[2]));
  const kOf = hermite(kf, CAM_KNOTS.map((n) => n[3]));
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
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kOf, f), x: gauss(xOf, f), y: gauss(yOf, f) });
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
/** Where a world point sits on screen at frame `f`. */
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return { x: WORLD_W / 2 + (wx - c.cx) * c.k, y: WORLD_H / 2 + (wy - c.cy) * c.k };
};

/** A climber may not be ON SCREEN on the frame it comes into the world, or its
 *  arrival is a pop. Ink checked: the dot, and every rung that has any opacity
 *  by then, at their full radius. */
const climberInk = (ci: number, f: number) => {
  const c = CLIMBERS[ci];
  const p = climberAt(c, f);
  const out: { x: number; y: number; r: number }[] = [{ x: p.x, y: p.y, r: CLIMBER_R }];
  for (const g of RUNGS[ci]) {
    if (f >= g.lit - RUNG_FADE_F) out.push({ x: g.x, y: g.y, r: g.r });
  }
  return out;
};
const inkOnScreen = (f: number, ci: number) => {
  const sw = strokeW(kAt(f)) / 2;
  const k = kAt(f);
  for (const o of climberInk(ci, f)) {
    const s = screenAt(f, o.x, o.y);
    const rr = (o.r + sw) * k;
    if (s.x + rr > 0 && s.x - rr < WORLD_W && s.y + rr > 0 && s.y - rr < WORLD_H) return true;
  }
  return false;
};

(() => {
  const bad = CLIMBERS.map((c, ci) =>
    inkOnScreen(c.born, ci) ? `${c.id} is already on screen on its birth frame f${c.born}` : "",
  ).filter(Boolean);
  if (bad.length) throw new Error(`SamePath: ${bad.join("; ")}.`);
})();

// ---------------------------------------------------------------------------
// THE FOUR FRAMING PROOFS. Every one of them is a thing the eye caught on the
// first build, so every one of them is now a wall the file cannot be built
// through.
// ---------------------------------------------------------------------------

/** 1. THE MODEL IS THE SUBJECT OF THE CLIP AND MAY NEVER LEAVE THE FRAME. Its
 *  centre stays at least this far inside the left edge on EVERY frame, sway
 *  spent — it may sit near the edge while the camera is off finding the other
 *  path, never past it. */
const MARK_MIN_SCREEN_X = 90;
export const MARK_MIN_X = (() => {
  let worst = { f: -1, x: Infinity };
  for (let f = 0; f <= LAST; f++) {
    const s = screenAt(f, COLUMN.x, modelY(f));
    if (s.x < worst.x) worst = { f, x: s.x };
  }
  if (worst.x < MARK_MIN_SCREEN_X) {
    throw new Error(
      `SamePath: the mark reaches screen x ${worst.x.toFixed(1)} at f${worst.f} ` +
        `(floor ${MARK_MIN_SCREEN_X}).`,
    );
  }
  return [worst.f, Number(worst.x.toFixed(1))] as const;
})();

/** 2. THE PATHS NEVER TOUCH. Over every frame and every pair of climbers, the
 *  closest any ink of one comes to any ink of the other, rim to rim. */
const CROSS_CLIMBER_FLOOR = 8;
export const CROSS_CLIMBER_MIN = (() => {
  let worst = { f: -1, v: Infinity, what: "" };
  for (let f = 0; f <= LAST; f++) {
    const ink = CLIMBERS.map((c, ci) => (f < c.born ? [] : climberInk(ci, f)));
    for (let i = 0; i < CLIMBERS.length; i++) {
      for (let j = i + 1; j < CLIMBERS.length; j++) {
        for (const a of ink[i]) {
          for (const b of ink[j]) {
            const d = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
            if (d < worst.v) worst = { f, v: d, what: `${CLIMBERS[i].id}/${CLIMBERS[j].id}` };
          }
        }
      }
    }
  }
  if (worst.v < CROSS_CLIMBER_FLOOR) {
    throw new Error(
      `SamePath: ${worst.what} come within ${worst.v.toFixed(2)} world px at f${worst.f} ` +
        `(floor ${CROSS_CLIMBER_FLOOR}).`,
    );
  }
  return [worst.f, worst.what, Number(worst.v.toFixed(2))] as const;
})();

/** 3. NOTHING RUNS OFF THE RIGHT EDGE in the resolved shot: every dot, rung and
 *  trail end of every climber stays this far inside it from RESOLVED_F on. */
const RESOLVED_F = 126;
const RIGHT_INSET = 90;
export const CLIMBER_MAX_X = (() => {
  let worst = { f: -1, x: -Infinity, id: "" };
  for (let f = RESOLVED_F; f <= LAST; f++) {
    const k = kAt(f);
    const sw = strokeW(k) / 2;
    for (let ci = 0; ci < CLIMBERS.length; ci++) {
      const c = CLIMBERS[ci];
      if (f < c.born) continue;
      const note = (wx: number, wy: number, r: number) => {
        const x = screenAt(f, wx, wy).x + r * k;
        if (x > worst.x) worst = { f, x, id: c.id };
      };
      const p = climberAt(c, f);
      note(p.x, p.y, CLIMBER_R);
      for (const g of RUNGS[ci]) if (f >= g.lit - RUNG_FADE_F) note(g.x, g.y, g.r + sw);
      const b = climberAt(c, c.born);
      note(b.x, b.y, 0);
    }
  }
  if (worst.x > WORLD_W - RIGHT_INSET) {
    throw new Error(
      `SamePath: ${worst.id} reaches screen x ${worst.x.toFixed(1)} at f${worst.f} ` +
        `(ceiling ${WORLD_W - RIGHT_INSET}).`,
    );
  }
  return [worst.f, worst.id, Number(worst.x.toFixed(1))] as const;
})();

/** 4. THE FAN NEVER CLOSES. The horizontal gap between two neighbouring paths,
 *  at every height the resolved frame can see. It is a fan opening downward, so
 *  the minimum is at the top edge; a crossing anywhere on screen would show up
 *  here as a gap under the floor long before the lines met. */
const SPACING_FLOOR = 170;
export const PATH_SPACING = (() => {
  const xAt = (c: (typeof CLIMBERS)[number], y: number) => {
    const d = climberDir(c);
    return c.x + d.dx * ((y - c.y) / d.dy);
  };
  const cam = camAt(LAST);
  const yTop = cam.cy - WORLD_H / 2 / cam.k;
  const yBot = cam.cy + WORLD_H / 2 / cam.k;
  // inner (steepest) to outer, which is how the fan is authored
  const order = [...CLIMBERS].sort((a, b) => b.angle - a.angle);
  const out: [string, number, number][] = [];
  for (let n = 0; n + 1 < order.length; n++) {
    let worst = { v: Infinity, y: 0 };
    for (let y = yTop; y <= yBot; y += 2) {
      const g = Math.abs(xAt(order[n + 1], y) - xAt(order[n], y));
      if (g < worst.v) worst = { v: g, y };
    }
    if (worst.v < SPACING_FLOOR) {
      throw new Error(
        `SamePath: ${order[n].id}/${order[n + 1].id} are ${worst.v.toFixed(1)} world px apart ` +
          `at y ${worst.y.toFixed(0)} (floor ${SPACING_FLOOR}).`,
      );
    }
    out.push([`${order[n].id}-${order[n + 1].id}`, Number(worst.v.toFixed(1)), Number(worst.y.toFixed(0))]);
  }
  return out;
})();

// ---------------------------------------------------------------------------

const SamePath: React.FC<Props> = ({
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
            {/* our own path, under the column the way the level line is: the
                rings it runs through occlude it, so it reads as the thing they
                are threaded on */}
            <Trail
              id="chLlmTrail"
              ax={COLUMN.x}
              ay={ly}
              bx={COLUMN.x}
              by={MASS_BOTTOM}
              k={k}
              draw={trailDraw(frame)}
            />
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
            {CLIMBERS.map((c, ci) => (
              <Climber
                key={c.id}
                c={c}
                rungs={RUNGS[ci]}
                frame={frame}
                k={k}
                opacity={frame >= c.born ? 1 : 0}
              />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SamePath;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  llms: defaultProps.beats.llms,
  path: defaultProps.beats.path,
  alphaGo: defaultProps.beats.alphaGo,
  alphaZero: defaultProps.beats.alphaZero,
  ais: defaultProps.beats.ais,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => camAt(f);
export const MODEL_Y_AT = (f: number) => modelY(f);

// ---------------------------------------------------------------------------
// MEASUREMENTS. Every claim in the report is read off this.
// ---------------------------------------------------------------------------
const brightAbove = (f: number) => QUESTIONS.filter((q) => q.y < modelY(f)).length;

export const STATS = {
  duration: DURATION,
  markMinScreenX: MARK_MIN_X,
  crossClimberMinRim: CROSS_CLIMBER_MIN,
  climberMaxScreenX: CLIMBER_MAX_X,
  pathSpacing: PATH_SPACING,
  vScale: Number(V_SCALE.toFixed(5)),

  /** THE GAP: how f0 joins cut 1's last frame. */
  gap: {
    frames: GAP,
    cut1EndY: Y_CUT1_END,
    joinY: Number(modelY(-GAP).toFixed(3)),
    joinV: Number((V_SCALE * vBase(-GAP)).toFixed(3)),
    climbedInGap: Number((modelY(-GAP) - modelY(0)).toFixed(1)),
    y0: Number(modelY(0).toFixed(1)),
    v0: Number(modelV(0).toFixed(3)),
    flippedInGap: QUESTIONS.map((q, i) => i).filter(
      (i) => SOLVER.cross[i] > -GAP && SOLVER.cross[i] <= 0,
    ),
    brightAtF0: brightAbove(0),
    flipInCut: QUESTIONS.map((q, i) => [i, Number(SOLVER.cross[i].toFixed(2))]).filter(
      (r) => (r[1] as number) > 0 && (r[1] as number) <= LAST,
    ),
    brightAtEnd: brightAbove(LAST),
    endY: Number(modelY(LAST).toFixed(1)),
    endV: Number(modelV(LAST).toFixed(3)),
    gapToNextRingAtEnd: Number(
      Math.min(...QUESTIONS.filter((q) => q.y < modelY(LAST)).map((q) => modelY(LAST) - q.y)).toFixed(
        1,
      ),
    ),
  },

  /** PER CLIMBER: when it first shows ink, when its dot leaves the top, and how
   *  many rungs it turns over inside the cut. */
  climbers: CLIMBERS.map((c, ci) => {
    // when the climber is first SEEN: it renders from `born`, and `born` is
    // chosen so it is still off screen then (asserted above).
    let entry = -1;
    for (let f = c.born; f <= LAST; f++) {
      if (inkOnScreen(f, ci)) {
        entry = f;
        break;
      }
    }
    let dotEntry = -1;
    let exitTop = -1;
    for (let f = 0; f <= LAST; f++) {
      const p = climberAt(c, f);
      const s = screenAt(f, p.x, p.y);
      const r = CLIMBER_R * kAt(f);
      const on = s.x + r > 0 && s.x - r < WORLD_W && s.y + r > 0 && s.y - r < WORLD_H;
      if (on && dotEntry < 0 && f >= c.born) dotEntry = f;
      if (dotEntry >= 0 && exitTop < 0 && s.y + r <= 0) exitTop = f;
    }
    const flipped = RUNGS[ci].filter((g) => g.cross > 0 && g.cross <= LAST).length;
    const litInCut = RUNGS[ci].filter((g) => g.lit > 0 && g.lit <= LAST).length;
    return {
      id: c.id,
      born: c.born,
      angle: c.angle,
      lean: c.lean,
      speed: c.speed,
      firstInk: entry,
      dotOnScreen: dotEntry,
      exitsTop: exitTop,
      rungsFlippedInCut: flipped,
      rungsLitInCut: litInCut,
      rungsTotal: RUNGS[ci].length,
    };
  }),

  /** THE CAMERA. |dv| ceiling for the set is 2.5 screen px/f^2. */
  camPer10: (() => {
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
      [COLUMN.x, COLUMN.yTop],
      [COLUMN.x, COLUMN.yBottom],
      [COLUMN.x, 760],
      [COLUMN.x - 330, 760],
      [COLUMN.x + 330, 760],
      [1200, 400],
      [1300, 1000],
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
  /** Nothing may move faster than the set's cap relative to the frame; the cap
   *  bites at k >= 1.6 and this cut never gets there, so it is reported over the
   *  WHOLE cut for every moving thing. */
  fastestMover: (() => {
    let worst = { f: -1, what: "", v: 0 };
    const note = (f: number, what: string, v: number) => {
      if (v > worst.v) worst = { f, what, v };
    };
    for (let f = 1; f <= LAST; f++) {
      for (let i = 0; i < QUESTIONS.length; i++) {
        const q = QUESTIONS[i];
        const da = ringSway(f - 1, q.seed);
        const db = ringSway(f, q.seed);
        const a = screenAt(f - 1, gatherX(f - 1, i) + da.dx, q.y + da.dy);
        const b = screenAt(f, gatherX(f, i) + db.dx, q.y + db.dy);
        note(f, `ring ${i}`, Math.hypot(b.x - a.x, b.y - a.y));
      }
      for (let ci = 0; ci < CLIMBERS.length; ci++) {
        if (f < CLIMBERS[ci].born) continue;
        const p0 = climberAt(CLIMBERS[ci], f - 1);
        const p1 = climberAt(CLIMBERS[ci], f);
        const a = screenAt(f - 1, p0.x, p0.y);
        const b = screenAt(f, p1.x, p1.y);
        note(f, CLIMBERS[ci].id, Math.hypot(b.x - a.x, b.y - a.y));
      }
    }
    return [worst.f, worst.what, Number(worst.v.toFixed(2)), `cap ${SPEED_CAP_SCREEN}`];
  })(),

  /** Stroke weights on screen, so the one family stays one family. */
  stroke: [0, 52, 92, 128, LAST].map((f) => [
    f,
    Number(strokeScreen(kAt(f)).toFixed(2)),
    Number(((strokeW(kAt(f)) / 2) * kAt(f)).toFixed(2)),
  ]),
  markPxOnScreen: [0, 92, 128, LAST].map((f) => [f, Number((MODEL_MARK * kAt(f)).toFixed(1))]),

  /** THE CONTRAST SHOT: where the ink is, where its centre of mass sits, and
   *  where the mark is. Measured over the column AND everything the climbers
   *  have on screen. */
  wide: [104, 130, LAST].map((f) => {
    let top = Infinity;
    let bottom = -Infinity;
    let left = Infinity;
    let right = -Infinity;
    let brightBottom = -Infinity;
    let sy = 0;
    let sx = 0;
    let n = 0;
    const kk = kAt(f);
    const sw = strokeW(kk) / 2;
    const note = (wx: number, wy: number, r: number, bright: boolean) => {
      const c = screenAt(f, wx, wy);
      if (c.x < -400 || c.x > WORLD_W + 400) return;
      const rr = (r + sw) * kk;
      top = Math.min(top, c.y - rr);
      bottom = Math.max(bottom, c.y + rr);
      left = Math.min(left, c.x - rr);
      right = Math.max(right, c.x + rr);
      if (bright) brightBottom = Math.max(brightBottom, c.y + rr);
      sy += c.y;
      sx += c.x;
      n += 1;
    };
    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      note(gatherX(f, i), q.y, q.r, SOLVER.solved(f, i) <= 0);
    }
    note(COLUMN.x, modelY(f), MODEL_MARK / 2, true);
    for (let ci = 0; ci < CLIMBERS.length; ci++) {
      if (f < CLIMBERS[ci].born) continue;
      const p = climberAt(CLIMBERS[ci], f);
      note(p.x, p.y, CLIMBER_R, true);
      for (const g of RUNGS[ci]) {
        if (f < g.lit - RUNG_FADE_F) continue;
        note(g.x, g.y, g.r, f < g.cross);
      }
    }
    const m = screenAt(f, COLUMN.x, modelY(f));
    return {
      f,
      k: Number(kk.toFixed(4)),
      inkY: [Number(top.toFixed(0)), Number(bottom.toFixed(0))],
      inkX: [Number(left.toFixed(0)), Number(right.toFixed(0))],
      lowestBrightInk: Number(brightBottom.toFixed(0)),
      centreOfMass: [Number((sx / n).toFixed(0)), Number((sy / n).toFixed(0))],
      mark: [Number(m.x.toFixed(0)), Number(m.y.toFixed(0))],
    };
  }),
};
