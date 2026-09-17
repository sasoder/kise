import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
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
  camMove,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import { CLAUDE } from "./brandGlyphs";
import { arriveEase } from "./levelUp";

export const FPS = 24;

// ---------------------------------------------------------------------------
// John Charles Beren, clip `JohnCharlesBeren_Experience`, cut `LiveLoop`:
// (context: "you're picturing this...")
// "very, very organic, like, live loop of, like, an individual model, like,
//  getting an experience and, like, live-updating on the spot and learning
//  from that."
//
// DURATION. The composition starts at SRT 65.959 s, so every beat is
//   frame = round((t - 65.959) * 24)
//     very f0 · very f11 · organic f13 · like f30 · live f35 · loop f44 ·
//     of f52 · like f59 · an f61 · individual f65 · model f74 · like f84 ·
//     getting f87 · an f93 · experience f97 · and f104 · like f111 ·
//     live f114 · updating f121 · on f129 · the f133 · spot f135 · and f140 ·
//     learning f143 · from f147 · that f151 · next word "and" f157
// Speech therefore runs f0..157 and the set's 16-frame tail holds the resolved
// state: DURATION = 157 + 16 = 173.
export const DURATION = 173;

// ---------------------------------------------------------------------------
// V2 — THE DENSITY PASS. The first render resolved on a faint thin ring, a
// small dot and two or three specks, and read empty against cut 1's resolved
// frame (a full 6-station wheel with ~500 dots on it). Nothing about the
// mechanism or the timing of a single landing changed; four things did.
//
//   1. SCALE. The loop's nominal radius is 215 world px, not 300, and its
//      deformation +-18, not +-26 — the same picture seen CLOSER. The resting
//      camera is solved to k 1.900 (was 1.150), so the loop's nominal box
//      spans 2 * 215 * 1.900 = 817 screen px (the deformed extreme spans 885)
//      where it used to span 690. The core and the dots keep their WORLD size
//      and therefore GROW on screen exactly as much: the core reads 41.8
//      screen px across (was 25.3) and a rider 20.9 (was 12.6), which is cut
//      1's own dot at cut 1's own zoom.
//   2. THE LOOP IS INK. It is drawn at OP 1.0, not 0.78, at 6.0 screen px.
//      The dark traffic is GONE: white packets on a white line at the same
//      opacity were the reason the line had to sit a rung down in the first
//      place, and at 3 screen px over a 6 px line they were invisible anyway.
//      The experiences ARE the traffic now.
//   3. THE EXPERIENCES ARE A STREAM. From f50 they cross the left frame edge
//      continuously and RIDE the loop clockwise instead of arriving one at a
//      time: 7 are on the line at f70, 9 at f100, 8 at f140 and 8 at f172,
//      spaced by hashed gaps and each drifting +-3 world px across the line.
//      A rider runs ~1.1 turns at the steady state before its peel.
//   4. THE UPDATE IS SEEN. A peel is an 18-frame spiral into the core on
//      arriveEase, and the core answers with a TICK: its area steps up and
//      its radius overshoots that new rest by 14% and eases back over 6
//      frames. No flash, no ring.
//
// ---------------------------------------------------------------------------
// V3 — THE MODEL IS THE MARK. The individual model is no longer a dot: it is
// the CLAUDE mark, in orange, drawn as inline paths off `brandGlyphs.CLAUDE`
// on its 24-unit em box (fill-rule evenodd, `iconShadow(k)`, never an <image>,
// which races frame capture). Nothing else changed — the draw, the stream, the
// peel timing, the absorption ticks, the pin on "spot" and the camera are all
// untouched. Three consequences, and only three:
//
//   * SIZE. The em box is MARK_EM = 72 world px at the opening rest size,
//     i.e. 136.8 screen px at K_REST 1.900 and 244.8 at the opening k 3.400.
//     72 was kept over the 60 fallback: at 60 the mark opens at 204 px and
//     rests at 114, and the starburst's thirteen arms — each about a twelfth
//     of the box across — stop reading as Claude's mark and start reading as a
//     generic asterisk. At 72 the arms are legible on the opening frame AND on
//     the resolved one, and 245 px is a quarter of the 1080 frame with the
//     model alone in it, which is the picture gesture 1 asks for.
//   * GROWTH. `coreScale` is unchanged — the same area ledger, the same +13%
//     first, +5% each, cap 1.9x area, the same 14% tick rising over three
//     frames into the landing and easing back over six — and it now scales the
//     GLYPH instead of a radius. The em box therefore runs 72 -> 104 world px
//     (198 screen px at rest on the last frame, tick included). Breath, the
//     micro-drift and the shrug on the second "very" are the same numbers,
//     applied as one transform about the box's centre (12, 12).
//   * THE RIDERS MEET ITS EDGE. A peel's spiral now ends at `markEdge(land)` —
//     the em box's half-width carried by the same ledger, 36 world px at rest
//     and up to 52 at the cap — instead of the old 12 px core edge, and the
//     dot shrinks away THERE, on the arms, not at the centre. The spiral is
//     174..210 world px long instead of 232, so every peel runs slightly
//     slower than V2 and stays under the 42 screen px/frame cap.
//
// Z-ORDER: the mark is the LAST element in the world SVG, over the loop, the
// heads and every rider. It is never crossed: at its largest the bounding
// circle is 52 world px and the loop's own minimum radius over every frame and
// every angle (the wobble and breath at their worst, minus half the stroke,
// minus the model's drift) leaves a measured MINIMUM CLEARANCE of 143.5 world
// px = 273 screen px at the resting zoom (`STATS.markLoopClearance`).
//
// ---------------------------------------------------------------------------
// SOUND-OFF READING TEST — one sentence:
//   "one model alone; a loop draws around it; experiences pour in and ride it,
//    and one after another peels in and changes the model on the spot."
//
// VOCABULARY, fixed, and the same as the clip's other cut (MillionsOfYears):
//   the model      = the CLAUDE mark at world (540, 960), FILLED in the core's
//                    own tone on a 72 world px em box: ACCENT_DEEP at rest,
//                    ACCENT when lit, with `iconShadow(k)` under it. It is the
//                    top of the z-order and the only mark in the piece.
//   an experience  = ONE solid orange dot at DOT_RADIUS, ACCENT.
//   the loop       = ONE closed white ink line at the set's one stroke weight,
//                    at FULL opacity, whose path is ORGANIC: a circle of
//                    radius 215 world px deformed by 18 world px of amplitude
//                    over three harmonics, with the phases ROTATING and the
//                    radius breathing 1.2% on a ~101-frame sine. It is never a
//                    stiff circle and it is never still — the phase runs from
//                    f0, before the line is drawn at all.
// No text, no arrows, no icons, no crowd, no second loop, no glow ring, no
// counter. Orange means "the model and its experiences" and nothing else.
//
// LOOP PATH, exactly. Let w = 0.6 deg/frame = 0.010472 rad/frame:
//   dev(th, f) = 0.85 sin(2 th - w f + 0.9)
//              + 0.80 sin(3 th + 0.69 w f + 2.6)
//              + 0.50 sin(5 th - 1.32 w f + 5.1)
//   r(th, f)   = 215 * (1 + 0.012 sin(0.062 f + 1.1)) + (18 / 2.15) dev(th, f)
//   Every harmonic is a whole number of cycles round the loop, so there is no
//   seam at th = pi however far the phases have run; the amplitudes are
//   unequal and the three phases advance at DIFFERENT rates (one of them
//   backwards), so the outline is lopsided at every instant and morphs instead
//   of merely rotating. Arc length is tabulated per frame over 360 samples and
//   every head and rider is parametrised by arc length off that table. The
//   circumference is 1351 world px (2 pi 215), 1345 once the deformation's own
//   wiggle is measured along it.
//
// ---------------------------------------------------------------------------
// GESTURES — the word each lands on and the frames it runs over. One continuous
// motion; the words are inflections. Nothing in the piece is outside this list.
//
//  1. f0-f30  "very, very        THE ONE. The model alone, breathing on
//             organic" (f0/f11/  breath() and drifting +-4 world px on two
//             f13)               hashed sines — the organic thing before
//                                anything else exists. It fills the frame at
//                                f0: the camera opens at k 3.400, where the
//                                mark is 245 screen px across, and is already
//                                easing out (k 3.400 -> 2.420). On the SECOND
//                                "very" (f11) the drift amplitude doubles for
//                                20 frames, so that "very" is felt rather than
//                                merely said.
//  2. f15-f50 "like live loop"   THE LOOP DRAWS. Two heads leave one point
//             (like f30,         below-right of the model (th = pi/4) and
//             live f35,          sweep opposite ways round the living path,
//             loop f44)          arc-length parametrised and speed-capped
//                                against the camera, closing at the top-left
//                                point at f50 — two frames before "of" (f52).
//                                The path already breathes and rotates as it
//                                is drawn. The camera's pull-back
//                                (k 2.420 -> 1.700, f18-f44) runs underneath
//                                it, so the loop's far side arrives in frame
//                                as the heads reach it. TWO heads, still: see
//                                DEVIATIONS for the arithmetic at the new
//                                scale.
//  3. f46-f84 "of like an        THE INDIVIDUAL. The camera creeps IN
//             individual model"  (k 1.700 -> 2.030, f46-f62, damped so it
//             (f65/f74)          lands at f62, three frames before the word)
//                                and the model's breath deepens for 12 frames;
//                                it holds through "model". The stream is
//                                already feeding the line behind the word —
//                                the loop is taken, not dead — but the camera
//                                is on the one thing at its centre.
//  4. f50-f97 "getting an        THE STREAM, AND THE FIRST PEEL. Experiences
//             experience"        cross the left frame edge from f50 — the
//             (f87/f97)          frame the loop closes, never before it — join
//                                the loop tangentially along its upper-left
//                                arc (th 1.15 pi .. 1.55 pi) and ride it
//                                CLOCKWISE on the living path, bobbing +-3
//                                world px across the line. The first join is
//                                f59 and seven are riding by f70. The first
//                                peels at f79, spirals inward over 18
//                                frames and is swallowed by the model on
//                                "experience" (f97): the dot shrinks into the
//                                MARK'S EDGE over its last 6 frames — onto the
//                                arms of the starburst, never into a centre it
//                                would have to pass through — the mark's area
//                                steps up 13% (em box +6.3%) with a 14% tick
//                                on top that eases back over 6 frames, and its
//                                tone runs ACCENT_DEEP -> ACCENT over 6
//                                frames. That tone change IS the update.
//  5. f101-f140 "live-updating   THE UPDATES. A peel lands every ~9 frames
//             on the spot"       (hashed +-2) from f110. Each is absorbed the
//             (f114/f121/f135)   same way and each ticks the mark: area +5%,
//                                capped at 1.9x area (1.38x the em box), and a
//                                tone flick to full ACCENT decaying back over
//                                8 frames to a rest level that itself climbs
//                                (0.55 after the first, +0.04 each, ceiling
//                                0.70). "On the spot" is each absorption,
//                                never a timer. The core's own drift eases to
//                                zero across f135-f145 — pinned, updated. The
//                                camera releases into one eased pull-back to
//                                the resolved zoom over f118-f150.
//  6. f140-f173 "and learning    THE CYCLE. The loop runs: the stream keeps
//             from that" (f143)  entering, 8 dots are riding on the last
//                                frame, two more are spiralling in, the path
//                                keeps rotating and breathing, the core holds
//                                its size and stays lit between flicks, and
//                                the camera keeps a decaying drift so no frame
//                                is ever static. Resolved picture: one live
//                                organic loop, full of experiences, with a lit
//                                model at its centre being fed.
//
// ---------------------------------------------------------------------------
// THE DENSITY RULE. 6-9 dots are riding the loop at every frame from f70 to
// the last, and they are never evenly spaced. Both halves of that are
// arithmetic, not decoration:
//
//   * POPULATION = ride duration / peel period. The peel period is the word's,
//     ~9 frames; the steady ride is RIDE_SS = 71 frames, so 71 / 9 = 7.9 dots
//     are on the line at any moment once the stream is running. Measured, over
//     every frame from f70 to the last: never fewer than 7, never more than 9.
//     f70 7 · f100 9 · f140 8 · f172 8. Two or three more are on the approach
//     or in the spiral at any of those frames (visible totals 9 · 11 · 12 · 11).
//   * FILLING IT BY f70. A dot cannot be on the line before the loop closes
//     (f50) — LOOP_OPEN is f59, which also leaves its approach room to be
//     off-frame until f50 — and the first peel is fixed on "experience" (f97),
//     so the first cohort CANNOT have ridden long: their ride durations ramp
//     RIDE_SS * (1 - 0.75 exp(-i / 2.6)) from 18 frames to 71, which puts
//     seven joins between f59 and f68. From there the ramp is spent and the
//     joins are one per peel period.
//   * SPACING. Two dots are separated on the line by the gap between their
//     JOIN frames (they travel at one speed) plus the gap between their join
//     ANGLES, which is hashed over 0.20 of a turn (0.08 for the first cohort,
//     which joins on the left of the arc so that its approach is short enough
//     to stay off-frame until f50). By f100 the joins already span 39 frames
//     (0.63 of a turn) and by f140 more than a full turn, so the riders wrap
//     and cover the whole line. The early cohort is the tightest: at f70 seven
//     dots occupy ~0.3 of a turn on the upper-left, which is the stream
//     arriving, and is the picture the words describe.
//
// ---------------------------------------------------------------------------
// LIVENESS — mechanisms, not gestures. None is on a word and none ever stops,
// so no 12-frame window of the piece is still:
//   * the loop's wobble phase, 0.6 deg/frame, from f0 to the last frame, and
//     its 1.2% radius breath on a ~101-frame sine.
//   * the model's breath() and its micro-drift (the drift alone stops on
//     "spot", by which time the flicks have taken over).
//   * 6-9 riders running the loop at ~40 screen px/frame, each bobbing across
//     the line on its own hashed sine.
//   * the stream: a dot crosses the frame edge every ~9 frames, and one is
//     always on the approach or in the spiral.
//   * the grid's parallax and its own -0.3 px/frame drift.
//   * the camera never parks: four glides and a drift that is still running
//     when the piece ends.
//
// DEPTH. Everything here is foreground: one loop, one core, a dozen dots. There
// is no ladder to climb — dots are SOLID (OP_UNREAD_DOT = 1.0) and carry their
// state in TONE, and the ink is ONE rung, OP_FG = 1.00. The V1 render put the
// loop at 0.78 so that white packets running on it could be seen at 1.00; the
// packets are gone and the line took its opacity back.
//
// STROKE ARITHMETIC. One weight for the one line: SCREEN_OUTLINE = 6.0 screen
// px at the resolved camera, so STROKE = 6.0 / K_REST = 3.158 world px. K_REST
// is SOLVED (secant on the last segment's target) so the damped camera reads
// exactly 1.900 on the last frame. The resolved ink then spans
// 2 * (215 + 18) * 1.900 = 885 screen px, centred on screen y 835: screen y
// 393..1278 against the 300..1370 limit, and 885 px wide inside 1080 with 97 px
// of side margin. A rider sitting on the outer edge of the line reaches screen
// y 382..1289 and x 87..993, still inside.
//
// ---------------------------------------------------------------------------
// CAMERA — its own keyed track through camMove (one key per frame on an eased
// curve, cy taken off the eased k), damped by runCamera. c is constant at 960:
// the composition is radially symmetric about the model, so the ink centre IS
// the model at every frame and cy = 960 + CAM_LIFT / k puts it on screen y 835.
//
// Targets, and the DAMPED value the camera actually reads:
//   f0-f18     k 3.400 -> 2.420  warp 1.00  the opening ease-out: the model
//                                           alone and 75 screen px across,
//                                           already moving at f0. Eighteen
//                                           frames, not fourteen: the shorter
//                                           ramp put |dv| at 2.92 against the
//                                           set's 2.2.
//   f18-f44    k 2.420 -> 1.700  warp 0.80  THE PULL-BACK, under the draw: the
//                                           loop's far side enters frame as the
//                                           heads reach it
//   f46-f62    k 1.700 -> 2.030  warp 0.80  THE CREEP IN, landing 3 f before
//                                           "individual" (f65) and holding
//                                           through "model" (f74)
//   f62-f118   k 2.030 -> 1.995  warp 0.45  the creep's own direction, decaying
//   f118-f150  k 1.995 -> solved warp 0.85  THE RELEASE to the resolved zoom
//   f150-f221  k       -> -0.050 warp 0.50  a drift still running at the last
//                                           frame, so nothing ever parks
//
// Damped, measured: f0 3.400 · f18 2.596 · f30 2.179 · f44 1.750 · f50 1.726 ·
//         f62 1.975 · f74 2.017 · f100 1.999 · f118 1.995 · f135 1.964 ·
//         f150 1.929 · f172 1.900 (= K_REST, solved).
// AUDIT, on the four cardinal points of the loop and the core, sway included:
// the slowest frame of the whole piece moves 0.294 screen px (the "parked"
// floor is 0.15) and the largest frame-to-frame change in that speed is 1.996
// screen px/f^2 against the set's 2.2. The fastest thing on screen is a rider,
// at 45.1 screen px/frame on the approach at f47 — its WORLD speed is capped at
// HEAD_CAP / k(f) = 42 screen px/frame and the remaining 3 is the camera's own
// motion under it, which is how the set measures every cut.
//
// ---------------------------------------------------------------------------
// DEVIATIONS from the brief, with the arithmetic.
//
//   * THE LOOP IS STILL DRAWN BY TWO HEADS. The brief asked the question and
//     the answer did not change. At the new radius the circumference is
//     2 pi 215 = 1351 world px, and at the resting k of 1.900 that is 2567
//     screen px; at the set's 42 screen px/frame head cap one head needs 61
//     frames, and the draw has f21..f50. Even at the loosest zoom the draw ever
//     sees (k 1.700, at f44) one head needs 1351 * 1.700 / 42 = 55 frames. Two
//     heads leaving the same point below-right of the model and meeting at the
//     top-left need 672 world px each, and the integral of 42 / k(f) over the
//     draw window affords that from f15 — SOLVED, as the latest start frame
//     that still closes the line by f50 (the heads then run 0.2% under the cap
//     to land the meeting exactly on f50). f15 is two frames past "organic"
//     (f13), so the model is alone for every frame of "very, very organic",
//     and the line is 84% closed on "loop" (f44).
//     One of the two heads therefore runs anticlockwise; the brief's
//     "clockwise" is kept for everything that travels ON the finished loop.
//
//   * THE CREEP-IN LANDS AT k 2.030, NOT 1.850. The brief's camera table wants
//     the release at f118-f150 to be a readable move to the resolved k; from
//     1.850 to 1.900 it is +2.7% over 32 frames, i.e. under 0.1% per frame,
//     which the set calls a hesitation and says to drop. The creep therefore
//     goes PAST the resting zoom, as it did at the old scale (1.06 -> 1.245 ->
//     1.15, exactly the shape, scaled), and the release is a -6.4% pull-back
//     that reads. Nothing leaves the band at the tightest frame: at k 2.030
//     the deformed loop spans 946 screen px and the riders on its outer edge
//     reach screen y 344..1326.
//
//   * A PEEL SPIRALS IN OVER 18 FRAMES, NOT 8, AND ITS SWEEP IS 0.26 pi.
//     The spiral runs from the line (r ~ 233) to the MARK's edge (r 36..52 —
//     `markEdge(land)`; it was the dot core's r 12 before V3): 174..210
//     world px of path. On arriveEase the cruise is 1.3x the mean, so 8 frames
//     would cruise at 232 / 8 * 1.3 = 38 world px/frame = 75 screen px at the
//     resting zoom — nearly twice the set's 42 px/frame cap, and a 21 px dot
//     moving three and a half of its own diameters per frame strobes. The
//     sweep had to come down with it: the outer end of the spiral carries the
//     angular travel at r 233, so a 0.42 pi sweep peaks at 51 screen px/frame
//     even over 18 frames. At 0.26 pi over 18 the whole route peaks at 45.
//     The LANDING frames are untouched, which is what the brief protects: the
//     swallow still completes on "experience" (f97) and on every ~9-frame beat
//     after f110. The spiral is also the half of the gesture a viewer actually
//     reads, so the longer one is the better one.
//
//   * A DOT RIDES ~1.1 TURNS AT THE STEADY STATE, NOT 1.3. The two numbers the
//     brief fixes — 6-9 riding, one peel per ~9 frames — pin the ride duration
//     to 9 * (6..9) = 54..81 frames. 1.3 turns is 1757 world px, and at the
//     cap-bound ~21 world px/frame that is 84 frames, i.e. 9.3 riders: over
//     the band. RIDE_SS is set at 71 frames (1.05-1.25 turns once the hashed
//     jitter is in, 0.99 averaged over the ramp as well) so the population
//     sits at 7.9 and the measured counts stay 7-9.
//
//   * THE STREAM CROSSES THE FRAME EDGE FROM f50, NOT f55. The first cohort
//     has to be ON the line by f59-f68 to make seven riders by f70 (see THE
//     DENSITY RULE), and an approach is 8-10 frames from a spawn 90-150 world
//     px beyond the edge. The earliest crossing therefore falls on f50, the
//     frame the loop closes — never before it, which is the rule that matters:
//     the model is alone until the line exists. Solved, per dot, and printed
//     in STATS.expVisible: 54 52 54 50 57 57 60 73 75 ...
//     The approach is walked by ARC LENGTH off a 48-sample table, not by the
//     Bezier's own parameter, which ran 1.4x the mean through the middle of
//     the curve and put a dot over the ceiling at 55 screen px/frame.
//
//   * EXPERIENCES ENTER AT A BAND-SAFE HEIGHT (world y 730..1190; at the
//     resolved camera that is screen y 398..1272, inside the 300..1370 limit).
//     They spawn at world x 90..150, off-frame at every zoom the piece ever
//     uses after the draw, whose loosest left edge is world x 226 at k 1.726.
//
//   * THE MARK IS FILLED, NOT STROKED. `brandGlyphs` draws every mark white and
//     filled, and this one is filled in the core's tone instead: an outlined
//     or two-tone treatment would be a second ink weight in a piece that has
//     exactly one, and the mark IS the orange thing the riders feed.
//
//   * THE CORE'S REST TONE CLIMBS. Gesture 5 asks for a flick DEEP -> ACCENT ->
//     DEEP and gesture 6 for a core that "stays ACCENT between flicks"; a
//     single rest level cannot be both. The rest level therefore RISES with the
//     updates — 0 before the first, 0.55 after it, +0.04 per absorption to a
//     ceiling of 0.70 — and each absorption flicks the core to full ACCENT and
//     decays back to that rest over 8 frames.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: an experience, and a lit model
  accentDeep: z.string(), // deep: the model before it has been updated
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
    very: z.number(),
    very2: z.number(),
    organic: z.number(),
    live: z.number(),
    loop: z.number(),
    of: z.number(),
    individual: z.number(),
    model: z.number(),
    getting: z.number(),
    experience: z.number(),
    updating: z.number(),
    spot: z.number(),
    learning: z.number(),
    end: z.number(), // next word "and"; tail to 173
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
    very: 0,
    very2: 11,
    organic: 13,
    live: 35,
    loop: 44,
    of: 52,
    individual: 65,
    model: 74,
    getting: 87,
    experience: 97,
    updating: 121,
    spot: 135,
    learning: 143,
    end: 157,
  },
});

