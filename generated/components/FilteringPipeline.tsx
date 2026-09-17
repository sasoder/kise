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
  FEATHER_STEPS,
  Vignette,
  WOBBLE_R,
  breath,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";
import { CLAUDE } from "./brandGlyphs";
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
//   "all the deployment data there is funnels into a pipe, falls through four
//    gates — some thrown out, the rest judged, labelled and fused — and what
//    comes out the bottom builds Claude."
//
// VOCABULARY, the same as cut 1 (`MillionsOfYears`) of this clip:
//   deployment data = small SOLID orange dots, ACCENT_DEEP at rest, ACCENT once
//                     judged good. Nothing else in the piece is orange.
//   the field       = the same dots, spread wide ABOVE the funnel before their
//                     turn comes: 251 of them over 760 x 320 world px, feathered
//                     and wobbled at the boundary, milling. It is not a second
//                     population — a dot in the field IS a dot in the stream,
//                     drawn at its seat until the pipe is ready for it.
//   the model       = the CLAUDE mark (brandGlyphs, the 24-unit em box, inline
//                     <path>, fill-rule evenodd), filled, 68 screen px, with
//                     iconShadow(k). It is not drawn until the first fused dot
//                     lands in it. It is the only mark in the piece.
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
//              -> ring strokes -> the Lucide icons -> the CLAUDE mark, on top.
// The data falls BEHIND the gates. A dot passing a gate goes under the icon, so
// the glyph is never broken by the stream, and the mark is drawn over the dots
// it swallows. Nothing else in the tree may be reordered against this.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous fall; the words are inflections in it. Nothing
// starts from rest, and nothing in the piece is outside this list.
//
//  1. f0-44 "especially if     THE FUNNEL. Deployment data is everywhere, and it
//           you do" (f0-11)    funnels in. The cut opens WIDE (k 1.062, the whole
//                              column in frame) on a feathered, wobbled field of
//                              251 data dots spread 760 world px across and 320
//                              deep above the filter ring (world y -140..180),
//                              milling on two slow sines, all ACCENT_DEEP. From
//                              f2 the field FUNNELS: every dot drifts inward and
//                              settles toward the mouth on its own start — the
//                              centre first, the rim last, keyed on distance from
//                              the mouth, so the outline closes from the inside
//                              out — and each one, over its last ~14 frames,
//                              blends off its seat onto the axis, where it is
//                              simply the next dot in the fall. The picture
//                              rhymes with the gate below it: the filter icon IS
//                              a funnel. The neck below the field is already
//                              formed at f0 (the 13 dots born before the field's
//                              first seat), so the stream FRONT still reaches the
//                              filter ring at f18.0 and every gate keeps its
//                              schedule. The field's last seat empties at f76;
//                              from there the pour is the old emission, 2.2
//                              dots/frame from above the frame, and it never
//                              stops. The camera is already moving at f0 (30
//                              frames of pre-roll through the damper) and pushes
//                              in and down onto the old track by f34.
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
//  6. f98-137 "of that" + tail THE MARK LIGHTS. Each fused dot decelerates on
//                              arriveEase into the MARK'S EDGE — not its centre —
//                              and is taken in, its annotation with it. The
//                              CLAUDE mark appears with the FIRST landing (f98.4)
//                              at 0.35 scale in ACCENT_DEEP, and every fused dot
//                              it swallows ticks it up BY AREA (arriveEase over
//                              6 f, with a small overshoot so a swallow is felt)
//                              and a step further toward ACCENT. It is at full
//                              size and fully ripe at f117.5 and breathes from
//                              there. The stream never stops: through the whole
//                              tail data still falls, is filtered, judged,
//                              labelled, fused and absorbed — so the last 18
//                              frames are a lit Claude mark at the foot of a
//                              pipeline that is still running.
//
// LIVENESS — mechanisms, not gestures, none on a word and none ever stopping:
// the field's milling and its contraction, the pour (2.2/frame from f-56.8 to
// the last frame, metered through the field for f2..f76), every dot's hashed
// lateral wobble, breath() on every dot and on the mark, the grid's parallax and
// its own -0.3 px/frame drift, and a camera that never parks (the push-in, two
// glides, and a decaying drift that is still running at DURATION).
//
// ---------------------------------------------------------------------------
// CAMERA — ONE C1 curve, not a chain of moves. Seven knots on a monotone cubic
// Hermite (Fritsch-Carlson tangents), one key per frame, through the shared
// damper; cy is taken off the eased k so the framing and the zoom settle
// together. c is the world y put on screen y 835 (CAM_LIFT 125). The cut now
// opens WIDE, so the first move is a push IN — and the camera carries velocity
// through the turn onto the old track rather than stopping on it.
//
//   knot   f -30   k 0.860  c  244   PRE-ROLL, run through the damper before
//                                    frame 0 so f0 is already pushing in
//   knot   f   0   k 1.130  c  278   THE SPREAD: the field (world y -140..180)
//                                    sits at screen 397..737, the filter ring at
//                                    1056, the whole column in frame (its damped
//                                    values are k 1.062, c 272)
//   knot   f  34   k 2.222  c  345   the push-in lands on the old track
//   knot   f  72   k 1.736  c  568   keep tracking; unchanged
//   knot   f 118   k solved c  941.5 the resolve: the whole column in the band
//   knot   f 136   k -0.0125 c  +5.0 still drifting on the last frame
//   knot   f 200   k -0.0417 c +14.4 the drift's continuation, off the end
//
// MEASURED (audit over f1..136, on the four ring centres, the model, the field
// centre, and on the world point sitting at screen (540, 1300); a point is only
// measured while it is inside the frame):
//   max head speed          31.84 screen px/f   (ceiling 45, at f88)
//   max |dv|                 1.68 screen px/f2  (ceiling 2.2, at f6)
//   min camera motion        0.377 screen px/f  (floor 0.15, at f136)
//   k at f0 / f136           1.062 / 0.92469
//   column at f136           screen y 332.1 .. 1322.1 (band 300..1370)
//
// STROKE ARITHMETIC, all at K_REST = 0.92469:
//   ring / icon / axis stroke   6.00 screen px  =  6.489 world px
//   station ring               65.30 screen px radius = 70.62 world
//   data dot                   11.20 screen px diameter = 6.06 world radius
//   the CLAUDE mark            68.00 screen px em box   = 73.54 world
//   annotation                  5.04 screen px diameter (0.45 x the dot)
// Every one of those screen numbers but the mark's is cut 1's, so a dot, a ring
// and a stroke are the same size on screen in both cuts of this clip.
//
// MEASURED BEATS (the audit's own numbers, off the dots that actually pass):
//   stream front at the filter  f18.0   (unchanged by the funnel)
//   filter ring   6th passing dot  f22.8  deep f22.8-26.8  ripe f25.8-29.8
//                                         -> "filtering"      f26  ON IT
//   judgment ring 7th through      f47.4  ripe done f54.4
//                                         -> "judgment"       f49  ON IT
//   annotation ring 2nd through    f58.4  ripe done f65.4
//                                         -> "annotation"     f61  ON IT
//   synthesis ring 7th fused       f90.5  ripe done f97.5
//                                         -> "synthesization" f95  ON IT
//   the field: funnel starts f2 · first seat joins the axis f2 · a quarter of
//   them by f16 · half by f34 · the last at f76
//   first merge f80.6 · first landing (the mark appears) f98.4 · mark full size
//   and fully ripe f117.5 · 21 landings in all, the last at f135.6
//   rings in frame: all four from f0 — the opening is wide enough to hold the
//   whole column, so every gate is seen long before its word
//   the model's empty position enters the frame at f91, seven frames before the
//   first fused dot lands in it
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//   * K_REST IS 0.92469, RE-SOLVED FOR THE TALLER FOOT. Same solve as before,
//     but the foot of the column is now the CLAUDE mark's half em box (34 screen
//     px) where it was the core's radius (11.2): the column in screen px is
//     960k + 65.3 + 3.0 + 34.0, the band allows 990, so k = 887.7 / 960 =
//     0.92469 — 2.5% down from the 0.94845 the dot-core allowed. Measured
//     clearance on the last frame is 32 px above and 48 below.
//   * THE FUNNEL IS A RESERVOIR, NOT A SURGE. The field's 251 dots ARE the pour
//     for f2..f76: a seat's dot is born so that its own fall puts it on the axis
//     at Y_JOIN on its scheduled frame, and nothing below that line is touched.
//     The alternative — adding 251 dots on top of the existing emission — would
//     have tripled the traffic through the gates for forty frames, closed the
//     column into a solid rope and moved every conversion. The drain is metered
//     on (rank/N)^1.2 over f2..f76, which gulps at the mouth (about 6 dots/frame
//     at the start) and eases to the stream's own 2.2/frame by the last seat, so
//     the handover to the ordinary emission cannot be seen. It does run ~1.6x
//     the old density through the middle of the cut, which is why the column
//     between the annotation and synthesis rings now reads as a stream rather
//     than as specks on a line.
//   * THE RINGS CONVERT ON THEIR 6th / 7th / 2nd / 7th. Same rule as before — a
//     ring converts on the Nth thing through it, measured off the dots that
//     actually pass — but the funnel's metering changes the traffic, so N was
//     re-solved to hold the conversion frames the cut already had: 22.8 / 47.4 /
//     58.4 / 90.5 against the old 22.8 / 47.4 / 59.5 / 91.0. Every word still
//     lands inside its ring's ramp.
//   * THE HANDOFF AND THE CONTRACTION ARE SMOOTHSTEPS, NOT arriveEase.
//     arriveEase enters at 1.3x the nominal speed, which out of a milling field
//     is a visible pop, and it leaves at zero, which cannot match the fall's
//     13.48 px/f on the frame a dot joins the axis. Blended as
//     seat + (stream - seat) * smoothstep(u), the dot leaves its seat from rest
//     and is at exactly the stream's speed at u = 1: both ends are C1 and the
//     join cannot be seen. arriveEase is kept where it belongs — the deflection,
//     the annotation snap, the absorption, and the mark's growth tick.
//   * THE FIRST LANDING IS f98.4, NOT f99.1, and the first merge f80.6 rather
//     than f81.3: the denser column puts the fourth survivor at the synthesis
//     ring half a frame sooner. The mark therefore appears on "of" (f108) minus
//     ten rather than minus eleven — inside the same beat.
//   * THE RINGS ARE R 70.62 WORLD, NOT R 64. A ring is a shared noun with cut 1,
//     where it is R 64 at k 1.02 = 65.3 SCREEN px, and the memory rule is that a
//     shared noun keeps one size across cuts. The world radius is therefore
//     solved from the screen one: 65.3 / 0.92469 = 70.62, and so are the dot,
//     the mark and the stroke. That is 10.3% off the set's 64 — where the
//     pre-compression build, at k 0.683, was 49% off (R 95.6) — and it is the
//     half of the brief that is actually visible: at a literal R 64 the ring
//     would draw at 59.2 screen px, 9% smaller than the same ring one cut
//     earlier in the same edit.
//   * THE FIELD AND THE STREAM ENTER FROM ABOVE THE BAND. Every structural
//     thing — the four rings, the axis, the mark — is inside screen 300..1370 at
//     the resolved camera. The field at f0 sits at screen 397..737, inside the
//     band; the fall above the filter ring necessarily occupies the frame above
//     it later, because "it never stops" IS the gesture.
//   * THE EMISSION IS 2.2 DOTS/FRAME, NOT 1.6. At 1.6 only 0.70/frame survive
//     both gates, and the rendered column between the annotation ring and the
//     synthesis ring read as specks on a line rather than a stream. 2.2 puts a
//     dot every ~6 world px above the filter and keeps the bottom of the column
//     alive to the last frame.
//   * THE FALL IS 13.48 WORLD PX/FRAME. The compression took 25% out of every
//     gap, so the speed came down with it to hold the landing schedule: 240 /
//     13.48 = 17.8 frames gate to gate, exactly what 320 / 18 was before, and
//     the front is started 229 world px above the filter so it still arrives at
//     f18. The head cap is 44 screen px/f, which at the cut's highest k (2.21)
//     is 19.9 world px/f and so never binds: the stream now reads at ONE speed for the
//     whole cut instead of being clipped through the opening.
//   * A FUSED DOT IS 1.5 x DOT_R FLAT, the brief's number, rather than the area
//     sum of its 3-4 members (1.73-2.0 x). Anything larger starts to read as a
//     second model rather than as the last thing before one.
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
// THE MODEL IS THE CLAUDE MARK, on the brand set's 24-unit em box, drawn as
// inline <path>s with fill-rule evenodd — never an <image>, which races frame
// capture. 68 screen px puts its em box just over a station ring's 65.3 radius,
// so the thing the pipeline builds is the one object in the frame that is
// neither a dot, a ring nor a line.
const SCREEN_MARK = 68;

