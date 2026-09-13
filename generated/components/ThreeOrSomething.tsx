import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
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
  WOBBLE_R,
  breath,
  camMove,
  clamp,
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
// The shared line values of this set: the stroke every line is drawn at, the
// duration a dot takes to ramp deep -> ripe, and the speed a head-led line
// travels at. Imported, never restated.
import { LINE_SPEED, STROKE, TONE_DUR } from "./ImpossibleTasks";
import {
  DEPTH_BANDS,
  EASE_ARRIVE,
  ExperimentsSchema,
  HIGHLIGHT,
  HIGHLIGHT_FRAMES,
  LEGATO,
  Streak,
  Trail,
  WAVE_FRONT_WIDTH,
  depthBand,
  depthK,
  ease,
  softFront,
} from "./levelUp";

export const FPS = 24;
// Dwarkesh clip `Ajeya_The_Investigation`. Ajeya Cotra on investigating the
// OpenAI / Hugging Face sandbox attack:
//
//   "you know, we knew there were multiple models involved, but we thought, you
//    know, maybe there were like three or something. And immediately it was
//    clear that it was so much larger than that,"
//
// SRT span 0:18.160 -> 0:26.359 at 24fps.
// DURATION = round((26.359 - 18.160) * 24) = round(8.199 * 24) = round(196.776)
// = 197 frames of speech, plus a 48 frame tail so the resolved state holds and
// the editor can cut out of it wherever it wants = 245.
export const DURATION = 245;

