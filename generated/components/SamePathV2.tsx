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
  BOARDS,
  COLUMN,
  GATHERED,
  GATHER_DELAY,
  GATHER_MARK_PAD,
  GO_CELL,
  GO_MARK_GAP,
  GO_MARK_PX,
  GO_N,
  GO_RECORDS,
  GO_STONE_R,
  GoBoard,
  INK,
  LEVEL_HALF_LEN,
  LevelLine,
  MODEL_EDGE,
  MODEL_MARK,
  ModelMark,
  QUESTIONS,
  QuestionRing,
  SPEED_CAP_SCREEN,
  Trail,
  boardMovesAt,
  gatherDur,
  goHalf,
  goMoveFrame,
  goRecordOf,
  goStoneAt,
  makeSolver,
  ringSway,
  solvedAt,
  strokeScreen,
  strokeW,
} from "./challengeShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 2 of the set, VERSION 2:
// `SamePathV2`. Line (SRT 0:11.160 -> 0:16.960):
//   "why you might not see LLMs go the same path as AlphaGo and AlphaZero and
//    all these kinds of, like, game-playing AIs"
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// WHY THERE IS A V2 — the director's note on V1, verbatim: "I don't like how
// AlphaGo is visualized. Utilize logos here, and the camera should pan
// completely to the right so that the OpenAI logo together with the
// questions/answers are not visible. Make the part with AlphaGo look more like
// an actual Go game."
//
// So the second half of the cut is rebuilt. V1's abstract climbers are gone.
// In their place: A REAL GO GAME, ON A REAL BOARD, UNDER THE MARK OF THE LAB
// THAT BUILT THE PLAYER, and ONE pan that carries the whole column, the model
// and its orange level line off the left of the frame for good.
//
// THIS CUT'S ONE IDEA, out of that: THE WORD IS "PATH", AND THERE ARE TWO
// KINDS. Ours is the column: a real path, already mostly climbed, with almost
// nothing left above the line — and we draw it, from the mark straight down
// through the mass of ticks to its bottom end, because a path with a bottom end
// is a path that can run out. A game-playing AI's path is a GAME: a board that
// is never finished, one stone every three frames, for ever. We leave ours
// behind to go and look at it.
//
// VOCABULARY — `challengeShared`'s, plus the Go vocabulary appended to that
// same file (so cut 3 V2 stands in the same world) and the DeepMind mark
// appended to `brandGlyphs`. Nothing is invented here. The board is the clip's
// OWN MATERIAL: the background of every cut in this style is a grid, and a Go
// board is that grid made precise — the same white line at the level line's own
// half stroke, the same two opacities, the same per-icon shadow. A white stone
// is a filled disc at INK_HI; a black stone is a disc filled with the field's
// own tone and outlined at INK_HI, so the board's lines vanish under it exactly
// as they do under a real stone; a black stone is that disc filled with the
// scene's own dark base under a hairline INK_LO rim. ORANGE IS THE MODEL AND
// ITS LEVEL AND NOTHING ELSE — there is no orange anywhere on the game side of
// the world, the last orange pixel leaves the frame at f68 and the last column
// ring at f75, and neither ever comes back.
//
// DURATION. 5.80 s of speech x 24 = 139.2 -> 139 frames, plus the set's
// 16-frame tail: DURATION = 139 + 16 = 155. Unchanged from V1.
//
// Word -> frame (24 fps from comp start):
//   why 0 · you 12 · might 17 · not 21 · see 25 · LLMs 35 · go 48 · the 53 ·
//   same 57 · path 61 · as 70 · AlphaGo 75 · and 86 · AlphaZero 91 · and 104 ·
//   all 108 · these 110 · kinds 114 · game 120 · playing 126 · AIs 130 ·
//   (speech ends 139)
//
// SOUND-OFF READING TEST — one sentence:
//   "the orange mark has almost no question marks left above it and we draw the
//    line it has already climbed, which has a bottom end; then the camera
//    swings right, leaves all of that behind, and finds a Go board with the
//    Google DeepMind mark over it playing itself a stone at a time — and as it
//    pulls back there is another one below it, and another four around them,
//    all still playing."
//
// ---------------------------------------------------------------------------
// GESTURES — five, and the mechanism that runs under all of them. Nothing else.
//
//  1. f0-40    "why you might        WHAT WE INHERIT, plus a creep-in. f0 is cut
//              not see LLMs"         1's last frame moved on — V1's column half
//              (f0/f12/f25/f35)      verbatim, down to the arithmetic below: the
//                                    same climb, the mass gathered, FOUR `?`
//                                    still bright above the line, one ring still
//                                    easing inward through f0-20, and at f35 —
//                                    "LLMs" — the creep reaches ring 3 and ONE
//                                    more `?` turns over. That is the last thing
//                                    our side ever gains. (The camera tops out at
//                                    k 1.050 at f34 and starts leaning back from
//                                    f25 rather than climbing to V1's 1.072: the
//                                    pan cannot be paid for otherwise. See THE
//                                    CAMERA.)
//
//  2. f40-58   "go the same PATH"    OUR PATH, DRAWN. A trail at INK_LO and half
//              (f48/f53/f57/f61)     stroke draws DOWN the shaft from the mark
//                                    through the gathered mass to its bottom
//                                    end, arriving at f58 so "path" (f61) lands
//                                    on the finished line. It has a bottom end
//                                    and no fade there: that IS the point.
//
//  3. f41-88   "as ALPHAGO"          THE PAN. ONE move right, 1,168 world px of
//              (f70/f75)             it, cx 552 -> 1720, riding on a zoom that
//                                    is leaning back the whole way (k 1.050 at
//                                    f34 down to 0.835 at the landing), so the
//                                    frame's own travel peaks at 42.9 screen
//                                    px/f against the set's 45 ceiling. THE
//                                    COLUMN, THE MARK AND THE ORANGE LINE GO OUT
//                                    OF THE LEFT OF THE FRAME AND NEVER COME
//                                    BACK: the LAST ORANGE leaves at f68 (the
//                                    level line is wound in on the pan's own
//                                    curve as we go) and the LAST RING at f75,
//                                    the frame "AlphaGo" lands on — both
//                                    asserted at module scope frame by frame,
//                                    over every ring at its gathered x plus its
//                                    sway plus its full radius, the mark's own
//                                    box and the level line's current length.
//                                    From f77 the column is not even drawn. Board 1 is RULED IN ahead of the
//                                    camera (f48-60, from its top-left corner
//                                    outward), so it is a complete board — star
//                                    points and all — when it is found, and its
//                                    first stone lands at f60, fifteen frames
//                                    before "AlphaGo", with the DeepMind mark
//                                    standing over it and six stones down by f75.
//
//  4. f88-104  "and ALPHAZERO"       THE SECOND BOARD, found by pulling back. It
//              (f86/f91)             was there the whole time, out of frame,
//                                    playing an ALPHAGO ZERO SELF-PLAY game (a
//                                    different real record from board 1's, so the
//                                    two are not one game shown twice) already 38
//                                    moves in, with its own mark. Nothing fades
//                                    on; the camera simply comes back far enough
//                                    to see it. Payoff off frame.
//
//  5. f104-140 "and all these kinds  THE CROWD. The pull-back keeps going and
//              of game-playing AIs"  four more games come into frame around the
//              (f104/f110/f114/      two — the same two records at other phases
//               f120/f126/f130)      and other paces, at 0.46 to 0.60 of the
//                                    size, which is what "further away" looks
//                                    like. On the last frame they stand at 41,
//                                    25, 54 and 18 moves against board 1's 32 and
//                                    board 2's 65, so no two boards in the wide
//                                    shot show the same position. Every one of
//                                    them is placing stones on its own beat; no
//                                    two of them are ever in lockstep.
//
//  6. f140-154 (continues 5)         THE TAIL. A decaying drift continuing the
//                                    pull-back's last velocity — k is still
//                                    falling and cx still sliding on the last
//                                    frame, and all six games place more stones
//                                    after it. THE CUT DOES NOT RESOLVE.
//
//  MECHANISM (whole cut): a board plays itself one stone every `pace` frames,
//  for ever, and a stone that loses its last liberty is taken off — the RULES,
//  run once at module scope over each real record, never a frame number. Two
//  captures fall inside the cut: board 2 loses a stone at f55 (off frame) and
//  board 3 at f118.
//  AMBIENT: each ring's own <= 3 px drift on its own two periods (while the
//  column is still in shot), the grid's parallax and drift, the camera's sway,
//  the creep that never reaches zero, and the stone-landing ease.
//
// ---------------------------------------------------------------------------
// DEVIATIONS FROM THE CUT BRIEF, with the arithmetic.
//
//  * OUR SIDE OF THE WORLD IS GONE BY "ALPHAGO" (f75), not by the brief's f74,
//    and it takes two things rather than one to get there. The level line's tip
//    sits at world x 1010, 70 px further right than the outermost gathered ring
//    (940) and 470 px further right than the mark, so left alone IT is the last
//    orange and it hangs off the left edge four frames past the word. It is
//    WOUND IN instead, 470 -> 80 on the pan's own curve (see `levelHalf`), which
//    takes the last orange out at f68. The rings then bind, and the pan starts at
//    f41 rather than f43 to take the last of them out at f75 exactly. Both are
//    asserted separately. The price is that "path" (f61) now lands with the mark
//    at screen x 78 rather than 116 — still whole, still carrying its drawn
//    trail, and leaving.
//
//  * BOARD 1's FIRST STONE IS AT f60, NOT f70, and its lines are ruled in
//    f48-60 rather than f58-70. At the brief's timing the board carried TWO
//    stones on "AlphaGo" and read as an empty grid on the beat that names it.
//    At f60 it has six by f75 — two corners and two approaches, a real opening —
//    and 32 by the last frame.
//
//  * BOARD 2 PLAYS A DIFFERENT REAL GAME. The brief allows the same record at
//    another phase; at 828 px, side by side and both in frame from f88 on, two
//    phases of one game read as one board copying the other. Board 2 gets an
//    AlphaGo Zero 40-block SELF-PLAY game instead — which is what "AlphaZero"
//    means — and the crowd alternates the two records.
//
//  * THE CROWD'S PACES ARE 4, 5, 4 AND 6, NOT 3. Six boards cannot all run at
//    pace 3 without two of them sharing a phase and placing every stone in
//    unison for the whole cut; there are only three phases. The two NAMED boards
//    keep the brief's 3.
//
//  * THE SETTLED SHOT IS k 0.555 WITH ITS INK IN SCREEN y 199..1398, not the
//    brief's 0.72 and 1350. Boards 1 and 2 are 1,020 world px apart centre to
//    centre plus their own 828, so the composition is 2,165 world px tall
//    including board 1's nameplate; at k 0.72 that is 1,559 screen px and does
//    not fit above the captions at all. 0.555 puts the ink centre of mass at
//    screen (601, 863) and the lowest ink — board 6's bottom line, a crowd
//    board — 48 px into the caption band.
//
// ---------------------------------------------------------------------------
// THE GAP ARITHMETIC — how f0 here is cut 1's last frame, four seconds later.
// IDENTICAL TO V1: the column half of this cut is V1's, verbatim.
//
// Cut 1 is in at 0:01.340 and 156 frames long, so its last frame is 0:07.798.
// This cut is in at 0:11.160. The gap is 3.362 s = 80.7 -> 80 frames of world
// that the edit does not show, and the climb is authored straight THROUGH it:
// `modelY` is defined from f -400, and
//
//   * modelY(-GAP) = 467.537 = TooEasy's own modelY(155), to 1e-3. Cut 1 ends
//     with the mark there, creeping at 0.804 world px/f, 24.5 px short of the
//     next `?`.
//   * over the 80 unshown frames that creep decays 0.804 -> 0.306 px/f and the
//     mark rises 34.1 px, from y 467.5 to Y0 = 433.4. On the way it passes ring
//     4 (y 443.0) — ONE more `?` turned over off screen, which is why this cut
//     opens with four bright ones where cut 1 left five.
//   * inside the cut the creep carries it another 11.6 px to ring 3 (y 422.8)
//     at f35, and 47 px in all.
//
// Both ends are SOLVED, not chosen: the velocity track below is scaled by
// V_SCALE so that the two constraints — "starts where cut 1 stopped" and "ring
// 3 flips on LLMs at f35" — hold exactly, which is one linear equation because
// the integral is linear in the scale.
//
// ---------------------------------------------------------------------------
// THE CAMERA — one keyed track (cx, cy and k, one key per frame off a monotone
// Hermite), lightly smoothed and then damped by the shared second-order
// tracker, with 40 frames of pre-roll so it is already moving at f0.
//
// THE ZOOM IS MONOTONE DOWN FROM f34 TO THE LAST FRAME. That is the whole
// solution to the pan, and it is worth the paragraph. The column is at world x
// 540, its gathered rings reach x 978 and the orange level line reaches 1010, so
// the frame is not clear of them until its left edge passes 1010 — which at the
// landing zoom needs cx past 1641; and board 1 has to sit far enough right that
// the RESOLVED frame, 1,946 world px wide at k 0.555, still has all of that
// outside it. That is 1,168 world px of travel, and it has to happen between
// "path" (f61, which must land with the mark and its drawn trail in shot) and
// "AlphaGo" (f75). An eased move that long peaks near 50 world px/f; at k 1.05
// that is 52 screen px/f and the set's ceiling is 45. Pushing the k DOWN through
// the middle of the pan is what buys it back: the product of the two curves
// peaks at 42.9 screen px/f (f61), measured over seven fixed world points. The
// alternative — pull back to travel, push in to arrive, pull back again for the
// crowd — is three reversals of zoom in seventy frames, which reads as pumping.
// One long lean-back reads as one move.
//
//   f-40-34   the creep-in, inherited from cut 1's own unfinished creep-in
//             (k 1.0075 -> 1.050, cx 540 -> 551). It tops out on "LLMs".
//   f25-69    the lean-back (k 1.050 -> 0.856 on the target track, 0.835 damped
//             at the landing). It STARTS BEFORE THE PAN, so the zoom leads the
//             travel instead of beginning with it.
//   f41-77    THE PAN: cx 552 -> 1720, content y 820 -> 640. The last orange
//             leaves the frame at f68 and the last ring at f75; the column is
//             not drawn from f77.
//   f68-118   THE PULL-BACK, overlapping the pan's own tail so the frame never
//             stops opening: cx +330, content y +588, k -> 0.561. Board 2 is
//             found first because it is nearest; the four crowd boards arrive as
//             the frame keeps opening, all six in shot by f124.
//   f140-155  a decaying drift continuing it, still moving on the last frame.
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
// THE CLIMB — V1's, unchanged.
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
      `SamePathV2: f0 does not join cut 1 — modelY(-${GAP}) = ${modelY(-GAP).toFixed(3)}, ` +
        `cut 1 ended at ${Y_CUT1_END}.`,
    );
  }
  if (Math.abs(V_SCALE * vBase(-GAP) - V_CUT1_END) > 0.03) {
    throw new Error(
      `SamePathV2: the pre-history leaves cut 1 at ${(V_SCALE * vBase(-GAP)).toFixed(3)} px/f, ` +
        `not its own ${V_CUT1_END}.`,
    );
  }
  for (let f = FIRST + 1; f <= LAST; f++) {
    const v = modelV(f);
    if (!(v > 0.29)) {
      throw new Error(`SamePathV2: the creep falls to ${v.toFixed(4)} world px/f at f${f}.`);
    }
  }
})();

