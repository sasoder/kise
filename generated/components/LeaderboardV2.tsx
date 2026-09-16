import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  CAM_LIFT,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  Vignette,
  camEase,
  camMove,
  clamp01,
  iconShadow,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  KRAFT_BASE,
  KRAFT_BLUR,
  KRAFT_DIM,
  KRAFT_SRC,
  KraftBackground,
  MARK_SIZE,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
} from "./d1Shared";
import { ANTHROPIC, GOOGLE, OPENAI, type BrandGlyph } from "./brandGlyphs";

// ---------------------------------------------------------------------------
// "whose model scores better on this leaderboard" — the BAR CHART RACE, V2b.
// Cheeky Pint style on kraft, opaque cutaway, 1080x1920, 24fps.
//
// THE LINE (Bret Taylor, OpenAI board chair, on the AI research labs):
//   "you can look at OpenAI, Google, Anthropic and say whose model scores
//    better on this leaderboard"
//
// SRT span 28.920 -> 34.039.
//   round((34.039 - 28.920) * 24) = round(122.856) = 123 frames of speech, plus
//   a 16-frame tail so the resolved picture holds = 139.
//
// WORD ONSETS (frames from the composition start, = 28.920 s)
//   f0 you · f6 can · f9 look · f14 at · f20 OpenAI · f36 Google ·
//   f40 Anthropic · f58 and · f59 say · f64 whose · f74 model · f81 scores ·
//   f90 better · f96 on · f102 this · f105 leaderboard ·
//   speech ends f123 · tail to f139.
//
// ---------------------------------------------------------------------------
// WHAT THIS REVISION CHANGES. The director on the first bar-chart-race build:
// the swaps were clunky — the two tiles bowed around each other but still
// overlapped mid-pass, so the knocked-out marks stacked into one unreadable
// double mark — and a three-row ladder driven by a live sort forced two extra
// row passes (f70, f90) that served no word, because a lab climbing two slots
// had to be walked up one slot at a time. Three things changed and nothing
// else:
//
//   1. EACH LEAD CHANGE IS ONE MOVE, AND THERE ARE NO OTHER PASSES. The
//      standings are AUTHORED, not sorted: four moves, each one row travelling
//      as many slots as it needs while the rows it passes each drop one.
//      The bar lengths cross INSIDE that move — the climbing bar's surge
//      carries it past both bars it overtakes — so second and third never
//      cross each other on their own. Six crossings, all inside the four
//      windows; assertion 1 fails on any other.
//   2. THE CLIMBING ROW OVERTAKES ON THE OUTSIDE. TILE_BOW is gone. The
//      climbing row's TILE steps out LEFT on a smooth arc (STEP_PEAK 120 world
//      px, zero-sloped at both ends of the move) and returns into the column as
//      it lands; the rows it passes keep their tiles in the column. Its BAR
//      stays in the bar column and is drawn on top. Bars overlap briefly
//      mid-move — that is a race. Tiles never overlap at all; assertion 2.
//   3. MORE HEIGHT. Row pitch 170 -> 200, bar 44 -> 52; the camera re-solved
//      around the taller chart and around the lane the tile steps into.
//
// Kept exactly: the bar chart race itself, the tile labels, bars from the axis,
// amber = the longest bar and drawn on top, the launches on the names (f14 /
// f28 / f35), the camera opening tight on the empty axis and reacting to the
// leader's end, the bottom rule with its three ticks, no numbers, the alive
// tail, the padding and velocity discipline.
//
// THE CLIP'S ONE VISUAL RULE: many converge on one point, and amber is that
// point. Here the three labs converge on the top score, and the amber is the
// LEAD — the whole bar of whichever lab is currently longest. It hands over
// HARD on the frame two lengths cross; the crossing IS the event, so no fade.
//
// THE PICTURE. Three rows, one per lab. A row is that lab's mark tile at the
// LEFT (the only label in the piece) and a bar growing RIGHT from a thin ink
// rule down the left of the rows. Row pitch 200 world px, bar 52 tall, the
// house squircle with its radius on the 2 px floor. Under the rows, a second
// ink rule with three ticks. No numbers, no title, no legend, no gridlines.
//
// THE ROW ORDER IS THE LEADERBOARD. Slot 0 is the top row and it is the amber
// one, so the ranking reads off the picture with no sound.
//
// THE SCORES ARE ILLUSTRATIVE. Nothing on this chart is data. There are no
// numbers, dates, units, title or legend anywhere in the frame, and none of the
// three bars is taken from, or meant to represent, any published benchmark,
// leaderboard or release schedule. The picture claims exactly one thing, which
// is the thing the speaker says: three labs climb, and the lead keeps changing
// hands. The surge sizes and timings were chosen so the lead changes land on
// the words, and for no other reason.
//
// THE GESTURES — every one, with its word and its frame. There are no others.
//   f0-f14   "you can look    the camera is parked TIGHT (k K_TIGHT 1.95) on
//            at" (f0/6/9/14)  the empty left end: the y-rule, the bottom rule
//                             and nothing on them — the dull part. Alive on
//                             `sway` plus a 6 px rightward camera creep.
//   f14      (6 ahead of      OPENAI'S ROW ARRIVES at slot 0: the tile scales
//            "OpenAI" f20)    in over TILE_IN frames from TILE_FROM while its
//                             bar is already extending (the coin-minting
//                             recipe — never a pop at rest). It is the only
//                             bar, so the amber is on it.
//   f16      (2 after the     THE CAMERA REACTS. One damped `camMove`, warp
//            first bar moves) CAM_WARP, k 1.95 -> 1.0, content centre 836 ->
//                             852. cx is solved from k (`cxForK`) so the label
//                             column's left edge holds at screen PIN_X: the
//                             frame opens AWAY from a pinned left edge, which
//                             is "pans right following the longest bar's end"
//                             and nothing else. Keyed two frames AFTER that
//                             end first moves, never ahead of it.
//   f28      (8 ahead of      GOOGLE'S ROW ARRIVES at slot 1, same recipe.
//            "Google" f36)
//   f35      (5 ahead of      ANTHROPIC'S ROW ARRIVES at slot 2, same recipe.
//            "Anthropic" f40)
//   f35-f62  "and" f58,       three bars extending at different rates: surges
//            "say" f59        (a model release — 40..120 world px over 4..7
//                             frames) between steady creep. Nothing is still.
//                             OpenAI leads, its bar amber.
//   f55.7    (MOVE 1 opens)   GOOGLE PULLS OUT. Its tile leaves the column to
//                             the LEFT on the step-out arc and its row starts
//                             to rise — a car pulling out before it passes.
//   f61.70   (2.3 ahead of    LEAD 1. Google's f56-63 release crosses OpenAI's
//            "whose" f64)     creep at CROSS_V[0]. The amber hands to Google on
//                             that frame; the pass resolves at f71.7 with
//                             Google on slot 0 and OpenAI dropped to slot 1.
//   f76.0    (MOVE 2 opens)   ANTHROPIC PULLS OUT of slot 2 — the two-slot
//                             move. One surge, f76-83, carries it past BOTH
//                             bars it overtakes.
//   f79.50   (mid-sentence)   it passes OpenAI's length inside that move.
//   f82.00   (8 ahead of      LEAD 2. it passes Google's. Amber to Anthropic;
//            "better" f90)    the pass resolves at f92 — Anthropic slot 0,
//                             Google 1, OpenAI 2.
//   f92.0    (MOVE 3 opens,   OPENAI PULLS OUT of slot 2 on the same frame
//            straight off     move 2 lands: the churn never stops through the
//            move 2)          middle of the sentence.
//   f95.50   ("on" f96)       its f92-99 release — the biggest in the cut —
//                             passes Google's length.
//   f98.00   (7 ahead of      LEAD 3. the same release passes Anthropic's.
//            "leaderboard"    Amber back to OpenAI; the pass resolves at f108.
//            f105)
//   f92      ("leaderboard"   THE CAMERA IS AT REST. `camMove` ends at CAM_F1,
//            f105 is spoken   so the tail of the pull-back runs under "better",
//            over the creep)  and from there the camera only creeps.
//   f121.3   (MOVE 4 opens)   ANTHROPIC PULLS OUT for the last time.
//   f127.30  (tail)           LEAD 4, the one allowed extra: Anthropic's
//                             f122-129 release edges past OpenAI. The amber
//                             hands over for the last time; the pass resolves
//                             at f137.3.
//   f92-139  (tail)           held, alive: all three bars keep extending, the
//                             tiles sway, and the camera creeps CREEP_PX to the
//                             RIGHT following the growing ends (a creep, not a
//                             key). The settled spread on the last frame is
//                             RESOLVED_SPREAD world px, under 8% of the leader.
//
// THE LENGTH MODEL. A bar is a chain of contiguous legs, each either a SURGE
// (a smoothstep over its window, 40-120 world px in 4-7 frames — a release) or
// a CREEP (linear, 1.2-4.2 world px/frame — waiting). Legs that carry a TARGET
// ("be exactly V world px at frame f") have their amplitude solved by
// `buildLab`. Both labs at a crossing solve to the SAME V at the SAME frame, so
// the crossings are exact by construction. The two DOUBLE crossings — one surge
// passing two bars — are solved from both of their targets at once
// (`twoCross`), so a 7-frame release hits the first at its midpoint and the
// second at 6/7 of the way through.
//
// SPEED. The cap is 45 screen px/frame, measured at h = 1 and h = 1/4 on the
// bar ends, on the row y, and on the stepping tile (which carries the step-out
// on top of the row travel — the expensive one).
//
// PADDING. The ink is the tile column's left edge (INK_X0) to the bottom rule's
// right end (INK_X1), and the y-rule's top (INK_Y0) to the tick feet (INK_Y1).
// Measured analytically over f92-139 (sway and the tail creep included) it sits
// at screen x 202..919, y 539..1133 — 82 / 41 / 239 / 217 px of air inside the
// x 120..960 / y 300..1350 box — with the content centre on y 835 (CAM_LIFT).
// The LANE the climbing tile steps out into reaches screen x 71 at its
// furthest, inside the house band (x 60..1020) at every frame.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, and why each is forced by the brief's own rules:
//
//   * EVERY MOVE IS 16 FRAMES, not 10 for one slot and 14 for two. The brief's
//     own speed cap decides this and it is the brief's own sanctioned fallback
//     ("extend that move to 16 frames rather than cutting the pitch"), applied
//     to the one-slot moves as well. The step-out costs about 1.5 * STEP_PEAK /
//     (STEP_RAMP * dur) screen px per frame ON TOP of the row travel, and it
//     does not care how many slots the row crosses: measured at h = 1 and 1/4,
//     a 10-frame one-slot move peaks at 94 px/f and a 14-frame two-slot move at
//     67 — both roughly double the cap. At 16 frames with STEP_RAMP 0.30 they
//     come in at 44 and 43. Cutting the step-out instead is not available: the
//     tile column is 108 wide, so anything under ~118 px of step-out puts the
//     two knock-outs back on top of each other, which is the note being fixed.
//   * THE ROWS TRAVEL ON `flow(0.34)`, not the house `flow(0.28)`. The wider
//     ramp is what makes the step-out affordable: it holds the row almost still
//     while the tile is stepping out, so the two peaks stop adding. At 0.28 the
//     same move peaks at 47 px/f, over the cap; at 0.34 it is 43, and the flat
//     middle (where the tile is fully out and travelling straight up) is 39.
//   * A MOVE'S MIDPOINT IS 2 FRAMES AFTER ITS CROSSING, as asked, so the amber
//     hand-over always leads. With 16-frame moves that puts the LANDINGS 7.7 /
//     2 / 3 frames after "whose" / "better" / "leaderboard" rather than before
//     them. The alternative — landing the row before the word — would have to
//     start the move 10 frames before the bars cross, which reads as the row
//     climbing for no reason. What the viewer reads as the lead change is the
//     amber, and that still leads its word by 2.3 / 8 / 7 frames.
//   * MOVE 2 AND MOVE 3 ABUT (f92 is both). The two crossings are 16 frames
//     apart, so two 16-frame moves centred on them touch exactly. `flow` is
//     zero-velocity at both ends, so the reversal at f92 is smooth, and it is
//     what keeps the middle of the sentence churning.
//   * THE BOTTOM RULE IS NOT SHORT, IT RUNS THE WHOLE CHART (AX_X -> AX_RIGHT).
//     A rule shorter than the bars would have the leader's end hanging past the
//     scale it is measured on. Three ticks, no numbers, as asked.
//   * PIN_X IS 206, SO THE RESOLVED INK IS 82 PX OFF THE LEFT WALL AND 41 OFF
//     THE RIGHT. The left margin is not empty: it is the LANE, and the tile
//     swings into it four times. Counting the lane, the composition's centre is
//     screen x 494 — the ink alone reads 21 px right of centre, which is the
//     price of the lane and is inside the ">= 30 px of air" the brief asks for
//     on both sides.
//   * THE OPENING k IS K_TIGHT 1.95, not the old 2.2: the chart is 60 world px
//     taller now, and at 2.2 the empty axis runs 1263 screen px, past the house
//     band. At 1.95 it spans y 297..1436, inside it, and the shot is still the
//     bare axis with nothing on it.
//   * THE CAMERA PANS. `camMove`/`runCamera` carry only cy and k, so cx gets its
//     own key-per-frame track through the SAME damper (an inert k channel) and
//     the kraft takes cx/cxRest, which `GridBackground` already supports.
//     Inherited from the hurricane cut.
//   * THE PULL-BACK LANDS AT CAM_F1 92, not 112: the step-out costs k times its
//     world size in screen px, so a camera still at k 1.25 during move 2 would
//     put the stepping tile over the cap and its lane off the left of the band.
//     Landing on "better" leaves the last third of the line to the creep, which
//     is where the old build's camera was anyway.
//   * GOOGLE LAUNCHES 8 FRAMES AHEAD OF ITS WORD AND ANTHROPIC 5, not 6 and 6.
//     These are `Leaderboard.tsx`'s launch frames, kept so the versions can be
//     cut against each other; both are inside the house 4-10 frames.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 139;