const WORLD_W = 1080;
const WORLD_H = 1920;
const CX = 540;
const CORE = { x: CX, y: 960 };

// One rung. The loop is ink and the dots are solid; nothing in this cut sits
// behind anything else.
const OP_FG = 1.0;

// ---------------------------------------------------------------------------
// THE CAMERA.
// ---------------------------------------------------------------------------
const K_REST_TARGET = 1.9;
const LAST = DURATION - 1;
const C_FIXED = CORE.y;

type Seg = { f0: number; f1: number; k0: number; k1: number; warp: number };

const segsFor = (kEnd: number): Seg[] => [
  { f0: 0, f1: 18, k0: 3.4, k1: 2.42, warp: 1.0 },
  { f0: 18, f1: 44, k0: 2.42, k1: 1.7, warp: 0.8 },
  { f0: 46, f1: 62, k0: 1.7, k1: 2.03, warp: 0.8 },
  { f0: 62, f1: 118, k0: 2.03, k1: 1.995, warp: 0.45 },
  { f0: 118, f1: 150, k0: 1.995, k1: kEnd, warp: 0.85 },
  { f0: 150, f1: DURATION + 48, k0: kEnd, k1: kEnd - 0.05, warp: 0.5 },
];

const trackOf = (segs: Seg[]) => {
  const F: number[] = [0];
  const K: number[] = [segs[0].k0];
  const CY: number[] = [C_FIXED + CAM_LIFT / segs[0].k0];
  for (const s of segs) {
    const m = camMove({ ...s, c0: C_FIXED, c1: C_FIXED });
    for (let i = 0; i < m.F.length; i++) {
      if (m.F[i] <= F[F.length - 1]) continue;
      F.push(m.F[i]);
      K.push(m.K[i]);
      CY.push(m.CY[i]);
    }
  }
  return { F, K, CY };
};

