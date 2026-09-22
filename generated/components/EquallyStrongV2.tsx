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
  clamp01,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { camKnots3, runCam3 } from "./trapShared";
import {
  BOARDS,
  COLUMN,
  DeepMindMark,
  GO_MARK_GAP,
  GO_MARK_PX,
  GO_STONE_R,
  GoBoard,
  INK,
  INK_LO,
  LEVEL_HALF_LEN,
  SPEED_CAP_SCREEN,
  boardMovesAt,
  goHalf,
  goMoveFrame,
  goRecordOf,
  levelW,
  lerp,
  strokeScreen,
} from "./challengeShared";
import { CAM_AT as CUT2_CAM_AT } from "./SamePathV2";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Challenge_The_Model`, cut 3 V2: `EquallyStrongV2`.
// Line (SRT 0:19.300 -> 0:21.859):
//   "you're always playing against an AI that's equally strong"
//
// THE CLIP'S ONE IDEA: **HEIGHT IS LEVEL. The model climbs by what challenges
// it. A question BELOW the model's line is too easy and lifts nothing.**
//
// THIS CUT'S ONE IDEA, out of that: cut 2 V2 showed that the other kind of AI
// plays A REAL GAME, on a real board, under the mark of the lab that built it.
// This cut says WHO IT PLAYS: itself. The camera pushes in until board 1 fills
// the frame, A SECOND DEEPMIND MARK — identical to the one above — rises into
// place under the board, and one line is drawn from the top player round the
// game to the bottom one. The stones never stop alternating, and THE
// ALTERNATION IS THE EQUAL STRENGTH: black, white, black, white, one every
// three frames, neither side ever getting two in a row.
//
// VOCABULARY — `challengeShared`'s, all of it, and cut 2 V2's Go half in
// particular: `GoBoard`, `Stone`, `BOARDS`, `boardMovesAt`, `goHalf`,
// `DeepMindMark`, `GO_MARK_GAP`, `GO_MARK_PX`. NOTHING IS INVENTED except the
// second mark's placement (the same `DeepMindMark` component, mirrored below the
// board on the same 70 px gap) and the one connecting line. ORANGE IS THE MODEL
// AND ITS LEVEL AND NOTHING ELSE — and the model is a thousand world px off the
// left edge for every frame of this cut, which is asserted below.
//
// DURATION. 2.559 s of speech x 24 = 61.4 -> 61 frames, plus the set's 16-frame
// tail: DURATION = 61 + 16 = 77.
//
// Word -> frame (24 fps from comp start):
//   you're 0 · always 1 · playing 7 · against 13 · an 21 · AI 34 · that's 37 ·
//   equally 43 · strong 50 · (speech ends 61)
//
// SOUND-OFF READING TEST — one sentence:
//   "the camera pushes in out of the field of Go games onto the AlphaGo board
//    until it fills the frame, a second identical DeepMind mark rises into place
//    underneath it facing the first across the board, and a line is drawn from
//    the top mark round the game to the bottom one while the stones keep
//    landing black, white, black, white."
//
// ---------------------------------------------------------------------------
// THE JOIN. Cut 2 V2 is in at 0:11.160, this cut at 0:19.300, so f0 here is cut
// 2 V2's world at frame round(8.140 s x 24) = 195 — its own last frame 154 plus
// the 41 frames the edit does not show. The offset is taken off THE SRT rather
// than off cut 2's internal beats, so it cannot drift if cut 2 is re-timed.
//
// EVERY GAME IS CUT 2 V2'S OWN ARITHMETIC evaluated at f + 195: each board is
// `<GoBoard b frame={f + 195}>`, so the stones on it are `boardMovesAt(b, f+195)`
// of the real record, placed at that board's own pace and phase. Board 1 opens
// this cut 46 moves into AlphaGo vs Lee Sedol game 2 and ends it at 71. Nothing
// is re-authored and nothing is restated; the module THROWS if board 1 is not
// exactly 46 moves in on the first frame.
//
// THE CAMERA JOIN IS A REPLAY, NOT A CONSTANT. Cut 2 V2's camera is a SUM of
// eased segments whose last one — the drift, f104 -> 260 — is still running when
// its own last frame goes by, but its published `CAM_AT` table stops at
// DURATION + 2 and clamps, so `CUT2_CAM_AT(195)` is f157 held, not the
// continuation. So this file restates cut 2 V2's camera curve, runs it through
// the same Gaussian / `camKnots3` / `runCam3` chain over a LONGER range, and
// reads the camera at 195 — and then PROVES the restatement by reproducing
// `CUT2_CAM_AT` on nine frames cut 2 does publish. Measured: identical to
// 0.0e+0 on every one of them. If cut 2 V2 is ever re-timed, this file stops
// building rather than quietly drifting.
//   cut 2 V2 at its own f154:  cx 2070.221  content y 1258.201  k 0.554660
//   ...continued to f195:      cx 2104.937  content y 1294.286  k 0.543499  <- f0
//
// ---------------------------------------------------------------------------
// GESTURES — three, and the mechanism that runs under them. Nothing else moves
// on its own.
//
//  1. f0-28   "you're always        THE PUSH-IN. ONE glide out of cut 2 V2's
//             playing against"      resolved wide shot of six games (board 1 at
//             (f0/f1/f7/f13)        screen (337, 481), 516 px across) into a
//                                   close shot on board 1 alone (893 px across
//                                   at the landing, 912 by the end, centred on
//                                   screen x 540), warp 0.85 so the speed is
//                                   early. The target completes at f12 and the
//                                   DAMPED shot lands at f28 — 96% of the whole
//                                   zoom, six frames ahead of "AI" (34). Boards
//                                   3-6 leave the frame to the right (their last
//                                   ink is f18, f23, f18 and f21) and keep
//                                   playing as they go; the camera is already
//                                   moving at f0 on 40 frames of pre-roll that
//                                   ARE cut 2's own tail drift, so nothing
//                                   starts from a standing start.
//
//  2. f16-30  "against AN AI"       THE SECOND MARK. From f16 a second DeepMind
//             (f21/f34)             mark — the same `DeepMindMark`, the same 90
//                                   px box, the same 70 px gap, mirrored under
//                                   the board's bottom line — rises 90 world px
//                                   into place and fades in over 14 frames, in
//                                   place by f30 so "AI" (f34) lands on the two
//                                   marks already facing each other across the
//                                   game. It arrives four frames before the word
//                                   and while the camera is still moving.
//
//  3. f34-48  "that's EQUALLY       THE LINE. One line at INK_LO on the level
//             STRONG"               line's own half stroke draws from the top
//             (f43/f50)             mark's rim, out over the board's top edge,
//                                   down the board's right side 20 world px
//                                   clear of its last vertical, and back in to
//                                   the bottom mark's rim — one stroke, drawn
//                                   once over 14 frames at 130 screen px/f,
//                                   leaving on "AI" (34), travelling under
//                                   "that's" (37) and "equally" (43), finished
//                                   f48 two frames ahead of "strong" (f50), and
//                                   kept for the rest of the cut. NOT A BOX: it
//                                   open on the left, it touches both marks and
//                                   nothing else, and it says the two players
//                                   are one program.
//
//  MECHANISM (whole cut): the games. Six boards, each on its own pace and phase,
//  place 117 stones between them inside these 77 frames — board 1 alternating
//  black/white every 3 frames (25 stones), board 2 every 3 (26), boards 3-6 at
//  4, 5, 4 and 6. No two boards place a stone on the same frame by construction
//  (cut 2 V2 asserts the pace/phase pairs are distinct) and the last frame of the
//  cut still has stones landing on every board.
//
//  AMBIENT: each stone's own 4-frame landing ease, the grid's parallax and
//  -0.3 px/frame drift, the camera's `sway`, and a zoom that is still creeping in
//  on the last frame (k 1.088 at the landing, 1.095 at f76).
//  THE CUT DOES NOT RESOLVE.
//
// ---------------------------------------------------------------------------
// THE FRAMING — solved for the STACK, on the director's note.
//
// The brief asked for the board at ~90% of the frame width at k 1.6-1.8. It does
// not fit, and the note that came back set the real rule: solve k for
// BOARD + TOP MARK + BOTTOM MARK, bottom mark's lowest ink <= screen 1330, top
// mark's highest ink >= 150, board centred at ~screen 740.
//
// The stack is 529 world px from the board's centre to either mark's outer ink
// (414 board half + 70 gap + 45 mark half), so 1058 world px have to live inside
// a 1180 px band. `sway` costs 5 world px of it at each end. That fixes
//   k_max = 1180 / (1058 + 10) = 1.1049
// and the board's centre at 1330 - (529 + 5) * k_max = screen 740.0 — which is
// where the note independently put it. The zoom therefore LANDS at 1.088 and
// creeps to 1.095, so that the creep is paid for out of the same band rather
// than blowing through the bottom of it: a push-in is only affordable here if
// the landing leaves room for it.
//
// WHAT THAT COSTS: the board lands 901 screen px across, not the note's ~950.
// 950 needs k 1.1473, at which the stack overruns the band by 46 px. The only
// lever that reaches 950 is the 70 px mark gap (at 50 it fits exactly), and that
// gap is cut 2 V2's own nameplate placement — `GO_MARK_GAP`, used by `GoBoard`
// for every board in the clip — so a bottom mark at a different gap would break
// the "identical to the first" read that gesture 3 then locks in. The board is
// left at 893 px on the landing frame and 912 by the end — 83% of the frame and
// 1.29x cut 2 V2's own landing (692).
//
// CY IS ALMOST PINNED, AND THAT IS THE BAND'S DOING. At k 1.09 the stack fills
// the 150..1330 band to within ~9 px, so the board's centre can only travel
// between 736.5 and 745.5 — it is authored from 744 down to 740.5 and that 3.5
// px settle is the whole cy drift the frame can afford. The motion the style
// asks for is carried instead by the k creep, the 117 stones, the grid parallax
// and `sway`, all of which are running on the last frame.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the cut brief, with the arithmetic.
//
//  * k 1.088 RATHER THAN 1.6-1.8, and the board at 83% of the frame width rather
//    than 90%. Forced by the stack, above, and settled by the director's note.
//
//  * THE LOOP IS ONE OPEN LINE, NOT A CIRCUIT. The brief offered either "down
//    one side of the board and back up the other" or "one arc mark-to-mark, your
//    call". A closed circuit round the board is a BOX, which this style does not
//    allow, and a single arc bulging to one side cuts across the board's own
//    top-right and bottom-right (an ellipse through both marks at bulge 434 sits
//    at world x 1945 on the board's top line, 190 px INSIDE the board's right
//    edge, drawing over the game). The bracket drawn here is the brief's first
//    option with the second side left off: it clears the board's last vertical
//    by 20 world px, clears the frame's right edge by 62 screen px at the
//    creep's widest, and touches nothing but the two marks.
//
//  * THE OTHER BOARDS DO NOT ALL LEAVE. Boards 3-6 do — their last ink is at
//    f18, f23, f18 and f21. BOARD 2 CANNOT: it is directly below board 1, and
//    for its nameplate's ink (world y 1331) to fall past the bottom edge the
//    camera needs (1920 - boardCentreScreenY) / 691 < k, i.e. k > 1.708 with the
//    board centred at 740 — a zoom at which the 1,058 px stack does not fit in
//    the 1,920 px frame at all, let alone inside 150..1330. So it stays, and the
//    answer is the recede above rather than the framing: its plate sits at screen
//    y 1471 at the landing and 1503 at the end, 145 px below the lowest thing
//    this cut is about and under the caption band, at half strength. It is cut 2
//    V2's own picture continuing, which is the honest answer — the games do not
//    stop because we looked away, and board 2 still takes a stone at f40.
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
/** Frames of pre-roll: the camera is already moving at f0, on cut 2's own drift. */
const PRE = 40;
const FIRST = -PRE;

// ---------------------------------------------------------------------------
// THE JOIN — f0 here is cut 2 V2's frame `OFF`, taken off the two SRT in-points.
// ---------------------------------------------------------------------------
/** round((19.300 - 11.160) * 24) = 195. Derived from the SRT, so cut 2 re-timing
 *  cannot move it. */
const OFF = Math.round((19.3 - 11.16) * FPS);
/** A cut-3 frame in the GAMES' own clock. */
const cf = (f: number) => f + OFF;

/** THE SUBJECT: board 1, the AlphaGo board cut 2 V2's pan landed on. */
const B1 = BOARDS[0];
const HALF = goHalf(B1); // 414
const MARK_HALF = GO_MARK_PX / 2; // 45
const TOP_MARK_Y = B1.y - HALF - GO_MARK_GAP; // 156 — exactly where GoBoard puts it
const BOT_MARK_Y = B1.y + HALF + GO_MARK_GAP; // 1124 — the mirror of it
/** board centre -> either mark's outer ink. The number the framing is solved on. */
const HALF_STACK = HALF + GO_MARK_GAP + MARK_HALF; // 529
/** moves on board 1 on this cut's first frame, from cut 2 V2's own arithmetic */
const B1_MOVES_AT_F0 = 46;

(() => {
  if (B1.id !== "b1" || !B1.mark) {
    throw new Error(`EquallyStrongV2: the subject moved — BOARDS[0] is ${B1.id}.`);
  }
  const m = boardMovesAt(B1, cf(0));
  if (m !== B1_MOVES_AT_F0) {
    throw new Error(
      `EquallyStrongV2: the join drifted — board 1 is ${m} moves in on cut 2's frame ${OFF}, not ${B1_MOVES_AT_F0}.`,
    );
  }
  if (HALF !== 414 || TOP_MARK_Y !== 156 || BOT_MARK_Y !== 1124) {
    throw new Error(
      `EquallyStrongV2: the board's geometry moved — half ${HALF}, marks ${TOP_MARK_Y}/${BOT_MARK_Y}.`,
    );
  }
})();