// -- the drawing surface ----------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1450;

// -- the padding contract (the hurricane cut's box) -------------------------
export const PAD_X0 = 120;
export const PAD_X1 = 960;
export const PAD_Y0 = 300;
export const PAD_Y1 = 1350;

// -- the chart, in world px -------------------------------------------------
export const ROW_PITCH = 200;
export const ROW_Y0 = 640; // slot 0, the top row
export const rowSlotY = (slot: number) => ROW_Y0 + slot * ROW_PITCH; // 640 / 840 / 1040

export const TILE_CX = 196; // the label column: the tile spans 142..250
export const AX_X = 296; // the y-rule, and the bars' left edge
export const AX_RIGHT = 846; // the bottom rule's right end
export const AX_TOP = 560; // the y-rule's top, 26 px above the top tile
export const AXIS_Y = 1134; // the bottom rule, 40 px under the bottom tile
export const TICK = 10;
export const AXIS_OP = 0.55; // the hurricane cut's axis ink
export const STROKE = 2.5; // the ONE stroke weight in the piece
export const BAR_H = 52;
// Three ticks, no numbers: this is not data and nothing is claimed.
export const X_TICKS = [AX_X + 150, AX_X + 300, AX_X + 450];

// -- the eases --------------------------------------------------------------
// `flow` is BackIntoItV5's, imported by copy because it is that file's private
// helper: a travel with a flat middle and zero velocity at both ends. `a` is
// the ramp at each end; this cut runs it at 0.34 rather than the house 0.28 so
// the row is still nearly parked while the tile steps out (see DEVIATIONS).
export const FLOW_A = 0.34;
export const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};

