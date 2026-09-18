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
  hash,
  iconShadow,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  CAM_WIDE,
  DASH_OFF,
  DASH_ON,
  Gaze,
  INK,
  INK_HI,
  INK_LO,
  MARCH_W,
  MODEL_MARK,
  MODEL_MARK_PX,
  PERSON_H_PX,
  PersonGlyph,
  STROKE_PX,
  TWO_PI,
  WALL,
  WIRE_PX,
  Wall,
  ModelDot,
  arcPath,
  camCy,
  camKnots3,
  gazeTrail,
  lerp,
  runCam3,
  worldPx,
} from "./trapShared";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam Brown, clip `Noam_Trap`, cut 2: `FakeTestEnvironment`.
//
// (context: "we do have a problem now")
//   "where the models are, like, they're pretty smart, they're pretty clever,
//    and they're really good at recognizing when they're in, like, a fake test
//    environment."
//
// DURATION. The composition starts at SRT 13.820 s, so every beat is
//   frame = round((t - 13.820) * 24)
//     where f0 · the models f5-13 · are f13 · like f17 · they're f21 ·
//     pretty f31 · smart f35-45 · they're f45 · pretty f47 · clever f50-57 ·
//     and f57 · they're f62 · really f67 · good f72 · at f78 ·
//     recognizing f83-93 · when f93 · they're f98 · in f102 · like f106 ·
//     a f110 · fake f112 · test f116 · environment f121-133
// Speech therefore runs f0..133 and the set's 16-frame tail holds the resolved
// state: DURATION = 133 + 16 = 149.
export const DURATION = 149;