// ---------------------------------------------------------------------------
// THE COLUMN'S MECHANISM — cut 1's, run over a history long enough that every
// ring the model has already answered is answered here by the same rule.
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
        throw new Error(`SamePathV2: the mark overlaps ring ${i} at f${f} by ${(-gap).toFixed(2)}.`);
      }
      for (let j = i + 1; j < QUESTIONS.length; j++) {
        const dy = QUESTIONS[i].y - QUESTIONS[j].y;
        const reach = QUESTIONS[i].r + QUESTIONS[j].r + CLEAR_PAD;
        if (Math.abs(dy) >= reach) continue;
        const rim =
          Math.hypot(gatherX(f, i) - gatherX(f, j), dy) - QUESTIONS[i].r - QUESTIONS[j].r;
        if (rim < 0) {
          throw new Error(
            `SamePathV2: rings ${i}/${j} overlap by ${(-rim).toFixed(2)} world px at f${f}.`,
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
          `SamePathV2: ring ${i} (y ${q.y.toFixed(1)}) disagrees with the line (y ${ly.toFixed(1)}) at f${f}.`,
        );
      }
    }
  }
})();

// ---------------------------------------------------------------------------
// OUR OWN TRAIL. Straight down the shaft from the mark to the bottom of the
// gathered mass, drawn f40-58 so "path" (f61) lands on the finished line. No
// fade at its foot: our path HAS a bottom, and that is what the whole second
// half of the cut is compared against.
// ---------------------------------------------------------------------------
const MASS_BOTTOM = Math.max(...QUESTIONS.map((q) => q.y + q.r));
const TRAIL_F0 = 40;
const TRAIL_F1 = 58;
const trailDraw = (f: number) => smoothstep(clamp01((f - TRAIL_F0) / (TRAIL_F1 - TRAIL_F0)));