// -- the six crossing values, in world px -----------------------------------
// The length both bars have on the frame they cross. Each is solved for by BOTH
// labs (see `buildLab`), so every crossing is exact. Four of them are lead
// changes cut to words; the other two are the first half of a double pass, a
// climbing bar going past second place on its way to first, and they happen
// inside the same move and the same surge.
export const CROSS_F = [61.7, 79.5, 82.0, 95.5, 98.0, 127.3] as const;
export const CROSS_V = [230, 280, 322, 358, 392, 500] as const;

// A 7-frame release that passes TWO bars: it is at `vA` on its midpoint and at
// `vB` at 6/7 of the way through. Solving both at once gives the amplitude and
// the length the bar has to arrive at.
const S_MID = smoothstep(0.5); // 0.5
const S_LATE = smoothstep(6 / 7); // 0.944606
const twoCross = (vA: number, vB: number) => {
  const d = (vB - vA) / (S_LATE - S_MID);
  return { d, from: vA - S_MID * d };
};
const M2_SURGE = twoCross(CROSS_V[1], CROSS_V[2]); // Anthropic, f76-83
const M3_SURGE = twoCross(CROSS_V[3], CROSS_V[4]); // OpenAI, f92-99

// -- the bars ---------------------------------------------------------------
export type LegSpec =
  | { kind: "surge" | "creep"; f0: number; f1: number; d: number }
  | { kind: "surge" | "creep"; f0: number; f1: number; toL: number; atF: number };
export type Leg = { kind: "surge" | "creep"; f0: number; f1: number; d: number };

const legFrac = (kind: "surge" | "creep", f0: number, f1: number, f: number) => {
  const u = (f - f0) / (f1 - f0);
  return kind === "creep" ? clamp01(u) : smoothstep(u);
};

// Walk the chain once, resolving every `toL / atF` leg into a plain amplitude.
// A leg's start length is exact because the legs are contiguous and ordered.
const buildLab = (specs: LegSpec[]): Leg[] => {
  let L = 0;
  return specs.map((sp) => {
    let d: number;
    if ("d" in sp) d = sp.d;
    else {
      const p = legFrac(sp.kind, sp.f0, sp.f1, sp.atF);
      if (p <= 1e-6) {
        throw new Error(`LeaderboardV2: leg f${sp.f0}-${sp.f1} has no travel at f${sp.atF}`);
      }
      d = (sp.toL - L) / p;
    }
    L += d;
    return { kind: sp.kind, f0: sp.f0, f1: sp.f1, d };
  });
};

const surge = (f0: number, f1: number, d: number): LegSpec => ({ kind: "surge", f0, f1, d });
const creep = (f0: number, f1: number, d: number): LegSpec => ({ kind: "creep", f0, f1, d });
const surgeTo = (f0: number, f1: number, toL: number, atF: number): LegSpec => ({
  kind: "surge",
  f0,
  f1,
  toL,
  atF,
});
const creepTo = (f0: number, f1: number, toL: number, atF: number): LegSpec => ({
  kind: "creep",
  f0,
  f1,
  toL,
  atF,
});