// ---------------------------------------------------------------------------
// "Three or something". CUT 1 of four, and the cut that DEFINES this world:
// cut 2 imports the seat field, the ring, the wave and the resolved camera from
// here, so everything the next cut needs is a module-scope export and nothing
// it needs is a local const.
//
// Orange Dwarkesh style: opaque grid cutaway, 1080x1920, 24fps, two tones of
// one warm yellow with the dots fully opaque, ink on the OP_* ladder, per-icon
// shadows, `runCamera` over authored `camMove` keys, one gesture per word.
//
// THE WORLD. The investigators' view of the incident, and nothing else: no
// sandbox box, no OpenAI mark, no humans. 27,069 agents on the grid over world
// x [-1150, 1150] with feathered sides and y [-2450, 2710] — what cut 2's
// widest camera will see, plus bleed — and at f0 every one is UNLOOKED-AT: the
// deep tone at OP_DARK. Three are known. A ring is drawn round those three. The
// light goes out from the ring and does not stop.
//
// Every gesture is one word. Nothing else happens.
//   M0: open at k 2.20 on the ring's centre (the
//     content centre for the whole cut is RING_CY, so
//     the ring sits at screen y 835 under the captions
//     at every k). 484 screen px of ring to come, a
//     dark field around it, three ripe dots inside   — f0
//   WE KNEW ... MULTIPLE MODELS: the three known seats
//     go deep@OP_DARK -> ripe@1.0 over TONE_DUR, one
//     per word, on "we" f7, "multiple" f15 and
//     "models" f22. Nothing else in the field is lit
//                          — "we knew ... multiple models"          f7-32
//   INVOLVED: two threads draw between the three,
//     A->B at f31 and B->C at f36, head-led at
//     THREAD_SPEED with a white tip and a `Trail`,
//     hold, then fade out over 8 frames from f52
//                          — "involved"                             f31-60
//   YOU KNOW, MAYBE ... THREE: the RING draws head-led
//     round the three from 12 o'clock, TWO heads at ONE
//     speed — one clockwise, one counter-clockwise —
//     meeting at 6 o'clock, 17 frames from f53, closing
//     on "three" f70 with the 4-frame ink click on the
//     join (the click's decay is the cut's EASE_ARRIVE).
//     Both heads carry a `Streak`. Each covers half the
//     circumference, 20.33 world px/frame, 44.7 screen
//     px/frame at k 2.20 — under the set's 45 cap
//                          — "you know, maybe ... three"            f53-78
//   OR SOMETHING: the held breath. CAMERA M1 creeps
//     k 2.20 -> 2.32 (warp 1.0, an even creep) and
//     then stops dead: |dk| is 0.00067 at f98 and
//     0.00001 by f104, 0.03% of k a frame, so f98-104
//     is a still camera on a still frame. The three
//     dots keep their `breath`; nothing else moves
//                          — "or something"                         f77-104
//   AND IMMEDIATELY: the WAVE releases at f104 from
//     the ring and does not stop until the frame is
//     gone. As the front crosses a seat the seat goes
//     OP_DARK -> 1.0 and deep -> ripe on `softFront`
//     over three rows, passing through `highlightTone`
//     for two frames on the way (the cut's ONE
//     highlight, spread over 27,069 seats), and idle
//     thread traffic starts among the lit. CAMERA M2
//     releases four frames after the wave and pulls
//     back k 2.32 -> 1.40, landed at "clear"
//                          — "and immediately"                      f104-126
//   IT WAS CLEAR THAT IT WAS: hold at k 1.40. The wave
//     keeps spreading and the traffic keeps thickening
//     behind it — the crowd is alive wherever it has
//     been read and dead where it has not
//                          — "clear that it was"                    f126-146
//   SO MUCH LARGER THAN THAT: CAMERA M3, the big
//     pull-back k 1.40 -> K_FINAL 0.95, landed at
//     "than" f181. The front reaches the frame's far
//     corners at f196.6 — the last of the light leaves
//     the frame just after "that" — and the ring is a
//     209 px speck at the centre of an endless lit
//     field. (v3: the very last seat with a pixel in
//     frame, out in a bottom corner of the 0.97 depth
//     band at 1328.7 world px, is reached at f206, is
//     half lit at f211 and settles at f220, against
//     f204.5 / f209 / f213.4 on v2's longer front —
//     the front is slowing down to stop at 1375 rather
//     than running on to 1450)
//                          — "so much larger than that"             f146-200
//   TAIL: hold at k 0.95. The front finishes off-frame
//     (v3: it stops dead at 1375 by f230, off-frame),
//     the traffic keeps the field alive, `sway` only.
//     It never fades out — the editor controls the out
//                          — tail                                   f197-245
//
// CAMERA. Four keys on one damped track, cx = RING_CX throughout (everything in
// this cut is on the ring's own axis, so a pan would be motion with nothing to
// look at) and the content centre is RING_CY at every k.
//
// EVERY LANDING IS SOLVED AGAINST THE DAMPER, NOT ASSERTED. The brief named the
// windows f77-98, f108-126 and f146-182 and the landings f98, f126 and f181;
// `runCamera` lags its target by ~6 frames, so those pairs are not
// simultaneously satisfiable and — exactly as `UnderHeel.tsx` does it — the
// SHAPE, the easing and the LANDINGS are kept and the key windows are solved
// backwards from them (`$S/tos/cam.ts`):
//   M1 keys f77-88  warp 1.0   on screen f78-100, landed f98  ("or something")
//      0.72% of the creep left at f98, drifting 0.55% of it a frame
//   M2 keys f108-115 warp 0.7  on screen f109-131, landed f126 ("clear")
//      0.55% left, 0.50%/frame. Released 4 frames after the wave
//   M3 keys f146-168 warp 0.72 on screen f147-182, landed f181 ("than")
//      0.04% left, 0.014%/frame
// Each move is one deceleration lobe and one settle lobe: dk peaks at f86
// (M1), f114 (M2) and f158 (M3) and decays monotonically either side, the
// longest stretch of flat speed inside a move is 4 frames and there is no
// stall. The damper's own overshoot is 0.1% of k, on M2 only.
//
// M2 rides the front: the front is 60 world px at f108 against a half-frame of
// 233, and 379 against 384 at f126, so it is inside the frame edge the whole
// way through the move and starts leaving it on the hold, which is the gesture.
//
// PAYOFF. EASE_PAYOFF is NOT USED in this cut. The brief gives the overshoot
// budget to no landing on purpose — the ring's click on "three" uses
// EASE_ARRIVE — so the piece contains no overshoot at all. Deliberately unused.
//
// ambient: idle thread traffic between LIT seats only (so the field is dead
// until f105 and alive behind the front after it), `breath` on every dot, `sway`
// on the camera, the grid's own drift. Not gestures; that is what this field is.
//
// ---------------------------------------------------------------------------
// FIVE THINGS ARE DERIVED RATHER THAN HAND-SET, and each is noted where it is
// computed.
//
//   * WAVE_WARP. The front has to be 0 at f104, pass 1200 at f187 and settle on
//     WAVE_R_CORE 1450 by f245 with no kink anywhere. That is one warped
//     smoothstep on the radius, r(f) = 1450 * smoothstep(u ^ WAVE_WARP) with
//     u the fraction of f104-245, and WAVE_WARP is SOLVED by bisection so that
//     r(187) = 1200 exactly: 0.578713. The curve has zero slope at both ends and
//     is C1 everywhere in between by construction — it is one analytic
//     expression, not two pieces joined — so there is nothing to match up.
//     Measured px/frame: 0 at f104, 13.6, 16.2, 17.3, 17.6 over f105-108, a peak
//     of 18.45 at f114, then a monotone decay — 14.9 at f146, 8.75 at f187, 6.8
//     at f200, 0.22 at f244. On screen that peak is 35.2 px/frame (k 1.91 at
//     f114) and it never exceeds it. The acceleration from rest is therefore
//     real but SHORT: the first frame of it covers 13.6 px. It cannot be
//     gentler and still pass 1200 at f187, which needs a mean of 14.5 px/frame
//     over the whole of f104-187 while ending slow enough to decelerate into
//     1450 — a longer ramp-in was solved for (velocity as a smoothstep pair,
//     0 -> 20.6 px/frame over 32 frames) and it puts the front at r 140 at f126
//     instead of 391, which leaves "and immediately" with nothing on screen.
//   * WAVE_BLEND_P (v3). The front now STOPS at WAVE_R_END 1375 rather than
//     running on to the core amplitude. The core curve is followed exactly to
//     f200 and from there the radius is
//         r(t) = r(200) + D * (1 - (1 - t)^p),  t = (f - 200) / 30
//     which is flat at t = 1 for any p > 1, so the only thing that has to be
//     solved is that it LEAVES the core at the core's own speed: p is the core's
//     analytic slope at f200 times the span over D, which comes out at 2.680.
//     Velocity is continuous through the join by construction (6.780 px/frame
//     either side of f200) and the curve is monotone; the acceleration steps
//     from -0.151 to -0.367 px/frame^2 there, which at k 0.95 is a fifth of a
//     screen px per frame squared, out at the frame's corners. Measured
//     px/frame: 6.78 at f200, 5.10 at f205, 3.54 at f210, 2.21 at f215, 1.15 at
//     f220, 0.39 at f225, 0.008 at f230, 0 after. `$S/tos/v3b.ts`.
//   * THE FRONT LEAVES THE RING'S CENTRE, NOT ITS RIM. `waveFront` is 0 until
//     f104, as the brief defines it, so the first thing the wave does is cross
//     the ~100 seats INSIDE the ring: they light over f104-111 and the front
//     crosses the ring's own rim at f110.5. Starting the radius at RING_R
//     instead would light those hundred seats in one frame, which is a pop in
//     the middle of the frame on the release. This way the light comes out of
//     what was looked at and then goes past it, which is the sentence.
//   * THREAD_SPEED. The two "involved" threads are drawn at k 2.20, and cut 1's
//     shared LINE_SPEED (28 world px/frame) is 61.6 screen px/frame there —
//     over this set's close-up cap of 45. So the speed is the cap divided by the
//     zoom it is seen at, floored by nothing and capped by LINE_SPEED: 20.45
//     world px/frame, exactly 45 screen px/frame at k 2.20. The A->B flight is
//     4.0 frames and B->C is 3.6.
//   * RING_SPEED. v1 drew the ring with ONE head over 11 frames: 691 world px
//     of circumference at 62.8 world px/frame, 138 screen px/frame at k 2.20,
//     three times the set's cap and the one number in the piece outside its
//     rules. v2 splits the draw in two — a head each way from 12 o'clock,
//     meeting at 6 o'clock — which halves the distance each has to cover, and
//     opens the span from 11 frames to 17 by starting on "you know" (f53)
//     instead of "maybe" (f59), which halves it again. 345.6 world px over 17
//     frames is 20.33 world px/frame and 44.72 screen px/frame at k 2.20, under
//     the 45 cap. At the brief's f55 (15 frames) it is 50.68, still over, which
//     is why the span is the 17 the brief's fallback allows. The draw is still
//     LINEAR — the slowest possible peak for a fixed span; easing it would put
//     3x the mean speed into the first frames — and both heads carry a `Streak`.
//     The two arcs are one closed circle under a three-value dash pattern
//     ([s, C-2s, s]), so there is no seam at 12 o'clock and no doubled cap, and
//     at full draw the pattern is dropped for the plain circle v1 ended on.
//   * THE SEATS ARE NOT 27,069 CIRCLES. The field is bucketed by lit amount
//     into 32 steps per depth band and emitted as one <path> of circle arcs per
//     bucket, plus one more for the seats inside their two highlight frames.
//     Only the seats the camera can actually see are built (the grid is indexed
//     by row and column, so the cull is two integer ranges, not a scan), which
//     is at most ~6,400 of them at k 0.95. The per-frame DOM lands at ~1,200
//     nodes with the traffic on top of it, against 27,069 circles for the naive
//     version.
//
// MEASURED, at the camera each thing is actually seen at (`$S/tos/measure.ts`
// and `$S/tos/idle.ts`) — the set's close-up cap is 45 screen px/frame:
//   wave front   41.4 px/frame peak, at f109 (17.93 world px at k 2.307)
//   thread head  45.0 px/frame, at k 2.20 — the cap, by construction
//   idle head    46.9 px/frame worst single frame (p99 22.0, median 0), which
//                is the set's own idle mechanism unchanged: the same code at
//                the same reach runs at 85 px/frame in `ImpossibleTasks`
//   ring head    44.7 px/frame, at k 2.20 — each of the two heads, under the
//                cap (v1 drew it with one head at 138.2; see RING_SPEED)
//   camera       f98 |dk| 6.7e-4, f104 9.4e-6 — the held breath is still
//
// EXPERIMENTS IN THIS PIECE (all on by default, each behind `experiments`):
//   EASE_ARRIVE  the three known agents' tone ramps, the ring's click decay,
//                and the idle traffic's own head-led draw. EASE_MOVE is the
//                camera's, through `camMove`'s warped smoothstep. EASE_PAYOFF
//                is UNUSED — the brief spends the overshoot budget on nothing
//   legato       the second "involved" thread leaves when the first ARRIVES
//                (f36) instead of waiting a LEGATO beat for it to settle
//                (f41); with `legato: false` it waits. Every other gesture in
//                this cut starts on a word, so there is nothing else to overlap
//   trails       `Trail` on both thread heads and on every idle head; `Streak`
//                on both ring heads, sub-sampled onto their own arc
//                (RING_STREAK)
//   softFront    the wave crosses each seat over three rows, so the front is a
//                ramp and never a row edge; off, it is a hard edge
//   highlight    `highlightTone` for two frames as a seat's lit amount crosses
//                0.5 — spread across 27,069 seats, and the only use in the cut
//   depth        three bands at 0.97 / 1.00 / 1.03. Measured on M3: a seat at
//                world (400,500) has its three band copies 48.2 screen px apart
//                at f146 and 31.0 at f181, the near band moving up to 1.04
//                px/frame more than the far one (`$S/tos/depth.ts`)
//
// DEVIATIONS FROM THE BRIEF, all deliberate and all listed in the DONE note:
// the three known agents are NOT ripe at f0 (the brief's own gesture 1 lights
// them on "we", "multiple" and "models", and a word beats a check); the first
// highlights are at the ring's CENTRE at f105 rather than at its rim at f104
// (see THE FRONT LEAVES THE RING'S CENTRE above); the idle traffic is capped at
// 300 slots instead of the nominal 3,902; and the ring starts at f53 rather
// than the revision's f55, which that revision's own fallback allows because
// f55 leaves the head at 50.7 screen px/frame.
//
// v2, two directorial fixes and nothing else: the wobble's amplitude now rides
// the front's radius (the young front was a splat), and the ring is drawn with
// two heads from f53 (one head at 138 screen px/frame was over the cap). The
// end state is untouched by both — f244 is pixel-identical to v1.
//
// v3, the director's geometry pass, so that cut 2's box can sit ON the light's
// edge instead of inside it. Three changes, and f244 is byte-identical again
// (SHA-256 d13a801b…, difference blend YMAX 0):
//   1. THE FRONT STOPS EARLIER. WAVE_R_END 1450 -> 1375, with the core curve
//      followed EXACTLY to f200 — so the release, the peak speed, r(187) = 1200
//      and the frame the corners are crossed at (f196.6) are all the approved
//      ones — and a solved deceleration from there to a stop at 1375 by f230.
//      The brief asked for 1250. 1250 is not available: the bottom corners of
//      cut 1's own last frame sit 1328.7 world px from the ring (CAM_LIFT puts
//      the ring 132 px above the frame's centre, and the 0.97 depth band widens
//      the frame again), so a front of 1250 leaves 185 seat-draws short of the
//      fully-lit bucket at f244 and cut 1 ends on a visibly unfinished wave.
//      1374.25 is the floor; 1375 is the value. Measured, `$S/tos/v3a.ts`.
//   2. THE FIELD'S SIDES ARE FEATHERED and 70 rows are appended at the bottom —
//      see THE FIELD. Cut 2's widest camera is now k 0.42 and both of those
//      edges are in its frame; neither is anywhere near cut 1's.
//   3. Nothing else. Every beat, gesture, camera key and speed is v2's.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
  accentDeep: z.string(), // deep: an unlooked-at dot
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotOpacity: z.number(), // the dot body's own opacity; the ladder is colour
  idleThreadCount: z.number(),
  experiments: ExperimentsSchema,
  beats: z.object({
    we: z.number(), // "we"              — the first known agent lights
    knew: z.number(), // "knew"
    multiple: z.number(), // "multiple"  — the second lights
    models: z.number(), // "models"      — the third lights
    involved: z.number(), // "involved"  — the first thread leaves
    but: z.number(), // "but"
    thought: z.number(), // "thought"
    maybe: z.number(), // "maybe"        — the ring is already half drawn
    three: z.number(), // "three"        — the ring closes, and clicks. The two
    // ring heads leave RING_DUR frames before this word, on "you know" f53:
    // the CLOSING word is the anchor, so the draw follows the beat backwards
    or: z.number(), // "or"              — the camera creeps
    something: z.number(), // "something"
    and: z.number(), // "and"
    immediately: z.number(), // "immediately" — the wave releases
    clear: z.number(), // "clear"        — M2 has landed
    that: z.number(), // "that (it was)"
    so: z.number(), // "so"
    much: z.number(), // "much"
    larger: z.number(), // "larger"
    than: z.number(), // "than"          — M3 has landed
    that2: z.number(), // "that"         — the light is leaving the frame
    end: z.number(), // speech ends; tail to 245
  }),
});

