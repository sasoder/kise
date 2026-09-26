import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_LIFT, camEase, clamp, clamp01, hash, smoothstep, sway } from "./fieldShared";
import {
  BLACK,
  BLUE,
  CAP,
  FONT,
  ORANGE,
  PURPLE,
  SHADOW,
  WHITE,
  World,
  runCamera2,
  widthOf,
} from "./cottageShared";

export const FPS = 24;
// Clip "anna - elon has amazing syntax" (podcast; she is talking about Elon
// Musk). Composition f0 = 35.30 s on the edit timeline; frame = round((t -
// 35.30) * 24). Speech ends on "media", 40.08 s -> f115; the tail holds under
// "(So maybe he should be more careful there)" from 40.26 s -> f119 and the
// editor trims. 144 frames = 6.0 s.
export const DURATION = 144;

// ---------------------------------------------------------------------------
// "NOT IN THE BUSINESS" — a strong statement graphic with the X logo.
// Core memory podcast graphic standard (reference `PeakForSolar.tsx`), in the
// world of this speaker's previous clip (`cottageShared.tsx`, imported
// read-only): 1080x1920, 24 fps, OPAQUE; dimmed + blurred squared paper at
// parallax 0.15 drifting -0.3 px/f; white #FFFFFF ink, every element on a hard
// black #000000 shadow +4/+4 world px, zero blur, drawn as an SVG copy;
// Barlow 900 UPPERCASE.
//
// THE LINE (she actually says "not, you know, in the business of…"):
//   "…not, you know, in the business of encouraging fascism to take over
//    social media. (So maybe he should be more careful there.)"
//
// THE TIMING — word-level whisper pass on the edit audio, frame =
// round((t - 35.30) * 24):
//   word          s              frame
//   not           35.36-35.94    1-15
//   you know      36.06-36.46    18-28
//   in            36.60          31
//   the           36.68          33
//   business      36.80          36
//   of            36.98          40
//   encouraging   37.22-37.64    46-56
//   fascism       37.64-38.36    56-73
//   to            38.36          73
//   take          38.58          79
//   over          38.78-39.04    84-90
//   social        39.04          90
//   media         39.72-40.08    106-115
//   (So maybe…)   40.26          119
//   DURATION = 144: speech ends f115, the resolved frame holds to f143.
//
// THE CONCEPT — "the statement, then the X takes the feed". Act 1 is a
// placard: her statement set as type, NOT ... FASCISM. Act 2: the camera pulls
// back and down onto a social-media feed under the statement — 4 x 3 white post
// cards with ONE black X tile among them — and on "take over" every card flips
// to an X tile in one wave from the seed outward. The resolved frame: her
// white statement standing over a solid block of black X tiles.
//
// THE CHAIN'S JOB in this clip: ANNA'S VERDICT. In this cut that is the word
// NOT and nothing else — never FASCISM, never the X.
//
// THE COLOURS, raw hex, no filter, no blend, no glow, no fade on a colour:
//   ink #FFFFFF · shadow / X tile / post content #000000 · paper base #C0C0C0
//   chain orange #FFB765 · purple #BC37FF · blue #0046FF — on NOT only.
//
// THE X LOGO: simple-icons `x` path (24-unit viewBox), exactly as
// `TwitterToX.tsx` uses it, white on a black tile, 92.6 world px wide (v2:
// 100 at v1's 190 card, scaled with the tile), centred
// on its bounding box (12, 12.0) — the mark is symmetric, so that is its
// optical centre too. Inline path, never an <image>.
//
// ---------------------------------------------------------------------------
// THE WORLD (world px; at k 1 one world px = one screen px; all centred on
// x 540; Barlow cap height 0.700 em, widths from `cottageShared.widthOf`):
//   NOT           900, 220 px, cap top 330, baseline 484 (410.5 wide)
//     its crown   blue 12 up, purple 24, orange 36 -> orange top 294
//   v2 (director's review): the connective lines 64 -> 76 px on a 92 pitch
//   with v1's gaps kept (46 under NOT's baseline, 45.2 over FASCISM's cap);
//   64 px of paper between FASCISM's baseline shadow and the grid; cards 190 ->
//   176 on a 24 gap so the composition is no taller than v1's.
//   IN THE BUSINESS OF   900, 76 px, cap top 530, baseline 583.2 (684.5 wide)
//   ENCOURAGING          900, 76 px, cap top 622, baseline 675.2 (495.7 wide)
//   FASCISM       900, 860 / 3.914 = 219.7 px (the largest that fits 860 px of
//                 advance width), cap top 720.4, baseline 874.2
//   FEED          4 cols x 3 rows of 176 x 176 cards, gap 24 -> 776 x 576,
//                 x 152..928, y 942.2..1518.2 (1522.2 with its shadow): its
//                 top 64 below FASCISM's baseline shadow (878.2). Seed = the
//                 card at col 1, row 1 (0-indexed), an X tile from f0.
//     POST CARD   white rect r 20.4 on the hard shadow; in BLACK, designed on
//                 a 190 card and scaled 176/190 with the tile: avatar disc r 20
//                 centred (46, 46), a 70 x 14 name bar at x 80, then three
//                 14-tall pill word-bars at y 90 / 120 / 150, x 26, hashed
//                 70..134 long. Same layout on every card.
//     X TILE      black rect r 20.4 on the same hard shadow, white X 92.6 wide.
//   Whole composition: world y 330..1518.2 by the brief's reckoning, centre
//   924.1 (C_REST), the value the rest camera puts on screen y 835.
//
// ---------------------------------------------------------------------------
// THE GESTURES — one per word, in order. Nothing else moves except the paper's
// drift, the camera and its sway.
//   1. f0-28   "not" (1-15): NOT enters as the core-memory stack — orange copy
//              f0, purple f2, blue f4, white core + its shadow f6 — each
//              rising 130 world px into ITS OWN place on Easing.bezier(0.16,
//              1, 0.3, 1) over 22 f. Nothing fades: a layer does not exist
//              until its frame. At rest the colours stay as a CROWN above the
//              white word (blue 12 up, purple 24, orange 36, same column),
//              with the black shadow at the very back on the core's timing.
//              From f6 the colours are MASKED to above the white core's top
//              silhouette (see DEVIATIONS), so the crown is three thin bands on
//              the tops of N, O, T (stepping down the N's diagonal) and the O's
//              bowl stays empty paper. The cut's only chain moment.
//   2. f15-31  "you know": HOLD. Only the camera creep and the paper drift.
//   3. f31-41  "in the business of": IN THE BUSINESS OF slides up 24 world px
//              while fading in (10 f, out-cubic).
//   4. f46-56  "encouraging": ENCOURAGING, the same entrance.
//   5. f56-66  "fascism": FASCISM, the same entrance — plain white, no colour,
//              no shake. Its weight is its size.
//   6. f58-84  "to take": the camera pulls back and tilts down to the rest
//              framing while the FEED SCROLLS UP into its slot under the
//              statement (see DEVIATIONS) — it exists from f0, parked below
//              the frame, never fades; it crosses the frame edge at f59, is
//              in its slot at f84 and the camera lands by ~f86.
//   7. f85-108 "over social media": THE TAKEOVER. The 11 white cards flip to X
//              tiles in ONE continuous wave ordered by distance from the seed.
//              v2, the director's formula:
//                start = 79 + 16 * (d / d_max)^0.85 + hashed jitter [-2, 2]
//              (d in card pitches, d_max = sqrt 5; ring bases 87.07 / 89.84 /
//              93.55 / 95.00). JITTER_SEED 41: every start in f85.4..95.8, the
//              largest gap between consecutive starts 2.33 f, the smallest
//              0.47 f, each ring done before the next begins, the neighbours
//              not in a rotating order. Each flip is scaleX 1 -> 0 -> 1 about
//              the card's centre over 12 f on one smoothstep, the face swapping
//              at the midpoint and the shadow flipping WITH it (the shadow is
//              the flipped card translated +4/+4); the frame nearest edge-on
//              shows a bar at scaleX 0.04 (EDGE_S), never nothing.
//              Starts (col,row), frame:
//                (0,1) 85.36  (1,0) 85.83  (1,2) 87.45  (2,1) 88.08   neighbours
//                (0,0) 88.60  (2,0) 89.45  (0,2) 91.04  (2,2) 91.75   diagonals
//                (3,1) 92.84  (3,2) 93.45  (3,0) 95.78               far column
//              The first flip starts on "over" (84-90), after the feed and the
//              camera have landed; the last lands f107.8 ("media", 106-115).
//   8. f108-143 HOLD on the resolved frame: statement over a block of X tiles;
//              the camera creeps back (k 0.906 -> 0.891).
//
// ---------------------------------------------------------------------------
// THE CAMERA — `cottageShared.runCamera2` (the house CAM_STIFF / CAM_DAMP
// tracker with an x channel) on a per-frame track of SUMMED eased deltas (as
// `WhereDoesThatGoV2`): each move adds its own camEase'd delta to k and to the
// content centre c; cy = c + CAM_LIFT / k so c sits on screen y 835. cx is 540
// throughout (no pan); `sway` rides on top, as in PeakForSolar.
//   OPEN     f0       k 1.25, c 392.3 = NOT's block (crown top 294 .. shadow
//                     490.6) centred on 835
//   CREEP 0  f0-30    k -0.01, c +4 — the held breath, in glide 1's direction
//                     so the join is C1 with no reversal
//   GLIDE 1  f22-50   k -> 1.10, c -> 587.4 = the statement (294 .. 880.8)
//                     centred on 835; warp 1.0; lands before "fascism" (56)
//   GLIDE 2  f58-80   k -> 0.91, c -> 924.1 (C_REST); warp 0.85; the pull
//                     back and tilt down onto the feed, landing on "over"
//   CREEP    f82-160  k -0.023 (k 0.891 at f143, still moving on the last frame)
//   THE DAMPED NUMBERS (no sway), from `scratchpad/nib/measure.ts`:
//     f     k        cx       cy        c (on 835)
//     0     1.2500   540.00    492.32    392.32   open
//     31    1.2260   540.00    517.87    415.92   "in" — glide 1 under way
//     56    1.1014   540.00    699.05    585.55   "fascism" — glide 1 landed
//     84    0.9152   540.00   1051.57    914.99   "over" — glide 2 landing
//     112   0.9041   540.00   1062.37    924.10   "media"
//     143   0.8912   540.00   1064.36    924.10   last frame, creeping
//   WHERE THAT PUTS THINGS (every frame, sway included): the statement's
//   lowest ink is screen y 1186 (f56); the feed's bottom shadow edge is 1395.1
//   at f84 and 1391.4 at f85 (the camera's landing), <= 1390 from f86 (1388.7),
//   1384 at f90, 1377 at f112, 1364 at f143; the crown's top is never above
//   266; the widest frame (FASCISM at f56, k 1.10) spans screen x 64..1016.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, and why.
//   * THE FEED SCROLLS INTO ITS SLOT; THE CAMERA ALONE CANNOT HIDE IT. With the
//     feed parked in its rest slot (top y 900, 42 px under FASCISM's shadow)
//     it is IN FRAME through all of Act 1: at the OPEN (k 1.25, NOT on 835) its
//     top edge is on screen y 1470, and at glide 1's landing (k 1.10, the
//     statement on 835) on 1201 — right under FASCISM, deep in the caption
//     band. Hiding it by camera alone would need the frame's bottom edge
//     above world y 900, which puts the whole statement below screen y 1250.
//     So the feed exists from f0 as the brief says — never fades — but parked
//     FEED_DROP (1020) world px below its slot, off the bottom of the frame,
//     and on "to take" it scrolls up into the slot on ONE eased curve (camEase
//     warp 0.6, f50-84; the first 9 frames still off-frame) while the camera
//     does glide 2 as briefed. A feed scrolling up is what a feed does. v2:
//     the warp front-loads the speed while the feed is still below the frame,
//     so it enters near cruise and spends its visible frames decelerating —
//     peak 57.8 screen px/f (f66), v1 64.0 — with the same first-visible frame
//     (f59). Parking it closer would show cards earlier, under FASCISM while
//     it lands; settling later would run into the first flip (f85.36). Its
//     bottom row is in the caption band IN TRANSIT f59-83; from f84 on nothing
//     is below screen y 1400.
//   * THE CROWN IS MASKED to above the white core's top silhouette (from f6,
//     the frame the core appears): unmasked, the up-shifted colour copies also
//     showed inside NOT's counters — a stacked orange / purple / blue lozenge
//     in the O's bowl that read as a separate object, not a crown.
//   * A FLIPPING CARD NEVER GOES BELOW scaleX 0.04: in v1 a card that started
//     on a whole frame sampled scale 0 at its midpoint and vanished, shadow and
//     all, for one frame (a blink). At the floor it is a thin bar on its shadow.
//   * THE WAVE'S FIRST FLIP IS f85.4, NOT f79: the director's formula puts the
//     nearest ring (d = 1) at 79 + 16 * (1 / sqrt 5)^0.85 = 87.07, and 79 is the
//     seed's own time (d = 0). Taken literally, as briefed; it starts on
//     "over", once the feed and the camera have landed.
//   * GLIDE 1's KEYS ARE f22-50, NOT f26-58, and glide 2's f58-80, not f62-84:
//     the damper lags its target by ~5 f, so these are the keys whose DAMPED
//     camera lands 5-6 f ahead of "fascism" (k 1.101 at f56) and settles on
//     "over" (k 0.915 at f84, 0.910 by f88).
//   * FASCISM IS 219.7 px, not 180-200: the brief's rule "as large as fits
//     860 px" gives 860 / 3.914 em = 219.7, so it matches NOT's 220.
// ---------------------------------------------------------------------------