export type Lab = {
  key: "OPENAI" | "GOOGLE" | "ANTHROPIC";
  glyph: BrandGlyph;
  glyphFraction: number; // the 24-unit box fills this much of the 108 tile
  launch: number;
  legs: Leg[];
};

export const LABS: Lab[] = [
  {
    // OpenAI: first out, leads to f61.7, is passed twice inside four seconds,
    // then takes the lead back with the biggest release in the cut — one surge
    // that goes past both of them — and spends the rest of the tail creeping,
    // which is what Anthropic finally catches.
    key: "OPENAI",
    glyph: OPENAI,
    glyphFraction: 0.58,
    launch: 14,
    legs: buildLab([
      surge(14, 20, 44), //        the launch release; the tile scales in over it
      creep(20, 28, 21), //        2.63 px/f
      surge(28, 34, 52),
      creep(34, 44, 28), //        2.80 px/f
      surge(44, 50, 50),
      creepTo(50, 64, CROSS_V[0], CROSS_F[0]), //   C1 f61.7 — Google goes past
      creepTo(64, 82, CROSS_V[1], CROSS_F[1]), //   C2 f79.5 — Anthropic goes past
      creepTo(82, 92, M3_SURGE.from, 92), //        the stall that buys the leap
      surgeTo(92, 99, CROSS_V[3], CROSS_F[3]), //   C4 f95.5 past Google and
      //                           C5 f98 past Anthropic, one release, the lead
      //                           back 7 frames ahead of "leaderboard"
      creepTo(99, 128, CROSS_V[5], CROSS_F[5]), //  C6 f127.3 — Anthropic past
      creep(128, 139, 14), //      1.27 px/f
    ]),
  },
  {
    // Google: the middle of the race. Takes the lead on the f56-63 release and
    // holds it through "and say whose model", is passed twice in eight frames,
    // and gets one more release at the very end that does not change anything.
    key: "GOOGLE",
    glyph: GOOGLE,
    glyphFraction: 0.56,
    launch: 28,
    legs: buildLab([
      surge(28, 33, 44),
      creep(33, 41, 22), //        2.75 px/f
      surge(41, 47, 58),
      creep(47, 56, 23), //        2.56 px/f
      surgeTo(56, 63, CROSS_V[0], CROSS_F[0]), //   C1 f61.7 — past OpenAI
      creep(63, 68, 14), //        2.80 px/f
      surge(68, 74, 44),
      creepTo(74, 82, CROSS_V[2], 82), //           C3 f82 — Anthropic goes past
      creepTo(82, 104, CROSS_V[3], CROSS_F[3]), //  C4 f95.5 — OpenAI goes past
      creep(104, 130, 62), //      2.38 px/f
      surge(130, 136, 42),
      creep(136, 139, 10), //      3.33 px/f
    ]),
  },
  {
    // Anthropic: last out and the steepest. Two releases back to back take it
    // from bottom to top across "say whose model scores" — the second goes past
    // both bars in one move — and a third wins the tail.
    key: "ANTHROPIC",
    glyph: ANTHROPIC,
    glyphFraction: 0.62, // its ink is 24 x 16.918, so it needs a wider box
    launch: 35,
    legs: buildLab([
      surge(35, 41, 50),
      creep(41, 47, 16), //        2.67 px/f
      surge(47, 52, 46),
      creep(52, 57, 12), //        2.40 px/f
      surge(57, 63, 46),
      creep(63, 69, 16), //        2.67 px/f
      surgeTo(69, 76, M2_SURGE.from, 76), //        the run-up into the move
      surgeTo(76, 83, CROSS_V[1], CROSS_F[1]), //   C2 f79.5 past OpenAI and
      //                           C3 f82 past Google, one release, the lead 8
      //                           frames ahead of "better"
      creep(83, 87, 10), //        2.50 px/f
      surge(87, 93, 44),
      creepTo(93, 122, CROSS_V[4], CROSS_F[4]), //  C5 f98 — OpenAI goes past
      surgeTo(122, 129, CROSS_V[5], CROSS_F[5]), // C6 f127.3 — past OpenAI
      creep(129, 139, 22), //      2.20 px/f
    ]),
  },
];

export const lengthAt = (lab: Lab, f: number) => {
  if (f < lab.launch) return 0;
  let L = 0;
  for (const leg of lab.legs) L += leg.d * legFrac(leg.kind, leg.f0, leg.f1, f);
  return L;
};
export const liveAt = (lab: Lab, f: number) => f >= lab.launch;
export const barEndAt = (lab: Lab, f: number) => AX_X + lengthAt(lab, f);

// The leader is simply the longest live bar. Its WHOLE bar is amber and the
// amber hands over on the frame the crossing happens — no fade, no trim.
export const leaderAt = (f: number) => {
  let best = -1;
  let L = -Infinity;
  LABS.forEach((lab, i) => {
    if (!liveAt(lab, f)) return;
    const l = lengthAt(lab, f);
    if (l > L) {
      L = l;
      best = i;
    }
  });
  return best;
};

// -- the standings ----------------------------------------------------------
// AUTHORED, not sorted. `ORDERS[n]` is the standings after n moves, slot -> lab
// (0 OpenAI, 1 Google, 2 Anthropic). Every change between two of them is ONE
// row climbing and the rows it passes each dropping exactly one slot.
export const ORDERS: number[][] = [
  [0, 1, 2], //  the opening ladder: OpenAI, Google, Anthropic in launch order
  [1, 0, 2], //  move 1: Google 2nd -> 1st, OpenAI -> 2nd
  [2, 1, 0], //  move 2: Anthropic 3rd -> 1st, Google -> 2nd, OpenAI -> 3rd
  [0, 2, 1], //  move 3: OpenAI 3rd -> 1st, Anthropic -> 2nd, Google -> 3rd
  [2, 0, 1], //  move 4: Anthropic 2nd -> 1st, OpenAI -> 2nd
];
export const slotIn = (order: number[], lab: number) => order.indexOf(lab);

// A move is 16 frames whatever it crosses (see DEVIATIONS) and its MIDPOINT sits
// MOVE_LEAD frames after the crossing that hands the lead over, so the amber
// always changes before the rows have finished.
export const MOVE_DUR = 16;
export const MOVE_LEAD = 2;
export const MOVE_CROSS = [CROSS_F[0], CROSS_F[2], CROSS_F[4], CROSS_F[5]] as const;