export type Props = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// THE FIELD. The house step, jitter and radius spread, over the rectangle cut
// 2's widest camera will see plus bleed.
//
// v3: THE SIDES ARE FEATHERED and the field is TALLER. Cut 2 now pulls back
// until the box round the light is in frame, which is wider than cut 1's
// hardest zoom by a factor of two, so two of this field's four edges are in
// frame in that cut and a population never ends on a ruled line. The two that
// are in frame are dealt with differently, and for a reason:
//
//   * THE SIDES are FEATHERED, because they cannot be moved. A seat's index is
//     `gr * COLS + gc`, so adding a column renumbers every seat in the field,
//     and the whole point of this revision is that cut 1's own frames — f244
//     above all — do not move by a pixel. So the sides stay where they are and
//     dissolve instead: density falls off over FIELD_FEATHER_COLS columns to a
//     nominal edge at FIELD_EDGE_X, the edge itself undulates along y, and the
//     dots that survive out there are smaller. The falloff starts at |x| ~ 675,
//     and cut 1's widest camera sees to |x| 589, so NO seat cut 1 can ever see
//     is touched by it.
//   * THE BOTTOM is EXTENDED, because it can be: rows are appended at the END
//     of the grid, which leaves every existing index alone. GRID_Y0 is still
//     computed from the original ROWS_BASE, so the seats themselves do not
//     move; there are simply 70 more rows of them below, out to y 2708, which
//     is past the bottom of cut 2's widest frame (~2450). A feather would have
//     worked too, but it would have put a dissolving crowd edge across the
//     caption band; nothing at all is better.
//
// Every crowd boundary that IS seen in either cut is therefore soft: the wave's
// own front (`softFront` over three rows, wobbled by angle, so the lit region is
// a blob and never a disc) and these sides.
// ---------------------------------------------------------------------------
export const STEP_X = 940 / 39;
export const STEP_Y = 440 / 29;
export const FIELD_X0 = -1150;
export const FIELD_X1 = 1150;
export const FIELD_Y0 = -2450;
export const FIELD_Y1 = 1650; // the base rectangle's bottom; see FIELD_Y1_FULL
export const COLS = Math.round((FIELD_X1 - FIELD_X0) / STEP_X) + 1; // 96
export const ROWS_BASE = Math.round((FIELD_Y1 - FIELD_Y0) / STEP_Y) + 1; // 271
export const ROWS_EXTRA = 70; // v3: appended BELOW, so no existing index moves
export const ROWS = ROWS_BASE + ROWS_EXTRA; // 341
export const GRID_X0 = (FIELD_X0 + FIELD_X1) / 2 - ((COLS - 1) * STEP_X) / 2;
// ...from ROWS_BASE, not ROWS: the extra rows are added at the bottom and the
// field's origin may not move, or every seat in it moves with it.
export const GRID_Y0 = (FIELD_Y0 + FIELD_Y1) / 2 - ((ROWS_BASE - 1) * STEP_Y) / 2;
export const FIELD_Y1_FULL = GRID_Y0 + (ROWS - 1) * STEP_Y; // 2708.3