// ---------------------------------------------------------------------------
// THE CAMERA'S RESTING ZOOM, solved from the compressed column.
//
// The column's ink runs from the top ring's top edge to the bottom of the mark:
//   CENTRES_SPAN + (RING_R + STROKE/2) + MARK_BOX/2   in world px
// and every one of those three weights is a SCREEN px constant divided by k, so
// in SCREEN px the column is just
//   k * CENTRES_SPAN + SCREEN_RING_R + SCREEN_OUTLINE/2 + SCREEN_MARK/2.
// The caption-safe band is screen 300..1370 and the brief asks for 40 px clear
// at both ends, so the column may be 990 px:
//   k = (990 - 65.3 - 3.0 - 34.0) / 960 = 0.92469
// The foot is the mark's half em box now, not a core's 11.2 px radius, so k
// comes down 2.5% from the 0.94845 the dot-core allowed — still within 10% of
// cut 1's own 1.02, so the grid reads at very nearly the same scale in both.
// ---------------------------------------------------------------------------
const BAND_TOP = 300;
const BAND_BOTTOM = 1370;
const BAND_CLEAR = 40;
const COLUMN_SPAN = BAND_BOTTOM - BAND_TOP - 2 * BAND_CLEAR; // 990
const K_REST_TARGET =
  (COLUMN_SPAN - SCREEN_RING_R - SCREEN_OUTLINE / 2 - SCREEN_MARK / 2) / CENTRES_SPAN;

