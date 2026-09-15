import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_DARK,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  sway,
  worldTransform,
} from "./fieldShared";
// The set's shared line values: the stroke every line is drawn at and the
// duration a dot takes to ramp deep -> ripe. Imported, never restated.
import { STROKE, TONE_DUR } from "./ImpossibleTasks";
import {
  DEPTH_BANDS,
  EASE_ARRIVE,
  ExperimentsSchema,
  HIGHLIGHT,
  HIGHLIGHT_FRAMES,
  LEGATO,
  Trail,
  depthK,
  ease,
} from "./levelUp";
// THE MARK. Cut 4 derived the Hugging Face mark's ink-area size against the
// whole set's one scale; it is imported, never re-derived.
import { HUGGINGFACE } from "./OpenInternet";
// THE BOARD. Hugging Face is a message board, and it is cut 3's board unit —
// the squircle panel, the row pitch that makes its height a COUNT, the pad, the
// post lines and the mark's gap above the top edge. Nothing about a board is
// restated here.
import {
  BOARD_BOTTOM,
  Board,
  type BoardDef,
  MARK_GAP,
  MarkGlyph,
  PAD,
  SAFE_SPAN,
  panelH,
  postLen,
  postX0,
  postY,
} from "./SecondMessageBoard";
// THE WORLD. Cut 1 built the field and this cut does not own one value of it:
// the seats, the grid they are indexed by, the depth bands, the tone ramp and
// the seat renderer all come from `ThreeOrSomething`. Nothing here restates a
// value of it.
import {
  COLS,
  GRID_X0,
  GRID_Y0,
  ROWS,
  SEATS,
  SEAT_ALIVE,
  SEAT_AT,
  SEAT_BAND,
  STEP_X,
  STEP_Y,
  TIP_R,
} from "./ThreeOrSomething";

export const FPS = 24;
// Dwarkesh clip `Ajeya_The_Investigation`. Ajeya Cotra on the attack itself:
//
//   "These agents hacked Hugging Face. It's not clear how many, or why."
//
// SRT span 0:02.520 -> 0:05.860 at 24fps.
// DURATION = round((5.860 - 2.520) * 24) = round(80.16) = 80 frames of speech,
// plus a 48 frame tail so the held picture drifts and the editor can cut out of
// it wherever it wants = 128.
export const DURATION = 128;