const kAtLast = (kEnd: number) => {
  const t = trackOf(segsFor(kEnd));
  return runCamera(LAST, t.F, t.CY, t.K).k;
};
const K_END = (() => {
  const a = 1.8;
  const b = 2.05;
  const fa = kAtLast(a);
  const fb = kAtLast(b);
  return a + ((K_REST_TARGET - fa) * (b - a)) / (fb - fa);
})();
/** The zoom every weight in the piece is written against. */
const K_REST = kAtLast(K_END);

const CAM = trackOf(segsFor(K_END));

const CAM_AT_F: { cy: number; k: number }[] = (() => {
  const out: { cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    out.push({ cy: c.cy + sway(f).dy, k: c.k });
  }
  return out;
})();
const clampF = (f: number) => Math.max(0, Math.min(DURATION, Math.round(f)));
const kAt = (f: number) => CAM_AT_F[clampF(f)].k;

// ---------------------------------------------------------------------------
// THE WEIGHTS, in SCREEN px at the resting zoom.
// ---------------------------------------------------------------------------
const SCREEN_OUTLINE = 6.0;
const STROKE = SCREEN_OUTLINE / K_REST;
const DOT_R = DOT_RADIUS;
/** The mark's own shadow opacity. The per-icon shadow is the same shape on the
 *  mark as on everything else -- 2 px down, 3 px blur, in SCREEN px at every
 *  camera k -- but the mark is a big FILLED shape where the rings, the lanes
 *  and the icons are 6 px strokes, so the identical filter lays down one large
 *  contiguous block of shadow instead of a thin line of it and reads as a
 *  harsher, heavier shadow. Measured against a reference ink element's darkest
 *  shadow pixel and lowered until the two match. */