const PRE = 30; // frames of pre-roll run through the damper before frame 0
const LAST = DURATION - 1;

const STROKE = SCREEN_OUTLINE / K_REST_TARGET;
const RING_R = SCREEN_RING_R / K_REST_TARGET;
const DOT_R = SCREEN_DOT_R / K_REST_TARGET;
/** The mark's own shadow opacity. The per-icon shadow keeps its shape on the
 *  mark -- 2 px down, 3 px blur, in SCREEN px at every camera k -- but the mark
 *  is a big FILLED shape where the rings, the lanes and the Lucide icons are
 *  6 px strokes, so the identical filter lays down one large block of shadow at
 *  FULL coverage instead of a thin line of it at about 70%% of it, and reads as
 *  a harsher, heavier shadow. Measured against a reference ink element's
 *  darkest shadow pixel and lowered until the two match. */
const MARK_SHADOW_OPACITY = 0.27;

const MARK_BOX = SCREEN_MARK / K_REST_TARGET;
const RING_OUTER = RING_R + STROKE / 2;

// The content centre: the middle of the column's ink, which is what CAM_LIFT
// puts on screen y 835.
const INK_TOP = Y_FILTER - RING_OUTER;
const INK_BOTTOM = Y_MODEL + MARK_BOX / 2;
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
const KNOT_C = [244.0, 278.0, 345.0, 568, C_REST, C_REST + 5.0, C_REST + 14.4];