const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_TEXT = Easing.out(Easing.cubic);

// -- type ---------------------------------------------------------------------
export const W900 = 900;
export const X_MID = 540;
export const NOT_TEXT = "NOT";
export const NOT_SIZE = 220;
export const NOT_CAP_TOP = 330;
export const NOT_BASE = NOT_CAP_TOP + CAP * NOT_SIZE; // 484
export const CROWN = { blue: 12, purple: 24, orange: 36 } as const;
// v2: the connective lines 64 -> 76 px on a 92 pitch, keeping v1's gaps to
// NOT (46: NOT baseline -> line-1 cap top) and to FASCISM (45.2: line-2
// baseline -> FASCISM cap top), so FASCISM moves down by the added height.
export const MID_SIZE = 76;
export const MID_PITCH = 92;
export const MID_GAP_TOP = 46;
export const MID_GAP_BOTTOM = 45.2;
export const MID_CAP_TOP = NOT_BASE + MID_GAP_TOP; // 530
export const MID_LINES = ["IN THE BUSINESS OF", "ENCOURAGING"] as const;
export const FAS_TEXT = "FASCISM";
export const FAS_MAX_W = 860;
export const FAS_SIZE = FAS_MAX_W / widthOf(FAS_TEXT, W900, 1); // 219.72
export const FAS_CAP_TOP = MID_CAP_TOP + MID_PITCH + CAP * MID_SIZE + MID_GAP_BOTTOM; // 720.4
export const FAS_BASE = FAS_CAP_TOP + CAP * FAS_SIZE; // 874.2
// round letters (O, S, C) overshoot the baseline by ~0.012 em
const OVERSHOOT = 0.012;