// The feathered side edge. `FIELD_EDGE(y)` is the nominal boundary at a world y
// — undulating, with its own seed — and the density falls off toward it over
// FIELD_FEATHER_COLS columns, exactly as `fieldShared` documents a crowd edge.
// The undulation is stretched by FIELD_WOB_SCALE so its period is ~500 world px
// rather than `wobble`'s own 126: over 4,000 px of height the raw period is a
// ripple, not an edge that wanders.
export const FIELD_EDGE_X = 1100; // nominal side edge
export const FIELD_FEATHER_COLS = 12; // the house's 12
export const FIELD_WOB = 35; // world px either way
export const FIELD_WOB_SEED = 2.9;
export const FIELD_WOB_SCALE = 0.25;
const FIELD_WOB_NORM = 1.2 + 0.7; // `wobble`'s own amplitude, so FIELD_WOB is exact

/** The nominal side edge at a world y. Positive; the field is symmetric. */
export const FIELD_EDGE = (y: number) =>
  FIELD_EDGE_X + (FIELD_WOB / FIELD_WOB_NORM) * wobble(y * FIELD_WOB_SCALE, FIELD_WOB_SEED);

/** 1 deep inside the field, 0 outside the side edge: a seat's chance of
 *  existing out there, and the scale on its radius. */
export const fieldFeather = (x: number, y: number) =>
  feather((FIELD_EDGE(y) - Math.abs(x)) / STEP_X, FIELD_FEATHER_COLS);

export type Seat = { x: number; y: number; r: number; rs: number; gc: number; gr: number };
export const SEAT_ALIVE = new Uint8Array(COLS * ROWS);
export const SEATS: Seat[] = (() => {
  const out: Seat[] = new Array(COLS * ROWS);
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc;
      const x = GRID_X0 + gc * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9;
      const y = GRID_Y0 + gr * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9;
      const ff = fieldFeather(x, y);
      // `ff` is exactly 1 for every seat inside the falloff, so `rs` is exactly
      // 1 and `r` is bit-for-bit the radius it was before this revision.
      const rs = ff >= 1 ? 1 : 0.6 + 0.4 * ff;
      SEAT_ALIVE[i] = hash(i, 71) < ff ? 1 : 0;
      out[i] = {
        x,
        y,
        r: (0.75 + 0.5 * hash(i, 13)) * rs,
        rs,
        gc,
        gr,
      };
    }
  }
  return out;
})();
export const NSEAT = SEATS.length;

// grid cell -> seat, and -1 where the side feather has taken one away. Cut 2's
// traffic reads neighbours through it exactly as the rest of the set does, and
// a thread to a seat that is not there simply does not draw.
export const SEAT_AT = new Int32Array(COLS * ROWS).fill(-1);
SEATS.forEach((s, i) => {
  if (SEAT_ALIVE[i]) SEAT_AT[s.gr * COLS + s.gc] = i;
});

// The hot per-frame values, as typed arrays: a field this size is read 6,400
// times a frame and an array of objects is not the shape for that.
const SEAT_X = new Float32Array(NSEAT);
const SEAT_Y = new Float32Array(NSEAT);
const SEAT_R = new Float32Array(NSEAT);
for (let i = 0; i < NSEAT; i++) {
  SEAT_X[i] = SEATS[i].x;
  SEAT_Y[i] = SEATS[i].y;
  SEAT_R[i] = SEATS[i].r;
}

// ---------------------------------------------------------------------------
// THE RING. What was looked at: solid, stroke 3.5, ink at OP_READ, with the
// per-icon shadow. It is the content centre of the whole cut.
// ---------------------------------------------------------------------------
export const RING_CX = 0;
export const RING_CY = 0;
export const RING_R = 110;
export const RING_STROKE = 3.5;
export const RING_C = 2 * Math.PI * RING_R;