// ---------------------------------------------------------------------------
// "Hacked Hugging Face". CUT 0a of the set, and the FIRST thing the viewer sees
// of this world: cut 1's field before anyone has looked at it. Nothing of cut
// 1's story is on screen — no ring, no three known seats, no wave, no idle
// traffic. Every seat is deep at OP_DARK. What happens is the attack.
//
// Cut 0b (`UncoveringTheLogs`) opens on this cut's LAST frame, so the board, the
// mark, the hackers, the dim seats, both reach sets, `CAM`, `K_FINAL` and
// `CONTENT_FINAL` are module-scope exports and nothing it needs is a local
// const.
//
// Orange Dwarkesh style: opaque grid cutaway, 1080x1920, 24fps, two tones of
// one warm yellow with the dots fully opaque, ink on the OP_* ladder, per-icon
// shadows, `runCamera` over authored `camMove` keys, one gesture per word.
//
// ---------------------------------------------------------------------------
// V2 — WHY THIS CUT WAS REBUILT. v1 drew Hugging Face as the MARK ALONE, 87
// world px of white at world y -520, with the five reaches converging on its
// ink bottom from 520-685 px below. Two things came out of that and they had
// one cause:
//   * five lines into one 87 px point is a TENT (the house rule: a fan to a
//     point is rejected — the same note that produced the blob under the brand
//     marks in the last clip), and
//   * the mark sat so far above the crowd that the reaches had to run at 45.7
//     world px/frame to land on the word, which is 84.5 SCREEN px/frame at the
//     k they played under, 1.9x the set's close-up cap.
// v2 gives Hugging Face the thing it actually is in this set — cut 3's BOARD —
// and both problems go with it. The reaches land SPREAD ACROSS the board's
// bottom edge (five points 56-98 world px apart on a 420 px panel, 90-157 SCREEN
// px apart at the push, so the picture is five lines into a panel and not a fan
// into a dot), the board's bottom edge is at world y -300 instead of -480, so
// the reaches are 158-241 px rather than 520-685, and every head in the piece —
// the fourteen dim ones too — now lands inside the 45 px/frame cap: 36.1 for a
// reach, 39.6 for a dim one, where v1 measured 84.5 and 53.7.
// And the attack now has a RESULT on the thing attacked: every arrival converts
// a fifth of the panel's outline from ink to ACCENT, so by "face" the board is
// theirs. See THE CONVERSION.
// ---------------------------------------------------------------------------
//
// Every gesture is one word. Nothing else happens.
//   M0: open at k 1.45 on the block that runs from
//     the mark's ink top to the lowest of the five,
//     centred at screen y 835. The Hugging Face BOARD
//     — a 420 x 120 two-row panel in ink, its mark
//     MARK_GAP above it — alone over a dead field  — f0
//   THESE AGENTS: the five hackers go deep@OP_DARK ->
//     ripe over TONE_DUR, one every other frame from
//     f2, so each overlaps the next by four frames.
//     Nothing else in the field is lit
//                          — "these agents"                         f2-16
//   HACKED HUGGING FACE: five REACHES rise from the
//     five, each to ITS OWN x on the board's bottom
//     edge, accent at 0.95, STROKE 3, white head r
//     TIP_R with a `Trail`, ONE speed, launched f12,
//     14, 16, 18, 20 LONGEST FIRST so the strike
//     rolls, and the LAST of them lands exactly on
//     "face" f27 (the five arrive f22.69, 24.45,
//     24.98, 26.72, 27.00). Each arrival CONVERTS the
//     panel's outline ink -> ACCENT by one fifth over
//     TONE_DUR, so the edge turns over f22.7-33 and
//     the board is theirs; the last arrival takes the
//     4-frame click, on the accent outline. The two
//     post lines stay ink: the posts are not theirs,
//     the board is. Each head takes `highlightTone`
//     for two frames as it lands — one gesture, five
//     arrivals, and the cut's only highlight. CAMERA
//     M1 pushes in k 1.45 -> 1.60 under them
//                          — "hacked Hugging Face"                  f12-31
//   (held breath: f33-36, four frames of a dead still
//     camera on a converted board, the click decaying
//     out of it)                                                    f33-36
//   IT'S NOT CLEAR: CAMERA M2, the pull-back
//     k 1.60 -> 1.00. The dark field opens around the
//     five and they stop being the whole frame
//                          — "it's not clear"                       f37-53
//   HOW MANY: FOURTEEN DIM REACHES rise from the
//     fourteen `DIM` seats to the SAME bottom edge at
//     DIM_OPACITY 0.22, heads white at 0.3, one
//     speed, launched across f47-58 and all landed by
//     f66. They convert nothing further — the board is
//     already theirs; what the fourteen add is how
//     many of them there are. Their seats stay DEEP
//     and rise only OP_DARK -> 0.32 as their own reach
//     leaves: half-known. Visible, uncountable. That
//     is the sentence
//                          — "how many"                             f47-66
//   OR WHY: nothing new. The held picture — the accent
//     board, five bright reaches, fourteen dim ones —
//     and CAMERA M3, an even creep k 1.00 -> K_FINAL
//     0.95 from f62 to f127 (warp 1.0) so the hold is
//     a drift and not a park: 1.45 screen px/frame at
//     worst on a point at the frame's edge, against
//     the set's 4 px dashed-edge rule
//                          — "or why", and the tail                 f62-127
//
// CAMERA. Three keys on one damped track, cx = HF_X throughout (everything in
// this cut is on the board's own axis, so a pan would be motion with nothing to
// look at) and the content centre is CONTENT_FINAL at every k.
//
// EVERY LANDING IS SOLVED AGAINST THE DAMPER, NOT ASSERTED (`$S/hhf/cam*.ts`,
// `$S/hhf/v2/cam.ts`). `runCamera` settles about thirteen frames AFTER its key
// window closes, so a first-moving-frame and a landing eight frames later are
// not simultaneously satisfiable and one of the two has to give. The damper is
// LINEAR, so which frame a move is n% done on does not depend on k0 or k1 at
// all: v2 changes the two k values of M1 and M2 and every landing frame below is
// bit-for-bit the frame v1 measured.
//   M1 keys f7-10  warp 0.72  on screen f8-23, landed f23 — four frames before
//      "face" f27, which is the brief's own window. The LANDING is kept and the
//      keys are solved backwards from it, exactly as cut 1 did, so the first
//      moving frame is f8 rather than f12; the move's peak speed is at f11 and
//      its whole fast half sits on "hacked" f12-16, which is what "push in with
//      the reaches" is asking for
//   M2 keys f36-40 warp 0.7   first moving frame f37 — "it's" — 68.7% at
//      "clear" f43, 91.7% at "how" f47, 97.7% at "many" f50, landed f53. Here
//      the FIRST FRAME is kept instead: the field opening is what the words
//      "it's not clear" are about, and a pull-back that had already finished
//      before the phrase started (which is what a landing at f45 forces: keys
//      f29-33, first moving frame f30) leaves the words with nothing
//   M3 keys f62-115 warp 1.0  the creep. k(127) = 0.94999623, 3.8e-6 under
//      K_FINAL, which is 0.004 screen px of scale error at the frame's edge —
//      cut 0b opens on this frame and blends against it
//
// PAYOFF. EASE_PAYOFF is NOT USED. The brief gives the overshoot budget to no
// landing — the conversion and its click are EASE_ARRIVE — so the piece contains
// no overshoot at all. Deliberately unused, as in cut 1.
//
// ambient: `breath` on every dot, `sway` on the camera, the grid's own drift.
// Not gestures; that is what this field is.
//
// ---------------------------------------------------------------------------
// FOUR THINGS ARE DERIVED RATHER THAN HAND-SET.
//
//   * THE FIVE LANDING POINTS. Hashed across the panel's INNER width (w - 2 PAD
//     = 380 px) with no two within REACH_MIN_SEP 50, then sorted along the edge:
//     -158.7, -60.9, -4.5, 63.8, 159.0. The five hackers are the nearest real
//     seats to a point below each landing point, so a reach never crosses its
//     neighbour and the five tops are 56-98 world px apart — at k 1.60 that is
//     90-157 SCREEN px between landings on a 672 px edge, which is what stops it
//     being a tent.
//   * REACH_SPEED is SOLVED, not set: the lowest speed at which EVERY reach has
//     landed by "face" f27, which is max(len / (27 - launch)) over the five.
//     One speed, the brief's launches, and the last arrival exactly on the word.
//     22.576 world px/frame, 36.13 SCREEN px/frame at the push — inside the
//     set's 45 cap, where v1 was at 84.5.
//   * DIM_SPEED. Same solve, one gesture later and with fourteen lines: the
//     launches are hashed across f47-58 and the speed is the lowest one that
//     lands ALL of them by f66 — 38.347 world px/frame, 39.63 SCREEN px/frame at
//     worst (f48, k 1.033), also inside the cap. The hash is warped toward the
//     front of its own window (DIM_WARP) so six of the fourteen are in the air on
//     "many" f50 rather than three, ten by f55 and all fourteen by f58.
//   * THE FIELD IS NOT 32,736 CIRCLES. Every seat in this cut is in ONE state —
//     deep at OP_DARK — so the whole crowd is emitted as one <path> of circle
//     arcs per depth band over only the seats the camera can see (two integer
//     ranges through the grid, never a scan), which is three nodes. The only
//     <circle>s in the piece are the nineteen hero seats. Per-frame DOM: ~3
//     paths + 19 circles + at most 19 reach groups + the board.
//
// EXPERIMENTS IN THIS PIECE (all on by default, each behind `experiments`):
//   EASE_ARRIVE  the five tone ramps, the fourteen half-ramps, the five fifths
//                of the conversion and the click decay. EASE_MOVE is the
//                camera's, through `camMove`'s warped smoothstep. EASE_PAYOFF
//                is UNUSED
//   legato       the five light two frames apart against a six-frame ramp, so
//                each overlaps the next by four; with `legato: false` they wait
//                a LEGATO beat apart instead
//   trails       `Trail` on all nineteen reach heads. `Streak` is NOT used: the
//                reach's own line is already drawn from the seat to the head, so
//                a streak behind the head lies exactly on top of it and draws
//                nothing
//   softFront    NOT USED. There is no wave in this cut and no tone front to
//                soften — the light is nineteen lines, not a crossing edge
//   highlight    `highlightTone` on the five reach heads, two frames each as
//                they land. The only use in the cut
//   depth        cut 1's three bands at 0.97 / 1.00 / 1.03, on the crowd only.
//                The nineteen hero seats are forced into the middle band, where
//                their reaches and the board are drawn, so a seat and its own
//                reach are never on two parallax planes
//
// DEVIATIONS FROM THE BRIEF, all deliberate and all listed in the DONE note:
// the board is drawn as cut 3's `Board` with an EMPTY post list plus two post
// lines of this cut's own, because `Board` takes ONE ink colour for the panel
// and the posts and the brief needs the panel to convert while the posts stay
// ink — and cut 3 is final and may not gain a prop; the panel is 4/5 converted
// by COUNT and 0.526 by COLOUR at "face", because the fifth crossfade starts ON
// the word and the brief asks for both a 6-frame crossfade per arrival and a
// fully accent panel at f27, which cannot both be true (it is full at f33, and
// the 4-frame click is what lands the word); M1's first moving frame is f8
// rather than f12 and M2's landing is f53 rather than f45 (see THE CAMERA); the
// dim launch hash is warped toward the front of its window; and a `DIM`
// candidate is contained on three sides — at least DIM_RISE below the board's
// bottom edge because the brief's verb is "rise", and inside DIM_DEEP and
// DIM_SIDE because the captions are burned in under this frame.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// THE HUGGING FACE BOARD. Cut 3's unit: a squircle panel whose height is a
// COUNT (rows * ROW_PITCH + 2 * PAD), two post lines at cut 3's own pitch and
// hashed lengths, and the mark MARK_GAP above the top edge, exactly as cut 4
// places it. Cut 3 nails its boards to its own BOARD_BOTTOM, so this one is
// that board MOVED: everything board-shaped is drawn inside one translate of
// BOARD_DY, which is the idiom cut 4 already uses for the boards in its sky.
// ---------------------------------------------------------------------------
export const HF_X = 0;
export const HF_ROWS = 2;
export const HF_BOARD: BoardDef = { key: "hf", cx: HF_X, w: 420, seed: 5.9 };
/** The board's bottom edge in WORLD y: the line every reach in this cut and the
 *  next one lands on. */