// ---------------------------------------------------------------------------
// THE LEVEL LINE IS WOUND IN AS WE LEAVE IT — cut 3 (`EquallyStrong`)'s own
// trick, and here for the same reason it was invented there. The line reaches
// 470 world px either side of the mark, which is 140 px FURTHER RIGHT than any
// ring in the column; left alone it is the last orange in the frame and it is
// still hanging off the left edge four frames after "AlphaGo" — exactly the
// thing the director asked to be rid of.
//
// `levelHalf` eases it 470 -> 80 ON THE PAN'S OWN CURVE, so (a) it has zero
// slope at the glide's first frame and the join is untouched, (b) it is fastest
// exactly when the camera is, so the end that moves is always travelling with
// the frame rather than against it, and (c) the end that moves is inside the
// line's own outer-quarter FADE the whole way, so the change cannot be seen
// happening. At "path" (f61) the line is still 243 px a side with the mark at
// screen x 78; by f75 it is 82 and its tip is at world x 622, 282 px outside the
// frame's own left edge.
// ---------------------------------------------------------------------------
const LEVEL_HALF_END = 80;
const levelHalf = (f: number) =>
  lerp(LEVEL_HALF_LEN, LEVEL_HALF_END, seg(f, PAN_F0, PAN_F1));

// ---------------------------------------------------------------------------
// BOARD 1 IS RULED IN AHEAD OF THE CAMERA. f58 is the frame its left edge first
// touches the frame's right edge, so the board is being drawn exactly while it
// is being approached, and it is a complete board — star points and all — four
// frames before its first stone.
// ---------------------------------------------------------------------------
const BOARD1_DRAW_F0 = 48;
const BOARD1_DRAW_F1 = 60;
const board1Draw = (f: number) =>
  smoothstep(clamp01((f - BOARD1_DRAW_F0) / (BOARD1_DRAW_F1 - BOARD1_DRAW_F0)));