// -- the feed -------------------------------------------------------------------
// v2: 64 world px of paper between FASCISM's baseline shadow and the grid top
// (v1 was 42), and the cards come down 190 -> 176, gap 26 -> 24, so the whole
// composition is no taller than v1's and the rest camera is unchanged.
export const COLS = 4;
export const ROWS = 3;
export const CARD = 176;
export const GAP = 24;
export const PITCH = CARD + GAP; // 200
/** The card's interior (avatar, bars, X) is designed on a 190 card and scaled
 *  with the tile, as is the corner radius (22 at 190). */
const CARD_DESIGN = 190;
const CARD_K = CARD / CARD_DESIGN; // 0.926
export const CARD_R = 22 * CARD_K; // 20.4
export const FEED_W = COLS * CARD + (COLS - 1) * GAP; // 776
export const FEED_H = ROWS * CARD + (ROWS - 1) * GAP; // 576
export const FEED_X0 = X_MID - FEED_W / 2; // 152
export const FEED_GAP = 64;
export const FEED_TOP = FAS_BASE + SHADOW + FEED_GAP; // 942.2
export const FEED_BOTTOM = FEED_TOP + FEED_H; // 1518.2
export const SEED = { c: 1, r: 1 };
// card interior, card-local px ON THE 190 DESIGN CARD (scaled by CARD_K)
const PAD = 26;
const AVATAR_R = 20;
const NAME_X = PAD + 2 * AVATAR_R + 14; // 80
const NAME_W = 70;
const BAR_H = 14;
const BAR_YS = [90, 120, 150];
const BAR_MIN = 70;
const BAR_MAX = 134;
// the X
export const X_PATH =
  "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z";