const MARK_SHADOW_OPACITY = 0.27;

/** The model's em box, in world px, at the opening rest size (scale 1). The
 *  mark is drawn on brandGlyphs' 24-unit box, so its scale is MARK_EM / 24. */
const MARK_EM = 72;
/** The mark's bounding radius: half the em box, i.e. where the arms of the
 *  starburst reach. A rider's spiral ends HERE, not at the centre. */
const MARK_R0 = MARK_EM / 2;
const HEAD_CAP = 42; // screen px/frame; the set's ceiling is 45

// ---------------------------------------------------------------------------
// THE LOOP, as a living path, and its arc-length table.
// ---------------------------------------------------------------------------
const R_LOOP = 215;
const WOB_AMP = 18; // world px, peak
// Three low harmonics, unequal, each drifting at its OWN rate: 2 cycles round
// the loop at full weight, 3 at 0.62 and 5 at 0.34, so the outline is lopsided
// at every instant and never repeats its own shape. The slowest phase advances
// the brief's 0.6 deg/frame; the other two are deliberately off it (0.41 and
// 0.79 deg/frame, one of them the other way) so the deformation MORPHS rather
// than merely rotating.
const WOB_PEAK = 0.85 + 0.8 + 0.5;
const WOB_SCALE = WOB_AMP / WOB_PEAK;
const LOOP_ROT = (0.6 * Math.PI) / 180; // radians of phase per frame, harmonic 1
const LOOP_BREATHE = 0.012;