// ---------------------------------------------------------------------------
// THE CAMERA — three movements and a drift, each one an eased segment, SUMMED
// rather than chained, so the track is one continuous function of the frame and
// there is no junction anywhere for the move to come to a stop at.
//
// It is authored as a CURVE and sampled at every integer frame, not as a
// handful of knots on a Hermite: a key per frame is what makes the linear
// interpolation inside the damper exact (see `camMove`'s note in fieldShared),
// and here the curve is the thing that was actually solved, so there is nothing
// for a Hermite to invent between keys. The shared Gaussian still runs over it
// — it costs nothing on an already-smooth track and it guarantees C2 into the
// damper — and the damper is `runCam3`, the set's own.
//
// `seg(f, f0, f1, w)` is `camEase`: a smoothstep on `u^w`, zero slope at both
// ends, so every one of these segments leaves and arrives at rest and their sum
// has no corner.
//
//   the creep-in    f-40 -> 40   cx +12, content y -36, k 1.0075 -> 1.048.
//                                Cut 1's own unfinished creep-in, carried on;
//                                it tops out on "LLMs" (f35).
//   the lean-back   f25 -> 69    k -> 0.856. IT STARTS BEFORE THE PAN AND ENDS
//                                BEFORE IT: the zoom leads the travel, and it
//                                is what keeps the travel legal. See below.
//   THE PAN         f43 -> 77    cx 552 -> 1720, content y 820 -> 640.
//   the pull-back   f68 -> 118   cx +330, content y +588, k -> 0.561. It OVERLAPS
//                                the end of the pan, which is why the frame
//                                never stops opening between "AlphaGo" and
//                                "AlphaZero".
//   the drift       f104 -> 260  cx +90, content y +120, k -0.03, of which the
//                                cut only ever sees the first fifth: the camera
//                                is still moving on the last frame.
//
// WHY THE ZOOM LEANS BACK THROUGH THE PAN. The column is at world x 540 and the
// frame is not clear of its ink and of the orange level line's 470 px reach
// until the camera's left edge passes world x 1010 — which at these zooms needs
// cx past 1640 — while "path" (f61) still has to land with the mark and its
// drawn trail in shot. That is 1,168 world px of travel with a hard deadline at
// each end. An eased move that long peaks near 50 world px/f, and at k 1.05
// that is 52 screen px/f against the set's 45 ceiling. Pushing k DOWN through
// the middle of the move is what buys it back: the product of the two curves
// peaks at 42.9 screen px/f (f61), measured over seven fixed world points. The alternative — pull back to travel, push
// in to arrive, pull back again for the crowd — is three reversals of zoom in
// seventy frames, which reads as pumping. ONE LONG LEAN-BACK READS AS ONE MOVE,
// and the zoom is monotone decreasing from f25 to the last frame, which is
// asserted below on `kOf` itself.
// ---------------------------------------------------------------------------
const camEase = (u: number, warp: number) => smoothstep(Math.pow(clamp01(u), warp));
const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);