// ---------------------------------------------------------------------------
// CUT 2 V2'S CAMERA, RESTATED SO IT CAN BE REPLAYED PAST ITS OWN END — and
// proved against the real file on every frame that file publishes.
// ---------------------------------------------------------------------------
const C2_FIRST = -40;
const C2_LAST = 154;
const C2_PAN_F0 = 41;
const C2_PAN_F1 = 77;
const C2_PAN_DX = B1.x - 552;
const C2_LEAN_F0 = 25;
const C2_LEAN_F1 = 69;
const C2_K_LAND = 0.856;
const C2_OUT_F0 = 68;
const C2_OUT_F1 = 118;
const C2_OUT_DX = 330;
const C2_OUT_DY = 588;
const C2_K_WIDE = 0.561;
const C2_DRIFT_F0 = C2_OUT_F1 - 14;
const C2_DRIFT_F1 = 260;
const C2_SMOOTH = 7.5;

const camEase = (u: number, warp: number) => smoothstep(Math.pow(clamp01(u), warp));
const seg = (f: number, f0: number, f1: number, warp = 1) => camEase((f - f0) / (f1 - f0), warp);

const c2cx = (f: number) =>
  540 +
  12 * seg(f, C2_FIRST, 40, 1.3) +
  C2_PAN_DX * seg(f, C2_PAN_F0, C2_PAN_F1) +
  C2_OUT_DX * seg(f, C2_OUT_F0, C2_OUT_F1, 0.8) +
  90 * seg(f, C2_DRIFT_F0, C2_DRIFT_F1);