// The three KNOWN agents: the real seats nearest these three points, so they
// are agents in the crowd and not three dots drawn on top of it.
export const KNOWN_AT = [
  { x: -38, y: -14 },
  { x: 44, y: -22 },
  { x: 6, y: 40 },
];
export const KNOWN: number[] = KNOWN_AT.map((w) => {
  // the nearest seat, found through the grid rather than by scanning 32,736
  const gc = Math.max(0, Math.min(COLS - 1, Math.round((w.x - GRID_X0) / STEP_X)));
  const gr = Math.max(0, Math.min(ROWS - 1, Math.round((w.y - GRID_Y0) / STEP_Y)));
  let best = gr * COLS + gc;
  let bestD = Infinity;
  for (let r = gr - 2; r <= gr + 2; r++) {
    for (let c = gc - 2; c <= gc + 2; c++) {
      if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
      const i = r * COLS + c;
      const d = Math.hypot(SEAT_X[i] - w.x, SEAT_Y[i] - w.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  }
  return best;
});
// ...and they have to be inside the ring, at every zoom, or the ring is not
// round them. Asserted rather than assumed.
KNOWN.forEach((i) => {
  const d = Math.hypot(SEAT_X[i] - RING_CX, SEAT_Y[i] - RING_CY);
  if (d > RING_R - DOT_RADIUS * 1.25 * 1.05 - RING_STROKE) {
    throw new Error(`ThreeOrSomething: known seat ${i} is not inside the ring (${d.toFixed(1)})`);
  }
});

// ---------------------------------------------------------------------------
// THE WAVE. A C1 curve on the radius: zero slope at f104, zero slope where it
// stops, r(187) = 1200 solved for by bisection on the warp. v3 puts the stop at
// WAVE_R_END 1375 and f230 instead of WAVE_R_CORE 1450 and f245, by following
// the core curve exactly to f200 and decelerating out of it at its own speed
// (WAVE_BLEND_P). See the header for the per-frame speeds, for why the ramp-in
// is as short as it is, and for why 1375 rather than the brief's 1250.
//
// The nominal front is wobbled by ANGLE, with `wobble`'s two harmonics made
// whole around the loop by WOBBLE_R — so the lit region is a blob with no seam
// at theta = pi, and never a disc.
//
// v2: THE WOBBLE'S AMPLITUDE IS PROPORTIONAL TO THE FRONT'S RADIUS, capped —
// amp(r) = min(WAVE_WOB, WAVE_WOB_SLOPE * r). A flat +-60 px is 20% of a 300 px
// radius, which made the young front six deep lobes (a splat) rather than light
// spreading; the same 60 px on the 1375 px final blob is 4.4%, which is the
// irregular edge the brief wants. The cap is reached at r = 750 (WAVE_WOB_RFULL)
// and the front is past that from f151 on, so `waveWobble` itself is untouched
// and only the young front changes. (v3 moves `LIT_EDGE` inward with the front:
// the blob's edge is WAVE_R_END 1375 + the same wobble.)
// ---------------------------------------------------------------------------
export const WAVE_F0 = 104; // "immediately"
export const WAVE_F1 = 245; // the CORE curve's own settle frame
export const WAVE_R_CORE = 1450; // ...and its amplitude: the shape, unchanged
export const WAVE_R_END = 1375; // v3: where the front actually stops
export const WAVE_F_BLEND = 200; // the core curve is followed exactly to here
export const WAVE_F_STOP = 230; // ...and the front is stopped by here
export const WAVE_R_MID = 1200; // ...passing this at f187, "that"
export const WAVE_F_MID = 187;
export const WAVE_WOB = 60; // world px of blob, either way, once the front is big
export const WAVE_WOB_SLOPE = 0.08; // ...and 8% of the radius until then
export const WAVE_WOB_RFULL = WAVE_WOB / WAVE_WOB_SLOPE; // 750: the cap bites here
export const WAVE_SEED = 5.7;
const WOB_NORM = 1.2 + 0.7; // `wobble`'s own amplitude, so WAVE_WOB is exact

const rawFront = (f: number, warp: number) =>
  f <= WAVE_F0
    ? 0
    : WAVE_R_CORE * smoothstep(Math.pow(clamp01((f - WAVE_F0) / (WAVE_F1 - WAVE_F0)), warp));

export const WAVE_WARP = (() => {
  let lo = 0.1;
  let hi = 3;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (rawFront(WAVE_F_MID, m) < WAVE_R_MID) hi = m;
    else lo = m;
  }
  return (lo + hi) / 2;
})();

const coreFront = (f: number) => rawFront(f, WAVE_WARP);
/** The core curve's own speed, analytically — the blend below has to leave the
 *  core at exactly this slope or there is a kink in the middle of the tail. */
const coreSpeed = (f: number) => {
  const span = WAVE_F1 - WAVE_F0;
  const u = clamp01((f - WAVE_F0) / span);
  if (u <= 0 || u >= 1) return 0;
  const g = Math.pow(u, WAVE_WARP);
  return (WAVE_R_CORE * (6 * g * (1 - g)) * WAVE_WARP * Math.pow(u, WAVE_WARP - 1)) / span;
};

// v3: the front stops at WAVE_R_END rather than running on to WAVE_R_CORE. The
// core curve is followed EXACTLY to WAVE_F_BLEND — so r(187) = 1200, the peak
// speed, the release on "and immediately" and the frame the corners are crossed
// at are all the approved ones — and from there the front decelerates to a stop
// at WAVE_R_END by WAVE_F_STOP on
//     r(t) = rB + D * (1 - (1 - t)^p),  t = (f - FB) / (FE - FB)
// whose slope at t = 0 is p*D/(FE-FB) and at t = 1 is 0, so p is not free: it is
// SOLVED so the blend leaves the core at the core's own speed. p > 1 is what
// makes it a deceleration rather than a jump, and it is asserted.
const BLEND_R0 = coreFront(WAVE_F_BLEND);
const BLEND_D = WAVE_R_END - BLEND_R0;
const BLEND_T = WAVE_F_STOP - WAVE_F_BLEND;
export const WAVE_BLEND_P = (coreSpeed(WAVE_F_BLEND) * BLEND_T) / BLEND_D;
if (!(WAVE_BLEND_P > 1)) {
  throw new Error(`ThreeOrSomething: the wave's tail is not a deceleration (p ${WAVE_BLEND_P})`);
}

/** The front's radius in world px, defined for every frame. */
export const waveFront = (f: number) => {
  if (f <= WAVE_F_BLEND) return coreFront(f);
  if (f >= WAVE_F_STOP) return WAVE_R_END;
  const t = (f - WAVE_F_BLEND) / BLEND_T;
  return BLEND_R0 + BLEND_D * (1 - Math.pow(1 - t, WAVE_BLEND_P));
};

/** The inverse, for solving the frame a given radius is reached at. */
export const waveInv = (r: number) => {
  if (r <= 0) return WAVE_F0;
  if (r >= WAVE_R_END) return Infinity;
  if (r > BLEND_R0) {
    const t = 1 - Math.pow(1 - (r - BLEND_R0) / BLEND_D, 1 / WAVE_BLEND_P);
    return WAVE_F_BLEND + t * BLEND_T;
  }
  const y = clamp01(r / WAVE_R_CORE);
  const x = 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3); // smoothstep, inverted
  return WAVE_F0 + Math.pow(x, 1 / WAVE_WARP) * (WAVE_F1 - WAVE_F0);
};

/** The blob's offset from the nominal front at an angle, in world px, at FULL
 *  amplitude — i.e. the offset of the finished blob. Unchanged from v1. */
export const waveWobble = (angle: number) =>
  (WAVE_WOB / WOB_NORM) * wobble(angle * WOBBLE_R, WAVE_SEED);

/** The wobble's amplitude at a front radius: 8% of it, capped at WAVE_WOB. */
export const waveWobAmp = (r: number) => Math.min(WAVE_WOB, WAVE_WOB_SLOPE * Math.max(0, r));

/** The blob's offset at an angle when the front is at radius r. */
export const waveWobbleAt = (angle: number, r: number) =>
  (waveWobAmp(r) / WAVE_WOB) * waveWobble(angle);

/** The final lit blob's edge at an angle — cut 2's starting boundary. */
export const LIT_EDGE = (angle: number) => WAVE_R_END + waveWobble(angle);

// Each seat's raw distance to the ring's centre and its own full-amplitude
// wobble, kept apart now that the amplitude depends on the frame. A seat's
// EFFECTIVE distance at a front radius r is SEAT_D[i] - wobScale(r) * SEAT_WOB[i]
// with wobScale = waveWobAmp(r) / WAVE_WOB in 0..1 — which is 0 while the front
// is 0, so no seat can sit at a negative distance and light at f0, and 1 from
// r = 750 on, which is v1's own wobble for the whole of the finished blob.
const SEAT_D = new Float32Array(NSEAT);
const SEAT_WOB = new Float32Array(NSEAT);
const SEAT_CROSS = new Float32Array(NSEAT);

/** The front radius at which a seat's lit amount crosses 0.5: solving
 *  r + waveWobAmp(r) * u = dist + width/2 for r, with u the seat's wobble as a
 *  fraction of WAVE_WOB. The left side is strictly increasing in r (the slope
 *  is at worst 1 - WAVE_WOB_SLOPE = 0.92), so it has one root, either side of
 *  the radius the cap bites at. */