/** The pan: where it starts, where it ends, and how far it goes. */
const PAN_F0 = 41;
const PAN_F1 = 77;
const PAN_DX = BOARDS[0].x - 552; // 552 is where the creep-in leaves cx
/** The lean-back, and the zoom it lands on — the landing framing for board 1. */
const LEAN_F0 = 25;
const LEAN_F1 = 69;
const K_LAND = 0.856;
/** The pull-back, and the zoom the wide shot settles at. */
const OUT_F0 = 68;
const OUT_F1 = 118;
const OUT_DX = 330;
const OUT_DY = 588;
const K_WIDE = 0.561;
/** ...and the drift that is still running when the cut ends. */
const DRIFT_F0 = OUT_F1 - 14;
const DRIFT_F1 = 260;

const cxOf = (f: number) =>
  540 +
  12 * seg(f, FIRST, 40, 1.3) +
  PAN_DX * seg(f, PAN_F0, PAN_F1) +
  OUT_DX * seg(f, OUT_F0, OUT_F1, 0.8) +
  90 * seg(f, DRIFT_F0, DRIFT_F1);
const contentYOf = (f: number) =>
  856 -
  36 * seg(f, FIRST, 40, 1.3) -
  180 * seg(f, PAN_F0, PAN_F1) +
  OUT_DY * seg(f, OUT_F0, OUT_F1, 0.8) +
  120 * seg(f, DRIFT_F0, DRIFT_F1);
const kOf = (f: number) =>
  1.0075 +
  0.0405 * seg(f, FIRST, 32, 1.3) -
  (1.048 - K_LAND) * seg(f, LEAN_F0, LEAN_F1) -
  (K_LAND - K_WIDE) * seg(f, OUT_F0, OUT_F1, 0.8) -
  0.03 * seg(f, DRIFT_F0, DRIFT_F1);

/** The Gaussian the whole set runs before the damper: no lag of its own, it
 *  only rounds curvature. */
const CAM_SMOOTH = 7.5;
const CAM = (() => {
  const hold = (fn: (f: number) => number) => (f: number) =>
    fn(Math.max(FIRST, Math.min(DRIFT_F1, f)));
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
  const x = hold(cxOf);
  const y = hold(contentYOf);
  const kk = hold(kOf);
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kk, f), x: gauss(x, f), y: gauss(y, f) });
  }
  return camKnots3(knots, LAST + 2 - FIRST);
})();