const c2y = (f: number) =>
  856 -
  36 * seg(f, C2_FIRST, 40, 1.3) -
  180 * seg(f, C2_PAN_F0, C2_PAN_F1) +
  C2_OUT_DY * seg(f, C2_OUT_F0, C2_OUT_F1, 0.8) +
  120 * seg(f, C2_DRIFT_F0, C2_DRIFT_F1);
const c2k = (f: number) =>
  1.0075 +
  0.0405 * seg(f, C2_FIRST, 32, 1.3) -
  (1.048 - C2_K_LAND) * seg(f, C2_LEAN_F0, C2_LEAN_F1) -
  (C2_K_LAND - C2_K_WIDE) * seg(f, C2_OUT_F0, C2_OUT_F1, 0.8) -
  0.03 * seg(f, C2_DRIFT_F0, C2_DRIFT_F1);

/** Cut 2 V2's whole chain, over a range that reaches wherever we ask. */
const c2Replay = (upto: number) => {
  const hold =
    (fn: (f: number) => number) =>
    (f: number) =>
      fn(Math.max(C2_FIRST, Math.min(C2_DRIFT_F1, f)));
  const g = (src: (f: number) => number, f: number) => {
    const w = Math.ceil(3 * C2_SMOOTH);
    let num = 0;
    let den = 0;
    for (let d = -w; d <= w; d++) {
      const e = Math.exp(-(d * d) / (2 * C2_SMOOTH * C2_SMOOTH));
      num += e * src(f + d);
      den += e;
    }
    return num / den;
  };
  const x = hold(c2cx);
  const y = hold(c2y);
  const kk = hold(c2k);
  const knots = [];
  for (let f = C2_FIRST; f <= upto; f++) {
    knots.push({ f: f - C2_FIRST, k: g(kk, f), x: g(x, f), y: g(y, f) });
  }
  const C = camKnots3(knots, upto - C2_FIRST);
  return (f: number) => {
    const c = runCam3(f - C2_FIRST, C.CX, C.CY, C.K);
    const d = sway(f);
    return { cx: c.cx + d.dx, cy: c.cy + d.dy, k: c.k };
  };
};