export const HF_BOTTOM = -300;
export const HF_PANEL_H = panelH(HF_ROWS); // 2 * ROW_PITCH + 2 * PAD = 120
export const HF_TOP = HF_BOTTOM - HF_PANEL_H;
/** cut 3's board frame -> this cut's world. */
export const BOARD_DY = HF_BOTTOM - BOARD_BOTTOM;
export const HF_POST_ROWS = [0, 1];
/** The panel's inner width: the span the five landings are hashed across. */
export const HF_INNER = HF_BOARD.w - 2 * PAD;

// THE MARK, at the ink-area size cut 4 derived (`HUGGINGFACE.size`, 86.86 world
// px; its ink is 21.75 of the 24 box high, so 78.71 world px of ink). Its INK
// BOTTOM sits MARK_GAP above the board's top edge — cut 3's rule, cut 4's
// placement. HF_Y is the ink box's CENTRE, which is what cut 0b imports.
export const HF_INK_H = (HUGGINGFACE.bboxH / 24) * HUGGINGFACE.size;
export const HF_INK_BOTTOM = HF_TOP - MARK_GAP;
export const HF_INK_TOP = HF_INK_BOTTOM - HF_INK_H;
export const HF_Y = HF_INK_BOTTOM - HF_INK_H / 2;

// ---------------------------------------------------------------------------
// THE FIVE LANDING POINTS. Hashed across the panel's inner width, no two within
// REACH_MIN_SEP, then sorted along the edge. THIS is the fix for the tent: five
// lines arriving 95-105 world px apart on a 420 px panel read as five hands on
// a board, where five lines arriving at one 87 px mark read as a tent.
// ---------------------------------------------------------------------------
export const REACH_MIN_SEP = 50;
export const REACH_TARGET_SEED = 1.3;
export const HF_TARGETS: number[] = (() => {
  const out: number[] = [];
  for (let n = 0; out.length < 5 && n < 500; n++) {
    const x = HF_X + (hash(n, REACH_TARGET_SEED) - 0.5) * HF_INNER;
    if (out.some((t) => Math.abs(t - x) < REACH_MIN_SEP)) continue;
    out.push(x);
  }
  if (out.length < 5) throw new Error("HackedHuggingFace: not five landing points");
  return out.sort((a, b) => a - b);
})();