/** THE ZOOM NEVER TURNS ROUND after the creep-in tops out. */
(() => {
  for (let f = 34; f <= LAST; f++) {
    if (kOf(f) > kOf(f - 1) + 1e-9) {
      throw new Error(`SamePathV2: the zoom reverses at f${f}.`);
    }
  }
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

// ---------------------------------------------------------------------------
// THE PROOFS. Every one of them is a thing the director asked for, so every one
// of them is a wall the file cannot be built through.
// ---------------------------------------------------------------------------

/** 1. THE PAN LEAVES OUR SIDE OF THE WORLD BEHIND AND NEVER GOES BACK.
 *
 *  "the camera should pan completely to the right so that the OpenAI logo
 *  together with the questions/answers are not visible."
 *
 *  Taken literally and split in two, because they are two different kinds of
 *  ink and the director named both:
 *
 *    ORANGE  — the mark at its own half-box, and the level line at BOTH ends of
 *              its CURRENT `levelHalf` (its outer quarter is a fade, but a fade
 *              is still orange, so the whole length counts).
 *    RINGS   — every question at its gathered x plus its sway plus its full
 *              radius and half a stroke.
 *
 *  Each is projected to screen on every frame and the first frame from which it
 *  is never in the frame again is recorded. BOTH must be clear by "AlphaGo"
 *  (f75), and from f75 to the last frame there is no orange pixel and no column
 *  ring anywhere in the frame. */
const COLUMN_CLEAR_CEILING = defaultProps.beats.alphaGo;

const clearFrameOf = (inFrame: (f: number) => boolean) => {
  for (let f = LAST; f >= 0; f--) if (inFrame(f)) return f + 1;
  return 0;
};

const hitAt = (f: number, wx: number, wy: number, r: number) => {
  const k = kAt(f);
  const s = screenAt(f, wx, wy);
  const rr = r * k;
  return s.x + rr > 0 && s.x - rr < WORLD_W && s.y + rr > 0 && s.y - rr < WORLD_H;
};

export const ORANGE_CLEAR_F = clearFrameOf((f) => {
  const sw = strokeW(kAt(f)) / 2;
  const my = modelY(f);
  const half = levelHalf(f);
  return (
    hitAt(f, COLUMN.x, my, MODEL_EDGE) ||
    hitAt(f, COLUMN.x + half, my, sw / 2) ||
    hitAt(f, COLUMN.x - half, my, sw / 2)
  );
});

export const RING_CLEAR_F = clearFrameOf((f) => {
  const sw = strokeW(kAt(f)) / 2;
  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const d = ringSway(f, q.seed);
    if (hitAt(f, gatherX(f, i) + d.dx, q.y + d.dy, q.r + sw)) return true;
  }
  return false;
});

export const COLUMN_CLEAR_F = (() => {
  const clear = Math.max(ORANGE_CLEAR_F, RING_CLEAR_F);
  if (clear > COLUMN_CLEAR_CEILING) {
    throw new Error(
      `SamePathV2: our side of the world is still in frame at f${clear - 1} ` +
        `(orange clears f${ORANGE_CLEAR_F}, rings clear f${RING_CLEAR_F}; ` +
        `both must be clear by f${COLUMN_CLEAR_CEILING}).`,
    );
  }
  return clear;
})();

/** 2. THE SET'S SPEED CEILING. The screen velocity of fixed world points —
 *  seven of them, spread across both sides of the world — over the whole cut,
 *  and the frame-to-frame change in it. Nothing in this cut moves except the
 *  camera and the ring sway, so this IS the motion audit. */
const CAM_PROBES: [number, number][] = [
  [COLUMN.x, COLUMN.yTop],
  [COLUMN.x, COLUMN.yBottom],
  [COLUMN.x, 760],
  [COLUMN.x + 330, 760],
  [BOARDS[0].x, BOARDS[0].y],
  [BOARDS[1].x, BOARDS[1].y],
  [BOARDS[2].x, BOARDS[2].y],
];

export const CAM_AUDIT = (() => {
  let maxV = { f: -1, v: 0 };
  let maxDV = { f: -1, v: 0 };
  let minMean = { f: -1, v: Infinity };
  for (let f = 2; f <= LAST; f++) {
    let sum = 0;
    for (const [px, py] of CAM_PROBES) {
      const a = screenAt(f - 2, px, py);
      const b = screenAt(f - 1, px, py);
      const c = screenAt(f, px, py);
      const v1 = Math.hypot(b.x - a.x, b.y - a.y);
      const v2 = Math.hypot(c.x - b.x, c.y - b.y);
      sum += v2;
      if (v2 > maxV.v) maxV = { f, v: v2 };
      if (Math.abs(v2 - v1) > maxDV.v) maxDV = { f, v: Math.abs(v2 - v1) };
    }
    const mean = sum / CAM_PROBES.length;
    if (mean < minMean.v) minMean = { f, v: mean };
  }
  if (maxV.v > SPEED_CAP_SCREEN) {
    throw new Error(
      `SamePathV2: the frame travels ${maxV.v.toFixed(2)} screen px/f at f${maxV.f} ` +
        `(cap ${SPEED_CAP_SCREEN}).`,
    );
  }
  if (maxDV.v > 2.5) {
    throw new Error(
      `SamePathV2: the camera's |dv| reaches ${maxDV.v.toFixed(3)} screen px/f^2 at f${maxDV.f} ` +
        `(cap 2.5).`,
    );
  }
  if (minMean.v < 0.05) {
    throw new Error(`SamePathV2: the frame is parked at f${minMean.f}.`);
  }
  return {
    maxScreenSpeed: [maxV.f, Number(maxV.v.toFixed(2))] as const,
    maxDV: [maxDV.f, Number(maxDV.v.toFixed(3))] as const,
    minMeanSpeed: [minMean.f, Number(minMean.v.toFixed(3))] as const,
  };
})();

/** 3. THE RESOLVED SHOT HOLDS ALL SIX GAMES. From `SETTLED_F` on, every board's
 *  outer line and every nameplate is inside the frame with `BOARD_INSET` screen
 *  px to spare, and the lowest ink stays out of the caption band. */
const SETTLED_F = 124;
const BOARD_INSET = 26;
export const WIDE_FIT = (() => {
  let worst = { f: -1, id: "", edge: "", v: Infinity };
  let lowest = { f: -1, y: -Infinity };
  for (let f = SETTLED_F; f <= LAST; f++) {
    for (const b of BOARDS) {
      const h = goHalf(b);
      const top = b.mark ? b.y - h - GO_MARK_GAP - GO_MARK_PX / 2 : b.y - h;
      const c0 = screenAt(f, b.x - h, top);
      const c1 = screenAt(f, b.x + h, b.y + h);
      const note = (edge: string, v: number) => {
        if (v < worst.v) worst = { f, id: b.id, edge, v };
      };
      note("left", c0.x);
      note("right", WORLD_W - c1.x);
      note("top", c0.y);
      note("bottom", WORLD_H - c1.y);
      if (c1.y > lowest.y) lowest = { f, y: c1.y };
    }
  }
  if (worst.v < BOARD_INSET) {
    throw new Error(
      `SamePathV2: board ${worst.id}'s ${worst.edge} edge is ${worst.v.toFixed(1)} screen px ` +
        `inside the frame at f${worst.f} (floor ${BOARD_INSET}).`,
    );
  }
  return { worst, lowestInk: [lowest.f, Number(lowest.y.toFixed(0))] as const };
})();

/** 4. THE LANDING. Board 1 is centred and whole when "AlphaGo" lands, its mark
 *  is above it, and its foot is out of the caption band. */
export const LANDING = (() => {
  const b = BOARDS[0];
  const h = goHalf(b);
  const f = defaultProps.beats.alphaGo;
  const k = kAt(f);
  const l = screenAt(f, b.x - h, b.y - h);
  const r = screenAt(f, b.x + h, b.y + h);
  const mark = screenAt(f, b.x, b.y - h - GO_MARK_GAP);
  if (l.x < 40 || r.x > WORLD_W - 40) {
    throw new Error(
      `SamePathV2: board 1 runs to screen x ${l.x.toFixed(0)}..${r.x.toFixed(0)} at f${f}.`,
    );
  }
  if (r.y > 1330) {
    throw new Error(`SamePathV2: board 1's foot is at screen y ${r.y.toFixed(0)} at f${f}.`);
  }
  if (mark.y - (GO_MARK_PX / 2) * k < 40) {
    throw new Error(`SamePathV2: board 1's mark is off the top of the frame at f${f}.`);
  }
  return {
    f,
    k: Number(k.toFixed(4)),
    boardScreenW: Number((r.x - l.x).toFixed(0)),
    boardScreenY: [Number(l.y.toFixed(0)), Number(r.y.toFixed(0))] as const,
    markScreen: [Number(mark.x.toFixed(0)), Number(mark.y.toFixed(0))] as const,
    stoneScreenD: Number((GO_STONE_R * 2 * k).toFixed(1)),
  };
})();

// ---------------------------------------------------------------------------

const SamePathV2: React.FC<Props> = ({
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
  // The column is proven off frame from COLUMN_CLEAR_F on, so it stops being
  // drawn two frames later — proven, not hoped: the assertion above is what
  // makes this legal, and it keeps 54 shadowed rings out of every later frame.
  const showColumn = frame < COLUMN_CLEAR_F + 2;

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
            {showColumn ? (
              <g>
                {/* our own path, under the column the way the level line is:
                    the rings it runs through occlude it, so it reads as the
                    thing they are threaded on */}
                <Trail
                  id="chLlmTrailV2"
                  ax={COLUMN.x}
                  ay={ly}
                  bx={COLUMN.x}
                  by={MASS_BOTTOM}
                  k={k}
                  draw={trailDraw(frame)}
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
              </g>
            ) : null}
            {BOARDS.map((b, i) => (
              <GoBoard
                key={b.id}
                b={b}
                frame={frame}
                k={k}
                draw={i === 0 ? board1Draw(frame) : 1}
              />
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SamePathV2;

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
const BEATS = [0, 58, 66, 72, 75, 91, 104, 124, 139, LAST];

export const STATS = {
  duration: DURATION,
  columnClearF: COLUMN_CLEAR_F,
  camAudit: CAM_AUDIT,
  landing: LANDING,
  wideFit: WIDE_FIT,
  vScale: Number(V_SCALE.toFixed(5)),

  /** THE GAP: how f0 joins cut 1's last frame. V1's numbers, unchanged. */
  gap: {
    frames: GAP,
    cut1EndY: Y_CUT1_END,
    joinY: Number(modelY(-GAP).toFixed(3)),
    y0: Number(modelY(0).toFixed(1)),
    brightAtF0: brightAbove(0),
    flipInCut: QUESTIONS.map((q, i) => [i, Number(SOLVER.cross[i].toFixed(2))]).filter(
      (r) => (r[1] as number) > 0 && (r[1] as number) <= LAST,
    ),
    endY: Number(modelY(LAST).toFixed(1)),
    endV: Number(modelV(LAST).toFixed(3)),
  },

  /** THE PAN, read off the damped camera itself. */
  glide: (() => {
    const rows: [number, number, number, number][] = [];
    for (let f = 46; f <= 96; f += 4) {
      const c = camAt(f);
      rows.push([f, Number(c.cx.toFixed(0)), Number(c.k.toFixed(4)), Number(c.cy.toFixed(0))]);
    }
    let peak = { f: -1, v: 0 };
    for (let f = 47; f <= 96; f++) {
      const v = camAt(f).cx - camAt(f - 1).cx;
      if (v > peak.v) peak = { f, v };
    }
    return {
      cxFrom: Number(camAt(46).cx.toFixed(0)),
      cxTo: Number(camAt(96).cx.toFixed(0)),
      travelWorld: Number((camAt(96).cx - camAt(46).cx).toFixed(0)),
      peakWorldSpeed: [peak.f, Number(peak.v.toFixed(2))] as const,
      peakAtK: Number(kAt(peak.f).toFixed(4)),
      per4: rows,
    };
  })(),

  /** THE CAMERA, every ten frames. */
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

  /** THE GAMES: how many stones are on each board on each beat still, and when
   *  a capture happens inside the cut. */
  boards: BOARDS.map((b) => ({
    id: b.id,
    at: [b.x, b.y],
    scale: b.scale,
    start: b.start,
    pace: b.pace,
    mark: b.mark,
    boardWorldPx: Number((goHalf(b) * 2).toFixed(0)),
    movesOnBeats: BEATS.map((f) => [f, boardMovesAt(b, f)] as const),
    record: goRecordOf(b).id,
    capturesInCut: goRecordOf(b)
      .captures.map((n, i) => [i, n] as const)
      .filter(([i, n]) => n > 0 && goMoveFrame(b, i) >= 0 && goMoveFrame(b, i) <= LAST)
      .map(([i, n]) => ({ move: i + 1, frame: goMoveFrame(b, i), stones: n })),
  })),

  /** THE RECORDS, and that they are really the records. */
  records: GO_RECORDS.map((r) => ({
    id: r.id,
    source: r.source,
    movesStored: r.moves.length,
    capturesInRecord: r.captures.map((n, i) => [i + 1, n] as const).filter((x) => x[1] > 0),
    capturedStones: r.capturedAt.filter((v) => v !== Infinity).length,
  })),
  move37OfSedol2: GO_RECORDS[0].moves[36],
  boardWorldPx: (GO_N - 1) * GO_CELL,

  /** Stroke weights and stone sizes on screen, so the one family stays one
   *  family and the shared noun keeps one size. */
  stroke: [0, 58, 75, 104, LAST].map((f) => [
    f,
    Number(strokeScreen(kAt(f)).toFixed(2)),
    Number(((strokeW(kAt(f)) / 2) * kAt(f)).toFixed(2)),
  ]),
  stoneScreenD: [75, 91, 124, LAST].map((f) => [
    f,
    Number((GO_STONE_R * 2 * kAt(f)).toFixed(1)),
    Number((GO_STONE_R * 2 * BOARDS[2].scale * kAt(f)).toFixed(1)),
  ]),
  markPxOnScreen: [0, 58, LAST].map((f) => [
    f,
    Number((MODEL_MARK * kAt(f)).toFixed(1)),
    Number((GO_MARK_PX * kAt(f)).toFixed(1)),
  ]),

  /** THE WIDE SHOT: where the ink is, and where its centre of mass sits. */
  wide: [104, 124, 139, LAST].map((f) => {
    let top = Infinity;
    let bottom = -Infinity;
    let left = Infinity;
    let right = -Infinity;
    let sy = 0;
    let sx = 0;
    let n = 0;
    const note = (wx: number, wy: number) => {
      const c = screenAt(f, wx, wy);
      top = Math.min(top, c.y);
      bottom = Math.max(bottom, c.y);
      left = Math.min(left, c.x);
      right = Math.max(right, c.x);
      sy += c.y;
      sx += c.x;
      n += 1;
    };
    for (const b of BOARDS) {
      const h = goHalf(b);
      note(b.x - h, b.y - h);
      note(b.x + h, b.y + h);
      note(b.x, b.y);
      if (b.mark) note(b.x, b.y - h - GO_MARK_GAP - GO_MARK_PX / 2);
      // every stone on the board at f, so the centre of mass is the picture's
      const rec = goRecordOf(b);
      for (let i = 0; i < boardMovesAt(b, f); i++) {
        if (rec.capturedAt[i] !== Infinity && f >= goMoveFrame(b, rec.capturedAt[i])) continue;
        const p = goStoneAt(b, rec.moves[i][0], rec.moves[i][1]);
        note(p.x, p.y);
      }
    }
    return {
      f,
      k: Number(kAt(f).toFixed(4)),
      inkY: [Number(top.toFixed(0)), Number(bottom.toFixed(0))],
      inkX: [Number(left.toFixed(0)), Number(right.toFixed(0))],
      centreOfMass: [Number((sx / n).toFixed(0)), Number((sy / n).toFixed(0))],
    };
  }),
};