export type Move = {
  n: number; // 1-based
  cross: number; // the lead-change crossing this move is cut to
  f0: number;
  f1: number;
  climber: number; // the lab that rises
  from: number[]; // slot per lab, before
  to: number[]; // slot per lab, after
};
export const MOVES: Move[] = MOVE_CROSS.map((cross, n) => {
  const before = ORDERS[n];
  const after = ORDERS[n + 1];
  const from = LABS.map((_, i) => slotIn(before, i));
  const to = LABS.map((_, i) => slotIn(after, i));
  const climber = LABS.map((_, i) => i).find((i) => to[i] < from[i]) as number;
  const f0 = Number((cross + MOVE_LEAD - MOVE_DUR / 2).toFixed(4));
  return { n: n + 1, cross, f0, f1: Number((f0 + MOVE_DUR).toFixed(4)), climber, from, to };
});

// The lead changes: every move hands slot 0 to its climber.
export const SWAPS = MOVES.map((m) => ({
  f: m.cross,
  move: m.n,
  from: m.f0,
  to: LABS[m.climber].key,
  lands: m.f1,
}));

// A row's y: its opening slot plus every move's delta, eased on `flow`.
export const rowYAt = (i: number, f: number) => {
  let y = rowSlotY(slotIn(ORDERS[0], i));
  for (const m of MOVES) {
    if (f <= m.f0) continue;
    y += (rowSlotY(m.to[i]) - rowSlotY(m.from[i])) * flow((f - m.f0) / MOVE_DUR);
  }
  return y;
};

// 0 = parked, 1 = dropping, 2 = climbing. The climber is drawn last: its bar
// passes over the ones it overtakes, which is the occlusion that reads as a
// pass.
export const passStateAt = (i: number, f: number) => {
  let z = 0;
  for (const m of MOVES) {
    if (f < m.f0 || f >= m.f1) continue;
    if (m.to[i] === m.from[i]) continue;
    z = Math.max(z, m.climber === i ? 2 : 1);
  }
  return z;
};

// -- the tile on the row ----------------------------------------------------
export const TILE_IN = 5; // frames the tile takes to scale in as the bar leaves
export const TILE_FROM = 0.06;
export const SWAY_AMP = 2; // world px; the tiles are never dead still
export const SWAY_PERIOD = [31, 37, 29];

// THE OVERTAKE IS ON THE OUTSIDE. Two rows crossing have, by definition, the
// same bar length on the crossing frame, so mid-pass their tiles are in the
// same place — and a tile is a KNOCK-OUT, so the mark behind shows through the
// mark in front and the two read as one unreadable double mark (measured on the
// f61-67 zoom of the first build; that build's +/- 34 px bow was not enough to
// separate them). So the CLIMBING row's tile leaves the column altogether: it
// steps out LEFT on an arc that is zero in value AND in velocity at both ends
// of the move, holds STEP_PEAK 120 px clear — 12 px more than the 108 column,
// so the two never touch — through the whole crossing, and returns into the
// column as the row lands. The rows it passes do not move sideways at all.
export const STEP_PEAK = 120;
export const STEP_RAMP = 0.3; // fraction of the move spent leaving / returning
export const stepOutAt = (i: number, f: number) => {
  let x = 0;
  for (const m of MOVES) {
    if (m.climber !== i || f < m.f0 || f > m.f1) continue;
    const u = clamp01((f - m.f0) / MOVE_DUR);
    x -= STEP_PEAK * smoothstep(Math.min(u, 1 - u) / STEP_RAMP);
  }
  return x;
};

// -- the camera -------------------------------------------------------------
// One damped curve. It opens parked on the empty left end, is opened up by the
// bars, keyed two frames after OpenAI's end first moves, and lands at CAM_F1.
// THE PAN IS A PIN. cx is not keyed between two numbers: it is solved from k so
// that the LABEL COLUMN'S LEFT EDGE (INK_X0) holds at screen PIN_X for the whole
// move — `cxForK`. Two things come out of that and both are the shot. The chart
// opens away from a fixed left edge, which is exactly "pans right following the
// longest bar's end" and nothing else. And the tiles are inside the frame the
// moment they arrive: keyed as a straight cx ramp instead, the product
// (cx - INK_X0) * k sags in the middle of the pull-back and OpenAI's tile
// arrives at f14 off the left edge, with its identity — the only label in the
// piece — invisible for the ten frames that matter.
export const K_TIGHT = 1.95;
export const C_TIGHT = 836;
export const OPEN_CREEP = 6; // world px of rightward creep before the move
export const K_FINAL = 1.0;
export const C_FINAL = 852; // = the ink box's centre in y
export const CY_FINAL = C_FINAL + CAM_LIFT / K_FINAL;
export const PIN_X = 206; // screen x the label column's left edge holds at
export const CAM_F0 = 16;
export const CAM_F1 = 92;
export const CAM_WARP = 0.44;
// The tail's breath: a creep, not a key, following the ends as they keep
// growing after the camera is at rest. Centred on the pin so it costs the same
// on both margins.
export const CREEP_F0 = CAM_F1;
export const CREEP_PX = 10;

// The analytic ink bbox at the resolved camera: the tile column's left edge and
// the bottom rule's right end, the y-rule's top and the tick feet.
export const INK_X0 = TILE_CX - MARK_SIZE / 2; // 142
export const INK_X1 = AX_RIGHT; // 846
export const INK_Y0 = AX_TOP; // 560
export const INK_Y1 = AXIS_Y + TICK; // 1144
// The lane the climbing tile steps out into — the left wall of the composition.
export const LANE_X0 = INK_X0 - STEP_PEAK; // 22

export const cxForK = (k: number) => INK_X0 + (540 - PIN_X) / k;
export const CX_TIGHT = cxForK(K_TIGHT);
export const CX_FINAL = cxForK(K_FINAL);