// ---------------------------------------------------------------------------
// THE FIVE. Real seats in cut 1's field — the nearest to a point below each
// landing point — so they are agents in the crowd and not five dots drawn on
// top of it. Found through the grid rather than by scanning 32,736 seats.
//
// The offsets are chosen for the SHAPE of the five lines and for the arrivals
// they produce under one speed: dy 170-240 world px below the board's bottom
// edge (the brief's 40-260 band), dx small enough that no reach crosses its
// neighbour, and the five lengths within 172-253 so that the brief's 2-frame
// launch stagger comes out as arrivals ROLLING across f22-27 rather than five
// lines hitting at once. See REACH_SPEED.
// ---------------------------------------------------------------------------
export const nearestSeat = (wx: number, wy: number, skip: Set<number> = new Set()) => {
  const gc = Math.max(0, Math.min(COLS - 1, Math.round((wx - GRID_X0) / STEP_X)));
  const gr = Math.max(0, Math.min(ROWS - 1, Math.round((wy - GRID_Y0) / STEP_Y)));
  let best = -1;
  let bestD = Infinity;
  for (let r = gr - 3; r <= gr + 3; r++) {
    for (let c = gc - 3; c <= gc + 3; c++) {
      if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
      const i = SEAT_AT[r * COLS + c];
      if (i < 0 || skip.has(i)) continue;
      const d = Math.hypot(SEATS[i].x - wx, SEATS[i].y - wy);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  }
  if (best < 0) throw new Error(`HackedHuggingFace: no seat near (${wx}, ${wy})`);
  return best;
};

/** Per landing point: how far left/right and how far below the edge its hacker
 *  sits. Index-matched to HF_TARGETS, which is sorted left to right.
 *
 *  EVERY dx IS NEGATIVE, and that is the whole shape of the gesture. The first
 *  v2 pass put the two left seats to the left of their landings and the three
 *  right seats to the right of theirs, which is a symmetric outward splay under
 *  a horizontal edge — a TRESTLE. Five lines all leaning the same way, from a
 *  scatter of seats up and across into the board, read as five agents reaching
 *  for it; a symmetric A-frame reads as furniture, which is the tent note
 *  again in a different object. The dy values are deliberately not a staircase
 *  (200, 215, 150, 230, 190, so the seat ends are at five different depths),
 *  because five line ends at one height are five feet. */
export const HACK_DX = [-75, -110, -60, -95, -45];
export const HACK_DY = [200, 215, 150, 230, 190];
export const HACKERS_AT = HF_TARGETS.map((tx, n) => ({
  x: tx + HACK_DX[n],
  y: HF_BOTTOM + HACK_DY[n],
}));
export const HACKERS: number[] = (() => {
  const taken = new Set<number>();
  return HACKERS_AT.map((p) => {
    const i = nearestSeat(p.x, p.y, taken);
    taken.add(i);
    return i;
  });
})();
// The brief's own band, checked against the REAL seats rather than the points
// they were found from: 40-260 world px below the bottom edge, inside +-260 x.
HACKERS.forEach((i) => {
  const s = SEATS[i];
  const below = s.y - HF_BOTTOM;
  if (below < 40 || below > 260 || Math.abs(s.x - HF_X) > 260) {
    throw new Error(
      `HackedHuggingFace: hacker seat ${i} at (${s.x.toFixed(1)}, ${s.y.toFixed(1)}) is outside the band`,
    );
  }
});

// ---------------------------------------------------------------------------
// THE BLOCK. Everything this cut ever draws between the mark's ink top and the
// lowest hacker, on x = 0; there is no second subject and no pan, so the content
// centre is that block's centre at every k and `camMove` is only ever moving k
// and the framing it drags with it.
// ---------------------------------------------------------------------------
export const DOT_MAX = DOT_RADIUS * 1.25 * 1.05; // the biggest a seat dot breathes to
export const HACK_BOTTOM = Math.max(...HACKERS.map((i) => SEATS[i].y)) + DOT_MAX;
export const BLOCK_TOP = HF_INK_TOP;
export const BLOCK_BOTTOM = HACK_BOTTOM;
export const CONTENT_FINAL = (BLOCK_TOP + BLOCK_BOTTOM) / 2;
export const BLOCK_H = BLOCK_BOTTOM - BLOCK_TOP;

// ---------------------------------------------------------------------------
// THE CAMERA'S FOUR SCALES, declared here because the framing they imply is
// what decides which seats may be in the picture at all (see DIM_DEEP).
//
// K_OPEN is the brief's 1.45. The block is BLOCK_H world px tall and would take
// a k of SAFE_SPAN / BLOCK_H before it touched the set's band, which is well
// above 1.45 — the opening is NOT framed tight to the block, on purpose: the
// crowd around the board has to be visible from f0 or "how many" has nowhere to
// come from. At 1.45 the block sits at screen y 482-1189 and at the push's 1.60
// at y 437-1217, both inside the band with room, where v1's 1.85 on a much
// taller block ran from y 112 to y 1537 and out of it.
// ---------------------------------------------------------------------------
export const K_OPEN = 1.45;
export const K_PUSH = 1.6; // the push in with the reaches
export const K_WIDE = 1.0; // "it's not clear": the dark field opens
export const K_FINAL = 0.95; // the creep's end, at f127 — cut 0b opens here

// ---------------------------------------------------------------------------
// THE FOURTEEN. "how many" — the ones that are there and cannot be counted.
// Hashed at radius 260-640 world px from (0, 60), no two within 60 world px,
// none of the five. Deterministic: the same fourteen seats in cut 0b.
// ---------------------------------------------------------------------------
export const DIM_N = 14;
export const DIM_R0 = 260;
export const DIM_R1 = 640;
export const DIM_ORIGIN = { x: 0, y: 60 };
export const DIM_MIN_SEP = 60;
// ...and the brief's verb is RISE: the band reaches as high as world y -580,
// which is above the board itself, and a seat up there sends a horizontal
// whisker into the panel's side rather than a reach up out of the crowd. A
// candidate has to sit at least this far BELOW the board's bottom edge.
export const DIM_RISE = 150;
export const DIM_OPACITY = 0.22;
export const DIM_SEAT_OP = 0.32; // half-known: the seat rises this far and stops

// ...and DIM_RISE has a mirror at the BOTTOM, for the same reason in the other
// direction: the captions are burned in under this frame and the set's band is
// SAFE_SPAN centred on screen y 835, so a seat below DIM_DEEP is a dot and a
// line end under a caption. It is a FRAMING constraint, not a design one, and
// v2 needs it where v1 did not: the board sits 180 world px higher than the
// mark did, which lifts CONTENT_FINAL by 141 px and drops everything below it
// by the same amount on screen. Without this, seven of the fourteen sat below
// the band at f66, the deepest at screen y 1841; with it, none do.
// The widest k the fourteen are ever seen at is K_WIDE, so that is the k the
// cap is solved at: screen y = 835 + (y - CONTENT_FINAL) * k.
export const SAFE_BOTTOM_Y = 835 + SAFE_SPAN / 2; // 1450, cut 3's own band
export const DIM_DEEP = CONTENT_FINAL + SAFE_SPAN / 2 / K_WIDE - DOT_MAX;
// The same containment sideways: the set's margin is 60 screen px, so at the
// widest k the fourteen are seen at, a seat further out than this is off the
// side of the frame and its reach enters from nowhere.
export const SAFE_MARGIN = 60;
export const DIM_SIDE = (FRAME_W / 2 - SAFE_MARGIN) / K_WIDE - DOT_MAX;

export const DIM: number[] = (() => {
  const out: number[] = [];
  const taken = new Set<number>(HACKERS);
  for (let n = 0; out.length < DIM_N && n < 4000; n++) {
    const a = hash(n, 21) * Math.PI * 2;
    const r = DIM_R0 + hash(n, 22) * (DIM_R1 - DIM_R0);
    const wx = DIM_ORIGIN.x + Math.cos(a) * r;
    const wy = DIM_ORIGIN.y + Math.sin(a) * r;
    const i = nearestSeat(wx, wy, taken);
    const s = SEATS[i];
    if (out.some((j) => Math.hypot(SEATS[j].x - s.x, SEATS[j].y - s.y) < DIM_MIN_SEP)) continue;
    const d = Math.hypot(s.x - DIM_ORIGIN.x, s.y - DIM_ORIGIN.y);
    if (d < DIM_R0 || d > DIM_R1) continue;
    if (s.y < HF_BOTTOM + DIM_RISE) continue;
    if (s.y > DIM_DEEP) continue;
    if (Math.abs(s.x - HF_X) > DIM_SIDE) continue;
    taken.add(i);
    out.push(i);
  }
  if (out.length < DIM_N) {
    throw new Error(`HackedHuggingFace: only ${out.length} dim seats`);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE REACHES. Five lines from the five seats to their OWN landing point on the
// board's bottom edge, head-led at ONE speed with a white tip and a `Trail`.
//
// THE SPEED IS SOLVED, not set: it is the LOWEST speed at which every one of the
// five has landed by "face" f27, given the brief's launches f12, 14, 16, 18, 20
// handed out longest-first. That is max(len / (27 - launch)) over the five, and
// the reach that binds it is the last one launched — so the LAST arrival is
// exactly on the word, which is what the brief asks for, and the other four roll
// in ahead of it, one fifth of the conversion each.
// ---------------------------------------------------------------------------
export const REACH_F0 = [12, 14, 16, 18, 20]; // "hacked", rolling
export const FACE_F = 27; // "face": the word the LAST reach lands on
export const REACH_LEN = HACKERS.map((i, n) =>
  Math.hypot(SEATS[i].x - HF_TARGETS[n], SEATS[i].y - HF_BOTTOM),
);
/** The five, longest first: the order the launches are handed out in. */
export const REACH_ORDER: number[] = HACKERS.map((_, n) => n).sort(
  (a, b) => REACH_LEN[b] - REACH_LEN[a],
);
/** Launch frame per hacker index (not per launch slot). */
export const REACH_LAUNCH: number[] = (() => {
  const out = new Array<number>(HACKERS.length);
  REACH_ORDER.forEach((n, slot) => {
    out[n] = REACH_F0[slot];
  });
  return out;
})();
export const REACH_SPEED = Math.max(
  ...REACH_LEN.map((l, n) => l / (FACE_F - REACH_LAUNCH[n])),
);
export const REACH_ARRIVE = REACH_LEN.map((l, n) => REACH_LAUNCH[n] + l / REACH_SPEED);
export const REACH_OP = 0.95; // the reaches stay live
export const CLICK_DUR = 4; // the board's ink click on the last arrival

/** Head position of hacker reach `n` at a frame, or null before it launches.
 *  Exported so cut 0b draws the same five reaches at rest. */
export const reachAt = (n: number, f: number) => {
  if (f < REACH_LAUNCH[n]) return null;
  const s = SEATS[HACKERS[n]];
  const d = clamp01(((f - REACH_LAUNCH[n]) * REACH_SPEED) / REACH_LEN[n]);
  return { x: s.x + (HF_TARGETS[n] - s.x) * d, y: s.y + (HF_BOTTOM - s.y) * d };
};

// ---------------------------------------------------------------------------
// THE CONVERSION. The colour grammar's converted edge: on each arrival the
// panel's OUTLINE crossfades ink -> ACCENT by one fifth, over the set's own
// TONE_DUR, on EASE_ARRIVE. It is theirs now. The two post lines stay ink —
// what was taken is the board, not the posts on it — and the mark stays white.
//
// The fifths start at f22.3, 24.0, 24.5, 26.2 and 27.0, so the edge is 4/5
// converted by count and 0.69 by colour as "face" is spoken, and fully accent at
// f33: the fifth crossfade STARTS on the word, which is the one thing about
// "fully accent by 'face'" that the brief's own timing does not allow (the last
// reach lands ON f27). The click is on that last arrival and it lands on the
// accent outline.
// ---------------------------------------------------------------------------
export const CONVERT_DUR = TONE_DUR;
export const convertAt = (f: number) =>
  REACH_ARRIVE.reduce((a, t) => a + ease((f - t) / CONVERT_DUR, EASE_ARRIVE), 0) /
  REACH_ARRIVE.length;
export const CLICK_F = Math.max(...REACH_ARRIVE);

// ---------------------------------------------------------------------------
// THE FOURTEEN DIM REACHES. The same line to the same edge, at DIM_OPACITY —
// visible, uncountable, and never countable. Each lands at its own x, pulled
// toward its seat's own side of the board and jittered, so the fourteen splay
// across the edge instead of piling on its two corners. Hashed launches across
// f47-58 ("how many"), longest first, and ONE speed again, solved so the LAST of
// them has landed by f66 — the frame "or why" has to find the picture held.
// They convert nothing: the board is already theirs.
// ---------------------------------------------------------------------------
export const DIM_F0 = 47; // "how"
export const DIM_F1 = 58;
export const DIM_DEADLINE = 66;
export const DIM_TARGET_PULL = 0.35;
export const DIM_TARGET_JITTER = 120;
export const DIM_TARGET_X: number[] = DIM.map((i, n) => {
  const x = SEATS[i].x * DIM_TARGET_PULL + (hash(n, 41) - 0.5) * DIM_TARGET_JITTER;
  return HF_X + Math.max(-HF_INNER / 2, Math.min(HF_INNER / 2, x - HF_X));
});
export const DIM_LEN = DIM.map((i, n) =>
  Math.hypot(SEATS[i].x - DIM_TARGET_X[n], SEATS[i].y - HF_BOTTOM),
);
export const DIM_ORDER: number[] = DIM.map((_, n) => n).sort((a, b) => DIM_LEN[b] - DIM_LEN[a]);
// The hash is WARPED toward the front of the window. A flat hash across f47-58
// puts three of the fourteen in the air on "many" f50 and the other eleven after
// it; the word is "many", and it wants a crowd on it. u^DIM_WARP is still a hash
// across the brief's own window — it only decides where inside it the fourteen
// fall — and it puts six in flight by f50.
export const DIM_WARP = 1.5;
/** Launch frame per dim index: hashed inside the window, then sorted so the
 *  longest reach gets the earliest of them. */
export const DIM_LAUNCH: number[] = (() => {
  const slots = DIM.map(
    (_, n) => DIM_F0 + Math.pow(hash(n, 31), DIM_WARP) * (DIM_F1 - DIM_F0),
  ).sort((a, b) => a - b);
  const out = new Array<number>(DIM.length);
  DIM_ORDER.forEach((n, slot) => {
    out[n] = slots[slot];
  });
  return out;
})();
export const DIM_SPEED = Math.max(
  ...DIM_LEN.map((l, n) => l / Math.max(1, DIM_DEADLINE - DIM_LAUNCH[n])),
);
export const DIM_ARRIVE = DIM_LEN.map((l, n) => DIM_LAUNCH[n] + l / DIM_SPEED);

/** Head position of dim reach `n` at a frame, or null before it launches. */
export const dimReachAt = (n: number, f: number) => {
  if (f < DIM_LAUNCH[n]) return null;
  const s = SEATS[DIM[n]];
  const d = clamp01(((f - DIM_LAUNCH[n]) * DIM_SPEED) / DIM_LEN[n]);
  return { x: s.x + (DIM_TARGET_X[n] - s.x) * d, y: s.y + (HF_BOTTOM - s.y) * d };
};

// ---------------------------------------------------------------------------
// THE CAMERA. Three moves on one damped track, cx = HF_X throughout, the
// content centre CONTENT_FINAL at every k. Every landing is solved against the
// damper rather than asserted; see the header for the measured frames. The four
// scales themselves are declared above, with the block.
// ---------------------------------------------------------------------------
export type CamSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
export const CAM_SEGS: CamSeg[] = [
  { f0: 7, f1: 10, k0: K_OPEN, k1: K_PUSH, warp: 0.72 }, // M1 "hacked Hugging Face"
  { f0: 36, f1: 40, k0: K_PUSH, k1: K_WIDE, warp: 0.7 }, // M2 "it's not clear"
  { f0: 62, f1: 115, k0: K_WIDE, k1: K_FINAL, warp: 1.0 }, // M3 "or why", the creep
];

export const CAM = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const hold = (f: number) => {
    F.push(f);
    K.push(K[K.length - 1]);
    CY.push(CY[CY.length - 1]);
  };
  F.push(0);
  K.push(K_OPEN);
  CY.push(CONTENT_FINAL + CAM_LIFT / K_OPEN);
  CAM_SEGS.forEach((s) => {
    if (s.f0 > F[F.length - 1] + 1) hold(s.f0 - 1);
    const m = camMove({ ...s, c0: CONTENT_FINAL, c1: CONTENT_FINAL });
    m.F.forEach((f, i) => {
      if (f <= F[F.length - 1]) return;
      F.push(f);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    });
  });
  if (F[F.length - 1] < DURATION) hold(DURATION);
  for (let i = 1; i < F.length; i++) {
    if (F[i] <= F[i - 1]) {
      throw new Error(`HackedHuggingFace: the camera's moves overlap at f${F[i]}`);
    }
  }
  return { F, K, CY };
})();

// ---------------------------------------------------------------------------
// THE FIELD, as cut 1 emits it: one <path> of circle arcs per lit bucket per
// depth band, over only the seats the camera can see. In THIS cut the field is
// one flat state — every seat deep at OP_DARK — so the whole crowd is three
// paths, and the nineteen seats that are not are the only <circle>s in the
// piece.
// ---------------------------------------------------------------------------
const arc = (x: number, y: number, r: number) => {
  const d = (2 * r).toFixed(2);
  return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(
    2,
  )} 0 1 0 ${d} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 -${d} 0`;
};

// The nineteen hero seats are forced into the middle depth band, because the
// reaches that leave them are drawn there and a seat and its own reach may not
// sit on two different parallax planes. Cut 1's SEAT_BAND is not mutated — it
// belongs to that piece — it is copied.
const MID_BAND = DEPTH_BANDS.findIndex((b) => b === 1);
export const BAND = (() => {
  const out = Uint8Array.from(SEAT_BAND);
  HACKERS.forEach((i) => {
    out[i] = MID_BAND;
  });
  DIM.forEach((i) => {
    out[i] = MID_BAND;
  });
  return out;
})();
const HERO = new Set<number>([...HACKERS, ...DIM]);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, every accent line, and the taken edge
  accentDeep: z.string(), // deep: an unlooked-at dot
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
  dotRadius: z.number(),
  dotOpacity: z.number(),
  experiments: ExperimentsSchema,
  beats: z.object({
    these: z.number(), // "these"        — the first hacker lights
    agents: z.number(), // "agents"
    hacked: z.number(), // "hacked"      — the first reach leaves
    hugging: z.number(), // "hugging"
    face: z.number(), // "face"          — the last reach lands, and the board clicks
    its: z.number(), // "it's"           — M2 starts pulling back
    not: z.number(), // "not"
    clear: z.number(), // "clear"
    how: z.number(), // "how"            — the fourteen start rising
    many: z.number(), // "many"
    or: z.number(), // "or"              — the creep starts
    why: z.number(), // "why"
    end: z.number(), // speech ends; tail to 128
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
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
  dotRadius: DOT_RADIUS,
  dotOpacity: OP_UNREAD_DOT,
  experiments: {},
  beats: {
    these: 0,
    agents: 4,
    hacked: 12,
    hugging: 21,
    face: 27,
    its: 37,
    not: 41,
    clear: 43,
    how: 47,
    many: 50,
    or: 62,
    why: 65,
    end: 80,
  },
});

const HackedHuggingFace: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotOpacity,
  experiments,
  beats,
}) => {
  const frame = useCurrentFrame();
  const tone = makeTone(accentDeep, accent);
  // The conversion's crossfade: the same 64-step sRGB ramp the dots use, here
  // between the ink the board was drawn in and the accent it is taken into.
  const edgeTone = makeTone(ink, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = HF_X + drift.dx;
  const k = cam.k;
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the five, lighting on "these agents" ----------------------------------
  // deep@OP_DARK -> ripe, one every other frame, over the shared TONE_DUR: at a
  // stagger of 2 and a ramp of 6 the five overlap by four frames each, which is
  // the legato. With `legato: false` they wait a LEGATO beat apart instead.
  const litStep = experiments.legato ? 2 : LEGATO;
  const HACK_F0 = HACKERS.map((_, n) => beats.these + 2 + n * litStep);
  const hackTone = HACK_F0.map((f0) => ease((frame - f0) / TONE_DUR, EASE_ARRIVE));

  // -- the fourteen, half-known ---------------------------------------------
  // The seat stays DEEP and rises only to DIM_SEAT_OP as its own reach leaves.
  const dimSeat = DIM.map((_, n) => ease((frame - DIM_LAUNCH[n]) / TONE_DUR, EASE_ARRIVE));

  // -- the board's edge ------------------------------------------------------
  // One fifth per arrival, and the click on the last of them.
  const converted = convertAt(frame);
  const click =
    frame < CLICK_F ? 0 : 1 - ease((frame - (CLICK_F + CLICK_DUR)) / CLICK_DUR, EASE_ARRIVE);
  const edgeOp = OP_READ + (1 - OP_READ) * click;

  // -- the field -------------------------------------------------------------
  const bandK = DEPTH_BANDS.map((b) => depthK(k, b, experiments.depth));
  const kCull = Math.min(...bandK);
  const margin = DOT_MAX + 4;
  const x0 = cx - FRAME_W / 2 / kCull - margin;
  const x1 = cx + FRAME_W / 2 / kCull + margin;
  const y0 = cy - FRAME_H / 2 / kCull - margin;
  const y1 = cy + FRAME_H / 2 / kCull + margin;
  const gc0 = Math.max(0, Math.floor((x0 - GRID_X0) / STEP_X) - 1);
  const gc1 = Math.min(COLS - 1, Math.ceil((x1 - GRID_X0) / STEP_X) + 1);
  const gr0 = Math.max(0, Math.floor((y0 - GRID_Y0) / STEP_Y) - 1);
  const gr1 = Math.min(ROWS - 1, Math.ceil((y1 - GRID_Y0) / STEP_Y) + 1);

  const dark: string[][] = DEPTH_BANDS.map(() => []);
  for (let gr = gr0; gr <= gr1; gr++) {
    for (let gc = gc0; gc <= gc1; gc++) {
      const i = gr * COLS + gc;
      if (!SEAT_ALIVE[i]) continue;
      if (HERO.has(i)) continue;
      const s = SEATS[i];
      dark[BAND[i]].push(arc(s.x, s.y, dotRadius * s.r * breath(frame, hash(i, 9))));
    }
  }

  // The nineteen. `<circle>` only here, per the set's performance rule.
  const heroDots = [
    ...HACKERS.map((i, n) => ({ i, n, t: clamp01(hackTone[n]), op: clamp01(hackTone[n]) })),
    ...DIM.map((i, n) => ({
      i,
      n: n + 100,
      t: 0,
      op: (clamp01(dimSeat[n]) * (DIM_SEAT_OP - OP_DARK)) / (1 - OP_DARK),
    })),
  ].map(({ i, n, t, op }) => {
    const s = SEATS[i];
    return {
      key: n,
      x: s.x,
      y: s.y,
      r: dotRadius * s.r * breath(frame, hash(i, 9)),
      fill: tone(t),
      opacity: dotOpacity * (OP_DARK + (1 - OP_DARK) * op),
    };
  });

  // -- the five reaches ------------------------------------------------------
  const reaches = HACKERS.map((i, n) => {
    const p = reachAt(n, frame);
    if (!p) return null;
    const s = SEATS[i];
    const landed = frame >= REACH_ARRIVE[n];
    const hot = experiments.highlight && landed && frame < REACH_ARRIVE[n] + HIGHLIGHT_FRAMES;
    return {
      key: n,
      x1: s.x,
      y1: s.y,
      x2: p.x,
      y2: p.y,
      landed,
      hot,
      at: (f: number) => reachAt(n, f),
    };
  });

  // -- the fourteen dim reaches ---------------------------------------------
  const dimReaches = DIM.map((i, n) => {
    const p = dimReachAt(n, frame);
    if (!p) return null;
    const s = SEATS[i];
    return {
      key: n,
      x1: s.x,
      y1: s.y,
      x2: p.x,
      y2: p.y,
      landed: frame >= DIM_ARRIVE[n],
      at: (f: number) => dimReachAt(n, f),
    };
  });

  const midT = worldTransform(cx, cy, bandK[MID_BAND]);
  const midTransform = `translate(${midT.tx.toFixed(3)} ${midT.ty.toFixed(3)}) scale(${
    bandK[MID_BAND]
  })`;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <svg
          width={FRAME_W}
          height={FRAME_H}
          viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {/* the unlooked-at crowd: one path per depth band, nothing else */}
          {DEPTH_BANDS.map((b, bi) => {
            const t = worldTransform(cx, cy, bandK[bi]);
            return dark[bi].length === 0 ? null : (
              <path
                key={b}
                transform={`translate(${t.tx.toFixed(3)} ${t.ty.toFixed(3)}) scale(${bandK[bi]})`}
                d={dark[bi].join("")}
                fill={tone(0)}
                opacity={dotOpacity * OP_DARK}
              />
            );
          })}

          {/* everything that is ink, and the nineteen seats it leaves from */}
          <g transform={midTransform}>
            {/* THE BOARD, in cut 3's own frame, moved.
                The panel is drawn through cut 3's `Board` with an EMPTY post
                list, because `Board` takes ONE ink colour for the panel and its
                posts and here the panel converts to accent while the posts stay
                ink. Cut 3 is final and may not gain a prop, so the two post
                lines are drawn here from cut 3's own `postX0` / `postY` /
                `postLen` — the geometry is still entirely its, only the colour
                is this cut's. */}
            <g transform={`translate(0 ${BOARD_DY})`}>
              <Board
                board={HF_BOARD}
                rows={HF_ROWS}
                posts={[]}
                inkOp={edgeOp}
                ink={edgeTone(converted)}
                icon={icon}
                frame={frame}
                k={k}
                trails={false}
              />
              <g style={{ filter: icon }}>
                {HF_POST_ROWS.map((row) => (
                  <line
                    key={row}
                    x1={postX0(HF_BOARD)}
                    y1={postY(row)}
                    x2={postX0(HF_BOARD) + postLen(HF_BOARD, row)}
                    y2={postY(row)}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={OP_READ}
                  />
                ))}
              </g>
            </g>

            {/* the fourteen: visible, uncountable */}
            {dimReaches.map((d) =>
              d ? (
                <g key={`d${d.key}`}>
                  <line
                    x1={d.x1}
                    y1={d.y1}
                    x2={d.x2}
                    y2={d.y2}
                    stroke={accent}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={DIM_OPACITY}
                  />
                  {d.landed ? null : (
                    <>
                      <Trail
                        frame={frame}
                        k={k}
                        at={d.at}
                        r={TIP_R}
                        fill={ink}
                        opacity={0.3}
                        enabled={experiments.trails}
                      />
                      <circle cx={d.x2} cy={d.y2} r={TIP_R} fill={ink} opacity={0.3} />
                    </>
                  )}
                </g>
              ) : null,
            )}

            {heroDots.map((d) => (
              <circle key={d.key} cx={d.x} cy={d.y} r={d.r} fill={d.fill} opacity={d.opacity} />
            ))}

            {/* the five */}
            <g style={{ filter: icon }}>
              {reaches.map((r) =>
                r ? (
                  <g key={`r${r.key}`}>
                    <line
                      x1={r.x1}
                      y1={r.y1}
                      x2={r.x2}
                      y2={r.y2}
                      stroke={accent}
                      strokeWidth={STROKE}
                      strokeLinecap="round"
                      opacity={REACH_OP}
                    />
                    {r.landed ? null : (
                      <Trail
                        frame={frame}
                        k={k}
                        at={r.at}
                        r={TIP_R}
                        fill={ink}
                        enabled={experiments.trails}
                      />
                    )}
                    {r.landed && !r.hot ? null : (
                      <circle cx={r.x2} cy={r.y2} r={TIP_R} fill={r.hot ? HIGHLIGHT : ink} />
                    )}
                  </g>
                ) : null,
              )}
            </g>

            {/* the mark, MARK_GAP above the board's top edge */}
            <g opacity={OP_READ}>
              <MarkGlyph
                mark={HUGGINGFACE}
                cx={HF_X}
                at={() => HF_INK_BOTTOM}
                frame={frame}
                k={k}
                ink={ink}
                icon={icon}
                trails={false}
              />
            </g>
          </g>
        </svg>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HackedHuggingFace;