const crossRadius = (dist: number, wob: number) => {
  const target = dist + WAVE_FRONT_WIDTH / 2;
  const u = wob / WAVE_WOB;
  return target <= WAVE_WOB_RFULL + WAVE_WOB * u
    ? target / (1 + WAVE_WOB_SLOPE * u)
    : target - WAVE_WOB * u;
};

for (let i = 0; i < NSEAT; i++) {
  const dx = SEAT_X[i] - RING_CX;
  const dy = SEAT_Y[i] - RING_CY;
  SEAT_D[i] = Math.hypot(dx, dy);
  SEAT_WOB[i] = waveWobble(Math.atan2(dy, dx));
  SEAT_CROSS[i] = Math.ceil(waveInv(crossRadius(SEAT_D[i], SEAT_WOB[i])));
}

/** A seat's distance from the front, wobbled by the front's own size. */
export const seatFrontDist = (i: number, r: number) =>
  SEAT_D[i] - (waveWobAmp(r) / WAVE_WOB) * SEAT_WOB[i];

/** How lit a seat is at a frame: 0 unlooked-at, 1 read. */
export const litAmount = (i: number, frame: number) => {
  const r = waveFront(frame);
  return softFront(seatFrontDist(i, r), r, WAVE_FRONT_WIDTH);
};

/** A seat's opacity on the ink-free ladder: OP_DARK unlooked-at, 1.0 read. */
export const seatOpacity = (lit: number) => OP_DARK + (1 - OP_DARK) * lit;

/** The field's tone ramp at the shared palette, for the next cut. */
export const TONE = makeTone(ACCENT_DEEP, ACCENT);

// Depth bands: three parallax groups, so a camera move separates near dots from
// far ones by a hair. The three known seats are forced into the middle band,
// because the ring is drawn there and they have to stay inside it at every k.
const bandIndex = (v: number) => DEPTH_BANDS.findIndex((b) => b === v);
const MID_BAND = bandIndex(1);
export const SEAT_BAND = new Uint8Array(NSEAT);
for (let i = 0; i < NSEAT; i++) {
  SEAT_BAND[i] = bandIndex(depthBand(i));
}
KNOWN.forEach((i) => {
  SEAT_BAND[i] = MID_BAND;
});

// ---------------------------------------------------------------------------
// THE CAMERA. Four keys on one damped track; cx is RING_CX and the content
// centre is RING_CY throughout, so `camMove` is only ever moving k and the
// framing it drags with it. See the header for the measured landings.
// ---------------------------------------------------------------------------
export const K_OPEN = 2.2;
export const K_BREATH = 2.32; // the creep on "or something"
export const K_WIDE = 1.4; // the release on "and immediately"
export const K_FINAL = 0.95;
export const CONTENT_FINAL = RING_CY;

export type CamSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
export const CAM_SEGS: CamSeg[] = [
  { f0: 77, f1: 88, k0: K_OPEN, k1: K_BREATH, warp: 1.0 }, // M1 "or something"
  { f0: 108, f1: 115, k0: K_BREATH, k1: K_WIDE, warp: 0.7 }, // M2 "and immediately"
  { f0: 146, f1: 168, k0: K_WIDE, k1: K_FINAL, warp: 0.72 }, // M3 "so much larger"
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
      throw new Error(`ThreeOrSomething: the camera's moves overlap at f${F[i]}`);
    }
  }
  return { F, K, CY };
})();

// ---------------------------------------------------------------------------
// THE TWO THREADS on "involved", and the ring that follows them.
// ---------------------------------------------------------------------------
export const SPEED_CAP = 45; // screen px/frame, this set's close-up cap
export const THREAD_SPEED = Math.min(LINE_SPEED, SPEED_CAP / K_OPEN); // 20.45
// The threads hold and then fade over 8 frames from f52. That start frame is
// the ONE frame in this piece not read off a word — it is the brief's own, and
// it sits in the gap between "thought" (f48) and "maybe" (f59), so the pair is
// gone before the ring starts drawing over the same three dots.
export const THREAD_FADE_F0 = 52;
export const THREAD_HOLD_FADE = 8;
export const TIP_R = 4;

export const THREAD_PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
];
export const THREAD_LEN = THREAD_PAIRS.map(([a, b]) =>
  Math.hypot(SEAT_X[KNOWN[b]] - SEAT_X[KNOWN[a]], SEAT_Y[KNOWN[b]] - SEAT_Y[KNOWN[a]]),
);

// v2: TWO heads leave 12 o'clock together, one clockwise and one
// counter-clockwise, and meet at 6 o'clock on "three". Each covers HALF the
// circumference, so the head speed halves; and the span is opened from f59 to
// f53 — "you know", the words between "thought" f48 and "maybe" f59 — because
// at 15 frames (the brief's f55) each head is still 50.7 screen px/frame,
// over the cap, and at 17 it is 44.7, under it. The close is still the word.
export const RING_DUR = 17; // f53 -> "three" f70
export const RING_F0 = 53; // ...with the default beats; the CLOSE is the anchor
export const RING_SPEED = RING_C / 2 / RING_DUR; // 20.33 world px/frame, per head
export const RING_CLICK = 4; // frames of ink click on the join at 6 o'clock
export const RING_STREAK = 1 / 3; // the head's smear is sub-sampled; see below

// ---------------------------------------------------------------------------
// IDLE TRAFFIC. The set's own mechanism — a thread from one seat to a
// neighbour, drawing head-led, holding, fading — with one rule added by the
// brief: it only ever runs between LIT seats, so the field is dead until the
// wave reaches it and alive behind it.
//
// The COUNT is capped rather than scaled. The shared rate (180 per 1,200
// agents) over 27,069 seats is 4,060 threads and ~8,100 DOM nodes a frame,
// which is not a field, it is a mesh; `MoreThanAllOfHistory` caps the same
// mechanism at 180 for 7,806 seats for the same reason. 300 over the area the
// camera can ever see works out at ~130 threads per million world px squared,
// twice that piece's density and a third of the nominal rate.
//
// The slots draw from a POOL of the seats inside the widest camera, so the
// traffic is where the lens is; a slot whose seat is outside the current frame
// or not yet lit simply does not draw, which is what makes the traffic thicken
// behind the front instead of being dealt out evenly.
// ---------------------------------------------------------------------------
export const IDLE_N = 300;
export const IDLE_REACH = 5; // cells, as everywhere in this set
export const IDLE_OP = 0.4;

const VIEW_HALF_W = FRAME_W / 2 / K_FINAL;
const VIEW_HALF_H = FRAME_H / 2 / K_FINAL;
const VIEW_CY = CONTENT_FINAL + CAM_LIFT / K_FINAL;
export const IDLE_POOL: Int32Array = (() => {
  const out: number[] = [];
  for (let i = 0; i < NSEAT; i++) {
    if (!SEAT_ALIVE[i]) continue; // (none of them out here: the falloff is at |x| > 675)
    if (Math.abs(SEAT_X[i] - RING_CX) > VIEW_HALF_W + 60) continue;
    if (Math.abs(SEAT_Y[i] - VIEW_CY) > VIEW_HALF_H + 60) continue;
    out.push(i);
  }
  return Int32Array.from(out);
})();

export type IdleThread = { a: number; b: number; dn: number; fade: number; cycle: number };