const CAM_TRACK = (() => {
  const F: number[] = [0];
  const K: number[] = [K_TIGHT];
  const CY: number[] = [C_TIGHT + CAM_LIFT / K_TIGHT];
  F.push(CAM_F0 - 1);
  K.push(K_TIGHT);
  CY.push(C_TIGHT + CAM_LIFT / K_TIGHT);
  const m = camMove({
    f0: CAM_F0,
    f1: CAM_F1,
    k0: K_TIGHT,
    k1: K_FINAL,
    c0: C_TIGHT,
    c1: C_FINAL,
    warp: CAM_WARP,
  });
  m.F.forEach((f, i) => {
    F.push(f);
    K.push(m.K[i]);
    CY.push(m.CY[i]);
  });
  F.push(DURATION);
  K.push(K_FINAL);
  CY.push(CY_FINAL);
  return { F, K, CY };
})();
export const CAM_F = CAM_TRACK.F;
export const CAM_K = CAM_TRACK.K;
export const CAM_CY = CAM_TRACK.CY;

// cx through the SAME damper, as the hurricane cut does it: `runCamera` damps
// its middle channel against a key-per-frame target, so handing it the cx keys
// and an inert k channel gives the pan exactly the weight of the zoom. The
// opening creep is the first two keys.
const CAMX_TRACK = (() => {
  const F: number[] = [0, CAM_F0 - 1];
  const X: number[] = [CX_TIGHT - OPEN_CREEP, CX_TIGHT];
  const span = CAM_F1 - CAM_F0;
  for (let i = 0; i <= span; i++) {
    F.push(CAM_F0 + i);
    X.push(cxForK(K_TIGHT + (K_FINAL - K_TIGHT) * camEase(i / span, CAM_WARP)));
  }
  F.push(DURATION);
  X.push(CX_FINAL);
  return { F, X, K: F.map(() => 1) };
})();
export const CAMX_F = CAMX_TRACK.F;
export const CAMX_X = CAMX_TRACK.X;
export const CAMX_K = CAMX_TRACK.K;

export const creepAt = (f: number) =>
  CREEP_PX * smoothstep((f - CREEP_F0) / (DURATION - CREEP_F0)) - CREEP_PX / 2;

export const camAt = (f: number) => {
  const c = runCamera(f, CAM_F, CAM_CY, CAM_K);
  const x = runCamera(f, CAMX_F, CAMX_X, CAMX_K).cy;
  return { k: c.k, cy: c.cy, cx: x + creepAt(f) };
};

// The resolved picture a later cut inherits: the standings on the last frame,
// top row first.
export const RESOLVED_ROWS = ORDERS[ORDERS.length - 1].map((i, slot) => ({
  key: LABS[i].key,
  slot,
  length: Number(lengthAt(LABS[i], DURATION).toFixed(2)),
}));
export const RESOLVED_SPREAD = Number(
  (RESOLVED_ROWS[0].length - RESOLVED_ROWS[2].length).toFixed(2),
);

// -- the beat table ---------------------------------------------------------
export const BEATS = {
  you: 0,
  can: 6,
  look: 9,
  at: 14, // OpenAI's row arrives here, 6 ahead of its name
  openai: 20,
  google: 36,
  anthropic: 40,
  and: 58,
  say: 59,
  whose: 64, // the first lead change hands over 2.3 frames ahead of this
  model: 74,
  scores: 81,
  better: 90, // the second, 8 frames ahead
  on: 96,
  thisWord: 102,
  leaderboard: 105, // the third, 7 frames ahead
  end: 123, // speech ends; tail to 139
} as const;

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
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  vignette: z.number(),
  beats: z.object({
    you: z.number(),
    can: z.number(),
    look: z.number(),
    at: z.number(),
    openai: z.number(),
    google: z.number(),
    anthropic: z.number(),
    and: z.number(),
    say: z.number(),
    whose: z.number(),
    model: z.number(),
    scores: z.number(),
    better: z.number(),
    on: z.number(),
    thisWord: z.number(),
    leaderboard: z.number(),
    end: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  backgroundBase: KRAFT_BASE,
  backgroundSrc: KRAFT_SRC,
  backgroundBlur: KRAFT_BLUR,
  backgroundDim: KRAFT_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  vignette: 0.55,
  beats: BEATS,
});

// A lab's mark as a house tile: the white squircle with the tile gradient and
// TILE_SHADOW, and the brand mark KNOCKED OUT of it so the kraft shows through
// — the D1Mark / CompanyCard recipe, on the 24-unit box `brandGlyphs.tsx`
// documents. Uniform scale: `glyphFraction` of the tile, about the box centre.
const MarkTile: React.FC<{
  lab: Lab;
  x: number;
  y: number;
  k: number;
  scale: number;
}> = ({ lab, x, y, k, scale }) => {
  const size = MARK_SIZE;
  const tile = squirclePath(size, size, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const g = size * lab.glyphFraction;
  const s = g / 24;
  const o = (size - g) / 2;
  const id = `lb2-${lab.key}`;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale.toFixed(4)}) translate(${-size / 2} ${-size / 2})`}
      style={{ filter: TILE_SHADOW(k * scale) }}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={size} height={size}>
          <rect width={size} height={size} fill="#fff" />
          <g transform={`translate(${o} ${o}) scale(${s})`} fill="#000">
            {lab.glyph.paths.map((d, i) => (
              <path key={i} d={d} fillRule="evenodd" />
            ))}
          </g>
        </mask>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TILE_GRAD_TOP} />
          <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
        </linearGradient>
      </defs>
      <path d={tile} fill={`url(#${id}-g)`} mask={`url(#${id})`} />
    </g>
  );
};