const trackFor = (kEnd: number) => {
  const KNOT_K = [0.86, 1.13, 2.2219, 1.7358, kEnd, kEnd - 0.0125, kEnd - 0.0417];
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
// THE STREAM. 2.2 dots/frame, emitted from f -56.8 so that at frame 0 the front
// of the fall sits at y 251 — 229 world px, eighteen frames, above the filter
// ring. Only the 13 dots born before the field's first seat are on the axis at
// f0: they are the neck the funnel is already pouring into, and it is their
// front that meets the filter at f18.
// ---------------------------------------------------------------------------
const EMIT_RATE = 2.2;
const FRONT_Y0 = Y_FILTER - 229; // = 251
const EMIT_F0 = -(FRONT_Y0 - SPAWN_Y) / FALL_SPEED; // = -56.8
const WOB_WIDE = 35; // half-width of the stream above the filter (70 world wide)
const WOB_NARROW = 21.4; // and below it
const PASS_FILTER = 0.55;
const PASS_JUDGE = 0.8;

// ---------------------------------------------------------------------------
// THE FIELD. "Deployment data is everywhere, and it funnels in." The cut opens
// on a wide feathered spread of data ABOVE the filter, and the spread IS the
// stream's own first ~260 dots, drawn at a seat in the field instead of on the
// axis until each one's turn comes. Nothing below the join line changes: a dot
// reaches Y_JOIN on exactly the frame its own `born` puts it there, so the
// front still meets the filter ring at f18 and every gate keeps its schedule.
//
// The seats are a jittered grid inside a wobbled superellipse, feathered at the
// boundary (density AND radius fall off over the outer 22% — an edge that reads
// as a line is the one thing the set forbids of a crowd).
// ---------------------------------------------------------------------------
const FIELD_HW = 380; // half-width: the spread is 760 world px across
const FIELD_HH = 160; // half-height: 320 world px, y -140 .. 180
const FIELD_CY = Y_FILTER - 460; // = 20
const FIELD_MOUTH = FIELD_CY + FIELD_HH; // 180, where the funnel necks down
const Y_JOIN = FIELD_MOUTH + 20; // 200: a dot is on the axis by here
const FIELD_COLS = 29;
const FIELD_ROWS = 12;
const FIELD_SE = 2.6; // superellipse exponent: a blob, never a box
const FIELD_EDGE = 0.22; // the feathered band, as a fraction of the radius
const FIELD_T0 = 2; // the funnel starts on frame 2
const FIELD_T1 = 76; // and the last seat empties here
const FIELD_DRAIN_P = 1.2; // >1: the mouth gulps, the rate eases to the stream's
const CONTRACT = 0.62; // how far the outline closes on the axis
const SETTLE = 0.3; // and how far it settles toward the mouth
const C_SPREAD = 14; // frames between the centre starting and the rim starting
const C_DUR = 24; // one dot's contraction
const HANDOFF = 14; // frames a dot takes to leave its seat for the axis
const JOIN_LEAD = (Y_JOIN - SPAWN_Y) / FALL_SPEED; // = 52.97

type Seat = { id: number; x: number; y: number; q: number; rf: number };

const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  const cw = (2 * FIELD_HW) / FIELD_COLS;
  const ch = (2 * FIELD_HH) / FIELD_ROWS;
  for (let gy = 0; gy < FIELD_ROWS; gy++) {
    for (let gx = 0; gx < FIELD_COLS; gx++) {
      const id = gy * FIELD_COLS + gx;
      const x = AX - FIELD_HW + (gx + 0.5) * cw + (hash(id, 11) - 0.5) * cw * 0.92;
      const y = FIELD_CY - FIELD_HH + (gy + 0.5) * ch + (hash(id, 12) - 0.5) * ch * 0.92;
      const u = Math.abs(x - AX) / FIELD_HW;
      const v = Math.abs(y - FIELD_CY) / FIELD_HH;
      const rho = Math.pow(Math.pow(u, FIELD_SE) + Math.pow(v, FIELD_SE), 1 / FIELD_SE);
      const th = Math.atan2(y - FIELD_CY, x - AX);
      const bound = 1 + 0.055 * wobble(th * WOBBLE_R, 7);
      if (rho > bound) continue;
      const fe = feather(clamp01((bound - rho) / FIELD_EDGE) * FEATHER_STEPS, FEATHER_STEPS);
      if (hash(id, 13) > 0.34 + 0.66 * fe) continue;
      out.push({ id, x, y, q: 0, rf: 0.55 + 0.45 * fe });
    }
  }
  out.forEach((s) => {
    s.q =
      Math.hypot((s.x - AX) / FIELD_HW, (FIELD_MOUTH - s.y) / (2 * FIELD_HH)) +
      0.07 * (hash(s.id, 15) - 0.5);
  });
  out.sort((a, b) => a.q - b.q);
  return out;
})();