export const X_W = 100 * CARD_K; // 92.6, scaled with the tile
const X_S = X_W / 24;
const X_CX = 12;
const X_CY = 11.9995;

// -- the gestures -----------------------------------------------------------------
export const RISE = 130; // world px, the core-memory stack
export const RISE_F = 22;
export const CHAIN_STAGGER = 2;
export const NOT_F = 0; // orange; purple +2, blue +4, core +6
export const TEXT_F = 10;
export const TEXT_RISE = 24; // world px
export const MID_F = [31, 46] as const; // "in", "encouraging"
export const FAS_F = 56; // "fascism"
// the feed's scroll into its slot (see DEVIATIONS)
// v2: warp 0.6 puts the scroll's speed early, while the feed is still below
// the frame, so it enters near its cruise and spends the visible frames
// decelerating: peak 57.8 screen px/f (v1 64.0) with the same first-visible
// frame (f59), settling at f84, before the first flip (f85.36).
export const FEED_DROP = 1020;
export const SCROLL_F0 = 50;
export const SCROLL_F1 = 84;
export const SCROLL_WARP = 0.6;
export const feedOffset = (f: number) =>
  FEED_DROP * (1 - camEase((f - SCROLL_F0) / (SCROLL_F1 - SCROLL_F0), SCROLL_WARP));