/** The schedule, as a pure function of slot and frame — exported so cut 2 can
 *  carry the same traffic on without a seam by offsetting the frame. */
export const idleAt = (j: number, f: number): IdleThread | null => {
  const period = 44 - 12 * hash(j, 4);
  const local = f + hash(j, 5) * period;
  const cycle = Math.floor(local / period);
  const phase = (local - cycle * period) / period;
  const seed = j * 131 + cycle * 7;
  const a = IDLE_POOL[Math.floor(hash(seed, 6) * IDLE_POOL.length)];
  const sa = SEATS[a];
  const bc = Math.max(0, Math.min(COLS - 1, sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * IDLE_REACH)));
  const br = Math.max(0, Math.min(ROWS - 1, sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * IDLE_REACH)));
  const b = SEAT_AT[br * COLS + bc];
  if (b < 0 || b === a) return null;
  const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: EASE_ARRIVE });
  const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
  if (fade <= 0.02) return null;
  return { a, b, dn, fade, cycle };
};

// ---------------------------------------------------------------------------
// The field is emitted as one <path> of circle arcs per lit bucket per depth
// band. 32 buckets: the tone ramp itself is quantised to 64 steps and the
// opacity ladder across the buckets steps by 0.027, both under what a frame can
// show, and it puts the whole crowd in 96 nodes.
// ---------------------------------------------------------------------------
export const BUCKETS = 32;
const arc = (x: number, y: number, r: number) => {
  const d = (2 * r).toFixed(2);
  return `M${(x - r).toFixed(2)} ${y.toFixed(2)}a${r.toFixed(2)} ${r.toFixed(
    2,
  )} 0 1 0 ${d} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 -${d} 0`;
};

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
  idleThreadCount: IDLE_N,
  experiments: {},
  beats: {
    we: 5,
    knew: 7,
    multiple: 15,
    models: 22,
    involved: 31,
    but: 44,
    thought: 48,
    maybe: 59,
    three: 70,
    or: 77,
    something: 83,
    and: 99,
    immediately: 104,
    clear: 126,
    that: 132,
    so: 146,
    much: 157,
    larger: 168,
    than: 181,
    that2: 187,
    end: 197,
  },
});