const LeaderboardV2: React.FC<Props> = ({
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
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  vignette,
}) => {
  const frame = useCurrentFrame();

  const cam = camAt(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = cam.cx + drift.dx;
  const k = cam.k;
  const { tx: wx, ty: wy } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const lead = leaderAt(frame);
  // Parked rows first, then the ones dropping, then the one climbing: its bar
  // passes over the bars it overtakes, and its tile is out in the lane.
  const order = [0, 1, 2]
    .filter((i) => liveAt(LABS[i], frame))
    .sort((a, b) => passStateAt(a, frame) - passStateAt(b, frame));

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <KraftBackground
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        cx={cx}
        cxRest={CX_TIGHT}
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
            transform: `translate(${wx}px, ${wy}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the axes: the rule the bars leave from, the rule they are
                measured on, three ticks. No numbers, no grid, no box. */}
            <g
              style={{ filter: icon }}
              stroke={ink}
              strokeOpacity={AXIS_OP}
              strokeWidth={STROKE}
              strokeLinecap="butt"
            >
              <line x1={AX_X} y1={AX_TOP} x2={AX_X} y2={AXIS_Y} />
              <line x1={AX_X} y1={AXIS_Y} x2={AX_RIGHT} y2={AXIS_Y} />
              {X_TICKS.map((x) => (
                <line key={`xt${x}`} x1={x} y1={AXIS_Y} x2={x} y2={AXIS_Y + TICK} />
              ))}
            </g>

            {/* the three rows. One stroke weight, one ink, one accent: the
                WHOLE bar of whichever lab is currently longest is accent and
                the other two are ink, switched hard on the crossing frame. */}
            {order.map((i) => {
              const lab = LABS[i];
              const len = lengthAt(lab, frame);
              const y = rowYAt(i, frame);
              const s = SWAY_AMP * Math.sin((frame / SWAY_PERIOD[i]) * 2 * Math.PI + i * 2.1);
              const inScale =
                TILE_FROM + (1 - TILE_FROM) * smoothstep((frame - lab.launch) / TILE_IN);
              return (
                <g key={`row-${lab.key}`}>
                  {len > 0.5 ? (
                    <g style={{ filter: icon }} transform={`translate(${AX_X} ${y - BAR_H / 2})`}>
                      <path
                        d={squirclePath(len, BAR_H, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH)}
                        fill={lead === i ? accent : ink}
                      />
                    </g>
                  ) : null}
                  <MarkTile
                    lab={lab}
                    x={TILE_CX + stepOutAt(i, frame) + s * 0.4}
                    y={y + s}
                    k={k}
                    scale={inScale}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette strength={vignette} />
    </AbsoluteFill>
  );
};

export default LeaderboardV2;

// ---------------------------------------------------------------------------
// The joins the cut rests on, asserted so a change to a leg cannot quietly move
// a lead change off its word, add a crossing that serves no word, stack two
// tiles, or push the ink out of the padding box.
// ---------------------------------------------------------------------------

// 1. EXACTLY SIX CROSSINGS, each on its authored frame, each inside a move.
//    Scanned on every pair at 1/40 frame; any other sign change fails.
{
  const found: { f: number; pair: string }[] = [];
  for (let a = 0; a < 3; a++) {
    for (let b = a + 1; b < 3; b++) {
      const start = Math.max(LABS[a].launch, LABS[b].launch) + 0.5;
      let prev = lengthAt(LABS[a], start) - lengthAt(LABS[b], start);
      for (let f = start + 0.025; f <= DURATION; f += 0.025) {
        const d = lengthAt(LABS[a], f) - lengthAt(LABS[b], f);
        if (d !== 0 && prev !== 0 && Math.sign(d) !== Math.sign(prev)) {
          found.push({ f, pair: `${LABS[a].key}/${LABS[b].key}` });
        }
        if (d !== 0) prev = d;
      }
    }
  }
  found.sort((p, q) => p.f - q.f);
  if (found.length !== CROSS_F.length) {
    throw new Error(
      `LeaderboardV2: ${found.length} length crossings, not ${CROSS_F.length}: ${JSON.stringify(
        found.map((c) => `${c.pair}@${c.f.toFixed(2)}`),
      )}`,
    );
  }
  found.forEach((c, i) => {
    if (Math.abs(c.f - CROSS_F[i]) > 0.06) {
      throw new Error(
        `LeaderboardV2: crossing ${i + 1} (${c.pair}) happens on f${c.f.toFixed(2)}, not f${CROSS_F[i]}`,
      );
    }
    if (!MOVES.some((m) => c.f > m.f0 && c.f < m.f1)) {
      throw new Error(
        `LeaderboardV2: crossing ${i + 1} on f${c.f.toFixed(2)} falls outside every move window`,
      );
    }
  });
}

// 2. THE TILES NEVER OVERLAP. Two 108 px tiles overlap when they are inside 108
//    px of each other in BOTH axes; the step-out exists to make that impossible.
{
  let worst = { f: 0, gap: Infinity, pair: "" };
  for (let f = LABS[1].launch; f <= DURATION; f += 0.05) {
    const s = (i: number) => {
      const w = SWAY_AMP * Math.sin((f / SWAY_PERIOD[i]) * 2 * Math.PI + i * 2.1);
      return { x: TILE_CX + stepOutAt(i, f) + w * 0.4, y: rowYAt(i, f) + w };
    };
    for (let a = 0; a < 3; a++) {
      for (let b = a + 1; b < 3; b++) {
        if (!liveAt(LABS[a], f) || !liveAt(LABS[b], f)) continue;
        const p = s(a);
        const q = s(b);
        const gap = Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y)) - MARK_SIZE;
        if (gap < worst.gap) worst = { f, gap, pair: `${LABS[a].key}/${LABS[b].key}` };
      }
    }
  }
  if (worst.gap <= 0) {
    throw new Error(
      `LeaderboardV2: ${worst.pair} tiles overlap by ${(-worst.gap).toFixed(2)} px on f${worst.f.toFixed(2)}`,
    );
  }
}

// 3. The authored standings ARE the length order on the frame every move opens
//    and the frame it lands, so the picture never disagrees with the ranking.
MOVES.forEach((m) => {
  ([
    [m.f0, m.from],
    [m.f1, m.to],
  ] as [number, number[]][]).forEach(([f, slots]) => {
    const byLength = [0, 1, 2]
      .filter((i) => liveAt(LABS[i], f))
      .sort((a, b) => lengthAt(LABS[b], f) - lengthAt(LABS[a], f));
    byLength.forEach((lab, slot) => {
      if (slots[lab] !== slot) {
        throw new Error(
          `LeaderboardV2: on f${f}, ${LABS[lab].key} is ${slot + 1} by length but sits in slot ${slots[lab] + 1}`,
        );
      }
    });
  });
});

// 4. The moves are four, disjoint, and inside the cut.
MOVES.forEach((m, i) => {
  if (m.f0 < 0 || m.f1 > DURATION) {
    throw new Error(`LeaderboardV2: move ${m.n} runs f${m.f0}-${m.f1}, outside 0-${DURATION}`);
  }
  if (i > 0 && m.f0 < MOVES[i - 1].f1) {
    throw new Error(`LeaderboardV2: move ${m.n} starts on f${m.f0}, before move ${i} lands`);
  }
  const climbers = LABS.map((_, j) => j).filter((j) => m.to[j] < m.from[j]);
  if (climbers.length !== 1 || climbers[0] !== m.climber || m.to[m.climber] !== 0) {
    throw new Error(`LeaderboardV2: move ${m.n} is not one row climbing to slot 0`);
  }
  LABS.forEach((_, j) => {
    if (j !== m.climber && m.to[j] - m.from[j] !== (m.from[j] < m.from[m.climber] ? 1 : 0)) {
      throw new Error(`LeaderboardV2: move ${m.n} does not drop the rows it passes by exactly one`);
    }
  });
});

// 5. The lead changes sit 0-10 frames ahead of the words they are cut to.
{
  const want: { to: string; word: number }[] = [
    { to: "GOOGLE", word: BEATS.whose },
    { to: "ANTHROPIC", word: BEATS.better },
    { to: "OPENAI", word: BEATS.leaderboard },
  ];
  want.forEach((w, i) => {
    const s = SWAPS[i];
    if (!s || s.to !== w.to) {
      throw new Error(
        `LeaderboardV2: lead change ${i + 1} should hand the lead to ${w.to}; got ${
          s ? `${s.to} on f${s.f}` : "nothing"
        }`,
      );
    }
    const ahead = w.word - s.f;
    if (ahead < 0 || ahead > 10) {
      throw new Error(
        `LeaderboardV2: lead change ${i + 1} on f${s.f} is not 0-10 frames ahead of its word (f${w.word})`,
      );
    }
  });
  if (SWAPS.length !== 4) {
    throw new Error(`LeaderboardV2: ${SWAPS.length} lead changes, not 4`);
  }
}

// 6. Exactly one bar is amber on every frame from OpenAI's launch on, and the
//    amber is on the climber from its crossing frame to the end of its move.
for (let f = LABS[0].launch; f <= DURATION; f++) {
  if (leaderAt(f) < 0) {
    throw new Error(`LeaderboardV2: no bar is amber on f${f}; one has to be, from f${LABS[0].launch}`);
  }
}
MOVES.forEach((m) => {
  for (let f = Math.ceil(m.cross + 0.5); f <= m.f1; f++) {
    if (leaderAt(f) !== m.climber) {
      throw new Error(
        `LeaderboardV2: move ${m.n}'s climber ${LABS[m.climber].key} is not amber on f${f}`,
      );
    }
  }
});