// the takeover — v2, the director's formula:
//   start = 79 + 16 * (d / d_max)^0.85 + hashed jitter in [-2, 2]
// d = the card's distance from the seed in card pitches, d_max = sqrt(5).
export const FLIP_F = 12;
export const WAVE_F0 = 79; // "take" — the seed's own time (d = 0)
export const WAVE_SPAN = 16;
export const WAVE_POW = 0.85;
export const JITTER = 2;
// The hash seed for the jitter, picked (scratchpad seeds2.ts) so every start
// is in f79..96, no gap between consecutive starts exceeds 3 f (max 2.33), no
// two starts are within 0.47 f, each distance ring finishes before the next
// begins, and the neighbours do not go round in a rotating (cw / ccw) order.
export const JITTER_SEED = 41;

type Cell = { c: number; r: number; i: number; d: number; seed: boolean };
export const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      out.push({ c, r, i, d: Math.hypot(c - SEED.c, r - SEED.r), seed: c === SEED.c && r === SEED.r });
    }
  }
  return out;
})();
// Distance from the seed sets the wave; the hashed jitter breaks each ring.
// Asserted at load: every start in [79, 96] and no consecutive gap over 3 f.
export const FLIP_START: number[] = (() => {
  const dMax = Math.max(...CELLS.map((c) => c.d));
  const out = CELLS.map((c) =>
    c.seed
      ? NaN
      : WAVE_F0 +
        WAVE_SPAN * Math.pow(c.d / dMax, WAVE_POW) +
        (hash(c.i, JITTER_SEED) * 2 - 1) * JITTER,
  );
  const ts = out.filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  const maxGap = Math.max(...ts.slice(1).map((v, k) => v - ts[k]));
  if (ts[0] < WAVE_F0 || ts[ts.length - 1] > 96 || maxGap > 3) {
    throw new Error(`NotInTheBusiness: the wave breaks its brief (${ts.map((v) => v.toFixed(2)).join(" ")})`);
  }
  return out;
})();