const loopDev = (th: number, f: number) =>
  0.85 * Math.sin(2 * th - LOOP_ROT * f + 0.9) +
  0.8 * Math.sin(3 * th + 0.69 * LOOP_ROT * f + 2.6) +
  0.5 * Math.sin(5 * th - 1.32 * LOOP_ROT * f + 5.1);

const loopR = (th: number, f: number) =>
  R_LOOP * (1 + LOOP_BREATHE * Math.sin(f * 0.062 + 1.1)) + WOB_SCALE * loopDev(th, f);

const loopPt = (th: number, f: number) => {
  const r = loopR(th, f);
  return { x: CORE.x + Math.cos(th) * r, y: CORE.y + Math.sin(th) * r };
};

const NS = 360;
const TWO_PI = Math.PI * 2;
const LOOP_TAB: Float64Array[] = (() => {
  const out: Float64Array[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const tab = new Float64Array(NS + 1);
    let prev = loopPt(0, f);
    for (let i = 1; i <= NS; i++) {
      const p = loopPt((i * TWO_PI) / NS, f);
      tab[i] = tab[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y);
      prev = p;
    }
    out.push(tab);
  }
  return out;
})();
const loopLen = (f: number) => LOOP_TAB[clampF(f)][NS];

/** Arc length from th = 0 to `th`, on frame `f`'s path. */
const sAtTheta = (f: number, th: number) => {
  const tab = LOOP_TAB[clampF(f)];
  let x = th % TWO_PI;
  if (x < 0) x += TWO_PI;
  const g = (x * NS) / TWO_PI;
  const i = Math.min(NS - 1, Math.floor(g));
  return tab[i] + (tab[i + 1] - tab[i]) * (g - i);
};

/** The angle at arc length `s`, wrapped, on frame `f`'s path. */
const thetaAtS = (f: number, s: number) => {
  const tab = LOOP_TAB[clampF(f)];
  const len = tab[NS];
  let x = s % len;
  if (x < 0) x += len;
  let lo = 0;
  let hi = NS;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (tab[m] <= x) lo = m;
    else hi = m;
  }
  const t = (x - tab[lo]) / Math.max(1e-6, tab[hi] - tab[lo]);
  return ((lo + t) * TWO_PI) / NS;
};

// ---------------------------------------------------------------------------
// THE DRAW. Two heads from th = pi/4 (below-right of the model), opposite ways,
// meeting at th = 5 pi / 4. The distance each has covered is integrated forward
// at min(V_DRAW, HEAD_CAP / k(f)) — so no head is ever over the ceiling however
// tight the camera is — with a taper over the last 15% so the two heads meet
// decelerating instead of stopping dead. The start frame is SOLVED: the latest
// frame from which that integral still reaches half the circumference by f50.
// ---------------------------------------------------------------------------
const DRAW_TH0 = Math.PI / 4;
const DRAW_F1 = 50;
const V_DRAW = 46; // world px/frame nominal; the cap binds for most of the move
const DRAW_TAPER = 0.15;
const DRAW_F0_FLOOR = 14; // the model is alone through "very, very organic" (f0-f13)

const drawRun = (f0: number) => {
  const half = loopLen(DRAW_F1) / 2;
  const s: number[] = new Array(DURATION + 1).fill(0);
  let cur = 0;
  for (let f = f0 + 1; f <= DRAW_F1; f++) {
    const v =
      Math.min(V_DRAW, HEAD_CAP / kAt(f)) *
      (1 - 0.55 * smoothstep((cur / half - (1 - DRAW_TAPER)) / DRAW_TAPER));
    cur += v;
    s[f] = cur;
  }
  for (let f = DRAW_F1 + 1; f <= DURATION; f++) s[f] = cur;
  return { s, reach: cur, half };
};

const DRAW = (() => {
  const half = loopLen(DRAW_F1) / 2;
  let f0 = DRAW_F1 - 2;
  let run = drawRun(f0);
  while (run.reach < half && f0 > DRAW_F0_FLOOR) {
    f0 -= 1;
    run = drawRun(f0);
  }
  if (run.reach < half) {
    throw new Error(
      `LiveLoop: the draw cannot close by f${DRAW_F1} from f${DRAW_F0_FLOOR} under the ` +
        `${HEAD_CAP} screen px/frame head cap (reach ${run.reach.toFixed(0)} of ${half.toFixed(0)} ` +
        `world px). Widen the camera earlier or shorten the loop.`,
    );
  }
  // Scaling DOWN only ever lowers a head's speed, so the cap still holds.
  const scale = half / Math.max(1e-6, run.reach);
  return {
    f0,
    half,
    s: run.s.map((v) => Math.min(half, v * scale)),
    scale,
  };
})();

const drawnAt = (f: number) => DRAW.s[clampF(f)];
const drawClosed = (f: number) => drawnAt(f) >= DRAW.half - 1e-6;

// ---------------------------------------------------------------------------
// THE STREAM. Approach (a curve from beyond the left frame edge that meets the
// loop tangentially on its upper-left arc) -> ride (clockwise on the LIVING
// path, so a rider bobs with the loop it is on, plus its own +-3 world px drift
// across the line) -> spiral (a 16-frame inward sweep into the model).
//
// Everything is solved BACKWARDS from the landing, which is the word: the
// spiral is fixed at SPIRAL_DUR frames, the ride duration comes off the ramp
// that fills the loop by f70, and the approach is walked back through the same
// speed cap until the dot is off-frame.
// ---------------------------------------------------------------------------
const JOIN_TH0 = 1.15 * Math.PI; // upper-left arc: the side the stream comes from
const JOIN_TH1 = 1.55 * Math.PI;
const SPIRAL_SWEEP = 0.26 * Math.PI;
const SPIRAL_DUR = 18; // frames; solved against the 42 screen px/f cap
// A rider's spiral ends on the MARK'S EDGE, not at its centre: `markEdge(land)`
// is the em box's half-width carried by the same area ledger that scales the
// glyph, so the bigger the model has grown the sooner a rider meets it.
const ABSORB_DUR = 6; // frames the dot takes to shrink into the core
const V_EXP = 38; // world px/frame nominal; the cap binds throughout
const LOOP_OPEN = 59; // no dot joins before the line closes (f50), with room for its approach
const RIDE_SS = 71; // frames on the line at the steady state -> 71/9 = 7.9 riders
const RIDE_RAMP = 0.75;
const RIDE_TAU = 2.6;
const N_EXP = 20;
const LAND_FIRST = 97; // "experience"
const LAND_SECOND = 110;
const LAND_PERIOD = 9;
const RIDER_BOB = 3; // world px across the line

const landingOf = (i: number) =>
  i === 0
    ? LAND_FIRST
    : i === 1
      ? LAND_SECOND
      : LAND_SECOND + (i - 1) * LAND_PERIOD + Math.round((hash(i, 31) - 0.5) * 4);