/** THE PROOF: the restatement above IS cut 2 V2's camera. */
(() => {
  const mine = c2Replay(C2_LAST + 2);
  for (const f of [0, 20, 50, 75, 100, 124, 139, 150, 154]) {
    const a = mine(f);
    const b = CUT2_CAM_AT(f);
    const d = Math.max(Math.abs(a.cx - b.cx), Math.abs(a.cy - b.cy), Math.abs(a.k - b.k) * 1000);
    if (d > 1e-9) {
      throw new Error(
        `EquallyStrongV2: the camera join drifted at cut 2's f${f} — ` +
          `mine (${a.cx.toFixed(4)}, ${a.cy.toFixed(4)}, ${a.k.toFixed(6)}) vs ` +
          `(${b.cx.toFixed(4)}, ${b.cy.toFixed(4)}, ${b.k.toFixed(6)}).`,
      );
    }
  }
})();

/** ...and the continuation, which is what this cut opens on. `cy` back to a
 *  CONTENT centre, because `camKnots3` puts the CAM_LIFT back on. */
const C2_CONT = c2Replay(C2_DRIFT_F1);
const J = (() => {
  const c = C2_CONT(cf(0));
  return { k: c.k, cx: c.cx, y: c.cy - CAM_LIFT / c.k };
})();
/** cut 2's camera as this cut's pre-roll: f < 0 here is f < 195 there. */
const c2At = (f: number) => {
  const c = C2_CONT(cf(f));
  return { k: c.k, cx: c.cx, y: c.cy - CAM_LIFT / c.k };
};

// ---------------------------------------------------------------------------
// THE CAMERA — one glide into the close shot, then a creep that is still
// running on the last frame. Authored as raw targets, rounded by a symmetric
// Gaussian, keyed one per frame and damped by the set's own `runCam3`.
// ---------------------------------------------------------------------------
// THE GLIDE IS SOLVED FOR WHAT COMES OUT OF THE DAMPER, NOT FOR WHAT GOES IN.
// The first build authored the push-in to finish at f28 and measured the damped
// camera only 80% of the way there by then: `runCam3` lags, and a Gaussian at
// sigma 11 spreads a move +/-33 frames on top of that, so the shot was still
// opening at f54 — twenty frames after the word it was meant to beat. The target
// therefore completes at f12 and the DAMPED result lands at f28: 96% of the
// whole zoom, board 901 of its final 908 screen px, six frames ahead of "AI".
// Swept over glide 12-22 x sigma 5-8 (`scratchpad/equallystrong2/sweep.ts`);
// this is the only pair that lands >= 96% by f28 AND keeps |dv| under 2.5 with
// the top mark above 150 and the board inside 80 px of both edges:
//   glide 12 sigma 7  |dv| 2.75  REJECTED (over the ceiling)
//   glide 16 sigma 8  top 152, board left edge 79  REJECTED (inside the margin)
//   glide 18 sigma 8  top 148  REJECTED
//   glide 12 sigma 8  |dv| 2.26, 96% by f28, top 156, x 82..995  CHOSEN
const GLIDE_F1 = 12;
const GLIDE_WARP = 0.85;
/** The frame the damped shot has actually arrived on — what the framing proofs
 *  below are measured from, and what "the landing" means in the gesture list. */