// -- the camera -----------------------------------------------------------------
export const K_OPEN = 1.25;
export const C_OPEN = (NOT_CAP_TOP - CROWN.orange + NOT_BASE + OVERSHOOT * NOT_SIZE + SHADOW) / 2; // 392.3
export const K_STATE = 1.1;
export const C_STATE = (NOT_CAP_TOP - CROWN.orange + FAS_BASE + OVERSHOOT * FAS_SIZE + SHADOW) / 2; // 587.4
export const K_REST = 0.91;
export const C_REST = (NOT_CAP_TOP + FEED_BOTTOM) / 2; // 924.1
export const CX = X_MID;
type Move = { f0: number; f1: number; warp: number; k: number; c: number };
const CREEP0: Move = { f0: 0, f1: 30, warp: 1, k: -0.01, c: 4 };
const G1: Move = {
  f0: 22,
  f1: 50,
  warp: 1,
  k: K_STATE - (K_OPEN + CREEP0.k),
  c: C_STATE - (C_OPEN + CREEP0.c),
};
const G2: Move = { f0: 58, f1: 80, warp: 0.85, k: K_REST - K_STATE, c: C_REST - C_STATE };
const CREEP: Move = { f0: 82, f1: 160, warp: 1, k: -0.023, c: 0 };
export const MOVES = [CREEP0, G1, G2, CREEP];
const TRACK = (() => {
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  const CXs: number[] = [];
  for (let f = 0; f <= DURATION + 24; f++) {
    let k = K_OPEN;
    let c = C_OPEN;
    for (const m of MOVES) {
      const e = camEase((f - m.f0) / (m.f1 - m.f0), m.warp);
      k += m.k * e;
      c += m.c * e;
    }
    F.push(f);
    K.push(k);
    CY.push(c + CAM_LIFT / k);
    CXs.push(CX);
  }
  return { F, K, CY, CX: CXs };
})();
export const NIB_CAM_F = TRACK.F;
export const NIB_CAM_K = TRACK.K;
export const NIB_CAM_CY = TRACK.CY;
export const NIB_CAM_CX = TRACK.CX;
/** The damped camera at frame f (no sway). */
export const nibCamera = (f: number) => runCamera2(f, NIB_CAM_F, NIB_CAM_CY, NIB_CAM_CX, NIB_CAM_K);
const REST = { cx: NIB_CAM_CX[0], cy: NIB_CAM_CY[0] };

// -- props -------------------------------------------------------------------------
export const schema = z.object({
  // the hand on the camera, as in PeakForSolar
  sway: z.boolean(),
  not: z.string(),
  lines: z.array(z.string()).length(2),
  fascism: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  sway: true,
  not: NOT_TEXT,
  lines: [...MID_LINES],
  fascism: FAS_TEXT,
});

// ---------------------------------------------------------------------------
// DRAWING
// ---------------------------------------------------------------------------
const typeStyle = (size: number) =>
  ({ fontFamily: FONT, fontWeight: W900, fontSize: size, fontKerning: "normal" }) as const;

const Word: React.FC<{ text: string; y: number; size: number; fill: string; dx?: number; dy?: number }> = ({
  text,
  y,
  size,
  fill,
  dx = 0,
  dy = 0,
}) => (
  <text x={X_MID + dx} y={y + dy} textAnchor="middle" fill={fill} style={typeStyle(size)}>
    {text}
  </text>
);

/** White type on its hard black copy. */
const Shadowed: React.FC<{ text: string; y: number; size: number }> = ({ text, y, size }) => (
  <g>
    <Word text={text} y={y} size={size} fill={BLACK} dx={SHADOW} dy={SHADOW} />
    <Word text={text} y={y} size={size} fill={WHITE} />
  </g>
);