const rideFramesOf = (i: number) => {
  const base = RIDE_SS * (1 - RIDE_RAMP * Math.exp(-i / RIDE_TAU));
  const jit = i < 2 ? 0 : (hash(i, 37) - 0.5) * 10;
  return Math.max(12, Math.round(base + jit));
};

// ---------------------------------------------------------------------------
// THE CORE'S STATE. Both its size and its tone are read off the landings, never
// off a timer: the model changes when, and only when, an experience arrives.
//
// The size is an AREA ledger — a swallowed dot adds area, not radius — and on
// top of the new rest radius each absorption puts a TICK: +14% for two frames,
// eased back to the new rest over six. No flash, no ring; the core simply takes
// the thing in.
// ---------------------------------------------------------------------------
const AREA_FIRST = 1.13;
const AREA_EACH = 1.05;
const AREA_CAP = 1.9; // radius x1.378
const AREA_RISE = 5;
const AREA_LEAD = 2; // the area starts stepping just before the landing frame
const BUMP_AMP = 0.14;
const BUMP_RISE = 3; // the tick rises over the three frames INTO the landing...
const BUMP_FALL = 6; // ...peaks exactly on it, and eases back to the new rest
const FLICK_DUR = 8;
const REST_FIRST = 0.55;
const REST_STEP = 0.04;
const REST_CAP = 0.7;
const TONE_RISE = 6;

const coreScale = (f: number) => {
  let a = 1;
  let bump = 0;
  for (let i = 0; i < N_EXP; i++) {
    const land = landingOf(i);
    if (f < land - BUMP_RISE) break;
    if (f < land) {
      // only the tick's lead-in; the area ledger still belongs to the landing
      const dt = f - land;
      bump = Math.max(bump, smoothstep(clamp01((dt + BUMP_RISE) / BUMP_RISE)));
      break;
    }
    const step = i === 0 ? AREA_FIRST : AREA_EACH;
    a = Math.min(
      AREA_CAP,
      a * (1 + (step - 1) * smoothstep(clamp01((f - land + AREA_LEAD) / AREA_RISE))),
    );
    const dt = f - land;
    if (dt <= BUMP_FALL) {
      bump = Math.max(
        bump,
        smoothstep(clamp01((dt + BUMP_RISE) / BUMP_RISE)) * (1 - smoothstep(clamp01(dt / BUMP_FALL))),
      );
    }
  }
  return Math.sqrt(a) * (1 + BUMP_AMP * bump);
};

const coreTone = (f: number) => {
  let rest = 0;
  let flick = 0;
  for (let i = 0; i < N_EXP; i++) {
    const land = landingOf(i);
    if (f < land) break;
    rest = Math.min(REST_CAP, i === 0 ? REST_FIRST : rest + REST_STEP);
    const dt = f - land;
    if (dt <= FLICK_DUR) {
      const rise = i === 0 ? clamp01((dt + 3) / TONE_RISE) : 1;
      flick = Math.max(flick, rise * (1 - smoothstep(dt / FLICK_DUR)));
    }
  }
  if (f >= LAND_FIRST && f < LAND_FIRST + TONE_RISE) {
    rest = REST_FIRST * smoothstep(clamp01((f - LAND_FIRST) / TONE_RISE));
  }
  return clamp01(rest + (1 - rest) * flick);
};

/** The mark's bounding radius on frame `f`: the em box's half-width carried by
 *  the same area ledger that scales the glyph. A rider ends its spiral here. */
const markEdge = (f: number) => MARK_R0 * coreScale(f);

const vExpAt = (f: number) => Math.min(V_EXP, HEAD_CAP / kAt(f));

type Exp = {
  i: number;
  land: number;
  depart: number;
  rideF0: number;
  spiralF0: number;
  spawn: { x: number; y: number };
  ctrl: { x: number; y: number };
  joinTh: number;
  peelTh: number;
  /** the mark's bounding radius on this dot's landing frame */
  edge: number;
  aTab: number[];
  la: number;
  lb: number;
  lc: number;
  len: number;
  /** distance travelled, per frame, from depart to land */
  s: number[];
  bob: number;
};

const APPROACH_SAMPLES = 48;

/** The Bezier PARAMETER at arc length `s` along an approach. */
const uAtApproachS = (e: Exp, s: number) => {
  const tab = e.aTab;
  const n = tab.length - 1;
  const x = Math.max(0, Math.min(tab[n], s));
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (tab[m] <= x) lo = m;
    else hi = m;
  }
  const t = (x - tab[lo]) / Math.max(1e-6, tab[hi] - tab[lo]);
  return (lo + t) / n;
};

/** A point on the approach Bezier at parameter u. */
const bez = (
  P0: { x: number; y: number },
  C: { x: number; y: number },
  P1: { x: number; y: number },
  u: number,
) => {
  const v = 1 - u;
  return {
    x: v * v * P0.x + 2 * v * u * C.x + u * u * P1.x,
    y: v * v * P0.y + 2 * v * u * C.y + u * u * P1.y,
  };
};