// ---------------------------------------------------------------------------
// V2 — TWO CHANGES, AND ONLY TWO. (1) THE MODEL IS THE OPENAI MARK, not a dot:
// `trapShared.ModelDot` now draws `brandGlyphs.OPENAI` filled, on a 72 screen px
// em box (MODEL_MARK_PX), in the same two-tone orange on the FILL. This is an
// interview with someone from OpenAI. (2) THE ANSWER KEY is lucide `key-round`
// instead of `key`, and the folder glyph is masked behind its silhouette. Every
// staging, timing, camera, beat and duration in this file is untouched.
//
// V3 — THREE CHANGES, AND ONLY THREE. Every beat frame, the DURATION, the
// staging, the crowd's placement and the shape of the camera track are the
// delivered cut's.
//   1. THE LANDING ON "smart" READS AGAIN. The tone ramp lost its punch when the
//      model became line art — a deep -> ripe ramp reads on a solid disc and
//      barely reads on six thin arms with the grid showing between them. The
//      ramp is unchanged; the SWELL now carries the landing: 0.78 -> 1.00 with
//      an 8% overshoot settled by f50, where it was 0.84 -> 1.00 at 5%. On
//      screen the mark goes 185 px at f28 -> 230 at f40, a 24% step against
//      V2's 13%. See THE MODEL'S ONE RAMP.
//   2. THE CUT RESOLVES AT THE SET'S WIDE. `K_REST_TARGET` is now `CAM_WIDE.k`
//      (1.15) instead of the pinned 1.080 — the one thing about this cut that
//      was a compromise rather than a choice. V2's 1.080 was forced by the 45
//      screen px/frame ceiling on a bare sweeping line: at 1.15 the wall is 6.5%
//      bigger on screen, a revolution costs 6.5% more frames, and the ring
//      closed after the speech ended. THE SHUTTER TRAIL PAYS FOR IT (change 3):
//      the ceiling goes to 70, the tip budget is re-solved 44.2 -> 47.5, and
//      every frame that matters comes back unmoved — the hand is wall-length on
//      f69, the ring closes on f130 inside "environment", and the five people
//      flip on f84 / f93 / f103 / f114 / f122 exactly as delivered.
//   3. THE HAND HAS A SHUTTER TRAIL. `Gaze.trail`, built by `gazeTrail` off this
//      cut's own angle and length functions: one flat accent wedge from the pose
//      half a frame ago to the pose now, under the crisp line, at the module's
//      TRAIL_OPACITY. No blur, no glow, no gradient — a 180-degree shutter and
//      nothing else. It is the only new ink in the cut and it is accent, on the
//      model's own attention, which is the one thing accent is allowed to be.
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "one model, alone among real people; it lights up, puts out a hand, and the
//    hand swings wider and wider — and everything it passes turns out to be
//    drawn in dashes, including the ring it has been inside the whole time."
//
// THE ONE IDEA, the clip's: **DASHED = fake. SOLID = real.** Nothing in this
// cut is dashed at f0. Everything is dashed at f148, and every dash exists
// because the hand reached it.
//
// VOCABULARY, all of it from `trapShared`, nothing invented:
//   the model   = the OPENAI MARK at the WALL'S CENTRE. This cut only: it
//                 comes before the stations exist, so the model has not yet
//                 taken up MODEL_HOME (540, 1010) low in the ring — it is the
//                 thing the ring is drawn around, at (540, 875). ACCENT_DEEP at
//                 rest, ACCENT once it is thinking. Tone on the fill, never
//                 alpha. `breath` always.
//   its gaze    = ONE accent needle from the mark (trapShared's `Gaze`), leaving
//                 its EDGE and not its centre — the blossom has counters through
//                 the middle, so a hand drawn under it would be seen through it —
//                 with the module's SHUTTER TRAIL under it (V3): the same needle's
//                 pose half a frame ago, filled flat at TRAIL_OPACITY, which is
//                 the hand's own motion and not a second object. Accent is used
//                 for NOTHING else in this cut: no work thread, no packets, no
//                 accent ring. There is nothing yet for the model to work ON —
//                 only to look around.
//   a person    = person.png white at PERSON_H_PX. Five of them, INK_HI, real.
//   a fake one  = that glyph at INK_LO inside a dashed circle (see DEVIATIONS
//                 for why the circle is drawn here rather than by `FakePerson`).
//   the wall    = trapShared's `Wall` at WALL, SOLID at f0, converted to dashed
//                 behind the hand through `dashedFrom` / `dashedSweep`.
// No stations, no folder, no key, no evaluator, no wire: this cut comes before
// all of them. No text, no numerals, no scan-lines, no glow, no eyes.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous opening; the words are landings inside it. Every
// gesture is here with the word it serves, and nothing in the piece is outside
// this list.
//
//  1. f0-31   "where the models    THE ONE, AND IT LOOKS REAL. The cut opens
//             are, like" (f0/f5/   close (k 3.956) on the OpenAI mark — an em box
//             f13/f17)             of 248 screen px, at the swell's 0.78 that is
//                                  193 across on f0, ACCENT_DEEP, breathing,
//                                  centred, with nothing over it. Three of the
//                                  five people are CROPPED by the frame edges at
//                                  INK_HI — solid, ordinary, the real world — and
//                                  two are outside it. The wall is 1345 screen px
//                                  in radius here, so it is off the top (-510) AND
//                                  off the bottom (2180): through f31 there is no
//                                  ring, no dash and no hint of one. The camera is
//                                  already opening (see CAMERA) at 1.2 screen
//                                  px/frame on the outer figures, so no frame here
//                                  is still.
//  2. f31-45  "pretty smart"       IT LIGHTS. The mark ripens ACCENT_DEEP ->
//             (f31/f35-45)         ACCENT over 12 frames (f30-42), fully ripe
//                                  three frames before "smart" ends rather than on
//                                  its last frame, and swells 0.78 -> 1.00 of its
//                                  full size once, eased (f28-42), with an 8.0%
//                                  overshoot that is gone by f50. On screen that
//                                  is 185 px across at f28 and 230 at f40. ONE
//                                  ramp; the mark never changes size or tone again
//                                  for the rest of the cut.
//  3. f47-57  "pretty clever"      THE HAND IS BORN. A short accent needle leaves
//             (f47/f50-57)         the mark at f47 ALREADY TURNING — 4.3 deg/frame
//                                  at birth, easing up over 13 frames — and grows
//                                  a little as it goes. A mind starting to look
//                                  around. It lands turning on "clever". From its
//                                  second frame it carries the SHUTTER TRAIL: one
//                                  flat accent wedge across the half-frame it just
//                                  swept, under the line (see THE SHUTTER TRAIL).
//  4. f53-130 "and they're really  THE ONE BIG MOTION. From f53 the hand
//             good at recognizing  LENGTHENS as it turns — a spiral sweep — and
//             ... a fake test      the camera's opening runs underneath it at
//             environment"         nearly the same rate, so the tip HOLDS its
//             (f57/f62/f67/f72/    screen radius while the world shrinks onto it:
//             f78/f83-93/f112/     the hand does not appear to grow, it appears to
//             f116/f121-133)       reach further and further out. The wall's top
//                                  arc enters frame at f59, under "and they're";
//                                  the hand IS wall-length at f69, three frames
//                                  before "good", having turned 105 degrees. From
//                                  there every change of state happens BECAUSE THE
//                                  HAND REACHED IT, never because a frame arrived:
//                                    * a person the hand crosses turns out to be a
//                                      prop. It dims INK_HI -> INK_LO and a dashed
//                                      circle draws around it over 8 frames, FROM
//                                      the angle the hand crossed at and in the
//                                      hand's own direction. The five crossings
//                                      are solved off the angle track, not keyed:
//                                      f84, f93, f103, f114, f122 — the first on
//                                      "recognizing", the last on "environment",
//                                      and all five re-derived under V3's faster
//                                      hand rather than kept. The one at f122 is a
//                                      person the hand ALREADY swept past once, at
//                                      f57, when it was 147 world px long and
//                                      stopped 42 px short of them: it flips on the
//                                      pass that reaches, not the pass that points.
//                                    * behind the hand the WALL converts solid ->
//                                      dashed: `dashedFrom` is the hand's angle on
//                                      the frame it first became wall-length and
//                                      `dashedSweep` is how far it has turned
//                                      since. The last solid arc closes at f130,
//                                      inside "environment" (f121-133) and three
//                                      frames before the speech ends, so the word
//                                      finishes over a fully dashed ring.
//  5. f131-148 tail                THE RESIDUE. The hand eases to a slow residual
//                                  turn (1.70 deg/frame — it never stops dead) and
//                                  shortens to a resting needle at 0.45 of the
//                                  wall over 15 frames. Its tip decays 47.1 -> 5.3
//                                  screen px/frame smoothly, with no brake, and the
//                                  shutter trail thins out with it: by the last
//                                  frames the wedge is 2.6 screen px wide at the
//                                  tip, inside the line's own 4.5, so the hand is a
//                                  bare needle again. The dashes march, the five
//                                  circles march, the mark breathes ripe, the
//                                  camera is still creeping open on the last frame.
//                                  Resolved picture: a lit orange mark with a
//                                  needle, alone in the middle of a world drawn
//                                  entirely in dashes.
//
// ---------------------------------------------------------------------------
// ARITHMETIC THAT MATTERS — the tip speed, and what it forces.
//
// A radial line sweeping at 24 fps strobes at its tip: the set's ceiling for a
// BARE line is ~45 screen px/frame, and with the shutter trail under it (V3) the
// module's own ceiling is 70. That number is not a detail here: it SETS THE SIZE
// OF THE PICTURE, because a full revolution of a hand of screen radius R costs at
// least 2*pi*R/(the budget) frames, and the wall has to finish converting inside
// "environment".
//
//   * THE CUT RESOLVES AT CAM_WIDE's k 1.15, the set's wide — not at CAM_CLOSE's
//     1.3, and no longer at V2's compromise 1.080. At 1.15 the wall is 391 screen
//     px in radius and a revolution costs 2*pi*391/47.0 = 52.3 frames of pure
//     turning; the hand is wall-length on f69 and the ring closes on f130, three
//     frames before the speech ends. Under V2's bare-line budget of 43.7 the same
//     revolution costs 56.2 frames and the ring closed at f134, which is why V2
//     had to resolve at 1.080 instead. At CAM_CLOSE's 1.3 the wall would be 442
//     px, a revolution 59.1 frames, and the hand could not be wall-length before
//     f71 (measured on the same solve) — the ring closes at f139, six frames
//     after the speech ends. The wall keeps its WORLD radius throughout, which is
//     what the other four cuts' geometry is built on; only the camera moved.
//   * THE NOUNS ARE SOLVED AT THIS CAMERA rather than carried at the ratio.
//     Every size is `worldPx(<the module's own screen constant>, K_REST)`, the
//     helper trapShared exports for exactly this: stroke 6.00 screen px, the
//     mark's em box 72.0 across, a person 118 tall, the gaze 4.5. So the mark, a
//     stroke and a person are the same size ON SCREEN here as in the close cuts;
//     only the wall is wider in the frame, which is the whole point of the cut.
//     At the set's own wide this cut now IS the other four cuts' camera, so the
//     solve and the ratio agree to a rounding error.
//   * THE DASH PATTERN IS THE MODULE'S. DASH_ON / DASH_OFF / MARCH_W are world
//     constants inside `Wall`, so at k 1.15 the wall's dashes are 23.0 on /
//     15.9 off marching 0.53 screen px/frame, against the reference 26 / 18 /
//     0.6. Every dashed thing in this cut — the wall and the five circles — uses
//     those same three numbers, so there is ONE dash pattern and ONE march rate.
//   * THE HAND'S SPEED IS DERIVED, NOT KEYED. The tip's screen radius is L*k, so
//     between frames it changes by k*dL + L*dk, and through the pull-back dk is
//     NEGATIVE: the camera's contraction CANCELS most of the hand's own
//     lengthening. The split is therefore taken on the RESULTANT — radial screen
//     speed 0.55 of the budget, the turn taking what is left — which holds the
//     tip at one screen speed for the whole gesture. Measured over the whole
//     piece, camera and sway included, the tip runs 43.0 (f55) · 47.0 (f62) ·
//     47.1 (f72) · 47.4 (f87, the maximum) · 46.8 (f113) · 47.1 (f129) · 5.3
//     (f148) — one lobe, no step anywhere in it, and 68% of the ceiling the
//     shutter trail buys. The ANGULAR rate is 6.1 deg/frame while the hand is
//     short at f55, dips to 3.8 as the hand reaches the wall under a camera that
//     is still wide, and rises to 6.8 as the pull-back finishes: the sweep gets
//     faster around the ring as the ring gets smaller, which is what a hand
//     holding one screen speed on a shrinking circle does.
//
// ---------------------------------------------------------------------------
// THE SHUTTER TRAIL (V3) — what the hand is allowed to do, and what it is not.
//
// A crisp line that jumps 45 screen px between two frames at 24 fps reads as two
// lines rather than one moving line. A camera would not show that: its shutter is
// open for part of the frame, so a fast hand lays down a smear across the sweep it
// just made and the crisp pose sits on the leading edge. `trapShared.Gaze` takes
// that as `trail` and draws exactly one thing for it — a FLAT accent wedge (fill,
// no stroke) from the pose half a frame ago to the pose now, from THREAD_GAP out
// to the tip, at TRAIL_OPACITY, UNDER the line. No blur filter, no glow, no
// gradient, no second line, nothing that is not the hand's own half-frame of
// travel. With it the module's tip ceiling is 70 screen px/frame instead of 45.
//
// This cut builds the prop with `gazeTrail(handAngle, lenAt, frame)` — the hand's
// OWN angle and length tables, the same two functions the line, the wall's
// conversion and the five crossings are all read off, so the wedge cannot drift
// from the hand by a frame or a world px, and it retimes with everything else if
// a beat ever moves.
//
// MEASURED: the wedge is the hand's angular travel, so it is 9.3 screen px wide at
// the tip when the hand is short and turning fast at f50, 22-23.5 px through the
// whole big sweep (f69-f133), and it thins with the hand's deceleration in the
// tail — 22.3 (f133) · 6.4 (f140) · 2.6 (f148), the last of those narrower than
// the line's own 4.5 px, i.e. hidden under it. Nothing else in the cut changed to
// accommodate it, and it is the only ink V3 adds.
//
// ---------------------------------------------------------------------------
// CAMERA — ONE continuous opening, and only one channel ever moves. The
// composition is radially symmetric about the wall's centre, so the ink centre
// IS (540, 875) on every frame and cy = 875 + CAM_LIFT/k puts it on screen y 835
// throughout: the camera never has to chase anything, it only lets go. Authored
// as knots on trapShared's monotone Hermite (`camKnots3`), one key per frame,
// through `runCam3`; 34 frames of pre-roll run before f0 so the opening frame
// already carries velocity. Monotone (Fritsch-Carlson) tangents make it
// structurally impossible for the track to overshoot a knot and rebound.
//
// The track is written as one shape times K_REST_TARGET (`span`, `K_RATIO_OPEN`),
// so moving the resolved zoom from V2's 1.080 to CAM_WIDE's 1.15 moves every knot
// with it and the MOVE — its easing, its landings, its |dv| — is the delivered
// cut's, 6.5% wider.
//
//   knot  f -34  k 4.071   the pre-roll, so f0 is already opening
//   knot  f   0  k 3.933   the wall is 1345 screen px in radius: off the top
//                          (-510) and off the bottom (2180)
//   knot  f  32  k 3.627   the creep: 6.0% over 32 frames, which runs the outer
//                          figures at 1.7 to 4.2 screen px/frame — never still,
//                          accelerating into the opening — and still leaves the
//                          wall off the bottom (2087 at f31)
//   knot  f  62  k 2.096   the opening takes hold under the lengthening hand
//   knot  f  94  k 1.231   the wall is fully in frame; the move goes 7% PAST the
//                          resolved zoom so the creep after it is a real creep
//   knot  f 148  k solved  still opening on the last frame (1.14927)
//   knot  f 260  k -6.0%   its continuation, off the end
//
// MEASURED (audit over f2..f148 on the wall's four cardinal points and a point
// on its 45-degree diagonal, sway included):
//   max tip speed        47.40 screen px/f   (ceiling 70 with the trail) at f87
//   max |dv|              0.99 screen px/f2  (ceiling 2.2)         at f39
//   max point speed      20.79 screen px/f   (nothing races in)
//   min point speed       0.059 screen px/f  (see DEVIATIONS)      at f148
//   resolved frame       wall screen x 148..931, y 438..1220
//                        side margin 145 after the stroke (brief asks >= 70),
//                        lowest ink 1220 (the band wants it above ~1400)
//   crowd                centre of mass 13.2 world px off the model (3.9% of the
//                        wall's radius); radii 0.365 / 0.451 / 0.583 / 0.683 /
//                        0.707 of it, all unchanged — the people are frozen as
//                        angles and world radii, so the whole crowd is the
//                        delivered picture. Every clearance IMPROVES at the wider
//                        rest, because a person and its circle are solved in
//                        screen px and so shrink in world px while the wall does
//                        not: the outermost dashed circle clears the wall by 32.0
//                        world px (29.4 after the stroke) against V2's 24.8, the
//                        innermost clears the MARK by 25.2 against 18.8, and the
//                        closest two circles clear each other by 45.0 against 36.3
//   caption band         max person ink inside screen y > 1380, over every frame
//                        and the drift's four corners: 9.1 px at f45, and ZERO on
//                        146 of the 149 frames (ceiling 40). V2 was 27.1 px at
//                        f41. Only two people ever touch the band at all and both
//                        do it off the SIDE of the frame while the camera is tight
//                        — p0 at screen x -137 (9.1 px, f45) and p4 at 1243 (2.6
//                        px, f39) — so the 6.5% wider opening, which pushes them
//                        further out of frame sideways, is what takes two thirds
//                        off the number. Nobody stands under the captions
//   people at f0         three of them CROPPED by the frame — left (x -92..249),
//                        top (y -115..227), right (x 923..1263) — two fully out.
//                        Lowest visible person ink 837, i.e. 543 px clear of the
//                        caption line and above the model's own centre
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//   * THE PULL-BACK IS THE WHOLE CUT, NOT A MOVE AT f67. The brief asks for the
//     camera to pull back with the tip "as ONE glide ... landing ~f108" and, in
//     the same paragraph, for "one continuous spiral sweep, one continuous
//     pull-back". Those two cannot both hold. The hand can only grow as fast as
//     the tip budget allows; the budget in world px is (47.5 - what the camera is
//     doing) / k, and while k is 3.9 that is 12.1 world px a frame. Starting the
//     opening at f67 leaves the hand still growing at f89 and the ring closing
//     eight frames after the speech ends (f141, measured on V2's solve, and the
//     V3 budget does not buy back eight frames). The opening therefore begins at f0 as a
//     creep and BECOMES the pull-back — one monotone curve, no second move
//     anywhere, which is the "one continuous pull-back" reading — and it lands at
//     f94 rather than f108. Landing early is not a loss: the wall is fully in
//     frame for the whole of "fake test environment" with a third of it still
//     solid, so the word lands on the ring FINISHING rather than on it arriving.
//   * THE WALL IS OFF-FRAME THROUGH f31 AND ENTERS AT f59. To hide a 340 world px
//     ring behind a frame whose ink centre sits at screen 835, the opening k must
//     be at least (1085 + the sway)/340 = 3.27; it is 3.956, which clears the
//     bottom edge by 260 px at f0 and still by 167 at f31 — the end of the brief's
//     stage 1. The ring's top edge crosses screen y 0 when k falls to 2.456 (the
//     same k as in V2 — the constraint is on the wall's world radius, not on the
//     camera's ratio), which the opening now reaches at f59 rather than f57,
//     inside "and they're really": the edge of the world appears as the hand
//     starts reaching for it, which is the picture the line describes. The wall's
//     FIRST ink of any kind is the arc clipping a bottom corner of the frame, and
//     the wider opening pushes that from f22 to f36 — so "through f31 there is no
//     ring and no hint of one", which the gesture list has claimed since V1, is
//     true for the first time in V3.
//   * THE HAND IS WALL-LENGTH AT f69 AND THE CONVERSION RUNS f69 -> f130 —
//     against the brief's f72 and f130, and both are DERIVED rather than keyed:
//     f69 is the frame the solved growth reaches WALL.r under the budget, and f130
//     the frame the accumulated angle since f69 passes 2*pi. Both come back on the
//     delivered cut's frames after the re-solve; they are what TIP_CAP is solved
//     against. 1.50 turns from birth to rest against the brief's 1.6, which is the
//     same integral read at the budget.
//   * THE FIVE PEOPLE ARE PLACED FROM THE HAND'S ANGLE TRACK, and in V3 that
//     placement is FROZEN while the crossings re-derive: see THE PLACEMENT,
//     below, which is its own section because the placement is the most
//     constrained thing in the cut.
//   * THE DASHED CIRCLES ARE DRAWN HERE, NOT BY `FakePerson`. `FakePerson` is
//     the right noun but its ring is locked to STROKE_W (5.3 screen px at this
//     camera) while everything else in this cut is at 6.0, and two stroke
//     weights is the one thing the set forbids. The circle below is the same
//     shape with the same DASH_ON / DASH_OFF / MARCH_W, at this cut's stroke,
//     and it draws FROM the angle the hand crossed at instead of from the top —
//     so the reveal is the hand's, not a timer's. `PersonGlyph` itself is used
//     unchanged.
//   * THE GAZE IS AT WIRE_PX (4.5 screen px), NOT THREAD_PX (3.0). A needle
//     340 px long at 3 px reads as a hair against a 72 px mark, and this hand is
//     the subject of the cut, not traffic on a thread. 4.5 is the module's own
//     middle weight and still sits clearly under the white 6.
//   * THE MIN CAMERA SPEED IS 0.059 screen px/f, under the 0.15 floor the set
//     usually holds. It is one frame, f148, where the sway's own sine happens to
//     cancel the last of the creep on one of the five audited points. The frame
//     is not still: the hand is still turning at 1.70 deg/frame (its tip runs 5.3
//     screen px/frame), every dash in the piece is marching, the five circles
//     with them, the mark is breathing and the people are drifting.
//   * THE TRAIL DOES NOT QUITE SWITCH ITSELF OFF IN THE TAIL. The module draws no
//     wedge under TRAIL_MIN_DEG (1.5 deg of travel in a frame) and the brief
//     expected the residual turn to fall under it; the residual is 1.70 deg/frame,
//     because that number is the delivered cut's tail and moving it to silence the
//     trail would change an approved motion to satisfy a threshold. What the
//     residual actually draws is a wedge 0.85 deg wide, i.e. 2.6 screen px at the
//     tip against the line's own 4.5 px width — geometrically inside the line, at
//     22% opacity, and invisible. The wedge is 23.5 px wide at the sweep's fastest
//     (f100-f130) and thins through f133-f148 with the hand's own deceleration:
//     22.3 (f133) · 6.4 (f140) · 2.6 (f148).
//   * `PLACEMENT` IS EXPORTED, and it is not decoration: every number in THE
//     PLACEMENT below is read off it, not asserted. It is never called during a
//     render.
//
// ---------------------------------------------------------------------------
// THE PLACEMENT — where the five people stand, and why they cannot stand
// anywhere else. Four hard constraints meet here and they do not all fit; this
// is the arithmetic, and the one thing that had to give.
//
// IT IS THE RECORD OF A SOLVE AT V2's CAMERA, and it stands: V3 freezes the
// answer (`PERSON_A` + `R_OF`) instead of re-running it, because the crowd is
// approved as a picture and the brief keeps it as screen positions relative to
// the wall. Every constraint below was re-measured at the new camera and all of
// them got LOOSER — A (the caption band) 27.1 px -> 9.1, D (the clearances)
// 24.8 / 18.8 / 36.3 world px -> 32.0 / 25.2 / 45.0 — while B (the hand has to
// reach them) re-derives to the same five frames, f84 / f93 / f103 / f114 / f122.
//
//   A. THE CAPTION BAND. Captions sit below screen y 1380. No person's white ink
//      may be more than ~40 px wide inside that band on ANY frame. The cut opens
//      at k 3.715 (V2's opening, which this solve was run at; V3's is 3.956 and a
//      person is 406 screen px tall at either, the glyph being solved in screen
//      px), and the frame is only 291 world px wide there, so a person only 122
//      world px below the model already
//      hangs 400 px into the band. Measured over every frame, every person and
//      the drift's four corners, this forbids a SECTOR of the ring, and the
//      sector is wide: at r 122 it is screen-down 53..127 deg, at r 200 it is
//      29..151, at r 243 it is 31..148. Nobody can stand at the bottom.
//   B. THE HAND HAS TO REACH THEM. A person's flip is the frame the hand's line
//      passes their angle WITH ENOUGH LENGTH, so their angle is the hand's angle
//      at the crossing, and the crossings have to spread over "recognizing ...
//      environment". The hand has turned 167 deg by f83 and 419 deg by f122, so
//      the five reachable angles live on 167..419 deg of its own track: an arc
//      of 252 deg with a 108-deg HOLE in it, and the hole cannot be closed by
//      placement. A person inside it either flips before "recognizing" (the hand
//      sweeps them on its first, short pass) or after the ring has closed. The
//      only way into the hole's near edge is a person the hand passes while it
//      is still too short to touch them — which needs r > the hand's length
//      there + 46, and r is capped at 243 by the wall, so the edge sits at 59
//      deg of track, not 0.
//   C. THE OPENING FRAME wants two to four people CROPPED by its edges, left and
//      right, above the model, none below it.
//   D. THE CROWD wants its centre of mass on the model, no two circles touching,
//      and its largest hole small.
//
//   A AND B CANNOT BOTH BE SATISFIED AT 95 DEG. The hole in the ring is the hole
//   in the hand's track (108 deg at best), and it has to be pointed at the
//   bottom, because that is the sector A forbids. Its two edges are then people,
//   and each of them has to clear A at its own radius: the lower-right one must
//   be far out (B: it is the one the hand passes early and misses), where A
//   forbids everything inside 31..148 — so it can be no further round than 30 —
//   and the lower-left one has to sit past 148 for the same reason. 148 - 30 =
//   118. The floor is therefore ~118 deg, not 95, and the only way under it is to
//   bring the lower-left person IN to r 122-140, where A's forbidden sector
//   narrows to 53..127 and the hole closes to ~108 — but at r 122-140 that person
//   is no longer outside the opening frame: it stands in it, below and left of
//   the model, with its feet 20 px off the caption line. That is the picture the
//   revision was asked to remove, so the 118 was taken instead.
//
//   WHAT WAS SOLVED, then, over the target crossing frames, the five radii and
//   the hand's birth angle, with A as a hard ceiling:
//     angles (screen, 90 = straight down)  29.2 / 148.9 / 200.1 / 263.3 / 335.6
//     radii, as a fraction of the wall     0.683 / 0.707 / 0.365 / 0.583 / 0.451
//     crossings                            f122 / f84 / f93 / f103 / f114
//     holes between neighbours             119.8 / 51.2 / 63.2 / 72.3 / 53.5
//   The 119.8 is centred on screen-down 89.0 deg — the two people that bracket
//   it are MIRRORED about straight down, at 29.2 and 148.9, both at nearly the
//   same radius (232 and 240) — so the ring reads as a crowd around the model
//   with its gap under the captions, rather than as a crowd that has slid to one
//   side. The other four holes are 51..72 deg, none of them a third of the ring.
//   Nothing is on a lattice: no two share a screen row, a screen column or a
//   radius, and the radii run 0.365, 0.451, 0.583, 0.683, 0.707.
//
//   AND THE ONE THAT FLIPS LAST IS THE ONE THE HAND ALREADY MISSED. The person
//   at 29.2 deg is swept at f57, when the hand is 147 world px long and they are
//   232 out: the tip stops 42 px short of their nearest ink, in plain sight, and
//   nothing happens. The hand comes round again 360 degrees later, now the whole
//   wall long, and flips them on f122 — inside "environment". That is the cut's
//   idea stated twice: the hand only turns things out to be fake once it can
//   actually reach them.
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
  beats: z.object({
    where: z.number(),
    models: z.number(),
    smart: z.number(),
    clever: z.number(),
    really: z.number(),
    good: z.number(),
    recognizing: z.number(),
    fake: z.number(),
    test: z.number(),
    environment: z.number(),
    end: z.number(), // speech ends; tail to 149
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
    where: 0,
    models: 5,
    smart: 35,
    clever: 50,
    really: 67,
    good: 72,
    recognizing: 83,
    fake: 112,
    test: 116,
    environment: 121,
    end: 133,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const LAST = DURATION - 1;
const PRE = 34; // frames of pre-roll through the damper, so f0 already moves

/** This cut's centre: the model sits at the WALL's centre (see VOCABULARY). */
const C = { x: WALL.cx, y: WALL.cy };

// ---------------------------------------------------------------------------
// THE CAMERA. One monotone opening; see the CAMERA block above.
// ---------------------------------------------------------------------------
/** The zoom this cut resolves at: THE SET'S WIDE, imported, not a number of this
 *  cut's own. V2 had to pin it at 1.08 — the 45 screen px/frame tip ceiling made
 *  the resolved zoom a BEAT rather than a framing choice, because at CAM_WIDE's
 *  1.15 the wall is 391 screen px in radius, one revolution of the hand costs
 *  2*pi*391/43.7 = 56 frames of pure turning, and the ring's last solid arc
 *  closed at f134: after the speech ended, instead of inside "environment".
 *  THE SHUTTER TRAIL BUYS IT BACK. `Gaze.trail` lifts the tip ceiling from 45 to
 *  70, so the budget is re-solved (see TIP_CAP) and the cut now resolves at the
 *  same wide as the rest of the set with the conversion still closing on f130,
 *  the hand still wall-length on f69, and the five crossings still on their own
 *  frames. Nothing else in the cut moved to pay for it. */
const K_REST_TARGET = CAM_WIDE.k;
/** The opening, as a MULTIPLE of the resolved zoom rather than an absolute — and
 *  that is what carries the approved opening picture through the re-solve. Every
 *  size in this cut is `worldPx(<a screen px constant>, K_REST)`, so k / K_REST
 *  is what decides how big the mark, a stroke and a person are ON SCREEN: hold
 *  the ratio and all three are exactly as delivered on every frame (the mark's
 *  em box is 248 screen px at f0, 237 at f28, 218 at f40). What does change is
 *  the WALL and the five people, whose positions are world px and therefore open
 *  6.5% wider on screen with the camera. Both ways that is a gain: the wall only
 *  goes further off the edges at the top of the cut (it needs k >= (1085 + the
 *  sway)/340 = 3.27 to be off the bottom at all, and the opening is 3.956), and
 *  the caption band's worst person falls from 27.1 px of ink to 9.1. */
const K_RATIO_OPEN = 3.42;
const K_OPEN = K_REST_TARGET * K_RATIO_OPEN;
const span = (t: number) => K_REST_TARGET + (K_OPEN - K_REST_TARGET) * t;

const trackFor = (kEnd: number) =>
  camKnots3(
    [
      { f: 0, k: K_OPEN * 1.035, x: C.x, y: C.y },
      { f: PRE, k: K_OPEN, x: C.x, y: C.y },
      { f: PRE + 32, k: span(0.89), x: C.x, y: C.y },
      { f: PRE + 62, k: span(0.34), x: C.x, y: C.y },
      { f: PRE + 94, k: K_REST_TARGET * 1.07, x: C.x, y: C.y },
      { f: PRE + LAST, k: kEnd, x: C.x, y: C.y },
      { f: PRE + 260, k: kEnd * 0.94, x: C.x, y: C.y },
    ],
    PRE + DURATION + 120,
  );

const kAtLast = (kEnd: number) => {
  const t = trackFor(kEnd);
  return runCam3(LAST + PRE, t.CX, t.CY, t.K).k;
};
const K_END = (() => {
  const a = K_REST_TARGET * 0.8;
  const b = K_REST_TARGET * 1.1;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom every weight in the piece is written against. */
const K_REST = kAtLast(K_END);
const CAM = trackFor(K_END);

const CAM_AT_F: { k: number; cx: number; cy: number }[] = (() => {
  const out: { k: number; cx: number; cy: number }[] = [];
  for (let f = 0; f <= DURATION + 6; f++) {
    const c = runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ k: c.k, cx: c.cx + d.dx, cy: c.cy + d.dy });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION + 6, Math.round(f)));
const kAt = (f: number) => CAM_AT_F[clampF(f)].k;
const screenAt = (f: number, wx: number, wy: number) => {
  const c = CAM_AT_F[clampF(f)];
  return [WORLD_W / 2 + (wx - c.cx) * c.k, WORLD_H / 2 + (wy - c.cy) * c.k];
};

// ---------------------------------------------------------------------------
// THE WEIGHTS, solved at this camera off trapShared's own screen constants.
// ---------------------------------------------------------------------------
const STROKE = worldPx(STROKE_PX, K_REST); // 6.00 screen px
const PERSON_H_L = worldPx(PERSON_H_PX, K_REST); // 118 screen px tall
/** The OpenAI mark's em box at this cut's own camera: 72 screen px across. */
const MODEL_MARK_L = worldPx(MODEL_MARK_PX, K_REST);
const MODEL_EDGE_L = MODEL_MARK_L / 2;
const MODEL_SCALE = MODEL_MARK_L / MODEL_MARK; // `ModelDot` takes a scale
const GAZE_W = worldPx(WIRE_PX, K_REST);
/** the hand starts OUTSIDE the mark's box — it has a hole through its middle */
const GAZE_GAP = MODEL_EDGE_L * 1.1;
/** The dashed circle around a person, and how far its ink stays off the wall. */
const RING_R = PERSON_H_L * 0.66;

// ---------------------------------------------------------------------------
// THE HAND. Its length and its angle are INTEGRATED under the tip cap, frame by
// frame, rather than keyed — see ARITHMETIC THAT MATTERS.
// ---------------------------------------------------------------------------
/** The tip's screen budget, per frame. V2 spent 44.2 under the set's bare-line
 *  ceiling of 45; the shutter trail lifts that ceiling to 70, and 47.5 is what
 *  the move to CAM_WIDE COSTS rather than the most the hand could now spend. It
 *  is solved against the two frames that may not move: at 47.5 the hand is
 *  wall-length on f69 and the ring's last solid arc closes on f130, and the five
 *  crossings come back on f84 / f93 / f103 / f114 / f122 — the delivered cut's
 *  own frames, to the frame. 46.5 closes at f131, 48.0 at f129. Measured over
 *  the whole piece, camera and sway included, the tip peaks at 47.40 screen
 *  px/frame at f89: 68% of the trail's ceiling, 6.5% over V2's speed, which is
 *  exactly the 6.5% the picture grew by. */
const TIP_CAP = 47.5; // screen px/frame; the trail's ceiling is 70
/** The budget the hand's TIP is allowed on screen, per frame: the cap, less the
 *  most the camera's own sway can add to it on its own. */
const SWAY_ALLOW = 0.5;
const TIP_BUDGET = TIP_CAP - SWAY_ALLOW;
const F_BIRTH = 47; // "pretty" (f47), turning by "clever"
const L_BORN = 56; // world px: a short needle just clear of the dot
const L_SHORT = 98; // where it sits when the lengthening takes over
const F_GROW0 = 53; // the growth leads "and" (f57) by four frames
const W_BORN = 4.3; // deg/frame at birth
/** The steady nominal rate is the one the budget itself allows at wall length,
 *  so the BUDGET governs from the moment the hand is the wall and the nominal
 *  only ever governs while the hand is short. */
const W_STEADY = (((TIP_BUDGET / (WALL.r * K_REST)) * 180) / Math.PI) * 1.02;
const W_RAMP = 13;
const F_TAIL = 131; // two frames after the ring closes
const F_TAIL1 = 146;
const L_RESIDUAL = 0.45; // the resting needle, as a fraction of the wall
const W_RESIDUAL = 1.7; // deg/frame: it never stops dead
/** The hand's birth direction, and the only free angle in the piece: the five
 *  people are placed off the hand's own track (see THE FIVE PEOPLE), so turning
 *  this turns the whole crowd with it. SOLVED, not chosen — it is what puts the
 *  crowd's one unavoidable hole at the BOTTOM of the frame, where the captions
 *  are, with the two people that bracket the hole at screen-down 29.2 deg and
 *  148.9 deg, i.e. mirrored about straight down (89.0 deg). 336.74 degrees. */
const HAND_A0 = 5.877179402868017;

// The tip's screen radius is L * k, so between two frames it changes by
// k*dL + L*dk — and through the pull-back dk is NEGATIVE, which CANCELS most of
// the hand's own lengthening. Budgeting |L*dk| away from the cap (the obvious
// reading, and the first one built here) therefore spends the allowance twice:
// the hand ran at 25-28 screen px/frame through the middle of its own big
// gesture, visibly slowing down between the birth and the sweep. What the cap
// governs is the RESULTANT, so the split is taken on the resultant:
//   radial screen speed = RAD_SHARE * TIP_BUDGET  ->  dL = (that - L*dk) / k
//   tangential          = TIP_BUDGET * sqrt(1 - RAD_SHARE^2)  ->  w = that/(L*k)
// which holds the tip at one screen speed for the whole gesture and gives the
// lengthening its own reach back: the hand now turns 5.3 deg/frame while it
// grows instead of 2.5, so the spiral is a spiral rather than a shoot outwards.
const RAD_SHARE = 0.55; // the share of the TIP's screen speed the reach spends

const L_TAB: number[] = new Array(DURATION + 7).fill(0);
/** The frame the hand first IS the wall. Derived, not keyed. */
const F_REACH = (() => {
  let L = 0;
  let reach = -1;
  for (let f = 0; f <= DURATION + 6; f++) {
    if (f < F_BIRTH) {
      L_TAB[f] = 0;
      continue;
    }
    if (f <= F_GROW0) {
      L = L_BORN + (L_SHORT - L_BORN) * smoothstep((f - F_BIRTH) / (F_GROW0 - F_BIRTH));
      L_TAB[f] = L;
      continue;
    }
    if (reach < 0) {
      const kk = kAt(f);
      const dk = kAt(f) - kAt(f - 1);
      L = Math.min(WALL.r, L + Math.max(0, (RAD_SHARE * TIP_BUDGET - L * dk) / kk));
      L_TAB[f] = L;
      if (L >= WALL.r - 1e-9) reach = f;
      continue;
    }
    if (f <= F_TAIL) {
      L_TAB[f] = WALL.r;
      continue;
    }
    L_TAB[f] =
      WALL.r * (1 - (1 - L_RESIDUAL) * smoothstep((f - F_TAIL) / (F_TAIL1 - F_TAIL)));
  }
  return reach;
})();
const lenAt = (f: number) => L_TAB[clampF(f)];

/** How far the hand has turned since birth, in radians, clockwise. */
const TH_TAB: number[] = new Array(DURATION + 7).fill(0);
(() => {
  let th = 0;
  for (let f = F_BIRTH + 1; f <= DURATION + 6; f++) {
    const L = lenAt(f);
    const kk = kAt(f);
    const dL = L - lenAt(f - 1);
    // The hand never brakes: the nominal rate eases from the steady sweep down
    // to the residual turn over 13 frames instead of switching at F_TAIL, so
    // the tip's speed decays instead of stepping (it fell 44.7 -> 10.3 in one
    // frame before this, which reads as the hand hitting a wall).
    const base = W_BORN + (W_STEADY - W_BORN) * smoothstep((f - F_BIRTH) / W_RAMP);
    const nom = lerp(base, W_RESIDUAL, smoothstep(clamp01((f - F_TAIL) / 13)));
    // whatever the tip's radius is actually doing on screen this frame, the
    // hand's own lengthening and the camera's zoom together
    const radial = kk * dL + L * (kk - kAt(f - 1));
    const tang = Math.sqrt(Math.max(0, TIP_BUDGET * TIP_BUDGET - radial * radial));
    th += Math.min((nom * Math.PI) / 180, tang / Math.max(1e-6, L * kk));
    TH_TAB[f] = th;
  }
})();
const thAt = (f: number) => TH_TAB[clampF(f)];
/** The hand's absolute angle on frame `f`, in the SVG frame (y down). */
const handAngle = (f: number) => HAND_A0 + thAt(f);

/** The frame the wall's last solid arc closes: one full turn after F_REACH. */
const F_CLOSE = (() => {
  for (let f = F_REACH; f <= DURATION + 6; f++) if (thAt(f) - thAt(F_REACH) >= TWO_PI) return f;
  return -1;
})();

// ---------------------------------------------------------------------------
// THE FIVE PEOPLE — where they STAND. Every angle here comes off the hand's own
// track at the frame the hand crosses that person, so a flip is never a timer;
// the radii are solved. The whole placement is solved, not eyeballed, against
// five things at once — the caption band, the opening frame, the crowd's hole,
// its centre of mass, and the hand's own reach. See THE PLACEMENT, below.
// ---------------------------------------------------------------------------
/** The frames the hand crossed them on the delivered cut, kept as the TARGET the
 *  re-derived crossings below are checked against. */
const CROSS_AT = [84, 93, 103, 114, 122];
/** THE APPROVED PLACEMENT, FROZEN. Each of these was `HAND_A0 + thAt(CROSS_AT[i])`
 *  on the delivered cut's angle track — the hand's own bearing on the frame it
 *  crossed that person — and the whole crowd was solved that way. V3 re-solves
 *  the track (a bigger tip budget at a wider camera), so recomputing the angles
 *  would MOVE five approved people; the placement is approved as a picture and
 *  is kept as screen positions relative to the wall (same angles, same r/wall),
 *  which is what a frozen angle and an unchanged world radius are. Only the
 *  CROSSINGS re-derive, from the new geometry, in `crossingOf` — and they come
 *  back on the delivered frames. Absolute, in the SVG frame (y down). */
const PERSON_A = [
  8.882147316834, // 148.91 deg on screen, 90 = straight down
  9.775626100204, // 200.10
  10.878925614011, // 263.32
  12.140749757906, // 335.61
  13.075291248535, // 29.16
];
/** ...and how far out each one stands, in world px. The wall keeps its world
 *  radius, so these are unchanged r/wall: 0.707 / 0.365 / 0.583 / 0.451 / 0.683. */
const R_OF = [240.3, 124.2, 198.3, 153.5, 232.2];
const REVEAL_F = 8; // frames a person takes to turn out to be a prop

type Person = { i: number; a: number; r: number; x: number; y: number; flip: number; seed: number };

/** The frame the hand's line sweeps past absolute angle `a` while it is at
 *  least `r` long — the crossing, read off the geometry. -1 if it never does. */
const crossingOf = (a0: number, a: number, r: number) => {
  for (let f = F_BIRTH + 1; f <= DURATION; f++) {
    const t0 = a0 + thAt(f - 1);
    const t1 = a0 + thAt(f);
    if (t1 <= t0) continue;
    // the hand only reaches a person that is inside its own length
    for (let m = -4; m <= 4; m++) {
      const target = a + TWO_PI * m;
      if (target > t0 && target <= t1 && lenAt(f) >= r) return f;
    }
  }
  return -1;
};

/** THE PLACEMENT. Each person's angle IS the hand's angle on the frame it
 *  crossed them when the crowd was solved, so the whole crowd is a picture of
 *  the sweep; their radii are the five free numbers, and `R_OF` is what the
 *  solver returned. The crossing is then re-derived from the geometry, not
 *  asserted: it is where the hand's line passes that angle while it is already
 *  long enough to reach — which is why this survives the V3 re-solve without the
 *  people moving. */
const PEOPLE: Person[] = PERSON_A.map((a, i) => {
  const r = R_OF[i];
  return {
    i,
    a,
    r,
    x: C.x + Math.cos(a) * r,
    y: C.y + Math.sin(a) * r,
    flip: crossingOf(HAND_A0, a, r),
    seed: hash(i, 23),
  };
});

/** The audit the placement was solved against, exported so it can be MEASURED
 *  off-render rather than asserted in a comment. Never called during a render. */
export const PLACEMENT = (() => {
  const deg = PEOPLE.map((p) => ((((p.a * 180) / Math.PI) % 360) + 360) % 360);
  const sorted = [...deg].sort((a, b) => a - b);
  const holes = sorted.map((d, i) => ((sorted[(i + 1) % 5] - d + 360) % 360));
  const com = PEOPLE.reduce(
    (acc, p) => ({ x: acc.x + Math.cos(p.a) * p.r, y: acc.y + Math.sin(p.a) * p.r }),
    { x: 0, y: 0 },
  );
  const comOff = Math.hypot(com.x, com.y) / 5;
  // the hand's EARLIER passes over each person, and how far its tip stopped
  // short of their nearest ink: this is what makes a late flip causal.
  const NEAR_INK = PERSON_H_L * 0.42;
  const misses: { i: number; f: number; clear: number }[] = [];
  for (const p of PEOPLE) {
    for (let f = F_BIRTH + 1; f < p.flip; f++) {
      const t0 = HAND_A0 + thAt(f - 1);
      const t1 = HAND_A0 + thAt(f);
      for (let m = -4; m <= 4; m++) {
        const target = p.a + TWO_PI * m;
        if (target > t0 && target <= t1) {
          misses.push({ i: p.i, f, clear: Number((p.r - NEAR_INK - lenAt(f)).toFixed(1)) });
        }
      }
    }
  }
  let pair = Infinity;
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      pair = Math.min(pair, Math.hypot(PEOPLE[i].x - PEOPLE[j].x, PEOPLE[i].y - PEOPLE[j].y));
    }
  }
  const openBox = PEOPLE.map((p) => {
    const c = CAM_AT_F[0];
    const h = PERSON_H_L * 0.42 * c.k;
    const X = WORLD_W / 2 + (p.x - c.cx) * c.k;
    const Y = WORLD_H / 2 + (p.y - c.cy) * c.k;
    return { i: p.i, x: [X - h, X + h], y: [Y - h, Y + h] };
  });
  return {
    deg: deg.map((d) => Number(d.toFixed(1))),
    r: PEOPLE.map((p) => Number(p.r.toFixed(1))),
    rFrac: PEOPLE.map((p) => Number((p.r / WALL.r).toFixed(3))),
    flips: PEOPLE.map((p) => p.flip),
    want: CROSS_AT,
    holes: holes.map((h) => Number(h.toFixed(1))),
    maxHole: Number(Math.max(...holes).toFixed(1)),
    comOff: Number(comOff.toFixed(1)),
    comPct: Number(((100 * comOff) / WALL.r).toFixed(1)),
    ringToWall: Number((WALL.r - Math.max(...PEOPLE.map((p) => p.r)) - RING_R).toFixed(1)),
    ringToMark: Number((Math.min(...PEOPLE.map((p) => p.r)) - RING_R - MODEL_EDGE_L).toFixed(1)),
    ringToRing: Number((pair - 2 * RING_R).toFixed(1)),
    misses,
    openBox,
  };
})();

/** Every person drifts a little the whole time, so a crowd is never a still
 *  picture. Not a gesture: 2.5 world px on two slow hashed sines. */
const personDrift = (p: Person, f: number) => ({
  dx: 4.2 * (0.6 * Math.sin(f * 0.055 + p.seed * 6.283) + 0.4 * Math.sin(f * 0.031 + p.i)),
  dy: 4.2 * (0.6 * Math.sin(f * 0.047 + p.seed * 3.1) + 0.4 * Math.sin(f * 0.025 + p.i * 2.2)),
});

// ---------------------------------------------------------------------------
// THE MODEL'S ONE RAMP. It ripens and swells once, on "smart", and never
// pulses again; `breath` is inside `ModelDot` and runs the whole cut.
// ---------------------------------------------------------------------------
// The ramp LANDS ahead of its word, as the set requires, rather than finishing
// on the last frame of it: "smart" runs f35-45, so the tone is fully ripe at
// f42 and the viewer reads the dot brightening THROUGH the first half of the
// word instead of arriving on its final frame.
const TONE_F0 = 30;
const TONE_F1 = 42;
const SWELL_F0 = 28;
const SWELL_F1 = 42;
/** V3: 0.84 -> 0.78, and the overshoot 5% -> 8%. THE LIGHT-UP GOT WEAKER WHEN
 *  THE MODEL BECAME A LINE-ART LOGO: a deep -> ripe tone ramp on a solid disc
 *  changes the colour of a 42 px-wide area, and the same ramp on the OpenAI
 *  blossom changes the colour of six arms about a twelfth of the box each, with
 *  the grid showing through the counters between them. The tone ramp is right
 *  and stays exactly as it was (f30 -> f42, ripe three frames before "smart"
 *  ends); what carries the landing instead is SIZE, which a line-art mark reads
 *  as well as a disc does. The mark's em box now goes 185 screen px at f28 ->
 *  230 at f40 (V2: 199 -> 225) — a 24% step on screen where it was 13%, and
 *  against a camera that takes 8% off the mark across those same twelve frames.
 *  At the 270-px reading test it is 46 px -> 57 (V2: 50 -> 56).
 *  It is still ONE eased swell: the base ramp lands at f42 and the overshoot's
 *  half-sine is 8.0% at its peak (f42-43) and back to zero at f50, after which
 *  the mark never changes size again for the rest of the cut. */
const SWELL_FROM = 0.78;
const OVERSHOOT = 0.08;
/** The overshoot's window: f35 ("smart") to f50, so it is settled on the frame
 *  "clever" starts and the two landings do not overlap. */
const OVER_F0 = 35;
const OVER_SPAN = 15;

const modelTone = (f: number) => smoothstep(clamp01((f - TONE_F0) / (TONE_F1 - TONE_F0)));
const modelScale = (f: number) => {
  const base = lerp(SWELL_FROM, 1, smoothstep(clamp01((f - SWELL_F0) / (SWELL_F1 - SWELL_F0))));
  const over = OVERSHOOT * Math.sin(Math.PI * clamp01((f - OVER_F0) / OVER_SPAN));
  return MODEL_SCALE * (base + over);
};

// ---------------------------------------------------------------------------

const FakeTestEnvironment: React.FC<Props> = ({
  ink,
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
}) => {
  const frame = useCurrentFrame();

  // -- camera ---------------------------------------------------------------
  const cam = runCam3(frame + PRE, CAM.CX, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  // -- the hand -------------------------------------------------------------
  const handLen = lenAt(frame);
  const handA = handAngle(frame);
  const born = frame >= F_BIRTH;

  // -- the wall's conversion, driven by the hand's angle ---------------------
  const dashedFrom = handAngle(F_REACH);
  const dashedSweep =
    frame < F_REACH ? 0 : Math.min(TWO_PI, thAt(frame) - thAt(F_REACH));

  const svgStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "visible",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={camCy({ k: K_OPEN, x: C.x, y: C.y })}
        cx={cx}
        cxRest={C.x}
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
          {/* Z-ORDER, trapShared's: the wall and the dashed circles, then the
              gaze, then the people, then the model on top. */}
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={svgStyle}
          >
            <Wall
              k={k}
              cx={C.x}
              cy={C.y}
              r={WALL.r}
              draw={1}
              dashedFrom={dashedFrom}
              dashedSweep={dashedSweep}
              march={frame}
              opacity={INK_HI}
              stroke={STROKE}
            />

            {/* A person the hand has crossed turns out to be a prop: the dashed
                circle draws FROM the angle the hand crossed at, in the hand's
                own direction, over 8 frames. */}
            <g style={{ filter: icon }}>
              {PEOPLE.map((p) => {
                if (p.flip < 0 || frame < p.flip) return null;
                const rv = smoothstep(clamp01((frame - p.flip) / REVEAL_F));
                if (rv <= 0) return null;
                const d = personDrift(p, frame);
                const a0 = handAngle(p.flip);
                return (
                  <path
                    key={`c${p.i}`}
                    d={arcPath(p.x + d.dx, p.y + d.dy, RING_R, a0, a0 + TWO_PI * rv)}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="butt"
                    strokeDasharray={`${DASH_ON} ${DASH_OFF}`}
                    strokeDashoffset={-frame * MARCH_W}
                    opacity={INK_LO}
                  />
                );
              })}
            </g>

            {born ? (
              <Gaze
                k={k}
                from={C}
                angle={handA}
                length={handLen}
                gap={GAZE_GAP}
                width={GAZE_W}
                // THE SHUTTER TRAIL, off the hand's OWN pose functions, so the
                // wedge cannot drift from the line it belongs to: one flat accent
                // sector from the pose half a frame ago to this one, under the
                // line. It is what lets the tip run at 47.4 screen px/frame
                // instead of 44.2 without the line strobing into two lines. Below
                // `TRAIL_MIN_DEG` of travel the module draws nothing at all, so
                // the wedge thins out through the tail on its own.
                trail={gazeTrail(handAngle, lenAt, frame)}
              />
            ) : null}
          </svg>

          {PEOPLE.map((p) => {
            const rv = p.flip < 0 ? 0 : smoothstep(clamp01((frame - p.flip) / REVEAL_F));
            const d = personDrift(p, frame);
            return (
              <PersonGlyph
                key={`p${p.i}`}
                k={k}
                x={p.x + d.dx}
                y={p.y + d.dy}
                h={PERSON_H_L}
                opacity={lerp(INK_HI, INK_LO, rv)}
              />
            );
          })}

          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={svgStyle}
          >
            <ModelDot
              frame={frame}
              k={k}
              x={C.x}
              y={C.y}
              tone={modelTone(frame)}
              scale={modelScale(frame)}
            />
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default FakeTestEnvironment;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  smart: defaultProps.beats.smart,
  clever: defaultProps.beats.clever,
  good: defaultProps.beats.good,
  recognizing: defaultProps.beats.recognizing,
  environment: defaultProps.beats.environment,
  end: defaultProps.beats.end,
};

export const CAM_AT = (f: number) => runCam3(f + PRE, CAM.CX, CAM.CY, CAM.K);

/** The hand's solved tables, exposed so the crowd can be SOLVED against them
 *  off-render (see `PLACE_PROBE`). Never called during a render. */
export const HAND_TRACK = {
  thAt,
  lenAt,
  handAngle,
  kAt,
  screenAt,
  F_BIRTH,
  F_REACH,
  F_CLOSE,
  crossingOf,
  PEOPLE,
  WALL_R: WALL.r,
  C,
  K_REST,
  PERSON_H_L,
  RING_R,
  MODEL_EDGE_L,
  STROKE,
};

/** The hand's tip, in world px, on frame `f`. */
const tipAt = (f: number) => {
  const L = lenAt(f);
  const a = handAngle(f);
  return [C.x + Math.cos(a) * L, C.y + Math.sin(a) * L];
};

export const STATS = (() => {
  // tip speed per frame, camera and sway included
  const tipV: number[] = [];
  for (let f = 0; f <= LAST; f++) {
    if (f <= F_BIRTH + 1) {
      tipV.push(0);
      continue;
    }
    const a = screenAt(f - 1, ...(tipAt(f - 1) as [number, number]));
    const b = screenAt(f, ...(tipAt(f) as [number, number]));
    tipV.push(Number(Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2)));
  }
  const maxTip = Math.max(...tipV);

  // camera smoothness and its motion floor, on the wall's cardinals
  const pts: [number, number][] = [
    [C.x, C.y - WALL.r],
    [C.x, C.y + WALL.r],
    [C.x - WALL.r, C.y],
    [C.x + WALL.r, C.y],
    [C.x + WALL.r * 0.707, C.y + WALL.r * 0.707],
  ];
  let camDv = 0;
  let camDvAt = 0;
  let camMax = 0;
  let camMin = Infinity;
  let camMinAt = 0;
  for (let f = 2; f <= LAST; f++) {
    let slowest = Infinity;
    for (const p of pts) {
      const a = screenAt(f - 2, p[0], p[1]);
      const b = screenAt(f - 1, p[0], p[1]);
      const c = screenAt(f, p[0], p[1]);
      const v1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const v2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
      if (Math.abs(v2 - v1) > camDv) {
        camDv = Math.abs(v2 - v1);
        camDvAt = f;
      }
      camMax = Math.max(camMax, v2);
      slowest = Math.min(slowest, v2);
    }
    if (slowest < camMin) {
      camMin = slowest;
      camMinAt = f;
    }
  }

  // the frame the wall's top edge first crosses screen y 0
  let wallIn = -1;
  for (let f = 0; f <= LAST; f++) {
    if (screenAt(f, C.x, C.y - WALL.r)[1] >= 0) {
      wallIn = f;
      break;
    }
  }

  const com = PEOPLE.reduce(
    (acc, p) => ({ x: acc.x + Math.cos(p.a) * p.r, y: acc.y + Math.sin(p.a) * p.r }),
    { x: 0, y: 0 },
  );

  const at = (f: number) => {
    const s0 = screenAt(f, C.x - WALL.r, C.y);
    const s1 = screenAt(f, C.x + WALL.r, C.y);
    const t = screenAt(f, C.x, C.y - WALL.r);
    const b = screenAt(f, C.x, C.y + WALL.r);
    return {
      f,
      k: Number(kAt(f).toFixed(3)),
      wallX: [Number(s0[0].toFixed(0)), Number(s1[0].toFixed(0))],
      wallY: [Number(t[1].toFixed(0)), Number(b[1].toFixed(0))],
      L: Number(lenAt(f).toFixed(0)),
      deg: Number(((thAt(f) * 180) / Math.PI).toFixed(0)),
      tip: tipV[f] ?? 0,
    };
  };

  return {
    kOpen: Number(kAt(0).toFixed(4)),
    kRest: Number(K_REST.toFixed(5)),
    kEnd: Number(K_END.toFixed(5)),
    strokeScreen: Number((STROKE * K_REST).toFixed(2)),
    markScreen: Number((MODEL_MARK_L * K_REST).toFixed(2)),
    markScreenOpen: Number((MODEL_MARK_L * kAt(0)).toFixed(1)),
    personScreen: Number((PERSON_H_L * K_REST).toFixed(2)),
    gazeScreen: Number((GAZE_W * K_REST).toFixed(2)),
    dashScreen: [Number((DASH_ON * K_REST).toFixed(1)), Number((DASH_OFF * K_REST).toFixed(1))],
    marchScreen: Number((MARCH_W * K_REST).toFixed(2)),
    wallInFrame: wallIn,
    handReach: F_REACH,
    handReachDeg: Number(((thAt(F_REACH) * 180) / Math.PI).toFixed(0)),
    wallClose: F_CLOSE,
    turns: Number((thAt(LAST) / TWO_PI).toFixed(2)),
    maxTip,
    maxTipAt: tipV.indexOf(maxTip),
    camDv: Number(camDv.toFixed(2)),
    camDvAt,
    camMax: Number(camMax.toFixed(2)),
    camMin: Number(camMin.toFixed(3)),
    camMinAt,
    people: PEOPLE.map((p) => ({
      i: p.i,
      deg: Number((((p.a - HAND_A0) * 180) / Math.PI).toFixed(0)),
      r: Number(p.r.toFixed(0)),
      rFrac: Number((p.r / WALL.r).toFixed(2)),
      flip: p.flip,
      want: CROSS_AT[p.i],
    })),
    comOffset: Number((Math.hypot(com.x, com.y) / 5).toFixed(1)),
    ringClearOfWall: Number((WALL.r - STROKE / 2 - (Math.max(...PEOPLE.map((p) => p.r)) + RING_R)).toFixed(1)),
    ringClearOfMark: Number((Math.min(...PEOPLE.map((p) => p.r)) - RING_R - MODEL_EDGE_L).toFixed(1)),
    frames: [0, 20, 31, 45, 47, 55, 62, 72, 86, 96, 105, 113, 120, 129, 133, 148].map(at),
    tipV,
  };
})();