/** Card-local post content: avatar, name bar, three word-bars — all black. */
const PostContent: React.FC<{ i: number }> = ({ i }) => (
  <g fill={BLACK}>
    <circle cx={PAD + AVATAR_R} cy={PAD + AVATAR_R} r={AVATAR_R} />
    <rect x={NAME_X} y={PAD + AVATAR_R - BAR_H / 2} width={NAME_W} height={BAR_H} rx={BAR_H / 2} />
    {BAR_YS.map((y, j) => {
      const w = BAR_MIN + hash(i, 31 + j) * (BAR_MAX - BAR_MIN);
      return <rect key={j} x={PAD} y={y} width={w} height={BAR_H} rx={BAR_H / 2} />;
    })}
  </g>
);

/** Card-local X tile face: black tile, white X. */
const XFace: React.FC = () => (
  <g>
    <rect x={0} y={0} width={CARD} height={CARD} rx={CARD_R} fill={BLACK} />
    <g transform={`translate(${CARD / 2 - X_CX * X_S} ${CARD / 2 - X_CY * X_S}) scale(${X_S})`}>
      <path d={X_PATH} fill={WHITE} />
    </g>
  </g>
);

/** One card at its world position with horizontal scale s about its centre.
 *  The shadow is the SAME scaled card translated +4/+4, so it flips with it. */
const Card: React.FC<{ x: number; y: number; s: number; x_face: boolean; i: number }> = ({
  x,
  y,
  s,
  x_face,
  i,
}) => {
  const flip = (ox: number, oy: number) =>
    `translate(${(x + ox + CARD / 2).toFixed(3)} ${(y + oy).toFixed(3)}) scale(${s.toFixed(5)} 1) translate(${-CARD / 2} 0)`;
  return (
    <g>
      <g transform={flip(SHADOW, SHADOW)}>
        <rect x={0} y={0} width={CARD} height={CARD} rx={CARD_R} fill={BLACK} />
      </g>
      <g transform={flip(0, 0)}>
        {x_face ? (
          <XFace />
        ) : (
          <g>
            <rect x={0} y={0} width={CARD} height={CARD} rx={CARD_R} fill={WHITE} />
            <g transform={`scale(${CARD_K})`}>
              <PostContent i={i} />
            </g>
          </g>
        )}
      </g>
    </g>
  );
};

/** A card's flip state at frame f: horizontal scale and which face shows.
 *  The scale never goes below EDGE_S: the frame nearest the midpoint shows
 *  the card edge-on as a thin bar on its shadow, never nothing (a card that
 *  vanished for a frame read as a blink). */
export const EDGE_S = 0.04; // 7.6 world px
export const flipState = (i: number, f: number) => {
  const cell = CELLS[i];
  if (cell.seed) return { s: 1, x: true };
  const u = clamp01((f - FLIP_START[i]) / FLIP_F);
  const e = smoothstep(u);
  return { s: Math.max(EDGE_S, Math.abs(1 - 2 * e)), x: e >= 0.5 };
};

// THE CROWN MASK. The chain copies are copies of the word shifted UP, so left
// alone they also show inside the word's own counters (a stacked rainbow
// lozenge in the O's bowl, disconnected from the crown). The mask hides every
// colour below the white core's TOP silhouette: the core extruded straight
// down (copies every MASK_STEP px down to its cap height + MASK_STEP), starting
// MASK_INSET px below the core so each colour tucks under the white edge and
// no paper seam opens between them. It rides the core's own rise.
const CROWN_MASK = "nib-crown-mask";
const MASK_STEP = 3;
const MASK_INSET = 2;
const MASK_DEPTH = CAP * NOT_SIZE + 12;