const ThreeOrSomething: React.FC<Props> = ({
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
  idleThreadCount,
  experiments,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = unlooked-at (deep), 1 = read (ripe). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = RING_CX + drift.dx;
  const k = cam.k;
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the three known agents ------------------------------------------------
  // One word each, deep -> ripe over the shared TONE_DUR. They stay ripe: the
  // wave only ever adds to what is already lit.
  const knownF0 = [beats.knew, beats.multiple, beats.models];
  const knownTone = knownF0.map((f0) => ease((frame - f0) / TONE_DUR, EASE_ARRIVE));

  // -- the field -------------------------------------------------------------
  // Only what the camera can see, found through the grid's own row and column
  // ranges, bucketed by lit amount and emitted as one path per bucket per band.
  const front = waveFront(frame);
  const bandK = DEPTH_BANDS.map((b) => depthK(k, b, experiments.depth));
  const kCull = Math.min(...bandK);
  const margin = dotRadius * 1.25 * 1.05 + 4;
  const x0 = cx - FRAME_W / 2 / kCull - margin;
  const x1 = cx + FRAME_W / 2 / kCull + margin;
  const y0 = cy - FRAME_H / 2 / kCull - margin;
  const y1 = cy + FRAME_H / 2 / kCull + margin;
  const gc0 = Math.max(0, Math.floor((x0 - GRID_X0) / STEP_X) - 1);
  const gc1 = Math.min(COLS - 1, Math.ceil((x1 - GRID_X0) / STEP_X) + 1);
  const gr0 = Math.max(0, Math.floor((y0 - GRID_Y0) / STEP_Y) - 1);
  const gr1 = Math.min(ROWS - 1, Math.ceil((y1 - GRID_Y0) / STEP_Y) + 1);

  const bucket: string[][][] = DEPTH_BANDS.map(() =>
    Array.from({ length: BUCKETS + 1 }, () => [] as string[]),
  );
  // with `softFront` off the front is a hard row edge instead of a three-row
  // ramp; everything else about the wave is unchanged
  const frontW = experiments.softFront ? WAVE_FRONT_WIDTH : 1e-3;
  // the wobble's amplitude rides the front's own radius, so the young front is
  // a slightly irregular disc and only the grown one is a blob
  const wobScale = waveWobAmp(front) / WAVE_WOB;
  const litOf = (i: number) => softFront(SEAT_D[i] - wobScale * SEAT_WOB[i], front, frontW);
  for (let gr = gr0; gr <= gr1; gr++) {
    for (let gc = gc0; gc <= gc1; gc++) {
      const i = gr * COLS + gc;
      if (!SEAT_ALIVE[i]) continue; // feathered away at the field's side edge
      let l = litOf(i);
      const kn = KNOWN.indexOf(i);
      if (kn >= 0) l = Math.max(l, knownTone[kn]);
      const band = SEAT_BAND[i];
      const r = dotRadius * SEAT_R[i] * breath(frame, hash(i, 9));
      const hot =
        experiments.highlight && frame >= SEAT_CROSS[i] && frame < SEAT_CROSS[i] + HIGHLIGHT_FRAMES;
      bucket[band][hot ? BUCKETS : Math.round(l * (BUCKETS - 1))].push(arc(SEAT_X[i], SEAT_Y[i], r));
    }
  }

  // -- idle traffic ----------------------------------------------------------
  // Between LIT seats only. A slot whose seat is unlit, or outside the frame,
  // does not draw at all — the traffic IS the read part of the field.
  type Th = {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    head: number;
    at: (f: number) => { x: number; y: number } | null;
  };
  const threadEls: Th[] = [];
  for (let j = 0; j < idleThreadCount; j++) {
    const t = idleAt(j, frame);
    if (!t) continue;
    if (litOf(t.a) <= 0.5 || litOf(t.b) <= 0.5) continue;
    const ax = SEAT_X[t.a];
    const ay = SEAT_Y[t.a];
    if (ax < x0 || ax > x1 || ay < y0 || ay > y1) continue;
    const bx = SEAT_X[t.b];
    const by = SEAT_Y[t.b];
    const at = (f: number) => {
      const u = idleAt(j, f);
      if (!u || u.cycle !== t.cycle) return null;
      return { x: ax + (bx - ax) * u.dn, y: ay + (by - ay) * u.dn };
    };
    threadEls.push({
      key: `i${j}`,
      x1: ax,
      y1: ay,
      x2: ax + (bx - ax) * t.dn,
      y2: ay + (by - ay) * t.dn,
      op: IDLE_OP * t.fade,
      head: t.dn,
      at,
    });
  }

  // -- the two threads on "involved" -----------------------------------------
  // A->B leaves on the word; B->C leaves the frame after A->B arrives rather
  // than waiting a full LEGATO beat for it to settle — that overlap is what
  // makes the pair one phrase instead of two events. Both fade together.
  const th1From = beats.involved;
  const th1Arrive = th1From + THREAD_LEN[0] / THREAD_SPEED;
  const th2From = Math.ceil(th1Arrive) + (experiments.legato ? 0 : LEGATO);
  const thFrom = [th1From, th2From];
  const thFade = interpolate(
    frame,
    [THREAD_FADE_F0, THREAD_FADE_F0 + THREAD_HOLD_FADE],
    [1, 0],
    clamp,
  );
  const hero = THREAD_PAIRS.map(([a, b], i) => {
    if (frame < thFrom[i] || thFade <= 0) return null;
    const A = { x: SEAT_X[KNOWN[a]], y: SEAT_Y[KNOWN[a]] };
    const B = { x: SEAT_X[KNOWN[b]], y: SEAT_Y[KNOWN[b]] };
    const at = (f: number) => {
      if (f < thFrom[i]) return null;
      const d = clamp01(((f - thFrom[i]) * THREAD_SPEED) / THREAD_LEN[i]);
      return { x: A.x + (B.x - A.x) * d, y: A.y + (B.y - A.y) * d };
    };
    const p = at(frame);
    if (!p) return null;
    const drawn = clamp01(((frame - thFrom[i]) * THREAD_SPEED) / THREAD_LEN[i]);
    return { key: i, x1: A.x, y1: A.y, x2: p.x, y2: p.y, head: drawn, at };
  });

  // -- the ring --------------------------------------------------------------
  // TWO heads leave 12 o'clock together — one clockwise, one counter-clockwise
  // — and meet at 6 o'clock on "three", where the ink clicks. Each covers half
  // the circumference, which is what brings the head under the speed cap. Both
  // are linear: at this radius an ease would put three times the mean speed
  // into the heads' first frames.
  const ringF0 = beats.three - RING_DUR; // the CLOSE is the word; the start follows
  const ringDraw = clamp01((frame - ringF0) / RING_DUR);
  // The drawn arc is [0, s] and [C - s, C] of one closed circle, so the two
  // halves are a single stroked path: no join, no doubled caps at the top, and
  // at ringDraw 1 the dash pattern is dropped for v1's plain full circle.
  const ringArc = (ringDraw * RING_C) / 2;
  const ringDash =
    ringDraw >= 1 ? `${RING_C}` : `${ringArc} ${RING_C - 2 * ringArc} ${ringArc}`;
  const ringHeadAt = (dir: number) => (f: number) => {
    if (f < ringF0) return null;
    const a = clamp01((f - ringF0) / RING_DUR) * Math.PI; // half a turn each
    return { x: RING_CX + dir * RING_R * Math.sin(a), y: RING_CY - RING_R * Math.cos(a) };
  };
  // `Streak` spans TRAIL_FRAMES of travel, and three frames of a head on a 110
  // px circle is a 32 degree arc: a straight chord drawn across the ring rather
  // than a smear along it (measured in v1 — it renders as a bar). So the `at`
  // it is handed is SUB-SAMPLED by RING_STREAK, as it was in v1: one step back
  // is a third of a frame, the streak covers one frame of travel, and its
  // sagitta off the arc is 0.47 world px, well inside its own stroke.
  const ringHeads = [1, -1].map((dir) => {
    const at = ringHeadAt(dir);
    return {
      dir,
      at,
      streakAt: (f: number) => at(frame + (f - frame) * RING_STREAK),
      p: at(frame),
    };
  });
  const click =
    frame < beats.three ? 0 : 1 - ease((frame - (beats.three + RING_CLICK)) / RING_CLICK, EASE_ARRIVE);
  const ringOp = OP_READ + (1 - OP_READ) * click;

  const bands = DEPTH_BANDS.map((b, bi) => {
    const kb = bandK[bi];
    const t = worldTransform(cx, cy, kb);
    return { band: b, kb, transform: `translate(${t.tx.toFixed(3)} ${t.ty.toFixed(3)}) scale(${kb})` };
  });

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
          {bands.map((b, bi) => (
            <g key={b.band} transform={b.transform}>
              {/* the crowd, one path per lit bucket: colour and opacity are
                  both the seat's lit amount, and nothing else */}
              {bucket[bi].map((d, n) =>
                d.length === 0 ? null : (
                  <path
                    key={n}
                    d={d.join("")}
                    fill={n === BUCKETS ? HIGHLIGHT : tone(n / (BUCKETS - 1))}
                    opacity={n === BUCKETS ? 1 : dotOpacity * seatOpacity(n / (BUCKETS - 1))}
                  />
                ),
              )}

              {bi === MID_BAND ? (
                <>
                  {/* idle traffic, head-led, between lit seats only */}
                  {threadEls.map((t) => (
                    <g key={t.key}>
                      <line
                        x1={t.x1}
                        y1={t.y1}
                        x2={t.x2}
                        y2={t.y2}
                        stroke={accent}
                        strokeWidth={STROKE}
                        strokeLinecap="round"
                        opacity={t.op}
                      />
                      {t.head < 1 ? (
                        <>
                          <Trail
                            frame={frame}
                            k={k}
                            at={t.at}
                            r={TIP_R}
                            fill={ink}
                            opacity={t.op}
                            enabled={experiments.trails}
                          />
                          <circle cx={t.x2} cy={t.y2} r={TIP_R} fill={ink} opacity={t.op} />
                        </>
                      ) : null}
                    </g>
                  ))}

                  {/* the two threads between the three known agents */}
                  <g style={{ filter: icon }} opacity={thFade}>
                    {hero.map((h) =>
                      h ? (
                        <g key={h.key}>
                          <line
                            x1={h.x1}
                            y1={h.y1}
                            x2={h.x2}
                            y2={h.y2}
                            stroke={accent}
                            strokeWidth={STROKE}
                            strokeLinecap="round"
                            opacity={0.95}
                          />
                          {h.head < 1 ? (
                            <>
                              <Trail
                                frame={frame}
                                k={k}
                                at={h.at}
                                r={TIP_R}
                                fill={ink}
                                enabled={experiments.trails}
                              />
                              <circle cx={h.x2} cy={h.y2} r={TIP_R} fill={ink} />
                            </>
                          ) : null}
                        </g>
                      ) : null,
                    )}
                  </g>

                  {/* the ring: what was looked at */}
                  {ringDraw > 0 ? (
                    <g style={{ filter: icon }}>
                      <circle
                        cx={RING_CX}
                        cy={RING_CY}
                        r={RING_R}
                        fill="none"
                        stroke={ink}
                        strokeWidth={RING_STROKE}
                        strokeLinecap="round"
                        strokeDasharray={ringDash}
                        strokeDashoffset={0}
                        opacity={ringOp}
                        transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
                      />
                      {ringDraw < 1
                        ? ringHeads.map((h) =>
                            h.p ? (
                              <g key={h.dir}>
                                <Streak
                                  frame={frame}
                                  k={k}
                                  at={h.streakAt}
                                  stroke={ink}
                                  width={TIP_R * 2}
                                  enabled={experiments.trails}
                                />
                                <circle cx={h.p.x} cy={h.p.y} r={TIP_R} fill={ink} />
                              </g>
                            ) : null,
                          )
                        : null}
                    </g>
                  ) : null}
                </>
              ) : null}
            </g>
          ))}
        </svg>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ThreeOrSomething;