const LANDED_F = 28;
/** THE LANDING ZOOM — solved for the stack, see THE FRAMING above. */
const K_LAND = 1.088;
/** The creep that keeps the last frame moving, paid for out of the same band. */
// DIRECTOR'S PASS: 0.012 -> 0.019, spending the headroom the first preview
// measured between the bottom mark and its 1330 limit, so the tail is livelier.
const CREEP_K = 0.019;
const CREEP_F1 = GLIDE_F1 + 100;
const CREEP_WARP = 0.8;
/** Where the board's CENTRE sits on screen: the whole 3.5 px the band affords. */
const BOARD_Y0 = 744;
const BOARD_Y1 = 740.5;
const CAM_SMOOTH = 8;

const glide = (f: number) => camEase(clamp01(f / GLIDE_F1), GLIDE_WARP);
const creep = (f: number) =>
  camEase(clamp01((f - GLIDE_F1) / (CREEP_F1 - GLIDE_F1)), CREEP_WARP);

const kClose = (f: number) => K_LAND + CREEP_K * creep(f);
const boardScreenY = (f: number) => lerp(BOARD_Y0, BOARD_Y1, creep(f));
/** content y that puts the board's centre at `boardScreenY`:
 *  screen = 960 + (B1.y - (y + CAM_LIFT/k)) * k  =>  y = B1.y + (960 - S - CAM_LIFT) / k */
const yClose = (f: number) => B1.y + (960 - boardScreenY(f) - CAM_LIFT) / kClose(f);

const kTargetRaw = (f: number) => lerp(c2At(f).k, kClose(f), glide(f));
const xTargetRaw = (f: number) => lerp(c2At(f).cx, B1.x, glide(f));
const yTargetRaw = (f: number) => lerp(c2At(f).y, yClose(f), glide(f));