const NotInTheBusiness: React.FC<Props> = ({ sway: withSway, not, lines, fascism }) => {
  const frame = useCurrentFrame();
  const cam = nibCamera(frame);
  const d = withSway ? sway(frame) : { dx: 0, dy: 0 };

  // THE CORE-MEMORY RISE: one slide, sampled at a different start per layer.
  const riseAt = (f0: number) => {
    const t = interpolate(frame, [f0, f0 + RISE_F], [0, 1], { easing: EASE_LAND, ...clamp });
    return (1 - t) * RISE;
  };
  // THE TEXT ENTRANCE: slide up TEXT_RISE world px while fading in.
  const textIn = (f0: number) => {
    const u = EASE_TEXT(clamp01((frame - f0) / TEXT_F));
    return { o: u, dy: (1 - u) * TEXT_RISE };
  };

  const coreF = NOT_F + 3 * CHAIN_STAGGER;
  const chain = [
    { key: "orange", fill: ORANGE, f0: NOT_F, up: CROWN.orange },
    { key: "purple", fill: PURPLE, f0: NOT_F + CHAIN_STAGGER, up: CROWN.purple },
    { key: "blue", fill: BLUE, f0: NOT_F + 2 * CHAIN_STAGGER, up: CROWN.blue },
  ];
  const coreDy = riseAt(coreF);

  const feedDy = feedOffset(frame);
  const mids = [0, 1].map((j) => ({
    text: lines[j],
    base: MID_CAP_TOP + j * MID_PITCH + CAP * MID_SIZE,
    f0: MID_F[j],
  }));

  return (
    <World frame={frame} cam={{ cx: cam.cx + d.dx, cy: cam.cy + d.dy, k: cam.k }} rest={REST}>
      {/* ---- NOT: the core-memory stack, settling as a crown ---- */}
      {frame >= coreF ? (
        <defs>
          <mask id={CROWN_MASK} maskUnits="userSpaceOnUse" x={-2000} y={-4000} width={6000} height={10000}>
            <rect x={-2000} y={-4000} width={6000} height={10000} fill={WHITE} />
            {Array.from({ length: Math.ceil((MASK_DEPTH - MASK_INSET) / MASK_STEP) + 1 }, (_, n) => (
              <Word
                key={n}
                text={not}
                y={NOT_BASE}
                size={NOT_SIZE}
                fill={BLACK}
                dy={coreDy + MASK_INSET + n * MASK_STEP}
              />
            ))}
          </mask>
        </defs>
      ) : null}
      {frame >= coreF ? (
        <Word text={not} y={NOT_BASE} size={NOT_SIZE} fill={BLACK} dx={SHADOW} dy={SHADOW + coreDy} />
      ) : null}
      <g mask={frame >= coreF ? `url(#${CROWN_MASK})` : undefined}>
        {chain.map((c) =>
          frame >= c.f0 ? (
            <Word key={c.key} text={not} y={NOT_BASE - c.up} size={NOT_SIZE} fill={c.fill} dy={riseAt(c.f0)} />
          ) : null,
        )}
      </g>
      {frame >= coreF ? <Word text={not} y={NOT_BASE} size={NOT_SIZE} fill={WHITE} dy={coreDy} /> : null}

      {/* ---- IN THE BUSINESS OF / ENCOURAGING ---- */}
      {mids.map((m) => {
        if (frame < m.f0) return null;
        const t = textIn(m.f0);
        return (
          <g key={m.text} opacity={t.o} transform={`translate(0 ${t.dy.toFixed(3)})`}>
            <Shadowed text={m.text} y={m.base} size={MID_SIZE} />
          </g>
        );
      })}

      {/* ---- FASCISM: plain white, its weight is its size ---- */}
      {frame >= FAS_F
        ? (() => {
            const t = textIn(FAS_F);
            return (
              <g opacity={t.o} transform={`translate(0 ${t.dy.toFixed(3)})`}>
                <Shadowed text={fascism} y={FAS_BASE} size={FAS_SIZE} />
              </g>
            );
          })()
        : null}

      {/* ---- THE FEED: parked below the frame, scrolls into its slot ---- */}
      <g transform={`translate(0 ${feedDy.toFixed(3)})`}>
        {CELLS.map((cell) => {
          const st = flipState(cell.i, frame);
          return (
            <Card
              key={cell.i}
              i={cell.i}
              x={FEED_X0 + cell.c * PITCH}
              y={FEED_TOP + cell.r * PITCH}
              s={st.s}
              x_face={st.x}
            />
          );
        })}
      </g>
    </World>
  );
};

export default NotInTheBusiness;