const EXPS: Exp[] = Array.from({ length: N_EXP }, (_unused, i) => {
  const land = landingOf(i);
  const spiralF0 = land - SPIRAL_DUR;
  const rideF0 = Math.max(LOOP_OPEN, spiralF0 - rideFramesOf(i));

  // the ride, integrated through the same cap the heads run under
  let lb = 0;
  for (let f = rideF0 + 1; f <= spiralF0; f++) lb += vExpAt(f);

  // The first cohort joins on the LEFT of the arc, where the approach from the
  // frame edge is shortest, so no dot is seen before the line it joins exists.
  const joinSpan = (JOIN_TH1 - JOIN_TH0) * (i < 5 ? 0.38 : 1);
  const joinTh = JOIN_TH0 + hash(i, 32) * joinSpan;
  const peelTh = thetaAtS(spiralF0, sAtTheta(spiralF0, joinTh) + lb);

  // the approach: off-frame left (the loosest left edge the piece ever shows is
  // world x 222, at k 1.700), meeting the loop along its own tangent.
  const jp = loopPt(joinTh, rideF0);
  const tang = { x: -Math.sin(joinTh), y: Math.cos(joinTh) }; // clockwise
  const u = (joinTh - JOIN_TH0) / (JOIN_TH1 - JOIN_TH0);
  const spawn = {
    x: 150 - hash(i, 34) * 60,
    y: Math.max(730, Math.min(1190, jp.y + 150 * (1 - 2 * u) + (hash(i, 35) - 0.5) * 90)),
  };
  const approachLen0 = Math.hypot(jp.x - spawn.x, jp.y - spawn.y);
  const ctrl = {
    x: jp.x - tang.x * approachLen0 * 0.42,
    y: jp.y - tang.y * approachLen0 * 0.42,
  };

  // Arc-length table for the approach: a quadratic Bezier walked at a uniform
  // PARAMETER runs fastest through its middle (measured at 1.4x the mean, i.e.
  // 55 screen px/frame at this zoom), so the dot is parametrised by LENGTH.
  const aTab: number[] = [0];
  let prev = spawn;
  for (let t = 1; t <= APPROACH_SAMPLES; t++) {
    const p = bez(spawn, ctrl, jp, t / APPROACH_SAMPLES);
    aTab.push(aTab[t - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  const la = aTab[APPROACH_SAMPLES];

  // the spiral, sampled on the peel frame's path, ending on the mark's edge
  const edge = markEdge(land);
  const pp = loopPt(peelTh, spiralF0);
  let lc = 0;
  prev = pp;
  const rPeel = loopR(peelTh, spiralF0);
  for (let t = 1; t <= 40; t++) {
    const uu = t / 40;
    const th = peelTh + SPIRAL_SWEEP * uu;
    const r = rPeel + (edge - rPeel) * uu;
    const p = { x: CORE.x + Math.cos(th) * r, y: CORE.y + Math.sin(th) * r };
    lc += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  const len = la + lb + lc;

  const s: number[] = new Array(DURATION + 2).fill(-1);
  // on the line
  if (rideF0 >= 0 && rideF0 <= DURATION + 1) s[rideF0] = la;
  let d = la;
  for (let f = rideF0 + 1; f <= spiralF0; f++) {
    d += vExpAt(f);
    if (f >= 0 && f <= DURATION + 1) s[f] = d;
  }
  // the spiral, on arriveEase so the dot decelerates into the core
  for (let f = spiralF0 + 1; f <= land; f++) {
    if (f >= 0 && f <= DURATION + 1) {
      s[f] = la + lb + lc * arriveEase(clamp01((f - spiralF0) / SPIRAL_DUR));
    }
  }
  // the approach, walked backwards until the dot is at its spawn
  d = la;
  let g = rideF0;
  while (d > 0 && g > -300) {
    d -= vExpAt(g);
    g -= 1;
    if (g >= 0 && g <= DURATION + 1) s[g] = Math.max(0, d);
  }
  const depart = g;

  return {
    i,
    land,
    depart,
    rideF0,
    spiralF0,
    spawn,
    ctrl,
    joinTh,
    peelTh,
    edge,
    aTab,
    la,
    lb,
    lc,
    len,
    s,
    bob: hash(i, 36),
  };
});

/** Where experience `e` is on frame `f`, or null if it is not on the route. */
const expAt = (e: Exp, f: number) => {
  if (f < e.depart || f > e.land) return null;
  const d = f <= e.depart ? 0 : e.s[clampF(f)];
  if (d < 0) return null;
  if (d <= e.la) {
    const jp = loopPt(e.joinTh, f);
    return { p: bez(e.spawn, e.ctrl, jp, uAtApproachS(e, d)), onLoop: false };
  }
  if (d <= e.la + e.lb) {
    const th = thetaAtS(f, sAtTheta(f, e.joinTh) + (d - e.la));
    const r =
      loopR(th, f) + RIDER_BOB * Math.sin(f * (0.13 + 0.09 * hash(e.i, 41)) + e.bob * 6.283);
    return { p: { x: CORE.x + Math.cos(th) * r, y: CORE.y + Math.sin(th) * r }, onLoop: true };
  }
  const u = clamp01((d - e.la - e.lb) / Math.max(1e-6, e.lc));
  const th = e.peelTh + SPIRAL_SWEEP * u;
  const rPeel = loopR(e.peelTh, f);
  const r = rPeel + (e.edge - rPeel) * u;
  return { p: { x: CORE.x + Math.cos(th) * r, y: CORE.y + Math.sin(th) * r }, onLoop: false };
};

// ---------------------------------------------------------------------------
// THE MODEL'S OWN MOTION: breath, and a micro-drift of +-4 world px on two
// hashed sines per axis that DOUBLES for 20 frames on the second "very" and
// eases to nothing across "spot".
// ---------------------------------------------------------------------------
const DRIFT_A = 4;
const SHRUG_F0 = 11;
const SHRUG_F1 = 31;
const PIN_F0 = 135;
const PIN_F1 = 145;
const BREATH_DEEP_F0 = 63;
const BREATH_DEEP_F1 = 75;

const coreDrift = (f: number) => {
  const shrug =
    f < SHRUG_F0 || f > SHRUG_F1 + 6
      ? 1
      : 1 + 1 * smoothstep(clamp01((f - SHRUG_F0) / 3)) * (1 - smoothstep(clamp01((f - SHRUG_F1) / 6)));
  const pin = 1 - smoothstep(clamp01((f - PIN_F0) / (PIN_F1 - PIN_F0)));
  const a = DRIFT_A * shrug * pin;
  return {
    dx: a * (0.62 * Math.sin(f * 0.1913 + 1.7) + 0.38 * Math.sin(f * 0.1117 + 4.1)),
    dy: a * (0.58 * Math.sin(f * 0.1661 + 0.4) + 0.42 * Math.sin(f * 0.0973 + 2.6)),
  };
};

// ---------------------------------------------------------------------------

const LiveLoop: React.FC<Props> = ({
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
  const toRipe = makeTone(accentDeep, accent);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);
  // The mark's own: the same 2/3 screen-px shape, its own opacity, and applied
  // on a group OUTSIDE the mark's scale so the filter is never multiplied by
  // the em scale (MARK_EM/24) or by the breath and growth on top of it.
  const markIcon = iconShadow(k, iconShadowY, iconShadowBlur, MARK_SHADOW_OPACITY);

  // -- the loop --------------------------------------------------------------
  const drawn = drawnAt(frame);
  const closed = drawClosed(frame);
  const s0 = sAtTheta(frame, DRAW_TH0);
  const len = loopLen(frame);

  const arcPath = (sa: number, sb: number) => {
    const steps = Math.max(2, Math.ceil((Math.abs(sb - sa) / len) * NS));
    let d = "";
    for (let t = 0; t <= steps; t++) {
      const p = loopPt(thetaAtS(frame, sa + (sb - sa) * (t / steps)), frame);
      d += `${t === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }
    return d;
  };

  const loopPaths: string[] = [];
  if (closed) {
    loopPaths.push(`${arcPath(s0, s0 + len)}Z`);
  } else if (drawn > 0.5) {
    loopPaths.push(arcPath(s0, s0 + drawn));
    loopPaths.push(arcPath(s0, s0 - drawn));
  }
  const headA = closed || drawn <= 0.5 ? null : loopPt(thetaAtS(frame, s0 + drawn), frame);
  const headB = closed || drawn <= 0.5 ? null : loopPt(thetaAtS(frame, s0 - drawn), frame);

  // -- the stream ------------------------------------------------------------
  type Rider = { key: string; x: number; y: number; r: number };
  const riders: Rider[] = [];
  EXPS.forEach((e) => {
    const at = expAt(e, frame);
    if (!at) return;
    const toGo = e.land - frame;
    const shrink = toGo < ABSORB_DUR ? clamp01(toGo / ABSORB_DUR) : 1;
    if (shrink <= 0.02) return;
    const b = 1 + 0.09 * Math.sin(frame * 0.19 + e.bob * 6.283);
    riders.push({
      key: `e${e.i}`,
      x: at.p.x,
      y: at.p.y,
      r: DOT_R * (0.92 + 0.16 * hash(e.i, 13)) * b * arriveEase(shrink),
    });
  });

  // -- the model -------------------------------------------------------------
  const md = coreDrift(frame);
  const deepen =
    1 +
    0.55 *
      smoothstep(clamp01((frame - BREATH_DEEP_F0) / 4)) *
      (1 - smoothstep(clamp01((frame - BREATH_DEEP_F1) / 6)));
  const markEm = MARK_EM * coreScale(frame) * (1 + (breath(frame, 0.31) - 1) * deepen);
  const coreCol = toRipe(coreTone(frame));

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
        cxRest={CX}
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
            {/* THE LOOP. One closed white ink line at the set's one stroke and
                full opacity, drawn head-led from a point below-right of the
                model and alive from before it exists: the wobble phase runs
                from f0. */}
            {loopPaths.length > 0 ? (
              <g style={{ filter: icon }}>
                {loopPaths.map((d, i) => (
                  <path
                    key={`lp${i}`}
                    d={d}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={OP_FG}
                  />
                ))}
              </g>
            ) : null}

            {/* the two drawing heads, while the line is still open */}
            {headA ? (
              <circle cx={headA.x} cy={headA.y} r={4.5 / k} fill={ink} opacity={OP_FG} />
            ) : null}
            {headB ? (
              <circle cx={headB.x} cy={headB.y} r={4.5 / k} fill={ink} opacity={OP_FG} />
            ) : null}

            {/* the experiences: entering, riding the line, peeling in */}
            {riders.map((r) => (
              <circle
                key={r.key}
                cx={r.x}
                cy={r.y}
                r={r.r}
                fill={accent}
                opacity={dotOpacity * OP_FG}
              />
            ))}

            {/* THE MODEL. The Claude mark, in orange, at the loop's centre,
                from the first frame to the last, and on top of everything:
                inline paths on the 24-unit em box (never an <image>, which
                races frame capture). Breath, drift, the shrug and the growth
                are one transform about the box's centre (12, 12). It changes
                only when an experience arrives. */}
            <g style={{ filter: markIcon }} opacity={dotOpacity * OP_FG}>
              <g
                transform={`translate(${(CORE.x + md.dx).toFixed(3)} ${(CORE.y + md.dy).toFixed(3)}) scale(${(markEm / 24).toFixed(5)}) translate(-12 -12)`}
              >
                {CLAUDE.paths.map((d) => (
                  <path key={d.length} d={d} fill={coreCol} fillRule="evenodd" />
                ))}
              </g>
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default LiveLoop;

// Referenced so the beats object is a real contract and not decoration.
export const BEAT_CHECK = {
  organic: defaultProps.beats.organic,
  loop: defaultProps.beats.loop,
  individual: defaultProps.beats.individual,
  experience: defaultProps.beats.experience,
  spot: defaultProps.beats.spot,
  end: defaultProps.beats.end,
};
export const CAM_AT = (f: number) => runCamera(f, CAM.F, CAM.CY, CAM.K);

/** How many experiences are ON the line at frame `f`, and how many are
 *  anywhere on the route. The density rule is checked against this. */
export const RIDERS_AT = (f: number) => {
  let onLoop = 0;
  let visible = 0;
  for (const e of EXPS) {
    const at = expAt(e, f);
    if (!at) continue;
    visible += 1;
    if (at.onLoop) onLoop += 1;
  }
  return { onLoop, visible };
};

export const RIDER_TRACKS = EXPS.map((e) => ({
  i: e.i,
  at: (f: number) => {
    const r = expAt(e, f);
    if (!r) return null;
    const d = e.s[clampF(f)];
    const phase = d <= e.la ? "approach" : d <= e.la + e.lb ? "ride" : "spiral";
    return { p: r.p, phase };
  },
  rAt: (th: number, f: number) => loopR(th, f),
}));

export const WORLD_INK = {
  core: CORE,
  rLoop: R_LOOP,
  wobAmp: WOB_AMP,
  stroke: STROKE,
};

export const STATS = {
  kStart: Number(CAM.K[0].toFixed(4)),
  kRest: Number(K_REST.toFixed(5)),
  kEnd: Number(K_END.toFixed(5)),
  strokeWorld: Number(STROKE.toFixed(3)),
  strokeScreen: Number((STROKE * K_REST).toFixed(2)),
  dotScreen: Number((2 * DOT_R * K_REST).toFixed(2)),
  markEmWorld: MARK_EM,
  markScreen: Number((MARK_EM * K_REST).toFixed(2)),
  markScreenOpen: Number((MARK_EM * CAM.K[0]).toFixed(2)),
  markScreenLast: Number((MARK_EM * coreScale(DURATION - 1) * K_REST).toFixed(2)),
  markScaleLast: Number(coreScale(DURATION - 1).toFixed(4)),
  markScaleMax: Number(
    Math.max(...Array.from({ length: DURATION + 1 }, (_u, f) => coreScale(f))).toFixed(4),
  ),
  /** The smallest gap, in world px, between the mark's bounding circle and the
   *  loop's own radius, over every frame and every angle of the closed line. */
  markLoopClearance: (() => {
    let min = Infinity;
    for (let f = 0; f <= DURATION; f++) {
      if (!drawClosed(f)) continue;
      const rm = MARK_R0 * coreScale(f) * (1 + 0.05);
      const d = Math.hypot(coreDrift(f).dx, coreDrift(f).dy);
      for (let i = 0; i < NS; i++) {
        const rl = loopR((i * TWO_PI) / NS, f) - STROKE / 2;
        min = Math.min(min, rl - rm - d);
      }
    }
    return Number(min.toFixed(1));
  })(),
  loopLen: Number(loopLen(DRAW_F1).toFixed(1)),
  loopScreenNominal: Number((2 * R_LOOP * K_REST).toFixed(1)),
  loopScreenDia: Number((2 * (R_LOOP + WOB_AMP) * K_REST).toFixed(1)),
  drawF0: DRAW.f0,
  drawScale: Number(DRAW.scale.toFixed(4)),
  drawFracAtLoop: Number((drawnAt(44) / DRAW.half).toFixed(3)),
  drawFracAtOf: Number((drawnAt(52) / DRAW.half).toFixed(3)),
  drawClosedAt: (() => {
    for (let f = DRAW.f0; f <= DURATION; f++) if (drawClosed(f)) return f;
    return -1;
  })(),
  spiralDur: SPIRAL_DUR,
  spiralLen: Number(EXPS[0].lc.toFixed(0)),
  rideTurns: EXPS.map((e) => Number((e.lb / loopLen(e.spiralF0)).toFixed(2))),
  expDepart: EXPS.map((e) => e.depart),
  expRideF0: EXPS.map((e) => e.rideF0),
  expLand: EXPS.map((e) => e.land),
  // the frame each experience first crosses the visible frame edge
  expVisible: EXPS.map((e) => {
    for (let f = Math.max(0, e.depart); f <= e.land; f++) {
      const at = expAt(e, f);
      if (!at) continue;
      const c = CAM_AT_F[clampF(f)];
      const sx = CX + (at.p.x - CX) * c.k;
      if (sx > 0) return f;
    }
    return -1;
  }),
  ridersAt: [70, 100, 140, 172].map((f) => ({ f, ...RIDERS_AT(f) })),
};
