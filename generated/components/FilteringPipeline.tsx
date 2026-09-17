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
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { arriveEase } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip `JohnCharlesBeren_Experience`, cut `FilteringPipeline`:
// context "you can take your deployment data and put this in the pre-training of
// future models," — the line itself:
//   "especially if you do, like, some kind of filtering or some kind of, like,
//    judgment or annotation or, like, recent, you know, synthesization of that."
//
// DURATION. The composition starts at SRT 33.100 s, so every beat is
//   frame = round((t - 33.100) * 24)
//     especially f0 · if f6 · you f10 · do f11 · like f13 · some f17 ·
//     kind f21 · of f23 · filtering f26 · or f33 · some f37 · kind f40 ·
//     of f44 · like f46 · judgment f49 · or f57 · annotation f61 · or f68 ·
//     like f73 · recent f76 · you f88 · know f91 · synthesization f95 ·
//     of f108 · that f115 · next word "how" f121
// Speech therefore runs f0..121 and the set's 16-frame tail holds the resolved
// state: DURATION = 121 + 16 = 137.
export const DURATION = 137;

// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "a stream of data falls through four gates — some is thrown out, the rest is
//    judged, labelled and fused — and what comes out the bottom builds a model."
//
// VOCABULARY, the same as cut 1 (`MillionsOfYears`) of this clip:
//   deployment data = small SOLID orange dots, ACCENT_DEEP at rest, ACCENT once
//                     judged good. Nothing else in the piece is orange.
//   the model       = ONE large solid orange dot on the axis at 2 x DOT_R, the
//                     same core as cut 1. It is not drawn until the first fused
//                     dot lands in it.
//   a gate          = a station RING (the set's R, white) with one Lucide
//                     OUTLINE icon in it at the set's one stroke:
//                       filter  -> `filter`  (the funnel)
//                       judgment-> `gavel`
//                       annotation -> `tag`
//                       synthesis  -> `merge`
//                     Only a ring's STROKE ever converts white -> deep -> ripe;
//                     the icon inside it stays white.
//   the column      = thin white vertical line segments between the ring centres,
//                     at the same stroke as the rings: the axis the fall runs on.
//   an annotation   = one small WHITE solid dot at 0.45 x DOT_R riding attached
//                     at a data dot's upper-right.
// No text, no arrows, no boxes, no person glyph.
//
// Z-ORDER, one rule for the whole piece and the only order anything is drawn in:
//   axis line -> data dots (and the fused dots and their annotations)
//              -> ring strokes -> the Lucide icons -> the core, on top of all.
// The data falls BEHIND the gates. A dot passing a gate goes under the icon, so
// the glyph is never broken by the stream, and the core is drawn over the dots
// it swallows. Nothing else in the tree may be reordered against this.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous fall; the words are inflections in it. Nothing
// starts from rest, and nothing in the piece is outside this list.
//
//  1. f0    "especially if     THE STREAM. Data has been falling down the axis
//           you do"            since before frame 0: a feathered stream ~70 world
//                              px wide, 2.2 dots/frame, each on its own hashed
//                              lateral wobble, 13.48 world px/frame. The camera opens
//                              close on the stream at k 3.13 with the filter
//                              ring's top edge just entering the bottom of the
//                              frame, and is ALREADY tracking down with the front
//                              (30 frames of pre-roll are run through the damper
//                              before f0, so f0 has velocity, not a standing
//                              start).
//  2. f18-40 "filtering" (f26) THE FILTER. The stream front reaches the filter
//                              ring at f18.0. Each arriving dot is decided by hash:
//                              55% pass straight down the axis, 45% are deflected
//                              — they meet the rim, slide sideways off the ring
//                              on a short arc and dissolve (radius to 0 over 8 f,
//                              deep tone, no flash). The ring converts white ->
//                              ACCENT_DEEP on its 5th passing dot (f22.8) and ->
//                              ACCENT 3 f later, so "filtering" (f26) lands on it
//                              turning ripe. Below the ring the surviving stream
//                              is thinner and narrower: the wobble envelope goes
//                              70 -> 43 world px over the 43 px under the ring.
//  3. f38-60 "judgment" (f49)  THE JUDGMENT. Every dot pauses inside the second
//                              ring — a held breath of ~4.4 frames, authored as a
//                              stall in the PATH-DISTANCE domain so the dot eases
//                              in and eases out with no step in speed and never
//                              reverses (min dy/ds = 0.175). It comes out either
//                              ACCENT (judged good, 80%) or stays ACCENT_DEEP,
//                              drifts 60 world px sideways as it keeps falling and
//                              dissolves over 12 f. Ring converts on its 4th
//                              dot through (f47.4).
//  4. f56-80 "annotation"(f61) THE LABEL. Every ripe dot passing the third ring
//                              picks up an annotation: the small white dot appears
//                              on the ring's upper-right rim and snaps to the data
//                              dot's upper-right over 4 f, then rides with it and
//                              inherits its wobble. Ring converts on its 1st
//                              dot through, f59.5, just under the word (see DEVIATIONS
//                              for why N differs per gate).
//  5. f76-115 "synthesization" THE FUSE. Below the fourth ring the labelled dots
//           (f95)              are taken in consecutive groups of 3 or 4 (hashed)
//                              and converge over the 8 frames before the last of
//                              the group reaches the ring, merging into ONE ripe
//                              dot at 1.5 x DOT_R carrying a single annotation. No
//                              flash, no ring pulse — an 8-frame pull-together and
//                              a 4-frame radius ramp. Ring converts on its 4th
//                              fused dot, f91.0, ripe by f98.0.
//  6. f99-137 "of that" + tail THE MODEL FORMS. Each fused dot decelerates into
//                              y 1440 on arriveEase and is absorbed. The core
//                              appears with the FIRST landing at 1.2 x DOT_R and
//                              grows BY AREA with every landing it swallows,
//                              reaching the set's core size (2 x DOT_R) by the
//                              third landing, f109.8, and holding there on the set's
//                              breath(). Absorbed annotations go in with their
//                              dots. The stream never stops: through the whole
//                              tail data still falls, is filtered, judged,
//                              labelled, fused and absorbed.
//
// LIVENESS — mechanisms, not gestures, none on a word and none ever stopping:
// the emission (2.2/frame from f-56.8 to the last frame), every dot's hashed
// lateral wobble, breath() on every dot and on the core, the grid's parallax and
// its own -0.3 px/frame drift, and a camera that never parks (three glides plus
// a decaying drift that is still running at DURATION).
//
// ---------------------------------------------------------------------------
// CAMERA — ONE C1 curve, not a chain of moves. Seven knots on a monotone cubic
// Hermite (Fritsch-Carlson tangents), one key per frame, through the shared
// damper; cy is taken off the eased k so the framing and the zoom settle
// together. c is the world y put on screen y 835 (CAM_LIFT 125). The three
// glides the cut is built on are the knots at f 34, f 72 and f 118 — but the
// camera carries velocity THROUGH them, because chaining three smoothstep
// `camMove`s made each junction a dead stop and the re-acceleration out of
// those stops measured 3.06 screen px/f2, over the set's 2.2 ceiling.
//
//   knot   f -30   k 3.472  c  -70   PRE-ROLL, run through the damper before
//                                    frame 0 so f0 has downward velocity
//   knot   f   0   k 3.055  c  118   open close on the stream; the filter ring's
//                                    top edge is entering at the bottom (its
//                                    damped values are k 3.127, c 93)
//   knot   f  34   k 2.222  c  298   track down with the front
//   knot   f  72   k 1.736  c  568   keep tracking; ring 3 is in frame from f48
//   knot   f 118   k solved c  929.9 the resolve: the whole column in the band
//   knot   f 136   k -0.0125 c  +5.0 still drifting on the last frame
//   knot   f 200   k -0.0417 c +14.4 the drift's continuation, off the end
//
// Every knot is the pre-compression camera's knot carried through the same
// screen: the world shrank by 0.720 about the column centre and k grew by
// 1.389, so the FRAMING of each knot is what it was and only the numbers moved.
//
// MEASURED (audit over f1..136, on the four ring centres, the model, and on the
// world point sitting at screen (540, 1300)):
//   max head speed          31.14 screen px/f   (ceiling 45)
//   max |dv|                 1.17 screen px/f2  (ceiling 2.2)
//   min camera motion        0.38 screen px/f   (floor 0.15, at f136)
//   k at f0 / f136           3.127 / 0.94845
//   column at f136           screen y 331.9 .. 1321.9 (band 300..1370)
//
// STROKE ARITHMETIC, all at K_REST = 0.94845:
//   ring / icon / axis stroke   6.00 screen px  =  6.326 world px
//   station ring               65.30 screen px radius = 68.85 world
//   data dot                   11.20 screen px diameter = 5.90 world radius
//   core                       22.40 screen px diameter (2 x the dot)
//   annotation                  5.04 screen px diameter (0.45 x the dot)
// Every one of those screen numbers is cut 1's, so a dot, a core, a ring and a
// stroke are the same size on screen in both cuts of this clip.
//
// MEASURED BEATS (the audit's own numbers, off the dots that actually pass):
//   stream front at the filter  f18.0
//   filter ring   5th passing dot  f22.8  deep f22.8-26.8  ripe f25.8-29.8
//                                         -> "filtering"      f26  ON IT
//   judgment ring 4th through      f47.4  ripe done f54.4
//                                         -> "judgment"       f49  ON IT
//   annotation ring 1st through    f59.5  ripe done f66.5
//                                         -> "annotation"     f61  ON IT
//   synthesis ring 4th fused       f91.0  ripe done f98.0
//                                         -> "synthesization" f95  ON IT
//   first merge f81.3 · first landing f99.1 · core at 2 x DOT_R by f110
//   rings in frame: f0 / f24 / f48 / f72 — every one >= 6 f before its word
//   the model's empty position enters the frame at f91, eight frames before the
//   first fused dot lands in it
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * K_REST IS 0.94845, SOLVED, NOT PICKED. The column is 960 world px of
//     centres (rings at -360/-120/+120/+360 about the column centre, the model
//     at +600) plus the top ring's half-stroke and the core's radius, and those
//     two are SCREEN constants divided by k, so in screen px the column is
//     960k + 65.3 + 3.0 + 11.2. The caption-safe band is screen 300..1370 and
//     the brief asks 40 px clear at both ends, so the column may be 990 px:
//     k = (990 - 79.5) / 960 = 0.94845. The tail's decaying drift and the sway
//     then cost about 8 px at the top, so the measured clearance on the last
//     frame is 32 px above and 48 below — inside the band throughout.
//   * THE RINGS ARE R 68.85 WORLD, NOT R 64. A ring is a shared noun with cut 1,
//     where it is R 64 at k 1.02 = 65.3 SCREEN px, and the memory rule is that a
//     shared noun keeps one size across cuts. The world radius is therefore
//     solved from the screen one: 65.3 / 0.94845 = 68.85, and so are the dot,
//     the core and the stroke. That is 7.6% off the set's 64 — where the
//     pre-compression build, at k 0.683, was 49% off (R 95.6) — and it is the
//     half of the brief that is actually visible: at a literal R 64 the ring
//     would draw at 60.7 screen px, 7% smaller than the same ring one cut
//     earlier in the same edit.
//   * THE STREAM ENTERS FROM ABOVE THE BAND. Every structural thing — the four
//     rings, the axis, the model — is inside screen 300..1370 at the resolved
//     camera. The falling stream above the filter ring necessarily occupies the
//     frame above it, because "it has been falling forever" IS the gesture.
//   * THE RINGS CONVERT ON THEIR 5th / 4th / 2nd / 4th, NOT 6/6/6/2. The rule is
//     unchanged — a ring converts on the Nth thing that passes through it, and
//     the ramp is measured off those crossings so retiming the fall retimes the
//     rings — but N is what puts the conversion under the word, and the four
//     gates do not see the same traffic: the filter sees 2.2 dots/frame, the
//     judgment 1.21 (55% pass the filter), the annotation 0.97 (80% of those are
//     judged good) and the synthesis 0.28 fused dots/frame. At N = 6 the
//     annotation ring's conversion would finish eight frames after its word.
//   * THE EMISSION IS 2.2 DOTS/FRAME, NOT 1.6. At 1.6 only 0.70/frame survive
//     both gates, and the rendered column between the annotation ring and the
//     synthesis ring read as specks on a line rather than a stream. 2.2 puts a
//     dot every ~6 world px above the filter and keeps the bottom of the column
//     alive to the last frame.
//   * THE FALL IS 13.48 WORLD PX/FRAME. The compression took 25% out of every
//     gap, so the speed came down with it to hold the landing schedule: 240 /
//     13.48 = 17.8 frames gate to gate, exactly what 320 / 18 was before, and
//     the front is started 229 world px above the filter so it still arrives at
//     f18. The head cap is 44 screen px/f, which at the opening k 3.13 is 14.1
//     world px/f and so never binds: the stream now reads at ONE speed for the
//     whole cut instead of being clipped through the opening.
//   * THE ANNOTATION RING CONVERTS ON ITS 1st, NOT 2nd. Same rule, same
//     measurement: at N = 2 the ramp started 1.4 f after "annotation" (f62.4),
//     at N = 1 it starts 1.5 f before it (f59.5) and the word lands mid-ramp.
//   * A FUSED DOT IS 1.5 x DOT_R FLAT, the brief's number, rather than the area
//     sum of its 3-4 members (1.73-2.0 x). 2.0 x is exactly the core's size, and
//     a fused dot the size of the model reads as a second model.
//   * THE FOURTH ICON IS LUCIDE `git-merge`, NOT `merge`. Rendered at ring size,
//     `merge` (an arrow joining a stem) read as a standing figure, and a
//     standing figure is a human in this clip's vocabulary. `git-merge` is two
//     nodes and a branch joining them and cannot be misread.
//   * THE JUDGMENT PAUSE IS A STALL IN PATH DISTANCE, not a timer: y = s - H *
//     smoothstep((s - s0)/L) with L = 8 frames of travel and H = 0.55 L. That is
//     a 4.4-frame hold whose speed eases down to 17.5% and back with no corner
//     and never reverses, and it stays correct if the fall is ever retimed.
// ---------------------------------------------------------------------------

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
  dotOpacity: z.number(),
  beats: z.object({
    especially: z.number(),
    filtering: z.number(),
    judgment: z.number(),
    annotation: z.number(),
    recent: z.number(),
    synthesization: z.number(),
    that: z.number(),
    end: z.number(), // next word "how"; tail to 137
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
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    especially: 0,
    filtering: 26,
    judgment: 49,
    annotation: 61,
    recent: 76,
    synthesization: 95,
    that: 115,
    end: 121,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const AX = 540; // the axis

// --- the column -------------------------------------------------------------
// COMPRESSED (revision): the pitch between gates is 240 world, not 320, and the
// model sits one pitch below the last gate instead of 340. The four rings are
// therefore at -360 / -120 / +120 / +360 about the column centre and the model
// at +600 — 960 world px of centres — which is what lets K_REST come up to
// ~0.95 instead of 0.68 and the whole column fill the caption-safe band.
const PITCH = 240;
const MODEL_DROP = 240;
const Y_FILTER = 480;
const Y_JUDGE = Y_FILTER + PITCH; // 720
const Y_LABEL = Y_JUDGE + PITCH; // 960
const Y_FUSE = Y_LABEL + PITCH; // 1200
const Y_MODEL = Y_FUSE + MODEL_DROP; // 1440
const GATE_Y = [Y_FILTER, Y_JUDGE, Y_LABEL, Y_FUSE];
const CENTRES_SPAN = 3 * PITCH + MODEL_DROP; // 960

// --- the depth ladder -------------------------------------------------------
const OP_FG = 1.0;
const OP_MID = 0.78;
const BG_R_SCALE = 0.86; // the far side of the stream is smaller, never fainter
const POUR_BACK = 0.35;
const R_SPREAD = 0.16;

// ---------------------------------------------------------------------------
// THE WEIGHTS, in SCREEN px at the resting zoom, so every noun this cut shares
// with cut 1 is the same size on screen as it was there.
// ---------------------------------------------------------------------------
const SCREEN_OUTLINE = 6.0;
const SCREEN_RING_R = 65.3; // cut 1's R 64 at its k 1.02
const SCREEN_DOT_R = 5.6; // cut 1's DOT_RADIUS 5.5 at its k 1.02

// ---------------------------------------------------------------------------
// THE CAMERA'S RESTING ZOOM, solved from the compressed column.
//
// The column's ink runs from the top ring's top edge to the bottom of the core:
//   CENTRES_SPAN + (RING_R + STROKE/2) + CORE_R   in world px
// and every one of those three weights is a SCREEN px constant divided by k, so
// in SCREEN px the column is just
//   k * CENTRES_SPAN + SCREEN_RING_R + SCREEN_OUTLINE/2 + 2 * SCREEN_DOT_R.
// The caption-safe band is screen 300..1370 and the brief asks for 40 px clear
// at both ends, so the column may be 990 px:
//   k = (990 - 65.3 - 3.0 - 11.2) / 960 = 0.94844
// — 39% up from the 0.683 this cut was built at, and within 7% of cut 1's own
// 1.02, so the grid reads at very nearly the same scale in both cuts.
// ---------------------------------------------------------------------------
const BAND_TOP = 300;
const BAND_BOTTOM = 1370;
const BAND_CLEAR = 40;
const COLUMN_SPAN = BAND_BOTTOM - BAND_TOP - 2 * BAND_CLEAR; // 990
const K_REST_TARGET =
  (COLUMN_SPAN - SCREEN_RING_R - SCREEN_OUTLINE / 2 - 2 * SCREEN_DOT_R) / CENTRES_SPAN;

const PRE = 30; // frames of pre-roll run through the damper before frame 0
const LAST = DURATION - 1;

const STROKE = SCREEN_OUTLINE / K_REST_TARGET;
const RING_R = SCREEN_RING_R / K_REST_TARGET;
const DOT_R = SCREEN_DOT_R / K_REST_TARGET;
const CORE_R = 2 * DOT_R;
const RING_OUTER = RING_R + STROKE / 2;

// The content centre: the middle of the column's ink, which is what CAM_LIFT
// puts on screen y 835.
const INK_TOP = Y_FILTER - RING_OUTER;
const INK_BOTTOM = Y_MODEL + CORE_R;
const C_REST = (INK_TOP + INK_BOTTOM) / 2;

// A camera authored as KNOTS on one C1 curve rather than as a chain of
// smoothstep moves. Three chained `camMove`s would each have to come to a dead
// stop at its junction and start again, and the re-acceleration out of those
// stops measured 3.06 screen px/f2 on the filter ring, over the set's 2.2
// ceiling. A monotone cubic Hermite (Fritsch-Carlson tangents, so the track can
// never overshoot a knot and reverse) carries real velocity THROUGH every
// junction: the three glides are still there as knots, but the camera never
// stops between them. One key per frame, as `camMove` does, so the damper's
// target is the curve itself; cy is taken off the eased k so the framing and
// the zoom settle together.
const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
};

// The knots, in SHIFTED frames (fs = f + PRE). fs 0 is f -30: thirty frames of
// pre-roll run through the damper before frame 0, so the camera already has
// downward velocity at f0 instead of a standing start.
const KNOT_F = [0, PRE, PRE + 34, PRE + 72, PRE + 118, PRE + 136, PRE + 200];
const KNOT_C = [-69.8, 117.5, 297.5, 568, C_REST, C_REST + 5.0, C_REST + 14.4];

const trackFor = (kEnd: number) => {
  const KNOT_K = [3.4716, 3.055, 2.2219, 1.7358, kEnd, kEnd - 0.0125, kEnd - 0.0417];
  const cOf = hermite(KNOT_F, KNOT_C);
  const kOf = hermite(KNOT_F, KNOT_K);
  const F: number[] = [];
  const K: number[] = [];
  const CY: number[] = [];
  for (let f = 0; f <= PRE + DURATION + 60; f++) {
    const kk = kOf(f);
    F.push(f);
    K.push(kk);
    CY.push(cOf(f) + CAM_LIFT / kk);
  }
  return { F, K, CY };
};

const kAtLast = (kEnd: number) => {
  const t = trackFor(kEnd);
  return runCamera(LAST + PRE, t.F, t.CY, t.K).k;
};
const K_END = (() => {
  const a = 0.6;
  const b = 0.8;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom every weight in the piece is written against. */
const K_REST = kAtLast(K_END);

const CAM = trackFor(K_END);


const CAM_AT_F: { cy: number; k: number; cx: number }[] = (() => {
  const out: { cy: number; k: number; cx: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f + PRE, CAM.F, CAM.CY, CAM.K);
    out.push({ cy: c.cy + sway(f).dy, k: c.k, cx: AX + sway(f).dx });
  }
  return out;
})();
const camAt = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
const kAt = (f: number) => camAt(f).k;
const screenAt = (f: number, wx: number, wy: number) => {
  const c = camAt(f);
  return [WORLD_W / 2 + (wx - c.cx) * c.k, 960 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE FALL. One shared cumulative-distance table, so every dot in the piece is
// on the same clock and a group emitted together stays a group. The speed is
// capped against the camera so no head is ever over the set's 45 screen px/f —
// at the opening k 2.2 the cap is 40 / 2.2 = 18.2, just above the fall speed,
// so it never actually binds and the stream reads at one speed throughout.
// ---------------------------------------------------------------------------
const FALL_SPEED = 13.48;
const HEAD_CAP = 44; // screen px/frame
const F_MIN = -90;
const F_MAX = DURATION + 40;
const DTAB: number[] = (() => {
  const out: number[] = [0];
  for (let f = F_MIN + 1; f <= F_MAX; f++) {
    const k = kAt(Math.max(0, Math.min(DURATION, f)));
    out.push(out[out.length - 1] + Math.min(FALL_SPEED, HEAD_CAP / k));
  }
  return out;
})();
const distAt = (f: number) => {
  const x = Math.max(F_MIN, Math.min(F_MAX, f));
  const i = Math.floor(x) - F_MIN;
  const t = x - Math.floor(x);
  return DTAB[i] + (DTAB[Math.min(DTAB.length - 1, i + 1)] - DTAB[i]) * t;
};

const SPAWN_Y = -514;

// The judgment stall, in the PATH-DISTANCE domain. See DEVIATIONS.
const STALL_LEN = 8 * FALL_SPEED;
const STALL = 0.55 * STALL_LEN;
const STALL_S0 = Y_JUDGE - SPAWN_Y - STALL_LEN / 2 + STALL / 2;

const yFromDist = (s: number) =>
  SPAWN_Y + s - STALL * smoothstep(clamp01((s - STALL_S0) / STALL_LEN));

/** Where a dot born at `born` is on the axis at frame `f` (before any deflect). */
const yOf = (born: number, f: number) => yFromDist(distAt(f) - distAt(born));

/** The (fractional) frame that dot crosses world y `Y`. */
const crossF = (born: number, Y: number) => {
  let f = Math.floor(born);
  let prev = yOf(born, f);
  for (f = Math.floor(born) + 1; f <= F_MAX; f++) {
    const cur = yOf(born, f);
    if (cur >= Y) return f - 1 + (Y - prev) / Math.max(1e-6, cur - prev);
    prev = cur;
  }
  return Infinity;
};

// ---------------------------------------------------------------------------
// THE STREAM. 1.6 dots/frame, emitted from f -64.2 so that at frame 0 the front
// of the stream sits at y 191 — 289 world px, seventeen frames, above the filter
// ring — and the column above it is already full to beyond the top of the frame.
// ---------------------------------------------------------------------------
const EMIT_RATE = 2.2;
const FRONT_Y0 = Y_FILTER - 229; // = 251
const EMIT_F0 = -(FRONT_Y0 - SPAWN_Y) / FALL_SPEED; // = -61.7
const WOB_WIDE = 35; // half-width of the stream above the filter (70 world wide)
const WOB_NARROW = 21.4; // and below it
const PASS_FILTER = 0.55;
const PASS_JUDGE = 0.8;

type Dot = {
  i: number;
  born: number;
  amp: number;
  w1: number;
  p1: number;
  w2: number;
  p2: number;
  rs: number; // hashed radius spread
  back: boolean;
  passFilter: boolean;
  passJudge: boolean;
  side: number; // which way it is thrown out
  tFilter: number;
  tJudge: number; // the frame it clears the judgment ring
  tLabel: number;
  tFuse: number;
  tDefl: number; // the frame it meets the filter ring's rim
  tAnn: number; // the frame it picks up its annotation
};

const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  let acc = 0;
  let i = 0;
  for (let f = Math.floor(EMIT_F0); f <= DURATION + 4; f++) {
    acc += EMIT_RATE;
    while (acc >= 1) {
      acc -= 1;
      const born = f + hash(i, 102) * 0.92;
      if (born < EMIT_F0) {
        i++;
        continue;
      }
      const d: Dot = {
        i,
        born,
        amp: WOB_WIDE * (0.3 + 0.7 * hash(i, 31)),
        w1: 0.085 + 0.05 * hash(i, 32),
        p1: hash(i, 33) * 6.283,
        w2: 0.031 + 0.02 * hash(i, 34),
        p2: hash(i, 35) * 6.283,
        rs: 1 + (hash(i, 27) - 0.5) * 2 * R_SPREAD,
        back: hash(i, 104) < POUR_BACK,
        passFilter: hash(i, 41) < PASS_FILTER,
        passJudge: hash(i, 42) < PASS_JUDGE,
        side: hash(i, 43) < 0.5 ? -1 : 1,
        tFilter: 0,
        tJudge: 0,
        tLabel: 0,
        tFuse: 0,
        tDefl: 0,
        tAnn: 0,
      };
      d.tFilter = crossF(born, Y_FILTER);
      d.tJudge = crossF(born, Y_JUDGE + STALL_LEN * 0.22);
      d.tLabel = crossF(born, Y_LABEL);
      d.tFuse = crossF(born, Y_FUSE);
      d.tDefl = crossF(born, Y_FILTER - RING_R * 0.82);
      d.tAnn = crossF(born, Y_LABEL - RING_R * 0.55);
      out.push(d);
      i++;
    }
  }
  return out;
})();

// The lateral wobble envelope: 90 world px wide above the filter, 55 below it,
// narrowing over the 60 px under the ring.
const wobEnv = (y: number) =>
  1 - (1 - WOB_NARROW / WOB_WIDE) * smoothstep(clamp01((y - Y_FILTER) / 43));
const wobOf = (d: Dot, f: number, y: number) =>
  d.amp *
  wobEnv(y) *
  (0.68 * Math.sin(f * d.w1 + d.p1) + 0.32 * Math.sin(f * d.w2 + d.p2));

// --- the deflection at the filter -------------------------------------------
const DEFLECT_DUR = 14;
const DEFLECT_FADE = 8;
// --- the drop-out after the judgment ----------------------------------------
const DROPOUT_DUR = 12;
const DROPOUT_X = 43.2;
// --- the annotation ---------------------------------------------------------
const ANNOT_R = 0.45;
const ANNOT_SNAP = 4;
const ANNOT_DX = 1.15;

// ---------------------------------------------------------------------------
// THE FUSE. Labelled dots are taken in consecutive groups of 3 or 4 (hashed) —
// consecutive in ARRIVAL order at the fourth ring, so a group is always dots
// that are already near each other. The group converges over the 8 frames before
// its last member reaches the ring and merges into one ripe dot there.
// ---------------------------------------------------------------------------
const MERGE_PULL = 8;
const FUSED_R = 1.5;
const FUSED_RAMP = 4;
const ABSORB_DUR = 5;

type Fused = { g: number; members: number[]; tMerge: number; tLand: number };

const SURVIVORS = DOTS.filter((d) => d.passFilter && d.passJudge && isFinite(d.tFuse)).sort(
  (a, b) => a.tFuse - b.tFuse,
);

const FUSED: Fused[] = (() => {
  const out: Fused[] = [];
  let i = 0;
  let g = 0;
  while (i < SURVIVORS.length) {
    const n = hash(g, 55) < 0.5 ? 3 : 4;
    const members = SURVIVORS.slice(i, i + n);
    if (members.length < 2) break;
    const tMerge = Math.max(...members.map((m) => m.tFuse));
    // the fused dot falls on the same shared clock from the ring
    let tLand = Infinity;
    for (let f = Math.floor(tMerge) + 1; f <= F_MAX; f++) {
      const y = Y_FUSE + (distAt(f) - distAt(tMerge));
      if (y >= Y_MODEL) {
        const yp = Y_FUSE + (distAt(f - 1) - distAt(tMerge));
        tLand = f - 1 + (Y_MODEL - yp) / Math.max(1e-6, y - yp);
        break;
      }
    }
    out.push({ g, members: members.map((m) => m.i), tMerge, tLand });
    i += n;
    g++;
  }
  return out;
})();
const MERGE_OF = new Map<number, Fused>();
FUSED.forEach((fu) => fu.members.forEach((m) => MERGE_OF.set(m, fu)));

// --- ring conversion, measured off the dots that actually pass ---------------
const DEEP_AFTER = [5, 4, 1, 4];
const DEEP_DUR = 4;
const RIPE_LAG = 3;
const RIPE_DUR = 4;

const RING_DEEP_AT = (() => {
  const t0 = DOTS.filter((d) => d.passFilter).map((d) => d.tFilter).sort((a, b) => a - b);
  const t1 = DOTS.filter((d) => d.passFilter && d.passJudge).map((d) => d.tJudge).sort((a, b) => a - b);
  const t2 = DOTS.filter((d) => d.passFilter && d.passJudge).map((d) => d.tLabel).sort((a, b) => a - b);
  const t3 = FUSED.map((f) => f.tMerge).sort((a, b) => a - b);
  const pick = (arr: number[], n: number) => arr[Math.min(n - 1, arr.length - 1)] ?? 1e9;
  return [
    pick(t0, DEEP_AFTER[0]),
    pick(t1, DEEP_AFTER[1]),
    pick(t2, DEEP_AFTER[2]),
    pick(t3, DEEP_AFTER[3]),
  ];
})();

// --- the model --------------------------------------------------------------
const LANDINGS = FUSED.map((f) => f.tLand).filter((t) => isFinite(t)).sort((a, b) => a - b);
const CORE_R0 = 1.2; // x DOT_R at the first landing
const CORE_R1 = 2.0; // the set's core, reached by the landing nearest f120
const CORE_GROW = (() => {
  const n = LANDINGS.filter((t) => t <= 105).length;
  return (CORE_R1 * CORE_R1 - CORE_R0 * CORE_R0) / Math.max(1, n - 1);
})();
const coreRadius = (f: number) => {
  if (LANDINGS.length === 0 || f < LANDINGS[0]) return 0;
  let a2 = CORE_R0 * CORE_R0;
  for (let n = 1; n < LANDINGS.length; n++) {
    if (f < LANDINGS[n]) break;
    a2 += CORE_GROW * smoothstep(clamp01((f - LANDINGS[n]) / 5));
  }
  // the first landing itself ramps in, so the core is never born at full size
  const birth = smoothstep(clamp01((f - LANDINGS[0]) / 5));
  return DOT_R * Math.min(CORE_R1, Math.sqrt(a2)) * birth;
};

// ---------------------------------------------------------------------------
// THE NOUNS. lucide-static (ISC), inlined verbatim on the same 24 grid: filter,
// gavel, tag, merge. Four gates a viewer with no sound can name.
// ---------------------------------------------------------------------------
const ICON_FILTER = `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`;
const ICON_GAVEL =
  `<path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>`;
const ICON_TAG =
  `<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>`;
// `git-merge`, not `merge`: lucide's `merge` is an arrow into a stem, which at
// ring size reads as a standing figure — and a standing figure means a human in
// this clip's vocabulary. git-merge is two nodes and a branch joining them, and
// it cannot be mistaken for a person.
const ICON_MERGE =
  `<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>`;
const ICONS = [ICON_FILTER, ICON_GAVEL, ICON_TAG, ICON_MERGE];
const GLYPH_FRACTION = 0.6;

// --- the axis: segments BETWEEN the rings, so no line crosses an icon --------
const AXIS_SEGS: [number, number][] = [
  [Y_FILTER - RING_OUTER - 137, Y_FILTER - RING_OUTER],
  [Y_FILTER + RING_OUTER, Y_JUDGE - RING_OUTER],
  [Y_JUDGE + RING_OUTER, Y_LABEL - RING_OUTER],
  [Y_LABEL + RING_OUTER, Y_FUSE - RING_OUTER],
  [Y_FUSE + RING_OUTER, Y_MODEL],
];

type Live = {
  key: string;
  x: number;
  y: number;
  r: number;
  tone: number;
  back: boolean;
  ann: { x: number; y: number; r: number } | null;
};

// ---------------------------------------------------------------------------

const FilteringPipeline: React.FC<Props> = ({
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
  dotOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const toDeep = makeTone(ink, accentDeep);
  const toRipe = makeTone(accentDeep, accent);

  // -- camera ---------------------------------------------------------------
  const cam = runCamera(frame + PRE, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = AX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const live: Live[] = [];

  // -- every data dot --------------------------------------------------------
  DOTS.forEach((d) => {
    if (frame < d.born) return;
    const fused = MERGE_OF.get(d.i);

    // thrown out at the filter
    if (!d.passFilter) {
      const t0 = d.tDefl;
      if (frame >= t0) {
        const u = (frame - t0) / DEFLECT_DUR;
        if (u >= 1) return;
        const e = arriveEase(clamp01(u));
        const y0 = Y_FILTER - RING_R * 0.82;
        const x0 = AX + wobOf(d, t0, y0);
        const th0 = Math.atan2(y0 - Y_FILTER, x0 - AX);
        const rho0 = Math.hypot(x0 - AX, y0 - Y_FILTER);
        const th = th0 + d.side * 1.35 * e;
        const rho = rho0 + (RING_OUTER + DOT_R * 1.4 - rho0) * e + 18.7 * e * e;
        const fade = 1 - clamp01((frame - (t0 + DEFLECT_DUR - DEFLECT_FADE)) / DEFLECT_FADE);
        live.push({
          key: `x${d.i}`,
          x: AX + Math.cos(th) * rho,
          y: Y_FILTER + Math.sin(th) * rho,
          r: DOT_R * d.rs * (d.back ? BG_R_SCALE : 1) * breath(frame, hash(d.i, 9)) * fade,
          tone: 0,
          back: d.back,
          ann: null,
        });
        return;
      }
    }

    // merged away
    if (fused && frame >= fused.tMerge) return;

    let y = yOf(d.born, frame);
    let x = AX + wobOf(d, frame, y);
    let shrink = Math.min(1, (frame - d.born) / 2);

    // judged out: keeps falling, drifts sideways, dissolves
    if (d.passFilter && !d.passJudge && frame > d.tJudge) {
      const u = clamp01((frame - d.tJudge) / DROPOUT_DUR);
      if (u >= 1) return;
      x += d.side * DROPOUT_X * smoothstep(u);
      shrink = Math.min(shrink, 1 - u * u);
    }
    if (!d.passFilter && y > Y_FILTER) return;

    // the pull-together before a merge
    if (fused) {
      const u = clamp01((frame - (fused.tMerge - MERGE_PULL)) / MERGE_PULL);
      if (u > 0) {
        const e = smoothstep(u);
        x += (AX - x) * e;
        y += (Y_FUSE - y) * e;
      }
    }

    // tone: deep until the judgment, ripe out of it
    const tone = d.passJudge
      ? clamp01((frame - (d.tJudge - 3)) / 6) * (d.passFilter ? 1 : 0)
      : 0;

    // the annotation, picked up at the third ring
    let ann: Live["ann"] = null;
    if (d.passFilter && d.passJudge) {
      const tA = d.tAnn;
      if (frame >= tA) {
        const e = arriveEase(clamp01((frame - tA) / ANNOT_SNAP));
        const rimX = AX + RING_R * 0.707;
        const rimY = Y_LABEL - RING_R * 0.707;
        const tgtX = x + ANNOT_DX * DOT_R;
        const tgtY = y - ANNOT_DX * DOT_R;
        ann = {
          x: rimX + (tgtX - rimX) * e,
          y: rimY + (tgtY - rimY) * e,
          r: DOT_R * ANNOT_R * shrink * Math.min(1, e * 2.2),
        };
      }
    }

    live.push({
      key: `d${d.i}`,
      x,
      y,
      r: DOT_R * d.rs * (d.back ? BG_R_SCALE : 1) * breath(frame, hash(d.i, 9)) * shrink,
      tone,
      back: d.back,
      ann,
    });
  });

  // -- the fused dots --------------------------------------------------------
  FUSED.forEach((fu) => {
    if (frame < fu.tMerge) return;
    if (frame >= fu.tLand) return;
    let y = Y_FUSE + (distAt(frame) - distAt(fu.tMerge));
    let x = AX;
    let r =
      DOT_R *
      (1 + (FUSED_R - 1) * smoothstep(clamp01((frame - fu.tMerge) / FUSED_RAMP))) *
      breath(frame, hash(fu.g, 9));
    // decelerate into the model and be taken in
    const tAb = fu.tLand - frame;
    if (tAb < ABSORB_DUR) {
      const u = clamp01(1 - tAb / ABSORB_DUR);
      const yIn = Y_FUSE + (distAt(fu.tLand - ABSORB_DUR) - distAt(fu.tMerge));
      y = yIn + (Y_MODEL - yIn) * arriveEase(u);
      r *= 1 - u * u;
    }
    live.push({
      key: `u${fu.g}`,
      x,
      y,
      r,
      tone: 1,
      back: false,
      ann: {
        x: x + ANNOT_DX * DOT_R * 1.3,
        y: y - ANNOT_DX * DOT_R * 1.3,
        r: DOT_R * ANNOT_R * (r > 0 ? 1 : 0) * Math.min(1, (frame - fu.tMerge) / 2 + 0.4),
      },
    });
  });

  const glyphBox = 2 * RING_R * GLYPH_FRACTION;
  const coreR = coreRadius(frame) * breath(frame, 0.31);

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
        cxRest={AX}
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
            {/* Z-ORDER, in tree order and nothing may be moved past anything
                else: (1) the axis, (2) every data dot, fused dot and annotation,
                (3) the ring strokes, (4) the Lucide icons, (5) the core. The
                stream therefore passes UNDER the gates: a dot crossing a ring
                goes behind the glyph and the icon is never broken by it, and the
                core is drawn over the dots it swallows. */}
            {/* (1) the column: the axis the fall runs on */}
            <g style={{ filter: icon }}>
              {AXIS_SEGS.map(([a, b], i) => (
                <line
                  key={`a${i}`}
                  x1={AX}
                  y1={a}
                  x2={AX}
                  y2={b}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={OP_MID}
                />
              ))}
            </g>

            {/* (2a) the data, under the gates: the stream runs behind the ink */}
            {[true, false].map((backPass) =>
              live.map((d) =>
                d.back !== backPass || d.r <= 0 ? null : (
                  <circle
                    key={`${backPass ? "b" : "c"}${d.key}`}
                    cx={d.x}
                    cy={d.y}
                    r={d.r}
                    fill={toRipe(d.tone)}
                    opacity={dotOpacity * OP_FG}
                  />
                ),
              ),
            )}

            {/* (2b) the annotations: one small white dot riding a labelled datum */}
            {live.map((d) =>
              d.ann && d.ann.r > 0 ? (
                <circle
                  key={`n${d.key}`}
                  cx={d.ann.x}
                  cy={d.ann.y}
                  r={d.ann.r}
                  fill={ink}
                  opacity={OP_FG}
                />
              ) : null,
            )}

            {/* (3) the four gates' rings, over every dot */}
            <g style={{ filter: icon }}>
              {GATE_Y.map((gy, s) => {
                const deepT = smoothstep(clamp01((frame - RING_DEEP_AT[s]) / DEEP_DUR));
                const ripeT = smoothstep(
                  clamp01((frame - (RING_DEEP_AT[s] + RIPE_LAG)) / RIPE_DUR),
                );
                const col = frame >= RING_DEEP_AT[s] + RIPE_LAG ? toRipe(ripeT) : toDeep(deepT);
                return (
                  <circle
                    key={`r${s}`}
                    cx={AX}
                    cy={gy}
                    r={RING_R}
                    fill="none"
                    stroke={col}
                    strokeWidth={STROKE}
                    opacity={OP_MID + (OP_FG - OP_MID) * deepT}
                  />
                );
              })}
            </g>
            {/* (4) the icons, over the rings and over every dot */}
            <g style={{ filter: icon }}>
              {GATE_Y.map((gy, s) => (
                <g
                  key={`g${s}`}
                  transform={`translate(${(AX - glyphBox / 2).toFixed(3)} ${(
                    gy -
                    glyphBox / 2
                  ).toFixed(3)}) scale(${(glyphBox / 24).toFixed(5)})`}
                  fill="none"
                  stroke={ink}
                  color={ink}
                  strokeWidth={(STROKE * 24) / glyphBox}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={OP_FG}
                  dangerouslySetInnerHTML={{ __html: ICONS[s] }}
                />
              ))}
            </g>

            {/* (5) THE MODEL: nothing is drawn until the first fused dot lands */}
            {coreR > 0 ? (
              <circle
                cx={AX}
                cy={Y_MODEL}
                r={coreR}
                fill={accent}
                opacity={dotOpacity * OP_FG}
                style={{ filter: icon }}
              />
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default FilteringPipeline;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  filtering: defaultProps.beats.filtering,
  judgment: defaultProps.beats.judgment,
  annotation: defaultProps.beats.annotation,
  synthesization: defaultProps.beats.synthesization,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => runCamera(f + PRE, CAM.F, CAM.CY, CAM.K);
export const STATS = {
  kStart: Number(kAt(0).toFixed(4)),
  kRest: Number(K_REST.toFixed(5)),
  kEnd: Number(K_END.toFixed(5)),
  cRest: Number(C_REST.toFixed(1)),
  strokeWorld: Number(STROKE.toFixed(3)),
  strokeScreen: Number((STROKE * K_REST).toFixed(2)),
  ringRWorld: Number(RING_R.toFixed(2)),
  ringRScreen: Number((RING_R * K_REST).toFixed(2)),
  dotScreen: Number((2 * DOT_R * K_REST).toFixed(2)),
  coreScreen: Number((2 * CORE_R * K_REST).toFixed(2)),
  inkTopScreen: Number(screenAt(LAST, AX, INK_TOP)[1].toFixed(1)),
  inkBottomScreen: Number(screenAt(LAST, AX, INK_BOTTOM)[1].toFixed(1)),
  dots: DOTS.length,
  survivors: SURVIVORS.length,
  fused: FUSED.length,
  ringDeepAt: RING_DEEP_AT.map((f) => Number(f.toFixed(1))),
  ringRipeDone: RING_DEEP_AT.map((f) => Number((f + RIPE_LAG + RIPE_DUR).toFixed(1))),
  frontFilter: Number(Math.min(...DOTS.map((d) => d.tFilter)).toFixed(1)),
  firstMerge: Number((FUSED[0]?.tMerge ?? -1).toFixed(1)),
  landings: LANDINGS.filter((t) => t <= DURATION).map((t) => Number(t.toFixed(1))),
  coreGrow: Number(CORE_GROW.toFixed(3)),
  coreAt: [100, 110, 120, 136].map((f) => Number((coreRadius(f) / DOT_R).toFixed(2))),
  gateEnterFrame: GATE_Y.map((gy) => {
    for (let f = 0; f <= DURATION; f++) {
      if (screenAt(f, AX, gy - RING_OUTER)[1] < 1920) return f;
    }
    return -1;
  }),
  modelEnterFrame: (() => {
    for (let f = 0; f <= DURATION; f++) if (screenAt(f, AX, Y_MODEL)[1] < 1920) return f;
    return -1;
  })(),
};