type Dot = {
  i: number;
  born: number;
  seat: Seat | null;
  tJoin: number; // the frame it is on the axis at Y_JOIN
  cStart: number; // the frame its own contraction begins
  hand: number; // its handoff length
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

// The three phases of the pour, on ONE born-time line:
//   A  the neck that is already below the field at frame 0, at the set's 2.2/f
//   B  the field: one dot per seat, born so that it reaches Y_JOIN on its own
//      scheduled frame — the drain is the emission for f2..f76
//   C  the pour that never stops: 2.2/f again, from above the frame
const FIELD_B0 = FIELD_T0 - JOIN_LEAD; // = -50.97
const FIELD_B1 = FIELD_T1 - JOIN_LEAD; // = 23.03
const BORN_LINE: { born: number; seat: Seat | null }[] = (() => {
  const out: { born: number; seat: Seat | null }[] = [];
  let acc = 0;
  let j = 0;
  for (let f = Math.floor(EMIT_F0); f <= FIELD_B0; f++) {
    acc += EMIT_RATE;
    while (acc >= 1) {
      acc -= 1;
      const born = f + hash(j, 102) * 0.92;
      j++;
      if (born >= EMIT_F0 && born < FIELD_B0) out.push({ born, seat: null });
    }
  }
  const n = SEATS.length;
  SEATS.forEach((s, r) => {
    const t = FIELD_T0 + (FIELD_T1 - FIELD_T0) * Math.pow(r / Math.max(1, n - 1), FIELD_DRAIN_P);
    out.push({ born: t - JOIN_LEAD, seat: s });
  });
  acc = 0;
  j = 9000;
  for (let f = Math.ceil(FIELD_B1); f <= DURATION + 4; f++) {
    acc += EMIT_RATE;
    while (acc >= 1) {
      acc -= 1;
      const born = f + hash(j, 102) * 0.92;
      j++;
      if (born >= FIELD_B1) out.push({ born, seat: null });
    }
  }
  out.sort((a, b) => a.born - b.born);
  return out;
})();

const DOTS: Dot[] = (() => {
  const out: Dot[] = [];
  {
    let i = 0;
    for (const e of BORN_LINE) {
      const born = e.born;
      const d: Dot = {
        i,
        born,
        seat: e.seat,
        tJoin: 0,
        cStart: e.seat ? FIELD_T0 + e.seat.q * C_SPREAD + hash(i, 61) * 3 : 0,
        hand: HANDOFF * (0.8 + 0.45 * hash(i, 62)),
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
      d.tJoin = e.seat ? crossF(born, Y_JOIN) : -1e9;
      out.push(d);
      i++;
    }
  }
  return out;
})();

// Where a field dot's seat is at frame `f`: the whole spread contracts on the
// axis and settles toward the mouth, each dot on its own start (the centre
// first, the rim last, keyed on distance from the mouth — a mechanism, not a
// timer), and mills on two slow sines the whole time so the field is never a
// still picture.
const seatAt = (d: Dot, f: number) => {
  const s = d.seat as Seat;
  const c = smoothstep(clamp01((f - d.cStart) / C_DUR));
  return {
    x:
      AX +
      (s.x - AX) * (1 - CONTRACT * c) +
      5.5 * Math.sin(f * 0.055 + d.p1) +
      3.0 * Math.sin(f * 0.021 + d.p2),
    y:
      s.y +
      (FIELD_MOUTH + 30 - s.y) * SETTLE * c +
      4.0 * Math.sin(f * 0.047 + d.p2) +
      2.5 * Math.sin(f * 0.017 + d.p1),
  };
};

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
const DEEP_AFTER = [6, 7, 2, 7];
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
// --- the model: the CLAUDE mark ---------------------------------------------
// Not a dot. The thing the pipeline builds is the model, and the model in this
// clip's vocabulary is the Claude mark: it appears with the FIRST fused landing
// at 0.35 of its size in ACCENT_DEEP, grows BY AREA with every fused dot it
// swallows (one arriveEase tick per landing, easing back to the new rest over
// 6 f, with a small overshoot so a swallow is felt), tones deep -> ripe on the
// same ladder, and is at full size and ACCENT by the landing nearest f118 —
// after which it breathes. That is what happens at the end.
const LANDINGS = FUSED.map((f) => f.tLand).filter((t) => isFinite(t)).sort((a, b) => a - b);
const MARK_S0 = 0.35;
const MARK_FULL_BY = 112;
const MARK_TICK = 6;
const MARK_GROW = (() => {
  const n = LANDINGS.filter((t) => t <= MARK_FULL_BY).length;
  return (1 - MARK_S0 * MARK_S0) / Math.max(1, n - 1);
})();
/** null before the first landing; otherwise { s, tone } for the mark. */
const markAt = (f: number) => {
  if (LANDINGS.length === 0 || f < LANDINGS[0]) return null;
  let a2 = MARK_S0 * MARK_S0;
  let tick = 0;
  for (let n = 1; n < LANDINGS.length; n++) {
    if (f < LANDINGS[n]) break;
    a2 += MARK_GROW * arriveEase(clamp01((f - LANDINGS[n]) / MARK_TICK));
  }
  for (const t of LANDINGS) {
    const u = (f - t) / MARK_TICK;
    if (u >= 0 && u < 1) tick += 0.055 * Math.sin(Math.PI * u) * (1 - u);
  }
  tick = Math.min(0.075, tick); // landings crowd at the end; one swallow's worth
  const rest = Math.min(1, Math.sqrt(a2));
  const birth = arriveEase(clamp01((f - LANDINGS[0]) / 5));
  return {
    s: rest * birth * (1 + tick) * breath(f, 0.31),
    tone: clamp01((rest - MARK_S0) / (1 - MARK_S0)),
  };
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
  // the last segment stops at the mark's top edge: the Claude mark's rays are
  // thin enough that an axis run under it shows through the gaps between them
  [Y_FUSE + RING_OUTER, Y_MODEL - MARK_BOX * 0.42],
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
  // The mark's own: the same 2/3 screen-px shape, its own opacity, and applied
  // on a group OUTSIDE the mark's scale, so the filter is never multiplied by
  // the em scale (MARK_BOX/24) or by the breath and growth on top of it.
  const markIcon = iconShadow(k, iconShadowY, iconShadowBlur, MARK_SHADOW_OPACITY);

  const live: Live[] = [];

  const mark = markAt(frame);
  const markEdge = Y_MODEL - (MARK_BOX / 2) * (mark ? mark.s : MARK_S0) * 0.88;

  // -- every data dot --------------------------------------------------------
  DOTS.forEach((d) => {
    const inField = d.seat !== null && frame < d.tJoin;
    if (!inField && frame < d.born) return;
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
    let rScale = 1;

    // IN THE FIELD. The dot sits at its seat in the spread, which is itself
    // contracting on the axis, and over its last `hand` frames it blends onto
    // the axis. The blend is a smoothstep, so the dot leaves the milling field
    // from rest and is at the fall's full 13.48 px/f on the frame it joins:
    // both ends are C1 and the handoff cannot be seen.
    if (inField) {
      const e = smoothstep(clamp01((frame - (d.tJoin - d.hand)) / d.hand));
      const s = seatAt(d, frame);
      x = s.x + (x - s.x) * e;
      y = s.y + (y - s.y) * e;
      shrink = 1;
      rScale = (d.seat as Seat).rf + (1 - (d.seat as Seat).rf) * e;
    }

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
      r: DOT_R * d.rs * rScale * (d.back ? BG_R_SCALE : 1) * breath(frame, hash(d.i, 9)) * shrink,
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
      // taken in at the mark's EDGE, not its centre
      y = yIn + (markEdge - yIn) * arriveEase(u);
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
                (3) the ring strokes, (4) the Lucide icons, (5) the CLAUDE mark.
                The stream therefore passes UNDER the gates: a dot crossing a
                ring goes behind the glyph and the icon is never broken by it,
                and the mark is drawn over the dots it swallows. */}
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

            {/* (5) THE MODEL — the CLAUDE mark, filled, on top of everything.
                Nothing is drawn until the first fused dot lands in it. */}
            {mark ? (
              <g style={{ filter: markIcon }} opacity={dotOpacity * OP_FG}>
                <g
                  transform={`translate(${AX} ${Y_MODEL}) scale(${(
                    (MARK_BOX * mark.s) /
                    24
                  ).toFixed(5)}) translate(-12 -12)`}
                  fill={toRipe(mark.tone)}
                  fillRule="evenodd"
                >
                  {CLAUDE.paths.map((p, i) => (
                    <path key={`m${i}`} d={p} />
                  ))}
                </g>
              </g>
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
  markScreen: Number((MARK_BOX * K_REST).toFixed(2)),
  seats: SEATS.length,
  fieldB: [Number(FIELD_B0.toFixed(2)), Number(FIELD_B1.toFixed(2))],
  joinAt: [0, 0.25, 0.5, 0.75, 1].map((u) =>
    Number(
      (
        FIELD_T0 +
        (FIELD_T1 - FIELD_T0) * Math.pow(u, FIELD_DRAIN_P)
      ).toFixed(1),
    ),
  ),
  nth: (() => {
    const t0 = DOTS.filter((d) => d.passFilter).map((d) => d.tFilter).sort((a, b) => a - b);
    const t1 = DOTS.filter((d) => d.passFilter && d.passJudge).map((d) => d.tJudge).sort((a, b) => a - b);
    const t2 = DOTS.filter((d) => d.passFilter && d.passJudge).map((d) => d.tLabel).sort((a, b) => a - b);
    const t3 = FUSED.map((f) => f.tMerge).sort((a, b) => a - b);
    return [t0, t1, t2, t3].map((a) => a.slice(0, 16).map((v) => Number(v.toFixed(1))));
  })(),
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
  markGrow: Number(MARK_GROW.toFixed(4)),
  markAt: [96, 100, 110, 118, 126, 136].map((f) => {
    const m = markAt(f);
    return m ? [f, Number(m.s.toFixed(3)), Number(m.tone.toFixed(2))] : [f, 0, 0];
  }),
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