// 7. Every surge is a release (40-120 world px over 4-7 frames) and every creep
//    is a real creep, never a stall.
LABS.forEach((lab) => {
  lab.legs.forEach((leg) => {
    const dur = leg.f1 - leg.f0;
    if (leg.kind === "surge") {
      if (leg.d < 40 || leg.d > 120) {
        throw new Error(
          `LeaderboardV2: ${lab.key}'s f${leg.f0}-${leg.f1} surge is ${leg.d.toFixed(2)} px, outside 40-120`,
        );
      }
      if (dur < 4 || dur > 7) {
        throw new Error(
          `LeaderboardV2: ${lab.key}'s f${leg.f0}-${leg.f1} surge runs ${dur} frames, outside 4-7`,
        );
      }
    } else if (leg.d / dur < 1.2 || leg.d / dur > 4.2) {
      throw new Error(
        `LeaderboardV2: ${lab.key}'s f${leg.f0}-${leg.f1} creep runs at ${(leg.d / dur).toFixed(2)} px/f, outside 1.2-4.2`,
      );
    }
  });
});

// 8. Nothing is static: every live bar is still extending on every frame.
for (let f = 1; f <= DURATION; f++) {
  LABS.forEach((lab) => {
    if (f <= lab.launch + 1) return;
    const d = lengthAt(lab, f) - lengthAt(lab, f - 1);
    if (d < 0.8) {
      throw new Error(`LeaderboardV2: ${lab.key}'s bar only grows ${d.toFixed(2)} px on f${f}`);
    }
  });
}

// 9. The tail is a close battle and the last frame is inside 8% of the leader.
if (RESOLVED_SPREAD > 0.08 * RESOLVED_ROWS[0].length) {
  throw new Error(
    `LeaderboardV2: the resolved spread is ${RESOLVED_SPREAD} px, over 8% of the leader (${RESOLVED_ROWS[0].length})`,
  );
}

// 10. The label column is inside the house band (x >= 60) at every frame, step-
//     out and sway included, and the resolved INK is inside the padding box.
for (let f = LABS[0].launch; f <= DURATION; f++) {
  const c = camAt(f);
  const d = sway(f);
  let worst = Infinity;
  LABS.forEach((lab, i) => {
    if (!liveAt(lab, f)) return;
    const wx = TILE_CX + stepOutAt(i, f) - MARK_SIZE / 2 - SWAY_AMP;
    worst = Math.min(worst, 540 + (wx - (c.cx + d.dx)) * c.k);
  });
  if (worst < 60) {
    throw new Error(
      `LeaderboardV2: a tile's left edge is at screen x ${worst.toFixed(1)} on f${f}, outside the band`,
    );
  }
}
for (let f = CAM_F1; f <= DURATION; f++) {
  const c = camAt(f);
  const d = sway(f);
  const sx = (w: number) => 540 + (w - (c.cx + d.dx)) * c.k;
  const sy = (w: number) => 960 + (w - (c.cy + d.dy)) * c.k;
  const box = [sx(INK_X0) - PAD_X0, PAD_X1 - sx(INK_X1), sy(INK_Y0) - PAD_Y0, PAD_Y1 - sy(INK_Y1)];
  if (Math.min(...box) < 30) {
    throw new Error(
      `LeaderboardV2: the resolved ink has only ${Math.min(...box).toFixed(1)} px of air on f${f} (L/R/T/B ${box
        .map((v) => v.toFixed(0))
        .join("/")})`,
    );
  }
}

// 11. No bar ever runs past the rule it is measured on.
LABS.forEach((lab) => {
  const end = barEndAt(lab, DURATION);
  if (end > AX_RIGHT) {
    throw new Error(
      `LeaderboardV2: ${lab.key}'s bar ends at ${end.toFixed(1)}, past the bottom rule (${AX_RIGHT})`,
    );
  }
});