const CAM = (() => {
  const hold =
    (fn: (f: number) => number) =>
    (f: number) =>
      fn(Math.max(FIRST - 60, Math.min(LAST + 60, f)));
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
  const x = hold(xTargetRaw);
  const y = hold(yTargetRaw);
  const kk = hold(kTargetRaw);
  const knots = [];
  for (let f = FIRST; f <= LAST + 2; f++) {
    knots.push({ f: f - FIRST, k: gauss(kk, f), x: gauss(x, f), y: gauss(y, f) });
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

// ---------------------------------------------------------------------------
// THE SECOND MARK — the opponent. The same `DeepMindMark`, the same box, the
// same gap, mirrored. It rises MARK2_RISE world px into place and fades in.
// ---------------------------------------------------------------------------
// THE CAMERA COMMITS TO ONE GAME. Board 2 is directly below board 1 and cannot
// be framed out at any zoom this cut can afford (see DEVIATIONS), so at full
// strength the close-up showed THREE identical DeepMind marks down the frame —
// board 1's, the new opponent's, and board 2's own nameplate — and the pair
// stopped reading as a pair: the clip's own grammar is "a mark ABOVE a board
// names it", so a mark with a board under it reads as that board's plate. The
// first preview had exactly that fault at f34, the frame "AI" lands on.
//
// So the games that are not the subject RECEDE as the push-in commits, through
// `GoBoard`'s own `opacity` prop — cut 2 V2's component, used as it is written,
// nothing overridden. They do not stop: every one of them keeps placing stones
// at its own pace for every frame of the cut, and board 2 still takes a stone
// off the board at f40. It is the field language's OP_RECEDE — "was the subject,
// is not any more" — applied to a game instead of a crowd, and it starts at f6
// so the opening frame is still cut 2 V2's picture exactly.
// It finishes at f24, BEFORE the opponent mark is half-risen (f16-30): the two
// plates share the lower frame for those frames, and the one that matters has to
// be the brighter of them the whole time. At f24 the opponent is at 0.61 against
// board 2's 0.50, and it only separates further from there.
const RECEDE_F0 = 6;
const RECEDE_F1 = 24;
const RECEDE_TO = 0.5;
const recede = (f: number) =>
  lerp(1, RECEDE_TO, smoothstep(clamp01((f - RECEDE_F0) / (RECEDE_F1 - RECEDE_F0))));

const MARK2_F0 = 16;
const MARK2_F1 = 30;
const MARK2_RISE = 90;
const mark2 = (f: number) => smoothstep(clamp01((f - MARK2_F0) / (MARK2_F1 - MARK2_F0)));
const mark2Y = (f: number) => BOT_MARK_Y + MARK2_RISE * (1 - mark2(f));

// ---------------------------------------------------------------------------
// THE LINE — one open bracket from the top mark's rim, round the board's right
// side, to the bottom mark's rim. Not a box: the left side is not there.
// ---------------------------------------------------------------------------
// DIRECTOR'S PASS: 10 frames -> 14, because at 10 the tip ran 182 screen px/f
// and read as a flick rather than a stroke. It now leaves on "AI" (f34), travels
// under "that's" (37) and "equally" (43) and lands f48, still two frames ahead
// of "strong" (50) — the gesture leads and the word is where it lands.
const LOOP_F0 = 34;
const LOOP_F1 = 48;
/** how far clear of the board's last vertical the line runs */
const LOOP_PAD = 20;
const LOOP_X = B1.x + HALF + LOOP_PAD; // 2154
const LOOP_R = 90; // corner radius
/** it starts and ends on the marks' rims, not their centres */
const LOOP_X0 = B1.x + MARK_HALF; // 1765
const LOOP_PATH = [
  `M ${LOOP_X0} ${TOP_MARK_Y}`,
  `L ${LOOP_X - LOOP_R} ${TOP_MARK_Y}`,
  `A ${LOOP_R} ${LOOP_R} 0 0 1 ${LOOP_X} ${TOP_MARK_Y + LOOP_R}`,
  `L ${LOOP_X} ${BOT_MARK_Y - LOOP_R}`,
  `A ${LOOP_R} ${LOOP_R} 0 0 1 ${LOOP_X - LOOP_R} ${BOT_MARK_Y}`,
  `L ${LOOP_X0} ${BOT_MARK_Y}`,
].join(" ");
const LOOP_LEN =
  2 * (LOOP_X - LOOP_R - LOOP_X0) + 2 * ((Math.PI * LOOP_R) / 2) + (BOT_MARK_Y - TOP_MARK_Y - 2 * LOOP_R);
const loop = (f: number) => smoothstep(clamp01((f - LOOP_F0) / (LOOP_F1 - LOOP_F0)));

// ---------------------------------------------------------------------------
// THE PROOFS. Each one is something the brief or the director asked for.
// ---------------------------------------------------------------------------

/** 1. NO ORANGE. The model's mark is at COLUMN.x and its level line reaches
 *  LEVEL_HALF_LEN either side of it, so the right-most orange in the world is at
 *  x = COLUMN.x + LEVEL_HALF_LEN. The frame's left edge must clear it on every
 *  frame — including the pre-roll's first, which is the widest the shot ever is. */
const ORANGE_MAX_X = COLUMN.x + LEVEL_HALF_LEN; // 1010
const FRAME_LEFT_MIN = (() => {
  let worst = { f: -1, x: Infinity };
  for (let f = 0; f <= LAST; f++) {
    const c = camAt(f);
    const left = c.cx - WORLD_W / 2 / c.k;
    if (left < worst.x) worst = { f, x: left };
  }
  if (worst.x <= ORANGE_MAX_X) {
    throw new Error(
      `EquallyStrongV2: orange is in frame — the left edge reaches world x ${worst.x.toFixed(1)} at f${worst.f}, and the level line runs to ${ORANGE_MAX_X}.`,
    );
  }
  return worst;
})();

/** 2. THE STACK IS INSIDE THE FRAME. Both marks' outer ink and the board, on
 *  every frame from the landing on, with the director's own limits. */
const STACK_FIT = (() => {
  let top = { f: -1, y: Infinity };
  let bottom = { f: -1, y: -Infinity };
  let left = { f: -1, x: Infinity };
  let right = { f: -1, x: -Infinity };
  for (let f = LANDED_F; f <= LAST; f++) {
    const t = screenAt(f, B1.x, TOP_MARK_Y - MARK_HALF);
    const b = screenAt(f, B1.x, BOT_MARK_Y + MARK_HALF);
    const l = screenAt(f, B1.x - HALF, B1.y);
    const r = screenAt(f, B1.x + HALF, B1.y);
    if (t.y < top.y) top = { f, y: t.y };
    if (b.y > bottom.y) bottom = { f, y: b.y };
    if (l.x < left.x) left = { f, x: l.x };
    if (r.x > right.x) right = { f, x: r.x };
  }
  if (bottom.y > 1330) {
    throw new Error(
      `EquallyStrongV2: the bottom mark reaches screen y ${bottom.y.toFixed(1)} at f${bottom.f} (limit 1330).`,
    );
  }
  if (top.y < 150) {
    throw new Error(
      `EquallyStrongV2: the top mark reaches screen y ${top.y.toFixed(1)} at f${top.f} (limit 150).`,
    );
  }
  if (left.x < 80 || right.x > WORLD_W - 80) {
    throw new Error(
      `EquallyStrongV2: the board reaches screen x ${left.x.toFixed(1)}..${right.x.toFixed(1)} (limit 80..1000).`,
    );
  }
  return { top, bottom, left, right };
})();

/** 2b. NOTHING IS CLIPPED WHILE THE GLIDE IS STILL RUNNING. The stack is only
 *  fully assembled at the landing (the second mark is still rising until f30),
 *  so f0..LANDED_F is held to the weaker test the arriving shot deserves: the
 *  board and the top mark stay wholly inside the frame the whole way in. */
const GLIDE_FIT = (() => {
  let worst = { f: -1, y: Infinity };
  for (let f = 0; f < LANDED_F; f++) {
    const t = screenAt(f, B1.x, TOP_MARK_Y - MARK_HALF);
    const l = screenAt(f, B1.x - HALF, B1.y);
    const r = screenAt(f, B1.x + HALF, B1.y);
    if (t.y < worst.y) worst = { f, y: t.y };
    if (t.y < 0 || l.x < 0 || r.x > WORLD_W) {
      throw new Error(
        `EquallyStrongV2: the board is clipped at f${f} — top ${t.y.toFixed(0)}, x ${l.x.toFixed(0)}..${r.x.toFixed(0)}.`,
      );
    }
  }
  return worst;
})();

/** 3. THE LINE STAYS IN FRAME AND OFF THE BOARD. */
const LOOP_FIT = (() => {
  let worst = { f: -1, x: -Infinity };
  for (let f = LOOP_F0; f <= LAST; f++) {
    const r = screenAt(f, LOOP_X, B1.y).x;
    if (r > worst.x) worst = { f, x: r };
  }
  if (worst.x > WORLD_W - 60) {
    throw new Error(
      `EquallyStrongV2: the line reaches screen x ${worst.x.toFixed(1)} at f${worst.f} (limit 1020).`,
    );
  }
  if (LOOP_X - (B1.x + HALF) < 12) {
    throw new Error(`EquallyStrongV2: the line runs ${LOOP_X - (B1.x + HALF)} px from the board.`);
  }
  return worst;
})();

/** 4. THE SET'S CEILINGS on the camera, over seven fixed world points. */
const CAM_AUDIT = (() => {
  const pts: [number, number][] = [
    [1720, 640],
    [1306, 226],
    [2134, 1054],
    [1720, 156],
    [1720, 1124],
    [2154, 640],
    [2565, 405],
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
    if (maxV.v > SPEED_CAP_SCREEN) {
      throw new Error(`EquallyStrongV2: the frame moves ${maxV.v.toFixed(1)} px/f at f${maxV.f}.`);
    }
    if (maxDV.v > 2.5) {
      throw new Error(`EquallyStrongV2: camera |dv| ${maxDV.v.toFixed(2)} px/f^2 at f${maxDV.f}.`);
    }
  }
  if (minMean.v < 0.05) {
    throw new Error(`EquallyStrongV2: the frame parks at f${minMean.f}.`);
  }
  return { maxV, maxDV, minMean };
})();

/** 5. THE ZOOM NEVER TURNS ROUND: one push-in, and it is still pushing at the end. */
(() => {
  for (let f = 1; f <= LAST; f++) {
    if (kAt(f) < kAt(f - 1) - 1e-9) {
      throw new Error(`EquallyStrongV2: the zoom reverses at f${f}.`);
    }
  }
  if (!(kAt(LAST) > kAt(LAST - 1) + 1e-6)) {
    throw new Error("EquallyStrongV2: the zoom has stopped on the last frame — the cut resolves.");
  }
})();

/** 6. THE GAMES NEVER STOP: a stone lands on the last frame's board too. */
const STONES = BOARDS.map((b) => {
  const a = boardMovesAt(b, cf(0));
  const z = boardMovesAt(b, cf(LAST));
  const frames: number[] = [];
  for (let i = a; i < z; i++) frames.push(goMoveFrame(b, i) - OFF);
  return { id: b.id, from: a, to: z, placed: z - a, frames };
});
(() => {
  const total = STONES.reduce((s, r) => s + r.placed, 0);
  if (total < 60) {
    throw new Error(`EquallyStrongV2: only ${total} stones land in the cut — the games have run out.`);
  }
  const lastTen = STONES.some((r) => r.frames.some((f) => f >= LAST - 10));
  if (!lastTen) {
    throw new Error("EquallyStrongV2: nothing lands in the last ten frames — the cut resolves.");
  }
})();

// ---------------------------------------------------------------------------

const EquallyStrongV2: React.FC<Props> = ({
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
  const g = loop(frame);
  const m2 = mark2(frame);

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
            {/* every game cut 2 V2 left running, at its own pace and phase —
                the ones that are not the subject receding as we commit */}
            {BOARDS.map((b, i) => (
              <GoBoard
                key={b.id}
                b={b}
                frame={cf(frame)}
                k={k}
                opacity={i === 0 ? 1 : recede(frame)}
              />
            ))}

            {/* THE LINE — one open stroke, top mark round the game to the bottom one */}
            {g > 0 ? (
              <path
                d={LOOP_PATH}
                pathLength={1}
                fill="none"
                stroke={INK}
                strokeOpacity={INK_LO}
                strokeWidth={levelW(k)}
                strokeLinecap="butt"
                strokeDasharray={`${g.toFixed(4)} 1`}
              />
            ) : null}

            {/* THE OPPONENT — the same mark, mirrored under the board */}
            {m2 > 0 ? (
              <DeepMindMark k={k} x={B1.x} y={mark2Y(frame)} opacity={m2} />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default EquallyStrongV2;

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
    boardWorld: [B1.x, B1.y],
    boardHalf: HALF,
    boardWorldPx: 2 * HALF,
    movesOnBoard1AtF0: boardMovesAt(B1, cf(0)),
    movesOnBoard1AtEnd: boardMovesAt(B1, cf(LAST)),
    record: goRecordOf(B1).id,
    recordSource: goRecordOf(B1).source,
    openingCamera: {
      k: Number(J.k.toFixed(6)),
      cx: Number(J.cx.toFixed(3)),
      contentY: Number(J.y.toFixed(3)),
    },
    boardScreenAtF0: [
      Number(screenAt(0, B1.x, B1.y).x.toFixed(1)),
      Number(screenAt(0, B1.x, B1.y).y.toFixed(1)),
    ],
    boardScreenWAtF0: Number((2 * HALF * kAt(0)).toFixed(0)),
  },

  framing: {
    halfStackWorld: HALF_STACK,
    kLand: K_LAND,
    kEnd: Number(kAt(LAST).toFixed(4)),
    boardScreenW: [0, LANDED_F, 50, LAST].map((f) => [f, Number((2 * HALF * kAt(f)).toFixed(0))]),
    stoneScreenD: [0, LANDED_F, 50, LAST].map((f) => [
      f,
      Number((2 * GO_STONE_R * kAt(f)).toFixed(1)),
    ]),
    boardCentreScreenY: [LANDED_F, 34, 50, LAST].map((f) => [
      f,
      Number(screenAt(f, B1.x, B1.y).y.toFixed(1)),
    ]),
    glideTopInkDip: [GLIDE_FIT.f, Number(GLIDE_FIT.y.toFixed(0))],
    arrivedByLandingPct: Number(
      (((kAt(LANDED_F) - kAt(0)) / (kAt(LAST) - kAt(0))) * 100).toFixed(1),
    ),
    topMarkInkY: Number(STACK_FIT.top.y.toFixed(1)),
    bottomMarkInkY: Number(STACK_FIT.bottom.y.toFixed(1)),
    bottomMarkPerBeat: [28, 34, 48, 50, 64, LAST].map((f) => [
      f,
      Number(screenAt(f, B1.x, BOT_MARK_Y + MARK_HALF).y.toFixed(1)),
    ]),
    boardScreenX: [Number(STACK_FIT.left.x.toFixed(1)), Number(STACK_FIT.right.x.toFixed(1))],
    loopRightMostScreenX: Number(LOOP_FIT.x.toFixed(1)),
    loopClearanceOfBoardWorld: LOOP_PAD,
  },

  camera: {
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
    maxScreenSpeed: [CAM_AUDIT.maxV.f, Number(CAM_AUDIT.maxV.v.toFixed(2))],
    maxDV: [CAM_AUDIT.maxDV.f, Number(CAM_AUDIT.maxDV.v.toFixed(3))],
    minMeanSpeed: [CAM_AUDIT.minMean.f, Number(CAM_AUDIT.minMean.v.toFixed(3))],
    glide: [0, GLIDE_F1, GLIDE_WARP, `damped landing f${LANDED_F}`],
    creep: [GLIDE_F1, CREEP_F1, CREEP_K],
  },

  orange: {
    rightMostOrangeWorldX: ORANGE_MAX_X,
    frameLeftEdgeMin: [FRAME_LEFT_MIN.f, Number(FRAME_LEFT_MIN.x.toFixed(1))],
    clearanceWorldPx: Number((FRAME_LEFT_MIN.x - ORANGE_MAX_X).toFixed(1)),
  },

  gestures: {
    pushIn: [0, GLIDE_F1],
    secondMark: [MARK2_F0, MARK2_F1, `${MARK2_RISE} world px rise`],
    line: [LOOP_F0, LOOP_F1, `${LOOP_LEN.toFixed(0)} world px`],
    lineTipWorldPxPerF: Number((LOOP_LEN / (LOOP_F1 - LOOP_F0)).toFixed(1)),
    lineTipScreenPxPerF: Number(((LOOP_LEN / (LOOP_F1 - LOOP_F0)) * kAt(43)).toFixed(1)),
  },

  stones: STONES.map((r) => ({
    id: r.id,
    from: r.from,
    to: r.to,
    placed: r.placed,
    firstInCut: r.frames[0] ?? null,
    lastInCut: r.frames[r.frames.length - 1] ?? null,
  })),
  stonesPlacedTotal: STONES.reduce((s, r) => s + r.placed, 0),

  /** captures that happen INSIDE this cut, per board */
  captures: BOARDS.map((b) => {
    const rec = goRecordOf(b);
    const out: number[] = [];
    rec.capturedAt.forEach((cap) => {
      if (!Number.isFinite(cap)) return;
      const f = goMoveFrame(b, cap) - OFF;
      if (f >= 0 && f <= LAST && !out.includes(f)) out.push(f);
    });
    return { id: b.id, frames: out.sort((p, q) => p - q) };
  }),

  stroke: [0, GLIDE_F1, 50, LAST].map((f) => [
    f,
    Number(strokeScreen(kAt(f)).toFixed(2)),
    Number((levelW(kAt(f)) * kAt(f)).toFixed(2)),
  ]),

  /** what else is in the close-up: board 2 is directly below and cannot be framed
   *  out — this is where its ink actually sits. */
  recede: { frames: [RECEDE_F0, RECEDE_F1], to: RECEDE_TO },
  board2: [LANDED_F, 50, LAST].map((f) => ({
    f,
    markInkTopScreenY: Number(
      screenAt(f, BOARDS[1].x, BOARDS[1].y - goHalf(BOARDS[1]) - GO_MARK_GAP - MARK_HALF).y.toFixed(
        0,
      ),
    ),
    boardTopScreenY: Number(screenAt(f, BOARDS[1].x, BOARDS[1].y - goHalf(BOARDS[1])).y.toFixed(0)),
  })),
};
